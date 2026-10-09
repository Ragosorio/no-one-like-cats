# 05 · Biblia de la Parte II — *La Era de las Rupturas*

> «Creíste que habías conquistado el mar. Nunca te preguntaste qué había encima de él.»

**Cómo leer este documento.** Cada decisión trae una marca:

- **[CONFIRMADO]**: ya existe en el juego o en el vertical slice y se verificó.
- **[DECIDIDO]**: es la dirección de diseño y se puede producir.
- **[PROPUESTO]**: es una propuesta fuerte que falta validar con el dueño o con un prototipo.
- **[PENDIENTE]**: falta investigar o medir.

Las fuentes de los hechos son 01 (auditoría del juego), 02 (investigación técnica), 03 (historia actual) y 04 (catálogo de conceptos).

---

## 0. Nombre interno y reglas de convivencia con la Parte I

| Cosa | Decisión |
|---|---|
| Nombre comercial | **NO ONE LIKE CATS · Parte II — La Era de las Rupturas** |
| Prefijo en código | `rupturas` (`game/src/rupturas/`, `rupturas.html`). En el código, **"Parte 2" ya significa las Grietas del Multiverso** (H23–H28): ni ese nombre ni `part2` se reusan. **[CONFIRMADO]** |
| Historia | Los IDs nuevos empiezan en **H31**. El regex de `unlocks` acepta `[HCKE]\d\d`. **[CONFIRMADO]** |
| Especies | Se respetan los prefijos de rareza (`c_ r_ e_ l_ m_ s_ h_ d_`). Ningún ID existente se renombra jamás: `catDef` lanza un error si una especie no existe (ver 01). **[CONFIRMADO]** |
| Motor | AgentGameEngine vive dentro del juego, en `game/src/engine/` (ver 07). **[CONFIRMADO]** |
| Partidas | Se aplica el pipeline de 01/ACTUALIZACIONES: migración, parche y NOVEDADES. Nunca se borra un gato y nunca se restan recursos con un parche. **[CONFIRMADO]** |

---

## 1. Visión creativa

**La promesa.** La Parte II no te manda a otro juego. Es *tu misma isla* que, una noche, gana profundidad. El mar se abre hacia arriba y descubres que el mundo que conquistaste era el primer piso de un edificio.

**Los cinco pilares.** Toda mecánica nueva tiene que servir al menos a uno de ellos:

1. **Hogar vivo.** La isla tiene que sentirse habitada aunque no hagas nada: Canelo duerme bajo *su* palmera mientras llueve.
2. **Maravilla con chiste.** Lo épico siempre trae un remate: un agujero negro que se come tus dudas, cangrejos sindicalizados.
3. **Colección con significado.** Un gato Común puede volverse extraordinario por su historia: Ecos de Vida y evoluciones sin obsolescencia.
4. **Combate que cambia las reglas.** No se trata de multiplicar el daño, sino de cambiar la gravedad, el viento, el escenario y la capa del mapa.
5. **Misterio en capas.** Cada revelación le da otro sentido a un detalle de la Parte I y abre una pregunta más grande.

**La prueba del jugador veterano.** Alguien con 40 horas abre el juego y piensa «¿cómo demonios este sigue siendo el mismo juego?». Diez segundos después reconoce a Canelo, su faro y sus gatos. El vertical slice ya prueba esa escena (ver §17).

---

## 2. Identidad visual (resumen; detalle en 08 · Biblia de Arte)

- **Los gatos siguen siendo pinturas.** Son las ilustraciones MAI que ya existen, animadas como marionetas y vividas en un mundo 3D estilizado como "cartas de papel" iluminadas. No se convierten en modelos 3D. **[CONFIRMADO en el slice]**
- **El mundo es un diorama toon:** formas simples y legibles, sombreado en 3 bandas, sombras proyectadas, agua con espuma y una luz de hora del día con mucho color. Se parece más a una maqueta pintada que a un render realista.
- **Cada región tiene su lente.** La Ruptura justifica estilos deliberados: cómic, acuarela o retrofuturo. Se aplican como "lentes" de material o postproceso sobre el mismo motor, no como juegos distintos.
- **Coherencia:** paleta saturada, contorno pintado en los gatos, siluetas gordas y legibles, y humor en los props.

---

## 2.5 Las dos caras de la isla: por qué cambia cómo se ven las cosas **[DECIDIDO; prototipado en el slice]**

**Regla del dueño (2026-10-09):** la historia tiene que justificar el cambio de presentación, pero **no se pierde lo que se ve hoy en la Parte I**: ni su jugabilidad ni la costumbre del jugador.

**Canon.**
- **La vista de la Parte I es la PÁGINA.** Así *escribe* el Archivo tu isla: una hoja con cuadrícula, costa entintada, mar de carta y gatos como estampas.
- Siempre fue verdad. El Archivo es un archivo, y Luzterna te enseñó la isla así desde el primer día.
- Al empezar las Rupturas, la página ganó **grosor**. La linterna de Luzterna, ya en tu faro, funciona como **la Lente de la Farera**: a través de ella ves el **MUNDO**, la isla con profundidad, clima, noche y vida.
- **Ninguna de las dos vistas es falsa.** La página es el registro; el mundo es lo registrado.

**El beat que lo presenta (H31 · "La página se dobla").**
- Es la primera noche de las Rupturas. En la vista de siempre aparece **un pliegue** en la hoja, junto al faro.
- Al tocarlo, la isla **se levanta como libro pop-up**: el terreno sube en ola desde el centro, las palmeras se enderezan y los gatos se ponen de pie.
- Luzterna: «Capi, no te asustes. La isla siempre fue así de gorda; nomás la estábamos viendo desde arriba… del papel.»
- Desde ese momento se puede alternar con un gesto (tecla V o el botón **VER LA PÁGINA / VER EL MUNDO**).

**Reglas de juego para que ninguna vista sobre:**

