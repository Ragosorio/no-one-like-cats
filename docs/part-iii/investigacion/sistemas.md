# Parte III · Investigación de SISTEMAS (etapa de diseño)

Agente SISTEMAS · 2026-10-13. Solo describe lo que ya existe, con números y fuentes `archivo:línea`; la Parte III no se diseña aquí. Las rutas son relativas a la raíz del repo. No se tocó `game/` ni `docs/part-ii/`.

**Cómo se midió.** Los números de economía salen de correr **el código real del juego** sobre partidas. Para eso se usaron sondas vitest de solo lectura que viven fuera del repo (`<scratchpad>/probe/probe*.test.ts`) e importan `game/src/state` en memoria. Se midieron tres fuentes:

- las fixtures de `game/test-saves/`;
- la partida exportada del dueño (`~/Desktop/NoOneLikeCats-2026-10-10.nocat`, fuera del repo; solo se citan cifras agregadas);
- perfiles sintéticos armados sobre `rupturas-o4.json`.

---

## 0. Resumen en una pantalla

- **Mapa de la Parte I.** Hay 6 zonas con 9 etapas cada una (54 en total). La etapa 5 es élite y la 9 es jefe. Las etapas se abren en línea y una zona se abre al vencer al jefe anterior. Las zonas bloqueadas se ven con niebla «???».
  - No hay estrellas por etapa. Lo único que se califica es la victoria **perfecta** (0 gatos perdidos), que da ×1.5 de oro y 5 % de probabilidad de gema.
  - Se puede repetir cualquier etapa ganada: paga ×0.7 de oro. Además existen el Asalto Rápido (con ventaja ×2.5) y el Simulacro.
  - Todo está en `game/src/scenes/MapScene.ts` + `game/src/state/sys/campaign.ts`, con los datos en `content.json › enemies` y `balance.json › combat`.
- **Cómo creció la carta en la Parte II.** Se le fueron pegando **hojas** (MAR DE LAS RUPTURAS, EL CIELO, LO DE ARRIBA, LAS FRONTERAS). Cada hoja tiene **islas 3D** a las que se viaja con `goRegion`, no nodos. Cada isla aparece con un flag `region:<id>`.
  - **La Parte III no tiene islas 3D. Por eso la «hoja de nodos» con etapas es un tipo de hoja que todavía no existe.**
- **Ingresos medidos** (oro/s sin Momentum):

| Perfil | Oro/s | Por hora | Saldo |
|---|---|---|---|
| (a) Partida nueva que acaba de terminar H65 jugando normal | 15–20 M/s (rango 5–50 M/s) | 54–72 B/h | ~1–3 h de ingreso |
| (b) Veterana (la partida real del dueño, H65 terminada) | **88 M/s** | **318 B/h** | **2.34 T = 7.4 h** |
| (c) Muy avanzada (la del dueño con hábitats tier 9–10 y Nv50–60) | **0.6–1.0 B/s** | 2–3.7 T/h | — |

- **Bandas de precio sugeridas.** Cobrar en **minutos de ingreso**, que es la regla que ya usan el Kit de Vuelo y el Taller Cometa. Las cinco dimensiones costarían 15 / 30 / 45 / 60 / 75 min (3.75 h en total), con piso absoluto.
  - La compra se cierra con dos candados que el oro no salta: **jefe de la dimensión anterior + un material que solo da la dimensión anterior**. Detalle en §2.6.
- **Prefijos de especie.** Hoy se usan `c_ r_ e_ l_ m_ s_ h_ d_`. **`m_` ya es de los míticos** (`m_raijin`, `m_singular`). **`x_` está libre** en todo `game/` (src, tests, scripts), y `md_` también.
  - La rareza «primordial» es un **flag** (`primordial: true`) encima de un legendario. Es el precedente más barato para MULTIDIMENSIONAL.
- **Colección.** 120 especies, 15 elementos, 27 sets del Catdex, 2 formas (las dos de Canelo), 21 Ecos y tope de nivel 100.

---

## 1. El mapa original de la Parte I («DIARIO DEL MAR»)

### 1.1 Cómo está hecho

**Escena y concepto.** `game/src/scenes/MapScene.ts:1-13`. Es una carta náutica grabada, impresa en papel de periódico viejo. Las 6 zonas son islas y cada una tiene 9 etapas sobre una ruta punteada: escudo de élite en la 5 y calavera de jefe en la 9. Las zonas futuras quedan bajo niebla «???». Al tocar una etapa se abre un recorte de periódico (`StageCard`) con las probabilidades y el botín.

**Geometría, que está toda en código y no en datos:**
- `ZONE_BOX` (`MapScene.ts:83-90`): 6 cajas de 600×400. Forman dos filas en «U»: las zonas 1→3 abajo de izquierda a derecha y las 4→6 arriba de derecha a izquierda (`mirror`).
- `PATTERN` (`:91-101`): 9 puntos fijos que dibujan la ruta dentro de cada caja. `nodePos` (`:150-154`) le agrega un temblor de ±6 px por hash, excepto a la primera y la última etapa.
- La carta mide 1896 px de ancho (`CHART_W`, `:110`). La cámara arranca con zoom 1.5 sobre la zona de la frontera y se puede arrastrar o hacer zoom con la rueda. El botón CARTA alterna entre vista completa y acercamiento (`:345-391`, `:683-690`).

**Nodos** (`StageNode`, `:156-223`):
- Tipos `normal | elite | boss`, con radio 23 / 30 / 36.
- Estados `cleared | open | locked`. Un nodo ganado se pinta azul con una palomita roja; uno bloqueado, con contorno punteado y opacidad 0.62.
- La **frontera** (primera etapa sin ganar) lleva un anillo rosa, o rojo si es jefe, que late (`:1651-1667`). Sobre ella flota un barquito marcador (`:298-300`, `:1533-1536`).
- El tipo sale de `stageKind` (`game/src/state/ext/campaign.ts:53-58`): etapa 9 = jefe y etapa 5 = élite, salvo que `content.json` diga otra cosa.

**Rutas** (`:1457-1518`):
- Curvas Bézier con un doblez que alterna ±14.
- El tramo hacia la zona siguiente dobla 40 (es el «carril entre zonas»).
- Un tramo pendiente se dibuja con puntos azules; uno ganado, con raya roja.
- Al ganar por primera vez, la ruta se entinta animada, el barco navega hasta el nodo nuevo y se estampa «¡NUEVA ETAPA!» o «¡NUEVA ZONA!» (`introAnim`, `:1538-1609`).

**Viñetas por zona** (`buildZone`, `:492-610`):
- Una isla principal más 2 islotes.
- Dibujos hechos en código: palmeras y serpiente de mar en la Z1; acantilados, cascada, torre y la Gárgola dormida en la Z2; tormenta, tentáculos y remolino en la Z3; columnas en la Z4; estrellas y luna en la Z5; costillas en la Z6.
- Etiqueta con número romano, nombre, facción e insignias de los elementos. Bajo el jefe va una cinta con su nombre, tachada cuando ya está vencido.
- Las primitivas de dibujo están en `game/src/panels/campaign/chartArt.ts`.

**Niebla** (`buildFog`, `:612-666`):
- Cada zona bloqueada lleva textura de niebla, nubes, una silueta fantasma del jefe (la Gárgola en la Z2, tentáculos en la Z3), un «???» enorme, una frase de `FOG_LINES` (`:108`) y el texto «Vence al Jefe N para disipar la niebla».
- Si tocas la niebla suena un error.
- Al vencer al jefe, la niebla se disipa animada (`:1595-1606`).
- Los nodos de una zona bloqueada **no se construyen** (`buildNodes`, `:1439-1454`).

**Cabecera y HUD.** Cabecera «Diario del Mar» con número de edición = batallas + 1 (`buildMasthead`, `:668-727`). Botón ENCARGOS con insignia de cuántos hay abiertos. HUD en modo `map` (`:301-320`): el botón IR de la misión fijada te lleva a la zona, a una batalla de historia o a una isla 3D.

**Encargos en el mapa.** Chinchetas junto a su etapa con tres estados (`locked`, abierto «!», hecho «✓»), en `buildErrandPins` (`:1395-1436`). El tablero está en `game/src/panels/Errands.ts`.

**Tarjeta de etapa** (`game/src/panels/campaign/StageCard.ts`, 275 líneas): nombre, facción, capitán e IA, regla de élite, PODER ENEMIGO contra TU PODER, «Ventaja ×», la ESTIMACIÓN (simulación sin pantalla, `state/sys/estimate.ts`), el Análisis del jefe con el «Reino recomendado», el BOTÍN PREVISTO (con ×0.7 si la etapa ya está ganada) y el Asalto Rápido.

### 1.2 Datos y reglas

| Qué | Dónde | Valor |
|---|---|---|
| Etapas por zona | `balance.json:1801` `combat.stages_per_zone` → `campaign.ts:28` | 9 |
| Zonas, etapas y tripulaciones | `content.json:13744` `enemies[]` (se exporta como `ZONES`, `data/content.ts:216`) | 6 zonas · `stages[]` con `stage, name, type, archetype, personality, power, enemyCats, aiDifficulty, eliteRule, eliteLine` · `errands[]` |
| Jefes (texto) | `content.json:12970` `bosses[]` | nombre, elementos, barco, regla, punto débil, `phases` (solo texto), `enrageTurn`, `ai`, `lines` |
| Jefes (economía) | `balance.json:1895` `bosses[]` | Reino recomendado 5/11/18/25/32/39 · gemas 6/6/6/6/6/15 · `unlocks` (`element:`, `cat:`, `zone:`, `ship:`) |
| Élites | `content.json:13694` | una por zona (etapa 5) |
| Facciones | `state/ext/campaign.ts:32-39` | nombre y paleta por zona |
| Capitanes sin nombre | `state/ext/campaign.ts:112-119` | 5–6 nombres por facción |
| Arquetipos de barco | `content.json:12800` `enemyArchetypes` | 21 |

