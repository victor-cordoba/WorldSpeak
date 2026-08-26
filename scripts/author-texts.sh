#!/bin/bash
# Redacta (GPT) + lint + compila TODAS las lecciones de un curso, SIN sintetizar audio.
# Uso: scripts/author-texts.sh portugues
set -u; export PATH=/opt/homebrew/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; COURSE="$1"; cd "$ROOT/pipeline/voice"
for n in $(seq 1 30); do
  echo "--- $COURSE L$n $(date +%H:%M)"
  python3 author_lesson.py --course "$COURSE" --lesson "$n" || python3 author_lesson.py --course "$COURSE" --lesson "$n" --force || continue
  python3 lint_content.py --course "$COURSE" --fix | tail -1
  python3 compile_lesson.py --course "$COURSE" --lesson "$n" --minutes 15
done
python3 lint_content.py --course "$COURSE"
echo "--- $COURSE textos completos $(date +%H:%M)"
