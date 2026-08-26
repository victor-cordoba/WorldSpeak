# 09 · Pipeline de voz: lecciones Pimsleur con ElevenLabs

Cómo se crea un curso **desde cero**, sin audio previo. Cuatro scripts en
`pipeline/voice/`, orquestados por `generate_lesson.py`.

```
tema + contexto del curso + vocabulario de lecciones anteriores
   │  write_script.py   (GPT-4o)
   ▼
scripts/lesson-NN.json         guion: lista de cues {role, lang, text, kind, pause, translation_es}
   │  synth.py           (ElevenLabs eleven_v3, un clip por cue, caché por hash)
   ▼
_clips/<hash>.mp3
   │  assemble.py        (ffmpeg concat + silencios)
   ▼
audio/Lesson NN Main.mp3  +  transcripts/raw + enriched + index.json  +  course.json
   │  build_dictionary.py
   ▼
transcripts/dictionary.json
```

## POR QUÉ ESTO ES MEJOR QUE TRANSCRIBIR

En el curso Pimsleur el audio venía dado y hubo que transcribirlo con Whisper,
enriquecerlo con GPT y defenderse de los desalineados (doc 02). Aquí **el guion
es nuestro**: sabemos exactamente qué dice cada clip y, tras montarlo, en qué
segundo empieza y acaba. `assemble.py` escribe las transcripciones directamente
con esos tiempos. Sincronización perfecta, cero llamadas a Whisper, cero
enriquecido.

## EL GUION (`write_script.py`)

El prompt obliga al modelo a seguir el método Pimsleur de verdad, no a
"inspirarse":

- **Anticipación**: el narrador pide producir ("¿Cómo se dice...?"), pausa, y
  DESPUÉS el nativo responde. Nunca al revés.
- **Construcción hacia atrás**: cada frase nueva se presenta desde la última
  sílaba (`po`, `hali po`, `tanghali po`, `dang tanghali po`, `Magandang
  tanghali po`), con pausa tras cada trozo.
- **Repaso espaciado** dentro de la lección y con el vocabulario de las
  anteriores (se le pasan los `vocabulary` de los guiones previos).
- **Esqueleto obligatorio** en seis fases (diálogo → explicación → por cada
  palabra: significado, frase, sílabas, repeticiones, anticipación → mini
  conversación guiada → repaso final → diálogo otra vez).
- **Mínimo de cues** (14 por minuto): la primera versión del prompt sin este
  mínimo devolvía guiones de 28 cues para 5 minutos, inútiles.

Cada cue lleva `pause` (segundos de silencio después), `kind` y, si es nativo,
`translation_es`. El narrador habla español de España; los nativos SOLO el
idioma objetivo.

## LAS VOCES (`voices.json`)

| Rol | Voz | Notas |
|---|---|---|
| `narrator` | Gabriel Blanco (`4R9s73RrCF4wi6GqmzrT`) | Español peninsular, `language_code: es` |
| `native_m` | Juanito (`u1CVBnSUn9JiL8ssgd2v`) | Filipino, `language_code: fil` |
| `native_f` | Cielle (`6LXO12QQcaZd6xGp9UIZ`) | Filipina |

Todas son de la **Voice Library** de ElevenLabs, cedidas por sus dueños, y se
añadieron a la cuenta con `POST /v1/voices/add/{owner}/{voice_id}`. Modelo
`eleven_v3`, ajustes en el JSON (aprendidos del proyecto Jarvis: estabilidad
media, similarity alta, style bajo para narración).

**No se clonan voces de personas reales sin consentimiento.** Alternativas si
se quiere una voz distinta: más voces de la biblioteca (30 filipinas), Voice
Design (crear una voz desde una descripción) o clonar con permiso a alguien
conocido de Cebú.

### Idiomas verificados (26/08/2026)

- **Tagalog/Filipino**: `eleven_v3`, `eleven_multilingual_v2`, `flash/turbo v2.5`. Bien.
- **Cebuano/Bisaya**: **solo `eleven_v3`**. No hay voces etiquetadas `ceb`, pero
  las voces filipinas lo pronuncian correctamente en la prueba. Para el curso de
  Bisaya: no pasar `language_code` (no existe para ceb) y dejar que v3 detecte.

## LA SÍNTESIS (`synth.py`)

Un clip por cue. La clave de caché es `sha1(voice_id, modelo, ajustes, texto)`:
un texto repetido (y en Pimsleur se repite muchísimo) se genera **una sola
vez**. En la lección 1 de prueba, 27 de 65 cues salieron de caché. Relanzar el
script nunca gasta caracteres ya pagados.

`--dry-run` cuenta los caracteres pendientes sin llamar a la API. **Úsalo
siempre antes**: el plan actual tiene 10.000 caracteres/mes y una lección de 25
minutos son ~9.000.

## EL MONTAJE (`assemble.py`)

1. Genera silencios con `anullsrc` de la duración de cada `pause` (mínimo 0,6 s
   entre líneas de diálogo, 0,25 s entre el resto).
2. Concatena con el demuxer `concat` de ffmpeg: mono, 44,1 kHz, 96 kbps.
3. Mientras concatena, lleva la cuenta del tiempo con `ffprobe` de cada clip y
   escribe los segmentos con `start`/`end` exactos.
4. Escribe `transcripts/raw`, `transcripts/enriched` (mismo formato que produce
   el pipeline de Whisper, así el player no distingue), actualiza `course.json`
   e `index.json`.

Detalle: en `enriched`, los cues del narrador se marcan `language: "en"` porque
así es como el player pinta "la voz que explica" (heredado del curso Pimsleur,
donde el narrador hablaba inglés). Los nativos van como `tl`.

## COSTE POR LECCIÓN DE 25 MINUTOS (estimado)

| Paso | Coste |
|---|---|
| Guion (GPT-4o, ~8k tokens) | céntimos |
| Voz (ElevenLabs, ~9.000 caracteres) | según plan; en pago por uso ~2 € |
| Montaje y transcripción | 0 |

30 lecciones ≈ 270.000 caracteres. El plan Creator (100k/mes) tardaría tres
meses; el Pro (500k/mes) lo hace de una tacada.

## PRIMERA LECCIÓN GENERADA

`web/tagalog/scripts/lesson-01.json`: "Saludando y presentándote", 5 min, 65
cues, 4 frases nuevas (`Magandang tanghali po`, `Ako si`, `Marunong ka bang
mag-Tagalog?`, `Kaunti lang po`). Sirve para ajustar voces, ritmo y pausas
antes de producir en serie.

## AJUSTAR TRAS ESCUCHAR

- Pausas cortas o largas → cambia los rangos en el prompt de `write_script.py`
  o edita el `pause` de los cues en el JSON y relanza solo `assemble.py`.
- Una voz no gusta → cambia el `voice_id` en `voices.json`; los clips de ese rol
  se regeneran solos (cambia el hash).
- Pronunciación mala de una palabra → escríbela fonéticamente en `text` del cue
  (truco heredado de Jarvis) y corrige el `translation_es` si hace falta.
- Ritmo del narrador → `style` y `stability` en `voices.json`.
