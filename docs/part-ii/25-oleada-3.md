# 25 · Oleada 3 «La Era Astral» (H50–H57) — diseño e implementación (INTERNO — contiene spoilers)

**Estado (2026-10-09):** jugable de punta a punta. Misiones, beats, batallas, Combustible Astral, Taller Cometa, Kit Astral, Canelo Astral, Maneki, el jefe multi-capa y el mecanismo genérico de FASES (que ya usan la Oleada 4 y la música). Pruebas: `game/tests/rupturasO3.test.ts` (15). Sin commit.

## 1. La oleada en una tabla

| Misión | Meta | Qué tiene de nuevo | Premio |
|---|---|---|---|
| H50 Puerto Cometa | `use_feature region_cometa` (el IR te lleva a la región 3D) | Llegada al astillero retrofuturo. Escafandra (casco de pecera) regala **el primer tanque (40)** y **el Kit Astral** en tu aerobarco; después se abre el **TALLER COMETA** | std + 2 gemas · regalo único (registro) |
| H51 Sincronía | `win_battle ruptura_sincronia` | Muelle de pruebas: gravedad ×0.5, sin viento. Enseña la **SINCRO** (Fuego + Tormenta = Sobrecarga; `battle/sincro.ts` + plan musical de LIKY FIGHT) | Tanquecito · 3 gemas |
| H52 La Estrella que empujaron | `win_battle ruptura_estrella` | **Primera batalla astral**: ×0.25, sin viento, un **planetoide remolcado** (deriva por turno) con **pozo orbital**. Revelación: la Estrella se «reubicó» para salvar la caja 7.312 | Satélito + 20 cristales Cósmicos · 15 de combustible (1.ª vez) · 4 gemas |
| H53 Canelo Astral | `use_feature sello_canelo` | Interacción: **romper el sello** con Canelo (3 toques, grietas, estallido). Desbloquea `forma:canelo_astral` → revelación de forma (`formsFlow`). De noche, Canelo mira el peñasco | 3 gemas |
| H54 Maneki, el conserje | `use_feature ficha_maneki` | Interacción: **barrer la ficha clínica** del Archivo (5 renglones bajo polvo de estrellas). El Archivo es un hospital; la caja del jugador «está sanando» | Maneki se une si no la tenías (registro `cat:mission_H54`) · 3 gemas |
| H55 Los Disruptores | `win_battle ruptura_disruptores` | Facción nueva. **2 fases**: vacío con escombros → al 50 %, **fase GLITCH**: se abren **grietas** (portales) que voltean el dueño del tiro | Grafitera · 15 de combustible · 5 gemas |
| H56 La nota al margen que es tuya | `use_feature firma_bitacora` | Interacción: **firmas la bitácora** (tu nombre, letra a letra, en manuscrita) y aparece al margen una nota vieja **con la misma letra**: «Que esta caja llegue lejos.» Silencio (duck) | 2 gemas |
| H57 El Leviatán Invertido | `win_battle ruptura_leviatan` | **Jefe multi-capa**: mar → (34 %) cielo ×0.7 + viento ×1.6 + nube → (67 %) grieta astral ×0.25 sin viento + planetoide. Cada cambio: destello, cartel, nuevo fondo, señal musical | Jonás (legendario) · 15 de combustible · 10 gemas · `oleada3_fin` |

Ganchos de cuándo suena cada beat: `ui/story/rupturasScriptO3.ts`. Beats con `$scene` para la pasada de cine. Pregunta de la oleada (¿quién escribe en los márgenes?), respuesta (los Titiriteros; el Archivo es un hospital) y pregunta mayor (¿y el jugador qué tiene que ver?: tu letra) según doc 13.

## 2. Combustible Astral (recurso blando) y Kit Astral

**Partida:** `G.s.ext.astral = { fuel, at, kit: { level, ships, at } }`. No existe hasta H50 (las partidas sin Oleada 3 quedan byte a byte). `normalizeAstral()` (pura) repara cualquier basura al cargar (`G.afterLoad`); nunca inventa un kit.

