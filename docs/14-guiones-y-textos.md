# 14 · Los textos que se generan: qué dice cada voz y por qué

Todo lo que suena en una lección sale de `web/<curso>/content/` y lo ordena
`compile_lesson.py`. Los guiones compilados (lo que se envía literalmente a
ElevenLabs/Fish) están en `web/<curso>/scripts/lesson-NN.json`: una lista de
`cues` con `role` (quién), `text` (qué), `kind` (tipo), `pause` (silencio
después), `translation_es` (para la transcripción) e `item` (de qué ítem sale).

## Quién dice qué

| Voz | Dice | Nunca dice |
|---|---|---|
| **Narrador** (español peninsular, `eleven_multilingual_v2` con `language_code: es`) | Situación de la escena, significado y literal de cada frase, la nota de uso, las preguntas de anticipación («¿Cómo se dice…?»), la píldora de gramática, las traducciones del bloque «entender», las instrucciones. | Frases en el idioma objetivo. Si una nota necesita una forma alternativa (con respeto, plural…), va en el campo `variant` y **la dice el nativo**. |
| **Profesor nativo** (hombre, `eleven_v3`) | La frase de cada ítem, sus trozos en construcción hacia atrás, las repeticiones, la respuesta a cada anticipación, las variantes, los ejemplos de la píldora, las confirmaciones de la conversación guiada. | Español. |
| **Voz nativa 2** (mujer, `eleven_v3`) | Las respuestas típicas del bloque «entender» (dos veces) y su personaje en el diálogo. | |
| **Niño / niña** | Solo líneas de diálogo en escenas con niños. | |

## De dónde sale cada texto del narrador

- **Intro**: `"Lección N. {título}."` + `scene.setting` + «Escucha la conversación.»
- **Explicación**: `recipe.subtitle` + «Al terminar, esta conversación la vas a hacer tú.»
- **Repaso previo**: «Antes de empezar, repasemos.» + por ítem `¿Cómo se dice «{es}»?` (variantes: «Di: …», «Otra vez. …», «Y ahora, …»).
- **Enseñar**: `«{es}». Literalmente, {lit}. Escucha y repite.` → (nativo) → `{note}` → si hay `variant`: `Y {variant.es}, escucha:` → (nativo dice `variant.tl`) → «Pero hoy practicamos la primera forma.» (si la variante es «con respeto») → anticipación ×2.
- **`po`** (solo Tagalog): antes de la primera frase, nota o variante que lleve `po`, el narrador explica qué es una sola vez.
- **Volvamos atrás** (cada 2 ítems): «Un momento. Volvamos atrás.» + anticipación de un ítem de hace 2.
- **Pregunta sorpresa**: «Pregunta sorpresa, de una lección anterior.» + anticipación de un ítem de ≥2 lecciones atrás (semilla fija por lección).
- **Píldora**: `grammar_pill.title` + `grammar_pill.text` + ejemplos (nativo).
- **Entender**: «Ahora, a entender. Vas a oír respuestas típicas, con otra voz…» + por ítem: (mujer) → `«{es}».` → (mujer).
- **Guiada**: «Conversación guiada…» + por paso `guided.prompt` → (nativo `item.tl`).
- **Repaso final**: «Repaso final. Todo lo de hoy.» + anticipaciones.
- **Cierre**: «Escucha la conversación completa una vez más…» + diálogo + «Hasta la próxima lección. Ingat ka!» (en Bisaya: «Amping!»).

## Reglas de los ítems (lo que revisa `lint_content.py`)

1. `tl`, `es`, `pill`, `lesson` obligatorios; `pill` de la lista del curso.
2. **La nota no lleva frases en el idioma objetivo.** Si hace falta una forma alternativa, va en `variant: {tl, es}`.
3. `answer: true` marca lo que se **entiende** (respuestas), no lo que se enseña. Si una receta enseña respuestas, el lint las pasa a `listen`, salvo que la lección se quedara con menos de 5 frases (entonces se enseñan y pierden la marca).
4. Sin duplicados de `tl` (el lint los fusiona y redirige las recetas).
5. Escenas con **dos personajes** como máximo; los extra se reasignan por género.
6. Recetas: 4–9 ítems en `teach`, ids existentes, escena existente.

El lint corre con `--fix` antes de compilar cada lección en `produce-levels.sh`.

## Pausas (segundos después del cue)

sílaba 1,2 · frase corta 2,5 · larga 3,5 · anticipación 4 · explicación 0,4 · entre líneas de diálogo 0,8 · **última repetición antes de que hable el narrador 1,2** · respuesta del bloque entender 2,0 y 1,2.

## Cebuano (Bisaya)

Mismo compilador y mismas plantillas del narrador. Diferencias: no hay
explicación de `po` (no existe); el `context` del curso fija Cebu City, `dong/day`,
`kita/kami`, `dili/wala`; el redactor (`author_lesson.py`) recibe «profesor
nativo de Bisaya»; las voces van sin `language_code` para que `eleven_v3`
detecte el cebuano. Despedida del narrador: «Amping!».

## Revisión humana

Las lecciones 9–30 (Tagalog) y las 30 del Bisaya las redacta GPT desde el
currículo y llevan `"_review"` en la receta. Antes de darlas por buenas, que
alguien de Tondo / Cebú lea `content/items.json` y `content/scenes.json`.
