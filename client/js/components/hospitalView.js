// Hospital OPD Admin Dashboard Component — Multi-Tenant Hospital Management
import { playBeepSound } from '../services/audioService.js';
import { showToast } from '../utils/toast.js';

export function renderHospitalDashboard(analytics = {}, hospitals = [], selectedHospitalId = null) {
  // 1. Hospital Selector and Profile
  const hospSelect = document.getElementById('hosp-admin-selector');
  const hospTitle = document.getElementById('hosp-admin-title');
  const hospSubtitle = document.getElementById('hosp-admin-subtitle');
  const hospAdminBadge = document.getElementById('hosp-admin-info-badge');

  if (hospSelect && hospitals.length > 0) {
    hospSelect.innerHTML = hospitals.map(h => `
      <option value="${h.id}" ${h.id === selectedHospitalId ? 'selected' : ''}>
        ${h.name} (${h.branch || h.thana || 'ঢাকা'})
      </option>
    `).join('');
  }

  const currentHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || {};
  if (hospTitle && currentHospital.name) {
    hospTitle.innerText = `${currentHospital.name} — ওপিডি অ্যাডমিন কন্ট্রোল`;
  }
  if (hospSubtitle && currentHospital.name) {
    hospSubtitle.innerText = `${currentHospital.branch || ''} • ডিজিএইচএস নম্বর: ${currentHospital.dghsRegNo || 'অনুমোদিত'} • হটলাইন: ${currentHospital.contactPhone || '১৬২৬৩'}`;
  }
  if (hospAdminBadge && currentHospital.adminName) {
    hospAdminBadge.innerHTML = `
      <span>দায়িত্বপ্রাপ্ত অ্যাডমিন: <strong>${currentHospital.adminName}</strong> (${currentHospital.adminEmail})</span>
    `;
  }

  // 2. Update KPI Stat Cards
  const kpiTotal = document.getElementById('kpi-total-patients');
  const kpiWaiting = document.getElementById('kpi-waiting-patients');
  const kpiCompleted = document.getElementById('kpi-completed-patients');
  const kpiRevenue = document.getElementById('kpi-revenue');

  // Filter chambers belonging to this hospital if selected
  const allChambers = analytics.chamberBreakdown || [];
  const hospitalChambers = selectedHospitalId && selectedHospitalId !== 'all'
    ? allChambers.filter(c => c.hospitalId === selectedHospitalId || (currentHospital.name && c.hospitalName && c.hospitalName.includes(currentHospital.name.split(' ')[0])))
    : allChambers;

  const totalPatients = hospitalChambers.reduce((s, c) => s + (c.totalPatients || 0), 0);
  const totalWaiting = hospitalChambers.reduce((s, c) => s + (c.waiting || 0), 0);
  const totalDone = hospitalChambers.reduce((s, c) => s + (c.done || 0), 0);
  const totalRev = hospitalChambers.reduce((s, c) => s + (c.revenue || 0), 0);

  if (kpiTotal) kpiTotal.innerText = `${totalPatients} জন`;
  if (kpiWaiting) kpiWaiting.innerText = `${totalWaiting} জন`;
  if (kpiCompleted) kpiCompleted.innerText = `${totalDone} জন`;
  if (kpiRevenue) kpiRevenue.innerText = `৳ ${totalRev.toLocaleString('en-US')}`;

  // 3. Render Hospital Doctors & Chambers Roster
  const rosterTbody = document.getElementById('hosp-roster-tbody');
  if (!rosterTbody) return;

  if (hospitalChambers.length === 0) {
    rosterTbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-row">
          <div style="padding: 24px; text-align: center;">
            <strong style="color: #1e293b; font-size: 1rem;">এই হাসপাতালে এখনও কোনো ডাক্তার বা চেম্বার তৈরি করা হয়নি।</strong>
            <p style="margin: 6px 0 16px; font-size:0.85rem; color: #64748b;">
              হাসপাতাল অ্যাডমিন হিসেবে আপনি এই হাসপাতালের জন্য নতুন বিশেষজ্ঞ ডাক্তার ও কনসালটেশন চেম্বার নিবন্ধন করতে পারেন।
            </p>
            <button class="btn-comp-action btn-primary" onclick="window.DocBD.openDoctorRegisterModal('${currentHospital.id}')" style="padding: 9px 18px; font-size: 0.875rem;">
              + এই হাসপাতালে নতুন ডাক্তার ও চেম্বার যুক্ত করুন
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  rosterTbody.innerHTML = '';
  hospitalChambers.forEach(ch => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="hosp-doc-name">${ch.docName}</div>
        <div class="hosp-doc-sub">${ch.degree || 'MBBS'} • বিএমডিসি: ${ch.bmdcRegNo || ch.bmdc || 'যাচাইকৃত'}</div>
      </td>
      <td><span class="badge-dept dept-cardiology">${ch.specialty || 'ওপিডি চেম্বার'}</span></td>
      <td><strong>${ch.room || 'কক্ষ ১'}</strong></td>
      <td><strong>${ch.totalPatients || 0} জন</strong> (${ch.waiting || 0} অপেক্ষমাণ)</td>
      <td><strong class="text-accent">${ch.currentInsideSerial && ch.currentInsideSerial !== '—' ? `টোকেন #${ch.currentInsideSerial}` : 'চেম্বার প্রস্তুত'}</strong></td>
      <td>
        <span class="badge-status-pill ${ch.currentInsideSerial && ch.currentInsideSerial !== '—' ? 'status-active' : 'status-scheduled'}">
          ${ch.currentInsideSerial && ch.currentInsideSerial !== '—' ? '🟢 লাইভ চলছে' : '🕒 চেম্বার প্রস্তুত'}
        </span>
      </td>
      <td>
        <button class="btn-table-action" onclick="window.DocBD.switchChamber('${ch.chamberId}')">
          সিরিয়াল মনিটর ➔
        </button>
      </td>
    `;
    rosterTbody.appendChild(tr);
  });
}

export function broadcastHospitalAnnouncement() {
  const msg = prompt('হাসপাতাল নোটিশ লিখুন:', 'পপুলার ধানমন্ডি: আজ সন্ধ্যা ৭:৩০ টায় ওপিডি-২ এ বিশেষায়িত মেডিকেল স্ক্রিনিং অনুষ্ঠিত হবে।');
  if (msg) {
    playBeepSound();
    showToast(`হাসপাতাল কেন্দ্রীয় নোটিশ ব্রডকাস্ট সম্পন্ন: "${msg}"`, true);
  }
}
