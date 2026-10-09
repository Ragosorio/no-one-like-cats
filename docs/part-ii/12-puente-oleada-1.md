# 12 · El puente: de la Parte I a la Parte II (Oleada 1 «La Marea Imposible»)

**Decisión del dueño (2026-10-09):** el juego **no agrega ninguna vista** (ni Página/Mundo ni botón de preview). La Parte II entra **dentro del juego de siempre**, igual que entraron las Grietas y el final:

- misiones de historia `H31+`;
- batallas de historia (`STORY_BATTLES`);
- diálogos enganchados en `story.ts`;
- parches para las partidas viejas.

**Actualización del dueño (2026-10-09, más tarde):** la Parte II suma **islas nuevas que se visitan en 3D** (Páginas Hundidas, Isla Nácar y la cinemática «el reflejo»; contrato en `14-regiones-3d.md`). La isla de casa sigue en 2D. Las islas aparecen en la carta náutica en una hoja nueva, el **MAR DE LAS RUPTURAS** (§1.1), y solo después de H30: quien no tiene la Parte II ve la carta de siempre.

Lo 2.5D (`rupturas.html`) queda como laboratorio y no se enlaza desde el juego.

**Dónde vive el contenido.**
- **Datos:** `game/src/data/rupturas/especies.json` (elemento Cristal y especies) y `game/src/data/rupturas/historia.json` (misiones y beats).
  - Se fusionan sobre `content.json` al cargar (`data/mergeContent.ts`).
  - La fusión **solo agrega**: si algo intenta pisar un valor de la Parte I o reusar un id, falla en dev y en tests.
- **Código:** cada sistema nuevo va en su archivo (`state/sys/rupturas.ts`, `state/sys/forms.ts`…).

## 1. La historia de la Oleada 1 (en el juego, paso a paso)

Arranca **solo después de H30 «Fin»**: quien no terminó la Parte I no ve nada. Al cargar una partida vieja que ya terminó, `checkMissions()` activa H31 y un parche avisa (patrón de `grietas.ts`).

