# 09 · Plan de producción: etapas, dependencias, alcance y criterios de aceptación

**Regla de esta etapa:** nada de esto está construido. El código del juego no se tocó, no hay commits y no se publicó nada.

Este plan sirve para decidir **qué** se construye, **en qué orden** y **cómo se comprueba que funciona**.

---

## 1. Alcance

| Entra en la Parte III | No entra (o queda para después) |
|---|---|
| Prólogo del bar con Momento «Drunck» y la escena con Luzterna | Islas 3D explorables nuevas (lo pidió el dueño) |
| Segundo mapa 2D con 5 dimensiones × 9 etapas + desvío + encuentros + actividad | Vista página/mundo, Nueve Vidas, Ecos por especie y evoluciones de otros gatos (promesas de la Parte II que no se recuperan aquí, `01` §d) |
| 30 misiones principales (H66–H95) con tarjeta de 5 campos | Variantes de cara de los cantantes (`06` §6) |
| Bitácora de la Farera (tarjetas, «La última vez…», el hilo) | La expansión de gatos de `06` §2.4 |
| Rareza Multidimensional como marca + 6 Multidimensionales | Un elemento nuevo |
| 18 pinturas nuevas (`06` §2) | Doblaje o voces habladas |
| 5 reglas de combate, una por dimensión | Final alternativo |
| 5 Momentos: Drunck (H66), Daria (H80), No wey (H86), xti es amor (H91) y SADIE (H93) (`07`) | — |
| Muerte de Luzterna, el después y el apagado de sus funciones | — |

---

## 2. Etapas

Cada etapa termina en algo **jugable y revisable por el dueño**. Ninguna publica sin su OK.

> **Estado al 2026-10-13 (noche):**
> - **Etapa 0: HECHA**, salvo los dos horneados que siguen dentro de `momentos/`.
> - **Etapa 1 (porción vertical): IMPLEMENTADA, PROBADA Y RECORRIDA DE PUNTA A PUNTA** por QA. Falta la revisión del dueño: arte candidato, escucha del Momento y de las variaciones, y el pulido visual del Momento.
> - Detalle en `10` §7.

### Etapa 0 · Cimientos (invisible para el jugador)

| Trabajo | Por qué | Archivos probables |
|---|---|---|
| Acotar `isPart2Mission` a H31–H65 y sus beats a `b31`–`b65`, con prueba | Si no, las H66+ caen en el registro de premios y en el reinicio de la Parte II (`sistemas.md` §5) | `state/sys/rupturasLedger.ts`, `rupturasReset.ts` |
| Espacio de partida `ext.gateras` con normalizador | Patrón de la Parte II | `state/sys/gateras.ts` |
| Predicado `luzternaFallecida(save)` y `voiceFor(superficie, save)` con el hablante BITÁCORA | Todas las superficies de `08` §6.2 lo consultan | `ui/dialog.ts`, `ui/story/text.ts`, `data/updates.ts` |
| Campo `bitacora` opcional en NOVEDADES | `luzterna` es obligatorio hoy (`luzterna-funciones.md` fila 8) | `data/updates.ts` |
| Fixture `h65-normal` (~17 M/s) | Las fixtures actuales no representan a nadie | `game/scripts/make-*.ts` |
| Texto de REGISTRO 000 en las islas 3D: «DESPIERTO» si H66+ | Inconsistencia de la Parte II (`01` c-11) | `regions/*/residents.ts` |
| Bandas de estado del mundo 130+ para la Parte III | Para no chocar | `state/sys/worldState.ts` |
| **`nolc-arte-2`** (necesita al dueño) | Sin eso, el gato N.º 10 hace fallar la publicación del arte | Repo nuevo + `art-publish.ts` |
| Sacar los horneados de gato de `momentos/` a un módulo común + gancho en `livingCat()` | Lentes por dimensión | `art/bake/*.ts` |

**Criterio de salida:** `npm run typecheck`, `npm test` y `verify-missions --all` en verde; una partida que terminó la Parte II carga idéntica byte por byte salvo `ext.gateras` vacío.

### Etapa 1 · **Porción vertical** (la primera que revisa el dueño)

**Bar → Luzterna → segundo mapa → primera ruta de la Borracha.** Guion completo en `04`; ruta en `05` §10.

