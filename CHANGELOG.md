# Changelog

Todas las versiones desplegadas en `https://misioncebu.org/tagalog/`.

Las versiones siguen el formato `AAAAMMDD-N` que se usa como cache buster en
`index.html` y en la constante `assetVersion` de `app.js`.

Este historial se reconstruyó en agosto de 2026 a partir de las marcas de
tiempo de los archivos y del código desplegado, porque el proyecto no estuvo
en git hasta entonces.

---

## [Sin publicar] — 2026-08-26

Ordenar, documentar y abrir el código.

### Añadido
- Repositorio git inicializado y publicado en GitHub como open source (MIT).
- Documentación completa en `docs/`: arquitectura, pipeline de datos,
  frontend, backend, despliegue, historia del proyecto y roadmap.
- `README.md` con capturas de producción.
- `CLAUDE.md` con las reglas del proyecto para trabajar con Claude Code.
- Este `CHANGELOG.md`.
- `LICENSE` (MIT) con nota explícita de que **no cubre el contenido**.
- `.gitignore` que excluye audio, transcripciones y diccionario.
- Cuatro capturas de producción en `screenshots/`.

### Cambiado
- Carpeta reorganizada. El proyecto vive ahora en `app/`, con `AUDIOS/` y
  `DOCS/` como carpetas hermanas y el histórico en `_archivo/`.
- El repositorio se montó a partir del **código de producción**, no de la
  copia local, que estaba una versión por detrás.

### Corregido
- El symlink `audio/` apuntaba a `09 - ESTUDIOS/TAGALOG/pimsleurtagalog`,
  una carpeta que ya no existía. Ahora apunta a `../AUDIOS/PIMSLEUR tagalog`.

### Conocido
- **`api.php` no está en el repositorio.** Solo existe en el servidor de
  producción y el acceso SSH está caído. Es la prioridad número uno del
  roadmap.
- 332 MB de MP3 troceados (caché del pipeline) quedan en
  `_archivo/web-backup-2026-06-22/transcripts/chunks/`. Se pueden borrar sin
  perder nada, pero no se ha hecho sin confirmación.

---

## [20260701-4] — 2026-07-01

Cuentas de estudio y progreso sincronizado entre dispositivos.

### Añadido
- **Cuenta con nombre + PIN de 4 dígitos.** Sin email, sin contraseña, sin
  registro. El mismo botón entra o crea la cuenta.
- **Teclado numérico dibujado en la página**, con indicadores de puntos. En
  el móvil evita pelearse con el teclado del sistema.
- **`api.php`** — backend de cuentas con las acciones `login`, `logout`,
  `me` y `save`. Autenticación por token Bearer.
- **Sincronización con fusión** (`mergeProgress()`). Combina lo local con lo
  remoto en vez de pisar uno con otro: unión de lecciones hechas, máximo de
  tiempo escuchado, y la marca de tiempo más reciente para la posición de
  cada pista. Nunca se pierde progreso al sincronizar.
- **Botón Continuar** en la barra superior. Vuelve al segundo exacto donde
  lo dejaste, en la pista que fuera.
- **Contador de tiempo escuchado**, visible en las estadísticas del
  encabezado y en el panel de cuenta.
- **Posición guardada por pista**, no solo de la última. Puedes dejar la
  lección 3 a medias, escuchar la 7 y volver a la 3 donde ibas.
- Guardado en servidor agrupado con un `setTimeout` de 1,8 s que se reinicia
  en cada cambio. Cinco cambios seguidos son una sola petición.
- Pie de página con crédito.

### Cambiado
- El estado de progreso pasa a la clave `tagalog-progress-v1`, con un
  formato unificado (`done`, `positions`, `totalSeconds`, `lastPlayed`).
- `normalizeProgressState()` valida todo lo que entra, venga del servidor o
  de `localStorage`. Ids que ya no existen se descartan, números
  malformados pasan a cero.

### Compatibilidad
- Las claves antiguas `tagalog-done` y `tagalog-current` se siguen leyendo
  como respaldo. Nadie perdió progreso al desplegar.
- Un fallo de red o un token caducado cierra la sesión en silencio y la app
  sigue funcionando con `localStorage`. La sincronización nunca rompe la app.

---

## [20260622-38] — 2026-06-22

