# 22 · Oleada 2 «El Cielo Despierta» (H42–H49) — diseño completo y números (INTERNO — contiene spoilers)

**Estado (2026-10-09):** jugable de punta a punta. Misiones, beats, 4 batallas del cielo, elemento GRAVEDAD, Kit de
Vuelo, decisión de H48, 8 especies con suplentes y su lote E de arte listo para Codex. Sin commit.

**Dónde vive cada cosa**

| Pieza | Archivo |
|---|---|
| Misiones H42–H49 + beats (cada beat trae `"$scene"`: lo que la pasada de cine debe MOSTRAR) | `game/src/data/rupturas/historia-o2.json` |
| Elemento, afinidad, materiales, estados, reacciones, sets, 8 especies, receta secreta | `game/src/data/rupturas/especies-o2.json` |
| Cuándo suena cada parte (ON_NEW / ON_DONE / COVERED), textos de la decisión, superficies | `game/src/ui/story/rupturasScriptO2.ts` |
| Batallas del cielo, Kit de Vuelo (estado), decisión (estado), Hélice, banderas de la carta, parche | `game/src/state/sys/rupturasO2.ts` |
| La pantalla: decisión H48, llegada de Hélice, preflight del cielo | `game/src/app/oleada2Flow.ts` (init en `main.ts`) |
| Reglas de GRAVEDAD (FLOTANDO, ¡AL AGUA!/¡AL VACÍO!, POZO, FIRST MASS!) | `game/src/battle/gravedad.ts` |
| Reglas del CIELO (gravedad 0.7, viento en capas, islotes, vacío, giros de historia) | `game/src/battle/cielo.ts` |
| Look del cielo (nubes, capas de viento, islotes, globos y hélices) | `game/src/battle/fx/cieloFx.ts` |
| Pestaña VUELO del Astillero | `game/src/panels/shipyard/FlightTab.ts` (+ `panels/Shipyard.ts`) |
| Pruebas | `game/tests/rupturasO2.test.ts` (21) |
| Calibración | `game/scripts/balance-sky.ts` · `game/scripts/balance-crystal.ts --me gravity` |

Ganchos mínimos fuera de esos archivos (todos aditivos): `battle/sim.ts` (skyInit, skyStartTurn, skyFlight en
`integrate`, skyIsletImpact, skyAtkMul, grBeginFire, grAfterImpact, el ×1.35 de FLOTANDO), `battle/ai.ts`
(grShotValue, skyTargetMul), `battle/ults.ts` (l_masamadre), `battle/types.ts` + `catShots.ts` (`gravity`, `grav`),
`battle/labels.ts`, `battle/multiverso.ts` (nota del rival), `scenes/BattleScene.ts` (paleta de nubes, SkyBattleFx,
chips, GravityFx para la inversión), `state/sys/storyBattles.ts` (`passPct`, `damageFragments`), `app/storyFlow.ts`
(preflight + toast de daño + caption), `scenes/IslandScene.ts` (IR de H43 y H48), `ui/story/text.ts` (5 hablantes),
`state/sys/resonance.ts` (Manzanita), `podio/powers.ts`, `data/glossary.ts` (3 entradas), `regions/index.ts`
(`battles` de `invertidas` y `corona`). La plomería visual del elemento (insignia, dimensión, hábitat, bioma, estados,
proyectil, suplentes) la hizo un sub-agente siguiendo el patrón de Cristal (ver §6).

## 1. La historia (guion 13, con lo que se mejoró)

**Pregunta:** ¿qué hay encima del mar? **Respuesta:** Corona Celeste, una capa que los Correctores ya «arreglaron».
**Pregunta mayor:** ¿quién mandaba al Leviatán? (se responde en H47) y deja otra más grande: las costuras del cielo.

