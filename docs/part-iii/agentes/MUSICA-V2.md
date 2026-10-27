# MUSICA-V2 · Ronda 4 (plan cinematográfico): las 9 canciones

> Encargo: `docs/part-iii/14-plan-cinematografico.md` §3 (MÚSICA). Sin commits. Originales y proyectos de Soundtrap intactos.

## Qué estoy haciendo
Oleadas 3 y 3b terminadas. Espero la escucha del dueño (`musica-v2/10-produccion-oleada3.md` §8 y §10; `musica-v2/escuchar-oleada3.html`).

## Oleada 3b · hecha (2026-10-26 ~21:00)
- **Composición nueva** `fut.vineta` (F09): Sol menor, boom-bap a 95 BPM con orquesta y el motivo 1–5–4–3. Variantes `fut.vineta.noticiero` (F10, fanfarria) y `fut.vineta.mono` (F11).
- **Re-mezclas** de COMPOSITOR-FUTURO con sus mismas notas: `fut.fosa.niebla` (F19, sin sonar ni burbujas), `fut.fosa.latido` (F20) y `fut.jefe.grave` (F31). Las versiones tal cual no pegaban con las fichas (submarino, batalla brillante).
- `drunck.cinemudo` (F04): piano de cine mudo con los «hipos» de la intro de Drunck, Si♭m a 82,5 BPM. Es la única derivada con un timbre nuevo, y la ficha lo pide: **hace falta el OK del dueño**.
- Todas en `game/public/music` y en `tracks.json` (las `fut.*` dentro de `amb`, `drunck.cinemudo` dentro de `drunck`), a −18 LUFS con loop en compás exacto. +8,0 MB (música total ≈ 110 MB).
- **Pruebas**: vitest 820/821; la que falla es `filmActo1 › f03` (llaves de cámara del film f03 de CINE, en curso). `tsc` falla por `src/film/films/acto1/f03` (falta `./sets`), también de CINE. No toqué ninguna de las dos.
- Scripts: `audio-derivados/scripts/futuro/s_parteiii.py` (venv `vfut` en el scratchpad, con los requisitos de `scripts/futuro/requisitos.txt`) y `parte-iii/scripts/v2/traer_futuro.py`.

## Oleada 3 · avance (terminada, 2026-10-26 ~20:45)
- **Originales**: las 8 codificadas como `drunck.m4a` (AAC-LC 160k cvbr aac_at, ganancia estática a −16 LUFS, pico ≤ −1 dBTP), alineadas a 0 muestras, cebado 2112. SADIE queda en −17,8 LUFS (v223; la v284 necesita reexportar). Registradas en `tracks.json` con pistas sin spoilers.
- **Prueba**: `tests/originalsReserved.test.ts` tiene `ORIGINALS` = 7 de batalla + 8 de película; el remix de batalla se exige solo a las 7; prueba nueva para las 8.
- **13 variaciones derivadas** (`emen.publico`, `oh_shit.antes`, `xti.pad`, `xti.gira`, `daria.calle`, `daria.piano`, `no_wey.melodia`, `no_wey.nodije`, `no_wey.puente`, `distor.senal`, `no_game.start`, `sadie.luz`, `liky_fight.amanecer`) y **2 piezas propias** (`amb.vocacion` F17, `amb.plan` F21), en `game/public/music` y `tracks.json`.
- **Tema de Canelo** = LIKY FIGHT (doc 18 §5.1; Eco; célula de canelo_astral) → `liky_fight.amanecer` para F34. F33 va sin música.
- **Docs**: `musica-v2/10-produccion-oleada3.md` (todo, más la tabla película → pista) y `musica-v2/escuchar-oleada3.html` (para que el dueño escuche).
- **Tamaño**: `public/music` pasa de 60,9 a 102,1 MB (+41,2). Se cachea al sonar, no se precarga.
- **Pruebas**: vitest 780/780 OK. `tsc` tiene 2 errores ajenos en `src/film/films/final/sadie.ts` y `src/film/styles/grafico.ts` (trabajo en curso de CINE; no los toqué).
- **Falta (fuera del encargo)**: `fut.vineta` (por componer), registrar `fut.fosa` y `fut.jefe` (están en `audio-derivados/futuro/`), y la variante de cine mudo de `drunck.resaca` (F04).
- Scripts: `scripts/v2/originales_juego.py`, `derivados_v2.py`, `piezas_v2.py`, `registrar_juego.py`. Respaldo del `tracks.json` previo en `parte-iii/v2/datos/tracks.json.antes-oleada3`.

