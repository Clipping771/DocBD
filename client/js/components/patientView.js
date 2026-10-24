// Patient View Component — Professional Healthcare UI
import { playBeepSound } from '../services/audioService.js';
import { showToast } from '../utils/toast.js';

export function renderDoctorCards(docs, onSelect, isDemo = false) {
  const container = document.getElementById('doctor-list-container');
  const countElem = document.getElementById('doctor-count');
  if (!container) return;
  container.innerHTML = '';

  if (!docs || docs.length === 0) {
    if (countElem) countElem.innerText = '০ জন চেম্বারে';
    container.innerHTML = `
      <div class="empty-state-box" style="padding: 32px 16px; text-align: center; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1; margin: 12px 0;">
        <svg class="empty-icon" viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 10px;">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
        <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">কোনো ডাক্তার পাওয়া যায়নি</h4>
        <p style="font-size: 0.85rem; color: #64748b; max-width: 380px; margin: 0 auto 16px; line-height: 1.5;">
          আপনার সার্চ বা নির্বাচিত ফিল্টারের সাথে কোনো তথ্য মিলছে না। ফিল্টার রিসেট করে সব ডাক্তার দেখুন।
        </p>
        <button class="btn-primary" onclick="window.DocBD.handleSearch('')" style="padding: 10px 20px; font-size: 0.875rem; font-weight: 700; border-radius: 8px; background: var(--primary); color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);">
          সব ডাক্তার দেখুন
        </button>
      </div>
    `;
    return;
  }

  if (countElem) countElem.innerText = `${docs.length} জন চেম্বারে উপলব্ধ`;

  docs.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.innerHTML = `
      <div class="doc-card-top">
        <div class="doc-avatar-box">
          <svg class="icon-avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="doc-info-block">
          <div class="doc-title-row">
            <h4>${doc.name}</h4>
            <span class="rating-badge">★ ${doc.rating || '৪.৯'}</span>
          </div>
          <div class="doc-spec">${doc.spec}</div>
          <div class="doc-degree">${doc.degree}</div>
          <div class="badge-row">
            <span class="badge-bmdc">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              BMDC: ${doc.bmdc} (যাচাইকৃত)
            </span>
          </div>
        </div>
      </div>
      <div class="doc-chamber-details">
        <p class="hosp-name">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
            <path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
          </svg>
          ${doc.hospital}
        </p>
        <p class="chamber-timing">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${doc.chamberRoom} • ${doc.time}
        </p>
      </div>
      <div class="doc-actions-row">
        <div class="fee-meta">
          <span class="doc-fee">পরামর্শ ফি: ৳ ${doc.fee}</span>
          <small class="fee-hint">চেম্বারে নগদ বা bKash পরিশোধযোগ্য</small>
        </div>
        <button class="btn-book-slot" onclick="window.DocBD.openBookingModal('${doc.chamberId || doc.id}')">
          সিরিয়াল বুকিং (${doc.freeSlots}টি স্লট খালি)
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

export function renderHospitalCards(hospitals = [], onSelect) {
  const container = document.getElementById('hospitals-grid-container');
  if (!container) return;
  container.innerHTML = '';

  hospitals.forEach(h => {
    const card = document.createElement('div');
    card.className = 'hospital-card';
    card.innerHTML = `
      <div class="hosp-card-head">
        <div class="hosp-badge-icon">🏥</div>
        <div>
          <h4>${h.name}</h4>
          <span class="hosp-branch-text">${h.branch || 'ঢাকা'}</span>
        </div>
      </div>
      <div class="hosp-meta-row">
        <span class="hosp-dghs-badge">✓ ডিজিএইচএস: ${h.dghsRegNo || 'অনুমোদিত'}</span>
        <span class="hosp-doc-count">${h.doctorCount || 1} জন বিশেষজ্ঞ</span>
      </div>
      <p class="hosp-address-text">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        ${h.address || 'ঢাকা'} • হটলাইন: ${h.contactPhone || '১৬২৬৩'}
      </p>
      <div class="hosp-action-footer">
        <button class="btn-view-hosp-docs" onclick="window.DocBD.filterDoctorsByHospital('${h.id}')">
          এই হাসপাতালের ডাক্তার দেখুন (${h.doctorCount || 1}) ➔
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

export function handleSearch(query, doctors) {
  const q = query.trim().toLowerCase();
  const counter = document.getElementById('doctor-count');
  if (!q) {
    renderDoctorCards(doctors);
    if (counter) counter.innerText = `${doctors.length} জন চেম্বারে উপলব্ধ`;
    return;
  }
  const filtered = doctors.filter(d => 
    d.name.toLowerCase().includes(q) || 
    d.spec.toLowerCase().includes(q) || 
    d.hospital.toLowerCase().includes(q) ||
    (d.bmdc && d.bmdc.toLowerCase().includes(q))
  );
  renderDoctorCards(filtered);
  if (counter) counter.innerText = `${filtered.length} জন চেম্বারে উপলব্ধ`;
}

export function applyFilter(type, doctors) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (window.event && window.event.target) window.event.target.classList.add('active');

  if (type === 'all') {
    renderDoctorCards(doctors);
  } else if (type === 'cardiology') {
    renderDoctorCards(doctors.filter(d => d.dept === 'cardiology' || d.spec.includes('হৃদরোগ') || d.spec.includes('মেডিসিন')));
  } else if (type === 'gynae') {
    renderDoctorCards(doctors.filter(d => d.dept === 'gynae' || d.spec.includes('স্ত্রী')));
  } else if (type === 'pediatrics') {
    renderDoctorCards(doctors.filter(d => d.dept === 'pediatrics' || d.spec.includes('শিশু')));
  } else if (type === 'orthopedics') {
    renderDoctorCards(doctors.filter(d => d.dept === 'orthopedics' || d.spec.includes('অর্থোপেডিক')));
  } else if (type === 'dermatology') {
    renderDoctorCards(doctors.filter(d => d.dept === 'dermatology' || d.spec.includes('চর্ম')));
  } else if (type === 'today') {
    renderDoctorCards(doctors.filter(d => d.availableToday));
  } else if (type === 'lowfee') {
    renderDoctorCards(doctors.filter(d => d.fee <= 800));
  }
}

