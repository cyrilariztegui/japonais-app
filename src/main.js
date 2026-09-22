import './style.css'
import { speak, canSpeak } from './audio.js'
import { toFrench, sentenceToFrench } from './phonetic.js'
import { hiraganaCards, katakanaCards } from './kana.js'
import { listeningCards } from './listening.js'
import { loadProgress, saveProgress, exportProgress, importProgress, backupIsStale } from './storage.js'
import { nextCard, preview, grade, formatDelay } from './srs.js'

const app = document.querySelector('#app')
let progress = loadProgress()
const decks = [
  { id: 'hiragana', label: 'Hiragana', cards: hiraganaCards },
  { id: 'katakana', label: 'Katakana', cards: katakanaCards },
  { id: 'vocab', label: 'Mots', cards: [] },
  { id: 'listening', label: 'Écoute', cards: [] },
]
let deck = decks.find((d) => d.id === progress.deck) ?? decks[0]
let session = null
let revealed = false

async function loadData(name) {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function advance() {
  session = nextCard(deck.cards, deck.id, progress)
  revealed = false
  render()
  if (session.card?.listen) speakCard()
}

function speakCard(rate) {
  const { listen, w, r, speaker } = session.card
  listen ? speak(w, { rate, speaker }) : speak(r, { rate })
}

function header() {
  const tabs = decks
    .map((d) => `<button class="tab" data-deck="${d.id}" aria-pressed="${d === deck}">${d.label}</button>`)
    .join('')
  const { dueCount, newLeft } = session
  return `
    <header>
      <nav class="tabs">${tabs}</nav>
      <div class="status-row">
        <p class="status">${dueCount} à réviser, ${newLeft} nouveaux</p>
        <button class="open-backup ${backupIsStale(progress) ? 'stale' : ''}">Sauvegarde</button>
      </div>
    </header>`
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

function listeningBody() {
  const { situation, prev, w, r, m } = session.card
  return `
    <main class="card listening">
      <p class="situation">${situation}</p>
      ${prev ? `<p class="prev"><span lang="ja">${prev.ja}</span><span class="prev-en">${prev.en}</span></p>` : ''}
      <button class="replay">Réécouter</button>
      ${revealed ? `
        <section class="answer">
          <p class="sentence" lang="ja">${w}</p>
          <p class="reading" lang="ja">${r}</p>
          <p class="romaji">${sentenceToFrench(r)}</p>
          <p class="meaning">${m[0]}</p>
        </section>` : ''}
    </main>`
}

function actions() {
  if (!revealed && session.card.listen) {
    return '<nav class="actions pair"><button class="slow">Plus lentement</button><button class="reveal">Voir la réponse</button></nav>'
  }
  if (!revealed) return '<nav class="actions"><button class="reveal">Voir la réponse</button></nav>'
  const options = preview(progress.cards[session.card.id])
  return `<nav class="actions grades">${options
    .map((o) => `<button class="grade" data-rating="${o.rating}">${o.label}<small>${formatDelay(o.due)}</small></button>`)
    .join('')}</nav>`
}

function render() {
  if (!session.card) {
    app.innerHTML = `
      ${header()}
      <main class="card done">
        <p class="done-title">Terminé pour aujourd'hui</p>
        <p class="hint">Plus rien à réviser pour l'instant. Les prochaines cartes arriveront plus tard dans la journée ou demain.</p>
      </main>`
    return
  }
  if (session.card.listen) {
    app.innerHTML = `${header()}${listeningBody()}${actions()}`
    return
  }
  app.innerHTML = `
    ${header()}
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
  speakCard()
}

app.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return
  if (btn.matches('.open-backup')) {
    openBackup()
  } else if (btn.matches('.tab')) {
    deck = decks.find((d) => d.id === btn.dataset.deck)
    progress.deck = deck.id
    saveProgress(progress)
    advance()
  } else if (btn.matches('.face')) revealed ? speakCard() : reveal()
  else if (btn.matches('.replay')) speakCard()
  else if (btn.matches('.slow')) speakCard(0.6)
  else if (btn.matches('.reveal')) reveal()
  else if (btn.matches('.example')) speak(btn.textContent)
  else if (btn.matches('.grade')) {
    grade(session.card, deck.id, progress, Number(btn.dataset.rating))
    saveProgress(progress)
    advance()
  }
})

document.body.insertAdjacentHTML('beforeend', `
  <dialog class="backup">
    <h2>Sauvegarde</h2>
    <p class="backup-info"></p>
    <button class="export">Exporter la progression</button>
    <label class="import">Importer une sauvegarde<input type="file" accept="application/json,.json" hidden /></label>
    <p class="backup-message" role="status"></p>
    <button class="close">Fermer</button>
  </dialog>`)

const backup = document.querySelector('.backup')
const backupMessage = backup.querySelector('.backup-message')

function openBackup() {
  const count = Object.keys(progress.cards).length
  const last = progress.lastExport ? new Date(progress.lastExport).toLocaleDateString('fr') : 'jamais'
  backup.querySelector('.backup-info').textContent = `${count} cartes étudiées. Dernière sauvegarde : ${last}.`
  backupMessage.textContent = ''
  backup.showModal()
}

backup.addEventListener('click', async (e) => {
  if (e.target.matches('.close')) backup.close()
  if (!e.target.matches('.export')) return
  try {
    await exportProgress(progress)
    backupMessage.textContent = 'Progression exportée.'
    render()
  } catch (err) {
    if (err.name !== 'AbortError') backupMessage.textContent = `Export impossible : ${err.message}`
  }
})

backup.querySelector('input').addEventListener('change', async (e) => {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file || !confirm('Remplacer la progression actuelle par cette sauvegarde ?')) return
  try {
    progress = await importProgress(file)
    deck = decks.find((d) => d.id === progress.deck) ?? decks[0]
    backupMessage.textContent = 'Sauvegarde importée.'
    advance()
  } catch (err) {
    backupMessage.textContent = `Import impossible : ${err.message}`
  }
})

Promise.all([loadData('vocab'), loadData('dialogues')])
  .then(([vocab, dialogues]) => {
    decks.find((d) => d.id === 'vocab').cards = vocab
    decks.find((d) => d.id === 'listening').cards = listeningCards(dialogues)
    advance()
  })
  .catch((err) => {
    app.innerHTML = `<p class="error">Impossible de charger les données (${err.message}). Vérifiez la connexion puis rechargez la page.</p>`
  })
