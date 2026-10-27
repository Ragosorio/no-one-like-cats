# 02 · Biblia narrativa de la Parte III y cadena causal

> «Siempre quisiste saber qué había afuera de la caja. Los gatos ya lo sabían.»

> **Decisiones del dueño del 2026-10-13 (segunda ronda), ya incorporadas:**
> - las 5 canciones entran;
> - la Parte III **termina** con la muerte de Luzterna;
> - la historia nos hace creer que el que puede morir es **Canelo**;
> - no se revela quién escribió REGISTRO 000 y su origen sigue importando;
> - Multidimensional es una rareza propia;
> - «Fuera de la Caja» queda como título de trabajo;
> - Canelo habla fuera de casa;
> - la Parte IV queda abierta, sin anunciar resurrección.

**Cómo leer este documento.** Cada decisión trae una marca:

- **[DUEÑO]**: lo pidió el dueño en el brief del 2026-10-13. No se cambia sin su permiso.
- **[CANON]**: ya pasó en la Parte I o en la Parte II, en el juego publicado. La fuente va entre paréntesis.
- **[PROPUESTA]**: lo propone el director. Se puede discutir.
- **[ABIERTO]**: decisión pendiente que cambia el alcance. Está listada en `10-estado.md` §4.

Documentos relacionados: auditoría en `01`, actos y capítulos en `03`, prólogo en `04`, mapa y dimensiones en `05`, gatos en `06`, música en `07`, final en `08`.

---

## 0. Nombre y prefijo

| Cosa | Decisión |
|---|---|
| Nombre | **NO ONE LIKE CATS · Parte III — Fuera de la Caja** (título de trabajo) [DUEÑO] |
| Por qué ese nombre | Las cajas son mundos (Parte I), el chiste de «pensar fuera de la caja» y los gatos que viven metiéndose y saliéndose de cajas. La Parte III es la primera vez que **todo** se sale de su caja. |
| Prefijo en código | Módulos en `gateras` (`state/sys/gateras*.ts`, `data/gateras/*.json`). Ids de dimensión con **`p3d_`** (`p3d_borracha`…), porque `anime` y `pop` ya son palabras ocupadas, `DimId` son las 13 dimensiones de las islas de la Parte I y «Parte 2» ya significa dos cosas (ver `investigacion/dimensiones-existentes.md`). Especies multidimensionales con **`x_`**, prefijo libre en todo el juego (`investigacion/sistemas.md` §3.2). [PROPUESTA] |
| Ids de misión | Siguen después de H65: **H66–H99**. El regex de misiones solo acepta hasta H99 (`missions.ts:280`). La Parte III usa 30 misiones principales (H66–H95) y deja H96–H99 de reserva. **Trampa:** `isPart2Mission` toma toda H ≥ 31 (`rupturasLedger.ts:16–25`), así que sin un arreglo las H66+ caerían en el registro de premios y en el reinicio narrativo de la Parte II (`09` §2, etapa 0). [PROPUESTA] |

---

## 1. La idea en una línea

Canelo, cansado de ser «la decisión», se levanta de la página en blanco una sola noche para irse a olvidar. Esa noche, REGISTRO 000 despierta y lo sigue. Al cruzar de caja en caja, va rompiendo las fronteras del Archivo. Todos persiguen al gatito que rompe cajas:

- **los Titiriteros**, que se vuelven gatos para alcanzarlo;
- **los Disruptores**, que lo quieren de bandera;
- **nosotros**, que lo queremos traer a casa.

Al final, los Titiriteros apagan la única luz que lo guiaba: la de Luzterna.

### 1.1 El tema

**Recordar cuesta; olvidar sale caro.**

- La Parte I fue el olvido como villano: Distraxia borraba.
- La Parte II fue la escritura sin permiso: alguien escribía islas con fecha de antes.
- La Parte III es **la consecuencia**. Lo que haces deja marca, aunque te vayas a un bar a olvidarlo.

La Dimensión Borracha es el espejo del tema: una caja de comedia de tele donde **cada mañana todo vuelve a empezar y nadie se acuerda de nada** [PROPUESTA]. Es el único lugar del Archivo donde nada tiene consecuencias. Por eso Canelo se va ahí. Y por eso ahí se rompe primero.

**El arco de Canelo:** empieza la Parte III queriendo olvidar y la termina **negándose a olvidar**.
- En el prólogo pide otra ronda.
- En el epílogo, días después, en el mismo bar, le sirven el trago que borra la noche. **No se lo toma**: lo aparta despacio, y el vaso cae solo por el borde de la barra [PROPUESTA, revisado para respetar el duelo; `08` §5.2].
- Es el vaso que cae. En la Parte I ya se oía un vaso caer cuando Nadie se presentaba (`UNKNOWN_END`, ver `docs/part-ii/03-historia-actual.md` §1).

---

## 2. Dónde quedamos (estado al cierre de la Parte II) [CANON]

