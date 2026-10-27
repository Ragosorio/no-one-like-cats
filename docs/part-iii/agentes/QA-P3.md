# QA-P3 · QA de punta a punta e integración de la Parte III «Fuera de la Caja» (ronda 4)

> ⚠️ Spoilers de la Parte III. Sin commits, sin push, sin ráster en el repo.

- **Qué estoy haciendo**: **TERMINADO** y entregado al coordinador. Sin commits ni push.
- **Entregables para el dueño**: hojas de contacto en `<scratch>/qa3/para-el-duenio/` (`acto1.jpg`, `acto2.jpg`, `acto3.jpg`, `acto4.jpg` y `final.jpg`, ~2000 px, rotuladas en español) y este informe.

## Resumen (PASA / FALLA)

| Revisión | Resultado |
|---|---|
| 1. Sello de la plantilla con la etiqueta real (S-n, A-n, L-n, P-n…) | **PASA** (arreglado) |
| 2. Cobija de H78 sin elección doble | **PASA** (arreglado y visto en vivo) |
| 3. Suplentes unificados en una tabla (`film/standins.ts`) | **PASA** (arreglado; ver pendientes de retratos) |
| 4. Audio de la Parte II con `CueOpts.at` | **PASA**: los saltos caen donde el código pide; no se revirtió nada |
| Recorrido completo por la interfaz (H69 → H97, encadenando fixtures) | **PASA** después de arreglar 3 bugs ALTOS que lo trababan o se saltaban escenas |
| Todas las películas reales (sin respaldo de guion) | **PASA**: 81 películas de historia y presentación sonaron de verdad |
| Misiones avanzan, tarjetas y «Volver a ver» | **PASA** |
| Recargas (mitad de película, de flujo, de batalla, noche de F33, antes y durante SADIE, duelo) | **PASA**: 13 recargas, 0 trabas, SADIE una sola vez, ningún beat perdido |
| Luzterna nunca viva después de su muerte | **PASA** (tip, NOVEDADES, retratos, faro, Bitácora) |
| Llama de Canelo (60 % desde H85, 30 % al amanecer, gris de noche) | **PASA**: de noche su camarote dice «SIN LLAMA» en gris |
| Partidas viejas (`late-game`, `rupturas-mid`, `post-finale`) | **PASA**: sin nada de la Parte III |
| Rendimiento | **PASA**: 56 películas a 59,8–60 fps con p99 de 16,8 ms; 14 tienen un cuadro suelto de 50–233 ms (ver tabla y pendientes) |
| «Reducir movimiento» y «Reducir destellos» | **PASA** en 11 películas de los 5 tramos |
| Consola | **PASA**: 0 errores y 0 avisos en todo el recorrido; el error `reading 'clear'` se reprodujo y se arregló |
| Ráster / `tsc` / `vitest` / `verify-missions --all` | **PASA** (ver «Verificación») |

## Arreglos (todos chicos; sin commits)

### Los cuatro pedidos

1. **Sello de la plantilla de presentación.** Ya no dice siempre «B-n»: muestra la etiqueta real del nodo (S-3, A-2, L-8, P-6, DESVÍO 1…).
   - `BriefingData.label` (`app/stageIntro.ts`) es opcional y nuevo. Sale de `gateraBattleDef().label`.
   - `stampOf()` en `film/films/plantilla/index.ts`. Si una llamada vieja no trae etiqueta, usa el `code` de la caja más el número.
   - Comprobado en `plantilla_s2`: el sello dice «S-2».
2. **La cobija de H78, sin elección doble.**
   - `playStoryFilm(id, respaldo, onPlayed?, { seen? })` entrega `FilmResult.inputs`.
   - El paso `film` de `actsFlow.ts` acepta `input: { id, flag, values, covers }`. En H78: `inputs.cobija` → `left` = faro (también si nadie toca) y `right` = palmera.
   - Solo si la película **terminó** se guardan `cobija:<valor>` y `b78_cobija`, en el mismo guardado que `b78_doc`.
   - Si la película falta o el jugador salió antes, sale la pregunta como respaldo.
   - **En vivo:** F12 entera, sin pregunta, con `cobija:faro`. Prueba nueva en `tests/acts.test.ts`.
