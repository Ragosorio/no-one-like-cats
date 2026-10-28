# CARTAS — las cartas Multidimensionales del Catdex

**Encargo (2026-10-28):** el dueño, mirando el Catdex: «que sea más épico la muestra de la vista previa, que se note como
tarjetas únicas, que se sienta como especiales». Cada carta MULTIDIMENSIONAL debe ser inconfundible y única por gato, en
la cuadrícula Y en la ficha de detalle.

## Qué estoy haciendo
- Nada: entregado al coordinador (2026-10-28 12:40). Espera la revisión del dueño.

## Hecho
- **`game/src/panels/collection/cardArt.ts`** (nuevo): ayudas para el arte de carta. `liveLoop(nodo, fn)` anima mientras
  el nodo viva y se apaga solo al destruirse (con Reducir movimiento dibuja un cuadro fijo), `bands`, `glow`, `rays`,
  `sparkle`, `dots`, `seeded`, `mix`, `lum`. Lo pueden usar UNIVERSOS-A/B en sus `card()`.
- **`game/src/panels/collection/multidimCard.ts`** (nuevo): `cardSkin(especie)` → marco, etiqueta, oscuro, `own` y
  `art(w, h, live)`: el `card()` del universo o, si no hay, el universo genérico `boxTunnel` (un túnel de cajas abiertas
  con los colores del gato, distinto por especie). `universeTexture()` hornea el arte una vez por especie × tamaño (la
  cuadrícula nunca lo redibuja). `multidimGem` (el símbolo del set), `tagPlate` («UNIVERSO AMARILLO»), `powerPanel`
  (PODER MULTIDIMENSIONAL).
- **printTextures.ts**: la cara 'multidimensional' ahora es por universo (`accent` = Signature.frame): marco metálico del
  color del universo con guilloché, franja de las cinco cajas alrededor de la ventana y del borde, placa oscura.
- **CatCard.ts**: si es Multidimensional (registrada o rumor): universo en la ventana (textura horneada; en vivo con
  `liveUniverse`), luz suave detrás del gato, halo del color del universo alrededor de la carta, gema arriba al centro
  (carta grande: la etiqueta del universo), foil iridiscente (marco irisado + un destello prisma que cruza; quieto con
  Reducir movimiento). Rumor: universo atenuado + silueta clara, sin pintura.
- **art.ts**: arreglo de un bug latente: `variantSprite` con la pintura aún sin cargar (1×1) escalaba ×700 → carta
  grande en blanco al navegar rápido en el Catdex.
- **`card()` en los 9 universos** (homiau, gatarana, murciegato, supersiames, harrygatter, gatomalo, tailorswift, billie,
  vangato): cada uno su escena a cualquier tamaño (corazón del universo en (w/2, 0.54h)); en vivo se anima con liveLoop.
- **Catdex.ts (ficha)**: Multidimensional → el universo vivo toma toda la ficha (su corazón detrás de la carta grande),
  oscurecido hacia el lado de lectura, motas de colores subiendo; cristal oscuro con borde del universo para el texto;
  nombre con sombra del color del universo; carta grande flotando; botón REVELACIÓN grande arriba a la derecha (respira);
  el bloque ULTIMATE se reemplaza por el panel PODER MULTIDIMENSIONAL (el poder ES su ulti; nota
  `MULTIDIM_POWER_NOTE`); rumor: fondo atenuado y quieto, panel de poder bloqueado («???»).
- **`game/tests/multidimCards.test.ts`** (nuevo): cada Multidimensional tiene piel; los 9 dibujan su carta; cada `card()`
  se construye a 3 tamaños; liveLoop se limpia al destruir.
- Arnés: `<scratchpad>/qa3/pp/cartas.mjs` (sin HMR; importa módulos con la URL que cargó el juego).

## Falta
- Revisión del dueño. Las 16 nuevas (UNIVERSOS-A/B) toman su `card()` en cuanto lo registran; sin él, el genérico.
- Verificación: tsc limpio; `tests/multidimCards.test.ts` 5/5; suite completa con 14 fallos AJENOS (timeouts de
  simulaciones por la máquina cargada, filmActo1 de FINAL, p3MultiverseReveal mientras UNIVERSOS registraba; este
  último ya pasa).
- Capturas: `<scratchpad>/cartas/` (grid-multidim, grid-multidim-zoom, grid-todas, detail-*, altar-x_vangato,
  reduce/…, sheet-final.jpg).

## Cómo retomar
- Servidor propio: entrada «cartas» (puerto 5201) en `.claude/launch.json`. Nunca el 5173.
- `cd <scratchpad>/qa3/pp && POW=1 node cartas.mjs ../../cartas grid all d:x_homiau rumor:l_gatzilla fps close`
  (pasos: grid | all | d:<especie> | rumor:<especie> | dbg:<especie> | fps | close; env CTX=1 cartas de papel registradas
  alrededor, REDUCE=1, TWICE=1). Fixture `?save=h93-final`; el arnés concede gatos solo en su perfil desechable.
- Trampa: con HMR apagado, un `import('/src/x.ts')` pelado en page.evaluate crea una 2.ª instancia si el archivo cambió
  (ContentConflict «crystal ya existe»): usar `window.__imp`.

## Última actualización
2026-10-28 12:40
