// Celebration Confetti Engine
export function triggerCelebration(emojis = ['🎉', '⭐', '🎈', '🧸', '🌈', '✨']) {
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
