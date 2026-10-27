# 01 · Investigación: estilos y técnicas para las Películas

> Agente CINE, ronda 4 (2026-10-26). Lo leen los agentes que producen películas. Contrato común: [14-plan-cinematografico.md](../14-plan-cinematografico.md) §2.
> ⚠️ Contiene spoilers de la Parte III. Nada se commitea ni se publica sin el OK del dueño.

## 0. Cómo leer este catálogo

**Qué es.** Un menú de estilos y técnicas para las Películas: presentaciones antes de cada batalla, películas de canción e intros de multiverso. Cada entrada dice cómo se construye, cuánto cuesta, qué cambia con la accesibilidad, en qué momento de la historia encaja, de dónde viene y si ya existe.

**«Viable» quiere decir una de dos cosas:**

1. corre a **60 fps** en WebGL2 / Pixi 8 en una laptop media (GPU integrada) a la resolución interna de la película (referencia: 1920×1080, unos 2,1 Mpx); o
2. se **hornea al cargar** con `film/bake.ts`, durante una pantalla de carga con estilo, y en cada cuadro solo se muestra el resultado. Regla: **cero tirones por primer uso** después de que arranca el reloj.

`film/` = `game/src/film/`. El motor se escribe en paralelo. Si un nombre cambia, manda el código.

### Presupuesto por cuadro (referencia; medir siempre con el harness headless)

| Tier | Pasadas de pantalla completa | Lecturas de textura por píxel (suma) | CPU de la película |
|---|---|---|---|
| **alto** | ≤ 6 (el uber post de `film/post.ts` cuenta como 1) | ≤ ~40 | ≤ 4 ms |
| **bajo** | ≤ 3 | ≤ ~16 | ≤ 4 ms |

- **Pasada** = un filtro sobre toda la pantalla. Cada efecto que se activa dentro del uber post suma **lecturas**, no pasadas.
- **Memoria**: una RenderTexture de 1920×1080 RGBA8 ocupa ~8,3 MB. Un tile de 512² ocupa ~1 MB, uno de 1024² ~4 MB y uno de 2048² ~16 MB.
- **Meta de VRAM** por película: ≤ ~200 MB horneados. Todo se libera al cerrar (`destroy(true)`).
- Los Momentos ya tienen tier alto/bajo: `PostFilter` corre en cada cuadro en el alto y solo en los impactos en el bajo. Las películas heredan esa idea.
- Las cifras son aproximadas. Sirven para comparar entre técnicas, no reemplazan la medición.

### Reglas que valen para todo el catálogo

- **Cero raster en el repo.** Papel, cerdas de pincel, manchas de lente y vetas de madera se generan por código al cargar: un tile procedural de 4 canales en `film/post.ts` y texturas horneadas en `film/bake.ts`.
- **Los gatos son su pintura MAI, horneada una vez** con la lente del estilo. La firma es la de siempre, `bakeX(renderer, src) → { tex, sil }`, como `bakeCel`, `bakeToon`, `bakeMiniature`, `bakePlain` y `bakeTv`. Se mantienen las invariantes de `docs/arte/ESTILOS.md` §8: 3/4 hacia la izquierda, cuerpo completo, que se lea gato, la textura va en el shader y los gatos de casa no se redibujan.
- **Las siluetas salen del arte real** (13 §2.2). Llevan el alfa del puppet, luz de borde del lado de la fuente, los ojos, el accesorio clave encendido y algo que las separe del fondo. Nunca se usa una figura genérica.
- **Dos ritmos** (13 §2.1).
  - **Lento para entender**: presentar → mostrar → consecuencia → avanzar.
  - **Rápido para sentir**: cortes, smears, crash zooms y ráfagas.
  - Los estilos legibles (Da Vinci, recortado, ukiyo-e, planos de situación) sostienen el ritmo lento. Los efectos rápidos (impacto, whip, glitch, ráfaga) siempre van **entre dos planos legibles**.
- **Psicodelia con dirección** (13 §2.3). Después de cada explosión visual viene un plano legible. Textos y globos van sobre zonas calmadas.
- **Accesibilidad siempre encendida**: «Reducir movimiento» (**RM**) y «Reducir destellos» (**RD**). Ver §9.
- **Determinismo.** Todo es una función del tiempo de la película, así que se puede adelantar y retroceder. No se usa `Math.random()` en vivo: las semillas son fijas.

### Lo que ya existe (no se duplica: se cita y se porta si hace falta)

| Estilo o pieza existente | Dónde vive | Entradas de este catálogo |
|---|---|---|
| NEÓN CEL (LIKY FIGHT) | `momentos/anime/shaders.ts` (`PostFilter`, `bakeCel`) | M1, M2 |
| TINTA Y PERGAMINO (WHEN I LOSE) | `momentos/songs/whenILose/ink.ts` (`bakeMiniature`, sumi-e, pan de oro) | P3, P10, T5 |
| GRAFITI Y SEÑAL ROTA (te ODIO) | `momentos/songs/teOdio/post.ts` (`SignalFilter`), `bake.ts` (`COMIC_CEL`, `bakeStencil`) | R11, T6 |
| COLOSO / GRABADO (Hemkade) | `momentos/songs/hemkade/glsl.ts` | P17 |
| FUNCIÓN DE FERIA 1930 (CIRCUS MALUS) | `momentos/songs/circusMalus/film.ts` (`FilmFilter`, `bakeToon`) | R2, R10, T2 |
| ANIMATIC (YONOSE TODO) | `momentos/songs/yonoseTodo/paper.ts` (`bakePlain`, lápiz, acuarela) | P4, M3 |
| Caricatura de TV (Drunck) | `momentos/songs/drunck/tv.ts` (`bakeTv`); `CRTFilter` en `scenes/CajaScene.ts` | R11, T4 |
| FlashGuard | `momentos/flash.ts` (`MAX_FLASHES_PER_SEC = 3`, `SOFT_FLASH_ALPHA`, `safeFlashColor`) | C5, §9 |
| Glitch de las cines | `cine/screenFx.ts` (`GlitchFilter` + `RGBSplitFilter`) | R5, T6 |

**Formato de cada entrada:**
- **Cómo**: la construcción.
- **Costo**: por cuadro / al cargar · tier.
- **RM / RD**: qué cambia con cada opción.
- **Momentos**: dónde encaja en esta historia.
- **Refs**: obras de dominio público con fecha y museo; películas modernas solo por nombre, como referencia de técnica.
- **Estado**: `implementado en film/...`, `existe en ...` o `propuesto`.

---

## 1. Pictóricos

