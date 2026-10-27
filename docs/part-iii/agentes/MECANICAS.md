# MECÁNICAS (ronda 4, oleada 1)

- **Qué estoy haciendo**: TERMINADO (entregado al coordinador).
- **Hecho**:
  - `docs/part-iii/mecanicas-v2/01-auditoria.md`: qué existe y funciona, qué divierte y qué no (medido), riesgos (H99, guardado, reinicio de la Parte II, economía, rendimiento), salud de las Partes I–II, hallazgos con referencias.
  - `docs/part-iii/mecanicas-v2/02-loop.md`: loop en tres escalas, puertas de la Carta, regla y película de enseñanza por dimensión, gatos sin pagar, cadencia de recompensas, **curva de dificultad medida** (§6.3: hoy, palancas, clase de barco, propuesta), MULTIDIMENSIONAL (datos, poder, prueba de «uno por tripulación» corregida), dónde entran las películas.
  - `docs/part-iii/mecanicas-v2/03-plan-implementacion.md`: etapas 0–7 con archivos, esquemas, pruebas, migración y riesgos; lista de lo que la oleada 2 puede empezar ya; contrato propuesto con CINE.
  - `game/tests/p3Balance.sim.test.ts`: arnés de medición en el repo. **Se salta en `npm test`**; `NOLC_SIM=1` lo corre (~30 s); `NOLC_SIM_TARGETS=1` verifica las metas de `02` §6.2 (hoy falla a propósito). Único archivo tocado en `game/`.
  - Hallazgos medidos clave: Borracha 94–100 % con cualquier tripulación en el Bastión; el Gorrión 0 % en B-3/B-5 (piso fijo de 3 000 + cascos calibrados al Bastión); los gatos de Sonido deciden más que los números; la receta «Poder ×1.55–1.6 + espejo + poder de la caja en élites» deja a h65 en 79 % (élite) y 78 % (jefe).
- **Falta** (para la oleada 2, no para mí): todo lo de `03` §5.
- **Cómo retomar**: scratch `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad/p3sim/` (script `p3-balance.ts`, datos `*.jsonl`, `tab_ships.py`). Comando: `cd game && npx vite-node <scratch>/p3sim/p3-balance.ts -- --crews h65 --stages B1,B5 --seeds 32 --json out.jsonl`. Opciones en `01` §7. Ningún proceso queda corriendo.
- **Reglas**: diseño + auditoría; sin cambios de código de juego, datos ni guardado; sin commits.
- **Última actualización**: 2026-10-26 (cierre).
