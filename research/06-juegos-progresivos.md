# 06 — Juegos progresivos e incrementales: cómo diseñar el ritmo de NO ONE LIKE CATS

> Investigación de referencia (30+ juegos, matemática de incrementales, diseño de sinergias) y **Blueprint de pacing del Capítulo 1 — "The First Sea"**.
> Contexto: isla de gatos tipo Dragon City + batallas de artillería con física contra barcos modulares tipo Castle Busters + progresión incremental que se siente cada vez más rápida. Sin anuncios, sin pagos, sin energía; la regla es "esperas **o sigues jugando**". Capítulo 1 jugable en ~4–8 h con final real.
> Fecha: octubre 2026. Todo resumido con palabras propias; fuentes al final.

---

## 0. Resumen ejecutivo: 12 principios que salen de la investigación

| # | Principio | De dónde sale |
|---|---|---|
| 1 | **La curva es un subibaja**: los costos crecen de forma exponencial, la producción de forma lineal o polinómica, y los **multiplicadores** son los momentos en que la producción alcanza o rebasa a los costos. | Pecorella, *The Math of Idle Games* (Kongregate) |
| 2 | Lo que se siente como "cada vez más rápido" **no es** la velocidad logarítmica (dentro de cada acto tiende a frenarse). Se siente por: (a) más acciones con sentido por minuto, (b) lo barato que se vuelve lo que antes era carísimo y (c) **saltos de escala** al empezar cada acto. Hay que diseñar **una escalera, no una rampa**. | Cookie Clicker, AdCap, Paperclips |
| 3 | **Las recompensas activas se indexan a la producción** (por ejemplo, una victoria = 60–120 s de oro/s). Así jugar nunca deja de valer la pena. | Galletas doradas de Cookie Clicker; Rage Mode de Idle Slayer |
| 4 | **Cada sistema nuevo empieza con una "luna de miel"**: los primeros 3–5 niveles cuestan casi nada y llegan en menos de 2 minutos. Si un sistema nuevo arranca como un muro, se siente como castigo. | Quejas de jugadores de Unnamed Space Idle |
| 5 | **Automatiza lo que el jugador ya hizo a mano bastantes veces, y en ese mismo momento dale un problema nuevo.** | Legends of IdleOn ("cada sistema nuevo hace más eficientes los anteriores, pero trae su propio problema de gestión"), Factorio, managers de AdCap |
| 6 | Las mecánicas que enganchan **cambian reglas** (verbos, estados, restricciones, escala). Los "+10%" solo sirven de relleno. | Paperclips, Antimatter Dimensions, Cookie Clicker (wrinklers) |
| 7 | **La revelación tiene 5 estados**: oculto → rumor → "???" → descubierto → dominado. Siempre debe haber algo visible pero bloqueado. | Pokédex, Candy Box, A Dark Room, manos secretas de Balatro |
| 8 | Los juegos de 4–8 h con final tienen **3–4 actos**. Cada acto cambia la escala **y** el verbo principal, el clímax usa todo lo aprendido y el final recontextualiza y deja una pregunta. | Universal Paperclips, A Dark Room, Nodebuster |
| 9 | **Sinergias estilo Balatro**: el piso de dificultad crece de forma exponencial y el techo queda abierto. Lo aditivo es común y lo multiplicativo es raro. Cada efecto es legible y las combinaciones son emergentes. **"Romper" el juego ≠ "destruir" el juego.** | Balatro, Vampire Survivors |
| 10 | **Juice**: "la matemática puede ser aburrida mientras la retroalimentación no lo sea". | Análisis de diseño de Balatro |
| 11 | **Sin prestigio duro dentro del Capítulo 1.** La *sensación* de prestigio se logra con una reforja local (casco del barco) y con el Catdex como multiplicador permanente. El NG+ ("Marea Nueva") se abre después del final. | Nodebuster (prestigio por jefe sin pérdida), Paperclips (sin prestigio), Cookie Clicker (la colección alimenta la producción) |
| 12 | **Nada de muros de grind en la última hora.** El final debe subir en tensión y no pedir farmeo. | Crítica a Nodebuster: "los últimos 45 minutos se sintieron como una tarea" |

---

## 1. Análisis por juego

### 1.1 Panorama rápido

| Juego | Tipo | Duración típica | La idea que "robamos" para NOLC |
|---|---|---|---|
| Universal Paperclips | Incremental con final | 4–6 h (primeras partidas hasta 8–12 h) | 3 actos que se sienten como 3 juegos distintos; la UI vieja desaparece |
| A Dark Room | Incremental narrativo | 2–4 h | Cada mecánica nueva es también un pedazo del mundo |
| Candy Box! | Incremental de descubrimiento | Pocas horas | La curiosidad sobre la propia UI es una recompensa |
| Nodebuster | Incremental "arcade" corto | 3–4 h | Sesiones de combate cortas que alimentan un árbol permanente; prestigio por jefe sin pérdida |
| (the) Gnorp Apologue | Incremental estratégico con final | ~8–16 h | Unidades con personalidad trabajando a la vista; el mundo que "contraataca" |
| Cookie Clicker | Incremental clásico | Infinito | Logros → "leche" → multiplicador (colección = producción); galletas doradas |
| AdVenture Capitalist | Idle de negocios | Infinito | Managers (primera automatización), hitos de cantidad 25/50/100 |
| Antimatter Dimensions | Incremental de capas | Cientos de horas | Cada capa nueva cambia el significado de la anterior |
| Egg, Inc. | Idle móvil | Infinito | Cuellos de botella que rotan; "huevo nuevo" = salto de tier |
| Cell to Singularity | Idle educativo | Infinito | Cada compra cambia el mundo visible |
| Clicker Heroes | Idle de combate | Infinito | Jefe con cronómetro cada 5 zonas = chequeo de daño claro |
| Idle Slayer | Híbrido activo/idle | Infinito | Lo activo multiplica (Rage Mode) |
| Melvor Idle | Idle de RPG | Cientos de horas | Maestría en dos niveles (por objeto + pool) |
| Legends of IdleOn | Idle MMO | Cientos de horas | Sistemas nuevos que mejoran los viejos pero traen problemas nuevos |
| Increlution | Incremental de vidas | Decenas de horas | Cola de acciones = automatización con decisión |
| Unnamed Space Idle | Idle de combate espacial | Decenas de horas | Ritmo "siempre algo cerca"; anti-lección: módulos nuevos que arrancan como muro |
| The Tower | Idle de defensa | Meses | Mejoras dentro de la corrida + permanentes; anti-lección: labs de días |
| Balatro | Roguelike de sinergias | 30–60 min por corrida | Fichas × Mult; piso exponencial, techo abierto |
| Vampire Survivors | Survivor-like | 30 min por corrida | Evoluciones ocultas; fantasía de poder; "si está roto y divierte, se queda" |
| Brotato | Survivor-like | 20 oleadas (~20–30 min) | Tienda sesgada hacia tu build |
| Slay the Spire | Deckbuilder roguelike | ~1 h por corrida | Diseño guiado por métricas; acto secreto |
| Peglin | Pachinko roguelike | ~1 h por corrida | Daño = vertical (por golpe) × horizontal (cuántos golpes) |
| Loop Hero | Roguelike semi-idle | ~20–30 h | Tú fabricas tu propio peligro y decides cuándo aparece el jefe |
| Cult of the Lamb | Roguelike + gestión de base | ~15–25 h | Doble bucle: base ↔ incursiones |
| Hades | Roguelike de acción | 30–45 min por corrida | Morir trae historia; las Duo Boons aparecen solo si cumples requisitos |
| Rogue Legacy | Roguelite | ~15–20 h | El oro de cada corrida se gasta en mejoras permanentes; rasgos raros pagan más |
| Dragon City | Colección/gestión (base de NOLC) | Infinito | Hábitat → oro → comida → nivel; cría por elementos; orbes y estrellas |
| Monster Legends | Colección/gestión | Infinito | Anti-lección: demasiadas monedas; rareza = poder bruto |
| Pokémon | Colección/RPG | 20–40 h | Pokédex con estados (visto/capturado); tabla de tipos legible |
| Stardew Valley | Granja/vida | 50+ h | Colecciones (paquetes) que desbloquean infraestructura |
| Bloons TD 6 | Tower defense | Cientos de horas | Tier 5 que transforma; Paragon (fusión espectacular) |
| Dome Keeper | Roguelike minería + defensa | 30–90 min por corrida | Contraste calma ↔ tensión; mejoras visibles y audibles |
| Shapez / Factorio | Automatización | Decenas a cientos de horas | Hacer a mano antes de automatizar; los cuellos de botella se desplazan |

### 1.2 Grupo A — Incrementales con final (los modelos directos del Capítulo 1)

#### Universal Paperclips (Frank Lantz, 2017)
- **Loop:** fabricar clips → vender → ajustar precio y marketing → autoclippers → usar "operaciones" y "creatividad" (cómputo) para comprar **proyectos**.
- **Cómo escala:** de 1 clip por clic a billones por segundo. Después convierte toda la materia de la Tierra y al final el universo (≈3×10⁵⁵ clips). Tiene **tres etapas con juegos distintos**: empresa → gestión de energía y drones en la Tierra → exploración espacial con sondas autorreplicantes.
- **Prestigio:** no tiene durante la partida. El final te hace elegir (desmantelar todo o pasar a otro universo con un pequeño bono).
- **Desbloqueos:** los proyectos aparecen cuando se cumplen condiciones, y muchos **cambian reglas**: algoritmo de inversiones, torneos de teoría de juegos, computación cuántica activa, la "Confianza" humana como recurso.
- **Automatización:** autoclippers → megaclippers (×500) → fábricas y drones → sondas. Lo que costaba trabajo "hace 30 minutos" ya va solo.
- **Contra el aburrimiento:** cada etapa tira la interfaz anterior y vuelve irrelevantes los recursos viejos.
- **Qué lo hace adictivo:** la interfaz se revela poco a poco, la escala cambia (al estilo *Powers of Ten*), hay una narrativa implícita (eres la IA) y un final con decisión. No tiene microtransacciones y termina.
- **Lección para NOLC:** el Capítulo 1 debe contener **tres "juegos" que se sientan distintos** sobre el mismo núcleo: (1) isla-granja, (2) armada en regiones, (3) escala cósmica. Además, la UI debe "retirar" lo que ya se automatizó.

