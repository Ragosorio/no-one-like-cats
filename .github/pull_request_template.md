## Qué cambia

<!-- Una o dos frases. Si cierra un issue: "Cierra #123". Sin spoilers de la historia. -->

## Cómo lo probaste

<!-- Laboratorio (?scene=dev), partida de prueba (?save=...), teléfono, «Reducir movimiento», sin sonido… -->

## Capturas o video

<!-- Si el cambio se ve, arrastra aquí una captura o un video corto. Van en este PR, NUNCA en el repo (el repo no acepta imágenes raster). -->

## Revisión (desde `game/`)

- [ ] `npm run typecheck` pasa.
- [ ] `npm test` pasa.
- [ ] `npx tsx scripts/verify-missions.ts --all` termina sin faltantes.
- [ ] `npm run build` pasa.
- [ ] Cero imágenes raster (PNG/JPG/WebP/GIF) en el diff: solo SVG o arte en código.
- [ ] Si es visual, adjunté una captura o un video arriba (no en el repo).
- [ ] Probé con una partida nueva.
- [ ] Probé con una partida vieja (`?save=post-boss3` u otra de `game/test-saves/`).
- [ ] Las animaciones nuevas respetan «Reducir movimiento» y «Reducir destellos».
- [ ] Ninguna canción original del autor suena fuera de un Momento musical o de la Fonoteca.
- [ ] Textos del juego en español latino con el tono del juego; comentarios del código en inglés.
- [ ] Sin chistes sobre etnia, religión ni el Holocausto.
- [ ] Gratis de verdad: nada de anuncios, compras, energía ni trampas de presión.
- [ ] El arte y la música son míos o tengo permiso para publicarlos bajo la licencia MIT.

## Compatibilidad de partidas ([docs/ACTUALIZACIONES.md](https://github.com/Ragosorio/no-one-like-cats/blob/main/docs/ACTUALIZACIONES.md))

- [ ] Si agregué un campo a la partida, está en `GameState` y en `defaultState()`.
- [ ] Si cambié la forma de datos guardados, hay migración y subí `SAVE_VERSION`.
- [ ] Si cambié reglas que una partida ya usa, hay parche (`registerPatch`).
- [ ] No renombré ni reutilicé ningún id (gatos, misiones, beats, parches, novedades, slugs).
- [ ] Nada de lo anterior quita recursos ni progreso.
- [ ] Hay entrada en `game/src/data/updates.ts` (NOVEDADES) con lo que el jugador va a notar.
- [ ] No aplica: este cambio no toca partidas ni nada que el jugador note.
