# 31 · Animaciones con propósito (juego normal)

Encargo §3.5 del doc 28: que los gatos se muevan **con intención** en el juego normal (no en los Momentos). Cada acción lleva anticipación, peso y una reacción según la personalidad del gato. Prioridad: Canelo, los primordiales y la isla durante los eventos de la Parte II.

Es solo presentación. No toca el simulador de batalla, el guardado ni el balance. Usa sus propios dados visuales (una `Rng` sembrada con el uid del gato, nunca `Math.random` ni la del simulador). Con «Reducir movimiento» en Ajustes se apaga por completo, y los gatos vuelven a su actuación de antes, tal cual.

## 1. Cómo funciona

```
data/content.json  trait, rarity, primordial
        │
art/temperament.ts  motionProfile(species) → { temperament, weight, solemn, signature }
        │
art/intent.ts       builders (hop, depart, arrive, reactionIntent, quirkIntent) → Intent (datos)
                    IntentDriver: reproduce intents sobre UN gato
        │
art/puppetCore.ts   PuppetBrain.pose  (capa aditiva: lean, crouch, headDy, headA, look; en cero = como antes)
island/catActor.ts  IslandCat (aplasta y estira el cuerpo) + sprite (salto)
```

### 1.1 Temperamento (por rasgo)

Cada uno de los 14 rasgos de `content.json` (`impaciente`, `travieso`, `gloton`, `dormilon`, `perezoso`, `chismoso`, `bravucon`, `miedoso`, `presumido`, `rencoroso`, `curioso`, `leal`, `callejero`, `piromano`) tiene un `Temperament` en `TEMPERAMENTS`:

| Campo | Qué decide |
|---|---|
| `latency` | Cuánto tarda en reaccionar a algo (el miedoso, 0,02–0,1 s; el dormilón, 0,6–1,4 s). |
| `tempo` | Multiplica la duración de todos sus tiempos (>1 = más lento). |
| `bounce` | Altura de los saltos y cuánto se pasa de largo al frenar. |
| `hopEvery`, `doubleHop` | Cada cuánto salta solo y con qué probabilidad hace doble salto. `null` = nunca. |
| `boldness` | De −1 (huye de lo que lo asusta) a +1 (va hacia eso). |
| `pace` | Velocidad al pasear (solo visual). |
| `posture` | Postura de pie: pavoneo (`lean`), encogido (`crouch`) o mentón arriba (`chin`). |
| `quirks`, `quirkEvery` | Manías que hace solo mientras espera (zapatear, acechar, olfatear, cabecear de sueño, inflar el pecho…). |
| `react` | Qué reacción usa ante cada tipo de evento: `startle` (susto), `wonder` (algo raro en el cielo), `joy` (festejo), `boom` (golpe o sacudida) y `tap` (lo tocaste). |

Ejemplos: el **tímido** (`miedoso`) se esconde (`hide`: se encoge, se aparta y a la mitad se asoma); el **valiente** (`bravucon`) planta las patas (`brace`) y ante un golpe avanza (`advance`); el **dormilón** reacciona tarde (`late`: un segundo después levanta la cabeza despacio); el **juguetón** (`travieso`) rebota (`bounce`, a veces doble) y acecha (`pounce`, meneando la cola antes de saltar).

Si una especie no tiene rasgo conocido, usa `DEFAULT_TEMPERAMENT` (un gato casero tranquilo y curioso). **Ninguna especie se queda sin moverse.**

### 1.2 Peso (por rareza)

`weightOf(mass)` da `squash` (cuánto se aplasta y estira; más liviano = más elástico) e `inertia` (cuánto tarda en arrancar y en asentarse). La masa sale de la rareza (común 0,9 … divino 1,5); los primordiales pesan 1,8; algunas especies tienen la suya (`SPECIES_MASS`: Plomito pesa como plomo, Espumita es espuma).

### 1.3 Primordiales (`solemnize`)

Encima de su rasgo llevan un barniz **solemne**: nunca saltan solos, son un 45 % más lentos, rebotan menos de la mitad y caminan más despacio. Sus manías son `loom` (se yerguen despacio hasta toda su altura, sostienen y se asientan pasándose un poco, como un cuerpo pesado) y `bow` (una inclinación lenta). Reaccionan con dignidad (`loom`, `nod`), pero conservan el sabor de su rasgo: los bravucones plantan las patas, los presumidos levantan el mentón (`preen`), los rencorosos miran feo (`glare`) y los perezosos tardan.

