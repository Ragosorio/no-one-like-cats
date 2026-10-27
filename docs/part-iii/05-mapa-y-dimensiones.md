# 05 · El segundo mapa y las cinco dimensiones

Las marcas [DUEÑO], [CANON], [PROPUESTA] y [ABIERTO] significan lo mismo que en `02`.

**Datos de base:**
- `investigacion/sistemas.md` §1: el mapa de la Parte I, con capturas en el scratch de la sesión.
- `investigacion/sistemas.md` §2: economía medida con el código real.
- `investigacion/sistemas.md` §4: perillas de combate.

**Lo que el dueño decidió:**
- Cinco dimensiones (Borracha, Superhéroes, Anime, Libros y POP) en un **segundo mapa 2D**, con regiones, rutas, niveles normales, encuentros y jefes, con la lógica del mapa de la Parte I.
- **Nada de islas 3D explorables nuevas.** El 3D solo se usa en animaciones donde aporte.
- Se desbloquean con **dinero del juego + avance narrativo**.
- **La captura de referencia que mencionaba el brief no llegó adjunta.** Se usó el mapa real de la Parte I, capturado por el agente SISTEMAS: `mapa-parte1-lategame-carta-completa-sin-hud.png`.

---

## 1. La Carta de las Cajas

### 1.1 Qué es

El mapa de la Parte I es el **Diario del Mar**: una carta náutica grabada, en papel de periódico (`MapScene.ts`). El segundo mapa es **la carta que dibuja Luzterna**, a mano, en su cuaderno de farera, a medida que siguen las huellas de REGISTRO 000 [PROPUESTA].

| Rasgo | Diario del Mar (Parte I) | Carta de las Cajas (Parte III) |
|---|---|---|
| Soporte | Periódico grabado | Hojas de cuaderno cosidas, con manchas de cera de vela |
| Quién la hizo | El Diario | **Luzterna, con su letra**; después de H93, tu letra (`08` §5.2) |
| Regiones | 6 zonas, islas | 5 **cajas abiertas** dibujadas en perspectiva, cada una en su estilo (la Borracha como un televisor viejo, Superhéroes como una página de cómic…) |
| Rutas entre regiones | Carril punteado | **Rasgaduras** del papel con huellitas de gato encima |
| Centro | — | **Tu isla y tu faro.** El haz del faro barre la carta; después de H93 se apaga y queda la luz naranja de Canelo |
| Niebla | Nubes y «???» | Hojas **en blanco** con una huella y una nota de ella: «aquí no he llegado» |
| Notas | Cintas con el nombre del jefe | Notas al margen de Luzterna: chistes, advertencias, flechas («NO entres al baño… ok, sí entra») |

### 1.2 Disposición

- Las cinco cajas forman un **anillo** alrededor de tu isla. El rastro de Cerito va de caja en caja (Borracha → Superhéroes → Anime → Libros → POP) y la última rasgadura **vuelve a tu isla**: el Final.
- Se ve en el mapa que todo el viaje fue una vuelta para regresar a casa.
- Mismas reglas de cámara que el Diario del Mar: arrastrar, zoom con rueda y el botón CARTA para alternar entre vista general y acercamiento (`MapScene.ts:345-391`).

### 1.3 Gramática de cada región (la lógica de la Parte I, más dos cosas)

| Elemento | Como en la Parte I | Nuevo en la Parte III |
|---|---|---|
| **9 etapas** en línea | Sí: 1–4 normales, **5 élite**, 6–8 normales, **9 jefe** (`stageKind`) | — |
| Desbloqueo | Lineal dentro de la región | Igual |
| **Encargos** | Chinchetas con restricción y premio único | 2 por dimensión, con restricciones de su estilo |
| **Desvío** | — | Una **ruta lateral** de 3 nodos que sale de la etapa 3 o de la 6. **Está oculta** hasta que la actividad de la dimensión la revela. Lleva a un rescate o a un secreto |
| **Encuentros** | — | Íconos que **se mueven** por la región (Disruptores, villanos sueltos, avistamientos de Titiritero). Aparecen por avance de la historia, nunca por reloj, y se quedan hasta que los vences. En el post-juego rotan con una semilla de la partida |
| **Actividad** | — | Un nodo especial por dimensión (§4–8) |
| Repetir | ×0.7, Asalto Rápido y Simulacro | Igual. Además, los niveles repetidos dan **orbes de Multidimensional** de esa caja (`06` §1.4) |

