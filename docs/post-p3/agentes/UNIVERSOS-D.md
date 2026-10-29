# UNIVERSOS-D — universos de revelación para 8 Multidimensionales post-Parte III

- **Qué estoy haciendo**: nada; terminado (2026-10-28 18:45). Sin commit (lo integra el coordinador). Falta la revisión del dueño.
- **Hecho**:
  - Corrí `game/scripts/postp3-sync.mjs` (de SISTEMA): entraron a `src/data/postp3/especies.json` los 17 post con arte
    (mis 8 + 9 de UNIVERSOS-C) y sus ids a los PENDING de `p3MultiverseReveal` y `multidimPowers`.
  - `game/src/fx/sequences/multiverse/kitD.ts`: ayudantes propios, todos en polígonos gruesos (`onCat`, `ngon`, `arcPts`,
    `bandPts`, `streak`, `twinkle`, `rnd`, `starfield`, `balloon`/`say`, `aside` = la línea chica bajo el remate,
    `beats`, `slideIn`, `drive`, `hsv`).
  - Los 8 universos (un archivo por gato), registrados en `index.ts` (bloque «UNIVERSOS-D») y fuera de PENDING:
    - `michiatom.ts` · UNIVERSO DEL CAMPEONATO: estadio lleno de gatos, cancha que se curva con el horizonte y corre,
      «CAP. 128 · LA MISMA JUGADA», el tiro con efecto cruza en cámara lenta aplastándose, «¡TIRO CON EFECTO!», cuadro
      congelado «¿ENTRARÁ? ¡NO TE PIERDAS EL PRÓXIMO CAPÍTULO!». Remate: el balón vuelve dándole la vuelta al mundo, la
      tribuna estalla; ¡GOOOOL! / …en el capítulo que sigue.
    - `pegaso.ts` · UNIVERSO DEL SANTUARIO: noche, la montaña sagrada con escalinata y doce templos, columnas de mármol;
      las estrellas forman el caballo alado, la armadura de bronce baja de la constelación pieza por pieza (¡CLANC!), aura
      de cosmos azul con estrellas en órbita, «¡BRONCE!». Remate: cien meteoros del puño; ¡ARDE, COSMOS! / …y la cola también.
    - `unzarpazo.ts` · UNIVERSO HÉROE DE AFICIÓN: ciudad en ruinas gris, un monstruo del tamaño del cielo con siete ojos
      rojos ruge «¡TIEMBLA, GATITO!»; él ni se mueve: una hoja seca, un volante «¡OFERTA! ATÚN 2×1», «fuuu…» y el recuadro
      manga de su cara de nada («…¿hoy hay oferta?»). Remate: un golpe normal, el monstruo revienta, las nubes salen
      volando en anillo y el cielo queda azul; ¡PUM! / …¿ya?
    - `mazingato.ts` · UNIVERSO SUPERROBOT: atardecer, el laboratorio en el risco, alarmas y balizas; la alberca se abre en
      dos y el gigante sube del foso en su plataforma entre vapor y reflectores; la cabina voladora se acopla a la cabeza
      («¡PILOTO… ACOPLADO!») y se abre el abanico de héroe. Remate: los dos puños cohete salen en llamas, revientan en las
      orillas y regresan; ¡PATAS… FUERA! / …y regresan solas. (Único que toma prestado al gato: lo devuelve al final de la
      toma y en el remate; probado saltando a mitad de la subida.)
    - `miaunya.ts` · UNIVERSO SECRETO: el expediente «OPERACIÓN BIGOTES · ULTRASECRETO» llena la pantalla y se abre a una
      sala de estar de los 60 (papel tapiz teal, sillón mostaza, lámpara de cono, foto familiar, tablero de pistas con hilo
      rojo); sellos ULTRASECRETO / CONFIDENCIAL, burbujas de pensamiento (pez, pistola de agua, cacahuate), ojos verdes y
      ondas de telepatía, «¡JE!». Remate: destellos y cacahuates, sello MISIÓN: ADORABLE; ¡MIAKU MIAKU!
    - `daftmiau.ts` · UNIVERSO PIRÁMIDE: pista negra, la pirámide de paneles LED se enciende por franjas al bombo (124 bpm),
      piso LED que destella, láseres desde la punta; el compañero del casco dorado se ilumina en su tarima, destellos en
      los dos cascos, su visor brilla a través de la silueta, BIP · BUP en LED. Remate: todo arcoíris, abanico de láseres,
      confeti LED, el compañero levanta el brazo; ¡BIP-BUP-MIAU!
    - `gemichi.ts` · UNIVERSO GEMELO: pantalla partida en diagonal rasgada: campamento soleado junto al lago (pinos,
      cabaña, canoa, letrero CAMPAMENTO) y casa elegante bajo la lluvia; su gemela (la misma pintura en espejo, en silueta)
      hace esgrima con ella (¡CLANC! ×2), la foto rota se junta sobre sus cabezas, «¡IGUALITAS!». Remate: la gemela también
      se llena de color, idéntica, y se cambia al otro lado; ¿Y CUÁL SOY?
    - `miaubody.ts` · UNIVERSO DE LA MÁQUINA DEL TIEMPO: penthouse plano estilo 1959 (reloj atómico, ventanal, globo,
      sillón coral), arco remachado con focos que corren y el túnel del tiempo girando; por dentro pasan las pirámides, un
      castillo, una carabela y un cohete mientras la consola marca -2560 · 1200 · 1492 · 1969 · HOY; se acomoda los lentes
      (destellos) «Ejem.». Remate: souvenirs de todas las épocas salen del arco; ¡LLEGAMOS… ¡A TIEMPO! / …bueno, casi.
  - Cada uno con `card(w,h,live)`: estático en la cuadrícula, vivo en el detalle con `liveLoop`.
