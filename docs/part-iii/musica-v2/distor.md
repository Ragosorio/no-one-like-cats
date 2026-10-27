# DISTOR · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#distor`](linea-de-tiempo.html#distor).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «DISTOR (musica distorcionada estilo trap pero futurista fuerte y distorcionada)» | EDITOR |
| Archivo | `DISTOR (musica distorcionada estilo trap pero futurista fuerte y distorcionada).mp3` | carpeta del dueño (intacta) |
| Proyecto | `w35dg5gsRJmgDcCESZKUhg` · versión 157 · última edición 2026-10-27 00:17 UTC | EDITOR |
| Tempo | **112 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 112,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **F#m** · croma de los stems tonales: D (0,57), F#m (0,56), Bm (0,55) | EDITOR + SEÑAL (débil) |
| Compases | **81** (c1 → c82) · 1 compás = 2,143 s · 1 tiempo = 0,5357 s | EDITOR |
| Duración | fin de la última región 2:53,6 (173,571 s) · archivo decodificado 173,855 s · **cola 0,28 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (la fase de agudos da +27 ms porque las palmas vienen con flam y hay tresillos; contra la rejilla de semicorchea + tresillo, los ataques de batería dan mediana −8 a +9 ms. El groove no es recto, la rejilla sí) | SEÑAL |
| Sonoridad | −8,8 LUFS integrados · LRA 3,6 LU · pico 1,2 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | pack «Future Flu» (beat completo + FX de batería) y palmas con flam; tresillos de trap | EDITOR + SEÑAL |
| Voz | ninguna | EDITOR + SEÑAL |

## 1. Recomendación: **FRAGMENTO** (PROPUESTA)