**Sin estrellas por etapa:** no existían en la Parte I y no se agregan. La victoria perfecta sigue valiendo ×1.5.

### 1.4 Las 9 etapas son un punto de partida, no un molde [DUEÑO]

Cada dimensión toma **la forma que le pide su historia y su actividad**. No se rellenan nodos para llegar a nueve.

| Dimensión | Forma propuesta | Por qué |
|---|---|---|
| Borracha | **Ruta corta** de 5 hasta la élite + 3 hasta el jefe; La Ronda como bucle aparte | Es la de aprender; la noche es un recorrido de bar en bar |
| Superhéroes | **Página de cómic:** viñetas en orden de lectura y Patrulla como llamados que aparecen en viñetas nuevas | La forma del cómic |
| Anime | **Llave de torneo** (preliminares, cuartos, semi, final) + 3 islas de entrenamiento libres | Un torneo no es una línea |
| Libros | **Estante no lineal:** eliges el orden de los cuentos; el índice se abre con 3 finales devueltos | Se explora leyendo |
| POP | **Gira con lista de canciones:** las fechas se juegan en el orden que eliges | Es una gira, no una ruta |

**La gramática visual de la Parte I** (nodo, ruta, élite, jefe, frontera, barquito) **se mantiene en todas**, para que el jugador la reconozca.

---

## 2. Qué habilita la historia y qué paga el jugador

### 2.1 Tres llaves para cada dimensión

| Llave | Quién la da | Ejemplo |
|---|---|---|
| **Historia** | La misión que revela la rasgadura | Superhéroes se abre con H73 (el Cadenero) |
| **Huellas de 000** (material nuevo) | 3 por cada etapa ganada por primera vez + 10 por el jefe ≈ 34 por dimensión. **Solo** se ganan en la dimensión anterior. La siguiente pide **25** | Es el rastro literal de Cerito: con 25 huellas, Luzterna puede dibujar dónde sigue |
| **Oro** | **Maneki**, la conserje que tiene llaves (canon b54: «Alguien barría las cajas. Y tiene llaves»). Cobra por abrir cada gatera: «La escoba no se paga sola» | Es el sumidero de oro con un personaje y un motivo del canon |

**Por qué así:**
- **El oro no puede frenar al veterano.** La partida del dueño guarda 7.4 h de ingreso (`sistemas.md` §2.3).
- **El candado real es la historia y las huellas**, que solo se ganan jugando. Es el mismo papel que cumplen hoy los cristales en los tiers 9 y 10.
- **El nuevo nunca farmea:** cada precio cabe en el ingreso pasivo que junta mientras juega la dimensión anterior.

### 2.2 Precios [PROPUESTA, con la fórmula del Kit de Vuelo]

`precio = max(piso, incomePerSec() / mareaMult() × segundos)`. Se divide entre `mareaMult()` para que la Marea Final no cobre ×1000 (`sistemas.md` §2.5).

| # | Dimensión | Segundos de ingreso | Piso | (a) 17 M/s (acaba de terminar H65) | (b) 88 M/s (veterana) | (c) 0.9 B/s (muy avanzada) |
|---|---|---|---|---|---|---|
| 1 | Borracha | 900 (15 min) | 4.5 B | 15 B | 80 B | 0.8 T |
| 2 | Superhéroes | 1 800 (30 min) | 9 B | 31 B | 160 B | 1.6 T |
| 3 | Anime | 2 700 (45 min) | 13.5 B | 46 B | 240 B | 2.4 T |
| 4 | Libros | 3 600 (60 min) | 18 B | 61 B | 320 B | 3.2 T |
| 5 | POP | 4 500 (75 min) | 22.5 B | 77 B | 400 B | 4 T |

