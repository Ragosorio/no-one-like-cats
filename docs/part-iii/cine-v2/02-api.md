# 02 · API de las Películas: cómo se escribe una

> Agente CINE, ronda 4 (2026-10-26). Lo leen los agentes que producen películas. Contrato: [14-plan-cinematografico.md](../14-plan-cinematografico.md) §2. Catálogo de estilos y técnicas: [01-investigacion.md](01-investigacion.md).
> ⚠️ Carpeta con spoilers de la Parte III. Nada se commitea ni se publica sin el OK del dueño.

## 0. Qué es una película

Una **película** es un Momento en **modo película**:

- La partitura es la de siempre (`at`, `on`, `key`, `tap`, `hold` de `momentos/score.ts`), sobre una línea de tiempo determinista.
- Todo se **construye y se hornea antes del reloj**, durante una pantalla de carga con estilo.
- Se puede **adelantar y retroceder**: `render(m)` dibuja cualquier instante exacto, así que la captura es exacta.
- Tiene de **0 a 3 entradas opcionales**. Jamás cambian el resultado: solo agregan un adorno.

Por dentro, `MomentoRun` (`momentos/runner.ts`) se reutiliza tal cual: el reloj, la partitura, los clips, la pausa, los avisos y la calidad. Lo nuevo es un escenario propio, `FilmStage` (`film/stage.ts`), que sabe de escenas, estilos, cámara 2.5D, clima, presentación y transiciones.

Hay cuatro tipos (`kind`):

| `kind` | Para qué | Música |
|---|---|---|
| `song` | Película de canción | La original del dueño (solo aquí y en la Fonoteca) |
| `briefing` | Presentación antes de una batalla, de 20 a 60 s | Silencio o una variación derivada |
| `interlude` | Puente de historia | Silencio o una variación derivada |
| `demo` | Pruebas de desarrollo | Silencio o una variación derivada |

---

## 1. Mapa de archivos (`game/src/film/`)

| Archivo | Qué hace | ¿Pixi? |
|---|---|---|
| `types.ts` | Los tipos de autor: `FilmDef`, `FilmSceneDef`, `CamKey`, `TransitionSpec`, `WeatherSpec`, `CardSpec`, `SubSpec` | No |
| `catalog.ts` | Estilos, climas, transiciones y tipografías conocidos, con los horneados que pide cada uno | No |
| `timeline.ts` | Línea de tiempo, base de tiempo, `toMomentoDef`, `validateFilm`, `skipMode`, `bakeManifest`, `isOriginalRef` | No |
| `camera.ts` | La cámara 2.5D (`camAt`, `frameCam`, `project`, `moves`, `shot`) | No |
| `registry.ts`, `films.ts` | El registro de películas (`registerFilm`) | No |
| `stage.ts` | `FilmStage`: horneado, escenas, planos, cámara, clima, transiciones, post, letterbox. Tipos del set: `SetModule`, `SceneCtx`, `FilmSet`, `PlaneOpts`, `FrameInfo` | Sí |
| `bake.ts` | `Baker`: trabajos con progreso, `shade`, `raster`, `blurred`, `warm` | Sí |
| `post.ts` | El post de la película (un solo pase) y sus `PostLook` | Sí |
| `transitions.ts` | Un shader con todas las transiciones | Sí |
| `present.ts` | Letterbox, tarjetas (`card`), subtítulos (`sub`), tipografías por dimensión (`TYPE`) | Sí |
| `weather.ts` | Lluvia, niebla, viento, nieve, relámpago, calima, rayos | Sí |
| `loader.ts` | La pantalla de carga con estilo | Sí |
| `styles/` | La biblioteca de estilos: `vangogh.ts`, `davinci.ts`, `noir.ts`, `catbake.ts` y `index.ts` (con los presets `acuarela`, `ukiyoe` y `mudo`) | Sí |
| `index.ts` | `playFilm(id, opts)` | Sí |
| `dev.ts` | La ruta `?film=<id>` (solo DEV) | Sí |
| `demo/` | La película de demostración (`?film=demo`) | Sí |

Pruebas: `game/tests/filmTimeline.test.ts` (núcleo puro) y `game/tests/filmEngine.test.ts` (catálogo, horneado y clima).

---

## 2. La definición (`FilmDef`)

```ts
export const MI_PELICULA: FilmDef = {
  id: 'antes_del_coloso',            // minúsculas, números y _
  title: 'Antes del coloso',          // sin spoilers: sale en la carga y en Volver a ver
  kind: 'briefing',
  track: 'hemkade.battle',            // null = silencio (rejilla sintética de 60 BPM)
  loader: { style: 'davinci', caption: 'PRESENTACIÓN' },
  scenes: [ /* FilmSceneDef[] */ ],
  score: [ /* momentos/score: at, on, key, tap, hold */ ],
  close: { kind: 'fade', dur: 1 },    // cómo termina (por defecto, fundido a negro de 1,2 s)
  look: { grain: 0.05 },              // post por defecto de toda la película
};
```

Se registra con una línea en `film/films.ts`: `registerFilm(MI_PELICULA)`.

| Campo | Qué es |
|---|---|
| `track` | La música. `null` = silencio. Una variación derivada (`'drunck.resaca'`, `'<canción>.battle'`) para presentaciones e interludios. Una **original** solo si `kind: 'song'` (`validateFilm` lo revisa). |
| `bpm` | El tempo de la rejilla sintética cuando no hay pista (por defecto 60: un pulso = un segundo). |
| `skip` | Sobrescribe la regla para saltar del tipo (§11). |
| `loader` | El estilo de la pantalla de carga (una `TypeStyle`) y su rótulo. |

