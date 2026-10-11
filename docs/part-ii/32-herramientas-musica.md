# 32 · Herramientas gratuitas para hacer música desde scripts (agente COMPOSITOR-FUTURO)

> 2026-10-10. Encargo del dueño: investigar herramientas **gratuitas**, usables **sin interfaz gráfica** desde scripts en macOS (Apple Silicon), instalar las mejores **fuera del repo** y componer música nueva para partes futuras. Nada de esto entra a `game/`.

## Para el dueño (resumen)

- Antes había **un** banco de sonidos (GeneralUser GS, 31 MB) y síntesis hecha a mano. Ahora hay, además:
  - **Un piano de cola de verdad** (Salamander Grand, Yamaha C5, 16 capas de fuerza).
  - **Una orquesta de cámara muestreada** (VSCO 2 Community Edition, de dominio público): cuerdas en sección y violín solo, arpa, flauta, clarinete, fagot, trompa, trompeta, trombón, timbales, glockenspiel, marimba y campanas tubulares.
  - **Un sintetizador de calidad profesional** (Surge XT) que se controla desde Python. (Dexed, el clon del DX7, se probó y se quitó: ver §5.)
- Con eso se compusieron **7 piezas nuevas y 6 remates** para partes futuras (§6). Se escuchan en http://127.0.0.1:5413/escuchar.html.
- Todo lo producido con estas herramientas **se puede usar en el juego** (también si algún día se vende). Lo único que pide crédito es el piano (CC-BY 3.0): basta una línea en los créditos.
- Lo descartado: los generadores de música con IA (MusicGen prohíbe el uso comercial de sus pesos y pesa varios GB), SuperCollider y Csound (no aportan nada que no haga ya Python).

## 1. Requisitos

1. Gratis y de fuente oficial.
2. Se puede manejar **desde un script** (sin abrir una ventana): el agente no tiene oídos ni ratón, solo números.
3. Corre en **macOS Apple Silicon** (nativo o con Rosetta).
4. La **licencia permite usar lo producido** en un juego publicado, sin regalías.
5. Cabe en el disco: tope de ~3 GB para todo.

## 2. Tabla comparativa

Leyenda de la columna «Sin GUI»: ✅ = probado aquí; ◐ = posible pero no probado; ✗ = no.

