# Cómo agregar historia (misiones, diálogos, zonas y batallas de historia)

Qué bueno que llegaste al departamento de guion. Aquí se decide qué dice la Capitana Luzterna, cuándo lo dice y
qué tiene que hacer el jugador para que lo vuelva a decir. Spoiler: casi todo pasa en un JSON enorme y
en dos o tres archivos de TypeScript que lo ponen en escena.

## Qué vas a tocar

- **Misiones** (`missions[]` en `game/src/data/content.json`): la cadena `historia` (H01–H22) y las
  cadenas laterales `capitan` (C), `criador` (K) y `explorador` (E). Se evalúan solas cada ~0.7 s.
- **Beats de diálogo** (`story.beats` en `content.json`, o líneas escritas en `game/src/ui/story/script.ts`)
  y los **ganchos** que deciden cuándo suenan (`ON_NEW`, `ON_DONE`, `WHEN` en `game/src/app/story.ts`).
- **Zonas, jefes y batallas de historia**: `enemies`, `bosses`, `elites` en `content.json`,
  `game/src/state/sys/campaign.ts` y `game/src/state/sys/storyBattles.ts`.
- **El prólogo** (`game/src/scenes/PrologueScene.ts`), que lee algunas líneas del beat `b00_prologo`.

Antes de empezar, si no conoces la estructura general, date una vuelta por [arquitectura.md](arquitectura.md).
Si tu historia trae un gato nuevo, un elemento o un barco, vas a necesitar también
[agregar-gato.md](agregar-gato.md), [agregar-elemento.md](agregar-elemento.md) o
[agregar-barco.md](agregar-barco.md). Para que el personaje se mueva bonito: [animaciones.md](animaciones.md).

## Mapa de archivos

| Archivo | Qué hay ahí |
|---|---|
| `game/src/data/content.json` → `missions[]` | Todas las misiones (datos puros) |
| `game/src/data/content.json` → `story.beats` / `story.characters` / `story.defeatCopy` | Beats con líneas, fichas de personajes (solo referencia) y frases de derrota (las usa `ResultsScene.ts`) |
| `game/src/data/content.ts` | Tipos (`MissionDef`, `BeatDef`, `BossDef`...) y mapas `MISSION_BY_ID`, `BEAT_BY_ID` |
| `game/src/state/sys/missions.ts` | `triggerMet()`, `evalGoal()`, `activate()`, `complete()`, `checkMissions()` |
| `game/src/state/sys/missionGoals.ts` | Catálogo puro: `GOAL_HANDLERS`, `TRIGGER_KINDS`, `MISSION_GATES` |
| `game/scripts/verify-missions.ts` | Verificador sin navegador de goals, contadores y flags |
| `game/src/app/story.ts` | El director de escena: `ON_NEW`, `ON_DONE`, `WHEN`, `COVERED`, cola de beats |
| `game/src/app/storyFlow.ts` | Arranca batallas de historia y las revelaciones (`revealCat`, `revealElement`) |
| `game/src/ui/dialog.ts` | `say()`, `tip()`, `newspaper()`: las cajas de cómic |
| `game/src/ui/story/script.ts` | Líneas largas en código: `ZONE_CARDS`, `ZONE_INTRO`, `ELITE_WARN`, `BOSS_INTRO`, `BOSS_OUTRO`, `BOSS_NEWS`, intros/outros de batallas de historia |
| `game/src/ui/story/text.ts` | Registro de personajes que hablan (`SPEAKERS`) y el filtro de tono (`SOFT`) |
| `game/src/ui/story/zoneCard.ts` / `credits.ts` | Carta de "¡NUEVA ZONA EN LA CARTA!" y créditos del capítulo |
| `game/src/state/sys/campaign.ts` | Zonas, etapas, jefes (`bossRewards` usa `balance.json` → `bosses[]`) |
| `game/src/state/sys/storyBattles.ts` | `STORY_BATTLES`: peleas únicas que pide la cadena H |
| `game/src/state/ext/story.ts` | `beatSeen` / `markBeat` / `lineSeen` (qué ya vio esta partida) |
| `game/src/state/patches.ts` y `../ACTUALIZACIONES.md` | Cómo regalarle cosas a partidas viejas |
| `game/src/data/updates.ts` | NOVEDADES que ve el jugador (no lo edites sin coordinar) |

