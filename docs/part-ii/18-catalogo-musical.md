# 18 · Catálogo musical y dirección musical de la Parte II (INTERNO — contiene spoilers)

> Agente MUSIC, 2026-10-09. Todo lo de este documento se **midió** sobre las 6 canciones originales del dueño. Las canciones originales no se tocaron: viven en `~/Desktop/NO ONE LIKE CATS sounds/`. No hay `git commit`.

## Para el dueño (sin sorpresas de historia)

- Se analizaron las **6 canciones** de verdad: tempo, compás, tonalidad, volumen, estructura, golpes fuertes y silencios. Cada una tiene un **mapa de pulsos** para que el juego se mueva a su ritmo.
- Todas están grabadas sobre una **grilla de tempo exacta** que empieza en el segundo 0, con error de ±3 ms. Eso permite sincronizar animaciones y batallas sin adivinar.
- Para el juego quedaron en **AAC (.m4a), 160 kbps**: suenan igual en Chrome, Firefox y Safari. Las 6 pesan **24 MB** en total. Están al mismo volumen percibido (−16 LUFS) y **sin compresión extra**, solo un ajuste de nivel.
- Cada canción quedó **separada en 4 pistas** (batería, bajo, voz y resto) fuera del repo. Con eso se pueden hacer versiones tranquilas sin tocar los originales.
- Cada canción tiene un **bucle sin costura** verificado para exploración o batalla. LIKY FIGHT, además, trae **382 golpes marcados** para coreografiar una pelea.
- Hay una propuesta de qué canción va con cada parte de la historia, qué versiones nuevas conviene hacer y qué música nueva falta.

| Canción | BPM | Tonalidad | Volumen original | Secciones |
|---|---|---|---|---|
| CIRCUS MALUS | 100 | Mi (ambigua) | −8,0 LUFS | 7 |
| Hemkade | 160 | Fa menor | −6,6 LUFS | 14 |
| LIKY FIGHT | 131 | Sol menor armónico | −9,9 LUFS | 17 |
| WHEN I LOSE | 140 (se siente a 70) | Mi menor | −11,6 LUFS | 13 |
| YONOSE TODO | 90 | Si♭ menor | −14,3 LUFS | 9 |
| te ODIO | 120 | Sol frigio (≈ Do menor) | −7,9 LUFS | 11 |

---

## 0. Contrato de datos (estable; para el agente AUDIO)

### 0.1 `game/src/data/music/tracks.json`

Es un arreglo de pistas. Los campos marcados *(extra)* son agregados al contrato del plan (17) y nunca se quitan. El lector actual (`src/audio/catalog.ts`) ignora los extras que no usa.

```ts
type Track = {
  id: 'circus_malus' | 'hemkade' | 'liky_fight' | 'when_i_lose' | 'yonose_todo' | 'te_odio';
  title: string;            // para mostrar: "LIKY FIGHT", "te ODIO"…
  file: string;             // relativo a import.meta.env.BASE_URL: "music/<id>.m4a"
  durationSec: number;      // duración del timeline canónico (ver 0.3)
  bpm: number;              // tempo de la grilla (exacto, entero)
  key: string;              // en español: "Fa menor", "Si♭ menor"…
  beatmap: string;          // (extra) "beatmaps/<id>.json" (relativo a src/data/music/)
  variations: { id: string; file: string; kind: string; title?: string; loop?: {start:number;end:number}|null; layers?: string[] }[];
  loop: { start: number; end: number } | null;   // segundos, sobre compás, sin clic verificado (§4, §2.3)
  cover: { palette: string[]; motif: string };    // paleta [fondo, principal, acento, detalle, extra] + motivo (cover.ts lo reconoce)
  moods: string[];
  hint?: string;            // pista sin spoilers para la Fonoteca mientras está bloqueada
  lufs?: number;            // (extra) LUFS integrados del archivo de distribución
  feelBpm?: number;         // (extra) solo si el pulso sentido difiere de la grilla (WHEN I LOSE: 70)
  sync?: { sampleRate: number; sourceSamples: number; encoderDelaySamples: number }; // (extra) ver 0.3
};
```

- **Solo se listan variaciones cuyo archivo existe.** Hoy cada pista trae únicamente `'<id>.original'`. El agente de variaciones agrega `'<id>.ambient'`, `'<id>.explore'`… cuando el archivo esté en `public/music/`. Así el catálogo nunca apunta a un 404.
- `layers` *(extra, opcional)*: archivos que suenan **en sincronía** con `file`, alineados a la muestra. Se usan en `yonose_todo.aftermath` (la isla que se repara capa por capa, §7).

### 0.2 `game/src/data/music/beatmaps/<id>.json`

```ts
type BeatMap = {
  id: string; duration: number; bpm: number;
  offset: number;           // primer tiempo fuerte (downbeat) = 0.0 en las 6 (ver §1.2)
  beatsPerBar: 4;
  beats: number[];          // s, cada tiempo (3 decimales)
  downbeats: number[];      // s, cada inicio de compás
  sections: { name: string; start: number; end: number; energy: number }[]; // cubren 0..duration sin huecos
  markers: { name: string; time: number }[];
  loop: { start: number; end: number } | null;     // igual que tracks.json
  voice?: { start: number; end: number }[];         // (extra) dónde hay voz (para no tapar diálogo y para el ducking)
  hits?: { time: number; strength: number; kind: string }[]; // (extra) solo LIKY FIGHT
};
```

- **Nombres de sección:** `intro`, `verse`, `prechorus`, `chorus`, `build`, `drop`, `break`, `bridge`, `climax`, `outro`. Si se repiten llevan número (`drop2`). El motor emite `section:<name>`.
- **Marcadores comunes:** `first_drop`, `climax`, `big_hit_1..6` (los 6 acentos más fuertes medidos), `silence_n`/`silence_n_end` (cortes de más de 0,18 s fuera del outro), `end` (último sonido por encima de −50 dBFS), `loop_start`/`loop_end`. Cada canción agrega los suyos (§4).
- **`energy`** va de 0 a 1 y se calcula sin criterio a ojo: 45 % sonoridad a corto plazo frente a la sonoridad integrada de la canción, 30 % presencia de batería y 25 % cuántos stems suenan.
- **`hits` (LIKY FIGHT):** `kind` ∈ `kick | snare | stab` (acentos rítmicos, hasta 3 por compás y cuantizados a semicorchea) y `phrase | drop | build | stop | reentry | shout` (eventos estructurales con `strength` 0,8–1).
  - `cleanBeatMap` hoy no lee `hits` ni `voice`. Para emitir eventos `hit` hay que extenderlo; la batalla también puede leer el JSON directo.

### 0.3 Sincronía (importante para la batalla coreografiada)

- **Tiempo 0 = primera muestra que entrega ffmpeg al decodificar el MP3 original** (ya recortado el retardo de LAME). Beat maps, stems, loops y archivos de distribución comparten ese origen.
  - Verificado por correlación: el `.m4a` decodificado con la lista de edición está alineado a **0 muestras** del WAV fuente.
- **Cebado AAC:** el `.m4a` lleva **2112 muestras** de cebado (medido decodificando con `-ignore_editlist 1`) y una lista de edición que las recorta.
  - Regla para el motor: si `decoded.length` (a 44,1 kHz) es **≥ `sourceSamples + 2112`**, el navegador no recortó el cebado y hay que sumar `2112/44100 = 47,9 ms` a todos los tiempos.
  - Si el `AudioContext` corre a 48 kHz, escalar por `ctx.sampleRate/44100`.
  - Con la lista respetada, el largo es `sourceSamples + ~1087` (el relleno final), y eso no dispara la regla.
- **Los loops ya son exactos en compases**: la diferencia `end − start` es un número entero de compases. El inicio y el fin se corrieron **la misma cantidad** (≤ 5,4 ms) para caer en el punto de menor discontinuidad. Se pueden usar tal cual en `AudioBufferSourceNode.loopStart/loopEnd`.
- El service worker no cacheaba `music/` cuando se escribió esto. Si se quiere jugar offline, conviene una caché aparte, cache-first.

---

## 1. Método y confiabilidad

Las herramientas fueron ffmpeg 8.1 (decodificación, `ebur128`, codificación `aac_at`) y Python con librosa 1.0, numpy y scipy. Los stems salieron de demucs `htdemucs` corriendo en CPU (M4). Los scripts quedaron en `…/audio-derivados/scripts/`.

### 1.1 Tempo

- El tempo se midió de tres formas:
  1. `beat_track` de librosa;
  2. picos del tempograma (autocorrelación de *onsets*);
  3. **plegado de fase**: la envolvente de *onsets* del stem de batería, con resolución de 1,45 ms, se pliega sobre cada periodo candidato (pasos de 0,0005 BPM) y se elige el pico más alto.
- Para comprobar la grilla, se mide la desviación de cada pulso al *onset* más cercano y la deriva en ventanas de 15 s.
- El `beat_track` de librosa se equivoca por cuantización del tempograma: da 99,4 / 161,5 / 129,2 / 143,6 / 117,5 / 117,5. El plegado da tempos **exactos y enteros**:

| Canción | Plegado (BPM) | Desv. mediana | Pulsos a <20 ms | Deriva | Candidatos descartados y por qué |
|---|---|---|---|---|---|
| circus_malus | 100,0000 | 2,2 ms | 100 % | −0,011 ms/s | 198,8 / 66,3 (doble y 2/3 en el tempograma) |
| hemkade | 159,9995 → **160** | 0,9 ms | 100 % | −0,002 ms/s | 80,75 (medio tiempo; el bombo cae en cada negra a 160) |
| liky_fight | 130,9990 → **131** | 1,8 ms | 100 % | +0,003 ms/s | 43,8 / 52,7 / 86,1 (subarmónicos) |
| when_i_lose | 140,0000 | 2,2 ms | 100 % | +0,001 ms/s | 93,33 (plegado 18,6 frente a 26,9: relación 2/3 del tresillo del dembow). **Pulso sentido 70** (§4.4) |
| yonose_todo | 89,999 → **90** | 2,9 ms | 100 % | −0,010 ms/s | 120 (13,8) y 180 (16,5) frente a 90 (18,8). 120 = 4/3·90 es un artefacto del dembow 3+3+2 |
| te_odio | 120,002 → **120** | 2,9 ms | 100 % | +0,013 ms/s | 60 (pliega 24,6 frente a 22,2: medio tiempo del trap). Se usa la grilla de 120 porque los hats van en corcheas de 120 |

- **Origen de la grilla.** El plegado ubica la fase en ~10 ms, pero eso es el retraso del flujo espectral. Midiendo directo el **ataque del bombo** (subida al 30 % de la envolvente de Hilbert del stem de batería), los golpes caen en `k·60/BPM` con mediana de +2,1 ms (hemkade), +3,0 ms (liky) y −1,1 ms (circus).
  - Conclusión: **las 6 canciones empiezan exactamente en el tiempo 1 del compás 1** (offset 0).
- **Compás:** 4/4 en las 6. Los patrones de 16 pasos son coherentes y las frases duran 4, 8 o 16 compases.

### 1.2 Tiempo fuerte (downbeat)

Hay tres evidencias independientes por canción:

1. los patrones de batería de 16 pasos (bombo y caja por bandas del stem de batería);
2. el cambio armónico (croma del stem de bajo) en cada fase de 4;
3. el índice de tiempo donde caen las **subidas de energía de más de 3 dB** (entradas de sección).

| Canción | Evidencia del tiempo 1 |
|---|---|
| circus_malus | Bombo más fuerte en el 1 (z = 1,05). Caja en 2 y 4 (*backbeat* de hip-hop). El final arranca en el compás 48 exacto |
| hemkade | 4 de las 16 subidas caen en el 1, en los compases 16/48/88/120 (24, 72, 132 y 180 s). Las otras 12 caen en el 4: el bombo regresa en el 4 durante los *builds* (anacrusa) |
| liky_fight | **16 de 16** subidas caen en el 1. El cambio de croma es máximo en el 1 (z = 1,01) |
| when_i_lose | 9 de 15 subidas en el 1. Las otras 6 caen en el 4, como anacrusa cada 4 compases (6,43 / 13,29 / 20,14 / 27,0 s) |
| yonose_todo | Cambio de acorde del bajo en el 1: 0,337 frente a ≤ 0,12 en los demás tiempos (un acorde por compás) |
| te_odio | Cambio de croma del bajo en el 1 (z = 0,71). Ciclo armónico de 1 acorde por compás. Los «stops» empiezan en el 3 y la base regresa en el 2 del compás siguiente |

### 1.3 Tonalidad

- Se calculó croma CQT de 36 bins/octava sobre los stems `other` y `bass` y se correlacionó con los perfiles de Krumhansl-Schmuckler y de Albrecht-Shanahan.
- Además se armó un **histograma de raíces del bajo** y la **progresión compás a compás**.
- **Afinación:** A = 440 Hz en las 6. El desvío circular de los picos CQT va de −8 a +2 cents. Lo nuevo que se componga debe ir en 440.

### 1.4 Sonoridad

- `ebur128` de ffmpeg da el integrado (I), el LRA y el pico verdadero (TP).
- La curva de intensidad es la sonoridad a corto plazo (S, ventana de 3 s, cada 0,1 s) y está en las imágenes.

### 1.5 Estructura

- Se armó una autosimilitud por compás (croma + MFCC + nivel de cada stem) y se buscó novedad con un kernel de tablero de 2 y 4 compases. También se marcaron los cambios de actividad de los stems.
- Los candidatos se revisaron **mirando las imágenes**: `…/audio-derivados/analisis/<id>.png` tiene onda, espectrograma mel, 4 stems, LUFS-S con novedad y la franja de secciones con marcadores.
- Las etiquetas (verse/chorus…) son interpretación **apoyada en los datos**: quién suena, cuánto y qué se repite.

### 1.6 Voz

- Nivel del stem `vocals` en ventanas de 50 ms, con umbral de −38 dBFS para voz sostenida y −45 dBFS para gritos o *chops* cortos.
- **No se escuchó nada** (no es posible). Donde el texto dice «parece piano», es una inferencia por espectro y ataque, y así se marca.

---

## 2. Distribución

### 2.1 Formato elegido: AAC-LC en `.m4a`, 160 kbps (cvbr), 44,1 kHz estéreo, encoder Apple `aac_at`

**Por qué:**

- **AAC en MP4** funciona en `decodeAudioData` y en `<audio>` de Chrome, Firefox y Safari de escritorio, y también en iOS y Android.
- **Opus** es más eficiente, pero en Safari tiene un historial irregular con `decodeAudioData`:
  - WebM/Opus funcionaba en `<audio>` desde Safari 15, pero `decodeAudioData` lo rechazaba;
  - `canPlayType` respondía que sí aunque fallara;
  - el soporte de Ogg/Opus en 18.4 tiene reportes contradictorios.
  - Construct 3 llegó a enviar un decodificador WASM solo para Safari.
- Como la batalla sincronizada depende de `decodeAudioData`, un solo formato universal sale más barato y más seguro que Opus + respaldo.

**Tamaño y calidad:**

- 160 kbps con el codificador de Apple es transparente para este material, que es denso y muy comprimido.
- Las 6 pesan **24,1 MB** en total (el límite pedido era ≲ 30 MB).
- El catálogo ya acepta `files: []` para codificaciones alternativas, por si un día se agrega Opus.

### 2.2 Normalización

- Solo se aplica **ganancia estática**: no hay limitador ni compresión, así que la dinámica del dueño queda intacta.
- Objetivo: **−16 LUFS integrados** y TP ≤ −1 dBTP. Se midió sobre el archivo ya codificado.

| Archivo | Ganancia | I final | LRA | TP final | Tamaño |
|---|---|---|---|---|---|
| circus_malus.m4a | −8,0 dB | −16,0 | 1,1 | −6,8 | 2,53 MB |
| hemkade.m4a | −9,4 dB | −16,1 | 2,1 | −6,1 | 4,54 MB |
| liky_fight.m4a | −6,1 dB | −16,1 | 4,3 | −4,8 | 4,89 MB |
| when_i_lose.m4a | −4,4 dB | −16,0 | 6,4 | −2,6 | 4,62 MB |
| yonose_todo.m4a | −2,4 dB | **−16,8** | 9,5 | −1,5 | 4,24 MB |
| te_odio.m4a | −8,1 dB | −16,1 | 2,6 | −6,7 | 4,39 MB |

**YONOSE TODO** es la más dinámica (LRA 9,6) y la que menos margen tiene.

- Con −1,7 dB (−16,1 LUFS), el AAC subía picos intermuestra hasta −0,5 dBTP, y con −2,2 dB hasta +0,2 dBTP en el canal derecho a los 181 s.
- Un limitador ligero no lo arreglaba sin bajar el integrado.
- Se eligió **−2,4 dB → −16,8 LUFS / −1,5 dBTP**: queda 0,8 LU más baja, sin tocar su dinámica. El motor puede compensar con `lufs` (el catálogo calcula el *trim* desde ese campo).

### 2.3 Loops verificados sobre el archivo de distribución

Para cada loop se hizo esto:

1. se decodificó el `.m4a` con ffmpeg;
2. se buscó un corrimiento común de hasta ±4 ms (±8 ms en YONOSE) que minimice la diferencia entre el audio al que se salta y el que naturalmente seguía;
3. **se renderizó la costura con ffmpeg** (`atrim`+`concat`: 2 s antes del fin y 2 s desde el inicio). Los renders están en `…/audio-derivados/loops/<id>_<tag>_seam.wav`;
4. se midió:
   - el salto de muestra en la unión frente al salto natural en ese punto y frente al percentil 99,9 de los saltos de la canción;
   - el RMS de 10 ms después de la unión frente al RMS natural;
   - la energía de más de 8 kHz en 5 ms alrededor de la unión (la firma de un clic) frente a la del audio original en ese punto.

| Loop | Inicio–fin (s) | Compases | Salto | Salto natural | RMS después / natural | HF frente a natural |
|---|---|---|---|---|---|---|
| liky_fight (principal) | 43,965556–161,217483 | 24→88 (64) | 0,0028 | 0,0046 | −23,0 / −22,4 dB | −0,2 dB |
| liky_fight (núcleo de batalla, marcadores `core_loop_*`) | 71,446395–100,759365 | 39→55 (16) | 0,0074 | 0,0084 | −24,8 / −25,3 | −0,8 |
| hemkade | 24,002472–132,002472 | 16→88 (72) | 0,262 | 0,268 | −18,9 / −19,1 | +0,1 |
| circus_malus | 0,003447–76,803447 | 0→32 (32) | 0,023 | 0,027 | −13,1 / −15,0 | +1,9 |
| when_i_lose | 27,431633–96,003061 | 16→56 (40) | 0,040 | 0,087 | −11,7 / −11,8 | −0,1 |
| yonose_todo | 85,338685–149,338685 | 32→56 (24) | 0,169 | 0,173 | −7,5 / −7,7 | 0,0 |
| te_odio | 20,000499–68,000499 | 10→34 (24) | 0,110 | 0,155 | −16,8 / −15,8 | −16,0 |

