# 20 · Estados del mundo, cine y la apertura de H31 (INTERNO — contiene spoilers)

**Regla del dueño:** si la historia dice que algo pasa, **pasa en el mundo**. Cuando Luzterna anuncia que las estrellas caen hacia arriba, la isla se hace de noche de verdad, las estrellas suben, el faro se enciende… y se queda así mientras la historia lo diga, aunque recargues, vayas a la carta y vuelvas.

Tres piezas:

| Pieza | Archivo | Qué hace |
|---|---|---|
| Estados del mundo | `game/src/state/sys/worldState.ts` | Registro de estados narrativos. El estado se **deriva** del progreso (misiones + beats vistos). Puro, sin Pixi. |
| Noche en la isla 2D | `game/src/island/night/*` | Pinta el estado en la isla Pixi: grade del mundo, cielo astral, estrellas que suben, luces emisivas, gatos que reaccionan, sonido. |
| Cine | `game/src/cine/*` | Timeline declarativo para escenas: cámara, mundo, actores, efectos, audio, diálogo, interacción, persistencia. Saltable, pausable, interrumpible. |

---

## 1. Estados del mundo (`state/sys/worldState.ts`)

### 1.1 API

```ts
registerWorldState({ id, priority, when: (save) => boolean, look: { … }, blend?, prompt?, wave?, note? })
currentWorldState(save = G.s)   // el de mayor prioridad cuyo `when` es true; si ninguno: 'normal'
lookOf(stateOrId)               // NORMAL_LOOK + los overrides del estado
mixLook(a, b, k)                // mezcla (tweens y cinemáticas); los campos de sonido cambian a la mitad
isNeutralGrade(look)            // true → la isla ni siquiera monta el filtro
```

- `when` es una **función pura del save** (`missions.active/done`, `beatsSeen`, `flags`). Nada de relojes ni azar.
- Por eso el estado **sobrevive** a recargas, cambios de escena y al **reinicio narrativo** de la Parte II (MIGRATION borra los beats `b31…`: el mundo vuelve solo a `presagio` y la apertura se repite).
- Un predicado que truena se ignora (la isla nunca se rompe por un estado).
- `prompt`: el mundo invita a algo mientras está en ese estado (la isla marca el objetivo con un aro y una flecha), p. ej. «TOCA EL FARO» mientras H31 espera.
- `blend`: segundos para mezclar al entrar a ese estado con la isla en pantalla (por defecto 4). Siempre mezcla en los dos sentidos.

**Bandas de prioridad:** O1 10–39 · O2 40–69 · O3 70–99 · O4 100–129. `normal` es 0.

### 1.2 El «look» (todo 0..1 salvo que se diga)

| Campo | Qué controla |
|---|---|
| `exposure`, `tint`, `saturation`, `lift` | Grade del **MUNDO** (terreno, edificios, gatos). La UI nunca se gradúa. `lift` = piso de color: de noche azul profundo, **nunca negro** (08 §4). |
| `sky`, `skyTint` | Cielo astral sobre el vacío de día (y las burbujas de cielo de cada dimensión se apartan). |
| `stars` | Estrellas fijas (dos campos con parallax + titileo). |
| `starFall` | Estrellas que caen **hacia arriba**, por segundo en pantalla (cerca: delante de las islas; lejos: detrás). |
| `aurora` | Bandas de aurora/nebulosa en tinta y halftone. |
| `seam` | La costura del cielo (página rota y cosida). De día va en el mundo, entre las burbujas de cielo y las islas; de noche, en el cielo astral. |
| `lights` | Luces emisivas: ventanas de hábitats con charco de luz, faroles, portal del Santuario, altar, puerto, banco, balsa, decoración que brilla (faroles, cristales, lava, hongos), brillo propio de cada dimensión. |
| `faro` | Lámpara del faro + haz que **barre hacia afuera** (y su reflejo en el agua). |
| `seaGlow` | Destellos y reflejos de estrellas en las lagunas. |
| `vignette` | Viñeta de pantalla. |
| `dayLife` | Vida de día (gaviotas, rayos de sol): 0 de noche. |
| `cats` | Fracción de gatos que reaccionan al cielo (en orden estable: se suman de a uno en una cinemática). |
| `ambience`, `music` | Cama de ambiente y estado musical (`audio/api.ts`). La isla los aplica al entrar y cuando cambia el estado derivado (no durante una cinemática: la cine manda su propio audio). |

