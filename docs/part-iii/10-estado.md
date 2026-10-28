# 10 · Estado de la Parte III y cómo retomar

**Última actualización:** 2026-10-13.

**Etapa actual:** diseño **terminado y listo para revisión del dueño**.
- No se tocó el código del juego (`game/`).
- No se hicieron commits, push ni publicación.
- Los proyectos de Soundtrap quedaron sin cambios: misma versión y misma fecha de edición antes y después.

> **ACTUALIZACIÓN 2026-10-13 (tarde): segunda ronda.**
> - El dueño respondió las decisiones; están incorporadas en `02`, `03`, `05`, `06` y `08`.
> - **Empezó la implementación de la porción vertical** (contrato en `11`), con 4 agentes:
>   - A, cimientos e historia;
>   - B, la Carta y la Borracha;
>   - C, el bar y el Momento Drunck;
>   - D, la música con los audios reales.
> - **Arte:** Hipólito y Doña Espuma están generados con Codex como **candidatos** (falta la aprobación del dueño) e integrados (SVG + rig).
> - **Hosting:** `nolc-arte-2` está creado y configurado, sin publicar (`12`).
> - Estado vivo de cada agente en `agentes/`.
> - El estado final de esta ronda queda en §7.

**Si eres un agente nuevo:** lee este archivo entero, después `02` (la Biblia) y `03` (la estructura). Los demás documentos se consultan por tema (índice en `00-LEEME.md`).

---

## 1. Qué se entregó

| # | Documento | Estado |
|---|---|---|
| 01 | Auditoría de continuidad y pendientes de la Parte II, con fuentes | Hecho (agente AUDITORIA + §g del director) |
| 02 | Biblia narrativa y cadena causal completa (18 eslabones) | Hecho |
| 03 | Actos y capítulos: 32 capítulos y 30 misiones, cada uno con objetivo emocional, motivación, acción, revelación, cambio y tiempo; tarjetas de 5 campos; Bitácora | Hecho |
| 04 | Guion del prólogo: escena A, Momento Drunck compás por compás, escena B, remate, salida con Luzterna, despertar de REGISTRO 000 y la Carta | Hecho (milisegundos pendientes del audio exportado) |
| 05 | Segundo mapa y las 5 dimensiones; precios; reglas de combate; primera ruta de la Borracha | Hecho |
| 06 | Rareza Multidimensional, catálogo inicial de 18 pinturas con estados, dirección de arte por dimensión, fichas, animaciones y briefs | Hecho (todo en DISEÑADO) |
| 07 | Inventario verificado de las 5 canciones y propuesta audiovisual por canción | Hecho (sincronías pendientes) |
| 08 | El final: Luzterna, SADIE, el después y el apagado de sus funciones | Hecho |
| 09 | Plan de producción: etapas, dependencias, alcance y criterios de aceptación | Hecho |
| 10 | Este documento | Hecho |

**Investigación de apoyo** (`investigacion/`):
- `sistemas.md`: mapa, economía medida, rarezas, combate y piezas reutilizables;
- `arte-pipeline.md`: pipeline, límites y costos;
- `luzterna-funciones.md`: 41 funciones con su riesgo y la ficha de Canelo;
- `dimensiones-existentes.md`: choques de nombres;
- `soundtrap.md`: los 5 proyectos.

---

## 2. Lo verificado, lo propuesto y lo pendiente

### 2.1 Verificado (con fuente)

- **Canon y estado al final de la Parte II**, contra código y datos (`01` §a y §f).
  - Al terminar H65, Canelo ya no está sobre la página (`o4Pagina.ts` → `rest`).
  - Canelo nunca habló.
  - Las elecciones de H48 y H64 se guardan y nada las usa.
  - REGISTRO 000 usa el arte de Nadie en las islas 3D.
- **Las promesas de la Biblia de la Parte II que se redujeron**, con números (`01` §d): 34 especies en vez de ~80, 2 evoluciones en vez de ~28 y 21 Ecos genéricos.
- **Las causas medibles de las 4 quejas del dueño** (`01` §e). Por ejemplo, 13 de 35 `why` terminan en premio y 37 partes de beat te llevan a la isla.
- **El mapa de la Parte I:** 6 zonas × 9 etapas, élite en la 5 y jefe en la 9. Agregar zonas a `content.enemies` rompe la Parte I. Hay capturas en el scratch de la sesión.
- **Economía medida con el código real:** (a) ~17 M/s, (b) la partida del dueño, 88.5 M/s con 7.4 h de ingreso guardadas, y (c) 0.6–1 B/s.
- **Rarezas:** primordial es una marca sobre legendario; `x_` está libre; `isPart2Mission` toma H ≥ 31; el regex de misiones llega hasta H99.
- **Arte:** una pintura por gato; una pose es otra pintura (~8 MB); `nolc-arte` tiene lugar para ~9 gatos; el estilo plano probablemente pesa menos.
- **Luzterna está en casi toda la interfaz:** `tip()` usa su voz por defecto, 162 misiones van firmadas por ella y NOVEDADES exige su línea.
- **Los 5 proyectos de Soundtrap:** títulos, tempo, tono, compases exactos, pistas y regiones. **Drunck = enlace 1, SADIE = enlace 5.** Hay medición de señal (estructura) en Drunck y SADIE.

### 2.2 Propuesto (lo decide el dueño; nada está hecho)

- Toda la historia de `02`–`04` y `08`.
- El mapa, los precios y las reglas de `05`.
- La rareza y el catálogo de `06`.
- **El reparto de canciones:** Daria → duelo con Itō (H80), No wey → «No, wey» de Luzterna (H86), xti es amor → la última noche tranquila (H91) (`07`).
- Los estilos de los 5 Momentos.

