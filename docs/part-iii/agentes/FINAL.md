# FINAL — el final de la Parte III de corrido y con la música correcta

> ⚠️ Spoilers del final (dentro de `docs/part-iii` está permitido).

**Pedido del dueño** (después de jugar el final en vivo): «en la batalla del final, por las canciones, como que se pierden la gracia de las escenas, como que también muchas pantallas de carga y se pierde esa sensación de "puta murió"; debería ser más fluida y con la música correcta».

- **Qué estoy haciendo**: terminado. El servidor `final` está apagado. Sin commit ni push; el coordinador integra.
- **Última actualización**: 2026-10-28 12:25.

**Videos** (fuera del repo): `~/Desktop/No one - raster (fuera del repo)/final-fluido/`
- `final-completo-ANTES.mp4` (18:27) y `final-completo-DESPUES.mp4` (13:46), con el audio del propio juego.
- Tres cortes lado a lado: `1-batalla-y-caida-*`, `2-la-muerte-*` y `3-despues-de-SADIE-*`.
- Las dos líneas de tiempo completas en `.md`.

## 1. Medición «antes» (sin tocar código)

- Corrida sin pantalla desde `h93-final` hasta «Continuará», a velocidad real. Video con audio del propio juego: `scratch/final/before/video.mp4` (18:27).
  - `scratch` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`.
- Línea de tiempo completa: `scratch/final/before/timeline.md`.
- La máquina estaba muy cargada por otros agentes (carga 60–350). Por eso los tiempos de horneado salen inflados (la pantalla de carga de «La Mano» duró 14 s). La estructura sí es la misma en las dos corridas.
- La batalla la jugó la IA durante 35 s por pelea y después se forzó la victoria.

**Números «antes»** (desde F31 hasta «Continuará»):

| Qué | Antes |
|---|---|
| Pantallas de carga de película (título + cuenta regresiva) | **12–13**, 49–64 s en total |
| Telones cómicos (bloques rosa/tinta/papel con sonido de papel) | **4**, 6–10 s |
| La isla o la batalla asomando entre dos pantallas de cine | **9**, 1,5–5 s |
| Canción de la isla (YONOSE TODO · ambient) sonando **debajo de películas escritas en silencio** | F33 la noche, F34 «el trazo» (la muerte), «A oscuras» y MIRA, F37 La Mano, F39 recado, **«Continuará»**, el desayuno |
| Música de la batalla final | el **chiptune procedural de la Parte I** (132 BPM), y sigue sonando **debajo de «La caída»** hasta volver a la isla. Nunca se corta en K6 |
| El tema de Canelo | se suelta al terminar F34 (entra la isla en el desayuno) y **vuelve a empezar** en F34 (II) desde el segundo 20 |

**Línea de tiempo «antes», la parte que duele** (t del video; corrida 1, máquina algo menos cargada):

| t | Pantalla | Música que se oye |
|---|---|---|
| 0:56–1:54 | F31 «Se acerca una luz» | fut.jefe.grave (bien) |
| 1:54–1:57 | la isla 0,8 s + **telón cómico** | **YONOSE TODO** entra 0,8 s |
| 1:57–3:34 | las dos batallas (+ telón cómico entre ellas) | **chiptune de la Parte I** |
| 3:34–3:42 | **carga «La caída» (8 s)** | chiptune |
| 3:42–4:17 | F32 «La caída» (Canelo «muere») | **chiptune todo el rato** (el guion pide corte total en K6) |
| 4:17–4:22 | **telón cómico** → isla → tarjeta H94 | **YONOSE TODO** |
| 4:22–4:24 | **carga «La noche sin Canelo»** | YONOSE TODO |
| 4:24–5:58 | F33 la noche (guion: «Música: ninguna») | **YONOSE TODO todo el rato** |
| 5:58–6:08 | **carga «Antes del amanecer» (9 s)** | YONOSE TODO |
| 6:08–6:53 | F34 el regreso | tema de Canelo (bien) |
| 6:53–7:05 | desayuno | **YONOSE TODO** (guion: el tema, en bucle suave) |
| 7:05–7:06 | **carga «Antes del amanecer (II)»** | YONOSE TODO |
| 7:06–7:18 | F34 (II) el golpe | tema de Canelo **desde 0:20 otra vez** |
| 7:18–7:19 | **carga «Antes del amanecer (III)»** | **YONOSE TODO entra en seco** |
| 7:19–7:31 | F34 (III) el trazo, «…Ah.» (la muerte) | **YONOSE TODO debajo de la muerte** |
| 7:31–7:34 | **carga «Linterna mágica» (2,6 s)** | YONOSE TODO |
| 7:34–10:27 | F35 SADIE | SADIE completa (bien) |
| 10:27–10:31 | «A oscuras» + **carga «MIRA»** | **YONOSE TODO vuelve** tras el corte seco de SADIE |
| 10:31–10:57 | F36 MIRA | YONOSE TODO |
| 10:57–11:18 | **telón cómico** isla→isla, tarjetas | YONOSE TODO |
| 11:18–11:32 | **carga «La Mano» (14 s)** | YONOSE TODO |
| 11:32–12:46 | F37 La Mano | **YONOSE TODO** |
| 12:46–12:49 | carga «La vigilia» | — |
| 12:49–13:38 | F38 la vigilia | sadie.luz (bien) |
| 13:38–13:54 | isla, tarjetas, **carga «El recado»** | YONOSE TODO |
| 13:54–14:51 | F39 el recado | **YONOSE TODO** |
| 14:51–14:53 | carga «Créditos» | — |
| 14:53–15:23 | créditos | sadie.luz (bien) |
| 15:23–15:25 | carga «Continuará» | **YONOSE TODO** |
| 15:25–15:35 | «Continuará» (guion: silencio y el lápiz) | **YONOSE TODO** |

## 2. Diagnóstico

1. **Las películas «en silencio» no callaban el juego.** `FilmDef.track: null` dice «silencio», pero `playFilm` solo silenciaba cuando la película traía su canción. El estado del director seguía con la música de la isla (`island` / `emotional` → YONOSE TODO · ambient). El `silence()` de `finalFlow` solo soltaba un *cue* y no había ninguno.
2. **Cada película soltaba su canción al terminar** (`release(0.9)`). El director volvía a la isla: YONOSE TODO entraba entre película y película, también con 0,04 s después del corte seco del golpe, justo antes de la muerte.
3. **La batalla final no tenía música propia.** No hay plan para `p3_final_asedio*`, así que sonaba el secuenciador procedural de la Parte I. Ningún paso lo paraba antes de volver a la isla: sonaba debajo de «La caída».
4. **Una pantalla de carga por película.** Cada `playFilm` construía y horneaba al momento detrás del cargador con título. Entre una película y otra se veía un cuadro de la escena del juego. Para volver a casa se usaba el telón cómico (`goIsland`, `blocks`), aunque ya estuviéramos en la isla.
5. **El tema de Canelo estaba pensado como una sola toma** («en loop hasta que la película lo corte en seco (A8)», tracks.json; guion A6b–A9). La implementación lo partía en dos y reiniciaba la segunda parte desde 0:20.

## 3. Arreglos (sin commit)

| Archivo | Qué |
|---|---|
| `game/src/audio/director.ts` | Silencio por claves (`quiet(key, on)`): con una clave puesta, la música propia del juego (estados, la isla, lo procedural) calla, pero los *cues* de las películas y la Fonoteca suenan. Una fundida corta pedida explícitamente se respeta: el corte en seco ahora es seco. |
| `game/src/audio/api.ts`, `engine.ts`, `player.ts` | Fachada: `quiet()`, `keepLooping()` (la toma que suena sigue en bucle desde donde está, sin reiniciar) y `nowPlaying()` (pista y posición). |
| `game/src/data/music/director.json` | Contexto `battle:p3_final`: el asedio toca **«Ojo del huracán»** (`fut.jefe`), la misma pieza que F31 presenta grave. Es una sola toma para las dos peleas. |
| `game/src/data/music/tracks.json` + `game/public/music/fut.jefe.m4a` | `fut.jefe` completa (1,1 MB, maestro de `audio-derivados/futuro`, −1,3 dB a −18 LUFS). Es una composición nueva, no una original del dueño. |
| `game/src/film/index.ts` | `preloadFilm()` (caduca a los 3 min sin uso; hornea «educado» solo mientras corre otra película): la película siguiente se arma y se hornea fuera de pantalla mientras corre la actual, con su canción decodificada, y arranca en el corte sin cargador. `hold`: el último cuadro se queda hasta que la siguiente está arriba (sirve de telón para cambiar de escena debajo). `next`: lo que sigue se fija antes de soltar la música. `bare`: si no llegó a calentarse, espera en negro y no en el cargador con título. Música: `keep` / `join` / `carry`. |
| `game/src/film/types.ts` | Campos `keep`, `join`, `carry`. |
| `game/src/film/bake.ts`, `stage.ts` | Horneado «educado» cuando corre otra película: dos cuadros y un momento ocioso entre trabajos. |
| `game/src/film/loader.ts` | `BareLoader`: negro sin título. |
| `game/src/momentos/runner.ts` | `defer` + `mount()`: una corrida preparada no se monta ni escucha teclas hasta que le toca. |
| `game/src/film/films/final/index.ts` | F32 `carry` (fut.jefe → fut.jefe.grave en la misma posición, baja plano a plano, **corte total en K6 = 17 s**). F34 (1/3) `keep` (el tema sigue en el desayuno). F34 (II) `join` (monta la misma toma, −4 dB, corte seco al final). |
| `game/src/app/finalFlow.ts` | Al empezar cada flujo del final se suelta la canción que hubiera (la de la Carta) y se pone el silencio. La música del asedio se decodifica de antemano. Silencio desde «La caída» hasta «Continuará» (y entre dos flujos del final, con un tope de 45 s). La batalla entra con el estado `battle:p3_final`. Se precalientan F32 en la 2.ª pelea, F33 en F32, F34 en F33, golpe y trazo en el regreso, SADIE en el desayuno, MIRA en «A oscuras», La Mano en MIRA, la vigilia en La Mano, el recado en la vigilia, y créditos y «Continuará» en el recado. Cada película deja su último cuadro hasta la siguiente. A casa sin telón cómico. El desayuno baja el tema 5 dB. |
| `game/src/app/stageIntro.ts` | El `FilmPort` pasa `hold` / `next` / `bare` y expone `preload`, `releaseHold`, `holding` y `drop`. Ayudantes `preloadStoryFilm`, `releaseStoryHold` y `storyHolding`. |
| `game/src/core/scenes.ts` | Transición `'black'` (fundido a negro sin sonido) para pasar de una pelea del asedio a la otra. |

**Estructura del diseño intacta:** SADIE completa, «Continuará» en silencio y luego el lápiz, sin saltar nada la primera vez, beats persistidos igual que antes.

## 4. Medición «después» (misma ruta, mismo arnés)

| Qué (de F31 a «Continuará») | Antes | Después |
|---|---|---|
| Pantallas de carga de película | **12–13** (49–64 s) | **0** |
| Telones cómicos | 4 (6–10 s) | **0**. Un fundido a negro de 1 s entre las dos peleas del asedio |
| La isla o la batalla asomando entre películas | 9 (1,5–5 s) | **0** |
| Último cuadro sostenido hasta lo siguiente | — | 3, 1,7 s en total |
| Segundos con la canción de la isla debajo de una película | **243 s** | **0 s** |
| Segundos de chiptune debajo de «La caída» | **28 s** | **0 s** |
| Veces que arranca la canción de la isla dentro del final | **11** | **0** (vuelve 18 s después de «Continuará», con la tarjeta) |
| Reinicios del tema de Canelo | 1 (F34 II desde 0:20) | **0**: una sola toma de 60 s (regreso → desayuno → golpe), cortada en seco en el trazo |
| Duración de la ruta | 18:27 (con la máquina a carga 60–350) | 13:46 (carga ~40–100) |

**Lo que se oye ahora** (t del video «después»):

| t | Pantalla | Música |
|---|---|---|
| 0:20–1:18 | F31 | fut.jefe.grave |
| 1:18–2:46 | las dos peleas (sin reinicio entre ellas) | **fut.jefe completa**, entra en el último cuadro de F31 |
| 2:46–3:03 | F32 hasta K6 | la misma pieza pasa a la mezcla grave en el mismo compás y baja plano a plano |
| 3:03 | K6, la llama se apaga | **corte total** |
| 3:03–5:04 | resto de F32, tarjeta H94, F33 la noche | silencio (mar) |
| 5:04–6:04 | regreso → desayuno → golpe | **el tema de Canelo, una sola toma**, más bajo en el desayuno y en el golpe |
| 6:04–6:16 | el trazo, «…Ah.» | silencio (la plumilla) |
| 6:16–9:09 | SADIE | SADIE completa; el primer acorde cae en el corte del trazo, sin pantalla de carga |
| 9:09–11:01 | «A oscuras», MIRA, tarjetas, La Mano | silencio |
| 11:01–11:49 | la vigilia | sadie.luz |
| 11:49–12:52 | tarjetas, el recado | silencio |
| 12:52–13:22 | créditos | sadie.luz |
| 13:22–13:31 | «Continuará» | silencio y el lápiz |

**Partida pasada la muerte** (`scratch/final/post`: `h93-final` con H93 hecha y los beats de H94 hasta `b94_sadie`, recargada sin `?save`):
- Retoma en «A oscuras» → MIRA → H95 → H96 → «Continuará».
- El golpe, el trazo y SADIE no se repiten. Nada se rompe, 0 pantallas de carga y 0,8 s de negro antes de MIRA (no estaba precalentada).
- Al entrar, la canción de la isla suena 1,7 s hasta que el flujo vuelve a tomar el silencio.
- La prueba `tests/finalFluido.test.ts` cubre lo mismo.

**Pruebas:**
- `tsc` limpio.
- `verify-missions --all`: 194 OK/dormidas.
- `vitest` completo: 1083 pasan. Las 2 que fallaron fueron timeouts de simulación de batalla con la máquina saturada (`battleMusic` SINCRO, `gateras` buildSiege), y pasan solas (116/116 junto con las del final).
- Nueva: `tests/finalFluido.test.ts` (8). Actualizada: `tests/filmActo1.test.ts` (la pausa del GC ahora es compartida).

## 5. Para que decida el dueño

1. **La música del asedio** es «Ojo del huracán» (`fut.jefe`), la versión completa de la pieza que F31 ya usaba en grave. Es composición nueva, no una original. Si prefiere otra (un remix de batalla de sus canciones), basta cambiar `battle:p3_final` en `director.json`.
2. **La isla durante el duelo:** en los flujos del final y entre uno y otro (hasta 45 s) está en silencio. Si el jugador se queda en la isla más tiempo, vuelve la música del estado del mundo (`p3_sin_luz` → `emotional` = YONOSE TODO · ambient), como antes. Si quiere silencio en todo el duelo, se cambia una línea en `gaterasWorld.ts` (`music: 'silence'`).
3. **H97 «La última ronda»** (en la Carta, después del duelo) conserva su pantalla de carga: es un epílogo aparte. También se le suelta la canción de la Carta y se calla la música del juego, como pedía su `silence()` original.
4. Fuera de mi alcance y sin tocar: otras películas «en silencio» de los actos II–IV (`h85_oscuridad`, la plantilla neutra) siguen dejando sonar la música del juego debajo. El mecanismo nuevo (`audioApi.quiet`) lo arreglaría si se quiere.

## 6. Falta

Nada de lo pedido.
- Opcional: medir la memoria de GPU con tres películas precalentadas a la vez (golpe, trazo y SADIE durante el desayuno) en un teléfono real.
- Con la máquina cargada, la espera de la batalla bajo el último cuadro de F31 llegó a 8 s en una corrida (0,4 s en la última).

## 7. Cómo retomar

- Servidor: `.claude/launch.json` → `final` (Vite con la config de la casa, puerto 5205 y **sin HMR**, porque otros agentes editan el mismo checkout). La config está en `scratch/final/vite.final.config.mjs`.
- Grabar: `cd scratch/qa3/pp && REAL_SECS=35 node fin-rec.mjs h93-final beat:b96_continuara <out>`. Usa el screencast CDP con marcas de tiempo reales → MP4 a 30 fps más el audio del bus maestro (MediaRecorder).
- Informe: `node fin-report.mjs <out> "film f31_luz"` → `<out>/timeline.md`.
- Trampas:
  - Con la máquina cargada, `page.goto` necesita un timeout largo.
  - ffmpeg en `ultrafast`; si no alcanza el tiempo real, la cola de cuadros crece.
  - El disco está casi lleno (~4 GB libres).
