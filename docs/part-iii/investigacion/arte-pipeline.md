# Investigación · El pipeline de arte y sus límites reales (Parte III)

**Para quién.** El director de la Parte III. Responde qué permite de verdad el pipeline de gatos, cuánto cuesta y cómo pedir arte de dimensiones con estilos muy distintos sin romper el juego.

**Cómo se marcan los datos.** **[MEDIDO]** = lo medí hoy o sale de un log o archivo con fecha. **[DOC]** = lo dice un documento del proyecto. **[INFERIDO]** = deducción mía a partir de lo anterior; hay que confirmarlo con una prueba antes de comprometerlo.

**Etapa.** Solo diseño. No se tocó `game/`, `docs/part-ii/` ni el taller de Codex. No se generaron imágenes.

---

## 0. Resumen para el director

1. **Un gato es una sola pintura deformada por una malla.** No hay cuadros ni poses alternativas: todo el acting sale de deformar la misma pintura (cabeza, orejas, párpados, cola, flotantes, inclinación y aplastamiento). No hay boca, patas, cejas ni pupilas que se muevan.
2. **Una pose distinta (ataque, celebración) es otra pintura completa**, con su propio rig y su propio peso en el hosting: ~8 MB y una ronda de Codex por pose. El único precedente son las formas de Canelo.
3. **Lo barato es el acting por datos**: temperamento, intents, reacciones, manías y emotes. Con eso se puede dar una firma propia a cada gato sin arte nuevo (Canelo ya la tiene).
4. **El estilo de dimensión se divide en dos.** La pintura pone la silueta, las proporciones, la línea y el color plano. El shader u horneado pone la textura de pantalla (trama, Ben-Day, grano, papel, acuarela). El kit de Momentos ya tiene seis horneados de gato: cel anime, toon de los 30, miniatura iluminada, plantilla o cómic, lápiz y acuarela, y grabado sepia. También tiene un post de película muda.
5. **MAI no conserva la textura fina.** Tramas, grano, brillantina y la granulación de la acuarela se vuelven ruido o bandas, inflan el SVG y desaparecen en el lite. La línea gruesa y el color plano sí sobreviven, y probablemente pesan menos que el pelo pintado.
6. **El hosting del arte completo está casi lleno.** `nolc-arte` sirve 881,3 MB, contra el tope de 950 MB del script de publicación: caben unos **9 gatos más**. **Antes del primer lote de la Parte III hay que abrir `nolc-arte-2`**, con la aprobación del dueño. El sitio del juego, en cambio, está holgado: el último deploy midió 199 MB.
7. **Primer lote realista:** 7 gatos completos (las 5 parodias y un ancla para Borracha y otra para Anime), con 5 lentes de dimensión y animaciones especiales baratas. Toma unos 6–8 días de agente, con 3–4 sesiones de revisión del director.

---

## 1. Corrección de premisas (medido hoy)

| Premisa del encargo | Dato actual | Fuente |
|---|---|---|
| «dist ~690 MB de ~1 GB» | Eso fue antes del 2026-10-09. Desde que el arte completo vive en `nolc-arte`, el **dist mide 199 MB** (log del deploy del 2026-10-11, `du -sh dist`, con 122 SVG completos fuera) | **[MEDIDO]** `gh run view 38116399180 --log` |
| ¿Cuánto lleva `nolc-arte`? | **881,3 MB**, 122 archivos (solo el completo), construido el 2026-10-11 02:17 UTC | **[MEDIDO]** `https://ragosorio.github.io/nolc-arte/art-manifest.json` |
| Tope de `nolc-arte` | El script falla por encima de **950 MB** (`NOLC_ART_LIMIT_MB`); el tope duro de Pages es 1 GB por sitio | **[MEDIDO]** `game/scripts/art-publish.ts:85`; **[DOC]** 09 §3 |

---

## 2. El pipeline de punta a punta

```
Director + Claude ──► manifest.json (fuera del repo) ──► compilar.mjs ──► prompts/<lote>/<id>.md
                                                                              │
Codex (GPT Image) ──► _crudos/<id>_vN.png ──► quitar-fondo / normalizar / validar ──► lote-*/<id>.png
                                                                              │
Director ──► PROGRESO.md › Tu revisión ──► corrections_en ──► (regenerar) ──► APROBADO
                                                                              │
Claude ──► 700 px ──► MAI vectorize (completo) ──► game-export (compacto) ──► cats-svg/<slug>.svg
                   └► MAI game-thumbs 240 px (lite) ─────────────────────────► cats-svg/lite/<slug>.svg
       ──► rig (catRigs.json + copia MAI) ──► datos (content/especies, trait, formas) ──► laboratorio + tests
                                                                              │
push a main ──► deploy.yml (lite en dist; check del completo) ──► nolc-arte (cron 6 h o publish.yml) ──► jugador
```