#### A Dark Room (Michael Townsend, 2013)
- **Loop:** avivar el fuego → leña → chozas y trampas → aldeanos asignados a trabajos → comercio → expediciones en un mapa ASCII → nave.
- **Cómo escala:** más en lo espacial que en lo numérico: un cuarto → una aldea → el mundo → el espacio.
- **Desbloqueos:** cada recurso aparece cuando tiene sentido narrativo. Según su autor, la comprensión del mundo crece *junto con* las mecánicas.
- **Automatización:** asignar aldeanos a oficios (automatizar también es decidir).
- **Contra el aburrimiento:** cambio de modo, de idle a exploración tipo roguelike con agua y comida limitadas.
- **Duración:** 2–4 h.
- **Lección para NOLC:** que cada mecánica nueva traiga un fragmento de lore. Las ruinas, el gato primordial y el "???" deben contar una historia sin cinemáticas largas: el jugador une las piezas.

#### Candy Box! (aniwey, 2013)
- **Loop:** 1 caramelo/s; puedes comerlos o tirarlos; aparecen un comerciante, una espada y misiones en ASCII.
- **Desbloqueos:** los botones aparecen después de ciertas acciones. Averiguar *cómo* activar lo siguiente es el juego.
- **Lección para NOLC:** la curiosidad sobre la UI es un recurso. Conviene incluir botones raros con respuestas humorísticas que encajen con el tono *"Cute cats. Terrible consequences."* (por ejemplo, acariciar a un gato 50 veces seguidas desbloquea algo).

#### Nodebuster (2024) — 3–4 h, ~97% de reseñas positivas en Steam
- **Loop:** una "sesión de brecha" con tiempo y vida limitados → destruyes nodos con el cursor → ganas *bits* → compras en un árbol de mejoras → otra sesión.
- **Cómo escala:** los enemigos de colores nuevos traen monedas nuevas (los azules dan *nodes*, los amarillos procesadores que aceleran la conversión). Cada jefe da un *core* y sube el nivel de prestigio: enemigos más duros y más recursos. Es **prestigio sin pérdida**.
- **Desbloqueos:** pestañas nuevas (hitos, minería cripto, laboratorio).
- **Automatización:** pasa de apuntar activamente a armas automáticas (drones, rayos en cadena, proyectiles) y queda casi idle al final.
- **Qué lo hace adictivo:** "todo relleno es asesino"; ritmo pulido; "dopamina pura hasta la meta".
- **Críticas útiles:** en los últimos ~45 min la pelea se volvió una tarea, los últimos 5 niveles no tenían riesgo y muchas mejoras no tenían retroalimentación visual.
- **Lección para NOLC:** batallas cortas que alimentan un árbol permanente es exactamente nuestro barco + isla. **Hay que evitar el final trivial con grind y las mejoras invisibles.** Toda mejora del barco debe verse.

#### (the) Gnorp Apologue (Myco, 2024) — ~8–16 h según la estrategia
- **Loop:** los gnorps rompen una roca, recogen fragmentos y los llevan al montón. Las estructuras (Express, Lab, Shrine…) desbloquean tipos de gnorp y efectos.
- **Cómo escala:** el montón se **comprime** para subir de tier (un prestigio interno). A medida que creces, **la roca contraataca**.
- **Estrategia:** algunas mejoras útiles al principio se vuelven perjudiciales después, así que el orden importa.
- **Lección para NOLC:** (1) unidades con personalidad trabajando *a la vista* (los gatos en la isla); (2) un mundo que reacciona a tu crecimiento (la "Armada" o el mar responde cuando tu isla crece); (3) mejoras que cambian de valor según el momento, lo que genera decisiones reales.

### 1.3 Grupo B — Incrementales "infinitos" (matemática, capas, automatización)

#### Cookie Clicker (Orteil, 2013)
- **Loop:** clic → edificios (generadores en tiers) → mejoras ×2 → galletas doradas.
- **Escala:** costo = base × **1.15ⁿ**. Cada tier cuesta ~×10 más. Las mejoras ×2 se desbloquean al tener 1, 5, 25, 50, 100… edificios.
- **Prestigio:** nivel = **∛(galletas totales / 10¹²)**, con +1% de CpS por nivel. Para duplicar el prestigio hay que hornear ~8× más.
- **Reglas que cambian:** la investigación despierta a las abuelas (*Grandmapocalypse*) y aparecen los *wrinklers*, que te roban galletas y luego te devuelven más. También hay minijuegos (jardín, bolsa, panteón, grimorio).
- **La colección alimenta la economía:** cada logro da 4% de "leche", y las mejoras "gatito" multiplican la producción según la leche. Coleccionar = producir.
- **Eventos:** Frenzy (×7 durante 77 s) y Click Frenzy (×777 al clic).
- **Lección para NOLC:** **el Catdex es nuestra "leche"**: cada gato descubierto sube un multiplicador global permanente. Las galletas doradas son nuestros microeventos (el pez dorado, el gato fugitivo), con una recompensa igual a un **porcentaje de la producción actual**.

#### AdVenture Capitalist (Hyper Hippo / Kongregate, 2014)
- **Loop:** negocios con un ciclo de tiempo → cobrar → comprar más.
- **Escala:** tasas de 1.07–1.15 según el negocio. Los hitos de 25/50/100/200… unidades duplican velocidad o ganancia, y tener "todos los negocios a 100" da un multiplicador global.
- **Automatización:** los **managers** son el primer gran alivio: ya no haces clic en cada negocio.
- **Prestigio:** ángeles = **150·√(ganancias de toda la vida / 10¹⁵)**, con +2% por ángel. Regla práctica: reiniciar cuando los ángeles pendientes ≥ los actuales.
- **Cambio de escala:** la Luna y Marte con reglas propias, más eventos temporales.
- **Lección para NOLC:** el manager es la automatización ideal de la primera hora: se compra con la moneda normal, se ve en pantalla y libera atención. Los hitos de cantidad (25/50/100) se traducen en **niveles de hábitat y de gato con umbrales**.

#### Antimatter Dimensions (Hevipelle, 2016–)
- **Loop:** 8 dimensiones; cada una **produce la anterior** (una cadena de derivadas).
- **Capas:** Dimension Boost (reset que abre la siguiente dimensión), Galaxias (velocidad del tick), **Infinity al llegar a 1.8e308** (el límite del número en JavaScript convertido en hito narrativo), Eternity, Reality y los Celestiales. Al final hay un *Automator* (scripting).
- **Clave:** "cada capa nueva cambia lo que significa la anterior, en vez de solo multiplicarla". Los desafíos cambian reglas.
- **Lección para NOLC:** **un "reset" o un límite puede ser una revelación**. El clímax del Cap. 1 puede literalmente "romper el contador" (ver §2.8: la notación pasa a "aa" y hace *glitch* hacia el Vacío).

#### Egg, Inc. (Auxbrain, 2016)
- **Loop:** gallinas → huevos → camiones.
- **Cuellos de botella que rotan:** espacio en los gallineros, capacidad de envío y ritmo de eclosión, con investigación para cada uno.
- **Reglas que cambian:** cada tipo de huevo nuevo vale mucho más (un "acto" nuevo).
- **Prestigio:** Soul Eggs (lineales) × Prophecy Eggs (exponenciales). Se calcula sobre la corrida actual: Δp ≈ (c/10⁶)^0.14, así que duplicar exige ~128× más.
- **Offline:** los silos limitan cuánto tiempo produces fuera del juego.
- **Lección para NOLC:** **rotar el cuello de botella** (oro → comida → materiales → orbes → poder de jefe) obliga a visitar sistemas distintos. "Huevo nuevo" equivale a "elemento nuevo".

#### Cell to Singularity (Computer Lunch, 2018)
- **Loop:** la evolución de la vida como árbol de generadores. Cada compra se ve en un mundo 3D y trae una carta de conocimiento real.
- **Meta:** Metabits y el *Reality Engine*. Hay un prestigio forzado en cierto punto, y simulaciones paralelas (Mesozoic Valley, Beyond) con su propio reset.
- **Lección para NOLC:** **cada compra debe cambiar algo visible en la isla**. Las simulaciones paralelas son como nuestras regiones o eventos con economía temporal propia.

#### Clicker Heroes (Playsaurus, 2014)
- **Loop:** zonas de monstruos y héroes que hacen DPS. Cada 5 zonas hay un **jefe con 30 s**; si fallas, retrocedes una zona.
- **Escala:** héroes a 1.07ⁿ; la vida de los jefes crece de forma exponencial, así que las paredes son claras.
- **Meta:** Hero Souls (+10% DPS cada una), Ancients y Transcendence.
- **Lección para NOLC:** el **jefe es un chequeo de daño comprensible**. Propuesta: minijefes cada ~15 min, jefes cada ~45–60 min, y **perder sirve para avanzar** (fragmentos y reducción de timers).

#### Idle Slayer (Pablo Leban, 2020)
- **Loop:** runner automático en el que saltas para recoger monedas y matar enemigos. Tiene Rage Mode (~×6 de almas), *bonus stages* activas, ascensión y divinidades.
- **Lección para NOLC:** en un híbrido activo/idle, **lo activo debe multiplicar**. Nuestro "Momentum" por jugar y las batallas son el *rage mode* de la economía.

#### Melvor Idle (Games by Malcs, 2019–)
- **Loop:** RuneScape destilado. Una habilidad activa a la vez. Maestría por objeto + un *pool* por habilidad con *checkpoints* de bonos.
- **Lección para NOLC:** maestría en dos niveles = **estrellas por gato + bonus por set elemental del Catdex**. Elegir "qué dejo corriendo" ya es una decisión.

#### Legends of IdleOn (LavaFlame2, 2020–)
- **Loop:** hasta 10 personajes con clases y oficios; cada mundo trae sistemas nuevos.
- **Principio clave:** cada sistema nuevo hace más eficientes los anteriores pero **introduce su propio problema de gestión**, y se **reutilizan** los sistemas viejos en vez de abandonarlos.
- **Riesgo:** sobrecarga de sistemas.
- **Lección para NOLC:** es la formulación probada de lo que la CHARLA describe ("el juego te quita tareas viejas y te da problemas nuevos").

#### Increlution (Gniller, 2021–)
- **Loop:** vidas cortas con una **cola de acciones**; al morir reencarnas con "instintos" (bonos).
- **Lección para NOLC:** la cola o planificador es automatización con decisión → "Cola de Resonancia" y *presets* de flota.

#### Unnamed Space Idle (2023–)
- **Loop:** una nave que combate sectores, con más de 10 sistemas (núcleos, Synth, *void shards*, tripulación…).
- Su ritmo se elogia ("siempre hay algo nuevo cerca"), pero hay quejas de tramos lentos y de **módulos nuevos que al desbloquearse se sienten como un muro**.
- **Lección para NOLC:** **luna de miel obligatoria** para cada sistema nuevo.

