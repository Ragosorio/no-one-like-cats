# UNIVERSOS-H — universos de revelación para 8 Multidimensionales post-Parte III («libros, cine y pop»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29 00:50). Sin commit (lo integra el coordinador). Falta la revisión del dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitH.ts`: ayudantes propios, todos en polígonos gruesos: `heartPts`, `star5`,
    `catenary`, `strip` (una polilínea como un solo polígono, sin teselar trazos), `stringLights` (foquitos en su cable),
    `cone` (haz de luz con su charco), `curtain` y `valance` (telón de terciopelo con pliegues y cenefa con fleco),
    `rain`, `wig` (la peluca rubia), `sparkles`, `held` (un título construido al abrir con alpha≈0 y mostrado después;
    se descarta si el remate ya llegó), `animate`.
  - Los 8 universos (un archivo por gato), registrados en `index.ts` (bloque «UNIVERSOS-H», entre `// UNIVERSOS-H` y
    `// fin UNIVERSOS-H`, en los imports y en el registro) y fuera de PENDING de `tests/p3MultiverseReveal.test.ts`:
    - `hannah.ts` · UNIVERSO DOBLE VIDA: la pantalla partida por una costura en zigzag que pasa por ella: recámara lila
      de día (cama de retazos, mochila, póster con estrella, cómoda con la cabeza de unicel y la peluca) y estadio de
      noche (truss, pantalla LED de estrellas, mar de orejas con barras de luz); «DE DÍA…» «…DE NOCHE.», la peluca vuela
      de su base y cae sobre ella (¡FLIP!), el escenario se traga la pantalla, reflectores, ¡AAAAH!, CLAP; su mejor amigo
      se asoma por la recámara: «¿…HANNAH?» — «¿QUIÉN?». Remate: pirotecnia, estrellas, todos los reflectores en ella;
      ¡SORPRESA! / …nadie la reconoció. (`onCat` medido sobre el repintado del plan B.)
    - `persafalsa.ts` · UNIVERSO DE LA ALTA SOCIEDAD: club de playa «LAS PERSAS · CLUB DE PLAYA» (cabañas de rayas rosas,
      seto, mar con yates, banderitas), alfombra rosa entre cordones de terciopelo, paparazzi gatos (algunos con sombrero
      de prensa); flashes suaves ¡CLIC!, destello en los lentes, ¡BOING! de la peluca, se le caen un mechón del disfraz
      blanco y la oreja postiza (¡UPS!), «¿ESA ES… PERSA?» — «¡OBVIO!». Remate: tormenta de flashes, perlas y corazones;
      ¡TOTALMENTE PERSA! / …ignoren la oreja.
    - `hermiaune.ts` · UNIVERSO DE LA BIBLIOTECA MÁGICA: estantes infinitos en perspectiva hacia un ventanal ojival con
      luna, reloj en el muro del fondo, velas flotando; ¡SHHH!, los libros saltan de los estantes y orbitan a su
      alrededor aleteando (la mitad cercana de la órbita pasa por delante de ella), sellos ¡LEÍDO!, el reloj de arena da
      la vuelta y la arena sube, las manecillas corren hacia atrás (¡CAT… CIT!), las velas se apagan de izquierda a
      derecha y se vuelven a encender de derecha a izquierda; la varita: «¡YO SÉ! ¡YO SÉ!». Remate: anillo de libros
      abiertos, hojas sueltas; ¡LO LEÍ EN UN LIBRO! / …en todos, de hecho.
    - `lunalovegata.ts` · UNIVERSO AL REVÉS: bosque de noche junto al lago; el mundo da la vuelta (¡VUELTA!; con REDUCE
      llega ya de cabeza, sin girar); los lentes de espiral cruzan como lupa y dentro se ven en color las criaturas
      inventadas (polillas lunares, medusa del aire, zumbiditos), fuera solo sus contornos; «¡AHÍ ESTÁN!», los aretes de
      rábano se van flotando solos, pasa la revista «LA GACETA AL REVÉS» con el título de cabeza. Remate: todas las
      criaturas visibles; ¡ESTÁ AL REVÉS! / …o tú estás al revés.
    - `miaunce.ts` · UNIVERSO DEL OTRO LADO: sala de 1983 (papel tapiz de flores, lambrín, ventana al pueblo) con
      foquitos de Navidad sobre el abecedario pintado (en dos paneles, para que el gato no tape letras): M · I · A · U uno
      por uno, parpadeo frenético ¡CORRE!, la pantalla se voltea al reflejo oscuro (azul gris, enredaderas, focos rojos,
      rayo rojo, esporas); pasan tres bicis con faro; levanta la pata: anillo rosa, ¡ZUUUM! y todo se queda quieto (las
      bicis flotando). Sin sangrado de nariz. Remate: lo suelta, el anillo barre las esporas, llueven waffles; ¡ALTO! /
      …¿me pasas un waffle?
    - `michiercoles.ts` · UNIVERSO GÓTICO: escuela gótica bajo la lluvia (vitrales ojivales, rosetón detrás de ella,
      agujas, gárgola), azotea con balaustrada y cuervos; trueno, ¡CRAA!, el violonchelo toca solo (VRRRMMM…, notas); un
      telón negro se cierra y se abre de golpe (¡FUAP!): penumbra, reflector frío y cuatro bailarines de sombra a
      contraluz que copian su baile brusco paso a paso (ella también se mueve a golpes con `borrowPose`; se le devuelve
      la pose al final de la toma y en el remate); «…no estoy sonriendo.». Sin mano mascota. Remate: rayo, vitrales
      encendidos, cuervos; «…qué asco, alegría.» / (no está sonriendo), en serif cursiva.
    - `sabrina.ts` · UNIVERSO DULCE: escenario retro, el telón de terciopelo rosa se abre (¡TA-RÁÁ!), un solo reflector
      (¡TUNG!), un corazón de focos de marquesina que corre detrás de ella, un micrófono antiguo plateado baja de la
      tramoya y se mece (ZIIIP), corazones pastel como confeti, destellos de lentejuela (el primero en su propio
      micrófono); «¿Nos llevamos bien?» — «…¿no? ok.». Remate: un corazón de azúcar gigante se infla detrás de ella y
      revienta en confeti; ¡QUÉ DULCE! / …dulce, sí; tonta, jamás.
    - `postmaulone.ts` · UNIVERSO RELAX: atardecer tibio en una terraza sobre un campo de girasoles, el sol enorme detrás
      de él, foquitos en su cable, fogata (CRIC… CRAC), silla plegable y hielera; «Ahhh…», tres rasgueos con anillos
      (TRRANG~) y garabatos de gis que se le escapan flotando (estrellas, solecitos, corazones, notas, girasoles; nada en
      la cara); «¡SE HUNDE EL BARCO!» — «relax…». Remate: rasgueo de hielo (anillo de escarcha, copos); ¡TRANQUI! /
      …ahorita flota.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula (las cartas chicas de Miaunce y Post Maulone dibujan menos
    flores), vivo en el detalle con `liveLoop`.
  - Con «Reducir movimiento» cada universo llega quieto pero sus cambios de estado siguen entrando como cortes (se
    redibuja a 4 fps con el reloj en 0: la costura de Hannah, el volteo de Miaunce, las velas de Hermiaune…).
