# 11 · Contrato de la porción vertical (implementación)

> **IMPLEMENTADO** (2026-10-13). Los agentes A, B, C y D terminaron, QA-PORCION la recorrió de punta a punta y el coordinador corrigió los hallazgos. Estado en `10` §7.

**Qué se construye:** bar con el Momento «Drunck» → salida y escena con Luzterna → despertar de REGISTRO 000 → segundo mapa (la Carta de las Cajas) → primera ruta de la Borracha (B-1 a B-5).

**Guion:** `04`. **Mapa y ruta:** `05` §1–3 y §10. **Música:** `07` §2 y `investigacion/audio-real.md` (análisis con los audios exportados).

## 0. Reglas para todos

- **No hay commits, push ni publicación.** Las partidas reales no se tocan. Las fixtures se editan solo desde una página sin el juego corriendo.
- **Nunca se resta ni se rompe nada de una partida:** los campos nuevos son opcionales y pasan por un normalizador. Un id es para siempre.
- **Nada de raster en el repo.** Las pinturas que falten se marcan `STAND_IN` y se reportan como **pendientes**: el resultado visual no está terminado mientras use un suplente.
- **Las originales del dueño** solo suenan en los Momentos y en la Fonoteca (`tests/originalsReserved.test.ts`).
- **Código:** descubrir primero con el grafo `codebase-memory-mcp` (proyecto `Users-roor.osorio-Desktop-No-one`) y leer el archivo antes de editarlo.
- **Archivos compartidos** (`src/main.ts` rutas dev, `src/core/scenes.ts`, `data/content.ts`): **ediciones de pocas líneas, volviendo a leer el archivo justo antes de editar**, porque otros agentes trabajan a la vez.
- **Vite** en un puerto propio, con HMR apagado y config temporal en scratch: A 5601 · B 5611 · C 5621 · D 5631. Chrome sin cabeza con perfil propio. Al terminar, apagar todo y borrar los perfiles.
- **Estado de cada agente** en `docs/part-iii/agentes/<AGENTE>.md` (formato en `agentes/LEEME.md`).
- **Verde antes de entregar:** `npm run typecheck`, las pruebas propias y `npx tsx scripts/verify-missions.ts --all`.

## 1. Ids (no se cambian)

| Cosa | Id |
|---|---|
| Misiones | **H66** «La última ronda» (trigger `mission:H65`; goal `use_feature` → `feature_p3_bar`) · **H67** «¿Dónde andabas, gordo?» (`mission:H66`; `feature_p3_salida`) · **H68** «La Carta de las Cajas» (`mission:H67`; `feature_p3_gatera_borracha`) · **H69** «La mañana que no llegó» (`mission:H68`; `win_battle` de **B-5** → flag `won_p3d_borracha_5`) |
| Beats | `b66_bar`, `b67_salida`, `b67_despierta`, `b68_carta`, `b69_manana`. **Las reglas de la Parte II tienen que dejar de reconocer b66+ como suyos** (§2 A1) |
| Hablantes | `CANELO` (retrato de Canelo, `kind: 'cat'`), `HIPÓLITO`, `DOÑA ESPUMA`, `OYENTE` (**sin placa ni retrato**), `BITÁCORA` (`kind: 'system'`, sin retrato). `LUZTERNA` y `MANEKI` ya existen |
| Partida | `G.s.ext.gateras` (opcional): `{ v: 1, open: { [dim]: at }, huellas: number, stages: { [dim]: { cleared: number, wins: Record<string, number> } }, seen: string[] }` |
| Flags | `gatera:p3d_borracha` (abierta), `won_p3d_borracha_<n>` (victorias, patrón de `win_battle`) |
| Dimensiones | `p3d_borracha` (las otras 4 quedan dibujadas como rasgaduras en blanco) |
| Estados del mundo | Banda 130–159. `p3_marca_fria` (H66 activa: la página sin vapor) y `p3_rasgadura` (desde `b67_despierta` hasta H73) |
| Música | `drunck` (original, solo Momento y Fonoteca), `drunck.barra`, `drunck.resaca` y `drunck.battle` (variaciones), con `beatmaps/drunck.json` + `drunck.onsets.json` |
| Momento | `drunck` (`MomentoDef.mission: 'H66'`, `source: 'La Última Ronda'`) |
| Escenas | `CajaScene` (stage de cine **`caja`**; sets `bar` y `calle`) · `GaterasMapScene` (la Carta de las Cajas) |
| Cines | `p3_bar_a`, `p3_bar_b`, `p3_salida` (stage `caja`) · `p3_despierta` (stage `island`) · `p3_carta` (en la Carta) |
| Batallas | `p3d_borracha_1` … `p3d_borracha_5` (la 5 es la élite), armadas con `buildSiege`, **sin** tocar `content.enemies` |
| Regla de combate | `StageRules.mareo` (`battle/mareo.ts`) |
| Rutas dev | `?scene=caja&set=bar\|calle` · `?scene=cajas` · `?momento=drunck` · fixture `test-saves/h65-normal.json` |
| Funciones de flujo | `app/gaterasFlow.ts`: `playBarPrologue()` (escena A → Momento → escena B → remate; emite `feature_p3_bar`) y `playSalida()` (salida + despertar; emite `feature_p3_salida`) |

