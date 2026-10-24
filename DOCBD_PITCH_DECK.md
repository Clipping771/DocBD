# DocBD — Investor Pitch Deck (10 Slides)
**"কাছের ডাক্তার, আসল সিরিয়াল, অপেক্ষা ছাড়া"**  
*The Australian HotDoc Model Re-engineered for Bangladesh’s Private Healthcare Chambers*

**Seed Round: BDT ৫০,০০,০০০ (USD ~42,000) for 10% Equity**  
**Date:** October 2026 | **Version:** 1.0 Final

---

## Slide 1: The Hook & Executive Summary
### "The 3-Hour Waiting Room Crisis in Bangladesh"

* **The Daily Reality:** Every day, over 1.2 million outpatient consultations happen in Bangladesh's private chambers and clinics. Patients routinely travel 1–3 hours, only to sit on plastic chairs in crammed waiting corridors for another 2 to 4 hours with no visibility on when the doctor will arrive or call their name.
* **The Platform Failure:** First-generation platforms (DocTime, Doctorola) focused either on online video telemedicine or simple static directories. None digitized the physical clinic's heartbeat: **the compounder's physical serial book (খাতা)**.
* **Our Solution — DocBD:** The HotDoc of Bangladesh. A chamber-first, real-time live queue and patient engagement platform that gives patients live queue countdowns on their phone, while giving clinics an effortless tablet registry that syncs walk-in, phone, and online serials in real time.

> **Key Takeaway:** We do not replace the physical clinic. We digitize the waiting room, eliminating chaos and empowering doctors.

---

## Slide 2: The Problem
### Three Structural Bottlenecks Paralyzing Chamber Healthcare

| # | Stakeholder | Pain Point | Economic & Human Cost |
|---|---|---|---|
| **১** | **রোগী ও পরিবার** (Patients) | **অন্ধ অপেক্ষা ও অনিশ্চয়তা:** সিরিয়াল ১২ পেয়েও রোগী জানেন না ডাক্তার কখন পৌঁছাবেন বা কখন ডাক পড়বে। ৩ ঘণ্টা বসে থাকতে হয়। | কর্মঘণ্টা নষ্ট, ভিড়ে ইনফেকশনের ঝুঁকি, চরম মানসিক যন্ত্রণা। |
| **২** | **ডাক্তার ও কম্পাউন্ডার** (Chambers) | **হাতে লেখা সিরিয়াল খাতা ও নো-শো:** ফোন কল ও চিরকুটের গ্যাঁড়াকল। ২০-৩০% রোগী না এসে চেম্বারের মূল্যবান স্লট নষ্ট করে। | প্রতিদিন প্রতিটি ডাক্তারের ৩,০০০–৬,০০০ টাকা আয় ক্ষতি। |
| **৩** | **হাসপাতাল ও ক্লিনিক** (Hospitals) | **ওয়েটিং রুমের চরম ভিড় ও রোগী অসন্তোষ:** লবি ও করিডোরে গাদাগাদি। প্রেসক্রিপশন নিয়ে রোগী বাইরের ফার্মেসিতে চলে যায়। | ব্র্যান্ডের ভাবমূর্তি নষ্ট ও ইন-হাউস ডায়াগনস্টিক টেস্টের অপচয়। |

---

## Slide 3: The Solution — DocBD Ecosystem
### 4 Connected Screens, 1 Unified Real-Time Engine

```
[ রোগীর মোবাইল অ্যাপ / PWA ] ────────┐
(লাইভ সিরিয়াল, SMS অ্যালার্ট, ভল্ট)      │
                                      ▼
[ রিসেপশন ও কম্পাউন্ডার খাতা ] ◄───► [ রিয়েল-টাইম ইঞ্জিন ] ◄───► [ ডাক্তার ওপিডি পোর্টাল ]
(ওয়াক-ইন + অনলাইন একক ডিজিটাল খাতা)     (Fastify + WebSockets)     (ই-প্রেসক্রিপশন, রিকল SMS)
                                      ▲
                                      │
[ ক্লিনিক সেন্ট্রাল ড্যাশবোর্ড ] ───────┴──────► [ ওয়েটিং রুম টিভি ডিসপ্লে ]
(ফুটফল অ্যানালিটিক্স, নোটিশ)                     (লাইভ বড় টোকেন স্ক্রিন)
```

1. **Patient App (Bangla-First PWA):** Real-time GPS chamber locator, live countdown ticket ("বর্তমানে সিরিয়াল ৫ ভেতরে, আপনার সিরিয়াল ১২, বাকি ৭ জন"), proximity check-in ("✓ আমি পৌঁছেছি"), and Digital Health Vault.
2. **Compounder Tablet Registry:** Zero-training big buttons (`পরবর্তী রোগী ডাকুন`, `ভিজিট সম্পন্ন`, `অনুপস্থিত`, `হোল্ড`). Walk-in, phone, and online bookings merge into a single master sheet.
3. **Doctor Portal (Quick Rx):** 45-second prescription generator with top BD pharma brands (Square, Beximco, Incepta) and automated follow-up recall SMS scheduler.
4. **Waiting Room Live TV Screen:** Replaces chaotic shouting with large, high-visibility digital token announcements.

