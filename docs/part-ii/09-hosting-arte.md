# 09 · Dónde vive el arte (hosting de los SVG)

**Qué cubre este documento.** Por qué el sitio del juego está cerca del límite de GitHub Pages, qué opciones gratuitas hay para servir el arte, cuál recomendamos, los pasos exactos para activarla, cómo deshacerla y cuánto cabe.

**Estado.** El código está listo y **apagado por defecto**: sin configurar nada, el juego se construye y se publica exactamente igual que hoy. Todavía no existe ningún repo de arte. Nada de esto se ha subido ni ejecutado contra GitHub.

---

## 1. El problema, con números (medido el 2026-10-09)

| Qué | Archivos | Tamaño | Promedio | Máximo |
|---|---|---|---|---|
| `cats-svg/<slug>.svg` (detalle completo) | 86 | 617.5 MB | 7.2 MB | 10.0 MB |
| `cats-svg/lite/<slug>.svg` (versión ligera) | 86 | 94.0 MB | 1.1 MB | 1.5 MB |
| `story/lite/luzterna.svg` | 1 | 1.2 MB | — | — |
| Código, fuentes e íconos (`dist/assets` y demás) | — | ~10 MB | — | — |
| **`game/dist` completo** | — | **~723 MB (690 MiB)** | | |

- GitHub Pages admite sitios publicados de hasta **1 GB**.
- La Parte II suma ~80 gatos de ~8.3 MB cada uno (7.2 MB completo + 1.1 MB ligero), o sea **~660 MB más**. Con todo junto el sitio llegaría a ~1.4 GB y **el despliegue dejaría de funcionar**.
- Comprimido para la red, un SVG pesa ~18% de su tamaño en disco: el ligero de `nube_dream_cat` pasa de 979 KB a 176 KB con gzip, y uno completo de 7.4 MB queda en 1.37 MB. El límite de 1 GB se cuenta sin comprimir.

## 2. La regla que no se negocia: el juego no se muda de origen

Las partidas viven en `localStorage` e IndexedDB del **origen** `https://ragosorio.github.io`. Lo manejan `core/save.ts`, `core/vault.ts` (el Baúl, `.nocat`) y el candado de escritura. El navegador separa el almacenamiento por origen (esquema + host + puerto). Si la **página del juego** pasa a otro dominio (por ejemplo `nolc.pages.dev`, `nolc.vercel.app` o un dominio propio), cada jugador abre un almacenamiento vacío: **la isla "desaparece"**. Los datos siguen en el origen viejo, pero el juego ya no los ve. Es exactamente la pérdida de partida de 2026-10-08, solo que a todos a la vez.

Por eso:
- `index.html`, `rupturas.html`, `sw.js`, `version.json` y `assets/` **se quedan siempre** en `https://ragosorio.github.io/no-one-like-cats/`.
- Lo único que puede mudarse es el **arte pesado** (los SVG), y siempre mediante `VITE_ART_BASE*`.
- **Nunca** hay que poner un dominio propio en un repo `Ragosorio/ragosorio.github.io` (el sitio de usuario). Según la documentación de GitHub, ese dominio pasa a usarse para **todos** los sitios de proyecto de la cuenta, el juego incluido, y eso cambia el origen.
- Tampoco hay que **renombrar** el repo del juego, porque la ruta `/no-one-like-cats/` cambiaría. El origen sería el mismo, pero los jugadores con la URL o la PWA vieja quedarían en una ruta sin juego.

## 3. Opciones gratuitas (investigadas el 2026-10-09)

