# Música v2 · oleada 3: producción para las películas

> Agente **MUSICA-V2**, 2026-10-26. ⚠️ Spoilers de la Parte III. Sin commits. Las originales del dueño y sus proyectos de Soundtrap no se tocaron.
> Base: `../historia-v2/03-peliculas.md` (F00–F40, §4 «Música derivada»), los guiones de `../historia-v2/guiones/` y `00-LEEME.md` §6 (las islas).
> **Nadie escuchó nada con oído humano.** Todo lo de abajo está medido; lo que el dueño tiene que oír está en el §8.

## 1. Las 8 originales en el juego

| Id | Archivo | Ganancia | LUFS (decodificado) | Pico 4× | Tamaño | Alineación | Cebado AAC | Duración |
|---|---|---|---|---|---|---|---|---|
| `emen` | `music/emen.m4a` | −6,5 dB | −16,1 | −4,1 dBTP | 3,7 MB | 0 muestras | 2112 | 187,787 s |
| `oh_shit` | `music/oh_shit.m4a` | −6,7 dB | −16,1 | −5,1 | 4,2 MB | 0 | 2112 | 201,948 s |
| `daria` | `music/daria.m4a` | −7,6 dB | −16,0 | −6,6 | 2,9 MB | 0 | 2112 | 146,363 s |
| `no_wey` | `music/no_wey.m4a` | −2,6 dB | −16,0 | −1,9 | 4,4 MB | 0 | 2112 | 226,928 s |
| `distor` | `music/distor.m4a` | −7,2 dB | −16,1 | −5,0 | 3,5 MB | 0 | 2112 | 173,855 s |
| `no_game` | `music/no_game.m4a` | −4,7 dB | −16,1 | −3,7 | 4,3 MB | 0 | 2112 | 205,944 s |
| `xti` | `music/xti.m4a` | −3,5 dB | −16,1 | −3,2 | 4,0 MB | 0 | 2112 | 198,021 s |
| `sadie` | `music/sadie.m4a` | **+2,35 dB** | **−17,8** | −1,0 | 3,4 MB | 0 | 2112 | 172,900 s |

- **Mismo proceso que `drunck.m4a`** (`../investigacion/audio-real.md` §4.3), con el script `parte-iii/scripts/v2/originales_juego.py`:
  - AAC-LC a 160 kbps cvbr (`aac_at`), 44,1 kHz, estéreo;
  - **solo ganancia estática** hacia −16 LUFS, medidos sobre lo decodificado;
  - pico verdadero ≤ −1 dBTP.
- **Compás 1 a 0,000 s**: la fuente es la copia del MP3 decodificada con ffmpeg (el cebado LAME queda recortado). La correlación con la fuente da **0 muestras** de corrimiento en las 8.
- **SADIE** no llega a −16 LUFS sin pasar el pico: queda en −17,8, como YONOSE en la Parte II.
- **SADIE es la exportación v223** (13 de octubre). El proyecto de Soundtrap va en la v284 (21 de octubre), con una 4.ª capa de cuerdas en c17–25 (−5,3 dB) y un «Error» más en c33, justo donde Canelo maúlla en F35. **Si el dueño quiere la v284, tiene que reexportarla.** Los compases no cambian; basta con volver a correr `originales_juego.py sadie` y medir de nuevo.
- **`tracks.json`**:
  - las 8 entran antes de `amb`, en el orden de la historia;
  - cada una con su `beatmap` (los de la oleada 1), `sync` (muestras de la fuente y cebado 2112), `lufs`, carátula (paleta y motivo) y una **pista sin spoilers** para la Fonoteca, como «Hay batalla en la Cuadra 8.» o «Cuando todo se queda en silencio.»;
  - `loop: null`: las películas las tocan una vez.
  - Hay un respaldo del archivo anterior en `parte-iii/v2/datos/tracks.json.antes-oleada3`.