| Hecho | Fuente |
|---|---|
| La página en blanco (lo que quedó de Distraxia) está junto a tu faro | `historia-o4.json` b64; `ui/story/o4Pagina.ts` |
| Canelo se durmió encima: «nadie puede escribir debajo de un gato dormido». Fue su primera decisión libre: «todavía no» | b64_mentira |
| **Después de los créditos, Canelo ya no está sobre la página**: queda «con la marca tibia de un gato» | `o4Pagina.ts` `pageModeFor` → `rest` |
| REGISTRO 000 pasó de *observando* a **despertando** | b65_continuara |
| Canelo Astral es **el único que puede ver** a REGISTRO 000 (lo mira en el peñasco vacío) | b53_canelo |
| La linterna de Luzterna manda una **señal hacia afuera** de la caja. Ella eligió dejarla encendida: «Cuidar algo también es dejar que lo vean. Y si alguien viene, que venga» | b48_linterna |
| Luzterna es un fantasma porque **nunca soltó** la linterna; colgarla en tu faro fue «ya solté… me quedo de farera» | `finaleScript.ts` l.29–32 |
| «Si alguien abre otra caja, aquí voy a estar. Con la linterna prendida» | `FINAL_EPILOGUE` l.41 |
| «Si algo me pasa, dile a Canelo que su bufanda siempre me pareció horrible. Con cariño» | `script.ts` `ZONE_INTRO[6]` l.112 |
| Los Titiriteros escriben en los márgenes, construyeron el Archivo como hospital de mundos y nunca dieron la cara: se vieron como una mano de luz con un lápiz (H49) y como hilos que en El Umbral «suben como riendas que alguien suelta» (H63) | b49, b54, b63 |
| Los Disruptores rompen cajas «para que los mundos respiren» y tienen un punto | b55 |
| Tu firma en la bitácora de Puerto Cometa tiene **la misma letra** que una nota vieja al margen | b56 |
| Los gatos son líquidos y pasan de caja en caja por las gateras | b18_archivo (Parte I) |

---

## 3. La cadena causal completa

Cada eslabón tiene **causa → efecto → cómo lo ve el jugador**. Si un eslabón no se ve en pantalla, no existe: es la regla de la Parte II, «si la historia dice que pasa, pasa en el mundo».

