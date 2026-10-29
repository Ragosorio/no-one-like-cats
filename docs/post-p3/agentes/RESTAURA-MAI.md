# RESTAURA-MAI — estado

**Encargo:** traer de vuelta MAI SVG (`~/Desktop/MAI SVG`, re-clonado de GitHub 4476799) y re-aplicar lo que quedó sin commit, reconstruido desde los transcripts. Sin commit ni push.

## Haciendo
- Nada. Terminado el 28-oct; queda a la espera de que el dueño revise y decida el commit.

## Hecho
- **Log para el dueño:** `~/Desktop/MAI SVG/RESTAURACION-2026-10-28.md`.
- **Fuentes:**
  - Claude 5a17c85c (7–8 oct).
  - Codex 01a11974-546f (7-oct 21:00–21:23, comprimida en `.zst`).
  - Claude 59bda13a (8-oct; contiene a a9b80b9b).
  - BoostAPI 13c5a59a (creó `experiments/boost-mascota`).
  - Sesiones del juego: solo escribieron `exports/game-rigs` y salidas en scratch.
  - 56b2895d, d0f978e2 y e838a71b: no escribieron nada.
- **Replay cronológico:** 38 Write, 56 heredocs `cat`, 189 scripts python con guardia, 39 `sed -i` y los generadores `npm run skills` y `golden.ts --update` en su punto original.
- **Verificado contra el estado original:**
  - Punto de control (7-oct 22:29): mismo `git status`.
  - Final: `git diff --stat` con los mismos totales que el snapshot del 8-oct 17:03 (50 archivos, +1187/−193 contando 3 evidencias) y 29/29 conteos de líneas iguales.
- **Pruebas:** `npm ci`, `typecheck` y `build` OK; `npm test` **167/167**, con `MAI_PYTHON=~/local-image-lab/.venv/bin/python` para OpenCV.
- **Pipeline:** la prueba de punta a punta de `vect.sh` (cadenero_bouncer_cat), en scratch, da full y lite **idénticos byte a byte** a los del juego. Con `vect-bal.sh`, encuadernadora sale idéntica.
- **Editor:** carga en 4318 con «Sesión conectada» si se abre en 127.0.0.1; el WebSocket rechaza `localhost`, igual que en la versión de GitHub. Ya se detuvo.
- **Rigs:** 128 regenerados desde `catRigs.json` (solo lectura); 161/161 coinciden con el juego.

## Falta (solo el dueño)
- Revisar la Papelera (`~/.Trash`, que no pude leer) por si está la carpeta borrada.
- Decidir el commit, excluyendo `experiments/boost-*`: es arte de Boost y el repo es público.
- No recuperable desde los transcripts:
  - Lote A en `assets/vector` (22 gatos generados, regenerables).
  - Corridas del motion-bench.
  - Entregas de Boost (MP4/SVG del 8-oct).
  - Nombres de props de los rigs de la Parte II.

## Para retomar
- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad/restore/` (`tools/replay.py`, `timeline.json`, `replay_log_live.json`, `rigs/regen.py`, `e2e.sh`).
- Para rehacer desde cero:
  1. `cd ~/Desktop/"MAI SVG" && git checkout -- . && git clean -fd`.
  2. En la carpeta de scratch: `python3 tools/replay.py live`.
  3. `python3 rigs/regen.py --write`.
  4. `chmod +x experiments/boost-motion/tools/*.sh`.
  5. `npm run skills`.
