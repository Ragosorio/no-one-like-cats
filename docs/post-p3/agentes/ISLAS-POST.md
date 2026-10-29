# ISLAS-POST · estado del agente

> Encargo (2026-10-29): islas nuevas en el mapa normal (el archipiélago de siempre), que aparecen después de `postP3Unlocked()` y dan terreno para ~120 gatos más. Sin commits. Nunca el puerto 5173. Servidor propio: Vite con HMR apagado en 5223 (`<scratchpad>/islas-post/h/vite.islas.config.mjs`).

## Qué estoy haciendo
- Nada. Terminado y reportado al coordinador. El servidor está parado y Chrome cerrado.

## Hecho
**Cinco islas, las expansiones 13–17.** Están en `game/src/data/postp3/islas.json`, se agregan al final de `content.json` con `mergeContent` y cada una lleva `gate: "postp3"`.

| n | id | Nombre | Dimensión | Reino | Precio | Limpieza | Bono | Secreto |
|---|---|---|---|---|---|---|---|---|
| 13 | `muelle_carton` | Muelle de Cartón | CARTÓN (`carton`) | 40 | 750 B | 1 h 30 | +1 constructor, +30 % oro | La Caja Sin Fondo (abrir): 4 gemas + 2 h de Ronroneo |
| 14 | `tapete_suerte` | Tapete de la Suerte | TAPETE (`felt`) | 42 | 2,5 T | 2 h | +40 % oro, Catdex +1 % por especie | La Ficha de la Casa (21 clics): 4 gemas + 20 Prisma |
| 15 | `patio_talavera` | Patio de Talavera | TALAVERA (`talavera`) | 44 | 7,5 T | 2 h 30 | +50 % oro, +30 % Pescaditos | La Fuente de Azulejos (abrir): 4 gemas + 40 cristales de Agua |
| 16 | `bahia_ovillo` | Bahía Ovillo | TEJIDO (`yarn`) | 46 | 20 T | 3 h | +60 % oro, banco offline +2 h | El Ovillo sin Fin (30 clics): 5 gemas + 3 h de Ronroneo |
| 17 | `nube_siesta` | Nube Siesta | SIESTA (`pillow`) | 48 | 50 T | 4 h | +1 constructor, +75 % oro | La Almohada del Rey (abrir): 6 gemas + 30 Prisma |

- **Terreno:**
  - de 125 a 152 tiles por isla; la más grande de las viejas (sin contar casa) tiene 91;
  - caben unos 12–14 hábitats nuevos (3×3) por isla, ~62 en total;
  - caben ~16 patios grandes (5×5, tier 7+): **~190 gatos en tier 9, ~160 en tier 8.** Con codicia desde el centro, el cálculo pesimista da 14 patios.
- **Mapa:**
  - forman un tercer anillo alrededor del archipiélago: derecha, abajo-derecha, abajo, abajo-izquierda e izquierda;
  - `GRID_POST = 88` solo para n > 12;
  - `buildIslandPlan(regions)` es puro, y la prueba compara el plan viejo tile por tile: las islas 1–12 y casa quedan idénticas en tiles, parcelas, corrales, secretos, decoración y placas de laguna.
- **Antes de la puerta:**
  - `expansionHidden(n)` se muestra como `look 'hidden'`: sin roca, sin velo, sin cielo, sin precio, sin cartel, sin luz de noche ni nubes de papel;
  - no se puede comprar, no sale en `nextExpansion` ni en «sin casa», y la cámara no se va hacia ese mar;
  - una isla comprada o limpiada nunca se vuelve a esconder, aunque una repetición de la historia reinicie las misiones.
- **Después de la puerta:** salen selladas con su precio, como cualquier expansión. En «sin casa», cuando no queda espacio ni nada que mejorar, el consejo es «TERRENO · 750B» (la isla 13).
- **Arte procedural, sin raster:**
  - 5 `DimDef` nuevos (`dimensions/defs.ts`);
  - patrones, roca, laguna y cascadas en `dimensions/bakePost.ts`;
  - cielos en `dimensions/skyPost.ts`;
  - colgantes bajo la roca y marquesina del Tapete (`fx.ts`);
  - 13 decoraciones nuevas (`decorArt.ts`) y 5 monumentos de secreto (`landmarks.ts`);
  - partículas, carteles «DIMENSIÓN X» y frases de gato por dimensión.
- **Rendimiento:**
  - `IslandScene.cullFar()` deja de dibujar (`renderable`) la decoración y los hábitats de las islas cuya roca está fuera de pantalla;
  - las islas nuevas llevan menos decoración (densidad 0,24);
  - la decoración más pesada se aligeró.
- **Pruebas:** `game/tests/islasPost.test.ts` (17): datos, plan viejo idéntico, separación por mar, capacidad, oculto antes y visible después, compra y limpieza, guardado y recarga, «sin casa» y partidas viejas sin cambios.

**Medición final** (headless con GPU Metal, la misma partida de fin de juego, con GC; `<scratchpad>/islas-post/final/` y `final.log`):

| | FPS (casa / zoom del dueño / vista completa) | render ms/cuadro | heap | texturas | Graphics (>400 v) |
|---|---|---|---|---|---|
| Antes de la puerta (5 ocultas) | 60 / 60 / 60 | 3,4–3,9 | 253–259 MB | 352 (250 MB) | 1959 (500) |
| Las 5 abiertas + 10 hábitats T7–T10 | 59–60 / 57–60 / 56–60 | 3,6–4,4 | 343 MB | 404 (282 MB) | 2596 (778) |

- El Graphics más grande de una isla nueva tiene 20,4 k vértices (Siesta), por debajo del límite de 25 k; la casa tiene 20,6 k.
- El de 41 k vértices que aparece en escena ya existía antes y es igual antes y después; no es de las islas.

**Verificación:**
- `tsc --noEmit`: limpio;
- `vitest run --maxWorkers=2` completo, con `pesado.sh`: 89 archivos pasan y 1 se salta; 1562 pruebas pasan.

## Falta
- La nota de NOVEDADES y la decisión del dueño sobre nombres, precios y bonos: las llevan el coordinador y el dueño. El borrador está en el reporte final.

## Cómo retomar
- Harness: `<scratchpad>/islas-post/h/`. `cap.mjs <out> <para-el-dueno>` hace las capturas; `perf.mjs <out>` mide antes y después alternando, con GC; `decorverts.mjs` cuenta los vértices de cada decoración.
- Servidor: `cd game && npx vite --config <scratchpad>/islas-post/h/vite.islas.config.mjs` (puerto 5223, HMR apagado). Hay que pararlo al terminar.
- Ajustar precios, Reino o bonos: editar `game/src/data/postp3/islas.json`. Las pruebas exigen que el precio suba isla por isla, que la 13 cueste menos de 5,22 T y que la 17 cueste más de 20 T.

## Última actualización
2026-10-29 10:35: terminado. 17 capturas en `<scratchpad>/islas-post/para-el-dueno/`.
