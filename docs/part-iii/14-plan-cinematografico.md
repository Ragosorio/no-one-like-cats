# 14 · Plan cinematográfico de la Parte III (ronda 4: el resto de la historia)

> Encargo del dueño (2026-10-26). Este documento es el contrato común de todos los agentes de esta ronda. Léelo completo antes de empezar.
> ⚠️ Contiene spoilers de la Parte III. Nada de esta ronda se commitea, se empuja ni se publica sin el OK del dueño.

## 0. Lo que pidió el dueño (resumen fiel)

1. **Muy narrativa.** «Entiendo qué estoy haciendo y a qué me estoy metiendo antes de una batalla.» Antes de cada batalla hay un **video**: una película sin interacción que presenta qué pasa, por qué importa, contra quién vamos y qué arriesgamos.
2. **Películas en lugar de juegos de ritmo.** Las canciones cuentan historia con más animación y menos clics; algunas con **ningún clic**.
   - Todo se **precarga**: no estamos atados al tiempo real, y eso da libertad para pulir.
   - Cada película tiene un **estilo único y una presentación única**.
   - Juega con el entorno: cómo cambian las pantallas, cómo se introduce todo poco a poco.
3. **Estilos y técnicas nuevas.** Por ejemplo, una película al estilo Van Gogh y otra al estilo Da Vinci. También algo más realista: clima (lluvia, niebla, viento, tormenta), posiciones y movimientos de cámara, luz. «Investiga»: hay que buscar más.
4. **Muchos más gatos y muchas más referencias, y la referencia se tiene que notar aunque sea mínima.**
   - «El gato Homero tiene que ser un gato que tiene una dona, siempre tiene que ser amarillo y tiene que parecerse a los Simpsons, pero no necesariamente ser los Simpsons.» Igual con el gato Spider-Man o Batcat.
   - Se presentan como **multiversos**.
5. **El giro.** Primero el jugador se encariña con Canelo y con Luzterna.
   - La historia hace creer que va a morir **Canelo** (con quien más se encariñó), y entonces muere **Luzterna** (con quien se encariñó todavía más).
   - Se juega con las reglas: **«nunca dijimos que no podía morir. Ella es la que creía que, ya estando muerta, no podía morir.»** Nadie está a salvo.
   - Debe ser inesperado: «wow, ¿qué pasó?». Hay que **medir esas temperaturas** con agentes.
6. **Música.** Hay 9 canciones (4 nuevas).
   - Se miden sus métricas y se comparan con los proyectos del dueño en Soundtrap (él dijo «SoundCloud»). Queda escrito, también de forma visual, **cuándo entra y cuándo sale cada cosa**, para que la imagen lo distinga y no solo el audio.
   - Algunas canciones van **completas** porque cuentan y cantan todo, como **SADIE**, la más triste: es incremental. Otras usan una distorsión que crece con un sentido narrativo, para llevar a un clímax.
   - Otras van **en fragmento**. Habrá partes calmadas, y está bien.
7. **Energía y pulido.** Mucha energía y dopamina, y todo pulido: cada animación y cada video se entienden, cada detalle representa algo.
8. **La Parte III termina con «Continuará»**, como siempre.
9. **MAI SVG está de vuelta** en `~/Desktop/MAI SVG` y el pipeline de arte vuelve a usarlo.
10. **Más agentes en partes distintas.** Uno revisa mecánicas y otros revisan cada cosa. La meta es poder jugar algo pronto.

## 1. Lo que ya existe (no se rehace)

- **Arranque H66–H69**, implementado, pulido y aprobado en su dirección: bar, Momento Drunck, revelación, calle con Luzterna, despertar, Carta de las Cajas y ruta B-1..B-5. Ver `13-pulido-arranque.md` y `10-estado.md` §8.
- **Diseño anterior**: `02-biblia-narrativa.md` (cadena causal de 18 eslabones), `03-actos-y-capitulos.md` (H66–H96), `05-mapa-y-dimensiones.md` (5 dimensiones), `06-gatos-rareza-arte.md` (rareza MULTIDIMENSIONAL y 31 parodias), `07-canciones-y-momentos.md` (5 canciones) y `08-final-luzterna-sadie.md`.
  - Esta ronda **los toma como base y los extiende**. Si algo cambia, el documento nuevo lo dice y el viejo se queda como historial.
- **La regla falsa ya está plantada** en H67: «Te voy a buscar. Es mi trabajo. Y a mí ya no me puede pasar nada, gordo: ya me pasó todo.»
- **Herramientas**:
  - el motor de Momentos (`game/src/momentos/`: partitura, beatmaps, escenas precalentadas, `?momento=<id>&scrub=1`);
  - las cines (`game/src/cine/`);
  - `silueta.ts`;
  - el escenario `caja` (`scenes/CajaScene.ts`);
  - las herramientas de captura (`<scratch>/pp/`; el scratch de cada agente puede cambiar, así que copia lo que necesites).

## 2. El formato nuevo: «Películas»

- **Película** = un Momento en **modo película**: partitura determinista, escenas construidas antes del reloj, se puede adelantar y retroceder, y tiene **0 a 3 entradas opcionales** que jamás cambian el resultado.
  - Como no es interactiva, puede **hornear de antemano** lo pesado (texturas, pinceladas, simulaciones) durante la carga.
