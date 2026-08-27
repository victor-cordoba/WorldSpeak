#!/bin/bash
# Narrador: ElevenLabs (Pablo Marshal v3) si hay crédito, si no Nat Geo (Fish). Luego voces nativas del casting.
cd "$(dirname "$0")/.."
for c in tagalog:voices.json bisaya:voices-bisaya.json italiano:voices-italiano.json portugues:voices-portugues.json ingles:voices-ingles.json frances:voices-frances.json; do
  echo "=========== ${c%%:*} $(date +%H:%M) ==========="; scripts/regen-narrator.sh ${c%%:*} ${c##*:}
done; echo "=========== FIN $(date +%F' '%H:%M) ==========="
