import { toRomaji, toHiragana } from 'wanakana'

const MORA = /っ?[^ゃゅょぁぃぅぇぉ][ゃゅょぁぃぅぇぉ]?|ー/g
const LONG = { a: 'â', i: 'î', ou: 'oû', é: 'ê', o: 'ô' }
const SPECIAL = { てぃ: 'ti', でぃ: 'di', ふぁ: 'fa', ふぃ: 'fi', ふぇ: 'fe', ふぉ: 'fo' }
const EXTENDS = { a: 'あ', i: 'い', ou: 'う', é: 'えい', o: 'おう' }

function syllable(mora) {
  const base = mora.replace('っ', '')
  let s = (SPECIAL[base] ?? toRomaji(base))
    .replace(/sh/g, '§')
    .replace(/ch/g, 'tch')
    .replace(/§/g, 'ch')
    .replace(/j/g, 'dj')
    .replace(/u/g, 'ou')
    .replace(/e/g, 'é')
    .replace(/g(?=[ié])/g, 'gu')
  if (mora.startsWith('っ')) s = (s.startsWith('tch') ? 't' : s[0]) + s
  return s
}

function lastVowel(s) {
  return Object.keys(LONG).find((v) => s.endsWith(v))
}

export function toFrench(kana) {
  const out = []
  for (const mora of toHiragana(kana, { passRomaji: true }).match(MORA) ?? []) {
    const prev = out.at(-1)
    const v = prev && lastVowel(prev)
    if (v && (mora === 'ー' || EXTENDS[v].includes(mora))) {
      out[out.length - 1] = prev.slice(0, -v.length) + LONG[v]
    } else if (mora === 'ん' && prev) {
      out[out.length - 1] = prev.replace(/é$/, 'è') + 'n'
    } else {
      out.push(syllable(mora))
    }
  }
  return out.join('-')
}

const PARTICLES = { は: 'wa', へ: 'é', を: 'o' }

function tokenToFrench(token) {
  const french = toFrench(token)
  return /[でま]す$/.test(token) ? french.replace(/(é?)-sou$/, (_, e) => (e ? 'èss' : 'ss')) : french
}

export function sentenceToFrench(reading) {
  return reading
    .split(' ')
    .map((token) => PARTICLES[token] ?? tokenToFrench(token))
    .join(' ')
}
