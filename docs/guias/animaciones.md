# Guía de animaciones

Aquí se explica cómo se mueven las cosas en NO ONE LIKE CATS: los gatos que parpadean y menean la cola, las secuencias grandes (revelar un gato, descubrir un elemento, la portada del periódico) y los ayudantes de "jugo" (sacudidas, onomatopeyas, chispitas). Al final hay un ejemplo para que hagas tu primera animación sin romper nada.

Regla de oro antes de empezar: **el gato no es un sprite que se tuerce, es una pintura que actúa**. Si lo tratas como actor (anticipación, reacción, recuperación), se ve vivo. Si lo tratas como imagen que rota, se ve como PowerPoint de 2004.

Guías hermanas: [agregar-gato.md](agregar-gato.md) · [agregar-elemento.md](agregar-elemento.md) · [agregar-historia.md](agregar-historia.md) · [agregar-barco.md](agregar-barco.md) · [arquitectura.md](arquitectura.md) · [CONTRIBUTING](../../CONTRIBUTING.md)

---

## 1. Mapa de archivos

| Archivo | Qué hace |
|---|---|
| `game/src/art/livingCat.ts` | `CatPuppet`: la pintura sobre una malla deformable ("Live2D-lite"). Emociones (`CatEmote`), actos espontáneos, caminar, dormir, viento. También `ART`, `catRig()`. |
| `game/src/art/catArt.ts` | `livingCat()` (fábrica del puppet), `IslandCat`, `BattleCat`, `preloadCats`, carga de SVG lite/full, `ELEMENT_FX` (colores por elemento). |
| `game/src/data/catRigs.json` | Un rig por gato (cabeza, cuello, orejas, ojos, cola, flotantes). Es un JSON de una sola línea. |
| `game/public/cats-svg/lite/<slug>.svg` | Versión ligera de cada gato (la que espera todo el juego). |
| `game/public/cats-svg/<slug>.svg` | Versión de detalle completo (se baja en segundo plano cuando el gato se dibuja grande). |
| `game/src/battle/catFx.ts` | Estados visibles en batalla (`CatStatusView`: ardiendo, mojado, congelado, aturdido), `playKO`, `playOverboard`. |
| `game/src/battle/fx/transform.ts` | `playTransform`: el paso de forma isla a Battle Form. |
| `game/src/scenes/BattleScene.ts` | `ultCutIn()`: el corte de la ultimate (el gato "actúa" el grito). |
| `game/src/battle/catShots.ts` | Ojo: **no anima nada**. Traduce el disparo/ultimate del contenido a datos del simulador (`shotFromSpec`, `ultFromDef`). Útil para saber qué ultimate dispara qué, nada más. |
| `game/src/fx/sequences/*.ts` | Las secuencias grandes: `catReveal`, `elementDiscovery`, `gachaSummon`, `gachaHolo`, `starUp`, `victoryNews`. |
| `game/src/fx/juice.ts` | `Shaker`, `time` (hitstop/slowmo), `flash`, `floatText`, `onomatopoeia`, `speedLines`, `sparkles`, `pop`. |
| `game/src/fx/particles.ts` | `Particles`: capa de partículas por CPU, con modo "en dos" (`stepped`). |
| `game/src/fx/filters.ts` | Shaders propios: `InkFilter` (manga tinta), `ComicFilter` (posterizado + halftone), `SilhouetteFilter`. |
| `game/src/core/settings.ts` | `settings.reduceMotion` y `settings.reduceFlashes`. |
| `game/src/scenes/CatLiveLab.ts`, `ArtLab.ts`, `DevLab.ts` | Laboratorios para ver todo esto sin jugar. |

---

## 2. Gatos vivos (`CatPuppet`)

### 2.1 La idea

Cada gato es **un solo SVG** (arte MAI, vector puro) rasterizado a una textura y pegado a una malla (`Mesh` de Pixi) de unas 26x26 celdas, más densa alrededor de los ojos para que los párpados se resuelvan bien. No hay piezas recortadas: la malla se dobla y la pintura se dobla con ella.

El comentario de cabecera de `livingCat.ts` lo resume así (capas de movimiento, todas sumadas sobre la misma malla):

- **cara**: parpadeos, tics de orejas, inclinación/balanceo/giro de cabeza, emociones.
- **cuerpo**: `lean` (se inclina sobre las patas), `crouch` (se aplasta hacia las patas), ciclo de caminar, dormir, viento.
- **extras**: cola que se mece, objetos flotantes (cristales, linternas, vapor...).
- **actos espontáneos**: mirar alrededor, bostezar, acicalarse, estirarse, sacudir la cola.

Coordenadas: el rig vive en el espacio de la pintura MAI, que mide `ART = 700` (700x700) salvo que el rig traiga `size`. Por eso la escala siempre es `tamañoEnPantalla / ART`.

