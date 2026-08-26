#!/bin/bash
# Crea el esqueleto de un curso nuevo a partir del Tagalog.
# Uso: scripts/new-course.sh <id> "<Nombre>" <codigo-idioma> <bandera> "<subtítulo>"
#      scripts/new-course.sh frances "Francés" fr fr "Para vivir en París"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; ID="$1"; NAME="$2"; CODE="$3"; FLAG="$4"; SUB="${5:-}"
D="$ROOT/web/$ID"; [ -e "$D" ] && { echo "ya existe $D"; exit 1; }
mkdir -p "$D/content/recipes" "$D/transcripts" "$D/scripts"
for f in index.html player.html manifest.webmanifest .htaccess favicon.svg social-image.png; do cp "$ROOT/web/tagalog/$f" "$D/$f"; done
cp "$ROOT/web/tagalog/content/pills.json" "$D/content/pills.json"
python3 - "$ID" "$NAME" "$CODE" "$FLAG" "$SUB" "$D" <<'PY'
import json,sys,re
ID,NAME,CODE,FLAG,SUB,D=sys.argv[1:7]; FLAG_CODE=FLAG
for f in ['index.html','player.html','manifest.webmanifest']:
    s=open(f'{D}/{f}').read()
    s=s.replace('Tagalog para Tondo · WorldSpeak',f'{NAME} · WorldSpeak').replace('Escuchar · Tagalog · WorldSpeak',f'Escuchar · {NAME} · WorldSpeak').replace('Tagalog · WorldSpeak',f'{NAME} · WorldSpeak')
    s=s.replace('worldspeak.es/tagalog/',f'worldspeak.es/{ID}/').replace('data-course="tagalog"',f'data-course="{ID}"')
    s=s.replace('<strong id="courseTitle">Tagalog</strong><em id="courseSub">para Tondo · WorldSpeak</em>',f'<strong id="courseTitle">{NAME}</strong><em id="courseSub">{SUB} · WorldSpeak</em>')
    s=s.replace('"short_name": "Tagalog"',f'"short_name": "{NAME}"').replace("Buscar en Tagalog o español…",f"Buscar en {NAME} o español…").replace("en voz alta en Tagalog",f"en voz alta en {NAME}")
    FLAG={'ph':'🇵🇭','it':'🇮🇹','pt':'🇵🇹','gb':'🇬🇧','fr':'🇫🇷','es':'🇪🇸','de':'🇩🇪'}
    s=s.replace('<span class="top-flag" aria-hidden="true">🇵🇭</span>',f'<span class="top-flag" aria-hidden="true">{FLAG.get(FLAG_CODE,"🌍")}</span>').replace('<h3>Tagalog</h3>',f'<h3>{NAME}</h3>').replace('<span class="legend-pill legend-tl">Tagalog</span>',f'<span class="legend-pill legend-tl">{NAME}</span>').replace('<h1>¡APRENDE TAGALOG!</h1>',f'<h1>¡APRENDE {NAME.upper()}!</h1>')
    s=re.sub(r'<button class="map-link"[^\n]*\n','',s)
    s=re.sub(r'<a class="voices-link"[^\n]*\n','',s)
    open(f'{D}/{f}','w').write(s)
course={"id":ID,"version":"1","title":f"{NAME} · WorldSpeak","shortTitle":NAME,"language":{"code":CODE,"name":NAME,"flag":FLAG},"method":"pimsleur","narratorLabel":"Narrador","groupSegments":False,
 "description":f"Curso propio de {NAME}. Escucha y repite.","tagline":SUB,"context":"ESCRIBE AQUÍ el contexto: para quién es, dónde, situaciones, registro y gramática de uso. Nada heredado de otro idioma.",
 "method_config":{"closing":"¡Hasta pronto!","first_time_notes":[]},
 "audioBase":"./audio/","transcriptsBase":"./transcripts/","api":"../api/","kinds":{"main":{"label":"Lecciones","badge":"Lección"}},"tracks":[]}
json.dump(course,open(f'{D}/course.json','w'),ensure_ascii=False,indent=2)
json.dump({"items":[]},open(f'{D}/content/items.json','w')); json.dump({"scenes":{}},open(f'{D}/content/scenes.json','w')); json.dump({"tables":[]},open(f'{D}/content/tables.json','w'))
json.dump({"levels":[],"lessons":[]},open(f'{D}/content/curriculum.json','w'))
json.dump({"tracks":[]},open(f'{D}/transcripts/index.json','w')); json.dump({"entryCount":0,"entries":[]},open(f'{D}/transcripts/dictionary.json','w'))
print(f"curso {ID} creado en web/{ID}/. Siguiente: context en course.json, curriculum.json (30 lecciones), tables.json, casting de voces, voices-{ID}.json, y scripts/produce-levels.sh {ID} 1 1 voices-{ID}.json para oír la L01.")
PY
