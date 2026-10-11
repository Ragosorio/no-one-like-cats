# 28 · TRASPASO: cómo va la Parte II y cómo continuar

Última actualización: **2026-10-10, 13:30**. Este documento es el punto de entrada. La bitácora completa de la noche del 9 al 10 está en `28b-bitacora-2026-10-09-10.md`.

**Para quien continúe** (otra sesión de Claude u otro modelo): lee este archivo entero y después `agentes/LEEME.md`. Este documento no trae historia. La historia está en los docs internos (13, 17, 18 §5, 22–27 y 29), que **tú sí** puedes leer.

Si eres un agente y terminas algo, agrega una línea en la §7 (bitácora corta) al final.

## 0. Reglas que no se negocian

**Con el dueño (Ragosorio):**
- Escríbele en español latino.
- **Nunca le cuentes sorpresas de la Parte II**: ni giros, ni identidades, ni revelaciones, ni finales. Infórmale de sistemas, números, música, pruebas y capturas.
- **No publiques ni hagas push sin su OK explícito** para esa ronda.

**Partidas:**
- Nunca restar ni romper.
- Los campos nuevos son opcionales y pasan por normalize; las migraciones son idempotentes; `snapshot()` antes de reemplazar.
- **Nunca quites la guarda de `playMs`.**
- Los ids de misión, beat y especie son para siempre.

**Arte y audio:**
- **Nunca imágenes raster en el repo** (png, jpg, webp ni gif): el deploy falla si hay una. Los gatos son SVG de MAI. Los PNG de Codex viven fuera, en `~/Desktop/No one - raster (fuera del repo)/`.
- **Las 6 canciones originales del dueño** (`~/Desktop/NO ONE LIKE CATS sounds/`) no se modifican nunca.
- **Las originales solo suenan en los Momentos musicales y en la Fonoteca.** En batallas suenan los remixes (`<canción>.battle`) y en el juego normal, las variaciones. Lo vigila `tests/originalsReserved.test.ts`.
- Todo el audio pasa por `src/audio/api.ts`.

**Simulador y dominio:**
- El simulador es determinista: lo que se ve en pantalla y la estimación dan lo mismo. La música y los Momentos solo cambian **cuándo** se ve algo, nunca **qué** pasa.
- El juego **no se muda de dominio**: las partidas viven en `ragosorio.github.io`.

**Agentes y disco:**
- Cada agente mantiene `agentes/<AGENTE>.md` con qué hace, qué está hecho, qué falta y cómo retomar. Pídeselo en cada encargo nuevo.
- No más de **4 agentes a la vez**: con más, el límite de uso nos cortó 3 veces.
- El disco está justo (~7 GB libres). Al terminar, borra los perfiles de Chrome, los frames y `game/dist`.

## 1. Qué pidió el dueño (resumen)

- **Otra generación:** la Parte II debe sentirse distinta, más alegre y con mucha más dopamina. Dopamina de «me apareció una animación», no solo de «gané».
- **Historia completa** H31–H65 en 4 oleadas, y **todo lo que dice la historia pasa en el mundo**.
- **Reinicio de la historia de la Parte II** para todos, sin perder nada del progreso.
- **Sus 6 canciones:**
  - Cada una tiene su **Momento musical**: una cinemática interactiva sincronizada que no se puede saltar la primera vez. Los botones solo cambian la animación.
  - El Momento ocupa **toda la canción**, y **cada bombo, bajo y golpe tiene un propósito**.
  - Cada Momento tiene **un estilo de arte distinto**. Las canciones frenéticas dan más dopamina; las lentas cuentan más historia. El entorno puede cambiar de estilo dentro de la misma escena.
  - Durante los Momentos, la canción suena **fuerte**.
  - Hay versiones tranquilas y de batalla, y una **Fonoteca** coleccionable.
- **Niveles hasta 100:** desde ★2, +10 niveles por estrella. Las batallas se ajustan a eso.
- **Al final:** recorrido completo, novedades y publicación, solo con su OK.

## 2. Estado por pieza (todo SIN COMMIT; el último commit publicado es `eb88c42`)

