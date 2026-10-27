# Cines y estados del mundo

**La regla del autor: si la historia dice que algo pasa, pasa en el mundo.** Si Luzterna anuncia que se hizo de noche, la isla se hace de noche de verdad, el faro se enciende y los gatos voltean al cielo. Y se queda así mientras la historia lo diga, aunque recargues, vayas a la carta y vuelvas.

Para eso hay dos piezas que trabajan juntas:

| Pieza | Archivo | Qué hace |
|---|---|---|
| **Estados del mundo** | `game/src/state/sys/worldState.ts` | Un registro de "cómo se ve el mundo ahora". El estado se **deriva** del progreso (misiones y beats vistos). Puro, sin Pixi. |
| **Cines** | `game/src/cine/` | Escenas declarativas: una lista de pasos de cámara, mundo, gatos, efectos, sonido, diálogo e interacción. Se pueden saltar, pausar e interrumpir sin dejar nada a medias. |

La isla pinta el estado con `game/src/island/night/` (luz, cielo, estrellas, luces, gatos que reaccionan); las islas 3D y las dimensiones tienen su propio escenario.

Guías hermanas: [agregar-historia.md](agregar-historia.md) · [agregar-momento.md](agregar-momento.md) · [animaciones.md](animaciones.md) · [rutas-de-desarrollo.md](rutas-de-desarrollo.md) · [arquitectura.md](arquitectura.md)

---

## 1. Estados del mundo

### 1.1 Registrar uno

Un sistema registra sus estados al importarse:

```ts
import { registerWorldState, active, done, seen } from './worldState';

registerWorldState({
  id: 'mi_tormenta',
  priority: 45,
  when: (s) => active(s, 'H42'),                       // función PURA de la partida
  look: { exposure: 0.9, tint: 0xdfe8ff, starFall: 0.4, ambience: 'wind' },
  prompt: { target: 'faro', text: '¡MIRA EL MAR!' },  // el mundo invita a algo mientras dure
});
```

- `when` lee solo la partida: `missions.active`, `missions.done`, `beatsSeen` y `flags`. **Nada de relojes ni azar.** Por eso el estado sobrevive a recargas, cambios de escena y migraciones.
- `currentWorldState()` devuelve el de **mayor prioridad** cuyo `when` es verdadero; si ninguno aplica, `normal` (prioridad 0).
- Un `when` que truena se ignora: la isla nunca se rompe por un estado.
- `blend`: segundos para mezclar al entrar (4 por defecto). Siempre mezcla en los dos sentidos.
- `prompt`: marca un objetivo con un aro y una flecha. Los `target` que entiende la isla: `faro`, `home`, `portal`, `altar`, `port`, `bank`, `boat`, `lagoon`, `canelo`, `cat:<uid>`.

**Bandas de prioridad**, una por bloque de historia para que no se pisen: 10–39, 40–69, 70–99 y 100–129 (las cuatro oleadas de la Parte II) y 130–159 (Parte III). Usa la de tu bloque.

Otras ayudas: `lookOf(estado)` (el look completo: el normal más lo que cambia el estado), `mixLook(a, b, k)` (mezcla para tweens) e `isNeutralGrade(look)` (si es neutro, la isla ni monta el filtro).

### 1.2 El look

Todo va de 0 a 1 salvo que se diga otra cosa.

| Campo | Qué controla |
|---|---|
| `exposure`, `tint`, `saturation`, `lift` | La gradación del **mundo** (terreno, edificios, gatos). La interfaz nunca se gradúa. `lift` es el piso de color: de noche, azul profundo, **nunca negro**. |
| `sky`, `skyTint` | El cielo nocturno sobre el vacío. |
| `stars`, `starFall` | Estrellas fijas y estrellas que suben. |
| `aurora`, `seam` | Bandas de aurora y la costura del cielo. |
| `lights` | Luces de ventanas, faroles, portal, puerto y decoración que brilla. |
| `faro` | La lámpara del faro y su haz. |
| `seaGlow` | Reflejos en las lagunas. |
| `vignette`, `dayLife` | Viñeta y vida de día (gaviotas, rayos de sol). |
| `cats` | Qué fracción de gatos reacciona al cielo. |
| `ambience`, `music` | Cama de ambiente y estado musical. La isla los aplica al entrar y al cambiar el estado (no durante una cine: ahí manda la cine). |

**Cómo reaccionan los gatos** (`island/night/cats.ts`): por su rasgo. Los curiosos voltean a la luz, los miedosos se agachan, los dormilones ni se enteran, los traviesos brincan a atrapar estrellas y los bravucones le bufan al cielo. Canelo siempre es el primero.

