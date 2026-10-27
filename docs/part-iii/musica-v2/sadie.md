# SADIE · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#sadie`](linea-de-tiempo.html#sadie).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «SADIE (piano and distorsion)» | EDITOR |
| Archivo | `SADIE (piano and distorsion).mp3` | carpeta del dueño (intacta) |
| Proyecto | `fGRASEj8SdSwqi2aZkxTvg` · versión 223 · última edición 2026-10-13 14:21 UTC (v223, la exportada); hoy el proyecto va en la v284 del 2026-10-21 | EDITOR |
| Tempo | **50 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 50,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **Dm** · croma de los stems tonales: Dm (0,89), F (0,86), Bb (0,67) | EDITOR + SEÑAL (débil) |
| Compases | **36** (c1 → c37) · 1 compás = 4,800 s · 1 tiempo = 1,2000 s | EDITOR |
| Duración | fin de la última región 2:52,8 (172,800 s) · archivo decodificado 172,900 s · **cola 0,10 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: 1,0 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −20,1 LUFS integrados · LRA 6,1 LU · pico −3,4 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | **ninguna** | EDITOR |
| Voz | ninguna | EDITOR + SEÑAL |
| Versión | la exportación es la v223; el proyecto hoy es la v284 (ver §7) | EDITOR |

## 1. Recomendación: **COMPLETA** (PROPUESTA)

- completa: es incremental y termina en seco: **c1 → fin** = 0:00,0 → 2:52,9 (**2:52,9**).
- Función narrativa propuesta: La muerte de Luzterna (H93). La proyección crece con las cuerdas y se rompe en c29.
Completa, como pide el dueño: **es incremental** y la medición lo confirma (las cuerdas suben en tres escalones y la textura se ensucia hasta el clímax). Cortarla rompería la subida. Termina en seco, sin cola: el final es un apagón real.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Piano y arpegio** (`intro`) | c1–c5 | 0:00,0–0:19,2 | 0,46 | 0,15 | piano (loop de 4 compases) + arpegio del lead con fundido de entrada | una caja de música; frágil |
| **Primeras cuerdas** (`verse`) | c5–c9 | 0:19,2–0:38,4 | 0,51 | 0,28 | entran las cuerdas (capa 1, −6,1 dB); «Error» en c8,875 | algo empieza a doler |
| **Cuerdas más fuertes** (`verse_b`) | c9–c17 | 0:38,4–1:16,8 | 0,54 | 0,41 | cuerdas capa 2 (+1,5 dB); «Error» en c13; el lead se apaga en c13–17 | el dolor se instala |
| **Clímax** (`climax`) | c17–c25 | 1:16,8–1:55,2 | 0,60 | 0,48 | cuerdas al máximo (+6 dB), línea «Error» picada (YM), el lead vuelve en c21 | el grito sin voz |
| **Calma** (`break`) | c25–c29 | 1:55,2–2:14,4 | 0,52 | 0,44 | piano + cuerdas (capa 2) que se apagan | se acabó la fuerza |
| **Piano distorsionado** (`bridge`) | c29–c33 | 2:14,4–2:33,6 | 0,38 | 0,17 | el mismo piano pasa por distorsión (juicydist), filtro y delay; «Error» en c29 y c31 | el recuerdo se rompe |
| **Piano limpio** (`outro`) | c33–c37 | 2:33,6–2:52,8 | 0,47 | 0,17 | vuelve el piano limpio, solo; corte seco en c37 | silencio después; lo que queda |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 |
|---|---|---|---|---|
| c1–c4 | E0,37 D0,12 R0,08 | E0,52 D0,17 R0,13 | E0,48 D0,15 R0,11 | E0,49 D0,16 R0,12 |
| c5–c8 | E0,50 D0,29 R0,42 | E0,54 D0,29 R0,43 | E0,48 D0,27 R0,37 | E0,53 D0,27 R0,37 |
| c9–c12 | E0,57 D0,37 R0,61 | E0,57 D0,39 R0,66 | E0,51 D0,36 R0,58 | E0,56 D0,39 R0,66 |
| c13–c16 | E0,55 D0,39 R0,65 | E0,56 D0,45 R0,81 | E0,50 D0,43 R0,75 | E0,53 D0,50 R0,90 |
| c17–c20 | E0,60 D0,47 R0,85 | E0,61 D0,50 R0,91 | E0,57 D0,53 R0,93 | E0,58 D0,51 R0,94 |
| c21–c24 | E0,62 D0,46 R0,81 | E0,62 D0,46 R0,83 | E0,60 D0,46 R0,83 | E0,60 D0,45 R0,81 |
| c25–c28 | E0,54 D0,40 R0,68 | E0,56 D0,47 R0,83 | E0,49 D0,43 R0,76 | E0,51 D0,46 R0,83 |
| c29–c32 | E0,35 D0,17 R0,13 | E0,39 D0,16 R0,11 | E0,39 D0,19 R0,18 | E0,38 D0,16 R0,13 |
| c33–c36 | E0,43 D0,12 R0,07 | E0,53 D0,20 R0,20 | E0,44 D0,14 R0,10 | E0,48 D0,23 R0,27 |

