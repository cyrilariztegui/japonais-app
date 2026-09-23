import json
from pathlib import Path

from openjlpt import get_kanji

ROOT = Path(__file__).resolve().parent.parent / "public" / "data"
MAX_WORDS = 3


def clean_kun(reading):
    stem, _, okurigana = reading.strip("-").partition(".")
    return f"{stem}({okurigana})" if okurigana else stem


def standalone(readings):
    return [r for r in readings if "-" not in r] or readings


def unique(items):
    return list(dict.fromkeys(items))


def main():
    vocab = json.loads((ROOT / "vocab.json").read_text(encoding="utf-8"))
    cards = []
    for k in sorted(get_kanji("N5"), key=lambda k: k.freq or 10_000):
        kun = unique(clean_kun(r) for r in standalone(k.kunyomi))[:3]
        on = k.onyomi[:3]
        words = [c for c in vocab if k.character in c["w"] and "/" not in c["w"]][:MAX_WORDS]
        cards.append({
            "id": f"kanji:{k.character}",
            "w": k.character,
            "r": "、".join(r.replace("(", "").replace(")", "") for r in kun + on),
            "m": [m for m in k.meanings if "radical" not in m][:3],
            "kanji": True,
            "on": on,
            "kun": kun,
            "words": [{"w": c["w"], "r": c["r"], "m": c["m"][0]} for c in words],
        })
    out = ROOT / "kanji.json"
    out.write_text(json.dumps(cards, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    without = sum(1 for c in cards if not c["words"])
    print(f"{len(cards)} kanji, {without} sans mot associé, {out.stat().st_size / 1024:.0f} Ko -> {out}")


if __name__ == "__main__":
    main()
