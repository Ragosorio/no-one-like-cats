# UNIVERSOS-E — universos de revelación para 9 Multidimensionales post-Parte III («anime y píxel»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29 00:40). Sin commit (lo integra el coordinador). Falta la revisión del dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitE.ts`: ayudantes propios, todos en polígonos gruesos: `prep`/`prepWord`/`show`
    (textos y onomatopeyas construidos al abrir, alpha ≈ 0, mostrados después), `prepHead`/`showHead` (el remate grande +
    la línea chica, también preparados al abrir), `glyphGo` (la ゴ manga dibujada en polígonos, sin depender de que cargue
    la fuente japonesa), `rays`, `diamonds` (trama), `rrect`, `spiralPts`, `band` (línea gruesa como un polígono),
    `cumulus`, `gull` y `copyOf` (copia fija de la pintura del gato, opcionalmente en silueta).
  - Los 9 universos (un archivo por gato), registrados en `index.ts` (bloque «UNIVERSOS-E» … «fin UNIVERSOS-E») y fuera de
    PENDING en `tests/p3MultiverseReveal.test.ts`:
    - `gatojo.ts` · UNIVERSO BIZARRO: página de color en bloques planos imposibles girando como rehilete detrás de un reloj
      gigante, trama, líneas de foco; columnas de ゴゴゴ que suben por los dos lados; un espíritu felino musculoso se levanta
      tras su hombro, señalando como él; le vuelan sardinas… ¡TOC!, una cúpula de color invertido (duotono negativo violeta
      y menta) sale de él y el tiempo se detiene: las sardinas quedan en el aire; «¡QUIETOS!», «PODER · SIESTA DE PLATINO».
      Remate: la cúpula se recoge, ráfaga de puños del espíritu ¡MIAUMIAUMIAUMIAU! y las sardinas salen volando;
      ¡EL TIEMPO SE DETIENE… / …para la siesta.; la página se congela en sepia bajo una flecha CONTINUARÁ.
    - `michimpostor.ts` · UNIVERSO DE LA NAVE: la nave vista desde arriba (salón octagonal de paneles, pasillos al espacio,
      una rejilla de ventilación, la mesa del gran botón rojo) bajo alarma roja con balizas; «¡REUNIÓN DE EMERGENCIA!»,
      ¡PIC!, la tripulación (frijolitos con traje… y orejas de gato) llega corriendo y lo rodea, «?» en cada visor, la rejilla
      se abre ¡CLONC!, la tableta VOTACIÓN y todos los votos caen en su fila; los «?» se vuelven «!»: ¡SOSPECHOSO!
      Remate: la nave se va, espacio abierto con estrellas que corren y un planeta con anillo, el verde pasa dando vueltas;
      ¡ERA EL MICHIMPOSTOR! / …pero sacaron al verde.
    - `gomitas.ts` · UNIVERSO PIRATA: mar abierto al mediodía, cúmulos, olas que ruedan, gaviotas; una carabela con mascarón
      de cabeza de gato entra partiendo la pantalla y se detiene detrás de él; su vela (esqueleto de pescado sobre huesos
      cruzados) se infla ¡FLAP!; su otro brazo se estira como chicle hasta la cofa ¡ESTIIIRA! y regresa ¡BOING!; cartel
      SE BUSCA · VIVO O DORMIDO · 3.000.000.000 CROQUETAS; una ola revienta en la proa: «¡NO SÉ NADAR!».
      Remate: la vela se llena, rocío, gaviotas y serpentinas; ¡ZARPAMOS! / …sin saber nadar.
    - `kagebunyan.ts` · UNIVERSO SHINOBI: aldea escondida al atardecer, el risco con cuatro caras de gato talladas, techos y
      tinacos, la cumbrera de tejas al frente; remolino de hojas, anillo de luz en el sello de sus patas; ¡POF! ¡POF! ¡POF!
      y la silueta se vuelve tres… luego doce copias de su pintura corriendo en fila por las tejas (un solo filtro de
      silueta para todas); shuriken; ¡MIL MICHIS! Remate: todas las copias se llenan de color a la vez y cada una desaparece
      en su humo; ¡DE VERITAS, MIAU! / …lo juran los mil.
    - `miaang.ts` · UNIVERSO DE LOS CUATRO: cielo pálido con brazos de espiral que giran, nubes auspiciosas enroscadas,
      picos con torres de templo sobre un mar de nubes; ¡FIUUU! y llegan una gota, una roca, una llama y un remolino que lo
      orbitan (mitad detrás, mitad delante); el bisonte volador de seis patas cruza como nube ¡MUUU!; la flecha azul de su
      cabeza se enciende: ¡CUATRO EN UNO! Remate: los cuatro entran en él y un torbellino sale en anillos; ¡AIRE! /
      …ya merito los cuatro.
    - `ryumiau.ts` · UNIVERSO LIBRETA (juguetón, sin texto de muerte): todo en blanco y negro, trama, una luna blanca
      enorme detrás de su silueta, techos góticos, aguja y torre del reloj; una libreta negra abierta pasa sola sus páginas
      (FRRRT) y una mano escribe «Lunes: manzana. / Martes: manzana. / Miércoles: manzana.»; «DÍA 3 SIN MANZANAS…»;
      plumas negras; una manzana roja (lo único con color) baja en cámara lenta hacia su pata; «¡KU KU KU!».
      Remate: la manzana cae en su pata ¡ÑAM!, la página firma «Jueves: ¡MANZANA!» con palomita roja; Anotado. (gótica) /
      …y con letra bonita.
    - `yugi.ts` · UNIVERSO DUELO: arena holográfica de noche (piso de cuadrícula al horizonte, círculo de invocación), una
      pirámide dorada invertida gira con un ojo de gato; ¡ROBO! con estela dorada; seis cartas gigantes caen boca abajo y
      se voltean una por una (MAGO MICHI, DRAGÓN MICHI, KURIMIAU, OLLA DE ATÚN, SIESTA ETERNA, GATO GUERRERO); cinco
      cartas doradas (cabeza, brazos, piernas) brillan en las orillas y se juntan: un gigante gato encadenado se levanta
      detrás, tenue. Remate: el gigante se enciende, rayos dorados, las cadenas truenan ¡CRAC! y las cartas salen girando;
      ¡SE ARMÓ! / …y ni barajé.
    - `ssssmichi.ts` · UNIVERSO DE CUBOS: cielo plano con sol y nubes cuadradas, lomas y robles de bloques; el suelo de
      pasto y tierra se arma columna por columna (¡TOC! ¡TOC!), barra de objetos y corazones; un siseo que crece en letras
      de píxel s s S S S y la silueta se infla y parpadea en blanco cada vez más rápido (suave y tenue con «Reducir
      destellos»). Remate: ¡PUM!: vuelan cubos, humo cuadrado, queda un cráter escalonado bajo él con bloquecitos soltados
      que flotan; ¡PUM! / …era un abrazo. (sin destello blanco con «Reducir destellos»)
    - `zoomic.ts` · UNIVERSO SUPERSÓNICO: zona verde en 16 bits (cielo en franjas, mar que destella, acantilados a cuadros,
      palmeras de píxel, un rizo de pista gigante detrás de él), filas de anillos dorados, PUNTOS · TIEMPO · ANILLOS;
      ¡ZOOM!: la silueta desaparece y una mancha azul cruza tres veces (una dándole toda la vuelta al rizo) juntando
      anillos y frena derrapando donde estaba. Remate: le salen anillos que rebotan; ¡YA LLEGUÉ! / …tu internet sigue
      cargando. (con una ruedita de «cargando» girando al lado). Único que toma prestado al gato (alpha); lo devuelve al
      final de la toma, en el remate y al saltar.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula, vivo en el detalle con `liveLoop`.