| | PÁGINA (la de la Parte I) | MUNDO (la nueva) |
|---|---|---|
| Para qué | Construir, colocar, mover y mejorar; leer producción; Santuario y paneles; gestión rápida | Vivir la isla: conductas de los gatos, clima, día y noche, modo foto, navegar y cinemáticas |
| Qué solo se ve aquí | **Notas al margen** de los Titiriteros, escritas con letra ajena («¿y el 000?», «FOLIO 000 — ~~vacante~~»); manchas y rasgaduras donde hay una Ruptura | **REGISTRO 000** (la página no tiene ficha para él); escondites (detrás del faro, bajo la palmera); islas que se levantan del mar |
| Luz | Siempre de día y neutra: es papel | Hora real, clima y luces locales |
| Rendimiento | Ligera: es la vista recomendada para equipos modestos y el **respaldo automático** si la calidad Baja no llega a 30 FPS | Escala con la calidad |
| Costumbre | Es la vista por defecto para quien viene de la Parte I hasta H31. Después **el jugador elige** su vista por defecto en Ajustes | — |

**Batallas.**
- El campo de batalla lateral de la Parte I (la artillería legible) **se mantiene como "página de combate"**.
- El mundo aparece en el fondo (agua real y cielo con capas) y en las cámaras de las ultis y de las transiciones de capa.
- La regla: **la cámara de juego nunca le quita legibilidad a la trayectoria**.

**Mapa.**
- La carta náutica del Primer Mar sigue siendo la página del mapa.
- Al alejar la cámara, la página "se despega" y aparecen las capas celeste y astral (§3).

**Variedad ("puede ser de diferentes formas").** Cada región decide **cómo se ve su página**:
- Páginas Hundidas: papel mojado.
- Nácar: un vitral en vez de papel.
- Sueños: acuarela.
- La Isla que Nadie Recuerda: **página arrancada**, donde solo existe el mundo.
- Viñetaria: viñetas de cómic.

Lo que nunca cambia es la regla: siempre hay una página donde se juega cómodo y un mundo donde se vive.

**Implementación.**
- **Slice:** `game/src/rupturas/views.ts` (`IslandViews`: pop-up escalonado con rebote, que respeta reducir movimiento), la lente `page` en `Heightfield`, `Ocean` y `PaperCat`, y las notas al margen en `main.ts`.
- **Juego real:** la PÁGINA **es la isla Pixi actual, sin tocarla**. La transición captura el canvas de Pixi como textura en un plano alineado a la cámara iso. Ese plano se "dobla" mientras el mundo three sube, y al volver se invierte (07 §7, paso 2).

## 3. Arquitectura del mundo: tres capas, un solo mapa

**[DECIDIDO]** El mapa es una **pila de capas** sobre el mismo plano XZ:

| Capa | Altura | Qué hay | Cómo se entra | Vehículo |
|---|---|---|---|---|
| **Marítima** | y = 0 | El Primer Mar actual, nuevos archipiélagos, naufragios y rutas submarinas (cuevas) | Ya existe | Barcos (los 6 de hoy siguen sirviendo) |
| **Celeste** | y ≈ 400 | Islas flotantes, corrientes de aire, puertos en las nubes | **Trombas** en el mar: un remolino que sube y sirve de ascensor | Aerobarcos: un barco al que le instalas el **Kit de Vuelo** de Corona Celeste |
| **Astral** | y ≈ 1200 | Estrellas, cometas, la frontera del Archivo | **Grietas celestes**: rasgaduras en el cielo | Naves astrales (Puerto Cometa), que gastan Combustible Astral |

**El truco de continuidad.** En el mapa de navegación, al alejar la cámara aparecen, literalmente, los pisos de arriba. Primero son siluetas (impostores) y se revelan cuando desbloqueas la capa. «¿Qué había encima?» se vuelve un gesto de cámara.

**La técnica** se detalla en 07 §5:
- Cada región es un **chunk** que se carga al acercarse (streaming).
- Lo lejano se muestra con impostores de 1 *draw call*.
- Al cambiar de capa hay una transición cinematográfica (subir por la tromba con nubes de partículas) que esconde la carga.
- Nunca hay un mundo gigante cargado entero.

---

## 4. Regiones

Las ocho propuestas del brief se revisaron contra los conceptos (ver 04). Se conservan las ocho, pero se ordenan por capa y por función: **dos centros (hubs) y seis territorios**. Cada región debe tener **identidad visual + actividad propia + mecánica de combate + especies + misterio**. Si le falta alguna de las cinco, no es región: es un islote.

### Oleada 1 · Capa marítima

**Isla de las Páginas Hundidas** (concepto 8: el faro sobre un libro abierto).
- **Qué es:** restos del Archivo medio hundidos. Es un hub de misterio: torres de libros, escaleras de lomo y biblioteca anegada.
- **Actividad:** "pescar párrafos". Las páginas flotantes se recogen con el barco y arman el **Diario Perdido**, que funciona como códex de lore.
- **Combate:** "Tinta". Los impactos dejan charcos que borran los estados de los módulos (una limpieza que es arma de doble filo).
- **Especies:** linaje *Tinta* (Magia/Sombra) y los gatos-marcapáginas.
- **Misterio:** aquí aparece la primera ficha **REGISTRO 000** (§8).
- **Jefe:** *El Bibliotecario Ahogado*, un primordial que pide silencio y castiga el ruido. Los ataques de Sonido le hacen el doble, pero también lo enfurecen.

**Isla Nácar** (conceptos 4 y 12).
- **Qué es:** un monte de cristal, con cavernas que reflejan cosas que no existen.
- **Actividad:** **guiar haces**. Se giran espejos para que la luz del faro (ahora con la linterna de Luzterna) abra cuevas. El faro de la Parte I se vuelve herramienta.
- **Combate:** el elemento **Cristal** (§6): rebotes y barreras que refractan.
- **Especies:** familia *Facetada*.
- **Material:** **Nácar** (§11).

### Oleada 2 · Capa celeste

**Corona Celeste** (conceptos 9 y 20).
- **Qué es:** ciudad y puerto sobre las nubes. Es el hub de la capa celeste: astillero aéreo, mercaderes y la primera **embajada de los Correctores**.
- **El detalle:** es la ciudad más segura del mundo, y eso da miedo. Nadie llora y nadie elige.

