# 26 · Oleada 1 en escenas: «La Marea Imposible» como experiencia audiovisual (INTERNO — contiene spoilers)

> Agente O1-CINE, 2026-10-09. Base: `20-estados-y-cine.md` (estados del mundo + CINE), `18-catalogo-musical.md` §5.2/§8,
> `19-audio-arquitectura.md` (`audioApi`), `23-variaciones-musicales.md` (grabaciones nuevas). Sin commit.

**Regla:** si la historia lo dice, pasa en el mundo. Menos palabras, más mundo; la música se siente compuesta para el
momento (nunca se explica); el jugador hace algo cuando suma; lo que cambia, se queda.

---

## 0. Arreglos de la revisión de la apertura

### 0.1 «Hush»: nada interrumpe una escena (`src/ui/hush.ts`)

- `hush(llave, on)` cuenta retenciones por llave; `hushed()`; `whenCalm(fn, llave)` encola (deduplicado por llave,
  máximo 24, gana lo más nuevo) y devuelve `true` si había que esperar.
- Al soltarse la última retención: **0,9 s de respiro** y la cola sale **de a uno cada 0,35 s** (nunca se apilan).
- Quién retiene: la CINE mientras tiene la pantalla (barras arriba o HUD fuera: `cine/index.ts › holdScreen`; al
  devolver el control —barras abajo— se suelta, aunque la escena siga esperando un toque), el **viaje** de la
  historia a una región (`story.ts`, hasta que la escena de destino toma la pantalla o 8 s).
- Quién espera: `tip()` (las tarjetas «NUEVA MISIÓN» incluidas; también las que ya estaban en su cola), `toast()`,
  el director de historia (paneles de misión, banners, beats, explicaciones: `canTip` / `canRegionBeat`), la
  revelación de formas (`formsFlow.calm`), los microeventos (no aparecen; uno activo se esconde **y su reloj rojo se
  detiene**: `setMicroHeld`). Las líneas de la propia escena pasan (`force`).
- Verificado en Chrome: un toast y una tarjeta «NUEVA MISIÓN» disparados en el segundo 3 de una escena no aparecen
  durante ella y salen después, en orden.

### 0.2 Ajustes › «VOLVER A VER» (`src/cine/replay.ts`, `src/panels/Replays.ts`)

- Botón **VOLVER A VER** en Ajustes › PARTIDA (reemplaza a VER PRÓLOGO: la columna izquierda ya no tenía lugar) →
  panel con el **Prólogo** y las escenas de la Parte II ya vistas, en orden de la historia, con títulos sin sorpresas.
- La lista es pura (`registry.replayList(beatsSeen)`): cada `CineScript` declara `replay: { title, seen, order,
  region?, enters? }`.
- `replayScene(id)`: escenas de isla → vuelve a casa y espera el escenario; de región → zarpa a la isla 3D y espera su
  escenario (`pendingRegionReplay` hace que Páginas empiece hundida para repetir la llegada); «el reflejo» es la visita
  misma (`enters`).
- **Nunca cambia el progreso:** `replay: true` salta todo `persist`, cada `call` con efectos revisa `ctx.replay`
  (formas, Fonoteca, sostener el día), y al terminar el mundo vuelve mezclando al estado que dice la partida.

### 0.3 La CARTA y las nubes de noche

- `island/night/mapNight.ts` (montado en `MapScene`, entre la viñeta y el HUD): lavado índigo en **multiplicar**
  sobre el papel (0,42 a noche plena: la tinta sigue siendo tinta), 46 estrellas de **lámina dorada impresas** que
  titilan, algunas que **suben** cuando las estrellas caen hacia arriba, y de día la **costura** como un hilo cosido
  a través de la hoja. Sigue el mismo estado derivado que la isla (con reloj incluido). Parte I: invisible.
- Además la carta **guarda lo que la historia escribió en ella**, con una letra que no es de nadie: las notas al
  margen tras el Bibliotecario y la firma «—N.» tras el Corrector (esquinas, tinta azul-negra al 50 %).
- Las nubes de papel sobre las expansiones bloqueadas viven en la capa de UI del mundo (`bubbles`, sin gradar):
  ahora llevan `label = 'veilClouds'` y `IslandNight` las tiñe con la luz del look (`worldUiTint`: tinte × exposición
  + piso). De noche son nubes azul pizarra; de día, blancas.