## Cómo funciona una misión (lo que el código hace de verdad)

Cada misión en `content.json` tiene exactamente estos campos:

```json
{
  "id": "H11",
  "chain": "historia",
  "title": "El Heredero del Trueno",
  "goal": { "type": "win_battle", "battle": "event_raijin", "text": "Sube a la Torre del Trueno y vence a Raijin." },
  "trigger": "boss:2",
  "purpose": "story",
  "reward": { "std": true },
  "unlocks": [],
  "line": "25 minutos REALES. No se pausan. Ni llorando.",
  "estTime": "~1:15"
}
```

`checkMissions()` corre cada ~700 ms (y después de algunas acciones) y repite hasta 6 pasadas:
activa las misiones cuyo `trigger` se cumple, y completa las activas cuyo `goal` llegó a la meta.
Por eso completar una misión puede activar la siguiente en la misma pasada.

**`trigger`** (en `triggerMet()` de `missions.ts`). Se puede combinar con `&`, por ejemplo `"kl:5 & mission:E03"`:

| Forma | Se cumple cuando |
|---|---|
| `start` | Siempre (partida nueva) |
| `mission:H05` | Esa misión está en `missions.done` |
| `kl:12` | Nivel de Reino >= 12 |
| `boss:3` | Jefes de zona derrotados >= 3 |
| `stage_cleared:2-8` | Esa etapa está ganada |
| `stage_reached:1-3` | Esa etapa ya está desbloqueada |
| `expansion:6` | Expansión de terreno 6 limpiada |
| `first_meter_full`, `first_orb_drop`, `first_micro`, `can_quick_assault`, `first_flash_presage` | Casos especiales (flag o contador) |
| cualquier otra cosa | Se lee como flag: `G.has(trigger)`. Así funciona `event_presage:bandera_negra` |

**`goal.type`**: tiene que existir en `GOAL_HANDLERS` (`missionGoals.ts`) y en el `switch` de
`evalGoal()`. En modo dev la consola avisa `[missions] goal types sin evaluador` si no. Hay dos sabores:

- **De contador** (`how: 'counter'`, ej. `tap_cat`, `harvest_food`, `use_ultimate`): al activarse se guarda
  una línea base y se mide lo que pasa *después*. Si la misión aparece en una partida vieja, el jugador
  tiene que volver a hacer la acción.
- **De estado** (`how: 'state'`, ej. `defeat_boss`, `reach_kl`, `own_ship`, `watch`): leen la partida
  directamente. Si ya lo cumpliste, se completa al instante.

`win_battle` es mixto: con `stage` lee `isCleared`, con `battle` lee el flag `won_<battle>`, con `zone`
cuenta `wins_zone_<zone>`, y sin nada cuenta `wins`. `goal.text` es lo que ve el jugador en el HUD.

**`reward`** (`complete()` en `missions.ts`): `std: true` da la recompensa estándar (oro y comida según
tu ingreso por segundo, chance de gema, orbes de un gato al azar). Encima suma `gold`, `food`, `gems` y
`orbsOfFedCat` si vienen. Ojo: hay misiones con `"boss": 1` o `"goldenLoot": true` en `reward`, pero
`complete()` no los lee. El botín dorado de H05 en realidad lo da `applyResult()` en `campaign.ts` con el
flag `firstWin`.

**`unlocks`**: al completar, cada valor se vuelve flag con `G.flag(u)`, *excepto* los que parecen id de
misión (`/^[HCKE]\d\d$/`, ej. `"K01"`): esos son solo documentación. Un flag no hace nada por sí solo;
algún sistema tiene que leerlo con `G.has(...)` (ej. `puerto_combate` y `santuario_resonancia` en
`game/src/state/ext/island.ts`). La cadena real la define el `trigger` de la siguiente misión, no `unlocks`.

**`line`**: un tip no bloqueante de Luzterna cuando la misión aparece (`maybeTip()` en `story.ts`), solo
para historia o misiones fijadas, y solo si el id no está en `COVERED`.

**`purpose`** y **`estTime`**: hoy el código no los lee. Son notas de diseño (y para el estimador
humano). Llénalos igual, que el que venga atrás te lo va a agradecer.