| Herramienta | Qué es | Licencia (herramienta) | ¿Lo producido se puede usar en el juego? | Tamaño | Sin GUI | Veredicto |
|---|---|---|---|---|---|---|
| **pedalboard** 0.9.26 (Spotify) | Python: hospeda VST3/AU (instrumentos y efectos), tiene reverb, compresor, filtros, convolución, chorus… | GPL-3.0 | Sí: la GPL cubre el código, no el audio que sale | 2 MB (rueda arm64) | ✅ | **INSTALADO** (host de todo) |
| **sfizz** 1.2.3 (`sfizz_render`) | Reproductor SFZ; `sfizz_render` convierte MIDI + SFZ → WAV | BSD-2 | Sí | 1 MB (binario x86_64, corre con Rosetta) | ✅ | **INSTALADO** |
| **Salamander Grand Piano V3** (sfzinstruments) | Yamaha C5, 48 kHz/24 bit, 16 capas de velocidad, armónicos, pedal, *release* | CC-BY 3.0 | Sí, **con crédito** («Salamander Grand Piano por Alexander Holm, CC-BY 3.0») | 715 MB (FLAC) | ✅ (sfizz) | **INSTALADO** |
| **VSCO 2 CE** (Versilian Studios) | Orquesta de cámara muestreada en SFZ | **CC0** (dominio público) | Sí, sin condiciones | 2,3 GB completo → **777 MB** del subconjunto usado (26 instrumentos) | ✅ (sfizz) | **INSTALADO (parcial)** |
| **Surge XT** 1.3.4 | Sintetizador híbrido (sustractivo, wavetable, FM, 30+ efectos) | GPL-3.0 | Sí | 88 MB (solo VST3 instrumento + efectos; sin el banco de presets de fábrica, 416 MB) | ✅ (pedalboard, 599 parámetros) | **INSTALADO** |
| Dexed 1.0.1 | Clon del Yamaha DX7 (FM de 6 operadores), con cartucho de fábrica | GPL-3.0 | Sí | 16 MB | ◐ (carga y suena, pero `program` no cambia el patch desde pedalboard) | Probado y **quitado**: habría que programar los 6 operadores a mano; Surge XT cubre lo mismo |
| FluidSynth 2.6.1 + GeneralUser GS 2.0.3 | Reproductor SF2 + banco GM | LGPL-2.1 / libre para música | Sí | 3 + 31 MB | ✅ | Ya estaba (COMPOSER) |
| DawDreamer 0.9.0 | Python: DAW sin GUI (VST, Faust, *time-stretch*) | GPL-3.0 | Sí | 39 MB (rueda arm64) | ◐ | No hace falta: pedalboard + sfizz cubren lo mismo |
| Vital | Sintetizador wavetable | GPL-3.0 el código; el binario oficial pide cuenta, y los presets tienen licencia propia | Sí (lo producido), con cuidado con los presets | ~200 MB | ◐ | **Descartado**: la descarga oficial exige cuenta; Surge XT hace lo mismo |
| SuperCollider 3.13 | Lenguaje de síntesis; render no en tiempo real (NRT) | GPL-3.0 | Sí | ~220 MB (app) | ◐ | Descartado: duplica la síntesis en numpy que ya hay |
| Csound 6 | Lenguaje de síntesis clásico | LGPL-2.1 | Sí | ~150 MB (Homebrew, muchas dependencias) | ◐ | Descartado: igual que SuperCollider |
| Sonatina Symphonic Orchestra | Orquesta SFZ antigua (2008) | CC Sampling Plus 1.0 | Sí, con crédito | 500 MB | ◐ | Descartado: VSCO 2 CE es mejor y CC0 |
| Karoryfer (Weresax, Meatbass…) | Instrumentos SFZ sueltos | Varía por librería (la mayoría «da crédito») | En general sí; hay que revisar una por una | 50–500 MB c/u | ◐ | Pendiente para el futuro (un saxo, un bajo eléctrico) |
| MuseScore_General / FluidR3 | Bancos GM SF2/SF3 | MIT | Sí | 40–200 MB | ✅ | No aportan sobre GeneralUser GS |
| MusicGen (Meta, audiocraft) | IA que genera música desde texto | Código MIT, **pesos CC-BY-NC 4.0** | **NO** para un juego comercial | PyTorch ~1 GB + pesos 1–7 GB | ◐ | **Descartado** (licencia y disco) |
| Magenta (Google) | Modelos de melodía/acompañamiento (TensorFlow) | Apache-2.0 | Sí | TensorFlow ~1,5 GB | ◐ | Descartado: disco, y la composición la hace el agente |

Fuentes: PyPI (metadatos de `pedalboard` y `dawdreamer`), GitHub (`sfztools/sfizz` releases, `sgossner/VSCO-2-CE` con licencia CC0 en la API, `sfzinstruments/SalamanderGrandPiano`, `surge-synthesizer/releases-xt`, `asb2m10/dexed`), versilian-studios.com (VSCO 2 CE, CC0), el manual de MuseScore (Salamander, CC-BY 3.0) y las fichas de licencia de audiocraft (pesos CC-BY-NC 4.0).

## 3. Recomendación (lo que se instaló y por qué)

**Cadena elegida:** `Python (numpy) → MIDI (mido) → { sfizz_render + SFZ | pedalboard + Surge XT | FluidSynth + GeneralUser } → mezcla en numpy (reverb por convolución, EQ, limitador) → FLAC 24 bit + AAC (aac_at) → medición (LUFS, pico verdadero, costura del loop, espectrograma)`.

1. **sfizz + Salamander + VSCO 2 CE** para todo lo acústico: es el salto de calidad más grande. GeneralUser GS suena bien pero es un banco GM de 31 MB; un piano de 750 MB con 16 capas y cuerdas grabadas nota por nota respiran distinto (*release*, resonancia, vibrato real).
2. **pedalboard** como anfitrión: carga Surge XT (o cualquier VST3/AU) como instrumento con mensajes MIDI y devuelve numpy. También sus efectos (convolución, *chorus*, *phaser*, *ladder filter*) sirven como alternativa a los de `lib.py`.
3. **Surge XT** para pads, bajos y texturas sintéticas *propias* (el dueño no quiere timbres ajenos pegados a sus canciones; en piezas originales, un sintetizador bien programado es carácter). Se instaló sin el banco de presets: los sonidos se programan por parámetros desde el script, así cada sonido queda escrito y es reproducible.
4. Se mantiene la síntesis propia de `variaciones/lib.py` (celesta, campana, coro «oo», drones periódicos, cajita de música): es la que hizo `amb.night_astral`.