- **La regla «solo en películas y Fonoteca»**:
  - `tests/originalsReserved.test.ts` tiene ahora `ORIGINALS` = las 7 de batalla + las 8 de película. El director, `battles.json` y el código de `cine/regions/story/app/island/battle/scenes/state` no pueden nombrarlas.
  - El chequeo del remix de batalla aplica solo a las 7 que lo tienen.
  - Hay una prueba nueva: cada original de película tiene su `.m4a`, su beat map, sus onsets y el cebado 2112, y ninguna variación derivada apunta al archivo original.
  - En el motor de películas, `isOriginalRef` (`src/film/timeline.ts`) las reconoce solas y `validateFilm` avisa si una película que no es `song` las usa.

## 2. Variaciones derivadas (presentaciones e interludios)

**Regla:** solo material de la propia canción, sin timbres ajenos. Script: `parte-iii/scripts/v2/derivados_v2.py`.
- **Fuentes**: las **islas** de `00-LEEME.md` §6 (compases donde la mezcla ya suena despojada). Solo se usan stems cuando no hay isla.
- **Procesos**: empalme por compases (fundidos de 10 ms), filtros suaves, rubberband R3 (misma altura) y sala generada en numpy.
- **Loop periódico**: el proceso se aplica sobre [loop loop loop] y queda la copia del medio. La forma es [1 compás de entrada][loop][2 compases de salida].
- **Nivel**: −18 LUFS sobre el loop; «Antes de la luz» va a −20.
- **Costura**: medida en el AAC decodificado; en las 13, el salto en la unión es menor o igual al natural.

| Id | Título | Fuente (EDITOR/SEÑAL) | Proceso | Duración · loop | Películas | Acto / dimensión |
|---|---|---|---|---|---|---|
| `emen.publico` | El público espera | EM%EN c1–8, isla sin batería (coro, stab, guitarra) | paso bajo 9 kHz, sala 15 % | 25,6 s · 2,33–20,97 (8 compases a 103) | **F05** | Acto I · La Tele |
| `oh_shit.antes` | Antes de caer | OH SHIT c37–44, isla sin beat (textura + melodía picada) | paso bajo 7 kHz, sala 20 % | 18,2 s · 1,65–14,90 (8 a 145) | **F07** | Acto I → II |
| `xti.pad` | Pad de la noche | xti c73–80, el pad solo | sala oscura 22 % | 18,9 s · 1,72–15,43 (8 a 140) | **F12** | Acto II · El Cómic / Shōnen |
| `daria.calle` | Calle fría | Daria c9–16: stem «other» (piano + shimmer) + 808 en paso bajo; sin batería ni voz | sala 12 % | 19,7 s · 1,79–16,12 (8 a 134) | **F13** | Acto II |
| `daria.piano` | Piano de vinilo | Daria c9–16, stem «other» solo | ×1,5 (89,3 BPM), paso bajo 6 kHz, sala 25 % | 29,6 s · 2,69–24,18 | **F14, F15** | Acto II |
| `no_wey.melodia` | La melodía | No wey c45–52, isla (melodía sola + 2.º bajo desde c49) | sala 10 % | 35,7 s · 3,24–29,19 (8 a 74) | **F18** (`nowey.melodia` en `03-peliculas`) | Acto III · La Biblioteca |
| `no_wey.nodije` | Lo que no dije | No wey c45–48, la melodía sola | ×2 (37 BPM), paso bajo 5 kHz, sala oscura 30 % | 45,4 s · 6,49–32,43 | **F22** | Acto III |
| `distor.senal` | Señal rota | DISTOR c1–4, isla sin batería (808 + sinte + FX) | 12 compases con un paso bajo que se abre de 300 Hz a abierto; después, loop abierto | 38,6 s · 25,71–34,29 (4 a 112) | **F24** | Acto III |
| `no_wey.puente` | Puente a DISTOR | No wey c65 → fin + DISTOR c1–4 a 111 BPM | ver §4 | 21,6 s · sin loop | **cola de F23** | Acto III |
| `xti.gira` | De gira | xti c49–56, tutti (pad, songstarter, bembé, bajo, caja, hat) | tal cual | 18,9 s · 1,71–15,43 (8 a 140) | **F26** y base del karaoke de **F27** | Acto IV · La Gira |
| `no_game.start` | PRESS START | NO G@ME c1–2 ×2 (arpegio + 808) + c53–56 (piano + 808); sin el sinte distorsionado | sala 8 % | 29,3 s · 2,67–24,00 (8 a 90) | **F28** | Acto IV |
| `liky_fight.amanecer` | La llama vuelve | LIKY FIGHT (el tema de Canelo), stems de la Parte II | ver §3 | 45,0 s · 5,44–40,62 | **F34** | Final |
| `sadie.luz` | Antes de la luz | SADIE c33–36, el piano limpio solo | ×1,5 (33,3 BPM), paso bajo 5 kHz, sala cálida 30 %, −20 LUFS | 50,4 s · 7,20–36,00 | **solo F38 y créditos (F39)** | Final |