Primera versión completa. Construida en una sola sesión de unas diez horas.

### Pipeline de datos
- **`transcribe_tagalog.py`** — trocea con ffmpeg a 8 minutos (mono, 16 kHz,
  48 kbps) para esquivar el límite de 25 MB de la API, transcribe con
  Whisper y recompone los timestamps sumando el desplazamiento de cada
  trozo. Prompt de contexto para que **no traduzca** el Tagalog al inglés.
  Marca las transcripciones parciales para que no contaminen los datos.
- **`enrich_transcripts.py`** — añade a cada segmento idioma, tipo,
  traducción al español y nota gramatical. Genera además una guía de estudio
  por lección (resumen, temas y diálogo en dos columnas). Tres capas de
  defensa contra el desalineado de segmentos: prompt explícito, verificación
  del recuento con reintentos, y división recursiva del lote como último
  recurso.
- **`build_dictionary.py`** — 2.548 entradas cruzadas de las 50 pistas, sin
  usar API. Separa Tagalog de inglés con heurísticas apiladas: listas de
  vocabulario, prefijos de instrucción del narrador, regex de nombres
  propios y regla especial para palabras de 3 letras o menos. Deduplica por
  clave canónica, acumula hasta 3 traducciones y guarda hasta 6 referencias
  con timestamp por entrada.
- Caché en disco en cuatro niveles. Una caída a mitad no cuesta ni una
  llamada repetida.

### Aplicación
- Reproductor con barra fija, play/pausa, anterior/siguiente, velocidad de
  0.75x a 1.5x y barra de progreso arrastrable.
- **Integración con MediaSession**: metadatos y controles en la pantalla de
  bloqueo, en CarPlay y en Android Auto. Es lo que hace la app usable en el
  coche.
- **Transcripción sincronizada** que resalta sola la frase que suena y hace
  scroll para seguirla. Los segmentos se estiran hasta el siguiente para que
  no haya huecos en los silencios.
- **Saltar tocando el texto**: pulsar una frase lleva el audio a ese segundo.
  Accesible también por teclado.
- El scroll automático se apaga con el ratón sobre el panel, para no pelearse
  con quien está leyendo hacia atrás.
- **Guía de estudio** por lección con resumen, píldoras de temas y diálogo
  en dos columnas (Tagalog / Español), con opción de ocultar el español.
- **Diccionario** buscable en modal, agrupado en palabras, frases clave y
  frases largas, con la lección y el minuto donde aparece cada entrada.
- Marcar lecciones como hechas, con contador.
- Buscador y filtros: todo, lecciones, lecturas, pendientes.
- Carga perezosa: `index.json` (32 KB) al arrancar; las transcripciones
  (50–100 KB) solo al abrir esa lección; el diccionario (1,4 MB) solo al
  pulsar el botón.
- Progreso, velocidad y preferencias en `localStorage`.

### Diseño
- Sistema de color basado en la bandera de Filipinas (`#0038a8`, `#ce1126`,
  `#fcd116`) sobre variables CSS.
- Bandera del encabezado **dibujada con CSS puro**: triángulo, sol y tres
  estrellas, sin imágenes.
- Iconos SVG en línea. Cero peticiones extra, cero librería de iconos.
- Dos breakpoints (761px), diseño móvil primero.
- Accesibilidad: `aria-label` en botones de icono, `aria-live` en listas,
  segmentos navegables por teclado, Escape cierra modales, `role="dialog"`.
- Favicon SVG de 582 bytes e imagen social 1200×630.

### Infraestructura
- `.htaccess` con `Options -Indexes` (para que no se pueda listar y
  descargar la carpeta de audio) y cabecera `X-Robots-Tag: noindex, nofollow,
  noarchive`, que también cubre los MP3 y los JSON.
- Cache busting por query param en los tres puntos: CSS, JS y `assetVersion`.
- Symlink de audio en vez de copiar 1,3 GB.
- Revisión visual automatizada con navegador durante el desarrollo.

### Cifras
- 50 pistas (30 lecciones + 20 lecturas), ~1,3 GB de audio
- 299.480 caracteres transcritos
- 11.781 segmentos con marca de tiempo
- 2.548 entradas de diccionario
- ~5.900 líneas de código, 0 dependencias
