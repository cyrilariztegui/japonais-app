import { fsrs, generatorParameters, createEmptyCard, Rating } from 'ts-fsrs'

const LEARN_AHEAD_MS = 20 * 60 * 1000
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

export const GRADES = [
  { rating: Rating.Again, label: 'À revoir' },
  { rating: Rating.Hard, label: 'Difficile' },
  { rating: Rating.Good, label: 'Correct' },
  { rating: Rating.Easy, label: 'Facile' },
]

const today = () => new Date().toLocaleDateString('sv')

function newToday(progress, deckId) {
  if (progress.daily.date !== today() || !progress.daily.new) progress.daily = { date: today(), new: {} }
  return progress.daily.new[deckId] ?? 0
}

export function nextCard(deck, deckId, progress, now = new Date()) {
  const newCount = newToday(progress, deckId)
  const limit = progress.settings.newPerDay
  const seen = deck.filter((c) => progress.cards[c.id])
  const byDue = (a, b) => new Date(progress.cards[a.id].due) - new Date(progress.cards[b.id].due)
  const due = seen.filter((c) => new Date(progress.cards[c.id].due) <= now).sort(byDue)
  const fresh = newCount < limit ? deck.find((c) => !progress.cards[c.id]) : null
  const soon = seen
    .filter((c) => new Date(progress.cards[c.id].due) - now < LEARN_AHEAD_MS)
    .sort(byDue)

  return {
    card: due[0] ?? fresh ?? soon[0] ?? null,
    dueCount: due.length,
    newLeft: fresh ? limit - newCount : 0,
    seen: seen.length,
  }
}

export function preview(state, now = new Date()) {
  const outcomes = scheduler.repeat(state ?? createEmptyCard(now), now)
  return GRADES.map((g) => ({ ...g, due: outcomes[g.rating].card.due }))
}

export function grade(card, deckId, progress, rating, now = new Date()) {
  const state = progress.cards[card.id]
  if (!state) progress.daily.new[deckId] = newToday(progress, deckId) + 1
  progress.cards[card.id] = scheduler.next(state ?? createEmptyCard(now), now, rating).card
  if (progress.days.at(-1) !== today()) progress.days.push(today())
}

export function streak(progress) {
  const days = new Set(progress.days)
  const cursor = new Date()
  if (!days.has(today())) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(cursor.toLocaleDateString('sv'))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function formatDelay(due, now = new Date()) {
  const min = Math.round((new Date(due) - now) / 60000)
  if (min < 60) return `${Math.max(min, 1)} min`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.round(h / 24)
  return d < 31 ? `${d} j` : `${Math.round(d / 30)} mois`
}