- **Cobertura**: hay al menos una pieza por acto (Acto I, II, III, IV y Final). Las de Drunck (`drunck.barra`, `drunck.resaca`, `drunck.battle`) ya cubren el prólogo y el comienzo del Acto I (F01–F03); F04 usa `drunck.cinemudo` (§10).
- **SADIE antes de la muerte**: `sadie.luz` es el único material de SADIE fuera de F35. Su nota en `tracks.json` dice «nunca antes del golpe». Ninguna presentación lo usa.
- **Registro**: todas están en `tracks.json` como variaciones de su canción (`kind: 'ambient'`; el puente, `stinger`), con `loop`, `bpm`, `lufs` y la nota del proceso. La lista que escribe el script está en `parte-iii/v2/datos/derivados.json`; `registrar_juego.py` la pasa a `tracks.json`.

## 3. El tema de Canelo (H94: ausente de noche, vuelve al amanecer)

**Cuál es su tema en el juego.** No hay una pista llamada «tema de Canelo», pero el juego ya lo define:
- **LIKY FIGHT es la canción de Canelo** (`docs/part-ii/18-catalogo-musical.md` §5.1: «LIKY FIGHT · Canelo (pelea + fiesta)»).
- Su melodía es la del **Eco** (H36: «la melodía de LIKY en cajita de música»).
- Su célula **Re–Si♭–Sol** es el stinger de **Canelo Astral** (`src/ui/story/o3Sound.ts`).
- En la Parte II suena como `liky_fight.explore` y en su batalla.

**F33 «La noche sin Canelo»** (sin su tema):
- La película no lleva música (`track: null`): solo mar y faro.
- Ojo para MECÁNICAS y CINE: en H94 el director no debe elegir `liky_fight.explore` (el estado `explore` de la Parte II lo rota). La escena es una película, así que no pasa por el director, pero conviene revisarlo si hay tramo jugable en esa noche.

**F34 «Antes del amanecer»** → `liky_fight.amanecer` «La llama vuelve»:

| Tiempo | Qué suena | Guion (h94) |
|---|---|---|
| 0–4 s | **«Un acorde, bajito»**: el primer tiempo de LIKY c33 (melodía + bajo, la isla sin batería) estirado ×6 con sala larga, −6 dB | A2: la llama vuelve, chiquita |
| 4–4,5 s | aire | — |
| 4,5 s → | entra el **tema completo**: la melodía de c17–c32 (precoro y coro) **sin batería**, con el bajo, ×1,2 (109,2 BPM), paso bajo 9 kHz y sala | A5: el alivio, «el tema de Canelo, completo» |
| 5,44–40,62 s | **loop** del tema (16 compases), para sostener el alivio de 30–60 s que pida TEMPERATURA | — |
| cuando la película quiera | **corte en seco** (A8), sin fundido. Después, silencio | A8: «…Entonces la luz primero.» |

