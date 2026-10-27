# EM%EN · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#emen`](linea-de-tiempo.html#emen).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «EM%EN (Hiphop estilo eminen para cuando aparezca la referencia rapera de eminem)» | EDITOR |
| Archivo | `EM%EN (Hiphop estilo eminen para cuando aparezca la referencia rapera de eminem).mp3` | carpeta del dueño (intacta) |
| Proyecto | `rdY6Z4mvRhqM71LzVHknQw` · versión 114 · última edición 2026-10-14 14:52 UTC | EDITOR |
| Tempo | **103 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 103,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **Ebm** · croma de los stems tonales: C#m (0,44), B (0,19), C# (0,19) | EDITOR + SEÑAL (débil) |
| Compases | **80** (c1 → c81) · 1 compás = 2,330 s · 1 tiempo = 0,5825 s | EDITOR |
| Duración | fin de la última región 3:06,4 (186,408 s) · archivo decodificado 187,787 s · **cola 1,38 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: 4,5 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −9,5 LUFS integrados · LRA 14,1 LU · pico 0,6 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | pack «13 Gnarly» (bombo, caja, hats, paralela, beat completo) | EDITOR |
| Voz | coro «07 Strip (Chant)» (loop de 107 BPM estirado a 103) y un «Console Choir» de sinte. **No hay rap ni letra** | EDITOR + SEÑAL |

## 1. Recomendación: **COMPLETA** (PROPUESTA)

