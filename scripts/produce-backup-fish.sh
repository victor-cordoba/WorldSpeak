#!/bin/bash
# Respaldo: todas las lecciones con voces Fish (gratis) en ../PRUEBAS-VOZ/fish/. No toca el curso publicado.
set -u; export PATH=/opt/homebrew/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; COURSE="$1"; OUT="$ROOT/../PRUEBAS-VOZ/fish"; mkdir -p "$OUT"
cd "$ROOT/pipeline/voice"
for s in "$ROOT/web/$COURSE/scripts"/lesson-*.json; do
  n=$(basename "$s" .json | sed 's/lesson-0*//')
  echo "--- respaldo Fish L$n $(date +%H:%M)"
  python3 synth.py --course "$COURSE" --lesson "$n" --voices voices-fish.json --clip-key clip_fish 2>&1 | tail -1
  python3 assemble.py --course "$COURSE" --lesson "$n" --clip-key clip_fish --out "$OUT/Lesson $(printf %02d $n) Main (fish).mp3" | head -1
done
echo "--- respaldo Fish completo $(date +%H:%M)"
