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

const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition

export const canListen = Boolean(Recognition)

export function listen() {
  return new Promise((resolve, reject) => {
    if (canSpeak) speechSynthesis.cancel()
    const recognition = new Recognition()
    recognition.lang = 'ja-JP'
    recognition.interimResults = false
    recognition.maxAlternatives = 5
    recognition.onresult = (e) => resolve([...e.results[0]].map((alt) => alt.transcript))
    recognition.onerror = (e) => reject(new Error(e.error))
    recognition.onend = () => resolve([])
    recognition.start()
  })
}
