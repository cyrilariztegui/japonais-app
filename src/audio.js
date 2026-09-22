let voice = null

function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('ja'))
  voice = voices.find((v) => v.localService) ?? voices[0] ?? null
}

export const canSpeak = 'speechSynthesis' in window

if (canSpeak) {
  pickVoice()
  speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export function speak(text) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
}