| # | Paso | Herramienta / comando | Archivo que produce | Quién | Tiempo observado |
|---|---|---|---|---|---|
| 1 | **Ficha y brief** | Editar `manifest.json`: `subject_en`, `coat_en`, `look_es`, `palette`, `identifying_features_es`, `corrections_en` preventivas. Luego `node herramientas/compilar.mjs <lote\|id>` | `arte-nuevo/manifest.json`, `prompts/<lote>/<id>.md` (secciones A ajustes · B prompt · C negativo · D postproceso · E checklist) | Director + Claude (Codex no inventa gatos) | — |
| 2 | **Generar** | Codex con GPT Image: 1024², `background=transparent`, PNG, `quality: high`, más las 3 referencias de estilo (canelo, candy, steampunk). Respaldo: `generar.mjs` (API `images/edits` con referencias) | `lote-*/_crudos/<id>_vN.png` (nunca se borran) | Codex | **[MEDIDO]** Lote A, 22 gatos: 21:49–22:20. D, 14: 10:48–10:56. E, 8: ~9 min. F y G, 7 cada uno: ~3 min |
| 3 | **Normalizar y validar** | `quitar-fondo.mjs` (si no trae alfa), `normalizar.mjs` (1024², gato al 90 %, patas al 96 %), `validar.mjs` (ERROR: sin alfa, < 15 % transparente o tocando el borde; AVISO: alto, centrado, halos, > 35 % semitransparente) y `contacto.mjs` (hoja con fondo claro, oscuro, tablero y 128 px) | `lote-*/<id>.png`, `revision/validacion-*.json`, `revision/lote-*.jpg` | Codex | Segundos |
| 4 | **Revisión** | El director escribe en `PROGRESO.md › Tu revisión`. Codex traduce cada nota a `corrections_en`, recompila, regenera (máximo 4 intentos por ronda) y marca `APROBADO` solo si el director escribió «ok» | `PROGRESO.md` | Director (cuello de botella) + Codex | Una sesión por lote |
| 5 | **Reducir a 700 px** | sharp con `lanczos3`; si la traza colapsa, `mitchell` (o al revés) | Scratch del agente | Claude | — |
| 6 | **Vectorizar el completo** | En `~/Desktop/MAI SVG`: `npm run mai -- vectorize <dir700> --preset high-color-preserved --output <vec>`. Es VTracer en modo spline apilado, 256 colores sin tramado, `filterSpeckle 0`, más una máscara de alfa vectorial de 32 niveles. Control: `premultipliedRgbMae` (normal 6–11; > 22 = colapsó en silueta) | `<vec>/<slug>/high-color-preserved.svg` + `.json` | Claude | **[MEDIDO]** ~25 min por lote, del PNG al SVG (D: 10:56 → 11:19; E+G: 23:31 → 23:54–23:59) |
| 7 | **Compactar** | `npx tsx scripts/game-export.ts <dir> <out>` (perfil *game-compact*: une tramos `L` colineales y pasa a relativo; mismo píxel) | `game/public/cats-svg/<slug>.svg`; fusionar `game-export.json` a mano (el script lo sobreescribe) | Claude | Segundos |
| 8 | **Lite** | `npx tsx scripts/game-thumbs.ts <dir700> <out> 240` (reintenta ±16/32 px si MAE ≥ 22; si colapsa, 224; **256 da silueta**) | `cats-svg/lite/<slug>.svg` (~12 k caminos, ancho lógico 700), `lite/game-thumbs.json` | Claude | Segundos |
| 9 | **Rig** | A mano: cabeza (elipse + cuello), orejas (base → punta), ojos (caja, `lid` opcional para anteojos o coronas), cola (polilínea de la base a la punta + radio), `floats`, `pins` | `game/src/data/catRigs.json` + `~/Desktop/MAI SVG/exports/game-rigs/<slug>.rig.json` (hay que mantener los dos) | Claude | **[MEDIDO]** Lote F: los 7 gatos pasaron por rig, datos y verificación de 07:55 a 11:10 (~3 h 15 min, ~28 min por gato) |
| 10 | **Datos** | `content.json` o `data/rupturas/especies*.json` (`art.slug`, `trait`, rareza); `formas.ts` si es forma; quitar `STAND_IN`; ulti con firma (`battle/ults.ts`, `ultFx.ts`) en legendarios o más; NOVEDADES | `game/src/data/**`, `art/catArt.ts` | Claude | Incluido arriba |
| 11 | **Verificar** | `?scene=catlive&cat=<slug>&rig=1` a 450 y 900 px (parpadeo, orejas, cola, viento máximo + `happy`); `?scene=fxlab&cat=<id>` (revelación); Catdex; batalla; región; tests (`rupturasO3.test.ts` exige rig y los 2 SVG); `npm run build` (guarda anti-raster) | Headless (arnés puppeteer del agente) | Claude | Incluido arriba |
| 12 | **Publicar** | Push a `main` → `deploy.yml`: el lite va en `dist`; `art-publish.ts check` compara el completo publicado (si falta, avisa y el gato se ve en lite; si difiere, **falla**). `nolc-arte` publica con un cron cada 6 h o con `gh workflow run publish.yml`. Pages sirve con `max-age=600` | Pages del juego + `Ragosorio/nolc-arte` | Claude, **con OK del dueño** | Deploy de ~1 min; arte completo en ≤ 6 h |
| 13 | **Cierre** | `PROGRESO.md` → `ENTREGADO`; doc de estado y el archivo del agente | — | Claude | — |

**Trampas conocidas (de las bitácoras).**
- Hélice, Ronrón y Quizás colapsaron con `lanczos3` (MAE 88–130) y salieron bien con `mitchell` (5,6–8,0). El lite de Bisagra colapsaba a 240 px y se hizo a 224. **[DOC]** 10 §2e.
- `game-export.ts` y `game-thumbs.ts` **sobreescriben** sus manifiestos: hay que fusionar solo las entradas nuevas.
- Un completo **redibujado** con el mismo slug rompe el deploy a propósito (evita mezclar un rig nuevo con una pintura vieja). Hay que publicar `nolc-arte` primero.

---

## 3. Costos medidos

### 3.1 Por lote (Codex)

| Lote | Gatos | Intentos totales | Regenerados | Causa principal | `coat_en` |
|---|---|---|---|---|---|
| A · Rediseños | 22 | 22 | 0 | — | No |
| B · Elementos nuevos | 24 | 35 | **11 (46 %)** | Pelaje: el generador cae en «atigrado café de pelo largo» | Se agregó después |
| C · Heroicos y Divinos | 8 | 14 | **6 (75 %)** | Pelaje | Se agregó después |
| D · Oleada 1 | 14 | 14 | 0 | — | Sí, desde el inicio |
| E · Oleada 2 | 8 | 9 | 1 | — | Sí + correcciones preventivas |
| F · Oleada 3 | 7 | 9 | 2 | — | Sí + correcciones preventivas |
| G · Oleada 4 | 7 | 9 | 2 | — | Sí + correcciones preventivas |
| **Total** | **90** | **112** | **22** | **1,24 intentos por gato** | |

**[MEDIDO]** (`_crudos/*_vN.png` y `manifest.json`). Lección: con `coat_en` obligatorio y las `corrections_en` escritas **antes** de generar (los «Ojo:» del director), los reintentos bajaron del 46–75 % al **14 %** (5 de 36).

### 3.2 Tamaños (122 gatos en `game/public/cats-svg`)

| | Promedio | Mediana | Mínimo | Máximo | Total |
|---|---|---|---|---|---|
| Completo | **7,22 MB** | 7,41 MB | 3,1 MB (`iridescent_origami_cat`) | 10,0 MB (`rencor_ninetails_cat`) | 881,3 MB |
| Lite | **1,08 MB** | — | 0,61 MB (origami) | 1,46 MB (Rencor) | 132 MB |
| Por gato (los dos) | **≈ 8,3 MB** | | | | |

- Promedio del completo por lote: A 8,03 · B 7,48 · C 7,75 · D 7,42 · E 7,78 · F 6,87 · G 7,08 · los 32 originales 6,23 MB. **[MEDIDO]**
- Caminos del lite: 6,5 k (origami) a 14,9 k (Rencor). Los completos tienen entre 27 k y 73 k caminos. **[MEDIDO]** `game-thumbs.json`; **[DOC]** README de MAI.
- Por la red viajan con gzip: ~18 % de su tamaño en disco (un completo de 7,4 MB baja como 1,37 MB). **[DOC]** 09 §1.
- **Lo que más pesa es el pelo pintado** (Rencor 10,0 · Masa Madre 9,6 · Jonás 9,4 · Gólem 9,3 · Canelo 8,6 MB). **Lo que menos pesa son las facetas planas** (origami 3,1 · neon glitch 3,9 · alien 4,1 · linterna 4,1 · prisma 4,5 MB). **[MEDIDO]**

### 3.3 Hosting

| Sitio | Hoy | Tope | Libre | Gatos que caben |
|---|---|---|---|---|
| Juego (`no-one-like-cats`): código + lite + historia + música (57 MB) | **199 MB** | 1 GB | ~800 MB | ~700 con lite de 1,1 MB: no es el límite |
| `nolc-arte` (solo el completo) | **881,3 MB** | 950 MB (script) / 1 GB (Pages) | **68,7 MB** / 118,7 MB | **≈ 9** / ≈ 16 a 7,2 MB |
| `nolc-arte` + `nolc-arte-2` (2 shards) | — | 2 × 950 MB | ~1 GB | ≈ +140 (≈ 260 en total) **[DOC]** 09 §7 |