| Pieza | Estado | Doc |
|---|---|---|
| Oleada 1 (H31–H41) + pulido de cine: 11 escenas, «Volver a ver», noche en la carta, `ui/hush.ts` | **HECHO** | 12, 26 |
| Oleada 2 (H42–H49): Gravedad, batallas en el cielo, Kit de Vuelo, 19 escenas, estados `o2_*`. **Incluye los 4 cabos sueltos que el dueño pidió recordar, ya cerrados** | **HECHO** | 22 |
| Oleada 3 (H50–H57): Combustible Astral, Taller Cometa, SINCRO, FASES, Canelo Astral, 14 escenas, estados `o3_*` | **HECHO** | 25 |
| Oleada 4 (H58–H65): Ecos, 3 islas 3D (una se arma con la partida del jugador), página del faro, créditos como datos con un rollo de respaldo | **HECHO** (sus Momentos aún no) | 27 |
| 9 islas 3D + sus hojas en la carta | **HECHO** | 14, 22, 25, 27 |
| Reinicio narrativo + registro de premios cobrados | **HECHO** | 21 |
| Arte: lotes D, E, F y G (43 gatos) en SVG MAI con rigs, ya sin suplentes | **HECHO** | 10 §2e |
| Motor de audio, Fonoteca, invitación al sonido, ajuste de ritmo | **HECHO** | 19 |
| Variaciones tranquilas (19 archivos) | **HECHO** | 23 |
| Remixes de batalla de las 6 canciones + batallas sincronizadas + SINCRO | **HECHO** | 23, 24 |
| Composiciones nuevas: Sueños y Umbral por capas (`setLayers`), Archivo, `amb.hilos`, 16 stingers | **HECHO** | 30 |
| Balance: jefes por bandas (`storyScale.ts`), un cuarto por cada gato enemigo, H63 con «PUERTAS CERRADAS» | **HECHO** | 27 §Balance, 16 §4b |
| Pulido visual: espuma del océano, cielo detrás de las islas, tomas | **HECHO** | `agentes/PULIDO.md` |
| **Motor de Momentos + LIKY FIGHT (H44)**, v2 con los 3 pedidos del dueño | **HECHO**, aprobado por el dueño | 29 |
| **Momento WHEN I LOSE (H35)** | **HECHO** (falta el OK del dueño) | 29 §14, `agentes/MOMENTO-WHEN-I-LOSE.md` |
| **Momento te ODIO (H55)** | **HECHO** (falta el OK del dueño) | 29 §17, `agentes/MOMENTO-TE-ODIO.md` |
| **Momento Hemkade (H57)** | **HECHO** (falta el OK del dueño) | 29 §16, `agentes/MOMENTO-HEMKADE.md` |
| **Revisión rápida de QA (alcance reducido por el dueño: él es el QA definitivo) + build + smoke** | **HECHO**, visto bueno; 13 arreglos visuales | `agentes/QA-RECORRIDO.md` |
| **Momento CIRCUS MALUS (H62)** | **HECHO** (falta el OK del dueño) | 29 §15, `agentes/MOMENTO-CIRCUS-MALUS.md` |
| Momento YONOSE TODO (H64→H65, continúa en los créditos) | **HECHO** | 29 §18, `agentes/MOMENTO-YONOSE-TODO.md` |

## 3. Lo que falta, en orden

1. ✅ **HECHO.** **Terminar los 3 Momentos en curso.** Si alguno se cortó, lee su `agentes/MOMENTO-*.md` y retómalo (§5).
2. ✅ **HECHO.** **Lanzar CIRCUS MALUS (H62)** con el brief común `agentes/BRIEF-MOMENTOS.md`.
   - Gancho: `H62_MOMENTO` en `state/sys/rupturasO4Battles.ts` (batalla `umbral_correctores`, fase `el_plan`), vía `registerFaseInterlude`.
   - Contexto: los Correctores quieren un mundo «perfecto», sin elección. La canción es un riff mecánico que nunca cambia, con un final raro: acordes «perfectos» y uno torcido.
   - Estilo sugerido: caricatura *rubber-hose* de los años 30 o teatro de papel, en **simetría perfecta**, que el final raro rompe.
   - Puerto Vite: 5361.
3. ✅ **HECHO** (incluye «Volver a ver» → `playFinale`). **Lanzar YONOSE TODO (H64→H65).**
   - Gancho: `registerFinaleMomento(fn)` en `app/o4Finale.ts`. Recibe `ask`, `choose`, `asleep()`, `mentira()`, `wake()` y `credits()`; los tiempos de la canción están en `FINALE_SONG`.
   - Secuencia: «Mentira» cae en el golpe del clímax (149,333 s); la canción sigue en los créditos (datos en `ui/story/creditsParteII.ts`); REGISTRO 000 pasa a *despertando* en el tic-tac final.
   - Estilo sugerido: un animatic a lápiz que se va calentando hasta acuarela, con interacciones suaves.
   - Pendiente relacionado: «Volver a ver» todavía repite las cines de respaldo en vez de `playFinale`.
   - Puerto Vite: 5371.
