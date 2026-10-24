// Compounder View Component — Clean Clinical Serial Register
export function renderCompounderTable(queue) {
  const tbody = document.getElementById('comp-serial-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!queue || queue.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-table-row">
          আজ এখনও কোনো রোগী তালিকায় নেই। নতুন রোগী এলে বাম পাশের 'ওয়াক-ইন সিরিয়াল এন্ট্রি' দিয়ে সিরিয়াল যোগ করুন।
        </td>
      </tr>
    `;
    updateStats([]);
    return;
  }

  queue.forEach(item => {
    const tr = document.createElement('tr');
    if (item.status === 'inside') {
      tr.className = 'active-inside-row';
    }

    tr.innerHTML = `
      <td class="col-serial">
        <span class="serial-token-number">${item.serial}</span>
      </td>
      <td class="col-patient">
        <div class="patient-name-text">${item.name}</div>
        <div class="patient-phone-sub">${item.phone}</div>
      </td>
      <td>
        <span class="badge-source badge-source-${item.source}">
          ${getSourceLabel(item.source)}
        </span>
      </td>
      <td>
        <span class="badge-checkin ${item.checkin ? 'checkin-confirmed' : 'checkin-pending'}">
          ${item.checkin ? 'উপস্থিত' : 'অপেক্ষমাণ'}
        </span>
      </td>
      <td class="col-fee">
        <span class="fee-amount">৳ ${item.fee}</span>
        <span class="payment-chip ${item.paid ? 'paid' : 'due'}">
          ${item.paid ? (item.paymentMethod ? `${item.paymentMethod} পরিশোধিত` : 'পরিশোধিত') : 'বাকি (Due)'}
        </span>
      </td>
      <td>
        <span class="badge-status badge-status-${item.status}">
          ${getStatusLabel(item.status)}
        </span>
      </td>
      <td class="col-actions">
        <div class="table-action-group">
          <button class="btn-table-action ${item.paid ? 'btn-paid-done' : 'btn-pay-record'}" onclick="window.DocBD.openPaymentModal(${item.serial}, '${item.name}', ${item.fee}, ${Boolean(item.paid)})">
            ${item.paid ? 'রসিদ / বিবরণ' : 'পেমেন্ট গ্রহণ'}
          </button>
          <button class="btn-table-action ${item.checkin ? 'btn-active' : ''}" onclick="window.DocBD.toggleCheckin(${item.serial})">
            ${item.checkin ? 'উপস্থিত' : 'চেক-ইন'}
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateStats(queue);
}

export function updateStats(queue) {
  const total = queue.length;
  const done = queue.filter(q => q.status === 'done').length;
  const waiting = queue.filter(q => q.status === 'waiting').length;
  const checkin = queue.filter(q => q.checkin).length;
  const noshow = queue.filter(q => q.status === 'noshow').length;

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

export function getSourceLabel(src) {
  switch (src) {
    case 'online': return 'অনলাইন অ্যাপ';
    case 'walkin': return 'ওয়াক-ইন';
    case 'phone': return 'টেলিফোন';
    case 'emergency': return 'জরুরি ফাস্ট-ট্র্যাক';
    default: return src;
  }
}

export function getStatusLabel(st) {
  switch (st) {
    case 'inside': return 'চেম্বারে উপস্থিত';
    case 'waiting': return 'অপেক্ষমাণ';
    case 'done': return 'সম্পন্ন';
    case 'noshow': return 'অনুপস্থিত';
    case 'hold': return 'হোল্ডে রাখা';
    default: return st;
  }
}