---

## 3. Las escenas (`FilmSceneDef`)

```ts
{
  id: 'lluvia',                        // también es una dirección de tiempo en la partitura
  dur: 16.5,                           // segundos en pantalla, transición incluida
  style: 'noir',                       // o { id: 'noir', params: { accW: 0.1 } }
  set: () => import('./lluvia'),       // el módulo del set (§6)
  aspect: 2.39,                        // 1.78 = pantalla completa · 2.39 = scope · 1.33 = cine viejo · 1.5 = lienzo
  in: { kind: 'pageTurn', dur: 1.8, dir: -1 },  // cómo entra desde la escena anterior
  weather: [{ kind: 'rain', amount: 0.9, ground: 812 }],
  cam: shot(moves.crane(0.4, 7.4, 170, 560), moves.rack(3, 7, 1800, 1000)),
  camRm: [{ t: 0, y: 560, focus: 1000 }],  // opcional: la cámara con «Reducir movimiento»
  cards: [{ t: 1.6, dur: 3.6, num: 'III', text: 'SIEMPRE LLUEVE', sub: 'la última caja' }],
  subs: [{ t: 6, dur: 3, text: 'Y en otra caja, siempre llueve.' }],
  look: { grain: 0.1 },                // el post de esta escena, encima del del estilo
}
```

**La línea de tiempo** (`sceneTimeline`):

- La primera escena empieza en 0. Su `in` sale del negro.
- Cada escena siguiente se **encima** con el final de la anterior durante su `in.dur`. El solape nunca pasa de la mitad de ninguna de las dos.
- El `close` cubre el final de la última escena.
- `activeAt(tl, m)` dice qué hay en pantalla en el instante `m`: la escena `a`, la que entra `b` y el avance `p` de la transición.

---

## 4. El tiempo y la partitura

- **Sin pista**, la base de tiempo es una rejilla sintética de 60 BPM: cada escena es una **sección** y cada `<escena>_end` es un **marcador**. Así `'lluvia'`, `'lluvia+2'` (2 compases = 8 s) o `'#3'` funcionan como en los Momentos.
- **Con pista**, se usa su mapa de pulsos y las escenas se agregan como marcadores (`'lluvia'`, `'lluvia_end'`).
- Los números son segundos de película.

Lo que el motor compila solo a partir de las escenas: un cue `scene` al inicio de cada una, las tarjetas (`card`), los subtítulos (`sub`) y los relámpagos (`lightning`).

**Verbos disponibles:**

- los de la película: `card`, `sub`, `lightning`;
- todos los del kit de Momentos: `flash`, `impact`, `shake`, `punch`, `roll`, `whip`, `aberr`, `speed`, `focus`, `ring`, `burst`, `sparkle`, `confetti`, `sfx`, `notes`, `beat`, `cutin`, `panels`. Pasan por la `FlashGuard` como siempre.

**Llaves (`key`) que el escenario lee:**

| Llave | Efecto |
|---|---|
| `'<escena>.<clima>'` (p. ej. `'lluvia.rain'`) | La intensidad de ese clima (0..1), con tween |
| `'aspect'` | El formato de la imagen en vivo (manda sobre el `aspect` de las escenas) |

```ts
score: [
  key('lluvia+1', { 'lluvia.rain': 0.3 }, { dur: 2 }),   // escampa
  at('lluvia+2:2', v('flash', { amt: 0.4 })),
],
```

---

## 5. La cámara 2.5D (`camera.ts`)

**El modelo:** cada plano se dibuja en la caja de diseño de 1920×1080, tal como se ve con la cámara en reposo. La profundidad `z` del plano solo decide cómo reacciona:

| Profundidad | Cómo reacciona |
|---|---|
| 1000 (`FOCAL`) | El plano del sujeto: 1:1 con la cámara |
| > 1000 | Lejos: se mueve menos (el cielo a 6000 casi no se mueve) |
| < 1000 | Cerca: se mueve más |

**Las llaves de cámara (`CamKey`)**, en segundos locales de la escena:

| Campo | Qué es |
|---|---|
| `x`, `y` | Paneo o travelling y grúa, en px del plano a 1000 |
| `z` | Dolly: crece más lo cercano que lo lejano (paralaje real) |
| `fov` | Zoom del lente: todo crece igual |
| `roll` | Ángulo holandés (rad) |
| `focus` | La profundidad en foco. Los planos `bake: 'dof'` se desenfocan según `|z − focus| / dof` |
| `hand` | Cámara en mano (amplitud en px; ruido determinista) |
| `whip` | Barrido (px); su velocidad pone desenfoque de movimiento en el post |
| `ease` | Cómo entra el movimiento a esta llave (`linear`, `in`, `out`, `inOut`, `sine`, `expoOut`, `hold`) |

Cada campo hace tween desde la última llave que lo puso.

**Movimientos con nombre**, que se juntan con `shot(...)`:

```ts
cam: shot(
  moves.crane(0, 7, 150, 545),       // grúa
  moves.dolly(7.4, 11.6, 0, 170),    // dolly
  moves.truck(6, 10, 960, 1130),     // travelling
  moves.rack(3, 7, 1800, 1000),      // cambio de foco
  moves.dollyZoom(0, 2, 400),        // vértigo: el sujeto queda, el fondo respira
  moves.whip(5, 0.3, 900),           // barrido
  moves.dutch(9, 11, -0.04),         // holandés
  [{ t: 0, hand: 3 }],
)
```

