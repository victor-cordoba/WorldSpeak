# 03 · Frontend

Tres archivos, cero dependencias, cero build.

| Archivo | Líneas | Qué contiene |
|---|---|---|
| `index.html` | 266 | Estructura y meta tags. Todo el HTML está aquí, `app.js` no crea secciones nuevas |
| `app.js` | 1.928 | Todo el comportamiento |
| `styles.css` | 2.639 | Sistema de diseño completo |

---

## LA LISTA DE PISTAS NO SE DESCARGA

Lo primero que hace `app.js` es construir las 50 pistas **en código**:

```javascript
for (let lesson = 1; lesson <= 30; lesson += 1) {
  const num = String(lesson).padStart(2, '0');
  tracks.push({ id: `lesson-${num}-main`, lesson, kind: 'main',
                title: `Lección ${num}`, file: `Lesson ${num} Main.mp3` });
}
for (let reading = 1; reading <= 20; reading += 1) {
  const pairedLesson = reading + 10;   // la lectura 01 va después de la lección 11
  ...
}
```

No hay fetch para esto. Los nombres de archivo son deterministas, así que la
lista existe antes de que la red conteste.

El emparejamiento `reading + 10` refleja cómo está estructurado el curso: las
lecturas empiezan a tener sentido a partir de la lección 11.

Aparte hay un objeto `trackCopy` con **título y subtítulo escritos a mano**
para las 50 pistas. "Lección 07" se muestra como "Plan para comer · Elegir
dónde comer y qué quieres beber". Eso no lo generó ninguna IA: se escribió a
mano para que la lista sea escaneable de un vistazo.

---

## ESTADO

Todo el estado son variables de módulo. No hay store, no hay observables.

```javascript
let progressState  = loadProgressState();     // progreso completo
let accountSession = loadAccountSession();    // { token, user } o null
let currentId      = progressState.currentId; // pista seleccionada
let filter         = 'all';
const done         = new Set(...);            // ids de lecciones marcadas
const transcriptCache = new Map();            // enriched JSON ya descargados
let transcriptIndex   = new Map();            // index.json indexado por id
```

### Claves de `localStorage`

| Clave | Contenido |
|---|---|
| `tagalog-progress-v1` | Estado completo: `done`, `positions`, `totalSeconds`, `lastPlayed` |
| `tagalog-account-session-v1` | `{ token, user }` de la sesión |
| `tagalog-current` | Pista actual (legado, se mantiene por compatibilidad) |
| `tagalog-done` | Lecciones hechas (legado) |
| `tagalog-speed` | Velocidad de reproducción |
| `tagalog-show-translations` | Si se ve la traducción al español |

Las dos claves de legado se leen como respaldo si `tagalog-progress-v1` está
vacía. Es lo que permitió meter el sistema de cuentas en julio sin que nadie
perdiera el progreso que ya tenía guardado.

---

## LA PARTE INTERESANTE: SINCRONIZAR LA TRANSCRIPCIÓN

`updateCurrentSegment()` se llama en cada `timeupdate` del `<audio>` (unas 4
veces por segundo) y decide qué frase está sonando.

### El problema de los huecos

Los segmentos de Whisper no son continuos. Entre el final de uno y el
principio del siguiente puede haber un hueco de silencio. Si te limitas a
`now >= start && now < end`, durante esos huecos **no hay nada resaltado** y
el panel parpadea.

La solución es estirar cada segmento hasta donde empieza el siguiente:

```javascript
const nextStart = Number(segments[index + 1]?.dataset.start);
let end = Number.isFinite(rawEnd) ? rawEnd : NaN;

if (Number.isFinite(nextStart)) {
  end = Number.isFinite(end) ? Math.max(end, nextStart) : nextStart;
} else if (!Number.isFinite(end)) {
  end = Number.isFinite(durationEnd) ? durationEnd : start + 4;
}
```

Tres casos cubiertos: hay siguiente segmento (estira hasta él), es el último
y sabemos la duración (estira hasta el final del audio), es el último y no
sabemos la duración (asume 4 segundos). Nunca hay hueco.

### No pelearse con el usuario

El panel hace scroll automático para seguir la frase activa. Pero si estás
leyendo hacia atrás con el ratón encima, ese scroll es insufrible:

```javascript
if (active && !transcriptList.matches(':hover')) {
  active.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
```

Con el ratón sobre el panel, el scroll automático se apaga. Detalle pequeño,
diferencia enorme al usar.

### Saltar tocando el texto

Cada segmento renderizado lleva `data-start` y es clicable (y accesible por
teclado con Enter y Espacio). Al pulsarlo:

```javascript
player.currentTime = Number(item.dataset.start);
```

