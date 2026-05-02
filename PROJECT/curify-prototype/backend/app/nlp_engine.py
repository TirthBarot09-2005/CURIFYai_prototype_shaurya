"""
CURIFY AI Navigator — NLP Intent Engine (Gemini API)
Handles patient query parsing with conversational AI.
Responds in user's language, shows possible reasons, asks follow-ups.
"""

import json
import logging
import os
import re
from typing import Optional

import httpx
from dotenv import load_dotenv

from app.cost_engine import calculate_component_costs

load_dotenv()

logger = logging.getLogger("curify.nlp_engine")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
TIMEOUT = 60.0

# ---------------------------------------------------------------------------
# Input Sanitization — prevent prompt injection & malformed input
# ---------------------------------------------------------------------------
MAX_QUERY_LENGTH = 1000
MAX_FIELD_LENGTH = 200

_INJECTION_PATTERNS = re.compile(
    r"(ignore\s+(all\s+)?previous|you\s+are\s+now|system\s*prompt|"
    r"forget\s+(your|all)|override\s+instructions|act\s+as|pretend\s+to\s+be|"
    r"disregard\s+(above|previous)|new\s+instructions?)",
    re.IGNORECASE,
)


def sanitize_text(text: str, max_length: int = MAX_QUERY_LENGTH) -> str:
    """Sanitize user input: strip dangerous patterns, limit length."""
    if not text:
        return ""
    # Truncate
    text = text.strip()[:max_length]
    # Remove control characters (keep newlines/tabs)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Neutralize prompt injection attempts by wrapping suspicious segments
    if _INJECTION_PATTERNS.search(text):
        logger.warning("Potential prompt injection detected, sanitizing: %.80s...", text)
        text = re.sub(_INJECTION_PATTERNS, "[FILTERED]", text)
    return text


def sanitize_field(text: Optional[str], max_length: int = MAX_FIELD_LENGTH) -> Optional[str]:
    """Sanitize a short field value."""
    if not text:
        return text
    return text.strip()[:max_length]


# ---------------------------------------------------------------------------
# System Prompts
# ---------------------------------------------------------------------------
PARSE_PROMPT = """You are the CURIFY Clinical NLP Engine.

RULES:
1. Extract: procedure, symptom, location, budget (INR), age, comorbidities, intent_type
2. Map symptoms to likely procedures with confidence probabilities
3. Map to ICD-10 codes where possible
4. DETECT the language of the user query (hindi, english, hinglish, marathi, gujarati, tamil, etc.)
5. Provide "possible_reasons" — explain what could be causing their symptoms, in the SAME language as user input
6. Provide "follow_up_questions" — 2-3 questions to ask the user to refine results, in the SAME language
7. Apply comorbidity risk weighting
8. Output STRICT JSON only. No markdown. No preamble.
9. NEVER give medical advice. NEVER diagnose. Add disclaimer flag always.

SUPPORTED PROCEDURES (map user input to these):
angioplasty, bypass_surgery, knee_replacement, cataract_surgery, hip_replacement,
appendectomy, hernia_repair, spinal_surgery, dialysis, liver_transplant,
cardiac_valve_replacement, gallbladder_surgery

GEO TIER:
- metro: Mumbai, Delhi, Chennai, Bangalore, Kolkata, Hyderabad
- tier2: Nagpur, Pune, Surat, Ahmedabad, Jaipur, Lucknow, Indore, Bhopal, Coimbatore, Kochi
- tier3: Raipur, Aurangabad, Nashik, Jalgaon, Solapur, Rajkot, Vadodara

OUTPUT JSON:
{
  "extracted_procedure": "angioplasty",
  "icd10_code": "I25.10",
  "intent_type": "symptom_query",
  "clinical_pathway": [{"procedure": "angioplasty", "probability": 0.80}],
  "symptoms_detected": ["chest pain"],
  "possible_reasons": "Chest pain while walking can be caused by several conditions...",
  "follow_up_questions": ["What is your age?", "Do you have diabetes or BP?", "Which city are you in?"],
  "detected_language": "hinglish",
  "location": "Nagpur",
  "budget": 160000,
  "age": 58,
  "comorbidities": ["diabetes"],
  "comorbidity_uplift": 0.18,
  "confidence_score": 0.82,
  "risk_flags": ["diabetic_complication_risk"],
  "geo_tier": "tier2",
  "auto_fill": {"location": "Nagpur", "age": null, "budget": null, "procedure": "angioplasty"},
  "disclaimer": true
}"""

