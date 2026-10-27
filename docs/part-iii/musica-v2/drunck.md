# Drunck · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#drunck`](linea-de-tiempo.html#drunck).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «Drunck (hardstyle)» | EDITOR |
| Archivo | `Drunck (hardstyle).mp3` | carpeta del dueño (intacta) |
| Proyecto | `J5GouBnxTdOJG07JMfwyPA` · versión 6 · última edición 2026-10-13 14:13 UTC | EDITOR |
| Tempo | **165 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 165,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **Bbm** · croma de los stems tonales: C#m (0,35), Dm (0,26), C# (0,24) | EDITOR + SEÑAL (débil) |
| Compases | **48** (c1 → c49) · 1 compás = 1,455 s · 1 tiempo = 0,3636 s | EDITOR |
| Duración | fin de la última región 1:09,8 (69,818 s) · archivo decodificado 72,777 s · **cola 2,96 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: −3,5 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −8,4 LUFS integrados · LRA 6,1 LU · pico 0,7 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | bombo «rumble» en cada negra en los drops; golpes sueltos y redobles en la intro | EDITOR + SEÑAL |
| Voz | ninguna | EDITOR + SEÑAL |

## 1. Recomendación: **COMPLETA** (PROPUESTA)

- completa (ya construida en H66): **c1 → fin** = 0:00,0 → 1:12,8 (**1:12,8**).
- Función narrativa propuesta: El relato de Canelo en el bar (H66, CANON).
Ya está construida y aprobada en H66 (CANON). No se toca. Este documento la deja en el mismo formato que las otras 8 para la tabla comparativa.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Intro: el anuncio** (`intro`) | c1–c9 | 0:00,0–0:11,6 | 0,66 | 0,33 | golpes sueltos de bombo, build-up, sinte que se abre 238 Hz → 9 kHz | algo se acerca; tensión que sube |
| **Drop A** (`drop`) | c9–c17 | 0:11,6–0:23,3 | 0,84 | 0,75 | entra el bombo continuo (rumble), sinte, percusión; respiro en c16 | golpe de euforia, fiesta |
| **B** (`drop2`) | c17–c25 | 0:23,3–0:34,9 | 0,85 | 0,75 | ride y hats; se van las percusiones; corte del bombo en c24,649 | velocidad, cabeza que da vueltas |
| **C: lo más lleno** (`drop3`) | c25–c33 | 0:34,9–0:46,5 | 0,85 | 0,73 | build-up encima de todo; respiro en c32 | la cima de la borrachera |
| **Sin sintes** (`break`) | c33–c41 | 0:46,5–0:58,2 | 0,84 | 0,75 | solo batería y fx; respiro c40; redoble c40,75 | mareo, el cuarto da vueltas |
| **Final** (`climax`) | c41–c49 | 0:58,2–1:09,8 | 0,83 | 0,74 | todo; el sinte vuelve cerrado a 716 Hz y se abre hasta c47; respiro c48; corte seco c49 | último trago y apagón |
| cola (`tail`) | c49–fin | 1:09,8–1:12,8 | — | — | cola de reverb (room del máster y reverb del bombo): se oye ~1,6 s | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 |
|---|---|---|---|---|
| c1–c4 | E0,34 D0,43 R0,44 | E0,51 D0,41 R0,36 | E0,59 D0,47 R0,48 | E0,69 D0,36 R0,29 |
| c5–c8 | E0,73 D0,22 R0,23 | E0,74 D0,08 R0,06 | E0,85 D0,30 R0,23 | E0,82 D0,35 R0,28 |
| c9–c12 | E0,85 D0,74 R0,81 | E0,84 D0,76 R0,84 | E0,84 D0,76 R0,84 | E0,86 D0,74 R0,81 |
| c13–c16 | E0,85 D0,74 R0,81 | E0,86 D0,77 R0,85 | E0,85 D0,81 R0,90 | E0,76 D0,70 R0,76 |
| c17–c20 | E0,87 D0,69 R0,75 | E0,87 D0,76 R0,83 | E0,87 D0,76 R0,84 | E0,86 D0,75 R0,83 |
| c21–c24 | E0,83 D0,74 R0,81 | E0,82 D0,74 R0,81 | E0,84 D0,76 R0,84 | E0,80 D0,76 R0,83 |
| c25–c28 | E0,84 D0,71 R0,77 | E0,84 D0,75 R0,82 | E0,83 D0,76 R0,84 | E0,84 D0,74 R0,82 |
| c29–c32 | E0,85 D0,73 R0,79 | E0,88 D0,81 R0,90 | E0,89 D0,86 R0,96 | E0,84 D0,52 R0,52 |
| c33–c36 | E0,84 D0,74 R0,82 | E0,85 D0,79 R0,88 | E0,85 D0,79 R0,88 | E0,87 D0,79 R0,88 |
| c37–c40 | E0,85 D0,76 R0,84 | E0,83 D0,74 R0,82 | E0,85 D0,74 R0,82 | E0,78 D0,59 R0,61 |
| c41–c44 | E0,83 D0,74 R0,81 | E0,85 D0,75 R0,82 | E0,84 D0,75 R0,82 | E0,83 D0,75 R0,83 |
| c45–c48 | E0,85 D0,77 R0,85 | E0,81 D0,92 R1,00 | E0,81 D0,92 R1,00 | E0,79 D0,33 R0,26 |