- **Verificación (2026-10-28)**: `tsc` limpio; `vitest run` completo verde (84 archivos, 1294 pruebas); headless sin HMR:
  normal / REDUCE / DUP de los 8 → 0 errores de consola y cierran; 0 tweens sobrantes al cerrar; 60 fps con vsync
  (videos CDP a 60 fps reales, hueco máximo 17 ms); saltar a mitad de la toma devuelve al gato entero en los 8; vértices:
  el Graphics más grande de las cartas a 3184×950 tiene 3 177 (Un Zarpazo), el de las revelaciones 2 648.
- **Entregables** (fuera del repo): `<scratchpad>/reveals/universos-d/` — `<gato>.mp4` ×8, `sheet-<gato>.jpg` ×8 (15 cuadros
  del video), `sheet-REDUCE.jpg`, `sheet-DUP.jpg`, `cards.jpg` (134×124, 356×345 y la página 3184×950 reducida),
  `card-verts.json`.
- **Notas**:
  - Un texto grande con dos copias de trazo grueso (Dela Gothic) a mitad de la toma costaba un cuadro de 100–170 ms: los
    títulos de la toma se construyen al abrir (alpha casi 0) y solo se muestran después.
  - `onCat(c, fx, fy)` usa coordenadas medidas sobre las pinturas actuales (visor de Daft Miau, ojos de Miaunya, lentes de
    Mr. Miaubody, puños de Mazingato y Pegaso, cabina): si cambia el arte, hay que medirlas de nuevo.
  - La gemela de Gemichi es `variantSprite('xp_gemichi', 520, { live: false })` con su propio `SilhouetteFilter`.
- **Cómo retomar**: servidor `universos-d` (puerto 5215, sin HMR) en `.claude/launch.json` → `<scratchpad>/ud/vite.ud.config.mjs`;
  arnés en `<scratchpad>/ud/` (`revealshot`, `revealvideo`, `revealfps` con `CAP=1` para vsync, `skip`, `tweens`, `hitch`
  = cuadros largos medidos desde `open()`, `rverts` = vértices durante la revelación, `cards` = imágenes + vértices,
  `vsheet.sh`, `tile.sh`).
- **Última actualización**: 2026-10-28 18:45