| Servicio | Tamaño / archivos | Ancho de banda | CORS | ¿Cuenta nueva? | Veredicto |
|---|---|---|---|---|---|
| **GitHub Pages, 2º repo de proyecto** | Sitio publicado ≤ **1 GB** por repo. Repo fuente recomendado < 1 GB (< 5 GB "fuertemente"). Git bloquea archivos > 100 MiB y advierte desde 50 MiB. El despliegue se corta a los 10 min. El límite blando de 10 builds/h **no aplica** a workflows propios de Actions | Límite blando de **100 GB/mes**. Si se excede: HTTP 429 | No se pueden poner headers propios, pero **sí envía `access-control-allow-origin: *`** (medido con `curl -I` sobre nuestro propio sitio). `cache-control: max-age=600` | **No** (usa la cuenta Ragosorio) | **Recomendado.** Mismo origen que el juego |
| Cloudflare Pages | Free: **20 000 archivos**, **25 MiB por archivo**, 500 builds/mes, 100 proyectos | Las peticiones a archivos estáticos son "gratis e ilimitadas" | Configurable con `_headers` | **Sí** (cuenta de Cloudflare del dueño) | Buena opción B. Origen distinto: CORS ya soportado por el código |
| Cloudflare R2 | 10 GB-mes de almacenamiento; 1 M operaciones clase A y 10 M clase B al mes | Egress **gratis** | Política CORS por bucket | **Sí**. Además, `r2.dev` tiene límite de velocidad, es "solo para desarrollo" y no usa caché: en producción hace falta un **dominio propio** en Cloudflare | Opción C, solo si algún día hay dominio propio |
| Vercel Hobby | 100 despliegues/día; subida de fuentes por CLI ≤ **100 MB** en Hobby (nuestro arte pesa 617 MB); 15 000 archivos | 100 GB/mes de Fast Data Transfer | Configurable | **Sí** | **No.** El plan Hobby es **solo para uso personal no comercial** (las donaciones sí se permiten), y el arte no cabe en la subida |
| Netlify Free | Créditos | **300 créditos/mes con tope duro**. 1 GB transferido = 20 créditos (~15 GB/mes si solo fuera tráfico). Cada despliegue de producción cuesta 15 créditos | Configurable | **Sí** | **No.** 15 GB/mes no alcanza |
| jsDelivr (desde GitHub) | No admite por defecto paquetes > **150 MB** ni archivos > **20 MB** desde GitHub. Recomienda < 10 000 archivos activos por repo | Sin límite | `access-control-allow-origin: *` (medido) | No | **No.** 617 MB supera el límite de paquete, y los términos prohíben usarlo como hosting general de archivos multimedia (aunque los juegos con muchos assets no cuentan como abuso) |

**Fuentes** (todas consultadas el 2026-10-09):
- GitHub Pages, límites: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- GitHub, archivos grandes y tamaño de repo: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- GitHub, dominios propios (afectan a todos los sitios de proyecto): https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- Headers de nuestro sitio: `curl -I https://ragosorio.github.io/no-one-like-cats/cats-svg/lite/nube_dream_cat.svg` devolvió `access-control-allow-origin: *`, `cache-control: max-age=600` y `content-encoding: gzip` (176 416 B frente a 979 075 B). El repo pesa 147 396 KB según la API.
- Cloudflare Pages, límites: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages, peticiones estáticas gratis: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare R2, precios: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2, buckets públicos y r2.dev: https://developers.cloudflare.com/r2/buckets/public-buckets/
- Vercel, límites: https://vercel.com/docs/limits
- Vercel, uso justo y cláusula no comercial: https://vercel.com/docs/limits/fair-use-guidelines
- Netlify, planes por créditos: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ y https://www.netlify.com/pricing/
- jsDelivr, términos: https://raw.githubusercontent.com/jsdelivr/jsdelivr/master/Terms%20of%20Use.md
- jsDelivr, README (150 MB / 20 MB): https://raw.githubusercontent.com/jsdelivr/jsdelivr/master/README.md

**No verificado:** si R2 exige registrar un medio de pago para activarse aunque se quede en la capa gratuita. Hay que confirmarlo antes de considerarlo.

## 4. Recomendación

**Un segundo repo de GitHub Pages, `Ragosorio/nolc-arte`, que sirva solo el detalle completo de los gatos (`cats-svg/<slug>.svg`) en `https://ragosorio.github.io/nolc-arte/`.**

**La hipótesis del lead se confirma.** Un repo de proyecto se publica en `https://<dueño>.github.io/<repo>/`, así que `nolc-arte` y `no-one-like-cats` comparten host y por lo tanto **el mismo origen**. Eso implica:
- No hace falta CORS. Igual no sería problema: Pages envía `ACAO: *`.
- El service worker del juego intercepta esas peticiones y las cachea como mismo origen. Un worker controla todas las peticiones de sus páginas, aunque vayan fuera de su ruta.
- No se crean cuentas nuevas, las partidas no se tocan y el repo nuevo suma **1 GB más** de sitio publicado (y probablemente otros 100 GB/mes de ancho de banda: el límite está redactado por sitio).