### 2.3 Pendiente

| Pendiente | Quién | Bloquea |
|---|---|---|
| Milisegundos de todas las sincronías | Agente de música, con el audio exportado | Implementar cualquier Momento |
| Peso real de un gato «plano» (estimado en 3–5 MB) | Agente de arte, con Hipólito | Presupuesto del Lote A |
| La fixture `h65-normal` | Agente (etapa 0) | Probar precios |
| Medir duraciones jugando | Dueño + bots | Confirmar las 10–12 h |
| Escuchar con oído humano | Dueño | Publicar |

---

## 3. Decisiones que necesito del dueño antes de implementar

Ordenadas por cuánto cambian el alcance:

1. **¿Qué canciones entran?** El brief habla de «cuatro canciones», pero solo nombra dos, y hay tres más: No wey, Daria y xti es amor. **Propuesta: usar las tres** (`07` §4–6). Si una sobra, se quita su Momento.
2. **Exportar las mezclas** de las canciones elegidas desde Soundtrap (Archivo → Exportar, WAV o MP3) a `~/Desktop/No one - raster (fuera del repo)/audio-derivados/originales/`. Si se puede, también las pistas por separado. **La otra opción es autorizarme explícitamente a exportarlas yo** desde su sesión. Sin esto, ningún Momento se sincroniza.
3. **Abrir `nolc-arte-2`** (un segundo repo de Pages para el arte completo). Sin eso, solo caben ~9 gatos nuevos.
4. **Nombres y límites de las parodias.** Batcat, Spidercat y Harrycat evocan marcas; Bad Cat y Taylor Cat, personas reales. Propongo:
   - parodia en la actitud;
   - sin emblemas, trajes, rasgos ni letras;
   - nombres en datos y alternativas listas.

   **Recomiendo una consulta legal antes de usarlos en anuncios pagados.** ¿Se mantienen los nombres?
5. **¿Quién guía al jugador después de la muerte de Luzterna?** Propuesta: nadie la reemplaza; quedan la Bitácora (texto, con tu letra) y el Diario. Alternativa: Noctis o Maneki como «voz de puerto» (`08` §6.3).
6. **¿La Parte III responde quién escribió REGISTRO 000?** Propuesta: **no**. Se profundiza («tiene tu letra») y queda abierto (`02` §6).
7. **El gancho final opcional:** algo afuera contesta la señal apagada (`08` §7). ¿Va o no?
8. **El nombre:** «Parte III — Fuera de la Caja».
9. **Canelo habla solo fuera de casa**, en las dimensiones (`02` §4.6). ¿Se confirma?
10. **El cambio de orden H85/H86** y el estilo de cada Momento (`07`).

---

## 4. Riesgos abiertos

| Riesgo | Mitigación |
|---|---|
| Que la muerte de Luzterna se sienta como castigo o como un fracaso del jugador | `08` §3: un punto fijo, sin metas de protección, sin inputs durante la muerte y con la prueba F-1/F-2 |
| Que Luzterna «aparezca viva» en una superficie olvidada | `voiceFor` único + prueba de hablantes (`08` §6.2, F-3) |
| Que se repita «demasiado de golpe» | Una novedad por capítulo (`03` §6) |
| Que se repita «no sé por qué hago esto» | Tarjetas de 5 campos + prueba C-1/C-2 |
| El alcance: 18 pinturas, 5 Momentos, 5 reglas, un mapa nuevo y la Bitácora | El plan por etapas termina en algo jugable cada vez; la porción vertical va primero (`09`) |
| Que las H66+ caigan en el reinicio de la Parte II | Etapa 0: acotar `isPart2Mission` |
| Hosting del arte | `nolc-arte-2` |
| Propiedad intelectual de las parodias | Decisión 4 |

---

## 5. Cómo retomar

1. **Para revisar el diseño:** leer `00-LEEME.md` y seguir el orden recomendado.
2. **Para implementar** (solo con el OK del dueño): empezar por la **etapa 0** de `09` y después la **porción vertical** (etapa 1). Cada agente mantiene `agentes/<AGENTE>.md` (formato en `agentes/LEEME.md`). **No más de 4 agentes a la vez.**
3. **Para la música:** con los audios exportados, seguir `07` §8. El método de onsets es el de la Parte II (`docs/part-ii/29` §6.1).
4. **Para el arte:** seguir `06` §5 y `investigacion/arte-pipeline.md` §6–7. Hipólito es el primer gato y la primera medición del peso de un gato plano.
5. **Para volver a revisar Soundtrap:** `investigacion/soundtrap.md` §0 explica la lectura de solo lectura del JSON. Antes de confiar en los compases, hay que comprobar que la versión y la fecha de cada proyecto no cambiaron.

**Pestaña suelta:** quedó una «Nueva pestaña» vacía en el Chrome del dueño, fuera del grupo de Claude. Se puede cerrar a mano.

---

## 6. Bitácora corta

- 2026-10-13: el director arma el equipo de diseño:
  - AUDITORIA: `01`, inventario de Luzterna y dimensiones;
  - SISTEMAS: mapa, economía y rarezas;
  - ARTE: pipeline y límites;
  - MUSICA: Soundtrap, sin modificar los proyectos.

  Los cuatro terminaron. El director escribió `02`–`10` con sus datos.

---

## 7. Estado al cierre de la segunda ronda (2026-10-13, noche)

### 7.1 Decisiones del dueño incorporadas al diseño

