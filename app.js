/* ===================================================================
   DocBD Core Interactive Engine — Production Full-Stack Edition
   Handles: 
   - Real-time Live WebSocket & Cloud State Synchronization
   - Offline-First LocalStorage Resilience
   - Bengali Speech Synthesis Voice Announcements
   - Multi-Chamber Live Queue & Hospital Central OPD Roster
   - GPS Proximity Detection & Self Check-in
   - Digital Prescription Generation & PDF Printing
   - Kids Friendly Gamification & Bravery Medals
   - bKash Gateway & Telehealth WebRTC Simulation
   =================================================================== */

// Global Server API / WebSocket Endpoints
const API_BASE = window.location.protocol === 'file:' 
  ? 'http://localhost:5000' 
  : `${window.location.protocol}//${window.location.host}`;

const WS_BASE = window.location.protocol === 'file:' 
  ? 'ws://localhost:5000/ws/queue' 
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/queue`;

let socket = null;
let isConnectedToCloud = false;
let activeChamberId = 'ch-pop-302';

// Initial Mock Doctor Data
const DOCTORS = [
  {
    id: 1,
    chamberId: "ch-pop-302",
    name: "অধ্যাপক ডা. মো. রফিকুল ইসলাম",
    degree: "MBBS, FCPS (Cardiology), MD",
    spec: "হৃদরোগ ও মেডিসিন বিশেষজ্ঞ",
    bmdc: "BMDC Reg: A-28491",
    hospital: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
    chamberRoom: "কক্ষ ৩০২, ২য় তলা",
    time: "আজ সন্ধ্যা ৭:০০ - রাত ১০:০০",
    fee: 1000,
    followupFee: 600,
    availableToday: true,
    freeSlots: 4,
    funBadge: "🩺 বড়দের বিশ্বস্ত হৃদরোগ বন্ধু",
    rating: "⭐ ৪.৯ (১২০+ রিভিউ)",
    avatar: "👨‍⚕️"
  },
  {
    id: 2,
    chamberId: "ch-pop-201",
    name: "ডা. নুসরাত জাহান চৌধুরী",
    degree: "MBBS, DGO, FCPS (Gynae & Obs)",
    spec: "স্ত্রী, প্রসূতি ও মা-শিশু বিশেষজ্ঞ",
    bmdc: "BMDC Reg: A-39102",
    hospital: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
    chamberRoom: "কক্ষ ২০১, ১ম তলা",
    time: "আজ বিকাল ৫:০০ - রাত ৮:৩০",
    fee: 800,
    followupFee: 500,
    availableToday: true,
    freeSlots: 2,
    funBadge: "🌸 মা ও নবজাতকের পরম যত্ন",
    rating: "⭐ ৪.৮ (৯৫+ রিভিউ)",
    avatar: "👩‍⚕️"
  },
  {
    id: 3,
    chamberId: "ch-pop-108",
    name: "ডা. সাজ্জাদ হোসেন",
    degree: "MBBS, MD (Pediatrics)",
    spec: "নবজাতক ও শিশুরোগ বিশেষজ্ঞ 🧸",
    bmdc: "BMDC Reg: A-41820",
    hospital: "পপুলার ডায়াগনস্টিক সেন্টার, ধানমন্ডি",
    chamberRoom: "কক্ষ ১০৮, নিচতলা",
    time: "আজ সন্ধ্যা ৬:০০ - রাত ৯:০০",
    fee: 1000,
    followupFee: 700,
    availableToday: true,
    freeSlots: 6,
    funBadge: "🧸 শিশু বন্ধু ও ব্যথাহীন টিকা 🎈",
    rating: "⭐ ৪.৯ (১৫০+ খুশি পরিবার)",
    avatar: "🧸👨‍⚕️"
  },
  {
    id: 4,
    chamberId: "ch-pop-102",
    name: "ডা. আনিকা তাবাসসুম",
    degree: "BDS, PGT (Pediatric Dentistry)",
    spec: "শিশু ডেন্টিস্ট ও হাসিমুখ বিশেষজ্ঞ 🌸",
    bmdc: "BMDC Reg: A-52190",
    hospital: "গ্রিন লাইফ হাসপাতাল, গ্রিন রোড",
    chamberRoom: "রুম ১০২ (হাসিখুশি কর্নার)",
    time: "আজ বিকাল ৪:০০ - সন্ধ্যা ৭:০০",
    fee: 800,
    followupFee: 500,
    availableToday: true,
    freeSlots: 5,
    funBadge: "🍭 খেলনা ও উপহার কর্নার 🍬",
    rating: "⭐ ৫.০ (সব বাচ্চার প্রিয়)",
    avatar: "🌸👩‍⚕️"
  }
];

// Initial Master Serial Register (Default Fallback State)
let masterQueue = [
  { serial: 1, name: "আব্দুল খালেক", phone: "01711-100001", source: "walkin", checkin: true, fee: 1000, paid: true, status: "done" },
  { serial: 2, name: "রাবেয়া খাতুন", phone: "01822-100002", source: "online", checkin: true, fee: 1000, paid: true, status: "done" },
  { serial: 3, name: "মো. জসিম উদ্দিন", phone: "01933-100003", source: "phone", checkin: true, fee: 600, paid: true, status: "done" },
  { serial: 4, name: "ফারহানা আফরোজ", phone: "01744-100004", source: "online", checkin: true, fee: 1000, paid: true, status: "done" },
  { serial: 5, name: "সুফিয়া বেগম", phone: "01555-100005", source: "online", checkin: true, fee: 1000, paid: true, status: "inside" },
  { serial: 6, name: "মাহমুদুল হাসান", phone: "01766-100006", source: "walkin", checkin: true, fee: 1000, paid: true, status: "waiting" },
  { serial: 7, name: "আনোয়ারুল ইসলাম", phone: "01877-100007", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" },
  { serial: 8, name: "নাজমুল হুদা", phone: "01988-100008", source: "phone", checkin: false, fee: 600, paid: false, status: "waiting" },
  { serial: 9, name: "তাহমিনা আক্তার", phone: "01799-100009", source: "online", checkin: true, fee: 1000, paid: true, status: "waiting" },
  { serial: 10, name: "কামাল উদ্দিন", phone: "01811-100010", source: "walkin", checkin: false, fee: 1000, paid: true, status: "waiting" },
  { serial: 11, name: "রোজিনা পারভীন", phone: "01722-100011", source: "online", checkin: true, fee: 600, paid: true, status: "waiting" },
  { serial: 12, name: "আবুল কালাম (বাবা)", phone: "01711-234567", source: "online", checkin: false, fee: 1000, paid: false, status: "waiting" },
  { serial: 13, name: "শামসুল আলম", phone: "01944-100013", source: "phone", checkin: false, fee: 1000, paid: false, status: "waiting" },
  { serial: 14, name: "শাহীনুর রহমান", phone: "01855-100014", source: "online", checkin: false, fee: 1000, paid: true, status: "waiting" },
  { serial: 15, name: "মো. আলাউদ্দিন", phone: "01766-100015", source: "walkin", checkin: false, fee: 600, paid: true, status: "waiting" }
];

// Active State
let activeView = 'patient';
let myBookedSerial = 12; // Active user's serial
let selectedDoctorForBooking = DOCTORS[0];
let easyMode = false;
let kidsModeActive = true;
let currentLanguage = 'bn';

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  loadLocalBackup();
  renderDoctorCards(DOCTORS);
  renderCompounderTable();
  updateLiveState();
  updateHospitalDashboard();
  startTvClock();
  initCloudWebSocket();
  initGeolocationWatch();
});

// ===================================================================
// 1. REAL-TIME CLOUD WEBSOCKET & STATE SYNCHRONIZATION
// ===================================================================

function initCloudWebSocket() {
  updateConnectionBadge(false);

  try {
    socket = new WebSocket(WS_BASE);

    socket.onopen = () => {
      isConnectedToCloud = true;
      updateConnectionBadge(true);
      showToast('⚡ DocBD ক্লাউড সার্ভারের সাথে রিয়েল-টাইম লাইভ সিঙ্ক সক্রিয় হয়েছে!');
      // Request latest state
      socket.send(JSON.stringify({ action: 'GET_STATE', chamberId: activeChamberId }));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'INITIAL_STATE' || payload.event === 'QUEUE_UPDATE') {
          handleIncomingQueueState(payload.data);
        }
      } catch (err) {
        console.warn('WS message parse error:', err);
      }
    };

    socket.onclose = () => {
      isConnectedToCloud = false;
      updateConnectionBadge(false);
      // Auto reconnect after 3 seconds
      setTimeout(initCloudWebSocket, 3000);
    };

    socket.onerror = () => {
      isConnectedToCloud = false;
      updateConnectionBadge(false);
    };
  } catch (e) {
    isConnectedToCloud = false;
    updateConnectionBadge(false);
  }
}

function updateConnectionBadge(connected) {
  const badge = document.querySelector('.live-indicator');
  if (badge) {
    if (connected) {
      badge.innerHTML = '<span class="pulse-dot" style="background:#22c55e;"></span> লাইভ ক্লাউড সিঙ্ক (Connected)';
      badge.style.color = '#15803d';
    } else {
      badge.innerHTML = '<span class="pulse-dot" style="background:#eab308;"></span> লোকাল সিঙ্ক (Offline Ready)';
      badge.style.color = '#854d0e';
    }
  }
}

function handleIncomingQueueState(serverState) {
  if (!serverState || !serverState.queue) return;
  masterQueue = serverState.queue;
  saveLocalBackup();
  renderCompounderTable();
  updateLiveState();
  updateHospitalDashboard();
}

function sendWsAction(action, data = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      action,
      chamberId: activeChamberId,
      data
    }));
  }
}

// LocalStorage Persistence Fallback
function saveLocalBackup() {
  try {
    localStorage.setItem('docbd_master_queue', JSON.stringify(masterQueue));
    localStorage.setItem('docbd_my_serial', String(myBookedSerial));
  } catch (e) {}
}

function loadLocalBackup() {
  try {
    const saved = localStorage.getItem('docbd_master_queue');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        masterQueue = parsed;
      }
    }
    const savedSerial = localStorage.getItem('docbd_my_serial');
    if (savedSerial) {
      myBookedSerial = Number(savedSerial);
    }
  } catch (e) {}
}

// ===================================================================
// 2. BENGALI SPEECH SYNTHESIS VOICE ANNOUNCEMENTS (AUDIO CALLOUT)
// ===================================================================

function announcePatientVoice(serial, name) {
  if (!('speechSynthesis' in window)) return;

  // Cancel any prior speech
  window.speechSynthesis.cancel();

  const text = `সিরিয়াল নম্বর ${serial}, ${name}, অনুগ্রহ করে ডাক্তার আঙ্কেলের চেম্বার কক্ষ ৩০২-তে প্রবেশ করুন।`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  // Attempt to select a Bengali voice if available
  const voices = window.speechSynthesis.getVoices();
  const banglaVoice = voices.find(v => v.lang === 'bn-BD' || v.lang === 'bn-IN' || v.name.includes('Bangla') || v.name.includes('Bengali'));
  if (banglaVoice) {
    utterance.voice = banglaVoice;
  } else {
    utterance.lang = 'bn-BD';
  }

  // Small delay after chime sound
  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch(e) {}
  }, 400);
}

// ===================================================================
// 3. VIEW SWITCHER & WORKSPACE
// ===================================================================

function switchView(viewName) {
  activeView = viewName;
  const workspace = document.getElementById('app-workspace');
  const patientView = document.getElementById('patient-view');
  const compView = document.getElementById('compounder-view');
  const docView = document.getElementById('doctor-view');
  const hospView = document.getElementById('hospital-view');
  const tvView = document.getElementById('tv-view');

  // Reset Tab Buttons
  document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
  const targetTab = document.getElementById(`tab-${viewName}`);
  if (targetTab) targetTab.classList.add('active');

  // Reset View Visibility
  workspace.classList.remove('dual-mode');
  patientView.classList.remove('view-active');
  compView.classList.remove('view-active');
  if (docView) docView.classList.remove('view-active');
  if (hospView) hospView.classList.remove('view-active');
  tvView.classList.remove('view-active');

  if (viewName === 'patient') {
    patientView.classList.add('view-active');
  } else if (viewName === 'compounder') {
    compView.classList.add('view-active');
  } else if (viewName === 'doctor' && docView) {
    docView.classList.add('view-active');
  } else if (viewName === 'hospital' && hospView) {
    hospView.classList.add('view-active');
    updateHospitalDashboard();
  } else if (viewName === 'dual') {
    workspace.classList.add('dual-mode');
  } else if (viewName === 'tv') {
    tvView.classList.add('view-active');
  }

  showToast(`ভিউ পরিবর্তন: ${getBengaliViewName(viewName)}`);
}

function getBengaliViewName(view) {
  switch (view) {
    case 'patient': return 'রোগীর মোবাইল অ্যাপ';
    case 'compounder': return 'কম্পাউন্ডার সিরিয়াল খাতা';
    case 'doctor': return 'ডাক্তার পোর্টাল ও ই-প্রেসক্রিপশন';
    case 'hospital': return 'হাসপাতাল সেন্ট্রাল ওপিডি ড্যাশবোর্ড';
    case 'dual': return 'ডুয়াল লাইভ সিঙ্ক মোড';
    case 'tv': return 'ওয়েটিং রুম টিভি ডিসপ্লে';
    default: return view;
  }
}

// Easy Mode Toggle (Elderly Accessibility)
function toggleEasyMode() {
  easyMode = !easyMode;
  const body = document.body;
  const statusText = document.getElementById('easy-mode-status');
  const toggleBtn = document.getElementById('easy-mode-toggle');

  if (easyMode) {
    body.classList.add('easy-mode-active');
    if (statusText) statusText.innerText = 'চালু';
    toggleBtn.classList.add('active');
    showToast('👓 সহজ মোড (Easy Mode) চালু হয়েছে — বড় লেখা ও বোতাম');
  } else {
    body.classList.remove('easy-mode-active');
    if (statusText) statusText.innerText = 'বন্ধ';
    toggleBtn.classList.remove('active');
    showToast('সাধারণ ভিউতে ফিরে গেছেন');
  }
}

// ===================================================================
// 4. DOCTOR DIRECTORY & PATIENT SEARCH
// ===================================================================

function renderDoctorCards(docs) {
  const container = document.getElementById('doctor-list-container');
  if (!container) return;
  container.innerHTML = '';

  docs.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'doctor-card';
    card.innerHTML = `
      <div class="doc-card-top">
        <div class="doc-avatar">${doc.avatar}</div>
        <div class="doc-info-block">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
            <h4>${doc.name}</h4>
            <span style="font-size:0.75rem; color:#d97706; font-weight:700;">${doc.rating || '⭐ ৪.৯'}</span>
          </div>
          <div class="doc-spec">${doc.spec}</div>
          <div class="doc-degree">${doc.degree}</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
            <span class="badge-bmdc">🛡️ ${doc.bmdc}</span>
            ${doc.funBadge ? `<span style="background:#fef3c7; color:#92400e; font-size:0.675rem; font-weight:700; padding:1px 8px; border-radius:9999px;">${doc.funBadge}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="doc-chamber-details">
        <p><strong>🏥 ${doc.hospital}</strong></p>
        <p>📍 ${doc.chamberRoom} • 🕒 ${doc.time}</p>
      </div>
      <div class="doc-actions-row">
        <div>
          <span class="doc-fee">ভিজিট: ৳ ${doc.fee}</span>
          <small style="display:block; color:#64748b; font-size:0.7rem;">(চেম্বারে ক্যাশ ডিফল্ট)</small>
        </div>
        <button class="btn-book-slot btn-bouncy" onclick="openBookingModal(${doc.id})">
          সিরিয়াল বুক করুন (${doc.freeSlots}টি খালি)
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function handleSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderDoctorCards(DOCTORS);
    const counter = document.getElementById('doctor-count');
    if (counter) counter.innerText = `${DOCTORS.length} জন চেম্বারে`;
    return;
  }
  const filtered = DOCTORS.filter(d => 
    d.name.toLowerCase().includes(q) || 
    d.spec.toLowerCase().includes(q) || 
    d.hospital.toLowerCase().includes(q) ||
    (d.funBadge && d.funBadge.toLowerCase().includes(q))
  );
  renderDoctorCards(filtered);
  const counter = document.getElementById('doctor-count');
  if (counter) counter.innerText = `${filtered.length} জন চেম্বারে`;
}

function applyFilter(type) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');

  if (type === 'all') {
    renderDoctorCards(DOCTORS);
  } else if (type === 'kids') {
    renderDoctorCards(DOCTORS.filter(d => 
      d.spec.includes('শিশু') || 
      d.spec.includes('নবজাতক') || 
      d.spec.includes('মা-শিশু') || 
      (d.funBadge && d.funBadge.includes('শিশু'))
    ));
    showToast('🧸 শিশু ও ফ্যামিলি স্পেশাল ডাক্তারদের তালিকা দেখানো হচ্ছে');
  } else if (type === 'today') {
    renderDoctorCards(DOCTORS.filter(d => d.availableToday));
  } else if (type === 'vaccine') {
    renderDoctorCards(DOCTORS.filter(d => d.funBadge && d.funBadge.includes('টিকা')));
    showToast('🎈 ব্যথাহীন টিকা ও ভ্যাকসিনেশন স্পেশাল ডাক্তার তালিকা');
  } else if (type === 'popular') {
    renderDoctorCards(DOCTORS.filter(d => d.hospital.includes('পপুলার')));
  } else if (type === 'lowfee') {
    renderDoctorCards(DOCTORS.filter(d => d.fee <= 800));
  }
}

// GPS Location Detection
function initGeolocationWatch() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        console.log(`[DocBD GPS] User Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        // Fallback default coordinates (Dhanmondi, Dhaka)
      },
      { timeout: 8000 }
    );
  }
}

