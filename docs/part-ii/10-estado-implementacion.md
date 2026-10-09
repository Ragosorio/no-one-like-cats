# 10 · Estado de implementación: Parte II (bitácora para continuar)

**Última actualización:** 2026-10-09 (§2g: pendientes de la Oleada 1 cerrados).
**Rama:** `main`. Hay cambios **sin commit y sin push** (no se pidió publicar).

Leyenda: **IMPLEMENTADO** = código que corre y está verificado · **PROTOTIPADO** = corre, pero es del slice y no del juego real · **PLANIFICADO** = diseñado en 05/07/08 · **NO INICIADO**.

## 1. Cómo correrlo

```bash
cd game && npm run dev          # luego abre http://127.0.0.1:5173/rupturas.html
npm test                        # 92 tests (vitest)
npm run typecheck
npm run build                   # genera dist/index.html (el juego) y dist/rupturas.html (el slice)
```

**Controles del slice:**

| Acción | Control |
|---|---|
| Orbitar la cámara | Arrastrar con el mouse |
| Mover la cámara | Shift + arrastrar, clic derecho, o WASD |
| Rotar la cámara | Q / E |
| Zoom | Rueda del mouse |
| Seguir a un gato y ver su ficha | Clic en el gato |
| Ver rendimiento | F3 |
| Modo foto | H |

En la barra inferior están la hora, la velocidad del día, el clima, ZARPAR y COLAPSO ESTELAR. Ajustes trae calidad, auto-calidad, reducir movimiento e intensidad de efectos.

**Consola de depuración:** `window.__rupturas` (ver 07 §8).

## 2. Qué se hizo en esta sesión

| Qué | Estado | Archivos | Verificación |
|---|---|---|---|
| **Auditoría** técnica, de gameplay, de historia y de conceptos | IMPLEMENTADO (docs) | `01`, `03`, `04` y `catalogo-conceptos.html` | Hecha por agentes; cada dato con su referencia archivo:línea |
| **Investigación tecnológica** con fuentes fechadas | IMPLEMENTADO (doc) | `02` | Versiones contrastadas con npm al 2026-10-09 |
| **Núcleo del puppet sin renderer** (`PuppetModel`, `PuppetBrain`); `CatPuppet` de Pixi pasa a ser un adaptador con la misma API | IMPLEMENTADO | `game/src/art/puppetCore.ts`, `livingCat.ts` | **Paridad** contra el original: 3 gatos × 600 cuadros, con caminar, feliz, dormir, ataque e inclinación, Δ < 1e-4. Snapshot de regresión en `tests/engine.test.ts` |
| **AgentGameEngine (runtime):** noise, perf y calidad, heightfield, ocean, sky y daycycle, weather, flora, PaperCat, partículas, cámara y director de vida | IMPLEMENTADO (módulos) / PROTOTIPADO (solo los usa el slice) | `game/src/engine/**` | 11 tests de motor; typecheck |
| **Vertical slice** `rupturas.html`: isla 2.5D, ciclo de día, clima, faro de Luzterna con haz, 3 hábitats vivos, 8 gatos con IA ambiental, Luzterna, barco, Colapso Estelar y REGISTRO 000 | PROTOTIPADO | `game/src/rupturas/**`, `game/rupturas.html`, `vite.config.ts` (2ª entrada) | Chrome headless con GPU real (Apple M4/Metal) y capturas revisadas (§3); build OK; three solo entra al chunk del slice |
| **Arreglo del precio de orbes** (sin crecimiento exponencial; techo relativo al ingreso; "calor" por especie que se enfría con el tiempo) | IMPLEMENTADO (en el juego real) | `state/sys/shop.ts`, `data/updates.ts` (NOVEDADES), `panels/shop/tabs/orbs.ts`, `tests/orbPricing.test.ts`, doc `06` | 15 tests nuevos; las partidas viejas cargan sin cambios (sin migración) |
| **Biblia de diseño, Biblia de arte, arquitectura y migración** | IMPLEMENTADO (docs) | `05`, `07`, `08` | — |
| **Harness headless** | IMPLEMENTADO (herramienta) | `game/scripts/headless-shot.mjs` | Se usó en toda la sesión |