3. **Suplentes en una sola tabla:** `game/src/film/standins.ts` (`STANDINS`). La leen `acto1/kit` (CERITO), `acto2/kit/cast`, `acto3/kit`, `acto3/f23`, `acto4/kit/cast`, `final/props` y el retrato de diálogo de ITŌ (`ui/story/text.ts`).
   - **Cerito = `copito_snowball_cat`**.
     - Ya era su contorno en los Actos I, III y IV y su pelaje en el final.
     - `mochi_bell_cat` es la pintura de Maneki, y F17 lo pintaba como Cerito.
     - `voltio_static_cat` (gafas y arnés) se lee como inventor.
   - **Itō = `kintsugi_tea_spirit_cat`**: sus películas grandes son del Acto II, y la linterna es la seña de ella. Antes era `arcanito_lantern_cat` en el final, F23 y el retrato.
   - **Borrón = `fanguito_mud_cat`** en el final, F23 y F30. F02 conserva `kage_ninja_cat`: ahí la silueta es la sombra de una mano.
   - `nadie_static_cat` no se usa en ninguna película.
4. **Audio de la Parte II con `CueOpts.at`: PASA, sin revertir nada.**
   - Medido en vivo con `rupturas-mid` en `ruptura_bibliotecario` (`when_i_lose.battle`, bucle 6,83–54,83 s). Script: `<scratch>/qa3/pp/p2audio.mjs`.
   - **Arranque** (`battle/music/index.ts:167`): ninguna batalla de `battles.json` usa `startAt`, así que nada cambia. Va por sección (`verse` = 6,86 s) y el mazo suena en 6,9 s.
   - **Vuelta después de un Momento que no termina la pelea** (línea 264, que también pasa `at`): pide el inicio del bucle, 6,83, y el mazo cae en 6,90 en el siguiente compás. Antes arrancaba en 0, en la intro.
   - **Re-cue con reloj interno** (línea 445): se simuló la caída del audio en 16,00. Pide 16,11 y suena en 16,53 medio segundo después. El reloj vuelve a audio, sin bucles. Antes volvía a 0.
   - **`regions/olvidada.ts`:** las capas 2 y 3 entran en 12,08 y 20,07, donde iba la anterior. Antes cada capa volvía a 0.
   - **Extra:** el reloj de los Momentos también pasa `at`. YONOSE TODO retomado en los créditos (`RESUME_DEF`, pre-coro en 138,667 s) cae en 139,09 con m = 0,42: sincronizado. Antes empezaba en 0.
   - 0 errores de consola.

### Bugs que encontró el QA (arreglados)

5. **ALTA · Las actividades dejaban al jugador atrapado en la pantalla final de la batalla.**
   - **Dónde:** H80 (tres arcos), H84 (tres cuentos) y H90 (tres fechas).
   - **Qué pasaba:** al ganar la última pelea nada sacaba al jugador de `BattleScene`. La tarjeta CAMBIÓ y la misión siguiente nunca llegaban.
   - **Reproducción:** `?save=h75-acto2` → jugar hasta H80 → ganar el arco 3. Se queda ahí para siempre (Acto II detenido en H80 y Acto III en H84, más de 10 min).
   - **Por qué no lo vieron las pruebas:** las pruebas reemplazan la batalla por un puerto.
   - **Arreglo** (`app/actsFlow.ts`, `onBattleScene()` / `homeOf()`): se vuelve a la Carta (o a casa) antes de un paso de líneas o de una elección que sigue a una película, y al terminar el flujo. Las elecciones que van justo después de su pelea (H84) se quedan encima.
6. **ALTA · F34 (3/3) «el trazo» nunca sonaba: el golpe mortal del giro.**
   - CINE partió F34 en tres. `finalFlow.ts` pasaba de `f34_golpe` directo a SADIE, sin «…Entonces la luz primero.», «…te mato—», el trazo y «…Ah.». Se vio en vivo.
   - **Arreglo:** paso nuevo `b94_trazo` (también en `FINAL_BEATS.H94`), solo si SADIE no empezó. Una partida vieja que ya pasó SADIE no lo ve después.
   - Su respaldo son las líneas 8–10 de `b94_amanecer`, y solo si F34 (2/3) fue película.
7. **ALTA · Los créditos y «Continuará» de F39 nunca sonaban.**
   - El flujo ponía `f39_recado` y daba por vistos `b96_creditos` y `b96_continuara`. El jugador nunca veía los créditos (con «Antes de la luz») ni el «Continuará.» del contrato (§0.8).
   - **Arreglo:** `b96_creditos` → `f39_creditos` y `b96_continuara` → `f39_continuara`. Sus líneas quedan de respaldo.
   - Títulos nuevos en «Volver a ver»: «Antes del amanecer (III)», «Créditos» y «Continuará».
