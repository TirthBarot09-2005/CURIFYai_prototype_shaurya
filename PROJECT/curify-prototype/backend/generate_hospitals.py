import json, random

DOCTORS = {
    "angioplasty": ["Dr. Rajesh Sharma (Interventional Cardiology, 18yr)", "Dr. Meena Patel (Cardiology, 15yr)", "Dr. Anil Kumar (Cardiac Surgery, 22yr)", "Dr. Priya Singh (Interventional Cardiology, 12yr)"],
    "bypass_surgery": ["Dr. Devi Shetty (Cardiac Surgery, 30yr)", "Dr. Ramesh Gupta (CTVS, 25yr)", "Dr. Sunita Mahajan (Cardiac Surgery, 20yr)", "Dr. Vikram Rao (CTVS, 18yr)"],
    "knee_replacement": ["Dr. Ashok Rajgopal (Orthopaedics, 35yr)", "Dr. Nitin Walia (Joint Replacement, 20yr)", "Dr. Kavita Deshmukh (Orthopaedics, 16yr)", "Dr. Suresh Patel (Ortho Surgery, 22yr)"],
    "cataract_surgery": ["Dr. Mahipal Sachdev (Ophthalmology, 28yr)", "Dr. Anita Bhat (Eye Surgery, 18yr)", "Dr. Ravi Mohan (Ophthalmology, 15yr)", "Dr. Sneha Joshi (Phaco Surgery, 12yr)"],
    "hip_replacement": ["Dr. S.K. Rajan (Orthopaedics, 25yr)", "Dr. Leena Sharma (Joint Surgery, 18yr)", "Dr. Prakash Nair (Ortho Surgery, 20yr)", "Dr. Geeta Iyer (Orthopaedics, 14yr)"],
    "appendectomy": ["Dr. Vinod Raina (General Surgery, 20yr)", "Dr. Neha Agarwal (Laparoscopic Surgery, 12yr)", "Dr. Manish Tiwari (General Surgery, 16yr)"],
    "hernia_repair": ["Dr. Sanjay Bhat (General Surgery, 22yr)", "Dr. Pooja Mehta (Laparoscopic Surgery, 14yr)", "Dr. Rajiv Saxena (General Surgery, 18yr)"],
    "spinal_surgery": ["Dr. Hitesh Garg (Spine Surgery, 20yr)", "Dr. Arvind Kulkarni (Neurosurgery, 25yr)", "Dr. Nisha Menon (Spine Surgery, 15yr)"],
    "dialysis": ["Dr. Sanjeev Gulati (Nephrology, 22yr)", "Dr. Asha Rani (Nephrology, 16yr)", "Dr. Mohan Das (Renal Medicine, 18yr)"],
    "liver_transplant": ["Dr. A.S. Soin (Hepatology, 28yr)", "Dr. Subhash Gupta (Liver Transplant, 25yr)", "Dr. Vivek Vij (HPB Surgery, 20yr)"],
    "cardiac_valve_replacement": ["Dr. Z.S. Meharwal (CTVS, 30yr)", "Dr. Nandini Desai (Cardiac Surgery, 18yr)", "Dr. Alok Gupta (CTVS, 22yr)"],
    "gallbladder_surgery": ["Dr. Prateek Sharma (Laparoscopic Surgery, 15yr)", "Dr. Swati Gupta (General Surgery, 12yr)", "Dr. Vikas Tandon (General Surgery, 18yr)"],
}

BASE_RATES_EXTENDED = {
    "appendectomy": 45000, "hernia_repair": 55000, "spinal_surgery": 250000,
    "dialysis": 2500, "liver_transplant": 1800000, "cardiac_valve_replacement": 350000,
    "gallbladder_surgery": 40000,
}

def pick_docs(procs):
    docs = {}
    for p in procs:
        if p in DOCTORS:
            docs[p] = random.sample(DOCTORS[p], min(2, len(DOCTORS[p])))
    return docs

