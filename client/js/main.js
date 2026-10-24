// DocBD Modular Client Orchestrator — Enterprise HealthTech Dual-Mode Edition
import { wsService } from './services/wsService.js';
import { playBeepSound } from './services/audioService.js';
import { announcePatientVoice } from './services/voiceService.js';
import { saveLocalBackup, loadLocalBackup } from './services/storageService.js';
import { showToast } from './utils/toast.js';

// API Services
import {
  fetchSystemMode,
  setSystemMode,
  fetchDoctors,
  fetchChamberState,
  fetchHospitalAnalytics,
  fetchTvSignage,
  apiCallNext,
  apiBookSerial
} from './services/apiService.js';

// Components
import { 
  renderDoctorCards, 
  handleSearch, 
  applyFilter, 
  updatePatientLiveTicket,
  simulateVoiceSearch 
} from './components/patientView.js';

import { 
  renderCompounderTable 
} from './components/compounderView.js';

import { 
  updateDoctorPortalView,
  saveActiveVitals,
  addMedicineToPrescription, 
  removeMed,
  handleIssuePrescription
} from './components/doctorView.js';

import { 
  renderHospitalDashboard, 
  broadcastHospitalAnnouncement 
} from './components/hospitalView.js';

import { 
  updateTvDisplay, 
  startTvClock 
} from './components/tvView.js';

import {
  openBookingModal,
  closeBookingModal,
  openWalkinModal,
  closeWalkinModal,
  openPaymentVerifyModal,
  closePaymentVerifyModal,
  confirmVerifiedPayment,
  openDoctorRegisterModal,
  closeDoctorRegisterModal,
  submitDoctorRegister,
  openVaultModal,
  closeVaultModal,
  searchPrescriptionVault,
  markDoseTaken,
  openEmergencyModal,
  closeEmergencyModal,
  simulateEmergencyCall,
  startVideoCall,
  endVideoCall,
  toggleMic,
  toggleCam,
  openWidgetModal,
  closeWidgetModal,
  copyWidgetCode
} from './components/modals.js';

// State
let masterQueue = [];
let loadedDoctors = [];
let currentChamberState = null;
let currentAnalytics = null;
let currentModeInfo = { mode: 'real', isDemo: false, isReal: true, label: 'লাইভ সিস্টেম' };
let myBookedSerial = null; // No fake default serial
let activeChamberId = null;
let selectedDoctorForBooking = null;
let easyMode = false;
let currentLanguage = 'bn';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initial State from Storage
  const backup = loadLocalBackup();
  if (backup.mySerial && backup.mySerial !== 12 && backup.mySerial !== 5) {
    myBookedSerial = backup.mySerial;
  } else {
    myBookedSerial = null;
    try {
      localStorage.removeItem('docbd_my_serial');
      localStorage.removeItem('docbd_master_queue');
    } catch (e) {}
  }

  // 2. Start Clock & Audio
  startTvClock();

  // 3. Connect Real-time WebSocket Gateway
  wsService.init();
  wsService.on('INITIAL_STATE', handleIncomingWsState);
  wsService.on('QUEUE_UPDATE', handleIncomingWsState);
  wsService.on('MODE_CHANGED', handleIncomingModeChange);
  wsService.onStatusChange(updateConnectionBadge);

  // 4. Initial Sync with Backend
  await reloadSystemModeAndData();

  // 5. Initialize Role & URL Routing
  initRoleRouting();

  // 6. Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});

async function reloadSystemModeAndData() {
  try {
    const modeRes = await fetchSystemMode();
    currentModeInfo = modeRes;
    updateModeBadgeUI();

    await reloadDoctorsAndDirectory();
    await reloadActiveChamber();
    await reloadHospitalAnalytics();
  } catch (e) {
    console.warn('Initial data load warning:', e.message);
  }
}

async function reloadDoctorsAndDirectory() {
  try {
    const docRes = await fetchDoctors();
    loadedDoctors = docRes.doctors || [];
    if (loadedDoctors.length > 0 && !activeChamberId) {
      activeChamberId = loadedDoctors[0].chamberId || loadedDoctors[0].id;
    } else if (loadedDoctors.length === 0) {
      activeChamberId = null;
      currentChamberState = null;
      masterQueue = [];
    }
    renderDoctorCards(loadedDoctors, (doc) => { selectedDoctorForBooking = doc; }, false);
  } catch (e) {
    console.error('Error fetching doctors:', e);
  }
}

