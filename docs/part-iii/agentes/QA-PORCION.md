# QA-PORCION · recorrido de punta a punta de la porción vertical

- **Qué estoy haciendo**: terminado (entregado al coordinador). Sin commits. No toqué código.
- **Hecho**:
  - Vite 5651 (HMR y ws apagados) + Chrome sin cabeza (Metal, vsync, autoplay), perfil propio. Ya apagados y perfil borrado.
  - **Recorrido A (h65-normal), por la interfaz**: CONTINUAR → Diario → NOVEDADES → tarjeta H66 → IR → tocar la página → pelo → bar A → Momento (bot de teclado por la entrada real: S, 12/12) → B → remate → CAMBIÓ H66 + tarjeta H67 → calle (4 tramos; el 3.º sin tocar: ella lo empuja) → isla → despertar → CAMBIÓ H67 + tarjeta H68 → IR → Carta → Maneki → PAGAR 15 B → CAMBIÓ H68 + tarjeta H69 → B-1…B-5 (bot) → CAMBIÓ H69. H66→H69 avanzan solas; huellas 3/6/9/12/15; `won_p3d_borracha_5`.
  - Tarjetas: las 4 con PASA/IMPORTA/QUEREMOS/AHÍ y CAMBIÓ; el premio va al final y chico. Ningún `why` ni tarjeta usa el premio como motivo.
  - Oyente: 0 apariciones antes de R1 (chequeo por código cada 150 ms + 92 cuadros revisados a ojo). Solo su globo «¿Y luego?», sin placa.
  - Momento: primera vez la pausa solo ofrece SEGUIR; en «Volver a ver» ofrece SEGUIR y SALIR (sale bien, no toca `best`).
  - Canelo habla en bar y calle; en el despertar (isla) solo habla Luzterna.
  - Recorrido B: recarga a mitad del Momento → H66 sigue y la página abre de nuevo; recarga con H67 pendiente → se retoma por IR y por la gatera (solo su borde, bug 2); recarga con B-3 ganada → la Carta sigue en B-4 (9 huellas). **Recarga durante el despertar → se pierde (bug 1).**
  - Recorrido C: late-game (Parte I) y rupturas-mid (Parte II) sin nada de la Parte III (sin gatera, dona, botón CAJAS ni misiones H66+); carta igual a la referencia.
  - Rigs de los 3 candidatos (viento 0/1; happy/hurt/attack/surprise/sleepy): sin rasgaduras visibles; propuesta leve para las orejas de dona_police_cat.
  - FPS (vsync): bar 60 · Momento 58,1 (3 cuadros >50 ms) · escena B 60 · calle 60 · despertar 57,9 · Carta 60 · batalla Borracha 60.
  - `npm run typecheck` limpio; pruebas P3 + rupturasReset + originalsReserved: 85/85.
- **Bugs (por gravedad)**:
  1. **Alta — recargar/cerrar durante el despertar lo pierde para siempre.** Ventana: desde que termina la calle hasta el paso D3 de `p3_despierta` (~15–18 s). `catchUp()` (app/story.ts) solo reencola ON_NEW de misiones activas; `b67_despierta` nunca se marca, CAMBIÓ H67 (`after: b67_despierta`) y la tarjeta H68 + M1 (`b68_carta#a`) quedan colgadas en la cola; no sale en Volver a ver; la gatera no se rasga y REGISTRO 000 dice «despertando» hasta terminar H68. No traba (H68 sigue por IR). Pasos: h65-normal → bar y calle (SALTAR sirve) → recargar 3 s después de que arranca `p3_despierta` → CONTINUAR → nada; `__story.state().beats` = `['p3_tarjeta_H68','b68_carta#a']`. Arreglo propuesto (1 línea en `catchUp`, como el caso H21): `if (G.s.missions.active.includes('H68') && !beatSeen('b67_despierta')) for (const r of ON_DONE.H67 ?? []) queueBeat(r);`
  2. **Media — la gatera del faro casi no recibe toques.** El `glow` de `FaroPage` (Graphics passive) está encima de la gatera (`addChildAt(g, 0)` en `o4Pagina.ts`) y se traga los toques: solo responde el borde de arriba (23 de 210 puntos); con `glow.eventMode='none'` → 167/210. Afecta retomar H67 y entrar a la Carta por la gatera. Arreglo: `this.glow.eventMode = 'none'` (o la gatera encima del glow).
  3. Baja — «TURNO n» ilegible en batallas de la Borracha (tinta oscura sobre cielo nocturno).
  4. Baja — el aviso «NUEVA CANCIÓN EN LA FONOTECA · Drunck» sale encima de la escena B.
  5. Baja — en la Carta la ficha HUELLAS queda sobre el oscurecido del diálogo y SALTAR la tapa; notas al margen tapadas («Las donas no se tocan», «lo demás…»); PAGAR/LUEGO no centrados en la tarjeta de compra.
  6. Baja — aviso Pixi «textureSource/textureSampler destroyed while still bound» al cerrar el Momento y al cerrar `p3_despierta`.
  7. Nota — el título sigue diciendo «PARTE II — LA MAREA IMPOSIBLE» con partida en la Parte III.
