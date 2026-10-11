# 19 · Arquitectura de audio (Parte II)

Motor de audio de la Parte II: mezclador de cinco buses, director musical adaptativo, reproductor
sincronizado con el reloj de audio, ambientes y stingers procedurales, ducking de diálogos, la
invitación al sonido y la **Fonoteca**. Todo vive en `game/src/audio/`; el catálogo musical (archivos,
mapas de beats, variaciones) es de MUSIC: `docs/part-ii/18-catalogo-musical.md`.

La Parte I no cambia: su música procedural (`core/music.ts`) suena igual mientras la partida no haya
terminado H30.

## Archivos

| Archivo | Qué hace |
|---|---|
| `audio/api.ts` | **La fachada** (`audioApi`). Lo único que usan escenas, cine, batallas. Nunca lanza. |
| `audio/engine.ts` | Arranque (`installAudio()` desde `main.ts`), instala la fachada, hook DEV `window.__audio`. |
| `audio/director.ts` + `directorTable.ts` | Director adaptativo (estado, cue, «listen» de la Fonoteca) y su resolución pura. |
| `data/music/director.json` | **La tabla** estado → pistas. MUSIC y escenas la editan; el código no. |
| `audio/player.ts` | Decks (stream / buffer), crossfades, cuantización, reloj audible. |
| `audio/clock.ts` | `BeatScheduler`: eventos del mapa de beats, sin duplicados, con huecos de frames. |
| `audio/beatgrid.ts` | Matemática pura: mapas, tiempo «desenrollado», loops, siguiente compás. |
| `audio/catalog.ts` | Lee `data/music/tracks.json` + `beatmaps/*.json` (mapas: carga perezosa). |
| `audio/ambience.ts` | Camas de ambiente procedurales (mar, viento, lluvia, tormenta, cueva, noche astral). |
| `audio/stingers.ts` | Stingers (`discovery`, `unlock`, `star_fall`, `reveal`) procedurales o de archivo. |
| `audio/invite.ts` + `inviteUi.ts` | La invitación al sonido (lógica / tarjeta). |
| `audio/fonoteca.ts` + `musicSave.ts` | Estado de la Fonoteca en la partida (`ext.music`) + normalización pura. |
| `audio/cover.ts`, `unlockToast.ts` | Portadas dibujadas en código y la animación del disco nuevo. |
| `panels/Fonoteca.ts` | El panel. Entrada: botón FONOTECA del HUD (Parte II, con ≥1 canción). |
| `core/audio.ts` | Contexto, buses, ducks con llave, SFX procedurales (sin cambios de recetas). |
| `core/music.ts` | Secuenciador procedural de la Parte I; ahora suena por `procBus` y tiene `router`. |
| `core/settings.ts` | Volúmenes por bus (`vol`), migración, `soundInvite`. |

## Grafo de buses

```
procBus (música procedural P-I) ─┐
decks de música (player) ────────┴► musicBus ─► musicDuck ─┐
camas de ambiente ─────────────────► ambientBus ─► ambDuck ─┤
SFX ───────────────────────────────► sfxBus ────────────────┼─► master ─► compresor ─► salida
voces ─────────────────────────────► voiceBus ──────────────┘
```

- Ganancia de bus = posición del slider² (`core/settings.ts › sliderGain`). Ajustes muestra GENERAL,
  MÚSICA, EFECTOS, AMBIENTE, VOCES y SILENCIAR TODO.
- **Migración de ajustes** (`migrateSettings`): los viejos `musicVolume`/`sfxVolume` eran ganancias
  crudas → slider = √ganancia (suena igual). Se siguen escribiendo como espejo para una pestaña vieja.
- La voz sintetizada del casino (`core/voice.ts`) usa VOCES × GENERAL.
- **Ducks con llave** (`audio.duck(key, on, dB)`): cada llave cuenta sus retenciones; gana el más
  profundo. Música −dB, ambiente −dB/2. `say()` usa la llave `dialog` (−6 dB, baja en ~80 ms, vuelve en
  ~350 ms); los stingers `stinger` (−4 dB); `audioApi.duck()` usa `api` (o la que pases).

## La fachada (`audioApi`)

Contrato original (no cambió) + extensiones compatibles marcadas *(ext)*:

| Llamada | Efecto |
|---|---|
| `setState(state, { fade?, context? })` | Estado adaptativo; el director elige pista (tabla). Idempotente: el mismo estado no reinicia nada. |
| `cue(trackId, opts)` | Pista concreta. `quantize: 'bar'\|'beat'\|'now'`, `section` (sección o marcador del mapa), `fadeIn`, `fadeOut`, `loop`, `narrative`, *(ext)* `sync` (buffer, precisión de muestra), *(ext)* `at` (segundo de inicio), *(ext)* `restart` (salto cuantizado dentro de la canción que ya suena; batallas musicales, doc 24). |
| `release(fade?)` | Termina el cue y devuelve la música al estado. |
| `ambience(bed, { fade?, level? })` | `sea`, `wind`, `rain`, `storm`, `cave`, `night_astral`, `none`. Crossfade. |
| `stinger(id, { gain? })` | One-shot musical. Desconocido → SFX del mismo nombre o nada. |
| `duck(on, dB?, key?)` | Ducking con llave (cada `true` necesita su `false`). |
| `trackTime()` | Segundos desde el inicio de la pista sincronizada **tal como se oye**; `null` si no hay. |
| `on(evento, fn)` | `beat`, `bar`, `section:<n>`, `marker:<n>`; *(ext)* `section`, `marker`, `hit`, `hit:<kind>` (golpes de coreografía de MUSIC, `info.strength`), `voice:start`, `voice:end`. Devuelve `off()`. |
| `unlockSong(id, source)` | Fonoteca: idempotente, persistido, animación una vez por canción. |
| *(ext)* `prefetch(trackId)` | Calienta la caché (archivo completo, prioridad baja, una vez por sesión; respeta «ahorro de datos»). |
| *(ext)* `currentTrack()` / `musicState()` | Qué suena / último estado. |
| *(ext)* `beatMap(trackId?)` | El mapa completo (beats, compases, secciones, marcadores, loop, `hits`, `voice`). |

`info.time` de los eventos es tiempo de `AudioContext` (comparable con `ctx.currentTime`, sirve para
programar sonidos alineados); el evento se **dispara** cuando se oye (latencia compensada).

## Director

Prioridad (la más alta primero):

1. **listen** — la Fonoteca está tocando algo que eligió el jugador (panel abierto).
2. **cue** — `audioApi.cue()`. Un cue `narrative: true` dura hasta `release()`; uno no narrativo (la
   canción de una batalla especial) además termina solo cuando el estado cambia a otro.
3. **Música de la isla** — la elección del jugador en la Fonoteca; solo en el estado `island`.
4. **Tabla** — `partII[estado]` (+ `contexts`): la primera pista candidata que exista en `tracks.json`;
   si ninguna, su `procedural` (o silencio).

**Parte I** (sin H30): el director no toca la música procedural; las escenas siguen llamando
`music.play(mood)` como siempre. Solo actúa ante un cue explícito y, al soltarlo, devuelve el humor que
interrumpió. **Parte II**: `core/music.ts` tiene un `router`: cada `music.play('island'|'battle'|…)` de
las escenas existentes pasa por el director (`moodToState`), así que la Parte II entera queda adaptativa
sin tocar esas escenas. Nunca suenan a la vez la música procedural y una pista: al entrar una pista el
`procBus` hace fade y el secuenciador se detiene.

Una pista que no carga (404, error de decodificación) queda marcada como rota en la sesión y el director
pasa a la siguiente candidata. Una pista de estado sin loop que termina no se repite: sigue la siguiente
candidata o el `procedural` del estado (p. ej. `emotional` → silencio).

### La tabla (`data/music/director.json`)

```jsonc
"partII": {
  "explore": { "tracks": ["liky_fight.explore", "te_odio.explore"], "pick": "rotate", "procedural": "island",
               "fade": 2.5, "quantize": "bar", "loop": true, "ambience": "wind", "stinger": "discovery",
               "prefetch": ["battle"] }
},
"contexts": { "explore:corona": { "tracks": ["hemkade.ambient"] } }   // setState('explore', { context: 'corona' })
```

`pick`: `first` (por defecto) · `rotate` (la siguiente cada vez que se entra al estado) · `random`.
`ambience`/`stinger`: se disparan al ENTRAR al estado (solo si la entrada los nombra). `prefetch`: estados
probables después (se precarga su pista).

## Reproductor

- **stream** (por defecto): `HTMLAudioElement` (`preload` solo al pedirla) → `MediaElementSource`. Poca
  memoria. Loop = archivo completo. La posición se ancla al reloj de audio (suavizada, se re-ancla al
  buscar o al atascarse la red).
- **buffer**: `fetch` + `decodeAudioData` → `AudioBufferSourceNode`. Inicio a precisión de muestra
  (`start(when)`) y loop sin costura en los puntos de loop. Se usa con `sync: true` o con loop cuyo fin
  sea ≤ 150 s (`LOOP_BUFFER_MAX_SEC`). Un buffer en loop se **recorta** a su fin de loop. El buffer se
  libera en cuanto el deck se detiene (medido: 91 MB → 0, recogido por el GC).
- Memoria de referencia: ≈ 23 MB por minuto estéreo decodificado (48 kHz).
- Como máximo **un deck actual + uno saliendo**. Un tercer pedido mata al que salía (80 ms).
- **Cuantización**: el siguiente compás/beat del deck ACTUAL (mapa de beats, con loops) a ≥ 0.1–0.2 s;
  nunca espera más de 8 s. Los buffers entran exactamente en el compás; los streams con ±10 ms
  (el `play()` de un elemento no es exacto; el crossfade lo cubre).