8. **MEDIA · «Cannot read properties of null (reading 'clear')» al encadenar batallas.**
   - **Reproducción:** `<scratch>/qa3/pp/b2b.mjs`, 28 cambios de batalla a batalla, daba 6 errores de página: `drawLastShot`, `hud.draw`, `speech` → `getGlobalPosition` y `transform.ts` → `set filters`.
   - **Causa:** las corrutinas de la escena vieja seguían después de `destroy()`.
   - **Arreglo:**
     - guardas `this.destroyed` en `scenes/BattleScene.ts` (`enter`, `intro`, `playerTurn`, `enemyTurn`, `playTicks`, `refreshCards`, `drawLastShot`, `speech`);
     - `battle/fx/transform.ts` no toca contenedores destruidos.
   - **Re-prueba:** 0 errores en 63 cambios.
9. **MEDIA · La elección de la cobija en F12 duraba 1,7 s en vez de 3,9 s.**
   - **Causa:** `film/timeline.ts` `placed()` pasaba a tiempo de canción el `when` de cada entrada, pero no el `until`. En una pieza en bucle, el `until` caía «fuera de la edición» y la ventana se cerraba al empezar (46,69–48,40).
   - **Arreglo:** el `until` numérico también se ubica en la edición. Si cruza un borde del bucle, cierra ahí.
   - **Resultado:** F12 queda de 46,69 a 50,60, sin avisos. Prueba en `tests/filmActo1.test.ts`.
10. **MEDIA · SADIE cortada se perdía para siempre.**
    - Pasaba si se cerraba la pestaña durante su carga o a media canción. El beat se guarda antes, a propósito, para que nunca se repita, pero tampoco quedaba en «Volver a ver».
    - **Arreglo:** `film:f35_sadie` se marca en el mismo guardado que `b94_sadie`, solo si la película está registrada.
    - La primera vista sigue sin poder saltarse (`seen: false`). Probado en vivo: cortada en el segundo 40, no se repite y queda listada.
11. **BAJA · «Volver a ver» decía tres veces «Entrenamiento».** Ahora dice «Entrenamiento (1/3)», «(2/3)» y «(3/3)».

**Pruebas nuevas:** `tests/acts.test.ts` (H78), `tests/filmActo1.test.ts` (el `until`) y `tests/final.test.ts` (las películas partidas suenan todas y en orden; SADIE cortada no se repite y queda listada).

## Recorrido por la interfaz

Chrome sin cabeza, escenas, director, flujos, películas, tarjetas y batallas reales.
- **Atajo:** en cada pelea se fuerza la victoria en el primer turno de apuntar, salvo **una batalla real por caja**, jugada con un apuntador de IA por `BattleScene`: B-5 (7 turnos), S-1 (4), A-1 (3), L-1 y P-1, todas ganadas.
- El faro de H92 se tocó con el ratón. Las puertas de las películas («Toca el faro», «Seguir», «Díselo») se tocaron como lo haría un jugador.

| Tramo | Fixture → meta | Duración real | Películas reales | Batallas | Consola |
|---|---|---|---|---|---|
| Acto I | `h69-acto1` → H74 (CAMBIÓ) | 17 min 20 s | 16 | 7 | 0 |
| Acto II | `h75-acto2` → H82 | 22 min 51 s | 25 | 20 | 0 |
| Acto III | `h83-acto3` → H88 | 19 min 56 s | 14 | 10 | 0 |
| Acto IV | `h89-acto4` → H92 | 16 min 36 s | 12 | 12 | 0 |
| Final | `h93-final` → H97 | 14 min 6 s (con los arreglos 6, 7 y 10) | 14 | 2 | 0 |
| **Total H69 → H97** | | **≈ 1 h 31 min** | **81** | **51** | **0** |

- Ninguna película salió por su respaldo de guion. «Volver a ver» lista todas las películas de cada tramo.
- Cada misión avanzó sola: Acto I con 19 tarjetas (PASA/IMPORTA/QUEREMOS/AHÍ y CAMBIÓ); en total, 55 hasta H92 y las del final.
- Elecciones guardadas: `dona:chispas`, `cobija:faro`, los tres finales, `p3_mapa_brecha` y `foto:3`. `p3_final` se puso al cerrar H92 y despertó el final.

