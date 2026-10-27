# Daria · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#daria`](linea-de-tiempo.html#daria).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «Daria (hiphop deep)» | EDITOR |
| Archivo | `Daria (hiphop deep).mp3` | carpeta del dueño (intacta) |
| Proyecto | `b5_MXIbcTkaXy4jKU82AnQ` · versión 306 · última edición 2026-10-13 14:14 UTC | EDITOR |
| Tempo | **134 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 134,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **Cm** · croma de los stems tonales: Cm (0,64), Fm (0,64), C (0,59) | EDITOR + SEÑAL (débil) |
| Compases | **80** (c1 → c81) · 1 compás = 1,791 s · 1 tiempo = 0,4478 s | EDITOR |
| Duración | fin de la última región 2:23,3 (143,284 s) · archivo decodificado 146,363 s · **cola 3,08 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: −5,0 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −8,4 LUFS integrados · LRA 0,8 LU · pico 0,7 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | bombo solo (A), bombo + caja (B), hats trap (C) | EDITOR |
| Voz | loop de biblioteca «Lush Vox – Cold», cantado, en Cm y en Am | EDITOR + SEÑAL |

## 1. Recomendación: **FRAGMENTO** (PROPUESTA)

- principal c25 → fin (1:40): empieza en el stop, pasa el hueco de c41 y termina en el corte seco: **c25 → fin** = 0:43,0 → 2:26,4 (**1:43,4**).
- alternativa c17 → c65 (1:26): los dos silencios, sin el final: **c17 → c65** = 0:28,7 → 1:54,6 (**1:26,0**).
- Función narrativa propuesta: El duelo con Itō (H81): los dos silencios son los dos cortes.
Fragmento. La propuesta principal arranca **en el stop de c25** (el 808 vuelve en c25,5: silencio → golpe), pasa por el **hueco de batería de c41** y termina en el **corte seco de c81**: tiene los dos silencios del duelo y un final que la canción ya trae. Dura 1:40. Si la película tiene que durar ~1:25 (biblia v2 §8), la alternativa c17 → c65 (1:26) conserva los dos silencios pero hay que inventarle un cierre en c65.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **A** (`intro`) | c1–c17 | 0:00,0–0:28,7 | 0,73 | 0,22 | piano, bombo solo, 808, voz [Cm]; shimmer desde c9 | calle de noche, cabeza fría |
| **B** (`verse`) | c17–c33 | 0:28,7–0:57,3 | 0,79 | 0,25 | bombo + caja; voz en [Am] c17–25; stop de 2 tiempos en c25 | paso firme, duelo que empieza |
| **C** (`chorus`) | c33–c49 | 0:57,3–1:26,0 | 0,91 | 0,27 | sin voz; hats trap; hueco de batería en c41 | filo, velocidad |
| **A'** (`verse2`) | c49–c65 | 1:26,0–1:54,6 | 0,77 | 0,25 | bombo solo y voz; caja desde c57 y voz [Am] | segunda vuelta, más cansada |
| **C'** (`chorus2`) | c65–c81 | 1:54,6–2:23,3 | 0,91 | 0,26 | hats y caja, sin voz; corte seco en c81 | final sin respiro |
| cola (`tail`) | c81–fin | 2:23,3–2:26,4 | — | — | cola muy baja después del corte seco (room del máster) | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,56 D0,20 R0,06 | E0,75 D0,20 R0,06 | E0,72 D0,21 R0,12 | E0,77 D0,22 R0,24 | E0,68 D0,18 R0,01 | E0,77 D0,18 R0,06 | E0,71 D0,20 R0,09 | E0,78 D0,23 R0,37 |
| c9–c16 | E0,73 D0,24 R0,36 | E0,76 D0,24 R0,40 | E0,68 D0,23 R0,31 | E0,76 D0,27 R0,56 | E0,68 D0,22 R0,20 | E0,77 D0,23 R0,26 | E0,71 D0,23 R0,27 | E0,79 D0,27 R0,58 |
| c17–c24 | E0,77 D0,26 R0,49 | E0,80 D0,24 R0,38 | E0,76 D0,25 R0,45 | E0,82 D0,25 R0,44 | E0,73 D0,22 R0,22 | E0,82 D0,25 R0,43 | E0,78 D0,24 R0,39 | E0,80 D0,30 R0,82 |
| c25–c32 | E0,74 D0,31 R0,71 | E0,80 D0,25 R0,42 | E0,78 D0,24 R0,34 | E0,82 D0,25 R0,42 | E0,78 D0,23 R0,25 | E0,84 D0,25 R0,43 | E0,77 D0,25 R0,43 | E0,85 D0,29 R0,77 |
| c33–c40 | E0,90 D0,26 R0,56 | E0,93 D0,26 R0,55 | E0,91 D0,27 R0,60 | E0,94 D0,26 R0,54 | E0,88 D0,23 R0,32 | E0,93 D0,27 R0,49 | E0,92 D0,26 R0,55 | E0,90 D0,30 R0,81 |
| c41–c48 | E0,83 D0,27 R0,61 | E0,93 D0,27 R0,60 | E0,90 D0,27 R0,64 | E0,94 D0,27 R0,57 | E0,89 D0,24 R0,36 | E0,93 D0,27 R0,51 | E0,92 D0,27 R0,59 | E0,91 D0,31 R0,84 |
| c49–c56 | E0,74 D0,25 R0,48 | E0,78 D0,25 R0,45 | E0,70 D0,24 R0,35 | E0,77 D0,27 R0,58 | E0,68 D0,21 R0,12 | E0,77 D0,23 R0,26 | E0,71 D0,24 R0,33 | E0,78 D0,28 R0,65 |
| c57–c64 | E0,79 D0,26 R0,50 | E0,82 D0,24 R0,40 | E0,78 D0,26 R0,48 | E0,78 D0,25 R0,45 | E0,74 D0,23 R0,25 | E0,81 D0,25 R0,45 | E0,77 D0,24 R0,36 | E0,83 D0,28 R0,70 |
| c65–c72 | E0,90 D0,27 R0,60 | E0,93 D0,27 R0,57 | E0,90 D0,27 R0,63 | E0,93 D0,27 R0,56 | E0,88 D0,24 R0,37 | E0,93 D0,26 R0,50 | E0,91 D0,26 R0,53 | E0,90 D0,30 R0,80 |
| c73–c80 | E0,89 D0,26 R0,54 | E0,93 D0,25 R0,48 | E0,90 D0,27 R0,60 | E0,93 D0,25 R0,48 | E0,89 D0,23 R0,33 | E0,93 D0,26 R0,47 | E0,92 D0,26 R0,52 | E0,91 D0,30 R0,82 |