| # | Causa | Efecto | Cómo lo ve el jugador |
|---|---|---|---|
| 1 | Canelo lleva noches durmiendo sobre la página. Todos lo miran esperando que «decida». [PROPUESTA] | Se satura | El prólogo lo cuenta él mismo en el bar (`04`) |
| 2 | Los gatos siempre pudieron cruzar cajas por las gateras [CANON b18] | Canelo cruza a la caja más cercana donde nadie espera nada: un bar de la **Dimensión Borracha** [DUEÑO + PROPUESTA] | Momento «Drunck» |
| 3 | Canelo dejó la página | La página queda **descubierta** por primera vez desde H64 | Ya está en el juego: la marca tibia (`o4Pagina` `rest`) |
| 4 | REGISTRO 000 estaba despertando y miraba a Canelo, el único que lo ve [CANON b53, b65] | Despierta del todo **y lo sigue**, como un gatito sigue al gato grande [PROPUESTA] | Fin del prólogo: la ficha tacha *despertando* y escribe **DESPIERTO**; la gatera de Canelo queda rasgada |
| 5 | REGISTRO 000 no es un gato todavía: es **una posibilidad que no eligió ser nada** [CANON doc 13 Oleada 4]. No es líquido como un gato | Al cruzar una gatera **la rompe**. En cada caja que pisa se «prueba» su trazo y deja un hueco [PROPUESTA] | Cada dimensión nueva del segundo mapa aparece como un **rastro**: una rasgadura con huellitas que no son de nadie |
| 6 | Por esos huecos, las cajas se **derraman** unas en otras | Llegan gatos de otros mundos y estilos (los **Multidimensionales**); en tu isla caen cosas de otras cajas [DUEÑO] | Una dona en tu palmera, onomatopeyas de cómic en el muelle, gatos con otro trazo varados en el mapa |
| 7 | Los Disruptores siempre quisieron cajas abiertas [CANON b55] | **Regresan** por los huecos y celebran; llaman a REGISTRO 000 «La Llave» y lo quieren de bandera [DUEÑO + PROPUESTA] | Grafiti «NINGUNA CAJA ES HOGAR» sobre el segundo mapa; encuentros con Disruptores en las rutas |
| 8 | Desde afuera, los Titiriteros quieren cerrar la ficha de REGISTRO 000 con el lápiz, pero **no se puede escribir sobre algo que salta de caja en caja**. Solo un gato cruza cajas [PROPUESTA] | **Se escriben a sí mismos como gatos** y bajan [DUEÑO] | Una mano de luz se cierra en un puño y cae como cometa a cada dimensión; en el mapa aparece un gato nuevo con la marca de una mano en la pata |
| 9 | Para bajar usan la luz que manda señal hacia afuera: **la linterna de Luzterna** [CANON b48 + PROPUESTA] | La luz que ella eligió dejar prendida es el faro que los trajo | En Libros, La Mano lo dice: «Tu farera nos alumbró el camino. Gracias.» Luzterna no lo sabía |
| 10 | Encarnar tiene **precio** (§4.1): pierden el lápiz, toman el trazo de la caja donde caen, se vuelven mortales, sienten y **olvidan** como gatos | Tienen prisa: deben acabar antes de olvidar quiénes eran. Cada vez que pierden una pelea, olvidan más [PROPUESTA] | Su ficha del Catdex se borra línea por línea a lo largo de la Parte III |
| 11 | Nosotros perseguimos a REGISTRO 000 para traerlo a casa. **Luzterna lo apoda «Cerito»** y lo guía con su luz [PROPUESTA] | Cerito empieza a dormir junto al faro | REGISTRO 000 en tu isla de noche, ya no en el peñasco: en el haz del faro |
| 12 | Los Titiriteros nos ven como el problema (§4.1): tu gato abandonó la página, la ficha de 000 está escrita con **tu letra** [CANON b56], escondemos a 000 y les ganamos a sus compañeros, que olvidan más rápido | **Se enojan con nosotros** [DUEÑO] | Sus líneas pasan de corteses (Acto I) a frías (Acto III) a desesperadas (Final) |
| 13 | Su plan: una posibilidad existe mientras **algo la sostenga**. A Cerito lo sostienen dos cosas: **la luz que lo guía** (la linterna) y **los ojos que lo ven** (Canelo, el único que lo ve, b53). Sin luz ni ojos, vuelve a *vacante* y las fronteras se cierran solas [PROPUESTA] | Los Titiriteros necesitan apagar la luz **y** cerrar esos ojos. Para el jugador, la amenaza más clara es **Canelo** (§4.8) | La Mano lo dice en H85 sin rodeos: «Lo sostiene la mirada de tu gato». Luzterna dice que no apaga nada y que a Canelo nadie lo toca |
| 14 | En la batalla final, La Mano va **por Canelo**. Luzterna se pone delante con la linterna y no se quita. Para llegar a los ojos, La Mano tiene que pasar por la luz [PROPUESTA] | **La Mano decide tachar la luz con Luzterna dentro** [DUEÑO: los Titiriteros la matan]. Luzterna nunca soltó la linterna: si la apagan, se apaga ella | Momento «SADIE» (`08`). No hay manera de salvarla, y el juego no finge que la hay |
| 15 | La Mano va a terminar con Canelo, pero **los gatos ven en la oscuridad**. Canelo sigue viendo a Cerito, y Cerito sigue existiendo [CANON b53 + PROPUESTA] | Para dejar de romper cajas, Cerito **toma forma de gato**, la de quien lo mira. **No elige qué es**: elige una forma para quedarse (§4.4) | Cerito cambia de estática a pelaje. Su ficha: «ESPECIE: gato (por ahora)» |
| 16 | Una posibilidad con forma **deja de romper** cajas al cruzarlas | Los huecos dejan de crecer y se vuelven **gateras**: puertas que se pueden cruzar a propósito. El segundo mapa queda abierto [PROPUESTA] | Las rasgaduras del mapa se cosen en forma de puertitas. **Una no cierra** (§4.4: la que va «afuera») |
| 17 | La Mano ya no necesita tocar a Canelo. **Mató a Luzterna por un plan que no hacía falta.** Ya es gata y **lo siente** | Se rinde. Los Titiriteros quedan varados, olvidando y con culpa [PROPUESTA] | La Mano frente a Cerito (`08` §5) |
| 18 | Canelo se fue de la página para olvidar, y eso costó todo | Canelo **regresa a la página**, esta vez por una promesa. Días después, en el bar, **no se toma** el trago del olvido [PROPUESTA] | Epílogo del bar, revisado para respetar el duelo (`08` §5.2) |

**Lo importante para el jugador.** La cadena tiene **dos culpas humanas y ningún villano de caricatura**:
- **Canelo se fue**, y por eso despertó lo que despertó.
- **Los Titiriteros decidieron** matar a alguien por un plan que no entendía a los gatos.
- Y una **tercera verdad** que el jugador ve al final: Luzterna **eligió** ponerse delante. Murió haciendo su trabajo, «que nadie se perdiera», y no por un error de nadie más.

Las dos se ven y las dos tienen consecuencias.

---

## 4. Las fuerzas

### 4.1 Los Titiriteros

**Qué son** [CANON]: los autores del Archivo-hospital (b54). Escriben en los márgenes, a veces escriben el final de un mundo para que no se rompa, y nunca dan la cara.

**Por qué encarnan** [PROPUESTA]: para atrapar algo que cruza cajas hay que poder cruzarlas, y solo los gatos pueden. No hay otro cuerpo que pase por una gatera. Lo deciden en el Acto I. Lo cuenta Borrón, el primero que encontramos, con un ataque de hipo.

