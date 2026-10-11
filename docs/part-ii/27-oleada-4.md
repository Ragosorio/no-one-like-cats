# 27 · Oleada 4 «El Umbral» (H58–H65) — INTERNO, contiene spoilers

> Agentes: O4-SISTEMAS (§Sistemas, §Escenas, §Créditos, §Pruebas) y O4-REGIONS (§Regiones 3D). 2026-10-10. Sin commit.
> Guion: doc 13. Música: doc 18 §5.2/§8, con la regla del dueño del 2026-10-10 (abajo).

**Regla de música (dueño, 2026-10-10):** las 6 canciones ORIGINALES quedan reservadas para los 6 «Momentos musicales» (cinemáticas interactivas sincronizadas; otro agente construye el motor). Las escenas, batallas y créditos de esta oleada solo usan variaciones (`*.ambient`, `*.explore`, `*.aftermath*`, `yonose_todo.menu_loop`, `circus_malus.stinger`), piezas `amb.*`, stingers y estados del director. `tests/rupturasO4.test.ts` lo comprueba.

## Regiones 3D

> O4-REGIONS, 2026-10-10. Código: `game/src/regions/{suenos,olvidada,umbral}.ts` + carpetas, kit común `regions/fronteras/kit.ts`, carta `regions/mapO4.ts`. Sin commit.

Las tres islas de «las fronteras» comparten un kit (`fronteras/kit.ts`):

- `lensQuad`: la LENTE de cada región (biblia de arte §7). Es un solo pase a pantalla completa que se multiplica sobre el cuadro.
- `skyShell`: lo que cada región pinta en su cielo, sobre el día/noche del motor.
- `storyBattle`: un marcador «¡A PELEAR!» en un sitio propio (para el Umbral, que tiene dos batallas en dos lugares).
- `mergeInto`: una flota o una bandada en una sola llamada de dibujo.
- `devHook`: `window.__<id>` en desarrollo, para capturas sin cabeza.

### Archipiélago de los Sueños (`suenos`, H58)

**Qué dice la historia y cómo se ve.** «Las islas cambian según qué gatos duermen en tu isla.»
- Cada gato que sueña esta noche (`state/sys/suenosDream.ts`, la misma lectura de la que la batalla H58 sortea sus reglas) tiene su **islote flotante**. El gato duerme encima, en una almohada, pintado en acuarela (lente `ACUARELA` de PaperCat). Si lo tocas: «no lo despiertes».
- Cada islote se decora con lo que sueña su gato:
  - Fuego: volcán de algodón de azúcar.
  - Agua: bola de mar flotante.
  - Naturaleza: flores gigantes y hongo.
  - Tormenta: su propia nube, con lluvia y relámpagos.
  - Hielo: cristales.
  - Magia: libros que vuelan.
  - Cósmico, Vacío y Gravedad: planetas chiquitos en órbita.
  - Tiempo: reloj de arena.
  - Luz y Cristal: cristales que guardan el sol.
  - Sombra: una sombra acostada al revés.
  - Tierra: piedras apiladas.
  - Cada islote tiene además su clima de partículas.
- Otros gatos dormidos → otro archipiélago. Siempre hay al menos 3 islotes; los vacíos son nubes sin inquilino.
- El galeón de **Duermevela** está hundido hasta la cintura en un banco de nubes al oeste, con velas de gorro de dormir y un mascarón de luna. Ella bosteza órdenes en cubierta.
- **Almohadón** duerme en una nube junto al galeón hasta que ganas H58; después ya no está, porque se fue contigo. **Sonámbulo** camina con los ojos cerrados. Nimbo y Lunita son locales que se quedaron dormidos aquí.
- También hay:
  - burbujas iridiscentes del color de cada sueño;
  - linternas de papel que suben;
  - una **ballena con aletas de mariposa** que ronca dando vueltas al cielo (cada ronquido es una burbuja enorme);
  - la **luna con gorro de fiesta** (el chiste del concepto 15);
  - árboles chupaleta y almohadas tiradas en el pasto;
  - tu barco anclado al sur.

**Lente y luz.**
- Lente: grano de papel, florecimientos de acuarela y un sangrado lila en los bordes.
- De día: pastel (melocotón, lila y menta).
- De noche: lila, nunca oscura.
- Cielo: lavados de acuarela que derivan.

**POIs.**
- **¡A PELEAR!** (H58 `umbral_suenos`): el marcador genérico de RegionScene, sobre el galeón.
- **La veleta de los sueños** (lore): gira hacia el sueño más fuerte. Cuenta quién sueña esta noche y qué reglas de sueño son las más probables (`dreamCfgFor`/`likelyDreams` + `dreamInfo`, lo mismo que la batalla). Contador `feature_veleta_suenos`, flag `suenos_veleta`.
- **La capitana** (después de H58): Duermevela habla.
- **La ballena que ronca**: el marcador vuela con ella. Contador `feature_ballena_suenos`.

**Audio.** `setState('explore', {context:'suenos'})`. El contexto `explore:suenos` en `director.json` tiene las pistas `amb.suenos` (cuando exista), luego `yonose_todo.ambient` y luego `liky_fight.explore`. Ambiente `night_astral` al 0,45. La veleta toca el motivo `arco_pregunta`.

**Escena (`RegionBuild.cine`).**
- Puntos de cámara: `llegada`, `centro`, `veleta`, `galeon`, `duermevela`, `cielo`, `ballena` (se mueve) e `isla_0…isla_n`.
- fx:
  - `burbujas`: ráfaga de sueños desde cada durmiente;
  - `bostezo`: Duermevela;
  - `ronquido`: la ballena; `k` es el tamaño.
- drive `sueno` (0..1): intensidad de la lente, flote de los islotes y ritmo de burbujas.

### La Isla que Nadie Recuerda (`olvidada`, H60–H61)

