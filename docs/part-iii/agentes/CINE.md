# CINE — motor de películas e investigación visual (ronda 4)

**Qué estoy haciendo:** terminé la oleada 4 del final. Espero la revisión del dueño.

## Oleada 4 (final)

- **F31 `f31_luz`** «Se acerca una luz»: PP con realismo de tormenta; las barras entran despacio; pista `fut.jefe.grave`.
- **F36 `f36_mira`** «MIRA»: ojos en lo negro; un MIRA opcional (si nadie toca, mira solo a los 4 s); visión de gato en duotono; Cerito elige pelaje; CAMBIÓ.
- **El alivio Klimt, rehecho:** fondo cálido y calmo; figuras grandes en una composición clara; el oro como friso que crece desde los bordes y un halo de mosaico que se abre detrás de los dos.
- **Audio por película** (tabla de MÚSICA, `10-produccion-oleada3.md`):

  | Película | Pista |
  |---|---|
  | F31 | `fut.jefe.grave` |
  | F34 (1/3) | `liky_fight.amanecer` |
  | F34 (2/3) | la misma, con `from: 20` y corte en seco al final (A8) |
  | F35 | `sadie` |
  | F38 | `sadie.luz` («Antes de la luz») |
  | F39 créditos | `sadie.luz` |
  | F33, F34 (3/3), F36, F37, F39 recado / continuará, F40 | silencio |

  - F34 quedó en 3 películas: el corte en seco de A8 exige que la música termine con la película.
  - F39 quedó en 3: recado / créditos / continuará (la música solo bajo los créditos).
- **R6, el sonido:** SFX `nib` sintetizado en `core/audio.ts` (una clave nueva) + verbo `sound`. Suena en F32 (K3 y K5) y en F34 (3/3), en el cenital y en el trazo.
- **Sincronía (sin cabeza, con audio):**
  - SADIE, 90 s en modo audio: lo dibujado va **12,0 ms** adelante de lo oído, constante. Es el adelanto de un cuadro, a propósito (`VISUAL_LEAD`). Fluctuación p99 menor a 0,1 ms en 5405 cuadros.
  - F38 con `sadie.luz`: igual.
  - F31 (`fut.jefe.grave`), F34 (1/3) y F34 (2/3, desde los 20 s): igual, 12 ms constantes.
  - **Arreglados dos fallos que dejaban mudas a F31 y F34 (2/3)** («la canción no llegó»):
    1. `audio/director.ts` y `directorTable.ts`: el director tiraba `CueOpts.at`, así que toda pista arrancaba en 0. Afectaba los extractos con `from`, el «late join» y los segmentos que no empiezan en 0 (2 líneas).
       - **Ojo, Parte II:** los saltos de la música de batalla (`battle/music/index.ts`, `at:`) y `regions/olvidada.ts` también pasaban `at` y caían en 0 (o en la sección). Ahora caen donde su código pide. Que MÚSICA y QA lo escuchen.
    2. `fut.jefe.grave` vive bajo la canción `amb`, y el reproductor la reporta como `amb.fut.jefe.grave`. La película ahora le pasa al reloj la referencia canónica (`film/index.ts`).
  - Pruebas nuevas en `tests/filmFinal.test.ts`.
- **Rendimiento a 60 Hz** (sin cabeza; la máquina cargada por otros agentes, carga 35–69):
  - F31, F34 (2/3), F34 (3/3): 60 fps, máximo 16,8 ms.
  - F34 (1/3), con el alivio nuevo: 60 fps, un solo tirón de 167 ms en 1,3 s (en el fundido de entrada).
  - F39 créditos: máximo 50 ms. F39 continuará: un cuadro de 67 ms.
  - F36: en una corrida tranquila, máximo 16,8 ms; con la máquina saturada, un tirón suelto de 0,7 s que cae en un punto distinto cada vez.
- **Cerito:** ya no usa `nadie_static_cat` (queda libre para REGISTRO 000); ahora `voltio_static_cat`.


## Oleada 3 · las películas del final (⚠️ spoilers)

**Hecho** (`game/src/film/films/final/`, registradas con una línea en `film/films.ts`):

