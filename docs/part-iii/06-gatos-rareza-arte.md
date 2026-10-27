# 06 · Gatos multidimensionales, rareza MULTIDIMENSIONAL, arte y animación

Las marcas [DUEÑO], [CANON], [PROPUESTA] y [ABIERTO] significan lo mismo que en `02`.

**Fuentes técnicas:**
- `investigacion/arte-pipeline.md`: pipeline, límites del rig y de la vectorización, costos medidos y plantilla de brief.
- `investigacion/sistemas.md` §3: rarezas, prefijos y qué tocaría en código.

---

## 1. La rareza MULTIDIMENSIONAL [DUEÑO: rareza propia, categoría propia en la colección y la interfaz]

**Corrección del dueño (2026-10-13):** no es una marca sobre Legendario. Es **una rareza nueva**, con categoría propia. No hace falta que suba todas las estadísticas ni que vuelva inútiles a los gatos anteriores.

### 1.1 Qué es en el mundo

Un gato que **existe en más de una caja a la vez** y **no cambia de trazo** al cruzar.
- Los gatos normales toman el trazo de la caja a la que llegan (`02` §5.1).
- Un Multidimensional lleva su estilo a todas partes: el de cómic es de cómic en tu isla, en Anime y en la batalla.
- Es lo primero que lo distingue a la vista.

### 1.2 Tres conceptos separados por dentro (una sola rareza por fuera)

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Rareza** `multidimensional` | Categoría de colección: nombre, color, marco de carta, orden, filtro, revelación y sección del Catdex. Tiene **su propia fila** en las tablas de economía | `RarityId` nuevo (opción B de `investigacion/sistemas.md` §3.6) |
| **Origen** `origin: 'p3d_superheroes'` | Su caja natal: decide su trazo fijo, el fondo de su carta y en qué dimensión se consiguen sus orbes | Campo de `CatDef` |
| **Regla de origen** `originRule: 'noche'` | La regla de combate que trae de su caja | Datos + `battle/multidim.ts` |

Separarlos permite que un gato **normal** de una dimensión (Hipólito, por ejemplo) tenga origen y trazo sin ser Multidimensional, y que la rareza no sea un multiplicador escondido.

### 1.3 Relación con las rarezas actuales

| Rareza | Poder base | Oro/s base | Lo que la define |
|---|---|---|---|
| Común … Legendario | 5.0 … 6.8 | 0.5 … 2.1 | Presupuesto de poder |
| (Primordial) | = legendario | = | Origen de un elemento (marca) |
| **MULTIDIMENSIONAL** (nueva) | **6.9** | **2.4** | **Cambia las reglas de la batalla.** Su número queda entre legendario y mítico **a propósito**: un mítico, heroico o divino sigue siendo más fuerte en estadísticas |
| Mítico · Heroico · Divino | 7.4 · 7.6 · 7.9 | 3.2 · 3.6 · 4.4 | Presupuesto de poder |

- **En la interfaz** ocupa un lugar aparte:
  - el chip «MULTIDIMENSIONAL» va **al final** del filtro, como categoría distinta;
  - en el Catdex tiene su propia sección, **«FUERA DE LA CAJA»**;
  - su color es **iridiscente**: cambia entre las paletas de las cinco dimensiones;
  - su marco de carta es **una caja abierta** con el trazo de su origen.
- **Valores propuestos** para las demás tablas: orbes por duplicado 80, orbes por ★ 45, gemas al descubrir 3 y comida ×2.2. **Se calibran con el simulador** antes de fijarlos.
- **Riesgo técnico conocido:** una rareza nueva toca más de 20 archivos y 8 tablas, y una entrada faltante da `NaN` en oro y poder. Se mitiga así:
  - todos los `Record<RarityId, …>` se vuelven exhaustivos para que el compilador obligue;
  - las 5 copias de `RARITY_H` se juntan en una;
  - una prueba recorre todas las rarezas por las funciones de economía y exige números finitos.

### 1.4 Su función estratégica: **cambian las reglas, no los números**

Cada Multidimensional trae tres cosas:

1. **Regla de origen.** Mientras está vivo en la tripulación, mete en la batalla una regla de su caja. Cada regla reusa una perilla existente o una que la Parte III construye de todos modos (`investigacion/sistemas.md` §4).
2. **Cruce.** Los gatos **de la casa** del elemento indicado ganan +10 % de daño y se pintan con su trazo durante la batalla. **Así los gatos viejos valen más, no menos.**
3. **Ventaja de casa.** En su dimensión de origen, su regla dura toda la batalla. Fuera de ella, se apaga 1 turno de cada 4. Así hay una razón para usarlos donde nacieron.

### 1.5 ¿Uno por tripulación? Propuesta con justificación, **pendiente de probar** [DUEÑO: justificar y comprobar]

**Por qué lo propongo:**
1. **Legibilidad.** Dos reglas a la vez pueden volver ilegible la trayectoria (por ejemplo, Noche + Telaraña: oscuro y curvo).
2. **Balance.** Apilar reglas puede trivializar el contenido.
3. **Ficción:** «dos protagonistas no caben en la misma viñeta».

**Antes de fijarla, se prueba** (Etapa 3 de `09`):

| Prueba | Cómo | Umbral |
|---|---|---|
| Balance por pares | Simulador determinista: las 15 parejas posibles de las 6 reglas iniciales × 16 semillas × 3 tripulaciones (perfiles de `sistemas.md` §2.3) | Si alguna pareja sube la victoria **más de 12 puntos** sobre la mejor regla sola, hay que limitar |
| Legibilidad | Captura sin cabeza de cada pareja + **revisión del dueño** | Si la guía de trayectoria deja de leerse a 1080p, hay que limitar |
| Estimación | La estimación sigue igual a la batalla con dos reglas | Debe seguir determinista (sin margen) |

**Si hay que limitar, la propuesta no es «uno por tripulación».** Es **«una sola regla activa»**: puedes llevar varios Multidimensionales, pero solo **el protagonista** (lo marcas con una estrella en «Elegir tripulación») activa su regla. Los demás pelean con sus estadísticas y su Cruce. Así coleccionar varios sigue valiendo la pena.

**Si las pruebas no muestran problema:** no se limita.

### 1.6 Cómo se obtienen

- **Nunca** salen del Portal, del Casino ni de la Resonancia.
- **El primero de cada uno** se gana con la historia o con su encuentro de rescate en su dimensión (§2).
- **Orbes y estrellas:** de la actividad de su dimensión y al repetir sus niveles, que es una razón para volver (`05` §9).
- **En el post-juego** aparecen rescates de los de la expansión.

