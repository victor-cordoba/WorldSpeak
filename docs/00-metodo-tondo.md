# El Método Tondo

> Aprender un idioma **de oído y hablando**, media hora al día, para conocer a
> la persona que tienes delante. Nació en Tondo (Manila) con el Tagalog; vale
> para cualquier idioma. Es Pimsleur llevado al móvil, al bus y a la calle, y
> hecho de piezas que se reutilizan.

Este documento es el compendio del método tal y como está implementado en
WorldSpeak. Todo lo que dice aquí lo hace `pipeline/voice/compile_lesson.py`.

---

## 1 · PRINCIPIOS

1. **Hablas antes de estudiar.** Nunca ves una regla antes de haber dicho la frase.
2. **Anticipación.** El narrador te pide producir ("¿cómo se dice…?"), hay una pausa, tú lo dices, y *después* el nativo lo dice. Nunca al revés.
3. **Construcción hacia atrás.** Cada frase nueva se aprende desde la última sílaba: *po → hali po → tanghali po → Magandang tanghali po*. Así la pronunciación final, la más difícil, se fija primero.
4. **Repetición espaciada.** Lo nuevo vuelve dentro de la lección, en la siguiente, y **por sorpresa** dos o tres lecciones más tarde.
5. **Entender, no solo decir.** Cada lección entrena el oído con las respuestas típicas que te van a dar, con otra voz.
6. **Poco y de calidad.** 6–8 ítems nuevos por lección. Palabras de altísima frecuencia y utilidad real.
7. **Primero las herramientas.** Pronombres, palabras de preguntar, `gusto`, `ba`, sí/no: con eso ya conversas. Luego el vocabulario por temas.
8. **La persona, no el turista.** El objetivo es conocer a quien tienes delante: cómo se llama, dónde vive, si ha comido, si es feliz. En Tondo con niños de la calle; en Roma, siendo uno más.
9. **Español → idioma.** Sin pasar por el inglés. Lo que es igual en español (horas, préstamos) se enseña como regla, no palabra a palabra.
10. **Todo es un ítem.** Una frase con su traducción, literal, nota y tema sirve para el audio, las tarjetas, las tablas, el repaso y las lecciones a medida.

---

## 2 · LA UNIDAD: EL ÍTEM

```json
{ "id": "anong-pangalan-mo", "tl": "Anong pangalan mo?", "es": "¿Cómo te llamas?",
  "lit": "qué-el nombre tu", "note": "anong = ano ang. mo va DETRÁS de la cosa.",
  "pill": "preguntar", "tags": ["interrogativo", "pronombre"], "lesson": 1 }
```

- `answer: true` marca las **respuestas a entender** (oo, hindi, konti lang…): no se piden, se reconocen.
- `pill` es el tema visible (preguntar, entender, presentarse, cortesía, moverse, mercado, niños, corazón, familia, casa, trabajo, comida, tiempo, fe, salud, social, peligro).
- Los clips de voz se generan **una vez por texto y voz** y se reutilizan en lecciones, tarjetas, diálogos y repasos.

---

## 3 · LA LECCIÓN (15 minutos)

| Bloque | ~Min | Qué pasa | Repeticiones |
|---|---|---|---|
| **Intro** | 0.5 | Narrador sitúa la escena en una frase. **Diálogo completo** por los nativos. | diálogo ×1 |
| **Explicación** | 0.3 | De qué va y qué vas a poder hacer al terminar. | |
| **Repaso previo** | 1.5 | 3–5 ítems de lecciones anteriores por anticipación (pregunta → pausa 4 s → respuesta nativa). Incluye **2 ítems "sorpresa"** de lecciones al menos dos atrás. | cada ítem ×1 |
| **Enseñar** ×6–8 | 8 | Por cada ítem nuevo: significado + literal → nativo (frase) → construcción hacia atrás por sílabas (3–5 pasos) → frase ×2 → nota del narrador → anticipación ×2. **Cada 2 ítems**, "volvamos atrás": anticipación de un ítem de hace 2. | cada frase ≈ 7–9 veces oída, 4–5 dicha |
| **Pregunta sorpresa** | 0.2 | Un ítem de una lección antigua, sin avisar. | ×1 |
| **Píldora de gramática** | 1 | Una sola regla, hablada, con 2 ejemplos nativos. | |
| **Entender** | 1 | Respuestas típicas con **otra voz**: la oyes, piensas, el narrador la traduce, la vuelves a oír. | ×2 |
| **Conversación guiada** | 2 | El narrador plantea la situación, tú produces, el nativo confirma. Es el diálogo inicial, dicho por ti. | ×1 |
| **Repaso final** | 1.5 | Todos los ítems nuevos por anticipación. | ×1 |
| **Cierre** | 0.5 | Diálogo completo otra vez. Despedida. | diálogo ×1 |

**Pausas** (segundos tras el cue): sílaba 1,2 · frase corta 2,5 · frase larga 3,5 · anticipación 4 · explicación 0,4 · entre líneas de diálogo 0,8.

**Cuántas veces vuelve un ítem**: en su lección, unas 12 veces entre oírlo y decirlo; en la siguiente, 1–2 (repaso previo); dos o más lecciones después, por sorpresa, con probabilidad decreciente; en la lección de cierre de nivel, todos.

**Duraciones**: 15 min de lección; **5 min** en modo repaso (solo anticipación de los ítems de una lección o de un tema); **30 min** de inmersión (dos lecciones + escena larga). La misma receta produce las tres.

---

## 4 · LOS SPEAKERS

Reglas fijas para que el alumno reconozca las voces:

| Voz | Papel |
|---|---|
| **Narrador** (español, castellano) | Explica, pregunta, sitúa. Cercano, tutea, frases cortas. |
| **Profesor nativo** (hombre) | Dice **todas** las frases que aprendes y sus sílabas. Es "la voz del idioma". |
| **Voz nativa 2** (mujer) | Las **respuestas a entender** y su personaje en los diálogos. |
| **Niño / niña** | Solo en escenas con niños (Nivel 3). |

Los diálogos tienen **dos personajes** como máximo, cada uno con su voz. Nunca se mezclan voces dentro de una misma frase que se aprende.

---

## 5 · EL CURSO (30 lecciones, 5 niveles)

| Nivel | Lecciones | Objetivo |
|---|---|---|
| 1 · Kit de conversación | 1–8 | Saludar, presentarse, **pronombres**, las **palabras de preguntar**, `gusto`, preguntas con `ba`, entender sí/no/un poco/no sé, quiero ir a, cuánto cuesta. Al acabar: conversas. |
| 2 · Conocer a una persona | 9–14 | Dónde vive, familia, edad, trabajo, ¿ya has comido?, un placer. |
| 3 · La calle | 15–20 | (Tondo: niños solos. Roma: la ciudad como un local.) |
| 4 · El corazón | 21–25 | Feliz/triste, te quieren, sueños, peligro, rezar / lo que da sentido. |
| 5 · Día a día | 26–30 | Comida, transporte, salud, conectores, **verbos: el motor**. |

La **lección 8** cierra el Nivel 1 con la conversación completa. La **30** consolida el sistema verbal, que se ha ido usando desde la 1 sin explicarlo.

---

## 6 · LAS TABLAS (13)

Pronombres · Partículas · Preguntar (palabras + 3 recetas) · Lo que te van a contestar · Verbos (raíz → pasado → presente → futuro → ¡hazlo!) · Conectores y "estar" · Familia · Números y dinero · Direcciones · Tiempo · Préstamos del español · Sentimientos · Chuleta de oro (10 frases).

Cada celda es un ítem: se toca y suena. Las tablas son para **mirar antes de hablar**, no para estudiar.

---

## 7 · LA PRÁCTICA (sin audio o con él)

- **Frases**: tarjetas por tema, voltables (idioma ↔ español), con ▶.
- **Repaso por anticipación**: ves el español, lo dices en voz alta, compruebas, marcas "me costó". Las difíciles se guardan y vuelven.
- **Diálogos**: las conversaciones de cada lección, línea a línea, con audio y traducción al tocar. Para leer en voz alta y repetir.
- **Práctica rápida por lección**: 12 ítems de la lección en la que vas.
- **A medida**: eliges temas + gramática + duración y se compila un repaso al vuelo. Gratis, porque los clips ya existen.

---

## 8 · CÓMO SE PRODUCE UN CURSO NUEVO

```
curriculum.json (30 lecciones: título, ítems clave, gramática)
   → author_lesson.py  (GPT redacta ítems, escena y receta; revisión humana después)
   → compile_lesson.py (receta + duración → cues con pausas, speakers y repetición)
   → synth.py          (ElevenLabs; Fish de respaldo; caché por texto+voz)
   → assemble.py       (ffmpeg, tiempos exactos, transcripción sincronizada)
   → build_dictionary.py + export_clips.py
```

Un curso nuevo = un `curriculum.json`, un `context` (quién lo va a usar y dónde), 13 tablas y un perfil de voces. El motor, el player, la app y la práctica son los mismos.

---

## 9 · LO QUE ES IGUAL EN TODOS LOS IDIOMAS (y lo que cambia)

**Igual**: el compilador, las plantillas del narrador, la estructura de la lección, las
pausas, las reglas de speakers, las 13 tablas, la app (Ruta/Frases/Tablas/A medida),
el lint de contenido y la producción.

**Cambia, y solo en `course.json`**:

```json
"language": { "code": "ceb", "name": "Bisaya", "flag": "ph" },
"context": "para quién, dónde, situaciones, registro, gramática de uso",
"method_config": {
  "closing": "Amping!",
  "first_time_notes": [ { "triggers": [" kita", " ta "], "text": "…lo que el narrador explica la primera vez…" } ]
}
```

- `first_time_notes`: cosas que hay que explicar **la primera vez que aparecen** (el `po`
  del Tagalog, el `Lei` italiano, el `kita` del Bisaya), no al final en una tabla.
- `closing`: la despedida del narrador.
- El `context` es lo único que lee el redactor: si está bien escrito, las 30 lecciones
  salen situadas (Tondo, Cebú y Bohol, Roma) sin tocar nada más.

Un idioma nuevo: `scripts/new-course.sh <id> "<Nombre>" <código> <bandera> "<subtítulo>"`
y después el checklist del doc 15.

## 10 · LO QUE HEMOS APRENDIDO (resumen del doc 15)

1. **El narrador nunca dice el idioma objetivo.** Las variantes son del nativo (`variant`).
2. **Explica al aparecer**, no al final: `first_time_notes`.
3. **Enseñar ≠ entender**: las respuestas (`answer`) van al bloque de entender.
4. **Un profesor nativo por curso** y dos personajes por diálogo.
5. **Mide sobre WAV** y despliega texto y audio juntos.
6. **No limpies el audio**: elige voces limpias de origen.
7. Narrador en `multilingual_v2` con `language_code` del narrador; nativos en `v3`.
8. **Escucha la L01 entera** antes de producir las 30.

## 11 · LO QUE NO ES

- No es una app de gamificación: la racha y los porcentajes están, pero lo que cuenta es hablar.
- No es un curso "de turista": las frases sirven para **quedarte**, no para pasar.
- No es para estudiar en silencio: si no lo dices en voz alta, no funciona.

*Método Tondo · WorldSpeak · 2026 · MIT (el código) · las voces, de bibliotecas con licencia, nunca clonadas sin permiso.*
