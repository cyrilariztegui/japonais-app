let voices = []

function loadVoices() {
  voices = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith('ja'))
    .sort((a, b) => b.localService - a.localService)
}

export const canSpeak = 'speechSynthesis' in window

if (canSpeak) {
  loadVoices()
  speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

export function speak(text, { rate = 0.9, speaker = 0 } = {}) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = rate
  const voice = voices[speaker % voices.length]
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
}
