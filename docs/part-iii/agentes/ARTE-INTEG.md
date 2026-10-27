# Agente ARTE-INTEG (Parte III: integrar el arte v2 en el juego)

- **Qué estoy haciendo**: nada. **Fase 1 y Fase 2 terminadas y verificadas** (2026-10-27).
- **Hecho (Fase 1, 2026-10-27)**:
  - **Paso 1: 32 gatos copiados** a `game/public/cats-svg/<slug>.svg` (completo) y `game/public/cats-svg/lite/<slug>.svg` (lite). Cero `<image>`, cero scripts. Tabla de slugs abajo.
  - **Paso 2: manifiestos mezclados** (125 → 157 entradas en `game-export.json` y `lite/game-thumbs.json`; ninguna entrada vieja cambió). Los completos `balanced` llevan `"preset": "balanced-color-preserved"` en su entrada (el campo `source` de arriba sigue siendo el preset por defecto).
  - **Paso 3: 32 rigs** en `game/src/data/catRigs.json` (126 → 158) y en `~/Desktop/MAI SVG/exports/game-rigs/<slug>.rig.json` (32 archivos nuevos; verificado: cada MAI reconstruye exactamente su entrada compacta). En el repo de MAI no se commiteó nada ni se tocó otro archivo.
  - **Sir Simón:** la mancha roja del peto pasó a **morado vino** en el completo y en el lite (solo los caminos rojos dentro del peto; mismo tamaño en bytes, manifiesto igual). Herramienta: `recolor.mjs`.
  - **Paso 4: los 32 títeres revisados** en `?scene=catlive`: reposo, parpadeo, mirar a la izquierda y a la derecha, caminar, dormir, feliz, dolor, ataque y bostezo; y solos a 900 px, donde el SVG completo carga (1050 px de textura) sin errores de consola.
  - **Hoja de contacto:** `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/_p3v2/revision/integracion-titeres-catlive.jpg` (35 filas: los 32 y los 3 de la Fase 2, × 10 estados, con rótulos). Copia en el scratch del agente.
  - **Paso 5: hosting (solo local)**, ver la sección «Hosting» abajo: el sitio 0 publica **los mismos 122 archivos, 881,3 MB, con el mismo sha1** que `nolc-arte` hoy; el sitio 1 recibe **38 archivos, 101,4 MB** (los 32 de la Fase 1, los 3 de la Fase 2 y los 3 de la Borracha: Hipólito, Espuma y Dona, que tampoco estaban fijados).
  - **Paso 6: tests.** `npx tsc --noEmit` limpio. `npx vitest run`: **todo en verde** (76 archivos, 993 tests; 2 omitidos; los demás agentes siguen sumando tests). Test nuevo: `game/tests/catArtIntegrity.test.ts` (pares completo/lite, manifiestos = disco, rig ↔ pintura; y para los 35 del arte v2: bytes = manifiesto, sin raster ni scripts, rig sano, Sir Simón en morado y las dos Cerito con el mismo rig). Una corrida intermedia dio 3 fallos en `rarityFinite` mientras GATOS-DATOS editaba datos; al repetir, todo verde.
- **Hecho (Fase 2, 2026-10-27)**: ver «Fase 2» abajo. Tres pinturas nuevas integradas: `cerito_static_cat`, `cerito_fur_cat` e `ito_threads_cat`. Los suplentes de las películas **no se tocaron** (eso es de FILM-CAST).
- **Falta** (de otros):
  1. FILM-CAST: cambiar en `game/src/film/standins.ts` `cerito` → `cerito_static_cat` (Actos I–IV) / `cerito_fur_cat` (final, fundido en F36) e `ito` → `ito_threads_cat`.
  2. GATOS-DATOS: usar los slugs nuevos donde haga falta.
  3. El coordinador: la activación del hosting con la publicación del juego (comandos abajo). **No toqué GitHub.**
  4. El dueño: ver las pinturas nuevas de Cerito e Itō (hoja de contacto, filas 33–35).
