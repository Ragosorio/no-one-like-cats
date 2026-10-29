# UNIVERSOS-F — universos de revelación para 9 Multidimensionales post-Parte III («caricaturas y tiras»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29 00:45). Sin commit (lo integra el coordinador). Falta la revisión
  del dueño.
- **Hecho**:
  - Los 9 gatos ya estaban en `src/data/postp3/especies.json` (arte + rig de ARTE-POST, sync de SISTEMA). Sus 9 universos
    están registrados en `index.ts` (bloque «UNIVERSOS-F») y fuera del PENDING de `p3MultiverseReveal`.
  - `game/src/fx/sequences/multiverse/kitF.ts`: ayudantes propios, todos en polígonos gruesos (`rrect`, `rot`, `xf`,
    `jitter`, `oval`, `puffs`, `halftone`, `bar`, `star`, `glow`); palabras PRECONSTRUIDAS: `title` (un solo Text con trazo y
    sombra dura), `pre` + `pop` (se estacionan invisibles y se muestran en su tiempo; una ráfaga de `pre()` se escalona de
    dos en dos cuadros para que diez textos no se rastericen en el mismo cuadro), `payline` (el remate + el aparte chico,
    construidos a los 0,25 s de la toma, o en el acto si un salto adelanta el remate), `asideText`, `floaty`; `borrowFor`
    (presta la silueta para un salto o un temblor y la devuelve entera al terminar y al llegar el remate); `capsule` (el
    ayudante amarillo de goggles, con orejas de gato; `flat` para las cartas fijas) y `banana`.
  - Los 9 universos (un archivo por gato):
    - `michipulin.ts` · UNIVERSO DEL HÉROE COLORADO: foro de TV de los 70 hecho de bastidores de cartón pintado (cielo con
      saguaro, pared de adobe con puerta en arco, casita rosa con postigos), papel picado, sol de cartón colgando de su hilo,
      parrilla de luces, boom, letreros AL AIRE y APLAUSOS, cámara. Plato «¡EN VIVO Y CON PÚBLICO!», las luces se prenden una
      por una, alguien pide «¡AUXILIO! ¡UN HÉROE, POR FAVOR!» desde la ventana pintada, humo rojo y ¡PUF! con salto de la
      silueta, BIP BIP con anillos desde las antenitas (medidas sobre la pintura), ensayo del mazo «¡chuik!» y risas grabadas.
      Remate: el mazazo chillón (estela + estrella), el bastidor de la casa se va de espaldas en una nube de polvo, el público
      se carcajea; ¡CHUIK! / …perdón por el decorado.
    - `condorgato.ts` · UNIVERSO DEL REMATE: página de historieta a dos tintas (negro + rojo) con medio tono; las viñetas
      bajan como escalera y cuentan un chiste en Pelotillemiau («DOCTOR… ¡ME SIENTO COMO UN GATO!» · «¿Y DESDE CUÁNDO?» ·
      «¡DESDE QUE ERA GATITO!»); en las tres últimas todos se van de espaldas a la vez, patas arriba, con polvo y plumas
      (plaf ×3). Remate: la página se sacude, anillo de polvo a sus pies, tormenta de plumas de cóndor; ¡PLAF! / …y eso que
      el chiste era bueno.
    - `rick.ts` · UNIVERSO DE LOS PORTALES: garaje de chatarra (bloques, tablero de herramientas, mesa con matraces de baba
      verde, repisas, cortina, auto volador de lámina, tubo fluorescente que parpadea); se abre el remolino verde detrás de él
      y luego dos más; por ellos se asoman otras versiones de SU silueta (con sombrero de copa, con bigotazo, y una hecha
      cubo): «¿OTRA VEZ TÚ?» · «¡QUÉ GUAPO SOY!» · «¡MIAU CÚBICO!»; chispas, ¡ZAP!, y se los traga. Remate: todos los
      portales revientan, salen las versiones y llueven gatitos-cubo; ¡OTRO UNIVERSO, MISMO GATO! / …y todos se creen el
      original.
    - `miauby.ts` · UNIVERSO DEL MISTERIO: pasillo de mansión embrujada de los 70 (papel tapiz morado a rayas, lambrín,
      alfombra roja, puertas, retratos cuyos ojos te siguen, candelabros, telarañas, ventanal con luna llena y murciélagos);
      trueno ¡CRAAACK!, las puertas se abren y azotan solas (¡PAM! ¡BANG!), el fantasma de sábana sale de una puerta y se
      mete en otra de lado a lado («¡BUUU!»), él tiembla (¡GLUP!), el fantasma se le planta al lado («¡BUUUUU!») y él jala la
      sábana. Remate: la sábana sale volando y debajo está el conserje viejito con su trapeador; se prenden las luces;
      ¡ERA EL CONSERJE! / …con razón olía a trapeador.
    - `blumiau.ts` · UNIVERSO DE LAS PISTAS: casa de recortes de papel pastel (cada pieza con su borde blanco y sombra
      suave): ventana con sol sonriente, librero, mesita con plato, tapete, reloj. Tres huellas azules aparecen una tras otra
      (en la ventana, en el plato y en un libro que sale del librero) — ¡PISTA 1/2/3! —, el sillón de pensar entra
      deslizándose y el cuaderno verde de espiral sube y dibuja solo las tres pistas. Remate: palomitas en las tres, huellas
      que saltan por todo el cuarto, confeti de papel; ¡TRES PISTAS! / …¡a la silla de pensar!
    - `esponja.ts` · UNIVERSO DEL FONDO: fondo del mar de caricatura (cielo de agua con rayos de luz, nubes-flor, columnas
      de burbujas, arena con coral y algas que se mecen, casa-fruta tropical con puerta de escotilla, mostrador de órdenes
      con campanita). Barrido de burbujas, ¡DING!, medusa rosa que zumba (bzzz), salto con la espátula y las hamburguesas
      vuelan — ¡FLIP! ×3 — hasta apilarse en el mostrador. Remate: géiser de burbujas, la torre completa con su tapa;
      ¡ORDEN LISTA! / …con doble burbuja.
    - `gatogro.ts` · UNIVERSO DEL PANTANO: pantano verde-dorado al atardecer (árboles retorcidos con musgo, bancos de niebla,
      agua turbia con nenúfares, eneas, luciérnagas, la casita dentro de un tocón con humo en la chimenea, la letrina con su
      luna). Letreros de madera se clavan uno por uno (¡FUERA! · ¡PRIVADO! · ¡CUIDADO CON EL GATOGRO!, ¡TOC!), burbujas de
      lodo (¡BLUB!) y una cebolla gigante crece alrededor de la silueta y se pela capa por capa («¡CAPA POR CAPA!»). Remate:
      el rugido — anillos por el carrizal, la niebla se va, salen volando los pájaros, salpica el lodo; ¡ESTE PANTANO ES MÍO!
      / …y no se aceptan visitas.
    - `grru.ts` · UNIVERSO VILLANO: guarida subterránea (pantallas: la luna en la mira, plano del rayo, mapa del mundo;
      cohete en su plataforma, mapa de papel con la luna encerrada en rojo, tuberías, franjas de peligro, pasarela por donde
      trotan los ayudantes amarillos). Las pantallas parpadean, la mira se fija («OBJETIVO: LA LUNA»), un foco gigante baja
      sobre su silueta y se prende — ¡IDEA! — y el rayo escarcha (¡FZZZ!). Remate: el rayo helado le pega a la luna de la
      pantalla, se encoge a canica, salta fuera y rebota a sus pies; los ayudantes festejan; ¡ROBÉ LA LUNA! / …bueno, una
      chiquita.
    - `miaunion.ts` · UNIVERSO AYUDANTE: bodega-laboratorio clara (ojos de buey, franja de peligro, banda transportadora de
      plátanos, cajas con plátano, baliza roja en el techo). Gira la baliza (¡UIUUU! ¡UIUUU!), luz roja barre el cuarto, una
      estampida de cápsulas amarillas con goggles cruza la pantalla y vuelan plátanos en arco; uno se detiene junto a su
      silueta y saluda «¡HOLAAA!». Remate: lluvia de plátanos, la manada brinca de gusto, la baliza gira al doble;
      ¡BANANAAA! / …¿alguien tiene otra?
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula (pocos Graphics; capsulas/paneles/lámparas aplanados en uno),
    vivo en el detalle con `liveLoop`.