### 1.3 Estados de la Oleada 1

| id | Prioridad | Cuándo (derivado) | Cómo se ve |
|---|---|---|---|
| `presagio` | 29 | H31 activa y la apertura todavía no llegó a su clímax (`b31_estrellas#a` no visto) | La isla de siempre. De vez en cuando **una estrella sube a plena luz** (estela violeta de tinta) y el gato más cercano voltea. Los 20 s de respiro después de «Fin» se sienten a propósito. |
| `noche_astral` | 30 | H31 activa con `b31_estrellas#a` visto · o H31 hecha mientras no haya amanecido (`b33_paginas#a`, escena `h33_amanecer`) y H33 no esté hecha | Noche astral completa. Prompt: «TOCA EL FARO» mientras H31 espera. Música `island_night_astral`, ambiente `night_astral`. |
| `cielo_roto` | 10 | H31 hecha (cuando la noche ya no aplica) | De día otra vez, con cicatrices: costura cosida en el cielo, alguna estrella que todavía sube, estrellitas de día en los huecos del cielo. Sin grade de día; **sigue la hora real del jugador** (`clock: true`, `clockLook`: atardecer dorado, noche azul suave). |

La noche termina **en pantalla**: al cerrar el Catdex después de FOLIO, la escena `h33_amanecer` hace amanecer (hora azul → sol dorado → el día con su costura) y guarda `b33_paginas#a` cuando ya es de día. Detalle en `26-oleada-1-cine.md`.

### 1.4 Registrar los de otra oleada

```ts
// state/sys/rupturasO2.ts (al importarse)
import { registerWorldState, active, done, seen } from './worldState';
registerWorldState({
  id: 'o2_trombas',
  priority: 45,
  wave: 'O2',
  when: (s) => active(s, 'H42'),
  look: { exposure: 0.9, tint: 0xdfe8ff, starFall: 0.4, seam: 0.8, ambience: 'wind' },
  prompt: { target: 'faro', text: '¡MIRA EL MAR!' },
});
```

Los `target` que entiende la isla: `faro`, `home`, `portal`, `altar`, `port`, `bank`, `boat`, `lagoon`, `canelo`, `cat:<uid>`.

---

## 2. La noche en la isla 2D (`island/night/*`)

Capas (de abajo arriba) dentro de `IslandScene`:

1. `SeaView` (vacío de día) — se apaga cuando el cielo nocturno lo cubre del todo.
2. `NightSky` (pantalla): degradado índigo→violeta→azul, mar de nubes oscuro, halftone, dos campos de estrellas con parallax, 26 destellos que titilan, dos bandas de aurora, la costura nocturna. + estrellas lejanas que suben (detrás de las islas).
3. `worldRoot › world › graded` = terreno (con las burbujas de cielo de cada dimensión, que se apartan de noche, y la costura de día), suelo, objetos, ambiente. **Solo `graded` lleva el `ColorMatrixFilter`**, con `filterArea` = la vista de la cámara. `wfx`, `bubbles` y `parts` (UI del mundo) quedan fuera: nunca se gradúan.
4. `NightLights` (aditivo, copia la transformación de la cámara): luces, faro, agua, estrellas cercanas, marcadores.
5. Capa frontal (pantalla): estrellas fugaces (tienen que leerse).
6. Viñeta. 7. HUD (intacto).

**Gatos** (`island/night/cats.ts` + `CatActor.night`): por personalidad (`trait` en `content.json`).

| Rasgo | Reacción |
|---|---|
| curioso, chismoso, presumido, leal, callejero | `gaze`: se para alto y voltea hacia la luz del faro; de vez en cuando se sorprende |
| miedoso | `cower`: agachado, orejas atrás |
| dormilón, perezoso | `sleep`: ni así se despierta (Zzz) |
| travieso, impaciente, glotón | `chase`: brinca a atrapar estrellas |
| bravucón, rencoroso, pirómano | `challenge`: le bufa al cielo |
| **Canelo** | `chase` y en la apertura es el primero en saltar: «¡MÍA!»… falla y se pone a acicalarse como si nada |

