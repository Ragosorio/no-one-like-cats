# Brief común para los agentes de Momentos musicales (INTERNO)

Léelo completo antes de empezar. Tu encargo particular (canción, misión y estilo) viene en el mensaje con el que te lanzaron.

## Qué es un Momento (palabras del dueño)
- Cada canción original del dueño tiene su **cinemática interactiva**, metida naturalmente en la historia: «casi como un video interactivo».
- **No se puede saltar** la primera vez. Hay botones al ritmo. Presionar o no presionar **solo cambia la animación**; el resultado siempre es el mismo.
- La animación ocupa **TODA la canción**, sin recortes. **Cada sonido, golpe y bajo tiene un propósito visible.**
- **Más fuerte:** la canción suena +6 dB y nada la tapa.
- **Cada Momento tiene un estilo de arte DISTINTO**, de acuerdo con su historia. Ninguno puede parecerse a NEÓN CEL, el de LIKY FIGHT.
  - Canción frenética → más dopamina y más interacción.
  - Canción lenta → cuenta más historia, de maneras distintas y con más estilos de animación.
  - **El entorno puede cambiar de estilo en la misma escena:** los mismos elementos, redibujados en otro arte.
- El dueño vio LIKY FIGHT y le encantó («es justo lo que esperaba»). Ese es el nivel mínimo de calidad.

## Lo que ya existe (úsalo, no lo reinventes)
- **Motor:** `game/src/momentos/`. Documentación completa en `docs/part-ii/29-momentos-musicales.md`. Ahí están:
  - el formato de coreografía y las direcciones de tiempo;
  - los verbos;
  - el API de stage;
  - los archivos de onsets por stem;
  - la regla de reacciones siempre activas;
  - el volumen, la latencia, las pruebas y las mediciones;
  - §3.1, los estilos.
- **Ejemplo trabajado:** `game/src/momentos/songs/likyFight/` (score, stage, shots, verbs, ships). Cópiale la estructura, **no el estilo**.
- **Onsets por stem** de las 6 canciones: `game/src/data/music/beatmaps/<id>.onsets.json` (kick, snare/acentos, perc, bajo con altura y duración, melodía, voz). Script: `~/Desktop/No one - raster (fuera del repo)/audio-derivados/scripts/onsets.py`.
- **Análisis de cada canción:** `docs/part-ii/18-catalogo-musical.md` §4 (secciones, marcadores, golpes, tonalidad, carácter).
- **Historia:** `docs/part-ii/13-guion-parte-ii.md` y los docs de cada oleada (22, 25, 26, 27). Tienen spoilers; tú sí puedes leerlos.
- **Ganchos ya preparados** en el código:
  - Batallas: `registerFaseInterlude(battle, fase, fn)` en `game/src/battle/fases.ts`. La batalla espera mientras corre el Momento.
  - Final: `registerFinaleMomento(fn)` en `game/src/app/o4Finale.ts`.
  - Busca `// MOMENTO:` en el código.
- **Para registrar tu Momento** en «Volver a ver», en la Fonoteca (desbloquea la canción original al completarse por primera vez) y en el guardado (`ext.momentos`), copia lo que hace LIKY FIGHT.

## Reglas duras
- Determinismo intacto: la batalla en pantalla y el estimado del worker dan lo mismo. El Momento solo se ve entre fases; nunca cambia el resultado.
- El guardado solo difiere en campos cosméticos (`ext.momentos.<id>`). Pruébalo con tres bots: todo perfecto, todo fallado y sin input.
- **Accesibilidad:**
  - Máximo 3 destellos de pantalla completa por segundo.
  - Sin destellos rojos saturados.
  - Respeta «reducir movimiento».
  - Pausa con Esc, y también al ocultar la pestaña.
- **Prohibido:**
  - Imágenes raster en el repo. Todo es vector, procedural, shader o fuente.
  - Tocar los originales en `~/Desktop/No one - raster (fuera del repo)/audio-derivados/originales/` (movidas ahí el 2026-10-10 con `SHA256SUMS`; antes en `~/Desktop/NO ONE LIKE CATS sounds/`).
  - Commit o push.
- **Audio:** solo a través de `src/audio/api.ts`. Ninguna canción original suena fuera de tu Momento (lo vigila `tests/originalsReserved.test.ts`).
- **Herramientas:** el dueño autorizó instalar herramientas para escuchar y analizar mejor (pip, brew), siempre fuera del repo, en `audio-derivados/`. El disco está justo, ~5 GB libres: revisa antes de bajar algo grande.
- **Archivos de otros agentes:** no los toques. El motor común (`src/momentos/runner.ts`, `anime/kit.ts` y similares) **sí** lo puedes extender si tu estilo lo necesita:
  - solo de forma retrocompatible;
  - vuelve a leer el archivo justo antes de editarlo;
  - corre `tests/momentos*`.

  Hay otros agentes de Momentos trabajando en paralelo; cada uno vive en `src/momentos/songs/<suId>/`.

## Verificación (obligatoria, no declares terminado sin esto)
1. `cd game && npm run typecheck && npm test && npx tsx scripts/verify-missions.ts --all`. Si fallan archivos de otros agentes, repórtalos y no los arregles.
2. Headless con audio real:
   - Vite en **tu propio puerto** (te lo da tu encargo), con HMR apagado y `server.ws: false`, desde una config temporal en tu scratch.
   - Chrome con `--use-angle=metal --autoplay-policy=no-user-gesture-required`, con **vsync ENCENDIDO** para medir FPS (el doc 29 explica por qué) y perfil propio.
   - Corre `?momento=<id>` y el flujo real de la misión con una fixture.
   - Arma contact sheets **de toda la canción** y una **tira de prueba de sincronía**.
   - Míralas tú mismo con ojo crítico e itera hasta que cualquier cuadro sirva como póster.
3. Mide la sincronía (onset contra cuadro dibujado, mediana y p99 en toda la canción), el FPS en calidad alta y baja, y la memoria antes y después de dos reproducciones.

## Archivo de estado (obligatorio)
Mantén `docs/part-ii/agentes/MOMENTO-<CANCIÓN>.md` al día. Va en español y sin spoilers, con estas secciones:
- «Qué estoy haciendo»
- «Hecho»
- «Falta»
- «Cómo retomar»
- «Última actualización»

Actualízalo después de cada hito, cada 20–30 minutos como máximo. Te pueden cortar por el límite de uso.

## Al terminar
- Agrega tu hoja de coreografía y tu guía de estilo como sección nueva en el doc 29.
- Agrega una línea a la bitácora del doc 28.
- Limpia el scratch, el perfil de Chrome y Vite. Deja como máximo 6 contact sheets.
- Reporta, de forma concisa: cómo se ve y se siente cada sección, las decisiones de estilo, las cifras de sincronía, FPS y memoria, las pruebas, las rutas de las contact sheets y los archivos que tocaste fuera de tu carpeta.
