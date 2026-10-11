# REMIX-ARREGLOS · estado

Encargo (2026-10-10): el dueño escuchó las 58 grabaciones y pidió cambiar 4. Lo demás no se toca.
1. `circus_malus.explore` «Cajita de música»: menos tétrica, timbres propios de cajita (no los del original).
2. `yonose_todo.battle`: quitar/sustituir el sinte agregado.
3. `te_odio.battle`: quitar/sustituir las «campanas».
4. `when_i_lose.battle`: el cambio se siente antinatural → hacerlo natural.

Sin commit ni push. Originales intactas. Batallas: misma duración, tempo, loop y secciones.

## Qué estoy haciendo
- TERMINADO. Detalle y mediciones en doc 23 §«Re-arreglos 2026-10-10»; línea en la bitácora del doc 28 §7 (20:10).

## Hecho
- Respaldo de lo anterior (m4a, FLAC, beatmaps, scripts, tracks.json, informes) en `~/Desktop/No one - raster (fuera del repo)/audio-derivados/respaldo-remixes-2026-10-10/`.
- Scripts nuevos en `audio-derivados/scripts/arreglos/`: `alib.py` (FluidSynth + GeneralUser GS con afinación fina por pitch bend y salidas a carpeta de variante), `a_circus.py`, `a_yonose.py`, `a_teodio.py`, `a_wil.py`; análisis `ana_wil.py`, `splice.py`, `novelty.py`, `rough.py`, `spec.py`, `measure.py`.
- Variantes (solo m4a) en `audio-derivados/arreglos/<pista>_<variante>/`. Elegidas e instaladas: circus v2, yonose A, teodio A, wil B.
  - circus: sin el fantasma del original (estaba ~26 cents bajo), sin tic ni línea cromática; cajita real una octava arriba, celesta en Mi mayor, arpa.
  - yonose: sin metales ni «cuerdas» sintetizadas; timbales muestreados; remate con cuerdas + celesta.
  - te ODIO: sin campana FM; las teclas del verso se abren 1,2 → 6 kHz.
  - WIL: intro = segunda mitad de la frase (4–7) + batería propia 14–15; verso termina con el compás 39 (pre-drop de la canción); cornos + trombones muestreados.
- `tracks.json` (loop, lufs, note de las 4), beatmaps de las 3 batallas regenerados (mismas secciones y marcadores), `battles.json` (solo el `$doc` de YONOSE).
- `game/scripts/escuchar.mjs`: marca «RECIÉN» (verde) lo hecho en las últimas 6 h; `escuchar.html` regenerado (solo estas 4 salen RECIÉN).
- Pruebas: typecheck; battleMusic, audio, originalsReserved, momentosAudio, momentos*, momento*, rupturasO2/O3/O4/Story/Reset (15 archivos, 240) verdes; `verify-missions --all` 162 OK.
- Limpieza: venv y caché de pip borrados; FLAC de variantes borrados.

## Falta
- (nada)

## Cómo retomar
- Python: `cd audio-derivados && python3 -m venv venv && venv/bin/pip install numpy scipy soundfile librosa pyloudnorm matplotlib mido`. Necesita `fluidsynth` (Homebrew) y `tools/soundfonts/GeneralUser-GS.sf2`.
- Renderizar una variante sin tocar el juego: `cd scripts/arreglos && ../../venv/bin/python a_wil.py B` (sale en `arreglos/wil_B/`). Instalar en el juego: agregar `install` (`a_wil.py B install`), después actualizar `loop`/`lufs` en `tracks.json` con el informe (`remixes/informes/<id>.json` o `variaciones/informes/`).
- Volver a lo anterior: copiar `respaldo-remixes-2026-10-10/music/*.m4a` → `game/public/music/`, `beatmaps/*.json` → `game/src/data/music/beatmaps/` y los 4 bloques de `respaldo…/catalogo/tracks.json`.
- Los `r_*.py` de `scripts/remixes/` y `v_circus.py` siguen siendo las versiones viejas; las nuevas son los `a_*.py`.

## Última actualización
2026-10-10 20:15