## 2b. Segunda ronda (2026-10-09, tarde) — tras las respuestas del dueño

**Respuestas del dueño:**
1. Se puede cambiar de servicio de hosting.
2. No hay forma de probar en Iris Xe.
3. **Eje de Distraxia y las 3 facciones: aprobado.**
4. **Nuevo requisito:** la historia tiene que justificar el cambio de presentación sin perder la vista de la Parte I.

| Qué | Estado | Dónde | Verificación |
|---|---|---|---|
| **Las dos caras de la isla: PÁGINA (vista de la Parte I) ⇄ MUNDO (2.5D)**, con transición pop-up escalonada y con rebote, que respeta reducir movimiento | PROTOTIPADO | `rupturas/views.ts`; lente `page` en `Heightfield`, `Ocean` y `PaperCat`; diseño en `05 §2.5` y `08 §6.5` | Capturas H3/H7 (página) y H4/H5 (pop-up) |
| **Notas al margen** de los Titiriteros, legibles solo en la PÁGINA. REGISTRO 000 aparece solo en el MUNDO | PROTOTIPADO | `main.ts` (`NOTES`) | Captura H7 |
| **Beat H31 «La página se dobla»**: abre en la PÁGINA de noche, aparece un pliegue brillante junto al faro, al tocarlo se despliega el MUNDO y hablan Luzterna y la linterna. Se ve una vez por visitante (`?intro=1` lo repite y `?intro=0` lo salta) | PROTOTIPADO | `main.ts` (`startIntro`) | Capturas K1–K4 |
| **Puente de solo lectura a TU partida**: el slice muestra tus gatos (Canelo primero, luego por ★ y nivel, con variedad de elementos y tope por calidad: 8/12/16/24). La casa de cada gato se asigna por elemento. Solo usa `getItem`. | IMPLEMENTADO (módulo) / PROTOTIPADO (uso) | `rupturas/bridge.ts`; `tests/bridge.test.ts` (17 tests: nunca escribe, tolera basura, las 14 fixtures dan un elenco determinista con Canelo primero) | Headless con `?save=late-game`: «Reino 36 · 23 gatos · viven aquí 16», a 60 FPS (19 puppets) |
| **Conductas por etiqueta** (`canelo`, `lava`) en vez de por ID: sirven para cualquier colección | IMPLEMENTADO | `rupturas/life.ts` | Tests de motor |
| **Lentes de Eco de Vida** sobre la misma pintura: Cristal, Oro, Tinta, Acuarela y Holograma, con fundido de entrada. Vista previa en la ficha del gato | PROTOTIPADO | `PaperCat.lens`; botones en la ficha | Capturas J1–J3 |
| **Respaldo de rendimiento**: si en calidad Baja el p95 pasa de 33 ms durante 5 s, cambia sola a la PÁGINA (ligera) y avisa | IMPLEMENTADO (slice) | `main.ts` | Lógica revisada; no hay hardware lento para dispararlo de verdad |

**Pruebas:** 109/109 (antes 92) y typecheck limpio.


## 2c. Hosting del arte y rendimiento sin Iris Xe (2026-10-09)

