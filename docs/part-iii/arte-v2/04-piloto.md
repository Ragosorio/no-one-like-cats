# 04 · Piloto v2: seis gatos de Codex a MAI SVG

> Ronda 4 de la Parte III. Lo escribe el agente ARTE-V2. ⚠️ Spoilers. Nada se commitea ni se publica sin el OK del dueño.
> **Todo el piloto vive fuera del repo**, en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/_p3v2/`. No se tocó `game/public/cats-svg`, ni `catRigs.json`, ni los manifiestos del juego.

## 0. Resumen

- **6 gatos, 6 multiversos:** **Homiau** (la familia amarilla del sillón), **Murciégato** y **Gato Araña** (Superhéroes), **Vincent van Gato** (Pinceles), **Billie Bigotish** (POP) y **Comecroquetas** (Píxel).
- **Se reconocen:** en una prueba a ciegas con la hoja de 128 px, un revisor sin contexto nombró las **6 referencias** (5 con confianza alta y Billie con confianza media). Es solo una señal: falta la prueba con personas (`01` §7).
- **Pesan poco:** el SVG completo pesa en promedio **4,0 MB** (3,2 MB sin Van Gato), contra los **7,2 MB** de la colección actual. El lite pesa **657 KB**. Con el preset `balanced-color-preserved`, el completo baja a **1,4 MB** de promedio.
- **El hallazgo grande:** la herramienta de imágenes **bloqueó** las versiones más fieles de Murciégato, Gato Araña y el plomero (Miaurio). Las dos primeras pasaron al bajar un rasgo «de marca»; el plomero quedó en reserva. Ese bloqueo marca en la práctica el límite entre evocar y copiar (`01` §3.1).
- **Hojas para el dueño:**
  - `_p3v2/revision/piloto-pintura-vs-svg.jpg`: pintura, SVG completo, SVG lite, fondo oscuro, silueta a 64 px y 128 px, con pesos y MAE.
  - `_p3v2/revision/piloto-intentos.jpg`: los intentos (bloqueados y elegidos).
  - `_p3v2/revision/<slug>-detalle.jpg`: pintura y completo a 700 px, lado a lado.

## 1. Cómo se hizo

| Paso | Herramienta | Resultado |
|---|---|---|
| Fichas | `_p3v2/piloto.json` → `manifest.json` (lote `v`) → `compilar.mjs` | 7 prompts en `prompts/_p3v2/piloto/` con rasgos obligatorios (`01`) |
| Generar | `_p3v2/gen.sh <id> <N>`: Codex CLI 0.153.4, herramienta de imágenes integrada, modelo **`gpt-6-astra`** (el de `gen.sh`; funcionó sin cambiarlo) | 6 en paralelo en ~1 min. **13 intentos para 6 gatos**: 4 bloqueados por el filtro y 3 reintentos de mejora |
| Normalizar | `herramientas/normalizar.mjs` (Codex entrega **1254 px**; se lleva a 1024) y `validar.mjs` | Todos sin ERROR. Avisos explicados en §4 |
| 700 px | `_p3v2/herramientas/a700.mjs` (lanczos3; mitchell si colapsa) | — |
| Vectorizar | MAI SVG **por CLI, sin servidor**: `npm run mai -- vectorize <dir> --preset high-color-preserved` | ~55 s para 3 gatos |
| Completo | `scripts/game-export.ts` (perfil *game-compact*, mismo píxel) | `_p3v2/svg/full/<slug>.svg` |
| Lite | `scripts/game-thumbs.ts … 240` | `_p3v2/svg/lite/<slug>.svg` |
| Hoja y medidas | `_p3v2/herramientas/contacto-v2.mjs` | `revision/piloto-pintura-vs-svg.jpg`, `medidas.json` |

No se modificó el código de MAI SVG. Solo se usaron su CLI y sus scripts.

## 2. Resultados por gato

| Gato (slug) | Intentos | ¿Se reconoce? (a ciegas, 128 px) | Completo (disco · gzip · caminos · MAE) | Lite (disco · gzip · caminos · MAE) |
|---|---|---|---|---|
| **Homiau** (`homiau_donut_cat`) | 1 | Homero Simpson, alta | **2,62 MB** · 0,41 · 26 132 · 4,7 | **415 KB** · 67 KB · 4 572 · 10,1 |
| **Murciégato** (`murciegato_cowl_cat`) | 4: v1 bloqueado; v2 sin capucha; v3 capucha casi invisible; **v4 elegido** (capucha gris pizarra, pez con alas en el pecho) | Batman, alta | **3,38 MB** · 0,59 · 31 348 · 4,5 | **570 KB** · 95 KB · 5 993 · 6,3 |
| **Gato Araña** (`gatarana_web_cat`) | 2: v1 bloqueado (traje entero); **v2 elegido: disfraz casero** (gorro tejido con telaraña cosida, parches blancos y suéter azul) | Spider-Man, alta | **4,96 MB** · 0,85 · 43 296 · 6,1 | **760 KB** · 126 KB · 7 688 · 9,7 |
| **Vincent van Gato** (`vangato_sunflower_cat`) | 3 (v2 y v3 para intentar bajar el peso) | Van Gogh, alta | **8,03 MB** · 1,46 · 70 644 · 7,7 (v3: 6,79 MB) | **1 293 KB** · 213 KB · 12 670 · 11,2 |
| **Billie Bigotish** (`billie_whisper_cat`) | 1 | Billie Eilish, media | **3,18 MB** · 0,57 · 28 235 · 5,6 | **531 KB** · 90 KB · 5 287 · 8,0 |
| **Comecroquetas** (`comecroquetas_pellet_cat`) | 1 (reemplazó al plomero) | Pac-Man, alta | **1,82 MB** · 0,26 · 15 664 · 1,5 | **374 KB** · 47 KB · 3 520 · 3,3 |
| *Miaurio (plomero)* | 2, **los dos bloqueados** | — | — | — |

**Criterios de `../investigacion/arte-pipeline.md` §7:**
- Todos los completos tienen **MAE ≤ 11** y todos los lites **MAE < 22**.
- Todos pesan **≤ 10 MB**. Las dimensiones planas cumplen el objetivo de **≤ 5 MB**, salvo Van Gato.
- Cero `<image>` (el script de MAI lo verifica).

**Comparación** con lo que ya existe: los nativos aprobados de la Borracha pesan 3,55 MB (Hipólito), 1,97 MB (Espuma) y 3,30 MB (Dona). La colección pesa en promedio 7,22 MB, con 3,1 MB como mínimo.

## 3. Pesos y hosting

### 3.1 Promedios del piloto (los 6 gatos elegidos)

| Preset del completo | Completo total | Promedio por gato | Gzip por gato (lo que baja el jugador) | Lite promedio |
|---|---|---|---|---|
| `high-color-preserved` (el aprobado) | 23,98 MB | **4,00 MB** (3,19 sin Van Gato) | 0,69 MB | **657 KB** (107 KB con gzip) |
| `balanced-color-preserved` (alternativa) | 8,65 MB | **1,44 MB** | 0,35 MB | igual (el lite siempre usa el preset aprobado a 240 px) |

**El preset `balanced`:** baja el completo de 3 a 4 veces (Homiau 0,83 MB, Murciégato 1,25, Gato Araña 1,84, Billie 1,17, Comecroquetas 0,51 y Van Gato 3,05). El MAE queda entre 3,3 y 8,8, dentro del criterio (≤ 11). A 700 px se pierde detalle fino (los puntitos de la barba de Homiau, el tejido del gorro) y la imagen se ve un poco posterizada. Comparación de caras en `revision/vangato_sunflower_cat_bal-detalle.jpg`.
**Decisión del dueño:** ¿preset aprobado para todos, o `balanced` para los estilos pesados (Pinceles)?

### 3.2 ¿Cuántos caben?

| Sitio | Libre | Con `high` (4,0 MB) | Con `balanced` (1,44 MB) |
|---|---|---|---|
| `nolc-arte` (hoy) | **~68 MB** (tope del script: 950 MB) | **~17 gatos** | ~47 gatos |
| `nolc-arte-2` (planeado para el arte nuevo, `../12-hosting-arte-p3.md`) | ~950 MB | **~237 gatos** | ~660 gatos |
| Sitio del juego (lite, en `dist`) | ~800 MB | ~1 200 lites | — |

**El catálogo completo** (100 gatos de `02` más ~10 nativos que faltan, ~110 en total) ocuparía:
- **~440 MB** con `high`, el **46 %** de `nolc-arte-2`;
- **~160 MB** con `balanced`, el **17 %**;
- **~72 MB** de lites en el sitio del juego.

**Conclusión:** el catálogo v2 **cabe entero en `nolc-arte-2`** con el preset aprobado y deja espacio para la Parte IV. `nolc-arte` ya no debería recibir arte nuevo: sus ~68 MB alcanzan para unos 17 gatos y conviene guardarlos para correcciones.

## 4. Qué funcionó

1. **El bloque de rasgos obligatorios funciona.** Codex respetó colores en hex, cantidades (los **dos** pelitos de Homiau), formas y prohibiciones. Las 6 referencias se reconocen a 128 px.
2. **Los estilos planos pesan poco**: sitcom, cómic, pop y píxel quedan entre 1,8 y 5 MB.
3. **El pixel art sale limpio** y es el más liviano (1,8 MB; MAE 1,5).
4. **El disfraz casero de Gato Araña** resolvió el bloqueo y mejoró el personaje: el chiste («se hizo el traje él solo») ahora se ve.
5. **El pipeline se ejecuta entero sin servidor** y tarda minutos: 6 gatos en menos de 10 minutos de máquina.
6. **El compilador nuevo no rompió nada**: 100 de 103 prompts viejos compilan idénticos (`03` §1).

## 5. Qué hay que arreglar o decidir

| # | Problema | Propuesta | Quién |
|---|---|---|---|
| 1 | **El filtro de imágenes** bloquea las parodias más fieles (4 bloqueos en 13 intentos) | Regla `01` §3.1: bajar el rasgo «de marca» y reforzar el chiste; máximo 2 reintentos. En `03` §7, cada brief tiene su «riesgo de filtro» | ARTE (hecho) |
| 2 | **Miaurio** bloqueado dos veces. Causa probable: la marca tiene un gato oficial de ese personaje | Pasó a **reserva** (`02` §7). Si el dueño lo quiere, se rehace como plomero propio, sin la gorra roja con emblema. **Lince** (Píxel) tiene el mismo riesgo: si se bloquea, el Multidimensional de Píxel pasa a **Comecroquetas** | Dueño |
| 3 | **Murciégato** — *actualizado en W1 (`05` §4): el emblema de la v4 se parecía mucho al logo real; la v5 lleva una espina de pescado.* Además es el menos obvio de los seis, aunque el revisor lo reconoció. Un gato negro con capucha negra se confunde con su propio pelaje | v4 usa una capucha gris pizarra y el pez con alas. Si el dueño lo quiere más obvio: los ojos con reborde blanco de cómic, en la lente de batalla y en la **Gato-señal** de la historia (FX en código) | Dueño / CINE |
| 4 | **Van Gato pesa 8 MB.** Pedir «menos trazos y más grandes» no lo bajó (v3: 6,8 MB) | Aceptarlo (es un gato), usar `balanced` (3,05 MB) o hacer que el remolino lo ponga el shader | Dueño |
| 5 | MAI colapsó Van Gato v3 con lanczos3 (MAE 106) | Rehecho con mitchell (MAE 6,8). Ya está en `03` §4 | ARTE (hecho) |
| 6 | La barba de Homiau trae **puntitos** (textura) y el tejido del gorro de Gato Araña suma peso | Corrección preventiva: «barba como mancha plana sin puntos», «gorro liso, sin tejido» | ARTE, en la próxima ronda |
| 7 | **Rig** sin probar (esta ronda no toca el juego) | Revisar al integrar: el parpadeo dentro de los parches blancos de Gato Araña; las orejas de la capucha de Murciégato; el pelo de Billie junto a las orejas; el ala del sombrero de Van Gato; la cuadrícula del píxel al deformarse; la boca abierta de Comecroquetas | QA al integrar |
| 8 | Avisos de `validar.mjs`: Comecroquetas, «alto 66 %» (es ancho por las croquetas); Murciégato, «bordes muy oscuros» (es un gato negro, no hay halo) | Explicados; no bloquean | — |
| 9 | **Prueba de reconocimiento con personas** | Hoja de 128 px a 3 personas (`01` §7). La prueba a ciegas con un agente es solo una señal | Dueño |

## 6. Siguiente paso (cuando el dueño revise)

1. El dueño escribe en `arte-nuevo/PROGRESO.md › Tu revisión`, como siempre (por ejemplo, `x_homiau: ok`).
2. Los aprobados se vuelven **anclas** de su multiverso (`03` §5).
3. Se produce el lote **W1** (`03` §6): los 15 gatos que pide `historia-v2/`.
4. **La integración** (rig, `catRigs.json`, copia del rig en MAI, datos y manifiestos del juego) llega después de la aprobación, en otra ronda. El arte va a `nolc-arte-2`.

## 7. Archivos

| Qué | Dónde (dentro de `arte-nuevo/`) |
|---|---|
| Fichas del piloto | `_p3v2/piloto.json` (también en `manifest.json`, lote `v`) |
| Prompts exactos enviados | `_p3v2/prompts/<id>_vN.txt`; logs de Codex en `_p3v2/logs/` |
| PNG crudos (todos los intentos) | `_p3v2/piloto/_crudos/` |
| PNG normalizados 1024 | `_p3v2/piloto/<id>.png` (y las variantes `x_vangato_v2`, `_v3` y `_bal`) |
| 700 px | `_p3v2/work/700/` |
| SVG completo y lite | `_p3v2/svg/full/`, `_p3v2/svg/lite/` (con sus JSON por corrida `game-export.rN.json` y `game-thumbs.rN.json`) |
| Completo con `balanced` | `_p3v2/work/full-bal/` |
| Métricas de MAI | `_p3v2/work/vec/<corrida>/<slug>/*.json` |
| Hojas y medidas | `_p3v2/revision/` |
