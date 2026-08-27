#!/bin/bash
# Regenera SOLO los clips que hayan cambiado (p. ej. narrador) y remonta todas las lecciones de un curso. Sube al final.
set -u; export PATH=/opt/homebrew/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; COURSE="$1"; export WS_VOICES="${2:-voices.json}"; cd "$ROOT/pipeline/voice"
for n in $(seq 1 30); do [ -f "$ROOT/web/$COURSE/scripts/lesson-$(printf %02d $n).json" ] || continue; echo "--- $COURSE L$n $(date +%H:%M)"; python3 compile_lesson.py --course "$COURSE" --lesson "$n" --minutes 15 >/dev/null; python3 synth.py --course "$COURSE" --lesson "$n" | tail -1; python3 assemble.py --course "$COURSE" --lesson "$n" | head -1; done
python3 export_clips.py --course "$COURSE" | tail -1
cd "$ROOT" && scripts/bump-version.sh "$COURSE" && scripts/deploy.sh | tail -1
rsync -az "web/$COURSE/audio/" --exclude '_prueba*' PERSONAL_SERVER:~/domains/worldspeak.es/public_html/$COURSE/audio/
rsync -az "web/$COURSE/clips/" PERSONAL_SERVER:~/domains/worldspeak.es/public_html/$COURSE/clips/
echo "--- $COURSE remontado y subido $(date +%H:%M)"