- **Verificación (2026-10-29)**: `tsc` limpio; `p3MultiverseReveal` y `postp3Multidim` verdes. `vitest run` completo:
  1 381 pasan, 1 falla que NO es mía (`multidimPowers` → `xp_doomiau`: el nombre de su poder cae en la regex
  STARFALL/METEOR/DECREE) y 2 «Timeout calling onTaskUpdate» del worker por la carga de la máquina. Headless sin HMR, los
  9 en normal / REDUCE / DUP → 0 errores de consola, todos cierran; 0 tweens sobrantes al cerrar en los tres modos; saltar
  a mitad de la toma (1,9 s, 2,3 s y 2,7 s) devuelve al gato entero (x, y, rotación, alpha, sin máscara ni skew); `open()`
  cuesta 1–8 ms de JS y `payoff()` 0–4 ms; fps con vsync (`revealfps CAP=1`): 60 en las ventanas de 0,5 s, con algún cuadro
  de 33–67 ms al abrir solo bajo carga 30–90 de la máquina (`hitch` repetido con carga 90: 0 cuadros largos en Michipulín,
  Blumiau, Condorgato, Miauby, Esponja, Gatogro); videos CDP finales a 59,5–60,1 fps. Vértices: el Graphics más grande
  durante las revelaciones 7 236 (el papel de Condorgato), en las cartas a 3184×950 6 762 (la banda de plátanos de
  Miaunion); cuadrícula 134×124: ≤ 2 106 por Graphics y 5–19 Graphics por carta.
