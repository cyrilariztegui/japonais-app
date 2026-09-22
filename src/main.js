import './style.css'
import { speak } from './audio.js'
import { hiraganaCards, katakanaCards } from './kana.js'
import { listeningCards } from './listening.js'
import { loadProgress, saveProgress, exportProgress, importProgress, backupIsStale } from './storage.js'
import { nextCard, preview, grade, streak } from './srs.js'
import { tabbar, homeView, sessionView, settingsView } from './views.js'

const app = document.querySelector('#app')
let progress = loadProgress()
const decks = [
  { id: 'hiragana', label: 'Hiragana', cards: hiraganaCards },
  { id: 'katakana', label: 'Katakana', cards: katakanaCards },
  { id: 'vocab', label: 'Mots', cards: [] },
  { id: 'listening', label: 'Écoute', cards: [] },
]
const state = { view: 'home', scope: [], current: null, revealed: false, done: 0, message: '' }

async function loadData(name) {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const deckStats = (d) => nextCard(d.cards, d.id, progress)

function pickNext() {
  for (const d of state.scope) {
    const result = deckStats(d)
    if (result.card) return { deck: d, card: result.card }
  }
  return null
}

function remaining() {
  return state.scope.reduce((sum, d) => {
    const s = deckStats(d)
    return sum + s.dueCount + s.newLeft
  }, 0)
}

function speakCard(rate) {
  const { card } = state.current
  card.listen ? speak(card.w, { rate, speaker: card.speaker }) : speak(card.r, { rate })
}

function startSession(scope) {
  Object.assign(state, { view: 'session', scope, done: 0 })
  advance()
}

function advance() {
  state.current = pickNext()
  state.revealed = false
  render()
  if (state.current?.card.listen && progress.settings.autoplay) speakCard()
}

function reveal() {
  state.revealed = true
  render()
  if (progress.settings.autoplay) speakCard()
}

function render() {
  const stale = backupIsStale(progress)
  if (state.view === 'home') {
    const stats = Object.fromEntries(decks.map((d) => [d.id, deckStats(d)]))
    const total = Object.values(stats).reduce((sum, s) => sum + s.dueCount + s.newLeft, 0)
    app.innerHTML = homeView({ decks, stats, streak: streak(progress), total }) + tabbar('home', stale)
  } else if (state.view === 'settings') {
    const lastExport = progress.lastExport ? new Date(progress.lastExport).toLocaleDateString('fr') : 'jamais'
    app.innerHTML =
      settingsView({
        settings: progress.settings,
        cardCount: Object.keys(progress.cards).length,
        lastExport,
        message: state.message,
      }) + tabbar('settings', stale)
  } else {
    const { deck, card } = state.current ?? {}
    app.innerHTML = sessionView({
      deck: deck ?? (state.scope.length === 1 ? state.scope[0] : null),
      card,
      revealed: state.revealed,
      done: state.done,
      remaining: remaining(),
      options: card && state.revealed ? preview(progress.cards[card.id]) : [],
      settings: progress.settings,
    })
  }
  app.dataset.view = state.view
}

function show(view) {
  Object.assign(state, { view, message: '' })
  render()
  window.scrollTo(0, 0)
}

async function onClick(btn) {
  if (btn.matches('.tabbar-item')) return show(btn.dataset.view)
  if (btn.matches('.deck')) return startSession(decks.filter((d) => d.id === btn.dataset.deck))
  if (btn.matches('.start')) return startSession(decks)
  if (btn.matches('.close')) return show('home')
  if (btn.matches('.face')) return state.revealed ? speakCard() : reveal()
  if (btn.matches('.reveal')) return reveal()
  if (btn.matches('.listen, .replay')) return speakCard()
  if (btn.matches('.slow')) return speakCard(0.6)
  if (btn.matches('.example')) return speak(btn.querySelector('[lang]').textContent)
  if (btn.matches('.grade')) {
    grade(state.current.card, state.current.deck.id, progress, Number(btn.dataset.rating))
    saveProgress(progress)
    state.done += 1
    return advance()
  }
  if (btn.matches('.step')) {
    const value = progress.settings.newPerDay + Number(btn.dataset.step)
    progress.settings.newPerDay = Math.min(50, Math.max(5, value))
    saveProgress(progress)
    return render()
  }
  if (btn.matches('.switch')) {
    const name = btn.dataset.setting
    progress.settings[name] = !progress.settings[name]
    saveProgress(progress)
    return render()
  }
  if (btn.matches('.export')) {
    try {
      await exportProgress(progress)
      state.message = 'Progression exportée.'
    } catch (err) {
      if (err.name === 'AbortError') return
      state.message = `Export impossible : ${err.message}`
    }
    return render()
  }
}

app.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (btn) onClick(btn)
})

app.addEventListener('change', async (e) => {
  if (!e.target.matches('.import')) return
  const file = e.target.files[0]
  e.target.value = ''
  if (!file || !confirm('Remplacer la progression actuelle par cette sauvegarde ?')) return
  try {
    progress = await importProgress(file)
    state.message = 'Sauvegarde importée.'
  } catch (err) {
    state.message = `Import impossible : ${err.message}`
  }
  render()
})

Promise.all([loadData('vocab'), loadData('dialogues')])
  .then(([vocab, dialogues]) => {
    decks.find((d) => d.id === 'vocab').cards = vocab
    decks.find((d) => d.id === 'listening').cards = listeningCards(dialogues)
    render()
  })
  .catch((err) => {
    app.innerHTML = `<p class="error">Impossible de charger les données (${err.message}). Vérifiez la connexion puis rechargez la page.</p>`
  })
