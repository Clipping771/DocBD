// Hospital Central OPD Dashboard Component — Clean Healthcare Enterprise Analytics
import { playBeepSound } from '../services/audioService.js';
import { showToast } from '../utils/toast.js';

export function renderHospitalDashboard(analytics = {}, isDemo = false) {
  // 1. Update KPI Stat Cards
  const kpiTotal = document.getElementById('kpi-total-patients');
  const kpiWaiting = document.getElementById('kpi-waiting-patients');
  const kpiCompleted = document.getElementById('kpi-completed-patients');
  const kpiRevenue = document.getElementById('kpi-revenue');

  if (kpiTotal) kpiTotal.innerText = `${analytics.totalRegistered || 0} জন`;
  if (kpiWaiting) kpiWaiting.innerText = `${analytics.totalWaiting || 0} জন`;
  if (kpiCompleted) kpiCompleted.innerText = `${analytics.totalDone || 0} জন`;
  if (kpiRevenue) kpiRevenue.innerText = `৳ ${(analytics.totalRevenue || 0).toLocaleString('en-US')}`;

  // 2. Render Real Chamber Roster
  const rosterTbody = document.getElementById('hosp-roster-tbody');
  if (!rosterTbody) return;

  const chambers = analytics.chamberBreakdown || [];

  if (chambers.length === 0) {
    rosterTbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-row">
          <div style="padding: 16px;">
            <strong>বর্তমানে কোনো সক্রিয় চেম্বার নিবন্ধিত নেই।</strong>
            <p style="margin: 6px 0 12px; font-size:0.85rem;">রিয়েল হাসপাতাল মোডে নতুন ডাক্তার যুক্ত করতে নিচের বাটনে চাপ দিন।</p>
            <button class="btn-comp-action btn-primary" onclick="window.DocBD.openDoctorRegisterModal()">
              + নতুন ডাক্তার ও চেম্বার নিবন্ধন করুন
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  rosterTbody.innerHTML = '';
  chambers.forEach(ch => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="hosp-doc-name">${ch.docName}</div>
        <div class="hosp-doc-sub">চেম্বার আইডি: ${ch.chamberId}</div>
      </td>
      <td><span class="badge-dept dept-cardiology">ওপিডি চেম্বার</span></td>
      <td>${ch.room}</td>
      <td><strong>${ch.totalPatients} জন</strong> (${ch.waiting} অপেক্ষমাণ)</td>
      <td><strong class="text-accent">${ch.currentInsideSerial !== '—' ? `টোকেন #${ch.currentInsideSerial}` : 'চেম্বার প্রস্তুত'}</strong></td>
      <td>
        <span class="badge-status-pill ${ch.currentInsideSerial !== '—' ? 'status-active' : 'status-scheduled'}">
          ${ch.currentInsideSerial !== '—' ? '🟢 লাইভ চলছে' : '🕒 প্রস্তুত হচ্ছে'}
        </span>
      </td>
      <td>
        <button class="btn-table-action" onclick="window.DocBD.switchChamber('${ch.chamberId}')">
          মনিটর ও খাতা
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