async function reloadActiveChamber() {
  if (!activeChamberId) {
    currentChamberState = null;
    masterQueue = [];
    syncAllViews();
    return;
  }
  try {
    const state = await fetchChamberState(activeChamberId);
    if (state && !state.isEmptyState) {
      currentChamberState = state;
      masterQueue = state.queue || [];
      activeChamberId = state.chamberId || activeChamberId;
    } else {
      currentChamberState = null;
      masterQueue = [];
    }
    syncAllViews();
  } catch (e) {
    console.error('Error fetching chamber:', e);
  }
}

async function reloadHospitalAnalytics() {
  try {
    const analytics = await fetchHospitalAnalytics();
    currentAnalytics = analytics;
    renderHospitalDashboard(currentAnalytics, currentModeInfo.isDemo);
  } catch (e) {
    console.error('Error fetching analytics:', e);
  }
}

function handleIncomingWsState(payload) {
  if (!payload) return;

  if (payload.modeInfo) {
    currentModeInfo = payload.modeInfo;
    updateModeBadgeUI();
  }

  if (payload.data) {
    currentChamberState = payload.data;
    masterQueue = payload.data.queue || [];
    if (payload.data.chamberId) activeChamberId = payload.data.chamberId;
  } else if (payload.queue) {
    masterQueue = payload.queue;
  }

  if (payload.analytics) {
    currentAnalytics = payload.analytics;
    renderHospitalDashboard(currentAnalytics, currentModeInfo.isDemo);
  }

  saveLocalBackup(masterQueue, myBookedSerial);
  syncAllViews();
}

function handleIncomingModeChange(payload) {
  if (payload && payload.data) {
    currentModeInfo = payload.data;
    updateModeBadgeUI();
    reloadDoctorsAndDirectory();
    reloadActiveChamber();
    reloadHospitalAnalytics();
    showToast(`সিস্টেম মোড পরিবর্তিত হয়েছে: ${currentModeInfo.label}`, true);
  }
}

function updateModeBadgeUI() {
  const badge = document.getElementById('system-mode-badge');
  const text = document.getElementById('system-mode-text');
  const btnToggle = document.getElementById('btn-mode-toggle');

  if (badge && text) {
    if (currentModeInfo.isReal) {
      badge.className = 'mode-badge mode-real';
      text.innerText = 'রিয়েল হাসপাতাল মোড (প্রকৃত ডেটা)';
      if (btnToggle) btnToggle.innerText = 'ডেমো মোডে যান';
    } else {
      badge.className = 'mode-badge mode-demo';
      text.innerText = 'ডেমো মোড (কাল্পনিক ডেটা)';
      if (btnToggle) btnToggle.innerText = 'রিয়েল মোডে যান';
    }
  }
}

async function toggleSystemMode() {
  const targetMode = currentModeInfo.isReal ? 'demo' : 'real';
  try {
    const res = await setSystemMode(targetMode);
    if (res.success) {
      currentModeInfo = res.modeInfo;
      updateModeBadgeUI();
      await reloadDoctorsAndDirectory();
      await reloadActiveChamber();
      await reloadHospitalAnalytics();
      showToast(`মোড সুইচ সম্পন্ন: ${currentModeInfo.label}`);
    }
  } catch (e) {
    showToast(`মোড পরিবর্তন ত্রুটি: ${e.message}`, false);
  }
}