#### The Tower – Idle Tower Defense (2021–)
- **Loop:** corridas por oleadas (mejoras temporales con *cash*) + taller permanente (coins) + labs en tiempo real + cartas + armas definitivas.
- **Escala:** tiers de dificultad. Hay labs que duran **días o un mes**, con aceleradores comprables.
- **Lección para NOLC:** separar "lo que mejoras dentro de la batalla" de "lo permanente" encaja con nuestro barco. **Anti-lección:** timers de días y aceleración monetizada, justo lo que NOLC prohíbe.

### 1.4 Grupo C — Roguelikes de sinergia y meta-progresión

#### Balatro (LocalThunk, 2024)
- **Loop:** manos de póker contra "ciegas" (pequeña, grande y jefe) durante 8 *antes*. Entre ciegas hay tienda (comodines, cartas, planetas, vales).
- **Escala:** puntaje = **Fichas × Mult**. El objetivo va de **300 en el ante 1 a 100,000 en el jefe del ante 8** (stake base); los objetivos crecen ~×1.5–2 por ante y en el modo infinito se disparan.
- **Sinergias:** +Fichas y +Mult (aditivos) y **×Mult** (multiplicativo). El orden de izquierda a derecha importa, y hay comodines que copian a otros (Blueprint, Brainstorm).
- **Secretos:** las manos ocultas (Five of a Kind, Flush House, Flush Five) aparecen en la lista *solo cuando las juegas*.
- **Lo que dijo su creador:** el póker es casi solo una "capa" para que el jugador entre sin aprender reglas nuevas. Él lo describe como un solitario con jazz.
- **Lección para NOLC:** ver §5. En resumen: piso exponencial y techo abierto, efectos legibles y combinaciones emergentes.

#### Vampire Survivors (poncle, 2022)
- **Loop:** te mueves y las armas disparan solas. Las gemas de XP te suben de nivel cada pocos segundos al principio y eliges mejoras.
- **Evoluciones ocultas:** arma al máximo + pasivo específico + cofre = forma evolucionada. Las recetas no se explican, se descubren.
- **Final fijo:** a los 30:00 llega la Muerte. La corrida tiene un techo de tiempo, no una derrota "injusta".
- **Meta:** oro para mejoras permanentes; personajes y armas que se desbloquean con logros; un personaje absurdamente fuerte como premio por completar la colección.
- **Filosofía:** si algo parece roto y es divertido, se queda.
- **Lección para NOLC:** la fantasía de poder crece contra enemigos que también crecen, y el jugador "rompe" la corrida a mitad de camino y lo disfruta. **Las Resonancias "???" son nuestras evoluciones ocultas.**

#### Brotato (Blobfish, 2023)
- **Loop:** oleadas cortas (20 por corrida) → tienda con 4 ofertas **sesgadas por tu personaje, tu suerte y tus armas** → oleada.
- **Lección para NOLC:** que los planos y el loot de batalla se sesguen hacia los elementos de tu tripulación, para que la build se alimente sola.

#### Slay the Spire (Mega Crit, 2019)
- **Estructura:** 3 actos + un **acto 4 oculto** (requiere llaves), reliquias y ascensiones.
- **Diseño por métricas:** el equipo midió desde el prototipo con qué frecuencia se elige cada carta y con qué frecuencia aparece en mazos ganadores.
- **Lección para NOLC:** **telemetría desde el prototipo** (qué gatos, reliquias y módulos se eligen, y cuáles ganan). Un acto o jefe secreto premia a quien explora.

#### Peglin (Red Nexus, 2022)
- **Escalado:** daño = **vertical** (daño por peg) × **horizontal** (cuántos pegs golpeas). Las reliquias empujan uno u otro eje.
- **Lección para NOLC:** en artillería contra barcos también hay dos ejes: **daño por impacto × número de módulos afectados** (rebote, cadena, salpicadura, fuego que se propaga). Hay que diseñar reliquias y gatos para cada eje.

#### Loop Hero (Four Quarters, 2021)
- **Loop:** el héroe recorre solo un circuito. Tú colocas cartas (enemigos y terreno) que suben el peligro y el botín, y en el campamento construyes mejoras permanentes.
- **Clave:** **tú fabricas tu dificultad**, y el jefe aparece cuando has colocado suficientes cartas.
- **Lección para NOLC:** que los jefes sean "faros" que **el jugador activa cuando está listo**. Las únicas excepciones son los eventos rojos.

#### Hades (Supergiant, 2020)
- **Meta:** el Espejo de la Noche (reasignable), llaves y néctar. **La historia avanza cuando mueres**, con diálogos condicionados y ponderados.
- **Duo Boons:** solo aparecen si ya tienes bendiciones de dos dioses concretos. Son sinergias que se descubren de forma natural.
- **Lección para NOLC:** perder contra un jefe debe dar historia y progreso. **Las Resonancias duales (fuego + agua…) son nuestras Duo Boons.**

#### Rogue Legacy (Cellar Door, 2013)
- **Meta:** el oro de cada corrida se gasta en la mansión (cada compra encarece las demás) y el oro sobrante se pierde al entrar, lo que obliga a gastar. Los herederos tienen rasgos, y **los peores rasgos pagan más oro**.
- **Lección para NOLC:** rasgos de gato con riesgo y recompensa ("Impaciente", "Pirómano") que paguen más por ser incómodos.

### 1.5 Grupo D — Gestión, colección y automatización

#### Dragon City (Socialpoint, 2012) — base de NOLC
- **Loop:** los hábitats generan oro con **capacidad máxima** (te obliga a volver), las granjas producen comida, crías por elementos y eclosiones. Las estrellas se suben con orbes: 120/200/320/560/800, es decir **2,000 orbes para 5★**. Hay eventos como las carreras heroicas.
- **Timers:** la cría va de 15 s a más de 12 h, con aceleración pagada en gemas.
- **Lección para NOLC:** conservamos el triángulo hábitat → oro → comida → nivel → oro, pero con **timers de ≤45 min en el Cap. 1**, aceleración jugando y **la capacidad del hábitat convertida en una automatización desbloqueable** (no en una correa).

#### Monster Legends (Socialpoint, 2013)
- **Loop:** oro → comida → nivel → más oro; runas, *rank-up* y cría por elementos y rarezas. Según guías de jugadores, llevar un mítico a nivel 100 cuesta ~2M de comida (~50M de oro).
- **Críticas:** demasiadas monedas en el juego tardío y un meta dominado por los míticos.
- **Lección para NOLC:** **máximo 4–5 monedas** y **rareza ≠ poder bruto** (alineado con la CHARLA).

#### Pokémon (Game Freak)
- **Diseño:** la Pokédex distingue entre *visto* y *capturado* (dos estados de revelación). Tabla de tipos legible y evoluciones por nivel o condición.
- **Lección para NOLC:** un Catdex con estados (silueta → descubierto → dominado) y una tabla elemental simple, pero con **interacciones físicas** en batalla.

#### Cult of the Lamb (Massive Monster, 2022)
- **Doble bucle:** cruzadas roguelike ↔ aldea de seguidores. Los seguidores desbloquean armas y habilidades para llegar más lejos.
- Su reto declarado fue que ambos lados funcionaran en armonía, y lo guiaron con tres pilares de diseño.
- **Lección para NOLC:** **la isla nunca debe castigarte por irte a combatir** (en CotL la aldea sí se degrada: hambre, suciedad). En NOLC la isla produce mientras peleas.

#### Stardew Valley (ConcernedApe, 2016)
- **Ritmo:** el día es la unidad, con energía y estaciones. El **Centro Comunitario** tiene 6 áreas y ~23 paquetes (colecciones) que desbloquean infraestructura (puentes, invernadero, vagonetas).
- **Lección para NOLC:** **las colecciones del Catdex deben desbloquear partes del mundo** (expansiones, edificios), no solo gemas.

#### Bloons TD 6 (Ninja Kiwi, 2018)
- **Diseño:** 3 caminos × 5 tiers por torre. El tier 5 transforma la torre, y el **Paragon** fusiona tres tier 5 en una sola. El *Monkey Knowledge* da mejoras permanentes, algunas de las cuales cambian reglas fundamentales.
- **Lección para NOLC:** niveles de gato con **umbrales que transforman el ataque** (lvl 20 incendio, lvl 30 rompe módulos vecinos, lvl 40 posibilidad de meteorito). El Paragon es un modelo de espectáculo de fusión, quizá una "Resonancia Triple" en el Cap. 2.

#### Dome Keeper (Bippinbits, 2022)
- **Dos fases:** minar (calma, mil micro-decisiones) ↔ defender (tensión). Un temporizador de oleada obliga a medir la codicia.
- **Filosofía:** sus creadores buscan complejidad en el juego, no en las mecánicas. Las mejoras deben sentirse **poderosas de inmediato, distintas y visibles o audibles**, y el audio cambia por fase.
- **Lección para NOLC:** el contraste isla tranquila ↔ batalla explosiva se marca con **música, audio y ritmo distintos**, y cada mejora debe verse en el barco.

#### Shapez / Factorio
- **Progresión:** de lo manual a lo automatizado. Los hitos desbloquean edificios que amplían lo posible ("la fábrica debe crecer"), y los cuellos de botella se desplazan.
- **Lección para NOLC:** **primero el dolor, después el alivio**: haz que el jugador recoja oro a mano unas 10–20 veces antes de darle "Recolectar todo". La automatización tardía debe ser *diseñar* (presets, prioridades), no hacer clic.

---

## 2. Matemática de los incrementales

### 2.1 El subibaja fundamental
- **Costos exponenciales:** `costo_siguiente = costo_base × r^poseídos`, con r típica entre **1.07 y 1.15**.
- **Producción lineal o polinómica:** `producción = base × poseídos × multiplicadores`.
- Toda exponencial con base > 1 termina superando a cualquier polinomio. Por eso **el juego se frena solo** y no hacen falta muros artificiales.
- **Los multiplicadores** (×2 por hitos, mejoras, tiers nuevos) son los momentos en que la producción alcanza o rebasa al costo: las **rupturas**.

### 2.2 Fórmulas útiles (Pecorella / Kongregate)

```
Costo del siguiente:        C(k) = b · r^k
Costo de comprar n de golpe: C = b · r^k · (r^n − 1) / (r − 1)
Máximo que puedes pagar:     n_max = floor( log_r( c·(r−1) / (b·r^k) + 1 ) )
   (b = precio base, r = tasa, k = cuántos tienes, c = dinero actual)
Producción:                  P = p_base · k · Π(multiplicadores) · (1 + bono_prestigio)
Generadores en cadena (gen N produce gen N−1): con n niveles, la moneda crece ~ x^n / n!
   → se acerca a e^x pero sigue siendo más lenta que un costo exponencial puro.
```

