"""
CURIFY AI Navigator — Database Models
"""

import json
import os
from datetime import datetime, timezone

from sqlmodel import Field, Session, SQLModel, create_engine


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clerk_user_id: str = Field(index=True, unique=True)
    name: str | None = None
    email: str | None = None
    role: str | None = None  # "patient" or "lender"
    profile_completed: bool = Field(default=False)
    patient_data: str = Field(default="{}")  # JSON string
    lender_data: str = Field(default="{}")   # JSON string
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Hospital(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    city: str = Field(index=True)
    state: str = ""
    pincode: str = ""
    tier: str = "tier2"
    accreditation: str = "None"
    latitude: float = 0.0
    longitude: float = 0.0
    procedures: str = "[]"
    base_rates: str = "{}"
    room_rates: str = "{}"
    doctors: str = "{}"
    nlp_score: float = 3.0
    volume_proxy: int = 0
    billing_predictability_score: float = 0.80


class PatientQuery(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    raw_query: str = ""
    location: str = ""
    budget: float | None = None
    age: int | None = None
    comorbidities: str | None = None
    extracted_procedure: str | None = None
    icd10_code: str | None = None
    confidence_score: float | None = None
    risk_flags: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UnderwritingReport(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    extracted_procedure: str = ""
    location: str | None = None
    age: int | None = None
    comorbidities: str | None = None
    geo_tier: str = "tier2"
    surgery_cost_min: int = 0
    surgery_cost_max: int = 0
    room_cost_min: int = 0
    room_cost_max: int = 0
    diagnostics_min: int = 0
    diagnostics_max: int = 0
    medicines_min: int = 0
    medicines_max: int = 0
    contingency_min: int = 0
    contingency_max: int = 0
    total_min: int = 0
    total_max: int = 0
    estimated_los: int = 0
    geo_adjustment: float = 1.0
    comorbidity_uplift: float = 0.0
    icu_likelihood: float = 0.0
    confidence_score: float = 0.0
    risk_flags: str | None = None
    disclaimer: str = "Pre-underwriting estimate only. Final approval subject to manual review."
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LoanApplication(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    patient_name: str = ""
    patient_age: int | None = None
    procedure: str = ""
    hospital_name: str = ""
    hospital_city: str = ""
    estimated_cost_min: int = 0
    estimated_cost_max: int = 0
    loan_amount_requested: int = 0
    ayushman_coverage: int = 0
    funding_gap: int = 0
    confidence_score: float = 0.0
    comorbidities: str = ""
    risk_flags: str = "[]"
    geo_tier: str = "tier2"
    patient_id: str | None = Field(default=None, index=True)
    status: str = "pending"  # pending, approved, conditional, rejected, flagged
    lender_id: str | None = Field(default=None, index=True)
    lender_notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# --- Helper functions ---
def get_procedures(hospital: Hospital) -> list:
    try:
        return json.loads(hospital.procedures)
    except (json.JSONDecodeError, TypeError):
        return []

def get_base_rates(hospital: Hospital) -> dict:
    try:
        return json.loads(hospital.base_rates)
    except (json.JSONDecodeError, TypeError):
        return {}

def get_room_rates(hospital: Hospital) -> dict:
    try:
        return json.loads(hospital.room_rates)
    except (json.JSONDecodeError, TypeError):
        return {}

def get_doctors(hospital: Hospital) -> dict:
    try:
        return json.loads(hospital.doctors)
    except (json.JSONDecodeError, TypeError):
        return {}


class Blog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    slug: str = Field(index=True, unique=True)
    excerpt: str = ""
    content: str = ""
    category: str = Field(index=True)  # "patient_stories", "healthcare_tips", "financial_guides", "hospital_reviews"
    author: str = "CURIFY Team"
    featured_image: str | None = None
    status: str = "published"  # "draft", "published"
    views: int = 0
    featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BlogComment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    blog_id: int = Field(foreign_key="blog.id", index=True)
    author_name: str = ""
    author_email: str = ""
    content: str = ""
    status: str = "pending"  # "pending", "approved", "spam"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# Read DATABASE_URL from environment, fall back to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./curify.db")
engine = create_engine(DATABASE_URL, echo=False)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
