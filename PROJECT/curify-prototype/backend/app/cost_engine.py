"""
CURIFY AI Navigator — Cost Estimation Engine
Component-level cost calculator using NHA/CGHS baselines,
geo multipliers, comorbidity uplifts, and LOS model.
Blueprint Sections 10, 12.
"""

import json
import logging
import math
import random
from typing import Optional

logger = logging.getLogger("curify.cost_engine")

# ---------------------------------------------------------------------------
# NHA/CGHS Baseline Rates (Rs.) — Section 10.1
# ---------------------------------------------------------------------------
NHA_BASELINES = {
    "angioplasty": {
        "surgery": 120000, "room_per_day": 3000, "diagnostics": 10000,
        "medicines": 20000, "contingency": 20000, "base_los": 3,
        "severity_range": (0.85, 1.25),
    },
    "bypass_surgery": {
        "surgery": 300000, "room_per_day": 4000, "diagnostics": 15000,
        "medicines": 40000, "contingency": 50000, "base_los": 7,
        "severity_range": (0.90, 1.40),
    },
    "knee_replacement": {
        "surgery": 150000, "room_per_day": 2500, "diagnostics": 8000,
        "medicines": 18000, "contingency": 25000, "base_los": 5,
        "severity_range": (0.80, 1.20),
    },
    "cataract_surgery": {
        "surgery": 25000, "room_per_day": 1500, "diagnostics": 3000,
        "medicines": 5000, "contingency": 5000, "base_los": 1,
        "severity_range": (0.75, 1.15),
    },
    "hip_replacement": {
        "surgery": 180000, "room_per_day": 3000, "diagnostics": 10000,
        "medicines": 22000, "contingency": 30000, "base_los": 5,
        "severity_range": (0.85, 1.25),
    },
    "appendectomy": {
        "surgery": 35000, "room_per_day": 2000, "diagnostics": 5000,
        "medicines": 8000, "contingency": 10000, "base_los": 2,
        "severity_range": (0.80, 1.30),
    },
    "hernia_repair": {
        "surgery": 45000, "room_per_day": 2000, "diagnostics": 5000,
        "medicines": 8000, "contingency": 12000, "base_los": 2,
        "severity_range": (0.80, 1.20),
    },
    "spinal_surgery": {
        "surgery": 200000, "room_per_day": 3500, "diagnostics": 12000,
        "medicines": 25000, "contingency": 35000, "base_los": 6,
        "severity_range": (0.85, 1.45),
    },
    "dialysis": {
        "surgery": 2000, "room_per_day": 500, "diagnostics": 1500,
        "medicines": 2000, "contingency": 1000, "base_los": 1,
        "severity_range": (0.90, 1.10),
    },
    "liver_transplant": {
        "surgery": 1200000, "room_per_day": 5000, "diagnostics": 30000,
        "medicines": 80000, "contingency": 150000, "base_los": 14,
        "severity_range": (0.90, 1.50),
    },
    "cardiac_valve_replacement": {
        "surgery": 280000, "room_per_day": 4000, "diagnostics": 15000,
        "medicines": 35000, "contingency": 45000, "base_los": 7,
        "severity_range": (0.90, 1.35),
    },
    "gallbladder_surgery": {
        "surgery": 30000, "room_per_day": 2000, "diagnostics": 4000,
        "medicines": 6000, "contingency": 8000, "base_los": 2,
        "severity_range": (0.80, 1.20),
    },
}

# ---------------------------------------------------------------------------
# Hospital Tier Multipliers — adds variability based on hospital type
# ---------------------------------------------------------------------------
HOSPITAL_TIER_MULTIPLIERS = {
    "government": 0.60,
    "trust": 0.75,
    "tier3_private": 0.85,
    "tier2_private": 1.00,
    "metro_private": 1.25,
    "premium_chain": 1.50,
}

# ---------------------------------------------------------------------------
# Geo Price Multipliers — Section 10.2
# ---------------------------------------------------------------------------
GEO_MULTIPLIERS = {
    "metro": 1.4,
    "tier2": 1.0,
    "tier3": 0.75,
}