| Id | Película | Estilo | Notas |
|---|---|---|---|
| `f32_caida` | F32 «La caída» (H93) | realismo con tormenta, 2,39 | burbuja cian, el cenital con el trazo que rodea, la llama que se apaga, la bufanda en el suelo, «SIN LLAMA.» |
| `f33_noche` | F33 «La noche sin Canelo» (H94) | la pintura del juego, a sangre | R1: el cono termina en los ojos cerrados de Canelo; toques libres desde el segundo 0 (gatos, bufanda, palmera, faro con pulso débil); puerta «Toca el faro» a los 90 s; S2: «…me pareció horrible.» |
| `f34_amanecer` | F34 (1/2): regreso y alivio | realismo → **Klimt** | Cerito prende la llama chica, la bufanda vuelve con el haz; alivio en pan de oro; S1: el barco se va de espaldas y a contraluz |
| `f34_golpe` | F34 (2/2): el golpe | realismo, entran las barras | la luz cubre a los dos y su espalda queda en sombra (Q3); S1: La Mano sale de una gota de tinta; R6: el cenital rima con H93; «te mato—», el trazo, «…Ah.» |
| `f35_sadie` | F35 SADIE «Linterna mágica» | linterna mágica, 2,39 | completa, compás por compás: el iris crece en c5, c9 y c17, se lava en c29–33, la brasa en c33–37, corte en c37; 3 RECUERDA (c9, c17, c21); la bufanda cae de la manga en c29 |
| `f37_mano` | F37 «La Mano» (H95) | **Posada** (linograbado; el naranja como segunda tinta) | S4: la tinta sale gris y no deja marca; la ficha se borra línea por línea; R9a: la línea de Borrón |
| `f38_vigilia` | F38 «La vigilia» | realismo, de noche al amanecer | 2,39 que se abre a pantalla completa; toques libres; puerta «Seguir» |
| `f39_recado` | F39 «El recado» · créditos · «Continuará» | la pintura del juego | puerta «Díselo»; faro naranja; la Carta con créditos; «Continuará.» |
| `f40_ronda` | F40 «La última ronda» (H97) | la Borracha lavada, 4:3 | el vaso que cae; «Luego me acuerdo de ella. Todos los días.» |

- **Pendiente:** F31 (la PP del asedio) y F36 (MIRA, la visión de gato). El estilo `gato` ya está listo.
- **Motor (todo opcional y compatible):**
  - `FilmDef.map`: el mapa en crudo de una pista sin registrar.
  - `gates`: puertas para continuar.
  - Toques libres: `FilmSet.hotspots` y `tap`.
  - Gatos en otros tratamientos: `{ slug, bake }` y `actorAs`/`stillAs`; `CAT_BAKES` con `gris`, `plano`, `vidrio`, `klimt`, `lino`, `realismo` y `tv`.
  - `cats({ canelo, scene })`.
  - El post con duotono.
  - Estilos `linterna`, `klimt`, `posada`, `realismo`, `pintura`, `borracha` y `gato`.
  - `CardSpec.size`.
  - Calentamiento cada ~4 s y una pasada a tamaño real.
  - `&invite=0` en la ruta de desarrollo.
- **Pruebas:** `game/tests/filmFinal.test.ts` (7). La suite completa pasa (831) y `tsc` está limpio.
- **Rendimiento a 60 Hz** (M4, Chrome sin cabeza, 1920×1080):
  - Todas las películas van a 60 fps (p95 16,7 ms, p99 16,8 ms).
  - SADIE: 173 s, 0 cuadros de más de 50 ms (máximo 33 ms).
  - F32, F34 (las dos partes), F38, F39 y F40: 0 tirones.
  - Quedan dos tirones de un cuadro: F33 de 167 ms a los 0,3 s (todavía en el fundido desde negro, no se ve) y F37 de 67 ms a los 27,8 s.
- **Suplentes** (arte nuevo sin aprobar): Cerito = `nadie_static_cat` (con pelaje: `copito_snowball_cat`); La Mano = `tachon_strikeout_cat` pálido, con su mano blanca y la uña de plumín dibujadas en código; Homiau = `dona_police_cat`; Borrón = `fanguito_mud_cat`; Itō = `arcanito_lantern_cat`; Nadie (vigilia) = `ecomudo_static_cat`. Canelo sin llama = el horneado `gris` (la bufanda pintada encima). La bufanda tejida, la linterna rota, el barco de tinta y la burbuja están dibujados en código.
- **Música:** SADIE suena sola cuando está registrada (ya está en `tracks.json`). El resto del final va en silencio: faltan «Antes de la luz», el tema de Canelo y el rasgueo amplificado de R6 (es sonido).
- **R8, el desayuno jugable:** va entre `f34_amanecer` y `f34_golpe`. Sin desayuno, las dos películas corren seguidas.