**Desbloqueos:**
- `zoneUnlocked(z) = z==1 || bossesDefeated ≥ z−1` (`campaign.ts:36-38`).
- `stageUnlocked` es lineal: hay que ganar la etapa anterior (`:39-43`).
- `frontier()` es la primera etapa sin ganar (`:44-50`).

**Poder enemigo (dificultad por zona)** (`econ.ts:150-155`):
- `EP(k) = stage1 · (boss/1.3/stage1)^((k−1)/7)`; el jefe vale `boss_power`.

| Zona | Nombre | Etapas 1→8 | Jefe | IA | Mk enemigo |
|---|---|---|---|---|---|
| 1 | Bahía Sardina | 22 → 108 | 140 | grumete | 3 |
| 2 | Acantilados de Piedra | 110 → 346 | 450 | corsario | 3 |
| 3 | Mar de Tormentas | 360 → 692 | 900 | corsario | 3 |
| 4 | Ruinas Sumergidas | 850 → 2 000 | 2 600 | capitán | 4 |
| 5 | Abismo Estelar | 1 900 → 3 462 | 4 500 | capitán | 4 |
| 6 | La Marea Sin Nombre | 3 300 → 5 923 | 7 700 | capitán | 5 |

- Fuentes de la tabla: `balance.json › combat.zones`; IA en `content.json` (`aiDifficulty`) y `campaign.ts:136` (`DIFF_MAP`); Mk enemigo en `campaign.ts:182`.
- Encima se aplican `COMBAT_TUNE` (`campaign.ts:151-176`: por etapa en las zonas 2–3, élite y jefe) y los **CATACLISMOS** de las zonas 4–6 (`campaign.ts:77-90`).
- Muerte súbita: turno 10 por defecto, 13 en los jefes 4–5 y 20 en el 6 (`campaign.ts:485`).

**Probabilidad mostrada** (`campaign.ts:113-118`): `p = clamp(0.5 + 0.5·tanh(1.6·ln(SP/EP)), 0.03, 0.97)`. La razón de poder también escala el daño (`fS = clamp(S^0.8, 0.15, 5)`) y la vida (`fHp = √fS`) (`campaign.ts:125-134`).

**Análisis del jefe.** Cada intento contra un jefe, ganado o perdido, suma +20 % de Análisis, hasta 100 % (`campaign.ts:632`, `balance boss_analysis_per_defeat`). Eso baja el EP del jefe hasta 25 % (`campaign.ts:57`). Con 40 % se revela el punto débil (`campaign.ts:283`).

**Premios** (`applyResult`, `campaign.ts:577-651`; fórmulas en `econ.ts:157-175`):
- **Oro** = `max(15·1.3^(abs−1), 40 s·oro/s)` × (1 si es frontera, 0.7 si se repite) × perfecta 1.5 × Momentum.
  - `abs` es el índice absoluto 1..54.
  - El piso «40 s de ingreso» manda en cuanto la isla produce más que la curva. Por ejemplo, la 6-9 paga 16.4 M a cualquier ingreso por debajo de ~410 K/s.
- **Chatarra:** `2 + 0.5·abs`.
- **Cristales** del elemento del primer gato enemigo: `1 + 0.75·zona` (2 a 6).
- **Planos:** 35 % desde la etapa 3; cantidad `1 + ⌊(z−1)/2⌋`.
- **Orbes:** 35 % de dar 3 orbes de un gato de tu tripulación.
- **Gema:** 5 % si la victoria es perfecta.
- **Primera victoria del juego:** botín dorado ×3.
- **Derrota:** ×0.3 de oro y chatarra; 3 orbes del gato enemigo.
- **Jefe** (`bossRewards`, `:653-687`): gemas 6 (15 el último), 8 planos, 12 cristales, 25 orbes de tu mejor gato. Desbloquea un elemento, un primordial o la zona siguiente. Los jefes 4–6 dan Fragmentos del Vacío.

**Repetibilidad:**
- Cualquier etapa ganada se repite al ×0.7 (`farm_stage_mult`), y `stageWins` cuenta cuántas veces (`campaign.ts:589`).
- **Asalto Rápido:** con ventaja ≥ ×2.5 gana al instante con el botín de la etapa (`state/ext/campaign.ts:29`, `:173-195`).
- **Simulacro** (Reino 40, misión C27): repite en segundo plano tu mejor etapa ganada y paga 70 %, con tope offline de 8 h (`state/sys/simulacro.ts:1-14`).
- **Encargos:** 7 en total, en las zonas 2–6. Cada uno tiene `afterStage`, `powerAsStage` y una restricción (barcos, máximo de gatos, sin fuego, todo mojado, armadura, sin burbuja, sin vista previa). Su premio especial se cobra **una sola vez** (`campaign.ts:921-1144`).

**Calificaciones.** **No hay estrellas por etapa.** Solo existe la victoria perfecta = ganar con `catsLost === 0` (`scenes/BattleScene.ts:2499`), que suma a `stats.perfects` y al contador `wins_perfect`.

**Memoria entre escenas.** `campaignMemo` guarda `justCleared` y `justUnlocked`, que son los que animan la ruta (`state/ext/campaign.ts:247-255`). `resolveBattle` captura el Ronroneo, el Momentum, el Análisis, los rangos K.O. y las reacciones (`:270-329`).

**Construcción de la batalla.** `buildBattle(zone, stage)` → `buildSiege(SiegeInput)` (`campaign.ts:299-489`).
- **`buildSiege` está exportada y es la fábrica que reusan los Encargos (`buildErrand`, `:1043`) y las batallas de historia.** Recibe `ep`, `enemyCats`, `archetype`, `rules`, `blueprint`, `enemyLevel`/`enemyStars`, `intro`, `hpMulX` y `suddenDeath`.
- Ojo: lee `zone` para elegir la paleta, el Mk enemigo, `COMBAT_TUNE` y `styleFor`. La Parte II le pasa la zona 6.

### 1.3 Rutas de desarrollo y fixtures

Todas estas rutas son solo para DEV (`game/src/main.ts:50-190`):
- `?save=<fixture>` carga `game/test-saves/<fixture>.json` en la ranura de guardado y sigue sin el parámetro (`:113-122`).
- `?scene=map | island | battle | title | region&region=<id> | dev | catlive | fxlab…` (`:58-112`).
- `?stage=Z-S` entra directo a esa batalla de campaña (`:129-134`).
- `?momento=<id>`, `?speed=N` (reloj económico ×N), `?realtime=1`, `?new=1` y `?dev=1`.
- En consola: `window.__G`, `__scenes`, `__cine`.
- `rupturas.html` es la porción aislada de la Parte II; nunca toca saves (`vite.config.ts`).

| Fixture | Qué es (medido) |
|---|---|
| `post-boss1` · `zone2-par` · `post-boss2/3` · `pre-boss3` · `m2-*` | Parte I temprana: Reino 6–22, 5–10 gatos |
| `late-game` | Reino 36, 23 gatos Nv40, 5 jefes, 3 hábitats tier 1 |
| `post-story` | Reino 38, 22 gatos Nv38 ★3, H22 hecha, 8 expansiones |
| `post-finale` | Reino 38, 28 gatos, H30 hecha, 13 elementos, 14 fragmentos |
| `rupturas-mid` · `rupturas-fin` · `rupturas-raro` · `rupturas-mid-v1` | Formato pre-reinicio de la Oleada 1. **Al cargarlas, el reinicio narrativo las devuelve a H31**: miden hMax = 30 |
| `rupturas-h44` | H43 hecha, H44 activa, Kit de Vuelo |
| `rupturas-o3` | H49 hecha (H50 activa), Gravedad |
| `rupturas-o4` | H57 hecha, Kit Astral, 40 de combustible |

Advertencias sobre las fixtures:
- **No hay ninguna fixture con H65 terminada.** La única partida con la Parte II completa es la exportada del dueño, que está fuera del repo. Generadores: `game/scripts/make-o4-fixture.ts` y `make-rupturas-fixtures.ts`, que arman las partidas desde código.
- **Las fixtures no sirven para calibrar la economía.** Todas tienen solo 3 hábitats tier 1, 50 M o 50 B de oro puestos a mano y gatos con nivel uniforme. Su ingreso es de 5–11 K/s, mil veces menos que una partida real. Ya lo advertía `docs/part-ii/01-auditoria-juego.md:174-175`.

### 1.4 Cómo la Parte II le agregó hojas a la carta

| Hoja | Islas (`RegionId`) | Dibujo | Código |
|---|---|---|---|
| MAR DE LAS RUPTURAS (O1) | `paginas`, `nacar` | Hoja pegada al borde derecho, tinta «fresca» azul `0x2c4fb8` con sombra desfasada (`MISREG`), cinta adhesiva | `MapScene.ts:112`, `:140-143`, `buildRupturas` `:778-863` |
| EL CIELO (O2) | `invertidas`, `corona` | Hoja que se despliega **hacia arriba**, debajo de las Rupturas; escala de altitud, una tromba sobre la costura | `MapScene.ts:121-130`, `buildCielo` `:986-1095`, `buildSeam` `:1330` |
| LO DE ARRIBA (O3) | `cometa` | Tira de carta nocturna en añil y oro, con una constelación de gato | `MapScene.ts:132-138`, `buildAstral` `:1190-1284` |
| LAS FRONTERAS (O4) | `suenos`, `olvidada`, `umbral` | Última hoja a la derecha, con el borde roto | **módulo aparte** `game/src/regions/mapO4.ts` (`buildMapO4`, llamado en `MapScene.ts:279`) |

