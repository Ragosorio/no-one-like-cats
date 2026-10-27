# Proyectos de Soundtrap del dueño: inspección de solo lectura

> Agente MUSICA, etapa de diseño de la Parte III, 2026-10-13. Revisé los cinco enlaces en el Chrome del dueño (Claude in
> Chrome), con su sesión iniciada y **sin modificar nada**. Al terminar comprobé que la versión y la fecha de última
> edición de cada proyecto eran las mismas que al abrirlo (tabla del §0.3).

## 0. Cómo se obtuvo cada dato

### 0.1 Tres niveles, separados en cada proyecto

- **Observado en el editor**: lo que el propio estudio carga y muestra. Para no depender de leer píxeles, leí **el mismo
  JSON que carga el editor** con un GET de solo lectura a la URL que el estudio ya había pedido
  (`api/projectsnapshots/<id>/data/latest` y `api/project/getProject1`). Las notas MIDI salen de los blobs `.not` que
  el editor también descarga (`user-assets/blob2/<id>/<server_id>.not`, formato `tiempo,altura,velocidad,duración`).
  Además leí los encabezados de pista del DOM (nombre, volumen y pan) y miré capturas de pantalla para confirmar que el
  JSON coincide con lo que se ve. Cada región trae `start_beat` y `length` en tiempos, así que los compases son
  **exactos** (compás = start_beat / 4 + 1): no son estimaciones a partir de píxeles.
- **Medido en la señal**: solo en «Drunck» y «SADIE» (método y límites en el §0.2).
- **Inferido**: mi lectura musical (nombres de secciones, intención, acordes). Va marcado y puede estar mal.

Tipos de pista según el JSON: `t` = pista de audio (loops), `k` = instrumento de software (regiones de notas),
`d` = kit de batería tocado con notas (no es audio). El **pan 0,5 es el centro** y no hay ningún pan distinto en los
cinco proyectos. Ninguno tiene `parts` (las secciones con nombre que ofrece el botón «+ Section»), marcadores ni grupos
de pistas. **El tempo es constante en los cinco**: el JSON tiene un solo `bpm` y no hay mapa de tempo. Ningún proyecto
tiene pistas ni regiones silenciadas, y ninguno tiene pistas en solo.

### 0.2 Método de la medición de señal (lo que hice y sus límites)

- Antes de reproducir parcheé `AudioBufferSourceNode.prototype.start` en la página. Cada fuente que el motor inicia se
  conecta **además** a un bus mío que termina en una ganancia 0 hacia la salida, así que lo que se oye no cambia. En ese
  bus, tres `ScriptProcessor` de 1024 muestras (21,3 ms a 48 kHz) registran el RMS y el pico de la banda completa, de
  los graves (<150 Hz, paso bajo de 24 dB/oct) y de los agudos (>4 kHz).
- Reproduje con «Ir al inicio» y el botón de reproducir del transporte. La canción sonó completa una vez y la detuve
  después del final. No usé atajos de teclado.
- **Alineación**: t0 es el `start()` programado más temprano, que corresponde al compás 1. Está verificada: en Drunck,
  los bombos sueltos de la intro aparecen en la señal justo donde dicen sus regiones (c2 en el tiempo 3,5; c4 en el 3;
  c6 en el 3,5; c8 en el 3). En SADIE, la 2.ª nota del lead cae a 0,6 s (medio tiempo a 50 bpm).
- **Límites**: mido las fuentes **antes** del fader y de los efectos. Por eso no aparecen el volumen de cada pista, los
  fundidos de región, la distorsión de SADIE, la automatización de filtros de Drunck ni la reverb del máster (la cola
  después del final no se midió). Los dB solo sirven para comparar dentro de la misma canción: la suma sin fader puede
  pasar de 0 dBFS (SADIE dio un pico de +9). El detector marca un onset cuando la energía sube más de 6 dB respecto al
  mínimo de los 3 cuadros anteriores (umbral de −45 dB en banda completa y −40 dB en graves). La resolución es de
  ~21 ms: sirve para estructura y patrón, **no** para sincronizar un Momento.
- En «No wey», «Daria» y «xti es amor» no hubo medición de señal: no son las canciones pedidas y cada reproducción
  completa cuesta varios minutos.

### 0.3 Los proyectos no cambiaron