**Hojas de contacto:** `<scratch>/cine/f32 … f40/sheet.png`, `f34.png`, `f35b.png`, `f3738.png` y `f3940.png`.

## Oleada 1 (resumen)

**Hecho (oleada 1):**
- **`game/src/film/`** (nuevo): una película es un Momento en modo película. `MomentoRun` se reutiliza; lo nuevo es `FilmStage` (`stage.ts`).
  - Núcleo puro: `types.ts`, `catalog.ts`, `timeline.ts`, `camera.ts`, `registry.ts`, `films.ts`.
  - Runtime: `bake.ts`, `post.ts`, `transitions.ts` (12 tipos en un shader), `present.ts`, `weather.ts` (7 climas), `loader.ts`, `index.ts` (`playFilm`), `dev.ts`, `gl.ts`.
  - Estilos: `styles/vangogh.ts`, `styles/davinci.ts`, `styles/noir.ts` (completos); `styles/catbake.ts` (6 horneados de gatos); `styles/index.ts` (más los presets acuarela, ukiyo-e y mudo).
  - Demo `?film=demo` (48 s, cero clics, silencio): Van Gogh → corte por forma en la luna → Da Vinci → vuelta de página → noir con lluvia → iris sobre la linterna → «CONTINUARÁ». Archivos: `demo/index.ts`, `noche.ts`, `estudio.ts`, `lluvia.ts`, `fin.ts`.
- **Gancho chico y compatible** en código compartido: `StageApi.ownGrade?` (`momentos/anime/kit.ts`) y una línea en `momentos/runner.ts`. Los Momentos no cambian (todas sus pruebas pasan).
- `main.ts`: ruta `?film=<id>` (solo DEV).
- **Pruebas:** `game/tests/filmTimeline.test.ts` (15) y `game/tests/filmEngine.test.ts` (10). `tsc` limpio; la suite completa en verde (761).
- **Documentos:**
  - `docs/part-iii/cine-v2/01-investigacion.md`: 85 entradas, top 10, matriz de costo e impacto, accesibilidad y 16 trampas. Lo redactó un subagente; revisé los estados contra el código.
  - `docs/part-iii/cine-v2/02-api.md`: cómo se escribe una película, con un ejemplo mínimo.
- **Rendimiento** (Apple M4, Chrome sin cabeza a 1920×1080, alta):

  | Modo | fps | p95 | p99 | Cuadros > 50 ms |
  |---|---|---|---|---|
  | Limitado a 60 Hz | 60,0 | 16,7 ms | 16,8 ms | 0 |
  | Limitado a 60 Hz, con «Reducir movimiento» y «Reducir destellos» | 60,0 | 16,7 ms | 16,8 ms | 0 |
  | Sin límite | ~245 | 10,9 ms | 12,7 ms | 0 (máximo 18,9 ms) |

  El horneado tarda entre 0,8 y 1,4 s (0,5 s en calidad baja).
- **Trampas encontradas y arregladas:**
  - `new Filter({ resolution: undefined })` hacía que Pixi saltara el filtro sin avisar.
  - El post del kit compilaba en el primer relámpago (2,1 s): ahora se calienta en la carga.

**Falta (siguientes oleadas):**
1. MECÁNICAS: guardar «visto» (`playFilm(id, { seen })` → `FilmResult`) y llevarlo a «Volver a ver».
2. Producción de películas por acto, con `02-api.md`.
3. Kits de escenario para los presets (ukiyo-e, acuarela, mudo) y los estilos propuestos del top 10 (Klimt, Posada).
4. Aviso menor de Pixi al cerrar: «textureSource destroyed while still bound», sale de `Studio.dispose` (código compartido de Momentos). Es inofensivo.

**Cómo retomar:**
- Vite propio: `npx vite --config <scratch>/cine/vite.c.config.ts` (puerto 5631, sin HMR).
- Herramientas en `<scratch>/cine/pp/`: `sheet.mjs` (hoja de contacto), `run.mjs` (tiempos por cuadro; `CAP=1` limita a 60 Hz), `probe.mjs`, `live.mjs` y `tile.mjs`, todas con `PROF=<perfil>`. Necesitan `npm i puppeteer-core@24` en esa carpeta (se borró al terminar).
- Hojas de contacto finales: `<scratch>/cine/sheet4/sheet.png` y `<scratch>/cine/sheet-rm/sheet.png`.

**Última actualización:** 2026-10-26.
