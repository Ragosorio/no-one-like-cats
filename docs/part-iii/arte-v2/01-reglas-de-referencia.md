# 01 · Reglas de referencia legible (arte v2)

> Ronda 4 de la Parte III (contrato: `../14-plan-cinematografico.md`). Lo escribe el agente ARTE-V2.
> ⚠️ Carpeta con spoilers. Nada de esto se commitea ni se publica sin el OK del dueño.
> Este documento **reemplaza** la «Regla de parodia» de `../06-gatos-rareza-arte.md` §4.5 y los «Prohibido» de cada ficha de esa sección. `06` queda como historial.

## 0. Qué pidió el dueño y qué cambia

> «Tiene que notarse las referencias aunque sean mínimas. El gato Homero tiene que ser un gato que tiene una dona, siempre tiene que ser amarillo y tiene que parecerse a los Simpsons, pero no necesariamente ser los Simpsons. Lo mismo con el gato Spider-Man, el gato Batman.»

| Antes (`06`, 2026-10-13) | Ahora (v2) |
|---|---|
| La parodia iba en «la actitud, la silueta y el chiste». Se prohibían la paleta de la marca, el traje, la capucha y el patrón (p. ej. Murciégato sin capucha y Gato Araña sin telaraña) | La parodia **se ve**. Cada gato lleva de 3 a 5 **rasgos icónicos** obligatorios: color de firma, objeto, silueta o vestuario, pose y el estilo de dibujo del medio |
| La Borracha prohibía «piel amarilla» y «sobremordida» | La familia del sillón de la Borracha **es amarilla y tiene sobremordida**. Los vecinos nativos (Hipólito, Doña Espuma, Oficial Dona, ya aprobados) se quedan como están |
| Un estilo por dimensión, genérico | El estilo de cada multiverso **evoca su fuente**: caricatura amarilla de TV, cómic, anime, ilustración de libro, videoclip pop y los 5 multiversos nuevos (`02`) |

**Lo que no cambia (decisiones del dueño):**
- nombres felinos propios;
- ningún logo ni nombre registrado copiado tal cual;
- sin rasgos faciales de personas reales: **son gatos**;
- ninguna frase inventada atribuida a un artista real, ninguna letra de canción;
- sin anuncios pagados;
- los tres gatos aprobados (Hipólito, Doña Espuma, Oficial Dona) no se rehacen.

---

## 1. El principio: «se nota aunque sea mínima»

Una parodia de este juego es la suma de cinco cosas:

**anatomía de gato + 3–5 rasgos icónicos + el estilo de dibujo del medio + un nombre felino + un chiste propio.**

Tiene que pasar tres pruebas (§7):
1. **A 128 px** (la carta de la colección), alguien que conoce la referencia la nombra en menos de 3 segundos.
2. **En silueta negra a 64 px**, al menos un rasgo se reconoce (la dona, la capa festoneada, la sudadera gigante, el sombrero de paja).
3. **De cerca**, no es una copia: tiene orejas, bigotes, nariz y cola de gato, emblema propio y nombre propio.

## 2. Qué puede ser un rasgo icónico (las cinco familias)

| Familia | Qué es | Ejemplos | Regla |
|---|---|---|---|
| **Color de firma** | El color que la gente asocia con la referencia | El amarillo de la familia del sillón; el rojo y azul del trepador; el negro con raíces verde neón de la cantante | Va en el **pelaje** o en una pieza grande. Plano, nunca degradado |
| **Objeto (prop)** | Lo que lleva en la pata | Dona rosa con chispas; búmeran; girasol; sable láser hecho con un puntero láser; destapacaños | Tiene que leerse a 64 px y quedar lejos de los ojos (el rig) |
| **Silueta o vestuario** | La forma grande | Capa con borde de ala; sudadera gigante; peinado de colmena azul; gorra roja; armadura | Es lo que sobrevive a la silueta negra |
| **Pose o gesto** | Cómo se para | Agachado de trepador; de pie, serio y quieto; dedos (patas) juntos en «excelente»; paso lunar | Una sola pintura por gato: la pose es la de reposo, el resto lo hace el rig (`../investigacion/arte-pipeline.md` §4) |
| **Estilo del medio** | Cómo está dibujado | Línea uniforme sin sombras (sitcom); tinta con negros en bloque (cómic); cel de 2 tonos (anime); pinceladas en cinta (Van Gogh); píxel cuadrado (consola) | Lo pone el *style lock* del multiverso (§5). La textura de pantalla va en el shader, nunca en la pintura |