Resumen: energía media 0,81 (p90 0,88), pendiente 0,079/min · distorsión media 0,68 (p90 0,81), pendiente 0,243/min.

### 2.2 Cómo crece (o no) la distorsión

La distorsión **sube de golpe en c9** (0,33 en la intro → 0,75 en el drop) y se queda alta hasta el final: es un hardstyle saturado de punta a punta. Lo que sí **crece de forma continua es la intro**: el filtro del sinte se abre de 238 Hz a 9 kHz entre c2 y c9 (EDITOR) y la banda 800–5000 Hz sube de 37 a 57 dB (SEÑAL, `audio-real.md` §4.1). Al final, el sinte vuelve cerrado a 716 Hz y se abre hasta c47.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Druck - Aggressive (Kick Rumble) | audio | −2,1 | c1→c1,25 (fo 0,15 t) · c2,875→c3 (fo 0,15 t) · c3→c3,25 (fo 0,15 t) · c4,75→c4,8125 (fo 0,15 t) · c4,8125→c4,875 (fo 0,15 t) · c4,875→c4,9375 (fo 0,15 t) · c4,9375→c4,9688 · c4,9688→c5 · c5→c5,25 (fo 0,15 t) · c6,875→c7 (fo 0,15 t) · c7→c7,25 (fo 0,15 t) · c8,75→c8,8125 (fo 0,15 t) · c8,8125→c8,875 (fo 0,15 t) · c8,875→c8,9375 (fo 0,15 t) · c8,9375→c8,9688 · c8,9688→c9 · c40,75→c40,8125 (fo 0,15 t) · c40,8125→c40,875 (fo 0,15 t) · c40,875→c40,9375 (fo 0,15 t) · c40,9375→c40,9688 · c40,9688→c41 |
| 1 | Druck - Aggressive (Kick Rumble) | audio | −5,8 | c1→c1,25 (fo 0,15 t) · c2,875→c3 (fo 0,15 t) · c3→c3,25 (fo 0,15 t) · c4,75→c4,8125 (fo 0,15 t) · c4,8125→c4,875 (fo 0,15 t) · c4,875→c4,9375 (fo 0,15 t) · c4,9375→c4,9688 · c4,9688→c5 · c5→c5,25 (fo 0,15 t) · c6,875→c7 (fo 0,15 t) · c7→c7,25 (fo 0,15 t) · c8,75→c8,8125 (fo 0,15 t) · c8,8125→c8,875 (fo 0,15 t) · c8,875→c8,9375 (fo 0,15 t) · c8,9375→c8,9688 · c8,9688→c9 · c40,75→c40,8125 (fo 0,15 t) · c40,8125→c40,875 (fo 0,15 t) · c40,875→c40,9375 (fo 0,15 t) · c40,9375→c40,9688 · c40,9688→c41 |
| 2 | Druck - Aggressive (Kick Rumble) | audio | −2,0 | c9→c17 · c17→c21 · c21→c24,6495 (fo 0,10 t) · c25→c33 · c33→c40,75 · c41→c49 |
| 3 | Druck - Aggressive (Build Up) | audio | 0,0 | c1→c9 · c25→c33 · c41→c49 |
| 4 | Druck - Aggressive (Synth) | audio | −7,0 | c1→c9 |
| 5 | Druck - Aggressive (Fx loop) | audio | −8,9 | c1→c9 · c33→c41 · c41→c49 |
| 6 | Druck - Aggressive (Synth) | audio | −8,4 | c9→c17 · c17→c25 · c25→c33 · c41→c49 |
| 7 | Druck - Aggressive (Ride) | audio | −8,0 | c17→c25 · c25→c33 · c33→c41 · c41→c49 |
| 8 | Druck - Aggressive (Hi Hat) | audio | −9,0 | c17→c25 · c25→c33 · c33→c41 · c41→c49 |
| 9 | Druck - Aggressive (Percussion) | audio | −8,8 | c9→c17 · c33→c41 |
| 10 | Druck - Raw (Percussion) | audio | 6,0 | c15→c17 (fi 6,25 t) |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Build Up) · Druck - Aggressive (Synth) · Druck - Aggressive (Fx loop) | — |
| c1,25 | 0:00,4 | — | Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) · Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) |
| c2,875 | 0:02,7 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) | — |
| c3,25 | 0:03,3 | — | Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) · Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) |
| c4,75 | 0:05,5 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) | — |
| c5,25 | 0:06,2 | — | Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) · Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) |
| c6,875 | 0:08,5 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) | — |
| c7,25 | 0:09,1 | — | Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) · Druck - Aggressive (Kick Rumble) (fundido de salida de 0,15 tiempos) |
| c8,75 | 0:11,3 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) | — |
| c9 | 0:11,6 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Synth) · Druck - Aggressive (Percussion) | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Build Up) · Druck - Aggressive (Synth) · Druck - Aggressive (Fx loop) |
| c15 | 0:20,4 | Druck - Raw (Percussion) (fundido de entrada de 1,56 compases) | — |
| c17 | 0:23,3 | Druck - Aggressive (Ride) · Druck - Aggressive (Hi Hat) | Druck - Aggressive (Percussion) · Druck - Raw (Percussion) |
| c24,6495 | 0:34,4 | — | Druck - Aggressive (Kick Rumble) (fundido de salida de 0,10 tiempos) |
| c25 | 0:34,9 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Build Up) | — |
| c33 | 0:46,5 | Druck - Aggressive (Fx loop) · Druck - Aggressive (Percussion) | Druck - Aggressive (Build Up) · Druck - Aggressive (Synth) |
| c40,75 | 0:57,8 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) | Druck - Aggressive (Kick Rumble) |
| c41 | 0:58,2 | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Build Up) · Druck - Aggressive (Synth) | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Percussion) |
| c49 | 1:09,8 | — | Druck - Aggressive (Kick Rumble) · Druck - Aggressive (Build Up) · Druck - Aggressive (Fx loop) · Druck - Aggressive (Synth) · Druck - Aggressive (Ride) · Druck - Aggressive (Hi Hat) |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/drunck.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 157 | 3,27 | 98 % | 0:00,0 | 1:08,0 |
| caja / palmas | 29 | 0,60 | 100 % | 0:02,2 | 1:09,1 |
| hats / ride / fx agudos | 208 | 4,33 | 99 % | 0:00,0 | 1:09,1 |
| bajo / 808 | 155 | 3,23 | 95 % | 0:00,2 | 1:08,2 |
| melodía (ataques) | 534 | 11,12 | 85 % | 0:00,0 | 1:09,8 |
| voz (ataques) | 0 | — | — | — | — |

