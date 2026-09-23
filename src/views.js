import { icons } from './icons.js'
import { toFrench, sentenceToFrench } from './phonetic.js'
import { formatDelay } from './srs.js'
import { canListen } from './audio.js'

const LEVELS = { good: 'Bien reconnu', close: 'Presque', miss: 'Pas reconnu' }

function repeatBlock(rec) {
  const listening = rec.status === 'listening'
  return `
    <button class="repeat ${listening ? 'active' : ''}" ${listening ? 'disabled' : ''}>
      ${icons.mic}<span>${listening ? 'Je t\'écoute…' : 'Répéter à voix haute'}</span>
    </button>
    ${rec.status === 'done' ? `<p class="heard ${rec.level}"><strong>${LEVELS[rec.level]}</strong><span>Entendu : <span lang="ja">${rec.heard || '(rien)'}</span></span></p>` : ''}
    ${rec.status === 'error' ? `<p class="heard">${rec.message}</p>` : ''}`
}

const DECK_INFO = {
  hiragana: { glyph: 'あ', subtitle: "L'alphabet de base" },
  katakana: { glyph: 'ア', subtitle: 'Mots étrangers' },
  vocab: { glyph: '単語', subtitle: 'Vocabulaire N5 par fréquence' },
  listening: { glyph: '音', subtitle: 'Dialogues du quotidien' },
}

export function tabbar(active, settingsAlert) {
  const tab = (id, icon, label, alert) => `
    <button class="tabbar-item" data-view="${id}" aria-current="${active === id ? 'page' : 'false'}">
      ${icon}<span>${label}</span>${alert ? '<i class="badge" aria-label="Sauvegarde conseillée"></i>' : ''}
    </button>`
  return `<nav class="tabbar">${tab('home', icons.home, 'Accueil')}${tab('settings', icons.settings, 'Réglages', settingsAlert)}</nav>`
}

export function homeView({ decks, stats, streak, total }) {
  const cards = decks
    .map((d) => {
      const s = stats[d.id]
      return `
        <button class="deck" data-deck="${d.id}">
          <span class="deck-glyph ${DECK_INFO[d.id].glyph.length > 1 ? 'wide' : ''}" lang="ja">${DECK_INFO[d.id].glyph}</span>
          <span class="deck-text">
            <strong>${d.label}</strong>
            <span>${DECK_INFO[d.id].subtitle}</span>
          </span>
          <span class="deck-seen">${s.seen} / ${d.cards.length}</span>
          <span class="deck-metrics">
            <span><i class="dot due"></i><b>${s.dueCount}</b> à revoir</span>
            <span><i class="dot new"></i><b>${s.newLeft}</b> nouvelles</span>
            ${icons.arrow}
          </span>
        </button>`
    })
    .join('')
  return `
    <header class="topbar">
      <p class="brand" lang="ja">日本語</p>
      <h1>Accueil</h1>
    </header>
    <main class="page home">
      <div class="summary">
        <p>Bonjour Cyril</p>
        ${streak ? `<p class="streak">${streak} jour${streak > 1 ? 's' : ''} de suite</p>` : ''}
      </div>
      <h2>Tes paquets</h2>
      <div class="deck-list">${cards}</div>
      <button class="start" ${total ? '' : 'disabled'}>
        ${total ? `${icons.play}<span>Commencer la séance</span><span class="pill">${total} cartes</span>` : '<span>Tout est à jour pour aujourd\'hui</span>'}
      </button>
    </main>`
}

const ruby = ([w, r]) => (w === r ? w : `<ruby>${w}<rt>${r}</rt></ruby>`)

function formsTable(f) {
  const rows = [
    ['Présent', f[1], f[0]],
    ['Négatif', f[4], f[2]],
    ['Passé', f[5], f[3]],
  ]
  return `
    <table class="forms">
      <thead><tr><th></th><th>Poli</th><th>Neutre</th></tr></thead>
      <tbody>${rows
        .map(([label, polite, plain]) => `<tr><th>${label}</th><td lang="ja">${ruby(polite)}</td><td lang="ja">${ruby(plain)}</td></tr>`)
        .join('')}</tbody>
    </table>`
}

function wordFace(card, revealed, settings) {
  const { w, r, m, ex } = card
  const example = ex?.[0]
  return `
    <button class="face" aria-label="${revealed ? 'Écouter' : 'Voir la réponse'}">
      <span class="glyph ${w.length > 3 ? 'long' : ''}" lang="ja">${w}</span>
    </button>
    ${revealed ? `
      ${r !== w ? `<p class="reading" lang="ja">${r}</p>` : ''}
      ${settings.phonetic ? `<p class="phonetic">${toFrench(r)}</p>` : ''}
      ${m.length ? `<i class="rule"></i><p class="meaning">${m.join(', ')}</p>` : ''}
      ${card.f ? formsTable(card.f) : ''}
      ${example ? `
        <button class="example">
          <span lang="ja">${example.ja}</span>
          <span class="example-en">${example.en}</span>
        </button>` : ''}` : '<p class="hint">Touche le caractère pour voir la réponse</p>'}`
}

