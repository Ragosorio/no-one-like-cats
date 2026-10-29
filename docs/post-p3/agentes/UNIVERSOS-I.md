# UNIVERSOS-I — universos de revelación para 9 Multidimensionales post-Parte III («escenario y estadio»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29 00:45). Sin commit (lo integra el coordinador). Falta la revisión
  del dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitI.ts`: ayudantes propios, todos en polígonos gruesos:
    - palabras prearmadas: `pre()` (se arma en `open()` con alpha casi 0 y se muestra en su golpe), `wrap()` (el remate
      tira las que un salto nunca alcanzó), `at()` (un golpe que se cae si el remate ya llegó), `comic()`, `flat()`,
      `neonWord()`;
    - remate: `payline()` (línea grande + aside) y `park()`/`take()` (el titular pesado se arma antes, en la cola tranquila);
    - utilería: rosa, pétalo, nota, corazón, balón, copa genérica (con huellita, sin forma de trofeo real), torre de luz,
      cono de luz, cabeza de gato, multitud de espaldas, gradas vistas desde la cancha, cancha, defensor gigante en sombra,
      franjas y bandera que ondea, líneas de velocidad, rayo.
  - Los 9 universos (un archivo por gato), registrados en `index.ts` (bloque «UNIVERSOS-I») y fuera de PENDING en
    `tests/p3MultiverseReveal.test.ts`:
    - `miaussi.ts` · UNIVERSO DE LA GAMBETA: noche de final, gradas celestes y blancas con banderitas, torres de luz; la placa
      «MUY BAJITO PARA JUGAR» y cuatro defensores gigantes en sombra que se levantan a su alrededor; la estela celeste sale
      de su balón y hace slalom entre sus pies, cada gigante gira y cae de cola (¡OLÉ! ×4), el balón entra a la portería del
      horizonte; ¡GAMBETA! Remate: la copa genérica sube en un haz de luz a su lado, tres estrellas, fuegos en los colores,
      flashes en toda la tribuna; ¡CAMPEÓN! / …habla poco y mete muchos.
    - `gatistiano.ts` · UNIVERSO DEL SALTO: estadio rojo y verde; ¡ARRIBA! y la cámara sube con él sin parar: gradas, nubes,
      parvada, avión, estrellas, satélite, la luna y el planeta abajo; el medidor ALTURA no alcanza (2… 25… 250… 2500…
      25000 METROS); arriba llega el centro y lo cabecea de vuelta a la Tierra en una línea de fuego; ¡CABEZAZO! · RÉCORD DE
      ALTURA. Remate: aterriza de golpe en su estadio (anillo de polvo, todo tiembla), fuegos rojo y verde, un 7 gigante en
      luces en las gradas; ¡UNO MÁS! / …abdominales a las cinco, goles a las siete. (Nunca su grito de festejo.)
    - `miaupe.ts` · UNIVERSO DEL CONTRAATAQUE: noche de tormenta; ya va corriendo: la tribuna se embarra en rayas azul,
      blanco y rojo, la cancha pasa volando, rayos alrededor, la caja VELOCIDAD de la transmisión cuenta 38… 61… 99… ¡MACH 1!;
      tres defensores lo encaran y se quedan girando (¡FIUUUM!, ¡ZAS!); frenón en seco con polvo y el globo «¿Y?». Remate:
      tres rayos azul, blanco y rojo, y una fila de gatos se asoma abajo con los brazos cruzados, como él; ¡CONTRAATAQUE! / …¿y?
    - `lamiau.ts` · UNIVERSO DEL RECREO: pizarrón con «TAREA: CALCULA LA ROSCA», «ZURDA + EXTERIOR = ROSCA», una barrera de
      tres X y una portería en gis; la curva punteada se dibuja sola desde su zurda; ¡RIIING! ¡RECREO! y el pizarrón se
      enrolla: detrás, la cancha del barrio al atardecer (edificios, ropa tendida roja y amarilla, malla ciclónica, el estadio
      a lo lejos); el balón real sigue el camino del gis por encima de la barrera y entra al ángulo; ¡ROSCA! Remate: cae su
      mochila de la escuela y revienta, la tarea vuela como confeti y regresa una hoja con un 10 en rojo; ¡GOLAZO! / …y
      mañana hay examen.
    - `romiau.ts` · UNIVERSO DE LA BACHATA: noche tropical en la bahía, luna enorme y su camino de luz, palmeras, un balcón
      colonial blanco con buganvilias, el malecón con farol y una canasta; seis cuerdas doradas del requinto cruzan el cielo y
      vibran en cada rasgueo (¡TIRIRÍN!); se abre la puerta del balcón y una gata suspira corazones; los pescados saltan solos
      del mar a la canasta, cada uno con su corazón (¡SPLASH!) · NOCHE DE BACHATA. Remate: las cuerdas arden, llueven rosas y
      pétalos, suben corazones; ¡QUÉ ROMÁNTICO! / …hasta los pescados se enamoraron.
    - `miauki.ts` · UNIVERSO DE LA BALADA: se abre el telón de terciopelo: papel picado, mariachis gatos de sombrero ancho en
      las tarimas, un gran reloj dorado detrás de él que empieza a correr hacia atrás (su elemento es el tiempo); ¡AYYY! y el
      ventilador de balada se prende (¡FUUUSH!): vuelan pétalos y papel picado, la gente llora con pañuelos blancos
      (¡SNIF!), vuelan rosas desde las primeras filas y se juntan a sus pies, lo encuentra el seguidor. Remate: llueven rosas;
      ¡OTRA, OTRA! / …y la melena, intacta.
    - `miautentacion.ts` · UNIVERSO DE LAS DOS MITADES (homenaje respetuoso): la proa del barco de noche y el mundo partido
      como su pelo: a la izquierda tormenta (lluvia, nubes, destello verde agua, mar picado), a la derecha noche dorada
      (velas en la baranda, luciérnagas, mar en calma, farolitos); ¡BRRROOOM! del lado de la tormenta; canta bajito: las notas
      van a las dos mitades, un gran «shhh…», los gatos más tristes llegan desde las orillas y se sientan con su vela, la
      tormenta empieza a calmarse. Remate: una sola noche tranquila, estrellas en los dos lados, farolitos de papel subiendo
      por todo el cielo; ENTERO. / …cuando canta. Sin violencia ni imágenes de muerte; sin destellos blancos.
    - `partymichi.ts` · UNIVERSO DE LA FIESTA ETERNA: las tiras rosas de unos lentes de persiana tapan la pantalla y se abren
      en el primer bombo: telón de cebra que se menea al ritmo (130 bpm), arco de neón verde y rosa, láseres, piso negro y
      una fila de gatos con afro bailando shuffle en cada golpe (¡PUM-PUM!); cañones de confeti (¡PAAAM!) y una caja de
      cartón que tiembla: «¿YA VIENE?»… «…TODAVÍA NO». Remate: todo al doble, los láseres en abanico y de la caja se asoma
      otro afro gigante con lentes; ¡A BAILAR! / …y su compañero, ¡ya viene!
    - `miauknd.ts` · UNIVERSO DE LA NOCHE SIN FIN: ciudad de neón a las 3 a. m., carretera recta al horizonte entre dos
      cuadrículas magenta, postes, faros que vienen y calaveras que se van; un deportivo rojo pasa rugiendo (¡VRRRUUUM!), los
      letreros se prenden uno por uno con su BZZT (pez, cabeza de gato, corazón, ABIERTO, el reloj 3:00 A.M.) y un aro de
      neón rojo se enciende detrás de él por segmentos. Remate: todos los letreros a tope, la cuadrícula late y un filo de
      amanecer intenta salir y se vuelve a hundir; ¡QUE NO AMANEZCA! / …y el día ni lo extraña.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula, vivo en el detalle con `liveLoop`.
- **Verificación (2026-10-29)**: `tsc` limpio; `p3MultiverseReveal` y `postp3Multidim` verdes; `vitest run` completo: 1381
  pasan, **1 falla ajena**: `multidimPowers` → «the ultimate the game shows… is the power» con `xp_doomiau` (el nombre de su
  ultimate pega con la regex `STARFALL|METEOR|DECREE`; no es mío). Headless sin HMR, los 9 con su arte real ya en el juego:
  normal / REDUCE / DUP → 0 errores de consola y cierran; 0 tweens sobrantes al cerrar (normal y DUP); 60 fps con vsync
  (`revealfps CAP=1`, con la máquina a carga 40–200; algún cuadro suelto de 33–50 ms justo en el sello); videos CDP a 60 fps;
  `hitch` sin cuadros largos salvo uno de 33 ms en el remate de Romiau; saltar a mitad de la toma (1.5 s) devuelve al gato
  entero en los 9 y no deja restos de la toma (pizarrón, gigantes, balón, caja de velocidad) sobre el remate; vértices: el
  Graphics más grande de las cartas a 3184×950 tiene 3 488 (The Miauknd), el de las revelaciones 1 846 (Gatistiano).
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-i/` — `<gato>.mp4` ×9, `sheet-<gato>.jpg` ×9 (15
  cuadros del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `cards.jpg` (134×124, 356×345 y la página 3184×950 reducida),
  `card-verts.json`.
- **Notas**:
  - Nadie toma prestado al gato (ninguno mueve, enmascara ni cambia su alpha).
  - `onCat()` medido sobre las pinturas integradas: balón de Miaussi (0.72, 0.86), zurda/balón de Lamiau (0.85, 0.85),
    frente de Gatistiano (0.45, 0.10), cabeza de Miaupé (0.62, 0.16) para el globo. Si cambia el arte, medir de nuevo.
  - En DUP la copa de Miaussi y la hoja con el 10 de Lamiau se corren para no pisar la barra de estrellas del duplicado.
  - Los titulares de remate con brillo grande (Miauknd, Miautentación) se arman a los 1.9 s con `park()`; los demás usan
    `cheer()` del kit como C/D.
  - Audio: solo `sfx` sintetizados, como C/D; ninguna pista ni canción del dueño.
- **Cómo retomar**: servidor `universos-i` (puerto 5220, sin HMR) en `.claude/launch.json` → `<scratchpad>/ui/vite.ui.config.mjs`;
  arnés en `<scratchpad>/ui/` (`revealshot`, `revealvideo`, `revealfps` con `CAP=1`, `skip` con `AT=<ms>` y captura en
  `skipshots/`, `tweens`, `hitch`, `rverts`, `cards`, `artgrid` = SVG lite con rejilla 0.1 para medir `onCat`, `vsheet.sh`,
  `tile.sh`). `common.mjs` trae `installSub`: un gato sin arte se prueba sobre un sustituto, y uno con arte pero sin
  registrar se inyecta con su propio id.
- **Última actualización**: 2026-10-29 00:45
