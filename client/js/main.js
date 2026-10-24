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
let currentModeInfo = { mode: 'demo', isDemo: true, label: 'ডেমো মোড' };
let myBookedSerial = null; // No fake default serial in real system
let activeChamberId = 'ch-pop-302';
let selectedDoctorForBooking = null;
let easyMode = false;
let currentLanguage = 'bn';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initial State from Storage
  const backup = loadLocalBackup();
  if (backup.mySerial && backup.mySerial !== 12) {
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

  // 5. Register PWA Service Worker
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
    renderDoctorCards(loadedDoctors, (doc) => { selectedDoctorForBooking = doc; }, currentModeInfo.isDemo);
  } catch (e) {
    console.error('Error fetching doctors:', e);
  }
}

async function reloadActiveChamber() {
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

export function switchView(viewName) {
  document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.device-frame-wrapper').forEach(v => v.classList.remove('view-active'));

  const btn = document.getElementById(`tab-${viewName}`);
  const view = document.getElementById(`${viewName}-view`);
  if (btn) btn.classList.add('active');
  if (view) view.classList.add('view-active');

  if (viewName === 'tv') {
    const tvFrame = document.querySelector('.tv-screen');
    if (tvFrame && !document.fullscreenElement) {
      // Prompt fullscreen
    }
  }
  syncAllViews();
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

// Global Export to Window
window.DocBD = {
  // Mode
  toggleSystemMode,
  getActiveMode: () => currentModeInfo,
  getActiveChamberId: () => activeChamberId,
  reloadDoctorsAndDirectory,
  syncAllViews,

  // Navigation
  switchView,
  switchChamber,
  toggleLanguage,
  toggleEasyMode,

  // Search & Filter
  handleSearch: (q) => handleSearch(q, loadedDoctors),
  applyFilter: (t) => applyFilter(t, loadedDoctors),
  simulateVoiceSearch: () => simulateVoiceSearch(loadedDoctors),

  // Core Actions
  callNext: callNextPatient,
  completeVisit: () => {
    handleIssuePrescription();
  },
  markNoShow: () => {
    fetch('/api/queue/noshow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chamberId: activeChamberId }) })
      .then(() => reloadActiveChamber());
  },
  holdPatient: () => {
    fetch('/api/queue/hold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chamberId: activeChamberId }) })
      .then(() => reloadActiveChamber());
  },
  toggleCheckin: (serial) => {
    fetch('/api/queue/checkin-toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chamberId: activeChamberId, serialNumber: serial }) })
      .then(() => reloadActiveChamber());
  },

  // Modals & Data Entry
  openBookingModal: (id) => openBookingModal(id, loadedDoctors, (doc) => { selectedDoctorForBooking = doc; }),
  closeBookingModal,
  submitSerialBooking: () => {
    const name = document.getElementById('bm-patient-name')?.value;
    const phone = document.getElementById('bm-patient-phone')?.value;
    submitSerialBooking(name, phone);
  },

  openWalkinModal,
  closeWalkinModal,
  submitWalkinSerial: () => {
    const name = document.getElementById('wm-patient-name')?.value;
    const phone = document.getElementById('wm-patient-phone')?.value;
    const gender = document.getElementById('wm-patient-gender')?.value;
    const fee = document.getElementById('wm-patient-fee')?.value;
    submitWalkinSerial(name, phone, gender, fee);
  },

  // Verified Payments
  openPaymentModal: openPaymentVerifyModal,
  closePaymentModal: closePaymentVerifyModal,
  confirmPayment: confirmVerifiedPayment,

  // Doctor Onboarding
  openDoctorRegisterModal,
  closeDoctorRegisterModal,
  submitDoctorRegister,

  // Clinical Vitals & Rx
  saveVitals: saveActiveVitals,
  addMedicineToPrescription,
  removeMed,
  issueDigitalPrescription: handleIssuePrescription,

  // Health Vault
  openVaultModal,
  closeVaultModal,
  searchPrescriptionVault,
  markDoseTaken,

  // Emergency & Telehealth
  openEmergencyModal,
  closeEmergencyModal,
  simulateEmergencyCall,
  startVideoCall,
  endVideoCall,
  toggleMic,
  toggleCam,

  // Widget & Broadcast
  openWidgetModal,
  closeWidgetModal,
  copyWidgetCode,
  broadcastHospitalAnnouncement,
  showToast
};