**Fijadas (pins)**: máximo 3. Una misión `historia` nueva desplaza a una que no sea de historia.

**Misiones dormidas**: `MISSION_GATES` en `missionGoals.ts` duerme una misión hasta que existe su
función (hoy solo `E11`, que espera el flag `gambit_open`).

## Receta: agregar una misión

1. **Escoge un id nuevo** con el prefijo de su cadena: `H` historia, `C` capitan, `K` criador,
   `E` explorador, y dos dígitos (el regex de `unlocks` asume `[HCKE]\d\d`). **Los ids son para siempre**:
   las partidas guardan `missions.done`, `missions.active` y `missions.seenLines` por id. Renombrar
   uno es como borrarle la misión a todo el mundo.
2. **Agrégala a `missions[]`** en `content.json`. El orden del arreglo es el orden en que se revisan;
   ponla cerca de su cadena. Usa solo los campos de arriba.
3. **Elige el `trigger`** con la tabla. Si quieres que siga a otra: `mission:H22`.
4. **Elige el `goal.type`** de `GOAL_HANDLERS`. Si necesitas uno nuevo:
   - agrégalo a `GOAL_HANDLERS` (con `counters`/`flags` si aplica),
   - agrégale su `case` en `evalGoal()`,
   - asegúrate de que alguien emita el contador (`G.count('tu_clave')`) o el flag (`G.flag(...)`).
5. **Corre el verificador**: `node scripts/verify-missions.ts --all` desde `game/` (Node >= 22.18;
   o `npx tsx scripts/verify-missions.ts --all`). Sin `--all` solo revisa hasta el corte de M2.
6. **¿Debe hablar alguien?** Si sí, sigue con la receta de beats. Si la `line` basta, ya quedaste.

## Receta: agregar un beat o diálogo

### El formato de una línea

Una línea es `[hablante, texto]` (tipo `Line` en `game/src/ui/dialog.ts`). Así se ve un beat en `content.json`:

```json
{
  "id": "b06_patito",
  "time": "4:30",
  "trigger": "H05",
  "style": "NOIR OCEÁNICO → ANIME INFERNO",
  "title": "Ahora haz que valga la pena",
  "lines": [
    ["LUZTERNA", "¿Ves ese patito de hule? Es un barco. Es pirata. Y nos está viendo feo."],
    ["PATITO", "¡Cuac! ¡Esta es mi bahía! ¡Cuac!"],
    ["PATITO", "¡CUAAAAC!"]
  ]
}
```

(recortado). Importante: en tiempo de ejecución solo se leen `id` y `lines`. `time`, `trigger`, `style`
y `title` son notas de diseño; el disparador **real** es el gancho en `story.ts`.

Hablantes: los registrados en `SPEAKERS` (`game/src/ui/story/text.ts`): `LUZTERNA`, `CAPTION`, `SISTEMA`,
`PERIÓDICO`, `PATITO`, `BIGOTES`, `NOCTIS`, `GÁRGOLA`, `KRAKEN`, `TRONADOR`, `RAIJIN`, `HERALDO`,
`ARCANISTA`, `ESTRELLA`, `DISTRAXIA`, `NADIE`, `???`, `TUS GATOS`. Un nombre que no esté ahí funciona,
pero sale con retrato genérico (Canelo) y colores neutros; para un personaje recurrente, regístralo.

Trucos del texto:

- `["SISTEMA", "(El cielo se oscurece...)"]`: una acotación entre paréntesis no se muestra, se
  *actúa* (`isDirection()`); con `effect: 'darkSky'` oscurece el cielo.
- `{name}` es el nombre del jugador y `{g:o|a|e}` elige masculino/femenino/neutro (`gtxt()` en `game/src/ui/gender.ts`).
- Luzterna dice "grumete" hasta el Jefe 1 y "Capi" después; "Canelo" se cambia por el nombre que el
  jugador le puso (`personalize()` en `story.ts`). Escribe "grumete" y "Canelo" y el código se encarga.
- En tarjetas e intros de batalla, `{storm}`, `{magic}`, etc. se vuelven íconos de elemento.

### Dónde va el texto