---

## 2. Catálogo (con estados)

**Estados** (`investigacion/arte-pipeline.md` §7): **DISEÑADO → GENERADO → INTEGRADO → VERIFICADO**. En GENERADO hay que esperar **la aprobación del dueño**.

**Regla de variedad** [DUEÑO: «evita repetir el mismo gato cambiándole el traje o el color»]. Cada gato del catálogo tiene **algo distinto** en cuatro ejes: complexión, pose, raza o pelaje, y mecánica. La tabla de §2.6 lo comprueba.

**Nombres** [DUEÑO: nombres felinos propios]. La referencia se entiende **por el arte, la personalidad y las animaciones**. El nombre es un chiste propio, no el de la marca.

**Frases** [DUEÑO]: todas son originales. **Ninguna** se atribuye a una persona real ni cita una letra.

### 2.1 Estado de producción hoy

| Id | Nombre | Diseñado | Generado | Integrado | Verificado |
|---|---|---|---|---|---|
| `r_hipolito` | Hipólito | ✓ | ✓ candidato v1 (**falta aprobación del dueño**) | ✓ como candidato: SVG completo 3,55 MB + lite 632 KB + rig | Parcial (ver `10`) |
| `p3_espuma` | Doña Espuma | ✓ | ✓ candidato v1 (**falta aprobación**) | ✓ como candidato: 1,97 MB + 320 KB + rig | Parcial |
| `p3_dona` | Oficial Dona | ✓ | ✓ candidato v1, con Hipólito y Espuma como anclas (**falta aprobación**) | ✓ como candidato: 3,30 MB + 572 KB + rig (capitán de la élite B-5 y hablante) | Rig revisado por QA y ajustado |
| Lote Q (11 gatos de los Actos I–II) | — | ✓ fichas compiladas para Codex (`arte-nuevo/prompts/lote-p3a-actos-1-2/`) | — | — | — |
| El resto (§2.3–2.5) | — | ✓ | — | — | — |

**Primera medición del estilo plano** (criterio A-1): Hipólito pesa 3,55 MB y Doña Espuma 1,97 MB en completo, frente a 7,2 MB de promedio de la colección. **Se confirma que el estilo caricatura pesa la mitad o menos.**

### 2.2 Historia (los que la trama necesita)

| Id | Nombre | Dimensión | Rareza | Elemento | Rol en la historia | Lote |
|---|---|---|---|---|---|---|
| `r_hipolito` | Hipólito | Borracha | Raro | Agua | El gato del «¿Y luego?» | S |
| `p3_espuma` | Doña Espuma | Borracha | Personaje | — | La cantinera | S |
| `p3_cadenero` | El Cadenero | Borracha | Épico | Tierra | Jefe B-9 | A |
| `p3_dona` | Oficial Dona | Borracha | Raro | Tierra | Élite B-5. Policía que se cura comiendo donas | A (en la porción, un suplente con la lente) |
| `p3_bombin` | Don Bombín | Borracha (la mañana en B/N) | Raro | Sombra | Vagabundo de cine mudo: bombín, bastón y zapatos enormes. Nunca habla (intertítulos) | A |
| `c_cerito` | Cerito / REGISTRO 000 | Todas | **no aplicable** | ninguno | La posibilidad que toma forma de gato | A |
| `p3_borron`, `p3_cruceta`, `p3_ito`, `p3_firma`, `p3_lamano` | Los 5 Titiriteros | Una cada uno | Mítico (marca `titiritero`) / La Mano: personaje | — | §4.4 | A/B |
| `p3_esquirla`, `p3_sinfin` | Esquirla y Sinfín | Disruptores | Personaje / Raro | Vacío / Sonido | La Disruptora dura y el niño sin final | A/B |

### 2.3 Multidimensionales: superhéroes y anime

| Id | Nombre (propio) | Referencia (se entiende por el arte) | Complexión y pose | Pelaje | Regla de origen / habilidad | Chiste | Frase original |
|---|---|---|---|---|---|---|---|
| `x_murciegato` | **Murciégato** | Detective nocturno multimillonario | Alto, delgado, de pie en una cornisa, con la capa recortada como ala | Negro azulado, ojos amarillos | **Noche** | Rico, huérfano… y le tiene miedo al baño | «La noche no es mía. Es de los gatos: nosotros sí vemos.» |
| `x_gatarana` | **Gato Araña** | Vecino trepador | Pequeño y ágil, de cabeza, colgado | Atigrado rojo, medias blancas | **Telaraña** (pozo con tela) | Lo picó una araña. Se la comió. Ahora tiene sus poderes | «Un gran poder… da mucha hambre.» |
| `x_supermichi` | **Supermichi** | Héroe que vuela | Ancho y musculoso, flotando con el puño al frente | Blanco con rizo negro en la frente | **Invulnerable al primer golpe** de cada batalla | Su única debilidad: la **catnipita**, un cristal verde de catnip | «Más rápido que un láser rojo.» |
| `x_hambron` | **El Increíble Hambrón** | Gigante verde que se enfurece | **Enorme**, encorvado, sin camisa, con el short roto | Gris que **se vuelve verde** con hambre (lente de color) | Hace más daño cuanto menos vida tiene. Al 30 % se transforma | Se calma con un pescadito | «¡HAMBRÓN… TENER… HAMBRE!» |
| `x_gatopool` | **Gatopool** | Antihéroe que rompe la cuarta pared | Mediano, en pose cómica, con dos katanas de pescado | Rojo y negro | **Revive una vez** con 1 de vida y un chiste sobre la barra de vida | Le habla al jugador y critica la interfaz | «¿Viste mi barra de vida? Yo tampoco la quería ver.» |
| `x_gatamaravilla` | **Gata Maravilla** | Heroína amazona | Atlética, de pie, con lazo | Calicó dorado | **Lazo de la verdad:** revela el punto débil del jefe (como el Análisis al 40 %) | El lazo es un estambre | «Di la verdad: ¿quién se comió el atún?» |
| `x_supersiames` | **Super Siamés** | Guerrero que se transforma | Atlético, en guardia | Siamés *seal-point*, ojos azules | **Transformación** al 50 % | Entrena con Canelo, que lo copia mal | «¡Mi poder pasó de nueve! …Nueve vidas, digo.» |
| `x_bigoton` | **Príncipe Bigotón** | El rival orgulloso | Bajo, brazos cruzados, pelo en pico | Negro azabache | Daño +20 % **contra el gato más fuerte** del enemigo | Siempre queda segundo y nunca lo admite | «No es rivalidad. Es que tú vas atrás.» |
| `x_gomitas` | **Gomitas D. Michi** | Pirata elástico | **Estirado**: un brazo larguísimo | Atigrado naranja, cicatriz chica bajo el ojo (no la del original) | Sus tiros **rebotan** una vez | Comió la fruta del chicle. No sabe nadar (es gato, nunca supo) | «¡Voy a ser el rey de… las sardinas!» |
| `x_kagebunyan` | **Kagebunyan** | Ninja de clones | Corriendo inclinado, brazos atrás | Atigrado amarillo con marcas de bigote | **Clones:** su disparo sale doble y uno es falso | Termina las frases con «¡miau-ttebayo!» | «¡No me rindo, miau-ttebayo!» |
| `x_sailormichi` | **Sailor Michi** | Guerrera mágica con listón | De puntitas, girando, con listón | Blanco con medialuna en la frente | **Transformación:** cura 15 % a la tripulación una vez | Era la gata consejera de la heroína y se cansó de aconsejar | «Por el poder de la luna… y de la croqueta.» |
| `x_gatojo` | **Gatojo** | Poses imposibles y espíritu detrás | En una **pose imposible** | Persa gris con marcas geométricas | **Doble golpe:** un gato fantasma detrás repite su tiro al 50 % | Hasta para comer hace pose | «ゴゴゴ… es solo el ronroneo.» |