- completa: la batalla es la canción (verso · quiebre · verso · salida): **c1 → fin** = 0:00,0 → 3:07,8 (**3:07,8**).
- Función narrativa propuesta: La Batalla de Gatos (H73): el campeón, el quiebre en silencio, Canelo confiesa y gana.
Completa: **la batalla es la canción**. Tiene la forma exacta que pide la biblia v2 (verso del campeón c9–33 · quiebre c33–49 · verso de Canelo c49–73 · salida c73–81) y las dos mitades son simétricas (c1–48 y c49–81 repiten los mismos bloques). Dura 3:06 + 1,4 s de cola.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Intro: el escenario** (`intro`) | c1–c9 | 0:00,0–0:18,6 | 0,80 | 0,61 | bajo, stab, guitarra, hats, coro «Chant», Console Choir, atmósfera; sin batería | el público espera |
| **Verso 1a** (`verse`) | c9–c17 | 0:18,6–0:37,3 | 0,87 | 0,58 | entra la batería completa (bombo, caja, paralela) + Synth Lead 1; FX synth c13; scratch c16,56 | el campeón ataca |
| **Verso 1b** (`verse_b`) | c17–c25 | 0:37,3–0:55,9 | 0,87 | 0,58 | Synth Lead 2; la batería para en c24 (1 compás) | remate; el público grita |
| **Verso 1c** (`verse_c`) | c25–c33 | 0:55,9–1:14,6 | 0,86 | 0,60 | batería + Chant + coro + atmósfera + Lead 1 + guitarra | el campeón cierra su turno |
| **Quiebre** (`break`) | c33–c41 | 1:14,6–1:33,2 | 0,43 | 0,63 | sin batería ni bajo; Lead 2, Chant, coro, bajo distorsionado y shamisen roto (filtrados) | silencio en el escenario: confesión |
| **Subida** (`build`) | c41–c49 | 1:33,2–1:51,8 | 0,75 | 0,58 | el bajo sube con fundido de 8 compases; hats, guitarra | Canelo toma aire |
| **Verso 2a** (`verse2`) | c49–c57 | 1:51,8–2:10,5 | 0,87 | 0,57 | batería + Lead 1 + bajo | Canelo responde |
| **Verso 2b** (`verse2_b`) | c57–c65 | 2:10,5–2:29,1 | 0,86 | 0,58 | Lead 2; la batería para en c64 | golpe que el público siente |
| **Verso 2c** (`verse2_c`) | c65–c73 | 2:29,1–2:47,8 | 0,83 | 0,58 | batería + Chant + coro + atmósfera + Lead 1 | gana |
| **Salida** (`outro`) | c73–c81 | 2:47,8–3:06,4 | 0,42 | 0,63 | sin batería; Lead 2, Chant, coro, bajo distorsionado, shamisen | después de la batalla |
| cola (`tail`) | c81–fin | 3:06,4–3:07,8 | — | — | room del máster sobre el último compás | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,68 D0,62 R0,54 | E0,79 D0,64 R0,59 | E0,83 D0,57 R0,37 | E0,82 D0,63 R0,58 | E0,83 D0,57 R0,37 | E0,81 D0,64 R0,59 | E0,84 D0,59 R0,43 | E0,80 D0,65 R0,62 |
| c9–c16 | E0,86 D0,59 R0,44 | E0,90 D0,62 R0,53 | E0,86 D0,59 R0,43 | E0,89 D0,65 R0,65 | E0,85 D0,53 R0,23 | E0,85 D0,53 R0,23 | E0,86 D0,56 R0,32 | E0,87 D0,55 R0,28 |
| c17–c24 | E0,88 D0,59 R0,42 | E0,89 D0,59 R0,44 | E0,90 D0,62 R0,53 | E0,89 D0,65 R0,65 | E0,84 D0,54 R0,27 | E0,86 D0,53 R0,23 | E0,85 D0,57 R0,36 | E0,83 D0,53 R0,24 |
| c25–c32 | E0,87 D0,63 R0,56 | E0,88 D0,67 R0,70 | E0,87 D0,61 R0,51 | E0,88 D0,68 R0,75 | E0,85 D0,54 R0,26 | E0,84 D0,54 R0,25 | E0,88 D0,56 R0,34 | E0,83 D0,54 R0,27 |
| c33–c40 | E0,51 D0,49 R0,17 | E0,29 D0,76 R0,96 | E0,54 D0,53 R0,28 | E0,30 D0,75 R0,92 | E0,52 D0,51 R0,26 | E0,31 D0,75 R0,94 | E0,58 D0,50 R0,22 | E0,41 D0,75 R0,91 |
| c41–c48 | E0,70 D0,50 R0,19 | E0,69 D0,61 R0,52 | E0,73 D0,62 R0,55 | E0,74 D0,57 R0,35 | E0,77 D0,60 R0,46 | E0,79 D0,56 R0,34 | E0,81 D0,54 R0,28 | E0,78 D0,61 R0,51 |
| c49–c56 | E0,87 D0,59 R0,45 | E0,90 D0,61 R0,50 | E0,87 D0,58 R0,40 | E0,89 D0,63 R0,58 | E0,86 D0,54 R0,25 | E0,86 D0,52 R0,20 | E0,86 D0,55 R0,31 | E0,85 D0,55 R0,29 |
| c57–c64 | E0,88 D0,59 R0,42 | E0,89 D0,60 R0,47 | E0,90 D0,63 R0,56 | E0,89 D0,67 R0,69 | E0,84 D0,55 R0,28 | E0,84 D0,53 R0,24 | E0,84 D0,58 R0,39 | E0,82 D0,53 R0,23 |
| c65–c72 | E0,86 D0,61 R0,49 | E0,84 D0,65 R0,66 | E0,86 D0,60 R0,46 | E0,85 D0,66 R0,68 | E0,81 D0,54 R0,26 | E0,81 D0,51 R0,17 | E0,84 D0,56 R0,33 | E0,78 D0,53 R0,23 |
| c73–c80 | E0,51 D0,48 R0,16 | E0,29 D0,75 R0,93 | E0,52 D0,52 R0,27 | E0,29 D0,75 R0,92 | E0,52 D0,51 R0,27 | E0,30 D0,76 R0,96 | E0,57 D0,49 R0,20 | E0,38 D0,74 R0,90 |

Resumen: energía media 0,76 (p90 0,90), pendiente −0,065/min · distorsión media 0,59 (p90 0,70), pendiente −0,000/min.

### 2.2 Cómo crece (o no) la distorsión

La distorsión no sube con la energía: **se queda o sube cuando la energía cae**. En el quiebre (c33–49) y en la salida (c73–81) la energía baja a 0,42–0,43 pero la distorsión sube a 0,63 (contra 0,58 en los versos). Ahí entran el bajo «Broad Bass LFO Dist» (distorsión clásica, ganancia 15) y el shamisen roto (juicydist), **filtrados**: la automatización cierra el filtro del bajo de 7,6 kHz a 14 Hz y el del shamisen de 12,7 kHz a 210 Hz entre c30,75 y c33. Resultado medido: el stem de bajo cae 23 dB en c33 y la mezcla baja de −8,5 a −21 LUFS (LRA 14,1: la más dinámica de las 9). **El quiebre es silencioso pero sucio**: una confesión en voz baja con la garganta apretada.