**Cómo se siente en cada perfil:**
- **Partida nueva (a):** al cerrar la Borracha (~1 h 45 min de juego) ya juntó más de 46 B de ingreso pasivo: le alcanza para Superhéroes y casi para Anime.
- **Veterana (b):** paga sin mirar. La espera la ponen la historia y las huellas.
- **Muy pobre** (menos de 5 M/s): paga el piso. Si a 1 M/s tarda 6 h en POP, es señal de que le falta isla, no de que el precio esté roto.

**Gastos propios de cada dimensión**, para que el oro siga importando en partidas ricas [PROPUESTA]: decoraciones de la caja para tu isla (una por dimensión, en la TIENDA) con el estilo de esa dimensión y un hábitat de dimensión que cuesta lo mismo que un tier 8. No dan poder: dan vida en la isla (conductas de los gatos).

**Hace falta una fixture nueva, `h65-normal`** (~17 M/s), para probar todo esto. Las fixtures actuales no representan a nadie (`sistemas.md` §2.3).

---

## 3. Combate por dimensión: una regla cada una

Principio de la Parte II, ahora con disciplina: **una regla nueva por dimensión, y reusando perillas** (`sistemas.md` §4).

| Dimensión | Regla | Qué hace | Costo | Perillas |
|---|---|---|---|---|
| Borracha | **Mareo** | La guía de trayectoria se balancea (seno, con semilla) y los tiros salen con un desvío chico, determinista y visible en la estimación. Sillas que vuelan como escombro | Bajo-medio | `cataclysm` (escombro), una variable de puntería |
| Superhéroes | **Onomatopeya** | Cada golpe fuerte deja un bloque de letras sólido («¡KRAK!») que sirve de cobertura 2 turnos | Medio | Módulos temporales (como los islotes de `cielo`) |
| Anime | **Poder** | Bajo el 50 % de vida, cada gato carga aura una vez (+25 % de daño, de un solo uso) | Bajo | Efecto de FASES por lado |
| Libros | **Capítulos** | La batalla se divide en capítulos de 3 turnos y cada uno trae una regla escrita (lluvia, calma, raíz) | Bajo | `fases` + `wetAll` / `calm` / `regrow` |
| POP | **Ritmo** | La SINCRO de la Parte II abierta a cualquier par del mismo elemento, en el beat | Medio | `sincro.ts` (hoy un solo combo) |

**Dificultad.** Con el EP fijo de la Parte I, una escalera fija no le sirve a todos los perfiles. La Parte II escaló con tu poder (`sistemas.md` §4). Propuesta mixta:
- **etapas normales:** poder enemigo con `powerMul` 0.85–1.05 sobre tu flota y un piso de 3 000;
- **élites y jefes:** con las bandas de `storyScale` (`jefe` y `final`);
- la estimación sigue siendo la misma simulación.

---

## 4. Dimensión Borracha · «La Última Ronda»