**Acción previa obligatoria (necesita al dueño):** crear `Ragosorio/nolc-arte-2`, poner `NOLC_ART_COUNT=2` en los dos repos y `NOLC_ART_BASE_FULL="…/nolc-arte/,…/nolc-arte-2/"`, y redesplegar (pasos en 09 §7). Costo: la mitad de los gatos cambia de URL y cada jugador vuelve a bajar esos completos **una vez**. Ancho de banda: 100 GB al mes por sitio, unas 75 000 descargas de completo; si se pasa, el gato se queda en lite.

### 3.4 Costo en tiempo de ejecución

- Rasterizar un lite cuesta **~15–25 ms en el hilo principal**; un completo, mucho más. Por eso se guarda un WebP en Cache Storage (`rasterCache.ts`) y la siguiente sesión lo decodifica fuera del hilo. **[DOC]** comentario de `rasterCache.ts`.
- En GPU: el completo se rasteriza a 1050 px (4,4 MB de VRAM por gato) y el lite a 700 px (1,96 MB). **[INFERIDO]** de `FULL_RES = 1.5` y `LITE_RES = 1`.
- `deform` (la malla de los títeres) fue la función con más tiempo propio de la CPU: **6,4 %** con la CPU frenada 4× en Rupturas. La isla `rupturas-o4` corre con 30 gatos. **[DOC]** 11 §6 y 31 §4.
- Un horneado de Momento crea **dos texturas por gato** (la pintura y la silueta): 8,8 MB a 1050 px. Cuesta cero por cuadro, pero pesa en memoria. **[MEDIDO en código]** `Studio.load` y `bakeCel`.

---

## 4. Límites reales para la variedad de estilos

### 4.1 ¿Una pintura deformada o varias poses o cuadros?

**Una pintura por slug.** **[MEDIDO en código]**
- `CatPuppet` es un `Mesh` de Pixi con **una** textura sobre una cuadrícula de ~27×27 vértices, más filas densas alrededor de los ojos (`PuppetModel`, `axis(W, W/26, …)`).
- El rig se busca por slug (`modelFor(slug)`). No hay piezas recortadas: la pintura se dobla.
- **Otra pose = otro slug**, con su PNG, su SVG completo y lite, su rig y su peso en el hosting. Precedente: las formas de Canelo (Almirante, Astral) son slugs aparte que `catSlug()` elige según la forma.
- **Lo que sí existe a medias:** la textura de un puppet se puede cambiar en vivo; así pasa del lite al completo (`onCatArt`). Eso sirve para una **variante con el mismo encuadre** (misma pose, otra cara o boca), porque el rig y las UV son los mismos. Cambiar a una pose distinta necesita otro puppet y un corte. Ninguna de las dos cosas está hecha como función del juego.
- **MAI sí tiene sprites y emociones** (`sprite.define`, `emotion.define`, `part.borrow`), pero solo para SVG con SMIL. **El juego no reproduce SMIL**: rasteriza el SVG y lo deforma. **[DOC]** GAME-ASSETS de MAI.
- **Separar partes en MAI** admite poses rígidas, pero no descubre regiones ocultas: deformar de verdad requiere reconstruir la anatomía. **[DOC]** PRESERVATION de MAI.

### 4.2 Qué soporta el rig

| Capa | Qué hay | Dónde |
|---|---|---|
| Emotes (reacciones que decaen solas) | `happy` (cola rápida, orejas arriba), `hurt` (ojos apretados, orejas atrás), `surprise` (cabeza arriba, ojos un poco más abiertos), `attack` (se lanza adelante), `sleepy` (medio cerrado; no decae) | `puppetCore.ts` |
| Actos espontáneos | `look`, `yawn` (sin boca: la cabeza sube y los ojos se cierran), `groom`, `stretch`, `flick` | `puppetCore.ts` |
| Postura (con resorte) | `lean`, `crouch`, `look` (gira la **cabeza**), `walk` (balanceo, sin patas), `sleeping`, `wind`, `energy` | `livingCat.ts` |
| Capa aditiva de intents | 8 canales con keyframes: `crouch`, `lean`, `headDy`, `headA`, `look`, `lift` (salto), `sx`/`sy` (aplastar y estirar) + cues | `intent.ts` |
| Personalidad | 14 temperamentos por rasgo, 17 reacciones (`flinch`, `hide`, `brace`, `advance`, `gawk`, `bounce`, `cheer`, `puff`, `pounce`, `late`, `glare`, `preen`, `nod`, `loom`, `swat`, `zoom`, `ignore`), 16 manías, peso por rareza, barniz solemne y la firma de Canelo | `temperament.ts`, `intent.ts` |
| Momentos | `Actor.pose(rot, sx, sy, flip, alpha)` en dos (12 fps). Las «poses» de LIKY (`brace`, `swing`, `parry`…) son **combinaciones de transformaciones**, no dibujos | `momentos/anime/actor.ts`, `likyFight/stage.ts` |
| Rig por gato | Cabeza, cuello, orejas, ojos (con `lid` elíptico para anteojos), **una** cola, `floats` (bambolean, no giran) y `pins` (zonas que no siguen a la cabeza ni a la cola). De 123 rigs, 19 usan `pins` y 1 usa `lid` | `catRigs.json` |

**No existe:** boca que se abra, patas o manos, cejas, pupilas que miren (lo que gira es la cabeza), una segunda cola o capa con física, girar el cuerpo, vista de espaldas o cambiar la silueta. La biblia propone patas y boca (08 §5, **[PROPUESTO]**), pero eso necesita código y, en el caso de la boca, **pintura del interior**: la malla no puede mostrar lo que no está pintado.

### 4.3 Qué sobrevive a la vectorización de MAI

El preset aprobado (`high-color-preserved`) traza en modo spline con 256 colores **sin tramado**, `filterSpeckle 0` (traza cada mancha) y un alfa de 32 niveles. El lite traza el PNG reducido a 240 px: un trazo de 1024 px queda al 23 %.