// ===================================================================
// 5. COMPOUNDER SERIAL TABLE & ACTIONS
// ===================================================================

function renderCompounderTable() {
  const tbody = document.getElementById('comp-serial-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  masterQueue.forEach(item => {
    const tr = document.createElement('tr');
    if (item.status === 'inside') {
      tr.className = 'active-inside';
    }

    tr.innerHTML = `
      <td><strong>${item.serial}</strong></td>
      <td>
        <strong>${item.name}</strong><br>
        <small style="color:#64748b;">${item.phone}</small>
      </td>
      <td><span class="serial-badge badge-source-${item.source}">${getSourceLabel(item.source)}</span></td>
      <td>
        <span class="serial-badge ${item.checkin ? 'badge-checkin-yes' : 'badge-checkin-no'}">
          ${item.checkin ? '✓ উপস্থিত' : 'অপেক্ষমাণ'}
        </span>
      </td>
      <td>
        <strong>৳ ${item.fee}</strong> — 
        <span style="color:${item.paid ? '#15803d' : '#b45309'}; font-weight:600;">
          ${item.paid ? 'পরিশোধিত (ক্যাশ)' : 'বাকি (চেম্বারে ক্যাশ)'}
        </span>
      </td>
      <td><span class="serial-badge badge-status-${item.status}">${getStatusLabel(item.status)}</span></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-table-sm" title="টাকা গ্রহণ" onclick="togglePayment(${item.serial})">
            ${item.paid ? 'রসিদ' : 'ক্যাশ জমা'}
          </button>
          <button class="btn-table-sm" title="উপস্থিতি" onclick="toggleCheckin(${item.serial})">
            ${item.checkin ? 'চেক-আউট' : 'উপস্থিত'}
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateStats();
}

function getSourceLabel(src) {
  switch (src) {
    case 'online': return 'অ্যাপ/অনলাইন';
    case 'walkin': return 'ওয়াক-ইন';
    case 'phone': return 'টেলিফোন';
    case 'emergency': return '🚨 জরুরি';
    default: return src;
  }
}

function getStatusLabel(st) {
  switch (st) {
    case 'inside': return '🟢 চেম্বারের ভেতরে';
    case 'waiting': return 'অপেক্ষমাণ';
    case 'done': return '✓ সম্পন্ন';
    case 'noshow': return '✕ অনুপস্থিত';
    case 'hold': return '⏸️ হোল্ডে আছে';
    default: return st;
  }
}

function updateStats() {
  const total = masterQueue.length;
  const done = masterQueue.filter(q => q.status === 'done').length;
  const waiting = masterQueue.filter(q => q.status === 'waiting').length;
  const checkin = masterQueue.filter(q => q.checkin).length;
  const noshow = masterQueue.filter(q => q.status === 'noshow').length;

  const totalElem = document.getElementById('stat-total');
  const doneElem = document.getElementById('stat-done');
  const waitElem = document.getElementById('stat-waiting');
  const checkElem = document.getElementById('stat-checkedin');
  const noshowElem = document.getElementById('stat-noshow');

  if (totalElem) totalElem.innerText = total;
  if (doneElem) doneElem.innerText = done;
  if (waitElem) waitElem.innerText = waiting;
  if (checkElem) checkElem.innerText = checkin;
  if (noshowElem) noshowElem.innerText = noshow;
}

// Compounder Controls: Call Next Patient
function callNextPatient() {
  const currentInsideIndex = masterQueue.findIndex(q => q.status === 'inside');
  if (currentInsideIndex !== -1) {
    masterQueue[currentInsideIndex].status = 'done';
  }

  const nextPatient = masterQueue.find(q => q.status === 'waiting');
  if (nextPatient) {
    nextPatient.status = 'inside';
    nextPatient.checkin = true;
    playBeepSound();
    
    // Announce via Bengali speech synthesis
    announcePatientVoice(nextPatient.serial, nextPatient.name);

    showToast(`🔔 সিরিয়াল ${nextPatient.serial} (${nextPatient.name})-কে ভেতরে ডাকা হলো!`);
    
    // Trigger Upcoming alert simulation
    simulateSmsDispatch(nextPatient.serial, nextPatient.name);

    // Sync via WebSocket to server
    sendWsAction('CALL_NEXT');
  } else {
    showToast('সব রোগীর পরামর্শ সম্পন্ন হয়েছে!');
  }

  saveLocalBackup();
  updateLiveState();
  renderCompounderTable();
  updateHospitalDashboard();
}

function completeCurrentVisit() {
  const currentInside = masterQueue.find(q => q.status === 'inside');
  if (currentInside) {
    currentInside.status = 'done';
    showToast(`✓ সিরিয়াল ${currentInside.serial} (${currentInside.name})-এর ভিজিট ও প্রেসক্রিপশন সম্পন্ন!`);
    sendWsAction('DONE');
    callNextPatient();
  } else {
    showToast('বর্তমানে ভেতরে কোনো রোগী নেই!');
  }
}

function markNoShow() {
  const currentInside = masterQueue.find(q => q.status === 'inside');
  if (currentInside) {
    currentInside.status = 'noshow';
    showToast(`✕ সিরিয়াল ${currentInside.serial} অনুপস্থিত হিসেবে চিহ্নিত করা হয়েছে।`);
    sendWsAction('NO_SHOW');
    callNextPatient();
  }
}

function holdPatient() {
  const currentInside = masterQueue.find(q => q.status === 'inside');
  if (currentInside) {
    currentInside.status = 'hold';
    showToast(`⏸️ সিরিয়াল ${currentInside.serial}-কে টেস্ট রিপোর্টের জন্য হোল্ডে রাখা হয়েছে।`);
    sendWsAction('HOLD');
    callNextPatient();
  }
}

function togglePayment(serial) {
  const item = masterQueue.find(q => q.serial === serial);
  if (item) {
    item.paid = !item.paid;
    saveLocalBackup();
    renderCompounderTable();
    showToast(`সিরিয়াল ${serial}-এর পেমেন্ট স্ট্যাটাস: ${item.paid ? 'পরিশোধিত' : 'বাকি'}`);
    
    // Backend API Sync
    if (isConnectedToCloud) {
      fetch(`${API_BASE}/api/queue/payment-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamberId: activeChamberId, serialNumber: serial })
      }).catch(() => {});
    }
  }
}