**Detalles a tener en cuenta (verificados):**
1. **El límite de 1 GB es por sitio.** Con todos los gatos de la Parte II, el detalle completo ya no cabe en un solo repo (ver §7). El código reparte el arte en varios repos con `NOLC_ART_BASE_FULL="a,b"`.
2. **El tamaño del repo no es problema**, porque el repo de arte **no guarda el arte en git**. Su workflow hace un checkout parcial (sparse, profundidad 1) del repo del juego y publica desde ahí. El arte sigue teniendo una sola fuente de verdad (`game/public/`). El repo del juego pesa hoy ~144 MB comprimido (git comprime bien el SVG); +80 gatos lo deja muy por debajo del umbral de 5 GB.
3. **Compartir origen también tiene un riesgo.** Cualquier página del repo de arte puede leer las partidas, porque ve el mismo `localStorage`. Por eso el repo de arte publica **solo** SVG, `art-manifest.json` y un `index.html` sin scripts. El script de publicación **se niega a publicar** un SVG que contenga `<script`, `on…=` o `javascript:`.
4. **La cuota de almacenamiento del navegador es por origen** y la comparten partidas y cachés de arte. El service worker ahora **borra las copias viejas** del arte que se mudó, para no duplicar cientos de MB en el dispositivo del jugador.
5. Pages sirve con `max-age=600`: una nueva versión del arte puede tardar hasta 10 min en verse.
6. Pages en un repo privado requiere un plan pago, así que el repo de arte debe ser **público**. El arte ya es público en el repo del juego.
7. Cada repo tiene su propio entorno `github-pages`. Despliegues y concurrencia son independientes.

**Por qué solo el detalle completo y no todo el arte.** El código acepta las dos variantes (`VITE_ART_BASE` mueve todo; `VITE_ART_BASE_FULL` solo el detalle). Recomendamos mover solo el detalle porque:
- **Si el sitio de arte falla o se atrasa, el juego no se rompe.** Si un SVG completo no carga, el gato se queda con su pintura ligera (`catArt.ts`: el estado pasa a `failed` y la textura ligera sigue). Si se mudara también el ligero y fallara, la isla y las batallas mostrarían sustitutos o nada.
- El ligero (95 MB) se publica **en el mismo despliegue** que el código que lo usa: un gato nuevo nunca aparece sin pintura.
- El sitio del juego baja de ~723 MB a ~106 MB (medido: 101 MiB) y el de arte queda en 617.5 MB. Hay lugar para crecer en ambos.

## 5. Qué está implementado (y apagado por defecto)

