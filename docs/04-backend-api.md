# 04 · Backend y API

Todo el backend es **un archivo**: `api.php`. Es lo único dinámico del
sistema. Todo lo demás son archivos estáticos.

> **Nota (26/08/2026):** este documento describe la **v1** (`web/api/legacy-api-v1.php`,
> recuperada del servidor). La v2 multi-curso está en `web/api/index.php` y se
> documenta en [08 · WorldSpeak](08-worldspeak.md). El modelo de PIN y la fusión
> de progreso siguen siendo exactamente estos.

---

## POR QUÉ HAY CUENTAS

La app funciona perfectamente sin cuenta: todo el progreso vive en
`localStorage`. Pero `localStorage` está atado a un navegador y a un
dispositivo. Si estudias en el móvil de camino al trabajo y luego quieres
repasar en el ordenador, empiezas de cero.

Las cuentas resuelven **solo** eso. No hay perfiles, ni social, ni nada más.

## LA DECISIÓN: NOMBRE + PIN

Sin email. Sin contraseña. Sin verificación. Sin registro.

Escribes tu nombre, eliges 4 números y ya estás dentro. Si el nombre no
existe, se crea la cuenta en ese momento. Es literalmente el mismo botón:
**"Entrar / crear"**.

El teclado numérico está **dibujado en la propia página**, no se usa el
teclado del sistema. En el móvil eso es la diferencia entre meter el PIN de
un vistazo y pelearte con el teclado emergente.

**Es deliberadamente débil y está bien que lo sea.** Lo único que protege son
los minutos escuchados de un curso de Tagalog. Pedir email, verificación y
contraseña fuerte para eso sería añadir fricción a cambio de proteger algo
sin valor. El coste de que alguien adivine tu PIN es que ve tu progreso.

**Lo que esto implica y hay que tener claro:**
- Un PIN de 4 dígitos son 10.000 combinaciones. Es adivinable por fuerza
  bruta si el servidor no limita intentos.
- Si dos personas eligen el mismo nombre, la segunda no puede entrar (o entra
  en la cuenta de la primera si acierta el PIN).
- **Nunca metas nada personal en esta app.** No está diseñada para eso.

---

## CONTRATO DE LA API

Endpoint: `POST ./api.php`
Content-Type: `application/json`
Autenticación: `Authorization: Bearer <token>`

Todas las peticiones llevan la acción en el cuerpo:

```json
{ "action": "login", "name": "...", "pin": "...", "progress": { ... } }
```

Todas las respuestas llevan `ok`:

```json
{ "ok": true,  "token": "...", "user": {...}, "progress": {...} }
{ "ok": false, "error": "Mensaje en español." }
```

`app.js` trata cualquier `ok: false` o cualquier HTTP que no sea 2xx como
error y muestra `data.error` al usuario.

### Acciones

| Acción | Entrada | Salida | Qué hace |
|---|---|---|---|
| `login` | `name`, `pin`, `progress` | `token`, `user`, `progress` | Entra o crea la cuenta. Devuelve el progreso guardado en servidor |
| `me` | (token en cabecera) | `user`, `progress` | Valida el token y devuelve el progreso. Se llama al cargar la página |
| `save` | `progress` | `ok` | Guarda el estado de progreso |
| `logout` | (token en cabecera) | `ok` | Invalida el token |

Respuestas conocidas del servidor:
- `GET` → HTTP 405 `{"ok":false,"error":"Método no permitido."}`
- Acción desconocida → HTTP 400 `{"ok":false,"error":"Acción no reconocida."}`

---

## EL FORMATO DE PROGRESO

```json
{
  "done": ["lesson-01-main", "lesson-02-main"],
  "positions": {
    "lesson-03-main": {
      "currentTime": 412.5,
      "duration": 1802.1,
      "updatedAt": "2026-07-01T09:14:22.000Z"
    }
  },
  "lastPlayed": {
    "id": "lesson-03-main",
    "position": 412.5,
    "duration": 1802.1,
    "updatedAt": "2026-07-01T09:14:22.000Z"
  },
  "totalSeconds": 7245.3,
  "updatedAt": "2026-07-01T09:14:22.000Z"
}
```

`positions` guarda la posición de **cada** pista por separado, no solo de la
última. Puedes dejar la lección 3 por la mitad, escuchar la 7 entera y
volver a la 3 exactamente donde la dejaste.

