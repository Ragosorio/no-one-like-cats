# QA-FINAL · última revisión antes de publicar la Parte III «Fuera de la Caja»

> ⚠️ Spoilers de la Parte III. Sin commits, sin push, sin publicar (eso lo hace el coordinador). Sin ráster en el repo.

- **Qué estoy haciendo**: **TERMINADO** (2026-10-27). Veredicto: **GO**, con los 2 arreglos de abajo incluidos en lo que se publique.

## Resumen

| Revisión | Resultado |
|---|---|
| 1. Estático | **PASA**: `tsc` limpio · `vitest` 77 archivos + 1 saltado, **1007 pasan, 2 saltadas** · `verify-missions --all` **194 OK/dormidas, 0 faltantes** (también después de los arreglos) |
| 2. Compilación de producción | **PASA**: como en CI, 0 ráster en `dist`, `dist` 278 MB, sin rutas de desarrollo; repo sin ráster ni archivos > 20 MB |
| 3. Partidas viejas y juego nuevo | **PASA**: 23 fixtures sin errores ni pérdidas; H66 se abre en una Parte II terminada; NOVEDADES bien; juego nuevo sin nada de la Parte III |
| 4. Ruta por la interfaz real | **PASA** después de 2 arreglos (un bloqueo suave en la Carta y errores al salir de ella mientras anima) |
| 5. Rendimiento (producción) | **PASA**: películas a 60 fps (p99 16,8 ms, máx. 17 ms); Carta y batalla limpias; la isla de la primera sesión tras una versión nueva va a ~29 fps unos segundos (ya conocido) |
| 6. «Reducir movimiento» + «Reducir destellos» | **PASA**: F31 (tormenta) y una batalla jugada por la IA, 0 errores |

## Hecho (con evidencia)

### 1. Estático
- `npx tsc --noEmit`: limpio.
- `npx vitest run`: 77 archivos + 1 saltado; 1007 pasan, 2 saltadas, 0 fallan. Repetido dos veces después de los arreglos: igual.
- `npx tsx scripts/verify-missions.ts --all`: 194 OK o dormidas, 0 con faltantes, 0 sin evaluador.

### 2. Compilación de producción
- **Como en CI:** `VITE_ART_BASE=` y `VITE_ART_BASE_FULL=https://ragosorio.github.io/nolc-arte/` (la variable de hoy). Compila en 7,7 s y deja fuera de `dist` los 160 SVG completos.
- **`dist`:** 278 MB (assets 16 MB, `cats-svg` lite 151 MB, música 110 MB), 1025 archivos. Límite de Pages: 1 GB.
- **Ráster en `dist`** (png/jpg/jpeg/webp/gif/avif/mp4/webm/mov): 0.
- **Sin fugas:** 0 apariciones de `__perfMods`, `has('perf')`, `__scenes`, `__gsap`, `installDev`, `__film`, `film/dev`, `momentos/dev`, `localhost` ni rutas del scratch.
  - `test-saves` solo sale en el texto de ayuda del laboratorio `?dev=1`, que ya existía.
  - `?scene=caja` y `?scene=cajas` están detrás de `import.meta.env.DEV`.
- **Guardia de CI `art-publish check`:**
  - Con la base de hoy: **OK** (160 revisados; 38 completos pendientes = los gatos nuevos quedan en lite hasta activar `nolc-arte-2`).
  - Con las dos bases: **falla** (`nolc-arte-2/art-manifest.json` da 404) hasta que `nolc-arte-2` publique. Por eso el paso 4 de `ARTE-INTEG` va después del 3.
- **Repo** (`game/` y `docs/`, 1668 archivos con y sin seguimiento): 0 ráster, 0 archivos de más de 20 MB.

### 3. Partidas viejas y juego nuevo
- **23 fixtures anteriores a la Parte III:** `late-game`, `post-finale`, `post-story`, `rupturas-mid`, `rupturas-fin`, `rupturas-o4`, `h65-normal`, `casino-v1`, `casino`, `isla-m2`, `m2-*` ×4, `post-boss1/2/3`, `pre-boss3`, `rupturas-h44`, `rupturas-mid-v1`, `rupturas-o3`, `rupturas-raro` y `zone2-par`.
  - 0 errores de consola.
  - Gatos y hábitats iguales al cargar y tras la ida y vuelta del guardado (recarga sin `?save`). Oro, gemas y `playMs` nunca bajan.
  - Ninguna recibe `ext.gateras`, `ext.fin`, beats, flags ni gatos de la Parte III; `cartaAvailable() = false`.
  - Datos: `<scratch>/qa-final/shots/old/oldsaves-all.json`.
  - `rupturas-mid`, `rupturas-mid-v1` y `rupturas-fin` bajan a 117 misiones hechas: es el reinicio de la Parte II (`2026-10-rupturas-reinicio-v2`, publicado el 15-10), no algo nuevo.
  - `rupturas-raro` trae inventadas `H77` y `b77_inventado`; como ahora H77/H78 existen de verdad, se activa H78. No pasa con partidas reales. Conviene cambiar esos ids de la fixture (H199/b199) más adelante.
