# 29 · Momentos musicales (INTERNO — contiene spoilers de la Parte II)

> Agente MOMENTOS, 2026-10-10 (2.ª pasada: sincronía por onsets, volumen, canción completa). Motor en
> `game/src/momentos/**`, primer Momento: **LIKY FIGHT** (H44). Sin commit.
> Este documento basta para construir los otros cinco Momentos sin leer nada más (los contratos de audio están en
> los docs 18, 19 y 24, pero aquí se resume lo que hace falta).

## Para el dueño (sin sorpresas de historia)

- Un **Momento musical** es casi un video interactivo con una de tus canciones originales. No es una batalla y **no se
  puede saltar** la primera vez (sí se puede pausar: Esc, el botón «II» o cambiar de pestaña).
- Hay **pulsos para tocar**: tocar, mantener, machacar y elegir izquierda o derecha. Lo que hagas solo cambia **la
  animación** (un batazo perfecto con cuadro de impacto, o un rebote cómico). **El resultado siempre es el mismo**: no
  cambia premios, partida ni batallas. Al final sale una nota de ritmo (S, A, B, C) que es solo de adorno.
- Tiene **otro estilo**, distinto al del juego: anime de colores planos con línea de color, tramas de manga, cortes
  diagonales, cuadros de impacto, onomatopeyas grandes con katakana y paletas que cambian con cada parte de la canción.
  Los gatos son los mismos (tus pinturas MAI y sus esqueletos), pasados por ese tratamiento.
- El primero es **LIKY FIGHT** en **H44 (Islas Invertidas)**. La pelea ahora tiene dos fases: empieza en el mar y, a
  mitad de pelea, entra el Momento (≈ 1:56). Al terminar, la batalla sigue **en el cielo**.
- **Dura la canción entera** (LIKY FIGHT: 3:57) y corta a la batalla justo cuando termina la canción.
- **Cada sonido tiene un propósito**: cada bombo sacude la cámara y hace botar los barcos, cada golpe de caja es un
  cañonazo o una salpicadura, cada nota del bajo mece los cascos y el mar, la melodía hace brillar. Está medido: el
  cuadro que reacciona sale a menos de un cuadro de pantalla (≤ 19 ms) del sonido.
- **Suena más fuerte**: durante el Momento la canción sube hasta +6 dB (sin pasar del margen de pico) y nada la baja.
- Sin sonido también funciona: el Momento sigue su propio reloj y el cuadro marca el pulso.
- Se puede volver a ver en **Ajustes › VOLVER A VER** («♪ LIKY FIGHT»); ahí sí se puede salir desde la pausa.

---

## 1. Visión y reglas

| Regla | Cómo se cumple |
|---|---|
| Las **originales** son solo para Momentos | El juego normal usa las versiones `*.battle`, `*.explore`, etc. Un Momento cuea `track: '<id>'` (la original) |
| **Mismo resultado** siempre | El núcleo (`core.ts`) no toca la partida. Lo único que escribe es `ext.momentos.<id>` (`at`, `best`, `plays`) y solo `best` depende de los inputs. `tests/momentos.test.ts` compara partidas de corridas perfectas, fallidas y sin input |
| **No se salta** la primera vez | Sin botón de saltar. Pausa sí. `replay` (Ajustes) o un Momento ya visto (`ext.momentos`) muestran SALIR en la pausa |
| La dopamina es «¡salió una animación!» | Cada input tiene 2–3 ramas visuales; la mejor trae cuadro de impacto, smear y onomatopeya |
| Se cuenta con **animación**, no texto | Solo onomatopeyas y llamadas de 1–3 palabras. El validador marca etiquetas de más de 3 palabras |
| Prompts **un compás antes** | `lead` por defecto 1 compás (el bombardeo de LIKY usa medio compás: la bala misma avisa) |
| Ventanas | ±60 ms perfecto, ±150 ms bien; con «Ajuste de ritmo» (`settings.rhythmOffsetMs`) y 8 ms de lag de input |
| Sonido primero | Invitación al sonido (`ensureAudioInvited`) antes del Momento. Si dice que no: reloj interno con pulsos visuales |
| Nunca tartamudea | La canción se **descarga y decodifica antes** (`audioApi.prepare`) mientras se arma la escena |

## 2. Los seis Momentos

| Canción | Misión | Cuándo | Estado |
|---|---|---|---|
| LIKY FIGHT | H44 | Capitana Cascada: fase mar → cielo | **HECHO** (`songs/likyFight/`) |
| WHEN I LOSE | H35 | El Bibliotecario primordial: fase «La Sala de Lectura» → «La memoria del Archivo» | **HECHO** (`songs/whenILose/`, §14) |
| te ODIO | H55 | Disruptores: fase «El vacío» → Momento → fase glitch (`battle: { id: 'ruptura_disruptores', fase: 'glitch' }`, BattleScene → `runBattleMomento`) | **HECHO** (`songs/teOdio/`, §17) |
| Hemkade | H57 | Leviatán: capa mar → cielo (interludio FASES en `cielo`, `H57_MOMENTO`) | **HECHO** (`songs/hemkade/`, §16) |
| CIRCUS MALUS | H62 | Correctores: «La Corrección» → Momento → «El Plan» (interludio FASES, `H62_MOMENTO`) | **HECHO** (`songs/circusMalus/`, §15) |
| YONOSE TODO | H64 → H65 | El final, que fluye a los créditos de la Parte II (`registerFinaleMomento` en `app/o4Finale.ts`) | **HECHO** (`songs/yonoseTodo/`, §18) |

Duración: **la canción completa** (pedido del dueño: «la animación tiene que ocupar TODA LA CANCIÓN»). La segunda mitad
nunca repite la primera: escala la historia con escenas, ángulos y momentos nuevos, y el clímax de la canción es el
clímax del Momento. Corte duro cuando termina el audio. Cada canción tiene otro ánimo: cada Momento debe tener **sus
propias escenas y su propio estilo** (§3.1), pero sí el motor, el kit y la gramática.

## 3. Guía de estilo: «NEÓN CEL»

El juego es pintura y papel (tinta negra, textura de papel, pósters). Los Momentos son lo contrario:

1. **Línea de color, nunca negra.** La tinta de cada paleta es su color más profundo (índigo, ciruela, café quemado).
   Los gatos llevan contorno grueso del color tinta (horneado, ver §5.6).
2. **Celda plana + 1 sombra + 1 luz.** Nada de degradados suaves: los cielos son **bandas duras** (`bands()`), las nubes
   tienen una banda de sombra recortada, los cascos una franja de sombra y un filo de luz.
3. **Paleta limitada por sección** (`anime/palette.ts`): 6 colores + rampa de cielo + rampa de mar + gradación de post.
   Verso apagado, drop saturado, break casi monocromo. El cambio de sección mezcla la paleta en ~0,25 s.
   Paletas incluidas: `noir`, `neon`, `dusk`, `rise`, `drop`, `moon`, `chase`, `gold`, `finale`, `stratos`, `dawn`. Un set puede definir más.
4. **Tramas de manga** (puntos a 45°) en las sombras: en post (fuerza `grade.tone` de la paleta) y horneadas en lo más
   oscuro de los gatos.
5. **Tiempo «en dos»**: los personajes cambian de pose a 12 fps (`Actor.pose`), las líneas de velocidad parpadean a
   12 fps, los FX corren lisos. Eso es lo que da el ritmo de Arc System Works / Spider-Verse.
6. **Cuadros de impacto**: 2–4 cuadros en 2 tonos (tinta/papel) + el acento donde había color, a veces invertido, con
   líneas de concentración. Máximo 3 por segundo (guardia).
7. **Composición**: cut-ins en franja diagonal con la cara grande sobre líneas de velocidad; páginas de manga (2–4
   viñetas) que entran por compás; letterbox para los respiros; dutch angles, golpes de zoom, latigazos de cámara.
8. **Tipografía**: onomatopeya en Anton sobre una pincelada de color, con una copia desfasada en el acento
   (desregistro de imprenta) y una katakana chica en Dela Gothic One (`ドン`, `バシッ`, `ズズッ`).
9. **Luz sin línea**: los FX (fuego, destellos, haces, chispas) no llevan contorno; la materia (barcos, nubes, gatos) sí.
10. **Geometría de luz**: astillas triangulares de color (prop `shards`) y llamas de triángulos apilados (estilo
    Promare) para la energía.

Prohibido: textura de papel, tinta negra pura en los sets, el UI de papel del juego, texto narrativo.

### 3.1 Estilos para los próximos Momentos (pedido del dueño)

NEÓN CEL es **el estilo de LIKY FIGHT**, no el de todos. Cada Momento tiene **su propio estilo de arte**, elegido por su
historia y su canción; el motor (shaders, paletas, verbos, actores horneados) se reusa, el look no.

- **Canción frenética → más dopamina e interacción**: más inputs por minuto, más cuadros de impacto, cortes cada 1–2
  tiempos, ramas visuales más exageradas.
- **Canción lenta → más historia**: menos inputs, más tiempo en planos que cuentan; **más formas y más estilos de
  animación** (acuarela que se mueve en dos, papel recortado, tinta que se esparce, siluetas, rotoscopia de luz…).
- **El ambiente puede cambiar de estilo dentro de la misma escena**: los mismos elementos redibujados en otro arte
  (p. ej. el barco pasa de pintura a línea de tiza en un break y vuelve en el drop). Se hace con un segundo juego de
  capas del set dibujado en el otro estilo y una llave (`style: 0..1`) que cruza entre los dos en un golpe.
- Ideas por canción (por validar con el dueño): WHEN I LOSE (lenta, íntima) → tinta y acuarela en dos, páginas que se
  pasan; te ODIO (glitch, agresiva) → pixel/glitch de video, cortes de datamosh; Hemkade (épica, oceánica) → grabado en
  línea fina con luz volumétrica; CIRCUS MALUS (circo) → cartel de feria litografiado y marionetas recortadas;
  YONOSE TODO (final) → recorre los estilos de los Momentos anteriores y termina en el del juego.

## 4. Arquitectura

| Archivo | Qué hace | Pixi |
|---|---|---|
| `momentos/types.ts` | Tipos de autoría (`When`, `Act`, entradas) y de ejecución (`Cue`, `Prompt`, `ResolvedScore`, `MomentoResult`) | no |
| `momentos/time.ts` | Tiempo musical: `resolveWhen`, compases, golpes (`songHits`, `selectHits`, `expandEach`), edición (`resolveEdit`, `songToM`, `mToSong`) | no |
| `momentos/score.ts` | Ayudas de autoría (`at`, `on`, `key`, `tap`, `hold`, `mash`, `choice`, `v`), `resolveScore` (+ validador), `propAt`, `ease` | no |
| `momentos/core.ts` | Máquina de prompts y juicio (`MomentoCore`), autoplay para QA, nota | no |
| `momentos/clock.ts` | `MomentoClock`: audio / interno / pendiente, edición por segmentos, pausa, entrada tardía | no |
| `momentos/flash.ts` | `FlashGuard` (≤ 3 destellos/s), rojos saturados prohibidos | no |
| `momentos/save.ts` | `ext.momentos` (opcional, normalizado), `commitMomento` | no |
| `momentos/registry.ts` | `registerMomento`, `momentoForFase`, `seenMomentos` | no |
| `momentos/install.ts` | Registra las canciones y normaliza la partida al cargar (lo importa `main.ts`) | no |
| `momentos/songs/index.ts` | Una línea por canción | no |
| `momentos/runner.ts` | `MomentoRun`: escena, clips, input, pausa, post, calidad, limpieza | sí |
| `momentos/index.ts` | `playMomento(id, opts)` | sí |
| `momentos/battle.ts` | `runBattleMomento` (el gancho de batalla) | sí |
| `momentos/dev.ts` | Rutas DEV y laboratorio del tratamiento | sí |
| `momentos/anime/kit.ts` | `Clip`, `ClipHost`, `Camera`, `TextCache`, `Kit`, `StageApi` | sí |
| `momentos/anime/fx.ts` | Verbos del kit (cámara, cuadro, líneas, formas, tipo) | sí |
| `momentos/anime/cutin.ts` | `cutin`, `panels` | sí |
| `momentos/anime/shaders.ts` | Post (gradación, tramas, viñeta, impacto, desregistro, destello) y horneado cel | sí |
| `momentos/anime/actor.ts` | `Studio` (pinturas horneadas) y `Actor` (puppet en dos) | sí |
| `momentos/anime/prompts.ts`, `pause.ts` | UI de prompts y pausa | sí |
| `momentos/anime/palette.ts`, `draw.ts` | Paletas, colores, dibujo (bandas, nubes, estrellas, pinceladas, líneas) | sí |

El núcleo puro se prueba en node; todo lo que dibuja vive en `runner` + `anime` + el set de cada canción.

## 5. API del motor

### 5.1 Reproducir

```ts
import { playMomento } from '../momentos';
const r = await playMomento('liky_fight', {
  replay?: boolean,          // Ajustes › Volver a ver: SALIR en la pausa
  crew?: string[],           // slugs de la tripulación del jugador (cut-ins con '$crew0', '$crew1')
  beforeCut?: () => void,    // ~0,4 s antes del corte: prepara el juego debajo (una batalla pone su nueva fase aquí)
  noInvite?: boolean,        // el llamador ya invitó al sonido
  autoplay?, scrub?, quality?, standalone?   // QA / DEV
});                          // → MomentoResult | null  ({ grade, pct, counts, results, end, clock })
```

Orden: `hush('momento')` → invitación al sonido → `audioApi.prepare(track)` (en paralelo con…) → foto del cuadro actual
(arranque en frío) → arma el set y hornea los actores → oculta la escena del juego → toca → corte duro → guarda la
completitud + Fonoteca → música (`tail`) → libera todo.

### 5.2 Definición (`MomentoDef`)

```ts
export const MI_MOMENTO: MomentoDef = {
  id: 'when_i_lose',                       // para siempre (partida)
  track: 'when_i_lose',                    // la ORIGINAL
  title: 'WHEN I LOSE',                    // sin spoilers (Volver a ver)
  mission: 'H35',
  battle: { id: 'ruptura_bibliotecario', fase: '<id de fase>' },   // opcional: el gancho de batalla lo encuentra solo
  edit: [{ from: 0, to: 'chorus' }, { from: 'climax', to: 'outro' }],  // segmentos (bordes en compás)
  cut: 'outro+2',                          // el último cuadro (corte duro)
  tail: 'release' | 'keep',                // la música después del corte (keep = el llamador sigue)
  palettes: { verse: 'dusk', chorus: 'drop' },   // por sección (pone llaves 'pal')
  score: [ ... ],                          // la coreografía (§5.3)
  stage: () => import('./stage').then((m) => m.default),  // el set (perezoso)
  unlocks: ['when_i_lose'],                // Fonoteca al completar (solo refs que el catálogo conoce)
  props: { 'cam.zoom': 1.2 },              // valores iniciales de props
};
```

Regístralo en `songs/<carpeta>/index.ts` con `registerMomento(DEF)` y agrega `import './<carpeta>'` en `songs/index.ts`.

### 5.3 Direcciones de tiempo (`When`)

| Forma | Ejemplo | Significa |
|---|---|---|
| número | `115.85` | segundos de la canción |
| sección / marcador | `'chorus'`, `'silence_1'`, `'first_drop'` | su inicio (las secciones ganan en un choque de nombres) |
| desplazamiento | `'chorus+2'`, `'chorus+2:1.5'`, `'shout_1-0:1'` | ± compases `:` tiempos |
| compás absoluto | `'#24'`, `'#24:2'` | compás 24 (base 0) / su tiempo 2 |
| objeto | `{ section: 'drop', bar: 1, beat: 2 }`, `{ bar: 39 }`, `{ marker: 'build_1', beats: -1 }` | lo mismo, sumando |

Los mapas están en `src/data/music/beatmaps/<id>.json` (doc 18 §0.2). Todas las canciones van en grilla exacta desde 0.

### 5.4 La partitura