| Aspecto | Diseño |
|---|---|
| **Motivo narrativo** | Ahí está el bar donde se escondió Canelo, y ahí empieza el rastro de Cerito. Es la primera caja que se rompe: **la mañana no reinicia** |
| **Identidad visual** | Caricatura de TV de los 90, propia (`06` §3): ámbar cerveza, rosa dona, verde botella y azul noche. **De noche** es caricatura a todo color; **la mañana de resaca** es cine mudo en blanco y negro, con intertítulos, porque «la luz duele y el sonido también» |
| **Identidad sonora** | De noche, variaciones del bar de «Drunck» y cama de taberna (vasos, murmullo, rocola). De mañana, solo el piano del cine mudo y ningún efecto de sonido. Canciones del dueño en `07` |
| **Actividad: «La Ronda»** | Recorrido por 4 locales (La Última Ronda, la Donería, el Hipo-Mart y el karaoke). En cada local hay una batalla corta con una condición de bar: «sin derramar» (no perder módulos de cubierta), «la última y nos vamos» (ganar en 3 turnos)… Al terminar las 4, la caja **reinicia**. Al hacerlo, revela el **desvío** y se repite con otra combinación de condiciones (semilla) |
| **Espacio para explorar** | Tres calles con nodos ocultos detrás de puertas: la trastienda, la azotea y el estacionamiento. El cartel «SE BUSCA: CANELO · DEBE 14 RONDAS» lleva a un secreto |
| **Niveles** | B-1 «Hipo-Mart» (tutorial de Mareo) · B-2 «La Donería» · B-3 «Callejón de las botellas» → desvío «Trastienda» · B-4 «Karaoke» (los gatos enemigos cantan: su ulti tarda 1 turno más) · **B-5 élite «Oficial Dona»** (policía de la caja; regla: cada vez que comes una dona, se cura) · B-6 «Planta embotelladora» (cataclismo de botellas) · B-7 «El parque de la resaca» (mañana en B/N) · B-8 «La fila del baño» · **B-9 jefe «El Cadenero»** |
| **Encuentros** | Disruptores grafiteando (desde H71) · borrachos que te retan a duelo de puntería · Borrón en la Donería (siempre, sin pelea: es su casa) |
| **Gatos** | Hipólito (se une en H73) · Doña Espuma · Borrón · El Cadenero · Oficial Dona (capitán de élite; especie existente con lente) |
| **Conflicto y consecuencia** | La caja vivía sin consecuencias, y ahora se acuerda de todo. Los vecinos se avergüenzan de las noches que ya no se borran. **Consecuencia visible:** el grafiti de los Disruptores se queda; los locales reparados con la Ronda quedan arreglados |
| **Relación con la trama** | El bar del prólogo; Borrón cuenta el precio de encarnar; aquí se rompe la primera frontera. **El epílogo vuelve aquí** (`08` §5.1) |
| **Razones para volver** | La Ronda con condiciones nuevas · orbes de Hipólito · los encuentros del post-juego · Borrón · el bar del epílogo (el vaso roto se queda en el piso para siempre) |

## 5. Dimensión Superhéroes · «Ciudad Mayúscula»

| Aspecto | Diseño |
|---|---|
| **Motivo narrativo** | Las huellas de Cerito cruzaron a una ciudad de cómic. La linterna de Luzterna proyecta una **Gato-señal** en las nubes y los héroes la toman por un llamado |
| **Identidad visual** | Cómic de los 60 a los 90, propio: tinta de peso variable, cuatricromía plana, negros en bloque; Ben-Day y desregistro en shader. La región del mapa se dibuja como **una página de cómic** con viñetas: cada etapa es una viñeta |
| **Identidad sonora** | Metales de serie de acción, sirenas lejanas, golpes con onomatopeya hechos sonido. Canción del dueño en `07` |
| **Actividad: «Patrulla»** | Cuando la Gato-señal se enciende (por avance, no por reloj), aparecen 3 llamados en el mapa: un rescate, un villano suelto y un periodista en problemas. Cada uno es una batalla con objetivo distinto: proteger un barco civil (grado de daño), derrotar al villano y sacar la foto (ganar sin perder un módulo marcado) |
| **Espacio para explorar** | Azoteas conectadas (nodos ocultos que solo se ven después de patrullar) y la redacción de *El Clarín Viñeta* (secreto) |
| **Niveles** | S-1 «La señal» (tutorial de Onomatopeya) · S-2 «Barrio bajo» · S-3 «Muelle industrial» → desvío «Alcantarilla» · S-4 «El puente» · **S-5 élite «La Pandilla del Ovillo»** · S-6 «Rescate en la azotea» (**Spidercat se une**) · S-7 «Laboratorio» · S-8 «La torre de *El Clarín*» · **S-9 jefe «Cruceta»** |
| **Encuentros** | Villanos sueltos (desde H75) · Disruptores liberando celdas · Cruceta vigilando (no se puede pelear con él hasta S-9) |
| **Gatos** | Batcat · Spidercat · Cruceta · el director de *El Clarín* (personaje con especie existente) |
| **Conflicto y consecuencia** | La ciudad culpa a todos los forasteros. **Consecuencia visible:** los titulares del periódico cambian según lo que hagas («¿FORASTEROS O VILLANOS?» → «LOS FORASTEROS SALVAN EL PUENTE»). El villano suelto que no detienes aparece en la siguiente patrulla |
| **Relación con la trama** | Primera vez que se ve que un Titiritero sangra tinta; aparece la rareza Multidimensional; Batcat siembra «los gatos ven en la oscuridad» |
| **Razones para volver** | Patrulla (se renueva por avance y, en el post-juego, con una semilla) · orbes de Batcat y Spidercat · titulares coleccionables · Cruceta en el post-juego («Recordar») |

