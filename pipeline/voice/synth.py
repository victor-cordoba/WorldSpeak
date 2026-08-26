#!/usr/bin/env python3
"""Genera con ElevenLabs un clip por cue del guion. Cachea por contenido.

Cada clip se guarda en web/<curso>/_clips/<hash>.mp3 y se reutiliza si el texto,
la voz y los ajustes no cambian. Relanzar no vuelve a gastar caracteres.

Uso: synth.py --course tagalog --lesson 1 [--dry-run]
"""
import argparse
import json
import time
import urllib.request

from common import HERE, course_dir, digest, load_json, read_key, save_json


def tts(api_key, voice_cfg, model_id, output_format, text, out_path):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_cfg['voice_id']}?output_format={output_format}"
    body = {"text": text, "model_id": model_id, "voice_settings": voice_cfg["voice_settings"]}
    if voice_cfg.get("language_code"):
        body["language_code"] = voice_cfg["language_code"]
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"xi-api-key": api_key, "Content-Type": "application/json"}, method="POST")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                out_path.write_bytes(response.read())
            return
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:300]
            if error.code in (429, 500, 502, 503) and attempt < 2:
                time.sleep(3 * (attempt + 1))
                continue
            raise RuntimeError(f"ElevenLabs HTTP {error.code}: {detail}") from error


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--lesson", type=int, required=True)
    parser.add_argument("--dry-run", action="store_true", help="solo cuenta caracteres, no llama a la API")
    args = parser.parse_args()

    voices = load_json(HERE / "voices.json")
    cdir = course_dir(args.course)
    script = load_json(cdir / "scripts" / f"lesson-{args.lesson:02d}.json")
    if not script:
        raise SystemExit("Primero write_script.py")
    clips_dir = cdir / "_clips"
    clips_dir.mkdir(exist_ok=True)

    api_key = None if args.dry_run else read_key("elevenlabs")
    todo_chars = 0
    cached = 0
    for cue in script["cues"]:
        role = cue.get("role", "narrator")
        voice = voices["roles"].get(role) or voices["roles"]["narrator"]
        key = digest(voice["voice_id"], voices["model_id"], json.dumps(voice["voice_settings"], sort_keys=True), cue["text"])
        cue["clip"] = f"_clips/{key}.mp3"
        path = clips_dir / f"{key}.mp3"
        if path.exists() and path.stat().st_size > 1000:
            cached += 1
            continue
        todo_chars += len(cue["text"])
        if args.dry_run:
            continue
        print(f"  tts [{role}] {cue['text'][:60]}", flush=True)
        tts(api_key, voice, voices["model_id"], voices["output_format"], cue["text"], path)
        time.sleep(0.3)

    save_json(cdir / "scripts" / f"lesson-{args.lesson:02d}.json", script)
    print(f"{'PENDIENTES' if args.dry_run else 'generados'}: {todo_chars} caracteres nuevos, {cached} clips ya en caché")


if __name__ == "__main__":
    main()
