# SISTEMAS — investigación de sistemas para la Parte III

- **Qué estoy haciendo**: terminado. Entregable listo.
- **Hecho**:
  - `docs/part-iii/investigacion/sistemas.md`: mapa de la Parte I y hojas de la Parte II (§1), economía con ingresos medidos y bandas de precio (§2), rarezas y colección (§3), perillas de combate (§4), misiones, escenas y Momentos (§5), capturas (anexo A) y cómo repetir las mediciones (anexo B).
  - Mediciones con el código real (vitest de solo lectura en el scratchpad), sobre las fixtures, la partida exportada del dueño (fuera del repo) y perfiles sintéticos.
  - 27 capturas PNG fuera del repo: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/cd9005fa-abeb-4c2a-8f35-47051cccbe24/scratchpad/capturas/`.
  - Vite y Chrome apagados; perfil de Chrome borrado. Nada tocado en `game/` ni en `docs/part-ii/`.
- **Falta** (no es de esta etapa):
  - Crear la fixture `h65-normal` (~17 M/s) cuando se implemente.
  - Decidir entre la opción A y la B para MULTIDIMENSIONAL (§3.6).
- **Cómo retomar**:
  - Sondas en `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/cd9005fa-abeb-4c2a-8f35-47051cccbe24/scratchpad/probe/` (`probe*.test.ts`, salidas en `out*.json`).
  - Se corren con `game/node_modules/.bin/vitest run --config <scratch>/probe/vitest.config.mjs`.
  - Los scripts de capturas están en `<scratch>/shots/`.
- **Última actualización**: 2026-10-13 ~09:30
