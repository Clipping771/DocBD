// System Super Admin Component — DocBD Multi-Tenant Platform Administration
import { showToast } from '../utils/toast.js';
import { fetchSuperMetrics, apiCreateHospital, apiUpdateHospitalAdmin } from '../services/apiService.js';

export function renderSuperAdminDashboard(metrics = {}) {
  const kpiHosp = document.getElementById('sa-kpi-hospitals');
  const kpiAdmins = document.getElementById('sa-kpi-admins');
  const kpiDocs = document.getElementById('sa-kpi-doctors');
  const kpiPatients = document.getElementById('sa-kpi-patients');
  const kpiRevenue = document.getElementById('sa-kpi-revenue');

  if (kpiHosp) kpiHosp.innerText = `${metrics.totalHospitals || 0} টি`;
  if (kpiAdmins) kpiAdmins.innerText = `${metrics.totalHospitalAdmins || 0} জন`;
  if (kpiDocs) kpiDocs.innerText = `${metrics.totalDoctors || 0} জন`;
  if (kpiPatients) kpiPatients.innerText = `${metrics.totalQueues || 0} জন`;
  if (kpiRevenue) kpiRevenue.innerText = `৳ ${(metrics.totalRevenue || 0).toLocaleString('en-US')}`;

  const tbody = document.getElementById('sa-hospital-table-body');
  if (!tbody) return;

  const hospitals = metrics.hospitals || [];
  if (hospitals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">
          কোনো হাসপাতাল এখনও নিবন্ধিত হয়নি। উপরের বাটন দিয়ে নতুন হাসপাতাল ও অ্যাডমিন তৈরি করুন।
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  hospitals.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong style="color: #0f172a; font-size: 0.95rem;">${h.name}</strong>
        <div style="font-size: 0.8rem; color: #64748b;">${h.branch || ''} • আইডি: ${h.id}</div>
      </td>
      <td>
        <span style="display:inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; background: #e0f2fe; color: #0369a1;">
          ${h.dghsRegNo || 'অনুমোদিত'}
        </span>
      </td>
      <td>
        <div style="font-size: 0.85rem; color: #334155;">${h.address || h.thana || 'ঢাকা'}</div>
        <small style="color: #64748b;">হটলাইন: ${h.contactPhone || h.emergencyPhone || '১৬২৬৩'}</small>
      </td>
      <td>
        <strong style="color: #0f766e; font-size: 0.9rem;">${h.adminName || 'নির্ধারিত হয়নি'}</strong>
        <div style="font-size: 0.8rem; color: #64748b;">${h.adminEmail || ''}</div>
        <small style="color: #475569;">${h.adminPhone || ''}</small>
      </td>
      <td>
        <span style="font-weight: 700; color: #1e293b;">${h.doctorCount || 0} জন</span>
        <div style="font-size: 0.75rem; color: #64748b;">কিউ: ${h.totalQueueCount || 0} রোগী</div>
      </td>
      <td>
        <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #ecfdf5; color: #047857;">
          সক্রিয় প্ল্যাটফর্ম
        </span>
      </td>
      <td>
        <button class="btn-table-action" onclick="window.DocBD.manageHospitalAsAdmin('${h.id}')" style="background:#0f766e; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600;">
          হাসপাতাল অ্যাডমিন পোর্টালে যান ➔
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
