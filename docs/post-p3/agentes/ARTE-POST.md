# ARTE-POST · estado del agente

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo: pintar (Codex), revisar, vectorizar (MAI SVG), riggear e integrar SOLO los archivos de arte de los 98 gatos del lote post-P3. Sin commits ni push. Nunca el puerto 5173. Nada raster en el repo. No toco `game/src/data/postp3/especies.json`.

## Qué estoy haciendo
Nada: **mis 18 Multidimensionales están integrados** y la cola de Codex terminó (2026-10-28, 23:20).
- **Reparto del coordinador desde las 23:00:**
  - ARTE-POST (yo): pinta toda la cola y lleva hasta el juego 18 xp (gomitas, kagebunyan, gatojo, ryumiau, yugi, miaang, ssssmichi, zoomic, michimpostor, esponja, rick, miauby, blumiau, gatogro, grru, miaunion, michipulin y condorgato).
  - ARTE-POST-B: los otros 25 xp.
  - ARTE-POST-C: los 38 mp_/lp_/hp_.
  - Cada uno lleva su estado en su propio archivo.
- **Modelo:** solo `gpt-5.6-luna` con `model_reasoning_effort=max`, fijado en `gen.sh` por el coordinador (el `gpt-6-luna` que se pidió primero no existe para esta cuenta: error 400 `model_not_found`). Prueba: `lote-post-p3/revision/prueba-luna.jpg`.
- **Cola Luna:** 79 + 2 de prueba. Salieron 79; 2 bloqueados (xp_esponja y xp_gatogro, ambos míos) pasaron con plan B en v2. 0 reservas usadas.

## Tanda 2 (2026-10-29)
- **Encargo** (coordinador, pedido del dueño): 25 Multidimensionales más, preparados por DISEÑO-2. Están en `COLA-tanda2.txt` y en el seguimiento con estado PENDIENTE.
  - Yo pinto los 25 con `gpt-5.6-luna` en max.
  - Llevo hasta el juego estos 13: xp_sombreronron, xp_gatejo, xp_maullorona, xp_quetzalgatl, xp_bastet, xp_cleogatra, xp_bonapata, xp_leonardo, xp_perla, xp_miauton, xp_miauzart, xp_miausagi y xp_tanjimiau.
  - ARTE-POST-B hace los otros 12.
  - **No se corre `postp3-sync`** hasta que DISEÑO-2 termine el roster: integro solo el arte. Los tests de arte pueden quejarse mientras tanto.
- **Estado** (29-oct, 10:35): **mis 13 están en el juego.** Cada uno tiene completo, lite, manifiestos, rig con su copia MAI, pin al sitio 1, sync hecho y títeres revisados en catlive.

