# 05 · Lote W1: los gatos que pide `historia-v2/`

> Ronda 4 de la Parte III. Lo escribe el agente ARTE-V2. ⚠️ Spoilers. Nada se commitea ni se publica sin el OK del dueño.
> Todo vive **fuera del repo**, en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/_p3v2/`. No se tocó `game/`. El coordinador lo encargó después del piloto (`04`); el dueño todavía no revisa ninguno de los dos.

## 0. Resumen (actualizado 2026-10-27 00:20: **W1 terminado**)

- **W1 completo: 21 gatos.**
  - 11 de la primera tanda (19:33): Murciégato v5, Doctor Ovillo, El Estambre, Super Siamés, Harry Gatter, Gato Malo, Tailor Swift, EMIAU y Maneki, más Homiau y Gato Araña del piloto.
  - 10 de la segunda tanda (23:46, cola automática): Príncipe Bigotón, Sonrisa v2, Sir Simón, Garbancito, Gatzilla, La Gatoconda, El Gritito y las variantes Gato Araña Noir, Gata Araña y Gato Araña 2099.
- **Correcciones del coordinador:**
  - **Gato Malo v2:** el dije es una zanahoria dorada; ya no parece un «8».
  - **El Estambre v2:** rayas verde oliva y arena, sin rojo.
  - **Murciégato v5:** emblema de espina de pescado (§4).
- **8 nativos nuevos** que pide `historia-v2/`: El Cadenero, Borrón, El Lobo, La Encuadernadora, El Mánager, J. J. Gatemson (director de *El Clarín Viñeta*), y Bocina y Scratch (la pandilla de EMIAU). Ver §8 y §9.
- **Cero bloqueos en la segunda tanda** (20 de 20). En total: 30 pinturas nuevas en este lote, con un solo bloqueo (Sonrisa v1).
- **Pesos (29 gatos finales: 21 de W1 y 8 nativos):**
  - Completo: **4,34 MB** de promedio con `high` y **2,66 MB** con el preset elegido. Total elegido: **77 MB**. Lite: **696 KB**.
  - Regla aplicada: `balanced` si el completo pasa de 4 MB (o es de Pinceles) **y** su MAE queda ≤ 11. Si no, `high`.
- **Hojas de contacto** (en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/_p3v2/revision/`):
  - `w1-pintura-vs-svg.jpg`: 24 filas; incluye Murciégato v4, El Estambre v1 y Gato Malo v1 para comparar.
  - `nativos-pintura-vs-svg.jpg`: 8 filas.
  - Columnas: pintura, completo `high`, completo `balanced`, lite, completo sobre oscuro, silueta a 64 px y miniaturas de 128 px.
  - Medidas en `*-medidas.json`.

## 1. Anclas que se usaron (provisionales)

El coordinador aprobó el piloto; el dueño todavía no. Para que cada multiverso se vea parejo, se adjuntaron como referencia de estilo (`references` en el manifest):

| Multiverso | Ancla | Gatos de W1 que la usaron |
|---|---|---|
| Superhéroes | Gato Araña v2 (piloto) | Doctor Ovillo, El Estambre (y las 3 variantes pendientes) |
| POP | Billie Bigotish (piloto) | Gato Malo, Tailor Swift, EMIAU |
| Anime | Super Siamés (de este lote) | Príncipe Bigotón (pendiente) |
| Libros | Harry Gatter (de este lote) | Sonrisa, Sir Simón, Garbancito (pendientes) |
| Mitos, Pinceles, Pantalla | Sin ancla común: cada gato tiene el estilo de su fuente | Maneki, La Gatoconda, El Gritito, Gatzilla |

Si el dueño rechaza un ancla, se regeneran los gatos que la usaron.

## 2. Resultados