| Rasgo de estilo en la pintura | Completo (traza a 700 px) | Lite (traza a 240 px) | Efecto en el peso | Evidencia |
|---|---|---|---|---|
| **Línea gruesa plana** (≥ 10 px a 1024) | Sobrevive | Sobrevive (~2 px) | Baja (regiones grandes) | **[INFERIDO]** del preset + los gatos de facetas planas son los más livianos (3,1–4,5 MB) |
| **Cel de 2 tonos** con borde duro | Sobrevive muy bien | Sobrevive | Baja | **[INFERIDO]** igual que arriba |
| **Negros masivos** (cómic) | Sobrevive | Sobrevive | Baja | **[INFERIDO]** |
| **Trama de puntos o Ben-Day pintada** | Cada punto es un camino; sobrevive si los puntos son grandes | Puntos < 1,5 px: se funden en gris o hacen moiré | **Sube mucho** | **[INFERIDO]**. Indicio: los gatos de estática de TV (Eco Mudo 8,2 MB, Nadie 8,0) tienen de los MAE de lite más altos (13,8 y 12,7; lo normal es 6–11) |
| **Grano de película o papel** | Se traza como ruido | Se pierde | **Sube mucho** | Mismo indicio |
| **Acuarela** (degradado, borde húmedo, granulado) | Se vuelve **bandas** | Bandas más gruesas | Sube | **[DOC]** el rayo de Platillo quedó «en bandas más planas» y hubo que agregar una capa vectorial a mano (10 §2e) |
| **Brillantina, lentejuelas o estrellitas** | Ruido | Se pierde | Sube | **[INFERIDO]** + regla del taller «no tiny floating crumbs» |
| **Tinta fina** (< 3 px a 1024) | Se rompe en tramos | **Desaparece** | Neutro o sube | **[INFERIDO]**: 2 px a 1024 = 0,47 px a 240 |
| **Brillos y humo semitransparentes** | Bandas (alfa a 32 niveles) | Bandas | Sube | **[DOC]** `validar.mjs` avisa si hay > 35 % semitransparente |
| **Pelo esponjoso pintado** (el de la casa) | Sobrevive | Suavizado | **Lo más caro** (8–10 MB) | **[MEDIDO]** §3.2 |

**Regla que sale de esto:** *la textura de pantalla (trama, Ben-Day, grano, papel, acuarela, brillantina) va en el shader o en el horneado, nunca en la pintura.* El juego ya trabaja así: `ComicFilter` pone el halftone en batalla y `bakeCel` pone la trama en los Momentos.

### 4.4 Qué estilos inflan el SVG

De más caro a más barato: **ruido** (grano, estática, brillantina, trama pintada) > **pelo pintado con muchos mechones** > **degradados suaves y acuarela** > **brillos o humo semitransparentes grandes** > ilustración con línea media y sombras suaves > **cel de 2 tonos con línea gruesa** > **facetas o color plano**.

Estimación para las dimensiones planas: completo de **3–5 MB** en vez de 7–8 **[INFERIDO]**. Eso dejaría más lugar en `nolc-arte` y bajaría el costo de rasterizar. **Hay que confirmarlo con el primer gato de cada dimensión.**

### 4.5 ¿Variantes de estilo del mismo gato?

Hay tres caminos, de más barato a más caro:

1. **Horneado o lente (sin arte nuevo).** El mismo SVG, redibujado al cargar por un shader propio de la dimensión. Ya existe en Momentos (§4.6) y en el mundo 3D (`PaperCat`: lentes ECO cristal, oro, tinta, acuarela, holograma y la lente PÁGINA). **Límite medido:** el posterizado completo (`flat 1`) dejó el pelaje «lodoso» y se descartó; lo que funciona es *cel sobre la pintura* (`flat 0.5`), que conserva ojos y cara (29 §5.6). Una lente cambia la línea, la sombra, la textura y el color, pero **no cambia la silueta ni las proporciones**.
2. **Repintar como forma.** El gato redibujado en cel anime es un **slug nuevo** (como Canelo Almirante): Codex en modo referencia con el original + MAI + rig + ~8 MB de hosting. **[MEDIDO]** las dos evoluciones de Canelo salieron en v1 con la referencia, así que Codex conserva la identidad.
3. **Variante de cara con el mismo encuadre** (boca abierta para los cantantes, cara de ataque). GPT Image en modo edición con **máscara** sobre la cara; todo lo demás queda idéntico. Mismo rig, se cambia la textura. Hoy cuesta una pintura completa más (~8 MB). Una versión con solo el recorte de la cara, compuesta sobre la base al cargar, pesaría ~1 MB, pero **requiere código que no existe** y hay que validar si la herramienta de imágenes de Codex acepta máscara (la API `images/edits` del respaldo sí). **[INFERIDO]**

### 4.6 Lo que hace el kit de Momentos para cambiar de estilo sin arte nuevo

Todo se hornea **una vez al cargar** (`Studio`, gancho `bake`): cuesta cero por cuadro (29 §11).

| Horneado o pase | Momento | Qué hace con el gato | Sirve para |
|---|---|---|---|
| `bakeCel` | LIKY FIGHT (NEÓN CEL) | Kuwahara → sombras cel sobre la pintura → línea de color → contorno → luz de borde → trama en lo más oscuro | **Anime** |
| `bakeToon` + `film.ts` | CIRCUS MALUS (feria de 1930) | 3 tonos planos por color, contorno y líneas interiores negras, sin trama. Post: nitrato B/N ↔ Technicolor de dos tiras, grano y parpadeo a 24 fps, rayas, iris | **Borracha** (toon) y **cine mudo** |
| `SymCat` | CIRCUS MALUS | Media pintura + su espejo: un gato simétrico sin arte nuevo | Gags |
| Cel de historieta + `bakeStencil` + `benDayLayer` | te ODIO | Cómic limpio (tinta casi negra, Ben-Day, cuatricromía, globos POW) y plantilla de spray de 3 tonos; el personaje cambia de pintura al cruzar el frente | **Superhéroes** |
| `bakeMiniature` + `ink.ts` | WHEN I LOSE | Línea sepia, contorno ocre, borde dorado; sumi-e con aguadas y pincel seco; pan de oro | **Libros** (iluminado) |
| `catF` + `AnimaticFilter` + `PaperFilter` | YONOSE TODO | Lápiz que hierve, acuarela con granulación y bordes húmedos, papel de cuaderno | **Libros** (acuarela) |
| Grabado sepia | Hemkade | Gatos entintados en sepia sobre láminas de buril | Libros y grabado |
| `silhouette` | Todos | Silueta blanca para teñir (smears, fantasmas, impactos) | Transiciones |

En el juego normal también hay: `ComicFilter` (posterizado + halftone), `InkFilter` (tinta manga), `OutlineFilter` y `GlowFilter` sobre `BattleCat`; `?scene=art` («DIMENSIONES»: isla, cómic, Battle Form y tinta); y las 13 «dimensiones» de la isla (paleta, patrón, cielo y cascadas por dimensión, con los gatos iguales).

**Ojo:** estos horneados viven dentro de `momentos/`. Usarlos en la isla, la batalla o la Catdex de una dimensión necesita **sacarlos a un módulo común** y un gancho de horneado en `livingCat()`. Es código moderado. Lo que no conviene es aplicar el filtro en vivo: un filtro de Pixi por gato rompe el batching y cuesta una pasada por gato en cada cuadro.

### 4.7 ¿3D (three.js) en secuencias?