function toggleCheckin(serial) {
  const item = masterQueue.find(q => q.serial === serial);
  if (item) {
    item.checkin = !item.checkin;
    saveLocalBackup();
    renderCompounderTable();
    showToast(`সিরিয়াল ${serial}-এর উপস্থিতি আপডেট: ${item.checkin ? 'উপস্থিত' : 'অপেক্ষমাণ'}`);

    // Backend API Sync
    if (isConnectedToCloud) {
      fetch(`${API_BASE}/api/queue/checkin-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamberId: activeChamberId, serialNumber: serial })
      }).catch(() => {});
    }
  }
}

// ===================================================================
// 6. LIVE SYNCHRONOUS ENGINE (PATIENT + DOCTOR + TV DISPLAY)
// ===================================================================

function updateLiveState() {
  const currentInside = masterQueue.find(q => q.status === 'inside') || { serial: '-', name: 'কেউ নেই' };
  
  // 1. Compounder Focus Card
  const compInsideElem = document.getElementById('comp-inside-patient');
  if (compInsideElem) {
    compInsideElem.innerText = `সিরিয়াল ${currentInside.serial}: ${currentInside.name}`;
  }

  const nextWaiting = masterQueue.find(q => q.status === 'waiting');
  const nextHint = document.getElementById('next-caller-hint');
  if (nextHint) {
    nextHint.innerText = nextWaiting ? `সিরিয়াল ${nextWaiting.serial} প্রস্তুত করুন` : 'সবাই সম্পন্ন';
  }

  // 2. Patient App Live Ticket
  const patientInside = document.getElementById('patient-current-inside');
  const patientMySerial = document.getElementById('patient-my-serial');
  const patientEstTime = document.getElementById('patient-est-time');
  const patientTimeStatus = document.getElementById('patient-time-status');

  if (patientInside) patientInside.innerText = currentInside.serial;
  if (patientMySerial) patientMySerial.innerText = myBookedSerial;

  if (typeof currentInside.serial === 'number' && myBookedSerial >= currentInside.serial) {
    const diff = myBookedSerial - currentInside.serial;
    if (diff === 0) {
      if (patientEstTime) patientEstTime.innerText = 'এখন আপনার পালা!';
      if (patientTimeStatus) patientTimeStatus.innerText = 'ভেতরে প্রবেশ করুন 🎈';
    } else {
      const minEstMinutes = diff * 8;
      const maxEstMinutes = diff * 12;
      if (patientEstTime) patientEstTime.innerText = `রাত ৮:${20 + diff}–৮:${28 + diff}`;
      if (patientTimeStatus) patientTimeStatus.innerText = `আর ${diff} জন বাকি (${minEstMinutes}-${maxEstMinutes} মিনিট)`;
    }
  }

  // Checkin Status on Patient Card
  const myRecord = masterQueue.find(q => q.serial === myBookedSerial);
  const proxBox = document.getElementById('proximity-checkin-box');
  const checkinMsg = document.getElementById('checkin-success-msg');
  if (myRecord && myRecord.checkin) {
    if (proxBox) proxBox.style.display = 'none';
    if (checkinMsg) checkinMsg.classList.remove('hidden');
  }

  // 3. Doctor Portal
  const docPatientName = document.getElementById('doc-patient-name');
  if (docPatientName) {
    docPatientName.innerText = `${currentInside.name} (সিরিয়াল #${currentInside.serial})`;
  }

  // 4. Waiting Room TV Display
  const tvCurrentSerial = document.getElementById('tv-current-serial');
  const tvCurrentName = document.getElementById('tv-current-name');
  if (tvCurrentSerial) tvCurrentSerial.innerText = currentInside.serial;
  if (tvCurrentName) tvCurrentName.innerText = currentInside.name;

  const tvQueueList = document.getElementById('tv-queue-list');
  if (tvQueueList) {
    tvQueueList.innerHTML = '';
    const upcoming = masterQueue.filter(q => q.status === 'waiting').slice(0, 4);
    upcoming.forEach(u => {
      const item = document.createElement('div');
      item.className = 'tv-queue-item';
      item.innerHTML = `
        <span class="tv-q-token">#${u.serial}</span>
        <span class="tv-q-name">${u.name}</span>
        <span style="font-size:0.85rem; color:#94a3b8;">${u.checkin ? '✓ উপস্থিত' : 'অপেক্ষমাণ'}</span>
      `;
      tvQueueList.appendChild(item);
    });
  }
}

// Patient Self Check-in ("আমি পৌঁছেছি")
function confirmPatientCheckin() {
  const myRecord = masterQueue.find(q => q.serial === myBookedSerial);
  if (myRecord) {
    myRecord.checkin = true;
    saveLocalBackup();
    renderCompounderTable();
    updateLiveState();

    playBeepSound();
    triggerCelebration(['🎉', '⭐', '🎈', '🧸', '🌈', '🏅']);

    showToast(`🎉 ব্রাভো! আপনার সিরিয়াল ${myBookedSerial} উপস্থিতি নিশ্চিত হয়েছে! রিসেপশন ও ডাক্তার আপনাকে অভিবাদন জানাচ্ছেন 🎈`, true);

    // Sync via WebSocket & REST API
    sendWsAction('CHECKIN', { serialNumber: myBookedSerial });
    if (isConnectedToCloud) {
      fetch(`${API_BASE}/api/queue/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamberId: activeChamberId, serialNumber: myBookedSerial })
      }).catch(() => {});
    }
  }
}

// Broadcast Doctor Delay
function broadcastDoctorDelay() {
  const waitingPatients = masterQueue.filter(q => q.status === 'waiting').length;
  playBeepSound();
  showToast(`📢 [SSL Wireless SMS ব্রডকাস্ট]: চেম্বারের ${waitingPatients} জন রোগীকে ৩০ মিনিট বিলম্বের কারণ সহ SMS পাঠানো হয়েছে!`, true);

  if (isConnectedToCloud) {
    fetch(`${API_BASE}/api/queue/delay-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId, delayMinutes: 30, reason: "জরুরি অপারেশন" })
    }).catch(() => {});
  }
}

// ===================================================================
// 7. BOOKING & WALK-IN MODALS
// ===================================================================

function openBookingModal(docId) {
  selectedDoctorForBooking = DOCTORS.find(d => d.id === docId) || DOCTORS[0];
  document.getElementById('bm-doc-name').innerText = selectedDoctorForBooking.name;
  document.getElementById('bm-doc-chamber').innerText = `${selectedDoctorForBooking.hospital} • ${selectedDoctorForBooking.time}`;
  document.getElementById('booking-modal').classList.remove('hidden');
}

function closeBookingModal() {
  document.getElementById('booking-modal').classList.add('hidden');
}

function confirmBookingFromModal() {
  const name = document.getElementById('bm-patient-name').value.trim() || 'নতুন রোগী';
  const phone = document.getElementById('bm-patient-phone').value.trim() || '017XXXXXXXX';
  const newSerialNum = masterQueue.length + 1;

  const newEntry = {
    serial: newSerialNum,
    name: name,
    phone: phone,
    source: 'online',
    checkin: false,
    fee: selectedDoctorForBooking ? selectedDoctorForBooking.fee : 1000,
    paid: false,
    status: 'waiting'
  };

  masterQueue.push(newEntry);
  myBookedSerial = newSerialNum;
  saveLocalBackup();

  closeBookingModal();
  renderCompounderTable();
  updateLiveState();
  updateHospitalDashboard();

  playBeepSound();
  triggerCelebration(['🎉', '⭐', '🎈']);
  showToast(`🎉 অভিনন্দন! সিরিয়াল ${newSerialNum} নিশ্চিত হয়েছে। আপনার ফোনে OTP ও কনফার্মেশন SMS পাঠানো হয়েছে।`, true);

  // Sync to Cloud
  sendWsAction('BOOK', { name, phone, source: 'online', fee: newEntry.fee });
  if (isConnectedToCloud) {
    fetch(`${API_BASE}/api/serials/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId, name, phone, source: 'online', fee: newEntry.fee })
    }).catch(() => {});
  }
}

function openWalkinModal() {
  document.getElementById('walkin-modal').classList.remove('hidden');
}

function closeWalkinModal() {
  document.getElementById('walkin-modal').classList.add('hidden');
}

function saveWalkinPatient() {
  const name = document.getElementById('wi-patient-name').value.trim();
  const phone = document.getElementById('wi-patient-phone').value.trim();
  const source = document.getElementById('wi-booking-source').value;
  const isPaid = document.getElementById('wi-paid-status').checked;

  if (!name) {
    alert('অনুগ্রহ করে রোগীর নাম লিখুন');
    return;
  }

  const newSerialNum = masterQueue.length + 1;
  const newEntry = {
    serial: newSerialNum,
    name: name,
    phone: phone || 'ওয়াক-ইন',
    source: source,
    checkin: source === 'walkin',
    fee: 1000,
    paid: isPaid,
    status: 'waiting'
  };

  masterQueue.push(newEntry);
  saveLocalBackup();

  closeWalkinModal();
  renderCompounderTable();
  updateLiveState();
  updateHospitalDashboard();

  playBeepSound();
  showToast(`✓ ওয়াক-ইন সিরিয়াল ${newSerialNum} যুক্ত হয়েছে ও ${phone} নম্বরে SMS পাঠানো হয়েছে।`, true);

  // Sync to Cloud
  sendWsAction('BOOK', { name, phone, source, fee: 1000, paid: isPaid });
  if (isConnectedToCloud) {
    fetch(`${API_BASE}/api/serials/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId, name, phone, source, fee: 1000, paid: isPaid })
    }).catch(() => {});
  }
}

