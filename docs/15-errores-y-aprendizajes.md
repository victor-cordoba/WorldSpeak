# 15 · Errores encontrados y cómo se arreglaron (checklist reutilizable)

Todo lo que ha fallado al producir el Tagalog, con la causa y el arreglo. Sirve
de checklist para cada idioma nuevo (Bisaya, Italiano…) y para no repetirlo.

## Contenido y guion

| Síntoma | Causa | Arreglo (dónde vive) |
|---|---|---|
| El narrador dice «con respeto: Ingat po kayo» y luego el nativo dice «Ingat ka» | La nota del ítem llevaba una frase en Tagalog y la leía el narrador con acento raro | Campo `variant: {tl, es}` en el ítem; **la variante la dice el nativo** y el narrador cierra «pero hoy practicamos la primera forma». El lint convierte notas con «…: Frase» en variantes. (`items.json`, `compile_lesson.py`, `lint_content.py`) |
| «De repente dice que añadas po» sin haberlo explicado | La explicación de `po` estaba solo en la píldora de gramática, al final | El narrador explica `po` una vez, justo antes de la primera frase/nota/variante que lo lleve. Solo en Tagalog (`lang_code == "tl"`). |
| Lecciones que «enseñan» respuestas (Opo, masaya ako…) | El redactor GPT metía ítems `answer: true` en `teach` | Lint: pasan a `listen` si la lección conserva ≥5 frases; si no, se enseñan y pierden `answer`. |
| Ítems duplicados (Bakit? dos veces, Ako rin / din) | GPT no ve los duplicados entre lecciones | Lint: fusiona por `tl` normalizado y redirige las recetas. |
| Diálogo con 4 personajes | GPT inventaba personajes | Lint: máximo 2, los extra se reasignan por género. Regla en el prompt del redactor. |
| Muchas voces distintas en una lección | El compilador alternaba hombre/mujer en cada frase | Speakers fijos: profesor nativo (hombre) dice todas las frases; mujer solo en «entender» y en el diálogo. |
| Lección de 15 min salía en 10 | Estimación de velocidad de habla optimista | Calibrado con audio real: escala 10 min/unidad y 11 caracteres/s. |
| «Víctor» en los diálogos | Nombre del autor en los ejemplos | Sustituido por Javier (14 sitios). |
| Bisaya con escenas de Tondo | El `context` del curso se heredó del Tagalog | `context` propio: Cebú y Bohol, Santo Niño, Sinulog, comida local, sin `po`. |

## Audio y voces

| Síntoma | Causa | Arreglo |
|---|---|---|
| Texto desincronizado, el resaltado se adelanta | Concatenar MP3 de distintos bitrates: cada frame mete relleno; con 200 clips, segundos de deriva | Decodificar todo a WAV, medir ahí y codificar una sola vez (`assemble.py`). Verificado con `silencedetect`: 0,08 s de desfase medio. |
| «No va minutado» en producción aunque en local sí | El espejo recibía el audio nuevo pero no las transcripciones nuevas | Un solo dominio (worldspeak.es) y el script de producción despliega texto+audio juntos. |
| Frases nativas cortadas al final | Filtro de limpieza (`silenceremove` a −45 dB) se comía consonantes finales | Limpieza desactivada por defecto (`clean: false`); solo recorte del silencio **inicial** a −50 dB en el montaje. |
| «Limpio» suena peor que el original | `afftdn` mete artefactos; las voces de biblioteca ya vienen limpias o ya vienen con ruido grabado | No limpiar. Elegir voces limpias de origen (el ruido de Josh viene de su grabación y no se quita). |
| Hueco antes de que hable el narrador | Pausa de repetición (2,5–3,5 s) también cuando después no hay nada que repetir | Última repetición antes del narrador: 1,2 s. |
| Narrador español con acento inglés al decir palabras tagalas | `eleven_v3` cambia de idioma al ver Tagalog dentro del español | Narrador en `eleven_multilingual_v2` con `language_code: es` (lee todo como español). Nativos siguen en v3. |
| Narrador lentísimo | Velocidad natural de la voz + pausas | `tempo: 1.28` con `atempo` (forma parte del hash de caché). |
| Voz masculina «de película de miedo» / con ruido | Mark (grave), Josh (ruido de origen) | Nobita. Casting con la misma frase en `web/<curso>/voces/` para elegir de oído. |
| Voz femenina de Fish de mala calidad | «Young Filipino Speaker» | Grandma Sela Tanda (ElevenLabs). |
| Fish devolvía 402 con suscripción pagada | El saldo de API es independiente de la suscripción web | Modelo `s2.1-pro-free` (gratis hasta 31/08/2026) o recargar saldo de API. |
| Se agota ElevenLabs a mitad | Plan pequeño | Respaldo automático a Fish por rol (`fallback`), detectando 401/402/429. |
| Voces de famosos en las bibliotecas (Kuya PBB, Ivana Alawi, «Gandalf») | Clones subidos por usuarios | Nunca usarlas. Voces genéricas licenciadas o clonar con consentimiento (la propia voz de Víctor es la mejor opción). |

## Web y despliegue

| Síntoma | Causa | Arreglo |
|---|---|---|
| Tres de cuatro pestañas vacías | `JSON.parse('null')` devolvía `null` y el fallback no se aplicaba | `safeJson` devuelve el fallback si el resultado es `null`. |
| Cambios que «no llegan» | Caché por versión en `?v=` y caché de LiteSpeed | Subir la versión en index/player/course.json a la vez; probar con `?nocache=`. |
| Imágenes 403 | Capturas nacen con permisos 600 | `chmod 644` antes de subir. |
| Play que no reanuda tras bloquear el iPhone | iOS suspende el `<audio>` | `safePlay()`: si `play()` falla, recargar `src`, volver al segundo guardado y reproducir. |
| Botón «⚡» que llevaba a Diálogos | La práctica se abría en la pestaña equivocada | Selector Repaso/Diálogos y apertura explícita en Repaso. |
| Pills activas ilegibles sobre el fondo vivo | Regla de cristal con más especificidad que la de activo | `.has-live-bg .pill.is-active` explícita. |

## Antes de producir un idioma nuevo

1. `context` del curso escrito a mano (lugares, registro, gramática de uso). Nada heredado.
2. `curriculum.json` con ítems clave en el idioma (anclan al redactor).
3. Tablas escritas a mano (13).
4. Casting: misma frase en 6–10 voces, elegir de oído, comprobar ruido de origen.
5. Perfil de voces: narrador `multilingual_v2` + `language_code: es`; nativos `v3`; fallback Fish.
6. Producir L01, **escucharla entera** y solo entonces lanzar las 30.
7. Revisión humana de `items.json` y `scenes.json` por un nativo.