CHAT_PROMPT = """You are CURIFY AI — a multilingual healthcare navigation assistant for Indian patients.

CRITICAL RULES:
1. ALWAYS respond in the SAME LANGUAGE the user types in. If Hindi, respond in Hindi. If Hinglish, use Hinglish. If Tamil, use Tamil.
2. You are NOT a doctor. Never diagnose. Always say "ye possible reasons hain" not "aapko ye bimari hai"
3. When user describes symptoms: explain possible reasons, then ask clarifying questions about age, location, budget, comorbidities
4. When you have enough info: recommend they search for hospitals using our platform
5. Keep responses concise, warm, and helpful
6. Always end with a disclaimer that this is for informational purposes only
7. Format response as JSON: {"message": "your response text", "auto_fill": {"location": null, "age": null, "budget": null, "procedure": null, "comorbidities": null}, "ready_to_search": false, "detected_language": "hindi"}
8. Set ready_to_search=true when you have enough info (at least symptom/procedure + location)
9. Extract any data user provides into auto_fill fields"""


def clean_json_response(text: str) -> str:
    """Strip markdown fencing and preamble from AI response."""
    text = text.strip()
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    idx = text.find('{')
    if idx > 0:
        text = text[idx:]
    idx = text.rfind('}')
    if idx >= 0:
        text = text[:idx + 1]
    return text


# ---------------------------------------------------------------------------
# Fallback
# ---------------------------------------------------------------------------
SYMPTOM_REASONS = {
    "chest": "Chest pain can be caused by: 1) Coronary artery disease (angina) 2) Acid reflux (GERD) 3) Muscle strain 4) Anxiety. If pain occurs during walking/exertion, it may indicate cardiac issues requiring angioplasty or further evaluation.",
    "knee": "Knee pain can be caused by: 1) Osteoarthritis (wear and tear) 2) Ligament injury (ACL/MCL) 3) Meniscus tear 4) Rheumatoid arthritis. Severe cases may need knee replacement surgery.",
    "eye": "Vision problems can be caused by: 1) Cataracts (clouding of lens) 2) Glaucoma 3) Diabetic retinopathy 4) Age-related macular degeneration. Cataracts are treatable with surgery.",
    "hip": "Hip pain can be caused by: 1) Osteoarthritis 2) Avascular necrosis 3) Fracture 4) Bursitis. Severe joint damage may require hip replacement surgery.",
    "heart": "Heart problems can indicate: 1) Coronary artery disease 2) Heart valve problems 3) Arrhythmia 4) Heart failure. Treatment ranges from medication to angioplasty/bypass surgery.",
    "stomach": "Stomach/abdominal pain can be caused by: 1) Appendicitis 2) Gallstones 3) Hernia 4) Ulcers 5) Gastritis. Some conditions need surgical intervention.",
    "back": "Back pain can be caused by: 1) Herniated disc 2) Spinal stenosis 3) Muscle strain 4) Sciatica. Severe cases may need spinal surgery.",
    "kidney": "Kidney issues can include: 1) Kidney stones 2) Chronic kidney disease 3) Urinary tract infection 4) Kidney failure requiring dialysis.",
    "bukhar": "Bukhar (fever) ke possible reasons: 1) Viral infection (flu/dengue) 2) Bacterial infection 3) Malaria 4) Typhoid 5) UTI. Agar bukhar 3 din se zyada ho toh doctor se milein.",
    "dard": "Dard ke possible reasons area pe depend karte hain. Kripya batayein ki dard kahan ho raha hai — seene mein, ghutne mein, pet mein, ya kahin aur?",
    "ghutna": "Ghutne mein dard ke reasons: 1) Osteoarthritis 2) Ligament injury 3) Meniscus tear 4) Gout. Agar bahut zyada dard ho toh knee replacement ki zarurat ho sakti hai.",
    "seene": "Seene mein dard ke reasons: 1) Heart ki nali mein blockage (Angina) 2) Acidity/GERD 3) Muscle strain 4) Anxiety. Chalte waqt dard ho toh cardiac check-up karwayein.",
    "ankh": "Aankhon ki problem ke reasons: 1) Motiyabind (Cataract) 2) Glaucoma 3) Diabetic retinopathy. Motiyabind ka operation se theek ho sakta hai.",
}