## Recargas

- **Final (`relF`, 8 recargas):** a mitad de F31, entre las dos peleas del asedio, en la noche de F33 (40 s), durante F34 3/3 (justo antes de SADIE), **durante SADIE (40 s)**, después de F36, durante F37 y durante los créditos.
- **Acto II (`rel2`, 5 recargas):** a mitad de batalla (S-1), después de una batalla, a mitad de F09, a mitad de F12 y entre la tira 1 y el arco 1 de H80.
- **Resultado:**
  - 0 trabas. La película cortada vuelve a sonar desde el inicio, así que no se pierde ningún beat.
  - La batalla cortada se pierde sin costo y la presentación ya vista no se repite.
  - **SADIE sonó una sola vez** y queda en «Volver a ver». Las dos corridas llegaron a su meta, con el mismo `ext.fin` en el final. 0 errores.

## Luzterna después de su muerte

- **Recorrido del final:** después de SADIE, cada segundo se escaneó todo texto visible fuera de las películas. Nunca apareció su voz ni su placa.
  - El tip es de la BITÁCORA (`luzternaAllowed = false`).
  - El único texto con su nombre es el título de la Carta, «CUADERNO DE FARERA · CAPITANA LUZTERNA · HOJA 1»: es su cuaderno, no su voz (observación).
- **Sonda en la partida terminada** (`<scratch>/qa3/ui/fin-*.jpg`):
  - El faro ya no habla: solo flota el ingreso. Viva, decía «Luzterna está de guardia…».
  - NOVEDADES perdió todas sus líneas «LUZTERNA: …». Quedan dos menciones en tercera persona.
  - La Bitácora tiene «SIN LLAMA» (H93, de su mano) y «Luzterna murió. Cerito eligió ser gato» (del Capi).
  - La tripulación dice «LLAMA 30 %».

## Llama de Canelo

- **En el recorrido:** 95 al comprar Superhéroes, 90 al comprar Anime, **60 % desde H85** (también en `h89-acto4`), 0 («sin llama») en la noche y **30 % al amanecer**, para siempre (`ext.fin.llama 30`).
- **Visible:**
  - carta de tripulación «LLAMA 60 %» / «LLAMA 30 %»;
  - Bitácora «CANELO · LLAMA 60 %» / «CANELO · LLAMA 30 %».
  - **Durante la noche** (guardado real de la partida en `b94_noche`): su camarote sale en gris, «CANELO · SIN LLAMA», y la Bitácora dice «CANELO · SIN LLAMA».
  - Capturas en `<scratch>/qa3/ui/`, por ejemplo `noche-2-tripulacion.jpg`.

## Partidas viejas

- **`late-game`, `rupturas-mid` y `post-finale`:**
  - sin `ext.gateras` ni `ext.fin`;
  - sin misiones, beats ni flags H66+;
  - `cartaAvailable() = false`, sin texto de CAJAS ni nombres de la Parte III;
  - NOVEDADES sin nada nuevo y 0 errores.
- El título sigue en «PARTE II — LA MAREA IMPOSIBLE» donde corresponde.
- Guardar y recargar no agrega nada de la Parte III; los cambios son los de siempre: migraciones, ingresos fuera de línea y parches.

## «Reducir movimiento» y «Reducir destellos»

Script `<scratch>/qa3/pp/flash.mjs`: modo scrub a 30 cuadros/s; salto de luminancia ≥ 20 % entre cuadros y su peor segundo; «movimiento» = diferencia media entre cuadros.

| Película | Normal: saltos (peor/s) · movimiento | Con `rm+rf`: saltos (peor/s) · movimiento |
|---|---|---|
| F06 (120–187 s) | 1 (1) · 4,0 | 0 · 3,6 |
| F08 (0–70 s) | 3 (2) · 6,2 | 1 (1) · 4,2 |
| F09 | 4 (2) · 4,9 | 3 (1) · 2,0 |
| F16 (0–70 s) | 0 · 3,2 | 0 · 2,0 |
| F24 | 1 (1) · 4,0 | 1 (1) · 3,2 |
| F25 (20–90 s) | 0 · 2,2 | 0 · 1,7 |
| F26 | 2 (1) · 6,5 | 1 (1) · 4,4 |
| F29 (40–110 s) | 1 (1) · 4,1 | 0 · 2,2 |
| F31 (tormenta) | **11 (3)** · 3,2 | 0 · 2,5 |
| F32 (tormenta) | 4 (2) · 2,9 | 0 · 2,2 |
| F35 SADIE (60–120 s) | 0 · 1,8 | 0 · 1,4 |