| Qué | Estado | Dónde | Verificación |
|---|---|---|---|
| **Arte con base configurable** (`artUrl`): por defecto todo queda igual; con `VITE_ART_BASE_FULL` el arte completo se sirve desde otro sitio. Si el sitio de arte falla, el gato se queda en lite. | IMPLEMENTADO (sin activar) | `art/artBase.ts`, `art/artPaths.ts`, `catArt.ts`, `portrait.ts`, `rasterCache.ts`, `core/pwa.ts`, `public/sw.js`, `vite.config.ts`, `.github/workflows/deploy.yml`, `scripts/art-publish.ts`, `ops/nolc-arte/publish.yml`; doc `09` | 12 tests nuevos. Build por defecto: 690 MiB, idéntico a hoy. Con base: 101 MiB. Headless con arte de otro origen sin errores. Revisé el diff de producción a mano. |
| **Decisión de hosting:** el juego NO se muda (las partidas viven en el origen `ragosorio.github.io`). El arte completo va a un 2º repo de Pages, `Ragosorio/nolc-arte`, que es el mismo origen: sin CORS, sin cuentas nuevas y con +1 GB. Para los +80 gatos habrá un 3º repo (`nolc-arte-2`), ya soportado con `"a,b"`. | **PENDIENTE de aprobación del dueño** (crear el repo, hacer push y configurar las variables) | `09 §6` | — |
| **Rendimiento sin Iris Xe**: M4 sin vsync (Baja 465 / Media 311 / Alta 258 / Ultra 173 fps), CPU frenada 6×, SwiftShader y desglose de costos | IMPLEMENTADO (doc) | `11-rendimiento-sin-iris-xe.md` | La Iris Xe es **estimación**, no medición |
| **Tabla de calidad recalibrada**: Baja sin sombra de sol; Media con DPR 1, sin MSAA y sombra 1024; Alta con DPR 1.5. La sombra se recalcula cada N cuadros (y al mover la cámara). Los programas se precompilan antes de la primera habilidad. | IMPLEMENTADO | `engine/core/perf.ts`, `rupturas/main.ts` | Media: 57 draw calls (antes ~120) y 203k triángulos; se ve casi igual a Alta. Baja: 49 draw calls y 106k triángulos. 60 FPS con vsync. |

**Pruebas:** 121/121 y typecheck limpio.


## 2d. Publicado (2026-10-09, autorizado por el dueño)