Los onsets del juego son los **validados** de la ronda anterior (`drunck.onsets.json`, rejilla de fusas, cada golpe confirmado a ≤ 15 ms). Mi detector con stems se probó contra ellos solo para calibrar: en el bombo del hardstyle (golpe + «rumble» en el contratiempo) acierta poco (37 %), en hats acierta el 97 %. Por eso Drunck **conserva** sus onsets.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`kick_1` c1 (0:00,0) · `kick_2` c2,875 (0:02,7) · `big_hit_1` c2,875 (0:02,7) · `kick_3` c3 (0:02,9) · `roll_1` c4,75 (0:05,5) · `kick_4` c5 (0:05,8) · `kick_5` c6,875 (0:08,5) · `big_hit_2` c6,875 (0:08,5) · `kick_6` c7 (0:08,7) · `roll_2` c8,75 (0:11,3) · `first_drop` c9 (0:11,6) · `loop_start` c9,002 (0:11,6) · `perc_rise` c15 (0:20,4) · `breath_1` c16 (0:21,8) · `breath_1_end` c17 (0:23,3) · `hats_in` c17 (0:23,3) · `big_hit_3` c20,25 (0:28,0) · `kick_cut` c24,649 (0:34,4) · `kick_back` c25 (0:34,9) · `big_hit_4` c25 (0:34,9) · `breath_2` c32 (0:45,1) · `breath_2_end` c33 (0:46,5) · `synths_out` c33 (0:46,5) · `breath_3` c40 (0:56,7) · `roll_3` c40,75 (0:57,8) · `big_hit_5` c40,938 (0:58,1) · `climax` c41 (0:58,2) · `loop_end` c41,002 (0:58,2) · `big_hit_6` c44,25 (1:02,9) · `filter_open` c46,42 (1:06,1) · `filter_open_full` c47 (1:06,9) · `filter_ramp_end` c47,99 (1:08,3) · `breath_4` c48 (1:08,4) · `cut` c49 (1:09,8) · `end` c49,702 (1:10,8)

Respiros sin graves en c16, c32, c40 y c48 (~20 dB menos de graves); corte del bombo en c24,649 (0,51 s sin bombo); redobles en c4,75, c8,75 y c40,75; corte seco en c49 con 2,96 s de cola de reverb (se oye ~1,6 s). Detalle en `../investigacion/audio-real.md` §4.

## 6. Voz

Sin voz. Lo que htdemucs pone en el stem de voz entre 0:04 y 0:11 es el sinte de la intro abriéndose (fuga).

Regiones donde el stem de voz sobresale (SEÑAL, htdemucs; `tipo` por pyin, INFERIDO): 0:04,3–0:10,9 (cantada, −9,6 dB bajo la mezcla) · 0:21,8–0:23,4 (textura (sin altura clara), −7,7 dB bajo la mezcla)

## 7. Notas para la película

- La intro es un **anuncio que se abre**: imagen que se ilumina o se enfoca de c2 a c9, al ritmo del filtro.
- Los cuatro respiros (c16, c32, c40, c48) son cortes de plano naturales: un compás sin graves.
- c24,649 → c25: medio segundo sin bombo, ideal para un «congelado».

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
