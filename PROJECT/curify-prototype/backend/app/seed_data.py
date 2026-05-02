"""
CURIFY AI Navigator — Database Seed Script
Reads hospitals.json and populates the SQLite Hospital table.
Run: python -m app.seed_data
"""

import json
import os
import sys

from sqlmodel import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import Hospital, LoanApplication, Blog, engine, init_db


def seed_hospitals():
    init_db()

    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "hospitals.json")

    with open(json_path, "r", encoding="utf-8") as f:
        hospitals_data = json.load(f)

    with Session(engine) as session:
        from sqlmodel import select
        existing = session.exec(select(Hospital)).all()
        if existing:
            print(f"Found {len(existing)} existing hospitals. Clearing and re-seeding...")
            for h in existing:
                session.delete(h)
            session.commit()

        count = 0
        for h in hospitals_data:
            hospital = Hospital(
                name=h["name"],
                city=h["city"],
                state=h["state"],
                pincode=h["pincode"],
                tier=h["tier"],
                accreditation=h["accreditation"],
                latitude=h["latitude"],
                longitude=h["longitude"],
                procedures=json.dumps(h["procedures"]),
                base_rates=json.dumps(h["base_rates"]),
                room_rates=json.dumps(h["room_rates"]),
                doctors=json.dumps(h.get("doctors", {})),
                nlp_score=h["nlp_score"],
                volume_proxy=h["volume_proxy"],
                billing_predictability_score=h.get("billing_predictability_score", 0.80),
            )
            session.add(hospital)
            count += 1

        # Seed sample loan applications for demo
        sample_loans = [
            LoanApplication(patient_name="Rajesh Kumar", patient_age=58, procedure="angioplasty", hospital_name="Apollo Hospital Nagpur", hospital_city="Nagpur", estimated_cost_min=115000, estimated_cost_max=168000, loan_amount_requested=150000, ayushman_coverage=50000, funding_gap=100000, confidence_score=0.85, comorbidities="diabetes", risk_flags='["diabetic_complication_risk"]', geo_tier="tier2", status="pending"),
            LoanApplication(patient_name="Sunita Devi", patient_age=67, procedure="knee_replacement", hospital_name="Ruby Hall Clinic Pune", hospital_city="Pune", estimated_cost_min=155000, estimated_cost_max=210000, loan_amount_requested=180000, ayushman_coverage=0, funding_gap=180000, confidence_score=0.72, comorbidities="hypertension, obesity", risk_flags='["hypertensive_risk","obesity_complication_risk","elderly_length_of_stay_risk"]', geo_tier="tier2", status="pending"),
            LoanApplication(patient_name="Mohammed Farhan", patient_age=45, procedure="bypass_surgery", hospital_name="Fortis Escorts Heart Institute", hospital_city="Delhi", estimated_cost_min=420000, estimated_cost_max=580000, loan_amount_requested=500000, ayushman_coverage=150000, funding_gap=350000, confidence_score=0.88, comorbidities="", risk_flags='[]', geo_tier="metro", status="pending"),
            LoanApplication(patient_name="Priya Sharma", patient_age=72, procedure="cataract_surgery", hospital_name="AIIMS Delhi", hospital_city="Delhi", estimated_cost_min=32000, estimated_cost_max=48000, loan_amount_requested=40000, ayushman_coverage=25000, funding_gap=15000, confidence_score=0.92, comorbidities="diabetes", risk_flags='["diabetic_complication_risk","elderly_length_of_stay_risk"]', geo_tier="metro", status="approved"),
            LoanApplication(patient_name="Vikram Singh", patient_age=55, procedure="spinal_surgery", hospital_name="Narayana Health City", hospital_city="Bangalore", estimated_cost_min=270000, estimated_cost_max=380000, loan_amount_requested=350000, ayushman_coverage=0, funding_gap=350000, confidence_score=0.45, comorbidities="cardiac_history, diabetes", risk_flags='["cardiac_history_flag","diabetic_complication_risk"]', geo_tier="metro", status="flagged"),
        ]
        for loan in sample_loans:
            session.add(loan)

        # Seed sample blog posts
        sample_blogs = [
            Blog(
                title="Understanding Healthcare Costs in India",
                slug="understanding-healthcare-costs-india",
                excerpt="A comprehensive guide to understanding why medical procedures cost differently across hospitals in India.",
                content="""Healthcare costs in India vary dramatically based on several factors. From government hospitals to premium private facilities, the cost spectrum for the same procedure can range from ₹50,000 to ₹5,00,000.

## Key Cost Drivers:
1. **Hospital Tier**: Government < Tier 3 Private < Tier 2 Private < Metro Premium
2. **Doctor Experience**: Consultant fees vary by specialization and years of practice
3. **Infrastructure**: Advanced diagnostic equipment adds to overall costs
4. **Comorbidities**: Existing health conditions may require additional treatment
5. **Geographic Location**: Metropolitan areas charge premium rates

## Real Example:
A knee replacement that costs ₹80,000 at a government hospital may cost ₹3,50,000 at a premium private facility in the same city. Both procedures are equally safe and effective.

## What You Can Do:
- Compare costs across multiple hospitals
- Ask for itemized bills before treatment
- Check if you're eligible for insurance coverage
- Consider Ayushman Bharat coverage
- Don't hesitate to negotiate with smaller facilities""",
                category="financial_guides",
                author="Dr. Amit Sharma",
                featured=True,
            ),
            Blog(
                title="Recovering from Cardiac Surgery: A Month-by-Month Guide",
                slug="cardiac-surgery-recovery-guide",
                excerpt="What to expect after angioplasty, bypass surgery, or other cardiac interventions - Month 1 through Month 3.",
                content="""Cardiac procedures are life-changing, and recovery is just as important as the surgery itself. Here's what to expect.

## Week 1-2: Hospital Stay
- Pain management with prescribed medications
- Limited mobility, focus on breathing exercises
- Wound care and monitoring for infections
- Daily vital sign checks

## Week 3-4: Home Care Begins
- Gentle walking recommended (start with 5 minutes)
- Avoid heavy lifting and strenuous activities
- Continue all medications as prescribed
- Watch for warning signs: excessive chest pain, shortness of breath

## Month 2: Gradual Recovery
- Walking can be increased to 20-30 minutes daily
- Light household activities are okay
- Begin dietary modifications (low-sodium, low-fat)
- Attend cardiac rehabilitation program if recommended

## Month 3 and Beyond
- Most patients return to light work
- Sexual activity can be resumed cautiously
- Exercise capacity improves significantly
- Regular follow-up appointments continue

## Warning Signs:
Seek immediate medical help if you experience:
- Severe chest pain
- Difficulty breathing
- Irregular heartbeat
- Excessive swelling in legs
- Persistent fever""",
                category="healthcare_tips",
                author="Dr. Rajesh Iyer",
                featured=True,
            ),
            Blog(
                title="My Journey: From Diagnosis to Recovery",
                slug="patient-journey-diabetes-management",
                excerpt="Ramesh Patel shares his personal story of managing diabetes and avoiding complications through timely intervention.",
                content="""My name is Ramesh Patel, and I'm a 52-year-old accountant from Pune. Two years ago, a simple checkup changed my life.

## The Diagnosis
I wasn't worried about my annual checkup. I felt fine - a bit tired, perhaps, but nothing serious. When the doctor said "Your blood sugar is 280," I thought it was a mistake. Diabetes? That runs in my family, but I always took precautions.

## The Revelation
The real shock came when the cardiologist found early signs of neuropathy. Diabetes had already started affecting my nerves. I could have had a heart attack within months if left untreated.

## Taking Action
I decided to use CURIFY to find the best endocrinologist nearby. Within 30 minutes, I had a ranked list of specialists, their experience, and realistic costs. I chose a nearby clinic and started treatment immediately.

## The Recovery
- Strict diet modifications (thanks to hospital's nutritionist)
- Regular exercise routine established
- Blood sugar stabilized within 3 months
- Prevented what could have been a catastrophic health event

## My Advice
Don't ignore warning signs. Get checked regularly. Use technology to find the right doctor. Early intervention saved my life.

**"If I had waited even 6 months longer, I might not be here today."**""",
                category="patient_stories",
                author="Ramesh Patel (as told to CURIFY)",
            ),
            Blog(
                title="Why Hospital Accreditation Matters",
                slug="hospital-accreditation-matters",
                excerpt="Understanding JCI, NABH, and why accreditations are crucial indicators of quality healthcare.",
                content="""When choosing a hospital for surgery, accreditation is one of the most important factors to consider. But what do these abbreviations actually mean?

## JCI (Joint Commission International)
- Globally recognized accreditation
- Indicates international-level safety standards
- Requires audits every 3 years
- Hospitals must meet stringent hygiene, staffing, and equipment standards

## NABH (National Accreditation Board for Hospitals & Healthcare Providers)
- Indian accreditation standard
- Tailored to Indian healthcare context
- Ensures quality management systems
- Covers patient safety, clinical governance, and infection control

## IADC (Indian Association of Diagnostic Clinicians)
- Focuses on diagnostic accuracy
- Important for labs and imaging centers
- Ensures equipment calibration and staff competence

## Why It Matters
Accredited hospitals have:
✓ Lower infection rates
✓ Better patient outcomes
✓ Transparent billing practices
✓ Trained staff with certifications
✓ Regular quality audits
✓ Better handling of medical emergencies

## What to Look For
1. Check hospital's accreditation status on their website
2. Ask about medical staff qualifications
3. Look for infection control certifications
4. Ask about patient complaint resolution process
5. Check if they participate in quality improvement programs

Choose accredited hospitals for major procedures - it could save your life.""",
                category="hospital_reviews",
                author="Healthcare Quality Consultant",
                featured=True,
            ),
            Blog(
                title="Complete Guide to Health Insurance Claims",
                slug="health-insurance-claims-guide",
                excerpt="Step-by-step process to file, track, and resolve health insurance claims with zero hassle.",
                content="""Filing health insurance claims can be confusing, but with the right approach, it's straightforward.

## Before Surgery: Pre-Authorization
1. Get the hospitalization estimate from hospital
2. Call insurance company's pre-auth department
3. Provide hospital details, procedure code, estimated cost
4. Insurance sends approval letter (usually within 24 hours)
5. Give pre-auth letter to hospital

## During Hospital Stay
1. Keep hospital admission documents
2. Collect all medical reports and test results
3. Ask hospital for itemized bill
4. Ensure hospital files claims if it's a network hospital
5. Pay only your copay/deductible

## After Discharge: Claim Filing
1. Collect discharge summary and itemized bill
2. Gather all supporting documents:
   - Test reports
   - Doctor's prescriptions
   - Lab results
3. File claim within 30 days (varies by policy)
4. Submit via app, email, or offline

## Claim Processing
- Usually takes 7-15 days for network hospitals
- Non-network claims take 30+ days
- Insurance may ask for additional documents
- Keep copies of everything

## Common Issues & Solutions
**Issue**: Claim denied
**Solution**: Ask for denial reason in writing, appeal with additional documents

**Issue**: Partial claim approval
**Solution**: Verify if procedure was covered, review policy exclusions

**Issue**: Delayed processing
**Solution**: Follow up weekly, escalate to grievance officer if delayed beyond 30 days

## Pro Tips
- Always keep policy documents handy
- Take photos of bills and receipts
- Maintain health records digitally
- Report claims promptly
- Document doctor communications""",
                category="financial_guides",
                author="Insurance Expert Team",
            ),
        ]
        
        # Clear existing blogs to avoid duplicates
        from sqlmodel import select
        existing_blogs = session.exec(select(Blog)).all()
        if existing_blogs:
            for b in existing_blogs:
                session.delete(b)
        
        for blog in sample_blogs:
            session.add(blog)

        session.commit()
        print(f"[OK] Seeded {count} hospitals + {len(sample_loans)} sample loan applications + {len(sample_blogs)} blog posts.")


if __name__ == "__main__":
    seed_hospitals()