**Qué dice la historia y cómo se ve.** «Es tu isla. La versión en la que nunca llegaste.»
- **Se construye con TU partida** (`olvidada/layout.ts`):
  - La costa es la de tu archipiélago: `island/layout.ts islandPlan`, con la casa y cada expansión comprada que tenga una ruina. Está girada 45° para que la cámara la vea como la página isométrica.
  - Las ruinas están donde están TUS hábitats (`olvidadaRuins()`, en casillas, con el tamaño de su nivel).
  - Tu decoración está donde la tiene la página: palmeras, arbustos, rocas, columnas…, todo seco.
  - El faro apagado está donde está el tuyo; la balsa del prólogo, con su palmera y su caja, en tu playa; hay barriles a la deriva (concepto 10).
- Cada ruina guarda sus dos estados en una sola malla:
  - **rota**: muros caídos, techo en el suelo, su elemento apagado;
  - **entera**: muros, techo del color del elemento, bandera y su pieza central encendida (cono de lava, fuente, árbol, cristales, domo con planeta, libros u obelisco).
  - Reparar es una animación de uniform: los escombros se hunden y el hábitat crece del suelo con un rebote. Las sombras se mueven igual (`customDepthMaterial`).
- Entre las ruinas están **las siluetas** de los gatos que viven en esos hábitats (≤2 por ruina, ≤12 en total): papel gris que no recuerda su nombre.

**Lente: FOTO VIEJA + desaturación selectiva** (`olvidada/memory.ts`).
- Todo se ve sepia (terreno, utilería, cielo y mar mezclan sus keys entre «foto vieja» y color), con grano, polvo, rayas y viñeta café.
- **Solo tus gatos de visita conservan el color.**
- Cada ruina reparada abre una **ventana de color** con un borde cálido que viaja.
- La última manda una **ola** que pinta toda la isla.

**H60 · reparar** (`feature olvidada`).
1. Tocas «REPARAR · HÁBITAT DE …» y aparece la tarjeta **¿QUIÉN LA LEVANTA?** (`olvidada/picker.ts`), con `repairersFor()`: primero tus gatos de ese elemento.
2. Se llama `repairRuin()`.
3. El gato que eligiste aparece y se queda en su ruina, que se levanta con polvo, estrellas, el stinger `discovery_sib` y una sacudida.
4. Sus siluetas toman color a medias.
5. La música sube una capa de «Reconstrucción»: 0/33/66 % = `yonose_todo.aftermath` → `_bajo` → `_ritmo`, que cambian en la misma posición (`sync` + `at: trackTime()`).
6. Con la última ruina:
   - la ola de color recorre la isla;
   - las siluetas se vuelven gatos de verdad y se alegran;
   - el faro se enciende;
   - aparece Polvillo de entre el polvo, mientras no lo hayas recibido todavía (`o4PendingCats`);
   - la cámara se aleja;
   - suena la capa completa. El stinger, el motivo y el desbloqueo de la Fonoteca los pone `app/oleada4Flow.ts`.
   - b60 parte b se reproduce aquí.
- **Sin canciones originales** (regla del dueño).
- Al volver a entrar: la isla reparada se ve en color, con el ambiente `sea` y `setState('emotional',{context:'olvidada'})`. El contexto `emotional:olvidada` en `director.json` tiene `yonose_todo.aftermath_ritmo` → `yonose_todo.ambient`, en loop.

**H61 · la página en blanco** (`feature distraxia`).
- Sobre tu PRIMER hábitat (el primero de `G.s.habitats`) flota una página arrancada. Respira (sube una onda, se le dobla una esquina) y aparece con un fundido cuando H61 se activa.
- **LA PÁGINA EN BLANCO** (actividad): llama a `readDistraxia()`. En la página se ve escritura que se tacha (shader) y suena el motivo `pluma`. Los tachones a pantalla completa y la parte c los pone `app/oleada4Flow.ts`.
- Después de H61, y hasta H64, los tachones se juntan en **una línea de tinta** que corre sobre el mar hacia el borde de la carta. La página sigue ahí, tachada.
- Lore: **El faro apagado**, que pasa a llamarse «El faro» cuando ya está encendido.

**Escena (`RegionBuild.cine`)**, para convertir en cine b60 b, b61 a y b61 c.
- Puntos: `llegada`, `centro`, `pagina`, `faro`, `balsa`, `borde` (hacia el Umbral) y `ruina_<id del hábitat>`.
- fx:
  - `ola` (`at`, `dur`): la ola de color;
  - `tachones`: escritura y tachado en la página;
  - `tinta` (`dur`): la línea de tinta crece;
  - `polvo`: Polvillo se sacude.
- drives:
  - `color` (0..1): foto vieja → color;
  - `reparada` (0..1): todas las ruinas, de rotas a enteras.
- **Hecho (MENORES, 2026-10-10):** b60 b, b61 a y b61 c ya son cines de región (`ui/story/o4RegionCines.ts`: `h60_color`, `h61_pagina` y `h61_linea`; ver §Escenas). La región suma el punto `polvillo`, los drives `pagina`, `escritura` y `linea` (k < 0 devuelve cada uno a lo que dice la partida), `reparada`, que también abre las ventanas de color, y `driveGet('polvillo')`. Además, durante el espectáculo de la última ruina se activa el hush `olvidada_obra`, para que `h60_color` entre cuando termine.

### El Umbral (`umbral`, H62–H63)

