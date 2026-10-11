# MENORES — estado del agente (para retomar si se corta)

Sin spoilers de historia. Encargo: cerrar los 5 «pendientes menores» del punto 7 de la §3 de `../28-traspaso.md`:
1. Música de `ruptura_nacar` (H39): ¿remix de YONOSE o de WHEN I LOSE?
2. Piezas temporales del cielo de la Oleada 3 (`ui/story/o3Sky.ts`) que no esquivan las islas.
3. Maneki en archipiélagos grandes: un lugar libre en vez de dibujarla encima de un edificio.
4. b60 b, b61 a y b61 c: de diálogo a escenas de cine en la región Olvidada (ids de beat intactos, «Volver a ver»).
5. Brillo del rayo de Platillo (`platillo_saucer_cat`).

## Qué estoy haciendo
Nada: los 5 pendientes están hechos y verificados. Sin commit ni push.

## Hecho
- **1. Música de H39:** se queda el remix de YONOSE. La decisión y sus razones están en el doc 24 §5.2, en una nota del doc 18 §5.4 y en el `$doc` de `ruptura_nacar` en `battles.json`; no cambia ninguna pista. Pasan `originalsReserved`, `battleMusic`, `audio` y `momentosAudio` (56/56).
- **2. Cielo O3:** en `ui/story/o3Sky.ts`, el remolcador, los grafitis (cada uno por separado), la nave de latas, el leviatán y el ojo esquivan las islas como la grieta y la costura (`settle`, con suavizado de ~0,4 s). Todos se dibujan encima del mundo, en tres subcapas: de paso < persistentes < la que la escena trae al frente. Mientras corre una escena conservan su encuadre. En reposo, el leviatán nada a la izquierda (0,3) para no tapar el letrero de la grieta y pasa suave del primer plano a su lugar. La cuenta pura está en `SkyLine.clearOnScreen` (`skyLine.ts`).
- **3. Maneki:** `ui/story/manekiSpot.ts` (puro) busca una casilla libre cerca del lugar de siempre: sin nada construido encima ni nada alto delante, evitando árboles y el montón de gatos sin casa. En `rupturas-o4` (y en las demás fixtures, porque el plano del hogar es fijo) pasó de estar encima del Puerto a quedar en la esquina del muelle, a la vista. La escena `h54_maneki` apunta la cámara al target nuevo `maneki` (`registerIslandTarget` en `island/night/stage.ts`) con el mismo encuadre; solo se dibuja «encima de todo» si no hay ninguna casilla despejada.
  Además evita las casillas justo delante de un edificio, porque el letrero del edificio le tapaba la cabeza.
- **4. Cines de región en Olvidada:** `ui/story/o4RegionCines.ts` (se importa desde `o4Cines.ts`) tiene `h60_color` (b60 b), `h61_pagina` (b61 a) y `h61_linea` (b61 c), con `stage: 'region'`, guardas `inOlvidada` y «Volver a ver» con `region: 'olvidada'`. En el director (`rupturasScriptO4.ts`) quedan como `special: 'cine'`, `onlyOn: 'region'`, con `until` y los mismos ids y líneas. En `regions/olvidada.ts`: hush `olvidada_obra` mientras dura el espectáculo de la última ruina (la escena entra al terminar); punto de cámara `polvillo`; drives `pagina`, `escritura` y `linea` (k < 0 devuelve el control a la partida); `reparada` abre también las ventanas de color; y `driveGet('polvillo')`. Una repetición pinta el momento y al terminar devuelve todo (`finish`).
- **5. Rayo de Platillo:** el problema estaba en el arte, no en el juego: el SVG trazado conserva los colores del cono, pero no su luz, y en el lite de 240 px se veía como un bloque lima plano. No hizo falta retrazar, porque el trazo no estaba colapsado (error 9,5 en el completo y 11,6 en el lite). La solución fue `game/scripts/platillo-beam.mjs`, que agrega encima del cono una capa de luz **vectorial** (degradados y desenfoque en modo `screen`, sin raster): halo, paredes que brillan, núcleo bajo el emisor que se apaga hacia abajo, dos anillos de luz y el resplandor del emisor. Va en `platillo_saucer_cat.svg` (completo y lite), es idempotente (entre `<!--nolc-beam-light-->`) y hay que volver a correrla si alguien retraza a Platillo. Los manifiestos y el rig no cambian.
- Pruebas: `tests/o3SkyPlacement.test.ts` (10) y `tests/rupturasO4.test.ts` (ampliado: escenas de región, «Volver a ver» y devolución).

## Falta
Nada.

## Cómo retomar
- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/e9a3a7b3-f411-4663-b81c-1333e78c09b3/scratchpad/menores/`.
- Vite propio en 5391 (HMR y ws apagados, config en el scratch). Chrome headless con CDP en 9391, perfil propio, `--use-angle=metal`.
- Arneses en el scratch: `sky.mjs`/`sky2.mjs` (cielo O3), `cine.mjs` (cualquier cine con capturas), `olv.mjs` (H60→H61 de verdad en Olvidada), `olvr.mjs` (repeticiones), `plat.mjs`/`cmp.mjs`/`zoom.mjs` (Platillo antes y después; copia del SVG original en `orig-svg/`).
- Rutas: `?save=rupturas-o4&scene=island`, `?save=<fixture>&scene=region&region=olvidada`; `__cine.replay('<id>')` tras `await import('/src/cine/index.ts')`.

## Última actualización
2026-10-10 19:16 (cerrado).