**El precio de encarnar** [PROPUESTA]. Se explica por partes, cada vez que un Titiritero lo **sufre** en pantalla:

| Pierden | Cómo se ve | Dónde se aprende |
|---|---|---|
| **El lápiz.** Un personaje no puede escribir su propia historia | Se tocan la pata buscando el lápiz, como quien busca el celular | Acto I, Borrón |
| **El trazo propio.** Cada uno toma el estilo de la caja donde cae | Cruceta se vuelve un justiciero de cómic sin querer; Itō, un rival de anime; Firma, una diva pop | Al conocer a cada uno |
| **La inmortalidad.** Ahora sangran tinta | El primer golpe que reciben los sorprende | Acto II |
| **La distancia.** Ahora sienten: hambre, frío, miedo y, al final, **culpa** | Borrón llora con una dona | Acto I y Final |
| **La memoria.** Los gatos olvidan. Cada derrota borra una línea de su ficha | La ficha del Catdex se tacha en vivo | Todos los actos; es su reloj |
| **El regreso.** No queda nadie arriba para volverlos a escribir manos | La Mano: «Quemamos el barco. Es lo que hacen los que de verdad quieren llegar» | Acto III |

**Qué buscan.**
- **Su meta:** atrapar a REGISTRO 000 y devolverlo a *vacante*, para que las fronteras sanen y el hospital no se derrame.
- **Lo que de verdad defienden:** los mundos enfermos de las otras cajas, que el derrame está matando. **No son villanos.** Son médicos en una epidemia haciendo triaje.

**Por qué se enojan con nosotros.** Escala por actos:
1. Tu gato dejó la página. Fue negligencia.
2. Escondes a REGISTRO 000.
3. La ficha de REGISTRO 000 está escrita con **tu letra** (b56; se descubre en Libros). Es sospecha de autoría.
4. Cada pelea que les ganas hace que un compañero olvide más. Para ellos es como **matarlos de a poquito**.
5. Luzterna se niega a apagar la luz, y tú la apoyas.

**Cómo reaccionan los demás a que encarnen** [PROPUESTA]:

| Quién | Reacción | Dónde se ve |
|---|---|---|
| Disruptores | Celebran: «¡Las manos invisibles por fin tienen cara! Ahora sí se les puede pegar». Los cazan también y pintan «AHORA SÍ SE VEN». Brecha nota que los Titiriteros **tienen miedo**, y eso la incomoda | Grafiti en el mapa desde H71; Brecha en A-7 |
| Correctores | Lo ven como el error definitivo: autores que se volvieron personajes. Le ofrecen a La Mano «corregirlo todo» y ella los rechaza | H86 |
| Maneki (su ex conserje) | Los reconoce: «¿Jefe? …¿Usted comiendo donas?». Les tiene cariño y miedo a la vez; sigue vendiéndonos llaves | Encuentro con Borrón en la Donería, después de H70 |
| Gatos de las cajas | No saben qué son: para ellos es un gato raro más | Siempre |
| Luzterna | Al principio, curiosidad («¿Así se ve el que escribe? Esperaba más barba»). Desde H85, culpa | Actos I–III |

**Sus desacuerdos.** No piensan igual; se ve en lo que **hacen**:

| Titiritero | Dimensión | Postura | Qué hace |
|---|---|---|---|
| **Borrón** | Borracha | Deserta. Descubre las donas y la cerveza y no quiere volver | Nos cuenta el precio. Al final del Acto I le avisa a La Mano «que no vengan»; no le hacen caso |
| **Cruceta** | Superhéroes | Se cree el héroe; para él, nosotros somos los villanos | Pone a la ciudad en contra nuestra con titulares; salva gatos civiles de verdad, y eso lo complica |
| **Itō** | Anime | Honor: quiere ganar en duelo limpio | Se niega a atacar a Luzterna por la espalda en el Acto II. **No está en la batalla final**: se queda en su caja, y eso le cuesta |
| **Firma** | POP | Fama. Quiere a REGISTRO 000 como el espectáculo más grande del Archivo | Monta un concierto-trampa (Acto IV). Su vanidad casi rompe la caja POP |
| **La Mano** | Libros | La primera mano, la del lápiz de H49. Fría y lógica: «una luz contra mil mundos» | Toma la decisión de matar a Luzterna. Después es la que más lo siente |

### 4.2 Los Disruptores [DUEÑO: regresan · PROPUESTA: su desarrollo]

**Qué quieren** [CANON b55]: que ningún mundo dependa de una mano invisible, y romper las cajas.

**Por qué regresan:** las fronteras se rompieron solas. Su sueño se cumplió sin ellos. Llegan a celebrar y a reclamar a REGISTRO 000 como «La Llave».

**Su desarrollo** se cuenta con acciones, no con discursos:

| Acto | Qué hacen | Consecuencia visible |
|---|---|---|
| I | Llegan a la Borracha, pintan grafitis y arman una pelea de bar | Algunas rutas quedan grafiteadas: más difíciles, con mejores premios |
| II | En Superhéroes **liberan a los villanos** de su caja-cárcel «para que respiren» | Aparecen villanos sueltos como encuentros en el mapa; la ciudad culpa a todos los forasteros, nosotros incluidos |
| II | En Anime entran al torneo para ganarse una gatera | Brecha pelea limpio y le gusta; Esquirla hace trampa |
| III | En Libros, el derrame borra finales. Un Disruptor pequeño, que salió de un libro, **pierde el final de su propia historia** | **Brecha entiende** lo que dijo la Biblia de la Parte II: «una caja rota no libera a su mundo: lo derrama». Los Disruptores se parten en dos |
| IV | Esquirla intenta robar a REGISTRO 000 en el concierto de Firma y abre una rasgadura enorme. Por ahí La Mano ve **dónde duerme Cerito**: en el faro de tu isla | Es el eslabón que lleva el Final a casa |
| Final | Brecha y los suyos llegan a ayudar en la batalla de tu isla [PROPUESTA; depende de una decisión del jugador en el Acto III, ver `03`] | Su presencia cambia una fase de la batalla, no el destino de Luzterna |

**Personajes:**
- **Brecha**: líder; la conocimos en H55.
- **Grafitera**: ya vive en tu isla desde H55. Es el puente: quiere volver con los suyos y no sabe si debe.
- **Esquirla** [PROPUESTA]: la dura del grupo. Para ella, si se rompen todas las cajas, se rompen todas.

### 4.3 Los Correctores [PROPUESTA]

Se quedan fuera de cuadro. Su mundo perfecto fue rechazado en la Parte II.
- **Un solo cameo**, en Libros: le ofrecen a La Mano «corregir» el caos, y ella los rechaza («ustedes quitan la elección; yo solo quito un error»). Así se ve que **La Mano no es un Corrector**, aunque termine haciendo algo peor.
- **Tachón** (en tu isla desde H62) tiene una línea en el Final.

### 4.4 REGISTRO 000 → «Cerito» [revisado con el dueño: no se resuelve]

| | |
|---|---|
| Qué es [CANON] | La primera entrada escrita en la página en blanco. Una posibilidad que todavía no eligió ser nada |
| Qué es en la Parte III [PROPUESTA] | **Una posibilidad recién despierta que todavía no tiene forma.** Se prueba todas: en la Borracha parece de caricatura; en Anime, de cel. El caos es lo que hace cualquier gatito: **tirar cosas de la mesa**. Solo que la mesa es el estante del Archivo y las cosas son mundos |
| Qué quiere | Seguir a quien lo ve (Canelo) y quedarse cerca de la luz (Luzterna) |
| Cómo se le ve | De reojo y a medias hasta el Acto II, con el **trazo de la caja donde está** y estática en el borde. Nunca habla con palabras: habla con **fichas que se escriben solas** («REGISTRO 000: tiene frío») |
| Su arco en la Parte III | Persecución (I) → primer contacto con la luz, Luzterna lo apoda Cerito (II) → acusación: «escrito con tu letra» (III) → refugio en el faro (IV) → **toma forma de gato** en la oscuridad (Final) |

**Qué se resuelve en la Parte III y qué no:**

| Se resuelve | Queda abierto (Parte IV o después) [DUEÑO] |
|---|---|
| Por qué rompía las cajas: no tenía forma | **Quién lo escribió.** Su ficha original tiene **tu letra** (H84). Es un hecho, no una explicación |
| Por qué dejó de romperlas: tomó la forma de quien lo miraba | **Para qué lo escribieron** «antes del folio 001» |
| A quién seguía: a Canelo y a la luz | **Qué es de verdad.** Su ficha dice «ESPECIE: gato **(por ahora)**». La rareza sigue «no aplicable» |
| | **Qué recuerda** de todas las formas que se probó. Duerme y sueña con las cinco cajas, y a veces amanece con el trazo de una |
| | **La gatera que no cerró.** Una de sus rasgaduras **no se volvió puerta**: es la que da «afuera», hacia donde iba la señal de la linterna |

**Pistas sembradas para después:**
1. **La ficha original** (H84) tiene un tachón *debajo* de «REGISTRO 000», como si antes hubiera dicho otro número. No se puede leer.
2. **Las fichas de Cerito** a veces terminan con una palabra que nadie entiende y que también aparece en los márgenes de la Parte II. No se traduce.
3. **Cerito no tiene sombra** cuando Canelo no lo mira. Se ve en tu isla en el post-juego: un detalle visual, sin texto.
4. **La gatera que no cerró** está en el mapa, cosida a medias, con la nota de Luzterna «esta no la toques». Es lo último que dibujó (`08` §6).
5. **Su relación con Capi:** en la Bitácora, después de H93, **tu letra** escribe sola una línea sobre Cerito que el jugador no eligió escribir. No se explica.

