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
        <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.6" style="margin-bottom: 10px;">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">কোনো ডাক্তার এখনও যুক্ত করা হয়নি</h4>
        <p style="font-size: 0.85rem; color: #64748b; max-width: 380px; margin: 0 auto 16px; line-height: 1.5;">
          আপনি নিজের ডাক্তার ও চেম্বার তৈরি করে সম্পূর্ণ সিস্টেম নিজের মতো পরিচালনা করতে পারেন।
        </p>
        <button class="btn-primary" onclick="openDoctorRegisterModal()" style="padding: 10px 20px; font-size: 0.875rem; font-weight: 700; border-radius: 8px; background: var(--primary); color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);">
          + নতুন ডাক্তার ও চেম্বার তৈরি করুন
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
            <span class="rating-badge">★ ${doc.rating}</span>
          </div>
          <div class="doc-spec">${doc.spec}</div>
          <div class="doc-degree">${doc.degree}</div>
          <div class="badge-row">
            <span class="badge-bmdc">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              ${doc.bmdc}
            </span>
            ${doc.isDemo ? '<span class="badge-tag" style="background:#fef3c7; color:#92400e; font-size:0.7rem; padding:2px 6px;">ডেমো রেকর্ড</span>' : ''}
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
    d.hospital.toLowerCase().includes(q)
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
    renderDoctorCards(doctors.filter(d => d.dept === 'cardiology' || d.spec.includes('হৃদরোগ')));
  } else if (type === 'gynae') {
    renderDoctorCards(doctors.filter(d => d.dept === 'gynae' || d.spec.includes('স্ত্রী')));
  } else if (type === 'pediatrics') {
    renderDoctorCards(doctors.filter(d => d.dept === 'pediatrics' || d.spec.includes('শিশু')));
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