**Mínimos por gato** (`historia-v2/01-biblia-v2.md` §6.2 pide «tres rasgos icónicos»: es el mismo mínimo):
- **3 familias distintas** como mínimo, y una tiene que ser el **color de firma** o el **objeto**.
- **1 rasgo** que se lea en **silueta negra a 64 px**.
- El **estilo del medio** siempre, porque viene con su multiverso.
- **Máximo 5** rasgos: con más, la pintura se llena y Codex empieza a copiar.

## 3. Evocar sí, copiar no

| Tentación | Qué se hace en cambio | Ejemplo |
|---|---|---|
| El logo exacto | **Emblema propio de la misma familia de forma**, dibujado distinto. Nunca dentro del marco original (el óvalo, el diamante, el círculo con letra) | Murciégato: cabeza de gato con alas o un pez en la hebilla, nunca el murciélago en óvalo. Gato Araña: huellita con ocho patas, nunca la araña del pecho |
| El nombre | Juego de palabras felino | Homiau, Murciégato, Vincent van Gato, Comecroquetas, Lince |
| El personaje calcado | **Anatomía de gato** y proporciones del juego. La referencia se lleva puesta: no se redibuja a la persona ni al personaje con orejas | Homiau tiene los dos pelitos y la barba **como marcas del pelaje** en una cabeza de gato |
| Una obra concreta | **La técnica y los atributos**, no el cuadro. Solo se cita una composición si la obra es de dominio público | Van Gato: remolinos y girasol, pero no «La noche estrellada» copiada |
| La cara de una persona real | Pelo como **pelaje**, vestuario y objeto. Nunca la cara | Billie Bigotish: raíces verde neón y sudadera gigante, con cara de gata |
| La frase célebre | Línea **original** con giro. Se permite una paráfrasis de la frase de un **personaje de ficción** (precedente aprobado: «Elemental, mi querido michi»). **Nunca** de una persona real, y nunca frases que son marcas registradas | «Que la croqueta te acompañe» (ficción, con giro) sí. Un grito que imite la muletilla registrada de un personaje de TV, no |
| Letras o música | Nada. No se citan letras ni títulos de canciones reales | — |

**Tres pruebas rápidas antes de aprobar una ficha:**
1. **Prueba de la camiseta.** Si recortas el emblema y lo pegas en una camiseta, ¿es el logo oficial? Entonces no.
2. **Prueba del nombre.** ¿El nombre del gato es el nombre registrado con una letra cambiada? Entonces no: tiene que ser un chiste felino.
3. **Prueba de la versión oficial.** ¿La marca ya tiene un **gato oficial** de ese personaje (Cat Mario, Hello Kitty, Doraemon, los gatos de Ghibli…)? Entonces el riesgo es alto: hace falta un giro mayor o se cambia de referencia. El piloto lo confirmó: la herramienta de imágenes bloqueó al plomero dos veces (`04-piloto.md`).

### 3.1 El techo práctico: el filtro de la herramienta de imágenes

La herramienta de imágenes de Codex **revisa la imagen que genera** y la bloquea si se parece demasiado a un personaje protegido (`moderation_blocked`, etapa `output`). Medido en el piloto:
- **Pasaron a la primera:** Homiau (familia del sillón), Vincent van Gato (pintor de dominio público) y Billie Bigotish (cantante).
- **Bloqueados:** Murciégato con capucha gris, capa negra, cinturón amarillo y emblema en el pecho; Gato Araña con traje entero rojo y azul, telaraña y lentes blancos; el plomero con gorra, bigote y overol (×2).
- **Pasaron al bajar un rasgo:** Gato Araña con un **disfraz casero** (gorro tejido con telaraña cosida y suéter azul), que además es el chiste del personaje. Murciégato con **paleta de noche propia** (azul medianoche, tinta y latón); en el cuarto intento pasó también con una capucha gris pizarra y un **emblema propio** (un pez con alas) sobre una placa gris.

**Regla que sale de esto:** si una ficha se bloquea, **no se insiste con la misma imagen**. Se quita o se cambia el rasgo más «de marca» (casi siempre la combinación exacta de colores o el emblema) y se refuerzan la silueta, el objeto y el chiste. Máximo **2 reintentos**. Si sigue bloqueada, el dueño decide si cambiamos de referencia. Esto coincide con la regla legal de §3: el filtro marca el mismo límite que queremos respetar.

### 3.2 Respeto

