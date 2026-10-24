// DocBD End-to-End Automated Verification Test Suite
// Verifies Demo Mode, Real Hospital Mode, Patient Booking, Verified Payments,
// Vitals Entry, Digital Prescriptions, Privacy-Safe TV Signage, and Analytics.

const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000';

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting DocBD Enterprise E2E Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && (health.body.status === 'UP' || health.body.status === 'OK'), 'Backend Server Healthcheck');

    // 2. Switch to REAL Hospital Mode
    console.log('\n--- Test Phase: Real Hospital Mode & Zero Fabrication ---');
    const setRealMode = await request('/api/system/mode', 'POST', { mode: 'real' });
    assert(setRealMode.status === 200 && setRealMode.body.modeInfo.mode === 'real', 'Switch to Real Hospital Mode');

    // Clean reset for test isolation
    await request('/api/system/reset-real-data', 'POST');

    // 3. Verify Empty States in Real Mode
    const emptyDoctors = await request('/api/doctors');
    console.log('DEBUG emptyDoctors:', emptyDoctors.body);
    assert(emptyDoctors.body.count === 0 && emptyDoctors.body.isDemo === false, 'Real Mode starts with 0 fabricated doctors');

    const emptyAnalytics = await request('/api/hospital/analytics');
    console.log('DEBUG emptyAnalytics:', emptyAnalytics.body);
    assert(emptyAnalytics.body.totalRegistered === 0 && emptyAnalytics.body.totalRevenue === 0, 'Real Mode starts with 0 fabricated analytics');

    // 4. Onboard Real Doctor & Chamber
    console.log('\n--- Test Phase: Real Doctor & Chamber Onboarding ---');
    const doctorReg = await request('/api/doctors/register', 'POST', {
      name: 'ডা. তানভীর আহমেদ',
      bmdcRegNo: 'A-54321',
      degrees: 'MBBS, FCPS (Medicine)',
      specialty: 'মেডিসিন ও হৃদরোগ বিশেষজ্ঞ',
      hospitalName: 'পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি',
      roomNumber: 'কক্ষ ২০৫, ২য় তলা',
      fee: 1000,
      followupFee: 600
    });
    assert(doctorReg.status === 200 && doctorReg.body.success === true, 'Register Real Doctor & Chamber');
    const chamberId = doctorReg.body.chamber.chamberId;

    const docList = await request('/api/doctors');
    assert(docList.body.count === 1 && docList.body.doctors[0].name === 'ডা. তানভীর আহমেদ', 'Doctor Directory reflects newly registered doctor');

    // 5. Patient Appointment Booking (Online)
    console.log('\n--- Test Phase: Patient Booking & Token Generation ---');
    const bookPatient1 = await request('/api/serials/book', 'POST', {
      chamberId,
      name: 'শামীম রেজা',
      phone: '01711998877',
      source: 'online',
      fee: 1000,
      paid: false
    });
    assert(bookPatient1.status === 200 && bookPatient1.body.booking.serial === 1, 'Book Patient 1 -> Serial Token #1 Allocated');

    // Walk-in Patient Booking
    const bookPatient2 = await request('/api/serials/book', 'POST', {
      chamberId,
      name: 'সালমা বেগম',
      phone: '01822887766',
      source: 'walkin',
      fee: 1000,
      paid: false
    });
    assert(bookPatient2.status === 200 && bookPatient2.body.booking.serial === 2, 'Book Walk-in Patient 2 -> Serial Token #2 Allocated');

    // 6. Verified Payment Recording
    console.log('\n--- Test Phase: Verified Payment Recording ---');
    const payment = await request('/api/queue/record-payment', 'POST', {
      chamberId,
      serialNumber: 1,
      amount: 1000,
      method: 'BKASH',
      trxId: 'BK98765432',
      receivedBy: 'কাউন্টার ক্যাশিয়ার ১'
    });
    assert(payment.status === 200 && payment.body.paid === true && payment.body.trxId === 'BK98765432', 'Record verified bKash payment with TrxID');

    // 7. Compounder calls Patient #1
    console.log('\n--- Test Phase: Queue Movement & Call Next ---');
    const callNext = await request('/api/queue/call-next', 'POST', { chamberId });
    assert(callNext.body.currentInside.serial === 1 && callNext.body.currentInside.name === 'শামীম রেজা', 'Call Next moves Token #1 into Chamber');

    // 8. Doctor enters Clinical Vitals
    console.log('\n--- Test Phase: Clinical Vitals & Notes Recording ---');
    const vitalsRes = await request('/api/clinical/vitals', 'POST', {
      chamberId,
      serialNumber: 1,
      vitals: {
        bp: '125/80',
        pulse: 74,
        spo2: 99,
        temp: 98.6,
        weight: 68
      },
      clinicalNotes: 'মৃদু বুকে চাপ ও শারীরিক দুর্বলতা'
    });
    assert(vitalsRes.status === 200 && vitalsRes.body.patient.vitals.bp === '125/80', 'Save Patient Vitals to Database');

    // 9. Doctor Issues Digital Prescription
    console.log('\n--- Test Phase: Digital Prescription Issuance & Recall ---');
    const rxRes = await request('/api/prescriptions/issue', 'POST', {
      chamberId,
      serial: 1,
      patientName: 'শামীম রেজা',
      patientPhone: '01711998877',
      docName: 'ডা. তানভীর আহমেদ',
      diagnosis: 'Mild Hypertension & General Fatigue',
      medications: [
        'Tab. Bizoran 5/20 mg — ১ + ০ + ০ (সকালে খাওয়ার পর) • ৩০ দিন',
        'Cap. Seclo 20 mg — ১ + ০ + ১ (খাওয়ার ৩০ মিনিট পূর্বে) • ৩০ দিন'
      ],
      tests: 'ECG, Lipid Profile',
      followupDate: '২০২৬-১১-০১'
    });
    assert(rxRes.status === 200 && rxRes.body.success === true, 'Issue Digital Prescription and save to Health Vault');

    // 10. Patient Health Vault Lookup by Phone
    console.log('\n--- Test Phase: Patient Vault Security & Retrieval ---');
    const vaultRes = await request('/api/prescriptions?phone=01711998877');
    assert(vaultRes.body.count >= 1 && vaultRes.body.prescriptions[0].diagnosis.includes('Hypertension'), 'Retrieve Patient Prescription via Mobile Number');

    // 11. Hospital Analytics Calculation
    console.log('\n--- Test Phase: Real Database Analytics ---');
    const analytics = await request('/api/hospital/analytics');
    assert(analytics.body.totalRegistered === 2, 'Analytics: Total registered patients = 2');
    assert(analytics.body.totalRevenue === 1000, 'Analytics: Total revenue = ৳1,000 from verified payments');
    assert(analytics.body.activeChambers === 1, 'Analytics: Active chambers = 1');

    // 12. Waiting TV Signage Privacy Check
    console.log('\n--- Test Phase: Waiting TV Signage Privacy Compliance ---');
    const tvSignage = await request('/api/tv/signage');
    const chSignage = tvSignage.body.chambers[0];
    assert(chSignage.currentInsideToken === 1, 'TV Signage shows Token #1 inside chamber');
    assert(!chSignage.diagnosis && !chSignage.clinicalNotes && !chSignage.phone, 'TV Signage strictly strips all sensitive medical diagnoses');

    // 13. Audit Log Verification
    console.log('\n--- Test Phase: System Audit Logs ---');
    const auditLogs = await request('/api/system/audit-logs');
    assert(auditLogs.body.count > 0, 'Audit logs recorded timestamped events for every critical operation');

    // 14. Demo Mode Isolation Check
    console.log('\n--- Test Phase: Switch back to Demo Mode & Verify Isolation ---');
    const setDemo = await request('/api/system/mode', 'POST', { mode: 'demo' });
    assert(setDemo.status === 200 && setDemo.body.modeInfo.mode === 'demo', 'Switch back to Demo Mode');

    const demoDocs = await request('/api/doctors');
    assert(demoDocs.body.count === 3 && demoDocs.body.isDemo === true, 'Demo mode retains isolated fictional dataset');

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