| Decisión | Dónde quedó |
|---|---|
| Las 5 canciones entran. Drunck abre, SADIE acompaña la muerte. Las otras tres, donde tengan sentido | `07`: **Daria → duelo con Itō (H80) · No wey → «No, wey» de Luzterna (H86) · xti es amor → última noche tranquila (H91)**. Se confirmó con la señal real, sin forzar escenas |
| La Parte III termina con la muerte de Luzterna; hay que darle espacio al duelo | `08` §5.1–5.3: sin premios, chistes ni invitaciones a lo siguiente; vigilia; recado; FIN; el bar días después |
| Hay que encariñarse más con ella | `02` §4.5: participación (dibuja la Carta, comanda su batalla, salva a Firma, carga a Canelo) + tabla de convivencia |
| Creer que el que muere es Canelo | `02` §4.8: 8 pistas y riesgos reales + 6 pistas honestas del final real. La Mano va por Canelo y Luzterna se pone delante (`08` §2) |
| No revelar quién escribió REGISTRO 000 | `02` §4.4: qué se resuelve y qué queda abierto. Cerito toma forma de gato «por ahora» y su rareza sigue «no aplicable» |
| La Parte IV queda abierta, sin resurrección | `08` §5.3 y §7 (lo que responde desde afuera va en el post-juego, sin consolar) |
| Multidimensional es una rareza propia | `06` §1: rareza, origen y regla de origen separados. «Uno por tripulación» queda **pendiente de prueba**, con plan y umbrales |
| Más referencias pop con nombres propios | `06` §2.3–2.4: 31 gatos con complexión, pose, pelaje y mecánica distintos, incluidos cantantes hispanos y angloparlantes y una referencia a Billie Eilish (Billie Bigotish) |
| Las 9 etapas son punto de partida | `05` §1.4: cada dimensión con su propia forma |
| Hosting | `12`: el repo actual no alcanza para la Parte III, así que **`nolc-arte-2` está creado y configurado** (sin publicar, a la espera del juego) |

### 7.2 La porción vertical: qué está en cada estado

| Pieza | Diseñado | Implementado | Probado (automático) | Revisado visualmente | Requiere al dueño |
|---|---|---|---|---|---|
| Seguridad de la Parte II (H66+ fuera del reinicio y del registro) | ✓ | ✓ | ✓ (con la partida veterana y partidas de la Parte I) | — | — |
| H66 · bar (escena A, B y remate) | ✓ | ✓ | ✓ (11 pruebas, incluida la regla del OYENTE por geometría) | ✓ QA, 92 cuadros | **Ver** el remate y si da risa |
| Momento «Drunck» | ✓ | ✓ (22 escenas, 14 inputs, sincronía con la señal real: bombo, mediana 13,7 ms) | ✓ (10 pruebas; el resultado no cambia) | ✓ QA | **Ver y escuchar completo.** Visualmente es **más simple** que los Momentos de la Parte II: hace falta una pasada de pulido |
| H67 · calle con Luzterna | ✓ | ✓ | ✓ | ✓ (Luzterna sin el exceso de magenta, corregido) | **Ver** la escena |
| Despertar de REGISTRO 000 | ✓ | ✓ | ✓ | ✓ QA | — |
| Tarjetas de 5 campos y Bitácora mínima | ✓ | ✓ | ✓ (ninguna tarjeta usa el premio como motivo) | ✓ QA | ¿Se entiende por qué se va a cada lado? |
| H68 · Carta de las Cajas y compra con Maneki | ✓ | ✓ | ✓ (precio con 3 perfiles: 15 B para h65) | ✓ QA | **Ver** la Carta |
| H69 · B-1 a B-5, regla Mareo, huellas y élite | ✓ | ✓ | ✓ (13 pruebas de Mareo: determinista, estimación = batalla) | ✓ QA (60 fps) | El balance: fácil con una tripulación fuerte (élite en ~7 turnos), un escalón con una débil (83 %) |
| Recargas a mitad de camino | ✓ | ✓ (H67 se retoma por la gatera o el IR; el despertar se vuelve a encolar) | ✓ QA | — | — |
| Partidas de la Parte I y II sin cambios | — | — | ✓ | ✓ QA vs referencia | — |
| Música: Drunck original + 3 variaciones | ✓ | ✓ | ✓ (las originales reservadas) | — | **Escuchar** las 3 variaciones (`docs/part-ii/escuchar.html`, arriba) |
| Arte: Hipólito, Doña Espuma, Oficial Dona | ✓ | ✓ **como candidatos** | ✓ (sin raster; build OK) | ✓ rigs sin rasgaduras (QA) | **Aprobar o corregir** (hoja `arte-nuevo/revision/lote-p.jpg`) |

**Totales:** `npm run typecheck` limpio · **625/625** pruebas · `verify-missions --all` 166 OK · build de producción sin raster.

**Capturas para el dueño:** 30 con su hoja de contacto en `<scratch>/qa-porcion/para-el-duenio/00-hoja-de-contacto.jpg`. Fuera del repo, como todo raster.

### 7.3 Corregido por el coordinador después del QA

1. Recargar durante el despertar lo perdía: ahora se vuelve a encolar.
2. La gatera del faro casi no respondía, porque el brillo de la página se tragaba los toques.
3. «TURNO n» no se leía de noche: ahora tiene contorno.
4. El aviso de la Fonoteca salía encima de la escena B: ahora espera a que termine.
5. PAGAR y LUEGO estaban descentrados.
6. El título decía «PARTE II» en partidas de la Parte III.
7. Rig de Oficial Dona (la gorra ya no se arrastra). El de Doña Espuma **no se resolvió**: el lápiz del chongo se afina en el ataque, un detalle menor y pendiente.
8. Saturación de Luzterna en la caricatura.
9. Balance de B-4 y B-5.
10. Hueco de recarga entre el bar y la calle.

