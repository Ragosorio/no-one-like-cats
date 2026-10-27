# La palabra «dimensión» en el juego actual (y cómo no chocar con ella)

**Para qué sirve.** La Parte III va a agregar «dimensiones» nuevas (Borracha, Superhéroes, Anime, Libros y POP) en un segundo mapa 2D. El juego **ya usa** «dimensión» para al menos cuatro cosas distintas, y además hay ids que no se deben pisar. Lo verifiqué con grep y el grafo de código el 2026-10-13. Las rutas cuelgan de `game/src/`.

---

## 1. Las islas como «dimensiones» (Parte I)

En el código, cada expansión de la isla de casa es una «dimensión» de estilo. Usan el tipo `DimId` (`island/dimensions/defs.ts:6`), y cada id es el `biome` de su expansión en `content.json › expansions[]`.

| `DimId` | Nombre en pantalla | Expansión (`content.json`) |
|---|---|---|
| `home` | COZY ISLA | (tu isla) |
| `forest` | DIMENSIÓN VALLE | `bosque_costero` |
| `cliff` | DIMENSIÓN TINTA | `acantilado_rocoso` |
| `volcano` | DIMENSIÓN INFERNO | `isla_volcanica` |
| **`ghost`** | **DIMENSIÓN NEÓN NOIR** | **`puerto_mareas`** (Puerto de las Mareas, expansión 4) |
| `ice` | DIMENSIÓN AURORA | `glaciar_bigote` |
| `ruins` | DIMENSIÓN GLITCH | `ruinas_arcanas` |
| `reef` | DIMENSIÓN PRISMA | `arrecife_prismatico` |
| `cosmic` | DIMENSIÓN ESTELAR | `atolon_estelar` |
| `sakura` | DIMENSIÓN ACUARELA | `jardin_sakura` |
| `desert` | DIMENSIÓN SEPIA | `oasis_dorado` |
| `candy` | DIMENSIÓN CARAMELO | `isla_caramelo` |
| `void` | DIMENSIÓN VACÍO | `abismo_ronroneo` |

**Quién los usa:**
- `island/terrain.ts:57–164`: el archipiélago es un conjunto de islas flotantes, cada una con su «burbuja de cielo». Las islas cerradas son «portales de papel sellados».
- `island/ambient.ts:176–423`: la atmósfera de cada isla y los carteles «DIMENSIÓN X» en la vista general.
- `island/sea.ts:2`: el fondo es «el vacío entre dimensiones».
- `island/night/index.ts:578–580`: de noche, cada dimensión tiene su luz, de tipo `'dim'` (`island/night/lights.ts:18`).
- `island/chatter/lines.ts:47–110` (`DIM_LINES`): frases de los gatos según la dimensión donde están parados, con un 32 % de probabilidad.

## 2. La dimensión «fantasma»

- Es el `DimId` **`ghost`**, que en pantalla se llama «DIMENSIÓN NEÓN NOIR»: luces de ciudad flotante, niebla espectral y neón que parpadea (`island/dimensions/defs.ts:144–167`). Sus frases son las de `DIM_LINES.ghost` (`island/chatter/lines.ts:69–73`: «Me siento protagonista de Blade Runner», «PA-GA LA LUZ»).
- Es el fondo del Puerto de las Mareas, la expansión 4, la que abre las expediciones.
- **Por qué importa:** en el HOTFIX-VIVO (1), el dueño buscaba las islas de la Parte II en su archipiélago, «el fondo de la dimensión "fantasma"», y no estaban ahí: viven en la CARTA (`docs/part-ii/agentes/HOTFIX-VIVO.md:7`). **Si la Parte III dice «dimensión» y las pone en un mapa distinto, va a repetir esta confusión** si no se ven desde casa o no se explica dónde están.

## 3. Las «dimensiones» por elemento (estilos de impresión)

Cada elemento «arrastra su dimensión» a la pantalla (`panels/collection/dimension.ts:1–58`; es el «multiverso de estilos»). La lógica viene del canon de b18: cada caja se imprime con su tinta y el mundo se reimprime con el estilo del gato que ataca.

| Elemento | Nombre de su dimensión |
|---|---|
| fire | **ANIME INFERNO** |
| water | NOIR OCEÁNICO |
| nature | ACUARELA |
| earth | DIARIO DEL MAR |
| storm | **CÓMIC SILVER AGE** |
| magic | ORQUÍDEA REAL |
| cosmic | NEÓN GLITCH |
| ice | AURORA |
| sound | **PÓSTER DE CONCIERTO** (risografía, city-pop) |
| shadow | TEATRO DE SOMBRAS |
| time | DAGUERROTIPO |
| light | VITRAL |
| void | NOIR INVERTIDO |
| crystal (Parte II) | NÁCAR PRISMÁTICO |
| gravity (Parte II) | CIANOTIPO ORBITAL |