**Consecuencias que la Parte IV puede usar:**
- Cerito puede volver a «despertar» si deja de tener quien lo mire.
- La gatera abierta hacia afuera existe.
- Los Titiriteros varados olvidan, pero La Mano recuerda.
- Tu letra está en su origen.

### 4.5 Luzterna: voluntad propia, participación y convivencia [DUEÑO: tenemos que quererla mucho más · PROPUESTA: cómo]

Luzterna no está para morir. **Está para hacer su trabajo, que siempre fue «que nadie se perdiera»** (Parte I, b18). En la Parte III es **la compañera de aventura**: decide, pelea, se equivoca, hace reír y cuida.

**Lo que quiere y lo que hace:**

| Quiere | Hace | Por qué importa a la trama |
|---|---|---|
| Que nadie se pierda | **Dibuja el segundo mapa.** La Carta de las Cajas es suya, con su letra, sus chistes en los márgenes y sus advertencias | El mapa es su obra. Después de su muerte queda a medio dibujar donde ella no llegó |
| Saber quién recibe su señal (b48) | Investiga. En Libros descubre que la recibieron los Titiriteros y que su luz los guió hasta aquí | La culpa que no es suya: «yo los traje» |
| Traer a Cerito a casa | Lo apoda, le deja la luz encendida y le enseña a acercarse | Es la razón por la que no suelta la linterna |
| **Proteger a Canelo** | Lo saca del bar. Lo carga cuando se desmaya en Libros (H84). Se pelea con La Mano cuando la amenaza es él | Es lo que hace al final, y por eso muere |
| No ser un adorno | **Comanda su propia batalla** (H86, Momento «No wey»). **Salva a Firma** en POP (H90). **Decide** en el punto medio (H81) y en H85 sin consultar a nadie, y el jugador la apoya o le discute en el diálogo (cosmético) | Tiene victorias, errores y decisiones propias |
| Seguir siendo graciosa | Su chiste de estar muerta, sus insultos cariñosos, cantar mal, ser mala sensei | Por eso duele cuando deja de hacer chistes (`08` §4.3) |

**La convivencia** [DUEÑO: con escenas pequeñas]. Son escenas y acciones breves **fuera de las misiones**, repartidas en todos los actos, que el jugador encuentra al explorar:

| Dónde | Qué | Cuándo |
|---|---|---|
| Tu isla, de noche | Luzterna teje en el faro. Si la tocas, una línea distinta cada noche (12 en total, en orden) sobre su vida de farera, sus quejas de Canelo y sus dudas | Desde H72 |
| La Carta | Sus notas al margen **reaccionan** a lo que hiciste («ganaste sin perder ni un gato, presumido»). Hay una por nivel ganado por primera vez | Siempre |
| En cada dimensión | **Un lugar suyo** que encuentras explorando: la rocola de la Borracha (pone «su» canción), la azotea de Superhéroes, el banco del torneo, la sección de faros de la biblioteca y el camerino de POP. Cada uno trae una escena chica y una decisión cosmética que **se recuerda** | Uno por dimensión |
| Decisiones pequeñas recordadas | Qué dona le das a Borrón; dónde le deja la cobija a Cerito; qué canción canta en el karaoke; qué foto guardas | Vuelven en la vigilia y en el Momento SADIE (`08`) |
| Pequeñas acciones | Le arreglas el faro cuando se descompone (H77); le traes el estambre que encontraste en Superhéroes (desvío); le devuelves la linterna cuando se le cae en la resaca (H72) | Cada una cambia algo visible: el faro, la bufanda, la Bitácora |

**Su arco:** de farera que no suelta a farera que **elige** no soltar, sabiendo lo que cuesta. En la Parte I no soltó por accidente («se me olvidó bajar»). En la Parte III no suelta **a propósito**, para proteger a Canelo.

### 4.6 Canelo

[CANON] Impaciente, glotón, dueño de la palmera, con bufanda. No es un dios secreto; su importancia es que sigue siendo Canelo (Biblia Parte II §5.5).

**Su voz** [PROPUESTA]. Canelo **nunca había hablado** con palabras: en la Parte I y la Parte II no hay ninguna línea con hablante CANELO, y Luzterna lo traducía («dice que…»).
- En la Dimensión Borracha **todos hablan**: es una caja de caricatura, y en las caricaturas los animales hablan. Ahí lo oímos por primera vez.
- En las demás dimensiones también habla, cada una con su regla (en Libros habla en texto; en Superhéroes, en globos).
- **En tu isla vuelve a maullar.** Eso hace que cada viaje sea también «ir a oír a Canelo».

**Cómo habla** [PROPUESTA]:
- Exagera todo: «hundí cuarenta barcos» cuando fueron tres.
- Se distrae con la comida a media frase.
- Dice «gordo» de cariño y se ofende cuando se lo dicen a él.
- Cuenta lo épico como chisme de mercado y lo triste con una sola frase seca.

**Su arco:** huir de la decisión → causar el desastre por huir → hacerse cargo → negarse a olvidar.

