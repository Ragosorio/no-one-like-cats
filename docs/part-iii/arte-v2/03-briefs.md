# 03 · Briefs para Codex y style locks de los multiversos (arte v2)

> Ronda 4 de la Parte III. Lo escribe el agente ARTE-V2. ⚠️ Spoilers. Nada se commitea ni se publica sin el OK del dueño.
> El taller vive **fuera del repo**: `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/` (en este documento, `arte-nuevo/`). Ningún PNG entra al repo.

## 0. Resumen

- **10 style locks nuevos** en `arte-nuevo/estilo/dimensiones/`: 5 de parodia para los multiversos que ya existían (`*_V2.txt`) y 5 para los multiversos nuevos. **Los locks v1 no se tocaron.** El texto completo está en el Anexo A.
- **`compilar.mjs` acepta campos nuevos opcionales** (`style_lock`, `reference_en`, `signifiers_en`, `evoke_not_copy_en`, `style_of_en`, `rarity_treatment_en`, `style_consistency_en`). Sin ellos, el prompt sale igual que antes.
- **Verificado** (otra vez después de alinear el catálogo con `historia-v2/`): de los **103 prompts viejos, 100 compilan idénticos** byte por byte. Los otros 3 (Murciégato, Gato Araña y Super Siamés, del lote Q, nunca generados) se pasaron **a propósito** a las reglas v2. Sus prompts v1 se guardaron. **Actualización (W1, 22:25):** El Cadenero y Borrón (lote Q) ahora llevan como anclas a Hipólito y Doña Espuma, que están aprobados (`05` §8). Quedan **98/103 idénticos y 5 cambiados a propósito**.
- **101 prompts nuevos compilados:** 7 del piloto (lote `v`) y 94 del catálogo (lote `w`). Con eso están los 100 gatos de `02` más Miaurio (en pausa).
- **Respaldos** antes de tocar nada: `arte-nuevo/_respaldos/2026-10-26-antes-p3v2/` (`manifest.json`, `comun.mjs`, `compilar.mjs`, `RAREZAS.json`, `dimensiones/` y todos los prompts compilados).

## 1. Qué cambió en el taller

| Archivo | Cambio | ¿Afecta lo viejo? |
|---|---|---|
| `herramientas/compilar.mjs` | `style_lock` gana sobre `dimension`. Secciones nuevas `[REFERENCE SIGNIFIERS — MUST ALWAYS BE VISIBLE]` y `[EVOKE, NEVER COPY]`. Campo `style_of_en` al principio de `[STYLE FIELDS]`. `rarity_treatment_en` reemplaza el texto de `RAREZAS.json` si está. `style_consistency_en` reemplaza el texto de `[STYLE CONSISTENCY]` (para Pinceles y Mitos, donde cada gato tiene su propio estilo de fuente) | No: todo es opcional. 100/103 idénticos |
| `herramientas/comun.mjs` | Lotes `v` (`_p3v2/piloto`) y `w` (`_p3v2/catalogo`) | No |
| `estilo/dimensiones/*_V2.txt` y 5 locks nuevos | Nuevos (Anexo A) | No |
| `manifest.json` | +98 fichas nuevas; Murciégato y Gato Araña pasan al lote `v` y Super Siamés al lote `w` con las reglas v2. Total: 201 fichas. Las 4 fichas que pasaron a reserva se guardaron en `_p3v2/reserva-manifest.json` | Solo esos 3, a propósito |
| `_p3v2/` (nuevo) | Todo lo de esta ronda: `gen.sh` (copia de `_p3/gen.sh` que lee la carpeta del manifest), fichas del piloto (`piloto.json`), fuente del catálogo (`catalogo-src/*.json`), herramientas (`upsert.mjs`, `catalogo.mjs`, `a700.mjs`, `contacto-v2.mjs`), crudos, normalizados, SVG y hojas | — |

**Cómo se verificó:** se compiló todo en tres espejos del taller dentro del scratch del agente: A (antes de tocar nada), B (compilador nuevo con el manifest viejo) y C (compilador nuevo con el manifest nuevo). A = B en los 103 prompts, y A = C en 100 (los 3 restantes son los que pasaron a v2). Para repetirlo, copia `herramientas/{compilar,comun}.mjs`, `estilo/` y `manifest.json` a una carpeta vacía, corre `node herramientas/compilar.mjs todo` y compara con `_respaldos/2026-10-26-antes-p3v2/prompts-compilados/`.

## 2. El brief v2 (campos)