- Un plano por el que la cámara pasa (`z` se acerca a su profundidad) **se desvanece** antes de llenar el lente.
- **`camRm`** (opcional, en la escena) es la cámara con «Reducir movimiento»: la versión calma de un viaje rápido, como una retención o un empuje lento en lugar de volar. La demo la usa para no volar dentro de la luna; la transición `match` encuentra la luna con `anchor: 'moon'` donde esté. Sin `camRm`, se usa `cam` sin cámara en mano ni barrido, con parallax aplanado y holandés ×0,3.
- **Plano largo:** una sola escena con llaves encadenadas, como la calle noir de la demo.

---

## 6. El set (`SetModule`)

Cada escena apunta a un módulo cuyo `default` es un `SetModule`:

```ts
const mod: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna'],     // se hornean en el Studio del estilo ANTES de build
  build(ctx: SceneCtx): FilmSet {
    const fondo = new Graphics()./* … */;
    ctx.plane(fondo, { z: 3600, bake: 'dof', blur: 10, dof: 2600 });
    const calle = new Container();
    const canelo = ctx.actor(ctx.canelo, 250);      // el puppet vivo, con el horneado del estilo
    if (canelo) calle.addChild(canelo);
    const p = ctx.plane(calle, { z: 1000 });
    return {
      update(lt, f) { canelo?.pose(lt, 600, 905, { flip: true }); },
      anchor: (name, f) => (name === 'subtitle' ? [960, 1000] : null),
    };
  },
};
export default mod;
```

**`SceneCtx`** (lo que recibe `build`):

| Miembro | Qué es |
|---|---|
| `plane(node, opts)` | Registra un plano 2.5D |
| `actor(slug, alto)` | Un `Actor` (puppet vivo) con el horneado del estilo |
| `still(slug)`, `silhouette(slug)` | Un sprite de la pintura horneada, o su silueta blanca (para teñir) |
| `baker` | El horneador (§10) |
| `tex(nombre)` | Texturas compartidas del estilo (`'dv:glow'`, `'nr:cone'`, `'nr:halo'`, `'nr:clouds'`…) |
| `weather(kind)` | El efecto de clima de la escena (p. ej. para montar `rain.ground` en el plano de la calle) |
| `canelo` | La forma de Canelo que tiene el jugador |
| `rm`, `rf`, `quality`, `density` | «Reducir movimiento», «Reducir destellos», el tier y el presupuesto de partículas |
| `dur`, `scene`, `film`, `style`, `params` | La escena, la película, el estilo y sus parámetros |

**`PlaneOpts`:**

| Campo | Qué es |
|---|---|
| `z` | La profundidad (§5) |
| `bake` | `'none'` (vivo) · `'static'` (se rasteriza una vez: una foto barata) · `'dof'` (además una copia desenfocada para el cambio de foco) |
| `res` | Multiplicador de resolución del horneado (un plano al que la cámara se acerca mucho necesita más) |
| `blur`, `dof` | Fuerza de la copia desenfocada y profundidad de campo |
| `parallax` | Escala el deslizamiento (0 = clavado a la pantalla) |
| `screen` | Clavado a la pantalla, delante de todo (gotas en el lente) |

Un plano `static` o `dof` es una **foto congelada**: el set no lo anima después de `build`.

**`FilmSet`** (lo que devuelve `build`):

| Miembro | Cuándo se llama |
|---|---|
| `update(lt, f)` | Cada cuadro, con el tiempo local de la escena |
| `look(lt, f)` | El post de este cuadro: un color que entra al mundo mono, un calor que sube |
| `anchor(name, f)` | Puntos de pantalla con nombre: `'subtitle'` mueve los subtítulos y la transición usa `TransitionSpec.anchor` |
| `light(x, y, lt)` | La luz en un punto de pantalla: la lluvia se ilumina dentro del cono de un farol |
| `dirtAt`, `heat` | Dónde brilla la suciedad del lente y la banda de calima |
| `filters` | Los filtros propios del set; se compilan en la carga |
| `destroy` | Al cerrar |

**`FrameInfo`** (el `f` de `update`):

| Miembro | Qué es |
|---|---|
| `lt`, `m` | Tiempo local de la escena y tiempo de película |
| `cam` | La cámara de este cuadro |
| `boil` | Paso de 8 fps para el hervor de lo pintado; vale 0 con «Reducir movimiento» |
| `step12` | Paso de 12 fps para líneas dibujadas a mano |
| `toScreen(plano, punto)` | Un punto del plano en pantalla, con el holandés incluido |
| `lit` | La envolvente del relámpago |

**Reglas del set:**

1. **Todo es función de `lt`.** Nada de tweens de GSAP con estado. Las partículas van en forma cerrada y con semilla. Lo único que corre con reloj propio es el respirar del puppet (igual que en los Momentos).
2. **Nada se crea en el reloj.** Las texturas, los textos y los `Graphics` grandes se hacen en `build`. Lo que se redibuja por cuadro es chico: un rectángulo de máscara, una llama.
3. **Un filtro propio va con `filterArea` enorme** (por ejemplo `new Rectangle(-4000, -4000, 9920, 9080)`) y se declara en `filters`.
4. **Las siluetas salen del arte real.** Para una silueta con borde, ojos y accesorio encendido, se usa `Silueta` (`momentos/songs/drunck/silueta.ts`) sobre el puppet, con `set(k, out)` desde `lt`. La calle noir de la demo lo hace con Luzterna.

---

## 7. Estilos

