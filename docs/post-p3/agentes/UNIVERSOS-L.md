# UNIVERSOS-L — universos de revelación para 9 Multidimensionales de la tanda 2 («cine, series, telenovela, pop y deporte»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29 11:45). Sin commit (lo integra el coordinador). Falta la revisión
  del dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitL.ts`: ayudantes propios, todos en polígonos gruesos: `snow` (nieve sembrada que
    se redibuja), `sheet` (hoja con renglones), `coin` (moneda con huellita, sin dinero real), `lamp` (farol de poste),
    `stormClouds`, `palm`, `flashbulbs` (flashes de cámara en una tribuna oscura), `shoutLines` (líneas de grito),
    `glint` (destello), `drift` (algo que cae en cámara lenta) y `cheer2` (remate en dos tiempos: «¡AAAAH!…» y luego
    «¡JA!»). Reusa `pre/at/wrap/comic` de kitI y `aside/onCat/ngon` de kitD.
  - Los 9 universos (un archivo por gato) con su carta `card(w,h,live)` (estática en la cuadrícula, viva en el detalle
    con `liveLoop`), registrados en `index.ts` (bloque «UNIVERSOS-L») y fuera de PENDING en
    `tests/p3MultiverseReveal.test.ts` (PENDING quedó vacío):
    - `pobregatito.ts` · UNIVERSO DE LA CASA SOLA: el recibidor de una casa en Nochebuena (papel tapiz crema, ventanal en
      arco con la calle nevada y los techos de los vecinos con foquitos, escalera con alfombra roja y luces en el
      barandal, puerta verde con corona y vidrio esmerilado, el árbol). Una lata de pintura se suelta del descanso y baja
      columpiándose sobre la escalera (¡FIUUU!), carritos de juguete cruzan el piso (¡TRRRR!), tocan (¡TOC, TOC!) y dos
      sombras de gatos ladrones aparecen en el vidrio («¿Hay alguien en casa?»); 4 TRAMPAS LISTAS. Remate: líneas de
      grito desde su boca, ¡AAAAH!… y luego ¡JA!; la puerta se abre y una segunda lata entra columpiándose — ¡BONK! — las
      dos sombras se van de lado bajo estrellitas, las luces se vuelven locas, vuelan carritos y esferas; …la casa se
      defiende sola. (Solo slapstick, nadie sale herido en pantalla.)
    - `felinamente.ts` · UNIVERSO ROSA: tribunal todo rosa (columnas de mármol rosa, cornisa, lambrín, piso de damero rosa
      y blanco, el sello inventado: huellita sobre la balanza y un corazón), el jurado de gatos a la izquierda y la jueza
      gata de peluca blanca a la derecha con el mazo (¡TOC! ×3), placa EL GATO vs. LA ASPIRADORA, los papeles del caso
      vuelan y bajan en cámara lenta, el jurado se asombra (¡OOOH!), la gatita del bolso dice «¡miu!» con un corazón, el
      libro de leyes destella. Remate: último mazazo, luz rosa, corazones y papeles, el jurado de pie; ¡OBJECIÓN! /
      …¡ha lugar! Y con brillito.
    - `gorrimiau.ts` · UNIVERSO DEL MAR MALDITO: noche de tormenta en un mar verde negro, luna enfermiza, olas con espuma,
      bancos de niebla; de la niebla sale un barco de velas negras rotas y faroles verdes (bandera: un esqueleto de
      pescado, nada de la calavera de las películas). Él se columpia de una cuerda del aparejo (toma prestada su pose:
      posición y giro, nunca la escala; la devuelve a los 2.1 s y en el remate), rayo (¡KRA-KOOOM!), en primer plano su
      brújula de latón se abre (¡CLIC!), la aguja gira loca y se clava (¡CLAC!) en una lata de atún que flota en el
      horizonte bajo la luna; RUMBO: ATÚN. Remate: la niebla se abre, la lata brilla como tesoro, salen monedas y llueven
      por todo, los faroles se vuelven dorados; ¡ATÚN A LA VISTA! / …el norte está sobrevalorado.
    - `docmiauwn.ts` · UNIVERSO DE LA TORRE DEL RELOJ: plaza de noche con lluvia, juzgado con torre del reloj, tiendas sin
      nombres, farol y un cable del pináculo al farol. Las manecillas corren, el rayo pega en la torre (¡KRA-KA-BUM!),
      baja por el cable en una chispa (¡ZZZT!) y el farol se enciende; un coche plateado en cuña con puertas de ala (sin
      nombre ni logo) cruza la calle entre arcos azules (¡FIUUUM!) y deja dos rayas de fuego paralelas; DESTINO: AYER.
      Remate: el coche vuelve en un triple destello, el reloj gira para atrás, el fuego crece, arcos alrededor de su
      aparato en Y y chispas en la antena; ¡FUNCIONA! / …¿o funcionó? ¿o funcionará?
    - `pinkmiau.ts` · UNIVERSO DE LA CASA RODANTE: desierto al atardecer (cielo violeta a naranja, sol hundiéndose tras
      mesas moradas, yucas, huellas de llantas) y una casa rodante vieja crema y café estacionada detrás de él: tiembla y
      burbujea (¡BLUB, BLUB!), sale humo azul de las ventanas y del ducto (¡FUUUSH!), la puerta se abre de golpe (¡PAM!)
      con luz azul a su lado y burbujas azules que suben al cielo; LABORATORIO MÓVIL. Remate: su matraz hierve en una
      fuente de burbujas, vuelan moléculas de bolitas y palitos, todas las ventanas brillan azul; ¡CIENCIA! / …y siempre
      con goggles. (Solo matraz y goggles: nada de cristales, bolsitas ni nada más.)
    - `miauty.ts` · UNIVERSO DE LA OFICINA: oficina de los noventa en perspectiva (lámparas fluorescentes, pasarela
      brillante al centro con reflectores hasta un letrero PASARELA, pósters de gatas modelo), dos escritorios con
      computadoras beige grandotas, teléfonos de cable rizado y carpetas, y a su lado un escritorio chiquito con lamparita.
      Suenan los teléfonos (¡RIIIN! ×2), se prenden las pantallas verdes, un remolino de papeles sale del escritorio grande
      y cae uno por uno, en orden perfecto, en su escritorio chiquito (¡TAC!), destellan sus lentes y sus brackets
      (¡TING!); BALANCE: CUADRA. Remate: las pantallas dibujan gráficas que suben, la pasarela se enciende, vuelan papeles
      y palomitas; ¡CUENTAS CLARAS! / …y la belleza también suma.
    - `garjona.ts` · UNIVERSO DEL TROVADOR: Antigua Guatemala a la hora azul: calle empedrada entre fachadas coloniales
      (ocre, terracota, crema, azul, blanco, rosa) con balcones de madera, rejas, tejas, buganvilias y faroles de pared; al
      fondo el arco amarillo con su torrecita del reloj y detrás el volcán, oscuro contra el cielo del atardecer. Rasguea
      (¡TRRRAN!) y las palabras de su historia salen una por una («Había una vez…», «un gato…», «una caja…», «y
      entonces…»), cada una se dobla en un pájaro de papel y se va volando; LA HISTORIA SIGUE… Remate: una parvada de
      pájaros de papel sale de la guitarra y cruza sobre el volcán, los faroles se avivan, caen pétalos de buganvilia;
      ¡QUÉ HISTORIA! / …y eso que todavía no termina. (Ni títulos ni letras de canciones: las palabras son de un cuento.)
    - `shakimiau.ts` · UNIVERSO SÍSMICO: escenario sobre la arena de una playa caribeña al atardecer (sol en el mar,
      palmeras, truss con luces, público de gatos con las patas arriba). Cada paso (¡PUM!) manda un anillo de choque por el
      escenario: todo tiembla, las palmeras se sacuden, sus monedas tintinean (¡CHIN-CHIN!) y detrás una ola gigante sube
      al ritmo… y se congela en la cresta, brillando; MAGNITUD: ¡9.9!. Remate: la ola congelada estalla en brillos dorados y
      monedas en vez de reventar, fuegos dorados, rojos y azules, el público salta; ¡QUE TIEMBLE! / …hasta el mar se puso
      a bailar. (Recatado: falda larga y cinturón de monedas; sin títulos ni letras; nada de pies descalzos.)
    - `miaucol.ts` · UNIVERSO DE LA DUELA: arena bajo los reflectores vista desde la banda (tribunas llenas de gatos en
      sombra con flashes de cámara, duela con la zona pintada de rojo y la línea de tiro libre, el aro con el reloj de
      posesión encima). Flota en cámara lenta: la cámara sube con él y se acerca al aro (¡FIUUU…!), estallan los flashes
      (¡OOOH!), el reloj parpadea 0.3 y el aro tiembla esperando; DESDE LA LÍNEA. Remate: ¡PLAM!: el aro se dobla y
      regresa, la red latiguea, un balón cae por la red y rebota lejos, el reloj marca 00 en rojo con la chicharra,
      confeti rojo, negro y blanco, tormenta de flashes; ¡CLAVADA! / …y la gravedad, de vacaciones. (El 23 sí; nada de
      silueta-logo, escudo ni marca.)
  - Cambio sobre el diseño: Doc Miauwn remata «¡FUNCIONA!» (…¿o funcionó? ¿o funcionará?) en vez de «¡GRAN SCRATCH!»
    (juego con la frase de la película; el brief pide sin frases célebres, y su grito de batalla en los datos ya dice
    GREAT SCRATCH!). Si el dueño prefiere el diseño original, es una línea en `docmiauwn.ts` (`cheer(...)`).
- **Verificación (2026-10-29)**: `tsc` limpio; `p3MultiverseReveal`, `multidimPowers`, `postp3Multidim`, `multidimCards` y
  `uiFixPantalla` verdes; `vitest run` completo verde (89 archivos, 1562 pruebas, 2 omitidas). Headless sin HMR, con el
  arte real integrado: normal / REDUCE / DUP de los 9 → 0 errores de consola y cierran; 0 tweens sobrantes al cerrar
  (normal, DUP y REDUCE); llenan la pantalla a 16:9, 3:2 (1500×1000) y 21:9 (2100×900); 60 fps con vsync
  (`revealfps CAP=1`; un cuadro suelto de 33 ms justo en el sello en Gorrimiau y Doc); videos CDP a 60 fps, hueco máximo
  17 ms; `hitch` sin cuadros largos repetibles (algún pico suelto de la máquina cargada que no se repite en 3
  corridas); saltar a 1.0 s de la toma devuelve al gato entero en los 9 (posición, giro, alpha, sin máscara) y no deja
  restos de la toma (cuerda, brújula, palabras) sobre el remate; vértices: el Graphics más grande de las cartas a
  3184×950 tiene 3 351 (Garjona), el de las revelaciones 3 339 (Garjona).
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-l/` — `<gato>.mp4` ×9, `sheet-<gato>.jpg` ×9 (15
  cuadros del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `sheet-3x2.jpg`, `sheet-21x9.jpg`, `sheet-skip.jpg`,
  `cards.jpg` (134×124, 356×345 y la página 3184×950 reducida), `card-verts.json`.
- **Notas**:
  - Solo Gorrimiau toma prestado al gato (kitC `borrowPose`: posición y giro para columpiarse); lo devuelve a los 2.1 s y
    en el remate. Ningún otro mueve, enmascara ni cambia el alpha del gato.
  - `onCat()` medido sobre los SVG integrados (sin cambios desde las 09:24): boca de Pobre Gatito (0.49, 0.40); libro
    (0.38, 0.42) y gatita del bolso (0.68, 0.45) de Felinamente; pata alzada de Gorrimiau (0.80, 0.30) y su lata
    (0.53, 0.60); aparato en Y (0.60, 0.50) y antena (0.08, 0.08) de Doc; boca del matraz (0.31, 0.13) y goggles
    (0.55, 0.20) de Pinkmiau; lentes (0.47, 0.29) / (0.63, 0.27) y brackets (0.55, 0.40) de Miauty; boca de la guitarra
    de Garjona (0.32, 0.53); pies (0.50, 0.95) y cadera (0.52, 0.52) de Shakimiau. Si llega un SVG «balanceado» con otra
    composición, medir de nuevo (`<scratchpad>/ul/artgrid.mjs`).
  - Miaucol: el aro está a la izquierda, justo bajo el balón alzado de la pintura (el «antes de clavarla»); la toma mueve
    la cámara (un contenedor dentro de `back`), no al gato.
  - Audio: solo `sfx` sintetizados, como C/D; ninguna pista ni canción del dueño.
- **Cómo retomar**: servidor `universos-l` (puerto 5228, sin HMR) en `.claude/launch.json` → `<scratchpad>/ul/vite.ul.config.mjs`;
  arnés en `<scratchpad>/ul/` (`common.mjs` apunta a mis 9; `revealshot` con `SIZE=WxH` y cierre solo si sigue abierta;
  `revealvideo` necesita ruta de salida absoluta; `revealfps` con `CAP=1`; `skip` con `AT=<ms>` desde `open()` y capturas en
  `skipshots/`; `tweens`, `hitch`, `rverts`, `cards`, `artgrid`, `vsheet.sh`, `tile.sh`). En zsh, pasar las especies como
  argumentos sueltos (`${=S}`), no en una sola variable. Trabajo pesado siempre con `briefs/pesado.sh`.
- **Última actualización**: 2026-10-29 11:45