**Contrato para agregar una hoja.** Es lo que hace hoy `mapO4.ts`, el ejemplo más limpio:

1. **Registrar las islas** en `game/src/regions/index.ts:9-24` (`REGION_IDS`, `REGION_INFO` = `{name, battles[], mapFlag}`).
2. **Poner el flag** `region:<id>` cuando aparece la misión que te manda ahí: `REGION_MISSION` + `syncRegionFlags` en `state/sys/rupturas.ts:61-128`, o el sincronizador propio de la oleada.
   - `mapRegions()` (`rupturas.ts:174-179`) solo devuelve las islas con flag. **Sin flags la carta queda exactamente igual.**
3. **Dibujar la hoja** en un módulo propio con `buildX(scene)`, que recibe el `MapHost` (`mapO4.ts:47-53`: `chart`, `chartW`, `chartTop`, `isleChrome`).
   - La hoja se pega a la derecha de la última y agranda `chartW`, con lo que la cámara se ajusta sola (`MapScene.ts:349-361`).
   - Debe exportar `mapXPos(id)` para que `islePos` la encuentre (`:732-741`) y `mapXRegions()` para el enfoque «la historia espera ahí» (`:329`) y para `showFreshIslands` (`:748`).
4. **Decorar cada isla con `isleChrome`** (`MapScene.ts:911-977`): cinta con el nombre (etiqueta `ISLE_NAME`), chincheta roja «!» si una misión de historia te espera ahí (`regionCalls`, `rupturas.ts:150-160`), hover, y tap → `goRegion(id)` (isla 3D).
   - La primera vez la tinta «se absorbe», se estampa «¡NUEVA ISLA!» y se marca el beat `carta_<id>`.
5. **Títulos verticales** con la etiqueta `SHEET_TAB` (`:114`) para que las notas a mano de la noche (`MapNight`, `:253-295`) no los tapen.
6. **Persistencia.** Las islas que ya conociste se quedan aunque se reinicie la narrativa: `knownRegions` / `syncKnownRegions`, en `rupturas.ts:96-146` y `ext.rupturas.known`.

**Lo que no hay.** No existe ninguna hoja con **nodos de etapa**. Todos los nodos y rutas de `MapScene` están atados a `ZONES` (6 zonas), `ZONE_BOX` (6 cajas), `STAGES_PER_ZONE = 9` y `bossesDefeated`. Agregar zonas 7+ a `content.enemies` **rompería la Parte I**, por varias razones:
- `frontier()` apuntaría más allá de la zona 6.
- `ZONE_BOX[7]` no existe.
- `BAL.bosses[zone−1]`, `combat.zones[zone−1]`, `bossCrew`, `BOSS_INTRO` y `FACTION_PALETTE` están indexados por zona.
- `zoneUnlocked` usa el contador global `bossesDefeated`.

El camino barato es otro espacio de nombres: claves y estado propios (por ejemplo `ext.<parte3>`) más `buildSiege` como fábrica. Es lo mismo que hacen los Encargos y las batallas de la Parte II.

### 1.5 Capturas

Las capturas están en `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/cd9005fa-abeb-4c2a-8f35-47051cccbe24/scratchpad/capturas/` (fuera del repo). La lista está en el anexo A.

---

## 2. Economía

### 2.1 Monedas y recursos

| Recurso | Dónde vive | Se gana | Se gasta |
|---|---|---|---|
| Doblones (oro) | `G.s.gold` (`state/game.ts:109`) | hábitats (ingreso pasivo), batallas, misiones (60 s de ingreso), Podio, Casino | expansiones, hábitats y tiers, módulos Mk, barcos, orbes, Kit de Vuelo y Kit Astral, combustible |
| Pescaditos (comida) | `G.s.food` | granjas/muelles, misiones, hábitats (pesca) | subir niveles (desde Nv50 se dispara: `feed_wall` ×40, ×1.13 por nivel) |
| Ojos de Gato (gemas) | `G.s.gems` | jefes, Catdex (1–6 por especie nueva), hitos de Reino, misiones (15 %), victoria perfecta (5 %), batallas de la Parte II | ranuras, constructor, reloj, Prisma, saltar temporizadores, Portal (6–8 por tirada) |
| Ronroneo | `G.s.purr` (minutos) | acciones; tope por Reino | acelera relojes |
| Orbe Prisma | `G.s.prisma` | sets del Catdex (10), Encargos, expansión 7 (6/h), gacha | comodín: vale 1 orbe de cualquier especie |
| Orbes de Alma (por especie) | `G.s.orbs` | duplicados, victorias (35 %), jefes (25), misiones, Podio, tienda | estrellas (`starOrbs = base·[1,2,3,5,8]`) |
| Chatarra · Planos | `G.s.scrap` · `G.s.blueprint` | batallas, Encargos, expediciones | módulos Mk, kits |
| Cristales (por elemento) | `G.s.crystals` | batallas (2–6), jefes (12), grietas (20), expediciones, gacha | **tiers 5–10 de hábitat (2, 3, 5, 7, 9 y 12 por mejora)** y Mk 5–7 |
| Combustible Astral | `G.s.ext.astral.fuel` (`state/sys/rupturasO3.ts:56-80`) | refinería +1 cada 4 min (15/h, también offline, tope 60 o 150); regalo de 40 al llegar (H50); +15 la primera vez que ganas cada batalla astral | 10 por viaje astral (5 con Velas Solares); se compra a 10 por 240 s de ingreso (mínimo 1 500) |
| Boletos · Fichas | `G.s.casino` | jugar, la Caja, Tragamichis | Portal, Casino |

- **Nácar** y **Tinta de Ruptura** están diseñados en `docs/part-ii/05-biblia-parte-ii.md:503-505` (§11), **pero no existen en el código**: ni en `GameState` (`state/game.ts:104-170`) ni en `ext`. Solo se nombran en el comentario de `state/sys/casino/eterno.ts:52`.
  - La Tinta («desbloquear regiones») está libre para que la Parte III la use como material de desbloqueo.
- **ETERNO** (Casino) solo pone en 0 el oro, las gemas, la comida, los boletos, las fichas y el combustible. Nunca toca gatos, formas ni Ecos.
- **Multiplicador global de oro** (`state/sys/island.ts:92-108`, `econ.ts:108-110`): `ingreso = Σ hábitats Σ gatos[oroRareza·1.16^(Nv−1)·★] × multTier × banqueros × (1 + 0.02·especies(+catdex)) × (1 + oroExpansiones) × Momentum × Marea`.
  - **Marea Final = ×1000 durante 3 min** (`island.ts:114-116`).
  - Los precios de la tienda usan `incomePerSec()`, que es el ingreso **sin** Momentum pero **con** Marea (`state/sys/shop.ts:100-104`). Riesgo abierto: `docs/part-ii/06-economia-orbes.md`, sección «Pendiente».

### 2.2 Todo se cobra «en segundos de ingreso»

- Tienda, orbes, gatos, misiones, Podio y batallas se expresan en segundos o minutos de `goldPerSec` (`shop.ts:5-10`, `missions.ts:258`, `econ.ts:160-164`).
- La Parte II siguió esa regla:
  - **Kit de Vuelo:** `goldFor(secs) = max(2000, oro/s·secs)` (`rupturasO2.ts:137`).
  - **Taller Cometa:** `ASTRAL_LEVELS` (`rupturasO3.ts:77-80`).
- Las **expansiones** de la Parte I son la excepción: oro **absoluto** (`content.json:17704`, `state/sys/island.ts:418-432`).

### 2.3 Ingreso y saldo de tres perfiles (medido con el código del juego)

| Perfil | Fuente | Oro/s (sin Momentum) | Por hora | Saldo | Notas |
|---|---|---|---|---|---|
| Fixtures `post-story` … `rupturas-o4` | test-saves | 4.6 K – 5.6 K | 17–20 M | 50 M / 50 B (puestos a mano) | 3 hábitats tier 1: **no representan a nadie** |
| **(a-bajo)** H65 apenas, sin invertir | sintético: 35 especies, Nv43, ★1–3, tier 7, exp. 1–10, Reino 38 | **5.0 M/s** | 18 B | — | piso razonable |
| **(a)** H65 jugando normal | sintético: 45 especies, Nv45, ★1–3, tier 8, exp. 1–10, Reino 40 | **17 M/s** | 61 B | ~1–3 h de ingreso | cuadra con el simulador de la post-historia: 20–52 M/s a las 6–7 h (`research/economy-sim/posthistoria_salida.txt`) |
| **(b)** Veterana real | la partida del dueño (export 2026-10-11): H65 hecha, `oleada4_fin`, 12.9 h de juego, Reino 50, 102 especies, 12 expansiones, 21 hábitats (casi todos tier 1–5, uno tier 10), gatos Nv24 de promedio (8 en Nv50), Liga 17 del Podio | **88.5 M/s** (109 M/s con Momentum 1.48) | **318 B** | **2.34 T = 7.4 h** · 178 gemas · 94 Prisma · 4 212 orbes · 12.3 B de comida | multiplicador global ×21.7 |
| **(c)** Muy avanzada | la del dueño con tier 8 / tier 9 + Nv50 / tier 10 + Nv50 / tier 10 + Nv60 | 174 M / 578 M / 893 M / **1.03 B/s** | 0.6 / 2.1 / 3.2 / 3.7 T | — | subir todo a tier 10 cuesta 2.35 T de oro (el saldo de (b)), **pero también 38 cristales por hábitat** |
| Sintético extremo | 80 especies ★5–6, Nv50, tier 10 | 1.16 B/s | 4.2 T | — | techo práctico de hoy |

