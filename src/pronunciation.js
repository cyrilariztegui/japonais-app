import { toHiragana } from 'wanakana'

const normalize = (text) => toHiragana(text, { passRomaji: true }).replace(/[\s。、，．！？!?,.「」…]/g, '')

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    row = next
  }
  return row[b.length]
}

const similarity = (a, b) => 1 - distance(a, b) / Math.max(a.length, b.length, 1)

export function evaluate(alternatives, card) {
  const targets = [normalize(card.w), normalize(card.r)]
  let best = { heard: '', score: 0 }
  for (const heard of alternatives) {
    const score = Math.max(...targets.map((t) => similarity(normalize(heard), t)))
    if (score > best.score) best = { heard, score }
  }
  const level = best.score >= 0.9 ? 'good' : best.score >= 0.6 ? 'close' : 'miss'
  return { heard: best.heard, level }
}

const ERRORS = {
  'not-allowed': "Micro refusé. Autorise-le dans les réglages de l'iPhone, puis réessaie.",
  'service-not-allowed': "La reconnaissance vocale n'est pas disponible ici. Vérifie que la dictée est activée dans Réglages, Général, Clavier.",
  'no-speech': "Je n'ai rien entendu. Réessaie en parlant un peu plus fort.",
  'audio-capture': 'Aucun micro détecté.',
  network: 'La reconnaissance vocale a besoin du réseau. Vérifie ta connexion.',
}

export const errorMessage = (code) => ERRORS[code] ?? `Reconnaissance impossible (${code}).`