```ts
import { at, on, key, tap, hold, mash, choice, v } from '../../score';

at('big_hit_1', 'impact', v('sfx', { text: '¡FIESTA!', kata: 'パーティー' }))     // actos en un momento
on({ hits: { in: 'chorus', kind: 'kick', min: 0.8 } }, v('punch', { z: 0.015 }))  // en cada coincidencia
on({ beats: { in: 'break', every: 2 } }, 'notes')                                  // también bars / times
on({ onsets: { track: 'kick', in: ['#1:2', '#4:2'], min: 0.3, minGap: 0.4, limit: 9 } }, 'lightUp')  // en cada onset
key('verse', { 'shipB.y': -300, 'cam.zoom': 0.86 }, { beats: 12, ease: 'inOut' }) // props (tween o cambio)
tap('silence_1', { id: 'stop1' }, { great: [...], hit: [...], miss: [...] })
hold('#22', 'first_drop', { id: 'brace', label: '¡FIRMES!' }, {...})                 // mantener hasta `until`
hold('build_2', 'drop_3', { id: 'leap', release: true }, {...})                       // ...y soltar en el golpe
mash('#40', '#43', { id: 'volley', need: [10, 22], label: '¡FUEGO!' }, {...})
choice('#46', { id: 'dodge', fallback: 'left' }, { left: [...], right: [...] })
```

- **Actos**: `'verbo'` · `['verbo', args]` · `v('verbo', args, { beats | dt })` (retraso).
- **Filtro de golpes** (`hits`): `in` (sección o `[desde, hasta)`), `kind` (`kick snare stab phrase drop build stop
  reentry shout`), `min`/`max` (fuerza), `every`, `minGap`, `limit`, `except`. Las canciones sin `hits` de MUSIC
  reciben golpes sintetizados (compases, tiempo 3, saltos de energía, `big_hit_*`, silencios).
- **Filtro de onsets** (`onsets`): `track` (`kick snare perc bass melody vox`), `in`, `min`/`max` (fuerza 0..1),
  `every`, `minGap`, `limit`, `except`. El cue lleva `cue.onset` (`t`, `strength`, y en el bajo `dur` y `midi`). Si la
  canción no tiene archivo de onsets, el validador avisa.
- **Props**: `cam.x/y/zoom/rot` (cámara base), `pal` (paleta), `bars` (letterbox 0..1) y las del set. Las llaves se
  encadenan (cada una parte de donde iba la anterior). Las cadenas cambian en seco.
- **Inputs** (`InputSpec`): `id`, `lead` (compases, def. 1), `optional` (bonus: nunca resta), `anchor` (ancla del set o
  `[x, y]`), `label` (1–3 palabras), `until`, `release`, `need`, `fallback`.
- **Cuándo empiezan las ramas**: tap perfecto/bien → **en el golpe** (o al presionar si fue tarde) · tap fallado → al
  cerrar la ventana (+150 ms: el «beat cómico» antes del fallo) · hold/mash → en `until` · choice → en la decisión.
  `always` corre en todas las ramas.
- **`freeze`** (`at('silence_1', v('freeze', { dur: 0.256 }))`): el mundo se congela (el `update` del set recibe el
  tiempo congelado); clips de pantalla siguen.

`resolveScore` lo convierte todo a tiempo de Momento y **valida**: nombres inexistentes, fuera de la edición, edición
fuera de compás, inputs que cierran después del corte, taps a menos de 0,3 s, un tap dentro de un hold/mash/choice,
etiquetas largas, ramas faltantes. Los tests exigen **cero advertencias**.

### 5.5 Verbos del kit (`anime/fx.ts`, `anime/cutin.ts`)

Posiciones: `at: 'ancla'` (del set, pantalla) · `at: [x, y]` (caja 1920×1080) · `at: () => [x, y]` (vivo) ·
`world: true` → coordenadas del mundo (capa de cámara). Duraciones: `dur` (s) o `beats`. Colores: número o nombre de la
paleta (`'accent'`, `'accent2'`, `'light'`, `'ink'`, `'base'`, `'shadow'`).

| Verbo | Args (defaults) |
|---|---|
| `punch` | `z` 0.08, `dur` 0.28 — golpe de zoom |
| `shake` | `amp` 16, `dur` 0.4, `freq` 24 |
| `roll` | `r` 0.06, `dur` 0.5 — dutch |
| `whip` | `dx` −520, `dy` 0, `dur` 0.22 — latigazo + líneas |
| `aberr` | `amount` 1, `dur` 0.2 — desregistro RGB (solo calidad alta) |
| `impact` | `dur` 0.07, `invert`, `accent`, `lines` (true), `at`, `inner` — cuadro de impacto (guardado) |
| `flash` | `amount` 0.7, `color` 'light', `dur` 0.16 — guardado; >0,25 pide permiso |
| `speed` | `dur`, `ang` 0, `n` 60, `alpha` 0.85, `color` 'light', `thick`, `layer` |
| `focus` | `dur`, `at`, `inner` 340, `n` 90, `color` 'ink', `alpha` |
| `ring` | `at`, `world`, `r0` 30, `r1` 260, `width` 26, `color`, `color2`, `double` |
| `burst` | `at`, `world`, `r` 120, `spikes` 9, `color`, `color2`, `ink` — estrella de impacto cel |
| `sparkle` | `at`, `world`, `n` 6, `r` 26, `spread` 140, `dur` |
| `confetti` | `at`, `world`, `n` 40, `vx`, `vy` −900, `spread` 600, `g` 1400, `dur` 1.6 |
| `notes` | `at`, `world`, `n` 4, `dur` 1.2 — notas que suben |
| `sfx` | `text`, `kata`, `at`/`x,y`, `size` 120, `color`, `ink`, `accent`, `back` (pincelada; false = sin), `rot`, `scale`, `dur` 0.7 |
| `beat` | pulso de marco en cada tiempo **solo sin sonido** (ponlo `on({ beats: … }, 'beat')`) |
| `cutin` | `who`, `side` ('left'/'right'), `y`, `h` 400, `tilt`, `color`, `edge`, `lines` ('speed'/'focus'/'none'), `face`, `emote`, `look`, `flip`, `text`, `kata`, `dur`/`beats` (1 compás) |
| `panels` | `layout` ('diag2'/'diag3'/'h2'/'v3'/'grid4'), `cells` [{ `who`, `color`, `emote`, `flip`, `face`, `sfx` }], `stagger` (tiempos), `dur`/`beats` |
| `freeze` | `dur` / `beats` (lo resuelve el runner) |

`who` acepta `'$crew0'` / `'$crew1'` (tripulación del jugador) y los nombres del reparto del set (`stage.slugs`).

### 5.6 Escribir el set (`StageApi`)

```ts
export default function createStage(k: Kit): StageApi { return new MiSet(k); }
class MiSet implements StageApi {
  verbs = { miVerbo };               // verbos propios (se mezclan sobre los del kit)
  props = { pal: 'noir', 'cam.zoom': 1.2, miProp: 0 };
  async build(k) { await k.studio.loadAll([...slugs]); /* dibuja una vez en k.layers.* */ }
  update(k, m) { /* el mundo en el tiempo m: props (k.num('x')), derivados del score */ }
  late(k, m)  { /* después de los clips: aplica poses pedidas, anclas */ }
  anchor(name, k) { return [x, y]; }   // para prompts y verbos de pantalla
  destroy() {}
}
```

- **Todo es función del tiempo.** Un clip es `{ t0, t1, mount, update(lt), unmount }` (`clip(t0, dur, {...})`). El
  `ClipHost` monta lo activo y desmonta lo demás: se puede pausar, saltar y dibujar cualquier instante (`scrub`). Nada
  de tweens de GSAP con estado; partículas en forma cerrada (`p0 + v·t + ½·g·t²`) con `rng(cue.id)`.
- **Capas** (`k.layers`): `bg` (pantalla, debajo) · `world` (cámara) · `wfx` (cámara, encima del set) · `screen` ·
  `panels` · `type` · `ui` (prompts/pausa: sin post, sin impacto).
- **Estado del mundo** derivado del score: p. ej. LIKY cuenta los `lightUp` ya pasados para saber cuántas luces hay;
  así un salto atrás no rompe nada.
- **Actores**: `k.studio.loadAll(slugs)` hornea cada pintura (`bakeCel`: Kuwahara → sombras cel sobre la pintura →
  línea de color → contorno → luz de borde → trama). `new Actor(k.studio, slug, alto)` = puppet que cambia de pose en
  dos (`actor.pose(m, x, y, { rot, sx, sy, flip })`), `actor.emote('happy'|'hurt'|'surprise'|'sleepy'|'attack')`,
  `actor.head()`. `k.studio.silhouette(slug)` da la silueta blanca (tíñela para smears/fantasmas). El tratamiento se
  probó en `?momento=lab` (§11): «cel over paint» con `flat 0.5` conserva ojos y cara; el posterizado completo (`flat 1`)
  quedó lodoso en el pelaje y se descartó.
- **Poses por pedido**: los clips piden `wantPose(who, { name, lt })` en su `update`; el set las aplica en `late`.
  LIKY trae un catálogo (`POSES`: brace, swing, parry, dizzy, cool, trip, taunt, dance, recover, hero, land, splat…).
- **Interacción viva**: `k.prompt(id)` (estado del input: `from`, `taps`…) y `k.judged(id)` dejan que un clip cambie
  según lo que el jugador está haciendo (el aura que crece al mantener, la bala que desaparece si fue bateada).
- **Cámara**: llaves `cam.*` para el encuadre; `k.cam.punch/shake/roll/offset` para lo aditivo. `k.cam.toScreen(x, y)`
  convierte mundo → pantalla (para anclas).
- **Efectos de cuadro**: `k.fx.impact/flash/aberr` (máximos por cuadro; los verbos `impact`/`flash` pasan por la guardia).
- **Reacciones siempre encendidas (regla: cada sonido tiene un propósito)**. Sin escribir un cue por golpe, el set lee
  las pistas de onsets en cada cuadro:
  - `k.env(track, m, tau = 0.1, min = 0)` → 0..1: suma de `fuerza·e^(−edad/τ)` de los últimos onsets (tope 1), así un
    bombo fantasma en un redoble también **salta**. `k.last(track, m, min)` → `{ i, o }` el último onset (con `o.midi`,
    `o.dur` en el bajo). `k.onsetList(track)` → la lista entera.
  - `k.beatStep(m)` → el tiempo «en dos» que **arranca en cada tiempo** (pásalo a `actor.pose(..., { step })`): sin eso
    una pose podía llegar hasta 83 ms tarde al golpe.
  - LIKY: `kick` → golpe de cámara (`cam.punch(0.011·env)`), pulso de luz, bote/squash de los cascos, bocinas que
    bombean; `snare` (acentos del dembow) → cañonazo de la galera, salpicadura junto a nosotros, impacto; `bass` →
    balanceo de los cascos según la nota (más grave = más balanceo), oleaje, tinte del cielo, temblor con el sub
    (`midi < 38`); `melody` → destellos y los cut-ins. Los planos a pantalla completa (`shots.ts`) llevan el mismo
    contenedor reactivo (zoom con el bombo, balanceo con el bajo).
  - Los momentos grandes (inputs, cut-ins, cambios de plano) van **sobre** onsets reales (`BARRAGE`, `COUNTER`… en
    `score.ts` son tiempos de acentos medidos), nunca sobre la grilla teórica.
- **Nada se crea en el golpe**: las palabras (`sfx`, `cutin`, `panels`, notas) se hornean antes del reloj (el runner
  recorre todos los cues y hace una pasada en seco de cada rama de input; `sfx` hornea en el cuerpo del verbo, con la
  paleta fija de su instante, `k.palFor(cue)`). Una palabra de 120 px costaba 10–40 ms justo en el cuadro del golpe.

## 6. Audio

- `audioApi.prepare(track)` / `unprepare(track)` *(ext)*: descarga y decodifica **una vez** y guarda el buffer
  (ref-contado). Cualquier deck buffer de ese archivo arranca sin descargar ni decodificar.
- **Saltos dentro de la misma canción** (`restart: true`): el player **reutiliza el buffer del deck que suena** y entra en
  el siguiente compás (antes: 1–2 s de re-decodificación; mejora pendiente del doc 24 §7, ahora resuelta para todas las
  batallas musicales).
- `audioApi.pauseMusic(on)` *(ext)*: pausa/reanuda el deck actual.
- **Edición**: el reloj pide el siguiente segmento medio compás antes del borde con `quantize: 'bar'`; el player lo pone
  exacto en esa barra (los bordes deben caer en compás: el validador lo exige).
- **Reloj** (`clock.ts`): `audio` (posición oída − ajuste de ritmo, mapeada por segmentos) · `internal`
  (`performance.now()`, mismo guion) · `pending` (≤ 2,6 s). Si el sonido aparece a mitad (el jugador desbloquea el
  audio), la canción entra donde va y el reloj se sube. 12 ms de adelanto visual (un cuadro de pantalla).
- **Cola** (`tail`): `release` = suelta el cue con fundido; `keep` = la canción sigue y el llamador decide (H44: la
  música de batalla entra en el siguiente compás de LIKY).
- **Volumen (regla)**: `audioApi.musicBoost(db)` *(ext)* sube la canción del Momento. `playMomento` calcula
  `momentoBoostDb()` = lo que el bus de música × maestro está por debajo de 0 dB, con tope **+6 dB**, y lo pone antes de
  tocar; vuelve a 0 al terminar (también si falla). Nada la atenúa (sin ducking: `hush('momento')` silencia lo demás) y
  los efectos del Momento van **debajo** de la canción (los «booms» caen en los bombos de la propia canción). Medido en
  LIKY con el refuerzo: pico de salida −14,9 dBFS, RMS −27,7 dB: mucho margen.
- **Latencia**: `audibleNow` toma la estimación **más tardía** entre `getOutputTimestamp()` y
  `currentTime − outputLatency − baseLatency` (+5 ms): en Bluetooth o en Mac con buffers grandes el sello de tiempo
  llega optimista. El reloj del Momento usa esa posición oída.
- **Batallas**: `BattleMusic.suspend()` / `resume()` (doc 24). Mientras el Momento suena la batalla no reacciona ni
  re-cuea. Al volver, las señales que llegaron (p. ej. `fase:cielo`) se evalúan y el primer salto re-sincroniza el reloj
  desde cero; si no hay regla, vuelve la canción del plan en su loop.

### 6.1 Pistas de onsets (`<id>.onsets.json`)

Junto a cada beat map: `game/src/data/music/beatmaps/<id>.onsets.json` (las 6 canciones). Se generan con
`python3 onsets.py [id…]` en `~/Desktop/No one - raster (fuera del repo)/audio-derivados/scripts/` (numpy + ffmpeg; lee
los stems de `audio-derivados/<id>/` si existen y si no la mezcla). No modifica las originales.

```json
{ "id": "liky_fight", "bpm": 131, "hop_ms": 5.8, "grid": 16, "source": "demucs stems (doc 18 §3), scripts/onsets.py",
  "tracks": {
    "kick":   [[t, fuerza], ...],             // cada bombo (banda baja + forma espectral; en cuartos con r > −12 dB)
    "snare":  [[t, fuerza], ...],             // acentos: caja/güira/tambora fuera del cuarto + ataques de banda media
    "perc":   [[t, fuerza], ...],             // 6–14 kHz (hats, güira)
    "bass":   [[t, dur, midi|null, fuerza], ...],   // cada nota del bajo: duración y altura (YIN)
    "melody": [[t, fuerza], ...], "vox": [[t, fuerza], ...] },
  "stats": { "kick": { "n": 482, "per_bar": 3.72, "on_16th_grid": 0.996 }, ... } }
```

Tiempos en segundos de la canción, alineados al **ataque** (refinado ±12 ms) y ajustados a la grilla de 1/16 cuando caen
a < 22 ms de ella. LIKY: 482 bombos (3,7 por compás, 99,6 % en la grilla de 1/16), 735 acentos, 926 notas de bajo.
Herramientas: se evaluaron htdemucs_ft / allin1 / BeatNet / madmom / essentia / basic-pitch, pero con ~5 GB libres y
pytorch de por medio **no se instaló nada**; el pipeline numpy dio 100 % de bombos en la grilla de LIKY. Si algún día
hay disco, `basic-pitch` mejoraría las notas del bajo y la melodía.

