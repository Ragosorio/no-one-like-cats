# No wey · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#no_wey`](linea-de-tiempo.html#no_wey).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «No wey (way, hiphop dark)» | EDITOR |
| Archivo | `No wey (way%2C hiphop dark).mp3` | carpeta del dueño (intacta) |
| Proyecto | `znsBGFR4ROiFqNhco6Ax6g` · versión 306 · última edición 2026-10-13 14:16 UTC | EDITOR |
| Tempo | **74 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 74,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **F#m** · croma de los stems tonales: C# (0,58), F#m (0,57), F# (0,41) | EDITOR + SEÑAL (débil) |
| Compases | **69,125** (c1 → c70,125) · 1 compás = 3,243 s · 1 tiempo = 0,8108 s | EDITOR |
| Duración | fin de la última región 3:44,2 (224,189 s) · archivo decodificado 226,928 s · **cola 2,74 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (rejilla del editor contra los ataques de agudos: −7,0 ms, dentro del sesgo del detector) | SEÑAL |
| Sonoridad | −13,4 LUFS integrados · LRA 9,6 LU · pico 0,4 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | kick & clap (audio) + kit «Corazón» (notas) | EDITOR |
| Voz | ninguna | EDITOR + SEÑAL |

## 1. Recomendación: **COMPLETA** (PROPUESTA)

- completa: la más dinámica, cuenta una vida: **c1 → fin** = 0:00,0 → 3:46,9 (**3:46,9**).
- Función narrativa propuesta: La vida de Luzterna en todas las veces que dijo que no (H87).
Completa: la más dinámica de las 9 en contrastes de volumen (LRA 9,6) y la biblia v2 la usa para contar una vida entera (H87). Sus breaks dan pausas para «las veces que dijo que no».

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Intro** (`intro`) | c1–c9 | 0:00,0–0:25,9 | 0,72 | 0,55 | melodía y hats (Corazón A); bajo desde c5 | un recuerdo que asoma |
| **Beat 1** (`verse`) | c9–c17 | 0:25,9–0:51,9 | 0,83 | 0,64 | entra el kick & clap | paso de calle, cabeza en alto |
| **Break** (`break`) | c17–c29 | 0:51,9–1:30,8 | 0,62 | 0,58 | sin bombo; otra melodía, bajo; Bumble Bee desde c21; hats vuelven c25 | pensar, dudar |
| **Beat 2** (`verse2`) | c29–c45 | 1:30,8–2:22,7 | 0,84 | 0,62 | vuelve el bombo (tarde en c33 +1,5 tiempos); melodías solapadas c41–45 | decidir y avanzar |
| **Break 2** (`break2`) | c45–c53 | 2:22,7–2:48,6 | 0,47 | 0,56 | c45–49 solo melodía; 2.º bajo desde c49 | soledad; quedarse quieta |
| **Beat 3** (`verse3`) | c53–c61 | 2:48,6–3:14,6 | 0,82 | 0,66 | bombo, bajo, melodía y Bumble Bee | la última vez que dice que no |
| **Cierre** (`outro`) | c61–c70,125 | 3:14,6–3:44,2 | 0,47 | 0,55 | sin bombo; el bajo se va en c65; la melodía sola se apaga | se va caminando |
| cola (`tail`) | c70,125–fin | 3:44,2–3:46,9 | — | — | la última nota de la melodía se apaga sola | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,60 D0,47 R0,19 | E0,69 D0,49 R0,23 | E0,70 D0,53 R0,38 | E0,69 D0,56 R0,49 | E0,77 D0,59 R0,62 | E0,76 D0,59 R0,64 | E0,77 D0,61 R0,71 | E0,77 D0,60 R0,66 |
| c9–c16 | E0,84 D0,66 R0,91 | E0,84 D0,64 R0,80 | E0,84 D0,66 R0,91 | E0,84 D0,62 R0,73 | E0,83 D0,63 R0,79 | E0,83 D0,64 R0,80 | E0,83 D0,65 R0,84 | E0,82 D0,64 R0,82 |
| c17–c24 | E0,50 D0,59 R0,62 | E0,46 D0,59 R0,64 | E0,50 D0,62 R0,73 | E0,46 D0,58 R0,57 | E0,59 D0,59 R0,62 | E0,57 D0,60 R0,68 | E0,59 D0,59 R0,61 | E0,62 D0,59 R0,63 |
| c25–c32 | E0,77 D0,56 R0,49 | E0,78 D0,58 R0,57 | E0,78 D0,57 R0,53 | E0,78 D0,56 R0,50 | E0,84 D0,65 R0,86 | E0,84 D0,65 R0,85 | E0,84 D0,66 R0,89 | E0,84 D0,62 R0,74 |
| c33–c40 | E0,81 D0,62 R0,73 | E0,84 D0,64 R0,80 | E0,84 D0,65 R0,86 | E0,84 D0,63 R0,77 | E0,84 D0,63 R0,78 | E0,84 D0,62 R0,76 | E0,84 D0,63 R0,78 | E0,84 D0,62 R0,74 |
| c41–c48 | E0,85 D0,58 R0,58 | E0,85 D0,60 R0,66 | E0,85 D0,62 R0,75 | E0,85 D0,58 R0,59 | E0,42 D0,39 R0,02 | E0,42 D0,45 R0,09 | E0,41 D0,49 R0,24 | E0,39 D0,42 R0,07 |
| c49–c56 | E0,56 D0,67 R0,95 | E0,49 D0,67 R0,90 | E0,53 D0,70 R0,98 | E0,55 D0,66 R0,88 | E0,81 D0,65 R0,85 | E0,82 D0,66 R0,89 | E0,82 D0,68 R0,95 | E0,82 D0,66 R0,90 |
| c57–c64 | E0,82 D0,65 R0,85 | E0,82 D0,66 R0,90 | E0,82 D0,68 R0,95 | E0,82 D0,65 R0,87 | E0,56 D0,65 R0,86 | E0,48 D0,66 R0,87 | E0,56 D0,70 R0,99 | E0,56 D0,65 R0,84 |
| c65–c70 | E0,46 D0,47 R0,16 | E0,42 D0,47 R0,17 | E0,42 D0,49 R0,25 | E0,40 D0,47 R0,20 | E0,36 D0,40 R0,03 | E0,03 D0,08 R0,00 |  |  |

