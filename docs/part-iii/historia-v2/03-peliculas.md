# 03 · Las películas de la Parte III

> ⚠️ **SPOILERS de toda la Parte III.**
> Agente NARRATIVA · ronda 4 · 2026-10-26. Contrato del formato: `../14-plan-cinematografico.md` §2. Historia: `01-biblia-v2.md`. Mapa: `02-mapa.md`.
> **Datos musicales:** de MÚSICA, `../musica-v2/<canción>.md` (EDITOR de Soundtrap + SEÑAL): EM%EN 103 Ebm · OH SHIT 145 Em · DISTOR 112 F♯m · NO G@ME NO LIF€ 90 F♯m; Drunck, SADIE, Daria, No wey y xti como en `../07`. MÚSICA y NARRATIVA coinciden en qué va completa (SADIE, EM%EN, No wey, NO G@ME, xti) y qué va en fragmento (OH SHIT, Daria, DISTOR); los cortes de fragmento son los de MÚSICA.
> **Guiones plano por plano del Acto I:** `guiones/acto-1/`.
> **Revisión:** aplicadas las pasadas 1, 2, **3** (P1–P8 y el diseño v3 de `../temperatura/04` §11.5), **4** (Q1–Q11), **5** (R1–R9) y **6** (S1–S4) de TEMPERATURA. Manda la pasada 3: silencio sobre la mortalidad de Luzterna (la regla solo en H67, nunca repetida), tejido secreto, sin señales cómicas de Canelo, y la muerte de Canelo con capítulo propio (H94). Música alineada con `../musica-v2/00-LEEME.md`.

---

## 0. Reglas comunes

### 0.1 Tipos

| Tipo | Qué es | Música | Duración | Clics | Saltar |
|---|---|---|---|---|---|
| **PP** · película de presentación | Antes de cada batalla de historia. Cuenta DÓNDE · QUÉ PASA · POR QUÉ IMPORTA · EL RIVAL Y SU REGLA (mostrada) · LO QUE ARRIESGAMOS (letra de Luzterna; del Capi desde H93) | **Solo derivada** o pieza propia; nunca la original | 20–60 s | 0 | Sí, después de la primera vez |
| **PC** · película de canción | En los picos. Una canción original del dueño | La original (completa o fragmento) | La de la canción | 0–3, opcionales | **No** la primera vez |
| **PH** · película de historia | Una escena clave hecha película, sin canción original | Derivada o propia | 25–90 s (la vigilia, sin reloj) | 0–3 | Sí, después de la primera vez |

**Los clics nunca cambian el resultado.** Cambian una animación (más grande, más chistosa, más brillante). Si el jugador no toca, la película sigue igual de bien.

### 0.2 Gramática común (de `14` §2, aplicada)

- **Cada película tiene un estilo único** y el estilo **cuenta algo**: casi siempre es el lenguaje del rival o del lugar (el rival se presenta en el idioma de su mundo).
- **La pantalla es la caja** (`01` §7): 4:3 de tele en la Borracha, página de cómic, 16:9 de anime, libro abierto, LED y vertical en POP, a sangre en casa, panorámica en el final, iris circular en SADIE.
- **Transiciones que cuentan**: una puerta, una página, un objeto que se vuelve escenario. Nunca un fundido a negro sin motivo.
- **Dos ritmos** (`../13` §2.1): cada idea importante sigue **presentar → mostrar → consecuencia → avanzar**; dentro de cada idea, cortes rápidos, exageración y cambios de estilo. Una ráfaga siempre va entre dos planos legibles.
- **Clima y luz** en todas: aunque sea caricatura, hay lluvia de caricatura, niebla de grabado o tormenta realista.
- **Cámara con capas** (dolly, grúa, mano, cambio de foco), según lo que permita el motor de CINE (`game/src/film/`).
- **Texto:** globos de 1–6 palabras dentro de las canciones; subtítulos y globos siempre sobre zona calmada; ninguna exposición de más de 4 líneas sin acción.

### 0.3 Lo que carga cada PP según el acto (TEMPERATURA `03` §5, adoptado)

| Desde | Carga obligatoria |
|---|---|
| Acto I | Una acción de Luzterna que se entienda sin texto |
| Acto II | Lo anterior + una señal visible de Canelo (la llama que baja, una caída que se ríe) |
| Acto III | Lo anterior + el peligro de Canelo dicho con todas sus letras en LO QUE ARRIESGAMOS |
| Acto IV | La alegría de la gira **y** la llama baja de Canelo, en el mismo plano |
| H93 | Presenta solo el asedio. **No hay PP del interludio**: anunciarlo rompería la sorpresa |

### 0.4 Accesibilidad

- **Reducir movimiento:** sin sacudidas, sin giros de cámara, sin vidrio que se rompe; los cambios de formato y de estilo pasan como fundidos.
- **Reducir destellos:** máximo 3 destellos por segundo siempre (guardia de la Parte II). En las películas de *glitch* (F24, F25, F29) el parpadeo se cambia por un barrido lento.
- Subtítulos y globos con contorno, sobre zona calmada, dentro del área segura del formato.

---

## 1. Lista maestra (41 películas)

| Id | Tipo | Misión | Título | Estilo | Música | Dur. | Clics |
|---|---|---|---|---|---|---|---|
| F00 | PC | H66 | Drunck | Psicodelia de taberna (construido) | **Drunck**, completa | 1:13 | 14 (construido, formato Momento) |
| F01 | PP | H69 (opcional) | Oficial Dona | Intro de serie policiaca de los 70 | `drunck.barra` + bajo de la propia canción | 25 s | 0 |
| F02 | PH | H70 | El precio de bajar | **Teatro de sombras de manos** | `drunck.resaca` | 50 s | 1 |
| F03 | PP | H71 | NINGUNA CAJA ES HOGAR | **Esténcil y cartel de propaganda** | `drunck.battle` cortado | 35 s | 0 |
| F04 | PH | H72 | La mañana en blanco y negro | **Cine mudo de los años 20** (4 viñetas explorables) | `drunck.resaca` en piano de cine mudo | 4 × 25 s + 20 s | 1 por viñeta |
| F05 | PP | H73 | La Batalla de Gatos | ***Flyer* fotocopiado** | «El público espera» (EM%EN c1–9, isla sin batería) | 30 s | 0 |
| F06 | PC | H73 | Cuadra 8 | **VHS de cámara casera** | **EM%EN**, completa | 3:08 | 3 |
| F07 | PP | H74 | El Cadenero | **Cartel de lucha libre** | «Antes de caer» (OH SHIT c37–45, isla) | 30 s | 0 |
| F08 | PC | H74 | Caída por el multiverso | **Collage multiverso** (11 universos) | **OH SHIT**, fragmento c37→fin | 2:22 | 3 |
| F09 | PP | H75 | Ciudad Mayúscula | **Cómic moderno del «verso arácnido»** | `fut.vineta` | 40 s | 0 |
| F10 | PP | H76 | Villanos sueltos | **Periódico que gira** | `fut.vineta` con metales de noticiero | 30 s | 0 |
| F11 | PP | H77 | Cruceta | **Cómic de Edad de Plata dibujado por el rival** | `fut.vineta` en mono | 40 s | 0 |
| F12 | PH | H78 | Cerito | **Documental de naturaleza con visión nocturna** | «Pad de la noche» (xti c1–8) | 80 s | 1 (la cobija) |
| F13 | PP | H79 | El Gran Torneo | **Avance del próximo episodio** de anime | «Calle fría» (Daria c9–17, sin voz) | 30 s | 0 |
| F14 | PH | H80 | Entrenamiento | ***Yonkoma*** (tiras de 4 viñetas) | `daria.piano` | 3 × 20 s | 0 |
| F15 | PP | H81 | Itō | **Rollo de ukiyo-e** | `daria.piano` lento | 40 s | 0 |
| F16 | PC | H81 | Una sola línea | **Hilo continuo** | **Daria**, fragmento c25→fin | 1:43 | 2 |
| F17 | PH | H82 | La Vocación | **Caravaggio** + *La creación de Adán* | Pieza propia (órgano y cuerdas graves) | 90 s | 1 (respuesta del Capi) |
| F18 | PP | H83 | La Encuadernadora | **Libro desplegable** (*pop-up*) | `nowey.melodia` | 35 s | 0 |
| F19 | PH | H84 | Lo que se derrama, se termina | **Grabado de Doré** con niebla | `fut.fosa` | 75 s | 0 |
| F20 | PP | H85 | El índice | **Expresionismo alemán** | `fut.fosa` + latido | 30 s | 0 |
| F21 | PH | H86 | El plan | **Cuaderno de Leonardo** | Pieza propia (laúd y cuerdas) | 90 s | 0 |
| F22 | PP | H87 | La corrección | **Plano técnico blanco** | «Lo que no dije» (No wey c45–49, la melodía sola ×2) | 40 s | 0 |
| F23 | PC | H87 | El expediente | **Noir de tinta con un solo color** | **No wey**, completa | 3:47 | 3 |
| F24 | PP | H88 | Señal pirata | **La presentación hackeada** (señal pirata de TV) | «Señal rota» (DISTOR c1–5) | 35 s | 0 |
| F25 | PC | H88 | Datamosh | ***Datamosh* sobre la acuarela de Libros** | **DISTOR**, fragmento c25→fin | 2:02 | 2 |
| F26 | PP | H89 | El mánager | **Póster de festival y pase de backstage** | `xti.gira` | 30 s | 0 |
| F27 | PH | H90 | Karaoke | **Fotomatón**: tira vertical de 4 fotos + letras con pelotita | Karaoke derivado de `xti.gira` | 70 s | 1 |
| F28 | PP | H91 | Firma | **Portada de revista y teaser de video** | «PRESS START» (NO G@ME c1–3 y c53–57) | 35 s | 0 |
| F29 | PC | H91 | El show | **Videoclip que se vuelve videojuego** | **NO G@ME NO LIF€**, completa | 3:26 | 3 |
| F30 | PC | H92 | La noche estrellada | **Van Gogh** | **xti es amor**, completa | 3:18 | 3 |
| F31 | PP | H93 | Se acerca una luz | **Realismo con tormenta** | `fut.jefe` grave + tormenta | 60 s | 0 |
| F32 | PH | H93 | La caída | Realismo (continúa F31 a propósito) | Batalla que se adelgaza → **silencio total** | 30 s | 0 |
| F33 | PH | H94 | La noche sin Canelo | **Nocturno de casa**: la pintura del juego, sin su tema, luz de faro | Ambiente; ninguna música | Sin reloj | Tocar gatos |
| F34 | PH | H94 | Antes del amanecer | Realismo de madrugada (cielo que aclara) | **Vuelve el tema de Canelo** (derivado) → silencio | ~90 s | 0 |
| F35 | PC | H94 | Linterna mágica | **Linterna mágica** (placas de vidrio pintado) | **SADIE**, completa | 2:53 | 3 |
| F36 | PH | H94 | MIRA | **Visión de gato** | Silencio + latido | 25 s | 1 |
| F37 | PH | H95 | La Mano | **Tinta que se borra** (la ficha de La Mano se deshace en pantalla) | Nada | 60 s | 0 |
| F38 | PH | H95 | La vigilia | **Plano secuencia** hasta el amanecer | «Antes de la luz» (SADIE c33–37 estirado) o nada | Sin reloj | Tocar gatos |
| F39 | PH | H96 | El recado | La pintura del juego con luz naranja · créditos · «Continuará» | Nada → piano de SADIE (c33–37) en créditos | 90 s + créditos | 1 (DÍSELO) |
| F40 | PH | H97 | La última ronda | **Caricatura sin risas grabadas** | Nada | 60 s | 0 |

