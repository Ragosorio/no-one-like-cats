# COMPOSITOR-FUTURO · estado

Encargo (2026-10-10): investigar herramientas gratuitas de música usables desde scripts, instalar las mejores (fuera del repo, tope ~3 GB) y componer ≥ 6 piezas originales nuevas guardadas para partes futuras del juego. **No toca `game/`** ni nada que el juego cargue. Sin commit. Sin spoilers.

## Qué estoy haciendo
- TERMINADO.

## Hecho
- Fase 1: `docs/part-ii/32-herramientas-musica.md` (tabla comparativa de 16 herramientas, licencias, tamaños, recomendación, trampas y las fichas de las piezas en §6).
- Fase 2, instalado en `audio-derivados/tools/` (1,6 GB en total con lo que ya había):
  - `sfizz/` (sfizz_render 1.2.3, BSD-2);
  - `sfz/SalamanderGrandPiano/` (715 MB, CC-BY 3.0: pide crédito si entra al juego);
  - `sfz/VSCO-2-CE/` (subconjunto de 26 instrumentos, 777 MB, CC0; `scripts/futuro/get_vsco.py` baja más);
  - `plugins/Surge XT.vst3` + `Surge XT Effects.vst3` (89 MB, GPL-3).
  - pedalboard (GPL-3) en un venv que se borró al final (se recrea con `requisitos.txt`).
  - Dexed se probó y se quitó: `program` no carga patches desde pedalboard.
- Fase 3, en `audio-derivados/futuro/` (126 MB: 13 MB de `.m4a`, maestros FLAC + PNG + informes en `maestros/`, mapas en `beatmaps/`):
  - `fut.menu` «Carta de navegación»;
  - `fut.carta` «Carta sin enviar»;
  - `fut.faro` «Faro en la niebla» + capas `luz`/`mar`/`voz`;
  - `fut.mercado` «Mercado en las nubes»;
  - `fut.marea` «Marea baja» + capas `bajo`/`ritmo`;
  - `fut.fosa` «La fosa»;
  - `fut.jefe` «Ojo del huracán», con mapa de pulsos;
  - 6 remates `fut.st.*`: hallazgo, amigo, puerta, faro, victoria, derrota.
  - Todas comparten el motivo nuevo 1–5–4–3.
- Escucha crítica con números: `scripts/futuro/analisis.py` → `maestros/informes/_comparacion.json` + `maestros/img/_comparacion.png`. Mide LUFS, LRA, pico, centroide, energía > 2 kHz, ataques por segundo y la distancia espectral a las favoritas. También se revisaron espectrogramas y costuras de loop.
- Página: `audio-derivados/futuro/escuchar.html`, con mezclador Web Audio para las piezas por capas (probado en el navegador: decodifica y suena sin errores). Servidor: `python3 -m http.server 5413 --bind 127.0.0.1` en esa carpeta, quedó corriendo.

## Falta
- Nada.

## Cómo retomar
- Python: `cd audio-derivados/tools && python3 -m venv venv-futuro && venv-futuro/bin/pip install -r ../scripts/futuro/requisitos.txt`.
- Re-renderizar: `cd audio-derivados/scripts/futuro && ../../tools/venv-futuro/bin/python s_<pieza>.py` (o `s_remates.py [id…]`), luego `python3 gen_escuchar.py`.
- Salida: `futuro/<id>.m4a`. Maestros, PNG e informes en `futuro/maestros/`. La caché de renders va a `futuro/.cache/`, con tope de 500 MB; bórrala al terminar.
- `flib.py` aborta si alguna ruta apunta a `game/`.
- Trampas:
  - `Form.assemble` corta la intro 25 ms antes del loop (si no, su cola vuelve en cada vuelta).
  - `fix_overlaps` evita que el note-off de una nota repetida mate a la siguiente.
  - `vst()` restaura el estado inicial del plugin antes de cada patch.
  - En Surge, los pads se escriben sin solaparse.
  - Los LFO de chorus y cinta deben dar ciclos enteros por loop.
- Si el servidor se cayó: `cd "~/Desktop/No one - raster (fuera del repo)/audio-derivados/futuro" && python3 -m http.server 5413 --bind 127.0.0.1`.

## Última actualización
2026-10-10 20:55