### 0.4 El «cielo con costura» sigue la hora real (`worldState.ts › clockLook`)

- `WorldStateDef.clock`: solo `cielo_roto` lo tiene. Puro: `clockLook(look, hora)`: dorado al atardecer (pico
  ~18:45) y al amanecer (~6:00), noche azul **suave** de 20:45 a 4:45 (exposición 0,8, cielo 0,62, algunas
  estrellas, ventanas encendidas, sin aurora) — nunca la noche astral de la historia, nunca negro, el sonido no cambia.
- La isla lo relee cada 20 s y mezcla en 8 s. El **amanecer** de la historia «sostiene el día» mientras lo miras
  (`holdDay`); la hora real vuelve la próxima vez que llegas a casa. Dev: `?hour=22` o `__night.hour(22)`.
- La noche astral ahora termina **cuando amanece en pantalla** (`b33_paginas#a`, escena del amanecer) en vez de al leer
  FOLIO; aterrizar en Páginas (H33) también la termina. `tests/worldState.test.ts` lo cubre.

---

## 1. Herramientas nuevas

| Pieza | Dónde | Qué |
|---|---|---|
| Paso `drive` | `cine/types.ts`, `runner.ts` | Parámetro con nombre 0..1 (la isla que sube, la isla lejana, el fantasma del reflejo). SALTAR lo lleva al final |
| Cámara 3D | `CameraCmd.to = [x,y,z]` + `dist/pitch/yaw` | `RegionStage.cameraTween`: la órbita se interpola en el reloj de la cine (FPS-independiente) |
| `ctx.own(stop)` | runner | Limpieza garantizada (soltar un cue, quitar un *duck*) termine como termine |
| `ctx.releaseWorld(s)` | runner | Devolver el mundo al estado derivado a media escena (la corrección que se rompe) |
| Escenario de región | `regions/cineStage.ts` | `RegionScene` lo registra al terminar de construir; la región presta `RegionBuild.cine` (puntos, fx, drives) |
| Efectos de pantalla | `cine/screenFx.ts` | `glitch` (la imagen se rompe: Glitch + RGB split, escalonado; suave con «reducir destellos»), `banner` (línea de sistema que se tipea en estática), `card` (CONTINUARÁ), `ink` (letra que se escribe sola), `fade`, `point` (flecha sobre un botón del HUD), `markNew` |
| Efectos de isla | `island/night/cineFx.ts` | `stand`/`swap` (doble de pintura para transformaciones), `page` (la página dorada cae, escribe, envuelve), `silhouette` (gato de estática en las rocas), `hideCats`, `pose` (todos iguales) — con `off: true` para apagarlos a media escena |
| Sonido de escena | `cine/sound.ts` | `stingerOr` (stinger declarado o motivo propio), `motif` (célula del arco, REGISTRO 000 desafinado, el Eco en cajita, los acordes «perfectos», cristal, vacío, pluma), `cueBest`, `unlockMoment`/`syncO1Songs` (Fonoteca) |
| Ganchos de línea | `cine/lineHooks.ts` | Una superficie reacciona a una línea del diálogo (la ficha revela FOLIO con la leyenda) |
| Historia | `app/story.ts` | `travel` (una escena de isla pendiente te lleva a casa desde la carta), `until` (escena superada → vista), nunca una cine bajo un panel, `storyLines` (líneas personalizadas para repetir) |

---

## 2. Escenas

Formato: **sentir · qué cambia en el mundo · cómo se muestra · quién reacciona · qué hace el jugador · audio · qué
persiste**. Todas: barras + SALTAR (Esc), pausables (un panel congela el reloj), interrumpibles (cambiar de escena
devuelve el mundo), «reducir movimiento» (cámara corta, menos partículas, sin sacudidas) y «reducir destellos».

### H31 b · «Desde el faro» (`h31_faro`, isla) — líneas b31 [4..6]
- **Sentir:** vértigo tranquilo; la luz apunta a algo.
- **Mundo:** el haz deja de girar y **apunta hacia afuera** (rumbo 3,45 rad: arriba-izquierda); las lagunas reflejan
  algo raro; la cámara sube a la lámpara y luego sigue la luz mar adentro.
- **Audio:** noche astral; `reveal` suave cuando habla del Faro del Primer Mar.
- **Persiste:** `b31_estrellas#b`. Ese mismo rumbo es donde al amanecer aparece la isla de libros.

