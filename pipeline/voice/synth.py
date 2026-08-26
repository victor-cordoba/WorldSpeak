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


def tts_fish(api_key, voice_cfg, text, out_path):
    """Fish Audio (S1/S2 Pro): reference_id = voz de su biblioteca o clon propio."""
    url = "https://api.fish.audio/v1/tts"
    body = {"text": text, "reference_id": voice_cfg["voice_id"], "format": "mp3", "mp3_bitrate": 128}
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "model": voice_cfg.get("model", "s1")}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            out_path.write_bytes(response.read())
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Fish Audio HTTP {error.code}: {error.read().decode('utf-8', 'replace')[:300]}") from error


EXHAUSTED = set()


def apply_tempo(path, tempo, clean=True):
    """Post-proceso: velocidad (atempo), limpieza (paso alto, reducción de ruido y eco, recorte de silencios) y normalización."""
    import subprocess, os
    filters = []
    if tempo and abs(float(tempo) - 1.0) >= 0.01:
        filters.append(f"atempo={float(tempo):.3f}")
    if clean:
        filters += ["highpass=f=90", "afftdn=nf=-28:nt=w", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08:stop_periods=1:stop_threshold=-45dB:stop_silence=0.15", "loudnorm=I=-16:TP=-1.5:LRA=9"]
    if not filters:
        return
    tmp = path.with_suffix(".tmp.mp3")
    subprocess.run([os.environ.get("FFMPEG", "/opt/homebrew/bin/ffmpeg"), "-y", "-loglevel", "error", "-i", str(path), "-af", ",".join(filters), "-ar", "44100", "-b:a", "128k", str(tmp)], check=True)
    tmp.replace(path)


def enhance_text(voice_cfg, cue):
    """Audio tags de eleven_v3 para que entone: idioma, tono según el tipo de cue."""
    if voice_cfg.get("provider") == "fish" or not voice_cfg.get("tags"):
        return cue["text"]
    kind = cue.get("kind", "")
    tone = {"prompt": "[curious]", "explanation": "[warm]", "instruction": "[cheerful]", "dialogue": "", "phrase": ""}.get(kind, "")
    tags = voice_cfg["tags"].get(kind) or voice_cfg["tags"].get("*") or ""
    prefix = " ".join(t for t in (tags, tone) if t)
    return f"{prefix} {cue['text']}".strip()


def tts(api_key, voice_cfg, model_id, output_format, text, out_path):
    if voice_cfg.get("provider") == "fish":
        tts_fish(api_key, voice_cfg, text, out_path)
        apply_tempo(out_path, voice_cfg.get("tempo"))
        return
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
    apply_tempo(out_path, voice_cfg.get("tempo"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--lesson", type=int, required=True)
    parser.add_argument("--dry-run", action="store_true", help="solo cuenta caracteres, no llama a la API")
    parser.add_argument("--voices", default=None, help="perfil de voces alternativo (p. ej. voices-fish.json)")
    parser.add_argument("--clip-key", default="clip", help="clave donde guardar la ruta del clip en cada cue")
    args = parser.parse_args()

    import os
    voices = load_json(HERE / (args.voices or os.environ.get("WS_VOICES") or "voices.json"))
    cdir = course_dir(args.course)
    script = load_json(cdir / "scripts" / f"lesson-{args.lesson:02d}.json")
    if not script:
        raise SystemExit("Primero write_script.py")
    clips_dir = cdir / "_clips"
    clips_dir.mkdir(exist_ok=True)

    keys = {} if args.dry_run else {"elevenlabs": read_key("elevenlabs"), "fish": read_key("fishaudio")}
    todo_chars = 0
    cached = 0
    ordered = sorted(script["cues"], key=lambda c: 0 if c.get("role", "narrator") != "narrator" else 1)  # nativos primero: ElevenLabs hasta agotar
    for cue in ordered:
        role = cue.get("role", "narrator")
        voice = voices["roles"].get(role) or voices["roles"]["narrator"]
        if voice.get("provider", "elevenlabs") == "elevenlabs" and "elevenlabs" in EXHAUSTED and voice.get("fallback"):
            voice = voice["fallback"]
        model = voice.get("model", voices["model_id"]) if voice.get("provider") == "fish" else voices["model_id"]
        spoken = enhance_text(voice, cue)
        key = digest(voice.get("provider", "elevenlabs"), voice["voice_id"], model, json.dumps(voice.get("voice_settings", {}), sort_keys=True), spoken, voice.get("tempo", 1), "clean2")
        cue[args.clip_key] = f"_clips/{key}.mp3"
        path = clips_dir / f"{key}.mp3"
        if path.exists() and path.stat().st_size > 1000:
            cached += 1
            continue
        todo_chars += len(cue["text"])
        if args.dry_run:
            continue
        print(f"  tts [{role}/{voice.get('provider','elevenlabs')}] {cue['text'][:60]}", flush=True)
        try:
            tts(keys["fish" if voice.get("provider") == "fish" else "elevenlabs"], voice, voices["model_id"], voices["output_format"], spoken, path)
        except RuntimeError as error:
            msg = str(error)
            if "ElevenLabs HTTP 40" in msg or "ElevenLabs HTTP 429" in msg or "quota" in msg.lower():
                print("  ElevenLabs agotado: paso a Fish para este rol", flush=True)
                EXHAUSTED.add("elevenlabs")
                if not voice.get("fallback"):
                    raise
                voice = voice["fallback"]
                key = digest(voice.get("provider"), voice["voice_id"], voice.get("model", ""), json.dumps(voice.get("voice_settings", {}), sort_keys=True), cue["text"])
                cue[args.clip_key] = f"_clips/{key}.mp3"; path = clips_dir / f"{key}.mp3"
                if not path.exists():
                    tts(keys["fish"], voice, voices["model_id"], voices["output_format"], cue["text"], path)
            else:
                raise
        time.sleep(0.3)

    save_json(cdir / "scripts" / f"lesson-{args.lesson:02d}.json", script)
    print(f"{'PENDIENTES' if args.dry_run else 'generados'}: {todo_chars} caracteres nuevos, {cached} clips ya en caché")


if __name__ == "__main__":
    main()
