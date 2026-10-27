# 03 · Plan de implementación por etapas

> Agente **MECÁNICAS**, ronda 4, oleada 1 (2026-10-26). Es un plan: **no se tocó código de juego, datos ni guardado**. Sin commits.
> ⚠️ Contiene spoilers de la Parte III.
> En esta carpeta, `01` y `02` son `01-auditoria.md` y `02-loop.md`; los números sueltos (`05`, `06`, `11`, `14`…) son los documentos de `docs/part-iii/`.
> Cada etapa dice: archivos, esquema de datos, pruebas, migración y riesgos. La marca **[YA]** significa «se puede empezar en la próxima oleada sin esperar historia ni arte».

---

## 0. Orden y dependencias

```
Etapa 0  Cimientos (H99, ids, esquema de nodos, precio pico)            [YA]  ─┐
Etapa 1  La Borracha completa y con dientes                              [YA]  ─┼─► se puede jugar el Acto I entero
         (dificultad, B-6…B-9, gancho de película, Carta multi-caja,           │
          victoria con sello, desvío, La Ronda)                                │
Etapa 2  MULTIDIMENSIONAL detrás de bandera (datos, reglas, prueba)      [YA]  ─┘
Etapa 3  Superhéroes (Onomatopeya, Patrulla, Murciégato/Noche)           ◄── historia del Acto II + arte
Etapa 4  Anime (Poder, llave de torneo, Entrenamiento)                    ◄── nodos no lineales (Etapa 0)
Etapa 5  Libros (Capítulos, estante, Finales perdidos)
Etapa 6  POP (Ritmo, La Gira)
Etapa 7  Final + post-juego (oscuridad, Recordar, Volver a ver completo)
```

**Reglas para todas las etapas** (las de siempre, `11` §0 y `14` §4):
- Las partidas nunca se rompen: campos nuevos opcionales, normalizador que **nunca resta**, un id es para siempre, la guarda de `playMs` no se toca.
- Toda regla de combate es **dato** en `StageRules` y la estimación juega la misma batalla (prueba de paridad llamada por llamada, como `mareo.test.ts`).
- Archivos compartidos (`main.ts`, `core/scenes.ts`, `data/content.ts`, `battle/sim.ts`): ediciones de pocas líneas, releyendo antes de editar.
- Verde antes de entregar: `npm run typecheck`, `npm test`, `npx tsx scripts/verify-missions.ts --all` y, desde la Etapa 1, `NOLC_SIM=1 NOLC_SIM_TARGETS=1 npx vitest run tests/p3Balance.sim.test.ts`.

---

## 1. Etapa 0 · Cimientos [YA]

### 1.1 El techo H99

| | |
|---|---|
| **Archivos** | `state/sys/missions.ts:280` y `scripts/verify-missions.ts:65`: `/^[HCKE]\d\d$/` → `/^[HCKE]\d{2,3}$/`. Cosmético: `verify-missions.ts:131` `pad(r.id, 5)` |
| **Prueba nueva** | `tests/missionIds.test.ts`: una misión sintética `H100` con `unlocks: ['H101', 'flag_x']` → `H101` **no** se guarda como flag y `flag_x` sí; `missionNum('H100') === 100`; `isPart2Mission('H100') === false`; `isPart2Beat('b100_x') === false`; el orden de la Bitácora (`gaterasWorld.ts:173`) es numérico |
| **Migración** | Ninguna: los ids de misión son texto en la partida |
| **Política** | **Una misión = un capítulo.** Las presentaciones van en las batallas, nunca como misiones nuevas. Con eso H66–H96 alcanza (NARRATIVA deja H97–H99 de reserva) y la Parte IV empieza en H100 sin riesgo |
| **Riesgo** | Bajo. Una partida con basura `H1xx` en `unlocks`: no existe (los `unlocks` son datos del juego, no de la partida) |

### 1.2 Ids de batalla y de nodo de más de un dígito

| | |
|---|---|
| **Archivos** | `state/sys/gateras.ts:82` `parseBattleId`: `/^(p3d_[a-z]+)_(\d)$/` → `/^(p3d_[a-z]+)_([a-z0-9]+)$/`, devolviendo `node: string` (y `n` cuando es numérico). `app/cajasFlow.ts:90`: el mismo patrón para el IR |
| **Convención** | Etapas `p3d_<dim>_<n>` (existe), desvío `p3d_<dim>_d<k>`, actividad `p3d_<dim>_a<k>`, encuentro `p3d_<dim>_e<id>`. La bandera de victoria sigue siendo `won_<id>` |
| **Prueba** | En `gateras.test.ts`: `parseBattleId('p3d_borracha_d1')`, `…_10`, `…_a2`; el IR de `cajasGoal` acepta los cuatro |
| **Riesgo** | Bajo. Los planes de música (`data/music/battles.json`) se buscan por id: hay que agregar los nuevos |