## 6. Dimensión Anime · «Mar Shōnen»

| Aspecto | Diseño |
|---|---|
| **Motivo narrativo** | Las huellas siguen a un mar de torneos, donde la única gatera abierta se gana peleando |
| **Identidad visual** | Shōnen de los 90 a hoy, mezclado: islas piratas (referencia de *One Piece*), una aldea ninja en los acantilados (referencia de *Naruto*) y un torneo en una arena de piedra (referencia de *Dragon Ball*). Cel de 2 tonos, líneas de velocidad y cielo en bandas. La región del mapa es **un mapa de tesoro pirata** con el bracket del torneo al centro |
| **Identidad sonora** | Opening de anime: guitarras, coros y gritos; entre peleas, flauta de entrenamiento. Canción del dueño en `07` |
| **Actividad: «Entrenamiento»** | 3 arcos de entrenamiento cortos: pirata (puntería), ninja (sigilo: ganar sin ser visto, con la regla de niebla) y artes marciales (aguantar). Cada arco termina en una escena de Luzterna «sensei» y le enseña una cosa al jugador sobre el sistema de la dimensión. **Es el capítulo de respiro del Acto II** (`03`) |
| **Espacio para explorar** | Tres islas (pirata, ninja y arena) con caminos entre ellas; el desvío es una cueva de entrenamiento oculta |
| **Niveles** | A-1 «La convocatoria» (tutorial de Poder) · A-2 «Islote de los piratas» · A-3 «La aldea» → desvío «Cueva del maestro» · A-4 «Preliminares» · **A-5 élite «El rival que no te conoce»** (un rival varado que cree que eres su rival desde la infancia) · A-6 «Cuartos de final» · A-7 «Semifinal» (Brecha, que pelea limpio) · A-8 «Esquirla hace trampa» · **A-9 jefe «Itō»** (la final) |
| **Encuentros** | Luchadores varados que piden duelo · Esquirla (trampa) |
| **Gatos** | Super Siamés · Itō · Gomitas y Kagebunyan (expansión) |
| **Conflicto y consecuencia** | El torneo es honor contra trampa: Brecha y Esquirla empiezan a separarse aquí. **Consecuencia visible:** si ganas A-7 sin hundir el barco de Brecha (opcional, lo marca la tarjeta), Brecha te debe una y lo dice en H86 |
| **Relación con la trama** | El reloj de los Titiriteros (Itō olvida), el punto medio (La Mano) e Itō abandona la cacería |
| **Razones para volver** | El torneo se puede repetir con otro bracket · los arcos de entrenamiento en dificultad alta · orbes de Super Siamés |

## 7. Dimensión Libros · «Ex Libris»