### H31 · «El reflejo» (`reflejo`, región 3D; la visita ES la escena)
- **Sentir:** asombro, un poco de miedo.
- **Mundo:** desde la lámpara la cámara sube sobre el mar mientras **las estrellas salen del agua hacia arriba**; baja al
  agua: la isla de libros **brilla al revés** (drive `ghost` 0,15→1); sube: arriba no hay nada; vuelve.
- **Palabras:** 3 líneas (antes 4 diálogos que se pisaban con la cámara; ahora la línea espera a que leas).
- **Audio:** `yonose_todo.menu_loop` (si existe; si no, `.ambient`) a −10 dB (*duck* con llave, soltado con `own`);
  sin pista, silencio + cama `night_astral`; la **célula del arco** cuando aparece el reflejo.
- **Persiste:** `b31_reflejo` (lo marca la historia antes del viaje).

### H32 a · «Una ficha de más» (`h32_registro`, isla, noche)
- **Sentir:** algo te mira.
- **Mundo:** 1,6 s de **silencio** (solo la noche); la **imagen se rompe** (glitch de la escena), una línea de sistema
  se tipea en estática («NEW ENTRY DETECTED — REGISTRO 000 · AUTOR: — · FECHA: —»: antes eran dos diálogos);
  sorpresa en los gatos despiertos, **Canelo bufa**, «?» sobre los curiosos.
- **Jugador:** recupera el control; el **botón CATDEX** se rompe también, flecha **ÁBRELA** y «¡NUEVO!» hasta abrirlo.
- **Audio:** motivo **REGISTRO 000** (Si–Do♯–Re, la célula del arco un semitono arriba, cajita desafinada −30 cents
  con vaivén, cinta) — stinger `registro_000` si algún día tiene archivo; si no, el motivo procedural.
- **Persiste:** `b32_registro#a` + «¡NUEVO!» en el botón.

### H32 · la ficha se mete sola al Catdex (`panels/collection/registro000.ts`)
- Primera apertura con H32 activa (`b32_registro#dex`): la música se calla, a 1,15 s el **panel del Catdex se
  rompe**, suena REGISTRO 000 y la ficha **parpadea desde la estática** al primer lugar; a 3,2 s la música vuelve.
- Al tocarla: H32 se cumple y, cuando la leyenda dice «se deja leer: F·O·L·I·O», **la estática de la tarjeta grande
  revela FOLIO letra por letra** (gancho de línea `b32_registro#b` [1]).

### H33 a · «Amanece» (`h33_amanecer`, isla)
- **Sentir:** alivio, y enseguida una pregunta nueva.
- **Mundo:** la música nocturna se va; **hora azul** (estrellas que se apagan, lámparas aún encendidas, los gatos
  bostezan); con la **célula del arco** sale el sol dorado, vuelven las gaviotas, los gatos se estiran; **en el
  horizonte, donde apuntó el haz, hay una isla de libros** (drive `farIsle`). Luego el día con su costura.
- **Jugador:** 2 líneas + «Abre la CARTA» con flecha sobre ¡ZARPAR!.
- **Persiste:** `b33_paginas#a` (termina `noche_astral`) y **la isla lejana queda en el horizonte para siempre**
  (`island/night/farIsle.ts`, derivado: amanecer visto o H33 hecha).

### H33 b · «Tierra a la vista» (`h33_llegada`, Páginas 3D)
- **Sentir:** asombro, algo de pavor.
- **Mundo:** al llegar, la isla **sigue bajo el mar**: solo asoma la punta del faro. Con el golpe inicial de WHEN I LOSE
  **sube de verdad** (13 s): todo baja y sube (terreno, flora, libros, faro; `regions/rise.ts`), el mar sabe dónde está
  el suelo (se reescribe la textura de alturas que lee el océano → la espuma trepa por los acantilados), **cae agua**
  por la línea del mar y vuelan páginas; la cámara entra baja sobre el agua y aterriza en la playa, donde **tus gatos
  bajan uno por uno** (polvo de arena mojada). La leyenda «Tus gatos bajan del barco…» se quitó: se ve.
- **Audio:** `when_i_lose` desde `intro` (golpe en 0, voces en 3,43 al romper la superficie, sin batería hasta 27,4);
  al soltar, el director pone `explore_mystery · paginas` → `when_i_lose.ambient`.
