# 04 · Guion del prólogo: el bar, Luzterna y la Carta

Las marcas [DUEÑO], [CANON], [PROPUESTA] y [ABIERTO] significan lo mismo que en `02`.

**Alcance.** H66 (bar + Momento «Drunck» + remate), H67 (salida con Luzterna + despertar de REGISTRO 000) y H68 (la Carta de las Cajas). La primera ruta de la Borracha está en `05` §10. Juntos son la **porción vertical** (`09` §2, etapa 1).

**Datos musicales:** `07` §2. Compases **observados** en el editor de Soundtrap. **Los milisegundos están pendientes** de la mezcla exportada.

## 0. Reglas de este guion

| Regla | De dónde | Cómo se cumple |
|---|---|---|
| Canelo le habla **al otro gato**, no al jugador | [DUEÑO] | Mira siempre a su derecha, fuera de cuadro. Nunca mira a cámara |
| El interlocutor **no se revela antes del remate**: ni nombre, ni retrato, ni subtítulo, ni interfaz, ni encuadre accidental | [DUEÑO] | Hablante técnico **OYENTE**: globo **sin placa de nombre ni retrato**, con la cola saliendo del borde derecho. **La cámara nunca pasa a la derecha de Canelo** hasta el remate. Ningún plano lo muestra de espaldas, en reflejos, en sombras ni en el fondo. **El OYENTE solo dice «¿Y luego?»**, con distinta tipografía cada vez, y eso es parte del chiste (§3) |
| Escena musical psicodélica, **no** diapositivas ni filtros | [DUEÑO] | Transiciones físicas (la espuma se vuelve mar, el letrero se vuelve galera…) y actuación de Canelo dentro de cada recuerdo (`07` §2.3) |
| Canelo habla por primera vez | [CANON: nunca habló] + [PROPUESTA] | En la Borracha todos hablan: es una caja de caricatura (`02` §5.2) |
| Canelo se puede renombrar | [CANON] `personalize()` | El guion escribe siempre «Canelo»; el juego lo cambia. Los demás le dicen «gordo», que no depende del nombre |
| Máximo 4 líneas seguidas sin acción | Regla de la Parte II | Cada bloque tiene su acción marcada |
| Groserías con versión suave | Regla de tono (`SOFT`) | Marcadas como [SOFT: …] |
| Fotosensibilidad | Guardia de la Parte II: ≤ 3 destellos/s | Con «Reducir movimiento», el caleidoscopio y la rotación de tono se cambian por fundidos |

**Hablantes nuevos que hay que registrar** en `ui/story/text.ts`:
- **CANELO**: retrato existente. Solo se usa fuera de casa.
- **HIPÓLITO** y **DOÑA ESPUMA**.
- **OYENTE**: tipo nuevo, sin placa ni retrato.

---

## 1. Cómo empieza (entrada al prólogo)

**Disparo [PROPUESTA].** La partida tiene H65 hecha y ya instaló la versión de la Parte III. Al entrar a la isla:
- La página junto al faro está en modo `rest`: «la marca tibia de un gato» (`o4Pagina.ts`).
- **La marca ya no está tibia:** el vapor que salía de ella se apaga.
- Aparece la misión **H66 «La última ronda»**, con su tarjeta (`03` §3):
  - PASA: «Canelo no está en la página».
  - IMPORTA: «Es la primera vez que se va».
  - QUEREMOS: «Saber dónde está».
  - AHÍ: «Su pelo lleva a una gatera junto al faro».

**Acción:** tocar la página. Un pelo naranja se levanta con el viento, entra por una **gatera** chiquita en la base del faro, la cámara la sigue y se oye un vaso. **Corte a negro → escena A.**

---

## 2. Escena A · Antes de la canción (bar en silencio, ~40 s)

**Lugar:** La Última Ronda, de noche, con lluvia de caricatura. **Estilo:** caricatura de TV de la Borracha (`06` §3).

**Sonido:** murmullo de bar, refrigerador y lluvia en el vidrio. **Sin música.**

