# UNIVERSOS-J — universos de revelación para 8 Multidimensionales de la tanda 2 («leyendas, mitos e historia»)

- **Qué estoy haciendo**: nada; terminado (2026-10-29). Servidor `universos-j` detenido. Sin commit (lo integra el
  coordinador). Falta la revisión del dueño.
- **Hecho**:
  - Los 8 tienen arte integrado (SVG + lite + rig + `especies.json`). Coordenadas `onCat` medidas sobre los SVG lite a
    520 px con rejilla al 10 % (`<scratchpad>/uj/art520.jpg`).
  - `game/src/fx/sequences/multiverse/kitJ.ts`: ayudantes propios en polígonos gruesos (luna, luciérnagas, carrizos,
    ondas, lágrima, pluma de quetzal, greca escalonada, voluta de códice, glifos inventados, gato sentado de templo,
    antorcha, pincelada al óleo, engrane bocetado, línea que se dibuja sola, rasgueo con los SFX) y reexporta lo que uso
    de kitA–kitI (sin editarlos).
  - Los 8 universos (un archivo por gato), registrados en `index.ts` (bloque «UNIVERSOS-J») y fuera de PENDING de
    `tests/p3MultiverseReveal.test.ts`:
    - `sombreronron.ts` · UNIVERSO DE LA LEYENDA: medianoche en una calle empedrada de pueblo colonial (casas ocre, azul
      y terracota, faroles, listones de colores de lado a lado), el arco amarillo con su cupulita al fondo y el volcán
      dormido detrás, luna grande; suena una guitarrita («♪ tiririrín…»), por la calle avanza SOLO un sombrero gigante de
      puntitas (dos botitas con espuela debajo, «tip…»), los vecinos apagan la luz uno por uno y uno grita «¡EL
      SOMBRERONRÓN!»; se detiene, se levanta tantito: dos ojos amarillos; «¡FLIP!», el sombrero salta y cae en su
      cabeza: era él. Remate: tres listones se trenzan en un anillo a su alrededor y vuelven las luces; ¡QUIETO, QUE TE
      TRENZO! / …con listoncitos de colores. (Toma prestado al gato: lo devuelve al voltear el sombrero, al final de la
      toma y en el remate.)
    - `gatejo.ts` · UNIVERSO DEL CAMINO DE NOCHE: camino de tierra entre milpas bajo la luna llena, una casita lejana con
      una ventana prendida, farol en su poste, neblina; un gatito camina solo con su farolito que tiembla («¿hay
      alguien…?»), suena una cadena («clanc… clanc…»), la neblina se espesa y se abren dos ojos, uno azul y uno color
      brasa; la neblina se abre y la silueta sale partida en blanco y negro (borde de pelo largo); ¡GUAU-MIAU!. Remate:
      huellas que brillan alumbran el camino hasta la casita, el gatito ya no va solo (♥) y salen las luciérnagas;
      ¡NADIE ANDA SOLO! / …yo te acompaño hasta tu casa.
    - `maullorona.ts` · UNIVERSO DEL RÍO (tierno, nunca de miedo): río ancho bajo una luna azul, carrizos, lirios con
      florecitas, luciérnagas; un velo blanquísimo flota sobre el agua y se posa detrás de ella como campana de encaje;
      un «¡AAAAAY!» le da la vuelta entera a la pantalla; caen lagrimones de caricatura que hacen círculos en el agua; en
      la orilla, de una caja de cartón, asoman tres cabecitas: miu, miu, miu. Remate: los gatitos saltan de la caja hacia
      ella, corazones y luciérnagas; ¡AHÍ ESTÁN! / …ya no llora: ahora los regaña.
    - `quetzalgatl.ts` · UNIVERSO DEL CÓDICE: toda la pantalla es una página de códice en papel amate (frisos rojos con
      grecas escalonadas); el viento pasa dos hojas solo («¡FUUUSH!») y quedamos en la pirámide escalonada con su templo,
      el glifo del sol, volutas de nube, magueyes y un caminito de huellas; una cola enorme cubierta de plumas de quetzal
      le da la vuelta a toda la pantalla como serpiente; remolinos de plumas a los lados; una voluta de viento le sale de
      la boca. Remate: la cola da una vuelta detrás de él y se queda girando, plumas y volutas; ¡QUE SOPLE! / …y a favor,
      para variar.
    - `bastet.ts` · UNIVERSO DEL TEMPLO: templo de piedra de noche a la luz de antorchas, columnas pintadas con hileras de
      gatos sentados, banda de glifos inventados, la gran puerta abierta a la noche del desierto (estrellas, pirámides
      lejanas) bajo el sol alado; un disco solar dorado sube detrás de su silueta negra; arena dorada sube en espiral a
      su alrededor; la puerta se cierra sola —¡CLONC!— y sus junturas brillan en oro. Remate: el sol destella y un anillo
      de glifos se cierra a su alrededor; ¡PROTEGIDOS! / …nadie entra sin limpiarse las patas.
    - `cleogatra.ts` · UNIVERSO DEL NILO: terraza de palacio sobre el Nilo al atardecer (columnas de papiro turquesa y
      oro, cortinas de lino al viento, braseros; el río, una falúa, palmeras y una pirámide lejana bajo el sol que se
      pone); dos guardias felinos entran marchando con la alfombra enrollada al hombro, la sueltan —¡PUM!— y se hacen a
      un lado; la alfombra se desenrolla hacia la cámara de golpe —¡FLOOOP!— y ella sale dando una vuelta (remolino
      dorado), la perla destella. Remate: lluvia de pétalos de loto y oro, los guardias alzan las lanzas; ¡LLEGÓ LA
      REINA! / …y trajo su propia alfombra. (Toma prestado al gato: lo devuelve al desenrollarse la alfombra, al final y
      en el remate.)
    - `bonapata.ts` · UNIVERSO DEL IMPERIO: campo de batalla pintado al óleo (pinceladas visibles) bajo nubes doradas de
      tormenta; redoblan los tambores, en un peñasco un caballo blanco se encabrita contra el cielo («¡IIIIIH!»); la
      cámara baja, el humo de cañón se abre… y una flechita escrita a mano señala que está parado en «(una caja)»; la
      bandera sube detrás de él (tres franjas y una pata dorada). Remate: la luz rompe entre las nubes, vuelan hojas de
      laurel y una banderita se clava sola en el sillón que está en medio del campo; ¡CONQUISTADO! / …el sillón ya es
      territorio imperial.
    - `leonardo.ts` · UNIVERSO DEL GENIO: taller del Renacimiento (yeso cálido, vigas, bocetos sepia en todas las paredes:
      engranes, estudios de ala, el tornillo aéreo, un gato «de Vitruvio» en su círculo y cuadrado; ventana a las colinas
      con cipreses; banco con compás, tintero y pluma) y la máquina voladora de madera y lona colgando del techo; los
      dibujos se arman solos en el aire engrane por engrane y empiezan a girar, una cadena dibujada sube hasta la máquina;
      se rompen las cuerdas —¡TAC!—, bate las alas y despega («¡FLAP! ¡FLAP!»), y un «¡VUELA!» escrito en espejo se
      voltea para leerse. Remate: la máquina da la vuelta sobre él y los bocetos salen volando de las paredes como
      pájaros; ¡FUNCIONA! / …al intento número 47.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula, vivo en el detalle con `liveLoop` (la calle con faroles y
    listones; el camino con los dos ojos que parpadean; el río con ondas, velo y la caja de gatitos; la página de códice
    con plumas; el templo con el sol y la puerta brillando; la terraza del Nilo con la alfombra y el destello de la
    perla; el cielo al óleo con el caballo y la bandera; la página de cuaderno con la máquina y engranes que giran).
