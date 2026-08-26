#!/bin/bash
# Despliega web/ a victorcordoba.com/worldspeak por rsync.
# Uso: scripts/deploy.sh            (sube código + datos de transcripciones)
#      scripts/deploy.sh --audio    (además sube el audio de los cursos, lento)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="PERSONAL_SERVER"
DEST="~/domains/worldspeak.es/public_html/"

EXCLUDES=(--exclude '.DS_Store' --exclude '__pycache__/' --exclude '*.md' --exclude 'config.php' --exclude '.private/'
          --exclude 'transcripts/chunks/' --exclude 'transcripts/enriched_batches/' --exclude '*/audio' --exclude '*/audio/' --exclude '_clips/')

echo "→ código y datos"
rsync -az --delete "${EXCLUDES[@]}" "$ROOT/web/" "$HOST:$DEST"

if [[ "${1:-}" == "--audio" ]]; then
  for course in "$ROOT"/web/*/; do
    [[ -e "$course/audio" ]] || continue
    name="$(basename "$course")"
    echo "→ audio de $name"
    rsync -azL --progress "$course/audio/" "$HOST:${DEST}${name}/audio/"
  done
fi
echo "OK https://worldspeak.es/"