### 2.4 Multidimensionales: libros y POP (cantantes hispanos y angloparlantes)

| Id | Nombre (propio) | Referencia | Complexión y pose | Pelaje | Regla / habilidad | Chiste | Frase original |
|---|---|---|---|---|---|---|---|
| `x_harrygatter` | **Harry Gatter, el que maulló** | Estudiante de magia | Delgado, con túnica **genérica**, lentes redondos y varita-bigote | Negro con pecho blanco | **Hechizo escrito** (lluvia, calma o raíz) | Sobrevivió nueve veces a lo mismo | «¡Expelliarmiau!… no, espera, esa no es.» |
| `x_gatodalf` | **Gatodalf el Gris** | Mago viejo de las montañas | **Anciano**, encorvado, con bastón y sombrero puntiagudo | Maine coon gris de pelo largo | **Barrera:** bloquea un proyectil por batalla | Llega tarde siempre, «justo a tiempo» | «Por aquí no se pasa… salvo con croquetas.» |
| `x_quijote` | **Don Gatote de la Mancha** | Caballero andante (dominio público) | **Flaquísimo**, con armadura de lata y lanza | Atigrado café y flaco | Embiste el módulo más grande. A veces es un ventilador | Ataca ventiladores convencido de que son gigantes | «¡Ved allí, Sancho, un gigante! …Ah, es el ventilador.» |
| `x_sherlock` | **Sherlock Ronrones** | Detective victoriano (dominio público) | Sentado, con lupa y gorro de cazador | Atigrado gris elegante | **Deducción:** muestra el siguiente movimiento de la IA enemiga | Resuelve todo, menos dónde dejó la pelota | «Elemental, mi querido michi.» |
| `e_sonrisa` | **Sonrisa** | Gato que desaparece (Carroll, 1865) | Larguirucho, **medio desvanecido** | Rayas violeta y rosa | Esquiva un tiro de cada 3 (se desvanece) | Deja su sonrisa cuando se va | «Aquí todos estamos un poco locos. Yo un poco más.» |
| `x_frankengato` | **Frankengato** | El monstruo cosido (dominio público) | **Grande y rígido**, con costuras y tornillos | Parches de colores cosidos | **Revive** a un aliado caído una vez | Le tiene miedo a las tormentas… y es de Tormenta | «¡Está vivo! …Bueno, yo. Yo estoy vivo.» |
| `x_gatomalo` | **Gato Malo** | Estrella urbana que mezcla géneros | Relajado, **sentado de lado** | Blanco con manchas negras | **Flow:** el viento cambia de lado cada turno | Se viste de conejo «porque sí» | «Hoy me visto de conejo. Mañana, de lo que me dé la gana.» |
| `x_tailorswift` | **Tailor Swift** | Estrella pop de las eras | Elegante, **girando**, con micrófono de cristal | Crema con puntas rubias | **Eras** (el elemento rota cada 2 turnos) | Todo lo que le haces termina siendo una canción | «Esto va a ser canción. Y tú vas a salir en ella.» |
| `x_billiebigotish` | **Billie Bigotish** | Cantante de susurros y ropa enorme | **Encorvada, con sudadera gigante** que tapa medio cuerpo | Pelo de dos tonos, negro con raíces verde neón | **Susurro:** sus tiros no se telegrafían y la IA no los esquiva | Canta tan bajito que los demás gatos se acercan… y se duermen | «Shhh. Lo bonito se dice bajito.» |
| `x_shakimiau` | **Shakimiau** | Diva de las caderas | **De pie, bailando**, descalza | Rubia ondulada de pelo largo | **Temblor:** su ulti sacude el campo y desordena la cobertura | Aúlla como loba aunque es gata | «Soy gata, pero aúllo cuando quiero.» |
| `x_michimami` | **Michimami** | Flamenco urbano en moto | Con **casco de moto** y uñas larguísimas, en pose de baile | Siamés chocolate | **Chasquido:** su turno no gasta tiempo una vez por batalla | Arranca la moto con un chasquido | «¡Pa' la moto, que esto se pone flamenco!» |
| `x_michota` | **La Michota** | Reina del reguetón | Segura, con la mano en la cadera | **Pelo azul turquesa** (tinte) | **Modo Michota:** +10 % a toda la tripulación por 3 turnos | Se nombra sola reina y nadie le discute | «Si me vas a criticar, ponte en la fila.» |
| `x_pesopelusa` | **Peso Pelusa** | Corridos tumbados | **Chiquito** con voz enorme, sombrero vaquero y mullet | Gris con bigote espeso | Sus tiros **flotan** (gravedad baja) | Pesa menos que su sombrero | «Peso poquito, pero canto pesado.» |
| `x_divogatarez` | **El Divo de Gatárez** | Ícono de la balada y el escenario | De pie, con **saco de lentejuelas** y abanico | Blanco crema de pelo esponjado | **Ovación:** al ganar una ronda, cura 10 % | Llora en cada canción y el público llora con él | «Lo que se ve no se juzga… se aplaude.» |
| `x_ladygata` | **Lady Gata** | Diva pop de vestuarios imposibles | **Vestuario-escultura** (un vestido hecho de latas de atún) | Esfinge (sin pelo) | **Monstruo:** cambia de rol cada batalla (sorteado con semilla) | Nadie la ha visto dos veces igual | «No nací así. Me rediseño.» |
| `x_miauknd` | **The Miauknd** | Cantante de noche, traje rojo y falsete | Delgado, **traje rojo**, lentes oscuros de noche | Negro con nariz con curita | Más daño **de noche** (estado del mundo) | Usa lentes oscuros a las 3 a. m. | «Solo salgo de noche. Por la vibra.» |
| `x_edtangerino` | **Ed Tangerino** | Cantautor pelirrojo de guitarra y loops | **Redondo**, sentado con una guitarrita | **Atigrado naranja**: todos los gatos naranjas dicen ser él | **Loop:** repite su tiro anterior al final de la ronda | Graba su maullido y se acompaña solo | «Una guitarra, un pedal y mucho atún.» |
| `x_freddiemercurio` | **Freddie Mercurio** | Voz de estadio, chaqueta amarilla y bigote | De pie, con **medio pedestal de micrófono** en alto | Negro de bigote espeso | **Llamado y respuesta:** cada tiro en el beat (regla Ritmo) suma un combo | Ensaya su llamado con las gaviotas | «¡Eeeh-ooo!… ¿Nadie? ¡Gaviotas, conmigo!» |
| `x_elvispelvis` | **El Rey del Ronroneo** | El rey del rock and roll | Con **tupé**, de pie, moviendo la cadera | Negro azabache con patillas | **Mueve la cadera:** esquiva el primer tiro de cada ronda | Se va del escenario antes del final, siempre | «El Rey ha salido del arenero.» |

