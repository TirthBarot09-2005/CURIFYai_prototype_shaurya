"""
CURIFY AI Navigator — Hospital Ranking Engine
5-factor weighted scoring algorithm.
Blueprint Section 11.
"""

import json
import logging
import math
from functools import lru_cache
from typing import Optional

from app.models import get_procedures, get_base_rates, get_room_rates

from geopy.distance import geodesic
from geopy.geocoders import Nominatim

logger = logging.getLogger("curify.ranking_engine")

# City coordinates cache for proximity calculation
CITY_COORDS = {
    "nagpur": (21.1458, 79.0882),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "jaipur": (26.9124, 75.7873),
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.7041, 77.1025),
    "chennai": (13.0827, 80.2707),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "kolkata": (22.5726, 88.3639),
    "raipur": (21.2514, 81.6296),
    "aurangabad": (19.8762, 75.3433),
    "nashik": (19.9975, 73.7898),
    "jalgaon": (21.0077, 75.5626),
    "lucknow": (26.8467, 80.9462),
    "indore": (22.7196, 75.8577),
    "bhopal": (23.2599, 77.4126),
    "coimbatore": (11.0168, 76.9558),
    "kochi": (9.9312, 76.2673),
    "solapur": (17.6599, 75.9064),
    "rajkot": (22.3039, 70.8022),
    "vadodara": (22.3072, 73.1812),
}


@lru_cache(maxsize=128)
def _geocode_location(location: str) -> Optional[tuple]:
    """Geocode a location string with caching to avoid repeated API calls."""
    try:
        geolocator = Nominatim(user_agent="curify-navigator", timeout=5)
        result = geolocator.geocode(f"{location}, India")
        if result:
            return (result.latitude, result.longitude)
    except Exception as e:
        logger.warning("Geocoding failed for '%s': %s", location, str(e)[:100])
    return None


def get_location_coords(location: str) -> Optional[tuple]:
    """Get coordinates for a location string."""
    if not location:
        return None
    loc_lower = location.strip().lower()
    if loc_lower in CITY_COORDS:
        return CITY_COORDS[loc_lower]
    # Try geocoding as fallback (cached)
    return _geocode_location(loc_lower)


def get_clinical_relevance(hospital_procedures: list, procedure: str, volume: int = 500) -> float:
    """Score clinical relevance: exact match + volume bonus."""
    procedure_lower = procedure.lower().replace(" ", "_")
    procs_lower = [p.lower().replace(" ", "_") for p in hospital_procedures]

    base_score = 0.0
    if procedure_lower in procs_lower:
        base_score = 0.85
    else:
        # Check for related procedures
        related_map = {
            "angioplasty": ["bypass_surgery", "cardiac_valve_replacement"],
            "bypass_surgery": ["angioplasty", "cardiac_valve_replacement"],
            "knee_replacement": ["hip_replacement"],
            "hip_replacement": ["knee_replacement"],
            "cardiac_valve_replacement": ["bypass_surgery", "angioplasty"],
            "appendectomy": ["hernia_repair", "gallbladder_surgery"],
            "hernia_repair": ["appendectomy", "gallbladder_surgery"],
            "gallbladder_surgery": ["appendectomy", "hernia_repair"],
            "spinal_surgery": ["hip_replacement"],
        }
        related = related_map.get(procedure_lower, [])
        for r in related:
            if r in procs_lower:
                base_score = 0.6
                break
        
        if base_score == 0:
            base_score = 0.2

    # Volume bonus (up to 0.15) - differentiates highly experienced centers
    # 1000 proc/yr -> +0.03
    # 5000 proc/yr -> +0.15
    volume_bonus = min((volume / 5000.0) * 0.15, 0.15)
    return base_score + volume_bonus


def get_accreditation_score(accreditation: str) -> float:
    """Score accreditation: JCI 1.0, NABH 0.80, None 0.4."""
    acc = accreditation.strip().upper() if accreditation else "NONE"
    if acc == "JCI":
        return 1.0
    elif acc == "NABH":
        return 0.80
    return 0.4


def get_affordability_match(hospital_base_rates: dict, procedure: str, budget: Optional[float]) -> float:
    """Score affordability match against patient budget."""
    if not budget or budget <= 0:
        return 0.6  # Neutral if no budget specified

    procedure_lower = procedure.lower().replace(" ", "_")
    avg_rate = hospital_base_rates.get(procedure_lower)

    if not avg_rate:
        # Use average of all rates
        rates = list(hospital_base_rates.values())
        avg_rate = sum(rates) / len(rates) if rates else budget

    if avg_rate <= budget * 0.8:
        return 1.0
    elif avg_rate <= budget:
        return 0.8
    elif avg_rate <= budget * 1.2:
        return 0.5
    return 0.2


def get_proximity_score(hospital_lat: float, hospital_lng: float, location: str) -> float:
    """Score proximity based on geodesic distance."""
    user_coords = get_location_coords(location)
    if not user_coords:
        return 0.6  # Neutral if location unknown

    hospital_coords = (hospital_lat, hospital_lng)
    try:
        distance_km = geodesic(user_coords, hospital_coords).kilometers
    except Exception:
        return 0.6

    if distance_km < 5:
        return 1.0
    elif distance_km < 15:
        return 0.8
    elif distance_km < 50:
        return 0.5
    return 0.2


