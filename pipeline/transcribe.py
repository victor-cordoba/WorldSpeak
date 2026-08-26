#!/usr/bin/env python3
import argparse
import sys as _sys
if "--course" in _sys.argv:
    import os as _os
    _os.environ["WS_COURSE"] = _sys.argv[_sys.argv.index("--course") + 1]
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path


import os
ROOT = Path(__file__).resolve().parents[1] / "web" / os.environ.get("WS_COURSE", "tagalog-pimsleur")
AUDIO_DIR = ROOT / "audio"
OUT_DIR = ROOT / "transcripts"
RAW_DIR = OUT_DIR / "raw"
CHUNK_DIR = OUT_DIR / "chunks"


def build_tracks():
    tracks = []
    for lesson in range(1, 31):
        num = f"{lesson:02d}"
        tracks.append(
            {
                "id": f"lesson-{num}-main",
                "lesson": lesson,
                "kind": "main",
                "title": f"Lección {num}",
                "file": f"Lesson {num} Main.mp3",
            }
        )
    for reading in range(1, 21):
        num = f"{reading:02d}"
        paired_lesson = reading + 10
        tracks.append(
            {
                "id": f"lesson-{num}-readings",
                "lesson": paired_lesson,
                "readingNumber": reading,
                "kind": "readings",
                "title": f"Lectura {num}",
                "subtitle": f"Para después de la lección {paired_lesson:02d}",
                "file": f"Lesson {num} Readings.mp3",
            }
        )
    return tracks


def read_key(path):
    key = Path(path).read_text().strip()
    if not key or key == "TU_OPENAI_API_KEY" or not key.startswith(("sk-", "sk-proj-")):
        raise SystemExit(f"OpenAI key is missing or invalid in {path}")
    return key


def run(cmd):
    subprocess.run(cmd, check=True)


def ensure_chunks(track, chunk_seconds):
    source = AUDIO_DIR / track["file"]
    if not source.exists():
        raise FileNotFoundError(source)

    track_chunk_dir = CHUNK_DIR / track["id"]
    track_chunk_dir.mkdir(parents=True, exist_ok=True)
    meta_path = track_chunk_dir / "chunks-meta.json"
    existing = sorted(track_chunk_dir.glob("chunk-*.mp3"))
    if existing and meta_path.exists():
        meta = json.loads(meta_path.read_text())
        if meta.get("chunk_seconds") == chunk_seconds:
            return existing

    if existing:
        for path in track_chunk_dir.glob("chunk-*.*"):
            path.unlink()

    existing = sorted(track_chunk_dir.glob("chunk-*.mp3"))
    if existing:
        return existing

    pattern = str(track_chunk_dir / "chunk-%03d.mp3")
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(source),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-b:a",
            "48k",
            "-f",
            "segment",
            "-segment_time",
            str(chunk_seconds),
            "-reset_timestamps",
            "1",
            pattern,
        ]
    )
    chunks = sorted(track_chunk_dir.glob("chunk-*.mp3"))
    meta_path.write_text(
        json.dumps({"chunk_seconds": chunk_seconds, "chunks": len(chunks)}, indent=2) + "\n"
    )
    return chunks


def multipart_body(fields, file_field, file_path):
    boundary = f"----codex-tagalog-{uuid.uuid4().hex}"
    chunks = []
    for name, value in fields.items():
        values = value if isinstance(value, list) else [value]
        for item in values:
            chunks.append(f"--{boundary}\r\n".encode())
            chunks.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
            chunks.append(str(item).encode())
            chunks.append(b"\r\n")

    filename = file_path.name
    chunks.append(f"--{boundary}\r\n".encode())
    chunks.append(
        (
            f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'
            "Content-Type: audio/mpeg\r\n\r\n"
        ).encode()
    )
    chunks.append(file_path.read_bytes())
    chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return boundary, b"".join(chunks)


def transcribe_chunk(api_key, chunk_path, model, timestamps):
    prompt = (
        "This is a Tagalog language lesson with English explanations and Tagalog practice "
        "phrases. Transcribe exactly in the original languages. Do not translate."
    )
    fields = {
        "model": model,
        "response_format": "verbose_json" if timestamps else "json",
        "prompt": prompt,
    }
    if timestamps:
        fields["timestamp_granularities[]"] = "segment"

    boundary, body = multipart_body(
        fields,
        "file",
        chunk_path,
    )
    request = urllib.request.Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"OpenAI HTTP {error.code}: {detail}") from error