- principal c25 → fin (2:02): riser, drop 2, breakdown, drop 3, el desfase y la salida: **c25 → fin** = 0:51,4 → 2:53,9 (**2:02,4**).
- alternativa c29 → fin (1:54): arranca en seco en el drop 2: **c29 → fin** = 1:00,0 → 2:53,9 (**1:53,9**).
- Función narrativa propuesta: La ruptura de Esquirla (H88): el glitch se come el libro.
Fragmento. La principal entra en **c25** (break con riser hacia el drop 2) y llega al final: drop 2, subida, breakdown, drop 3, **el desfase de c65,875** y la salida. Dura 2:02. Si tiene que durar ~1:50 (biblia v2), la alternativa c29 → fin (1:54) entra en seco con el drop 2. Lo que queda afuera (c1–24) es la presentación del glitch: repetitiva para una película, pero útil para una presentación de batalla.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Intro** (`intro`) | c1–c5 | 0:00,0–0:08,6 | 0,64 | 0,68 | 808 «Boom Li Do» + sinte «Future Flu» + FX de breakdown | una señal rota en la oscuridad |
| **Intro 2** (`intro2`) | c5–c9 | 0:08,6–0:17,1 | 0,75 | 0,67 | + pads + FX de batería (drop drum fx) | el glitch despierta |
| **Drop 1** (`drop`) | c9–c21 | 0:17,1–0:42,9 | 0,91 | 0,66 | entra la batería completa «Future Flu»; riser c17,5–21,5 | el glitch muerde |
| **Hueco + vuelta** (`gap`) | c21–c25 | 0:42,9–0:51,4 | 0,81 | 0,56 | c21–22 se callan 808 y sinte (1 compás); vuelven en c22 | un parpadeo de la pantalla |
| **Break** (`break`) | c25–c29 | 0:51,4–1:00,0 | 0,70 | 0,71 | sin batería completa: 808, sinte, FX de batería; riser c25,5–29,5 | tomar aire dentro de la máquina |
| **Drop 2** (`drop2`) | c29–c41 | 1:00,0–1:25,7 | 0,92 | 0,65 | batería + pads + FX de breakdown c29,5–37,5 | la página se deshace |
| **Subida** (`build`) | c41–c45 | 1:25,7–1:34,3 | 0,90 | 0,65 | sin 808 ni sinte; riser + batería + pads | el suelo tiembla |
| **Breakdown** (`breakdown`) | c45–c53 | 1:34,3–1:51,4 | 0,77 | 0,63 | sin batería: 808, sinte, palmas con flam, FX; pads y FX de batería desde c49 | zona muerta, ecos |
| **Drop 3** (`drop3`) | c53–c65 | 1:51,4–2:17,1 | 0,91 | 0,63 | batería completa otra vez + todo | la ruptura en pleno |
| **Desfase** (`shift`) | c65–c69 | 2:17,1–2:25,7 | 0,83 | 0,52 | c65–65,875 solo batería; desde c65,875 bajo, sinte y pads se corren medio tiempo contra la batería | el tiempo se rompe: todo tropieza |
| **Salida corrida** (`outro`) | c69–c82 | 2:25,7–2:53,6 | 0,79 | 0,63 | sin batería completa; palmas con flam y FX en la rejilla corrida; todo se va en c81,75–82 | lo que queda después del glitch |
| cola (`tail`) | c82–fin | 2:53,6–2:53,9 | — | — | decaimiento natural de los loops (el máster solo tiene limitador) | — |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,55 D0,61 R0,40 | E0,67 D0,70 R0,74 | E0,64 D0,68 R0,67 | E0,68 D0,75 R0,91 | E0,80 D0,70 R0,76 | E0,73 D0,67 R0,62 | E0,77 D0,65 R0,55 | E0,71 D0,66 R0,61 |
| c9–c16 | E0,92 D0,68 R0,69 | E0,92 D0,67 R0,62 | E0,92 D0,65 R0,56 | E0,89 D0,63 R0,47 | E0,87 D0,60 R0,36 | E0,92 D0,65 R0,54 | E0,92 D0,65 R0,54 | E0,91 D0,69 R0,71 |
| c17–c24 | E0,92 D0,62 R0,42 | E0,93 D0,67 R0,65 | E0,91 D0,68 R0,67 | E0,92 D0,79 R1,00 | E0,58 D0,23 R0,25 | E0,90 D0,69 R0,74 | E0,89 D0,64 R0,51 | E0,87 D0,70 R0,76 |
| c25–c32 | E0,67 D0,60 R0,46 | E0,68 D0,73 R0,87 | E0,71 D0,71 R0,79 | E0,76 D0,79 R1,00 | E0,92 D0,62 R0,43 | E0,93 D0,67 R0,62 | E0,91 D0,64 R0,52 | E0,90 D0,62 R0,45 |
| c33–c40 | E0,92 D0,67 R0,65 | E0,92 D0,68 R0,67 | E0,93 D0,64 R0,54 | E0,91 D0,69 R0,73 | E0,92 D0,60 R0,36 | E0,93 D0,66 R0,61 | E0,92 D0,63 R0,49 | E0,90 D0,62 R0,45 |
| c41–c48 | E0,87 D0,65 R0,55 | E0,92 D0,69 R0,73 | E0,91 D0,69 R0,72 | E0,90 D0,58 R0,49 | E0,75 D0,53 R0,19 | E0,75 D0,64 R0,50 | E0,72 D0,62 R0,43 | E0,73 D0,68 R0,68 |
| c49–c56 | E0,82 D0,69 R0,72 | E0,79 D0,65 R0,57 | E0,80 D0,65 R0,54 | E0,77 D0,63 R0,48 | E0,92 D0,59 R0,33 | E0,92 D0,65 R0,54 | E0,91 D0,64 R0,52 | E0,90 D0,63 R0,46 |
| c57–c64 | E0,84 D0,59 R0,35 | E0,92 D0,64 R0,51 | E0,91 D0,64 R0,51 | E0,91 D0,66 R0,61 | E0,92 D0,60 R0,36 | E0,92 D0,64 R0,51 | E0,92 D0,64 R0,53 | E0,90 D0,60 R0,39 |
| c65–c72 | E0,58 D0,22 R0,25 | E0,92 D0,61 R0,41 | E0,92 D0,60 R0,35 | E0,89 D0,64 R0,50 | E0,76 D0,68 R0,65 | E0,82 D0,68 R0,69 | E0,78 D0,67 R0,62 | E0,79 D0,63 R0,49 |
| c73–c80 | E0,76 D0,60 R0,43 | E0,85 D0,61 R0,40 | E0,79 D0,65 R0,55 | E0,81 D0,65 R0,54 | E0,80 D0,62 R0,44 | E0,84 D0,61 R0,40 | E0,79 D0,66 R0,61 | E0,80 D0,64 R0,52 |
| c81–c81 | E0,70 D0,54 R0,26 |  |  |  |  |  |  |  |

Resumen: energía media 0,84 (p90 0,93), pendiente 0,009/min · distorsión media 0,64 (p90 0,73), pendiente −0,021/min.

### 2.2 Cómo crece (o no) la distorsión

**La distorsión es un estado, no una subida.** Está en el material desde el compás 1 (los loops «Future Flu» vienen distorsionados; el proyecto no tiene ningún efecto de distorsión) y el índice se queda en 0,63–0,68 casi toda la canción (pendiente −0,02 por minuto). Lo que cambia es **cuánto se expone**: sube cuando se va la batería (break c25–29: **0,71**, el máximo; intro 0,68) y baja cuando la batería lo tapa.

