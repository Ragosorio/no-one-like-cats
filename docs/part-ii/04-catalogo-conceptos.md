# Parte II · 04 — Catálogo de conceptos visuales (fase 2)

> Fecha: **2026-10-09**. Fuente: 21 imágenes en `~/Desktop/No one - raster (fuera del repo)/conceptos/fase 2/` (`1.jpeg` … `21.jpeg`). **No están en el repo y no se copian**: son *moodboard*, no assets. Hoja visual: [`catalogo-conceptos.html`](catalogo-conceptos.html) (las muestra por `file://`, sólo funciona en esta Mac).
>
> Contexto: Parte II, "La Era de las Rupturas" = mundo 2.5D en three.js (`three@0.186` + TSL, ver [02](02-investigacion-tecnologica.md)), gatos MAI SVG como **billboards "de papel" iluminados** (pseudo-normales por SDF del alfa, half-Lambert + rampa toon + rim), tres capas de navegación: **marítimo · celeste · astral**. Lore en [03](03-historia-actual.md) (Luzterna = ex-farera del Archivo; el Archivo = pila infinita de cajas con gateras; Canelo = Común, Fuego, bufanda).
>
> Paletas: 5 hex **estimados** por imagen (k-means sobre una copia reducida a 64 px + ajuste a ojo de los acentos saturados que el promedio apaga). Sirven para dirección de arte, no para *color-picking* exacto.

## 0. Cómo leer este catálogo

**Oleadas** (propuesta de este documento para ordenar el uso de los conceptos; el lead decide las definitivas):

| Oleada | Contenido | Capa |
|---|---|---|
| **O0 · Cimientos 2.5D** | Isla del jugador en 3D, océano, cielo, día/noche, Canelo y gatos de papel, barco base | marítimo |
| **O1 · Marítima** | Isla Nácar, Isla de las Páginas Hundidas, Puerto Cometa (como puerto) | marítimo |
| **O2 · Celeste** | Corona Celeste, Islas Invertidas, barcos aéreos, Canelo Almirante | celeste |
| **O3 · Astral** | Puerto Cometa → barcos astrales, Archipiélago de los Sueños, Canelo Astral | astral |
| **O4 · Umbral** | La Isla que Nadie Recuerda, El Umbral, REGISTRO 000 | astral (+ marítimo "fantasma") |

**Veredicto de uso**: `USAR` = puede guiar diseño final (traduciendo al estilo del juego) · `REF` = sólo referencia parcial (composición, material, FX) · `NO` = no debe salir de la carpeta de moodboard.

Todas las imágenes, salvo indicación, muestran rasgos de **generación por IA** (glifos sin sentido, jarcias imposibles, props ilegibles): ninguna puede ir al juego tal cual; todo se repinta como SVG de MAI / modelo propio.

---

## 1. Fichas por imagen

### 1 · Hub de islas flotantes con lago celeste y haces de colores — `REF` · IP ALTO
Paleta: `#17232D` `#46668C` `#6FD9E6` `#E2643A` `#A57BE8`

| | |
|---|---|
| **Qué representa** | Isla-plataforma central con un lago turquesa circular y un personaje pescando; 8–10 islas flotantes alrededor (templo azteca, ruinas tecnológicas, pozo de lava con cangrejos-robot, bambú) conectadas al centro por **haces de luz de colores**. Arriba, nebulosa, rocas suspendidas y un **titán mecánico** asomando entre nubes. |
| **Estilo** | Pintura digital semi-estilizada, perspectiva cenital de 3/4 tipo "mapa de mundo" de juego móvil; saturación media, iluminación nocturna fría con acentos cálidos. |
| **Sensación** | "Centro de operaciones" del multiverso: todo parte de aquí. Calma (pesca) contra amenaza (titán). |
| **Encaje / región** | **Corrección**: no es una región sino el **mapa-hub de la capa celeste/astral** (selector de regiones de la Parte II): cada haz = una ruta a una región, color = elemento dominante. Secundario: plaza central de **El Umbral**. El lago circular encaja como **pesquera** (mecánica cozy de Canelo). |
| **Tecnologías 2.5D** | Islas = conos invertidos low-poly con textura pintada triplanar; haces = cilindros aditivos con ruido desplazado en TSL + `Bloom`; agua del lago = disco con *flowmap* radial + cáusticas procedurales; rocas en suspensión = `InstancedMesh` con bobbing por shader; nubes = *cards* pintadas con parallax por capas; titán = silueta 2D en plano lejano con *fog*. |
| **Recursos convertibles** | Layout hub-and-spoke del mapa; **haz-ruta** (shader reutilizable por color de elemento); lago-pesquera circular con borde de piedra; set de islas temáticas (lava, templo, bambú, ruinas-tech); "titán en el horizonte" como amenaza de fondo. |
| **Problemas** | **Sonic (SEGA) explícito en el centro** → imposible de usar comercialmente. Titán mecánico genérico pero de lectura "mecha" ajena al tono. Escala inconsistente (islas, cascadas y personaje no comparten escala). Props ilegibles (IA). |
| **Cómo mejorarlo** | Sustituir al personaje por **Canelo pescando con caña y bufanda**; haces con los 13+4 colores de elemento del juego; titán → silueta de **Distraxia/niebla** o un gato colosal de piedra; dar a cada isla un ícono-silueta legible a distancia. |
| **Oleada** | O2 (mapa celeste) y O4 (hub del Umbral). |

### 2 · Galeón en remolino cósmico — `USAR` (como referencia de transición)
Paleta: `#0C1A32` `#1B3E69` `#3072A6` `#C57C27` `#7B4726`

