# 02 · Pipeline de datos

Tres scripts de Python, en orden. Cada uno lee la salida del anterior.
Ninguno instala nada: usan solo la librería estándar (`urllib`, `json`,
`re`) y llaman a `ffmpeg` por línea de comandos.

```
audio/*.mp3
   │  1. transcribe_tagalog.py
   ▼
transcripts/raw/*.json
   │  2. enrich_transcripts.py
   ▼
transcripts/enriched/*.json
   │  3. build_dictionary.py
   ▼
transcripts/dictionary.json
```

---

## PRINCIPIO DE DISEÑO: TODO CACHEA

Procesar 50 pistas de 30 minutos cuesta dinero real en llamadas a la API y
tarda horas. Una caída a mitad no puede obligar a repetirlo todo.

Por eso **los tres scripts guardan resultados intermedios en disco a cada
paso** y al relanzarlos saltan lo que ya existe. Nada se recalcula sin pasar
`--force` explícitamente.

Los niveles de caché son cuatro, de más fino a más grueso:

| Nivel | Archivo | Qué evita repetir |
|---|---|---|
| Trozo de audio | `chunks/<pista>/chunk-NNN.mp3` | Volver a cortar con ffmpeg |
| Transcripción de trozo | `chunks/<pista>/chunk-NNN.json` | Una llamada a Whisper |
| Lote enriquecido | `enriched_batches/<pista>/batch-NNN.json` | Una llamada a GPT |
| Pista completa | `raw/*.json`, `enriched/*.json` | Todo lo de esa pista |

---

## 1 · `transcribe_tagalog.py` — audio a texto con tiempos

### El problema del límite de 25 MB

La API de transcripción de OpenAI no acepta archivos de más de 25 MB. Una
lección de 30 minutos en MP3 se pasa. Así que el script **trocea primero**.

```python
ffmpeg -i "Lesson 01 Main.mp3" \
  -vn -ac 1 -ar 16000 -b:a 48k \
  -f segment -segment_time 480 -reset_timestamps 1 \
  chunk-%03d.mp3
```

Tres decisiones ahí:

- **`-ac 1 -ar 16000 -b:a 48k`** — mono, 16 kHz, 48 kbps. Whisper trabaja
  internamente a 16 kHz, así que subir más calidad solo gasta ancho de banda
  y acerca el límite de 25 MB. Un trozo de 8 minutos baja de 22 MB a 2,8 MB.
- **`-segment_time 480`** — trozos de 8 minutos. Cuatro por lección.
- **`-reset_timestamps 1`** — cada trozo empieza en 0:00. Esto es clave para
  lo siguiente.

### Recomponer los tiempos

Como cada trozo empieza en cero, los timestamps que devuelve Whisper son
relativos al trozo, no a la lección. El script les suma el desplazamiento:

```python
offset = (index - 1) * args.chunk_seconds     # 0, 480, 960, 1440
"start": round(float(segment["start"]) + offset, 3)
```

Sin esto, todas las lecciones tendrían cuatro frases marcadas en el segundo 3.

### El prompt que evita que traduzca

Whisper, si le dejas, "arregla" el audio traduciéndolo al inglés. En una
lección de idiomas eso destruye exactamente lo que quieres capturar. El
script le pasa un prompt de contexto:

> "This is a Tagalog language lesson with English explanations and Tagalog
> practice phrases. Transcribe exactly in the original languages. Do not
> translate."

### Marca de transcripción parcial

Si usas `--max-chunks` para probar con solo un trozo, el JSON resultante
lleva `"partial": true`. Los scripts siguientes **saltan las parciales** y
tampoco entran en `index.json`. Así una prueba a medias nunca contamina los
datos buenos.

### Formato de salida — `transcripts/raw/lesson-01-main.json`

```json
{
  "id": "lesson-01-main",
  "lesson": 1,
  "kind": "main",
  "model": "whisper-1",
  "chunk_seconds": 480,
  "total_chunks": 4,
  "partial": false,
  "chunks": [ { "chunk": "chunk-000.mp3", "offset": 0, "text": "...", "segments": [...] } ],
  "segments": [
    { "start": 0.0, "end": 8.0, "text": "This is Unit 1 of Pimsleur's Tagalog..." },
    { "start": 8.0, "end": 12.0, "text": "Magandang tanghali. Nakakaintindi ka ba ng Ingles?" }
  ],
  "text": "transcripción completa concatenada"
}
```

### Uso

