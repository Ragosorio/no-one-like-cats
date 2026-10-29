# UNIVERSOS-G — universos de revelación para 8 Multidimensionales post-Parte III («superhéroes y pantalla»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29). Sin commit (lo integra el coordinador). Falta la revisión del
  dueño.
- **Hecho**:
  - `game/src/fx/sequences/multiverse/kitG.ts`, todo en polígonos gruesos:
    - patrones: `halftone` (trama de cómic, con tope de puntos y nada si el punto mide menos de un píxel), `sunRays`,
      `ringPts`;
    - momentos: `sparks` (chispas de metal), `pulse` (anillo que crece), `popShow`, `hidden`;
    - `lazy`: construye lo pesado unos cuadros después de abrir (o al instante si hace falta antes: un salto);
    - palabras: `caption` (cartela amarilla de cómic), `prepTitle` (remate + acotación: el texto grande a 1.5×, el
      halo a 0.5× y la acotación unos cuadros después) y `prepWord` (onomatopeya con fantasmas CMYK, cada copia en su
      cuadro, mostrada en su golpe).
  - Los 8 universos, uno por archivo, registrados en `index.ts` (bloque «UNIVERSOS-G») y fuera del PENDING de
    `tests/p3MultiverseReveal.test.ts`. Ningún nombre real en pantalla: solo los juegos de palabras.
    - `garritas.ts` · UNIVERSO MUTANTE: primero el monitor verde del laboratorio secreto («SUJETO G-X · CONTENCIÓN»,
      METAL EN HUESOS 100 %, PACIENCIA 3 %, ALERTA que parpadea); tres garras lo rasgan de lado a lado (¡SHIKT!), sus
      cuatro pedazos se caen y detrás hay un bosque nevado de cómic de noche (luna, pinos con nieve, copos); chispas de
      metal en las garras, la furia (la pantalla late en rojo, «¡GRRRAAAH!») y los tres rasguños de la pantalla se
      cierran solos con crucecitas verdes: FACTOR CURATIVO. Remate: tres tajos cruzan el bosque, las copas de los pinos
      se resbalan y caen, estalla la nieve; ¡SHIKT! / …ni un rasguño.
    - `supermichi.ts` · UNIVERSO DEL CIELO: ciudad de cómic al atardecer (torres art déco, ventanas encendidas, el
      edificio del periódico con su globo dorado y el letrero EL MAULLIDO, trama en el cielo), azotea llena de gatos
      que señalan arriba («¡MIREN!» «¿QUÉ ES ESO?»); una estela roja y azul cruza el cielo y da la vuelta a la torre
      (¡FIUUUM!), unos lentes de reportero caen dando vueltas a sus patas; la CAPA barre toda la pantalla y al irse
      brilla detrás de él el emblema propio (diamante dorado con huellita, nunca una letra) («¡ES UN GATO!»). Remate:
      el emblema destella, giran los rayos, la gente brinca, vuelan páginas de periódico, destello en el puño;
      ¡ARRIBA! / …con lentes nadie lo reconoce.
    - `hierromichi.ts` · UNIVERSO DE LA ARMADURA: taller de noche (piso pulido con rejilla de luz, vitrinas iluminadas
      con sus armaduras, paneles holográficos azules con gráficas y medidores, un brazo robot torpe); «PROTOCOLO DE
      ARMADURA · INICIANDO…», placas rojas y doradas llegan volando de los dos lados y se acoplan (¡CLANK! ¡CLANK!);
      luego estamos DENTRO del casco: el retículo gira y las lecturas dicen la verdad (ENERGÍA 400 % · EGO MÁX ·
      HUMILDAD 0 %); el círculo del pecho se enciende («vmmmm…»). Remate: propulsores azules bajo sus cuatro patas,
      todas las armaduras de las vitrinas encienden el pecho, el repulsor de la palma responde; ¡ARMADURA LISTA! /
      …y la número 41 ya viene.
    - `michimerica.ts` · UNIVERSO DEL ESCUDO: página de cómic de los años 40 en sepia (trincheras, costales, alambre de
      púas, árboles rotos, columnas de humo, biplanos, banderines rojos y blancos), cartela «HACE MUCHAS, MUCHAS
      SIESTAS…»; el escudo propio (anillos rojo y blanco, centro azul, huellita blanca; sin estrella, sin bandera real)
      entra girando y rebota en tres esquinas (¡CLANG! ×3) y cada rebote le devuelve el color a la página, hasta que
      vuelve a su pata con un estallido; luego la escarcha entra por las esquinas: «…Y LUEGO SE DURMIÓ 70 AÑOS EN EL
      HIELO.» Remate: el hielo se rompe, fuegos artificiales rojos, blancos y azules, los banderines se agitan;
      ¡DE PIE! / …después de la siesta.
    - `doomiau.ts` · UNIVERSO DEL TRONO DE HIERRO: gran salón de piedra verde bajo tormenta (dos ventanales ojivales
      con lluvia, estandartes verdes sin emblema, braseros de fuego verde, alfombra verde hasta un trono de hierro con
      púas detrás de él) y dos filas de dobles robóticos enmascarados con capa verde; rayo (¡KRA-KOOM!), los ojos de
      los dobles se encienden uno por uno, todos dicen su nombre («¡DOOMIAU!»), un círculo de runas inventadas gira en
      el piso, chispas verdes en el guantelete, habla de sí mismo («Doomiau ha llegado.») y el segundo rayo destella en
      su máscara. Remate: magia verde del guantelete, las runas salen volando, los dobles se inclinan;
      ¡DOOMIAU HA HABLADO! / …y Doomiau aplaude a Doomiau.
    - `michiwan.ts` · UNIVERSO DE LA GALAXIA LEJANA: las estrellas se estiran en líneas de hiperespacio, destello, y
      caemos sobre un planeta desierto al atardecer con DOS soles (dunas, choza de adobe con domo, torre de humedad);
      el sable se enciende (¡VUUM!) sobre el sable pintado… parpadea, se apaga y resulta ser un puntero: un punto rojo
      corre por las dunas y una línea punteada desde sus ojos lo sigue a todas partes («…¿un puntero?», «!»). Remate:
      la duna bajo sus patas sube hasta ser un risco altísimo, el desierto se hunde, pasan nubes por debajo, allá abajo
      su aprendiz protesta («¡NO ES JUSTO!»), el sable vuelve a arder; ¡QUE LA CROQUETA TE ACOMPAÑE! / …desde la parte
      alta. (La broma de la parte alta sin citar a nadie.)
    - `heisenmiau.ts` · UNIVERSO DEL DESIERTO (apto para toda la familia: ni una droga, solo «química»: su matraz, un
      pizarrón y cristales azules de caramelo): cielo enorme sobre un desierto amarillo de mesetas, la neblina cálida de
      la serie, una casa rodante vieja que echa humo, una planta rodadora; el matraz de su pata levantada burbujea azul
      («blup…»); el viento trae un sombrerito negro que le cae en la cabeza (¡PLOP!); el gis escribe «2 MIAU + CALOR =
      PURR» y una molécula; graniza caramelo azul (¡PLINK!); «Atención, clase.»; destello en los lentes. Remate: el
      matraz se desborda en burbujas azules (y brilla), racimos de cristal azul brotan junto a él, vuelan moléculas, el
      humo se vuelve azul; ¡QUÍMICA! / …y hay examen el lunes. En la carta suben burbujas del matraz.
      (2026-10-29: rehecho para el repintado aprobado por el dueño — matraz en vez de la bolsita; coordenadas medidas
      de nuevo: ala del sombrero (0.49, 0.19) con inclinación 0.15, lente derecho (0.545, 0.245), boca del matraz
      (0.215, 0.2), vidrio (0.25, 0.32).)
    - `miaufalda.ts` · UNIVERSO DE LA TIRA: una página de periódico («La Gaceta Gatuna», «¿POR QUÉ EXISTE LA SOPA?»,
      columnas grises) y la tinta dibuja una tira de cuatro viñetas, una por una: el tazón de sopa lejos («¿Sopa?»),
      más cerca («¿OTRA VEZ SOPA?»), tan cerca que llena la viñeta y el vapor la mira con ojos enojados («¡GLUP!») y en
      la última el mundo girando con su curita («Pobre mundo.»); un símbolo de paz garabateado con pluma roja en el
      margen; un brillo cruza la tinta fresca. Su silueta es pura tinta entre viñetas. Remate: los tres tazones salen
      pateados de la tira salpicando, vuelan símbolos de paz, corazones y mundos; ¡SOPA NO! / …y una curita para el
      mundo.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula, vivo en el detalle con `liveLoop` (copos, humo, vapor,
    el mundo que gira, el punto rojo, los paneles, la tormenta, los fuegos artificiales, la bandera de banderines).
  - Coordenadas `onCat` medidas sobre los SVG integrados (sombrero y lentes de Heisenmiau, garras de Garritas, puño de
    Supermichi, pecho/palma/patas de Hierro Michi, escudo de Michimérica, máscara y guantelete de Doomiau, empuñadura,
    ángulo del sable y ojos de Michi-Wan). Si cambia el arte, hay que medirlas de nuevo
    (`<scratchpad>/ug/artgrid.mjs`).
