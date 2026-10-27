# Agente ARTE-V2 (Parte III, ronda 4: catálogo v2, reglas de referencia y piloto)

- **Qué estoy haciendo**: nada. **W1 está terminado** (21 gatos) y los **8 nativos** también. Esperan la revisión del dueño.
- **Hecho**:
  - **Documentos** en `docs/part-iii/arte-v2/`:
    - `01-reglas-de-referencia.md`: rasgos icónicos obligatorios (3–5 por gato), evocar sin copiar, el techo del filtro de imágenes y la legibilidad del estilo por multiverso.
    - `02-catalogo-v2.md`: **100 gatos** (31 de `06` y 69 nuevos) en 10 multiversos. Alineado con `historia-v2/`: los 5 multiversos nuevos son «cajas de paso»; se sumaron EMIAU, Sir Simón de Gatterville, Garbancito, El Estambre y Gatzilla; La Mona Michi pasó a llamarse La Gatoconda.
    - `03-briefs.md`: campos v2, valores por multiverso, comandos, orden de lotes, tabla de los 100 briefs y texto de los 10 locks.
    - `04-piloto.md`: resultados, pesos, hosting y problemas.
  - **Taller** (`arte-nuevo/`, fuera del repo). Respaldo previo en `_respaldos/2026-10-26-antes-p3v2/`.
    - `compilar.mjs` tiene campos opcionales nuevos. **100 de los 103 prompts viejos compilan idénticos.** Los otros 3 (Murciégato, Gato Araña y Super Siamés del lote Q) pasaron a v2 a propósito.
    - 10 locks nuevos en `estilo/dimensiones/`.
    - 98 fichas nuevas en `manifest.json` (201 en total) y 101 prompts nuevos.
    - `PROGRESO.md` tiene los lotes V y W.
  - **Piloto** (`_p3v2/`): Homiau, Murciégato (v4), Gato Araña (v2), Vincent van Gato, Billie Bigotish y Comecroquetas.
    - Miaurio quedó bloqueado por el filtro de imágenes y pasó a reserva.
    - Completo promedio **4,0 MB**, lite **657 KB**; con el preset `balanced`, **1,44 MB**.
    - Prueba a ciegas (un agente, 128 px): reconoció las **6 referencias**.
  - **Lote W1** (`docs/part-iii/arte-v2/05-lote-w1.md`, hoja `_p3v2/revision/w1-pintura-vs-svg.jpg`):
    - Hechos: Murciégato v5 (emblema de espina de pescado; la v4 queda para comparar), Doctor Ovillo, El Estambre, Super Siamés, Harry Gatter, Gato Malo, Tailor Swift, EMIAU y Maneki, más Homiau y Gato Araña del piloto.
    - Completo promedio: 4,48 MB con `high` y 2,38 MB con el elegido (`balanced` en los 7 que pasaban de 4 MB). Lite: 713 KB.
    - Sonrisa v1 fue bloqueada (paleta de película); la v2 tiene paleta propia.
    - Anclas provisionales: Gato Araña para Superhéroes, Billie para POP, Super Siamés para Anime y Harry para Libros.
- **Falta**:
  0. ~~Cuando termine la cola~~ (hecho el 2026-10-27 a las 00:15): `./_p3v2/w1-post.sh w1c slugs-w1.json w1-pintura-vs-svg` y `./_p3v2/w1-post.sh n1 slugs-nativos.json nativos-pintura-vs-svg`; revisar bloqueos y actualizar `05` §7–§8 y `PROGRESO.md`. (Antes: `./_p3v2/w1-pendientes.sh` (Bigotón, Sonrisa v2, Sir Simón, Garbancito, Gatzilla, La Gatoconda, El Gritito y las 3 variantes de Gato Araña). Después, normalizar → `vect.sh w1c …` → `vect-bal.sh` → hoja (`05` §5).)
- **Falta** (lo decide el dueño):
  1. Revisar el piloto (`_p3v2/revision/piloto-pintura-vs-svg.jpg` y `piloto-intentos.jpg`) y escribir en `PROGRESO.md`.
  2. Decidir: el preset (`high` o `balanced` para Pinceles); el reparto Multidimensional (13); Miaurio (reserva o rediseño); las variantes de Canelo (horneado o pintura).
  3. Con el OK: anclas por multiverso (`03` §5), lote W1 (los 15 de `historia-v2/`) y después la integración (rig, `catRigs.json`, datos) en otra ronda, con el arte en `nolc-arte-2`.
- **Cómo retomar**:
  - Fuente del catálogo: `_p3v2/catalogo-src/*.json`. Tablas: `node _p3v2/herramientas/catalogo.mjs --tablas <02>` y `--briefs <03>`. Manifest: `--manifest`, luego `node herramientas/compilar.mjs w`.
  - W1: `./_p3v2/herramientas/estado.sh <id>:<N> …`; vectorizar con `./_p3v2/herramientas/vect.sh <corrida> <id>=<png>=<slug> …` y `vect-bal.sh <corrida> <slug…>`; hoja con `node _p3v2/herramientas/contacto-v2.mjs slugs-w1-hecho.json w1-pintura-vs-svg`.
  - Piloto: `_p3v2/piloto.json`, después `node _p3v2/herramientas/upsert.mjs _p3v2/piloto.json`, `compilar v` y `./_p3v2/gen.sh <id> <N>`.
  - MAI por CLI: los comandos están en `03` §3. Hoja de contacto: `node _p3v2/herramientas/contacto-v2.mjs`.
  - Trampas:
    - el filtro de imágenes (`01` §3.1);
    - el colapso de MAI con lanczos3: repetir con mitchell si el MAE pasa de 22;
    - `game-export` y `game-thumbs` sobreescriben su JSON de salida;
    - Codex entrega 1254 px.
  - No tocar `game/`. Sin commits. Nada raster en el repo.
  - Nativos diseñados (lote `n`, `_p3v2/nativos-src.json`): El Lobo, La Encuadernadora, El Mánager, J. J. Gatemson, Bocina y Scratch. El Cadenero y Borrón (lote Q) ahora llevan de anclas a Hipólito y Espuma.
  - **Segunda tanda** (cola de las 23:46, 20 de 20 sin bloqueos): el resto de W1, Gato Malo v2 (dije de zanahoria), El Estambre v2 (rayas oliva y arena) y los nativos El Cadenero, Borrón, El Lobo, La Encuadernadora, El Mánager, J. J. Gatemson, Bocina y Scratch.
    - Hojas: `_p3v2/revision/w1-pintura-vs-svg.jpg` y `nativos-pintura-vs-svg.jpg`.
    - Promedio de los 29: completo 4,34 MB con `high` y 2,66 MB con el elegido (`balanced` si pasa de 4 MB y su MAE queda ≤ 11). Lite: 696 KB. Total: 77 MB.
- **Última actualización**: 2026-10-27 00:25.
