// Bengali Text-To-Speech (TTS) Voice Callout Service
export function announcePatientVoice(serial, name) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const text = `সিরিয়াল নম্বর ${serial}, ${name}, অনুগ্রহ করে ডাক্তার আঙ্কেলের চেম্বার কক্ষ ৩০২-তে প্রবেশ করুন।`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const banglaVoice = voices.find(v => v.lang === 'bn-BD' || v.lang === 'bn-IN' || v.name.includes('Bangla') || v.name.includes('Bengali'));
  if (banglaVoice) {
    utterance.voice = banglaVoice;
  } else {
    utterance.lang = 'bn-BD';
  }

  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch(e) {}
  }, 400);
}