**Islas Invertidas** (concepto 7; 5 secundario). Falta un concepto de gravedad realmente invertida (04, huecos).
- **Qué es:** cascadas que caen hacia arriba e islas que cuelgan.
- **Actividad:** **pesca hacia arriba**.
- **Combate:** el elemento **Gravedad**. La gravedad del campo se invierte a mitad de batalla; los proyectiles curvan hacia arriba y la cobertura cambia de lado.
- **Especies:** familia *Contrapeso*.

### Oleada 3 · Capa astral

**Puerto Cometa** (conceptos 2, 21 y 6 —sitio de impacto y escudo—; 18 para Canelo Astral).
- **Qué es:** el astillero retrofuturo donde los barcos aprenden a ser naves.
- **Combate:** baja gravedad y pozos orbitales: un disparo puede dar la vuelta a un planetoide.
- **Combustible:** el astral se produce aquí.
- **Personaje:** Canelo Astral se decide aquí (§7).

### Oleada 4 · Las fronteras

**Archipiélago de los Sueños** (conceptos 5, 15 —lente acuarela— y 13 —especie onírica—).
- **Qué es:** las islas cambian según **quién duerme en tu isla**. El sistema de vida ambiental decide qué gatos están dormidos y ese sueño "pinta" la región.
- **Combate:** **reglas de sueño** sorteadas por turno: el agua es suelo, los cañones disparan peces, y otras así.
- **Lente visual:** acuarela.

**La Isla que Nadie Recuerda** (concepto 10).
- **Qué es:** se genera a partir de **tu propia partida**: tu trazado de hábitats, tus edificios y las siluetas de tus gatos, todo abandonado y en ruinas.
- **Técnica:** es datos más el motor. Se lee el layout de la isla y se aplica el material "ruina" sobre los mismos edificios.
- **El golpe emocional:** es la versión de tu isla en la que nunca llegaste.
- **Regla de tono:** no castiga al jugador. Es triste, y el final la repara.

**El Umbral** (concepto 11, reinterpretado: sin el héroe humano).
- **Qué es:** la frontera del Archivo, donde viven los secretos más hondos. Es el desenlace de la saga.

### Islotes y extras

Naufragios, islotes, comerciantes y encuentros aleatorios (no diarios) se definen como **"bolsillos"** de 1 chunk.

**Bolsillos pop.** En el Primer Mar se abren de forma temporal: **Viñetaria** (lente cómic), **El Estadio de las Mil Lunas** (lente concierto, mecánica de ritmo) y **La Ciudad del Scroll** (sátira). Son eventos únicos con fecha, no tareas diarias. **[PROPUESTO]**

---

## 5. Narrativa

### 5.1 La idea que une todo **[DECIDIDO]**

**Distraxia no era solo una villana. Era el olvido del Archivo:** su recolector de basura, la función que borraba lo que ya no cabía.
- Al final de la Parte I se volvió **una página en blanco**. Eso estuvo bien: liberó a Nadie y salvó a los gatos.
- Pero una página en blanco **se puede escribir**. Las Rupturas son **escritura nueva**: islas que "siempre estuvieron ahí" porque alguien las está escribiendo *ahora*, con fecha de antes.

Esto no invalida el final; le pone consecuencias. Ninguna victoria era gratis, y nadie mintió.

**La luz de Luzterna.** Su linterna, ya en tu faro, ilumina **hacia afuera** del Archivo por primera vez. Ella lo hizo para tener una luz de casa. Es la Parte I cumplida.
- Esa luz es una **señal**: desde afuera, alguien la ve.
- Luzterna no lo sabía. **No es villana.** Cuando lo descubra (Oleada 2), su arco será aprender que cuidar algo también es dejarlo ser visto.

### 5.2 Las tres fuerzas **[DECIDIDO]**

| Fuerza | Qué quiere | Tienen razón en… | Se equivocan en… | Cómo se ven |
|---|---|---|---|---|
| **Los Titiriteros** | Preservar los mundos que se mueren. Construyeron el Archivo como hospital. | Sin ellos, cientos de mundos ya no existirían. | Para salvar un mundo, a veces le escribieron el destino. | Manos de luz y lápices gigantes. Nunca dan la cara: hablan por **notas al margen**. |
| **Los Disruptores** | Que ningún mundo dependa de una mano invisible. Romper las cajas. | Ningún mundo debería depender de una mano invisible. | Una caja rota no libera a su mundo: lo derrama. | Grafitis en el cielo y piratas de grieta. Su estética es glitch. |
| **Los Correctores** | Borrar las contradicciones: un mundo sin sufrimiento… y sin sorpresas. | El dolor sobra. | Para quitarlo, quitan la elección. | Blanco perfecto, simetría y gatos que siempre ronronean. Es lo más inquietante de la saga. |

**La regla de oro.** Ninguna facción tiene la razón completa, y **el juego nunca castiga al jugador por haber construido su isla**. La isla es una prueba de cariño, no un crimen.

### 5.3 REGISTRO 000 **[DECIDIDO; v0 implementado en el slice]**

Es un gato que no debería existir. Se muestra **solo en superficies que ya existen** (inventario en 03 §4):

- **[CONFIRMADO, slice]** De noche, sentado en un peñasco frente a tu isla. **Nunca está cuando te acercas.** Si lo tocas, el Catdex escribe su ficha: *Especie desconocida · Elemento ninguno · Rareza no aplicable · Estado: observando*.
- **[PROPUESTO, Oleada 1]** Más apariciones, todas sobre superficies que ya existen:

| Superficie | Cómo aparece | Costo |
|---|---|---|
| Pie de foto del **Diario** (pool `CAPTIONS`) | Con 2 % de probabilidad: «FOTO: archivo. Nadie recuerda al cuarto gato.» | Solo datos |
| La silueta del **Gato Callejero** | A veces **no se revela** | Código chico |
| Chat del casino | Un usuario `registro_000` que escribe una vez por sesión | Solo datos |
| Ficha de tripulación | Tú eres el **FOLIO 001**. Desde H31, una línea tachada: "FOLIO 000 — ~~vacante~~" | Código chico |
| Odds del Santuario | Una fila **"???"** fantasma de 0 % | Código chico |
| Coordenadas del título | Cambian un dígito cada vez que lo ves | Solo datos |

