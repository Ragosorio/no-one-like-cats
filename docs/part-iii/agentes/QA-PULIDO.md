# QA-PULIDO · prueba de punta a punta del pulido del arranque (ronda 3)

- **Qué estoy haciendo**: terminado y entregado al coordinador. No toqué código del juego. Sin commits ni push. Sin ráster en el repo.
- **Arnés**: Vite propio en 5671 (HMR y ws apagados) y Chrome sin cabeza (Metal, vsync, autoplay) con perfil propio, en `<scratch>/qa-pulido/`. Ya los apagué y borré los perfiles y la caché.

## Resultado por punto

| # | Punto | Resultado |
|---|---|---|
| 1 | Ruta A por la interfaz (h65-normal → … → Carta de H68) | **PASA con un bug**: todo el recorrido sale sin bloqueos, pero tocar la **lámpara** del faro no hace nada (bug 1). Funciona si se toca a media torre. |
| 2 | Entradas alternativas | **PASA**: la hoja y la gatera arrancan `p3_pelo` al primer toque, con y sin IR (4 de 4). Durante H66, el faro no muestra frase. La flecha del IR cae sobre «LA PÁGINA». |
| 3 | Recargas (mitad de A, Momento, B; H67 pendiente; callejón; despertar) | **PASA** en las 6: sin bloqueos y sin beats perdidos. Más abajo, el costo de recargar a mitad del bar. |
| 4 | Regla del oyente | **PASA a la vista**: 0 apariciones de Hipólito o de la parte secreta antes de R1 (revisión cada 150 ms, más unos 120 cuadros vistos a ojo). Hay un detalle técnico (bug 3). |
| 5 | «Reducir movimiento» | **PASA**: sin sacudidas (`shakeK` = 0), sin giros (la cámara del callejón solo vale 0 o π, como corte), sin destellos (el detector de luminancia cuadro por cuadro dio 0 en 18 366 cuadros). Nada se rompe. |
| 6 | Partidas viejas | **PASA**: en `late-game` y `rupturas-mid` no hay gatera, dona, hoja, rótulo ni `ext.gateras`. Tampoco hay misiones H66 o posteriores, ni botón CAJAS (la carta de `rupturas-mid` sale sin CAJAS). NOVEDADES solo habla de la Parte II. Los títulos son correctos. |
| 7 | Consola | **PASA**: 0 errores, 0 `pageerror` y 0 peticiones fallidas. Hay avisos conocidos (ver abajo). |
| 8 | FPS | **PASA**: 60 fps en todas las escenas con cine. Hay tirones de carga al armar el bar y al arrancar el Momento (ver la tabla). |
| 9 | Ráster, `tsc` y `vitest` | **PASA**: 0 ráster en `git status`, `tsc` limpio y vitest 670/670 (55 archivos). |

## Ruta A: tiempos reales (corrida 2, avanzando cada diálogo 1,7 s después de que termina de escribirse)

| Tramo | Duración |
|---|---|
| CONTINUAR → Diario (LUEGO) → NOVEDADES → `p3_fria` → tarjeta H66 → isla quieta | 25,7 s |
| IR → toque en el faro (con guion) | 2,6 s |
| Cruce: del toque al interior del bar (A2w) | 14,7 s (incluye 6,5 s de `p3_pelo` y unos 2 s de armado del bar bajo la luz) |
| Escena A | 36,8 s |
| Momento (unos 4–5 s quieto en el trago mientras carga + 70 s de canción; el bot sacó S, 12/12) | 74,4 s |
| Escena B | 102,3 s |
| Revelación R1–R10 + «¡GATERA DESCUBIERTA!» | 33,9 s |
| Tarjetas CAMBIÓ H66 + H67 | 8,4 s |
| Callejón (L1–L5: 19,9 s · tramo 1: 9,8 s · tramo 2: 11,7 s · tramo 3 sin tocar, ella lo empuja: 19,5 s · tramo 4 → V5: 47,4 s) | 108,9 s |
| Despertar | 34,3 s |
| CAMBIÓ H67 + tarjeta H68 → IR → Carta (`GaterasMapScene`) | unos 16 s |
| **Total, del toque al faro a la Carta** | **7 min 11 s** |

## Bugs (por gravedad)

### 1. Alta: tocar la lámpara del faro (y su tercio de arriba) no hace nada

- **Pasos**:
  1. Carga `?save=h65-normal` y toca CONTINUAR, LUEGO y ¡A JUGAR!.
  2. Espera la tarjeta H66.
  3. Toca IR en «La última ronda».
  4. Toca la **lámpara** del faro.
  - No pasa nada: no arranca el cine, no sale ninguna frase y `counters.feature_faro` no cambia. Se reprodujo 4 de 4 veces.