### 4.8 La expectativa: «el que puede morir es Canelo» [DUEÑO]

**Regla:** la expectativa se construye con **pistas y riesgos reales**, no ocultando información ni engañando con la interfaz. Al volver a ver la historia, todo encaja con que muera Luzterna.

**Por qué el jugador cree que es Canelo (y tiene razones):**

| # | Pista o riesgo | Dónde | Es real porque… |
|---|---|---|---|
| 1 | La llama de su cola **baja** cada vez que Cerito rompe una gatera | H67 y cada cruce | Cerito «se sostiene» de su mirada: le cuesta (eslabón 13) |
| 2 | Canelo bromea con sus nueve vidas «gastadas» | H66 (bar) | Es su chiste; además es gato |
| 3 | Maneki: «Un gato no puede ver por dos mucho tiempo» | Acto II | Es verdad, y se cumple cuando Canelo se desmaya |
| 4 | En Libros aparece una página de **un Eco de Canelo que no volvió de una caja** | H83, Finales perdidos | Los Ecos son otras vidas posibles (canon) |
| 5 | **Canelo se desmaya** después de que Cerito rompe la caja de los libros. Luzterna lo carga hasta el barco | H84 | Riesgo real: el jugador lo ve débil |
| 6 | La Mano: «Lo sostiene la mirada de tu gato» | H85 | Es su plan de verdad (eslabón 13) |
| 7 | **Cronos**, que «ya vio cómo termina» (canon de las Grietas), dice en la última noche tranquila: «Vi el final. Una bufanda en el suelo y alguien que no se levanta» | H91 | Es verdad. La bufanda es **la que tejió Luzterna**, que cae cuando muere. El jugador piensa en la de Canelo |
| 8 | En la batalla final, **La Mano ataca primero a Canelo** | H93 | Es verdad: era su objetivo |

**Pistas honestas del final real** (se entienden al volver a ver la historia):

| # | Pista | Dónde |
|---|---|---|
| a | «Si algo me pasa, dile a Canelo que su bufanda siempre me pareció horrible» | Parte I (canon, `script.ts:112`) |
| b | Luzterna repite «a mí ya no me puede pasar nada: ya me pasó todo». **Es lo que ella cree**, no un engaño del juego | H67 y después |
| c | En Libros, La Mano escribe «FIN» sobre **un fantasma de un cuento**, que se desvanece. Luzterna lo ve, se queda callada un segundo y hace un chiste | H83 |
| d | Luzterna escribe en la Bitácora más de lo normal y deja instrucciones («si algo pasa, sigue tú»). El jugador cree que se prepara por si le pasa algo **a Canelo** | H86, azotea |
| e | Termina la bufanda la noche antes. «Mañana se la doy.» | H91 |
| f | «Cuidar algo también es dejar que lo vean» (b48): la luz que eligió dejar prendida es la que trae a quien la mata | Parte II |

### 4.7 Capi (el jugador)

[CANON] Es el FOLIO 001, nunca se ve, y escribe «así de bonito» como los márgenes (b56).

[PROPUESTA] En la Parte III, **tu letra pesa**:
- es la sospecha de los Titiriteros;
- después de la muerte de Luzterna, **la Bitácora pasa a tu letra** (`03` §4).

No se revela qué eres. Se profundiza (ver §6).

---

## 5. Reglas nuevas del mundo [PROPUESTA]

1. **Trazos.** Cada caja tiene su trazo (canon b18) y quien entra **lo toma**. Los gatos de la isla conservan su pintura pero ganan el borde, la luz o el movimiento de la caja (lente por dimensión, ver `06`). Los Titiriteros y los Multidimensionales son los únicos que **cambian de verdad** de estilo.
2. **Hablar.** En las cajas de caricatura, cómic, anime, libro y pop, los animales hablan; en la isla, no. Canelo habla solo fuera de casa.
3. **Gateras.** Un gato cruza una gatera sin romperla. Algo que no es gato la rompe. Una gatera rota es una **rasgadura** y derrama. Una rasgadura que alguien cose (o que se calma) vuelve a ser **gatera**: una puerta que se cruza a propósito.
4. **Ver para ser.** Una posibilidad sin forma existe mientras algo la sostenga: **una luz que la guíe o unos ojos que la vean**. Sin las dos cosas vuelve a *vacante*. **Los gatos ven en la oscuridad**: los Titiriteros, recién encarnados, no lo entienden. Es la falla de su plan.
5. **La Borracha se reinicia.** Cada mañana, la caja de la Borracha vuelve a como estaba y nadie recuerda la noche. Desde que REGISTRO 000 pasó por ahí, **el reinicio falla**: algunas cosas se quedan. Es la primera señal del caos y el primer misterio que el jugador resuelve.
6. **Encarnar es de ida.** Un Titiritero encarnado no puede volver a escribir ni a subir.
7. **La muerte de un fantasma es definitiva.** Luzterna existía porque nunca soltó la linterna. Si la linterna se rompe con ella aferrada, no queda nada que la sostenga. **No hay vuelta**: ni Ecos, ni páginas, ni «Volver a ver» que la traiga al presente (`08` §5).