- **Qué es (secreto de saga; no se revela en la Parte II).** Es la primera entrada que alguien escribió en la página en blanco. Todavía no sabemos quién la escribió ni para qué.
- **Pregunta que debe quedarse en el jugador:** «¿cuánto tiempo lleva ahí?». En las partidas viejas, la **bandera `story:capitulo2`** (secreto 12: "El Capítulo 2 ya sabe que existes") ya está puesta. Al entrar a la Parte II, esos jugadores encuentran a REGISTRO 000 en su Catdex con fecha de **la noche en que desbloquearon ese secreto**. Ya los estaba mirando.

### 5.4 Hilos de la Parte I que se pagan (de 03 §5)

| Hilo | Pago en la Parte II |
|---|---|
| La palabra de estática que nadie lee | **Oleada 1:** se lee completa. Es **"FOLIO"**. Alguien te estaba catalogando. |
| ¿Qué empujó a la Estrella? | **Oleada 3:** un Titiritero la "reubicó" para salvar otra caja. Hay daño colateral; nadie es malvado. |
| "Algo viene detrás de ti" (Distraxia) | **Oleada 1:** era la advertencia de las Rupturas. Distraxia **sabía** lo que pasaría si dejaba de olvidar. |
| Tres versiones de los Fragmentos | **Oleada 2:** las tres son ciertas. Son tinta seca de páginas borradas: vienen de "barcos que no deberían existir" y son "fríos" porque nadie los recuerda. |
| ¿Quién llevaba el Archivo? (Maneki y Sonata) | **Oleada 3:** los Titiriteros, y Maneki fue su conserje. Esto convierte a un gato secreto existente en personaje clave. |
| La carta firmada "—N." | **Oleada 4:** no era Nadie ni Noctis. Era un **Corrector** firmando con la inicial de *Normal*. |
| El Faro del Primer Mar que se prende solo y "no apunta a casa" | **Oleada 1:** apunta a la Isla de las Páginas Hundidas, que siempre estuvo ahí. |
| "Si alguien abre otra caja, aquí voy a estar" (Luzterna) | Es la línea de apertura de H31. |
| "¿Quién derrotó a mi almirante?" (contradicción de Nadie) | **Oleada 2:** el Leviatán tenía otro almirante, uno Corrector. Así se repara la incoherencia del canon. |
| Coordenadas de Budapest e "ISLA SIN NOMBRE" | **Saga III** (solo se siembra): donde el Archivo toca "el afuera". |

**Lo que NO se responde en la Parte II:**
- Qué es REGISTRO 000.
- La relación del jugador con los Titiriteros. Solo se siembra con "FOLIO 001" y con que tu letra se parece a la de las notas al margen.
- La decisión libre de Canelo, que se reserva para el final de la Saga III.

### 5.5 Canelo **[DECIDIDO]**

Los gatos cruzan límites sin perder su identidad (el chiste de que "los gatos son líquidos", ahora canon). **Canelo no es un dios secreto.** Su importancia es que **sigue siendo Canelo**: impaciente, glotón y dueño de la palmera.

En la Parte II **elige una manifestación** (§7). Eso se siembra como su primera decisión libre: los Correctores no la pudieron predecir porque Canelo eligió **dormir**.

### 5.6 Cómo se cuenta

Las misiones cuentan la historia con escenarios, el Catdex, ruinas, gatos que reaccionan y cambios visibles en tu isla. **Prohibido el muro de texto:**
- máximo 4 líneas por *beat*;
- todo diálogo largo se parte con una acción;
- se conserva el tono de 03 §6: groserías ligeras y gritos de ataque en inglés o japonés.

---

## 6. Elementos **[DECIDIDO]**

Hoy hay 13 elementos. Se agregan **solo 2 nuevos**. Cada uno trae un **verbo** que hoy no existe:

| Nuevo | Verbo | Combate | Isla (vida) | Afinidades |
|---|---|---|---|---|
| **Cristal** (Oleada 1) | **Redirigir** | Los proyectiles rebotan en facetas que se pueden colocar; las barreras refractan (dividen el disparo en 2) | Los gatos se miran en sus facetas; de noche refractan la luz del faro | Fuerte contra Luz y Sonido (rebota sus ondas); débil contra Tierra y Gravedad |
| **Gravedad** (Oleada 2) | **Mover** | Atrae o empuja proyectiles, levanta cascos (expone las celdas de abajo) e invierte el campo | Los gatos flotan y se duermen en el aire | Fuerte contra Cristal y Tormenta; débil contra Vacío y Tiempo |

**Plasma y Sueño NO son elementos** (justificación):

| | Por qué no | En qué se convierte |
|---|---|---|
| **Plasma** | Ya existe como Fuego+Tormenta (Plasmín) | Estado **Sobrecarga** de la Resonancia de combate (§9.3): Fuego+Tormenta sincronizados encadenan descargas |
| **Sueño** | Su verbo ("cambiar las reglas") funciona mejor como **campo** | Regla de región (Sueños), estado alterado y **Naturaleza narrativa "Onírico"** para Ecos |

**Por qué no más elementos:** la matriz de afinidad crece al cuadrado. Con 13 hay 169 celdas; con 17 serían 289. Además, cada elemento extra reparte entre más elementos las mismas ~80 especies nuevas, y eso diluye la colección.

---

## 7. Gatos, clasificación, Ecos y evoluciones

### 7.1 Cinco ejes que NO se mezclan **[DECIDIDO]**

| Eje | Qué es | ¿Da poder? | Ejemplos |
|---|---|---|---|
| **Rareza** | Presupuesto de poder y probabilidad. Ya existe. | Sí | Común → Divino. **No se agregan rarezas.** |
| **Elemento** | Verbos de combate y afinidades | Sí (es táctico) | 13 + Cristal + Gravedad |
| **Manifestación (Eco de Vida)** | Otra posibilidad de la *misma* identidad | Es lateral (sidegrade) | "Canelo, Eco Naufragio" |
| **Evolución** | Una transformación grande, con arte, kit y conducta nuevos | Sí, pero se puede alternar | Canelo Almirante y Canelo Astral |
| **Naturaleza narrativa** | De dónde viene el gato. Etiqueta, no poder. | No | Primordial (ya existe), **Resonante, Paradoja, Anómalo, Onírico, Imposible** |