### 1.3 El esquema de nodos (aditivo)

**Hoy** (`gateras.ts:87-93`): `stages[dim] = { cleared: number, wins: Record<string, number> }`, lineal y con tope 9.

**Propuesta** (sin subir `v`, sin tocar `cleared`):

```ts
// ext.gateras (todos opcionales; una partida v1 se lee igual)
interface GaterasExt {
  v: 1;
  open; huellas; stages; seen;              // como hoy
  /** victorias por nodo de cualquier forma (desvíos, llaves, estantes): id de nodo → victorias */
  nodes?: Partial<Record<DimId, Record<string, number>>>;
  /** el ingreso más alto visto al abrir la Carta (precio de Maneki, 02 §2.1) */
  peak?: number;
  /** actividades: semilla, ronda y resultados (La Ronda, Patrulla…) */
  acts?: Partial<Record<DimId, { seed: number; round: number; done: string[] }>>;
  /** encuentros: id → 'visto' | 'ganado' */
  enc?: Record<string, 'visto' | 'ganado'>;
  /** fotos del viaje (élites y jefes ganados): ids en orden — las usa la cabina de H89 y SADIE */
  photos?: string[];
}
```

**Datos** (`regiones.json`): cada dimensión declara su forma y sus nodos. La Borracha sigue con `stages` como hoy (forma `line`); las demás usan `nodes`:

```jsonc
"shape": "line" | "bracket" | "shelf" | "tour",
"nodes": [
  { "id": "1", "kind": "stage", "requires": [] },
  { "id": "d1", "kind": "desvio", "requires": ["3"], "revealedBy": "flag:ronda_1" },
  { "id": "5", "kind": "elite", "requires": ["4"] },
  { "id": "a1", "kind": "actividad", "requires": ["mission:H70"] }
]
```

| | |
|---|---|
| **Normalizador** | `nodes` solo **suma** (victorias ≥ 0, claves conocidas o no se conservan). **La regla «una victoria de la etapa n prueba 1…n» (`gateras.ts:117`) se aplica solo a dimensiones `line`**. El tope 9 de `cleared` se queda (es de la línea); los nodos no tienen tope |
| **Lectura** | `nodeState(dim, id)`: `cleared` si tiene victorias; `open` si sus `requires` se cumplen; si no, `locked`. Para `line`, `stageState` delega en esto y da lo mismo que hoy (prueba de equivalencia sobre todas las combinaciones de `cleared` 0–9) |
| **Prueba** | `gaterasNodes.test.ts`: (1) una partida v1 real carga idéntica; (2) en `shelf`, ganar el nodo 7 primero **no** marca 1–6 al recargar; (3) idempotente; (4) una sección `nodes` rota se aparta sin borrar el resto |
| **Migración** | Ninguna (campo opcional) |
| **Riesgo** | Medio: es estado de partida. Mitigación: la equivalencia `line` probada antes de usar `nodes` en cualquier dimensión |

### 1.4 Precio con el ingreso pico

`gateraPrice` (`gateras.ts:210-212`) cobra `max(ingreso actual, ext.gateras.peak)`. `peak` se actualiza al abrir la Carta y nunca baja. Prueba: vaciar hábitats no baja el precio. Riesgo: ninguno para quien juega normal.

### 1.5 Prueba de finitud de rarezas (preparación de la Etapa 2)

`tests/rarityFinite.test.ts`: recorre `BAL.rarities.order` (y luego las nuevas) por `catPower`, `catGoldPerSec`, `feedCost`, `starOrbs`, `duplicateOrbs`, `discoveryGems` y exige números finitos > 0. Hoy pasa; protege la Etapa 2.

---

## 2. Etapa 1 · La Borracha completa y con dientes [YA]

**Meta:** el Acto I mecánico jugable de punta a punta con suplentes de arte: B-1…B-9, desvío, La Ronda, victoria con sello y el gancho de película antes de cada batalla. **No espera a NARRATIVA ni a ARTE**: los textos nuevos van como borrador marcado y los capitanes nuevos usan especies existentes (como se hizo con Oficial Dona).