- **Seguro:** si la escena nunca arranca, la isla sube sola a los 6 s. SALTAR la deja arriba con todos en tierra.
- **Persiste:** `b33_paginas#b`; Fonoteca `when_i_lose.ambient`.

### H35 b · «Notas al margen» (`h35_margen`, isla)
- **Sentir:** se mueve el piso de toda la historia.
- **Mundo:** el Bibliotecario explica en casa (la cámara lo busca); la isla toma **color de papel**; cuando dice
  «notas en los márgenes», **una letra que no es de nadie se escribe sola** en los bordes de la pantalla
  («¿y esta isla?», «(ver folio 000)») con raspado de pluma.
- **Persiste:** `b35_shhh#b`; las notas quedan pequeñas en los márgenes de la CARTA; Fonoteca WHEN I LOSE.

### H36 b · «Una página con nombre» (`h36_eco`, Páginas 3D)
- **Sentir:** ternura rara, melancolía.
- **Mundo:** la página dorada aterriza en el libro y **brilla**; la cámara baja sobre ella; la leyenda ES la página;
  Canelo sube y se sienta encima (se ve: se quitó la leyenda que lo contaba).
- **Audio:** el **Eco**: la melodía de LIKY FIGHT (Re–Si♭–Sol) en **cajita de música**, dos veces, la segunda dándose
  cuerda hacia abajo. `stinger('eco')` si existe; **hoy no hay archivo `eco`**: suena el motivo procedural.
- **Persiste:** `b36_pagina_canelo#b`; desde H37 **la página va con Canelo** en tu isla (bajo sus patas) hasta H38.

### H38 b · «Un sombrero nuevo» (`h38_almirante`, isla) — transformación, no popup
- **Sentir:** orgullo y payasada.
- **Mundo:** luz de escenario sobre Canelo; un **doble de pintura** lo muestra como era; **su página cae del cielo
  como hoja** y su última línea **se escribe sola** («…y el último cañonazo fue suyo.»); la página lo **envuelve en
  tiras de papel**; en el **downbeat del clímax** estalla con el sombrero (¡A BABOR!), los gatos cerca saltan.
- **Audio:** `liky_fight` desde `break4` (205,19): el clímax (218,01) cae 12,8 s después → `sync: section:climax`
  (sin música: el mismo tiempo, y `reveal`).
- **Persiste:** `b38_a_babor#b`; **la primera vez se queda con el sombrero puesto** (`setForm`, solo si nunca vio la
  forma y está en la original; se cambia gratis en su ficha); la tarjeta de forma (`formsFlow.revealForm`, ahora con
  `worn`) cierra la escena y `formsFlow` ya no la repite (`FORM_SCENE` espera la escena si está en cola).
- Fonoteca LIKY FIGHT.

### H39 · el haz de Nácar (interactivo, `regions/nacar*.ts`)
- Cada vez que el haz se asienta, **suena una nota de cristal por espejo tocado** (Mi menor, sube con cada rebote):
  el jugador «afina» el haz. Al llenar la puerta: la música **contiene el aliento** (*duck* −9 dB), acorde de cristal;
  al romperse, `discovery_mi` (en la tonalidad de la isla). Región: `explore · nacar` → `amb.nacar`.
- Fonoteca `amb.nacar` en la primera visita.

### H40 b · «Lo que recuerda el cristal» (`h40_cristal`, isla)
- **Sentir:** escalofrío, luego pena, luego un chiste para respirar.
- **Mundo:** luz **prismática**; la cámara encuentra **las rocas frente a tu isla** y ahí hay **un gato de estática
  sentado mirándote** (REGISTRO 000 desafinado); **parpadeo** y ya no está. Luego «tu isla sin gatos, sin faro»: los
  gatos se desvanecen, el faro se apaga, el color se va (tono hueco). «Tápalo»: todo vuelve y los gatos saltan.
- Se quitó la leyenda que lo describía: se ve.
- **Persiste:** `b40_madrenacar#b`.