- **Crossfade** de potencia constante (curvas seno/coseno).
- La Fonoteca reproduce siempre en stream («repetir esta» repite la canción completa).

### Reloj, latencia y eventos

- `audibleNow()` = tiempo del contexto que se está OYENDO: `getOutputTimestamp()` (+ el tiempo
  transcurrido desde su `performanceTime`), o `currentTime − (outputLatency + baseLatency)`.
- `BeatScheduler.tick(u)` recibe la posición desenrollada que se oye y dispara lo que cae en
  `(yaDisparado, u + lookahead]` (lookahead ≈ 1 frame). Esa ventana solo avanza → **ningún evento se
  dispara dos veces** (jitter, dos fuentes de tick, tiempo que retrocede).
- Ticks: `requestAnimationFrame` (pestaña visible) + un `setInterval` de 100 ms (sigue en segundo plano,
  aunque el navegador lo frene).
- Huecos grandes (FPS bajos, pestaña congelada): beats/compases/golpes con > 250 ms de retraso se
  **saltan**; de las secciones cruzadas llega solo la última (es el estado actual); marcadores y
  `voice:*` llegan todos, en orden, con `late` (máx. 16 por tick). Un hueco de horas escanea solo los
  últimos 120 s.
- Medido en Chrome (headless, GPU real): eventos disparados 4–15 ms tras volverse audibles; intervalos
  de beat exactos (0.4587 s a 131 BPM); bloqueo del hilo principal de 2.5 s → beats saltados, cero
  duplicados.

## Ambientes y stingers

Camas procedurales (ruido rosa/marrón en buffers de 4 s compartidos + filtros + LFOs lentos + eventos
sueltos): `sea` (oleaje que respira ~11 s + espuma), `wind`, `rain` (gotas), `storm` (lluvia densa,
retumbo y truenos cada 9–22 s), `cave` (dron + gotas con eco de piedra), `night_astral` (acorde
pentatónico de cristal que respira + aire + destellos con eco). Una cama a la vez + la que sale.
Archivo en vez de procedural: `director.json › ambienceFiles: { "sea": "music/amb/sea.m4a" }`.

Stingers en el bus de música (bajan la música −4 dB mientras suenan). Archivo:
`director.json › stingers: { "reveal": { "file": "music/x.m4a", "gain": 0.8 } }`.

## Invitación al sonido

`audioInvite()` / `ensureAudioInvited(): Promise<'on'|'off'>` (`audio/invite.ts`). OPENING la llama
justo antes del primer gran momento audiovisual de la Parte II.

- No aparece si el sonido ya está encendido (contexto corriendo, sin silencio, GENERAL y MÚSICA > 4 %).
- Aparece **una vez en la vida** (`settings.soundInvite`); dos llamadas simultáneas comparten tarjeta.
- Tarjeta de papel: Canelo con una oreja que se mueve, el brillo de un farol, «Hay cosas que solo se
  escuchan.», **ENCENDER EL SONIDO** / **SEGUIR EN SILENCIO** (Esc = silencio). Encender quita el
  silencio, sube GENERAL/MÚSICA si estaban casi en cero y reanuda el `AudioContext` dentro del clic.

## Fonoteca

- Estado: `G.s.ext.music = { unlocked: { [ref]: { at, source } }, favorites, islandTrack, toasted, prefs: { shuffle, repeat }, last }`.
  `ref` = `'cancion'` o `'cancion.variacion'`. `state/migrate.ts › normalize()` lo repara en cada carga
  (`musicSave.ts`, pura): nunca se pierde un desbloqueo, ids desconocidos se conservan.
- **Espejo** fuera de la partida (`localStorage['nolc-fonoteca']`, unión): al cargar una partida de la
  Parte II se mezcla de vuelta. Así la colección sobrevive al reinicio narrativo, a restaurar un
  respaldo viejo o a una partida nueva que vuelva a llegar a la Parte II. ETERNO no la toca (solo pone en
  0 oro, gemas, pescaditos, boletos y fichas). **MIGRATION: no borres `ext.music`.**
- `unlockSong()` guarda en el acto (solo si hay partida cargada), dispara el stinger `unlock` y la
  animación del disco (una vez por canción; una versión nueva de una canción ya obtenida = toast normal).