PROCEDURE_MAP = {
    "chest": ("angioplasty", "I25.10", [{"procedure": "angioplasty", "probability": 0.80}, {"procedure": "bypass_surgery", "probability": 0.25}]),
    "heart": ("angioplasty", "I25.10", [{"procedure": "angioplasty", "probability": 0.75}, {"procedure": "bypass_surgery", "probability": 0.30}, {"procedure": "cardiac_valve_replacement", "probability": 0.15}]),
    "seene": ("angioplasty", "R07.4", [{"procedure": "angioplasty", "probability": 0.80}, {"procedure": "bypass_surgery", "probability": 0.25}]),
    "dil": ("angioplasty", "I25.10", [{"procedure": "angioplasty", "probability": 0.75}, {"procedure": "bypass_surgery", "probability": 0.30}]),
    "knee": ("knee_replacement", "M17.1", [{"procedure": "knee_replacement", "probability": 0.90}]),
    "ghutna": ("knee_replacement", "M17.1", [{"procedure": "knee_replacement", "probability": 0.90}]),
    "ghutne": ("knee_replacement", "M17.1", [{"procedure": "knee_replacement", "probability": 0.90}]),
    "cataract": ("cataract_surgery", "H25.9", [{"procedure": "cataract_surgery", "probability": 0.95}]),
    "motiyabind": ("cataract_surgery", "H25.9", [{"procedure": "cataract_surgery", "probability": 0.95}]),
    "eye": ("cataract_surgery", "H25.9", [{"procedure": "cataract_surgery", "probability": 0.85}]),
    "ankh": ("cataract_surgery", "H25.9", [{"procedure": "cataract_surgery", "probability": 0.85}]),
    "nazar": ("cataract_surgery", "H25.9", [{"procedure": "cataract_surgery", "probability": 0.80}]),
    "hip": ("hip_replacement", "M16.1", [{"procedure": "hip_replacement", "probability": 0.90}]),
    "kula": ("hip_replacement", "M16.1", [{"procedure": "hip_replacement", "probability": 0.85}]),
    "bypass": ("bypass_surgery", "I25.10", [{"procedure": "bypass_surgery", "probability": 0.90}]),
    "cabg": ("bypass_surgery", "I25.10", [{"procedure": "bypass_surgery", "probability": 0.95}]),
    "appendix": ("appendectomy", "K35.8", [{"procedure": "appendectomy", "probability": 0.90}]),
    "appendicitis": ("appendectomy", "K35.8", [{"procedure": "appendectomy", "probability": 0.95}]),
    "hernia": ("hernia_repair", "K40.9", [{"procedure": "hernia_repair", "probability": 0.90}]),
    "spine": ("spinal_surgery", "M51.1", [{"procedure": "spinal_surgery", "probability": 0.80}]),
    "back": ("spinal_surgery", "M54.5", [{"procedure": "spinal_surgery", "probability": 0.60}]),
    "kamar": ("spinal_surgery", "M54.5", [{"procedure": "spinal_surgery", "probability": 0.60}]),
    "dialysis": ("dialysis", "N18.6", [{"procedure": "dialysis", "probability": 0.90}]),
    "kidney": ("dialysis", "N18.6", [{"procedure": "dialysis", "probability": 0.70}]),
    "gurda": ("dialysis", "N18.6", [{"procedure": "dialysis", "probability": 0.70}]),
    "liver": ("liver_transplant", "K74.6", [{"procedure": "liver_transplant", "probability": 0.60}]),
    "gallbladder": ("gallbladder_surgery", "K80.2", [{"procedure": "gallbladder_surgery", "probability": 0.90}]),
    "patthar": ("gallbladder_surgery", "K80.2", [{"procedure": "gallbladder_surgery", "probability": 0.80}]),
    "valve": ("cardiac_valve_replacement", "I35.0", [{"procedure": "cardiac_valve_replacement", "probability": 0.85}]),
    "pet": ("appendectomy", "R10.4", [{"procedure": "appendectomy", "probability": 0.50}, {"procedure": "gallbladder_surgery", "probability": 0.30}]),
    "stomach": ("appendectomy", "R10.4", [{"procedure": "appendectomy", "probability": 0.50}, {"procedure": "gallbladder_surgery", "probability": 0.30}]),
}