### H41 · «Correcciones» + «Continuará» (`h41_correccion`, `h41_continuara`, isla)
- **Sentir:** lo «perfecto» inquietante, luego desafío, luego el gancho.
- **Mundo:** habla el Corrector; suena el **final raro de CIRCUS MALUS** y la isla **se corrige un acorde a la vez**:
  1) el color se aplana a blanco perfecto; 2) `final_chord_2`: **todos los gatos quietos, mirando lo mismo, a la vez**;
  3) `final_chord_3`: el mar y las estrellas se detienen; `breath`: **Canelo dice que no** (bufa, «¡NO!»);
  `final_chord_4` (el acorde torcido): **la corrección se rompe** (glitch), el mundo vuelve de golpe y queda escrita en
  el cielo una firma: **«—N.»**. Luzterna (2 líneas). Luego el cielo: una costura brilla, el eco del Corrector y la
  tarjeta **CONTINUARÁ · EL CIELO DESPIERTA** sobre la célula del arco **sin resolver**.
- Sin música: los mismos tiempos (`maxWait` = la distancia entre marcadores) y los acordes en cajita seca.
- **Persiste:** `b41_corrector#b`, `#c` y el beat entero (una sola escena; `h41_continuara` existe por si la primera se
  cortó después de su punto sin retorno); «—N.» queda en la esquina de la CARTA; Fonoteca CIRCUS MALUS.

---

## 3. Fonoteca (doc 18 §8, idempotente, después de cada escena)

| Ref | Momento |
|---|---|
| `yonose_todo.menu_loop`, `amb` (el motivo: «Otras grabaciones»), `amb.night_astral` | Clímax de la apertura (`b31_estrellas#a`) |
| `when_i_lose.ambient` | Llegada a Páginas |
| `when_i_lose` | Escena del Bibliotecario (H35) |
| `liky_fight` | La transformación (H38) |
| `amb.nacar` | Primera visita a Nácar |
| `circus_malus` | La corrección (H41) |

- `unlockMoment` solo desbloquea refs que existen en `tracks.json` (sin discos fantasma) y espera el *hush*.
- `syncO1Songs` (6 s después de llegar a casa) pone al día una partida que ya pasó esos momentos (y lo que llegue con
  archivos nuevos). La colección sobrevive al reinicio narrativo (`ext.music` + espejo).
- La apertura **precalienta** `amb` (archivo del stinger `star_fall`) y `amb.night_astral`: EL EVENTO no espera la red.
  Si el archivo nunca carga, el stinger no suena (límite del motor: `stingers.ts` no cae a la receta) y la escena sigue.

## 4. Datos

- Ids de beats **intactos**. Líneas quitadas porque el mundo ya las muestra: b32 [0, 1] (sistema y catdex), b33 [3]
  (gatos bajan), b36 [5] (Canelo se sienta), b38 [2, 3] (la página se completa, el sombrero), b40 [4] (el gato en las
  rocas), b41 [5, 10] (la firma, CONTINUARÁ). Índices actualizados en `rupturasScript.ts`. Los saves solo guardan claves.
- `director.json › contexts`: `explore_mystery:paginas` y `explore:nacar`.

## 5. Verificación

- **Pruebas:** `tests/oleada1Cine.test.ts` (hush: cola, dedupe, respiro, pasos, retenciones anidadas, tope; lista de
  VOLVER A VER; ninguna repetición persiste; SALTAR siempre llega a cada `persist`; cada beat O1 hecho escena apunta a
  una escena registrada en el escenario correcto que dice exactamente sus líneas y guarda su clave; el amanecer guarda
  cuando ya es de día), `tests/worldState.test.ts` (noche hasta el amanecer, `clockLook`), `tests/rupturasStory.test.ts`
  (la ola completa como escenas: mundo, isla lejana, la página de Canelo, VOLVER A VER, Fonoteca).
- **Visual:** ver §6.

## 6. Resultados en Chrome sin cabeza (GPU real)

Vite propio (5218, sin HMR ni WebSocket), Chrome con ANGLE Metal, `--autoplay-policy=no-user-gesture-required`,
perfil propio, 1600×900. Partidas: `post-finale` llevada a cada punto con las funciones reales del juego
(`tapFaro`, `openRegistro000`, `applyStoryResult`, `countCrewWins`…), `late-game` para la Parte I. Se capturaron
secuencias de cuadros (CDP screencast, 0,2–0,9 s) de cada escena y se revisaron en hojas de contacto. Capturas
fuera del repo; al terminar se borraron perfiles, Vite y cuadros, y quedaron solo las hojas de contacto (21, 7 MB) en el
scratch de la sesión (`scratchpad/o1-sheets/`).

