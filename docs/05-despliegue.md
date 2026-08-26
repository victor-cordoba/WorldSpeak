# 05 · Despliegue

> **Actualizado 26/08/2026:** el sitio ya no está en Dinahosting. Vive en el
> Hostinger personal (alias SSH `PERSONAL_SERVER`, `~/domains/victorcordoba.com/public_html/worldspeak/`)
> y se despliega con `scripts/deploy.sh`. Lo de Dinahosting de abajo queda como histórico.

No hay build. No hay CI. Desplegar es copiar archivos a un hosting compartido.

---

## EL SERVIDOR

| | |
|---|---|
| Proveedor | Dinahosting |
| Host | `hl1595.dinaserver.com` |
| Usuario | `misioncebu` |
| Alias SSH | `DINAHOSTING_mision_cebu` |
| URL | `https://misioncebu.org/tagalog/` |
| Stack | Apache + PHP |

El alias está en `~/.ssh/config`:

```
Host DINAHOSTING_mision_cebu
  HostName hl1595.dinaserver.com
  User misioncebu
  Port 22
  IdentityFile ~/.ssh/misioncebu_dinahosting
  IdentitiesOnly yes
```

> **Estado actual: el acceso SSH no funciona.** El servidor responde
> `Permission denied (publickey,password)` con esa clave. Hay que volver a
> autorizarla:
> ```bash
> ssh-copy-id -i ~/.ssh/misioncebu_dinahosting.pub DINAHOSTING_mision_cebu
> ```
> Pedirá la contraseña del panel de Dinahosting una vez. Mientras tanto, se
> puede desplegar por SFTP desde el panel.

---

## QUÉ SE SUBE Y QUÉ NO

```bash
rsync -avz --delete \
  --exclude '.git/' \
  --exclude '.DS_Store' \
  --exclude '__pycache__/' \
  --exclude 'docs/' \
  --exclude 'screenshots/' \
  --exclude 'transcripts/chunks/' \
  --exclude 'transcripts/enriched_batches/' \
  --exclude 'scripts/' \
  ./ DINAHOSTING_mision_cebu:~/www/tagalog/
```

| Se sube | Se queda fuera |
|---|---|
| `index.html`, `app.js`, `styles.css` | `transcripts/chunks/` (332 MB de MP3 troceados) |
| `api.php`, `.htaccess`, `favicon.svg` | `transcripts/enriched_batches/` (caché intermedio) |
| `transcripts/index.json` | `scripts/` (solo se ejecutan en local) |
| `transcripts/enriched/` | `docs/`, `screenshots/` |
| `transcripts/dictionary.json` | `.git/` |
| `transcripts/raw/` | |
| `audio/*.mp3` | |

`chunks/` y `enriched_batches/` son **caché del pipeline**, no datos que la
web necesite. Son la mayor parte del peso del proyecto y no pintan nada en
producción.

### Ojo con `--delete` y el audio

`--delete` borra en destino lo que no esté en origen. `audio/` es un symlink
local a la carpeta de MP3, así que **la primera vez** hay que subir el audio
aparte:

```bash
rsync -avz --progress "$HOME/Library/Mobile Documents/com~apple~CloudDocs/09 - ESTUDIOS/APP TAGALOG/AUDIOS/PIMSLEUR tagalog/" \
  DINAHOSTING_mision_cebu:~/www/tagalog/audio/
```

Son 1,3 GB. Se sube una vez y no se vuelve a tocar.

---

## LO QUE SIEMPRE SE OLVIDA: SUBIR LA VERSIÓN

Los archivos estáticos se cachean agresivamente. Si subes `app.js` sin
cambiar el número de versión, **los usuarios siguen viendo el viejo** y da la
sensación de que el despliegue no ha funcionado.

Hay que tocar **tres sitios**:

```html
<!-- index.html, línea ~24 -->
<link rel="stylesheet" href="./styles.css?v=20260701-4">

<!-- index.html, final del body -->
<script src="./app.js?v=20260701-4"></script>
```

```javascript
// app.js, línea 2
const assetVersion = '20260701-4';
```

El tercero, `assetVersion`, es el que cachebustea los JSON de `transcripts/`.
Si cambias el diccionario o una transcripción y no lo subes, nadie ve el
cambio.

Formato: `AAAAMMDD-N`, donde `N` sube con cada despliegue del mismo día.

```bash
# atajo para subir a la versión de hoy
NEW="$(date +%Y%m%d)-1"
sed -i '' "s/v=[0-9]\{8\}-[0-9]*/v=$NEW/g" index.html
sed -i '' "s/const assetVersion = '[^']*'/const assetVersion = '$NEW'/" app.js
grep -n "$NEW" index.html app.js
```

---

## EL `.htaccess`

```apache
Options -Indexes
DirectoryIndex index.html

<IfModule mod_headers.c>
  Header set X-Robots-Tag "noindex, nofollow, noarchive"
</IfModule>
```

- **`Options -Indexes`** — sin esto, entrar a `/tagalog/audio/` te lista los
  50 MP3 y te los puedes descargar todos.
- **`X-Robots-Tag`** — la cabecera es más fuerte que el `<meta name="robots">`
  del HTML porque también cubre los MP3 y los JSON, que no tienen HTML donde
  meter un meta tag.

Las dos líneas están ahí por el mismo motivo: **el contenido tiene derechos
de autor y esta instalación es privada.** No las quites.

---

## PROBAR EN LOCAL ANTES DE SUBIR

```bash
cd app
python3 -m http.server 8000
# http://localhost:8000
```

Funciona todo menos las cuentas: `api.php` necesita PHP. Para probarlas:

```bash
php -S localhost:8000
```

Lista de comprobación antes de desplegar:

- [ ] Una lección reproduce
- [ ] "Leer texto" pinta la transcripción y se resalta sola al avanzar
- [ ] Tocar una frase salta a ese punto del audio
- [ ] El diccionario abre y busca
- [ ] La versión está subida en los tres sitios
- [ ] En móvil: el reproductor no tapa la última lección de la lista

---

## COPIA DE SEGURIDAD

Lo que **no** se puede regenerar si se pierde:

1. **`api.php`** — es el único archivo que solo existe en el servidor.
   Debería estar en el repositorio.
2. **Los datos de usuarios del servidor** — progreso de las cuentas.
3. **Los MP3 fuente** — están en `AUDIOS/` en iCloud.

Lo que sí se puede regenerar (pagando otra vez las llamadas a la API):
`transcripts/raw/`, `transcripts/enriched/`, `dictionary.json`.

El código fuente está en GitHub, así que ese lado ya está cubierto.