- **Verificación (2026-10-29)**: `tsc` limpio; `p3MultiverseReveal`, `multidimPowers` y `postp3Multidim` verdes (188).
  `vitest run` completo: 83 de 85 archivos verdes, 1 saltado; el único rojo fue `multidimPowers` › «the ultimate the game
  shows…» por `xp_doomiau` (no es mío; un poder de otro agente a medio hacer), y en la corrida dirigida posterior ya pasó.
  Headless sin HMR, los 8: normal / REDUCE / DUP → 0 errores de consola y cierran; 0 tweens sobrantes al cerrar en los
  tres modos; 60 fps con vsync (rAF en ventanas de 0.5 s, peor cuadro 17 ms; un solo cuadro de 33 ms en la primera
  Sabrina de una sesión) y videos CDP a 60 fps reales con hueco máximo de 17 ms en los 8; `open()` 2–9 ms; saltar a
  mitad de la toma devuelve al gato entero (Michiércoles, que lo mueve, probado a 1.9 / 2.6 / 2.9 / 3.2 s); vértices:
  el Graphics más grande de las revelaciones 4 660 (Miaunce), el de las cartas a 3184×950 8 138 (Miaunce), en la
  cuadrícula ≤ 2 925.
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-h/` — `<gato>.mp4` ×8, `sheet-<gato>.jpg` ×8,
  `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `cards.jpg` (134×124, 356×345 y la página 3184×950 reducida), `card-verts.json`.
- **Notas**:
  - `onCat(c, fx, fy)` (de kitD) usa coordenadas medidas sobre los SVG integrados: lentes y orejas de Persa Falsa,
    varita de Hermiaune, aretes de Luna, pata de Miaunce, guitarra de Post Maulone, coronilla de Hannah, micrófono de
    Sabrina. Si cambia el arte, hay que medir de nuevo (`<scratchpad>/uh/artgrid.mjs` los pinta sobre una rejilla).
  - Hannah: la pantalla LED y el público son Graphics estáticos que solo cambian alpha / y; lo único que se redibuja
    por cuadro son las barras de luz, los reflectores y (solo si se mueve) la máscara de la costura.
- **Cómo retomar**: servidor `universos-h` (puerto 5219, sin HMR) en `.claude/launch.json` → `<scratchpad>/uh/vite.uh.config.mjs`;
  arnés en `<scratchpad>/uh/` (los de D, más `prep.mjs`, que inyecta en SIGNATURES un universo aún no registrado y lo
  pinta con un gato sustituto si el suyo no tiene arte; `SKIPMS=` en `skip.mjs`; `artgrid.mjs`).
- **Última actualización**: 2026-10-29 00:50
