# PODERES — los poderes MULTIDIMENSIONALES (2026-10-28)

Encargo del dueño: «que sus poderes también sean únicos, y muy poderosos (porque por algo son multidimensionales)». Un poder propio, con mecánica propia y puesta en escena propia, para cada uno de los 25 gatos Multidimensionales. Solo en el lado del jugador: la versión enemiga (élites, jefes, planteles) pelea igual que antes.

## Qué estoy haciendo
Cierre: última corrida completa de la suite y el informe para el coordinador.

## Hecho
- Diseño: `docs/part-iii/mecanicas-v2/07-poderes-multidimensionales.md` (tabla de los 25, números, por qué encaja, preguntas al dueño).
- Simulación: `game/src/battle/multidim.ts` — MD_ULTS (los 25), estado por batalla (WeakMap), ganchos, `mdWorth` (IA), `mdChips` (HUD). Tope 45 % (jefes 18 %). Solo lado 0 (`mdOn`).
- Ganchos en `sim.ts` (fire, resolvePaths, resolveImpact, integrate «swirl», hitCat, startTurn, canUlt, extraShots), `ults.ts` (exporta ayudantes; ultWorth → mdWorth), `ai.ts` (×2.5 al valor de un poder, solo lado 0), `boss/lateRigs.ts` (pozos swirl/grin/gaze).
- Escena: `game/src/battle/fx/multidimFx.ts` (sello con el nombre en el color del universo `Signature.frame` + efecto propio de cada gato + golpes `md…`); `ultFx.ts` lo llama; `BattleScene.ts` (3 trozos chicos: fichas, color del corte de ulti, cartel «¡OTRO GATO! (2099)»).
- Datos: `game/src/data/multidimPowers.ts` (25 textos + MULTIDIM_POWER_NOTE); `especies.json`: efecto de la ulti = el poder, structureCap 0.45; los 6 de ulti ilimitada → 1 vez por batalla, daño 100, ★5 «2 veces por batalla». Los 5 que salen de rivales (EMIAU, Bigotón, Ovillo, Estambre, Sir Simón) conservan nombre, daño, usos y recarga.
- Pruebas: `game/tests/multidimPowers.test.ts` (61 casos). Prueba A/B (código con poderes vs HEAD) en el jefe H63: 284 líneas de bitácora idénticas.
- Verificado: `node scripts/verify-missions.ts --all` OK; las 9 pruebas que se cayeron por tiempo bajo carga pasan sueltas (195/195; storyScale H63 = 11,15,10 / 12,15,9 / 10,14,8, igual que antes).
- Grabaciones sin cabeza (servidor «poderes» 5204, ya detenido): los 25 poderes disparados en batallas reales. Clips y capturas en el scratchpad `poderes/`. Arreglado en el camino: una máscara destruida (2099/Ovillo) apagaba el render; Sonrisa ya no muerde el núcleo.

## Falta
- Nada mío. Pendiente del dueño: las preguntas de balance del doc 07 §4.

## Cómo retomar
- `cd game && npx vitest run tests/multidimPowers.test.ts` (15 s).
- Grabar: `CAP=1 BOOST=10 node <scratchpad>/qa3/pp/poderes.mjs <out> <especie,especie,…>` (con el servidor «poderes» arriba; usa la partida h93-final con esa tripulación y la etapa 5-4).
- No hacer commit ni push. No tocar el puerto 5173.

## Última actualización
2026-10-28