| Gato (slug) | Intento | Completo `high` (MB · MAE) | Completo `balanced` (MB · MAE) | **Elegido** | Lite (KB · MAE) |
|---|---|---|---|---|---|
| Homiau (`homiau_donut_cat`) · piloto | v1 | 2,62 · 4,7 | — | high | 415 · 10,1 |
| **Murciégato v5** (`murciegato_cowl_cat_v5`) | v5 | 3,33 · 5,0 | — | high | 525 · 6,5 |
| *Murciégato v4, para comparar* (`murciegato_cowl_cat`) | v4 | 3,38 · 4,5 | — | — | 570 · 6,3 |
| Gato Araña (`gatarana_web_cat`) · piloto | v2 | 4,96 · 6,1 | 1,84 · 8,2 | balanced | 760 · 9,7 |
| Doctor Ovillo (`ovillo_yarnarms_cat`) | v1 | 5,93 · 8,4 | 2,13 · **11,2** | **high** (balanced pasa el MAE 11) | 965 · 10,8 |
| El Estambre v1 (`estambre_yarnstorm_cat`), reemplazado por la v2 (§9) | v1 | 6,45 · 8,2 | 2,03 · **11,6** | — | 964 · 11,0 |
| Super Siamés (`supersiames_aura_cat`) | v1 | 5,98 · 6,4 | 2,36 · 8,4 | balanced | 1 008 · 7,8 |
| Harry Gatter (`harrygatter_wand_cat`) | v1 | 4,51 · 4,6 | 1,63 · 6,2 | balanced | 597 · 5,5 |
| EMIAU (`emiau_rapper_cat`) | v1 | 3,17 · 7,7 | — | high | 562 · 10,5 |
| Gato Malo (`gatomalo_bunny_cat`) | v1 | 3,74 · 8,7 | — | high | 649 · 12,9 |
| Tailor Swift (`tailor_eras_cat`) | v1 | 4,07 · 7,8 | 1,70 · 8,7 | balanced | 740 · 9,2 |
| Maneki (`maneki_janitor_cat`) | v1 | 4,49 · 6,6 | 1,63 · 9,3 | balanced | 661 · 11,0 |
| **Promedio (11, sin la v4)** | | **4,48** | | **2,38** | **713** |

Todos los lites pasan la compuerta (MAE < 22). Gato Malo (12,9) está cerca del objetivo de ≤ 13. Ningún trazo `high` colapsó.

**Hosting:**
- Los 11 pesan **26 MB** con el preset elegido (49 MB si todos fueran `high`).
- Con ese promedio (2,38 MB), el catálogo completo (~110 gatos) cabría en **~260 MB**, el **27 %** de `nolc-arte-2`.

## 3. Lo que hay que revisar

| # | Qué | Propuesta |
|---|---|---|
| 1 | **`balanced` pasa el MAE ≤ 11** en Doctor Ovillo (11,2) y El Estambre (11,6 en la v1, 14,4 en la v2): mucho estambre fino | **Resuelto con una regla:** `balanced` solo si su MAE queda ≤ 11; si no, `high`. Ovillo y El Estambre quedan en `high`. Se puede probar `high-palette192` como punto medio |
| 2 | **Gato Malo** traía un dije que parecía un **«8»** | **Corregido en la v2** (dije de zanahoria, §9) |
| 3 | **El Estambre:** las rayas verde y rojo-café podían recordar el suéter de un villano de terror | **Corregido en la v2** (rayas verde oliva y arena, §9) |
| 4 | **Harry Gatter:** el rayito blanco de la frente está bien a la vista | Es una marca del pelaje, pequeña (`01` §4), pero el dueño debe confirmar que no se lee como la cicatriz original |
| 5 | **Tailor Swift** trae destellitos chicos y brillantina pintada en el vestido (contra `VECTOR_READY`) | Pesa poco con `balanced` (1,70 MB). Corrección para la v2: «lentejuelas en 3–4 formas grandes, sin destellitos» |
| 6 | **Sonrisa** bloqueada (la paleta era la de una película) | **Resuelto:** la v2 con paleta propia pasó (§9). La regla `01` §3.1 funcionó: bajar el rasgo «de marca» |
| 7 | **Rig** sin probar | Revisar al integrar: los brazos-ovillo de Doctor Ovillo (*floats*), el remolino de El Estambre (*pin*), el aura de Super Siamés, la escoba y las llaves de Maneki |

## 4. Murciégato: v4 contra v5

- **v4 (piloto):** el emblema salió como un murciélago con alas, muy parecido al logo real.
- **v5:** emblema de **espina de pescado** horizontal, negro sobre una placa gris, sin alas ni óvalo. Combina con su búmeran. Pasó el filtro a la primera.

La capucha con orejas, la capa festoneada, el cinturón de latón y la paleta de noche siguen evocando la referencia. Se ven lado a lado en las filas 2 y 3 de la hoja.

## 5. Comandos para terminar o repetir W1