---

## Slide 4: Our 3 Unbreakable Moats
### Why DocBD Wins Doctor and Hospital Trust Where Others Failed

1. **Chamber-First, Not Video-Call Broker:**
   * 90%+ of primary consultations in Bangladesh require physical palpation, stethoscope auscultation, and face-to-face diagnosis.
   * Telemedicine is strictly relegated to quick follow-up reviews.
2. **"ডাক্তারের রোগী ডাক্তারেরই" (Strict Non-Poaching Charter):**
   * *The HotDoc Scandal Lesson:* HotDoc suffered severe backlash when it lured patients away from their GP to competitor clinics.
   * *DocBD Rule:* A patient booking Dr. Rafiqul will **never** see ads or recommendations for competing cardiologists. The doctor's patient relationship remains 100% sacred and protected.
3. **Hyper-Accessible Bangla & Cash Default:**
   * **Easy Mode (সহজ মোড):** 20% larger high-contrast fonts and voice guides for elderly patients.
   * **No Forced Pre-Payment:** 85%+ of Bangladesh patients prefer paying cash at the counter. DocBD defaults to "চেম্বারে নগদ পরিশোধ" with optional bKash/Nagad.
   * **Zero Patient Booking Fee:** Booking is 100% free for patients.

---

## Slide 5: Market Opportunity (TAM / SAM / SOM)
### Backed by Official DGHS & Bangladesh Health Economics Data

* **Total Addressable Market (TAM):**
  * **15,143** DGHS-registered private healthcare facilities across Bangladesh (5,461 private hospitals/clinics + 9,097 diagnostic centers + 585 blood banks).
  * **134,568** Registered BMDC doctors.
  * **BDT 533 Billion (53,300 কোটি টাকা):** Bangladesh household out-of-pocket health expenditure in 2020 (Bangladesh National Health Accounts, MOHFW).
* **Serviceable Addressable Market (SAM) — Dhaka Division:**
  * **2,300+** Private hospitals, clinics, and consultation diagnostic complexes in Dhaka city.
  * **~25,000** Active chamber-consulting doctors.
  * Total SAM Value: **BDT 212 Crore / year** in potential software subscription & transaction value.
* **Serviceable Obtainable Market (SOM) — 18-Month Target:**
  * **Cluster Focus:** Dhanmondi, Panthapath, Green Road, and Shantinagar medical hubs.
  * **Target:** 250 active chambers across 15 premier diagnostic hospitals (Popular, Ibn Sina, Labaid, Green Life).
  * SOM ARR Target: **BDT 2.3 Crore (~USD 195,000)**.

---

## Slide 6: Product Traction & Prototype Validation
### Ready-to-Deploy Working Software (Zero Technical Debt)

* **Interactive Prototype Built:** Complete multi-role PWA running with sub-second WebSocket sync between Patient, Compounder, Doctor, and TV screens.
* **Pilot Diagnostic Partnership Pipeline:**
  * Active pitch proposals prepared for Dhanmondi medical cluster.
  * 60-day zero-risk pilot model with dedicated onboarding champions (Medical Scribe / Tech Concierge).
* **Key User Experience Innovations:**
  * **Geofence Check-in:** 200m radius prompt alerts compounder that the patient has physically arrived, eliminating "phantom" waiting room seats.
  * **Doctor Delay Broadcast:** Compounder triggers 1-click bulk SMS to all waiting patients if doctor is stuck in Dhaka traffic ("ডাক্তার সন্ধ্যা ৭:৩০-এর পরিবর্তে রাত ৮:০০টায় শুরু করবেন").

---

## Slide 7: Business Model & Unit Economics
### High-Margin B2B SaaS + Hospital Enterprise Tier

| Package | Monthly Fee | Target Audience | Key Deliverables |
|---|---|---|---|
| **চেম্বার বেসিক** | **৳ ১,৯৯৯ / মাস** | একক স্বাধীন চেম্বার (ডাক্তার) | ডিজিটাল খাতা, লাইভ সিরিয়াল, ৫০০টি ফ্রি SMS |
| **চেম্বার প্রো** (Core) | **৳ ৪,৯৯৯ / মাস** | ব্যস্ত বিশেষজ্ঞ ডাক্তার | আনলিমিটেড লাইভ কিউ, ই-প্রেসক্রিপশন, পেশেন্ট ভল্ট, ২,৫০০ SMS |
| **হাসপাতাল এন্টারপ্রাইজ** | **৳ ২৫,০০০ – ৫০,০০০ / মাস** | ডায়াগনস্টিক ও প্রাইভেট হাসপাতাল | সেন্ট্রাল ওপিডি ড্যাশবোর্ড, উইজেট, আনলিমিটেড ডাক্তার, টিভি সিস্টেম |