**Sí, para el mundo; no para los gatos.**
- Hemkade corre three.js en su propio canvas, mostrado como textura dentro de la capa de cámara del kit. Usa toon de bandas duras, contorno de color por casco invertido y un segundo modo de grabado en los mismos shaders. Va a 60 fps con vsync en el M4. **[DOC]** 29 §16.
- Los gatos siguen siendo **pinturas horneadas paradas en puntos 3D proyectados**. Rupturas hace lo mismo con `PaperCat` (billboard + malla del puppet).
- **No existe un pipeline de gatos 3D** (modelado, rig 3D, estilo): sería otro proyecto. Para Superhéroes (ciudad), Anime (escenarios de pelea) o POP (escenario de concierto), el 3D toon es una buena herramienta de **escenario y cámara**.

---

## 5. Matriz: estilo de dimensión → técnica recomendada

Invariantes en todas las dimensiones, para que el rig y la colección sigan funcionando: cámara 3/4 hacia la izquierda, cuerpo completo, patas en la línea base, **dos ojos abiertos**, orejas libres, cola visible y lejos de la cara, flotantes con aire alrededor, y que se reconozca como gato. Lo que varía de verdad es la silueta, las proporciones, la línea, el color, la sombra y el acting.

| Dimensión | Pintura del gato (Codex) | Rig y animación | Shader o lente | Momento | Costo | Riesgo |
|---|---|---|---|---|---|---|
| **Borracha** (taberna, caricatura de TV) | Línea oscura gruesa y uniforme, color plano, 0–1 sombra dura. Proporciones de caricatura: ojos grandes y redondos de blanco plano con pupila chica, cuerpo de pera, hocico prominente. Paleta saturada de TV. Accesorio protagonista grande (jarra, trapo, palillo) | Manías nuevas baratas: `sway` (bamboleo, `lean` senoidal), `hipo` (pulso de `crouch` + `headDy`), caminar tambaleante. Los ojos de blanco plano parpadean muy bien con el párpado plano | `bakeToon` (CIRCUS MALUS) para los gatos de la casa que la visiten; scanlines o curvatura de TV suaves (`CRTFilter` de pixi-filters) | Rebote rubber-hose al tiempo (ya existe) | **Bajo** (pintura liviana, horneado existente) | Parecido con una serie concreta (piel amarilla, sobremordida, ojos saltones juntos): pedir «caricatura de TV de los 90» genérica, **sin** amarillo de piel ni esos ojos |
| **Superhéroes** (cómic) | Tinta gruesa con peso variable, color plano de cuatricromía, negros masivos en bloques. Proporciones heroicas (pecho ancho, cabeza ~1/4, postura firme). Capa como forma grande separada del cuerpo. **Sin** Ben-Day ni halftone pintados | Capa: hoy solo un `pin` (quieta) o un `float`. Para que ondee hace falta un rig de **varias colas** (cambio chico en `puppetCore`, propuesto). Telarañas, rayos y ganchos como **líneas en código**, nunca pintadas | `ComicFilter` (ya en batalla) + baldosas Ben-Day (te ODIO) + desregistro CMYK (`RGBSplitFilter`) + onomatopeyas en Bangers | Viñetas (`panels`), POW, cut-ins | **Bajo-medio** | **Alto en las parodias:** emblemas en el pecho, patrón de telaraña del traje, siluetas de máscara icónicas. El brief prohíbe emblemas y patrones de marca; el chiste va en la actitud y los gadgets genéricos |
| **Anime** (shōnen) | Lo más cercano a la casa: cel de 2 tonos con borde nítido, línea fina-media (≥ 6 px), pelo en mechones puntiagudos (silueta legible), ojos grandes con brillo duro | Aura y energía como `floats` + FX del kit. Intent de «carga de poder» (`crouch` sostenido + temblor) + `attack`. Todo barato | `bakeCel` tal cual | **Todo** el kit de LIKY | **El más bajo** | Que copie rasgos de una serie concreta (sombrero de paja + cicatriz, banda en la frente, pelo dorado erizado): pedir tropos genéricos |
| **Libros** (ilustración de libro) | Pluma media (≥ 6 px, **nunca hairline**), acuarela **plana** en 2–3 valores con bordes definidos, paleta sepia y apagada, proporciones de libro ilustrado. Anteojos con `lid` elíptico (precedente: Archivista) | Libros, varitas y velas como `floats`; chispas de varita en código; transición de pasar la página | `bakeMiniature`, `catF`/`AnimaticFilter` (granulación y papel en shader), `InkFilter`; en 3D, lentes ECO tinta y acuarela | TINTA Y PERGAMINO, ANIMATIC | **Medio** (equilibrar la acuarela plana pintada con la del shader) | Parodia de mago: cicatriz en la frente + anteojos redondos + bufanda de casa = vestimenta de una marca. Pedir elementos genéricos de escuela de magia |
| **POP** (música pop + cine mudo) | **Cine mudo:** pintar en color plano y que el post lo vuelva B/N (no pintar en grises: un mismo SVG sirve en B/N y en color). Bombín, bastón, zapatos grandes. **Pop:** color plano audaz, brillos como formas planas, lentejuelas como **pocas formas grandes** (nunca brillantina) | Cantar sin boca: balanceo de cabeza (`headDy`/`headA`), `lean` al ritmo y `emote('happy')`. Boca de verdad = **variante de cara** (§4.5.3). Andar tipo Chaplin con `walk` + `lean` oscilante (intent nuevo, barato). El bastón no gira (los `floats` solo bambolean): hacerlo prop en código | `film.ts` (grano, parpadeo, iris, B/N ↔ Technicolor); intertítulos en Playfair; pop: neón y brillos en FX | CIRCUS MALUS (cine), notas y confeti del kit | **Bajo** en cine mudo; **medio-alto** en cantantes con boca | **Alto:** parecido con personas reales (cara, peinado, vestuario característico). Además, los derechos de las canciones si hay Momento |

**Titiriteros.** La biblia de la Parte II dice que los Titiriteros se dibujan como «manos y luz, nunca cuerpos completos» (08 §3). Si en la Parte III son gatos, el director tiene que conciliarlo. En cualquier caso, **los hilos van en código** (líneas de `Graphics` desde las patas hasta las marionetas): pintados son hairlines que desaparecen en el lite, y en código se mueven.

**Rareza MULTIDIMENSIONAL.** Es justo lo que resuelve la lente: **una** pintura que se hornea con el estilo de la dimensión donde está, más un marco de carta propio (código de UI). Cambiar de silueta en cada dimensión ya serían N pinturas.

---

## 6. Plantilla de BRIEF para Codex (Parte III)

### 6.1 Qué cambia en el taller (propuesto, no hecho)

Lo decide el director; `estilo/` y las herramientas no los toca Codex.
1. **Un style lock por dimensión** en `estilo/dimensiones/<DIM>.txt`, que **reemplaza** al STYLE LOCK de la casa (este prohíbe la línea de tinta y pide pintura con pelo esponjoso, lo contrario de varias dimensiones).
2. **Referencias por dimensión** en `referencias/dimensiones/<dim>/`: el primer gato aprobado de cada dimensión es su **ancla**. **No hay que adjuntar** las referencias de la casa (canelo, candy, steampunk), porque arrastran el estilo pintado.
3. Un bloque nuevo, **`estilo/VECTOR_READY.txt`**, con las reglas de §4.3.
4. `compilar.mjs`: si el gato tiene `dimension`, usa ese style lock y esas referencias, y agrega los campos de estilo y `VECTOR_READY`.
5. `contacto.mjs`: agregar una columna de **64 px en negro** (prueba de silueta), además de la de 128 px.
6. `validar.mjs`: avisar si hay demasiadas regiones chicas (ruido), contando componentes conectados < 0,1 % del lienzo.