**Re-verificación del QA en el navegador:** 6 de 7 arreglos pasan; solo falla el lápiz de Doña Espuma. Capturas en `<scratch>/qa-porcion/raw2/`.

### 7.4 Pendiente (en orden)

1. **Revisión del dueño** (tabla de arriba): arte candidato, Momento con audio, variaciones, remate y balance.
2. **Pulido visual del Momento Drunck.** Varias escenas se ven vacías (el faro y la página, las burbujas sobre fondo celeste). Con el visto bueno del dueño sobre la estructura, se haría una segunda pasada de dirección de arte.
3. **Detalles menores de la Carta:** la ficha de huellas queda sobre el oscurecido del diálogo y hay notas al margen tapadas. Aviso de Pixi «textureSource destroyed» al cerrar el Momento: inofensivo, no investigado.
4. **Lo que falta de la Borracha:** desvío, La Ronda, encargos, encuentros, B-6 a B-9 con El Cadenero y la especie coleccionable de Hipólito.
5. **Siguiente etapa** (`09`): Acto I completo (Etapa 2).

### 7.5 Nada publicado

- **Sin commits ni push** en el juego. Hay 78 archivos nuevos o modificados en el árbol de trabajo.
- **`nolc-arte-2`** está creado y configurado, sin publicar (autorizado por el dueño).
- La publicación de la actualización del juego **requiere el OK del dueño**.

## 8. Ronda 3 · Pulido del arranque (2026-10-14)

**El dueño jugó la porción.** Aprobó los 3 gatos, el oyente oculto, el humor y el remate, y el cariño de la escena de Luzterna. Pidió pulir el arranque antes de ampliar la historia: «dos ritmos», sombras mejor hechas y psicodelia con dirección. Todo el detalle está en **`13-pulido-arranque.md`**.

| Pieza | Estado |
|---|---|
| Entrada: faro (lámpara incluida), hoja y gatera llevan al mismo recorrido; la hoja llama con anillo, pelo y «LA PÁGINA»; el IR apunta a la hoja | **Implementado y probado**. El QA encontró que el brillo del haz se tragaba los toques de la lámpara; ya está corregido y verificado. |
| Cruce y escena A (luz de la gatera, pelos en la calle, actuación, la puertita en la espuma, el cliente Guijarro) | **Implementado y probado** (agente BAR) |
| Momento Drunck (el bar como escenario de la memoria, mapa de ideas, siluetas reales, tinta sumi-e, clímax con los tres bandos) | **Implementado y probado** (agente MOMENTO; 2 rondas) |
| Escena B (la barra como diagrama) y revelación | **Implementado y probado** (agente BAR) |
| Calle con Luzterna y `silueta.ts` (siluetas del arte real con ojos encendidos, horneado suave de Luzterna, tramos distintos, el hilo) | **Implementado y probado** (agente LUZ; 2 rondas) |
| QA de punta a punta (`agentes/QA-PULIDO.md`) | Todo pasa: 6 recargas sin trabas, oyente oculto, «Reducir movimiento», partidas viejas intactas, 0 errores de consola, 60 fps en las cines |
| **Revisión visual del dueño** | **Pendiente**: hojas antes/después en `<scratch>/qa-pulido/para-el-duenio/` |

**Corregido por el coordinador después del QA:**
- `beam.eventMode = 'none'` en el faro de la isla.
- El aviso «NUEVA CANCIÓN» espera toda la noche: retención `gateras_noche` y tope de 10 min.
- `frameCamera` cuenta el giro de la cámara (la regla del oyente en c40).

**Tirones corregidos después del QA:**
- **Cruce.** Las pinturas del bar se precargan en tiempo ocioso mientras H66 espera y se hornean una por cuadro. Peor cuadro durante la luz de la gatera: 48–53 ms (antes 183–767).
- **Momento.** Se quitó la lente de refracción, que pedía una textura nueva cada cuadro, y se precalienta todo. Ningún cuadro pasa de 100 ms con el reloj corriendo (peor 75–82 ms).
- Verificado: `tsc` limpio, 670/670 pruebas y 166 misiones OK.

**Para que decida el dueño:**
- **Duraciones.** Del toque del faro a la Carta son unos 7 min 11 s. Escena A ≈ 37 s, B ≈ 102 s, revelación ≈ 34 s, calle ≈ 109 s.
- **Recargas.** Recargar a mitad del Momento o de B repite A y el Momento (~3,5 min).
- **Brazos de Canelo.** Los brazos de Canelo en los insertos de B están dibujados en código.
- **El cliente.** Guijarro sale pálido en el horneado TV.
- **Un globo cambió.** «Yo lo veo. Nadie más.» ahora dice «Solo yo lo veo.» para respetar la regla de máximo 4 palabras.
- **La bufanda.** En la silueta de V1/V5 la bufanda casi no se lee.

- Las capturas «antes» están en `<scratch>/antes/` y las «después» en `<scratch>/despues/<agente>/`. Ninguna está en el repo.
- **Disco:** quedan menos de 1 GB libres en la máquina. Las herramientas de captura borran su perfil de Chrome al terminar.
- Sigue sin haber commits, push ni publicación.

## 9. Ronda 4 · El resto de la historia en películas (2026-10-26)

El dueño pidió:
- continuar la historia con mucha más narrativa;
- películas con pocos o ningún clic antes de cada batalla y con canciones;
- estilos únicos (Van Gogh, Da Vinci, realismo con clima y cámara);
- muchos más gatos con referencias que se noten;
- el giro: el jugador cree que muere Canelo y muere Luzterna;
- las 9 canciones medidas, con hojas de entrada visuales;
- MAI SVG de vuelta en el pipeline;
- más agentes.