CITY_EXTRACT = {
    "nagpur": "Nagpur", "pune": "Pune", "mumbai": "Mumbai", "delhi": "Delhi",
    "jaipur": "Jaipur", "ahmedabad": "Ahmedabad", "surat": "Surat",
    "chennai": "Chennai", "bangalore": "Bangalore", "bengaluru": "Bangalore",
    "hyderabad": "Hyderabad", "kolkata": "Kolkata", "lucknow": "Lucknow",
    "indore": "Indore", "bhopal": "Bhopal", "coimbatore": "Coimbatore",
    "kochi": "Kochi", "raipur": "Raipur", "nashik": "Nashik",
    "aurangabad": "Aurangabad", "jalgaon": "Jalgaon", "rajkot": "Rajkot",
    "vadodara": "Vadodara", "solapur": "Solapur",
}


def detect_language(text):
    hindi_chars = len(re.findall(r'[\u0900-\u097F]', text))
    if hindi_chars > 3:
        return "hindi"
    hindi_words = ["mein", "hai", "ho", "raha", "dard", "kya", "kahan", "hain", "ka", "ki", "ke", "se", "ko", "wala", "chahiye", "ghutne", "seene", "pet", "bukhar", "nahi"]
    text_lower = text.lower()
    hinglish_count = sum(1 for w in hindi_words if w in text_lower.split())
    if hinglish_count >= 2:
        return "hinglish"
    return "english"


def get_fallback_response(query, location, budget, age, comorbidities):
    query_lower = query.lower()
    lang = detect_language(query)

    procedure = "angioplasty"
    icd10 = "I25.10"
    pathway = [{"procedure": "angioplasty", "probability": 0.80}]
    symptoms = ["chest pain"]
    reasons = "Based on your description, possible causes include cardiac issues. Please consult a doctor for proper diagnosis."

    for keyword, (proc, icd, path) in PROCEDURE_MAP.items():
        if keyword in query_lower:
            procedure = proc
            icd10 = icd
            pathway = path
            symptoms = [keyword]
            break

    for keyword, reason_text in SYMPTOM_REASONS.items():
        if keyword in query_lower:
            reasons = reason_text
            break

    # Extract city
    extracted_location = location or ""
    for city_key, city_name in CITY_EXTRACT.items():
        if city_key in query_lower:
            extracted_location = city_name
            break

    geo_tier = "tier2"
    if extracted_location:
        loc_l = extracted_location.lower()
        if loc_l in ["mumbai", "delhi", "chennai", "bangalore", "kolkata", "hyderabad"]:
            geo_tier = "metro"
        elif loc_l in ["raipur", "aurangabad", "nashik", "jalgaon", "solapur", "rajkot", "vadodara"]:
            geo_tier = "tier3"

    risk_flags = []
    uplift = 0.0
    if comorbidities:
        c_lower = comorbidities.lower()
        if "diabetes" in c_lower or "sugar" in c_lower:
            risk_flags.append("diabetic_complication_risk")
            uplift += 0.18
        if "hypertension" in c_lower or "bp" in c_lower:
            risk_flags.append("hypertensive_risk")
            uplift += 0.08
        if "cardiac" in c_lower or "heart" in c_lower:
            risk_flags.append("cardiac_history_flag")
            uplift += 0.22
        if "obesity" in c_lower or "mota" in c_lower:
            risk_flags.append("obesity_complication_risk")
            uplift += 0.12
    if age and age >= 65:
        risk_flags.append("elderly_length_of_stay_risk")
        uplift += 0.15

    uplift = min(uplift, 0.60)
    confidence = max(0.0, min(1.0, 0.9 - (uplift * 0.3) - (0.1 if not location else 0)))

    follow_ups = {
        "hindi": ["Aapki umar kya hai?", "Kya aapko diabetes ya BP hai?", "Aap kis sheher mein ilaaj chahte hain?"],
        "hinglish": ["Aapki age kya hai?", "Kya aapko diabetes ya BP ki problem hai?", "Kis city mein hospital dhundh rahe hain?"],
        "english": ["What is your age?", "Do you have any conditions like diabetes or hypertension?", "Which city are you looking for hospitals in?"],
    }

    return {
        "extracted_procedure": procedure,
        "icd10_code": icd10,
        "intent_type": "symptom_query" if any(w in query_lower for w in ["pain", "dard", "problem", "takleef"]) else "procedure_query",
        "clinical_pathway": pathway,
        "symptoms_detected": symptoms,
        "possible_reasons": reasons,
        "follow_up_questions": follow_ups.get(lang, follow_ups["english"]),
        "detected_language": lang,
        "location": extracted_location,
        "budget": budget,
        "age": age,
        "comorbidities": comorbidities.split(",") if comorbidities else [],
        "comorbidity_uplift": round(uplift, 2),
        "confidence_score": round(confidence, 2),
        "risk_flags": risk_flags,
        "geo_tier": geo_tier,
        "auto_fill": {
            "location": extracted_location or None,
            "age": age,
            "budget": budget,
            "procedure": procedure,
        },
        "disclaimer": True,
    }