**Qué dice la historia y cómo se ve.** «El borde de la página. Del otro lado no hay mar. No hay nada. Todavía.»
- **El borde**: el mar llega hasta un borde de papel rasgado y se acaba. Del otro lado hay una hoja en blanco del tamaño del mundo, con fibras y tinta que se filtra por el borde. Brilla sola, también de noche. El cielo del norte también es blanco.
- **La puerta**, en la última roca: entreabierta, con tres bisagras de latón gigantes, una **gatera** con su aleta que se mece y una cabeza de gato tallada en el dintel. Por la rendija sale luz. **Bisagra** (grande) está junto a la bisagra hasta H63.
- **Las tres fuerzas**:
  - **Correctores**: 7 barcos blancos idénticos en fila perfecta, apuntando al borde (la insignia en medio, más grande). Se mecen al mismo tiempo. Gaviotas en formación. 5 gatos corregidos en fila en la playa, que ronronean a la vez.
    - Desde H62 (ganada): manchas de tinta en cascos y velas.
  - **Disruptores** (H63): grafitis glitch (separación RGB, filas que saltan, chorreados) en rocas de papel rasgado, en el marco de la puerta y uno enorme en el cielo; su nave de grieta con neón; Grafitera pintando el aire; Brecha.
  - **Titiriteros**: hilos de luz que bajan del cielo hasta un único mando (todos los sostiene alguien) y se atan a mástiles, puerta y mar. Pocos en H62, todos en H63. Además, lápices gigantes clavados en el promontorio.
  - Después de H63 (b63 b): los barcos se van, los grafitis se escurren y los hilos suben «como riendas que alguien suelta». Bisagra se fue contigo. Queda la puerta.
- Otros detalles: pilas de papel en blanco junto a la calzada, el promontorio con tinta filtrándose desde el borde, la costura del cielo y la aurora.
- **Hora**: noche fija (22:36) mientras H62 o H63 están activas (el estado de mundo `o4_umbral`). Antes y después, la hora real.

**Lente: TINTA EN EL BORDE**: tinta violeta que entra por las esquinas del cuadro, más grano.

**POIs.**
- **¡A PELEAR!**:
  - en la insignia, H62 `umbral_correctores`;
  - en la puerta, H63 `umbral_final`.
  - Son marcadores propios (`storyBattle`), no `battleSpot`.
- Lore:
  - **La puerta**: Bisagra, o la puerta sola después de H63. Tocar la rendija la hace rechinar.
  - **El borde**: contador `feature_borde_umbral`, flag `umbral_borde`.
  - **La flota blanca**.
  - **Los grafitis** (H63).

**Audio.** `setState('explore_mystery', {context:'umbral'})`. El contexto `explore_mystery:umbral` en `director.json` tiene las pistas `amb.umbral` (cuando exista), luego `te_odio.ambient` y luego `circus_malus.explore`. Ambiente `wind` al 0,55. El borde toca el motivo `arco_pregunta`.

**Escena (`RegionBuild.cine`).**
- Puntos: `llegada`, `puerta`, `bisagra`, `flota`, `insignia`, `borde`, `grafitis`, `hilos` y `cielo`.
- fx:
  - `manchas`: aparecen las manchas, con salpicadura (b62 b);
  - `retirada` (`dur`): las tres fuerzas se van (b63 b);
  - `chirrido`: la puerta rechina.
- drives:
  - `fuerzas` (0..1): flota, grafitis e hilos presentes o ausentes;
  - `puerta` (0..1): cuánto se abre.

### La carta: hoja «LAS FRONTERAS» (`regions/mapO4.ts`)

- Es una última hoja pegada a la derecha de la hoja más a la derecha que exista, debajo del barco. Su **borde derecho está rasgado**: ahí se acaba el papel.
- Solo aparece con los flags `region:suenos` (H58), `region:olvidada` (H60) o `region:umbral` (H62). Nunca en la Parte I.
- Las islas:
  - **Sueños**: una mancha de acuarela con islotes, «z z Z» y la luna con gorro.
  - **La Isla que Nadie Recuerda**: la costa de TU isla con trazo de grafito tembloroso y cruces donde están tus hábitats. Después de H60 está entintada, rellena y con «Ahora alguien sí llegó.».
  - Una línea de tinta une la isla con el borde después de H61.
  - **El Umbral**, en el borde mismo: la puerta, la flota en fila (con manchas desde H62), gaviotas, hilos y un garabato magenta en H63. Después de H63 queda solo la puerta.
- Las islas usan los adornos de las islas de MapScene: listón, «!» rojo cuando la historia espera ahí, sello «¡NUEVA ISLA!» y viajar al tocar.
- Cambios en `MapScene.ts`, cuatro líneas:
  1. el import;
  2. `buildMapO4(this)` después de `buildAstral`;
  3. `mapO4Pos(id)` al principio de `islePos`;
  4. `...mapO4Regions()` en la lista `calling`.

### Verificación (2026-10-10)

- **Capturas**:
  - Chrome sin cabeza, ANGLE Metal, Vite propio en el puerto 5231 sin HMR, con fixtures generados desde `rupturas-o4` en el scratch (H58, H60, H61, H62, H63 y el final).
  - Las tres regiones se capturaron de día, al atardecer y de noche.
  - Interacciones capturadas: reparar 1, 2 y 3 ruinas (ola final, b60 b, Polvillo), la página y los tachones (H61), la línea de tinta, los marcadores de batalla (galeón, insignia, puerta) y la carta en H60 y en H63.
- **FPS** en calidad `alto`, sin tope (Apple GPU, 1600×900): Sueños 162 (p95 12,7 ms), Olvidada 192 (p95 9,9), Umbral 195 (p95 9,6). Draw calls: unas 100, 41 y 83.
- **GPU al salir** (`renderer.info.memory` del mismo renderer después de volver a la carta): 0 geometrías y 0 texturas en las tres.
- **Typecheck limpio. `npm test`: 32 archivos, 379 pruebas en verde.**

### Pendiente

- `amb.suenos` y `amb.umbral` no están grabados. Ya están en los contextos del director y entran solos cuando existan.
- Las 4 capas de `amb.suenos` («una por tipo de gato dormido») piden que la región las encienda: falta la API de capas.
- ~~b60 b, b61 a y b61 c se pueden convertir en cine~~ Hecho (MENORES, 2026-10-10): `h60_color`, `h61_pagina` y `h61_linea`.
- Los gatos de la Oleada 4 se ven con sus suplentes (lote G) hasta que llegue su arte.

