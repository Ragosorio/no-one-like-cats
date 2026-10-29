# UNIVERSOS-K — universos de revelación para 8 Multidimensionales de la tanda 2 («museo, ciencia, clásica, anime, videojuegos y libros»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29). Sin commit (lo integra el coordinador). Falta la revisión del dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitK.ts`: ayudantes propios, todos en polígonos gruesos:
    - `headline()`: la línea grande del remate + su aside, armadas en `open()` (alpha casi 0, se rasterizan bajo el
      golpe del sello) y aterrizadas en `payoff()`; `word1()` (un Text centrado: serif, pincel…);
    - formas: `taper` (una polilínea como tira que se adelgaza: listones, bufanda, dragón, arco de voltereta), `blob`
      (forma irregular: aguadas, follaje, nubes), `hgrad` (degradado horizontal), `glow` (n-gonos concéntricos),
      `glint` (destello de 4 puntas con halo);
    - `loop()`: redibujo ambiental a N fps mientras la revelación vive; con Reducir movimiento dibuja un cuadro y
      devuelve un redibujo para cuando un golpe cambia el estado.
  - Los 8 universos (un archivo por gato), registrados en `index.ts` (bloque «UNIVERSOS-K») y fuera de PENDING en
    `tests/p3MultiverseReveal.test.ts`:
    - `perla.ts` · UNIVERSO DE LA VENTANA: empieza en el oscuro profundo del cuadro, solo brillan las rendijas de los
      postigos; ¡CLIC!, se abren y la luz de la mañana barre la pantalla de izquierda a derecha destapando el cuarto
      de Delft (pared de yeso que se calienta, piso de mármol a cuadros, zócalo de azulejos azules, carta náutica,
      mesa con alfombra turca, jarra blanca); el polvo cae por el haz en cámara lenta (su pasiva), la perla brilla
      (¡TIN!) y la cámara se acerca despacito mientras voltea: «…¿mm?». Remate: la luz crece y dora el polvo, destello
      de perla, polvo dorado; ¿ME HABLABAS? (serif) / …iba a decir algo. Ya se le olvidó. Tranquilo: sin sacudidas.
    - `miauton.ts` · UNIVERSO DEL MANZANO: jardín inglés al atardecer (colinas, setos, casita de piedra, el sol bajando),
      un manzano cuya copa llena la parte de arriba; ¡CRAC!, una manzana cae en cámara lenta por su curva dibujada en
      luz dejando manzanas fantasma (fotografía de tiempo), el cielo se llena de sus cuentas (F = G · m · M / r²,
      ↓ g = 9,8 m/s²); un rayo del sol poniente entra al prisma de su pata y se abre en siete colores (LA LUZ BLANCA
      ES DE COLORES); ¡TONC!, tres estrellitas; «…¡claro!». Remate: todo se cae (manzanas, tazas, libros, una pluma) y
      la ley brilla en el cielo; ¡TODO SE CAE! / …sobre todo lo que está en la mesa.
    - `miauzart.ts` · UNIVERSO DEL SALÓN DE CONCIERTOS: salón rococó (paredes claras, rocalla dorada, espejos y
      ventanales al anochecer, dos candelabros de cristal, parquet de rombos); un clavecín con la tapa abierta (paisaje
      pintado por dentro, naturales negras, sostenidos blancos) se toca solo: un minueto, una tecla baja con cada nota,
      las notas vuelan por el salón (¡TIN-TIN-TÁN!), las velas se encienden una por una a compás y el salón se calienta;
      su batuta chispea en cada tiempo; el público de pelucas blancas (con orejitas de gato) se pone de pie: ¡OOOH!
      Remate: todas las velas llamean, llueven pétalos y rosas, las pelucas cabecean; ¡BRAVO, MICHI! / …lo compuso
      durante la siesta.
    - `miausagi.ts` · UNIVERSO LUNAR: noche morada sobre una ciudad de ventanas encendidas y letreros rosas, luna llena
      gigante; una columna de luz de luna baja sobre ella, listones rosas suben en espiral (por delante y por detrás),
      estrellas y brillitos, estelas doradas de sus coletas (¡CHIIING!), el cascabel de su varita (¡TILÍN!) y… le
      ruge la panza: «…grrr». Remate (el giro grande que pedía el brief): la luna se ladea y era UN PLATO LLENO de
      croquetas; sus cuatro amigas llegan como cuatro estrellas fugaces de colores; llueven croquetas; ¡EN NOMBRE DEL
      PLATO LLENO! / …llegó tarde, pero llegó. Sin gatos consejeros con media luna, sin frase de transformación, sin
      nombres de equipo.
    - `tanjimiau.ts` · UNIVERSO DE LA RESPIRACIÓN: bosque de noche como grabado en madera (cielo índigo con su franja
      oscura, luna con bandas de bruma rosa, cedros, glicinas colgando, río de escamas de ola, sello rojo); respira
      hondo (fuuu…, una bruma en su boca) y un DRAGÓN DE AGUA en olas planas sube del río y le da la vuelta a toda la
      pantalla (escamas, garras de espuma, cabeza con cuernos; ¡SHAAAA!); la caja de su espalda se abre tantito (¡TOC!)
      y asoma una patita. Remate: el dragón acelera, una ola plana con garras surge por abajo, espuma por todos lados y
      la patita saluda; ¡RESPIRA! / …perdón por el corte. Sin nombres de técnicas.
    - `tetrimiau.ts` · UNIVERSO DE LAS PIEZAS: todo empieza en los cuatro verdes de la pantallita de una consola
      portátil: pozo de ladrillos, montón con un hueco hondo a la derecha, HUD (NIVEL · FILAS · SIGUE); una L baja casilla
      por casilla, gira (clac) y encaja; la pieza larga aparece arriba, se endereza y cae de golpe en el hueco: cuatro
      filas completas parpadean, ¡CUATRO! Remate: las cuatro filas desaparecen con un destello, todo baja cuatro pisos,
      la pantalla estalla a color, vuelan bloques, FILAS +4, NIVEL 10, y ya está cayendo la siguiente pieza (nunca se
      acaban); ¡LÍNEA! / …y ya cae la siguiente.
    - `laracroqueta.ts` · UNIVERSO DE LA TUMBA: templo de polígonos planos de consola 3D vieja (bloques facetados de
      arenisca con musgo, una puerta abierta a una selva de triángulos con haces de luz, lianas, dos antorchas, pedestal);
      pisa una placa (¡CLIC!), salen picos del piso (¡CLANC!) y ella ya va en el aire dando una voltereta completa con un
      arco de movimiento; aterriza con polvo y los picos se esconden; un haz de luz cae sobre el pedestal: una LATA DE
      ATÚN DORADA (¡TIN!) — RELIQUIA: ATÚN DORADO. Remate: la lata se abre, rayos dorados y chispas de pescado, sus dos
      puntitos láser recorren las paredes; ¡SAQUEADO! / …había atún. Siempre hay atún. Es el único que toma prestado al
      gato (posición y giro): lo devuelve al aterrizar y en el remate.
    - `michincipe.ts` · UNIVERSO DEL ASTEROIDE: dibujos nuestros (aguadas suaves de azul y estrellitas doradas, nunca las
      acuarelas del libro); alrededor de su asteroide flotan los mundos chiquitos (el del farol que alguien prende, el
      aplastado por un baobab enorme, el de los tres volcanes de juguete, dos humeando) y un zorro lo mira desde una
      estrella; la bufanda dorada se despliega con el viento y ondea como tela de lado a lado (¡FIUUU!); el sol se pone
      detrás de su asteroide una y otra vez, cada vez más rápido, el cielo se sonroja — ATARDECERES: 44; brilla la rosa
      bajo su campana. Remate: llega una hoja de papel y un lápiz dibuja, raya por raya, una caja con tres agujeritos;
      desde adentro, «béee»; ¡DIBÚJAME UNA CAJA! / …con tres agujeritos, por favor.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula, vivo en el detalle con `liveLoop`.
