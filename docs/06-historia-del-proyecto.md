# 06 · Historia del proyecto

Cómo se construyó esto, qué decisiones se tomaron y por qué. Reconstruido a
partir de las marcas de tiempo de los archivos generados, que dejan un rastro
bastante exacto de la sesión.

---

## EL PUNTO DE PARTIDA

Víctor estaba estudiando Tagalog con un curso en audio para un proyecto en
Filipinas (Misión Cebú, Tondo). El curso funciona, pero tiene el problema
clásico del audio: **no ves lo que oyes**.

Cuando el hablante suelta una frase rápida y no la pillas, no hay adónde
mirar. Y para volver a "aquello que dijeron sobre pedir indicaciones" hay que
rebuscar a ciegas por media hora de MP3.

De ahí la idea: ponerle texto al audio y que el texto sirva de índice.

---

## 22 DE JUNIO DE 2026 — TODO EN UN DÍA

El grueso del proyecto se construyó en una sola sesión de unas diez horas.

### 12:13 · Preparar el terreno

Se monta la carpeta web y se enlaza la carpeta de MP3 con un symlink en vez
de copiarlos. 1,3 GB duplicados en iCloud no tenían sentido.

### 14:03 · La primera prueba, deliberadamente pequeña

Primer troceado con ffmpeg y primera transcripción: **solo la lección 01**.

Esto no fue casualidad. Transcribir 50 pistas cuesta dinero y tarda. Antes de
lanzarlo entero había que confirmar tres cosas: que ffmpeg trocea bien, que
Whisper no traduce el Tagalog al inglés, y que los timestamps se recomponen
correctamente al pegar los trozos.

De aquí salió el prompt anti-traducción:

> "This is a Tagalog language lesson with English explanations and Tagalog
> practice phrases. Transcribe exactly in the original languages. Do not
> translate."

Sin esa línea, Whisper "arreglaba" el audio traduciendo las frases tagalas al
inglés. Justo lo contrario de lo que hacía falta.

### 14:11 – 14:34 · El problema del recuento de segmentos

Primer enriquecimiento, otra vez solo la lección 01, en cinco lotes. Y aquí
apareció el bug más serio de todo el proyecto.

Le pides al modelo 30 segmentos enriquecidos y a veces devuelve 29, porque ha
decidido que dos frases cortas eran una sola. Los timestamps se desplazan y
**la transcripción deja de estar sincronizada con el audio, en silencio**.
No hay error, no hay excepción. Simplemente la app resalta la frase
equivocada y no sabes por qué.

La solución quedó en tres capas:

1. Prompt explícito hasta ser pesado ("no merge, no split, same order").
2. Verificar el recuento y reintentar hasta tres veces.
3. Si sigue fallando, **partir el lote por la mitad y recurrir** hasta llegar
   a un segmento suelto, que se devuelve sin enriquecer pero con sus tiempos
   intactos.

Es la parte de código más defensiva del proyecto y está justificada: es lo
único que garantiza que la funcionalidad central no se rompa nunca.

### 14:44 – 15:12 · Las 50 pistas, en 28 minutos

Con la lección 01 validada, se lanza todo. Los `raw/*.json` aparecen a razón
de uno cada 20–30 segundos.

La velocidad viene del troceado a 8 minutos, mono, 16 kHz y 48 kbps: cada
trozo pesa 2,8 MB en vez de 22 MB, así que la subida es lo que deja de ser
el cuello de botella.

### 15:13 – 18:22 · Tres horas de enriquecimiento

El paso caro. Unos 400 lotes más 50 guías de estudio.

Aquí es donde el caché por lote se ganó el sueldo: la ejecución se cortó
varias veces y cada relanzamiento retomaba exactamente donde iba, sin volver
a pagar ni una llamada ya hecha.

### 16:43 – 19:32 · Revisión visual con navegador automatizado

En paralelo al enriquecimiento, se revisa la interfaz de forma automatizada.
Quedan los registros de consola y las instantáneas de accesibilidad de cinco
pasadas. Es lo que fue puliendo los detalles: la barra fija del reproductor,
el desplazamiento automático de la transcripción, el comportamiento en móvil.

### 18:23 · El índice

`index.json`: 32 KB con el resumen y los temas de las 50 lecciones. Es lo que
permite pintar la lista entera sin descargar 2,7 MB de transcripciones.

### 18:44 · Favicon

Un SVG de 582 bytes. Como toda la identidad visual, dibujado, no fotografiado.

### 19:22 · El diccionario, y la pelea con el ruido

`build_dictionary.py` genera 2.548 entradas. Sin llamadas a API: puro Python.

El problema real no era extraer las frases, era **separar el Tagalog del
inglés**. Un curso de idiomas es mitad explicaciones en inglés. Sin filtrar,
el diccionario se llenaba de entradas como "Listen and repeat → Escucha y
repite". Inútil.

Se probó a resolverlo con IA y no compensaba: 2.500 llamadas más para
clasificar frases de tres palabras. Al final ganaron las heurísticas
apiladas: listas de palabras tagalas frecuentes, listas de ruido inglés,
prefijos de instrucción del narrador, regex de nombres propios de los
personajes, y una regla especial para palabras de tres letras o menos.