Así se evita multiplicar categorías: "Eco", "Resonante", "Paradoja", "Anómalo" e "Imposible" son **etiquetas de origen**, no tiers. Cambian la conducta en la isla, las interacciones y el Catdex; no la estadística.

### 7.2 Nueve Vidas y Ecos de Vida **[DECIDIDO]**

Las Nueve Vidas son **nueve posibilidades** de la misma identidad, no resurrecciones.

- **Datos:** cada especie tiene de 1 a 9 Ecos posibles. En la instancia del gato se guarda `ecos: string[]` (desbloqueados) y `eco: string|null` (activo). La migración agrega el arreglo vacío; los datos viejos no cambian.
- **Desbloqueo:** por hazañas reales, no por tareas diarias. Ejemplos: ganar con ese gato bajo la lluvia, que duerma 3 noches en la misma palmera, cruzarlo en un Santuario de cierto elemento o llevarlo a una región.
- **Qué da un Eco:**
  1. un **recuerdo** (texto en el Catdex);
  2. una **apariencia** (lente de material del motor sobre la misma pintura, o arte nuevo para los Ecos estrella);
  3. **una** habilidad lateral, o un estado distinto en su ataque;
  4. una **conducta ambiental** nueva (p. ej., el Eco Náufrago de Canelo duerme en el barco).
- **El truco de producción:** las **lentes** de PaperCat dan variedad sin pintar 9 veces cada gato: cristal, tinta, oro, estática, acuarela y holograma. El slice ya prueba la lente "estática" en REGISTRO 000.
- **Sin obsolescencia:** un Común con 9 Ecos completos obtiene la **Resonancia de Nueve Vidas**, una ulti exclusiva (p. ej., *Nueve Destinos*, §9.4) que ningún Divino tiene.

### 7.3 Evoluciones **[DECIDIDO]**

Habrá entre 20 y 30 en toda la expansión. Reglas:
- Una evolución cambia el arte, la animación y el kit, y le da **un nuevo rol estratégico** y una **conducta nueva en la isla**.
- **Nunca se pierde la forma original:** el jugador elige qué manifestación usar en la isla y en la tripulación.
- **Requisitos:** nivel + 1 Eco concreto + Nácar + una hazaña de historia. Nada de farmear lo mismo 50 veces.

**Canelo** (ambas formas conservan la bufanda, la panza y la impaciencia):

| Forma | Fantasía | Kit | En la isla | Se desbloquea |
|---|---|---|---|---|
| **Canelo Almirante** (17 solo como kit de capitán: no es Canelo; falta concepto naranja) | Líder naval | **¡A BABOR!**: un turno en que todos los gatos de la tripulación re-apuntan como si tuvieran el ángulo de Canelo. Es liderazgo, no daño. | Patrulla el muelle, duerme en el barco y les grita a las gaviotas | Oleada 1, tras cruzar el Primer Mar con él como capitán |
| **Canelo Astral** (concepto 18; base de estilo 16) | La anomalía | **Bola de Pelo de Horizonte**: un proyectil que entra a una grieta y reaparece en otro punto del campo, elegido por el jugador | **Es el único que puede ver a REGISTRO 000**: se queda mirando el peñasco | Oleada 3, en Puerto Cometa |

**Primeras evoluciones** (Oleada 1, además de Canelo):
- Gelatino → **Gelatino Marea**: forma de ola; nada bajo el casco enemigo.
- Cometín → **Cometín Perihelio**.
- Copito → **Copito Glaciar Nácar** (Cristal).

### 7.4 Volumen de contenido por oleada

| Oleada | Especies nuevas | Evoluciones | Ecos para especies existentes |
|---|---|---|---|
| 1 | 22 (6 Cristal, 6 Tinta/Archivo, 6 del mar nuevo y 4 secretas, REGISTRO 000 incluido como no obtenible) | 4 + 2 de Canelo | 30 |
| 2 | 22 (6 Gravedad y celestes) | 8 | 30 |
| 3 | 20 (astrales y de Puerto Cometa) | 8 | 25 |
| 4 | 16 (oníricas y de frontera) | 6 | 25 |
| **Total** | **≈80** | **≈28** | **≈110** |

La producción de arte sigue el pipeline MAI y Codex (`arte-nuevo/`, manifest con `coat_en`), más rigs. Ver 08 §8.

---

## 8. La isla viva **[CONFIRMADO v1 en el slice; DECIDIDO para producción]**

### 8.1 Qué ya funciona (vertical slice)

- **Director de vida ambiental por utilidad** (`engine/life/director.ts`):
  - **Necesidades:** energía, juego, compañía.
  - **Rasgos:** juguetón, curioso.
  - **Etiquetas de elemento.**
  - Re-planifica con compromiso y ruido, y también cuando cambia el mundo (empieza la lluvia, cae la noche).
- **11 actividades** (`rupturas/life.ts`), todas verificadas por prueba o en headless:
  - pasear, siesta en su lugar, perseguir (con cambio de roles), saludar (chocar cabezas);
  - el gato de Fuego derrite la nieve del hábitat de Hielo (vapor, y Copito reacciona);
  - mirar estrellas (los cósmicos, de noche); refugiarse (todos menos Agua);
  - **bailar bajo la lluvia** (Agua) y **cafeína de tormenta** (Tormenta);
  - nadar ("los gatos SON líquidos"); spa de lava (Ignis); sentarse y acicalarse.
- **Canelo duerme bajo SU palmera, y cuando llueve, duerme más.** **[CONFIRMADO por test]**

### 8.2 Para producción

**Catálogo por elemento.** Cada elemento tiene 2 conductas propias y 1 interacción con otro elemento. Ejemplos:
- Sonido: le da serenata a quien duerme.
- Sombra: se esconde en la sombra de las palmeras (se calcula con la dirección real del sol).
- Tiempo: anuncia la hora y bosteza al mediodía.
- Luz: sigue el haz del faro.
- Vacío: se sienta "en ningún lado" (flota a 5 cm).
- Cristal: se mira en charcos.
- Gravedad: duerme flotando.