- **Verificación (2026-10-29, con el arte integrado de los 8)**:
  - `tsc` limpio; `vitest run` completo verde (84 archivos, 1382 pruebas; la falla de `multidimPowers` por «DECREE» en
    la ulti de Doomiau la arregló el coordinador renombrándola; mis archivos no tenían ese nombre).
  - Headless sin HMR: normal / REDUCE / DUP de los 8 → 0 errores de consola y cierran; 0 tweens sobrantes al cerrar en
    los tres modos; 60 fps con vsync (videos CDP a 60.1 fps reales, hueco máximo 17 ms en los 8, medido con la carga
    de la máquina ya baja); `hitch` sin cuadros largos al abrir ni en el remate (los títulos ya no usan Dela Gothic: el
    remate en Anton/Playfair/Bangers se construye unos cuadros después de abrir); saltar a mitad de la toma y saltar
    justo al abrir devuelven al gato entero en los 8 y dejan la escena limpia (sin monitor, sin hiperespacio, la página
    del escudo ya en color).
  - Vértices: el Graphics más grande durante las revelaciones tiene 10 416 (Michimérica, la trama de puntos), en las
    cartas 11 036 (Michimérica a 3184×950); en la cuadrícula (134×124) el mayor es 1 033. Todos bajo 25k.
