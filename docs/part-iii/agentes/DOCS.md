# Agente DOCS (documentación pública)

- **Qué estoy haciendo**: nada; la documentación está entregada. Falta la revisión del dueño, y no hice commit.
- **Encargo**: el dueño pidió «actualiza toda la documentación para que la gente pueda encontrar repos, ver estilos de arte y saber cómo colaborar».

## Hecho (2026-10-14)

**Archivos nuevos:**
- `docs/REPOSITORIOS.md`
- `docs/arte/ESTILOS.md`: galería con SVG lite del repo, unos 10 MB.
- `docs/INDICE.md`
- Guías nuevas en `docs/guias/`: `rutas-de-desarrollo.md`, `agregar-momento.md`, `cines-y-estados.md` y `dimensiones-y-gateras.md` (esta última sin trama).
- Plantillas de issues en `.github/ISSUE_TEMPLATE/`: `idea.yml`, `bug.yml`, `arte.yml`, `nuevo-gato.yml` y `config.yml`.

**Archivos reescritos:**
- `README.md`. Conserva verbatim «Por qué existe este juego» y quita los nombres de familiares, igual que los créditos del juego (commit db793b4).
- `CONTRIBUTING.md`
- `.github/pull_request_template.md`

**Archivos actualizados:**
- Las guías `arquitectura`, `agregar-gato`, `agregar-elemento`, `agregar-historia`, `animaciones` y `agregar-barco`.
- `docs/ACTUALIZACIONES.md`: módulos que solo agregan, secciones `ext` y El Baúl.
- `docs/MOTOR-Y-PLATAFORMAS.md`: three.js y vitest.

**Archivos borrados:** `.github/ISSUE_TEMPLATE/bug.md`, `idea.md` y `nuevo-gato.md`. Los reemplazan los formularios `.yml`; se recuperan con git.

**Datos verificados contra el código y contra GitHub (solo lectura):**
- Publicado: 120 gatos, 15 elementos, 162 misiones, 6 Momentos y 6 originales.
- Árbol de trabajo: 166 misiones, 7 Momentos y 7 originales.
- `nolc-arte`: 122 SVG, 881,3 MB.
- `nolc-arte-2`: creado, sin publicar y sin cron.
- Discussions apagado. Las etiquetas `idea`, `arte` y `nuevo-gato` no existen (GitHub las ignora hasta que se creen).

**Revisión de enlaces:** script en el scratchpad (`linkcheck.py`). 368 enlaces y anclas revisados, sin errores.

## Falta (decisiones del dueño)

1. Decidir si `docs/part-iii/` va al repo público, porque tiene spoilers. Si no va, el INDICE enlaza una carpeta que no existiría.
2. Hacer commit de los documentos junto con el código de la Parte III. `REPOSITORIOS.md` enlaza `game/src/art/artShardPins.ts`, y varias guías citan archivos de la Parte III que todavía no tienen commit.
3. Decidir si se activa Discussions. Si se activa, agregar el enlace en `config.yml`.
4. Crear, si quiere, las etiquetas `idea`, `arte` y `nuevo-gato`.

## Cómo retomar

- Conteos: `cd game && node scripts/verify-missions.ts --all`. Para los gatos y elementos, `npx tsx` sobre `src/data/content.ts`.
- Enlaces: `python3 <scratch>/linkcheck.py README.md CONTRIBUTING.md docs/...`.
- Reglas:
  - No poner trama de la Parte III en los documentos públicos.
  - No tocar `game/`.
  - Sin commits.

**Última actualización:** 2026-10-14 21:40.