- En las 7 costuras, el salto en la unión es **igual o menor** que el que la canción tiene de por sí en ese punto.
  - Hemkade y YONOSE caen justo en un golpe: su salto alto es el ataque del bombo o del golpe, no un clic.
- La energía de alta frecuencia queda a ≤ +1,9 dB de la natural. **No hay clic medible.**
- La única costura con un pequeño escalón de nivel es la de CIRCUS (+1,9 dB): vuelve al compás 0, que arranca a tope.
- Si el motor quiere más margen, puede hacer un *crossfade* de 5–10 ms programando dos fuentes. No hace falta.

---

## 3. Separación en stems

- **Sí se hizo**, porque cabía en el presupuesto de disco:
  - venv con torch 2.5.1 + demucs: 0,9 GB;
  - modelo htdemucs: 80 MB;
  - stems: 292 MB.
- Tiempo: unos **80 s por canción** en la CPU del M4.
- Ubicación: `~/Desktop/No one - raster (fuera del repo)/audio-derivados/stems/<id>/{drums,bass,other,vocals}.flac`.
- Formato: FLAC 16 bit, 44,1 kHz, estéreo, alineados a muestra con el timeline canónico.
- Hay un `README.txt` por canción con la ganancia común que se aplicó para que nada recorte (la suma de stems × 1/ganancia reconstruye la mezcla).
- **Sonoridad integrada por stem (LUFS).** Sirve para saber qué stems tienen contenido real:

| Canción | drums | bass | other | vocals | Lectura |
|---|---|---|---|---|---|
| circus_malus | −14,4 | −14,8 | −12,1 | −54,5 | **instrumental** |
| hemkade | −13,2 | −15,0 | −10,7 | −27,9 | *chops* o gritos cortos |
| liky_fight | −12,8 | −20,0 | −15,0 | −34,4 | instrumental + 2 gritos |
| when_i_lose | −15,5 | −20,4 | −16,8 | −25,3 | **capa de voz real** (≈ 14 dB bajo la mezcla) |
| yonose_todo | −17,1 | −18,5 | −22,2 | −66,5 | **instrumental** |
| te_odio | −15,2 | −15,6 | −17,2 | −29,6 | *chops* de voz en los ganchos |

- **Calidad esperable:** htdemucs separa bien bombo, 808 y bajo.
  - El stem `other` mezcla teclas, sintes y pads.
  - En los pasajes de 808 muy saturado (te ODIO, hemkade) hay algo de fuga del bajo a `other`.
  - Para versiones *ambient* conviene un pasa-altos de 120 Hz en `other` y revisar a oído.

---

## 4. Catálogo por canción

> Tiempos en segundos (timeline canónico). «Compás» es el índice desde 0. Todos los marcadores están en el beat map.

### 4.1 CIRCUS MALUS — `circus_malus`

**Ficha:**
- Duración: 126,525 s.
- Tempo: **100 BPM**, 4/4, compás de 2,400 s, 52,7 compases.
- Volumen original: I −8,0 LUFS, **LRA 1,1 LU** (la más plana de todas), TP +0,4 dBTP.

**Tonalidad:**
- Centro en **Mi**: el 63 % de la energía del bajo está en Mi y el 22 % en Re.
- Modo **ambiguo**: Sol y Sol♯ pesan igual (0,48 y 0,48). KS da Mi menor 0,63 frente a Mi mayor 0,62.
- Mucho cromatismo: Re♯ como sensible (0,78), Fa (♭2, color frigio) y Si.

**Riff de bajo** (4 compases, en negras/corcheas): `Mi Re Mi Re♯ | Mi Mi Mi Re | Si Re Mi Re | Mi Mi Mi Sol`. Se repite toda la canción.

**Textura y espectro:**
- Energía por stem: batería 43 %, bajo 33 %, other 24 %.
- El 82 % de la energía está por debajo de 250 Hz. Centroide 0,9 kHz: es oscura.
- Batería de hip-hop a 100: bombo en el 1, en «2-y», en «3-y» y en el 4; caja en 2 y 4.
- El stem `other` (teclas de ataque rápido, *posiblemente piano*) toca acordes en registro grave y medio.
- Sin voz.

**Estructura:**

| Sección | Inicio–fin | Compases | Energía | Qué pasa (medido) |
|---|---|---|---|---|
| verse | 0,000–24,000 | 0–9 | 0,77 | Banda completa desde la muestra 0, riff A |
| chorus | 24,000–48,000 | 10–19 | 0,86 | Más brillo: el centroide sube de 790 a 1000 Hz |
| break | 48,000–57,600 | 20–23 | 0,62 | La batería baja a −25 dB |
| verse2 | 57,600–67,200 | 24–27 | 0,78 | Vuelve la batería |
| build | 67,200–76,800 | 28–31 | 0,71 | **Se corta el bajo** (−42 dB) y regresa por partes; la batería adelgaza |
| chorus2 | 76,800–115,200 | 32–47 | 0,85 | Banda completa, 16 compases |
| outro (**final raro**) | 115,200–126,525 | 48–52,7 | 0,33 | Ver abajo |

**Marcadores:** `chorus` 24,0 · `drums_return` 57,6 · `bass_cut` 67,2 · `climax` 76,8 · `weird_final` 115,2 · `final_chord_2/3/4` 117,6 / 120,0 / 122,4 · `breath` 121,998 · `end` 125,05 · big hits 3,3 / 12,9 / 56,1 / 70,5 / 96,9 / 113,7.

**El «weird final», medido:**

1. **Corte total en 115,200 s, exactamente 4 compases antes del fin.** Batería y bajo caen de −16 a −69/−72 dB en un compás. Solo queda `other`, y el centroide baja de 2,5–5 kHz a 0,3–0,9 kHz.
2. **Cuatro acordes, uno por compás** (115,2 / 117,6 / 120,0 / 122,4):
   - acordes 1 y 2: **Fa♯3–Sol3–Si3–Do4** (+ Do2 en el 1), dos choques de semitono (Fa♯/Sol y Si/Do) a una cuarta de distancia;
   - acordes 3 y 4: **Fa♯3–Sol3–Si3–Re4** = Sol maj7 con la 7ª (Fa♯) **debajo** de la fundamental, así que el choque de semitono queda en el bajo.
   - El centro tonal **salta de Mi a Sol** (el relativo mayor), pero «torcido».
3. **Los tres primeros acordes se hinchan:** el pico de energía llega ~0,5 s después del tiempo 1 (115,71 / 118,11 / 120,50), con forma de *swell* o de nota invertida. El cuarto ataca de inmediato (122,48) y decae más largo (1,9 s hasta −20 dB).
4. **Hueco de 290 ms casi en silencio** (−34 dB) en 121,998–122,288, justo antes del último acorde: una «respiración».
5. El volumen percibido **no cae**: los acordes pegan a −6 LUFS momentáneos, como la banda. Lo que cambia es la textura: pulsos de −28 a −6 LU por compás.
6. Silencio digital desde ~124,84 s (−65 dB) hasta el final del archivo.

En resumen: la canción más «perfecta» y plana del set termina **quitándose el cuerpo** y dejando una cajita de música desafinada en otra tonalidad.

**Carácter:** mecánico e hipnótico. No hay sorpresas en 115 s (LRA 1,1), cromatismo de circo y un final que «corrige» la canción.

**Loop:** 0,003447–76,803447 (32 compases: verse → build y regresa al verse).

### 4.2 Hemkade — `hemkade`

**Ficha:**
- Duración: 219,611 s.
- Tempo: **160 BPM**, compás de 1,500 s, 146,4 compases.
- Volumen original: I −6,6 LUFS (la más fuerte), LRA 2,1, TP +2,2 dBTP.

**Tonalidad:** **Fa menor**.
- El 78 % de la energía del bajo es Fa, con inflexiones a **Sol♭** (♭II, color frigio) en los drops: bajo `Fa…Fa | Sol♭ Fa`.
- KS Fa menor 0,645. En el *breakdown* (60–72) sube a 0,748.

**Textura y espectro:**
- Batería 36 %, bajo 37 %, other 27 %.
- Es la más brillante: 10,7 % de la energía entre 2 y 6 kHz y 5,1 % por encima de 6 kHz. Centroide 3,5 kHz.
- Planitud espectral 0,071: mucho ruido, que encaja con *supersaws* y bombo distorsionado.
- Bombo en cada negra.
- Voz: 7 *chops* o gritos de 0,3–1,2 s.

**Estructura:** un ciclo que se repite **drop → build (tartamudeo) → breakdown (melodía sola) → build → drop**.