### 1.4 Canelo (`CANELO`, firma `'canelo'`)

Tiene repertorio propio, el mismo en todas sus formas (Almirante, Astral…):

- Es **el primero en reaccionar** (latencia 0–0,08 s; la prueba verifica que nadie es más rápido).
- **Zapatea** de impaciencia: 3–4 golpecitos y un resoplido.
- Le dan **zoomies**: se agacha, sale disparado hacia la otra punta de su zona inclinado hacia adelante y **derrapa** al frenar.
- **`swat`**: menea la cola, salta a atrapar algo («¡MÍA!» solo cuando es un evento), falla, aterriza pesado y se pone a acicalarse como si nada hubiera pasado.
- Al tocarlo hace un **doble salto** impaciente (`zoom`).
- En las cines: `react: 'canelo'` usa su `swat`, y sus `emote: 'attack'` llevan anticipación (se echa atrás y luego embiste).

### 1.5 Las intenciones (datos)

Un `Intent` es `{ name, dur, tracks, cues }`. Las pistas son keyframes `[t, valor, easing]` sobre 8 canales: `crouch`, `lean`, `headDy`, `headA` y `look` (la capa `pose` del rig), `lift` (altura del salto en fracciones del tamaño) y `sx`/`sy` (aplastar y estirar, ya escalados por el peso). Los `cues` disparan emociones, actos (`groom`, `look`, `flick`…) o llamadas al dueño (`move`: unos pasos hacia lo que vio; `dash`: el sprint; `swatText`: el «¡MÍA!»).

Todo intent termina en reposo (lo verifica la prueba). El salto (`hopIntent`) es el modelo de los demás: **anticipación** (se agacha y se ensancha), **despegue** (se estira), **aire**, **aterrizaje** (se aplasta según su peso) y **asentamiento** (se pasa un poco y vuelve).

### 1.6 El driver

`IntentDriver` (uno por gato) corre «en dos» con el reloj del dueño (la isla actualiza a 12 fps, el estilo de la casa). Cuando no hay nada sonando no asigna memoria ni toca el cuerpo. Escribe:

- `pose` (aditiva: la postura de la noche, la tristeza o la caminata siguen funcionando debajo);
- `scale` del `IslandCat` (aplastar y estirar desde las patas);
- `y` del sprite (el salto).

Solo toca el cuerpo y el sprite mientras algo suena (y una vez más para devolverlos), así que nunca pelea con los tweens viejos.

## 2. Dónde se usa (qué ve el jugador)

**En la isla (`island/catActor.ts`):**

- **Antes de caminar**, el gato se gira hacia donde va, se echa atrás, se junta y se impulsa (`departIntent`). **Al llegar**, la inercia lo lleva un poco adelante, se balancea y se asienta (`arriveIntent`; más largo cuanto más pesa; un sprint derrapa).
- **Mientras espera**, hace sus saltos (los primordiales no) y sus manías, cada uno a su ritmo.
- **Postura de pie** según su temperamento.
- **Al tocarlo**, responde con su reacción `tap`.
- **Al hablar** en la charla de la isla, rebota según su peso.
- **Al despertar** salta con anticipación.

**Eventos de la Parte II:**

- **Cuando el estado del mundo pone a los gatos a reaccionar** (noche de estrellas, cielo roto…), cada uno entra con un golpe propio: los que miran se paran en puntas (los primordiales se yerguen), los que persiguen acechan (Canelo hace `swat`), los desafiantes se inflan o plantan las patas, los tímidos se esconden y los dormilones abren un ojo tarde. Se unen uno por uno según su latencia, y durante la noche van alternando esos golpes con los emotes de siempre.
- **Cines en la isla (`island/night/stage.ts`):**
  - Cuando un comando de actor elige **a varios gatos** (`all`, `awake`, `near:`), cada uno responde **con su personalidad y su propio tiempo de reacción** (sumado al `stagger`): `emote surprise` → `startle`, `emote happy` y `hop` → `joy`, `look` → `wonder` (miran uno por uno; los curiosos se acercan unos pasos y los tímidos se agachan).
  - Con **un solo gato** (`canelo`, `species:`) el golpe del guion queda exacto y solo se le suma el cuerpo.
  - Los fx `shake`, `o3:shatter` y `o3:crack` mandan una **ola** de reacción `boom`, y `burst`, `shoot` e `ignite` una de `wonder` (miran al cielo sobre el faro). La ola sale desde donde pasó: los cercanos reaccionan primero.
  - Un gato que acaba de reaccionar no repite (enfriamiento de 1,2 s más su latencia). Los gatos ocultos (`hideCats`) no reaccionan.
  - El fx `pose` («todos iguales a la vez») **apaga la personalidad** mientras dura (`CatActor.uniform`): esa sincronía es a propósito.
