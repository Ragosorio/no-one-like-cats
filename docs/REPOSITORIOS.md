# Los repositorios y cómo se conectan

NO ONE LIKE CATS vive en cuatro repos. La regla que lo ordena todo: **el código y el arte nacen en un solo lugar, el repo del juego.** Los repos de arte no guardan arte en git; solo lo publican. MAI SVG es la herramienta con la que se hace ese arte.

Volver a: [README](../README.md) · [índice de la documentación](INDICE.md) · [CONTRIBUTING](../CONTRIBUTING.md)

---

## 1. Los cuatro repos

| Repo | Qué guarda | Sitio | Estado |
|---|---|---|---|
| [Ragosorio/no-one-like-cats](https://github.com/Ragosorio/no-one-like-cats) | El juego: `game/` (código, datos, SVG ligeros y completos, música, pruebas), la documentación y la plantilla del workflow de arte (`ops/nolc-arte/publish.yml`). | https://ragosorio.github.io/no-one-like-cats/ | En vivo. Se publica en cada push a `main`. |
| [Ragosorio/nolc-arte](https://github.com/Ragosorio/nolc-arte) | Solo `.github/workflows/publish.yml` y un README. Publica el **detalle completo** de los gatos tomándolo del repo del juego. | https://ragosorio.github.io/nolc-arte/ | En vivo: 122 SVG, 881,3 MB (manifiesto publicado el 2026-10-11). |
| [Ragosorio/nolc-arte-2](https://github.com/Ragosorio/nolc-arte-2) | Lo mismo que `nolc-arte`, como **segundo sitio** para el arte nuevo. | https://ragosorio.github.io/nolc-arte-2/ | Creado y configurado, **todavía no activo**: no ha publicado nada y su ejecución automática está apagada. |
| [Ragosorio/MAI-SVG](https://github.com/Ragosorio/MAI-SVG) | La herramienta del autor: vectoriza pinturas (PNG/WebP/JPG → SVG), edita puntos y animaciones, y exporta los SVG y rigs del juego (`scripts/game-export.ts`, `scripts/game-thumbs.ts`). | Se corre en local (`npm start`, editor en `http://127.0.0.1:4318/`). | Código abierto (MIT). |

---

## 2. El dibujo completo

```
   (fuera del repo)                  Ragosorio/MAI-SVG (en tu computadora)
   pintura PNG del gato  ─────────►  mai vectorize --preset high-color-preserved
                                     scripts/game-export.ts  → SVG completo
                                     scripts/game-thumbs.ts  → SVG ligero
                                     rig MAI                 → catRigs.json
                                              │
                                              ▼  (commit)
 ┌─────────────────────── Ragosorio/no-one-like-cats ────────────────────────┐
 │ game/public/cats-svg/<slug>.svg        completo  (7,2 MB en promedio)      │
 │ game/public/cats-svg/lite/<slug>.svg   ligero    (~1 MB)                  │
 │ game/public/story/lite/luzterna.svg    historia                            │
 │ game/src/data/catRigs.json             rigs                                │
 └──────────┬──────────────────────────────────────────────┬──────────────────┘
            │ push a main                                   │ cada 6 h, a mano, o por
            ▼                                               ▼ repository_dispatch
 .github/workflows/deploy.yml                    nolc-arte: publish.yml
  1. npm ci (Node 22)                             1. checkout parcial del repo del juego
  2. si hay base de arte: art-publish check          (cats-svg/, story/, artPaths.ts,
     (compara con el manifiesto publicado)            art-publish.ts), profundidad 1
  3. npm run build con VITE_ART_BASE(_FULL)        2. ¿cambió el árbol cats-svg? si no, nada
     → saca de dist/ lo que sirve el sitio de arte 3. art-publish build --tiers full
  4. guardia: cero raster en dist/                    --shard 0 --count 1
  5. GitHub Pages                                  4. guardia: cero raster
            │                                      5. GitHub Pages
            ▼                                               ▼
 ragosorio.github.io/no-one-like-cats/          ragosorio.github.io/nolc-arte/
  código, ligeros, historia, íconos, música      cats-svg/<slug>.svg + art-manifest.json
            │                                               │
            └──────────── mismo origen: ragosorio.github.io ┘
                                   │
                                   ▼
          El navegador carga el ligero desde el juego y, cuando el gato
          se ve grande, el completo desde el sitio de arte. El service
          worker guarda los dos. Si el completo falla, el gato se queda
          con su pintura ligera: nunca se rompe nada.
```

`nolc-arte-2` es una copia de `nolc-arte` con `--shard 1 --count 2`. Cuando se active, publicará solo el arte que el juego le asigne (sección 4).

---

## 3. Ligero contra completo

Cada gato tiene **dos SVG del mismo dibujo**, los dos vectoriales y en el mismo espacio de 700×700, así que el rig sirve para ambos:

| | Ligero (`cats-svg/lite/<slug>.svg`) | Completo (`cats-svg/<slug>.svg`) |
|---|---|---|
| Cómo se hace | `scripts/game-thumbs.ts` de MAI: traza ligera con control de calidad | `scripts/game-export.ts` de MAI: el mismo dibujo, verificado píxel a píxel |
| Peso | ~1 MB | 7,2 MB en promedio (de 3 a 10 MB) |
| Cuándo se carga | Siempre, primero: isla, batalla, tienda, Catdex | En segundo plano, cuando el gato se dibuja a más de ~640 px (`requestCatSvg` en `game/src/art/catArt.ts`) |
| Dónde se sirve hoy | Junto al juego | En `nolc-arte` |
| Manifiesto | `game/public/cats-svg/lite/game-thumbs.json` | `game/public/cats-svg/game-export.json` |

**Por qué solo el completo se muda.** Si el sitio de arte falla o se atrasa, el juego no se rompe: el gato se queda en ligero. El ligero se publica en el mismo deploy que el código que lo usa, así que un gato nuevo nunca aparece sin pintura.

---

## 4. Bases y shards

El juego arma toda URL de arte con `artUrl(path)` (`game/src/art/artBase.ts`), que usa la lógica pura de `game/src/art/artPaths.ts`:

- **Sin base** (lo normal en tu computadora): la ruta queda relativa, `cats-svg/lite/x.svg`, y todo sale de `game/public/`.
- **`VITE_ART_BASE_FULL`**: el detalle completo se sirve desde esa base.
- **`VITE_ART_BASE`**: mueve todos los niveles (ligero, completo e historia). Hoy no se usa.
- **Varias bases** separadas por coma (`"a,b"`): cada una es un **shard**, y el orden de la lista es el número de shard. El ligero y el completo de un gato siempre caen en el mismo.

**Shards fijados.** Con un solo sitio todo va al 0. Con varios:

- todo archivo que ya existía al abrir el segundo sitio está **fijado** al sitio 0 en `game/src/art/artShardPins.ts` (122 gatos y Luzterna). Su URL no cambia nunca, así que ningún jugador lo vuelve a bajar;
- **cualquier archivo nuevo va al sitio más nuevo** (`shardFor` en `artPaths.ts`);
- si algún día se abre un tercer sitio, primero se fijan en `artShardPins.ts` las claves que sirve el sitio 1, y después se agrega la base.

Antes se repartía con `fnv1a(slug) % n`, lo que movía la mitad del arte al pasar de 1 a 2 sitios. `shardOf` sigue en el código como referencia.

---

## 5. Capacidad: por qué existe `nolc-arte-2`

- GitHub Pages admite sitios de hasta **1 GB**. El script de publicación falla antes, a los **950 MB** (`NOLC_ART_LIMIT_MB`), para no dejar un deploy a medias.
- `nolc-arte` publica hoy **122 archivos, 881,3 MB**. Quedan unos 68 MB: unos 9 gatos más con el peso promedio de un completo.
- Por eso se creó `nolc-arte-2`: el arte nuevo irá ahí, y el de `nolc-arte` no se mueve.
- El repo de arte no guarda el arte en git, así que su tamaño no crece: el límite que importa es el del sitio publicado.

**Orden de activación** (lo hace el dueño, cuando publique la actualización que trae arte nuevo):

1. Push del juego a `main` con el arte nuevo. El deploy compara con el sitio único actual: si solo **falta** un completo, avisa y sigue (el gato nuevo se ve en ligero).
2. En `nolc-arte`: `NOLC_ART_SHARD=0` y `NOLC_ART_COUNT=2`, y volver a publicar. Publica exactamente los mismos 122 archivos fijados.
3. Correr el workflow de `nolc-arte-2`. Publica solo el arte nuevo.
4. En el repo del juego, poner las dos bases en `NOLC_ART_BASE_FULL` (primero `nolc-arte`, después `nolc-arte-2`) y volver a desplegar.
5. Encender la ejecución automática de `nolc-arte-2`.

Para deshacerlo, se quita la segunda base y se vuelve a desplegar: los gatos nuevos quedan en ligero y `nolc-arte` no cambia sus rutas.

---

## 6. Variables de los repos

Solo nombres; no hay secretos en ninguno de los tres repos con Pages. Se configuran en *Settings › Secrets and variables › Actions › Variables*.

| Repo | Variable | Para qué |
|---|---|---|
| `no-one-like-cats` | `NOLC_ART_BASE_FULL` | Bases del detalle completo, separadas por coma. El deploy la pasa al build como `VITE_ART_BASE_FULL`. **Hoy está definida** (apunta a `nolc-arte`). |
| `no-one-like-cats` | `NOLC_ART_BASE` | Bases para todos los niveles de arte. Llega al build como `VITE_ART_BASE`. Hoy no está definida. |
| `nolc-arte`, `nolc-arte-2` | `NOLC_ART_TIERS` | Qué publica el sitio: `full` (el valor por defecto), `lite` o `all`. |
| `nolc-arte`, `nolc-arte-2` | `NOLC_ART_SHARD` | Qué shard es este sitio (0, 1…). |
| `nolc-arte`, `nolc-arte-2` | `NOLC_ART_COUNT` | Cuántos sitios de arte hay. Debe coincidir con el número de bases en `NOLC_ART_BASE_FULL`. |

`nolc-arte` usa los valores por defecto (`full`, shard 0, 1 sitio). `nolc-arte-2` ya tiene `full`, shard 1 y 2 sitios.

Variables de entorno que lee `game/scripts/art-publish.ts` (no son de los repos): `NOLC_ART_LIMIT_MB` (tope del sitio, 950 por defecto), `NOLC_ART_SOURCE` (de qué commit salió el arte; queda en `art-manifest.json`) y `NOLC_SITE_URL` (la URL del juego para `check`).

Sin ninguna variable, el juego se construye y se publica con todo el arte adentro, exactamente como antes de que existieran los repos de arte.

---

## 7. Qué tocas si quieres agregar arte

Solo el repo del juego. No necesitas acceso a los repos de arte ni configurar nada.

1. Pon los dos SVG (de [MAI SVG](https://github.com/Ragosorio/MAI-SVG)) en `game/public/cats-svg/<slug>.svg` y `game/public/cats-svg/lite/<slug>.svg`, con las entradas que MAI agrega a `game-export.json` y `lite/game-thumbs.json`.
2. Agrega su rig a `game/src/data/catRigs.json`.
3. Prueba en local: `?scene=catlive&cat=<slug>&rig=1`. En tu computadora todo sale de `game/public/`.
4. Manda tu PR. Cuando se publique, el gato se verá en ligero de inmediato y en completo cuando el sitio de arte se ponga al día (en `nolc-arte`, en 6 horas como máximo).

Lo que **no** tienes que tocar:

- `artShardPins.ts`: un archivo nuevo va solo al sitio más nuevo. Ese archivo solo se edita al abrir un sitio de arte nuevo.
- Los repos de arte y sus variables: los maneja el dueño.

Cuidado con dos cosas:

- **Nunca renombres un slug**: las partidas y las URL publicadas dependen de él.
- **Redibujar un gato que ya existe** cambia su SVG completo. El deploy del juego **falla a propósito** hasta que el sitio de arte publique la versión nueva, porque si no se mezclaría un rig nuevo con una pintura vieja. Avísalo en el PR.

El pipeline completo (pintura → MAI → SVG completo y ligero → rig → ficha) está en [guias/agregar-gato.md](guias/agregar-gato.md). Los estilos, en [arte/ESTILOS.md](arte/ESTILOS.md).

---

## 8. Reglas que no se rompen

- **El juego nunca se muda de dominio.** Las partidas viven en el almacenamiento del origen `https://ragosorio.github.io`. Si la página del juego se fuera a otro dominio, cada jugador abriría un almacenamiento vacío y su isla "desaparecería". Por eso:
  - el juego no se renombra;
  - nunca se pone un dominio propio en un repo `Ragosorio/ragosorio.github.io`, porque cambiaría el origen de todos los sitios de proyecto;
  - lo único que se puede mudar es el arte pesado, y siempre con `VITE_ART_BASE*`.
- **Los repos de arte son públicos** (Pages gratis lo exige) y publican **solo** SVG, `art-manifest.json` y un `index.html` sin scripts. Comparten origen con el juego: un SVG con scripts podría leer las partidas, así que `art-publish.ts` se niega a publicarlo.
- **Cero raster** en los dos workflows.

Detalle técnico, opciones de hosting evaluadas, capacidad y plan de reversión: [part-ii/09-hosting-arte.md](part-ii/09-hosting-arte.md). Código: [`game/src/art/artPaths.ts`](../game/src/art/artPaths.ts), [`artBase.ts`](../game/src/art/artBase.ts), [`artShardPins.ts`](../game/src/art/artShardPins.ts), [`game/scripts/art-publish.ts`](../game/scripts/art-publish.ts), [`game/vite.config.ts`](../game/vite.config.ts), [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) y [`ops/nolc-arte/publish.yml`](../ops/nolc-arte/publish.yml).