**Lectura:**
- Una partida que termina H65 juega ~12–13 h. La Parte I acaba hacia las 9 h (H29 `estTime ~9:00`, `content.json:14669+`). Las misiones H31–H65 suman ~160 min de `estTime` (`data/rupturas/historia*.json`). El dueño tiene 12.9 h.
- **El ingreso crece unas 50 veces de (a) a (c).** Lo que manda es el **tier de los hábitats** (multiplicador ×36 → ×200), seguido de las especies (+2 % cada una) y las estrellas (×1 → ×2.8).
- El techo real no es el oro sino los **cristales** (tier 9 pide 9 y tier 10 pide 12 del elemento; el dueño tiene ~20 por elemento) y el tiempo de los constructores (tier 10 tarda 60 min).

**Otras fuentes de oro**, expresadas en minutos de ingreso pasivo:
- Misión: **1 min** (60 s).
- Batalla repetida de alto nivel: **~0.5 min** (40 s × 0.7). Por debajo de 410 K/s manda el piso de la curva: la 6-9 paga 16.4 M.
- Primera victoria de una batalla de historia: ~0.7 min.
- Gacha «Oro (2 min)».

Ninguna fuente activa paga más que pocos minutos. Eso significa que **«no farmear» = el precio cabe en el ingreso pasivo de lo que dura el contenido**.

### 2.4 Precios de desbloqueos comparables

| Desbloqueo | Precio | Puerta | (a) 17 M/s | (b) 88 M/s | (c) 0.9 B/s |
|---|---|---|---|---|---|
| Expansiones 1–5 | 400 → 35 M | Reino 3–22 | — | — | — |
| Exp. 6 Ruinas Arcanas (dim. Glitch) | 200 M | Reino 27 | 12 s | 2 s | 0 |
| Exp. 8 Atolón Estelar (Estelar) | 1.5 B | Reino 36 | 1.5 min | 17 s | 2 s |
| Exp. 9 Jardín Sakura (Acuarela) | 4 B | Reino 34 | 4 min | 45 s | 4 s |
| Exp. 10 Oasis Dorado (Sepia) | 10 B | Reino 35 | 10 min | 2 min | 11 s |
| Exp. 11 Isla Caramelo (Caramelo) | 30 B | Reino 36 | 29 min | 5.7 min | 33 s |
| Exp. 12 Abismo del Ronroneo (Vacío) | 100 B | Reino 38 | **98 min** | 19 min | 1.9 min |
| Hábitat nuevo N.º 20 / 30 / 40 | 37 M / 4.1 B / 447 B (`60·3^(min(N,8)−1)·1.6^max(0,N−8)·1.3^M`) | — | 0 / 4 min / 7 h | — / 46 s / 85 min | — / 5 s / 8 min |
| Tier de hábitat 8 / 9 / 10 | 2 B / 15 B / 100 B + 7 / 9 / 12 cristales | Reino 32 / 34 / 37 | 2 / 15 / 98 min | 23 s / 3 / 19 min | 2 s / 17 s / 1.9 min |
| Barcos: Gorrión · Merodeador · Bastión · Bajel | 1.5 K · 600 K · 40 M · 800 M | Reino 5 · Reino 15 · jefe 3 · jefe 4 | trivial | trivial | trivial |
| **Kit de Vuelo** Nv2 / Nv3 / otro barco | 3 600 s / 7 200 s / 1 800 s de ingreso + chatarra, planos y cristales de Gravedad | historia H43 | 60 / 120 / 30 min | igual | igual |
| **Taller Cometa** (Kit Astral) Nv2 / Nv3 / otro barco | 3 600 s / 7 200 s / 1 800 s + chatarra, planos y combustible | historia H50 | 60 / 120 / 30 min | igual | igual |
| Paquete de 5 orbes con oro | `33·(I/10)^−0.15` min, entre 3 y 30 (`shop.ts:47-59`) | — | 3.8 min (3.9 B) | 3 min | 3 min |
| Grietas del Multiverso (Parte I) | **sin oro**: se abren con avance (expansión limpia, Reino, liga del Podio o fragmentos) | `state/sys/grietas.ts:1-20` | — | — | — |

- Fuentes de la tabla: expansiones en `content.json:17704`; hábitats y tiers en `balance.json:1244`, `:1421` y `docs/ECONOMIA-POSTHISTORIA.md`; barcos en `balance.json:1622`; Kit de Vuelo en `state/sys/rupturasO2.ts:74-79`; Taller Cometa en `state/sys/rupturasO3.ts:77-97`.
- Las «dimensiones» de la Parte I (Glitch, Prisma, Estelar, Acuarela, Sepia, Caramelo, Vacío) **no se compran aparte**: son el estilo visual de cada expansión (`game/src/island/dimensions/**`, `content.json › expansions[].visual`). Se pagan al comprar la expansión, con oro absoluto y una puerta de Reino.
- Ritmo de referencia del simulador post-historia: una expansión cada **28–80 min de ingreso** (promedio de 54 min).

### 2.5 Bandas de precio sugeridas para las 5 dimensiones

**Principios** (sacados de lo que ya funciona en el juego):
1. **Precio en segundos de ingreso** con `max(piso, incomePerSec·s)`, igual que `goldFor` del Kit de Vuelo. Es la única forma de que el mismo precio pese parecido con 5 M/s y con 1 B/s.
   - Calcularlo con `incomePerSec()/mareaMult()` para no cobrar ×1000 durante la Marea Final. Ese es el pendiente de `docs/part-ii/06-economia-orbes.md`.
2. **Cada precio debe caber en el ingreso pasivo que se junta mientras juegas la dimensión anterior.** Con 9–12 etapas + jefe a 3–5 min por batalla, eso es ~45–75 min.
   - Además entran +1 min por misión y +0.5 min por batalla, y el banco offline.
   - Así el jugador nuevo nunca farmea: cuando termina la dimensión N, ya tiene el oro de la N+1.
3. **El oro no es el candado.** La veterana (b) tiene 7.4 h de ingreso guardadas y la (c) puede llegar a cualquier cifra. Ningún precio en oro le pone freno sin castigar a (a). Los candados reales son:
   - **la historia**: la dimensión N+1 pide el jefe de la N, con el patrón `win_battle` + flag, como hacen las islas `region:*`;
   - **un material que solo se gana jugando la dimensión anterior**: la Tinta de Ruptura de la biblia, o un «sello» por dimensión. Ejemplo: 3 por etapa ganada por primera vez + 10 por el jefe ≈ 34 por dimensión; abrir la siguiente pide ~25. Es el mismo papel que hacen hoy los cristales con los tiers 9–10 y el combustible con los viajes astrales.

**Bandas:**

| # | Dimensión (orden pedido) | Puerta narrativa | Segundos de ingreso | Piso (oro) | (a-bajo) 5 M/s | (a) 17 M/s | (b) 88 M/s | (c) 0.9 B/s | Minutos en (a) / (b) / (c) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Borracha | H65 hecha | 900 (15 min) | 4.5 B | 4.5 B | 15 B | 80 B | 0.8 T | 15 / 15 / 15 |
| 2 | Superhéroes | jefe D1 + material D1 | 1 800 (30 min) | 9 B | 9 B | 31 B | 160 B | 1.6 T | 30 |
| 3 | Anime | jefe D2 + material D2 | 2 700 (45 min) | 13.5 B | 13.5 B | 46 B | 240 B | 2.4 T | 45 |
| 4 | Libros | jefe D3 + material D3 | 3 600 (60 min) | 18 B | 18 B | 61 B | 320 B | 3.2 T | 60 |
| 5 | POP | jefe D4 + material D4 | 4 500 (75 min) | 22.5 B | 22.5 B | 77 B | 400 B | 4 T | 75 |
| | **Total** | | **13 500 s = 3.75 h** | 67.5 B | 67.5 B | 230 B | 1.2 T | 12 T | 225 min |

**Por qué estas cifras:**
- **15 → 75 min.** Está en el rango de las expansiones de la post-historia (28–80 min) y de los niveles del Kit de Vuelo y el Taller Cometa (30–120 min). Termina por debajo de lo que dura jugar la dimensión anterior.
- **El piso** es el precio para 5 M/s, el perfil «a-bajo». Solo pesa por encima de lo indicado en partidas más pobres que eso. Una partida con 1 M/s pagaría D5 en 6 h, y eso es una señal de que le falta isla, no de un precio roto.
- **El veterano (b)** pagaría 1.2 T de sus 2.34 T si comprara todo junto, pero no puede, porque necesita el jefe y el material de cada dimensión. Su oro le sirve para entrar en cuanto se gana el paso. Para que el oro le siga importando dentro de cada dimensión, conviene que cada una tenga **gastos propios de su estética** (dioramas, decoraciones, un hábitat de la dimensión). Es el mismo «gastos de oro» de la biblia §11 (`05-biblia-parte-ii.md:507-510`).
- **El nuevo (a)** gana ~61 B/h de ingreso pasivo. Al cerrar la D1 (~45–60 min) ya juntó ≥ 46 B, suficiente para la D2 (31 B) y casi la D3. No necesita farmear.
- **Alternativa con oro absoluto** (el estilo de las expansiones): 10 / 25 / 50 / 100 / 200 B.

  | Perfil | D1 | D2 | D3 | D4 | D5 |
  |---|---|---|---|---|---|
  | (a) 17 M/s | 10 min | 25 min | 49 min | 98 min | 3.3 h |
  | (b) 88 M/s | 1.9 min | 4.7 min | 9.4 min | 19 min | 38 min |
  | (c) 0.9 B/s | 11 s | 28 s | 56 s | 1.9 min | 3.7 min |

  Funciona para (a), pero (b) y (c) lo compran todo de golpe con su saldo. Si se elige así, los candados del punto 3 se vuelven indispensables.