| Misión | Título | Trigger | Meta (goal) | Premio | Qué pasa |
|---|---|---|---|---|---|
| **H31** | Las estrellas caen hacia arriba | `mission:H30` | `use_feature` `faro` (tocar el faro de tu isla; emite `G.count('feature_faro')`) | `std` | De noche (efecto `darkSky`), Luzterna —que ahora vive en tu faro— te despierta: las estrellas suben. Desde arriba ve con su linterna que **el mar refleja una isla que no está**. El Faro del Primer Mar, el que «se prendió solo» (H27), apunta justo ahí. **Al cumplir**, después del beat, la cinemática 3D `goRegion('reflejo')`: el mar de noche reflejando la isla que no está; vuelve sola a la isla. Una sola vez (la guarda el beat `b31_reflejo`). |
| **H32** | REGISTRO 000 | `mission:H31` | `use_feature` `registro000` (abrir la ficha especial del Catdex) | `std` + 2 gemas | El Catdex tiene una ficha que nadie escribió. Luzterna: «Esa ficha no la escribí yo. Y tú tampoco, Capi: tu letra es horrible.» La palabra de estática del Barco del Vacío por fin se lee: **FOLIO**. Sale una portada del Diario: «¿QUIÉN ES EL CUARTO GATO DE LA FOTO?» |
| **H33** | La Isla de las Páginas Hundidas | `mission:H32` | `use_feature` `region_paginas` (entrar a la región emite `feature_region_paginas`) | `std` | **Al aparecer** pone el flag `region:paginas`: la isla sale en la carta, en la hoja que nadie pegó. Al desembarcar (dentro del 3D) suena el beat de llegada: todo está escrito, hasta las olas. |
| **H34** | La Biblioteca a la Deriva | `mission:H33` | `win_battle` `ruptura_paginas` | `c_marcapaginas` + 2 gemas | La Archivista dice que la isla está en el catálogo «desde siempre». Con fecha de ayer. El marcador de batalla aparece **dentro** de Páginas Hundidas; la misión fijada también la lanza, como antes. Marea de tinta: cataclismo `tide`. |
| **H35** | Shhh | `mission:H34` | `win_battle` `ruptura_bibliotecario` | `l_bibliotecario` (primordial) + 5 gemas | **El Bibliotecario Ahogado** odia el ruido (regla de la batalla: Sonido ×2 + RUIDO, la pone otro agente). Al perder explica el eje de la saga (§2). |
| **H36** | La página de Canelo | `mission:H35` | `use_feature` `pagina_canelo` (la actividad de la página en Páginas emite `feature_pagina_canelo` con H36 activa) | `std` | Una página flota con el nombre de Canelo: «CANELO, ALMIRANTE DE LA FLOTA GATUNA. Hundió 40 barcos. Nunca se bajó del timón.» Una vida que nunca pasó: un **Eco** (05 §7.2: otra posibilidad del mismo gato). Luzterna: «Capi… esto nunca pasó.» Canelo se sienta encima de la página y no se baja. |
| **H37** | Canelo quiere el timón | `mission:H36` | `wins_with_species` `{species:'c_canelo', n:3}` (counter `wins_with_c_canelo`) | `std` | Canelo se trajo la página al barco y se subió al timón. Cuentan **todos los modos**: campaña, encargos, batallas de historia, duelos de isla y el Podio (`countCrewWins`). |
| **H38** | ¡A BABOR! | `mission:H37` | **nuevo** `final_blow` `{species:'c_canelo', n:1}` (counter `canelo_final_blow`) | `std` + 3 gemas + `unlocks: ["forma:canelo_almirante"]` | Canelo da el **golpe final**: su tiro es el último que le pega al rival antes de ganar (§1.2). «La página se completa»: Canelo es el almirante de su Eco. Luzterna: «Sigue siendo el mismo gato impaciente. Ahora con sombrero.» Después, la revelación de la forma (§4). |
| **H39** | Isla Nácar | `mission:H38` | `win_battle` `ruptura_nacar` | **elemento `crystal`** + `c_brillito` + 20 cristales de Cristal | **Al aparecer** pone el flag `region:nacar`. El barco de Prismarina solo aparece en la región cuando resuelves el **puzle del haz** (la actividad emite `feature_haz_nacar` y la región pone el flag `nacar_haz_ok`). Mientras tanto, la misión fijada te lleva a la isla. Descubrimiento de **Cristal**. |
| **H40** | Madre Nácar | `mission:H39` | `win_battle` `ruptura_madrenacar` | `l_madrenacar` (primordial) + 5 gemas | Los cristales recuerdan todo lo que reflejan. En uno se ve **un gato que no está** en los peñascos frente a tu isla (REGISTRO 000); en otro, **tu isla abandonada**, que siembra la Oleada 4. |
| **H41** | La letra en el margen | `mission:H40` | `win_battle` `ruptura_corrector` | 10 gemas + `c_espumita` + flag `oleada1_fin` | Aparece el primer **Corrector**: un barco blanco perfecto, «La Fe de Erratas». Su tripulación incluye **un Canelo que sí obedece** («Qué asco», dice Luzterna; el tuyo es almirante y no obedece ni a su sombrero). Firma «—N.»: la N es de *Normal*. Final con gancho → **Continuará: EL CIELO DESPIERTA**. |

### 1.1 Las islas 3D en la carta: el MAR DE LAS RUPTURAS

