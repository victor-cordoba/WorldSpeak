#!/bin/bash
# Espera al narrador del Tagalog y produce Portugués, Inglés y Francés (L01-L30) con Fish; luego regenera la voz femenina del Italiano.
cd "$(dirname "$0")/.."
while pgrep -f "regen-narrator.sh tagalog|produce-levels" >/dev/null; do sleep 60; done
for c in portugues ingles frances; do echo "=========== $c $(date +%H:%M) ==========="; scripts/produce-levels.sh $c 1 30 voices-$c.json; done
python3 - <<'PY'
import json
d=json.load(open('web/courses.json'))
for c in d['courses']:
    if c['id'] in ('portugues','ingles','frances'):
        n=len(json.load(open(f"web/{c['id']}/course.json"))['tracks'])
        if n: c['status']='live'; c['tracks']=n; c['hours']=round(n*0.23)
json.dump(d,open('web/courses.json','w'),ensure_ascii=False,indent=2)
PY
scripts/deploy.sh | tail -1
echo "=========== italiano voz femenina $(date +%H:%M) ==========="
scripts/regen-narrator.sh italiano voices-italiano.json
echo "=========== FIN $(date +%F' '%H:%M) ==========="