| # | Plano | Acción | Diálogo |
|---|---|---|---|
| A1 | Exterior. El letrero de neón «LA ÚLTIMA RONDA»: la A final parpadea | Un gato sale volando por la puerta, se levanta y vuelve a entrar | — |
| A2 | Interior, plano medio de Canelo **de perfil, mirando a la derecha**. Panza contra la barra, tarro enorme. Al fondo, Doña Espuma limpia un vaso | Canelo abraza su tarro | **CANELO:** Tú no me juzgas. Por eso te quiero. |
| A3 | Igual. A la derecha del cuadro hay **un segundo tarro** (solo el vidrio y la espuma, sin pata) | Canelo voltea hacia la derecha, fuera de cuadro | **CANELO:** ¿Que qué hago aquí? Vine a olvidar, compa. A eso viene uno a un bar. |
| A4 | — | Globo sin nombre que entra por el borde derecho | **OYENTE:** ¿Y luego? |
| A5 | Primer plano de Canelo, ofendido | — | **CANELO:** ¿Cómo que «y luego»? ¿No sabes quién soy? …No, no sabes. Mejor. Aquí nadie sabe nada. Por eso me gusta. |
| A6 | Plano detalle de la barra | Doña Espuma desliza otro tarro; Canelo lo atrapa con las dos patas sin mirar | — |
| A7 | Plano medio | — | **CANELO:** Va, te lo cuento. Pero rápido, que se me calienta. |
| A8 | Contrapicado desde el fondo del tarro, a través del vidrio y la cerveza | **Canelo da un trago larguísimo.** El fondo del vaso se acerca a cámara | → **c1: empieza «Drunck»** |

---

## 3. Momento «Drunck» · Hoja de coreografía (c1–c49, 1:09,8)

**Estilo:** «PSICODELIA DE TABERNA» (`07` §2.3):
- el presente es caricatura de TV;
- la Parte I, portadas animadas del *Diario del Mar*;
- la Parte II, el estilo de su Momento.

**Globos de Canelo:** de 1 a 4 palabras, en el tiempo fuerte. **Globos del OYENTE:** solo en los compases de respiro (c16 y c32).

### 3.1 Intro, c1–9 (0:00–0:11,6) · «El trago»

La canción tiene **golpes de bombo sueltos**: son **hipos**. El *sweep* del sinte, de 238 Hz a 9 kHz, es la cámara que **cae dentro de la cerveza** y se aclara.

| Compás (OBSERVADO) | Imagen | Globo | Input |
|---|---|---|---|
| c1 (bombo) | ¡HIC! Todo el bar salta un cuadro. Las etiquetas de las botellas se vuelven **páginas en blanco** | «¡HIC!» | Tap «¡HIC!» |
| c2,875–c3 (bombos) | Dentro del tarro, ámbar y apagado. **Las burbujas suben como estrellas** (guiño a la apertura de la Parte II) | — | Tap «¡HIC!» en c3 |
| c4,75 (redoble) → c5 | La espuma de arriba se riza como olas. En c5 aparece en ella **una balsa diminuta** | «Yo dormía.» | Tap «¡HIC!» en c5 |
| c6,875–c7 | Brota una palmera y una caja; dentro, **Canelo bebé dormido** | «En una caja.» | Tap «¡HIC!» en c7 |
| c8,75 (redoble) | La cámara se mete a la caja. El filtro casi abierto: todo se ve nítido | — | — |
| **c9 (entra el bombo continuo)** | **La espuma revienta y se vuelve mar abierto** | — | **Tap «¡SALUD!»**: perfecto = choque de tarros y una ola de espuma enorme; fallo = la espuma se derrama, triste. El mar llega igual |

### 3.2 Drop A, c9–17 (0:11,6–0:23,3) · «La Parte I, en primera plana»

**Estilo:** grabado sepia del *Diario del Mar*. Cada compás, una **portada** cae de golpe en el tiempo fuerte. Su grabado se anima y Canelo aparece **recortado en caricatura, pegado en cada foto**: está en todas y siempre en primer plano.

| Compás | Portada | Lo que aclara | Globo |
|---|---|---|---|
| c9 | «¡EXTRA! UNA MUERTA DESPIERTA A UN GATO» (Luzterna fantasma sobre la caja) | Quién es Luzterna | «Una muerta me despertó.» |
| c10 | «¡UN PATO PIRATA ATACA UNA BALSA!» (el Patito Pirata, H05). **Este es «el pato» del remate** | — | «¡Un pato!» |
| c11 | «EL CAPITÁN BIGOTES ROTOS, HUNDIDO» | — | «¡Pirata!» |
| c12 | Doble portada: «LA GÁRGOLA RONRONEA» / «KRAKEN ABRAZA BARCO» | — | «¡Piedra! ¡Pulpo!» |
| c13 | «EL ARCANISTA ROBA PÁGINAS DEL ARCHIVO» | Hay un Archivo; se arrancan páginas | «¡Ratero!» |
| c14 | «CAE UNA ESTRELLA: "ALGO ME EMPUJÓ"» + en un recuadro, el Barco del Vacío con su estática ilegible | Los dos hilos que la Parte II paga | «¡Estrella!» |
| c15 (la percusión sube) | «EL LEVIATÁN Y LA NIEBLA: "YO NO DESTRUYO: BORRO"» (Distraxia) | Distraxia borra | «¡Niebla!» |
| **c16 (respiro, MEDIDO: graves −19 dB)** | La portada se pone negra. Letras blancas: **«NO ONE LIKES CATS.»** Silueta de Nadie. Debajo, en chiquito: «…Mentira.» Distraxia se vuelve **una hoja en blanco** que flota | El final de la Parte I | **OYENTE:** «¿Y luego?» · Canelo: «La hoja.» |

