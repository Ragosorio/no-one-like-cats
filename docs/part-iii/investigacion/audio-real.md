# Audio real: los 5 MP3 exportados por el dueño (Parte III)

> Agente **D · MUSICA-P3**, 2026-10-13. Fuente: `~/Desktop/NO ONE LIKE CATS SONGS/` (**no se tocó**: solo se leyó para
> copiar y comprobar los hash). Se trabajó con copias y derivados fuera del repo. Sin commits.
> Complementa `soundtrap.md` (lo que se vio en el editor) con lo que dice **el archivo**.

## 0. Cómo leer este documento

Cada dato lleva su origen. Nunca se usa uno como prueba del otro.

| Etiqueta | Qué es |
|---|---|
| **SEÑAL** | Medido en el MP3 exportado (decodificado con ffmpeg), con los scripts de §2 |
| **EDITOR** | Lo que se leyó en Soundtrap (`soundtrap.md`): compases, regiones, volúmenes, automatizaciones |
| **ESCUCHA** | **Nadie escuchó nada con oído humano.** Ningún dato de aquí viene de escuchar. Lo que necesita oído está en §11 |

Los compases se cuentan como en el editor: **c1 = inicio** (c24,649 = compás 24 + 0,649 de compás).

---

## 1. Originales y mapeo archivo ↔ proyecto

Copias en `~/Desktop/No one - raster (fuera del repo)/audio-derivados/originales/parte-iii/` con `SHA256SUMS`;
`shasum -c` contra la carpeta del dueño: **los 5 OK**. Todos son MP3 LAME 3.100, 320 kbps CBR, 44,1 kHz, estéreo.

| Archivo | SHA-256 (inicio) | Proyecto (EDITOR) | Cómo se verificó con la SEÑAL |
|---|---|---|---|
| `Drunck (hardstyle).mp3` | `e6ab71c4…` | `J5GouBnx…` «Drunck (hardstyle)», v6 | 165,000 BPM; los golpes sueltos de c2,875 · c3 · c4,75 · c6,875 · c7 · c8,75 caen a +1,1 ms de la rejilla; el bombo se corta en c24,649 y vuelve en c25; termina en c49 |
| `No wey (way%2C hiphop dark).mp3` | `3b8c4c4d…` | `znsBGFR4…` «No wey (way, hiphop dark)», v306 | 74,000 BPM; el bajo entra en c5, el bombo en c9 (+10 ms), los hats vuelven en c25 (0 ms), solo melodía en c45 (0 ms), el 2.º bajo en c49 |
| `Daria (hiphop deep).mp3` | `aa057f64…` | `b5_MXIbc…` «Daria (hiphop deep)», v306 | 134,000 BPM; el 808 vuelve del stop en c25,5 (0 ms); corte seco en c81 (+20 ms) |
| `xti es amor, (jazz).mp3` | `f4058d89…` | `4riizrbW…` «xti es amor, (jazz)», v142 | 140,000 BPM; batería en c17, tutti en c41, caja y hat en c49, break en c57, fill en c65, pad solo en c73, tutti en c81, caja en c89: **los 8 a 0 ms** |
| `SADIE (piano and distorsion).mp3` | `2c44a277…` | `fGRASEj8…` «SADIE (piano and distorsion)», v223 | 50,000 BPM; golpes YM en c8,875 (0 ms), c29 (−2 ms) y c31 (+9 ms); piano limpio en c33 (0 ms); corte en c37 = 172,800 s exactos |

El nombre del archivo coincide con el título del proyecto, y además la estructura medida calza compás por compás con
las regiones del editor. **Límite:** la señal confirma la estructura, no el número de versión: si el dueño cambió algo
que no mueve regiones (un volumen, un efecto) después de la inspección, esto no lo detecta.

---

## 2. Método (SEÑAL)

Scripts en `…/audio-derivados/parte-iii/scripts/`, venv en `…/parte-iii/.venv` (fuera del repo).

- **Decodificación:** ffmpeg 8.1 a WAV float. El MP3 trae cabecera LAME con *encoder delay* 576 + 529 del decodificador
  = **1105 muestras (25,06 ms)** que ffmpeg recorta, igual que los navegadores. Tiempo 0 = primera muestra que entrega
  ffmpeg (la convención de la Parte II, doc 18 §0.3).
