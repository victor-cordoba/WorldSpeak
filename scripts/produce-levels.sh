#!/bin/bash
# Produce lecciones N..M del curso: redacción (GPT) -> compilación -> voces (Fish) -> montaje -> subida.
# Uso: scripts/produce-levels.sh tagalog 9 30   (deja log en ../PRUEBAS-VOZ/produce.log)
set -u
export PATH=/opt/homebrew/bin:$PATH
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; COURSE="$1"; FROM="$2"; TO="$3"
cd "$ROOT/pipeline/voice"
for n in $(seq "$FROM" "$TO"); do
  echo "=========== L$n $(date +%H:%M) ==========="
  python3 author_lesson.py --course "$COURSE" --lesson "$n" || { echo "L$n: redacción falló, reintento"; python3 author_lesson.py --course "$COURSE" --lesson "$n" --force || continue; }
  python3 compile_lesson.py --course "$COURSE" --lesson "$n" --minutes 15 || continue
  python3 synth.py --course "$COURSE" --lesson "$n" 2>&1 | tail -1
  python3 assemble.py --course "$COURSE" --lesson "$n" | head -1
done
python3 ../build_dictionary.py --course "$COURSE"
python3 export_clips.py --course "$COURSE"
cd "$ROOT" && scripts/deploy.sh | tail -1
rsync -az "web/$COURSE/audio/" --exclude '_prueba*' PERSONAL_SERVER:~/domains/worldspeak.es/public_html/$COURSE/audio/
rsync -az "web/$COURSE/audio/" --exclude '_prueba*' PERSONAL_SERVER:~/domains/victorcordoba.com/public_html/worldspeak/$COURSE/audio/
rsync -az "web/$COURSE/clips/" PERSONAL_SERVER:~/domains/worldspeak.es/public_html/$COURSE/clips/
rsync -az "web/$COURSE/clips/" PERSONAL_SERVER:~/domains/victorcordoba.com/public_html/worldspeak/$COURSE/clips/
echo "=========== FIN $(date +%H:%M) ==========="