| Sección | Inicio–fin | Compases | Energía | Medido |
|---|---|---|---|---|
| intro | 0–12 | 0–7 | 0,55 | Bajo + sinte, sin bombo |
| build | 12–24 | 8–15 | 0,69 | Batería ligera (−26 dB) |
| drop | 24–48 | 16–31 | 0,90 | Bombo y bajo a tope. La línea principal entra en 36 s |
| build2 | 48–60 | 32–39 | 0,53 | Tartamudeo: el bombo entra y sale, y regresa en el tiempo 4 (50,625 / 53,625…) |
| break | 60–72 | 40–47 | 0,49 | **Melodía sola** (other −14 dB, centroide 4,4 kHz) |
| drop2 | 72–96 | 48–63 | 0,89 | |
| build3 | 96–106,5 | 64–70 | 0,58 | |
| break2 | 106,5–120 | 71–79 | 0,49 | Melodía sola |
| build4 | 120–132 | 80–87 | 0,67 | La batería sube de −40 a −20 dB |
| drop3 | 132–156 | 88–103 | 0,90 | |
| build5 | 156–168 | 104–111 | 0,52 | Gritos en 159,65 y 162,65 |
| break3 | 168–180 | 112–119 | 0,49 | Melodía sola |
| climax | 180–204 | 120–135 | 0,89 | Último drop |
| outro | 204–219,611 | 136–146 | 0,52 | Tartamudeo y corte (silencio desde 217,93) |

**Marcadores:**
- `first_drop` 24,0 · `drop_2` 72,0 · `drop_3` 132,0 · `climax` 180,0 · `breakdown_1/2/3` 60,0 / 106,5 / 168,0 · `kick_roll_1` 50,625.
- `shout_1..7` 8,5 / 12,7 / 16,8 / **70,5** (dos compases antes del drop2) / 159,65 / 162,65 / 186,0.
- `end` 218,65.

**Carácter:** escala y ascenso. Tiene cuatro drops casi idénticos separados por *breakdowns* melódicos: está hecha para un jefe por fases.

**Loop:** 24,002472–132,002472 (72 compases: drop → … → build4, y regresa al drop1 en lugar del drop3, que es igual; similitud 0,161).

### 4.3 LIKY FIGHT — `liky_fight`

**Ficha:**
- Duración: 237,119 s.
- Tempo: **131 BPM**, compás de 1,8321 s, 129,4 compases.
- Volumen original: I −9,9, LRA 4,2, TP +1,0.

**Tonalidad:** **Sol menor armónico**.
- Bajo `Sol | Fa♯ (Re/Fa♯) | Sol | Fa♯…`: un vaivén i–V. Raíces: Sol 46 %, Fa♯ 37 %, Re 16 %.
- En `other`, Si♭ (0,76) y Fa♯ (0,95) pesan los dos: es la escala armónica.
- Melodía del prechorus: `Re5 Re5 Re5 Si♭4 Sol4 | La4 … Fa♯4`.
- El prechorus por sí solo lee Re mayor (0,778): es la dominante.

**Textura y espectro:**
- **Batería 77 %**, bajo 12 %, other 11 %: manda la percusión.
- Bombo en las 4 negras, con acentos de caja y güira en las posiciones 3, 6, 11 y 14 de 16 (síncopa de merengue/dembow).
- Instrumental, con **2 gritos** (115,85 justo antes de la segunda mitad y 145,95 antes del prechorus2).

**Estructura:** son **dos mitades idénticas de 64 compases**. Los compases 64–127 repiten los 0–63 con el mismo nivel por stem (±0,1 dB).

| Sección | Inicio–fin | Compases | Energía | Medido |
|---|---|---|---|---|
| intro | 0–14,656 | 0–7 | 0,68 | Solo percusión |
| verse | 14,656–29,313 | 8–15 | 0,51 | Bajo + percusión baja, con **stops** de 0,25 s (15,65 y 22,99) |
| prechorus | 29,313–43,969 | 16–23 | 0,78 | Percusión + melodía, sin bajo |
| chorus | 43,969–58,626 | 24–31 | 0,78 | Todo junto |
| break | 58,626–71,450 | 32–38 | 0,48 | Sin batería |
| drop | 71,450–87,939 | 39–47 | 0,80 | La batería regresa **un compás antes** (anacrusa) |
| break2 | 87,939–100,763 | 48–54 | 0,57 | |
| drop2 | 100,763–117,252 | 55–63 | 0,81 | |
| intro2 | 117,252–131,908 | 64–71 | 0,67 | Segunda mitad: percusión sola (stop en 118,35) |
| verse2 | 131,908–146,565 | 72–79 | 0,53 | Stops en 132,90 y 140,24 |
| prechorus2 | 146,565–161,221 | 80–87 | 0,86 | |
| chorus2 | 161,221–175,878 | 88–95 | 0,79 | |
| break3 | 175,878–188,702 | 96–102 | 0,48 | |
| drop3 | 188,702–205,191 | 103–111 | 0,80 | |
| break4 | 205,191–218,015 | 112–118 | 0,57 | |
| climax | 218,015–234,504 | 119–127 | 0,80 | |
| outro | 234,504–237,119 | 128– | 0,35 | Cola |

**Marcadores:**
- `first_drop` 43,969 · `drop_2/3/4` 71,450 / 100,763 / 188,702 · `build_1..4` 69,618 / 98,931 / 186,870 / 216,183 (el último compás antes de cada regreso de batería) · `climax` 218,015.
- `second_half` 117,252 · `silence_1..5` (stops) · `shout_1/2` · `last_bar` 232,672 · `end` 235,45.

**Golpes para coreografía (`hits`, 382):**
- 119 bombo, 88 caja, 122 *stab* (acento del stem `other` o del bajo);
- 31 `phrase` (cada 4 compases), 6 `drop`, 4 `build`, 5 `stop` + 5 `reentry`, 2 `shout`.
- Hay unos 3 por compás en las secciones con batería y unos 2 en los breaks. La separación mínima es de 75 ms. 150 tienen `strength` ≥ 0,8.
- Se calculan así:
  - en cada semicorchea de la grilla, flujo por bandas del stem de batería (<150 Hz / 150 Hz–5 kHz) y *onsets* de `other` y `bass`;
  - se ponderan por el salto de nivel frente a los 200 ms previos;
  - por compás se queda con los 3 más fuertes sobre el percentil 60 de la canción;
  - `strength` es su rango (0,3–1).

**Para la batalla:**
- **Loop principal** 43,965556–161,217483 (64 compases, similitud 0,029: la segunda mitad vuelve a la primera).
- **Núcleo de batalla** `core_loop_start/end` 71,446395–100,759365 (16 compases: drop + break2; la costura está verificada).

### 4.4 WHEN I LOSE — `when_i_lose`

**Ficha:**
- Duración: 221,744 s.
- Tempo: grilla de **140 BPM**, compás de 1,7143 s, 129,35 compases.
- **Pulso sentido de 70** (`feelBpm`): en la grilla de 140, el bombo cae fuerte en 1 y 3 y la caja en «2-y» y 3, con acento en 4. Leído a 70 es el dembow clásico: bombo en cada negra y caja en 3+3+2 semicorcheas. El ciclo ocupa **dos compases de 140**, y el bajo alterna encendido/apagado compás a compás.
- Volumen original: I −11,6, LRA 6,4, TP +1,5.

**Tonalidad:** **Mi menor sobre pedal de Mi** (el 96 % de la energía del bajo está en Mi1; KS 0,924, la tonalidad más clara del set).
- Línea de voz (stem `vocals`, 3,4–10,3 s): `La4 Si4 Do5 … Sol5 … Mi5`, un canto modal en Mi eólico.

**Textura:**
- Batería 51 %, bajo 23 %, other 24 %, voz 2 %.
- **Golpes de sub muy fuertes** en 0,0, 68,571 y 178,286 (RMS de compás −6,6 y −7,0 dB).
- **Voz real** (*voces ancestrales*, coros o canto) en 0,4–40,9, 96,4–164,2 y 181,7–217,9 (134 s en total).
  - **El primer coro (68,6–82,3) no tiene voz.**

**Estructura:**

| Sección | Inicio–fin | Compases | Energía | Medido |
|---|---|---|---|---|
| intro | 0–17,143 | 0–9 | 0,42 | Golpe de sub en 0, voces y bajo, sin batería |
| verse | 17,143–41,143 | 10–23 | 0,78 | La batería entra suave (−28 dB) y se completa en 27,43 |
| break | 41,143–54,857 | 24–31 | 0,75 | Sin bajo ni voz: groove instrumental |
| prechorus | 54,857–68,571 | 32–39 | 0,70 | Vuelve el bajo; batería a −27 dB |
| chorus | 68,571–82,286 | 40–47 | 0,84 | **Golpe** en 68,571 |
| break2 | 82,286–96,000 | 48–55 | 0,62 | Sin bajo |
| chorus2 | 96,000–116,571 | 56–67 | 0,83 | Con voz |
| bridge | 116,571–130,286 | 68–75 | 0,46 | Sin batería: voces + bajo (como el intro) |
| chorus3 | 130,286–144,000 | 76–83 | 0,81 | |
| break3 | 144,000–164,571 | 84–95 | 0,61 | Sin bajo, con voz |
| build | 164,571–178,286 | 96–103 | 0,37 | **El valle**: el punto más bajo (LUFS-S −21,5 en 168–171), que luego sube |
| climax | 178,286–205,714 | 104–119 | 0,80 | **Golpe** en 178,286 |
| outro | 205,714–221,744 | 120– | 0,49 | Sin bajo; se apaga a los 219,06 |