| | |
|---|---|
| **Qué representa** | Galeón de madera con velas emblemadas, ojos de buey encendidos en ámbar y un **mascarón-reloj** en la proa, atrapado en una ola-remolino que se convierte en galaxia (el mar se vuelve nebulosa). |
| **Estilo** | Pintura digital "fantasy" saturada, pincel grueso en el agua, contraste complementario azul/ámbar. |
| **Sensación** | Vértigo, épica, "estamos pasando a otro plano". |
| **Encaje / región** | **Puerto Cometa**: el **momento de transición marítimo → astral** (cinemática de la Ruptura / cambio de capa). El reloj de proa conecta con el elemento **Tiempo**. |
| **Tecnologías 2.5D** | Remolino = disco con distorsión polar (UV en coordenadas polares + rotación dependiente del radio) en TSL que interpola de textura de agua a campo de estrellas; espuma = partículas instanciadas en espiral; ojos de buey = emisivos + `Bloom`; barco = **diorama de papel en capas** (casco, velas, mástiles en planos separados) para que comparta lenguaje con los gatos de papel; cámara con *roll* lento. |
| **Recursos convertibles** | Shader **"mar→galaxia"** (gradiente de material por radio), mascarón-reloj como pieza de barco del elemento Tiempo, velas con emblema iluminado por dentro (transmisión falsa), paleta de transición azul/ámbar. |
| **Problemas** | Emblemas de vela con glifos sin sentido (IA) y aspecto de calavera pirata genérica; jarcias imposibles; casco con perspectiva incoherente (proa y popa en distintos puntos de fuga). |
| **Cómo mejorarlo** | Emblema = huella/cara de gato del juego; agregar un gato de papel en la cofa (gag: Canelo vomitando por la borda); simplificar jarcia a 3–4 líneas legibles. |
| **Oleada** | O3 (desbloqueo de la capa astral). |

### 3 · Gata cósmica con cuerno dorado — `NO` (sólo lenguaje de material) · IP ALTO
Paleta: `#23144E` `#7556AE` `#C392F1` `#DCC6EF` `#D9A441`

| | |
|---|---|
| **Qué representa** | Felina mágica blanco-lila con pelaje de nebulosa y constelaciones, cuerno de unicornio dorado, collar con gema, cuerpo que se disuelve en una estela galáctica. |
| **Estilo** | *Splash art* profesional de MOBA (pintura digital pulida, alto acabado). **Muy probablemente arte oficial de Yuumi (League of Legends, Riot Games)**, no IA. |
| **Sensación** | Ternura mágica, asombro, "skin premium". |
| **Encaje / región** | Lenguaje de material **"Astral"**: pelaje-constelación, cola que se vuelve estela, oro como metal astral. Útil para el *tier* astral de cualquier especie y para **Canelo Astral** (sólo el tratamiento, nunca la silueta). |
| **Tecnologías 2.5D** | Shader de pelaje-constelación sobre el billboard de papel: máscara de zona (del SVG) + campo de estrellas en espacio de pantalla con parallax leve + líneas de constelación que titilan; estela = *ribbon* con UV desplazado y desvanecimiento; rim light violeta. |
| **Recursos convertibles** | **Overlay "astral"** genérico para gatos (estrellas + constelaciones dentro del pelaje), estela de cola, metal dorado con brillo especular de banda. |
| **Problemas** | Copyright de Riot + *likeness* de un personaje reconocible (gata mágica con collar-gema). Ojos y cuerno muy identificables. |
| **Cómo mejorarlo** | No mejorar: **retirar del moodboard compartido** y describir el material en texto ("pelaje con constelaciones, estela de nebulosa, oro de banda") para que MAI lo pinte sobre siluetas propias. |
| **Oleada** | O3 (material astral). |

### 4 · Isla flotante con montaña de cristal — `USAR`
Paleta: `#18293A` `#2C5582` `#4B8FBF` `#97A66D` `#9A6BE0`

| | |
|---|---|
| **Qué representa** | Meseta flotante sobre el mar con un lago-foso que rodea un monte coronado por **cristales azules y violetas gigantes**; camino de tierra con pequeños props; islas lejanas en mar turquesa. |
| **Estilo** | Paisaje anime (look *Makoto Shinkai*-IA), cielo luminoso, saturado. Imagen pequeña (512 px). |
| **Sensación** | Descubrimiento, frescura, "aquí nace una energía nueva". |
| **Encaje / región** | **Isla Nácar** (exterior) — confirmado. La corona de cristal = fuente del elemento **Cristal** y de la "nueva energía". |
| **Tecnologías 2.5D** | Cristales = mallas facetadas de pocos polígonos con *matcap* iridiscente + Fresnel + refracción falsa leyendo `viewportSharedTexture` (sólo calidad alta); brillo interno pulsante (emisivo animado); foso = agua con borde de espuma por profundidad; mar abierto del O0 reutilizado. |
| **Recursos convertibles** | Silueta de la isla (meseta + foso + corona); **material Cristal** (paleta azul-violeta iridiscente); sendero como guía de cámara; cristal pequeño como **decoración de hábitat** y como **material de casco** (el juego ya tiene `crystal` en `battle/shipView.ts`). |
| **Problemas** | Baja resolución; props del camino ilegibles; flotación ambigua (¿flota o es acantilado?); lago interno con perspectiva rara. |
| **Cómo mejorarlo** | Decidir: Nácar **apoyada en el mar** (acantilado) y sólo los cristales flotan; añadir cuevas visibles en la base (entrada a la zona de reflejos); gatos de papel minando/lamiendo cristales (gag). |
| **Oleada** | O1. |

### 5 · Reino de islas-castillo con cascadas y criaturas de cuento — `USAR` (recortado)
Paleta: `#152741` `#5675A7` `#BDC4D4` `#4F8A4A` `#8DE3F0`

| | |
|---|---|
| **Qué representa** | Castillo de cuento sobre una isla flotante central; islas con ruinas, puentes de piedra, cascadas que caen a un mar de nubes, arcoíris, luna creciente, hadas, fantasmitas, ballena voladora con aletas de mariposa, faroles flotantes. |
| **Estilo** | Ilustración IA de libro infantil, hipersaturada, "todo a la vez". |
| **Sensación** | Fantasía amable, nocturna, onírica. |
| **Encaje / región** | **Corrección**: más **Archipiélago de los Sueños** que Corona Celeste (no hay ciudad ni puerto; es un cuento). Secundario: **Islas Invertidas** (las cascadas que caen a las nubes → invertirlas). |
| **Tecnologías 2.5D** | Cascadas = *ribbons* con UV desplazado + espuma en la base con partículas; nubes-mar = capa de *cards* con ruido animado y niebla de altura; faroles = partículas instanciadas emisivas; ballena = billboard de papel con puppet de malla (mismo sistema que los gatos). |
| **Recursos convertibles** | **Ballena voladora** (criatura ambiental o jefe de Sueños), fantasmitas (NPC ambientales), faroles flotantes, puentes de piedra modulares, cascada a nubes, paleta noche-lila. |
| **Problemas** | Sobrecarga visual sin jerarquía; hadas humanoides fuera de tono; castillo genérico tipo parque temático; perspectiva múltiple. |
| **Cómo mejorarlo** | Elegir **1 punto focal** por isla; hadas → gatos con alas de papel; añadir humor (fantasmita con sábana de cama, ballena roncando). |
| **Oleada** | O3 (Sueños); cascadas invertidas en O2. |