**Regla de compra óptima** (para la IA de autocompra o para mostrar una sugerencia): conviene comprar la mejora si
`tiempo_para_pagarla + faltante / producción_nueva < faltante / producción_actual`.

### 2.3 Tasas típicas

| Juego | Tasa de costo r | Hitos |
|---|---|---|
| Cookie Clicker | 1.15 | ×2 al tener 1, 5, 25, 50, 100… |
| AdVenture Capitalist | 1.07–1.15 según el negocio | Velocidad ×2 en 25/50/100/200…; global con "todos a 100" |
| Clicker Heroes | 1.07 | Jefe cada 5 zonas |
| Regla psicofísica (Eric Guan) | Costo ×1.15 por nivel vs producción ×1.1 por mejora | Los cambios se perciben en proporción, no en suma (Weber-Fechner) |

Cuánto se multiplica el costo con r = 1.15: ×4 en 10 niveles, ×9.4 en 16, ×33 en 25 y ×1,084 en 50. **Cada ~16 niveles el costo sube un orden de magnitud.**

### 2.4 Por qué los costos *deben* superar a la producción en ciertos tramos
1. Si la producción gana siempre, compras todo al instante: no hay decisiones, los números pierden significado y te saltas el contenido.
2. El tramo de "sequía" crea **metas** ("ahorro para el hábitat de hielo") y hace que la siguiente ruptura se sienta como un logro.
3. El patrón sano es un **diente de sierra**:

```
abundancia (compras en ráfaga) → sequía suave (costo > producción) → RUPTURA (multiplicador / sistema nuevo) → abundancia…
```

4. **Una pared suave nunca es una pared dura.** Siempre hay al menos 2 caminos para romperla (mejorar la economía, subir gatos, una mejor build de batalla, un evento) y **jugar acorta la espera**.
5. Pecorella recomienda variar *cuál generador es el más rentable* a lo largo del tiempo mediante los hitos. Así el jugador rota su atención (en NOLC: hábitats de distintos elementos se vuelven "el mejor" en distintos momentos).

**Ejemplo con un hábitat de NOLC** (r = 1.15, producción lineal por nivel con ×2 en los niveles 10 y 25):

| Tramo | Producción | Costo | Sensación |
|---|---|---|---|
| Nivel 1 → 10 | ×10 (niveles) × 2 (hito) = **×20** | ×4 | Abundancia: "todo es barato" |
| Nivel 10 → 25 | ×2.5 × 2 = **×5** | ×8 | La sequía empieza |
| Nivel 25 → 50 | ×2 × 2 = **×4** | ×33 | Pared suave → hace falta un **tier nuevo** (hábitat de otro elemento, ×10 de base) |

### 2.5 Multiplicadores: de dónde salen las rupturas en NOLC

| Fuente | Tamaño | Frecuencia en el Cap. 1 |
|---|---|---|
| Hito de nivel de hábitat o gato (10/25/50) | ×2 | Cada pocos minutos |
| Tier nuevo de hábitat (elemento nuevo) | ×8–12 de producción base | 6 veces |
| Clase nueva de casco (reforja del barco) | ×4 al efecto de los módulos | 5 veces |
| Set elemental completo en el Catdex | ×1.5 global | 5–7 veces |
| Gato descubierto | +2% global (aditivo dentro de su capa) | 40–50 veces |
| Momentum por jugar | ×1 a ×3 temporal | Continuo |
| Eventos (marea de peces, sobrecarga) | ×4 a ×15 en una cosa, con penalización en otra | Cada 20–30 min |

### 2.6 Prestigio: fórmulas típicas y qué implican

| Juego | Fórmula | Base | Para duplicar el prestigio necesitas… |
|---|---|---|---|
| AdVenture Capitalist | p = 150·√(ganancia_vida/10¹⁵) | Toda la vida | 4× más |
| Realm Grinder | Raíz derivada de una suma triangular | Máximo | 4× más que la corrida anterior |
| Cookie Clicker | p = ∛(galletas_vida/10¹²) | Toda la vida | 8× más |
| Egg, Inc. | Δp = (c/10⁶)^0.14 | Corrida actual | ~128× más |
| Clicker Heroes | Excepción: usa log y almas de jefes | Corrida | — |

- **¿Por qué raíces y no logaritmos?** Las raíces dan saltos grandes (la escalera que engancha) y a la vez "domestican" el crecimiento para que el diseñador pueda balancear.
- **Toda la vida vs corrida actual:** con "toda la vida" (AdCap, Cookie) reiniciar siempre suma algo, aunque cada vez menos. Con "corrida actual" (Egg Inc, Clicker Heroes) cada corrida es independiente; sirve para limitar el progreso offline o para atravesar muros grandes.
- **Para NOLC (NG+ "Marea Nueva", después del final):** `Ecos = floor( √(oro_total_vida / 10¹⁰) )`, con +5% de producción por Eco. Si al terminar el Cap. 1 llevas ~10¹⁴ de oro total, son ~100 Ecos = ×6, y la segunda partida dura ~2–3 h en vez de 6. Duplicar los Ecos exige 4× más oro.

### 2.7 Recompensas activas indexadas a la producción
Para que jugar nunca sea irrelevante, **toda recompensa activa se calcula como tiempo de producción**:

```
Victoria normal       = 60–120 s × oro/s actual   (+ materiales que la isla no produce)
Victoria perfecta     = ×1.5
Minijefe / jefe       = 5 / 15 min de oro/s       (+ elemento, planos, gemas)
Pez dorado (micro)    = 30–60 s de oro/s          (o 5–10 min de comida)
"Toque" manual        = 1 + 5% de oro/s           → minuto 0: 1 oro; ~5 h: ~50M  ✔ ("tap = 50 millones")
Overkill en batalla   = bono de botín = 1 + 0.25·log10(daño_total / HP_objetivo)
                        (1,000× de overkill → +75%: romper la build paga, pero acotado)
```

### 2.8 Notación de números grandes

| Sistema | Ejemplo | Pros | Contras |
|---|---|---|---|
| Sufijos cortos K, M, B, T | 12.4M, 3.1B | Familiar, emocional | En español, "B" (mil millones) se confunde con "billón" (10¹²) |
| Letras aa, ab, ac… | 1.0aa = 10¹⁵ | Infinita, no requiere matemáticas | Abstracta y menos emocional |
| Científica | 1.24e15 | Precisa | Fría; solo para jugadores expertos |
| Ingeniería | 124e12 | Múltiplos de 1000 | Rara fuera del nicho |

**Recomendación para NOLC:**
- Usar **K, M, B, T** con 3 cifras significativas (`12.4M`), un *tooltip* con el número completo y aclaración regional ("B = mil millones").
- **Diseñar el Cap. 1 para que el juego normal termine en el rango B–T**, y que **solo en el clímax** el contador cruce 10¹⁵ y muestre por primera vez **"1.00aa"** y luego haga *glitch* a "???". Es un momento de "rompí el número" al estilo Infinity de Antimatter Dimensions, ligado al Vacío. Las letras quedan para los capítulos siguientes.
- Dar a cada orden de magnitud un **color o efecto** (blanco → verde → azul → morado → dorado → en llamas), como el puntaje que arde en Balatro.

### 2.9 Cómo lograr que "antes 10,000 era una fortuna"
1. **Mostrar precios aspiracionales desde el principio:** las expansiones bloqueadas con su precio a la vista (15K, 600K, 40M…). Lo "imposible" queda grabado.
2. **No retirar lo viejo de la tienda:** los objetos del inicio siguen ahí, ahora a 0.0001% de tu oro, con botón ×100/MAX.
3. **Cosechas que evolucionan:** Sardinas → Salmón imperial → Banquete del Leviatán → *Nebula Tuna ×3.7M*. La comida cuenta la historia de la escala.
4. **Revancha contra el primer enemigo:** cerca del final vuelve el "Bote de las Ratas" (50 HP) y lo borras con 10⁹ de daño en una animación ridícula, como hace Vampire Survivors con los enemigos tempranos.
5. **Recapitulación en el final:** "Tu primer hábitat costó 50 de oro. Tu último, 120B. Tu primer gato lanzaba bolas de pelo."
6. **Botones de compra ×10 / ×100 / MAX** que aparecen poco a poco: comprar 100 niveles de golpe es "sentir" la escala.
7. **Tipografía y feedback que escalan** con la magnitud (números más grandes, más partículas, sonido que sube de tono).

### 2.10 El tiempo como deuda que se paga jugando
- **Fórmula proporcional** (escala sola con timers largos o cortos): `cada victoria reduce max(30 s, 10% del tiempo restante)` de los procesos del tipo asociado. Victoria perfecta = 20%; jefe = 50%; evento completado = 25%.
- **Aceleradores dirigidos** (para que no sea monótono, como propone la CHARLA): las batallas aceleran la construcción, usar gatos de ciertos elementos acelera las Resonancias de esos elementos, los minijuegos dan fertilizante a las granjas y los descubrimientos aceleran la investigación.
- **Momentum:** `M = 1 + 0.25 × racha` (máximo ×3). Decae 0.25 cada 2 min sin combatir y nunca baja de ×1, así que no castiga al que se va.
- **Offline:** 100% de oro y comida hasta 4 h; los timers corren normal. **Los jefes y elementos requieren jugar**, para que el arco narrativo no se pueda "dormir".

---

## 3. Mecánicas que cambian las reglas y cómo se descubre lo oculto

### 3.1 Tipos de "cambio de reglas" (más allá del +%)

| Tipo | Ejemplo en referencias | Equivalente en NOLC |
|---|---|---|
| **Verbo nuevo** | Paperclips: lanzar sondas; A Dark Room: explorar el mapa | La batalla (min 3), la Resonancia (min 8), las expediciones, el "Asalto rápido" |
| **Estado o interacción nueva** | Mejoras de cartas en Balatro; curses en Hades | Mojado, Ardiendo, Congelado→Quebradizo, Escudo, Ingravidez, Posesión |
| **Restricción o recurso nuevo** | Paperclips: energía en la etapa 2; Egg Inc: capacidad de envío | Escudos mágicos (el Arcanista), slots de gatos trabajadores, munición única ("1 bala por batalla") |
| **Inversión de reglas** | Wrinklers (te roban, pero devuelven más); mejoras de Gnorp que se vuelven malas | "Sobrecarga volcánica" (×3 fuego, −50% comida); Gato Vengeance (más fuerte cuando mueren aliados) |
| **Cambio de capa o escala** | Infinity en Antimatter; etapa espacial de Paperclips | Cósmico: de archipiélago a cielo; el contador que "rompe" a "aa" |
| **Automatización que convierte una tarea en decisión** | Managers de AdCap; cola de Increlution; Automator de AD | Gatos trabajadores (¿barco o economía?), presets del Almirantazgo |
| **Fusión o síntesis** | Evoluciones de Vampire Survivors; Paragon de BTD6; Duo Boons de Hades | Resonancia, mutaciones heredadas, Resonancias duales ocultas |
| **Narrativa como progreso** | Hades: morir trae diálogo | Perder contra un jefe revela lore y fragmentos del "???" |