**Riesgos que hay que vigilar:**
- La Marea (precio ×1000).
- El Momentum: usar `incomePerSec`, que ya lo descuenta.
- Las fixtures no sirven para probar precios. Hace falta una fixture **«h65-normal»** con ~17 M/s, construida con un script como `make-o4-fixture.ts`.

---

## 3. Rarezas y colección

### 3.1 Orden y presupuesto

**Orden real:** común < raro < épico < legendario < **primordial** < mítico < heroico < divino.
- `balance.json:203` `rarities.order` = `common, rare, epic, legendary, mythic, heroic, divine` (7 rarezas).
- **«Primordial» no es una rareza.** Es `primordial: true` en un **legendario**. La UI lo trata como un «tier» propio: `catTier` en `state/ext/catQuery.ts:57-65` y `RARITY_ORDER` en `state/ext/collection.ts:20`, donde queda entre legendario y mítico (en `rarityRankOf` cuenta como legendario + 0.5, `catQuery.ts:67`).
- Los colores y nombres están en `game/src/ui/theme.ts:45-54`.
- **Secreto** también es un flag (`secret: true`), sobre especies épicas, legendarias o míticas `s_*`.

| Rareza | Oro/s base | Poder base | Comida ×| Orbes por duplicado | Orbes por ★ (base) | Gemas al descubrir | Disparo medio | Ulti media | Prefijo | Especies |
|---|---|---|---|---|---|---|---|---|---|---|
| Común | 0.5 | 5.0 | 1.0 | 10 | 10 | 1 | 52 | 35 | `c_` | 29 |
| Raro | 0.8 | 5.6 | 1.25 | 20 | 15 | 1 | 54 | 44 | `r_` | 33 |
| Épico | 1.3 | 6.2 | 1.6 | 35 | 25 | 2 | 69 | 76 | `e_` (20) + `s_` (6) | 26 |
| Legendario | 2.1 | 6.8 | 2.0 | 60 | 40 | 2 | 69 | 38 | `l_` (1) + `s_` (3) | 4 |
| Primordial (legendario + flag) | = legendario | = | = | = | = | = | 81 | 77 | `l_` | 17 |
| Mítico | 3.2 | 7.4 | 2.4 | 100 | 60 | 3 | 67 | 127 | `m_` (2) + `s_sonata` | 3 |
| Heroico | 3.6 | 7.6 | 2.6 | 120 | 55 | 4 | 83 | 81 | `h_` | 4 |
| Divino | 4.4 | 7.9 | 3.0 | 160 | 70 | 6 | 88 | 128 | `d_` | 4 |

- Las primeras seis columnas numéricas salen de `balance.json:203-282`. Las columnas de disparo y ulti son la media de `combat.shot.dmg` y `combat.ultimate.dmg` en el catálogo fusionado. La vida depende del **rol** (`content.json:1218`: tanque 150, artillero 100… francotirador 80), no de la rareza.
- **Total: 120 especies** (86 en `content.json` + 34 en `data/rupturas/especies*.json`).
- **Curvas** (`econ.ts:15-87`):
  - Oro ×1.16 y poder ×1.07 por nivel hasta Nv50; desde ahí, ×1.04 y ×1.03.
  - Estrellas ×[1, 1.25, 1.55, 1.9, 2.3, 2.8] (máximo ★6).
  - Orbes por estrella = base·[1, 2, 3, 5, 8].
  - Nivel mínimo para cada ★: 10/20/30/40/50.
- **Tope de nivel** (`econ.ts:52-64`): `min(50, Reino+5)`. Con Reino 45 o más, cada ★ desde la segunda abre 10 niveles: ★1 50 … ★6 100. Más detalle en `docs/part-ii/16-niveles-100.md`.

### 3.2 Prefijos de id y qué letra queda libre

- **Usados por especies:** `c_ r_ e_ l_ m_ s_ h_ d_`.
- **`m_` está tomado** por los míticos (`m_raijin`, `m_singular`; se usan en `state/sys/storyBattles.ts:82,115`, `casino.ts:845` y `battle/ults.ts:117`).
- Otros ids con forma de prefijo que no son especies:
  - `p_` = residentes de la región Páginas (`regions/paginas.ts:411-418`).
  - `t_void` = teaser del Catdex (`content.json:8397`).
  - Los uids `G.uid('x')` no llevan guion bajo (`x123`, `state/game.ts:315`), así que no chocan.
- **Libres** (0 coincidencias en `game/src`, `tests` y `scripts`): `x_`, `u_`, `v_`, `n_`, `w_`, `md_`, `mu_`. **Recomendado: `x_`** (de «cruce de dimensiones»).
- El código casi no depende de los prefijos. La única excepción es un filtro del laboratorio `?scene=catlive` (`scenes/CatLiveLab.ts:28`: `/^[hd]_/`, `/^[crel]_/`).

### 3.3 Cómo se consigue cada rareza

- **Resonancia (Santuario)** (`state/sys/resonance.ts:37+`, `balance.json:1203`):
  - Pesos por bucket: común 55 · raro 30 · épico 11 · legendario 3.5 · ??? (secretos) 0.5.
  - Bono por la rareza de los padres; **pity** de +1 épico por fallo, tope 15.
  - Para épico, ambos padres Nv15 o más. Para primordial, padres que **compartan** el elemento y estén en Nv20 o más.
  - **Nunca salen** míticos, heroicos ni divinos, y tampoco primordiales «de historia» que no tengas (`storyLocked`, `:31-33`).
  - Los duplicados se convierten en orbes.
- **Portal / gacha** (`state/sys/gacha.ts:100-220`):
  - **Portal Michi** (6 gemas): común 51.8 % · raro 31 % · épico 14 % · legendario 2.5 % · HOLO 0.4 % · mítico 0.3 %.
    - Pity: épico cada 8, legendario suave desde 24 y seguro en 40, mítico en 160, gato cada 6.
    - **Principiante:** legendario suave desde 8 y seguro en 20 (`:79`).
    - «¡SE ESCAPÓ!»: 5 %, con racha caliente (`:81`).
  - **Multiverso HOLO** (8 gemas): HOLO 1.5 %, legendario seguro en 36.
  - **Cofre:** sin gatos.
  - Modos ALTO RIESGO (3 boletos) y TODO O NADA (10) (`:243-257`).
  - Heroicos y divinos **nunca** salen del Casino ni del Portal (`casino.ts:834`, `casino/eterno.ts:11`).
- **Historia y jefes:**
  - Primordiales de los jefes 1, 2, 4 y 5 (`balance.json:1895` `unlocks cat:`).
  - Seis primordiales de las Grietas (`state/sys/grietas.ts`).
  - Primordiales de la Parte II por misión (`obtain.source = 'ruptura:H35'`…; por ejemplo Madre Nácar, Bibliotecario, Masa Madre, Bisagra).
  - Noctis (secreto) al vencer al Primer Mar.
- **Expediciones Heroicas:** los míticos `m_raijin` (Reino 14) y `m_singular` (Reino 37) (`balance.json:2179` `events.heroic`).
- **Podio:** heroicos en las ligas 8–11 y divinos en las ligas 12–15. Se ganan la primera vez que vences al campeón (`data/podio.json › champion_prizes`, `state/sys/podio.ts:335`).
- **Secretos:** condiciones de Resonancia (`secretRecipes`, `content.json:11390`) o una ruta B por evento.
- **Tienda:** solo comunes de elementos descubiertos que todavía no tienes (`shop.ts:264-273`).

### 3.4 Conteos

**Por rareza:** común 29 · raro 33 · épico 26 (6 secretos) · legendario 21 (17 primordiales + 3 secretos + 1) · mítico 3 · heroico 4 · divino 4.

**Elementos: 15.** fire, water, nature, earth, storm, magic, cosmic, void, ice, sound, shadow, time, light, crystal, gravity (`content.json:54` + `rupturas/especies*.json`). Por elemento:

| Elemento | Especies (primario) | Apariciones (cualquier posición) |
|---|---|---|
| fire | 16 | 17 |
| water | 12 | 20 |
| magic | 10 | 18 |
| void | 9 | 10 |
| nature | 8 | 12 |
| storm | 8 | 16 |
| cosmic | 8 | 23 |
| gravity | 8 | 9 |
| earth | 7 | 15 |
| shadow | 7 | 7 |
| time | 6 | 6 |
| light | 6 | 9 |
| crystal | 6 | 6 |
| sound | 5 | 6 |
| ice | 4 | 4 |

Agregar un elemento tiene su propia guía: `docs/guias/agregar-elemento.md`.

**Sets del Catdex: 27** (`content.json:1440` + rupturas). Van de 2 a 7 especies y cada uno trae una regla pasiva de combate, por ejemplo «Ardiendo dura +1 turno». Completar uno da 10 Prisma (`balance orbs.prisma_from_catdex_set`).

**Formas: 2** (`canelo_almirante`, `canelo_astral`) en `game/src/data/rupturas/formas.ts:59-100`. Poder ×1.12, se desbloquean con el flag `forma:<id>` y cambiarlas es gratis (`state/sys/forms.ts`).