## Sistemas

### Cadena H58–H65 (cómo se cumple cada una)

| Misión | Meta | Se cumple con |
|---|---|---|
| H58 El Archipiélago de los Sueños | `win_battle umbral_suenos` | Ganar la batalla (marca en la región `suenos` o IR). Reglas oníricas sorteadas desde quién duerme en tu isla (`suenosDream.ts`). Premio: Almohadón. |
| H59 Ecos de Vida | `use_feature eco` | DESPIERTA en la sección ECOS de la ficha de un gato (`ecos.ts › wakeEco`). Si todos ya despertaron (repetición tras el reinicio), RECORDAR cuenta. |
| H60 La Isla que Nadie Recuerda | `use_feature olvidada` | Reparar todas las ruinas (`olvidada.ts › repairRuin`, lo llama la región). Polvillo se une en casa (registro `cat:mission_H60`). |
| H61 Lo que Distraxia sabía | `use_feature distraxia` | Tocar la página en la región (`rupturasO4.readDistraxia`); luego los tachones (`o4Tachones.ts`). |
| H62 Los Correctores tienen un plan | `win_battle umbral_correctores` | Batalla de 2 fases: LA CORRECCIÓN → EL PLAN (50 % del casco o turno 5). Premio: Tachón. |
| H63 El Umbral | `win_battle umbral_final` | Jefe de 4 fases. Premio: Bisagra. |
| H64 Mentira | `use_feature mentira` | De noche, tocar el FARO (o la página junto a él) → `playFinale()`; «Mentira» cuenta la meta. |
| H65 Continuará | `use_feature continuara` | Los créditos llegan a la ficha de REGISTRO 000 («despertando») → flag `oleada4_fin`. |

### Ecos (`state/sys/ecos.ts`, UI `panels/catEcos.ts`)

- Un Eco es otra vida posible del mismo gato: 21 vidas (farero, pirata de un charco, panadero…), cada una con un recuerdo, un objeto que trajo (sombrero, arena, cicatriz…, dibujados en vector) y un color de acuarela.
- Elegible tras **3 noches** en tu isla (medianoches locales desde `bornAtMs`; gatos viejos con `bornAtMs: 0` siempre). Si H59 espera y nadie llega a 3 noches, el gato más antiguo puede. Canelo ya vivió el suyo (su página de almirante): cuenta como despierto si tiene la forma.
- **Nunca da poder:** un Momento en la ficha, el aspecto (lavado de tinta y papel mojado + el objeto, interruptor VER ECO) y **1 gema** la primera vez de cada gato, por el registro (`eco:<uid>`). Nivel, estrellas, forma y carta de combate no cambian (test).
- Ficha del gato: pestaña **ECOS** en la banda (con «!» si puede despertar). La sección cubre la columna derecha (la izquierda queda: retrato, estrellas, FORMA); auditoría `__overflow()` limpia. El IR de H59 abre la ficha del mejor candidato directo en ECOS.
- Partida: `ext.ecos = { awake: { uid: { eco, at } }, hidden: uid[] }`, opcional, normalizado al cargar; ids desconocidos y claves extra se conservan.

### Estados del mundo (banda 100–129, derivados del progreso)

`o4_suenos` (H58, atardecer de acuarela) · `o4_eco` (H59, mañana suave, NUEVO) · `o4_olvido` (H60, foto vieja) · `o4_tachon` (H61, casi blanco) · `o4_umbral` (H62–H63, noche del borde) · `o4_mentira` (H64, la noche más clara; invita «TOCA EL FARO» solo después de que bajó la página: `b64_mentira#a` visto y `#b` no) · `o4_alba` (H65) · `o4_epilogo` (después).

### La página junto al faro (`ui/story/o4Pagina.ts`)

Objeto en la isla derivado de la partida: flota y respira junto al faro (H64), Canelo duerme encima (desde `b64_mentira#b` hasta el final de H65; el Canelo que camina se aparta) y después queda la página en blanco con la marca tibia del gato. Vive en la capa `graded` de la isla (se busca por su etiqueta de Pixi; la posición sale de `cineStage('island').resolve('faro')`). No edita la isla; `oleada4Flow` la mantiene cada 0,5 s.

### Fonoteca (`app/oleada4Flow.ts › O4_SONGS`, derivado del progreso, solo pistas que existen)

`amb.suenos` (H58) · `yonose_todo.aftermath` (H60) · `circus_malus.stinger` (H62) · `amb.umbral` (H63) · **`yonose_todo` completa (H64)** · `registro_000` (H65). Hoy no existen `amb.suenos`, `amb.umbral` ni `registro_000`: se desbloquearán solos cuando estén en `tracks.json`.

### Reinicio narrativo

`rupturasReset.ts` ya cubre la Oleada 4 de forma genérica: borra posiciones H58–H65, beats `b58…b65` (incluido `b61_distraxia#b`), `region:*`, `won_umbral_*`, `oleada4_fin`; llena el registro (`mission:*`, `battle:umbral_*`, `cat:umbral_*`). Se conservan: Ecos, Polvillo y demás gatos, la respuesta de «¿Qué escribes?» (`mentira:*`). `ext.olvidada` vuelve a ruinas cuando H60 reaparece. Cubierto en `tests/rupturasO4.test.ts` (partida que jugó toda la Parte II → reinicio → repetición sin pagos dobles).

## Escenas

Escenas `src/cine` en tu isla (`ui/story/o4Cines.ts`), lanzadas por el director (`rupturasScriptO4.ts`, `special: 'cine'`, `onlyOn: 'island'`, `travel`, `until`). Máximo 4 líneas por parte.

