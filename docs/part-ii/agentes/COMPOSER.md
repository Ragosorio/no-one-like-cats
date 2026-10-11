# COMPOSER · estado (agente de composición, Parte II)

Encargo: piezas nuevas que el código de la Parte II ya pide y nunca se grabaron (ambientes de Sueños, Umbral y Archivo; la fase de jefe del Umbral; motivos y remates). Doc final: `docs/part-ii/30-composiciones-nuevas.md`. Sin commit. Sin spoilers.

## Qué estoy haciendo
- TERMINADO. Entregado el doc `docs/part-ii/30-composiciones-nuevas.md`.

## Hecho
- Inventario de lo que falta (grep del código): ambientes `amb.suenos`, `amb.umbral`, `amb.archivo`; jefe `boss.umbral`; remates llamados por el código: `registro_000` (+ versión *despertando* en los créditos), `eco`, `tromba`, `kit_vuelo`, `swap`, `correctores`, `titiriteros`, `tachon`, `correccion_rota`, `leviatan_gracias`, `canelo_astral`, `sincro`, `ronroneo`, `discovery` en Fa m / Sol m (Invertidas y Cometa piden `discovery` en Do).
- Hallazgo: hoy `audioApi.stinger('eco' | 'tachon' | 'swap' | 'sincro' | 'correccion_rota' | 'registro_000')` llamado directo (no vía `stingerOr`) **no suena nada**: no tiene receta en `audio/stingers.ts` ni SFX con ese nombre.
- Decisión de API de capas (por implementar): extensión `layers` en `tracks.json` (`[{id, file, loop, gain}]`, loops de capa que dividen el loop base) + `audioApi.setLayers(ref, gains|null, {fade})`; un módulo nuevo `src/audio/layers.ts` sincroniza fuentes `AudioBufferSource` con el deck actual (modo buffer) sin tocar `player.ts` (lo edita MOMENTOS).
- Decisión de id: `boss.umbral` se publica como **`amb.hilos`** (variación de la colección `amb`): un id `boss.umbral` sin canción `boss` no resuelve con ref canónica y el reloj de la batalla compararía mal (`currentTrack()`).
- Instalado (fuera del repo): **fluid-synth 2.6.1** (Homebrew, LGPL, 3,2 MB) y el SoundFont **GeneralUser GS v2.0.3** (S. Christian Collins, GitHub `mrbumpy409/GeneralUser-GS`, licencia libre para crear música; 31 MB) en `audio-derivados/tools/soundfonts/`; `mido` en el venv. `clib.sf_render()` renderiza partes MIDI con FluidSynth (reverb/chorus apagados; loops: 3 copias, se queda la del medio → periódico).
- `amb.suenos` (render 2, instrumentos muestreados): Re♭ mayor / Si♭ menor, 80 BPM, base 24 compases (72 s) + capas `calido`, `agua`, `magia`, `hondo` de 12 compases. Archivos en `game/public/music/amb.suenos*.m4a` (≈ 4,1 MB), mapa `beatmaps/amb.suenos.json`. Aún NO está en `tracks.json`.
- `amb.umbral`: Si♭ pedal, 120 BPM, base 32 compases (64 s) + capas `correctores` / `disruptores` / `titiriteros` de 16 (≈ 3,2 MB). Mapa `beatmaps/amb.umbral.json`.
- `amb.archivo`: 60 BPM, 20 compases de 4 s (80 s), un solo archivo (1,8 MB). Mapa `beatmaps/amb.archivo.json`.
- 16 remates `game/public/music/stinger.*.m4a` (registro_000, registro_000_despertando, eco, canelo_astral, sincro, tromba, kit_vuelo, ronroneo, swap, correctores, titiriteros, leviatan_gracias, tachon, correccion_rota, discovery_fa, discovery_sol). Total nuevo ≈ 11,1 MB.
- Código hecho: `src/audio/layers.ts` (nuevo), `api.ts` (`setLayers`), `catalog.ts` (`layers`), `engine.ts` (`layers.watch()`, `__audio.layers()`), `director.ts` (Fonoteca: pistas con capas en modo buffer), `stingers.ts` (`setStingerMotifs` + receta `sincro`), `cine/sound.ts` (registra MOTIFS como respaldo).
- Datos: `tracks.json` (+ `amb.suenos`, `amb.umbral`, `amb.archivo`, `amb.hilos`, `amb.registro_000` al final de la colección `amb`), `director.json` (16 remates con `procedural`; contexto `explore_mystery:cine:h54_maneki` → `amb.archivo`), `battles.json` (H63 titiriteros → `amb.hilos` intro con `loop: true`; victoria desbloquea `amb.hilos`).
- Regiones y escenas: `suenos.ts` + `state/sys/suenosDream.ts` (`dreamLayers`), `umbral.ts` (`forceMix`), `o4Cines.ts` (H58 pone las capas del sueño), `o2Cines.ts` (ronroneo → `stingerOr`), `o3Cines.ts` (canelo_astral, titiriteros H54), `invertidas.ts` (`discovery_fa`), `cometa.ts` (`discovery_sol`), `creditsParteII.ts` (`registro_000_despertando`), `oleada4Flow.ts` (ref `amb.registro_000`; se quitó el motivo duplicado de H62).
- Test actualizado: `tests/oleada3Cine.test.ts` (ahora `amb.archivo` existe). typecheck limpio; tests de audio verdes. Las fallas de la corrida completa (crystal, forms, rupturasO2, momentos) eran timeouts por carga: aisladas pasan (92/92).
- `amb.hilos` (= `boss.umbral`): 160 BPM, 54 s, loop 28 compases (42 s), vocabulario de remix (intro/verse/drop/break/climax/outro), 88 golpes (28 fuertes), 1,1 MB. Mapa `beatmaps/amb.hilos.json`.

## Falta (en orden)
- Nada del encargo. Pendientes opcionales en doc 30 §7 (3 versiones de `titiriteros`, capa L3 de Nácar, `yonose_todo.aftermath` con capas, escuchar con oído §6).
- Headless verificado (doc 30 §5). Limpieza hecha: venv, scratch, perfil de Chrome, caché de pip y la descarga de Homebrew. Se dejaron fluid-synth (3,2 MB) y el SoundFont (31 MB) en `audio-derivados/tools/` para re-renderizar.

## Cómo retomar
- Scripts: `~/Desktop/No one - raster (fuera del repo)/audio-derivados/scripts/composer/` (`clib.py` = voces nuevas + `sf_render` + `finish_layered`; `s_suenos.py`, `s_umbral.py`, `s_archivo.py`, `s_hilos.py`, `s_stingers.py`). Usan `../variaciones/{lib,fin,comp}.py` y `../remixes/rlib.py`.
- Maestros FLAC, PNG (onda + espectrograma) e informes JSON: `audio-derivados/composer/{,img,informes}`.
- Python: el venv se borró. Crear uno: `python3 -m venv venv && venv/bin/pip install numpy scipy soundfile librosa pyloudnorm matplotlib mido`. Hace falta `fluidsynth` (Homebrew) y `audio-derivados/tools/soundfonts/GeneralUser-GS.sf2`.
- Correr: `cd …/scripts/composer && <venv>/bin/python s_suenos.py`.
- Ojo: los loops de base y capas van en compases exactos SIN refinar (si se mueven, se desalinean). Las capas nunca llevan fundidos.

## Última actualización
2026-10-10 12:15
