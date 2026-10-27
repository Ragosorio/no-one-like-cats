# NO G@ME NO LIF€ · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#no_game`](linea-de-tiempo.html#no_game).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «NO G@ME NO LIF€ (distorcion igual que en DISTOR pero mas pop y energetica)» | EDITOR |
| Archivo | `NO G%40ME NO LIF€ (distorcion igual que en DISTOR pero mas pop y energetica).mp3` | carpeta del dueño (intacta) |
| Proyecto | `BsbHXoDMQhOjXRxO3zJKIg` · versión 227 · última edición 2026-10-27 00:17 UTC | EDITOR |
| Tempo | **90 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 90,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **F#m** · croma de los stems tonales: B (0,71), Bm (0,71), F# (0,69) | EDITOR + SEÑAL (débil) |
| Compases | **76** (c1 → c77) · 1 compás = 2,667 s · 1 tiempo = 0,6667 s | EDITOR |
| Duración | fin de la última región 3:22,7 (202,667 s) · archivo decodificado 205,944 s · **cola 3,28 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: 0,0 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −11,3 LUFS integrados · LRA 3,7 LU · pico 0,2 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | groove «Fairlane Kit 1» + hat abierto | EDITOR |
| Voz | ninguna | EDITOR + SEÑAL |
| Tempo sentido | el editor dice 90; el arpegio corre en fusas y la batería es densa, así que se siente a 180 (la medición rápida de NARRATIVA dio ≈180) | EDITOR + INFERIDO |

## 1. Recomendación: **COMPLETA** (PROPUESTA)