4. ✅ **HECHO** (13 arreglos de QA; `constructor.name` eliminado del juego; la fuga de memoria de la isla la lleva FUGA). **Arreglar lo que reporte QA-RECORRIDO.**
5. ✅ **HECHO (ANIMACIONES, doc 31).** **Animaciones con propósito en el juego normal:** anticipación, peso y reacciones según la personalidad. Prioridad: Canelo, los primordiales y la isla durante los eventos. Ojo: MOMENTOS tocó las deformaciones del rig, así que vuelve a leer `art/livingCat.ts` y `art/puppetCore.ts` antes de editar.
6. ✅ **HECHO (coordinador: `2026-10-15-la-marea-completa`).** **NOVEDADES** en `game/src/data/updates.ts`, **sin spoilers**:
   - renovación cinematográfica y musical;
   - la historia de la Parte II vuelve a empezar y tu progreso queda intacto;
   - Fonoteca, oleadas nuevas, islas 3D, gatos nuevos;
   - «escenas con tu música», sin decir cuáles ni dónde.
7. ✅ **HECHO (MENORES, `agentes/MENORES.md`).** **Pendientes menores:**
   - ~~`ruptura_nacar` (H39) usa el remix de YONOSE, aunque el doc 18 sugería WHEN I LOSE.~~ Decidido: se queda YONOSE (carácter, vecinas H39/H40, el Momento de H35, única fuente de `yonose_todo.battle` en la Fonoteca). Doc 24 §5.2.
   - ~~Las piezas temporales del cielo de la Oleada 3 no esquivan las islas.~~ Ahora esquivan las islas en reposo y conservan el encuadre de sus escenas (`o3Sky.ts` `settle`). Doc 25.
   - ~~Maneki en archipiélagos grandes.~~ Barre en una casilla libre y despejada cerca de casa (`manekiSpot.ts`); la cámara de `h54_maneki` la sigue. Doc 25.
   - ~~b60 b, b61 a y b61 c siguen siendo diálogo.~~ Son cines de región en Olvidada (`o4RegionCines.ts`: `h60_color`, `h61_pagina`, `h61_linea`) con «Volver a ver». Doc 27 §Escenas.
   - ~~El brillo del rayo de Platillo se ve algo plano.~~ Capa de luz vectorial sobre el cono (sin retrazar), en el SVG completo y en el lite (`game/scripts/platillo-beam.mjs`).
8. **Publicar, SOLO con el OK del dueño:**
   1. Hacer commits lógicos.
   2. Push como Ragosorio:
      ```bash
      git -c credential.helper= -c 'credential.helper=!f() { echo username=Ragosorio; echo "password=$(gh auth token -u Ragosorio)"; }; f' push origin main
      ```
   3. Subir el arte a `Ragosorio/nolc-arte`: los 22 SVG completos nuevos de los lotes E, F y G (unos 155 MB) **y la versión nueva de `platillo_saucer_cat.svg` (rayo con luz, MENORES)** — si no, falla la guarda «art site published and identical» del deploy —, y luego correr:
      ```bash
      GH_TOKEN=$(gh auth token -u Ragosorio) gh workflow run publish.yml -R Ragosorio/nolc-arte -f ref=main
      ```
   4. Verificar en vivo: `version.json`, la portada sin errores, la música bajo demanda y una partida vieja que migre bien.

## 4. Lo que el dueño tiene que hacer o revisar

- **Escuchar la música:** abrir `docs/part-ii/escuchar.html` en el navegador (58 grabaciones). Para regenerarla: `node game/scripts/escuchar.mjs`. Nadie la ha escuchado con oído humano; todo se midió con números. Las listas de «escuchar primero» están en los docs 23 y 30.
- **Ver LIKY FIGHT** con el servidor local: `http://127.0.0.1:5191/?momento=liky_fight`.
- **Dar el OK de publicación** cuando todo esté listo.

## 5. Cómo retomar si algo se cortó