## 4. El puente No wey → DISTOR (cola de F23)

`no_wey.puente` (21,6 s, sin loop):
- **0 s = compás 65 de No wey** (194,595 s de la original), **con la misma ganancia que `no_wey.m4a`**. Hasta los 12,97 s es la misma música que la original: la melodía sola, Bumble Bee y el bajo que se va en c65.
- **12,97 s = c69 de No wey**: entra la isla de DISTOR (c1–c4: 808, sinte «Future Flu» y FX).
  - Está estirada a **111 BPM** (×1,009), así que 3 tiempos de DISTOR duran lo mismo que 2 de No wey: la relación 3:2 de la tabla de tempos.
  - Su primer tiempo cae en el tiempo 1 de c69.
  - Sube de −18 dB a 0 dB en 4,5 tiempos, bajo la última nota de No wey, y queda con la ganancia de `distor.m4a`. Las dos están en F♯m.
- **21,6 s**: termina en el compás 5 de DISTOR, con 0,6 s de cola. De ahí sigue «Señal rota» (F24).
- **Cómo usarlo en F23**: una película tiene una sola pista. Hay dos opciones:
  1. F23 toca `no_wey` completa y la cola es una escena o película aparte con `no_wey.puente` desde sus 0 s, que repite los últimos 13 s;
  2. F23 cambia de pista en el compás 65 (194,595 s): en ese punto el audio es el mismo y el cambio no se nota.

  CINE decide según lo que permita `src/film/`. La pregunta de TEMPERATURA (¿gancho o pico de más?) sigue abierta: el puente entra muy bajo y se puede acortar cortando en 17–18 s.

## 5. Las dos piezas propias

Herramientas gratuitas de `docs/part-ii/32-herramientas-musica.md`: VSCO 2 CE (CC0) con `sfizz_render`, GeneralUser GS con FluidSynth y una sala por convolución generada en numpy. Ninguna usa material del dueño. Script: `parte-iii/scripts/v2/piezas_v2.py`; maestros FLAC de 24 bits en `parte-iii/v2/variaciones/`.

Las dos citan, casi inaudible, **la célula de Canelo (Re–Si♭–Sol)** cuando La Mano lo mira. Es la misma pista honesta que ponen los guiones («Ese gato ve demasiado»), dicha en música.

### 5.1 `amb.vocacion` «La Vocación» (F17, H82, Caravaggio)

Órgano de tubos (GeneralUser GS «Pipe Organ 2») y cuerdas graves (VSCO: contrabajos, chelos, violas). Do menor, 90 s, sin loop, −18 LUFS.

| Tiempo | Música | Guion (h82) |
|---|---|---|
| 0–8 | el órgano entra muy grave (pedal Do1 + Do2) | V1: el público se calla |
| 8–16 | cuerdas graves con el rayo (contrabajos Do2, chelos Do3); el órgano suma Sol2 | V2: La Mano baja |
| 16–26 | lamento descendente en los chelos (Mi♭–Re–Do–Si♭–La♭) | V3 |
| 26–36 | **las cuerdas sostienen una nota** (Sol, chelos y violas); el órgano queda en el pedal de dominante | V4: *La creación de Adán* |
| 36–44 | La♭ mayor: la otra luz (la linterna se interpone) | V5 |
| 44–56 | Fa menor → Re♭ (napolitano) | V6–V7 |
| 56–62 | Sol (dominante) bajo el tintineo de la gota que rebota | V8 |
| 62–70 | **silencio de órgano**; cuerdas pp con roce Do–Re♭ y la célula de Canelo en las violas | V9: «Ese gato ve demasiado» |
| 70–86 | el órgano vuelve pp en Do menor y se apaga | V10–V11 |
| 86–90 | nada | V12 |