export function updatePatientLiveTicket(currentInside, myBookedSerial, myRecord) {
  const patientInside = document.getElementById('patient-current-inside');
  const patientMySerial = document.getElementById('patient-my-serial');
  const patientEstTime = document.getElementById('patient-est-time');
  const patientTimeStatus = document.getElementById('patient-time-status');

  const insideSerial = currentInside ? currentInside.serial : '—';
  if (patientInside) patientInside.innerText = insideSerial;

  if (!myBookedSerial) {
    if (patientMySerial) patientMySerial.innerText = '—';
    if (patientEstTime) patientEstTime.innerText = 'বুকিং নেওয়া হয়নি';
    if (patientTimeStatus) patientTimeStatus.innerText = 'নিচের তালিকা থেকে ডাক্তার বেছে সিরিয়াল নিন';
    return;
  }

  if (patientMySerial) patientMySerial.innerText = myBookedSerial;

  if (typeof insideSerial === 'number' && myBookedSerial >= insideSerial) {
    const diff = myBookedSerial - insideSerial;
    if (diff === 0) {
      if (patientEstTime) patientEstTime.innerText = 'এখন আপনার সিরিয়াল';
      if (patientTimeStatus) patientTimeStatus.innerText = 'অনুগ্রহ করে চেম্বারে প্রবেশ করুন';
    } else {
      const minEstMinutes = diff * 8;
      const maxEstMinutes = diff * 12;
      if (patientEstTime) patientEstTime.innerText = `আনুমানিক ${minEstMinutes}-${maxEstMinutes} মিনিট বাকি`;
      if (patientTimeStatus) patientTimeStatus.innerText = `আপনার আগে আর ${diff} জন রোগী আছেন`;
    }
  } else if (insideSerial === '—') {
    if (patientEstTime) patientEstTime.innerText = 'চেম্বার প্রস্তুত হচ্ছে';
    if (patientTimeStatus) patientTimeStatus.innerText = `আপনার বুকিং টোকেন #${myBookedSerial}`;
  }

  const proxBox = document.getElementById('proximity-checkin-box');
  const checkinMsg = document.getElementById('checkin-success-msg');
  if (myRecord && myRecord.checkin) {
    if (proxBox) proxBox.style.display = 'none';
    if (checkinMsg) checkinMsg.classList.remove('hidden');
  }
}

export function simulateVoiceSearch(doctors) {
  playBeepSound();
  const searchInput = document.getElementById('patient-search-input');
  if (searchInput) searchInput.value = 'হৃদরোগ ও মেডিসিন';
  showToast('ভয়েস ইনপুট শুনছে: "হৃদরোগ ও মেডিসিন বিশেষজ্ঞ"');
  setTimeout(() => {
    handleSearch('হৃদরোগ', doctors);
  }, 800);
}
