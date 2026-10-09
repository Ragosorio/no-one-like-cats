# Parte II — La Era de las Rupturas · índice

> «Creíste que habías conquistado el mar. Nunca te preguntaste qué había encima de él.»

**Si eres un agente nuevo, empieza aquí.** Primero lee **10** (estado y siguiente trabajo), después **05** (la Biblia) y luego **07** (el motor).

| # | Documento | Para qué |
|---|---|---|
| 00 | este índice | Orientarse |
| 01 | [auditoria-juego](01-auditoria-juego.md) | Qué existe en el juego: sistemas, economía, partidas y riesgos (hechos con archivo:línea) |
| 02 | [investigacion-tecnologica](02-investigacion-tecnologica.md) | three.js / Babylon / PlayCanvas / Phaser, Pixi+Three, gatos 2D en 3D, licencias (Spine, Rive) y hardware de referencia. Con fuentes fechadas. |
| 03 | [historia-actual](03-historia-actual.md) | La historia implementada contra la sinopsis, superficies narrativas, hilos sueltos, tono y riesgos de PI |
| 04 | [catalogo-conceptos](04-catalogo-conceptos.md) · [hoja visual](catalogo-conceptos.html) | Los 21 conceptos de `fase 2`, uno por uno, con su mapa a regiones y su revisión de PI |
| 05 | [biblia-parte-ii](05-biblia-parte-ii.md) | **La Biblia de diseño:** visión, mundo de 3 capas, regiones, narrativa, facciones, gatos, Ecos, evoluciones, combate, barcos, economía, oleadas, calidad y riesgos |
| 06 | [economia-orbes](06-economia-orbes.md) | El arreglo del precio de los orbes, con antes y después |
| 07 | [arquitectura-motor](07-arquitectura-motor.md) | AgentGameEngine: módulos, trucos, mediciones, plan de migración e instrumentación |
| 08 | [biblia-arte](08-biblia-arte.md) | Dirección de arte 2.5D: luz por hora, jerarquía de detalle, animación, hábitats, lentes regionales y producción |
| 09 | [hosting-arte](09-hosting-arte.md) | Dónde vive el arte (2º repo de Pages, mismo origen), por qué el juego no se muda (partidas), pasos y rollback |
| 11 | [rendimiento-sin-iris-xe](11-rendimiento-sin-iris-xe.md) | Mediciones con el M4 sin tope, CPU frenada y SwiftShader; estimación para Iris Xe; recomendaciones aplicadas |
| 10 | [estado-implementacion](10-estado-implementacion.md) | **Bitácora:** qué está hecho y verificado, qué no se pudo verificar, limitaciones y siguiente trabajo en orden |

**Código:**
- `game/src/engine/` es AgentGameEngine.
- `game/src/rupturas/` + `game/rupturas.html` es el vertical slice.
- `game/src/art/puppetCore.ts` es el núcleo compartido de los gatos.

**Reglas:**
- No se renombran IDs.
- Ningún raster entra al repo.
- Nunca se escribe una partida desde el slice.
- "Parte 2" en el código = las Grietas (no confundir).