# ---------------------------------------------------------------------------
# Comorbidity Rules — Section 10.3
# ---------------------------------------------------------------------------
COMORBIDITY_RULES = {
    "diabetes": {
        "uplift": 0.18,
        "flag": "diabetic_complication_risk",
        "icu_likelihood": 0.25,
    },
    "hypertension": {
        "uplift": 0.08,
        "flag": "hypertensive_risk",
        "icu_likelihood": 0.10,
    },
    "cardiac_history": {
        "uplift": 0.22,
        "flag": "cardiac_history_flag",
        "icu_likelihood": 0.40,
    },
    "obesity": {
        "uplift": 0.12,
        "flag": "obesity_complication_risk",
        "icu_likelihood": 0.15,
    },
}

# Elderly modifier (age 65+) — applied separately
ELDERLY_UPLIFT = 0.15
ELDERLY_FLAG = "elderly_length_of_stay_risk"
ELDERLY_ICU = 0.20


def parse_comorbidities(comorbidities_input: Optional[str]) -> list:
    """Parse comorbidities from string or JSON array string."""
    if not comorbidities_input:
        return []

    comorbidities_input = comorbidities_input.strip()

    # Try JSON array first
    if comorbidities_input.startswith("["):
        try:
            parsed = json.loads(comorbidities_input)
            return [c.strip().lower().replace(" ", "_") for c in parsed if c.strip()]
        except json.JSONDecodeError:
            pass

    # Fall back to comma-separated
    return [c.strip().lower().replace(" ", "_") for c in comorbidities_input.split(",") if c.strip()]


def _generate_severity_factor(procedure_key: str) -> float:
    """Generate a random severity factor within the procedure's severity range.
    This adds realistic variability — no two estimates are identical."""
    baseline = NHA_BASELINES.get(procedure_key, {})
    sev_min, sev_max = baseline.get("severity_range", (0.85, 1.20))
    return round(random.uniform(sev_min, sev_max), 3)


def _build_explanation(
    procedure_key: str, geo_tier: str, total_uplift: float,
    severity_factor: float, total_min: int, total_max: int,
    age: Optional[int], risk_flags: list,
) -> str:
    """Build a human-readable explanation of how the cost was calculated."""
    proc_display = procedure_key.replace("_", " ").title()
    geo_display = geo_tier.replace("_", " ").title()
    geo_mult = GEO_MULTIPLIERS.get(geo_tier, 1.0)

    parts = [
        f"Estimated cost for {proc_display} in a {geo_display} location",
        f"(geo multiplier: {geo_mult}x).",
    ]

    if severity_factor != 1.0:
        parts.append(f"Severity factor: {severity_factor}x applied.")

    if total_uplift > 0:
        parts.append(f"Comorbidity uplift: +{int(total_uplift * 100)}%.")

    if age and age >= 65:
        parts.append(f"Elderly patient (age {age}) — extended LOS risk factored in.")

    if risk_flags:
        flags_display = ", ".join(f.replace("_", " ") for f in risk_flags)
        parts.append(f"Risk flags: {flags_display}.")

    parts.append(
        f"Expected range: ₹{total_min:,} – ₹{total_max:,}."
    )

    return " ".join(parts)


