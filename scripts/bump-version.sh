#!/bin/bash
# Sube la versión de un curso: course.json + ?v= y data-v de sus HTML (reproductor, ruta, audio, clips, transcripciones).
cd "$(dirname "$0")/.."; C="$1"; V=$(date +%Y%m%d-%H%M)
python3 - "$C" "$V" <<'PY'
import json,sys
p=f'web/{sys.argv[1]}/course.json'; d=json.load(open(p)); d['version']=sys.argv[2]; json.dump(d,open(p,'w'),ensure_ascii=False,indent=2); print('version',sys.argv[1],sys.argv[2])
PY
sed -i '' -E "s/(\?v=)[0-9]{8}-[0-9]+/\1$V/g; s/(data-v=\")[0-9]{8}-[0-9]+/\1$V/g" web/$C/index.html web/$C/player.html 2>/dev/null