### 6.2 Campos del manifest

Los campos marcados con **(nuevo)** son la propuesta; el resto ya existe en `manifest.json`.

| Campo | Contenido |
|---|---|
| `id`, `name`, `rarity`, `elements`, `role`, `epithet`, `lote`, `folder`, `file`, `parte` | Identidad (igual que hoy) |
| `dimension` **(nuevo)** | `borracha` · `superheroes` · `anime` · `libros` · `pop` · `cine_mudo` |
| `style_lock`, `references` **(nuevos)** | Ruta del style lock y de las anclas de la dimensión |
| `concept_es`, `look_es`, `identifying_features_es` | Notas del director |
| `subject_en` | El sujeto, concreto |
| `coat_en` | **Obligatorio.** Pelaje, patrón, largo y color de ojos |
| `silhouette_en` **(nuevo)** | Forma reconocible en negro a 64 px |
| `proportions_en` **(nuevo)** | Cabeza respecto del cuerpo, patas, volumen |
| `line_en` **(nuevo)** | Color, grosor mínimo en px a 1024 y peso variable o uniforme |
| `palette` + `color_en` **(nuevo)** | Hex dominantes y regla de color (plano, sin degradados…) |
| `shading_en` **(nuevo)** | Número de tonos, borde duro o suave, color de la sombra |
| `texture_en` **(nuevo)** | Casi siempre «NONE painted»: la pone el juego |
| `pose_en`, `expression_en` **(nuevos)** | Pose idle con patas en la línea base; expresión con boca cerrada (salvo variante) |
| `accessories_en`, `hero_prop_en` **(nuevos)** | Lista de accesorios y el objeto que lo identifica en miniatura |
| `rig_notes_en` **(nuevo)** | Restricciones para el rig: dónde no puede ir nada respecto de ojos, orejas y cola |
| `must_not_include_en` **(nuevo)** | Logos, letras, emblemas, caras humanas, parecido con personas reales, trajes de marca |
| `must_not_resemble`, `replaces_recolor_of` | Igual que hoy |
| `variants` **(nuevo)** | `[{ kind: "face", mask: "muzzle", subject_en: "mouth open singing" }]` para variantes con el mismo encuadre |
| `corrections_en` | Igual que hoy. Escribir las preventivas **antes** de generar |

### 6.3 Orden del prompt compilado

1. Línea de apertura (la de siempre).
2. `[DIMENSION STYLE LOCK — <DIM>]`: reemplaza al de la casa.
3. `[ASSET]`: sujeto, `coat_en`, notas, rasgos.
4. `[STYLE FIELDS]`: silueta, proporciones, línea, color, sombra, textura, pose, expresión y accesorios.
5. `[VISUAL DESIGN]`: rareza, paleta, lenguaje del elemento.
6. `[UNIQUENESS]`.
7. `[CORRECTIONS FROM THE ART DIRECTOR — HIGHEST PRIORITY]`.
8. `[STYLE CONSISTENCY]`: las anclas de la dimensión mandan.
9. `[ANIMATION RIG REQUIREMENTS]`: el de siempre + `rig_notes_en`.
10. `[VECTORIZATION RULES]` (nuevo).
11. `[CAMERA & COMPOSITION]`, `[GAME READABILITY]` (64 y 128 px), `[OUTPUT SPECIFICATION]`.
12. `[DO NOT INCLUDE]` + `must_not_include_en`.

### 6.4 Ejemplo relleno: un gato genérico de cómic (sin marcas)

**Esto es un ejemplo de formato.** No es una propuesta de gato ni de contenido.

```json
{
  "id": "c_capacorta",
  "name": "Capa Corta",
  "epithet": "el Novato",
  "lote": "h",
  "folder": "lote-h-dimensiones",
  "file": "lote-h-dimensiones/c_capacorta.png",
  "parte": "Parte III",
  "dimension": "superheroes",
  "style_lock": "estilo/dimensiones/SUPERHEROES.txt",
  "references": ["referencias/dimensiones/superheroes/ancla-1.png"],
  "rarity": "Común",
  "elements": ["Tormenta"],
  "role": "Artillero",
  "concept_es": "Superhéroe novato del barrio: se hizo la capa con una toalla y nadie le ha pedido ayuda todavía.",
  "look_es": "gato tuxedo de pecho inflado, antifaz de tela bajo los ojos, capa corta de toalla roja, cinturón con una bolsita, puño en alto con un rayito.",
  "identifying_features_es": [
    "capa corta de toalla roja con dobladillo desigual",
    "antifaz azul que pasa POR DEBAJO de los ojos, sobre el hocico",
    "cinturón café con UNA bolsita",
    "rayito amarillo flotando sobre la pata alzada"
  ],
  "subject_en": "rookie neighborhood superhero cat with a puffed-out chest, a short red bath-towel cape with an uneven hem, a blue cloth domino mask, a brown utility belt with one pouch, one front paw raised in a fist under a small floating yellow lightning bolt",
  "coat_en": "black-and-white tuxedo, short hair, white chest and white front paws, NO stripes, bright green eyes",
  "silhouette_en": "a wide triangle: broad chest and shoulders, narrow hips; the cape flares out to image-right as one big simple shape; one raised fist breaks the outline on the left",
  "proportions_en": "heroic but cute: head about one quarter of total height, chest twice as wide as the hips, sturdy short legs, big paws",
  "line_en": "bold dark-indigo ink outline (#1B1530), 12-16 px at 1024 on the silhouette, 6-8 px for interior lines, slightly varying brush weight; no hairline strokes thinner than 6 px",
  "palette": ["#1B1530", "#E8322E", "#2A6FDB", "#FFD23F", "#F4EFE6"],
  "color_en": "flat comic-book fills; each material has ONE base color; no gradients except one soft glow on the lightning bolt",
  "shading_en": "two-tone hard-edged cel shading: one flat shadow shape per material, shadow color is a darker cool tint of the base; large spotted blacks allowed under the cape and the chin",
  "texture_en": "NONE painted: no halftone, no Ben-Day dots, no screentone, no paper grain, no noise; the game adds them",
  "pose_en": "proud heroic stance, all four paws on the shared baseline except the raised fist paw; body three-quarter toward image-left, head toward the viewer",
  "expression_en": "eager confident grin with the mouth closed, eyebrows not drawn, both eyes wide open",
  "accessories_en": ["short red towel cape", "blue cloth domino mask", "brown utility belt with one pouch"],
  "hero_prop_en": "the small yellow lightning bolt floating above the raised fist, readable at 64 px",
  "rig_notes_en": [
    "The domino mask sits BELOW the eyes across the muzzle and cheeks; the fur band directly above each eye (one eye-height tall) stays plain fur, never mask.",
    "The cape attaches at the shoulders and flares to image-right; it never touches the tail and never covers the face.",
    "The tail curves up to image-left behind the raised paw, fully visible, 5% of canvas away from the cheek.",
    "The lightning bolt floats with at least 3% of canvas of empty space around it."
  ],
  "must_not_include_en": [
    "No chest emblem, no logo, no symbol on the belt buckle, no letters or numbers anywhere.",
    "No costume, mask shape or color scheme recognizable as an existing branded superhero.",
    "No human, no human face, no speech bubble, no comic panel border."
  ],
  "must_not_resemble": ["supernova_gunslinger_cat", "valquiria_lightning_cat"],
  "variants": [],
  "corrections_en": [
    "Both eyes are open with visible irises and highlights; both ears stay free of the mask and the cape."
  ]
}
```

