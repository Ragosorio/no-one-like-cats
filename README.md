# no-one-like-cats

**NO ONE LIKE CATS** — juego de navegador: una isla flotante de gatos estilo Dragon City (colecciona, cría con *Resonancia*, construye) + combate por turnos de artillería física contra barcos modulares estilo Castle Busters. Español latino sin filtro, ataques gritados en inglés/japonés.

**Jugar:** https://ragosorio.github.io/no-one-like-cats/

Sin anuncios, sin pagos, sin energía. "Espera o sigue jugando".

## Arte: cero imágenes raster

Los 32 gatos y la capitana Luzterna son **SVG vectorial puro** (sin PNG, sin base64 embebido), convertidos con MAI SVG (ver [pipeline](#pipeline-de-arte)) y animados en tiempo real:

- El juego deforma cada pintura sobre una malla (Live2D-lite) con un rig por gato (`game/src/data/catRigs.json`): parpadeo, orejas, cabeza que mira al cursor o a quien habla, cola, objetos flotantes, respiración, ciclo de caminata, siestas, bostezos, acicalarse, estirarse.
- En combate: se agachan al apuntar, se lanzan al disparar, se encogen con el golpe, el viento del mar les mueve el pelo, y las ultis tienen actuación completa.
- Dos niveles de detalle, ambos vectoriales: `public/cats-svg/lite/` (carga rápida) y `public/cats-svg/` (detalle completo, se carga solo cuando el gato se ve grande).

Laboratorio de gatos vivos: `?scene=catlive` (`&cat=<slug>&rig=1` muestra el rig).

## Correr en local

```bash
cd game
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. `npm run build` genera `game/dist/` (lo que publica GitHub Pages).

## Estructura

- `game/` — TypeScript + PixiJS v8 + GSAP + pixi-filters (Vite). Pantalla lógica 1920×1080.
- `research/` — GDD, economía, referencias pop, dirección de arte.
- `CHARLA.txt` — la conversación de diseño original.

## Pipeline de arte

Hecho con **MAI SVG**, una herramienta local (no incluida en este repo):

1. PNG originales → `mai vectorize --preset high-color-preserved` (alfa como máscara vectorial).
2. `scripts/game-export.ts` de MAI (perfil *game-compact*: mismo dibujo, verificado píxel a píxel) → `game/public/cats-svg/`.
3. `scripts/game-thumbs.ts` de MAI (traza ligera con control de calidad) → `game/public/cats-svg/lite/`.
4. Rigs (ojos/orejas/cabeza/cola/flotantes) en formato MAI → `game/src/data/catRigs.json`.

Los PNG fuente no viven en este repo, y el `.gitignore` bloquea cualquier imagen raster.