- **Cómo retomar**:
  - Herramientas guardadas fuera del repo en `arte-nuevo/_p3v2/herramientas/integ/`:
    - `integrar.py` (plan + copia, `--copy`), `merge_manifests.py` (`--write`);
    - `rigs.json` + `rig-notes.json` → `write_rigs.py` (mezcla en `catRigs.json`; con `--mai` escribe las copias MAI);
    - `recolor.mjs` (la mancha de Sir Simón), `grid.mjs` y `overlay.mjs` (cuadrícula y rig sobre la pintura de 700 px);
    - `pp/states.mjs` y `pp/big.mjs` (capturas de catlive con puppeteer-core; usar el `node_modules` de `scratchpad/qa3/pp` y un perfil `PROF=` propio), `compose.mjs`, `facezoom.mjs` y `crop.mjs` (hojas).
  - Vite propio en el puerto 5192 (nunca el 5173 del dueño).
  - Trampas: los scripts de MAI sobreescriben su JSON de salida (por eso se mezcla); el `rig=1` de catlive dibuja el rig en reposo, no deformado; la base de las orejas debe quedar **dentro** de la elipse de la cabeza (si no, el borde de la oreja se dobla al mirar).
- **Última actualización**: 2026-10-27 07:35.

## Slugs finales (los 32 que entran)

Regla de nombres: slug limpio, sin `_v2`/`_v5`. Ningún archivo del juego usaba esos slugs, así que las versiones finales toman el nombre limpio. Las versiones de comparación (Murciégato v4, Gato Malo v1, El Estambre v1) **no entran**.

Preset: `balanced` si el completo `high` pasa de 4 MB (o es de Pinceles) **y** su MAE queda ≤ 11; si no, `high` (regla de `../arte-v2/05-lote-w1.md`).

| Slug final | Nombre | Grupo | Versión / archivo fuente en `_p3v2` | Preset del completo | Completo (MB · MAE) | Lite (KB · MAE) |
|---|---|---|---|---|---|---|
| `homiau_donut_cat` | Homiau | W1 (piloto) | v1 | high | 2,62 · 4,7 | 415 · 10,1 |
| `murciegato_cowl_cat` | Murciégato | W1 | **v5** (`murciegato_cowl_cat_v5`) | high | 3,33 · 5,0 | 525 · 6,5 |
| `gatarana_web_cat` | Gato Araña | W1 (piloto) | v2 | balanced | 1,84 · 8,2 | 760 · 9,7 |
| `ovillo_yarnarms_cat` | Doctor Ovillo | W1 | v1 | high (balanced da MAE 11,2) | 5,93 · 8,4 | 965 · 10,8 |
| `estambre_yarnstorm_cat` | El Estambre | W1 | **v2** (`estambre_yarnstorm_cat_v2`) | high (balanced da MAE 14,4) | 6,72 · 9,8 | 979 · 13,1 |
| `supersiames_aura_cat` | Super Siamés | W1 | v1 | balanced | 2,36 · 8,4 | 1 008 · 7,8 |
| `harrygatter_wand_cat` | Harry Gatter | W1 | v1 | balanced | 1,63 · 6,2 | 597 · 5,5 |
| `emiau_rapper_cat` | EMIAU | W1 | v1 | high | 3,17 · 7,7 | 562 · 10,5 |
| `gatomalo_bunny_cat` | Gato Malo | W1 | **v2** (`gatomalo_bunny_cat_v2`) | high (balanced da MAE 11,4) | 4,10 · 8,9 | 703 · 12,9 |
| `tailor_eras_cat` | Tailor Swift | W1 | v1 | balanced | 1,70 · 8,7 | 740 · 9,2 |
| `maneki_janitor_cat` | Maneki | W1 | v1 | balanced | 1,63 · 9,3 | 661 · 11,0 |
| `bigoton_rival_cat` | Príncipe Bigotón | W1 | v1 | high | 2,45 · 6,9 | 417 · 8,4 |
| `sonrisa_grin_cat` | Sonrisa | W1 | v2 | balanced | 1,83 · 9,1 | 656 · 8,2 |
| `sirsimon_ghost_cat` | Sir Simón de Gatterville | W1 | v1 | balanced | 1,79 · 8,8 | 695 · 8,2 |
| `garbancito_tiny_cat` | Garbancito | W1 | v1 | balanced | 2,03 · 7,8 | 754 · 8,2 |
| `gatzilla_kaiju_cat` | Gatzilla | W1 | v1 | balanced | 1,99 · 6,8 | 920 · 8,3 |
| `gatoconda_smile_cat` | La Gatoconda | W1 | v1 | balanced (Pinceles) | 1,44 · 3,7 | 729 · 4,0 |
| `gritito_scream_cat` | El Gritito | W1 | v1 | balanced (Pinceles) | 1,21 · 6,4 | 654 · 9,0 |
| `gatarana_noir_cat` | Gato Araña Noir | W1 | v1 | balanced | 1,86 · 7,9 | 821 · 7,8 |
| `gatarana_blanca_cat` | Gata Araña | W1 | v1 | high | 3,78 · 8,1 | 637 · 13,2 |
| `gatarana_2099_cat` | Gato Araña 2099 | W1 | v1 | balanced | 1,61 · 8,1 | 732 · 9,2 |
| `cadenero_bouncer_cat` | El Cadenero | nativo | v1 | high | 2,73 · 3,4 | 463 · 5,4 |
| `borron_inkblot_cat` | Borrón | nativo | v1 | high | 2,98 · 3,5 | 486 · 6,4 |
| `lobo_grandma_cat` | El Lobo | nativo | v1 | balanced | 2,89 · 8,9 | 1 022 · 8,2 |
| `encuadernadora_needle_cat` | La Encuadernadora | nativo | v1 | balanced | 1,75 · 10,4 | 646 · 9,0 |
| `manager_backstage_cat` | El Mánager | nativo | v1 | high | 3,22 · 7,5 | 593 · 10,9 |
| `gatemson_editor_cat` | J. J. Gatemson | nativo | v1 | balanced | 1,61 · 10,4 | 715 · 10,9 |
| `bocina_boombox_cat` | Bocina | nativo | v1 | high | 3,56 · 8,2 | 693 · 11,9 |
| `scratch_dj_cat` | Scratch | nativo | v1 | high | 3,50 · 9,2 | 626 · 13,4 |
| `vangato_sunflower_cat` | Vincent van Gato | piloto | v1 (la del piloto), completo `balanced` (`vangato_sunflower_cat_bal`) | balanced (Pinceles) | 3,05 · 8,8 | 1 293 · 11,2 |
| `billie_whisper_cat` | Billie Bigotish | piloto | v1 | high | 3,18 · 5,6 | 531 · 8,0 |
| `comecroquetas_pellet_cat` | Comecroquetas | piloto | v1 (no la `_nn`) | high | 1,82 · 1,5 | 374 · 3,3 |