## Hecho
- **Copias**: OH SHIT, EM%EN, DISTOR y NO G%40ME NO LIF€ copiadas con `cp -p` a `audio-derivados/originales/parte-iii/`. `SHA256SUMS` regenerado con las 9 y verificado contra la carpeta del dueño: las 9 OK.
- **Soundtrap (solo lectura)**: GET al JSON del estudio y a los `.not`. Solo abrí el estudio de OH SHIT; no reproduje nada. Versiones verificadas al empezar y al terminar (01:12 UTC del 27): **las 10 sin cambios** (tabla en `musica-v2/00-LEEME.md` §7). La pestaña está cerrada.
  - **SADIE**: el proyecto va en la v284 (2026-10-21) y la exportación es la v223. La v284 agrega cuerdas en c17–25 y un «Error» en c33.
  - **10.º proyecto sin exportar**: «NO ONE LIKE ME», 100 BPM, F#m, 72 compases.
- **Docs** en `docs/part-iii/musica-v2/`:
  - `00-LEEME.md`: tabla de las 9, distorsión, tempos y transiciones, método, beat maps, briefings, Soundtrap, pendientes.
  - 9 análisis: `drunck.md`, `sadie.md`, `daria.md`, `no-wey.md`, `xti-es-amor.md`, `oh-shit.md`, `em-en.md`, `distor.md`, `no-game-no-life.md`.
  - `linea-de-tiempo.html`: un solo archivo con SVG y JS en línea, sin raster.
- **Beat maps nuevos** (oleada 1; desde la oleada 3 están registrados en `tracks.json` con su audio): `game/src/data/music/beatmaps/{sadie,daria,no_wey,xti,oh_shit,emen,distor,no_game}.json` y `.onsets.json`. Las pruebas de música pasan.
- **Hallazgos clave**:
  - SADIE crece en escalones (textura y brillo, no volumen).
  - NO G@ME deja entrar la distorsión por capas: 5 → 8 → 7 → 20 compases.
  - DISTOR tiene la distorsión constante desde c1 y un desfase de medio tiempo en c65,875.
  - EM%EN no tiene rap: solo un coro «Chant». Su quiebre es silencioso pero sucio (LRA 14,1).
  - Las caídas de OH SHIT bajan 3 dB: son cambios de mundo.
  - La transición No wey → DISTOR es la más suave: misma F#m y tempo en 3:2.

## Falta
1. Escucha humana (lista en `00-LEEME.md` §8).
2. Alinear los fragmentos con `historia-v2/03-peliculas.md` cuando exista.
3. Producir los briefings (`00-LEEME.md` §6). Ideal: el dueño exporta stems de SADIE, EM%EN, DISTOR y NO G@ME.
4. Al construir cada película: registrar en `tracks.json`, codificar el `.m4a` y agregar el id a `ORIGINALS` en `tests/originalsReserved.test.ts`.

## Cómo retomar
- Scripts: `~/Desktop/No one - raster (fuera del repo)/audio-derivados/parte-iii/scripts/v2/`. Orden: `separar.py` → `analizar.py` → `onsets_v2.py` → HPSS `resid.json` → `curvas.py` → `tono.py` → `beatmaps_v2.py --write` → `gen_html.py` (usa `plantilla.html`) → `gen_docs.py` (textos en `notas.py`, secciones y recomendaciones en `secciones.py`).
- Datos: `parte-iii/v2/datos/` (rasgos, curvas, onsets, voz, tonos), `parte-iii/v2/soundtrap/` (JSON compacto de los proyectos) y `parte-iii/v2/stems/` (htdemucs, 377 MB; sirven para los briefings).
- El venv (torch, demucs, librosa) se borró por disco. Para rehacerlo: `python3 -m venv venv && venv/bin/pip install torch torchaudio demucs librosa soundfile scipy` (≈1,1 GB). Los WAV decodificados también se borraron; se rehacen con ffmpeg (`-c:a pcm_f32le`) en `parte-iii/wav/<id>.wav`.
- `beatmaps_v2.py --write` solo sobrescribe los archivos que creó él (lista en `v2/datos/escritos_en_juego.txt`).

## Última actualización
2026-10-26, ~19:20 (hora local)