| id | Gato | slug | Completo (preset · MB) | Lite | Intento |
|---|---|---|---|---|---|
| xp_sombreronron | El Sombreronrón | `sombreronron_braid_cat` | balanced · 1,53 | 711 KB | v1 |
| xp_gatejo | El Gatejo | `gatejo_twospirit_cat` | balanced · 2,37 | 1023 KB | v1 |
| xp_maullorona | La Maullorona | `maullorona_veil_cat` | balanced · 1,46 | 695 KB | v1 |
| xp_quetzalgatl | Quetzalgatl | `quetzalgatl_feather_cat` | balanced · 2,18 | 1030 KB | v1 |
| xp_bastet | Bastet | `bastet_sun_cat` | high · 2,46 | 433 KB | v1 |
| xp_cleogatra | Cleogatra | `cleogatra_rug_cat` | high · 3,49 | 601 KB | v2 (la v1 tenía la pata cortada por el borde) |
| xp_bonapata | Napoleón Bonapata | `bonapata_bicorne_cat` | balanced · 0,91 | 426 KB | v1 |
| xp_leonardo | Leonardo da Michi | `leonardo_codex_cat` | balanced · 1,85 | 859 KB | v1 (MAI colapsó con lanczos3; se repitió con mitchell) |
| xp_perla | La Michi de la Perla | `perla_turban_cat` | balanced · 1,08 | 536 KB | v1 |
| xp_miauton | Isaac Miauton | `miauton_apple_cat` | balanced · 1,64 | 718 KB | v1 |
| xp_miauzart | Miauzart | `miauzart_prodigy_cat` | balanced · 1,75 | 762 KB | v1 |
| xp_miausagi | Miausagi | `miausagi_moon_cat` | balanced · 1,80 | 809 KB | v1 (sin plan B) |
| xp_tanjimiau | Tanjimiau | `tanjimiau_box_cat` | high · 3,80 | 637 KB | v1 |

  - **Totales:** completo 26,3 MB y lite 9,2 MB. Los 25 se pintaron con Luna, sin bloqueos ni copias cruzadas.
  - **Detalles:**
    - p11 se reanudó a mano tras el EINTR de MAI (`scratchpad/post/p11-reanudar.sh`).
    - Los 9 de p11 que pedían balanced entraron primero en high y se cambiaron por el balanced con `integrar.py --force` (mismo slug).
    - **Miauton:** la manzana se deformaba en catlive al mirar a un lado. Ahora la cabeza es más baja y la manzana va con pin + float; lo revisé con overlay, sin volver a catlive.
  - **Archivos:**
    - títeres: `revision/titeres-catlive-4.jpg` (la fila de Miauton muestra el rig anterior);
    - hojas de contacto rehechas a las 10:45: `md-a.jpg` (36/36), `md-b.jpg` (49/49), `miticos.jpg` (20/20), `legendarios.jpg` (10/10) y `heroicos.jpg` (8/8). El seguimiento da 123 titulares aprobados y 1 retirado (Miaurlina); disco libre 6,8 GB.
  - **Contexto:** la máquina estuvo sobrecargada (swap llenando el disco). Todo lo pesado pasó por `scratchpad/briefs/pesado.sh`, con pausas cuando había menos de 6 GB libres. Ya no tengo servidores ni Chrome abiertos.
  - **Nunca** correr `generar.py --arte-todo`: borraría las correcciones a mano.

## Progreso
- **2026-10-28 23:20 · mis 18 xp en el juego** (tandas de 11 y 7, avisadas al coordinador):

| id | Gato | slug | Completo (preset · MB) | Lite | Intento | En el juego |
|---|---|---|---|---|---|---|
| xp_gomitas | Gomitas D. Michi | `gomitas_rubber_cat` | balanced · 1,45 | 694 KB | v1 | sí |
| xp_kagebunyan | Kagebunyan | `kagebunyan_clone_cat` | balanced · 1,45 | 688 KB | v1 | sí |
| xp_gatojo | Gatojo | `gatojo_pose_cat` | high · 3,35 | 568 KB | v1 | sí |
| xp_ryumiau | Ryumiau | `ryumiau_notebook_cat` | balanced · 1,87 | 781 KB | v1 | sí |
| xp_yugi | Yugi Miauto | `yugi_duel_cat` | high · 4,20 | 702 KB | v1 | sí |
| xp_miaang | Miaang | `miaang_airbender_cat` | high · 3,01 (desde 700 mitchell) | 598 KB | v1 | sí |
| xp_ssssmichi | Ssssmichi | `ssssmichi_blocky_cat` | high · 2,54 | 520 KB | v1 | sí |
| xp_zoomic | Zoomic | `zoomic_speed_cat` | high · 3,37 | 710 KB | v1 | sí |
| xp_michimpostor | Michimpostor | `michimpostor_bean_cat` | high · 2,62 | 470 KB | v1 | sí |
| xp_esponja | Michi Esponja | `esponja_sponge_cat` | high · 3,19 | 513 KB | v2 (plan B) | sí |
| xp_rick | Rick Michez | `rick_portal_cat` | high · 3,10 | 570 KB | v1 | sí |
| xp_miauby | Miauby-Doo | `miauby_mystery_cat` | high · 2,11 | 382 KB | v1 | sí |
| xp_blumiau | Blumiau | `blumiau_clue_cat` | high · 2,81 | 452 KB | v1 | sí |
| xp_gatogro | Gatogro | `gatogro_swamp_cat` | high · 3,17 | 539 KB | v2 (plan B) | sí |
| xp_grru | Grrrú | `grru_freezeray_cat` | high · 2,93 | 508 KB | v1 | sí |
| xp_miaunion | Miaunion | `miaunion_goggle_cat` | high · 3,30 | 506 KB | v1 | sí |
| xp_michipulin | El Michipulín Colorado | `michipulin_red_cat` | high · 3,27 | 526 KB | v1 | sí |
| xp_condorgato | Condorgato | `condorgato_ruff_cat` | high · 2,67 | 449 KB | v1 | sí |

  - **Totales de los 18:** completo 50,4 MB y lite 10,2 MB.
  - Títeres revisados en catlive (puerto 5212, ya detenido); hojas en `revision/titeres-catlive-2.jpg` y `-3.jpg`.
  - Corrí `postp3-sync.mjs` y luego `npx vitest run`: 1358 pasan, 0 fallas.
