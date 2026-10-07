# Mapa de la arquitectura (o: dónde vive cada gato)

Bienvenida, bienvenido. Si llegaste aquí es porque quieres meterle mano a NO ONE LIKE CATS y no sabes
por dónde empezar. Tranqui: el código es grande, pero tiene un orden. Esta guía es el mapa del barco.
No explica cada tornillo; te dice en qué cubierta está cada cosa y quién le habla a quién.

Todo el juego vive en `game/` (TypeScript + PixiJS v8 + GSAP + pixi-filters, empaquetado con Vite).
Cuando esta guía dice `src/...` se refiere a `game/src/...`.

Guías hermanas, para cuando ya sepas qué quieres hacer:

- [Agregar un gato](agregar-gato.md)
- [Agregar un elemento](agregar-elemento.md)
- [Agregar historia](agregar-historia.md)
- [Agregar un barco](agregar-barco.md)
- [Animaciones](animaciones.md)
- [Cómo sacar una actualización sin romper partidas](../ACTUALIZACIONES.md)
- [Motor y plataformas](../MOTOR-Y-PLATAFORMAS.md)
- [Cómo contribuir](../../CONTRIBUTING.md)

---

## 1. Las capas, en un dibujo

```
            content.json / balance.json        (datos: gatos, misiones, números)
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
| `app/` | Navegación y orquestación entre escenas (el pegamento). | `flow.ts`, `battleFlow.ts`, `story.ts`, `storyFlow.ts` |
| `art/` | Arte de gatos en código: SVG hechos con [MAI SVG](https://github.com/Ragosorio/MAI-SVG) + mallas deformables. | `livingCat.ts` (gatos vivos con rig), `catArt.ts` (carga `cats-svg/` y `cats-svg/lite/`), `tint.ts` (variantes teñidas), `textures.ts` (papel) |
| `battle/` | Combate: simulación pura, IA, vista, mar, cielo, jefes. | `sim.ts` (lógica determinista sin render), `autoplay.ts` (IA contra IA, la usan los scripts de balance), `ai.ts`, `hud.ts`, `anime/` (barcos estilo anime), `boss/rigs.ts` |
| `core/` | El motor de casa: app, escenas, eventos, guardado, audio, PWA. | `App.ts`, `scenes.ts`, `events.ts`, `save.ts`, `updates.ts`, `pwa.ts`, `audio.ts` (SFX sintetizados, sin archivos), `music.ts` (música procedural), `rng.ts`, `format.ts`, `safety.ts` |
| `data/` | Contenido y balance en JSON + accesos tipados. | `content.json`, `balance.json`, `content.ts`, `catRigs.json`, `chatter.ts`, `elementsMeta.ts`, `updates.ts` |
| `dev/` | Utilidades solo para desarrollo. | `devBattle.ts` (la batalla de `?scene=battle`) |
| `fx/` | Jugo visual: shake, partículas, filtros y secuencias grandes. | `juice.ts`, `particles.ts`, `filters.ts`, `sequences/` (`catReveal`, `gachaSummon`, `starUp`, `victoryNews`...) |
| `island/` | La isla isométrica: terreno, cámara, gatos paseando, decoración, dimensiones. | `iso.ts`, `camera.ts`, `catActor.ts`, `worldUi.ts`, `archipelago.ts`, `views/`, `dimensions/`, `chatter/` |
| `panels/` | Paneles modales que se abren encima de la isla o el mapa. | `CatPanel.ts`, `Shipyard.ts`, `Sanctuary.ts`, `Kingdom.ts`, `casino/`, `shop/`, `island/` |
| `scenes/` | Pantallas completas (una activa a la vez). | `TitleScene.ts`, `IslandScene.ts`, `MapScene.ts`, `BattleScene.ts` |
| `state/` | Estado del juego, reglas, guardado, migraciones. | `game.ts`, `index.ts`, `econ.ts`, `sys/`, `ext/`, `migrate.ts`, `patches.ts` |
| `ui/` | Kit de interfaz: botones, textos, modales, toasts, íconos, HUD, diálogos. | `widgets.ts`, `theme.ts`, `modal.ts`, `icons.ts`, `elementIcon.ts`, `dialog.ts`, `hud/` |

Fuera de `src/` también hay cosas útiles: `game/public/` (SVGs de gatos, íconos, arte de historia,
`sw.js`, manifest), `game/test-saves/` (partidas de prueba para `?save=`) y
`game/scripts/verify-missions.ts` (revisa las misiones sin navegador).

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
4. `initPwa()` (service worker, botón INSTALAR), `initUpdates()` (cartel de versión nueva),
   `mountMicroOverlay()`, `applyAudioSettings()`, `initStory()` (escucha eventos de `G` para la historia).
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

| Parámetro | Qué hace | ¿Solo en dev? |
|---|---|---|
| (nada) | El juego de verdad: pantalla de título. | no |
| `?scene=island` / `?scene=map` | Carga la partida (`bootGame()`) y salta directo a la isla o al mapa. | no |
| `&new=1` | Junto con `island`/`map`: empieza partida nueva (`newGame()`). Ojo, eso reemplaza la partida guardada. | no |
| `?scene=battle` | Batalla de prueba con `dev/devBattle.ts`; al terminar, otra igual. | no |
| `?scene=art` | `ArtLab`: comparar estilos de render de gatos (isla, cómic, battle form, tinta) y probar una revelación. | no |
| `?scene=catlive` | `CatLiveLab`: todos los gatos como marionetas MAI. `&cat=<slug>` muestra uno, `&rig=1` dibuja el rig. | no |
| `?scene=shiplab` | `ShipArtLab`: todas las pieles de barco (jugador, enemigos, jefes) con tripulación y estados. | no |
| `?scene=sandbox` | `BattleSandbox`: arena para probar cómo se rompen los barcos. | no |
| `?scene=islandlab` | `IslandSandbox`: la isla y su cámara, sin partida. | no |
| `?scene=dev` | LABORATORIO: una página que lista todos los labs con qué hacen y qué guía los explica (`scenes/DevLab.ts`, lista `LABS`). | no |
| `?scene=fxlab` | `FxLab`: visor de secuencias de `fx/sequences/` con el gato que elijas (`&cat=<slug o id>`). | no |
| `?dev=1` (en el título) | Muestra un botón LAB en la esquina de la pantalla de título que lleva a `?scene=dev`. | no |
| `?save=post-boss1` | Copia `game/test-saves/post-boss1.json` a la ranura de guardado y limpia el parámetro. | sí |
| `?stage=2-9` | Carga la partida y entra directo a la batalla de campaña zona 2, etapa 9. | sí |
| `?speed=4` | El reloj de la economía corre 4 veces más rápido (las batallas no). | sí |
| `?realtime=1` | GSAP sigue el reloj real aunque la pestaña esté en segundo plano (pruebas headless). | sí |

En dev también quedan
colgados `window.__gsap`, `window.__scenes` y, siempre, `globalThis.__G` para hurgar desde la consola.

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
| `DevLab` | LABORATORIO, el índice de labs. |
| `ArtLab`, `CatLiveLab`, `ShipArtLab`, `BattleSandbox`, `IslandSandbox` | Laboratorios de desarrollo (ver rutas). |

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

### `state/ext/` (ayudantes de UI)

Lecturas cómodas sobre `sys/` para cada módulo de pantalla, sin esquema persistente nuevo:
`campaign.ts` (datos de etapa, botín, memo entre mapa, batalla y resultados), `collection.ts`
(Resonancia, Catdex, Altar), `island.ts` y `islandM2.ts` (resúmenes para el HUD y la isla) y
`story.ts` (beats vistos, nombrar al primer gato, resumen offline).

### `state/migrate.ts` y `state/patches.ts`

`migrate.ts` cambia la **forma** de partidas viejas (`MIGRATIONS[v]`, `SAVE_VERSION`, hoy en 2) y
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

El contenido del juego (unas 16 mil líneas). Claves de primer nivel:

| Clave | Qué guarda |
|---|---|
| `meta` | Nombre del juego, capítulo, idioma, pantalla lógica. |
| `elements` | Los 8 elementos: id, nombre, desbloqueo, dimensión, paleta. |
| `affinity` | Tabla de ventajas entre elementos. |
| `materials` | Materiales de casco y sus multiplicadores por elemento. |
| `statuses` / `catStatuses` | Estados alterados de barcos / de gatos. |
| `reactions` | Reacciones entre elementos (y su entrada en el Grimorio). |
| `roles` / `workers` / `traits` / `mutations` | Roles de combate, trabajos, rasgos y mutaciones de gatos. |
| `cats` | Los 54 gatos de la Catdex. |
| `catdexSets` / `catdexTeaser` / `tintDecals` | Sets de colección, el gato teaser y decorados de variantes teñidas. |
| `resonanceRules` / `resonanceRecipes` / `secretRecipes` | Reglas, recetas y secretos de Resonancia. |
| `ships` / `modules` / `shipArt` | Barcos del jugador, módulos, reliquias, artefactos y su arte. |
| `volley` / `koSequence` / `aiDifficulty` | Reglas de la andanada, secuencia de K.O. y niveles de IA. |
| `enemyArchetypes` / `enemies` / `elites` / `bosses` | Enemigos por zona (con etapas), élites y jefes. |
| `missions` | 108 misiones en cadenas, con metas, disparadores y recompensas. |
| `events` | Microeventos y eventos relámpago. |
| `expansions` | Las 8 expansiones de la isla. |
| `automation` / `kingdomMilestones` | Automatizaciones por nivel de Reino y los hitos del 1 al 50. |
| `story` | Personajes, beats y textos de derrota. |

### El resto de `data/`

- `content.ts`: acceso tipado. `CATS`, `CAT_BY_ID`, `catDef(id)` (lanza error si el gato no existe),
  `ELEMENTS`, `ELEMENT_BY_ID`, `MISSIONS`, `MISSION_BY_ID`, `SHIPS`, `ZONES`, `BOSSES`, `BEAT_BY_ID`,
  `stageDef('2-9')`, `affinityMult()`, `materialMult()`...
- `balance.json`: todos los números (rarezas, gatos, resonancia, hábitats, combate, reino, Ronroneo,
  momentum, expediciones...). Se lee a través de `BAL` en `state/econ.ts`.
- `catRigs.json`: un rig por gato (33 pinturas), compactado desde MAI; lo consume `art/livingCat.ts`.
- `chatter.ts`: las frases que sueltan los gatos en la isla (con su retractación cobarde incluida).
- `elementsMeta.ts`: nombres e íconos para mostrar elementos; la jugabilidad vive en `content.json`.
- `updates.ts`: NOVEDADES (ver arriba).

### Cómo fluye un dato

```
content.json ──► content.ts (CATS, catDef) ──► state/sys/* (reglas) ──► panels/* y scenes/* (pantalla)
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
  vigila: un PNG colado tumba el build. Lo mismo con el audio: los sonidos y la música se sintetizan.
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