- **Rejilla** (`grid_fit.py`): onsets por banda (graves 30–150 Hz, banda completa, medios, agudos 6–14 kHz) con
  resolución de 1,45 ms; **plegado de fase** sobre ±0,6 % del tempo del editor (pasos de 0,001 BPM); con el tempo del
  editor fijo, ataque refinado de cada onset fuerte frente a la semicorchea → mediana, MAD y **deriva** (pendiente).
- **Niveles por compás y por tiempo** (`bars.py`), **eventos al centésimo** (`datos_otras.py`: salto de nivel en
  bloques de 10 ms dentro de ±0,12–0,3 s del compás del editor) y **casillas de fusa** para el bombo (`onsets_p3.py`).
- **Onsets** (`onsets_p3.py`): formato de `docs/part-ii/29` §6.1. **Sin stems** (ver §10): clasificador por bandas
  sobre la rejilla + HPSS por medianas para la melodía.
- **Sonoridad:** ffmpeg `ebur128` (I, LRA, TP); pyloudnorm para el LUFS de los loops; pico verdadero con sobremuestreo 4×.
- **Herramientas y licencias:** numpy (BSD-3), scipy (BSD-3), soundfile (BSD-3; libsndfile LGPL-2.1), pyloudnorm (MIT),
  matplotlib (licencia PSF/BSD) — instalados en un venv nuevo de 223 MB. Ya estaban: ffmpeg 8.1 (LGPL/GPL según
  compilación, Homebrew) con `aac_at` de Apple, **rubberband 4.0** (GPL-2.0-or-later, Homebrew; se usa como programa
  y no se distribuye). **No se instaló torch ni demucs** (disco: quedan ~3 GB).

---

## 3. Desfase (compás 1), tempo y rejilla — las 5

| Canción | 1.ª muestra con sonido | Compás 1 (SEÑAL) | BPM EDITOR | BPM plegado (SEÑAL) | Ataques vs rejilla (banda más nítida) | Deriva |
|---|---|---|---|---|---|---|
| Drunck | muestra 2 | **0,000 s** (golpes sueltos de la intro a +1,1 ms) | 165 | 164,998 (agudos) | agudos: mediana +1,84 ms, MAD **0,22 ms**, 100 % a < 10 ms | −0,005 ms/s |
| No wey | muestra 1 | **0,000 s** | 74 | 74,000 (banda completa) | agudos: −0,38 ms, MAD **0,24 ms** | +0,03 ms/s |
| Daria | muestra 17 | **0,000 s** | 134 | 133,999 | agudos: +1,39 ms, MAD 2,3 ms, 100 % a < 10 ms | +0,008 ms/s |
| xti | muestra 162 (el pad entra suave) | **0,000 s** | 140 | 139,999 | agudos: −2,76 ms, MAD 3,3 ms; 8 entradas de sección a 0 ms | −0,002 ms/s |
| SADIE | muestra 5 | **0,000 s** | 50 | 50,0005 | sin batería: piano de ataque blando (MAD 11 ms); los eventos duros (YM, piano limpio, corte) caen a 0–9 ms | −0,03 ms/s |

- **SEÑAL:** en las cinco, **el compás 1 está en 0,000 s** del audio decodificado y el tempo es **exactamente el del
  editor**, constante, sin deriva medible (la peor: 0,04 ms/s, unos 7 ms en toda la canción). La rejilla del editor
  coincide con los golpes reales; el +1–2 ms es el sesgo del detector de ataque (en la Parte II salió +2,1 / +3,0 / −1,1).
- **El desfase del MP3:** un decodificador que **ignore** la cabecera LAME pondría el compás 1 en **+25,06 ms**. ffmpeg y
  los navegadores la respetan. El `.m4a` del juego lleva su propio cebado AAC (2112 muestras) con lista de edición,
  igual que la Parte II (`sync` en `tracks.json`).
- **Las «duraciones de archivo» de la tabla de referencia** (72,83 · 226,98 · 146,39 · 198,06 · 172,93 s) son
  *frames MP3 × 1152 / 44 100*: incluyen el retardo y el relleno del codificador. Decodificadas sin esos bordes duran
  **72,777 · 226,928 · 146,363 · 198,021 · 172,900 s**.

### 3.1 ¿La diferencia de duración es la cola de reverb?