### 6 · Cráter de lava con domo-escudo y cometa — `USAR` (combate)
Paleta: `#1E192B` `#34354D` `#F07A2A` `#E07BD8` `#6FC8F0`

| | |
|---|---|
| **Qué representa** | Cráter volcánico partido por ríos de lava, con un **domo-escudo transparente** encima, un **proyectil-cometa rosa cristalino** atravesándolo, círculo rúnico en el fondo, cristales de colores, tótems y estatuas de piedra, volcán humeante, aurora y atardecer sobre el mar. |
| **Estilo** | Ilustración estilizada "cartoon-painterly" con contornos suaves, colores pop; muy cercana al estilo de juego móvil. |
| **Sensación** | Impacto, peligro controlado, espectáculo de combate. |
| **Encaje / región** | **Puerto Cometa → sitio de impacto del cometa** (origen narrativo del elemento **Plasma**) y, sobre todo, **referencia de arena de batalla/VFX** (no "cuevas de Nácar"). Encaja con los CATACLISMOS ya existentes (meteoros). |
| **Tecnologías 2.5D** | Domo = esfera con Fresnel + patrón hexagonal/rúnico + **ondas de impacto** (array de uniforms con posición/tiempo de golpe); lava = emisivo con *flowmap* + distorsión de calor en post; cometa = *trail* + partículas instanciadas + `Bloom`; aurora = cinta en el skydome con ruido. |
| **Recursos convertibles** | **VFX de escudo** (habilidad defensiva y cataclismo sellado), **proyectil-cometa** (ataque de Plasma), grietas de lava como *decal*, tótems de piedra (props), círculo rúnico de invocación. |
| **Problemas** | Lectura confusa (¿el cometa está dentro o fuera del escudo?); tótems de inspiración mesoamericana/polinesia → cuidado con apropiación decorativa; demasiados focos de luz. |
| **Cómo mejorarlo** | Tótems → **estatuas de gato** de piedra; un solo foco (impacto); escudo con borde dibujado (trazo de tinta) para que case con el estilo. |
| **Oleada** | O1 (VFX de batalla) y O3 (Puerto Cometa). |

### 7 · Mar-espejo nocturno con islotes flotantes — `USAR`
Paleta: `#0C1136` `#2C3976` `#486CB4` `#C5B1E5` `#F2B79A`

| | |
|---|---|
| **Qué representa** | Mar plano y reflectante bajo luna llena rosada; islotes con árboles de colores que **flotan a ras del agua**; un río de agua lechosa rosa-turquesa que corre *sobre* el mar; rocas, estrellas fugaces, planetas pequeños. |
| **Estilo** | Ilustración IA psicodélica, hipersaturada, con reflejos perfectos. |
| **Sensación** | Calma surrealista, el agua no se comporta como agua. |
| **Encaje / región** | **Corrección**: principal **Islas Invertidas** (agua que corre sobre agua, islas flotando sobre su reflejo = "el agua desafía las leyes"); secundario Sueños. Es el mejor concepto disponible para Invertidas. |
| **Tecnologías 2.5D** | Mar-espejo = reflexión planar (`Reflector`) a resolución media o *flip* de escena barato; río = malla-cinta sobre el mar con *flowmap* y material lechoso iridiscente; islotes = conos invertidos con *bobbing*; luna = billboard con halo y bloom. |
| **Recursos convertibles** | **Shader "río sobre el mar"**, árboles de copa redonda multicolor (decoración Sueño/Invertidas), luna rosada para el ciclo noche de la capa celeste, islotes-pedestal para colocar gatos. |
| **Problemas** | Saturación sin control (todo compite); reflejos imposibles en tiempo real a ese nivel en móvil; profundidad confusa. |
| **Cómo mejorarlo** | Bajar saturación del fondo y reservarla para el río y los árboles; invertir algunos islotes (raíces hacia arriba) para vender la "inversión"; gatos de papel nadando hacia arriba. |
| **Oleada** | O2. |

### 8 · Faro sobre isla-libro en tormenta — `USAR` (traducir)
Paleta: `#2B322D` `#536457` `#919B88` `#E5E4D4` `#D9A85A`

| | |
|---|---|
| **Qué representa** | Faro encendido sobre un peñón donde descansa un **libro abierto gigante**; casitas incrustadas, escaleras, cascadas, estatuas de grifo y dragón, serpiente de mar, galeón atracado, tentáculos; mar tormentoso. |
| **Estilo** | Fotorrealismo fantástico (look DALL·E 3), paleta desaturada verde-gris, luz volumétrica. |
| **Sensación** | Misterio, soledad, conocimiento perdido. |
| **Encaje / región** | **Isla de las Páginas Hundidas** + **el faro de Luzterna** (ex-farera del Archivo, lore H16). Encaje casi perfecto de lore. |
| **Tecnologías 2.5D** | Haz del faro = cono aditivo con caída por Fresnel + nodo `Godrays`; tormenta = lluvia instanciada + relámpagos (líneas procedurales + *flash* de luz hemisférica); páginas sueltas = partículas planas con giro; libro = malla simple con textura pintada. |
| **Recursos convertibles** | **Faro de Luzterna** (landmark), libro-isla (silueta), páginas flotantes como coleccionable, estatuas de guardianes, haz de luz como mecánica (revela objetos ocultos del Archivo). |
| **Problemas** | Estilo fotorrealista y sombrío **fuera del lenguaje del juego**; ruido de detalles; criaturas genéricas de fantasía occidental. |
| **Cómo mejorarlo** | Traducir a anime saturado con noche azul-verde; libro con **folios numerados** ("FOLIO 001" ya existe en la ficha del jugador) y un hueco que insinúa **REGISTRO 000**; guardianes → gatos-gárgola. |
| **Oleada** | O1 (exterior) y O4 (pista de REGISTRO 000). |

