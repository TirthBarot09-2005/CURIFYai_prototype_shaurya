"""
CURIFY AI Navigator — FastAPI Main Application
"""

import json
import logging
import os
import re
import time
from contextlib import asynccontextmanager
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Header, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select
import jwt

from app.models import User, Hospital, LoanApplication, PatientQuery, UnderwritingReport, Blog, engine, init_db, get_procedures, get_base_rates, get_room_rates, get_doctors
from app.nlp_engine import chat_with_patient, generate_underwriting_report, parse_patient_query
from app.ranking_engine import rank_hospitals

load_dotenv()

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-24s | %(levelname)-5s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("curify.api")

# ---------------------------------------------------------------------------
# Hospital data cache
# ---------------------------------------------------------------------------
_hospital_cache: list | None = None
_hospital_cache_ts: float = 0
CACHE_TTL = 300  # 5 minutes


def _get_cached_hospitals(session: Session) -> list:
    global _hospital_cache, _hospital_cache_ts
    now = time.time()
    if _hospital_cache is not None and (now - _hospital_cache_ts) < CACHE_TTL:
        return _hospital_cache
    _hospital_cache = session.exec(select(Hospital)).all()
    _hospital_cache_ts = now
    logger.info("Hospital cache refreshed: %d hospitals", len(_hospital_cache))
    return _hospital_cache


def _invalidate_hospital_cache():
    global _hospital_cache, _hospital_cache_ts
    _hospital_cache = None
    _hospital_cache_ts = 0


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("CURIFY backend started")
    yield
    logger.info("CURIFY backend shutting down")


app = FastAPI(title="CURIFY AI Navigator", version="2.1.0", lifespan=lifespan)

# CORS — use explicit origins from env, fall back to permissive for dev
_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins if _cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global error handler — never crash the server
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, str(exc)[:300])
    return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again."})


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000)
    logger.info("%s %s → %d (%dms)", request.method, request.url.path, response.status_code, elapsed)
    return response


