# MOMENTO-YONOSE-TODO — estado del agente

Sin spoilers. Momento musical de YONOSE TODO: el final de la Parte II, que sigue en los créditos. Carpeta
`game/src/momentos/songs/yonoseTodo/`, ruta DEV `?momento=yonose_todo`, Vite propio en el puerto 5371.

## Qué estoy haciendo

Nada: el encargo está terminado y entregado al coordinador (sin commit).

## Hecho

- Estilo «ANIMATIC»: storyboard a lápiz (líneas que hierven en dos y en cada bombo, sombreado, papel, tira de tiempos)
  que se calienta a acuarela (manchas que se esparcen desde un punto) y termina en la pintura del juego. El arranque en
  frío despinta el cuadro real del juego. Todo shader/vector, cero raster.
- Carpeta `game/src/momentos/songs/yonoseTodo/`: `times.ts`, `score.ts` (canción entera 0 → 208,6, cero advertencias;
  reanudación desde el prechorus), `bridge.ts`, `finale.ts`, `paper.ts`, `set.ts`, `dream.ts`, `credits.ts`, `ui.ts`,
  `pencil.ts`, `verbs.ts`, `stage.ts`, `index.ts`. Hoja y guía en el doc 29 §18.
- Gancho `registerFinaleMomento` (plomería en `o4Finale.ts`, una vez cada paso y en orden); «Volver a ver» del final va
  por `playFinale` sin efectos de misión; Fonoteca y `ext.momentos`.
- Onsets de `yonose_todo` regenerados por grilla (`audio-derivados/scripts/onsets_yonose.py`).
- Motor (retrocompatible): `playMomento(id, { def })`, `PromptTheme.star/font`.
- Pruebas: `tests/momentoYonoseTodo.test.ts` (15) + `tests/momentos*`, `rupturasO4`, `originalsReserved`, `cine`: 136/136.
  Typecheck limpio; `verify-missions --all` 162 OK.
- Medido (vsync, audio real, carga ~77): deriva 0/0 ms; bombo → cuadro mediana 9,4 ms (p99 24,4); 59 fps en alta y baja;
  +6 dB; heap 62 → 85 → 91 MB; flujo real H64→H65 con fixture correcto.

## Falta

Nada del encargo.

## Cómo retomar

- Hojas de contacto (6) en `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/e9a3a7b3-f411-4663-b81c-1333e78c09b3/scratchpad/yonose/sheets/`.
- Ruta DEV: `?momento=yonose_todo&scrub=1&auto=great` (`window.__momento.render(m)`). Flujo real: `?save=rupturas-o4&scene=island`,
  poner H58–H63 hechas y H64 activa, y `__oleada4.playMentira()`.
- Vite propio en 5371 con HMR apagado (config temporal en scratch; borrada).

## Última actualización

2026-10-10 18:58