Los campos de siempre (`id`, `name`, `rarity`, `elements`, `role`, `subject_en`, `coat_en`, `palette`, `rig_notes_en`, `must_not_include_en`, `corrections_en`…) siguen igual (`../investigacion/arte-pipeline.md` §6.2). Lo nuevo:

| Campo | Qué lleva | Ejemplo (Homiau) |
|---|---|---|
| `style_lock` | El lock de parodia del multiverso si su lock v1 prohíbe los rasgos | `dimensiones/BORRACHA_V2.txt` |
| `reference_en` | La referencia **descrita sin nombres registrados** | «the dopey, donut-loving yellow father of a long-running prime-time animated family sitcom» |
| `signifiers_en` | 3–5 rasgos obligatorios, uno por línea, concretos y medibles (color en hex, forma, cantidad) | «A bald round crown with exactly TWO thin curved hairs on top (8 px lines)…» |
| `evoke_not_copy_en` | Cómo se evoca sin copiar | «The two hairs and the stubble are fur markings on a cat head, never a human head» |
| `style_of_en` | El medio que tiene que evocar el dibujo | «a 1990s prime-time yellow family sitcom cartoon: uniform line, flat fills, no shading» |
| `rarity_treatment_en` | La rareza sin adornos que tapen los rasgos | Multidimensional: «the reference IS the rarity» |
| `style_consistency_en` | Solo Pinceles y Mitos: «cada gato tiene su estilo de fuente» | — |
| `referencia_es` | El nombre real, **solo para el equipo** (no se compila) | «Homero Simpson (sin serlo)» |

**Regla de redacción** (`01` §6): ningún nombre registrado entra al prompt, ni en inglés ni en `concept_es`, que también se compila. Se revisó con `grep` en los prompts nuevos: solo aparecen los nombres felinos propios y las descripciones genéricas.

### 2.1 Valores por multiverso (los pone `catalogo.mjs`)

Cada ficha del catálogo hereda estos valores de su multiverso. Lo propio de cada gato (sujeto, pelaje, rasgos, pose, objeto) sale de `_p3v2/catalogo-src/*.json`.

| Multiverso | Lock | Línea | Color y sombra | Proporciones |
|---|---|---|---|---|
| Borracha (familia del sillón) | `BORRACHA_V2` | Ciruela uniforme 10–12 px | Plano, **sin sombras** (una bajo la panza) | Cabeza 1/3, ojos enormes que se tocan, sobremordida |
| Superhéroes | `SUPERHEROES_V2` | Tinta índigo de peso variable 12–16 px | Cuatricromía plana, cel de 2 tonos, luz de borde | Heroicas, cabeza 1/4 |
| Anime | `ANIME_V2` | Línea de color 6–8 px | Plano por sección, cel de 2 tonos | Ojos grandes, cuerpo atlético |
| Libros | `LIBROS_V2` | Pluma sepia 6–10 px | Acuarela plana de 2–3 valores | Libro victoriano |
| POP | `POP_V2` | Línea de color 8–12 px | Neón y pastel planos, una luz de escenario | Muñeco pop |
| Pinceles | `PINCELES` | La del pintor, ≥ 8 px | Pinceladas planas del pintor, ≤ 3 valores | Caricatura suave |
| Pantalla | `PANTALLA` | Contorno 10–14 px | Plano (el juego lo pasa a B/N si toca), una luz dramática | Cine de caricatura |
| Píxel | `PIXEL` | Contorno de 1 píxel de la cuadrícula | 10–16 colores, 2 valores en grupos de píxeles | Sprite |
| Mitos | `MITOS` | Contorno 10–14 px | Pigmentos minerales planos | Real, solemne |
| Vecindad | `VECINDAD` | Café cálido 10–12 px | Plano con luz cálida de estudio | Sitcom |

## 3. Cómo se produce un lote (comandos)

Desde `arte-nuevo/`:

```sh
# 1. Fichas → prompts (después de editar catalogo-src/*.json o piloto.json)
node _p3v2/herramientas/catalogo.mjs --manifest      # catálogo → manifest (lote w)
node _p3v2/herramientas/upsert.mjs _p3v2/piloto.json # piloto → manifest (lote v)
node herramientas/compilar.mjs w                      # o v, o un id

# 2. Codex (herramienta de imágenes integrada; modelo gpt-6-astra). Se pueden correr varios a la vez.
./_p3v2/gen.sh <id> <N>          # → <folder>/_crudos/<id>_vN.png  · log en _p3v2/logs/

# 3. Normalizar y validar
node herramientas/normalizar.mjs <folder>/_crudos/<id>_vN.png <folder>/<id>.png
node herramientas/validar.mjs <folder>/<id>.png

# 4. 700 px (lanczos3; si MAI colapsa con MAE > 22, rehacer con mitchell)
node _p3v2/herramientas/a700.mjs <folder>/<id>.png _p3v2/work/700/<slug>.png lanczos3

# 5. MAI SVG por CLI (no hace falta el servidor de la porción 4318)
cd ~/Desktop/MAI\ SVG
npm run --silent mai -- vectorize <dir700> --preset high-color-preserved --output <vec>
cp <vec>/<slug>/high-color-preserved.svg <flat>/<slug>.svg
npx tsx scripts/game-export.ts <flat> <full> <slug…>        # completo compacto
npx tsx scripts/game-thumbs.ts <dir700> <lite> 240 <slug…>  # lite
#    (los dos scripts sobreescriben su JSON de salida: renómbralo o fusiónalo)

# 6. Hoja de contacto pintura vs SVG + pesos
node _p3v2/herramientas/contacto-v2.mjs   # lee _p3v2/slugs.json
```

**Tiempos medidos en el piloto:** Codex, de 1 a 2 minutos por imagen (6 en paralelo terminaron en ~1 min). MAI, ~55 s para 3 gatos a 700 px. Compactar y lite, segundos. Del PNG al SVG, el lote de 6 tomó menos de 10 minutos de máquina. El cuello de botella sigue siendo la revisión del dueño.

## 4. Lo que aprendimos en el piloto (correcciones preventivas para todos los lotes)

1. **El filtro de imágenes bloquea las parodias más fieles** (`01` §3.1). Antes de generar Superhéroes, Píxel o Pantalla, revisa que la ficha no junte la paleta exacta, el emblema y el traje del original. Si se bloquea, se baja un rasgo y se refuerza el chiste. Máximo 2 reintentos.
2. **Si el dibujo trae trazo fino, el SVG pesa el doble** (Van Gato: 8 MB). Para Pinceles: o se acepta el peso (pocos gatos) o se usa el preset `balanced-color-preserved` (3 MB, MAE 8,8; ver `04` §3). **Pedir «menos trazos y más grandes» no bajó el peso**: lo que pesa es la variación de color dentro de cada trazo.
3. **El pixel art sale limpio y liviano** (1,8 MB). El remuestreo a 700 px no importa (lanczos3 y vecino más cercano pesan casi igual).
4. **Gatos negros:** `validar.mjs` avisa «bordes muy oscuros». Es esperado, no es halo: revisa sobre fondo claro en la hoja.
5. **MAI puede colapsar** con lanczos3 (Van Gato v3: MAE 106). Revisa siempre el MAE del JSON. Si pasa de 22, repite el 700 con `mitchell` (el mismo truco que en la Parte II).
6. **Codex entrega 1254 px**, no 1024. `normalizar.mjs` lo resuelve, pero revisa que nada toque el borde antes de normalizar (Van Gato v1 casi tocaba).

## 5. Anclas de estilo por multiverso

Regla de siempre: **el primer gato aprobado de cada multiverso es su ancla** y se adjunta como referencia a los demás (campo `references`). En el piloto **no se usaron anclas**, porque todavía no hay nada aprobado.

| Multiverso | Ancla propuesta (si el dueño aprueba el piloto) |
|---|---|
| Borracha (familia del sillón) | Homiau (`_p3v2/piloto/x_homiau.png`). Los nativos siguen con Hipólito, Espuma y Dona |
| Superhéroes | Murciégato v4 y Gato Araña v2 |
| POP | Billie Bigotish |
| Píxel | Comecroquetas |
| Pinceles y Mitos | **Sin ancla común**: cada gato tiene el estilo de su pintor o de su cultura (`style_consistency_en`) |
| Anime, Libros, Pantalla, Vecindad | El primero que se apruebe |

Cuando el dueño apruebe un ancla, se copia a `arte-nuevo/referencias/dimensiones/<multiverso>/` y se pone en el campo `references` de las fichas de ese multiverso.

## 6. Orden de producción propuesto