### 2.2 Cómo se crea uno

Casi nunca hagas `new CatPuppet(...)` a mano. Usa `livingCat()` de `catArt.ts`, que se encarga de la textura:

```ts
// real: game/src/scenes/CatLiveLab.ts (shortened)
const p = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 15 });
p.scale.set(size / ART);
holder.addChild(p);
```

`livingCat(slug, opts)` acepta `PuppetOptions & { detail?: boolean }`:

| Opción | Default | Qué hace |
|---|---|---|
| `anchorX`, `anchorY` | `0, 0` en `livingCat` (`0.5, 0.5` en `CatPuppet` directo) | Igual que `Sprite.anchor`. Para gatos parados se usa `0.5, 0.94` (las patas). |
| `fps` | `15` | Cada cuántos cuadros por segundo se recalcula la malla. La casa anima "en dos": isla y batalla usan `12`. Los relojes internos sí avanzan cada frame. |
| `acts` | `'all'` | Qué actos espontáneos puede iniciar solo: `'all'`, `'calm'` (mira, sacude cola, bosteza), `'battle'` (mira, sacude cola) o `'none'`. |
| `detail` | — | Si es `true`, pide de una vez el SVG de detalle completo. |

Detrás de cámaras, `livingCat()`:
1. Usa la mejor textura que ya esté cargada (`catTexture(slug)`: full, si no lite, si no `Texture.WHITE`).
2. Si no hay ninguna, esconde el puppet (`renderable = false`) hasta que llegue la lite.
3. Se suscribe a `onCatArt()` para cambiarse solo a la versión full cuando exista.
4. Cuando el puppet se dibuja a más de ~640 px reales en pantalla, `onWantDetail` llama a `requestCatSvg(slug)`, que encola la descarga (máximo 2 a la vez, en `requestIdleCallback`).

Por eso **antes de una escena con gatos se llama `preloadCats(slugs)`** (espera solo las versiones lite, que son rápidas). Las secuencias usan `loadCatTexture(slug)` para lo mismo con un solo gato.

### 2.3 Cómo se le habla al puppet

Postura (valores objetivo que se suavizan con un resorte, no saltan):

| Propiedad | Rango | Ejemplo real |
|---|---|---|
| `lean` | -1..1 | `ultCutIn`: `cat.sprite.lean = 0.6` al entrar. |
| `crouch` | -0.4..1 | `IslandCat.hop()`: `crouch = 0.8` (anticipación) y luego `-0.35` (estirado en el aire). |
| `look` | -1..1 | Gira la cabeza hacia +x/-x local. |
| `lookAt(punto \| null)` | punto global | `island/catActor.ts`: el gato de la isla sigue el puntero. |
| `walk` | 0..1 | `catActor.ts`: `p.walk = this.moving && !asleep ? ... : 0`. |
| `sleeping` | boolean | Cierra ojos, agacha cabeza, cola lenta. |
| `wind` | -1..1 | Cola, orejas y flotantes se van con el viento. |
| `energy` | número | Multiplicador global de todo el acting (0 congela). |
| `acts` | `ActSet` | Se puede cambiar en vivo (`catActor` lo pone en `'none'` cuando duerme). |

Reacciones y actos:

```ts
// real: game/src/art/livingCat.ts
export type CatEmote = 'happy' | 'hurt' | 'surprise' | 'sleepy' | 'attack';
export type CatAct = 'look' | 'yawn' | 'groom' | 'stretch' | 'flick';

p.emote('hurt', 1.6);   // strength defaults to 1
p.doAct('yawn');        // start a spontaneous act right now
p.blink();              // force a blink
```

| Emote | Qué hace |
|---|---|
| `happy` | Cola rápida y amplia, orejas arriba, cabeza que vibra. Decae solo. |
| `hurt` | Ojos apretados, orejas hacia atrás, cabeza y cuerpo hacia atrás. Decae solo. |
| `surprise` | Cabeza hacia arriba, ojos un poquito más abiertos, patada de orejas. Decae solo. |
| `attack` | Se lanza hacia adelante (cabeza y cuerpo) con algo de emoción. Decae solo. |
| `sleepy` | Ojos medio cerrados y cabeza abajo. **No decae**: hay que apagarlo con `emote('sleepy', 0)` (así lo hace `ultCutIn`). |

Detalle útil: `happy` y `attack` usan `Math.max`, así que `emote('happy', 0)` no "apaga" nada; simplemente espera a que decaiga.

Los actos espontáneos no arrancan si el gato camina, duerme o está en medio de una emoción fuerte.

### 2.4 Los rigs (`catRigs.json`)

Es un JSON de una línea; para mirarlo usa node. Hoy hay 33 rigs:

```bash
node -e 'const r=require("./game/src/data/catRigs.json"); console.log(JSON.stringify(r["alien_galaxy_cat"]))'
```

Una entrada real (`alien_galaxy_cat`, cola recortada):

```json
{
  "head": [372, 280, 128, 108],
  "neck": [385, 388],
  "ears": [[250, 212, 110, 135, 62], [452, 168, 482, 10, 55]],
  "eyes": [[274, 270, 364, 352], [407, 228, 475, 310]],
  "tail": { "pts": [[468, 580], [580, 560], [592, 470], "..."], "r": 42 },
  "floats": []
}
```

Y un gato con flotantes (`iridescent_origami_cat`): `"floats": [[128,420,72],[620,305,58],[170,535,32], ...]` (7 en total).

Qué hace el código con cada campo (todo en píxeles de la pintura, 700x700):

| Campo | Formato | Cómo lo usa `PuppetModel` / `deform()` |
|---|---|---|
| `size` | `[w, h]`, opcional | Tamaño lógico si la pintura no es 700x700. Solo `luzterna` lo usa (`[610, 640]`). |
| `head` | `[cx, cy, rx, ry]` | Elipse de la cabeza. Todo lo que está dentro pesa 1 y se mueve con la cabeza; hay un "cuello" suave hasta 1.32 veces el radio. También define `topY` (techo del cuerpo para lean/crouch). |
| `neck` | `[x, y]` | Pivote sobre el que rota la cabeza (inclinación, bostezo, ataque). |
| `ears` | `[baseX, baseY, puntaX, puntaY, medioAncho][]` | Cada oreja se dobla desde la base hacia la punta; la oreja completa también sigue a la cabeza. El ancho baja hacia la punta. Las orejas pares/impares giran en sentidos opuestos (por eso el orden importa: izquierda primero). |
| `eyes` | `[x0, y0, x1, y1][]` | Caja de cada ojo: párpado superior en `y0`, inferior en `y1`. Al parpadear, el pelo de arriba se estira hacia abajo y el ojo se aprieta en una línea de pestañas. También agrega filas densas a la malla. |
| `tail` | `{ pts: [x,y][], r }` o `null` | Polilínea de la columna de la cola, de la base (`pts[0]`, pivote) a la punta, y su radio. La amplitud crece hacia la punta y se calcula en píxeles de recorrido, no en radianes (colas largas y cortas se mueven parecido). Nunca arrastra la cara. Colas con `r > 60` se mueven 25 % menos. |
| `floats` | `[cx, cy, r][]` | Objetos sueltos que flotan en su lugar (cristales, linternas). Cada uno tiene su fase de bamboleo y se va con el viento. |

Rarezas reales que conviene saber: `mecha_neon_cat` tiene `eyes: []` (no parpadea; está bien, es un robot), y aunque el tipo permite `tail: null`, hoy los 33 tienen cola.