- **Juego:** 5 commits en `main` (`4e9a3b3`…`92d8acf`), desplegados en Pages. En vivo: carga sin errores, `rupturas.html` corre a 60 FPS y el service worker trae `&art=…&tiers=full`.
- **Repo de arte:** `Ragosorio/nolc-arte` (público, Pages por Actions), en https://ragosorio.github.io/nolc-arte/. 86 SVG completos, con el manifest `tree:<hash>`. Revisa cada 6 h y solo publica si `cats-svg` cambió.
- **Variable** `NOLC_ART_BASE_FULL=https://ragosorio.github.io/nolc-arte/` en el repo del juego. **dist: 690 MB → 102 MB.** Para revertir: `gh variable delete NOLC_ART_BASE_FULL -R Ragosorio/no-one-like-cats` y redesplegar.
- **Codex:** el **Lote D** (14 gatos de la Oleada 1) ya está en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`: manifest, prompts compilados, PROGRESO, la rareza `Evolución` y el lote `d` en las herramientas. Respaldo previo en `_respaldos/2026-10-09-antes-lote-d/`. La orden para Codex es «Haz el lote D». Cuando el dueño apruebe los PNG, Claude los convierte a SVG + rig + `content.json` (elemento Cristal incluido) y ahí se ven en el juego.


## 2e. El puente en el juego real: Oleada 1 «La Marea Imposible» (2026-10-09, noche) — SIN PUBLICAR

**Decisión del dueño:** no se agrega ninguna vista. La Parte II entra al juego de siempre después de H30 «Fin». Diseño y contratos en `12-puente-oleada-1.md`; guion completo H31–H62 en `13-guion-parte-ii.md`.

| Pieza | Estado | Dónde | Verificación |
|---|---|---|---|
| Fusión de contenido solo-agregar (Parte II en archivos propios) | IMPLEMENTADO | `data/mergeContent.ts`, `data/rupturas/{especies,historia}.json`, `content.ts` | Tests: no puede pisar la Parte I ni reusar ids |
| **Arte Lote D**: 14 SVG completos + 14 lite + 14 rigs | IMPLEMENTADO | `public/cats-svg/**`, `catRigs.json`, MAI `exports/game-rigs` | Lab catlive (ojos, orejas, cola). Dudas menores: aro de anteojos de Archivista, fantasmas de Refracta |
| **Elemento Cristal**: afinidad (×1.5 contra Luz y Sonido; Tierra y Naturaleza le pegan ×1.5), PRISMA/REFRACCIÓN/FACETA, bioma de nácar, ícono, 12 especies, recetas, Refracta secreta, Madre Nácar y Bibliotecario bloqueados hasta la historia | IMPLEMENTADO | `battle/cristal.ts` + hooks; `especies.json`; `resonance.ts`… | `tests/crystal.test.ts` (22). La familia Cristal pierde ~90 % contra la familia Fuego en barco de madera: **revisar balance** |
| **Historia H31–H38** + 8 beats + 5 batallas (`ruptura_*`) + parche + REGISTRO 000 (Catdex, folio, Diario, chat del casino) + meta `wins_with_species` | IMPLEMENTADO | `historia.json`, `state/sys/rupturas.ts`, `ui/story/rupturasScript.ts`, `story.ts`, `text.ts`, `Catdex.ts` + `collection/registro000.ts`… | `tests/rupturasStory.test.ts` (8); verify-missions 135 OK; batallas con sims (30–32/32 victorias); headless hasta la batalla de Páginas |
| **Formas**: Canelo Almirante (+Agua, Poder ×1.12, ulti «¡A BABOR!»), Astral sellada | IMPLEMENTADO | `data/rupturas/formas.ts`, `state/sys/forms.ts`, `app/formsFlow.ts`, `catSlug()`, CatPanel | `tests/forms.test.ts` (16); paridad sim/estimación |
| NOVEDADES «PARTE II · La Marea Imposible» (sin spoilers) | IMPLEMENTADO | `data/updates.ts` | — |
| Integración | VERIFICADO | — | 171/171 tests, typecheck, build OK sin raster. Headless: `post-finale` recibe H31 y el beat de Luzterna; `late-game` no recibe nada |

**Pendientes conocidos:**
- Las victorias de duelo y Podio no cuentan para H37.
- No existe la regla del Bibliotecario de «Sonido le pega doble».
- `nameCat.ts` sigue mostrando solo FOLIO 001.
- Balance Cristal contra Fuego.
- Al publicar, las 14 pinturas completas nuevas deben llegar al sitio de arte: el deploy solo avisa y el cron las sube en ≤ 6 h, o se corre `publish.yml` a mano.


## 2f. Islas 3D, arco de Canelo, balance y regla del Sonido (2026-10-10) — SIN PUBLICAR

**Pedido del dueño:** balancear, mejorar las misiones de Canelo, implementar la regla del Sonido, islas nuevas en 3D con todo lo que se habló, y solo en la Parte II. Las animaciones de Archivista y Refracta quedan como están por ahora.

| Pieza | Estado | Dónde | Verificación |
|---|---|---|---|
| **Motor de regiones 3D dentro del juego** | IMPLEMENTADO | `engine/world/World3D.ts`, `scenes/RegionScene.ts`, `regions/{index,types,shapes,life}.ts`, `app/flow.ts goRegion`, `core/App.ts` (Pixi `backgroundAlpha: 0.999` para que el 3D se vea debajo) | `three` y las regiones **no se cargan en la portada** (0 chunks 3D de 117 JS, en el build de producción). La Parte I se ve idéntica (capturas de la carta). Entrar y salir de las regiones 3–7 veces sin fugas de GPU |
| **Cinemática «El reflejo»** (H31): de noche, la isla de libros existe solo reflejada en el agua | IMPLEMENTADO | `regions/reflejo.ts` | Capturas |
| **Isla de las Páginas Hundidas** | IMPLEMENTADO | `regions/paginas.ts` + `regions/paginas/*` | Ver abajo |
| **Isla Nácar** | IMPLEMENTADO | `regions/nacar.ts` + `regions/nacar/*` | Ver abajo |
| **Carta: «Mar de las Rupturas»** (hoja pegada; «Aquí no hay nada» tachado y corregido a «Siempre estuvo aquí»; las islas aparecen con su flag `region:<id>`; «!» de misión) | IMPLEMENTADO | `scenes/MapScene.ts` | Captura: sin Parte II, la carta queda igual |
| **Oleada 1 renumerada H31–H41 con el arco de Canelo**: H36 la página de su Eco, H37 3 victorias en cualquier modo, H38 Canelo da el golpe final (`final_blow`, determinista en pantalla y estimación) | IMPLEMENTADO | `historia.json`, `rupturas.ts`, `rupturasScript.ts`, `battle/sim.ts`, `campaign.ts`, `podio.ts` | Tests; E2E: entrar a Páginas completa H33 y activa H34 |
| **Balance de Cristal**: 75 % → 56 % de victorias promedio | IMPLEMENTADO | `battle/cristal.ts`, `especies.json` | `docs/part-ii/15-balance-cristal.md`, `scripts/balance-crystal.ts` |
| **Regla del Sonido / RUIDO** (Bibliotecario) | IMPLEMENTADO | `battle/ruido.ts` | Tests de paridad; sims 31/32 y 32/32 |
| Correcciones del motor: mapa de sombras al cambiar de calidad, región que se libera si sales a medio cargar, casas y orillas para los gatos, arnés sin tope de 30 FPS | IMPLEMENTADO | `World3D.ts`, `RegionScene.ts`, `scripts/headless-shot.mjs` | — |

**Detalle de Cristal:**
- La causa era la faceta reflectora, no debilidad: con ella apagada, Cristal caía a 33–42 %.
- Contra 12 de 13 familias queda dentro del rango normal de la Parte I. Sonido es la excepción a propósito (×1.5).
- Contra Fuego en barco de madera pierde (16 %), como casi todas las familias de la Parte I. Con un gato de Agua en la tripulación sube a 33–42 %.

**Integración:** 200/200 tests, typecheck limpio, `verify-missions` 138 OK y build OK.

**Pendiente:**
- Animación del aro de los anteojos de Archivista y de los fantasmas de Refracta (el dueño dice «lo vemos luego»).
- Las victorias del Podio no cuentan para H38 (no distingue K.O. de decisión).
- `nameCat.ts` sigue mostrando solo FOLIO 001.
- **Publicar requiere autorización** y subir el arte nuevo a `nolc-arte`.


## 2g. Pendientes cerrados (2026-10-09) — SIN PUBLICAR

Objetivo del dueño: cero pendientes de la Oleada 1 antes de publicar.

| Pendiente | Cómo se cerró | Dónde | Verificación |
|---|---|---|---|
| **El Podio no distinguía K.O. de decisión** (H38) | El duelo dice cómo terminó: `finish` (`'ko'` o `'decision'`) y `koBy`. En un 1 contra 1, todo el daño que recibe el rival es del gato del jugador (golpes, quemadura, raíz, invocación), así que su K.O. es el golpe final. La decisión de los jueces y rendirse no cuentan. `applyDuel(…, ko)` suma `canelo_final_blow` y la tarjeta dice «noqueó al…» o «le ganó por decisión a…». Los duelos de isla ya usaban `sim.finalBlow`. | `podio/engine.ts`, `state/sys/podio.ts` (`applyDuel`, `PodioLoot.ko`), `scenes/PodioScene.ts`, `podio/results.ts` | 2 tests nuevos (motor determinista; K.O., decisión y derrota). Headless: 4 duelos de Canelo cumplen H37 y H38 en el Podio |
| **`nameCat.ts` solo mostraba FOLIO 001** | Desde H32, arriba de «FOLIO 001 · NOMBRE» aparece «FOLIO 000 — ~~vacante~~». Usa el mismo helper que el cartel de género (`folio000Line`, ahora en `nameCat.ts`) | `ui/story/nameCat.ts`, `ui/story/profile.ts` | Captura headless (Ajustes › Tu perfil › Cambiar) |
| **El aro de los anteojos de Archivista se doblaba al parpadear** | **Párpado elíptico**: 5º valor opcional en la caja del ojo (`lid`, en px). Solo baja la franja fina pintada justo encima del contorno del ojo, así que el aro queda rígido y el párpado se cierra igual. Es opcional: los demás rigs no cambian y el snapshot de paridad sigue igual | `art/puppetCore.ts`, `data/catRigs.json` y MAI `exports/game-rigs/archivista_scholar_cat.rig.json` | Lab catlive headless: el diff abierto/cerrado cae solo dentro de los lentes. Parpadeo y sueño revisados a tamaño de juego |
| **Los fantasmas de Refracta se movían con la cabeza y la cola** | `pins`: elipses que ni la cabeza, ni las orejas, ni la cola arrastran. Van sobre las caras de los fantasmas, lejos de la cabeza real. La oreja derecha es más estrecha (`halfWidth` 36 → 22). Antes, la cola arrastraba la cara magenta y la oreja cian giraba con la oreja real | `art/puppetCore.ts`, `catRigs.json` y MAI `refracta_prism_cat.rig.json`; el overlay de `CatLiveLab` dibuja pins y párpados | Diffs de pose (mirar, oreja, cola, feliz): las caras de los fantasmas quedan quietas |
| Mapa de suplentes (`STAND_IN`) en `rupturas.ts` | Borrado: las 12 especies existen. El test exige que exista cada especie de tripulación y de premio | `state/sys/rupturas.ts`, `tests/rupturasStory.test.ts` | — |
| La revelación de premios de historia decía «RESONANCIA Nº 001» | Ahora dice «RECOMPENSA DE LA HISTORIA» | `app/storyFlow.ts` | Captura headless |
| TODO, FIXME, placeholder o stub en archivos de la Parte II | No quedaba ninguno | `regions/`, `RegionScene`, `rupturas.ts`, `formsFlow`, `forms.ts`, `data/rupturas` | grep |

**Recorrido completo de la Oleada 1** (headless, juego real, fixture `post-finale`), sin bloqueos:
1. H31: tocar el faro y ver la cinemática «el reflejo».
2. H32: abrir la ficha REGISTRO 000 en el Catdex.
3. H33: abrir la carta, ver la hoja «Mar de las Rupturas» y entrar a Páginas.
4. H34 y H35: batallas jugadas con la IA del juego del lado del jugador.
5. H36: la página de Canelo.
6. H37 y H38: en el Podio, ganando por K.O.
7. Revelación de Canelo Almirante.
8. H39: puzle del haz (un clic real y luego `__nacar.solve()`) y su batalla.
9. H40 y H41.
10. Cierre: «CONTINUARÁ: EL CIELO DESPIERTA».

**Pruebas:** 215/215, typecheck limpio y `verify-missions --all` con 138 OK.

**Sigue abierto:**
- **Publicar:** necesita la autorización del dueño, y hay que subir las pinturas nuevas a `nolc-arte`.
- **Detalles de la Parte I vistos en el recorrido** (no son de la Parte II):
  - La revelación del primordial de un jefe en `ResultsScene` también dice «RESONANCIA Nº 001».
  - Después de cada batalla aparece el aviso de gsap «Invalid property alpha set to 0».
  - En ventanas que no son 16:9, los carteles de SET COMPLETO dejan franjas sin cubrir a los lados.
  - La silueta del GATO CALLEJERO se dibuja encima del panel del Catdex.
  - En el cartel «¿CÓMO TE LLAMAS?», el título toca el subtítulo.


## 2h. PUBLICADO (2026-10-09, autorizado por el dueño)

- **Commits:** `017cc93` (arte del Lote D) y `bcf7850` (Parte II + niveles hasta 100 + pantallas), en `main`.
- **En vivo:** build `bcf7850-20261009T2152`.
- **Sitio de arte:** 100 SVG completos (manifest `tree:ebcbeab…`).
- **Verificado:**
  - La portada carga sin errores y sin chunks 3D.
  - El arte nuevo responde 200 en las versiones completa y lite.
  - Tests 215/215 y verify-missions 138 OK.
- **NOVEDADES:**
  - «Nivel 100 (y pantallas que ya caben)»: la ven todos.
  - «PARTE II · La Marea Imposible»: no destripa la historia a quien no ha terminado.
- **Problemas de la Parte I que aparecieron durante la prueba completa (cerrados):**
  - el texto «RESONANCIA Nº 001» en la recompensa de jefe;
  - el aviso de gsap «alpha» en endScreen;
  - el microevento del gato callejero que se dibujaba sobre los paneles;
  - el título «¿CÓMO TE LLAMAS?» pegado a su subtítulo;
  - los consejos del Podio con el tope por estrellas.

## 3. Resultados verificados del slice (headless, M4, Alta, 1600×900)

**Rendimiento** (vsync limita a 60):
- 60 FPS; p50/p95/p99 = 16.7/16.7/16.8 ms.
- 0–3 cuadros largos durante la carga.
- 76–158 draw calls; 340k–460k triángulos; heap de 30–63 MB.

**Vida ambiental** (`__rupturas.cast()`):
- **Con lluvia:**
  - Canelo **"duerme bajo su palmera mientras llueve"**.
  - Cometín y Nimbo se refugian junto a él.
  - Gelatino **baila bajo la lluvia**.
  - Ignis sigue en su spa de lava.
- **Con tormenta:** Nimbo persigue a Cometín, Chispa se refugia y los rayos sorprenden a todos menos al de Tormenta.
- **De noche:** Cometín **"mira estrellas que caen hacia ARRIBA"**.
- **En general:** persecuciones con cambio de roles, saludos que chocan cabezas, nado y Chispa derritiendo la nieve de Copito.

**Habilidad:**
- ZARPAR o COLAPSO: el barco navega hasta la balsa de práctica.
- Astraprima se agacha (anticipación) y lanza la estrella en arco.
- Se abre la singularidad con su disco de acreción, que atrae las cajas **y las balas que la balsa dispara de vuelta** ("ABSORBIDO").
- Viene hit-stop, flash y onda expansiva; la balsa se desarma; aparecen −1.240 / −620 / CASCO ROTO.
- La balsa se repara a los 8 s.

**REGISTRO 000:** de noche, sobre un peñasco al oeste, como silueta de estática. Desaparece si te acercas a menos de 22 u. Al tocarlo se abre su ficha y se desvanece con un glitch.

**Luzterna:** aparece en la galería del faro al atardecer y de noche. El haz barre el mar.

**Capturas:** quedan fuera del repo (no se permite raster en el repo), en el scratchpad de la sesión: `F2` ficha de Canelo, `F3` atardecer, `18` faro de noche, `22` REGISTRO 000, `G1`/`G2` Colapso, `G3` lluvia. Para regenerarlas, usar `scripts/headless-shot.mjs`.

**Bugs encontrados y corregidos en la sesión:**
- Gatos diminutos: escala ×1.55 y cámara más cerca.
- Brillos toon que formaban "placas" crema en el mar: máscara de ruido y fundido con la distancia.
- Olas demasiado altas.
- Haz del faro invisible: apuntaba horizontal y su zona brillante era la punta delgada.
- REGISTRO 000 bajo el agua: se le puso un peñasco.
- **El océano transparente pintaba encima de los efectos aditivos.** Regla nueva: lo transparente encima del agua lleva `renderOrder` ≥ 3.
- Los gatos que huían terminaban en el borde de la isla.

## 4. Qué NO se pudo verificar

- **Rendimiento en Intel Iris Xe u otra GPU integrada de PC.** Solo se midió en M4. Ese es el piso que define 02 §8.
- **Navegadores:** Firefox y Safari no se probaron. WebGL2 debería funcionar.
- **La partida real del jugador:** el slice no la lee (por diseño). El puente de solo lectura es el paso 1 de 07 §7.
- **Las capturas son headless:** sin interacción humana real. El arrastre de cámara y el teclado se probaron por código y no con un mouse físico.
- **Accesibilidad:** foco y lectores de pantalla no se auditaron más allá de los `aria-label`.

## 5. Limitaciones conocidas del slice (pulido pendiente)

- El pasto y las frondas se ven gruesos y dentados a menos de 10 u. Faltan textura de hoja y LOD.
- El disco del Colapso satura a blanco; conviene bajar el aditivo y meter color.
- El barco es pequeño al lado de Astraprima. Se escaló ×1.7, pero el casco sigue siendo un placeholder low-poly.
- La espuma de cresta todavía forma manchas suaves en mar abierto.
- Los gatos no tienen patas animadas: caminan con bob e inclinación. Ver 08 §5 (regiones de patas en el rig).
- La UI del slice es DOM, no Pixi. La integración con dos canvas es el paso 2 de 07 §7.
- Los gatos solo cargan la versión **lite** de su SVG (512 px). Falta pedir la full al hacer zoom, como en Pixi.
- Arrancar con calidad Baja usa menos segmentos de agua y terreno, pero cambiar ese detalle en caliente exige recargar (está avisado en Ajustes).

## 6. Siguiente trabajo, en orden (cada uno se puede hacer sin intervención salvo donde se indica)

1. ~~Puente de solo lectura~~ **HECHO** (§2b). Pendiente: mostrar también TUS hábitats y edificios, no solo los gatos.
2. ~~Medir en Iris Xe~~: el dueño no tiene ese equipo. Se reemplazó por la emulación de `11`. Si algún jugador lo tiene, la línea F3 sigue sirviendo.
3. **`RegionDef` + `WorldStream`** (07 §5), con un segundo islote (Páginas Hundidas) para probar el streaming y la transición de capa.
4. **Lentes de material de PaperCat** (cristal, oro, tinta): son la base técnica de los Ecos (05 §7.2).
5. **Afordancias en props y hábitats** (spots) + "momentos" (05 §8.2) + 12 hábitats más.
6. **Vista Rupturas dentro del juego**, con dos canvas apilados (07 §7, paso 2).
7. **Hosting decidido** (2º repo de Pages, mismo origen; doc `09`). Falta la **aprobación para publicar**: crear `Ragosorio/nolc-arte`, commit y push del juego, y configurar `NOLC_ART_BASE_FULL`.
8. ~~Revisar el eje de Distraxia y las facciones~~ **APROBADO por el dueño** (2026-10-09).

## 7. Archivos tocados en esta sesión (para revisar el diff)

```
game/package.json, package-lock.json      + three@0.186.1, @types/three@0.186.0 (dev)
game/vite.config.ts                       2ª entrada: rupturas.html
game/rupturas.html                        NUEVO
game/src/art/puppetCore.ts                NUEVO (extraído de livingCat.ts)
game/src/art/livingCat.ts                 CatPuppet como adaptador (API pública igual)
game/src/engine/**                        NUEVO (AgentGameEngine runtime)
game/src/rupturas/**                      NUEVO (contenido del slice)
game/src/state/sys/shop.ts                orbes (agente de economía)
game/src/data/updates.ts                  NOVEDADES orbes
game/src/panels/shop/tabs/orbs.ts         texto de ayuda de orbes
game/tests/engine.test.ts (+ __snapshots__), tests/orbPricing.test.ts   NUEVOS
game/scripts/headless-shot.mjs            NUEVO
docs/part-ii/**                           NUEVO
```