**Marcadores:** `opening_hit` 0 · `voices_in` 3,429 · `beat_in` 27,429 · `first_drop` 68,571 · `chorus_2` 96,0 · `bridge` 116,571 · `valley` 168,0 · `climax` 178,286 · `end` 219,5.

**Carácter:** solemne y antiguo. Es una derrota que se canta. El valle a los 2:45 y el golpe final hacen de «caer y levantarse».

**Loop:** 27,431633–96,003061 (40 compases: verse → break2, y regresa al verse en vez del chorus2; similitud 0,111).

### 4.5 YONOSE TODO — `yonose_todo`

**Ficha:**
- Duración: 208,961 s.
- Tempo: **90 BPM**, compás de 2,6667 s, 78,4 compases.
- Volumen original: I −14,3, **LRA 9,6** (la más dinámica), TP +0,3.

**Tonalidad:** **Si♭ menor**. Progresión de un acorde por compás, medida en las raíces del bajo: **Sol♭ – Mi♭m – Si♭m – Si♭m** (VI–iv–i–i), con un paso cromático La–La♭ y una subida Do–Re–Mi♭–Mi cada 8 compases.
- KS empata Mi♭ menor (0,725) con Si♭ menor (0,722); el bajo decide Si♭.
- El acorde mayor (VI) cae a menor: **«triste pero feliz»** escrito en armonía.

**El ostinato de teclas** (stem `other`, en corcheas, igual en intro, break, coro, clímax y outro):
- compás A: `Si♭3 Fa3 Do4 Fa3 Re♭4 Fa3 Si♭3 Fa3`
- compás B: `Si♭3 Sol♭3 Do4 Sol♭3 Re♭4 Sol♭3 Mi♭4 Re♭4`
- Es una célula ascendente **Si♭–Do–Re♭** sobre un pedal que se alterna. Ver §6.

**Textura:**
- **Bajo 47 %**, other 27 %, batería 26 %.
- Dembow a 90: caja en las posiciones 3, 6, 11 y 14.
- Instrumental.

**Estructura:**

| Sección | Inicio–fin | Compases | Energía | Medido |
|---|---|---|---|---|
| intro | 0–21,333 | 0–7 | 0,57 | Golpe en 0; teclas + sub, batería apenas |
| verse | 21,333–53,333 | 8–19 | 0,73 | Entra el dembow |
| bridge | 53,333–64,000 | 20–23 | 0,45 | La batería baja a −45 dB |
| break | 64,000–85,333 | 24–31 | 0,26 | **Sin bajo**. Desde 74,667 queda **solo `other`**: las teclas desnudas |
| chorus | 85,333–117,333 | 32–43 | 0,77 | **Golpe** (+12 dB) |
| break2 | 117,333–138,667 | 44–51 | 0,24 | Teclas; el bajo regresa en 49–51 |
| prechorus | 138,667–149,333 | 52–55 | 0,51 | Bajo + teclas |
| climax | 149,333–189,333 | 56–70 | 0,78 | **Golpe** (+10,9 dB) |
| outro | 189,333–208,961 | 71– | 0,16 | Teclas. En 202,667 se van y queda un **tic-tac** de hats (−43 dB) con huecos hasta 208,97 |

**Marcadores:** `opening_hit` 0 · `groove_in` 21,333 · `bass_out` 64,0 · `naked` 74,667 · `first_drop` 85,333 · `climax` 149,333 · `fade_tail` 202,667 · `end` 207,8.

**Carácter:** agridulce y cálida. Es la única con valles largos (LRA 9,6) y la que mejor respira debajo del diálogo.

**Loop:** 85,338685–149,338685 (24 compases: coro → prechorus, y regresa al golpe del coro).

### 4.6 te ODIO — `te_odio`

**Ficha:**
- Duración: 214,100 s.
- Tempo: **120 BPM**, con sensación de medio tiempo de trap (60). Compás de 2,000 s, 107 compases.
- Volumen original: I −7,9, LRA 2,6, TP +1,0.

**Tonalidad:** **Sol frigio (≈ Do menor)**.
- Bajo, un acorde por compás: **La♭ – Si♭ – Sol – Fa** (♭II–♭III–i–♭VII en Sol, o VI–VII–V–iv en Do).
- Croma de `other` en el gancho: Sol 1,0, La♭ 0,71, Do 0,63. KS: Sol menor 0,655 / Mi♭ mayor 0,62 / Do menor.
- En la sección filtrada (164–202) lee Mi♭ mayor (0,79): es el mismo material con otro peso.

**Textura:**
- Batería 42 %, **808 41 %**, other 17 %.
- **El 90 % de la energía está por debajo de 250 Hz.**
- Hats en corcheas de 120.
- ***Chops* de voz** en los ganchos («baby yo te odio»): stem a −29,6 LUFS, 43 s en total.

**Estructura:**

| Sección | Inicio–fin | Compases | Energía | Medido |
|---|---|---|---|---|
| intro | 0–4 | 0–1 | 0,24 | Hats; **hueco** en 3,785–3,982 antes de la entrada |
| chorus | 4–20 | 2–9 | 0,83 | La base cae en 4,0 (+18 dB) con voz |
| verse | 20–52 | 10–25 | 0,77 | Base sin voz |
| chorus2 | 52–68 | 26–33 | 0,76 | **Stops** cada 2 compases (53,0→54,5, 57,0→58,5, 61,0→62,5, 65,0→66,5) que dejan pasar la voz |
| verse2 | 68–100 | 34–49 | 0,83 | |
| chorus3 | 100–132 | 50–65 | 0,73 | Voz; caída antes del drop en 128–132 |
| climax | 132–164 | 66–81 | 0,77 | Voz + base completa |
| break | 164–180 | 82–89 | 0,50 | **Filtro paso-bajo**: el centroide cae a 440 Hz; batería entrecortada |
| build | 180–202 | 90–100 | 0,61 | El filtro abre (centroide de 400 a 1000 Hz en 196) |
| drop | 202–212 | 101–105 | 0,74 | Todo de vuelta |
| outro | 212–214,1 | 106– | 0,39 | Cortes |

**Marcadores:** `first_drop` 4,0 · `voice_hook` 52,0 · `chorus_3` 100,0 · `predrop_dip` 128,0 · `climax` 132,0 · `filter_down` 164,0 · `filter_open` 196,0 · `final_drop` 202,0 · `end` 213,8.

**Carácter:** despecho con el corazón expuesto. Los stops y el filtro suenan a señal que se corta y vuelve.

**Loop:** 20,000499–68,000499 (24 compases: verse → chorus2, y regresa al verse).

---

## 5. Dirección musical: quién suena con quién

### 5.1 Leitmotivs (una canción por fuerza narrativa, elegida por los datos)

| Canción | Fuerza | Por qué, medido |
|---|---|---|
| **CIRCUS MALUS** | **Los Correctores** | LRA 1,1 LU: 115 s sin una sola sorpresa dinámica, «un mundo sin sorpresas». Riff mecánico de 4 compases que nunca cambia. El final **le quita el cuerpo a la canción** y deja acordes «perfectos» con un semitono torcido en otra tonalidad: es una corrección hecha música |
| **Hemkade** | **El Leviatán, el cielo y el ascenso** (jefes por capas) | Cuatro drops casi idénticos separados por *breakdowns* melódicos (las fases); 160 BPM; Fa menor con ♭II; la más brillante y fuerte |
| **LIKY FIGHT** | **Canelo** (pelea + fiesta) | 77 % percusión, stops, gritos y dos mitades idénticas. Su grilla tiene golpes muy legibles para coreografiar |
| **WHEN I LOSE** | **Los Primordiales y la memoria del Archivo**; perder con dignidad | Pedal de Mi absoluto (96 %), voces de canto modal, un valle hondo y golpes de sub enormes |
| **te ODIO** | **El agravio contra la mano invisible**: la Estrella empujada (H52) y los **Disruptores** (H55) | Despecho con emoción, voz cortada por stops y una sección filtrada que suena a señal que entra por una grieta |
| **YONOSE TODO** | **El corazón: Luzterna, la isla, el final**; **motivo del arco** | Progresión VI–iv–i (lo mayor cae a menor), la más dinámica y un ostinato ascendente reconocible |

Los **Titiriteros** nunca dan la cara: **no tienen canción**, solo un motivo nuevo (§9). Su ausencia de canción es parte del personaje.

### 5.2 Distribución H31–H65

Nomenclatura: `cue(id, {section})`, estados del director (`setState`) y `stinger`. «NUEVO» se refiere a §9; «var.» a §7.

**Oleada 1 · La Marea Imposible (publicada; esto es para el pulido con `cine`)**