No es elegante. Funciona, es instantáneo y es gratis, así que el diccionario
se puede regenerar todas las veces que haga falta mientras se afinan los
filtros. Con IA, cada iteración habría costado dinero.

### 20:41 – 22:21 · Acabado

Imagen social 1200×630 para cuando se comparte el enlace, y los últimos
retoques de `styles.css` e `index.html`. La sesión cierra a las 22:21.

Resultado del día: **app completa y desplegada**, versión `20260622-38`.

---

## 1 DE JULIO DE 2026 — LAS CUENTAS

Segunda tanda de trabajo, con un problema concreto detectado al usar la app
de verdad.

El progreso vivía en `localStorage`, que está atado a un navegador. Estudiar
en el móvil de camino al trabajo y luego querer repasar en el ordenador
significaba empezar de cero.

### La decisión: nombre + PIN, nada más

Sin email, sin contraseña, sin verificación, sin registro. Nombre, cuatro
números y dentro. Si el nombre no existe, la cuenta se crea sola: es el mismo
botón, **"Entrar / crear"**.

Es un modelo de seguridad flojo y es la elección correcta. Lo único que
protege son los minutos escuchados de un curso de Tagalog. Pedir email y
verificación para eso sería añadir fricción a cambio de nada.

El teclado numérico se dibujó **dentro de la página** en vez de usar el del
sistema. En el móvil, esa es la diferencia entre meter el PIN de un vistazo y
pelearte con el teclado emergente.

### El problema de verdad: fusionar sin perder nada

Lo fácil habría sido que al entrar el servidor pisara lo local. Y eso te hace
perder progreso: escuchas tres lecciones en el móvil sin conexión, abres el
ordenador, y desaparecen.

`mergeProgress()` combina campo por campo, con una estrategia distinta para
cada uno según su significado:

- **Lecciones hechas** → unión. Marcarlas es intencional, nunca se desmarcan.
- **Tiempo escuchado** → el máximo. Es acumulativo, no puede bajar.
- **Posición de cada pista** → la marca de tiempo más reciente gana.

Y después de fusionar, el resultado **se sube inmediatamente**. Así el
servidor pasa a tener la versión combinada y el siguiente dispositivo que
entre ya recibe todo.

### Retrocompatibilidad

Las claves viejas de `localStorage` (`tagalog-done`, `tagalog-current`) se
siguen leyendo como respaldo. Nadie perdió el progreso que ya tenía al
desplegar el cambio.

Versión `20260701-4`.

---

## AGOSTO DE 2026 — ORDENAR Y ABRIR

La carpeta había crecido sin orden: una copia de seguridad con fecha en el
nombre, 332 MB de MP3 troceados que ya no servían para nada, un symlink de
audio roto apuntando a una carpeta que ya no existía, y cero documentación.

Se reorganizó todo, se escribió esta documentación, y el código se publicó
como open source en GitHub.

**Lo que se descubrió al ordenar:** la copia de seguridad local
(`20260622-38`) era **más vieja que producción** (`20260701-4`). Todo el
sistema de cuentas existía solo en el servidor. El repositorio se montó
descargando la versión de producción, no la copia local.

Es exactamente el motivo por el que este proyecto necesitaba estar en git.

---

## DECISIONES QUE SE MANTIENEN

**Cero dependencias.** No hay React, ni build, ni `node_modules`. La app hace
tres cosas: reproducir audio, pintar listas, guardar progreso. Un framework
no aporta nada ahí y añade una superficie que se rompe sola con el tiempo.
Esto tiene que seguir funcionando dentro de tres años sin tocarlo.

**JSON estáticos en vez de base de datos.** Las transcripciones no cambian
nunca. Una base de datos sería una pieza más que se puede caer, a cambio de
nada.

**El pipeline cachea a cada paso.** Porque una caída a mitad no puede
costarte tres horas y otra tanda de llamadas a la API.

**El contenido no se publica.** El código es MIT y está en GitHub. El audio y
las transcripciones no, y la instalación va con `noindex, nofollow,
noarchive`.

---

## CALLEJONES SIN SALIDA

**Transcribir la pista entera de una vez.** Choca con el límite de 25 MB de
la API. De ahí el troceado a 8 minutos.

**Confiar en que el modelo devuelve los segmentos que le pides.** No lo hace
siempre. De ahí las tres capas de defensa.

**Clasificar el vocabulario con IA.** Se probó y no compensaba: 2.500
llamadas para clasificar frases de tres palabras, y cada iteración de los
filtros costaba dinero. Las heurísticas son feas pero instantáneas y gratis.

**Guardar en el servidor en cada cambio.** Demasiadas peticiones. Se agrupan
con un `setTimeout` de 1,8 segundos que se reinicia en cada cambio.

**Fiarse del reloj para contar el tiempo escuchado.** Con la pestaña en
segundo plano, el navegador estrangula los timers y el siguiente tick llega
minutos después. Sin el tope de `Math.min(5, ...)`, la app te contaba dos
horas de estudio por dejar una pestaña abierta.
