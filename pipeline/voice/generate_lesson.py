#!/usr/bin/env python3
"""Orquesta una lección completa: guion -> voces -> montaje -> transcripción -> diccionario.

Uso: generate_lesson.py --course tagalog --lesson 1 --minutes 6 --theme "..."
     generate_lesson.py --course tagalog --lesson 1 --dry-run   (cuenta caracteres sin gastar)
"""
import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def run(script, *args):
    subprocess.run([sys.executable, str(HERE / script), *args], check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--lesson", type=int, required=True)
    parser.add_argument("--minutes", type=int, default=15)
    parser.add_argument("--theme", default="")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force-script", action="store_true")
    args = parser.parse_args()
    base = ["--course", args.course, "--lesson", str(args.lesson)]
    recipe = HERE.parents[1] / "web" / args.course / "content" / "recipes" / f"lesson-{args.lesson:02d}.json"
    if recipe.exists():
        run("compile_lesson.py", *base, "--minutes", str(args.minutes))   # determinista, por plantillas
    else:
        run("write_script.py", *base, "--minutes", str(args.minutes), "--theme", args.theme, *(["--force"] if args.force_script else []))
    run("synth.py", *base, *(["--dry-run"] if args.dry_run else []))
    if args.dry_run:
        return
    run("assemble.py", *base)
    run(str(HERE.parent / "build_dictionary.py"), "--course", args.course)


if __name__ == "__main__":
    main()