| Lote | Gatos | Por qué primero | Estimado |
|---|---|---|---|
| **W1 · Lo que pide `historia-v2/`** | EMIAU, El Estambre, Doctor Ovillo, Príncipe Bigotón, Super Siamés, Harry Gatter, Sonrisa, Sir Simón de Gatterville, Garbancito, Gato Malo, Tailor Swift, Maneki y los cameos Gatzilla, La Gatoconda y El Gritito (15) | Los necesitan las batallas y las películas de la historia | Codex ~20 min, MAI ~15 min, revisión 1–2 sesiones. ~60 MB de completo |
| **W2 · Banderas y Borracha** | Michi-Wan, Lince, Bastet, El Michito del Barril (Multidimensionales) y la familia del sillón (6) | Un Multidimensional por multiverso y el Acto I | ~40 MB |
| **W3 · Cadenas laterales de los 5 multiversos** | El resto de Superhéroes, Anime, Libros y POP (~37) | Las «Cruces del multiverso» (`historia-v2/02-mapa.md` §8.1) | ~150 MB |
| **W4 · Cajas de paso** | El resto de Pinceles, Pantalla, Píxel, Mitos y Vecindad (~24) | Cadenas laterales o post-juego (`02` §2.2) | ~100 MB (Pinceles es el más pesado) |

Los MB salen del promedio medido en el piloto (4,0 MB por gato, `04`). Todo va a `nolc-arte-2`.

## 7. Tabla de briefs (los 100)

El prompt de cada uno está en `arte-nuevo/prompts/_p3v2/{piloto,catalogo}/<id>.md`. El «riesgo de filtro» es la probabilidad de que la herramienta de imágenes lo bloquee, según el piloto: **alto** si la marca tiene versiones felinas oficiales o es muy litigiosa; **medio** en Superhéroes y en los íconos más fieles.

<!-- BRIEFS:INICIO -->
<!-- Generado por _p3v2/herramientas/catalogo.mjs --briefs: no editar a mano. -->