**Regla de diseño:** cada **elemento nuevo** debe aportar a la vez (1) un **estado o interacción física** nuevo en batalla, (2) un **hábitat o tier económico** nuevo y (3) **Resonancias nuevas** en el Catdex. Si un elemento solo aporta stats, no merece llegar.

### 3.2 La escalera de revelación (de "nada" a "dominado")

| Estado | Qué ve el jugador | Ejemplo NOLC |
|---|---|---|
| 0. Oculto | Nada (o un detalle raro del escenario) | Una grieta en una roca de la isla inicial |
| 1. Rumor | Una pista textual o visual | "Los pescadores hablan de un barco que brilla de noche" |
| 2. "???" | Silueta o hueco con probabilidad o condición parcial | Catdex: `??? — Posibles padres: 🌌 + ? — 1%` |
| 3. Descubierto | Nombre, arte y mecánica | "¡NUEVO ELEMENTO: MAGIA! Nueva mecánica: ESCUDOS. 17 Resonancias nuevas" |
| 4. Dominado | Set completo o maestría, con bono | "Set Arcano completo: ×1.5 de oro; los escudos rebotan 10% del daño" |

**Reglas:**
- **Siempre debe haber algo visible pero bloqueado** (silueta, precio, candado). La UI que crece (Paperclips, A Dark Room, Candy Box) avisa de que hay más.
- **Todo "???" necesita una pista** para no caer en la frustración del RNG ciego de Dragon City.
- **Nada esencial depende de una probabilidad < 5%.** Usar un *pity timer*: garantizado tras N intentos. Lo raro y opcional (por ejemplo, el elemento Espíritu por la vía secreta) puede ser difícil.
- **Los secretos opcionales dan identidad, no poder obligatorio.** Cookie Clicker tiene "logros sombra" que no suben producción.
- **Las sinergias se registran cuando ocurren por primera vez:** "¡SINERGIA DESCUBIERTA: CONDUCCIÓN!" queda guardada en un *Grimorio de Sinergias*, igual que las manos secretas de Balatro aparecen solo al jugarlas.

---

## 4. Cómo los juegos de 4–8 h con final construyen un arco completo

### 4.1 Comparativa

| Juego | Actos | Cambio de escala | Revelación | Clímax | Final y gancho |
|---|---|---|---|---|---|
| Universal Paperclips | 3 (empresa → Tierra → universo) | Clips → planeta → materia del universo | Eres la IA que traiciona a sus creadores | Guerra contra los Drifters | Una elección moral + "otro universo" |
| A Dark Room | 3–4 (cuarto → aldea → mundo → nave) | Espacio físico | Quién eres realmente y qué haces con los locales | La huida en la nave | El final que recontextualiza todo |
| Candy Box! | Abierto por descubrimiento | Caramelos → aventura | La UI esconde un RPG | Misiones finales | El humor como recompensa |
| Nodebuster | Por jefes / niveles de prestigio | Monedas y pestañas nuevas | El juego "rompe la realidad" | Los últimos jefes | Fin claro, en una sesión |
| Gnorp Apologue | Por compresiones / tiers del montón | Montón → tiers | La roca se defiende | Tier final | Fin claro y rejugable por estrategia |

### 4.2 El patrón común
1. **Minuto 0:** el mundo más pequeño posible y un solo verbo.
2. **Cada acto añade un verbo y cambia la escala,** y lo del acto anterior se automatiza o pasa a segundo plano.
3. **Hay una revelación a mitad del juego** que cambia lo que creías que era el juego.
4. **El ritmo de novedades se acelera hacia el final** (más rápido, más grande, más ridículo), pero **sin grind**.
5. **El clímax exige todo lo aprendido:** cada mecánica enseñada aparece en el jefe final.
6. **El final cierra una pregunta y abre otra.** Para NOLC: "¿qué es el Vacío?".

### 4.3 Errores a evitar (de las críticas)
- Un final trivial: enemigos sin riesgo y grind de moneda para ver el desenlace (Nodebuster).
- Mejoras sin feedback visible (Nodebuster).
- Sistemas nuevos que arrancan como muro (Unnamed Space Idle).
- Demasiadas monedas (Monster Legends).
- Timers que crecen a horas o días (Dragon City, The Tower): en un capítulo de un día rompen el arco.

---

## 5. Sinergias estilo Balatro / Vampire Survivors: "romper el juego" sin romperlo

### 5.1 La matemática del "¡lo rompí!"
- Balatro: `Puntaje = Fichas × Mult`. Los aditivos (+Fichas, +Mult) crecen de forma lineal; los **×Mult** se *multiplican entre sí* (×3 · ×3 · ×3 = ×27). Por eso las corridas llegan a 10⁸–10¹⁰ mientras el objetivo del ante 8 es 10⁵.
- El orden importa: primero se suma y al final se multiplica. El jugador que lo entiende se siente genio.
- **Piso exponencial, techo abierto:** el objetivo crece ~×1.5–2 por ante. Tienes que encontrar sinergias para sobrevivir, pero una vez que las encuentras nada te impide pasarte por mucho.
- **"Romper" vs "destruir":** romper = encontrar un combo y sentirte listo. Destruir = trivializar todo sin esfuerzo para siempre. Balatro permite lo primero porque el piso siempre sube.

### 5.2 Fórmula de daño propuesta para las batallas de barcos

```
Daño por impacto = (Base del ataque + Σ aditivos de módulos/rasgos)
                   × (1 + Σ %Mult elemental y de estrellas)
                   × Π (×Mult de estados, reliquias y ultimates)        ← raro, poderoso
Daño total       = Daño por impacto (vertical) × módulos afectados (horizontal: rebote, cadena, salpicadura, propagación)
```

En pantalla se ve la cuenta animada como en Balatro: `48 × 6.5 × 3 = 936 💥`, y los números suben con sonido ascendente.

### 5.3 Combos elementales (estados que se combinan)

| Estado A | + Acción B | Sinergia | Efecto | Eje |
|---|---|---|---|---|
| 💧 Mojado | ⚡ Rayo | **Conducción** | El rayo salta a todos los módulos mojados adyacentes | Horizontal |
| ❄️ Congelado | 🪨 Impacto físico | **Estallido** | ×3 de daño estructural; el módulo se vuelve Quebradizo | Vertical |
| 🔥 Ardiendo | 🌱 Madera/Planta | **Incendio** | El fuego se propaga cada turno | Horizontal en el tiempo |
| 🔥 Ardiendo | 💧 Agua | **Vapor** | Nube que reduce la precisión enemiga | Control |
| ✨ Escudo enemigo | ⚡ Rayo | **Sobrecarga** | Rompe el escudo y aturde al gato que lo sostiene | Anti-defensa |
| 🌌 Ingravidez | 🪨 Roca | **Meteorito** | Las rocas caen desde arriba a ×2 de velocidad | Vertical |
| 👻 Posesión | Módulo destruido | **Eco** | El cañón enemigo destruido dispara una vez contra su propio barco | Inversión |

### 5.4 Cómo dejar que se sienta roto sin romper el juego (10 reglas)
1. **Los objetivos (vida de los jefes) crecen ~×1.8–2.5 por tier.** Sin sinergias no pasas; con ellas, te pasas por mucho.
2. **El overkill se convierte con log10** en bonus de botín. Romper paga, pero de forma acotada (ver §2.7).
3. **Los ×Mult son raros:** como máximo uno por gato, y sobre todo en reliquias, legendarios y ultimates. Los +Mult y +Base son comunes.
4. **El poder fuerte tiene condiciones o costos:** "una vez por batalla", "2 turnos de carga" (el Singularity Cat, que hace gritar "¡MATEN A ESE YA!"), "necesita que mueran aliados" (Vengeance), "pierde precisión con cada escudo" (Bastion).
5. **Las ventanas temporales rotas son eventos** (Sobrecarga volcánica: ×3 fuego durante 10 min a cambio de −50% de comida).
6. **El poder de batalla no se convierte 1:1 en poder económico.** El botín se indexa a la producción (§2.7). Una build absurda te da más *rápido*, pero no rompe la curva de oro.
7. **Efectos de una línea**, legibles. La profundidad sale de combinar 3 o más cosas (Balatro).
8. **Los comunes también sostienen builds:** el Cannon Cat preciso y constante puede ganar contra un mítico mal usado (CHARLA: rareza ≠ poder).
9. **Tienda y loot sesgados hacia tu build** (Brotato), para que la sinergia se alimente sola.
10. **Las sinergias se descubren, no se leen en un manual.** Se registran en el Grimorio con un *flash* de pantalla la primera vez (las evoluciones de Vampire Survivors, las Duo Boons de Hades).

### 5.5 Sinergias económicas (para la isla)
- **Gatos de rol económico** (Banquero +25% de oro en su hábitat; Granjero +40% de comida; Constructor −10% de tiempo; Viajero +materiales). **Problema nuevo:** si trabaja en la isla, no va al barco.
- **Afinidad de hábitat:** los gatos en su hábitat nativo producen ×1.25; en un hábitat "santuario" pueden mutar (por ejemplo, la variante 🔥 *Scorched*).
- **Vecindad:** granjas de 🌱 junto a hábitats de 💧 dan +comida (y abren una mini-decisión de layout).

### 5.6 Checklist de *juice*
- Contadores que suben con sonido de tono ascendente.
- Números flotantes cuyo tamaño escala con la magnitud y colores por orden de magnitud.
- *Hit-stop* (congelar 50–80 ms) en golpes críticos.
- Temblor de cámara proporcional al daño estructural.
- Partículas y "pedazos" del barco que caen al agua.
- La cuenta `Base × Mult × xMult` animada en golpes grandes, con la opción de saltarla.
- La Resonancia con revelación por capas: silueta → elementos → estrellas → nombre → mutación. Es el "NOOOO" de la CHARLA.