# ---------------------------------------------------------------------------
# Main NLP Functions
# ---------------------------------------------------------------------------
async def parse_patient_query(query, location, budget=None, age=None, comorbidities=None):
    # Sanitize all inputs
    query = sanitize_text(query, MAX_QUERY_LENGTH)
    location = sanitize_field(location) or ""
    comorbidities = sanitize_field(comorbidities)

    if not query.strip():
        logger.warning("Empty query received after sanitization")
        return get_fallback_response("general health", location, budget, age, comorbidities)

    if not GEMINI_API_KEY:
        logger.info("No GEMINI_API_KEY — using fallback NLP")
        return get_fallback_response(query, location, budget, age, comorbidities)

    user_message = f"""Patient Query: "{query}"
Location: {location or 'Not specified'}
Budget: {f'Rs.{budget:,.0f}' if budget else 'Not specified'}
Age: {age or 'Not specified'}
Comorbidities: {comorbidities or 'None reported'}

Parse this query and return the JSON output as specified. Remember to respond possible_reasons and follow_up_questions in the SAME language as the patient query."""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": PARSE_PROMPT + "\n\n" + user_message}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048, "responseMimeType": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(f"{GEMINI_URL}?key={GEMINI_API_KEY}", json=payload, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            data = response.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = clean_json_response(raw_text)
            parsed = json.loads(cleaned)

            parsed.setdefault("extracted_procedure", "angioplasty")
            parsed.setdefault("icd10_code", "R07.4")
            parsed.setdefault("clinical_pathway", [])
            parsed.setdefault("confidence_score", 0.75)
            parsed.setdefault("risk_flags", [])
            parsed.setdefault("geo_tier", "tier2")
            parsed.setdefault("disclaimer", True)
            parsed.setdefault("comorbidity_uplift", 0.0)
            parsed.setdefault("possible_reasons", "")
            parsed.setdefault("follow_up_questions", [])
            parsed.setdefault("detected_language", detect_language(query))
            parsed.setdefault("auto_fill", {})

            logger.info(
                "Gemini parse OK: procedure=%s confidence=%.2f lang=%s",
                parsed.get("extracted_procedure"), parsed.get("confidence_score", 0), parsed.get("detected_language"),
            )
            return parsed
    except httpx.HTTPStatusError as e:
        logger.error("Gemini API HTTP error %d: %s", e.response.status_code, str(e)[:200])
        return get_fallback_response(query, location, budget, age, comorbidities)
    except json.JSONDecodeError as e:
        logger.error("Gemini response JSON parse error: %s", str(e)[:200])
        return get_fallback_response(query, location, budget, age, comorbidities)
    except Exception as e:
        logger.error("Gemini API unexpected error: %s", str(e)[:200])
        return get_fallback_response(query, location, budget, age, comorbidities)


