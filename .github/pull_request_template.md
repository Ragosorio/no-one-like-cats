## Qué cambia

<!-- Una o dos frases. Si cierra un issue: "Cierra #123". -->

## Cómo lo probaste

<!-- Laboratorio (?scene=dev), partida de prueba (?save=...), teléfono, etc. Capturas o video si es visual. -->

## Revisión

- [ ] `npm run build` pasa (incluye revisión de tipos).
- [ ] Probé con una partida nueva.
- [ ] Probé con una partida vieja (`?save=post-boss3` u otra de `game/test-saves/`).
- [ ] Cero imágenes raster (PNG/JPG/WebP/GIF): solo SVG o arte en código.
- [ ] Textos del juego en español latino con el tono del juego; comentarios del código en inglés.
- [ ] Sin chistes sobre etnia, religión ni el Holocausto.
- [ ] Gratis de verdad: nada de anuncios, compras, energía ni trampas de presión.
- [ ] Si agregué animaciones, respetan `settings.reduceMotion`.

## Compatibilidad de partidas (ver docs/ACTUALIZACIONES.md)

- [ ] Si agregué un campo a la partida, está en `GameState` y en `defaultState()`.
- [ ] Si cambié la forma de datos guardados, hay migración y subí `SAVE_VERSION`.
- [ ] Si cambié reglas que una partida ya usa, hay parche (`registerPatch`).
- [ ] Nada de lo anterior quita recursos ni progreso.
- [ ] Hay entrada en `game/src/data/updates.ts` (NOVEDADES) con lo que el jugador va a notar.
- [ ] No aplica: este cambio no toca partidas ni nada que el jugador note.