**Dónde aparecen:**
- **En los datos:** `content.json › elements[].dimension` (`content.json:62–587`), `data/rupturas/especies.json:11` y `especies-o2.json:11`.
- **En pantalla:**
  - la secuencia de estrellas: «★5 · DIMENSIÓN {nombre}» (`fx/sequences/starUp.ts:24–498`);
  - el descubrimiento de un elemento, que abre una grieta «a la dimensión del elemento» (`fx/sequences/elementDiscovery.ts:96–130`);
  - el panel del gato (`panels/CatPanel.ts:2`);
  - los pósters de sets (`panels/collection/setPoster.ts:39`);
  - las arenas del Podio, una «dimensión» por elemento (`podio/arena.ts:2`).
- **En los títulos de los beats:** los campos `style` de `historia*.json` reusan estos nombres («NOIR OCEÁNICO → CIANOTIPO ORBITAL»).

**Otros usos sueltos:**
- el casino es «la dimensión neón-glitch» (`scenes/CasinoScene.ts:2`);
- las decoraciones tienen un campo `dim` con el nombre de su estilo: COZY ISLA, ANIME INFERNO, MANGA TINTA, PÓSTER RETRO, EDITORIAL SUIZO… (`state/sys/decor.ts:33–35, 63+`);
- la portada muestra «DIMENSIÓN INFERNO / TINTA / GLITCH / COZY» (`scenes/TitleScene.ts:82`);
- el hábitat de nivel 9 se llama «Ancla Dimensional» (`island/habitatTiers.ts:684`);
- dos accesorios mencionan «otra dimensión» (`state/sys/accessories.ts:42, 47`);
- los laboratorios de desarrollo se llaman «DIMENSIONES» (`scenes/ArtLab.ts:16`, `scenes/DevLab.ts:49`).

## 4. «Parte 2» en el código = las Grietas del Multiverso, no la Parte II

- Los encabezados de las Grietas (H23–H28) dicen «Parte 2»: `state/sys/grietas.ts:2`, `battle/multiverso.ts:2`, `ui/story/grietasScript.ts:2`, `ui/story/text.ts:113`, `battle/ults.ts:52` («LEGENDARIOS DEL MULTIVERSO»), `battle/sim.ts:16`, `battle/ai.ts:191`, `battle/catShots.ts:16` y `battle/fx/multiversoFx.ts:2`.
- Sus flags son `grieta:<elemento>` y `grietas_open` (`data/glossary.ts:583, 717`), y su entrada de glosario es `grietas`.
- **Contradicción ya presente:** la Biblia prohibía reusar `part2` (`docs/part-ii/05-biblia-parte-ii.md:21`), pero el código de la Parte II lo usa para **la Parte II**: `PART2_FIRST`, `isPart2Mission` (`state/sys/rupturasLedger.ts:16–25`) y `isPart2Beat` y `part2Battles` (`state/sys/rupturasReset.ts:60–85`). Hoy «Parte 2 / part2» significa dos cosas.
- **«Multiverso»** también está ocupado: son los 6 elementos de las Grietas (`battle/multiverso.ts`), los «gatos de otros multiversos» del casino (`panels/casino/intro.ts:12`) y el «multiverso de estilos» de §3.

## 5. Ids que contienen `dim` o `dimension`

| Id o símbolo | Dónde | Qué es |
|---|---|---|
| `DimId`, `DimDef`, `DIMS`, `dimOf`, `VEIL` | `island/dimensions/defs.ts` | Las 13 dimensiones de isla |
| `dimWorld`, `camOf`, `RegionLook` | `island/dimensions/state.ts` | El estado del mundo por dimensión |
| `Dimension`, `dimensionOf`, `dimensionBackground` | `panels/collection/dimension.ts` | Las 15 dimensiones por elemento |
| campo `"dimension"` | `content.json` (13 elementos), `especies.json`, `especies-o2.json` | Texto de dirección de arte |
| campo `dim` | `state/sys/decor.ts:34` | El estilo de cada decoración |
| `LightKind 'dim'` | `island/night/lights.ts:18` | La luz nocturna de cada dimensión |
| opción `dim` de `say()` | `ui/dialog.ts` (por ejemplo `{ dim: 0.2 }`) | La opacidad del velo del diálogo; no es un id, pero aparece en todo el código |
| carpeta `island/dimensions/` | — | El módulo de las islas |

**En las partidas** (`game/test-saves/*`) no hay ninguna clave con `dim`. **[C]**

## 6. Otros ids que la Parte III no debe pisar