| Archivo | Qué hace |
|---|---|
| `game/src/art/artPaths.ts` | Lógica pura: tiers (`lite`, `full`, `story`), unión sin dobles barras, reparto en shards con FNV-1a sobre el slug (el ligero y el completo de un gato siempre caen en el mismo shard), y qué archivos sacar de `dist/` o publicar en cada sitio. La usan el juego, `vite.config.ts` y el script de publicación (node la corre sin compilar) |
| `game/src/art/artBase.ts` | `artUrl(path)` es la única puerta de las URLs de arte. Lee `VITE_ART_BASE` y `VITE_ART_BASE_FULL`; vacías, devuelve la ruta relativa de siempre. `artCrossOrigin(url)` da `'anonymous'` solo si el arte está en otro origen. `artSwQuery()` arma los parámetros del service worker |
| `game/src/art/catArt.ts` | `catLiteUrl` y `catSvgUrl` pasan por `artUrl` |
| `game/src/ui/story/portrait.ts`, `game/src/rupturas/cast.ts` | Luzterna, el elenco del slice y REGISTRO 000 pasan por `artUrl` |
| `game/src/engine/world/paperCat.ts` | Una sola línea: `img.crossOrigin` cuando el arte es de otro origen, para que `getImageData` no falle con un canvas contaminado. Pixi no lo necesita: su `loadSVG` usa `fetch` (modo CORS) y luego un data-URI |
| `game/src/art/rasterCache.ts` | Las claves relativas no cambian. Una URL absoluta pierde el `esquema://`, así que la clave queda `…/ragosorio.github.io/nolc-arte/cats-svg/x.svg` |
| `game/src/core/pwa.ts` + `game/public/sw.js` | Si hay base, el worker se registra como `sw.js?v=<build>&art=<bases absolutas>&tiers=full\|all`. Cachea esas URLs igual que hoy (stale-while-revalidate en `nolc-art`). Al activarse borra las copias locales de los tiers que se mudaron y cualquier entrada fuera de su alcance que ya no sea una base actual, lo que limpia solo tras un rollback. **Sin base, la URL del worker es idéntica a la de hoy** |
| `game/vite.config.ts` | Plugin `nolc-drop-remote-art`: con una base configurada, saca de `dist/` los SVG que sirve el sitio de arte. Sin base no hace nada |
| `game/scripts/art-publish.ts` | `build`: arma el sitio de arte (shard k de n, tiers) con `art-manifest.json` (sha1 por archivo), rechaza SVG con scripts y falla si el sitio pasa de 950 MB. `check`: antes del deploy del juego, compara el manifiesto publicado con los archivos del commit |
| `.github/workflows/deploy.yml` | Lee las variables de repo `NOLC_ART_BASE` y `NOLC_ART_BASE_FULL`. Sin ellas (el default) el deploy es igual que hoy, más un `du -sh dist` informativo. Con ellas, antes del build corre `art-publish.ts check`. **Falla** si falta o difiere un SVG ligero o de historia, o si un completo es **distinto** (un gato redibujado mezclaría rig nuevo con pintura vieja). Si solo **falta** un completo (gato nuevo), avisa y sigue: se ve en ligero hasta que el sitio de arte se ponga al día. La guarda anti-raster sigue igual |
| `ops/nolc-arte/publish.yml` | **Plantilla** del workflow del repo de arte (no corre en este repo) |
| `game/tests/artBase.test.ts` | Sin base, las URLs son idénticas (para todos los gatos, el elenco de Rupturas y Luzterna). Con base: unión limpia, shards estables y coherentes con lo que publica cada sitio, `crossOrigin` y claves de caché |

**Verificado localmente además de los tests:**
- Build con `VITE_ART_BASE_FULL`: 86 SVG fuera de `dist/` (101 MiB). El build por defecto queda en 690 MiB con `cats-svg` completo.
- En Chrome headless, con el arte servido desde **otro origen** (puerto distinto, `ACAO: *`), Rupturas (`paperCat` + `getImageData`) y la carga ligera y completa de `catArt` funcionan sin errores.
- El service worker de producción se registró con `&art=…&tiers=full`, cacheó el SVG remoto, borró la copia local vieja del completo y conservó los ligeros y los íconos.

## 6. Pasos para el dueño (una sola vez)

Todo lo de abajo **requiere tu aprobación**: crea un repo público, activa Pages, cambia variables y despliega. Siguiendo la memoria del proyecto, se usa el token de la cuenta Ragosorio sin cambiar la cuenta activa de `gh`.