## 4. Dónde quedó todo (fuera del repo)

`~/Desktop/No one - raster (fuera del repo)/audio-derivados/tools/`:

| Ruta | Qué |
|---|---|
| `venv-futuro/` | **Se borró al terminar** (se recrea en 2 min, ver abajo): Python 3.12 + `scripts/futuro/requisitos.txt` (numpy, scipy, soundfile, librosa, pyloudnorm, matplotlib, mido, pedalboard) |
| `sfizz/bin/sfizz_render` | sfizz 1.2.3 (x86_64, Rosetta) |
| `sfz/SalamanderGrandPiano/` | Piano (con su `LICENSE`, CC-BY 3.0) |
| `sfz/VSCO-2-CE/` | Subconjunto de VSCO 2 CE (con su `LICENSE`, CC0); lo baja `scripts/futuro/get_vsco.py` |
| `plugins/Surge XT.vst3`, `plugins/Surge XT Effects.vst3` | Surge XT 1.3.4 (GPL-3.0), 89 MB |
| `soundfonts/GeneralUser-GS.sf2` | Ya estaba |

Total en `tools/` al terminar: **≈ 1,6 GB** (piano 715 MB + VSCO 777 MB + Surge 89 MB + sfizz 8 MB + GeneralUser 31 MB).

Recrear el Python: `cd audio-derivados/tools && python3 -m venv venv-futuro && venv-futuro/bin/pip install -r ../scripts/futuro/requisitos.txt`.

Más instrumentos de VSCO: `venv-futuro/bin/python -I scripts/futuro/get_vsco.py --dry <Nombre>.sfz` muestra cuánto pesa; sin `--dry` lo baja (solo las muestras que ese SFZ usa).

## 5. Trampas conocidas

- `sfizz_render` es x86_64: necesita Rosetta (ya está). Renderiza más lento que en tiempo real con el piano completo; conviene una parte por llamada.
- Surge XT sin su carpeta de datos arranca con el patch «Init» (onda de sierra): está bien, todo se programa por parámetros. Algunos tipos de oscilador *wavetable* necesitarían las tablas de fábrica (no se usan).
- pedalboard: un instrumento se toca con `plugin(mensajes_mido, duration=…, sample_rate=…)`; los tiempos de los mensajes son **segundos absolutos**. El plugin guarda su estado entre llamadas: `flib.vst()` lo devuelve a su estado inicial antes de cada patch.
- Surge XT: si una nota se solapa con la siguiente justo en el borde de un render periódico, el acorde siguiente puede quedar mudo; las notas de pads se escriben sin solaparse (la cola la da el *release*).
- Una nota repetida cuyo *note-off* cae después del *note-on* siguiente mata la nota nueva (sfizz, FluidSynth y Surge): `flib.fix_overlaps` acorta la anterior.
- Dexed: el parámetro `program` cambia el nombre pero no carga el patch desde pedalboard (se midió: el audio no cambia). Por eso se quitó.
- Los créditos del juego deben nombrar el piano Salamander si alguna pieza que lo usa entra al juego (fichas en §6).

## 6. Lo que se compuso (fuera del repo, para partes futuras)

Todo en `~/Desktop/No one - raster (fuera del repo)/audio-derivados/futuro/` (`.m4a` AAC como las del juego; maestros FLAC 24 bit, espectrogramas e informes en `futuro/maestros/`; mapas de pulsos en `futuro/beatmaps/`). Scripts para re-renderizar: `audio-derivados/scripts/futuro/s_<pieza>.py` (sobre `flib.py`). Página para escuchar: `futuro/escuchar.html` (con un mezclador para las piezas por capas), servida con `cd …/audio-derivados/futuro && python3 -m http.server 5413 --bind 127.0.0.1` → http://127.0.0.1:5413/escuchar.html. Se regenera con `python3 scripts/futuro/gen_escuchar.py`.

Todas comparten un **motivo nuevo** (1–5–4–3: sube una quinta y baja por grados hasta la tercera), distinto de la célula del arco de la Parte II, para que las partes futuras tengan identidad propia. Ninguna usa las canciones del dueño; el único guiño es rítmico (acentos 3+3+2 del dembow en cuerdas, en `fut.menu` y `fut.jefe`).

