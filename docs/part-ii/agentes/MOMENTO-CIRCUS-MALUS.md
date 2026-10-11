# MOMENTO-CIRCUS-MALUS — estado del agente (para retomar si se corta)

Sin spoilers de historia. Documento técnico: `docs/part-ii/29-momentos-musicales.md` §15. Brief: `BRIEF-MOMENTOS.md`.

## Qué estoy haciendo

Nada: encargo terminado, a la espera del OK del dueño.

## Hecho

- Estilo: «FUNCIÓN DE FERIA 1930» — caricatura rubber-hose proyectada en película (nitrato B/N ↔ Technicolor de dos
  tiras ↔ color verdadero), escenario de feria en simetría perfecta; el final raro la rompe (la película se rasga y se
  quema). Distinto de NEÓN CEL, tinta/pergamino, grafiti y coloso/grabado.
- Carpeta `game/src/momentos/songs/circusMalus/`: `film.ts` (post propio + horneado de gatos `bakeToon`), `art.ts`
  (dibujo vectorial del set), `stage.ts` (set, reacciones siempre encendidas, gatos simétricos), `verbs.ts`, `shots.ts`
  (planos a pantalla completa), `score.ts` (la canción entera, 29 prompts), `index.ts` (registro + gancho
  `registerFaseInterlude('umbral_correctores', 'el_plan')`), `hook.ts`.
- `game/src/momentos/songs/index.ts`: una línea de import.
- Onsets regenerados a grilla: `game/src/data/music/beatmaps/circus_malus.onsets.json` con
  `~/Desktop/No one - raster (fuera del repo)/audio-derivados/scripts/onsets_grid.py` (nuevo). Copia del anterior en el
  scratch (`ana/onsets.orig.json`).
- Prueba `game/tests/momentoCircusMalus.test.ts` (13, en verde). `tests/momentos*` en verde. `verify-missions --all` OK.
- Verificación headless: hojas de contacto de toda la canción, tira de sincronía, deriva/FPS/memoria, flujo real de H62.
- Doc 29 §15 (hoja + guía de estilo + medidas) y fila §2; doc 28 (tabla §2 y bitácora).

## Falta

No queda nada del encargo.

## Cómo retomar

- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/e9a3a7b3-f411-4663-b81c-1333e78c09b3/scratchpad/circus/`
  (`lib.mjs`, `list.mjs`, `sheet.mjs`, `full.mjs`, `strip.mjs`, `mem.mjs`, `h62.mjs`, `vite.circus.config.mjs`;
  hojas en `sheets/`). Si se recrea, el `node_modules` es un enlace al de `.../f8d0e043-.../scratchpad/momentos/`.
- Vite: `cd game && npx vite --config <scratch>/circus/vite.circus.config.mjs` (puerto 5361, nunca 5191).
- Ruta DEV: `?momento=circus_malus` (`&scrub=1&auto=great` para hojas). Flujo real: `node h62.mjs perfect` (escribe la
  fixture `rupturas-o4` + H58–H61 desde una página sin el juego y lanza `startStoryBattle('umbral_correctores')`).
- Trampa: dos llaves sobre el mismo prop en el mismo instante (corte + tween) no se encadenan; el tween va 20 ms después.

## Última actualización

2026-10-10, 18:15 — terminado.