```sh
# 0) desde la raíz del repo del juego ("~/Desktop/No one"), con este cambio ya en main
export GH_TOKEN="$(gh auth token -u Ragosorio)"

# 1) crear el repo de arte (público; Pages gratis exige público)
gh repo create Ragosorio/nolc-arte --public --description "Arte vectorial de NO ONE LIKE CATS (servido por GitHub Pages)"

# 2) subirle SOLO el workflow (el arte NO se copia: se toma del repo del juego en cada publicación)
tmp="$(mktemp -d)" && git -C "$tmp" init -b main
mkdir -p "$tmp/.github/workflows" && cp ops/nolc-arte/publish.yml "$tmp/.github/workflows/publish.yml"
git -C "$tmp" add . && git -C "$tmp" -c user.name=Ragosorio -c user.email=ragosorio777@gmail.com commit -m "ci: publish art to GitHub Pages"
git -C "$tmp" remote add origin https://github.com/Ragosorio/nolc-arte.git
git -C "$tmp" -c credential.helper= -c 'credential.helper=!f() { echo username=Ragosorio; echo "password=$(gh auth token -u Ragosorio)"; }; f' push -u origin main

# 3) activar Pages con "GitHub Actions" como fuente
gh api -X POST repos/Ragosorio/nolc-arte/pages -f build_type=workflow

# 4) (opcional; el default ya es "full", 0, 1) variables del sitio de arte
gh variable set NOLC_ART_TIERS -R Ragosorio/nolc-arte -b full
gh variable set NOLC_ART_SHARD -R Ragosorio/nolc-arte -b 0
gh variable set NOLC_ART_COUNT -R Ragosorio/nolc-arte -b 1

# 5) publicar el arte y esperar a que termine
gh workflow run publish.yml -R Ragosorio/nolc-arte -f ref=main
gh run watch -R Ragosorio/nolc-arte "$(gh run list -R Ragosorio/nolc-arte -L 1 --json databaseId -q '.[0].databaseId')"

# 6) comprobar que se sirve (200, image/svg+xml)
curl -sI https://ragosorio.github.io/nolc-arte/cats-svg/nube_dream_cat.svg | head -5
curl -s  https://ragosorio.github.io/nolc-arte/art-manifest.json | head -c 300; echo

# 7) encender el flag en el juego y redesplegar
gh variable set NOLC_ART_BASE_FULL -R Ragosorio/no-one-like-cats -b https://ragosorio.github.io/nolc-arte/
gh workflow run deploy.yml -R Ragosorio/no-one-like-cats
```

**Después del paso 7, comprobar:**
- El log del deploy muestra `[art] OK` y `86 SVGs left out of dist/`, y `du -sh dist` da ~101 MB.
- En el juego, la pestaña Red muestra el detalle completo desde `/nolc-arte/cats-svg/…` (por ejemplo en el Catdex grande o en un retrato de historia), y la URL del service worker incluye `&art=…&tiers=full`.

**Automático (agregado al publicar, 2026-10-09):** el workflow del repo de arte corre solo **cada 6 h**. Compara el árbol `game/public/cats-svg` de `main` con el que ya está publicado (va en `art-manifest.json` como `tree:<hash>`) y solo despliega si cambió. Un gato nuevo que suba Codex se ve en ligero y, en ≤ 6 h, también en completo, sin que nadie haga nada. GitHub apaga los cron de repos públicos tras 60 días sin actividad; si pasa, se reactiva en la pestaña Actions de `nolc-arte`.

**Rutina manual (si quieres el completo ya, o si un redibujo hizo fallar el deploy):**
1. Push a `main`. Si el gato es nuevo, el deploy del juego pasa con un aviso y el gato se ve en ligero. Si un completo es distinto, el deploy **falla a propósito**.
2. `gh workflow run publish.yml -R Ragosorio/nolc-arte -f ref=main`
3. Si el deploy había fallado: `gh run rerun <id> -R Ragosorio/no-one-like-cats --failed`, o `gh workflow run deploy.yml …`.

Más adelante se puede automatizar el paso 2 con un token fino (Actions: write sobre `nolc-arte`) guardado como secreto en el repo del juego y un `repository_dispatch` de tipo `publish-art` (la plantilla ya lo escucha). No está hecho porque requiere crear un token.

## 7. Capacidad

Supuestos: margen operativo de **950 MB por sitio** (el script falla por encima), 7.2 MB por gato en el detalle completo, 1.1 MB en el ligero y ~10 MB de código.

| Configuración | Uso hoy | Gatos que caben (total) | ¿Alcanza para la Parte II (+80 → 166)? |
|---|---|---|---|
| Hoy, todo en el sitio del juego | ~723 MB | ~113 (≈ +27) | **No** |
| **Recomendada**: juego = código + ligero + historia | ~106 MB | ~850 (≈ +765) | Sí, de sobra (~195 MB) |
| **Recomendada**: `nolc-arte`, solo el completo (1 shard) | 617.5 MB | ~132 (≈ +46) | **No**: hace falta el 2º shard |
| Completo en 2 shards (`nolc-arte` + `nolc-arte-2`) | ~335 + ~282 MB (reparto real del hash hoy) | ~240–260 | **Sí** (~600 MB por shard con 166 gatos) |
| Completo en 3 shards | — | ~360 | Sí |
| Alternativa: todo el arte en un sitio (`VITE_ART_BASE`) | 712.7 MB | ~114 (≈ +28) | No (se necesitan 2 shards, ~228 gatos) |