**Input:** taps «¡EXTRA!» en el tiempo fuerte de c11 a c15. Perfecto = la portada cae con polvo y sello «¡VISTO!»; fallo = cae chueca. Son 5 taps.

### 3.3 B, c17–25 (0:23,3–0:34,9) · «Oleadas 1 y 2»

Entran el ride y los hats: **todo brilla**. Cada 1–2 compases cambia el estilo, con una transición física.

| Compás | Imagen y estilo | Transición | Lo que aclara | Globo |
|---|---|---|---|---|
| c17–18 | Noche astral: estrellas que caen hacia arriba. **La ficha REGISTRO 000** entra al Catdex con *glitch*; en los hats se escribe **F·O·L·I·O** | La hoja en blanco de c16 se vuelve la ficha | Alguien está archivando; el Capi es el folio 001 | «Una ficha. Antes del uno.» |
| c19–20 | **TINTA Y PERGAMINO** (WHEN I LOSE): la cerveza derramada en la barra se vuelve **sumi-e**. El Bibliotecario bajo el agua: «Shhh» | Derrame → tinta | Distraxia era el olvido; ahora alguien escribe | «¡Shhh!» (Canelo hace callar a todos) |
| **c21** | Una página: **«CANELO, ALMIRANTE DE LA FLOTA GATUNA»**. Canelo con sombrero | La página sale del sumi-e | Su Eco y su forma | «¡HUNDÍ CUARENTA BARCOS!» |
| c21 (input) | **Elección «¿CUÁNTOS?»: 3 / 40 / 1 000.** Con 3, tres barquitos tristes. Con 40, una flota. Con 1 000, **el mar entero son barcos** y Canelo camina encima | — | (Exageración) | Después: «…Más o menos.» |
| c22 | **Blanco perfecto:** un barco blanco que atraca sin hacer olas; en la vela, «—N.» | Los barcos de la elección se blanquean | Los Correctores; «—N.» era Normal | «¡Normal! ¡Guácala!» |
| c23 | **NEÓN CEL** (LIKY FIGHT): el letrero de neón del bar **se vuelve la galera de fiesta** de Cascada y el bar sube al cielo | Letrero → galera | El cielo: islas invertidas | «¡Fiesta en el cielo!» |
| c24 | Corona Celeste: una ciudad blanca de gatos que ronronean en fila. El embajador le muestra a Canelo el folleto «CANELO 2.0 — SIN IMPACIENCIA». Canelo lo rompe. Un almirante blanco con el Leviatán en tiza detrás | — | Querían «corregirlo»; el Leviatán obedecía a los Correctores | «¿¡Corregirme A MÍ!?» |
| **c24,649 → c25 (corte del bombo, 0:34,40; ~0,5 s)** | **Cuadro congelado:** el faro de tu isla de noche; **el haz de la linterna sale hacia afuera**, más allá del cielo. Silencio | — | **La linterna manda una señal** (eslabón 9 de la cadena, `02` §3) | «La luz…» |

### 3.4 C, c25–33 (0:34,9–0:46,5) · «Oleada 3: la más llena»

El build-up suena **encima** de toda la batería. Cortes cada compás y la saturación al máximo.

