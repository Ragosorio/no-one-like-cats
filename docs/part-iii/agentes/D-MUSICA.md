# D · MUSICA-P3 — Parte III, porción vertical

- **Qué estoy haciendo**: nada en curso. Todo entregado; falta solo la escucha del dueño (§12 de `investigacion/audio-real.md`).
- **LISTO PARA C (2026-10-13, ~10:25)** — Drunck ya está en el juego:
  - `game/public/music/drunck.m4a` (original, −16,0 LUFS, TP −7,1 dBTP, 1,5 MB; alineada a 0 muestras con la fuente).
  - `game/src/data/music/beatmaps/drunck.json`: 165 BPM, **compás 1 = 0,000 s** (medido), 201 tiempos, 51 compases,
    secciones `intro` c1–9 · `drop` c9–17 · `drop2` c17–25 · `drop3` c25–33 · `break` c33–41 · `climax` c41–49 ·
    `outro` c49–fin (cola de reverb). Marcadores de 04 §3: `kick_1..6` (golpes sueltos de la intro), `roll_1..3`
    (c4,75 · c8,75 · c40,75), `first_drop` (¡SALUD!), `perc_rise`, `breath_1..4` (c16 · c32 · c40 · c48; medidos sin
    bombo), `hats_in`, `kick_cut` (c24,649 = 34,399 s) → `kick_back` (c25), `synths_out`, `climax`, `filter_open`
    (c46,42) / `filter_open_full` (c47, medido) / `filter_ramp_end`, `cut` (c49 = 69,818, ¡PUM!), `end`, `big_hit_1..6`.
  - `game/src/data/music/beatmaps/drunck.onsets.json`: `kick` (157: cada negra de los drops + golpes sueltos + 3
    redobles confirmados), `bass` (pulsos del rumble en +½), `snare` (acentos sin graves: compases de respiro),
    `perc` (agudos), `melody` (parte armónica por HPSS, aproximada), `vox` vacío. **Sin stems**: sale de la mezcla.
    *Cambio 10:45:* se quitaron 20 onsets de `melody` que caían en la cola de reverb (después de 69,87 s); nada más cambió.
- **Hecho** (2026-10-13):
  - Originales copiados a `~/Desktop/No one - raster (fuera del repo)/audio-derivados/originales/parte-iii/` con
    `SHA256SUMS`; `shasum -c` contra `~/Desktop/NO ONE LIKE CATS SONGS/` (solo lectura): los 5 OK.
  - Rejilla medida de las 5: tempo del editor exacto, compás 1 = 0 s, deriva < 0,04 ms/s.
  - Variaciones al juego (`public/music/drunck.{barra,resaca,battle}.m4a` + beat maps `beatmaps/drunck.{barra,resaca,battle}.json`):
    `drunck.barra` «Desde la calle» (cama −18 LUFS, 16 compases a 165), `drunck.resaca` «Bajo la almohada»
    (cama −18 LUFS, 16 compases a 82,5), `drunck.battle` «Última ronda» (−16,5 LUFS, loop 26 compases, vocabulario de
    batalla de la Parte II + `hits`). Costuras sin clic medidas sobre el AAC (también con cebado sin recortar).
  - `tracks.json`: entrada `drunck` (antes de `amb`) con las 3 variaciones. **B:** usa `drunck.battle` y `drunck.barra`.
  - `tests/originalsReserved.test.ts`: `drunck` en la lista de originales reservadas (verde).
  - `docs/part-ii/escuchar.html`: sección «Drunck · Parte III» arriba, marcada NUEVA.
  - Datos de No wey, Daria, xti y SADIE (solo datos, no van al juego): `…/parte-iii/datos/<id>.json` (beat map),
    `<id>.onsets.json`, `<id>.secciones.json` (EDITOR vs SEÑAL).
  - Informe: `docs/part-iii/investigacion/audio-real.md`.
  - Verde: `originalsReserved`, `audio`, `battleMusic`, `momentos*`, `oleada2Cine`, `rupturasStory`;
    `verify-missions --all` 166 OK. `npm run typecheck` falla solo en `src/momentos/songs/drunck/{score,stage}.ts`
    (trabajo en curso de C, no de D).
- **Falta**:
  1. Escucha del dueño (orden en `audio-real.md` §12). Si algo no le gusta: `variaciones.py <barra|resaca|battle>` y
     `catalog_add.py` lo rehacen.
  2. Cuando se elijan los Momentos de las otras 4: codificarlas con el proceso de `drunck_game.py` (SADIE necesita
     decidir su nivel: a −16 LUFS el pico pasa de −1 dBTP).
- **Cómo retomar**: scripts en `…/audio-derivados/parte-iii/scripts/` (venv `../.venv/bin/python`, 223 MB; se puede
  borrar si falta disco): `grid_fit.py`, `bars.py`, `onsets_p3.py <id> [--game]`, `drunck_game.py` (codifica + beat
  map), `variaciones.py`, `catalog_add.py` (tracks.json, idempotente), `datos_otras.py`, `escuchar_p3.py` (después de
  `node game/scripts/escuchar.mjs`). Solo quedan los WAV de Drunck en `parte-iii/wav/`; los otros se regeneran con
  `ffmpeg -i originales/parte-iii/<mp3> -c:a pcm_f32le parte-iii/wav/<id>.wav`. La carpeta del dueño no se toca.
- **Última actualización**: 2026-10-13 10:55.