| Misión | Meta | Lo nuevo que trae | Premio |
|---|---|---|---|
| H42 Trombas | `use_feature region_invertidas` (entrar a la isla en 3D) | La primera subida al cielo (la isla sale en la carta al aparecer la misión: `region:invertidas`) | std |
| H43 El Kit de Vuelo | `use_feature kit_vuelo` (instalarlo en el Astillero) | **Sistema:** tu barco se vuelve aerobarco (pestaña VUELO). Hélice baja por la tromba. | std + 2 gemas |
| H44 Islas Invertidas | `win_battle cielo_invertidas` | **Primera batalla del cielo** + **GRAVEDAD** (secuencia de descubrimiento) | Gravedad + Plomito + 20 cristales + 3 gemas |
| H45 Corona Celeste | `use_feature region_corona` | La ciudad sin elección (beat largo partido); REGISTRO 000 gana «Visto: Corona Celeste»; **Hélice elige irse contigo** (revelación al volver a casa) | std + Hélice |
| H46 La embajada | `win_battle cielo_embajada` (graduada por daño 30%) | **Pelea contrarreloj**: se va al final del turno 7; CORRECCIÓN (se repara); vienen por Canelo (lo apuntan; él pega ×1.25) | Ronrón + 4 gemas |
| H47 El otro almirante | `win_battle cielo_almirante` | **ABAJO ES ARRIBA desde el turno 3 sobre tu barco**; revelación: el almirante del Leviatán era un Corrector; los Fragmentos del Vacío son tinta seca | 15 cristales de Gravedad + 5 gemas |
| H48 Luzterna lo sabe | `use_feature linterna` | **Decisión de 2 opciones** (APÁGALA / DÉJALA ENCENDIDA), cosmética y recordada | std |
| H49 Primordial de la Gravedad | `win_battle cielo_masamadre` | **MASA:** un peso en medio del cielo curva TODOS los tiros; la luna cae (cataclismo); gancho: la costura y la mano de luz con lápiz | Masa Madre + 10 gemas + `oleada2_fin` |

**Hilos que paga:** «¿quién derrotó a mi almirante?» (H47), los tres orígenes de los Fragmentos del Vacío (H47:
tinta seca de páginas borradas), REGISTRO 000 «Visto: Corona Celeste» (H45, línea del CATDEX en el beat; el panel
`collection/registro000.ts` es de la Oleada 1: la constante `REGISTRO_O2_LINE` queda lista si se quiere mostrar ahí).

**Hablantes nuevos** (`ui/story/text.ts`): HÉLICE, CASCADA (capitana), MASA MADRE, EMBAJADOR y ALMIRANTE (los dos
últimos son Correctores: sin cara, blanco perfecto).

**Cuándo suena cada parte** (`rupturasScriptO2.ts`): cada ON_NEW espera más que las partes ON_DONE anteriores (la
prueba lo verifica). Las llegadas a islas 3D son `inRegion`; la de H48 es `onlyOn: 'island'` con `darkSky`.

**La decisión de H48.** Después de la parte a (Luzterna descubre que su linterna es una señal), `oleada2Flow` abre
`choicePrompt` (el mismo póster de la pregunta de perfil). La respuesta pone `linterna:apagala` o
`linterna:encendida` (la más nueva manda), cuenta `feature_linterna` (cumple H48) y Luzterna contesta (`LINTERNA_REPLY`).
La parte b es la misma en los dos casos: la deja encendida («Cuidar algo también es dejar que lo vean»). Después del
final de la oleada, una línea de Luzterna recuerda lo que contestaste (`LINTERNA_LATER`). Otras oleadas leen
`linternaChoice()` (`state/sys/rupturasO2.ts`). Si recargas antes de contestar, se vuelve a preguntar cuando hay calma;
el IR de la misión fijada pregunta al instante.

**Repetición tras el reinicio narrativo** (`rupturasReset` / `rupturasLedger` del agente de migración): las batallas
pagan una vez por su llave del registro; Hélice usa `cat:mission_H45`; si ya tienes un barco con kit, H43 se cumple
sola al aparecer (sin bloqueo); H48 se puede volver a contestar.

## 2. GRAVEDAD (`gravity`, verbo MOVER)

**Lenguaje visual:** CIANOTIPO ORBITAL (planos de observatorio en azul de Prusia, órbitas en tiza blanca, plomadas de
latón, cosas que caen hacia arriba). Paleta `#13224A · #E9F0FF · #3E6FD8 · #F0B44C`. Insignia `public/icons/el-gravity.svg`.

**Afinidad** (solo llaves nuevas): Gravedad ×1.5 contra Cristal y Tormenta (ellos le devuelven ×0.75); Vacío y Tiempo
×1.5 contra Gravedad (ella les devuelve ×0.75). Ningún elemento queda con más de 3 fortalezas o 3 debilidades.
**Materiales:** madera 1 · lona 0.75 · hierro 1.25 · piedra 1.25 · cristal 1 · hueso 1 · vacío 0.75.

**Reglas en barcos** (`battle/gravedad.ts`, iguales para los dos lados, sin azar):