| Compás | Imagen y estilo | Lo que aclara | Globo |
|---|---|---|---|
| **c25** | Puerto Cometa, retrofuturo con scanlines. Kanji «同期» y un rayo que salta de módulo en módulo | La SINCRO | «¡SINCRO!» · **Tap «¡OTRA!»**: una pata de Doña Espuma desliza un tarro *dentro del recuerdo* |
| c26 | La remolcadora jala un planetoide con un cable de luz. En la bitácora, una orden escrita al margen | La Estrella la empujó un Titiritero para salvar otra caja | «La empujaron. Por otros.» |
| c27 | Canelo Astral rompe el sello. Plano subjetivo: **en el peñasco, un gatito de estática** que solo él ve | **Canelo ve a REGISTRO 000** | «Yo lo veo. Nadie más.» |
| c28 | Maneki barre cajas con su escoba; una ficha: «PACIENTE: un mundo con gatos · ESTADO: sanando» | El Archivo es un hospital | «Es un hospital.» |
| c29 | **GRAFITI Y SEÑAL ROTA** (te ODIO): en la puerta del baño del bar aparece «NINGUNA CAJA ES HOGAR» con spray y se agrieta | Los Disruptores | «¡Grafiteros!» |
| c30 | La bitácora de Puerto Cometa: tu firma y, al margen, la misma letra | Tu letra | «El Capi escribe bonito…» (lo dice con desconfianza) |
| c31 | **COLOSO / GRABADO** (Hemkade): el Leviatán de cabeza, envuelto en cadenas con órdenes. **Canelo rompe solo una cadena** (en su versión, solo él) | Las órdenes de los Correctores | «¡Yo solito!» |
| **c32 (respiro, MEDIDO: graves −20)** | El Leviatán, libre, se va nadando. La grieta astral **respira**; del otro lado se ve el borde de una página | — | **OYENTE:** «¿Y luego?» · Canelo: «Luego… se puso raro.» |

### 3.5 Sin sintes, c33–41 (0:46,5–0:58,2) · «Oleada 4: el borde»

Solo batería (ride, hats, bombo y percusión). La imagen se vuelve **más simple**: aparecen los trazos de lápiz y acuarela de ANIMATIC.

| Compás | Imagen y estilo | Lo que aclara | Globo |
|---|---|---|---|
| c33 | **Acuarela:** todos los gatos de la isla duermen y respiran a la vez; una burbuja de sueño sube | Los Sueños | «Soñábamos lo mismo.» |
| c34 | Ecos: a los gatos les aparecen sombreros, arena y cicatrices que no tenían. **Todas las huellas de los Ecos llevan a una misma isla** | Los Ecos apuntaban a la Isla que Nadie Recuerda (conexión mal explicada en `01` c-7) | «Otras vidas.» |
| c35 | **Foto sepia:** tu isla vacía, sin gatos | La versión donde nunca llegaste | «Esa me dio miedo.» |
| c36 | **Página en blanco con tachones:** «~~Lo siento~~ No me arrepiento» | Distraxia sabía | «Ella sabía.» |
| c37–38 | **FUNCIÓN DE FERIA 1930** (CIRCUS MALUS): la feria simétrica de los Correctores, en blanco y negro. Canelo, en *rubber-hose*, **eructa** y rompe la simetría | El mundo perfecto: nadie elige | «¡BUURP!» |
| c39 | El Umbral: barcos blancos, grafiti que chorrea, hilos de luz y Bisagra, la gata-puerta | Las tres fuerzas | «Tres bandos.» |
| c40 (SEÑAL: respiro, ≈20 dB menos de graves) | La página en blanco baja del cielo y se posa junto a tu faro. Un instante de quietud | — | — |
| **c40,75 → c41 (redoble, 0:57,8)** | **Todos voltean a ver a Canelo**: los Correctores, los Disruptores, los hilos de luz, Bisagra, tus gatos y un globo con la silueta de la mano del Capi. Ojos, ojos, ojos | La presión | **Mash «¡HIC-HIC-HIC!»**: perfecto = Canelo hipa al ritmo del redoble y los ojos parpadean con cada hipo |

### 3.6 Final, c41–49 (0:58,2–1:09,8) · «La página»

El sinte vuelve **cerrado a 716 Hz**: estamos **dentro de la cabeza de Canelo**, todo apagado. Se abre entre c46,4 y c48.

| Compás | Imagen | Globo |
|---|---|---|
| c41 | Canelo acostado sobre la página. **Las noches pasan una por tiempo**: día, noche, día, noche | — |
| c42–43 | Alrededor de la página, cada fuerza deja una burbuja de pensamiento: «¿PERFECTO?» (Correctores), «¿ROMPERLO?» (Disruptores), «…» (hilos de luz). **La burbuja del Capi muestra lo que el jugador eligió en H64** (`mentira:*`): «UN MUNDO PERFECTO», «ROMPAN TODO» o «NADA». Si no hay elección guardada: «…» | «Todos miran.» |
| c44–45 | Los ojos se multiplican en caleidoscopio (el fondo del vaso). La página pesa y se hunde | «Todos esperan.» |
| c46 | La cámara se acerca a la cara de Canelo | «A mí.» |
| **c46,4–47 (se abre el filtro; SEÑAL: termina en c47, 66,9 s)** | Todo se acelera y satura: espiral psicodélica. **Canelo se levanta de la página** (queda la marca tibia) y salta por una gatera. Cae por la gatera como por un tobogán de colores | — |
| **c48 (respiro, sin bombo)** | En cámara lenta, Canelo aterriza en el banco del bar, en caricatura | «Me fui.» |
| **c49 (corte seco)** | **Tap «¡PUM!»**: Canelo golpea el tarro vacío contra la barra. **Silencio total.** Vuelve el bar normal | — |