| Id | Nombre | Multiverso | Style lock | Riesgo de filtro | Estado |
|---|---|---|---|---|---|
| `x_homiau` | Homiau Gatson | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | GENERADO v1 (piloto) |
| `e_margata` | Margata | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_bartolomiau` | Bartolomiau | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_lisaxo` | Lisaxo | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_mamila` | Mamila | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_excelencio` | Don Excelencio | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `c_vecinirijillo` | Vecinirijillo | Borracha (familia del sillón) | `BORRACHA_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_murciegato` | Murciégato | Superhéroes | `SUPERHEROES_V2.txt` | medio | GENERADO v5 (W1: emblema de espina de pescado; v4 del piloto para comparar) |
| `x_gatarana` | Gato Araña | Superhéroes | `SUPERHEROES_V2.txt` | medio | GENERADO v2 (piloto; v1 bloqueado) |
| `x_supermichi` | Supermichi | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_hambron` | El Increíble Hambrón | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_gatopool` | Gatopool | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_gatamaravilla` | Gata Maravilla | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `e_ovillo` | Doctor Ovillo | Superhéroes | `SUPERHEROES_V2.txt` | medio | GENERADO v1 (W1) |
| `e_estambre` | El Estambre | Superhéroes | `SUPERHEROES_V2.txt` | medio | GENERADO v2 (W1; rayas oliva y arena) |
| `l_garritas` | Garritas | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `l_hierromichi` | Hierro Michi | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `e_capimichi` | Capitán Michimérica | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `e_bromas` | El Bromas | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `r_michubela` | Michúbela | Superhéroes | `SUPERHEROES_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_supersiames` | Super Siamés | Anime | `ANIME_V2.txt` | medio | GENERADO v1 (W1) |
| `x_bigoton` | Príncipe Bigotón | Anime | `ANIME_V2.txt` | medio | GENERADO v1 (W1) |
| `x_gomitas` | Gomitas D. Michi | Anime | `ANIME_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_kagebunyan` | Kagebunyan | Anime | `ANIME_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_sailormichi` | Sailor Michi | Anime | `ANIME_V2.txt` | medio | DISEÑADO (prompt compilado) |
| `x_gatojo` | Gatojo | Anime | `ANIME_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_unzarpazo` | Un Zarpazo | Anime | `ANIME_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_tanjimiau` | Tanjimiau | Anime | `ANIME_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_pegaso` | Michi de Pegaso | Anime | `ANIME_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_michiatom` | Michi Atom | Anime | `ANIME_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_mazingato` | Mazingato Z | Anime | `ANIME_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_harrygatter` | Harry Gatter, el que maulló | Libros | `LIBROS_V2.txt` | bajo | GENERADO v1 (W1) |
| `x_gatodalf` | Gatodalf el Gris | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_quijote` | Don Gatote de la Mancha | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_sherlock` | Sherlock Ronrones | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_sonrisa` | Sonrisa | Libros | `LIBROS_V2.txt` | bajo | GENERADO v2 (W1; v1 bloqueado) |
| `x_frankengato` | Frankengato | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_botas` | El Gato con Botas | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_capgarra` | Capitán Garra | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `c_michipito` | El Michipito | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_pinomichi` | Pinomichi | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_hamlet` | Hamlet de Gatamarca | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_michilhu` | Michilhu | Libros | `LIBROS_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_sirsimon` | Sir Simón de Gatterville | Libros | `LIBROS_V2.txt` | bajo | GENERADO v1 (W1) |
| `r_garbancito` | Garbancito | Libros | `LIBROS_V2.txt` | bajo | GENERADO v1 (W1) |
| `x_gatomalo` | Gato Malo | POP | `POP_V2.txt` | medio | GENERADO v2 (W1; dije de zanahoria) |
| `x_tailorswift` | Tailor Swift | POP | `POP_V2.txt` | medio | GENERADO v1 (W1) |
| `l_emiau` | EMIAU «Slim Bigotes» | POP | `POP_V2.txt` | bajo | GENERADO v1 (W1) |
| `x_billiebigotish` | Billie Bigotish | POP | `POP_V2.txt` | bajo | GENERADO v1 (piloto) |
| `x_shakimiau` | Shakimiau | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_michimami` | Michimami | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_michota` | La Michota | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_pesopelusa` | Peso Pelusa | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_divogatarez` | El Divo de Gatárez | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_ladygata` | Lady Gata | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_miauknd` | The Miauknd | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_edtangerino` | Ed Tangerino | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_freddiemercurio` | Freddie Mercurio | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_elvispelvis` | El Rey del Ronroneo | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_garjona` | Ricardo Garjona | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_guarachera` | La Guarachera | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_gatente` | Don Gatente | POP | `POP_V2.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_vangato` | Vincent van Gato | Pinceles (el Museo) | `PINCELES.txt` | bajo | GENERADO v1–v3 (piloto) |
| `l_dagatchi` | Leonardo da Gatchi | Pinceles (el Museo) | `PINCELES.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_gatoconda` | La Gatoconda | Pinceles (el Museo) | `PINCELES.txt` | bajo | GENERADO v1 (W1) |
| `l_felida` | Felida | Pinceles (el Museo) | `PINCELES.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_salvadorgati` | Salvador Gatí | Pinceles (el Museo) | `PINCELES.txt` | bajo | DISEÑADO (prompt compilado) |
| `c_gritito` | El Gritito | Pinceles (el Museo) | `PINCELES.txt` | bajo | GENERADO v1 (W1) |
| `r_perla` | La Gata de la Perla | Pinceles (el Museo) | `PINCELES.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_michiwan` | Michi-Wan | Pantalla (el cine) | `PANTALLA.txt` | medio | DISEÑADO (prompt compilado) |
| `l_darthmiauder` | Darth Miauder | Pantalla (el cine) | `PANTALLA.txt` | medio | DISEÑADO (prompt compilado) |
| `e_yodo` | Maestro Yodo | Pantalla (el cine) | `PANTALLA.txt` | medio | DISEÑADO (prompt compilado) |
| `l_gatoleone` | Don Gatoleone | Pantalla (el cine) | `PANTALLA.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_condegatula` | Conde Gatula | Pantalla (el cine) | `PANTALLA.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_indianagarras` | Indiana Garras | Pantalla (el cine) | `PANTALLA.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_samgarra` | Sam Garra | Pantalla (el cine) | `PANTALLA.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_gatzilla` | Gatzilla | Pantalla (el cine) | `PANTALLA.txt` | medio | GENERADO v1 (W1) |
| `c_comecroquetas` | Comecroquetas | Píxel (los videojuegos) | `PIXEL.txt` | bajo | GENERADO v1 (piloto) |
| `x_lince` | Lince | Píxel (los videojuegos) | `PIXEL.txt` | **alto** | DISEÑADO (prompt compilado) |
| `e_zoomic` | Zoomic | Píxel (los videojuegos) | `PIXEL.txt` | medio | DISEÑADO (prompt compilado) |
| `e_michichu` | Michichu | Píxel (los videojuegos) | `PIXEL.txt` | **alto** | DISEÑADO (prompt compilado) |
| `l_gratos` | Gratos | Píxel (los videojuegos) | `PIXEL.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_brujogato` | El Brujo Gato | Píxel (los videojuegos) | `PIXEL.txt` | bajo | DISEÑADO (prompt compilado) |
| `c_ssssmichi` | Ssssmichi | Píxel (los videojuegos) | `PIXEL.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_michicompanero` | Michi Compañero | Píxel (los videojuegos) | `PIXEL.txt` | bajo | DISEÑADO (prompt compilado) |
| `x_bastet` | Bastet | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_esfinge` | La Esfinge | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_medusa` | Medusa de Estambre | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_gatercules` | Gatércules | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_quetzalmiau` | Quetzalmiau | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_sombreron` | El Michi Sombrerón | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `r_llorona` | La Llorona | Mitos (leyendas) | `MITOS.txt` | bajo | DISEÑADO (prompt compilado) |
| `c_maneki` | Maneki, la conserje | Mitos (leyendas) | `MITOS.txt` | bajo | GENERADO v1 (W1) |
| `x_michavo` | El Michito del Barril | Vecindad (la tele latina) | `VECINDAD.txt` | medio | DISEÑADO (prompt compilado) |
| `l_michipulin` | El Michipulín Colorado | Vecindad (la tele latina) | `VECINDAD.txt` | medio | DISEÑADO (prompt compilado) |
| `r_donramiau` | Don Ramiau | Vecindad (la tele latina) | `VECINDAD.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_ruleros` | Doña Ruleros | Vecindad (la tele latina) | `VECINDAD.txt` | bajo | DISEÑADO (prompt compilado) |
| `c_quicachetes` | Quicachetes | Vecindad (la tele latina) | `VECINDAD.txt` | bajo | DISEÑADO (prompt compilado) |
| `e_villana` | La Villana | Vecindad (la tele latina) | `VECINDAD.txt` | bajo | DISEÑADO (prompt compilado) |
| `l_enmascarado` | El Michi Enmascarado | Vecindad (la tele latina) | `VECINDAD.txt` | bajo | DISEÑADO (prompt compilado) |