**Ecos: catálogo de 21** (`state/sys/ecos.ts:59+`):
- Despiertan tras 3 noches en la isla (`ECO_NIGHTS`).
- Son cosméticos con un recuerdo; **nunca dan poder**.
- 1 gema la primera vez por gato, pagada a través del registro de premios.

### 3.5 Filtro por rareza de «Elegir tripulación» (commit `cbc34e3`)

- `CatFilterBar` agrega una fila opcional (`tiers: true`) con «TODAS» + un chip por tier presente en tu colección, cada uno con el color de `RARITY` (`ui/catFilterBar.ts`, `drawTierChips`).
- La consulta usa `CatQuery.tiers` y `catTier`, donde primordial es un tier aparte (`state/ext/catQuery.ts:32-67`).
- Se usa en `panels/campaign/CrewSelect.ts:85`.
- Test: `game/tests/catQuery.test.ts`.
- **Una rareza nueva aparece sola** si está en `BAL.rarities.order` (o si se agrega como «tier» en `catTier`) y en `theme.RARITY`.

### 3.6 Qué tocaría en código agregar MULTIDIMENSIONAL

**Opción A, barata: un flag como «primordial».** `multidimensional: true` sobre una rareza que ya existe; la economía hereda la de esa rareza.

| Archivo | Cambio |
|---|---|
| `data/content.ts` (`CatDef`) | campo opcional |
| `state/ext/catQuery.ts:57-69` | `catTier` y orden |
| `state/ext/collection.ts:12-21` | `PrintRarity` y `RARITY_ORDER` |
| `ui/theme.ts:45-54` | `RARITY.multidimensional` (nombre y colores) |
| `fx/sequences/catReveal.ts:67,89,355` | rango, beat T4 y marco |
| `panels/collection/printTextures.ts:16,355,566` · `CatCard.ts:341,401` · `CatPanel.ts:436` · `Catdex.ts:291,958` | estilo de la carta |
| glosario | entrada nueva (`data/glossary.ts`) |
| `state/sys/resonance.ts:51` | excluirla de los pozos si no debe salir por Resonancia (hoy saldría como su rareza base) |
| `casino.ts:834` · `casino/eterno.ts` · `gacha.ts` `cat()` | excluirla de los pozos del Casino y del Portal |

**Opción B, cara: una rareza completa** (`RarityId`). Además de todo lo de la opción A:

| Archivo | Cambio |
|---|---|
| `state/econ.ts:7` | `RarityId` |
| `balance.json:203-282` | **8 tablas** (`names`, `gold_base_per_s`, `power_base`, `food_mult`, `duplicate_orbs`, `star_orbs_base`, `discovery_gems`; `resonance_time_s` es opcional) |
| `balance.json › kingdom.xp_rewards_pct_of_bar.hatch` | entrada nueva |
| `state/sys/resonance.ts:12` | `RANK: Record<RarityId>` (el compilador obliga) |
| `catReveal.ts:67` | `Record<Rarity>` (el compilador obliga) |
| `RARITY_H` copiado 5 veces | `regions/olvidada.ts:101`, `regions/suenos/residents.ts:21`, `regions/cielo/cats.ts:29`, `scenes/RegionScene.ts:46`, `rupturas/bridge.ts:73` |
| `art/temperament.ts:189` | `RARITY_MASS` |
| `podio/ladder.ts:118` | qué rarezas entran en cada liga |
| `battle/ultFx.ts:55` | banda de la ulti |
| `scenes/PodioScene.ts:802-804` | etiqueta y beat |
| `app/story.ts:188` | beats como `divino_intro` |
| `scripts/balance-levels.ts` | ajuste de balance |
| `tests/levelCap.test.ts` · `tests/casinoEterno.test.ts` | pruebas |

**Riesgos:**
- Las tablas sin tipo exhaustivo (`RARITY_H`, `RARITY_MASS`, varios `switch` y `?:`) caen **en silencio** a valores por defecto.
- `catPower` y `catGoldPerSec` leen `B.rarities.*[r]`: una rareza sin entrada da `NaN` en oro y poder, **con riesgo de que se guarde el NaN** (`state/econ.ts:27-31`).
- `tiersAmong` ordena con `BAL.rarities.order` y un tier ausente queda en −1, es decir, primero.
- Por todo esto, la **Opción A** tiene precedente probado (primordial) y no cambia ningún número de economía.

---

## 4. Combate: qué es dato y qué pide código

**Hallazgos:**
- Todas las reglas de una batalla viajan en un solo objeto plano, **`StageRules`** (`battle/sim.ts:206-231`). Tiene que ser dato puro porque el worker de estimación juega la misma batalla.
- **Las batallas de la Parte II son tablas TS declarativas**, no JSON: `RUPTURA_SPECS` (`state/sys/rupturas.ts:261`), `O2_SPECS` (`rupturasO2.ts:276`), `O3_SPECS` (`rupturasO3.ts:411`) y `O4_SPECS` (`rupturasO4Battles.ts:187`). Todas terminan en `STORY_BATTLES` (`storyBattles.ts:71`).
- `BossConfig` es un enum cerrado de los 6 jefes de la Parte I (`sim.ts:197-204`). Los jefes de la Parte II **no** lo usan: son batallas de historia con barco + reglas + banda. `buildStoryBattle` fuerza `boss:false` (`storyBattles.ts:214`).

**Reglas que ya existen:**

| Regla | Cómo se activa | Qué hace / valores | Fuente |
|---|---|---|---|
| Gravedad | gatos de Gravedad en `enemyCats` (no es campo de `StageRules`) | celdas FLOTANDO ×1.35, caída al agua o al vacío, pozo | `battle/gravedad.ts:1-23`, `GR_TUNE` `:39` |
| Cielo | `StageRules.sky: SkyCfg` | g 0.7, viento en capas [1.6, 1, −0.5], 2 islotes, caída al vacío con ≤25 %, variantes `invert`, `mass`, `correct`, `target` | `battle/cielo.ts:29-58`, `skyFor` `rupturasO2.ts:395` |
| FASES | `StageRules.fases` (`FaseDef`: `id, name, at{hp,turn}, telegraph, env{g, windMul, calm, bodies, portals, layer}, effects[], banner, endsBattle`) | progreso = máximo entre casco y vida perdidos; capas sea / sky / astral / glitch | `battle/fases.ts:52-106,191-224`, `fx/fasesFx.ts:31-36` |
| GOLPE FINAL al 80 % | `FaseDef.endsBattle` + `at:{hp:0.8}` | al entrar a la fase la batalla termina con `reason:'momento'`; si ganas antes, la fase igual se juega (commit `e2e08ef`) | `fases.ts:73-82,207-224,355`; `momentos/battle.ts:26-46` |
| SINCRO | `sincro.enabled` en `data/music/battles.json` (apagado por defecto, `:19`) | combo FUEGO+TORMENTA = SOBRECARGA (único) | `battle/sincro.ts:39-46`; `battles.json:207-210` |
| Sueños | `StageRules.dream` (`every`, `pool`, `el`, `seed`), armado según quién duerme en tu isla | 6 reglas fijas | `battle/suenos.ts:30-54`, `rupturasO4Battles.ts:46-58` |
| Umbral | `StageRules.umbral` (`correct`, `tachon`, `gale`, `chaos`, `hand`, `atk` por fase) | — | `battle/umbral.ts:27-45`, `rupturasO4Battles.ts:109-122` |
| Cristal · Multiverso | elementos de la tripulación | una mecánica por elemento | `battle/cristal.ts`, `battle/multiverso.ts` |
| Ruido | `StageRules.noise:{side}` | Sonido ×2; 3 golpes lo enfurecen | `battle/ruido.ts:20-30` |
| Cataclismo | `StageRules.cataclysm` (`meteors`, `moon`, `sun`, `tide`; `first`, `every`, `power`) | — | `battle/cataclysm.ts:34-48`; zonas 4–6 en `campaign.ts:77-90` |
| Simples | `wetDeck`, `wetAll`, `rod`, `regrow`, `demolisher`, `retreat` | — | `sim.ts:207-218` |
| `grade:'damage'` | `StoryBattleDef.grade/passPct/damageFragments` | pasa con % de daño (15 por defecto); sin muerte súbita | `storyBattles.ts:51-56,203,244` |
| `final_blow` | **no es** el golpe final al 80 % | contador de misión `<especie>_final_blow` (H38) | `campaign.ts:569-573`, `missionGoals.ts:57` |

**Cómo se definen jefes y dificultad:**
- **Parte I.** EP fijo por zona (§1.2), `COMBAT_TUNE`, `bossCrew` y armas elegidas en código (`campaign.ts:204-217,369-384`). Comportamiento hecho a mano en `battle/bossLate.ts` (548 líneas) + `battle/boss/rigs.ts`.
- **Parte II.**
  - `StoryBattleDef` (`storyBattles.ts:27-67`): `zone, stage, enemyCats, archetype|blueprint, powerMul, hpMulX, displayMulX, rules, intro, reward, grade, band, catrooms, wavePierce`.
  - Poder enemigo = `max(5, TuPoder·powerMul)·band.base` (`storyBattles.ts:171,191`). **Sigue a tu flota y nunca es un muro.**
  - **Bandas** (`state/sys/storyScale.ts:40-51`): historia ×1; jefe ×1.1, +2 niveles y ★; final ×1.56, +5 niveles y ★. Desde Nv50, el nivel enemigo = `min(100, L + lvl)` y las ★ suben hasta ★5.
- **Dato para la Parte III.** El Poder de flota medido es: (a) ~3.3–3.5 K · dueño 3.9 K · (c) 4.5–6.3 K.
  - Con la lógica de la Parte I (EP fijo), una escalera fija no le sirve a todos. Contra EP 6 K, la estimación da ~15 % a (a) y ~50 % a (c).
  - La Parte II resolvió esto escalando con tu Poder. Una opción intermedia: etapas normales con EP fijo calibrado a ~3–6 K, y jefes con bandas.