- **Verificación (2026-10-29, completa)**: `tsc` limpio; `vitest run --maxWorkers=2` completo verde (89 archivos, 1562
  pruebas, 2 saltadas). Headless sin HMR, todo con `briefs/pesado.sh`:
  - normal / REDUCE / DUP de los 8 → 0 errores de consola y cierran;
  - 0 tweens sobrantes al cerrar en normal, REDUCE y DUP (`tweens.mjs` cierra con `autoClose`: ningún clic puede caer
    en INVOCAR del FxLab);
  - 60 fps con vsync; videos CDP a 60 fps reales: hueco máximo 17 ms en 6 de 8; El Gatejo 33 ms una vez justo en la
    ruptura del sello (se movió ahí al preconstruir la mitad blanca en `open()`; antes caía a mitad de la toma) y
    La Maullorona 33 ms una vez en la reimpresión de la rareza (en la primera grabación fue 17 ms);
  - saltar a los 0.55 s y a los 1.55 s de la toma devuelve al gato entero en los 8 (y 520, alpha 1, sin skew ni máscara);
    `open()` tarda 2–8 ms y el remate 1–3 ms;
  - vértices: el Graphics más grande durante la revelación tiene 9 474 (Quetzalgatl, la cola) y en las cartas a
    3184×950 tiene 14 076 (Bonapata, el cielo al óleo); todos bajo 25k;
  - 21:9 (2100×900) y 3:2 (1500×1000) de los 8: llenan la pantalla, cierran, 0 errores.
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-j/` — `<gato>.mp4` ×8 y `sheet-<gato>.jpg` ×8 (las de
  gatejo, maullorona, quetzalgatl, bonapata y leonardo regrabadas tras los ajustes), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`,
  `cards.jpg` (134×124, 356×345 y la página 3184×950 reducida), `card-verts.json`, `aspect-21x9.jpg`, `aspect-3x2.jpg`.
- **Notas**: `onCat` usa coordenadas medidas sobre los SVG actuales (ojos, sombrero, perla, boca, caja): si llega un SVG
  «balanceado» de alguno, hay que medir de nuevo con `uj/artsheet.mjs`.
- **Cómo retomar**: servidor `universos-j` en `.claude/launch.json` → `<scratchpad>/uj/vite.uj.config.mjs`; arnés en
  `<scratchpad>/uj/` (copia del de UNIVERSOS-D/E apuntando a mis 8: `revealshot`, `revealvideo`, `revealfps`, `skip`
  con `SKIPAT`, `tweens`, `hitch`, `rverts`, `cards`, `aspect.mjs` = el `reveal.mjs` de UI-FIX en mi puerto,
  `artsheet`, `vsheet.sh`, `tile.sh`; `batchA.sh` / `batchB.sh` / `batchC.sh` = las pruebas en tandas de menos de
  25 min). Todo lo pesado con `briefs/pesado.sh`.
- **Última actualización**: 2026-10-29 (verificación completa)