| Regla | Qué hace | Número |
|---|---|---|
| FLOTANDO (estado de celda `grav`) | Todo tiro de Gravedad lo deja donde pega, 2 turnos (Nv20: 3) | — |
| Sin apoyo | Una celda FLOTANDO recibe más de los golpes del rival | ×1.35 (`GR_TUNE.floatMul`) |
| ¡AL AGUA! / ¡AL VACÍO! | Un golpe del rival toca un módulo (no núcleo, camarote ni módulos de jefe) que ya está muy roto: se cae del barco entero. Una vez por tiro; respeta el tope de las ultis, el CORAZÓN DE PIEDRA de Gea y las celdas inmunes de jefe | mar: FLOTANDO ≤40% · cielo: FLOTANDO ≤60%, cualquiera ≤25% · con Ancla de Nube: reglas del mar |
| POZO | Un tiro de GATO de Gravedad que cae en el barco rival abre un pozo ahí (uno por lado). Curva solo los proyectiles de su lado: la andanada de ese turno y el gato del siguiente | r 200 · k 1800 · 2 turnos |
| FIRST MASS! (ulti de Masa Madre) | Su bollo + un POZO enorme sobre el barco rival y todo alrededor FLOTANDO | r 320 · k 2200 · 2 turnos (★5: 3) |
| IA | Juega el elemento a propósito: abrir pozo, pegarle a lo que flota (×1.2), rematar módulos que se caen (×1.25) | `grShotValue` |

**Podio:** técnica GRAVITY DROP! (aplasta, 35% de aturdir); firma de Masa Madre (aplasta, roba media barra, 60% de aturdir).

**Balance de la familia** (`scripts/balance-crystal.ts --me gravity`, tripulaciones de 3 gatos de la familia contra
las 13 familias de la Parte I/Parte 2, 3 cascos): primera pasada 36% (A) y 15% (B): los orbes pesados no llegaban al
otro barco (`gravityMul` explícito > el 0.5 por defecto del orbe). Arreglado el alcance (Plomito 0.8, Globito 0.35,
Masa Madre 0.7), +5 de daño por gato y FLOTANDO ×1.35. Corrida final (16 semillas, puntería normal y difícil,
madera/hierro/cristal): presupuesto A 47·47·45·48·44·37% (≈45%), presupuesto B 43·45·50·56·48·46% (≈48%): la familia
queda en el medio de la tabla. Como referencia, con el mismo arnés: Cristal ≈57%/55%, Tormenta ≈11%/33%. Mezclados con otros gatos,
los de Gravedad rinden como sus pares de Cristal (Cascada ≥ Prismarina; Masa Madre ≈ Madre Nácar).

## 3. El CIELO (`battle/cielo.ts`, `StageRules.sky`)

| Regla | Detalle |
|---|---|
| Gravedad ×0.7 | `Battle.field.gMul` (la IA y la línea de tiro ya integran el campo) |
| Viento en capas | El viento del turno sopla distinto por altura: arriba ×1.6 (y < agua−520), en medio ×1, abajo ×−0.5 (contracorriente cerca de las nubes) |
| Islotes | 2 rocas flotantes en el hueco entre barcos (se omiten si el hueco es < 150 px): paran cualquier proyectil menos la onda (Sonido) y la fase (Vacío); suben y bajan 36 px según el turno; vida = 5% de la estructura media; se caen al vacío al romperse |
| Al vacío | Cualquier módulo ≤25% que recibe otro golpe se cae (Gravedad lo sube a 60%) |
| Kit de Vuelo del rival | Los nativos de Corona vuelan con Estabilizadores (nivel 2) |
| CORRECCIÓN (H46) | Al inicio de su turno repara sus 2 celdas más rotas 40% |
| Objetivo (H46) | Su IA valora ×2.5 el camarote de Canelo; Canelo pega ×1.25 |
| ABAJO ES ARRIBA (H47) | Desde el turno 3, columna de gravedad invertida (k −0.35) sobre TU barco (look de la Estrella) |
| MASA (H49) | Un pozo permanente en medio del cielo (r 520, k 650) que curva TODOS los tiros |

**Pantalla:** el mar se dibuja como un mar de nubes (`SKY_PALETTE`), islas de cabeza a lo lejos, rayas de tiza por
capa de viento (dirección y fuerza reales), islotes con grietas según su vida, y globo + hélices sobre cada barco que
vuela (el tuyo con parche). Chips: CIELO, VIENTO EN CAPAS → → ←, ISLOTES, AL VACÍO, CORRECCIÓN, MASA, ABAJO ES ARRIBA.