| Concepto | Número |
|---|---|
| Regalo de llegada (H50) | 40 (una vez por partida: `fuel:mission_H50`) |
| Refinería | +1 cada 4 min de tiempo real (15/h), también fuera del juego, hasta el tanque. Empieza al completar H50 |
| Tanque | 60 (Velas Solares: 150). Un premio o una compra pueden pasar del tanque; la refinería se detiene mientras está lleno |
| Viaje al vacío (batalla astral pura: H52, H55) | 10 (Velas Solares: 5). Se cobra al zarpar (`astralPreflight`) |
| Compra en el Taller | 10 por ~4 min de oro (mín. 1 500) — sumidero de oro (biblia §11) |
| 1.ª victoria de H52 / H55 / H57 | +15 (registro `fuel:<batalla>`) |
| **Sin pared** | Si falta combustible y oro, **Escafandra fía el viaje** (contador `viajes_fiados`). H57 no cobra: el Leviatán te arrastra |
| ETERNO | Sí está en riesgo (biblia §11): ×2 al ganar, 0 al perder. Registro genérico `ETERNO_EXTRA` en `state/sys/casino/eterno.ts` (la confirmación lo lista solo si tienes). Gatos, formas, Nácar y Tinta nunca |

**Kit Astral** (sobre el Kit de Vuelo de la Oleada 2; tu barco conserva id, nombre, tripulación, diseño e historial):

| Nivel | Qué hace | Costo |
|---|---|---|
| 1 KIT ASTRAL | Nave astral: requisito de las batallas astrales | Gratis el primero (regalo). Otro barco: 30 min de oro + 150 chatarra + 10 combustible |
| 2 ESCUDO DE COMETA | El primer impacto rival a tu casco **en cada capa** se deshace (`fases.shield`) | 1 h de oro + 400 chatarra + 20 combustible |
| 3 VELAS SOLARES | Viaje a mitad de combustible, tanque 150 | 2 h de oro + 800 chatarra + 12 planos + 40 combustible |

Un barco sin Kit de Vuelo no puede ser nave astral («Primero tiene que volar»). Una partida rara sin ningún aerobarco recibe en H50 también el kit de Hélice (nunca se traba).

**TALLER COMETA** (`panels/CometaShop.ts`): tarjeta de la nave (dibujada en código, retrofuturo), conversión, 3 niveles, medidor del tanque con la refinería en vivo, compra, aviso de ETERNO. Se abre: tras la llegada (H50, una vez), en el `astralPreflight`, desde el IR (`taller_cometa`), y desde el POI «Taller del Casco de Pecera» de la región (`regions/cometa.ts` llama `openTallerCometa()` de `rupturasO3.ts`).

## 3. Interacciones, gatos y forma (`app/oleada3Flow.ts`)

- Vigilante con calma (isla, carta o región 3D; sin paneles, diálogos ni secuencias). Cada interacción se abre sola tras la parte *a* de su beat, y desde el IR de la misión fijada (`IslandScene` → `goFeature`). Cerrarla la pospone 90 s.
- **Sello** (H53) · **Ficha** (H54) · **Bitácora** (H56): `completeFeature(f)` cuenta `feature_<f>` y completa la misión. La firma usa `G.s.player.name` en `Permanent Marker`; la nota al margen sale en la misma tipografía.
- **Maneki** (H54): `claimO3Cat('s_maneki')` una vez por partida; si ya la tenías, no se duplica (solo se marca).
- **Canelo Astral**: `formas.ts` ya no está sellada; la abre la bandera `forma:canelo_astral` (unlock de H53). Ulti **BOLA DE PELO DE HORIZONTE** (`ULTS.canelo_astral`): sus bolas entran a una grieta junto a él y caen en picada desde otra, ~520 px encima de donde aterrizaría tu tiro: pasan por encima de islotes, planetoides y cobertura. Determinista, mismo tope de ulti. Poder ×1.12.
- **Música (doc 18):** desbloqueos de misión `liky_fight.explore` (H50), `te_odio.explore` (aparece H55), `amb.archivo` (H54), solo si el catálogo conoce la versión (`audioApi.beatMap`). La bitácora hace `duck` 18 dB. Las batallas (H51 SINCRO, H52 te ODIO, H55, H57 Hemkade por fases con `fase:cielo`/`fase:grieta`) viven en los planes de `src/data/music/battles.json` (agente BATTLE-MUSIC), que escuchan `onFase`.

