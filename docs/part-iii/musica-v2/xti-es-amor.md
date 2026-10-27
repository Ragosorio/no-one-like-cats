# xti es amor · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#xti`](linea-de-tiempo.html#xti).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «xti es amor, (jazz)» | EDITOR |
| Archivo | `xti es amor, (jazz).mp3` | carpeta del dueño (intacta) |
| Proyecto | `4riizrbWSWW-vrEfs3O8aw` · versión 142 · última edición 2026-10-13 14:08 UTC | EDITOR |
| Tempo | **140 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 140,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **F#** · croma de los stems tonales: Ebm (0,83), Bbm (0,66), F# (0,61) | EDITOR + SEÑAL (débil) |
| Compases | **114** (c1 → c115) · 1 compás = 1,714 s · 1 tiempo = 0,4286 s | EDITOR |
| Duración | fin de la última región 3:15,4 (195,429 s) · archivo decodificado 198,021 s · **cola 2,59 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: −6,0 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −12,5 LUFS integrados · LRA 4,5 LU · pico 0,2 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | bembé y fill de bembé; caja + hat abierto | EDITOR |
| Voz | ninguna | EDITOR + SEÑAL |

## 1. Recomendación: **COMPLETA** (PROPUESTA)

- completa: la noche dura lo que dura la canción: **c1 → fin** = 0:00,0 → 3:18,0 (**3:18,0**).
- Función narrativa propuesta: La última noche tranquila (H92).
Completa: la noche dura lo que dura la canción (biblia v2 §8). Tiene dos zonas de pad solo para escenas quietas y un final que se apaga solo.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Pad solo** (`intro`) | c1–c17 | 0:00,0–0:27,4 | 0,55 | 0,24 | pad (Bmaj7–F#maj7–G#m7–A#m7); songstarter desde c9 | noche quieta |
| **Entra la batería** (`verse`) | c17–c33 | 0:27,4–0:54,9 | 0,78 | 0,31 | fill de bembé, bembé con fundido c21–25, bembé completo c25 | calor de casa |
| **Break** (`break`) | c33–c41 | 0:54,9–1:08,6 | 0,48 | 0,35 | solo el songstarter | una pausa para mirar |
| **Tutti** (`chorus`) | c41–c57 | 1:08,6–1:36,0 | 0,77 | 0,34 | pad, songstarter, bembé, bajo; caja y hat desde c49 | juntos |
| **Break largo** (`break2`) | c57–c81 | 1:36,0–2:17,1 | 0,63 | 0,28 | sin batería salvo el fill c65–73; pad solo c73–81 | la última conversación |
| **Tutti 2** (`chorus2`) | c81–c105 | 2:17,1–2:58,3 | 0,77 | 0,32 | todo; caja y hat desde c89 | la última vuelta del baile |
| **Cierre** (`outro`) | c105–c115 | 2:58,3–3:15,4 | 0,56 | 0,30 | songstarter solo, pad + songstarter, pad solo que se apaga | se apaga la luz |
| cola (`tail`) | c115–fin | 3:15,4–3:18,0 | — | — | el pad se apaga solo (room del máster) | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,40 D0,12 R0,03 | E0,55 D0,11 R0,01 | E0,51 D0,14 R0,12 | E0,49 D0,10 R0,00 | E0,53 D0,14 R0,11 | E0,53 D0,11 R0,01 | E0,50 D0,16 R0,18 | E0,50 D0,22 R0,35 |
| c9–c16 | E0,61 D0,32 R0,68 | E0,64 D0,34 R0,74 | E0,54 D0,37 R0,84 | E0,58 D0,36 R0,79 | E0,61 D0,31 R0,64 | E0,65 D0,32 R0,66 | E0,55 D0,38 R0,85 | E0,62 D0,38 R0,85 |
| c17–c24 | E0,78 D0,31 R0,63 | E0,80 D0,34 R0,74 | E0,74 D0,37 R0,83 | E0,78 D0,35 R0,78 | E0,78 D0,30 R0,61 | E0,81 D0,27 R0,51 | E0,81 D0,41 R0,95 | E0,79 D0,37 R0,83 |
| c25–c32 | E0,77 D0,27 R0,53 | E0,78 D0,30 R0,61 | E0,75 D0,31 R0,64 | E0,75 D0,28 R0,54 | E0,78 D0,26 R0,48 | E0,81 D0,28 R0,56 | E0,76 D0,31 R0,64 | E0,74 D0,29 R0,57 |
| c33–c40 | E0,55 D0,34 R0,69 | E0,48 D0,32 R0,69 | E0,42 D0,31 R0,66 | E0,51 D0,37 R0,85 | E0,47 D0,36 R0,80 | E0,43 D0,39 R0,87 | E0,51 D0,35 R0,77 | E0,51 D0,36 R0,79 |
| c41–c48 | E0,75 D0,27 R0,52 | E0,78 D0,31 R0,65 | E0,76 D0,34 R0,74 | E0,74 D0,32 R0,66 | E0,79 D0,29 R0,58 | E0,80 D0,31 R0,65 | E0,76 D0,37 R0,82 | E0,73 D0,31 R0,65 |
| c49–c56 | E0,75 D0,32 R0,68 | E0,80 D0,35 R0,76 | E0,75 D0,40 R0,93 | E0,75 D0,37 R0,83 | E0,78 D0,32 R0,69 | E0,79 D0,31 R0,64 | E0,78 D0,44 R0,97 | E0,80 D0,38 R0,87 |
| c57–c64 | E0,62 D0,31 R0,64 | E0,66 D0,33 R0,71 | E0,54 D0,36 R0,79 | E0,56 D0,34 R0,75 | E0,62 D0,31 R0,64 | E0,65 D0,33 R0,71 | E0,56 D0,38 R0,83 | E0,62 D0,36 R0,81 |
| c65–c72 | E0,76 D0,33 R0,70 | E0,80 D0,35 R0,76 | E0,77 D0,37 R0,83 | E0,77 D0,37 R0,82 | E0,80 D0,31 R0,65 | E0,79 D0,26 R0,48 | E0,78 D0,40 R0,93 | E0,77 D0,38 R0,87 |
| c73–c80 | E0,55 D0,15 R0,14 | E0,54 D0,11 R0,02 | E0,49 D0,16 R0,15 | E0,49 D0,10 R0,00 | E0,54 D0,13 R0,09 | E0,54 D0,11 R0,02 | E0,48 D0,15 R0,14 | E0,51 D0,22 R0,35 |
| c81–c88 | E0,77 D0,27 R0,53 | E0,79 D0,29 R0,58 | E0,74 D0,32 R0,66 | E0,74 D0,30 R0,61 | E0,78 D0,28 R0,54 | E0,80 D0,29 R0,57 | E0,76 D0,35 R0,77 | E0,78 D0,33 R0,70 |
| c89–c96 | E0,77 D0,30 R0,60 | E0,76 D0,31 R0,65 | E0,75 D0,36 R0,80 | E0,73 D0,34 R0,74 | E0,76 D0,29 R0,58 | E0,79 D0,29 R0,60 | E0,77 D0,44 R0,96 | E0,79 D0,40 R0,90 |
| c97–c104 | E0,78 D0,31 R0,65 | E0,77 D0,33 R0,71 | E0,75 D0,33 R0,71 | E0,75 D0,32 R0,68 | E0,78 D0,30 R0,61 | E0,79 D0,30 R0,62 | E0,74 D0,34 R0,72 | E0,78 D0,29 R0,57 |
| c105–c112 | E0,51 D0,34 R0,69 | E0,48 D0,33 R0,69 | E0,57 D0,26 R0,48 | E0,66 D0,34 R0,73 | E0,59 D0,36 R0,82 | E0,56 D0,30 R0,61 | E0,62 D0,38 R0,85 | E0,59 D0,34 R0,73 |
| c113–c114 | E0,52 D0,14 R0,14 | E0,51 D0,20 R0,29 |  |  |  |  |  |  |

Resumen: energía media 0,67 (p90 0,80), pendiente 0,013/min · distorsión media 0,30 (p90 0,40), pendiente 0,006/min.

### 2.2 Cómo crece (o no) la distorsión

Baja y estable (0,30). Cae a 0,12–0,16 en las zonas de pad solo (c1–8 y c73–80). No hay distorsión que crezca.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Lucid - Synth Pad 02 [F#] (notas) — «Cushy Pad» | instrumento (notas) | −6,4 | c1→c9 · c9→c17 · c17→c25 · c25→c33 · c41→c49 · c49→c57 · c57→c65 · c65→c73 · c73→c81 · c81→c89 · c89→c97 · c97→c105 · c107→c115 |
| 1 | Neighborhood - Menace (Songstarter) | audio | −5,0 | c9→c25 · c25→c41 · c41→c57 · c57→c73 · c81→c96,9913 · c96,9912→c112,991 |
| 3 | Drums - Bembe Fill | audio | 0,0 | c17→c25 · c65→c73 |
| 4 | Drums - Bembe | audio | −5,7 | c21→c25 (fi 16,00 t) · c25→c33 · c41→c49 · c49→c57 · c81→c89 · c89→c97 · c97→c105 |
| 5 | Bass - Dirty 27 | audio | −13,5 | c41→c49 · c49→c57 · c81→c89 · c89→c97 · c97→c105 |
| 6 | Drums - Rock Basic Snare and Open HH | audio | −6,4 | c49→c57 · c89→c97 · c97→c105 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Lucid - Synth Pad 02 (notas) | — |
| c9 | 0:13,7 | Neighborhood - Menace (Songstarter) | — |
| c17 | 0:27,4 | Drums - Bembe Fill | — |
| c21 | 0:34,3 | Drums - Bembe (fundido de entrada de 4,00 compases) | — |
| c25 | 0:41,1 | — | Drums - Bembe Fill |
| c33 | 0:54,9 | — | Lucid - Synth Pad 02 (notas) · Drums - Bembe |
| c41 | 1:08,6 | Lucid - Synth Pad 02 (notas) · Drums - Bembe · Bass - Dirty 27 | — |
| c49 | 1:22,3 | Drums - Rock Basic Snare and Open HH | — |
| c57 | 1:36,0 | — | Drums - Bembe · Bass - Dirty 27 · Drums - Rock Basic Snare and Open HH |
| c65 | 1:49,7 | Drums - Bembe Fill | — |
| c73 | 2:03,4 | — | Neighborhood - Menace (Songstarter) · Drums - Bembe Fill |
| c81 | 2:17,1 | Neighborhood - Menace (Songstarter) · Drums - Bembe · Bass - Dirty 27 | — |
| c89 | 2:30,9 | Drums - Rock Basic Snare and Open HH | — |
| c105 | 2:58,3 | — | Lucid - Synth Pad 02 (notas) · Drums - Bembe · Bass - Dirty 27 · Drums - Rock Basic Snare and Open HH |
| c107 | 3:01,7 | Lucid - Synth Pad 02 (notas) | — |
| c112,991 | 3:12,0 | — | Neighborhood - Menace (Songstarter) |
| c115 | 3:15,4 | — | Lucid - Synth Pad 02 (notas) |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/xti.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 389 | 3,41 | 33 % | 0:25,4 | 2:58,7 |
| caja / palmas | 272 | 2,39 | 62 % | 0:01,8 | 3:14,8 |
| hats / ride / fx agudos | 307 | 2,69 | 50 % | 0:27,4 | 2:58,1 |
| bajo / 808 | 164 | 1,44 | 6 % | 0:13,8 | 3:11,6 |
| melodía (ataques) | 1058 | 9,28 | 23 % | 0:00,0 | 3:15,1 |
| voz (ataques) | 0 | — | — | — | — |

El bombo cae poco en la semicorchea (33 %): el bembé tiene sensación de 12/8 (tresillos) sobre el 4/4 del editor (INFERIDO a partir de la medición). Para animar, mejor colgarse de las entradas de sección y del songstarter.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`starter_in` c9,046 (0:13,8) · `drums_in` c17 (0:27,4) · `break` c33,006 (0:54,9) · `tutti` c41 (1:08,6) · `snare_hh` c49 (1:22,3) · `break2` c57 (1:36,0) · `fill` c65 (1:49,7) · `pad_solo` c73 (2:03,4) · `tutti2` c81 (2:17,1) · `snare_hh2` c89 (2:30,9) · `cierre` c104,994 (2:58,3) · `pad_solo_end` c112,994 (3:12,0) · `cut` c115 (3:15,4) · `end` c115,866 (3:16,9)

Songstarter en c9; batería en c17 (fill), bembé completo en c25; break en c33; tutti en c41; caja y hat en c49; break largo en c57; fill en c65; pad solo en c73; tutti en c81; caja en c89; cierre en c105; el pad se apaga solo (cola 2,6 s). Todas las entradas caen a 0–10 ms del compás.

## 6. Voz

Sin voz.

## 7. Notas para la película

- Pad solo (c1–8 y c73–80): las dos escenas más quietas de toda la Parte III.
- c33–41 (solo songstarter): una pausa para mirar algo.

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