| Beat | Escena | Qué pasa en el mundo | Sonido |
|---|---|---|---|
| b58 a | `h58_suenos` | Atardecer de acuarela; todos los gatos se duermen uno tras otro; el mismo sueño sube de la isla (ráfaga) y se va al mar. | `explore_mystery` + `amb.suenos` (o `amb.night_astral`) |
| b59 a | `h59_ecos` | Mañana suave; los gatos se estiran y aparecen «?» sobre ellos (cosas que no tenían). | `island`, motivo `eco` |
| b59 b | (diálogo) | Suena sobre la ficha tras DESPIERTA: el Eco «llega despacio» (animación de la sección). | motivo `eco` |
| b62 a | `h62_correctores` | El «mundo perfecto» llega a tu isla: los colores se aplanan a blanco, todos los gatos posan igual; Canelo dice «¡NO!» y la imagen se rompe. | `circus_malus.explore`, motivo `correccion` |
| b64 a | `h64_pagina` | La noche más clara; la página baja del cielo como una hoja y se posa junto al faro (y se queda). | `emotional`, `night_astral` |
| b64 b | `h64_mentira` | Al tocar el faro: «¿Qué escribes?» (cosmético), Canelo sube a la página, tres vueltas, se duerme; «MENTIRA.». | lecho `yonose_todo.aftermath`, stinger `reveal`, motivo `arco` |
| b65 | `h65_creditos` | Amanece, Canelo sigue dormido en la página; créditos. | lecho de 3 capas «Reconstrucción» |

**Escenas en La Isla que Nadie Recuerda** (`ui/story/o4RegionCines.ts`, MENORES 2026-10-10). Mismos ids de beat y mismas líneas; en el director son `special: 'cine'`, `onlyOn: 'region'` con `until`. Los pasos 3D llevan la guarda `inOlvidada`: si se reproducen en otra región, solo suenan las líneas.

| Beat | Escena | Qué pasa en el mundo |
|---|---|---|
| b60 b | `h60_color` | Entra cuando termina el espectáculo de la última ruina (hush `olvidada_obra`). La cámara gira sobre la isla ya en color, los gatos se alegran, estrellas; la cámara baja a Polvillo (o al faro, si ya no está ahí) y se sacude el polvo. |
| b61 a | `h61_pagina` | La cámara baja desde la isla hasta la página que respira sobre tu primer hábitat y se queda ahí, con LA PÁGINA EN BLANCO a mano. |
| b61 c | `h61_linea` | Después de los tachones: la línea de tinta crece sobre el mar y la cámara la sigue hasta el borde; luego vuelve sobre la isla. |

«Volver a ver»: `h60_color` (60,1), `h61_pagina` (61) y `h61_linea` (61,2) llevan `region: 'olvidada'`, así que navegan hasta allá. La repetición pinta el momento (foto vieja → ruinas que se levantan → ola de color; la página en blanco; la línea creciendo) y al terminar o al saltar devuelve la isla a lo que dice la partida (`finish`). No guarda nada. La escena b63 sigue como diálogo. En H60 al 100 % suena el stinger `reveal` con el motivo `arco` (el clímax de la original queda para los Momentos).

**VOLVER A VER:** `h58_suenos` (58), `h59_ecos` (59), `h62_correctores` (62), `h64_mentira` (64, incluye la llegada), `h65_creditos` (65). Las repeticiones no guardan nada.

### Ganchos para los Momentos musicales

- **`// MOMENTO: yonose_todo (H64→H65)`** — `game/src/app/o4Finale.ts › playFinale()`. Única entrada del final; el motor lo toma con `registerFinaleMomento(fn)` y recibe un `FinaleCtx` con la plomería: `ask/choose`, `asleep()` (persiste `b64_mentira#b`), `mentira()` (H64 + Fonoteca), `wake()` (persiste `b65_continuara#a`, H65, `oleada4_fin`), `credits()` (datos). `FINALE_SONG` trae los tiempos (clímax 149,333; tic-tac 202,667). Sin motor: `h64_mentira` → `h65_creditos` sin corte.
- **`// MOMENTO: circus_malus (H62, phase change)`** — `game/src/battle/fx/fasesFx.ts › FasesFx.stage()` espera `faseInterlude(battle, fase)` (registro en `battle/fases.ts › registerFaseInterlude`). Clave: `rupturasO4Battles.ts › H62_MOMENTO` = `umbral_correctores` / `el_plan`. Solo presentación: la simulación ya aplicó la fase.

## Créditos

- **Datos** (`ui/story/creditsParteII.ts › creditsData()`): título y oleadas; **Ragosorio** como creador y compositor de las 6 canciones («CIRCUS MALUS», «Hemkade», «LIKY FIGHT», «WHEN I LOSE», «YONOSE TODO», «te ODIO»); reparto (Canelo con su nombre, Luzterna, la tripulación) y los 34 gatos de la Parte II en orden de aparición (los que no conoces salen como «???»); números de tu partida; gracias y enlaces.
- **Rollo de respaldo** (`playCreditsParteII`): en el reloj (78 s hasta la ficha), con «Reconstrucción» que gana bajo a 1/3 y batería a 2/3 (cambio en el compás, misma posición). Mantener = ×4; **IR AL FINAL** corre a la ficha (la misión es esa ficha); después **CERRAR**. Solo una repetición cierra antes. Al final: ESTADO «~~observando~~ despertando» y CONTINUARÁ.
- Si se recarga entre «Mentira» y el fin de los créditos, se reanudan solos en casa (`oleada4Flow`).

## Pruebas

