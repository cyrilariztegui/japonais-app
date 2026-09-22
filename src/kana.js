import { toKatakana } from 'wanakana'

const HIRAGANA = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん']

const toCard = (kana) => ({ id: `kana:${kana}`, w: kana, r: kana, m: [] })

export const kanaCards = [
  ...HIRAGANA.map(toCard),
  ...HIRAGANA.map((h) => toCard(toKatakana(h))),
]
