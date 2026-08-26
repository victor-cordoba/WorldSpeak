#!/bin/bash
# Espera a que terminen la cadena de audio (Tagalog → Bisaya → Fish) y la redacción de textos, y produce el Italiano.
cd "$(dirname "$0")/.."
while pgrep -f "produce-levels|produce-backup-fish|author-texts" >/dev/null; do sleep 60; done
echo "=========== ITALIANO $(date +%H:%M) ==========="
scripts/produce-levels.sh italiano 1 30 voices-italiano.json
python3 - <<'PY'
import json
d=json.load(open('web/courses.json'))
for c in d['courses']:
    if c['id'] in ('bisaya','italiano'):
        import os
        n=len(json.load(open(f"web/{c['id']}/course.json"))['tracks'])
        if n: c['status']='live'; c['tracks']=n; c['hours']=round(n*0.23)
json.dump(d,open('web/courses.json','w'),ensure_ascii=False,indent=2)
PY
scripts/deploy.sh | tail -1