- **El candado de `playMs`:** `game.ts`, `migrate.ts`, `save.ts`, `patches.ts`, `vault.ts` y `saveGuard.ts` no cambiaron contra HEAD. La Parte III no registra parches.
- **Partida como la del dueño** (`h65-normal`, con todas las NOVEDADES vistas menos la nueva):
  - H66 se activa sola al cargar (disparador `mission:H65`). El título dice «PARTE III — FUERA DE LA CAJA».
  - **NOVEDADES** `2026-10-27-fuera-de-la-caja`: completa y sin desbordes (`__overflow`: 0 fuera, 0 encimados), en 1600×900 y en 1000×1000. Sale después del Diario del Mar.
  - **«2 VERSIONES NUEVAS»** (Cuernos de tinta, Pelea de acordeón): aparece unos 2,4 s después de abrir NOVEDADES y dura unos 3,4 s, justo encima del panel. En 1600×900 roza su borde superior, pero no tapa «NOVEDADES» ni el título. Antes, en el título, sale «NUEVA VERSIÓN: El Archivo».
  - Capturas: `<scratch>/qa-final/shots/nov/`.
- **Juego nuevo** (perfil vacío, sin `?save=`, pedido del coordinador):
  - Recorrido: título → JUGAR → prólogo (con el disparo cargado) → nombre, género, perro y «DEJAR "CANELO"» → isla con H01–H02 hechas.
  - 0 errores. Sin `ext.gateras`, sin Carta y sin H66; 0 gatos de las cajas en el Catdex, ni visibles (`dexVisible`).
  - Capturas: `<scratch>/qa-final/shots/new3/`.

### 4. Ruta por la interfaz real
**Cómo:** `route3.mjs`, a partir del `route2` de QA-P3.
- Se tocan con el ratón: el IR de la isla, el nodo en su posición real en pantalla, la tarjeta, «¡A LA CAJA!», los botones, las puertas de las películas, el candado de Maneki y el faro.
- Si algo no responde, se anota como `FALLBACK`.
- En cada llegada a la Carta: una auditoría (nodos por caja abierta, «aquí no he llegado», rutas entintadas) y un toque de prueba por caja.
- Una batalla real por acto, jugada por la IA.

| Tramo | Duración | Películas | Batallas (real) | Consola | Respaldos por código |
|---|---|---|---|---|---|
| Acto I `h69` → H74 | 20 min | 16 | 7 (B-5, ganada en 11 turnos) | 0 | 1, del arnés (ver abajo) |
| Acto II `h75` → H82 | 27 min | 25 | 22 (S-1 y A-1, ganadas) | **1 `pageerror`** → bug 1 | 1, del arnés (`eestambre`, repetido aparte: PASA) |
| Acto III `h83` → H88 (con los arreglos) | 21 min | 14 | 12 (L-1, ganada en 4 turnos) | 0 | 0 |
| Acto IV `h89` → H92 | 18 min | 13 | 12 (P-1, ganada en 7 turnos) | 0 | 0 |
| Final `h93` → H97 (con los arreglos) | 14 min | 14 | 2 | 0 | 0 |

- **La Carta:** cada caja abierta dibuja sus nodos:
  - Borracha: 10 → 12 nodos.
  - Superhéroes, Anime, Libros y POP: 9 cada una, más `eestambre` (10).
  - «Aquí no he llegado» solo en cajas cerradas. La excepción es el segundo y medio que dura la animación de compra, antes de que se encienda la caja.
  - Rutas entintadas: 4/8 → 8/8 en el Acto I, 36 → 47/47 en el Acto IV.
  - Tarjetas tocadas con el ratón en las 5 cajas: B-5, la Ronda, B-6, S-1, S-4, A-1, A-4, L-1 y P-1, entre otras.