1. **Revisa qué agentes quedaron a medias:** en cada `agentes/*.md`, mira la sección «Falta» y la «Última actualización».
2. **Retómalos:**
   - **En la misma sesión de Claude Code:** `SendMessage` al agente con su id (la sesión principal los conoce).
   - **En otra sesión u otro modelo:** lanza un agente nuevo con «Lee `docs/part-ii/28-traspaso.md`, `docs/part-ii/agentes/LEEME.md` y `docs/part-ii/agentes/<AGENTE>.md`, y continúa donde se quedó; mantén su archivo de estado». Si es un Momento, agrega `agentes/BRIEF-MOMENTOS.md`.
3. **Verifica todo:**
   ```bash
   cd game && npm run typecheck && npm test && npx tsx scripts/verify-missions.ts --all
   ```
   Algunas pruebas pesadas del simulador fallan por tiempo solo cuando la máquina está muy cargada; corridas solas, pasan. QA-RECORRIDO las está haciendo robustas.
4. **Pruebas headless:**
   - Vite en un puerto propio, con HMR apagado y `server.ws:false`, desde una config temporal en scratch. El 5191 es el servidor que usa el dueño.
   - Chrome con `--use-angle=metal --autoplay-policy=no-user-gesture-required` y perfil propio.
   - Arnés: `game/scripts/headless-shot.mjs`.
   - Mide FPS con vsync encendido.
   - Edita las fixtures solo desde una página donde el juego no esté corriendo.
5. **Rutas dev:** `?save=<fixture>`, `?scene=island|map|region&region=<id>`, `?scene=battle&music=<id>`, `?momento=<id>`, `?momento=lab`.

## 6. Mapa de documentos

- **Proyecto y estado:** `00-LEEME`, `10-estado-implementacion`.
- **Historia y mundo:** `13-guion` (historia), `14-regiones-3d`, `16-niveles-100`.
- **Audiovisual:** `17-plan-audiovisual`, `18-catalogo-musical` (análisis de las canciones), `19-audio-arquitectura`, `20-estados-y-cine`.
- **Sistemas y oleadas:** `21-migracion-reinicio`, `22-oleada-2`, `25-oleada-3`, `26-oleada-1-cine`, `27-oleada-4` (incluye el balance de jefes).
- **Música:** `23-variaciones-musicales` (incluye los remixes), `24-batallas-musicales`, `30-composiciones-nuevas`.
- **Momentos:** `29-momentos-musicales` (motor, estilos, onsets y cómo hacer un Momento).
- **Trabajo en curso:** `agentes/` (estado de cada agente), `escuchar.html`.
- **Fuera del repo**, en `~/Desktop/No one - raster (fuera del repo)/`:
  - `arte-nuevo/`: lotes de Codex, PROGRESO.md y hojas de revisión.
  - `audio-derivados/`: stems, onsets, scripts, masters, fluidsynth y el SoundFont.

## 7. Bitácora corta (desde 2026-10-10 13:30; lo anterior está en `28b`)