- `tests/rupturasO4.test.ts` (21): cadena y metas; batallas (H62 con fase EL PLAN, H63 con 4 fases, datos planos); especies; cada línea de cada beat dicha una vez, ≤ 4 por parte, hablantes registrados (DUERMEVELA, LA REDACCIÓN y BISAGRA nuevos en `ui/story/text.ts`), `$scene`; escenas registradas que dicen sus líneas y guardan su clave (también con SALTAR); VOLVER A VER; ninguna original sonando; ganchos MOMENTO; Ecos (normalizar, noches, estados, DESPIERTA sin poder, premio único, sin bloqueos); la oleada completa; estados del mundo y la página; plomería del final y créditos como datos; reinicio + repetición sin pagos dobles; batallas sin cabeza y deterministas.
- Balance (`scripts/balance-o4.ts`, 16 semillas × 2 bases, tripulación post-final): Archipiélago 100 % · t5,9 · −2 %; Correctores 100 % · t8,2 · −28 %; El Umbral (×1,35, casco ×5, ataque por fase 1,2/1,3/1,5) 100 % · t7,0 · −9 % (normal) / −11 % (difícil). **Sin muros, pero el jefe final no era difícil** con esa tripulación. Resuelto en §Balance de jefes (bandas de dificultad).
- Fixture `test-saves/rupturas-o4.json` (H57 hecha) regenerado por código (`scripts/make-o4-fixture.ts`): formas y Fonoteca de O1–O3 ya vistas, beats O1–O3 vistos, Hélice y Maneki unidos, Taller Cometa visto; carga en calma directo a la Oleada 4.
- Sin cabeza (Chrome real, Vite propio en 5251): escenas H58, H59, H62; ECOS (lista, despertar, aspecto en el retrato); página y faro de noche; «Mentira»; créditos de principio a fin; epílogo con la página junto al faro.

## Balance de jefes

> BALANCE-JEFES, 2026-10-10. Código: `game/src/state/sys/storyScale.ts` (nuevo), `storyBattles.ts › buildStoryBattle`, `campaign.ts › buildSiege` (nivel, ★ y camarotes enemigos opcionales). Arnés: `game/scripts/balance-jefes.ts`. Pruebas: `game/tests/storyScale.test.ts`. Sin commit.

**Diagnóstico.** El tope de Nv50 del enemigo no era la causa:

- Las batallas de historia pelean a «tu Poder × `powerMul`». La sim escala con la razón entre los dos, así que el resultado es el mismo a Nv30, 50, 80 o 100 (tabla «antes»: idéntica por construcción hasta ★3; a ★4–★6 se mueve ±5 puntos, que es ruido).
- El nivel de un gato solo cuenta en la sim en los umbrales Nv10/Nv20 del disparo. Un enemigo «Nv50» pelea igual que uno «Nv100».
- Subir el poder del jefe sí mueve el resultado, y mucho: el Umbral pasa de 100 % a ×1,35 a 45 % a ×2,36. Lo que faltaba era una banda de dificultad por batalla.

**La regla (`storyScale.ts`).** Cada batalla de la Parte II tiene `band` en su definición (`StoryBattleDef.band`). La Parte I no tiene banda y no pasa por aquí.

| banda | batallas | `base` (Poder enemigo ×, a todo nivel) | más allá de Nv50 | meta (tripulación esperada) |
|---|---|---:|---|---|
| `historia` | H34 H35 H39 H40 H41 H44 H46 H47 H51 H52 H55 H58 | ×1 | el enemigo muestra tu nivel; nada más | 85–95 % |
| `jefe` | H49 Masa Madre · H57 Leviatán · H62 Correctores | ×1,1 | nivel = el tuyo + 2, y sus gatos llevan la ★ que ese nivel pide | 70–85 % |
| `final` | H63 El Umbral | ×1,56 | nivel = el tuyo + 5, con su ★ | 62–68 % (y ninguna tripulación razonable abajo de ~45 %) |

- **Fórmula:** Poder enemigo = máx(5, tu Poder × `powerMul`) × `base` × (1 + `over` · x), con x = (mín(L, 100) − 50) / 50 acotado a [0, 1]. L es el nivel medio de tu tripulación: los mismos gatos (especie, nivel, ★) que lee la firma del estimador.
  - `over` = 0 en las tres bandas: medido, tus ★ no mueven una pelea que va por razón de Poder, así que no hay nada que compensar.
- **Nivel enemigo:** si L ≤ 50, el de siempre (sale del Poder y se topa en 50). Si L > 50, mín(100, L + `lvl`).
- **★ enemiga** (solo en `jefe` y `final`): 1 + techo((nivel − 50) / 10), la misma regla del tope por estrellas del doc 16, **con máximo ★5** (`mirrorMaxStars`; decisión del dueño: la ★6 es solo tuya y un jugador al máximo se tiene que sentir fuerte). Le da +8 % de vida a sus gatos por ★ y la ulti doble de ★5. Es lo único que hace que un jefe «suba contigo» más allá del Poder. Cuesta unos 5–10 puntos entre Nv50 y Nv80; de Nv80 a Nv100 ya no sube.
- **Piso:** la `base` vale a todo nivel. Una tripulación Nv30 que llega a H63 pelea a la misma razón que una Nv50: el jefe sigue a tu flota (nunca es un muro) y nunca es un trámite. `base` ≥ 1 siempre.
- **Todos los gatos que lista una batalla pelean** (`catrooms`).
  - El barco generado de cada batalla con banda tiene al menos un camarote por gato enemigo: `buildStoryBattle` usa `catrooms = def.catrooms ?? enemyCats.length`, y `buildSiege` lo aplica sobre el arquetipo.
  - Antes, 13 batallas de la Parte II listaban 4 gatos en un barco de 3 camarotes (H49 y H51, de 2), y el último gato nunca salía: H34 c_marcapaginas, H35 c_marcapaginas, H39 c_brillito, H40 r_facetas, H41 c_espumita, H44 c_globito, H46 r_contrapeso, H47 r_helice, H49 r_contrapeso + c_plomito, H51 c_satelito + r_plasmin, H52 c_satelito, H55 r_ecomudo, H57 e_meteoro, H62 r_farolillo, H63 r_grafitera.
  - La Parte I no se toca: H11 y las grietas siguen como siempre.
  - Comprobado en la sim (6 peleas por batalla): el gato extra dispara en las 16 batallas (5 a 22 tiros) y usa su ulti en 10 de ellas; en las otras 6 la pelea termina antes de que la cargue.
  - Con el gato extra todo se endureció, y por eso se volvió a ajustar cada batalla. En algunas, el multiplicador quedó por debajo del de antes (H57 ×1,12 contra ×1,2), pero la batalla es más dura que antes porque ahora pelea un gato más.
