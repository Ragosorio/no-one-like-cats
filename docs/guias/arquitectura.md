# Mapa de la arquitectura (o: dónde vive cada gato)

Bienvenida, bienvenido. Si llegaste aquí es porque quieres meterle mano a NO ONE LIKE CATS y no sabes
por dónde empezar. Tranqui: el código es grande, pero tiene un orden. Esta guía es el mapa del barco.
No explica cada tornillo; te dice en qué cubierta está cada cosa y quién le habla a quién.

Todo el juego vive en `game/` (TypeScript + PixiJS v8 + GSAP + pixi-filters, y three.js para las islas 3D de la
Parte II, empaquetado con Vite y probado con vitest). Cuando esta guía dice `src/...` se refiere a `game/src/...`.

Guías hermanas, para cuando ya sepas qué quieres hacer:

- [Agregar un gato](agregar-gato.md)
- [Agregar un elemento](agregar-elemento.md)
- [Agregar historia](agregar-historia.md)
- [Agregar un barco](agregar-barco.md)
- [Animaciones](animaciones.md)
- [Rutas de desarrollo](rutas-de-desarrollo.md)
- [Cines y estados del mundo](cines-y-estados.md)
- [Agregar un Momento musical](agregar-momento.md)
- [Dimensiones y gateras](dimensiones-y-gateras.md)
- [Cómo sacar una actualización sin romper partidas](../ACTUALIZACIONES.md)
- [Los repositorios y el arte](../REPOSITORIOS.md)
- [Motor y plataformas](../MOTOR-Y-PLATAFORMAS.md)
- [Cómo contribuir](../../CONTRIBUTING.md)

---

## 1. Las capas, en un dibujo

```
  content.json + módulos de cada parte / balance.json   (datos: gatos, misiones, números)
                        │
                        ▼
              data/content.ts · state/econ.ts  (acceso tipado + fórmulas puras)
                        │
                        ▼
   state/game.ts (G) ◄── state/sys/*  ◄── state/ext/*   (reglas del juego + ayudantes de UI)
     │  tick, timers, save/load          │
     │  G.emit('res' | 'catAdded' ...)   │ registran timers, tickers, recomputes
     ▼                                   ▼
   app/flow.ts · battleFlow.ts · story.ts · storyFlow.ts   (pegamento entre escenas)
                        │
                        ▼
   scenes/*  (una a la vez)   panels/* (modales)   ui/* (kit)   fx/* · art/* · island/* · battle/*
                        │
                        ▼
   core/scenes.ts (SceneManager) ──► core/App.ts (Pixi, caja lógica 1920x1080)
```

La regla de oro: **los datos bajan, los eventos suben**. Las escenas y paneles leen `G.s` y llaman
funciones de `state/sys/*`; los sistemas nunca importan escenas. Las escenas tampoco se importan entre
sí: para ir de una a otra se pasa por `src/app/flow.ts`.

---

## 2. Tour por `game/src/`