| Pieza | Detalle | Depende de |
|---|---|---|
| H66 · Momento «Drunck» | Bar psicodélico, recuerdos en los estilos de jefes y Momentos anteriores y remate del borracho (`04` §2–3). **Sincronías del Momento: pendientes de exportar la mezcla** (`07` §Drunck) | Etapa 0 · audio exportado por el dueño o autorización para descargar · Hipólito y Doña Espuma (arte) |
| H67 · Escena «¿Dónde andabas, gordo?» | Caminata zigzagueante, regaño y despertar de REGISTRO 000 (`04` §4–5) | Stage `caja` o estudio de Momentos sin música |
| H68 · La Carta de las Cajas | Escena de mapa con una región (Borracha) y 5 rasgaduras dibujadas (4 con niebla en blanco); compra con Maneki; material Huellas | Etapa 0 |
| B-1 a B-5 + primera Ronda | 5 batallas con la regla Mareo | `buildSiege`, regla Mareo |
| Bitácora mínima | Tarjeta de 5 campos + «La última vez…» (el hilo puede esperar) | Etapa 0 |
| Arte | Hipólito, Doña Espuma y la lente Borracha | Lote S (cabe en `nolc-arte` hoy) |
| Música | Momento con la original de Drunck; variaciones de bar para el mapa y las batallas (`07`) | Análisis con audio real |
| NOVEDADES | Una nota con `luzterna` y `bitacora` | Etapa 0 |

**Lo que el dueño revisa:**
1. ¿El prólogo explica la Parte I y la II sin sentirse clase?
2. ¿El remate da risa?
3. ¿La escena con Luzterna recupera el cariño?
4. ¿Se entiende por qué vas a la Borracha?
5. ¿El mapa se siente como el de la Parte I?
6. ¿El precio se siente bien?

### Etapa 2 · Acto I completo
B-6 a B-9, H69–H73, Borrón, Disruptores (H71), la resaca en blanco y negro (H72) y El Cadenero. **Arte:** Borrón, El Cadenero y Cerito (Lote A, primeras 3 pinturas). **Necesita `nolc-arte-2`.**

### Etapa 3 · Acto II
- Superhéroes y Anime: reglas Onomatopeya y Poder; actividades Patrulla, Torneo y Entrenamiento; el punto medio H81.
- **Infra Multidimensional** (opción A, `sistemas.md` §3.6) + reglas de origen de Batcat y Super Siamés.
- **Arte:** Batcat, Spidercat, Super Siamés, Cruceta, Itō y Esquirla.
- **Momento «Daria»** en el duelo con Itō, H80 (`07` §4).

### Etapa 4 · Acto III
Libros: regla Capítulos, Finales perdidos, «El hilo» de la Bitácora, la escena de la azotea y la ruptura de los Disruptores. **Arte:** Harrycat, Sonrisa, La Mano y Sinfín. **Momento «No wey»** en la batalla de Luzterna, H86 (`07` §5).

### Etapa 5 · Acto IV
POP: regla Ritmo (SINCRO ampliada), La Gira, la cabina de fotos y la última noche tranquila. **Arte:** Bad Cat, Taylor Cat y Firma. **Momento «xti es amor»**, la última noche tranquila, H91 (`07` §6): es el primer Momento de paseo, sin batalla.

### Etapa 6 · Final
- H93: 3 fases, regla de oscuridad, Momento SADIE «Linterna mágica» e input MIRA.
- H94 y H95: vigilia, el recado, el bar del epílogo, la luz de Canelo y la página.
- `voiceFor` con todas sus superficies y la prueba de hablantes.
- Estados `p3_sin_luz` y faro naranja; Cerito gato; accesorio de la bufanda.

### Etapa 7 · Pulido y publicación
- Recorrido completo del dueño.
- **Pasada de mezcla con oído humano** (queja 4 de la Parte II).
- NOVEDADES.
- Publicación **solo con el OK del dueño**.

---

## 3. Dependencias (lo que bloquea qué)

```
Dueño: OK de nolc-arte-2 ─────────────┐
Dueño: exportar mezclas (o autorizar) ─┼──► Etapa 1 (Momento Drunck sincronizado)
Dueño: nombres de las parodias ────────┼──► Lote A/B (Batcat, Spidercat, Harrycat, Bad Cat, Taylor Cat)
Etapa 0 (isPart2Mission, voiceFor, ext.gateras) ──► todo lo demás
Lente Borracha (horneados comunes) ──► Etapa 1 ──► lentes de las demás dimensiones
Regla de oscuridad (Etapa 6) ──► regla de origen de Batcat (Etapa 3): construirla en la Etapa 3
Bitácora mínima (Etapa 1) ──► «El hilo» (Etapa 4) ──► cambio de letra (Etapa 6)
Cabina de fotos (Etapa 5) ──► última placa de SADIE (Etapa 6)
```

**Nota de orden:** la regla de oscuridad conviene construirla en la Etapa 3, junto con Batcat. Así el Final la reusa ya probada.

---

## 4. Criterios de aceptación globales (cómo comprobamos que funciona)

### 4.1 Comprensión (lo que falló en la Parte II)