**Ajustes:** «Reducir movimiento» = menos estrellas y más lentas, haz más lento, sin sacudida, titileo quieto, la cámara de las cinemáticas **corta** en vez de viajar. «Reducir destellos» = el encendido del faro es un brillo suave (nunca hay flash de pantalla completa).

**Rendimiento** (Chrome sin cabeza con GPU real, 1600×900, partida post-«Fin» de KL38 con 28 gatos; máquina muy cargada por otros agentes, así que se midió costo por cuadro con `update + render + gl.finish`, alternando 5 rondas): normal 17,6 ms · noche astral 15,7 ms (**−11 %**: de noche se apagan las 5 capas del vacío de día y eso paga el pase del filtro). Con FPS sin tope (otra corrida): normal ≈96, noche ≈98–111. Las partidas de la Parte I no montan filtro ni cielo (`graded.filters` vacío, cielo invisible).

---

## 3. Cine (`src/cine/*`)

### 3.1 Uso

```ts
import { playCine } from '../cine';
await playCine('h31_opening');                       // 'done' | 'skipped' | 'interrupted'
await playCine('h31_opening', { replay: true });     // «volver a ver»: no persiste nada
```

Desde la historia: un `BeatRef` con `special: 'cine', cine: '<id>'` (en `app/story.ts`). Las líneas siguen siendo del beat (`historia.json`) y salen personalizadas (Capi, nombre de Canelo, género). Si la cine se interrumpe **antes** de su paso `persist`, el beat vuelve a la cola y se reproduce en el siguiente momento tranquilo en esa pantalla.

Dev: `__cine.play(id)`, `__cine.replay(id)`, `__cine.skip()`, `__cine.pause()`, `__cine.resume()`, `__cine.abort()`, `__cine.state()` (tiempo y log de pasos), `__cine.ids()`.

### 3.2 Pasos

| Paso | Ejemplo | Al SALTAR |
|---|---|---|
| `camera` | `{ camera: { to: 'faro', offset: [120, 40], zoom: 0.72, dur: 3, ease: 'inOut' } }` | Salta al encuadre final |
| `world` | `{ world: { to: 'noche_astral', dur: 2.4 } }` · `{ world: { to: { sky: 0.5, lights: 0.35 }, dur: 7 } }` (parche sobre el look al que va) | Salta al look final |
| `actor` | `{ actor: { who: 'awake', do: 'mark', arg: '!', stagger: 0.05 } }` (`who`: `all`, `awake`, `canelo`, `cat:<uid>`, `species:<id>`, `near:<target>`; `do`: `emote`, `act`, `hop`, `look`, `mark`, `react`) | Se omite (el estado final lo ponen los gatos según el look) |
| `fx` | `{ fx: { id: 'burst', n: 70, dur: 4.5, far: 90 } }` · `shoot` (`reverse`), `ignite`, `reflect` (`to`), `aim` (`angle`), `shake` (`k`) | Se omite |
| `audio` | `{ audio: { state: 'island_night_astral', stinger: 'star_fall', ambience: 'night_astral', fade: 0.6 } }` · `{ audio: { invite: true } }` · `{ audio: { sync: 'bar', maxWait: 0.7 } }` | Estado, cue y ambiente sí; stinger, duck, invitación y sync no |
| `say` | `{ say: { beat: 'b31_estrellas', lines: [1, 2], onLine: { 1: [{ fx: {…}, after: 0.5 }] } } }` · `block: false` = globo de esquina y sigue | Se omite |
| `interact` | `{ interact: { target: 'faro', prompt: 'TOCA EL FARO', timeout: 90 } }` | Se omite |
| `wait` | `{ wait: 1.5 }` | 0 s |
| `parallel` / `seq` | `{ parallel: [ … ] }` | Se pliegan igual |
| `persist` | `{ persist: { beat: 'b31_estrellas#a' } }` | **Sí** (nunca en `replay`) |
| `ui` | `{ ui: { bars: true, hud: false, skip: true } }` (HUD oculto = tampoco se toca el mundo) | Sí |
| `call` | `{ call: (ctx) => … }` | Se llama con `ctx.skipping` |