### 2.5 Expansión posterior (no se promete en la primera entrega)

`p3_michis` (los 7 Michis, grupo de K-pop: un personaje de conjunto), `l_botas` (El Gato con Botas, Perrault), `e_ovillo` (Doctor Ovillo, villano), Sancho Panzón (escudero de Don Gatote) y los Titiriteros coleccionables del post-juego (`05` §9).

### 2.6 Prueba de variedad (que ninguno sea «el mismo con otro traje»)

| Eje | Valores distintos en el catálogo |
|---|---|
| Complexión | enorme (Hambrón, Frankengato), flaquísimo (Don Gatote), chiquito (Peso Pelusa, Gato Araña), pera (Hipólito), atlético (Super Siamés, Gata Maravilla), anciano (Gatodalf), redondo (Ed Tangerino), alargado (Sonrisa, Firma) |
| Pose | colgado de cabeza, flotando, estirado, girando, encorvado, en cornisa, bailando, sentado de lado, pose imposible, embistiendo |
| Raza o pelaje | siamés (×2: seal-point y chocolate, con poses opuestas), esfinge, maine coon, persa, calicó, tuxedo, atigrados de 4 colores, teñidos (turquesa y neón), parches cosidos |
| Mecánica | 26 habilidades distintas: ninguna repetida |

---

## 3. Dirección de arte por dimensión [DUEÑO: variedad real · PROPUESTA: decisiones concretas]

**Invariantes, para que el rig y la colección funcionen** (`arte-pipeline.md` §5):
- cámara de 3/4 hacia la izquierda, cuerpo completo y patas en la línea base;
- **dos ojos abiertos**, orejas libres;
- cola visible y lejos de la cara;
- flotantes con aire alrededor;
- **que se lea gato**.

**Lo que varía de verdad:** silueta, proporciones, línea, color, sombra, textura (en shader), actuación, composición y movimiento.

**Regla de oro:** la textura de pantalla (trama, Ben-Day, grano, acuarela, brillantina) va en el shader, nunca en la pintura (`arte-pipeline.md` §4.3).

| | Borracha (caricatura de TV) | Superhéroes (cómic) | Anime (shōnen) | Libros (ilustración de cuento) | POP (pop + cine mudo) |
|---|---|---|---|---|---|
| **Silueta** | Pera: panza abajo, cabeza chica arriba, hocico salido. Lee como «tipo del bar» a 64 px | Triángulo invertido: pecho ancho, cadera angosta, capa como una sola forma grande | Pelo o melena en mechones puntiagudos que rompen el contorno; postura de guardia | Alargada y elegante, con objeto de cuento: libro, varita, vela | **Pop:** una forma de vestuario grande y simple (chamarra enorme, falda de lentejuelas en 3–4 formas). **Cine mudo:** bombín, bastón y zapatos grandes |
| **Proporciones** | Ojos enormes y redondos, juntos; patas cortas; cuerpo blando | Cabeza ~1/4 del alto, patas firmes, «heroico pero tierno» | Ojos grandes con brillo duro; cuerpo atlético; patas largas | Proporción de libro ilustrado victoriano: cabeza grande, cuerpo fino | Pop: cabeza grande, cuerpo de muñeco. Mudo: cuerpo flaco, pies grandes |
| **Línea** | Oscura, **uniforme**, 12–14 px a 1024 | Tinta de **peso variable**, 12–16 px; negros en bloque | Media, 6–8 px, limpia y de color oscuro (no negro puro) | Pluma media (≥ 6 px), café sepia, nunca *hairline* | Pop: sin línea en los brillos y línea de color en la materia. Mudo: línea negra media |
| **Color** | Plano y saturado de tele: ámbar cerveza, rosa dona, verde botella, azul noche. **Nunca** piel amarilla de cierta serie | Cuatricromía plana: rojo, azul, amarillo y negro | Plano por sección; cielo en bandas | 2–3 valores de acuarela **plana**, sepia y apagados | Pop: neón y pastel audaces. Mudo: **se pinta en color plano y el post lo vuelve B/N** |
| **Sombra** | 0–1 sombra dura | 2 tonos con borde duro + negros masivos | Cel de 2 tonos, borde nítido | Aguada plana en 2 valores | Pop: 1 sombra y 1 luz. Mudo: 2 tonos |
| **Textura (en shader)** | Curvatura de TV y líneas de barrido suaves (`CRTFilter`) | Ben-Day, desregistro CMYK (`ComicFilter`, horneado te ODIO) | Trama manga en lo oscuro (`bakeCel`) | Papel y granulado de acuarela (`catF`, `PaperFilter`, `bakeMiniature`) | Pop: destellos en FX. Mudo: grano, parpadeo e iris (`film.ts`) |
| **Actuación** | Tambaleo, hipo, dormirse de pie, caerse con dignidad | Poses de portada, aterrizaje con rodilla, mirar a lo lejos | Grito de carga, temblor de aura, pose antes del golpe, cara de esfuerzo | Gestos chicos y teatrales; asomarse detrás del libro | Pop: bailar al ritmo, girar, guiñar. Mudo: caminata de pato, tropezón, sombrerazo |
| **Composición** (escenas y Momentos) | Plano fijo de sitcom con risas enlatadas que nunca suenan (solo se ve el letrero APLAUSOS) | Viñetas, cortes de página, splash pages | Líneas de velocidad, cut-ins diagonales, latigazos de cámara | Páginas que se pasan, viñetas iluminadas, marcos de capitular | Pop: escenario con luces y cámara de videoclip. Mudo: iris, intertítulos y plano general fijo |
| **Movimiento** | Rebote *rubber-hose* sobre el tiempo | Cuadros de impacto y onomatopeyas sólidas | Animación «en dos» a 12 fps, smears | Lento, con papel que tiembla | Pop: en el beat. Mudo: a 18 fps acelerado |