async def chat_with_patient(messages):
    """Multi-turn conversational chat with Gemini."""
    last_msg = messages[-1]["content"] if messages else ""
    # Sanitize last message
    last_msg_sanitized = sanitize_text(last_msg, MAX_QUERY_LENGTH)
    lang = detect_language(last_msg_sanitized)

    if not GEMINI_API_KEY:
        # Demo mode without API key
        logger.info("Chat demo mode (no API key), lang=%s", lang)
        if lang == "hinglish" or lang == "hindi":
            return {
                "message": "🏥 Namaste! Main CURIFY AI hoon.\n\nAapne likha: \"" + last_msg_sanitized[:50] + "...\"\n\nAapki health concern ko samajhne ke liye hame aur jaankari chahiye. Mujhe bataye:\n• Symptom kitne din se hai?\n• Age aur location?\n\n⚕️ *Demo Mode: Full AI features available with Gemini API key*",
                "auto_fill": {},
                "ready_to_search": False,
                "detected_language": lang
            }
        return {
            "message": f"🏥 Hello! I'm CURIFY AI.\n\nYou mentioned: \"{last_msg_sanitized[:50]}...\"\n\nTo help you find the right hospital, please tell me:\n• How long have you had this issue?\n• Your age and location?\n\n⚕️ *Demo Mode: Full AI features available with Gemini API key*",
            "auto_fill": {},
            "ready_to_search": False,
            "detected_language": lang
        }

    # Sanitize all messages before sending to Gemini
    sanitized_messages = []
    for msg in messages:
        sanitized_messages.append({
            "role": msg["role"],
            "content": sanitize_text(msg["content"], MAX_QUERY_LENGTH),
        })

    gemini_messages = [{"role": "user", "parts": [{"text": CHAT_PROMPT}]}]
    for msg in sanitized_messages:
        role = "user" if msg["role"] == "user" else "model"
        gemini_messages.append({"role": role, "parts": [{"text": msg["content"]}]})

    payload = {
        "contents": gemini_messages,
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024, "responseMimeType": "application/json"},
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(f"{GEMINI_URL}?key={GEMINI_API_KEY}", json=payload, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            data = response.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = clean_json_response(raw_text)
            parsed = json.loads(cleaned)
            parsed.setdefault("message", "I'm here to help. What symptoms are you experiencing?")
            parsed.setdefault("auto_fill", {})
            parsed.setdefault("ready_to_search", False)
            parsed.setdefault("detected_language", lang)
            logger.info("Chat response OK: lang=%s ready_to_search=%s", lang, parsed.get("ready_to_search"))
            return parsed
    except Exception as e:
        logger.error("Gemini chat error: %s", str(e)[:200])
        # Provide helpful error response
        if lang == "hinglish" or lang == "hindi":
            return {
                "message": "⚠️ API connection issue. Lekin main aapke symptoms ko samajh sakta hoon!\n\nPls bataiye:\n• Symptom ke aur details\n• Location aur age\n\nMain aapke liye best hospitals find karunga.",
                "auto_fill": {},
                "ready_to_search": False,
                "detected_language": lang
            }
        return {
            "message": "⚠️ Connection issue. But I can still help!\n\nPlease tell me:\n• More details about your symptoms\n• Your location and age\n\nI'll find the best hospitals for you.",
            "auto_fill": {},
            "ready_to_search": False,
            "detected_language": lang
        }


async def generate_underwriting_report(extracted_procedure, location=None, age=None, comorbidities=None, geo_tier="tier2"):
    # Sanitize inputs
    extracted_procedure = sanitize_field(extracted_procedure) or "angioplasty"
    location = sanitize_field(location)
    comorbidities = sanitize_field(comorbidities)

    logger.info("Generating underwriting report: procedure=%s geo=%s age=%s", extracted_procedure, geo_tier, age)
    return calculate_component_costs(procedure=extracted_procedure, geo_tier=geo_tier, age=age, comorbidities=comorbidities, location=location)