- Panel: lista (ocultas = «???» + la pista `hint` de `tracks.json`, o «Se encuentra en la Parte II»),
  portada dibujada (`cover.palette`/`cover.motif`: el motivo se interpreta por palabras —carpa, ola,
  guantes, corazón partido, lluvia…—; uno desconocido igual da una composición estable), dónde se
  obtuvo y cuándo, BPM/tono/ánimos, versiones (solo las desbloqueadas), favorita, **Música de la isla**,
  mezclar, anterior, reproducir/pausa, siguiente, repetir (todas / esta / no), barra con búsqueda,
  volumen (= MÚSICA de Ajustes) y el contador «2/6».
- Entrada: botón **FONOTECA** en la barra inferior del HUD, solo en la Parte II y con ≥ 1 canción (aparece
  con «¡NUEVO!»). La Parte I no ve nada.

## Carga, red y caché

- En el título no se pide ninguna canción (verificado). `tracks.json` va en el bundle (pequeño); los
  mapas de beats son chunks perezosos; los archivos se piden al reproducirse.
- **Nunca se pide un archivo que no esté en `tracks.json`**: una ref sin variación listada no resuelve.
- `prefetch` de los estados probables (`prefetch` en la tabla) y de una pista escuchada ≥ 20 s (solo con
  service worker): así queda completa en caché y se vuelve a oír sin conexión.
- `public/sw.js`: caché **`nolc-music`** (sobrevive a los deploys).
  - GET normal: stale-while-revalidate, revalidando como mucho una vez al día por archivo.
  - **Range** (un `<audio>` en streaming): si el archivo completo está en caché → 206 recortado
    (`Content-Range`, sufijos, 416 fuera de rango); si no → a la red tal cual (nunca se cachea una parte
    ni se convierte en 200). Verificado: reproducir + buscar a 2:00 a través del worker.

## Cómo…

- **Agregar una canción**: MUSIC la pone en `public/music/<id>.m4a` + `tracks.json` + `beatmaps/<id>.json`.
  Aparece sola en la Fonoteca (oculta hasta `unlockSong`). Para que suene en un estado: agrégala a
  `director.json`.
- **Agregar una variación**: entrada en `variations` (`{ id: '<id>.ambient', kind: 'ambient', file }`).
  Ref: `'<id>.ambient'` (por id o por `kind`). Con `loop` propio y fin ≤ 150 s, loop sin costura.
- **Agregar/ajustar un estado**: `MusicState` en `api.ts` (si es nuevo) + `partI` (su humor procedural)
  + `partII` en `director.json`.
- **Contexto por región**: `setState('explore', { context: 'corona' })` + `contexts["explore:corona"]`.
- **Stinger**: receta en `audio/stingers.ts › STINGERS` o archivo en `director.json › stingers`.
- **Escena sincronizada**: `audioApi.cue('liky_fight', { sync: true, quantize: 'now' })`, luego
  `audioApi.on('hit:snare', …)`, `audioApi.trackTime()`, `await audioApi.beatMap()`; al final `release()`
  (o se suelta sola al cambiar de estado si no es narrativa).

## Herramientas (solo DEV)

`window.__audio`: `status()` (contexto, latencias, director, decks, ducks, memoria, scheduler),
`decks()`, `trace(true)` / `traced()` (cada evento entregado: comprobar duplicados), `unlock(id, fuente)`,
`invite()`, `fonoteca()`, `setCatalog(tracks, maps)` (catálogo de prueba), `director`, `player`,
`ambience`, `mem`.

## Pruebas

`tests/audio.test.ts` (vitest, node con AudioContext simulado): resolución de la tabla (Parte I intacta,
candidatas, prioridades, contextos, rotación), cuantización con loops, el scheduler (60 fps, jitter y
tiempo hacia atrás, hueco de 12 s, loops de horas, cue a media canción, hits y voz), migración de
ajustes, la invitación una sola vez, la Fonoteca (idempotencia, celebración una vez, guardar → cargar →
normalizar, formas rotas reparadas, espejo) y el director con estado (cue no narrativo vs narrativo,
release, Parte I sin tocar).

Headless (Chrome real): ajustes (5 sliders) e invitación sin desbordes a 1600×900, 1600×1100 y 1280×960;
Fonoteca con desbloqueo de prueba (animación, HUD, panel, reproducir, buscar, cerrar → vuelve la
música de la isla); crossfade con ≤ 2 decks audibles; ducking −6 dB durante `say()` y regreso;
liberación de buffers; service worker con rangos.

## Limitaciones conocidas

- Un stream entra en el compás con ±10 ms (los cues que necesitan precisión usan `sync: true`).
- Un stream en loop repite el archivo entero, no los puntos de loop (para eso, buffer ≤ 150 s).
- La música procedural de la Parte I (y su planificador de 25 ms) sigue igual, incluida su sensibilidad
  a pestañas en segundo plano.
- La barra inferior del HUD con 11 botones casi toca el botón RECOLECTAR TODO cuando este se ve (solo
  antes del Banco + cosecha automática; en la Parte II casi nunca).
- Sin Web Audio el juego queda en silencio y nada lanza errores.