**Momentos.** Viñetas raras de 5 a 10 s que el director dispara con baja probabilidad:
- dos gatos comparten un pescado;
- un gato se duerme encima de otro;
- Canelo le roba el lugar a un Divino;
- un gato persigue el haz del faro.

**Afordancias de props.** Cada decoración declara *spots*: `sleep`, `perch`, `play`, `swim` y `hide`. Las actividades buscan spots, no coordenadas, así que una decoración nueva da vida nueva sin tocar código.

**LOD de IA.**
- Cerca de la cámara (< 60 u): tick completo y puppet a 20 fps.
- Fuera de pantalla: el director corre a 2 Hz, sin deformar la malla.
- A más de 40 gatos visibles: impostor estático para los lejanos (un frame de su pintura).

Esto resuelve el riesgo de 01 (hoy cada gato es una malla con su propio ticker, sin tope).

### 8.3 Hábitats como dioramas

Cada hábitat es un **prefab de diorama** que define:
- suelo, props y emisores de partículas;
- una luz local, que también ilumina a los gatos (PaperCat lee hasta 4 luces);
- un loop de ambiente;
- spots con afordancias.

El tamaño crece con los **tiers que ya existen** (3×3 → 4×4 → 5×5).

**[CONFIRMADO, slice]** Tres dioramas funcionando:

| Hábitat | Qué tiene |
|---|---|
| **Fuego** | Lava con corteza que fluye, cono humeante, brasas y luz que parpadea |
| **Hielo** | Montículo de nieve, cristales con fresnel, iglú y nieve que cae |
| **Cósmico** | Domo con un universo de bolsillo, planetas orbitando y polvo estelar |

Faltan 12 elementos más Cristal y Gravedad, con un "efecto firma" cada uno (lista en 08 §6).

### 8.4 Expansión territorial

- Las 12 expansiones que ya existen se mapean a **chunks de terreno** del heightfield.
- Se agregan **distritos**: Muelle y Astillero ampliado, Jardín, Ladera, Plataforma Astral y Santuario Evolucionado.
- Al pasar a 2.5D, el layout actual de cada hábitat se **traduce** a coordenadas del diorama. Es una función pura, con pruebas contra las partidas fixture.
- **Nada se pierde ni se mueve sin permiso:** si algo no cabe, queda en "por colocar", con aviso.

---

## 9. Combate

### 9.1 Qué se conserva **[CONFIRMADO]**

- **Artillería por turnos sobre un simulador determinista** (`battle/sim.ts`). La pantalla *es* la simulación con semilla y la estimación corre la misma pelea. Es lo que hace satisfactorio el combate y permite estimar, repetir y balancear con agentes.
- **Barcos modulares** por celdas, cataclismos y gritos de ataque.

### 9.2 Capas de campo de batalla **[DECIDIDO]**

Cada batalla declara su **capa**. Los parámetros del simulador ya existen o son escalares:

| Capa | Gravedad | Viento | Particularidad |
|---|---|---|---|
| Mar | 1 | Variable | Olas que mueven la línea de flotación (y exponen celdas) |
| Cielo | 0.7 | Fuerte y en capas | Islas flotantes como cobertura; caer al vacío = módulo perdido |
| Astral | 0.25 | 0 | Pozos orbitales: un disparo puede darle la vuelta a un planetoide |

### 9.3 Resonancia de combate (habilidades sincronizadas) **[DECIDIDO]**

Cuando la tripulación tiene la combinación y sus medidores están llenos, aparece **SINCRO**. Cada sincro **cambia el comportamiento del campo**, no solo el daño:

| Combinación | Sincro | Qué cambia |
|---|---|---|
| Agua + Tormenta + Gravedad | **Ciclón Oceánico** | 2 turnos de viento circular y el casco enemigo se levanta: quedan expuestas las celdas inferiores |
| Fuego + Tormenta | **Sobrecarga** (Plasma) | Los impactos encadenan una descarga al módulo vecino; hasta 3 saltos |
| Cristal + Luz | **Prisma** | Tu siguiente disparo se divide en 3 colores con efectos distintos |
| Hielo + Agua | **Mar Congelado** | El mar entre los barcos es suelo: los proyectiles rebotan en él |
| Sonido + Sombra | **Silencio** | El enemigo no ve tu trayectoria (sin línea de previsualización) por 1 turno |
| Tiempo + cualquiera | **Eco Táctico** | Repite el último ataque de un aliado en otra posición |
| Gravedad + Cósmico | **Colapso Estelar** (ver abajo) | — |
| Naturaleza + Tierra | **Arrecife** | Crece cobertura nueva en el agua |

### 9.4 Poderes extraordinarios: diseño con consecuencia **[DECIDIDO]**

**Regla.** Cada poder imposible tiene:
1. un efecto en las reglas;
2. una contra-jugada;
3. un límite (1 por batalla o 1 por fase);
4. una secuencia cinematográfica que se puede saltar y respeta "Reducir movimiento".

| Poder | Efecto estratégico | Contra-jugada | Estado |
|---|---|---|---|
| **Colapso Estelar** | Una singularidad atrae enemigos **y proyectiles en vuelo** durante 2.5 s y luego estalla en área | Disparar *antes* de que abra, o detrás de cobertura | **[CONFIRMADO en el slice:** la balsa dispara de vuelta y el agujero se traga las balas] |
| **Nueve Destinos** | Aparecen 9 Ecos del mismo gato; cada uno dispara con un ángulo distinto que el jugador elige en abanico | Escudos amplios | [PROPUESTO] |
| **Espejo Absoluto** | Una faceta de Cristal devuelve el siguiente proyectil con su efecto | Proyectiles "pesados" la atraviesan | [PROPUESTO] |
| **Sueño Colectivo** | 2 turnos de una regla onírica sorteada que afecta **a ambos** bandos | Saber leer la regla | [PROPUESTO] |
| **Juicio del Mar** | Una ola reposiciona ambos barcos e intercambia barlovento y sotavento | Anclas (módulo nuevo) | [PROPUESTO] |
| **Paradoja Cero** | Repite una habilidad que *ya se usó* en esta batalla, pero con las condiciones de ahora | Gastar las ultis en orden | [PROPUESTO] |

