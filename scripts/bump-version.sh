#!/bin/bash
# Sube la versión de un curso (course.json) para que el reproductor y la CDN cojan audio/texto nuevos.
cd "$(dirname "$0")/.."; V=$(date +%Y%m%d-%H%M)
python3 - "$1" "$V" <<'PY'
import json,sys
p=f'web/{sys.argv[1]}/course.json'; d=json.load(open(p)); d['version']=sys.argv[2]; json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); print('version',sys.argv[1],sys.argv[2])
PY
