# 07 · Roadmap

Mejoras pendientes, ordenadas por lo que más aporta con menos esfuerzo.
Nada de esto está hecho.

---

## PRIMERO DE TODO: RECUPERAR `api.php`

**No es una mejora, es una deuda urgente.**

`api.php` existe únicamente en el servidor de producción. No hay copia en
local ni en el repositorio. Si el hosting se cae o alguien borra el archivo,
el sistema de cuentas desaparece y hay que reescribirlo desde el contrato.

El acceso SSH está caído. Para arreglarlo:

```bash
ssh-copy-id -i ~/.ssh/misioncebu_dinahosting.pub DINAHOSTING_mision_cebu
scp DINAHOSTING_mision_cebu:~/www/tagalog/api.php ./api.php
```

Luego revisar que no lleve credenciales dentro antes de commitear, y
comprobar dónde guarda los datos de usuario y si esa ruta es accesible desde
el navegador.

---

## MUCHO VALOR, POCO ESFUERZO

### 1 · PWA: instalable y sin conexión

**El problema:** la app está pensada para el bus y el metro. Justo donde no
hay cobertura. Ahora mismo, sin red no funciona nada.

Hace falta un `manifest.webmanifest` y un service worker. Comprobado: **ahora
mismo no existe ninguno de los dos** (ambos dan 404).

Con eso se consigue:
- Icono en la pantalla de inicio, se abre a pantalla completa sin barra del navegador
- HTML, CSS, JS y JSON cacheados: la app arranca sin red
- Descargar lecciones concretas para escucharlas sin cobertura

La descarga de audio es lo que más cambia el uso real. Un MP3 de lección son
unos 27 MB; con la Cache API se puede guardar bajo demanda con un botón de
descarga por lección.

**Ojo con el cacheo y el `assetVersion`:** el service worker tiene que
invalidar caché al cambiar de versión o los despliegues dejarán de llegar a
los usuarios.

### 2 · Atajos de teclado

Espacio para play/pausa, flechas para retroceder y avanzar 10 segundos.
Ahora mismo Escape cierra modales y poco más. En escritorio, retroceder 10
segundos para volver a oír una frase es el gesto más repetido y requiere
ratón.

### 3 · Botón de repetir frase

En la transcripción, un botón por segmento que reproduzca **solo esa frase**
y pare. Es exactamente lo que haces al estudiar: oír una frase tres veces
seguidas. Ahora hay que ir tocando el texto y parar a mano.

Los datos ya están: cada segmento tiene `start` y `end`.

### 4 · Copiar entrada del diccionario

Un botón de copiar en cada tarjeta, para pegar en las notas del móvil o en
una app de tarjetas de memoria.

---

## VALOR MEDIO

### 5 · Repaso espaciado

Marcar entradas del diccionario como "difíciles" y una vista de repaso que
las saque con la frecuencia adecuada. Es lo que convierte la app de
reproductor a herramienta de estudio de verdad.

Requiere decidir dónde vive ese estado: `localStorage` es lo simple, pero
entonces no se sincroniza entre dispositivos. Lo suyo sería meterlo en
`progressState` y que viaje con la cuenta.

### 6 · Buscar dentro de las transcripciones

Ahora el buscador de lecciones busca por título y tema, no por contenido.
Buscar "magkano" y que salgan todas las lecciones donde aparece, con su
minuto exacto.

Se puede hacer sin servidor construyendo un índice invertido en el pipeline
y sirviéndolo como un JSON más.

### 7 · Revisar el diccionario a mano

2.548 entradas generadas automáticamente. Habrá traducciones flojas y algo de
ruido inglés que se coló pese a los filtros.

Un modo de revisión que permita corregir una entrada y guardar el cambio en
un archivo de correcciones que `build_dictionary.py` aplique al regenerar.
Así las correcciones sobreviven a la regeneración.

### 8 · Notas gramaticales visibles

`enrich_transcripts.py` genera un `note_es` por segmento con explicaciones de
gramática y uso. **La interfaz no las muestra.** Es contenido ya pagado y
generado que está durmiendo en los JSON.

Un desplegable por segmento, o un icono que las revele.

---

## MENOR PRIORIDAD

### 9 · Modo oscuro

`styles.css` declara `color-scheme: light` y todo el sistema de color ya está
en variables CSS. Añadir un bloque `@media (prefers-color-scheme: dark)` que
redefina los tokens es directo. Para estudiar de noche en el bus en invierno
tiene sentido.

### 10 · Exportar progreso

Un botón que descargue el `progressState` como JSON. Copia de seguridad
manual, y la única salida si el servidor se cae.

### 11 · Limitar intentos de PIN

Un PIN de 4 dígitos son 10.000 combinaciones. Sin límite de intentos se
rompe en minutos. Lo que protege es trivial, pero es barato de arreglar:
contador por nombre e IP en `api.php`.

### 12 · Más cursos

La arquitectura no depende del curso concreto: todo sale de `audio/` y de la
lista de pistas en `app.js`. Soportar varios cursos significaría mover la
lista de pistas a un JSON y añadir un selector.

Es un cambio de un par de horas y es lo que convertiría esto en una
herramienta genérica en vez de una app de un curso concreto.

---

## NO HACER

- **Meter un framework.** Ver [01 · Arquitectura](01-arquitectura.md). La app
  hace tres cosas y ninguna necesita React.
- **Meter una base de datos para las transcripciones.** No cambian nunca.
- **Publicar las transcripciones.** El código es MIT, el contenido no es
  nuestro.
- **Quitar el `noindex`.** Está ahí por el copyright del material fuente.