- **Hojas** (`contacto.mjs`, todas rehechas al final, 23:25): `md-a.jpg` (32/32 aprobados), `md-b.jpg` (27/28), `miticos.jpg` (20/20), `legendarios.jpg` (10/10) y `heroicos.jpg` (8/8). El seguimiento da 97 titulares aprobados, 1 en reintento (de B) y 1 retirado (Miaurlina).
- **Disco:** 10 GB libres. `lote-post-p3` ocupa 1,0 GB y `~/.codex/generated_images` 519 MB (no se borró nada).
- **Avisos:**
  - **mp_brasanaranja v1** es una copia del crudo de mp_basalto: Luna copió el archivo de la sesión vecina. Su imagen real se recuperó de su propia carpeta como `_crudos/mp_brasanaranja_v2.png`, con `cp -n`; no cuenta como reintento.
  - Para detectar esto escribí `herramientas/verificar-copias.sh`: compara la sesión de cada log con la carpeta de donde se copió el crudo, y busca crudos repetidos.
  - `integrar.py` ahora acepta `--only=id,id` (tres agentes a la vez).
  - Todo lo compartido va con `herramientas/lock.sh`.

- **17 de 98 terminados**, ya integrados en el juego como arte: pintados, revisados, vectorizados (completo + lite), con rig y revisados como títeres en `?scene=catlive`.
- Los 17 pasaron a la primera: 0 bloqueos, 0 reintentos, 0 reservas.
- **Hojas de contacto** (fuera del repo; se rehacen con `contacto.mjs`), en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/lote-post-p3/revision/`:
  - `md-a.jpg`: 13 de 32 aprobados;
  - `md-b.jpg`: 4 de 28;
  - `miticos.jpg`, `legendarios.jpg` y `heroicos.jpg`: todavía vacías;
  - `titeres-catlive-1.jpg`: los 17 títeres en 10 estados (reposo, parpadeo, mirar a la izquierda y a la derecha, caminar, dormir, feliz, dolor, ataque y bostezo).

| id | Gato | slug | Completo (preset · MB) | Lite |
|---|---|---|---|---|
| xp_ahab | Capitán Ahabigotes | `ahab_harpoon_cat` | balanced · 2,18 | 863 KB |
| xp_frankengato | Frankengato | `frankengato_patch_cat` | balanced · 1,90 | 701 KB |
| xp_gatoneta | María Gatoñeta | `gatoneta_cake_cat` | balanced · 2,24 | 937 KB |
| xp_gatote | Don Gatote de la Mancha | `gatote_lance_cat` | high · 3,65 | 540 KB |
| xp_gatula | Conde Gatula | `gatula_cape_cat` | balanced · 1,81 | 725 KB |
| xp_michiatom | Michi Atom | `michiatom_striker_cat` | high · 3,75 | 588 KB |
| xp_pegaso | Michi de Pegaso | `pegaso_bronze_cat` | high · 4,70 (balanced daba MAE 13,2) | 784 KB |
| xp_pinomichi | Pinomichi | `pinomichi_wood_cat` | high · 3,82 | 544 KB |
| xp_sherlock | Sherlock Ronrones | `sherlock_deerstalker_cat` | balanced · 1,73 | 678 KB |
| xp_unzarpazo | Un Zarpazo | `unzarpazo_bored_cat` | high · 2,28 (MAI colapsó con lanczos3; se repitió con mitchell) | 426 KB |
| xp_barril | El Michito del Barril | `barril_barrel_cat` | high · 2,96 | 510 KB |
| xp_daftmiau | Daft Miau | `daftmiau_helmet_cat` | high · 2,96 | 531 KB |
| xp_gatoleone | Don Gatoleone | `gatoleone_rose_cat` | high · 2,53 | 420 KB |
| xp_gemichi | Gemichi | `gemichi_twin_cat` | high · 2,81 | 481 KB |
| xp_mazingato | Mazingato Z | `mazingato_robot_cat` | high · 3,71 | 664 KB |
| xp_miaubody | Mr. Miaubody | `miaubody_bowtie_cat` | high · 2,29 | 389 KB |
| xp_miaunya | Miaunya | `miaunya_telepath_cat` | high · 3,03 | 513 KB |

**Totales de los 17:** completo 48,4 MB y lite 10,3 MB.

## Hecho
- **Integrado en el juego** (solo arte, sin commit):
  - 17 completos en `game/public/cats-svg/` y 17 lites en `cats-svg/lite/`;
  - entradas nuevas en `game-export.json` y `lite/game-thumbs.json` (160 → 177, ninguna vieja cambió);
  - 17 rigs en `game/src/data/catRigs.json` (161 → 178) y sus copias en `~/Desktop/MAI SVG/exports/game-rigs/<slug>.rig.json`;
  - los 17 fijados al **sitio 1** (`nolc-arte-2`) en `game/src/art/artShardPins.ts`, en un bloque entre marcadores `// post-P3 (ARTE-POST…)` y `// fin post-P3` que regenera `integrar.py`.