| Canción | Fin EDITOR | Decodificado | Diferencia | Después del fin del editor (SEÑAL) |
|---|---|---|---|---|
| Drunck | 69,818 | 72,777 | 2,959 s | **Cola de reverb.** Corte seco en c49 (−16 → −37 dB en 0,2 s) y caída exponencial lisa de ~19 dB/s (≈ RT60 3 s), más rápida en agudos; ningún onset de bombo, caja ni agudos. Audible hasta +1,0 s (−50 dBFS) / +1,6 s (−60); bajo −70 dBFS desde +2,2 s |
| No wey | 224,189 | 226,928 | 2,739 s | Cola: hasta +0,6 s (−50) / +1,0 s (−60). **No hay corte seco** en c70,125: la última nota de la melodía cae solo 5 dB en el borde de la región y se apaga sola |
| Daria | 143,284 | 146,363 | 3,079 s | **Corte seco** en c81 (−50 dBFS a los 17 ms) y luego una cola muy baja (−50 → −70 dB en 2,7 s) |
| xti | 195,429 | 198,021 | 2,592 s | El pad se apaga solo (sin corte): +1,5 s (−50) / +1,9 s (−60) |
| SADIE | 172,800 | 172,900 | 0,100 s | **No es reverb.** El piano se corta en seco en 172,800 s (−33 → −96 dB en 10 ms) y siguen 0,1 s de silencio digital. El máster solo tiene limitador |

---

## 4. Drunck (prioridad)

### 4.1 Secciones (SEÑAL compás por compás; niveles RMS en dB de la mezcla)

| Sección (beat map) | Compases | Tiempo (s) | EDITOR | SEÑAL |
|---|---|---|---|---|
| `intro` | c1–9 | 0,000–11,636 | golpes sueltos, build-up, sinte con *sweep* 238 Hz → 8,9 kHz | Entre golpes no hay graves (−62 dB); la banda 800–5000 Hz sube **de 37 a 57 dB** de c2 a c8 y el centroide de ~1,6 a ~4 kHz: el filtro se abre de verdad, de forma continua |
| `drop` | c9–17 | 11,636–23,273 | bombo continuo, sinte, percusión | graves −8,6; **c16: graves −28,8** (respiro) |
| `drop2` | c17–25 | 23,273–34,909 | entran ride y hats; corte en c24,649 | agudos +2 dB desde c17; **graves −58 dB de 34,40 a 34,90 s** |
| `drop3` | c25–33 | 34,909–46,545 | build-up encima de todo | lo más lleno junto con el final; **c32: graves −29,3** |
| `break` | c33–41 | 46,545–58,182 | sin sintes; redoble en c40,75 | la parte armónica 300–4000 Hz baja **4–5 dB** frente a las demás; **c40 (tiempos 1–3): graves −28,7** |
| `climax` | c41–49 | 58,182–69,818 | sinte cerrado a 716 Hz que se abre entre c46,42 y c47,99 | ver §4.2; **c48: graves −29,2** |
| `outro` | c49–fin | 69,818–72,777 | — | cola de reverb (§3.1) |

Sonoridad de la exportación: **−8,4 LUFS**, LRA 6,1 LU, **TP +0,7 dBTP** (picos entre muestras por encima de 0).

### 4.2 Las comprobaciones pedidas