- **Dónde.** `scenes/MapScene.ts`. Una hoja pegada con cinta al borde derecho de la carta, **fuera de las seis zonas**: papel más nuevo, borde rasgado, tinta más fresca y un poco desalineada (impresión fuera de registro). Título «Mar de las Rupturas», nota «Mar abierto. Aquí no hay nada.» tachada y corregida: «Siempre estuvo aquí.»
- **Cuándo.** Solo si alguna isla tiene su flag (`REGION_INFO[id].mapFlag`: `region:paginas`, `region:nacar`). Sin la Parte II no hay hoja y la cámara de la carta es la de siempre.
- **Quién pone el flag.** `state/sys/rupturas.ts`: al aparecer H33 (`region:paginas`) y H39 (`region:nacar`). Es idempotente y se repara al cargar (`syncRegionFlags`). Los flags se quedan: las islas se pueden revisitar siempre.
- **Qué se ve.** Cada isla con su nombre; una **«!» roja** si la misión de historia activa pasa ahí (`regionCalls`), y la carta abre enfocada en esa isla. La primera vez que aparece, la tinta «se empapa» con un sello «¡NUEVA ISLA!».
- **Tocar una isla** → `goRegion(id)`. El botón IR de la misión fijada también lleva a la isla cuando la meta pasa ahí (`regionForGoal`): H33, H36 y H39 mientras el haz no esté resuelto.
- **Lógica pura** (para pruebas y para la región): `mapRegions()`, `regionCalls(id)`, `regionForGoal(goal)`, `regionBattleReady(battleId)`, `nacarHazOk()`.
- **Beats dentro del 3D.** `app/story.ts` reconoce la `RegionScene` (`where() === 'region'`). Ahí solo suenan los beats marcados `inRegion` (llegada a Páginas, saludo de la Archivista, la página de Canelo) u `onlyOn: 'region'`; lo de la Parte I y los paneles de misión esperan a la isla o la carta. `special: 'region'` es un beat que **viaja** a una región (la cinemática de H31).

### 1.2 El golpe final (H38)

- **Regla.** El golpe final es el **último tiro de un gato** del lado ganador que le hizo daño al rival (estructura, módulo, gato o parte de jefe). La andanada automática de cañones sigue el tiro del gato, así que no se lo roba; otro gato que dispare después, sí.
- **Dónde.** `battle/sim.ts`: `lastBlow[side]` se anota en `fire()` y `finalBlow` lo devuelve cuando hay ganador. No usa azar: la pantalla (`BattleScene` → `BattleResult.finalBlow`) y la estimación sin cabeza (`autoplay` → `AutoResult.finalBlow`) dan lo mismo con la misma semilla.
- **Contador.** `countCrewWins(uids, finalBlow)` (`state/sys/campaign.ts`) suma `<especie>_final_blow` (sin el prefijo de rareza: `canelo_final_blow`) si el autor del golpe iba en la tripulación. Lo llaman campaña, encargos, historia (solo si se ganó, no en las de «daño») y duelos de isla. En el Podio (1 contra 1), una victoria por **K.O.** es el golpe final de ese gato (`Duel.finish`/`koBy` → `applyDuel(…, ko)`); ganar por decisión de los jueces solo cuenta para H37.

**Tono.** Es el de siempre (03 §6): Luzterna sarcástica, groserías ligeras con su versión `SOFT`, gritos de ataque en inglés o japonés. Cada beat lleva **máximo 4 líneas** seguidas.

**Líneas clave (canon, usarlas tal cual o muy cerca):**
- H31 (al aparecer): «Capi. Capi. Despierta. No, no es una pesadilla: las estrellas se están cayendo… para ARRIBA.»
- H31 (al cumplir): «Mi linterna alumbra para afuera de la caja, Capi. Y el mar está reflejando una isla que no está ahí.»
- H35 (Bibliotecario, al perder): «Distraxia era el olvido del Archivo, niño. Mientras ella borraba, la tinta se secaba. Ahora nadie borra… y alguien está escribiendo.»
- H35: «Hay notas en los márgenes de tu página. Con una letra que no es de nadie que conozcas.»
- H36 (la página): «CANELO, ALMIRANTE DE LA FLOTA GATUNA. Hundió 40 barcos. Nunca se bajó del timón.» Luzterna: «Capi… esto nunca pasó.»
- H38 (la página se completa, Luzterna): «Sigue siendo el mismo gato impaciente. Ahora con sombrero.»
- H40 (Madre Nácar): «Los cristales recordamos todo lo que reflejamos. Mira este. ¿Ves al gato en las rocas? Tú tampoco lo viste la primera vez.»
- H41 (Corrector): «Su isla tiene demasiadas contradicciones, Capitán. Gatos que no obedecen. Una farera muerta que habla. Las vamos a corregir.»
- H41 (Luzterna): «¿Corregirnos? Sobre mi cadáver. …Ah, verdad.»

