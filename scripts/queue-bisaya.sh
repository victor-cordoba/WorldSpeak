#!/bin/bash
cd "$(dirname "$0")/.."
while pgrep -f "produce-levels.sh tagalog|produce-backup-fish" >/dev/null; do sleep 60; done
echo "=========== BISAYA $(date +%H:%M) ==========="
scripts/produce-levels.sh bisaya 1 30 voices-bisaya.json