| Aspecto | Diseño |
|---|---|
| **Motivo narrativo** | La Mano huyó a la caja de los libros, donde **la tinta todavía obedece un poco**. Ahí está el índice con la primera ficha de REGISTRO 000 |
| **Identidad visual** | Ilustración de cuento victoriano: pluma sepia y acuarela plana; papel y granulado en shader. Cada zona es **un libro distinto abierto**: un colegio de magia, un cuento de hadas y una novela de aventuras. La región del mapa es **un estante** con libros que se abren |
| **Identidad sonora** | Cuerdas de cámara, celesta y páginas que se pasan como percusión. Canción del dueño en `07` |
| **Actividad: «Finales perdidos»** | Cuentos cuyo final se derramó. Cada cuento es un nodo con una batalla corta y una **elección de final** entre dos (cosmética y recordada): «¿El lobo se va o se queda a cenar?». Cada final devuelto colorea el libro en el mapa y desbloquea una línea de la Bitácora. Sinfín es el último cuento: **su final solo vuelve en el post-juego** (`06` §2.4) |
| **Espacio para explorar** | Pasillos de la biblioteca con atajos (estantes que giran) y el índice al fondo |
| **Niveles** | L-1 «El colegio» (tutorial de Capítulos; Harrycat) · L-2 «El bosque del cuento» · L-3 «Capítulo perdido» → desvío «Sección prohibida» · L-4 «La novela de piratas» (guiño a la Parte I) · **L-5 élite «La Encuadernadora»** (une historias a la fuerza) · L-6 «El índice» (H84; ahí habla La Mano en H85) · L-7 «Los Correctores llegan» (H86, con el Momento «No wey») · L-8 «La azotea» (escena después de H86) · **L-9 jefe «Esquirla»** (H87) |
| **Encuentros** | Personajes que se escaparon de su cuento · Correctores (cameo) · Sonrisa (secreto) |
| **Gatos** | Harrycat · Sonrisa · La Mano · Sinfín |
| **Conflicto y consecuencia** | El derrame borra finales. **Consecuencia visible:** los libros sin final aparecen grises en el mapa hasta que los reparas; los Disruptores se parten en dos |
| **Relación con la trama** | La acusación («escrito con tu letra»), la luz que guió a los Titiriteros, el plan de la oscuridad y la negativa de Luzterna |
| **Razones para volver** | Finales con elecciones distintas · el final de Sinfín · orbes de Harrycat · secretos de la sección prohibida |

## 8. Dimensión POP · «La Gira»

| Aspecto | Diseño |
|---|---|
| **Motivo narrativo** | Esquirla huyó a POP, y Firma anuncia el show más grande del Archivo con «un invitado que no tiene forma»: Cerito |
| **Identidad visual** | Videoclip pop: neón, pastel, escenarios con luces y cámara de videoclip. El **cine mudo** queda para la resaca de la Borracha. Aquí lo pop es en color y a todo volumen. La región del mapa es **un póster de gira** con las fechas como etapas |
| **Identidad sonora** | Pop de estadio, gritos de público y bajo que retumba. Canción del dueño en `07` |
| **Actividad: «La Gira»** | 3 shows. Cada show es una batalla con la regla Ritmo y una lista de canciones que el jugador elige (cambia qué elemento tiene SINCRO). En el camerino está la **cabina de fotos** de H89: eliges la foto que vuelve en `08` |
| **Espacio para explorar** | Backstage, camerinos y la azotea del estadio; el desvío es la fila de fans, con un secreto de los 7 Michis |
| **Niveles** | P-1 «Prueba de sonido» (tutorial de Ritmo) · P-2 «Telonero» · P-3 «Camerinos» → desvío «La fila» · P-4 «Firma de autógrafos» · **P-5 élite «El mánager»** · P-6 «Primer show» (Bad Cat se une al terminarlo, H89) · P-7 «Segundo show» · P-8 «Escenario principal» (Taylor Cat) · **P-9 jefe «Firma»** (H90) |
| **Encuentros** | Paparazzi · Esquirla buscando a Cerito · fans que piden duelo |
| **Gatos** | Bad Cat · Taylor Cat · Firma · Los 7 Michis (expansión) |
| **Conflicto y consecuencia** | La vanidad de Firma casi rompe la caja (el escenario se cae). Luzterna la salva. **Consecuencia visible:** después de H90 la caja POP se queda con una grieta en el escenario que no se cierra; por ahí vio La Mano tu faro |
| **Relación con la trama** | Es la fiesta antes del Final; la foto; Esquirla le enseña el camino a los Titiriteros |
| **Razones para volver** | La Gira con listas nuevas · orbes de Bad Cat y Taylor Cat · los 7 Michis |

---

## 9. Después de la historia (por qué volver)