## 4. FASES — mecanismo genérico de batallas por fases (`src/battle/fases.ts`)

Una batalla declara `StageRules.fases` (datos planos: el estimador recibe el spec por *structured clone*, sin funciones):

```ts
rules: {
  fases: {
    side: 1,                       // de quién se mide el daño (el jefe)
    shield: [1, 0],                // ESCUDO por capa [jugador, rival] (Kit Astral Nv2)
    phases: [
      { id: 'mar',    name: 'El mar',          env: { layer: 'sea' } },
      { id: 'cielo',  name: 'El cielo',        at: { hp: 0.34 }, telegraph: '…', env: { g: 0.7, windMul: 1.6, layer: 'sky', bodies: [{ up: 420, r: 60, hp: 0.04, look: 'cloud' }] } },
      { id: 'grieta', name: 'La grieta astral', at: { hp: 0.67 }, env: { g: 0.25, calm: true, layer: 'astral', bodies: [{ up: 380, r: 46, well: { r: 330, k: 900 }, look: 'planet' }] } },
    ],
  },
}
```

| Campo | Qué hace |
|---|---|
| `phases[0]` | Entorno inicial (`at` se ignora). |
| `at.hp` | Entra cuando el lado vigilado va así de cerca de perder (0..1): `max(casco perdido rumbo al hundimiento, vida de tripulación perdida)` — la misma medida de las fases de los jefes de la Parte I. |
| `at.turn` | …o al empezar ese turno (lo que pase primero). Se pueden cruzar varias fases de un golpe: cada una se anuncia. |
| `env.g` | Gravedad del campo (`Battle.field.gMul`): 1 mar · 0.7 cielo · 0.25 astral. |
| `env.windMul` / `env.calm` | Multiplicador del viento para todo proyectil · `calm`: viento 0 y no deriva (el espacio). |
| `env.bodies` | Planetoides / bancos de nubes entre los barcos: paran tiros (la onda de Sonido y la fase de Vacío pasan), opcionalmente se rompen (`hp`, fracción de la estructura media), derivan por turno (`drift`) y llevan un **POZO ORBITAL** (`well`, un `Battle.wells`): un tiro puede darle la vuelta. |
| `env.portals` | Dos grietas: el tiro que entra por una sale por la otra **y cambia de dueño** (`Battle.portals`). |
| `env.layer` | Clave de presentación: `sea` · `sky` · `astral` · `glitch` (la pinta `battle/fx/fasesFx.ts`). |
| `effects` | Efectos de una vez al entrar, por nombre (`FASE_EFFECTS`: `heal10`, `clearWells`). Regístralos en un módulo de `battle/` que el sim importe (si no, el worker no los tiene). |
| `shield` | ESCUDO: los primeros N impactos rivales al casco de ese lado, **por capa**, se deshacen. |
| `banner` | `false` = la vista cambia la capa pero no pone cartel (las reglas de la batalla lo anuncian). Los efectos de `FASE_SELF_BANNER` (hoy `umbral`) hacen lo mismo. |

**Ganchos del sim** (`sim.ts`, una línea cada uno): constructor `fasesInit` · `startTurn` `fasesStartTurn` (+ `fasesCheck` al final) · `integrate` `fasesFlight` (viento × capa, colisión con cuerpos) · `resolveImpact` `fasesImpact` · `fire` `fasesCheck`. Todo determinista: la pantalla y el estimador juegan la misma pelea (pruebas en `tests/rupturasO3.test.ts`).

**Evento del sim:** `{ k: 'boss', what: 'fase', side, n: <fase nueva>, amount: <fase anterior> }`.

**Evento para presentación y música:** la vista escenifica el cambio (destello, cartel «CAPA n · NOMBRE», nuevo fondo) y entonces llama `emitFase()`. Escuchar con:

```ts
import { onFase } from '../battle/fases';
const off = onFase(({ battle, index, from, id, name, layer, count }) => { /* cue Hemkade drop2… */ });
// o, sin importar nada: window.addEventListener('nolc:fase', (e) => (e as CustomEvent).detail)
```

También se emite la fase inicial al empezar la batalla (`from = -1`). El estimador nunca emite (no tiene vista).

**Lectura para la vista / pruebas:** `fasesState(b)` (fase, capa, cuerpos en vivo, escudo, turnos de entrada) · `fasesChips(b)` (chips de reglas) · `currentFase(b)` · `faseIndex(b)` · `fasesProgress(b, side)`.

**Vista** (`battle/fx/fasesFx.ts`, enganchada en `BattleScene`): capa de fondo bajo las olas (`sea` nada · `sky` degradado azul + bancos de nubes y olas de nube · `astral` espacio, nebulosa, grieta, estrellas que titilan; las gaviotas se esconden · `glitch` astral + scanlines y franjas RGB), los cuerpos (planetoide con anillo, nube, escombros que giran; arriba de los remolinos de pozo), y el cambio de fase: destello → cambio de capa → cartel «CAPA n/N · NOMBRE» + línea → `emitFase`. `BattleScene.checkBossPhase` espera la escenificación antes del siguiente turno. Una fase con `banner: false`, o con un efecto de `FASE_SELF_BANNER` (hoy `umbral`: la Oleada 4 pinta su propio cartel), solo cambia la capa. Las grietas (`env.portals`) se dibujan con `RiftFx` (los anillos de portal, etiquetados «GRIETA»). Chips de reglas: `fasesChips`.

## 5. Las cuatro batallas (`state/sys/rupturasO3.ts › O3_SPECS`)

| Batalla | Barco / capitán | Tripulación | Reglas | ×poder · ×casco |
|---|---|---|---|---|
| `ruptura_sincronia` (H51) | El Muelle de Pruebas · Escafandra | Escafandra, Tanquecito, Satélito, Plasmín | 1 fase: ×0.5, sin viento | ×1.2 · ×2.5 |
| `ruptura_estrella` (H52) | La Remolcadora | Satélito ×2, Astral, Meteoro | Vacío ×0.25 sin viento + planetoide remolcado (deriva ±110 px, periodo 2 turnos) con pozo orbital r 330 k 950 · Lluvia de meteoritos cada 3 | ×1.2 · ×3 |
| `ruptura_disruptores` (H55) | La Lata de Pintura · Brecha | Brecha, Grafitera, Hueco, Eco Mudo | Vacío con 2 escombros rompibles → al 50 % fase GLITCH con grietas (portales que voltean el dueño) · La luna cada 3 | ×1.1 · ×3 |
| `ruptura_leviatan` (H57) | El Leviatán Invertido | Cascada, Brecha, Masa Madre, Meteoro (las cadenas: tripulación de varios mundos) | Mar → 34 % cielo (×0.7, viento ×1.6, nube rompible) → 67 % grieta astral (×0.25, sin viento, planetoide r 50 con pozo r 350 k 1000; `clearWells`) · Marea negra cada 3 | ×1.2 · ×3.5 |

Batallas astrales puras (necesitan nave astral + viaje): H52 y H55. ESCUDO DE COMETA con Kit Nv2+ en todas las que tienen capa astral.

## 6. Balance (simulaciones sin cabeza)

`npx vite-node scripts/balance-astral.ts -- --seeds 32 [--kit 1|3] [--only id] [--mul id=x]` sobre `test-saves/post-finale.json` (tripulación post-historia), Kit Astral Nv1, puntería normal y difícil, 32 semillas cada una (2026-10-09):