### 9.5 Jefes multi-capa **[PROPUESTO; técnica validada en parte]**

**Ejemplo: el Leviatán Invertido.**
- **Fase 1, en el mar:** pelea normal.
- **Fase 2:** arrastra la pelea al cielo. Los barcos con Kit de Vuelo siguen; los que no, pelean desde una tromba-plataforma.
- **Fase 3:** al borde de una grieta astral, con gravedad 0.25.

**Técnica:**
- Las fases son **eventos del simulador** (cambio de parámetros, deterministas).
- La transición visual es un cambio de entorno del motor detrás de un flash o de una cortina de nubes. Esa técnica de "esconder detrás del efecto" ya se usa en el Colapso: hit-stop + flash.

---

## 10. Embarcaciones **[DECIDIDO]**

| Familia | Dónde sirve | Ventaja | Limitación |
|---|---|---|---|
| **Marítimos** (los 6 de hoy) | Mar y cuevas | Más camarotes y cañones pesados; bonus en el mar | No vuelan |
| **Aerobarcos** (Kit de Vuelo sobre **tu** barco) | Mar y cielo | Ignoran las olas; maniobras de altura | Sin cañones pesados; el viento los empuja |
| **Naves astrales** (Puerto Cometa) | Cielo y astral | Inmunes al viento; maniobras orbitales | Gastan Combustible Astral por viaje |

- **El barco del jugador nunca queda obsoleto:** se *convierte* con kits y conserva su nombre y su historial.
- **Hay rutas que exigen una familia:** las cuevas de Nácar solo admiten marítimos y las Islas Invertidas, aerobarcos. Así cada familia tiene su momento.

---

## 11. Economía (detalle en 06)

**Diagnóstico de 01:**
- El precio del orbe crece de forma lineal con el ingreso y **exponencial (×2.01 por paquete) con un contador que nunca se reinicia**.
- **El arreglo está en 06**, implementado con pruebas por un agente en esta misma sesión.

**Recursos nuevos: solo tres** **[DECIDIDO]**. El brief sugería "cristal de resonancia", pero ya existen *cristales por elemento* (01), así que se renombra para no chocar.

| Recurso | Para qué | Fuentes | ¿En riesgo en ETERNO? |
|---|---|---|---|
| **Nácar** | Ecos y evoluciones | Isla Nácar, duplicados de gatos y jefes | **No** (es material de progreso) |
| **Combustible Astral** | Viajes astrales | Producción en Puerto Cometa; sin temporizador agresivo | Sí (es recurso blando) |
| **Tinta de Ruptura** | Desbloquear regiones y abrir fichas del Diario Perdido; cosméticos de lente | Páginas Hundidas, eventos fugaces | **No** |

**Gastos de oro** (para que el oro siga valiendo):
- distritos y dioramas de hábitat;
- kits de conversión de barco;
- muelles y plataformas.

**ETERNO** **[CONFIRMADO, sin cambios]**:
- Solo pone en 0 el oro, las gemas, los pescaditos, los boletos y las fichas.
- **Nunca toca gatos, Ecos, evoluciones, Nácar ni Tinta.**

**Progresión:**
- Avanza por misiones de historia y hazañas.
- Hay **eventos fugaces con fecha** (las carreras, los bolsillos pop), pero **ninguna tarea diaria obligatoria**.

---

## 12. Santuario v2 y Catdex v2

**Santuario** **[DECIDIDO]**. Ya existen el historial de 40 parejas, los favoritos y el botón LLENAR (01/ESTADO). Se agrega:
- **Historial persistente agregado:** pareja → resultados ×N. Se compacta por pareja, así que no crece sin límite.
- **Pistas claras:** cada intento fallido revela información concreta («cerca: falta Cósmico», «este secreto pide nivel 25»). Nunca se repite a ciegas.
- **Genealogía:** `parents` en cada instancia nueva (campo opcional). Las instancias viejas quedan como "origen desconocido", que es canon: llegaron en cajas.
- **Cruces de Resonancia:** cruzar Ecos produce Ecos raros y gatos de **naturaleza Resonante**.

**Catdex** **[DECIDIDO]**. Deja de ser un catálogo y se vuelve **herramienta de descubrimiento**. Pestañas por especie: Origen · Ecos · Relaciones · Cruces · Habilidades · Secretos · Archivo.
- La pestaña *Archivo* cuenta la conexión de cada especie con las Rupturas.
- **REGISTRO 000 es la única ficha que se edita sola** entre sesiones.
- Se corrige el subtítulo "CAPÍTULO 1 / EL PRIMER MAR", que sigue igual después del final (03).

---

## 13. Animación (principios; detalle en 08 §5)

**Principios:** anticipación, follow-through, peso, ritmo, reacción contextual y legibilidad. Pequeño y bien hecho le gana a cien partículas.

**Ya se aplica en el slice:**
- agacharse antes de saltar (`crouch`), de lanzar el Colapso y de una persecución;
- saltitos al correr;
- volteo de carta al cambiar de dirección;
- emotes reactivos: un rayo asusta a todos menos al de Tormenta;
- hit-stop de 90 ms al estallar.

**Sistema:**
- La conducta reusable vive en el **PuppetBrain**, que es compartido por la isla 2D, las batallas y el mundo 2.5D.
- La identidad vive en los **actos y conductas por especie**: un Primordial no se acicala, se *estira como montaña*.

---

## 14. Interfaz

- **Desktop-first:** mouse y teclado con atajos (WASD, Q/E, F3 para rendimiento, H para modo foto).
- La HUD 2D sigue en **Pixi** sobre el canvas 3D (dos canvas apilados; ver 07).
- En el slice la UI es DOM, porque era más rápido de prototipar.

**Accesibilidad mínima** **[CONFIRMADO en el slice]**:
- reducir movimiento y destellos (también respeta `prefers-reduced-motion`);
- intensidad de efectos;
- calidad automática;
- foco visible y `aria-label`s;
- textos de al menos 11 px en la HUD de depuración y de al menos 13 px en la interfaz de juego.

---

## 15. Arquitectura técnica (resumen; ver 07)

