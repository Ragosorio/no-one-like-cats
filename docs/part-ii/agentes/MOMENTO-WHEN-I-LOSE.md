# MOMENTO-WHEN-I-LOSE — estado del agente

Sin spoilers. Momento musical de WHEN I LOSE en H35 (batalla del Bibliotecario). Carpeta
`game/src/momentos/songs/whenILose/`, ruta DEV `?momento=when_i_lose`, Vite propio en el puerto 5331.

## Qué estoy haciendo

Nada: el encargo está terminado (19:10).

## Hecho

- Estilo «tinta y pergamino»: el set se dibuja una vez en color de manuscrito iluminado y un filtro propio (`ink.ts`)
  lo redibuja por píxel en sumi-e (papel, aguadas, pincel que «hierve») o iluminado (color, contorno sepia, pan de
  oro). Un frente con borde de oro pasa de un arte al otro dentro de la misma escena.
- Partitura completa (0 → 219,5, sin cortes): 17 inputs calificados + 4 opcionales (taps, holds, una elección).
- H35 con dos fases solo de presentación (`rupturas.ts`); el Momento entra por `registerFaseInterlude`.
- `BattleMusic.suspend()` levanta el ducking y el paso-bajo de RUIDO mientras suena el Momento.
- Motor (retrocompatible): `Studio` acepta un horneado propio; los prompts aceptan un tema de color por set.
- Pruebas `tests/momentosWIL.test.ts` (12/12): partitura sin advertencias, mismo resultado, destellos, y la pelea de
  H35 idéntica tiro a tiro con y sin la división en fases.
- Medido en tiempo real (canción entera, vsync, máquina muy cargada): 60 fps (p99 20,8 ms), deriva 0 ms, +6 dB,
  pico −13,1 dBFS, nota S.

- 16:05–16:40: sumi-e con tono por contraste local (los gatos oscuros ya no son manchas negras: se leen caras y
  pelaje); la línea fina se aclara dentro de texturas. Ola de tinta redibujada como ola que rompe (garra, estrías de
  papel, espuma). Prompts sobre Canelo ahora encima de su cabeza (ancla `caneloP`), nunca sobre la cara. Valle: pincel
  grande visible + ensō que se traza durante el valle. Arranque: el frente de tinta come el cuadro en 1,6 s.
- 16:40–16:45: verso con cortes de duelo (empuje a nuestra proa, contraplano en su cubierta); bajo el agua ya es
  noche (sin velo frontal, sin levantar oscuros) y la linterna es la única luz; el coro (galería y lámina) son las
  pinturas sobre nimbos de oro, no siluetas-mancha; lámina del duelo con la luna entre los barcos; anclas de prompts
  dentro del área segura (el primer ¡ILUMINA! va en la linterna); sello 黙 ya no choca con ¡ZAS!.
- Hojas de toda la canción: `sheets/s1-intro-verso`, `s2-break-coro`, `s3-oro-puente`, `s4-final` (revisadas).
- Flujo real H35 (fixture, bot perfecto): el Momento entra en la batalla real, nota S, «capa 2/2» después, Fonoteca
  desbloquea WHEN I LOSE, `ext.momentos.when_i_lose` = {best S, plays 1}; la pelea sigue hasta el final.
- `tests/momentosWIL.test.ts`: la prueba de 12 peleas subió su límite a 600 s (bajo carga tardaba 160–190 s).
- 17:00–17:40: la sim no cambia durante el Momento (huella turno/viento/rng/hp idéntica antes y después); la pelea
  sigue y termina. Arranque: las láminas se construyen y dibujan antes del reloj; el set completo (coloso, coro,
  sala ahogada) se dibuja una vez a tamaño real antes del reloj. Medidas preliminares (carga 60–98): sincronía
  bombo mediana 9 ms, deriva 0; FPS alta ~58–60 (p99 31–38), baja 59,8 (p99 22,6); memoria 59→75→76 MB, audio a 0.
- 18:00–18:30: el flujo real con bot «fallo» mostró la última lámina como una tira: Pixi convierte en *render
  group* el contenedor que se pasa a `render()`, y la lámina preconstruida ignoraba la máscara del padre. Arreglado:
  `prewarmDraw` dibuja a través de un contenedor desechable. `momentos/index.ts`: los 9 s de espera de la
  decodificación cuentan desde que el set está listo (con carga 140+ el Momento quedó una vez sin canción).
- Pruebas: momentos*, momentoHemkade, momentoCircusMalus, originalsReserved (7+1 archivos, 92 pruebas) pasan;
  `npm run typecheck` limpio; `verify-missions --all` 162 OK.

## Falta

No queda nada del encargo. Pulido, flujo real de H35, sincronía, FPS, memoria, pruebas, doc 29 §14, bitácora del doc 28
y limpieza: todo hecho. Medidas finales en el doc 29 §14.5.

Decisión de diseño (documentada, no pendiente): mientras se arma el set (~1 s, antes de que suene la canción) la
batalla se queda quieta con la música callada. Es el mismo cuadro congelado que la tinta se come al arrancar («SHHH»),
así que se lee como parte del Momento. Reducirlo exigiría repartir el horneado y la preconstrucción de las láminas a lo
largo de la canción, que es justo lo que causaba tirones; no vale el riesgo.

- 19:20: «¡FUEGO!» del coro 3 ahora va arriba al centro con contorno ocre y aguada oscura debajo (las palabras de
  pincel en oro): se lee completa en los tres planos (cerca de Canelo, cerca de él, general), en calidad alta y baja
  (franja inferior de `sheets/s3-oro-puente.jpg`). `momentosWIL` 12/12, typecheck limpio.

## Cómo retomar

- Scratch (sesión f8d0e043…): `<scratchpad>/wil/`. Herramientas: `sheet.mjs` (`HOP`, `TIMES`), `sync.mjs [high|low]`
  (sincronía de toda la canción + tira), `perf.mjs high 2` (FPS + memoria), `h35.mjs perfect|miss '' 0|1` (flujo real
  con huella de la sim; fixture `rupturas-h35.json`), `slow.mjs` (cuadros largos). Usan `node_modules` del scratch
  `momentos/`.
- Hojas que quedan: `sheets/s1-intro-verso`, `s2-break-coro`, `s3-oro-puente`, `s4-final`, `h35flow`,
  `sync-strip-high`.
- Vite: `cd game && npx vite --config <scratch>/wil/vite.wil.config.mjs` (puerto 5331). Perfiles de Chrome, frames y
  caché de Vite ya se borraron.

## Última actualización

2026-10-10 19:25