| Qué | EDITOR | SEÑAL | Veredicto |
|---|---|---|---|
| Respiros c16, c32, c48 | el 8.º compás de cada loop de bombo | graves −28,8 / −29,3 / −29,2 dB contra −8,6 del resto (~20 dB menos); en los tiempos 2–4 quedan golpes de medios/agudos sin graves (percusión) | **Confirmado.** Además **c40** es otro respiro (tiempos 1–3), que `soundtrap.md` no nombraba: es el 8.º compás del loop 33→40,75 antes del redoble |
| Corte en c24,649 | región con fundido de salida que termina en 24,649 | los graves caen de −26 a **−58 dB en 34,40 s** y vuelven en **34,90 s** (c25 = 34,909); la banda completa sigue a ~−31 dB (ride, hats, sinte) | **Confirmado** (0,51 s sin bombo) |
| Redoble en c40,75 | «redoble» c40,75–41 | ataques en los tiempos 3,0 · 3,25 · 3,5 · 3,75 · 3,875 del compás (más dobles de ~33 ms, del bombo con reverb), a ≤ 1,1 ms de la rejilla | **Confirmado.** Mismo patrón que c4,75 («3 semicorcheas + 2 fusas») y c8,75 |
| Apertura del filtro hacia c48 | 716 Hz en c46,42 → 22 050 Hz en c47,99 | comparado con los mismos compases de C (c25–32, mismo loop con el sinte abierto): en c41–44 la banda 800–5000 Hz está 2–3 dB abajo y los *stabs* del sinte en contratiempo 12 dB abajo (1,5–3 kHz); la diferencia baja a −4 dB en c45–46,2, **se cierra en c46,3–c47 (66,2–66,9 s)** y desde c47,25 el espectro es **idéntico** al de c31–32 (±0,1 dB) | **Confirmado, pero termina antes:** lo audible de la apertura acaba en **c47 (66,9 s)**, no en c48. Encaja con una rampa lineal en Hz (de 716 Hz a 5 kHz se pasa en el primer quinto). Marcadores `filter_open` (c46,42), `filter_open_full` (c47, SEÑAL) y `filter_ramp_end` (c47,99, EDITOR) |
| Golpes sueltos de la intro | c1 · c2,875 · c3 · c4,75 · c5 · c6,875 · c7 · c8,75 | todos a **+1,07 ms** de la rejilla (c5 y c9 los tapa el redoble anterior, pero el ataque está a ≤ 12 ms) | **Confirmado** |
| Corte seco en c49 | la última región termina en c49 | §3.1: corte + cola de reverb de ~1,6 s audible | **Confirmado** |

**El bombo (SEÑAL; diferencia con la medición previa a los faders):** en los drops hay un **bombo en cada negra**: justo
en el tiempo los graves <120 Hz caen 9–17 dB durante ~12 ms y vuelven con cuerpo (−8 dB), con un clic en 100–4000 Hz
y agudos. El «rumble» es un **pulso de graves en el contratiempo (+½)** de cada tiempo, sin clic. La medición previa
(antes de faders) veía onsets en +¼ y +¾; en la mezcla final no aparecen como golpes de bombo.