En c41–49 el bajo «Gnarly» vuelve con un fundido de 8 compases (+23 dB medidos): es la única subida continua de la canción.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | 13 Gnarly (FX Scratch) | audio | 0,0 | c16,5625→c17 · c24,5625→c25 · c32,5625→c33 · c56,5625→c57 · c64,5625→c65 · c72,5625→c73 |
| 1 | 13 Gnarly (FX Synth) | audio | −11,3 | c13→c17 · c21→c25 · c29→c33 · c53→c57 · c61→c65 · c69→c73 |
| 2 | 13 Gnarly (Bass) | audio | 0,0 | c1→c9 · c9→c17 · c17→c25 · c25→c33 · c41→c49 (fi 32,00 t) · c49→c57 · c57→c65 · c65→c73 |
| 3 | 13 Gnarly (Drum Parallel Loop) | audio | 0,0 | c9→c17 · c17→c24 · c25→c33 · c49→c57 · c57→c64 · c65→c73 |
| 4 | 13 Gnarly (FX Stab) | audio | −5,4 | c1→c9 · c9→c17 · c17→c25 · c25→c33 · c33→c41 · c41→c49 · c49→c57 · c57→c65 · c65→c73 · c73→c81 |
| 5 | 13 Gnarly (Full Drum Beat) | audio | 0,0 | c9→c17 · c17→c25 · c25→c33 · c49→c57 · c57→c65 |
| 6 | 13 Gnarly (Guitar) | audio | −9,1 | c1→c9 · c9→c17 · c25→c33 · c41→c49 · c49→c57 |
| 7 | 13 Gnarly (Hats) | audio | 0,0 | c1→c9 · c9→c17 · c17→c24 · c25→c33 · c41→c49 · c49→c57 · c57→c64 · c65→c73 |
| 8 | 13 Gnarly (Synth Lead) | audio | −2,0 | c9→c17 · c25→c33 · c49→c57 · c65→c73 |
| 9 | 13 Gnarly (Synth Lead) | audio | 0,0 | c17→c25 · c33→c49 · c57→c65 · c73→c81 |
| 10 | 13 Gnarly (Snare) | audio | 0,0 | c9→c17 · c17→c24,125 · c25→c33 · c49→c57 · c57→c64,125 · c65→c73 |
| 11 | 13 Gnarly (Kick) | audio | 0,0 | c9→c17 · c17→c24 · c24→c24,25 · c25→c33 · c49→c57 · c57→c64 · c64→c64,25 · c65→c73 |
| 13 | 07 Strip (Chant) | audio | −11,9 | c1→c9 · c25→c33 · c33→c41 · c41→c49 · c65→c73 · c73→c81 |
| 14 | Console Choir — «Console Choir» | instrumento (notas) | −20,0 | c1→c3 · c3→c5 · c5→c7 · c7→c9 · c25→c27 · c27→c29 · c29→c31 · c31→c33 · c33→c35 · c35→c37 · c37→c39 · c39→c41 · c41→c43 · c43→c45 · c45→c47 · c47→c49 · c65→c67 · c67→c69 · c69→c71 · c71→c73 · c73→c75 · c75→c77 · c77→c79 · c79→c81 |
| 15 | Broad Bass LFO Dist  — «Broad Bass LFO Dist» | instrumento (notas) | −4,3 | c33→c49 · c73→c81 |
| 16 | Flimmer - Cute (FX Atmos) | audio | −16,3 | c1→c9 · c25→c33 · c33→c41 · c41→c49 · c65→c73 · c73→c81 |
| 17 | Broken Shamisen — «Broken Shamisen» | instrumento (notas) | −11,4 | c33→c35 · c35→c37 · c37→c39 · c39→c41 · c41→c43 · c43→c45 · c45→c47 · c47→c49 · c73→c75 · c75→c77 · c77→c79 · c79→c81 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | 13 Gnarly (Bass) · 13 Gnarly (FX Stab) · 13 Gnarly (Guitar) · 13 Gnarly (Hats) · 07 Strip (Chant) · Console Choir · Flimmer - Cute (FX Atmos) | — |
| c9 | 0:18,6 | 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Full Drum Beat) · 13 Gnarly (Synth Lead) · 13 Gnarly (Snare) · 13 Gnarly (Kick) | 07 Strip (Chant) · Console Choir · Flimmer - Cute (FX Atmos) |
| c13 | 0:28,0 | 13 Gnarly (FX Synth) | — |
| c16,5625 | 0:36,3 | 13 Gnarly (FX Scratch) | — |
| c17 | 0:37,3 | 13 Gnarly (Synth Lead) | 13 Gnarly (FX Scratch) · 13 Gnarly (FX Synth) · 13 Gnarly (Guitar) · 13 Gnarly (Synth Lead) |
| c21 | 0:46,6 | 13 Gnarly (FX Synth) | — |
| c24 | 0:53,6 | — | 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Hats) |
| c24,125 | 0:53,9 | — | 13 Gnarly (Snare) |
| c24,25 | 0:54,2 | — | 13 Gnarly (Kick) |
| c24,5625 | 0:54,9 | 13 Gnarly (FX Scratch) | — |
| c25 | 0:55,9 | 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Guitar) · 13 Gnarly (Hats) · 13 Gnarly (Synth Lead) · 13 Gnarly (Snare) · 13 Gnarly (Kick) · 07 Strip (Chant) · Console Choir · Flimmer - Cute (FX Atmos) | 13 Gnarly (FX Scratch) · 13 Gnarly (FX Synth) · 13 Gnarly (Synth Lead) |
| c29 | 1:05,2 | 13 Gnarly (FX Synth) | — |
| c32,5625 | 1:13,5 | 13 Gnarly (FX Scratch) | — |
| c33 | 1:14,6 | 13 Gnarly (Synth Lead) · Broad Bass LFO Dist · Broken Shamisen | 13 Gnarly (FX Scratch) · 13 Gnarly (FX Synth) · 13 Gnarly (Bass) · 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Full Drum Beat) · 13 Gnarly (Guitar) · 13 Gnarly (Hats) · 13 Gnarly (Synth Lead) · 13 Gnarly (Snare) · 13 Gnarly (Kick) |
| c41 | 1:33,2 | 13 Gnarly (Bass) (fundido de entrada de 8,00 compases) · 13 Gnarly (Guitar) · 13 Gnarly (Hats) | — |
| c49 | 1:51,8 | 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Full Drum Beat) · 13 Gnarly (Synth Lead) · 13 Gnarly (Snare) · 13 Gnarly (Kick) | 13 Gnarly (Synth Lead) · 07 Strip (Chant) · Console Choir · Broad Bass LFO Dist · Flimmer - Cute (FX Atmos) · Broken Shamisen |
| c53 | 2:01,2 | 13 Gnarly (FX Synth) | — |
| c56,5625 | 2:09,5 | 13 Gnarly (FX Scratch) | — |
| c57 | 2:10,5 | 13 Gnarly (Synth Lead) | 13 Gnarly (FX Scratch) · 13 Gnarly (FX Synth) · 13 Gnarly (Guitar) · 13 Gnarly (Synth Lead) |
| c61 | 2:19,8 | 13 Gnarly (FX Synth) | — |
| c64 | 2:26,8 | — | 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Hats) |
| c64,125 | 2:27,1 | — | 13 Gnarly (Snare) |
| c64,25 | 2:27,4 | — | 13 Gnarly (Kick) |
| c64,5625 | 2:28,1 | 13 Gnarly (FX Scratch) | — |
| c65 | 2:29,1 | 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Hats) · 13 Gnarly (Synth Lead) · 13 Gnarly (Snare) · 13 Gnarly (Kick) · 07 Strip (Chant) · Console Choir · Flimmer - Cute (FX Atmos) | 13 Gnarly (FX Scratch) · 13 Gnarly (FX Synth) · 13 Gnarly (Full Drum Beat) · 13 Gnarly (Synth Lead) |
| c69 | 2:38,4 | 13 Gnarly (FX Synth) | — |
| c72,5625 | 2:46,7 | 13 Gnarly (FX Scratch) | — |
| c73 | 2:47,8 | 13 Gnarly (Synth Lead) · Broad Bass LFO Dist · Broken Shamisen | 13 Gnarly (FX Scratch) · 13 Gnarly (FX Synth) · 13 Gnarly (Bass) · 13 Gnarly (Drum Parallel Loop) · 13 Gnarly (Hats) · 13 Gnarly (Synth Lead) · 13 Gnarly (Snare) · 13 Gnarly (Kick) |
| c81 | 3:06,4 | — | 13 Gnarly (FX Stab) · 13 Gnarly (Synth Lead) · 07 Strip (Chant) · Console Choir · Broad Bass LFO Dist · Flimmer - Cute (FX Atmos) · Broken Shamisen |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/emen.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 285 | 3,56 | 88 % | 0:18,6 | 2:52,7 |
| caja / palmas | 277 | 3,46 | 91 % | 0:00,3 | 3:02,7 |
| hats / ride / fx agudos | 525 | 6,56 | 93 % | 0:00,3 | 3:02,9 |
| bajo / 808 | 353 | 4,41 | 62 % | 0:00,6 | 3:06,4 |
| melodía (ataques) | 558 | 6,97 | 29 % | 0:00,1 | 3:06,4 |
| voz (ataques) | 80 | 1,00 | 19 % | 1:15,0 | 2:59,9 |