**Inputs del Momento:** 4 «¡HIC!» + 1 «¡SALUD!» + 5 «¡EXTRA!» + 1 elección + 1 «¡OTRA!» + 1 mash + 1 «¡PUM!» = **14**. Ninguno cambia el resultado (regla de los Momentos).

**Verificado en la señal** (`investigacion/audio-real.md` §4): respiros en c16, c32, c40 y c48, el corte en c24,649 → c25, el redoble de c40,75 y el filtro que termina en c47. **Lo que todavía falta oír con oído humano:**
- el milisegundo de cada bombo suelto de la intro;
- que c16, c32 y c48 suenen de verdad como respiros (con la reverb del máster);
- la cola después del corte de c49.

---

## 4. Escena B · Después de la canción (bar en silencio, ~70 s) y remate

**Sonido:** el refrigerador, la lluvia y un ronquido **muy** bajito que todavía no se identifica.

| # | Plano | Acción | Diálogo |
|---|---|---|---|
| B1 | Plano medio de Canelo, despeinado | Respira | **CANELO:** Y eso fue lo que pasó. |
| B2 | — | — | **OYENTE:** ¿Y luego? |
| B3 | Primer plano | — | **CANELO:** ¿Luego? Llevo no sé cuántas noches encima de esa hoja. Todos esperando que yo decida. ¡Yo! Que no sé decidir entre pescado y pescado. |
| B4 | Detalle | Se come una papa del platito; se le cae media | — |
| B5 | Plano medio | — | **CANELO:** Los blancos quieren un mundo sin errores. Los grafiteros, romper todas las cajas. Las manos de luz escriben y no dan la cara. Y el Capi… |
| B5′ | — | Variante según `mentira:*` | *perfecto:* «…el Capi quería escribir "un mundo perfecto". Bonito deseo. Me dio miedo.» · *romper:* «…el Capi quería escribir "rompan todo". Le entendí. Pero no.» · *nada:* «…el Capi quería dejarla en blanco. Es el único que me entendió.» · *sin elección:* «…el Capi nomás me miraba.» |
| B6 | — | — | **OYENTE:** ¿Y luego? |
| B7 | Plano medio, Canelo orgulloso | Doña Espuma le rellena el tarro | **CANELO:** Luego me dormí encima. Porque nadie puede escribir debajo de un gato dormido. Esa ley la inventé yo. Bueno, ya existía. Pero la usé yo. |
| B8 | Primer plano; se pone serio | — | **CANELO:** ¿Sabes qué es lo peor? Que ya entendí todo. La niebla borraba para que nadie escribiera encima. La salvamos y le quitamos la goma. Ahora todo se escribe solo. Y yo soy el pisapapeles. |
| B9 | — | Se ríe solo de su chiste. **Nadie se ríe.** Se oye la lluvia | — |
| B9′ | Detalle: la llamita de la punta de su cola, más chica que de costumbre | Se la mira | **CANELO:** Dicen que tenemos nueve vidas. Yo ya gasté como ocho. …Bueno, no sé contar. Igual ya voy en la once. |
| B10 | Plano detalle: su tarro y, a la derecha, el otro tarro con la espuma ya bajada | — | **CANELO:** Y la Luz… su linterna manda señal para afuera. Ella la dejó prendida, porque así es ella: cuida dejando que la vean. |
| B11 | Primer plano, más bajito | — | **CANELO:** …Yo nomás quería una noche sin que nadie me viera. Una noche. ¿Qué puede pasar en una noche? |
| B12 | Silencio de 2 segundos | — | **OYENTE:** ¿Y luego? |
| B13 | Canelo, conmovido. **Por primera vez gira el cuerpo entero hacia la derecha.** La cámara gira con él | — | **CANELO:** Oye… gracias por escuchar. De verdad. Nadie me había escuchado así nunca. |

### 4.1 El remate