#### Attractive Unit Economics (Per Chamber Pro):
* **Blended ARPU:** **BDT 7,699 / month** ($64/mo)
* **Customer Acquisition Cost (CAC):** **BDT 6,550** (Field rep sales + tablet stand incentive)
* **Payback Period:** **0.85 Months (< 26 days)**
* **Lifetime Value (LTV):** **BDT 92,388** (Assuming 24-month lifespan at <3% churn)
* **LTV : CAC Ratio:** **14.1 : 1** (Industry benchmark is 3:1)

---

## Slide 8: Competitive Landscape & Advantage Matrix

| Feature / Capability | **DocBD** | **DocTime** | **Doctorola** | **Praava Health** |
|---|:---:|:---:|:---:|:---:|
| **Core Focus** | **শারীরিক চেম্বার ও ওপিডি** | ভিডিও টেলিমেডিসিন | অনলাইন ডিরেক্টরি | নিজস্ব ক্লিনিক চেইন |
| **কম্পাউন্ডার লাইভ খাতা** | **✓ রিয়েল-টাইম ট্যাবলেট** | ✕ নেই | ✕ নেই | নিজস্ব অভ্যন্তরীণ |
| **লাইভ কিউ কাউন্টডাউন** | **✓ সেকেন্ডে সিঙ্ক** | ✕ নেই | ✕ নেই | ✕ আংশিক |
| **ডাক্তার সুরক্ষা (Non-poaching)** | **✓ লিখিত নন-পোচিং চার্টার** | ✕ রোগী রিডাইরেক্ট করে | ✕ বিকল্প ডাক্তার দেখায় | ✕ শুধুমাত্র নিজস্ব ডাক্তার |
| **পেমেন্ট স্বাধীনতা** | **✓ চেম্বারে ক্যাশ ডিফল্ট** | ✕ বাধ্যতামূলক প্রি-পেমেন্ট | ✕ ম্যানুয়াল | ✕ সেন্ট্রাল ক্যাশিয়ার |
| **সহজ মোড (Bangla Easy Mode)** | **✓ ভয়েস ও বড় ফন্ট** | ✕ জটিল UI | ✕ সীমিত | ✕ মোবাইল বান্ধব নয় |
| **ক্লিনিক উইজেট ও টিভি স্ক্রিন** | **✓ অন্তর্নির্মিত** | ✕ নেই | ✕ নেই | ✕ নেই |

---

## Slide 9: 18-Month Financial Projection & Milestones

```
[Month 1–3] ──► [Month 4–6] ──► [Month 7–12] ──► [Month 13–18]
Phase 0 & 1      Phase 2          Phase 3          Phase 4
Dhanmondi Pilot  50 Chambers      150 Chambers     300 Chambers + 20 Hospitals
MOM Cashflow:    Break-Even Path  MRR: ৳ 11.5L     ARR: ৳ 2.76 Crore ($230k)
```

### Key Milestones:
* **Month 3:** Complete 60-day pilot with 10 Dhanmondi chambers; achieve >80% compounder adoption and zero pilot cancellations.
* **Month 6:** Expand to 50 paying chambers across Dhanmondi and Panthapath. Launch Hospital Enterprise tier with 2 diagnostic brands.
* **Month 12:** 150 active chambers, 8 diagnostic centers. Operational Break-even achieved.
* **Month 18:** 300+ chambers, 20 hospitals. Expansion into Chittagong & Sylhet clusters. Ready for USD $500k Series Seed / Pre-A.

---

## Slide 10: The Ask & Use of Funds
### Raising BDT ৫০,০০,০০০ (Fifty Lakh Taka) for 10% Equity

```
┌────────────────────────────────────────────────────────┐
│               USE OF SEED FUNDS (BDT 50L)              │
├────────────────────────────────────────────────────────┤
│ ■ ৪৪% (৳ ২২,০০,০০০) — ইঞ্জিনিয়ারিং ও রিয়েল-টাইম প্ল্যাটফর্ম  │
│ ■ ২৮% (৳ ১৪,০০,০০০) — ফিল্ড সেলস, অনবোর্ডিং ও কনসিয়ার্জ     │
│ ■ ১৪% (৳ ৭,০০,০০০)  — ট্যাবলেট ও টিভি ডিসপ্লে ড্রাইভ হার্ডওয়্যার │
│ ■ ৮%  (৳ ৪,০০,০০০)  — টেলকো SMS গেটওয়ে ও ক্লাউড অবকাঠামো  │
│ ■ ৬%  (৳ ৩,০০,০০০)  — আইনি কমপ্লায়েন্স ও ট্রেড লাইসেন্স      │
└────────────────────────────────────────────────────────┘
```

### Why Invest Now?
1. **First Mover in Chamber-First HealthTech:** While others compete for video telemedicine, Bangladesh's massive physical OPD space remains unorganized.
2. **Founder-Market Fit:** Deep understanding of Bangladesh clinic dynamics, compounder psychology, and DGHS regulatory landscape.
3. **De-risked Execution:** The software is already built and working. 100% of seed capital goes directly to clinic customer acquisition and field deployment.

**Contact Founders:**  
Email: `invest@docbd.com` | Hotline: `+880 1711-234567` | Web: `https://docbd.com`