### P1 · Van Gogh: pinceladas que fluyen
- **Cómo:** **Campo de flujo**: curl noise más remolinos colocados a mano (vórtices con caída 1/r alrededor de la luna y las estrellas), horneado en una textura RG. **Pinceladas** (al cargar): quads con textura de cerda procedural, sembrados por disco de Poisson (r ≈ 6–10 px) y orientados al flujo. Toman el color de la escena con ±8 % de variación de matiz. Se dibujan una vez y se rasterizan. **Alternativa**: LIC de 12 muestras a lo largo del flujo sobre ruido blanco, multiplicado por el color. **Impasto**: la altura sale de la máscara de trazos y la normal se saca con Sobel; se hornea una luz rasante fija. **Hervor**: 3 variantes con semillas distintas, en ciclo a ~8 fps. **Halos**: sprites de anillos de trazos que giran. **Gatos**: impasto bake de la pintura MAI (Kuwahara + trazos orientados por el tensor de estructura).
- **Costo:** por cuadro: ~0 pasadas extra (se muestra la variante del cuadro) más 10–30 sprites de halo. Con LIC en vivo: 1 pasada de 12 lecturas. Al cargar: 3 variantes × 8 MB por plano pintado y 150–400 ms de GPU, con ~20 000 trazos por variante en 1 draw call. Tier: bajo si va horneado, alto con LIC en vivo.
- **RM / RD:** RM: el hervor se congela en una variante (o cruza lento cada 2 s) y los halos giran a ×0,3. RD: estrellas sin pulso y una luna que no late.
- **Momentos:** película de canción nocturna; el cielo sobre la isla del faro (la demo `?film=demo`); un sueño de Canelo; el recuerdo idealizado de una noche con Luzterna; la intro de un gato pintor del multiverso.
- **Refs:** «La noche estrellada» (1889, MoMA, Nueva York); «Terraza de café por la noche» (1888, Museo Kröller-Müller, Otterlo); «Noche estrellada sobre el Ródano» (1888, Musée d'Orsay, París); «Campo de trigo con cuervos» (1890, Museo Van Gogh, Ámsterdam); en cine, «Loving Vincent» (2017).
- **Estado:** implementado en `film/styles/vangogh`.

### P2 · Da Vinci: cuaderno de estudios
- **Cómo:** **Pergamino** horneado por shader: fbm de fibras, manchas de humedad, borde oscurecido y pliegue central. **Gatos**: Sobel de la pintura → línea de tinta sepia más gruesa donde el borde es más fuerte. Hatching por luminancia: una dirección bajo 0,65, cruzado bajo 0,40 y triple bajo 0,18, con temblor de mano (ruido 1D). Acento sanguina (rojo tierra, apagado) en los medios tonos cálidos. **Revelado «draw-on»**: una textura de orden de trazo (primero los contornos, después el hatching por distancia al contorno + ruido) y un umbral animado. **Líneas de construcción**: círculos, ejes y proporciones en Graphics horneado. **Notas en escritura especular**: texto horneado con `scale.x = −1`, renglones de derecha a izquierda. **Estudios anatómicos**: el esqueleto del rig (`catRigs`) dibujado como lámina. **Sfumato**: una copia desenfocada que se mezcla en los bordes. **Luz de vela**: ver C8. **Variante «plano técnico»** para reglas mecánicas: cianotipia (azul de Prusia con líneas blancas).
- **Costo:** por cuadro: 1 pasada (revelado + vela) de ≈ 3 lecturas. Al cargar: pergamino de 8 MB (~5 ms) y 2 RT por gato (~10 ms). Tier: bajo.
- **RM / RD:** RM: el revelado es un fundido de opacidad en lugar de un trazo que avanza, y la vela queda fija. RD: no aplica.
- **Momentos:** la **presentación antes de una batalla** (estudio del rival: proporciones, su regla, su punto débil); la regla de una dimensión revelada; el plan del golpe; el taller de un inventor del multiverso.
- **Refs:** «Hombre de Vitruvio» (c. 1490, Gallerie dell'Accademia, Venecia); «Gatos, leones y un dragón» (c. 1517–1518, Royal Collection, RCIN 912363): más de veinte estudios de gatos en una hoja; «La Gioconda» (c. 1503–1519, Louvre), por el sfumato; Códice Leicester (c. 1506–1510), por la escritura especular; Anna Atkins, «Photographs of British Algae: Cyanotype Impressions» (1843), para la variante de cianotipia.
- **Estado:** implementado en `film/styles/davinci`. La cianotipia está propuesta.

### P3 · Ukiyo-e y grabado japonés (con olas de Hokusai)
- **Cómo:** Posterizar a 5–7 tintas por paleta (índigo, bermellón apagado, ocre, verde y crema). Contorno fino de grosor constante en los bordes entre tintas. Bokashi: un degradado horneado en la franja alta del cielo. Vetas de madera: ruido anisotrópico estirado y multiplicado. Desregistro de 1–2 px por tinta. Olas: mallas de tiras con garras de espuma (curvas rellenas). Lluvia: líneas rectas finas (C1 en modo línea). Cartucho de título vertical en Dela Gothic One.
- **Costo:** 1 pasada (vetas + desregistro) de ≈ 3 lecturas. Posterizado de ~3 ms por gato. Tier bajo.
- **RM / RD:** RM: olas a ×0,3 de amplitud. RD: no aplica.
- **Momentos:** la presentación de una batalla naval; una travesía entre islas; un multiverso de gatos samurái; una despedida bajo la lluvia en el puerto.
- **Refs:** Hokusai, «La gran ola de Kanagawa» (c. 1831) y «Ejiri en la provincia de Suruga» (c. 1830–1832), de «Treinta y seis vistas del monte Fuji»; Hiroshige, «Repentino chubasco sobre el puente Shin-Ōhashi y Atake» (1857); Kuniyoshi, «Gatos sugeridos como las cincuenta y tres estaciones del Tōkaidō» (c. 1847–1850) y sus gatos que forman letras (c. 1842).
- **Estado:** preset en `film/styles` (`ukiyoe`: horneado de gatos `ukiyoeBake` en 4 tintas de plancha + look). El kit de escenario (olas, cartuchos, sellos) está propuesto. No es el sumi-e de WHEN I LOSE: aquí es color plano de plancha, no aguada.

### P4 · Acuarela que sangra
- **Cómo:** Un campo de distancia del plano (JFA horneado) más ruido, con un umbral animado: el frente de pigmento se esparce. Borde húmedo más oscuro donde el gradiente del frente es alto. Granulado con el canal de papel del tile. Backruns («coliflor») con ruido celular en el frente. El lápiz se ve debajo.
- **Costo:** 1 pasada de ≈ 5 lecturas. JFA de ~10 ms por plano de 1024² (4 MB). Tier bajo-medio.
- **RM / RD:** RM: el frente avanza a la mitad de velocidad o se cambia por un fundido. RD: no aplica.
- **Momentos:** el color que vuelve a un mundo gris; un recuerdo cálido de Canelo; un «Continuará» pintado; la mañana después.
- **Refs:** Durero, «La gran mata de hierba» (1503, Albertina, Viena); Winslow Homer, «Huracán, Bahamas» (1898, Met, Nueva York); en cine, «Song of the Sea» (2014).
- **Estado:** existe en `momentos/songs/yonoseTodo/paper.ts` (modo WATERCOLOR). En `film/styles` hay un preset (`acuarela`: horneado `acuarelaBake` + look con papel); el kit de escenario está propuesto.

### P5 · Tiza y pastel
- **Cómo:** El pigmento solo se queda en los «dientes» del papel: la cobertura se compara con el grano del tile. Trazos anchos con el borde roto. Difumino con el dedo (blur direccional corto, horneado). Polvo que cae, como partículas en función de t. Variante pizarrón: fondo verde-negro y un borrado que deja un fantasma (~8 % de alfa).
- **Costo:** 1 pasada de ≈ 3 lecturas. Tier bajo.
- **RM / RD:** RM: el polvo queda quieto. RD: no aplica.
- **Momentos:** el **briefing del capitán en el pizarrón** (flechas de tiza sobre la Carta de las Cajas); explicar una mecánica; un recuerdo de infancia.
- **Refs:** Degas, «La estrella» (c. 1878, Musée d'Orsay), al pastel; los retratos al pastel de Rosalba Carriera (s. XVIII).
- **Estado:** propuesto.

### P6 · Linograbado y xilografía (Posada)
- **Cómo:** Umbral duro de luminancia con un borde de ruido: el corte de la gubia. Tallado en franjas que siguen el contorno (`fract(d·k)` sobre un campo de distancia horneado), con el ancho según la luminancia. Tinta irregular en el negro. Dos tintas más el papel.
- **Costo:** 1 pasada de ≈ 3 lecturas. Campo de distancia de ~10 ms por plano. Tier bajo.
- **RM / RD:** imagen estable; no aplica.
- **Momentos:** el duelo después de una muerte (calaveras de papel, tono de Día de Muertos); una leyenda contada por un viejo; el cartel de «SE BUSCA» del rival.
- **Refs:** José Guadalupe Posada, «La Calavera Garbancera» (c. 1910–1913); Félix Vallotton, «Intimidades» (1897–1898, xilografías); en cine, «Persépolis» (2007), por el blanco y negro plano.
- **Estado:** propuesto.

### P7 · Vitral
- **Cómo:** Voronoi horneado: cada celda es un vidrio, en una textura con el ID de la celda y la distancia a la arista. Plomo: arista gruesa y oscura. Color de la celda: la escena leída en el centro de la celda, empujada a la paleta. Luz que atraviesa el vidrio: rayos de C7 sobre el piso. Las celdas se pueden caer como transición.
- **Costo:** 1 pasada de ≈ 3 lecturas. Voronoi de ~10 ms y 8 MB. Tier bajo.
- **RM / RD:** RM: la luz no barre. RD: brillo ≤ 0,6; el sol que entra no destella.
- **Momentos:** un mito de origen; un funeral; la regla del universo contada como leyenda sagrada.
- **Refs:** Sainte-Chapelle (1242–1248, París); vitrales de la catedral de Chartres (s. XII–XIII); vitral de Mucha en la catedral de San Vito, Praga (1931).
- **Estado:** propuesto.

### P8 · Papel recortado y sombras chinescas
- **Cómo:** Cada pieza es una silueta (alfa del puppet o del SVG) con borde rasgado (alfa erosionado con ruido) y sombra dura desplazada 4–8 px. Cartulina por capa. Piezas articuladas (el rig `CatPuppet` ya lo hace) a 12 fps. Variante sombra: silueta oscura, nunca negro puro, sobre un degradado de color con luz de borde.
- **Costo:** ~0 pasadas: se hornea por pieza y la sombra es un sprite duplicado. Tier bajo.
- **RM / RD:** RM: menos bamboleo de las piezas. RD: no aplica.
- **Momentos:** el cuento dentro del cuento (la leyenda del primer gato); explicar reglas como teatro de sombras; las intros del multiverso en fila; un flashback.
- **Refs:** Lotte Reiniger, «Las aventuras del príncipe Achmed» (1926); el teatro de sombras wayang kulit; el papel picado mexicano; en cine, «Kirikú y la hechicera» (1998).
- **Estado:** propuesto.

### P9 · Puntillismo
- **Cómo:** Rejilla de puntos con jitter (offsets de Poisson horneados). Cada píxel busca su punto en su celda y en las vecinas. El color de la escena en el centro del punto se parte en 2 tonos complementarios alternados. Fondo de papel.
- **Costo:** 1 pasada de ≈ 9 lecturas (tier alto). Con 1 vecina baja a tier bajo.
- **RM / RD:** RM: los puntos no centellean. RD: no aplica.
- **Momentos:** la última tarde tranquila antes de la batalla; un domingo en el puerto.
- **Refs:** Seurat, «Tarde de domingo en la isla de la Grande Jatte» (1884–1886, Art Institute of Chicago) y «Bañistas en Asnières» (1884, National Gallery, Londres).
- **Estado:** propuesto.

### P10 · Klimt: pan de oro
- **Cómo:** Una máscara de oro por capa o por matiz. Patrones de espirales, ojos y rectángulos como SDF en un tile horneado. El metal: una banda de brillo que se desplaza más chispas. Personajes planos dentro de mantos de patrón. Base: el modo ILLUMINATED de `whenILose/ink.ts`.
- **Costo:** 1 pasada de ≈ 4 lecturas. Tile de 1024². Tier bajo.
- **RM / RD:** RM: la banda pasa lenta. RD: chispas sin destello y brillo ≤ 0,6.
- **Momentos:** un reencuentro y un abrazo; una promesa; **la cima del apego con Luzterna**, justo antes del giro, en contraste con el noir de después.
- **Refs:** Klimt, «El beso» (1907–1908, Belvedere, Viena) y «Retrato de Adele Bloch-Bauer I» (1907, Neue Galerie, Nueva York).
- **Estado:** propuesto.

### P11 · Claroscuro y tenebrismo barroco
- **Cómo:** Un grade que hunde los medios tonos hacia un marrón cálido, nunca negro puro. Una máscara de luz elíptica desde una ventana o una vela. Luz de borde en las siluetas (13 §2.2). Un barniz cálido con craquelado en la viñeta.
- **Costo:** +2 lecturas dentro de `film/post`. Tier bajo.
- **RM / RD:** RM: la luz no se mueve rápido. RD: no aplica.
- **Momentos:** una confesión; el villano explica su plan; la tripulación a la mesa antes de la batalla.
- **Refs:** Rembrandt, «La ronda de noche» (1642, Rijksmuseum, Ámsterdam); Caravaggio, «La vocación de San Mateo» (1599–1600, San Luis de los Franceses, Roma).
- **Estado:** propuesto, como preset de `film/post` (contraste, lift, tinte y viñeta).

### P12 · Turner: atmósfera
- **Cómo:** Una copia muy desenfocada de cada plano, horneada y mezclada con la nítida por una máscara radial alrededor del sujeto. Pinceladas sueltas de luz (sprites aditivos amarillo cromo). El sol como una mancha blanca. Vapor de fbm.
- **Costo:** 1 pasada de ≈ 4 lecturas; el doble de VRAM por plano. Tier bajo.
- **RM / RD:** RM: el vapor deriva lento. RD: el sol no late.
- **Momentos:** una tormenta en el mar; la llegada a una dimensión nueva; el barco que se aleja; el cierre de un acto.
- **Refs:** Turner, «Lluvia, vapor y velocidad» (1844, National Gallery, Londres); «El Temerario remolcado a su último atraque» (1839, National Gallery); «Tormenta de nieve: barco de vapor frente a la bocana de un puerto» (1842, Tate Britain).
- **Estado:** propuesto.

### P13 · Munch y expresionismo
- **Cómo:** UV desplazadas por un campo sinuoso horneado. La escena redibujada como líneas paralelas que siguen el flujo (LIC de 6 muestras). Paleta en bandas. Variante Caligari: sombras pintadas sobre el set y perspectivas inclinadas.
- **Costo:** 1 pasada de ≈ 8 lecturas. Tier alto.
- **RM / RD:** RM: ondulación a ×0,3 y nunca giro. RD: no aplica.
- **Momentos:** pánico; una pesadilla; el silencio justo después de una muerte.
- **Refs:** Munch, «El grito» (1893, Museo Nacional, Oslo); en cine, «El gabinete del doctor Caligari» (1920).
- **Estado:** propuesto.

### P14 · Art Nouveau: cartel de Mucha
- **Cómo:** Marco ornamental de curvas «látigo», vectorial y horneado. Halo circular detrás del personaje. Contorno grueso de color. Pasteles planos. Tipografía Playfair Display.
- **Costo:** ~0 pasadas (todo horneado). Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** el **cartel de presentación del rival**; la tarjeta de título de una dimensión; la intro de un gato diva del multiverso.
- **Refs:** Mucha, «Gismonda» (1894) y «Las estaciones» (1896).
- **Estado:** propuesto.

### P15 · Pintura sobre vidrio
- **Cómo:** Una RT de retroalimentación de tamaño fijo: la escena nueva se mezcla con el cuadro anterior (decay ~0,85), desplazado según la cámara, y la pintura se arrastra. Retroiluminación. ⚠️ Rompe el seek: al saltar hay que hacer un pre-roll de 0,5 s.
- **Costo:** 1 pasada + 1 copia, ≈ 3 lecturas; +8 MB. Tier alto, por el seek más que por la GPU.
- **RM / RD:** RM: decay más rápido (menos arrastre). RD: no aplica.
- **Momentos:** una metamorfosis (un gato que se vuelve mar); un recuerdo que se derrite; la muerte como transformación.
- **Refs:** Aleksandr Petrov, «El viejo y el mar» (1999); Caroline Leaf, «The Street» (1976).
- **Estado:** propuesto.

### P16 · Animación con arena
- **Cómo:** Luminancia invertida sobre una caja de luz cálida. Bordes granulados (ruido fino en el umbral). Barridos de arena con una máscara de ruido. Granos que caen.
- **Costo:** 1 pasada de ≈ 3 lecturas. Tier bajo.
- **RM / RD:** RM: barridos más lentos. RD: no aplica.
- **Momentos:** una memoria que se borra; el tiempo que se acaba; una leyenda antigua.
- **Refs:** Caroline Leaf, «The Owl Who Married a Goose» (1974).
- **Estado:** propuesto.

### P17 · Grabado a buril y aguafuerte
- **Cómo:** Líneas paralelas cuyo ancho sigue la sombra, con cruzado en lo más oscuro. Tono de plancha y borde biselado. Aguatinta como granulado fino. En pantalla, las líneas siguen un campo de distancia y se revelan línea por línea.
- **Costo:** 1 pasada de ≈ 3 lecturas. Tier bajo.
- **RM / RD:** RM: el revelado es un fundido. RD: no aplica.
- **Momentos:** el prólogo de una leyenda; el bestiario del rival; un mapa antiguo de las cajas.
- **Refs:** Durero, «Melancolía I» (1514); Gustave Doré, ilustraciones de «La Divina Comedia» (1861–1868); Goya, «El sueño de la razón produce monstruos» (de «Los caprichos», 1799).
- **Estado:** existe en 3D en `momentos/songs/hemkade/glsl.ts` (GRABADO). En pantalla está propuesto para `film/`.

### P18 · Carboncillo
- **Cómo:** Sobel con difumino (blur direccional corto) y grano de papel. Huellas de dedo. Las líneas de borrador quedan claras y el fantasma de lo borrado se queda.
- **Costo:** 1 pasada de ≈ 6 lecturas. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** un interrogatorio; el retrato del caído; el boceto de un sospechoso (junto al noir).
- **Refs:** Seurat, «Aman-Jean» (1883, Met, Nueva York), en conté; los dibujos de Käthe Kollwitz.
- **Estado:** propuesto.

---

## 2. Looks de cine y realismo

### R1 · Noir
- **Cómo:** Blanco y negro por luminancia con una curva S dura. **Un tono conservado**: si el matiz está cerca del elegido y hay saturación, el color se queda; todo lo demás queda gris. Por ejemplo, la luz azul de la linterna de Luzterna. Luz de persiana: franjas en perspectiva horneadas. Lluvia y reflejos (C1), suciedad de lente (R3) y halación (R4). Títulos en Bebas Neue.
- **Costo:** +2 lecturas en el uber post; la persiana es 1 sprite. Tier bajo (con lluvia, ver C1).
- **RM / RD:** RM: la persiana no se desliza y no hay cámara en mano. RD: halación ≤ 0,3 y relámpagos suaves (C5).
- **Momentos:** una investigación; una traición; **la calle mojada después de la muerte de Luzterna**; una confesión.
- **Refs:** «Perdición» (1944); «El tercer hombre» (1949); «Sin City» (2005), por el color aislado.
- **Estado:** implementado en `film/styles/noir`.

### R2 · Grano de película
- **Cómo:** Grano procedural en el tile de 4 canales (256²). Offset determinista por cuadro de película, **a 24 fps escalonados**, no a 60. Más fuerte en los medios tonos, mezclado en overlay.
- **Costo:** +1 lectura en el uber post. Tier bajo.
- **RM / RD:** RM: no aplica. RD: amplitud ≤ 0,04 y sin parpadeo de exposición.
- **Momentos:** flashbacks; una película dentro de la película; un look documental para una presentación.
- **Refs:** las emulsiones de nitrato (c. 1890–1950).
- **Estado:** implementado en `film/post`. También existe en `circusMalus/film.ts`.

### R3 · Suciedad de lente
- **Cómo:** Un tile procedural de manchas y pelusas. Solo aparece donde hay luz fuerte (reusa la máscara de la halación). Va fijo a la lente, no a la escena.
- **Costo:** +1 lectura. Tier bajo.
- **RM / RD:** RM: no aplica. RD: intensidad a ×0,5 y sin pulsos.
- **Momentos:** la linterna de Luzterna de frente; el faro; el contraluz sobre el mar.
- **Refs:** la fotografía a contraluz.
- **Estado:** implementado en `film/post`.

### R4 · Halación
- **Cómo:** Bright-pass (umbral ~0,8) leído en un anillo de 8 taps; es más barato que un blur de 2 pasadas. Tinte rojo-naranja apagado. Se suma solo alrededor de lo muy brillante.
- **Costo:** +8 lecturas en tier alto, o +4 en el bajo.
- **RM / RD:** RM: no aplica. RD: tope de 0,3, sin variaciones rápidas.
- **Momentos:** los neones de la dimensión Borracha; faros y linternas; los sueños.
- **Refs:** la película sin capa antihalo.
- **Estado:** implementado en `film/post`.

### R5 · Aberración cromática
- **Cómo:** 3 lecturas con un desplazamiento radial que crece hacia el borde. Pulsos en los impactos. Puede subir con la canción: es la «distorsión que crece hacia el clímax» del plan 14 §0.6, ahora visible.
- **Costo:** +2 lecturas. Tier bajo.
- **RM / RD:** RM: no aplica. RD: sin pulsos de más de 4 px; separación baja y constante.
- **Momentos:** cruzar una gatera; un golpe; una borrachera; un multiverso que no encaja.
- **Refs:** «Spider-Man: Un nuevo universo» (2018), por el desregistro de impresión.
- **Estado:** implementado en `film/post`. Ya existen `aberr` (`momentos/anime/fx.ts`) y `RGBSplitFilter` (`cine/screenFx.ts`).

### R6 · Profundidad de campo y bokeh
- **Cómo:** Cada plano de parallax tiene una copia nítida y una desenfocada (disco de 16 taps al cargar), mezcladas según la distancia al plano focal. Bokeh: sprites aditivos sobre las luces conocidas del fondo. Planos animados: un blur separable de 9 taps, solo si hace falta.
- **Costo:** ~0 pasadas (cruce de 2 sprites por plano) y +8 MB por plano. Tier bajo.
- **RM / RD:** RM: no aplica. RD: el bokeh no centellea.
- **Momentos:** separar al personaje del fondo en los diálogos; aislar un objeto clave.
- **Refs:** «El ciudadano Kane» (1941), como contraejemplo de foco profundo.
- **Estado:** implementado en `film/camera` (copias nítida y desenfocada).

### R7 · Destellos anamórficos
- **Cómo:** Por cada fuente de luz conocida: un sprite horizontal estirado, azul-cian y aditivo. Fantasmas sobre la línea que va de la fuente al centro. Se atenúan con la capa delantera.
- **Costo:** unos pocos sprites aditivos. Tier bajo.
- **RM / RD:** RM: no aplica. RD: intensidad a ×0,4 y sin destello al cruzar.
- **Momentos:** la llegada heroica de un barco; el faro que barre la escena.
- **Refs:** las lentes anamórficas de la ciencia ficción de los años 1970–1980.
- **Estado:** propuesto.

### R8 · Bleach bypass
- **Cómo:** mezclar la imagen con su luminancia: −50 % de saturación, contraste alto, negros densos y blancos metálicos.
- **Costo:** +0 lecturas. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** el campo después de una batalla perdida; el regreso sin Luzterna.
- **Refs:** «1984» (1984); «Seven: los siete pecados capitales» (1995).
- **Estado:** propuesto, como preset de `film/post`.

### R9 · Noche americana (de día a noche)
- **Cómo:** La escena de día se subexpone ~1,5 pasos, se multiplica por azul y se desatura. Las luces siguen encendidas gracias a una máscara emisiva por capa. Así se reusan los sets de día sin hornearlos de nuevo.
- **Costo:** +0–1 lectura. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** una infiltración; **el mismo lugar «después»**: de día con Luzterna, de noche sin ella.
- **Refs:** «La noche americana» (1973), que le da nombre a la técnica.
- **Estado:** propuesto, como preset de `film/post`.

### R10 · Cine mudo
- **Cómo:** Blanco y negro con parpadeo de exposición (±4 % a 18 fps). Rayas y polvo, en función de t. Viñeta redonda y temblor de ventanilla de ±1 px. Personajes animados de a tres (8 fps). Intertítulos en Playfair Display, horneados. Iris (T2).
- **Costo:** +2 lecturas. Tier bajo.
- **RM / RD:** RM: sin temblor de ventanilla. RD: parpadeo ≤ 2 % y nunca a blanco.
- **Momentos:** un flashback lejano (la Parte I como película vieja); comedia física; un «Continuará» de serial.
- **Refs:** «Viaje a la Luna» (1902); «Nosferatu» (1922); «El maquinista de La General» (1926).
- **Estado:** existe en `momentos/songs/circusMalus/film.ts`. En `film/styles` hay un preset (`mudo`: sepia, parpadeo y rayas en `film/post` + `mudoBake` ortocromático) y la tipografía `silent` (intertítulo con marco art déco) en `film/present`.

### R11 · VHS y CRT (ya existe)
- **Cómo:** `CRTFilter` de pixi-filters en `scenes/CajaScene.ts` y `drunck/stage.ts`. Banda de tracking, desgarro, croma corrido y datamosh en `teOdio/post.ts` (`SignalFilter`).
- **Costo:** 1 pasada de ≈ 3–6 lecturas. Tier bajo.
- **RM / RD:** RM: los desgarros no recorren la pantalla. RD: sin nieve parpadeante fuerte ni pérdidas de señal a blanco.
- **Momentos:** la dimensión Borracha; una cinta encontrada; el noticiero del multiverso.
- **Refs:** la tele doméstica de los años 80 y 90.
- **Estado:** existe (citado). Se porta como preset si una película lo necesita.

### R12 · Sepia y ferrotipo
- **Cómo:** Sepia: una rampa de luminancia de café oscuro a crema. Ferrotipo: viñeta irregular; placa rayada; foco muy corto con borde arremolinado (blur radial horneado); fantasmas de exposición larga.
- **Costo:** +1–2 lecturas. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** **la foto de la tripulación**, que después vuelve con alguien que falta; el retrato del caído en el velorio.
- **Refs:** el daguerrotipo (1839); el ferrotipo (patentado en 1856); los retratos de estudio de la década de 1860.
- **Estado:** el sepia está implementado en `film/post`. El ferrotipo está propuesto.

---

## 3. Clima y luz

### C1 · Lluvia, salpicaduras y reflejos mojados
- **Cómo:** **3 capas de rayas**. Las lejanas son finas, densas y tenues; las cercanas, gruesas, borrosas y rápidas. Cada gota es una función cerrada de t: `y = (y0 + v·t) mod H`, `x = x0 + viento·t`. **Salpicaduras**: anillos cortos en la fase en que la gota toca el suelo. **Ondas en los charcos**: anillos SDF dentro de una máscara de charcos. **Reflejo mojado**: la escena volteada y estirada en vertical (smear de 6 taps), multiplicada por la máscara del suelo y distorsionada por las ondas.
- **Costo:** ~1 500 quads instanciados en 1–3 draw calls. Reflejo: 1 pasada solo en la franja del suelo (~30 % de la pantalla) con 6 lecturas. Tier alto. En el bajo: 1 capa y reflejo sin smear.
- **RM / RD:** RM: lluvia más vertical y lenta, sin ráfagas ni gotas en la lente. RD: los relámpagos se manejan en C5.
- **Momentos:** la revelación (H66–H69 ya tiene lluvia); un funeral; una despedida en el muelle; el noir.
- **Refs:** Gustave Caillebotte, «Calle de París, día lluvioso» (1877, Art Institute of Chicago); Hiroshige (ver P3); «Cantando bajo la lluvia» (1952); «Blade Runner» (1982).
- **Estado:** implementado en `film/weather`.

### C2 · Bancos de niebla
- **Cómo:** 2–4 láminas de fbm tileable de 512², horneadas y puestas a distintas profundidades. Cada una deriva a su velocidad. Más densa abajo. Perspectiva aérea: cada plano se mezcla con el color de la niebla según su z. Halos radiales suaves en las luces.
- **Costo:** 2–4 capas de pantalla completa de 1 lectura (es costo de relleno). Tier bajo con 2 capas.
- **RM / RD:** RM: la deriva baja a ×0,3. RD: no aplica.
- **Momentos:** la llegada a una isla desconocida; **perder a alguien de vista en la niebla**; la dimensión del olvido.
- **Refs:** Caspar David Friedrich, «El caminante sobre el mar de nubes» (c. 1818, Kunsthalle de Hamburgo); Whistler, «Nocturno en negro y oro: el cohete que cae» (c. 1875, Instituto de Artes de Detroit).
- **Estado:** implementado en `film/weather`.

### C3 · Viento con partículas
- **Cómo:** Hojas, pétalos, brasas, polvo o luciérnagas como sprites instanciados. Posición: `x0 + v·t + A·sin(ωt+φ)`, con ráfagas tomadas de una tabla de ruido 1D. Las hojas giran «en 3D» con `scale.x = cos θ`. El mismo campo mueve los vértices de pelo y tela.
- **Costo:** 200–800 sprites en 1–2 draw calls (~0,3 ms de CPU). Tier bajo.
- **RM / RD:** RM: densidad y velocidad a ×0,5, sin ráfagas que crucen toda la pantalla. RD: luciérnagas y brasas con fases lentas (≥ 1 s).
- **Momentos:** la llegada del rival (las hojas se levantan); una despedida (pétalos); un incendio (brasas); un recuerdo (luciérnagas).
- **Refs:** Hokusai, «Ejiri en la provincia de Suruga» (c. 1830–1832), con papeles que vuelan.
- **Estado:** implementado en `film/weather`.

### C4 · Nieve
- **Cómo:** Copos suaves en 3 capas con deriva sinusoidal. Acumulación horneada en los bordes de arriba de los objetos (el gradiente del alfa apunta hacia arriba). Aliento visible.
- **Costo:** ~1 000 copos en 1 draw call. Tier bajo.
- **RM / RD:** RM: caída lenta, sin deriva lateral fuerte. RD: no aplica.
- **Momentos:** el silencio después de una muerte; una dimensión fría; el final de un acto.
- **Refs:** Pieter Bruegel el Viejo, «Cazadores en la nieve» (1565, Kunsthistorisches Museum, Viena); Hiroshige, «Nieve nocturna en Kambara» (c. 1833–1834).
- **Estado:** implementado en `film/weather`.

### C5 · Relámpagos (con FlashGuard)
- **Cómo:** El rayo es una polilínea fractal (desplazamiento del punto medio con semilla fija), horneada con glow. El destello sube la exposición en el uber post y por un instante ilumina lo que estaba en sombra. Cada destello pide permiso a `FlashGuard` (`momentos/flash.ts`): máximo 3 por segundo y nunca rojo saturado.
- **Costo:** 1 sprite y un uniform. Tier bajo.
- **RM / RD:** RM: no aplica. RD: **sin destello de pantalla completa**; un brillo suave en el cielo (≤ `SOFT_FLASH_ALPHA` = 0,25) y el rayo tenue.
- **Momentos:** la tormenta antes de la batalla; el villano revelado en silueta; un corte en el instante del relámpago.
- **Refs:** Giorgione, «La tempestad» (c. 1506–1508, Gallerie dell'Accademia, Venecia); en cine, «Frankenstein» (1931).
- **Estado:** implementado en `film/weather`.

### C6 · Calima (heat haze)
- **Cómo:** Una banda (sobre el horizonte o sobre el fuego) con UV desplazadas por ruido que sube, 1–4 px. Un espejismo tenue invertido.
- **Costo:** +2 lecturas solo en la banda. Tier bajo.
- **RM / RD:** RM: amplitud a ×0,3. RD: no aplica.
- **Momentos:** un desierto; una forja; un incendio; un rival de fuego.
- **Refs:** «Lawrence de Arabia» (1962), por el espejismo.
- **Estado:** implementado en `film/post` (banda de calor) y `film/weather`.

### C7 · Rayos de luz (god rays)
- **Cómo:** Barato: cuñas aditivas con degradado y alfa por ruido lento, enmascaradas por la capa delantera. Caro: blur radial de la máscara de oclusión desde la fuente (24 taps a media resolución).
- **Costo:** con cuñas, ~0; con blur radial, 1 pasada a ½ resolución con 24 lecturas (tier alto).
- **RM / RD:** RM: los rayos quedan fijos. RD: intensidad ≤ 0,35, sin parpadeo.
- **Momentos:** un despertar; la luz de la linterna atravesando la niebla; una revelación mítica.
- **Refs:** Albert Bierstadt, «Entre las montañas de Sierra Nevada, California» (1868, Smithsonian American Art Museum).
- **Estado:** implementado en `film/weather`.

### C8 · Luz de vela
- **Cómo:** Un mapa de luz radial cálido que multiplica la escena. La intensidad y la posición parpadean por ruido 1D suave. Las sombras se mueven un poco con la llama.
- **Costo:** +1 lectura. Tier bajo.
- **RM / RD:** RM: el parpadeo baja a ×0,3. RD: variación ≤ 10 %.
- **Momentos:** un velorio; una historia contada de noche; el taller de Da Vinci; una conspiración.
- **Refs:** Georges de La Tour, «La Magdalena de la llama humeante» (c. 1640, LACMA, Los Ángeles); Joseph Wright of Derby, «Un experimento con un pájaro en una bomba de aire» (1768, National Gallery, Londres).
- **Estado:** implementado dentro de `film/styles/davinci`. Llevarlo a `film/weather` está propuesto.

### C9 · Guion de color (amanecer y atardecer)
- **Cómo:** Keyframes de color por escena (sombra, medio y luz) interpolados en una LUT de 256×1. Un cielo con degradado horneado. Sombras que se alargan.
- **Costo:** +1 lectura. Tier bajo.
- **RM / RD:** RM: no aplica. RD: sin saltos bruscos de exposición.
- **Momentos:** la curva de un acto (amanecer al empezar, noche en la pérdida); el último atardecer juntos; SADIE es incremental, y el color puede crecer o vaciarse con ella.
- **Refs:** Monet, «Impresión, sol naciente» (1872, Museo Marmottan Monet, París) y la serie «Catedral de Ruan» (1892–1894).
- **Estado:** propuesto, sobre el tinte de `film/post`.

### C10 · Cáusticas bajo el agua
- **Cómo:** Un atlas de Voronoi animado (32 cuadros en un ciclo) o 2 capas de la misma textura combinadas con `min`. Proyectado sobre el fondo y sobre los gatos. Tinte según la profundidad. Burbujas en función de t.
- **Costo:** +2 lecturas; atlas de 1024² (4 MB). Tier bajo.
- **RM / RD:** RM: cáusticas y burbujas más lentas. RD: brillo ≤ 0,3.
- **Momentos:** una caída al mar; un recuerdo que se hunde; peligro de ahogo.
- **Refs:** la observación real; en cine, «Song of the Sea» (2014).
- **Estado:** propuesto.

### C11 · Aurora
- **Cómo:** Cortinas hechas con mallas de tiras, deformadas con ruido 1D. Degradado aditivo de verde a violeta. Reflejo en el agua.
- **Costo:** 2–3 mallas aditivas. Tier bajo.
- **RM / RD:** RM: ondulación lenta. RD: sin pulsos de brillo.
- **Momentos:** el paso entre dimensiones; un momento de asombro; el cielo de un multiverso.
- **Refs:** Frederic Edwin Church, «Aurora Borealis» (1865, Smithsonian American Art Museum).
- **Estado:** propuesto.

### C12 · Haz del faro y de la linterna
- **Cómo:** El cono es un triángulo con degradado y polvo de ruido, enmascarado por la niebla. El faro gira con escorzo (`cos θ`). Cuando el haz mira a cámara entran el halo y el anamórfico (R7).
- **Costo:** 1–2 sprites. Tier bajo.
- **RM / RD:** RM: el barrido es más lento. RD: un halo ≤ 0,3 cuando el haz mira a cámara, nunca un destello.
- **Momentos:** **la linterna azul de Luzterna** («Te voy a buscar»); el faro de la isla del jugador, donde ocurre el final.
- **Refs:** la observación real; la isla del faro de la demo `?film=demo`.
- **Estado:** implementado en la demo: el haz del faro hecho de pinceladas que barre (`film/demo/noche.ts`) y el cono del farol con la lluvia atrapada (`film/styles/noir`, textura `nr:cone`). Falta llevarlo a `film/weather` como pieza general.

### C13 · Oleaje y espuma
- **Cómo:** Capas de mallas de tiras movidas por la suma de 3 sinusoides (una aproximación de Gerstner). Espuma donde la pendiente pasa un umbral. Partículas de rocío. El barco se balancea; la cámara no.
- **Costo:** 3–5 mallas. Tier bajo-medio.
- **RM / RD:** RM: la cámara no se balancea. RD: no aplica.
- **Momentos:** la presentación de una batalla naval; un naufragio; la travesía.
- **Refs:** Winslow Homer, «La corriente del Golfo» (1899, Met, Nueva York); Hokusai (ver P3); Turner (ver P12).
- **Estado:** propuesto.

---

## 4. Lenguajes de movimiento

### M1 · Smears
- **Cómo:** Durante 1–2 cuadros, la `sil` horneada del gato se estira a lo largo de la velocidad y se tiñe. Copias múltiples como fantasmas.
- **Costo:** 1–4 sprites. Tier bajo.
- **RM / RD:** RM: se conservan (duran 1–2 cuadros), pero la cámara no los sigue. RD: no aplica.
- **Momentos:** un salto o una huida en una película de canción frenética.
- **Refs:** «The Dover Boys at Pimento University» (1942).
- **Estado:** la silueta para smears existe en `momentos/anime/actor.ts`. En `film/` está propuesto.

### M2 · Cuadros de impacto
- **Cómo:** Dos tonos más un acento, opcionalmente invertidos, mezclados por `impact` en `PostFilter`. Verbo `impact` en `momentos/anime/fx.ts`.
- **Costo:** dentro del post. Tier bajo.
- **RM / RD:** RM: no aplica. RD: sin inversión a blanco; como máximo 3 por segundo con FlashGuard.
- **Momentos:** el golpe final de una batalla presentada; el instante del giro; un remate.
- **Refs:** la animación japonesa de acción.
- **Estado:** existe en `momentos/anime/shaders.ts` y `fx.ts`.

### M3 · Sensación de stop-motion y líneas que hierven
- **Cómo:** Tiempo escalonado, a 12 fps o variable. Hervor: un ciclo de 2–3 variantes horneadas. Pequeños saltos de posición por cuadro, como en la animación por reemplazo. La luz varía un poco entre cuadros.
- **Costo:** 0 (solo cambia la textura); el triple de VRAM por elemento que hierve.
- **RM / RD:** RM: hervor apagado y sin saltos. RD: la luz no varía.
- **Momentos:** humor artesanal; un cuento; un multiverso de plastilina.
- **Refs:** «Jasón y los argonautas» (1963); «Coraline» (2009); «El fantástico Sr. Zorro» (2009).
- **Estado:** el hervor está implementado en `film/styles/vangogh` y existe en `yonoseTodo` (lápiz). El modo general está propuesto.

### M4 · Rotoscopia
- **Cómo:** El puppet se anima con curvas tomadas de video real de gatos (fuera del repo). Se redibuja con línea Sobel y color plano que hierve.
- **Costo:** 1 pasada de ≈ 4 lecturas. El costo real es el trabajo de animación.
- **RM / RD:** RM: hervor apagado. RD: no aplica.
- **Momentos:** un recuerdo que se siente demasiado real; un sueño lúcido.
- **Refs:** el rotoscopio de los hermanos Fleischer (patente de 1917); «Blancanieves y los siete enanos» (1937); «Waking Life» (2001).
- **Estado:** propuesto.

### M5 · Motion comic
- **Cómo:** Viñetas (verbo `panels` en `momentos/anime/cutin.ts`). La cámara viaja de viñeta en viñeta con parallax interno. Globos y onomatopeyas horneados.
- **Costo:** máscaras rectangulares fijas. Tier bajo.
- **RM / RD:** RM: corte de viñeta a viñeta, sin viaje. RD: no aplica.
- **Momentos:** el «antes en…»; un multiverso de cómic; tres rivales presentados en 6 s.
- **Refs:** «Spider-Man: Un nuevo universo» (2018), por los recuadros de texto.
- **Estado:** existe en `momentos/anime/cutin.ts`. En `film/` está propuesto.

### M6 · Títulos con recortes (estilo Saul Bass)
- **Cómo:** Formas planas recortadas, de 2–3 colores. El texto se mueve con las formas. Cortes en el tiempo fuerte. Graphics horneado antes del reloj; tipografía Bebas Neue o Anton.
- **Costo:** ~0. Tier bajo.
- **RM / RD:** RM: las formas aparecen con fundido en lugar de cruzar la pantalla. RD: no aplica.
- **Momentos:** la apertura de la Parte III; **la presentación de cada gato del multiverso** (nombre, rasgo icónico y regla); los créditos.
- **Refs:** las secuencias de títulos de «Vértigo» (1958) y «Anatomía de un asesinato» (1959).
- **Estado:** implementado en `film/present` (entrada `bass` de las tarjetas: la banda plana entra, la regla después y las palabras al final; con RM, fundido).

### M7 · Pantalla dividida
- **Cómo:** 2–4 ventanas con máscaras de geometría fija, cada una con su contenedor y su cámara. Las divisiones entran deslizándose.
- **Costo:** bajo con rectángulos (scissor); más alto con formas libres (stencil).
- **RM / RD:** RM: las ventanas aparecen con fundido. RD: no aplica.
- **Momentos:** Canelo y Luzterna en dos lugares a la vez; un plan en paralelo; **el mismo gato en 4 universos**.
- **Refs:** «Hulk» (2003).
- **Estado:** propuesto.

### M8 · Animación limitada y «en dos»
- **Cómo:** Personajes a 12 fps (la regla de ESTILOS §7). Poses sostenidas, con solo la boca y los ojos en movimiento. Ciclos, y cámara que recorre arte quieto.
- **Costo:** baja la CPU.
- **RM / RD:** no aplica.
- **Momentos:** humor seco; el diálogo de un briefing; presentaciones rápidas.
- **Refs:** UPA, «Gerald McBoing-Boing» (1950).
- **Estado:** existe como regla de los Momentos; `film/` la hereda.

### M9 · Multiplano: atravesar capas
- **Cómo:** La cámara avanza y los planos delanteros (hojas, cortinas, lluvia cercana) crecen y se desvanecen al pasar. Cada capa tiene su propio desenfoque y su propia luz.
- **Costo:** el sobre-dibujo de las capas cercanas. Tier bajo.
- **RM / RD:** RM: parallax a ×0,3 y los planos cercanos se apagan antes. RD: no aplica.
- **Momentos:** entrar a un bosque; cruzar entre la gente del bar; acercarse a una ventana.
- **Refs:** «El viejo molino» (1937), filmado con cámara multiplano.
- **Estado:** implementado en `film/camera` (planos con profundidad).

### M10 · Metamorfosis
- **Cómo:** SDF horneados de la forma A y de la forma B: se interpola la distancia, se umbraliza y se interpola el color. Alternativa: morph de vértices entre mallas con el mismo número de puntos. Siempre con preparación → desarrollo → salida (13 §2.2).
- **Costo:** 1 pasada de ≈ 2 lecturas; ~5 ms de SDF por forma.
- **RM / RD:** RM: más lenta, o un fundido de A a B. RD: no aplica.
- **Momentos:** un gato de casa que se vuelve su versión multiversal; la linterna que se vuelve faro.
- **Refs:** Émile Cohl, «Fantasmagorie» (1908).
- **Estado:** propuesto. Es pariente de T4.

### M11 · Tipografía en movimiento
- **Cómo:** Todo el texto se hornea antes del reloj en un atlas por letra; cada letra es un sprite. El texto también puede ser un objeto del set. Fuentes del juego: Anton, Bangers, Bebas Neue, Dela Gothic One, Permanent Marker, Playfair Display, Rubik Glitch, Space Grotesk y UnifrakturMaguntia. Las fuentes se cargan antes de hornear (`document.fonts.load`).
- **Costo:** ~0 por cuadro; 10–40 ms por texto al hornear.
- **RM / RD:** RM: las letras aparecen con fundido, sin rebotes. RD: no aplica.
- **Momentos:** la regla en grande («NADIE ESTÁ A SALVO»); la letra en las películas de canción; las tarjetas de capítulo; el «Continuará».
- **Refs:** los títulos de «Seven: los siete pecados capitales» (1995).
- **Estado:** propuesto, sobre `film/present`.

### M12 · Ráfaga (montaje rápido)
- **Cómo:** 2–6 cuadros por imagen, con imágenes horneadas como RT. Siempre entre dos planos legibles (13 §2.1).
- **Costo:** 0 por cuadro (cambia el sprite); VRAM por cada imagen.
- **RM / RD:** RM: 3–4 imágenes con fundidos. RD: sin destellos entre cortes y no más de 3 saltos fuertes de brillo por segundo (alternar claro y oscuro también cuenta como destello).
- **Momentos:** los recuerdos con Luzterna en un segundo; «toda la Parte I en 3 segundos».
- **Refs:** «El acorazado Potemkin» (1925).
- **Estado:** propuesto.

---

## 5. Gramática de cámara

Todo vive en `film/camera.ts`: una cámara estenopeica sobre planos de parallax. Las cuentas son baratas en CPU (~0,05 ms) y deterministas.

### G1 · Parallax 2.5D (la base)
- **Cómo:** Cada plano está a una profundidad z: `escala = f / (z − z_cam)` y `pos = (p − cam)·escala`. Overscan del 10–15 % para movimientos, holandés y cámara en mano.
- **Costo:** CPU mínima; el sobre-dibujo es igual al número de planos (≤ 6 en tier bajo).
- **RM / RD:** RM: parallax a ×0,3. RD: no aplica.
- **Momentos:** todos; es la base de cada plano.
- **Refs:** la cámara multiplano de los años 30 (M9).
- **Estado:** implementado en `film/camera`.

### G2 · Dolly
- **Cómo:** Se mueve z_cam: lo cercano crece más que lo lejano. El zoom (f) es distinto: escala todo por igual.
- **Costo:** CPU. Tier bajo.
- **RM / RD:** RM: recorrido a ×0,3 o corte a la nueva distancia. RD: no aplica.
- **Momentos:** acercarse a la cara de Canelo cuando entiende algo (la «consecuencia» del ritmo lento).
- **Refs:** la gramática clásica.
- **Estado:** implementado en `film/camera`.

### G3 · Grúa
- **Cómo:** Se mueve y_cam con parallax vertical. Subir revela escala; bajar llega a un detalle.
- **Costo:** CPU y overscan vertical. Tier bajo.
- **RM / RD:** RM: recorrido a ×0,3 o corte. RD: no aplica.
- **Momentos:** abrir desde el cielo hasta la calle (la demo noir); revelar el tamaño del rival.
- **Refs:** «Sed de mal» (1958), por el plano inicial.
- **Estado:** implementado en `film/camera`.

### G4 · Travelling lateral y paneo
- **Cómo:** Travelling: se mueve x_cam, con parallax. Paneo: todos los planos se mueven igual, sin parallax.
- **Costo:** CPU; overscan o fondos tileados. Tier bajo.
- **RM / RD:** RM: velocidad y parallax a ×0,3. RD: no aplica.
- **Momentos:** caminar con Luzterna por la calle; recorrer la tripulación; la Carta de las Cajas.
- **Refs:** la gramática clásica.
- **Estado:** implementado en `film/camera`.

### G5 · Cámara en mano
- **Cómo:** Ruido determinista (2–3 octavas con semilla) en x, y y giro. Amplitud ≤ 6 px y ≤ 0,6°, a 0,5–2 Hz: respira, no tiembla.
- **Costo:** CPU. Tier bajo.
- **RM / RD:** RM: **apagada**. RD: no aplica.
- **Momentos:** la tensión antes de un combate; una persecución; la muerte contada en tiempo real.
- **Refs:** «Niños del hombre» (2006).
- **Estado:** implementado en `film/camera`.

### G6 · Rack focus (cambio de foco)
- **Cómo:** Copias nítida y desenfocada de cada plano (R6), cruzadas según un plano focal animado. El cambio dura 0,4–1,0 s.
- **Costo:** ~0 por cuadro; el doble de VRAM por plano estático.
- **RM / RD:** no aplica (no es un movimiento).
- **Momentos:** **revelar quién está detrás**; pasar de la linterna a la cara de Luzterna; una pista honesta escondida al fondo.
- **Refs:** la gramática clásica.
- **Estado:** implementado en `film/camera`.

### G7 · Ángulo holandés
- **Cómo:** El contenedor del mundo gira 5–20° alrededor del centro, con overscan. Las barras y los subtítulos no giran.
- **Costo:** CPU. Tier bajo.
- **RM / RD:** RM: máximo ~5° y el giro no se anima. RD: no aplica.
- **Momentos:** algo no está bien (el villano, una dimensión que se rompe); una borrachera.
- **Refs:** «El tercer hombre» (1949).
- **Estado:** implementado en `film/camera`.

### G8 · Whip pan
- **Cómo:** Un paneo de 8–12 cuadros. Motion blur direccional en el uber post (8–12 taps a lo largo del vector de la cámara) solo mientras dura.
- **Costo:** +10 lecturas mientras dura el barrido. Tier bajo (es corto).
- **RM / RD:** RM: se cambia por un corte o un fundido. RD: no aplica.
- **Momentos:** comedia; «mientras tanto…»; saltar de un gato a otro en la presentación del multiverso.
- **Refs:** las comedias de acción de Edgar Wright.
- **Estado:** implementado en `film/camera` + `film/post` (motion blur).

### G9 · Plano largo
- **Cómo:** Una sola trayectoria (spline Catmull-Rom con easing) que encadena dolly, grúa y travelling sin cortes. Se puede adelantar. Todo lo que recorre la toma tiene que estar horneado antes del reloj.
- **Costo:** el de los movimientos.
- **RM / RD:** RM: se parte en 3–4 planos fijos con fundidos. RD: no aplica.
- **Momentos:** la calle noir de la demo; seguir a Luzterna hasta que sale de cuadro.
- **Refs:** «La soga» (1948); «Sed de mal» (1958).
- **Estado:** implementado en `film/camera` (la demo noir lo usa).

### G10 · Dolly zoom (vértigo)
- **Cómo:** z_cam y f cambian juntos con `f = s·(z_sujeto − z_cam)`, así que el sujeto no cambia de tamaño. El fondo se estira o se encoge. Pide overscan de ×1,5.
- **Costo:** CPU. Tier bajo.
- **RM / RD:** RM: corte a un plano más cerrado con un cambio de color. RD: no aplica.
- **Momentos:** **el engaño de Canelo** (el jugador cree que va a morir él); entender la regla («nunca dijimos que no podía morir»).
- **Refs:** «Vértigo» (1958); «Tiburón» (1975).
- **Estado:** implementado en `film/camera`.

### G11 · Crash zoom
- **Cómo:** Zoom (f) con easing exponencial en 6–10 cuadros. Líneas de velocidad y punch: los verbos `speed`, `focus` y `punch` de `momentos/anime/fx.ts`. El sujeto se hornea a la escala final: el SVG de MAI se rasteriza a la resolución que pide el plano.
- **Costo:** CPU; VRAM por la textura grande.
- **RM / RD:** RM: corte directo al plano cerrado. RD: sin destello al llegar.
- **Momentos:** un chiste; una cara de sorpresa; un gato del multiverso que aparece de golpe.
- **Refs:** el cine de artes marciales de los años 70.
- **Estado:** el zoom está implementado en `film/camera`. Las líneas existen en los Momentos.

### G12 · Órbita falsa
- **Cómo:** Los planos se desplazan en sentidos opuestos alrededor de un plano pivote, en un arco de ±15°. Los gatos son 3/4 a la izquierda por invariante y no giran, así que la órbita se corta antes o se tapa con un primer plano.
- **Costo:** CPU. Tier bajo.
- **RM / RD:** RM: arco a ×0,3 o plano fijo. RD: no aplica.
- **Momentos:** dos gatos frente a frente antes del combate.
- **Refs:** la «toma de héroe» del cine de acción.
- **Estado:** propuesto.

### G13 · Subjetiva (POV) y «ojos de gato»
- **Cómo:** La cámara a la altura del gato (muy baja), con viñeta suave. Versión «ojos de gato»: bajar los rojos (los gatos distinguen mal el rojo); desenfocar la periferia; subir el contraste en lo que se mueve.
- **Costo:** +1 lectura. Tier bajo.
- **RM / RD:** RM: sin balanceo de cabeza. RD: no aplica.
- **Momentos:** despertar en un lugar nuevo; ver la escena con los ojos de quien está en peligro.
- **Refs:** «La dama del lago» (1947), filmada casi toda en subjetiva.
- **Estado:** propuesto.

### G14 · Plano cenital
- **Cómo:** La vista desde arriba. Las pinturas son de 3/4, así que el cenital sirve para mapas, objetos, sombras y patrones; los gatos aparecen como sombra o con arte cenital hecho a propósito.
- **Costo:** CPU. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** el plan de batalla sobre la Carta de las Cajas; la soledad de un gato pequeño en un patio enorme.
- **Refs:** los musicales de los años 30 («Calle 42», 1933).
- **Estado:** propuesto.

### G15 · Inserto
- **Cómo:** un plano cerrado de un objeto (la linterna, la bufanda de Canelo, una dona), con el SVG horneado a la resolución del plano.
- **Costo:** ~0; VRAM de la textura grande.
- **RM / RD:** no aplica.
- **Momentos:** plantar una pista honesta (la linterna que parpadea); el objeto que después vuelve sin dueño.
- **Refs:** la gramática clásica.
- **Estado:** propuesto (se arma con `film/camera`).

### G16 · Plano y contraplano, y regla de 180°
- **Cómo:** La cámara se queda siempre del mismo lado del eje y cada bando conserva su lado de la pantalla. Los gatos miran a la izquierda, así que el contraplano los voltea (`scale.x = −1`). El espejo puede romper marcas asimétricas: revisar con ARTE. Para cruzar el eje hace falta un plano neutral (de frente o un inserto).
- **Costo:** 0.
- **RM / RD:** no aplica.
- **Momentos:** los diálogos de briefing; la confrontación con el rival; Canelo y Luzterna discutiendo.
- **Refs:** la gramática clásica.
- **Estado:** propuesto (regla de puesta en escena).

### G17 · Plano de situación
- **Cómo:** Un plano abierto del lugar antes de los detalles: el «presentar» del ritmo lento. Dura 2–4 s, con un dolly o una grúa lentos y el título del lugar en la tipografía de la dimensión.
- **Costo:** el del set horneado.
- **RM / RD:** RM: plano fijo. RD: no aplica.
- **Momentos:** la llegada a una dimensión; el arranque de cada presentación de batalla; volver a un lugar después de una pérdida.
- **Refs:** la gramática clásica.
- **Estado:** propuesto (`film/camera` + `film/present`).

---

## 6. Transiciones que cuentan algo

Todas viven en un solo shader de transición (`film/transitions.ts`).
- Recibe A y B en dos RT de pantalla completa **de tamaño fijo**, asignadas una vez al cargar (8 MB cada una), más el progreso p y los parámetros.
- Durante la transición cuesta 1 pasada más el render de B.
- Truco: si A no necesita moverse, se congela en una foto y no se renderiza dos veces.

### T1 · Pasar la página
- **Cómo:** Un cilindro de curvatura: d es la distancia del píxel a la línea de pliegue, que se anima. Más allá del cilindro se ve B. Sobre el cilindro se vuelve a la UV de A por longitud de arco (`θ = asin(d/R)`). El reverso muestra papel con A espejada y tenue. El rizo proyecta una sombra suave sobre B.
- **Costo:** ≈ 3 lecturas. Tier bajo.
- **RM / RD:** RM: la página pasa en 0,6 s sin rebote, o se cambia por un fundido. RD: no aplica.
- **Momentos:** **de Da Vinci al noir en la demo**; un cambio de capítulo; el diario de alguien.
- **Refs:** las aperturas de libro de cuentos del cine animado clásico («Blancanieves y los siete enanos», 1937).
- **Estado:** implementado en `film/transitions`.

### T2 · Iris
- **Cómo:** Una máscara SDF centrada en el sujeto: un círculo o **la silueta de una cabeza de gato**. Radio animado y borde de 2 px.
- **Costo:** 1 lectura. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** el cierre de una película; el «Continuará»; el remate de un chiste.
- **Refs:** el cine mudo (años 1910–1920).
- **Estado:** implementado en `film/transitions`. También existe en `circusMalus/film.ts`.

### T3 · Puerta y gatera
- **Cómo:** B aparece por una abertura de A que crece: dos hojas que se abren con escorzo (`scale.x = cos θ`) o una gatera que se balancea. Al cruzar puede cambiar el estilo.
- **Costo:** ≈ 2 lecturas. Tier bajo.
- **RM / RD:** RM: la puerta se abre sin balanceo y la cámara no la cruza: fundido al otro lado. RD: no aplica.
- **Momentos:** **entrar a una dimensión por su gatera**; salir de casa; volver.
- **Refs:** «El mago de Oz» (1939), donde la puerta pasa del sepia al color.
- **Estado:** la puerta está implementada en `film/transitions`. La gatera es una variante propuesta.

### T4 · El objeto se vuelve escenario
- **Cómo:** Un objeto de A (un tarro, una tele, un cuadro, la luna) tiene un rectángulo. El rectángulo crece hasta llenar la pantalla mientras B, dibujado adentro con una transformación de UV, se vuelve el set. Los bordes coinciden: no hay corte.
- **Costo:** ≈ 2 lecturas. Tier bajo.
- **RM / RD:** RM: el rectángulo se abre sin zoom de cámara. RD: no aplica.
- **Momentos:** un cuadro de Van Gogh que se vuelve el cielo; la Carta que se vuelve una isla.
- **Refs:** el recurso base del Momento Drunck (13 §3.3).
- **Estado:** implementado en `film/transitions` (revelado desde el rect del objeto).

### T5 · Tinta que sangra
- **Cómo:** Un umbral de ruido para el borde de tinta: `smoothstep` de p menos ruido menos la distancia a las semillas. Un anillo oscuro en el frente, porque la tinta se acumula en el borde. Las fibras del papel modulan el avance.
- **Costo:** ≈ 3 lecturas. Tier bajo.
- **RM / RD:** RM: el frente avanza más lento, sin salpicaduras. RD: no aplica.
- **Momentos:** entrar a Da Vinci; una mancha que se extiende como una muerte; un recuerdo que se escribe.
- **Refs:** «El cuento de la princesa Kaguya» (2013); el frente de tinta de WHEN I LOSE.
- **Estado:** implementado en `film/transitions`.

### T6 · Glitch
- **Cómo:** Bloques desplazados por filas con hash. Croma separado. A y B intercalados por bloques durante 0,2–0,4 s.
- **Costo:** ≈ 4 lecturas. Tier bajo.
- **RM / RD:** RM: los bloques se intercambian sin deslizarse. RD: sin bloques blancos ni parpadeo.
- **Momentos:** **la llegada de un gato del multiverso**; la realidad que se rompe.
- **Refs:** «Spider-Man: Un nuevo universo» (2018); `cine/screenFx.ts` y `teOdio/post.ts`.
- **Estado:** implementado en `film/transitions`. También existe en `cine/screenFx.ts`.

### T7 · Mancha de pintura
- **Cómo:** Trazos de pincel horneados como máscaras que barren la pantalla. Detrás del trazo aparece B. En el borde, A se arrastra a lo largo del trazo (LIC de 6 muestras).
- **Costo:** ≈ 8 lecturas. Tier alto, pero dura poco.
- **RM / RD:** RM: menos trazos y más lentos. RD: no aplica.
- **Momentos:** entrar y salir de Van Gogh; una emoción que borra la escena.
- **Refs:** «Loving Vincent» (2017).
- **Estado:** implementado en `film/transitions`.

### T8 · Match cut y match dissolve
- **Cómo:** Se alinea una forma de A con una de B (la luna con la linterna, un ojo con un ojo de buey). Las cámaras de los dos planos se planean para que coincidan. Corte seco o fundido de 6–12 cuadros.
- **Costo:** 2 lecturas. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** **de la luna de Van Gogh a Da Vinci en la demo**; el mismo muelle con y sin Luzterna.
- **Refs:** «2001: Odisea del espacio» (1968); «Lawrence de Arabia» (1962).
- **Estado:** implementado en `film/transitions`.

### T9 · Corte en whip pan
- **Cómo:** whip pan (G8) en A; en el cuadro de más blur se corta a B, que sigue el barrido y frena.
- **Costo:** el del whip.
- **RM / RD:** RM: corte seco. RD: no aplica.
- **Momentos:** «mientras tanto»; comedia; el montaje de los multiversos.
- **Refs:** las comedias de acción.
- **Estado:** implementado en `film/stage.ts` (tipo `whip`: las dos escenas se deslizan y el post pone desenfoque de movimiento; con RM, disolvencia).

### T10 · Fuga de luz
- **Cómo:** 2–3 degradados procedurales ámbar-naranja, nunca rojo saturado, que barren y sobreexponen A mientras aparece B.
- **Costo:** ≈ 2 lecturas. Tier bajo.
- **RM / RD:** RM: no aplica. RD: intensidad ≤ 0,4 y nunca a blanco.
- **Momentos:** entrar a un recuerdo cálido; un video casero de la tripulación.
- **Refs:** el cine casero de 8 mm.
- **Estado:** implementado en `film/transitions` (tipo `lightLeak`, ámbar).

### T11 · Cortinillas con forma
- **Cómo:** el SDF de una forma (línea, reloj, diagonal, estrella, huella de gato) comparado con p, con un borde que puede brillar.
- **Costo:** 1 lectura. Tier bajo.
- **RM / RD:** no aplica.
- **Momentos:** un cambio de capítulo; «mientras tanto…»; comedia.
- **Refs:** «Los siete samuráis» (1954); «La guerra de las galaxias» (1977).
- **Estado:** propuesto.

### T12 · Fundido encadenado y corte
- **Cómo:** `mix(A, B, p)`. Variante por luminancia: lo claro de B aparece primero. Fundido a negro, a color o a blanco (este último pasa por FlashGuard). El corte es p de 0 a 1 en un cuadro, en el tiempo fuerte.
- **Costo:** 2 lecturas. Tier bajo.
- **RM / RD:** RM: **es la transición segura por defecto**. RD: el fundido a blanco se limita con FlashGuard.
- **Momentos:** el paso del tiempo; todo lo que no merece una transición con significado.
- **Refs:** la gramática clásica.
- **Estado:** implementado en `film/transitions` (corte, fundido, disolución).

### T13 · Cortes J y L (sonido)
- **Cómo:** En la partitura, el audio de B empieza antes que la imagen (corte J) o el de A sigue después del corte (corte L), de 0,3 a 1,5 s. No es un shader: es un desfase de las pistas respecto del corte.
- **Costo:** 0.
- **RM / RD:** no aplica.
- **Momentos:** oír la lluvia antes de ver la calle (J); **la voz de Luzterna que sigue sobre el plano siguiente** (L).
- **Refs:** la gramática clásica del montaje de sonido.
- **Estado:** propuesto (partitura de la película).

---

## 7. Top 10 recomendado para las películas de la Parte III

1. **Noir con lluvia (R1 + C1).** Ya está implementado. La linterna azul queda como único color, y es el lenguaje natural de la calle con Luzterna y de lo que viene después de su muerte.
2. **Da Vinci (P2).** Es el formato ideal para las presentaciones antes de batalla: estudia al rival, muestra su regla y se lee en ritmo lento. Ya está implementado y es barato.
3. **Van Gogh (P1).** Lo pidió el dueño. Es para las películas de canción con emoción nocturna (el cielo sobre la isla del faro), cuesta casi nada por cuadro y ya está implementado.
4. **Kit de clima y luz (C1–C8, C12).** Niebla, viento, relámpago seguro, vela y haz de linterna dan realismo a cualquier estilo con un costo bajo, y se reusan en todas las películas.
5. **Cámara 2.5D: dolly zoom, rack focus y plano largo (G10, G6, G9).** El dolly zoom vende el engaño de Canelo, el rack focus planta pistas honestas y el plano largo da peso.
6. **Objeto que se vuelve escenario y gatera (T4, T3).** Es la firma del juego: así se entra a las dimensiones y así cuenta algo el cambio de estilo.
7. **Títulos con recortes y tipografía en movimiento (M6, M11).** Presentan muchos gatos del multiverso rápido y con claridad (nombre, rasgo icónico, regla).
8. **Ukiyo-e (P3).** Para las batallas navales y las travesías. Tiene tradición de gatos (Kuniyoshi), es barato y no repite el sumi-e que ya existe.
9. **Klimt, pan de oro (P10).** Es la cima del apego con Luzterna justo antes del giro, y su contraste con el noir hace que la pérdida pese más.
10. **Linograbado al estilo Posada (P6).** El duelo con tono de Día de Muertos: cercano para el público latinoamericano, legible y barato.

Le siguen papel recortado (P8) para leyendas y reglas, cine mudo (R10) para flashbacks de la Parte I y acuarela (P4) para el color que vuelve.

---

## 8. Matriz de costo vs. impacto

- **Costo bajo:** ≤ 4 lecturas extra o solo sprites, y < 50 ms al cargar.
- **Costo medio:** 5–12 lecturas, una pasada extra, o de 50 a 400 ms / más de 30 MB al cargar.
- **Costo alto:** varias pasadas, retroalimentación (rompe el seek) o más de 12 lecturas en cada cuadro.

**Impacto alto:**

| Costo | Técnicas |
|---|---|
| Bajo | P2 Da Vinci · P3 Ukiyo-e · P6 Posada · P8 Recortado · P10 Klimt · P11 Claroscuro · R1 Noir · C2 Niebla · C3 Viento · C5 Relámpago · C8 Vela · C12 Haz · M6 Títulos · M11 Tipografía · G1 Parallax · G2 Dolly · G6 Rack focus · G9 Plano largo · G10 Dolly zoom · T1 Página · T3 Gatera · T4 Objeto-escenario · T8 Match cut · T13 Cortes J/L |
| Medio | P1 Van Gogh (carga pesada, por cuadro casi gratis) · C1 Lluvia y reflejos · T5 Tinta · T7 Mancha de pintura |
| Alto | P15 Pintura sobre vidrio |

**Impacto medio:**

| Costo | Técnicas |
|---|---|
| Bajo | P5 · P7 · P14 · P16 · P17 · P18 · R2 · R3 · R5 · R8 · R9 · R10 · R12 · C4 · C6 · C9 · C11 · M1 · M2 · M3 · M5 · M7 · M8 · M9 · M10 · M12 · G3 · G4 · G7 · G8 · G11 · G13 · G15 · G16 · G17 · T2 · T6 · T9 · T10 · T11 · T12 |
| Medio | P4 Acuarela · P9 Puntillismo · P12 Turner · P13 Munch · R4 Halación · R6 Profundidad de campo · C7 God rays radiales · C10 Cáusticas · C13 Oleaje |
| Alto | — |

**Impacto bajo:**

| Costo | Técnicas |
|---|---|
| Bajo | R7 Anamórfico · R11 VHS/CRT (ya existe) · G5 Cámara en mano · G12 Órbita falsa · G14 Cenital |
| Medio | M4 Rotoscopia (el costo es de animación) |
| Alto | — (no se recomienda nada aquí) |

Lectura rápida: el bloque de impacto alto y costo bajo es el corazón de la oleada 1. P15 solo vale la pena para una metamorfosis que justifique romper el seek.

---

## 9. Reglas de accesibilidad comunes

- **FlashGuard** (`momentos/flash.ts`): máximo **3 destellos de pantalla completa por segundo** (el umbral de WCAG 2.3.1). Cuentan los relámpagos, los impactos, los fundidos a blanco y los saltos fuertes de brillo de una ráfaga.
- **Nunca rojo saturado en un destello** (`isSaturatedRed`, `safeFlashColor`). Las fugas de luz van en ámbar.
- **Con «Reducir destellos»**:
  - ningún destello de pantalla completa: solo un brillo suave y localizado (≤ `SOFT_FLASH_ALPHA` = 0,25);
  - halación ≤ 0,3;
  - estrellas, chispas, bokeh y luciérnagas sin pulsos rápidos.
- **Con «Reducir movimiento»** (lo que hace hoy el motor, misma línea de tiempo):
  - **transiciones que viajan → disolvencia** (página, iris, puerta, tinta, brochazo, glitch, objeto, match, whip, fuga de luz);
  - **parallax ×0,3** (las profundidades se aplanan); las sacudidas del kit al 30 %;
  - **sin cámara en mano ni whip**; el ángulo holandés queda al 30 %;
  - **hervor apagado** (una sola variante de pinceladas);
  - lluvia al 60 % y sin inclinación por la cámara; partículas al 60 % y sin giro; gotas del lente quietas;
  - los viajes lentos de cámara se conservan. **Regla para quien produce:** un viaje rápido (más de ~800 px/s en pantalla, como volar dentro de la luna) lleva su versión calma en `camRm` (ver `02-api.md` §5).
- **Subtítulos siempre sobre una zona calmada**: dentro de la barra de cine cuando la hay (`film/present`). Si no, sobre un fondo con contraste. Nunca encima de lluvia cercana, glitch o partículas.
- **Nada se cuenta solo con el efecto**: lo que dice un efecto también lo dice una acción o un texto.
- **Respiro**: ningún efecto intenso dura más de ~2 s sin un plano calmo después.
- **Las 0–3 entradas opcionales** nunca dependen de ver un destello ni un movimiento rápido.
- **Prueba obligatoria**: cada película se captura con RM y RD encendidos (harness headless) antes de entregarla.

---

## 10. Trampas técnicas conocidas

1. **Un filtro en un contenedor cuyos límites cambian cada cuadro asigna RenderTextures nuevas.** Un agente midió un tirón de 0,7 s. Solución: `filterArea` fijo, o filtros solo en hosts de pantalla completa de tamaño constante. Nunca se redimensiona una RT por cuadro.
2. **Pixi vuelve render group para siempre a un contenedor que pasas a `renderer.render()`.** Para hornear, se envuelve el objeto en un contenedor desechable, se renderiza el envoltorio y se destruye.
3. **Compilación de shaders y subida de texturas en el primer uso.** Todo se calienta en la carga: cada filtro, cada variante de shader (cada combinación de `#define` es otro programa) y cada textura se dibuja una vez fuera de pantalla.
4. **Teselado de Graphics en el primer render** y después de cada `clear()` con redibujo. Los Graphics complejos se hornean a textura o se renderizan una vez en la carga, compartiendo `GraphicsContext`.
5. **Crear un `Text` en plena función cuesta 10–40 ms.** Todo el texto se hornea antes del reloj, y las fuentes se cargan antes de hornear; si no, se hornea la fuente de reemplazo.
6. **Alfa premultiplicado.** Los filtros reciben el color premultiplicado: hay que dividir por alfa antes del grade y volver a multiplicar, o aparecen bordes oscuros.
7. **Padding de filtros.** Un blur o un desplazamiento sin `padding` se corta en el borde del contenedor.
8. **Precisión.** `sin(t·k)` con t grande pierde precisión en mediump. El tiempo se envuelve con `mod` y se usa highp en el fragment shader cuando se puede.
9. **La retroalimentación rompe el seek** (P15 y cualquier simulación que acumula). Hace falta un pre-roll al saltar, o mejor una fórmula cerrada en t.
10. **Fugas.** Cada RT horneada se destruye al cerrar la película (`destroy(true)`) y el conteo de texturas vuelve al valor de antes.
11. **Límites.** Nada pasa de 4096 px por lado; los atlas de trazos y los SVG grandes van en 2048.
12. **Submuestreo.** Una textura horneada que se dibuja a menos del 50 % de su tamaño titila. Se hornea a la escala de uso o con mipmaps.
13. **Doble render en las transiciones.** Tener A y B vivos duplica el costo: A se congela en una foto cuando no se mueve.
14. **`new Filter({ resolution: undefined })` apaga el filtro sin avisar** (medido en esta ronda). Pasar `undefined` pisa el valor por defecto `'inherit'`: el sistema de filtros calcula límites NaN y se salta el filtro, y el contenedor se dibuja sin él. `film/gl.ts` (`glFilter`) solo pasa `resolution` cuando tiene valor.
15. **El post del kit compila en el primer destello** si la película usa `ownGrade` (medido: un tirón de 2,1 s en el primer relámpago). `film/stage.ts` lo compila en la carga con un gemelo (`new PostFilter()` comparte el programa en caché).
16. **Un `Filter` en un contenedor que se mueve con la cámara**: dale un `filterArea` local enorme (por ejemplo ±4000 px). Después de la transformación, el recorte al viewport lo deja siempre del tamaño de la pantalla, así que la textura del pool nunca cambia de tamaño.