| Misión | Momento | Música |
|---|---|---|
| H31 Las estrellas caen hacia arriba | Noche, Luzterna despierta al jugador; las estrellas suben | `island_night_astral` → **NUEVO `amb.night_astral`** + **motivo del arco** en celesta (§6) cuando suben las estrellas, más `stinger('star_fall')` NUEVO. En la cinemática «el reflejo», `yonose_todo.menu_loop` (var.) a −10 dB. **Fonoteca:** YONOSE TODO aparece como «incompleta» |
| H32 REGISTRO 000 | Abrir la ficha que nadie escribió | `setState('silence')` 1,5 s → `stinger('registro_000')` NUEVO (versión *observando*) |
| H33 Páginas Hundidas | Llegada al 3D | `explore_mystery` → `when_i_lose.ambient` (var.: voces + pedal de Mi) |
| H34 La Biblioteca a la Deriva | Batalla, marea de tinta | `cue('when_i_lose', {section:'verse'})` con loop. El cataclismo `tide` va en `marker:first_drop` (68,571) |
| H35 Shhh | El Bibliotecario (primordial) odia el ruido | `cue('when_i_lose', {section:'prechorus'})`. **Regla de RUIDO → música:** con el medidor alto, `duck(true, 0.6)` + filtro paso-bajo (el jefe «calla» la música); al bajar, vuelve. Derrota del jefe → saltar a `climax` (178,286, golpe). **Desbloquea WHEN I LOSE** |
| H36 La página de Canelo | El Eco | `stinger('eco')` NUEVO (la melodía de LIKY en cajita de música) |
| H37 Canelo quiere el timón | 3 victorias en cualquier modo | Sin cue. Las batallas siguen al director |
| H38 ¡A BABOR! | El golpe final de Canelo | `battle_special` → `cue('liky_fight')`. Al golpe final, saltar en el próximo compás a `climax` (218,015) para la revelación del Almirante. **Desbloquea LIKY FIGHT** |
| H39 Isla Nácar | Puzle del haz | `explore` → **NUEVO `amb.nacar`**. Al resolver: `stinger('discovery')` |
| H40 Madre Nácar | Primordial | `cue('when_i_lose', {section:'chorus2'})`; en la última fase, `climax`. Es el mismo tema de los primordiales |
| H41 La letra en el margen | Primer Corrector, «La Fe de Erratas» | `boss` → `cue('circus_malus')` con su loop (0–76,8). **Al ganar:** `cue('circus_malus', {section:'outro', quantize:'bar'})`: el **final raro** suena mientras el barco blanco «se corrige». La línea «…Ah, verdad.» de Luzterna cae en `breath` (121,998) y el cartel «Continuará: EL CIELO DESPIERTA» en `final_chord_4` (122,4). **Desbloquea CIRCUS MALUS** |

**Oleada 2 · El Cielo Despierta**

| Misión | Momento | Música |
|---|---|---|
| H42 Trombas | El remolino que sube | `stinger('tromba')` NUEVO: subida que termina en Fa, la tonalidad de Hemkade |
| H43 El Kit de Vuelo | El mecánico de Corona Celeste | Mientras habla, de fondo `circus_malus.explore` (var.) a −12 dB: anticipa la ciudad. `stinger('kit_vuelo')` NUEVO |
| H44 Islas Invertidas | Cascadas que caen hacia arriba; batalla con gravedad < 1 | Región: `hemkade.ambient` (var.: *breakdowns* melódicos, sin bombo). Batalla: `cue('hemkade', {section:'build'})`, que llega al `drop` (24,0) solo. La inversión de gravedad a mitad de batalla va en `marker:breakdown_1` (60,0) y el regreso al drop en `drop_2`. **Desbloquea `hemkade.ambient`** |
| H45 Corona Celeste | La ciudad donde nadie llora | `explore` → `circus_malus.explore` (var.: cajita de música cuantizada, sin batería, «demasiado perfecta»). **Desbloquea esa variación** |
| H46 La embajada | Batalla de daño para que no «corrijan» a Canelo | **Duelo de temas:** empieza `circus_malus` (el Corrector); al cruzar el umbral de daño, `stinger('swap')` y cambio en compás a `cue('liky_fight', {section:'drop'})` (71,45). Canelo gana la pista |
| H47 El otro almirante | Revelación: el almirante del Leviatán era un Corrector | Batalla: `cue('hemkade', {section:'drop2'})` (el tema del Leviatán). Revelación: `duck` + `stinger('correctores')` NUEVO, hecho con los acordes del final de CIRCUS. La armonía «dice» quién era |
| H48 Luzterna lo sabe | La linterna es una señal | `emotional` → `yonose_todo.ambient` (var.: solo teclas). Al elegir: si es «déjala encendida», entra el bajo en el siguiente compás (capa `aftermath.bass`); si es «apágala», siguen las teclas solas. Luzterna la deja encendida igual y el bajo entra con su línea. **Desbloquea `yonose_todo.ambient`** |
| H49 Primordial de la Gravedad | Cierra la oleada | `boss` → `when_i_lose` en tres fases: `verse` → `chorus` (68,571) → `climax` (178,286). Gancho (la costura del cielo y la mano de luz): `setState('silence')` → `stinger('titiriteros')` NUEVO |

**Oleada 3 · La Era Astral**

| Misión | Momento | Música |
|---|---|---|
| H50 Puerto Cometa | Astillero retrofuturo | `explore` → `liky_fight.explore` (var.: percusión ligera + melodía). **Desbloquea esa variación** |
| H51 Sincronía | Botón SINCRO | **Batalla coreografiada con LIKY FIGHT** (`battle_special`, `hits`). Las ventanas de SINCRO se abren en los `hits` de `strength ≥ 0,8` y en cada `drop`/`reentry`. Un `stop` congela la pantalla 0,25 s. Si el jugador acierta en el pulso, Fuego + Tormenta = Sobrecarga en el `drop` siguiente. Insignia de Fonoteca «Coreografía» si acierta ≥ 90 % |
| H52 La Estrella que empujaron | Batalla astral, gravedad 0,25; nadie es malvado | `cue('te_odio')` desde `verse` (20,0). La revelación cae en `filter_down` (164,0): la música se va «del otro lado». **Desbloquea te ODIO** |
| H53 Canelo Astral | Se rompe el sello | `cue('liky_fight', {section:'break3'})` → el sello se rompe exactamente en `drop_4` (188,702) (preparar la animación desde `build_3`, 186,870). `stinger('canelo_astral')` NUEVO al terminar |
| H54 Maneki, el conserje | El Archivo es un hospital | `explore_mystery` → **NUEVO `amb.archivo`** + `stinger('titiriteros')` |
| H55 Los Disruptores | Piratas de grieta; tienen razón en algo | `explore` de su escena → `te_odio.explore` (var.: señal filtrada). Batalla → `cue('te_odio', {section:'verse2'})`. Sus ataques de grafiti salen en los stops de `chorus2`; su fase «glitch» va en `filter_down`. **Desbloquea `te_odio.explore`; al ganar, `te_odio.ambient`** |
| H56 La nota al margen que es tuya | Una nota con tu letra | `silence` → la **célula del arco** en piano solo, **solo las dos primeras notas** (Si♭–Do), sin resolver. Siembra la pregunta |
| H57 El Leviatán Invertido | Jefe de tres capas: mar → cielo → grieta astral | `boss` → **Hemkade completa por fases:** capa mar = `drop` (24–48, en loop con `build2`); capa cielo = `drop2` (72); grieta astral = `drop3` (132); liberación = `climax` (180) → `outro` (204). Cada fase cambia en el compás que sigue al `breakdown_n` (la melodía sola es el respiro entre capas). El «gracias» del Leviatán va sobre `outro` + `stinger('leviatan_gracias')` NUEVO (incluye la célula del arco). **Desbloquea Hemkade** |

**Oleada 4 · El Umbral**

| Misión | Momento | Música |
|---|---|---|
| H58 Archipiélago de los Sueños | Islas que cambian según quién duerme; reglas oníricas | Región → **NUEVO `amb.suenos`** por capas, una por tipo de gato dormido. Batalla: `liky_fight.explore`; cada regla nueva se sortea en un `phrase` (cada 4 compases) |
| H59 Ecos de Vida | Primer Eco de cada gato | `stinger('eco')` (el mismo de H36) |
| H60 La Isla que Nadie Recuerda | Tu isla en ruinas; la reparas | `emotional` → `yonose_todo.aftermath` (var. por capas): 0 % reparado = teclas solas; 33 % + bajo; 66 % + batería; 100 % → `cue('yonose_todo', {section:'climax'})` (149,333, el golpe). **Desbloquea `yonose_todo.aftermath`** |
| H61 Lo que Distraxia sabía | La página en blanco habla con tachones | `silence` + `when_i_lose.ambient` a −15 dB (la memoria del Archivo). Cada tachón: `stinger('tachon')` NUEVO |
| H62 Los Correctores tienen un plan | Batalla grande | `boss` → `cue('circus_malus', {section:'chorus'})`. Al derrotar su plan: `stinger('correccion_rota')` NUEVO, los 4 acordes del final con el último **roto** que se resuelve en la célula del arco. **Desbloquea `circus_malus.stinger` («Corrección»)** |
| H63 El Umbral | Frontera + jefe final de la saga; las tres fuerzas | Región → **NUEVO `amb.umbral`**. Jefe de 4 fases: Correctores = `circus_malus` `chorus2`; Disruptores = `te_odio` `climax`; Titiriteros = **NUEVO `boss.umbral`**; fase final = `hemkade` `climax` (180,0). Entre fases, cambio en compás con `stinger('swap')` (los tempos 100/120/160 no se mezclan: cada fase empieza en su compás 1) |
| H64 Mentira | «A nadie le gustan los gatos. Mentira.»; Canelo se duerme encima de la página | `emotional` → `cue('yonose_todo', {section:'prechorus'})` (138,667). **«Mentira» cae en el golpe del `climax` (149,333).** Canelo se acuesta durante el clímax. **Desbloquea YONOSE TODO completa** |
| H65 Continuará | Créditos; REGISTRO 000 pasa a *despertando* | Créditos = `yonose_todo` entera desde 0. En `fade_tail` (202,667, el tic-tac) la ficha cambia de *observando* a **despertando**; `stinger('registro_000')` en su versión *despertando* sobre los últimos tics (205,857 → `end` 207,8) |

