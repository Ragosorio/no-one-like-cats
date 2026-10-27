# B · CARTA-BORRACHA — estado

- **Qué estoy haciendo**: TERMINADO (entregado al coordinador).
- **Hecho**:
  - **Regla MAREO** `game/src/battle/mareo.ts`: pura y sin el rng de la batalla. Vaivén senoidal (la fase al soltar es una entrada explícita de la pantalla; sin ella, fase sembrada), desvío sembrado chico, donas que curan al lado que las tiene, botellas en cola (como un cataclismo) y karaoke (barra de ulti ×0.8 = +1 turno).
  - `game/src/battle/sim.ts`: ganchos en el constructor, `startTurn`, `fire` (`FireInput & MareoInput`), `resolveImpact` y `meterMul`; `BossWhat` `'dona'`.
  - Vista `game/src/battle/mareoFx.ts`: guía que se mece, donas en la cubierta, botellas verdes. Ganchos de pocas líneas en `scenes/BattleScene.ts` (sin dueño).
  - `battle/ai.ts` (sin dueño, 1 línea): la IA evita las donas. `battle/anime/styles.ts` (sin dueño): estilo `borracha`; `ShipArtLab.ts`: su etiqueta.
  - **Datos** `game/src/data/gateras/regiones.json`: 5 dimensiones, geometría de la Carta, B-1…B-9 (B-6…B-9 `playable: false`), notas al margen y lo que no entra (`later`).
  - **Estado** `game/src/state/sys/gateras.ts`: `ext.gateras` opcional con normalizador (nunca resta; uno roto se aparta a `ext.gaterasBroken`), huellas (3 por primera victoria, 10 por jefe), precio `max(piso, incomePerSec/mareaMult × s)`, `buyGatera`/`openGatera` (flag `gatera:p3d_borracha` + contador `feature_p3_gatera_borracha`), `won_p3d_borracha_<n>`. Registrado en `state/index.ts`.
  - **Batallas** `game/src/state/sys/gaterasBattles.ts`: `buildSiege` (zona 3 prestada, tipo `errand`: sin cataclismo de zona), poder `max(3000, flota × 0.85–1.05)`, élite con banda `jefe`, paleta nocturna y estilo `borracha`; `applyGateraResult`; `gateraLootPreview`.
  - **Escena** `game/src/scenes/GaterasMapScene.ts`: el cuaderno (hojas cosidas, renglones, margen, cera, cinta), tu isla y el faro con su haz, 6 rasgaduras con huellitas (la primera es la gatera), la Borracha como televisor viejo con la caricatura nocturna y los 9 nodos, 4 hojas en blanco «aquí no he llegado». Cámara como el Diario del Mar, tarjeta con estimación honesta, TRIPULACIÓN, BITÁCORA (panel de A), DIARIO DEL MAR, CARTA. Primera visita: su mano dibuja (M2), Maneki (M3–M4), compra (M5), la gatera se cose y aparece B-1 (M6). Las líneas salen del beat `b68_carta` de A. `storyStage = 'cajas'` para el director de A.
  - **Flujo** `game/src/app/cajasFlow.ts`: `goCajas`, `startGateraBattle` (vuelve a la Carta y entinta la ruta), `cajasGoal` (IR de H68/H69 en la isla, el Diario y la Carta), `initCajas` (usa `setGateraTap` de A: la gatera del faro lleva a la Carta cuando la Borracha está abierta).
  - Entradas: botón **CAJAS** en el Diario del Mar (`MapScene.ts`, desde H68), IR de misiones (`IslandScene.ts`, `MapScene.ts`), ruta dev `?scene=cajas` (`main.ts`).
  - **Música**: `drunck.barra` en la Carta (si existe en `tracks.json`), planes `p3d_borracha_1…5` → `drunck.battle` en `data/music/battles.json`; sin pista, sigue la música que había.
  - **Pruebas**: `game/tests/mareo.test.ts` (13) y `game/tests/gateras.test.ts` (11), con `h65-normal` (precio 15 B a 17,0 M/s).
  - **Élite B-5**: capitana con la pintura `dona_police_cat` (**candidato: falta aprobación del dueño**); la especie de datos sigue siendo `c_terron` (solo cambia el arte, en `regiones.json › captainArt`). El hablante `OFICIAL DONA` de A sigue con su suplente: A puede pasarle `dona_police_cat`.
  - **Balance** (sondas en `<scratch>/b-carta/cal/`, 24 peleas como la estimación): la tripulación de `h65-normal` gana B-1…B-5 siempre (2–5 turnos), como pasa con las batallas de historia de la Parte II con esa tripulación; con 5 raros Nv40 gana en 4–14 turnos; con 4 comunes Nv35, B-4 92 % y B-5 88 %. Nunca es un muro.
  - **Recorrido sin cabeza** (puerto 5611, Chrome con ANGLE Metal y vsync): compra 15 B, B-1…B-5 con bot, 15 huellas, `won_p3d_borracha_5`, la gatera de A lleva a la Carta; 60 fps en la Carta, la batalla y la isla. Capturas: `<scratch>/b-carta/out/`.
  - Verde: `tsc`, `verify-missions --all` (166 OK) y la suite completa (614/614).
- **Falta** (en orden):
  1. Vite y Chrome apagados; perfil borrado.
  2. Pendientes documentados (no son de esta porción): el desvío «Trastienda», La Ronda, los 2 encargos, los encuentros, B-6…B-9 y El Cadenero, los orbes de Hipólito de B-5 (la especie no existe todavía).
- **Cómo retomar**:
  - Pruebas: `cd game && npx vitest run tests/mareo.test.ts tests/gateras.test.ts`.
  - Vite: `<scratch>/b-carta/restart-vite.sh` (puerto 5611, HMR y watch apagados: **reiniciar tras cada cambio**).
  - Recorrido: `cd <scratch>/b-carta && node drive.mjs jobs-7.json out` (pasos con `pump` = máquina de estados `stage.js`; capturas en `out/`).
  - Calibración: `<scratch>/b-carta/cal/` (`CAL_FILE=cal.test.ts CAL_FX=h65-normal …vitest run --config cal/vitest.config.mjs`).
- **Última actualización**: 2026-10-13 13:00 (cerrado).