**Tiempo total de películas:** ≈ 52 min (≈ 26 de canciones, ≈ 12 de presentaciones, ≈ 14 de historia), más la noche sin Canelo y la vigilia, que no tienen reloj.

**Además (no numeradas):** *tarjetas de estrella* de las cadenas laterales (8–15 s, una plantilla por multiverso) y *tarjetas de actividad* (5–10 s). Ver `02-mapa.md` §8.

---

## 2. Las 8 canciones que faltan: función, completa o fragmento, capítulo

| Canción | Dur. | Capítulo | Función narrativa | ¿Completa? | Por qué |
|---|---|---|---|---|---|
| **EM%EN** | 3:08 | H73 | La Batalla de Gatos: Canelo confiesa en el escenario | **Completa** | **La batalla es la canción.** Su forma (verso · quiebre · verso · salida) es la forma de una batalla de rap: ataque del campeón, silencio, confesión, réplica, *mic drop*. Cortarla le quita un tiempo a la batalla |
| **OH SHIT** | 3:22 | H74 → Acto II | La caída por el multiverso | **Fragmento** (c37→fin, 2:22; la principal de MÚSICA es c45→fin, 2:09) | Es una **ráfaga**: energía constante, sin arco. A los dos minutos el jugador ya entendió «los universos se mezclan». La segunda mitad repetiría energía sin información |
| **Daria** | 2:26 | H81 | El duelo con Itō | **Fragmento** (c25→fin, 1:43) | Un duelo es corto. El fragmento **abre en el silencio de c25** (el antes del corte), pasa por **el hueco de c41** (el olvido de Itō) y cierra en el **corte seco de c81** (la caída de Itō). Un solo corte, sin edición |
| **No wey** | 3:47 | H87 | **El expediente**: los Correctores le leen lo que hizo en esta aventura como cargos y ella contesta «culpable» a cada uno | **Completa** | **Narra todo**, pero **en boca del enemigo** [TEMP-P3]: no es «la película de su vida» (eso se leía como despedida), es un juicio que ella gana con orgullo. Cada sección es un cargo. TEMPERATURA y MÚSICA confirmaron: completa |
| **DISTOR** | 2:54 | H88 | La ruptura de Esquirla: el *glitch* se come el libro | **Fragmento** (c25→fin, 2:02) | Es una explosión, no el corazón. Pero **la distorsión que crece tiene que oírse crecer**: el fragmento conserva el arranque, el tramo más fuerte y **el desfase de c65,875** (MÚSICA: todo menos la batería se corre 3,5 tiempos), que es el instante en que la caja se parte en dos |
| **NO G@ME NO LIF€** | 3:26 | H91 | El show de Firma se vuelve trampa y rompe la caja POP | **Completa** | **La distorsión que va aumentando** (lo pidió el dueño) necesita sus dos subidas: la primera es el show; el quiebre, la trampa; la segunda, la ruptura que deja ver tu faro |
| **xti es amor** | 3:18 | H92 | La noche estrellada | **Completa** | **La noche dura lo que dura la canción.** Sus partes quietas («va a haber partes aburridas») son el punto: que el jugador quiera quedarse |
| **SADIE** | 2:53 | H94 | La muerte de Luzterna | **Completa** | **Lo pidió el dueño: es incremental.** La proyección crece con la canción (los agudos suben hasta ~1:50) y se apaga con ella |

**Hilo de la distorsión** (`01` §8): DISTOR (H88) y NO G@ME NO LIF€ (H91) comparten la misma textura. En la historia es **el sonido del derrame**. El jugador aprende de oído que, cuando vuelve esa textura, algo grande se va a romper.

---

## 3. Fichas de las películas

**Formato de cada ficha:** Tipo · Misión · Estilo (y por qué) · Pantalla · Clima y luz · Duración · Música · Clics · El entorno y la pantalla · Contenido · Pistas y señales (ids de `01` §3.1 y §4.5).

### Prólogo

#### F00 · Drunck (construido)

Ver `../04` §3 y `../13` §3.3. No cambia.

### Acto I · La Tele (guiones completos en `guiones/acto-1/`)

#### F01 · PP «Oficial Dona» (H69, **opcional**)

- **Estilo:** intro de serie policiaca de los 70: pantalla partida, cuadro congelado con el nombre sobreimpreso, *zoom* brusco, torreta. **Por qué:** Oficial Dona es «la ley de la caja» y la Borracha es la tele; su presentación es la cortinilla de su propio programa.
- **Pantalla:** 4:3 de tele. **Luz:** noche de caricatura, torreta roja y azul.
- **Duración:** 25 s. **Clics:** 0. **Música:** `drunck.barra` con el bajo de la propia canción al frente.
- **Contenido:** DÓNDE «LA DONERÍA, MEDIANOCHE» · QUÉ PASA: las huellas de Cerito pasan frente a la patrulla · POR QUÉ: si nos detiene, se enfría el rastro · RIVAL: **cada dona que se come lo cura** (se ve: muerde, su barra de vida se rellena de chispas de colores) · LO QUE ARRIESGAMOS: «Las huellas. Y la paciencia del gordo.»
- **Acción muda de Luzterna:** le apaga la torreta con un soplido.
- **Nota:** H69 está construida. Esta PP se puede agregar sin tocar el flujo (MECÁNICAS decide).

#### F02 · PH «El precio de bajar» (H70)

- **Estilo:** **teatro de sombras de manos** (y recortes al estilo de Lotte Reiniger). **Por qué:** los Titiriteros son literalmente titiriteros; su forma de bajar fue **juntar las manos y hacer sombra de gato**. Es la imagen exacta de «se escribieron como gatos».
- **Pantalla:** 4:3; la pared de la Donería es la pantalla del teatro; Borrón proyecta con la lámpara del mostrador.
- **Luz:** una sola lámpara cálida; sombras con borde de luz (regla de siluetas, `../13` §2.2): nunca negro puro, ojos encendidos.
- **Duración:** 50 s. **Música:** `drunck.resaca`. **Clic (1):** «¡HIC!»: el hipo de Borrón sacude la sombra (cambia de escena de golpe; sin tocar, cambia sola).
- **Contenido:** arriba, manos de luz que escriben en los márgenes → las manos se juntan y la sombra es un gato → el lápiz cae → caen como cometas, cada una a una caja, y toman su trazo → abajo todo se acaba: las donas desaparecen de la sombra una por una → cada derrota, una línea de su ficha se borra.
- **Pistas:** ninguna [TEMP-P3: fuera la frase del FIN y la respuesta de ella]. Borrón explica el precio de encarnar: perder el lápiz, que abajo todo se acaba y que olvidan.

#### F03 · PP «NINGUNA CAJA ES HOGAR» (H71)

- **Estilo:** **esténcil y cartel de propaganda** (rojo, negro y papel kraft; tipografía de molde). **Por qué:** los Disruptores hablan con grafiti; su presentación es su manifiesto pegado en la pared del bar.
- **Pantalla:** 4:3, pero los carteles se pegan **encima** del marco de la tele.
- **Duración:** 35 s. **Música:** `drunck.battle`, cortado a golpes de spray.
- **Contenido:** DÓNDE «LA ÚLTIMA RONDA, OTRA VEZ» · QUÉ PASA: los Disruptores entran por la rasgadura del baño · POR QUÉ: buscan a «La Llave» · RIVAL: **Brecha**; regla **sillas voladoras** (se ve: una silla sube con el vaivén del Mareo y se vuelve cobertura un turno) · LO QUE ARRIESGAMOS: «El rastro de Cerito. Le dicen "La Llave". Qué feo.»
- **Acción muda de Luzterna:** le corrige la ortografía a un grafiti con la luz de la linterna.

#### F04 · PH «La mañana en blanco y negro» (H72, respiro)

- **Estilo:** **cine mudo de los años 20**: blanco y negro con grano, viñeta redonda, intertítulos con marco art déco, cámara fija y *iris* para entrar y salir. **Por qué:** en la resaca «la luz duele y el sonido también» (`../05` §4).
- **Pantalla:** 4:3 con viñeta. **Luz:** sol de mañana quemado.
- **Duración:** prólogo 20 s + 4 viñetas de ~25 s (el jugador elige el orden en el mapa de la Borracha). **Clic:** 1 por viñeta.
- **Contenido:** Canelo perdió la bufanda. Viñetas: la Donería (Homiau se acuerda de anoche por primera vez en su vida y está feliz) · el Hipo-Mart (la linterna se rueda y el jugador la detiene: **J**) · el parque (Canelo y Luzterna en el dúo: «¿Tú te acuerdas de cuando estabas viva?» · «Del faro de mi papá. Del pan dulce. De que nadie me hacía caso. …O sea, igual que ahora.»; el pan dulce que huele) · el bar (la bufanda **tirada en el suelo** bajo el banco de Hipólito: C3; solo se oye el proyector). Al final le acomoda la bufanda a Canelo dormido y se queda mirando el bar. **No teje a la vista** [TEMP-P1]: el único hilo es el de H67 (canon).
- **Pistas y señales:** C3 (la bufanda en el suelo). La linterna se inclina sola hacia las rasgaduras.

#### F05 · PP «La Batalla de Gatos» (H73)

- **Estilo:** ***flyer* fotocopiado**: grano de copiadora, letras recortadas, grapas, cinta. **Por qué:** así se anuncian las batallas de rap de barrio.
- **Duración:** 30 s. **Música:** «El público espera» (EM%EN c1–9: coro, stab y guitarra, sin batería; isla de MÚSICA).
- **Contenido:** DÓNDE «KARAOKE "EL ÚLTIMO TRAGO" · ESTA NOCHE» · QUÉ PASA: el barrio culpa al «gato naranja» de que ya nadie olvida · POR QUÉ: sin el barrio no hay rastro; arriba del escenario lo que se dice se respeta · RIVAL: **EMIAU «Slim Bigotes»**, campeón invicto; regla **«Rima»** (se ve: repetir elemento → abucheo y el tiro pega débil; variar → combo) · LO QUE ARRIESGAMOS: «Que el barrio nos dé la espalda. Y la dignidad del gordo (poca).»

#### F06 · PC EM%EN «Cuadra 8» (H73) · completa · guion en `guiones/acto-1/h73-batalla-de-gatos.md`

- **Estilo:** **VHS de cámara casera**: cámara en mano, color lavado, líneas de *tracking*, fecha en la esquina, **tipografía cinética** para las barras. **Por qué:** EMIAU viene de La Cuadra 8, una caja de batallas de estacionamiento; al entrar él, la caricatura de la Borracha se lava como un video viejo. Cuando Canelo confiesa, el color de caricatura vuelve.
- **Pantalla:** el 4:3 de la tele **se vuelve el 4:3 de un VHS** (misma caja, otra textura).
- **Luz:** farol de sodio naranja y el foco del escenario. En el quiebre, **la única luz es la linterna de Luzterna**.
- **Clics (3):** «¡UUUH!» (el público en un remate del campeón) · **«LUZ»** (levantar la linterna en el quiebre; si no, la levanta sola) · «¡MIC!» (el *mic drop* final).
- **Estructura** (103 BPM; compás = 2,33 s; secciones de mi medición, MÚSICA confirma):

| Compases | Tiempo | Sección | Qué cuenta |
|---|---|---|---|
| c1–33 | 0:00–1:14,6 | Verso del campeón | EMIAU humilla a Canelo: vino a olvidar, rompió el reinicio, dejó su casa. El barrio asiente. Canelo se encoge |
| c33–49 | 1:14,6–1:51,9 | Quiebre (silencio que crece) | Canelo, solo, busca la salida (quiere huir otra vez). **La linterna lo ilumina.** Confiesa en voz baja |
| c49–73 | 1:51,9–2:47,8 | Verso de Canelo | Convierte la confesión en réplica: «acordarse cuesta, olvidar sale caro». El barrio recuerda cosas buenas. **«Si alguien paga, pago yo»** |
| c73–81 | 2:47,8–3:08 | Salida | *Mic drop*. EMIAU le choca el puño. Doña Espuma, desde la barra: «Empieza por las catorce rondas.» Luzterna, al fondo, sonríe y **no dice nada** [TEMP-Q4] |