**Tiempos:** en una secuencia, cada paso empieza cuando termina el anterior (+ `after`). `at: s` = desde el inicio de la secuencia, en paralelo. `async: true` = arranca y sigue (la secuencia lo espera al final). `reduced: paso | 'skip'` = variante con «reducir movimiento». `when: (ctx) => bool` = condicional.

**Garantías (probadas en `tests/cine.test.ts`):**
- **Orden** y **tiempo lógico**: cada espera se agenda en `inicio + duración`, no «cuando el cuadro se dio cuenta»; a 24, 60 y 144 fps se llega a cada paso en el mismo tiempo y al mismo look.
- **SALTAR** pliega el resto del guion: el mundo, la cámara, `persist` y la UI llegan a su estado final; diálogo, efectos e interacción no. Nunca queda a medias.
- **Interrupción** (la escena se fue o `abort()`): no corre nada más, se detienen los efectos, se cierra el diálogo, y si la escena sigue viva el mundo vuelve **mezclando** al estado derivado.
- **Pausa**: `pause()` o un panel abierto (Modal) congelan el reloj (también el timeout de una interacción).
- Un error dentro de un paso termina la cine como «saltada» (el mundo queda en el estado derivado) en vez de repetirse en bucle.

### 3.3 Escenarios (stages)

`CineStage` (`cine/types.ts`) es lo que una escena le presta a una cine: cámara, mundo, actores, efectos, interacción, HUD. La isla lo implementa en `island/night/stage.ts` y lo registra al entrar (`setCineStage('island', …)`); al salir lo retira e interrumpe lo que esté sonando. Las regiones 3D pueden registrar el suyo después con la misma interfaz.

---

## 4. La apertura (H31 · `cine/scenes/opening.ts`)

**Sensación:** la isla de siempre, en calma… y de pronto el cielo deja de comportarse. Asombro primero, inquietud después. Pocas palabras: las dice el mundo.

| ~t | Qué pasa | Cómo se ve / suena |
|---|---|---|
| −20 s | H31 aparece después de «Fin». Estado `presagio`. | Isla normal; cada ~6 s una estrella sube a plena luz (estela violeta) y el gato más cercano voltea. |
| 0 | Empieza la cine. | Barras de cine, el HUD se desvanece, la cámara viaja al faro. |
| 2 | **El llamado.** | Luzterna: «Capi. Capi. Despierta.» |
| 5 | **Invitación al sonido** (`ensureAudioInvited()`, una sola vez en la vida; si ya hay sonido no aparece). | Tarjeta del agente AUDIO. La cine espera la respuesta. |
| 6 | El audio baja a `silence`; entra el ambiente `night_astral`. | — |
| 6–13 | **La luz se va.** | Grade a lavanda, el cielo astral asoma entre las islas, se prenden las ventanas, los gatos curiosos voltean al faro uno por uno, las gaviotas y los rayos de sol se van. |
| 12 | **El mar refleja algo raro.** | Charcos violeta y turquesa en las lagunas; las estrellas aparecen **primero en el agua** y se hunden despacio. La cámara baja a la laguna. |
| 12–18 | Noche completa, faro todavía apagado. | Estrellas fijas, aurora, todas las luces, 80 % de los gatos mirando. |
| 18 | **Una estrella fugaz** cruza el cielo como cualquier noche… frena, se queda pensando… y **se cae para arriba**. | Los gatos despiertos: sorpresa. |
| 21 | Sincroniza al siguiente compás (máx. 0,7 s). **EL EVENTO.** | Stinger `star_fall` + `island_night_astral`. El faro se enciende solo (bloom local) y su haz barre **hacia afuera**. 70 estrellas suben de las lagunas y del vacío (y 90 lejanas detrás de las islas), ondas en el agua, sacudida leve, «!» sobre los gatos, Canelo salta: «¡MÍA!». La cámara se aleja para ver todo el cielo subiendo. |
| 22 | **Punto sin retorno:** `persist b31_estrellas#a`. Desde aquí la isla ES de noche (recargas, carta, etc.). | — |
| 24 | Luzterna: «No, no es una pesadilla: las estrellas se están cayendo… para ARRIBA.» / «¿Ves? Otra. Y otra. Como burbujas de refresco, pero de cielo.» | Con «Otra.» y «Y otra.» suben dos ráfagas chiquitas, a tiempo con la frase. |
| ~30 | **El jugador recupera el control** en la isla de noche. | Fuera barras, vuelve el HUD, cámara al faro. Globo de esquina: «Sube al faro…». El faro pulsa con «TOCA EL FARO». |
| — | Toca el faro → H31 se cumple → panel de misión → parte b (3 líneas) → cinemática 3D «el reflejo» → vuelve a la isla **de noche** → H32. | Si no lo toca en 90 s, la cine termina y el **estado** sigue invitando (mismo marcador), también después de recargar o de ir a la carta. |