def get_session():
    with Session(engine) as session:
        yield session


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
def get_current_user(authorization: str = Header(None), session: Session = Depends(get_session)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    try:
        # For prototype: decoding without signature verification. 
        # In prod, use jwt.PyJWKClient with Clerk's JWKS endpoint.
        payload = jwt.decode(token, options={"verify_signature": False})
        clerk_id = payload.get("sub")
        if not clerk_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        user = session.exec(select(User).where(User.clerk_user_id == clerk_id)).first()
        
        # Upsert logic: Create user if they don't exist
        if not user:
            email = payload.get("email") or payload.get("email_address")
            name = payload.get("name") or payload.get("full_name")
            
            user = User(
                clerk_user_id=clerk_id,
                email=email,
                name=name
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            logger.info("New user created via upsert: clerk_id=%s", clerk_id)
            
        return user
    except Exception as e:
        logger.error("Auth error: %s", str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")


# ---------------------------------------------------------------------------
# Input sanitization helper
# ---------------------------------------------------------------------------
def _sanitize(text: str | None, max_len: int = 500) -> str:
    if not text:
        return ""
    return re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text.strip()[:max_len])


# ---------------------------------------------------------------------------
# Request Models with validation
# ---------------------------------------------------------------------------
class SearchRequest(BaseModel):
    query: str
    location: str
    budget: Optional[float] = None
    age: Optional[int] = None
    comorbidities: Optional[str] = None
    urgency: Optional[str] = "planned"

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Query cannot be empty")
        if len(v) > 1000:
            raise ValueError("Query too long (max 1000 chars)")
        return v.strip()

    @field_validator("age")
    @classmethod
    def age_valid(cls, v):
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120")
        return v

    @field_validator("budget")
    @classmethod
    def budget_valid(cls, v):
        if v is not None and (v < 0 or v > 100_000_000):
            raise ValueError("Budget must be between 0 and 10 crore")
        return v


class ChatMessage(BaseModel):
    role: str
    content: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v):
        if v not in ("user", "assistant", "system"):
            raise ValueError("Role must be user, assistant, or system")
        return v

    @field_validator("content")
    @classmethod
    def content_valid(cls, v):
        if len(v) > 5000:
            raise ValueError("Message too long")
        return v


class ChatRequest(BaseModel):
    messages: List[ChatMessage]

    @field_validator("messages")
    @classmethod
    def messages_valid(cls, v):
        if not v:
            raise ValueError("Messages cannot be empty")
        if len(v) > 50:
            raise ValueError("Too many messages (max 50)")
        return v


class UnderwriteRequest(BaseModel):
    extracted_procedure: str
    location: Optional[str] = None
    age: Optional[int] = None
    comorbidities: Optional[str] = None
    geo_tier: Optional[str] = "tier2"

    @field_validator("extracted_procedure")
    @classmethod
    def procedure_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Procedure cannot be empty")
        return v.strip()

    @field_validator("age")
    @classmethod
    def age_valid(cls, v):
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120")
        return v

    @field_validator("geo_tier")
    @classmethod
    def tier_valid(cls, v):
        if v and v not in ("metro", "tier2", "tier3"):
            raise ValueError("geo_tier must be metro, tier2, or tier3")
        return v


class LoanApplyRequest(BaseModel):
    patient_name: str
    patient_age: Optional[int] = None
    procedure: str
    hospital_name: str
    hospital_city: str
    estimated_cost_min: int
    estimated_cost_max: int
    loan_amount_requested: int
    ayushman_coverage: Optional[int] = 0
    confidence_score: float = 0.75
    comorbidities: Optional[str] = ""
    risk_flags: Optional[str] = "[]"
    geo_tier: Optional[str] = "tier2"
    lender_id: Optional[str] = None

    @field_validator("patient_name")
    @classmethod
    def name_valid(cls, v):
        if not v or not v.strip():
            raise ValueError("Patient name cannot be empty")
        if len(v) > 200:
            raise ValueError("Name too long")
        return v.strip()

    @field_validator("loan_amount_requested")
    @classmethod
    def loan_valid(cls, v):
        if v <= 0:
            raise ValueError("Loan amount must be positive")
        if v > 50_000_000:
            raise ValueError("Loan amount exceeds maximum (5 crore)")
        return v


class LoanStatusUpdate(BaseModel):
    status: str
    lender_notes: Optional[str] = ""

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        allowed = {"pending", "approved", "conditional", "rejected", "flagged"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


# ---------------------------------------------------------------------------
# Lender matching engine (patient → lender flow)
# ---------------------------------------------------------------------------
MOCK_LENDERS = [
    {"name": "CareFinance", "max_amount": 200000, "interest_rate": 10.5, "min_confidence": 0.70},
    {"name": "MediLoan", "max_amount": 5000000, "interest_rate": 9.5, "min_confidence": 0.75},
    {"name": "HealthCredit", "max_amount": 1000000, "interest_rate": 14.0, "min_confidence": 0.40},
    {"name": "HDFC Health", "max_amount": 2000000, "interest_rate": 10.5, "min_confidence": 0.65},
    {"name": "Bajaj Finserv Health", "max_amount": 2500000, "interest_rate": 9.9, "min_confidence": 0.70},
]


def _match_lenders(loan_amount: int, confidence: float) -> list:
    """Match eligible lenders based on loan amount and confidence score."""
    eligible = []
    
    # Priority matching logic as per requirements
    target_lenders = []
    if loan_amount < 200000:
        target_lenders.append("CareFinance")
    if loan_amount >= 200000:
        target_lenders.append("MediLoan")
    if confidence < 0.7:
        target_lenders.append("HealthCredit")
        
    for lender in MOCK_LENDERS:
        # Check if it's a target lender OR if it matches generally
        is_target = lender["name"] in target_lenders
        if is_target or (loan_amount <= lender["max_amount"] and confidence >= lender["min_confidence"]):
            # EMI calculation: 12-month tenure
            monthly_rate = lender["interest_rate"] / 100 / 12
            tenure_months = 12
            if monthly_rate > 0:
                emi = int(loan_amount * monthly_rate * (1 + monthly_rate) ** tenure_months / ((1 + monthly_rate) ** tenure_months - 1))
            else:
                emi = int(loan_amount / tenure_months)
            
            # Boost probability for target lenders
            prob_boost = 1.1 if is_target else 1.0
            approval_prob = min(1.0, confidence * (1.0 if loan_amount < lender["max_amount"] * 0.5 else 0.85) * prob_boost)
            
            eligible.append({
                "lender_name": lender["name"],
                "interest_rate": lender["interest_rate"],
                "max_amount": lender["max_amount"],
                "emi_estimate_12m": emi,
                "approval_probability": round(approval_prob, 2),
            })
    
    eligible.sort(key=lambda x: x["approval_probability"], reverse=True)
    return eligible


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    # Robustly handle JSON parsing in case of different DB driver behaviors
    def safe_json_load(data):
        if not data: return {}
        if isinstance(data, dict): return data
        try:
            return json.loads(data)
        except:
            return {}

    return {
        "clerk_user_id": user.clerk_user_id, 
        "name": user.name or "",
        "email": user.email,
        "role": user.role,
        "profile_completed": user.profile_completed,
        "patient_data": safe_json_load(user.patient_data),
        "lender_data": safe_json_load(user.lender_data)
    }


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[dict] = None

@app.post("/api/auth/profile")
async def update_profile(request: ProfileUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if request.name:
        user.name = _sanitize(request.name)
    if request.data:
        if user.role == "patient":
            existing = json.loads(user.patient_data) if user.patient_data else {}
            existing.update(request.data)
            user.patient_data = json.dumps(existing)
        elif user.role == "lender":
            existing = json.loads(user.lender_data) if user.lender_data else {}
            existing.update(request.data)
            user.lender_data = json.dumps(existing)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"status": "success"}


class OnboardingRequest(BaseModel):
    role: str
    data: dict
    name: Optional[str] = None

@app.post("/api/onboarding")
async def complete_onboarding(
    request: OnboardingRequest, 
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    if request.role not in ("patient", "lender"):
        raise HTTPException(status_code=400, detail="Invalid role")
    
    if request.name:
        user.name = _sanitize(request.name)
        
    user.role = request.role
    if request.role == "patient":
        user.patient_data = json.dumps(request.data)
    else:
        user.lender_data = json.dumps(request.data)
    
    user.profile_completed = True
    session.add(user)
    session.commit()
    session.refresh(user)
    
    logger.info("Onboarding completed: id=%s role=%s", user.clerk_user_id, user.role)
    return {"status": "success", "profile_completed": True, "role": user.role}


class RoleUpdate(BaseModel):
    role: str

@app.post("/api/auth/role")
async def set_role(request: RoleUpdate, user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    if request.role not in ("patient", "lender"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = request.role
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"clerk_user_id": user.clerk_user_id, "role": user.role}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "curify-intelligence-layer", "version": "2.1.0"}


@app.post("/api/search")
async def patient_search(request: SearchRequest, session: Session = Depends(get_session)):
    try:
        parsed = await parse_patient_query(
            query=_sanitize(request.query, 1000), location=_sanitize(request.location),
            budget=request.budget, age=request.age, comorbidities=_sanitize(request.comorbidities),
        )

        patient_query = PatientQuery(
            raw_query=request.query[:1000], location=request.location, budget=request.budget,
            age=request.age, comorbidities=request.comorbidities,
            extracted_procedure=parsed.get("extracted_procedure"),
            icd10_code=parsed.get("icd10_code"),
            confidence_score=parsed.get("confidence_score"),
            risk_flags=json.dumps(parsed.get("risk_flags", [])),
        )
        session.add(patient_query)
        session.commit()
        session.refresh(patient_query)

        procedure = parsed.get("extracted_procedure", "")
        all_hospitals = _get_cached_hospitals(session)

        matching = []
        for h in all_hospitals:
            procs = get_procedures(h)
            proc_lower = procedure.lower().replace(" ", "_")
            procs_lower = [p.lower().replace(" ", "_") for p in procs]
            if proc_lower in procs_lower:
                matching.append(h)

        if not matching:
            matching = all_hospitals

        location_lower = request.location.lower().strip() if request.location else ""
        city_matches = [h for h in matching if h.city.lower() == location_lower]
        if city_matches:
            matching = city_matches

        parsed_for_ranking = {"extracted_procedure": procedure, "budget": request.budget, "urgency": request.urgency}
        ranked = rank_hospitals(matching, parsed_for_ranking, request.location or "")

        hospital_map = {h.id: h for h in matching}
        for r in ranked:
            h = hospital_map.get(r["hospital_id"])
            if h:
                r["doctors"] = get_doctors(h)
                r["billing_predictability_score"] = h.billing_predictability_score

        logger.info("Search: query='%.50s' procedure=%s results=%d", request.query, procedure, len(ranked))

        return {
            "query_id": patient_query.id,
            "parsed_intent": parsed,
            "results_count": len(ranked),
            "hospitals": ranked,
            "confidence_score": parsed.get("confidence_score", 0.75),
            "possible_reasons": parsed.get("possible_reasons", ""),
            "follow_up_questions": parsed.get("follow_up_questions", []),
            "detected_language": parsed.get("detected_language", "english"),
            "disclaimer": "Decision Support, Not Diagnosis. DPDP Act 2023 compliant.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Search error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = await chat_with_patient(messages)
        return result
    except Exception as e:
        logger.error("Chat error: %s", str(e)[:300])
        return {
            "message": "Sorry, I encountered an issue. Please try again.",
            "auto_fill": {}, "ready_to_search": False, "detected_language": "english",
        }


@app.post("/api/underwrite")
async def lender_underwrite(request: UnderwriteRequest, session: Session = Depends(get_session)):
    try:
        report = await generate_underwriting_report(
            extracted_procedure=_sanitize(request.extracted_procedure),
            location=_sanitize(request.location), age=request.age,
            comorbidities=_sanitize(request.comorbidities), geo_tier=request.geo_tier or "tier2",
        )

        underwriting = UnderwritingReport(
            extracted_procedure=request.extracted_procedure,
            location=request.location, age=request.age,
            comorbidities=request.comorbidities, geo_tier=request.geo_tier or "tier2",
            surgery_cost_min=report["surgery_cost_min"], surgery_cost_max=report["surgery_cost_max"],
            room_cost_min=report["room_cost_min"], room_cost_max=report["room_cost_max"],
            diagnostics_min=report["diagnostics_min"], diagnostics_max=report["diagnostics_max"],
            medicines_min=report["medicines_min"], medicines_max=report["medicines_max"],
            contingency_min=report["contingency_min"], contingency_max=report["contingency_max"],
            total_min=report["total_min"], total_max=report["total_max"],
            estimated_los=report["estimated_los"], geo_adjustment=report["geo_adjustment"],
            comorbidity_uplift=report["comorbidity_uplift"], icu_likelihood=report["icu_likelihood"],
            confidence_score=report["confidence_score"], risk_flags=json.dumps(report["risk_flags"]),
        )
        session.add(underwriting)
        session.commit()
        session.refresh(underwriting)

        # Patient → Lender flow: match eligible lenders
        avg_cost = int((report["total_min"] + report["total_max"]) / 2)
        eligible_lenders = _match_lenders(avg_cost, report["confidence_score"])

        logger.info("Underwrite: procedure=%s total=%d-%d lenders=%d",
                     request.extracted_procedure, report["total_min"], report["total_max"], len(eligible_lenders))

        return {
            "report_id": underwriting.id, "underwriting": report,
            "confidence_score": report["confidence_score"], "risk_flags": report["risk_flags"],
            "eligible_lenders": eligible_lenders,
            "disclaimer": "Pre-underwriting estimate only. DPDP Act 2023 compliant.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Underwrite error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Underwriting failed. Please try again.")


# --- Loan Application Endpoints ---

def _compute_risk_level(confidence: float) -> str:
    """Derive risk level from confidence score."""
    if confidence >= 0.80:
        return "Low"
    elif confidence >= 0.50:
        return "Medium"
    return "High"


def _compute_approval_probability(confidence: float, loan_amount: int) -> float:
    """Derive approval probability from confidence and loan size."""
    base = confidence
    if loan_amount > 1_000_000:
        base *= 0.85
    elif loan_amount > 500_000:
        base *= 0.92
    return round(min(1.0, base), 2)


@app.post("/api/loan/apply")
async def apply_for_loan(request: LoanApplyRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    try:
        funding_gap = request.loan_amount_requested - (request.ayushman_coverage or 0)

        # Intelligent lender matching
        eligible_lenders = _match_lenders(request.loan_amount_requested, request.confidence_score)
        assigned_names = [l["lender_name"] for l in eligible_lenders]
        
        # Try to find a registered lender that matches one of the eligible names
        target_lender_id = None
        for name in assigned_names:
            lender_user = session.exec(
                select(User).where(User.role == "lender").where(User.lender_data.contains(f'"{name}"'))
            ).first()
            if lender_user:
                target_lender_id = lender_user.clerk_user_id
                break
        
        risk_level = _compute_risk_level(request.confidence_score)
        approval_prob = _compute_approval_probability(request.confidence_score, request.loan_amount_requested)

        loan = LoanApplication(
            patient_name=_sanitize(request.patient_name, 200),
            patient_id=user.clerk_user_id,
            patient_age=request.patient_age,
            procedure=_sanitize(request.procedure, 200), hospital_name=_sanitize(request.hospital_name, 200),
            hospital_city=_sanitize(request.hospital_city, 100),
            estimated_cost_min=request.estimated_cost_min, estimated_cost_max=request.estimated_cost_max,
            loan_amount_requested=request.loan_amount_requested,
            ayushman_coverage=request.ayushman_coverage or 0,
            funding_gap=funding_gap,
            confidence_score=request.confidence_score,
            comorbidities=_sanitize(request.comorbidities) or "",
            risk_flags=request.risk_flags or "[]",
            geo_tier=request.geo_tier or "tier2",
            lender_id=target_lender_id,
            status="pending",
        )
        session.add(loan)
        session.commit()
        session.refresh(loan)
        logger.info("Loan created: id=%d patient=%s amount=%d lenders=%s risk=%s",
                     loan.id, loan.patient_name, loan.loan_amount_requested, assigned_names, risk_level)
        return {
            "loan_id": loan.id,
            "status": "pending",
            "risk_level": risk_level,
            "approval_probability": approval_prob,
            "assigned_lenders": assigned_names,
            "eligible_lenders": eligible_lenders,
            "message": f"Loan request sent to {len(assigned_names)} matched lenders.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Loan apply error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail=f"Loan application failed: {str(e)}")


def _serialize_loan(a: LoanApplication) -> dict:
    """Standard serialization for a loan application."""
    risk_level = _compute_risk_level(a.confidence_score)
    approval_prob = _compute_approval_probability(a.confidence_score, a.loan_amount_requested)
    return {
        "id": a.id, "patient_name": a.patient_name, "patient_age": a.patient_age,
        "procedure": a.procedure, "hospital_name": a.hospital_name,
        "hospital_city": a.hospital_city,
        "estimated_cost_min": a.estimated_cost_min, "estimated_cost_max": a.estimated_cost_max,
        "loan_amount_requested": a.loan_amount_requested,
        "ayushman_coverage": a.ayushman_coverage, "funding_gap": a.funding_gap,
        "confidence_score": a.confidence_score, "comorbidities": a.comorbidities,
        "risk_flags": json.loads(a.risk_flags) if a.risk_flags else [],
        "geo_tier": a.geo_tier, "patient_id": a.patient_id, "status": a.status, "lender_notes": a.lender_notes,
        "risk_level": risk_level,
        "approval_probability": approval_prob,
        "source": "curify_recommendation",
        "created_at": a.created_at,
    }


@app.get("/api/loan/applications")
async def get_loan_applications(status: Optional[str] = None, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    try:
        from sqlmodel import or_
        query = select(LoanApplication).where(or_(LoanApplication.lender_id == user.clerk_user_id, LoanApplication.lender_id == None))
        if status:
            query = query.where(LoanApplication.status == status)
        applications = session.exec(query).all()
        return [_serialize_loan(a) for a in applications]
    except Exception as e:
        logger.error("Loan list error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Failed to fetch applications.")


@app.get("/api/loan/my-applications")
async def get_my_loans(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Fetch loan applications submitted by the current patient."""
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access their loan history")
    
    statement = select(LoanApplication).where(LoanApplication.patient_id == user.clerk_user_id)
    results = session.exec(statement).all()
    return [_serialize_loan(r) for r in results]


@app.get("/api/loan/all")
async def get_all_loan_applications(session: Session = Depends(get_session)):
    """Get all loan applications (admin/demo view)."""
    try:
        applications = session.exec(select(LoanApplication).order_by(LoanApplication.id.desc())).all()
        return [_serialize_loan(a) for a in applications]
    except Exception as e:
        logger.error("Loan all error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Failed to fetch all applications.")


@app.get("/api/loan/by-lender/{lender_name}")
async def get_loans_by_lender_name(lender_name: str, session: Session = Depends(get_session)):
    """Get loans assigned to a specific lender by name (for demo matching)."""
    try:
        # For the prototype, all loans are visible to all lenders
        # In production, this would filter by actual lender assignment
        applications = session.exec(select(LoanApplication).order_by(LoanApplication.id.desc())).all()
        
        # Filter by matching eligibility
        result = []
        for a in applications:
            eligible = _match_lenders(a.loan_amount_requested, a.confidence_score)
            assigned_names = [l["lender_name"] for l in eligible]
            if lender_name in assigned_names:
                loan_data = _serialize_loan(a)
                loan_data["assigned_lenders"] = assigned_names
                result.append(loan_data)
        
        return result
    except Exception as e:
        logger.error("Loan by-lender error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Failed to fetch lender applications.")


@app.patch("/api/loan/{loan_id}/status")
async def update_loan_status(loan_id: int, update: LoanStatusUpdate, session: Session = Depends(get_session)):
    loan = session.get(LoanApplication, loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan application not found")
    loan.status = update.status
    loan.lender_notes = _sanitize(update.lender_notes) or ""
    session.add(loan)
    session.commit()
    session.refresh(loan)
    logger.info("Loan %d status → %s", loan_id, update.status)
    return {"loan_id": loan.id, "status": loan.status, "message": f"Loan {update.status}."}


@app.get("/api/portfolio")
async def portfolio_analytics(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    """Lender portfolio-level risk analytics."""
    try:
        from sqlmodel import or_
        all_loans = session.exec(select(LoanApplication).where(or_(LoanApplication.lender_id == user.clerk_user_id, LoanApplication.lender_id == None))).all()
        total = len(all_loans)
        if total == 0:
            return {"total_applications": 0, "summary": {}}

        by_status = {}
        by_procedure = {}
        by_city = {}
        total_exposure = 0
        high_risk_count = 0

        for loan in all_loans:
            by_status[loan.status] = by_status.get(loan.status, 0) + 1
            by_procedure[loan.procedure] = by_procedure.get(loan.procedure, 0) + 1
            by_city[loan.hospital_city] = by_city.get(loan.hospital_city, 0) + 1
            total_exposure += loan.loan_amount_requested
            if loan.confidence_score < 0.50:
                high_risk_count += 1

        return {
            "total_applications": total,
            "total_exposure": total_exposure,
            "high_risk_count": high_risk_count,
            "avg_confidence": round(sum(l.confidence_score for l in all_loans) / total, 2),
            "by_status": by_status,
            "by_procedure": by_procedure,
            "by_city": by_city,
        }
    except Exception as e:
        logger.error("Portfolio error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Portfolio analytics failed.")


@app.get("/api/hospitals")
async def list_hospitals(city: Optional[str] = None, procedure: Optional[str] = None, session: Session = Depends(get_session)):
    try:
        hospitals = _get_cached_hospitals(session)
        results = []
        for h in hospitals:
            if city and h.city.lower() != city.lower():
                continue
            procs = get_procedures(h)
            if procedure and procedure.lower().replace(" ", "_") not in [p.lower().replace(" ", "_") for p in procs]:
                continue
            results.append({
                "id": h.id, "name": h.name, "city": h.city, "state": h.state,
                "tier": h.tier, "accreditation": h.accreditation,
                "procedures": procs, "base_rates": get_base_rates(h),
                "room_rates": get_room_rates(h), "doctors": get_doctors(h),
                "nlp_score": h.nlp_score, "volume_proxy": h.volume_proxy,
                "billing_predictability_score": h.billing_predictability_score,
            })
        return results
    except Exception as e:
        logger.error("Hospital list error: %s", str(e)[:300])
        raise HTTPException(status_code=500, detail="Failed to fetch hospitals.")


@app.get("/api/hospitals/{hospital_id}")
async def get_hospital(hospital_id: int, session: Session = Depends(get_session)):
    hospital = session.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return {
        "id": hospital.id, "name": hospital.name, "city": hospital.city,
        "state": hospital.state, "pincode": hospital.pincode, "tier": hospital.tier,
        "accreditation": hospital.accreditation, "latitude": hospital.latitude,
        "longitude": hospital.longitude, "procedures": get_procedures(hospital),
        "base_rates": get_base_rates(hospital), "room_rates": get_room_rates(hospital),
        "doctors": get_doctors(hospital), "nlp_score": hospital.nlp_score,
        "volume_proxy": hospital.volume_proxy,
        "billing_predictability_score": hospital.billing_predictability_score,
    }


# --- Blog Endpoints (specific routes BEFORE parameterized) ---
@app.get("/api/blog/categories")
async def get_blog_categories(session: Session = Depends(get_session)):
    """Get all available blog categories."""
    blogs = session.exec(select(Blog).where(Blog.status == "published")).all()
    categories = list(set(b.category for b in blogs))
    return {"categories": sorted(categories)}


@app.get("/api/blog/featured")
async def get_featured_blogs(limit: int = 3, session: Session = Depends(get_session)):
    """Get featured blog posts."""
    blogs = session.exec(
        select(Blog)
        .where(Blog.status == "published", Blog.featured == True)
        .order_by(Blog.created_at.desc())
        .limit(limit)
    ).all()

    return {
        "featured_blogs": [
            {
                "id": b.id, "title": b.title, "slug": b.slug, "excerpt": b.excerpt,
                "category": b.category, "author": b.author, "featured_image": b.featured_image,
                "views": b.views, "created_at": b.created_at,
            }
            for b in blogs
        ]
    }


@app.get("/api/blog/related/{blog_id}")
async def get_related_blogs(blog_id: int, limit: int = 3, session: Session = Depends(get_session)):
    """Get related blog posts based on category."""
    blog = session.get(Blog, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")

    related = session.exec(
        select(Blog)
        .where(Blog.category == blog.category, Blog.id != blog_id, Blog.status == "published")
        .order_by(Blog.created_at.desc())
        .limit(limit)
    ).all()

    return {
        "related_blogs": [
            {
                "id": b.id, "title": b.title, "slug": b.slug, "excerpt": b.excerpt,
                "category": b.category, "author": b.author, "featured_image": b.featured_image,
                "created_at": b.created_at,
            }
            for b in related
        ]
    }


@app.get("/api/blog")
async def list_blogs(category: Optional[str] = None, search: Optional[str] = None, skip: int = 0, limit: int = 10, session: Session = Depends(get_session)):
    """Get all published blog posts with optional filtering and search."""
    query = select(Blog).where(Blog.status == "published").order_by(Blog.featured.desc(), Blog.created_at.desc())

    if category and category != "all":
        query = query.where(Blog.category == category)

    if search:
        search_term = f"%{_sanitize(search, 100)}%"
        from sqlmodel import or_
        query = query.where(or_(
            Blog.title.ilike(search_term),
            Blog.excerpt.ilike(search_term),
            Blog.content.ilike(search_term)
        ))

    blogs = session.exec(query.offset(skip).limit(limit)).all()
    total = session.exec(select(Blog).where(Blog.status == "published")).all()

    return {
        "blogs": [
            {
                "id": b.id, "title": b.title, "slug": b.slug, "excerpt": b.excerpt,
                "category": b.category, "author": b.author, "featured_image": b.featured_image,
                "views": b.views, "featured": b.featured, "created_at": b.created_at,
            }
            for b in blogs
        ],
        "total": len(total),
        "skip": skip,
        "limit": limit,
    }


# Parameterized slug route AFTER specific routes to avoid conflicts
@app.get("/api/blog/{slug}")
async def get_blog_by_slug(slug: str, session: Session = Depends(get_session)):
    """Get a single blog post by slug."""
    blog = session.exec(select(Blog).where(Blog.slug == slug, Blog.status == "published")).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Increment views
    blog.views += 1
    session.add(blog)
    session.commit()

    return {
        "id": blog.id, "title": blog.title, "slug": blog.slug, "excerpt": blog.excerpt,
        "content": blog.content, "category": blog.category, "author": blog.author,
        "featured_image": blog.featured_image, "views": blog.views,
        "created_at": blog.created_at, "updated_at": blog.updated_at,
    }
