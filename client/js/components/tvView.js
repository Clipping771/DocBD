// TV Waiting Room Display Component — High-Contrast Digital Signage (Privacy Enforced)

export function updateTvDisplay(currentInside, queue, isDemo = false) {
  const tvCurrentSerial = document.getElementById('tv-current-serial');
  const tvCurrentName = document.getElementById('tv-current-name');
  const tvModeBadge = document.getElementById('tv-mode-badge');

  if (tvModeBadge) {
    tvModeBadge.innerText = isDemo ? '[ডেমো ডিজিটাল সাইনেজ — কাল্পনিক টোকেন]' : '[লাইভ ওপিডি সাইনেজ — ধানমন্ডি শাখা]';
  }

  if (currentInside && currentInside.serial) {
    if (tvCurrentSerial) tvCurrentSerial.innerText = currentInside.serial;
    // Strict Privacy: Only show Token announcement; no sensitive medical info
    if (tvCurrentName) tvCurrentName.innerText = `টোকেন #${currentInside.serial} — চেম্বার ৩০২-এ প্রবেশ করুন`;
  } else {
    if (tvCurrentSerial) tvCurrentSerial.innerText = '—';
    if (tvCurrentName) tvCurrentName.innerText = 'চেম্বার প্রস্তুত হচ্ছে — পরবর্তী ঘোষণার জন্য অপেক্ষা করুন';
  }

  const tvQueueList = document.getElementById('tv-queue-list');
  if (tvQueueList) {
    tvQueueList.innerHTML = '';
    const upcoming = (queue || []).filter(q => q.status === 'waiting').slice(0, 5);

    if (upcoming.length === 0) {
      tvQueueList.innerHTML = `
        <div style="padding: 16px; color:#94a3b8; font-size:0.9rem; text-align:center;">
          বর্তমানে কোনো অপেক্ষমাণ টোকেন নেই
        </div>
      `;
      return;
    }

    upcoming.forEach(u => {
      const item = document.createElement('div');
      item.className = 'tv-queue-item';
      item.innerHTML = `
        <span class="tv-q-token">#${u.serial}</span>
        <span class="tv-q-name">টোকেন #${u.serial} (অপেক্ষমাণ)</span>
        <span class="tv-q-status ${u.checkin ? 'confirmed' : 'waiting'}">
          ${u.checkin ? 'উপস্থিত' : 'অপেক্ষমাণ'}
        </span>
      `;
      tvQueueList.appendChild(item);
    });
  }
}

export function startTvClock() {
  const clockElem = document.getElementById('tv-live-clock');
  if (!clockElem) return;
  setInterval(() => {
    const now = new Date();
    clockElem.innerText = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);
}