Resumen: energía media 0,82 (p90 0,93), pendiente 0,067/min · distorsión media 0,25 (p90 0,31), pendiente 0,020/min.

### 2.2 Cómo crece (o no) la distorsión

**Plana y limpia**: 0,25 de media, la más limpia de las 9 (residuo HPSS 0,06). No hay distorsión que crezca. Lo único que cambia entre secciones es el **brillo** (hats, caja, shimmer): la pared de volumen se queda en −8 a −9 LUFS todo el tiempo (LRA 0,8).

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Brampton - Vinyl Piano 7R | audio | −1,6 | c1→c9 · c9→c17 · c17→c25 · c25,5→c33 · c33→c41 · c41→c49 · c49→c57 · c57→c65 · c65,0002→c73 · c73→c81 |
| 1 | G.O.A.T - Bugged Out (Kick) / Flux - Bee (Kick & Snare) | audio | 0,0 | c1→c9 · c9→c17 · c17→c25 · c25→c33 · c33→c41 · c41,3125→c49 · c49→c57 · c57→c65 · c65,0002→c73 · c73→c81 |
| 2 | Brick - Be Doomed 808 | audio | −9,6 | c1→c9 · c9→c17 · c17→c25 · c25,5→c33 · c33→c41 · c41→c49 · c49→c57 · c57→c65 · c65,0002→c73 · c73→c81 |
| 3 | Lush Vox - Cold (Lead & BVs) 01 | audio | −5,9 | c1→c17 · c17→c21 · c21→c25 · c25→c33 · c49→c57 · c57→c60,9997 · c60,9997→c64,9998 |
| 4 | Synth - Shimmer 1 | audio | −4,3 | c9→c17 · c17→c25 · c25,5→c33 · c33→c41 · c41→c49 · c49→c57 · c57→c65 · c65,0002→c73 · c73→c81 |
| 5 | Million - Trap Hat LR 01 | audio | 0,0 | c33→c41 · c41,3125→c45 · c45→c49 · c65,0002→c73 · c73→c81 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Brampton - Vinyl Piano 7R · G.O.A.T - Bugged Out (Kick) · Brick - Be Doomed 808 · Lush Vox - Cold (Lead & BVs) 01 | — |
| c9 | 0:14,3 | Synth - Shimmer 1 | — |
| c25 | 0:43,0 | — | Brampton - Vinyl Piano 7R · Brick - Be Doomed 808 · Synth - Shimmer 1 |
| c25,5 | 0:43,9 | Brampton - Vinyl Piano 7R · Brick - Be Doomed 808 · Synth - Shimmer 1 | — |
| c33 | 0:57,3 | Million - Trap Hat LR 01 | Lush Vox - Cold (Lead & BVs) 01 |
| c41 | 1:11,6 | — | G.O.A.T - Bugged Out (Kick) · Million - Trap Hat LR 01 |
| c41,3125 | 1:12,2 | G.O.A.T - Bugged Out (Kick) · Million - Trap Hat LR 01 | — |
| c49 | 1:26,0 | Lush Vox - Cold (Lead & BVs) 01 | Million - Trap Hat LR 01 |
| c64,9998 | 1:54,6 | Million - Trap Hat LR 01 | Lush Vox - Cold (Lead & BVs) 01 |
| c81 | 2:23,3 | — | Brampton - Vinyl Piano 7R · G.O.A.T - Bugged Out (Kick) · Brick - Be Doomed 808 · Synth - Shimmer 1 · Million - Trap Hat LR 01 |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/daria.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 170 | 2,12 | 81 % | 0:03,6 | 2:23,2 |
| caja / palmas | 328 | 4,10 | 98 % | 0:03,6 | 2:22,4 |
| hats / ride / fx agudos | 348 | 4,35 | 97 % | 0:14,0 | 2:23,0 |
| bajo / 808 | 475 | 5,94 | 22 % | 0:00,1 | 2:23,3 |
| melodía (ataques) | 538 | 6,72 | 22 % | 0:00,0 | 2:23,3 |
| voz (ataques) | 338 | 4,22 | 21 % | 0:00,5 | 1:53,9 |