**Totales:** 32 gatos; completo **85,3 MB**; lite **22,4 MB**.

**Mapeo de versiones a slug limpio:** `murciegato_cowl_cat_v5` → `murciegato_cowl_cat`; `gatomalo_bunny_cat_v2` → `gatomalo_bunny_cat`; `estambre_yarnstorm_cat_v2` → `estambre_yarnstorm_cat`; `vangato_sunflower_cat_bal` (completo) → `vangato_sunflower_cat`. Ojo: en `_p3v2/svg/` los nombres limpios de esos tres primeros siguen siendo las versiones viejas (v4/v1); en el juego, el nombre limpio es la versión final.

## Notas de rig por gato (las delicadas)

Todos los rigs: elipse de la cabeza que **contiene la base de las orejas** (e ≤ 0,92; con la elipse solo en la cara, el contorno de la oreja se doblaba al mirar), punta de la oreja un 12 % más allá de la punta pintada (la caída queda en el aire) y cola con su radio.

| Gato | Qué se hizo |
|---|---|
| **Doctor Ovillo** | Los 4 ovillos de los brazos son `floats` (se mecen ±6 px, desfasados); los brazos mecánicos se doblan apenas |
| **El Estambre** | El remolino de la parte baja es un `pin` (200 × 125): ni la cola ni la cabeza lo arrastran |
| **Super Siamés** | Aura: dos lenguas de fuego junto a la cabeza y la punta de la faja son `floats`; el resto del aura se dobla con el cuerpo, sin cortes |
| **Maneki** | Escoba fija en 3 `pins` (el palo pasa junto a la cara y el cepillo junto a la cola); el llavero y la moneda con borla son `floats` (tintinean) |
| **El Lobo** | Orejas dentro del gorro de encaje: angostas (halfWidth 16) para no arrastrar el encaje; revisado mirando a los dos lados |
| **Gato Araña 2099** | Ojos de lente roja: **párpado clásico**. Al cerrar baja el marco rojo de la máscara y deja una rendija encendida: se lee como una lente que se cierra. El párpado elíptico se probó y dejaba rayas |
| **Gato Araña** | Ojos en los parches blancos: párpado elíptico (lid 10): baja el parche, el gorro rojo no se estira |
| **Gata Araña** | Ojos grandes: párpado elíptico (lid 8) que baja el delineado negro; con el clásico se estiraba toda la máscara blanca |
| **Gato Araña Noir** | Ojos dentro de goggles: párpado clásico (el elíptico estiraba el brillo del vidrio en rayas); al cerrar, el aro superior se dobla un poco |
| **Harry Gatter** | Anteojos redondos: párpado elíptico (lid 7, solo el pelaje negro bajo el aro); los anteojos no se mueven. La marca de la frente se conserva |
| **La Encuadernadora** | Párpado elíptico (lid 4) para que los goggles de la frente no bajen; aguja e hilo fijos (`pin`) |
| **Gato Malo** | 4 orejas: las 2 de gato y las 2 de conejo de la diadema (se mueven como orejas largas) |
| **Tailor Swift** | Las 3 pulseras y 3 destellos son `floats`. Los destellitos chicos se aceptan |
| **Bocina** | El estéreo es un `pin`: la cabeza no lo arrastra |
| **Homiau, Borrón** | La dona (y las migas de Borrón, `float`) fijas |
| **Harry, Garbancito, El Mánager, EMIAU, Van Gato** | La varita, la lata de aerosol, el teléfono, la mano que señala y el girasol son `pins` |
| **El Gritito** | Los dos remolinos del fondo son `pins` |
| **Sir Simón** | Cadena junto a la cola fija; mancha recoloreada (arriba) |
| **Comecroquetas** | Pixel art: la cuadrícula se dobla un poco al girar la cabeza (aceptable). Las 3 croquetas flotan desfasadas |