| Id | Criterio | Cómo se mide |
|---|---|---|
| C-1 | Antes de cada misión principal, el jugador puede responder **qué pasa, por qué importa, qué queremos y por qué vamos ahí** | Prueba del dueño: después de cada capítulo, 4 preguntas sin abrir la Bitácora. Meta: al menos 3 de 4 en cada misión. Con 2 o menos, se reescribe la tarjeta |
| C-2 | Ningún `why` ni tarjeta usa el premio como motivo | Prueba automática: regex sobre los JSON de la Parte III (la misma que encontró 13 de 35 en la Parte II). Meta: 0 |
| C-3 | Las escenas no sacan al jugador de donde está, salvo que la historia pase en casa | Prueba: ninguna parte de beat de la Parte III con `travel: true` salvo H67b, H77, H91–H95. La escena se precarga durante la tarjeta: menos de 1 s de pantalla de carga visible (medido sin cabeza) |
| C-4 | Ninguna revelación clave se dice una sola vez | Revisión de `03` §5: cada fila tiene pista, acción y Bitácora |
| C-5 | Como máximo una novedad de sistema por capítulo | Tabla `03` §6 + revisión: ninguna presentación (`features`) nueva aparece dos veces en el mismo capítulo |

### 4.2 Ritmo y tiempo

| Id | Criterio | Cómo se mide |
|---|---|---|
| R-1 | Duración de la historia principal: 10–12 h | Recorrido del dueño + recorridos sin cabeza con bots (para las batallas) |
| R-2 | Cada acto tiene un capítulo de respiro sin pelea obligatoria | Datos: goal ≠ `win_battle` en al menos un capítulo por acto |
| R-3 | Nada de esperas por reloj ni repeticiones obligatorias | Revisión de datos: ningún goal pide repetir etapas ni esperar |
| R-4 | Máximo 4 líneas seguidas sin acción | La prueba existente de la Parte II, aplicada a los JSON nuevos |

### 4.3 Economía

| Id | Criterio | Cómo se mide |
|---|---|---|
| E-1 | Una partida `h65-normal` puede pagar cada dimensión con lo que juntó jugando la anterior, sin farmear | Simulación con la fixture: oro al terminar la dimensión N ≥ precio de la N+1 |
| E-2 | La veterana no puede saltarse dimensiones | Prueba: con 10 T de oro y sin huellas, la dimensión N+1 sigue cerrada |
| E-3 | La Marea no multiplica el precio | Prueba con `mareaMult = 1000` |
| E-4 | Nada se resta de una partida al cargar | Prueba de migración: partida veterana real del dueño antes y después |

### 4.4 El final

Criterios F-1 a F-7 en `08` §8. El más importante: **F-3, Luzterna no habla en presente después de H93**.

### 4.5 Arte

Estados y criterios de `investigacion/arte-pipeline.md` §7:
- silueta legible a 64 px;
- SVG ≤ 5 MB en dimensiones planas (A-1: medir con Hipólito);
- rig sin rasgaduras;
- 60 fps con 30 gatos.

### 4.6 Música y Momentos

| Id | Criterio | Cómo se mide |
|---|---|---|
| M-1 | Cada Momento usa la canción **entera**, sin edición | Pedido del dueño en la Parte II: duración del Momento = duración del audio |
| M-2 | Sincronía con el bombo: mediana menor de 10 ms y p99 menor de 20 ms | Mismo método que la Parte II (`29` §14.5) |
| M-3 | El simulador da lo mismo con y sin Momento | Prueba de partida idéntica (como en la Parte II) |
| M-4 | La primera vez no se salta; después sí | Prueba |
| M-5 | Las originales solo suenan en Momentos y en la Fonoteca | `tests/originalsReserved.test.ts`, ampliada |
| M-6 | **El dueño escuchó** cada variación y cada Momento antes de publicar | Lista de escucha en `escuchar.html` |

---

## 5. Estimación (orden de magnitud, sin medir)

| Etapa | Agente | Dueño |
|---|---|---|
| 0 | 2–3 días | OK de `nolc-arte-2` y exportar audio |
| 1 (porción) | 6–9 días (de ellos, el Momento Drunck: 2–3) | 1 revisión larga |
| 2 | 4–6 días | 1 revisión |
| 3 | 8–12 días | 2 revisiones + nombres de las parodias |
| 4 | 6–9 días | 1–2 revisiones |
| 5 | 6–9 días | 1–2 revisiones |
| 6 | 6–8 días | 1 revisión (la importante) |
| 7 | 3–4 días | recorrido completo + escucha |

**Total aproximado: 41–60 días de agente**, con un máximo de 4 agentes a la vez (regla del traspaso de la Parte II).

Con trabajo en paralelo (arte, música y código en simultáneo), el calendario baja, pero **el cuello de botella son las revisiones del dueño**: hay 10–12 sesiones en total.