Desde `arte-nuevo/`:

```sh
./_p3v2/w1-pendientes.sh                       # lanza los 10 pendientes (Codex, en paralelo)
./_p3v2/herramientas/estado.sh x_bigoton:1 e_sonrisa:2 e_sirsimon:1 r_garbancito:1 l_gatzilla:1 e_gatoconda:1 c_gritito:1 r_gatarana_noir:1 r_gatarana_blanca:1 r_gatarana_2099:1
# normalizar cada uno:
node herramientas/normalizar.mjs _p3v2/catalogo/_crudos/<id>_vN.png _p3v2/catalogo/<id>.png
# vectorizar (700 px → MAI high → reintento con mitchell si colapsa → completo → lite):
./_p3v2/herramientas/vect.sh w1c <id>=catalogo/<id>.png=<slug> …   # slugs en _p3v2/slugs-w1.json
# los que pasen de ~4 MB (y los de Pinceles: La Gatoconda y El Gritito):
./_p3v2/herramientas/vect-bal.sh w1c <slug> …
# hoja (incluye a todos los que ya tengan PNG y SVG):
node -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync('_p3v2/slugs-w1.json'));const o={};for(const[k,v] of Object.entries(s))if(fs.existsSync('_p3v2/'+v.png))o[k]=v;fs.writeFileSync('_p3v2/slugs-w1-hecho.json',JSON.stringify(o,null,1))"
node _p3v2/herramientas/contacto-v2.mjs slugs-w1-hecho.json w1-pintura-vs-svg
```

## 6. Archivos (dentro de `arte-nuevo/_p3v2/`)

| Qué | Dónde |
|---|---|
| Crudos de W1 | `catalogo/_crudos/` (Murciégato v5 en `piloto/_crudos/`) |
| PNG normalizados | `catalogo/<id>.png`, `piloto/x_murciegato_v5.png` |
| SVG completo `high` y lite | `svg/full/`, `svg/lite/` |
| SVG completo `balanced` | `svg/full-bal/` |
| Métricas | `work/vec/w1a*/`, `work/vec/w1b*/` (JSON de MAI); `revision/w1-pintura-vs-svg-medidas.json` |
| Fichas | `catalogo-src/*.json` (con `refs` y `corr`), `piloto.json` (Murciégato v5), `w1-variantes.json` (variantes de Gato Araña) |
| Herramientas nuevas | `herramientas/vect.sh`, `vect-bal.sh`, `estado.sh`, `mosaico.mjs`; `contacto-v2.mjs` ahora acepta `[slugs.json] [nombre]` y muestra la columna `balanced` |

## 7. Segunda tanda (corrió a las 23:46, cuando volvió la cuota de Codex)

El coordinador pidió terminar W1, corregir dos detalles y diseñar los nativos que pide `historia-v2/` y que no tenían pintura. Todo quedó en una cola que arranca sola:

- **Comando:** `./_p3v2/cola.sh 23:46 7 <20 trabajos>` en segundo plano.
  - Espera hasta las 23:46 y lanza los trabajos en olas de 7.
  - Espera a que cada ola termine. Si Codex vuelve a su límite, se detiene y deja lo que falta en `_p3v2/cola-pendientes.txt`.
  - Al final normaliza lo que salió. Registro: `_p3v2/logs/cola-*.txt`.
- **Después:**
  - `./_p3v2/w1-post.sh w1c slugs-w1.json w1-pintura-vs-svg`
  - `./_p3v2/w1-post.sh n1 slugs-nativos.json nativos-pintura-vs-svg`
  - Cada uno vectoriza lo nuevo, hace `balanced` si pasa de 4 MB o es de Pinceles, y arma la hoja.

**Orden de la cola:**
1. **El resto de W1 (9):** Príncipe Bigotón, Sonrisa v2, Garbancito, Gatzilla, La Gatoconda, El Gritito y las 3 variantes de Gato Araña.
2. **Correcciones (2):**
   - **Gato Malo v2:** el dije ahora es una **zanahoria** dorada, por el chiste del conejo; ya no se lee como «8».
   - **El Estambre v2:** rayas **verde oliva y arena**, sin rojo, para que no recuerde el suéter de un villano de terror.
3. **Nativos (8):** ver §8.
4. **Sir Simón de Gatterville** va al final: la versión actual de `historia-v2/` lo reemplazó por **El Lobo** en H84.