Bien definidos: caja y hats caen en la semicorchea (98 % y 97 %). El bombo está incompleto donde lo tapa el 808 (el mismo problema de la ronda anterior). `vox` trae los ataques del loop de voz (338), solo dentro de las regiones donde suena.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`shimmer_in` c9 (0:14,3) · `snare_in` c17 (0:28,7) · `stop` c25,073 (0:43,1) · `stop_end` c25,5 (0:43,9) · `hats_in` c33,061 (0:57,4) · `drum_gap` c41 (1:11,6) · `drum_gap_end` c41,369 (1:12,3) · `hats_out` c49 (1:26,0) · `snare_back` c57 (1:40,3) · `hats_back` c64,978 (1:54,6) · `end` c81,009 (2:23,3) · `cut` c81,011 (2:23,3)

Stop de c25: los graves caen después del bombo del tiempo 1 (43,12 s) y el 808 vuelve en c25,5 (43,88 s). Hueco de batería de c41: 71,64 → 72,30 s (los hats vuelven en c41 + 1,5 tiempos). Corte seco en c81 (143,30 s) y cola muy baja de 3,1 s.

## 6. Voz

**Cantada** (loop de biblioteca «Lush Vox – Cold (Lead & BVs)»): c1–33 y c49–65; en c17–25 y c57–65 en la versión transpuesta a Am. En el stem de voz se ve de 0:00 a 0:57 y de 1:26 a 1:55, con altura estable (pyin: 88–93 % de cuadros con altura). No es una letra propia del dueño: no hay palabras que sincronizar.

Regiones donde el stem de voz sobresale (SEÑAL, htdemucs; `tipo` por pyin, INFERIDO): 0:00,4–0:16,6 (cantada, −11,7 dB bajo la mezcla) · 0:17,5–0:45,4 (cantada, −12,0 dB bajo la mezcla) · 0:46,2–0:57,2 (cantada, −12,1 dB bajo la mezcla) · 1:26,0–1:54,5 (cantada, −11,9 dB bajo la mezcla)

## 7. Notas para la película

- Como el volumen no se mueve, **los cambios visuales se cuelgan del brillo y de la voz**: entra la caja (c17), entran los hats (c33), se va la voz (c33, c65).
- Los dos silencios son dos cortes: el de c25 dura 2 tiempos, el de c41 1,5 tiempos.

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