- **Ajustes por batalla** (la banda es la política; `powerMul` y el casco afinan cada batalla según sus reglas, ya con los 4 gatos). Las pruebas de O2/O3/O4 exigen 1 < `powerMul` < 1,5.
  - H34 Páginas: 1,05 → 1,1.
  - H40 Madre Nácar: 1,3 → 1,4. Una primordial llega con toda su corte; Facetas, su tanque, antes no salía.
  - H52 La Estrella: 1,2 → 1,1.
  - H49 Masa Madre: 1,3 → 1,32; con la banda, ×1,45 de tu Poder (casco ×3).
  - H57 Leviatán: 1,2 → 1,02; ×1,12 con la banda (casco ×3,5, sin cambio).
  - H62 Correctores: 1,2 → 1,31 (×1,44).
  - H63 El Umbral: queda en 1,35 (×2,11 con la banda). Además tiene la regla **PUERTAS CERRADAS** (abajo).
  - H58 Archipiélago: era la única batalla de la Parte II sin poder propio, y los sueños eran neutros (con o sin reglas: 100 %, −1 % de casco; cada sueño pega a los dos barcos). Ahora cae **LA LUNA de Duermevela** cada 3 turnos (`cata: moon`, potencia 3,5, con su sello). Cada sueño cambia cómo llegan tus tiros al sello (TODO FLOTA, VENTOLERA, EL AGUA ES SUELO) o alarga la pelea (CANCIÓN DE CUNA). Las reglas de sueño no cambiaron.
  - El resto conserva su `powerMul`: el 4.º gato ya las dejó en banda.
- **Paridad:** todo se decide al armar el `BattleSpec` (hilo principal); la sim y el estimador reciben los mismos datos. Determinista.

**Cómo se midió.** `npx vite-node scripts/balance-jefes.ts -- --seeds 64 [--crews n30,n50,n60,n65,n80,n100] [--comp historia|legend] [--only id] [--noscale]`.

- **Tripulación «historia»:** 7 gatos reales en el Bastión de `post-finale`:
  - el mítico de H11 (Raijin);
  - Ignis y Abisa (Parte I);
  - Madre Nácar, Masa Madre, Jonás y Brecha (Parte II).
- **Tripulación «legend»:** la del fixture (7 legendarios de la Parte I más un épico). Es la tripulación realista para H49 y H57.
- **Crews:** Nv30 ★3, Nv50 ★3, Nv60 ★3, Nv65 ★3 (el nivel del jefe ante un Nv60), Nv80 ★4, Nv100 ★6.
- Kit de Vuelo 1 y Kit Astral 1 (el peor caso), sin rangos, sin accesorios y sin SINCRO.
- 64 semillas por celda: la mitad con puntería normal y la mitad con difícil.
- `--noscale` = el «antes».

**Antes** (historia; Nv30 = Nv50 = Nv60 por construcción):

| batalla | Nv50 | Nv80 | Nv100 |
|---|---:|---:|---:|
| H34 Páginas | 100 | 100 | 100 |
| H35 Bibliotecario | 97 | 97 | 91 |
| H39 Nácar | 97 | 98 | 100 |
| H40 Madre Nácar | 100 | 100 | 100 |
| H41 Corrector | 95 | 95 | 95 |
| H44 Islas Invertidas | 97 | 98 | 97 |
| H46 La embajada | 94 | 95 | 97 |
| H47 El otro almirante | 84 | 84 | 83 |
| H51 Sincronía | 100 | 100 | 100 |
| H52 La Estrella | 80 | 83 | 81 |
| H55 Disruptores | 86 | 86 | 94 |
| H58 Archipiélago | 100 | 100 | 100 |
| **H49 Masa Madre** | 100 | 100 | 100 |
| **H57 Leviatán** | 97 | 97 | 97 |
| **H62 Correctores** | 97 | 97 | 97 |
| **H63 El Umbral** | **100** | **100** | **100** |

**Después** (todos los gatos a bordo; % de victorias, 64 semillas; «h / l» = tripulación historia / legend):

Batallas `historia` (iguales a cualquier nivel: Nv30 = 50 = 60 = 80 = 100):

| batalla | historia | legend | promedio |
|---|---:|---:|---:|
| H34 Páginas | 80 | 92 | 86 |
| H35 Bibliotecario | 88 | 94 | 91 |
| H39 Nácar | 78 | 98 | 88 |
| H40 Madre Nácar | 83 | 100 | 92 |
| H41 Corrector | 88 | 94 | 91 |
| H44 Islas Invertidas | 86 | 98 | 92 |
| H46 La embajada | 77 | 97 | 87 |
| H47 El otro almirante | 81 | 100 | 91 |
| H51 Sincronía | 100 | 100 | 100 (se deja: enseña SINCRO) |
| H52 La Estrella | 75 | 95 | 85 |
| H55 Disruptores | 88 | 86 | 87 |
| H58 Archipiélago | 88 | 97 | 93 |

Jefes y final (historia por nivel; legend en Nv50 / Nv60):

| batalla | Nv30 | Nv50 | Nv60 | Nv80 | Nv100 | legend 50 / 60 | promedio Nv50–60 |
|---|---:|---:|---:|---:|---:|---:|---:|
| **H49 Masa Madre** | 73 | 73 | 69 | 64 | 64 | 80 / 80 | 76 |
| **H57 Leviatán** | 80 | 80 | 75 | 69 | 64 | 81 / 75 | 78 |
| **H62 Correctores** | 81 | 81 | 78 | 69 | 69 | 84 / 81 | 81 |
| **H63 El Umbral** | 69 | 69 | 67 | 67 | 73 | 86 / 81 | **66** (3 tripulaciones) |