| id | Estado | Qué trae |
|---|---|---|
| `vangogh` | Completo | Pinceles de cerda horneados, `paintField` (miles de trazos sobre un campo de flujo, con capa de fondo), `halo` (anillos que giran), `swirl` / `wind` / `contour` (flujos), `ramp` / `gradient` (color), horneado **impasto** de gatos, post con lienzo |
| `davinci` | Completo | `parchment` (vitela con manchas, pliegue y bordes quemados), `Sketch` (líneas que se dibujan solas, con temblor de mano), `hand`, `circlePts`, `rectPts`, `mirrorNote` (escritura en espejo), `glow` (vela), trama de plumilla, horneado **sketch** de gatos (tinta, trama zurda, sanguina) |
| `noir` | Completo | `building` (fachadas), `neon` (letrero con resplandor horneado), `flickerAt`, `makeWet` / `setWet` (reflejos mojados con estela vertical), `LensDrops` (gotas en el lente), cono de farol, halos, nubes; horneado **noir** de gatos (alto contraste con luz de borde); post mono que conserva dos tonos |
| `acuarela` | Preset | Horneado de gatos (pigmento en los bordes, granulado) + post con papel |
| `ukiyoe` | Preset | Horneado de gatos (4 tintas de plancha, contorno, veta) + post |
| `mudo` | Preset | Horneado ortocromático de gatos + post con sepia, parpadeo y rayas |

**Agregar un estilo:**

1. Su fila en `catalog.ts` (`STYLES`), con sus horneados.
2. Su módulo en `styles/index.ts` (`STYLE_MODULES`): `look`, `catBake`, `prepare` y `ground`.
3. Su kit en `styles/<id>.ts`.

`filmEngine.test.ts` revisa que el catálogo y los módulos coincidan.

**`PostLook`** (las llaves de `look`, todas numéricas):

| Grupo | Llaves |
|---|---|
| Película | `grain`, `vig`, `aberr`, `hal` / `halT` / `halR` (halación), `flicker`, `scratch` |
| Color | `contrast`, `lift`, `sat`, `warm`, `expo`, `tint` / `tintAmt` |
| Mono y sepia | `mono`, `sepia`, `accHue` / `accW` y `accHue2` / `accW2` (dos tonos que se conservan; el tono va de 0 a 1) |
| Soporte | `canvas`, `paper`, `dirt` |

En una transición, el post se mezcla entre las dos escenas.

---

## 8. Clima y luz (`WeatherSpec`)

```ts
weather: [
  { kind: 'rain', amount: 0.9, angle: 0.16, ground: 812 },  // ground = línea de salpicaduras
  { kind: 'fog', amount: 0.5, z: 2400 },                    // con z: niebla entre planos (perspectiva aérea)
  { kind: 'rays', amount: 0.55, from: [612, 300], z: 1000 },
  { kind: 'lightning', strikes: [9.3], z: 5200 },           // cada golpe pide permiso a la FlashGuard
  { kind: 'wind', particle: 'leaf' },                       // leaf · petal · ember · dust · firefly · stroke · drop
  { kind: 'snow', amount: 0.6 },
  { kind: 'heat' },                                         // banda de calima en el post (el set puede dar su `heat`)
]
```

- Sin `z`, el clima va delante, en pantalla. Con `z`, va en un plano a esa profundidad.
- La lluvia trae un `ground` con salpicaduras y anillos. El set lo monta en su plano de calle con `ctx.weather('rain').ground`.

---

## 9. Transiciones (`TransitionSpec`)

| `kind` | Qué cuenta | Campos útiles |
|---|---|---|
| `cut`, `fade`, `dissolve` | Corte, fundido a un color, disolvencia | `color` |
| `iris` | Abre o cierra en un punto | `at` o `anchor`, `out` |
| `door` | Dos hojas que se abren | — |
| `pageTurn` | La página se curva y se da vuelta | `dir`, `tint` (el papel) |
| `inkBleed` | Manchas de tinta que crecen y se juntan | `at`, `tint`, `seed` |
| `paintSmear` | Filas de brochazo que barren | `dir`, `tint`, `seed` |
| `glitch` | Bloques que cambian, la costura se rasga | `seed` |
| `objectToSet` | El rectángulo de un objeto crece hasta ser el cuadro | `rect` |
| `match` | Disolvencia por forma (la luna → el círculo) | `at` |
| `whip` | Barrido: las dos escenas se deslizan con desenfoque | `dir` |
| `lightLeak` | Una fuga de luz cálida | `tint` |

- Las transiciones normales **revelan la escena que entra**. `pageTurn` y `door` **ocultan la que sale**.
- Con `out: true` cualquier tipo se juega sobre la que sale. Así un iris se cierra sobre la linterna mientras la escena siguiente espera debajo.
- `anchor: 'lantern'` toma el punto vivo del set (`FilmSet.anchor`).
- **Con «Reducir movimiento»** toda transición que viaja se vuelve `dissolve`, con la misma duración (`TRANSITIONS[kind].reduced`).

---

## 10. Presentación

- **Formato:** cada escena pide su `aspect`. Las barras se mueven durante las transiciones: la pantalla cambia de forma con el estilo, de lienzo a página y a scope. La llave `'aspect'` lo maneja en vivo.
- **Tarjetas** (`cards`): una tipografía por dimensión (`TypeStyle`), cada una con su entrada:

| `style` | Fuente | Entrada |
|---|---|---|
| `vangogh` | Permanent Marker, amarillo cromo | Pintada con pincel, letras que hierven, subrayado de brocha |
| `davinci` | Playfair Display cursiva, sepia | La tinta se escribe sola; la línea pequeña va en espejo |
| `noir` | Bebas Neue espaciada | Banda plana estilo Saul Bass y las palabras después |
| `bass` | Bebas Neue oscura sobre ámbar | Igual que `noir` |
| `silent` | Playfair Display | Intertítulo con marco art déco |
| `tv`, `ukiyoe` | Bangers / Dela Gothic One | Sello |
| `default` | Anton | Fundido que sube |