- **En `content.json` → `story.beats`** si es un beat "oficial" del capítulo (id `bNN_slug`).
- **En `game/src/ui/story/script.ts`** como `export const MI_ESCENA: Line[] = [...]` si es una
  intro/outro o algo que vive pegado a código. Se usa con `custom`.

### El gancho (esto es lo que lo hace sonar)

En `game/src/app/story.ts`:

```ts
/** beats that open when a mission APPEARS */
const ON_NEW: Record<string, BeatRef[]> = {
  H05: [{ beat: 'b06_patito', part: 'a', lines: [0, 1, 2, 3] }],
  H11: [{ beat: 'raijin_intro', custom: RAIJIN_INTRO, onlyOn: 'map', delay: 1.5 }],
};
/** beats that play when a mission is COMPLETED */
const ON_DONE: Record<string, BeatRef[]> = {
  H05: [{ beat: 'b06_patito', part: 'b', lines: [4, 5] }],
  H11: [{ beat: 'raijin_outro', custom: RAIJIN_OUTRO }],
};
```

Campos de `BeatRef`: `beat` (id; también es la llave de "ya visto"), `lines` (índices del beat),
`part` (para partir un beat en varios momentos), `custom` (líneas de `script.ts`), `delay` (segundos
de calma antes), `onlyOn: 'map' | 'island' | 'region'`, `inRegion` (también puede sonar dentro de una
isla 3D de la Parte II), `effect: 'darkSky'`, `card` (número de zona: muestra la carta de zona antes), y
`special`: `'profile'`, `'marea'`, `'credits'`, `'reveal'` (con `species`: un gato se une después de las
líneas) o `'region'` (con `region`: viaja a esa isla 3D, como la cinemática de H31; su `beat` la guarda
para que pase una sola vez).

Además existe `WHEN`: beats por condición (llegada a zona, aviso de élite), revisados mientras estás
tranquilo en isla o mapa.

Pasos:

1. Escribe las líneas (JSON o `script.ts`).
2. Engánchalas en `ON_NEW[id]`, `ON_DONE[id]` o `WHEN`.
3. Si el beat ya dice lo mismo que la `line` de la misión, agrega el id a `COVERED` para que Luzterna
   no lo repita como tip.
4. Nunca interrumpe una batalla: la cola espera a que estés en isla o mapa y sin paneles encima.

**Los ids de beat también son para siempre.** Se guardan en `G.s.beatsSeen` como `beat` o
`beat#part`; si renombras uno, las partidas viejas lo vuelven a ver. Y la meta `watch` lee esos ids
(H22 espera `b25_creditos`).

### El prólogo y los créditos

`PrologueScene.ts` es una escena hecha a mano. Del beat `b00_prologo` solo toma la primera línea de
`CAPTION`, `LUZTERNA` y `PERIÓDICO` (`beatLine()`) y la última `CAPTION`; cambiar esas líneas en el JSON
cambia el texto, pero agregar líneas nuevas no agrega momentos. Los créditos (`credits.ts`) arman sus
propias estadísticas en código; las líneas de `b25_creditos` en el JSON son guion de referencia.

## Receta: agregar una batalla de historia

Es la forma más sana de meter una pelea nueva al capítulo sin tocar el mapa.

1. **Defínela en `STORY_BATTLES`** (`game/src/state/sys/storyBattles.ts`):

```ts
event_raijin: {
  id: 'event_raijin',
  mission: 'H11',
  zone: 3,
  stage: 6,                 // de qué etapa toma botín y barcos
  title: 'EL HEREDERO DEL TRUENO',
  enemy: 'La Torre del Trueno',
  captain: 'Raijin',
  line: '¿Tú eres el que quiere heredar el trueno? Primero sobrevive a él.',
  archetype: 'pararrayos',
  enemyCats: ['m_raijin', 'c_voltio', 'c_nimbo'],
  powerMul: 0.95,           // poder enemigo = tu poder × esto (la historia nunca te amuralla)
  rules: { rod: [1] },
  intro: ['PARARRAYOS: se traga tus tiros de {storm} rayo mientras su mástil siga vivo', '...'],
  color: 0xffd400,
  reward: { cat: 'm_raijin', gems: 2 },
},
```

   Opcionales: `hpMulX`, `displayMulX`, `blueprint` (de `STORY_SHIPS`), y `grade: 'damage'` para
   peleas que se califican por daño y no por hundir (como el Barco del Vacío).