- **Tests:**
  - `tests/artBase.test.ts`: suponía que todo pin era 0; ahora acepta pines a 1 y exige que un pin a 1 conserve su URL cuando se abra un 3er sitio.
  - `tests/catArtIntegrity.test.ts`: bloque nuevo «post-Parte III art» para todo lo fijado al sitio 1. Revisa bytes = manifiesto, cero `<image>` y cero scripts, MAE del lite < 22 y que el rig esté sano.
  - `npx tsc --noEmit` limpio. En `npx vitest run`, todo lo de arte pasa. Fallan 6 tests de `tests/postp3.test.ts` (campeones del Podio y «especies.json vacío»), que no son de arte: es el trabajo en curso del coordinador.
- **Herramientas** en `arte-nuevo/lote-post-p3/herramientas/`, copias adaptadas; las de `_p3v2` no se tocaron:
  - `gen.sh` y `cola.sh` (Codex);
  - `vect.sh` y `vect-bal.sh` (MAI);
  - `elegir.mjs` (preset con la regla de la Parte III);
  - `seg.mjs` (seguimiento en `lote-post-p3/seguimiento.json`);
  - `hoja.mjs` (revisión rápida) y `contacto.mjs` (hojas por grupo);
  - `rig-grid.mjs` (cuadrícula + rig sobre la pintura de 700) y `rigput.mjs`, sobre `rigs.json` y `rig-notes.json`;
  - `write_rigs.py` e `integrar.py` (plan; con `--write` integra).
- **Referencias** (`herramientas/anclas.json`, sin tocar el manifest):
  - los originales llevan las 3 referencias de la casa, como pide la sección A de sus prompts (el `_p3v2/gen.sh` no las adjuntaba);
  - anime, libros, pop, superhéroes y píxel llevan su ancla de la Parte III (Super Siamés, Harry Gatter, Billie, Gato Araña y Comecroquetas);
  - el resto, solo su lock.