```bash
python3 scripts/transcribe_tagalog.py --all               # las 50 pistas
python3 scripts/transcribe_tagalog.py --track lesson-01-main
python3 scripts/transcribe_tagalog.py --track lesson-01-main --max-chunks 1   # prueba barata
python3 scripts/transcribe_tagalog.py --all --force       # ignora el caché
```

Al terminar, siempre reescribe `transcripts/index.json`.

---

## 2 · `enrich_transcripts.py` — idioma, traducción, notas y guía

Este es el script con más truco. Coge cada segmento y le añade cuatro cosas:
en qué idioma está, qué tipo de segmento es, cómo se traduce al español y una
nota gramatical.

### El problema del desalineado

Le pides al modelo que devuelva 30 segmentos enriquecidos y te devuelve 29.
O 31. O fusiona dos frases cortas en una. Si eso pasa, **los timestamps dejan
de corresponder con el texto** y la sincronización de la transcripción se va
al garete de forma silenciosa.

La solución es una cadena de tres defensas:

**Primera: el prompt es explícito hasta ser pesado.**

> "Preserve every segment's start, end, and text exactly as provided. Do not
> merge, split, translate, or paraphrase the text field. Return exactly the
> same number of segments, in the same order."

**Segunda: se verifica el recuento y se reintenta.**

```python
if len(batch_segments) == len(segments):
    return batch_segments
# si no, reintenta hasta 3 veces
```

**Tercera: si sigue fallando, divide por la mitad y recurre.**

```python
midpoint = len(segments) // 2
left  = request_enriched_segments(segments[:midpoint], ...)
right = request_enriched_segments(segments[midpoint:], ...)
return left + right
```

La recursión baja hasta lotes de un solo segmento. Si un segmento suelto
también falla, se devuelve sin enriquecer (`language: "other"`, traducción
vacía) pero **con su start y su end intactos**.

El resultado: por muy mal que se porte el modelo, la sincronización nunca se
rompe. Como mucho pierdes la traducción de una frase.

### Lotes de 30 segmentos

Se mandan de 30 en 30. Menos sería multiplicar las llamadas; más aumenta la
probabilidad de que el modelo se despiste y descuadre el recuento. Cada lote
se guarda en `enriched_batches/<pista>/batch-NNN.json`.

Además el caché **verifica el recuento al recargarlo**: si un lote cacheado
no cuadra con los segmentos de entrada, lo recalcula en vez de propagar el
error.

### La guía de estudio

Segunda llamada por pista, distinta de las anteriores. Recibe todos los
segmentos ya enriquecidos, en versión compacta, y devuelve:

- `summary_es` — una frase que explica qué enseña la lección
- `topics` — de 4 a 8 etiquetas cortas en español (las píldoras de la interfaz)
- `dialogue` — el diálogo de la lección, `tl` y `es` en paralelo

El prompt le dice explícitamente que **no vuelque el guion completo**, solo
el esqueleto útil.

### Formato de salida — `transcripts/enriched/lesson-01-main.json`

```json
{
  "id": "lesson-01-main",
  "title": "Lección 01",
  "summary_es": "En esta lección se aprende a iniciar una conversación...",
  "topics": ["Saludo al mediodía", "Entender o no entender", "..."],
  "dialogue": {
    "tl": ["Magandang tanghali. Nakakaintindi ka ba ng Ingles?", "..."],
    "es": ["Buen día. ¿Entiendes inglés?", "..."]
  },
  "segments": [
    {
      "start": 8.0, "end": 12.0,
      "language": "tl",
      "kind": "dialogue",
      "text": "Magandang tanghali. Nakakaintindi ka ba ng Ingles?",
      "translation_es": "Buen día. ¿Entiendes inglés?",
      "note_es": "Magandang tanghali se usa desde media mañana hasta media tarde."
    }
  ]
}
```

`language` es uno de `en`, `tl`, `mixed`, `other`.
`kind` es uno de `instruction`, `prompt`, `phrase`, `dialogue`, `explanation`, `other`.

### Uso

```bash
python3 scripts/enrich_transcripts.py --all
python3 scripts/enrich_transcripts.py --track lesson-01-main
python3 scripts/enrich_transcripts.py --all --batch-size 20   # si descuadra mucho
```

---

## 3 · `build_dictionary.py` — el diccionario cruzado

**No usa API.** Es puro Python: lee los 50 archivos enriquecidos y saca un
diccionario buscable. Corre en segundos y es gratis, así que se puede
regenerar todas las veces que quieras.

### La fuente

Dos sitios:
1. El `dialogue.tl` / `dialogue.es` de cada guía de estudio.
2. Todos los segmentos cuyo `language` sea `tl` o `mixed`, con su
   `translation_es`.