2. **Crea la misión** con `goal: { "type": "win_battle", "battle": "<id>" }` (o
   `{ "type": "damage_pct", "battle": "<id>", "pct": 0.15 }` si es por daño).
3. **No tienes que programar el botón**: tocar la misión fijada en el HUD del mapa o de la isla llama
   `startStoryBattle()` si `goal.battle` está en `STORY_BATTLES` (`MapScene.ts` e `IslandScene.ts`).
4. **Premio**: la primera victoria pone los flags `won_<id>` y `event_done_<id>`. `reward.cat` dispara
   `revealCat()`; `reward.element` empuja el elemento y dispara `revealElement()` (agrega el texto en
   `CAPTION` de `storyFlow.ts` si es un elemento nuevo).
5. **Intro y outro**: líneas en `script.ts` + `ON_NEW`/`ON_DONE` de la misión.

Nota: `content.json` → `bosses[]` tiene fichas con `type` `story`, `event_boss` y `secret` (ej.
`event_raijin`), pero el código solo usa las de tipo `zone_boss`/`final_boss`. La definición que manda
para una batalla de historia es la de `STORY_BATTLES`.

## Receta: agregar (o tocar) una zona de campaña

Aviso honesto: hoy el mapa está construido para **6 zonas de 9 etapas** (`stages_per_zone: 9` en
`balance.json`; la etapa `Z-9` es el jefe). Retocar una zona existente es contenido; agregar una
séptima es trabajo de código. Abre un issue antes. Lo que toca una zona:

| Qué | Dónde |
|---|---|
| Etapas (`stage`, `name`, `type: normal/elite/boss`, `archetype`, `power`, `enemyCats`...) y encargos | `content.json` → `enemies[]` (un objeto por zona) |
| Jefe: lo que se ve (`captainArt`, `rule`, `weakPoint`, `phases`, `enrageTurn`, `lines`) | `content.json` → `bosses[]` (`type: "zone_boss"`) |
| Jefe: lo que da (`kl`, `gems`, `unlocks` como `element:storm`, `cat:l_tronador`, `zone:3`) | `game/src/data/balance.json` → `bosses[]` (lo lee `bossRewards()`) |
| Élite de la zona (`name`, `ship`, `rule`, `line`) | `content.json` → `elites[]` y `eliteRule`/`eliteLine` en la etapa |
| Carta de zona, intro, aviso de élite, presentación/despedida del jefe, portada del Diario | `script.ts` → `ZONE_CARDS`, `ZONE_INTRO`, `ELITE_WARN`, `BOSS_INTRO`, `BOSS_OUTRO`, `BOSS_NEWS` |
| Cuándo suenan | `story.ts` → `WHEN` (`zN_intro` con `card: N`, `zN_elite`) y `ON_NEW`/`ON_DONE` de la H del jefe |
| Posición en la carta náutica | `MapScene.ts` → `ZONE_BOX` y `ROMAN` (también hay un `ROMAN` en `zoneCard.ts`) |
| Tarjeta del jefe antes de pelear (zonas 1–3) | `campaign.ts` → `BOSS_INTRO` local (otra forma, `{ lines, weak }`; no confundir con el de `script.ts`) |

Patrón de la cadena H por jefe: una misión `trigger: "stage_cleared:Z-8"` con
`goal: { type: "defeat_boss", boss: Z }`, y la siguiente con `trigger: "boss:Z"`.

## Partidas viejas: ¿cómo le llega tu historia a alguien que ya pasó por ahí?

Lee [../ACTUALIZACIONES.md](../ACTUALIZACIONES.md) completo; lo importante para guionistas:

- **Las misiones se re-evalúan solas.** Al cargar, `checkMissions()` activa toda misión nueva cuyo
  `trigger` ya se cumple. Si su meta es de estado y ya está cumplida, se completa ahí mismo (con sus
  recompensas y su `ON_DONE`). Si es de contador, empieza en cero.
- **`catchUp()` en `story.ts`** pone en cola el `ON_NEW` de las misiones que ya están activas al
  arrancar, así que la intro sí se ve.
