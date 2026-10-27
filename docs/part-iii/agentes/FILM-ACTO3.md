# FILM-ACTO3 — películas del Acto III «Lo que está escrito» (ronda 4, oleada 2)

> ⚠️ Spoilers de la Parte III. Nada se commitea ni se publica sin el OK del dueño.

**Qué estoy haciendo:** terminé la oleada. Espero la revisión del dueño y del coordinador.

## Hecho

### Películas

Todas están en `game/src/film/films/acto3/` y se registran con una línea en `film/films.ts`.

| Id | Película | Estilo | Duración | Música | Clics |
|---|---|---|---|---|---|
| `f18` | PP «La Encuadernadora» (H83, L-5) | libro desplegable | 35,5 s | `no_wey.melodia` | 0 |
| `f19` | PH «Lo que se derrama, se termina» (H84) | grabado de Doré con niebla | 75,8 s | `fut.fosa.niebla`, que se corta en la F del FIN | 0 |
| `f20` | PP «El índice» (H85) | expresionismo alemán (las páginas se inclinan) | 32,6 s | `fut.fosa.latido` | 0 |
| `h85_oscuridad` | PH «La oscuridad» (H85, escena B + C1–C3) | acuarela a oscuras → papel negro → ojos de gato | 90,6 s | silencio y efectos (clic de la linterna, pasos de tinta, ronroneo) | 0 |
| `f21` | PH «El plan» + el regreso (R3) (H86) | cuaderno de Leonardo | 115 s | `amb.plan` (90 s); el regreso va en silencio | 0 |
| `f22` | PP «La corrección» (H87) | plano técnico blanco sobre blanco | 44,2 s | `no_wey.nodije` | 0 |
| `f23` | PC No wey «El expediente» + puente (H87, cierra la batalla) | noir de tinta con un solo color | 229,2 s: No wey completa y, con `segue` en c65, `no_wey.puente` | `no_wey` → `no_wey.puente` | 3 (¡REBOTA!, FÓRMENSE, SUBRAYA) |
| `f24` | PP «Señal pirata» (H88, L-9) | la presentación hackeada | 37,5 s | `distor.senal` | 0 |
| `f25` | PC DISTOR «Datamosh» (H88, cierra la batalla) | *datamosh* sobre la acuarela | 122,2 s (c25 → fin) | `distor` (desde `'#24'`) | 2 (¡SUÉLTALO!, ¡BASTA!) |
| `f25_bisagra` | La misma, sin el mapa (Bisagra hace de puerta) | igual | igual | igual | 2 |

- **Reglas del giro aplicadas:**
  - LO QUE ARRIESGAMOS (`acto3/textos.ts`) nunca la nombra y dice con todas sus letras el peligro de Canelo.
  - F23 es el juicio de la tripulación: cinco cargos de esta aventura son de ella y el sexto es de Canelo, que escribe «Culpable.». Desde c45 los dos van lado a lado. En c33,35 La Mano renuncia a la luz y mira a Canelo. El sello «SENTENCIA: LOS OJOS» cae sobre la foto de Canelo.
  - Sin halo, sin rayos desde arriba, nada sobre su cuerpo.
  - En F19 el FIN cae sobre el Lobo, y ella no dice nada de sí misma.
  - La oscuridad de H85 cuenta su valentía, no su fragilidad: tiembla porque tiene miedo.

### Motor

Cambios chicos y compatibles; CINE es el dueño del núcleo.

- `FilmDef.segue` (`film/types.ts`, `film/timeline.ts` `segueOf` y validación, `film/index.ts`) y `RunOpts.segue` (`momentos/runner.ts`, solo el `AudioDriver`): una película cambia de pista en un compás sin costura. Alguien más le agregó después la referencia canónica (`canon(sg.ref)`). Sin `segue`, nada cambia.

### Estilos nuevos

- Archivos: `film/styles/libros.ts` y `libros.catalog.ts`.
- Ocho estilos: `libros`, `popup`, `dore`, `expresionismo`, `tecnico`, `tinta`, `pirata` y `datamosh`.
- Siete tratamientos en `CAT_BAKES`: `libros`, `recorte`, `grabado`, `caligari`, `tecnico`, `tinta` y `senal`.
- Herramientas: `engrave()` (grabado de Doré desde cualquier composición) y `moshFilter()`/`setMosh()` (el *datamosh*, con una zona limpia donde cae la luz y una pared).
- Documento: `docs/part-iii/cine-v2/05-estilos-libro.md` y §19 de `02-api.md`.

### Kit del acto y plantilla

- Kit en `films/acto3/kit/`: `BookFrame`, `Printed` (en Libros se habla en texto), `Bitacora`, Luzterna y su haz, la llama de Canelo, Cerito de estática, La Mano, Garbancito, Esquirla, `demoShot` y `demoFalls` (tiros reales de `battle/demo.ts`), `filmDuck` y `prewarm`.
- Piel de la Biblioteca para la plantilla de FILM-ACTO1: `registerBriefingSkin('p3d_libros', …)` y `films/acto3/plantillaFondo.ts`.

### Pruebas

- `game/tests/filmActo3.test.ts`: 9 pruebas en verde.

### Suplentes (arte nuevo sin aprobar)