def gen(name, city, state, pin, tier, accr, lat, lng, procs, nlp, vol, bp=0.85):
    base_mult = {"metro": 1.35, "tier2": 1.0, "tier3": 0.75}[tier]
    base = {
        "angioplasty": 125000, "bypass_surgery": 310000, "knee_replacement": 155000,
        "cataract_surgery": 28000, "hip_replacement": 185000, "appendectomy": 45000,
        "hernia_repair": 55000, "spinal_surgery": 250000, "dialysis": 2500,
        "liver_transplant": 1800000, "cardiac_valve_replacement": 350000, "gallbladder_surgery": 40000,
    }
    rates = {p: int(base.get(p, 100000) * base_mult * random.uniform(0.88, 1.15)) for p in procs}
    room_base = {"metro": 2800, "tier2": 2000, "tier3": 1200}[tier]
    rooms = {"general": int(room_base * 0.7), "private": int(room_base * 1.6), "icu": int(room_base * 3.2)}
    return {
        "name": name, "city": city, "state": state, "pincode": pin, "tier": tier,
        "accreditation": accr, "latitude": lat, "longitude": lng,
        "procedures": procs, "base_rates": rates, "room_rates": rooms,
        "nlp_score": nlp, "volume_proxy": vol,
        "billing_predictability_score": round(bp, 2),
        "doctors": pick_docs(procs),
    }

