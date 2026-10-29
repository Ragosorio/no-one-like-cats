# UI-FIX · estado del agente

> Encargo (2026-10-29, palabras del dueño): 1) «haz que los muelles se muestren bien y no así de chiquitos»
> (MUELLE DE PESCA); 2) «las revelaciones no ocupan toda la pantalla y deberían poder hacerlo» (revelación de gato y
> universos Multidimensionales, cualquier aspecto). Sin commits ni push. Puerto 5224 (`ui-fix`), HMR apagado; 5234 =
> los mismos archivos servidos desde HEAD (capturas «antes»). Nunca el 5173.

## Qué estoy haciendo
Terminado; entregado al coordinador. Servidores 5224/5234 detenidos.

## Hecho
- Muelle: `panels/island/DockPanel.ts` — panel del tamaño de la pantalla real, rejilla `dockGrid()` (columnas y
  escala según ancho/alto y píxeles reales), tarjetas escaladas (ya no se encoge todo), ScrollBox con rueda/arrastre,
  toques ignorados tras arrastrar, región en su propia línea (antes se encimaba con el título), textos chicos más grandes.
- Revelaciones: `fx/sequences/catReveal.ts` — papel, print, puntos y bloques laterales a `game.view` (+ sangrado 80);
  `back` del universo dentro de un marco con escala COVER; UI de esquina (SALTAR, CATDEX, botones, pista) en las
  esquinas reales; brillo, glitch, confeti, motas a la pantalla real; centro del shockwave sobre el gato.
- `fx/sequences/multiverse/kit.ts` — comentario-regla arriba; `cover()` pinta la pantalla real; `viewIn(c, layer)`;
  `fall()` / `drizzle()` usan la pantalla real.

- Barrido 21:9 de los 85 universos: todos llenan la pantalla. Parches puntuales donde `fg` pintaba (0,0,W,H):
  `gataranaNoir.ts` (viñeta, iris y grano), `garritas.ts` (marco de furia), `gatarana2099.ts` (destello RGB).
- Test `tests/uiFixPantalla.test.ts` (22): rejilla del muelle y cover()/viewIn() en 5 aspectos.

- Verificado headless: muelle a 2000×1300 / 1600×900 / 1280×720 / 844×390 (14 muelles) y con 2 muelles, 0 textos
  fuera del panel, 0 encimados; 4:3 (13 revelaciones), teléfono (3), Catdex «VER REVELACIÓN» (canelo), DUP (3),
  REDUCE (3): todas llenan la pantalla, cierran, sin errores; 0 tweens de la revelación tras cerrar; saltar devuelve
  el gato entero en 7 universos que lo toman prestado (gritito, gatote, mazingato, michiercoles, sirsimon, zoomic,
  estambre). tsc limpio. Tests: uiFixPantalla (22), p3MultiverseReveal, multidimCards, postp3Multidim verdes.
- (Los «tweens sobrantes» que salían en el harness eran un segundo clic del harness que caía en INVOCAR del FxLab.)

- FPS con vsync a 21:9 (2100×900): 60.0 de media en 7 revelaciones (6 universos de kits distintos + legendaria),
  p99 18–26 ms, 0 tweens sobrantes. `vitest run --maxWorkers=2`: 89 archivos OK (1 omitido), 1561 tests.

## Falta
- Nada de este encargo. Decisión del dueño (opcional): en `back` los bordes del cuadro se recortan en 4:3 / 21:9
  (decoración en los bordes: p. ej. el marcador del Comecroquetas en 4:3).
- FPS / tweens / saltar / REDUCE / DUP; tsc, vitest; capturas para el dueño.

## Cómo retomar
- Harness: scratchpad `ui-fix/` (`dock.mjs`, `reveal.mjs`, `vite.uifix.config.mjs`, `vite.before.config.mjs`).

## Última actualización
2026-10-29