### 9 · Ciudad sobre las nubes con aeronaves — `USAR` · IP MEDIO (autor)
Paleta: `#314D6C` `#4299EC` `#A4CFE4` `#F2EDE2` `#3E9E8A`

| | |
|---|---|
| **Qué representa** | Ciudad flotante de castillos blancos con techos verde cobre, engranajes dorados, molino-turbina, canales con cascada al vacío, muelles de madera, jaula colgante, dirigibles y un palacio-flor volador. |
| **Estilo** | Ilustración anime de línea limpia con color plano y sombreado suave; perspectiva coherente. **Parece obra humana profesional** (o IA de muy alta calidad). |
| **Sensación** | Optimismo, aventura, "por fin llegamos a la capital". |
| **Encaje / región** | **Corona Celeste** — confirmado; ciudad + puerto de aeronaves. Es el concepto más cercano al acabado deseado. |
| **Tecnologías 2.5D** | Edificios = kit modular low-poly con *toon ramp* y contorno (inverted hull o post de bordes por normales/profundidad); engranajes animados por rotación; dirigibles = mallas simples en rutas spline; nubes inferiores = capa de *cards* + niebla de altura; cascada al vacío = cinta + partículas de bruma. |
| **Recursos convertibles** | **Kit arquitectónico celeste** (torre, techo cobre, arco, muelle, engranaje), dirigible como **barco de la capa celeste**, jaula colgante (prop/gag: gato atrapado), palacio-flor como jefe o edificio especial, paleta cielo-cobre. |
| **Problemas** | Autoría desconocida: si es de un artista, no se puede derivar de cerca; densidad alta para el presupuesto de vértices web; sin gatos (ciudad vacía). |
| **Cómo mejorarlo** | Búsqueda inversa de imagen antes de compartirla; poblar con gatos de papel; carteles con humor ("Prohibido tirar vasos desde las nubes"). |
| **Oleada** | O2. |

### 10 · Isla abandonada de noche con barriles a la deriva — `REF`
Paleta: `#061A25` `#114952` `#36898A` `#97B997` `#E0A050`

| | |
|---|---|
| **Qué representa** | Isla tropical con palmeras y un edificio en ruinas incrustado en la roca (ventanas circulares, cúpulas), cueva iluminada, barquito en la orilla, barriles/cañones medio hundidos en primer plano, luna, linternas voladoras. |
| **Estilo** | Pintura digital oscura monocroma verde-azulada con acentos ámbar. |
| **Sensación** | Abandono, melancolía, inquietud suave. |
| **Encaje / región** | **La Isla que Nadie Recuerda** — tono correcto, pero **no se lee como "la isla del jugador"**, que es la clave de la región. |
| **Tecnologías 2.5D** | Niebla exp2 densa; LUT de desaturación en post; agua quieta con reflejo de luna; **shader "memoria"** (glitch/disolución por ruido en bordes, reutiliza la dimensión glitch existente) para objetos que aparecen y desaparecen. |
| **Recursos convertibles** | Paleta noche teal, barriles hundidos (props), linternas flotantes, cueva iluminada como entrada, iluminación de luna para el modo noche. |
| **Problemas** | Genérico; barriles con escala irreal; nada conecta con la isla real del jugador (hábitats, casino, balsa). |
| **Cómo mejorarlo** | Construirla **desde la isla real del jugador** (sus hábitats y edificios, versión rota): la balsa con palmera y caja del prólogo, el casino con letrero apagado, gatos de papel desteñidos que no recuerdan su nombre. |
| **Oleada** | O4. |

### 11 · Héroe y zorro ante islas elementales y titanes — `REF` (fuera de tono)
Paleta: `#0C1023` `#3B5182` `#9BD8F0` `#E05A2A` `#C2B8C0`

| | |
|---|---|
| **Qué representa** | Héroe humano con capa y espada de hielo, junto a un zorro de ojos rojos, sobre una roca de cristal; alrededor islas por elemento (fuego, hielo, oro/templo, ruinas); titanes (golem de lava con guadaña, espíritu de hielo, serpientes de sombra), una chica alada demoníaca y un **anillo rúnico arcoíris**. |
| **Estilo** | Pintura digital épica de póster de RPG, simétrica. |
| **Sensación** | Solemnidad, "batalla final". |
| **Encaje / región** | **El Umbral** (la frontera) — sólo como composición de "todas las amenazas a la vez" y anillo-portal. |
| **Tecnologías 2.5D** | Anillo = toro con UV de runas desplazadas + gradiente arcoíris; islas por elemento = reutilizan biomas de O1–O3 a escala menor; titanes = siluetas pintadas en planos lejanos con parallax y niebla. |
| **Recursos convertibles** | **Anillo-portal** (transición entre capas), islas-muestra por elemento para el **mapa de elementos**, titanes como guardianes del Umbral (traducidos a gatos colosales). |
| **Problemas** | **Protagonista humano** (el juego no tiene héroe humano; el jugador es el capitán invisible); chica demoníaca sexualizada fuera de tono; zorro en vez de gato; tono serio sin humor. |
| **Cómo mejorarlo** | Canelo + tripulación en lugar del héroe; titanes → **gatos guardianes** por elemento; portal con forma de **gatera** (lore: los gatos pasan de caja en caja por gateras). |
| **Oleada** | O4. |

### 12 · Gato-joya de cristal negro — `USAR` (especie)
Paleta: `#0E0D10` `#1D6385` `#3FB6E8` `#E89A2E` `#D63A7A`