## Hosting (chequeo local, 2026-10-27)

`node scripts/art-publish.ts build --src public --out <tmp> --tiers full --shard K --count N` (las salidas se borraron después):

| Corrida | Archivos | Tamaño | Comparación |
|---|---|---|---|
| Sitio 0 de 2 (`nolc-arte`) | **122** | **881,3 MB** | Igual al `art-manifest.json` publicado hoy (construido el 2026-10-11 desde `8873561`): mismas rutas y **mismo sha1** en los 122 |
| Sitio 1 de 2 (`nolc-arte-2`) | **38** | **101,4 MB** | Solo arte nuevo: los 32 de la Fase 1, los 3 de la Fase 2 + Hipólito, Espuma y Dona. Nada de lo publicado en el sitio 0 |
| Un solo sitio (la configuración de hoy) | 157 (medido antes de la Fase 2; ahora 160) | 975,4 MB (ahora ~982,7) | **Pasa el tope de 950 MB → el build falla** (a propósito). Ver el aviso de abajo |

**Aviso:** `nolc-arte` corre su workflow cada 6 h (cron `23 */6 * * *`). Si corre **después** del push del juego y **antes** de cambiarle `NOLC_ART_COUNT=2`, su build falla por el tope de 950 MB: no publica nada y el sitio actual queda igual (no se rompe nada, pero la corrida sale en rojo). Por eso el paso 2 va justo después del push.

**Activación** (en el orden de `../12-hosting-arte-p3.md` §4; lo hace el coordinador con la publicación del juego; cuenta Ragosorio):

```sh
export GH_TOKEN=$(gh auth token -u Ragosorio)
# 1. Push del juego a main (con artShardPins.ts, los 32 SVG, los manifiestos y catRigs.json).
#    El deploy hace `art-publish check` contra el sitio único: solo AVISA de los completos nuevos que faltan.
# 2. nolc-arte pasa a ser el sitio 0 de 2 y se vuelve a publicar (idéntico: 122 archivos, 881,3 MB)
gh variable set NOLC_ART_SHARD --body 0 -R Ragosorio/nolc-arte
gh variable set NOLC_ART_COUNT --body 2 -R Ragosorio/nolc-arte
gh workflow run publish.yml -R Ragosorio/nolc-arte && gh run watch -R Ragosorio/nolc-arte
curl -s https://ragosorio.github.io/nolc-arte/art-manifest.json | jq '{count, n: (.files|length)}'   # {count: 2, n: 122}
# 3. nolc-arte-2 (ya tiene NOLC_ART_TIERS=full, NOLC_ART_SHARD=1, NOLC_ART_COUNT=2)
gh variable list -R Ragosorio/nolc-arte-2
gh workflow run publish.yml -R Ragosorio/nolc-arte-2 && gh run watch -R Ragosorio/nolc-arte-2
curl -s https://ragosorio.github.io/nolc-arte-2/art-manifest.json | jq '.files|length'   # 38 (más lo que se agregue antes)
# 4. El juego con las dos bases (primero nolc-arte, después nolc-arte-2) y redeploy
gh variable set NOLC_ART_BASE_FULL --body "https://ragosorio.github.io/nolc-arte/,https://ragosorio.github.io/nolc-arte-2/" -R Ragosorio/no-one-like-cats
gh workflow run deploy.yml -R Ragosorio/no-one-like-cats && gh run watch -R Ragosorio/no-one-like-cats
# 5. Encender el cron de nolc-arte-2: descomentar `schedule` en su .github/workflows/publish.yml (commit en ese repo)
```

