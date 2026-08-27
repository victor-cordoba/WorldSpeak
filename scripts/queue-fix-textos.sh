#!/bin/bash
cd "$(dirname "$0")/.."
for c in frances:voices-frances.json italiano:voices-italiano.json bisaya:voices-bisaya.json portugues:voices-portugues.json ingles:voices-ingles.json tagalog:voices.json; do
  echo "=========== ${c%%:*} $(date +%H:%M) ==========="; scripts/regen-narrator.sh ${c%%:*} ${c##*:}
done; echo "=========== FIN $(date +%F' '%H:%M) ==========="
