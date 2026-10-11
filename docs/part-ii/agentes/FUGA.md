# FUGA — memoria que crece en sesiones largas

## Qué estoy haciendo
Nada: encargo terminado.

## Hecho
- Reproducido con Chrome headless propio (CDP 9401, daemon HTTP 5402, Vite 5401) con `save-fin` (entrando por CONTINUAR)
  y `?save=rupturas-o4&scene=island`. Medición tras GC por CDP (`HeapProfiler.collectGarbage` ×3 +
  `Runtime.getHeapUsage`, que separa heap JS y `backingStorageSize` = ArrayBuffers).
- Antes del arreglo (16 cambios de escena por vuelta): heap JS +0,8 a +5 MB/vuelta, pero los **ArrayBuffers** suben
  128 → 161 → 194 → 212 MB (+34, +32, +18 MB/vuelta). Eso es lo que vio QA.
- Causa raíz 1 (heap snapshots comparados): Pixi v8 guarda en `BigPool` los `GraphicsContextRenderData` de cada
  Graphics «no agrupable» destruido, cada uno con su propio batcher. Los búferes de esos batchers solo crecen y se
  reparten al azar al reutilizarse, así que el pool se va inflando (en la carta: 458 libres con 119 MB).

- Arreglo 1: `core/pixiFixes.ts › trimPixiPools()` (destruye los `GraphicsContextRenderData` libres y deja como
  máximo 4096 `BatchableGraphics` libres), llamado desde `core/scenes.ts › swap` tras destruir la escena vieja.
  Medido después: ArrayBuffers 81 → 89 → 101 → 101 → 101 MB (se estabiliza; antes no paraba).
- Nota de la carta: `island/night/mapNight.ts` (`avoid` + `noteShift`) desliza las notas a mano fuera de las tiras
  verticales de las hojas (etiqueta `sheetTab` en `scenes/MapScene.ts` y `regions/mapO4.ts`).
- Prueba nueva `tests/sceneLeaks.test.ts` (pools + `noteShift`), pasa junto a `pixiLeak`. typecheck limpio.

- Causa raíz 2 (snapshots de 3 tiempos tomados en la carta): el sistema de texto de Pixi dejaba una clave nula en
  `_activeTextures` por cada texto distinto mostrado (cada segundo de un reloj, cada aviso): ~1 700 por vuelta y
  crece también con el tiempo. Arreglo en `core/pixiFixes.ts` (borra la clave). Prueba en `sceneLeaks.test.ts`.
- `scenes/IslandScene.ts`: `__island`/`__islandDev` solo en DEV (en producción retenían la última isla, ~0,6 MB).
- Nota de la carta verificada con capturas en 1600×900, 1200×900 y 2000×800: con la tira debajo, la nota se corre a
  un lado; en 2000×800 la cámara no llega a ponerla debajo.
- verify-missions --all: 162 OK, 0 faltantes.

- Medición final tras GC (CDP), máquina cargada por otros agentes, ruido ±1,5 MB por punto:
  - isla ↔ carta ×10 (`?save=rupturas-o4&scene=island`): heap 93,5 → 98,6 MB, +0,56 MB/vuelta de media (las 5 últimas
    +0,36); ArrayBuffers planos en 54,4 MB.
  - Parte I (`late-game`, carta → batalla → isla → batalla → carta → isla) ×6: +0,58 MB/vuelta de media (las 3 últimas
    +0,4); ArrayBuffers planos en 49,9 MB.
  - Vuelta larga `save-fin` (16 cambios: isla, carta, 8 regiones, 2 batallas) medida en la carta ×6: heap
    74,2 → 78,2 → 80,8 → 82,0 → 83,7 → 83,5 (incrementos que bajan: +4, +2,6, +1,2, +1,6, −0,2); ArrayBuffers
    69,6 → 77,6 → 89,0 → 88,9 → 88,8 → 88,9 (se llenan cachés de regiones 3D y audio y paran).
  - Antes, la misma vuelta: ArrayBuffers +34, +32, +18 MB por vuelta sin techo.
  - Lo que queda (snapshots de 3 tiempos, 2,6 MB en 2 vueltas): búferes de índices de los batchers principales de
    Pixi (crecen hasta el máximo usado), el pool de lotes de texturas, formas de V8 y, solo en DEV, `__battle`. Todo
    acotado.
- Pedido del coordinador (cerrar el roce): la nota también esquiva los rótulos de nombre de las islas de la Parte II
  (etiqueta `isleName` en `MapScene › isleChrome`, que usan también las islas de `mapO4`); `noteShift` ahora prueba
  correrse de lado o arriba/abajo y elige el desplazamiento más corto que quede libre y dentro de la pantalla.
  Capturas en 1600×900, 1200×900 y 2000×800 con la tira y «Isla de las Páginas Hundidas» al lado: sin solapes
  (comprobado también por cajas). `sceneLeaks` + `pixiLeak` 10/10, typecheck limpio.
- Sin cambios de comportamiento: la batalla, las partidas y el audio no se tocaron.

## Falta
Nada.

## Cómo retomar
- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/e9a3a7b3-f411-4663-b81c-1333e78c09b3/scratchpad/fuga/`
  (`daemon.mjs` en 5402 con `/gc`, `/gcfull`, `/snap`, `/count`; `cycle.mjs <fixture|-> <vueltas> <pasos>`;
  `loadsave.mjs save-fin.json`; `snap.mjs`, `group.mjs`, `big.mjs` analizan heap snapshots).
- Vite: `npx vite --config <scratch>/vite.fuga.config.mjs` (puerto 5401). Los `.heapsnapshot` pesan ~180 MB: bórralos.

## Última actualización
2026-10-10 20:07
