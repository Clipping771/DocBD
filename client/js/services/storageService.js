// LocalStorage & Offline Persistence Service
export function saveLocalBackup(queue, mySerial) {
  try {
    localStorage.setItem('docbd_master_queue', JSON.stringify(queue));
    localStorage.setItem('docbd_my_serial', String(mySerial));
  } catch (e) {}
}

export function loadLocalBackup() {
  let queue = null;
  let mySerial = null;
  try {
    const saved = localStorage.getItem('docbd_master_queue');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        queue = parsed;
      }
    }
    const savedSerial = localStorage.getItem('docbd_my_serial');
    if (savedSerial) {
      mySerial = Number(savedSerial);
    }
  } catch (e) {}
  return { queue, mySerial };
}
