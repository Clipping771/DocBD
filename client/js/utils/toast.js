// Toast Notification Utility
export function showToast(message, isSms = false) {
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