Los rigs se autoran en [MAI SVG](https://github.com/Ragosorio/MAI-SVG) (`exports/game-rigs/<slug>.rig.json` dentro de tu copia de MAI, fuera de este repo) y se compactan en `catRigs.json`. Un gato sin rig no explota: se dibuja como un quad de 2x2 y se comporta como un sprite quieto. Cómo agregar un gato nuevo con su rig está en [agregar-gato.md](agregar-gato.md).

### 2.5 Las tres formas del gato

- **`IslandCat`** (`catArt.ts`): puppet con `fps: 12, acts: 'all'` + sombra de contacto + respiración "en dos" (escala, más lenta si duerme). `hop()` es un buen ejemplo de cómo se reparten el trabajo el puppet y GSAP:

```ts
// real: IslandCat.hop() in game/src/art/catArt.ts
this.sprite.emote('happy');
// anticipation squash -> airborne stretch -> landing squash (the puppet does the body, the tween the jump)
this.sprite.crouch = 0.8;
gsap.timeline()
  .call(() => (this.sprite.crouch = -0.35), [], 0.09)
  .to(this.sprite, { y: -this.size * 0.25, duration: 0.18, ease: 'power2.out' }, 0.09)
  .call(() => (this.sprite.crouch = 0), [], 0.2)
  .to(this.sprite, { y: 0, duration: 0.22, ease: 'bounce.out' })
  .call(() => (this.sprite.crouch = 0.55), [], '-=0.12')
  .call(() => (this.sprite.crouch = 0), [], '+=0.08');
```

- **`BattleCat`** (`catArt.ts`): el mismo puppet con `acts: 'battle'`, filtros `ComicFilter` + `OutlineFilter` + `GlowFilter`, aura del elemento, picos de energía que giran y partículas según `ELEMENT_FX[el].particle`. `impactFrame(ms, invert)` cambia a manga tinta (`InkFilter`) unos milisegundos.
- **Retrato de historia** (`ui/story/portrait.ts`): Luzterna como `CatPuppet` directo con `acts: 'calm'`.

### 2.6 Acting en batalla

- `CatStatusView` (`battle/catFx.ts`): tinte por estado (congelado, mojado), llamitas/chispas/gotas, estrellitas de aturdido, `electrocute()` que parpadea entre `InkFilter` invertido y normal.
- `playKO()`: `emote('hurt', 1.6)` + `impactFrame` + sello "K.O." + estrellas + el alma que sale + caída al mar + salvavidas.
- `playOverboard()`: cae, splash, vuelve con actitud.
- `playTransform()` (`battle/fx/transform.ts`): de isla a Battle Form, larga la primera vez por gato en la sesión, corta después (y siempre corta con `reduceMotion`).
- `ultCutIn()` (`BattleScene.ts`): el gato se desliza inclinado, junta poder (`crouch` + `emote('sleepy', 0.9)`), y a los 420 ms RUGE: `crouch = -0.4`, `lean = 0.8`, `emote('surprise')`, `emote('attack', 1.4)`, `impactFrame(140)` y un rebote `elastic.out`. Con `reduceMotion` dura 600 ms en vez de 1250.

---

## 3. Secuencias grandes (`game/src/fx/sequences/`)

### 3.1 Convención de tiers

Los comentarios usan los tiers de `research/07-animaciones-dopamina.md` (sección 4):

| Tier | Duración | ¿Bloquea? | Ejemplos en el código |
|---|---|---|---|
| T0 | 150–500 ms | Nunca | pops de número, partículas sueltas |
| T1 | 0.6–1.5 s | No (banner) | `kingdomBanner()` en `ui/story/rewards.ts`, banner de `ui/modal.ts` |
| T2 | 1.5–2.5 s | Semimodal | panel de misión, estrella 2–3 en `starUp` |
| T3 | 3–5 s | Modal | gato nuevo, estrella 4–5 |
| T4 | 5–8 s | Modal + el mundo cambia de estilo | `elementDiscovery`, reveal mítico/primordial, estrella 6 |

Regla del doc de investigación: "primera vez completa, después corta". Y un T4 es raro de verdad: no lo uses para avisar que llegó oro.

### 3.2 El catálogo

| Secuencia | Función | Opciones (campos reales) | Quién la llama |
|---|---|---|---|
| `catReveal.ts` | `playCatReveal(layer, o): Promise<RevealResult>` (`'continue' \| 'catdex' \| 'repeat'`). Sello que se rompe, silueta, sellos de elemento, "reimpresión" según rareza, color + nombre, chips, la carta vuela al Catdex. Duplicados: versión corta con barra de estrellas. Mítico/primordial/secreto = trato T4. | `RevealOpts`: `slug`, `name`, `elements`, `rarity`, y opcionales `caption`, `serial`, `duplicateOrbs`, `tint`, `subtitle`, `species`, `tintSpec`, `chips`, `mutation`, `mutationId`, `holo`, `offerRepeat`, `duplicateLabel`, `dex`, `dup`, `secret`, `replay` | `ResultsScene`, `app/storyFlow.ts`, `panels/Sanctuary.ts`, `panels/Catdex.ts`, `panels/casino/prizes.ts`, `scenes/ArtLab.ts` |
| `elementDiscovery.ts` | `playElementDiscovery(layer, o): Promise<void>`. T4 ~7.5 s: el cielo se oscurece, se abre una grieta a la dimensión del elemento, impact frame, el mundo se reimprime en la paleta del elemento, póster gigante, red de resonancias. Exporta `discoveryDebug.tl` para QA (puedes hacer `seek`). | `ElementDiscoveryOpts`: `element`, `world?`, `primordialSlug?`, `known`, `resonances`, `stamps`, `caption?` | `ResultsScene`, `app/storyFlow.ts` |
| `gachaSummon.ts` | `playSummon(layer, pulls, banner, onEvent?)`. T2/T3 según la mejor rareza: portal de tinta, rayo del color del mejor tier (aviso honesto: el resultado ya está decidido), cartas que se voltean. | Sin interfaz propia: `pulls: Pull[]`, `b: Banner`, `onEvent?: (ev: 'epic' \| 'legend' \| 'holo' \| 'meh') => void` | `panels/casino/GachaView.ts` (import dinámico) |
| `gachaHolo.ts` | No es secuencia: `HoloSheen`, `holoSheen(w, h, strength)` y `applyHolo(sprite)`. Brillo de foil holográfico que se anima solo. | — | `holoSheen` en `gachaSummon`, `GachaView`, `AccessoryPanel`, `prizes.ts`. `applyHolo` hoy no tiene llamadores. |
| `starUp.ts` | `playStarUp(layer, o): Promise<void>`. Jugo proporcional a la estrella: 2 (T2, 2.6 s), 3 (T2+), 4 (T3 con mini-clip del ataque), 5 (T3 pantalla completa), 6 (T4 con paleta invertida y corona). | `StarUpOpts`: `species`, `name`, `level`, `fromStars`, `toStars`, `ownBefore`, `need`, `prismaUsed`, `stats`, `unlockTitle`, `unlockText`, `shotName?`, `shotCry?`, `element?`, `mutation?`, `perkLines?` | `panels/Altar.ts` |
| `victoryNews.ts` | `class VictoryNews extends Container` con `timeline(onLand?)` que **devuelve** el `gsap.core.Timeline` (no lo maneja solo). Portada del DIARIO DEL MAR que gira y cae, titular con misregistro, caja de botín que cuenta. El MVP es un `livingCat` con `emote('happy')`. | `VictoryNewsOpts`: `headline`, `kicker?`, `sub`, `caption`, `edition`, `place`, `photo`, `mvpSpecies`, `rows: NewsLootRow[]`, `golden`, `perfect`, `momentum`, `teaser?` | `scenes/ResultsScene.ts` |

### 3.3 Patrón común

Todas las secuencias "play" siguen el mismo molde. Vale la pena copiarlo:

```ts
// real pattern: playCatReveal / playElementDiscovery / playStarUp (shortened)
export async function playX(layer: Container, o: XOpts): Promise<void> {
  await loadCatTexture(o.slug).catch(() => undefined); // art first, then build
  return new Promise((resolve) => {
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 18, 0.015);
    const reduce = settings.reduceMotion;
    const tl = gsap.timeline();
    // ... build + tl.to / tl.call at absolute times ...
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    root.on('pointertap', () => tl.timeScale(6)); // tap = fast-forward, never a hard cut
    // at the end: shaker.destroy(); root.destroy({ children: true }); resolve();
  });
}
```

Capas (`game/src/core/scenes.ts`): `game.root` contiene, en orden, `backdrop`, `sceneLayer`, `overlayLayer`, `fxLayer`.

- `scenes.overlayLayer`: encima de la escena. Lo usan los paneles (Catdex, Altar, Sanctuary) y el ArtLab.
- `scenes.fxLayer`: encima de todo. Lo usan las secuencias que llegan "desde el mundo" (Results, storyFlow) y las transiciones.
- Algunas reciben una capa propia (`GachaView` pasa `this.ctx.top`). Por eso **la capa siempre es un parámetro**, nunca un import fijo dentro de la secuencia.

### 3.4 `reduceMotion` (y `reduceFlashes`)

Es una opción del jugador, persistida en `localStorage` (`nolc-settings`). No es decorativa: hay gente que se marea. Qué ya hace solo el código compartido:

| Helper | Con `reduceMotion` |
|---|---|
| `Shaker.add()` | La sacudida baja al 25 %. |
| `time.hitstop()` | La pausa dura la mitad. |
| `speedLines()` | No dibuja nada. |
| `HoloSheen` | Se mueve al 30 % de velocidad. |
| `flash()` | Con `reduceFlashes`, el alpha baja al 30 %. |

Lo que **tú** tienes que hacer en tu secuencia (así lo hacen las existentes): leer `const reduce = settings.reduceMotion` una vez, y saltar o acortar lo que gira, tiembla o parpadea: `if (!reduce) time.hitstop(100)`, `if (!reduce) root.filters = [glitch]`, menos partículas (`gachaSummon` pasa de 46 a 10), la portada de `victoryNews` no da 5 vueltas, `playTransform` usa siempre la versión corta. `sparkles()`, `onomatopoeia()`, `floatText()` y `pop()` **no** miran `reduceMotion`; decide tú.

### 3.5 Ayudantes de jugo (`juice.ts`, `particles.ts`, `filters.ts`)

- `new Shaker(target, maxOffset, maxRot)` + `.add(trauma)`: sacudida por "trauma" (cuadrático, decae solo). Mueve el `pivot` del target. Hay que llamar `.destroy()` (quita el ticker).
- `time.hitstop(ms)` / `time.slowmo(scale, ms)`: congelan o ralentizan **la línea de tiempo global de GSAP** y `time.scale` (la batalla multiplica su `dt` por eso). Ojo: el `Ticker` de Pixi no se frena, así que los puppets siguen respirando durante un hitstop.
- `flash(layer, color, alpha, dur)`, `floatText(layer, x, y, text, o)`, `onomatopoeia(layer, x, y, word, o)` (con fantasmas CMYK en `multiply`), `speedLines(layer, x, y, color, count, dur)` (tiembla a 12 fps), `sparkles(layer, x, y, color, n, radius)`, `pop(target, amount, dur)`.
- `Particles` (`particles.ts`): una por escena; `burst(x, y, BurstOpts)` con `count`, `tint`, `speed`, `angle`, `life`, `gravity`, `drag`, `scale`, `endScale`, `spin`, `alpha`, `blend` y `stepped` (se mueve en dos, estilo Spider-Verse).
- Filtros: `InkFilter({ threshold, hatch, ink, paper, invert })`, `ComicFilter({ levels, dot, sat, strength, shadow })`, `SilhouetteFilter(color, mix)`. Además se usan los de `pixi-filters` (`RGBSplitFilter`, `ShockwaveFilter`, `GlowFilter`, `OutlineFilter`, `CRTFilter`).

---

## 4. Convenciones de GSAP y dirección de arte

### 4.1 GSAP en este repo

- **Timelines con tiempos absolutos.** Las secuencias ponen cada beat con su posición: `tl.call(fn, [], 0.85)`, `tl.to(x, {...}, 0.72)`. Así se lee como un storyboard y se puede ajustar un beat sin correr todos.
- **`tl.call` para el puppet, `tl.to` para el transform.** El gato actúa con propiedades (`crouch`, `lean`, `emote`), GSAP mueve la posición/escala. Interpolar `crouch` con GSAP funciona pero pelea con el resorte interno; mejor setear el objetivo.
- **Easings de la casa** (conteo real en `game/src`): `back.out(3)` y `back.out(2)` para sellos y "pop" (los más usados), `power2/3.out` para entradas, `power2/3.in` para caídas y golpes, `sine.inOut` para flotar en loop, `elastic.out(1.2,0.4)` para squash de recuperación, `bounce.out` para aterrizajes, `none` para contadores y órbitas.
- **Saltar = acelerar.** Tap en la secuencia hace `tl.timeScale(6)` (o `5` en `elementDiscovery`, y solo después de 2 s). Nunca cortes en seco: los callbacks deben correr igual.
- **Limpieza.** Toda animación que vive más que su objeto es un bug esperando turno:
  - Tweens sueltos que crean algo lo destruyen en su `onComplete: () => p.destroy()`.
  - Antes de destruir UI que podría seguir animando: `gsap.killTweensOf(...)` o `killTree(container)` (en `panels/campaign/common.ts`, `panels/collection/ui.ts`, `panels/shop/ui.ts`). `BattleCat.destroy()` hace `gsap.killTweensOf(this.parts.children)`.
  - `setTimeout`/`setInterval` siempre revisan `if (x.destroyed) return` (mira `ultCutIn` y `electrocute`).
  - Quien hace `Ticker.shared.add(this.tick, this)` hace `Ticker.shared.remove(this.tick, this)` en `destroy()`. `CatPuppet`, `IslandCat`, `BattleCat`, `Shaker`, `Particles` y `HoloSheen` lo cumplen; tú también.
- **Ticker vs GSAP.** Movimiento continuo y barato (respirar, órbitas, partículas) va en el `Ticker` de Pixi, a menudo acumulando `dt` para correr a 12 fps. Beats con principio y fin van en GSAP.
- **Dev:** en `npm run dev`, `main.ts` expone `window.__gsap` y `window.__scenes`. Con `?realtime=1` hace `gsap.ticker.lagSmoothing(0)`: las animaciones siguen el reloj real aunque el navegador frene la pestaña (útil en pruebas headless).

### 4.2 Dirección de arte en movimiento

De `research/10-direccion-de-arte.md` y `docs/arte/DIRECCION-ARTE-PARTE-2.md`:

- **Multiverso de estilos** (a lo Spider-Verse): cada pantalla/elemento vive en su "dimensión" (Editorial suizo, Diario del Mar, Anime inferno, Manga tinta, Neón glitch...). Cuando dos se tocan, la costura se nota.
- **Personajes en dos (12 fps escalonado); cámara, UI y partículas a 60.** Por eso `fps: 12` en puppets y los `acc >= 1/12` en los ticks.
- **Impacto = papel impreso que falla:** misregistro CMYK de 1–3 px (`RGBSplitFilter`, fantasmas de `onomatopoeia`), halftone en sombras, impact frame invertido en blanco y negro (`InkFilter`), papel rasgado en transiciones.
- **Tipografía como actor:** titulares gigantes condensados que entran como sello, onomatopeyas de cómic ("¡GLUGLU!", "¡AL AGUA!").
- **El rig manda en el dibujo:** los dos ojos visibles y abiertos, orejas separadas, cola que no tape la cara, flotantes con aire alrededor. Si el dibujo no cumple, no se puede animar bien (está en la sección "Para que el gato se pueda animar" de Parte 2).
- **Principios clásicos que el código ya usa:** anticipación (`crouch` antes del salto o del rugido), follow-through (la cabeza adelanta un poco el `lean`), squash and stretch (`pop`, `hop`), decaimiento suave (las emociones bajan con `exp(-dt * k)`).

---

## 5. Cómo previsualizar

Todas son rutas de la URL del juego (`npm run dev` dentro de `game/`, o el build publicado).

| Ruta | Qué ves |
|---|---|
| `?scene=dev` | **LABORATORIO**: lista todos los labs con qué hacen y qué guía los explica (`scenes/DevLab.ts`). En la pantalla de título, `?dev=1` muestra un botón LAB en la esquina. |
| `?scene=catlive` | Todos los gatos como puppets en una grilla. **Click en un gato = siguiente emoción** (`happy`, `surprise`, `hurt`, `attack`, `sleepy`). |
| `?scene=catlive&cat=<slug>` | Un solo gato en grande (900 px, pide el SVG full). |
| `?scene=catlive&cats=a,b,c` | Solo esos gatos (hasta 4 por fila). |
| `&rig=1` | Dibuja el rig encima: cabeza y cuello en amarillo, orejas en rojo, ojos en verde, cola en magenta, flotantes en cian. Indispensable para revisar un rig nuevo. |
| `?scene=fxlab` | **SECUENCIAS FX** (`scenes/FxLab.ts`): elige un gato con `&cat=<slug o id>` o con los botones `<` `>` y dispara revelar (normal, duplicado, holo), elemento nuevo, invocar x1/x10, estrellas 3/4/5 o la portada de victoria. Las opciones de cada secuencia están armadas a mano en `FxLab.ts`, igual que las pasa el juego. |
| `?scene=art` | ArtLab "DIMENSIONES": cuatro gatos en forma isla, cómic, Battle Form y manga tinta, y un botón **REVELAR** que lanza `playCatReveal` con `regal_cosmic_cat` legendario. |
| `?realtime=1` | Se suma a cualquiera; solo en dev. |

En la consola del navegador, `?scene=catlive` deja `window.__catlab = { puppets, slugs }`:

```js
// try in DevTools on ?scene=catlive&cat=canelo_cozy_cat
const p = __catlab.puppets[0];
p.emote('surprise'); p.doAct('stretch'); p.lean = 0.8; p.walk = 1; p.wind = -1;
```

---

## 6. Tu primera animación

### 6.1 Una secuencia T1 chiquita

**Esto es un EJEMPLO, el archivo no existe en el repo.** Solo usa APIs reales. La idea: el gato se agacha, salta de gusto, ronronea con onomatopeya y chispitas, y se va. ~1.25 s, nunca bloquea mucho, y respeta `reduceMotion`.

```ts
// EXAMPLE (not in the repo): game/src/fx/sequences/purrBurst.ts
import { Container } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C } from '../../ui/theme';
import { ART } from '../../art/livingCat';
import { livingCat, loadCatTexture } from '../../art/catArt';
import { Shaker, onomatopoeia, sparkles } from '../juice';
import { settings } from '../../core/settings';
import { sfx } from '../../core/audio';

export interface PurrBurstOpts {
  slug: string;
  /** on-screen height in the 1920x1080 design box */
  size?: number;
}

/** T1 (~1.25 s): crouch (anticipation) -> happy pop -> "¡PRRR!" -> fade out. */
export async function playPurrBurst(layer: Container, o: PurrBurstOpts): Promise<void> {
  await loadCatTexture(o.slug).catch(() => undefined);
  return new Promise((resolve) => {
    const reduce = settings.reduceMotion;
    const size = o.size ?? 420;
    const root = new Container();
    layer.addChild(root);
    const shaker = new Shaker(root, 14, 0.01);

    const cat = livingCat(o.slug, { anchorX: 0.5, anchorY: 0.94, fps: 12, acts: 'none' });
    cat.scale.set(size / ART);
    cat.position.set(W / 2, H / 2 + size * 0.45);
    root.addChild(cat);

    const tl = gsap.timeline({ onComplete: finish });
    tl.from(cat, { alpha: 0, duration: 0.15 }, 0)
      .call(() => (cat.crouch = 0.8), [], 0) // anticipation
      .call(() => {
        cat.crouch = -0.3; // stretch up
        cat.emote('happy');
        sfx('meow', 1.2);
      }, [], 0.15)
      .call(() => {
        onomatopoeia(root, W / 2 + 180, H / 2 - 160, '¡PRRR!', { color: C.pink, size: 90 });
        if (!reduce) {
          sparkles(root, W / 2, H / 2 - size * 0.4, C.yellow, 14, 220);
          shaker.add(0.25);
        }
      }, [], 0.2)
      .call(() => (cat.crouch = 0), [], 0.4)
      .to(root, { alpha: 0, duration: 0.25 }, 1.0); // after the onomatopoeia ends (0.2 + 0.9)

    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    root.on('pointertap', () => tl.timeScale(6)); // skip = speed up

    function finish() {
      shaker.destroy();
      root.destroy({ children: true }); // CatPuppet.destroy() removes its own ticker
      resolve();
    }
  });
}
```

Para probarla, agrega una fila al arreglo `seqs` de `scenes/FxLab.ts` (etiqueta, archivo, y una función que haga `playPurrBurst(scenes.fxLayer, { slug: this.cat.art.slug })`). Si va a vivir en el juego, el que la llama decide la capa (`overlayLayer` en paneles, `fxLayer` si llega desde el mundo).

### 6.2 Un emote nuevo

Si lo que quieres es que **el gato** haga algo nuevo (por ejemplo `proud`: pecho afuera, cabeza arriba, orejas firmes), el cambio vive en `livingCat.ts`. Pasos (**EJEMPLO**, no existe):

```ts
// EXAMPLE diff (not in the repo): game/src/art/livingCat.ts
// 1) the union
export type CatEmote = 'happy' | 'hurt' | 'surprise' | 'sleepy' | 'attack' | 'proud';

// 2) a private envelope next to `hurt`, `surprise`...
private proud = 0;

// 3) emote(): set it
if (kind === 'proud') this.proud = Math.max(this.proud, strength);

// 4) tick(): let it decay (or it never ends, like `sleepy`)
this.proud *= Math.exp(-dt * 1.2);

// 5) deform(): add it to the existing sums, small numbers first
//    headA  ... - this.proud * 0.06   (chin up)
//    headDy ... - this.proud * 5      (head rises)
//    lean   ... - this.proud * 0.05   (chest out, leans back a bit)
//    earA   ... - this.proud * 0.04 * side
```

Después agrégalo al arreglo `emotes` de `scenes/CatLiveLab.ts` para poder probarlo con un click, y míralo en **varios** gatos (`?scene=catlive&cats=canelo_cozy_cat,mecha_neon_cat,iridescent_origami_cat&rig=1`): uno con orejas grandes, uno sin ojos y uno con muchos flotantes. Si un valor se ve bien en uno y roto en otro, bájalo; los números de `deform()` son chicos a propósito.

---

## 7. Reglas que no se negocian

1. **Nada de imágenes raster.** El `.gitignore` bloquea `png`, `jpg`, `jpeg`, `webp`, `gif`, `avif` y `bmp`. Los gatos son SVG MAI puros (lite + full), los efectos son `Graphics`, texturas generadas en código (`art/textures.ts`) y filtros. Por qué: el SVG carga más rápido (la versión lite pesa ~130–220 KB gzip), se puede deformar y animar, y no cuesta nada. Los PNG originales viven fuera del repo.
2. **Respeta `reduceMotion` y `reduceFlashes`.** Menos sacudida, menos parpadeo, versión corta. Sin excepciones.
3. **Limpia lo que creas:** tickers, tweens, intervals. Un tween sobre un objeto destruido es un crash en móvil a las 2 a.m.
4. **El puppet actúa, GSAP mueve.** No reemplaces el acting del gato con rotaciones del contenedor.
5. **Saltar acelera, no corta.**
6. **El tier tiene que coincidir con lo que pasó.** Un T4 por recoger monedas es mentirle al jugador.

---

## 8. Checklist antes del PR

- [ ] Probé en `?scene=catlive` (y `&rig=1` si toqué un rig o `deform()`), o en `?scene=fxlab` / `?scene=art` si es una secuencia.
- [ ] Lo vi con `reduceMotion` encendido (Ajustes) y no marea ni parpadea fuerte.
- [ ] La secuencia recibe la capa como parámetro y devuelve una `Promise` que se resuelve al terminar.
- [ ] Tap acelera (`tl.timeScale`), no corta.
- [ ] Cada `Ticker.shared.add` tiene su `remove`; cada `setTimeout`/`setInterval` revisa `destroyed`; los tweens largos se matan antes de destruir.
- [ ] Gatos con `livingCat()` (no `new Sprite`), con `preloadCats` o `loadCatTexture` antes.
- [ ] Puppets en `fps: 12` y `acts` acorde al lugar (`'battle'` en combate, `'calm'` en historia, `'none'` si la secuencia controla todo).
- [ ] Cero archivos raster nuevos; `git status` no muestra `.png/.jpg/.webp/.gif`.
- [ ] El tier del comentario (T1–T4) coincide con la duración real.
- [ ] `npm run typecheck` dentro de `game/` pasa.
- [ ] Leí [CONTRIBUTING](../../CONTRIBUTING.md) y, si agregué un gato, [agregar-gato.md](agregar-gato.md).

Y si tu animación hace reír a alguien en el primer intento, ya ganaste. Si lo hace marear, revisa el punto 2.
