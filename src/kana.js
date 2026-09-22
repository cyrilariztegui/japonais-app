import { toKatakana } from 'wanakana'

const BASE = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん']
const VOICED = [...'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ']
const COMBOS = [...'きぎしじちにひびぴみり'].flatMap((k) => [...'ゃゅょ'].map((y) => k + y))
const HIRAGANA = [...BASE, ...VOICED, ...COMBOS]

const toCard = (kana) => ({ id: `kana:${kana}`, w: kana, r: kana, m: [] })

export const hiraganaCards = HIRAGANA.map(toCard)
export const katakanaCards = HIRAGANA.map((h) => toCard(toKatakana(h)))
