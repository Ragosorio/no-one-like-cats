# Cómo agregar un elemento nuevo

Un elemento es lo más grande que puedes agregar sin inventar un modo de juego: toca el combate (afinidades, materiales, estados, disparos), la isla (hábitats, bioma), la colección (gatos, primordial, Resonancia), el arte (insignia, colores, "dimensión") y la historia (quién te lo entrega y con qué secuencia). Por eso esta guía es más un **mapa de todos los lugares que hay que tocar** que una receta de tres pasos.

Antes de escribir código, abre un *issue* de tipo **Idea** con: nombre, verbo (el de Fuego es "Incendiar", el de Agua "Inundar"), a quién le gana y contra quién pierde, su estado, su arquetipo de disparo, su dimensión visual y cómo se descubre en la historia. Si el elemento no tiene una personalidad clara en una frase, todavía no está listo.

Guías hermanas: [agregar-gato.md](agregar-gato.md) · [agregar-historia.md](agregar-historia.md) · [agregar-barco.md](agregar-barco.md) · [animaciones.md](animaciones.md) · [arquitectura.md](arquitectura.md) · [CONTRIBUTING](../../CONTRIBUTING.md)

---

## 1. Lo que ya existe

Hoy hay 13 elementos en `content.json` → `elements[]`, en este orden:

| id | Nombre | Cómo se desbloquea (`unlock`) |
|---|---|---|
| `fire` | Fuego | `start` |
| `water` | Agua | `start` |
| `nature` | Naturaleza | `start` |
| `earth` | Tierra | `boss:1` |
| `storm` | Tormenta | `boss:2` |
| `magic` | Magia | `kl:24` (llega el Arcanista) |
| `cosmic` | Cósmico | `boss:5` |
| `ice` | Hielo | `grieta:ice` — Grieta Boreal, después de los créditos (H23) |
| `sound` | Sonido | `grieta:sound` — campeón de una liga del Podio (H24) |
| `shadow` | Sombra | `grieta:shadow` — Jardín Sakura limpio (H25) |
| `time` | Tiempo | `grieta:time` — Oasis Dorado limpio (H26) |
| `light` | Luz | `grieta:light` — Reino 36 + Atolón Estelar limpio (H27) |
| `void` | Vacío | `grieta:void` — Abismo del Ronroneo limpio o 10 Fragmentos del Vacío (H28) |

Ojo con un detalle de nombres: en el contenido el elemento se llama `storm`, pero en el simulador de combate se llama `electric` (`SIM_ELEMENT` en `game/src/battle/catShots.ts` y `toContentEl()` en `game/src/battle/sim.ts`). No es un error, es historia. Los seis de la Parte 2 se llaman igual en los dos lados.

### Parte 2: los seis del multiverso

Las reglas viven en `game/src/battle/multiverso.ts` (el simulador solo tiene ganchos chiquitos) y su
look en `game/src/battle/fx/multiversoFx.ts`. Las Grietas (descubrimiento, batallas, banderas
`grieta:<id>`, parche para partidas viejas) en `game/src/state/sys/grietas.ts`.

| Elemento | Disparo (`archetype` → trayectoria) | Qué hace (igual para jugador y enemigo) | Podio (TÉCNICA) |
|---|---|---|---|
| Hielo | `carambano` → parabólico | Congelado 2: el cañón/camarote no actúa su próximo turno; el gato golpeado se congela (los de Hielo no). Fuego encima = CHOQUE TÉRMICO ×1.75 | FROST BITE: Congelado (pierde turno; fuego lo revienta ×1.5) |
| Luz | `haz` → `ray` (recto, sin viento, perfora) | CEGADO: el rival apunta su próximo turno con 30% de vista previa (la IA con ×2.2 de error). Luz sobre Mojado = ARCOÍRIS | PRISM FLASH: Cegado (falla 35%) |
| Sombra | `sombra` → parabólico invisible | No se ve volar; PUÑALADA al gato enemigo más cercano (ignora escudos de gato) | SHADOW STITCH: no se esquiva, atraviesa escudo |
| Sonido | `onda` → `wave` (atraviesa paredes) | Aturde a cada gato cuyo camarote cruza; luego SORDO 2 turnos. Sonido sobre Congelado = NOTA ALTA ×2 | SONIC BOOM: atraviesa escudo, puede aturdir |
| Tiempo | `reloj` → parabólico (rebota si tiene rebotes) | REBOBINAR: repara tus celdas con 35% del daño hecho; el gato golpeado pierde su próximo turno. Ulti = TIME STOP (los gatos rivales pierden un turno; no se encadena). Tiempo sobre Ardiendo/Enraizado = ACELERAR | REWIND CLAW: se cura la mitad, 25% turno extra |
| Vacío | `borrado` → `phase` | Borra en línea; lo que toca queda BORRADO (no se repara ni regenera). Se come burbujas, escudos, escudos de gato y una segunda vida | NULL BITE: se come el escudo, −8% vida máx. permanente |

