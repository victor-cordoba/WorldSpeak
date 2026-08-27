#!/bin/bash
# Espera a que ElevenLabs tenga crédito suficiente (renovación o usage-based) y regenera los narradores de bisaya e italiano.
cd "$(dirname "$0")/.."; K=$(cat ~/.config/victor/elevenlabs_api_key)
need=45000
while true; do
  read used limit < <(curl -s -H "xi-api-key: $K" https://api.elevenlabs.io/v1/user/subscription | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['character_count'], d['character_limit'] if not d.get('can_extend_character_limit') else 10**9)")
  left=$((limit-used)); echo "$(date +%F' '%H:%M) crédito disponible: $left"
  [ "$left" -ge "$need" ] && break
  sleep 1800
done
while pgrep -f "regen-narrator.sh tagalog" >/dev/null; do sleep 60; done
scripts/regen-narrator.sh tagalog voices.json
scripts/regen-narrator.sh bisaya voices-bisaya.json
scripts/regen-narrator.sh italiano voices-italiano.json
echo "narradores de bisaya e italiano regenerados $(date +%F' '%H:%M)"