| Batalla | Normal | Difícil | Turnos | Capas alcanzadas |
|---|---|---|---|---|
| Sincronía ×1.2 | 32/32 | 32/32 | ~3.9 (examen corto: cae por K.O. de tripulación) | 1 |
| La Estrella ×1.2 | 29/32 | 30/32 | ~6.2 | 1 (≈4 impactos al planetoide por pelea) |
| Disruptores ×1.1 | 29/32 | 30/32 | ~6.9 | 2/2 siempre (a ×1.2: 12/16 y 14/16) |
| Leviatán ×1.2 | 31/32 | 27/32 | ~5.2 | 3/3 en 56 de 64 (a ×1.3: 13/16 y 11/16; a ×1.25: 24/32 y 26/32) |

Con Kit Nv3 (Escudo): La Estrella 29/32 · 32/32, Disruptores 29/32 · 32/32 (el escudo absorbe ~1–2 impactos por pelea). Perder solo cuesta el intento (y el viaje). Todas escalan con tu flota, como cada batalla de historia.

## 7. Especies (`data/rupturas/especies-o3.json`) y arte (lote F)

| id | Nombre | Rareza | Elementos | Rol | Cómo se obtiene |
|---|---|---|---|---|---|
| `c_satelito` | Satélito, el que Da Vueltas | Común | Cósmico | francotirador | H52 · Resonancia Cósmico |
| `c_tanquecito` | Tanquecito, el que Huele a Cohete | Común | Fuego | soporte | H51 · Resonancia Fuego |
| `r_escafandra` | Escafandra, el del Casco de Pecera | Raro | Cósmico + Tierra | tanque | Resonancia (y es el dueño del Taller) |
| `r_grafitera` | Grafitera, la del Aerosol | Raro | Vacío + Sonido | controlador | H55 · Resonancia |
| `e_brecha` | Brecha, la Capitana Rompecajas | Épico | Vacío + Tormenta | asediador | Resonancia |
| `l_jonas` | Jonás, el que Vivía Adentro | Legendario | Agua + Cósmico | invocador | H57 (`ruptura:H57`); ulti WHALE SONG! = firma de Abisa (`ULTS.l_jonas`) |
| `s_platillo` | Platillo, el Abducido (secreto) | Épico | Cósmico + Gravedad | invocador | Resonancia secreta: Cósmico + Gravedad, ambos Nv25+ (`resonance.ts`) |

Hablantes nuevos (`ui/story/text.ts`): ESCAFANDRA, MANEKI (retrato `mochi_bell_cat`), BRECHA, JONÁS. Suplentes de arte en `art/catArt.ts` `STAND_IN` hasta que llegue la pintura.