**Canelo sigue siendo Canelo** [DUEÑO]:
- En cada dimensión su pintura es **la misma**, horneada con la lente de esa caja. **Nunca** se redibuja ni cambia de silueta, bufanda o panza.
- En los Momentos se hornea al estilo del Momento, como ya pasa en los de la Parte II.
- Su gesto propio (`CANELO` en `art/temperament.ts`) viaja con él a todas partes.

**Los Titiriteros encarnados [PROPUESTA].**
- La Biblia de arte de la Parte II los dibujaba como «manos y luz, nunca cuerpos» (`arte-pipeline.md` §5). En la Parte III **ganan cuerpo**: esa es la historia.
- Para que se lean como Titiriteros en cualquier estilo, todos llevan:
  1. una **mancha blanca con forma de mano** en una pata delantera;
  2. **dedos manchados de tinta**;
  3. **hilos de luz que salen de sus patas**, hechos **en código** (líneas que se mueven), nunca pintados.

  Los tres rasgos sobreviven a cualquier lente.

---

## 4. Fichas de personaje y animaciones especiales

**Animaciones especiales.** Se hacen con datos e intents (temperamento, reacciones, manías, utilería en código). Ninguna pide pintura nueva salvo donde se indica. Son baratas (`arte-pipeline.md` §8.2).

**Cinco ranuras por gato:**
- **Presentación**: la revelación al obtenerlo.
- **Ataque**: disparo y ulti.
- **Reacción**: al recibir daño o ante un evento.
- **Celebración**: al ganar o subir de nivel.
- **Ambiental**: conducta en la isla.

### 4.1 Hipólito (Lote S · ancla de la Borracha)

- **Personalidad:** buena gente, dormido 90 % del tiempo y con una memoria de pez que es su superpoder. Solo dice «¿Y luego?». No juzga a nadie. **En la Borracha nadie se acuerda de nada, y Hipólito es el único que no finge.**
- **Silueta:** pera enorme, sentado en un banco invisible; hocico salido, ojos medio cerrados, un tarro de espuma como objeto protagonista.
- **Pelaje:** atigrado gris claro, panza blanca, ojos ámbar acuosos; un parche calvo en la cabeza; cachetes rosados.

| Ranura | Qué hace | Técnica |
|---|---|---|
| Presentación | Cae dormido hacia la cámara y se despierta justo antes de pegar con el suelo. «¿Y luego?» | Intent `lean` + `crouch` + cue de texto |
| Ataque | Disparo: lanza el tarro (proyectil = tarro). Ulti «¿Y LUEGO?»: **repite el último disparo aliado**, porque no se acuerda de que ya pasó | Utilería en código + regla chica en el simulador (costo medio) |
| Reacción | Se tambalea y no se cae nunca | Manía `sway` (`arte-pipeline` §5) |
| Celebración | Levanta el tarro, se le olvida por qué y lo baja | Intent |
| Ambiental | En tu isla busca la sombra de algo que parezca barra (muelle, puesto) y se duerme acodado | Temperamento + spots del director de vida |

**Frase:** «¿Y luego?» (y nada más; esa es la gracia).

### 4.2 Doña Espuma (Lote S · personaje)

- **Personalidad:** cantinera seca y sabia. Sirve, limpia la barra y nunca pregunta. «Lo que pasa en La Última Ronda se olvida en La Última Ronda.»
- **Silueta:** gata alta y recta detrás de una barra; trapo al hombro como objeto protagonista; pelo recogido con un lápiz (guiño: el único lápiz que hay en la caja).
- **Pelaje:** calicó (naranja, negro y blanco), ojos verdes cansados.
- **Animación:** limpiar el vaso (manía en bucle) y mirar de reojo.

### 4.3 Cerito / REGISTRO 000 (Lote A)

- **Silueta:** gatito chico y redondo. Una sola pintura neutra: gris perla, con una **mancha blanca en forma de anillo (un cero) en la frente**.
- **Antes de elegir:** shader de estática en el borde + la lente de la caja donde está. En la Borracha se ve toon; en Superhéroes, con puntos. Nunca está quieto: parpadea entre estilos 1 cuadro cada tanto.
- **Después de elegir:** se apaga el shader. Es un gatito común. Su pelaje se queda gris perla con el cero.
- **Animación:** sigue a Canelo a 2 pasos, imita su manía con retraso, se duerme en la cobija (`08` §5.4).
- **No habla nunca.** Su ficha se escribe sola (`02` §4.4).

### 4.4 Titiriteros (Borrón, Cruceta, Itō, Firma y La Mano)

| | Borrón | Cruceta | Itō | Firma | La Mano |
|---|---|---|---|---|---|
| Caja | Borracha | Superhéroes | Anime | POP | Libros |
| Silueta | Gato grande y deshecho, con una mancha de tinta como babero | Gato con capa hecha de un **papel de guion** doblado y antifaz de tinta | Gato largo y delgado de kimono de papel; en la espalda, **hilos** como funda de espada | Gata con vestido de **firma**: un trazo caligráfico enorme que la envuelve | Gata pálida, larga y sin pelaje marcado, casi de papel; **la pata derecha es una mano blanca** con la uña como plumín |
| Pelaje | Negro mate con manchas de tinta | Gris pizarra | Blanco y negro (tinta china) | Crema con puntas doradas | Blanco papel, ojos de tinta |
| Actitud | Descubrió las donas y no quiere volver | Pose de héroe todo el tiempo, aunque nadie lo mire | Quieto, respira antes de cada movimiento | Siempre hacia la cámara | Inmóvil. Solo se mueve la uña |
| Firma de animación | Hipo (manía) | Aterrizaje heroico | Desenvainar los hilos (utilería en código) | Pose de portada en cada golpe | Trazo de tachón (FX en código) |
| Frase | «Abajo hay donas. Arriba no hay donas. Hagan sus cuentas.» | «Esta ciudad necesita un héroe. Por suerte, ese soy yo. Por desgracia, ustedes son los villanos.» | «Pelearé contigo. De frente. Es lo último que me queda de autor.» | «Un show sin estrella es un ensayo. Y yo no ensayo.» | «Te lo pedí dos veces, farera.» |