function syncAllViews() {
  const currentInside = masterQueue.find(q => q.status === 'inside') || null;
  const myRecord = myBookedSerial ? masterQueue.find(q => q.serial === myBookedSerial) : null;

  // 1. Compounder desk table & hints
  renderCompounderTable(masterQueue);

  const compInsideElem = document.getElementById('comp-inside-patient');
  if (compInsideElem) {
    compInsideElem.innerText = currentInside ? `সিরিয়াল #${currentInside.serial}: ${currentInside.name}` : 'চেম্বার প্রস্তুত';
  }

  const nextWaiting = masterQueue.find(q => q.status === 'waiting');
  const nextHint = document.getElementById('next-caller-hint');
  if (nextHint) {
    nextHint.innerText = nextWaiting ? `পরবর্তী: সিরিয়াল #${nextWaiting.serial} (${nextWaiting.name})` : 'সব রোগী সম্পন্ন';
  }

  // 2. Patient Mobile App
  updatePatientLiveTicket(currentInside, myBookedSerial, myRecord);

  // 3. Doctor Portal Consultation
  updateDoctorPortalView(currentInside, currentChamberState);

  // 4. Waiting Room TV Display (Privacy Enforced)
  updateTvDisplay(currentInside, masterQueue, currentModeInfo.isDemo);

  // 5. Hospital Enterprise Dashboard
  if (currentAnalytics) {
    renderHospitalDashboard(currentAnalytics, currentModeInfo.isDemo);
  }
}

function updateConnectionBadge(connected) {
  const badge = document.querySelector('.live-indicator');
  if (badge) {
    if (connected) {
      badge.innerHTML = '<span class="pulse-dot connected"></span> ক্লাউড সিঙ্ক সক্রিয়';
      badge.className = 'live-indicator status-online';
    } else {
      badge.innerHTML = '<span class="pulse-dot offline"></span> লোকাল সিঙ্ক (অফলাইন)';
      badge.className = 'live-indicator status-offline';
    }
  }
}

// Global Core Operations
export async function callNextPatient() {
  try {
    const nextState = await apiCallNext(activeChamberId);
    if (nextState) {
      currentChamberState = nextState;
      masterQueue = nextState.queue || [];
      const current = masterQueue.find(q => q.status === 'inside');
      if (current) {
        playBeepSound();
        announcePatientVoice(current.serial, current.name);
        showToast(`সিরিয়াল #${current.serial} (${current.name})-কে চেম্বারে ডাকা হয়েছে`);
      } else {
        showToast('আজকের সব রোগীর পরামর্শ সম্পন্ন হয়েছে');
      }
      syncAllViews();
    }
  } catch (e) {
    showToast(`কল ত্রুটি: ${e.message}`, false);
  }
}

export async function submitSerialBooking(name, phone) {
  if (!name || !phone) {
    showToast('নাম এবং ফোন নম্বর উভয়ই আবশ্যক', false);
    return;
  }

  const chamberId = selectedDoctorForBooking?.chamberId || activeChamberId;
  const fee = selectedDoctorForBooking?.fee || 1000;

  try {
    const res = await apiBookSerial({
      chamberId,
      name,
      phone,
      source: 'online',
      fee,
      paid: false
    });

    if (res.success && res.booking) {
      myBookedSerial = res.booking.serial;
      saveLocalBackup(masterQueue, myBookedSerial);
      closeBookingModal();
      playBeepSound();
      showToast(`আপনার সিরিয়াল সফলভাবে নিশ্চিত হয়েছে! টোকেন #${myBookedSerial}`);
      await reloadActiveChamber();
    }
  } catch (e) {
    showToast(`বুকিং ব্যর্থ: ${e.message}`, false);
  }
}

export async function submitWalkinSerial(name, phone, gender, fee) {
  if (!name || !phone) {
    showToast('রোগীর নাম ও মোবাইল নম্বর আবশ্যক', false);
    return;
  }

  try {
    const res = await apiBookSerial({
      chamberId: activeChamberId,
      name,
      phone,
      source: 'walkin',
      fee: Number(fee) || 1000,
      paid: false
    });

    if (res.success && res.booking) {
      closeWalkinModal();
      playBeepSound();
      showToast(`ওয়াক-ইন সিরিয়াল #${res.booking.serial} (${name}) যুক্ত হয়েছে`);
      await reloadActiveChamber();
    }
  } catch (e) {
    showToast(`ওয়াক-ইন এন্ট্রি ব্যর্থ: ${e.message}`, false);
  }
}

// ===================================================================
// ROLE-BASED NAVIGATION & DYNAMIC ROUTING
// ===================================================================