## 4. Kit de Vuelo (tu barco se vuelve aerobarco)

- **Guardado opcional:** `G.s.ext.flightKit = { level, ships, at }`. Ausente = nunca tuvo. Se normaliza al cargar
  (`normalizeFlightKit`: basura → nivel 1..3, barcos únicos tipo string; vacío → se borra). Una partida sin kit no
  gana ninguna llave nueva.
- **Por barco** (el barco conserva id, nombre, tripulación, plano e historia: no se toca nada más) con **nivel global**:
  1 Kit de Vuelo (vuela; requerido) · 2 Estabilizadores (−30% del viento en capas en tus tiros) · 3 Ancla de Nube
  (tus módulos no se caen al vacío: reglas del mar).
- **Costos:** el primero lo regala Hélice; otro barco: 30 min de ingreso en oro + 150 chatarra. Nivel 2: 1 h de oro +
  300 chatarra + 8 planos + 10 cristales de Gravedad. Nivel 3: 2 h + 600 + 16 + 25.
- **Preflight:** una batalla del cielo con un barco activo sin kit ofrece zarpar con el que sí vuela, o abre el
  Astillero en VUELO (nunca bloquea: H44+ solo existe con el kit ya instalado).
- **UI:** pestaña VUELO (solo cuando el kit ya se ofreció; badge mientras ningún barco lo tenga). Plano azul del
  aerobarco dibujado en código (globo, hélices, aleta; se anima en dos con el ticker del Astillero), INSTALAR,
  3 filas de nivel con costos y MEJORAR. `__overflow()` en 1600×900: 0 fugas y 0 solapes antes y después de instalar.

## 5. Las cuatro batallas (calibración)

`scripts/balance-sky.ts`: tripulación de `test-saves/post-finale.json` (7 legendarios Nv38 ★3 en el Bastión), Kit
nivel 1 (el peor caso), puntería normal y difícil, 3 bases de semillas × 32 = **192 peleas por batalla** (corrida final,
ya con los ajustes de la familia Gravedad de §2: los rivales también son gatos de Gravedad):

| Batalla | Barco | Tripulación | Reglas | ×poder | Gana | Turnos |
|---|---|---|---|---|---|---|
| `cielo_invertidas` (H44) | templo flotante | Cascada, Contrapeso, Plomito, Globito | cielo + lluvia de meteoritos | 1.2 | 184/192 (96%) | ~6.0 |
| `cielo_embajada` (H46) | observatorio | Ronrón ×2, Globito, Contrapeso | cielo + se va en el turno 7 + CORRECCIÓN + objetivo Canelo; pasa con 30% o K.O. de su tripulación; sin Fragmentos | 1.2 | 189/192 (98%) | ~4.9 |
| `cielo_almirante` (H47) | galeón de runas | Cascada, Ronrón, Contrapeso, Hélice | cielo + ABAJO ES ARRIBA (t3) + el sol baja | 1.2 | 185/192 (96%) · peor celda 28/32 | ~9.1 |
| `cielo_masamadre` (H49) | fortín de piedra | Masa Madre, Cascada, Contrapeso, Plomito | cielo + MASA + la luna baja | 1.3 | 187/192 (97%) · Kit 3: 64/64 | ~4.5 |

Notas: a ×1.35 la final bajaba a ~90% (la masa + la luna la vuelven volátil por encima de ×1.3). Sin cielo (mismas
batallas en el mar) se ganan 32/32 y duran ~1 turno menos: el cielo agrega ~1–2 turnos y ~5 tiros contra islotes por
pelea. Con Kit 3 los números quedan en el mismo rango (el kit es comodidad, no requisito de balance). Perder solo
cuesta el intento; el poder rival escala con tu flota como toda batalla de historia.

## 6. Especies (Lote E) y arte

| id | Nombre | Rareza | Elementos | Rol | slug | Cómo |
|---|---|---|---|---|---|---|
| `c_plomito` | Plomito | común | gravity | artillero | `plomito_plumb_cat` | H44 + Resonancia común |
| `c_globito` | Globito | común | gravity | soporte | `globito_balloon_cat` | Resonancia común |
| `r_contrapeso` | Contrapeso | raro | gravity + earth | tanque | `contrapeso_counterweight_cat` | Resonancia |
| `r_helice` | Hélice | raro | gravity + storm | soporte | `helice_propeller_cat` | H45 + Resonancia |
| `r_ronron` | Ronrón | raro | gravity + light | controlador | `ronron_purr_cat` | H46 + Resonancia |
| `e_cascada` | Cascada | épico | gravity + water | francotirador | `cascada_upfall_cat` | Resonancia (Nv15+); su chorro cae hacia ARRIBA (`gravityMul −0.4`) |
| `l_masamadre` | Masa Madre | legendario (primordial) | gravity | invocador | `masamadre_mass_cat` | H49 (`ruptura:H49`: bloqueada de la Resonancia hasta tenerla) |
| `s_manzanita` | Manzanita | épico (secreto) | gravity + nature | asediador | `manzanita_apple_cat` | Receta secreta: Gravedad + Naturaleza, ambos Nv20+, uno ★3+ (pista en el Santuario) |