def write_index(tracks):
    available = []
    for track in tracks:
        raw_path = RAW_DIR / f"{track['id']}.json"
        enriched_path = OUT_DIR / "enriched" / f"{track['id']}.json"
        if raw_path.exists():
            data = json.loads(raw_path.read_text())
            if data.get("partial"):
                continue
            enriched = {}
            if enriched_path.exists():
                enriched = json.loads(enriched_path.read_text())
            available.append(
                {
                    "id": track["id"],
                    "lesson": track["lesson"],
                    "readingNumber": track.get("readingNumber"),
                    "kind": track["kind"],
                    "title": track["title"],
                    "subtitle": track.get("subtitle"),
                    "raw": f"transcripts/raw/{track['id']}.json",
                    "enriched": f"transcripts/enriched/{track['id']}.json"
                    if enriched_path.exists()
                    else None,
                    "chars": len(data.get("text", "")),
                    "timed": bool(data.get("segments")),
                    "summary": enriched.get("summary_es", ""),
                    "topics": (enriched.get("topics") or [])[:8],
                    "dialogueCount": len(enriched.get("dialogue", {}).get("tl", [])),
                }
            )
    (OUT_DIR / "index.json").write_text(
        json.dumps({"tracks": available}, ensure_ascii=False, indent=2) + "\n"
    )


def transcribe_track(api_key, track, args):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    raw_path = RAW_DIR / f"{track['id']}.json"
    if raw_path.exists() and not args.force:
        print(f"skip {track['id']} already exists")
        return

    all_chunks = ensure_chunks(track, args.chunk_seconds)
    chunks = all_chunks
    if args.max_chunks:
        chunks = chunks[: args.max_chunks]
    partial = len(chunks) < len(all_chunks)

    chunk_outputs = []
    for index, chunk in enumerate(chunks, start=1):
        chunk_json = chunk.with_suffix(".json")
        if chunk_json.exists() and not args.force:
            data = json.loads(chunk_json.read_text())
        else:
            print(f"transcribing {track['id']} chunk {index}/{len(chunks)}")
            data = transcribe_chunk(api_key, chunk, args.model, args.timestamps)
            chunk_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
            time.sleep(args.pause)

        text = data.get("text", "")
        if not text.strip():
            raise RuntimeError(f"No transcription text returned for {chunk}")
        offset = (index - 1) * args.chunk_seconds
        segments = []
        for segment in data.get("segments", []):
            segments.append(
                {
                    "start": round(float(segment.get("start", 0)) + offset, 3),
                    "end": round(float(segment.get("end", 0)) + offset, 3),
                    "text": segment.get("text", "").strip(),
                }
            )
        chunk_outputs.append({"chunk": chunk.name, "offset": offset, "text": text, "segments": segments})

    combined = "\n\n".join(item["text"].strip() for item in chunk_outputs)
    combined_segments = [
        segment
        for item in chunk_outputs
        for segment in item.get("segments", [])
        if segment.get("text")
    ]
    raw_path.write_text(
        json.dumps(
            {
                "id": track["id"],
                "lesson": track["lesson"],
                "kind": track["kind"],
                "title": track["title"],
                "model": args.model,
                "chunk_seconds": args.chunk_seconds,
                "total_chunks": len(all_chunks),
                "partial": partial,
                "chunks": chunk_outputs,
                "segments": combined_segments,
                "text": combined,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(f"saved {raw_path} ({len(combined)} chars)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", default="tagalog-pimsleur")
    parser.add_argument("--key-file", default="~/.config/victor/openai_api_key")
    parser.add_argument("--model", default="whisper-1")
    parser.add_argument("--timestamps", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--chunk-seconds", type=int, default=480)
    parser.add_argument("--track")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--max-chunks", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--pause", type=float, default=0.5)
    args = parser.parse_args()

    api_key = read_key(Path(args.key_file).expanduser())
    tracks = build_tracks()
    selected = tracks
    if args.track:
        selected = [track for track in tracks if track["id"] == args.track]
        if not selected:
            raise SystemExit(f"Unknown track: {args.track}")
    elif not args.all:
        selected = tracks[:1]

    if args.limit:
        selected = selected[: args.limit]

    for track in selected:
        transcribe_track(api_key, track, args)

    write_index(tracks)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
