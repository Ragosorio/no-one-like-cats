# Parte III — Fuera de la Caja · índice

> ⚠️ **SPOILERS.** Esta carpeta es el diseño interno de la Parte III: cuenta la historia completa, incluido el final. Si quieres jugarla sin saber nada, no sigas leyendo.

> «Siempre quisiste saber qué había afuera de la caja. Los gatos ya lo sabían.»

**Etapa:** el arranque (H66–H69) está implementado y pulido; el resto, diseñado. **Estado y decisiones pendientes:** `10-estado.md`.

## Orden de lectura recomendado para el dueño

1. **`10-estado.md`**: qué hay, qué falta y **las 10 decisiones que necesito**.
2. **`02-biblia-narrativa.md`**: la historia y su cadena causal.
3. **`04-guion-prologo-bar.md`**: el bar, el remate, Luzterna y la Carta (lo primero que se construiría).
4. **`08-final-luzterna-sadie.md`**: el final y el después.
5. El resto, por tema.

## Documentos

| # | Documento | Para qué |
|---|---|---|
| 01 | [auditoria-continuidad](01-auditoria-continuidad.md) | Canon que se conserva, misterios abiertos, conexiones mal explicadas, promesas reducidas, problemas de ritmo y cómo responde la Parte III |
| 02 | [biblia-narrativa](02-biblia-narrativa.md) | Premisa, tema, cadena causal (18 eslabones), fuerzas, Luzterna, Canelo, reglas del mundo y misterios |
| 03 | [actos-y-capitulos](03-actos-y-capitulos.md) | 32 capítulos y 30 misiones (H66–H95), tarjetas de 5 campos, Bitácora y revelaciones repartidas |
| 04 | [guion-prologo-bar](04-guion-prologo-bar.md) | Guion completo de H66–H68 con el Momento «Drunck» compás por compás |
| 05 | [mapa-y-dimensiones](05-mapa-y-dimensiones.md) | La Carta de las Cajas, precios, reglas de combate, las 5 dimensiones y la primera ruta |
| 06 | [gatos-rareza-arte](06-gatos-rareza-arte.md) | Rareza Multidimensional, catálogo con estados, arte por dimensión, fichas, animaciones y briefs |
| 07 | [canciones-y-momentos](07-canciones-y-momentos.md) | Las 5 canciones verificadas y su Momento, estilo y uso en el juego |
| 08 | [final-luzterna-sadie](08-final-luzterna-sadie.md) | La batalla final, SADIE, el después y las funciones de Luzterna |
| 09 | [plan-produccion](09-plan-produccion.md) | Etapas, dependencias, alcance, criterios de aceptación y estimación |
| 10 | [estado](10-estado.md) | Estado, decisiones, riesgos y cómo retomar |
| 11 | [contrato-porcion](11-contrato-porcion.md) | Contrato de implementación de la porción vertical (ids, dueños de archivos) |
| 12 | [hosting-arte-p3](12-hosting-arte-p3.md) | Capacidad de hosting de arte, shards fijos y `nolc-arte-2` |
| 13 | [pulido-arranque](13-pulido-arranque.md) | **Ronda 3:** pulido de entrada → bar → Drunck → revelación → Luzterna con la retroalimentación del dueño |
| 14 | [plan-cinematografico](14-plan-cinematografico.md) | **Ronda 4:** el resto de la historia en formato de películas, más gatos con referencias legibles, 9 canciones, el giro de Luzterna; equipos y reglas |

**Carpetas de la ronda 4:** `historia-v2/` (NARRATIVA) · `temperatura/` (TEMPERATURA) · `musica-v2/` (MÚSICA) · `cine-v2/` (CINE) · `arte-v2/` (ARTE) · `mecanicas-v2/` (MECÁNICAS).

**Investigación:** `investigacion/` (sistemas, arte, Luzterna, dimensiones y Soundtrap).

**Estado de cada agente:** `agentes/`.

## Reglas de esta parte

- **Nunca raster en el repo.** Los PNG de Codex viven fuera.
- **Las originales del dueño** solo suenan en los Momentos y en la Fonoteca.
- **Ids nuevos:**
  - misiones H66–H95, con H96–H99 de reserva;
  - dimensiones `p3d_*`;
  - multidimensionales `x_*`;
  - módulos `gateras*`.
- **Nunca restar ni romper partidas.**
- **Publicar solo con el OK del dueño.**
