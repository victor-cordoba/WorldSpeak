#!/usr/bin/env python3
import json
import os
import sys
if "--course" in sys.argv:
    os.environ["WS_COURSE"] = sys.argv[sys.argv.index("--course") + 1]
import re
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path


import os
ROOT = Path(__file__).resolve().parents[1] / "web" / os.environ.get("WS_COURSE", "tagalog-pimsleur")
TRANSCRIPTS = ROOT / "transcripts"
ENRICHED = TRANSCRIPTS / "enriched"
INDEX = TRANSCRIPTS / "index.json"
OUT = TRANSCRIPTS / "dictionary.json"


WORD_RE = re.compile(r"[A-Za-zÀ-ÿ\u00d1\u00f1'-]+")
SPACE_RE = re.compile(r"\s+")
SHORT_TAGALOG_WORDS = {
    "ang",
    "at",
    "ba",
    "di",
    "ka",
    "ko",
    "mo",
    "na",
    "ng",
    "pa",
    "po",
    "sa",
    "si",
    "oo",
}
ENGLISH_NOISE = {
    "a",
    "an",
    "and",
    "are",
    "beer",
    "coffee",
    "good",
    "he",
    "in",
    "is",
    "it",
    "my",
    "neat",
    "no",
    "none",
    "number",
    "of",
    "on",
    "or",
    "please",
    "she",
    "thanks",
    "the",
    "they",
    "this",
    "to",
    "we",
    "what",
    "who",
    "yes",
    "you",
}
ENGLISH_WORDS = ENGLISH_NOISE | {
    "already",
    "are",
    "arrived",
    "ask",
    "bathroom",
    "beautiful",
    "be",
    "child",
    "children",
    "coffee",
    "colleague",
    "correct",
    "days",
    "english",
    "expensive",
    "family",
    "first",
    "going",
    "good",
    "how",
    "know",
    "left",
    "little",
    "literally",
    "look",
    "many",
    "morning",
    "old",
    "repeat",
    "right",
    "road",
    "say",
    "she",
    "speaking",
    "stay",
    "sure",
    "there",
    "tomorrow",
    "turn",
    "water",
    "weeks",
    "where",
    "wife",
    "with",
    "would",
    "your",
    "youre",
    "you're",
}
TAGALOG_HINTS = {
    "ako",
    "alas",
    "alis",
    "anak",
    "ang",
    "ano",
    "anong",
    "apat",
    "araw",
    "asawa",
    "ba",
    "bang",
    "bata",
    "bigyan",
    "bibili",
    "bibilhin",
    "bumili",
    "bukas",
    "dalawa",
    "dito",
    "diba",
    "diretsyo",
    "dolyar",
    "gabi",
    "gaano",
    "galing",
    "gasolina",
    "gusto",
    "hindi",
    "ho",
    "huwag",
    "ilan",
    "ilang",
    "ingles",
    "inom",
    "inomin",
    "inumin",
    "isa",
    "ito",
    "iyon",
    "ka",
    "kailan",
    "kain",
    "kaliwa",
    "kami",
    "kanan",
    "kanina",
    "kanin",
    "kaunti",
    "ko",
    "konti",
    "kumain",
    "kumaliwa",
    "kumanan",
    "kumusta",
    "lang",
    "lima",
    "magandang",
    "magkano",
    "magtanong",
    "mahal",
    "malayo",
    "mamaya",
    "masyado",
    "may",
    "mayroon",
    "meron",
    "mo",
    "na",
    "nakakaintindi",
    "naman",
    "nandoon",
    "nasaan",
    "ng",
    "ngayon",
    "ninyo",
    "oo",
    "opo",
    "pa",
    "pakiulit",
    "palang",
    "papunta",
    "para",
    "pera",
    "pesos",
    "pilipinas",
    "pilipino",
    "po",
    "pwede",
    "rin",
    "roón",
    "roon",
    "sa",
    "saan",
    "sabay",
    "salamat",
    "sige",
    "tagalog",
    "tanghali",
    "tapos",
    "tayo",
    "tubig",
    "wala",
    "yan",
}
ENGLISH_PREFIXES = (
    "a little",
    "be sure",
    "beautiful ",
    "first ",
    "good ",
    "hello ",
    "how ",
    "literally",
    "look at",
    "number ",
    "now ",
    "read number",
    "repeat ",
    "she ",
    "the ",
    "this ",
    "try to",
    "what ",
    "where ",
    "you ",
    "you're ",
    "youre ",
    "your ",
)
NAME_OR_TITLE_RE = re.compile(
    r"\b(?:mr|mrs|ms|miss|ma'?am|sir|jones|dimaapi|alice|john|tala|gani|isagani|liwayway|maricel|ronald|bigayan|halili)\.?\b",
    re.IGNORECASE,
)


def clean(value):
    return SPACE_RE.sub(" ", (value or "").strip())


def norm(value):
    return clean(value).casefold()


def words(value):
    return WORD_RE.findall(value or "")


def entry_type(tagalog):
    count = len(words(tagalog))
    if clean(tagalog).endswith("?"):
        return "phrase"
    if count <= 1:
        return "word"
    if count <= 7:
        return "phrase"
    return "sentence"