Todas incluyen Gravedad: una partida de la Parte I no ve ninguna en sus pozos de Resonancia. Sets del Catdex:
«Familia Contrapeso» y «Corona Celeste».

**Suplentes** hasta que llegue el arte (`art/catArt.ts` STAND_IN, pintura existente + tinte): Plomito ← Guijarro,
Globito ← Nube, Contrapeso ← Gólem, Hélice ← Steampunk, Ronrón ← Áurea, Cascada ← Marea, Masa Madre ← Mochi,
Manzanita ← Margarita.

**Lote E (Codex)** en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`: respaldo previo en
`_respaldos/2026-10-09-antes-lote-e/`; 8 entradas en `manifest.json` (lote `e`, carpeta `lote-e-cielo`, `coat_en`
únicos, ninguno atigrado café, nuevo lenguaje CIANOTIPO ORBITAL en `element_dimensions`); `herramientas/comun.mjs`
con `e`; prompts compilados (`node compilar.mjs e` → `prompts/lote-e-cielo/`, `validar.mjs e` sin avisos);
`PROGRESO.md` con la sección del lote (8 PENDIENTE). Orden para Codex: «Haz el lote E». Correcciones previas en el
manifest: ojos abiertos (rig), Globito solo apoya su piedrita, Cascada con gorra de capitana (no bicornio).

**Plomería visual del elemento** (patrón Cristal): insignia SVG, `ELEMENT_FX`, `ELEMENT_NAME`, dimensión CIANOTIPO
ORBITAL (patrón `orbital`, fuente `F.ui`, palabra 重), proyectil y estela, hábitat (prop, remates, torreta, coral),
rasgo del camino, paleta de hábitat, bioma (rocas flotantes, cascada que sube, corona orbital), brillo de estado
FLOTANDO (piedritas que suben), onomatopeya ¡VUUUM!, color de Catdex, expediciones (traen cristales de Gravedad),
captions de descubrimiento, glosario (Gravedad, Kit de Vuelo, Batallas del cielo).

## 7. Pruebas y verificación

- `tests/rupturasO2.test.ts` (21): datos (cadena H42–H49, metas, batallas en sus islas, especies, afinidad, beats ≤4
  líneas y todas usadas, hablantes registrados, `$scene` en cada beat, orden de esperas), reglas (FLOTANDO, ¡AL AGUA!,
  ¡AL VACÍO!, Ancla de Nube, POZO solo de su lado, determinismo pantalla = estimación en el cielo, viento en capas y
  estabilizadores, islotes que paran y se caen, CORRECCIÓN, inversión, masa), las 4 batallas corren sin cabeza,
  partidas (Parte I no ve nada; H41 hecho → H42 + nota; la oleada completa; kit: niveles, otro barco, basura en la
  partida; repetición sin bloqueos; el nivel del kit llega al sim).
- Pruebas de la Oleada 1 tocadas (consecuencia directa de que exista la Oleada 2): `rupturasStory.test.ts` (H42 ya
  existe; la carta suma Islas Invertidas al cerrar H41) y `crystal.test.ts` (Cristal ahora tiene 3 debilidades: Tierra,
  Naturaleza y Gravedad, dentro del tope de 3).
- `rupturasReset.test.ts` «totals … on EVERY fixture»: el inventario de propiedad ahora ignora los sellos de reloj
  (`at`, ms) dentro de `ext.*`, que una carga puede reescribir con `Date.now()` (el combustible de la Oleada 3). Lo que
  se posee (combustible, kits, barcos, niveles) se sigue comparando campo por campo. `ext.flightKit` conserva su `at`
  tal cual (no se reescribe al cargar).
- `verify-missions --all`: 146 OK, 0 faltantes.
- Revisión visual sin cabeza (Vite propio en 5213 sin HMR, Chrome con perfil propio, capturas fuera del repo): batalla
  de Islas Invertidas, de El otro almirante y de Masa Madre jugadas por la IA hasta el final; pestaña VUELO antes y
  después de instalar (0 fugas); póster de la decisión y respuesta; revelación de Hélice.

## 8. Lo que queda abierto

- Las islas 3D (`regions/invertidas.ts`, `regions/corona.ts`) y la hoja celeste de la carta son del agente
  WAVE2-REGIONS: las misiones las usan por `REGION_INFO` (banderas `region:invertidas` / `region:corona`, batallas en
  `battles`, entrar emite `feature_region_<id>`).
- Cinemáticas: cada beat trae su `"$scene"`; la pasada de cine puede reemplazar el diálogo plano.
- Estados del mundo (`registerWorldState`) para el cielo despierto: cuando exista `state/sys/worldState.ts`.
- `REGISTRO_O2_LINE` en la ficha de REGISTRO 000 (panel de la Oleada 1).
- El IR de H43 desde la CARTA abre Misiones (MapScene no se tocó); desde la isla abre el Astillero en VUELO.

## Pasada de cine (2026-10-10)

> Agente CINE-O2. Método del doc 26: más mundo y menos texto, escenas con `src/cine`, estados del mundo, música por
> `audio/api.ts`, Fonoteca, *hush* y «Volver a ver». Sin commit. Las 6 canciones ORIGINALES quedan reservadas para los
> «Momentos musicales» (dueño, 2026-10-10): aquí solo suenan variaciones (`*.ambient`, `*.explore`, `*.aftermath*`),
> `amb.*`, stingers y estados del director. Una prueba lo vigila (`tests/oleada2Cine.test.ts`).

### Escenas (`ui/story/o2Cines.ts`, registradas al arrancar por `app/oleada2Flow.ts`)

| Escena | Beat | Escenario | Qué pasa en el mundo | Música |
|---|---|---|---|---|
| `h42_trombas` | b42 a | isla | Tres trombas se levantan del Primer Mar y suben hasta las nubes; las gaviotas suben con ellas; cámara de abajo hacia arriba. Una se queda para siempre («el elevador») | stinger `tromba` (motivo: sube y cae en Fa) |
| `h42_arriba` | b42 b | Islas Invertidas | La cámara mira el mar de nubes, la tromba sube y la cámara sube con ella; las islas colgantes; tu barco tambalea sostenido solo por la tromba | `hemkade.ambient` |
| `h43_helice` | b43 a | Islas Invertidas | Hélice baja por la tromba con un paraguas-hélice, aterriza en tu cubierta y pega con cinta el plano azul del kit en el mástil | `circus_malus.explore` a −12 dB + `kit_vuelo` |
| `h43_aerobarco` | b43 b | isla | Tu barco del puerto se infla de globo, despliega dos hélices y da un saltito; una etiqueta dice que su nombre es el mismo | `kit_vuelo` |
| `h44_cascada` | b44 a | isla | En el cielo sobre tu isla, una isla de cabeza con un barco amarrado debajo, también de cabeza | `hemkade.ambient` |
| `h44_gravedad` | b44 b | isla | Piedritas flotan alrededor de tus gatos (llegó la GRAVEDAD); Plomito se duerme y la cubierta cruje | `hemkade.ambient` · Fonoteca |
| `h45_corona` | b45 a | isla | Aparece Corona Celeste sobre las nubes (blanca, simétrica) y todo ronronea a la vez | `circus_malus.explore` lejos + motivo `ronroneo` |
| `h45_ciudad` | b45 b | Corona Celeste | Calles perfectas hasta el anillo de gatos idénticos que ronronean al unísono; Hélice sale con la mochila hecha | motivo `ronroneo` · Fonoteca |
| `h45_registro` | b45 c | Corona Celeste | La música se aparta; una línea de sistema se tipea en estática: REGISTRO 000 · LÍNEA NUEVA | `registro_000` |
| `h46_embajada` | b46 a | Corona Celeste | La ciudad entera se calla y mira la única torre que no ronronea; reverencia perfecta en la puerta; el folleto «CANELO 2.0 — SIN IMPACIENCIA»; Canelo gruñe | duck + motivo `correccion` |
| `h46_ronron` | b46 b | isla | La embajada se aleja por el cielo; Canelo enseña los dientes, bosteza y se acicala; Ronrón deja de ronronear | `circus_malus.explore` → `swap` → `liky_fight.explore` («Canelo gana la pista») |
| `h47_galeon` | b47 a | isla | Un galeón blanco con mascarón de ballena entra entre las islas colgantes; la insignia pintada de blanco | `hemkade.ambient` + `correctores` |
| `h47_ordenes` (+ `h47_escama`) | b47 b + c | isla | Luz fría; el Leviatán se dibuja solo con tiza en el cielo mientras habla el Almirante; el acorde de los Correctores; cae una escama negra junto a un Fragmento del Vacío: «=» | `hemkade.ambient`, duck + `correctores` |
| `h48_senal` | b48 a | isla | Se hace de noche en tu faro; la linterna parpadea tres cortas y una larga y sube un hilo de luz al cielo; pausa larga; la pregunta (APÁGALA / DÉJALA ENCENDIDA) | `yonose_todo.ambient`; con «encendida» entra `yonose_todo.aftermath_bajo` en el compás |
| `h48_encendida` | b48 b | isla | Limpia el vidrio: la luz sale más derecha que nunca (queda un hilo de luz fijo de noche) | el bajo entra con su línea · Fonoteca |
| `h49_horno` | b49 a | isla | Corona Celeste se inclina; migajas, pelotas y un gato despistado ruedan al horno, que respira vapor; luz dorada | `when_i_lose.ambient` |
| `h49_costura` (+ `h49_continuara`) | b49 b + c | isla | El cielo se queda sin peso un segundo (silencio, piedras, estrellas y gatos se levantan); la costura se abre: una mano de luz con un lápiz escribe; se cierra; CONTINUARÁ · LA ERA ASTRAL | `silence` → `titiriteros` · Fonoteca |

Todas: barras + SALTAR (Esc), pausables (un panel congela el reloj), interrumpibles, «reducir movimiento» (cámara que
corta, *drives* cortos, sin sacudidas) y reloj propio de la cine (independiente del FPS). Las escenas de región se
juegan donde ocurre la llegada (`onlyOn: 'region'`); en otra isla 3D se degradan a diálogo con barras (los puntos con
nombre no existen allí). `until` salta (marca vista) una escena que el jugador ya superó.

**Líneas quitadas** porque el mundo ya las muestra (ids de beats intactos; los saves solo guardan claves): b42 [0, 4,
7], b43 [4], b44 [0], b45 [0, 3, 7] (y la línea 6 pasa de CAPTION a la voz de HÉLICE con sus mismas palabras), b46 [0,
5], b47 [0, 7], b48 [0] (el efecto `darkSky` ya no hace falta: el mundo se hace de noche), b49 [0, 5, 6, 9] (la tarjeta
CONTINUARÁ es el cartel).

**Motivos nuevos** (registrados en `cine/sound.ts › MOTIFS` desde `o2Cines.ts`, hasta que existan las grabaciones del
doc 18 §9): `tromba`, `kit_vuelo`, `ronroneo`, `swap`, `correctores`, `titiriteros`.

### El mundo (estados `o2_*`, `state/sys/rupturasO2.ts`, banda 40–69)

| Estado | Prioridad | Cuándo (derivado de misiones) | Aspecto |
|---|---|---|---|
| `o2_senal` | 60 | H48 activa, o H48 hecha mientras no haya sonado su respuesta (`b48_linterna#b`) | Noche de historia (no astral, nunca negra); faro encendido; «TOCA EL FARO» cuando ya preguntó |
| `o2_masa` | 55 | H49 activa | Luz dorada de horno |
| `o2_almirante` | 50 | H47 activa | Luz fría, un poco de viñeta |
| `o2_corona` | 48 | H45–H46 activas | El blanco «perfecto» se cuela: más blanco, menos saturado |
| `o2_trombas` | 46 | H42 activa | Día de viento, más frío |
| `o2_cielo` | 44 | H43–H44 activas | Aire azul, viento |
| `o2_costura` | 41 | H49 hecha | De día, con la costura del cielo más ancha que nunca (se queda) |

