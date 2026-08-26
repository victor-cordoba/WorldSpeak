# CLAUDE.md

Contexto para Claude Code al trabajar en WorldSpeak. Este archivo se publica en
el repositorio a propósito: es documentación viva del proyecto.

## QUÉ ES

Plataforma para aprender idiomas escuchando y repitiendo (método Pimsleur),
con transcripción sincronizada, traducción al español y diccionario. Un hub
con varios cursos y una cuenta única cuyo progreso viaja entre dispositivos.

- Producción: `https://victorcordoba.com/worldspeak/` (Hostinger, alias SSH `PERSONAL_SERVER`)
- Repo: `https://github.com/victor-cordoba/WorldSpeak` (remote por alias SSH `github-victor`)
- Usuario objetivo: hispanohablante estudiando en el móvil, en el bus, para la misión en Filipinas.

## MAPA

```
web/                      ← lo que se despliega, tal cual, a /worldspeak
  index.html courses.json ← hub (assets/hub.js + hub.css)
  assets/player.js        ← reproductor GENÉRICO: no sabe de ningún idioma
  assets/boot.js          ← lee ./course.json y lanza el player
  api/index.php           ← backend v2 (PDO; MySQL si hay config.php, si no SQLite)
  <curso>/                ← una carpeta por curso = una URL /worldspeak/<curso>/
     index.html course.json transcripts/ audio/ scripts/ _clips/
pipeline/                 ← transcribe.py enrich.py build_dictionary.py (--course)
pipeline/voice/           ← generador de lecciones con ElevenLabs (método Pimsleur)
scripts/deploy.sh         ← rsync a producción
docs/                     ← empieza por 08-worldspeak.md
```

## REGLAS DURAS

- **Cero dependencias y cero build en el frontend.** HTML + CSS + JS vanilla.
  No propongas React, bundlers ni npm. Se despliega copiando archivos.
- **El player es genérico.** Nada específico de un idioma en `assets/`. Todo lo
  particular de un curso vive en su `course.json` y su `index.html`.
- **Claves fuera del repo, siempre.** `~/.config/victor/openai_api_key` y
  `~/.config/victor/elevenlabs_api_key`. `web/api/config.php` está ignorado.
  Si ves una clave en un diff, para y avisa.
- **Contenido con copyright fuera de git.** `tagalog-pimsleur/audio` y sus
  `transcripts/` son obra derivada de Pimsleur: ignorados. Los cursos PROPIOS
  (`tagalog/`, `bisaya/`) sí versionan guiones y transcripciones; el audio y
  `_clips/` no (se regeneran).
- **No clonar voces de personas reales sin su consentimiento.** Se usan voces
  de la Voice Library de ElevenLabs o Voice Design. Ver `pipeline/voice/voices.json`.
- **Sitio privado:** `noindex, nofollow, noarchive` en meta y `.htaccess`.
- **Interfaz en español de España, código en inglés.**

## AL TOCAR EL FRONTEND

Cache busting en tres sitios: `?v=` de CSS y boot.js en cada `index.html`, y
`"version"` en cada `course.json` (es lo que cachebustea player.js y los JSON
de transcripts). Formato `AAAAMMDD-N`. Si no lo subes, nadie ve el cambio.

Tokens de color en `:root` de `assets/player.css` (bandera filipina). Dos
breakpoints: 761px. `hub.css` reutiliza esos tokens.

## AL TOCAR LA API

`POST web/api/index.php` con `{ action, course, ... }` y `Authorization: Bearer`.
Acciones: `login`, `me`, `save`, `overview`, `logout`. Progreso guardado POR
CURSO (`ws_progress` PK user+course). El cliente fusiona (`mergeProgress()` en
player.js), nunca pisa. El id de usuario es `sha256(nombre normalizado)`, igual
que la v1: no lo cambies o los usuarios migrados pierden la cuenta.

Sin `config.php` la API usa SQLite en `web/api/.private/worldspeak.sqlite`
(así está hoy en producción). Para pasar a MySQL: crear la BD en hPanel y
`config.php` a partir de `config.example.php`; el esquema se crea solo.

## AL TOCAR CONTENIDO DEL TAGALOG PROPIO

Todo sale de `web/tagalog/content/`: `items.json` (la unidad de todo: audio,
tablas, frases, lecciones), `scenes.json`, `recipes/`, `tables.json`, `pills.json`.
El plan y el currículo están en `docs/10-plan-tagalog-propio.md`: léelo antes de
añadir ítems o lecciones. Ítems nuevos → siempre con `es`, `lit`, `note`, `pill`,
`lesson`. Los ítems que son respuestas a entender llevan `"answer": true`.
Niveles 3 y 4 (niños, corazón) se revisan con Víctor antes de grabar.

## AL GENERAR LECCIONES (ElevenLabs)

```bash
export PATH=/opt/homebrew/bin:$PATH     # ffmpeg
cd pipeline/voice
python3 generate_lesson.py --course tagalog --lesson 2 --minutes 25 --theme "..." --dry-run   # cuenta caracteres
python3 generate_lesson.py --course tagalog --lesson 2 --minutes 25 --theme "..."             # genera
```

Orden: `compile_lesson.py` (receta de `content/recipes/` → cues, determinista; `write_script.py` con GPT solo si no hay receta) → `synth.py` (ElevenLabs,
cachea cada clip por hash) → `assemble.py` (ffmpeg + escribe transcripts con
tiempos EXACTOS, sin Whisper) → `build_dictionary.py`. Siempre `--dry-run`
primero: el plan actual de ElevenLabs tiene 10.000 caracteres/mes y una lección
de 25 min gasta ~9.000. Relanzar nunca regenera clips ya en caché.

## COMANDOS

```bash
python3 -m http.server 8000 -d web           # local (sin API; para API hace falta php)
scripts/deploy.sh                            # código + transcripts
rsync -az web/tagalog/audio/ PERSONAL_SERVER:~/domains/victorcordoba.com/public_html/worldspeak/tagalog/audio/
python3 pipeline/build_dictionary.py --course tagalog-pimsleur
```

## AL TERMINAR UNA TAREA

Actualiza `CHANGELOG.md` (sección `[Sin publicar]`) y, si cambia algo de
arquitectura, el doc correspondiente en `docs/`. Commit en español, cuerpo
explicando el porqué. Push a `origin main`.