**Barato por dimensión** (dato o una entrada nueva en una tabla TS que ya existe):
- `enemyCats` (sus elementos activan solos Gravedad, Cristal, Multiverso y la afinidad).
- `powerMul`, `hpMulX`, `band`, `catrooms`.
- Uno de los 21 arquetipos o un `STORY_SHIPS` (`battle/shipgen.ts:168-372`).
- Combinar las reglas de la tabla.
- Música y SINCRO (`battles.json`).
- `intro`, `color`, `reward`.

**Medio** (un poco de TS):
- La paleta (`FACTION_PALETTE`, `campaign.ts:137`) y `styleFor` (`battle/anime/styles.ts:478-498`) se eligen **por zona**. Un estilo propio por dimensión necesita un campo para sobrescribirlos y una entrada nueva en `STYLES`.
- Hoy toda la Parte II se dibuja como «bone» (zona 6).

**Caro** (código nuevo):
- Una mecánica nueva en `sim.ts` + IA + chips + efectos visuales. Tamaños de referencia: `ruido` 120 líneas, `umbral` 266, `cielo` 292, `suenos` 321.
- Un efecto de fase (`FASE_EFFECTS`) o una capa visual nueva (`fasesFx`).
- Un cataclismo nuevo (`cataFx.ts` tiene 468 líneas).
- Un combo SINCRO distinto.
- Un jefe hecho a mano al estilo de la Parte I.
- Una ulti con escena propia (`battle/ults.ts:216`).
- Un Momento musical.
- Un elemento nuevo.

**Perillas reutilizables:**

| # | Perilla | Dónde | Rango típico | Ejemplo |
|---|---|---|---|---|
| 1 | `powerMul` | `storyBattles.ts:39` | 0.6–1.4 | Madre Nácar ×1.4 (`rupturas.ts:353`) |
| 2 | `hpMulX` | `storyBattles.ts:40` | 2–5 | `umbral_final` ×5 (`rupturasO4Battles.ts:245`) |
| 3 | `band` | `storyScale.ts:46-50` | historia / jefe / final | `cielo_masamadre` usa jefe (`rupturasO2.ts:367`) |
| 4 | `enemyCats` (elementos) | `storyBattles.ts:37` | 1–4 especies | `ruptura_sincronia` |
| 5 | `archetype` / `blueprint` | `content.json:12800`, `shipgen.ts:168` | 21 + 8 | `observatorio` (`rupturasO4Battles.ts:242`) |
| 6 | `cataclysm` | `cataclysm.ts:36-48` | 4 tipos; cada 3 turnos; `power` 0.4–8 | `CATA_ZONE` |
| 7 | `sky` | `cielo.ts:29-50` | g 0.7, capas de viento, islotes, `invert`, `mass` | Masa Madre (`rupturasO2.ts:379`) |
| 8 | `fases.env` | `fases.ts:52-60` | g 0.25–1, `windMul` 0–1.6, `calm`, `bodies`, `portals`, 4 capas | `UMBRAL_PHASES` (`rupturasO4Battles.ts:82-107`) |
| 9 | `fases.at` | `fases.ts:64` | hp 0.25–0.8 · turno 4–8 | el Umbral entra en 0.25/0.5/0.75 |
| 10 | `endsBattle` | `fases.ts:82` | sí/no, con hp 0.8 | `el_plan` (`rupturasO4Battles.ts:131`) |
| 11 | `umbral` | `umbral.ts:27-38` | correct 1–2 celdas, `atk` 1.1–1.5 | `UMBRAL_RULES` |
| 12 | `dream` | `suenos.ts:32-44` | `every` 2, pesos | `umbral_suenos` |
| 13 | `noise`, `retreat`, `wetAll`, `rod`, `regrow` | `sim.ts:207-222` | un lado; `retreat` en turno 7–8 | Bibliotecario, Raijin, Barco del Vacío |
| 14 | `grade`, `passPct`, `wavePierce` | `storyBattles.ts:51-66` | 15–30 % | `cielo_embajada` 30 % |
| 15 | Plan de música / SINCRO | `data/music/battles.json:129+` | `track`, `sincro.enabled` | `ruptura_sincronia` |
| 16 | IA y Mk enemigo (Parte I) | `campaign.ts:136,182`; `battle/ai.ts:27-32` | error de puntería 6° / 3° / 1.5° / 0.9°; Mk 3–5 | por zona |

---

## 5. Misiones, escenas y Momentos (lo reutilizable)

**Misiones**
- **Tipo.** `MissionDef` (`data/content.ts:106-117`): `id, chain, title, goal{type,…}, trigger, purpose, reward{std, gems…}, unlocks[], line, why, estTime`.
- **No hay `prereq` ni `next`.** Las misiones se encadenan con `trigger: "mission:H57"` y se pueden combinar con `&` (`state/sys/missions.ts:156`, `missionGoals.ts:113`).
- **Los goals de la Parte II** usan solo `use_feature`, `win_battle{battle}`, `wins_with_species` y `final_blow` (`data/rupturas/historia*.json`).
- **Tipos de goal** (`state/sys/missionGoals.ts:28-98`):
  - Contadores: `use_feature` → `feature_<x>`, `wins_with_species`, `final_blow`, `win_by`, `destroy_module`.
  - Flags: `win_battle` (por `stage`, `zone` o `battle` → `won_<id>`), `errand`, `event_complete`.
  - Estado: `cat_level`, `reach_kl`, `defeat_boss`, `watch`, `damage_pct`, `stages_cleared`, `species_owned`, `star_up`, `own_rarity`, `catdex_set`, `buy/clear_expansion`.
  - Un contador nuevo es una línea en `GOAL_HANDLERS`.
- **Campo `why`.** Se define en el JSON (`content.ts:117`). Se muestra en Misiones («Para qué», `panels/Missions.ts:131`), en el tip (`app/story.ts:458`) y en el glosario (`ui/story/glossary.ts:134`).
- **Activación y recompensa:**
  - `activate` (`missions.ts:190`) fija hasta 3 misiones, con prioridad para la historia.
  - `complete` (`:248`) paga `std` = 60 s de oro y comida, 15 % de gema y 5 orbes, y cada `unlocks` se convierte en `G.flag`.
- **Validador.** `game/scripts/verify-missions.ts` revisa que cada goal tenga evaluador y que alguien emita sus contadores y flags (`--all` para revisarlas todas).
- **Regiones.** Ya emiten `feature_region_<id>` (`regions/index.ts:5`).

**Estados del mundo** (`state/sys/worldState.ts`)
- **API.** `registerWorldState({id, priority, when(save), look, blend, prompt, clock})` (`:126`), `currentWorldState` (`:140`), `lookOf` (`:152`), `mixLook` (`:172`). `WorldLook` (`:29`) incluye exposición, tinte, cielo, estrellas, aurora, costura, luces, faro, gatos, ambiente y música.
- **Reglas.** Los ids son para siempre y `when` debe ser pura.
- **Bandas de prioridad.** O1 10–39, O2 40–69, O3 70–99, O4 100–129. A la Parte III le tocaría 130+.
- **Quién los consume.** La isla nocturna (`island/night/*`), el mapa (`island/night/mapNight.ts:58`) y el cine (`cine/runner.ts:368`).

**Cine** (`game/src/cine/`)
- **Guion.** `CineScript {id, stage:'island'|'region', replay, steps}` (`types.ts:153`).
  - `Step` (`:122`) puede ser `camera`, `drive`, `world`, `actor`, `fx`, `audio`, `say`, `interact`, `wait`, `parallel`, `seq`, `persist`, `ui` o `call`.
  - Ejemplo completo: `cine/scenes/amanecer.ts:20-53`.
- **Registro y arranque.**
  - `registerCine` (`registry.ts:13`) y `playCine(id, {replay})` (`cine/index.ts:108`).
  - Desde la historia se dispara con un beat ref `{special:'cine', cine}` en `ui/story/rupturasScript*.ts` (fusionado en `app/story.ts:88,126`).
- **Volver a ver.** `cine/replay.ts:17,42` y `panels/Replays.ts:18`, que junta prólogo + escenas vistas + Momentos. Un paso `persist` no corre durante una repetición.
- **Limitación.** Hoy solo hay *stages* `island` y `region`. Un cine en el mapa 2D necesitaría un *stage* nuevo (`CineStage`, `types.ts:169`).

**Momentos**
- **Registro.** `registerMomento(def)` (`momentos/registry.ts:10`); `MomentoDef` en `types.ts:174` (`id, track, title, mission, battle{id,fase}, score, stage(), unlocks`).
- **Reproducción.** `playMomento(id, opts)` (`momentos/index.ts:104`).
- **Momento de batalla.** `runBattleMomento` (`momentos/battle.ts:26`), conectado por `def.battle`; la fase necesita `endsBattle`.
- **`registerFaseInterlude(battle, fase, fn)`** (`battle/fases.ts:386`). Lo usan `songs/whenILose`, `hemkade` y `circusMalus`.
- **`registerFinaleMomento(fn)`** (`app/o4Finale.ts:59`, con `FinaleCtx` en `:35`). Lo usa `songs/yonoseTodo/finale.ts:31`.
- **Cómo se agrega uno:** crear `songs/<x>/index.ts`, importarlo en `songs/index.ts`, agregar la pista a `data/music/tracks.json` + `beatmaps/<id>.json` y elegir el gancho. Documento: `docs/part-ii/29-momentos-musicales.md`.