Los de día siguen la hora real (`clock`, como `cielo_roto`). El cielo de la isla (`ui/story/o2Sky.ts`, derivado igual):
trombas (H42) → el elevador e islas colgantes (desde H42 hecha) → el barco de cabeza (H44) → Corona Celeste (desde
H45) → la embajada (H46) → el galeón blanco (H47) → el hilo de luz de la linterna (H48: parpadea; después, fijo) →
Corona inclinada con su horno (H49); tu barco lleva globo y hélices desde que tiene el Kit de Vuelo. Flota sobre el
archipiélago en la franja alta que alcanza la cámara y toma la luz del mundo. En las Islas Invertidas, mientras tu barco
no tiene kit, lo sostiene la tromba (y Hélice y su plano esperan en cubierta durante H43).

`director.json`: `explore:invertidas` → `hemkade.ambient` (doc 18 §5.4) y `island:world:o2_*` (la música de la isla
sigue a la oleada si el jugador no eligió pista en la Fonoteca). Todo son variaciones.

### Fonoteca (doc 18 §8, idempotente, sobrevive al reinicio)

`hemkade.ambient` (H44 hecha) · `circus_malus.explore` (H45 hecha) · `yonose_todo.ambient` (H48 hecha) ·
`when_i_lose.aftermath` (al ganar H49, si ninguna derrota lo desbloqueó antes). Las escenas lo hacen en su punto sin
retorno; `syncO2Songs` pone al día una partida que ya pasó esos momentos.