const ROLE_TITLES = {
  patient: 'DocBD — রোগীর ওপিডি পোর্টাল',
  compounder: 'DocBD — সিরিয়াল খাতা ও রিসেপশন ডেস্ক',
  doctor: 'DocBD — ডাক্তার চেম্বার ও ডিজিটাল প্রেসক্রিপশন',
  hospital: 'DocBD — হাসপাতাল ড্যাশবোর্ড ও অ্যানালিটিক্স',
  tv: 'DocBD — লাইভ ওপিডি ওয়েটিং টিভি ডিসপ্লে',
  dual: 'DocBD — ডুয়াল ভিউ (রোগী + সিরিয়াল খাতা)'
};

export function switchView(viewName, pushHash = true) {
  const norm = normalizeRole(viewName);
  const workspace = document.getElementById('app-workspace');
  const patientView = document.getElementById('patient-view');
  const compView = document.getElementById('compounder-view');
  const docView = document.getElementById('doctor-view');
  const hospView = document.getElementById('hospital-view');
  const tvView = document.getElementById('tv-view');

  // Remove active from all tabs & view wrappers
  document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.device-frame-wrapper').forEach(v => v.classList.remove('view-active'));
  if (workspace) workspace.classList.remove('dual-mode');

  // Activate tab
  const btn = document.getElementById(`tab-${norm}`);
  if (btn) btn.classList.add('active');

  // Activate view
  if (norm === 'dual') {
    if (workspace) workspace.classList.add('dual-mode');
    if (patientView) patientView.classList.add('view-active');
    if (compView) compView.classList.add('view-active');
  } else if (norm === 'patient' && patientView) {
    patientView.classList.add('view-active');
  } else if (norm === 'compounder' && compView) {
    compView.classList.add('view-active');
  } else if (norm === 'doctor' && docView) {
    docView.classList.add('view-active');
  } else if (norm === 'hospital' && hospView) {
    hospView.classList.add('view-active');
    if (currentAnalytics) renderHospitalDashboard(currentAnalytics, currentModeInfo.isDemo);
  } else if (norm === 'tv' && tvView) {
    tvView.classList.add('view-active');
  }

  // Update Document Title
  if (ROLE_TITLES[norm]) {
    document.title = ROLE_TITLES[norm];
  }

  // Persist & Update URL
  localStorage.setItem('docbd_active_role', norm);
  if (pushHash && window.location.hash !== `#${norm}`) {
    try {
      history.replaceState(null, '', `#${norm}`);
    } catch (e) {}
  }

  syncAllViews();
}

function normalizeRole(role) {
  if (!role) return 'patient';
  const r = role.toLowerCase().replace(/^[/#]+/, '');
  if (r === 'serial' || r === 'reception') return 'compounder';
  if (r === 'admin') return 'hospital';
  if (['patient', 'compounder', 'doctor', 'hospital', 'tv', 'dual'].includes(r)) return r;
  return 'patient';
}

export function initRoleRouting() {
  const hash = window.location.hash;
  const path = window.location.pathname;

  let targetRole = 'patient';
  if (hash) {
    targetRole = normalizeRole(hash);
  } else if (path && path !== '/') {
    targetRole = normalizeRole(path);
  } else {
    const saved = localStorage.getItem('docbd_active_role');
    if (saved) targetRole = normalizeRole(saved);
  }

  switchView(targetRole, true);

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash;
    if (currentHash) {
      switchView(normalizeRole(currentHash), false);
    }
  });
}

export function switchChamber(chamberId) {
  activeChamberId = chamberId;
  reloadActiveChamber();
  switchView('compounder');
  showToast(`চেম্বার #${chamberId} লোড করা হয়েছে`);
}

export function toggleLanguage() {
  currentLanguage = currentLanguage === 'bn' ? 'en' : 'bn';
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) langBtn.innerText = currentLanguage === 'bn' ? 'English' : 'বাংলা';
  showToast(currentLanguage === 'bn' ? 'ভাষা: বাংলা নির্বাচিত' : 'Language set to English');
}