- **Batallas de historia:** pasada de Nv50, una tripulación pelea exactamente la misma batalla; solo cambia el nivel que se muestra. La prueba lo compara spec a spec.
- **H58 con tres islas distintas** (quién duerme cambia el sueño; tripulación historia / legend; medido antes de los camarotes, cuando H58 ya tenía sus 4):
  - la del fixture: 88 / 98;
  - durmientes de Tormenta: 86 / 97;
  - durmientes de Agua: 88 / 92.
  
  Siempre −18 a −23 % de casco (antes −1 %).
- **H63 y PUERTAS CERRADAS.**
  - **El problema:** con toda la escolta a bordo, el final dependía de qué gatos tuvieras: «historia» ganaba 38–48 % y «legend» ~88 %.
  - **Por qué:** casi todas las derrotas eran por **núcleo**. Ronrón (onda de gravedad, `pierce` 8 por defecto) y Grafitera (onda de sonido, `pierce` 4) cruzan todas las paredes hasta tu núcleo, y Brecha borra 2 celdas. «Legend» tumba a esos gatos en 1–2 turnos; «historia» no, y ellas siguen pegándole al núcleo.
  - **Lo que se descartó** (Nv60, 32 semillas, historia / legend / p2):

    | variante | historia | legend | p2 |
    |---|---:|---:|---:|
    | tal cual | 41 | 88 | 44 |
    | sin Grafitera | 94 | 100 | — |
    | Grafitera sin aturdido | 41 | 88 | — |
    | Grafitera sin ulti | 41 | 88 | — |
    | Grafitera con 60 % de vida | 56 | 88 | 53 |
    | Grafitera sin perforar | 78 | 94 | 69 |

    No es su aturdido ni su ulti: es la onda que cruza paredes. Con Grafitera limitada, Ronrón pasa a ser el que más daña el núcleo.
  - **Arreglo en el diseño del jefe** (no en las especies). La Bisagra cierra todas las puertas: en H63 **ninguna onda cruza más de una pared, ni las suyas ni las tuyas**.
    - `StoryBattleDef.wavePierce = 1`; `buildStoryBattle` lo aplica a los tiros y ultis tipo onda de los dos lados, como dato plano del spec.
    - La tarjeta lo avisa: «PUERTAS CERRADAS: aquí ninguna onda atraviesa paredes…».
    - En las demás batallas, Ronrón y Grafitera siguen igual.
    - Con la regla, `final.base` 1,3 → 1,56.
  - **Tercera tripulación «p2»:** solo gatos de la Parte II, elementos y rarezas mezclados (Jonás, Masa Madre, Madre Nácar, Cascada, Brecha, Prismarina, Escafandra).

  | tripulación | Nv30 | Nv50 | Nv60 | Nv65 | Nv80 | Nv100 |
  |---|---:|---:|---:|---:|---:|---:|
  | historia | 69 | 69 | 67 | 67 | 67 | 73 |
  | legend | — | 86 | 81 | — | — | — |
  | p2 | — | 47 | 47 | — | — | — |

  - **Promedio de las tres:** 67 % a Nv50 y 65 % a Nv60. Antes: historia 38–44 y legend 88.
  - Nv65 (el nivel que muestra el jefe ante un Nv60) = Nv60: se le gana a su mismo nivel.
  - Dura ~11–13 turnos y te quita ~28–35 % del casco.
  - **Pendiente:** «legend» a Nv50 queda en 86 % (la meta era ≤ 82) y «p2» en 47 %. Subir la base baja a las dos juntas, así que con números ya no se puede cerrar más la brecha.
    - Lo que queda en «p2» es daño a su propio núcleo durante su turno: tiros propios que regresan, muy probablemente por la MANO de los Titiriteros con gravedad ×0,3.
    - Esa es la siguiente palanca, ya en las reglas de fase (`UMBRAL_RULES.byFase.titiriteros.hand`).
- **Jefes con la tripulación «historia» a Nv80–100:** 64–69 %, algo abajo de 70 por la ★ espejo (hasta ★5).

**Fuera de banda, a propósito** (decisión del dueño, 2026-10-10):

- H51 Sincronía (100 %): es la batalla que enseña SINCRO.
- H52 La Estrella (80 %) y H47 Almirante (84 %): son revelaciones y un poco más de tensión les queda bien.

**Pruebas** (`tests/storyScale.test.ts`, 9):

- cada batalla de la Parte II tiene banda y la Parte I ninguna;
- la Parte I es idéntica bit a bit a Nv30, 50, 80 y 100 (spec y pelea);
- en Nv ≤ 50 el término de nivel es la identidad: con `base` = 1, el spec es idéntico al de antes; con la base, el Poder es exactamente el viejo × `base`; nivel ≤ 50 y ★1;
- las batallas de historia a Nv80 son el mismo spec y la misma pelea, salvo el nivel que se muestra;
- determinismo: el spec es una función pura de la partida, y la misma semilla da la misma pelea, también paso a paso (`autoBattleSteps`, el camino del estimador);
- monotonía de Nv30 a Nv100: razón, nivel, ★, casco, vida y daño enemigos nunca bajan; la curva por banda es plana hasta 50;
- cada batalla de la Parte II tiene un camarote por gato enemigo y todos llegan a la sim;
- H63, PUERTAS CERRADAS: ninguna onda cruza más de una pared en los dos lados, y en otra batalla Grafitera sigue perforando;
- H63 con 16 semillas fijas × tres tripulaciones (historia, legend, p2):
  - suma a Nv60 entre 26 y 36 de 48 (hoy 36: 11, 15, 10);
  - Nv30 y Nv80 entre 24 y 38 (hoy 36 y 32);
  - ninguna tripulación abajo de 6/16 ni arriba de 15/16;
- la ★ espejo nunca pasa de ★5 (incluida en la prueba de monotonía).