### «Volver a ver»

19 entradas con títulos sin sorpresas (Trombas, Arriba de las nubes, Una mecánica baja del cielo, Mismo barco ahora
flota, Una isla de cabeza, Todo pesa menos, Una ciudad sobre las nubes, Calles perfectas, Una línea nueva, La embajada,
Canelo no está descompuesto, Un galeón blanco, Tiza en el cielo, Una escama fría, Tres cortas una larga, Más derecha que
nunca, El horno del cielo, Sin peso un segundo, Continuará). Una repetición no guarda nada (la pregunta de la linterna no
se vuelve a hacer).

### Momento musical de H44

El Momento LIKY FIGHT (fase 1 en el mar → el barco de Cascada despega → fase 2 en el cielo) NO se construyó aquí. El
gancho está marcado en `state/sys/rupturasO2.ts`, en la batalla `cielo_invertidas`:
`// MOMENTO: liky_fight (H44, between phase 1 and 2)`. Hoy esa batalla sigue siendo la pelea en el cielo de siempre.

### Cabos sueltos cerrados (doc 28 §4, punto 0)

1. **REGISTRO 000:** `ui/story/o2Registro.ts` dibuja «Visto: Corona Celeste.» con la letra de nadie bajo la nota de la
   ficha (una línea en `panels/collection/registro000.ts`); la primera vez se escribe sola en tinta fresca
   (`b45_corona#dex`). Derivado de H45.