<!-- BRIEFS:FIN -->

## Anexo A · Texto de los style locks nuevos

Copia de `arte-nuevo/estilo/dimensiones/` (el taller no está versionado). Codex no modifica estos archivos.

<!-- LOCKS:INICIO -->
### `BORRACHA_V2.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: BORRACHA v2 (the sofa family of the tavern box) — DO NOT MODIFY]
This cat belongs to the BORRACHA multiverse: a 1990s prime-time animated family sitcom world (a small-town living room with a purple sofa, a power plant, a tavern, donuts). The drawing style itself must evoke that kind of long-running yellow prime-time TV cartoon at first glance, with an original cat design.
Visual medium: 2D TV-cartoon cel. Uniform dark line (#2A1A2E, never pure black) 10-12 px at 1024 on the silhouette and 7-8 px inside, the same weight everywhere. Completely FLAT fills with NO shading (that TV look has no shadows), except one optional flat shadow shape under the belly.
Anatomy: real cat anatomy with sitcom-cartoon proportions: very large round bulging eyes made of flat white circles that touch each other, tiny round black dot pupils, eyelids as flat shapes; a rounded muzzle that juts forward with an overbite (the upper lip overhangs the lower one); simple paws with four toes; short legs; soft pear or bean body.
Color: when the asset asks for it, the family's signature flat bright yellow coat (#FFD90F) on the whole cat; otherwise the cat's own coat. Palette of the box: sofa purple, sky blue, donut pink, beer amber, shirt white, bottle green.
Camera, pose and framing: identical to the collection rules (body three-quarter toward image-left, head toward the viewer, paws on one shared baseline, whole body inside the frame).
Never: gradients, painterly blending, fur strands, halftone, grain, glitter, sketchy or hairline strokes, any text, logo or show title; never a redrawn human character: it is a cat that evokes, not a copy.
```

### `SUPERHEROES_V2.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: SUPERHEROES v2 (parodies of the comic-book box) — DO NOT MODIFY]
This cat belongs to the SUPERHEROES multiverse: a comic-book city where every hero is a cat. The drawing style itself must evoke a classic American superhero comic at first glance.
Visual medium: 2D comic-book character art, bold inked outlines with variable brush weight (dark colored ink, never pure #000000), 12-16 px on the silhouette at 1024 and 6-8 px inside. Flat four-color fills, hard-edged two-tone shading, large spotted blacks, a heroic rim light as one flat shape.
Anatomy: real cat anatomy with heroic cartoon proportions (head about one quarter of the height, broad chest, sturdy legs). Two large eyes, both open and visible, even through a mask.
Parody rule: the costume EVOKES its hero through the signifiers listed in the asset (colors, mask or cowl shape, cape cut, an ORIGINAL chest emblem). Never an exact existing logo, never a traced costume, never letters or numbers.
Never: painted halftone or Ben-Day dots, screentone, paper or film grain, glitter, airbrush gradients, photographic fur, speech balloons, panel borders.
Camera, pose and framing: identical to the collection rules (body three-quarter toward image-left, head toward the viewer, whole body inside the frame), unless the asset describes a dynamic pose.
```

### `ANIME_V2.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: ANIME v2 (anime and manga parodies) — DO NOT MODIFY]
This cat belongs to the ANIME multiverse: pirate islands, ninja villages, tournament arenas, magical-girl cities and quiet countryside films, where every hero is a cat. The drawing style itself must evoke a TV anime key frame at first glance.
Visual medium: 2D cel-shaded anime character art, clean colored line 6-8 px at 1024 (never pure black), two-tone hard-edged cel shading, one hard specular highlight per eye.
Anatomy: real cat anatomy, large expressive eyes, athletic body, fur clumps drawn as sharp readable spikes.
Parody rule: the hero is recognized by the signifiers listed in the asset (signature hair or fur shape, outfit colors, a signature prop or pose). Never an exact existing symbol, emblem, clan mark or headband plate, never letters or kanji.
Never: painted screentone or halftone, painted speed lines, gradients except one aura glow.
Camera, pose and framing: identical to the collection rules, unless the asset describes a dynamic pose.
```

### `LIBROS_V2.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: LIBROS v2 (characters escaped from books) — DO NOT MODIFY]
This cat belongs to the LIBROS multiverse: a world inside illustrated books where every famous literary character is a cat. The drawing style itself must evoke a classic storybook illustration plate at first glance.
Visual medium: 2D Victorian storybook illustration, sepia pen line 6-10 px at 1024, FLAT watercolor fills in 2-3 values with defined edges.
Palette: muted sepia, ink blue, wine red, parchment, plus the cat's coat.
Parody rule: the character is recognized by the signifiers listed in the asset (the literary attributes: props, costume and posture described in the book). Prefer the public-domain book version; never a costume, face or prop design that belongs to a specific film adaptation, never school crests, logos or letters.
Never: painted watercolor granulation, paper texture, hairline crosshatching thinner than 6 px.
Camera, pose and framing: identical to the collection rules.
```

### `POP_V2.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: POP v2 (pop-star parodies) — DO NOT MODIFY]
This cat belongs to the POP multiverse: a music-video and stadium-stage world where every pop star is a cat. The drawing style itself must evoke a glossy pop music video still or album-era poster at first glance.
Visual medium: 2D pop-art character, bold flat neon and pastel fills, colored line 8-12 px on materials, no line on highlights; one stage key light as a hard flat light shape and one flat shadow; sparkle and sequins shown as 3-4 big flat shapes.
Anatomy: real cat anatomy with stylized pop proportions; the cat is a CAT, never a human or a human face.
Parody rule: the star is recognized by the signifiers listed in the asset (signature hair colors as fur, signature silhouette of the outfit, a signature prop or posture). Never a real person's facial likeness, never logos, album art, tour names, lyrics or letters.
Never: painted glitter or sequin texture, gradients except one stage glow, grain, noise.
Camera, pose and framing: identical to the collection rules, unless the asset describes a dance pose.
```

### `PINCELES.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: PINCELES (the museum box) — DO NOT MODIFY]
This cat belongs to the PINCELES multiverse: a museum where every cat lives inside the style of a famous painter. The cat is painted IN THE MANNER of the painter named in the reference medium of the asset; the drawing style itself must evoke that painter at first glance.
Visual medium: 2D illustration that translates the painter's signature technique into BIG, FLAT, VECTOR-FRIENDLY shapes: brushwork becomes a limited set of bold ribbon-like strokes (about 30-60 strokes for the whole cat), each stroke at least 2% of the canvas wide and at least 8 px thick at 1024, each stroke one flat color with crisp edges.
Line: the painter's own contour language (for example dark ultramarine contour for post-impressionism, two flat sepia values for Renaissance sfumato, thick black grid lines for geometric abstraction), never thinner than 8 px.
Color: the painter's palette in flat fills, at most 3 values per material.
Anatomy: real cat anatomy with mild cartoon proportions; two eyes open and readable.
Never: real canvas weave, impasto relief, cracks, varnish, gradients, paper grain, a frame, a museum label, a signature or any text; never a background scene: at most the painter's motif as a few large flat shapes attached to the cat.
Camera, pose and framing: identical to the collection rules (body three-quarter toward image-left, head toward the viewer, paws on one shared baseline, whole body inside the frame).
```

### `PANTALLA.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: PANTALLA (the movie-theater box) — DO NOT MODIFY]
This cat belongs to the PANTALLA multiverse: a movie theater where every classic film genre is a neighborhood (silent comedy, film noir, monster movies, adventure serials, space opera). The drawing style itself must evoke a hand-painted classic movie poster at first glance.
Visual medium: 2D movie-poster illustration translated into flat graphic shapes: strong silhouette, bold contour 10-14 px at 1024, flat fills, ONE dramatic key light drawn as hard flat light shapes and big flat shadow shapes (2-3 values per material).
Color: paint in FLAT COLOR even for black-and-white genres: the game converts noir, monster and silent-film cats to black and white with its own film filter. Adventure and space-opera cats keep saturated Technicolor fills.
Anatomy: real cat anatomy with cinematic cartoon proportions; two eyes open and visible.
Parody rule: the character is recognized by the signifiers listed in the asset (costume silhouette, prop, posture). Never an actor's likeness, never a studio logo, a title, a poster layout or letters.
Never: film grain, scratches, vignette, gradients, halftone, glitter (the game adds the film look in a shader).
Camera, pose and framing: identical to the collection rules.
```

### `PIXEL.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: PÍXEL (the video-game box) — DO NOT MODIFY]
This cat belongs to the PÍXEL multiverse: the inside of an old game console, where every famous game hero is a cat. The drawing style itself must evoke a 16-bit console sprite at first glance.
Visual medium: chunky pixel-art sprite: the whole cat is built from ONE visible square pixel grid about 64 grid pixels tall (each grid pixel about 13-15 px at 1024), perfectly square hard-edged pixels aligned to that grid, no anti-aliasing, a limited palette of 10-16 flat colors, a one-grid-pixel dark outline, two-value shading made of pixel clusters.
Anatomy: real cat anatomy in sprite proportions (big head, compact body); each eye at least 3x3 grid pixels with a one-pixel highlight; both eyes open.
Parody rule: the hero is recognized by the signifiers listed in the asset (signature cap or hair, outfit colors, signature pose or move, signature item). Never a game logo, never letters, numbers, HUD, score or coin counter.
Never: blur, gradients, dithering noise, sub-pixel detail, sparkles smaller than one grid pixel, a background, a floor tile.
Camera, pose and framing: identical to the collection rules (body three-quarter toward image-left, whole body inside the frame).
```

### `MITOS.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: MITOS (the box of myths and legends) — DO NOT MODIFY]
This cat belongs to the MITOS multiverse: a world where the myths and folk legends of many cultures are cats (ancient Egypt, Greece, the Norse sagas, Mesoamerica, Japan and Central American folk legends). The drawing style itself must evoke the art of the culture named in the reference medium of the asset at first glance (Egyptian tomb painting, Greek black-figure vase, Maya codex, Japanese woodblock print, Central American folk art).
Visual medium: 2D illustration in that culture's visual language translated into bold flat shapes: thick contour 10-14 px at 1024, flat mineral pigments (ochre, terracotta, lapis blue, jade green, gold, bone white, black), decorative bands and patterns as a few big shapes (each at least 2% of the canvas).
Anatomy: real cat anatomy; the body stays three-quarter as in the collection even when the culture's art uses profile; the eyes may take the culture's stylization (kohl line, almond shape) but both eyes are open and visible.
Respect: myths of ancient and living cultures are drawn with affection, never mocked; no sacred symbol of a living religion is used as decoration.
Never: stone, papyrus or wood texture, cracks, aged patina, gradients, real hieroglyphs, glyphs, runes or any writing.
Camera, pose and framing: identical to the collection rules.
```

### `VECINDAD.txt`

```text
[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: VECINDAD (the Latin American afternoon-TV box) — DO NOT MODIFY]
This cat belongs to the VECINDAD multiverse: the box of Latin American afternoon television (a 1970s neighborhood-courtyard sitcom, telenovelas, lucha libre broadcasts). The drawing style itself must evoke a warm 1970s-80s TV studio show turned into a cartoon at first glance.
Visual medium: 2D cartoon with chunky rounded silhouettes, bold warm-brown contour (#3B2418) 10-12 px at 1024, flat saturated fills with a slightly warm studio cast, one flat shadow per material and one flat studio-light shape.
Anatomy: real cat anatomy with sitcom proportions (big head, expressive eyes, soft body); two eyes open and visible.
Parody rule: the character is recognized by the signifiers listed in the asset (signature costume, prop and posture). Never an actor's facial likeness, never a show title, a channel logo or letters.
Never: VHS noise, scanlines, grain, gradients, halftone (the game adds the TV look in a shader).
Camera, pose and framing: identical to the collection rules.
```

<!-- LOCKS:FIN -->
