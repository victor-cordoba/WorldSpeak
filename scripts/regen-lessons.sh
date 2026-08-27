#!/bin/bash
# Regenera y sube lecciones sueltas: scripts/regen-lessons.sh tagalog voices.json 12 18
set -u; export PATH=/opt/homebrew/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; COURSE="$1"; export WS_VOICES="$2"; shift 2; cd "$ROOT/pipeline/voice"
for n in "$@"; do echo "--- $COURSE L$n $(date +%H:%M)"; python3 compile_lesson.py --course "$COURSE" --lesson "$n" --minutes 15 >/dev/null; python3 synth.py --course "$COURSE" --lesson "$n" | tail -1; python3 assemble.py --course "$COURSE" --lesson "$n" | head -1; done
python3 export_clips.py --course "$COURSE" | tail -1
cd "$ROOT" && scripts/bump-version.sh "$COURSE" && scripts/deploy.sh | tail -1
rsync -az "web/$COURSE/audio/" --exclude '_prueba*' PERSONAL_SERVER:~/domains/worldspeak.es/public_html/$COURSE/audio/
echo "--- $COURSE $* subidas $(date +%H:%M)"