def source_label(track):
    if track.get("kind") == "readings":
        reading = track.get("readingNumber") or track.get("lesson")
        lesson = track.get("lesson")
        return f"Lectura {int(reading):02d} · Lección {int(lesson):02d}"
    return track.get("title") or track.get("id", "")


def canonical_key(value):
    key = norm(value).strip(".?!")
    key = key.replace("kamusta", "kumusta")
    key = re.sub(r"[^\wÀ-ÿ\u00d1\u00f1]+", " ", key)
    return clean(key)


def looks_like_english(value):
    lowered = norm(value).strip()
    if not lowered:
      return True
    if lowered.startswith(ENGLISH_PREFIXES):
        return True

    tokens = [token.casefold().strip("'-") for token in words(value)]
    if not tokens:
        return True

    tagalog_hits = sum(1 for token in tokens if token in TAGALOG_HINTS)
    english_hits = sum(1 for token in tokens if token in ENGLISH_WORDS)
    if tagalog_hits == 0 and english_hits:
        return True
    if len(tokens) <= 4 and english_hits >= max(2, len(tokens) - 1) and tagalog_hits == 0:
        return True
    return False


def load_index():
    if not INDEX.exists():
        return {}
    data = json.loads(INDEX.read_text())
    return {track["id"]: track for track in data.get("tracks", [])}


def useful_pair(tagalog, spanish):
    tagalog = clean(tagalog)
    spanish = clean(spanish)
    if not tagalog or not spanish:
        return False
    if len(tagalog) < 2:
        return False
    if norm(tagalog).strip(".?!") == norm(spanish).strip(".?!"):
        return False
    if NAME_OR_TITLE_RE.search(tagalog):
        return False
    if looks_like_english(tagalog):
        return False
    tokens = [token.casefold().strip("'-") for token in words(tagalog)]
    if not tokens:
        return False
    lowered = norm(tagalog).strip(".?!")
    if any(char.isdigit() for char in lowered):
        return False
    if lowered.startswith(("number ", "read number ", "lesson ", "reading lesson ")):
        return False
    if len(tokens) == 1:
        token = tokens[0]
        if token in ENGLISH_NOISE:
            return False
        if len(token) <= 3 and token not in SHORT_TAGALOG_WORDS:
            return False
    if len(tokens) <= 3 and all(token in ENGLISH_NOISE for token in tokens):
        return False
    return True


def add_entry(entries, tagalog, spanish, topic, source, ref=None):
    tagalog = clean(tagalog)
    tagalog = tagalog.replace("Kamusta", "Kumusta").replace("kamusta", "kumusta")
    spanish = clean(spanish)
    if not useful_pair(tagalog, spanish):
        return

    key = canonical_key(tagalog)
    if key not in entries:
        entries[key] = {
            "tagalog": tagalog,
            "spanish": spanish,
            "type": entry_type(tagalog),
            "topic": topic,
            "sources": [],
            "refs": [],
        }
    else:
        existing = entries[key]
        translations = [part.strip() for part in existing["spanish"].split(" / ")]
        if spanish not in translations and len(translations) < 3:
            existing["spanish"] = f"{existing['spanish']} / {spanish}"
        if not existing.get("topic") and topic:
            existing["topic"] = topic

    if source and source not in entries[key]["sources"]:
        entries[key]["sources"].append(source)

    if ref:
        existing_refs = entries[key]["refs"]
        ref_key = (ref.get("trackId"), round(float(ref.get("start") or 0), 1))
        existing_keys = {
            (item.get("trackId"), round(float(item.get("start") or 0), 1))
            for item in existing_refs
        }
        if ref_key not in existing_keys and len(existing_refs) < 6:
            existing_refs.append(ref)


def build():
    index = load_index()
    entries = OrderedDict()

    for path in sorted(ENRICHED.glob("*.json")):
        data = json.loads(path.read_text())
        track = index.get(data.get("id"), {"id": data.get("id"), "title": data.get("title")})
        source = source_label(track)
        topics = [clean(topic) for topic in data.get("topics", []) if clean(topic)]
        topic = topics[0] if topics else ""

        dialogue = data.get("dialogue", {})
        for tagalog, spanish in zip(dialogue.get("tl", []), dialogue.get("es", [])):
            add_entry(entries, tagalog, spanish, topic, source)

        for segment in data.get("segments", []):
            language = segment.get("language")
            if language not in {"tl", "mixed"}:
                continue
            ref = {
                "trackId": data.get("id"),
                "start": segment.get("start"),
                "end": segment.get("end"),
                "source": source,
            }
            add_entry(
                entries,
                segment.get("text", ""),
                segment.get("translation_es", ""),
                topic,
                source,
                ref,
            )

    type_order = {"word": 0, "phrase": 1, "sentence": 2}
    rows = sorted(
        entries.values(),
        key=lambda item: (type_order.get(item.get("type"), 9), norm(item.get("tagalog", ""))),
    )

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "entryCount": len(rows),
        "entries": rows,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"saved {OUT} ({len(rows)} entries)")


if __name__ == "__main__":
    build()