## 8. Nativos que pide `historia-v2/` (fichas nuevas, lote `n`)

Fuente: `_p3v2/nativos-src.json` → `node _p3v2/herramientas/nativos.mjs` → `node herramientas/compilar.mjs n`. Mismas reglas que el catálogo. Los que evocan algo llevan rasgos obligatorios; los originales llevan su objeto protagonista y su silueta.

| Id | Nombre | Para qué (`historia-v2/`) | Rasgos que siempre se ven | Lock y ancla |
|---|---|---|---|---|
| `p3_cadenero` | El Cadenero | Jefe B-9 (H74): cuida la puerta del baño porque le tiene miedo a lo que hay detrás | Gigante de brazos cruzados, lentecitos oscuros, poste con cordón rojo (ficha del lote Q) | `BORRACHA` v1, con **Hipólito y Doña Espuma** (aprobados) como anclas |
| `p3_borron` | Borrón | Titiritero de la Borracha (H70, H74) | Gato negro deshecho, babero de mancha de tinta, mano blanca marcada en la pata, dona mordida (ficha del lote Q) | `BORRACHA` v1, mismas anclas |
| `p3_lobo` | El Lobo | Se sale del cuento de Caperucita, acorrala a Garbancito y La Mano le escribe FIN (H84) | Gorro de dormir de encaje, camisón de abuela, pelaje gris lobo desgreñado, sonrisa de dientes con la boca cerrada | `LIBROS_V2`, al modo del grabado de Doré (dominio público) |
| `p3_encuadernadora` | La Encuadernadora | Élite L-5 (H83): cose historias a la fuerza | Aguja curva gigante con hilo rojo, delantal de cuero, hombreras de lomos cosidos, carretes en el cinturón | `LIBROS_V2`, ancla Harry Gatter |
| `p3_manager` | El Mánager | Élite P-5 (H89) | Audífono de diadema y lentes oscuros, tabla con sujetapapeles, gafetes de backstage (sin texto), traje morado brillante | `POP_V2`, ancla Billie |
| `p3_gatemson` | J. J. Gatemson | El director de *El Clarín Viñeta* (S-8, H76). Evoca al director del periódico de Spider-Man | Pelo gris en cepillo con canas, bigotito de cepillo, mangas arremangadas y tirantes, grita con un periódico enrollado (sin letras) | `SUPERHEROES_V2`, ancla Gato Araña |
| `p3_bocina` | Bocina | La pandilla de EMIAU (H73): el grandote del estéreo | Estéreo enorme al hombro, gorra hacia atrás, chaleco acolchado naranja | `POP_V2`, ancla EMIAU |
| `p3_scratch` | Scratch | La pandilla de EMIAU (H73): el DJ | Audífonos enormes al cuello, tornamesa portátil, chamarra deportiva | `POP_V2`, ancla EMIAU |

**Cambio en lo viejo:** las fichas de **El Cadenero** y **Borrón** (lote Q, nunca generadas) ahora llevan como referencia a los gatos aprobados de la Borracha, igual que se hizo con Oficial Dona. Es el único cambio en sus prompts. Con eso, 5 de los 103 prompts viejos cambiaron a propósito.

**No se hicieron:** las variantes de Canelo (esperan al dueño). Miaurio sigue en reserva. **Cronos** ya tiene pintura (Parte II).

## 9. Resultados de la segunda tanda (2026-10-26 23:46 → 2026-10-27 00:15)

La cola corrió **20 de 20 sin bloqueos**, en 3 olas de 7 y 6 (~7 min de Codex). MAI colapsó 4 veces con lanczos3 (El Gritito, El Mánager, Bocina y Scratch; MAE 83–102). `vect.sh` lo repitió solo con mitchell y quedó en MAE 5–9.