**Afinidad** (atacante → defensor ×1.5; el defensor devuelve ×0.75). Lo del Capítulo 1 no cambió:

```
Anillo de 10 (alterna nuevo / viejo):
  hielo > agua > sonido > tierra > luz > magia > vacío > cósmico > tiempo > fuego > hielo
Duelos (×1.5 de ida y de vuelta): luz <-> sombra, sombra <-> tormenta
Ciclo interno: hielo > tiempo > vacío > sonido > hielo
```

Cada elemento nuevo le gana a 2 y pierde contra 2. Cada elemento viejo (menos Naturaleza, que queda
intacta) gana exactamente una ventaja y una debilidad, así el Capítulo 1 sigue balanceado.

**Materiales** (`mult` contra el casco): Luz ×1.5 a la lona y ×0.5 al cristal (pasa a través);
Sonido ×1.5 al cristal, ×0.75 a madera y lona, ×0.5 al vacío; Tiempo ×1.25 a madera, lona y hierro
(se pudre, se oxida), ×0.75 al hueso; Hielo ×1.25 a hierro y lona; Sombra ×1.25 a cristal y hueso;
Vacío ×1.25 al cristal y ×0.5 contra el vacío.

---

## 2. Mapa de archivos

| Archivo | Qué tocas |
|---|---|
| `game/src/data/content.json` → `elements[]` | La ficha del elemento. |
| `game/src/data/content.json` → `affinity` | A quién le pega x1.5 y de quién recibe x0.75. |
| `game/src/data/content.json` → `materials[]` | Cuánto daño hace a cada material de barco (`mult`). |
| `game/src/data/content.json` → `statuses[]`, `reactions[]` | Su estado y sus combinaciones con otros estados. |
| `game/src/data/balance.json` → `elements[]` | Id, nombre, desbloqueo y la frase de historia. |
| `game/src/data/balance.json` → `bosses[].unlocks` | El jefe que lo entrega (`"element:<id>"`). |
| `game/src/state/sys/storyBattles.ts` | O la batalla de historia que lo entrega (`reward.element`). |
| `game/public/icons/el-<id>.svg` | La insignia (SVG, nunca emoji). |
| `game/src/ui/elementIcon.ts` | `ELEMENT_IDS` (lista de insignias que se precargan) y alias. |
| `game/src/data/elementsMeta.ts` | `ELEMENT_NAME` (nombre en mayúsculas para la UI). |
| `game/src/art/catArt.ts` | `ELEMENT_FX`: colores `main`/`accent`/`dark` y tipo de partícula. |
| `game/src/panels/collection/dimension.ts` | `D`: su "dimensión" (fondo, patrón, fuente, palabra grande) para Altar, mutaciones y pósters. |
| `game/src/battle/types.ts`, `catShots.ts`, `sim.ts` | `ElementId`, `SIM_ELEMENT`, estados, trayectorias. |
| `game/src/island/buildingArt.ts` | `habitatParts()`: el hábitat usa `elementFx(element)` y la insignia. |
| `game/src/scenes/ResultsScene.ts`, `game/src/app/storyFlow.ts` | Textos de la secuencia de descubrimiento (`DISCOVERY_CAPTION`, `CAPTION`, `BIOME`). |
| `game/src/fx/sequences/elementDiscovery.ts` | La secuencia T4 "el mundo se reimprime con tu color". |

---

## 3. La ficha en `content.json`

Agua, real y recortada:

```json
{
  "id": "water",
  "name": "Agua",
  "order": 2,
  "unlock": "start",
  "discovery": "Inicial (Gelatino).",
  "dimension": "NOIR OCEÁNICO + ukiyo-e",
  "palette": ["#172B35", "#204A7A", "#3569A3", "#A7E8D7"],
  "verb": "Inundar",
  "shotArchetype": "torpedo",
  "shotRule": "Torpedo: vuela parabólico hasta tocar el agua; desde ahí avanza recto 0.4 s bajo la línea de flotación…",
  "midFlight": "géiser: si ya está bajo el agua, sube en vertical y explota en la cubierta.",
  "status": "mojado",
  "beats": "fire",
  "beatenBy": "storm",
  "levelUpgrades": {
    "10": { "name": "Corriente", "effect": "+25% radio y +0.2 s de recorrido submarino." },
    "20": { "name": "Marea", "effect": "Mojado se aplica en un área 3x3." }
  },
  "habitatBiome": "home",
  "particle": "bubble",
  "onomatopoeia": ["¡SPLASH!", "¡PLOF!"],
  "sfxLayer": "burbujas + golpe de agua"
}
```