### 2.1 Política de dificultad de la Carta

| | |
|---|---|
| **Qué** | Las cinco piezas medidas en `02` §6.3: (1) bandas `p3n/p3e/p3j` (Poder ×1.55 / ×1.6 / ×1.6 sobre el `powerMul` de la etapa, élite y jefe con la banda `jefe`); (2) **espejo** k=1 (tope ×2.2); (3) **poder de la caja** en las élites: un `cataclysm` de la dimensión (potencia 0.6, cada 3 turnos, con sello), que pega según el casco; (4) **piso por flota potencial** en vez del 3 000 fijo; (5) **`CARTA_SHIP_WEIGHT`** (Bastión 1, Bajel 0.6, Merodeador 0.5, Gorrión 0.35, a recalibrar) |
| **Archivos** | `state/sys/gaterasBattles.ts` (`gateraPower`): `EP = max(pisoPotencial, Poder(tripulación) × powerMul × banda) × CARTA_SHIP_WEIGHT[barco]`. `pisoPotencial = 0.8 × Poder(barco activo, sus mejores N gatos)` (lo que daría `autoCrew`): impide la trampa de la tripulación floja en el Bastión **sin** amurallar a quien navega un barco chico. Pasar `cataclysm` desde los datos (hoy solo pasa `mareo`: `gaterasBattles.ts:64`). `state/sys/campaign.ts › buildSiege`: perilla `mirror?: number` (el ataque del plantel enemigo × (calidad de tu tripulación / la suya)^k, su vida × la raíz, tope ×2.2). `data/gateras/regiones.json`: `band` y `cata` por etapa. `state/sys/estimate.ts`: el consejo «Con el Bastión: 82 %» cuando otro barco tuyo simula 15+ puntos mejor (2 simulaciones por barco, en ocio) |
| **Pruebas** | `storyScale.test.ts` como modelo: la banda multiplica lo que dice; el piso potencial no depende de la tripulación elegida; el espejo no cambia ninguna batalla de la Parte II (no la usa); `p3Balance.sim.test.ts` con `NOLC_SIM_TARGETS=1` en verde **con el Bastión y el Bajel** |
| **Migración** | Ninguna |
| **Riesgo** | Medio: cambia la estimación de las 5 etapas ya hechas. Es lo que se quiere, pero el dueño tiene que jugarlo. El espejo es una perilla nueva en `buildSiege`: medir que la Parte II quede idéntica (prueba de spec byte a byte con y sin el campo) |

### 2.2 B-6…B-9 y El Cadenero

| | |
|---|---|
| **Datos** | `regiones.json`: B-6…B-9 con los valores de `02` §3.1 (`playable: true`, plantel, `mareo`, `band`, `hpMulX`, `teach`, `film`). El Cadenero con `fases` (fase 2 al 50 %: «cierra la puerta»: `env.calm` + más botellas) |
| **Código** | Casi nada: `buildGateraBattle` ya arma cualquier etapa con `crew`. Hay que pasar `fases` desde los datos (hoy solo pasa `mareo`: `gaterasBattles.ts:64`) |
| **Misiones** | H70–H73 las escribe NARRATIVA; mientras tanto, la ruta se juega sin misión (las huellas y las banderas `won_*` ya funcionan) |
| **Pruebas** | `gateras.test.ts`: B-6…B-9 jugables; `huellasMax = 34`; con B-9 ganada la segunda gatera ya se puede pagar (huellas ≥ 25) |
| **Riesgo** | Bajo |

### 2.3 El gancho de película antes de cada batalla