**Glosario y features**
- **Glosario.** `data/glossary.ts`: `GlossEntry` (`what/why/how/where/quip/gate`) con 73 entradas; de la Parte II solo están `el_crystal` y `el_gravity`. Más `BY_GOAL` (`:723`), `FEATURE_TERM` (`:781`) y `EXTRA` por misión (`:788`; no hay ninguna de H31 en adelante).
- **Presentaciones.** `ui/story/features.ts` (`FeatureIntro`, `FEATURES` solo de la Parte I). Lo ya explicado se guarda en `G.s.explained`.
- **Botones del HUD.** `state/ext/island.ts:140` (`hudUnlocks`, por Reino).
- **No hay un registro genérico de «features».**

**Fonoteca**
- **Pistas.** Se registran en `data/music/tracks.json` (hoy 7), que lee `audio/catalog.ts:68`.
- **Desbloqueo.** `unlockSong(ref, source)` (`audio/fonoteca.ts:78`): es idempotente y guarda en `ext.music` con espejo en localStorage.
- **Vías de desbloqueo:** tablas por oleada (`O1_SONGS` en `cine/sound.ts:136`, `O2/O3` en `ui/story/o2Cines.ts:116` y `o3Cines.ts:65`, `O4` en `app/oleada4Flow.ts:158`), `MomentoDef.unlocks` y `battles.json unlock`.
- **Panel.** `panels/Fonoteca.ts:46`.

**Reinicio narrativo y registro de premios**
- **Registro.** `state/sys/rupturasLedger.ts` guarda en `ext.rupturas.claimed` con claves `battle:<id>`, `cat:<id>`, `mission:<id>` y `pagina:<n>`.
  - Un premio único se paga una sola vez por partida aunque se repita la historia.
  - **Ojo:** `isPart2Mission` vale `true` para cualquier H ≥ 31 (`:25`), así que las misiones H66 en adelante también caerían en el registro y en el reinicio.
- **Reinicio.** `state/sys/rupturasReset.ts` es un parche que se aplica una sola vez:
  - Antes de tocar nada, guarda un respaldo en RESPALDOS.
  - Borra la posición narrativa: H31 en adelante, beats b31–b199 (`:78`) y los flags que cuidan escenas (`:89`).
  - Conserva todo lo demás y llena el registro de premios.
  - La Parte III debe decidir si su numeración entra o no en ese rango.

**Fusión de contenido** (`data/mergeContent.ts:43`)
- **Reglas:** solo agrega. Los arrays se concatenan, y un `id` repetido lanza `ContentConflict` en desarrollo y en tests (en producción solo avisa). Los objetos se fusionan de forma recursiva, y sobrescribir un escalar falla. Las claves que empiezan con `$` se ignoran.
- **Archivos.** `data/content.ts:9-21` importa los 8 JSON de `data/rupturas/`. La Parte III agrega los suyos ahí; `verify-missions.ts:30` los encuentra por la regex de imports.

**Guardados sin romper nada**
- **Migración.** `state/migrate.ts`: `SAVE_VERSION = 3`; un campo opcional nuevo no sube la versión.
- **Parches.** `state/patches.ts`: el id es para siempre, nunca se quita nada y el parche puede devolver una nota.
- **NOVEDADES.** `data/updates.ts`, con ids `YYYY-MM-DD-slug`.
- **Patrón de estado nuevo.** Un `G.s.ext.<ns>` más un normalizador en `afterLoad`.

**Diálogo y flujo de historia**
- `ui/dialog.ts`: `say` (`:249`), `tip` (`:490`), `newspaper` (`:645`).
- Hablantes: `ui/story/text.ts:95`.
- `app/story.ts`: `ON_NEW` (`:88`), `ON_DONE` (`:126`), `queueBeat` (`:425`).
- `app/storyFlow.ts`: `startStoryBattle` (`:22`, con verificaciones previas de vuelo y astral), `revealCat` (`:115`).
- **Batallas de historia.** Se registran con `STORY_BATTLES[id] = def`. Ganarlas pone el flag `won_<id>`, que es lo que lee `win_battle`.

---

## Anexo A · Capturas

Carpeta: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/cd9005fa-abeb-4c2a-8f35-47051cccbe24/scratchpad/capturas/`. Son 27 PNG de 1920×1080, fuera del repo. Se sacaron con Chrome sin pantalla (ANGLE Metal) y Vite en el puerto 5520, sin errores de consola. Los scripts para repetirlas están en `<scratchpad>/shots/` (`shot.mjs`, `final2.mjs`, `vite.shot.config.mjs`).

**Parte I (`MapScene`, «Diario del Mar · Carta del Primer Mar»)**

| Captura | Qué muestra |
|---|---|
| `mapa-parte1-lategame-carta-completa-sin-hud.png` | **La mejor para ver el diseño.** Las 6 zonas en «U», los 54 nodos, élite (escudo con ★) en la 5, calavera de jefe en la 9, cintas de jefe tachadas, chinchetas de Encargos y rutas rojas. El 6-9 está abierto, con anillo rojo y el barco |
| `mapa-parte1-lategame-carta-completa.png` | la misma vista con HUD |
| `mapa-parte1-postboss1-carta-completa.png` | zona I terminada, II abierta y III–VI bajo niebla con «???» y su frase («Aquí caen estrellas»…) |
| `mapa-parte1-postboss1-zona2.png` | zoom 1.5 sobre la II: 2-1 en la frontera (anillo rosa y barco), 2-2…2-8 punteados, Encargos, la III con niebla |
| `mapa-parte1-postboss1-nodo-2-1-seleccionado.png` | tarjeta de etapa: NORMAL, capitán, IA, 110 contra 74, «ESTIMACIÓN 3 %», botín, ¡ZARPAR! |
| `mapa-parte1-postboss1-jefe-2-9-bloqueado.png` | tarjeta del jefe bloqueado: sello JEFE, ANÁLISIS DEL JEFE, Reino recomendado 11, BLOQUEADA |
| `mapa-parte1-zone2par-zona2.png` | zona II a la mitad: 1–8 ✓ y el jefe abierto |
| `mapa-parte1-poststory-default.png` · `mapa-parte1-poststory-carta-completa.png` | todo terminado, los jefes tachados |
| `mapa-parte1-lategame-default.png` · `mapa-parte1-lategame-zona1.png` · `mapa-parte1-lategame-zona6.png` | zoom 1.5 por zona |
| `mapa-parte1-lategame-jefe-6-9-seleccionado.png` | el Primer Mar: 7 700 contra 3 020, «ESTIMACIÓN 20 % (5/40)» |
| `mapa-parte1-lategame-elite-4-5-seleccionado.png` | élite con su regla y ASALTO RÁPIDO |

**Parte II (las hojas de la carta)**

| Captura | Qué muestra |
|---|---|
| `carta-parte2-ro4-vista-general-sin-hud.png` | **Vista general** a zoom 0.5, que el juego no permite (su mínimo es 1). La carta de la Parte I a la izquierda; Lo de Arriba sobre El Cielo sobre el Mar de las Rupturas; Las Fronteras a la derecha |
| `carta-parte2-ro4-default.png` | abre sola en Las Fronteras porque la historia espera ahí: chincheta «!» sobre el Archipiélago de los Sueños |
| `carta-parte2-ro4-hoja-rupturas.png` · `-hoja-cielo.png` · `-hoja-lo-de-arriba.png` · `-hoja-fronteras.png` | cada hoja encuadrada |
| `carta-parte2-ro4-zoom1-arriba-derecha.png` | las costuras con cinta y las notas a mano («(ver folio 000)», «—N.», «¿y esta isla?») |
| `carta-parte2-rmid-default.png` · `carta-parte2-rmid-zoom1-borde-derecho.png` | solo la Isla de las Páginas: «Mar abierto. Aquí no hay nada.» tachado, «SIEMPRE ESTUVO AQUÍ.» y la costura |
| `carta-parte2-rfin-default.png` · `-hoja-rupturas.png` · `-isla-nacar.png` · `-zoom1-borde-derecho.png` | Páginas + Nácar |

**Lo que se vio al capturar:**
- **Todo es un solo lienzo con cámara**; no hay pestañas. «Cambiar de hoja» es mover la cámara (`focusZone`, `focusIsle`, `toggleZoom`), y el zoom del jugador va de 1 a 2.
- Al entrar aparecen diálogos de historia, la tarjeta «¡NUEVA ZONA EN LA CARTA!» y avisos de Luzterna.
- En `rupturas-o4` el juego se fue solo a la isla unos 20 s después de entrar. Es un flujo de historia de las oleadas 3–4 y no se investigó.

## Anexo B · Reproducir las mediciones

- **Sondas:** `<scratchpad>/probe/` (`vitest.config.mjs` con `root`/`cacheDir` en scratch y `define __BUILD_ID__`).
  - `probe.test.ts`: fixtures.
  - `probe2.test.ts`: perfiles sintéticos.
  - `probe3.test.ts`: export del dueño.
  - `probe4.test.ts`: variantes de (c).
- **Comando:** `"game/node_modules/.bin/vitest" run --config <scratchpad>/probe/vitest.config.mjs`. No escribe nada en `game/`.
- **Supuestos de los perfiles sintéticos:**
  - Se parte de `rupturas-o4.json` y se adoptan especies (con `free`) hasta N.
  - Las estrellas se reparten de la rareza más alta a la más baja, y los niveles se recortan con `catLevelCapFor`.
  - Los gatos viven en hábitats de su elemento principal con el tier indicado.
  - Momentum 1, sin banqueros, sin accesorios ni Podio.