- **Señales y pistas:** v2-a (la promesa de pagar, **solo en boca de Canelo**). Luzterna no le contesta: cualquier respuesta suya se leía como que se ofrecía [TEMP-Q4].

#### F07 · PP «El Cadenero» (H74)

- **Estilo:** **cartel de lucha libre**: tipos de madera, impresión a dos tintas, máscara, «A 2 DE 3 CAÍDAS». **Por qué:** El Cadenero es el luchador de la puerta; su función es estelar.
- **Duración:** 30 s. **Música:** «Antes de caer» (OH SHIT c37–45) con gritos de arena.
- **Contenido:** DÓNDE «LA ÚLTIMA RONDA · LA PUERTA DEL BAÑO» · QUÉ PASA: la rasgadura de Cerito está detrás de esa puerta · POR QUÉ: es la única · RIVAL: **El Cadenero**; regla **«Lista VIP»** (se ve: revisa la «pulsera» de tu gato más fuerte y no lo deja disparar ese turno) · LO QUE ARRIESGAMOS: «El rastro. Y que el gordo vuelva a hacer fila para el baño.»

#### F08 · PC OH SHIT «Caída por el multiverso» (fin de H74) · fragmento · guion en `guiones/acto-1/h74-el-cadenero-y-oh-shit.md`