def rank_hospitals(hospitals: list, parsed_query: dict, location: str) -> list:
    """
    Rank hospitals using 5-factor weighted scoring formula.
    Blueprint Section 11:
      Score = 0.35×Clinical + 0.25×Accreditation + 0.15×Reputation + 0.15×Affordability + 0.10×Proximity
    """
    procedure = parsed_query.get("extracted_procedure", "")
    budget = parsed_query.get("budget")

    logger.info("Ranking %d hospitals for procedure=%s budget=%s location=%s",
                len(hospitals), procedure, budget, location)

    results = []
    for hospital in hospitals:
        try:
            # Parse JSON fields
            procs = get_procedures(hospital) if hasattr(hospital, "procedures") else json.loads(hospital.get("procedures", "[]"))
            base_rates = get_base_rates(hospital) if hasattr(hospital, "base_rates") else json.loads(hospital.get("base_rates", "{}"))

            h_lat = hospital.latitude if hasattr(hospital, "latitude") else hospital.get("latitude", 0)
            h_lng = hospital.longitude if hasattr(hospital, "longitude") else hospital.get("longitude", 0)
            h_accreditation = hospital.accreditation if hasattr(hospital, "accreditation") else hospital.get("accreditation", "None")
            h_nlp_score = hospital.nlp_score if hasattr(hospital, "nlp_score") else hospital.get("nlp_score", 3.0)
            h_volume = hospital.volume_proxy if hasattr(hospital, "volume_proxy") else hospital.get("volume_proxy", 500)
            h_bps = hospital.billing_predictability_score if hasattr(hospital, "billing_predictability_score") else hospital.get("billing_predictability_score", 0.8)

            # Calculate sub-scores
            clinical_relevance = get_clinical_relevance(procs, procedure, h_volume)
            accreditation_score = get_accreditation_score(h_accreditation)
            reputation_score = min(h_nlp_score / 5.0, 1.0)
            affordability_match = get_affordability_match(base_rates, procedure, budget)
            proximity_score = get_proximity_score(h_lat, h_lng, location)

            # Weighted composite score (Refined Section 11)
            # Default: 0.30 Clinical + 0.20 Accreditation + 0.15 Reputation + 0.15 Affordability + 0.10 Proximity + 0.10 Billing
            urgency = parsed_query.get("urgency", "planned")
            
            if urgency == "emergency":
                # Emergency: Prioritize Proximity and Clinical Relevance
                weights = {
                    "clinical": 0.30,
                    "accreditation": 0.15,
                    "reputation": 0.10,
                    "affordability": 0.05,
                    "proximity": 0.35,
                    "billing": 0.05
                }
            else:
                # Planned: Prioritize Clinical Relevance and Affordability
                weights = {
                    "clinical": 0.35,
                    "accreditation": 0.20,
                    "reputation": 0.15,
                    "affordability": 0.15,
                    "proximity": 0.10,
                    "billing": 0.05
                }

            composite_score = round(
                (weights["clinical"] * clinical_relevance) +
                (weights["accreditation"] * accreditation_score) +
                (weights["reputation"] * reputation_score) +
                (weights["affordability"] * affordability_match) +
                (weights["proximity"] * proximity_score) +
                (weights["billing"] * h_bps),
                3
            )

            h_id = hospital.id if hasattr(hospital, "id") else hospital.get("id", 0)
            h_name = hospital.name if hasattr(hospital, "name") else hospital.get("name", "")
            h_city = hospital.city if hasattr(hospital, "city") else hospital.get("city", "")
            h_tier = hospital.tier if hasattr(hospital, "tier") else hospital.get("tier", "tier2")
            h_volume = hospital.volume_proxy if hasattr(hospital, "volume_proxy") else hospital.get("volume_proxy", 0)
            h_room_rates = get_room_rates(hospital) if hasattr(hospital, "room_rates") else json.loads(hospital.get("room_rates", "{}"))

            results.append({
                "hospital_id": h_id,
                "name": h_name,
                "city": h_city,
                "tier": h_tier,
                "accreditation": h_accreditation,
                "nlp_score": h_nlp_score,
                "composite_score": composite_score,
                "clinical_relevance": round(clinical_relevance, 2),
                "accreditation_score": round(accreditation_score, 2),
                "reputation_score": round(reputation_score, 2),
                "affordability_match": round(affordability_match, 2),
                "proximity_score": round(proximity_score, 2),
                "billing_predictability_score": round(h_bps, 2),
                "base_rates": base_rates,
                "room_rates": h_room_rates,
                "volume_proxy": h_volume,
            })
        except Exception as e:
            h_name = getattr(hospital, "name", "unknown")
            logger.error("Error ranking hospital '%s': %s", h_name, str(e)[:200])
            continue  # Skip broken hospital records gracefully

    # Sort by composite score descending
    results.sort(key=lambda x: x["composite_score"], reverse=True)
    logger.info("Ranking complete: %d hospitals scored", len(results))
    return results