- **Causa**: el brillo del haz (`this.beam`, un Sprite con `glowTexture` en `wfx`, encima de los objetos; `src/scenes/IslandScene.ts:534–541`) hereda el modo `static` de `worldRoot`. Pixi lo cuenta como acierto vacío y se traga el toque. Además late con el pulso del haz (escala de 1 a 1,6; periodo de 2,9 s; línea 1580).
- **Medido** con el `EventBoundary` del propio juego:

  | Punto | Toques que responden |
  |---|---|
  | lámpara −20 px | 0 % |
  | lámpara | 0 % |
  | lámpara +25 px | 0 % |
  | lámpara +55 px | 40–67 % |
  | lámpara +90 px y +130 px | 100 % |

  Con `beam.eventMode = 'none'` (probado en vivo, sin tocar código) responde el 100 % de la torre.
- **Arreglo**: `this.beam.eventMode = 'none';` después de la línea 540.
  - Opcional: `this.wfx.eventMode = 'none'`, si nada en `wfx` necesita toques. Los textos flotantes de ingresos también viven ahí.
- Esto es justo lo que el dueño reportó («presioné el faro y no ocurrió nada»). La entrada del §3.1 solo funciona si se toca a media torre.

### 2. Media-baja: el aviso «NUEVA CANCIÓN EN LA FONOTECA · Drunck» sale en el callejón

- **Dónde**: aparece encima de «Derecho. DERECHO.», el momento grande de Luzterna.
- **Causa**: `src/audio/unlockToast.ts:65` espera como máximo 180 s mientras hay `hush`. Al terminar el Momento quedan B (unos 100 s), la revelación (34 s) y las tarjetas (8 s). Además, entre `playBarPrologue` y `playSalida` el `hush('gateras')` se suelta. El límite vence unos 36 s dentro del callejón.
- **Pasos**:
  1. Usa un navegador sin `localStorage['nolc-fonoteca']`, porque el espejo de la Fonoteca evita que el aviso vuelva a salir.
  2. Juega h65-normal sin SALTAR, a ritmo de lectura normal.
  3. Mira el callejón en el tramo 2.
  - Captura: `frames/ruta/112-callejon-camera.jpg`.
- **Arreglo**: que el límite no corra mientras `gaterasRunning()` o un cine sostengan la pantalla. Otras opciones: subirlo a unos 600 s, o mantener un `hush` desde el bar hasta el final del callejón.

### 3. Baja: a la cámara del bar del Momento le falta tomar en cuenta el giro

- **Qué pasa**: en c40 (m≈58, `score.ts:104`, `napkin: bcam(1216, 620, 2.6, 0.04)`), la esquina del cuadro inclinado llega a x = 1589–1593, de 4 a 8 px pasado `BAR.hideX` (1585).
  - Se repitió en las dos corridas (6 y 5 muestras).
  - No se dibuja nada del oyente: la parte secreta está oculta y en esa franja solo hay pared y barra. Pero rompe por unos píxeles la invariante de «nada a la derecha de hideX».
- **Arreglo**:
  - en `frameCamera`, sumar `|sin r|·halfH` a `halfR`; o
  - en ese plano, bajar x a unos 1205.

### 4. Baja (decisión del dueño): recargar a mitad del bar cuesta mucho

- **Qué pasa**: si se recarga a mitad del Momento o de B, al volver a entrar se repite A (se puede SALTAR), luego el Momento completo (la primera vez no se puede salir) y B desde el principio. Son unos 3,5 min.
- No se pierde ningún beat ni hay bloqueo.
- **Idea**: si ya se vio `b66_bar#a`, que la entrada empiece en el Momento o en B.

### 5. Baja: tirones de carga

- **Cruce**: al armar el bar bajo la luz de la gatera hay 4 cuadros de 183, 383, 567 y 767 ms. La luz «viva» se congela unos 2 s en total.
- **Momento**: mientras está quieto en el trago (m = 0, unos 4–5 s) hay 10 cuadros largos. No se notan porque la imagen está fija.
- **Momento con música**: 1 tirón de 0,7 s en m≈3 (la caída al tarro) en la corrida 2. En la corrida 1 el máximo fue de 417 ms.

### 6. Información (no son bugs de esta pasada)

- **GSAP** «target null/ not found»: 4 avisos al cerrar el Diario «Mientras no estabas» con LUEGO, en 5 de unos 15 arranques. Es la interfaz vieja.
- **Una vez, sin poder repetirlo**: tras la recarga a mitad de B, el primer toque a la hoja no abrió la entrada y la cámara se movió. El segundo toque sí funcionó.
- **«Reducir movimiento»**:
  - la cámara del bar del Momento sí se inclina despacio de 0 a 1,7° en c27–c28;
  - en el tobogán el espiral ya no gira, pero Canelo sí rueda;
  - L4 queda volteado 180° como corte.
  - Todo aceptable.