| Gato (slug) | Completo `high` (MB · MAE) | `balanced` (MB · MAE) | **Elegido** (MB) | Lite (KB · MAE) | Nota |
|---|---|---|---|---|---|
| Príncipe Bigotón (`bigoton_rival_cat`) | 2,45 · 6,9 | — | high 2,45 | 417 · 8,4 | Ancla: Super Siamés |
| Sonrisa v2 (`sonrisa_grin_cat`) | 4,71 · 6,9 | 1,83 · 9,1 | balanced 1,83 | 656 · 8,2 | Rayas miel y café, rama; ya no se parece a la película |
| Sir Simón (`sirsimon_ghost_cat`) | 4,66 · 6,7 | 1,79 · 8,8 | balanced 1,79 | 695 · 8,2 | Ojo: la mancha roja de la armadura se ve como sangre. Si molesta, cambiar a mermelada o vino |
| Garbancito (`garbancito_tiny_cat`) | 5,38 · 6,2 | 2,03 · 7,8 | balanced 2,03 | 754 · 8,2 | El garbanzo da la escala |
| Gatzilla (`gatzilla_kaiju_cat`) | 5,15 · 5,2 | 1,99 · 6,8 | balanced 1,99 | 920 · 8,3 | Placas del lomo y edificio de cartón |
| La Gatoconda (`gatoconda_smile_cat`) | 4,05 · 3,0 | 1,44 · 3,7 | balanced 1,44 | 729 · 4,0 | Pinceles |
| El Gritito (`gritito_scream_cat`) | 2,91 · 5,1 (mitchell) | 1,21 · 6,4 | balanced 1,21 | 654 · 9,0 | Pinceles |
| Gato Araña Noir (`gatarana_noir_cat`) | 5,49 · 5,6 | 1,86 · 7,9 | balanced 1,86 | 821 · 7,8 | — |
| Gata Araña (`gatarana_blanca_cat`) | 3,78 · 8,1 | — | high 3,78 | 637 · **13,2** | El emblema del pecho se lee como araña. Lite un poco arriba del objetivo de 13 |
| Gato Araña 2099 (`gatarana_2099_cat`) | 4,48 · 5,9 | 1,61 · 8,1 | balanced 1,61 | 732 · 9,2 | **Rig:** los ojos son lentes rojas sin iris visible. Revisar el parpadeo o pedir iris en la v2 |
| Gato Malo v2 (`gatomalo_bunny_cat_v2`) | 4,10 · 8,9 | 1,44 · **11,4** | high 4,10 | 703 · 12,9 | Dije de zanahoria |
| El Estambre v2 (`estambre_yarnstorm_cat_v2`) | 6,72 · 9,8 | 2,12 · **14,4** | high 6,72 | 979 · **13,1** | Rayas verde oliva y arena. El estambre fino no aguanta `balanced` |
| El Cadenero (`cadenero_bouncer_cat`) | 2,73 · 3,4 | — | high 2,73 | 463 · 5,4 | Anclas: Hipólito y Espuma; encaja con la Borracha aprobada |
| Borrón (`borron_inkblot_cat`) | 2,98 · 3,5 | — | high 2,98 | 486 · 6,4 | Ídem. Mano blanca en la pata, babero de tinta, dona |
| El Lobo (`lobo_grandma_cat`) | 7,88 · 6,9 | 2,89 · 8,9 | balanced 2,89 | 1 022 · 8,2 | Grabado al modo de Doré. **Rig:** las orejas quedan dentro del gorro |
| La Encuadernadora (`encuadernadora_needle_cat`) | 4,48 · 7,8 | 1,75 · 10,4 | balanced 1,75 | 646 · 9,0 | — |
| El Mánager (`manager_backstage_cat`) | 3,22 · 7,5 (mitchell) | — | high 3,22 | 593 · 10,9 | Gafetes sin texto |
| J. J. Gatemson (`gatemson_editor_cat`) | 4,55 · 7,3 | 1,61 · 10,4 | balanced 1,61 | 715 · 10,9 | Pintado con la boca abierta (grita): es su rasgo |
| Bocina (`bocina_boombox_cat`) | 3,56 · 8,2 (mitchell) | — | high 3,56 | 693 · 11,9 | — |
| Scratch (`scratch_dj_cat`) | 3,50 · 9,2 (mitchell) | — | high 3,50 | 626 · **13,4** | Lite un poco arriba del objetivo |

**Totales:**

| Conjunto | Gatos | Completo `high` (promedio) | Completo elegido (promedio · total) | Lite (promedio) |
|---|---|---|---|---|
| W1 (versiones finales) | 21 | 4,43 MB | 2,62 MB · 55 MB | 711 KB |
| Nativos | 8 | 4,11 MB | 2,78 MB · 22 MB | 656 KB |
| **Todo** | **29** | **4,34 MB** | **2,66 MB · 77 MB** | **696 KB** |