| Personaje | Suplente |
|---|---|
| Cerito | `copito_snowball_cat` con estática (nunca `nadie_static_cat`) |
| La Mano | `tachon_strikeout_cat` pálido, con la mano blanca y la uña-plumín dibujadas en código |
| La Encuadernadora | `storybook_ink_cat`, con agujas de bigote y el carrete en código |
| Garbancito | `guijarro_pebble_cat` diminuto, con el pañuelo rojo en código |
| Esquirla | `neon_glitch_cat`, con el visor roto y el brazo de *glitch* en código |
| Harry Gatter | `nekomante_grimoire_cat`, con lentes redondos en código |
| Murciégato y Gato Araña (sus ojos en la oscuridad) | `kage_ninja_cat` y `sombrita_shadow_cat` |
| La Gatoconda | `polvillo_dust_cat` en un retrato oval |
| El Canelo de otra caja | `canelo_admiral_cat` |
| El Lobo | **dibujado en código** (camisón, gorro de dormir, dientes) y grabado con `engrave()` |
| La flota de los Correctores | dibujada en código |

Brecha, Bisagra, Hipólito, Luzterna y Canelo usan su pintura de siempre, con el tratamiento de cada estilo. No hay raster en el repo.

### Verificación

- **Rendimiento a 60 Hz** (M4, Chrome sin cabeza a 1920×1080, calidad alta, reloj de audio real; otros agentes corrían Chrome al mismo tiempo):
  - Todas van a 59,8–60 fps, con p95 de 16,7–16,8 ms y p99 de 16,8 ms.
  - Hubo tirones sueltos de 50 a 330 ms, pero **cambian de lugar entre corridas** (ruido de la GPU compartida). Con escaneo cuadro a cuadro, ningún tirón se reprodujo en el código del set (el JS del set de F25, el más pesado, gasta unos 5,5 ms por cuadro).
  - Mejores corridas sin un solo cuadro de más de 33 ms: F20, F21 (115 s), F24 y F25 (122 s).
  - F22 tuvo uno de 33 ms.
  - **F23 (229 s, con el `segue` en c65 en audio real):** solo uno de 50 ms a los 0,25 s (todavía en el fundido desde negro) y uno de 33 ms. El reloj siguió en audio durante el cambio de pista, sin congelarse.
  - Detalle en `<scratch>/fa3/perf1.txt` y `perf2.txt`.
- **«Reducir movimiento» y «Reducir destellos»** (`&rm=1&rf=1`) revisados en F20, F23, F24, F25 y la oscuridad:
  - las páginas no se inclinan;
  - la pantalla partida de F25 pasa a fundido cruzado;
  - los bloques del *glitch* se deslizan en vez de parpadear;
  - los ojos se encienden en fundido;
  - las cámaras van calmas.
- `tsc` limpio. `vitest`: la suite completa pasa (948, más 2 omitidas). Hubo un aviso de tiempo del *worker* de vitest por la carga de la máquina; no es una prueba que falle.
- **Hojas de contacto** (JPG): `<scratch>/fa3/final/<id>/sheet.jpg` y `<scratch>/fa3/rmrf/<id>/sheet.jpg`.
- Perfiles de Chrome borrados. Vite detenido.

## Falta

1. **Para MECÁNICAS-IMPL** (`app/actsFlow.ts`):
   - `h85_oscuridad` ya incluye la grúa de luz y el barco (C1–C3: «Luz… ¿ya llegamos?» / «Ya, gordo. Duérmete.»).
   - `f21` ya incluye el regreso (G1–G4, R3: «¿Qué quería?» / «Tus ojos. Le dije que no.» / «Yo vigilo.»).
   - Las líneas `L('b85_grua')` y `L('b86_regreso')` que siguen a esas películas las repetirían: conviene que solo salgan como respaldo si la película no está.
2. **Para MECÁNICAS:** `battle/demo.ts` solo calcula `mareo`, `donas` y `botellas`. Las reglas de Libros (Capítulos, Corrección, Esquirlas) se muestran con un tiro real del simulador más su efecto dibujado; «La biblioteca se derrumba» usa las caídas de `botellas` (la misma física). Cuando existan las reglas en el simulador, se pueden calcular de verdad.
3. **Para ARTE:** las pinturas nuevas (La Encuadernadora, El Lobo, Garbancito, Esquirla, Harry Gatter, Murciégato, Gato Araña, La Gatoconda) reemplazarían a los suplentes de la tabla de arriba, cambiando solo `STAND` en el kit (y quitando el Lobo dibujado en código de F19).
4. **Pulido posible:**
   - el Lobo dibujado es tosco;
   - Garbancito se ve muy chico en los planos generales;
   - Canelo «abre un ojo» como dos (el puppet no cierra un solo ojo).

## Cómo retomar

- Vite propio: `cd game && npx vite --config <scratch>/fa3/vite.fa3.config.ts` (puerto 5661, sin HMR).
- Herramientas: `<scratch>/fa3/pp/`. Antes hay que correr `npm i puppeteer-core@24` ahí (se borró para ahorrar disco). Usar un solo perfil por herramienta (`PROF=<scratch>/fa3/prof-x`) y borrarlo al terminar.
  - Hoja de contacto (JPG): `node sheet.mjs <salida> "film=f23&scrub=1" t1 t2 …`.
  - Escaneo cuadro a cuadro de un tramo: `node scan3.mjs "film=f25&scrub=1" 28 32`.
  - Rendimiento: `CAP=1 node run.mjs "film=f23&seen=1&invite=0"`.
  - Todas en fila: `perfall.sh`.
  - Errores de consola: `node errs.mjs "film=f25&scrub=1" 20`.
- Hojas de contacto: `<scratch>/fa3/<id>/sheet.png`.
- `<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`.
- Trampas:
  - Pixi compila GLSL ES 1.0: no se indexan arreglos con variables y una variable no puede llamarse `step`.
  - Otros agentes editan `styles/index.ts`, `catalog.ts` y `films.ts` al mismo tiempo: después de editar, revisar que la línea propia siga ahí.
  - Un `Printed` en pantalla debe recibir alfa 0 fuera de su escena: si solo se pone `visible`, su `update` lo vuelve a mostrar.

**Última actualización:** 2026-10-27.