**Tonalidad (SEÑAL, débil):** en la parte armónica (300–2500 Hz) la nota más presente es **Si♭**; la correlación con
Si♭ mayor y Si♭ menor empata (0,380 / 0,379). El cuerpo del bombo está afinado cerca de **Re♭2 / Re2 (69–73 Hz)**,
la 3.ª menor de Si♭: **compatible con Si♭ menor** (EDITOR: Bbm; los loops dicen A#m). No es una prueba.

### 4.3 Lo que se entregó al juego

| Archivo | Qué |
|---|---|
| `game/public/music/drunck.m4a` | La original: AAC-LC 160 kbps cvbr (`aac_at`), 44,1 kHz, **solo ganancia −7,6 dB** → **−16,0 LUFS**, TP −7,1 dBTP, 1,5 MB. Decodificada: alineada a **0 muestras** con la fuente; cebado 2112 |
| `game/src/data/music/beatmaps/drunck.json` | Formato de la Parte II: 165 BPM, `offset` 0, 201 tiempos, 51 compases, las 7 secciones de §4.1 con energía, y los marcadores de `04` §3 (lista en `agentes/D-MUSICA.md`). Loop de la Fonoteca **c9 → c41** (32 compases, 11,639592–58,185034): la vuelta repite la transición redoble → bajada que la canción ya hace en c8,75 → c9 |
| `game/src/data/music/beatmaps/drunck.onsets.json` | `kick` 157 (cada negra de los drops, los 6 golpes sueltos y los 3 redobles: el patrón del EDITOR, cada golpe confirmado en la SEÑAL a ≤ 15 ms), `bass` 155 (pulsos del rumble), `snare` 29 (acentos sin graves: respiros, intro), `perc` 208 (agudos), `melody` 534 (HPSS, aproximada), `vox` vacío. Rejilla de fusa; nada después de c49 |
| `game/src/data/music/tracks.json` | Entrada `drunck` (antes de `amb`), con `sync`, `lufs`, `hint` «Alguien pide la última ronda.» y las 3 variaciones |
| `tests/originalsReserved.test.ts` | `drunck` entra en la lista de originales reservadas: batallas, director y código fuera de `src/momentos` no pueden pedirla |

**Costura del loop de la original** (AAC decodificado): corrimiento +3,2 ms; salto 0,072 contra 0,079 natural; > 8 kHz
−32,4 contra −32,0 dBFS natural (es el ataque del bombo de c9 / c41, el mismo loop de audio). Sin clic medible.

### 4.4 Variaciones (solo material de la propia canción; sin stems)

Mismo proceso que la Parte II (`docs/part-ii/23` §1.1): todo se procesa sobre `[loop loop loop]` y se queda la copia
del medio; forma `[1 compás de entrada][loop][2 de salida]` en las camas; AAC 160k y **todo medido sobre lo
decodificado**. Solo ganancia estática (sin limitador). **No se agregó ningún timbre.**

| Id | Título | Qué es | Dur. | Loop (s) / compases | LUFS loop | TP | Costura (salto / natural · > 8 kHz unión / natural) | Maestro periódico |
|---|---|---|---|---|---|---|---|---|
| `drunck.barra` | Desde la calle | c9–c24 (Drop A + B, con el respiro de c16 y el corte de c24,649) con paso bajo 4.º orden a 280 Hz: solo el rumble, como la fiesta oída desde la calle | 27,6 s | 1,455306–24,728027 / 16 a 165 | −18,0 | −9,7 | 0,0022 / 0,0020 · −108 / −110 dBFS (no hay agudos) | −91,5 dB |
| `drunck.resaca` | Bajo la almohada | La parte **armónica** (HPSS) de c9–c24 —el sinte sin clics de bombo ni hats—, paso alto 4.º orden 160 Hz (fuera el cuerpo del bombo), paso bajo 4.º orden 700 Hz + 900 Hz suave, **estirada ×2 con rubberband R3** (misma altura, 82,5 BPM), sala oscura (IR generada en numpy, 30 %) y nivelado lento en el respiro de c16 (allí el compresor del máster suelta y el sinte sube ~6 dB) | 55,3 s | 2,906122–49,451565 / 16 a 82,5 | −18,0 | −2,0 | 0,0084 / 0,0138 · −82,5 / −60,2 | −91,6 dB |
| `drunck.battle` | Última ronda | Remix por compases de la mezcla con el vocabulario de la Parte II: intro c5–c6 (los hipos) · `verse` c33–c40 (solo batería, respiro y redoble) · `drop` Drop A c9–c15 · `break` respiro c16 + el sinte de la intro c7–c8 (golpe y redoble) · `climax` C c25–c32 · `outro` c47–c48 + el corte seco con su cola. La vuelta del loop (c32 → c33) es la de la canción | 46,0 s | 2,907256–40,725442 / 26 a 165 | −16,5 | −7,9 | 0,069 / 0,070 · −36,8 / −36,4 (ataque del bombo) | exacto (−240 dB) |

- Las tres pasan la prueba con el cebado AAC **sin recortar** (+48 ms): mismos números (en la batalla hay 60 ms de
  audio idéntico a cada lado de los puntos de loop).
- `drunck.battle` trae `hits` (93; 18 fuertes en el loop = 0,48 por segundo, como los remixes de la Parte II: 0,5–0,6),
  `drop` en el drop y en el clímax, `phrase` cada 4 compases y `build` antes de cada uno. Pasa la prueba de vocabulario
  de `originalsReserved`.
- Imágenes (onda + espectrograma, revisadas) en `…/parte-iii/img/`; informes en `…/parte-iii/informes/`; maestros FLAC
  24 bit en `…/parte-iii/variaciones/`.
- En `docs/part-ii/escuchar.html` la sección **Drunck · Parte III** quedó arriba y marcada **NUEVA**
  (`node game/scripts/escuchar.mjs` + `scripts/escuchar_p3.py`).

---

## 5. SADIE (piano and distorsion)

Exportación: **−20,1 LUFS** (muy baja), LRA 6,1, TP −3,4 dBTP. Sin batería.

| Sección | Compases | Tiempo (s) | EDITOR | SEÑAL |
|---|---|---|---|---|
| intro | c1–5 | 0,0–19,2 | piano + arpegio del lead | casi nada sobre 4 kHz (−95 dB) |
| verse | c5–17 | 19,2–76,8 | entran las cuerdas (c5), suben en c9; YM en c8,875 y c13; el lead se apaga c13–17 | **el nivel total no sube** (−24,1 → −23,6 dB): las cuerdas solo agregan **2–8 kHz: +18 dB (c5), +26 dB (c9)** |
| climax | c17–25 | 76,8–115,2 | cuerdas al máximo, YM picado, el lead vuelve en c21 | 2–8 kHz **+31 a +34 dB**; el lead vuelve en c21 (medios +9 dB a 96,01 s) |
| break | c25–29 | 115,2–134,4 | piano y cuerdas que se apagan | agudos −6 dB (las cuerdas bajan un escalón), sin lead |
| bridge | c29–33 | 134,4–153,6 | piano «Dub» con distorsión, delay y filtro | ver abajo |
| outro | c33–37 | 153,6–172,8 | piano limpio solo | igual a c1–4 menos el lead (−2 dB en 250–1000 Hz); corte seco en 172,800 |

- **Los escalones de las cuerdas** calzan con los volúmenes del editor: −6,1 → +1,5 → +6,0 dB (pasos de 7,6 y 4,5 dB);
  medidos en 2–8 kHz: **7,7 y 4,8 dB**.
- **La distorsión de c29 (SEÑAL):** los graves < 125 Hz caen **24 a 41 dB** (el filtro de la pista Dub), 1–8 kHz suben
  **4 a 13 dB** (armónicos de la distorsión) y el nivel total baja 4,5 dB: un piano **más delgado, más brillante y más
  bajo**. Empieza en 134,39 s (c29) y el piano con graves vuelve en 153,60 s exactos (c33). Cómo suena: ESCUCHA.
- **Golpes «Error» (YM):** c8,875 **sí** (ataque de agudos a 37,799 s: +12,8 dB, 5 veces más que en el mismo punto de
  los otros ciclos del piano) · c29 **sí** (134,398 s, +18,7 dB) · c31 **sí** (144,009 s, +13,5 dB) · **c13 no se puede
  separar**: cae justo en el inicio del loop de piano y bajo las cuerdas; no aparece ningún ataque propio (la pista
  YM va a −18,4 dB). No se puede decir que falte; solo que la señal no lo muestra.
- **Pulso:** el piano ataca cada 2 tiempos (2,4 s) en los compases despejados (EDITOR/medición previa); para los inputs
  de un Momento sirven los ataques del piano de c1–4 y c33–36 y los tres YM confirmados.
- **Para el Momento:** a −16 LUFS necesitaría +4 dB y el pico pasaría de −1 dBTP; como YONOSE en la Parte II, quedará
  ~1,5 LU más baja o habrá que decidir otra cosa. Se decide al codificarla.

---

## 6. No wey (way, hiphop dark)

Exportación: −13,4 LUFS, **LRA 9,6** (la más dinámica), TP +0,4 dBTP.

| Sección | Compases | Tiempo (s) | SEÑAL (total / graves / agudos, dB) | Frontera |
|---|---|---|---|---|
| intro | c1–9 | 0,0–25,9 | −21,7 / −29,6 / −27,8; **el bajo entra en c5** (13,01 s, +24 dB en graves) | — |
| verse | c9–17 | 25,9–51,9 | −11,4 / −12,2 / −29,6 | bombo a 25,956 s (+10 ms) |
| break | c17–29 | 51,9–90,8 | −18,3 / −21,0 / −53,4 | **tres escalones medidos:** c17–20 bajo y melodía (−21) · c21–24 + Bumble Bee (graves +4,7) · **c25–28 vuelven los hats** (agudos +38 dB, 0 ms) |
| verse2 | c29–45 | 90,8–142,7 | −11,4 / −12,4 / −29,2 | c33: el bombo tarde; **c41–44 medios +2 dB** (melodías solapadas) |
| break2 | c45–53 | 142,7–168,6 | −22,2 / −28,4 / −65,5 | **c45–48 solo melodía** (graves −35); el 2.º bajo entra en c49 (155,74 s) |
| verse3 | c53–61 | 168,6–194,6 | −11,1 / −11,9 / −38,8 | bombo a 168,659 s |
| outro | c61–70,125 | 194,6–224,2 | −23,7 / −30,0 / −68,7 | el bajo se va en c65 (207,57 s); Bumble Bee hasta c69 |

- **El bombo tarde de c33 (EDITOR: región desde c33,349 = 104,916 s):** el primer bombo **audible** está en
  **105,026 s = c33 + 1,5 tiempos** (la semicorchea siguiente: la región empieza a mitad del loop y el primer golpe del
  patrón cae después). El hueco audible es de 1,5 tiempos, no 1,4.
- **El final:** no hay corte seco en c70,125; la última nota se apaga hasta ~224,8 s (−50 dBFS).

## 7. Daria (hiphop deep)

Exportación: **−8,4 LUFS, LRA 0,8 LU** (muy comprimida), TP +0,7 dBTP.

| Sección | Compases | Tiempo (s) | SEÑAL: agudos (dB; el total no cambia: −9,4 a −10,7 en todos los compases) |
|---|---|---|---|
| intro (A) | c1–17 | 0,0–28,7 | −36 (c1–3 algo más brillantes: −29 a −33) |
| verse (B) | c17–33 | 28,7–57,3 | −32 (+4,8): entra la caja |
| chorus (C) | c33–49 | 57,3–86,0 | **−25** (+6,2): hats trap; el primer hat a 57,42 s (la 2.ª semicorchea) |
| verse2 (A') | c49–65 | 86,0–114,6 | −35 (−10,5); de nuevo más brillante en c49–51 y la caja vuelve en c57 |
| chorus2 (C') | c65–81 | 114,6–143,3 | −25 (+6,8); corte seco en c81 (143,30 s) |

- **Stop de c25:** el 808 vuelve en **43,881 s** (c25,5, 0 ms; +44 dB en graves). El inicio del stop lo tapa el
  bombo del tiempo 1, que sigue sonando: los graves caen después de ese golpe (43,12 s).
- **Hueco de batería de c41:** los hats vuelven en **72,30 s ≈ c41 + 1,5 tiempos** (la región empieza en c41,313 =
  +1,25; el primer golpe audible cae en la semicorchea siguiente).
- Lo que separa las secciones es **solo la banda alta** (hats, caja, *shimmer*): en volumen todo está igual de fuerte.
  Para un Momento, los cambios visuales tienen que colgarse de hats, caja y voz, no del volumen.

## 8. xti es amor, (jazz)

Exportación: −12,5 LUFS, LRA 4,5, TP +0,2 dBTP.

| Sección | Compases | Tiempo (s) | SEÑAL (total / graves / agudos, dB) |
|---|---|---|---|
| intro | c1–17 | 0,0–27,4 | −18,5 / −39,8 / −68: pad solo hasta c8; el songstarter entra en c9 (13,79 s) |
| verse | c17–33 | 27,4–54,9 | −14,4 / −18,1 / −36,8: el fill de bembé (c17–24), el bembé desde c25 (graves −5 dB) |
| break | c33–41 | 54,9–68,6 | −20,5 / −26,4 / −50,9: solo el songstarter |
| chorus | c41–57 | 68,6–96,0 | −14,8 / −19,1 / −36,1; caja y hat desde c49 (agudos −34) |
| break2 | c57–81 | 96,0–137,1 | −16,8 / −31,4 / −57,3: c57–64 pad + songstarter (idéntico a c9–16), fill c65–72, **pad solo c73–80** (agudos −85) |
| chorus2 | c81–105 | 137,1–178,3 | −14,7 / −18,7 / −35,6; caja desde c89 |
| outro | c105–115 | 178,3–195,4 | −18,6 / −31,2 / −58,2: songstarter solo c105–106, + pad c107–112, pad solo c113–114; el pad se apaga solo |

Todas las entradas de sección caen a **0–10 ms** del compás del editor.

---

## 9. Qué dicen las medidas para elegir escena (datos, no decisión)

| Canción | Lo medido que importa para una escena |
|---|---|
| No wey | La más dinámica (LRA 9,6): contrastes reales de volumen. Cortes limpios para cambios de plano: c9, c17, c21, c25, c29, c45 (solo melodía, −22 dB), c49, c53, c61. El tropiezo del bombo en c33 + 1,5 tiempos |
| Daria | Pared de volumen (LRA 0,8): la energía no sube ni baja, solo cambia el brillo. Dos silencios de batería claros y cortos: c25–25,5 y c41–41 + 1,5 tiempos. Corte seco en c81 |
| xti | Intro muy quieta (pad solo, sin graves) y estructura tutti/break nítida; dos zonas de pad solo (c1–8 y c73–80) para escenas quietas; final que se apaga solo |
| SADIE | Sin batería; casi todo el cambio está en los agudos (cuerdas) y en el piano roto de c29–33. Tres golpes «Error» medibles (c8,875, c29, c31). Corte en seco al final, sin cola |

---

## 10. Diferencias con Soundtrap (resumen)

1. **Duraciones:** la diferencia es cola de reverb en Drunck, No wey, Daria y xti; en **SADIE no**: es 0,1 s de silencio
   después de un corte seco (§3.1).
2. **Drunck:** hay un **4.º respiro en c40** (tiempos 1–3); la apertura del filtro **se completa en c47**, no en c48;
   el bombo va en cada negra con el rumble en +½ (no en +¼ / +¾).
3. **SADIE:** las cuerdas **no suben el volumen total** (la medición previa a los faders decía +15 dB): solo agregan
   agudos, en escalones que calzan con los volúmenes del editor. El YM de **c13 no se puede separar** en la señal.
4. **No wey c33** y **Daria c41:** los golpes vuelven en **+1,5 tiempos**, no en +1,4 / +1,25 (el inicio de región no
   es el primer golpe).
5. **No wey:** el final se apaga solo; no hay corte en c70,125.
6. **Picos:** cuatro exportaciones pasan de 0 dBTP (Drunck +0,7, Daria +0,7, No wey +0,4, xti +0,2). En el juego no
   importa: se codifican con ganancia negativa.
7. Todo lo demás (tempo, compás 1, entradas y salidas de sección) **coincide** con el editor.

## 11. Lo que no se pudo medir

- **Stems:** no se separó nada (sin torch/demucs por disco). Por eso `melody` es la parte armónica del HPSS
  (aproximada: incluye el armónico del bombo y lo que suene sostenido), `vox` va vacío y la voz de Daria (loop de
  biblioteca) no está aislada. En Daria el 808 tapa al bombo: su pista `kick` está incompleta (67 golpes).
- La frecuencia exacta del filtro de Drunck: solo se ven niveles relativos por banda.
- El YM de SADIE en c13.
- La tonalidad: solo una indicación en Drunck (§4.2); en las otras 4 no se midió.
- Si los MP3 son exactamente las versiones 6 / 306 / 306 / 142 / 223: la señal confirma la estructura, no la versión.
- **Cómo suena cualquier cosa (ESCUCHA): nadie la escuchó.**

## 12. Lo que el dueño tiene que escuchar (en `docs/part-ii/escuchar.html`, arriba)

1. **`drunck.resaca` «Bajo la almohada»:** el HPSS y el estirado ×2 pueden dejar el sinte borroso o «aguado». Lo que
   hay que decidir: ¿se oye a sinte lento o a papilla?
2. **`drunck.battle` «Última ronda»:** los cortes entre compases que la canción no hace (c16 → c7 y c8 → c25); ¿se
   siente distinta de la original o demasiado parecida?
3. **`drunck.barra` «Desde la calle»:** solo el rumble bajo 280 Hz: ¿aguanta en loop en el mapa o cansa?
4. **`drunck.m4a`:** que sea su exportación tal cual (solo −7,6 dB).
5. En Drunck: si c16, c32, c40 y c48 se sienten como respiros, y si la apertura del filtro termina en c47 o en c48.
6. SADIE: si el «Error» de c13 se oye; cómo suena el piano distorsionado de c29.
7. No wey: si el bombo tarde de c33 se siente como un tropiezo.

## 13. Archivos

| Qué | Dónde |
|---|---|
| Originales + `SHA256SUMS` | `…/audio-derivados/originales/parte-iii/` |
| Datos de las 5 (rejilla, niveles por compás, onsets) | `…/audio-derivados/parte-iii/datos/<id>.{grid,bars,onsets}.json` |
| Beat maps de las otras 4 (**solo datos**, formato Parte II) y tablas EDITOR vs SEÑAL | `…/parte-iii/datos/{no_wey,daria,xti,sadie}.json` · `….secciones.json` |
| Drunck: informe de codificación | `…/parte-iii/datos/drunck.game.json` |
| Variaciones: maestros, imágenes, informes | `…/parte-iii/{variaciones,img,informes}/` |
| Scripts | `…/parte-iii/scripts/`: `p3lib.py`, `grid_fit.py`, `bars.py`, `hpss.py`, `onsets_p3.py`, `enc.py`, `drunck_game.py`, `variaciones.py`, `catalog_add.py`, `datos_otras.py`, `escuchar_p3.py` |
| WAV decodificados | `…/parte-iii/wav/` (solo quedan los de Drunck; los otros se borraron por disco: se regeneran con ffmpeg desde los originales) |