- **Películas con el arte real** (lo que pidió cada una al servidor):
  - F05: EMIAU, Bocina y Scratch. F08: Murciégato, las 4 variantes de Gato Araña, El Gritito, Gatzilla y Comecroquetas. F09: Doctor Ovillo. F10: El Estambre. F13: Super Siamés y Bigotón. F15: Itō. F18: La Encuadernadora. F19: Lobo y Garbancito. F21: Gatoconda. F25: Harry Gatter. F26: el mánager. F29: Gato Malo, Tailor Swift y EMIAU. F30: Maneki y Homiau. F37: Borrón.
  - **Cerito:** `cerito_static_cat` en F02, F12, F18, F27 y F31. `cerito_fur_cat` aparece por primera vez en **F36**.
  - Ninguna película salió por su respaldo de guion. 0 arte 404.
- **Gatos de las cajas:** llegan con su sello, por ejemplo «¡OFICIAL DONA SE UNE!», «¡HOMIAU GATSON SE UNE!», «¡DOCTOR OVILLO SE UNE!», «¡HARRY GATTER SE UNE!», «¡BOCINA SE UNE!» y «¡TAILOR SWIFT SE UNE!».
  - Al final del Acto IV hay 18 registrados en el Catdex.
  - En cada tramo, 0 en el Casino (`eligibleCats`), el Portal (`ratesTable`) y la Resonancia (400 parejas de `oddsFor`).
- **El final:**
  - F31 → F32 → F33 (Canelo «sin llama») → F34 (amanecer, golpe y trazo; llama 30) → F35 SADIE → F36 MIRA → F37 La Mano → F38 → F39 recado → créditos → **«Continuará»** (el lápiz escribiendo, en silencio) → F40.
  - Luzterna no aparece viva en ningún texto después de su muerte (se escaneó cada segundo). El fantasma es «BITÁCORA», con `allowed: false`. `ext.fin`: `{llama 30, linterna estante, faro naranja}`.
- **Respaldos del arnés** (no son bugs del juego):
  - Acto I `eemiau`: la cámara se movía y el toque abrió B-8, cuya tarjeta tapó el nodo.
  - Acto II `eestambre`: el arnés se adelantó antes de que la Carta redibujara.
  - Se corrigió el arnés y se repitió `h75` → b76 por la interfaz: `eestambre` aparece (○), se toca, sale su tarjeta y ¡A LA CAJA!. 0 errores.

### 5. Rendimiento (compilación de producción con `?perf`, 1920×1080, vsync)
- **Escenas** (`h89-acto4`; datos en `<scratch>/qa-final/logs/scenes-prod3.json`):

  | Ventana | Primera sesión tras versión nueva: fps · p95 · p99 · máx. | Sesión de vuelta: fps · p95 · p99 · máx. |
  |---|---|---|
  | Isla, entrada (6 s, con avisos) | 29,2 · 133 · 167 · 200 ms | 54,7 · 16,8 · 33,4 · 150 ms |
  | Isla, quieta (10 s) | 56,8 · 33,3 · 33,4 · 33 ms | 57 · 33,2 · 33,4 · 33 ms |
  | Carta, entrada (5 s) | 59 · 16,8 · 16,8 · 100 ms | 58,6 · 16,8 · 33,3 · 100 ms |
  | Carta, quieta (8 s) | 59,4 · 16,8 · 16,8 · 100 ms | 60 · 16,8 · 16,8 · 17 ms |
  | Batalla, entrada (de −1 a +8 s) | 59,6 · 16,7 · 16,8 · 83 ms | 59,8 · 16,7 · 16,8 · 50 ms |

- **Películas** (`perf2.mjs`, recorrido de jugador; `<scratch>/qa-final/logs/films-prod.jsonl`):
  - **F08** (9 gatos nuevos): carga 6,3 s en frío (horneado 5,0 s) y 1,8 s en caliente.
  - **F36**: 2,8 s / 0,8 s. **F19**: 3,7 s / 1,2 s.
  - Las tres a **60 fps, p99 16,8 ms y máx. 17 ms**, en frío y en caliente; 0 cuadros de más de 34 ms.

### 6. Accesibilidad
- Con `reduceMotion` y `reduceFlashes` activados (comprobado en `settings`): F31 «Se acerca una luz» completa y el asedio 1 jugado por la IA (ganado en 4 turnos). 0 errores.

## Bugs