**Cómo escribir con ellos**: los cues puntuales con `on({ onsets: {...} }, ...)`; las reacciones continuas en el
`update/late` del set con `k.env/last` (§5.6). Mira la tira de sincronía (§11) de tu sección antes de dar por bueno.

## 7. Integración

- **Batalla** (`BattleScene`, marca `// MOMENTO:`): en el evento `fase`, si `momentoForFase(battle, faseId)` existe, la
  fase no se escenifica en el acto: espera a que aterrice el tiro (`checkBossPhase`) → `runBattleMomento` → el Momento
  pone la fase debajo de su corte (`beforeCut`). El sim ya cambió de fase solo (determinista); el estimado nunca ve
  nada de esto.
- **El Momento TERMINA la batalla** (regla del dueño, hotfix 2026-10-10): la fase de cada Momento de batalla (H35
  `memoria`, H44 `cielo`, H55 `glitch`, H57 `cielo`, H62 `el_plan`) lleva `endsBattle: true` (`battle/fases.ts`): al
  entrar, el sim declara la victoria del jugador (`reason: 'momento'`), sin los efectos de la fase; la pantalla y el
  estimado dan lo mismo. Como ya no hay pelea después, el umbral pasó al **80 %** del camino a la derrota (sin
  disparador por turno; antes 40 %/t4, 35 %/t4, 50 %, 34 % y 50 %/t5: con ellos la pelea duraba ~2 turnos) y, si el
  jugador gana antes por otra vía (núcleo, tripulación), la fase entra igual en ese tiro: **todo combate ganado termina
  con su Momento** (`fasesCheck`; la victoria conserva su motivo). Balance (`balance-jefes`, 16 semillas, Nv50/Nv80):
  antes 75–88 % de victorias en 6–13 turnos; ahora 94–100 % en 4–8. Después del corte no vuelve la música de batalla (`BattleMusic.resume(true)`), no hay cartel
  de capa y `BattleScene` va a la victoria («¡LA PELEA ES TUYA!»). Si el jugador sale del Momento (repetición, SALIR),
  también gana. El chip de la regla dice «GOLPE FINAL AL 80%». Pruebas: `tests/hotfixVivo.test.ts` y las de «misma
  pelea con y sin Momento» (iguales hasta el umbral, victoria ahí).
- **Solo suena el Momento** (hotfix 2026-10-10): `playMomento` toma `audioApi.solo(true, { key: 'momento', decks: true })`
  antes de todo: la música que sonaba (la de batalla, la de la isla) se apaga en 0,3 s, y los buses de efectos, ambiente
  (mar, olas, viento, loops), voces y la música procedural de la Parte I van a 0 (`core/audio.ts › solo`, nodo
  `procGate`). La canción del Momento es una cue nueva y suena normal. Se suelta en el `finally` (0,6 s).
- **Hush**: `hush('momento')` mientras dura (popups); el sonido lo calla el SOLO de arriba. Teclas capturadas en fase de captura (Espacio no acelera la batalla debajo).
- **Volver a ver**: `panels/Replays.ts` lista `seenMomentos(save)` como «♪ TÍTULO».
- **Fonoteca** (doc 18 §8): `unlocks` al completar por primera vez (si el catálogo conoce la ref y no estaba). LIKY
  FIGHT original ya se desbloquea en H38; el Momento lo asegura.
- **Partida**: `ext.momentos = { seen: { <id>: { at, best?, plays? } } }`, opcional, normalizado en cada carga
  (`install.ts`), sobrevive al reinicio narrativo (un Momento ya visto se puede dejar desde la pausa al repetir la
  historia).
- **Rutas DEV**: `?momento=<id>` (solo, reglas de primera vez) · `&replay=1` · `&auto=great|hit|miss|none` ·
  `&scrub=1` (`window.__momento.render(m)`) · `&mq=low|high` · `?momento=lab&cats=a,b&v=flat=0.5,radius=5;…` (laboratorio
  del tratamiento). `window.__momento`: `render`, `state`, `result`, `trace`, `pause`, `cut`.
- **Fixture**: `test-saves/rupturas-h44.json` (H44 activa, Kit de Vuelo puesto, Momento sin ver), generado con
  `npx vite-node scripts/make-h44-fixture.ts`.

## 8. Paso a paso: un Momento nuevo

1. Lee la canción en doc 18 §4 (secciones, marcadores, energía, voz) y abre su beat map.
2. Genera sus onsets (§6.1). La regla es **la canción completa** (sin `edit`), corte en su último aliento; la segunda
   mitad escala. Elige el **estilo de arte** propio (§3.1).
3. Escribe una hoja como la de §9: por sección, el plano, la paleta, qué marca cada golpe, dónde va cada input.
4. Crea `songs/<id>/score.ts` (la `MomentoDef`), `stage.ts` (el set), `verbs.ts` (verbos propios) e `index.ts`.
5. Agrega el import en `songs/index.ts`. Si va en una batalla: `battle: { id, fase }` y la fase en el spec de la batalla
   (`StageRules.fases`); si va en una cine/escena: llama `playMomento` desde ese flujo (marca `// MOMENTO:` del agente).
6. `npx vitest run tests/momentos.test.ts` — agrega tu Momento a la prueba «resolves with zero warnings» (o generalízala).
7. Mira cada sección con hojas de contacto (§11), en calidad alta y baja, con `auto=great` y `auto=miss`. Itera hasta que
   se vea increíble. Mide sincronía y FPS en tiempo real (§11).
8. Actualiza este doc (§2 y tu hoja).

## 9. Hoja de coreografía: LIKY FIGHT (H44)

131 BPM, compás 1,832 s. **La canción entera, 0 → 236,9** (sin edición). Corte duro en el último aliento del outro;
`tail: 'keep'` → la música de batalla entra en el siguiente compás. Además de lo que dice la tabla, **todo el tiempo**:
cada bombo = golpe de cámara + pulso de luz + bote de los cascos + bocinas; cada acento = cañonazo / salpicadura;
cada nota del bajo = balanceo y oleaje; la melodía = destellos (§5.6). Los daños de los barcos (cicatrices, astillas)
**se quedan** toda la canción.

Planos a pantalla completa (`songs/likyFight/shots.ts`, más de la mitad del coro y los drops): `topDown` (cenital de la
andanada), `pov` (sobre el hombro, la bala viene hacia cámara con túnel de velocidad), `swing` (el batazo en poses clave:
anticipación → smear → contacto con impacto → seguimiento; `out` = Canelo dispara, `obj: 'rock'` = roca), `party`
(primeros planos de Cascada: baile, guiño, burla; `who: 'canelo'` la copia), `lowAngle` (contrapicado bajo la galera que
sube), `chargeShot`, `leapShot`, `clashShot`, `hero` (el plano final).

### 9.1 Primera mitad (0–117,25)

| Sección (compases) | Paleta | Qué pasa | Input |
|---|---|---|---|
| **intro** (0–7) | `noir` → `neon` | Arranque en frío: el cuadro congelado de la batalla (gradado al estilo) se parte en diagonal en el primer bombo (impacto invertido, «¡PUM! ドン»). La galera de fiesta es una silueta en la noche; **cada bombo fuerte enciende una pieza** (9: faroles, ojos de buey, LEDs, papel picado ×2, disco, coco) con chispa y golpe de zoom. En `big_hit_1` el sol de la fiesta sube, todo se enciende, haces de luz, latigazo a plano general. Cut-ins: Cascada (fiestera), Canelo «¿¡EH!?» | **tap** `fiesta` (8,244): perfecto = confeti doble + impacto + «¡FIESTA! パーティー»; fallo = las luces parpadean tarde y «fiesta…» |
| **verse** (8–15) | `dusk` | El bajo entra y la galera **se arranca del mar** sobre una columna de agua que cae hacia arriba (corona de agua, «¡SPLASH! ザバーン»). Sube 3 compases; Luzterna señala arriba. Los dos **stops** (0,25 s) congelan el mundo y salta una página de manga con la reacción de Canelo. En `big_hit_2` ya vuela: «¡VUUUM! ブーン» | **tap** `stop1`, `stop2`: perfecto = Canelo canchero «¡JA!» / «¡YEAH!»; fallo = tropezón «¿¡EH!?» / cara de «…» |
| **prechorus** (16–23) | `rise` | La galera baja a distancia de tiro; cut-in «¡APUNTEN! ネラエ», ella señala. Los cañones (guardados apuntando arriba: cañones de confeti) **giran hacia nosotros** con «CLANK» en los bombos. Nuestra tripulación responde: 4 cut-ins encadenados subiendo (Canelo, Luzterna, `$crew0`, `$crew1`). La cámara se cierra sobre Canelo con dutch | **hold** `brace` (compás 22 → drop): mientras mantienes, Canelo se agacha y crece un escudo. Perfecto = burbuja-escudo que aguanta la andanada «¡FIRMES!»; fallo = el barco rebota, Canelo cae «¡WAAA!» |
| **chorus** (24–31) | `drop` | **ANDANADA** en el drop: cenital de los tres fogonazos, impacto invertido «¡BOOM! ドーン». Cada **acento** del dembow es una bala: 7 vienen a nosotros (5 en plano sobre el hombro → swing), las demás caen al mar al lado (splash). Entre balas: dutch sobre la cubierta, latigazo a la galera, página de manga con la tripulación, Cascada riéndose | **7 taps** `ball0–6` sobre acentos medidos (`BARRAGE`), anclados a la bala, medio compás de aviso: perfecto = batazo con smear de fuego + **cuadro de impacto** «¡ZAS! バシッ» y la bala vuelve a la galera «¡BAM!» (cicatriz); bien = la desvía «¡TOC!»; fallo = la bala pega, el barco rebota, Canelo ve estrellitas (cicatriz nuestra) |
| **break** (32–38) | `moon` | Sin batería: **ella se recupera**. Humo, mareo, se sacude; baila en dos; cut-in «SLURP ズズッ» sorbiendo el coco; guiño y «¡JA!»; se le cae el coco «BONK». En el compás 37 nuestro Kit de Vuelo infla el globo; en `build_1` (la batería vuelve un compás antes) cut-in «¡ARRIBA! アガレ» y despegamos | **taps opcionales** `confeti0–2`: tirarle confeti de vuelta (bonus) |
| **drop** (39–47) | `chase` | **Persecución en el cielo**: latigazo vertical, «¡VAMOS! ゴー», nubes de frente, viento. Al terminar la andanada de fuego ella **gira y sigue volando de cabeza** (para ella el cielo es el suelo) «¡JA! ハハ». Intercambio de balas cruzadas en los bombos | **mash** `volley` (compases 40–43, 10/22 toques): un aura de llamas crece con cada toque; perfecto = 9 bolas de fuego + impacto «¡FUEGO! ファイア», bien = 5, fallo = 2 tristes «¿fuego?». **choice** `dodge` (compás 46): izquierda = subir atravesando una nube, derecha = pasar por debajo de su casco |
| **break2** (48–54) | `gold` | Duelo: página de manga en 3 viñetas que entran por compás (Cascada, Canelo, Luzterna), monocromo + dorado, letterbox. Ella se endereza; tira el coco; doble cut-in «カカッテキナ / イクゾ» | **hold-release** `leap` (`build_2` → drop): mantén, se carga el fuego; suelta en el golpe. Perfecto = salto enorme con estela de fuego e impacto «¡AQUÍ ESTOY!»; fallo = aterriza de cara «¡PLAF!» |
| **drop2** (55–63) | `finale` | El salto en plano completo (`leapShot`), **nube de pelea** en su cubierta con primeros planos de choque en cada acento (`clashShot`); compás 62: espalda con espalda «¡LIKY FIGHT!». **115,85 (`shout_1`)**: ella lo manda de vuelta a su barco de un bocinazo — «¡OTRA VUELTA! ラウンド2» | **5 taps** `pelea0–4` (acentos medidos, `FIGHT`): perfecto = puño con impacto «¡POW!»; bien = puño chico; fallo = coscorrón «¡BONK!» |

### 9.2 Segunda mitad (117,25–236,9): escala