function listeningFace(card, revealed, settings, recognition) {
  const { prev, w, r, m } = card
  return `
    ${prev ? `<p class="prev"><span lang="ja">${prev.ja}</span><span>${prev.en}</span></p>` : ''}
    <button class="replay" aria-label="Réécouter">${icons.play}</button>
    ${revealed ? `
      <p class="sentence" lang="ja">${w}</p>
      <p class="reading small" lang="ja">${r}</p>
      ${settings.phonetic ? `<p class="phonetic">${sentenceToFrench(r)}</p>` : ''}
      <i class="rule"></i>
      <p class="meaning">${m[0]}</p>
      ${canListen ? repeatBlock(recognition) : ''}` : '<p class="hint">Écoute, répète à voix haute, puis vérifie</p>'}`
}

function answerBar(card, revealed, options) {
  if (!revealed) {
    return card.listen
      ? '<nav class="answer-bar pair"><button class="slow">Plus lentement</button><button class="reveal primary">Voir la réponse</button></nav>'
      : '<nav class="answer-bar"><button class="reveal primary">Voir la réponse</button></nav>'
  }
  return `<nav class="answer-bar grades">${options
    .map((o) => `<button class="grade" data-rating="${o.rating}">${o.label}<small>${formatDelay(o.due)}</small></button>`)
    .join('')}</nav>`
}

export function sessionView({ deck, card, revealed, done, remaining, options, settings, recognition }) {
  const percent = Math.round((done / Math.max(done + remaining, 1)) * 100)
  const top = `
    <header class="session-top">
      <p class="session-deck"><i class="dot due"></i>${deck ? deck.label : 'Séance'}</p>
      <p class="session-count">${done} faite${done > 1 ? 's' : ''}</p>
      <button class="icon-button close" aria-label="Terminer la séance">${icons.close}</button>
      <div class="progress"><div style="width:${card ? percent : 100}%"></div></div>
    </header>`
  if (!card) {
    return `${top}
      <main class="page session-done">
        <p class="done-title">Séance terminée</p>
        <p class="hint">${done} carte${done > 1 ? 's' : ''} révisée${done > 1 ? 's' : ''}. Les prochaines arriveront plus tard dans la journée ou demain.</p>
        <button class="close primary">Retour à l'accueil</button>
      </main>`
  }
  const chip = card.listen ? card.situation : deck.label
  return `${top}
    <main class="page study">
      <article class="flashcard ${card.listen ? 'listening' : ''}">
        <div class="card-top">
          <span class="chip">${chip}</span>
          <button class="listen">${icons.sound}<span>Écouter</span></button>
        </div>
        ${card.listen ? listeningFace(card, revealed, settings, recognition) : wordFace(card, revealed, settings)}
      </article>
    </main>
    ${answerBar(card, revealed, options)}`
}

export function settingsView({ settings, cardCount, lastExport, message }) {
  const toggle = (name, label, detail) => `
    <div class="setting">
      <div><h3>${label}</h3><p>${detail}</p></div>
      <button class="switch" role="switch" data-setting="${name}" aria-checked="${settings[name]}" aria-label="${label}"><i></i></button>
    </div>`
  return `
    <header class="topbar">
      <p class="brand" lang="ja">日本語</p>
      <h1>Réglages</h1>
    </header>
    <main class="page settings">
      <section>
        <h2>Rythme</h2>
        <div class="panel">
          <div class="setting">
            <div><h3>Nouvelles cartes par jour</h3><p>Par paquet. 10 convient à 15-30 minutes quotidiennes.</p></div>
            <div class="stepper">
              <button class="step" data-step="-5" aria-label="Diminuer">${icons.minus}</button>
              <output>${settings.newPerDay}</output>
              <button class="step" data-step="5" aria-label="Augmenter">${icons.plus}</button>
            </div>
          </div>
        </div>
      </section>
      <section>
        <h2>Affichage et son</h2>
        <div class="panel">
          ${toggle('phonetic', 'Transcription française', 'Affiche la prononciation à la française sous les kana.')}
          ${toggle('autoplay', 'Lecture automatique', 'Prononce la réponse dès qu\'elle est révélée, et les dialogues dès leur arrivée.')}
        </div>
      </section>
      <section>
        <h2>Sauvegarde</h2>
        <div class="panel">
          <div class="setting">
            <div><h3>Exporter la progression</h3><p>${cardCount} cartes étudiées. Dernière sauvegarde : ${lastExport}.</p></div>
            <button class="export secondary">Exporter</button>
          </div>
          <div class="setting">
            <div><h3>Importer une sauvegarde</h3><p>Remplace la progression actuelle.</p></div>
            <label class="secondary">Importer<input type="file" class="import" accept="application/json,.json" hidden /></label>
          </div>
          ${message ? `<p class="message" role="status">${message}</p>` : ''}
        </div>
      </section>
      <footer class="credits">
        <p>Données : OpenJLPT, JMdict et KANJIDIC (EDRDG), phrases Tatoeba, sous licences Creative Commons BY-SA. Fréquences : wordfreq.</p>
        <p>Version du ${__BUILD__}</p>
      </footer>
    </main>`
}
