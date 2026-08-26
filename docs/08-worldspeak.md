# 08 · WorldSpeak: hub, cursos, player genérico y API v2

El 26 de agosto de 2026 la app de Tagalog pasó a ser una plataforma
multi-idioma. Este documento describe lo que cambió respecto a los docs 01-07,
que siguen siendo válidos para las piezas de base.

## URLS

```
worldspeak.es/                    hub
worldspeak.es/tagalog-pimsleur/   curso migrado (antes misioncebu.org/tagalog)
worldspeak.es/tagalog/            curso propio
worldspeak.es/api/index.php       backend único

misioncebu.org/tagalog/*      301 -> /worldspeak/tagalog-pimsleur/*
victorcordoba.com/tagalog/*   301 -> /worldspeak/tagalog-pimsleur/*
```

Las redirecciones conservan la ruta, así que enlaces antiguos a un JSON o a un
MP3 siguen funcionando. Los archivos antiguos en `misioncebu.org/tagalog/` se
conservan como copia (con `.htaccess.bak-pre-worldspeak` al lado).

## UN CURSO = UNA CARPETA

```
web/<curso>/
  index.html            copia mínima: meta tags, textos del hero, carga boot.js
  course.json           id, título, idioma, rutas, kinds, lista de pistas con copy
  audio/                MP3 (fuera de git)
  transcripts/          index.json, raw/, enriched/, dictionary.json
  scripts/              solo cursos propios: guiones lesson-NN.json
  _clips/               solo cursos propios: caché de ElevenLabs (fuera de git)
```

`boot.js` hace `fetch('./course.json')`, lo deja en `window.WORLDSPEAK_COURSE`
y entonces inserta `../assets/player.js`. Así el player arranca síncrono, con
la lista de pistas ya en memoria, y el código del reproductor no lleva ni un
nombre de archivo ni un título hardcodeado.

### `course.json`

```json
{
  "id": "tagalog",
  "version": "20260826-1",              // cache buster de player.js y de los JSON
  "title": "Tagalog · WorldSpeak",
  "language": { "code": "tl", "name": "Tagalog", "flag": "ph" },
  "context": "para quién es el curso (lo usa write_script.py)",
  "audioBase": "./audio/", "transcriptsBase": "./transcripts/", "api": "../api/",
  "kinds": { "main": { "label": "Lecciones", "badge": "Lección" } },
  "tracks": [ { "id": "lesson-01-main", "lesson": 1, "kind": "main", "title": "Lección 01",
                "file": "Lesson 01 Main.mp3", "copy": { "title": "...", "subtitle": "..." } } ]
}
```

Para el curso Pimsleur, `course.json` se generó ejecutando el preámbulo del
antiguo `app.js` (la lista de 50 pistas y el objeto `trackCopy` escrito a mano).

### `courses.json` (raíz)

Lista de cursos para el hub: id, título, idioma, descripción, número de pistas,
`status` (`live` | `soon`) y `path`. El hub pinta una tarjeta por curso y le
superpone el progreso (del servidor si hay sesión, de `localStorage` si no).

## CLAVES DE LOCALSTORAGE

| Clave | Ámbito |
|---|---|
| `ws:session` | Global. `{ token, user }`. La comparten hub y todos los cursos |
| `ws:<curso>:progress` | Por curso. Mismo formato que la v1 |
| `ws:<curso>:current`, `ws:<curso>:done` | Por curso (respaldo legado) |
| `ws:speed`, `ws:show-translations` | Global |

Las claves antiguas `tagalog-*` vivían en el origen `misioncebu.org` y no se
pueden leer desde `victorcordoba.com`. El progreso anónimo de la app antigua no
migra; el de las cuentas sí, todo.

## API V2

`POST web/api/index.php`, JSON, `Authorization: Bearer <token>`.

| Acción | Entrada | Devuelve |
|---|---|---|
| `login` | `name`, `pin`, `course?`, `progress?` | `token`, `user`, `progress` (del curso), `courses` |
| `me` | `course?` | `user`, `progress`, `courses` |
| `save` | `course`, `progress` | `savedAt` |
| `overview` | | `user`, `courses` (resumen de todos: hechas, segundos, última pista) |
| `logout` | | |

Si no llega `course`, se asume `tagalog-pimsleur` (compatibilidad con la v1).
La whitelist de acciones se comprueba **antes** de autenticar, así una acción
desconocida devuelve 400 y no 401.

### Esquema

```
ws_users        id (sha256 del nombre normalizado, igual que v1), name, pin_hash, email, fechas
ws_sessions     token_hash, user_id, expires_at (120 días, máx 8 por usuario)
ws_progress     (user_id, course_id) PK, progress_json, done_count, total_seconds, last_track, last_position
ws_rate_limits  8 intentos de PIN por nombre+IP, bloqueo 15 min
```

Las columnas resumen de `ws_progress` existen para que `overview` no tenga que
parsear JSON. Se recalculan en cada `save`.

### MySQL o SQLite

`lib/db.php` abre MySQL si hay `config.php` con un DSN `mysql:`; si no, SQLite
en `api/.private/worldspeak.sqlite` (carpeta con `Require all denied`). El
esquema se crea solo en ambos casos (`schema.mysql.sql` / `schema.sqlite.sql`).

**Producción está hoy en SQLite.** Para pasar a MySQL:

1. hPanel → Bases de datos → MySQL → crear base y usuario.
2. `cp config.example.php config.php` en el servidor, rellenar DSN, usuario y contraseña.
3. Exportar SQLite e importar: `php migrate_legacy_users.php` no sirve aquí (es para la v1);
   lo más simple es `sqlite3 .private/worldspeak.sqlite .dump` y adaptar, o
   volver a ejecutar `migrate_legacy_users.php` contra el JSON de la v1 y perder
   solo el progreso posterior a la migración.

## MIGRACIÓN DE LA V1

`migrate_legacy_users.php` (CLI) lee `.private/tagalog-users.json` de la v1 e
inserta usuarios con su `pinHash` tal cual (`password_hash` es compatible: los
PIN siguen valiendo) y su progreso bajo `tagalog-pimsleur`. Idempotente. Se
ejecutó el 26/08/2026: 8 usuarios, 0 saltados.

Las sesiones v1 no se migraron a propósito: estaban en `localStorage` de otro
origen y no se podrían usar. Cada usuario entra una vez con su nombre y PIN.

## EL HUB

`assets/hub.js` reutiliza el modal de cuenta y el teclado PIN del player
(mismo HTML, misma CSS) y añade:

- `overview` al cargar si hay sesión, para pintar progreso por curso.
- Progreso local como respaldo si no hay sesión.
- Estadísticas globales: idiomas activos, lecciones hechas, tiempo total.

## LO QUE NO CAMBIÓ

Todo lo de los docs 02 (pipeline Whisper), 03 (sincronización de la
transcripción, diseño) y 04 (fusión de progreso, modelo de PIN) sigue igual.
Los scripts de `pipeline/` solo ganaron el argumento `--course`.