### 4.5 Los cinco ejemplos del dueño (ahora con nombre propio) [DUEÑO]

Batcat → **Murciégato** · Spidercat → **Gato Araña** · Harrycat → **Harry Gatter** · Bad Cat → **Gato Malo** · Taylor Cat → **Tailor Swift**. Las fichas de abajo valen igual con los nombres nuevos.

**Regla de parodia [PROPUESTA; ver riesgos en §6].** La parodia va en la **actitud, la silueta y el chiste**, nunca en la marca:
- sin emblemas, logos, trajes calcados, cicatrices icónicas ni rasgos faciales de personas reales;
- **sin letras ni títulos de canciones reales**;
- las frases son originales.

#### Batcat (Superhéroes · Multidimensional · Sombra)

- **Concepto:** detective nocturno con más gadgets que amigos. **Es el que dice la pista del final:** «La noche no es mía, es de los gatos: nosotros sí vemos» (`03` §5).
- **Silueta:** capa larga **recortada en forma de ala** (sin el corte de una marca concreta), orejas altas y naturales (**las orejas son las del gato**, no de una capucha) y cinturón de utilería.
- **Pelaje:** negro azulado, ojos amarillos.
- **Prohibido:** emblema en el pecho, máscara con orejas de murciélago y la paleta gris y negra exacta de una marca.
- **Animaciones:**
  - presentación: cae desde arriba con la capa abierta y aterriza en cuclillas;
  - ataque: lanza un búmeran-pez (utilería en código);
  - reacción: se envuelve en la capa;
  - celebración: se da vuelta y «desaparece» (alfa a 0) cuando la cámara vuelve;
  - ambiental: de noche se sienta en lo más alto de tu faro.
- **Frases:** «No soy un héroe. Soy un gato con presupuesto.» · «La noche no es mía, es de los gatos: nosotros sí vemos.»

#### Spidercat (Superhéroes · Multidimensional · Naturaleza)

- **Concepto:** gatito trepador y bromista del barrio. Origen propio: **lo picó una araña, se la comió y ahora tiene sus poderes**.
- **Silueta:** cuerpo ágil, siempre pegado a una pared invisible; la tela sale de las patas (código).
- **Pelaje:** atigrado rojo con medias blancas en las patas y ojos azules grandes.
- **Prohibido:** patrón de telaraña en el pelaje o traje, emblema de araña y la combinación rojo-azul de traje.
- **Animaciones:**
  - presentación: baja colgado de un hilo, de cabeza;
  - ataque: tira la tela y el disparo sale curvo;
  - reacción: chiste nervioso (globo de texto en código);
  - celebración: voltereta;
  - ambiental: duerme colgado de cabeza bajo el muelle.
- **Frase:** «Un gran poder… da mucha hambre.»

#### Harrycat (Libros · Multidimensional · Magia)

- **Concepto:** estudiante de magia que llegó tarde a su propia caja porque se quedó leyendo.
- **Silueta:** túnica escolar **genérica** con capucha de gato, varita que es un bigote largo y anteojos redondos (con `lid` elíptico, como el Archivista).
- **Pelaje:** negro con pecho blanco, ojos verdes.
- **Prohibido:** cicatriz en la frente, bufanda de colores de una casa concreta, emblemas de escuela, lechuza blanca con carta y escoba de marca.
- **Animaciones:**
  - presentación: aparece de un libro que se abre como pop-up;
  - ataque: chispas de varita (código) con la palabra escrita en el aire;
  - reacción: se le empañan los lentes;
  - celebración: un sombrero sale volando;
  - ambiental: lee en la biblioteca de tu isla, si hay, o junto a la página en blanco.
- **Frases:** «La magia es leer instrucciones con mucha fe.» · «¿Esto se puede escribir? Entonces se puede hechizar.»

#### Bad Cat (POP · Multidimensional · Sonido)

- **Concepto:** estrella urbana que se viste como quiere y le cambia el género a todo. Es un gato con **gorro de orejas de conejo**: «el gato malo disfrazado de conejo».
- **Silueta:** gorro de pescador con orejas largas de conejo como forma dominante, lentes oscuros grandes y uñas pintadas de colores (formas planas).
- **Pelaje:** blanco con manchas negras, ojos cafés.
- **Prohibido:** rasgos faciales o peinados reconocibles de la persona real, logos de sus giras o marcas y nombres de álbumes o canciones.
- **Guiños:** le gusta la lucha libre, así que su **ulti es un azotón de luchador**, «¡ESTO NO ES BAILE, ES LUCHA!». Además, cambia de estilo de música a mitad de frase.
- **Animaciones:**
  - presentación: entra quitándose los lentes al ritmo;
  - ataque: el azotón (intent `lift` + `sy`);
  - reacción: se acomoda los lentes;
  - celebración: baile con `lean` en el beat;
  - ambiental: en la isla pone música para los demás gatos, que mueven la cabeza a su ritmo (`temperament`).
- **Variante de cara** [ABIERTO]: una pintura extra con boca abierta para cantar; es cara (`arte-pipeline` §4.5.3). Se recomienda **no** hacerla en el primer lote.
- **Frases originales:** «Yo no sigo modas: las modas me siguen a mí y se tropiezan.» · «Hoy me visto de conejo. Mañana, de lo que me dé la gana.» · «Tranqui, que el que manda aquí es el ritmo.»

#### Taylor Cat (POP · Multidimensional · Sonido / Eras)

- **Concepto:** estrella pop que vive por **eras**: cada era trae otro vestuario, otro color y otra canción. Escribe canciones sobre todos los que le fallaron (con nombres cambiados, «por si acaso»). Regala pulseras de la amistad.
- **Silueta:** vestido corto de **3–4 formas grandes de lentejuelas** (nunca brillantina pintada), micrófono con cristales y pulseras como flotantes.
- **Pelaje:** crema con puntas rubias, ojos azules, labio que parece pintado (forma plana).
- **Las eras en el juego:** la pintura es **una sola**. Cada era es una **lente de color** (paleta y brillo de FX) que cambia cada 2 turnos (§1.3).
- **Prohibido:** rasgos faciales reconocibles de la persona real, nombres de álbumes, canciones, giras o eras reales y letras.
- **Animaciones:**
  - presentación: sale del escenario con humo y gira;
  - ataque: lanza pulseras (utilería en código);
  - reacción: anota algo en una libretita, porque eso va a ser canción;
  - celebración: corazón con las patas;
  - ambiental: en la isla les pone pulseras a los gatos que duermen.
