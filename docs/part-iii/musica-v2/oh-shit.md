# OH SHIT · análisis musical (MUSICA-V2)

> Ronda 4 de la Parte III (`../14-plan-cinematografico.md`). ⚠️ Spoilers de la Parte III. Línea de tiempo visual: [`linea-de-tiempo.html#oh_shit`](linea-de-tiempo.html#oh_shit).
> Etiquetas: **EDITOR** = proyecto de Soundtrap leído en solo lectura (regiones exactas) · **SEÑAL** = medido en la exportación del dueño (copia en `audio-derivados/originales/parte-iii/`) · **INFERIDO** = lectura del agente, puede estar mal. Nadie escuchó con oído humano.

## 0. Ficha

| Dato | Valor | Origen |
|---|---|---|
| Título real | «OH SHIT (Animated song i dont know the genero of song)» | EDITOR |
| Archivo | `OH SHIT (Animated song i dont know the genero of song).mp3` | carpeta del dueño (intacta) |
| Proyecto | `rH_FA7HHQPuL3zy8sE-yZg` · versión 208 · última edición 2026-10-13 18:57 UTC | EDITOR |
| Tempo | **145 BPM** constante (un solo `bpm`, sin mapa de tempo); plegado en la señal: 145,000 | EDITOR + SEÑAL |
| Compás | 4/4, sin anacrusa | EDITOR |
| Tonalidad | **Em** · croma de los stems tonales: G (0,56), Em (0,49), Bm (0,45) | EDITOR + SEÑAL (débil) |
| Compases | **122** (c1 → c123) · 1 compás = 1,655 s · 1 tiempo = 0,4138 s | EDITOR |
| Duración | fin de la última región 3:21,9 (201,931 s) · archivo decodificado 201,948 s · **cola 0,02 s** | EDITOR + SEÑAL |
| Compás 1 en el archivo | **0,000 s** (el beat tiene swing y la caja adelantada ~17 ms; la fase de agudos da −6 ms) | SEÑAL |
| Sonoridad | −9,3 LUFS integrados · LRA 6,4 LU · pico 1,2 dBTP | SEÑAL (ffmpeg ebur128) |
| Batería | loop «Beat – Dance 2» (con swing); el drop «Portmore» trae su propia batería | EDITOR + SEÑAL |
| Voz | ninguna (las sirenas y la melodía «Coil» se cuelan en el stem de voz) | EDITOR + SEÑAL |
| Ojo | el proyecto se editó 4 minutos después de exportar (archivo 12:53, proyecto 12:57 hora local); la estructura medida calza con las regiones (fin a 17 ms) | EDITOR + SEÑAL |

## 1. Recomendación: **FRAGMENTO** (PROPUESTA)

- principal c45 → fin (2:09): beat + textura, las dos caídas «Portmore» y el aterrizaje: **c45 → fin** = 1:12,8 → 3:21,9 (**2:09,1**).
- alternativa c37 → fin (2:22): entra por el suspenso picado: **c37 → fin** = 0:59,6 → 3:21,9 (**2:22,4**).
- Función narrativa propuesta: La caída por el multiverso (fin de H74, puente al Acto II).
Fragmento. La principal entra en **c45** (beat + textura: el piso se va) y llega hasta el final, con las **dos caídas «Portmore» (c73 y c101)** y el aterrizaje con fundidos (c117–123). Dura 2:09, lo que pide la biblia (~2:10). La alternativa entra en **c37**, con el suspenso picado (la melodía cortada en c37, c40 y c41,125: «¿qué fue eso?»), y dura 2:22. Las partes que quedan afuera (c1–36) son la intro y tres grooves parecidos: es la parte «aburrida» para una película.

## 2. Secciones, energía y distorsión

Energía y distorsión: media de la sección en la escala común de las 9 canciones (0–1; método en `00-LEEME.md` §4).

| Sección (beat map) | Compases | Tiempo | Energía | Distorsión | Qué entra y sale (EDITOR) | Lo que se siente (INFERIDO) |
|---|---|---|---|---|---|---|
| **Intro: textura** (`intro`) | c1–c9 | 0:00,0–0:13,2 | 0,56 | 0,66 | textura «Texturex» + bajo «Kandy» | antes de la caída: algo zumba |
| **Groove A** (`groove`) | c9–c17 | 0:13,2–0:26,5 | 0,83 | 0,70 | entra el beat «Dance 2» | ya nos movemos |
| **Groove B** (`groove2`) | c17–c25 | 0:26,5–0:39,7 | 0,88 | 0,61 | se va la textura; entra la melodía «Coil» (c16) | el piso se inclina |
| **Stop** (`stop`) | c25–c29 | 0:39,7–0:46,3 | 0,58 | 0,49 | sin beat: bajo + Coil | suspenso de 4 compases |
| **Groove C** (`groove3`) | c29–c37 | 0:46,3–0:59,6 | 0,85 | 0,54 | vuelve el beat, sin Coil | caer y seguir cayendo |
| **Suspenso** (`suspense`) | c37–c45 | 0:59,6–1:12,8 | 0,60 | 0,64 | sin beat; vuelve la textura; Coil picado en c37, c40, c41,125 | «¿qué fue eso?» |
| **Beat + textura** (`build`) | c45–c57 | 1:12,8–1:32,7 | 0,82 | 0,69 | beat + textura + bajo | ya no hay vuelta atrás |
| **Beat + Coil** (`build2`) | c57–c73 | 1:32,7–1:59,2 | 0,84 | 0,69 | + Coil desde c57; «Synth Drop» en c72 | la presión sube |
| **¡OH SHIT! 1** (`drop`) | c73–c89 | 1:59,2–2:25,7 | 0,81 | 0,65 | «Portmore» (instrumental) + sirenas; sin beat «Dance»; Coil; drop c87 | la caída de verdad: universo tras universo |
| **Beat de vuelta** (`verse`) | c89–c101 | 2:25,7–2:45,5 | 0,82 | 0,70 | beat + Coil picado (c89, c92, c93,125) + textura; drop c100 | respiro en el aire |
| **¡OH SHIT! 2** (`drop2`) | c101–c117 | 2:45,5–3:12,0 | 0,83 | 0,70 | «Portmore» + sirenas picadas; drop c115 | la segunda caída, más larga |
| **Aterrizaje** (`outro`) | c117–c123 | 3:12,0–3:21,9 | 0,62 | 0,56 | Coil + bajo con fundidos; la textura se va en c121 | aterrizar; el polvo baja |

### 2.1 Curva compás a compás (cada celda = 1 compás; E = energía, D = distorsión absoluta, R = distorsión relativa a la canción)

| Compases | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
|---|---|---|---|---|---|---|---|---|
| c1–c8 | E0,50 D0,73 R0,80 | E0,51 D0,56 R0,26 | E0,61 D0,70 R0,73 | E0,56 D0,69 R0,68 | E0,62 D0,70 R0,74 | E0,51 D0,55 R0,21 | E0,60 D0,69 R0,70 | E0,57 D0,68 R0,63 |
| c9–c16 | E0,81 D0,72 R0,79 | E0,84 D0,64 R0,52 | E0,83 D0,70 R0,72 | E0,81 D0,73 R0,81 | E0,83 D0,71 R0,77 | E0,84 D0,63 R0,48 | E0,83 D0,71 R0,75 | E0,83 D0,75 R0,87 |
| c17–c24 | E0,90 D0,57 R0,29 | E0,86 D0,66 R0,57 | E0,89 D0,57 R0,30 | E0,87 D0,62 R0,45 | E0,89 D0,56 R0,24 | E0,85 D0,63 R0,49 | E0,90 D0,58 R0,35 | E0,87 D0,65 R0,55 |
| c25–c32 | E0,58 D0,49 R0,05 | E0,59 D0,48 R0,01 | E0,53 D0,51 R0,05 | E0,61 D0,49 R0,04 | E0,86 D0,50 R0,14 | E0,86 D0,57 R0,27 | E0,87 D0,50 R0,12 | E0,82 D0,58 R0,33 |
| c33–c40 | E0,86 D0,49 R0,09 | E0,87 D0,57 R0,26 | E0,87 D0,50 R0,12 | E0,81 D0,59 R0,33 | E0,71 D0,68 R0,65 | E0,50 D0,57 R0,27 | E0,61 D0,70 R0,73 | E0,65 D0,65 R0,54 |
| c41–c48 | E0,70 D0,64 R0,51 | E0,51 D0,56 R0,22 | E0,60 D0,69 R0,70 | E0,56 D0,67 R0,62 | E0,80 D0,72 R0,80 | E0,84 D0,63 R0,49 | E0,83 D0,70 R0,73 | E0,80 D0,73 R0,82 |
| c49–c56 | E0,84 D0,71 R0,76 | E0,82 D0,63 R0,47 | E0,83 D0,70 R0,73 | E0,79 D0,72 R0,79 | E0,83 D0,72 R0,78 | E0,84 D0,64 R0,51 | E0,83 D0,70 R0,73 | E0,82 D0,73 R0,81 |
| c57–c64 | E0,86 D0,74 R0,83 | E0,81 D0,69 R0,68 | E0,83 D0,73 R0,82 | E0,82 D0,74 R0,85 | E0,83 D0,73 R0,81 | E0,81 D0,68 R0,65 | E0,84 D0,70 R0,74 | E0,84 D0,73 R0,83 |
| c65–c72 | E0,87 D0,74 R0,84 | E0,83 D0,67 R0,64 | E0,85 D0,72 R0,81 | E0,84 D0,73 R0,83 | E0,85 D0,54 R0,17 | E0,84 D0,64 R0,51 | E0,89 D0,55 R0,20 | E0,85 D0,66 R0,59 |
| c73–c80 | E0,80 D0,66 R0,58 | E0,84 D0,64 R0,52 | E0,81 D0,63 R0,49 | E0,84 D0,65 R0,55 | E0,83 D0,60 R0,37 | E0,84 D0,62 R0,45 | E0,82 D0,60 R0,36 | E0,82 D0,73 R0,80 |
| c81–c88 | E0,81 D0,73 R0,83 | E0,81 D0,63 R0,48 | E0,78 D0,69 R0,68 | E0,78 D0,69 R0,70 | E0,78 D0,70 R0,74 | E0,82 D0,59 R0,34 | E0,78 D0,63 R0,49 | E0,81 D0,69 R0,70 |
| c89–c96 | E0,86 D0,72 R0,78 | E0,83 D0,65 R0,56 | E0,82 D0,70 R0,72 | E0,82 D0,74 R0,87 | E0,85 D0,73 R0,81 | E0,82 D0,64 R0,51 | E0,82 D0,70 R0,74 | E0,80 D0,72 R0,80 |
| c97–c104 | E0,86 D0,74 R0,85 | E0,83 D0,67 R0,61 | E0,83 D0,71 R0,78 | E0,72 D0,72 R0,80 | E0,78 D0,72 R0,79 | E0,79 D0,68 R0,66 | E0,81 D0,73 R0,82 | E0,86 D0,71 R0,76 |
| c105–c112 | E0,83 D0,76 R0,94 | E0,84 D0,66 R0,60 | E0,85 D0,71 R0,75 | E0,88 D0,72 R0,81 | E0,81 D0,71 R0,76 | E0,84 D0,65 R0,56 | E0,81 D0,71 R0,77 | E0,83 D0,68 R0,67 |
| c113–c120 | E0,83 D0,75 R0,90 | E0,84 D0,64 R0,51 | E0,86 D0,67 R0,63 | E0,84 D0,73 R0,85 | E0,74 D0,63 R0,47 | E0,68 D0,58 R0,31 | E0,72 D0,63 R0,47 | E0,66 D0,65 R0,54 |
| c121–c122 | E0,61 D0,51 R0,07 | E0,32 D0,40 R0,11 |  |  |  |  |  |  |

Resumen: energía media 0,78 (p90 0,87), pendiente 0,024/min · distorsión media 0,66 (p90 0,76), pendiente 0,018/min.

### 2.2 Cómo crece (o no) la distorsión

Alta y estable (0,66): la textura «Texturex», el bajo «Kandy» y el beat son ásperos todo el tiempo. Baja en el stop de c25 (0,49) y en el groove C sin melodía. **No crece**: es una ráfaga pareja.

## 3. Entradas y salidas de cada pista (EDITOR)

| # | Pista (loop o instrumento) | Tipo | Vol. (dB) | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Rage - Texturex (Musicloop) | audio | 0,0 | c1→c17 · c37→c53 · c53→c69 · c81→c121 |
| 1 | Kandy - Better Intro (Bass) | audio | −5,8 | c1→c53 · c53→c123 (fo 7,65 t) |
| 2 | Cream - Coil (Melodic Loop) 03 | audio | 0,0 | c16→c29 · c37→c38 · c40→c41,1 · c41,125→c42,0315 · c57→c81 · c89→c90 · c92→c93,1 · c93,125→c94,0315 · c97→c123 (fo 4,05 t) |
| 3 | Beat - Dance 2 | audio | 0,0 | c9→c25 · c29→c37 · c45→c73 · c89→c101 (fo 4,39 t) |
| 4 | Selecta - Portmore (Instrumental) | audio | 0,0 | c73→c89 · c101→c117 |
| 5 | SFX - Synth Drop | audio | −0,4 | c72→c76 · c87→c91 · c100→c104 · c115→c119 |
| 6 | Police Siren SIgnals — «Ghostly Whispers Guitar» | audio | −11,1 | c73→c74 · c74,0048→c74,125 · c74,1568→c74,3125 · c74,3125→c75,75 · c75,773→c75,946 · c75,9635→c77,195 · c84,3275→c85 · c101→c102 · c102,005→c102,125 · c102,157→c102,312 · c102,312→c103,75 · c103,773→c103,946 · c103,963→c105,195 · c105,25→c106,25 · c106,255→c106,375 · c106,407→c106,562 · c106,562→c108 · c108,023→c108,196 · c108,213→c109,445 · c109,5→c110,5 · c110,505→c110,793 · c110,793→c110,945 · c110,945→c112,25 · c112,273→c112,561 · c112,561→c113,695 |

fi / fo = fundido de entrada / salida, en tiempos.

### 3.1 Entradas y salidas en orden (para dirección)

| Compás | Tiempo | Entra | Sale |
|---|---|---|---|
| c1 | 0:00,0 | Rage - Texturex (Musicloop) · Kandy - Better Intro (Bass) | — |
| c9 | 0:13,2 | Beat - Dance 2 | — |
| c16 | 0:24,8 | Cream - Coil (Melodic Loop) 03 | — |
| c17 | 0:26,5 | — | Rage - Texturex (Musicloop) |
| c25 | 0:39,7 | — | Beat - Dance 2 |
| c29 | 0:46,3 | Beat - Dance 2 | Cream - Coil (Melodic Loop) 03 |
| c37 | 0:59,6 | Rage - Texturex (Musicloop) · Cream - Coil (Melodic Loop) 03 | Beat - Dance 2 |
| c38 | 1:01,2 | — | Cream - Coil (Melodic Loop) 03 |
| c40 | 1:04,6 | Cream - Coil (Melodic Loop) 03 | — |
| c41,1 | 1:06,4 | — | Cream - Coil (Melodic Loop) 03 |
| c41,125 | 1:06,4 | Cream - Coil (Melodic Loop) 03 | — |
| c42,0315 | 1:07,9 | — | Cream - Coil (Melodic Loop) 03 |
| c45 | 1:12,8 | Beat - Dance 2 | — |
| c57 | 1:32,7 | Cream - Coil (Melodic Loop) 03 | — |
| c69 | 1:52,6 | — | Rage - Texturex (Musicloop) |
| c72 | 1:57,5 | SFX - Synth Drop | — |
| c73 | 1:59,2 | Selecta - Portmore (Instrumental) · Police Siren SIgnals | Beat - Dance 2 |
| c74,125 | 2:01,0 | — | Police Siren SIgnals |
| c74,1568 | 2:01,1 | Police Siren SIgnals | — |
| c75,75 | 2:03,7 | — | Police Siren SIgnals |
| c75,773 | 2:03,8 | Police Siren SIgnals | — |
| c76 | 2:04,1 | — | SFX - Synth Drop |
| c77,195 | 2:06,1 | — | Police Siren SIgnals |
| c81 | 2:12,4 | Rage - Texturex (Musicloop) | Cream - Coil (Melodic Loop) 03 |
| c84,3275 | 2:17,9 | Police Siren SIgnals | — |
| c85 | 2:19,0 | — | Police Siren SIgnals |
| c87 | 2:22,3 | SFX - Synth Drop | — |
| c89 | 2:25,7 | Cream - Coil (Melodic Loop) 03 · Beat - Dance 2 | Selecta - Portmore (Instrumental) |
| c90 | 2:27,3 | — | Cream - Coil (Melodic Loop) 03 |
| c91 | 2:29,0 | — | SFX - Synth Drop |
| c92 | 2:30,6 | Cream - Coil (Melodic Loop) 03 | — |
| c93,1 | 2:32,4 | — | Cream - Coil (Melodic Loop) 03 |
| c93,125 | 2:32,5 | Cream - Coil (Melodic Loop) 03 | — |
| c94,0315 | 2:34,0 | — | Cream - Coil (Melodic Loop) 03 |
| c97 | 2:38,9 | Cream - Coil (Melodic Loop) 03 | — |
| c100 | 2:43,9 | SFX - Synth Drop | — |
| c101 | 2:45,5 | Selecta - Portmore (Instrumental) · Police Siren SIgnals | Beat - Dance 2 (fundido de salida de 4,39 tiempos) |
| c102,125 | 2:47,4 | — | Police Siren SIgnals |
| c102,157 | 2:47,4 | Police Siren SIgnals | — |
| c103,75 | 2:50,1 | — | Police Siren SIgnals |
| c103,773 | 2:50,1 | Police Siren SIgnals | — |
| c104 | 2:50,5 | — | SFX - Synth Drop |
| c105,195 | 2:52,5 | — | Police Siren SIgnals |
| c105,25 | 2:52,6 | Police Siren SIgnals | — |
| c106,375 | 2:54,4 | — | Police Siren SIgnals |
| c106,407 | 2:54,5 | Police Siren SIgnals | — |
| c108 | 2:57,1 | — | Police Siren SIgnals |
| c108,023 | 2:57,1 | Police Siren SIgnals | — |
| c109,445 | 2:59,5 | — | Police Siren SIgnals |
| c109,5 | 2:59,6 | Police Siren SIgnals | — |
| c112,25 | 3:04,1 | — | Police Siren SIgnals |
| c112,273 | 3:04,2 | Police Siren SIgnals | — |
| c113,695 | 3:06,5 | — | Police Siren SIgnals |
| c115 | 3:08,7 | SFX - Synth Drop | — |
| c117 | 3:12,0 | — | Selecta - Portmore (Instrumental) |
| c119 | 3:15,3 | — | SFX - Synth Drop |
| c121 | 3:18,6 | — | Rage - Texturex (Musicloop) |
| c123 | 3:21,9 | — | Kandy - Better Intro (Bass) (fundido de salida de 7,65 tiempos) · Cream - Coil (Melodic Loop) 03 (fundido de salida de 4,05 tiempos) |

## 4. Onsets medidos por banda (SEÑAL)

Archivo del juego: `game/src/data/music/beatmaps/oh_shit.onsets.json` (formato de `drunck.onsets.json`: `[t, fuerza]`; el bajo `[t, dur, midi, fuerza]`).

| Pista | Golpes | Por compás | En la semicorchea (±12 ms) | Primer golpe | Último golpe |
|---|---|---|---|---|---|
| bombo | 462 | 3,79 | 61 % | 0:13,7 | 3:14,1 |
| caja / palmas | 514 | 4,21 | 66 % | 0:00,6 | 3:20,9 |
| hats / ride / fx agudos | 714 | 5,85 | 65 % | 0:01,2 | 3:20,9 |
| bajo / 808 | 573 | 4,70 | 52 % | 0:00,1 | 3:20,3 |
| melodía (ataques) | 341 | 2,80 | 60 % | 0:00,6 | 3:21,7 |
| voz (ataques) | 0 | — | — | — | — |

El beat tiene **swing**: las semicorcheas débiles caen ~0,04 tiempo tarde y la caja va ~17 ms adelantada (histograma de ataques en c9–17 y c45–53). Por eso solo el 61–65 % cae en la semicorchea recta. Para sincronizar, usar los ataques medidos (ya vienen así en el archivo), no la rejilla.

## 5. Golpes, cortes, caídas y silencios

Marcadores del beat map (`markers`), con su compás:

`beat_in` c9 (0:13,2) · `coil_in` c16 (0:24,8) · `texture_out` c17 (0:26,5) · `stop` c25 (0:39,7) · `beat_back` c29 (0:46,3) · `suspense` c37 (0:59,6) · `chop_1` c37 (0:59,6) · `chop_2` c40 (1:04,6) · `chop_3` c41,125 (1:06,4) · `beat_back_2` c45 (1:12,8) · `coil_back` c57 (1:32,7) · `drop_sfx_1` c72 (1:57,5) · `oh_shit_1` c73 (1:59,2) · `siren_1` c73 (1:59,2) · `siren_2` c84,327 (2:17,9) · `drop_sfx_2` c87 (2:22,3) · `beat_back_3` c89 (2:25,7) · `chop_4` c89 (2:25,7) · `chop_5` c92 (2:30,6) · `chop_6` c93,125 (2:32,5) · `drop_sfx_3` c100 (2:43,9) · `oh_shit_2` c101 (2:45,5) · `siren_3` c101 (2:45,5) · `drop_sfx_4` c115 (3:08,7) · `landing` c117 (3:12,0) · `texture_end` c121 (3:18,6) · `end` c123 (3:21,9)

**Las dos caídas «¡OH SHIT!» (c73 y c101) son más bajas, no más fuertes**: el beat «Dance» se va y entra el instrumental «Portmore» con sirenas, ~3 dB por debajo (−11,7 contra −8,7 LUFS). Es un **cambio de mundo**, no un golpe de volumen. El beat vuelve más fuerte que nunca en c89 (−7,5 LUFS). «Synth Drop» (caída de sinte) en c72, c87, c100 y c115: cada uno anuncia un cambio. Stops: c25–29 (sin beat) y c37–45 (suspenso, sin beat). El final se apaga con fundidos (bajo 7,65 tiempos, Coil 4,05), sin cola.

## 6. Voz

Sin voz. El «OH SHIT» no se dice en el audio: hay que escribirlo en pantalla. El stem de voz solo trae fuga de la sirena (1:43) y de la melodía (3:12).

Regiones donde el stem de voz sobresale (SEÑAL, htdemucs; `tipo` por pyin, INFERIDO): 2:23,2–2:24,6 (textura (sin altura clara), −14,4 dB bajo la mezcla) · 3:12,0–3:15,1 (cantada, −12,8 dB bajo la mezcla)

## 7. Notas para la película

- Cada «Synth Drop» (c72, c87, c100, c115) es la **grieta** antes de un universo nuevo: la pantalla 4:3 que se raja (biblia v2 §7).
- c73 y c101: entra otro mundo (otra música, sirenas). Cambiar de estilo visual en el compás exacto; no hace falta subir la intensidad, porque el audio tampoco la sube.
- Las sirenas picadas (c101–113,7) dan golpes irregulares para planos rápidos de universos.
- c117–123: aterrizaje; la textura se va en c121 y todo se apaga solo.

## 8. Límites

- Los onsets salen de stems separados por htdemucs: hay fuga entre stems y el detector no es perfecto. Sirven para colgar imágenes y verificar en el Momento con `?scrub=1`; no son una partitura.
- La distorsión es un índice de textura (ruido, planitud, brillo, cresta), no una medida del efecto en sí: un timbre brillante y limpio también la sube un poco.
- Nadie escuchó: las sensaciones son inferencias desde los datos.