- **Subtítulos** (`subs`): van en `layers.ui`, sin post, siempre nítidos. Se sientan **dentro de la barra de cine** cuando mide 70 px o más (la zona más calmada que hay). Si no, van abajo sobre una placa suave. El set puede moverlos con el ancla `'subtitle'`. El validador pide menos de 90 caracteres y tiempo de lectura de unos 17 caracteres por segundo, con un mínimo de 0,9 s.

---

## 11. Entradas y saltar

**Entradas:** de 0 a 3, con `tap`, `hold` o `choice`.

- Nunca `mash`.
- Siempre son **opcionales**: el motor las marca así aunque el autor escriba otra cosa, y nunca califican.
- Sus ramas solo agregan adornos. Una rama no puede cambiar de escena.

```ts
score: [tap('noche+2', { id: 'estrella', label: 'TOCA' }, { great: [v('sparkle', { at: [1290, 200] })] })],
```

**Saltar** (`skipMode(def, seen)`):

| `kind` | Primera vista | Después de verla |
|---|---|---|
| `song` | `never` (solo pausa) | `pause` (SALIR en el menú de pausa) |
| `briefing`, `interlude` | `never` | `button` (chip SALTAR) |
| `demo` | `button` | `button` |

- **Persistencia:** `playFilm(id, { seen })` recibe si ya se vio, y devuelve `FilmResult` con `{ end: 'done' | 'exited' | 'aborted', skip, inputs }`.
- Guardar «visto» y llevarlo a «Volver a ver» es de MECÁNICAS: la película no toca la partida.

---

## 12. Horneado previo (lo que pasa en la pantalla de carga)

Orden:

1. Núcleo: la textura de soporte, el post, el programa de transiciones y las fuentes.
2. Los trabajos de cada estilo.
3. Las texturas de clima.
4. Los módulos de set.
5. **Los gatos de cada estilo**, en un `Studio` propio con su horneado.
6. **Cada escena** (`build`; los planos `static` y `dof` se rasterizan).
7. **El calentamiento:** cada escena se dibuja fuera de pantalla al principio, a la mitad y al final con sus filtros. Cada filtro, una máscara y el post del kit se compilan una vez.

Al terminar se compara con `bakeManifest(def)`. Si falta algo, sale en consola y en `__film.info().missing`.

**`Baker`:**

| Método | Qué hace |
|---|---|
| `add(nombre, etiqueta, fn)` | Encola un trabajo; la etiqueta sale en la carga |
| `shade(nombre, w, h, glsl, uniforms)` | Un fragment shader corrido una vez sobre un lienzo → textura. Trae `NOISE` y `bakeUV()` (incluye `BAKE_UV`) |
| `raster(contenedor)` | Una foto de un contenedor, a través de un envoltorio desechable |
| `blurred(tex, fuerza)` | Una copia desenfocada, a menor resolución |
| `warm(contenedor, filtros)` | Lo dibuja una vez en un objetivo diminuto: compila, sube y tesela |

Todas las texturas son del horneador y se liberan al cerrar.

**Reglas que ya costaron caro** (detalle en `01-investigacion.md` §10):

- **Nada de RenderTextures por cuadro.** Ningún filtro en un contenedor que cambia de tamaño: los filtros van en hosts de pantalla completa o con un `filterArea` enorme.
- Al hornear se **envuelve** el contenedor: Pixi vuelve render group para siempre lo que pasas a `render()`.
- **Nunca `new Filter({ resolution: undefined })`**: Pixi se salta el filtro sin avisar. Usa `glFilter` (`film/gl.ts`).
- **Calienta todo lo que se encienda tarde**: un relámpago encendía el post del kit y compilaba en el cuadro (2,1 s).
- **El GC de texturas de Pixi** descarga de la GPU lo que lleva 60 s sin dibujarse y lo vuelve a subir en su siguiente dibujo: en una película de más de un minuto, todo lo horneado en la carga regresaba como tirones de 0,3 a 1,9 s (F06, en el segundo 63). `playFilm` lo apaga mientras la película suena (`renderer.gc.enabled`; en Pixi anterior a 8.15, `textureGC.active`) y lo restaura en su `finally` (`film/texturegc.ts`, prueba en `tests/filmActo1.test.ts`). Además, **calienta también lo que se muestra tarde dentro de una escena** (insertos, palabras, utilería): el calentamiento del motor solo dibuja cada escena al principio, a la mitad y al final. F06 hace un `ctx.baker.warm()` de todo su set con todo visible (`films/acto1/f06/sets.ts`, `showAll`).

---

## 13. Accesibilidad (obligatoria)

| Ajuste | Qué hace el motor |
|---|---|
| «Reducir movimiento» | Transiciones que viajan → disolvencia. La cámara calma de la escena (`camRm`) si la tiene. Parallax ×0,3. Sin cámara en mano ni barrido; holandés ×0,3. Sin hervor. Lluvia y partículas al 60 %, sin giro. Gotas del lente quietas. La línea de tiempo no cambia. |
| «Reducir destellos» | El relámpago a pantalla completa es suave (`flashGrant` → `'soft'`); el rayo se dibuja tenue. El parpadeo de cine viejo queda ≤ 0,15. La vela parpadea a la cuarta parte. |
| Siempre | `FlashGuard`: máximo 3 destellos de pantalla completa por segundo, nunca rojo saturado |

**Lo que hace quien produce:**