- **Notas**:
  - No usé las frases de catálogo de las fuentes: el remate de Esponja es «¡ORDEN LISTA!» (no «¡LISTO!», demasiado cerca de
    su muletilla) y el de Gatogro «¡ESTE PANTANO ES MÍO!» (el roster decía «¡FUERA DE MI PANTANO!», casi una cita). El
    chiste de Condorgato es inventado y su caída es «¡PLAF!» (no la onomatopeya de la tira original).
  - OJO (no es mío, lo reporto): los gritos de batalla del roster que se ven bajo el nombre en la revelación son citas o
    muletillas reales: Esponja «I'M READY! I'M READY!», Gatogro «GET OUT OF MY SWAMP!», Grrrú «TONIGHT… WE STEAL THE MOON!».
  - Un remolino largo dibujado como UN polígono (Rick) rompía la triangulación (losas verdes cruzando la pantalla): los
    brazos del portal son cadenas de cuadriláteros.
  - Las alarmas de Miaunion dicen «¡UIUUU!» (no la imitación de sirena de los ayudantes originales); el filamento del foco
    de Grrrú es una espiral (al principio formaba una «M»).
  - `onCat` usa coordenadas medidas sobre las pinturas integradas (antenitas y mazo del Michipulín, espátula de Esponja,
    rayo de Grrrú, cabeza de Miauby); si cambia el arte hay que medir de nuevo.
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-f/` — `xp_<gato>.mp4` ×9, `sheet-xp_<gato>.jpg` ×9 (15
  cuadros del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg` (toma + remate de los 9), `cards.jpg` (134×124, 356×345 y la página
  3184×950 reducida), `card-verts.json`. 44 MB.
- **Cómo retomar**: servidor `universos-f` (puerto 5217, sin HMR) en `.claude/launch.json` → `<scratchpad>/uf/vite.uf.config.mjs`
  (tiene además una «puerta de arte» de prototipo: sirve la pintura desde fuera del repo solo si su SVG aún no está en
  `cats-svg/`; ya no hace falta). Arnés en `<scratchpad>/uf/` (`revealshot`, `revealvideo`, `revealfps` con `CAP=1`, `skip`
  con `SKIPMS`, `tweens`, `hitch`, `rverts`, `cards`, `vsheet.sh`, `tile.sh`; `proto.mjs` registra en la página un universo
  aún no registrado en `index.ts`).
- **Última actualización**: 2026-10-29 00:45
