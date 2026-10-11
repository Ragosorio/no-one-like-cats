# MOMENTO-HEMKADE — estado del agente (para retomar si se corta)

Sin spoilers de historia. Documento técnico: `docs/part-ii/29-momentos-musicales.md`.

## Qué estoy haciendo

Nada: terminado (2026-10-10 18:25). Falta solo el OK del dueño.

## Hecho

- Estilo elegido: **COLOSO / GRABADO**. Los drops van en 3D real (three.js) con sombreado toon de bandas duras y
  contorno de color; los breaks son **láminas de grabado** (los mismos objetos 3D redibujados con tramas de buril que
  se dibujan línea a línea con la melodía). Paletas propias (océano → tormenta → oro → estrellas), sin tramas de manga.
- Carpeta `game/src/momentos/songs/hemkade/`: `glsl.ts`, `mats.ts` (toon + contorno), `leviathan.ts`, `chains.ts`,
  `ship.ts`, `world.ts` (el mundo 3D), `shots.ts` (cámaras), `stage.ts`, `verbs.ts`, `palettes.ts`, `score.ts`,
  `index.ts` (registro + gancho `registerFaseInterlude('ruptura_leviatan', 'cielo')`).
- Partitura completa (0 → 218,65): 59 prompts, 51 calificados (49 tap, 4 hold, 3 mash, 3 choice), 687 cues.
- Prueba `game/tests/momentoHemkade.test.ts` (12, en verde).
- Import agregado en `songs/index.ts`.
- 16:05–16:45, pulido con hojas de contacto de toda la canción: el abismo ya muestra al
  coloso pasando bajo el casco (niebla de media agua clara, cielo submarino); el ojo en lo hondo ya no sale negro (la
  cámara se quedaba arriba del agua: un plano cuyo sujeto está bajo el mar se queda abajo); plano nuevo `rise` (cadena
  que sale del mar hacia la línea) al empezar el build; tomas de sello en teleobjetivo; cenit del drop 1 más claro;
  el mar de nubes ya no tapa al coloso cuando la cámara está alta y él sigue en el mar; **bug**: la tripulación se
  dibujaba toda en el mismo punto (buffer de proyección compartido) — ya cada gato en su lugar de cubierta.
- Clímax: la cámara de taladro (`spiral`) más alta sobre la piel (se lee el cuerpo, las cadenas y el ojo, no una
  pared); tripulación repartida a lo largo de la cubierta (antes se amontonaba); «reducir movimiento» también calma
  la cámara 3D (dutch ×0,3, giro del taladro ×0,3, estelas a la mitad).
- Flujo real de H57 headless (`h57.mjs`, fixture `rupturas-o3` → `__o3.jump('H57')` → `startStoryBattle`): la batalla
  entra al Momento en la fase `cielo`, el sim **no cambia** entre el inicio y el final del Momento (huella idéntica:
  turno, viento, gravedad, rng, PV de casco y gatos), la batalla sigue en el cielo y la partida solo gana
  `ext.momentos.hemkade` (perfecto → `best: 'S'`, fallado → `'C'`).
- Medido (canción entera, tiempo real, audio, vsync, máquina con carga 75–110 por los otros agentes): deriva 0 ms
  (mediana y p99, también tras Esc y pestaña oculta); sonido → cuadro en toda la canción: bombos mediana 8,3 ms /
  p99 21,1 (alta), acentos 7,2 / 39,1; FPS alta p50 16,7 / p95 20,1 / p99 27,9 ms, baja 16,7 / 19,8 / 22,9; costo por
  cuadro ~2 ms de CPU; memoria 60,1 → 83,8 → 88,4 MB con three.js en 0 geometrías / texturas / programas tras cada
  Momento y audio en 0 bytes. Tira de sincronía del drop: bombos máx 19,1 ms, acentos máx 18,8.
- Doc 29 §16 (hoja, guía de estilo, accesibilidad, mediciones, pruebas, herramientas), fila de §2; bitácora y fila del
  doc 28.
- Prueba nueva: H57 con la misma semilla da la misma pelea con el interludio registrado o quitado y con el spec
  clonado como al worker (12 pruebas en verde).

## Falta

Nada. (Solo el OK del dueño para publicar.)

## Cómo retomar

- Carpeta: `game/src/momentos/songs/hemkade/`. Ruta DEV: `?momento=hemkade`.
- Vite propio en el puerto **5351** (nunca 5191): `cd game && npx vite --config <scratch>/hemkade/vite.hem.config.mjs`.
- Hojas de contacto finales (fuera del repo): `<scratch>/hemkade/sheets/hemkade-cancion-alta.jpg` (64 cuadros, bot
  perfecto, alta), `hemkade-cancion-fallos-baja.jpg` (32, todo fallado, baja), `hemkade-sincronia.jpg` (tira),
  `hemkade-h57-flujo.jpg` (flujo real de la misión).
- `h57.mjs <perfect|miss|none>`: flujo real de H57 + huella del sim; `full.mjs` (MQ=high|low, VSYNC=1) + `lagall.mjs`;
  `mem.mjs`; `strip.mjs` (G=<game> T0=24). Perfiles de Chrome y frames ya borrados (se recrean solos).
- Herramientas en `<scratch>/hemkade/`: `list.mjs <nombre> "auto=great" t1,t2,… [cols]` (hoja de contacto de instantes
  exactos), `sheet.mjs`, `shot.mjs`. Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/f8d0e043-0e92-467b-a5d4-e9b12fa6c140/scratchpad/`.

## Última actualización

2026-10-10, 18:25 — terminado; Vite y Chrome apagados, scratch limpio (4 hojas).
