#!/bin/bash
# Prueba Fish Audio con la misma frase de Tagalog que ElevenLabs. Requiere crédito de API.
set -e
FK=$(cat ~/.config/victor/fishaudio_api_key)
VOICE="${1:-92c6c4e5e8fa499e801b99eb7cd5c5b9}"   # Calm Filipino Voice
OUT=~/Desktop/test-fish-tagalog.mp3
curl -s -o "$OUT" -w "HTTP %{http_code}\n" -X POST https://api.fish.audio/v1/tts \
  -H "Authorization: Bearer $FK" -H "Content-Type: application/json" -H "model: s1" \
  -d "{\"text\":\"Magandang tanghali. Nakakaintindi ka ba ng Ingles? Hindi, hindi ako nakakaintindi. Nakakaintindi ako ng konting Tagalog.\",\"reference_id\":\"$VOICE\",\"format\":\"mp3\"}"
echo "guardado en $OUT (compara con test-tagalog.mp3 de ElevenLabs)"