- Leer `ctx.rm` y `ctx.rf` en sus sets.
- Dar una versión calma a cada viaje rápido (`camRm`, §5).
- No contar nada solo con un efecto.
- Capturar la película con `&rm=1&rf=1` antes de entregarla.

---

## 14. Probar y capturar

**Rutas** (`npm run dev`):

| Ruta | Qué hace |
|---|---|
| `?film=<id>` | La película sola, con su regla de saltar de primera vista |
| `&seen=1` | Como si ya se hubiera visto |
| `&scrub=1` | Sin reloj; `__film.render(m)` dibuja el instante exacto `m` |
| `&rm=1`, `&rf=1` | «Reducir movimiento» y «Reducir destellos» solo para esta sesión (no se guardan) |
| `&mq=low` | Fuerza el tier bajo |

**En la consola:**

- `__film.info()`: largo, escenas, horneados hechos y su tiempo, faltantes, reloj y calidad.
- `__film.slow()`: los cuadros y clips lentos.
- `__film.length()`, `__film.pause()`.

**Arnés sin cabeza:** Chrome con `--use-angle=metal` y puppeteer-core, con un Vite propio (`hmr: false`).

- Hoja de contacto: un `render(m)` por instante y una captura.
- Rendimiento: los tiempos de `requestAnimationFrame` desde que arranca el reloj (`__film.info().m > 0`).

Las capturas viven **fuera del repo**.

**Medición de la demo** (2026-10-26, Apple M4, Chrome sin cabeza a 1920×1080, calidad alta, 48 s):

| Modo | fps | p50 | p95 | p99 | Cuadros > 33 ms | Cuadros > 50 ms |
|---|---|---|---|---|---|---|
| Limitado a 60 Hz | 60,0 | 16,7 ms | 16,7 ms | 16,8 ms | 0 | 0 |
| Sin límite (margen) | ~229 | 3,7 ms | 11,3 ms | 13,0 ms | 1 (37,5 ms, la entrada a la luna) | 0 |

El horneado tarda entre 0,9 y 1,4 s; el reloj arranca unos 2 s después de abrir la ruta.

---

## 15. Ejemplo mínimo: una presentación de 24 s

```ts
// game/src/film/briefings/coloso.ts
import type { FilmDef } from '../types';
import { moves, shot } from '../camera';

export const COLOSO: FilmDef = {
  id: 'coloso',
  title: 'El coloso',
  kind: 'briefing',
  track: null,
  loader: { style: 'davinci', caption: 'PRESENTACIÓN' },
  scenes: [
    {
      id: 'estudio', dur: 13, style: 'davinci', set: () => import('./colosoEstudio'),
      in: { kind: 'inkBleed', dur: 1.4, tint: 0x3b2412 },
      cam: shot([{ t: 0, z: 120 }], moves.dolly(0, 6, 120, -200), [{ t: 0, hand: 2 }]),
      cards: [{ t: 1, dur: 3.4, num: 'I', text: 'El coloso', sub: 'su regla: nadie lo toca dos veces' }],
      subs: [{ t: 6, dur: 3.2, text: 'Golpea una vez. Después, todo pesa el doble.' }],
    },
    {
      id: 'riesgo', dur: 12, style: 'noir', set: () => import('./colosoRiesgo'), aspect: 2.39,
      in: { kind: 'pageTurn', dur: 1.6, dir: -1 },
      weather: [{ kind: 'rain', amount: 0.7, ground: 820 }],
      cam: moves.crane(0, 8, 200, 560),
      subs: [{ t: 3, dur: 3.4, text: 'Si pierdes, la isla se queda sin faro.' }],
    },
  ],
};
```

```ts
// game/src/film/briefings/colosoEstudio.ts
import { Container, Sprite } from 'pixi.js';
import type { SetModule } from '../stage';
import { parchment, Sketch, circlePts, hand } from '../styles/davinci';

const mod: SetModule = {
  cats: ['fossilstone_guardian_cat'],
  build(ctx) {
    const page = new Sprite(parchment(ctx.baker, 2240, 1420, 7));
    page.position.set(-160, -170);
    const p = new Container();
    p.addChild(page);
    ctx.plane(p, { z: 1000, bake: 'static' });
    const circle = new Sketch([{ pts: hand(circlePts(960, 480, 280, 64), 2, 3) }]);
    const coloso = ctx.actor('fossilstone_guardian_cat', 460);
    const d = new Container();
    d.addChild(circle);
    if (coloso) d.addChild(coloso);
    ctx.plane(d, { z: 999 });
    return {
      update(lt, f) {
        circle.draw(Math.min(1, lt / 1.6), f.step12);
        coloso?.pose(lt, 960, 760, {});
      },
    };
  },
};
export default mod;
```

Una línea en `film/films.ts` (`registerFilm(COLOSO)`) y se abre con `?film=coloso`. La prueba mínima es `expect(validateFilm(COLOSO)).toEqual([])`.

---

## 16. Checklist

- [ ] `validateFilm(def)` sin advertencias: escenas, tarjetas, subtítulos, cámara, partitura, música, entradas.
- [ ] Música: silencio o variación derivada; una original solo en `kind: 'song'`.
- [ ] Cada idea en ritmo lento (presentar → mostrar → consecuencia → avanzar); los efectos rápidos, entre planos legibles.
- [ ] Las siluetas salen del arte real (`Silueta` sobre el puppet).
- [ ] Subtítulos cortos sobre una zona calmada; tarjetas con la tipografía de su dimensión.
- [ ] `__film.info().missing` vacío; ningún tirón al arrancar el reloj.
- [ ] Capturada con `&scrub=1`, con `&rm=1&rf=1` y medida a 60 Hz.
- [ ] Nada de raster en el repo; las capturas, fuera.

