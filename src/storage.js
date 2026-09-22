const KEY = 'progress:v1'

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.cards) return saved
  } catch {}
  return { cards: {}, daily: { date: '', new: {} }, deck: 'hiragana' }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}