- Con las dos opciones activadas quedan como mucho saltos sueltos (1 por segundo, cortes de escena) y el movimiento baja entre 10 y 60 %.
- **Nota para el dueño:** sin «Reducir destellos», los relámpagos de F31 llegan a 3 saltos en un segundo, justo en el límite de WCAG (no más de 3 destellos por segundo). Está permitido; si se quiere margen, se puede espaciar un relámpago.

## Rendimiento (máquina quieta, sin otros agentes)

- **Condiciones:** Apple M4, Chrome sin cabeza a 1920×1080 con vsync (60 Hz), reloj de audio real y calidad alta. Cada película se midió con un perfil nuevo:
  - **en frío**: navegador sin caché; tiempo hasta que arranca el reloj y los primeros 10 s;
  - **en caliente**: recarga del mismo perfil; tiempo de carga y la película entera.
  - Las puertas se tocaron como jugador, y los cuadros en que la película esperaba se descartaron.
  - Las cargas son del servidor de desarrollo de Vite (transformaciones ya calientes). Una versión publicada cargará distinto.
- Script: `<scratch>/qa3/pp/perf.mjs`. Datos: `<scratch>/qa3/perf.jsonl` y `perf2.jsonl`.
- Seis películas del final (F33, F34 1/3, SADIE, F37, F38 y F40) fallaron en la tanda por un tropiezo del sistema. Una carga se quedó 15 min colgada (2,4 GB de swap). Medidas otra vez, una por una, salieron bien.

**Resumen de las 56 películas:**
- 59,8–60 fps; p95 16,7–16,8 ms; **p99 16,8 ms en todas**.
- Carga en frío: 1,7–6,5 s (el horneado es lo que más pesa: 0,5–5,3 s). Carga en caliente: 1,2–6,0 s.
- **42 de 56** sin un solo cuadro de más de 50 ms en caliente. Las otras 14 tienen **un** cuadro suelto de 50–233 ms.

