"""Formes polies et neutres des verbes, pour les cartes de vocabulaire.

Ordre des formes : dictionnaire, -masu, -nai, -ta, -masen, -mashita.
"""
import MeCab, ipadic
TAGGER = MeCab.Tagger(ipadic.MECAB_ARGS)

I_ROW = dict(zip("うくぐすつぬぶむる", "いきぎしちにびみり"))
A_ROW = dict(zip("うくぐすつぬぶむる", "わかがさたなばまら"))
TA = {"う": "った", "つ": "った", "る": "った", "む": "んだ", "ぶ": "んだ", "ぬ": "んだ", "く": "いた", "ぐ": "いだ", "す": "した"}


def verb_type(word):
    tokens = []
    node = TAGGER.parseToNode(word)
    while node:
        if node.surface:
            tokens.append(node.feature.split(","))
        node = node.next
    if word.endswith("する"):
        return "suru"
    if len(tokens) == 1 and tokens[0][:2] == ["名詞", "サ変接続"]:
        return "suru-noun"
    last = tokens[-1] if tokens else None
    if not last or last[0] != "動詞" or len(last) < 7:
        return None
    kind = last[4]
    if kind.startswith("一段"):
        return "ichidan"
    if kind.startswith("五段"):
        return "godan-special" if "特殊" in kind else "godan"
    if kind.startswith("サ変"):
        return "suru"
    if kind.startswith("カ変"):
        return "kuru"
    return None


def godan_forms(s, word):
    stem, end = s[:-1], s[-1]
    past = "った" if word.endswith(("行く", "いく")) else TA[end]
    return [stem + I_ROW[end] + "ます", stem + A_ROW[end] + "ない", stem + past]


def plain_and_polite(s, kind, word):
    if kind == "ichidan":
        base = [s[:-1] + "ます", s[:-1] + "ない", s[:-1] + "た"]
    elif kind == "suru":
        p = s[:-2]
        base = [p + "します", p + "しない", p + "した"]
    elif kind == "godan-special":
        base = [s[:-1] + "います", s[:-1] + "らない", s[:-1] + "った"]
    else:
        base = godan_forms(s, word)
        if word == "ある":
            base[1] = "ない"
    polite = base[0]
    return base + [polite[:-2] + "ません", polite[:-2] + "ました"]


def conjugate(word, reading, meanings):
    if not meanings or not meanings[0].startswith("to "):
        return None
    if " " in word or "/" in word:
        return None
    kind = "ichidan" if word == "居る" else verb_type(word)
    if kind == "suru-noun":
        word, reading, kind = word + "する", reading + "する", "suru"
    if not kind or not word.endswith(tuple("うくぐすつぬぶむる")):
        return None
    if kind == "kuru":
        if not reading.endswith("くる"):
            return None
        rp = reading[:-2]
        wp, kanji = word[:-2], not word.endswith("くる")
        wr = [("く", "る"), ("き", "ます"), ("こ", "ない"), ("き", "た"), ("き", "ません"), ("き", "ました")]
        return [[wp + ("来" if kanji else k) + e, rp + k + e] for k, e in wr]
    try:
        forms = zip(plain_and_polite(word, kind, word), plain_and_polite(reading, kind, word))
        return [[word, reading], *map(list, forms)]
    except KeyError:
        return None
