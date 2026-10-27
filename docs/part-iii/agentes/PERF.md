# PERF — tirones de rendimiento (Parte III)

- **Qué estoy haciendo**: terminado. Servidores apagados y builds, perfiles y trazas borrados.
- **Hecho**:
  - **Arreglos (código del juego, sin commits):**
    1. `game/src/art/rasterCache.ts`: la WebP de la caché de rásteres se codifica en un worker. En el hilo principal solo queda una instantánea con `createImageBitmap`, y van dos a la vez. Los bytes guardados son idénticos a los de antes (mismo SHA-256). Sin worker u OffscreenCanvas se usa el `toBlob` de antes, en tiempo ocioso y de uno en uno.
    2. `game/src/core/scenes.ts`: después de cambiar de escena, el telón (`blocks`/`iris`) se queda 2 cuadros cerrado, así el primer cuadro pesado pasa tapado. Si la escena publica `coverUntil`, espera además a que esté lista, hasta 1 s como máximo (`COVER_WAIT_MS`).
    3. `game/src/scenes/BattleScene.ts` e `IslandScene.ts` publican `coverUntil`, con dos líneas en cada una. En la batalla: gatos cargados y escena armada. En la isla: gatos cargados.
    4. Probé una pausa tranquila antes del reloj de las películas (`settle()` en `film/index.ts`). En A/B no mejoró nada, así que **la quité**: `film/index.ts` queda como estaba.
  - **Antes/después** (versión de producción propia, A/B intercalado, cuadro más largo **mientras el telón se mueve**, 2 corridas por lado):
    - Batalla: 167–283 ms → 17–33 ms, tanto en primera sesión como al volver.
    - Isla, sesión de quien vuelve: 150 ms → 17 ms.
    - Isla, primera sesión: 33–333 ms → 117–133 ms. Ahí siguen pesando los SVG, que no se pueden evitar sin caché.
    - Carta: 33 → 33. Ya estaba bien; su cuadro pesado de 100–180 ms queda tapado en las dos versiones.
    - Entrada a la isla en primera sesión, CPU del hilo principal en toda la ventana: `toBlob` 374 ms → `createImageBitmap` 58 ms.
  - **Películas:**
    - El tirón de 50–233 ms es un GC mayor de V8. Arranca por «global allocation limit reached»: después del horneado, el montón global (V8 + Blink + lienzos + audio) es mucho mayor que en el último GC. En la primera recolección menor con poca asignación, V8 baja el límite y hace el marcado casi entero dentro de la pausa.
    - Lo agrandan dos condiciones del arnés de QA:
      - El servidor de desarrollo tiene el doble de montón (44 MB contra 16–28 MB).
      - Cada película se abre recargando la página. V8 retiene sus GC unos 7 s después de cada carga, así que el GC cae dentro de la película.
    - En producción, con un recorrido de jugador (título → película):
      - Primeros 3 s de 5 películas × 3 corridas × 2 pasadas: **0 cuadros de más de 34 ms** antes y 1 después (67 ms a 1,8 s, ruido).
      - Recorrido de QA (recarga y película entera), caché caliente: 13 de 14 películas sin ningún cuadro de más de 50 ms.
    - Las películas se ven igual: en `framediff.mjs` la diferencia entre versiones queda al nivel del ruido de la misma versión contra sí misma (0–2,5 %). También con `&rm=1&rf=1`.
  - **Verificación:**
    - `tsc` limpio.
    - `vitest`: 77 archivos; 1007 pasan, 2 omitidas.
    - `verify-missions --all`: 194 OK o dormidas, 0 faltantes.
    - No hay rásteres en el repo.
- **Falta (para otros / decisión):**
  1. **Primera sesión después de cada versión nueva:** la caché de rásteres se invalida por versión (`__BUILD_ID__` en la clave). Por eso, tras cada despliegue, la isla vuelve a decodificar todos los SVG y va a ~15 fps durante 4–6 s. Se arreglaría con una clave por contenido del arte, no por versión. Eso toca el flujo del arte (`rasterCache.ts` + un manifiesto de versiones al compilar), así que no lo hice.
  2. **Isla quieta:** tirón suelto de 183–230 ms. Es un GC mayor de V8 (o del «memory reducer») sobre un montón grande (lienzos de gatos). No se puede elegir su momento desde la página.
  3. Batalla y Carta: el trabajo pesado de entrada sigue existiendo (barcos, `heightfields`, primer render), pero ahora queda tapado. Repartirlo en varios cuadros sería un cambio grande.
- **Cómo retomar**:
  - El arnés está en `<scratch>/perf/pp/` (`<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`):
    - `ftrace.mjs`: traza de una película con cuadros largos, motivos de GC, `CPU=1`, `LATE=`, `COLD=1`, `NET=` y `KEEP=1`.
    - `perf2.mjs`: películas con recorrido de jugador; `NAV=1` usa el estilo de QA.
    - `scenetrace.mjs`: entradas a escenas con el telón real, `NOTRACE=1`, `WARM=1`, `CPU=1 WHOLE=1`.
    - Otras herramientas: `framediff.mjs`, `cacheprobe.mjs`, `encbench.mjs`, `svgprobe.mjs` y `gcseries.mjs`.
  - Versión de producción medible: `cd <scratch>/perf && ./build-prod.sh` y luego `cd game && npx vite preview --config <scratch>/perf/vite.prod.config.ts` (5195). Con `?perf` expone `?film=`, `?save=` y `__film`; el parche existe solo al compilar.
  - Versión «antes»: `PERF_BEFORE=1 PERF_OUT=<scratch>/perf/dist-before ./build-prod.sh`, con los originales en `<scratch>/perf/before/`; se sirve en 5196 con `PERF_OUT=… PERF_PORT=5196`.
  - Resultados en `<scratch>/perf/out/`.
  - **Trampas:**
    - Medir películas en la versión de producción, no en el servidor de desarrollo.
    - El perfil de CPU en traza baja todo a 30 fps: sirve solo para atribuir.
    - La máquina compartida llegó a carga 100–280 (disco al 97 %): siempre A/B intercalado.
    - Nunca `emptyOutDir` con enlaces a `public/` (el script borra a mano).
- **Última actualización**: 2026-10-27, 10:35.