| Película | Carga en frío (ms) · horneado | Carga en caliente (ms) | fps | p95 | p99 | Máx. (ms) | Cuadros > 50 ms (frío / caliente) | Peor cuadro (caliente) |
|---|---|---|---|---|---|---|---|---|
| f01 | 2235 · 956 | 1699 | 60 | 16,8 | 16,8 | 17 | 0 / 0 | — |
| f02 | 2809 · 1470 | 1534 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f03 | 3301 · 1993 | 2988 | 59,9 | 16,7 | 16,8 | 50 | 1 / 0 | 50 m s en 9.42 s |
| f04_prologo | 1885 · 655 | 1342 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f04_doneria | 1812 · 576 | 1296 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f04_hipomart | 1855 · 628 | 1312 | 60 | 16,8 | 16,8 | 17 | 0 / 0 | — |
| f04_parque | 1860 · 635 | 1271 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f04_bar | 2182 · 915 | 1928 | 60 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f04_epilogo | 1923 · 623 | 1381 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f05 | 3581 · 2336 | 3308 | 60 | 16,8 | 16,8 | 17 | 1 / 0 | — |
| f06 | 6535 · 5250 | 6048 | 60 | 16,7 | 16,8 | 133 | 2 / 1 | 133 m s en 7.82 s |
| f07 | 3570 · 2350 | 3139 | 59,9 | 16,7 | 16,8 | 83 | 1 / 1 | 83 m s en 10.98 s |
| f08 | 4743 · 3164 | 4390 | 59,9 | 16,7 | 16,8 | 167 | 0 / 1 | 167 m s en 11.27 s |
| plantilla_b3 | 1893 · 629 | 1649 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f09 | 3219 · 1996 | 2988 | 59,9 | 16,7 | 16,8 | 67 | 0 / 1 | 67 m s en 11.27 s |
| f10 | 2343 · 1103 | 2072 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f11 | 2647 · 1445 | 1595 | 60 | 16,7 | 16,8 | 50 | 0 / 1 | 50 m s en 8.84 s |
| f12 | 2335 · 1010 | 2062 | 60 | 16,8 | 16,8 | 33 | 0 / 0 | — |
| f13 | 2804 · 1592 | 1744 | 59,9 | 16,7 | 16,8 | 50 | 0 / 0 | 50 m s en 8.02 s |
| f14_1 | 2298 · 1052 | 1388 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f14_2 | 2251 · 1010 | 1397 | 59,9 | 16,7 | 16,8 | 50 | 0 / 0 | 50 m s en 6.15 s |
| f14_3 | 1843 · 607 | 1180 | 60 | 16,8 | 16,8 | 17 | 0 / 0 | — |
| f15 | 3502 · 2272 | 1844 | 60 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f16 | 3770 · 2400 | 3293 | 59,9 | 16,7 | 16,8 | 133 | 0 / 1 | 133 m s en 8.57 s |
| f17 | 3061 · 1733 | 1804 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| plantilla_s3 | 1709 · 472 | 1448 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| plantilla_a1 | 1848 · 615 | 1253 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f18 | 3102 · 1826 | 2892 | 60 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f19 | 3771 · 2338 | 2107 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f20 | 1964 · 691 | 1404 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| h85_oscuridad | 3735 · 2406 | 3255 | 59,9 | 16,7 | 16,8 | 100 | 0 / 1 | 100 m s en 13.38 s |
| f21 | 3223 · 1830 | 2896 | 60 | 16,7 | 16,8 | 17 | 1 / 0 | — |
| f22 | 2016 · 672 | 1400 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f23 | 4717 · 3488 | 4595 | 60 | 16,8 | 16,8 | 50 | 0 / 0 | 50 m s en 14.79 s |
| f24 | 2064 · 809 | 1551 | 60 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f25 | 4311 · 2981 | 3985 | 60 | 16,8 | 16,8 | 50 | 0 / 1 | 50 m s en 6.59 s |
| f25_bisagra | 4458 · 3169 | 4271 | 60 | 16,7 | 16,8 | 17 | 1 / 0 | — |
| f26 | 3512 · 2263 | 3148 | 60 | 16,7 | 16,8 | 17 | 1 / 0 | — |
| f27 | 2505 · 1261 | 1600 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f28 | 3024 · 1782 | 2650 | 59,9 | 16,7 | 16,8 | 83 | 0 / 1 | 83 m s en 4.37 s |
| f29 | 5014 · 3451 | 4776 | 60 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f30 | 5476 · 4237 | 4993 | 60 | 16,7 | 16,8 | 100 | 1 / 1 | 100 m s en 9.83 s |
| f31_luz | 2795 · 1510 | 2550 | 60 | 16,8 | 16,8 | 67 | 0 / 1 | 67 m s en 4.51 s |
| f32_caida | 2579 · 1373 | 2343 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f33_noche | 3753 · 2564 | 3455 | 59,9 | 16,7 | 16,8 | 83 | 0 / 1 | 83 m s en 7.36 s |
| f34_amanecer | 3903 · 2431 | 3272 | 60 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f34_golpe | 5049 · 1304 | 3997 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f34_trazo | 2437 · 1305 | 1389 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f35_sadie | 2341 · 1056 | 1455 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f36_mira | 3293 · 2172 | 2894 | 59,8 | 16,8 | 16,8 | 117 | 0 / 1 | 117 m s en 0.29 s |
| f37_mano | 4733 · 3587 | 4762 | 60 | 16,7 | 16,8 | 33 | 1 / 0 | — |
| f38_vigilia | 4730 · 3486 | 4824 | 60 | 16,7 | 16,8 | 50 | 0 / 0 | 50 m s en 10.71 s |
| f39_recado | 2192 · 985 | 1182 | 59,8 | 16,7 | 16,8 | 233 | 0 / 1 | 233 m s en 29.54 s |
| f39_creditos | 2142 · 910 | 1246 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |
| f39_continuara | 2001 · 895 | 1161 | 59,9 | 16,7 | 16,8 | 33 | 0 / 0 | — |
| f40_ronda | 2671 · 1485 | 2412 | 60 | 16,7 | 16,8 | 17 | 0 / 0 | — |

**Los tirones conocidos que había que confirmar:**

| Película | Lo que se reportó | Medido ahora |
|---|---|---|
| F09 | ~7,5 s | Se confirma uno solo: 67 ms a los 11,3 s (en caliente; en frío, ninguno) |
| F28 | ~6 s | Se confirma uno solo: 83 ms a los 4,4 s |
| F33 | al aparecer | Al aparecer queda en 33 ms (0,3 s); hay uno de 83 ms a los 7,4 s |
| F37 | 67 ms a los 27,8 s | En caliente, máximo 33 ms; en frío, uno de 183 ms al principio |
| F34 (1/3) | 167 ms a los 1,3 s | **No se reproduce**: máximo 33 ms |
| F36 | tirón suelto | 117 ms a los 0,29 s, en los primeros cuadros después del telón de carga; en frío no pasa |