- **Heisenmiau repintado (2026-10-29 06:20)**: normal / REDUCE / DUP → 0 errores y cierran; 0 tweens sobrantes en los
  tres modos; 60.1 fps con vsync, hueco máximo 17 ms; `hitch` sin cuadros largos (×3); saltar a mitad y justo al abrir
  devuelve al gato entero; vértices: 1 166 en la revelación, 3 034 en la carta de página completa; `tsc` limpio y
  `p3MultiverseReveal` / `multidimPowers` / `postp3Multidim` verdes. Nuevos `xp_heisenmiau.mp4`, `sheet-heisenmiau.jpg`,
  `sheet-heisenmiau-REDUCE-DUP.jpg` y `cards.jpg` (los cuadros de Heisenmiau en `sheet-REDUCE.jpg` / `sheet-DUP.jpg`
  son del arte anterior).
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-g/` — `xp_<gato>.mp4` ×8, `sheet-<gato>.jpg` ×8
  (15 cuadros del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `cards.jpg` (134×124, 356×345 y la página 3184×950
  reducida), `card-verts.json`.
- **Notas**:
  - El tecleo del nombre en la revelación (del juego, no mío) enseña un instante «DOCTOR DOOM» y «CAPITÁN M» antes de
    completar «DOCTOR DOOMIAU» / «CAPITÁN MICHIMÉRICA»: lo dejo anotado por la regla de nombres.
  - Frases: «¡QUE LA CROQUETA TE ACOMPAÑE!» y «HACE MUCHAS, MUCHAS SIESTAS…» son paráfrasis con giro; en Supermichi
    la gente dice «¡MIREN!» «¿QUÉ ES ESO?» «¡ES UN GATO!» (no la frase de la radio).
- **Cómo retomar**: servidor `universos-g` (puerto 5218, sin HMR) en `.claude/launch.json` → `<scratchpad>/ug/vite.ug.config.mjs`;
  arnés en `<scratchpad>/ug/` (`revealshot`, `revealvideo`, `hitch`, `cards`, `skip`, `tweens`, `rverts`, `artgrid`,
  `vsheet.sh`, `tile.sh`). `revealshot`, `revealvideo`, `hitch` y `cards` aceptan `archivo:export@gatoDoble` para
  probar un universo sobre otro gato con arte antes de que llegue el suyo. En zsh, pasar la lista con `${=ALL}`.
- **Última actualización**: 2026-10-29 06:23