Lo importante:

- **`palette`** son 4 colores en este orden: oscuro, claro, principal, acento. `elementDiscovery.ts` los lee así (`pal[0]` oscuro, `pal[1]` claro, `pal[2]` principal, `pal[3]` acento) para reimprimir la pantalla.
- **`order`** ordena el elemento en la Catdex y en los menús.
- **`unlock`** con prefijo `chapter` esconde el elemento de la Catdex hasta que lo conozcas (`dexElements()` en `state/ext/collection.ts`). Los demás valores (`boss:1`, `kl:24`) hoy son descriptivos: **lo que de verdad lo desbloquea es quien lo entrega** (sección 5).
- **`onomatopoeia`** la usan las dimensiones de Altar y pósters.
- **`levelUpgrades`** es el texto; los efectos que ya existen en código están en `shotFromSpec()` (por ejemplo, Naturaleza gana un proyectil extra a Nv10 y Tierra perfora más a Nv20). Un efecto nuevo se programa ahí.
- `emoji` existe por herencia, pero la UI **no** muestra emojis: usa la insignia SVG. Puedes dejarlo vacío.

### Afinidad

`content.json` → `affinity` es "atacante → defensor → multiplicador". Lo real:

```json
{
  "fire":   { "nature": 1.5, "water": 0.75 },
  "water":  { "fire": 1.5, "storm": 0.75 },
  "nature": { "earth": 1.5, "fire": 0.75 },
  "earth":  { "storm": 1.5, "nature": 0.75 },
  "storm":  { "water": 1.5, "earth": 0.75 },
  "magic":  { "cosmic": 1.5 },
  "cosmic": { "magic": 1.5 }
}
```

Los cinco primeros forman un ciclo; Magia y Cósmico son un par que se pegan entre sí. Un elemento nuevo puede entrar al ciclo (hay que mover dos flechas, y eso rebalancea todo) o formar su propio par. Lo que no lleve número vale 1.

### Materiales

Cada material de barco tiene un `mult` por elemento. Ejemplo real:

```json
{ "id": "wood", "name": "Madera", "hp": 60, "tags": ["flammable", "loadBearing"],
  "mult": { "fire": 1.5, "water": 1, "nature": 1.25, "earth": 1, "storm": 0.75, "magic": 1, "cosmic": 1 } }
```

Agrega tu elemento a los 7 materiales. Si lo olvidas, vale 1 (no truena, pero el elemento queda sin carácter contra barcos).

### Estado y reacciones

Si tu elemento trae un estado nuevo, va en `statuses[]` (texto) y en el simulador: `StatusId` en `battle/types.ts`, el mapa `STATUS` de `battle/catShots.ts` (que traduce `"mojado"` → `wet`) y su lógica en `battle/sim.ts`. Las combinaciones viven en `reactions[]`; por ejemplo:

```json
{ "id": "conduccion", "name": "Conducción", "trigger": { "status": "mojado", "by": "storm:rayo" },
  "effect": "El rayo salta a todas las celdas Mojadas conectadas…", "mult": 1.5,
  "grimoire": "Agua + electricidad. Tu abuela te lo advirtió." }
```

El `grimoire` es la frase que se lee en el Grimorio. Que sea graciosa.

---

## 4. Arte del elemento

Todo vectorial. Nada de PNG (el `.gitignore` los bloquea): usamos SVG porque carga más rápido, se puede animar y no cuesta nada.

1. **Insignia**: `game/public/icons/el-<id>.svg`, 128×128, mira `el-fire.svg` como plantilla (círculo con degradado, símbolo al centro, contorno de tinta). Luego agrega el id a `ELEMENT_IDS` en `game/src/ui/elementIcon.ts` para que se precargue al arrancar. En textos, `iconText('Une {fire} y {water}', ...)` pinta las insignias en línea.
2. **Nombre de UI**: `ELEMENT_NAME` en `game/src/data/elementsMeta.ts`.
3. **Colores de efectos**: `ELEMENT_FX` en `game/src/art/catArt.ts` (`main`, `accent`, `dark`, `particle`). Los usan auras, disparos, hábitats, revelaciones. Si falta, todo cae a Fuego (`elementFx()` devuelve `ELEMENT_FX.fire`), y tu elemento de hielo se verá como fogata.
4. **Dimensión**: una entrada en `D` de `game/src/panels/collection/dimension.ts` (fondo, tono medio, acento, brillo, color de texto, fuente de `F`, patrón y una palabra grande). La filosofía está en `research/10-direccion-de-arte.md`: cada elemento arrastra su propio estilo de impresión (anime inferno, noir oceánico, acuarela, grabado de periódico, cómic silver age, tarot, glitch). Elige uno que todavía no exista.
5. **Hábitat**: `habitatParts()` en `game/src/island/buildingArt.ts` ya pinta un hábitat para cualquier elemento usando sus colores y su insignia en el letrero. Si quieres decoración propia, ahí va. Pruébalo en `?scene=islandlab`. (Ojo: el sistema de hábitats y economía se está rediseñando en paralelo; revisa `state/sys/island.ts` antes de tocar reglas.)
6. **Bioma**: `habitatBiome` apunta a un bioma de la isla (`game/src/island/terrain.ts` → `BIOMES`). El nombre que sale en el sello "NUEVO HÁBITAT" viene de `BIOME` en `ResultsScene.ts`.