| # | Plano | Acción | Diálogo |
|---|---|---|---|
| R1 | **Contraplano, el primero de toda la escena:** junto a Canelo, un gato gordo **con la cara metida en una dona**, dormido sobre la barra, con una burbuja de ronquido que crece y se encoge. Su tarro, ladeado | Pausa larga. La burbuja crece | — |
| R2 | Igual | Sin abrir los ojos, desde la dona | **HIPÓLITO** (dormido): …¿Y luego? |
| R3 | Canelo, inmóvil. Un ojo le tiembla | — | — |
| R4 | Doña Espuma, sin dejar de limpiar el vaso | — | **DOÑA ESPUMA:** No te oye, gordo. Dice «¿y luego?» dormido. Lleva así desde la parte del pato. |
| R5 | Primer plano de Canelo | La cámara hace *zoom* de golpe | **CANELO:** …¿DESDE EL PATO? |
| R6 | **Plano general, cámara lenta** | Hipólito se resbala del banco y arrastra la torre de donas del mostrador. Cae de espaldas con una dona en cada pata y otra en la cabeza como corona. Sigue dormido. La burbuja de ronquido revienta: *pop* | — |
| R7 | Hipólito en el suelo, feliz | — | **HIPÓLITO** (dormido): …¿Y luego? |
| R8 | Canelo se baja del banco tambaleándose | — | **CANELO:** Luego me voy. Apúntamelo, Espuma. |
| R9 | — | — | **DOÑA ESPUMA:** Van catorce. |
| R10 | Canelo, en la puerta | La puerta se cierra; la A del letrero parpadea | **CANELO:** Redondéale a diez. |

**Tarjeta al terminar:** **GATERA DESCUBIERTA · La Última Ronda · Dimensión Borracha**.
- La Bitácora escribe CAMBIÓ: «Se fue a olvidar. Y habla».
- **H66 se cumple. Se desbloquea la posibilidad de ir a la Dimensión Borracha** [DUEÑO].
- El cartel «DEBE 14 RONDAS» vuelve en H69.

**Por qué funciona el remate:**
1. Durante toda la escena, el «¿Y luego?» parecía de alguien que escucha con atención. Al revelarse, cada uno se vuelve gracioso **hacia atrás**.
2. «Desde la parte del pato» le pone fecha exacta: el segundo 13 de la canción.
3. El remate visual (la caída en cámara lenta con las donas) **conserva el hecho**: es un gato borracho, y sigue dormido.
4. Siembra la regla de la caja: **aquí nadie se acuerda de nada**.

---

## 5. H67 · «¿Dónde andabas, gordo?»: la salida con Luzterna

**Tarjeta:** PASA «Canelo anda borracho en otra caja» · IMPORTA «La página quedó sola» · QUEREMOS «Llevarlo a casa» · AHÍ «La gatera de vuelta está al fondo del callejón».

**Lugar:** la calle de La Última Ronda, de noche. **Estilo:** caricatura. **Luzterna también se hornea en caricatura**: es la primera vez que se la ve con otro trazo.

**Música:** `drunck.barra` muy baja, y luego nada.

**Tecnología:** stage `caja` nuevo, o estudio de Momentos sin canción (`05` §11).

### 5.1 La salida

| # | Plano | Acción | Diálogo |
|---|---|---|---|
| L1 | La puerta del bar | Se abre de una patada y Canelo sale rodando | **CANELO:** ¡Y no vuelvo! …Mañana vuelvo. |
| L2 | El callejón | Una luz azul se acerca por el fondo: la linterna | — |
| L3 | Luzterna, en caricatura, flotando con los brazos cruzados | — | **LUZTERNA:** Canelo. |
| L4 | Canelo, en el suelo, mirándola al revés | — | **CANELO:** ¿Luz? ¿Qué haces aquí? Esta caja es de borrachos. Tú estás muerta. No combina. |
| L5 | — | Luzterna le levanta la bufanda con dos dedos como si fuera una correa | **LUZTERNA:** Te seguí el pelo. Dejaste pelo en TRES cajas, gordo. |

### 5.2 La caminata (interactiva, no se puede fallar)

- Canelo camina hacia la gatera del fondo del callejón **en zigzag**.
- **Tocar** lo endereza un paso: Luzterna jala la bufanda.
- Si no tocas, se recarga en un poste y Luzterna lo empuja sola a los 3 segundos.
- Hay 4 tramos. Entre tramos, las líneas:

| Tramo | Diálogo |
|---|---|
| 1 | **LUZTERNA:** ¿Sabes qué hora es? · **CANELO:** La hora de otra. · **LUZTERNA:** Es la hora en que un gato decente está durmiendo ENCIMA DE SU PÁGINA. |
| 2 | **CANELO:** Ya dormí encima. Muchas noches. Me duele la panza de tanto decidir. · **LUZTERNA:** Derecho. DERECHO. Eso no es derecho, eso es una opinión. · **CANELO:** El piso se mueve. |
| 3 | **LUZTERNA:** El piso no se mueve. Tú te mueves. Yo floto. Aquí lo único estable es el piso. · **CANELO:** ¿Y si un día me voy a una caja y no vuelvo? · **LUZTERNA:** Te voy a buscar. Es mi trabajo. Y a mí ya no me puede pasar nada, gordo: ya me pasó todo. · **CANELO:** …Perdón por irme, Luz. |
| 4 | (Luzterna se detiene. Pausa.) **LUZTERNA:** Es la primera vez que te oigo, ¿sabes? Toda la vida hablándote y tú nomás «mrr». · **CANELO:** En casa no se puede. Aquí sí. · **LUZTERNA:** Pues habla más seguido. Aunque sea para pedir perdón. · **CANELO:** No te acostumbres. |

### 5.3 El vínculo (frente a la gatera, sin caminar)

| # | Plano | Diálogo |
|---|---|---|
| V1 | Dos planos, los dos de espaldas, frente a una gatera pintada en la pared con un farito dibujado | **CANELO:** Luz… ¿tú cómo le hiciste? Para cargar esa linterna tanto tiempo. |
| V2 | Luzterna, de perfil | **LUZTERNA:** No le hice. Me morí. No te lo recomiendo. |
| V3 | Canelo la mira. Ella mira su bufanda | **LUZTERNA:** Y esa bufanda… ¿todavía? · **CANELO:** Es mi bufanda. · **LUZTERNA:** Es horrible. · **CANELO:** Por eso es mía. |
| V4 | Ella sonríe sin que él la vea y **se guarda en la manga un hilo suelto** de la bufanda (semilla de `08`: la bufanda que teje) | — |
| V5 | Canelo cruza la gatera. Luzterna mira hacia atrás, al bar, un segundo | **LUZTERNA:** (bajito) Una noche. Ojalá. |

**Siembras de la expectativa «el que puede morir es Canelo»** (`02` §4.8):
- B9′: las nueve vidas «gastadas»;
- D4′: la llama de la cola que baja cuando se rasga la gatera.

**Siembra honesta del final real:** en el tramo 3, Luzterna cree que «a ella ya no le puede pasar nada». Es lo que ella cree, no un truco de la interfaz. Al volver a ver la historia se entiende distinto.

**Lo que siembra la escena:**
- es la primera conversación de los dos;
- el chiste de que ella «ya está muerta» (que se usará toda la Parte III y nunca después de su muerte, `02` §7);
- la bufanda y el hilo;
- «¿qué puede pasar en una noche?», ahora en boca de ella como deseo.

---

## 6. El despertar de REGISTRO 000 (fin de H67, en tu isla)

**Escena en tu isla de noche** (stage `island`). Canelo y Luzterna salen por la gatera del faro.

| # | Plano | Acción | Diálogo |
|---|---|---|---|
| D1 | La página junto al faro | La marca de gato está **fría**: ya no sale vapor | — |
| D2 | Canelo se detiene en seco | **Mira el peñasco** donde estaba REGISTRO 000: está **vacío** | — |
| D3 | Sonido del Catdex | La ficha se abre sola: «REGISTRO 000 · ESTADO: ~~despertando~~ **DESPIERTO**». La palabra se escribe sola, con la letra de los márgenes | — |
| D4 | Plano de la gatera del faro | **La gatera está rasgada**, con bordes de estática. Unas huellitas entran por ella: no son de gato normal, **se les borran las orillas** | — |
| D4′ | Canelo, de cerca | **La llamita de su cola tiembla y baja** un instante, como una vela con corriente de aire, y vuelve. Nadie lo comenta | — |
| D5 | Luzterna a Canelo | — | **LUZTERNA:** ¿Canelo? ¿Qué ves? |
| D6 | Canelo no contesta (en casa no habla) | Le maúlla, nada más | **LUZTERNA:** …Ya sé. Aquí no se puede. |
| D7 | Arriba | **Del cielo cae una dona** y queda ensartada en la palmera de Canelo | **LUZTERNA:** …¿Eso es una dona? |

**La Bitácora** escribe CAMBIÓ: «REGISTRO 000 despertó y siguió a Canelo».

**Estado del mundo** `p3_rasgadura` (banda 130+): una rasgadura chiquita en el cielo de tu isla, que dura hasta H73.