hospitals = [
    # === MUMBAI (Metro) ===
    gen("Kokilaben Dhirubhai Ambani Hospital", "Mumbai", "Maharashtra", "400053", "metro", "JCI", 19.1310, 72.8264,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","spinal_surgery","liver_transplant","cardiac_valve_replacement"], 4.8, 1500, 0.92),
    gen("Lilavati Hospital", "Mumbai", "Maharashtra", "400050", "metro", "NABH", 19.0509, 72.8289,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy","hernia_repair"], 4.6, 1200, 0.88),
    gen("Hinduja Hospital", "Mumbai", "Maharashtra", "400016", "metro", "JCI", 19.0380, 72.8405,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","spinal_surgery","cardiac_valve_replacement"], 4.7, 1100, 0.90),
    gen("Jaslok Hospital", "Mumbai", "Maharashtra", "400026", "metro", "NABH", 18.9713, 72.8080,
        ["angioplasty","bypass_surgery","cataract_surgery","appendectomy","gallbladder_surgery"], 4.5, 950, 0.87),
    gen("Wockhardt Hospital Mumbai", "Mumbai", "Maharashtra", "400011", "metro", "NABH", 19.0170, 72.8560,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement"], 4.3, 800, 0.85),
    gen("KEM Hospital Mumbai", "Mumbai", "Maharashtra", "400012", "metro", "NABH", 19.0030, 72.8430,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy","hernia_repair","dialysis"], 4.2, 1800, 0.78),
    gen("Breach Candy Hospital", "Mumbai", "Maharashtra", "400026", "metro", "NABH", 18.9720, 72.8050,
        ["angioplasty","cataract_surgery","appendectomy","gallbladder_surgery","hernia_repair"], 4.4, 700, 0.89),
    # === DELHI (Metro) ===
    gen("AIIMS Delhi", "Delhi", "Delhi", "110029", "metro", "NABH", 28.5672, 77.2100,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","spinal_surgery","liver_transplant","cardiac_valve_replacement","dialysis"], 4.9, 2500, 0.82),
    gen("Fortis Escorts Heart Institute", "Delhi", "Delhi", "110025", "metro", "JCI", 28.5656, 77.2281,
        ["angioplasty","bypass_surgery","cardiac_valve_replacement"], 4.8, 1400, 0.93),
    gen("Max Super Speciality Saket", "Delhi", "Delhi", "110017", "metro", "JCI", 28.5270, 77.2130,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","spinal_surgery","liver_transplant"], 4.7, 1300, 0.91),
    gen("Sir Ganga Ram Hospital", "Delhi", "Delhi", "110060", "metro", "NABH", 28.6380, 77.1910,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","appendectomy","hernia_repair","gallbladder_surgery"], 4.6, 1100, 0.86),
    gen("Safdarjung Hospital", "Delhi", "Delhi", "110029", "metro", "NABH", 28.5680, 77.2070,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","dialysis","appendectomy"], 4.1, 2000, 0.75),
    gen("BLK-Max Super Speciality", "Delhi", "Delhi", "110005", "metro", "NABH", 28.6440, 77.1860,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","liver_transplant","spinal_surgery"], 4.5, 1000, 0.88),
    # === BANGALORE (Metro) ===
    gen("Narayana Health City", "Bangalore", "Karnataka", "560099", "metro", "JCI", 12.8810, 77.5970,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","cardiac_valve_replacement","spinal_surgery"], 4.8, 1600, 0.94),
    gen("Manipal Hospital Bangalore", "Bangalore", "Karnataka", "560017", "metro", "NABH", 12.9570, 77.6190,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant"], 4.6, 1200, 0.89),
    gen("Apollo Hospital Bangalore", "Bangalore", "Karnataka", "560066", "metro", "JCI", 12.9410, 77.6260,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy","hernia_repair"], 4.7, 1100, 0.90),
    gen("BGS Gleneagles Global", "Bangalore", "Karnataka", "560060", "metro", "NABH", 12.8990, 77.5470,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","spinal_surgery"], 4.4, 900, 0.86),
    # === CHENNAI (Metro) ===
    gen("Apollo Hospital Chennai", "Chennai", "Tamil Nadu", "600006", "metro", "JCI", 13.0634, 80.2570,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant","cardiac_valve_replacement"], 4.8, 1500, 0.93),
    gen("MIOT International", "Chennai", "Tamil Nadu", "600089", "metro", "JCI", 13.0120, 80.1780,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","spinal_surgery"], 4.7, 1100, 0.91),
    gen("Fortis Malar Hospital", "Chennai", "Tamil Nadu", "600020", "metro", "NABH", 13.0350, 80.2590,
        ["angioplasty","bypass_surgery","cataract_surgery","appendectomy","gallbladder_surgery"], 4.4, 800, 0.87),
    # === HYDERABAD (Metro) ===
    gen("KIMS Hospital", "Hyderabad", "Telangana", "500003", "metro", "NABH", 17.4090, 78.4730,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","cardiac_valve_replacement","spinal_surgery"], 4.6, 1100, 0.88),
    gen("Apollo Hospital Hyderabad", "Hyderabad", "Telangana", "500033", "metro", "JCI", 17.4240, 78.4530,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant"], 4.7, 1300, 0.91),
    gen("Yashoda Hospital", "Hyderabad", "Telangana", "500036", "metro", "NABH", 17.4350, 78.4470,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy","hernia_repair"], 4.5, 1000, 0.86),
    # === KOLKATA (Metro) ===
    gen("AMRI Hospital", "Kolkata", "West Bengal", "700029", "metro", "NABH", 22.5080, 88.3640,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement"], 4.4, 900, 0.85),
    gen("Fortis Hospital Kolkata", "Kolkata", "West Bengal", "700107", "metro", "NABH", 22.5930, 88.4280,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","appendectomy","hernia_repair"], 4.5, 850, 0.87),
    gen("Apollo Gleneagles Kolkata", "Kolkata", "West Bengal", "700054", "metro", "JCI", 22.5190, 88.3980,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant","cardiac_valve_replacement"], 4.7, 1200, 0.90),
    # === NAGPUR (Tier2) — existing, re-add ===
    gen("Apollo Hospital Nagpur", "Nagpur", "Maharashtra", "440001", "tier2", "NABH", 21.1458, 79.0882,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy","hernia_repair","gallbladder_surgery"], 4.5, 800, 0.86),
    gen("AIIMS Nagpur", "Nagpur", "Maharashtra", "441108", "tier2", "NABH", 21.1750, 79.0400,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","dialysis","appendectomy"], 4.6, 1200, 0.80),
    gen("Wockhardt Hospital Nagpur", "Nagpur", "Maharashtra", "440012", "tier2", "NABH", 21.1350, 79.1050,
        ["angioplasty","bypass_surgery","hip_replacement","hernia_repair"], 4.3, 650, 0.84),
    gen("Care Hospital Nagpur", "Nagpur", "Maharashtra", "440015", "tier2", "NABH", 21.1400, 79.0950,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","appendectomy"], 4.4, 700, 0.85),
    gen("Lata Mangeshkar Hospital Nagpur", "Nagpur", "Maharashtra", "440019", "tier2", "NABH", 21.1280, 79.0720,
        ["angioplasty","bypass_surgery","cataract_surgery","gallbladder_surgery"], 4.1, 480, 0.82),
    gen("City Care Hospital Nagpur", "Nagpur", "Maharashtra", "440010", "tier2", "NABH", 21.1610, 79.0750,
        ["angioplasty","knee_replacement","cataract_surgery"], 4.2, 550, 0.83),
    gen("Alexis Hospital Nagpur", "Nagpur", "Maharashtra", "440013", "tier2", "NABH", 21.1550, 79.1100,
        ["angioplasty","knee_replacement","cataract_surgery","hip_replacement"], 4.0, 420, 0.81),
    gen("Orange City Hospital Nagpur", "Nagpur", "Maharashtra", "440009", "tier2", "None", 21.1500, 79.0600,
        ["knee_replacement","cataract_surgery","hip_replacement"], 3.8, 350, 0.78),
    # === PUNE (Tier2) ===
    gen("Ruby Hall Clinic Pune", "Pune", "Maharashtra", "411001", "tier2", "JCI", 18.5204, 73.8567,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","spinal_surgery","cardiac_valve_replacement"], 4.7, 1100, 0.91),
    gen("Sahyadri Hospital Pune", "Pune", "Maharashtra", "411004", "tier2", "NABH", 18.5100, 73.8400,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","appendectomy","hernia_repair"], 4.4, 850, 0.86),
    gen("Jehangir Hospital Pune", "Pune", "Maharashtra", "411001", "tier2", "NABH", 18.5300, 73.8750,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","gallbladder_surgery"], 4.6, 950, 0.88),
    gen("Sancheti Hospital Pune", "Pune", "Maharashtra", "411005", "tier2", "NABH", 18.5150, 73.8650,
        ["knee_replacement","hip_replacement","spinal_surgery"], 4.8, 1050, 0.90),
    gen("KEM Hospital Pune", "Pune", "Maharashtra", "411011", "tier2", "NABH", 18.4950, 73.8550,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","dialysis","appendectomy"], 4.3, 900, 0.79),
    # === JAIPUR (Tier2) ===
    gen("Fortis Escorts Hospital Jaipur", "Jaipur", "Rajasthan", "302017", "tier2", "NABH", 26.9124, 75.7873,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy"], 4.5, 900, 0.87),
    gen("Narayana Hospital Jaipur", "Jaipur", "Rajasthan", "302033", "tier2", "NABH", 26.8800, 75.8100,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","cardiac_valve_replacement"], 4.4, 1050, 0.85),
    gen("SMS Hospital Jaipur", "Jaipur", "Rajasthan", "302004", "tier2", "NABH", 26.9050, 75.8000,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","dialysis","appendectomy"], 4.0, 1200, 0.76),
    gen("Manipal Hospital Jaipur", "Jaipur", "Rajasthan", "302013", "tier2", "NABH", 26.9300, 75.7700,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","hernia_repair"], 4.3, 750, 0.86),
    # === AHMEDABAD (Tier2) ===
    gen("Apollo Hospital Ahmedabad", "Ahmedabad", "Gujarat", "380054", "tier2", "JCI", 23.0400, 72.5500,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant","cardiac_valve_replacement"], 4.6, 950, 0.90),
    gen("Sterling Hospital Ahmedabad", "Ahmedabad", "Gujarat", "380001", "tier2", "NABH", 23.0225, 72.5714,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","appendectomy","hernia_repair"], 4.3, 720, 0.85),
    gen("CIMS Hospital Ahmedabad", "Ahmedabad", "Gujarat", "380060", "tier2", "NABH", 23.0300, 72.5100,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","spinal_surgery"], 4.5, 880, 0.88),
    gen("Civil Hospital Ahmedabad", "Ahmedabad", "Gujarat", "380016", "tier2", "NABH", 23.0150, 72.5850,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","dialysis","appendectomy"], 4.0, 1100, 0.74),
    # === SURAT (Tier2) ===
    gen("BAPS Hospital Surat", "Surat", "Gujarat", "395001", "tier2", "NABH", 21.1702, 72.8311,
        ["angioplasty","knee_replacement","cataract_surgery","hip_replacement","appendectomy"], 4.3, 600, 0.85),
    gen("Kiran Hospital Surat", "Surat", "Gujarat", "395002", "tier2", "NABH", 21.1800, 72.8200,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hernia_repair"], 4.1, 520, 0.83),
    # === LUCKNOW (Tier2) ===
    gen("SGPGIMS Lucknow", "Lucknow", "Uttar Pradesh", "226014", "tier2", "NABH", 26.8700, 80.9960,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant","dialysis"], 4.5, 1300, 0.80),
    gen("Medanta Lucknow", "Lucknow", "Uttar Pradesh", "226030", "tier2", "NABH", 26.8500, 80.9500,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","cardiac_valve_replacement","spinal_surgery"], 4.6, 900, 0.89),
    # === INDORE (Tier2) ===
    gen("Bombay Hospital Indore", "Indore", "Madhya Pradesh", "452010", "tier2", "NABH", 22.7196, 75.8577,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy"], 4.3, 700, 0.84),
    gen("CHL Hospital Indore", "Indore", "Madhya Pradesh", "452001", "tier2", "NABH", 22.7200, 75.8800,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","hernia_repair","gallbladder_surgery"], 4.2, 600, 0.83),
    # === BHOPAL (Tier2) ===
    gen("AIIMS Bhopal", "Bhopal", "Madhya Pradesh", "462020", "tier2", "NABH", 23.2100, 77.4600,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","dialysis","appendectomy"], 4.4, 1000, 0.78),
    # === COIMBATORE (Tier2) ===
    gen("PSG Hospital Coimbatore", "Coimbatore", "Tamil Nadu", "641004", "tier2", "NABH", 11.0240, 77.0020,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","appendectomy"], 4.3, 700, 0.85),
    gen("GKNM Hospital Coimbatore", "Coimbatore", "Tamil Nadu", "641037", "tier2", "NABH", 11.0100, 76.9800,
        ["angioplasty","bypass_surgery","knee_replacement","hip_replacement","cardiac_valve_replacement"], 4.5, 800, 0.87),
    # === KOCHI (Tier2) ===
    gen("Amrita Hospital Kochi", "Kochi", "Kerala", "682041", "tier2", "NABH", 10.0620, 76.3480,
        ["angioplasty","bypass_surgery","knee_replacement","cataract_surgery","hip_replacement","liver_transplant","spinal_surgery"], 4.6, 1000, 0.89),
    # === TIER 3 ===
    gen("Raipur Institute of Medical Sciences", "Raipur", "Chhattisgarh", "492001", "tier3", "None", 21.2514, 81.6296,
        ["angioplasty","knee_replacement","cataract_surgery","appendectomy"], 3.5, 200, 0.72),
    gen("MGM Hospital Aurangabad", "Aurangabad", "Maharashtra", "431001", "tier3", "NABH", 19.8762, 75.3433,
        ["angioplasty","knee_replacement","cataract_surgery","hip_replacement","hernia_repair"], 3.8, 320, 0.78),
    gen("Nashik City Hospital", "Nashik", "Maharashtra", "422001", "tier3", "None", 19.9975, 73.7898,
        ["cataract_surgery","knee_replacement","appendectomy","gallbladder_surgery"], 3.6, 180, 0.74),
    gen("Jalgaon General Hospital", "Jalgaon", "Maharashtra", "425001", "tier3", "None", 21.0077, 75.5626,
        ["cataract_surgery","knee_replacement","appendectomy"], 3.5, 150, 0.70),
    gen("District Hospital Solapur", "Solapur", "Maharashtra", "413001", "tier3", "None", 17.6599, 75.9064,
        ["cataract_surgery","appendectomy","hernia_repair"], 3.3, 120, 0.68),
    gen("Rajkot Civil Hospital", "Rajkot", "Gujarat", "360001", "tier3", "NABH", 22.3039, 70.8022,
        ["angioplasty","knee_replacement","cataract_surgery","appendectomy","hernia_repair"], 3.7, 280, 0.76),
    gen("Vadodara General Hospital", "Vadodara", "Gujarat", "390001", "tier3", "NABH", 22.3072, 73.1812,
        ["angioplasty","knee_replacement","cataract_surgery","hip_replacement","appendectomy"], 3.9, 350, 0.78),
]

random.seed(42)
with open("d:/CurifyAI/curify-prototype/backend/hospitals.json", "w", encoding="utf-8") as f:
    json.dump(hospitals, f, indent=2, ensure_ascii=False)
print(f"Generated {len(hospitals)} hospitals")