`estilo/dimensiones/SUPERHEROES.txt` (borrador del bloque que reemplaza al STYLE LOCK de la casa):

```text
[NO ONE LIKE CATS — DIMENSION STYLE LOCK: SUPERHÉROES — DO NOT MODIFY]
This cat belongs to the SUPERHEROES dimension of the game. Match the attached dimension anchors, NOT the painterly house cats.
Visual medium: 2D comic-book character art, bold inked outlines, flat colors, hard-edged two-tone shading, large spotted blacks.
Anatomy: real cat anatomy with heroic cartoon proportions (head about one quarter of the height, broad chest). Two large eyes, both open.
Line: dark colored ink (never pure #000000), 12-16 px on the silhouette at 1024, 6-8 px inside. No sketchy or hairline strokes.
Color: flat fills, 3-5 dominant hues plus the coat; no gradients except one glow; no painted texture of any kind.
Camera, pose and framing: identical to the house rules (three-quarter toward image-left, paws on one baseline, whole body inside the frame).
Never: painted halftone or Ben-Day dots, screentone, paper or film grain, glitter, airbrush gradients, photographic fur.
```

`estilo/VECTOR_READY.txt` (nuevo, igual para todas las dimensiones):

```text
[VECTORIZATION RULES]
This image will be traced into vector shapes. Therefore:
- Every line is at least 6 px wide at 1024 px; silhouette outlines at least 10 px.
- Shading is made of a few flat shapes with hard edges; at most 3 values per material.
- No painted texture: no dots, halftone, screentone, grain, noise, glitter, sparkles smaller than 2% of the canvas, or watercolor granulation.
- Glows and smoke: at most one, large and simple.
- Small details are at least 2% of the canvas wide; anything smaller will disappear.
```

---

## 7. Estados de producción y criterios de aceptación

Se agregan sobre los estados de Codex (`PENDIENTE → GENERADO → CORREGIR → APROBADO → ENTREGADO`), que siguen igual.

| Estado | Quién | Criterio de aceptación verificable |
|---|---|---|
| **DISEÑADO** | Director + Claude | 1. Ficha con todos los campos de §6.2 y `coat_en`. 2. **Plan de rig** escrito (dónde caen ojos, orejas, cola, `pins` y `floats`; qué ojo queda fuera si se tapa). 3. **Plan de animación** escrito: `trait`, manías y reacciones, y cuáles de §8.2 lleva. 4. Dimensión con style lock y ancla aprobados (el primer gato de la dimensión **es** el ancla). 5. Línea de presupuesto: shard con espacio y MB estimados. 6. Revisión de marcas: sin nombres, logos ni emblemas, y sin parecido con personas reales en `subject_en`. 7. `node herramientas/compilar.mjs <id>` sin error. |
| **GENERADO** (+ `APROBADO` del director) | Codex → director | 1. `validar.mjs <id>` sin ERROR y con los AVISOS explicados. 2. El pelaje coincide con `coat_en`. 3. En la hoja de contacto, la **silueta en negro a 64 px** se distingue de los demás gatos de su dimensión y el objeto protagonista se lee a 128 px. 4. Cumple el checklist E (ojos abiertos, orejas libres, cola visible y lejos de la cara, flotantes con aire). 5. Sin textura pintada (inspección visual de la hoja a 100 %). 6. El director escribió «ok». |
| **INTEGRADO** | Claude | 1. Traza del completo con MAE ≤ 11 (colapso > 22: rehacer con el otro filtro). 2. Lite con MAE < 22 (la compuerta) y, como objetivo, ≤ 13. 3. Compactación con píxel idéntico. 4. **Tamaño:** completo ≤ 10 MB (el máximo de hoy) y, en dimensiones planas, objetivo ≤ 5 MB; lite ≤ 1,5 MB. 5. Cero `<image>`, `<script`, `on…=` (el publish los rechaza). 6. Rig en `catRigs.json` y en la copia de MAI; ficha de datos; sin `STAND_IN`. 7. `npm run build` pasa (guarda anti-raster) y pasan los tests que exigen rig y los 2 SVG. |
| **VERIFICADO** | Claude (QA) + director | 1. `catlive` a 450 y 900 px con `&rig=1`. **Sin rasgaduras**: con `wind = ±1` + `happy` + `attack` + `hurt`, ni la cara, ni los anteojos o antifaz, ni la capa, ni los accesorios se estiran o se arrastran (se revisa una tira de cuadros exactos con el reloj congelado, como en 31 §4). 2. La lente u horneado de su dimensión deja los ojos legibles y la cara sin lodo, a 128 y 900 px. 3. Revelación (`fxlab`), Catdex, batalla y región o dimensión. 4. Sus animaciones especiales terminan en reposo y respetan «Reducir movimiento» (`temperament.test.ts`). 5. **Rendimiento:** 60 fps con vsync (p95 ≤ 20,8 ms, el umbral medido en Momentos) con **30 gatos** en la isla y en Rupturas en calidad Media en el M4. El horneado de dimensión no supera el presupuesto de VRAM: lite + horneado ≤ 4 MB por gato en la isla. 6. Completo publicado en su shard (`art-manifest.json` lo lista) y `PROGRESO.md` en `ENTREGADO`. |

---

## 8. Presupuesto realista

### 8.1 Primer lote recomendado

**7 gatos completos:** las 5 parodias (2 de Superhéroes, 1 de Libros y 2 de POP) más 1 ancla de Borracha y 1 de Anime. Así cada dimensión tiene su ancla en el primer lote.

| Fase | Trabajo | Tiempo |
|---|---|---|
| 0 · Hosting | Abrir `nolc-arte-2` (con el dueño) | 1 sesión corta |
| 1 · Exploración de estilo | 5 style locks + 3–4 candidatos por dimensión (~20 PNG). El director elige las anclas | Codex ~30 min; director 1 sesión **[INFERIDO]** de las ventanas de §2 |
| 2 · Producción | 7 PNG + 1–2 rondas de corrección (con `coat_en` y correcciones preventivas: ~14 % de reintentos) | Codex < 30 min; director 1–2 sesiones |
| 3 · Integración | Traza, lite, rig, datos, laboratorio | **~3–4 h** de agente (medido: ~28 min por gato en el lote F) |
| 4 · Lentes de dimensión | Sacar de `momentos/` a un módulo común `bakeCel`, `bakeToon` + `film.ts`, el horneado de cómic, `bakeMiniature` y `catF`, y conectarlos a `livingCat()` por dimensión | **2–3 días** de agente **[INFERIDO]** |
| 5 · Animaciones especiales baratas | 7 gatos × presentación, ataque, reacción, celebración y comportamiento ambiental, por datos y intents (§8.2) | **7 × 3–5 h ≈ 3–4 días** de agente **[INFERIDO]** |
| 6 · Verificación | Criterios de §7 | ~1 día |
| **Total** | | **6–8 días de agente + 3–4 sesiones del director**; con las esperas, unas 2 semanas de calendario |