---

## 17. Añadidos de la oleada 3 (el final)

Todos son opcionales y compatibles: una película que no los usa se comporta igual que antes.

**Música sin registrar todavía.** `FilmDef.map` recibe el mapa de pulsos en crudo (`import sadieMap from 'data/music/beatmaps/sadie.json'`). La película queda en su rejilla exacta y en silencio hasta que la pista entra en `tracks.json`; después suena sola. `validateFilm` ya no se queja de una pista desconocida si trae su `map`.

**Puertas («continuar»).** `FilmDef.gates: [{ scene, t, label, at? }]`:
- el reloj se detiene en ese instante y un botón espera el toque (DÍSELO, «Toca el faro»);
- `at` es un punto o el nombre de un ancla del set (`'faro'`);
- cuentan dentro de las 0–3 entradas; el modo scrub las ignora.

**Toques libres** (escenas interactivas: la noche sin Canelo, la vigilia). El set da:
- `hotspots(f)`: los puntos que se pueden tocar en este cuadro (en pantalla);
- `tap(name, lt)`: se llama al tocar uno.

El set hace el gesto desde ese instante; si nadie toca, el gesto llega solo a su hora. No son avisos ni califican. El scrub los ignora.

**Gatos en otros tratamientos.** En `cats`, `{ slug, bake }` pide un gato con otro horneado. Se usa con `ctx.actorAs(bake, slug, alto)` y `ctx.stillAs(...)`.
- Los horneados están en `styles/catbake.ts` (`CAT_BAKES`): `impasto`, `sketch`, `noir`, `acuarela`, `ukiyoe`, `mudo`, `plano` (la pintura tal cual), `gris` (Canelo sin llama, con la bufanda pintada encima), `vidrio`, `klimt`, `lino`, `realismo` y `tv`.
- `cats` puede ser una función de `{ canelo, scene }`: así cada plano hornea solo lo que muestra.

**Estilos nuevos:**

| id | Qué es | Kit |
|---|---|---|
| `linterna` | Linterna mágica: placas de vidrio pintado, anilinas, aro de latón, polvo en el haz | `styles/linterna.ts`: `bakePlate` (compone y rasteriza una placa con su gemela desenfocada), `glass`, aro de latón |
| `klimt` | Pan de oro: mosaico de cuadros, espirales y ojos | `styles/klimt.ts`: `goldLeaf(modo)`, destello |
| `posada` | Linograbado: dos tintas sobre papel crema | `styles/posada.ts`: papel, `gouges` (líneas de gubia) |
| `realismo` | Tormenta y madrugada: luz natural, grano, halación | — |
| `pintura` | La pintura del juego sin filtros (casa) | — |
| `borracha` | La caricatura de la Borracha, lavada y sin risas | — |
| `gato` | Visión de gato: duotono (azul y amarillo), lo oscuro se ve claro | post `duo`, `duoA`, `duoB` |

**Otros detalles:**
- `CardSpec.size` fija el tamaño del título.
- **Regla aprendida:** el calentamiento dibuja instantes tardíos antes del reloj. Un set debe fijar **todo** su estado en cada cuadro (alfa, visible), nunca solo «a partir de» un tiempo.

**Oleada 4:**
- Verbo `sound` en la partitura: `at(t, v('sound', { name: 'nib', pitch? }))` toca un SFX sintetizado del juego (`core/audio.ts`; `nib` es el rasgueo de plumín amplificado de La Mano). Solo suena en corridas en vivo, nunca en scrub.
- `FilmDef.cutDry`: la música se corta en seco al final de la película («corte en seco», sin el fundido de 0,9 s).
- `FilmDef.from` (FILM-ACTO1): la pista empieza en un punto de la canción. F34 (2/3) retoma el tema en los 20 s.
- `&invite=0` en la ruta de desarrollo también abre el AudioContext sin gesto: sirve para la prueba de sincronía sin cabeza.

## 18. Añadidos de FILM-ACTO1 (Acto I)

- **`getFilm(id)` acepta mayúsculas** (`stages[].film: "F01"` encuentra `f01`).
- **`FilmDef.from`**: película-fragmento. La pista empieza en ese punto de la canción (`'#36'` = c37: **las direcciones de compás de la partitura empiezan en 0**, `'#0'` = c1). Las escenas, las tarjetas y los **números** de la partitura siguen en segundos de película; las direcciones de texto (`'#44'`, `'oh_shit_1'`) se resuelven sobre la canción. F08 (OH SHIT, c37 → fin) lo usa.
- **Las piezas derivadas cortas se repiten** (`filmEdit`, en `timeline.ts`). Si una pieza derivada dura menos que su película (por ejemplo «Antes de caer», de 18 s, bajo F07, de 30 s), suena hasta el final de su loop y después repite el loop de `tracks.json` en compases. Los números de la partitura siguen en segundos de película (internamente llevan `seg`). Nunca se repiten las originales, ni la rejilla sintética, ni una pieza que dura lo mismo que su película.
- **Estilos gráficos** (`styles/grafico.ts` + `styles/grafico.catalog.ts`): `tv` (la caricatura de la Borracha a todo color, con los nativos sin hornear), `sombras`, `estencil`, `fotocopia`, `vhs`, `cartel`, `comic`, `anime`, `pixel` y `plastilina`. Detalle en [03-estilos-graficos.md](03-estilos-graficos.md).
- **Kit del Acto I** (`films/acto1/kit/`): `TvScreen` (la tele 4:3 con esquinas, barrido y borde de vidrio), `Bitacora` (LO QUE ARRIESGAMOS con su letra), `luzOf` / `lanternAt` / `Beam` (Luzterna flotando y su haz), `StaticKitten` (Cerito), `Homiau` (suplente en código), `flame` / `tailTip` (la llama de Canelo), `balloon` / `popIn` (globos de caricatura) y `kitTex` (texturas compartidas por película).
- **La plantilla de presentación** (una película por etapa armada desde sus datos, con pieles por caja): [04-plantilla-presentacion.md](04-plantilla-presentacion.md).
- **Sin GC de texturas durante la película** (`film/texturegc.ts`): ver la trampa en §12.
- La película le pasa al reloj la referencia CANÓNICA de su pista (`resolveTrack(ref).ref`): una variación guardada bajo otra canción (`fut.jefe.grave` → `amb.fut.jefe.grave`) ya no se queda muda. El director ahora sí respeta `CueOpts.at`.