**Rollback:** `gh variable set NOLC_ART_BASE_FULL --body "https://ragosorio.github.io/nolc-arte/" -R Ragosorio/no-one-like-cats` y redeploy: los gatos nuevos quedan en lite; `nolc-arte` no cambia sus rutas.

**Nota aparte (no es de este lote):** `platillo_saucer_cat` tiene un tamaño en disco distinto al de los dos manifiestos (completo y lite). Viene de antes; no lo toqué.

## Fase 2: Cerito (dos versiones) e Itō (2026-10-27)

Codex **no estaba bloqueado**: las dos pinturas salieron al primer intento (`codex exec -m gpt-6-astra`, `_p3v2/gen.sh`), sin filtro.

| Slug | Quién | Cómo se hizo | Completo (preset · MB · MAE) | Lite (KB · MAE) |
|---|---|---|---|---|
| `cerito_fur_cat` | Cerito con pelaje (el final: «elige ser gato», F36) | Ficha `n_cerito` (sale de `c_cerito` del lote Q, que no se tocó): gatito chico gris perla con el **anillo (un cero) en la frente**, ojos oscuros enormes, sentado, cola enroscada a un lado. Lock BORRACHA v1 con Hipólito y Espuma de anclas | high · 2,43 · 4,5 | 442 · 8,4 |
| `cerito_static_cat` | Cerito en estática (REGISTRO 000, Actos I–IV) | **Derivado de la pintura con pelaje** con `_p3v2/herramientas/estatica.mjs`: mismo alfa, mismo contorno, ojos y anillo guardados; el resto es estática de TV gruesa (bloques de 24 px en 4 grises que siguen un poco el claroscuro, y franjas de barrido). Así la silueta es **idéntica** y el fundido no salta | high · 2,28 · 3,8 | 524 · 7,0 |
| `ito_threads_cat` | Itō, el Titiritero del Anime | Ficha `n_ito` (sale de `p3_ito`): gato largo y delgado, pelaje de tinta blanco y negro, kimono de papel con faja roja, mano blanca en la pata, de pie y quieto. Lock ANIME v2 con Super Siamés de ancla. La espada de hilos **no** va pintada: la dibuja el juego | high · 2,57 · 6,4 (MAI colapsó con lanczos3; repetido con mitchell) | 434 · 9,7 |

- **Las dos Cerito comparten rig** (exactamente el mismo; el test lo exige) y el mismo espacio 700×700. Párpado elíptico afinado para que baje solo el pelaje (o la estática) entre la ceja y el ojo: el anillo no se mueve y el contorno queda de pestaña.
- **Itō:** quieto, sin flotantes; ojos chicos, párpado clásico.
- Verificados en `?scene=catlive` (10 estados) y solos a 900 px con el SVG completo.
- Fichas y prompts: `arte-nuevo/manifest.json` (`n_cerito`, `n_ito`; respaldo previo en `_respaldos/manifest-antes-fase2-arteinteg-2026-10-27.json`), `prompts/_p3v2/nativos/n_cerito.md` y `n_ito.md`, creados con `_p3v2/herramientas/fase2.mjs`. Crudos en `_p3v2/nativos/_crudos/n_cerito_v1.png` y `n_ito_v1.png`; normalizados en `_p3v2/nativos/`; SVG en `_p3v2/svg/{full,lite}/` (corrida `f2`).
- **No cambié las películas.** FILM-CAST hace el cambio en `standins.ts`.
