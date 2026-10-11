# QA-RECORRIDO

## Qué estoy haciendo
**Terminado** (2026-10-10, 19:15). Visto bueno de la Parte II con el alcance reducido que pidió el dueño (ver abajo).

## Alcance (cambio del dueño, 2026-10-10 ~18:20)
El dueño y sus jugadores de prueba son el QA definitivo. Mi encargo se redujo a una **revisión rápida de la Parte II**:
que todo esté en su lugar, sin errores visibles y sin que vuelvan errores ya vistos (texto cortado/desplazado o que
no cabe, capas que no cubren pantallas que no son 16:9, paneles encima de otros, pantallas que quedan debajo de una
batalla, toasts duplicados, avisos de consola, textos equivocados, `constructor.name`, cosas del cielo que tapan
islas), más build + smoke en `vite preview` y borrar `game/dist`.

**Fuera de alcance por decisión del dueño** (no son pendientes):
- Jugar a fondo la Oleada 4 batalla por batalla (igual quedó jugada H62→H65, ver Hecho).
- Rendimiento en sesión larga y caza de fugas (hay una medición, ver «Hallazgos para otros»).
- Recorrido completo de la Parte I (se abrió con `late-game` e `isla-m2`; basta).
- `npm test` completo (lo corre el coordinador).

## Hecho
- **Oleada 4 por la interfaz real:** H58–H61 (sesión anterior) y H62→H65 en esta: cine `h62_correctores`, región
  Umbral (LA PUERTA, EL BORDE, LA FLOTA BLANCA, LOS GRAFITIS, ¡A PELEAR! en la insignia y en la puerta), batallas
  H62 y H63 (con sonda: H62 entra a EL PLAN en el turno 2; H63 llega a la capa 4/4), cine `h64_pagina`, TOCA EL
  FARO → «¿Qué escribes?» → final de respaldo → créditos hasta la ficha → `oleada4_fin` y epílogo con la página.
  Después: Sueños (veleta, capitana, ballena), Olvidada en color, Umbral vacío, carta «Las Fronteras», VOLVER A VER.
  Solo variaciones/remixes/amb fuera de los Momentos.
- **Parte I:** `late-game` (perfil, NOVEDADES, carta sin hojas de la Parte II, batalla 6-1 y resultados, H09) e
  `isla-m2` (informe, explicadores, batalla con derrota y REINTENTAR). Sin errores.
- **Ventanas que no son 16:9** (1200×900 y 2000×800): isla, carta, VOLVER A VER, Catdex, Momento a pantalla
  completa, región 3D.
- **Build + smoke en `vite preview` (puerto 5323):** portada, informe de regreso, isla con la página junto al faro
  (el arreglo de `constructor.name` funciona minificado), carta, región Sueños, batalla 6-1. Consola limpia (solo
  `favicon.ico` 404). `game/dist` borrado.
- **typecheck** limpio · **verify-missions --all**: 162 OK, 0 faltantes · pruebas de lo tocado: `minifySafe`,
  `catQuery`, `catReactivity`, `oleada2Cine` (20/20).