---

## 5. Cómo se descubre

El elemento entra a la partida cuando su id llega a `G.s.elements`. Eso pasa en dos lugares:

- **Venciendo a un jefe**: `balance.json` → `bosses[]`, con `"element:<id>"` en `unlocks`. Real:

  ```json
  { "n": 1, "name": "Capitan Bigotes Rotos", "zone": 1, "kl": 5, "gems": 6,
    "unlocks": ["element:earth", "cat:l_gea", "zone:2"] }
  ```

  `state/sys/campaign.ts` lo agrega a `G.s.elements`, emite el evento `element` y la pantalla de resultados dispara la secuencia.
- **En una batalla de historia**: `reward.element` en `state/sys/storyBattles.ts`. Ahí se hace igual y además se levanta el flag `element:<id>`. La secuencia la dispara `revealElement()` en `app/storyFlow.ts`.

La secuencia es `playElementDiscovery()` (`fx/sequences/elementDiscovery.ts`): oscurece el mundo, abre una grieta con la silueta del primordial, reimprime la pantalla con la paleta del elemento, dibuja la red de Resonancias con los elementos conocidos y estampa los sellos. Escribe su frase en `DISCOVERY_CAPTION` (`ResultsScene.ts`) y/o `CAPTION` (`storyFlow.ts`).

Pruébala sin jugar: `?scene=fxlab&cat=<id de un gato de tu elemento>` y botón **ELEMENTO NUEVO**.

---

## 6. Gatos del elemento

Un elemento sin gatos es un letrero bonito. Mínimo necesitas:

- **Un primordial** legendario (`rarity: "legendary"`, `primordial: true`, un solo elemento). Suele llegar con el descubrimiento (`cat:<id>` en los `unlocks` del jefe) y luego sale de Resonancia cuando los dos padres comparten el elemento y son Nv20+.
- **Comunes de un solo elemento**, para que la Resonancia con padres de ese elemento tenga qué dar.
- **Raros de combinación** (tu elemento + otro): aparecen solos en la Resonancia de esos padres. La regla completa está en [agregar-gato.md](agregar-gato.md#6-cómo-se-consigue).

---

## 7. Partidas viejas

- `G.s.elements` es un arreglo de ids. Un elemento nuevo no requiere migración.
- Si el elemento lo entrega un jefe que la gente ya venció, esas partidas **no** lo van a recibir solas: hace falta un parche (`registerPatch`) que lo agregue, levante los flags y avise en NOVEDADES. Lee [ACTUALIZACIONES.md](../ACTUALIZACIONES.md); la regla de oro es dar, nunca quitar.
- Si el elemento cambia afinidades o materiales, es un cambio de balance: anótalo en NOVEDADES con la etiqueta `BALANCE`.

---

## 8. Checklist

- [ ] Ficha en `content.json` → `elements[]` con paleta de 4 colores y `order`.
- [ ] Fila y columna en `affinity`; `mult` en los 7 `materials[]`.
- [ ] Estado (si es nuevo) en `statuses[]` y en el simulador (`StatusId`, `STATUS`, `sim.ts`).
- [ ] `balance.json` → `elements[]` y quién lo entrega (jefe o batalla de historia).
- [ ] Insignia `public/icons/el-<id>.svg` + `ELEMENT_IDS` + `ELEMENT_NAME`.
- [ ] `ELEMENT_FX` y dimensión en `D`.
- [ ] Hábitat probado en `?scene=islandlab`; secuencia probada en `?scene=fxlab`.
- [ ] Primordial, comunes y raros de combinación (ver [agregar-gato.md](agregar-gato.md)).
- [ ] Parche para partidas que ya pasaron el punto de descubrimiento.
- [ ] `npm run build` pasa; probado con partida nueva y con `?save=post-boss3`.
- [ ] NOVEDADES en `game/src/data/updates.ts`.