- completa: la distorsión entra por capas (c14, c27, c38, c57) y gana al final: **c1 → fin** = 0:00,0 → 3:25,9 (**3:25,9**).
- Función narrativa propuesta: El show de Firma que se vuelve trampa y rompe la caja POP (H91).
Completa: es la que mejor cumple el pedido del dueño de una **distorsión que va ganando**. El sinte distorsionado «Future Flu» (el mismo loop que en DISTOR) aparece cuatro veces y cada vez se queda más: **c14–19 (5 compases), c27–35 (8), c38–45 (7) y c57–77 (20, hasta el final)**. Tiene dos subidas con un quiebre en el medio (la medición rápida de NARRATIVA lo vio en ~1:40–2:20 = c39–c53).

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Intro** (`intro`) | c1–c3 | 0:00,0–0:05,3 | 0,53 | 0,50 | arpegio «Rich Life» (Popcorn) + 808 | pantalla de inicio de un juego |
| **Intro 2** (`intro2`) | c3–c7 | 0:05,3–0:16,0 | 0,63 | 0,49 | + «Tap» (Dark Pluck) + piano «Blast» con fundido de 4 compases | PRESS START |
| **Entra la batería** (`verse`) | c7–c15 | 0:16,0–0:37,3 | 0,82 | 0,40 | batería «Fairlane»; el arpegio sale en c7 y vuelve en c11; Tap sale en c11 | el show empieza |
| **Primera distorsión** (`glitch1`) | c15–c19 | 0:37,3–0:48,0 | 0,56 | 0,62 | sin batería: piano + 808 + «Future Flu» distorsionado (desde c14) | algo raro en el show |
| **Subida 1** (`chorus`) | c19–c27 | 0:48,0–1:09,3 | 0,86 | 0,46 | batería + open hat + arpegio + Tap + piano + 808 | el show en su mejor momento |
| **Subida 1b: pregunta-respuesta** (`chorus_b`) | c27–c35 | 1:09,3–1:30,7 | 0,84 | 0,50 | «Future Flu» vuelve; arpegio y Tap se alternan cada compás desde c28; el piano sale en c31 | el juego se vuelve trampa |
| **Quiebre** (`break`) | c35–c41 | 1:30,7–1:46,7 | 0,72 | 0,43 | sin batería; open hat hasta c39; arpegio c39–45; «Future Flu» c38–45; 808 | la trampa se cierra |
| **Subida** (`build`) | c41–c49 | 1:46,7–2:08,0 | 0,74 | 0,45 | piano con fundido c41–45; Tap c41–49; batería desde c45 | reintentar |
| **Valle** (`verse2`) | c49–c57 | 2:08,0–2:29,3 | 0,65 | 0,44 | arpegio c49–53, batería hasta c53; c53–57 solo piano + 808 | última calma antes de romper |
| **Subida 2: la ruptura** (`climax`) | c57–c77 | 2:29,3–3:22,7 | 0,85 | 0,52 | todo junto 20 compases: batería, open hat, piano, «Future Flu», 808; arpegio y Tap alternan c66–77 | el juego se rompe; GAME OVER |
| cola (`tail`) | c77–fin | 3:22,7–3:25,9 | — | — | delay estéreo y sala de las pistas de sinte | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,47 D0,50 R0,60 | E0,58 D0,50 R0,60 | E0,65 D0,48 R0,52 | E0,61 D0,47 R0,51 | E0,63 D0,49 R0,55 | E0,64 D0,51 R0,62 | E0,82 D0,32 R0,03 | E0,81 D0,33 R0,07 |
| c9–c16 | E0,82 D0,35 R0,10 | E0,81 D0,35 R0,13 | E0,83 D0,45 R0,42 | E0,82 D0,47 R0,50 | E0,83 D0,45 R0,44 | E0,82 D0,50 R0,61 | E0,57 D0,58 R0,85 | E0,57 D0,67 R1,00 |
| c17–c24 | E0,57 D0,62 R0,92 | E0,53 D0,59 R0,82 | E0,85 D0,45 R0,44 | E0,85 D0,47 R0,48 | E0,86 D0,45 R0,43 | E0,85 D0,45 R0,42 | E0,86 D0,44 R0,41 | E0,86 D0,47 R0,49 |
| c25–c32 | E0,86 D0,46 R0,47 | E0,85 D0,46 R0,46 | E0,85 D0,41 R0,32 | E0,84 D0,56 R0,78 | E0,85 D0,53 R0,68 | E0,84 D0,55 R0,76 | E0,84 D0,33 R0,14 | E0,84 D0,55 R0,76 |
| c33–c40 | E0,83 D0,44 R0,39 | E0,82 D0,62 R0,95 | E0,77 D0,42 R0,34 | E0,74 D0,21 R0,00 | E0,75 D0,40 R0,28 | E0,80 D0,33 R0,14 | E0,66 D0,61 R0,94 | E0,62 D0,64 R1,00 |
| c41–c48 | E0,65 D0,58 R0,86 | E0,62 D0,53 R0,67 | E0,67 D0,58 R0,84 | E0,66 D0,60 R0,92 | E0,82 D0,30 R0,03 | E0,81 D0,33 R0,07 | E0,82 D0,35 R0,10 | E0,82 D0,34 R0,09 |
| c49–c56 | E0,83 D0,44 R0,40 | E0,82 D0,47 R0,51 | E0,83 D0,45 R0,42 | E0,81 D0,46 R0,48 | E0,50 D0,40 R0,26 | E0,49 D0,42 R0,34 | E0,45 D0,41 R0,32 | E0,47 D0,47 R0,48 |
| c57–c64 | E0,84 D0,47 R0,51 | E0,86 D0,55 R0,75 | E0,87 D0,55 R0,77 | E0,85 D0,55 R0,75 | E0,86 D0,49 R0,57 | E0,86 D0,56 R0,78 | E0,87 D0,56 R0,78 | E0,85 D0,55 R0,74 |
| c65–c72 | E0,85 D0,41 R0,32 | E0,85 D0,58 R0,83 | E0,85 D0,49 R0,56 | E0,84 D0,56 R0,77 | E0,84 D0,40 R0,27 | E0,83 D0,57 R0,83 | E0,85 D0,49 R0,58 | E0,84 D0,55 R0,76 |
| c73–c76 | E0,86 D0,48 R0,54 | E0,84 D0,49 R0,55 | E0,86 D0,57 R0,81 | E0,83 D0,53 R0,68 |  |  |  |  |

Resumen: energía media 0,77 (p90 0,86), pendiente 0,027/min · distorsión media 0,48 (p90 0,59), pendiente 0,011/min.

### 2.2 Cómo crece (o no) la distorsión

La distorsión **aparece desnuda y después se instala**. Por sección: intro 0,50 · entra la batería 0,40 · **primera distorsión (c15–19, sin batería) 0,62, el pico** · subida 1: 0,46–0,50 · quiebre 0,43 · valle 0,44 · **subida 2 (c57–77): 0,52 sostenida 20 compases**. El crecimiento no es de intensidad punta, es de **presencia**: 5 → 8 → 7 → 20 compases con el sinte distorsionado. Al final ya no se va.