// ===================================================================
// 8. DOCTOR PORTAL & DIGITAL PRESCRIPTIONS
// ===================================================================

function addMedicineToPrescription() {
  const medSelect = document.getElementById('rx-med-select');
  const doseSelect = document.getElementById('rx-dose-select');
  const timingSelect = document.getElementById('rx-timing-select');
  const list = document.getElementById('prescribed-med-list');

  const medText = medSelect.value;
  const doseText = doseSelect.value;
  const timingText = timingSelect.value;

  const li = document.createElement('li');
  li.innerHTML = `
    <span><strong>${medText}</strong> — ${doseText} (${timingText}) • ৩০ দিন</span>
    <button class="btn-del-rx" onclick="removeMed(this)">✕</button>
  `;
  list.appendChild(li);
  showToast(`+ প্রেসক্রিপশনে ${medText} যুক্ত হয়েছে`);
}

function removeMed(btn) {
  btn.closest('li').remove();
  showToast('ওষুধ বাদ দেওয়া হয়েছে');
}

function issueDigitalPrescription() {
  const currentInside = masterQueue.find(q => q.status === 'inside') || { serial: 5, name: 'সুফিয়া বেগম', phone: '01555-100005' };
  const diagnosis = document.getElementById('rx-diagnosis').value;
  const followupDate = document.getElementById('rx-followup-date').value;
  const tests = document.getElementById('rx-tests').value;

  // Sync to Patient Vault View
  const vaultName = document.getElementById('vault-patient-name');
  const vaultTests = document.getElementById('vault-rx-tests');
  const vaultRecall = document.getElementById('vault-rx-recall-box');

  if (vaultName) vaultName.innerText = currentInside.name;
  if (vaultTests) vaultTests.innerText = tests;
  if (vaultRecall) vaultRecall.innerHTML = `<strong>📅 পরবর্তী ফলো-আপ:</strong> ${followupDate} (রিপোর্ট সহ)`;

  playBeepSound();
  triggerCelebration(['📑', '✨', '🩺']);

  showToast(`🚀 [ডিজিটাল প্রেসক্রিপশন]: সিরিয়াল ${currentInside.serial} (${currentInside.name})-এর প্রেসক্রিপশন সফলভাবে পেশেন্ট ভল্টে পাঠানো হয়েছে!`, true);

  setTimeout(() => {
    showToast(`📩 [স্বয়ংক্রিয় রিকল SMS অ্যালার্ট]: "${currentInside.name}, ডা. রফিকুল ইসলাম প্রেসক্রিপশন ইস্যু করেছেন। ${followupDate} তারিখে ফলো-আপের রিমাইন্ডার সেট করা হলো।"`, true);
  }, 1200);

  // Send to Cloud Server
  if (isConnectedToCloud) {
    fetch(`${API_BASE}/api/prescriptions/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chamberId: activeChamberId,
        serial: currentInside.serial,
        patientName: currentInside.name,
        patientPhone: currentInside.phone,
        diagnosis,
        tests,
        followupDate
      })
    }).catch(() => {});
  }

  // Mark patient visit as complete
  completeCurrentVisit();
}

// Download / Print Prescription PDF
function downloadPrescriptionPdf() {
  showToast('📥 প্রেসক্রিপশন প্রস্তুত হচ্ছে — প্রিন্ট / PDF ডায়ালগ খোলা হচ্ছে...');
  setTimeout(() => {
    window.print();
  }, 400);
}

// ===================================================================
// 9. HOSPITAL CENTRAL OPD DASHBOARD DYNAMIC SYNC
// ===================================================================

function updateHospitalDashboard() {
  const rosterTbody = document.getElementById('hosp-roster-tbody');
  if (!rosterTbody) return;

  const currentInside302 = masterQueue.find(q => q.status === 'inside');
  const insideText302 = currentInside302 ? `সিরিয়াল ${currentInside302.serial} ভেতরে (${currentInside302.name})` : 'সবাই সম্পন্ন';
  const waiting302 = masterQueue.filter(q => q.status === 'waiting').length;

  rosterTbody.innerHTML = `
    <tr>
      <td><strong>অধ্যাপক ডা. মো. রফিকুল ইসলাম</strong><br><small>MBBS, FCPS, MD (Cardiology)</small></td>
      <td><span class="serial-badge badge-source-online">কার্ডিওলজি</span></td>
      <td>কক্ষ ৩০২ (২য় তলা)</td>
      <td><strong>${masterQueue.length} জন</strong> (${waiting302} অপেক্ষমাণ)</td>
      <td><strong class="text-accent">${insideText302}</strong></td>
      <td><span class="serial-badge badge-status-inside">🟢 লাইভ চলছে</span></td>
      <td><button class="btn-table-sm" onclick="switchView('compounder')">খাতা খুলুন</button></td>
    </tr>
    <tr>
      <td><strong>ডা. নুসরাত জাহান চৌধুরী</strong><br><small>MBBS, DGO, FCPS (Gynae & Obs)</small></td>
      <td><span class="serial-badge badge-source-walkin">গাইনী ও প্রসূতি</span></td>
      <td>কক্ষ ২০১ (১ম তলা)</td>
      <td><strong>২২ জন</strong> (পূর্ণ)</td>
      <td><strong class="text-accent">সিরিয়াল ১২ ভেতরে</strong></td>
      <td><span class="serial-badge badge-status-inside">🟢 লাইভ চলছে</span></td>
      <td><button class="btn-table-sm" onclick="showToast('কক্ষ ২০১ লাইভ মনিটর ওপেন')">মনিটর</button></td>
    </tr>
    <tr>
      <td><strong>ডা. সাজ্জাদ হোসেন</strong><br><small>MBBS, MD (Pediatrics)</small></td>
      <td><span class="serial-badge badge-source-phone">শিশুরোগ</span></td>
      <td>কক্ষ ১০৮ (নিচতলা)</td>
      <td><strong>১৮ জন</strong> (২ খালি)</td>
      <td><strong class="text-accent">সিরিয়াল ৮ ভেতরে</strong></td>
      <td><span class="serial-badge badge-status-inside">🟢 লাইভ চলছে</span></td>
      <td><button class="btn-table-sm" onclick="showToast('কক্ষ ১০৮ লাইভ মনিটর ওপেন')">মনিটর</button></td>
    </tr>
    <tr>
      <td><strong>ডা. মাহবুবুর রহমান</strong><br><small>MBBS, MS (Ortho)</small></td>
      <td><span class="serial-badge badge-source-online">অর্থোপেডিকস</span></td>
      <td>কক্ষ ৩০৫ (২য় তলা)</td>
      <td><strong>২০ জন</strong></td>
      <td>—</td>
      <td><span class="serial-badge badge-status-waiting">🕒 রাত ৮টায় শুরু</span></td>
      <td><button class="btn-table-sm" onclick="showToast('অপেক্ষমাণ তালিকা ভিউ')">তালিকায়</button></td>
    </tr>
  `;
}

function broadcastHospitalAnnouncement() {
  const msg = prompt('হাসপাতাল নোটিশ লিখুন:', 'পপুলার ধানমন্ডি: আজ সন্ধ্যা ৭:৩০ টায় নিচতলায় বিনামূল্যে ডায়াবেটিস স্ক্রিনিং ক্যাম্প অনুষ্ঠিত হবে।');
  if (msg) {
    playBeepSound();
    showToast(`📢 [হাসপাতাল সেন্ট্রাল নোটিশ ব্রডকাস্ট]: "${msg}" সকল টিভি স্ক্রিন ও অ্যাপে প্রচারিত হয়েছে!`, true);
  }
}

// ===================================================================
// 10. HEALTH VAULT, DOSAGE ALARMS & BRAVERY STICKERS
// ===================================================================

function openVaultModal() {
  const currentInside = masterQueue.find(q => q.status === 'inside') || { name: 'সুফিয়া বেগম' };
  const vaultName = document.getElementById('vault-patient-name');
  if (vaultName) vaultName.innerText = currentInside.name;
  document.getElementById('vault-modal').classList.remove('hidden');
}

function closeVaultModal() {
  document.getElementById('vault-modal').classList.add('hidden');
}

function markDoseTaken(btn) {
  const row = btn.closest('.alarm-row');
  row.className = 'alarm-row done';
  btn.outerHTML = '<span class="badge-taken">✓ সম্পন্ন 🦸‍♂️</span>';
  playBeepSound();
  triggerCelebration(['💊', '🦸‍♂️', '⭐', '🌟', '💪']);
  showToast('🎉 ব্রাভো! তুমি আজ একজন সুপারহিরো! সময়মতো ওষুধ খেলে শরীর দ্রুত সুস্থ ও শক্তিশালী হবে 🦸‍♂️🌟');
}

function celebrateSticker(stickerName) {
  playBeepSound();
  triggerCelebration(['🏅', '⭐', '🎈', '🦸‍♂️', '🎉', '🌟']);
  showToast(`🎉 দারুণ! তুমি আনলক করেছো: "${stickerName}"! তুমি সেরা সাহসী বাচ্চা! 🏅✨`);
}

// ===================================================================
// 11. KIDS MODE & MASCOT INTERACTION
// ===================================================================

function toggleKidsMode() {
  kidsModeActive = !kidsModeActive;
  const btn = document.getElementById('kids-mode-toggle');
  const buddy = document.getElementById('doc-buddy-banner');

  if (kidsModeActive) {
    btn.classList.add('active');
    if (buddy) buddy.style.display = 'flex';
    triggerCelebration(['🎈', '⭐', '🧸', '🌈', '🍭']);
    playBeepSound();
    showToast('🎈 কিডস ও ফ্যামিলি ডিজাইন চালু হয়েছে! রঙিন আনন্দময় মোড 🧸');
  } else {
    btn.classList.remove('active');
    if (buddy) buddy.style.display = 'none';
    showToast('সাধারণ প্রফেশনাল মোডে ফিরে গেছেন');
  }
}

const BUDDY_QUOTES = [
  "আজ ডাক্তার আঙ্কেল তোমার বুক পরীক্ষা করবেন আর সাথে থাকবে মিষ্টি হাসি ও চকলেট! 🎈🍬",
  "ভয় পাওয়ার একদম কিছু নেই! তুমি খুব সাহসী একজন সুপারহিরো! 🦸‍♂️🌟",
  "ঔষধ খেলে শরীর দ্রুত সুস্থ ও শক্তিশালী হবে, বন্ধুদের সাথে দৌড়াদৌড়ি করতে পারবে! 🏃‍♂️🧸",
  "ডাক্তার আঙ্কেলের রুমে রঙিন কার্টুন ও খেলনা আছে! তুমি দারুণ একটা দিন কাটাবে! 🎨🎈",
  "হাসিমুখে ডাক্তার আঙ্কেলকে 'হ্যালো' বলো, তুমি সাথে সাথে ১টি গোল্ডেন স্টার পাবে! ⭐🏅"
];
let buddyQuoteIdx = 0;

function pokeDocBuddy() {
  buddyQuoteIdx = (buddyQuoteIdx + 1) % BUDDY_QUOTES.length;
  const tipElem = document.getElementById('buddy-tip-text');
  if (tipElem) {
    tipElem.innerText = `"${BUDDY_QUOTES[buddyQuoteIdx]}"`;
  }
  playBeepSound();
  triggerCelebration(['✨', '🐻', '🎈', '🍬', '⭐']);
  showToast('🐻 ডক-বন্ধু তোমাকে জড়িয়ে ধরে মিষ্টি হাসি দিয়েছে! ✨');
}

function simulateVoiceSearch() {
  playBeepSound();
  const searchInput = document.getElementById('patient-search-input');
  if (searchInput) searchInput.value = 'শিশু বিশেষজ্ঞ ও টিকা';
  showToast('🎙️ [Google ভয়েস সার্চ শুনছে...]: "বাচ্চাদের ডাক্তার ও ব্যথাহীন টিকা" 🧸');
  setTimeout(() => {
    handleSearch('শিশু');
    showToast('🔍 শিশু বিশেষজ্ঞ ডাক্তারদের তালিকা প্রদর্শিত হচ্ছে 🎈');
  }, 900);
}

// ===================================================================
// 12. BKASH, EMERGENCY, TELEHEALTH & WIDGET MODALS
// ===================================================================

function openEmergencyModal() {
  document.getElementById('emergency-modal').classList.remove('hidden');
}

function closeEmergencyModal() {
  document.getElementById('emergency-modal').classList.add('hidden');
}

function simulateEmergencyCall(number, title) {
  playBeepSound();
  closeEmergencyModal();
  showToast(`🚨 [জরুরি কল ডায়াল]: ${title} (${number})-এ সংযোগ করা হচ্ছে...`, true);
  // Real dial trigger if mobile browser
  window.location.href = `tel:${number}`;
}

function openBkashModal() {
  document.getElementById('bkash-modal').classList.remove('hidden');
}

function closeBkashModal() {
  document.getElementById('bkash-modal').classList.add('hidden');
}

function processBkashPayment() {
  const acc = document.getElementById('bkash-acc-no').value;
  closeBkashModal();
  playBeepSound();

  const trxId = 'TRX' + Math.floor(10000000 + Math.random() * 90000000);
  showToast(`🎉 [bKash পেমেন্ট সফল]: ৳ ১,০০০ পরিশোধ সম্পন্ন হয়েছে! TrxID: ${trxId}। ডিজিটাল রসিদ SMS পাঠানো হয়েছে।`, true);

  const myRecord = masterQueue.find(q => q.serial === myBookedSerial);
  if (myRecord) {
    myRecord.paid = true;
    saveLocalBackup();
    renderCompounderTable();
  }
}

// Video Call Telehealth
let callTimerInterval = null;
let callSeconds = 0;
function startVideoCall() {
  document.getElementById('video-call-modal').classList.remove('hidden');
  callSeconds = 0;
  const timerElem = document.getElementById('call-timer');
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const secs = String(callSeconds % 60).padStart(2, '0');
    if (timerElem) timerElem.innerText = `${mins}:${secs}`;
  }, 1000);
  showToast('📹 ডা. রফিকুল ইসলামের সাথে এনক্রিপ্টেড ভিডিও কনসালটেশন শুরু হয়েছে');
}

function endVideoCall() {
  if (callTimerInterval) clearInterval(callTimerInterval);
  document.getElementById('video-call-modal').classList.add('hidden');
  showToast('ভিডিও পরামর্শ সম্পন্ন হয়েছে');
}

let isMicMuted = false;
function toggleMic() {
  isMicMuted = !isMicMuted;
  const btn = document.getElementById('btn-toggle-mic');
  btn.innerText = isMicMuted ? '🔇 আনমিউট' : '🎤 মিউট';
  showToast(isMicMuted ? 'মাইক্রোফোন মিউট করা হয়েছে' : 'মাইক্রোফোন চালু');
}

let isCamOff = false;
function toggleCam() {
  isCamOff = !isCamOff;
  const btn = document.getElementById('btn-toggle-cam');
  btn.innerText = isCamOff ? '📷 ক্যামেরা চালু' : '📷 ক্যামেরা বন্ধ';
  showToast(isCamOff ? 'ক্যামেরা বন্ধ করা হয়েছে' : 'ক্যামেরা চালু');
}

function openWidgetModal() {
  document.getElementById('widget-modal').classList.remove('hidden');
}

function closeWidgetModal() {
  document.getElementById('widget-modal').classList.add('hidden');
}

function copyWidgetCode() {
  navigator.clipboard.writeText('<iframe src="https://docbd.com/widget/popular-dhanmondi" width="100%" height="520" frameborder="0" allow="geolocation"></iframe>');
  closeWidgetModal();
  showToast('📋 বুকিং উইজেট কোড ক্লিপবোর্ডে কপি হয়েছে!');
}

function openFamilyModal() {
  document.getElementById('family-modal').classList.remove('hidden');
}

function closeFamilyModal() {
  document.getElementById('family-modal').classList.add('hidden');
}

function switchFamilyMember(name) {
  document.getElementById('active-profile-name').innerText = name;
  closeFamilyModal();
  showToast(`প্রোফাইল পরিবর্তন: ${name}-এর স্বাস্থ্য রেকর্ড সক্রিয়`);
}

function navPatient(tab) {
  document.querySelectorAll('.patient-bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');

  if (tab === 'bookings') {
    showToast(`📅 আপনার বুকিং: সিরিয়াল ${myBookedSerial} (পপুলার ডায়াগনস্টিক, ধানমন্ডি)`);
  } else if (tab === 'vault') {
    openVaultModal();
  } else if (tab === 'care') {
    showToast('❤️ আমার ডাক্তার (Care Team): ডা. রফিকুল ইসলাম সংরক্ষিত');
  }
}

function toggleLanguage() {
  currentLanguage = currentLanguage === 'bn' ? 'en' : 'bn';
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.innerText = currentLanguage === 'bn' ? '🌐 English' : '🌐 বাংলা';
  }
  showToast(currentLanguage === 'bn' ? 'ভাষা পরিবর্তন: বাংলা নির্বাচিত' : 'Language switched to English');
}

function filterDept(dept) {
  document.querySelectorAll('.dept-pill').forEach(p => p.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  showToast(`বিভাগ ফিল্টার: ${dept}`);
}

// ===================================================================
// 13. AUDIO CHIME, CONFETTI & UTILITIES
// ===================================================================

function showToast(message, isSms = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${isSms ? 'toast-sms' : ''}`;
  toast.innerHTML = `<span>${isSms ? '📩' : 'ℹ️'}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function playBeepSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

function startTvClock() {
  const clockElem = document.getElementById('tv-live-clock');
  if (!clockElem) return;
  setInterval(() => {
    const now = new Date();
    clockElem.innerText = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);
}

function simulateSmsDispatch(serial, name) {
  setTimeout(() => {
    showToast(`📩 [বাংলা SMS অটো-রিমাইন্ডার]: "সিরিয়াল ${serial + 2} — আর মাত্র ২ জন বাকি। অনুগ্রহ করে দরজার সামনে উপস্থিত হোন।"`, true);
  }, 1800);
}

function triggerCelebration(emojis = ['🎉', '⭐', '🎈', '🧸', '🌈', '✨']) {
  const overlay = document.createElement('div');
  overlay.className = 'confetti-overlay';
  document.body.appendChild(overlay);

  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#ec4899', '#8b5cf6', '#06b6d4'];

  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 98}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.animationDuration = `${2.0 + Math.random() * 1.5}s`;
    overlay.appendChild(piece);
  }

  for (let j = 0; j < 12; j++) {
    const emoji = document.createElement('div');
    emoji.className = 'confetti-emoji';
    emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${10 + Math.random() * 80}vw`;
    emoji.style.top = `${60 + Math.random() * 25}vh`;
    emoji.style.animationDelay = `${Math.random() * 0.4}s`;
    overlay.appendChild(emoji);
  }

  setTimeout(() => {
    overlay.remove();
  }, 3200);
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[DocBD SW] Registered successfully with scope:', reg.scope))
      .catch((err) => console.log('[DocBD SW] Registration failed:', err));
  });
}