- **Pixi v8 se queda** para la UI y la isla 2D clásica.
- **three.js r186** se usa para el mundo 2.5D (WebGLRenderer + GLSL hoy; migrar a WebGPU/TSL es opcional y requiere medir antes).
- **AgentGameEngine** vive en `game/src/engine/`. Módulos implementados: `core` (noise, perf/quality), `world` (heightfield, ocean, sky/daycycle, weather, flora, paperCat), `fx` (particles), `camera` (rig) y `life` (director).
- La **lógica del juego** (economía, campaña, sim) no se mueve al motor.

---

## 16. Migración (ver 07 §7)

**Convivencia en paralelo:**
1. `rupturas.html` (el slice).
2. La "Vista Rupturas" de la isla, como opción en Ajustes, leyendo la partida en **solo lectura**.
3. La isla 2.5D por defecto, con la vista clásica como respaldo.
4. Los mapas en capas.
5. Las batallas en 2.5D.

Cada paso exige una línea base, una medición después, pruebas de compatibilidad con las fixtures (`game/test-saves`) y **ninguna doble escritura** de la partida.

---

## 17. Plan de producción por oleadas

| Oleada | Nombre | Entregable jugable | Puerta de calidad (gate) |
|---|---|---|---|
| **0** (en curso) | **Cimientos** | Vertical slice: isla 2.5D, vida, clima, faro, barco, Colapso, REGISTRO 000. **[HECHO, ver 10]** | 60 FPS p95 en la referencia (M-series ✓; falta Iris Xe) |
| **1** | **La Marea Imposible** | Vista Rupturas de la isla con la partida real (solo lectura → lectura y escritura); H31–H36; Páginas Hundidas y Nácar; Cristal; 22 especies; Canelo Almirante y Astral (Astral queda sellado hasta la Oleada 3); Ecos v1; Santuario v2; orbes arreglados; 6 sincros; jefe Bibliotecario | Las fixtures de partida abren sin pérdidas; la isla con 40 gatos va a 60 FPS en Media |
| **2** | **El Cielo Despierta** | Corona Celeste e Islas Invertidas; Gravedad; aerobarcos y kits; batallas en el cielo; Correctores | Batalla celeste determinista: la sim y la estimación coinciden en 16 semillas |
| **3** | **La Era Astral** | Puerto Cometa; naves; Combustible; jefes multi-capa; Disruptores | Transición de capa a mitad de batalla < 1 cuadro largo |
| **4** | **El Umbral** | Sueños, La Isla que Nadie Recuerda (a partir de tu partida) y Umbral; desenlace que abre la Saga III | La isla generada desde 14 fixtures sin solapes |

**La primera oleada es grande a propósito:** el brief pide impacto desde el día 1, no una introducción mínima.

---

## 18. Criterios de calidad (medibles)

| Área | Criterio | Cómo se mide | Estado |
|---|---|---|---|
| **Rendimiento** | p95 ≤ 16.7 ms y p99 ≤ 33 ms en la isla con 10 gatos y clima, calidad Alta, en **Apple M1 o superior**. En **Intel Iris Xe**, calidad Media a 1080p. | HUD F3 (FrameStats) y harness headless (`__rupturas.stats()`) | M4: p50 16.7, p95 16.7, p99 16.8 ms ✓. Iris Xe **sin medir**. |
| Degradación | AutoQuality baja un nivel tras 4 s con p95 > 20 ms; nunca sube sola | Test unitario | ✓ |
| Estabilidad | La Parte I no cambia de comportamiento | 77 tests, typecheck y paridad del puppet (600 cuadros, 3 gatos, delta < 1e-4) | ✓ |
| Persistencia | Las partidas viejas abren sin pérdidas; la Parte II no escribe nada hasta su migración | Fixtures y `saveSafety.test` | El slice no toca partidas ✓ |
| Calidad visual | Luz por hora, sombras, vida y composición superan una "migración a 3D" | Revisión con capturas (10 §3) | Primera iteración ✓; faltan pulidos (10 §5) |
| Gameplay | Cada mecánica crea una decisión | Revisión de diseño por mecánica (§9 tablas) | Diseño ✓ |
| Contenido | Agregar un gato o una isla es repetible | Guías (07 §6) | Gato ✓ (CAST + rig existente); isla, parcial |
| Narrativa | No contradice el canon | Revisión contra 03 | ✓ |
| Accesibilidad | Movimiento reducido, intensidad de efectos, textos legibles, controles remapeables (pendiente) | Checklist | Parcial |

---

## 19. Riesgos y soluciones

| Riesgo | Prob. | Impacto | Solución |
|---|---|---|---|
| Límite de GitHub Pages (~1 GB): `dist` ya ocupa 690 MB por los SVG de gatos | Alta | Alto | Mover `cats-svg/` a un segundo repo de Pages o a un bucket (R2/S3) con el mismo `base`. El 3D no suma peso (three = 178 KB gz). Decidir antes de la Oleada 1. |
| Los SVG lite tardan en rasterizar (~1 MB y 12k paths cada uno) | Media | Medio | Cache de rasters por build (ya existe `rasterCache.ts` en Pixi) y extenderlo a PaperCat; worker con OffscreenCanvas |
| Dos renderers (Pixi y three) con dos contextos GL | Media | Medio | Dos canvas apilados (02 lo recomienda); presupuesto de VRAM por tier; pérdida de contexto manejada |
| Scope creep (80 especies) | Alta | Alto | Oleadas con puertas de calidad; Ecos con lentes en vez de arte nuevo |
| PI (conceptos 1, 3 y 14; "Catdex" y "Plinko" en 03 §7) | Media | Alto | Lista legal en 04; los conceptos con PI son referencia, no asset |
| Partidas: IDs frágiles y expansiones por índice | Media | Crítico | Solo campos nuevos opcionales; migración con fixtures; nunca renombrar |
| Calidad visual dispareja entre los gatos (el arte AI de distintas fuentes) | Media | Medio | Grading por hora y luz común en PaperCat (ya unifica); guía de lentes |
| WebGL2 en hardware débil | Baja | Medio | Nivel Bajo: DPR 1, escala 0.75 y sin sombras de gatos |