1. **BAJA-MEDIA · ARREGLADO · Errores al salir de la Carta mientras anima.**
   - **Qué pasaba:** el sello de victoria, la ruta que se entinta y la caja que se abre siguen después de `exit()`.
   - **Consecuencias:**
     - Al tocar ISLA o DIARIO DEL MAR mientras se entinta la ruta: `Cannot read properties of null (reading 'clear')`, desde `inkRoute` → `onUpdate`. Se vio en el Acto II.
     - Al salir justo después de PAGAR a Maneki: **58 errores** `reading 'set'` (`applyCam` del tween de cámara de `gateraOpens`). Además habría arrancado la música de la caja fuera de la Carta.
   - **Arreglo:** guardas `this.destroyed` en `game/src/scenes/GaterasMapScene.ts`:
     - `gateraOpens`: `gone()` (l. 1295–1300), que marca `gatera_<caja>` igual; se revisa en las l. 1302, 1315, 1320 y 1344.
     - `afterBattle`: l. 1370–1374.
     - `inkRoute`: `onUpdate` l. 1412, `onComplete` l. 1421.
   - **Repro antes / después** (`pp/repro-ink.mjs`, `pp/repro-buy.mjs`; 5197 con el código viejo en caché, 5198 con el nuevo):
     - Antes: 1 error y 58 errores.
     - Después: 0 con ISLA y con DIARIO DEL MAR, y 0 al comprar con esperas de 0, 0,7, 1,4 y 2,2 s. La caja queda comprada.
2. **MEDIA · ARREGLADO · Nodo abierto que la Carta seguía mostrando BLOQUEADO.**
   - **Qué pasaba:** si una misión se cumplía estando en la Carta, el nodo seguía como bloqueado. H84 (tres cuentos) y H86 se cumplen con escenas sobre la Carta; L-6 pide `mission:H84` y L-7 pide `mission:H86`.
   - **Síntoma:** el modelo decía «open» y la escena «locked». La tarjeta de L-7 decía «BLOQUEADA · Gana la etapa anterior para entrar aquí» con «No, wey» activa (`<scratch>/qa-final/shots/l7-stale.jpg`). El jugador tenía que salir y volver.
   - **Arreglo:** `GaterasMapScene.update()` (l. 1486–1497): si cambia el estado o la frontera de un nodo, `refresh()`.
   - **Comprobado:** con el Acto III repetido, L-6 y L-7 se abren solas y se tocan por la interfaz.

**Abiertos (menores, no bloquean):**
- **BAJA · Carta en vista general (CARTA) a 1600×900:** la columna de misiones fijadas tapa casi toda la caja de Superhéroes (arriba a la izquierda), y en Anime los nodos ganados (azul sobre azul oscuro) casi no se ven; solo las palomitas rojas. Con la cámara enfocada (IR o al tocar la caja) se ve bien.
- **Observación · `rupturas-raro`:** sus ids inventados H77/b77 ya chocan con la Parte III. Es una fixture de prueba.

## Lo que el dueño debe saber al jugar
- Con la variable de hoy, los 38 gatos nuevos se ven en lite (nítidos, pero no al máximo) hasta activar `nolc-arte-2` (pasos 2–5 de `ARTE-INTEG`). No pongas la variable de las dos bases antes de que `nolc-arte-2` publique: el deploy fallaría en la guardia.
- La primera vez que abras el juego tras la actualización, la isla va a ~29 fps unos 4–6 s (vuelve a decodificar los gatos por la versión nueva). Después va a 55–60.
- Al entrar verás el Diario del Mar, luego NOVEDADES («PARTE III · Fuera de la Caja») y un aviso «2 VERSIONES NUEVAS» de unos 3 s arriba del panel.
- H66 aparece sola. La primera presentación de cada nodo no se puede saltar; las siguientes sí.

## Cómo retomar
- `<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`. Mi carpeta: `<scratch>/qa-final/`.
  - `pp/`: arnés. `shots/`: capturas. `runs/`: bitácoras de la ruta, `<tramo>.log/.json` y `shots-<tramo>/`. `logs/`: salidas.
- **Vite propio:** `<scratch>/qa-final/rv.sh` (5197, sin HMR ni `watch`; reiniciarlo tras cada cambio). `vite.qaf98.config.ts` es lo mismo en 5198. Producción con `?perf`: `perf/build-prod.sh` y luego `vite preview --config perf/vite.prod.config.ts` (5198).
- **Arnés:**
  - `route3.mjs <fixture> <misión|beat:x> <etiqueta>`, con `PORT`, `REAL=`, `REALFIRST=1`, `A11Y=1`, `SHOTS=1` y `PROF=`.
  - `oldsaves.mjs`, `novedades.mjs`, `newgame.mjs`, `repro-ink.mjs`, `repro-buy.mjs`, `scenes2.mjs`, `perf2.mjs`.
  - `attach.mjs <prof> <expr>`: evalúa en un Chrome del arnés que ya esté corriendo.
- Servidores apagados; perfiles de Chrome y compilaciones borrados.
- **Última actualización**: 2026-10-27 12:55.