Resumen: energía media 0,52 (p90 0,61), pendiente −0,020/min · distorsión media 0,33 (p90 0,52), pendiente −0,003/min.

### 2.2 Cómo crece (o no) la distorsión

**Crece en escalones y después se rompe.** Distorsión por sección: piano 0,15 → primeras cuerdas 0,28 → cuerdas más fuertes 0,41 → clímax 0,48 → calma 0,44 → puente 0,17 → outro 0,17.

La intensidad más limpia de medir es el **brillo de las cuerdas** (banda 4–10 kHz de la mezcla, dB relativos): −30 (c1) → −8 (c5) → −1 (c9) → **+5 (c17, clímax)** → −1 (c25) → −24 (c29) → −30 (c33). Son exactamente los escalones de volumen del editor (−6,1 → +1,5 → +6 dB). El volumen total casi no cambia (−24 → −19 LUFS momentáneos): **lo incremental es la textura y el brillo, no el volumen**.

El «piano distorsionado» de c29–33 es una distorsión **suave** (juicydist con ganancia 0,042 y mezcla 0,31): el piano queda **delgado y brillante** (graves −24 a −41 dB; inclinación hacia los agudos +10 dB frente al piano limpio) pero **no más ruidoso** (residuo HPSS 0,10 contra 0,15 del piano limpio). Visualmente: el recuerdo se adelgaza y se quiebra, no explota.

Lo que sí ensucia el clímax es la línea «YM – Error 5019» picada en c17–25 (un lead con glitch) más las cuerdas al máximo.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Atlantis - Ocean Piano Chords 01 | audio | 0,0 | c1→c29 · c33→c37 |
| 1 | Atlantis - Ocean Piano Chords 01 — «Dub» | audio | 0,0 | c29→c33 |
| 2 | Lucid - Sad Synth Lead 03 — «Pad Dualipa 3 Björn» | instrumento (notas) | −1,4 | c1→c9 (fi 7,75 t) · c9→c17 (fo 16,24 t) · c21→c25 |
| 3 | Super 8 - Proud Strings 01 — «String Section» | instrumento (notas) | −6,1 | c5→c9 (fo 1,26 t) |
| 4 | Super 8 - Proud Strings 01 — «String Section» | instrumento (notas) | 1,5 | c9→c17 · c25→c29 (fo 1,26 t) |
| 5 | Super 8 - Proud Strings 01 — «String Section» | instrumento (notas) | 6,0 | c17→c25 |
| 7 | YM - Error 5019 FL LD3 — «Ice Acoustic Guitar» | audio | −15,0 | c17→c17,7445 · c17,7563→c19,753 · c19,7542→c20,9937 · c20,9937→c21,7382 · c21,75→c23,7467 · c23,748→c24,9938 |
| 8 | YM - Error 5019 FL LD3 — «Ice Acoustic Guitar» | audio | −18,4 | c8,875→c9,3955 (fo 0,59 t) · c13→c13,5205 (fo 0,59 t) · c29→c29,5205 (fo 0,59 t) · c31,002→c31,5225 (fo 0,59 t) |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Atlantis - Ocean Piano Chords 01 · Lucid - Sad Synth Lead 03 (fundido de entrada de 1,94 compases) | — |
| c5 | 0:19,2 | Super 8 - Proud Strings 01 | — |
| c8,875 | 0:37,8 | YM - Error 5019 FL LD3 | — |
| c9 | 0:38,4 | Super 8 - Proud Strings 01 | Super 8 - Proud Strings 01 (fundido de salida de 1,26 tiempos) |
| c9,3955 | 0:40,3 | — | YM - Error 5019 FL LD3 (fundido de salida de 0,59 tiempos) |
| c13 | 0:57,6 | YM - Error 5019 FL LD3 | — |
| c13,5205 | 1:00,1 | — | YM - Error 5019 FL LD3 (fundido de salida de 0,59 tiempos) |
| c17 | 1:16,8 | Super 8 - Proud Strings 01 · YM - Error 5019 FL LD3 | Lucid - Sad Synth Lead 03 (fundido de salida de 16,24 tiempos) · Super 8 - Proud Strings 01 |
| c21 | 1:36,0 | Lucid - Sad Synth Lead 03 | — |
| c24,9938 | 1:55,2 | — | YM - Error 5019 FL LD3 |
| c25 | 1:55,2 | Super 8 - Proud Strings 01 | Lucid - Sad Synth Lead 03 · Super 8 - Proud Strings 01 |
| c29 | 2:14,4 | Atlantis - Ocean Piano Chords 01 · YM - Error 5019 FL LD3 | Atlantis - Ocean Piano Chords 01 · Super 8 - Proud Strings 01 (fundido de salida de 1,26 tiempos) |
| c29,5205 | 2:16,9 | — | YM - Error 5019 FL LD3 (fundido de salida de 0,59 tiempos) |
| c31,002 | 2:24,0 | YM - Error 5019 FL LD3 | — |
| c31,5225 | 2:26,5 | — | YM - Error 5019 FL LD3 (fundido de salida de 0,59 tiempos) |
| c33 | 2:33,6 | Atlantis - Ocean Piano Chords 01 | Atlantis - Ocean Piano Chords 01 |
| c37 | 2:52,8 | — | Atlantis - Ocean Piano Chords 01 |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/sadie.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 0 | — | — | — | — |
| caja / palmas | 0 | — | — | — | — |
| hats / ride / fx agudos | 0 | — | — | — | — |
| bajo / 808 | 48 | 1,33 | 100 % | 0:19,2 | 2:12,0 |
| melodía (ataques) | 224 | 6,22 | 100 % | 0:00,0 | 2:50,4 |
| voz (ataques) | 0 | — | — | — | — |

