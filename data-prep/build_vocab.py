import argparse
import json
from pathlib import Path
from wordfreq import zipf_frequency

from openjlpt import get_vocab

OUT = Path(__file__).resolve().parent.parent / "public" / "data" / "vocab.json"


def to_card(v, max_examples):
    reading = v.reading or v.word
    card = {"id": f"{v.word}|{reading}", "w": v.word, "r": reading, "m": v.meanings}
    examples = (v.examples or [])[:max_examples]
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
    print(f"{len(cards)} cartes, {OUT.stat().st_size / 1024:.0f} Ko -> {OUT}")


if __name__ == "__main__":
    main()
