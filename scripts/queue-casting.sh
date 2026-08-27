#!/bin/bash
# Tras la cola del narrador, regenera las voces nativas elegidas por Víctor (27/08) en italiano, portugués, inglés y francés.
cd "$(dirname "$0")/.."
while pgrep -f "queue-narrador-natgeo|regen-narrator" >/dev/null; do sleep 60; done
for c in italiano portugues ingles frances; do echo "=========== $c $(date +%H:%M) ==========="; scripts/regen-narrator.sh $c voices-$c.json; done
echo "=========== FIN $(date +%F' '%H:%M) ==========="