| Carpeta | Qué hay | Archivos que conviene abrir primero |
|---|---|---|
| `app/` | Navegación y orquestación entre escenas (el pegamento). | `flow.ts`, `battleFlow.ts`, `story.ts`, `storyFlow.ts`; Parte II: `formsFlow.ts`, `oleada2Flow.ts`… `oleada4Flow.ts`, `o4Finale.ts`; Parte III: `cajasFlow.ts`, `gaterasFlow.ts` |
| `art/` | Arte de gatos en código: SVG hechos con [MAI SVG](https://github.com/Ragosorio/MAI-SVG) + mallas deformables. | `livingCat.ts` (gatos vivos con rig), `puppetCore.ts` (el núcleo que comparten 2D y 3D), `catArt.ts` (carga `cats-svg/` y `cats-svg/lite/`), `artBase.ts` / `artPaths.ts` / `artShardPins.ts` (de dónde se sirve el arte, ver [REPOSITORIOS.md](../REPOSITORIOS.md)), `temperament.ts` / `intent.ts` (animaciones con propósito), `tint.ts`, `textures.ts` |
| `audio/` | El motor de audio de la Parte II: catálogo de pistas, director adaptativo, capas, remates, Fonoteca e invitación al sonido. | `engine.ts`, `api.ts` (`audioApi`), `catalog.ts`, `director.ts`, `fonoteca.ts` |
| `battle/` | Combate: simulación pura, IA, vista, mar, cielo, jefes. | `sim.ts` (lógica determinista sin render), `autoplay.ts` (IA contra IA, la usan los scripts de balance), `ai.ts`, `hud.ts`, `anime/` (barcos estilo anime), `boss/rigs.ts` |
| `cine/` | Escenas declarativas: cámara, mundo, gatos, sonido, diálogo. Ver [cines-y-estados.md](cines-y-estados.md). | `types.ts`, `runner.ts`, `registry.ts`, `scenes/*.ts` |
| `core/` | El motor de casa: app, escenas, eventos, guardado, El Baúl, audio, PWA. | `App.ts`, `scenes.ts`, `events.ts`, `save.ts`, `vault.ts` (El Baúl), `updates.ts`, `pwa.ts`, `settings.ts`, `audio.ts` (efectos sintetizados), `music.ts` (la música procedural de la Parte I), `rng.ts`, `format.ts`, `safety.ts` |
| `data/` | Contenido y balance en JSON + accesos tipados. | `content.json`, `rupturas/*.json` (Parte II), `gateras/*.json` (Parte III), `mergeContent.ts`, `balance.json`, `content.ts`, `catRigs.json`, `music/` (pistas, batallas, director, mapas de pulsos), `podio.json`, `glossary.ts`, `updates.ts` |
| `dev/` | Utilidades solo para desarrollo. | `devBattle.ts` (la batalla de `?scene=battle`), `devMusicBattle.ts`, `overflowAudit.ts` (`__overflow()`) |
| `engine/` | El motor 3D de las regiones (three.js): mundo, océano, cielo, clima, cámara, vida y los gatos de papel en 3D. | `world/World3D.ts`, `world/paperCat.ts`, `life/director.ts` |
| `fx/` | Jugo visual: shake, partículas, filtros y secuencias grandes. | `juice.ts`, `particles.ts`, `filters.ts`, `sequences/` (`catReveal`, `gachaSummon`, `starUp`, `victoryNews`...) |
| `island/` | La isla isométrica: terreno, cámara, gatos paseando, decoración, dimensiones, la noche. | `iso.ts`, `camera.ts`, `catActor.ts`, `worldUi.ts`, `archipelago.ts`, `views/`, `dimensions/`, `chatter/`, `night/` (el escenario de cine `island`) |
| `momentos/` | Los Momentos musicales: núcleo puro, kit de anime y una carpeta por canción. Ver [agregar-momento.md](agregar-momento.md). | `index.ts` (`playMomento`), `score.ts`, `runner.ts`, `anime/`, `songs/` |
| `panels/` | Paneles modales que se abren encima de la isla o el mapa. | `CatPanel.ts`, `Shipyard.ts`, `Sanctuary.ts`, `Kingdom.ts`, `Fonoteca.ts`, `Replays.ts` (VOLVER A VER), `Bitacora.ts`, `casino/`, `shop/`, `island/`, `podio/` |
| `podio/` | Los duelos 1 contra 1 del Podio: motor, arena, escalera, poderes. | `engine.ts`, `ladder.ts`, `powers.ts` |
| `regions/` | Las islas 3D de la Parte II, una por archivo, y su registro. | `index.ts` (`REGION_IDS`), `paginas.ts`, `nacar.ts`, `cometa.ts`… |
| `rupturas/` | La porción vertical aislada de la Parte II (`rupturas.html`): nunca toca la partida. | `main.ts` |
| `scenes/` | Pantallas completas (una activa a la vez). | `TitleScene.ts`, `IslandScene.ts`, `MapScene.ts`, `BattleScene.ts`, `RegionScene.ts`, `PodioScene.ts`, `GaterasMapScene.ts`, `CajaScene.ts` |
| `state/` | Estado del juego, reglas, guardado, migraciones. | `game.ts`, `index.ts`, `econ.ts`, `sys/`, `ext/`, `migrate.ts`, `patches.ts` |
| `ui/` | Kit de interfaz: botones, textos, modales, toasts, íconos, HUD, diálogos, guiones de historia. | `widgets.ts`, `theme.ts`, `modal.ts`, `icons.ts`, `elementIcon.ts`, `dialog.ts`, `saveGuard.ts`, `hud/`, `story/` |
| `workers/` | Trabajo fuera del hilo principal. | `estimate.worker.ts` (la estimación de victoria) |

Fuera de `src/` también hay cosas útiles: `game/public/` (SVGs de gatos, íconos, arte de historia, música,
`sw.js`, manifest), `game/test-saves/` (partidas de prueba para `?save=`), `game/tests/` (vitest),
`game/scripts/verify-missions.ts` (revisa las misiones sin navegador), `game/scripts/art-publish.ts` (el sitio
de arte) y `game/rupturas.html` (la porción vertical aislada de la Parte II).

---

## 3. El arranque: `src/main.ts`

`main.ts` es corto y vale la pena leerlo entero. En orden, `boot()` hace esto:

1. `loadSettings()` (ajustes del jugador, guardados aparte de la partida).
2. `loadFonts()`: espera las fuentes de `F` (ver `ui/theme.ts`), **pero máximo 4 segundos**. Un CDN lento
   no tiene derecho a dejarte mirando una pantalla negra:
   ```ts
   await Promise.race([all, new Promise((r) => setTimeout(r, 4000))]);
   ```
3. `game.init(...)` (crea Pixi), `preloadElementIcons()`, `scenes.init()`.
4. `initPwa()` (service worker, botón INSTALAR), `initUpdates()` (cartel de versión nueva), `initSaveGuard()`
   (una sola pestaña escribe la partida; El Baúl), `mountMicroOverlay()`, `applyAudioSettings()`, `installAudio()`
   (el motor de audio de la Parte II), `initStory()` (escucha eventos de `G` para la historia), `initForms()`,
   `initOleada2()`, `initOleada3()`, `initOleada4()` (los flujos de la Parte II) e `initCajas()` (la Parte III).
5. El **reloj de la economía**: un `Ticker` de Pixi que avanza `G.tick()` siempre que haya partida cargada.
   ```ts
   Ticker.shared.add((t) => {
     if (G.s.cats.length) G.tick(Math.min(1000, t.deltaMS) * speed);
   });
   ```
6. Guardado de emergencia en `beforeunload` y en `visibilitychange` (cuando la pestaña se oculta). Lo
   segundo importa porque en el celular `beforeunload` casi nunca llega: el sistema mata la app y ya.
7. Rutas de la URL (abajo) y por defecto `goTitle()`.

### Rutas de la URL

`route()` en `main.ts` lee `?scene=` y los demás parámetros. La lista completa, con partidas de prueba y capturas sin
pantalla, está en [rutas-de-desarrollo.md](rutas-de-desarrollo.md). En resumen:

| Parámetro | Qué hace | ¿Solo en dev? |
|---|---|---|
| (nada) | El juego de verdad: pantalla de título. | no |
| `?scene=island` / `?scene=map` | Carga la partida (`bootGame()`) y salta directo a la isla o al mapa. | no |
| `&new=1` | Junto con `island`/`map`: empieza partida nueva (`newGame()`). Reemplaza la partida guardada. | sí |
| `?scene=dev`, `?dev=1` | El LABORATORIO (`scenes/DevLab.ts`, lista `LABS`) y su botón en el título. | no |
| `?scene=catlive`, `fxlab`, `art`, `shiplab`, `sandbox`, `battle`, `islandlab` | Los laboratorios. | no |
| `?scene=battle&music=liky_fight` | La batalla musical de prueba. | sí |
| `?scene=region&region=<id>` | Una isla 3D de la Parte II (`regions/index.ts › REGION_IDS`). | sí |
| `?scene=cajas` / `?scene=caja&set=bar\|calle` | La Carta de las Cajas y el set de una dimensión (Parte III). | sí |
| `?momento=<id>` / `?momento=lab` | Un Momento musical suelto / el laboratorio del tratamiento. | sí |
| `?save=<fixture>` | Copia `game/test-saves/<fixture>.json` a la ranura de guardado y limpia el parámetro. | sí |
| `?stage=2-9` | Carga la partida y entra directo a la batalla de campaña zona 2, etapa 9. | sí |
| `?speed=4` | El reloj de la economía corre 4 veces más rápido (las batallas no). | sí |
| `?realtime=1` | GSAP sigue el reloj real aunque la pestaña esté en segundo plano (pruebas headless). | sí |

En dev también quedan colgados `window.__gsap`, `window.__scenes` y `__overflow()`; siempre, `globalThis.__G`,
`__story` y `__cine` para hurgar desde la consola.

---

## 4. Render: la caja de 1920x1080

### `core/App.ts`

Todo se diseña en una **caja lógica de 1920x1080** (`W` y `H`). `GameApp.fit()` escala `root` para que la
caja quepa en la ventana y la centra:

```ts
this.scale = Math.min(sw / W, sh / H);
...
this.view = { x: -ox / this.scale, y: -oy / this.scale, w: sw / this.scale, h: sh / this.scale };
```

`game.view` es **toda la pantalla visible en coordenadas lógicas**. En una pantalla más ancha que 16:9,
`view.x` es negativo y `view.w` es mayor que 1920. Para no tener barras negras, las escenas pintan su
fondo (o muestran más mundo) hasta `game.view`. Si algo tuyo tiene que reaccionar al resize, usa
`game.onView(fn)` (devuelve la función para desuscribirte).

### `core/scenes.ts`

- `Scene` es la clase base: `enter()` (ya está en el stage), `exit()` (antes de destruirla),
  `update(dt)` (dt en segundos, máximo 0.05) y `bleed`.
- `bleed` decide qué se ve fuera de la caja de diseño: un color (con textura de papel) o `null` cuando la
  escena dibuja su propio mundo hasta el borde. Hoy solo `BattleScene` lo pone en `null` (el mar se
  extiende solo); el resto usa el papel por defecto.
- `scenes` (el `SceneManager`) tiene tres capas, en este orden de abajo hacia arriba:
  `sceneLayer` (la escena actual), `overlayLayer` (modales, diálogos de historia) y `fxLayer`
  (transiciones, toasts, cartel de actualización). Debajo de todo está `backdrop`, que pinta el `bleed`.
- `scenes.go(next, transition)` cambia de escena con `'blocks'` (franjas diagonales, el default),
  `'iris'` o `'none'`. Llama `exit()` y destruye la escena anterior. Si ya hay una transición en curso,
  ignora la nueva llamada.

### Escenas (`src/scenes/`)

| Escena | Qué es |
|---|---|
| `TitleScene` | Pantalla de título: continuar / partida nueva. |
| `PrologueScene` | Beat b00, "EN ALGÚN MOMENTO DEL FUTURO...": el prólogo de mantener y soltar. |
| `IslandScene` | La isla isométrica: hábitats, granjas, expansiones, edificios y HUD. |
| `MapScene` | DIARIO DEL MAR: mapa de zonas y etapas de la campaña. |
| `BattleScene` | La batalla de barcos (recibe un `BattleSpec`, devuelve un `BattleResult`). |
| `ResultsScene` | Portada de periódico de victoria o la derrota noir con análisis del jefe. |
| `CasinoScene` | Casino "El Gato Negro": tragamonedas, ruleta, portal (gacha), La Caja, accesorios. |
| `PodioScene` | Los duelos 1 contra 1 del Podio. |
| `RegionScene` | Una isla 3D de la Parte II (three.js en su propio canvas); es el escenario de cine `region`. |
| `GaterasMapScene` | La Carta de las Cajas, el segundo mapa (Parte III). Ver [dimensiones-y-gateras.md](dimensiones-y-gateras.md). |
| `CajaScene` | La escena 2D de una dimensión (Parte III); es el escenario de cine `caja`. |
| `DevLab` | LABORATORIO, el índice de labs. |
| `ArtLab`, `CatLiveLab`, `FxLab`, `ShipArtLab`, `BattleSandbox`, `IslandSandbox` | Laboratorios de desarrollo (ver rutas). |

### La batalla en pantalla ES la simulación

`BattleScene` no decide nada: llama a `Battle` (`battle/sim.ts`) y anima los eventos que devuelve. La
estimación de victoria (`state/sys/estimate.ts`) juega la misma pelea sin pantalla con `autoBattle`
(`battle/autoplay.ts`). Para que las dos den lo mismo:

- Toda decisión de IA (gatos enemigos, cañones automáticos de los dos lados, runas de tinta) saca su
  ruido de `aiSeed` (`autoplay.ts`), nunca de `Math.random`. Misma semilla de batalla + mismos tiros
  del jugador = la misma batalla, llamada por llamada.
- El blanco de la andanada es `volleyAim` (el PRIMER impacto del turno sobre el enemigo), igual en
  los dos lados.
- `Math.random` en la escena solo para cosas que no tocan el `Battle` (partículas, tono de sonidos).
- Si agregas una regla, va en `sim.ts` (o un módulo que `sim.ts` llame), nunca en la escena.
- Ejemplo de regla en su propio módulo: los **CATACLISMOS** de las zonas 4–6 (`battle/cataclysm.ts`:
  lluvia de meteoritos, la luna, el sol, la marea negra). `Battle.startTurn` los avisa y los hace caer,
  `integrate` marca el tiro que cruza su SELLO, y la escena solo los escenifica desde la cola `queued`
  y los eventos `{ k: 'cata' }` (`battle/cataFx.ts`). Sus posiciones salen de una semilla propia
  derivada de la del combate, así que no mueven los dados del resto de la pelea.

Prueba de paridad (sin pantalla visible): crear la escena con `spec.seed = S`, jugar el lado del
jugador con `decide(..., aiSeed.cat(sim, 0, k))` y comparar cada `startTurn`/`fire`/`endTurn` con
`autoBattle(spec, perfil, S)`: deben ser idénticos.

### Los flujos (`src/app/`)

- `flow.ts`: `goTitle()`, `goIsland()`, `goMap()`, `goBattle(zone, stage)`. Importa las escenas con
  `import()` perezoso para que cada una cargue cuando hace falta. **Si una escena o panel necesita
  navegar, importa de aquí, nunca otra escena.**
- `battleFlow.ts`: campaña = (pre-batalla) → puerta de reparación → `BattleScene` → `applyResult` →
  `ResultsScene`. También los Encargos. Además instala un "conserje" de tweens huérfanos.
- `story.ts`: `maybeIntro(info)` decide si toca prólogo, isla, "Mientras no estabas..." o NOVEDADES.
  `initStory()` escucha `mission`, `klUp`, `res` y `element` y va soltando los beats de historia cuando
  la isla o el mapa están tranquilos (nunca en medio de una batalla).
- `storyFlow.ts`: batallas de historia (`startStoryBattle`) y las secuencias de "nuevo elemento" y
  "nuevo gato" (`revealElement`, `revealCat`).
- Parte II: `flow.ts › goRegion(id)` (las islas 3D), `formsFlow.ts` (cuando se desbloquea una forma de Canelo),
  `oleada2Flow.ts`, `oleada3Flow.ts`, `oleada4Flow.ts` y `o4Finale.ts` (lo propio de cada oleada).
- Parte III: `cajasFlow.ts` (la Carta de las Cajas y sus batallas) y `gaterasFlow.ts` (las escenas de una dimensión).

---

## 5. El estado: `G`, la memoria del reino

### `state/game.ts`

Aquí viven `GameState` (la forma de la partida guardada), `defaultState()` (una partida vacía) y `G`,
la única instancia de `Game`. `G.s` es el estado; todo lo demás son métodos para tocarlo bien:

- Recursos: `G.add('gold', n, source)`, `G.can(cost)`, `G.spend(cost)`, `addCrystals`, `addOrbs`.
- Contadores y banderas (las misiones los leen): `G.count(key)`, `G.flag(key)`, `G.has(key)`. La
  primera vez que una bandera se prende emite `unlock`.
- Timers verdes: `G.startTimer(kind, ref, ms, label, affinity)`; cada sistema registra qué pasa al
  terminar con `G.onTimer(kind, fn)` (por ejemplo `state/sys/island.ts` registra `'build'`, `'crop'`,
  `'expansion'`...).
- Ronroneo (`G.purr`), momentum (`G.bump`), XP del reino (`G.xp`).
- `G.tick(dtMs)`: avanza timers, corre `G.tickers` y **autoguarda cada 10 segundos**.
- `G.offline(ms)`: lo mismo pero para el tiempo que estuviste fuera (corre `G.offliners`).
- `G.load()` / `G.save()` / `G.reset()`. `G.save()` se niega si la partida en disco es de un build más
  nuevo (`newerSave`) o si se está restaurando un respaldo (`saveLocked`).

Los sistemas se enganchan a `G` registrándose al importarse: `G.tickers.push(...)`,
`G.offliners.push(...)`, `G.recompute.push(...)` (valores derivados como oro por segundo) y
`G.afterLoad.push(...)` (cosas que necesitan una partida cargada, como los parches).

### `state/index.ts`

Importa todos los sistemas por efecto secundario (así se registran) y expone `newGame()` y
`bootGame()`. `bootGame()` carga, aplica el tiempo offline si pasaron más de 5 segundos, recalcula y
revisa misiones. Si no había partida, crea una.

### `state/econ.ts`

Fórmulas puras de economía sobre `balance.json` (`BAL`): oro por gato, costo de alimentar, orbes por
estrella, Ronroneo, momentum, XP. Sin efectos secundarios: entra número, sale número.

### `state/sys/` (las reglas)

| Archivo | Una línea |
|---|---|
| `cats.ts` | Adoptar, duplicados a orbes, alimentar (4 ÑAM por nivel), estrellas, Catdex. |
| `island.ts` | Hábitats con oro y buffer, muelle de pesca, expansiones, producción offline. Tiene su propio `islandBus`. |
| `ship.ts` | Barcos, Mk por familia, astillero, tripulación, Poder de Barco, editor de plano. |
| `campaign.ts` | Zonas y etapas, armado de batallas, recompensas, jefes, reparaciones, Encargos. |
| `storyBattles.ts` | Batallas únicas del Capítulo 1 (Raijin, el Heraldo, la Grieta...). |
| `missions.ts` / `missionGoals.ts` | Evaluador de misiones / catálogo puro de metas (lo usa `scripts/verify-missions.ts`). |
| `resonance.ts` | Resonancia: dos gatos invocan otro, con probabilidades exactas y visibles. |
| `secrets.ts` | Los secretos escondidos en cada expansión. |
| `workforce.ts` | Gatos trabajadores, expediciones, cola de resonancia. |
| `gear.ts` | Reliquias (de flota) y artefactos (por barco). |
| `ranks.ts` | Rangos por K.O. de cada gato (Bronce, Plata, Oro). |
| `micro.ts` | Microeventos de 30 s a 3 min con reloj rojo; ignorarlos no castiga. |
| `decor.ts` | Decoración de la isla (baúl y colocados). Tiene su propio `decorBus`. |
| `shop.ts` | Precios y compras de la Tienda (solo oro y gemas ganadas jugando). |
| `casino.ts` / `gacha.ts` / `accessories.ts` | Casino honesto, portal con pity visible, accesorios con bonos chiquitos. |
| `estimate.ts` | Probabilidad de victoria honesta: simula la etapa con tu barco real varias veces. |
| `podio.ts` | El Podio: desbloqueo (después del Jefe 1), escalera, nivel de Podio por gato, premios de campeón. |
| `grietas.ts` / `finale.ts` | Las Grietas del Multiverso (los 6 elementos de después de la historia) y el final de la Parte I. |
| `simulacro.ts` | El Simulacro: tu flota repite en segundo plano la mejor etapa que ya ganaste. |
| `worldState.ts` | Estados del mundo derivados de la historia ([cines-y-estados.md](cines-y-estados.md)). |
| `rupturas.ts`, `rupturasO2.ts`, `rupturasO3.ts`, `rupturasO4.ts`, `rupturasO4Battles.ts` | La Parte II por oleadas: batallas de historia, banderas, sistemas y estados del mundo de cada una. |
| `rupturasReset.ts` / `rupturasLedger.ts` | El reinicio narrativo de la Parte II y el registro de premios ya cobrados (nunca se pagan dos veces). |
| `forms.ts` | Las formas de Canelo (datos en `data/rupturas/formas.ts`). |
| `storyScale.ts` | Cómo escala una batalla de historia con tu tripulación. |
| `ecos.ts`, `olvidada.ts`, `suenosDream.ts` | Sistemas de la Oleada 4 de la Parte II. |
| `gateras.ts`, `gaterasBattles.ts`, `gaterasWorld.ts` | La Parte III: la Carta de las Cajas, sus batallas y sus estados del mundo ([dimensiones-y-gateras.md](dimensiones-y-gateras.md)). |

### `state/ext/` (ayudantes de UI)

Lecturas cómodas sobre `sys/` para cada módulo de pantalla, sin esquema persistente nuevo:
`campaign.ts` (datos de etapa, botín, memo entre mapa, batalla y resultados), `collection.ts`
(Resonancia, Catdex, Altar), `island.ts` y `islandM2.ts` (resúmenes para el HUD y la isla) y
`story.ts` (beats vistos, nombrar al primer gato, resumen offline).

### `state/migrate.ts` y `state/patches.ts`

`migrate.ts` cambia la **forma** de partidas viejas (`MIGRATIONS[v]`, `SAVE_VERSION`, hoy en 3) y
`normalize()` rellena lo que falte. `patches.ts` corre arreglos de **juego** una sola vez por partida
(`registerPatch({ id, why, run })`). El detalle completo, con sus reglas sagradas, está en
[ACTUALIZACIONES.md](../ACTUALIZACIONES.md). Léelo antes de tocar `GameState`.

---

## 6. Eventos, guardado y actualizaciones

### El bus (`core/events.ts`)

Un `Emitter` tipado y diminuto: `on(type, fn)` devuelve la función para desuscribirse y `emit(type, payload)`
llama a todos. `G` trae uno con los eventos de `GameEvents`:

`res`, `timerDone`, `timerProgress`, `catAdded`, `catLevel`, `klUp`, `purr`, `mission`, `unlock`,
`element`, `toast`, `beat`, `changed`, `saved`.

```ts
// escuchar (guarda la función de salida y llámala en exit())
this.unsub.push(G.on('catAdded', () => this.syncAll()));
// emitir (normalmente lo hace un sistema, no la UI)
G.emit('element', { id: 'magic' });
```

Así lo hace `IslandScene`: junta los `G.on(...)` en `this.unsub` y los suelta en `exit()`. Si olvidas
desuscribirte, tu escena muerta seguirá escuchando y alguien va a llorar en la consola.

### Guardado (`core/save.ts`)

La partida va a `localStorage` dentro de un sobre `{ version, savedAt, build, state }`:

- `nolc-save-v1`: la partida viva (el nombre es histórico; la versión real va dentro del sobre).
- `nolc-save-prev`: la última copia buena, rotada cada 5 minutos. Si la viva se rompe, se usa esta.
- `nolc-save-bak-<v>`: copia tomada justo antes de migrar desde la versión `<v>`. También existe
  `nolc-save-bak-borrada` (la última isla borrada) y `nolc-save-bak-broken-<fecha>` si una partida no
  se pudo abrir.

Si `localStorage` no está disponible, hay un respaldo en memoria. Exportar e importar viven aquí
también (`exportSave`, `importSave`); el panel está en `ui/backupsPanel.ts`.

Encima de eso está **El Baúl** (`core/vault.ts`): un historial en IndexedDB con resumen de cada copia, una carpeta
del jugador donde se escriben archivos `.nocat` (Chrome y Edge), descargar y abrir `.nocat`, y `storage.persist()`.
Dos candados contra pisar progreso: **una sola pestaña escribe** a la vez (Web Locks, `ui/saveGuard.ts`) y
`G.save()` **nunca guarda una partida con menos tiempo de juego** (`playMs`) que la que ya está en disco. Todo
código que reemplace la partida llama antes a `snapshot(motivo)`.

### Actualizaciones (`core/updates.ts`, `data/updates.ts`)

`core/updates.ts` pregunta a `version.json` cada 10 minutos (y al volver a la pestaña) si hay un build
nuevo; si lo hay, muestra un cartel que guarda y recarga. Nunca recarga solo mientras juegas. En el
servidor de desarrollo `BUILD_ID` es `'dev'` y no pregunta nada. `data/updates.ts` es la lista `UPDATES`
de NOVEDADES (la más nueva arriba, `id` con forma `YYYY-MM-DD-slug`, nunca se reutiliza). El panel que
las muestra es `ui/updatesPanel.ts`. Pipeline completo: [ACTUALIZACIONES.md](../ACTUALIZACIONES.md).

---

## 7. Paneles y kit de UI

### `panels/`

Un panel es una ventana modal sobre la isla o el mapa. Casi todos exponen una función `openAlgo()`:
`openCatPanel(uid)`, `openCatdex()`, `openAltar()`, `openSanctuary()`, `openShipyard()`,
`openKingdom()`, `openMissions()`, `openErrands()`, `openSettings()`. Los grandes tienen subcarpeta
(`casino/`, `shop/`, `shipyard/`, `campaign/`, `collection/`, `island/`, `kingdom/`, `errands/`).
Por dentro construyen un `Modal` y llaman `.open()`, que lo cuelga en `scenes.overlayLayer`.

### `ui/`

- `theme.ts`: la paleta `C` (papel, tinta, rosa, etc., como números hex) y las fuentes `F`
  (`F.poster` = Anton, `F.ui` = Space Grotesk, `F.comic` = Bangers...). También `RARITY`.
- `widgets.ts`: `txt()`, `poster()`, `Button`, `Panel`, `Bar`, `Counter`, `paperBg()`, `hitArea()`.
- `modal.ts`: `Modal` (fondo oscuro, póster de papel, franja de título, X y Escape para cerrar) y
  `toast(text, { icon, sub })`, un aviso que entra desde arriba en `fxLayer` sin bloquear.
- `icons.ts` (`icon(kind, size)`), `elementIcon.ts` (insignias SVG de elementos e `iconText()`, que
  convierte `{fire}` en una insignia en línea; nada de emojis en pantalla).
- `dialog.ts` (`say()`, `tip()`, `newspaper()` para Luzterna y compañía), `hud/` (el HUD de la isla),
  `story/` (créditos, recompensas, tarjeta de zona, perfil del jugador), `gender.ts` (`gtxt()` para
  español con género), `resourceBar.ts`, `micro/MicroOverlay.ts`.

Un panel mínimo se ve más o menos así:

```ts
const m = new Modal('Mi panel', 1200, 700).open();
m.body.addChild(txt('Hola, gato.', { fontFamily: F.ui, fontSize: 28, fill: C.ink }));
m.body.addChild(new Button('LISTO', () => m.close()));
```

---

## 8. Los datos

### `data/content.json`

El contenido de la Parte I (unas 19 500 líneas). Claves de primer nivel:

| Clave | Qué guarda |
|---|---|
| `meta` | Nombre del juego, capítulo, idioma, pantalla lógica. |
| `elements` | Los 13 elementos de la Parte I: id, nombre, desbloqueo, dimensión, paleta. |
| `affinity` | Tabla de ventajas entre elementos. |
| `materials` | Materiales de casco y sus multiplicadores por elemento. |
| `statuses` / `catStatuses` | Estados alterados de barcos / de gatos. |
| `reactions` | Reacciones entre elementos (y su entrada en el Grimorio). |
| `roles` / `workers` / `traits` / `mutations` | Roles de combate, trabajos, rasgos y mutaciones de gatos. |
| `cats` | Los 86 gatos de la Parte I. |
| `catdexSets` / `catdexTeaser` / `tintDecals` | Sets de colección, el gato teaser y decorados de variantes teñidas. |
| `resonanceRules` / `resonanceRecipes` / `secretRecipes` | Reglas, recetas y secretos de Resonancia. |
| `ships` / `modules` / `shipArt` | Barcos del jugador, módulos, reliquias, artefactos y su arte. |
| `volley` / `koSequence` / `aiDifficulty` | Reglas de la andanada, secuencia de K.O. y niveles de IA. |
| `enemyArchetypes` / `enemies` / `elites` / `bosses` | Enemigos por zona (con etapas), élites y jefes. |
| `missions` | Las 127 misiones de la Parte I en cadenas, con metas, disparadores y recompensas. |
| `events` | Microeventos y eventos relámpago. |
| `expansions` | Las 12 expansiones de la isla. |
| `automation` / `kingdomMilestones` | Automatizaciones por nivel de Reino y los hitos del 1 al 50. |
| `story` | Personajes, beats y textos de derrota. |

### Los módulos de cada parte

Las partes nuevas **no tocan** `content.json`: traen su contenido en módulos que `content.ts` une al cargar con
`mergeContent` (`data/mergeContent.ts`). La unión **solo agrega**: los arreglos se concatenan, los objetos se mezclan
por clave y un valor de la Parte I no se puede sobrescribir (en desarrollo y en las pruebas truena; en producción se
ignora con un aviso). Un `id` repetido también se rechaza: los ids son para siempre.

| Módulo | Qué agrega |
|---|---|
| `data/rupturas/especies.json`, `especies-o2.json`, `especies-o3.json`, `especies-o4.json` | Los 34 gatos de la Parte II, los elementos Cristal y Gravedad (con sus multiplicadores de material en `materialMult`), estados, reacciones, sets y recetas. |
| `data/rupturas/historia.json`, `historia-o2.json`, `historia-o3.json`, `historia-o4.json` | Las 35 misiones de la Parte II y sus beats. |
| `data/rupturas/formas.ts` | Las formas de Canelo. |
| `data/gateras/historia.json`, `data/gateras/regiones.json` | La Parte III: misiones de la porción vertical y la Carta de las Cajas. |

Con todo unido, hoy el juego tiene 120 gatos, 15 elementos y 166 misiones (162 publicadas y 4 de la Parte III en
desarrollo). `node scripts/verify-missions.ts --all` las revisa todas.

### El resto de `data/`

- `content.ts`: acceso tipado. `CATS`, `CAT_BY_ID`, `catDef(id)` (lanza error si el gato no existe),
  `ELEMENTS`, `ELEMENT_BY_ID`, `MISSIONS`, `MISSION_BY_ID`, `SHIPS`, `ZONES`, `BOSSES`, `BEAT_BY_ID`,
  `stageDef('2-9')`, `affinityMult()`, `materialMult()`...
- `balance.json`: todos los números (rarezas, gatos, resonancia, hábitats, combate, reino, Ronroneo,
  momentum, expediciones...). Se lee a través de `BAL` en `state/econ.ts`.
- `catRigs.json`: un rig por pintura (los 120 gatos, las 2 formas de Canelo, Luzterna y las pinturas nuevas en
  prueba), compactado desde MAI; lo consume `art/livingCat.ts`.
- `music/`: `tracks.json` (el catálogo de pistas), `battles.json` (planes de música por batalla), `director.json`
  (el director adaptativo) y `beatmaps/` (mapas de pulsos y ataques).
- `podio.json` (el Podio), `art-parte2.json` (pinturas nuevas por lote) y `glossary.ts` (el glosario).
- `chatter.ts`: las frases que sueltan los gatos en la isla (con su retractación cobarde incluida).
- `elementsMeta.ts`: nombres e íconos para mostrar elementos; la jugabilidad vive en `content.json`.
- `updates.ts`: NOVEDADES (ver arriba).

### Cómo fluye un dato

```
content.json + módulos ──► content.ts (mergeContent, CATS, catDef) ──► state/sys/* (reglas) ──► panels/* y scenes/*
balance.json ──► state/econ.ts (BAL + fórmulas) ──┘
```

La UI no hace cuentas de economía: le pregunta a `sys/` o a `econ.ts`. Si te encuentras escribiendo
una fórmula de oro dentro de un panel, detente, respira y muévela a `state/`.

---

## 9. Build y despliegue

- `game/vite.config.ts`: `base: './'` (rutas relativas, para que funcione en la subcarpeta de GitHub
  Pages), servidor en `127.0.0.1:5173`. Cada build de producción recibe un id (sha corto de git + hora
  UTC) que termina en tres lugares: `__BUILD_ID__` dentro del bundle, `version.json` junto a
  `index.html` y la URL del service worker `sw.js?v=<id>`. En `npm run dev` el id es `'dev'`.
- `game/public/sw.js`: navegación con red primero (siempre el build más nuevo) y caché si no hay
  internet; `/assets/*` caché primero, por build; `cats-svg/`, `story/` e `icons/` en una caché que
  sobrevive entre deploys; `version.json` jamás se cachea. Lo registra `core/pwa.ts`.
- `game/public/manifest.webmanifest`: app instalable, `lang: es-419`, pantalla completa, horizontal,
  ícono SVG.
- `.github/workflows/deploy.yml`: en cada push a `main`, Node 22, `npm ci`, `npm run build`, un
  **guardia que falla si encuentra PNG, JPG, WEBP o GIF en `dist/`**, y publica en GitHub Pages.
- **El arte pesado se sirve aparte.** Con la variable de repo `NOLC_ART_BASE_FULL` (que llega al build como
  `VITE_ART_BASE_FULL`), el plugin `nolc-drop-remote-art` de `vite.config.ts` saca de `dist/` los SVG completos y el
  juego los pide al sitio de arte (`Ragosorio/nolc-arte`). Antes del build, `scripts/art-publish.ts check` compara lo
  publicado con el commit. Sin variables, todo el arte va dentro de `dist/`. Detalle: [REPOSITORIOS.md](../REPOSITORIOS.md).

Plataformas, rendimiento y por qué elegimos este motor: [MOTOR-Y-PLATAFORMAS.md](../MOTOR-Y-PLATAFORMAS.md).

---

## 10. Convenciones de la casa

- **TypeScript estricto**: `"strict": true` en `game/tsconfig.json` (sin quejarse de variables sin usar).
  `npm run build` es `tsc --noEmit && vite build`: si no compila el tipado, no hay build. También está
  `npm run typecheck` para revisar sin empaquetar.
- **Comentarios de código en inglés; textos del jugador en español latinoamericano.** Algunos archivos
  viejos tienen comentarios en español (`state/sys/decor.ts`, `shop.ts`, `gear.ts`); lo nuevo, en inglés.
  Para textos con género usa `gtxt()` de `ui/gender.ts`.
- **Cero imágenes raster.** Todo el arte es SVG o se dibuja en código. ¿Por qué? Carga más rápido, se puede
  animar (los gatos se doblan como marionetas sobre su propia pintura) y no cuesta nada. El deploy lo
  vigila: un PNG colado tumba el build. Los efectos de sonido se sintetizan en código y la música de la Parte I es
  procedural; la música de la Parte II son archivos `.m4a` en `public/music/` (ver [agregar-momento.md](agregar-momento.md)).
- **Nada de emojis en pantalla.** Los elementos se muestran con `elementIcon()` / `iconText()`.
- **Las escenas no se importan entre sí**: se navega con `app/flow.ts`.
- **Los sistemas no conocen la UI**: emiten eventos y la UI escucha.
- **Desuscríbete y mata tus tweens en `exit()`**. Hay redes de seguridad (`core/safety.ts`,
  `island/safety.ts`, el conserje de `battleFlow.ts`) porque un solo tween sobre un objeto destruido
  congela todas las animaciones del juego. Las redes existen; no las pongas a prueba.
- **Nunca le quites nada a una partida.** Si cambias la forma de `GameState`, sigue
  [ACTUALIZACIONES.md](../ACTUALIZACIONES.md) al pie de la letra.

Y si algo de esta guía ya no coincide con el código, el código gana y la guía merece un arreglo. Bienvenida
la corrección: es lo más parecido a darle de comer a un gato.

---

## Piezas nuevas (2026-10-08)

- **Pantalla real**: `ui/screen.ts` (`screenRect`, `followView`, `paintScreen`). Todo lo que cubre "toda la
  pantalla" usa `game.view`, nunca `rect(0, 0, W, H)`.
- **Paneles reactivos**: `G.emit('cat', { uid, why })` cuando cambia un gato (nivel, estrellas, casa, nombre);
  `Modal.listen(G.on(...))` mantiene la suscripción viva lo que dure el modal.
- **Buscar gatos**: `state/ext/catQuery.ts` (lógica pura, sin tildes) + `ui/catFilterBar.ts` + `ui/searchField.ts`.
- **Ventajas por pelea**: `state/ext/matchup.ts`; selector completo `panels/campaign/CrewSelect.ts`.
- **Final de la historia**: `state/sys/finale.ts` (H29/H30) + `ui/story/finaleScript.ts`.
- **Victoria/derrota**: `battle/ui/endScreen.ts`.
- **Casino**: registro de juegos en `panels/casino/games/registry.ts`, reglas en `state/sys/casino/*`
  (ETERNO en `eterno.ts`, resolución idempotente).
- **Hábitats**: biomas en `island/habitats/`, tamaño por tier en `balance.json › habitats.tiers[].footprint`.
- **Rendimiento**: `core/pixiFixes.ts` (Pixi v8 no destruía el contexto de `Graphics` con `destroy({children})`;
  se importa primero en `main.ts`), `art/rasterCache.ts` (caché del navegador de gatos rasterizados, por build),
  `workers/estimate.worker.ts` (la ESTIMACIÓN fuera del hilo principal), `core/sliced.ts` (trabajo por cuadros).
- **Pruebas**: `npm test` (vitest, `game/tests/`).

## Piezas nuevas (Parte II y Parte III, al 2026-10-14)

- **Islas 3D**: `engine/` (three.js) + `regions/` + `scenes/RegionScene.ts`; se entra con `goRegion(id)`. Diseño:
  [../part-ii/14-regiones-3d.md](../part-ii/14-regiones-3d.md).
- **Un mundo que sigue a la historia**: `state/sys/worldState.ts` + `island/night/` + `cine/`. Guía:
  [cines-y-estados.md](cines-y-estados.md).
- **Música**: `audio/` (catálogo, director, Fonoteca) + `data/music/` + `public/music/`. Las originales del autor solo
  suenan en los Momentos y en la Fonoteca (`tests/originalsReserved.test.ts`).
- **Momentos musicales**: `momentos/`. Guía: [agregar-momento.md](agregar-momento.md).
- **Animaciones con propósito**: `art/temperament.ts` + `art/intent.ts`. Ver [animaciones.md](animaciones.md).
- **Contenido por módulos**: `data/rupturas/`, `data/gateras/` + `data/mergeContent.ts` (solo agrega).
- **El Baúl**: `core/vault.ts` + `ui/saveGuard.ts`.
- **Parte III (en desarrollo)**: `scenes/GaterasMapScene.ts`, `scenes/CajaScene.ts`, `state/sys/gateras*.ts`,
  `battle/mareo.ts`, `panels/Bitacora.ts`. Guía: [dimensiones-y-gateras.md](dimensiones-y-gateras.md).