- **Verificación (2026-10-29)**: `tsc` limpio; `p3MultiverseReveal`, `multidimPowers`, `postp3Multidim`,
  `multidimCards`, `multidimPostT2`, `uiFixPantalla` verdes (323 pruebas); `vitest run` completo verde (89 archivos,
  1562 pruebas, 1 archivo omitido como siempre). Headless sin HMR (una sola sesión de Chrome por pasada, todo con `briefs/pesado.sh`):
  - normal / DUP / REDUCE de los 8 → 0 errores de consola, cierran, **0 tweens sobrantes** (cerrando con `autoClose`,
    sin clics a ciegas);
  - fps con vsync (CAP=1): 60 en los 8, peor cuadro 17 ms (uno de 33 ms en Perla justo en el golpe del sello, donde la
    revelación hace su propio hitstop de 100 ms); videos CDP a 60 fps reales;
  - saltar a mitad de la toma (incluida la voltereta de Lara Croqueta) devuelve al gato entero en los 8 (dx = dy = 0,
    giro 0, alpha 1, sin máscara) y no deja tweens;
  - pantalla completa: capturas a 21:9 (2100×900) y 3:2 (1620×1080) de los 8, durante la toma y el remate: llenan toda
    la pantalla, lo importante dentro del área segura;
  - vértices: el Graphics más grande durante las revelaciones 6 835 (el río de Tanjimiau, luego aligerado); en las
    cartas a 3184×950 el mayor es 8 020 (la textura de matriz de puntos de Tetrimiau), todos muy por debajo de 25k.
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-k/` — `<gato>.mp4` ×8, `sheet-<gato>.jpg` ×8 (15
  cuadros del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `sheet-21x9.jpg`, `sheet-3x2.jpg`, `cards.jpg` (134×124,
  356×345 y la página 3184×950 reducida), `card-verts.json`.
- **Notas**:
  - `onCat()` medido sobre las pinturas integradas (lite, cuadrícula al 10 %): perla (0.524, 0.456), manzana de Miauton
    (0.54, 0.136) y prisma (0.235, 0.505), batuta de Miauzart (0.09, 0.124), media luna de la varita de Miausagi
    (0.28, 0.10), tapa de la caja de Tanjimiau (0.32, 0.255) y boca (0.62, 0.38), pies de Lara (fy 0.95), punta de la
    bufanda del Michíncipe (0.89, 0.54), rosa (0.53, 0.66) y asteroide (0.42, 0.84). Perla, Miauton y Miauzart
    recibieron su SVG «balanceado» a las 09:46 (misma composición): las capturas posteriores muestran los puntos en su
    lugar. Si cambia el arte otra vez, medir de nuevo.
  - El servidor de captura necesita su propio `cacheDir`: el `node_modules/.vite` compartido lo re-optimizan los
    servidores de los demás agentes y las páginas ya abiertas fallan con «Failed to fetch dynamically imported module».
- **Cómo retomar**: `npx vite --config <scratchpad>/uk/vite.uk.config.mjs` en segundo plano (5227, sin HMR, `cacheDir`
  propio); arnés en `<scratchpad>/uk/`: `verify.mjs` (todas las pruebas en una sola sesión; variables MODES, SIZES,
  NOSKIP, DUP_SHOTS, REDUCE_SHOTS), `revealvideo.mjs`, `cards.mjs`, `revealshot.mjs`, `vsheet.sh`, `tile.sh`.
- **Última actualización**: 2026-10-29