---

## 2. Cines

### 2.1 Un guion

Los guiones viven en `game/src/cine/scenes/*.ts`, se registran solos y se importan en `cine/scenes/index.ts`. Un ejemplo con la forma real:

```ts
import { registerCine } from '../registry';
import type { CineScript } from '../types';

const B = 'b70_mi_beat';

export const MI_CINE: CineScript = {
  id: 'mi_cine',
  stage: 'island',
  replay: { title: 'Un título sin spoilers', seen: `${B}#a`, order: 70.0 },   // aparece en VOLVER A VER
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { camera: { to: 'faro', offset: [0, -40], zoom: 1.05, dur: 2.4, ease: 'inOut' }, async: true },
    { world: { to: { sky: 0.5, lights: 0.35 }, dur: 4 }, at: 0.5 },
    { actor: { who: 'awake', do: 'mark', arg: '!', stagger: 0.05 }, after: 1 },
    { audio: { stinger: 'reveal', gain: 0.55 } },
    { say: { beat: B, lines: [0, 1] } },
    { persist: { beat: `${B}#a` } },                // desde aquí, la historia ya pasó
    { wait: 0.8 },
  ],
};

registerCine(MI_CINE);
```

Para reproducirla:

```ts
import { playCine } from '../cine';
await playCine('mi_cine');                    // → 'done' | 'skipped' | 'interrupted'
await playCine('mi_cine', { replay: true });  // «volver a ver»: no guarda nada
```

Desde la historia, un `BeatRef` con `special: 'cine', cine: 'mi_cine'` en `app/story.ts`. Las líneas siguen siendo del beat y salen personalizadas (el nombre de Canelo, "Capi", el género del jugador). Si la cine se interrumpe **antes** de su `persist`, el beat vuelve a la cola y se reproduce en el siguiente momento tranquilo.

Campos de `CineScript` (`cine/types.ts`): `id`, `stage`, `steps`, `replay?`, `skippable?` (verdadero por defecto), `finish?` (estado final que se aplica al terminar y también al saltar) y `releaseBlend?` (segundos para devolver el mundo al estado derivado; 1,5 por defecto).

### 2.2 Los pasos

| Paso | Ejemplo | Al SALTAR |
|---|---|---|
| `camera` | `{ camera: { to: 'faro', zoom: 0.72, dur: 3, ease: 'inOut' } }`. En 3D: `to: [x, y, z]` con `dist`, `pitch`, `yaw`. | Salta al encuadre final |
| `world` | `{ world: { to: 'mi_tormenta', dur: 2.4 } }` o un parche: `{ world: { to: { sky: 0.5 }, dur: 7 } }` | Salta al look final |
| `drive` | `{ drive: { id: 'rise', to: 1, dur: 6 } }`: lleva un parámetro del escenario de 0 a 1 (una isla que sube, la fuerza de un glitch) | Salta al valor final |
| `actor` | `{ actor: { who: 'canelo', do: 'hop' } }`. `who` en la isla: `all`, `awake`, `canelo`, `cat:<uid>`, `species:<id>`, `near:<objetivo>` (los 6 más cercanos). `do`: `emote`, `act`, `hop`, `look`, `mark`, `react`. | Se omite |
| `fx` | `{ fx: { id: 'burst', n: 70, dur: 4.5 } }`: efectos que ofrece el escenario | Se omite |
| `audio` | `{ audio: { state: 'island_night_astral', ambience: 'night_astral', fade: 0.6 } }`, `{ audio: { invite: true } }`, `{ audio: { sync: 'bar', maxWait: 0.7 } }` | Estado, cue y ambiente sí; remates, ducking, invitación y sync no |
| `say` | `{ say: { beat: 'b70_mi_beat', lines: [1, 2], onLine: { 1: [{ fx: { … }, after: 0.5 }] } } }`. `block: false` es un globo de esquina y la cine sigue. | Se omite |
| `interact` | `{ interact: { target: 'faro', prompt: 'TOCA EL FARO', timeout: 90 } }` | Se omite |
| `wait` | `{ wait: 1.5 }` | 0 s |
| `parallel` / `seq` | `{ parallel: [ … ] }` | Se pliegan igual |
| `persist` | `{ persist: { beat: 'b70_mi_beat#a' } }` | **Sí** (nunca en una repetición) |
| `ui` | `{ ui: { bars: true, hud: false, skip: true } }` | Sí |
| `call` | `{ call: (ctx) => … }` | Se llama con `ctx.skipping` |

**Tiempos:** en una secuencia, cada paso empieza cuando termina el anterior (más `after`). `at: s` arranca desde el inicio de la secuencia, en paralelo. `async: true` arranca y sigue (la secuencia lo espera al final). `when: (ctx) => bool` lo hace condicional. `id` es una etiqueta para depurar.

### 2.3 Lo que el runner garantiza

Probado en `game/tests/cine.test.ts`:

- **Tiempo lógico**: cada espera se agenda en `inicio + duración`. A 24, 60 o 144 fps se llega a cada paso en el mismo tiempo y al mismo look.
- **SALTAR** pliega el resto del guion: mundo, cámara, `persist` y la interfaz llegan a su estado final; diálogo, efectos e interacción no. Nunca queda a medias.
- **Interrupción** (la escena se fue): no corre nada más, se cierran el diálogo y los efectos, y el mundo vuelve mezclando al estado derivado.
- **Pausa**: un panel abierto o `pause()` congelan el reloj, incluido el tiempo límite de una interacción.
- **Un paso que truena** termina la cine como "saltada" en vez de repetirse en bucle.
- **Las repeticiones no guardan nada.**

### 2.4 Escenarios

Un `CineStage` es lo que una escena le presta a una cine: cámara, mundo, gatos, efectos, interacción y HUD. La escena lo registra al entrar (`setCineStage(id, …)`) y lo retira al salir, lo que interrumpe la cine que estuviera sonando.

| `stage` | Quién lo presta | Notas |
|---|---|---|
| `island` | `scenes/IslandScene.ts` (`island/night/stage.ts`) | La isla 2D: cámara en coordenadas del mundo, objetivos con nombre, gatos por rasgo. |
| `region` | `scenes/RegionScene.ts` | Las islas 3D de la Parte II: cámara `[x, y, z]` con órbita (`dist`, `pitch`, `yaw`), `drive` para parámetros continuos. |
| `caja` | `scenes/CajaScene.ts` | Las dimensiones de la Parte III ([dimensiones-y-gateras.md](dimensiones-y-gateras.md)). |

Un escenario nuevo implementa la interfaz `CineStage` de `cine/types.ts`.

### 2.5 Volver a ver

Con `replay: { title, seen, order, region?, enters? }`, la cine aparece en **Ajustes › VOLVER A VER** en cuanto la partida vio su beat (`seen`). `order` la acomoda en orden de historia. Si es de una isla 3D, `region` hace que la repetición zarpe ahí primero. El título **no lleva spoilers**.

---

## 3. Movimiento reducido y destellos

- Cada paso acepta `reduced: <otro paso> | 'skip'`, su versión con «Reducir movimiento».
- La cine recibe `ctx.reduceMotion` y `ctx.reduceFlashes`. Con movimiento reducido la cámara **corta** en vez de viajar, hay menos estrellas y no hay sacudidas; con destellos reducidos, un encendido es un brillo suave y nunca un destello a pantalla completa.
- Revisa tu cine con los dos ajustes encendidos antes de mandarla.

---

## 4. Probar

- En la consola: `__cine.play('mi_cine')`, `__cine.replay(id)`, `__cine.skip()`, `__cine.pause()`, `__cine.resume()`, `__cine.abort()`, `__cine.state()` (tiempo y bitácora de pasos) y `__cine.ids()`.
- Carga una partida justo antes de tu escena con `?save=<fixture>` ([rutas-de-desarrollo.md](rutas-de-desarrollo.md#5-partidas-de-prueba)).
- Las cines de una dimensión de la Parte III se repiten con `?scene=caja&set=bar&cine=<id>`.
- `npm test`: `tests/cine.test.ts` (el runner) y `tests/worldState.test.ts` (estados: la Parte I siempre es `normal`, recargar da el mismo estado, prioridades y predicados rotos).

## 5. Checklist

- [ ] El `when` de tu estado es puro y está en la banda de prioridad de su bloque.
- [ ] La noche nunca es negra (`lift`).
- [ ] La cine guarda su beat con `persist` en el punto sin retorno, y funciona saltada, interrumpida y repetida.
- [ ] Título de repetición sin spoilers.
- [ ] Revisada con «Reducir movimiento» y «Reducir destellos».
- [ ] `npm test` pasa.

Diseño completo, con la apertura de la Parte II paso a paso: [docs/part-ii/20-estados-y-cine.md](../part-ii/20-estados-y-cine.md) y [26-oleada-1-cine.md](../part-ii/26-oleada-1-cine.md) (internos, con spoilers de la Parte II).