- **Cambio de Merlina** (aviso del coordinador): `xp_miaurlina` nunca se pintó y quedó `RETIRADO` en el seguimiento. `xp_michiercoles` (`michiercoles_cello_cat`) ya está en la cola pendiente; su prompt existe y `gen.sh` lo arma bien (probado en seco).
- Servidor `arte-post` (puerto 5212) agregado a `.claude/launch.json`. Lo usé para catlive y ya lo detuve.

## Falta
- De ARTE-POST: nada. La cola terminó, ninguno de mis gatos quedó bloqueado y no se usaron reservas.
- De otros agentes:
  - ARTE-POST-B: sus 25 xp.
  - ARTE-POST-C: los 38 originales (16 ya vectorizados en p5/p6/p7; ver su archivo).
  - El dueño revisa las hojas.
- Si vuelve a hacer falta pintar: el modelo es solo `gpt-5.6-luna` en max; nunca otro.

## Cómo retomar
Todo se corre desde `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`:
- **Estado:** `node lote-post-p3/herramientas/seg.mjs resumen` (o `list PENDIENTE`). Por ola: `lote-post-p3/logs/estado.tsv` y `logs/cola-*.txt`.
- **Pintar:** `./lote-post-p3/herramientas/cola.sh 6 $(cat lote-post-p3/logs/cola-pendientes.txt)`. Correrlo en segundo plano: si Codex vuelve a su límite, se detiene solo y reescribe `cola-pendientes.txt`.
  - Un gato suelto: `./lote-post-p3/herramientas/gen.sh <id> <N>`. Nunca pisa un crudo.
  - Con `DRY=1` solo muestra las referencias y el prompt.
- **Revisar:** `node lote-post-p3/herramientas/hoja.mjs <salida.jpg> --cols 3 --cell 330 <etiqueta>=lote-post-p3/<id>.png …`. Después:
  - aprobado: `seg.mjs set <id> estado=APROBADO png=lote-post-p3/<id>.png "intento=v1 OK" "nota=…"`;
  - plan B: agregar la línea a `corrections_en` del id en `manifest.json`, correr `node herramientas/compilar.mjs <id>` y `gen.sh <id> 2`.
- **Vectorizar:**
  1. `cd lote-post-p3 && ./herramientas/vect.sh <corrida> <id>=<id>.png=<slug> …` (la corrida es p4, p5…);
  2. `./herramientas/vect-bal.sh <corrida> <slugs de más de 4 MB o de Pinceles>`;
  3. `node herramientas/elegir.mjs`.
- **Rig:**
  1. `node herramientas/rig-grid.mjs <salida.jpg> 700 <slug> <slug>` (con `NORIG=1` sin el rig encima);
  2. `node herramientas/rigput.mjs '{"<slug>":{…}}' '{"<slug>":{notas}}'`;
  3. verificar con `node ../_p3v2/herramientas/integ/overlay.mjs herramientas/rigs.json <salida.jpg> 440 <slug>=work/700/<slug>.png …`.
  - Reglas: la elipse de la cabeza contiene la base de las orejas; la punta de la oreja va ~12 % más allá de la pintada; la cola va de la raíz a la punta.
  - Los props cerca de la cabeza van como `pins`, los objetos sueltos como `floats`, y si hay anteojos o visor se usa el párpado elíptico (5º valor).
- **Integrar:** `python3 herramientas/integrar.py` (plan) y luego `--write`.
- **Títeres:**
  1. `preview_start arte-post` (5212);
  2. `cd <scratchpad>/post/pp && PROF=<scratchpad>/post/prof node states.mjs <dir> <slug,…(≤8)>`;
  3. la hoja con `node ../_p3v2/herramientas/integ/compose.mjs <salida> 150 <dir…>`;
  4. detener el servidor al terminar.
  - El arnés vive en el scratchpad de la sesión `00759032…/scratchpad/post/pp`. Sus `node_modules` apuntan a `scratchpad/arte-integ/pp`.
- **Hojas:** `node lote-post-p3/herramientas/contacto.mjs`.

## Última actualización
2026-10-29 10:40