| | |
|---|---|
| **Qué representa** | Gatito chibi negro brillante con orejas-alas de cristal facetado, gema en la frente, cuernos de ámbar, joyería dorada, pecho de cristal tallado y cola en espiral de vidrio arcoíris. |
| **Estilo** | Render 3D de figura de resina/vidrio (estudio, fondo negro), IA. |
| **Sensación** | Lujo, rareza, "legendario". |
| **Encaje / región** | **Especie de elemento Cristal** (Isla Nácar). Candidata a forma épica/mítica. |
| **Tecnologías 2.5D** | En billboard de papel: máscara de zonas de cristal del SVG → *matcap* iridiscente + destellos (*sparkles*) en espacio de pantalla + rim fuerte; en batalla, refracción falsa sobre el fondo. |
| **Recursos convertibles** | **Silueta de especie** (orejas-ala facetadas, cola espiral), paleta Cristal (negro + cian + ámbar + magenta), gema frontal como marca de elemento, shader "facetas" para todos los gatos de Cristal. |
| **Problemas** | Look 3D/resina **ajeno a la pintura MAI**; sobrecarga de ornamentos (ilegible a 96 px); patas y joyas con artefactos IA. |
| **Cómo mejorarlo** | Traducir a pintura plana MAI con 3–4 facetas grandes; reducir joyería a una gema; agregar personalidad (presumido, se mira en su propio reflejo). |
| **Oleada** | O1. |

### 13 · Gato negro con capa flotando con orbe — `USAR` (estilo de icono)
Paleta: `#132D51` `#203B5F` `#4C3FA0` `#D9B54A` `#8FE0F0`

| | |
|---|---|
| **Qué representa** | Gato negro panza arriba, con capa índigo, marca de estrella en la frente, arete, flotando junto a un orbe violeta, una estrella y un objeto ovalado (¿cojín, reloj, almohada?). Fondo de paisaje borroso. |
| **Estilo** | Ilustración plana tipo sticker con contorno brillante (glow cian). |
| **Sensación** | Ternura traviesa, "se quedó dormido en el aire". |
| **Encaje / región** | **Especie Sueño** o gato misterio de la capa astral; también buen **icono de estado** "dormido/soñando". |
| **Tecnologías 2.5D** | Billboard de papel con *bobbing* y giro lento (puppet de malla); glow de contorno = *rim* por SDF del alfa; orbe = esfera emisiva con burbuja de refracción falsa. |
| **Recursos convertibles** | Pose "flotando dormido" (animación de puppet), orbe de sueño (prop/proyectil), marca de estrella frontal, contorno-glow como lenguaje de UI de Sueño. |
| **Problemas** | Fondo que parece **captura borrosa de un videojuego** (origen dudoso); compresión y *upscaling*; parecido leve a gatos negros con marca en la frente de anime conocido (Luna, *Sailor Moon*). |
| **Cómo mejorarlo** | Cambiar la marca frontal a un símbolo propio (gatera, ojo cerrado); capa con patrón de folios del Archivo; objeto ovalado → almohada con el logo del juego. |
| **Oleada** | O3. |

### 14 · Gato acorazado de tormenta en carrera — `REF` · IP MEDIO (estilo)
Paleta: `#2A0E29` `#5B2845` `#443C83` `#567DCF` `#95D9F4`

| | |
|---|---|
| **Qué representa** | Gato atigrado morado con casco y hombreras de bronce, ojos cian, corriendo con un arco eléctrico azul. |
| **Estilo** | Imitación IA de *splash art* de MOBA (Riot), 512 px, borroso. |
| **Sensación** | Velocidad, agresividad. |
| **Encaje / región** | Forma de combate de **Tormenta** o **Plasma**; no sirve como Canelo (no es naranja ni tiene bufanda). |
| **Tecnologías 2.5D** | Arcos eléctricos = líneas procedurales con ruido + bloom; *motion smear* del puppet; *speed lines* en post. |
| **Recursos convertibles** | Armadura ligera (casco + hombreras) como capa de "gato acorazado"; arco eléctrico como VFX de dash. |
| **Problemas** | Imitación del estilo de marca de Riot; anatomía borrosa; resolución insuficiente; sin humor. |
| **Cómo mejorarlo** | Usar sólo la idea "armadura + arco"; rediseñar silueta propia con un gag (casco que le queda grande). |
| **Oleada** | O1–O2 (VFX). |

### 15 · Gato acuarela sentado en la luna con gorro de fiesta — `USAR` (filtro)
Paleta: `#1D2F53` `#536589` `#F5D2C9` `#E4B58D` `#A8D8C8`

| | |
|---|---|
| **Qué representa** | Gatito celeste-blanco sonriente con gorro de fiesta a rayas y cascabel, sentado en una luna creciente, nubes pastel, estrellas doradas. |
| **Estilo** | Acuarela infantil con bordes sangrados y papel blanco. |
| **Sensación** | Dulzura, cumpleaños, sueño tranquilo. |
| **Encaje / región** | **Archipiélago de los Sueños** como **filtro de render** (cuando un sueño "altera el escenario", el mundo se vuelve acuarela). El gorro de fiesta aporta el **humor** que les falta a casi todos. |
| **Tecnologías 2.5D** | Post-proceso acuarela: Kuwahara + oscurecimiento de bordes + grano de papel + *bleed* por ruido; transición animada entre render normal y acuarela (mecánica de sueño). |
| **Recursos convertibles** | **Post "Sueño-acuarela"**, luna creciente asiento (prop de hábitat), gorro de fiesta (cosmético), paleta pastel. |
| **Problemas** | Estilo **muy distinto** al MAI glossy; cara genérica de stock IA. |
| **Cómo mejorarlo** | Usarlo sólo como estado del mundo (no para especies); añadir el gag: el gato sopla un espantasuegras y la luna se desinfla. |
| **Oleada** | O3. |

### 16 · Gatito naranja chibi con estrella — `USAR` (base Canelo)
Paleta: `#FEFEFE` `#DC8E50` `#F5E1C4` `#3BB3A0` `#F2C531`