El contrato está en **`14-plan-cinematografico.md`**.

**Oleada 1 (diseño, investigación y prototipos), 6 agentes en paralelo:** NARRATIVA, TEMPERATURA, MÚSICA, CINE, ARTE y MECÁNICAS. Cada uno lleva su estado en `agentes/`. No hay nada commiteado ni publicado.


**Avance de la ronda 4 (2026-10-26, noche):**

| Pieza | Agente | Estado |
|---|---|---|
| Historia v2 y guiones de todo (H66–H97, 41 películas) | NARRATIVA | Terminado. Las pasadas 3 y 4 de TEMPERATURA están aplicadas. |
| Prueba ciega del giro | TEMPERATURA | Ronda C: sorpresa 6/5/6/6. Ronda D en curso. |
| 9 canciones medidas, línea de tiempo visual y beatmaps | MÚSICA | Terminado. En curso: registrar las originales y la música derivada. |
| Motor de películas, 85 estilos investigados y demo `?film=demo` | CINE | Terminado. En curso: las películas del final, con SADIE. |
| Catálogo de 100 gatos, piloto y lote W1 (11/21) | ARTE | Pausado hasta que Codex reinicie su límite. |
| Mecánicas: H99, esquema de nodos, dificultad, B-6..B-9, El Cadenero, presentación antes de la batalla, sello y MULTIDIMENSIONAL apagada | MECÁNICAS-IMPL | Hecho, con 758 pruebas. En curso: la Carta con varias cajas, desvíos y La Ronda. |
| Películas del Acto I | FILM-ACTO1 | En curso. |

**Ronda 4 terminada en producción (2026-10-27, madrugada):**

| Pieza | Estado |
|---|---|
| Historia H66–H97: guiones de todos los actos y el final, con las pasadas 3–6 de TEMPERATURA | Terminado. Ronda ciega E: el «quién» quedó en 2–3 y el estimado con la pasada 6 es ~6. **El dueño decide el giro**: deuda falsa pagada, tocar H67 o aceptarlo así. |
| Películas: Acto I (13), Acto II (11), Acto III (10), Acto IV (5), final (11) y plantilla de presentación | Terminadas. Corren a 60 fps. Los suplentes quedan hasta que el dueño apruebe el arte. |
| Integración en el juego: misiones H66–H97, 5 cajas con sus reglas, flujos, partidas de prueba por acto, duelo, llama de Canelo, guarda de Luzterna | Terminado: 948 pruebas y 194 misiones verificadas. |
| Música: 8 originales registradas, 20 piezas derivadas y propias, línea de tiempo visual | Terminado. Pendiente: la escucha del dueño (lista en `musica-v2/escuchar-oleada3.html`). |
| Arte: catálogo de 100 gatos, lote W1 (21) y 8 nativos | Generado fuera del repo. **El dueño debe aprobarlo** antes de integrarlo y activar `nolc-arte-2`. |
| QA de punta a punta (QA-P3) | En curso. |

Nada commiteado ni publicado. Las decisiones del dueño están listadas en el resumen del coordinador.

## 10. Cierre de la ronda 4 (2026-10-27)

**Decisiones del dueño (2026-10-27):**
- **Giro:** «haz lo que me recomiendas». Va con la deuda falsa pagada: Luzterna ayuda a Cerito a revivir a Canelo, pierde para siempre un vidrio de su linterna, sobrevive y bromea («Me debes un vidrio, gordo»). Después la mata La Mano.
- **Arte nuevo:** aprobado, con un sitio de arte nuevo (`nolc-arte-2`).
- **Música:** aprobada, incluido el cambio `CueOpts.at` de la Parte II.
- **Economía:** el dueño la prueba él mismo en su partida, ya en la Parte III. No se rebalancea antes.
- **«Continuará»:** en silencio, o como funcione mejor.
- **Publicación:** «publícalo en vivo cuando todo esté listo».

**Oleada final:**

| Pieza | Agente | Estado |
|---|---|---|
| Deuda falsa en las películas del final, F39 «Continuará» (silencio y luego el lápiz) y ronda ciega F | GIRO | Terminado. Ronda F: «quién» queda en 3 para casuales y 2 para cazadores (el grupo de control también da 2–3). La equidad sube y la escena gana sentido en retrospectiva. El techo está antes, en la frase de H67 y las pistas de H72, H74, H78 y H85. |
| 35 gatos SVG (lite y completo), rigs y `nolc-arte-2` probado en local | ARTE-INTEG | Terminado. |
| Los gatos nuevos como coleccionables: fuentes, MULTIDIMENSIONAL encendida para 9 especies con arte, Tienda de la Caja | GATOS-DATOS | Terminado. Ver `mecanicas-v2/05-gatos-coleccionables.md`. |
| Gatos reales en las películas, la plantilla y los retratos; F36 funde estática → pelaje | FILM-CAST | Ver `agentes/FILM-CAST.md`. |
| Tirones: caché WebP en un worker; el telón tapa el primer cuadro pesado | PERF | Ver `agentes/PERF.md`. |
| QA de punta a punta | QA-P3 | Terminado. Sus arreglos están en `agentes/QA-P3.md`. |