- **Personas reales:** solo rasgos de su imagen pública (color de pelo, vestuario, objeto). Nada sobre su cuerpo, salud ni vida privada. Ningún político.
- **Mitos y religiones:** los mitos antiguos y las leyendas populares se dibujan con cariño, sin burla. Ningún símbolo sagrado de una religión viva se usa como adorno.
- **Temas sensibles:** se evitan rasgos ligados a heridas o salud mental, aunque sean icónicos. Por ejemplo, Vincent van Gato **no lleva la oreja vendada**.
- **Culturas latinoamericanas** (multiverso VECINDAD y las leyendas de MITOS): homenaje, no estereotipo. Se evocan programas y leyendas, no rasgos étnicos.

---

## 4. Fichas de referencia: los rasgos que SIEMPRE se ven

Estas son las referencias que el dueño nombró y las del piloto. El resto está en `02-catalogo-v2.md`: la columna «Rasgos» de ese catálogo es **obligatoria** para cada gato.

| Gato | Referencia | Siempre (rasgos) | Evocación en vez de copia | Nunca |
|---|---|---|---|---|
| **Homiau Gatson** (Borracha; apellido propuesto por NARRATIVA) | Homero Simpson | 1. **Todo amarillo** plano (#FFD90F). 2. **Dona rosa con chispas** en la pata. 3. **Sobremordida** con mancha de **barba gris-café**. 4. Calvo con **dos pelitos** y mechón en zigzag junto a las orejas. 5. Camisa blanca de manga corta. Estilo: sitcom amarilla, sin sombras, ojos saltones que se tocan | Los pelitos y la barba son marcas del pelaje de un gato | Logo o título de la serie, el sillón pintado, cualquier texto. Su grito no imita la muletilla registrada |
| **Murciégato** (Superhéroes) | Batman | 1. **Capucha-antifaz** con orejas puntiagudas: **las orejas del gato son las de la capucha**. 2. **Capa larga con borde festoneado** de ala. 3. **Cinturón de utilería**. 4. Postura quieta y seria, de noche. Objeto: búmeran de espina de pescado | Paleta de noche propia (azul medianoche, tinta y latón). Emblema: una **espina de pescado horizontal** sobre una placa gris (v5, `05` §4). La v4, con un pez con alas, se dibujó como un murciélago demasiado parecido al logo | El murciélago en el pecho, el óvalo amarillo, el traje gris con capa negra y cinturón amarillo **juntos** (el piloto se bloqueó con esa combinación) |
| **Gato Araña** (Superhéroes) | Spider-Man | 1. **Máscara roja con líneas de telaraña negras gruesas**. 2. **Ojos blancos en lágrima** con borde negro (adentro se ven sus ojos). 3. **Rojo y azul**. 4. **Agachado en pose de trepador**. Objeto: ninguno (la tela es código) | Es un **disfraz casero**: gorro tejido y suéter azul con una huellita de ocho patas. Se le ven el pelaje atigrado rojo y las medias blancas | El traje entero de malla con la araña del pecho |
| **Vincent van Gato** (Pinceles) | Vincent van Gogh (dominio público) | 1. **El estilo es la referencia**: pinceladas en cinta azul cobalto y amarillo cromo, remolinos. 2. **Atigrado pelirrojo** (la barba del pintor). 3. **Sombrero de paja** con cinta azul. 4. **Girasol**. 5. Blusón azul | Atributos del pintor, no un cuadro copiado | Oreja vendada, pipa, firma, marco |
| **Billie Bigotish** (POP) | Billie Eilish | 1. **Pelo negro con raíces verde neón**, como pelaje largo. 2. **Sudadera gigante** y shorts holgados. 3. **Encorvada**, mirada seria de párpado caído (ojos abiertos). 4. Micrófono chico, bajo | Cara de gata; ropa sin logos ni el muñequito de su marca | Cara humana, logos, títulos, letras |
| **Comecroquetas** (Píxel) | Pac-Man | 1. **Cuerpo amarillo perfectamente redondo**. 2. **Boca en cuña** abierta. 3. **Fila de croquetas** flotando. 4. **Píxel de arcade** | Es una bola-gato con orejas, patitas y cola | Laberinto, fantasmas, puntaje |
| **Miaurio** (Píxel, en pausa) | Mario | Gorra roja, bigotazo, overol, salto | — | **Bloqueado dos veces por el filtro**: la marca ya tiene un gato oficial de ese personaje. Propuesta: pasar a **reserva** o rediseñarlo como plomero propio (destapacaños, llave inglesa) sin la gorra roja con emblema |
| **Supermichi** | Superman | Rizo negro en la frente; capa roja; pose de vuelo con el puño al frente; azul y rojo | Emblema propio: un diamante con una **huellita** (no una letra) | La «S» o cualquier letra |
| **Gatopool** | Deadpool | Rojo y negro; dos katanas de pescado a la espalda; ojos blancos grandes en antifaz; pose cómica | Le habla al jugador | El emblema circular exacto |
| **Super Siamés** | Goku | Pelaje que **se vuelve dorado y se eriza** al transformarse (lente de color); cinta roja en la cintura; guardia de artes marciales | Mechones de gato, no el peinado | Gi naranja con símbolo, nombres de técnicas reales |
| **Harry Gatter** | Harry Potter | Lentes redondos; túnica escolar negra; varita-bigote; bufanda de rayas **en colores propios** | Un **rayo pequeño como marca del pelaje en la frente**, en otra posición y forma que la cicatriz original | Escudos de casas, la cicatriz idéntica, la lechuza con carta |
| **Gato Malo** | Bad Bunny | Gorro de pescador con orejas de conejo; lentes oscuros grandes; uñas de colores; azotón de lucha libre | — | Rasgos faciales, logos de gira, títulos |
| **Tailor Swift** | Taylor Swift | Vestido corto de lentejuelas en 3–4 formas grandes; micrófono de cristal; pulseras de la amistad; labio rojo como forma plana | Las «eras» son lentes de color | Nombres de eras, álbumes o canciones |

## 5. Legibilidad del estilo por multiverso

El *style lock* de cada multiverso hace que **el dibujo mismo** evoque la fuente. La pintura pone silueta, línea y color plano. La textura de pantalla la pone el juego en el shader (`../investigacion/arte-pipeline.md` §4.3).

| Multiverso | Fuente que se tiene que leer | La pintura (Codex) | El juego (shader u horneado) | Riesgo de peso en MAI | Lock |
|---|---|---|---|---|---|
| **Borracha** (familia del sillón) | Sitcom animada amarilla de los 90 | Línea uniforme sin sombras, ojos saltones que se tocan, sobremordida, amarillo plano | Curvatura de TV y barrido suave (`CRTFilter`); risas enlatadas como letrero | **Bajo** (2,6 MB medido) | `BORRACHA_V2.txt` (los nativos siguen con `BORRACHA.txt`) |
| **Superhéroes** | Cómic americano | Tinta de peso variable, negros en bloque, luz de borde fría | Ben-Day, desregistro CMYK, onomatopeyas | Bajo-medio | `SUPERHEROES_V2.txt` |
| **Anime** | Cuadro clave de anime de TV | Cel de 2 tonos, línea de color, mechones en pico | Trama manga en lo oscuro (`bakeCel`), líneas de velocidad | Bajo | `ANIME_V2.txt` |
| **Libros** | Lámina de libro ilustrado victoriano | Pluma sepia ≥ 6 px, acuarela **plana** de 2–3 valores | Papel y granulado (`PaperFilter`, `catF`) | Medio | `LIBROS_V2.txt` |
| **POP** | Fotograma de videoclip o póster de era | Neón y pastel planos, una luz de escenario dura | Destellos, luces de escenario, confeti | Bajo-medio | `POP_V2.txt` |
| **Pinceles** (nuevo) | El pintor de cada gato | La técnica del pintor traducida a **pocas pinceladas grandes y planas** | Lienzo, barniz y relieve en shader; las películas de CINE (Van Gogh, Da Vinci) hornean más | **Alto si hay trazo fino** (8,0 MB medido con pelo en trazos finos) | `PINCELES.txt` |
| **Pantalla** (nuevo) | Póster de cine clásico pintado a mano | Silueta fuerte, una luz dramática en formas planas; **color plano incluso en los géneros en B/N** | B/N, grano, parpadeo e iris (`film.ts`) para mudo, negro y monstruos; Technicolor para aventura y ciencia ficción | Bajo-medio | `PANTALLA.txt` |
| **Píxel** (nuevo) | Sprite de consola de 8 y 16 bits | Cuadrícula de ~64 píxeles de alto, píxel cuadrado sin difuminado, 10–16 colores | Escalado sin suavizado; el rig deforma la cuadrícula (a validar en `catlive`) | **Muy bajo** si la cuadrícula sale limpia | `PIXEL.txt` |
| **Mitos** (nuevo) | El arte de cada cultura (pintura egipcia, vasija griega, códice maya, grabado japonés, arte popular centroamericano) | Contorno grueso, pigmentos minerales planos, bandas decorativas grandes | Piedra, papiro o madera en shader | Bajo | `MITOS.txt` |
| **Vecindad** (nuevo) | Programa de estudio de la TV latina de los 70–80 | Formas redondas, contorno café cálido, color de estudio | VHS, barrido y sangrado de color en shader | Bajo | `VECINDAD.txt` |

## 6. Cómo se escribe en el taller (`manifest.json` → `compilar.mjs`)

Campos nuevos (todos opcionales; sin ellos, el prompt compila **idéntico** a antes: verificado con los 103 prompts viejos):

| Campo | Para qué | Idioma |
|---|---|---|
| `style_lock` | Ruta del lock dentro de `estilo/` (p. ej. `dimensiones/BORRACHA_V2.txt`). Gana sobre `dimension` | — |
| `reference_en` | La referencia **descrita sin nombre registrado** («the dopey donut-loving yellow father of a prime-time family sitcom») | Inglés |
| `signifiers_en` | Los rasgos obligatorios (§2). Se compilan como `[REFERENCE SIGNIFIERS — MUST ALWAYS BE VISIBLE]` | Inglés |
| `evoke_not_copy_en` | Cómo se evoca sin copiar (§3). Se compila como `[EVOKE, NEVER COPY]` | Inglés |
| `style_of_en` | El medio que tiene que evocar el dibujo («in the manner of…», «a 16-bit console sprite…») | Inglés |
| `rarity_treatment_en` | Tratamiento de rareza cuando la rareza no está en `RAREZAS.json` (Multidimensional, Personaje) | Inglés |
| `referencia_es` | La referencia con su nombre real, **solo para el equipo**. El compilador no la usa | Español |

**Regla de redacción:** ningún nombre registrado (de personaje, serie, marca o persona viva) entra al prompt en inglés ni en `concept_es`, que también se compila. Así se cumple §3 y el filtro no se dispara por el nombre. Los pintores de dominio público sí se nombran en `style_of_en`.

## 7. Prueba de reconocimiento (antes de pasar a GENERADO)

1. **Hoja de contacto v2** (`_p3v2/herramientas/contacto-v2.mjs`): pintura, SVG completo, SVG lite, 128 px y silueta negra a 64 px.
2. **Prueba de los 3 segundos:** se muestra la miniatura de 128 px a 3 revisores (personas o agentes sin contexto) y se pregunta «¿a quién te recuerda?». Al menos **2 de 3** tienen que nombrar la referencia.
3. **Prueba de la silueta:** en la columna de 64 px se reconoce al menos un rasgo y la silueta no se confunde con otro gato de su multiverso.
4. **Las tres pruebas de §3** (camiseta, nombre, versión oficial).
5. **El dueño escribe «ok»** en `PROGRESO.md` (como siempre).

## 8. Relación con lo ya aprobado

- **Hipólito, Doña Espuma y Oficial Dona** (aprobados) siguen con `BORRACHA.txt` v1. En la ficción son **vecinos de la taberna**; los amarillos son **los del programa**, la familia del sillón. En la Borracha conviven los dos, igual que en una sitcom no todos los personajes son iguales.
- **Oficial Dona** ya tiene dona. Homiau también, y se distingue por el amarillo, la camisa blanca y la barba. La dona de Dona es su remedio; la de Homiau, su vida.
- **Las fichas v1 de Murciégato y Gato Araña** (lote Q, nunca generadas) pasaron al lote del piloto (`v`) con las reglas v2. Sus prompts v1 quedaron en `_respaldos/2026-10-26-antes-p3v2/prompts-v1-reemplazados/`.

## 9. Riesgos

| Riesgo | Qué hacemos |
|---|---|
| **Legal.** La parodia se protege distinto en cada país y esto no es asesoría legal | Juego sin anuncios pagados, nombres propios, sin logos ni letras, emblemas propios, anatomía de gato. Las referencias con **gato oficial** o de las marcas más litigiosas (Nintendo, Disney, Pokémon) van con el giro más grande o a reserva (`02` §7) |
| **El filtro de imágenes** bloquea las parodias más fieles | §3.1: bajar el rasgo más «de marca», máximo 2 reintentos |
| **Demasiados rasgos** vuelven la pintura un disfraz recargado y pesado | Máximo 5; la textura va al shader |
| **Estilos que pesan** (pinceladas finas, cuadrícula sucia) | La corrección de peso va en la ficha antes de generar (`04-piloto.md`) |