| | |
|---|---|
| **Qué representa** | Gato atigrado naranja de ojos verdes, pañoleta turquesa con peces, cascabel, peto rayado y mochila-estrella, en salto. |
| **Estilo** | Ilustración kawaii limpia con contorno café y sombreado suave, fondo blanco (ideal para recorte). |
| **Sensación** | Cálido, amable, "primer gato". |
| **Encaje / región** | **Línea base de Canelo** para la Parte II (y modelo de cómo debe verse un gato de papel con contorno). |
| **Tecnologías 2.5D** | Directo al pipeline: SVG MAI → billboard de papel con contorno; puppet de malla para el salto; sombra de contacto blob. |
| **Recursos convertibles** | Proporciones chibi (cabeza ~45 % de altura), **pañoleta = bufanda de Canelo** reinterpretada, cascabel, mochila-estrella (inventario visible), paleta naranja-turquesa complementaria. |
| **Problemas** | Ojos verdes y pañoleta deben coincidir con el Canelo existente (verificar contra su SVG); estilo kawaii sin la "actitud" irreverente del juego. |
| **Cómo mejorarlo** | Mantener la bufanda canónica (la que Luzterna odia); cara de sueño/fastidio en lugar de dulzura. |
| **Oleada** | O0. |

### 17 · Gato pirata de tormenta en cubierta — `USAR` (vestuario)
Paleta: `#14131B` `#2A3143` `#436486` `#9ED4E9` `#C8312C`

| | |
|---|---|
| **Qué representa** | Gato azul oscuro con tricornio con ancla, bandana roja, casaca, botas, empuñando rayos sobre la cubierta de un barco bajo tormenta; marineros humanos al fondo. |
| **Estilo** | Ilustración cómic/caricatura tipo "fantasy game card", contorno marcado, colores fríos. |
| **Sensación** | Acción, bravuconería, mando. |
| **Encaje / región** | **Corrección**: no es Canelo (no es atigrado naranja). Sirve como **vestuario de Canelo Almirante** (tricornio, casaca, bandana) y como especie **Tormenta-pirata** propia. |
| **Tecnologías 2.5D** | Lluvia instanciada + relámpagos + cubierta mojada (especular por *roughness* bajo); bandana y casaca como capas del puppet con física de tela simple (*verlet* sobre la malla). |
| **Recursos convertibles** | **Kit de capitán** (tricornio con ancla, casaca azul, bandana roja) como cosmético/evolución; pose de ataque con dos manos. |
| **Problemas** | Humanos en la tripulación (fuera de tono); resolución 500 px; rasgos genéricos IA. |
| **Cómo mejorarlo** | Pintar el kit sobre Canelo naranja; tripulación de gatos de papel; ancla del tricornio → huella. |
| **Oleada** | O2 (Canelo Almirante). |

### 18 · Gato astronauta naranja — `USAR` (Canelo Astral)
Paleta: `#051228` `#20364E` `#ED9B4C` `#E9DBBF` `#40778E`

| | |
|---|---|
| **Qué representa** | Gato atigrado naranja y blanco en traje espacial naranja con anillo de casco, cohete blanco a la espalda, sobre una ola-nube, con planetas y luna creciente naranja. |
| **Estilo** | Ilustración vectorial-pintada IA, limpia, fondo oscuro. |
| **Sensación** | Optimismo, curiosidad, "un pequeño paso para un gato". |
| **Encaje / región** | **Canelo Astral** — confirmado. |
| **Tecnologías 2.5D** | Billboard de papel con visor que refleja el skydome (máscara de visor + reflexión de entorno barata); propulsor = partículas; flotación con inercia en capa astral. |
| **Recursos convertibles** | Anillo de casco, mochila-cohete, ola de nube como "suelo astral"; planetas como decoración de cielo astral. |
| **Problemas** | **Parche de bandera de EE. UU.** e insignias tipo NASA (insignia real, fuera de tono); el traje naranja **se come al gato naranja** (contraste); planetas con detalles IA sin sentido. |
| **Cómo mejorarlo** | Traje blanco/azul con acentos naranja; parche con el escudo del juego; **conservar la bufanda** por fuera del traje (gag: "no se la quita ni en el vacío"). |
| **Oleada** | O3. |

### 19 · Chibi pirata en barco rojo entre olas — `REF` · IP MEDIO-ALTO (origen)
Paleta: `#165483` `#4286B0` `#54CADE` `#E2EFEF` `#C8352E`

| | |
|---|---|
| **Qué representa** | Personaje chibi de cara blanca (no se lee como gato; parece panda/humano) con sombrero pirata, a bordo de un barco de casco negro y rojo con velas blancas, olas cel-shaded, sol, gaviotas. |
| **Estilo** | Anime cel-shading muy limpio, saturado; **se ven líneas de corte de rompecabezas** sobre toda la imagen. |
| **Sensación** | Alegría, aventura ligera. |
| **Encaje / región** | **Tono marítimo** de referencia (O0/O1): olas, cielo y lectura del barco son exactamente el registro del juego. |
| **Tecnologías 2.5D** | **Agua toon**: bandas posterizadas + espuma estilizada en sprites + crestas por Gerstner; casco con *toon ramp* y contorno; velas con viento por vértice. |
| **Recursos convertibles** | **Estilo de ola y espuma** para el océano del O0, silueta de barco compacto (casco alto, proa roja), paleta día marítimo. |
| **Problemas** | Rejilla de rompecabezas = **sacado de un producto comercial** (puzzle/stock): origen y derechos dudosos; personaje no es gato. |
| **Cómo mejorarlo** | Usar sólo como referencia de shader de olas; nunca compartir fuera. |
| **Oleada** | O0. |

### 20 · Barco volador con tripulación y peces-globo-gato — `USAR` (parcial)
Paleta: `#3A3750` `#546D99` `#80A2C7` `#AD6B77` `#E9A23B`

| | |
|---|---|
| **Qué representa** | Barco de madera con velas-ala rojas y una vela emblemada, volando entre nubes sobre un paisaje de islas; tripulación de humanoides (esqueleto, anciano barbudo, bárbaro, felinoide); **criaturas redondas naranjas con orejas de gato** flotando como globos. Formato vertical. |
| **Estilo** | Pintura estilizada de formas grandes (look Midjourney "juego móvil/Supercell"). |
| **Sensación** | Aventura colectiva, viaje alegre. |
| **Encaje / región** | **Navegación celeste** (barcos aéreos de O2; también Corona Celeste). Las criaturas-globo son lo más aprovechable. |
| **Tecnologías 2.5D** | Velas-ala con deformación por vértice; nubes atravesables (cards con *fade* por distancia a cámara); estela de viento con partículas; criaturas-globo = billboards de papel con *squash & stretch*. |
| **Recursos convertibles** | **"Globogatos"** (fauna ambiental celeste, o munición de artillería: lanzar un globogato), velas-ala como pieza de barco celeste, encuadre vertical para pantallas de carga. |
| **Problemas** | Tripulación humana fuera de tono; escala del barco vs islas ambigua; detalles ilegibles. |
| **Cómo mejorarlo** | Tripulación = gatos de papel; emblema de vela = cara de gato; velas-ala que se baten (gag: el barco "nada" por el aire). |
| **Oleada** | O2. |