**Hosting del lote:** 7 × (3–8 MB) = **21–56 MB** de completo + ~7 MB de lite. Hoy cabría justo en `nolc-arte`, pero no dejaría lugar para el lote siguiente: por eso la fase 0.

**Alternativas:**
- **Mínima** («casa + lente»): gatos pintados en el estilo de la casa y la dimensión solo por horneado. Unos 3 días. Pero contradice el pedido del dueño de que **la silueta y las proporciones** cambien.
- **Con poses:** sumar 2 pinturas por gato (ataque y celebración) para los 7 gatos son 14 pinturas: **~110 MB más** de hosting, una ronda extra de Codex y ~2 días más de agente (rigs y cortes).

### 8.2 Qué animaciones especiales son baratas y cuáles caras

| Animación | Cómo se hace | Costo por gato | ¿Arte nuevo? |
|---|---|---|---|
| Comportamiento ambiental | `trait` → temperamento (manías, postura, saltos); `SPECIES_MASS`; `floats`; props en código (hilos, telarañas, notas, burbujas) | 0–1 h | No |
| Reacción | Tabla `react` del temperamento o un `case` nuevo en `reactionIntent` | 0,5–2 h | No |
| Celebración | `cheer`, `puff` o `bounce`, o una propia armada con `Score` (`hopInto`, `wiggle`, `hold`) | 1–2 h | No |
| Presentación (revelación) | Intent + cues + FX + la lente de su dimensión dentro de `playCatReveal`. Necesita **una vez** un gancho por gato (~1 día) | 1–2 h | No |
| Ataque | `emote('attack')` + `ultCutIn` + set piece en `battle/ultFx.ts` (legendarios o más) | 3–6 h | No |
| Firma completa tipo Canelo | `Temperament` propio + 2–4 reacciones o manías nuevas + tests | 3–5 h | No |
| Capa o tela que ondea | Rig de varias colas (cambio único en `puppetCore`, ~0,5–1 día) + 15 min por gato | Bajo | No |
| Patas que se levantan | Regiones de pata en el rig (08 §5 propuesto), ~1–2 días una vez. Solo levantar o pisar: lo oculto no está pintado | Medio | No |
| Boca o cantar | Variante de cara con el mismo encuadre, cambio de textura en el tiempo | 1–2 h + ronda de Codex + ~8 MB (o ~1 MB con el código de recorte, que no existe) | **Sí, 1 pintura** |
| Pose distinta (ataque, celebración) | 2.ª pintura + rig + corte escondido detrás de un cuadro de impacto o un smear de silueta | 2–3 h + ronda de Codex + ~8 MB | **Sí, 1 pintura por pose** |
| Cuadro por cuadro (8–24 dibujos) | Una pintura por cuadro | 8–24 × 8 MB por animación; Codex no garantiza identidad entre cuadros | **Sí: no recomendado** |

Los tiempos de esta tabla son **[INFERIDOS]** del alcance de `intent.ts`, `temperament.ts` y 31 §3. Los de integración son **[MEDIDOS]** (§2).

---

## 9. Riesgos y decisiones para el director

1. **Abrir `nolc-arte-2` antes de cualquier lote** (necesita al dueño). Sin eso, el 10.º gato nuevo hace fallar la publicación del arte.
2. **Coherencia contra variedad.** La biblia pide que «con la lente apagada, todo se vea como el mismo juego» (08 §7). El pedido del dueño va en contra. Propuesta: mantener los invariantes de rig y cámara de §5 y dejar libres la línea, el color, la sombra, la silueta y las proporciones.
3. **Marcas y personas reales** en las 5 parodias (emblemas, trajes, vestimenta, cara o peinado de artistas, canciones). El brief los prohíbe, pero conviene una decisión explícita sobre hasta dónde llega la parodia.
4. **Codex vuelve a su costumbre:** sin `coat_en`, pinta atigrados cafés; sin un style lock propio, pintaría el estilo de la casa. Las anclas por dimensión y no adjuntar las referencias de la casa son obligatorios.
5. **Los horneados viven en `momentos/`.** Usarlos en el juego normal es trabajo de código (fase 4). Aplicar filtros en vivo a 30 gatos no escala.
6. **Primera medición real:** el peso de un gato «plano» (estimado en 3–5 MB) hay que confirmarlo con el primer gato de cada dimensión antes de fijar el presupuesto.

---

## 10. Fuentes

- Repo: `docs/part-ii/08-biblia-arte.md`, `09-hosting-arte.md`, `10-estado-implementacion.md` (§2c–2e), `11-rendimiento-sin-iris-xe.md` (§6), `29-momentos-musicales.md` (§3, §5.5–5.6, §11, §14–18), `31-animaciones-con-proposito.md`, `agentes/ART-F.md`; `docs/arte/DIRECCION-ARTE-PARTE-2.md`, `docs/arte/hoja-de-produccion.html`; `docs/guias/agregar-gato.md`, `docs/guias/animaciones.md`.
- Código: `game/src/art/{puppetCore,livingCat,intent,temperament,catArt,rasterCache}.ts`, `game/src/momentos/anime/{actor,shaders}.ts`, `momentos/songs/{circusMalus/film.ts,teOdio/bake.ts,whenILose/ink.ts,yonoseTodo/paper.ts,likyFight/stage.ts}`, `game/src/engine/world/paperCat.ts`, `game/src/island/dimensions/defs.ts`, `game/scripts/art-publish.ts`, `game/src/data/catRigs.json`, `game/public/cats-svg/{game-export.json,lite/game-thumbs.json}`.
- Fuera del repo: `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/` (`AGENTS.md`, `GAME_ART_BIBLE.md`, `PROMPT_FACTORY.md`, `estilo/*`, `manifest.json`, `PROGRESO.md`, `herramientas/{validar,contacto,generar}.mjs`, `prompts/lote-f-astral/r_grafitera.md`, `_crudos/`); `~/Desktop/MAI SVG/` (`README.md`, `VECTOR.md`, `MOTION.md`, `AGENTS.md`, `docs/{STATUS,CHARACTERS,GAME-ASSETS,PRESERVATION}.md`, `packages/converter/index.ts`, `scripts/{game-export,game-thumbs}.ts`).
- En vivo: `https://ragosorio.github.io/nolc-arte/art-manifest.json`; log del deploy `38116399180` (2026-10-11).