- 13:30: se reescribe este traspaso. Corriendo: MOMENTO-WHEN-I-LOSE, MOMENTO-TE-ODIO, MOMENTO-HEMKADE y QA-RECORRIDO.
- 16:05: sesión nueva. Los 4 agentes de las 13:30 se cortaron ~14:15; se apagaron sus Vite/Chrome huérfanos. Relevo con 6 a la vez (pedido del dueño): MOMENTO-WHEN-I-LOSE, MOMENTO-TE-ODIO, MOMENTO-HEMKADE y QA-RECORRIDO retoman; nuevos MOMENTO-CIRCUS-MALUS (:5361) y MOMENTO-YONOSE-TODO (:5371, incluye «Volver a ver» → `playFinale`). Después: ANIMACIONES (§3.5), NOVEDADES (§3.6), MENORES (§3.7) y los arreglos de QA. El `npm test` completo lo corre el coordinador al final.
- 18:13: MOMENTO-CIRCUS-MALUS terminado: «FUNCIÓN DE FERIA 1930» (rubber-hose en película B/N ↔ Technicolor de dos tiras, simetría perfecta que el final rasga y quema), canción entera, 29 prompts, gancho FASES de H62, onsets a grilla regenerados (`onsets_grid.py`), `tests/momentoCircusMalus.test.ts` (13). Doc 29 §15.
- 18:20: MOMENTO-HEMKADE terminado: «COLOSO / GRABADO» (3D real con three.js en toon de bandas duras ↔ láminas de buril que se dibujan con la melodía), canción entera, 59 prompts, gancho FASES de H57 (`cielo`); flujo real de H57 con 3 bots: el sim queda idéntico y la partida solo gana `ext.momentos.hemkade`; `tests/momentoHemkade.test.ts` (12). Doc 29 §16.
- 19:15: QA-RECORRIDO terminado (alcance reducido por el dueño): Oleada 4 jugada H62→H65 + las 3 islas, Parte I abre bien (`late-game`, `isla-m2`), pantallas 4:3 y panorámica, build + smoke en `vite preview` limpio (dist borrado), typecheck y verify-missions OK. 13 arreglos visuales/de flujo (VOLVER A VER con scroll, cabecera de la carta en pantallas no 16:9, cursiva cortada en producción, nombre/rareza de cartas, NOVEDADES sobre un diálogo, IR en bucle en la carta, portada «PARTE II»…). Detalle y hallazgos (crecimiento de heap isla ↔ carta) en `agentes/QA-RECORRIDO.md`.
- 18:53: MOMENTO-YONOSE-TODO terminado: «ANIMATIC» (storyboard a lápiz que hierve con cada bombo → acuarela que se esparce desde un punto → la pintura del juego; el arranque en frío despinta el cuadro real del juego), canción entera 0 → 208,6, 21 prompts + elección de tres miniaturas, créditos de la Parte II como páginas de acuarela sobre el clímax, REGISTRO 000 en el tic-tac. Gancho `registerFinaleMomento` (la plomería sigue en `o4Finale.ts`; ahora puede devolver `'fallback'` y expone `hasFinaleMomento()`); «Volver a ver» del final ya va por `playFinale` sin efectos de misión. Onsets de `yonose_todo` regenerados por grilla (`onsets_yonose.py`). Motor retrocompatible: `playMomento(id, { def })`, `PromptTheme.star/font`. `tests/momentoYonoseTodo.test.ts` (15). Doc 29 §18.
- 18:54: MOMENTO-TE-ODIO terminado: «GRAFITI Y SEÑAL ROTA» (cómic limpio de la caja ↔ spray callejero en el mismo mundo, frente diagonal, grietas al otro arte, transmisión rota por una grieta en el break), canción entera 0 → 214, 48 prompts. Gancho `battle: ruptura_disruptores/glitch` (BattleScene). Flujo real de H55 con 3 bots: el sim queda idéntico y la partida solo gana `ext.momentos.te_odio`. Arreglados un tirón de 57–164 ms en el primer golpe (semillas de palabras de rama) y una fuga de ~14 MB por reproducción (tramas Ben-Day grandes → baldosas). `tests/momentosTeOdio.test.ts` (11). Doc 29 §17.
- 19:10: MOMENTO-WHEN-I-LOSE terminado: «TINTA Y PERGAMINO» (sumi-e con tono por contraste local ↔ manuscrito iluminado con pan de oro, el mismo set redibujado por un filtro propio y un frente con filo de oro; láminas que pasan la página), canción entera 0→219,5, 17 inputs + 4 opcionales, gancho FASES de H35 (dos fases solo de presentación). Sim idéntica antes y después del Momento en el flujo real; sincronía bombo mediana 8,6 ms / p99 18,4; 59,8–60 fps alta y baja; memoria 59,5→74,8→76,7 MB. Arreglos en el motor común: `momentos/index.ts` (los 9 s de espera de la canción cuentan desde que el set está listo). Doc 29 §14.
- 19:07: ANIMACIONES terminado (§3.5): «intenciones animadas» en el juego normal. `art/temperament.ts` (datos: los 14 rasgos → temperamento con latencia, ritmo, rebote, postura, manías y reacción por evento; peso por rareza; primordiales solemnes; repertorio propio de Canelo; default para cualquier especie) + `art/intent.ts` (intents como keyframes: anticipación → acción → asentamiento; driver por gato con dados visuales propios, nunca `Math.random` ni la del simulador) + capa aditiva `PuppetBrain.pose` (en cero = actuación de antes). Integrado en `island/catActor.ts` (arranque y frenado con peso, saltos y manías por temperamento, toque, entrada a las noches narrativas), `island/night/stage.ts` (los comandos de grupo de las cines reaccionan cada uno a su tiempo; ola de reacción a `shake`/`burst`/`shoot`/`ignite`/`o3:shatter`/`o3:crack`), `cineFx.ts` (`pose` apaga la personalidad), festejo al subir de nivel o de Reino. «Reducir movimiento» lo apaga. Batalla, Momentos y partida sin tocar. 150 gatos a 60 FPS; los gatos cuestan +0,02 ms por cuadro. `tests/temperament.test.ts` (12). Doc 31, `agentes/ANIMACIONES.md`.
- 19:15: MENORES terminado (§3.7, los 5): H39 se queda con el remix de YONOSE (doc 24 §5.2); el cielo O3 de paso esquiva las islas; Maneki barre en una casilla libre; b60 b / b61 a / b61 c son cines en Olvidada con «Volver a ver» (`o4RegionCines.ts`); el rayo de Platillo tiene una capa de luz vectorial (`scripts/platillo-beam.mjs`; no hizo falta retrazar: el trazo no estaba colapsado, error 9,5 y 11,6 en el lite; lo que faltaba era la luz). `tests/o3SkyPlacement.test.ts` (10) + `rupturasO4` ampliado; typecheck, 10 archivos de pruebas (130) y verify-missions verdes. `agentes/MENORES.md`.
- 20:10: REMIX-ARREGLOS terminado (las 4 pistas que el dueño pidió cambiar; lo demás no se tocó). `circus_malus.explore` «Cajita de música»: sin el piano de la original ni el tic, ahora con cajita, celesta y arpa de verdad (muestreadas, GeneralUser GS) y armonía en Mi mayor; el riff es el mismo. `yonose_todo.battle`: sin los sintes agregados (metales y cuerdas sintetizadas); los timbales ahora son muestreados. `te_odio.battle`: sin las campanas FM; las teclas del verso se abren poco a poco. `when_i_lose.battle`: intro y verso→drop con las transiciones de la propia canción; el canto ahora en cornos y trombones muestreados. Misma duración, tempo, loop (±27 ms de ajuste) y secciones; LUFS iguales (YONOSE −17,5, las otras −16,5; cajita −18,0); beatmaps regenerados. typecheck, 15 archivos de pruebas de audio/batallas/Momentos/rupturas (240) y verify-missions verdes. `escuchar.html` marca las 4 como «RECIÉN». Respaldo: `audio-derivados/respaldo-remixes-2026-10-10/`. Doc 23 §«Re-arreglos 2026-10-10», `agentes/REMIX-ARREGLOS.md`.
- 20:05: FUGA terminado (hallazgo de memoria de QA). Dos causas raíz, las dos dentro de Pixi: (1) `BigPool` guardaba los `GraphicsContextRenderData` de cada Graphics grande ya destruido, con batchers cuyos búferes solo crecen → ArrayBuffers 128 → 161 → 194 → 212 MB en 4 vueltas largas; ahora `core/pixiFixes.ts › trimPixiPools()` los libera en cada cambio de escena (`core/scenes.ts › swap`) y se estabilizan (~89–101 MB). (2) el sistema de texto dejaba una clave nula por cada texto distinto mostrado (relojes, avisos): ahora se borra. Además `__island` solo en DEV. Después: isla ↔ carta +0,56 MB/vuelta de media (9 vueltas, ruido ±1,5), Parte I +0,58, vuelta larga en la carta +0,9 y bajando (cachés acotadas del motor). Nota «¿y esta isla?» se corre fuera de las tiras verticales de las hojas (`island/night/mapNight.ts`; 16:9, 1200×900, 2000×800). `tests/sceneLeaks.test.ts` (7); typecheck y verify-missions verdes. `agentes/FUGA.md`.
- ~21:00 (coordinador): TODO lo de la §3 (1–7) cerrado. Arreglos extra: `constructor.name` fuera del juego (prueba endurecida), H63 de `storyScale` cede el hilo (ya no hay «Timeout calling onTaskUpdate»), NOVEDADES `2026-10-15-la-marea-completa`. Verificado: `npm test` completo 47 archivos / 542 pruebas ×2 sin errores, typecheck limpio, verify-missions 162 OK, build sin raster, smoke de producción (portada, isla `rupturas-o4`, NOVEDADES, carta) con consola limpia; `game/dist` borrado. El dueño aprobó la música (4 remixes rehechos por REMIX-ARREGLOS). Sigue COMPOSITOR-FUTURO (música para partes futuras, fuera del juego). **Falta solo el OK del dueño para publicar (§3.8).**
