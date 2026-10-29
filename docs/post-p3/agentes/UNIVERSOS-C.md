# UNIVERSOS-C — universos de revelación para 9 Multidimensionales post-Parte III

- **Qué estoy haciendo**: nada; terminado (2026-10-28 19:05). Sin commit (lo integra el coordinador). Falta la revisión
  del dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitC.ts`, con estos ayudantes:
    - formas como polígonos de lados fijos (`ell`, `arcPts`, `smooth`, `glowDisc`, `wavePts`, `fogBank`, `pawPrint`)
      y `engrave` (rayado de grabado);
    - `pay` / `paid` / `beat`: si el jugador salta, la toma ya no corre encima del remate;
    - `borrowPose`, `bubble` / `say`, `headline` (palabra del remate + acotación) y `floatWord`.
  - Los 9 universos, cada uno con `open`, `payoff` y `card`. Están registrados en `multiverse/index.ts` (bloque
    «UNIVERSOS-C») y ya salieron del PENDING de `tests/p3MultiverseReveal.test.ts`:
    - `ahab.ts` · UNIVERSO BALLENERO: mar gris de grabado, ballenero, bote, cuerdas tensas, chorro, la aleta blanca pasa
      bajo él, la cola golpea. Remate: el Pez Blanco salta en arco detrás de él; «¡AHÍ SOPLA!» «(¡el Pez Blanco!)».
    - `frankengato.ts` · UNIVERSO LABORATORIO: torre de piedra con el techo abierto a la tormenta, losa de zinc que sube
      con cadenas, escalera de Jacob, bobina, matraces, interruptor (¡KLANK!), rayo (¡KRAK!) que lo pinta negro sobre
      blanco, costuras que brillan, aguja MUERTO→VIVO. Remate: sobrecarga, saltan los corchos, VIVO; «¡RESPIRA!»
      «…y maúlla.».
    - `gatoneta.ts` · UNIVERSO DEL PALACIO: salón de espejos pastel, candelabros, abanicos, torre de pasteles que crece
      piso a piso, lluvia de macarons, la peluca crece con un barquito encima y vuelve a bajar (¡OH, LÀ, LÀ!). Remate:
      una croqueta gigante tumba la cereza; «¡QUE COMAN CROQUETAS!».
    - `gatote.ts` · UNIVERSO DE LA MANCHA: llanura ocre de grabado, molinos; él galopa (rebote, polvo, cascos); el molino
      se vuelve GIGANTE (ojos, dientes, puños, ¡GRRR!); el escudero en burro grita «¡SEÑOR, QUE SON MOLINOS!». Remate:
      la carga, la explosión de polvo, las aspas locas, los ojos mareados; «¡A ELLOS!» «(…eran molinos)».
    - `gatula.ts` · UNIVERSO TRANSILVANIA (antes «DEL CASTILLO»; lo cambié para que se reconozca al instante): luna roja,
      castillo en el risco, lobos que aúllan, carruaje negro, murciélagos; la CAPA barre la pantalla a negro con ojitos
      rojos y, al irse, deja la luna detrás de él. Remate: campanada, la capa se abre como alas, salen murciélagos;
      «Bienvenido.» en gótica, con una gota roja.
    - `pinomichi.ts` · UNIVERSO DEL TALLER: taller como lámina de libro (con su marco), el fogón PINTADO en la pared,
      virutas, cuelga de los hilos de una marioneta que se cortan uno a uno (¡TAC!) y la nariz crece cruzando la
      pantalla. Remate: «¡NO ES MENTIRA!», la nariz crece otra vez con hojas y un pájaro carpintero se la acorta
      (toc, toc, toc), como en el libro.
    - `sherlock.ts` · UNIVERSO DE NIEBLA: calle victoriana en niebla amarilla, faroles de gas que se encienden, la puerta
      verde 221B, huellas que brillan, hilo rojo a las pistas (OLOR A ATÚN · PELOS EN EL SOFÁ · ¿LA CROQUETA?) y una
      lupa gigante que las agranda. Remate: los hilos se tensan hacia él, se abre la niebla; «¡ELEMENTAL!»
      «…mi querido michi.».
    - `barril.ts` · UNIVERSO DE LA VECINDAD: patio en un foro de TV (puertas 14, 71 y 8, escalera, lavadero, tendedero),
      luces de estudio (¡CLAC!), la pelota rebota de puerta en puerta (¡TOING!), se cuela el micrófono, letrero RISAS y
      JA JA JA. Remate: una torta de jamón gigante baja en un rayo de luz y cae al barril, APLAUSOS; «¡TORTA!»
      «(…de jamón)». Sin muletillas del programa.
    - `gatoleone.ts` · UNIVERSO DE LA FAMILIA: despacho oscuro con luz cenital, persianas que se abren a la boda en el
      jardín (carpa, focos, parejas bailando), tarantela lejana, una rosa que cae, una naranja que rueda, un sobre «UNA
      OFERTA». Remate: se cierran las persianas, queda la lámpara; «Es solo negocio.» «(…con todo respeto)».
  - **Verificación**:
    - `tsc` limpio.
    - `vitest run` completo: 84 archivos y 1295 pruebas en verde.
    - Headless en normal, REDUCE y DUP, los 9: 0 errores de consola y todos cierran.
    - 0 tweens sobrantes, en normal y en DUP.
    - Saltar a mitad de la toma devuelve al gato entero (x, y, rotación, alpha, sin máscara).
    - fps con vsync: 60 fps y 17 ms en todas las ventanas de los 9.
  - **Vértices** (medidos en el navegador): cada carta a 134×124, a 356×345 en vivo y a 3184×950 quieta y en vivo, y
    cada revelación muestreada mientras corre. El Graphics más grande de los 9 tiene unos 7 k vértices (máx. 7 124,
    Sherlock a página completa).
- **Notas**:
  - Se quitaron dos tirones de 33–50 ms en el remate. El halo suave de `headline` sobre dos líneas de cursiva grande es
    caro de rasterizar, y la primera cursiva grande de la sesión también. Por eso «¡QUE COMAN CROQUETAS!» y «Es solo
    negocio.» van en serif recta.
  - Medido sobre las pinturas actuales: `NOSE_TIP` y `NOSE_A` de Pinomichi (de dónde crece la nariz), los puntos de los
    hilos y las costuras de Frankengato. Si cambia el arte, hay que medirlos de nuevo.
- **Entregables** (fuera del repo), en `<scratchpad>/reveals/universos-c/`:
  - `xp_<gato>.mp4` ×9 y `sheet-<gato>.jpg` ×9;
  - `sheet-REDUCE.jpg` y `sheet-DUP.jpg`;
  - `cards.jpg` (cuadrícula 134×124 sobre detalle 356×345) y `cards-page.jpg` (3184×950).
- **Cómo retomar**:
  - Servidor: `universos-c` en `.claude/launch.json` (puerto 5214, `<scratchpad>/uc/vite.uc.config.mjs`, sin HMR).
  - Arnés en `<scratchpad>/uc/`:
    - `revealvideo.mjs` + `vsheet.sh` (videos y hojas);
    - `revealshot.mjs` (env REDUCE / DUP / TIMES);
    - `revealfps.mjs` (CAP=1 = vsync);
    - `skip.mjs` (AT=ms), `tweens.mjs`, `verts.mjs` (REVEAL=1);
    - `cardshot2.mjs` (MODE=page), `ptime.mjs` (costo de open / payoff y de los cuadros siguientes).
- **Última actualización**: 2026-10-28 19:05