def calculate_component_costs(
    procedure: str,
    geo_tier: str = "tier2",
    age: Optional[int] = None,
    comorbidities: Optional[str] = None,
    location: Optional[str] = None,
    hospital_tier: Optional[str] = None,
) -> dict:
    """
    Calculate component-level cost breakdown with min-max ranges.
    Returns dict with all 5 component pairs + totals + metadata.
    Blueprint Section 10 + 12 pipeline.

    Improvements over v1:
    - Severity factor adds per-request variability
    - Hospital tier multiplier for realistic spread
    - Explanation string for transparency
    """

    # Step 1: Get procedure baseline
    procedure_key = procedure.lower().replace(" ", "_")
    baseline = NHA_BASELINES.get(procedure_key)
    if not baseline:
        # Default to angioplasty if procedure not found
        baseline = NHA_BASELINES["angioplasty"]
        procedure_key = "angioplasty"

    # Step 2: Determine geo multiplier
    geo_mult = GEO_MULTIPLIERS.get(geo_tier, 1.0)

    # Step 3: Hospital tier multiplier (adds variability by hospital type)
    hospital_mult = HOSPITAL_TIER_MULTIPLIERS.get(hospital_tier, 1.0)

    # Step 4: Severity factor (random variability within clinically valid range)
    severity_factor = _generate_severity_factor(procedure_key)

    # Step 5: Calculate comorbidity uplift
    parsed_comorbidities = parse_comorbidities(comorbidities)
    total_uplift = 0.0
    max_icu_likelihood = 0.0
    risk_flags = []

    for condition in parsed_comorbidities:
        if condition in COMORBIDITY_RULES:
            rule = COMORBIDITY_RULES[condition]
            total_uplift += rule["uplift"]
            max_icu_likelihood = max(max_icu_likelihood, rule["icu_likelihood"])
            risk_flags.append(rule["flag"])

    # Elderly modifier
    if age and age >= 65:
        total_uplift += ELDERLY_UPLIFT
        max_icu_likelihood = max(max_icu_likelihood, ELDERLY_ICU)
        risk_flags.append(ELDERLY_FLAG)

    # Cap total uplift at 60%
    total_uplift = min(total_uplift, 0.60)

    # Step 6: Estimate Length of Stay
    base_los = baseline["base_los"]
    estimated_los = math.ceil(base_los * (1 + total_uplift * 0.5))

    # Step 7: Calculate component min/max with severity + hospital multipliers
    combined_mult = geo_mult * hospital_mult * severity_factor

    surgery_base = baseline["surgery"] * combined_mult
    surgery_min = int(surgery_base)
    surgery_max = int(surgery_base * 1.35)

    room_base = baseline["room_per_day"] * geo_mult * estimated_los  # Room rates less affected by hospital tier
    room_min = int(room_base)
    room_max = int(room_base * 1.5)

    diag_base = baseline["diagnostics"] * combined_mult
    diag_min = int(diag_base)
    diag_max = int(diag_base * 1.4)

    med_base = baseline["medicines"] * combined_mult * (1 + total_uplift)
    med_min = int(med_base)
    med_max = int(med_base * 1.3)

    cont_base = baseline["contingency"] * combined_mult * (1 + total_uplift)
    cont_min = int(cont_base)
    cont_max = int(cont_base * 1.5)

    # Step 8: Totals
    total_min = surgery_min + room_min + diag_min + med_min + cont_min
    total_max = surgery_max + room_max + diag_max + med_max + cont_max

    # Step 9: Calculate confidence score — Section 12.1
    confidence = max(0.0, min(1.0,
        0.9
        - (total_uplift * 0.3)
        - (0.1 if not location else 0)
        - (0.05 if hospital_tier is None else 0)  # Less confident without hospital context
    ))
    confidence = round(confidence, 2)

    # Step 10: Build explanation
    explanation = _build_explanation(
        procedure_key, geo_tier, total_uplift, severity_factor,
        total_min, total_max, age, risk_flags,
    )

    logger.info(
        "Cost estimated: procedure=%s geo=%s severity=%.3f total=%d-%d confidence=%.2f",
        procedure_key, geo_tier, severity_factor, total_min, total_max, confidence,
    )

    return {
        "procedure": procedure_key,
        "surgery_cost_min": surgery_min,
        "surgery_cost_max": surgery_max,
        "room_cost_min": room_min,
        "room_cost_max": room_max,
        "diagnostics_min": diag_min,
        "diagnostics_max": diag_max,
        "medicines_min": med_min,
        "medicines_max": med_max,
        "contingency_min": cont_min,
        "contingency_max": cont_max,
        "total_min": total_min,
        "total_max": total_max,
        "estimated_cost": int((total_min + total_max) / 2),
        "cost_range": {"min": total_min, "max": total_max},
        "estimated_los": estimated_los,
        "geo_adjustment": geo_mult,
        "severity_factor": severity_factor,
        "comorbidity_uplift": round(total_uplift, 2),
        "icu_likelihood": round(max_icu_likelihood, 2),
        "risk_flags": risk_flags,
        "confidence_score": confidence,
        "explanation": explanation,
        "disclaimer": "Pre-underwriting estimate only. Final approval subject to manual review.",
    }
