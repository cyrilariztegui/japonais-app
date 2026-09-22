import argparse
import json
from pathlib import Path

import ipadic
import MeCab
from openjlpt import get_vocab
from wordfreq import zipf_frequency

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "vocab.json"
TAGGER = MeCab.Tagger(ipadic.MECAB_ARGS)


def contains_word(sentence, forms):
    bounds, bases, pos = {0}, set(), 0
    node = TAGGER.parseToNode(sentence)
    while node:
        if node.surface:
            pos = sentence.index(node.surface, pos) + len(node.surface)
            bounds.add(pos)
            features = node.feature.split(",")
            bases.add(features[6] if len(features) > 6 else "")
        node = node.next
    if forms & bases:
        return True
    return any(
        i in bounds and i + len(f) in bounds
        for f in forms
        for i in range(len(sentence))
        if sentence.startswith(f, i)
    )


def to_card(v, max_examples):
    reading = v.reading or v.word
    card = {"id": f"{v.word}|{reading}", "w": v.word, "r": reading, "m": v.meanings}
    forms = {v.word, reading}
    examples = [e for e in (v.examples or []) if contains_word(e.ja, forms)][:max_examples]
    if examples:
        card["ex"] = [{"ja": e.ja, "en": e.en} for e in examples]
    return card


def frequency(card):
    return -zipf_frequency(card["w"], "ja")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--levels", nargs="+", default=["N5"])
    parser.add_argument("--max-examples", type=int, default=2)
    args = parser.parse_args()

    cards = [
        c
        for lvl in args.levels
        for c in sorted((to_card(v, args.max_examples) for v in get_vocab(lvl)), key=frequency)
    ]
    ids = [c["id"] for c in cards]
    assert len(ids) == len(set(ids)), "identifiants en double"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(cards, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    without = sum(1 for c in cards if "ex" not in c)
    print(f"{len(cards)} cartes, {without} sans exemple, {OUT.stat().st_size / 1024:.0f} Ko -> {OUT}")


if __name__ == "__main__":
    main()