- **Nuevo, a revisar:** **F39 «El recado»** da un cuadro de **233 ms a los 29,5 s**, en el fundido al faro naranja (escena `faro`). Es el momento emocional. Está en `film/films/final/**`, donde trabajan otros agentes, así que queda pendiente y no se tocó.
- **Patrón:** en 14 películas aparece **un solo** cuadro largo entre los 4 y los 14 s (F03 9,4 s, F06 7,8, F07 11,0, F08 11,3, F16 8,6, F30 9,8, H85 13,4…).
  - No está en `__film.slow()`, que registra el JS de cada cuadro por encima de 25 ms. Tampoco está en el calentamiento previo al reloj.
  - Lo más probable es una recolección de basura grande de V8 después del horneado.
  - Queda `<scratch>/qa3/pp/trace.mjs` para confirmarlo con una traza de Chrome. No lo arreglé porque no es chico.

**Escenas principales** (`h89-acto4`, `<scratch>/qa3/sceneperf.json`):

| Escena | fps | p95 | p99 | Máx. | Cuadros > 50 ms |
|---|---|---|---|---|---|
| Arranque hasta el título | carga 0,73 s en frío y 0,70 s en caliente (servidor de desarrollo) | | | | |
| Isla: entrada (primeros 4 s, con el informe al volver y los paneles) | 24 | 150 ms | 200 ms | 200 ms | 21 |
| Isla: quieta (25 s) | 58 | 16,8 | 33,4 | 183 ms (más 100 ms, a los 23 s) | 2 |
| Carta: entrada (`goCajas` → 0,64 s) | 58,6 | 16,7 | 33,3 | 100 ms | 1 |
| Carta: quieta (30 s, 5 cajas) | **60** | 16,7 | 16,8 | 33 ms | 0 |
| Batalla P-9 con turnos reales (40 s) | 59,4 | 16,7 | 16,8 | 267 ms (al entrar) | 2 |

- En el recorrido (4 Chromes a la vez, carga de 20–50) la Carta mostró cuadros de 0,5–1 s. Con la máquina quieta, la Carta queda limpia: son de carga, no del juego.
- La entrada a la isla (paneles, isla e informe) y el par de tirones con la isla quieta (~23 s) quedan anotados como pendientes.


## Consola

- 0 errores, 0 avisos, 0 `pageerror` y 0 peticiones fallidas.
  - **Dónde:** los 5 tramos, el final repetido, las dos corridas de recargas, las partidas viejas, la prueba de audio de la Parte II y las sondas.
  - La consola registró avisos y errores durante todo el recorrido.
- El error `reading 'clear'` se reprodujo (6 errores en 28 cambios de batalla) y quedó arreglado (0 en 63).
- No apareció el aviso de Pixi «textureSource destroyed while still bound».

## Verificación

- `npx tsc --noEmit -p .`: **limpio**.
- `npx vitest run` con la máquina quieta: **74 archivos + 1 saltado; 952 pasan, 2 saltadas, 0 fallan**. Durante el recorrido, con carga 54, `battleMusic` falló una vez por tiempo; sola pasa 23/23.
- `npx tsx scripts/verify-missions.ts --all`: **194 OK o dormidas**, 0 con faltantes.
- `git status --porcelain | grep -iE '\.(png|jpe?g|webp|gif)$'`: **vacío**. Las capturas y hojas viven en el scratch.
- **Limpieza:** perfiles de Chrome borrados y el Vite propio apagado. No queda ningún proceso mío corriendo.


## Pendiente (no se arregló: grande o decisión del dueño)

1. **MEDIA · F39 «El recado»:** un cuadro de 233 ms a los 29,5 s, en el fundido al faro naranja.
   - Repro: `?film=f39_recado&invite=0`, recargar y medir con `perf.mjs`.
   - Está en `film/films/final/**`: queda para quien trabaje ahí.