---

## 6. Misterios: qué responde, qué profundiza y qué deja abierto la Parte III

| Misterio | Parte III | Cómo |
|---|---|---|
| ¿Quién recibe la señal de la linterna? (b48) | **Responde** | Los Titiriteros; los guió hasta aquí |
| ¿Por qué los Titiriteros nunca dan la cara? | **Responde** | No tenían cara: eran manos. Al encarnar ganan cara por primera vez |
| ¿Quién escribió REGISTRO 000? | **No se responde** [DUEÑO] | La ficha original tiene tu letra y un número tachado debajo. Hay pistas y consecuencias (§4.4) |
| ¿Qué es REGISTRO 000? | **Se responde a medias** | Una posibilidad que tomó forma de gato «por ahora». Su naturaleza sigue abierta |
| ¿Qué es Capi? ¿Por qué escribe como los márgenes? | **Profundiza, no cierra** | Los Titiriteros creen que eres «un personaje que escribe», el peor delito del Archivo |
| ¿Qué decidirá Canelo con la página? | **Pospone, con sentido** | Vuelve a dormir encima, ahora por una promesa. La decisión sigue siendo «todavía no», pero es otro «todavía no» |
| Coordenadas de Budapest / «ISLA SIN NOMBRE» | **No se toca** | Sigue sembrado |
| ¿Qué hay afuera del Archivo? | **Asoma, sin consolar** | La gatera que no cerró da hacia afuera. **Días después** de la muerte, en el post-juego, algo afuera repite **una vez** el ritmo de la linterna. No promete nada: es otro misterio, no una esperanza (`08` §7) |

---

## 7. Tono

- **Humor siempre**, como la Parte II: groserías ligeras con su versión suave (`SOFT`), chistes de Luzterna muerta, el «decir y retractarse».
- **La tragedia se prepara con humor.** El chiste de que Luzterna «ya está muerta» se usa durante toda la Parte III (`03`), y precisamente por eso su muerte de verdad pega. **Después de su muerte nadie hace ese chiste nunca más** [PROPUESTA; regla de escritura].
- **El duelo tiene espacio** [DUEÑO]. Desde que muere hasta el cierre:
  - no aparece ningún premio, jingle de misión cumplida, NOVEDADES, logro ni chiste;
  - nadie invita a «la siguiente aventura»;
  - la pantalla se toma su tiempo: la vigilia es lenta;
  - lo que habría de premios llega **en silencio** a la Bitácora, después del cierre.

  La intención es que el jugador entienda que esta historia **también tiene tragedias y consecuencias**.
- **Exposición:** máximo 4 líneas sin acción (regla de la Parte II). Pero **ninguna revelación clave se dice una sola vez**: cada una tiene una escena, una acción del jugador y una entrada en la Bitácora (`03` §4).
- **Referencias pop:** con giro propio y sin citar letras ni frases célebres reales (`06` §6).

---

## 8. Personajes nuevos (resumen; fichas en `06`)

| Personaje | Qué es | Dónde |
|---|---|---|
| **Hipólito** | El gato borracho del bar. Solo dice «¿Y luego?». Es el remate del prólogo | Borracha |
| **Doña Espuma** | La cantinera de La Última Ronda. Lo ha visto todo y no se acuerda de nada | Borracha |
| **Borrón, Cruceta, Itō, Firma y La Mano** | Los Titiriteros encarnados | Una por dimensión |
| **Esquirla** | Disruptora dura | Actos II–IV |
| **Cerito** | REGISTRO 000 | Todos |
| **Batcat, Spidercat, Harrycat, Bad Cat y Taylor Cat** [DUEÑO] | Multidimensionales con referencias pop | Superhéroes, Libros y POP |

---

## 9. Riesgos narrativos

| Riesgo | Mitigación |
|---|---|
| Que la muerte de Luzterna se sienta como castigo por perder | Ocurre en un punto fijo de la historia, nunca por la vida del barco ni por el desempeño (`08` §3) |
| Que la Parte III vuelva a ser «gana y te llevas un gato» | Tarjeta de misión de 5 campos y Bitácora (`03` §3–4); los premios acompañan el propósito |
| Que REGISTRO 000 se vuelva un sustituto de Luzterna | Cerito **no habla** ni guía; nunca toma su lugar de narradora (`08` §5) |
| Que los Titiriteros se lean como villanos planos | Desacuerdos visibles, precio visible, y Borrón e Itō que se niegan |
| Que el multiverso sea solo un escaparate de parodias | Cada dimensión tiene conflicto, consecuencia y relación con la trama (`05`) |
| Que el humor tape el duelo | Después de la muerte, el epílogo no tiene chistes de Luzterna; Hipólito es el único que hace reír, y sin querer |