Es el **hilo musical del derrame** que propone la biblia v2: el mismo timbre que DISTOR, más pop. DISTOR lo tiene todo el tiempo; NO G@ME lo va dejando entrar.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Synth - Rich Life 2 — «Popcorn» | instrumento (notas) | 0,0 | c1→c7 · c11→c15 (fo 0,37 t) · c19→c27 (fo 0,37 t) · c28→c29 (fo 0,37 t) · c30→c31 (fo 0,37 t) · c32→c33 (fo 0,37 t) · c35→c36 (fo 0,37 t) · c37→c38 (fo 0,37 t) · c39→c45 · c49→c53 (fo 0,37 t) · c57→c65 (fo 0,37 t) · c66→c67 (fo 0,37 t) · c68→c69 (fo 0,37 t) · c70→c71 (fo 0,37 t) · c72→c74 (fo 0,37 t) · c75→c77 (fo 0,37 t) |
| 1 | Synth - Tap — «Dark Pluck» | instrumento (notas) | −5,8 | c3→c11 · c19→c28 · c29→c30 · c31→c32 · c33→c34 · c36→c37 · c38→c39 · c41→c49 · c57→c66 · c67→c68 · c69→c70 · c71→c72 · c73→c75 · c76→c77 |
| 2 | Elevation - Blast (Piano) | audio | −7,0 | c3→c11 (fi 16,02 t) · c11→c31 · c41→c49 (fi 15,45 t) · c49→c77 |
| 3 | Fairlane Kit 1 - Groove 05 | audio | 0,0 | c7→c15 · c19→c35 · c45→c53 · c57→c77 |
| 4 | Drums - Rock Basic Open HH | audio | 0,0 | c19→c39 · c57→c77 |
| 5 | Flag - 808 1 — «Flag 808» | instrumento (notas) | −11,3 | c1→c39 · c39→c77 |
| 6 | Boom - Future Flu (Breakdown Synth) | audio | −11,4 | c14,021→c19 · c27→c35 · c38→c45 · c57→c77 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Synth - Rich Life 2 · Flag - 808 1 | — |
| c3 | 0:05,3 | Synth - Tap · Elevation - Blast (Piano) (fundido de entrada de 4,00 compases) | — |
| c7 | 0:16,0 | Fairlane Kit 1 - Groove 05 | Synth - Rich Life 2 |
| c11 | 0:26,7 | Synth - Rich Life 2 | Synth - Tap |
| c14,021 | 0:34,7 | Boom - Future Flu (Breakdown Synth) | — |
| c15 | 0:37,3 | — | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) · Fairlane Kit 1 - Groove 05 |
| c19 | 0:48,0 | Synth - Rich Life 2 · Synth - Tap · Fairlane Kit 1 - Groove 05 · Drums - Rock Basic Open HH | Boom - Future Flu (Breakdown Synth) |
| c27 | 1:09,3 | Boom - Future Flu (Breakdown Synth) | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c28 | 1:12,0 | Synth - Rich Life 2 | Synth - Tap |
| c29 | 1:14,7 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c30 | 1:17,3 | Synth - Rich Life 2 | Synth - Tap |
| c31 | 1:20,0 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) · Elevation - Blast (Piano) |
| c32 | 1:22,7 | Synth - Rich Life 2 | Synth - Tap |
| c33 | 1:25,3 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c34 | 1:28,0 | — | Synth - Tap |
| c35 | 1:30,7 | Synth - Rich Life 2 | Fairlane Kit 1 - Groove 05 · Boom - Future Flu (Breakdown Synth) |
| c36 | 1:33,3 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c37 | 1:36,0 | Synth - Rich Life 2 | Synth - Tap |
| c38 | 1:38,7 | Synth - Tap · Boom - Future Flu (Breakdown Synth) | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c39 | 1:41,3 | Synth - Rich Life 2 | Synth - Tap · Drums - Rock Basic Open HH |
| c41 | 1:46,7 | Synth - Tap · Elevation - Blast (Piano) (fundido de entrada de 3,86 compases) | — |
| c45 | 1:57,3 | Fairlane Kit 1 - Groove 05 | Synth - Rich Life 2 · Boom - Future Flu (Breakdown Synth) |
| c49 | 2:08,0 | Synth - Rich Life 2 | Synth - Tap |
| c53 | 2:18,7 | — | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) · Fairlane Kit 1 - Groove 05 |
| c57 | 2:29,3 | Synth - Rich Life 2 · Synth - Tap · Fairlane Kit 1 - Groove 05 · Drums - Rock Basic Open HH · Boom - Future Flu (Breakdown Synth) | — |
| c65 | 2:50,7 | — | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c66 | 2:53,3 | Synth - Rich Life 2 | Synth - Tap |
| c67 | 2:56,0 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c68 | 2:58,7 | Synth - Rich Life 2 | Synth - Tap |
| c69 | 3:01,3 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c70 | 3:04,0 | Synth - Rich Life 2 | Synth - Tap |
| c71 | 3:06,7 | Synth - Tap | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c72 | 3:09,3 | Synth - Rich Life 2 | Synth - Tap |
| c73 | 3:12,0 | Synth - Tap | — |
| c74 | 3:14,7 | — | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) |
| c75 | 3:17,3 | Synth - Rich Life 2 | Synth - Tap |
| c76 | 3:20,0 | Synth - Tap | — |
| c77 | 3:22,7 | — | Synth - Rich Life 2 (fundido de salida de 0,37 tiempos) · Synth - Tap · Elevation - Blast (Piano) · Fairlane Kit 1 - Groove 05 · Drums - Rock Basic Open HH · Flag - 808 1 · Boom - Future Flu (Breakdown Synth) |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/no_game.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 697 | 9,17 | 92 % | 0:16,0 | 3:22,5 |
| caja / palmas | 265 | 3,49 | 92 % | 0:16,3 | 3:22,3 |
| hats / ride / fx agudos | 363 | 4,78 | 92 % | 0:02,5 | 3:22,3 |
| bajo / 808 | 152 | 2,00 | 100 % | 0:00,0 | 3:21,7 |
| melodía (ataques) | 928 | 12,21 | 18 % | 0:00,3 | 3:22,5 |
| voz (ataques) | 0 | — | — | — | — |