### 5.2 `amb.plan` «El plan» (F21, H86, cuaderno de Leonardo)

Laúd (guitarra de nailon de GeneralUser GS, doblada muy bajo por el arpa de VSCO para el brillo del punteo) y cuerdas (VSCO). Re menor/dórico, pavana a 72 BPM sobre Rem–Do–Si♭–La. 90 s, sin loop, −18 LUFS.

| Tiempo | Música | Guion (h86) |
|---|---|---|
| 0,5–6 | una nota de laúd (Re3) | P1 |
| 6–10 | nada (la página) | P2 |
| 10–18 | punteo del laúd | P3: la lámpara y la caja |
| 18,3 | entran las cuerdas | P4: los ornitópteros |
| 26,67–27,5 | **un tiempo de silencio** (todo se calla) | P5 |
| 28,4–32 | la célula de Canelo en el laúd, bajito | el ojo de Canelo |
| 32–42 | laúd + violines en línea descendente | P6 |
| 42–52 | **cuerdas tensas**: trémolo La–Si♭ / Mi–Fa sobre un ostinato de La en el laúd | P7: el gato de Vitruvio |
| 52–72 | vuelve el bajo de pavana | P8–P11 |
| 72–77 | **una nota grave** (contrabajo Re2) | P12 |
| 77–84 | trémolo de mandolina y cuerdas pp | P13: el papel que arde |
| **84,0** | **corte en seco** (10 ms); silencio hasta 90 s | P14: «No, wey» |

## 6. Qué pieza va en cada película (para CINE)

| Película | Pista (`track`) |
|---|---|
| F00 | `drunck` (construida) |
| F01 | `drunck.barra` |
| F02 | `drunck.resaca` |
| F03 | `drunck.battle` |
| F04 | `drunck.cinemudo` (las 4 viñetas y el epílogo) |
| F05 | `emen.publico` |
| F06 | `emen` (song) |
| F07 | `oh_shit.antes` |
| F08 | `oh_shit` (song, fragmento c37 → fin = 59,586 s → fin) |
| F09 | `fut.vineta` |
| F10 | `fut.vineta.noticiero` |
| F11 | `fut.vineta.mono` |
| F12 | `xti.pad` |
| F13 | `daria.calle` |
| F14, F15 | `daria.piano` |
| F16 | `daria` (song, c25 → fin = 42,985 s → fin) |
| F17 | `amb.vocacion` |
| F18 | `no_wey.melodia` |
| F19 | `fut.fosa.niebla` |
| F20 | `fut.fosa.latido` |
| F21 | `amb.plan` |
| F22 | `no_wey.nodije` |
| F23 | `no_wey` (song) + cola `no_wey.puente` (§4) |
| F24 | `distor.senal` |
| F25 | `distor` (song, c25 → fin = 51,429 s → fin) |
| F26, F27 | `xti.gira` |
| F28 | `no_game.start` |
| F29 | `no_game` (song) |
| F30 | `xti` (song) |
| F31 | `fut.jefe.grave` (la tormenta la pone la película) |
| F33 | `null` (nada) |
| F34 | `liky_fight.amanecer` |
| F35 | `sadie` (song) |
| F38, F39 (créditos) | `sadie.luz` |

**Todas las películas de la lista maestra tienen pista** (ver §10 para las de la oleada 3b).

## 7. Tamaño

| | Antes | Ahora | Diferencia |
|---|---|---|---|
| `game/public/music` | 60,9 MB | **110,1 MB** | **+49,2 MB**: 30,4 de las 8 originales, 10,8 de las 13 derivadas y las 2 piezas, y 8,0 de la oleada 3b (§10) |