**Hosting:** a 2,66 MB por gato, el catálogo completo con los nativos (~115 gatos) ocuparía ~305 MB, el **32 %** de `nolc-arte-2`. Todos los lites pasan la compuerta (MAE < 22). Tres quedan apenas sobre el objetivo de 13: Gata Araña, El Estambre v2 y Scratch.

**Para que decida el dueño:**
- Murciégato v4 contra v5.
- El Estambre y Gato Malo: v1 contra v2.
- La mancha roja de Sir Simón.
- Los ojos de Gato Araña 2099 (iris para el parpadeo).
- Las anclas provisionales (§1).
- Sir Simón sigue en el catálogo, aunque la versión actual de `historia-v2/` usa a El Lobo en H84.

## 10. Integración en el juego (2026-10-27, agente ARTE-INTEG)

El dueño aprobó el arte nuevo («el arte nuevo sí, abre repo»). Estado completo en `../agentes/ARTE-INTEG.md`.

- **Entraron 32 gatos:** los 21 de W1 (versiones finales), los 8 nativos y Van Gato, Billie y Comecroquetas del piloto. Murciégato v4, Gato Malo v1 y El Estambre v1 no entran. Miaurio sigue en reserva.
- **Slugs limpios:** las versiones finales toman el nombre sin sufijo. `murciegato_cowl_cat_v5` → `murciegato_cowl_cat`, `gatomalo_bunny_cat_v2` → `gatomalo_bunny_cat`, `estambre_yarnstorm_cat_v2` → `estambre_yarnstorm_cat`, y el completo `vangato_sunflower_cat_bal` → `vangato_sunflower_cat`. **Ojo:** aquí en `_p3v2/svg/` los nombres limpios de los tres primeros siguen siendo las versiones viejas.
- **Preset** con la regla de §0 (`balanced` si pasa de 4 MB o es de Pinceles, y su MAE ≤ 11): 17 `balanced` y 15 `high`. Completo: **85,3 MB**; lite: **22,4 MB**. Van Gato entra con su `balanced` de la v1 (3,05 MB, MAE 8,8), la que eligió el piloto. Comecroquetas entra con la versión normal (no la `_nn`).
- **Decisiones del coordinador aplicadas:**
  - las anclas provisionales (§1) quedan como finales;
  - la marca de la frente de Harry Gatter se queda;
  - los destellitos de Tailor Swift se aceptan;
  - los lites de Gata Araña (13,2) y Scratch (13,4) se aceptan (la compuerta es < 22);
  - **la mancha roja de Sir Simón ahora es morado vino**, en el completo y en el lite. Se cambiaron solo los caminos rojos dentro del peto; el archivo pesa lo mismo y el MAE contra la pintura sube un poco en esa zona (es un cambio a propósito);
  - las variantes de Canelo no llevan pintura nueva.
- **Rigs:** uno por gato, en `catRigs.json` y en `MAI SVG/exports/game-rigs/`. Los puntos delicados de §3 #7 y del piloto (`04` §5 #7) están resueltos: los ovillos de Doctor Ovillo flotan, el remolino de El Estambre va fijo, el aura de Super Siamés tiene dos llamas y la faja que flotan, la escoba de Maneki va fija y sus llaves tintinean, las orejas de El Lobo son angostas dentro del gorro, y Gato Araña 2099 parpadea con el marco rojo de la máscara (párpado clásico). Detalle por gato en `../agentes/ARTE-INTEG.md`.
- **Revisión:** los 32 títeres en `?scene=catlive` (10 estados cada uno). Hoja: `_p3v2/revision/integracion-titeres-catlive.jpg`.
- **Hosting:** todo el arte nuevo va solo al sitio 1 (`nolc-arte-2`): 35 archivos y 94,1 MB con los 3 de la Borracha; 38 archivos y 101,4 MB con la Fase 2. `nolc-arte` publicaría exactamente lo mismo que hoy. La activación espera la publicación del juego.
- **Después (Fase 2 del mismo agente):** entraron también las pinturas de la historia que faltaban: **Cerito** en dos versiones con la misma silueta y el mismo rig (`cerito_static_cat` y `cerito_fur_cat`, para el fundido de F36) e **Itō** (`ito_threads_cat`). Detalle en `../agentes/ARTE-INTEG.md` › Fase 2.
