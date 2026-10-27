# Cómo se hace un Momento musical

Un **Momento musical** es un video interactivo dentro de la historia, montado sobre una de las canciones originales del autor. La canción manda: cada bombo, cada nota del bajo y cada acento tienen algo en pantalla que reacciona. Hay pulsos para tocar, mantener, machacar o elegir, pero **lo que hagas solo cambia la animación**, nunca el resultado: ni premios, ni la partida, ni la batalla. Al final sale una nota de ritmo (S, A, B, C) que es solo de adorno.

Esta guía explica cómo está armado uno, contra el código real de `game/src/momentos/`. No cuenta dónde aparece cada uno en la historia: eso se descubre jugando.

Guías hermanas: [cines-y-estados.md](cines-y-estados.md) · [animaciones.md](animaciones.md) · [rutas-de-desarrollo.md](rutas-de-desarrollo.md) · [arquitectura.md](arquitectura.md) · estilos: [ESTILOS.md §7](../arte/ESTILOS.md#7-los-momentos-musicales-un-estilo-por-canción)

---

## 0. La regla de las canciones originales

**Las canciones originales del autor solo suenan en los Momentos y en la Fonoteca.** Las batallas, la isla y el director de música usan sus versiones: `<canción>.battle`, `.explore`, `.ambient`, `.aftermath`… La prueba `game/tests/originalsReserved.test.ts` falla si `game/src/data/music/battles.json` o `director.json` nombran una original en cualquier lugar donde va una pista. Cada original tiene que tener su remezcla `<id>.battle` con su mapa de pulsos.

Las originales de hoy (`ORIGINALS` en esa prueba): `liky_fight`, `when_i_lose`, `te_odio`, `hemkade`, `circus_malus`, `yonose_todo` (las seis de la Parte II) y `drunck` (Parte III, en desarrollo). Cada una tiene su Momento, en `game/src/momentos/songs/`.

Como las canciones son del autor, **un Momento nuevo empieza con un issue Idea**: qué canción, qué ánimo y qué estilo. Lo que sí puedes mejorar libremente es el motor, el kit, el rendimiento, la accesibilidad y las pruebas.

---

## 1. Mapa de archivos

| Archivo | Qué hace | ¿Dibuja? |
|---|---|---|
| `momentos/types.ts` | Tipos de autoría (`MomentoDef`, `When`, `Act`, entradas de la partitura, `InputSpec`) y de ejecución (`Cue`, `Prompt`, `MomentoResult`). | no |
| `momentos/score.ts` | Ayudas para escribir la partitura (`at`, `on`, `key`, `tap`, `hold`, `mash`, `choice`, `v`), las ventanas de juicio y `resolveScore`, que convierte y **valida**. | no |
| `momentos/time.ts` | Tiempo musical: direcciones, compases, golpes, edición. | no |
| `momentos/core.ts` | La máquina de pulsos y juicio, el autoplay de QA y la nota. | no |
| `momentos/clock.ts` | El reloj: sigue el audio, o un reloj interno si no hay sonido. | no |
| `momentos/flash.ts` | `FlashGuard`: máximo 3 destellos por segundo, nunca rojo saturado. | no |
| `momentos/save.ts` | Lo único que se guarda: `ext.momentos` (visto, mejor nota, veces). | no |
| `momentos/registry.ts` | `registerMomento`, `momentoForFase`, `seenMomentos`. | no |
| `momentos/songs/index.ts` | Una línea `import` por canción. | no |
| `momentos/index.ts` | `playMomento(id, opts)`. | sí |
| `momentos/runner.ts` | Monta la escena, los clips, los pulsos, la pausa, el post y la limpieza. | sí |
| `momentos/battle.ts` | `runBattleMomento`: el gancho de batalla. | sí |
| `momentos/dev.ts` | Las rutas de desarrollo y el laboratorio del tratamiento. | sí |
| `momentos/anime/` | El kit: `kit.ts` (clips, cámara, `StageApi`), `fx.ts` y `cutin.ts` (verbos), `shaders.ts` (post y horneados), `actor.ts` (pinturas horneadas que posan "en dos"), `palette.ts`, `prompts.ts`, `pause.ts`. | sí |
| `momentos/songs/<carpeta>/` | Una carpeta por canción: `score.ts`, `stage.ts`, `verbs.ts`, `index.ts` y lo que el set necesite. | sí |
| `data/music/tracks.json` | El catálogo: la canción, sus variaciones, su volumen medido y su pista para la Fonoteca. | — |
| `data/music/beatmaps/<id>.json` | El mapa de pulsos: tempo, secciones, marcadores y golpes de coreografía. | — |
| `data/music/beatmaps/<id>.onsets.json` | Los ataques medidos por pista: `kick`, `snare`, `perc`, `bass` (con duración y nota MIDI), `melody`, `vox`. | — |
| `public/music/<id>.m4a` | El audio. | — |

El núcleo puro se prueba en node; todo lo que dibuja vive en `runner`, `anime/` y el set de cada canción.

---

## 2. La definición (`MomentoDef`)

`songs/<carpeta>/score.ts` exporta la definición. Un esqueleto con los campos reales:

```ts
import type { MomentoDef } from '../../types';
import { at, on, key, tap, hold, mash, choice, v } from '../../score';

export const MI_MOMENTO: MomentoDef = {
  id: 'mi_cancion',                 // para siempre: la partida lo guarda en ext.momentos
  track: 'mi_cancion',              // la ORIGINAL en tracks.json
  title: 'MI CANCIÓN',              // sin spoilers: así sale en VOLVER A VER y la Fonoteca
  mission: 'HXX',                   // informativo: la misión que lo hospeda
  battle: { id: 'mi_batalla', fase: 'mi_fase' },   // opcional: si lo dispara un cambio de fase
  cut: 'outro+2',                   // el último cuadro (corte duro); por defecto, el fin de la canción
  tail: 'release',                  // 'release' (la música del juego vuelve en el compás) o 'keep'
  palettes: { verse: 'dusk', chorus: 'drop' },     // paleta por sección
  score: [ /* sección 3 */ ],
  stage: () => import('./stage').then((m) => m.default as unknown as (h: unknown) => unknown),
  unlocks: ['mi_cancion'],          // la Fonoteca al completarlo la primera vez
  source: 'Un lugar sin spoilers',  // dónde dice la Fonoteca que la encontraste
  props: { 'cam.zoom': 1.2 },       // valores iniciales de las props
};
```

Y en `songs/<carpeta>/index.ts`:

```ts
import { registerMomento } from '../../registry';
import { MI_MOMENTO } from './score';

registerMomento(MI_MOMENTO);
```

Por último, una línea `import './<carpeta>';` en `songs/index.ts`. Ese archivo no importa Pixi: el set se carga perezoso.

**La regla del autor: la canción completa.** La animación ocupa toda la canción, sin recortes (`edit` existe, pero no se usa). La segunda mitad no repite la primera: escala con escenas, ángulos y momentos nuevos, y el clímax de la canción es el clímax del Momento.

---

## 3. La partitura

La partitura es una lista de entradas en **tiempo de la canción**. Las direcciones de tiempo (`When`) son:

| Forma | Ejemplo | Significa |
|---|---|---|
| número | `115.85` | segundos de la canción |
| sección o marcador | `'chorus'`, `'first_drop'` | su inicio (si se llaman igual, gana la sección) |
| desplazamiento | `'chorus+2'`, `'chorus+2:1.5'`, `'shout_1-0:1'` | ± compases `:` tiempos |
| compás absoluto | `'#24'`, `'#24:2'` | el compás 24 (base 0) y su tiempo 2 |
| objeto | `{ section: 'drop', bar: 1, beat: 2 }` | lo mismo, sumando |

Las entradas:

```ts
at('big_hit_1', 'impact', v('sfx', { text: '¡FIESTA!' }))                      // actos en un instante
on({ hits: { in: 'chorus', kind: 'kick', min: 0.8 } }, v('punch', { z: 0.015 })) // en cada golpe del mapa
on({ onsets: { track: 'kick', in: ['#1:2', '#4:2'], min: 0.3, minGap: 0.4 } }, 'lightUp') // en cada ataque medido
on({ beats: { in: 'break', every: 2 } }, 'notes')                                 // también bars y times
key('verse', { 'cam.zoom': 0.86 }, { beats: 12, ease: 'inOut' })                  // props: tween o cambio seco
tap('silence_1', { id: 'stop1' }, { great: [...], hit: [...], miss: [...] })
hold('#22', 'first_drop', { id: 'brace', label: '¡FIRMES!' }, { ... })             // mantener hasta `until`
mash('#40', '#43', { id: 'volley', need: [10, 22], label: '¡FUEGO!' }, { ... })   // machacar
choice('#46', { id: 'dodge', fallback: 'left' }, { left: [...], right: [...] })   // izquierda o derecha
```

- **Actos:** `'verbo'`, `['verbo', args]` o `v('verbo', args, { beats | dt })` con retraso. Los verbos del kit (`punch`, `shake`, `roll`, `whip`, `impact`, `flash`, `speed`, `focus`, `ring`, `burst`, `sparkle`, `confetti`, `notes`, `sfx`, `beat`, `cutin`, `panels`, `freeze`) están en `anime/fx.ts` y `anime/cutin.ts`; cada set agrega los suyos en `verbs.ts`.
- **Pulsos** (`InputSpec`): `id` estable, `lead` (compases de aviso, 1 por defecto), `optional` (un bonus que nunca resta), `anchor` (dónde aparece el aviso), `label` (**de 1 a 3 palabras**), `until`, `release`, `need`, `fallback`.
- **Ventanas:** ±60 ms es perfecto y ±150 ms es bien (`GREAT_S`, `HIT_S` en `score.ts`), más el «Ajuste de ritmo» del jugador (`settings.rhythmOffsetMs`).
- **Ramas:** perfecto/bien arrancan en el golpe; un fallo arranca al cerrar la ventana (el "tiempo cómico" antes del tropiezo); hold y mash en `until`; choice en la decisión. `always` corre en todas.

`resolveScore` lo convierte todo y **valida**: nombres que no existen, pulsos que cierran después del corte, pulsos a menos de 0,3 s, un tap dentro de un hold, etiquetas largas, ramas faltantes. **Las pruebas exigen cero advertencias.**

---

## 4. El mapa de pulsos y los ataques

- **El mapa** (`data/music/beatmaps/<id>.json`): tempo, secciones (`intro`, `verse`, `chorus`…), marcadores y golpes de coreografía (`hits`, con `kind` y `strength`). Todas las canciones van en grilla exacta desde 0. Si una canción no trae `hits`, el motor sintetiza golpes desde la grilla.
- **Los ataques** (`<id>.onsets.json`): cada bombo, acento, nota del bajo y ataque de melodía, medidos sobre las pistas separadas. Filas compactas: `[t, fuerza]` y, en el bajo, `[t, duración, midi, fuerza]`. El autor los genera con un script propio fuera del repo; si una canción no los tiene, el validador avisa.
- **El catálogo** (`data/music/tracks.json`): `id`, `title`, `file`, `durationSec`, `bpm`, `key`, `beatmap`, `variations` (las versiones que sí pueden sonar en el juego), `loop`, `cover`, `moods`, `lufs` (todas alrededor de −16) y `hint` (la pista sin spoilers de la Fonoteca).

---

## 5. El set (`StageApi`)

`songs/<carpeta>/stage.ts` exporta por defecto `createStage(k: Kit): StageApi`:

```ts
export default function createStage(k: Kit): StageApi { return new MiSet(k); }
class MiSet implements StageApi {
  verbs = { miVerbo };                       // verbos propios, encima de los del kit
  props = { pal: 'noir', 'cam.zoom': 1.2 };
  async build(k: Kit) { await k.studio.loadAll(['canelo_cozy_cat']); /* dibuja una vez en k.layers.* */ }
  update(k: Kit, m: number) { /* el mundo en el tiempo m */ }
  late(k: Kit, m: number) { /* después de los clips: poses pedidas, anclas */ }
  anchor(name: string, k: Kit): [number, number] | null { return [960, 540]; }
  destroy() {}
}
```

Reglas del set:

- **Todo es función del tiempo.** Un clip es `{ t0, t1, mount, update(lt), unmount }`; el kit monta lo activo y desmonta lo demás. Así se puede pausar, saltar y dibujar cualquier instante. **Nada de tweens de GSAP con estado**; las partículas van en forma cerrada (`p0 + v·t + ½·g·t²`) con una semilla por cue.
- **Capas** (`k.layers`): `bg`, `world` (cámara), `wfx`, `screen`, `panels`, `type` y `ui` (avisos y pausa: sin post ni impacto).
- **Gatos:** `k.studio.loadAll(slugs)` hornea cada pintura MAI **una vez** al estilo del Momento; `new Actor(k.studio, slug, alto)` es una marioneta que cambia de pose "en dos". Los gatos de tu tripulación entran como `'$crew0'`, `'$crew1'`.
- **Cada sonido tiene un propósito.** Sin escribir un cue por golpe, el set lee los ataques en cada cuadro: `k.env(pista, m)` da una envolvente de 0 a 1, `k.last(pista, m)` el último ataque (con la nota del bajo) y `k.beatStep(m)` el paso "en dos" que arranca en cada tiempo.
- **Nada se crea en el golpe:** las palabras y los cut-ins se hornean antes de arrancar el reloj. Una palabra grande creada en el cuadro del golpe costaba de 10 a 40 ms.
- **Estilo propio:** cada Momento tiene su arte. `palettes` y `promptTheme` cambian colores y avisos; `post` agrega filtros de pantalla propios. Ver [ESTILOS.md §7](../arte/ESTILOS.md#7-los-momentos-musicales-un-estilo-por-canción).

---

## 6. Accesibilidad (obligatorio)

| Ajuste o situación | Qué hace el motor | Qué haces tú |
|---|---|---|
| «Reducir movimiento» | Sacudidas, zoom y giros ×0,3; líneas de velocidad a la mitad; misma línea de tiempo. | Lee `k.reduceMotion` en tus verbos y clips propios y suaviza lo que gira o tiembla. |
| «Reducir destellos» | Todo destello es suave; los cuadros de impacto no se conceden (quedan las líneas). | Haz tus destellos con los verbos `flash` e `impact` del kit, que pasan por la guardia. |
| Siempre | `FlashGuard`: máximo 3 destellos de pantalla completa por segundo; nunca rojo saturado (`safeFlashColor`). | No esquives la guardia. |
| Sin sonido | El reloj interno corre la misma coreografía; el verbo `beat` marca el pulso en el marco. | Pon `on({ beats: … }, 'beat')` y que todo se entienda sin audio. |
| Avisos | Grandes, de alto contraste, en un ancla fija, nunca encima de una cara. | Etiquetas de 1 a 3 palabras. |

---

## 7. Cómo se dispara

- **Desde un flujo** (una escena, una cine, el final de una parte): `await playMomento('mi_cancion')`. Devuelve un `MomentoResult` (`grade`, `pct`, `counts`, `results`, `end`, `clock`). Opciones: `replay`, `crew`, `beforeCut` (prepara el juego debajo antes del corte), `noInvite`.
- **Desde una batalla:** la definición lleva `battle: { id, fase }` y la batalla tiene esa fase en `StageRules.fases`. Cuando la fase entra, `BattleScene` llama a `runBattleMomento`. Hoy la fase de cada Momento de batalla lleva `endsBattle: true` (`battle/fases.ts`): **el Momento termina la pelea con tu victoria**, igual en pantalla y en la estimación.
- **Al terminarlo** se guarda `ext.momentos.<id>` y se desbloquea lo que diga `unlocks` en la Fonoteca. Desde ahí aparece en **Ajustes › VOLVER A VER** (`panels/Replays.ts`, `seenMomentos`), donde sí se puede salir desde la pausa.
- **La primera vez no se puede saltar**, solo pausar (Esc, el botón «II» o cambiar de pestaña).
- **Solo suena el Momento:** `playMomento` apaga la música, el ambiente y los efectos del juego mientras dura, y sube la canción hasta +6 dB.

---

## 8. Probar

- `?momento=<id>` en `npm run dev`: el Momento solo, con las reglas de la primera vez. `&auto=great|hit|miss|none` lo juega solo, `&replay=1` como repetición, `&mq=low|high` fuerza la calidad, `&scrub=1` + `__momento.render(m)` dibuja cualquier instante.
- `?momento=lab&cats=a,b`: el laboratorio del horneado.
- `npm test`: `tests/momentos.test.ts` (validador con cero advertencias y la misma partida con corridas perfectas, fallidas y sin tocar nada), una prueba por canción (`momentoHemkade.test.ts`, `momentosWIL.test.ts`…) y `originalsReserved.test.ts`.
- Mira cada sección con `auto=great` y `auto=miss`, en calidad alta y baja, con «Reducir movimiento» y sin sonido.

## 9. Checklist

- [ ] La canción es una original del autor y se acordó en un issue **Idea**.
- [ ] `tracks.json` con la canción y su remezcla `<id>.battle`; mapa de pulsos y `<id>.onsets.json`.
- [ ] `songs/<carpeta>/` con `score.ts`, `stage.ts`, `verbs.ts` e `index.ts`; la línea en `songs/index.ts`.
- [ ] Ocupa la canción completa y la segunda mitad escala.
- [ ] Estilo propio documentado (agrega su fila a [ESTILOS.md §7](../arte/ESTILOS.md#7-los-momentos-musicales-un-estilo-por-canción)).
- [ ] `resolveScore` sin advertencias; `npm test` pasa, incluida `originalsReserved.test.ts`.
- [ ] El resultado no cambia la partida: solo `ext.momentos`.
- [ ] «Reducir movimiento», «Reducir destellos» y sin sonido revisados.
- [ ] Título y `source` sin spoilers.

Biblia completa del motor, con las hojas de coreografía de cada canción: [docs/part-ii/29-momentos-musicales.md](../part-ii/29-momentos-musicales.md) (interno, con spoilers de la Parte II). El audio: [docs/part-ii/19-audio-arquitectura.md](../part-ii/19-audio-arquitectura.md) y [24-batallas-musicales.md](../part-ii/24-batallas-musicales.md).