- **Rigs (propuestas, sin editar `catRigs.json`)**: dona_police_cat `ears[0]` [245,110,225,60,32] → [240,104,224,60,24] y `ears[1]` [440,150,485,118,32] → [446,150,486,120,26] (la esquina de la gorra se arrastra un poco con la oreja en attack/hurt). Opcional espuma_bartender_cat `head` [315,150,95,95] → [318,140,100,108] (el lápiz del chongo queda fuera del óvalo; no se vio separarse).
- **Falta**: nada mío. Para el dueño: escuchar el Momento completo, aprobar el horneado TV de Luzterna (muy saturada) y el arte candidato; balance (la tripulación de h65 gana todo con 97 %, B-5 en 5 turnos).
- **Cómo retomar**: `<scratch>/qa-porcion/`: `restart-vite.sh`, `launch.mjs` (Chrome persistente; consola en `console.log`), `do.mjs <script> args`. Scripts: `s-bar.mjs` (H66–H67), `s-play.mjs` (bucle genérico), `s-ruta.mjs from to`, `s-b1.mjs` y `s-b3.mjs` (recargas), `s-old.mjs <fixture>`, `s-rigs.mjs`. Bitácoras `timeline-*.log`. Capturas: `para-el-duenio/` (30 + `00-hoja-de-contacto.jpg`), evidencia en `raw/`.
- **Última actualización**: 2026-10-13 ~12:20 (hora local)

## Re-prueba de correcciones del coordinador (2026-10-13 ~12:40, mismo arnés, 5651, h65-normal)
- 1 despertar tras recargar: **PASA**. `p3_despierta` vuelve a los 0,3 s de CONTINUAR; `b67_despierta`, CAMBIÓ H67, tarjeta H68 y `b68_carta#a` vistos; cola vacía.
- 2 gatera sin rasgar: **PASA**. Barrido 572/702 puntos (81 %; fallan solo las esquinas del recuadro, a escala 1,3); el centro responde («Una gatera. En MI faro.»).
- 3 «TURNO n» en B-3: **PASA**, legible con contorno papel.
- 4 aviso de la Fonoteca: **PASA**. No sale en la escena B ni sobre las tarjetas; sale ya en la isla, aprox. 1 s antes de que empiece el despertar.
- 5 PAGAR/LUEGO: **PASA**, centrados.
- 6 título: **PASA**, «PARTE III — FUERA DE LA CAJA».
- 7 rigs: gorra de Dona **PASA** (la esquina ya no se arrastra). Espuma: **sin cambio**. En attack (~120 ms) la punta del borrador del lápiz se afina a un hilo con la cabeza nueva y con la vieja igual (probado en memoria): no es regresión, pero tampoco lo arregla.
- Capturas: `<scratch>/qa-porcion/raw2/fix*.jpg`. Vite y Chrome apagados; perfil y caché borrados.
