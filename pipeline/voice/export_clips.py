#!/usr/bin/env python3
"""Publica los clips de voz nativos para la app (Frases y Diálogos).

Recorre los guiones compilados, coge cada cue nativo con clip, lo copia a
web/<curso>/clips/<hash>.mp3 y escribe content/audio-map.json: { "texto normalizado": "clips/<hash>.mp3" }.
Uso: export_clips.py --course tagalog
"""
import argparse
import json
import re
import shutil

from common import course_dir, load_json, save_json


def norm(t):
    return re.sub(r"\s+", " ", re.sub(r"[¿¡!?.,…]+", "", t.lower())).strip()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--course", required=True); a = ap.parse_args()
    cdir = course_dir(a.course); out = cdir / "clips"; out.mkdir(exist_ok=True)
    amap = {}
    for script in sorted((cdir / "scripts").glob("lesson-*.json")):
        for cue in load_json(script).get("cues", []):
            if cue.get("role") == "narrator" or not cue.get("clip"):
                continue
            src = cdir / cue["clip"]
            if not src.exists():
                continue
            dst = out / src.name
            if not dst.exists():
                shutil.copy2(src, dst)
            amap.setdefault(norm(cue["text"]), f"clips/{src.name}")
    save_json(cdir / "content" / "audio-map.json", amap)
    print(f"{len(amap)} textos con audio · {len(list(out.glob('*.mp3')))} clips en web/{a.course}/clips/")


if __name__ == "__main__":
    main()