**Cuándo agregar el 2º shard.** Cuando el log de publicación del arte pase de ~850 MB (unos +32 gatos), o antes, si ya se van a sumar los 80. Pasos:
1. Repetir 1, 2, 3 y 5 de §6 con `Ragosorio/nolc-arte-2`. En **ambos** repos de arte, `NOLC_ART_COUNT=2`, y `NOLC_ART_SHARD=0` en `nolc-arte` y `1` en `nolc-arte-2`. Volver a publicar los dos.
2. `gh variable set NOLC_ART_BASE_FULL -R Ragosorio/no-one-like-cats -b "https://ragosorio.github.io/nolc-arte/,https://ragosorio.github.io/nolc-arte-2/"`. El orden de la lista es el número de shard.
3. Redesplegar el juego. Costo: ~la mitad de los gatos cambia de URL y cada jugador vuelve a bajar su detalle completo **una vez**. El worker borra las copias viejas.

**Ancho de banda.** Un SVG completo viaja con gzip (~1.3 MB). Con 100 GB/mes por sitio son ~75 000 descargas de detalle completo al mes, y cada dispositivo baja cada una una sola vez gracias al service worker. El detalle completo solo se pide cuando un gato se dibuja a más de ~640 px. Si GitHub responde 429, el gato se queda en ligero, que es la degradación prevista.

## 8. Plan de reversión

En ningún escenario se tocan las partidas: el origen del juego nunca cambia.

1. **Volver al estado de hoy** (2 comandos):
   ```sh
   gh variable delete NOLC_ART_BASE_FULL -R Ragosorio/no-one-like-cats
   gh workflow run deploy.yml -R Ragosorio/no-one-like-cats
   ```
   El build vuelve a incluir todos los SVG (~723 MB, todavía bajo 1 GB mientras no lleguen los gatos nuevos). El worker nuevo (sin `&art=`) borra del caché las entradas de `/nolc-arte/`.
2. **Si el sitio de arte se cae** con el flag encendido, no hay que hacer nada urgente: los gatos se ven en ligero. Si dura, aplicar el punto 1.
3. **El repo de arte no se borra** hasta que un deploy del juego sin la variable esté en vivo y verificado.
4. Si el commit con este código diera problemas, revertirlo es seguro: sin la variable, el comportamiento ya es el de antes.

## 9. Si algún día hay que irse a Cloudflare (Pages o R2)

Solo tendría sentido con muchos más gatos que shards razonables, o con un dominio propio. Lo tiene que hacer el dueño, porque requiere **crear una cuenta en Cloudflare**, y para R2 en producción también **un dominio**. **La página del juego sigue en GitHub Pages.**

- **El código ya está listo para otro origen:** `artCrossOrigin` pone `crossOrigin='anonymous'` en el `<img>` de `paperCat`, Pixi carga por `fetch` en modo CORS, el worker cachea las bases que recibe en `?art=` aunque sean de otro origen y las claves de `rasterCache` aceptan URLs absolutas.
- **El host tiene que enviar CORS.**
  - Cloudflare Pages: archivo `_headers` en `_site` con `/*` → `Access-Control-Allow-Origin: https://ragosorio.github.io`.
  - R2: política CORS del bucket con `AllowedOrigins: ["https://ragosorio.github.io"]` y `AllowedMethods: ["GET","HEAD"]`, servida desde un **dominio propio** (no `r2.dev`).
- **Cómo publicar.** El mismo `node game/scripts/art-publish.ts build --out _site …` y luego `wrangler pages deploy _site --project-name nolc-arte` (Pages, ≤ 20 000 archivos de ≤ 25 MiB: el más grande hoy pesa 10 MB) o una subida al bucket (R2, 10 GB gratis).
- **Cómo cambiar.** `NOLC_ART_BASE_FULL=https://arte.<dominio>/` y redesplegar. El `check` del deploy funciona igual porque lee `art-manifest.json`. Para el service worker no hay que tocar nada: la nueva base llega en `?art=`.
- **Ojo:** un origen distinto ya no comparte la caché HTTP de origen ni la conexión. La primera carga del detalle completo tendrá un handshake extra. Es aceptable porque el detalle completo no está en el camino crítico.