- **Arreglos (sin commit):**
  - `regions/olvidada/picker.ts`: nombre del gato escalado a la tarjeta («EL BIBLIOTEC»). Edición revisada, completa.
  - `panels/Replays.ts`: VOLVER A VER con ~50 escenas se salía del panel → `ScrollBox`.
  - `scenes/MapScene.ts`: (1) el listón del nombre de la isla también se puede tocar (el de «La Isla que Nadie
    Recuerda» no hacía nada); (2) IR de una misión «gana en la zona N» estando en la carta desliza a esa zona (antes
    reabría MISIONES en bucle); (3) la cabecera «Diario del Mar» y los botones ENCARGOS/CARTA se anclan a la
    pantalla real (en 4:3 flotaba a media pantalla con la carta encima; en panorámica terminaba antes del borde).
  - `scenes/RegionScene.ts`: el subtítulo de la placa de región ya no toca el título.
  - `app/story.ts › maybeIntro`: NOVEDADES ya no se abre encima de un diálogo que arrancó en el hueco tras el informe.
  - `ui/story/nameCat.ts`: en «¿CÓMO TE LLAMAS?» la casilla del nombre baja si el subtítulo ocupa dos líneas (tapaba
    «…O muy tonto.»).
  - `panels/collection/CatCard.ts`: el nombre de la carta ya no pisa la rareza («POLVILLO» sobre «COMÚN»; Catdex y
    SET COMPLETO).
  - `main.ts › loadFonts`: precarga la cursiva de Playfair: en producción la primera cursiva se medía con la fuente
    de reserva y cortaba la última palabra («…En todos tus suéter», «…del incidente del vaso»).
  - `ui/story/offline.ts`: la segunda línea de «Los Doblones esperan en los hábitats» ya no queda bajo la foto.
  - `scenes/BattleScene.ts`: la ayuda «…DISPARAR · 1-7 ELIGE GATO…» sube sobre las cartas (7 gatos la tapaban).
  - `scenes/TitleScene.ts`: con una partida en la Parte II la portada dice «PARTE II — LA MAREA IMPOSIBLE» (decía
    «CAPÍTULO 1 — EL PRIMER MAR»).
  - Antes: `ui/story/o4Pagina.ts` sin `constructor.name` (+ `tests/minifySafe.test.ts`), `ui/story/o2Cines.ts`
    h45_registro (cámara), timeouts de pruebas pesadas.

## Falta
- Nada de mi encargo. **Re-verificación hecha (coordinador, 2026-10-10):** CIRCUS MALUS y YONOSE TODO se probaron en el flujo real por sus agentes (H62 con `rupturas-o4`; H64→H65 con la misión aplicada una sola vez); suite completa 542/542 dos veces, typecheck, verify-missions 162 OK y smoke de producción limpio. Nota original: re-verificar los Momentos CIRCUS MALUS (H62) y YONOSE TODO (H64→H65) cuando sus agentes
  terminen (hoy el final de respaldo funciona; durante la revisión ya vi el Momento de YONOSE TODO entrando por
  VOLVER A VER › Créditos, a pantalla completa en 4:3, sin errores).

## Hallazgos para otros
- **Memoria (no es de mi alcance ya):** sesión larga isla ↔ carta ↔ 8 regiones ↔ batallas, ×3 (48 cambios de
  escena): el heap tras GC sube ~35 MB por vuelta (162 → 314 MB), ~3,7 MB por ida y vuelta isla ↔ carta; las
  texturas GPU no crecen en isla ↔ carta. FPS con vsync: carta/regiones/batalla 60; isla 35–60 (máquina con carga
  ~150, cifras ruidosas). Sugerencia: heap snapshot isla ↔ carta para ver qué retiene la isla.
- `app/story.ts › where()` aún usa `/Battle/.test(constructor.name)` para 'battle': inocuo hoy (nadie pregunta por
  'battle'), pero minificado devuelve 'other'.
- La ruta dev `?scene=island` se salta `maybeIntro`/`catchUp` (un beat de «misión nueva» no se encola tras recargar
  con esa ruta). Solo pruebas.
- Las notas a mano de la carta («¿y esta isla?», `island/night/mapNight.ts`) van fijas a la pantalla y en algunas
  posiciones de la carta caen sobre el título vertical «MAR DE LAS RUPTURAS». Cosmético, a propósito tenues.

## Cómo retomar
- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/f8d0e043-0e92-467b-a5d4-e9b12fa6c140/scratchpad/qa/`
  (`daemon.mjs` en 5322 con `/viewport` y `/drag`; `loadsave.sh <save.json>`; partidas `save-h57/h62/h63/h64/fin.json`).
- Entrar por la portada (CONTINUAR), no por `?scene=island`, para que el director encole los beats.

## Última actualización
2026-10-10 19:15