---

## 6. BLUEPRINT DE PACING — Capítulo 1 "The First Sea"

### 6.1 Supuestos
- Duración objetivo: **~6 h** para un jugador activo-medio. Un jugador muy activo y eficiente termina en ~4 h; uno relajado o con pausas, en ~8 h. Terminar *solo* en idle debería tomar más de 12 h (lo activo vale ~2×).
- Reparto de valor: ~60–70% activo (batallas, eventos, decisiones) y ~30–40% pasivo (isla).
- Cuatro monedas núcleo + una rara:
  - **Oro** (isla).
  - **Comida** (granjas).
  - **Materiales de batalla** (Chatarra + Cristales por elemento + Planos).
  - **Orbes** (por gato).
  - **Gemas** (raras, siempre ganadas jugando).
  - La "Energía de Resonancia" no es una moneda; es la reducción automática de tiempo.

### 6.2 Curva maestra (escala de números esperada)

| Momento | Oro/s | "Toque" (1+5% oro/s) | Compra típica (~1–2 min de producción) | Victoria (60–120 s de oro/s) | Escalón que ocurre aquí |
|---|---|---|---|---|---|
| 0:00 | 2 | 1 | 10–50 | — | — |
| 0:05 | 10 | 2 | 100–300 | 150 | Primera batalla |
| 0:15 | 80 | 5 | 1K–3K | 3K | 🪨 Tierra en camino |
| 0:30 | 700 | 35 | 30K–80K | 40K | Casco Balandra (×4) |
| 1:00 | 10K | 500 | 0.6M–1.2M | 0.8M | ⚡ Rayo + Fragata |
| 1:30 | 60K | 3K | 4M–8M | 5M | ❄️ Hielo (tier ×10) |
| 2:00 | 300K | 15K | 20M–40M | 30M | Galeón |
| 3:00 | 6M | 300K | 0.4B–0.8B | 0.5B | ✨ Magia + 🌋 Volcán |
| 4:00 | 100M | 5M | 6B–12B | 10B | Acorazado + 👻 |
| 5:00 | 1B | **50M** ✔ | 60B–120B | 100B | 🌌 Cósmico + Nave Celestial |
| 5:45 | 5B | 250M | Núcleo Celestial ≈ 1T | — | Jefe final |
| Clímax | ×1000 temporal → 5T/s | 250B | — | — | El contador cruza 10¹⁵ → "1.00aa" → *glitch* "???" |

**Velocidad en décadas por hora:** 0–1 h ≈ 3.7 · 1–2 h ≈ 1.5 · 2–3 h ≈ 1.3 · 3–4 h ≈ 1.2 · 4–5 h ≈ 1.0 · clímax: +3 en minutos.

El ritmo logarítmico se frena un poco dentro de cada acto (es inevitable y sano). La sensación de aceleración se mantiene porque **cada acto empieza con un escalón** (tier nuevo ×10, casco ×4, set del Catdex ×1.5) y porque **cada vez haces más cosas por minuto**.

```
log10(oro/s)
 12 |                                                        ▲ clímax ×1000 (→ "aa")
  9 |                                              ┌──────┘
  8 |                                        ┌────┘
  7 |                                   ┌───┘
  6 |                             ┌────┘
  5 |                        ┌───┘
  4 |                  ┌────┘
  3 |            ┌────┘
  2 |       ┌───┘
  1 |   ┌──┘
  0 |──┘
    +----+----+-----+------+------+------+------+------+------
    0   5m  15m   30m    1h    1.5h    2h     3h     4h    5h  6h
    (cada "┐" = escalón: elemento / casco / set del Catdex / jefe)
```

### 6.3 Línea de tiempo por tramos

#### Tramo 1 · 0–5 min — "Esto es lindo… ¡¿y eso qué fue?!"

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | Isla mínima: 1 hábitat de 🔥, 1 granja, el muelle con un "Bote" patético, 3 gatos (🔥 Canelo, 💧 Levi, 🌱 Mochi). La misión-tutorial "Algo huele a pescado". |
| **Elementos** | 🔥 💧 🌱 conocidos. Silueta de una 4.ª "?" bloqueada en el Catdex. |
| **Automatización** | Ninguna. El oro se recoge a mano tocando el hábitat (1 por toque, más la producción de ~2/s). |
| **Números** | 0 → ~10 oro/s. Precios de 10–300. Granja: sardinas de 30 s. |
| **Evento / jefe** | ~min 3: **primera batalla** (no se puede perder) contra el "Bote de las Ratas". Primer BOOM de física. |
| **Emoción** | Ternura → sorpresa por el contraste (cute → anime destructivo). |
| **Cadencia** | Algo nuevo cada 45–90 s; nunca más de 30 s sin una decisión. |

#### Tramo 2 · 5–15 min — "Entiendo el loop"

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | Alimentar gatos (los niveles 1→5 vuelan), segundo hábitat (💧), **Santuario de Resonancia** (primera Resonancia de **60 s**: "Mochi y Levi se fueron a invocar otro gatito…"), las primeras mejoras de módulo del barco (cañón y casco), orbes del gato (primer ★). |
| **Elementos** | Aparece el **rumor** de 🪨 ("los mapas marcan ruinas en el bosque costero"). |
| **Automatización** | ~min 8–10: **"Recolectar todo"** (después de ~15 recolecciones manuales). |
| **Números** | 10 → 80 oro/s. Precios 300–3K. Expansión "Bosque costero" visible: **2.5K**. Las expansiones lejanas también se ven: 60K · 1.5M · 40M… |
| **Evento / jefe** | ~min 7: microevento **Pez dorado** (+60 s de oro). ~min 12: **minijefe "Capitán Rata"**. |
| **Emoción** | Competencia ("lo estoy haciendo bien") + anticipación (la Resonancia). |
| **Cadencia** | Algo nuevo cada 1–2 min. La primera Resonancia termina justo al salir de una batalla, y el jugador aprende sin texto que **jugar acelera**. |

#### Tramo 3 · 15–30 min — "Hay más de lo que parece"

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | **Expansión 1: Bosque costero** (~min 18) → bajo unas rocas, un santuario → batalla contra el "Gólem del Bosque" → **🪨 TIERRA** (min ~20). Hábitat de Tierra (primer tier ×10). Granja nivel 2 (Salmón, 2 min). Compra ×10. Primeras estrellas de gato con un efecto nuevo (Canelo ★2: la bola de pelo deja fuego). |
| **Elementos** | 🪨 **Tierra** → regla nueva: **penetración** (atraviesa pisos y rompe soportes; los gatos enemigos caen). 6 Resonancias nuevas. |
| **Automatización** | ~min 18: **la granja repite la receta**. Ya no hay que replantar. |
| **Números** | 80 → 700 oro/s. Precios 3K–80K. Victoria ≈ 40K. |
| **Evento / jefe** | ~min 25: flash event **"Tormenta en el horizonte"** (8 min): aparecen barcos con chispas que sueltan 3 fragmentos de ⚡ "???". ~min 28: **minijefe "Contramaestre Ratón"** → **casco Balandra** (primera reforja: los módulos vuelven a nivel 1 con ×4 y los recuperas en ~1–2 min). |
| **Emoción** | Descubrimiento + la primera pared suave superada. |
| **Cadencia** | Algo nuevo cada 2–4 min. Primer **cuello de botella: la comida** (los gatos quieren subir). |

#### Tramo 4 · 30–60 min — "Soy un genio (rompí algo)"

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | **Expansión 2: Acantilado** (60K, ~min 40), el taller de módulos (armas, escudo básico) y materiales de batalla (Chatarra) para mejoras de barco. **Primer jefe: "Almirante Tormenta"** (~min 50–55), que se activa como un faro cuando el jugador quiere. Victoria → **⚡ RAYO** → la primera **sinergia descubierta: CONDUCCIÓN (💧 Mojado + ⚡)** con *flash*: "¡SINERGIA DESCUBIERTA!". **Casco Fragata** (~min 60). Primer set del Catdex (🔥 3/3) → ×1.5. |
| **Elementos** | ⚡ **Rayo** → regla nueva: **estado Mojado y conducción en cadena** (eje horizontal del daño). |
| **Automatización** | ~min 35: comprar y alimentar ×10. ~min 50: **depósito automático del hábitat** ("Banco Gatuno"): se acaba el problema de la capacidad máxima. |
| **Números** | 700 → 10K oro/s. Precios 80K–1.2M. Toque ≈ 500. "Hace una hora 100 de oro era mucho." |
| **Evento / jefe** | Microeventos cada 4–6 min (Gato fugitivo, Comerciante). Jefe 1 al cierre. |
| **Emoción** | Maestría inicial + **la primera "rotura"** (una cadena de rayo que barre medio barco). |
| **Cadencia** | Algo nuevo cada 3–5 min. **Cuello de botella: materiales** (combatir importa). |

#### Tramo 5 · 1–2 h — "Mi isla crece sola"

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | **Expansión 3: Isla Congelada** (1.5M, ~1:15) → guardián "Morsa Glaciar" → **❄️ HIELO** (~1:20). Hábitat de hielo (tier ×10). Comida especial (Kril helado, 10 min). ~1:40: flash event **"Bandera Negra"** (completa 5 encuentros en 20 min) → **barco alternativo "The Marauder"** (poca defensa, muchas armas, +40% de piezas). Ya puedes elegir **barco según la misión**. Estrellas ★3 con transformaciones de ataque (lvl 20: incendio). ~2:00: **casco Galeón**. |
| **Elementos** | ❄️ **Hielo** → regla nueva: **Congelado → Quebradizo** (×3 al siguiente impacto físico: ESTALLIDO). Primer guiño de lore sobre el gato primordial Ignis. |
| **Automatización** | ~1:10: **"Asalto rápido"**: los barcos ya derrotados se resuelven en 1 clic si tu poder es ≥3× el suyo (se acaba la repetición). ~1:30: **cola de Resonancia (2 slots) + eclosión automática** + botón **MAX**. ~2:00: **"Chef gatuno"** (alimentación automática hasta un nivel objetivo). |
| **Números** | 10K → 300K oro/s. Precios 1M–40M. "Bosque costero: 2.5K" ya da risa. |
| **Evento / jefe** | Minijefes de región cada ~15 min. Pez dorado y Gato fugitivo siguen, con premios indexados a la producción. |
| **Emoción** | Expansión y escala + **alivio** ("me quitó lo aburrido") + planificación de builds. |
| **Cadencia** | Algo nuevo cada 6–10 min. **Cuello de botella: orbes y estrellas** (y espacio en hábitats). |

