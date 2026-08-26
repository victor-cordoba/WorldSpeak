# 01 · Arquitectura

## LA IDEA EN UNA FRASE

Convertir una carpeta de MP3 de un curso de idiomas en una web donde puedes
**leer lo que estás escuchando**, en el idioma original y traducido.

## EL PROBLEMA QUE RESUELVE

Los cursos de idiomas en audio funcionan muy bien para el oído, pero tienen
un agujero: no ves el texto. Cuando el hablante dice algo rápido y no lo
pillas, no hay forma de mirarlo. Y cuando quieres repasar "aquella frase de
la lección 12", tienes que rebuscar a ciegas por el audio.

Este proyecto le pone texto al audio. Y como el texto lleva marcas de
tiempo, el texto también se convierte en el índice: tocas una frase y saltas
a ese segundo.

## LAS DOS MITADES

El sistema tiene dos partes que se tocan poco.

```
  ┌─── OFFLINE (se ejecuta una vez, en tu Mac) ───────────────────┐
  │                                                               │
  │   audio/*.mp3                                                 │
  │       │                                                       │
  │       │  transcribe_tagalog.py    [Whisper API]              │
  │       ▼                                                       │
  │   transcripts/raw/*.json          texto + timestamps          │
  │       │                                                       │
  │       │  enrich_transcripts.py    [GPT-4o-mini]               │
  │       ▼                                                       │
  │   transcripts/enriched/*.json     + idioma, ES, notas, guía   │
  │       │                                                       │
  │       │  build_dictionary.py      [sin API, heurísticas]      │
  │       ▼                                                       │
  │   transcripts/dictionary.json     2.548 entradas cruzadas     │
  │                                                               │
  └───────────────────────────┬───────────────────────────────────┘
                              │  rsync
  ┌───────────────────────────▼───────────────────────────────────┐
  │                                                               │
  │   ONLINE (servidor Apache + PHP)                              │
  │                                                               │
  │   index.html ── app.js ── styles.css                          │
  │        │           │                                          │
  │        │           ├── fetch() ──> transcripts/*.json         │
  │        │           │               (estáticos, cacheados)     │
  │        │           │                                          │
  │        │           └── POST ─────> api.php                    │
  │        │                           (cuentas + progreso)       │
  │        ▼                                                      │
  │   <audio> ──> audio/*.mp3  (servidos por Apache con Range)    │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘
```

**El pipeline offline es caro y lento** (llamadas a la API, unas 4 horas para
las 50 pistas). Se ejecuta una vez y su salida son archivos JSON estáticos.

**La web es tonta y rápida.** No calcula nada, solo lee JSON y los pinta.
Por eso puede vivir en un hosting compartido barato sin sudar.

## POR QUÉ ESTÁ HECHO ASÍ

### Cero dependencias en el frontend

No hay React, ni Vue, ni Vite, ni `npm install`. Es un `index.html`, un
`app.js` y un `styles.css`.

La razón no es purismo. Es que la app hace tres cosas: reproducir audio,
pintar listas y guardar progreso. Un framework no aporta nada ahí y añade un
paso de build, un `node_modules`, y un montón de superficie que se rompe
sola con el tiempo. Este proyecto tiene que seguir funcionando dentro de tres
años sin tocarlo.

**Consecuencia práctica: desplegar es copiar archivos.** Nada más.

### JSON estáticos en vez de base de datos

Las transcripciones no cambian nunca una vez generadas. Meterlas en una base
de datos sería añadir una pieza que se puede caer a cambio de nada. Se
sirven como archivos, Apache los cachea, y listo.

La única cosa que sí cambia es el progreso del usuario, y eso sí necesita
servidor. Por eso `api.php` existe y es lo único dinámico de todo el sistema.

### Carga perezosa de las transcripciones

`transcripts/index.json` pesa 32 KB y lleva el resumen y los temas de las 50
lecciones. Se carga al arrancar y con eso ya se pinta toda la lista.

Los archivos `enriched/*.json` pesan entre 50 y 100 KB cada uno. **Solo se
descargan cuando abres esa lección concreta**, y se quedan en un `Map` en
memoria para no volver a pedirlos. Cargar los 50 de golpe serían 2,7 MB
inútiles.

El diccionario (1,4 MB) tampoco se carga al arrancar: espera a que pulses el
botón de diccionario.

### El audio no pasa por PHP

Los MP3 los sirve Apache directamente. Eso da soporte de `Range` requests
gratis, que es lo que permite arrastrar la barra de progreso sin descargar
el archivo entero. Si lo sirviera un script PHP habría que implementarlo a
mano y funcionaría peor.

## FLUJO DE UNA SESIÓN DE ESTUDIO

1. Abres la web. `app.js` construye la lista de 50 pistas **en el propio
   código** (bucle de 1 a 30 para lecciones, de 1 a 20 para lecturas: no hay
   fetch para eso) y pide `index.json` para los resúmenes.
2. Lee `localStorage` y restaura dónde te quedaste. Si tienes cuenta, pide
   `me` a la API y **fusiona** lo local con lo remoto.
3. Pulsas Continuar. Se carga el MP3 y salta al segundo guardado.
4. Pulsas "Leer texto". Ahora sí se descarga el `enriched/*.json` de esa
   lección y se pinta la transcripción.
5. Mientras suena, el evento `timeupdate` busca qué segmento corresponde al
   segundo actual y lo resalta.
6. Cada pocos segundos se acumula tiempo escuchado y se guarda en local. Si
   hay cuenta, un `setTimeout` de 1,8 s agrupa los guardados y manda uno solo
   al servidor.

## SIGUIENTES DOCUMENTOS

- **[02 · Pipeline de datos](02-pipeline-datos.md)** — cómo se generan los JSON
- **[03 · Frontend](03-frontend.md)** — cómo funciona `app.js` por dentro
- **[04 · Backend y API](04-backend-api.md)** — cuentas, PIN y fusión de progreso