- **Estrella fugaz de día (`island/night/index.ts`):** además del gato más cercano, los vecinos (a menos de 700 px) también la notan, uno por uno.
- **Festejos (`scenes/IslandScene.ts`):** el gato que sube de nivel festeja a su manera, y al subir el Reino toda la isla festeja en ola desde el centro de la pantalla.

**Lo que no se toca:** batalla (`BattleCat` sigue igual), Momentos (`src/momentos/**`), retratos y secuencias FX. La capa `pose` vale cero para todos ellos.

## 3. Cómo dar personalidad a un gato nuevo

1. **Lo normal:** pon su `trait` en `content.json` (o en `rupturas/especies*.json`). Con eso ya tiene temperamento, reacciones y manías. Su rareza le da el peso, y si es `primordial: true` se vuelve solemne solo.
2. **Si su cuerpo es un chiste de peso** (de plomo, de espuma, un globo…), agrega una línea a `SPECIES_MASS` en `art/temperament.ts`.
3. **Si merece un repertorio propio** (como Canelo):
   1. Crea un `Temperament` con sus `quirks` y su `react`.
   2. Si necesita un movimiento nuevo, agrega un `case` a `reactionIntent` o `quirkIntent` en `art/intent.ts`. Arma sus pistas con `Score`: `hopInto`, `wiggle` y `hold` son los ladrillos.
   3. Asígnalo en `motionProfile` (como `signature === 'canelo'`).
4. **Pruébalo en el laboratorio:**
   - Abre `?scene=catlive&cats=<slug1>,<slug2>`.
   - En la consola, `__catlab.play(i, 'hop' | 'double' | 'depart' | 'arrive' | <reacción> | <manía>)`. Las manías que se llaman igual que una reacción van con `q:` (`'q:nod'`, `'q:zoom'`).
   - `__catlab.profiles` muestra el temperamento y la masa de cada uno; `__catlab.intents[i].out` muestra los canales del cuadro actual.
5. **Corre `npx vitest run tests/temperament.test.ts`**:
   - cada especie resuelve un perfil;
   - todas las reacciones y manías producen valores sanos y terminan en reposo;
   - los primordiales son pesados y solemnes;
   - Canelo es el más rápido;
   - «Reducir movimiento» lo apaga;
   - los dados son propios (nunca `Math.random`).

Reglas:

- Números chicos: las pistas tienen topes (la prueba falla si un gato se dobla a la mitad).
- Que todo intent vuelva a cero.
- Nada de esto puede leer ni escribir el estado de la partida.

## 4. Verificación (2026-10-10)

**Tiras de cuadros exactos**, sin cabeza: se congelan el ticker de la app, `Ticker.shared` y gsap, y se avanzan a mano. Herramienta: `fstrip.mjs` en el scratch del agente. Las tiras (antes = con «reducir movimiento», que es la actuación de antes):

- **Laboratorio:** Canelo (`swat`), y Gea, Lunita y Chispa ante un susto y un festejo.
- **Isla `rupturas-o4`:** Canelo tocado (antes un saltito; ahora un doble salto impaciente) y Canelo ante una estrella (antes una emoción plana; ahora menea la cola, salta, «¡MÍA!», aterriza y se acicala).

**Sonda numérica** de la ola `shake` en `rupturas-o4` (30 gatos):

- inicios repartidos entre 0 y 1,8 s;
- 9 reacciones distintas;
- el dormilón llega tarde;
- los primordiales hacen `loom`, `brace` o `puff`.

**Rendimiento:** ver la bitácora del agente (`agentes/ANIMACIONES.md`), con FPS y heap antes y después en `rupturas-o4` y `post-finale`.