Muy limpios: bombo 88 %, caja 91 %, hats 93 % en la semicorchea. `vox` trae los ataques del coro solo donde se separa (quiebre y salida).

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`drums_in` c9 (0:18,6) · `fx_synth_1` c13 (0:28,0) · `scratch_1` c16,562 (0:36,3) · `lead2_in` c17 (0:37,3) · `fx_synth_2` c21 (0:46,6) · `drum_stop_1` c24 (0:53,6) · `scratch_2` c24,563 (0:54,9) · `drums_back` c25 (0:55,9) · `fx_synth_3` c29 (1:05,2) · `scratch_3` c32,563 (1:13,5) · `quiebre` c33 (1:14,6) · `bass_rise` c41 (1:33,2) · `drums_in_2` c49 (1:51,8) · `fx_synth_4` c53 (2:01,2) · `scratch_4` c56,562 (2:09,5) · `fx_synth_5` c61 (2:19,8) · `drum_stop_2` c64 (2:26,8) · `scratch_5` c64,563 (2:28,1) · `drums_back_2` c65 (2:29,1) · `fx_synth_6` c69 (2:38,4) · `scratch_6` c72,563 (2:46,7) · `salida` c73 (2:47,8) · `end` c81 (3:06,4)

La batería para **1 compás** en c24 y en c64 (el remate de cada medio verso). Scratch en c16,5625, c24,5625, c32,5625, c56,5625, c64,5625 y c72,5625 (los últimos 1¾ tiempos de cada bloque de 8 compases). «FX Synth» en c13, c21, c29, c53, c61 y c69. Quiebre en c33 (−12,5 dB de golpe). Batería de vuelta en c49. Salida sin batería en c73.

