# 11 · Proveedores de voz: ElevenLabs y alternativas (agosto 2026)

Investigado el 26/08/2026 para decidir con qué grabar los cursos propios.

## RESUMEN

| Proveedor | Precio API / 1M caracteres | Clonado de voz | Tagalog | Cebuano | Veredicto |
|---|---|---|---|---|---|
| **ElevenLabs** `eleven_v3` | 60–180 $ (según plan) | 30 s (instantáneo) / profesional | Sí, con 30 voces nativas en biblioteca | Solo v3, sin voces etiquetadas | La mejor calidad verificada en Tagalog. Cara. |
| **Fish Audio** S2 Pro / S2.1 Pro | **15 $** por millón de bytes UTF-8 (pago por uso, sin suscripción) | **5 s** de audio (zero-shot) | Sí (`tl` en la lista de 80+ idiomas) | No aparece en la lista | **La alternativa a probar.** 4 a 12 veces más barata. |
| Cartesia Sonic 3 | 20–33 $ | 3 s | No confirmado (42 idiomas) | No | Muy rápida (agentes en tiempo real), no es nuestro caso. |
| Inworld TTS-2 | 25 $ (10 $ en Growth) | 5–15 s | No confirmado (25+ idiomas) | No | Descartada por idiomas. |
| Chatterbox (Resemble, MIT) | 0 $ (autoalojado) | 5 s | Solo inglés | No | Descartada. |
| Qwen3-TTS (abierto) | 0 $ (autoalojado) | 3 s | 10 idiomas, sin Tagalog | No | Descartada. |

Lo que leíste ("clona con 5 segundos y es mucho más barato") encaja con
**Fish Audio**: recaudó 52 M$ en julio de 2026, lanzó S2.1 Pro y cobra 15 $
por millón. ElevenLabs subió precios ~239 % interanual.

## QUÉ SIGNIFICA PARA WORLDSPEAK

Un curso de 30 lecciones de 15 min ≈ **115.000 caracteres** de narrador
español + nativos (con la caché de clips, bastante menos). Coste estimado:

| | ElevenLabs (Creator, ~100k/mes incluidos) | Fish Audio (pago por uso) |
|---|---|---|
| 1 curso (Tagalog) | 22 $/mes durante 2 meses | **~2 $** |
| Tagalog + Bisaya | 44 $ | ~4 $ |

## ACTUALIZACIÓN 26/08 (tarde): FISH ES GRATIS POR API HASTA EL 31/08/2026

Con el modelo `s2.1-pro-free` (cabecera `model: s2.1-pro-free`) la API de Fish
no consume saldo: uso ilimitado bajo política de uso justo, sin tarjeta.
Probado con Tagalog (dos voces) y Cebuano: HTTP 200, clips en el Escritorio.
Ojo: **el saldo de API es independiente de la suscripción web**; la
suscripción no sirve para la API. Perfil listo en `pipeline/voice/voices-fish.json`.

Generar la L01 con ambos proveedores para comparar:
```bash
python3 synth.py --course tagalog --lesson 1 --voices voices-fish.json --clip-key clip_fish
python3 assemble.py --course tagalog --lesson 1 --clip-key clip_fish --out ~/Desktop/L01-fish.mp3
```

## PLAN

1. **Probar Fish Audio con Tagalog real**: misma frase que en ElevenLabs
   (`Magandang tanghali. Nakakaintindi ka ba ng Ingles?`) con una voz filipina
   de su biblioteca. Si suena natural, adelante. Hace falta una API key
   (`~/.config/victor/fishaudio_api_key`).
2. `synth.py` ya está preparado para tener **varios backends**: el rol
   (`narrator`, `native_m`, `kid_f`…) decide la voz; el backend decide la API.
   Se añade `provider: "fish"` en `voices.json` por rol.
3. Regla de oro que no cambia: **no clonar voces de personas reales sin
   consentimiento.** Con 5 segundos es aún más tentador; también más ilegal.
   Fish Audio permite clonar con permiso a alguien de la misión en Cebú: esa
   es la vía buena para el acento cebuano auténtico.
4. Si Fish no convence en Tagalog: ElevenLabs Creator (22 $/mes) para el
   Nivel 1 y reevaluar.

Fuentes: [TextToLab, comparativa TTS 2026](https://texttolab.com/blog/best-text-to-speech-api),
[TextToLab, precios Fish Audio](https://texttolab.com/blog/fish-audio-pricing),
[Fish Audio S2](https://fish.audio/s2/), [fishaudio/s2-pro en Hugging Face](https://huggingface.co/fishaudio/s2-pro),
[Fish Audio 52M seed + S2.1 Pro](https://explainx.ai/blog/fish-audio-52m-seed-s2-1-pro-july-2026),
[Inworld, voice cloning APIs](https://inworld.ai/resources/best-voice-cloning-api),
[Smallest.ai, alternativas](https://smallest.ai/blog/top-eleven-lab-alternatives).