### 21 · Galeón astral con mascarón de gato — `USAR` (diseño de barco)
Paleta: `#090C27` `#1B326F` `#6569AF` `#E27157` `#D4A548`

| | |
|---|---|
| **Qué representa** | Galeón azul profundo con filigrana dorada cuyo casco **es** un gato atigrado gigante con corona; velas translúcidas, faroles esféricos, navega entre nebulosas con un planeta enorme detrás. |
| **Estilo** | Arte digital IA hiperdetallado, look de banco de imágenes. |
| **Sensación** | Majestad, "buque insignia". |
| **Encaje / región** | **Puerto Cometa → barco astral** y posible **buque insignia de Canelo Almirante** en la capa astral. |
| **Tecnologías 2.5D** | Casco = diorama de papel en capas (cabeza de gato como billboard pintado con puppet: parpadea y mueve las orejas); casco con *starfield* interno (material astral de #3); faroles con bloom; velas translúcidas aditivas. |
| **Recursos convertibles** | **Mascarón-gato animado** (pieza de proa modular para todos los barcos: cada especie aporta su cabeza), casco con interior estrellado, faroles esféricos, paleta astral índigo-coral-oro. |
| **Problemas** | Look de stock IA (posible licencia de banco de imágenes); jarcia ilegible; el gato es fotorrealista (fuera del estilo); escala barco/gato confusa. |
| **Cómo mejorarlo** | Gato pintado estilo MAI con expresión (aburrido, mareado); el mascarón cambia según el gato capitán equipado; simplificar filigrana a 2–3 motivos. |
| **Oleada** | O3. |

---

## 2. Síntesis

### (a) Mapa conceptos → regiones/sistemas (corregido)

| Región / sistema | Capa | Conceptos principales | Secundarios | Cambios frente al primer mapeo |
|---|---|---|---|---|
| **Isla Nácar** | marítimo | **4** (exterior), **12** (especie Cristal) | 6 (cristales), 11 (islas de cristal) | 6 ya no va a "cuevas de Nácar": es arena/impacto |
| **Islas Invertidas** | celeste | **7** (agua sobre agua, islas sobre su reflejo) | 5 (cascadas a invertir) | 5 pasa a Sueños; 7 sube a principal de Invertidas |
| **Puerto Cometa** | marítimo→astral | **2** (transición), **21** (barco astral) | 6 (sitio de impacto del cometa / Plasma) | se añade 6 |
| **Archipiélago de los Sueños** | astral | **5**, **15** (filtro acuarela), **13** (especie Sueño) | 7 | 7 baja a secundario |
| **Isla de las Páginas Hundidas** | marítimo | **8** (faro de Luzterna + libro) | — | se ancla el faro a Luzterna |
| **Corona Celeste** | celeste | **9** (ciudad), **20** (barcos aéreos, globogatos) | 1 (haces-ruta) | 5 sale de aquí |
| **La Isla que Nadie Recuerda** | marítimo "fantasma" | **10** (tono) | — | insuficiente: falta la isla del jugador |
| **El Umbral** | astral | **11** (composición, anillo-portal) | 1 (hub) | 1 se reinterpreta como mapa-hub |
| **Mapa de navegación / hub** | celeste+astral | **1** | 11 | nuevo sistema |
| **Océano y tono marítimo (O0)** | marítimo | **19** (olas toon) | 2, 17 | nuevo |
| **Canelo base / Almirante / Astral** | — | **16** / **17** (sólo vestuario) / **18** | 21 (buque insignia) | 17 no es Canelo, sólo su kit |
| **VFX de combate** | todas | **6** (escudo, cometa, lava) | 14 (rayo), 17 (tormenta) | nuevo |
| **Material "Astral" para gatos** | astral | 3 (sólo descripción textual) | 21 (casco estrellado) | 3 queda vetada como imagen |

### (b) Huecos: lo que no tiene concepto y qué encargar

| Hueco | Por qué importa | Encargo concreto (brief corto) |
|---|---|---|
| **Islas Invertidas "de verdad"** | Ningún concepto muestra gravedad invertida | Islas boca abajo con raíces al cielo, cascadas que suben, un "techo de mar" con peces nadando arriba, gatos de papel caminando en el techo. Día. |
| **La Isla que Nadie Recuerda = tu isla** | La gracia es reconocerla | Captura real de la isla del jugador (hábitats, casino El Gato Negro, balsa-palmera-caja) repintada abandonada, desteñida, con niebla y huecos "borrados" por Distraxia. |
| **Nácar por dentro** | "Cuevas y reflejos" sin referencia | Caverna de cristal con suelo-espejo, reflejos que no coinciden con el gato (gag/mecánica), veta de "energía nueva". |
| **Páginas Hundidas bajo el agua** | Sólo hay exterior | Ruinas del Archivo sumergidas: estanterías-arrecife, cajas-mundo, gateras, un cajón con "000" a medio abrir (**REGISTRO 000**). |
| **Puerto Cometa como puerto** | Hay barcos, no hay puerto | Astillero donde una grúa le pone velas astrales a un barco marítimo; cola de cometa sobre el muelle; mercado. |
| **El Umbral en lenguaje del Archivo** | 11 es genérico y fuera de tono | Pila infinita de cajas-mundo en el vacío, gatera gigante como portal, papel rasgado como borde del mundo. |
| **Especies Gravedad y Plasma** | Cero conceptos | Gravedad: gato pesado que dobla el suelo / orbitado por piedritas. Plasma: gato de neón con pelaje de corriente (ojo: diferenciar de Tormenta y Fuego). |
| **Canelo Almirante (naranja)** | 17 no es Canelo | Canelo con tricornio, casaca y **su bufanda**, cara de "yo no pedí esto". |
| **Enemigos/jefes de la Parte II** | Sólo titanes genéricos de 11 | 1 jefe por región (ballena de Sueños de 5, palacio-flor de 9, Kraken-biblioteca de 8…). |
| **Versiones de día** | 13 de 21 imágenes son nocturnas | Pedir día + atardecer de cada región para el ciclo día/noche. |
| **UI de cambio de capa** | Sin referencia | Transición marítimo→celeste→astral (barco despega, velas se vuelven alas, alas se vuelven nebulosa). |
| **Humor** | Sólo 13, 15 y 20 tienen gag | Exigir 1 gag visual por concepto (ver guía de tono en [03 §6](03-historia-actual.md)). |

### (c) Cohesión con el lenguaje visual actual (anime, saturado, irreverente, MAI glossy)

| Grupo | Conceptos | Diagnóstico | Traducción necesaria |
|---|---|---|---|
| **Compatibles casi directo** | 9, 16, 19, 6, 20 | Anime/cartoon, contorno o formas limpias, saturación alta controlada | Poblar con gatos, añadir gags, ajustar paleta a la del juego |
| **Compatibles con ajuste de saturación/jerarquía** | 4, 5, 7, 13, 18, 1 | Anime-IA hipersaturado o plano; sin punto focal | Reducir ruido, 1 foco por plano, unificar contorno |
| **Requieren traducción de estilo** | 2, 8, 10, 12, 21, 11, 17 | Pintura fantasy realista, fotorrealismo, render 3D de resina o tono épico serio | Repintar en clave anime; conservar sólo silueta, paleta y una idea |
| **Estilo alternativo deliberado** | 15 | Acuarela: no para especies | Sólo como **filtro de mundo** de Sueños |
| **Sólo material / vetadas** | 3, 14 | Arte de MOBA (oficial o imitado) | Describir material en texto; no circular la imagen |

Regla de unificación propuesta: **paisajes en 3D low-poly con rampa toon + contorno**, **personajes y barcos como papel pintado** (MAI), saturación alta sólo en primer plano y elementos de juego, fondos un paso más fríos y desaturados (perspectiva atmosférica), y **todo concepto debe incluir al menos un gato haciendo algo estúpido**.

### (d) Revisión legal antes de lanzamiento comercial

| # | Riesgo | Tipo | Nivel | Acción |
|---|---|---|---|---|
| 1 | Sonic (SEGA) en el centro de la imagen | Personaje registrado | **Alto** | Retirar del moodboard compartido; rehacer el hub sin él |
| 3 | Probable arte oficial de Yuumi (Riot Games) | Copyright + *likeness* de personaje | **Alto** | No derivar silueta, cuerno ni collar-gema; sólo descripción textual del material |
| 9 | Probable obra de autor humano no identificado | Copyright de la ilustración | **Medio-alto** | Búsqueda inversa; si hay autor, no derivar de cerca o contactar/comisionar |
| 19 | Rejilla de rompecabezas visible → producto comercial | Copyright del producto/stock | **Medio-alto** | Sólo referencia interna de olas |
| 14 | Imitación del estilo de *splash* de Riot | Estilo de marca (*trade dress*) | Medio | No usar como guía de estilo |
| 21 | Aspecto de imagen de banco de stock IA | Licencia del banco | Medio | Verificar origen; diseño propio del mascarón |
| 13 | Fondo que parece captura de videojuego; marca frontal tipo Luna (*Sailor Moon*) | Copyright del fondo / parecido | Medio-bajo | Cambiar marca frontal y fondo |
| 18 | Bandera de EE. UU. e insignias tipo NASA | Insignia real / marca | Bajo | Eliminar parches |
| 1 | Titán tipo mecha | Parecido genérico | Bajo | Reemplazar por amenaza propia |
| 6 | Tótems de inspiración mesoamericana/polinesia | Sensibilidad cultural | Bajo | Sustituir por estatuas de gato |
| Todas | Imágenes generadas por IA | Titularidad incierta / términos de la herramienta | Medio | Nunca embarcar píxeles: todo asset final se repinta (MAI SVG) o se modela; registrar el origen de cada concepto |

Complementa la sección de IP de [03 §7](03-historia-actual.md).

### (e) Familias de paleta por capa de navegación

| Capa | Base (60 %) | Medios (30 %) | Acento (10 %) | Noche | Referencias |
|---|---|---|---|---|---|
| **Marítimo** | `#1F8FA8` mar · `#54CADE` agua somera · `#F2E6C9` arena | `#7B4726` madera · `#3E9E5A` vegetación | `#C8352E` vela/bandera · `#F2C531` sol | `#061A25` `#114952` `#36898A` + farol `#E0A050` | 19, 4, 10, 16 |
| **Celeste** | `#4299EC` cielo · `#A4CFE4` bruma · `#F4F1EA` nube | `#3E9E8A` cobre verde · `#D9A441` latón | `#F2A38A` atardecer · `#E9A23B` vela | `#152741` `#5675A7` `#C5B1E5` + luna `#F2B79A` | 9, 20, 7, 5 |
| **Astral** | `#090C27` vacío · `#23144E` índigo · `#1B326F` | `#7556AE` nebulosa · `#C392F1` lila | `#D4A548` oro astral · `#E27157` coral de nebulosa · `#8FE0F0` estrella | (siempre noche; el "día" astral = nebulosa cálida `#E27157`→`#F2B79A`) | 2, 21, 18, 3* |

Acentos sugeridos para los elementos candidatos (verificar contraste contra los 13 existentes antes de fijarlos):

| Elemento | Primario | Secundario | Nota |
|---|---|---|---|
| **Cristal** | `#3FB6E8` | `#C392F1` (iridiscencia) | distinto de Hielo por el violeta y las facetas |
| **Gravedad** | `#4C3FA0` | `#E8E2D0` | índigo pesado + piedra clara; sin concepto aún |
| **Plasma** | `#E07BD8` | `#F07A2A` | magenta-naranja (cometa de 6); separar de Fuego por el magenta |
| **Sueño** | `#C5B1E5` | `#F5D2C9` | pastel; activa el filtro acuarela de 15 |

\* #3 sólo como referencia interna de material, no circular.
