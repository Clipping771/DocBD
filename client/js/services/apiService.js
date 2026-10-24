// REST API Client Service for DocBD
import { API_BASE } from '../config.js';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchSystemMode() {
  const res = await fetch(`${API_BASE}/api/system/mode`);
  return res.json();
}

export async function setSystemMode(mode) {
  const res = await fetch(`${API_BASE}/api/system/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return res.json();
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/system/status`);
  return res.json();
}

export async function fetchDoctors(specialty = 'all', query = '') {
  let url = `${API_BASE}/api/doctors?`;
  if (specialty && specialty !== 'all') url += `specialty=${encodeURIComponent(specialty)}&`;
  if (query) url += `query=${encodeURIComponent(query)}&`;
  const res = await fetch(url);
  return res.json();
}

export async function apiRegisterDoctor(data) {
  const res = await fetch(`${API_BASE}/api/doctors/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchChamberState(chamberId = 'ch-pop-302') {
  const res = await fetch(`${API_BASE}/api/queue/live/${chamberId}`);
  return res.json();
}

export async function apiCallNext(chamberId = 'ch-pop-302') {
  const res = await fetch(`${API_BASE}/api/queue/call-next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chamberId })
  });
  return res.json();
}

export async function apiCheckin(chamberId = 'ch-pop-302', serialNumber) {
  const res = await fetch(`${API_BASE}/api/queue/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chamberId, serialNumber })
  });
  return res.json();
}

export async function apiRecordVerifiedPayment(data) {
  const res = await fetch(`${API_BASE}/api/queue/record-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function apiSaveClinicalVitals(data) {
  const res = await fetch(`${API_BASE}/api/clinical/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function apiTogglePayment(chamberId = 'ch-pop-302', serialNumber) {
  const res = await fetch(`${API_BASE}/api/queue/payment-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chamberId, serialNumber })
  });
  return res.json();
}

export async function apiToggleCheckin(chamberId = 'ch-pop-302', serialNumber) {
  const res = await fetch(`${API_BASE}/api/queue/checkin-toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chamberId, serialNumber })
  });
  return res.json();
}

export async function apiBookSerial(data) {
  const res = await fetch(`${API_BASE}/api/serials/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function apiIssuePrescription(data) {
  const res = await fetch(`${API_BASE}/api/prescriptions/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchPrescriptions(phone = '') {
  let url = `${API_BASE}/api/prescriptions`;
  if (phone) url += `?phone=${encodeURIComponent(phone)}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchHospitalAnalytics() {
  const res = await fetch(`${API_BASE}/api/hospital/analytics`);
  return res.json();
}

export async function fetchTvSignage() {
  const res = await fetch(`${API_BASE}/api/tv/signage`);
  return res.json();
}

export async function apiBroadcastDelay(chamberId = 'ch-pop-302', delayMinutes = 30) {
  const res = await fetch(`${API_BASE}/api/queue/delay-broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chamberId, delayMinutes, reason: 'জরুরি অপারেশন' })
  });
  return res.json();
}