2. **El mundo durante H42–H49:** los 7 estados de arriba + el cielo de la isla.
3. **IR de la carta para H43:** una inserción en `MapScene` (onGoal) manda `kit_vuelo` y `linterna` a
   `oleada2Flow.chartFeature`: la carta se desliza a «El Cielo» (`focusIsle('invertidas')`, público) y luego abre el
   Astillero en VUELO; H48 te lleva al faro.
4. **«Se une un gato» y las batallas:** un jugador solo podía provocarlo en la ventana en que se descargaba el arte del
   gato (se reclamaba antes de cargar). Ahora: el arte carga antes de reclamar, se vuelve a revisar la calma en la misma
   escena, la pantalla sostiene el *hush* (`o2join`), `skyPreflight` hace que toda batalla de historia espere a que
   cierre, y si la escena cambia igual la tarjeta se oculta y se cierra sola (un toast avisa). Además `oleada2Flow`
   reconoce las escenas solo con `instanceof` (el build minimiza los nombres de clase).

### Verificación

- `tests/oleada2Cine.test.ts` (12): registro y orden de escenas, cada beat O2 es una cine en su escenario que dice sus
  líneas y guarda su clave, SALTAR llega a cada `persist`, una repetición no guarda nada, «Volver a ver», estados
  derivados (Parte I intacta, recarga, reinicio), el cielo de la isla, la línea de REGISTRO 000, Fonoteca solo con
  variaciones y ninguna original en las escenas, el gancho del Momento y el IR de la carta.
- Sin cabeza (Vite propio en 5261 sin HMR ni WebSocket, Chrome con ANGLE Metal y perfil propio, partidas armadas a
  partir de `rupturas-o4` e inyectadas por intercepción sin tocar `test-saves/`): las 19 escenas en secuencias de
  cuadros, las llegadas a las dos islas 3D por la historia real, la pregunta de la linterna contestada con un toque, el
  mundo tras recargar, el IR de la carta, la línea de REGISTRO 000, «Volver a ver» (la partida idéntica antes y
  después), la tarjeta de Hélice frente a una batalla y frente a un cambio de escena, y una partida de la Parte I
  (`late-game`: estado `normal`, sin cielo O2).