El 808 sale de las **notas del editor** (exacto: Fa#1 – Fa#1 – Si1 – Si1 cada 2 compases, c1–77). El bombo es muy denso (9 por compás): incluye golpes fantasma del groove y algo de fuga; para animar, filtrar por fuerza ≥ 0,5. Caja y hats en la semicorchea (92 %).

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`taps_in` c3 (0:05,3) · `piano_fade` c3 (0:05,3) · `drums_in` c7 (0:16,0) · `arp_back` c11 (0:26,7) · `distortion_1` c14,021 (0:34,7) · `drums_out` c15 (0:37,3) · `chorus` c19 (0:48,0) · `distortion_2` c27 (1:09,3) · `call_response` c28 (1:12,0) · `piano_out` c31 (1:20,0) · `drums_out_2` c35 (1:30,7) · `distortion_3` c38 (1:38,7) · `hats_out` c39 (1:41,3) · `piano_fade_2` c41 (1:46,7) · `drums_back` c45 (1:57,3) · `drums_out_3` c53 (2:18,7) · `climax` c57 (2:29,3) · `call_response_2` c66 (2:53,3) · `end` c77 (3:22,7)

Batería: entra en c7, sale en c15, vuelve en c19, sale en c35, vuelve en c45, sale en c53, vuelve en c57 hasta el final. Hat abierto c19–39 y c57–77. **Pregunta-respuesta**: el arpegio y el «Tap» se alternan **un compás cada uno** de c28 a c38 y de c66 a c77. c53–57: solo piano + 808, el valle más bajo (−15,6 LUFS). Termina en c77 con 3,3 s de cola de delay y sala.

## 6. Voz

Sin voz.

## 7. Notas para la película

- c14: primera vez que suena «la textura que rompe cosas»: el HUD del juego falla un instante. c15–19: sin batería, solo piano, 808 y la distorsión: la trampa se asoma.
- c28–38 y c66–77: el **ping-pong** arpegio/Tap, compás por compás, es perfecto para dos jugadores o dos pantallas que se contestan.
- c53–57: última calma (piano + 808) antes de romper.
- c57: entra todo y ya no se va: GAME OVER que se rompe en la caja POP.

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