**Corregido por el coordinador:**
- **La Carta no dibujaba las cajas 2–5.** Era un bloqueo de los Actos II–IV para un jugador real: QA-P3 arrancaba esas batallas por código.
  - Causa: Superhéroes no tenía `screen`, y `cartaModel.openBoxes()` exigía etapas en línea, que no existen en las formas llave (Anime), estante (Libros) y gira (POP).
  - Arreglo:
    - `regiones.json`: cada caja tiene su ventana.
    - `cartaModel`: dibuja los nodos de esas formas, una ruta desde cada nodo requerido y la frontera en cada nodo abierto.
    - La escena: etiqueta del nodo (`a4` → 4), el barquito en la frontera, y una estrella para la élite y una corona para el jefe fuera de la Borracha (la dona de Oficial Dona y la cara de El Cadenero son solo de la Borracha).
    - El encuentro con El Estambre se movió para que la ruta 4→5 no pase por encima.
  - Prueba nueva en `tests/p3Carta.test.ts`: toda caja con etapas o nodos tiene ventana y se dibuja al abrirse. También se arregló el deshacer de `installSecondBox`, que borraba las etapas reales de Superhéroes.
  - Verificado sin pantalla con `h75`, `h83` y `h89` (con POP abierto): las 5 cajas, la tarjeta y ZARPAR en P-1.
  - Una sesión paralela («Make Acts II–IV boxes clickable on the Carta», en un worktree, sin tocar main) llegó al mismo arreglo. De ella se tomaron `shapeBox()` en `cartaModel`, que solo dibuja aristas entre nodos visibles y curva las rutas para que la llave abra y cierre simétrica, y 6 pruebas: la Borracha idéntica con otras cajas abiertas, la frontera inicial de cada forma, la llave y el estante en cualquier orden, y la puerta de historia que bloquea sin dibujar arista.
- **Capitanes con la pintura de las películas** (aviso de FILM-CAST): `captainArt` en A-8 y L-9 (Esquirla → `neon_glitch_cat`), A-9 (Itō → `ito_threads_cat`; antes salía el gato de la linterna, la seña de Luzterna), S-9 (Cruceta → `storybook_ink_cat`) y P-9 (Firma → `aurea_halo_cat`).
- **Workflow de los sitios de arte:** la descarga parcial no bajaba `game/src/art/artShardPins.ts`, y `artPaths.ts` ahora lo importa. Al llegar el juego a `main`, los dos sitios habrían dejado de publicar (`ERR_MODULE_NOT_FOUND`, reproducido). Se corrigió la plantilla `ops/nolc-arte/publish.yml`; los dos repos de arte se corrigen antes del push (`12-hosting` §4, paso 0).
- **`Bitacora.playUltimaVez`:** cerrarla antes de que terminara de escribirse fallaba en `text.length`. Ahora se detiene si los renglones ya no existen.
- **NOVEDADES:** entrada `2026-10-27-fuera-de-la-caja`, sin spoilers. Se ve bien en el panel.

**QA final (QA-FINAL): GO.** Ver `agentes/QA-FINAL.md`.
- `tsc` limpio; `vitest` 1007 pasan y 2 saltadas; `verify-missions --all` 194 OK o dormidas.
- Compilación de producción como CI: 0 ráster en `dist`, sin rutas de desarrollo. `art-publish check` da OK con la base de hoy y falla con las dos bases hasta que `nolc-arte-2` publique; por eso el paso 4 de la activación va después del 3.
- 23 partidas viejas: nada se pierde y ninguna recibe nada de la Parte III. Con `h65-normal`, H66 se activa sola y NOVEDADES se ve completa. Juego nuevo: sin Carta, sin H66 y sin gatos de las cajas.
- Ruta completa con taps reales, de H66 a H97, con una batalla real por acto ganada por la IA. Todas las películas usan el arte real y Luzterna nunca aparece viva después de su muerte.
- Producción a 60 fps en F08, F19 y F36. La isla va a ~29 fps unos 6 s en la primera sesión después de una versión nueva.
- Arreglos de QA-FINAL en `GaterasMapScene`:
  - un nodo que se abría con la Carta abierta seguía diciendo BLOQUEADA (L-6 y L-7 en el Acto III): `update()` ahora redibuja si cambia el estado o la frontera;
  - salir de la Carta mientras anima (ruta que se entinta, apertura de caja) daba errores: guardas `this.destroyed`.
- Menores abiertos: en la vista general a 1600×900 la columna de misiones tapa casi toda Superhéroes; en Anime los nodos ganados se ven poco sobre el fondo oscuro; la fixture `rupturas-raro` trae H77/b77 inventadas que chocan con misiones reales.

**Publicación:** commit en `main` y activación de `nolc-arte-2` en el orden de `12-hosting` §4.

## 11. Revelaciones Multidimensionales (2026-10-27, después de publicar)

**Pedido del dueño, jugando en vivo:** que la revelación de cada gato Multidimensional sea mucho más épica y única («si es de Homero, con donas; si es de Spiderman, también»).

**Qué se hizo:**
- `game/src/fx/sequences/multiverse/`: un universo por gato, un archivo cada uno. El kit común está en `kit.ts` y el índice por especie en `index.ts`. Todo está dibujado; no hay ráster.
- `catReveal.ts`: si la rareza es Multidimensional y la especie tiene universo, la secuencia sigue así:
  1. Se rompe el sello.
  2. El universo toma la pantalla 2,2 s (`SIG_LEN`) alrededor de la silueta.
  3. Llega la reimpresión, con la placa del universo encima de MULTIDIMENSIONAL; esa palabra después se atenúa.
  4. El color de la revelación es el remate del universo.
- Los gatos repetidos traen el universo al instante, sin tiempo extra. «Reducir movimiento» lo deja quieto y «Reducir destellos» quita los parpadeos.