| | |
|---|---|
| **Qué** | `startGateraBattle` (`cajasFlow.ts:38`) llama a `stageIntro(dim, n)` antes de `scenes.go(new BattleScene(spec))` |
| **Comportamiento** | 1) arma el spec **antes** de la película y lanza la estimación; 2) si la etapa tiene `film` y el motor de CINE lo tiene registrado → `playFilm(id, { data })`; si no → la **tarjeta animada** (al principio, la tarjeta de intro que ya existe en `spec.intro`); 3) primera vez: sin SALTAR; después: SALTAR; 4) reintento: tarjeta de regla de 3 s |
| **Datos** | `regiones.json › stages[].film?: string` (ej. `fb_p3d_borracha_5`) |
| **Vistas** | La película vista se marca en `G.s.beatsSeen` con la clave `f:<id>` (sin número `b`, así que ninguna regla de la Parte II la toca: `rupturasReset.ts:75-79`). «Volver a ver» lista las películas registradas cuya clave está vista. **A confirmar con CINE** en `cine-v2/02-api.md` (§6) |
| **Demostración de la regla** | Módulo puro nuevo `battle/demo.ts`: `ruleDemo(ruleId, cfg)` → trayectorias calculadas con `Battle.integrate` sobre un spec mínimo fijo (el mismo tiro con y sin la regla). Lo dibuja la película; lo que se ve es lo que pasa |
| **Pruebas** | `stageIntro.test.ts`: sin `film` no rompe; la primera vez no se salta; el reintento no repite; `ruleDemo` es determinista; el spec que se juega es el mismo que se estimó durante la película |
| **Riesgo** | Bajo-medio: depende de la API de CINE. Mitigación: el gancho funciona sin película (tarjeta) desde el día uno |

### 2.4 La Carta para varias cajas

| | |
|---|---|
| **Archivos** | `scenes/GaterasMapScene.ts`: quitar `const B` (línea 63); `selected: { dim, node }`; la clave de estimación `${dim}_${node}` (línea 1470); `startGateraBattle(dim, node)` (línea 1297); un registro de **aspectos** por dimensión (`tv` hoy; `comic`, `tesoro`, `estante`, `poster` después) en vez del `if (d.look === 'tv')` (línea 590). `state/sys/gaterasBattles.ts:70,76-77`: etiqueta, paleta y estilo salen de `dims[].palette` / `dims[].battleStyle`. `gateras.ts:238`: `feature_p3_gatera_<dim>` para toda dimensión (conservando el de la Borracha) |
| **Rendimiento** | Cada región se construye al acercarse y hornea su miniatura; los filtros pesados (CRT, Ben-Day) solo en la región enfocada |
| **Pruebas** | `p3Carta.test.ts`: con dos dimensiones de prueba en datos, la escena arma ambas sin `B`; ninguna referencia literal a `p3d_borracha` fuera de datos (búsqueda en el código) |
| **Riesgo** | Medio: es la escena más grande de la Parte III. Hacerla antes de meter contenido nuevo |

### 2.5 La pantalla de victoria con sello

`GaterasMapScene` ya recibe `cajasMemo.loot` (`cajasFlow.ts:22-28`). Agregar los tres golpes de `02` §5.3 (sello, huellas que vuelan, lo nuevo). Datos: `stages[].stamp` (id del sello). Sin cambios de guardado (el sello se deriva de las victorias).

### 2.6 Desvío «Trastienda» y La Ronda

| | |
|---|---|
| **Depende de** | 1.2 (ids) y 1.3 (nodos) |
| **Desvío** | 3 nodos `d1…d3` que salen de B-3, revelados por la primera Ronda. Premio: el rescate de Don Bombín (suplente hasta que haya pintura) |
| **La Ronda** | 4 locales con condiciones de bar sembradas por `ext.gateras.acts.p3d_borracha.seed`. Condiciones que **ya** se pueden expresar: «sin derramar» (ganar sin perder un módulo de cubierta → nuevo `grade: 'intact'` en el resultado, chico), «la última y nos vamos» (ganar antes del turno 4 → `turnLimit` nuevo en `StageRules`: si se llega al turno N sin ganar, se pierde; ~15 líneas en `sim.ts` + chip) |
| **Pruebas** | Las condiciones las juega la estimación (paridad); la semilla da la misma Ronda al recargar; repetir La Ronda cambia la combinación |
| **Riesgo** | Medio (dos perillas nuevas de simulación, chicas) |

### 2.7 Prueba de planteles

`tests/p3Rosters.test.ts`: recorre `regiones.json` y falla si una etapa normal de la primera mitad trae un gato de control (Sonido, Tiempo, Sombra, Vacío) sin estar marcada `teaches`, si una etapa con donas o botellas trae 2+ de Sonido, o si cualquier etapa trae 3+ de Sonido (`02` §6.4).

---

## 3. Etapa 2 · MULTIDIMENSIONAL detrás de bandera [YA para la plomería]

**Meta:** que la rareza exista en datos, economía, interfaz y batalla, **apagada** en producción hasta que el dueño apruebe arte y prueba. Sin pinturas: los gatos `x_` de prueba usan suplentes.