Resumen: energía media 0,69 (p90 0,85), pendiente −0,053/min · distorsión media 0,60 (p90 0,68), pendiente −0,003/min.

### 2.2 Cómo crece (o no) la distorsión

Media 0,60, **estable** (sube un poco con el bombo y baja en los breaks: break2 0,56, salida 0,55). La textura viene del sinte «Boop» y del bajo Memphis, no de un efecto. No hay crecimiento.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Memphis - Battery (Kick & Clap) | audio | 0,0 | c9→c17 · c29→c33 · c33,3495→c37 · c37→c45 · c53→c61 |
| 1 | Corazón - Beat 1 (Tops) (notas) — «Corazón» | kit (notas) | −2,5 | c5→c13 · c29→c37 · c37→c45 |
| 2 | Corazón - Beat 1 (Tops) (notas) — «Corazón» | kit (notas) | −2,5 | c1→c5 · c13→c17 · c25→c29 |
| 3 | Winston - Boop (Synth Melody) | audio | 0,0 | c1→c9 · c9→c17 · c29→c37 · c37→c45 |
| 4 | Winston - Boop (Synth Melody) | audio | 0,0 | c17→c21 · c21→c29 · c41→c49 · c49→c57 · c57→c65 · c65→c69 · c69→c70,125 |
| 5 | Memphis - Battery (Bass) | audio | −9,6 | c5→c13 · c13→c21 · c21→c29 · c29→c37 · c37→c45 |
| 6 | Memphis - Battery (Bass) | audio | −7,8 | c49→c57 · c57→c65 |
| 7 | Car - Bumble Bee | audio | 0,0 | c21→c29 |
| 8 | Car - Bumble Bee | audio | −10,6 | c37→c45 · c53→c61 · c61→c69 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Corazón - Beat 1 (Tops) (notas) · Winston - Boop (Synth Melody) | — |
| c5 | 0:13,0 | Corazón - Beat 1 (Tops) (notas) · Memphis - Battery (Bass) | Corazón - Beat 1 (Tops) (notas) |
| c9 | 0:25,9 | Memphis - Battery (Kick & Clap) | — |
| c13 | 0:38,9 | Corazón - Beat 1 (Tops) (notas) | Corazón - Beat 1 (Tops) (notas) |
| c17 | 0:51,9 | Winston - Boop (Synth Melody) | Memphis - Battery (Kick & Clap) · Corazón - Beat 1 (Tops) (notas) · Winston - Boop (Synth Melody) |
| c21 | 1:04,9 | Car - Bumble Bee | — |
| c25 | 1:17,8 | Corazón - Beat 1 (Tops) (notas) | — |
| c29 | 1:30,8 | Memphis - Battery (Kick & Clap) · Corazón - Beat 1 (Tops) (notas) · Winston - Boop (Synth Melody) | Corazón - Beat 1 (Tops) (notas) · Winston - Boop (Synth Melody) · Car - Bumble Bee |
| c33 | 1:43,8 | — | Memphis - Battery (Kick & Clap) |
| c33,3495 | 1:44,9 | Memphis - Battery (Kick & Clap) | — |
| c37 | 1:56,8 | Car - Bumble Bee | — |
| c41 | 2:09,7 | Winston - Boop (Synth Melody) | — |
| c45 | 2:22,7 | — | Memphis - Battery (Kick & Clap) · Corazón - Beat 1 (Tops) (notas) · Winston - Boop (Synth Melody) · Memphis - Battery (Bass) · Car - Bumble Bee |
| c49 | 2:35,7 | Memphis - Battery (Bass) | — |
| c53 | 2:48,6 | Memphis - Battery (Kick & Clap) · Car - Bumble Bee | — |
| c61 | 3:14,6 | — | Memphis - Battery (Kick & Clap) |
| c65 | 3:27,6 | — | Memphis - Battery (Bass) |
| c69 | 3:40,5 | — | Car - Bumble Bee |
| c70,125 | 3:44,2 | — | Winston - Boop (Synth Melody) |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/no_wey.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 393 | 5,69 | 76 % | 0:00,8 | 3:31,4 |
| caja / palmas | 181 | 2,62 | 83 % | 0:01,8 | 3:34,7 |
| hats / ride / fx agudos | 478 | 6,92 | 95 % | 0:00,4 | 3:35,3 |
| bajo / 808 | 438 | 6,34 | 17 % | 0:00,4 | 3:32,0 |
| melodía (ataques) | 808 | 11,69 | 33 % | 0:00,0 | 3:43,9 |
| voz (ataques) | 0 | — | — | — | — |