## 6. Voz

**No hay rap ni letra.** Hay un coro cantado, el loop «07 Strip (Chant)» (c1–9, c25–49, c65–81; altura estable, pyin 82–92 %), más un «Console Choir» de sinte a −20 dB. En los versos con batería el coro queda tapado; se separa bien en el quiebre y en la salida. Para la batalla de rap, **las palabras van en pantalla** siguiendo el bombo y la caja; no hay voz que respetar.

Regiones donde el stem de voz sobresale (SEÑAL, htdemucs; `tipo` por pyin, INFERIDO): 1:14,9–1:17,2 (cantada, −10,0 dB bajo la mezcla) · 1:24,7–1:26,8 (cantada, −10,8 dB bajo la mezcla) · 1:33,9–1:35,9 (cantada, −8,8 dB bajo la mezcla) · 1:38,2–1:40,6 (cantada, −10,3 dB bajo la mezcla) · 1:42,9–1:45,5 (cantada, −13,7 dB bajo la mezcla) · 2:48,2–2:50,5 (cantada, −8,3 dB bajo la mezcla) · 2:58,4–3:00,1 (cantada, −10,4 dB bajo la mezcla)

## 7. Notas para la película

- c1–9: el público espera (coro, sin batería). c9: entra el campeón.
- c24 y c64: un compás sin batería = el remate de cada verso (el público grita).
- c33: **quiebre**: todo se apaga y se filtra; Canelo solo en el escenario, la linterna de Luzterna lo ilumina (biblia v2). c41–49: el bajo sube 8 compases: Canelo toma aire.
- c49: la respuesta de Canelo, con la misma batería que el campeón (simetría).
- Los scratches marcan el final de cada bloque de 8 compases: cortes de plano ya hechos.

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