| Sección (compases) | Paleta | Qué pasa | Input |
|---|---|---|---|
| **intro2** (64–71) | `stratos` | Contrapicado: los dos barcos **suben por encima de las nubes** (mar de nubes, horizonte curvo, estelas). Stop 3 = viñeta. `big_hit_4`: fuegos artificiales «¡MÁS ARRIBA!»; Cascada de DJ en primer plano; latigazo en `big_hit_5`; cut-in de ella «オドロウ» | **tap** `stop3` |
| **verse2** (72–79) | `neon` | **Baile en la luna**: el bajo manda, los barcos giran uno alrededor del otro, cruzándose en altura. Guiño de Cascada en primer plano; stop 4 (viñetas) y stop 5 (página de 4 con la tripulación); `big_hit_6` fuegos. **`shout_2`**: cut-in «¡AHORA! イマ» | **taps** `stop4`, `stop5` |
| **prechorus2** (80–87) | `rise` | **La bola de disco se vuelve cañón** (`discoCharge`, 24 tiempos cargando luz); ella apunta. Nuestra respuesta: 4 cut-ins encadenados (Canelo, Luzterna, `$crew0`, `$crew1`), planos de carga | **mash** `carga` (#85 → chorus2, 10/22): perfecto = «¡CHOQUE! ゲキトツ», el rayo de Canelo parte el de ella; fallo = nos pega |
| **chorus2** (88–95) | `drop` | **EL CONTRAATAQUE**: ahora Canelo dispara en cada acento (swing `out` en plano completo cada dos), dutch alternos ida y vuelta, astillas de luz | **7 taps** `fuego0–6` (acentos medidos, `COUNTER`): perfecto = bola de fuego que revienta en la galera con impacto; fallo = sale chueca |
| **break3** (96–102) | `neon` | **Duelo de baile** bajo la bola de disco, letterbox: Cascada baila, **Canelo la copia** «¡TE COPIO! マネ», guiño, burla. `build_3`: doble cut-in «マダマダ» | **taps opcionales** `baile0–2` (bonus «¡ESO!») |
| **drop3** (103–111) | `chase` | **Entre las islas invertidas**: islas de colores de cerca, viento fuerte, rocas que caen de las islas hacia nosotros (swing con `obj: 'rock'`). «¡A LAS ISLAS! シマヘ» | **6 taps** `roca0–5` (`ROCKS`): perfecto = «¡CRAC! バキッ»; fallo = la roca pega en el casco |
| **break4** (112–118) | `dawn` | **Amanece**: el sol sube despacio, letterbox, página de manga vertical de 3 (los tres sonrientes), cut-in de Luzterna «アサ» | **hold-release** `salto` (`build_4` → `climax`, «¡Y SUELTA!») |
| **climax** (119–127, **218,0**) | `finale` | Los dos saltan (dos `leapShot` cruzados), **pelea en el aire** dentro de la nube, primeros planos de choque en cada acento, fuegos artificiales cada 4 bombos. **230,84: el plano héroe** (3,66 s) «¡LIKY FIGHT! ファイト»; la nota de ritmo en `last_bar` | **6 taps** `final0–5` (`CLIMAX`) |
| **outro** (128–129) | `dawn` | **Se apagan las luces una por una**, confeti lento, «¡QUÉ FIESTA! オワリ». Corte duro a 236,9 | — |

Inputs: **49 prompts, 43 calificados** (6 opcionales). Con todo perfecto la guardia nunca concede más de 3 destellos/s.

Set (`songs/likyFight/stage.ts`): galera «La Cascada al Revés» (bocinas con woofers que bombean con el bombo, cabina de
DJ, papel picado, faroles, disco, coco, rayas rosas, barandal dorado, tablones, obenques, costuras de vela) y el barco
de Canelo (llama con orejas en la vela, Kit de Vuelo). Fondo en capas de parallax: horizonte con cordillera y estelas,
islas invertidas lejanas, nubes cel en dos capas, mar de crestas (o **mar de nubes** arriba), islas de colores
cercanas (drop3), nubes cercanas. Cicatrices persistentes en los cascos (`addScar`), astillas, columna de agua.

## 10. Accesibilidad

- **Destellos**: `FlashGuard` concede como mucho 3 destellos de pantalla completa por cualquier ventana de 1 s (los
  cuadros de impacto cuentan). Lo demás se degrada a «suave» (≤ 25 % de luminancia) o a solo líneas.
- **Nunca rojo saturado** en un destello de pantalla completa (`safeFlashColor` lo cambia a blanco cálido).
- **Reducir destellos**: todo destello es suave y los cuadros de impacto no se conceden (quedan las líneas de
  concentración).
- **Reducir movimiento**: sacudidas/zoom/dutch ×0,3, líneas de velocidad a la mitad, misma línea de tiempo.
- **Sin sonido**: el reloj interno corre la misma coreografía; el verbo `beat` marca el pulso en el marco y los prompts
  laten en cada tiempo.
- Prompts grandes y de alto contraste (blanco/amarillo/tinta), siempre en un ancla fija, nunca encima de la cara del
  personaje; las etiquetas, 1–3 palabras.

## 11. Rendimiento y medición

**Presupuesto**: el tratamiento de los gatos cuesta **cero por cuadro** (horneado al cargar). Un solo pase de post a
pantalla completa en calidad alta; en baja, el post solo existe durante impactos/destellos, sin desregistro, partículas
×0,5 y pinturas `lite`. La calidad baja sola si dos ventanas seguidas de 2 s superan p95 24 ms (ignora los primeros 3 s).

**Medido, 2.ª pasada** (canción completa, Chrome sin cabeza, ANGLE Metal, M4, audio real, **con vsync** como un
navegador normal; bot «perfecto»):

| Qué | Resultado |
|---|---|
| Deriva dibujado vs oído (cada cuadro, 237 s) | mediana **0 ms**, p99 **0 ms** (14 513 cuadros); igual tras pausar a los 60 s y tras ocultar la pestaña a los 150 s |
| Sonido → cuadro que reacciona (tira de sincronía, coro) | bombos n = 42: mediana **9,7 ms**, p90 14,6, máx **19,1** · acentos n = 32: mediana 9,0, máx 18,6 → **siempre el cuadro siguiente** (60 Hz = 16,7 ms) |
| Cues sobre onsets (toda la canción) | n = 38: mediana 8,6 ms, p90 19,2, máx 24 |
| Cuadros | **60 fps** estables: p50 16,6 ms, p95 20,8, p99 22,5; 1 intervalo > 50 ms en 4 minutos |
| Costo por cuadro (scrub, 1280×720) | lógica ~1 ms + GPU ~4–9 ms |
| Tirones | 0 clips > 8 ms (antes: palabras horneadas en el golpe, 25–45 ms) |
| Volumen | refuerzo **+6 dB** (×1,995), ducking 0 dB; pico de salida −14,9 dBFS, RMS −27,5 dB |
| Latencia | base 5,3 ms + salida 16 ms, compensadas |
| Juicio | 49 inputs, nota S |

Ojo al medir: con `--disable-gpu-vsync --disable-frame-rate-limit` el navegador dibuja a ~600 fps, la cola de la GPU se
llena y aparecen huecos falsos de 100–400 ms. Para sincronía y FPS usa vsync (`VSYNC=1` en el harness).

Memoria (dos Momentos completos seguidos, heap tras GC): 58 → 108 → 113 MB (la 1.ª vez carga módulos, glifos y
pinturas; después casi plano). El audio decodificado (pico 91 MB, la canción entera) vuelve a **0 bytes** después de
cada Momento y el buffer preparado se reutiliza. La canción suena ~80 ms después de pedirla (ya decodificada).

**Herramientas** (scratch del agente): `sheet.mjs <nombre> "auto=great" <t0> <t1> <n> <cols>` dibuja instantes
exactos con `?scrub=1` (hojas de contacto); `full.mjs` corre la canción entera en tiempo real (deriva, pausa, pestaña,
volumen, nota); `vis.mjs` + `strip.mjs` arman la **tira de prueba de sincronía**: forma de onda del archivo que suena,
onsets por pista y, cuadro por cuadro, el golpe de cámara dibujado y las reacciones al bombo y al acento, puestos en el
instante en que ese cuadro estuvo en pantalla. En DEV, `window.__momento.run.trace.vis` guarda por cuadro
`[m, golpe de cámara dibujado, env bombo, env acento, plano completo]` y `run.host.slow` los clips que tardaron > 8 ms.

## 12. Pruebas

| Archivo | Qué |
|---|---|
| `tests/momentos.test.ts` (33) | tiempo musical, edición, props; LIKY resuelve con **cero advertencias** y cubre la canción entera, todos los tipos de input, avisos de un compás, los inputs de golpe sobre acentos medidos, las luces sobre bombos medidos, estadísticas de las pistas de onsets, solo verbos existentes, el registro; validador; juicio (tap/hold/mash/choice, temprano, ajuste de ritmo + lag); **mismo resultado** perfecto/fallo/sin input (partidas idénticas salvo `best`); reloj (audio, interno, pausa, entrada tardía, edición en compás); guardia de destellos (incluida la partitura de LIKY jugada perfecta); `ext.momentos` |
| `tests/momentosH44.test.ts` (4) | H44 en dos fases: mar con cielo dormido, la misma semilla repite la pelea con el spec clonado como al worker, el cielo despierta en la fase 2, sigue ganable |
| `tests/momentosAudio.test.ts` (3) | `prepare` decodifica una vez, el salto reutiliza el buffer y cae en el compás, pausa/reanuda, bytes a 0 |

## 13. Pendientes y mejoras

- Los otros cinco Momentos (§2).
- Más poses dibujadas: el swing ya va en poses clave con brazo dibujado y siluetas; un set de poses pintadas para los
  demás personajes haría el resto aún más legible.
- `basic-pitch` (si hay disco) para notas de bajo/melodía más finas en los onsets.
- Un harness de medición sin cabeza siempre con vsync (los números sin vsync engañan, §11).
- Voces/sfx propios del Momento (hoy solo la canción; a propósito).
- La nota de ritmo podría ir a la Fonoteca como insignia.

## 14. Hoja de coreografía: WHEN I LOSE (H35) · estilo «TINTA Y PERGAMINO»

> Agente MOMENTO-WHEN-I-LOSE, 2026-10-10. Carpeta `game/src/momentos/songs/whenILose/` (`score.ts`, `stage.ts`,
> `verbs.ts`, `plates.ts`, `set.ts`, `ink.ts`, `hook.ts`, `index.ts`). Ruta DEV `?momento=when_i_lose`.

140 BPM en la grilla (se siente a 70), compás 1,714 s, pedal en mi. **La canción entera, 0 → 219,5** (sin edición),
corte duro en su último aliento, `tail: 'release'`. La canción es lenta e íntima: **menos inputs, más historia**
(17 calificados + 4 opcionales frente a los 43 + 6 de LIKY), y el estilo cambia dentro de la misma escena.

### 14.1 Guía de estilo: «TINTA Y PERGAMINO»

El set se dibuja **una sola vez, en color** (un manuscrito iluminado: lapislázuli, bermellón, malaquita, pan de oro) y
un filtro propio a pantalla completa (`ink.ts`, uno sobre el mundo y otro sobre las láminas) lo **redibuja por píxel**
en uno de dos artes, o en los dos a la vez:

1. **Sumi-e** (el silencio, la memoria): papel con fibras; tres aguadas de tinta con bordes húmedos y granulado; una
   línea de pincel seco con presión, que **hierve en tres** (se re-siembra cada 1/8 s, como animación a mano).
   - El tono sale del **contraste local** (media en un anillo de ~14 px de diseño) y los oscuros se levantan a las
     aguadas medias (`uLift`): un gato de pelaje oscuro se lee como aguadas y luces de papel, nunca como mancha negra; el
     borde interior de cada silueta se oscurece como un pincel cargado y el papel hace halo alrededor.
   - La línea fina se aclara dentro de las texturas (pelaje, grano) y solo es plena donde el gradiente a escala de
     pincel es coherente (siluetas).
   - **Bajo el agua no se levantan los oscuros** (`uLift → 0` con `lfall`) y se quita el velo frontal del agua: el
     fondo es noche y la linterna que se hunde es la única luz.
   - Los sellos rojos (静, 黙, 礼) conservan su bermellón; el oro de las voces y la linterna va en una capa de pantalla
     que la tinta no toca.
2. **Iluminado** (las voces vuelven): el color mismo, más cálido y rico, contorno sepia fino y **pan de oro**: todo píxel
   de tono dorado se vuelve metal (una banda de brillo lenta + chispas que atrapan la luz con la melodía).
3. **El frente**: un borde de tinta en agua, ruidoso, con un **filo de oro ardiente**, come un arte con el otro
   (`style.in`/`style.out`, `front.x/y/r/soft`, o `front.at: 'lantern'`). `blank` vacía todo a una página en blanco
   (el valle).
4. **Gatos**: horneado de **miniatura** (`bakeMiniature`, gancho `bake` de `Studio`): línea sepia, contorno ocre, luz de
   borde dorada. **Nunca** el horneado cel de NEÓN CEL: sin sombras planas ni tramas.
5. **Tipografía**: pincel (`Permanent Marker`) para los «¡ZAS!» y el «SHHH»; cursiva serif (`Playfair Display`) para lo
   íntimo («LUZ», «escucha…», «CON DIGNIDAD»); fraktur (`UnifrakturMaguntia`) para las letras de las voces y
   «MEMORIA». Sin katakana. Prompts en tinta, papel y oro (`promptTheme`), siempre **encima** de la cabeza de Canelo
   (ancla `caneloP`) y dentro del área segura.
6. **Láminas** (`plates.ts`, verbo `plate`): planos a pantalla completa en el mismo filtro, que entran pasando la página
   y salen girándola: `portrait` (miniatura en un ensō), `writer`, `duel` (la luna entre los dos barcos), `bow`,
   `archive` (estantes hasta una puerta de oro), `choir` (las pinturas sobre nimbos de oro), `split` (tinta | oro, cara a
   cara) y `manuscript` (la última página).
7. **Velocidad**: estrías de pincel seco (`streaks`) en lugar de líneas de velocidad; impacto = **golpe de tinta**
   (`heavy`: cuadro guardado + mancha + páginas + la cámara se hunde).

Prohibido aquí: línea de color neón, tramas de manga, cut-ins en diagonal, katakana, paletas de NEÓN CEL.

### 14.2 Siempre encendido (cada sonido tiene su propósito)

| Pista | Qué se ve |
|---|---|
| bombo | una gota de tinta cae al agua (anillos), golpe de cámara chico, los cascos se hunden; bajo el agua, un latido de oro alrededor de la linterna y burbujas |
| 808 (mi grave, cada 4 compases) | **la cámara se hunde** y vuelve a flotar en ~2 s; el agua se hincha |
| acentos | una página se arranca de un estante y cae revoloteando al agua |
| bajo | las lámparas se mecen según la nota; el agua se mece |
| voces | letras fraktur de oro suben del agua; mientras él calla el mundo, se apagan en tinta; el coro brilla |
| melodía | el pan de oro atrapa la luz |
| perc | polvo en los haces de luz |

### 14.3 La hoja

| Sección (s) | Paleta | Qué pasa | Input |
|---|---|---|---|
| **intro** (0–17,1) | `sumi` | Arranque en frío: el cuadro congelado de la batalla se vuelve tinta desde su lado (1,6 s), «SHHH» y un sello; en el compás 1 **la página gira** sobre la sala hundida. Plano general bajo la bóveda con rosetón; el coloso sube detrás de su galeón con el gran libro; las voces escriben sus primeras letras y él las apaga; primer plano sumi en un ensō con su «shhh» | — |
| **verse** (17,1–41,1) | `sumi` | Duelo en tinta: dos rollos se desenrollan con los capitanes. **Su ola** (`beat_in`): una ola que rompe, con garra de espuma y estrías de papel, viene un compás antes. Intercambio cortado como duelo: empuje a nuestra proa, contraplano en su cubierta, vuelta a la sala | **tap** `ola`: perfecto = un tajo blanco parte la ola «¡ZAS!»; bien = rompe en la proa; fallo = nos baña «¡PLAF!» |
| **break** (41,1–54,9) | `sello` | Las voces se van: su reinado. Libro que golpea, sello 静, manchas en los golpes grandes; nos lanza páginas en tres bombos medidos (`BREAK_PAGES`); sello 黙 | **3 taps** `p0–2` |
| **prechorus** (54,9–68,6) | `sumi` | La sala se inunda; Luzterna levanta la luz | **hold** `luz` (#36 → coro): la linterna crece mientras mantienes; «LUZ» en oro |
| **chorus** (68,6–82,3) | `abismo` | **EL GOLPE**: el libro se cierra, la cámara se hunde bajo el agua; la linterna cae y se hunde encendida entre estantes ahogados y una estatua; cada bombo es un latido de oro | **taps opcionales** `memo0–1` (¡MIRA!) |
| **break2** (82,3–96,0) | `abismo` | La memoria en tinta, tres láminas: un escriba entre estantes infinitos, un duelo antiguo bajo la luna, el que pierde se inclina y el otro le responde | **choice** `voz`: escuchar (Canelo cierra los ojos) o cantar «¡MIAU!» |
| **chorus2** (96,0–116,6) | `oro` | **LAS VOCES ROMPEN** (96,0): el oro se expande desde la linterna y el mundo se **redibuja iluminado** (frente con filo de oro), «MEMORIA» en fraktur; el coro del Archivo aparece en la galería; encendemos su barco | **3 taps** `ilu0–2` (`ILUMINA`; el primero, en la linterna) |
| **bridge** (116,6–130,3) | `vitral` | El Archivo en su gloria (láminas: el pasillo a la puerta de oro, el coro, su retrato iluminado); él escucha | **hold** `reverencia`: Canelo se inclina, él y el coloso responden; sello 礼 |
| **chorus3** (130,3–144,0) | `duelo` | El duelo iluminado, con planos alternos sobre cada barco | **3 taps** `fuego0–2` (`FUEGO`) |
| **break3** (144,0–164,6) | `oro` | Su último silencio: la tinta cierra el mundo desde los bordes hacia la linterna (el frente encoge 30 tiempos) mientras el coro sostiene; lámina `split` (él en tinta, nosotros en oro) | **taps opcionales** `canta0–1` |
| **build** (164,6–178,3) | `valle` | **El valle**: la página se vacía; un pincel grande sostiene una gota de oro que crece mientras mantienes, y un ensō se traza alrededor durante todo el valle | **hold-release** `gota` (`valley` → `climax`): suelta en el golpe |
| **climax** (178,3–205,7) | `gloria` | **EL ÚLTIMO GOLPE**: tinta y oro a la vez, ráfaga de páginas; retrato de Canelo; los últimos intercambios; él levanta el libro como saludo | **3 taps** `fin0–2` (`FINAL`) |
| **outro** (205,7–219,5) | `ocaso` | El primordial se inclina («CON DIGNIDAD»); el duelo se vuelve una página de manuscrito: «ÚLTIMO CAPÍTULO». Corte duro a 219,5 | — |

Inputs: **21 prompts, 17 calificados** (taps, holds, un hold-release y una elección) + 4 opcionales. Los taps de pelea van
sobre bombos medidos (`BREAK_PAGES`, `ILUMINA`, `FUEGO`, `FINAL` en `score.ts`).

### 14.4 Integración (H35)

- `ruptura_bibliotecario` tiene **dos fases solo de presentación** (`state/sys/rupturas.ts`: «La Sala de Lectura» →
  «La memoria del Archivo» al 40 % o en el turno 4, sin entorno, efectos ni cambios de reglas). El Momento entra por
  `registerFaseInterlude` (`songs/whenILose/index.ts` → `hook.ts` → `runBattleMomento`).
- `BattleMusic.suspend()` levanta el ducking y el paso-bajo de RUIDO mientras suena la original (§6: nada la tapa).
- Al terminar: `ext.momentos.when_i_lose` y la original en la Fonoteca («NUEVA VERSIÓN: WHEN I LOSE»).

### 14.5 Medido

Chrome sin cabeza, ANGLE Metal, audio real, **vsync**, bot perfecto, canción entera, con la máquina compartida por seis
agentes (carga 50–80 en la tanda final; con carga 140–216 las colas p99 llegaron a 40–70 ms, las medianas no se movieron).

| Qué | Resultado |
|---|---|
| Sonido → cuadro que reacciona (**todos** los bombos y acentos de la canción) | bombos n = 272: mediana **8,6 ms**, p90 15,5, p99 **18,4**, máx 22,9 · acentos n = 665: mediana 8,4, p90 15,2, p99 18,0, máx 24 → el cuadro siguiente (60 Hz). Calidad baja: bombos 8,5 / p99 17,7; acentos 8,4 / p99 17,3 |
| Cues sobre onsets | n = 7: mediana 9,7 ms, máx 22 |
| Deriva dibujado vs oído (cada cuadro, ~13 100) | mediana **0 ms**, p99 0,1 ms, máx 0,9 |
| Cuadros, calidad alta | **59,8 fps**, p50 16,7 ms, p95 19,1, p99 21,4 (10 intervalos > 50 ms en 3:39) |
| Cuadros, calidad baja | **60 fps**, p50 16,7 ms, p95 18,6, p99 20,0 (2 > 50 ms) |
| Arranque (primeros 3 s con la canción sonando) | intervalo máx 23 ms (alta), 41 ms (baja); ninguno > 50 ms |
| Memoria (heap tras GC; antes → 1.ª → 2.ª reproducción → tras soltar la canción) | **59,5 → 74,8 → 76,7 → 76,7 MB**; audio decodificado (pico 85 MB) de vuelta a **0 bytes** |
| Flujo real H35 (fixture, bots perfecto y fallo) | el Momento entra en el cambio de fase con la canción (reloj de audio), nota S / C (21 juzgados); la huella de la sim (turno, viento, rng, cascos, enfriamientos) es **idéntica** antes y después del Momento; la pelea sigue en «La memoria del Archivo» y termina; la partida solo cambia en `ext.momentos.when_i_lose` (`best`, `plays`) y la Fonoteca suma la original |

Arranque y tirones:
- Las láminas se construyen y se dibujan una vez **antes del reloj** (teselar cientos de formas en el cuadro en que
  entraban daba tirones). El set completo (también el coloso, el coro y la sala ahogada, que aparecen después) se
  dibuja una vez a tamaño real antes de que suene la canción. Mientras se arma (~1 s) la batalla queda quieta: es el
  mismo cuadro congelado que la tinta se come después.
- **Trampa de Pixi v8**: `renderer.render({ container })` convierte ese contenedor en *render group* para siempre; una
  lámina precalentada así ignoraba después la máscara de su padre y se dibujaba como una tira. Precalienta siempre a
  través de un contenedor desechable (`WilStage.prewarmDraw`).
- La espera de la decodificación (9 s) ahora cuenta desde que el set está listo (`momentos/index.ts`): con la máquina
  saturada, armar el set y decodificar competían y una vez el Momento se quedó sin canción.

Herramientas (scratch del agente): `sheet.mjs` (`HOP`, `TIMES`), `sync.mjs` (sincronía de toda la canción + tira),
`perf.mjs` (FPS y memoria en dos reproducciones), `h35.mjs` (flujo real con huella de la sim), `slow.mjs` (de dónde
salen los cuadros largos).

## 15. CIRCUS MALUS (H62): «FUNCIÓN DE FERIA 1930» — hoja de coreografía y guía de estilo

> Agente MOMENTO-CIRCUS-MALUS, 2026-10-10. Carpeta `game/src/momentos/songs/circusMalus/` (`film.ts`, `art.ts`,
> `stage.ts`, `verbs.ts`, `shots.ts`, `score.ts`, `index.ts`, `hook.ts`). Prueba `tests/momentoCircusMalus.test.ts` (13).

### 15.1 Gancho

`umbral_correctores` › fase `el_plan` vía `registerFaseInterlude` (clave `H62_MOMENTO` de `rupturasO4Battles.ts`;
`index.ts` guarda una copia, `CIRCUS_HOOK`, que la prueba compara con la del archivo). La def **no** lleva `battle`
(no pasa por el `momentoForFase` de BattleScene: suena una vez). `hook.ts` espera 560 ms a que se apague el destello de la
fase y llama a `runBattleMomento`. El sim ya aplicó la fase; la prueba juega la pelea con y sin interludio (mismas
semillas, mismo registro tiro a tiro, mismo resultado). `tail: 'release'`: al corte vuelve la música de batalla.

### 15.2 Guía de estilo: «FUNCIÓN DE FERIA 1930»

La canción es un riff mecánico que nunca cambia (LRA 1,1) y un final que «corrige» la tonalidad. El estilo es una
**caricatura *rubber-hose* de los años 30 proyectada en película vieja**, sobre un **escenario de feria en simetría
perfecta**:

1. **Simetría perfecta.** Todo lo de los Correctores se dibuja una vez y se espeja sobre el eje x = 960 (`both()`):
   proscenio, carpa, calíopes, guantes, señales. Los gatos corregidos son **media pintura + su espejo** (`SymCat`):
   gatos literalmente simétricos. Encuadres centrados (cámara en el eje); solo lo de Canelo rompe el encuadre.
2. **Todo bota en el tiempo, al unísono** (el *bounce* del rubber-hose): el salto aterriza en cada tiempo (`hop`, en dos
   pero reiniciando en el tiempo), squash en el bombo. Canelo, la linterna de Luzterna y la tripulación **no** botan:
   respiran a su ritmo.
3. **Película como material** (post propio, `film.ts`, un pase): nitrato B/N con pie sepia ↔ **Technicolor de dos
   tiras** (rojo-naranja contra cian, sin azul ni amarillo verdaderos) ↔ color verdadero. Grano y parpadeo a 24 fps,
   rayas y polvo, viñeta de proyector, temblor de ventanilla (12 fps), **iris**. Los cambios de película son
   **barridos simétricos desde el eje** (`wipe`) o cortes secos.
4. **Línea negra gruesa, rellenos planos.** Es lo opuesto a NEÓN CEL (allá la línea es de color y no hay negro). Los
   gatos se hornean con `bakeToon`: tres tonos planos por color, contorno y líneas interiores negras, **sin tramas**.
   Paletas de la sección con `tone: 0` (sin puntos de manga). Nada de cut-ins, viñetas de manga ni katakana.
5. **Tipografía de cartel de feria**: Anton crema con contorno negro y **sombra de bloque** apilada, cintas rojas; los
   títulos en Playfair Display 700 (cartón de título de los 30); los sellos «CORREGIDO» en rojo, **rectos** (los del
   jugador salen **torcidos**).
6. **El color verdadero es del jugador.** Cada acierto bueno deja una **mancha de color verdadero sobre la película**
   (capa sobre el post, bajo los prompts): cae brillante y se embebe (queda al 16 %). La linterna de Luzterna es la otra
   fuente de color verdadero. El final «corrige» las manchas (se borran con los acordes) y la quemadura las devuelve.
7. **Objetos de la corrección**: guantes blancos de cuatro dedos con sellos de goma, un reloj parado en las 10:10
   (manecillas espejadas), un rollo de pianola perforado (el plan), engranes y una llave de cuerda.

### 15.3 Reacciones siempre encendidas (cada sonido tiene propósito)

| Pista (onsets a grilla) | Qué hace |
|---|---|
| `kick` | todo el mundo bota y se aplasta (fila, Tachón, calíopes, banderines, filas de fondo), los focos del marco se encienden todos, las candilejas laten, golpe de cámara; en los planos completos, el marco del plano |
| `snare` (2 y 4, desde el compás 12) | los dos guantes de los laterales **estampan** sus sellos en el piso (anticipación 0,18 s, golpe en el onset, marca «✓» que se desvanece); la fila patea con la pierna del lado del golpe; en la pianola, su columna; en el reloj de cuerda, un cuarto de vuelta de la llave |
| `perc` (hats) | los focos del proscenio y del espejo **persiguen** un paso por hat; el reloj hace tic; los banderines voltean |
| `bass` (con altura) | sube el tubo de calíope de **esa nota** (el riff lo tocan los tubos); el péndulo; los engranes giran un diente por nota; en la pianola, la tecla de esa altura |
| `melody` (acordes del piano) | anillos de vapor en ambas calíopes; Tachón marca el compás con su plumón; agujeros de la pianola |
| los cuatro acordes del final | cada uno «se hincha» (~0,5 s, medido): la línea de espejo crece por el eje, un anillo perfecto se abre, el mundo se acerca |

**Onsets nuevos**: la canción está en grilla exacta, así que `circus_malus.onsets.json` se regeneró con
`audio-derivados/scripts/onsets_grid.py`, que clasifica **cada semicorchea** de cada stem (salto de energía + nivel) y
mide la altura del bajo por ranura (YIN). Resultado: 170 bombos, 64 cajas (el *backbeat*, entra en el compás 12), 176
hats, 144 ataques del piano + los 4 acordes, 231 notas de bajo con el riff completo (Mi1 · Re2 · Mi2/Re♯2 · Fa1 · Re1 ·
Sol1/Fa♯1), sin voz. El archivo anterior (picos libres: 52 % de las cajas fuera de grilla) queda en el scratch del agente.

### 15.4 Hoja de coreografía (100 BPM, compás 2,4 s; la canción entera 0 → 125,05)

| Sección (compases) | Película | Qué pasa | Input |
|---|---|---|---|
| **verse** (0–9) | B/N | Arranque en frío: el cuadro de la batalla, ya en nitrato, recibe un sello «CORREGIDO» en el primer bombo; el **iris** se cierra hasta `big_hit_1` y se abre en el **cartón de título** (rayos que giran una cuña por tiempo, marco art déco, dos Ronrón espejados, «LA REDACCIÓN / PRESENTA / CIRCUS / MALUS / EL PLAN» entrando en bombos). Compás 4: el **telón sube en cuatro pasos mecánicos** (uno por tiempo), «¡FUNCIÓN!». `big_hit_2`: Canelo cae desde el telar, **fuera del eje**; todos se congelan un tiempo y lo miran con «!» al unísono. Compases 6–9: la fila enseña el paso (step-touch espejado), Canelo responde a su manera | **tap** `aterriza` (12,9); **taps** `paso0/1` (16,8 · 21,6): bien = giro propio + mancha de color; fallo = tropiezo |
| **chorus** (10–19) | barrido a **dos tiras** desde el eje | «¡EN COLOR!» + confeti espejado, aparece una fila de fondo. Los guantes estampan el *backbeat*. Cortes mecánicos en cada compás (general · Tachón · fila). Primeros planos en contrapicado del sello cayendo sobre Canelo (`stampShot`); dos planos de la fila de caras idénticas (`lineShot`) | **6 taps** `sello0–5` en cajas: esquiva elástica + mancha / agachado / aplastado como panqueque con sello y Canelo **simétrico** |
| **break** (20–23) | corte a B/N | **La pianola** (`rollShot`): el rollo perforado con todo el riff (bajo, piano y batería, espejado), las teclas bajan con cada agujero; en el segundo compás el papel muestra el plan: una ciudad perfectamente simétrica. Dos letreros ← → en el escenario | **choice** `cual` (53,4): corre al lado elegido → un guante lo levanta y lo deja **exacto en el eje** («CORREGIDO»); **tap** `gran_sello` (56,1): el sello gigante |
| **verse2** (24–27) | dos tiras (barrido) | **El espejo** (`mirrorShot`, todo el verso): camerino a rayas, espejo de tocador con focos; el reflejo es el Canelo corregido (simétrico) y bota con la música; Espejito mira | **4 taps** `espejo0–3` en bombos: bien = el reflejo **se equivoca** y el vidrio se raja; regular = copia tarde; fallo = copia perfecto |
| **build** (28–31) | corte a B/N | «¡CRAC!» y **engranes** en primer plano (un diente por nota del bajo que vuelve por partes; trinquete en cada caja). La cámara se abre: el teatro es una caja de música, engranes en los bordes y **llave de cuerda** encima (un cuarto de vuelta por caja). `big_hit_4`: «¡CLANK!». Líneas que tiran todo hacia el eje | **hold-release** `cuerda` (69,6 → 76,8): Canelo se aferra, la linterna se carga de color; al soltar en el clímax, ráfaga de manchas de color |
| **chorus2** (32–47) | dos tiras (barrido), paleta `plan` | «¡EL PLAN!», dos filas de fondo, la tripulación entra (bailando a su ritmo), fuegos artificiales espejados en los bombos fuertes. Canelo **batea** los sellos: los buenos quedan pegados **torcidos** en el telón. Sube a la calíope izquierda y la desafina (cámara fuera del eje): los tubos se **doblan**. El guante correctivo esta vez agarra aire. `big_hit_5`: el mega-sello de Tachón; bien = Canelo lo desvía y queda pegado torcido **en el reloj** (10:11). Compases 42–46: cada acierto saca de compás a un bailarín (resorte «¡BOING!», baila desfasado medio tiempo). `big_hit_6` (113,7): «¡ORDEN!»: un sello gigante a pantalla, todo vuelve a su sitio | **4 taps** `golpe0–3`; **mash** `organillo` (#36 → #37:2, 8/18); **choice** `cual2` (94,2); **tap** `megasello` (96,9); **5 taps** `knock0–4` |
| **outro** (48–52, el final raro) | B/N prístina | El mundo **deja de botar** por primera vez. Cada acorde (115,2 · 117,6 · 120,0) espeja más del cuadro desde el eje (`sym` 1/3 · 2/3 · 1), quita el grano y borra las manchas; Canelo, ya en el eje, se vuelve simétrico. **La respiración** (121,998, 0,29 s): todo congelado. **El acorde torcido** (122,4): la película se **rasga por el eje**, se **quema** desde el centro (color verdadero por el agujero, borde carbonizado), el cuadro queda inclinado, el Canelo verdadero vuelve; la película se zafa de los dientes (123,0). Boleto de «RITMO». Corte duro en 125,05 | **tap** `ultimo` (122,4): bien = el desgarrón más rápido y grande con cuadro de impacto |

Inputs: **29 prompts, 27 calificados** (más 2 elecciones). Ningún par de prompts en pantalla a la vez; avisos de 1 compás
(o medio compás en las rachas de cajas). Con todo perfecto la guardia nunca concede más de 3 destellos/s y no hay
`flash` (solo cuadros de impacto).

### 15.5 Medido (Chrome sin cabeza, ANGLE Metal, audio real, vsync, máquina cargada: 6 agentes, carga ~80)

| Qué | Resultado |
|---|---|
| Deriva dibujado vs oído (cada cuadro, 125 s, con pausa a 40 s y pestaña oculta a 90 s) | mediana **0 ms**, p99 **0 ms** (7 645 cuadros) |
| Sonido → cuadro que reacciona (tira de sincronía, compases 12–19) | bombos n = 30: mediana **12,1 ms**, p90 16,8, máx **18,5** · cajas n = 16: mediana 11,5, máx 18,5 → siempre el cuadro siguiente |
| Cuadros, calidad alta | p50 16,7 ms · p95 20,4 · p99 31,2 (por sección: chorus/break/verse2/outro p95 ≤ 20; chorus2 p95 25) |
| Cuadros, calidad baja | p50 16,7 · p95 19,1 · p99 21,3 |
| Volumen | refuerzo +6 dB (×1,995), ducking 0; pico de salida −17,1 dBFS, RMS −27,2 dB |
| Memoria (heap tras GC) | 60 → 76 → 80 MB tras dos reproducciones completas; la canción preparada se libera (`prepared: []`) |
| Flujo real H62 (fixture `rupturas-o4` + H58–H61 hechas, `startStoryBattle('umbral_correctores')`) | el Momento entra al cruzar EL PLAN, nota S con el bot, la batalla sigue en la capa nueva con `circus_malus.battle`, la partida guarda `ext.momentos.circus_malus` |

Mejoras de rendimiento hechas tras medir: el set no se redibuja bajo los planos a pantalla completa (intervalos sacados
de la partitura) y las manchas solo se redibujan cuando cambian.

## 16. Hemkade (H57): hoja de coreografía y guía de estilo «COLOSO / GRABADO»

> Agente MOMENTO-HEMKADE, 2026-10-10. Carpeta `game/src/momentos/songs/hemkade/`. Sin commit. Estado y relevo:
> `agentes/MOMENTO-HEMKADE.md`.

### 16.1 Guía de estilo

Hemkade es épica y oceánica: un coloso encadenado que el barco persigue del fondo del mar a las estrellas. El estilo
tiene **dos manos** que se alternan con la canción y redibujan **los mismos objetos**:

1. **COLOSO (drops y builds): 3D real.** Es la primera escena del juego en three.js (`world.ts`), en su propio canvas,
   mostrada como textura **dentro** de la capa de cámara del kit (golpes de zoom, sacudidas, post, cut-ins y prompts
   del motor encima, sin cambios en el motor). Sombreado toon de **bandas duras** (`mats.ts`: luz/base/sombra con
   corte en seco, sin degradados) y **contorno de color** por casco invertido (`outlineMat`), nunca negro.
2. **GRABADO (los tres breaks): láminas de buril.** Los mismos shaders cambian a un segundo modo (`uStyle`): cada
   superficie se dibuja con **tramas de líneas paralelas** cuyo grosor sigue la luz (el mar con líneas tipo Hokusai a
   lo largo de las crestas, el cielo con líneas horizontales y el sol en anillos concéntricos). Las líneas **aparecen
   una a una con la melodía** (`reveal`: cada ataque fuerte de la melodía desde que empezó el break dibuja más). Marco
   y cartela de lámina («LÁM. I / II / III»). La entrada es un barrido diagonal (`wipe`) y la salida, la lámina que **se
   rompe en esquirlas de papel** (`smash`) sobre el golpe del drop.
3. **Paletas por altura** (`palettes.ts`): `hAbyss` (agua nocturna, una luz ámbar), `hSwell` (atardecer de tormenta),
   `hBreach` (día: ultramar, turquesa, espuma blanca, oro), `hStorm` (violeta golpeado, rayos blanco-cian), `hGilt`
   (cobalto y oro sobre el mar de nubes), `hHigh` (índigo con las primeras estrellas), `hAstral` (violeta profundo, la
   grieta en dos colores), `hFall` (atardecer de vuelta al mar de nubes). Láminas: sepia sobre crema (`sepia`), café
   sobre marfil (`gilt`) y **oro sobre índigo** (el atlas celeste, `atlas`).
4. **Sin tramas de manga** (eso es NEÓN CEL): `grade.tone` = 0 en todas las paletas. La textura la ponen las líneas de
   buril, no los puntos.
5. **Altura real**: el mar en y = 0, la franja de tormenta 380–760, cielo claro arriba, espacio pasado ~2600. Arriba de
   la tormenta el mismo mar se vuelve **mar de nubes** (solo cuando el coloso ya subió).
6. **Los gatos** son las pinturas horneadas del motor (`Actor`), parados en cubierta en su punto 3D proyectado
   (tamaño por distancia); en las láminas van entintados en sepia como el grabado.
7. **Tipografía**: la de los Momentos (onomatopeya + katakana), con prompts en los colores del Momento (tinta marina,
   crema, oro, ultramar; machacar en naranja), no los de LIKY.
8. **Luz sin línea**: rayo del cañón estelar, haces, chispas, halos y la grieta no llevan contorno; la materia sí.

Prohibido: tramas de puntos, negro puro, degradados suaves en sets, texto narrativo.

### 16.2 Reacciones siempre encendidas (cada sonido tiene un propósito)

| Pista | Qué hace en pantalla |
|---|---|
| **bombo** | golpe de zoom (`cam.punch 0.014·env`), los pliegues del vientre se abren, un **halo** sale del corazón del coloso, un tirón de nado, las cadenas saltan, el casco se hunde un poco, el sol late |
| **acento** (caja/crash) | en el mar: las aletas golpean el agua (muro de espuma a un lado y al otro); en el espacio: estallidos de estrellas sobre la piel; en `drop2`, **un rayo** por acento fuerte (guardado) |
| **bajo** | balanceo del cuerpo y de las aletas (más grave, más), oleaje; la nota ♭II (Sol♭) **tensa las cadenas: brillan** |
| **melodía** | **anillos de luz** recorren el cuerpo de la cola al hocico (canta); en las láminas, cada ataque **dibuja más líneas** |
| **voz** | se abre la boca |
| **perc** | velocidad de las estelas y empuje del motor |

### 16.3 Hoja de coreografía

160 BPM, compás 1,5 s. **La canción entera, 0 → 218,65** (corte en `end`, su último aliento). `tail: 'release'`. Los
sellos (`SEALS`: 24 en las cadenas, con palabras de orden) se rompen con los taps perfectos y **se rearman** a los 5,2 s
mientras la línea aguante; las cadenas rotas **se quedan rotas**.

Planos (`shots.ts`, cortes en seco en el golpe): `abyss` (bajo el agua, el casco arriba y el coloso pasando), `eye` (el
ojo; con `sh.p` hace dolly-in), `surface`, `rise` (una cadena saliendo del mar hacia la línea), `breach` (contrapicado
desde la línea de agua), `flank` (travelling por el costado), `orbit`, `deck` (desde cubierta, **teleobjetivo** sobre el
sello), `hero`, `under`, `top` (cenital, las cadenas convergen al lente), `chain` (un sello de cerca), `plate`
(composición de lámina), `tail`, `spiral` (la vuelta de taladro alrededor del cuerpo), `chase`, `fall`.

| Sección | Paleta | Qué pasa | Input |
|---|---|---|---|
| **intro** (0–12) | `hAbyss` | Arranque en frío. **Bajo el agua**: nuestro casco es una silueta en la superficie clara; el coloso pasa por debajo, encadenado. Dolly-in lento al **ojo cerrado** en lo hondo; en `shout_1` se abre (ámbar). Superficie de noche; la cadena sube | **tap** `mirada` («MÍRALO»): perfecto = el ojo te sigue + lavado ámbar |
| **build** (12–24) | `hSwell` | Las cadenas **salen del mar** tensas hacia la línea (plano `rise`), el oleaje crece; rugido «GRRRM ゴゴゴ». Cut-ins encadenados de la tripulación (Canelo, Luzterna, `$crew0`, `$crew1`) | **mash** `alas` (#12 → drop): las alas del barco se abren con cada toque |
| **drop** (24–48) | `hBreach` | **LA EMERSIÓN**: el coloso sale panza arriba del mar entre cadenas, cúpula de agua, cascada que le cae del lomo, «¡LEVIATÁN! リヴァイアサン». Cada **acento medido** es un tiro del cañón estelar a un sello. En 36,0 la melodía principal: anillos de luz | **9 taps** `s1a–s1i` (`DROP1`): perfecto = el rayo rompe el sello + impacto + «¡CRAC!/¡ZAS!/¡FUERA!…»; bien = lo raja «¡TOC!»; fallo = rebota «¡CLANK!» y Canelo se golpea. **choice** `cola` (las aletas: ¿arriba o abajo?) |
| **build2** (48–60) | `hBreach` | Lo **izan a tirones** sobre los bombos tartamudos (cada uno lo sube y sacude la cámara), el mar cae de su cuerpo | **hold-release** `despegue` (#34 → #38): suelta en el golpe y el barco despega tras él |
| **break** (60–72) | `hPlate` → lámina `sepia` | **LÁM. I — El Leviatán Invertido.** El mundo se vuelve grabado, dibujado línea a línea con la melodía: el perfil del coloso, el ojo, las cadenas, la tripulación mirando. `shout_4`: el rugido agrieta la lámina | **taps opcionales** `canto0–2` (tinta que brota) |
| **drop2** (72–96) | `hStorm` | La lámina se rompe en esquirlas: **LA TORMENTA**. Lluvia, niebla cerrada, **un rayo por acento**, nubes iluminadas desde dentro. Sellos bajo la lluvia. Andanada general. Un eslabón del tamaño de una casa cae hacia nosotros | **9 taps** `s2a–s2i` (`DROP2`); **mash** `andanada` (#56–#59): 9 / 5 / 2 balas; **choice** `eslabon` (izquierda/derecha) |
| **build3** (96–106,5) | `hStorm` → `hGilt` | Salimos por arriba de la tormenta; la luz se vuelve oro. En `big_hit_3` **se rompe la primera cadena** | **hold-release** `carga` → `big_hit_3`: el cañón estelar a pleno «¡ROMPE! コワセ» |
| **break2** (106,5–120) | lámina `gilt` | **LÁM. II — La canción.** El coloso canta (boca abierta); grabado café sobre marfil, cadenas, ojo | **taps opcionales** `canto3–5` |
| **build4** (120–132) | `hGilt` | Sobre el **mar de nubes dorado**; plano héroe del barco con el coloso detrás; cut-in de Canelo «イクゾ» | **hold-release** `maquina` → `drop_3` |
| **drop3** (132–156) | `hGilt` | **EL CIELO**: toda la tripulación lo da todo — **un cut-in por tiro** (Canelo, Luzterna y tus dos gatos, alternando lados), estelas de velocidad | **11 taps** `s3a–s3k` (`DROP3`) |
| **build5** (156–168) | `hHigh` | Dejamos el aire: índigo, primeras estrellas. Dos rugidos; en `big_hit_5` **la segunda cadena** | **choice** `rugido` (¿por dónde?), **tap** `s5` |
| **break3** (168–180) | lámina `atlas` | **LÁM. III — Entre las estrellas**: un **atlas celeste**, oro sobre índigo | **taps opcionales** `canto6–7`; **hold-release** `todo` → `climax` |
| **climax** (180–204) | `hAstral` | **LAS ESTRELLAS**: la lámina se rompe en esquirlas índigo y oro; **se abre la grieta** en el cielo (borde blanco, otro cielo dentro); la **vuelta de taladro** alrededor del cuerpo (`spiral`), nebulosa. Todos a la vez contra **LA LÍNEA**: se agrieta. **Triple acento (203,6): tres cadenas a la vez** | **9 taps** `sc0–sc8` (`CLIMAX`); **mash** `todos` (#132–#135, 12/26) con los 4 cut-ins «¡JUNTOS! イッショニ» |
| **outro** (204–218,65) | `hFall` | Las últimas cadenas **lo jalan de vuelta** a tirones (bombos tartamudos) hacia el mar de nubes al atardecer; el ojo nos mira; plano héroe del barco: la pelea sigue. Nota de ritmo | **tap** `final` en `big_hit_6` «¡VAMOS!» |

Inputs: **59 prompts, 51 calificados** (8 opcionales): 49 taps, 4 hold, 3 mash, 3 choice; 687 cues. Avisos de medio compás en los tiros (el
sello mismo es el aviso), uno en lo demás.

### 16.4 Integración (H57)

- Gancho: `registerFaseInterlude('ruptura_leviatan', 'cielo', …)` en `songs/hemkade/index.ts` (la `MomentoDef` **no**
  lleva `battle`, para que `BattleScene` no lo toque dos veces). `FasesFx.stage()` hace el destello, cambia a la capa
  del cielo, emite la fase y **espera** el interludio antes de su cartel; la batalla espera esa puesta en escena antes
  del siguiente turno. La música de batalla se suspende y al volver salta a su sección del cielo.
- `H57_MOMENTO` en `app/oleada3Flow.ts` (la prueba lo mantiene igual).
- Fonoteca: `unlocks: ['hemkade']`. Partida: solo `ext.momentos.hemkade`.

### 16.5 Rendimiento (3D)

- Calidad alta: canvas 3D a la resolución del lienzo (tope 2048 px de ancho), antialias, 1300 nubes, 2600 gotas,
  3600 puntos de cascada, 28 ráfagas × 72 partículas. Baja: tope 1100 px, sin antialias, mitad de todo, mar con
  130² en vez de 220² vértices.
- Todo se compila antes del reloj (`warm()` muestra todo una vez y llama `renderer.compile`).
- Todas las partículas son de forma cerrada en el vertex shader (ráfagas, cascada, lluvia, estelas): cero trabajo de
  CPU por partícula. El nado del coloso también es de vertex shader (la columna vertebral existe en GLSL y en JS).
- `dispose()` libera geometrías, materiales, texturas de los sellos, el renderer y fuerza la pérdida del contexto.

### 16.5b Accesibilidad

- Los **rayos** de la tormenta piden permiso a `FlashGuard` (`bolt`): concedido = iluminan el cuadro al 55 %, si no al
  16 %; con «reducir destellos» siempre suaves. Color: la luz de la paleta (blanco-cian), nunca rojo. Los cuadros de
  impacto de los tiros pasan por el kit. Jugado perfecto: nunca más de 3 destellos en un segundo (prueba).
- **Reducir movimiento**: además de lo del kit (sacudidas/zoom/dutch ×0,3), la cámara 3D baja su dutch ×0,3, el giro
  del taladro del clímax ×0,3, las estelas a la mitad y no aplica la sacudida 3D.
- **Pausa** con Esc y al ocultar la pestaña (medido: deriva 0 ms al volver de las dos).
- Las láminas de grabado nunca parpadean: las líneas se agregan, no se encienden y apagan.

### 16.6 Medido (2026-10-10, Chrome sin cabeza, ANGLE Metal, audio real, **con vsync**, bot «perfecto», canción entera)

Ojo: la máquina estaba compartida con otros 5 agentes (carga 75–110); los tirones de > 50 ms caen donde subió la
carga, no en una sección fija (el costo por cuadro en scrub es plano en toda la canción).

| Qué | Alta | Baja |
|---|---|---|
| Deriva dibujado vs oído (cada cuadro, 218 s) | mediana **0 ms**, p99 **0 ms** (13 285 cuadros); igual tras Esc a los 60 s y tras ocultar la pestaña a los 150 s | mediana 0, p99 0 (13 427) |
| Sonido → cuadro que reacciona, **toda la canción** | bombos n = 284: mediana **8,3 ms**, p90 15,5, p99 21,1 · acentos n = 179: mediana **7,2**, p90 15,3, p99 39,1 | bombos n = 282: mediana 8,3, p99 26,4 · acentos n = 178: mediana 8,5, p99 26,4 |
| Tira de sincronía (compases 16–23, el drop) | bombos n = 34: mediana 8,0, máx 19,1 · acentos n = 46: mediana 7,5, máx 18,8 → el cuadro siguiente | — |
| Cues sobre onsets | n = 21: mediana 5,5 ms, p99 17 | mediana 6,2, p99 28,7 |
| Cuadros | **60 fps**: p50 16,7 ms, p95 20,1, p99 27,9; 19 intervalos > 50 ms | p50 16,7, p95 19,8, p99 22,9; 13 > 50 ms |
| Costo por cuadro (scrub, 1280×720) | lógica + 3D ~1,5–2 ms de CPU (`stage.update` 0,25, cadenas 0,35, `gl.render` 0,5–1); ~1 M triángulos, 22–67 llamadas | mitad de nubes, lluvia y partículas |
| Volumen | refuerzo +6 dB, sin ducking; pico −16,6 dBFS, RMS −27,9 dB | igual |
| Memoria (2 Momentos seguidos, heap tras GC) | 60,1 → 83,8 → 88,4 MB (la 1.ª carga módulos y pinturas); three.js: 70 geometrías, 2 texturas, 28 programas durante → **0 / 0 / 0** después de cada uno, contexto WebGL perdido a propósito; audio decodificado vuelve a **0 bytes** | — |
| Juicio | 59 prompts, nota S | S |

**Flujo real de H57** (`?save=rupturas-o3` → `__o3.jump('H57')` → `startStoryBattle('ruptura_leviatan')` → se cruza el
34 % → Momento → cielo), con tres bots: perfecto (S), fallado (C) y sin input (C). En los tres: la **huella del sim**
(turno, ganador, viento, gravedad, estado del rng, PV de cada celda y de cada gato) es **idéntica** al empezar y al
terminar el Momento; la batalla sigue en la capa del cielo (g 0,7) con su remix; la partida solo gana
`ext.momentos.hemkade` (`best` S/C). En carga alta la calidad automática bajó a «baja» a mitad del Momento (p95 > 24 ms):
funciona como debe.

### 16.7 Pruebas

`tests/momentoHemkade.test.ts` (12): cero advertencias, la canción entera hasta su último aliento, todos los tipos de
input y ≥ 50 calificados sin encimarse, cada tiro de los cuatro drops sobre un acento medido, rayos sobre los acentos
de la tormenta, solo verbos existentes, ≤ 3 destellos/s jugado perfecto, el gancho (interludio de FASES en `cielo`, no
el camino propio de `BattleScene`, igual a `H57_MOMENTO`), las tres capas de la batalla, **mismo resultado** con
perfecto / fallado / sin input (partidas idénticas salvo `best`) y **la misma batalla** (misma semilla → misma pelea
por mar → cielo, con el interludio registrado o quitado y con el spec clonado como al worker).

### 16.8 Herramientas (scratch del agente)

`list.mjs <nombre> "<query>" t1,t2,… [cols]` (hoja de contacto de instantes exactos), `full.mjs` (canción entera en
tiempo real: deriva, Esc, pestaña oculta, volumen, por sección), `lagall.mjs` (sonido → cuadro en toda la canción),
`strip.mjs` (tira de sincronía), `h57.mjs <perfect|miss|none>` (flujo real de la misión + huella del sim),
`mem.mjs` (heap y objetos de three.js tras dos Momentos), `gpu.mjs` / `parts.mjs` (costo por sección y por parte).

## 17. te ODIO (H55): hoja de coreografía y guía de estilo «GRAFITI Y SEÑAL ROTA»

> Agente MOMENTO-TE-ODIO, 2026-10-10. Carpeta `game/src/momentos/songs/teOdio/` (score, stage, art, spray, bake,
> post, verbs, shots). Ruta DEV `?momento=te_odio`. Gancho: `battle: { id: 'ruptura_disruptores', fase: 'glitch' }`
> (BattleScene → `runBattleMomento`, igual que LIKY FIGHT). Prueba: `tests/momentosTeOdio.test.ts`.

### 17.1 Guía de estilo: «GRAFITI Y SEÑAL ROTA»

Nada de NEÓN CEL: ni katakana, ni cut-ins en franja, ni cuadros de impacto de anime. Dos artes se pelean por el mismo
mundo y, cuando el filtro de la canción se cierra, todo se degrada a una transmisión rota.

1. **Dos artes, el mismo mundo** (prop `style` 0..1). **Cómic limpio de la caja**: tinta casi negra, línea gruesa,
   tramas Ben-Day, cuatricromía de periódico (`PRINT`), globos POW con estrella, rótulos Bangers. **Spray callejero de
   los Disruptores**: plantilla de 3 tonos, fluo (`FLUO`), sobrespray, chorreones, papel arrancado, tags en
   Permanent Marker y palabras de plantilla en Bebas Neue. Los barcos, las rocas, el fondo y los gatos existen dos veces
   (`art.ts`, `bake.ts`: el gato cómic es el horneado cel con ajustes de historieta; el callejero es ese mismo horneado
   re-pintado como plantilla con halo de sobrespray). Cero costo por cuadro: todo se hornea al cargar.
2. **El frente**: una diagonal cruza la pantalla desde su lado; en el cómic es un borde de viñeta, en la calle es papel
   roto y sobrespray. Cada personaje viste el arte del lado donde está parado (cambia de pintura al cruzar).
3. **Grietas** (prop `rifts`): ventanas ovaladas del OTRO arte. Lo que cruza cambia de dueño (adelanto visual de la
   fase glitch de la batalla).
4. **La rejilla de la caja** (prop `grid`): canaletas de viñeta en pantalla, entre los sujetos (0,5 = entre los barcos;
   0,9 = el margen; una franja sobre nuestra popa), que Brecha rompe en los bombos y la mano vuelve a dibujar en la
   melodía.
10. **Pantallas de puntos grandes = baldosas** (`benDayLayer`): una trama Ben-Day a pantalla completa dibujada como
    círculos son ~100 k vértices, y los batchers en pool de Pixi crecen hasta la geometría más grande que sirvieron (el
    heap subía en cada reproducción). Las tramas grandes son TilingSprites de una baldosa por tamaño de punto
    (cacheada en la sesión); las chicas siguen siendo `benDay`.
5. **Señal rota** (`post.ts`, `StageApi.post`): un solo pase propio después de la gradación del kit, con datamosh por
   bloques, banda de tracking y desgarro, separación de croma, paso bajo (la parte filtrada de la canción),
   pixelado, líneas de barrido, nieve y fósforo; modo **plantilla** (los stops: todo el cuadro en 3 tonos de spray) y
   modo **fotocopia** (fanzine). Si todos los uniforms están en 0, el runner ni lo monta.
6. **Tipografía**: tag (Permanent Marker, con halo y chorreones), plantilla (Bebas Neue con puentes), cómic (Bangers
   en globo POW), glitch (Rubik Glitch). Solo onomatopeyas y consignas de 1–3 palabras.
7. **Impacto = «slam» de plantilla**, no cuadro de anime: el cuadro entero pasa a 3 tonos de spray un instante (pasa
   por la `FlashGuard` como cualquier impacto; nunca rojo saturado: el tono medio es fluo y `safeFlashColor` lo
   revisa).
8. **Ritmo**: personajes en dos (12 fps), el pintado del set también en dos (paredes, grietas, caja), los FX lisos.
9. **Paletas propias** (`TE_PALETTES`): `tvoid` (vacío del cold open) · `street` · `comic` · `stencil` (los stops) ·
   `night` (abordaje) · `hand` (la mano de luz) · `riot` (clímax) · `signal` (verde fósforo, el break) · `build` ·
   `fusion` (el drop: las dos artes a la vez).

Prohibido aquí: katakana, tinta negra pura en el lado callejero (la tinta es `INK` 0x141218), cut-ins de NEÓN CEL,
rojos saturados a pantalla completa.

### 17.2 Reacciones siempre encendidas (cada sonido tiene propósito)

- **Bombo** → ráfaga de spray de los cañones de la Lata + golpe de cámara (`cam.punch(0.012·env)`) + los cascos bajan
  y se aplastan. En la grieta (break/build) cada bombo es un tirón de la palanca de Brecha (la grieta se abre un
  escalón y le sale un rayo).
- **808 (bajo)** → la pared respira; las notas graves (midi < 38) pegan como impacto en la pared (sacudida + croma);
  los cascos se mecen según la nota.
- **Palmas/acentos** → bolitas de pintura que revientan en la pared; en el verso dejan tags persistentes (`wallTag`).
- **Hats** → niebla de spray de la lata de Grafitera.
- **Melodía** → brillan los tags / titilan las estrellas del cómic; la mano redibuja bordes.
- **Voz** → Brecha grita con ella; en los ganchos se escribe «TE ODIO» letra por letra; en el break, cada corte de la
  voz es un «TE ODIO» glitch en la cinta (bajo la barbilla durante los primeros planos).

### 17.3 Hoja de coreografía

120 BPM, compás = 2,000 s. **La canción entera, 0 → 214,0**, sin edición; corte duro en la cola del último golpe;
`tail: 'keep'` (la batalla sigue con el remix en su estado glitch).

| Sección (s) | Paleta | Qué pasa | Input |
|---|---|---|---|
| **intro** (0–4) | `tvoid` | El cuadro congelado de la batalla es un vidrio: Grafitera lo tagea («DISRUPTORES») trazo a trazo con los hats; en el primer bombo fuerte, una plantilla de la caja abierta; el tag chorrea en el único silencio | **tap** `rasga` (4,0, el primer drop): perfecto = el cuadro se arranca como un póster «¡RAAAS!» + slam + glitch; fallo = se rompe a medias «rip…» |
| **chorus** (4–20) | `street` | El mundo callejero: la Lata de Pintura con Brecha colgada del mástil-aerosol. Pósters engomados de la tripulación (Brecha ROMPECAJAS, Grafitera NEON TAG!, Hueco, Eco Mudo con glitch). En el gancho de la voz se escribe «TE ODIO» letra por letra; luego otra vez, en plantilla verde | **taps** `lata0–1` (latas de pintura lanzadas, ancla Canelo, aviso de medio compás) |
| **verse** (20–52) | `street`, `style` 0,5 | **Duelo de dos artes**: nuestra mitad vuelve a ser cómic limpio («¡ZAP!»), el frente cruza la pantalla. Las latas siguen volando (batazo con POW de cómic o mancha de pintura); las palmas dejan tags en la pared. Página de cómic de la caja con la tripulación (3 viñetas) que un tag rasga. **NEON TAG!** gigante contra la linterna de Luzterna. Primer plano de Eco Mudo entre estática («KSSHH»). Grafitera le lanza a Canelo una lata propia («¿PINTAS?») | **taps** `lata2–7` · **hold** `escudo` (#20→#22): perfecto = la linterna borra el tag; fallo = el tag la tapa |
| **chorus2** (52–68) | `stencil`, `style` 1 | **Los cuatro stops = plantillas**: el 808 se calla, el mundo se congela, cae una placa de cartón sobre el cuadro; con el golpe se levanta y queda lo pintado en la pared: caja cerrada «NO ABRIR», mano «¿QUIÉN DECIDE?», gato en caja «NADIE PREGUNTÓ», puerta abierta «¡ABRAN!» (+ un tag extra si fue perfecto) | **4 taps** `plantilla0–3` (en el regreso del bombo) |
| **verse2** (68–100) | `night`, `style` 0,24, rejilla | **Brecha nos aborda** («BOX BREAKER!»): salta a nuestra proa y pelea pata contra palanca dentro de la rejilla de viñetas de la caja, que ella rompe en los bombos. Cara a cara en la cubierta. Al final, guerra de pósters (Luzterna vs Brecha, uno encima del otro en los bombos) | **6 taps** `choque0–5` (palmas medidas) · **choice** `esquiva` (#44) · **mash** `empuja` (#46→#48, 10/20): la chispa del choque se desplaza con los toques |
| **chorus3** (100–132) | `hand`, `style` → 0 | **La mano de luz** cruza el cielo y redibuja todo limpio (`style` vuelve a cómic detrás de su lápiz); la rejilla se repara; su goma persigue nuestros tags. Primeros planos bajo la luz (Brecha, Luzterna, Canelo). En `predrop_dip` la caja se cierra sobre todos | **6 taps** `tag0–5` (sílabas fuertes de la voz): perfecto = el tag sobrevive a la goma · **hold-release** `palanca` (`predrop_dip` → clímax, «¡Y SUELTA!») |
| **climax** (132–164) | `riot`, `style` 1 | **Todo a la vez**: Brecha salta entre los barcos en los giros de frase, choques en los bombos, un ángulo nuevo cada compás, segundo NEON TAG! por el cielo con la mano redibujando detrás, bordes rotos y redibujados (melodía contra bombo), pósters de su rabia en la voz. Los duelos son primeros planos partidos en diagonal (pata contra palanca). Compás 80: la palanca entra en el borde de la caja — una línea — **¡CRAC!** (162) | **6 taps** `duelo0–5` (acentos más fuertes) |
| **break** (164–180) | `signal` | **El filtro se cierra**: el muro es la caja misma, de noche (página azul con Ben-Day, sus canaletas, nuestros tags desvaídos), con Brecha colgada de su palanca a la derecha. Por la grieta, una cinta rota (su propio filtro de señal): un mundito, una mano de luz que dibuja una caja alrededor, el sello «NO ABRIR», un gatito que corre a la línea. Cada corte de la voz = «TE ODIO» glitch. Primeros planos verdes (Luzterna, Brecha) | **3 taps opcionales** `sintonia0–2` (sintonizar la cinta, bonus) |
| **build** (180–202) | `build` | Cuatro en el piso: **cada bombo abre la grieta un escalón** (la palanca da un tirón, rayos); la cinta se aclara al abrirse. `filter_open` (196): la grieta revienta | **4 taps** `senal0–3` («¡SINTONIZA!») · **choice** `abrir` («¿ABRIR?»: izquierda = la pata de Canelo también en la palanca; derecha = la luz de la linterna empuja los bordes, que igual revientan) · **hold-release** `quiebre` (`big_hit_5` → drop, «¡ROMPE!»): mientras mantienes, la caja de la cinta se comba en cada bombo y se agrieta desde las esquinas |
| **drop** (202–212) | `fusion` | **Rearmado**: se abren las GRIETAS (ventanas del otro arte, «¡GRIETAS!»); lo que las cruza cambia de dueño. En 210, la composición final: las dos tripulaciones, las dos artes, la caja con la puerta abierta, «NINGUNA CAJA ES HOGAR» | **4 taps** `grieta0–3` (bombos del contratiempo; el aviso va en el borde de la grieta, nunca en la cara) |
| **outro** (212–214) | `fusion` | Cuatro primeros planos en plantilla cada medio tiempo (Brecha, Grafitera, Canelo, Luzterna) con slam de color, la nota de ritmo pintada con spray, **corte duro** a la fase glitch | — |

Inputs: **48 prompts: 43 calificados + 3 opcionales + 2 elecciones**. Nota con todo perfecto: S. Con todo perfecto la guardia nunca concede más de 3 destellos de pantalla completa por segundo
(probado con la partitura jugada perfecta).

### 17.4 Medido (canción completa, Chrome sin cabeza, ANGLE Metal, audio real, **vsync**, bot «perfecto»; máquina muy cargada: 6 agentes, carga 50–90)

| Qué | Calidad alta | Calidad baja |
|---|---|---|
| Deriva dibujado vs oído (cada cuadro dibujado) | mediana **0 ms**, p99 **0,1 ms**, máx 3,3 (12 686 cuadros) | mediana 0, p99 0,1, máx 0,9 |
| Bombo → primer cuadro en pantalla que reacciona (toda la canción) | n = 406: mediana **10,8 ms**, p90 14,1, p99 **23,2** | n = 407: mediana 11,2, p99 18,6 |
| Acento → cuadro (toda la canción) | n = 790: mediana **7,5 ms**, p90 14,5, p99 **19,5** | n = 788: mediana 10,2, p99 17,5 |
| Cues sobre onsets (inputs, golpes) | n = 57: mediana 8,8 ms, p90 15,2, p99 18,0 | mediana 10,9, p99 17,7 |
| Cuadros | **59,7 fps**: p50 16,7 ms, p90 18,7, p99 23,4; 14 intervalos > 50 ms y uno de 332 ms (la carga de la máquina) | **59,9 fps**: p50 16,7, p90 18,3, p99 21,1; 2 > 50 ms; 0 cuadros > 25 ms de lógica |
| Pausa | Esc a los 60 s y pestaña oculta a los 150 s: pausa y el tiempo se congela (Δm < 0,02 s en 2–3 s); al seguir, deriva 0 | — |
| Volumen | refuerzo **+6 dB** (×1,995), pico de salida −16,8 dBFS, RMS −25,6 dB; latencia base 5,3 + salida 24 ms, compensadas | igual |
| Memoria (heap tras GC, dos reproducciones en tiempo real) | **59,8 → 85,7 → 97,3 MB** (antes del arreglo de tramas: 62,2 → 95,3 → 110,5). El audio decodificado (pico 82 MB) vuelve a **0 bytes** tras cada una y el buffer preparado se reutiliza. Ciclos con dispose (arnés de memoria): 59 → 77 → 83 → 88 → 90 → 93 MB, se aplana como LIKY en el mismo arnés (59 → 75 → 80 → 83 → 82) | — |
| Juicio | 48 juzgados, nota S | S |

Tira de sincronía (compases 2–9, el coro): bombos n = 49, mediana 12,9 ms, p90 17,4; acentos n = 59, mediana 9,7 ms,
p90 16,6, máx 18,7 → **el cuadro siguiente** (60 Hz = 16,7 ms). Tirones arreglados en esta pasada: el primer golpe
(¡RASGA!) costaba 57–164 ms porque las palabras de las ramas se horneaban con una semilla que dependía del id del cue
(la pasada en seco usa −1): ahora la semilla sale del texto (`textSeed`); la nota de ritmo hornea S/A/B/C antes del
reloj; los pósters y las placas se arman y se dibujan una vez fuera de pantalla antes del reloj (`stage.prebuild`).

### 17.5 Integración (H55) y pruebas

- **Flujo real** (fixture `rupturas-o3` + `__o3.jump('H55')`, Kit Astral y combustible como en el Taller, luego
  `startStoryBattle('ruptura_disruptores')`, el lanzador de verdad): fase «El vacío» → al 50 % el Momento entra solo
  (BattleScene → `runBattleMomento`) → corte duro → la batalla sigue en la **fase glitch** (capa `glitch`, grietas,
  remix `te_odio.battle` sonando, hush apagado). Con los tres bots (perfecto / sin input / fallado): la huella del
  simulador (casillas, gatos, turno, fase) es **idéntica antes y después del Momento** y la misma en los tres; la
  partida solo gana `ext.momentos.te_odio` (`best` S / C / C).
- `tests/momentosTeOdio.test.ts` (11): cero advertencias; canción entera sin edición; todos los tipos de input con
  aviso de un compás (las latas, medio compás); cada input sobre un onset medido; tags de pared y «TE ODIO» en los
  ganchos; los stops congelan del silencio del 808 al bombo; solo verbos existentes y nada de NEÓN CEL; registro en la
  fase glitch de H55 y solo ahí; mismo resultado con bots perfecto/fallado/sin input (solo difiere la nota);
  la guardia de destellos con la partitura jugada perfecta; **H55 con la misma semilla da la misma pelea (vacío →
  glitch) con o sin el Momento registrado y con la spec clonada como al worker**.
- Accesibilidad: guardia de destellos (≤ 3/s, los slams de plantilla cuentan como impacto), `safeFlashColor` en el
  tono medio del slam (ningún rojo saturado a pantalla completa: el rosa fluo está fuera del rango), «reducir
  movimiento» (sacudidas, tracking y desgarro de la señal ×0,25–0,4), «reducir destellos» (sin slams a pantalla
  completa; nieve ×0,4 y bloques ×0,5), pausa con Esc y al ocultar la pestaña (medido arriba).

### 17.6 Herramientas (scratch del agente, borradas al terminar)

`par.sh <lista>` (hojas de contacto de 16 cuadros por sección en 3 carriles, `?scrub=1`), `shot.mjs` (cuadros exactos),
`run.mjs <high|low> <reproducciones>` (tiempo real con vsync: deriva, onset→cuadro de toda la canción, FPS, pausa con
Esc y pestaña oculta, nivel de salida, memoria tras GC), `h55.mjs <perfect|none|miss>` (flujo real de H55 con la
fixture `rupturas-o3` + `__o3.jump('H55')` → `startStoryBattle('ruptura_disruptores')` → 50 % → Momento → fase glitch,
huella del simulador y de la partida), `strip2.mjs` (tira de sincronía), `memprobe.mjs` (ciclos rápidos con dispose +
instancias vivas + instantáneas de heap), `gpuprobe.mjs` (tirones de primer dibujo).

## 18. YONOSE TODO (H64 → H65): hoja de coreografía y guía de estilo «ANIMATIC»

> Agente MOMENTO-YONOSE-TODO, 2026-10-10. Carpeta `game/src/momentos/songs/yonoseTodo/`, ruta DEV
> `?momento=yonose_todo` (`&scrub=1&auto=great`). Sin commit. (Numerado §18 para no chocar con te ODIO.)

### 18.1 Gancho y plomería

- **Una sola entrada:** `app/o4Finale.ts › playFinale()` → `registerFinaleMomento(playYonoseFinale)` (`finale.ts`, se instala
  perezoso desde `index.ts` solo en el navegador: `o4Finale` arrastra la UI de la isla y el registro lo importan pruebas en node).
- La plomería **se queda en `o4Finale`**: el Momento solo dice CUÁNDO, en tiempo de canción, por `bridge.ts`
  (`FinaleBridge`, puro): `choose(pick)` al elegir (o «nada» si nadie eligió al cerrar las miniaturas, `big_hit_2` 45,0) →
  `asleep()` cuando Canelo se acuesta (61,336, teclas) → `mentira()` en el golpe del clímax (**149,333**) → `wake()` en el
  último tic (207,675). Una vez cada uno, en orden; un salto atrás nunca paga dos veces; `finish('done')` paga lo que falte.
- **`from: 'credits'`** (recarga entre «Mentira» y REGISTRO 000, o «Volver a ver» de los créditos): la misma canción desde el
  `prechorus` (138,667, en compás) con solo la segunda parte de la partitura (`RESUME_DEF`, por la extensión
  `playMomento(id, { def })`); solo despierta a REGISTRO 000.
- **Respaldo:** si el Momento no está registrado o no puede tocar nada (sin mapa, error antes de su reloj) devuelve
  `'fallback'` y `playFinale` sigue con las cines `h64_mentira → h65_creditos` (variaciones, nunca la original).
- **Volver a ver:** `cine/replay.ts` manda `h64_mentira` / `h65_creditos` a `playFinale({ replay: true, from })` cuando hay
  Momento; «♪ YONOSE TODO» (`panels/Replays.ts`) también va por `playFinale`. Una repetición no aplica efectos de misión
  (el ctx de `o4Finale` no persiste nada); solo `ext.momentos.yonose_todo.{plays,best}` (cosmético).
- Fonoteca: `unlocks: ['yonose_todo']`, `source: 'Mentira'` (además de `unlockSoon` de la plomería; nunca dos veces).

### 18.2 Guía de estilo: «ANIMATIC»

El final se cuenta como **el storyboard animado del propio final**: un animatic a lápiz que se va calentando hasta
acuarela y termina en la pintura del juego. Nada de NEÓN CEL (sin katakana, cut-ins, cuadros de impacto ni líneas de
velocidad; los juicios son la palabra escrita a mano, sin estrella: `PromptTheme.star:false, font`).

1. **Tres artes del mismo dibujo, por píxel** (`paper.ts › AnimaticFilter`): el set se dibuja una vez en color plano limpio
   (`set.ts`) y el filtro lo redibuja como **lápiz** (dobles líneas de los bordes de color/alfa que *hierven*: el campo de
   temblor cambia en dos y en cada bombo; grafito que se agarra al diente del papel; tramado en las sombras; papel dentro de
   cada forma; trazos azules de boceto al principio), **acuarela** (pigmento sobre papel: granulación, retornos, bordes
   húmedos más oscuros, orillas rotas, el lápiz debajo) o **pintura** (el color tal cual y una línea de tinta: el juego).
2. **El color se esparce, no se corta:** `warm` base + dos *blooms* con frente irregular y marea oscura en el borde. El
   arranque en frío **despinta el cuadro real del juego** hacia el faro (la foto pasa por el mismo filtro: pintura → lápiz);
   el farol de Luzterna es la primera mota de color; el calor de Canelo dormido se extiende con el HOLD y estalla en el coro;
   en el clímax todo queda en acuarela intensa y en el outro se seca en la pintura del juego.
3. **Los gatos** (pinturas MAI con sus rigs) pasan por un pase propio (`catF`): Kuwahara al hornear, bordes más limpios,
   poco tramado y un tono de lápiz de color dentro, para que se lean como ellos y no como garabatos.
4. **Papel de cuaderno** (`PaperFilter`, post del set): grano y fibras + viñeta suave sobre TODO (lápiz, acuarela, tipografía).
5. **Mobiliario de storyboard** (pantalla, ya a lápiz): marco con marcas de registro, claqueta «ESC. 64 · PLANO 1», contador
   de cuadros (uno por nota de las teclas) y **la tira de tiempos** del animatic abajo: cada bombo (bloque), acento (tic) y
   nota del bajo (barra a su altura) corre bajo el cabezal — la música escrita.
6. **Notación de animador** (`pencil.ts`): arcos de movimiento con flecha, números 1·2·3, círculos rápidos, Z's; diálogo en
   cajas de storyboard con letra a mano (Permanent Marker) y las líneas personalizadas de la historia (`ctx.lines`).
7. **Tipografías:** a mano (Permanent Marker) para lo vivo; Playfair itálica, fría y perfecta, para la frase que escribe la
   mano de luz; Anton y la ficha en papel y tinta negra del juego para REGISTRO 000 y «CONTINUARÁ» (termina en el estilo
   del juego).
8. **Ritmo en dos** (12 fps) para trazos, olas y estrellas; los gatos se mueven en dos con paso que arranca en el tiempo.
9. **Interacción suave:** taps y holds (sin mash ni elección de dos lados); la elección de la historia son **tres
   miniaturas de storyboard** (1·2·3, ←·↓·→, A·S·D o tocarlas), que solo cambian el dibujo y la respuesta de Luzterna.
10. Paletas del grado del kit neutras (`lapiz`, `acuarela`, `pintura`: sin tramas de manga ni viñeta).

### 18.3 Siempre encendido (cada sonido tiene su propósito)

Onsets **regenerados por grilla** para esta canción (`audio-derivados/scripts/onsets_yonose.py`: cada 1/16 medido en los
stems; el genérico encontraba 2,4 bombos por compás y ~12 «notas» de un bajo que tiene una por acorde): bombo 4,8/compás en
los grooves y 0 en los breaks, acentos del dembow y el rim de los breaks, el tic-tac final, bajo = una nota por cambio de
altura, teclas = cada corchea del ostinato, `vox` vacío (instrumental).

- **Bombo:** el dibujo se redibuja (el hervor re-siembra), golpe de cámara, los gatos botan, el haz del faro se aviva, las
  páginas de créditos rebotan, un bloque en la tira.
- **Acento:** tic en la tira, una estrella parpadea, el brillo de la página; en el break, cada rim es un trazo del lápiz que
  intenta escribir y **se dobla alrededor del gato dormido**.
- **Bajo:** el mar se hincha según la nota, el cielo respira, la cámara se mece; en el prechorus cada nota abre un ojo.
- **Teclas:** en el intro cada nota dibuja una estrella; el contador de cuadros; la respiración de Canelo; cada letra de
  «A nadie le gustan los gatos.»; el brillo de la página.
- **Perc:** destellos de estrellas.

### 18.4 Hoja de coreografía (90 BPM, compás 2,667 s; la canción entera 0 → 208,6)

| Sección (compases) | Arte | Qué pasa | Input |
|---|---|---|---|
| **intro** (0–7) | pintura → lápiz | El cuadro del juego se despinta hacia el faro en el golpe de 0; el set dibujado toma su lugar. La noche se dibuja sola, una estrella por nota; el haz barre cada dos compases; la página en blanco brilla junto al faro; entra Luzterna | **tap** `farol` (18,67, teclas): la primera mota de color |
| **verse** (8–19) | lápiz | Cada gato de la isla llega saltando sobre un bombo fuerte (8 llegadas); `big_hit_1` todos miran el faro. «…¿Qué vas a escribir?». **Tres miniaturas** (UN MUNDO PERFECTO · ROMPER TODAS LAS CAJAS · NADA) de 37,3 a 45,0: la elegida se encierra en lápiz rojo, las otras se tachan; respuesta de Luzterna. Baja el lápiz gigante | **taps opcionales** `gato0–2` (bombos) · elección propia |
| **bridge** (20–23) | lápiz | Antes de que el lápiz toque el papel, Canelo sube a la página y da **tres vueltas**; se acuesta (H64: punto sin retorno) | **taps** `vuelta0–2` (teclas: 1·2·3; perfecto = elipse de movimiento limpia, fallo = garabato mareado) |
| **break** (24–31) | lápiz | El lápiz intenta escribir: cada rim es un trazo que se dobla alrededor de él. «Canelo. Bájate…». En `naked` (74,667) solo teclas: «Nadie puede escribir debajo de un gato dormido…»; su calor empieza a teñir | **taps opcionales** `pica0–1` · **hold-release** `calor` (77,34 → golpe del coro) |
| **chorus** (32–43) | lápiz → **acuarela** | El calor estalla y la acuarela inunda la isla de noche. El sueño de Canelo sube al cielo: **seis viñetas** de la Parte II (biblioteca, galeón, grafiti, leviatán, circo, el faro) | **taps** `sueno0–5` (acentos): la viñeta se colorea (fallo: queda gris) |
| **break2** (44–51) | acuarela pálida | El color se retira. «Es la primera vez que decide algo él solito…». Una **mano de luz** escribe en el margen de la página, una letra por nota: «A nadie le gustan los gatos.»; con el bajo (49–51) los gatos se remueven | — |
| **prechorus** (52–55) | acuarela pálida | Una nota de bajo = un gato abre un ojo | **hold-release** `mentira` («RESPIRA», 144,0 → clímax) |
| **climax** (56–70) | acuarela intensa | **149,333: «…MENTIRA.»** (tus gatos, todos a la vez): palabra enorme, mojada, salpica; la frase fría se lava. Los **créditos** cabalgan el clímax como páginas de acuarela: título, Ragosorio, MÚSICA ORIGINAL (las 6 con su viñeta), reparto, los gatos de la Parte II («???» si no los conoces), el Diario del Mar | **taps** `pinta0–3` (acentos; `big_hit_4/5` entre ellos): pintar la página |
| **outro** (71–75) | acuarela → **pintura del juego** | Gracias y enlaces; amanece; Canelo sigue dormido en la página; «Los gatos cruzan cualquier límite…», «Bueno, Capi…» | — |
| **fade_tail** (76–) | papel y tinta del juego | La ficha de **REGISTRO 000**: «observando» se tacha en 4 tics, «despertando» se escribe una letra por tic, subrayado y **CONTINUARÁ** en el último (207,675). Corte en 208,6 | — |

Inputs: 21 (16 calificados + 5 opcionales). Más la elección de las miniaturas (no calificada).

### 18.5 Medido (Chrome sin cabeza, ANGLE Metal, audio real, **vsync**, máquina muy cargada: 6 agentes, carga ~77)

| Qué | Resultado |
|---|---|
| Deriva dibujado vs oído (canción entera) | mediana **0 ms**, p99 **0 ms** (~12 300 cuadros); igual tras Esc a los 60 s y tras ocultar la pestaña a los 150 s |
| Bombo → cuadro que reacciona (toda la canción) | n = 165: mediana **9,4 ms**, p90 16,7, p99 24,4 · acentos n = 568: mediana 11,1, p99 26,1 |
| Tira de sincronía (coro, compases 33–38) | bombos mediana 6,8 ms (máx 17,3) · acentos mediana 6,8 ms (máx 18,1) |
| Cuadros, calidad alta forzada | **59,2 fps** (mediana 16,9 ms), p95 26,1, p99 31,7; 0 cuadros lentos de lógica (> 25 ms), 0 clips > 8 ms |
| Cuadros, calidad baja | **59,5 fps** (16,8 ms), p95 24,0, p99 30,3 (con la máquina así, la calidad automática baja sola) |
| Volumen | refuerzo **+6 dB** (×1,995), ducking 0 dB; pico −10,6 dBFS, RMS −28,4 dB |
| Memoria (heap tras GC) | 62 → 85 → 91 MB (dos reproducciones seguidas: casi plano la 2.ª) |
| Flujo real (fixture `rupturas-o4` → H64 de noche → faro) | audio real con +6 dB; elección por tecla registrada; H64 y H65 hechas, `oleada4_fin`, `b64_mentira#b`, `b65_continuara#a`, Fonoteca `yonose_todo` |

### 18.6 Pruebas

`tests/momentoYonoseTodo.test.ts` (15): cero advertencias y canción entera (y la reanudación desde el prechorus); inputs
suaves (tap/hold, avisos, etiquetas); cada input y cada momento de la historia sobre un onset medido; solo verbos
existentes y ninguno de NEÓN CEL; mismo resultado con 3 bots; el único destello pasa por la guardia; registro (Volver a
ver, Fonoteca, `ext.momentos`); el puente (orden, una vez, saltos atrás, «nada», reanudación, salida a medias); el final
real aplica la misión **exactamente una vez**; las repeticiones no cambian la partida; la recarga reanuda en los créditos;
las cines de respaldo siguen funcionando sin Momento o si no puede tocar.

### 18.7 Herramientas (scratch del agente, borradas al terminar)

`list.mjs`/`cold.mjs` (hojas de contacto de instantes exactos; `cold` arranca desde la isla para ver el despinte real),
`measure.mjs` (canción entera en tiempo real: deriva, Esc, pestaña, volumen, cuadros, memoria; `MQ=high|low`),
`syncan.mjs` y `strip.mjs` (sincronía), `flow.mjs` (flujo real H64→H65 con fixture), `pick.mjs` (elección por tecla).
