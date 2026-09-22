import { toKatakana } from 'wanakana'

const HIRAGANA = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん']

const toCard = (kana) => ({ id: `kana:${kana}`, w: kana, r: kana, m: [] })

export const hiraganaCards = HIRAGANA.map(toCard)
export const katakanaCards = HIRAGANA.map((h) => toCard(toKatakana(h)))