#### Tramo 6 · 2–4 h — "¡¿QUÉ PUTAS?!" (revelación del mediojuego)

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | ~2:15: **Jefe 2: "THE ARCANIST"**. Su gato levanta **el primer escudo mágico del juego** (CLANK). Al derrotarlo: **✨ MAGIA + mecánica ESCUDOS** para ambos bandos + hábitat arcano + **17 Resonancias nuevas** + **1.er fragmento del Vacío (1/10)**. **Expansión 4: Ruinas Arcanas** (40M). ~2:30: **gatos trabajadores**. ~2:45–3:15: **Carrera Heroica** (evento grande de 30 min: 6 vueltas de tareas mixtas) → primer **gato Mítico**. ~3:05: **Expansión 5: Volcán** (0.8B) + evento **"Sobrecarga Volcánica"** (×3 fuego, −50% comida durante 10 min). ~3:15: flash event **"Marea Fantasma"** (barcos destruidos regresan como fantasmas) → **👻 ESPÍRITU** (o por la vía secreta: el "Santuario Gatuno Antiguo" en las Ruinas, para quien explora). ~3:50: **Jefe 3: "Kraken de Magma"** → **casco Acorazado Arcano**. |
| **Elementos** | ✨ **Magia** (escudos: una capa nueva de defensa y la sinergia Sobrecarga con ⚡) y 👻 **Espíritu** (semisecreto: segunda vida, daño interno a través de paredes, Posesión). |
| **Automatización** | ~3:15: **expediciones automáticas** (una flota secundaria farmea materiales). El juego ya no pide recoger, plantar ni alimentar: pide **decidir** (¿qué gato trabaja y cuál pelea?). |
| **Números** | 300K → 100M oro/s. Precios 40M–12B. Toque ≈ 5M. |
| **Evento / jefe** | 2 jefes, 1 evento heroico y 2 flash events. "Vacío" 1/10 → 3/10. |
| **Emoción** | **Asombro** (un pedazo nuevo del juego se abre), **codicia sana** (eventos en rojo), identidad de build ("mi barco de hielo y rayo"). |
| **Cadencia** | Algo nuevo cada 8–12 min, con revelaciones grandes cada 30–45. **Cuello de botella: conocimiento** (sinergias y escudos) y **slots de gatos** (economía vs barco). |

#### Tramo 7 · 4–6 h — "Soy un dios… y algo viene"

| Aspecto | Contenido |
|---|---|
| **Se desbloquea** | ~4:15: **"Grieta Cósmica"** (8 min, en rojo): enemigos cósmicos sueltan polvo; 100 de polvo → **🌌 CÓSMICO** + Cosmic Kitten. **Expansión 6: Isla Cósmica** (20B): "los gatos pescan organismos espaciales". ~4:45: evento heroico opcional **"Lluvia de Estrellas"** → **cañón Starbreaker** (1 disparo por batalla que atraviesa el casco). ~5:00: **casco Nave Celestial**. ~5:15: **"UN BARCO DEL VACÍO HA ENTRADO EN TU MUNDO"** (14:59 en rojo). No se puede ganar; se gana haciendo daño → Vacío 7/10 y rumores del final. ~5:30: **revancha contra el "Bote de las Ratas"** (lo borras con 10⁹ de daño: nostalgia). Mercado final: el **Núcleo Celestial** (≈1T). |
| **Elementos** | 🌌 **Cósmico** → regla nueva: **gravedad** (trayectorias curvas, atraer piezas, Meteorito con 🪨). 7 elementos jugables. |
| **Automatización** | ~4:00: **"Almirantazgo"**: presets tácticos para batallas no-jefe (tú defines prioridades y la flota pelea). ~5:00: **"Piloto de Mareas"** (los microeventos se reclaman solos). Solo quedan jefes, eventos rojos y decisiones de build. |
| **Números** | 100M → 5B oro/s. Precios 12B–1T. **Toque ≈ 50M** ✔. Comida: *Nebula Tuna ×3.7M*. |
| **Evento / jefe** | Grieta Cósmica, Lluvia de Estrellas, Barco del Vacío y la preparación del final. |
| **Emoción** | Poder desmesurado + nostalgia + **tensión preclímax** (el mar empieza a subir en el fondo de la isla). |
| **Cadencia** | Revelaciones cada 15–20 min y micro-recompensas continuas. **Sin grind**: cada paso de esta hora es nuevo. |

#### Tramo 8 · Final (~5:45–6:15) — "LA MAREA"

| Fase | Contenido |
|---|---|
| **Jefe final: "El Primer Mar"** (3 fases, ~10–15 min) | **Fase 1:** escudos arcanos en capas (exige Sobrecarga ⚡). **Fase 2:** casco de hielo vivo (exige Congelar → Estallido y Conducción en el mar mojado). **Fase 3:** el boss altera la gravedad y "se traga" módulos; entran todos tus gatos, cada uno con su ultimate una vez. El clímax usa **todo** lo enseñado. |
| **Victoria** | **"Marea Final"**: toda la producción ×1000 durante 3 min mientras ves la isla entera trabajar. El contador cruza 10¹⁵ y aparece por primera vez **"1.00aa"**, que luego hace *glitch* a **"???"**. Vacío 10/10. |
| **Cinemática** | El mar se eleva, el cielo se abre. **UNKNOWN ELEMENT DETECTED.** Una silueta 🕳️. Pantalla negra. **CONTINUARÁ.** |
| **Recapitulación** | "Tu primer hábitat costó 50 de oro. Tu último, 120B. Tu primer gato lanzaba bolas de pelo. Hoy uno borra medio barco." Estadísticas del día. |
| **Post-capítulo** | Se abren **"Marea Nueva" (NG+ con Ecos, §2.6)**, la caza de los "???" del Catdex, el Grimorio de Sinergias incompleto y un modo infinito "Mar Abierto" (jefes con escala ×2 por nivel). Son las razones para seguir mientras sale el Cap. 2. |
| **Emoción** | Catarsis → épica → **intriga**. |

### 6.4 Cadencias (reglas de ritmo para el GDD)

| Regla | Valor objetivo |
|---|---|
| Algo nuevo (función, gato, módulo, zona) | 0–15 min: cada 1–2 min · 15–60 min: cada 3–5 min · 1–4 h: cada 6–12 min · 4–6 h: revelaciones cada 15–20 min |
| Tiempo máximo sin una compra posible | 0–1 h: ≤1 min · 1–4 h: ≤3 min · 4–6 h: ≤4 min (con recompensas activas que lo acortan) |
| "Golpe" (minijefe, flash event o descubrimiento) | Cada ~15 min |
| "Acto" (jefe, elemento o casco nuevo) | Cada 45–60 min |
| Microeventos (pez dorado, gato fugitivo, comerciante) | Cada 3–6 min, 30 s–3 min de duración |
| Flash events (rojos) | Cada 20–40 min, 5–20 min de duración |
| Eventos heroicos | 2 en el capítulo (uno obligatorio-ligero y uno opcional) |
| Duración de batalla | Normal: 1–3 min · minijefe: 3–5 · jefe: 5–8 · final: 10–15 |
| **Los 4 horizontes siempre visibles** | (1) algo que puedes comprar **ahora**, (2) algo que termina en **<2 min**, (3) una meta a **10–20 min**, (4) un **misterio** lejano ("???") |
| Luna de miel de cada sistema nuevo | Primeros 3–5 niveles en <2 min |
| Automatización | Llega después de que el jugador hizo la tarea a mano unas 10–20 veces, y **cada automatización viene con un problema nuevo** |

### 6.5 Timers: nominal vs efectivo jugando

| Sistema | Inicio | Medio | Final del Cap. 1 | Efectivo jugando activamente |
|---|---|---|---|---|
| Cultivo | 30 s | 2–10 min | 15–20 min (Banquete) | ~30–50% del nominal |
| Resonancia | 60 s | 5–15 min | 30 min (máximo) | 5–10 min |
| Construcción / mejora | 10 s | 1–5 min | 20 min | 3–5 min |
| Expedición | — | 5–15 min | 30 min | Paralela (no bloquea) |
| Reparación de barco | Instantánea | 1–2 min | 5 min | Casi 0 si ganas |

**Regla dura:** **ningún timer nominal del Cap. 1 supera 45 min**, y nada obliga a cerrar el juego. *(En Dragon City los timers llegan a 12 h o más; aquí la escala de tiempo de un día no lo permite.)*

### 6.6 Las 4 capas de progresión

| Capa | Qué sube | Monedas | ¿Se reinicia? | Ritmo | Sensación |
|---|---|---|---|---|---|
| **1. Gato** (micro) | Nivel (comida) con umbrales cada 10 niveles que **transforman el ataque**; estrellas (orbes) que suben ingreso e intensidad del efecto; rasgos y mutaciones heredadas | Comida, orbes | No | Cada 1–5 min | "Mi gato aprendió algo nuevo" |
| **2. Barco** (combate) | Módulos (cañón, casco, escudo, mástil, núcleo, salas), armas especiales, **clase de casco** (Bote → Balandra → Fragata → Galeón → Acorazado Arcano → Nave Celestial), barcos alternativos (Marauder) | Oro + materiales + planos | **Reforja local**: al subir de clase, los módulos vuelven a nivel 1 con ×4 de efecto y luna de miel (se recuperan en 1–2 min) | Clase nueva cada ~45–60 min | "Mi barco es una bestia" + mini-prestigio sin dolor |
| **3. Isla** (economía) | Hábitats (tiers por elemento), granjas, edificios, **7 expansiones** con secretos, automatizaciones | Oro, comida | No | Expansión cada 30–50 min | "Mi imperio trabaja solo" |
| **4. Leyenda / cuenta** (meta) | **Catdex** (+2% por gato, ×1.5 por set), elementos, Grimorio de Sinergias, reliquias, gemas; después del final, **Ecos** (NG+) | Descubrimientos, gemas, Ecos | Solo en el NG+ opcional | Por hitos | "Sé más y valgo más" |

**Interacción entre capas:** el gato (nivel) → más oro en la isla **y** un mejor ataque en el barco. El barco gana → materiales y fragmentos → elementos → Resonancias → gatos nuevos (Catdex) → multiplicador de la isla. La isla produce oro → módulos del barco y expansiones → secretos y elementos. **Cada capa alimenta a otra** (como pide la CHARLA y como funcionan Dome Keeper y Cult of the Lamb).

**Cuellos de botella que rotan** (Egg Inc): oro (0–15 min) → comida (15–30) → materiales de combate (30–60) → orbes y espacio (1–2 h) → conocimiento y sinergias, y slots de gatos (2–4 h) → poder para el jefe final, todo junto (4–6 h).

