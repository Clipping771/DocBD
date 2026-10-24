// Modals Component — Professional Healthcare Interface
import { playBeepSound } from '../services/audioService.js';
import { showToast } from '../utils/toast.js';
import { apiRecordVerifiedPayment, apiRegisterDoctor, fetchPrescriptions } from '../services/apiService.js';

let callTimerInterval = null;
let callSeconds = 0;
let pendingPaymentData = null;

// 1. Booking Modal
export function openBookingModal(docChamberId, doctors, onSelect) {
  const doc = doctors.find(d => (d.chamberId === docChamberId || d.id === docChamberId)) || doctors[0];
  if (doc && onSelect) onSelect(doc);

  const nameElem = document.getElementById('bm-doc-name');
  const chamberElem = document.getElementById('bm-doc-chamber');
  if (nameElem && doc) nameElem.innerText = doc.name;
  if (chamberElem && doc) chamberElem.innerText = `${doc.hospital} • ${doc.time || doc.chamberRoom}`;
  
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('hidden');
}

// 2. Walk-in Modal
export function openWalkinModal() {
  const modal = document.getElementById('walkin-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeWalkinModal() {
  const modal = document.getElementById('walkin-modal');
  if (modal) modal.classList.add('hidden');
}

// 3. Verified Payment Recording Modal
export function openPaymentVerifyModal(serial, patientName, fee, isPaid) {
  pendingPaymentData = { serial, patientName, fee, isPaid };

  const modal = document.getElementById('payment-verify-modal');
  const serialSpan = document.getElementById('pv-serial');
  const nameSpan = document.getElementById('pv-patient-name');
  const amountInput = document.getElementById('pv-amount');
  const trxInput = document.getElementById('pv-trxid');

  if (serialSpan) serialSpan.innerText = `#${serial}`;
  if (nameSpan) nameSpan.innerText = patientName;
  if (amountInput) amountInput.value = fee;
  if (trxInput) trxInput.value = '';

  if (modal) modal.classList.remove('hidden');
}

export function closePaymentVerifyModal() {
  const modal = document.getElementById('payment-verify-modal');
  if (modal) modal.classList.add('hidden');
  pendingPaymentData = null;
}

export async function confirmVerifiedPayment() {
  if (!pendingPaymentData) return;

  const methodSelect = document.getElementById('pv-method');
  const amountInput = document.getElementById('pv-amount');
  const trxInput = document.getElementById('pv-trxid');
  const cashierInput = document.getElementById('pv-cashier');

  const method = methodSelect ? methodSelect.value : 'CASH';
  const amount = amountInput ? Number(amountInput.value) : pendingPaymentData.fee;
  const trxId = trxInput ? trxInput.value.trim() : '';
  const receivedBy = cashierInput ? cashierInput.value.trim() : 'কম্পাউন্ডার ডেস্ক';

  try {
    const res = await apiRecordVerifiedPayment({
      chamberId: window.DocBD.getActiveChamberId ? window.DocBD.getActiveChamberId() : 'ch-pop-302',
      serialNumber: pendingPaymentData.serial,
      amount,
      method,
      trxId,
      receivedBy
    });

    if (res.success) {
      playBeepSound();
      showToast(`টোকেন #${pendingPaymentData.serial}-এর ৳${amount} পেমেন্ট (${method}) সফলভাবে নিবন্ধিত হয়েছে`);
      closePaymentVerifyModal();
      window.DocBD.syncAllViews();
    }
  } catch (e) {
    showToast(`পেমেন্ট যাচাই ত্রুটি: ${e.message}`, false);
  }
}

// 4. Doctor & Chamber Onboarding Modal
export function openDoctorRegisterModal() {
  const modal = document.getElementById('doctor-register-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeDoctorRegisterModal() {
  const modal = document.getElementById('doctor-register-modal');
  if (modal) modal.classList.add('hidden');
}

export async function submitDoctorRegister() {
  const name = document.getElementById('reg-doc-name')?.value;
  const bmdc = document.getElementById('reg-doc-bmdc')?.value;
  const degrees = document.getElementById('reg-doc-degree')?.value;
  const specialty = document.getElementById('reg-doc-spec')?.value;
  const hospital = document.getElementById('reg-doc-hosp')?.value;
  const room = document.getElementById('reg-doc-room')?.value;
  const fee = document.getElementById('reg-doc-fee')?.value;

  if (!name || !bmdc || !specialty) {
    showToast('ডাক্তারের নাম, বিএমডিসি কোড এবং বিশেষত্ব আবশ্যক', false);
    return;
  }

  try {
    const res = await apiRegisterDoctor({
      name,
      bmdcRegNo: bmdc,
      degrees,
      specialty,
      hospitalName: hospital || "পপুলার ডায়াগনস্টিক সেন্টার",
      roomNumber: room || "কক্ষ ১০১",
      fee: Number(fee) || 1000
    });

    if (res.success) {
      playBeepSound();
      showToast(`ডা. ${name} ও নতুন চেম্বার সফলভাবে নিবন্ধিত হয়েছে!`);
      closeDoctorRegisterModal();
      window.DocBD.reloadDoctorsAndDirectory();
    }
  } catch (e) {
    showToast(`নিবন্ধন ব্যর্থ: ${e.message}`, false);
  }
}

// 5. Health Vault Modal (With Phone Lookup)
export async function openVaultModal(currentPhone = '') {
  const modal = document.getElementById('vault-modal');
  const phoneInput = document.getElementById('vault-lookup-phone');
  if (phoneInput && currentPhone) phoneInput.value = currentPhone;

  if (modal) modal.classList.remove('hidden');
  await searchPrescriptionVault();
}

export function closeVaultModal() {
  const modal = document.getElementById('vault-modal');
  if (modal) modal.classList.add('hidden');
}

export async function searchPrescriptionVault() {
  const phoneInput = document.getElementById('vault-lookup-phone');
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const vaultList = document.getElementById('vault-prescriptions-list');

  if (!vaultList) return;
  vaultList.innerHTML = '<div style="padding:14px; text-align:center; color:#64748b;">প্রেসক্রিপশন রেকর্ড লোড হচ্ছে...</div>';

  try {
    const res = await fetchPrescriptions(phone);
    const list = res.prescriptions || [];

    if (list.length === 0) {
      vaultList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: #64748b;">
          <strong>কোনো ডিজিটাল প্রেসক্রিপশন পাওয়া যায়নি</strong>
          <p style="font-size: 0.85rem; margin-top: 4px;">ডাক্তার কনসালটেশন সম্পন্ন করে প্রেসক্রিপশন ইস্যু করলে তা এখানে দেখতে পারবেন।</p>
        </div>
      `;
      return;
    }

    vaultList.innerHTML = '';
    list.forEach(rx => {
      const card = document.createElement('div');
      card.className = 'vault-rx-card';
      card.style.cssText = 'background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-bottom:12px;';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <strong style="color:#0f766e; font-size:1.05rem;">${rx.docName}</strong>
            <div style="font-size:0.8rem; color:#64748b;">${rx.hospitalName} • ${rx.chamberRoom || ''}</div>
          </div>
          <span style="font-size:0.75rem; background:#ecfdf5; color:#065f46; padding:3px 8px; border-radius:12px; font-weight:600;">
            ${rx.date}
          </span>
        </div>
        <div style="font-size:0.88rem; margin-bottom:8px;">
          <strong>ডায়াগনসিস:</strong> ${rx.diagnosis}
        </div>
        <div style="font-size:0.85rem; background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:10px; margin-bottom:8px;">
          <strong>ঔষধসমূহ:</strong>
          <ul style="margin:4px 0 0 18px; line-height:1.6;">
            ${Array.isArray(rx.medications) ? rx.medications.map(m => `<li>${m}</li>`).join('') : `<li>${rx.medications}</li>`}
          </ul>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:#64748b;">
          <span>ফলো-আপ: <strong>${rx.followupDate || 'প্রয়োজনে'}</strong></span>
          <button class="btn-table-action" onclick="window.print()">🖨️ প্রিন্ট / PDF</button>
        </div>
      `;
      vaultList.appendChild(card);
    });
  } catch (e) {
    vaultList.innerHTML = `<div style="padding:14px; color:#dc2626; text-align:center;">রেকর্ড লোড ত্রুটি: ${e.message}</div>`;
  }
}

export function markDoseTaken(btn) {
  const row = btn.closest('.alarm-row');
  if (row) row.className = 'alarm-row dose-taken';
  btn.outerHTML = '<span class="badge-taken-clean">✓ সেবন সম্পন্ন</span>';
  playBeepSound();
  showToast('ওষুধ সেবন তালিকাভুক্ত হয়েছে।');
}

// 6. Emergency Modal
export function openEmergencyModal() {
  const modal = document.getElementById('emergency-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeEmergencyModal() {
  const modal = document.getElementById('emergency-modal');
  if (modal) modal.classList.add('hidden');
}

export function simulateEmergencyCall(number, title) {
  playBeepSound();
  closeEmergencyModal();
  showToast(`জরুরি সংযোগ: ${title} (${number})-এ ডায়াল করা হচ্ছে...`, true);
  window.location.href = `tel:${number}`;
}

// 7. Video Call Modal
export function startVideoCall() {
  const modal = document.getElementById('video-call-modal');
  if (modal) modal.classList.remove('hidden');
  callSeconds = 0;
  const timerElem = document.getElementById('call-timer');
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const secs = String(callSeconds % 60).padStart(2, '0');
    if (timerElem) timerElem.innerText = `${mins}:${secs}`;
  }, 1000);
}

export function endVideoCall() {
  clearInterval(callTimerInterval);
  const modal = document.getElementById('video-call-modal');
  if (modal) modal.classList.add('hidden');
  showToast('টেলিমেডিসিন ভিডিও কল সম্পন্ন হয়েছে');
}

export function toggleMic(btn) {
  btn.classList.toggle('active');
  showToast('মাইক্রোফোন স্ট্যাটাস পরিবর্তিত হয়েছে');
}

export function toggleCam(btn) {
  btn.classList.toggle('active');
  showToast('ক্যামেরা স্ট্যাটাস পরিবর্তিত হয়েছে');
}

// 8. Widget Modal
export function openWidgetModal() {
  const modal = document.getElementById('widget-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeWidgetModal() {
  const modal = document.getElementById('widget-modal');
  if (modal) modal.classList.add('hidden');
}

export function copyWidgetCode() {
  const textarea = document.getElementById('widget-embed-code');
  if (textarea) {
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    showToast('উইজেট কোড ক্লিপবোর্ডে কপি হয়েছে');
  }
}
