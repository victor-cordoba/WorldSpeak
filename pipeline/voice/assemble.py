#!/usr/bin/env python3
"""Monta el MP3 de la lección a partir de los clips y escribe la transcripción.

- Concatena clips con silencios (la "pause" de cada cue) usando ffmpeg.
- Como conocemos el texto y la duración de cada clip, escribe DIRECTAMENTE
  transcripts/raw y transcripts/enriched con timestamps exactos. No hace falta
  Whisper ni enriquecer con GPT: la sincronización es perfecta y gratis.
- Actualiza course.json (pista) y transcripts/index.json.

Uso: assemble.py --course tagalog --lesson 1
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

from common import FFMPEG, course_dir, duration_of, load_json, save_json


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--lesson", type=int, required=True)
    parser.add_argument("--intro-pause", type=float, default=0.8)
    parser.add_argument("--clip-key", default="clip")
    parser.add_argument("--out", default=None, help="ruta de salida alternativa; si se da, NO actualiza course.json ni transcripts")
    parser.add_argument("--track-id", default=None, help="publicar bajo otro id de pista (p. ej. lesson-01-fish) con su propio MP3 y transcripts")
    parser.add_argument("--title-suffix", default="", help="sufijo para el título de la pista alternativa")
    parser.add_argument("--kind", default="main")
    args = parser.parse_args()

    cdir = course_dir(args.course)
    num = f"{args.lesson:02d}"
    script = load_json(cdir / "scripts" / f"lesson-{num}.json")
    ck = args.clip_key
    cues = [c for c in script["cues"] if c.get(ck) and (cdir / c[ck]).exists()]
    if len(cues) != len(script["cues"]):
        raise SystemExit(f"faltan clips: {len(script['cues']) - len(cues)}. Ejecuta synth.py")

    track_id = args.track_id or f"lesson-{num}-main"
    kind = args.kind if args.track_id else "main"
    audio_dir = cdir / "audio"
    audio_dir.mkdir(exist_ok=True)
    out_mp3 = Path(args.out) if args.out else audio_dir / (f"Lesson {num} {args.track_id.split('-')[-1].capitalize()}.mp3" if args.track_id else f"Lesson {num} Main.mp3")

    # timeline + lista de concat
    segments = []
    t = args.intro_pause
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        silence_cache = {}

        def silence(seconds):
            seconds = round(max(0.0, float(seconds)), 2)
            if seconds <= 0:
                return None
            if seconds not in silence_cache:
                path = tmp / f"sil-{seconds}.mp3"
                subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", str(seconds), "-b:a", "64k", str(path)], check=True)
                silence_cache[seconds] = path
            return silence_cache[seconds]

        entries = []
        first = silence(args.intro_pause)
        if first:
            entries.append(first)
        for cue in cues:
            clip = cdir / cue[ck]
            dur = duration_of(clip)
            segments.append({
                "start": round(t, 3), "end": round(t + dur, 3),
                "language": "es" if cue.get("lang") == "es" else cue.get("lang", "tl"),
                "kind": cue.get("kind", "other"),
                "role": cue.get("role"),
                "text": cue["text"],
                "translation_es": cue.get("translation_es", "") or "",
                "note_es": "",
            })
            entries.append(clip)
            t += dur
            gap = max(float(cue.get("pause", 0) or 0), 0.6 if cue.get("kind") == "dialogue" else 0.25)
            pause = silence(gap)
            if pause:
                entries.append(pause)
                t += gap

        concat = tmp / "list.txt"
        concat.write_text("".join(f"file '{p.as_posix()}'\n" for p in entries))
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat), "-ac", "1", "-ar", "44100", "-b:a", "96k", str(out_mp3)], check=True)

    total = duration_of(out_mp3)
    print(f"{out_mp3.name}: {total/60:.1f} min, {len(segments)} segmentos")
    if args.out:
        return

    # transcripciones (mismo formato que produce el pipeline de Whisper)
    tdir = cdir / "transcripts"
    text = "\n".join(s["text"] for s in segments)
    save_json(tdir / "raw" / f"{track_id}.json", {
        "id": track_id, "lesson": args.lesson, "kind": kind, "title": f"Lección {num}{args.title_suffix}",
        "model": "worldspeak-script", "segments": [{"start": s["start"], "end": s["end"], "text": s["text"]} for s in segments], "text": text, "partial": False,
    })
    # en el player, los segmentos del narrador (es) se pintan como "explicación"; los nativos como tl
    enriched_segments = []
    for s in segments:
        lang = "en" if s["language"] == "es" else "tl"   # el player usa 'en' para la voz del narrador y 'tl' para el idioma objetivo
        enriched_segments.append({**{k: s[k] for k in ("start", "end", "kind", "text", "translation_es", "note_es")}, "language": lang})
    save_json(tdir / "enriched" / f"{track_id}.json", {
        "id": track_id, "title": f"Lección {num}{args.title_suffix}",
        "summary_es": script.get("summary_es", ""), "topics": script.get("topics", []),
        "dialogue": script.get("dialogue", {"tl": [], "es": []}),
        "segments": enriched_segments,
        "_meta": {"source": "worldspeak-script", "model": script.get("_meta", {}).get("model")},
    })

    # course.json: añadir/actualizar la pista
    course = load_json(cdir / "course.json", {})
    tracks = [tr for tr in course.get("tracks", []) if tr.get("id") != track_id]
    tracks.append({"id": track_id, "lesson": args.lesson, "kind": kind, "title": f"Lección {num}{args.title_suffix}", "file": out_mp3.name,
                   "copy": {"title": script.get("title", f"Lección {num}") + args.title_suffix, "subtitle": script.get("subtitle", "")}})
    tracks.sort(key=lambda tr: (tr.get("kind") != "main", tr.get("lesson", 0)))
    course["tracks"] = tracks
    save_json(cdir / "course.json", course)

    # index.json
    index = load_json(tdir / "index.json", {"tracks": []})
    rows = [r for r in index["tracks"] if r.get("id") != track_id]
    rows.append({"id": track_id, "lesson": args.lesson, "readingNumber": None, "kind": kind, "title": f"Lección {num}{args.title_suffix}", "subtitle": None,
                 "raw": f"transcripts/raw/{track_id}.json", "enriched": f"transcripts/enriched/{track_id}.json",
                 "chars": len(text), "timed": True, "summary": script.get("summary_es", ""), "topics": script.get("topics", [])[:8],
                 "dialogueCount": len(script.get("dialogue", {}).get("tl", []))})
    rows.sort(key=lambda r: (r["kind"] != "main", r["lesson"]))
    save_json(tdir / "index.json", {"tracks": rows})
    print("course.json e index.json actualizados")


if __name__ == "__main__":
    main()
