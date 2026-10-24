// Doctor Portal Component — Clean Medical Records & e-Prescription
import { apiSaveClinicalVitals, apiIssuePrescription } from '../services/apiService.js';
import { showToast } from '../utils/toast.js';

let activeInsidePatient = null;
let activeChamber = null;

export function updateDoctorPortalView(currentInside, chamberState) {
  activeInsidePatient = currentInside;
  activeChamber = chamberState;

  const docPatientName = document.getElementById('doc-patient-name');
  const vitalsGrid = document.querySelector('.vitals-grid');
  const btnIssue = document.querySelector('.btn-issue-prescription');

  if (!currentInside) {
    if (docPatientName) {
      docPatientName.innerText = 'চেম্বার প্রস্তুত (রোগী অপেক্ষমাণ নেই)';
      docPatientName.className = 'active-patient-badge empty';
    }
    if (vitalsGrid) {
      vitalsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 14px; text-align: center; color: #64748b; font-size: 0.85rem; background:#f8fafc; border-radius:6px;">
          বর্তমানে চেম্বারে কোনো রোগী নেই। কম্পাউন্ডার ডেস্ক থেকে <strong>'পরবর্তী রোগী ডাকুন'</strong> চাপুন।
        </div>
      `;
    }
    return;
  }

  // Active patient inside
  if (docPatientName) {
    docPatientName.innerText = `${currentInside.name} (টোকেন #${currentInside.serial}) • ${currentInside.phone}`;
    docPatientName.className = 'active-patient-badge';
  }

  const v = currentInside.vitals || { bp: '120/80', pulse: 76, spo2: 98, temp: 98.6, weight: 65 };

  if (vitalsGrid) {
    vitalsGrid.innerHTML = `
      <div class="vital-item">
        <span class="v-label">ব্লাড প্রেসার</span>
        <input type="text" id="vital-bp" value="${v.bp}" style="width:100%; font-weight:700; border:none; background:transparent; font-size:1.1rem; color:#dc2626; outline:none;" placeholder="120/80">
        <small>mmHg</small>
      </div>
      <div class="vital-item">
        <span class="v-label">পালস রেট</span>
        <input type="number" id="vital-pulse" value="${v.pulse}" style="width:100%; font-weight:700; border:none; background:transparent; font-size:1.1rem; color:#059669; outline:none;" placeholder="76">
        <small>bpm</small>
      </div>
      <div class="vital-item">
        <span class="v-label">SpO2 লেভেল</span>
        <input type="number" id="vital-spo2" value="${v.spo2}" style="width:100%; font-weight:700; border:none; background:transparent; font-size:1.1rem; color:#2563eb; outline:none;" placeholder="98">
        <small>% স্বাভাবিক</small>
      </div>
      <div class="vital-item">
        <span class="v-label">তাপমাত্রা / ওজন</span>
        <input type="text" id="vital-temp-weight" value="${v.temp}°F / ${v.weight}kg" style="width:100%; font-weight:700; border:none; background:transparent; font-size:0.95rem; color:#0f172a; outline:none;">
        <small>Temp / Wt</small>
      </div>
    `;
  }
}

export async function saveActiveVitals() {
  if (!activeInsidePatient) {
    showToast('চেম্বারে কোনো সক্রিয় রোগী নেই', false);
    return;
  }

  const bp = document.getElementById('vital-bp')?.value || '120/80';
  const pulse = document.getElementById('vital-pulse')?.value || 76;
  const spo2 = document.getElementById('vital-spo2')?.value || 98;
  const chamberId = activeChamber?.chamberId || 'ch-pop-302';

  try {
    await apiSaveClinicalVitals({
      chamberId,
      serialNumber: activeInsidePatient.serial,
      vitals: { bp, pulse, spo2, temp: 98.6, weight: 65 }
    });
    showToast(`রোগীর ভাইটাল সাইনস (BP ${bp}, Pulse ${pulse}) সফলভাবে সংরক্ষিত হয়েছে`);
  } catch (e) {
    showToast(`ভাইটাল সাইন সংরক্ষণ ত্রুটি: ${e.message}`, false);
  }
}

export function addMedicineToPrescription() {
  const medSelect = document.getElementById('rx-med-select');
  const doseSelect = document.getElementById('rx-dose-select');
  const timingSelect = document.getElementById('rx-timing-select');
  const list = document.getElementById('prescribed-med-list');

  const medText = medSelect.value;
  const doseText = doseSelect.value;
  const timingText = timingSelect.value;

  const li = document.createElement('li');
  li.className = 'rx-med-item';
  li.innerHTML = `
    <div class="rx-med-info">
      <strong>${medText}</strong>
      <span>${doseText} (${timingText}) • ৩০ দিন</span>
    </div>
    <button class="btn-del-rx" title="ওষুধ বাদ দিন" onclick="window.DocBD.removeMed(this)">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  list.appendChild(li);
  showToast(`প্রেসক্রিপশনে ${medText} যুক্ত হয়েছে`);
}

export function removeMed(btn) {
  btn.closest('li').remove();
  showToast('প্রেসক্রিপশন থেকে ওষুধ অপসারণ করা হয়েছে');
}

export async function handleIssuePrescription() {
  if (!activeInsidePatient) {
    showToast('চেম্বারে কোনো সক্রিয় রোগী নেই। প্রেসক্রিপশন তৈরি করা যাচ্ছে না।', false);
    return;
  }

  const diagnosis = document.getElementById('rx-diagnosis')?.value || "সাধারণ স্বাস্থ্য পরামর্শ";
  const tests = document.getElementById('rx-tests')?.value || "প্রয়োজন নেই";
  const followupDate = document.getElementById('rx-followup-date')?.value || "২০২৬-১০-৩০";
  
  // Extract prescribed meds
  const medItems = document.querySelectorAll('#prescribed-med-list .rx-med-item');
  const medications = [];
  medItems.forEach(item => {
    const name = item.querySelector('strong')?.innerText;
    const rule = item.querySelector('span')?.innerText;
    if (name) medications.push(`${name} — ${rule}`);
  });

  if (medications.length === 0) {
    medications.push("Tab. Napa 500mg — ১ + ০ + ১ (খাবারের পর)");
  }

  const chamberId = activeChamber?.chamberId || 'ch-pop-302';

  try {
    const res = await apiIssuePrescription({
      chamberId,
      serial: activeInsidePatient.serial,
      patientName: activeInsidePatient.name,
      patientPhone: activeInsidePatient.phone,
      docName: activeChamber?.docName || "চিকিৎসক",
      diagnosis,
      medications,
      tests,
      followupDate
    });

    if (res.success) {
      showToast(`ডিজিটাল প্রেসক্রিপশন তৈরি সম্পন্ন এবং ${activeInsidePatient.name}-এর ভল্টে সংরক্ষিত হয়েছে!`);
      // Automatically finish visit and call next
      window.DocBD.callNext();
    }
  } catch (e) {
    showToast(`প্রেসক্রিপশন ইস্যু ত্রুটি: ${e.message}`, false);
  }
}