Bombo y caja bien marcados en los beats (76 % y 83 % en la semicorchea); hats 95 %. El bajo se desliza y sus ataques son aproximados.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`bass_in` c5,012 (0:13,0) · `first_drop` c9,003 (0:26,0) · `kick_out` c16,994 (0:51,9) · `bumble_in` c21,003 (1:04,9) · `hats_back` c25 (1:17,8) · `kick_back` c29,003 (1:30,8) · `kick_late` c33,383 (1:45,0) · `melody_alone` c45 (2:22,7) · `bass2_in` c49,019 (2:35,7) · `kick_back_2` c53,003 (2:48,7) · `kick_out_2` c60,994 (3:14,6) · `bass_out` c65 (3:27,6) · `cut` c70,125 (3:44,2) · `end` c70,319 (3:44,8)

Bajo en c5 (13,01 s); bombo en c9; sin bombo de c17 a c29 (Bumble Bee en c21, hats en c25); el bombo de c33 entra tarde (105,03 s = c33 + 1,5 tiempos); c45–49 solo melodía (−22 dB); 2.º bajo en c49; el bajo se va en c65; la melodía se apaga sola después de c70,125 (sin corte).

## 6. Voz

Sin voz.

## 7. Notas para la película

- Las tres entradas del bombo (c9, c29, c53) son tres «decisiones».
- c45–49 (solo melodía) es el momento más solo de la canción: ideal para Luzterna quieta.
- El tropiezo del bombo en c33 + 1,5 tiempos es un pie que duda antes de pisar.

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
