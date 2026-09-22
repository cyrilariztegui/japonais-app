import './style.css'
import { speak, canSpeak } from './audio.js'

const app = document.querySelector('#app')
let cards = []
let current = null
let revealed = false

async function loadCards() {
  const res = await fetch(`${import.meta.env.BASE_URL}data/vocab.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function pick() {
  current = cards[Math.floor(Math.random() * cards.length)]
  revealed = false
  render()
}

function answer() {
  const { w, r, m, ex } = current
  const example = ex?.[0]
  return `
    <section class="answer">
      ${r !== w ? `<p class="reading" lang="ja">${r}</p>` : ''}
      <p class="meaning">${m.join(', ')}</p>
      ${example ? `
        <button class="example" lang="ja">${example.ja}</button>
        <p class="example-en">${example.en}</p>` : ''}
    </section>`
}

function render() {
  app.innerHTML = `
    <main class="card">
      <button class="face" aria-label="Afficher la réponse" ${revealed ? 'disabled' : ''}>
        <span class="word" lang="ja">${current.w}</span>
      </button>
      ${revealed ? answer() : '<p class="hint">Touchez le mot pour voir la réponse</p>'}
    </main>
    <nav class="actions">
      <button class="listen" ${canSpeak ? '' : 'disabled'}>Écouter</button>
      <button class="next">Mot suivant</button>
    </nav>`
}

app.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return
  if (btn.matches('.face')) {
    revealed = true
    render()
    speak(current.r)
  } else if (btn.matches('.listen')) {
    speak(current.r)
  } else if (btn.matches('.example')) {
    speak(btn.textContent)
  } else if (btn.matches('.next')) {
    pick()
  }
})

loadCards()
  .then((data) => {
    cards = data
    pick()
  })
  .catch((err) => {
    app.innerHTML = `<p class="error">Impossible de charger le vocabulaire (${err.message}). Vérifiez la connexion puis rechargez la page.</p>`
  })