- **Verificación (2026-10-29)**: `tsc` limpio; vitest dirigido verde para lo mío (`p3MultiverseReveal`, `postp3Multidim`);
  `vitest run` completo: 1381 pasan, **1 falla ajena**: `multidimPowers` → «xp_doomiau: expected true to be false» (el
  nombre de su ultimate cae en la regex STARFALL|METEOR|DECREE: trabajo de poderes de otro agente, no lo toqué).
  Headless sin HMR: normal / REDUCE / DUP de los 9 → 0 errores de consola y cierran; 0 tweens sobrantes al cerrar en los
  tres modos; saltar a mitad de la toma devuelve al gato entero en los 9 (alpha 1, sin máscara, en su lugar); `revealfps`
  con vsync: 60/17 en todas las ventanas salvo el cuadro de la ruptura (33–50 ms, igual que los de C/D) y el del remate
  (50–67 ms, incluye el nombre de la revelación); `hitch` desde `open()`: máximo 33 ms en los 9 con cachés calientes.
  Vértices: el Graphics más grande durante las revelaciones 4 440 (Gatojo); en las cartas a 3184×950, 7 820 (Ssssmichi).
  Videos CDP a 57–60 fps; con la máquina a carga 20–190 aparecieron huecos sueltos de 100–180 ms que cambiaban de gato y de
  momento entre corridas (también en los de D grabados a la vez) y no salen en el arnés de rAF.
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-e/` — `<gato>.mp4` ×9, `sheet-<gato>.jpg` ×9 (15 cuadros
  del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `cards.jpg` (134×124, 356×345 y la página 3184×950 reducida),
  `card-verts.json`.
- **Notas**:
  - Coordenadas `onCat` medidas sobre las pinturas integradas (700×700, mismo encuadre que los PNG): puño de Gatojo
    (0,31; 0,30), pata del pecho de Gomitas (0,79; 0,47), sello de Kagebunyan (0,66; 0,50), flecha de Miaang (0,49;
    0,12→0,28), manzana de Ryumiau (0,667; 0,41), carta de Yugi (0,30; 0,30). Si cambia el arte, hay que medirlas de nuevo.
  - Michimpostor: el cartel y «¡SOSPECHOSO!» son UN Text cada uno (contorno + sombra) y la boleta se arma en un tiempo
    tranquilo (0,6 s): con tres copias CMYK el cuadro de la ruptura llegaba a 133 ms.
  - Para el dueño (referencias): las frases de batalla (`battleForm.cry`) de los datos citan casi literal los originales
    («I'M GONNA BE KING OF THE CATS!», «I NEVER GO BACK ON MY MEOW!», «IT'S TIME TO DUEL… AND NAP!», «YOU'RE TOO SLOW,
    MICHI!», «THAT CAT IS SUS!») y salen en el subtítulo de la revelación; no son mías ni las toqué. En mis universos
    cambié dos remates del roster por la misma regla: «¡MUY LENTO!» → «¡YA LLEGUÉ!» y «¡ERA EL IMPOSTOR!» →
    «¡ERA EL MICHIMPOSTOR!». Dejé «¡DE VERITAS, MIAU!» (juego de palabras del roster): que lo confirme el dueño.
- **Cómo retomar**: servidor `universos-e` (puerto 5216, sin HMR) en `.claude/launch.json` →
  `<scratchpad>/ue/vite.ue.config.mjs` (el gestor tenía los 5 lugares ocupados; lo corrí con `npx --prefix game vite
  --config …` en segundo plano y ya lo detuve). Arnés en `<scratchpad>/ue/` (`revealshot`, `revealvideo`, `revealfps` con
  `CAP=1`, `skip`, `tweens`, `hitch`, `rverts`, `cards`, `vsheet.sh`, `tile.sh`); `common.mjs` trae `PRE()`/`window.CD()`
  que registra en caliente un universo aún no registrado y usa la pintura de Daft Miau si el arte no ha llegado. `reg.py`
  registra un gato en mi bloque y lo saca de PENDING.
- **Última actualización**: 2026-10-29 00:40