## 2. Quién hace qué (y qué archivos son suyos)

### A · CIMIENTOS-HISTORIA

1. **Riesgos de la Parte II:**
   - `rupturasLedger.ts`: `isPart2Mission` solo para H31–H65.
   - `rupturasReset.ts`: `isPart2Beat` solo para b31–b65; las misiones, beats, flags y batallas de la Parte III **nunca** entran al reinicio ni al registro de premios de la Parte II.
   - Pruebas con una partida que tenga H66+.
2. **Datos y flujo:**
   - `data/gateras/historia.json` (misiones H66–H69 con su campo **`card`** de 5 campos y `why` **sin premios**, más los beats con sus líneas de `04`). Se fusiona en `data/content.ts`.
   - `ui/story/gaterasScript.ts` (`P3_ON_NEW`, `P3_ON_DONE`, `P3_COVERED`), fusionado en `app/story.ts`.
3. **Hablantes** en `ui/story/text.ts`. **El tipo OYENTE** (globo sin placa ni retrato) y **BITÁCORA** en `ui/dialog.ts`. `personalize()` aplica a BITÁCORA. **Esto va primero**, porque C lo necesita.
4. **Tarjeta de misión y Bitácora mínima** (`panels/Bitacora.ts`):
   - Al aparecer una misión principal de la Parte III, su tarjeta (PASA / IMPORTA / QUEREMOS / AHÍ).
   - Al terminarla, CAMBIÓ.
   - «La última vez…» si vuelves después de 8 h o más.
   - En el panel MISIONES, las misiones de la Parte III muestran la tarjeta, no la firma de Luzterna.
5. **Estados del mundo** `p3_*`.
6. **La entrada a H66:** tocar la página junto al faro (`o4Pagina.ts`), con la animación del pelo y la gatera (`04` §1). Llama a `playBarPrologue()` de C.
7. **La cine `p3_despierta`** en la isla (`04` §6), que llama C al final de `playSalida()`, o A con el hook `ON_DONE` de H67.
8. **REGISTRO 000:** «DESPIERTO» en las islas 3D y en el Catdex con H66+ (`01` c-11).
9. **Predicado `luzternaFallecida(save)`** (falso en esta porción) y `voiceFor()` como base (`08` §6). Todavía no se apaga nada.
10. **Fixture `h65-normal`** (~17 M/s, `investigacion/sistemas.md` §2.3), generada con un script.

**Archivos suyos:** `rupturasLedger.ts`, `rupturasReset.ts`, `app/story.ts`, `ui/story/text.ts`, `ui/dialog.ts`, `ui/story/o4Pagina.ts`, `data/gateras/historia.json`, `ui/story/gaterasScript.ts`, `panels/Bitacora.ts`, `state/sys/gaterasWorld.ts` y sus pruebas.

### B · CARTA-BORRACHA

1. **`state/sys/gateras.ts`:**
   - `ext.gateras` con normalizador.
   - Huellas: 3 por etapa ganada por primera vez, 10 por el jefe.
   - Precio: `max(4.5e9, incomePerSec()/mareaMult()·900)` para la Borracha.
   - `openGatera(dim)`, que emite `feature_p3_gatera_borracha` y el flag.
2. **`GaterasMapScene`:** la Carta de las Cajas (`05` §1). Hojas de cuaderno, tu isla al centro con su faro, el haz que barre y las 5 rasgaduras (4 en blanco con «aquí no he llegado»).
   - La región Borracha usa la gramática de `MapScene`: nodos 1–4, élite en la 5, ruta, frontera y barquito.
   - En esta porción se juegan **B-1 a B-5**. B-6 a B-9 se ven bloqueadas.
   - **El desvío no entra en esta porción.** Queda documentado.
3. **La compra con Maneki** (`04` §7): línea, precio y botón.
4. **La entrada a la Carta:** desde la isla (la gatera del faro, una vez abierta la Borracha) y desde la carta del Diario del Mar.
5. **Batallas B-1 a B-5** con `buildSiege` y los datos de `05` §10:
   - capitanes de especies existentes;
   - poder enemigo con `powerMul` 0.85–1.05 sobre tu flota y un piso de 3 000;
   - en la élite, `storyScale` banda jefe.