---

## 7. H68 · «La Carta de las Cajas»

**Tarjeta:** PASA «Hay rasgaduras con huellitas» · IMPORTA «Por ahí se derraman las cajas» · QUEREMOS «Hacer una carta para no perdernos» · AHÍ «La primera rasgadura está en el bar».

| # | Plano | Acción | Diálogo |
|---|---|---|---|
| M1 | Tu isla, mañana. Luzterna en el faro con un cuaderno | Pasa hojas en blanco | **LUZTERNA:** Si mi gato cruza cajas y algo lo sigue, yo necesito una carta. Era farera. Mi trabajo era que nadie se perdiera. |
| M2 | **Pantalla del segundo mapa** (primera vez). El cuaderno se abre y llena la pantalla | **Animación de su mano dibujando:** tu isla al centro, el faro y cinco rasgaduras alrededor con huellitas. Cuatro quedan **en blanco**, con su nota «aquí no he llegado» | **LUZTERNA:** Cinco rasgaduras. Huellitas en todas. Solo una huele a cerveza. |
| M3 | Suena un cascabel. **Maneki** entra barriendo al mapa | — | **MANEKI:** Ay, perdón. Costumbre. ¿Van a cruzar? Las gateras tienen cerradura, y yo tengo las llaves. Barrí cajas mucho tiempo. |
| M4 | — | Maneki saca un llavero enorme | **MANEKI:** La de la cerveza se las abro barata. La escoba no se paga sola. |
| M5 | **UI de compra** (primera vez): precio en oro (`05` §2.2, 15 min de ingreso) | El jugador paga | **LUZTERNA:** (nota en el margen) «Le pagamos a una conserje con llaves. Esto ya es un negocio.» |
| M6 | La rasgadura de la Borracha se cose como una **gatera** | Se abre la región Borracha en el mapa. Aparece el primer nodo, B-1 | **LUZTERNA:** Cada vez que ganes ahí, junta sus huellas. Con suficientes, le sigo el rastro y te dibujo el siguiente pedazo. |
| M7 | La Bitácora se abre sola (primera vez): la tarjeta de H69 | — | (sin diálogo: la tarjeta lo dice) |

**Novedad de sistema de este capítulo:** el segundo mapa. Las huellas se presentan con una línea y la compra con otra. **No se presenta nada más** (`03` §6).

---

## 8. Qué aclara el prólogo de la historia anterior

| Conexión que quedó mal explicada (`01` §c) | Dónde la aclara el prólogo |
|---|---|
| c-1: la premisa (Distraxia era el olvido; ahora alguien escribe) | c19–20 (Bibliotecario) + B8: «le quitamos la goma» |
| c-2: «—N.» era Normal | c22 |
| c-3: quién mandaba al Leviatán; qué son los Fragmentos | c24 (almirante blanco) y c31 (cadenas de órdenes). Los Fragmentos **no** se repiten: no hace falta para la Parte III |
| c-4: los Titiriteros casi no se presentan | c26 (orden al margen) + B5 («manos de luz») + c39. Su presentación de verdad es H70 (Borrón) |
| c-5: los Disruptores | c29 + B5 |
| c-6: FOLIO | c17–18 |
| c-7: Ecos → Isla que Nadie Recuerda → Distraxia | c34–36, en orden y con las huellas uniéndolos |
| c-9: la elección de H64 no servía | c42–43 y B5′: el juego **se acuerda** de lo que eligió el jugador |
| Elección de H48 (la linterna) | c24,649 (cuadro congelado) + B10 |
| La página quedó sola | c46–48: Canelo se levanta + D1 (marca fría) |

**Lo que el prólogo NO cuenta** (y no hace falta): Jonás, Masa Madre, Duermevela, el Kit de Vuelo, el combustible y la Fonoteca.

---

## 9. Producción de la porción (resumen; detalle en `09` §2)

| Pieza | Arte nuevo | Reutiliza |
|---|---|---|
| Escenas A y B y remate | Hipólito, Doña Espuma, el set del bar (código + caricatura) | La pintura de Canelo con horneado toon |
| Momento Drunck | Set del bar, portadas del *Diario* animadas (código, en el estilo de `ResultsScene`) | **Los 6 horneados de estilo de la Parte II** (`arte-pipeline.md` §4.6) y los gatos y jefes ya pintados |
| H67 | Callejón (código) | Retrato de Luzterna horneado toon |
| Despertar | — | Isla, página, Catdex, estados del mundo |
| H68 | Segundo mapa (código) | `StageNode`, rutas y niebla de `MapScene` |