## 2. El eje (aprobado por el dueño) y lo que la Oleada 1 revela y calla

**Lo que se revela:**
- **Distraxia era el olvido del Archivo**; su página en blanco se está escribiendo, y eso son las Rupturas.
- **Alguien escribe en los márgenes.** No se dice quién: son los Titiriteros, pero en la Oleada 1 solo aparece su letra.
- **REGISTRO 000** es una ficha que nadie escribió; su estado es *observando*.
- Los **Correctores** aparecen como amenaza «amable».

**Lo que se calla:** qué es REGISTRO 000, quiénes son los Titiriteros y la relación del jugador con ellos (se siembra con «FOLIO 001»).

**Hilos de la Parte I que se pagan aquí:**
- la palabra de estática = FOLIO;
- el Faro del Primer Mar «que no apunta a casa»;
- «algo viene detrás de ti» (Distraxia);
- la carta «—N.».

## 3. Contratos para el código (ids para siempre)

**Elemento nuevo.**
- id `crystal`, nombre **Cristal**.
- Lenguaje visual: NÁCAR PRISMÁTICO.
- Verbo: **redirigir** (rebotes y barreras que refractan).
- Afinidad orientativa:
  - Cristal ×1.5 contra `light` y `sound`.
  - `earth` ×1.5 contra Cristal.
  - El agente de balance ajusta el resto respetando la matriz.

**Especies y slugs** (arte en `public/cats-svg/<slug>.svg` + `lite/<slug>.svg` + rig en `catRigs.json`):

| id | Nombre | Rareza | Elementos | Rol | slug | Cómo se consigue |
|---|---|---|---|---|---|---|
| `c_brillito` | Brillito | common | crystal | soporte | `brillito_crystal_cat` | H39 (premio) + Resonancia común de Cristal |
| `r_facetas` | Facetas | rare | crystal + earth | tanque | `facetas_geode_cat` | Resonancia |
| `r_espejito` | Espejito | rare | crystal + light | controlador | `espejito_mirror_cat` | Resonancia |
| `e_prismarina` | Prismarina | epic | crystal + water | francotirador | `prismarina_seaglass_cat` | Resonancia |
| `l_madrenacar` | Madre Nácar | legendary (primordial) | crystal | invocador | `madrenacar_pearl_cat` | H40 |
| `s_refracta` | Refracta | epic (secreto) | crystal + cosmic | asediador | `refracta_prism_cat` | Receta secreta, con pistas (sistema de `secretClues`) |
| `c_marcapaginas` | Marcapáginas | common | magic | artillero | `marcapaginas_bookmark_cat` | H34 + Resonancia común |
| `r_tintero` | Tintero | rare | shadow + water | controlador | `tintero_ink_cat` | Resonancia |
| `e_archivista` | Archivista | epic | magic + water | soporte | `archivista_scholar_cat` | Resonancia |
| `l_bibliotecario` | El Bibliotecario Ahogado | legendary (primordial) | water + magic | demoledor | `bibliotecario_drowned_cat` | H35 |
| `c_espumita` | Espumita | common | water | asediador | `espumita_foam_cat` | H41 + Resonancia común |
| `r_farolillo` | Farolillo | rare | light + water | francotirador | `farolillo_angler_cat` | Resonancia |

**Formas (evoluciones), no son especies:**

| forma | de | slug | Desbloqueo |
|---|---|---|---|
| `canelo_almirante` | `c_canelo` | `canelo_admiral_cat` | flag `forma:canelo_almirante` (premio de H38 «¡A BABOR!») |
| `canelo_astral` | `c_canelo` | `canelo_astral_cat` | **sellada** hasta la Oleada 3 (Puerto Cometa). Se ve bloqueada con la pista «Algo en el cielo todavía no se abre». |