**Lote F** en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`: respaldo `_respaldos/2026-10-09-antes-lote-f/` (AGENTS, PROGRESO, RAREZAS, comun.mjs, manifest), `LOTES.f = 'lote-f-astral'`, 7 fichas en `manifest.json` (con `coat_en` únicos: caramelo Oriental, flame point, esfinge sin pelo, plateado con puntas teñidas, Somali rojizo, Himalayo seal point, manchas de vaca), lenguaje visual nuevo **RETROFUTURO ORBITAL** (cromo, neón cian/rosa, remaches, cascos de pecera, estelas de cometa), prompts compilados en `prompts/lote-f-astral/`, sección «Lote F» en PROGRESO (todos PENDIENTE) y AGENTS con «F». Para generar: decirle a Codex «Haz el lote F».

## 8. Registro de premios y reinicio narrativo

Claves nuevas: `fuel:mission_H50`, `kit_astral:gift`, `fuel:ruptura_estrella|ruptura_disruptores|ruptura_leviatan`, `cat:mission_H54`. Las batallas usan `battle:<id>` / `cat:<id>` automáticamente (misión ≥ H31). Banderas de compuerta: `region:cometa`, `won_*`, `oleada3_fin` (ya cubiertas por `isStoryGateFlag`). `forma:canelo_astral` es permanente. `o3_taller_visto` y `bitacora_firmada` no bloquean nada. Lo que el jugador tiene (combustible, kit, gatos) nunca se reinicia; en la repetición nada único se paga dos veces (prueba incluida).

## 9. Archivos

**Propios:** `src/battle/fases.ts` · `src/battle/fx/fasesFx.ts` · `src/state/sys/rupturasO3.ts` · `src/ui/story/rupturasScriptO3.ts` · `src/data/rupturas/{especies,historia}-o3.json` · `src/app/oleada3Flow.ts` · `src/panels/CometaShop.ts` · `scripts/balance-astral.ts` · `tests/rupturasO3.test.ts`.
**Ganchos chicos en archivos compartidos:** `battle/sim.ts` (import, `StageRules.fases`, `BossWhat 'fase'`, 6 llamadas) · `scenes/BattleScene.ts` (FasesFx, chips, evento `fase`, espera en `checkBossPhase`, RiftFx) · `battle/ults.ts` (`canelo_astral`, `l_jonas`) · `data/rupturas/formas.ts` (Canelo Astral sin sello + `ult.key`) · `state/sys/casino/eterno.ts` + `panels/casino/eterno.ts` (`ETERNO_EXTRA`) · `state/sys/resonance.ts` (receta de Platillo) · `ui/story/text.ts` (hablantes) · `art/catArt.ts` (suplentes) · `regions/index.ts` (`REGION_INFO.cometa.battles`) · `app/storyFlow.ts` (`astralPreflight`) · `scenes/IslandScene.ts` (IR de las interacciones) · `main.ts` (`initOleada3`) · `tests/forms.test.ts` (Astral ya no sellada).

## 10. Pendientes y dependencias

- **SINCRO:** la mecánica es de BATTLE-MUSIC (`battle/sincro.ts`, ventanas del plan musical de `ruptura_sincronia`). H51 se completa al ganar; la intro la enseña. El estimador nunca la usa (por diseño), así que el balance de arriba es sin SINCRO.
- **Carta:** `MapScene` todavía no dibuja una hoja astral; Puerto Cometa se alcanza por el IR de la misión (y queda marcada `region:cometa` para cuando la carta la pinte).
- **Cine:** cada beat trae `$scene`; la pasada de cine puede escenificar el sello en `drop_4` de LIKY FIGHT y el «gracias» del Leviatán.
- **Arte:** lote F pendiente de generar en Codex; hasta entonces suplentes teñidos.


## Pasada de cine (2026-10-10)

> Agente CINE-O3. Método del doc 26 (Oleada 1): más mundo y menos texto, escenas con `src/cine`, estados del mundo
> derivados, música por doc 18 §5.2 **con la regla del dueño del 2026-10-10** (las 6 originales quedan reservadas a los
> *Momentos musicales*: aquí solo variaciones, `amb.*`, estados del director, stingers y motivos), Fonoteca §8, *hush*
> y «Volver a ver». Sin commit.

### Escenas (`ui/story/o3Cines.ts`, registradas desde `app/oleada3Flow.ts`)

| Beat | Escena (escenario) | Qué pasa en el mundo | Líneas quitadas (el mundo las muestra) | Audio |
|---|---|---|---|---|
| H50 a | `h50_costura` (isla) | La costura del cielo se tensa y se abre una rendija: luz de neón, un letrero cromado que zumba «PUERTO COMETA · SE ACEPTAN NAVES · NO SE FÍA». Queda abierta (`o3_costura` + cielo de `o3Sky`) | b50 [0] | `liky_fight.explore` lejos (duck 10 dB) |
| H50 b | `h50_llegada` (Puerto Cometa) | Barrido desde la cola del cometa sobre grúas y letreros hasta tu barco; Escafandra salta en baja gravedad con la llave, ¡CLANK! ×2, chispas, y pega la calcomanía COMBUSTIBLE en el casco (queda: `regions/cometa.ts`, H50 hecha) | b50 [4] | `explore` contexto `cometa` → `liky_fight.explore`. Fonoteca `liky_fight.explore` |
| H51 a/b | diálogo + ganchos de línea (cualquier escenario) | La pizarra de Luzterna: dos medidores que se llenan A LA VEZ, el anillo que brilla, 同期, y con la línea 2 el golpe saltando de módulo en módulo (プラズマ) · «¡Aprobado!»: el sello cae sobre tu pasaporte, ¡CHUNK! (`ui/story/o3Screen.ts`) | — | Batalla: planes de BATTLE-MUSIC |
| H52 a | `h52_remolcadora` (isla) | El cielo de más allá del puerto; la Remolcadora cruza arrastrando un planetoide con un cable de luz violeta y oro; 1 s de recuerdo: la Estrella Errante empujada | b52 [0] | `te_odio.ambient` (o `.explore`), motivo `remolque` |
| H52 b | `h52_bitacora` (isla) | La bitácora de la Remolcadora: renglones con fechas, la orden se escribe sola EN EL MARGEN con letra bonita, `reveal`, el dibujito de la mano con lápiz se dibuja; Luzterna cierra el libro despacio | b52 [4], [7] | `silence` |
| H53 a | `h53_sello` (isla) | Atardecer violeta; Canelo sentado junto al faro mirando un sello de runas que respira con él; su plato intacto (`o3_sello`) | b53 [0] | `island_night_astral`, motivo `latido` |
| H53 | `h53_romper` (la interacción) | TÓCALO ×3: crac · ¡CRAC! · ¡¡CRAAAC!! (grietas, sacudida); un respiro; el sello se rompe como cáscara de huevo (esquirlas, anillo de luz, estrellas que suben); Canelo sale con la cola llena de estrellas: CANELO ASTRAL (la primera vez se queda con la forma; tarjeta de forma) | b53 [4] | silencio → `reveal` + motivo `canelo_astral` → `liky_fight.explore` (nunca LIKY FIGHT original) |
| H53 c | `h53_penasco` (isla, noche) | Canelo Astral sentado frente al peñasco; la cámara nunca muestra lo que ve; solo se oye, muy lejos, la cajita desafinada de REGISTRO 000. Desde entonces, **cada noche** (hora real) Canelo vuelve a sentarse ahí | b53 [6] | `island_night_astral`, `registro_000` a 0,35 |
| H54 a | `h54_maneki` (isla) | Un cascabel; una gata con escoba barre polvo de estrellas que nadie más ve hacia una cajita (queda mientras H54) | b54 [0] | `explore_mystery`, `cascabel`, `titiriteros` |
| H55 a | `h55_grafiti` (isla) | El cielo se pinta: «NINGUNA CAJA ES HOGAR», DISRUPTORES, ¡ABRAN!, una caja con la puerta abierta; glitch; la nave de latas cruza con Brecha colgada de cabeza (el grafiti queda mientras H55) | b55 [0] | `te_odio.explore` (Fonoteca) |
| H55 b | `h55_casco` (isla) | En tu barco aparece pintada la caja con la puerta abierta (queda para siempre); «Me caen bien…» flota junto a él | b55 [7] | `te_odio.ambient` (Fonoteca) |
| H56 | `h56_firma` / `h56_firma_cometa` (la interacción; isla o Puerto Cometa) | FIRMAR → tu nombre con tu letra → la página se desliza hasta su margen → una nota vieja con LA MISMA letra se deja ver → la cámara se aleja con las dos letras en cuadro. Silencio; solo Si♭–Do. Luego Luzterna (b56 c) | b56 [3], [4] | `silence` + duck 18 dB + `arco_dos` |
| H57 a | `h57_leviatan` (isla) | El mar se voltea: sacudida, y el Leviatán sube boca arriba entre las islas, encadenado con órdenes («CORRIGE ESE MAR»); se queda allá arriba (`o3_leviatan`) | b57 [0] | `hemkade.ambient`, motivo grave |
| H57 b | `h57_gracias` (isla) | Noche astral; sin cadenas; un ojo del tamaño de tu isla se abre en el cielo, mira hacia abajo, parpadea: «gracias» | b57 [4], [5] | `hemkade.ambient` + `leviatan_gracias` (glissando de ballena + célula del arco en trompa) |
| H57 c | `h57_grieta` (isla) | La grieta no se cierra: respira; del otro lado, el borde de una página. CONTINUARÁ · EL UMBRAL. Queda abierta para siempre (`o3_grieta`) | b57 [8], [10] | `arco_pregunta` |

Todas: barras + SALTAR (Esc), pausables (un panel congela el reloj), interrumpibles, «reducir movimiento» (cámara que
corta, menos partículas, sin sacudidas, sin vaivén) y «reducir destellos» (el anillo del sello y el recuerdo sin flash).
Los parámetros del cielo/isla se mueven con `drive` en el reloj de la cine (independiente de FPS; SALTAR los deja en su
valor final) y vuelven a lo que dice la partida al terminar. Ningún popup interrumpe (`hush`).

**Cielo e isla en archipiélagos grandes (PULIDO + MENORES, 2026-10-10).** Todas las piezas del cielo de `ui/story/o3Sky.ts` esquivan las islas en reposo: las que se quedan (grieta y costura) y también las de paso (Remolcadora, grafitis cada uno por separado, nave de latas, leviatán y ojo), con `SkyLine.clearOnScreen` y un suavizado de ~0,4 s. Se dibujan encima del mundo en tres subcapas: de paso < persistentes < la que una escena trae al frente. Mientras una escena corre, cada pieza conserva el lugar que esa escena encuadra. En reposo, el leviatán nada a la izquierda, sin tapar el letrero de la costura. Maneki barre en una casilla libre cerca de su lugar de siempre (`ui/story/manekiSpot.ts`): sin nada construido encima ni nada alto delante o detrás, y lejos del montón de gatos sin casa. La cámara de `h54_maneki` la busca con el target `maneki` (`registerIslandTarget`). Pruebas: `tests/o3SkyPlacement.test.ts`.

**Las interacciones son escenas:** el sello (H53) y la bitácora (H56) ya no son paneles: `openFeature` toca la escena
(desde la carta o una región, primero a casa; la bitácora también se firma ahí mismo en Puerto Cometa). La escena
guarda primero sus partes de beat (b53 b; b56 b/c) y después completa la misión, así la historia nunca las repite;
SALTAR también completa (nunca queda a medias). La ficha del Archivo (H54) sigue siendo el panel de barrer.

### Estados del mundo (`state/sys/rupturasO3.ts`, banda 70–99, derivados del progreso)

`o3_costura` 71 (rendija abierta: b50 a visto o H50 hecha, hasta H57; reloj real) · `o3_grieta` 72 (H57 hecha; reloj)
· `o3_remolcadora` 80 · `o3_grafiti` 82 (contexto de director `explore:world:o3_grafiti` → `te_odio.explore`) ·
`o3_sello` 85 · `o3_leviatan` 90 (`explore:world:o3_leviatan` → `hemkade.ambient`). Lo que vive en el cielo y en la
isla lo dibuja `ui/story/o3Sky.ts` con la función pura `o3SkyState(save, noche)` (cielo en espacio de pantalla detrás
del archipiélago; una escena lo trae al frente). Parte I: nada se monta (`o3Reached` falso).

### Otros

- **REGISTRO 000:** su ficha gana «Visto por: un gato naranja. No dijo nada.» desde H53, con la misma tinta fresca que
  la línea de la Oleada 2 (`ui/story/o3Registro.ts`, clave `b53_canelo#dex`).
- **Fonoteca:** solo variaciones (`liky_fight.explore` H50, `te_odio.explore` H55 al aparecer, `te_odio.ambient` H55
  ganada; `amb.archivo` cuando exista). Las originales `te_odio`/`hemkade` las dan los planes de batalla/Momentos.
- **Momentos musicales:** `// MOMENTO: te_odio (H55, before the glitch phase)` y `// MOMENTO: hemkade (H57, layer
  change)` en `app/oleada3Flow.ts` (`H55_MOMENTO`, `H57_MOMENTO`): se conectan con `registerFaseInterlude` de
  `battle/fases.ts`; `FasesFx.stage()` espera el interludio y la batalla se pausa entre capas.
- **Fixture:** `test-saves/rupturas-o3.json` (`scripts/make-o3-fixture.ts`): H49 hecha, al cargar aparece H50. DEV:
  `__o3.jump('H53')` pone la partida al inicio de una misión de la oleada.
- **Pruebas:** `tests/oleada3Cine.test.ts`.