export function toggleEasyMode() {
  easyMode = !easyMode;
  document.body.classList.toggle('easy-mode', easyMode);
  const btn = document.getElementById('easy-mode-toggle');
  if (btn) btn.classList.toggle('active', easyMode);
  showToast(easyMode ? 'সহজ মোড সক্রিয় করা হয়েছে' : 'স্ট্যান্ডার্ড মোড সক্রিয়');
}

// Patient Self Check-in
export async function confirmPatientCheckin() {
  if (!myBookedSerial) {
    showToast('কোনো সক্রিয় সিরিয়াল বুকিং পাওয়া যায়নি', false);
    return;
  }
  try {
    await fetch('/api/queue/checkin-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId, serialNumber: myBookedSerial })
    });
    playBeepSound();
    showToast(`🎉 ব্রাভো! আপনার সিরিয়াল #${myBookedSerial} উপস্থিতি নিশ্চিত হয়েছে! রিসেপশন ও ডাক্তারকে জানানো হয়েছে 🎈`, true);
    await reloadActiveChamber();
  } catch (e) {
    showToast(`উপস্থিতি ট্র্যাকিং ত্রুটি: ${e.message}`, false);
  }
}

// Doctor Delay Notice
export async function broadcastDoctorDelay() {
  const waitingPatients = masterQueue.filter(q => q.status === 'waiting').length;
  try {
    await fetch('/api/queue/delay-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId, delayMinutes: 30, reason: "জরুরি অপারেশন" })
    });
    playBeepSound();
    showToast(`📢 চেম্বারের ${waitingPatients} জন রোগীকে ৩০ মিনিট বিলম্বের কারণ সহ SMS পাঠানো হয়েছে!`, true);
  } catch (e) {
    showToast('📢 বিলম্ব নোটিশ পাঠানো হয়েছে');
  }
}

// Patient Bottom Navigation
export function navPatient(tab) {
  document.querySelectorAll('.patient-bottom-nav .nav-item').forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.currentTarget) window.event.currentTarget.classList.add('active');

  if (tab === 'bookings') {
    showToast(myBookedSerial ? `📅 আপনার বুকিং: সিরিয়াল #${myBookedSerial} (পপুলার ডায়াগনস্টিক)` : 'এখনো কোনো সিরিয়াল বুকিং নেওয়া হয়নি');
  } else if (tab === 'vault') {
    openVaultModal();
  } else if (tab === 'care') {
    showToast('❤️ আপনার প্রাইমারি কেয়ার ডাক্তার: ডা. মো. রফিকুল ইসলাম সংরক্ষিত');
  }
}

// Family Profiles
export function openFamilyModal() {
  const m = document.getElementById('family-modal');
  if (m) m.classList.remove('hidden');
}

export function closeFamilyModal() {
  const m = document.getElementById('family-modal');
  if (m) m.classList.add('hidden');
}

export function switchFamilyMember(name) {
  const p = document.getElementById('active-profile-name');
  if (p) p.innerText = name;
  closeFamilyModal();
  showToast(`প্রোফাইল পরিবর্তন: ${name}-এর স্বাস্থ্য রেকর্ড সক্রিয়`);
}

// Modals Trigger Wrappers
export function confirmBookingFromModal() {
  const name = document.getElementById('bm-patient-name')?.value;
  const phone = document.getElementById('bm-patient-phone')?.value;
  submitSerialBooking(name, phone);
}

export function saveWalkinPatient() {
  const name = document.getElementById('wm-patient-name')?.value;
  const phone = document.getElementById('wm-patient-phone')?.value;
  const gender = document.getElementById('wm-patient-gender')?.value;
  const fee = document.getElementById('wm-patient-fee')?.value;
  submitWalkinSerial(name, phone, gender, fee);
}

export function filterDept(dept) {
  document.querySelectorAll('.dept-pill').forEach(p => p.classList.remove('active'));
  if (window.event && window.event.target) window.event.target.classList.add('active');
  showToast(`বিভাগ ফিল্টার: ${dept}`);
}

export function downloadPrescriptionPdf() {
  window.print();
}

export function completeCurrentVisit() {
  handleIssuePrescription();
}

