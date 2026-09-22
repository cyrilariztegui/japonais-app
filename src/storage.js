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

const WEEK_MS = 7 * 24 * 3600 * 1000

export function backupIsStale(progress) {
  const seen = Object.keys(progress.cards).length > 0
  return seen && (!progress.lastExport || Date.now() - new Date(progress.lastExport) > WEEK_MS)
}

export async function exportProgress(progress) {
  const date = new Date().toISOString()
  const name = `japonais-progression-${date.slice(0, 10)}.json`
  const file = new File([JSON.stringify({ ...progress, lastExport: date })], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] })
  } else {
    const url = URL.createObjectURL(file)
    Object.assign(document.createElement('a'), { href: url, download: name }).click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  progress.lastExport = date
  saveProgress(progress)
}

export async function importProgress(file) {
  const data = JSON.parse(await file.text())
  if (!data?.cards || typeof data.cards !== 'object') throw new Error('ce fichier n\'est pas une sauvegarde de l\'app')
  saveProgress(data)
  return data
}