El único «crecimiento» real está en el ritmo: **en c65,875 el bajo, el sinte y los pads se corren medio tiempo** (3,5 tiempos después del c65) mientras la batería sigue en su lugar hasta c69. El groove tropieza: la distorsión del tiempo. Ahí el índice de textura baja (0,52) porque es el momento más desnudo.

Para la película: si la distorsión tiene que **crecer** con la historia (el glitch comiéndose el libro), el crecimiento lo tiene que poner la imagen o el corte del fragmento (empezar en el break más sucio y terminar en el desfase), porque el audio no sube solo.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Brick - Boom Li Do 808 | audio | −6,7 | c1→c21 · c22→c25 · c25→c41 · c45→c65 · c65,875→c81,75 |
| 1 | Boom - Future Flu (Breakdown FX) | audio | 0,0 | c1→c9 · c9→c13 · c29,5→c37,5 · c45→c53 · c65,875→c73,875 |
| 2 | Boom - Future Flu (Breakdown Synth) | audio | −6,5 | c1→c21 · c22→c25 · c25→c41 · c45→c65 · c65,875→c82 |
| 3 | Boom - Future Flu (Breakdown Synth Pads) | audio | 0,0 | c5→c21 · c29→c29,25 · c29,25→c33 · c33→c44,9715 · c49→c65 · c65,875→c81,875 |
| 4 | Boom - Future Flu (Drop Drum FX) | audio | 0,0 | c5→c13 · c17→c41 · c49→c57 · c65,875→c73,875 · c77,875→c81,75 |
| 5 | Boom - Future Flu (Build-up Riser) | audio | −3,3 | c17,5→c21,5 · c25,5→c29,5 · c41→c44,9715 |
| 6 | Boom - Future Flu (Full Drum Beat) | audio | 0,0 | c9→c25 · c29→c45 · c53→c69 |
| 7 | Boom - No Cap (Breakdown Claps Flam) | audio | 0,0 | c45→c49 · c69,875→c73,875 |
| 8 | Boom - No Cap (Breakdown Claps Flam) — «Dusty Room Guitar» | audio | 0,0 | c49→c53 · c73,875→c81,875 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown FX) · Boom - Future Flu (Breakdown Synth) | — |
| c5 | 0:08,6 | Boom - Future Flu (Breakdown Synth Pads) · Boom - Future Flu (Drop Drum FX) | — |
| c9 | 0:17,1 | Boom - Future Flu (Full Drum Beat) | — |
| c13 | 0:25,7 | — | Boom - Future Flu (Breakdown FX) · Boom - Future Flu (Drop Drum FX) |
| c17 | 0:34,3 | Boom - Future Flu (Drop Drum FX) | — |
| c17,5 | 0:35,4 | Boom - Future Flu (Build-up Riser) | — |
| c21 | 0:42,9 | — | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown Synth) · Boom - Future Flu (Breakdown Synth Pads) |
| c21,5 | 0:43,9 | — | Boom - Future Flu (Build-up Riser) |
| c22 | 0:45,0 | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown Synth) | — |
| c25 | 0:51,4 | — | Boom - Future Flu (Full Drum Beat) |
| c25,5 | 0:52,5 | Boom - Future Flu (Build-up Riser) | — |
| c29 | 1:00,0 | Boom - Future Flu (Breakdown Synth Pads) · Boom - Future Flu (Full Drum Beat) | — |
| c29,5 | 1:01,1 | Boom - Future Flu (Breakdown FX) | Boom - Future Flu (Build-up Riser) |
| c37,5 | 1:18,2 | — | Boom - Future Flu (Breakdown FX) |
| c41 | 1:25,7 | Boom - Future Flu (Build-up Riser) | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown Synth) · Boom - Future Flu (Drop Drum FX) |
| c44,9715 | 1:34,2 | — | Boom - Future Flu (Breakdown Synth Pads) · Boom - Future Flu (Build-up Riser) |
| c45 | 1:34,3 | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown FX) · Boom - Future Flu (Breakdown Synth) · Boom - No Cap (Breakdown Claps Flam) | Boom - Future Flu (Full Drum Beat) |
| c49 | 1:42,9 | Boom - Future Flu (Breakdown Synth Pads) · Boom - Future Flu (Drop Drum FX) · Boom - No Cap (Breakdown Claps Flam) | Boom - No Cap (Breakdown Claps Flam) |
| c53 | 1:51,4 | Boom - Future Flu (Full Drum Beat) | Boom - Future Flu (Breakdown FX) · Boom - No Cap (Breakdown Claps Flam) |
| c57 | 2:00,0 | — | Boom - Future Flu (Drop Drum FX) |
| c65 | 2:17,1 | — | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown Synth) · Boom - Future Flu (Breakdown Synth Pads) |
| c65,875 | 2:19,0 | Brick - Boom Li Do 808 · Boom - Future Flu (Breakdown FX) · Boom - Future Flu (Breakdown Synth) · Boom - Future Flu (Breakdown Synth Pads) · Boom - Future Flu (Drop Drum FX) | — |
| c69 | 2:25,7 | — | Boom - Future Flu (Full Drum Beat) |
| c69,875 | 2:27,6 | Boom - No Cap (Breakdown Claps Flam) | — |
| c73,875 | 2:36,2 | Boom - No Cap (Breakdown Claps Flam) | Boom - Future Flu (Breakdown FX) · Boom - Future Flu (Drop Drum FX) · Boom - No Cap (Breakdown Claps Flam) |
| c77,875 | 2:44,7 | Boom - Future Flu (Drop Drum FX) | — |
| c81,75 | 2:53,0 | — | Brick - Boom Li Do 808 · Boom - Future Flu (Drop Drum FX) |
| c81,875 | 2:53,3 | — | Boom - Future Flu (Breakdown Synth Pads) · Boom - No Cap (Breakdown Claps Flam) |
| c82 | 2:53,6 | — | Boom - Future Flu (Breakdown Synth) |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/distor.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 291 | 3,59 | 45 % | 0:00,0 | 2:52,4 |
| caja / palmas | 180 | 2,22 | 44 % | 0:01,4 | 2:52,5 |
| hats / ride / fx agudos | 491 | 6,06 | 27 % | 0:17,3 | 2:52,5 |
| bajo / 808 | 169 | 2,09 | 45 % | 0:01,5 | 2:53,5 |
| melodía (ataques) | 1067 | 13,17 | 20 % | 0:00,2 | 2:53,5 |
| voz (ataques) | 0 | — | — | — | — |