- **Película de canción** (con una original del dueño): las originales siguen sonando **solo** en Momentos o películas y en la Fonoteca.
- **Película de presentación** (antes de cada batalla, de 20 a 60 s): qué pasa, por qué importa, quién es el rival y su regla, y qué arriesgamos. Usa variaciones derivadas o piezas propias, **no** las originales.
- **Gramática común**:
  - barras de cine o cambio de formato;
  - tarjetas de capítulo;
  - títulos con estilo propio de cada dimensión;
  - transiciones que cuentan algo (una puerta, una página, un objeto que se vuelve escenario);
  - clima y luz;
  - cámara con capas de profundidad (dolly, grúa, cámara en mano, foco que cambia).
- **Accesibilidad**: «Reducir movimiento» y «Reducir destellos» se respetan siempre; los subtítulos o globos se leen sobre zonas calmadas.
- **Saltar**: en la primera vista la película de canción no se salta. Las presentaciones sí se pueden saltar después de verlas una vez. Todo queda en «Volver a ver».

## 3. Equipos (ronda 4, oleada 1)

| Agente | Qué entrega | Dónde escribe |
|---|---|---|
| **NARRATIVA** | La historia completa v2 (Actos I a IV y final): mapa de capítulos con misiones, película de presentación por batalla, películas de canción, multiversos, y guiones del Acto I listos para producir. | `docs/part-iii/historia-v2/` |
| **TEMPERATURA** | Cómo medir el apego, la tensión, el humor y el miedo. Auditoría de lo que el jugador ya vivió con Canelo y Luzterna (Partes I y II, datos reales del juego). Curva objetivo de la Parte III y plan del engaño (Canelo) y el giro (Luzterna), con pistas honestas. Revisa a NARRATIVA. | `docs/part-iii/temperatura/` |
| **MÚSICA** | Las 9 canciones: BPM, tonalidad, compases, secciones, curva de energía, entradas y salidas por pista (Soundtrap, solo lectura) y medición de la señal. **Hojas de entrada visual** (datos + HTML de línea de tiempo). Propuesta de canción completa o fragmento según su función narrativa. Beatmaps y onsets. | `docs/part-iii/musica-v2/`; beatmaps en `game/src/data/music/beatmaps/` (solo archivos nuevos); derivados fuera del repo |
| **CINE** | Investigación de estilos y técnicas (pictóricos, realistas, clima, cámara) viables en Pixi/WebGL. **Modo película** en el motor. Biblioteca de estilos y clima. Demo jugable `?film=demo` con 3 estilos. | `game/src/film/` (nuevo); `docs/part-iii/cine-v2/` |
| **ARTE** | Catálogo v2 con muchos más gatos y **reglas de referencia legible** (los rasgos icónicos de cada parodia). Multiversos y sus estilos. Briefs de Codex. **Piloto** de 3 a 5 gatos por Codex → MAI SVG para validar el look. | `docs/part-iii/arte-v2/`; producción fuera del repo (`~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`) |
| **MECÁNICAS** | Auditoría de las mecánicas actuales y de la Parte III. El loop jugable completo: Carta, dimensiones, regla por dimensión, la rareza MULTIDIMENSIONAL, economía, dónde entran las películas. Lista de implementación por etapas. | `docs/part-iii/mecanicas-v2/` |

Las siguientes oleadas (producción de películas por acto, arte en lotes, dimensiones jugables, QA) salen de lo que entreguen estos seis.

## 4. Reglas para todos

- **Spoilers**: los documentos de `docs/part-iii/` pueden tener spoilers (la carpeta está marcada). **Ningún documento público** (README, CONTRIBUTING, guías) los tiene.
- **Nada de commits, push ni publicación.** El juego se publica con el OK del dueño. `nolc-arte-2` tiene autorización aparte del dueño, y aun así se activa solo cuando el coordinador lo pida.
- **Nunca raster en el repo**: ni PNG, JPG, WebP, GIF ni video. Las capturas y los PNG de Codex viven fuera del repo.
- **Las partidas nunca se rompen**: no se toca `game/src/state/**` ni el guardado sin coordinación; la guarda de `playMs` no se quita.
- **Las originales del dueño** quedan intactas en su carpeta: se trabaja con copias y derivados. Solo suenan en Momentos o películas y en la Fonoteca.
- **Los proyectos de Soundtrap no se modifican**: solo lectura.
- **Parodias**: nombre felino propio, rasgos que la hagan reconocible y ningún logo ni nombre registrado copiado tal cual. No se inventan frases atribuidas a artistas reales. No hay anuncios pagados.
- **Rendimiento**: 60 fps en el juego. Las películas pueden cargar más tiempo (con pantalla de carga con estilo) pero no se traban al reproducirse.
- **Cada agente mantiene `docs/part-iii/agentes/<AGENTE>.md`** (formato en `agentes/LEEME.md`), escrito en español.
- **Disco**: hay unos 14 GB libres. Borra los perfiles de Chrome y los temporales al terminar.