- **Para el dueño**:
  - en V1/V5 la bufanda de Canelo casi no se lee dentro de la silueta;
  - en la hoja por compás, c9–c15, c21–c24, c31–c38 y c46–c47 se ven parecidos al «antes» en cuadro fijo. Los cambios grandes están en c2–c8, c16, c17–c20, c29 y c41–c45.

## Recargas (detalle)

| # | Dónde se recargó | Qué pasó al volver |
|---|---|---|
| 1 | A en A5 | H66 sigue; la hoja llama; nada perdido; A empieza de nuevo. |
| 2 | Momento en m = 30 | `b66_bar#a` se conserva; la hoja llama; se repite A (SALTAR) y el Momento. |
| 3 | B en B7b | Igual que la anterior. |
| 4 | Justo al empezar `p3_salida` | Se conservan H67, `b66_bar#b`, `p3_cambio_H66` y `p3_tarjeta_H67`, y el pin «¿Dónde andabas, gordo?». IR retoma el callejón. |
| 5 | Callejón en walk2 | H67 sigue y no se marcó `b67_salida#a`. La gatera retoma el callejón desde L1. |
| 6 | Despertar a los 3 s | `p3_despierta` vuelve solo. Luego salen CAMBIÓ H67, la tarjeta H68 y `b68_carta#a`, y la cola queda vacía. |

Al final se vieron todos los beats esperados (de `b66_bar#a` a `b68_carta#a`) y H68 queda activa.

## FPS (Chrome sin cabeza con vsync, corrida 2; se excluyen los cuadros a ±350 ms de una captura)

| Escena | fps | p50 (ms) | p95 (ms) | p99 (ms) | cuadros > 50 ms |
|---|---|---|---|---|---|
| Cruce (cine) | 59,9 | 16,7 | 16,7 | 16,8 | 0, más 4 al armar el bar (183–767 ms) |
| Escena A | 60,0 | 16,7 | 16,7 | 16,8 | 0 |
| Momento | 56,6 | 16,7 | 16,8 | 16,8 | 11 (10 en la carga a m = 0; 1 de 700 ms en m≈3) |
| Escena B | 60,0 | 16,7 | 16,8 | 16,8 | 0 |
| Revelación | 60,0 | 16,7 | 16,7 | 16,8 | 0 |
| Callejón | 60,0 | 16,7 | 16,7 | 16,8 | 0 |
| Despertar | 60,0 | 16,7 | 16,8 | 16,8 | 0 (máximo 33 ms) |

Corrida 1, de A en adelante: A 59,5 fps (1 cuadro de 250 ms); Momento 58,4 fps (7 cuadros > 50 ms, máximo 417 ms); el resto a 60 fps sin cuadros largos.

## Consola

- **Todas las corridas** (2 Chromes, unos 15 arranques):
  - 0 errores;
  - avisos de Pixi «textureSource destroyed while still bound»: 11, más 6 de «textureSampler». Salen al cerrar el Momento (`Studio.dispose`, `actor.ts:144` ← `DrunckStage.destroy`, `stage.ts:716`) y en `TexturePool._pruneScreenTextures` en el despertar;
  - avisos de GSAP «target not found»: 20, todos al arrancar.
- **Solo la ruta A, del toque a la Carta**: 3 avisos de Pixi y nada más.
- **Lo que no cuenta**: los avisos de ws y de reenvío de Vite son ruido de mi arnés (ws apagado).

## Entregable para el dueño (fuera del repo)

Carpeta: `<scratch>/qa-pulido/para-el-duenio/`. Son JPG de 2000 px de ancho, con rótulos en español:

- `01-entrada-antes-despues.jpg`;
- `02-cruce-y-escena-A-antes-despues.jpg`;
- `03-momento-drunck-por-secciones.jpg`;
- `04-escena-B-y-revelacion-antes-despues.jpg`;
- `05-callejon-y-Luzterna-antes-despues.jpg`;
- `06-sombras-lado-a-lado.jpg`.

Evidencia:

- `raw/` y `frames/{ruta,ruta2,rm}/`;
- bitácoras `logs/timeline-*.log`;
- resultados `logs/result-{ruta,ruta2,rm,reload}.json`.

## Cómo retomar

1. `restart-vite.sh` levanta Vite en 5671.
2. `node launch.mjs &` levanta Chrome.
3. `node do.mjs s-ruta.mjs <nombre> auto [x rm]` corre la ruta completa.
4. Otros guiones: `s-reload.mjs` (las 6 recargas), `run-taps.sh` (las entradas), `s-sweep.mjs` (el faro), `s-old.mjs <fixture> <prefijo>`.
5. Para las hojas: `cap.mjs` y `mcap.mjs` (capturas), luego `specs/build.mjs` + `compose.mjs`.

**Última actualización**: 2026-10-14 12:30