export async function holdPatient() {
  try {
    await fetch('/api/queue/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId })
    });
    await reloadActiveChamber();
    showToast('রোগীকে সাময়িক হোল্ড তালিকায় রাখা হয়েছে');
  } catch (e) {
    showToast(`হোল্ড ত্রুটি: ${e.message}`, false);
  }
}

export async function markNoShow() {
  try {
    await fetch('/api/queue/noshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId })
    });
    await reloadActiveChamber();
    showToast('অনুপস্থিত (No-show) হিসেবে চিহ্নিত করা হয়েছে');
  } catch (e) {
    showToast(`ত্রুটি: ${e.message}`, false);
  }
}

export function issueDigitalPrescription() {
  handleIssuePrescription();
}

// ===================================================================
// GLOBAL WINDOW EXPORTS (DIRECT ONCLICK COMPATIBILITY)
// ===================================================================
const globalHandlers = {
  // Navigation & Routing
  switchView,
  switchChamber,
  toggleLanguage,
  toggleEasyMode,
  toggleSystemMode,
  initRoleRouting,

  // Patient Actions
  handleSearch: (q) => handleSearch(q, loadedDoctors),
  applyFilter: (t) => applyFilter(t, loadedDoctors),
  simulateVoiceSearch: () => simulateVoiceSearch(loadedDoctors),
  confirmPatientCheckin,
  navPatient,
  openFamilyModal,
  closeFamilyModal,
  switchFamilyMember,
  openBookingModal: (id) => openBookingModal(id, loadedDoctors, (doc) => { selectedDoctorForBooking = doc; }),
  closeBookingModal,
  confirmBookingFromModal,
  submitSerialBooking: () => {
    const name = document.getElementById('bm-patient-name')?.value;
    const phone = document.getElementById('bm-patient-phone')?.value;
    submitSerialBooking(name, phone);
  },

  // Compounder / Serial Khata
  openWalkinModal,
  closeWalkinModal,
  saveWalkinPatient,
  submitWalkinSerial: () => {
    const name = document.getElementById('wm-patient-name')?.value;
    const phone = document.getElementById('wm-patient-phone')?.value;
    const gender = document.getElementById('wm-patient-gender')?.value;
    const fee = document.getElementById('wm-patient-fee')?.value;
    submitWalkinSerial(name, phone, gender, fee);
  },
  callNextPatient,
  broadcastDoctorDelay,
  holdPatient,
  markNoShow,
  toggleCheckin: (serial) => {
    fetch('/api/queue/checkin-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chamberId: activeChamberId, serialNumber: serial })
    }).then(() => reloadActiveChamber());
  },

  // Payment Verification
  openPaymentVerifyModal,
  openPaymentModal: openPaymentVerifyModal,
  closePaymentModal: closePaymentVerifyModal,
  confirmPayment: confirmVerifiedPayment,

  // Doctor Portal
  completeCurrentVisit,
  completeVisit: completeCurrentVisit,
  callNext: callNextPatient,
  saveVitals: saveActiveVitals,
  addMedicineToPrescription,
  removeMed,
  issueDigitalPrescription,

  // Telehealth & Emergency
  openEmergencyModal,
  closeEmergencyModal,
  simulateEmergencyCall,
  startVideoCall,
  endVideoCall,
  toggleMic,
  toggleCam,

  // Health Vault & Prescriptions
  openVaultModal,
  closeVaultModal,
  searchPrescriptionVault,
  markDoseTaken,
  downloadPrescriptionPdf,

  // Hospital & Doctor Onboarding
  openDoctorRegisterModal,
  closeDoctorRegisterModal,
  submitDoctorRegister,
  filterDept,
  broadcastHospitalAnnouncement,
  openWidgetModal,
  closeWidgetModal,
  copyWidgetCode,
  showToast
};

// Bind directly to global window for HTML onclick attributes
Object.assign(window, globalHandlers);

// Maintain legacy window.DocBD namespace
window.DocBD = Object.assign(window.DocBD || {}, globalHandlers, {
  getActiveMode: () => currentModeInfo,
  getActiveChamberId: () => activeChamberId,
  reloadDoctorsAndDirectory,
  syncAllViews
});