- Las pistas **no se precargan**: `public/sw.js` las guarda en la caché `nolc-music` solo cuando suenan. Cada original pesa entre 2,9 y 4,4 MB; cada pieza derivada, entre 0,35 y 0,9 MB; las dos piezas propias, 1,6 MB cada una.
- El dist copia `public/` entero. Hoy `public/` mide ~1,1 GB, casi todo `cats-svg` (977 MB). El límite de GitHub Pages es de 1 GB por sitio, y el plan de hospedaje del arte (`../12-hosting-arte-p3.md`) es lo que lo resuelve. La música sola no es el problema, pero suma.

## 8. Lo que el dueño tiene que escuchar (orden)

Todo se puede oír, en este orden, en [`escuchar-oleada3.html`](escuchar-oleada3.html): se abre en el navegador desde la carpeta del repo. Es una página aparte porque `docs/part-ii/escuchar.html` no es una carpeta de spoilers.


1. `liky_fight.amanecer`: si se reconoce el tema de Canelo sin la batería y si el acorde inicial se siente como «la llama que vuelve».
2. `amb.vocacion` y `amb.plan`: las dos piezas nuevas. Hay que confirmar que el órgano de GeneralUser no suene a feria y que la guitarra de nailon pase por laúd. Si no, hay dos salidas: bajar el órgano de VSCO (`OrganLoudPedal`) o buscar un laúd SFZ gratuito.
3. `no_wey.puente`: si el 808 de DISTOR entrando bajo la última nota de No wey se siente como amenaza.
4. `distor.senal`: si la apertura del filtro de 12 compases se lee como «señal pirata».
5. `sadie.luz`: el piano estirado ×1,5. Solo para la vigilia y los créditos.
6. Las islas tal cual (`emen.publico`, `oh_shit.antes`, `xti.pad`, `xti.gira`, `no_wey.melodia`) y las reducciones (`daria.calle`, `daria.piano`, `no_wey.nodije`, `no_game.start`).

## 9. Cómo rehacer

Desde `audio-derivados/parte-iii/scripts/`, con `../.venv/bin/python`:
- `v2/originales_juego.py [ids]`
- `v2/derivados_v2.py [piezas]`
- `v2/piezas_v2.py [vocacion|plan]`
- `v2/registrar_juego.py`, que reescribe solo estos ids en `tracks.json`.

Notas:
- El venv de `parte-iii` tiene numpy, scipy, soundfile, pyloudnorm, matplotlib y mido.
- Los WAV decodificados van en `parte-iii/wav/<id>.wav`; se regeneran con ffmpeg.
- Herramientas en `audio-derivados/tools/`: sfizz, VSCO 2 CE, GeneralUser GS.
- Los informes de cada pieza (ganancia, costura, pico) están en `parte-iii/v2/informes/`.

## 10. Oleada 3b: las piezas que faltaban (F04, F09–F11, F19, F20 y F31)

Hechas con el kit de COMPOSITOR-FUTURO (`docs/part-ii/32-herramientas-musica.md`: VSCO 2 CE con sfizz, GeneralUser GS con FluidSynth, Surge XT con pedalboard, Salamander Grand Piano). Material propio o de la propia canción. Script: `audio-derivados/scripts/futuro/s_parteiii.py`. Salida en `audio-derivados/futuro/`: AAC 160k (`aac_at`) y maestros FLAC. `parte-iii/scripts/v2/traer_futuro.py` las copia al juego y las anota para `registrar_juego.py`.
- **Registro**: las `fut.*` van como variaciones de `amb` («Otras grabaciones») y el catálogo las encuentra por su id completo (`resolveTrack`). `drunck.cinemudo` va como variación de `drunck`.
- **Nivel y loops**: todas a −18 LUFS sobre el loop, pico ≤ −2,4 dBTP. Loop en compás exacto, con la costura medida en el AAC decodificado: el salto en la unión queda en el orden del salto natural.

