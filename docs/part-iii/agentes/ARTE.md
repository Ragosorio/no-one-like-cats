# Agente ARTE (Parte III, etapa de diseño)

- **Qué estoy haciendo**: nada; la investigación del pipeline de arte está entregada.
- **Hecho**:
  - Entregable: `docs/part-iii/investigacion/arte-pipeline.md`. Cubre el pipeline paso a paso, los costos medidos, los límites reales del rig y de MAI, la matriz de las 5 dimensiones, la plantilla de brief con un ejemplo de cómic genérico, los estados con criterios de aceptación y el presupuesto del primer lote.
  - Medido (2026-10-13): 122 gatos; completo prom. 7,22 MB (3,1–10,0); lite prom. 1,08 MB; `nolc-arte` en vivo 881,3 MB (tope del script: 950 MB → ≈ 9 gatos libres); dist del deploy del 2026-10-11: 199 MB; Codex: 1,24 intentos por gato (46–75 % de reintentos sin `coat_en` → 14 % con `coat_en` y correcciones preventivas); integración del lote F: ~28 min por gato.
  - Decisiones propuestas (no tomadas): abrir `nolc-arte-2` antes del primer lote; un style lock y anclas por dimensión; bloque `VECTOR_READY`; la textura de pantalla va en shader u horneado y nunca en la pintura; primer lote de 7 gatos.
- **Falta** (en orden, si el director lo pide):
  1. Que el director decida §9 del entregable (hosting, coherencia contra variedad, límites de la parodia).
  2. Escribir los 5 style locks reales (`estilo/dimensiones/*.txt`) y `VECTOR_READY.txt` en el taller. Lo decide el director; Codex no toca `estilo/`.
  3. Cuando se permita generar: un gato de prueba plano por dimensión para medir el peso real del SVG (estimado: 3–5 MB).
- **Cómo retomar**:
  - Tamaños: `python3` sobre `game/public/cats-svg` (ver §3.2 del entregable).
  - Hosting: `curl -s https://ragosorio.github.io/nolc-arte/art-manifest.json`.
  - Dist: `gh run view <id> -R Ragosorio/no-one-like-cats --log | grep "dist$"`.
  - Reintentos: contar `arte-nuevo/lote-*/_crudos/*_v2.png`.
  - No tocar `game/` ni `docs/part-ii/`. Sin commits ni imágenes en esta etapa.
- **Última actualización**: 2026-10-13 (cerrado).