- **Si tu historia regala algo** (un gato, un elemento) en un punto que el jugador ya pasó, y no hay
  misión que lo entregue, usa un parche: `registerPatch({ id, why, run })` en
  `game/src/state/patches.ts` o en el módulo del sistema. Dar, reparar, reembolsar; **nunca quitar**.
  (Hay un par de casos viejos resueltos a mano en `catchUp()`, como `merlina_late`; para cosas nuevas,
  prefiere el parche.)
- **No cambies el `trigger` de una misión ya publicada esperando que corra de nuevo**: las que están en
  `done` no se vuelven a evaluar.
- **Cuéntale al jugador**: las notas van en `game/src/data/updates.ts` (entrada nueva arriba, id
  `YYYY-MM-DD-slug`). Coordínalo con quien prepare la versión; no lo edites por tu cuenta.

## Cómo probar

Desde `game/`: `npm run dev` y abre `http://127.0.0.1:5173/`. Rutas de desarrollo (solo en dev,
ver `game/src/main.ts`):

| Ruta | Qué hace |
|---|---|
| `?save=<fixture>` | Copia `game/test-saves/<fixture>.json` sobre tu partida (`nolc-save-v1`) y sigue. **Pisa tu partida de pruebas.** |
| `?stage=Z-S` | Carga la partida y entra directo a esa batalla de campaña (ej. `?stage=2-9`) |
| `?scene=island` / `?scene=map` | Entra directo a la isla o al mapa; con `&new=1` empieza partida nueva |
| `?speed=4` | La economía corre 4 veces más rápido (las batallas no) |
| `?scene=dev` | LABORATORIO: la página que lista todos los labs (`scenes/DevLab.ts`) |

Fixtures que existen hoy: `casino`, `isla-m2`, `m2-postboss2`, `m2-preboss2`, `m2-preboss3`,
`m2-zone2`, `post-boss1`, `post-boss2`, `post-boss3`, `pre-boss3`, `zone2-par`. Se combinan:
`?save=post-boss3&scene=map`.

En la consola del navegador:

- `__story.state()`: dónde estás, si la cola está ocupada y qué beats esperan.
- `__story.beat('b06_patito')`: encola un beat ignorando si ya lo viste.
- `__story.speed(0.2)`: todo en cámara lenta, para revisar animaciones.

Prueba siempre las dos rutas: **partida nueva** (`?scene=island&new=1`, o borrando la partida) y
**partida vieja** que ya pasó tu punto (`?save=post-boss3`, etc.). La segunda es la que más se rompe.

## Tono (léelo antes de escribir una sola línea)

Luzterna es sarcástica, protectora, rompe la cuarta pared y dice groserías ligeras: español latino
sin filtro. Si usas una grosería nueva, agrégale su versión suave en `SOFT` (`game/src/ui/story/text.ts`)
para que el modo "Familiar" la filtre. Límites que no se negocian: **nada de chistes sobre etnia,
religión o el Holocausto**. Burlarse del pato, de la muerte de Luzterna o de los gatos que tiran vasos:
adelante.

## Checklist

- [ ] `npm run build` pasa (incluye el typecheck).
- [ ] `node scripts/verify-missions.ts --all` no se queja de tu goal.
- [ ] Probé con una partida nueva y con una vieja vía `?save=<fixture>` que ya había pasado ese punto.
- [ ] Los ids de misión y de beat son nuevos, y nunca renombré ni reutilicé uno existente (son para siempre).
- [ ] Cada `goal.type` nuevo está en `GOAL_HANDLERS` y en `evalGoal()`, y alguien emite su contador/flag.
- [ ] Cada flag de `unlocks` lo lee algún sistema (si no, es decoración).
- [ ] Si el beat repite la `line` de la misión, el id está en `COVERED`.
- [ ] Hablantes nuevos registrados en `SPEAKERS`; groserías nuevas con versión suave en `SOFT`.
- [ ] Si una partida vieja necesita recibir algo, hay parche (y no quita nada).
- [ ] Hay entrada de NOVEDADES en `game/src/data/updates.ts`, coordinada con quien saca la versión.

Más reglas generales del proyecto en [../../CONTRIBUTING.md](../../CONTRIBUTING.md). Y gracias: cada
línea nueva es una excusa más para que Luzterna se queje de estar muerta.