**Personajes:** Luzterna (voz, 4 líneas en vez de 8; los apuntes de escena «(…)» ahora los hace el mundo). Los gatos actúan por personalidad. Canelo tiene su momento.

**Jugador:** mira, lee 3 líneas cortas, decide el sonido y **toca el faro**: la misión se cumple con una interacción, no con un video.

**Audio:** todo por la fachada `audioApi` (`setState`, `ambience`, `stinger`, `duck` durante las líneas, `on('bar')` para sincronizar el evento). Sin motor instalado, todo es silencio y nada se rompe.

**Después:** `noche_astral` durante el faro, el reflejo y REGISTRO 000; amanece al leer FOLIO; queda `cielo_roto`.

**Persistencia y saves:** ids de beats intactos (`b31_estrellas#a`, `#b`, `b31_estrellas`, `b31_reflejo`). Las líneas de `b31_estrellas` pasaron de 8 a 7 (se quitaron los dos apuntes de escena; los índices de las partes se actualizaron en `rupturasScript.ts`). Los saves solo guardan claves, así que siguen coherentes. Una partida vieja que ya había visto la parte a entra directo en `noche_astral`.

**Ajustes:** con «reducir movimiento» la cámara corta, hay 26 estrellas en vez de 70, sin sacudida. SALTAR (o Esc) deja la isla de noche, con el beat guardado, el HUD de vuelta y el faro invitando.

---

## 5. Verificación

- `tests/worldState.test.ts`: Parte I = normal (fixtures `late-game`, `post-story`, `post-finale`), la secuencia de O1, recarga = mismo estado, reinicio narrativo = `presagio`, prioridades / ids / predicados rotos, mezcla y grade («nunca negro»).
- `tests/cine.test.ts`: orden y tiempos; FPS 24/60/144 idénticos; SALTAR pliega al estado final; interrupción limpia; pausa/panel congelan; interacción y su timeout; `replay` no persiste; un paso roto no hace bucle; la apertura está bien formada.
- `tests/rupturasStory.test.ts` sigue en verde (máx. 4 líneas por parte, todas las líneas usadas, orden de delays).
- Visual: Chrome sin cabeza con GPU real (Vite propio en 5211 sin HMR). Capturas fuera del repo: `scratchpad/opening/shots/final/` (apertura cuadro a cuadro, control del jugador, carta y vuelta, recarga, después del reflejo, Parte I) y `shots/rm/` (reducir movimiento), `shots/dawn/` (amanecer), `shots/over2/` (vistas lejanas).

## 6. Pendientes

- ~~Entrada «volver a ver» en Ajustes~~ · ~~la CARTA de noche~~ · ~~las nubes de velo~~ · ~~`cielo_roto` con la hora real~~:
  hechos por O1-CINE (ver `26-oleada-1-cine.md` §0), junto con el *hush* (nada interrumpe una escena).
- Medir en un equipo modesto con DPR 2 (aquí: Apple GPU, DPR 1).