| Paso | Archivos | Detalle |
|---|---|---|
| 2.1 Rareza | `state/econ.ts:7` (`RarityId`), `data/balance.json › rarities` (8 tablas + `kingdom.xp_rewards_pct_of_bar.hatch`), `state/sys/resonance.ts:12` (`RANK`), `fx/sequences/catReveal.ts:67`, `ui/theme.ts:45-54`, `state/ext/catQuery.ts:57-69`, `state/ext/collection.ts:12-21`, `panels/collection/*`, `data/glossary.ts` | Valores de `02` §7.1. Todo `Record<RarityId, …>` exhaustivo para que el compilador obligue |
| 2.2 Una sola `RARITY_H` | `art/rarityHeight.ts` nuevo; reemplaza las 6 copias (`olvidada.ts:101`, `paginas.ts:89`, `suenos/residents.ts:21`, `cielo/cats.ts:29`, `RegionScene.ts:46`, `rupturas/bridge.ts:73`) | **Ojo:** la copia de `paginas.ts` no tiene mítico+ (hoy caen a 2.5). Unificar cambia esa altura: decidirlo a propósito |
| 2.3 Orden de categoría | `ui/catFilterBar.ts`, `CrewSelect.ts:85` | MULTIDIMENSIONAL al final del filtro sin tocar `rarities.order` |
| 2.4 Datos de especies | `data/gateras/especies.json` + `CatDef.origin/originRule/cross` | Fusionado con `mergeContent` solo si `P3_MULTIDIM` está encendida |
| 2.5 Reglas de origen | `battle/origin/index.ts` (registro) + un módulo por regla; `StageRules.origin` | La primera sin código de simulación nuevo: **Supermichi = +1 burbuja al empezar** (`SideSetup.bubble` ya existe). Cruce = `dmgMul` al armar el spec. Ventaja de casa = `turn % 4` |
| 2.6 Protagonista | `G.s.ship.star?: Record<shipId, uid>` (opcional) + `ship.ts:35-45` + `CrewSelect.ts` | Solo si la prueba de `02` §7.3 lo pide |
| 2.7 Exclusiones | `resonance.ts:51`, `casino.ts:834`, `casino/eterno.ts`, `gacha.ts` | Un Multidimensional nunca sale de ahí; prueba que recorre los pozos |
| 2.8 Prueba de parejas | `tests/p3Multidim.sim.test.ts` (con `NOLC_SIM=1`) | Plan de `02` §7.3: etapas sonda calibradas, 128 semillas emparejadas, umbral 12 puntos |

**Migración:** ninguna (rareza nueva = datos; el campo `star` es opcional). **Riesgo:** alto en número de archivos (~20). Mitigación: compilador exhaustivo + prueba de finitud (1.5) + bandera apagada.

---

## 4. Etapas 3–7 · Una dimensión por etapa (con historia y arte)

| Etapa | Regla nueva | Código de simulación | Forma de la Carta | Actividad | Depende de |
|---|---|---|---|---|---|
| 3 Superhéroes | **Onomatopeya** | Módulo `battle/onomatopeya.ts` (~150 líneas): obstáculos temporales con la geometría y el choque de los islotes de `cielo.ts`, `ttl` 2 turnos, IA que apunta por encima. Vista aparte | `line` (viñetas) | Patrulla (3 llamados, objetivos distintos: `grade: 'damage'` ya existe) | Etapas 0–2; arte de Batcat/Spidercat; regla Noche (la oscuridad del Final) |
| 4 Anime | **Poder** | `battle/poder.ts` (~80 líneas): +25 % al primer tiro bajo 50 %, una vez por gato, los dos lados | `bracket` | Entrenamiento (3 arcos cortos) | Nodos (1.3) |
| 5 Libros | **Capítulos** | **Ninguno**: `fases` con `at:{turn}` + `wetAll` / `calm` / `regrow` | `shelf` | Finales perdidos (elección guardada en `ext.gateras.acts`) | Nodos (1.3) |
| 6 POP | **Ritmo** | `sincro.ts`: combos por elemento (datos en `SINCRO_COMBOS`) + **la estimación asume la mitad de los tiros en el beat** con fase sembrada | `tour` | La Gira (lista de canciones) | Plan de música por batalla |
| 7 Final | **Oscuridad** | La regla Noche de la Etapa 3, reusada | — | — | Todo lo anterior |