- **Variante de cara** [ABIERTO]: igual que Bad Cat.
- **Frases originales:** «Esto va a ser canción. Y tú vas a salir en ella.» · «Nueva era, nuevo vestido, mismo corazón.» · «Pulseras para todos… menos para los Correctores.»

**Letras reales:** [PENDIENTE, identificado] la Parte III **no usa ninguna**. Si el dueño quiere citar una, hace falta licencia del titular. No hay ninguna cita atribuida inventada en este documento.

### 4.6 Super Siamés (Anime · Multidimensional · Fuego)

- **Concepto:** siamés de artes marciales que se transforma (referencia de *Dragon Ball*: transformarse, gritar y entrenar). **Su pelo se vuelve dorado y se eriza**, pero en mechones de gato, no en el peinado de un personaje.
- **Silueta:** pelo de puntas de siamés (orejas, cara, patas, cola) más oscuro, ojos azul intenso, cinta roja en la cintura y postura de guardia.
- **Prohibido:** gi naranja con símbolo, peinado calcado y nombres de técnicas reales.
- **Animaciones:**
  - presentación: grito de carga con aura (`floats` + FX);
  - ataque: «¡SIAMÉS-HA!»;
  - reacción: cae y se levanta con flashback (la regla Poder);
  - celebración: pose de victoria;
  - ambiental: entrena con Canelo en la isla al amanecer: Canelo lo copia mal.
- **Frase:** «¡Mi poder pasó de nueve! …Nueve vidas, digo.»

---

## 5. Briefs para Codex y cómo pasan al juego

### 5.1 Pipeline (resumen; detalle en `arte-pipeline.md` §2)