2. **MEDIA · El arreglo del giro aprobado (F33/F34/F39):** quien lo haga debe saber que `app/finalFlow.ts` ahora reproduce **`f34_trazo`** (paso `b94_trazo`) y **`f39_creditos` / `f39_continuara`** (pasos `b96_creditos` / `b96_continuara`).
   - Si cambian los ids o se juntan películas, hay que ajustar esos pasos y `FILM_TITLES` (`app/stageIntro.ts`).
   - Las pruebas de `tests/final.test.ts` lo vigilan.
3. **BAJA-MEDIA · Un solo cuadro largo (50–170 ms) entre los 4 y los 14 s en 14 películas.** Sospecha: recolección de basura después del horneado. Herramienta lista: `trace.mjs`.
4. **BAJA-MEDIA · Retratos de diálogo distintos de los suplentes de las películas** (fuera de lo pedido; son datos de gatos/arte, así que no los toqué):

   | Personaje | Retrato de diálogo | En las películas |
   |---|---|---|
   | EMIAU | `neon_glitch_cat` | Esquirla |
   | Esquirla | `quizas_maybe_cat` | `neon_glitch_cat` |
   | Cruceta | `supernova_gunslinger_cat` | `storybook_ink_cat`, que es también La Encuadernadora en el Acto III |
   | Borrón | `tintero_ink_cat` | `fanguito` / `kage_ninja` |
   | Homiau | `sol_sunbeam_cat` | `dona_police_cat` en el final y el Acto IV; dibujado en código en el Acto I |

   Conviene sumarlos a `film/standins.ts` cuando llegue el arte aprobado.
5. **BAJA · Cerito en el final:** con un solo suplente, el «Cerito elige pelaje» de F36 lo cuentan el duotono y la ficha «ESPECIE: gato (por ahora)», no un cambio de pintura. Con el arte real hace falta una versión de estática y una con pelo (`STANDINS.cerito` / `final/props` `ceritoGato`).
6. **BAJA · La isla:**
   - al entrar (informe al volver y paneles) va a 24 fps durante unos 4 s;
   - quieta, tuvo un tirón de 183 ms a los ~23 s. Puede ser algo periódico, como guardar o `notePeakIncome`.
7. **Observación · Después de su muerte, la Carta sigue titulada «CUADERNO DE FARERA · CAPITANA LUZTERNA».** Es su cuaderno, no su voz. Lo decide el dueño.
8. **Observación · Sin «Reducir destellos», los relámpagos de F31 llegan a 3 saltos de luz por segundo** (el límite de WCAG).
9. **No cubierto en esta ronda:**
   - el prólogo H66–H69 (`h65-normal`; lo cubrieron QA-PULIDO y QA-PORCION);
   - el balance: las batallas se forzaron salvo una por caja;
   - una escucha con audio real: los relojes de audio se midieron sin cabeza;
   - una batalla con fase que la termina (Itō, EMIAU, Firma) jugada de verdad: queda `realend.mjs` listo.


## Cómo retomar

- `<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`.
- **Vite propio** sin HMR ni `watch`: `cd game && npx vite --config <scratch>/qa3/vite.qa3c.config.ts` (puerto 5733).
  - **Trampa:** sin `watch`, hay que reiniciarlo después de cada cambio de código.
- **Arnés** en `<scratch>/qa3/pp/` (`npm i puppeteer-core@24` hecho). Todos usan `PROF=<dir>` y `PORT=5733`, y borran su perfil.
  - `route2.mjs <fixture> <misión> <etiqueta>`: el recorrido por la interfaz.
    - `REAL=<cajas>` juega de verdad la primera batalla de cada caja.
    - `RELOADS='film:f35@40;beat:b94_ojos;battleEnd:1;scene:BattleScene@3'` recarga en esos puntos.
    - `SAVEAT=<beats>` copia el guardado en esos beats. `SHOTS=1` toma capturas.
    - Bitácoras en `<scratch>/qa3/runs/<etiqueta>.{log,json}`.
  - `perf.mjs <salida.jsonl> ids…`: rendimiento de cada película, en frío y en caliente. `sceneperf.mjs`: escenas principales.
  - `flash.mjs`: destellos y movimiento. `keysheet.mjs`: hojas de contacto.
  - `p2audio.mjs`: el audio de la Parte II. `b2b.mjs`: batallas encadenadas. `oldsaves.mjs`: partidas viejas.
  - `probe.ui.mjs`: llama, Bitácora, NOVEDADES, faro y «Volver a ver». `realend.mjs`: una batalla con fase que la termina, jugada de verdad.

**Última actualización:** 2026-10-27, 06:30.