Cada etapa trae: datos en `regiones.json`, sus pruebas de regla (determinista + paridad + chips honestos como `mareoLines`), su fila en `p3Balance.sim.test.ts` y sus planteles pasando `p3Rosters.test.ts`.

---

## 5. Qué puede empezar ya en la oleada 2 (sin esperar historia ni arte)

| # | Trabajo | Etapa | Tamaño | Quién (sugerido) |
|---|---|---|---|---|
| 1 | H99: dos regex + `missionIds.test.ts` | 0.1 | 1 h | Sistemas |
| 2 | Ids de nodo de más de un dígito | 0.2 | 1 h | Sistemas |
| 3 | Esquema de nodos aditivo + equivalencia `line` | 0.3 | 1 día | Sistemas (con QA de guardado) |
| 4 | Precio con ingreso pico | 0.4 | 1 h | Sistemas |
| 5 | Política de dificultad (bandas, espejo, poder de la caja, piso potencial, factor por barco) + calibración con el arnés en 2 barcos | 1.1 | 1–2 días | Mecánicas |
| 6 | B-6…B-9 + El Cadenero (suplentes) | 1.2 | 1 día | Mecánicas |
| 7 | Gancho de película antes de cada batalla (con tarjeta de respaldo) + `battle/demo.ts` | 1.3 | 1–2 días | Mecánicas + CINE |
| 8 | Carta multi-caja (sin `B`) | 1.4 | 1–2 días | Carta |
| 9 | Victoria con sello | 1.5 | medio día | Carta |
| 10 | `p3Rosters.test.ts` | 1.7 | 1 h | Mecánicas |
| 11 | Plomería MULTIDIMENSIONAL detrás de bandera + prueba de finitud | 2.1–2.5, 2.7 | 2–3 días | Sistemas |
| 12 | Desvío + La Ronda (`turnLimit`, `grade: 'intact'`) | 1.6 | 2 días | Mecánicas (después de 3) |

**No empieza todavía:** las reglas Onomatopeya/Poder/Ritmo (esperan su acto), las misiones H70+ (NARRATIVA), las pinturas (ARTE) y las películas de canción (CINE + MÚSICA).

---

## 6. Contrato propuesto con CINE (`game/src/film/`)

CINE todavía no publicó `cine-v2/02-api.md` (su estado: «una película es un Momento en modo película», `playFilm`, `?film=demo`). Lo que el loop necesita del motor, para acordar:

| Necesidad | Forma propuesta |
|---|---|
| Registrar | `registerFilm({ id, kind: 'brief' \| 'song' \| 'chapter' \| 'scene', replayTitle, skip: 'never' \| 'afterFirst' \| 'always' })` |
| Reproducir | `playFilm(id, { replay?, data? }): Promise<'done' \| 'skipped' \| 'interrupted'>` |
| Saber si existe | `hasFilm(id): boolean` (el gancho cae en la tarjeta si no) |
| Precargar | `preloadFilm(id)` mientras la tarjeta de etapa está abierta |
| **Plantilla de presentación** | Una película `brief` **parametrizada por datos**: `{ dim, title, rival: { slug, name, line }, rule: { id, cfg, demo }, stakes, estimate: () => Estimate \| null }`. Así **toda** etapa tiene presentación sin escribir una película a mano; las de historia se sobreescriben con una hecha a mano |
| La estimación al final | La película consulta `estimate()` en su último plano y muestra el porcentaje con el sello de la tarjeta |
| Vistas | Marcar `G.s.beatsSeen` con `f:<id>` (o el registro que CINE prefiera, siempre fuera del rango `b31–b65`) |
| Accesibilidad | «Reducir movimiento» y «Reducir destellos» del motor; la plantilla no agrega destellos propios |

---

## 7. Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| Endurecer la Carta molesta a quien ya jugó la porción | Es una versión no publicada; el dueño la juega antes. La estimación honesta avisa |
| El piso potencial cambia la dificultad del Bastión con tripulación chica | Es el objetivo (evitar la trampa); el arnés lo mide (`solo1`) |
| Los Multidimensionales tocan ~20 archivos | Bandera apagada, compilador exhaustivo, prueba de finitud |
| El esquema de nodos corrompe el avance | Equivalencia `line` probada antes de usarlo; normalizador que solo suma |
| CINE se atrasa | El gancho funciona con la tarjeta desde el día uno |
| Las reglas nuevas cuestan rendimiento en la estimación | Ganchos chicos, estado en `WeakMap`, medir 40 simulaciones por tarjeta < 3 s en el worker |