### 5.3 Estados del director (`MusicState` → música por defecto)

| Estado | Por defecto | Notas |
|---|---|---|
| `title` (con la Parte II activa) | `yonose_todo.menu_loop` | El motivo del arco abre el juego. Se desbloquea en la Fonoteca como versión incompleta en H31 |
| `island` | La que el jugador eligió en la Fonoteca | Las cues narrativas mandan por encima |
| `island_night_astral` | `amb.night_astral` | Mientras dure el estado de mundo de la noche astral (OPENING) |
| `explore` | Según la región (§5.4) | |
| `explore_mystery` | `when_i_lose.ambient` | |
| `discovery` | `stinger('discovery')` | En la tonalidad del estado actual (§9) |
| `battle` | Rotación entre lo desbloqueado: `when_i_lose`, `te_odio`, `liky_fight` y `circus_malus` (en sus loops). Por región: Páginas/Nácar → WIL; Corona/Invertidas → CIRCUS; Cometa → LIKY; Sueños/Olvidada/Umbral → te ODIO | Arrancar en la sección del loop, no en el intro |
| `battle_special` | `liky_fight` (núcleo `core_loop_*` si la batalla es corta) | |
| `boss` | `hemkade` por fases | Correctores → `circus_malus` |
| `victory` | Batalla normal: el compás `last_bar` de LIKY (232,672–235,45) o `stinger('victory')`. Jefe: `hemkade` `outro` | |
| `emotional` | `yonose_todo.ambient` | |
| `silence` | — | Para tensión antes de revelaciones |

### 5.4 Regiones 3D

| Región | Explorar | Batalla |
|---|---|---|
| `paginas` (O1) | `when_i_lose.ambient` | `when_i_lose` (loop) |
| `nacar` (O1) | NUEVO `amb.nacar` (en Mi menor: enlaza con WIL) | `when_i_lose` (H40). H39 usa el remix de YONOSE: decisión en el doc 24 §5.2 |
| `invertidas` (O2) | `hemkade.ambient` | `hemkade` (drop1 + build2) |
| `corona` (O2) | `circus_malus.explore` | `circus_malus` |
| `cometa` (O3) | `liky_fight.explore` | `liky_fight` |
| `suenos` (O4) | NUEVO `amb.suenos` | `liky_fight.explore` + reglas en `phrase` |
| `olvidada` (O4) | `yonose_todo.aftermath` (capas por reparación) | — (no castiga) |
| `umbral` (O4) | NUEVO `amb.umbral` | Jefe de 4 fases (H63) |

---

## 6. El motivo del arco

**Qué es:** el **ostinato de teclas de YONOSE TODO**, que es reconocible, corto y medible.

- **Rango exacto (versión limpia):** **74,667–80,000 s** (compases 28–29). Ahí suena **solo** el stem `other`, sin bajo ni batería.
- Notas en corcheas a 90 BPM:
  - `Si♭3 Fa3 Do4 Fa3 Re♭4 Fa3 Si♭3 Fa3`
  - `Si♭3 Sol♭3 Do4 Sol♭3 Re♭4 Sol♭3 Mi♭4 Re♭4`
- Debajo va la armonía Si♭m → Sol♭ (i → VI).
- Hay una versión con sub en **0,000–5,333** (compases 0–1, abre la canción). El mismo ostinato sigue en el coro (85,3), el clímax (149,3) y el outro (189,3).
- **La célula** es **Si♭–Do–Re♭** (1–2–♭3, que sube). Tres notas que suben: «las estrellas caen hacia arriba».

**Cómo viaja:**

1. **H31 (abre la Parte II):** la célula en celesta o cajita, lenta, sola, sobre la noche astral. Las estrellas suben con ella.
2. **Título:** `yonose_todo.menu_loop` (intro, con la célula), cada vez que se abre el juego.
3. **H48:** las teclas solas (`ambient`) mientras Luzterna decide: «cuidar algo también es dejar que lo vean».
4. **H56:** solo **Si♭–Do**, sin la tercera nota. La pregunta queda abierta (tu letra).
5. **H57:** en el `stinger('leviatan_gracias')`, la célula en trompa grave: el Leviatán libre la «canta».
6. **H60:** el ostinato regresa capa por capa mientras reparas tu isla.
7. **H62:** el último acorde «corregido» de CIRCUS se rompe y **se resuelve en la célula**: la corrección pierde.
8. **H64:** completa, con banda, en el golpe del clímax (149,333) sobre «Mentira».
9. **H65:** créditos con la canción entera. **REGISTRO 000** tiene su propia célula **Si–Do♯–Re**, la del arco **corrida un semitono hacia arriba**: «una posibilidad que todavía no eligió ser nada». En *despertando* **resbala medio tono y cae en Si♭–Do–Re♭**. El tic-tac de `fade_tail` (202,667) la acompaña.

---

## 7. Variaciones (para el agente de variaciones; usar los stems de §3)

**Reglas comunes:**
- WAV de 44,1 kHz y 24 bit, alineado a la grilla de la original (mismo BPM y la misma fase de compás).
- Duración en compases enteros, con loop sobre compás.
- Se codifican con el pipeline de §2 (`scripts/encode.sh`, AAC 160k). La ganancia estática debe dar −16 LUFS (*ambient*: −18).
- Se agregan a `tracks.json` solo cuando el archivo existe.

| Id | Kind | Título | Fuente (stems / tiempos) | Duración y loop | Notas |
|---|---|---|---|---|---|
| `circus_malus.explore` | explore | Cajita de música | `other` (+ `bass` −6 dB), compases 0–31 (0–76,8), **sin batería** | 32 compases, loop completo | Ideal: re-orquestar el riff (`Mi Re Mi Re♯ / Mi Mi Mi Re / Si Re Mi Re / Mi Mi Mi Sol`) en cajita o celesta, **perfectamente cuantizado y en seco**. «Demasiado perfecta» |
| `circus_malus.stinger` | stinger | Corrección | Original 115,200–125,050, sin procesar (fade de 50 ms al final) | 9,85 s, sin loop | Es el final raro como pieza de colección |
| `hemkade.ambient` | ambient | Cielo abierto | `other` + `bass` de 0–12 (intro) unido en compás a los *breakdowns* 60–72 y 168–180; sin batería | 24 compases (36 s), loop | Melodía épica sin bombo, para volar |
| `liky_fight.explore` | explore | Puerto de fiesta | `drums` con pasa-altos de 150 Hz (percusión sin bombo) −6 dB + `other` + `bass` −10 dB, compases 16–47 | 32 compases (58,6 s), loop | Fiesta de puerto, sin pelea |
| `when_i_lose.ambient` | ambient | Voces de tinta | `vocals` + `other` + `bass`, **sin batería**, compases 2–33 (3,429–58,286) | 32 compases (54,9 s), loop | Voces sobre pedal de Mi |
| `when_i_lose.aftermath` | aftermath | Después de perder | Bridge 116,571–130,286 (ya sin batería), paso-bajo de 2,5 kHz + cola de reverb de 3 s | 8 compases + cola, **sin loop** | Suena después de una derrota y se apaga |
| `yonose_todo.ambient` | ambient | Solo las teclas | `other`, compases 8–19 (21,333–53,333) | 12 compases (32 s), loop | El ostinato del arco |
| `yonose_todo.aftermath` | aftermath | Reconstrucción | `file` = `other`; `layers` = [`bass`, `drums`] de los compases 32–43 (85,333–117,333), en archivos separados, alineados a la muestra | 12 compases, loop | El motor sube capas según el avance de reparación (H60). Si `layers` no se soporta, entregar 3 variaciones |
| `yonose_todo.menu_loop` | menu_loop | Intro en bucle | Original, compases 0–7. **Loop 5,333–21,333** (compases 2–7: no repite el golpe del compás 0 y, al ser un número par, respeta la alternancia A/B del ostinato) | 8 compases de entrada + loop de 6 (16 s) | Título de la Parte II. Verificar la costura con `loopcheck.py` |
| `te_odio.explore` | explore | Señal filtrada | Original 164,0–180,0 (ya filtrado), o el verse 20–52 con paso-bajo de 600 Hz y *gate* rítmico | 8 o 16 compases, loop | Disruptores |
| `te_odio.ambient` | ambient | Solo la voz | `vocals` + `other` de 52–68 (con stops), sin batería ni 808 | 8 compases, loop | La voz sola |

**Capas de jefe (sin archivo nuevo):**
- `hemkade` por secciones (§5.2 H57).
- Para un control más fino con stems: L1 = `other`+`bass`, L2 = + `drums`, L3 = original.

---

## 8. Fonoteca: desbloqueos