Sin batería: bombo, caja y hats quedan **vacíos** a propósito (el stem de batería de htdemucs solo trae fuga del piano). Las pistas útiles salen de las **notas del editor**: `bass` = la nota más grave de las cuerdas en cada cambio (cada medio compás, con fuerza 0,5 / 0,8 / 1,0 según la capa), y `melody` = el arpegio del lead (corcheas, con sus fundidos) más el ataque del piano cada 2 tiempos.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`strings_in` c4,998 (0:19,2) · `ym_1` c8,875 (0:37,8) · `strings_up` c8,965 (0:38,2) · `ym_2` c13 (0:57,6) · `climax` c17 (1:16,8) · `lead_back` c21,002 (1:36,0) · `calm` c25 (1:55,2) · `distortion` c28,998 (2:14,4) · `ym_3` c29 (2:14,4) · `ym_4` c30,998 (2:24,0) · `clean_piano` c33 (2:33,6) · `cut` c37 (2:52,8) · `end` c37 (2:52,8)

Golpes «Error» confirmados en c8,875 (37,80 s), c29 (134,40 s) y c31 (144,01 s); el de c13 no se separa en la señal. Entradas de cuerdas en c5, c9 y c17; el lead vuelve en c21; piano roto en c29; piano limpio en c33; **corte seco en c37 = 172,800 s** (solo 0,1 s de silencio digital después). Ningún silencio dentro de la canción.

## 6. Voz

Sin voz. Es la canción más triste y no canta nadie: la «voz» es el arpegio del lead (c1–17 y c21–25).

## 7. Notas para la película

- **Iris de linterna que crece** (biblia v2 §7) colgado del brillo de las cuerdas: c5, c9 y c17 son los tres escalones; el máximo en c17–25.
- c25: calma (la biblia pone ahí que Luzterna se arrodilla y no se levanta). La distorsión casi no baja (0,44) pero las cuerdas sí: el dolor se queda aunque la fuerza se va.
- c29–33: el piano se adelgaza; imagen que pierde graves y color (se «lava»), con los «Error» de c29 y c31 como dos golpes de glitch.
- c33–37: piano limpio y solo; el corte seco de c37 es el apagón del proyector.
- **Ojo, versión nueva**: el proyecto de Soundtrap va en la v284 (2026-10-21) y la exportación es la v223. La v284 **agrega una 4.ª capa de cuerdas en c17–25 (−5,3 dB)** y **un «Error» más en c33**. Si el dueño quiere esa versión en la película, tiene que exportarla de nuevo; los compases no cambian.

## 8. Límites

- Se midió la v223 (la exportada). La v284 tiene cuerdas extra en c17–25 y un «Error» en c33 que no están en el audio.
- A −20 LUFS es la más baja de las 9: en el juego habrá que decidir cuánto subirla (ver `audio-real.md` §5).

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