**Batallas de historia** (en `state/sys/rupturas.ts`, siguiendo el patrón de `grietas.ts`): `ruptura_paginas`, `ruptura_bibliotecario`, `ruptura_nacar`, `ruptura_madrenacar`, `ruptura_corrector`.

**Flags y contadores nuevos:**
- contadores: `feature_faro`, `feature_registro000`, `feature_region_paginas`, `feature_pagina_canelo`, `feature_haz_nacar`, `wins_with_<species>` (todos los modos), `<especie>_final_blow` (`canelo_final_blow`);
- flags: `region:paginas`, `region:nacar`, `nacar_haz_ok`, `forma:canelo_almirante`, `oleada1_fin`;
- beats vistos de la carta: `carta_paginas`, `carta_nacar` (la animación «¡NUEVA ISLA!» una sola vez).

**Tipo de meta nuevo:** `final_blow` `{ species, n }` (`missionGoals.ts` + `evalGoal`), contador desde que aparece la misión.

**Hablantes nuevos (`SPEAKERS`):**

| Hablante | Retrato |
|---|---|
| `ARCHIVISTA` | `archivista_scholar_cat` |
| `BIBLIOTECARIO` | `bibliotecario_drowned_cat` |
| `PRISMARINA` | `prismarina_seaglass_cat` |
| `MADRE NÁCAR` | `madrenacar_pearl_cat` |
| `CORRECTOR` | sin cara: tipo system, blanco perfecto |
| `CATDEX` | sin cara: tipo system |

**REGISTRO 000 en superficies que ya existen** (03 §4). No es obtenible.
1. **Catdex:** ficha especial antes del 001. Glitch y estática, campos *desconocida / ninguno / no aplicable / observando*. Al abrirla emite `feature_registro000`.
2. **Ficha de tripulación:** desde H32 dice «FOLIO 000 — ~~vacante~~».
3. **Pie de foto del Diario:** 2 % «FOTO: archivo. Nadie recuerda al cuarto gato.»
4. **Chat del casino:** usuario `registro_000`, una línea rara por sesión.

## 4. Formas (evoluciones de Canelo)

- **Datos:** `src/data/rupturas/formas.ts` (registro de formas) y un campo opcional `form?: string` en la instancia del gato. Las partidas viejas no cambian: ausente = forma original.
- **Arte:** donde se resuelve el slug de una instancia, la forma activa manda.
- **Combate:** la forma puede **añadir un elemento** (Almirante = Fuego + Agua) y cambiar su ulti a **¡A BABOR!**, con una mecánica de liderazgo existente (por ejemplo, un buff a la tripulación). La subida de poder es modesta; no lo vuelve el mejor gato del juego.
- **UI:** en la ficha del gato (CatPanel), «FORMA: Original / Almirante / Astral (sellada)». Cambiar es gratis e instantáneo.
- **Revelación:** cuando aparece el flag `forma:canelo_almirante`, se muestra una revelación y un toast: «¡Canelo Almirante! Cámbialo en su ficha.»

## 5. Pruebas mínimas por pieza

- `npm test`, `npm run typecheck` y `node scripts/verify-missions.ts --all` (que debe leer el contenido fusionado).
- **Partida vieja que ya terminó** (fixture `post-story` o equivalente con H30 hecho): H31 aparece y el parche avisa.
- **Partida que no terminó** (`late-game`): no aparece nada de la Parte II, ni islas en la carta.
- **Arco de Canelo:** las victorias cuentan en todos los modos (historia, duelos, Podio); el golpe final solo si fue suyo y ganaste; nada de antes de que la misión apareciera.
- **Golpe final:** misma semilla, mismo autor del golpe (pantalla = estimación).
- **Batallas:** cada una se puede ganar con una tripulación post-historia. Se calibra con sims headless, como en `finale.ts` y `grietas.ts`.
- **Formas:** cambiar de forma persiste, una partida vieja sin `form` carga igual, y la forma no altera a otros gatos.
