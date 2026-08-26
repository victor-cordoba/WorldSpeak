# CLAUDE.md

Contexto para Claude Code al trabajar en este repositorio.

## QUÉ ES

Reproductor web de un curso de Tagalog en audio, con transcripción
sincronizada, traducción al español y diccionario. En producción en
`https://misioncebu.org/tagalog/`. Usuario objetivo: **una persona
hispanohablante estudiando Tagalog en el bus, en el móvil**.

## REGLAS DURAS

- **Cero dependencias en el frontend.** No hay build, no hay `package.json`,
  no hay React, no hay bundler. HTML + CSS + JS vanilla. **No propongas
  añadir un framework ni un paso de build.** Se despliega copiando archivos
  y esa es una decisión deliberada, no una limitación.
- **Nada de audio ni transcripciones en git.** El audio es material de
  Pimsleur con copyright y las transcripciones son obra derivada. Están en
  `.gitignore`. Si algo genera datos nuevos bajo `transcripts/`, comprueba
  que sigue ignorado antes de commitear.
- **La API key de OpenAI nunca va en el repo.** Se lee de
  `~/.config/victor/openai_api_key`. Los scripts validan el formato antes de
  usarla.
- **El sitio es privado.** `noindex, nofollow, noarchive` en el `<meta>` y en
  `.htaccess`. No lo quites.
- **Interfaz en español, código en inglés.** Todos los textos que ve el
  usuario van en español de España. Nombres de variables y funciones en
  inglés.

## AL TOCAR EL FRONTEND

`index.html`, `app.js` y `styles.css` llevan un query param de versión para
romper la caché:

```html
<link rel="stylesheet" href="./styles.css?v=20260701-4">
<script src="./app.js?v=20260701-4"></script>
```

Y `app.js` tiene la constante `assetVersion` en la línea 2, que se usa para
cachebustear los JSON de `transcripts/`.

**Si cambias `app.js`, `styles.css` o cualquier JSON de datos, sube la
versión en los TRES sitios.** Formato `AAAAMMDD-N`. Si no lo haces, los
usuarios siguen viendo la versión vieja y parece que el cambio no funciona.

`styles.css` empieza con un bloque `:root` de variables. Usa esos tokens
(`--blue`, `--red`, `--gold` son los colores de la bandera filipina), no
metas colores a pelo.

Solo hay dos breakpoints: `min-width: 761px` y `max-width: 760px`.

## AL TOCAR EL PIPELINE

Los tres scripts de `scripts/` son secuenciales y **cachean en disco por
archivo**. Están escritos así a propósito: procesar las 50 pistas cuesta
dinero en llamadas a la API, y una caída a mitad no debe obligar a repetir
todo. Nunca borres el caché ni fuerces recálculo sin `--force` explícito.

Orden obligatorio: `transcribe_tagalog.py` -> `enrich_transcripts.py` ->
`build_dictionary.py`. Cada uno lee la salida del anterior.

`transcribe_tagalog.py` y `enrich_transcripts.py` usan `urllib` de la
librería estándar, no `requests`. Mantenlo así: los scripts corren sin
instalar nada.

## AL TOCAR LA API

`api.php` acepta POST con `{"action": ...}`. Acciones: `login`, `logout`,
`me`, `save`. Autenticación por `Authorization: Bearer <token>`.

La sincronización de progreso **fusiona, no pisa** (`mergeProgress()` en
`app.js`). Si tocas el formato de `progressState`, actualiza
`normalizeProgressState()` para que las sesiones viejas sigan cargando.

## COMANDOS

```bash
python3 -m http.server 8000          # servir en local
python3 scripts/transcribe_tagalog.py --track lesson-01-main   # una sola pista
python3 scripts/build_dictionary.py  # regenerar diccionario (rápido, sin API)
```

## DESPLIEGUE

Servidor Dinahosting por SSH, alias `DINAHOSTING_mision_cebu`. Se sube con
rsync excluyendo `transcripts/enriched_batches/` y `transcripts/chunks/`.
Ver `docs/05-despliegue.md`.

## GIT

Este repo usa el GitHub **personal** de Víctor (`victor-cordoba`), no el de
Fundación Hakuna. El remote va por el alias SSH `github-victor`, no por
`github.com`. Si el remote apunta a `git@github.com:...` está mal y hará
push con la identidad equivocada.