| Gato | Universo (placa) | Toma de pantalla | Remate |
|---|---|---|---|
| Homiau Gatson | UNIVERSO AMARILLO | Cielo con nubes, una dona gigante que entra rodando y queda de disco, lluvia de donas | Estallido de donas y chispas, «¡WUJÚ!» |
| Gato Araña | VERSO ARÁCNIDO | Ciudad roja y azul en cómic, telaraña tejida, él entra columpiándose, sentido arácnido | Telarañas pegadas a la cámara, «¡THWIP! ¡THWIP!» |
| Murciégato | UNIVERSO NOCTURNO | Un murciélago barre la pantalla, la silueta contra la luna llena, la señal en las nubes, enjambre | «¡KA-POW!», «¡ZAS!», «¡BIFF!» de los 60 y la cámara se inclina |
| Super Siamés | UNIVERSO SÚPER | Atardecer de anime, aura dorada, rocas que flotan, grieta, «¡AAAAH!» que se alarga | Onda de choque dorada, «¡PASÓ DE NUEVE!… vidas, digo.» |
| Harry Gatter | UNIVERSO MÁGICO | Castillo de noche, velas flotantes, remolino de cartas con lacre, rayo dorado | Estela de varita, «¡EXPELLIARMIAU!», bolita dorada con alas |
| Gato Malo | UNIVERSO REGGAETÓN | Atardecer tropical, aro de neón, dembow sintetizado, ecualizador, letrero de neón | Corazones, «¡ESTO NO ES BAILE, ES LUCHA!» |
| Tailor Swift | LA GIRA DE LAS ERAS | Estadio con celulares encendidos, un barrido de color por era, pulseras «MIAU» y «13», lentejuelas | Fuegos artificiales, «¡ESTO VA A SER CANCIÓN!» |
| Billie Bigotish | UNIVERSO SUSURRO | Apagón, foco verde, susurros, escurrimientos verdes, dos latidos | Golpe de bajo y «duh.» en neón |
| Vincent van Gato | UNIVERSO PINCEL | El cielo se pinta solo en remolinos, estrellas con halo, ciprés, remolino detrás | Girasoles que florecen y su firma |

**Verificado:**
- `tsc` limpio; `vitest` 1010 pasan, con `tests/p3MultiverseReveal.test.ts` (cada Multidimensional tiene su universo).
- Los 9 se probaron sin pantalla en FxLab de tres formas: normal, «Reducir movimiento y destellos» y repetido. Todos cierran sin errores de consola.
- 60 fps parejos, con un hueco máximo de 17 ms entre cuadros. Las placas se leen, y las palabras del remate quedan abajo a la izquierda, sin chocar con la caja de la historia ni con el nombre.
- Video de vista previa (74 s, sin audio) en `~/Desktop/No one - raster (fuera del repo)/revelaciones-multidimensionales/`.
- NOVEDADES: `2026-10-27-multiversos`.

**Estado:** publicado en vivo el 2026-10-27 (9acd84f), con el OK del dueño («subelo a la partida ya»).

## 12. Cartas, poderes, 16 universos más y el final fluido (2026-10-28)

**Lo que pidió el dueño** (con capturas del Catdex): «que sea mas epico la muestra de la vista previa, que se note como tarjetas unicas… y que sus poderes tambien sean unicos, y muy poderosos… y que todos los gatos que sean referencia a algo… tambien sean multidimensionales… que tengan su propia animacion». Además, sobre la batalla final: «se pierden la gracia de las escenas… muchas pantallas de carga y se pierde esa sensación de "puta murio"… deberia ser mas fluida y con la musica correcta».

Lo hicieron cinco agentes en paralelo; cada uno dejó su estado en `docs/part-iii/agentes/<AGENTE>.md`.

**Reclasificación** (`data/gateras/especies.json`, rareza y referencias `balance:rarities.multidimensional`). 16 gatos de referencia pasan a Multidimensionales, así que ahora son 25:
- e_comecroquetas, l_bigoton, l_gatzilla, l_emiau, e_ovillo, e_estambre;
- r_gatarana_noir, r_gatarana_blanca, r_gatarana_2099, r_gatemson;
- c_gritito, e_gatoconda, e_sonrisa, e_sirsimon, r_garbancito, e_maneki.

Quedaron fuera, a la espera de lo que diga el dueño, tres guiños sin parodia concreta: Hipólito, Oficial Dona y el s_maneki «Mochi Maneki» de la Parte I.

Efectos sobre las partidas:
- Los gatos conservan nivel, estrellas y orbes.
- Producen más oro (base 2,4/s) y la estrella siguiente pide 45 orbes.
- Sus stats en batalla no cambian, porque salen de `combat`.

**Universos** (`fx/sequences/multiverse/`; UNIVERSOS-A con `kitA.ts`, UNIVERSOS-B con `kitB.ts`). Los 16 tienen `open`, `payoff` y `card()`, y `PENDING` quedó vacío.

