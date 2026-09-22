import './style.css'
import { speak, canSpeak } from './audio.js'
import { toFrench } from './phonetic.js'
import { kanaCards } from './kana.js'
import { loadProgress, saveProgress } from './storage.js'
import { nextCard, preview, grade, formatDelay } from './srs.js'

const app = document.querySelector('#app')
const progress = loadProgress()
let deck = []
let session = null
let revealed = false

async function loadVocab() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/vocab.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function advance() {
  session = nextCard(deck, progress)
  revealed = false
  render()
}

function status() {
  const { dueCount, newLeft } = session
  return `<p class="status">${dueCount} à réviser, ${newLeft} nouveaux</p>`
}

function answer() {
  const { w, r, m, ex } = session.card
  const example = ex?.[0]
  return `
    <section class="answer">
      ${r !== w ? `<p class="reading" lang="ja">${r}</p>` : ''}
      <p class="romaji">${toFrench(r)}</p>
      ${m.length ? `<p class="meaning">${m.join(', ')}</p>` : ''}
      ${example ? `
        <button class="example" lang="ja">${example.ja}</button>
        <p class="example-en">${example.en}</p>` : ''}
    </section>`
}

function actions() {
  if (!revealed) return '<nav class="actions"><button class="reveal">Voir la réponse</button></nav>'
  const options = preview(progress.cards[session.card.id])
  return `<nav class="actions grades">${options
    .map((o) => `<button class="grade" data-rating="${o.rating}">${o.label}<small>${formatDelay(o.due)}</small></button>`)
    .join('')}</nav>`
}

function render() {
  if (!session.card) {
    app.innerHTML = `
      <main class="card done">
        <p class="done-title">Terminé pour aujourd'hui</p>
        <p class="hint">Plus rien à réviser pour l'instant. Les prochaines cartes arriveront plus tard dans la journée ou demain.</p>
      </main>`
    return
  }
  app.innerHTML = `
    ${status()}
    <main class="card">
      <button class="face" aria-label="${revealed ? 'Écouter' : 'Voir la réponse'}">
        <span class="word" lang="ja">${session.card.w}</span>
      </button>
      ${revealed ? answer() : ''}
      ${revealed && canSpeak ? '<p class="hint">Touchez-le pour l\'écouter à nouveau</p>' : ''}
    </main>
    ${actions()}`
}

function reveal() {
  revealed = true
  render()
  speak(session.card.r)
}

app.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return
  if (btn.matches('.face')) revealed ? speak(session.card.r) : reveal()
  else if (btn.matches('.reveal')) reveal()
  else if (btn.matches('.example')) speak(btn.textContent)
  else if (btn.matches('.grade')) {
    grade(session.card, progress, Number(btn.dataset.rating))
    saveProgress(progress)
    advance()
  }
})

loadVocab()
  .then((vocab) => {
    deck = [...kanaCards, ...vocab]
    advance()
  })
  .catch((err) => {
    app.innerHTML = `<p class="error">Impossible de charger le vocabulaire (${err.message}). Vérifiez la connexion puis rechargez la page.</p>`
  })