Trap con **tresillos y flams**: solo el 45 % de los bombos cae en la semicorchea; muchos caen en el tresillo de corchea y las palmas vienen dobles (~20 ms de flam). La melodía tiene muchos ataques (el sinte distorsionado es continuo): para animar, filtrar por fuerza ≥ 0,5.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`pads_in` c5 (0:08,6) · `drums_in` c9 (0:17,1) · `fx_out` c13 (0:25,7) · `riser_1` c17,5 (0:35,4) · `gap` c21 (0:42,9) · `gap_end` c22 (0:45,0) · `drums_out` c25 (0:51,4) · `riser_2` c25,5 (0:52,5) · `drums_back` c29 (1:00,0) · `fx_2` c29,5 (1:01,1) · `bass_out` c41 (1:25,7) · `riser_3` c41 (1:25,7) · `breakdown` c45 (1:34,3) · `claps_in` c45 (1:34,3) · `pads_back` c49 (1:42,9) · `drums_back_2` c53 (1:51,4) · `drop_3` c53 (1:51,4) · `all_out_but_drums` c65 (2:17,1) · `shift` c65,875 (2:19,0) · `drums_out_2` c69 (2:25,7) · `claps_shift` c69,875 (2:27,6) · `claps_2` c73,875 (2:36,2) · `end` c82 (2:53,6)

Hueco de 1 compás en c21 (se callan 808 y sinte). Risers en c17,5, c25,5 y c41. Sin batería completa en c25–29, c45–53 y desde c69. Palmas con flam en c45–53. En c65 todo se calla menos la batería durante 3,5 tiempos (137,1–139,0 s) y en c65,875 vuelve todo corrido medio tiempo. Todo termina entre c81,75 y c82 (173,57 s) con solo 0,28 s de cola.

## 6. Voz

Sin voz. Lo que htdemucs separa como voz en 0:56–0:59 es el riser (fuga).

Regiones donde el stem de voz sobresale (SEÑAL, htdemucs; `tipo` por pyin, INFERIDO): 0:56,4–0:57,6 (cantada, −13,2 dB bajo la mezcla) · 0:58,4–0:59,5 (cantada, −15,5 dB bajo la mezcla)

## 7. Notas para la película

- c21: un compás en que la pantalla «parpadea» (se van bajo y sinte).
- c25–29: el momento más sucio: el glitch al desnudo.
- **c65 → c65,875**: 3,5 tiempos de batería sola y después todo vuelve **corrido**: es el plano donde el libro se rompe (las palabras se desfasan de su renglón, la imagen se desincroniza del sonido medio tiempo).
- La rejilla de la película no cambia: las palmas de la salida siguen cayendo en los tiempos del editor; solo el bajo y los sintes quedan corridos.

## 8. Límites

- La tonalidad no es concluyente por croma (F#m y D empatan); se usa la del editor.

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