### Todo lo que entra se normaliza

`normalizeProgressState()` no confía en nada de lo que llega, ni del servidor
ni de `localStorage`:

```javascript
state.done = Array.isArray(incoming.done) ? incoming.done.filter(Boolean) : [];
state.currentId = tracks.some((t) => t.id === incoming.currentId) ? incoming.currentId : state.currentId;
state.positions = Object.fromEntries(Object.entries(positions)
  .filter(([id]) => tracks.some((track) => track.id === id))    // ids que ya no existen, fuera
  .map(([id, item]) => [id, {
    currentTime: Math.max(0, Number(item.currentTime) || 0),     // números o cero
    ...
  }]));
```

Ids que ya no existen se descartan. Números malformados pasan a cero. Un JSON
corrupto en `localStorage` no rompe la app: se cae al estado por defecto.

Esto es también lo que permite cambiar el formato en el futuro sin romper las
sesiones viejas.

---

## LA PARTE QUE MÁS IMPORTA: LA FUSIÓN

El error fácil sería que al entrar el servidor pise lo local, o al revés.
Cualquiera de las dos cosas te hace perder progreso: escuchaste tres
lecciones en el móvil sin conexión, abres el ordenador, y desaparecen.

`mergeProgress(local, remote)` combina, campo por campo:

```javascript
// Lecciones hechas: unión. Si está hecha en cualquiera de los dos, está hecha.
merged.done = [...new Set([...a.done, ...b.done])];

// Tiempo escuchado: el mayor. Nunca baja.
merged.totalSeconds = Math.max(a.totalSeconds, b.totalSeconds);

// Posición de cada pista: gana la marca de tiempo más reciente.
ids.forEach((id) => {
  const leftTime  = Date.parse(left.updatedAt || 0);
  const rightTime = Date.parse(right.updatedAt || 0);
  merged.positions[id] = rightTime > leftTime ? right : left;
});
```

Tres estrategias distintas porque cada campo tiene semántica distinta:

| Campo | Estrategia | Por qué |
|---|---|---|
| `done` | Unión | Marcar una lección es intencional. Nunca se desmarca sola |
| `totalSeconds` | Máximo | Es acumulativo. No tiene sentido que baje |
| `positions` | Más reciente | Solo una puede ser la buena, y es la última |

**Resultado: nunca pierdes progreso por sincronizar.** En el peor caso, la
posición de una pista concreta se queda en la de otro dispositivo.

### El ciclo de sincronización

Tanto al entrar como al restaurar sesión, el patrón es el mismo:

```javascript
const data = await accountRequest('me');                          // 1. traer remoto
applyProgressState(mergeProgress(progressState, data.progress));  // 2. fusionar
await accountRequest('save', { progress: progressState });        // 3. devolver fusionado
```

Ese tercer paso es lo que hace que funcione de verdad. Después de fusionar,
**el resultado se sube inmediatamente**, así que el servidor pasa a tener la
versión combinada y el siguiente dispositivo que entre ya recibe todo.

### Si el token caduca

```javascript
} catch (_error) {
  saveAccountSession(null);
  setAccountStatus('', '');
}
```

Sesión fuera, sin mensaje de error, sin modal. La app sigue funcionando con
`localStorage` como si nunca hubieras entrado. La próxima vez que abras la
cuenta, entras otra vez y se refusiona todo. **Un fallo de sincronización
nunca es un fallo de la app.**

---

## SI HAY QUE REESCRIBIR `api.php`

Requisitos mínimos para que `app.js` funcione sin tocarlo:

1. Solo POST. Cualquier otro método, HTTP 405.
2. Cuerpo JSON con `action`. Acción desconocida, HTTP 400.
3. Respuesta siempre con `ok` booleano; los errores con `error` en español.
4. `login` crea la cuenta si el nombre no existe.
5. El PIN se guarda **hasheado** (`password_hash`), nunca en claro.
6. Los tokens son aleatorios (`random_bytes(32)`), no derivados del nombre.
7. El almacenamiento (JSON o SQLite) tiene que estar **fuera del directorio
   público**, o protegido con `.htaccess`. Ojo: `.gitignore` ya excluye
   `data/` y `users.json`, pero eso no impide que Apache los sirva.

Recomendable si se rehace: limitar intentos de PIN por nombre e IP. Un PIN de
4 dígitos sin límite de intentos se rompe en minutos.