| Id | Título | Qué es | Duración · loop | Película |
|---|---|---|---|---|
| `fut.vineta` | Viñeta | **Composición nueva** para el cómic moderno del «verso arácnido»: Sol menor, boom-bap a 95 BPM. Lleva contrabajo y chelos en pizzicato, batería GM, el **motivo del futuro 1–5–4–3 en las trompas** (Sol–Re–Do–Si♭) y su respuesta, trompetas con el motivo en la parte B, violines spiccato («sentido arácnido»), glockenspiel de viñeta y un **crash en cada página** (cada 4 compases) | 54,5 s · 5,05–45,47 (16 compases) | **F09** |
| `fut.vineta.noticiero` | Viñeta · noticiero | la misma + **fanfarria de trompetas en cuartas abiertas** en cada página y redoble de caja antes de cada una | ídem | **F10** |
| `fut.vineta.mono` | Viñeta · mono | la misma en **mono**, banda 200–4200 Hz y saturación suave: el cómic de Edad de Plata impreso | ídem | **F11** |
| `fut.fosa.niebla` | La fosa · niebla | «La fosa» **re-mezclada**: se quitaron el sonar y las burbujas, porque el fondo del mar no pega con el bosque de Doré. Quedan el pad, el contrabajo con arco, el cristal y el canto deformado del motivo, **lejano y filtrado a 1,1 kHz: un aullido en la niebla** (el Lobo) | 92 s · 4–84 (20 compases de 4 s) | **F19** |
| `fut.fosa.latido` | La fosa · latido | la niebla + **un latido** (foley propio de `clib`) en cada tiempo, a 60 BPM: la paranoia del índice | ídem | **F20** |
| `fut.jefe.grave` | Ojo del huracán · grave | «Ojo del huracán» **re-mezclado grave**: sin glockenspiel, batería −6 dB, trémolo, metales, coro y graves al frente, paso bajo 1,6 kHz y sala de 3 s. Debajo de la tormenta de la película queda la amenaza, no la batalla | 58,4 s · 6,4–51,2 (28 compases) | **F31** |
| `drunck.cinemudo` | En el cine mudo | **Arreglo nuevo con el material de Drunck** para el cine mudo (lo pide la ficha: «`drunck.resaca` en piano de cine mudo»):<br>• piano vertical con una segunda cuerda desafinada (piano de cantina);<br>• Si♭ menor a 82,5 BPM, el tempo de «Bajo la almohada»;<br>• stride con los **«hipos» del bombo de la intro de Drunck** (el anticipo de c2,875 → c3 y el redoble de «3 semicorcheas + 2 fusas» de c4,75), sacados del EDITOR;<br>• una melodía que resbala cromática hacia abajo (la resaca);<br>• banda de fonógrafo | 36 s · 2,91–26,18 (8 compases ≈ una viñeta de 25 s) | **F04** |

**Por qué no entraron las versiones originales de futuro**:
- `fut.fosa` tal cual trae sonar y burbujas, que dicen «submarino» y no «bosque con niebla». Por eso se re-mezcló.
- `fut.jefe` tal cual es una batalla brillante (spiccato, glockenspiel, batería al frente). La ficha de F31 pide «grave».
- Las dos re-mezclas usan **las mismas notas y la misma forma** de las piezas originales. No hay timbres nuevos, salvo el latido de F20, que es foley del mismo kit.

**Sobre `drunck.cinemudo`**: es la única pieza derivada de una canción del dueño con un timbre que la canción no tiene (piano). La ficha de F04 lo pide así y el material sale de Drunck: tonalidad, tempo de la resaca y el ritmo exacto de su intro. **El dueño tiene que aprobarla al escucharla.** Si no le gusta, F04 puede usar `drunck.resaca` tal cual.

**Escucha (añadir a la lista del §8):**
1. `fut.vineta`: si el boom-bap con orquesta se siente «cómic moderno».
2. `drunck.cinemudo`: si se reconoce a Drunck en los hipos y si el piano de cantina no suena a chiste.
3. `fut.fosa.niebla`: si el canto lejano se lee como aullido.
4. `fut.jefe.grave`: si debajo de la tormenta se oye la amenaza.