### 6.7 ¿Conviene un prestigio dentro de un capítulo de un día?

**Recomendación: NO hacer un prestigio duro (reinicio de isla) dentro del Cap. 1. SÍ dar la *sensación* de prestigio de tres formas.**

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| Prestigio duro a mitad de capítulo (reiniciar la isla) | Escalera clásica de idle | En un arco de 6 h se siente como relleno; rompe la narrativa y el apego a la isla; Paperclips, A Dark Room y Candy Box no lo usan | ❌ |
| Prestigio narrativo forzado (un tsunami borra la isla) | Dramático | Castiga la inversión emocional; riesgo alto de que el jugador lo abandone | ❌ (quizás como gancho de un capítulo futuro) |
| **Reforja de casco** (reset local con ×4 y luna de miel) | "Antes tardé 20 min en llegar a nivel 10 del cañón; ahora 1 min". Sin pérdida real | Hay que balancear el ×4 | ✅ |
| **Catdex como "leche"** (multiplicador permanente por colección) | La colección = producción; motiva la Resonancia | Hay que acotarlo (aditivo dentro de su capa) | ✅ |
| **Prestigio por jefe sin pérdida** (como Nodebuster: cada jefe sube la dificultad *y* los rendimientos) | Escalones claros | — | ✅ (implícito en los escalones de región) |
| **NG+ "Marea Nueva"** después del final (Ecos = √(oro_vida/10¹⁰)) | Rejugabilidad mientras llega el Cap. 2; segunda partida en 2–3 h | — | ✅ post-capítulo |

### 6.8 Métricas para playtest (telemetría desde el prototipo, como Slay the Spire)

| Hito | Objetivo (mediana) | Alarma si… |
|---|---|---|
| Primera batalla | ≤4 min | >6 min |
| Primera Resonancia terminada | ≤12 min | >15 min |
| Primer elemento nuevo (🪨) | ~20 min | >30 min |
| Primera automatización ("Recolectar todo") | 8–10 min | >15 min |
| Jefe 1 | 50–60 min | >75 min |
| The Arcanist | ~2:15 | >3:00 |
| Jefe final | 5:45–6:30 | >8:00 o <3:30 |
| Tiempo sin comprar nada | <3 min el 95% del tiempo | Rachas >5 min |
| % del oro que viene de lo activo | 60–70% | <40% (jugar no vale) o >85% (la isla no importa) |
| Tasa de elección y de victoria por gato, módulo y reliquia | Distribución amplia | Un solo meta dominante |
| Abandono por tramo | Curva suave | Un pico en un tramo = una pared mal hecha |

### 6.9 Riesgos principales y mitigaciones
1. **Sobrecarga de sistemas** (riesgo de IdleOn): introducir un sistema por vez, cada uno con su misión-tutorial, y retirar o automatizar el anterior.
2. **Una build rota que trivializa todo:** objetivos con escala exponencial + overkill convertido con log + botín indexado a la producción.
3. **Que el jugador idle "duerma" el arco:** jefes y elementos requieren jugar; el offline está topado a 4 h.
4. **RNG frustrante en las Resonancias:** probabilidades visibles, *pity timer* y "???" con pistas.
5. **Un final con grind:** la última hora debe ser 100% contenido nuevo, y el Núcleo Celestial debe costar como máximo ~3–4 min de producción a 5B/s.
6. **Mejoras invisibles:** cada mejora del barco cambia su sprite, su sonido o su proyectil.

---

## 7. Fuentes

**Matemática y diseño de idle/incrementales**
- Anthony Pecorella — *The Math of Idle Games, Part I*: https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i · https://www.kongregate.com/en/pages/the-math-of-idle-games-part-i
- *The Math of Idle Games, Part II* (derivadas): https://www.gamedeveloper.com/game-platforms/the-math-of-idle-games-part-ii
- *The Math of Idle Games, Part III* (prestigio): https://www.kongregate.com/en/pages/the-math-of-idle-games-part-iii
- *Quest for Progress* (GDC Europe 2016): https://www.kongregate.com/en/pages/quest-for-progress-the-math-of-idle-games · https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf
- Eric Guan — *Idle Game Design Principles*: https://ericguan.substack.com/p/idle-game-design-principles
- Compilación de fórmulas (IdleFramework): https://github.com/ac2522/IdleFramework/blob/main/IDLE_GAME_MECHANICS_RESEARCH.md
- Alharthi et al. — *Playing to Wait: A Taxonomy of Idle Games* (CHI 2018): https://dl.acm.org/doi/10.1145/3173574.3174195
- Notación "aa": https://gram.gs/gramlog/formatting-big-numbers-aa-notation/
- Wikipedia — Incremental game: https://en.wikipedia.org/wiki/Incremental_game

**Incrementales con final**
- Universal Paperclips: https://en.wikipedia.org/wiki/Universal_Paperclips · https://if50.substack.com/p/2017-universal-paperclips · https://www.backlogmag.com/universal-paperclips-and-the-endgame/ · https://universalpaperclips.fandom.com/wiki/Release_the_HypnoDrones · https://universalpaperclips.fandom.com/wiki/MegaClippers
- A Dark Room: https://www.gamedeveloper.com/design/-i-a-dark-room-i-s-unique-journey-from-the-web-to-ios · https://en.wikipedia.org/wiki/A_Dark_Room · https://gamefaqs.gamespot.com/iphone/738591-a-dark-room/answers/1-how-long-does-it-take-to-beat-this-game
- Candy Box!: https://en.wikipedia.org/wiki/Candy_Box! · https://www.pcgamer.com/candy-box-1/
- Nodebuster: https://store.steampowered.com/app/3107330/Nodebuster/ · https://mancunion.com/2025/05/08/nodebuster-review-a-short-and-sweet-incremental-game/ · https://blog.lauramichet.com/played-nodebuster/ · https://www.incrementaldb.com/community/review/2367
- (the) Gnorp Apologue: https://gnorp.dev/ · https://shapes.inc/fandom/the-gnorp-apologue/structures-and-upgrades · https://www.incrementaldb.com/community/review/5047

**Incrementales infinitos**
- Cookie Clicker: https://dinogame.gg/blog/how-cookie-clicker-progression-works/ · https://cookieclicker.wiki.gg/wiki/Milk · https://www.pocketgamer.com/cookie-clicker/heavenly-chips-guide/
- AdVenture Capitalist: https://steamcommunity.com/sharedfiles/filedetails/?id=445227074
- Antimatter Dimensions: https://playwanderer.online/game-reviews/antimatter-dimensions · https://antimatter-dimensions.fandom.com/wiki/Guide
- Egg, Inc.: https://jzr.uz/blog/egg-inc-mystical-eggs-math · https://egginc.miraheze.org/wiki/Prestige · https://egg-inc.fandom.com/wiki/Grain_Silos
- Cell to Singularity: https://en.wikipedia.org/wiki/Cell_to_Singularity
- Clicker Heroes: https://blog.clickerheroes.com/clicker-heroes-players-guide-strategy/ · https://clickerheroes.fandom.com/wiki/Zones
- Idle Slayer: https://idleslayer.fandom.com/wiki/Ascension_Tree_Tier_List
- Melvor Idle: https://wiki.melvoridle.com/w/Mastery
- Legends of IdleOn: https://arestless.rest/blog/thoughts-on-legends-of-idleon/
- Increlution: https://store.steampowered.com/app/1593350/Increlution/ · https://playwanderer.online/game-reviews/increlution
- Unnamed Space Idle: https://rankith.itch.io/unnamed-space-idle-prototype · https://steamcommunity.com/app/2471100/discussions/0/802345631536523500/
- The Tower: https://the-tower-idle-tower-defense.fandom.com/wiki/Laboratory
- Kittens Game (topes de almacenamiento): https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/KittensGame

**Roguelikes de sinergia y meta-progresión**
- Balatro: https://ejaw.net/balatro/ · https://balatrowiki.org/w/Blinds_and_Antes · https://dood.gg/en/balatro/guides/scoring-guide/ · https://toucharcade.com/2024/03/18/balatro-interview-mobile-port-localthunk-dlc-plans-updates-new-jokers-demo-feedback/ · https://www.shacknews.com/article/139116/balatro-inspiration-luck-be-a-landlord-reddit-ama
- Vampire Survivors: https://rogueliker.com/vampire-survivors-review/ · https://tvtropes.org/pmwiki/pmwiki.php/GameBreaker/VampireSurvivors · https://vampire-survivors.fandom.com/wiki/The_Reaper
- Brotato: https://brotato.wiki.spellsandguns.com/Waves · https://www.maingamers.com/games/brotato/posts/brotato-beginner-waves-shop
- Slay the Spire: https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder · https://www.gdcvault.com/play/1025731/-Slay-the-Spire-Metrics
- Peglin: https://steamcommunity.com/sharedfiles/filedetails/?id=2801458462
- Loop Hero: https://en.wikipedia.org/wiki/Loop_Hero · https://game-wisdom.com/analysis/loop-hero
- Hades: https://www.gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death · https://www.thegamer.com/hades-mirror-of-night-roguelite-progression/
- Rogue Legacy: https://en.wikipedia.org/wiki/Rogue_Legacy · https://game-wisdom.com/analysis/rogue-legacy-genealogical-rogue-like

**Gestión, colección y automatización**
- Dragon City: https://dragoncity.fandom.com/wiki/Breeding/Overview · https://dragoncity.fandom.com/wiki/Habitat_capacity · https://dragoncity.fandom.com/wiki/Tree_of_Life/Empower
- Monster Legends: https://monsterlegends.fandom.com/wiki/User_blog:Thesot/New_Player's_Guide · https://monsterlegends.fandom.com/wiki/Runes
- Pokémon: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex
- Cult of the Lamb: https://gameworldobserver.com/2022/08/12/cult-of-the-lamb-interview-massive-monster
- Stardew Valley: https://www.thegamer.com/stardew-valley-community-center-guide/
- Bloons TD 6: https://www.bloonswiki.com/Paragon · https://www.bloonswiki.com/Monkey_Knowledge_(BTD6)
- Dome Keeper: https://www.gamedeveloper.com/business/how-dome-keeper-focuses-on-systems-that-feed-into-one-another
- Factorio / Shapez: https://en.wikipedia.org/wiki/Factorio · https://shapez.io/

*Nota:* las duraciones son rangos reportados por reseñas y jugadores (varían mucho según el estilo de juego). Los números del Blueprint son **objetivos de diseño iniciales para el prototipo** y deben calibrarse con playtests.