---

## 19. Añadidos de FILM-ACTO3 (Acto III)

Todos son opcionales y compatibles: una película que no los usa se comporta igual que antes.

**Cambio de pista sin costura (`FilmDef.segue`).** `segue: { track, at, from? }`:
- En `at` la música sigue en **otra pista registrada**, desde su posición `from` (por defecto 0). `at` son segundos de película o una dirección de canción (`'#64'` = c65) y debe caer en un compás.
- Por dentro:
  - `toMomentoDef` parte el *edit* en ese compás (`segueOf`, `timeline.ts`);
  - el reloj pide el segundo segmento medio compás antes, como en los Momentos;
  - el `AudioDriver` de `MomentoRun` (`RunOpts.segue`) toca la segunda pista y reporta su posición sobre la línea de la canción, así que el reloj no se entera;
  - `playFilm` decodifica las dos pistas antes del reloj.
- Requisito: que `|at − from|` sea mayor que lo que dura el segue, porque una posición oída se distingue por cuál de los dos anclajes tiene más cerca.
- `validateFilm` revisa que la pista del segue exista (y que no sea una original fuera de una película de canción).
- Sin mapa de pulsos o sin sonido, no cambia nada.
- F23 lo usa: `no_wey` completa → `no_wey.puente` en c65 (el mismo audio hasta c69 y luego la isla de DISTOR que entra).

**Estilos de libro** (`libros`, `popup`, `dore`, `expresionismo`, `tecnico`, `tinta`, `pirata`, `datamosh`), sus tratamientos de gato (`libros`, `recorte`, `grabado`, `caligari`, `tecnico`, `tinta`, `senal`), `engrave()` y `moshFilter()`: [05-estilos-libro.md](05-estilos-libro.md).

**Kit del Acto III** (`films/acto3/kit/`): `BookFrame`, `Printed`, `Bitacora`, la llama, Cerito, La Mano, `demoShot`, `filmDuck`… Detalle en [05-estilos-libro.md](05-estilos-libro.md) §2.

**Piel de la Biblioteca** para la plantilla de presentación: `registerBriefingSkin('p3d_libros', …)`.

---

## 20. Añadidos de FILM-CAST (el elenco real)

Todos son compatibles: una película que no los usa se comporta igual que antes.

- **Una sola tabla del elenco** (`film/standins.ts`, `STANDINS`): los personajes que vuelven entre actos con su pintura aprobada (Cerito de estática y con pelaje, Itō, Borrón, Homiau, Maneki, EMIAU, Bocina, Scratch, Murciégato, Gato Araña y sus variantes) y los suplentes de quienes todavía no tienen arte (Esquirla, La Mano, Cruceta, Firma). Los kits de cada acto y los retratos de diálogo (`ui/story/text.ts`) leen de aquí. Un personaje nuevo con arte: una línea aquí y su pintura en `cats`.
- **Cerito de estática** (`StaticKitten` de los kits I, II y III): dibuja la pintura `cerito_static_cat` con el horneado del estilo y estática viva encima (50 %); sin la pintura, vuelve a la silueta teñida. `clear` apaga la estática viva (la pintura se queda).
- **Elegir pelaje en un solo cuerpo** (`final/props.ts` `furOver(ctx, actor)`): una segunda malla que **comparte la geometría** del títere de estática y lleva la pintura con pelaje del mismo estilo. Respira, parpadea y gira con él vértice por vértice; `set(k)` funde de 0 (estática) a 1 (pelaje). Pide `STAND_INS.ceritoGato` en `cats`. Lo usa F36.
- **Homiau** (kit del Acto I): `new Homiau(ctx, { size?, face? })` es su pintura con la interfaz del suplente en código (`act({ chew, raise, look, cry, squash })`, que como antes fija `scale` al aplastamiento) y `headAt()` (cabeza y radio en el espacio del padre). Pide `HOMIAU` en `cats`.
- **Multiverso de F08** (`acto1/f08/lib.ts`): `MULTI` (las pinturas de los universos) y `hanging(ctx, slug, alto)` (un gato colgado de su hilo, cabeza abajo).
- **Plantilla**: `BriefingData.rival.crewSlugs?` (las pinturas del resto del plantel real, sin el capitán, máx. 3; `app/stageIntro.ts` `crewSlugsOf`). El golpe «CONTRA QUIÉN» los pone detrás del capitán. Muestras DEV de las cajas de nodos: `?film=plantilla_a7`, `plantilla_l8`, `plantilla_p4`…
- **Precarga**: si el SVG completo de un gato no carga (no está en el hosting, sin red), el `Studio` se queda con el lite al instante (`art/catArt.ts` `onCatArtFailed`) en vez de esperar 7 s.