### El problema: separar Tagalog de inglés

Un curso de idiomas es mitad inglés (las explicaciones) y mitad Tagalog (lo
que practicas). Si metes todo en el diccionario, acabas con entradas como
"Listen and repeat" traducidas al español. Ruido puro.

El script filtra con heurísticas apiladas, sin IA:

**Listas de vocabulario.** `TAGALOG_HINTS` con palabras inequívocamente
tagalas (`ako`, `bahay`, `magkano`, `kumusta`...). `ENGLISH_WORDS` con las
inglesas frecuentes del curso. Se cuentan aciertos de cada lado:

```python
if tagalog_hits == 0 and english_hits:
    return True   # es inglés, fuera
```

**Prefijos de instrucción.** Si empieza por `"listen and "`, `"repeat "`,
`"now "`, `"try to"`, `"read number"`... es una instrucción del narrador,
no vocabulario.

**Nombres propios.** Regex que caza `Mr.`, `Mrs.`, `Jones`, `Dimaapi`,
`Isagani` y demás personajes de los diálogos. No son vocabulario útil.

**Palabras cortas.** Con una sola palabra de 3 letras o menos, se exige que
esté en `SHORT_TAGALOG_WORDS` (`ang`, `ba`, `ko`, `mo`, `na`, `ng`, `po`,
`sa`, `si`, `oo`...). Si no, fuera: son artículos ingleses.

**Números.** Cualquier cosa con dígitos se descarta. Son ejercicios de
lectura de números, no vocabulario.

### Deduplicación por clave canónica

La misma frase aparece en varias lecciones con puntuación distinta. Se
normaliza a una clave:

```python
def canonical_key(value):
    key = norm(value).strip(".?!")
    key = key.replace("kamusta", "kumusta")   # unifica la variante ortográfica
    key = re.sub(r"[^\wÀ-ÿÑñ]+", " ", key)
    return clean(key)
```

Cuando dos entradas colapsan en la misma clave y tienen traducciones
distintas, **se acumulan hasta tres** separadas por ` / `. Por eso en el
diccionario ves `"Kumusta na? → ¿Cómo estás ya? / ¿Cómo has estado?"`.

### Referencias con timestamp

Cada entrada guarda hasta **6 referencias**, cada una con `trackId`, `start`
y `end`. Eso es lo que permite que el diccionario te diga "esto aparece en
la Lección 27, minuto 0:15". La deduplicación de referencias redondea el
`start` a un decimal para no meter la misma frase dos veces.

### Clasificación por tipo

```python
if texto.endswith("?"):  -> "phrase"
if 1 palabra:            -> "word"       (233 entradas)
if 2-7 palabras:         -> "phrase"     (2.236 entradas)
if 8 o más:              -> "sentence"   (79 entradas)
```

La interfaz los agrupa como **Palabras**, **Frases clave** y **Frases largas**.

### Formato de salida

```json
{
  "generatedAt": "2026-06-22T17:22:32.961019+00:00",
  "entryCount": 2548,
  "entries": [
    {
      "tagalog": "Aalis.",
      "spanish": "Voy a irme. / Me iré. / Nos vamos.",
      "type": "word",
      "topic": "Saludo y cortesía",
      "sources": ["Lección 27", "Lección 28", "Lección 30"],
      "refs": [
        { "trackId": "lesson-27-main", "start": 1145.0, "end": 1146.0, "source": "Lección 27" }
      ]
    }
  ]
}
```

### Uso

```bash
python3 scripts/build_dictionary.py
```

---

## COSTE Y TIEMPO APROXIMADOS

Para las 50 pistas (~1,3 GB, unas 25 horas de audio):

| Paso | Llamadas API | Tiempo |
|---|---|---|
| Trocear con ffmpeg | 0 | pocos minutos |
| Transcribir | ~180 (una por trozo) | ~30 min |
| Enriquecer | ~400 lotes + 50 guías | ~3 h |
| Diccionario | 0 | segundos |

El paso caro es el enriquecimiento, y es donde más rentan el caché y los
reintentos con división.

---

## LA API KEY

Se lee de `~/.config/victor/openai_api_key` (cambiable con `--key-file`).
**Nunca en el repositorio ni en variables de entorno versionadas.** Los
scripts validan el formato antes de usarla:

```python
if not key or key == "TU_OPENAI_API_KEY" or not key.startswith(("sk-", "sk-proj-")):
    raise SystemExit(f"OpenAI key is missing or invalid in {path}")
```