| Qué | Resultado |
|---|---|
| Hush | Un toast y una tarjeta «NUEVA MISIÓN» lanzados a mitad de `h31_faro` no aparecen durante la escena; salen después. El hueco faro → reflejo quedaba suelto 0,3 s (el toast se colaba en la carga de la región): ahora la historia sostiene la pantalla entre escenas seguidas (`holdBetween`) y durante el viaje (`travel`). Microeventos ocultos y con reloj quieto |
| `h31_faro` | El haz deja de girar y apunta mar adentro; la cámara sigue la luz; 3 líneas |
| `reflejo` | Mar de noche, estrellas que suben del agua, el reflejo que se aclara, cielo vacío; 3 líneas; vuelve a casa de noche |
| `h32_registro` | Silencio → la imagen se rompe (franjas + RGB), la línea de sistema se tipea en estática, «?» y Canelo bufando; ÁBRELA sobre CATDEX + «¡NUEVO!» |
| Catdex | Primera apertura: el primer hueco vacío, el panel entero se rompe y la ficha parpadea desde la estática; queda |
| FOLIO | Con la leyenda, F · FO · FOLI · FOLIO aparecen sobre la estática de la tarjeta grande y se enmarcan |
| `h33_amanecer` | Noche → hora azul (estrellas, bostezos) → sol dorado → día con costura; la isla de libros queda en el horizonte; «LA CARTA» sobre ¡ZARPAR! |
| Recarga | Misma isla, mismo estado; a medianoche real `cielo_roto` se ve como noche azul suave (reloj), con la isla lejana |
| `h33_llegada` | Solo asoma el faro; la isla sube 13 s con la espuma trepando y agua cayendo; la cámara aterriza en la playa y los gatos bajan uno a uno; 2 líneas. Antes de la escena: sin marcadores sobre el agua y sin tarjetas (hold `arrival`) |
| `h36_eco` | La página aterriza y brilla, Canelo sube y se sienta, la leyenda es la página; cajita de música |
| `h35_margen` | El Bibliotecario explica, la isla se pone color papel, «¿y esta isla?» se escribe sola; después: WHEN I LOSE a la Fonoteca (la tarjeta del disco espera la escena) |
| `h38_almirante` | Doble de pintura, la página cae y escribe, tiras de papel en órbita, estallido «¡A BABOR!» en el clímax, «!» y saltos; Canelo queda con la forma Almirante; tarjeta de forma; LIKY FIGHT a la Fonoteca. Audio medido: contexto `running`, `liky_fight` desde 205,2 s (stream), a los 11 s de escena en 216,0 → el clímax (218,01) cae con el estallido |
| `h40_cristal` | Luz prismática, gato de estática en las rocas, parpadeo, la isla sin gatos ni faro y en gris; todo vuelve |
| `h41_correccion` | Blanco perfecto → todos quietos → el mar quieto → el desgarro y el mundo de vuelta; la firma; el cielo; CONTINUARÁ · EL CIELO DESPIERTA; luego entra la Oleada 2 en orden |
| VOLVER A VER | Ajustes › VOLVER A VER → lista (Prólogo + escenas vistas) → «Amanece» se repite desde la noche real del jugador y al terminar el mundo vuelve a esa noche; misiones, beats y flags idénticos antes y después |
| SALTAR | A mitad de la corrección (repetición): el mundo vuelve al estado derivado al instante, sin quedar blanco |
| Reducir movimiento | La cámara corta, la página aparece sin caer, menos tiras y partículas, sin sacudidas |
| Parte I (`late-game`) | Estado `normal`, sin filtro de grade, sin cielo, sin isla lejana, nubes de velo sin tinte; en la carta `mapNight` existe pero está invisible |
| Carta de noche | Lavado índigo sobre el papel, estrellas impresas, notas al margen y la firma en las esquinas |

**Pendientes / límites**
- Stingers con archivo (`star_fall`, `unlock`): si el archivo no carga, el motor no cae a la receta procedural
  (`audio/stingers.ts`, fuera de este dueño). La apertura los precalienta.
- `eco` y `registro_000` no tienen grabación: suenan los motivos procedurales de `cine/sound.ts` (doc 18 §9).
- Un cuadro de la secuencia de Páginas salió vacío (lienzo 3D sin dibujar) una sola vez durante el diálogo; no se
  repitió en la segunda corrida; probablemente la captura del screencast entre dos lienzos apilados.
- Medir en un equipo modesto con DPR 2.