| Qué | Dónde | Por qué tiene sentido en la historia |
|---|---|---|
| **«Recordar»** (Itō, Cruceta, Firma) | Su dimensión | Los Titiriteros varados olvidan. Una misión corta por cada uno: le devuelves un recuerdo con algo que viste en la historia y se une como coleccionable. **La Mano no**: se quedó en el bar, sin tomarse el vaso |
| **Las actividades** | Cada dimensión | Se renuevan con una semilla de la partida, nunca con un reloj (regla del proyecto: sin tareas diarias) |
| **Orbes de los Multidimensionales** | Cada dimensión | Estrellas |
| **Finales perdidos y el de Sinfín** | Libros | Es la consecuencia que el jugador repara |
| **Decoraciones y hábitats de dimensión** | TIENDA | Gasto de oro con vida en la isla |
| **El bar** | Borracha | Para ver a La Mano, a Hipólito y el vaso roto. Ahí Canelo habla, y solo ahí |

---

## 10. La primera ruta de la Borracha (parte de la porción vertical)

**Alcance de la porción** (`09` §3): de B-1 a **B-5 (élite)**, más el comienzo de La Ronda.

| Etapa | Nombre | Capitán (especie existente con lente Borracha) | Objetivo de diseño | Regla | Premio |
|---|---|---|---|---|---|
| B-1 | Hipo-Mart | Gelatino «el del mostrador» | Enseñar el Mareo: la guía se balancea; espera el centro del vaivén | Mareo suave | 3 huellas + oro normal |
| B-2 | La Donería | Brote «el panadero» | Enseñar que las donas curan: hay una dona en la cubierta enemiga y si le das, se cura **él** | Mareo + dona | 3 huellas |
| B-3 | Callejón de las botellas | Un callejero de Agua | Primera pelea «de verdad»; botellas como escombro | Mareo + escombro (`cataclysm` de botellas cada 3 turnos) | 3 huellas · abre el desvío «Trastienda» **cuando haces la primera Ronda** |
| B-4 | Karaoke | Un gato de Sonido | Variedad: los enemigos cantan (su ulti tarda 1 turno más) | Mareo + ulti lenta | 3 huellas |
| B-5 | **Oficial Dona** (élite) | Especie existente de Tierra, con gorra (lente) | Primer muro: aprender a priorizar módulos | Cada dona que se come lo cura; hay 3 en su cubierta | 3 huellas + 25 orbes de Hipólito (primer contacto) |

**Escenas de la ruta** (máximo 4 líneas cada una):

- **Antes de B-1** (tarjeta de H69). Luzterna: «Capi, esta caja se reinicia cada mañana. Hoy no se reinició. Alguien pasó por aquí y rompió el botón.»
- **Después de B-2**. Un vecino, en mímica, señala las huellitas. Luzterna: «¿Ves? No son de gato normal. Se le borran las orillas.»
- **Antes de B-5**. Oficial Dona: «Alto ahí. Esta caja tiene reglas. La primera: no hay reglas. La segunda: no toquen mis donas.» Luzterna: «Le acabas de dar el plan, oficial.»

---

## 11. Notas técnicas para la implementación (detalle en `09`)

| Necesidad | Hecho de hoy | Propuesta |
|---|---|---|
| Etapas del segundo mapa | Agregar zonas 7+ a `content.enemies` **rompe la Parte I** (`sistemas.md` §1) | Espacio de nombres propio `data/gateras/regiones.json` y batallas con `buildSiege` (lo que ya usan los Encargos y la Parte II) |
| Una hoja con nodos de etapa | **No existe**: las hojas de la Parte II solo tienen islas 3D | Escena nueva `GaterasMapScene`, que reutiliza `StageNode`, rutas, niebla y `chartArt.ts`, con la geometría en datos (no en código como `ZONE_BOX`) |
| Escenas en el mapa o en la dimensión | `cine` solo tiene stages `island` y `region` | Un stage nuevo, `caja`, para escenas en 2D dentro de una dimensión, **o** escenas hechas con el estudio de Momentos sin música |
| Ids de dimensión | `anime`, `pop` y `DimId` ya están ocupados | `p3d_borracha`, `p3d_superheroes`, `p3d_anime`, `p3d_libros`, `p3d_pop` |
| Misiones H66+ | `isPart2Mission` toma H ≥ 31 | Acotar a H31–H65 antes de agregar H66 (etapa 0 de `09`) |