- **Regiones de la Parte II:** `paginas`, `nacar`, `reflejo`, `invertidas`, `corona`, `cometa`, `suenos`, `olvidada` y `umbral` (`regions/index.ts:9`). Con ellas van los flags `region:<id>`, `region_visited:<id>`, `carta_<id>` y `feature_region_<id>`, y el campo `ext.rupturas.known`.
- **Hojas de la CARTA:** «MAR DE LAS RUPTURAS», «EL CIELO», «LO DE ARRIBA» y «LAS FRONTERAS» (`scenes/MapScene.ts:5–11`, `regions/mapO4.ts:2`). Al segundo mapa 2D conviene darle **otro nombre** que no sea «CARTA».
- **Misiones y beats:**
  - `missions.ts:280` solo reconoce como misión los ids `^[HCKE]\d\d$`. **H100 o más se trataría como flag**, así que la Parte III solo tiene libres **H66–H99**: 34 ids.
  - **Todo `H31+` cuenta como Parte II** para el registro de premios y el reinicio narrativo (`rupturasLedger.ts:16–25`), y **todo `b31_…` hasta `b199_…`** cuenta como beat de la Parte II (`rupturasReset.ts:74–79`). Hay que acotar esos rangos antes de usar H66+ y b66+, o elegir otro esquema de ids para los beats.
- **Batallas y estados del mundo:** las batallas usan los prefijos `ruptura_*`, `cielo_*` y `umbral_*`; los estados del mundo usan `noche_astral`, `o2_*`, `o3_*` y `o4_*`.
- **Palabras ya tomadas que se parecen a las dimensiones nuevas:**
  - **Anime:** la dimensión ANIME INFERNO (fire), el comentario «VALLE ANIME» (`island/dimensions/defs.ts:72`), la carpeta del motor de Momentos `momentos/anime/` y el render de batalla `battle/anime/`. **No uses `anime` solo como id.**
  - **POP:** la etiqueta `tag: 'pop'` del chatter (`data/chatter.ts:10`), el efecto de sonido `sfx('pop')` (`ui/dialog.ts:419`), los «bolsillos pop» de la Biblia (`05:183`), el «libro pop-up» de la vista página (`05:66`) y «city-pop» en PÓSTER DE CONCIERTO. **No uses `pop` solo como id.**
  - **Superhéroes:** CÓMIC SILVER AGE (storm), «Viñetaria (lente cómic)» de la Biblia y el estilo cómic de te ODIO. No hay choque de id, pero sí de estilo visual.
  - **Libros:** la Isla de las Páginas Hundidas, la Biblioteca, el Diario Perdido, DIARIO DEL MAR (earth), DIMENSIÓN TINTA (cliff) y el canon de que «el Archivo es una biblioteca u hospital». Riesgo narrativo alto de confundirla con Páginas Hundidas.
  - **Borracha:** 0 coincidencias.
- **`caja_`** ya existe (`caja_legendaria` en `state/sys/decor.ts:63`, `caja_buys` en `state/sys/casino.ts:995`). Aunque el canon diga que cada mundo es «una caja», no conviene usarlo como prefijo.

## 7. Prefijo recomendado

**Ids internos: `p3d_<slug>`.** Por ejemplo: `p3d_borracha`, `p3d_heroes`, `p3d_anime`, `p3d_libros` y `p3d_pop`.

- **Flags:** `p3d:<slug>` (abierta) y `p3d_visto:<slug>`, con la misma forma que `region:<id>` pero en otro espacio.
- **Datos de partida:** `G.s.ext.p3d` (opcional y normalizado, como `ext.rupturas`).
- **Tipo TS:** `P3DimId`. No reuses `DimId`, `Dimension` ni `dimensionOf`.

**Por qué este prefijo:**
- `p3d` tiene **0 coincidencias** en `src/`, `tests/`, `scripts/` y `test-saves/`. Solo existe `'p3'` como id de un gato de prueba en `dev/devBattle.ts:34`, y sin la `d`.
- No contiene `dim`, `region`, `grieta`, `part2`, `rupturas`, `multiverso` ni `caja`. Un grep de cualquiera de esos no lo mezcla.
- Lleva el número de la parte, así que no repite la ambigüedad de «Parte 2».

**Recomendaciones de nombres:**
- Cuando la Parte III tenga nombre propio, conviene que su carpeta de código use una palabra única, como la Parte II usó `rupturas`, y dejar `p3d_` solo para las dimensiones.
- **En pantalla,** no repitas los nombres «DIMENSIÓN X» de §1 ni los 15 de §3. Si la Parte III escribe «DIMENSIÓN ANIME», va a convivir con «ANIME INFERNO» y «DIMENSIÓN VALLE».
- Otra opción es llamarlas en pantalla con un sustantivo propio (por ejemplo «otra caja» o «mundo»), y apoyarse en el canon de b18: «cada caja es un mundo dibujado con su propio trazo» (`content.json:19321`).