| Canción | Versión | Se desbloquea | Momento |
|---|---|---|---|
| YONOSE TODO | `menu_loop` (la canción aparece **incompleta**) | H31 al aparecer | La primera noche: el motivo del arco |
| | `ambient` | H48 | Luzterna deja la linterna encendida |
| | `aftermath` | H60 al 100 % de reparación | Tu isla vuelve a sonar |
| | **original** | H64 | «Mentira»: la canción se completa |
| WHEN I LOSE | `ambient` | H33 | Desembarco en Páginas Hundidas |
| | **original** | H35 (ganar) | El Bibliotecario explica el eje |
| | `aftermath` | Primera derrota en batalla de historia desde H31 (si nunca pierdes, al ganar H49) | Perder con dignidad |
| LIKY FIGHT | **original** | H38 | ¡A BABOR! |
| | `explore` | H50 | Puerto Cometa |
| | Insignia «Coreografía» | H51 con ≥ 90 % de sincronía | |
| CIRCUS MALUS | **original** | H41 (ganar) | La Fe de Erratas |
| | `explore` | H45 | Corona Celeste |
| | `stinger` «Corrección» | H62 | El plan de los Correctores se rompe |
| Hemkade | `ambient` | H44 | Islas Invertidas |
| | **original** | H57 (ganar) | El Leviatán libre |
| te ODIO | **original** | H52 | La Estrella que empujaron |
| | `explore` | H55 al aparecer | Los Disruptores |
| | `ambient` | H55 (ganar) | |
| Otras grabaciones (NUEVO) | Noche astral · Nácar · Archivo · Sueños · Umbral · REGISTRO 000 (*despertando*) | H31 · H39 · H54 · H58 · H63 · H65 | |

`hint` de cada pista (en `tracks.json`, sin spoilers) para mostrar mientras está bloqueada.

---

## 9. Composiciones nuevas (encargo para el agente de composición)

**Para todo:**
- Afinación A = 440. Maestro WAV de 44,1 kHz y 24 bit. Loops en compases enteros con la cola de reverb doblada al inicio (*wrap*).
- Sin clipping; TP ≤ −1 dBTP antes de codificar. MUSIC lo codifica y normaliza: *beds* a −18 LUFS, motivos y stingers por pico a corto plazo de −14 LUFS-S.
- Las tonalidades se eligen para **enlazar en compás** con la canción vecina.

| Id | Para | Tonalidad / tempo | Instrumentación | Duración / forma |
|---|---|---|---|---|
| `amb.night_astral` | H31, `island_night_astral` | Si♭ menor con colores de Re♭ mayor; tiempo libre implícito a 90 (enlaza con YONOSE) | Pad suave (cuerdas/sinte), coro «uu» aireado, **celesta/cajita con la célula Si♭–Do–Re♭** cada 16 compases, glissandos de arpa o celesta **hacia arriba**, drone de Si♭1 a −30 dB. Sin batería | 64–96 s en loop |
| `stinger.star_fall` | H31 | Si♭ menor | Arpegio de celesta **Si♭4–Do5–Re♭5–Fa5–Si♭5** que sube + platillo invertido | 3 variantes de 1,5–3 s |
| `motif.registro_000` | H32, H65 | Célula **Si3–Do♯4–Re4** (la del arco +1 semitono) | Cajita desafinada (−30 cents, con vaivén de ±10), hiss de cinta. Sin pulso | *observando*: 2–4 s, termina en Re y se apaga. *despertando*: 6–8 s, resbala a Si♭–Do–Re♭ y resuelve en Fa/Si♭ |
| `motif.titiriteros` | H49, H54, H56… | **Si♭ lidio** (Si♭–Do–Re–**Mi**): mayor luminoso, «hospital» | Arpa + armónicos de vidrio + rasgueo de lápiz (foley) | 3 variantes de 4–6 s: nota al margen / mano de luz / revelación |
| `motif.correctores` | H47 | Acordes del final de CIRCUS: Fa♯–Sol–Si–Do → Fa♯–Sol–Si–Re | Cajita, cuantizado, **seco** (sin reverb: «sin sorpresas») | 3–5 s |
| `stinger.correccion_rota` | H62 | Igual, y el último acorde se desafina y cae en Si♭–Do–Re♭ | Cajita → piano | 5–7 s |
| `motif.disruptores` | H55 | Sol frigio; el ritmo de los stops de te ODIO a 120 (bajo La♭–Si♭–Sol–Fa) | 808 + *tape-stop* + bitcrush | 2 compases (4 s) |
| `amb.nacar` | Isla Nácar (H39–H40) | **Mi menor**, pulso implícito de 70 (cruza en compás con WHEN I LOSE, grilla de 140) | Armónica de cristal, vibráfono con arco, crótalos, coro suave. Capas: L1 pad, L2 + arpegios de cristal, L3 + dembow suave a 140 | 90–120 s en loop, 3 capas |
| `amb.archivo` | H54, H61, preludio del Umbral | Drone de Si♭; pulso de 60 tipo latido o monitor | Papel (foley), drone, citas del motivo de los Titiriteros | 120 s en loop |
| `amb.suenos` | Archipiélago de los Sueños (H58) | Re♭ mayor / Si♭ menor; 80 BPM | Piano con fieltro, kalimba, *wobble* de cinta, pads invertidos. **Célula del arco invertida (Re♭–Do–Si♭, que baja)** | 32 compases (96 s), **4 capas**, una por tipo de gato dormido (las prende la región) |
| `amb.umbral` | Región Umbral (H63) | Pedal de Si♭ | Combina los cuatro motivos: clúster de los Correctores, ritmo de los Disruptores, arpa lidia de los Titiriteros y la célula torcida de REGISTRO | 120 s en loop, 3 capas |
| `boss.umbral` | Fase Titiriteros de H63 | Fa menor ↔ Si♭ menor; **160 BPM** (entrega en compás a `hemkade` `climax`) | Orquestal + sintes de Hemkade; termina en Do (dominante de Fa menor) para pasar a Hemkade en el compás 1 | 2–3 min con stems para 3 capas |
| Stingers | Varias | — | `discovery` (variantes en Si♭m, Mi m, Fa m y Sol m) · `unlock` (célula del arco en celesta) · `reveal` (H47/H52/H54/H56) · `tromba` (H42, subida que termina en Fa) · `kit_vuelo` (H43) · `eco` (H36/H59: la melodía de LIKY `Re–Si♭–Sol` en cajita, Sol menor) · `sincro` (H51: confirmación en el pulso, Re5/Sol5, 131 BPM) · `canelo_astral` (H53) · `victory` / `defeat` (por familia tonal; `defeat` = 2 compases de las voces de WIL) · `leviatan_gracias` (H57: glissando grave tipo ballena en Fa menor + la célula en trompa) · `tachon` (H61: rasgueo + piano invertido en Si♭) · `swap` (H46/H63: corte de 1 compás para cambiar de canción) | 1–4 s cada uno |

---

## 10. Archivos

| Qué | Dónde |
|---|---|
| Catálogo | `game/src/data/music/tracks.json` |
| Beat maps | `game/src/data/music/beatmaps/{circus_malus,hemkade,liky_fight,when_i_lose,yonose_todo,te_odio}.json` (80 KB en total) |
| Audio del juego | `game/public/music/<id>.m4a` (24,1 MB) |
| Stems | `~/Desktop/No one - raster (fuera del repo)/audio-derivados/stems/<id>/*.flac` (292 MB) |
| Imágenes de análisis | `…/audio-derivados/analisis/<id>.png` (onda, espectrograma, stems, LUFS-S/novedad, secciones, marcadores) |
| Datos crudos | `…/audio-derivados/analisis/datos/` (features por compás, curvas de sonoridad, costuras, hits) |
| Renders de costura | `…/audio-derivados/loops/<id>_<tag>_seam.wav` (2 s antes del fin + 2 s desde el inicio) |
| Scripts | `…/audio-derivados/scripts/`: `grid.py` (tempo), `attack.py` (origen), `pattern.py`/`phase.py` (downbeat), `features.py`/`autoseg.py`, `key.py`/`prog.py`/`melody.py`, `voice.py`, `hits.py`, `build.py` (beat maps), `loops.py`/`loopcheck.py`, `plot.py`, `encode.sh`, `separate.py`. Esperan la variable `SP` y los WAV decodificados; ajustar rutas al reutilizarlos |

---

## 11. Incertidumbres y pendientes

- **Etiquetas de sección:** los cortes están medidos, pero llamar `verse` o `chorus` a algo es interpretación. En CIRCUS no hay un «drop» propiamente dicho (la energía es plana): `climax` marca el regreso de la banda completa después del *build*.
- **Instrumentos:** el stem `other` mezcla teclas, sintes y pads. «Piano» en CIRCUS y «teclas» en YONOSE son inferencias por ataque y registro, no algo confirmado.
- **Voz:** el stem de voz de LIKY y Hemkade tiene fuga de sintes. Los `shout` son eventos cortos y fuertes (≥ −45 dBFS en el stem); podrían ser *chops* instrumentales.
- **Tonalidad de te ODIO:** Sol frigio frente a Do menor depende de cómo se lea el La♭–Si♭–Sol–Fa. Para componer encima, **Sol como centro y La♭ como ♭2** es lo que suena en el gancho.
- **WHEN I LOSE a 140 o a 70:** el beat map usa 140, que es exacto. Si se quieren pulsos «sentidos», usar uno de cada dos `beat` (`feelBpm` 70).
- **Safari y el cebado AAC:** la regla de §0.3 cubre el caso de que algún navegador no respete la lista de edición. Conviene probarlo una vez en Safari y en Firefox con `trackTime()` frente a un `hit`.
- **Doc 18 duplicado:** el comentario de `src/audio/api.ts` menciona `docs/part-ii/18-audio.md` para el motor. Este documento es el **catálogo musical**; si el motor también usa el 18, renombrar uno de los dos.