`manifest.json` (fuera del repo) → `compilar.mjs` → Codex (PNG en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`) → revisión del director → 700 px → MAI (completo + lite) → rig (`catRigs.json` + copia MAI) → datos → laboratorio y tests → publicación (con OK del dueño).

**Los PNG nunca entran al repo.**

**Cambios al taller antes de la Parte III** (`arte-pipeline.md` §6.1):
- un *style lock* por dimensión;
- anclas por dimensión (el primer gato aprobado);
- el bloque `VECTOR_READY`;
- la prueba de silueta a 64 px en la hoja de contacto.

### 5.2 Style locks por dimensión (borradores)

```text
[NO ONE LIKE CATS — DIMENSION STYLE LOCK: BORRACHA — DO NOT MODIFY]
This cat belongs to the BORRACHA (tavern) dimension: a 1990s-style TV cartoon world, original design.
Medium: 2D TV-cartoon character art, uniform dark outline (12-14 px at 1024), flat saturated fills, at most one hard shadow.
Anatomy: real cat anatomy with cartoon proportions: big round eyes close together with small pupils, pear-shaped body, prominent muzzle, short legs.
Palette: beer amber, donut pink, bottle green, night blue, plus the coat. NEVER yellow skin, NEVER overbite caricature of any existing show.
Never: painted texture, gradients, halftone, film grain, glitter.
```

```text
[NO ONE LIKE CATS — DIMENSION STYLE LOCK: ANIME — DO NOT MODIFY]
This cat belongs to the ANIME (shōnen) dimension. Original design.
Medium: 2D cel-shaded anime character art, clean colored line 6-8 px (never pure black), two-tone hard-edged cel shading.
Anatomy: real cat anatomy, large expressive eyes with one hard highlight, athletic body, fur clumps drawn as sharp readable spikes.
Never: screentone or halftone painted, speed lines painted, gradients except one aura glow, any recognizable costume, symbol or hairstyle from an existing series.
```

```text
[NO ONE LIKE CATS — DIMENSION STYLE LOCK: LIBROS — DO NOT MODIFY]
This cat belongs to the LIBROS (storybook) dimension. Original design.
Medium: 2D Victorian storybook illustration, sepia pen line 6-10 px, FLAT watercolor fills in 2-3 values with defined edges.
Palette: muted sepia, ink blue, wine red, parchment.
Never: painted watercolor granulation, paper texture, hairline crosshatching thinner than 6 px, any school crest, scar or branded wizard costume.
```

```text
[NO ONE LIKE CATS — DIMENSION STYLE LOCK: POP — DO NOT MODIFY]
This cat belongs to the POP (music video / stage) dimension. Original design.
Medium: 2D pop-art character, bold flat neon and pastel fills, colored line on materials, no line on highlights; sparkle shown as 3-4 big flat shapes.
Never: glitter or sequin texture painted, real person likeness, logos, album art, lyrics, letters.
Silent-film variant: paint in FLAT COLOR; the game converts to black and white.
```

El de Superhéroes ya está escrito en `arte-pipeline.md` §6.4.

### 5.3 Ficha completa: Hipólito (Lote S, la primera que se genera)

```json
{
  "id": "r_hipolito",
  "name": "Hipólito",
  "epithet": "el de la barra",
  "lote": "p3s",
  "folder": "lote-p3s-borracha",
  "file": "lote-p3s-borracha/r_hipolito.png",
  "parte": "Parte III",
  "dimension": "borracha",
  "style_lock": "estilo/dimensiones/BORRACHA.txt",
  "references": [],
  "rarity": "Raro",
  "elements": ["Agua"],
  "role": "Tanque",
  "concept_es": "El gato borracho de La Última Ronda. Duerme de pie, no se acuerda de nada y es buena gente. Solo dice «¿Y luego?».",
  "look_es": "gato gordo en forma de pera, sentado como en un banco, tarro de espuma en una pata, ojos medio cerrados, cachetes rosados, parche calvo en la coronilla",
  "identifying_features_es": [
    "tarro de cerveza con espuma desbordada como objeto protagonista",
    "párpados a media asta con ojos ámbar acuosos",
    "parche calvo redondo en la coronilla",
    "cachetes rosados planos"
  ],
  "subject_en": "a chubby pear-shaped tavern cat sitting as if on an invisible bar stool, one front paw holding a big beer mug with overflowing foam, sleepy half-closed eyes, pink flat cheeks, a small round bald patch on top of the head, friendly dopey smile with the mouth closed",
  "coat_en": "light grey tabby with soft darker grey stripes, white belly and white muzzle, short hair, watery amber eyes",
  "silhouette_en": "a pear: wide round belly at the bottom, small head on top, prominent muzzle, the mug sticking out to image-left as the second biggest shape",
  "proportions_en": "cartoon: head one third of height, big belly, very short legs, small paws",
  "line_en": "uniform dark plum outline (#2A1A2E) 12-14 px at 1024 on the silhouette, 8 px inside; no line on the foam highlight",
  "palette": ["#2A1A2E", "#F2B134", "#F7C7D6", "#3C7A5A", "#1F2A4A", "#FFF4E0"],
  "color_en": "flat saturated TV-cartoon fills; the foam is one flat cream shape",
  "shading_en": "one hard-edged shadow shape under the belly and the chin, cool purple tint",
  "texture_en": "NONE painted",
  "pose_en": "sitting upright but slightly swaying to image-right, hind paws on the shared baseline, mug held at chest height",
  "expression_en": "sleepy, content, mouth closed, BOTH eyes visible and half-open (eyelids drawn, irises visible)",
  "accessories_en": ["big glass beer mug with foam"],
  "hero_prop_en": "the beer mug, readable at 64 px",
  "rig_notes_en": [
    "Eyelids are part of the eye area: irises must be visible below them so the rig can blink.",
    "The mug is held away from the face with 3% of canvas of clear space; it never covers the muzzle.",
    "The tail curls around the front of the body at the baseline, fully visible, far from the face."
  ],
  "must_not_include_en": [
    "No yellow skin, no overbite, no resemblance to any character of an existing animated series.",
    "No logos or text on the mug, no brand labels, no letters anywhere.",
    "No human, no bar furniture painted (the stool is invisible)."
  ],
  "variants": [],
  "corrections_en": []
}
```

### 5.4 Fichas cortas del resto

Cada una se convierte en ficha completa (formato §5.3) **al pasar a GENERADO**. Aquí van los campos que definen la identidad.

| Id | `subject_en` (resumen) | `coat_en` | Objeto protagonista | `must_not_include_en` (clave) |
|---|---|---|---|---|
| `p3_espuma` | tall calico bartender cat behind an implied counter, towel over shoulder, a pencil holding her hair bun | calico orange/black/white, green tired eyes | the towel | no logos, no human bar |
| `c_cerito` | tiny round kitten, curious, sitting | pearl grey, white ring-shaped mark on forehead, big dark eyes | the ring mark | nothing static painted (the shader adds it) |
| `p3_borron` | big sloppy black cat with an ink-blot bib, a white hand-shaped mark on the right front paw, ink-stained toes | matte black with ink blotches | the ink bib | no pencils painted |
| `p3_cadenero` | huge bouncer cat with crossed arms (paws), tiny sunglasses, a velvet rope post beside him as one flat shape | dark brown, scar-free, yellow eyes | velvet rope post | no brand, no text |
| `p3_cruceta` | heroic grey cat with a cape made of a folded script page and an ink-drop domino mask, white hand mark on paw | slate grey | the script-page cape (no readable text) | no emblem, no letters |
| `x_batcat` | night detective cat with a long wing-cut cape, utility belt with fish-shaped boomerang | blue-black, yellow eyes | the fish boomerang | no chest emblem, no bat-ear cowl, no branded palette |
| `x_spidercat` | agile red tabby clinging to an invisible wall, white socks | red tabby, white socks, blue eyes | none (web is code) | no web pattern on fur or suit, no spider emblem |
| `p3_ito` | long slender ink-brush cat in a paper kimono, threads as a sword on the back (threads are code) | black and white ink-wash pattern | the paper kimono | no clan symbol |
| `x_supersiames` | martial-arts siamese with red waist sash, fighting stance | siamese seal-point, deep blue eyes | the red sash | no symbol on clothes, no famous hairstyle |
| `p3_esquirla` | wiry punk cat with spray cans in both paws, torn jacket as one shape | dark grey with neon green tips | spray cans (no text) | no graffiti text painted |
| `p3_lamano` | tall pale paper-white cat, right front paw is a white hand with an ink-nib claw | paper white, ink-black eyes | the nib claw | no human hand, no text |
| `p3_firma` | diva cat wrapped in one giant calligraphic signature stroke as a dress | cream with gold tips | the signature dress (no readable letters) | no logos, no real person |
| `x_harrycat` | storybook wizard student cat, generic hooded school robe, round glasses, whisker-wand | black with white chest, green eyes | the whisker-wand | no forehead scar, no house scarf, no crest, no owl |
| `x_badcat` | urban star cat in a fisherman hat with long bunny ears, big dark sunglasses, painted claws | white with black spots | bunny-ear hat | no real-person likeness, no logos, no text |
| `x_taylorcat` | pop star cat in a short dress of 3-4 big flat sequin shapes, crystal microphone, friendship bracelets floating | cream with blonde tips, blue eyes | the crystal mic | no real-person likeness, no album or era references, no text |
| `e_sonrisa` | lanky striped cat with a huge floating grin, half fading (fade = shader) | purple and pink stripes (original palette) | the grin | **no** film-version design; Tenniel-era feel only |
| `p3_sinfin` | small kid Disruptor cat with a torn book page as a cape | ginger, freckles of ink | torn page | no readable text |

---

## 6. Riesgos y decisiones abiertas de este documento

| Riesgo | Detalle | Propuesta | Decisión |
|---|---|---|---|
| **Parodia** | El dueño quiere humor y parodia reconocible y **no habrá anuncios pagados** | Nombres felinos propios; la referencia se entiende por el arte, la personalidad y las animaciones. Sin emblemas, logos, trajes calcados ni letras. Sin rasgos faciales de personas reales: son gatos | [DUEÑO] decidido |
| **Frases** | Que se lean como citas reales | Todas son originales y ninguna se atribuye a una persona real. Las que **evocan** una frase famosa son paráfrasis con un giro («Elemental, mi querido michi») | Revisión de textos antes de integrar |
| **Hosting** | `nolc-arte` tiene lugar para ~9 gatos | Abrir `nolc-arte-2` antes del Lote A | [ABIERTO] necesita al dueño |
| **Coherencia contra variedad** | La Biblia de arte de la Parte II pedía que todo se viera como el mismo juego | Fijar solo cámara, rig y legibilidad; lo demás es libre por dimensión | [PROPUESTA] |
| **Variantes de cara de los cantantes** | +1 pintura cada una (~8 MB) o código de recorte que no existe | Fuera del primer lote | [ABIERTO] |
| **Peso real de un gato plano** | Estimado en 3–5 MB, sin medir | Medir con Hipólito (el primer gato) antes de fijar el presupuesto del Lote A | Criterio A-1 en `09` |