- **Estilo:** **collage multiverso**: cada universo trae su estilo y su marco. El chiste que une todo: **cada universo censura el «OH SH—» a su manera** (el pitido de la tele, «#@!%» de cómic, «¿¡NANI!?» de anime, el cuadro de *El Grito*, el triple *zoom* de telenovela, la lápida de western, el subtítulo de kaiju, «¡CONTINUE?» del videojuego, un jeroglífico de gato asustado en Egipto). La canción no tiene voz: el «OH SHIT» solo existe escrito (MÚSICA, `../musica-v2/oh-shit.md` §6).
- **Pantalla:** **el 4:3 se raja como vidrio**; cada «Synth Drop» de la canción (c72, c87, c100, c115) es una grieta antes de un universo nuevo. Cada universo trae su marco. Al final, el marco se vuelve **una viñeta** de cómic.
- **Clics (3):** «¡SALTA!» (c45: la pose de Canelo al saltar) · «¡GRITA!» (c73: todos gritan en *El Grito*) · «¡CAE!» (c117: aterrizaje de superhéroe o de panza).
- **Fragmento: c37 → fin** (2:22,4; la alternativa de MÚSICA que entra por el suspenso). **Por qué c37 y no c45:** c37–45 no tiene beat y trae la melodía picada en c37, c40 y c41,125 («¿qué fue eso?»): es la puerta del baño que se abre **desde el silencio** del aviso de Borrón (TEMPERATURA). Las dos caídas «¡OH SHIT!» (c73 y c101) son **más bajas, no más fuertes**: son **cambio de mundo**, y así se dirigen.

| Compases (canción) | Tiempo en la película | Sección | Universo | Qué pasa |
|---|---|---|---|---|
| c37–45 | 0:00–0:13 | Suspenso (sin beat, melodía picada) | La Tele (4:3) | La puerta del baño. Cada golpe picado, una cosa: c37 la manija gira sola; c40 la rendija de estática se abre; c41,125 una huellita de Cerito brilla en el piso. «¿Listos?» «No.» |
| c45–57 | 0:13–0:33 | Beat + textura («el piso se va») | La Tele → túnel | **c45, Canelo salta** (clic). El piso del bar se inclina hacia la rasgadura. Túnel de estática con destellos del bar. **El 4:3 se raja** de a poco: una línea en c45, otra en c49, una telaraña en c53 |
| c57–72 | 0:33–0:58 | Beat + Coil (la presión sube) | **Noir de cómic** (c57–62) · **verso arácnido** (c63–68) · **anime** (c69–72) | c57: el vidrio de la tele se cae a pedazos. Lluvia y gárgola: Murciégato de espaldas, «#@!%». Gato Araña de cabeza los ve pasar. Líneas de velocidad: «¿¡NANI!?». **c72, grieta** |
| c73–87 | 0:58–1:21 | **¡OH SHIT! 1** (otra música, sirenas, más bajo) | **El Grito** (c73–76) · **telenovela** (c77–80) · **plastilina** (c81–86) | c73: el mundo cambia al cuadro de Munch; todos gritan sin sonido (clic); **Cerito se ve claro un segundo** y mira a Canelo. Triple *zoom* de telenovela a Canelo: «¡¿QUÉÉÉ?!». Una familia de plastilina desayuna; Canelo les roba un pan al pasar. **c87, grieta** |
| c89–100 | 1:21–1:41 | Beat de vuelta (el más fuerte), melodía picada en c89, c92, c93,125 | **Western** (c89–92) · **kaiju** (c93–96) · **videojuego** (c97–100) | Ojos en primerísimo plano y cartel «SE BUSCA: CERITO». **La pata de Gatzilla baja sobre ellos y Luzterna jala a Canelo de la bufanda** para sacarlo del pisotón [TEMP-P3 §3.4]. Nada la atraviesa. Comecroquetas persigue a Canelo por el laberinto (sin contador de vidas [TEMP-P3]). **c100, grieta** |
| c101–115 | 1:41–2:04 | **¡OH SHIT! 2** (la caída más larga, sirenas picadas) | **Egipto** (c101–104) · **ráfaga** (c105–114) | Friso egipcio: a Canelo lo adoran un compás, «¡Por fin alguien que me entiende!». Luego, **ráfaga** con las sirenas irregulares: un compás por universo (variantes de Gato Araña, un Canelo pixelado, uno de plastilina, Murciégato en una cornisa, un Homiau de otra tele), y en cada destello **Cerito con el trazo de ese universo** |
| c115–117 | 2:04–2:08 | Synth Drop | — | La última grieta: blanco de página |
| c117–123 | 2:08–2:22 | Aterrizaje (fundidos; la textura se va en c121) | **Ciudad Mayúscula** | La viñeta se arma. «MIENTRAS TANTO, EN CIUDAD MAYÚSCULA…». **Clic «¡CAE!»**. Canelo se desploma dos segundos. La linterna proyecta, sin querer, una silueta de gato en las nubes: la Gato-señal. Todo se apaga solo |

- **Señales:** la llama de Canelo baja con **cada** grieta (v2-b).

### Acto II · El Cómic y El Shōnen

#### F09 · PP «Ciudad Mayúscula» (H75)

- **Estilo:** **cómic moderno del «verso arácnido»**: puntos de impresión, desregistro de color, animación a dos cuadros, cajas de texto de colores distintos, onomatopeyas sólidas. **Por qué:** es la entrada al multiverso del cómic; el jugador tiene que sentir «esto es otro universo» al primer cuadro.
- **Pantalla:** **página de cómic** (4–6 viñetas a la vez). **Luz:** atardecer naranja y morado de cómic.
- **Duración:** 40 s. **Música:** `fut.vineta`.
- **Contenido:** DÓNDE: las letras «CIUDAD MAYÚSCULA» **son** los edificios · QUÉ PASA: la Gato-señal en las nubes; los héroes miran arriba · POR QUÉ: las huellas de Cerito (ahora con puntos de impresión) llevan al muelle · RIVAL: **La Pandilla del Ovillo**; regla de la dimensión **Onomatopeya** (se ve: un golpe deja un «¡KRAK!» sólido y una bala rebota en las letras) · LO QUE ARRIESGAMOS: «Que se enfríe el rastro. Y que nos confundan con villanos.»
- **Acción muda de Luzterna:** acomoda la linterna para que la Gato-señal «salga más bonita».
- **Señal de Canelo (Acto II):** al pasar junto a una rasgadura, su llama baja; se ríe y sigue.

#### F10 · PP «Villanos sueltos» (H76)

- **Estilo:** **periódico que gira** (el recurso de noticiero de los 40), con portadas de *El Clarín Viñeta* en color de cómic. **Por qué:** la ciudad se entera de todo por el periódico, y el periódico nos va a culpar.
- **Duración:** 30 s. **Música:** `fut.vineta` con metales de noticiero.
- **Contenido:** portadas que giran y se detienen: «¡FUGA EN LA CÁRCEL DE VILLANOS!» · «LOS DISRUPTORES: "QUE RESPIREN"» · «¿FORASTEROS O VILLANOS?» (con tu barco en la foto) · RIVAL: **El Estambre**, villano de lana; regla: **protege la barcaza civil** (grado de daño); sus tiros enredan · LO QUE ARRIESGAMOS: «Los civiles. Y nuestra cara en el periódico.»
- **Señal de Canelo (Acto II):** en la última portada, junto al titular, un recuadro: Canelo con la llama chica, dormido de pie en el barco.

#### F11 · PP «Cruceta» (H77)

- **Estilo:** **cómic de Edad de Plata dibujado por el rival**: color plano, puntos grandes, letras melodramáticas, crepitación de energía. **El rival nos presenta como los villanos** en su portada.
- **Duración:** 40 s. **Música:** `fut.vineta` en mono, como radio vieja.
- **Contenido:** portada «¡CRUCETA CONTRA LA BANDA DEL GATO QUE ROMPE CIUDADES!»: Canelo con bigote de villano, Luzterna como «LA BRUJA DE LA LINTERNA»; globo de Cruceta: «¡Esta ciudad no le teme a ninguna bruja!» · regla **«Rescate»** (se ve: a mitad de pelea, Cruceta baja en picada a salvar a un gatito civil y la batalla se pausa un turno) · LO QUE ARRIESGAMOS: «La azotea donde cayó el chiquito.» Debajo, ella dibuja un bigote a Cruceta en su propia portada.

#### F12 · PH «Cerito» (H78, respiro)

- **Estilo:** **documental de naturaleza con visión nocturna**: verde fósforo, grano, teleobjetivo con poco foco, nombre científico en subtítulo («*Registrum zero zero zero*»), narración susurrada de Luzterna (texto). **Por qué:** es tierno y gracioso, y **siembra el final**: en la visión nocturna, los ojos de Canelo brillan solos.
- **Pantalla:** casa, a sangre, con el marco de un visor de cámara.
- **Luz:** noche, el haz del faro barriendo. **Clima:** brisa.
- **Duración:** 80 s. **Música:** «Pad de la noche» (xti, pad solo). **Clic (1):** dónde dejarle la cobija a Cerito (faro o palmera de Canelo). Se recuerda (vuelve en la vigilia).
- **Contenido:** «Aquí, en su hábitat natural…» · Cerito se acerca al haz, se asusta, vuelve · **los ojos de Canelo brillan en la visión nocturna**: «Ellos no necesitan cámara, Capi. Ven en lo oscuro» · Cerito toca la luz y su estática se calma · «Te voy a decir Cerito» · Canelo pelea para no cerrar los ojos (si deja de verlo, se borra; v2-c) · ella le echa una cobija encima a él también, sin dejar de narrar (dúo) · al final, bajito, en chiste: «¿Sabes por qué nunca apago la linterna? Me da miedo la oscuridad. Una farera miedosa. Qué chiste.» **Se paga en H85** (apaga la linterna para esconder a los suyos), así que no queda pendiente para el final [TEMP-P2]

#### F13 · PP «El Gran Torneo» (H79)

- **Estilo:** **avance del próximo episodio** de anime: montaje rapidísimo, cortinilla con Canelo y Super Siamés, la llave del torneo, «¡NO TE LO PIERDAS!».
- **Pantalla:** 16:9 de anime de tele. **Duración:** 30 s. **Música:** `daria.battle`.
- **Contenido:** DÓNDE «EL MAR SHŌNEN» · QUÉ PASA: la única gatera abierta se gana en un torneo · POR QUÉ: Cerito ya cruzó · RIVAL: **El rival que no te conoce** (cree que eres su rival desde la infancia); regla **Poder** (se ve: bajo el 50 % carga aura gritando) · LO QUE ARRIESGAMOS: «La gatera. Si perdemos, Cerito se queda solo del otro lado.»
- **Señal de Canelo:** en el avance, un cuadro de Canelo jadeando con la llama chica, que pasa en medio segundo.

#### F14 · PH «Entrenamiento» (H80, respiro)

- **Estilo:** ***yonkoma***: tiras verticales de cuatro viñetas en tramas de manga, blanco y negro con un color, remate en la cuarta.
- **Duración:** 3 tiras de ~20 s, cada una antes de un arco de entrenamiento. **Música:** `daria.piano`.
- **Tiras:**
  1. **Pirata (puntería).** «Apunta con el corazón.» Canelo dispara; la bala cae en el ramen de Super Siamés. «…Con el corazón de OTRO.» (Nada la atraviesa [TEMP-P3].)
  2. **Ninja (sigilo).** Ella enseña a esconderse con la linterna prendida. Los encuentran a los dos.
  3. **El nombre del ataque.** Canelo le explica que en esta caja los ataques se gritan. Ella lo intenta en voz bajita. Él insiste. Cuarta viñeta: «¡RAYO DE… LUZ… TERNA!», a todo pulmón, y se muere de vergüenza; el mar entero se voltea a verla [TEMP-P3: fuera «la técnica de no soltar» y «a la Luz no le pega nadie»].

#### F15 · PP «Itō» (H81)

- **Estilo:** **rollo de ukiyo-e** que se desenrolla de derecha a izquierda: líneas de plancha, color plano, cielo en degradado *bokashi*.
- **Duración:** 40 s. **Música:** `daria.piano` lento.
- **Contenido:** DÓNDE «LA FINAL» · QUÉ PASA: el último rival es Itō, Titiritero · POR QUÉ: la gatera del torneo · RIVAL: **Itō**; regla **«Duelo limpio»** (se ve: dos figuras intercambian un solo trazo cada una, por turno) · LO QUE ARRIESGAMOS: «La gatera. Y que Itō olvide algo por nuestra culpa.» (Ella se preocupa por el rival: es su forma de cuidar.)
- **Señal de Canelo:** su llama, chica, en una esquina del rollo.

#### F16 · PC Daria «Una sola línea» (H81, cierra la batalla) · fragmento

- **Estilo:** **hilo continuo**: el mundo es un solo hilo blanco sobre índigo; los luchadores en cel. Cuando Itō corta, se corta el dibujo. **Por qué:** Itō es el Titiritero de hilos. (`../07` §4.3, se conserva.)
- **Pantalla:** 16:9 que se va deshilando. **Luz:** índigo nocturno.
- **Fragmento: c25 → fin** (1:43,4; la principal de MÚSICA, `../musica-v2/daria.md` §1): **arranca en el stop de c25** (silencio de 2 tiempos; el 808 vuelve en c25,5), pasa por el **hueco de c41** (1,5 tiempos) y termina en el **corte seco de c81**. Un solo corte, sin edición. **El volumen casi no se mueve**: los cambios de imagen se cuelgan del brillo y de la voz (entra la caja, entran los hats en c33, se va la voz en c33 y c65).
- **Clics (2):** «CORTA» en c25,5 (el hilo de Itō se corta limpio; sin tocar, el corte llega igual) · «¡FIN!» en c80.

| Compases | Qué pasa |
|---|---|
| **c25 (stop de 2 tiempos)** | La película **abre en el silencio**: todo el dibujo tenso. **Esquirla ataca a Canelo por la espalda e Itō lo bloquea con un hilo, sin mirar.** En c25,5 vuelve el 808: el corte |
| c26–33 | Sobre lo calmado, Itō, sin quitarle los ojos a Esquirla: «Al gato no. Así no.» (v2-h, señal de Canelo [TEMP-P3]). Intercambio de golpes; cada caja, un corte en el hilo |
| c33–41 (entran los hats, se va la voz) | Ráfagas de hilos: el clímax del duelo |
| **c41 (hueco de 1,5 tiempos)** | **Itō llama a un compañero y el nombre no le sale.** Una figura del fondo se borra del dibujo |
| c49–65 (vuelve la voz) | Itō pelea por honor, no por odio: el hilo dibuja su reverencia entre golpes |
| c65–81 (se va la voz) | Último intercambio. **Corte seco en c81**: Itō cae y el escenario de hilo se suelta entero |

#### F17 · PH «La Vocación» (H82, punto medio)

- **Estilo:** **Caravaggio** (tenebrismo: óleo oscuro, un rayo de luz rasante) con dos composiciones famosas: **la mano que señala dentro del rayo** (*La vocación de san Mateo*) y **las dos manos que casi se tocan** (*La creación de Adán*). **Por qué:** La Mano es la autora que «llama» desde arriba; aquí estira su mano hacia la pata de Cerito para *des-crearlo*, y **la linterna de Luzterna es la otra luz del cuadro**.
- **Pantalla:** el 16:9 de anime **se escurre a óleo** y queda dentro de un marco dorado de museo.
- **Luz:** un solo rayo desde arriba (La Mano) y el cono azul de la linterna (Luzterna). Dos luces que se disputan el cuadro.
- **Duración:** 90 s. **Música:** pieza propia (órgano y cuerdas graves; MÚSICA). **Clic (1):** la respuesta del Capi: «No.» / «Ni lo sueñes.» (cosmética; las dos llevan al «No» de Luzterna).
- **Contenido:** el cielo del torneo se oscurece · el rayo baja y La Mano, gata pálida, estira la pata hacia Cerito (composición de la *Creación*) · ofrece cerrarlo todo «sin dolor» a cambio de Cerito, **mirando a Canelo** (C7) · Luzterna pone la linterna entre las dos manos: «No.» · **una gota de tinta de La Mano rebota en la burbuja de la linterna** («¡REBOTE!», el efecto de *te ODIO*), justo delante de Cerito. La luz cuida lo que alumbra: aquí alumbra a Cerito (★L3; la regla se dirá una sola vez, en H93). La mirada de La Mano pasa de la linterna **a Canelo** [TEMP-N5] · Itō se arrodilla y guarda los hilos: «Mi cacería terminó» · La Mano, antes de subir, todavía mirando a Canelo: «Ese gato ve demasiado» · una huella de mano de tinta queda en el cielo.

### Acto III · La Biblioteca

#### F18 · PP «La Encuadernadora» (H83)

- **Estilo:** **libro desplegable**: la página se abre y los mecanismos de papel levantan la biblioteca. **Pantalla:** libro abierto (dos páginas y el pliegue).
- **Duración:** 35 s. **Música:** `nowey.melodia`.
- **Contenido:** DÓNDE «EX LIBRIS» · QUÉ PASA: La Mano se escondió aquí, donde la tinta todavía obedece un poco · POR QUÉ: si escribe, puede atrapar a Cerito · RIVAL: **La Encuadernadora**, que cose historias a la fuerza; regla de la dimensión **Capítulos** (se ve: tres páginas desplegables, lluvia, calma, raíz, cada una 3 turnos) · LO QUE ARRIESGAMOS: «Que nos cosa a un cuento ajeno. Yo no quiero salir en uno de princesas. Y el gordo se cansa cada vez más rápido.»
- **Señal de Canelo:** al abrir la página, la llama de Canelo hace sombra temblorosa sobre el papel.

#### F19 · PH «Lo que se derrama, se termina» (H84)

- **Estilo:** **grabado de Gustave Doré** (tramado denso, bosque de cuento, luna) con **niebla** que corre entre las líneas. **Por qué:** Doré ilustró la *Caperucita* de Perrault; su Lobo con gorro de abuela es una imagen que todos reconocen. El grabado le da peso de «esto es serio» sin decirlo.
- **Pantalla:** libro abierto; la niebla se sale del pliegue.
- **Luz:** luna fría; la linterna como luz cálida. **Clima:** niebla que avanza.
- **Duración:** 75 s. **Música:** `fut.fosa`.
- **Contenido** [TEMP-P3: el FIN se muestra en alguien que **no** es fantasma ni amigo de ella]:
  1. El libro de *Caperucita* está gris y **vacío**: el Lobo se salió de su cuento. Huellas de lobo cruzan la página hacia otro libro.
  2. En el claro de otro cuento, **el Lobo** (con gorro de dormir y camisón de abuela) acorrala a **Garbancito**, el Disruptor diminuto que perdió el final de su propia historia. Garbancito tiembla debajo de un hongo. Brecha llega corriendo y no alcanza.
  3. **La Mano** sale de la niebla. Mira al Lobo como se mira una mancha: «Lo que se derrama, se termina.» **Escribe «FIN» con la uña-plumín** sobre el Lobo. Las letras brillan; el Lobo se vuelve líneas de grabado sueltas y se desarma en la niebla. Garbancito, salvado, se queda mirando el hueco.
  4. Brecha, de rodillas junto a Garbancito, mira la rasgadura por donde se salió el Lobo: entiende lo que rompen los Disruptores (siembra de H88).
  5. **Corte inmediato: el grito de Canelo** desde el pasillo de al lado: encontró la página de su Eco: «El Canelo de esta caja no volvió. Lo buscaron…» (el resto se derramó). La Mano, al pasar, la mira: «Ese también es un borrador.» La llama de Canelo baja.
- **Pistas y señales:** ★L-lobo (el mecanismo, mostrado en otro), tapada por C8. Luzterna está en la escena, pero **no comenta nada sobre sí**: abraza a Garbancito con el haz.
- **Pago en el post-juego:** cuando el jugador devuelve en «Finales perdidos» el final de la página del Eco, dice: «…Lo buscó quien lo cuidaba. Lo encontró. Ella no volvió.» Sin música ni comentario. **Bloqueado hasta después de H96** [TEMP-N17]. Mientras tanto, esa página aparece en «Finales perdidos» como «final ilegible» y no se puede jugar.

#### F20 · PP «El índice» (H85)

- **Estilo:** **expresionismo alemán**: sombras pintadas en las paredes, pasillos chuecos, estantes inclinados, letras pintadas a mano, tinte verde y sepia. **Por qué:** el índice es el lugar de la acusación y de la paranoia («escrito con tu letra»).
- **Pantalla:** libro abierto cuyas páginas **se inclinan**. **Duración:** 30 s. **Música:** `fut.fosa` con un latido.
- **Contenido:** DÓNDE «EL ÍNDICE» · QUÉ PASA: aquí está la primera ficha de Cerito · POR QUÉ: puede decir quién lo escribió · RIVAL: **la biblioteca que se derrumba**; regla: sobrevivir 4 turnos mientras caen estantes · LO QUE ARRIESGAMOS: «La ficha. Y salir antes de que se caiga todo. Si Cerito rompe esta caja, el gordo no aguanta.» (Acto III: el peligro dicho con todas sus letras.)
- **Señal de Canelo:** en el pasillo oscuro, su llama parpadea como vela con corriente.

#### F21 · PH «El plan» (H86)

- **Estilo:** **cuaderno de Leonardo**: tinta ferrogálica sepia y sanguina sobre pergamino, **escritura de espejo**, tramado de zurdo (de arriba a la izquierda hacia abajo a la derecha), dibujos que se animan. **Por qué:** La Mano explica su plan como un estudio de óptica: **la luz y el ojo**, los dos temas que Leonardo estudió en sus cuadernos. Es exactamente su plan.
- **Pantalla:** el libro abierto se vuelve el códice y llena la pantalla.
- **Luz:** vela de estudio. **Duración:** 90 s. **Música:** pieza propia (laúd y cuerdas; MÚSICA).
- **Contenido:**
  1. Estudio de rayos de luz saliendo de una lámpara y atravesando las paredes de una caja: «Tu luz salía de la caja. Arriba la vimos. Bajamos por ella.» Ornitópteros de Leonardo que bajan por el rayo (los Titiriteros). Luzterna: **«Yo los traje.»**
  2. Anatomía del ojo: **el ojo de Canelo, enorme** (C11): «A una posibilidad la sostienen dos cosas: una luz que la guíe y unos ojos que la vean. Sin luz ni ojos, vuelve a vacante.»
  3. **El gato de Vitruvio**: Cerito en el círculo y el cuadrado, sostenido por dos líneas, una de la linterna y otra del ojo de Canelo.
  4. «Apaga la luz. Y ciérrale los ojos al gato.» [TEMP-P4]
  5. Luzterna se cruza de brazos: «¿Y si no?» La Mano pasa la página al ojo de Canelo y no dice nada más: el dibujo lo dice. [TEMP-P3: fuera «¿Matarme?»]
  6. Ella levanta la linterna: **su luz quema un agujero en el pergamino**, que se enciende en los bordes y se enrosca. «No, wey.»
- **Cameo:** en un retrato del fondo, **La Gatoconda** sonríe.
- **Nota en escritura de espejo** en el margen del gato de Vitruvio (se lee si se pausa y se voltea): **«Sin luz ni ojos, vuelve a vacante.»** Sin «primero» [TEMP-P4].

#### F22 · PP «La corrección» (H87)

- **Estilo:** **plano técnico blanco sobre blanco**: la flota de los Correctores dibujada como planos, con cotas, simetría perfecta. **Por qué:** los Correctores quieren un mundo sin errores; su presentación es un diseño sin manchas… hasta que entra la letra de ella.
- **Pantalla:** libro abierto en blanco. **Duración:** 40 s. **Música:** «Lo que no dije» (No wey c45–49, la melodía sola ×2).
- **Contenido:** DÓNDE «EL MUELLE DE LIBROS» · QUÉ PASA: los Correctores vienen a «corregir» la decisión de la farera; en su lista: «**ERROR 1: farera muerta que habla**» (la frase es de la Parte II) · POR QUÉ: quieren quitarle la elección · RIVAL: **la flota de los Correctores**; regla **«Corrección»** (se ve: un módulo se vuelve blanco y pierde su habilidad; la luz de ella lo toca y le vuelve el color) · LO QUE ARRIESGAMOS, con su letra: «Que me corrijan la decisión. (Y los muelles.) Y el gordo: si Cerito rompe otra caja, no aguanta.» Y abajo, grande: «Esta batalla la mando YO.»
- **Pistas y señales:** L21 es **la ausencia**: no se anota a sí misma. Sin tachón [TEMP-N7]. v2-d (el peligro de Canelo dicho con todas sus letras).

#### F23 · PC No wey «El expediente» (H87, cierra la batalla) · completa

- **Estilo:** **noir de tinta y aguada** en blanco, negro y grises fríos; **el único color es el de su linterna**, un cono cálido. Persianas de sombra, contraluces, humo. **Los Correctores leen su expediente**: cada «cargo» entra como una ficha blanca mecanografiada que se pega sobre el noir, y el recuerdo aparece **dentro de la ficha**, con su luz como único color.
- **Por qué un expediente y no «la película de su vida»** [TEMP-P3, Q6]: los cargos son **lo que hizo en esta aventura** (H67, H73, H78, H85, H82), en **boca del enemigo**. Ella no se despide: **se defiende**, y contesta «culpable» a cada cargo con orgullo. La niña con la vela y la torre **no salen aquí**: son placas de SADIE.
- **Pantalla:** empieza en el libro abierto; en c29 **su luz quema el pliegue** y la pantalla se abre a sangre.
- **Luz:** noche; su cono contra la flota blanca. **Clima:** niebla del muelle que su luz abre.
- **Clics (3):** «¡REBOTA!» (en una palmada del Beat 1) · «FÓRMENSE» (c25: los gatos se forman detrás de ella; si no, solos) · «SUBRAYA» (c70: subrayar «NO, WEY.»).
- **Estructura: «Los cargos»** (74 BPM; compás = 3,24 s; `../musica-v2/no-wey.md`):

| Compases | Tiempo | Sección | Qué cuenta |
|---|---|---|---|
| c1–9 | 0:00–0:25,9 | Intro | La flota blanca en simetría perfecta. Luzterna sola en la proa, linterna baja. Texto mecanografiado: **«EXPEDIENTE: LA FARERA Y SU TRIPULACIÓN. ERRORES: 6.»** En c5, con el bajo, ella levanta la cabeza |
| c9–17 | 0:25,9–0:51,9 | Beat 1 | Cada palmada es un rayo blanco que le pega a su luz **y rebota** (la luz alumbra a los gatos detrás de ella). **CARGO 1: «Sacar a un gato de donde quería estar.»** Ficha: H67, la bufanda como correa. Ella: **«Culpable.»** |
| c17–29 | 0:51,9–1:30,8 | Break | Cartelones mudos: «UNA LUZ MENOS. UN ERROR MENOS.» Ella se ríe sin sonido. **CARGO 2: «Iluminar a quien quería esconderse.»** Ficha: H73, el foco sobre Canelo. **«Culpable.»** **CARGO 3: «Ponerle nombre a lo que no tiene forma.»** Ficha: H78; en c21 entra el primer color (el gris perla de Cerito). **«Culpable. Se llama Cerito.»** **c25**: tus gatos se forman detrás de ella, Canelo primero |
| c29–45 | 1:30,8–2:22,7 | Beat 2 | Contraataque: su luz como reflector barre la flota y cada barco que toca se pone gris. **CARGO 4: «Apagar la luz para esconder un error.»** Ficha: H85, la linterna apagada y los ojos de los gatos. **«Culpable. Y lo vuelvo a hacer.»** **c33,349** (el bombo tarde): **La Mano levanta la pata para detenerla… y la baja. En el margen: «La luz no se deja apagar. Entonces, los ojos.»**, con un ojo de gato dibujado, y mira a Canelo [TEMP-Q1, R5] **CARGO 5: «Negarse a una autora.»** Ficha: H82. **«Culpable.»** c41–45: los gatos disparan guiados por su luz |
| c45–53 | 2:22,7–2:48,6 | Break 2 | c45–49, solo la melodía: voltea a ver a Canelo. Canelo le contesta en texto (en Libros habla así): «Dale, Luz.» |
| c53–61 | 2:48,6–3:14,6 | Beat 3 | *(Antes, en c39–41, **CARGO 6** cae sobre Canelo: «Romper el reinicio» → Canelo escribe «Culpable.»; en c45 los dos quedan al frente de la fila [TEMP-S3].)* Empuje final; la flota se retira; antes de hundirse, el expediente se abre en **la ficha de Canelo** y cae un sello: **«SENTENCIA: LOS OJOS»** [TEMP-R5] |
| c61–70,125 | 3:14,6–3:44,2 | Cierre | Sin bombo; la melodía sola. Ella baja la linterna. **«NO, WEY.»** se escribe con su luz sobre el mar, letra por letra, hasta que la melodía se apaga sola |
| cola (≈ 8 s) | 3:44–3:52 | **Puente a DISTOR** (MÚSICA §3.2: misma tónica F♯m, tempo 3:2) | Mientras la melodía se apaga, **entra la intro de DISTOR** («Señal rota»: 808 + sinte, sin batería). En el borde del cuadro, un parpadeo de **señal pirata**: Esquirla mira desde un monitor roto. Negro. Es el gancho de H88; **las misiones no se encadenan** (después vienen la azotea y la Carta, [TEMP-N20]) |

- **Pistas:** ninguna de ella [TEMP-P3: fuera la mancha de tinta en la manga]. La luz rebota **porque alumbra a los gatos** (★L3).

#### F24 · PP «Señal pirata» (H88)

- **No se encadena con H87** [TEMP-N20]: después de la azotea de H87 se vuelve a la Carta; «Finales perdidos» queda abierto como respiro opcional. H88 empieza cuando el jugador lo elige. Si hiciera falta recortar tiempo en el Acto III, se recorta DISTOR (a ~1:40), **nunca No wey**.

- **Estilo:** **la presentación hackeada**: empieza como una PP normal de Libros y a los 6 s la tapa una señal pirata de televisión (barras de color, líneas de barrido, la cara de Esquirla con *glitch*). **Por qué:** Esquirla no se presenta: **se mete** en la presentación de otro.
- **Duración:** 35 s. **Música:** «Señal rota» (DISTOR c1–5: 808 + sinte, sin batería).
- **Contenido:** «ESTA SEÑAL ES DE LOS DISRUPTORES. NINGUNA CAJA ES HOGAR. LA LLAVE ES NUESTRA.» · la pluma de Luzterna raya encima del *glitch* y recupera la página a tachones · RIVAL: **Esquirla**; regla **«Esquirlas»** (se ve: sus tiros dejan astillas de *glitch* que pegan al turno siguiente) · LO QUE ARRIESGAMOS: «Cerito. Si lo usa de llave, se rompen todas las cajas a la vez. Y el gordo con ellas.»
- **Reducir destellos:** el *glitch* pasa como barrido lento.

#### F25 · PC DISTOR «Datamosh» (H88, cierra la batalla) · fragmento

- **Estilo:** ***datamosh* sobre la acuarela victoriana de Libros**: bloques de compresión, píxeles que se arrastran con el movimiento del cuadro anterior, colores que se «derriten» de un cuento a otro. **Por qué:** es el derrame hecho imagen: lo digital se come lo dibujado. **La distorsión visual sigue la curva de la canción** (`../musica-v2/distor.md` §2.1).
- **Pantalla:** libro abierto que se corrompe; en el desfase, **la pantalla se parte en dos mitades desincronizadas** (la imagen se corre medio tiempo, como el bajo y los sintes).
- **Fragmento: c25 → fin** (2:02,4; la principal de MÚSICA). Lo que queda afuera (c1–24, la presentación del *glitch*) sirve para la PP F24.
- **Clics (2):** «¡SUÉLTALO!» (Cerito se retuerce en el brazo de Esquirla; se suelta igual) · «¡BASTA!» (Brecha rocía su grafiti sobre el *glitch*, si le diste el mapa; si no, Bisagra hace de puerta).

| Compases | Sección | Qué pasa |
|---|---|---|
| c25–29 | Break (el *glitch* al desnudo; riser) | Esquirla agarra el rastro de estática de Cerito con su brazo de *glitch*. La acuarela muestra bloques. Lo más sucio: tomar aire dentro de la máquina |
| c29–41 | Drop 2 («la página se deshace») | El colegio de magia se derrite en el Londres de Sherlock; los personajes arrastran píxeles del cuento anterior. **Garbancito**, el que perdió su final, le ruega que pare |
| c41–45 | Subida (sin bajo ni sinte) | Brecha la enfrenta; el suelo de la biblioteca tiembla. Clic «¡SUÉLTALO!» |
| c45–53 | Breakdown (sin batería, palmas con *flam*, ecos) | Zona muerta: Brecha rocía «BASTA» sobre el *glitch* (o Bisagra se planta) y la imagen se sostiene. Clic «¡BASTA!» |
| c53–65 | Drop 3 (la ruptura en pleno) | El *glitch* gana: estantes enteros se vuelven bloques; Esquirla abre la rasgadura |
| **c65 → c65,875** | 3,5 tiempos de batería sola | Silencio de imagen: un cuadro congelado de la biblioteca entera |
| **c65,875 → c69** | **El desfase** | **Todo vuelve corrido**: las dos mitades de la pantalla se desincronizan, las palabras se salen de su renglón. **La caja se parte en dos.** Esquirla salta por la rasgadura hacia POP. **Cerito se le escapa del brazo y corre a la luz de Luzterna** |
| c69–82 | Salida corrida | Lo que queda: las páginas caen como nieve; la imagen se vuelve a sincronizar despacio. Brecha de un lado de la rasgadura, Esquirla ya del otro: los Disruptores partidos. Todo se va en c81,75 |

### Acto IV · La Gira

#### F26 · PP «El mánager» (H89)

- **Estilo:** **póster de festival** (los nombres entran en la lista uno por uno) y **pase de backstage** plastificado que gira. **Pantalla:** pantallas LED del estadio.
- **Duración:** 30 s. **Música:** `xti.gira`.
- **Contenido:** el cartel: «FIRMA · GATO MALO · TAILOR SWIFT · EMIAU (telonero) · y **un invitado sin forma**» · QUÉ PASA: Esquirla está aquí y Firma prepara el show más grande del Archivo · RIVAL: **El mánager**; regla de la dimensión **Ritmo** (se ve: dos gatos del mismo elemento disparan en el beat y hacen SINCRO) · LO QUE ARRIESGAMOS: «Que nos saquen de la gira antes del show. El gordo dice que "sería una tragedia". Lo dice por el bufé.»
- **Carga del Acto IV:** la tripulación emocionada en el camerino **y**, en el mismo plano, la llama baja de Canelo.

#### F27 · PH «Karaoke» (H90, respiro)

- **Estilo:** **fotomatón**: la pantalla es una tira vertical de 4 fotos; dentro de cada foto, el karaoke con **letras y pelotita que rebota**. **Por qué:** la foto que el jugador elige aquí vuelve como la última placa de SADIE; la película *es* la tira de fotos.
- **Pantalla:** vertical, con la tira al centro y el estadio desenfocado alrededor.
- **Duración:** 70 s. **Música:** karaoke derivado de `xti.gira`. **Clic (1):** «¡APLAUDE!» (el público imaginario aplaude más fuerte).
- **Contenido:** Luzterna canta una canción inventada sobre Canelo («Gato gordo, gato naranja, se comió mi pan y mi esperanza»), horrible, y no le importa · Canelo la abuchea con cariño · ella le pasa el micrófono · terminan a dúo · ya sin música, sentada en el borde del escenario, viendo a Canelo comerse el bufé: **«Algún día quiero oír a este gordo hablar en casa. Aunque sea para pedir pescado.»** [TEMP-P3] · flash, flash, flash, flash: la tira sale de la máquina · último plano: en el camerino, Canelo dormido sobre un sillón; **su llama baja sola** y nadie lo ve (v2-i).
- **Después de la película, dentro de la ficción** [TEMP-N19]: la tira sale de la máquina y se queda en pantalla; el jugador **toca una de las 4 fotos sobre la misma tira** (con calma, sin reloj) y esa foto **se clava en la Bitácora con una chincheta**. Es obligatorio y se recuerda (vuelve en F33 y en F35).
- **Pistas:** ninguna de ella. Señal de Canelo: la llama que baja sola (v2-i).

#### F28 · PP «Firma» (H91)

- **Estilo:** **portada de revista** brillante («FIRMA: "EL SHOW MÁS GRANDE DEL ARCHIVO"») y **teaser de video musical** con cuenta regresiva y destellos de lente.
- **Duración:** 35 s. **Música:** «PRESS START» (NO G@ME c1–3 y c53–57).
- **Contenido:** QUÉ PASA: el show es esta noche y el «invitado sin forma» es Cerito, en un cubo de vidrio · POR QUÉ: es una trampa · RIVAL: **Firma**; regla **«Pose de portada»** (se ve: cada vez que la golpean posa y gana un escudo por un turno) · LO QUE ARRIESGAMOS: «Cerito. Y el gordo: cada caja que se rompe le baja la llama.»

#### F29 · PC NO G@ME NO LIF€ «El show» (H91, cierra la batalla) · completa

- **Estilo:** **videoclip pop que se vuelve videojuego**: empieza como pantalla de inicio de un juego y luego video de estadio (LED, confeti, cámara en grúa, videos verticales de fans). Las pantallas LED muestran un **HUD** («JUGADOR 1: FIRMA · PREMIO: CERITO»). **La distorsión entra por capas, igual que en la canción**: el sinte «Future Flu» (el mismo loop que en DISTOR) aparece cuatro veces, cada vez más tiempo (c14–19, c27–35, c38–45 y **c57–77, que ya no se va**; `../musica-v2/no-game-no-life.md` §1). Cada entrada, el HUD se come más del show. «NO G@ME NO LIF€» es el lema de Firma («sin show no hay vida»), escrito ya corrupto.
- **Pantalla:** LED del estadio + ventanas verticales 9:16 de celulares de fans; en el quiebre, pantalla de arcade; en el clímax, todo se raja.
- **Luz:** reflectores, confeti; al final, la noche de tu isla por la rasgadura.
- **Clics (3):** «PRESS START» (c3–7, opcional: arranca el show con brillo extra) · «¡LUCES!» (c19: el público prende sus luces) · «¡ATRAPA!» (c57+, cuando cae Firma; el haz la atrapa igual).
- **Estructura** (90 BPM; compás = 2,67 s; secciones de MÚSICA):

| Compases | Tiempo | Sección | Qué cuenta |
|---|---|---|---|
| c1–7 | 0:00–0:16 | Intro («PRESS START») | La pantalla del estadio es una **pantalla de inicio de videojuego**: «FIRMA · EL SHOW MÁS GRANDE DEL ARCHIVO · PRESS START». Cerito en el **cubo de vidrio**, al centro, como «invitado sin forma» |
| c7–15 | 0:16–0:37 | Entra la batería | Entrada de Firma. Los números del show: **Gato Malo**, **Tailor Swift** y **EMIAU** de telonero (cameos con sus rasgos). Videos verticales de fans |
| **c14–19** | 0:35–0:48 | **Primera distorsión** (sin batería) | **El HUD falla un instante**: el show parpadea a interfaz de juego y vuelve. Luzterna lo nota; Canelo no (está en el bufé) |
| c19–27 | 0:48–1:09 | Subida 1 | El show en su mejor momento. Clic «¡LUCES!» |
| **c27–35** | 1:09–1:31 | Subida 1b, pregunta-respuesta (**Future Flu vuelve**) | **El juego se vuelve trampa**: el *ping-pong* arpegio/Tap, compás por compás, son **dos pantallas que se contestan**: en una, Firma canta; en la otra, el HUD dice «PREMIO: CERITO» |
| **c35–41** | 1:31–1:47 | Quiebre (**Future Flu c38–45**) | **Esquirla secuestra el show**: el estadio pasa a 8 bits; **Comecroquetas** se come las croquetas del escenario; nuestro barco entra al «nivel»; la luz de la linterna es un *power-up*. Canelo, cansado, se queda atrás un momento y se apoya en la nave: la llama, chica |
| c41–49 | 1:47–2:08 | Subida («reintentar») | La tripulación pelea dentro del juego; Firma intenta recuperar su show |
| c49–57 | 2:08–2:29 | Valle (c53–57: solo piano y 808) | **La última calma antes de romper**: Firma, sola en el escenario a medio pixelar, se da cuenta de que Esquirla la usó. Mira a Luzterna |
| **c57–77** | 2:29–3:23 | **Subida 2: la ruptura** (Future Flu ya no se va; *ping-pong* c66–77) | **El escenario se cae; Luzterna detiene con el haz de la linterna lo que cae sobre Firma** y la deja en el suelo, a salvo. Firma, por primera vez sin pose, la mira. Esquirla abre la **rasgadura enorme**: del otro lado, **tu isla de noche, el faro, la cobija de Cerito y el hueco tibio donde duerme Canelo, bajo su palmera** (C12). Del otro lado, un ojo de tinta: La Mano mira. El *ping-pong* final alterna la isla y el estadio |
| c77–fin | 3:23–3:26 | Cola | La rasgadura se cierra. Las pantallas LED se apagan una por una. Negro. El público, en silencio [TEMP-P3: fuera «GAME OVER? → CONTINUE?»] |

#### F30 · PC xti es amor «La noche estrellada» (H92, respiro) · completa

- **Título** [TEMP-P3]: «La noche estrellada» (no «Última noche tranquila»).
- **Estilo:** **Van Gogh**: *La noche estrellada* hecha tu isla. Pinceladas gruesas que se mueven, remolinos en el cielo, **el haz del faro pintado como un remolino más**, la palmera de Canelo como el ciprés. **Por qué:** es la noche más viva que va a tener Luzterna. Y es la casa: sin marco.
- **Pantalla:** a sangre, sin marco. Al final, la pintura se vuelve **lienzo de verdad** (craquelado) y se funde.
- **Luz:** estrellas y luna en remolino; el faro cálido. **Clima:** viento suave (las pinceladas del pasto ondulan).
- **Antes de la película** [TEMP-N14]: tramo jugable de 30–90 s. Se vuelve por la Carta y se aterriza en la isla al anochecer, solo con sonido ambiente unos 20 s. **La película arranca cuando el jugador toca el faro** («sentarse con ella»). Así la paz es una elección y no «otra película» pegada a F29.
- **Clics (3):** «toca a Canelo» (se da la vuelta dormido) · «toca a Cerito» (se acerca a la luz) · «mira las estrellas» (el remolino brilla más).
- **Estructura** (140 BPM; compás = 1,71 s; secciones de `../07` §6.1):

| Compases | Sección | Qué cuenta |
|---|---|---|
| c1–17 | Intro (pad solo) | La cámara baja despacio del cielo en remolino. Luzterna, en lo alto del faro, con la linterna en el regazo, mira la isla |
| c17–33 | Entra la batería (bembé) | Los gatos de la isla uno por uno, cada uno en su pequeño bucle: Canelo comiendo, Cerito persiguiendo el haz, Nadie, Noctis, Maneki, Grafitera, Hipólito, Homiau, Borrón si desertó |
| c33–41 | Break (songstarter) | Luzterna le enseña a Cerito a acercarse a la luz; Cerito se duerme en el haz |
| c41–57 | Tutti | Todos alrededor del fuego, junto al faro. Canelo comparte su pescado: un pedazo a Cerito y otro a Luzterna, que no puede comer y **lo huele**, como el pan dulce de H72. Canelo esconde lo que queda bajo la cobija «para mañana» (bandera de él) |
| c57–73 | Break largo (fill en c65–73) | **Cronos**, junto al fuego, **sin mirar a nadie**: «Vi el final. Una bufanda en el suelo y alguien que no se levanta.» **Nadie voltea**: siguen en lo suyo. Solo Canelo se rasca la llama de la cola, que está baja [TEMP-P3] |
| c73–81 | **El pad solo** | Canelo se duerme recargado en el haz. **Su llama baja sola** mientras duerme (v2-i). Luzterna lo mira, no lo despierta, y tararea el pad en voz bajita. (Nada de bufanda, de linterna que baja, de frío ni de sombra [TEMP-P1, P3]) |
| c81–105 | Tutti | Los gatos se van durmiendo uno a uno; luciérnagas; el remolino gira lento |
| c105–115 | Cierre (songstarter, luego pad solo) | Todos dormidos. El faro barre suave. La pintura se vuelve lienzo craquelado y se funde |

- **Pistas y señales** [TEMP-P1, P3]: **ninguna de ella**. Señales de Canelo: Cronos sin que nadie voltee (C13), la llama que baja sola (v2-i), el pescado «para mañana». La profecía apunta a la bufanda de Canelo, que se le caerá en H93.

### Final

#### F31 · PP «Se acerca una luz» (H93)

- **Estilo:** **realismo con tormenta**: luz natural, viento, lluvia de verdad (gotas, salpicaduras, charcos que reflejan), relámpagos, **cámara en mano**, poco foco. **Por qué:** es la primera vez que la Parte III deja de ser dibujo. El mundo se vuelve real porque lo que viene es real.
- **Pantalla:** **panorámica 2,39:1** con barras de cine que entran despacio.
- **Luz:** noche de tormenta; el faro azul de la linterna; relámpagos.
- **Duración:** 60 s. **Música:** `fut.jefe` grave con la tormenta encima. **Nada de SADIE ni de un tema triste.**
- **Contenido:**
  - DÓNDE: tu isla, de noche, como nunca la habías visto: real.
  - Itō llega solo, empapado, por la gatera: «Vienen esta noche. Por los ojos del gato» (C14). «No voy a pelear contra ellos. Tampoco con ustedes.»
  - En el cielo, **hilos** que crujen; un barco de tinta en el horizonte.
  - RIVAL: **Cruceta y Firma** en el asedio (2 barcos); hay que hundir los dos.
  - LO QUE ARRIESGAMOS, con la letra de Luzterna, la tinta corrida por la lluvia: «A Canelo. A Cerito. La isla no: esa no se la damos a nadie.» **No se anota.**
  - Itō se va. Antes se inclina **solo ante Canelo**, hondo, como ante alguien que va a pelear su última pelea. A nadie más [TEMP-P3].

#### F32 · PH «La caída» (H93, cierra la batalla) [TEMP-P5]

- **Estilo:** **realismo que continúa F31 a propósito**: misma noche, misma cámara. **Pantalla:** 2,39:1. **Duración:** ~30 s. **Clics:** 0.
- **Música:** la de batalla se adelgaza → **corte total** cuando se apaga la llama. **La batalla termina en silencio, sin pantalla de victoria.**

| # | Qué se ve | Qué se oye y se lee |
|---|---|---|
| K1 | Fase 1 ganada. El barco de tinta. La Mano baja y **mira a Canelo** | La música de batalla se adelgaza |
| K2 | La uña-plumín empieza el trazo hacia Canelo | **LA MANO:** «Lo sostiene tu mirada, gato. Ciérrala.» |
| K3 | Luzterna levanta la linterna: **la burbuja de *te ODIO*** (misma forma, mismo cian) cubre a Canelo y a Cerito | **LUZTERNA:** «Al gordo no.» [TEMP-Q7] |
| K4 | **El trazo rodea la burbuja** como letra que da la vuelta a la página y alcanza **la punta de la cola de Canelo, que quedó fuera de la luz**. **La llama se apaga** | **Silencio total** |
| K5 | Canelo cae de lado. **Su bufanda se le resbala y queda en el suelo.** No se levanta. La cámara se queda en la bufanda (la profecía de Cronos, cumplida delante del jugador) | Solo la lluvia |
| K6 | La Mano se retira a su barco sin una palabra. Fundido a negro | — |
| K7 | La Bitácora: en la tarjeta de H93, CAMBIÓ, con la letra de ella, temblando | **«SIN LLAMA.»** |

#### F33 · PH «La noche sin Canelo» (H94) · escena interactiva sin reloj [TEMP-P5]

- **Estilo:** **nocturno de casa**: la pintura del juego, sin filtros, luz de faro y luna; la lluvia ya paró. **Por qué:** después del realismo, la casa de siempre… con un hueco.
- **Pantalla:** a sangre (casa). **Música:** **ninguna**; mar y faro. **El tema de Canelo no suena.**
- **Interfaz:** la casilla de Canelo en la tripulación, **gris y vacía**; su ficha en la Bitácora: **«SIN LLAMA»**, con la letra de ella. Nada más cambia.
- **Interacción:** sin reloj. El jugador puede tocar a los gatos que se acercan a Canelo, uno a uno; cada uno hace **un gesto** (Hipólito le deja su tarro al lado; Homiau, su dona; Grafitera le pinta una llamita en una piedra; Maneki barre alrededor para que no le caiga arena). Cerito se acurruca junto a su cola.
- **El beat de Luzterna:** **intenta prenderle la llama con su linterna**: acerca el haz a la cola, una vez, otra. **No alcanza.** Se queda sentada junto a él, sosteniendo la luz sobre Cerito toda la noche (es lo que La Mano mira desde su barco).
- **La Mano vigila** [TEMP-R1]: desde su barco, un plano subjetivo del cono que termina **en los ojos cerrados de Canelo**; ella entrecierra los ojos **mirándolo a él**. (Se quitó la cámara que bajaba hasta la espalda de Luzterna: delataba.)
- **Interacción** (pasada 5): gatos, la bufanda caída y la casilla gris, tocables **desde el segundo 0**; el faro da un pulso débil antes de los 90 s.
- **El recado, completo, a quien no lo oye** [TEMP-Q10, S2]: Luzterna se inclina sobre Canelo caído: «Gordo… tu bufanda… siempre me… …me pareció horrible.»
- **Cuando el jugador decide seguir** (toca el faro, desde los 90 s), el cielo empieza a aclarar → F34. Guion completo: `guiones/final/h94-sin-llama.md`.

#### F34 · PH «Antes del amanecer» (H94) · el regreso, el alivio y el golpe [TEMP-P5, P6, v3 §11.5]

- **Estilo:** **realismo de madrugada**: el cielo pasa de azul noche a gris claro; la primera luz entra de lado. **Pantalla:** a sangre, que se cierra a 2,39:1 en el golpe.
- **Duración:** ~90 s. **Clics:** 0.

| # | Qué se ve | Qué se oye y se lee |
|---|---|---|
| A1 | Cerito, que pasó la noche en el haz, se levanta, camina hasta la cola de Canelo y **la toca con la nariz** | Silencio |
| A2 | La chispa de Cerito se apaga; **Luzterna pone la linterna junto a su nariz y, juntos, la llama vuelve, chiquita: queda al 30 % para siempre**; **un vidrio de la linterna se queda negro para siempre**; Cerito se queda temblando sin estática [TEMP-Q8, pasada 7]. Ella sopla el vidrio, se encoge de hombros: «Me debes un vidrio, gordo.» Canelo abre los ojos. Luzterna le pone la bufanda con el haz [R2]. **El barco leva anclas y se va, de espaldas y a contraluz, sin que se vea la proa**; los gatos lo abuchean [R4, S1] | Un acorde: **vuelve el tema de Canelo** (derivado); cadena y gaviotas |
| A3 | **El alivio, 30–60 s de verdad**: Canelo se levanta, se estira, se come un pescado entero; la casilla de la tripulación **se enciende**; la ficha vuelve a decir su nombre. Luzterna se ríe, llora de risa, lo regaña flotando a su alrededor | **LUZTERNA:** «¡Gordo! ¡Me diste el susto de mi vida! ¡Nunca más te mueres sin avisar!» · Canelo maúlla (en casa no habla) |
| A4 | Los gatos se le echan encima. Cerito ronronea. Por primera vez en toda la noche, la isla suena a casa | El tema de Canelo, completo |
| A5 | *(Opcional: desayuno jugable de 2–3 min en la playa, R8.)* Luzterna levanta la linterna sobre todos: la burbuja envuelve a Canelo y a Cerito y **su espalda queda en sombra**, por primera vez a la vista [TEMP-Q3]. **La Mano se levanta de una gota de tinta en la orilla** (no se fue con el barco) [S1] | (el tema sigue, más bajo) |
| A6 | Primer plano de La Mano | **LA MANO** (en voz baja): «La luz cuida lo que alumbra. A quien la carga, no.» |
| A7 | **El trazo cambia de rumbo en cuadro**: de Canelo a **la sombra de su espalda**, **con el cenital y el rasgueo de H93** [R6] | **LA MANO:** «…Entonces la luz primero.» · el tema se corta |
| A8 | Luzterna, de espaldas, todavía regañando a Canelo, **a media broma que no es la regla** | **LUZTERNA:** «…y tú, si te vuelves a morir, te mato—» |
| A9 | **El trazo cruza la burbuja, la linterna y a ella.** Se queda en el aire | Ella mira el tachón que la atraviesa: **«…Ah.»** |

→ Sin corte: el primer acorde de SADIE.

**Notas de dirección:**
- **La regla de H67 no se repite** (indicación del coordinador; TEMPERATURA P6 lo dejaba al dueño). Que ella no creía que pudiera pasarle se entiende por el «…Ah.» y, en SADIE, por «Qué cursi».
- **Pasada 7 · deuda falsa pagada:** sola, su luz no alcanza (F33); con Cerito, sí, y **paga un vidrio** que se queda negro en todos los planos siguientes. Ella sigue y se burla del precio. Así el alivio se lee como **cuenta saldada**, no como sacrificio pendiente. Guion: `guiones/final/h94-sin-llama.md` A1b–A4b.
- **Ninguna línea ni objetivo dice «protégela», «sálvala» ni «aguanta».**

#### F35 · PC SADIE «Linterna mágica» (H94) · completa · el arco incremental

**Guion compás por compás (fuente de verdad): `guiones/final/h94-sin-llama.md`, F35, planos S1–S22**, sobre `../musica-v2/sadie.md`.

- **Estilo:** **linterna mágica**: placas circulares de vidrio pintado a mano, anilinas translúcidas, borde de latón, cambio de placa por deslizamiento lateral. **Es la linterna de Luzterna proyectando sus recuerdos mientras se apaga.** El resto, en el realismo de madrugada, congelado.
- **Pantalla:** sobre el 2,39:1, un **iris circular** que **crece en los tres escalones de las cuerdas** (c5, c9, c17) y se cierra al final. En c29–33 la imagen **se lava** (pierde graves y color; no explota).
- **Placas, en orden de vida:** c1–5 **la niña con la vela** al pie del faro de su papá (con la silueta de Luzterna; la llama de la vela se funde con la de la linterna, R9c) · c5 **la torre** la noche del rasgado (Q6: primera vez que se ven) · c5–9 la Parte I · c9–17 la Parte II · c17–25 la Parte III, cada vez más rápidas · c25 **una sola placa: la foto que elegiste en H90**.
- **Clics (3), «RECUERDA», antes de la calma, cada uno con algo que hizo el jugador:** c9 (H48), c17 (H67), c21 (H73). Ninguno en la muerte.
- **Momentos:** c9–13 «No la voy a soltar, Capi. Esta vez no es que se me olvide.» · c13–17 «¿Esto es lo que ve la gente cuando se muere? …Qué cursi.» (su último chiste) · c17–25 **ella detiene a Canelo con el haz**, lejos de la tinta · c25 baja el haz, Canelo llega, ella **se arrodilla** (toca el piso por primera vez) · c25–29 «Cuida la página, gordo. Y no te la comas.» · **c29 la linterna se rompe y de su manga cae la bufanda que tejía a escondidas** · c33 Canelo maúlla · c37 corte seco: negro · los ojos de tus gatos.

#### F36 · PH «MIRA» (H94, fase «A oscuras»)

- **Estilo:** **visión de gato**: paleta de dos colores (azules y amarillos, rojos apagados), **lo oscuro se ve claro**, campo muy ancho. **Por qué:** es el pago de «los gatos ven en la oscuridad» (Murciégato en H77, la visión nocturna en H78 y **los ojos que guiaron a Luzterna en H85**).
- **Fase «A oscuras»:** sin PP (ya es el duelo). **Corta (3 turnos) y sin derrota posible**, o solo el toque de «MIRA» sin batalla [TEMP-R9b]. **SADIE no se repite**.
- **Duración:** 25 s. **Clic (1):** «MIRA» sobre Canelo en el turno 3; si no toca, Canelo mira a los 4 s.
- **Contenido:** la cámara entra en los ojos de Canelo: la isla a oscuras se ve como de día; Cerito, claro, sin estática; **elige pelaje**: gris perla con el cero en la frente. Los ojos de todos tus gatos se encienden; La Mano se queda quieta.

#### F37 · PH «La Mano» (H95) [TEMP-P8, Q9, Q11]

- **Estilo:** **tinta que se borra**. **Duración:** ~75 s. **Música:** nada. Guion: `guiones/final/h95-lo-que-no-se-ve.md`.
- **Contenido:** Canelo recoge del suelo **la bufanda que ella tejía** y se la pone encima de la suya · **ajuste de cuentas mudo**: Canelo se planta frente a La Mano y **los ojos de todos tus gatos** la miran en la oscuridad; ella baja la cabeza [Q11] · Cerito la huele; ella levanta la uña para tacharlo: **la tinta se vuelve gris y el trazo no deja marca** [S4] · **su ficha se borra con el mismo efecto que la de Itō en H81: primero «Antes: una mano», al final su nombre** [Q9] · «Lo vi. Lo vi en la oscuridad.» · llegan Borrón (sin hipo) e Itō (sin espada); Borrón: «Así le pasó a Itō. El que ve ya no puede tachar.» [R9a] · gira **la linterna rota** sin saber prenderla y **la deja en el escalón del faro** · se van por la gatera.

#### F38 · PH «La vigilia» (H95)

- **Estilo:** **plano secuencia** sin cortes, realismo: la cámara rodea el faro despacio mientras la noche se vuelve amanecer. **Pantalla:** 2,39:1 que **se abre a sangre** con la primera luz.
- **Duración:** sin reloj. **Música:** «Antes de la luz» (MÚSICA: el piano limpio de SADIE c33–37 estirado ×1,5) o nada.
- **Interacción:** tocar a cada gato; cada uno tiene **un gesto**, no una línea (`../08` §5.1). Vuelven las decisiones pequeñas: la cobija de F12, la foto de F27 en el escalón, la canción del karaoke bajito desde la rocola rota.

#### F39 · PH «El recado» (H96) · créditos · «Continuará»

- **Estilo:** **la pintura del juego**, sin filtros, con la luz naranja de Canelo.
- **Contenido:** el recado de la Parte I, tal cual, con el aviso «Te lo pidió hace mucho. Antes del Primer Mar» · debajo, en gris, **lo que ella le dijo en H94, cuando él no podía oírla**: «Gordo… tu bufanda… siempre me… …me pareció horrible.» [TEMP-Q10, S2] · botón **«DÍSELO»** (el único clic) · «Dice que tu bufanda siempre le pareció horrible. Con cariño.» · Canelo, que ya trae su bufanda puesta desde H95, hunde la cara en ella; se acuesta; se levanta; **pone la linterna rota en el estante** · sube al faro y lo **prende con la llama que Cerito le devolvió**: luz naranja, no la de ella · **sin texto** [TEMP-N12] · Canelo se duerme sobre la página · **créditos**: el piano limpio de SADIE (c33–37) sobre la Carta que ella dibujó · negro · el sonido de un lápiz · la mano del Capi escribe abajo de la Carta, chiquito: **«Continuará.»** Sin música.

#### F40 · PH «La última ronda» (H97)

- **Estilo:** **la caricatura de la Borracha sin risas grabadas**: mismos colores pero lavados, luz de día, ningún rebote de goma.
- **Pantalla:** **4:3** otra vez. **Duración:** 60 s. **Música:** nada.
- **Contenido** (`../08` §5.2): La Última Ronda de día · La Mano sola en una esquina con el trago del olvido, sin tocarlo · Homiau en la barra **no se come su dona** · Hipólito despierto · Doña Espuma le sirve a Canelo el trago y se lo empuja · Canelo lo aparta despacio; el vaso cae solo por el borde (el sonido de la Parte I) · CANELO: «Ella siempre venía a buscarme.» · HIPÓLITO: «¿Y luego?» · CANELO: «Luego me acuerdo de ella. Todos los días.» · Canelo se va; La Mano no se toma el vaso · fundido → post-juego, en silencio. **(La regla de H67 no se repite aquí.)**

---

## 4. Música derivada para las presentaciones y escenas (con las «islas» de MÚSICA)

**Regla del dueño:** reducciones y variaciones con el **material propio** de cada canción, sin timbres extraños pegados. MÚSICA propone usar **islas** (compases donde la canción ya suena despojada en la mezcla): `../musica-v2/00-LEEME.md` §6. Asignación:

| Pieza (MÚSICA) | Sale de | Para |
|---|---|---|
| «Desde la calle» `drunck.barra` · «Bajo la almohada» `drunck.resaca` · `drunck.battle` | Drunck (ya existen) | F01, F02, F03, F04 |
| **«El público espera»** | EM%EN c1–9 (coro, stab, guitarra; sin batería) | F05 |
| **«Antes de caer»** | OH SHIT c37–45 (textura y melodía picada) | F07 |
| `fut.vineta` | Por componer | F09, F10, F11 |
| **«Pad de la noche»** | xti c1–8 / c73–81 (pad solo) | F12 |
| **«Calle fría»** | Daria c9–17 (piano + shimmer, sin voz) | F13, F14, F15 |
| `nowey.melodia` | No wey | F18 |
| `fut.fosa` | Ya compuesta | F19, F20 |
| **«Lo que no dije»** | No wey c45–49 (la melodía sola, ×2) | F22 (la presentación de su batalla) |
| **«Señal rota»** | DISTOR c1–5 (808 + sinte, sin batería) | F24 y la cola de F23 (el puente No wey → DISTOR) |
| `xti.gira` | xti (tutti) | F26, F27 |
| **«PRESS START»** | NO G@ME c1–3 (arpegio + 808) y c53–57 (piano + 808) | F28 |
| `fut.jefe` | Ya compuesta | F31 |
| El tema de Canelo (derivado; MÚSICA decide la fuente) | — | **Ausente** en F33; **vuelve** en F34 |
| **«Antes de la luz»** | SADIE c33–37 (piano limpio) ×1,5 | **Solo** F38 (vigilia) y créditos. **Nunca en F31 ni antes del golpe**: anunciaría la muerte |
| **Piezas propias** | — | F17 (órgano y cuerdas graves), F21 (laúd y cuerdas) |

**Prohibido:** que una PP use la original completa; que nada antes del golpe suene a SADIE.

**Transiciones entre películas** (MÚSICA §3.2): **No wey → DISTOR** es la más suave (F♯m las dos, tempo 3:2): se usa en la cola de F23. **DISTOR → NO G@ME** comparten el loop «Future Flu»: el *glitch* de F29 es la misma textura que en F25. **NO G@ME → xti** va de F♯m a F♯ mayor: el tramo jugable entre F29 y F30 termina en silencio y xti entra por su pad solo. **xti → SADIE** chocan a propósito: entre las dos hay dos capítulos (H93 y la noche de H94).

---

## Preguntas para TEMPERATURA

**Pasada 3 aplicada** (P1–P8 y §3.4). Para la ronda C:
1. **F33, la noche sin Canelo**: sin reloj, con gestos de los gatos y Luzterna fallando con la linterna. ¿Hace falta un mínimo (2–3 minutos) antes de poder seguir para que «me lo crea»?
2. **F34**: ¿el alivio de 30–60 s con el tema de Canelo de vuelta baja la guardia, o el cazador lo lee como «calma antes de la tormenta»?
3. **F35 c29**: la bufanda que cae de su manga, sin terminar del todo. ¿«Sin terminar» suma (no le dio tiempo) o resta (regalo póstumo de manual)?
4. **F23, la cola con el puente a DISTOR** (Esquirla mirando): ¿gancho que se agradece o un pico más en un acto ya cargado?

## Necesidades para ARTE / MÚSICA / CINE / MECÁNICAS

**CINE** (estilos que pide esta lista; cuáles ya están en `game/src/film/` lo decide CINE):
- Pictóricos: Van Gogh (F30), Leonardo (F21), Caravaggio (F17), Doré (F19), linterna mágica (F35), ukiyo-e (F15), expresionismo (F20).
- Gráficos: teatro de sombras de manos (F02), esténcil (F03), *flyer* fotocopiado (F05), cartel de lucha libre (F07), cómic moderno (F09) y de Edad de Plata (F11), periódico que gira (F10), *yonkoma* (F14), libro desplegable (F18), plano técnico blanco (F22), póster de festival (F26), revista (F28), fotomatón (F27), tinta que se borra (F37).
- Cinematográficos: cine mudo (F04), VHS de cámara (F06), documental con visión nocturna (F12), avance de anime (F13), hilo continuo (F16), noir de un color (F23), señal pirata (F24), *datamosh* (F25), videoclip → videojuego (F29), realismo con tormenta y de madrugada (F31, F32, F34, F38), nocturno de casa (F33), visión de gato (F36), caricatura sin risas (F40).
- Collage multiverso de 11 universos (F08), con un marco por universo.
- **Gramática de pantalla** (`01` §7) y la regla de siluetas (`../13` §2.2) en F02.

**MÚSICA**
- Cortes de fragmento (de MÚSICA): OH SHIT c37→fin (alternativa de MÚSICA, por el suspenso de la puerta; si se prefiere la principal c45→fin, la puerta se abre en silencio antes de la canción), Daria c25→fin, DISTOR c25→fin.
- Las islas de §4 como briefings; el **tema de Canelo** derivado que **falta** en F33 y **vuelve** en F34; el **puente No wey → DISTOR** en la cola de F23.
- Curvas de distorsión de DISTOR y NO G@ME como datos (para el *glitch* de F25 y F29).
- Avisar si el dueño exporta la v284 de SADIE (una capa más en c17–25 y un golpe en c33, justo donde Canelo maúlla).

**ARTE**
- Luzterna en **noir** (F23), en **vidrio pintado** (F35), en **Van Gogh** (F30) y en **realismo** (F31–F35). Canelo en las mismas, más **Canelo sin llama** (gris) y **su bufanda en el suelo** (F32).
- **La bufanda tejida a escondidas**, que solo aparece al caer de la manga de Luzterna (F35, c29), y después en Canelo (F39).
- **La linterna apagada** (H85) y **la linterna rota** en las manos de La Mano (F37, F40).
- Cameos de cajas de paso (`01` §6.4) y rasgos de EMIAU, Homiau, El Lobo, Garbancito, La Gatoconda, Gatzilla, Comecroquetas y los gatos-dioses egipcios.

**MECÁNICAS**
- Las películas que **cierran batallas** (F06, F16, F23, F25, F29) arrancan al ganar la fase 1 y terminan la batalla con `reason: 'momento'`. **F32 cierra H93 sin pantalla de victoria.**
- **H94** es una secuencia: F33 (escena sin reloj, casilla de Canelo gris, ficha «SIN LLAMA») → F34 → F35 (SADIE) → fase «A oscuras» con F36 (MIRA). SADIE nunca se repite al recargar.
- La elección de la cobija (F12) y de la foto (después de F27) se guardan y vuelven en F38 y F35.
