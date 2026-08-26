#!/usr/bin/env python3
import argparse
import sys as _sys
if "--course" in _sys.argv:
    import os as _os
    _os.environ["WS_COURSE"] = _sys.argv[_sys.argv.index("--course") + 1]
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


import os
ROOT = Path(__file__).resolve().parents[1] / "web" / os.environ.get("WS_COURSE", "tagalog-pimsleur")
TRANSCRIPTS_DIR = ROOT / "transcripts"
RAW_DIR = TRANSCRIPTS_DIR / "raw"
ENRICHED_DIR = TRANSCRIPTS_DIR / "enriched"
BATCH_DIR = TRANSCRIPTS_DIR / "enriched_batches"


def read_key(path):
    key = Path(path).read_text().strip()
    if not key or key == "TU_OPENAI_API_KEY" or not key.startswith(("sk-", "sk-proj-")):
        raise SystemExit(f"OpenAI key is missing or invalid in {path}")
    return key


def post_json(api_key, payload):
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"OpenAI HTTP {error.code}: {detail}") from error


def build_enrich_payload(track_meta, segments, model, batch_label, total_batches):
    prompt = {
        "id": track_meta["id"],
        "title": track_meta["title"],
        "kind": track_meta["kind"],
        "batch": batch_label,
        "total_batches": total_batches,
        "segments": segments,
    }
    return {
        "model": model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You prepare private study notes for a Spanish-speaking learner of Tagalog. "
                    "Return strict JSON. Use the provided timed segments as the segmentation. "
                    "Preserve every segment's start, end, and text exactly as provided. "
                    "Do not merge, split, translate, or paraphrase the text field. "
                    "Label language as en, tl, mixed, or other. For Tagalog or mixed segments, add a concise "
                    "Spanish translation and a useful grammar/usage note. For English-only segments, keep "
                    "translation_es and note_es empty strings unless a short context note is genuinely useful."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Return JSON with one key: segments. "
                    "Return exactly the same number of segments, in the same order. "
                    "Each segment must have keys: start, end, language, kind, text, translation_es, note_es. "
                    "Use kind values like instruction, prompt, phrase, dialogue, explanation, other.\n\n"
                    + json.dumps(prompt, ensure_ascii=False)
                ),
            },
        ],
    }


def request_enriched_segments(api_key, track_meta, segments, model, batch_label, total_batches):
    payload = build_enrich_payload(track_meta, segments, model, batch_label, total_batches)
    for attempt in range(1, 4):
        print(
            f"enriching {track_meta['id']} batch {batch_label}/{total_batches}"
            f"{'' if attempt == 1 else f' retry {attempt}'}",
            flush=True,
        )
        response = post_json(api_key, payload)
        content = response["choices"][0]["message"]["content"]
        enriched = json.loads(content)
        batch_segments = enriched.get("segments") or []
        if len(batch_segments) == len(segments):
            return batch_segments
        print(
            f"segment mismatch {track_meta['id']} batch {batch_label}: "
            f"expected {len(segments)}, got {len(batch_segments)}",
            flush=True,
        )
    return None


def fallback_enrich_segments(api_key, track_meta, segments, model, batch_label, total_batches):
    if len(segments) == 1:
        segment = segments[0]
        return [
            {
                "start": segment.get("start"),
                "end": segment.get("end"),
                "language": "other",
                "kind": "other",
                "text": segment.get("text", ""),
                "translation_es": "",
                "note_es": "",
            }
        ]

    midpoint = len(segments) // 2
    print(
        f"splitting {track_meta['id']} batch {batch_label}: "
        f"{len(segments[:midpoint])}+{len(segments[midpoint:])}",
        flush=True,
    )
    left_label = f"{batch_label}a"
    right_label = f"{batch_label}b"
    left = request_enriched_segments(
        api_key, track_meta, segments[:midpoint], model, left_label, total_batches
    )
    if left is None:
        left = fallback_enrich_segments(
            api_key, track_meta, segments[:midpoint], model, left_label, total_batches
        )
    right = request_enriched_segments(
        api_key, track_meta, segments[midpoint:], model, right_label, total_batches
    )
    if right is None:
        right = fallback_enrich_segments(
            api_key, track_meta, segments[midpoint:], model, right_label, total_batches
        )
    return left + right


def enrich_batch(api_key, track_meta, segments, model, batch_index, total_batches, force=False):
    batch_dir = BATCH_DIR / track_meta["id"]
    batch_dir.mkdir(parents=True, exist_ok=True)
    batch_path = batch_dir / f"batch-{batch_index:03d}.json"
    if batch_path.exists() and not force:
        cached = json.loads(batch_path.read_text())
        cached_segments = cached.get("segments") or []
        if len(cached_segments) == len(segments):
            return cached_segments
        print(
            f"cache mismatch {track_meta['id']} batch {batch_index}: "
            f"expected {len(segments)}, got {len(cached_segments)}; recomputing",
            flush=True,
        )

    batch_segments = request_enriched_segments(
        api_key, track_meta, segments, model, batch_index, total_batches
    )
    if batch_segments is None:
        batch_segments = fallback_enrich_segments(
            api_key, track_meta, segments, model, batch_index, total_batches
        )
    batch_path.write_text(json.dumps({"segments": batch_segments}, ensure_ascii=False, indent=2) + "\n")
    return batch_segments


