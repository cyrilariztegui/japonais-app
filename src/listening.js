export function listeningCards(dialogues) {
  return dialogues.flatMap((d) =>
    d.lines.map((line, i) => ({
      id: `dlg:${d.id}:${i}`,
      w: line.ja,
      r: line.r,
      m: [line.en],
      listen: true,
      situation: d.situation,
      prev: d.lines[i - 1],
      speaker: line.s === 'A' ? 0 : 1,
    })),
  )
}