| Gato | Placa | Idea |
|---|---|---|
| Comecroquetas | UNIVERSO ARCADE | laberinto de neón, fantasmas-gato, la croqueta de poder cae en el relleno de color: «¡WAKA-MIAU!» |
| Príncipe Bigotón | UNIVERSO PRÍNCIPE | visor de poder hasta «¡MÁS DE 8000!», aura violeta, rayo: «¡SOY EL PRÍNCIPE!» |
| Doctor Ovillo | UNIVERSO TENTÁCULO | laboratorio, brazos de estambre, reactor-ovillo: «¡HORA DE ENREDAR!» |
| El Estambre | UNIVERSO TOLVANERA | dunas de lana, la silueta se deshace y se teje: «¡TORMENTA DE ESTAMBRE!» |
| Gato Araña Noir | UNIVERSO NOIR | blanco y negro con lluvia, máquina de escribir: «NOCHE DE LLUVIA» |
| Gata Araña | UNIVERSO PUNK | escenario pastel, cuenta de baquetas, baja colgada: «¡PLIÉ!» |
| Gato Araña 2099 | UNIVERSO 2099 | megaciudad synthwave, escaneo holográfico: «¡GARRA NEÓN!» |
| J. J. Gatemson | UNIVERSO PRIMERA PLANA | redacción, portadas girando: «¡EXTRA! ¡EXTRA!» |
| Gatzilla | UNIVERSO KAIJU | película de medianoche, ciudad de cartón, aliento atómico azul: «¡GATZILLAAA!» |
| EMIAU | BATALLA DE GALLOS | sótano en grises, barras, aerosol rojo: «MIC DROP.» |
| El Gritito | UNIVERSO ALARIDO | cielo en ondas, el puente, el grito mudo: «¡AAAAAH!» |
| La Gatoconda | UNIVERSO MUSEO | sala con flashes prohibidos, retratos que miran: «¿…SONRIÓ?» |
| Sonrisa | UNIVERSO MARAVILLAS | primero la sonrisa sola, espiral de tablero: «¡AQUÍ NO HAY NADIE!» |
| Sir Simón | UNIVERSO EMBRUJADO | salón gótico, la mancha que vuelve: «¡BUUU!» (…qué cansancio) |
| Garbancito | UNIVERSO DIMINUTO | todo gigante, el buey: «¡PACHÍN!» ×3 |
| Maneki | UNIVERSO FORTUNA | taquilla de laca, gatitos que saludan, koban: «¡SUERTE!» |

**Cartas** (CARTAS: `panels/collection/multidimCard.ts`, `cardArt.ts`, `CatCard.ts`, `printTextures.ts`, `Catdex.ts`):
- Cuadrícula: universo horneado una vez por especie y tamaño, marco metálico del color del universo, franja de las cinco cajas, foil y gema.
- Ficha: universo animado de fondo, carta flotante y panel «PODER MULTIDIMENSIONAL», que reemplaza al bloque ULTIMATE.
- Rumor: universo atenuado y poder «???».
- Respaldo genérico: túnel de cajas.
- Arreglo previo: la carta grande salía en blanco si la pintura no había cargado (`art.ts`).

**Poderes** (PODERES: `battle/multidim.ts`, `battle/fx/multidimFx.ts`, `data/multidimPowers.ts`, `docs/part-iii/mecanicas-v2/07-poderes-multidimensionales.md`):
- 25 poderes con mecánica propia; cada uno es la ulti del gato. Los textos están en `MULTIDIM_POWERS`.
- Solo en el lado 0 (el jugador). Como rivales, EMIAU, Bigotón, Ovillo, Estambre y Sir Simón quedan idénticos: lo comprueba una prueba por gato, y la bitácora de H63 sale igual a la de HEAD.
- Tope de estructura: 45 % (35 % legendarios, 40 % míticos) y 18 % contra jefes.
- Las seis ultis ilimitadas pasan a 1× por batalla (2× con ★5).

**El final** (FINAL: `app/finalFlow.ts`, `app/stageIntro.ts`, `film/*`, `audio/*`, `core/scenes.ts`, `momentos/runner.ts`, `data/music/*`). Se midió completo, antes y después:
- **Antes:** 12–13 cargas, 4 telones, la canción de la isla 243 s debajo de películas en silencio (también bajo la muerte) y el chiptune de la Parte I en el asedio.
- **Ahora:** 0 cargas entre películas, porque la siguiente se precarga y el último cuadro se sostiene.
- **Asedio:** «Ojo del huracán» (`fut.jefe`, composición de COMPOSITOR-FUTURO), una sola toma para las dos peleas, que se corta en seco en K6 de «La caída».
- **Silencio:** de «La caída» a «Continuará» se mantiene el silencio (`audioApi.quiet`); solo suenan las canciones de las películas.
- **Canelo:** su tema es una sola toma hasta el trazo.
- Videos en `~/Desktop/No one - raster (fuera del repo)/final-fluido/`.

**Integración** (el coordinador):
- `finalFlow.playStoryFlow`: un flujo interrumpido («Más tarde», un error) ya no deja la isla en silencio, porque su silencio se suelta solo.
- **Fuga de memoria en el Catdex:** cada vuelta por las 25 fichas retenía unos 9 MB.
  - Causa: Pixi guarda en una reserva un batcher por cada Graphics de más de 400 vértices, y esos batchers crecen sin encogerse nunca. El cielo de Van Gato en la ficha tenía 230 mil vértices en una sola Graphics, y la laca de Maneki 114 mil.
  - Arreglo: las pinceladas son ahora polígonos (`dab`) y las escamas, polígonos de 16 lados. Quedan en 99 mil y 55 mil vértices por ficha.
  - Lo que queda: unos 3 MB por vuelta completa, con tope en el tamaño de la reserva. Sin cierres con la colección completa registrada.
- **Verificado:**
  - `tsc` limpio, `vitest` con 1084 pruebas y `verify-missions` (194 OK o dormidas).
  - Estrés del Catdex con todo registrado: cuadrícula entera más las 25 fichas, tres veces, sin errores.
- NOVEDADES: `2026-10-28-cartas-y-poderes`.

**Lo que decidió el dueño** (2026-10-28, «subelo a la partida ya»):
- Hipólito, Oficial Dona y Mochi Maneki **no** pasan a Multidimensionales.
- «Ojo del huracán» se queda para el asedio.
- Silencio total en la isla durante el duelo: `p3_sin_luz` pasa a `music: 'silence'` (solo queda el mar).
- El balance se queda como está por ahora.
- Siguen abiertas las películas en silencio de los actos II–IV (`h85_oscuridad`), que aún dejan sonar la música del juego.

**Estado:** publicado con el OK del dueño (ver el commit «feat(multidimensionales)»).

