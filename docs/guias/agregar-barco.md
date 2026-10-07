# Cómo agregar (o tunear) un barco

Bienvenida, bienvenido al astillero. Aquí se clavan tablones, se atornillan cañones y se le explica a un
gato que no, el camarote no es una caja de arena. Esta guía cubre los barcos del jugador, los enemigos,
los jefes, los módulos y el arte de los cascos.

Lo primero que tienes que saber: **un barco es una rejilla de celdas**. Cada celda tiene material y vida;
algunas pertenecen a un módulo (cañón, camarote, núcleo...). Si una celda se queda sin camino hacia la
quilla (la fila de abajo), se desprende y se hunde. Toda la gracia del combate sale de ahí.

Lo segundo: **el arte es 100% procedural**. No hay ni un solo PNG de barco. El casco se pinta en código a
partir de la rejilla. El `.gitignore` bloquea `png/jpg/webp/gif/avif/bmp` a propósito: vector y código
cargan más rápido, se pueden animar y romper pedacito por pedacito, y no cuestan nada.

Guías hermanas: [agregar-gato.md](agregar-gato.md), [agregar-elemento.md](agregar-elemento.md),
[agregar-historia.md](agregar-historia.md), [animaciones.md](animaciones.md),
[arquitectura.md](arquitectura.md), [../ACTUALIZACIONES.md](../ACTUALIZACIONES.md) y
[../../CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Mapa de archivos

Todas las rutas son relativas a `game/src/`.

| Archivo | Qué vive ahí |
| --- | --- |
| `data/content.json` → `ships[]` | Barcos del jugador: rejilla, casco con `H`, módulos de fábrica, textos. |
| `data/content.json` → `modules` | `families` (hull, weapon, shield...), `utility` (módulos de utilería), `relics`, `artifacts`. |
| `data/content.json` → `materials` | Multiplicadores elementales por material (los lee `battle/sim.ts`). |
| `data/content.json` → `shipArt` | `renderSpec`, `hullSkinsByMk`, `playerShips`, `enemyFactions`: **documento de diseño**, el código no lo lee hoy. |
| `data/content.json` → `enemyArchetypes`, `bosses`, `elites`, `enemies` | Enemigos genéricos, jefes, élites y las etapas de cada zona. |
| `data/balance.json` → `ship.ships[]` | Números del barco: `crew`, `slots`, `mult`, `cost`, `unlock`. |
| `data/content.ts` | Tipos (`ShipDef`, `BossDef`) y mapas (`SHIP_BY_ID`, `BOSSES`, `ZONES`). |
| `battle/ship.ts` | `ShipModel`, `ShipBlueprint`, `Material`, `ModuleKind`, `MATERIAL_HP`, `CELL = 40`. |
| `battle/blueprints.ts` | `BLUEPRINTS` (balsa, sparrow): planos de prueba para labs y `devBattle`. |
| `battle/shipgen.ts` | `generateShip`, `specFromArchetype` y `STORY_SHIPS` (jefes y barcos de historia a mano). |
| `battle/anime/*` | El pintor: `AnimeShipView`, `styles.ts` (`ShipStyleId`, `STYLES`, `styleFor`), `paint.ts`, `layout.ts`, `features.ts`, `blueprintsAnime.ts` (`ANIME_BLUEPRINTS`, `withMaterial`). |
| `battle/shipView.ts` | `ShipView` plano/viejito. Solo lo usa `BattleSandbox`; sirve de respaldo. |
| `battle/boss/rigs.ts` | Piezas de jefe dibujadas en código: `GargoyleWings`, `ThroatFx`, `KrakenRig`, `BubbleFx`, `RainFx`. |
| `state/sys/ship.ts` | Mk, poder de barco, tripulación, editor de plano (`validateLayout`, `blueprintFor`). |
| `state/sys/campaign.ts` | `buildBattle` / `buildSiege`: decide qué barco enemigo sale y con qué estilo. |
| `state/sys/gear.ts` | `UTILITY_BATTLE`: efecto en batalla de la utilería que el sim no modela. |
| `panels/shipyard/*` | El Astillero: `LayoutEditor.ts` (editor de plano), `Fleet.ts`, `MkTab.ts`, `art.ts` (glifos). |
| `scenes/ShipArtLab.ts` | El laboratorio de estilos (`?scene=shiplab`). |

---

## El formato de la rejilla

Un barco del jugador en `content.json` se ve así (Balsa Bigotuda, recortado):

```json
{
  "id": "balsa",
  "name": "Balsa Bigotuda",
  "archetype": "balsa",
  "utilityBudget": 1,
  "artifactSlots": 0,
  "grid": { "cols": 12, "rows": 9, "waterlineRow": 5 },
  "hull": [
    "............",
    "............",
    "............",
    "............",
    "..HHHHHHHH..",
    "HHHHHHHHHHHH",
    "HHHHHHHHHHHH",
    ".HHHHHHHHHH.",
    "..HHHHHHHH.."
  ],
  "modules": [
    { "kind": "mast",    "x": 5,  "y": 0, "w": 1, "h": 4 },
    { "kind": "catroom", "x": 1,  "y": 3, "w": 2, "h": 2, "slot": 0 },
    { "kind": "cannon",  "x": 10, "y": 4, "w": 2, "h": 1 },
    { "kind": "core",    "x": 5,  "y": 5, "w": 2, "h": 2 }
  ]
}
```

Reglas del formato:

- `hull` va de **arriba hacia abajo**, un string por fila, un carácter por columna. La última fila es la quilla.
- `x, y` de un módulo es su esquina superior izquierda; `w, h` en celdas. **Los módulos pisan al casco**:
  sus celdas se crean aunque debajo haya `.` (por eso el mástil puede flotar en filas vacías... siempre
  que toque el casco por abajo).
- El barco mira a la **derecha** (proa = derecha). El enemigo se voltea con `flip` al dibujarse.
- `slot` en los camarotes dice qué gato de la tripulación va en cada uno (0, 1, 2...).

### Letras de celda

| Letra | Material | HP base (`MATERIAL_HP`) |
| --- | --- | --- |
| `.` | vacío | - |
| `H` | **solo en `content.json`**: "casco del jugador", se cambia por el material del Mk de Casco | - |
| `W` | wood (madera) | 60 |
| `I` | iron (hierro) | 140 |
| `C` | crystal (cristal) | 90 |
| `B` | bone (hueso) | 110 |
| `V` | void (vacío) | 200 |
| `S` | stone (piedra) | 120 |
| `L` | canvas (lona) | 30 |

La `H` la traduce `blueprintFor()` en `state/sys/ship.ts` justo antes de la batalla:

```ts
const hc = hullClass();                       // HULL_BY_MK según mk('hull')
const letter = hc.mat === 'wood' ? 'W' : hc.mat === 'iron' ? 'I' : 'C';
const hull = def.hull.map((r) => r.replace(/H/g, letter).split(''));
// ...
return { bp: { cols, rows, hull, modules }, hpMul: hc.cellHp / MATERIAL_HP[hc.mat] };
```

Ojo: una `I` o `C` escrita a mano en el casco del jugador **se queda así** sin importar el Mk (el Gorrión
tiene placas `I`, el Bajel tiene celdas `C`). Úsalo para darle personalidad, no para todo el casco.

### De celda a comportamiento

En `ShipModel` (`battle/ship.ts`):

- Las celdas de módulo usan su propio material: `core` y `engine` son hierro, `arcane` y `shield` cristal,
  todo lo demás madera. El núcleo multiplica su vida x2.2 y el camarote x1.4.
- **Un módulo muere cuando pierde la mitad o más de sus celdas** (`refreshModule`).
- `collapse()` hace un flood fill desde la fila de abajo; lo que no conecte se desprende en pedazos.

Y en `battle/sim.ts` cada `kind` hace lo suyo:

| `kind` | Qué hace en batalla |
| --- | --- |
| `core` | Si muere, pierdes (`checkVictory`, razón `'core'`). |
| `catroom` | Hogar de un gato: el sim asigna los gatos a los camarotes ordenados por `slot`. **Si hay más gatos que camarotes, los que sobran no entran** (`mkSide` hace `slice(0, rooms.length)`). |
| `cannon` | Dispara solo al final del turno (andanada). El tipo de arma se elige por ranura en el Astillero. |
| `mast` | Vista previa de trayectoria; sin mástil vivo, `previewMul` baja a 0.5. |
| `powder` | Santabárbara: +25% a la andanada mientras vive; al morir explota (`powderBlast`), también a ti. |
| `arcane` | Sala de Invocación (costo de las ultimates). |
| `shield` | Burbuja de escudo, solo si el jugador tiene Escudos Mk >= 1 (si no, `blueprintFor` lo vuelve casco). |
| `engine` | Hoy no encontré lógica de sim para él: es estructura de hierro con arte de motor. |

Los módulos con `tag` (`'throat'`, `'static'`) son piezas de jefe y el sim se salta las reglas genéricas.

La utilería que **no** está en `SIM_KINDS` (`pantry`, `pump`, `anchor`, `bridge`, `tower`, `bulkhead`) se
convierte en celdas de casco al entrar a batalla (`bulkhead`, `pump` y `anchor` como hierro `I`), y su
efecto viaja por perillas en `UTILITY_BATTLE` de `state/sys/gear.ts` (`hpMul`, `cannonAtkMul`, etc.).

### De celda a arte

`AnimeShipView` (`battle/anime/AnimeShipView.ts`) toma el `ShipModel` y:

1. `layout.ts` calcula el contorno, la línea de flotación y si cada módulo va "incrustado" en el casco o
   sobre cubierta (`embedded`).
2. `paint.ts` pinta **todo el barco como una sola ilustración** con Canvas2D (curvas, bandas de sombra,
   tablones, troneras) y la sube a una textura. Cada `kind` tiene su función: `cabin`/`niche` para
   camarotes, `carriage`/`gunport` para cañones, `barrels`, `coreWindow`, `shieldGen`, `engine`, `runeWindow`.
3. Cada celda es un `MeshSimple` con su polígono irregular de esa textura; al romperse deja un borde
   dentado entintado y la pieza sale volando como escombro.
4. Velas, banderas, humo y rigs se animan con PixiJS (`Graphics`, `Sprite`) a 12 fps.

Todo es código. Si te dan ganas de "nomás poner un PNG", respira, toma agua, y abre `paint.ts`.

---

## Receta 1: nuevo barco del jugador

1. **`content.json` → `ships[]`**: agrega la entrada con `id`, `name`, `archetype`, `role`,
   `utilityBudget`, `artifactSlots`, `maneuver`, `special`, `recommendedFor`, `grid`
   (`cols`, `rows`, `waterlineRow`), `hull` (con `H`), `modules` y `art`. Los textos (`role`,
   `recommendedFor`) aparecen en el Astillero vía `shipRole()` / `shipRecommendedFor()`.
2. **`balance.json` → `ship.ships[]`**: misma `id`, más `crew`, `slots` (`hull`, `weapon`, `shield`,
   `engine`, `core`), `mult`, `cost` y `unlock` (`"start"`, `"kl:5"` o `"boss:3"`). **Sin esta entrada el
   juego truena**: `balanceShip(id)` usa `!` y `shipPower()` lo lee directo. La flota del Astillero se arma
   desde esta lista.
3. Que `slots.weapon` coincida con la cantidad de módulos `cannon` del plano (`weaponsOf()` cuenta los
   cañones del plano de `content.json`, no el número de balance) y que `crew` sea igual a la cantidad de
   `catroom` (todos los barcos actuales cumplen las dos cosas; nada lo valida, así que cuídalo tú).
4. Revisa que el plano de fábrica pase `validateLayout()`. Las reglas que checa:
   - mismos conteos de `core`, `cannon`, `catroom`, `engine`, `shield` (`FIXED_KINDS`) que el plano base;
   - nada fuera de la rejilla ni encimado;
   - utilería dentro de `utilityBudget`, y máximo `MAX_BULKHEADS = 3` mamparos;
   - todo conectado a la quilla;
   - mástil parado en la cubierta superior y arriba de `waterlineRow`;
   - motor en las 3 filas de abajo; núcleo con casco alrededor; camarotes tocando casco.
5. Perks: el texto `perk` de balance es solo texto. Los perks reales están **por id** en
   `state/sys/campaign.ts` (`effectiveSP` para `bastion`/`bajel`, `firstTurnDouble` para `gorrion`). Si tu
   barco tiene perk, ahí va.
6. (Opcional) Describe su look en `shipArt.playerShips` para quien diseñe después. El arte del jugador
   hoy depende del **Mk de Casco**, no del id del barco (ver receta 2).

## Receta 2: nuevo estilo de casco (skin)

Un estilo es una paleta más un puñado de interruptores. Vive en `battle/anime/styles.ts`:

```ts
export type ShipStyleId =
  // player hulls by Casco Mk
  | 'raft' // Mk1
  | 'sloop' // Mk2
  | 'pirate' // Mk3-4
  // ... coral, coral6, cosmic, duck, rat, stone, kraken, library, bone, noctis
  | 'void'; // ??? (nave de NADIE)
```

Pasos:

1. Agrega tu id a la unión `ShipStyleId`.
2. Agrega la entrada en `STYLES`. Lo más fácil es heredar: `{ ...pirate, id: 'mio', hull: {...}, feat: F({ pattern: 'stone', rail: 'crenel', extras: ['fog'] }) }`.
   `StyleFeatures` controla patrón del casco (`HullPattern`), barandal (`RailKind`), mascarón
   (`FigureKind`), extras (`palm`, `tesla`, `tentacles`, `books`, `eyes`, `fog`, `glitch`, `stars`, `tail`),
   tipo de escombro (`DebrisKind`), vela, techo de camarote, brillo, runas, etc. Un patrón o extra nuevo
   implica dibujarlo en `patterns.ts` / `features.ts` / `decorArt.ts`.
3. Decide quién lo usa:
   - Jugador: `hullStyleForMk(mk)` (Mk1 `raft`, Mk2 `sloop`, Mk3-4 `pirate`, Mk5 `coral`, Mk6 `coral6`, Mk7 `cosmic`).
   - Enemigo: `ZONE_STYLE` por zona, o las reglas por `stageKey` dentro de `styleFor()` (`duck`, `noctis`, `void`).
4. Agrégalo al laboratorio, `scenes/ShipArtLab.ts`: a `ALL_STYLES`, a alguna página de `PAGES`, a `LABEL`
   (es un `Record<ShipStyleId, string>`, así que TypeScript te va a regañar si se te olvida) y, si quieres
   un plano que le quede, a `bpFor()`.

## Receta 3: nuevo enemigo o jefe

### Enemigo genérico (arquetipo)

Los barcos de enemigos normales **se generan**. En `content.json` → `enemyArchetypes`:

```json
"chalupa": { "size": "11x7", "hull": "madera", "cannons": 1, "catrooms": 2, "mast": true, "special": "—" }
```

`specFromArchetype()` (`battle/shipgen.ts`) lo traduce: `size` es `colsxrows`; la primera palabra de
`hull` se mapea con `MAT_LETTER` (`madera`, `hierro`, `piedra`, `cristal`, `hueso`); y busca palabras en
`special` + `hull`: "santab" agrega pólvora, "despensa" despensa, "muro" un muro de hierro en la proa,
"escudo" un escudo. Sí, es parseo de texto en español. Escribe `special` con cariño.

Para usarlo, en `enemies[zona].stages[]` pon `"archetype": "tu_arquetipo"` (solo cuenta la primera
palabra). Reglas especiales por arquetipo (`balandra_electrica`, `pararrayos`, `galera_raices`,
`catapulta`, `torre_barco`) están escritas a mano en `buildSiege()` de `state/sys/campaign.ts`.

La semilla es `zona * 100 + etapa`, así que la misma etapa siempre genera el mismo barco.

### Élite

`content.json` → `elites` solo aporta `name`, `ship`, `rule` y `line` para la tarjeta de presentación. El
barco sale del `archetype` de la etapa, igual que un enemigo normal, con `COMBAT_TUNE.elite`.

### Jefe o barco de historia

Los barcos a mano viven en `STORY_SHIPS` (`battle/shipgen.ts`). Ejemplo real, Jefe 2 (recortado):

```ts
risco_flotante: {
  cols: 18,
  rows: 12,
  hull: [
    // ...3 filas vacías arriba
    '......SSSSSS......',
    '......SSSSSS.....S',
    'SSSSSSSSSSSSSSSSSS',
    '.SSSSSSSSSSSSSSSS.',
    '...SSSSSSSSSSSS...',
  ],
  modules: [
    { kind: 'arcane', x: 8, y: 5, w: 2, h: 2, tag: 'throat' }, // La Garganta: punto débil
    { kind: 'core', x: 8, y: 9, w: 2, h: 2 },
    { kind: 'cannon', x: 12, y: 7, w: 2, h: 1 },
    // ...
  ],
},
```

Para conectarlo:

1. Agrega el plano a `STORY_SHIPS`.
2. En `buildSiege()` (`state/sys/campaign.ts`), la cadena `if (key === '1-1') ... else if (isBoss && zone === N)`
   elige el plano y, si aplica, armas especiales (`enemyShots`).
3. Mecánicas de jefe: `BossConfig.id` en `battle/sim.ts` es la unión `'sardina' | 'gargoyle' | 'kraken'`.
   Un jefe con reglas nuevas necesita su id ahí, su lógica en el sim, el mapeo zona → id en `buildSiege()`
   y su texto en `BOSS_INTRO`.
4. Las piezas que no son celdas (alas, tentáculos, burbujas) se dibujan en `battle/boss/rigs.ts` con
   `Graphics`, animadas a 12 fps con la clase `Stepped`. `BattleScene` las monta.
5. Los datos narrativos (nombre, fases, frases, `enrageTurn`, `ai`) van en `content.json` → `bosses`.

Hoy solo los jefes 1-3 tienen barco a mano; los demás caen al generador con un tamaño mínimo de 16x10.

## Receta 4: nuevo módulo

Hay dos sabores, y conviene elegir bien antes de ponerse a soldar.

**Utilería sin lógica de sim (lo fácil).** Agrega una entrada a `content.json` → `modules.utility` con
`kind`, `name`, `cost`, `footprint`, `material`, `alive`, `destroyed` y `unlock` (`start`, `mission:C11`,
`boss:3`, `expansion:4`). El editor la ofrece sola. Su efecto en batalla va en `UTILITY_BATTLE`
(`state/sys/gear.ts`) y su ícono en `moduleGlyph()` (`panels/shipyard/art.ts`). En batalla se vuelve casco.

**Módulo que el sim entiende (lo divertido).** Además de lo anterior:

1. Agrega el `kind` a `ModuleKind` en `battle/ship.ts` y, si quieres, su material en el constructor de `ShipModel`.
2. Agrégalo a `SIM_KINDS` en `state/sys/ship.ts` (si no, `blueprintFor` lo aplana a casco). Si es
   estructural y no se puede quitar, también a `FIXED_KINDS`.
3. Dale arte: `paintDeckModule` y `paintEmbeddedModule` en `battle/anime/paint.ts`, `addModuleDecor` y la
   rotura en `AnimeShipView.ts`, y `MODULE_STYLE` en `battle/shipView.ts` (es un `Record`, TypeScript te avisa).
4. Su comportamiento en `battle/sim.ts`. Si los enemigos lo usan, enséñale a `generateShip()`.

---

## Cómo probar

Arranca con `npm run dev` dentro de `game/` y abre `http://127.0.0.1:5173/` con alguno de estos:

| Ruta | Para qué |
| --- | --- |
| `?scene=dev` | LABORATORIO: la página que lista todos los labs con qué hacen y qué guía los explica (`scenes/DevLab.ts`). |
| `?scene=shiplab` | `ShipArtLab`: páginas de estilos (botón `ESTILOS`), `GALERÍA` con todos, `PLANOS` alterna anime / planos de prueba, y botones para romper: `MÓDULO`, `DESPRENDER`, `DISPARAR`, estados. |
| `?scene=sandbox` | `BattleSandbox`: sensación de destrucción, arrastra para apuntar. Usa el `ShipView` plano con `BLUEPRINTS.sparrow`. |
| `?scene=battle` | Batalla de desarrollo (`dev/devBattle.ts`). Cambia `blueprint` ahí para probar tu plano. |
| `?stage=2-3` | Solo en DEV: carga tu partida y salta directo a esa etapa (zona-etapa). Ideal para jefes. |
| `?save=post-boss2` | Solo en DEV: carga un fixture de `game/test-saves/` en el slot de guardado. Combínalo: `?save=pre-boss3&stage=3-9` (cada zona tiene 9 etapas; la 9 es el jefe). |

Para tu barco nuevo, además: entra al Astillero, cámbiate a él, abre el editor de plano y fíjate que no
marque problemas. El botón de guardar y probar es tu mejor amigo.

## Partidas viejas: no rompas el barco de nadie

Las partidas guardan `G.s.layouts[shipId]` (el plano editado por el jugador). Si cambias una regla de
`validateLayout` o el plano de un barco, un diseño viejo puede quedar inválido y `layoutOf()` regresa en
silencio al plano de fábrica. Eso se siente como un robo.

La solución es un parche retro en `game/src/state/patches.ts`. Ejemplo real:

```ts
registerPatch({
  id: '2026-10-mamparos-max-3',
  why: 'Los Mamparos pasaron a costar 1 y máximo 3 por barco; ...',
  run() {
    // quita mamparos sobrantes uno por uno, prefiriendo los que no dejan casco suelto;
    // si aun así no valida, guarda el diseño intacto y marca layout_needs_fix_<barco>
  },
});
```

Las reglas del contrato (el `id` es para siempre, nunca quitar progreso, devolver una nota corta en
español) están en [../ACTUALIZACIONES.md](../ACTUALIZACIONES.md). Lee esa guía antes de cambiar números
de barcos que ya existen.

---

## Checklist antes de abrir el PR

- [ ] `npm run build` (en `game/`) pasa sin errores de TypeScript.
- [ ] El barco nuevo está en `content.json` **y** en `balance.json` con la misma `id`.
- [ ] El plano de fábrica pasa el editor de plano sin advertencias.
- [ ] Lo viste en `?scene=shiplab` (si es estilo) o en batalla real con `?stage=` (si es barco/jefe).
- [ ] Probaste con una partida vieja (`?save=post-boss2` o similar) y no se rompió ningún diseño guardado.
- [ ] Si cambiaste una regla de plano, hay parche en `state/patches.ts` con nota para el jugador.
- [ ] Cero raster: nada de png/jpg/webp/gif. Todo se dibuja en código.
- [ ] Los números (vida, costo, multiplicadores) viven en `balance.json` / `content.json`, no regados por el código.
- [ ] Rompiste tu barco a cañonazos al menos una vez y te dio gusto verlo hundirse. Es requisito moral.