| Proyecto | Versión / sequenceNo al abrir | Última edición (UTC) al abrir | Al terminar |
|---|---|---|---|
| Drunck (hardstyle) | 6 / 6 | 2026-10-13 14:13:15 | 6, la misma fecha (después de reproducirlo entero) |
| No wey (way, hiphop dark) | 306 / 306 | 2026-10-13 14:16:15 | 306, la misma |
| Daria (hiphop deep) | 306 / 306 | 2026-10-13 14:14:00 | 306, la misma |
| xti es amor, (jazz) | 142 / 142 | 2026-10-13 14:08:46 | 142, la misma |
| SADIE (piano and distorsion) | 223 / 223 | 2026-10-13 14:21:38 | 223, la misma (después de reproducirlo entero) |

Las cinco fechas de última edición son anteriores a mi primera visita (~14:47 UTC). Reproducir solo movió el cabezal
de reproducción, y eso no crea versión nueva.

---

## Resumen

| Enlace | Título real (Soundtrap) | BPM | Compás | Tono | Duración | Pistas | Secciones por compás (inferidas de las regiones) |
|---|---|---|---|---|---|---|---|
| [J5Gou…](https://www.soundtrap.com/studio/J5GouBnxTdOJG07JMfwyPA/) | **Drunck (hardstyle)** | 165 | 4/4 | Bbm | 48 compases (c1→c49) = **1:09,8** | 11 | intro 1–9 · drop A 9–17 · B 17–25 (corte del bombo en c24,65) · C (build + drop) 25–33 · sin sintes 33–41 (redoble 40,75) · final 41–49, corte seco |
| [znsBG…](https://www.soundtrap.com/studio/znsBGFR4ROiFqNhco6Ax6g/) | No wey (way, hiphop dark) | 74 | 4/4 | F#m | 69 compases + 2 tiempos (c1→c70,125) = **3:44,2** | 9 | intro 1–9 · beat 9–17 · break 17–29 · beat 29–45 · break 45–53 · beat 53–61 · cierre 61–70 |
| [b5_MX…](https://www.soundtrap.com/studio/b5_MXIbcTkaXy4jKU82AnQ/) | Daria (hiphop deep) | 134 | 4/4 | Cm | 80 compases (c1→c81) = **2:23,3** | 6 | A 1–17 · B 17–33 (stop de 2 tiempos en c25) · C 33–49 (hueco de batería en c41) · A' 49–65 · C' 65–81, corte seco |
| [4riiz…](https://www.soundtrap.com/studio/4riizrbWSWW-vrEfs3O8aw/) | xti es amor, (jazz) | 140 | 4/4 | F# | 114 compases (c1→c115) = **3:15,4** | 7 | intro 1–17 · entra la batería 17–33 · break 33–41 · tutti 41–57 · break 57–81 · tutti 81–105 · cierre 105–115 |
| [fGRAS…](https://www.soundtrap.com/studio/fGRASEj8SdSwqi2aZkxTvg) | **SADIE (piano and distorsion)** | 50 | 4/4 | Dm | 36 compases (c1→c37) = **2:52,8** | 8 | intro 1–5 · cuerdas 5–17 · clímax 17–25 · calma 25–29 · piano distorsionado 29–33 · outro de piano 33–37 |

**Correspondencias confirmadas por el título que muestra Soundtrap:**
- «Drunck (hardstyle)» = enlace 1 (`J5GouBnxTdOJG07JMfwyPA`). El título coincide letra por letra. Ojo: los loops que usa
  son del paquete «**Druck** - Aggressive», sin n; el título del proyecto sí lleva n.
- «SADIE» = enlace 5 (`fGRASEj8SdSwqi2aZkxTvg`), cuyo título completo es «SADIE (piano and distorsion)».
- Los otros tres son «No wey (way, hiphop dark)», «Daria (hiphop deep)» y «xti es amor, (jazz)». **Ninguno es una de
  las seis canciones de la Parte II** (CIRCUS MALUS, Hemkade, LIKY FIGHT, WHEN I LOSE, YONOSE TODO, te ODIO). No sé
  qué otros dos nombres mencionó el dueño, así que no puedo decir cuáles de estos tres son «las otras dos». «Daria» y
  «SADIE» se parecen, pero son proyectos distintos: no los asumo como el mismo.

---

## 1. Drunck (hardstyle): enlace 1

### Observado en el editor

- **Título**: «Drunck (hardstyle)». Creado el 2026-09-11. 165 bpm, Bbm, 4/4, sin anacrusa.
- **Duración**: la última región termina en el tiempo 192 = **compás 49**. Son 48 compases: 69,82 s (**1:09,8**).
  1 compás = 1,4545 s; 1 tiempo = 0,3636 s.
- **Máster**: roomfx, compressortwo, clipfx, dynamicscompressor ×2, visualequalizerfx; masterización «standard /
  classic».
- **Pistas**: 11, todas de audio (loops del paquete «Druck - Aggressive / Raw», 165 bpm, A#m), todas con pan al centro.

| # | Pista (como la muestra la UI) | Vol. | Efectos | Regiones (compás de inicio → fin) |
|---|---|---|---|---|
| 0 | Druck - Aggressive (Kick Rumble) | −2,1 dB | basicamp | Golpes sueltos: c1 (1 tiempo) · c2,875 · c3 · c4,75–5 (redoble: 3 semicorcheas + 2 fusas) · c5 · c6,875 · c7 · c8,75–9 (redoble) · c40,75–41 (redoble) |
| 1 | Druck - Aggressive (Kick Rumble) | −5,8 dB | basicamp, reverbpro, room, EQ, filter | **Copia exacta** de la #0 (mismas regiones), con reverb |
| 2 | Druck - Aggressive (Kick Rumble) | −2,0 dB | basicamp, EQ | 9→17 · 17→21 · 21→**24,649** (fundido de salida) · 25→33 · 33→**40,75** · 41→49 |
| 3 | Druck - Aggressive (Build Up) | 0,0 dB | basicamp, room | 1→9 · 25→33 · 41→49 |
| 4 | Druck - Aggressive (Synth) | −7,0 dB | basicamp, **sweep**, filter, moddelay | 1→9. **Automatización** de la frecuencia del sweep: 238 Hz (c2) → 564 Hz (c3,25) → 3507 Hz (c5,79) → 3934 Hz (c7,75) → 8946 Hz (c8,98) |
| 5 | Druck - Aggressive (FX) | −8,9 dB | basicamp, room | Fx loop: 1→9 · 33→41 · 41→49 |
| 6 | Druck - Aggressive (Synth) | −8,4 dB | basicamp, **sweep**, filter, EQ | 9→17 · 17→25 · 25→33 · 41→49. **Automatización** del sweep: 22050 Hz (c39) → **716 Hz (c41)** → 716 Hz (c46,42) → 22050 Hz (c47,99) |
| 7 | Druck - Aggressive (Ride) | −8,0 dB | basicamp | 17→25 · 25→33 · 33→41 · 41→49 |
| 8 | Druck - Aggressive (Hi Hat) | −9,0 dB | basicamp | 17→25 · 25→33 · 33→41 · 41→49 |
| 9 | Druck - Aggressive (Percussion) [165] (sin nombre en el JSON) | −8,8 dB | basicamp, reverbpro | 9→17 · 33→41 |
| 10 | Druck - Raw (Percussion) | **+6,0 dB** | basicamp, stereodelay, room | 15→17 (fundido de entrada de 6,25 tiempos: subida hacia c17) |

Cada loop dura 8 compases (11,636 s). Todo es audio: no hay piano roll ni Beatmaker que abrir. Lo que se ve en la
captura coincide con estas regiones.

### Medido en la señal

Fuentes antes del fader y de los efectos (§0.2). Una reproducción completa.

- **Fin**: la señal cae por debajo de −60 dB en el tiempo 192,1, el final exacto del c49. No hay silencios de más de
  ¼ de tiempo dentro de la canción.
- **RMS por compás (dB relativos)**: casi plano, entre −3 y −6 en casi todos los compases (son loops muy comprimidos).
  En la intro, el c2 (−8) y el c6 (−7) bajan porque tienen menos golpes de bombo. Las caídas claras están en el
  **c16 (−9), c24 (−7), c32 (−7) y c48 (−7)**. En graves (<150 Hz) son más marcadas:
  **c16 −19, c32 −20, c48 −20**, contra −4/−5 en el resto. Esas caídas están en el **8.º compás de cada loop de bombo**
  (9→17, 25→33, 41→49): el propio loop trae un compás final sin bombo, o con muchos menos golpes. El c24 cae porque la
  región se corta en 24,649. Hay un hueco de graves medido entre los tiempos 95,2 y 95,6, que va del c24,8 al c25: es
  el corte que se ve en el editor.
- **Patrón del bombo**: en banda completa, los onsets de los c25–48 caen sobre el tiempo (51 veces), en la
  semicorchea siguiente (+¼, 39 veces) y en la última semicorchea del tiempo (+¾, 16 veces). Casi nunca caen en la
  corchea (+½, 2). En graves aparecen 8 pulsos por compás, en +¼ y
  +½ de cada tiempo (c10–23, c33–47). Cuadra con el «rumble» del hardstyle: bombo en negras más una cola de bajo
  pulsada entre golpes. El método no separa el golpe en el tiempo de su cola.
- **Intro**: los golpes medidos en graves coinciden con las regiones sueltas: c1 en el tiempo 0; c2 en 3,5; c4 en 3;
  c6 en 3,5; c8 en 3. El golpe del c3 (tiempo 0) no aparece como onset propio porque sigue sin pausa al del c2,875;
  el detector solo marca subidas en c3 a +¼ y +½.

### Inferido

- **Intro (c1–9, 0:00–0:11,6)**: build-up más un sinte filtrado que se abre poco a poco (238 Hz → 9 kHz) y golpes de
  bombo sueltos con redobles en los c4 y c8. Es un «anuncio» de 8 compases.
- **Drop A (c9–17, 0:11,6–0:23,3)**: entra el bombo continuo (rumble) con el sinte principal y la percusión. En los
  c15–17, la Raw Percussion sube de volumen hacia la siguiente parte. El c16 casi no tiene bombo: es un respiro
  de 1 compás antes del c17.
- **B (c17–25, 0:23,3–0:34,9)**: se van la percusión y la Raw Percussion; entran ride y hi-hat. **En c24,649 (0:34,40)
  se corta el bombo** y quedan 1,4 tiempos (0,51 s) sin él antes del c25: un mini-stop.
- **C (c25–33, 0:34,9–0:46,5)**: vuelve el build-up **encima** de toda la batería y del sinte. Es la parte más llena y
  vuelve a respirar en el c32.
- **Sin sintes (c33–41, 0:46,5–0:58,2)**: se van los dos sintes; quedan bombo, ride, hats, percusión y el fx loop. El
  bombo para en c40,75 (0:57,8) y entra un **redoble** de bombo (semicorcheas y fusas) hasta el c41.
- **Final (c41–49, 0:58,2–1:09,8)**: todo junto (build-up, fx, ride, hats y bombo). El sinte vuelve **cerrado a 716 Hz**
  y se abre de golpe entre c46,4 y c48 (1:06,1–1:08,3). El c48 vuelve a respirar sin bombo, y en el c49 **termina en
  seco**, sin outro. La cola real dependerá de la reverb del máster.
- Para un Momento, los golpes más claros son: el bombo del c9 (0:11,64), el corte en c24,649 con su regreso en c25
  (0:34,40 → 0:34,91), el redoble de c40,75 (0:57,82), la entrada del c41 (0:58,18) y la apertura del filtro hacia c48
  (1:08,34).

---

## 2. No wey (way, hiphop dark): enlace 2

### Observado en el editor

- **Título**: «No wey (way, hiphop dark)». Creado el 2026-08-23. 74 bpm, F#m, 4/4.
- **Duración**: termina en el tiempo 276,5 = **c70,125** (la última región, de melodía, dura 4,5 tiempos).
  Son **3:44,2**. 1 compás = 3,243 s.
- **Máster**: filter, clip, dynamicscompressor ×2, EQ y w1limiter; masterización «live / none».
- **Pistas**: 9, todas con pan al centro (los nombres del JSON están vacíos; la UI muestra el nombre del loop o del
  kit).

| # | Pista (UI) | Tipo | Vol. | Regiones |
|---|---|---|---|---|
| 0 | Memphis - Battery (Kick & Clap) | audio | 0,0 | 9→17 · 29→33 · **33,349**→37 · 37→45 · 53→61 |
| 1 | Corazón | kit de batería (notas) | −2,5 | «Corazón - Beat 1 (Tops)», patrón B: 5→13 · 29→37 · 37→45 |
| 2 | Corazón | kit de batería (notas) | −2,5 | patrón A: 1→5 · 13→17 · 25→29 |
| 3 | Winston - Boop (Synth Melody) [F#m] | audio | 0,0 | 1→9 · 9→17 · 29→37 · 37→45 |
| 4 | Winston - Boop (Synth Melody) [F#m] | audio | 0,0 | 17→21 · 21→29 · 41→49 · 49→57 · 57→65 · 65→69 · 69→70,125 |
| 5 | Memphis - Battery (Bass) [F#m] | audio | −9,6 | 5→13 · 13→21 · 21→29 · 29→37 · 37→45 |
| 6 | Memphis - Battery (Bass) [F#m] | audio | −7,8 | 49→57 · 57→65 |
| 7 | Car - Bumble Bee [A] | audio | 0,0 | 21→29 |
| 8 | Car - Bumble Bee [A] | audio | −10,6 | 37→45 · 53→61 · 61→69 |

- **Batería Corazón (notas leídas)**: los patrones duran 4 compases (16 tiempos) y se repiten dentro de cada región.
  - Patrón A (pista 2): 43 notas, todas en **Bb2**, en los tiempos 0, ½, ¾, 1, 1½, 2, 2¼, 2½, 2¾, 3, 3½… (corcheas
    con semicorcheas intercaladas). No tiene bombo.
  - Patrón B (pista 1): el mismo Bb2, más golpes simultáneos de **E1 + A1** en ¾, 1½, 2¾, 3½ de cada compás, con
    redobles de fusas (7,81–8,0; 13,25–15,94). No sé qué sonido del kit es cada nota: el keymap del kit solo numera las
    muestras.
- El **bombo es audio** (loop «Kick & Clap»), así que su patrón exacto no se puede leer en el editor.

### Medido en la señal

Sin medición de señal (§0.2).

### Inferido

- **Intro (c1–9, 0:00–0:25,9)**: melodía y hats; el bajo entra en el c5 (0:13,0). No hay bombo.
- **Beat 1 (c9–17, 0:25,9–0:51,9)**: entra el kick & clap.
- **Break (c17–29, 0:51,9–1:30,8)**: sin bombo. Quedan la otra copia de la melodía, el bajo y, desde el c21, Bumble
  Bee. Los hats vuelven en c25–29 como subida.
- **Beat 2 (c29–45, 1:30,8–2:22,7)**: vuelve el bombo. El bombo de c33 entra **1,4 tiempos tarde** (c33,349 = 1:44,92):
  un mini-hueco al empezar el c33. Entre c41 y c45 se solapan las dos copias de la melodía.
- **Break 2 (c45–53, 2:22,7–2:48,6)**: c45–49 solo melodía (sin bajo ni batería); desde c49 entra el otro bajo.
- **Beat 3 (c53–61, 2:48,6–3:14,6)**: bombo, bajo, melodía y Bumble Bee.
- **Cierre (c61–70,125, 3:14,6–3:44,2)**: sin bombo. El bajo se va en c65 y termina con la melodía sola, que corta a
  mitad del c70.

---

## 3. Daria (hiphop deep): enlace 3

### Observado en el editor

- **Título**: «Daria (hiphop deep)». Creado el 2026-06-24. 134 bpm, Cm, 4/4.
- **Duración**: termina en el tiempo 320 = **c81**. Son 80 compases: **2:23,3**. 1 compás = 1,791 s.
- **Máster**: room, compressortwo, clip, dynamicscompressor ×2, EQ; masterización «standard / classic».
- **Pistas**: 6, todas de audio, pan al centro, solo basicamp.

| # | Pista (UI) | Vol. | Regiones |
|---|---|---|---|
| 0 | Brampton - Vinyl Piano 7R [Cm] | −1,6 | 1→9 · 9→17 · 17→25 · **25,5**→33 · 33→41 · 41→49 · 49→57 · 57→65 · 65→73 · 73→81 |
| 1 | G.O.A.T - Bugged Out (Kick) / Flux - Bee (Kick & Snare) | 0,0 | G.O.A.T: 1→9 · 9→17 · 49→57; Flux: 17→25 · 25→33 · 33→41 · **41,313**→49 · 57→65 · 65→73 · 73→81 |
| 2 | Brick - Be Doomed 808 [Cm] | −9,6 | igual que el piano (incluido el **25,5**→33) |
| 3 | Lush Vox - Cold (Lead & BVs) 01 | −5,9 | 1→17 [Cm] · 17→21 [Am] · 21→25 [Am] · 25→33 [Cm] · 49→57 [Cm] · 57→61 [Am] · 61→65 [Am] |
| 4 | Synth - Shimmer 1 [Cm] | −4,3 | 9→17 · 17→25 · **25,5**→33 · 33→41 · 41→49 · 49→57 · 57→65 · 65→73 · 73→81 |
| 5 | Million - Trap Hat LR 01 | 0,0 | 33→41 · **41,313**→45 · 45→49 · 65→73 · 73→81 |

La voz es un loop de voz de la biblioteca de Soundtrap, no una grabación propia. Se usa en dos versiones de tono:
[Cm] y transpuesta a [Am].

### Medido en la señal

Sin medición de señal (§0.2).

### Inferido

- **A (c1–17, 0:00–0:28,7)**: piano, bombo G.O.A.T (solo bombo), 808 y voz; el shimmer entra en el c9 (0:14,3).
- **B (c17–33, 0:28,7–0:57,3)**: el bombo pasa al loop con caja (Flux) y la voz baja a [Am] en c17–25. **Stop de 2
  tiempos al empezar el c25** (0:43,0 → 0:43,9): se callan piano, 808 y shimmer, y siguen bombo y voz.
- **C (c33–49, 0:57,3–1:26,0)**: sin voz; entran los hats trap. **Hueco de batería de 1¼ tiempos al empezar el c41**
  (1:11,6 → 1:12,2).
- **A' (c49–65, 1:26,0–1:54,6)**: vuelven el bombo solo y la voz; desde c57, caja y voz en [Am]. Sin hats.
- **C' (c65–81, 1:54,6–2:23,3)**: hats y caja, sin voz. **Termina en seco** en el c81.

---

## 4. xti es amor, (jazz): enlace 4

### Observado en el editor

- **Título**: «xti es amor, (jazz)». Creado el 2026-06-15. 140 bpm, F#, 4/4.
- **Duración**: termina en el tiempo 456 = **c115**. Son 114 compases: **3:15,4**. 1 compás = 1,714 s.
- **Máster**: room, compressortwo, clip, dynamicscompressor ×2, EQ; masterización «standard / classic».
- **Pistas**: 7, pan al centro.

| # | Pista (UI) | Tipo | Vol. | Regiones |
|---|---|---|---|---|
| 0 | Cushy Pad | instrumento (Cushy Pad) | −6,4 | «Lucid - Synth Pad 02 [F#]» (notas): 1→9, 9→17, 17→25, 25→33, 41→49, 49→57, 57→65, 65→73, 73→81, 81→89, 89→97, 97→105, **107**→115. Efectos: chorus, vibrato, autopan, room, EQ, basicamp |
| 1 | Neighborhood - Menace (Songstarter) [Ebm] | audio | −5,0 | 9→25 · 25→41 · 41→57 · 57→73 · 81→96,991 · 96,991→112,991 (16 compases cada una) |
| 2 | String Section | instrumento | 0,0 | **sin regiones** (pista vacía) |
| 3 | Drums - Bembe Fill | audio | 0,0 | 17→25 · 65→73 |
| 4 | Drums - Bembe | audio | −5,7 | 21→25 (fundido de entrada de 4 compases) · 25→33 · 41→49 · 49→57 · 81→89 · 89→97 · 97→105 |
| 5 | Bass - Dirty 27 [Ebm] | audio | −13,5 | 41→49 · 49→57 · 81→89 · 89→97 · 97→105 |
| 6 | Drums - Rock Basic Snare and Open HH | audio | −6,4 | 49→57 · 89→97 · 97→105 |

- **Notas del pad**: el patrón tiene 8 compases y es idéntico en las 13 regiones: B–D#–F#–A# (2 compases) →
  F#–A#–C#–F (2) → B–D#–F#–A# (2) → F#–A#–C#–F (1) → G#–B–D#–F# (½) → A#–C#–F–G# (½).

### Medido en la señal

Sin medición de señal (§0.2).

### Inferido

- La progresión del pad es **Bmaj7 – F#maj7 – Bmaj7 – F#maj7 – G#m7 – A#m7**, en bucle de 8 compases. El songstarter y
  el bajo están etiquetados en Ebm (= D#m, relativo de F#).
- **Intro (c1–17)**: pad solo; el songstarter entra en el c9 (0:13,7). **Entra la batería (c17–33)**: fill de bembé,
  bembé con fundido de entrada en c21–25 y bembé completo en c25. **Break (c33–41, 0:54,9–1:08,6)**: solo el
  songstarter; se van el pad y la batería. **Tutti (c41–57)**: pad, songstarter, bembé y bajo; caja y open hat entran
  en c49. **Break largo (c57–81, 1:36,0–2:17,1)**: sin batería salvo el fill de c65–73; en c73–81 queda el pad solo.
  **Tutti (c81–105)**: caja y hat desde c89. **Cierre (c105–115, 2:58,3–3:15,4)**: songstarter solo (c105–107), luego
  pad con songstarter y, al final, pad solo hasta c115.

---

## 5. SADIE (piano and distorsion): enlace 5

### Observado en el editor

- **Título**: «SADIE (piano and distorsion)». Creado el 2026-10-13 (hoy, 02:36 UTC). Versión 223. **50 bpm**, Dm, 4/4.
- **Duración**: termina en el tiempo 144 = **c37**. Son 36 compases: **2:52,8**. 1 compás = 4,8 s; 1 tiempo = 1,2 s.
- **Máster**: solo w1limiter (techo −0,16 dB); masterización «live / none».
- **Pistas**: 8, pan al centro. **No hay batería en ninguna pista.**

| # | Pista (UI) | Tipo | Vol. | Efectos | Regiones |
|---|---|---|---|---|---|
| 0 | Atlantis - Ocean Piano Chords 01 [F] | audio | 0,0 | basicamp | 1→**29** (un loop de 4 compases, 19,2 s, repetido 7 veces) · 33→37 |
| 1 | Dub | audio | 0,0 | volume2, filter, EQ, dynamicscompressor, **juicydist**, moddelay | el **mismo** loop de piano: 29→33 |
| 2 | Pad Dualipa 3 Björn | instrumento | −1,4 | stereodelay, basicamp | «Lucid - Sad Synth Lead 03 [Dm]» (notas): 1→9 (fundido de entrada de 7,75 tiempos) · 9→17 (fundido de salida de 16,24 tiempos, es decir, se apaga a lo largo de c13–17) · 21→25 |
| 3 | String Section | instrumento | −6,1 | basicamp | «Super 8 - Proud Strings 01 [Dm]»: 5→9 (fundido de salida corto) |
| 4 | String Section | instrumento | +1,5 | basicamp | la misma frase: 9→17 · 25→29 (fundido de salida corto) |
| 5 | String Section | instrumento | **+6,0** | basicamp | la misma frase: 17→25 |
| 6 | Ice Acoustic Guitar | audio | −15,0 | volume2, filter, EQ, dynamicscompressor, room | «YM - Error 5019 FL LD3 [Dm]» picado en 6 trozos: 17→17,745 · 17,756→19,753 · 19,754→20,994 · 20,994→21,738 · 21,75→23,747 · 23,748→24,994 |
| 7 | Ice Acoustic Guitar | audio | −18,4 | volume2, filter, EQ, dynamicscompressor, room | el mismo loop en golpes cortos (2 tiempos, con fundido de salida): **c8,875 · c13 · c29 · c31** |

- **Notas del lead** (pista 2): un patrón de 2 compases que en realidad es **1 compás repetido**. Son corcheas que
  bajan en pares: F4 A3 · E4 G3 · D4 F3 · B♭3 D3. Es repetitivo: no cambia en toda la canción.
- **Notas de las cuerdas** (pistas 3–5, la misma frase de 4 compases): D1 G1 F2 B♭2 → A1 A2 → C1 G2 → G1 E2 →
  B♭0 F1 D2 F2 B♭2 → A2 → C1 G1 E2 F2 G2 → C2 (un cambio cada medio compás). Entre una pista y otra solo cambia el
  volumen: −6,1, +1,5 y +6,0 dB, así que la frase **crece** en tres escalones.
- La pista «Dub» usa el mismo audio de piano con la distorsión **juicydist**. Por eso el título dice «piano and
  distorsion»: la distorsión es un efecto, no otra grabación.
- Al abrirlo, la UI muestra el botón «+ Section», pero no hay secciones creadas.

### Medido en la señal

Fuentes antes del fader y de los efectos (§0.2): no se ve la distorsión ni los volúmenes de pista.

- **Fin**: la señal termina en el tiempo 144,0, el final exacto del c37.
- **RMS por compás**: c1–4 entre −20 y −24 dB (piano y lead); **c5 sube a −6** al entrar las cuerdas. Los c5–28 se
  mantienen entre −3 y −6; los agudos (>4 kHz) pasan de −58 a −28 dB desde el c5. En el **c29 baja a −9** y los c30–36
  se quedan entre −17 y −26 (el c31 es el más alto, −17, por un golpe de YM). Después del final (tiempo 144), la señal
  cae a −57 y luego a silencio.
- **Ataques del piano**: en los compases despejados, los onsets de banda completa caen **cada 2 tiempos (2,4 s)**: en
  los tiempos 0, 2, 4, 6, 12 y 16 de la intro, y en 116, 118, 120, 124 … 142 del outro. El loop de piano cambia de
  acorde cada medio compás. Entre c5 y c28, las cuerdas tapan esos ataques en la detección.

### Inferido

- **Intro (c1–5, 0:00–0:19,2)**: piano y arpegio del lead, que entra con fundido.
- **Cuerdas (c5–17, 0:19,2–1:16,8)**: entran las cuerdas (c5) y suben un escalón en c9. Hay golpes glitch (YM) en
  c8,875 (0:37,8) y c13 (0:57,6). El lead se apaga en c13–17.
- **Clímax (c17–25, 1:16,8–1:55,2)**: cuerdas en su volumen más alto (+6 dB) y la línea YM picada (efecto de «error»);
  el lead vuelve en c21 (1:36,0). Es la parte más densa.
- **Calma (c25–29, 1:55,2–2:14,4)**: piano y cuerdas, que se apagan.
- **Piano distorsionado (c29–33, 2:14,4–2:33,6)**: el piano pasa a la pista «Dub», con distorsión, delay y filtro. Hay
  golpes YM en c29 (2:14,4) y c31 (2:24,0). No hay cuerdas ni lead.
- **Outro (c33–37, 2:33,6–2:52,8)**: vuelve el piano limpio, solo, y la canción termina en el c37.
- A 50 bpm, el pulso que se siente puede ser la corchea del lead (0,6 s, como 100 bpm a medio tiempo). Para un Momento,
  la grilla sigue siendo la de 50 bpm.
- La progresión de las cuerdas podría leerse como Gm/D → A → C → (Em o C6) → B♭ → A → C(sus) → C. Es mi lectura; hay
  que confirmarla con oído o con la exportación.

---

## Bloqueos y pasos para el dueño

- **No hubo bloqueos**: los cinco enlaces abrieron con la sesión del dueño, sin pedir inicio de sesión ni permisos.
- **Pestaña suelta**: quedó **una «Nueva pestaña» vacía** en Chrome, fuera del grupo de Claude, y la herramienta no me
  deja cerrarla. Se puede cerrar a mano.
- **Lo que necesito del dueño**:
  1. Decir qué **otros dos nombres** de canción mencionó, para saber cuáles de «No wey», «Daria» y «xti es amor» son.
     Si el quinto enlace sobra, decir cuál.
  2. Si alguna de estas canciones va a un Momento, **exportar la mezcla** desde Soundtrap (Archivo / Exportar → WAV o
     MP3). Yo no puedo exportar ni descargar. Si su plan lo permite, exportar también las pistas por separado (stems).

## Lo que falta verificar para sincronizar un Momento

1. **La mezcla exportada** (paso 2 de arriba) para generar `<id>.onsets.json` con `onsets.py` y el beat map, como en la
   Parte II (doc `docs/part-ii/29-momentos-musicales.md` §6.1). Mi medición tiene resolución de ~21 ms, va antes de los
   efectos y no sirve para eso.
2. **La cola de reverb del máster** (Drunck: room + reverb en el bombo; Daria y xti: room). Las regiones terminan en
   c49, c81 y c115, pero el «último aliento» real se mide en el archivo exportado.
3. **El bombo de Drunck**: confirmar en la exportación (o en stems/demucs) si el golpe va en cada negra y la cola
   rumble en +¼ y +½, y qué tiene exactamente el compás 8 de cada loop (c16, c32, c48).
4. **SADIE sin batería**: los cues no pueden ir sobre bombos. Habrá que usar los ataques del piano (cada 2,4 s), el
   arpegio del lead (cada 0,6 s), la entrada de las cuerdas (c5, c9, c17), los golpes YM (c8,875, c13, c29, c31) y el
   cambio a piano distorsionado (c29 = 2:14,4).
5. **Cómo suena la distorsión** de SADIE en c29–33, y si el «Dub» cambia el tono o el ritmo percibido. Solo se puede
   saber con la exportación, porque mi medición fue antes de los efectos.
6. **El tono real** de los loops que no coinciden con el tono del proyecto: piano [F] en un proyecto en Dm (relativo,
   compatible); Bumble Bee [A] en No wey (F#m, relativo); songstarter y bajo [Ebm] en xti (F#, relativo). Por las
   etiquetas parece intencional; falta confirmarlo de oído.
7. Si el dueño **edita** cualquiera de estos proyectos después de hoy, los compases de este documento dejan de valer.
   Para comprobarlo, la versión y la fecha de última edición del §0.3 tienen que seguir iguales.