6. **La regla Mareo:** pura, determinista y con la estimación incluida.
   - La guía de trayectoria se balancea con una función seno y semilla.
   - Los tiros llevan un desvío chico que la estimación conoce.
   - Las donas de B-2 y B-5 curan al enemigo si le das.
   - Las botellas de B-3 son escombro.
   - En B-4 la ulti enemiga tarda 1 turno más.
7. **El estilo de batalla** de la Borracha (paleta y `styleFor`) y **la música** `drunck.battle` y `drunck.barra` (las entrega D).

**Archivos suyos:** `state/sys/gateras.ts`, `state/sys/gaterasBattles.ts`, `scenes/GaterasMapScene.ts`, `battle/mareo.ts`, `battle/sim.ts` (**solo B**), `data/gateras/regiones.json` y sus pruebas.

### C · BAR-MOMENTO

1. **`CajaScene`**, una escena 2D de dimensión que implementa `CineStage` con el id `caja`:
   - sets `bar` (La Última Ronda) y `calle` (el callejón);
   - gatos horneados en caricatura (sacar `bakeToon` de `momentos/` a un módulo común, o reusarlo sin romper CIRCUS MALUS).
2. **Las cines** `p3_bar_a`, `p3_bar_b` (con el remate) y `p3_salida` (con la **caminata interactiva**: tocar para enderezar, nunca se pierde).
3. **El Momento `drunck`** (`momentos/songs/drunck/`):
   - hoja de coreografía de `04` §3;
   - estilos: caricatura, portadas del *Diario*, los 6 horneados de la Parte II y transiciones físicas;
   - 14 inputs que nunca cambian el resultado;
   - «Reducir movimiento» cambia la psicodelia por fundidos;
   - **los anclajes salen de los onsets reales de D**.
4. **`app/gaterasFlow.ts`** con `playBarPrologue()` y `playSalida()`. **Volver a ver** de las 3 cines y del Momento.
5. **Hipólito y Doña Espuma usan suplentes** (`STAND_IN`, especies existentes) hasta que haya pinturas. **Hay que reportarlo como pendiente.**

**Archivos suyos:** `scenes/CajaScene.ts`, `cine/scenes/p3*.ts`, `momentos/songs/drunck/*`, `momentos/songs/index.ts` (una línea), `app/gaterasFlow.ts` y sus pruebas.

### D · MUSICA-P3

1. **Originales:**
   - Copiar los 5 MP3 de `~/Desktop/NO ONE LIKE CATS SONGS/` (que **no se toca**) a `audio-derivados/originales/parte-iii/` con `SHA256SUMS`.
   - Verificar contra Soundtrap (`investigacion/soundtrap.md`): duración, tempo, compás 1 = 0 s y cola.
2. **Análisis de señal de las 5** (entorno de Python fuera del repo):
   - rejilla de tiempos y compases contra la rejilla observada;
   - onsets por banda;
   - secciones;
   - LUFS y picos.

   Informe en `docs/part-iii/investigacion/audio-real.md`, separando **SEÑAL**, **EDITOR** y **ESCUCHA**. Nadie escuchó: hay que decirlo.
3. **Primero Drunck** (lo necesita C): `beatmaps/drunck.json` (formato de la Parte II, con secciones y marcadores de `07` §2.1 ajustados a la señal) y `drunck.onsets.json`.
4. **Codificar** `drunck` en m4a, en `public/music/`, con el mismo proceso y LUFS que la Parte II (doc 18/19). Entrada en `data/music/tracks.json`.
5. **Variaciones de su propio material** (regla de `gustos-musicales`: sin timbres agregados):
   - `drunck.barra` (el rumble bajito; loop);
   - `drunck.resaca` (el loop del sinte lento y con paso bajo);
   - `drunck.battle` (loop de batalla).

   Con loops sin clic. Agregarlas a `escuchar.html` para que las oiga el dueño.
6. Beat maps y onsets de las otras 4 canciones, para los Momentos futuros: **solo los datos**, sin codificar al juego todavía.

**Archivos suyos:** `data/music/tracks.json` (**solo D**), `data/music/beatmaps/drunck*`, `public/music/drunck*` y `audio-derivados/parte-iii/`.

## 3. Orden y dependencias

- **A1 y A3 van primero:** la seguridad y los hablantes.
- **D3 sale en la primera hora:** C lo necesita.
- **C** empieza con `CajaScene` y el set mientras espera a D.
- **B** es independiente hasta que integra la música de D.
- **El coordinador** junta todo al final: `npm test` completo, recorrido sin cabeza de la porción con `h65-normal` y con la partida veterana, y capturas.