Esto convierte la transcripción en el índice del audio. Es probablemente la
funcionalidad más útil de toda la app.

---

## CARGA DE TRANSCRIPCIONES

```javascript
async function renderTranscript(track) {
  if (transcriptCache.has(track.id)) { /* pinta desde memoria */ }
  const response = await fetch(`${entry.enriched}?v=${assetVersion}`, { cache: 'no-store' });
  ...
}
```

`cache: 'no-store'` + `?v=` puede parecer redundante. No lo es: `no-store`
evita que el navegador sirva una copia rancia durante la sesión, y el `?v=`
garantiza que tras un despliegue se pida la URL nueva. Con hosting compartido
y cabeceras de caché que no controlas del todo, cinturón y tirantes.

El `Map` de caché evita volver a pedir la misma lección al abrir y cerrar el
panel varias veces.

---

## MEDIASESSION: EL DETALLE QUE HACE QUE SE USE

`updateMediaSession(track)` registra los metadatos y los manejadores de
`play`, `pause`, `previoustrack` y `nexttrack`.

Esto es lo que hace que la app sea usable de verdad en el escenario para el
que se hizo: **en el coche**. Con el móvil en el bolsillo y la pantalla
apagada, la lección sale en la pantalla de bloqueo, en el CarPlay o en el
Android Auto, y los botones del volante funcionan.

Sin esto, tendrías que sacar el móvil y desbloquearlo para pasar de lección.

---

## MEDICIÓN DEL TIEMPO ESCUCHADO

```javascript
const delta = Math.min(5, Math.max(0, (now - lastListeningTick) / 1000));
if (delta > 0.1) progressState.totalSeconds += delta;
```

El `Math.min(5, ...)` es una salvaguarda. Si dejas la pestaña en segundo
plano, el navegador estrangula los timers y el siguiente tick puede llegar
minutos después. Sin el tope, la app te contaría dos horas de estudio por
haber dejado una pestaña abierta.

---

## AGRUPADO DE VELOCIDAD DE GUARDADO

Guardar en `localStorage` es instantáneo, así que se hace en cada cambio.
Guardar en el servidor no, así que se agrupa:

```javascript
function scheduleServerSave() {
  if (!accountSession?.token) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    accountRequest('save', { progress: progressState }).catch(() => {});
  }, 1800);
}
```

Cada llamada reinicia el temporizador. Cinco cambios seguidos son **una sola**
petición 1,8 segundos después del último.

El `.catch(() => {})` es deliberado: si el servidor no responde, no pasa
nada. El progreso ya está a salvo en local y se subirá en el siguiente
guardado. La app nunca se rompe por un fallo de red.

---

## DISEÑO

### Los colores son la bandera de Filipinas

```css
:root {
  --blue: #0038a8;    /* azul de la bandera */
  --red:  #ce1126;    /* rojo de la bandera */
  --gold: #fcd116;    /* amarillo del sol */
  --bg:   #f5f7fb;
  --ink:  #20242c;
  --muted:#707987;
}
```

No es decoración arbitraria: es lo que hace que la app se reconozca de un
vistazo y le da personalidad sin necesidad de ilustraciones ni fotos.

La bandera del encabezado está **dibujada con CSS puro** — el triángulo, el
sol y las tres estrellas son `<span>` posicionados. Cero imágenes, cero
peticiones.

### Solo dos breakpoints

```css
@media (min-width: 761px) { ... }
@media (max-width: 760px) { ... }
```

Escritorio y móvil. Nada más. La rejilla de lecciones pasa de dos columnas a
una y el reproductor se compacta.

### El reproductor es una barra fija

Vive fijo abajo y siempre está a la vista. Como su altura cambia (según haya
subtítulo o no), se mide en JavaScript y se publica como variable CSS:

```javascript
document.documentElement.style.setProperty('--player-stack-offset', `${height}px`);
```

Así el contenido reserva exactamente el espacio que hace falta y nunca queda
una lección tapada por la barra.

### Accesibilidad

- `aria-label` en todos los botones de icono
- `aria-live="polite"` en la lista de lecciones y en el diccionario
- Segmentos de transcripción navegables con teclado (Enter / Espacio)
- Escape cierra modales
- `.sr-only` para etiquetas que solo leen los lectores de pantalla
- Los modales llevan `role="dialog"` y `aria-modal="true"`

---

## LOS ICONOS SON SVG EN LÍNEA

```javascript
const icons = { play: '<svg ...>', pause: '...', check: '...', ... };
```

Un objeto con las cadenas SVG, inyectadas con `innerHTML` donde hacen falta.
Sin librería de iconos, sin fuente de iconos, sin peticiones extra. Los
únicos archivos que se descargan aparte del HTML/CSS/JS son el favicon y los
MP3.