| Id | Nombre | Para qué | Tonalidad | BPM | Forma / loop | Dur. | Volumen (decodificado) | Instrumentos |
|---|---|---|---|---|---|---|---|---|
| `fut.menu` | Carta de navegación | menú / portada | Mi♭ mayor | 96 | 16 compases, loop 2,500–42,500 s | 47,5 s | −17,0 LUFS, −2,2 dBTP | piano Salamander, pizz 3+3+2, cuerdas, clarinete, arpa, glock, bombo + shaker |
| `fut.carta` | Carta sin enviar | íntima (piano) | La♭ mayor / Fa menor | 66 | 24 compases, loop 3,636–90,909 s | 98,2 s | −18,0 LUFS, −2,3 dBTP | piano Salamander, violín solo lejano, aire |
| `fut.faro` + `luz`/`mar`/`voz` | Faro en la niebla | región por capas | Re mayor / Si menor | 70 | base 24 + capas 12 (loop 3,429–85,714 / 3,429–44,571 s) | 92,6 s + 3 × 48 s | base −20,6; todo −17,5 LUFS, −3,5 dBTP | cuerdas, trompa, piano lejano, olas / arpa + glock / contrabajo, chelos, timbal / flauta |
| `fut.mercado` | Mercado en las nubes | exploración alegre | Fa mayor | 112 | 16 compases, loop 2,143–36,429 s | 40,7 s | −18,0 LUFS, −5,5 dBTP | flauta, clarinete, marimba, fagot, contrabajo pizz, glock, madera |
| `fut.marea` + `bajo`/`ritmo` | Marea baja | «después» por capas | Sol mayor / Mi menor | 84 (swing) | base 16 + capas 8 (loop 2,857–48,571 / 2,857–25,714 s) | 54,3 s + 2 × 28,6 s | base −19,0; todo −17,5 LUFS, −2,5 dBTP | piano eléctrico GM, vibráfono / contrabajo pizz / batería suave |
| `fut.fosa` | La fosa | ambiente raro (submarino) | Do♯ menor / La lidio | 60 | 20 compases de 4 s, loop 4,0–84,0 s | 92,0 s | −18,0 LUFS, −3,1 dBTP | pad Surge XT, contrabajo con arco, cristal, sonar, ballena, burbujas |
| `fut.jefe` | Ojo del huracán | batalla de jefe | Re menor | 150 | intro 4 · loop 28 (6,4–51,2 s) · final 2 | 58,4 s | −16,5 LUFS (loop), −1,6 dBTP | spiccato, trémolo, trompas, trompetas, trombones, timbales, coro, batería GM, bajo Surge |

Remates (−14 LUFS de pico corto, ≤ −4,5 dBTP): `fut.st.hallazgo` (3,4 s), `fut.st.amigo` (2,9 s), `fut.st.puerta` (5,6 s), `fut.st.faro` (6,0 s), `fut.st.victoria` (4,6 s: el motivo del jefe en mayor), `fut.st.derrota` (5,2 s).

**Verificación con números** (`scripts/futuro/analisis.py` → `futuro/maestros/informes/_comparacion.json` e `img/_comparacion.png`):
- Loops: todos en compás exacto y periódicos a la muestra en el maestro; en el AAC decodificado el salto de la unión queda en el orden del salto natural y la energía > 8 kHz en la unión por debajo del percentil 90 del propio loop (sin clic). `fut.jefe` arranca el loop en un golpe: el salto es el del ataque.
- Ojo con `fut.jefe` si el navegador no recorta el cebado AAC: el juego ya corrige los tiempos (+2112 muestras, doc 18 §0.3); sin esa corrección, la unión caería dentro del final.
- Limitador del maestro: actúa en ≤ 1,7 % del tiempo y como mucho −1,7 dB (solo picos de piano y percusión).
- Espectro: centroides 390–670 Hz y < 3,3 % de energía arriba de 2 kHz en las piezas largas, igual que las favoritas (`amb.night_astral` 448 Hz / 1,8 %, `amb.hilos` 451 Hz / 3,5 %). Las más parecidas por espectro: `fut.jefe` ↔ `amb.hilos` (3,8 dB), `fut.menu` ↔ `amb.archivo`, `fut.carta` ↔ `amb.archivo`, `fut.faro` ↔ `yonose_todo.ambient`.
- **No se escuchó con oído humano.** Lo primero que conviene escuchar: el mezclador de `fut.faro` y `fut.marea`, el balance orquesta/batería de `fut.jefe` y la ballena de `fut.fosa`.