def build_study_guide(api_key, track_meta, segments, model, force=False):
    batch_dir = BATCH_DIR / track_meta["id"]
    batch_dir.mkdir(parents=True, exist_ok=True)
    guide_path = batch_dir / "study-guide.json"
    if guide_path.exists() and not force:
        return json.loads(guide_path.read_text())

    compact_segments = [
        {
            "language": segment.get("language"),
            "kind": segment.get("kind"),
            "text": segment.get("text", ""),
            "translation_es": segment.get("translation_es", ""),
        }
        for segment in segments
    ]
    payload = {
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You create a compact Spanish study guide for one private Tagalog audio lesson. "
                    "Return strict JSON only. Do not include long notes or copyright-style full script dumps. "
                    "Extract the practical communicative goal, the main themes, and a short representative "
                    "conversation/key-phrase outline."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Return JSON with keys: summary_es, topics, dialogue. "
                    "summary_es: one concise Spanish sentence explaining what the lesson teaches. "
                    "topics: 4 to 8 short Spanish pill labels. "
                    "dialogue: object with tl and es arrays, same length when possible, 4 to 10 short lines. "
                    "Use Tagalog phrases in dialogue.tl and Spanish meanings in dialogue.es. "
                    "If the audio is a reading instead of a dialogue, use the most useful phrases as the outline.\n\n"
                    + json.dumps(
                        {"track": track_meta, "segments": compact_segments},
                        ensure_ascii=False,
                    )
                ),
            },
        ],
    }
    print(f"building guide {track_meta['id']}", flush=True)
    response = post_json(api_key, payload)
    guide = json.loads(response["choices"][0]["message"]["content"])
    guide.setdefault("summary_es", "Guía de estudio de la lección.")
    guide.setdefault("topics", [])
    guide.setdefault("dialogue", {"tl": [], "es": []})
    guide_path.write_text(json.dumps(guide, ensure_ascii=False, indent=2) + "\n")
    return guide


def enrich(api_key, raw_path, model, force=False, batch_size=30):
    raw = json.loads(raw_path.read_text())
    out_path = ENRICHED_DIR / raw_path.name
    if out_path.exists() and not force:
        print(f"skip {raw['id']} already enriched")
        return

    source_segments = raw.get("segments") or [{"start": None, "end": None, "text": raw["text"]}]
    batches = [
        source_segments[index : index + batch_size]
        for index in range(0, len(source_segments), batch_size)
    ]
    track_meta = {
        "id": raw["id"],
        "title": raw["title"],
        "kind": raw["kind"],
    }

    segments = []
    for index, batch in enumerate(batches, start=1):
        segments.extend(enrich_batch(api_key, track_meta, batch, model, index, len(batches), force))

    if not segments:
        raise RuntimeError(f"No segments returned for {raw_path}")

    guide = build_study_guide(api_key, track_meta, segments, model, force)

    enriched = {
        "id": raw["id"],
        "title": raw["title"],
        "summary_es": guide.get("summary_es", ""),
        "topics": guide.get("topics") or [],
        "dialogue": guide.get("dialogue") or {"tl": [], "es": []},
        "segments": segments,
    }
    enriched["_meta"] = {
        "raw": f"transcripts/raw/{raw_path.name}",
        "model": model,
        "batch_size": batch_size,
    }
    ENRICHED_DIR.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2) + "\n")
    print(f"saved {out_path} ({len(enriched['segments'])} segments)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", default="tagalog-pimsleur")
    parser.add_argument("--key-file", default="~/.config/victor/openai_api_key")
    parser.add_argument("--model", default="gpt-4o-mini")
    parser.add_argument("--track")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--batch-size", type=int, default=30)
    args = parser.parse_args()

    api_key = read_key(Path(args.key_file).expanduser())
    paths = sorted(RAW_DIR.glob("*.json"))
    if args.track:
        paths = [RAW_DIR / f"{args.track}.json"]
    elif not args.all:
        paths = paths[:1]
    if args.limit:
        paths = paths[: args.limit]

    for path in paths:
        if not path.exists():
            raise FileNotFoundError(path)
        raw = json.loads(path.read_text())
        if raw.get("partial"):
            print(f"skip {raw.get('id', path.stem)} partial transcript")
            continue
        enrich(api_key, path, args.model, args.force, args.batch_size)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
