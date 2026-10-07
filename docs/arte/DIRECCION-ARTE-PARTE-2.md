# Dirección de arte · Parte 2

Guía para generar el arte nuevo de NO ONE LIKE CATS: los **22 gatos que hoy son copias pintadas** de otro, **6 elementos nuevos** y **2 rarezas nuevas** (Heroico y Divino). Cada gato es una carta única: su dibujo, su poder y su historia no se repiten, y el enemigo que lo tenga hace exactamente lo mismo que tú.

Flujo: tú generas el PNG → lo dejas en la carpeta de su lote con el nombre exacto → yo lo paso a SVG con MAI (sin raster en el repo), le hago el rig (ojos, orejas, cabeza, cola, flotantes), lo animo y lo meto al juego.

## 1. Entrega

| | |
|---|---|
| Formato | **PNG con transparencia** (RGBA). Nada de JPG. |
| Tamaño | Cuadrado, **1024×1024** o más grande. |
| Encuadre | El gato completo, centrado, ocupando ~85% del alto. Patas a ~5% del borde de abajo. Nada cortado. |
| Fondo | Transparente. Sin piso, sin sombra proyectada, sin escenario, sin marco. |
| Texto | Ninguno: ni firma, ni marca de agua, ni letras en la ropa. |
| Nombre | `<id>.png` exactamente como dice cada ficha (ej. `c_chispa.png`). |
| Carpeta | `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/<lote>/` (ya están creadas). |

### Para que el gato se pueda animar (rig)
- **Los dos ojos visibles y abiertos**, sin pelo ni sombrero tapándolos. Así puede parpadear.
- **Orejas separadas** del fondo y del sombrero.
- **La cola visible**, saliendo del cuerpo hacia un lado, **sin tapar la cara**. Es lo que más vida da.
- **Objetos flotantes con aire alrededor** (no pegados al cuerpo): así flotan por separado.
- Sin desenfoque de movimiento ni brillos que tapen la silueta.
- Vista 3/4, mirando un poco hacia la izquierda de la imagen (el juego lo voltea cuando hace falta).

### Estilo base (va en TODOS los prompts)
Ilustración de colección estilo anime pintado, igual que los 32 gatos actuales (usa `canelo_cozy_cat`, `candy_alchemist_cat` y `steampunk_clockwork_cat` como referencia de estilo si tu herramienta acepta imágenes): ojos grandes y brillantes, pelo suave con detalle, sombreado cel limpio con bordes nítidos, colores saturados, vestuario y accesorios temáticos con mucho detalle.

```
STYLE: full-body collectible character art of a cute cat, real cat anatomy with slightly chibi proportions,
3/4 view facing slightly left, big glossy expressive eyes with sharp highlights, both eyes open and visible,
detailed soft fur, painterly anime cel shading with clean crisp edges, rich saturated colors,
intricate themed costume and props, tail clearly visible and curving away from the face,
centered, whole body inside the frame with small margin, isolated on a transparent background,
gacha game key art, high detail
NEGATIVE: background, scenery, floor, ground shadow, cast shadow, text, letters, watermark, signature,
logo, frame, border, cropped, multiple cats, human, extra limbs, motion blur, blurry
```

Cada ficha trae un **Prompt** que se pega después del bloque STYLE.

### Rarezas y cómo se tienen que sentir

| Rareza | Marco en el juego | Qué pide el dibujo |
|---|---|---|
| Común | papel | Simple, tierno, un solo accesorio protagonista. |
| Raro | tinta azul | Dos ideas combinadas, más detalle. |
| Épico | rosa neón | Pose con actitud, efectos del elemento alrededor. |
| Legendario | dorado + foil | Majestuoso, silueta grande, accesorio legendario. |
| Mítico | holográfico | Casi un dios; materiales imposibles. |
| **Heroico** (nuevo) | carmesí + laureles | Guerreros del **Podio**. Pose de pelea, arma o insignia de campeón. |
| **Divino** (nuevo) | nácar + halo | Los "rotos". Se ven como el fin del mundo en forma de gato. |

---

## 2. Elementos nuevos

| Elemento | Verbo | Dimensión de estilo | Paleta | Qué hace en combate (idea) |
|---|---|---|---|---|
| **Hielo** | Congelar | AURORA (ukiyo-e glacial + aurora boreal) | `#EAF6FF` `#9FE8FF` `#4FA3D9` `#1F2B4A` + aurora `#7CFFC4` `#B59CFF` | Congela módulos: no disparan 1 turno; lo congelado se rompe con fuego. |
| **Luz** | Cegar | VITRAL (vidrio de catedral + art déco dorado) | `#FFF8E1` `#FFD77A` `#B89558` `#FFFFFF` + vitral `#E8879A` `#7FD8FF` | Rayo que atraviesa en línea recta y ciega la vista previa del rival. |
| **Sombra** | Acechar | TEATRO DE SOMBRAS (kage-e, tinta, acento rojo) | `#0D110F` `#2A2433` `#EAE1D3` + `#C8102E` | Disparo invisible hasta impactar; golpea gatos por la espalda. |
| **Sonido** | Retumbar | PÓSTER DE CONCIERTO (risografía, city-pop) | `#FF2E88` `#FFD400` `#2EC4E6` `#231626` | Ondas que atraviesan paredes y aturden a todos los gatos tocados. |
| **Tiempo** | Rebobinar | DAGUERROTIPO (sepia, reloj de arena, astrolabio) | `#6B4F2A` `#D9C29A` `#E0B77A` `#1C3A51` | Rebobina: repara tus celdas o le quita un turno al rival. |
| **Vacío** | Devorar | NOIR INVERTIDO + estática de TV | `#0D110F` `#231626` `#FF2E88` `#FFFFFF` | Borra celdas para siempre y se come escudos (el que ya aparece en la historia). |

Nota: **Tiempo no es steampunk** (eso ya es Imán). Tiempo es sepia, arena, relojes de bolsillo antiguos, astrolabios, fotos viejas.

---

## 3. Lote A · Rediseños (22) → `lote-a-rediseños/`

Estos gatos ya existen en el juego con nombre, poder e historia, pero hoy son el dibujo de otro con otro color. Necesitan **un dibujo propio**. Mantienen nombre, elemento y rol.

### c_chispa — Chispa · Común · Fuego · Artillero
*La Sonrisa Peligrosa.* Hoy es Solar con otro color.
- **Concepto:** gatita traviesa que juega con bengalas; siempre a punto de quemar algo.
- **Se ve así:** gatita calicó naranja, sonrisa enorme con un colmillo, una **bengala encendida** en el hocico como si fuera un palito, punta de la cola como **cerillo encendido**, chispas sueltas flotando.
- **Paleta:** naranja `#FF6A1A`, crema, amarillo chispa `#FFC94A`.
- **Prompt:** `tiny mischievous orange calico kitten holding a lit sparkler in her mouth, huge cheeky grin with one fang, tail tip shaped like a burning matchstick, small sparks floating around`

### c_burbujas — Burbujas · Común · Agua · Soporte
*La Efervescente.* Hoy es Gelatino con otro color.
- **Concepto:** gata de refresco con gas; todo en ella hace *fizz*.
- **Se ve así:** gata redondita aqua pastel, pelo con **burbujitas de soda** atrapadas, **collar de corcholata**, sostiene una **varita de burbujas**; burbujas flotando separadas del cuerpo.
- **Paleta:** aqua `#7FD8FF`, menta `#A7E8D7`, blanco.
- **Prompt:** `round chubby pastel aqua cat whose fur has tiny soda fizz bubbles trapped inside, bottle-cap collar, holding a bubble wand, soap bubbles floating separately around her`

### c_guijarro — Guijarro · Común · Tierra · Demoledor
*La Cría de Piedra.* Hoy es Gea con otro color.
- **Concepto:** cría que acaba de salir de un huevo de piedra.
- **Se ve así:** gatito gris con **manchas de piedra de río**, la mitad de un **cascarón de roca** como casco, patas grandes y torpes, piedritas flotando.
- **Paleta:** gris piedra, arena `#E0B77A`, musgo pequeño.
- **Prompt:** `small grey kitten with smooth river-stone spots, wearing half of a cracked stone eggshell as a helmet, oversized clumsy paws, a few pebbles floating nearby`

### c_voltio — Voltio · Común · Tormenta · Francotirador
*El Cable Pelado.* Hoy es Raijin con otro color.
- **Concepto:** gato callejero electrocutado por gusto.
- **Se ve así:** gato flaco con el **pelo erizado por estática**, **cola de cable pelado** con chispa en la punta, **googles** de soldador en la frente, una pila amarrada a la espalda.
- **Paleta:** amarillo `#FFD400`, negro, cian `#00E5FF`.
- **Prompt:** `scrappy skinny alley cat with static-frizzed fur standing on end, tail made of a frayed electric cable sparking at the tip, welding goggles on forehead, small battery strapped to its back`

### c_cometin — Cometín · Común · Cósmico · Artillero
*El Visitante Chiquito.* Hoy es Nebulosa con otro color.
- **Concepto:** bebé alien que acaba de aterrizar dentro de un meteorito.
- **Se ve así:** gatito lila con **dos antenitas**, sentado dentro de **medio meteorito humeante** como cuna, cola que deja **estela de estrellas**.
- **Paleta:** lila `#8A5CFF`, rosa `#FF2E88`, negro espacial.
- **Prompt:** `tiny lilac alien kitten with two little antennae, sitting inside half of a smoking cracked meteorite like a cradle, tail leaving a trail of tiny stars`

### c_lunita — Lunita · Común · Cósmico · Francotirador
*La del Lado Oscuro.* Hoy es Singularidad con otro color.
- **Concepto:** astrónoma tímida; apunta con su telescopio.
- **Se ve así:** gata gris perla con **media cara oscura** (como fase lunar), marca de **luna creciente** en la frente, **telescopio de latón** al hombro, lunitas flotando.
- **Paleta:** gris perla, azul noche `#1C3A51`, plata.
- **Prompt:** `shy pearl-grey cat with half of her face in dark shadow like a moon phase, crescent moon mark on forehead, small brass telescope on her shoulder, tiny moons floating around`

### r_neblino — Neblino · Raro · Fuego/Agua · Controlador
*El Vaporcito.* Hoy es Nimbo con otro color.
- **Concepto:** gato que vive en una tetera y es medio vapor.
- **Se ve así:** gato blanco cuya **mitad de atrás se deshace en vapor**, sale de una **tetera** de porcelana, mejillas rojas por el calor.
- **Paleta:** blanco, rosa vapor, azul `#3569A3`.
- **Prompt:** `fluffy white cat climbing out of a porcelain teapot, the back half of its body dissolving into soft steam swirls, rosy warm cheeks`

### r_pimenton → se queda (es el dibujo original de `arce_autumn_cat`).

### r_magmito — Magmito · Raro · Fuego/Tierra · Demoledor
*El Hijo de la Fragua.* Hoy es Ignis con otro color.
- **Concepto:** aprendiz de herrero; todavía no domina el fuego.
- **Se ve así:** gatito gris ceniza con **manchas de lava enfriada**, **mandil de cuero**, **martillo de herrero** casi más grande que él, chispas.
- **Paleta:** gris ceniza, naranja brasa, cuero café.
- **Prompt:** `small ash-grey blacksmith apprentice kitten with cooled lava patches on its fur, leather apron, holding a blacksmith hammer almost bigger than itself, sparks around`

### r_fanguito — Fanguito · Raro · Agua/Tierra · Tanque
*El Charco con Patas.* Hoy es Terrón con otro color.
- **Concepto:** feliz de revolcarse en el lodo.
- **Se ve así:** gato gordito café con **lodo escurriendo**, **botas de lluvia amarillas**, una **ranita** en la cabeza, salpicaduras de lodo flotando.
- **Paleta:** café lodo, amarillo bota, verde rana.
- **Prompt:** `chubby happy brown cat dripping with mud, wearing yellow rain boots, a little frog sitting on its head, mud splashes floating around`

### r_raizvieja — Raíz Vieja · Raro · Naturaleza/Tierra · Invocador
*La Abuela del Bosque.* Hoy es Silvana con otro color.
- **Concepto:** abuela sabia; el bosque le crece encima.
- **Se ve así:** gata anciana con **pelo de corteza**, **lentes redondos**, **chal tejido de musgo**, **bastón de rama**, hongos pequeños en el lomo.
- **Paleta:** corteza, musgo `#5FBF4A`, crema.
- **Prompt:** `wise elderly grandma cat with fur textured like tree bark, round spectacles, knitted moss shawl, twisted branch cane, tiny mushrooms growing on her back`

### r_plasmin — Plasmín · Raro · Fuego/Tormenta · Francotirador
*El Enchufe Caliente.* Hoy es Raijin con otro color.
- **Concepto:** lámpara de plasma con patas.
- **Se ve así:** gato con una **esfera de plasma** en el pecho, mechones de pelo como **rayos magenta-naranja**, **cola con enchufe**.
- **Paleta:** magenta `#FF2E88`, naranja `#FF6A1A`, negro.
- **Prompt:** `cat with a glowing plasma-ball lamp embedded in its chest, fur tufts shaped like magenta and orange plasma arcs, tail ending in an electric plug`

### r_arcanito — Arcanito · Raro · Fuego/Magia · Asediador
*El Farolito Rabioso.* Hoy es Linterna Espíritu con otro color.
- **Concepto:** gatito enojado que vive dentro de un farol de papel con runas.
- **Se ve así:** gatito con **ojos de llama**, asomado desde un **farol de papel rojo** con **runas doradas**, ceño fruncido, chispas violeta.
- **Paleta:** rojo farol, violeta `#8F6B93`, dorado `#B89558`.
- **Prompt:** `grumpy little cat with flame eyes peeking out of a red paper lantern covered in golden runes, furrowed brow, violet sparks`

### r_mareaenc — Marea Encantada · Raro · Agua/Magia · Controlador
*La Sirena de la Biblioteca.* Hoy es Abisa con otro color.
- **Concepto:** bibliotecaria sirena; los libros nadan como peces.
- **Se ve así:** gata con **cola de sirena** turquesa, **lentes**, sostiene un libro abierto; **libros flotando** como peces alrededor.
- **Paleta:** turquesa, azul `#204A7A`, dorado páginas.
- **Prompt:** `mermaid-tailed cat librarian with turquoise scales, reading glasses, holding an open book, several books floating around her like fish`

### r_astral — Astral · Raro · Magia/Cósmico · Artillero
*La Viajera del Tarot.* Hoy es Nebulosa con otro color.
- **Concepto:** lectora de tarot que dispara cartas.
- **Se ve así:** gata con **capa de constelaciones**, **cartas de tarot flotando** en abanico, tercer ojo dorado.
- **Paleta:** violeta `#5C3D5B`, dorado `#B89558`, azul noche.
- **Prompt:** `mystic fortune-teller cat with a cloak patterned with constellations, tarot cards floating in a fan around her, golden third-eye mark`

### e_vaporronin — Vapor Ronin · Épico · Fuego/Agua · Francotirador
*El que Vuelve.* Hoy es Nenúfar con otro color.
- **Concepto:** samurái errante envuelto en vapor.
- **Se ve así:** gato con **sombrero de paja**, **cicatriz** sobre un ojo (el ojo abierto), **katana** envainada, kimono gastado, **vapor** saliendo en espirales.
- **Paleta:** índigo, rojo `#C8102E`, vapor blanco.
- **Prompt:** `wandering ronin samurai cat with a straw hat, scar across one eye (eye still open), sheathed katana, worn indigo kimono, swirls of steam around him`

### e_infernal — Canelo Infernal · Épico · Fuego/Tierra · Demoledor
*El Pirómano.* Hoy es Canelo con otro color.
- **Concepto:** el hermano malo de Canelo: punk y obsidiana.
- **Se ve así:** gato de **pelo de obsidiana con grietas de lava**, **cuernitos**, la **bufanda de Canelo pero en llamas**, chamarra de cuero.
- **Paleta:** negro obsidiana, lava `#FF6A1A`, rojo `#4E0000`.
- **Prompt:** `punk cat with obsidian-black fur cracked with glowing lava veins, small horns, a knitted scarf that is on fire, leather jacket`

### e_golem — Gólem Musgoso · Épico · Naturaleza/Tierra · Tanque
*La Montaña que Respira.* Hoy es Gea con otro color.
- **Concepto:** una colina con forma de gato.
- **Se ve así:** gato enorme de **roca cubierta de musgo**, un **bonsái** en el lomo, flores en las patas, ojos tranquilos.
- **Paleta:** gris roca, musgo `#5FBF4A`, flores rosas.
- **Prompt:** `huge calm cat made of moss-covered boulders, a bonsai tree growing on its back, small flowers on its paws, gentle eyes`

### e_rencor — Rencor · Épico · Fuego/Tormenta · Demoledor
*El Gato Vengativo.* Hoy es Pimentón con otro color.
- **Concepto:** "Wrath of the Nine Lives": cada vida perdida lo hace más peligroso.
- **Se ve así:** gato callejero rojo oscuro con **oreja rota**, **nueve colas fantasma** detrás, **grietas de rayo** en el pelo, ojos brillando de rabia, cadenas rotas.
- **Paleta:** rojo sangre `#C8102E`, negro, amarillo rayo `#FFD400`.
- **Prompt:** `vengeful dark-red alley cat with a torn ear, nine ghostly translucent tails fanning behind it, lightning-crack patterns in its fur, glowing furious eyes, broken chains`

### e_galaxia — Galaxia · Épico · Agua/Cósmico · Controlador
*La Medusa Sideral.* Hoy es Gelatino con otro color.
- **Concepto:** medusa-gato con una nebulosa adentro.
- **Se ve así:** gata translúcida con una **campana de medusa** como capucha llena de **nebulosa**, **tentáculos con estrellas**.
- **Paleta:** rosa `#FF2E88`, violeta, cian `#00E5FF`.
- **Prompt:** `translucent cat wearing a jellyfish bell as a hood filled with a swirling nebula, flowing tentacles dotted with stars`

### e_meteoro — Meteoro · Épico · Tierra/Cósmico · Demoledor
*La Lluvia Real.* Hoy es Astra Prima con otro color.
- **Concepto:** realeza que llega cayendo del cielo.
- **Se ve así:** gata con **armadura de roca de meteorito**, **corona de cometa** humeante, pedruscos ardientes flotando.
- **Paleta:** roca oscura, naranja impacto, violeta.
- **Prompt:** `regal cat in armor made of meteorite rock, a crown of a burning comet, glowing hot rock fragments floating around`

### e_supernova — Supernova · Épico · Tormenta/Cósmico · Demoledor
*La de Una Sola Bala.* Hoy es Solar con otro color.
- **Concepto:** pistolera del espacio; dispara una estrella.
- **Se ve así:** gata con **sombrero vaquero**, **revólver** con una **estrella** en el cañón, **capa** que parece una explosión estelar.
- **Paleta:** blanco estrella, cian `#00E5FF`, amarillo.
- **Prompt:** `space gunslinger cat with a cowboy hat, holding a revolver with a tiny star glowing in the barrel, cape shaped like an exploding star`

### s_eclipse — Eclipse · Legendario · Fuego/Cósmico · Francotirador
*La que Apaga el Sol.* Hoy es Marejada con otro color.
- **Concepto:** el eclipse solar hecho gata.
- **Se ve así:** gata negra con un **disco negro** detrás de la cabeza y la **corona solar dorada** saliendo alrededor, ojos dorados.
- **Paleta:** negro, oro `#FFD77A`, blanco corona.
- **Prompt:** `elegant black cat with a black solar-eclipse disc behind her head and a golden solar corona flaring around it, golden eyes`

### Corrección sin arte nuevo
- **Abisa** y **Velo Noctis** tienen los dibujos cruzados (`deepsea_sprite_cat` es el gato de antifaz y `masquerade_phantom_cat` es el pez abisal). Lo arreglo en el código.
- Se quedan con su dibujo original: Canelo, Gelatino, Terrón, Nimbo, Linterna Espíritu, Pimentón, Nenúfar, Marejada, Solar, Nebulosa, Ignis, Gea, Silvana, Raijin, Singularidad, Astra Prima, Abisa.

---

## 4. Lote B · Elementos nuevos (24) → `lote-b-elementos-nuevos/`

4 gatos por elemento: Común, Raro, Épico y Legendario.

### Hielo

#### c_copito — Copito · Común · Hielo · Artillero
- Gatito bola de nieve con **guantes de hielo** y un **gorro de pompón**. Copos flotando.
- **Prompt:** `round snowball kitten with icy mittens and a pom-pom beanie, snowflakes floating around`

#### r_escarcha — Escarcha · Raro · Hielo · Francotirador
- Gata elegante con **bigotes de carámbano**, **bufanda** que se congela, ojos azul hielo.
- **Prompt:** `elegant cat with icicle whiskers, a long scarf freezing into ice at the ends, pale ice-blue eyes, frost patterns on fur`

#### e_tempano — Témpano · Épico · Hielo · Tanque
- Gato enorme y peludo con **armadura de placas de hielo**, aliento de vaho.
- **Prompt:** `huge fluffy cat wearing armor made of thick ice plates, visible frosty breath, sturdy stance`

#### l_boreas — Bóreas · Legendario · Hielo · Controlador
- Gata majestuosa cuya **melena y cola son cortinas de aurora boreal**, **corona de hielo**.
- **Prompt:** `majestic cat whose mane and long tail are flowing curtains of aurora borealis light, crown of ice crystals, regal posture`

### Luz

#### c_destello — Destello · Común · Luz · Soporte
- Gatito brillante con **colita de luciérnaga** que se enciende.
- **Prompt:** `small glowing kitten with a firefly-like luminous tail tip, soft light particles floating around`

#### r_vitral — Vitral · Raro · Luz · Artillero
- Gato con **manchas de vidrio de catedral** de colores en el pelo y contornos de plomo dorado.
- **Prompt:** `cat whose fur has stained-glass window patches in many colors outlined with gold lead lines, light shining through them`

#### e_faro — Faro · Épico · Luz · Francotirador
- Gato **guardián de faro**: impermeable amarillo, **linterna gigante** que lanza un haz.
- **Prompt:** `lighthouse keeper cat in a yellow raincoat, holding a giant lantern projecting a strong beam of light`

#### l_aurea — Áurea · Legendario · Luz · Demoledor
- Gata **santa art déco**: **halo dorado geométrico**, alas de luz, armadura blanca y oro.
- **Prompt:** `radiant saintly cat with a geometric art deco golden halo, wings made of light, white and gold ornate armor`

### Sombra

#### c_sombrita — Sombrita · Común · Sombra · Asediador
- Gatito que **se despegó de su propia sombra**: la sombra lo sigue con ojitos.
- **Prompt:** `small kitten whose own shadow has peeled off the ground and follows it with two little glowing eyes`

#### r_kage — Kage · Raro · Sombra · Francotirador
- **Gato ninja** con **bufanda de sombra** que se deshace en humo negro.
- **Prompt:** `ninja cat in dark garb with a long shadow scarf dissolving into black smoke, red accent on the eyes`

#### e_titiritera — Titiritera · Épica · Sombra · Invocador
- Gata **titiritera** con hilos en los dedos, **marionetas de sombra** flotando.
- **Prompt:** `puppeteer cat with strings on her paws controlling floating shadow-puppet silhouettes, theater style`

#### l_medianoche — Medianoche · Legendario · Sombra · Controlador
- **Rey de las sombras**: capa infinita, **corona hecha de ojos** que brillan en la oscuridad.
- **Prompt:** `shadow king cat with an endless black cape, a crown made of many glowing eyes in darkness, red and black palette`

### Sonido

#### c_tamborin — Tamborín · Común · Sonido · Artillero
- Gatito con **tamborcito** colgado y baquetas.
- **Prompt:** `cheerful kitten with a small marching drum strapped on, holding drumsticks, music notes floating`

#### r_djbigotes — DJ Bigotes · Raro · Sonido · Controlador
- Gato **DJ**: audífonos enormes, tornamesa flotante, lentes de sol.
- **Prompt:** `cool DJ cat with huge headphones and sunglasses, a floating turntable with a vinyl record`

#### e_diva — Diva · Épica · Sonido · Demoledor
- **Diva pop** con **micrófono de pedestal**, vestido de lentejuelas, **ondas de sonido** visibles.
- **Prompt:** `pop diva cat with a sequined dress and a vintage microphone stand, visible circular sound-wave rings around her`

#### l_headliner — Headliner · Legendario · Sonido · Artillero
- **Estrella de rock**: guitarra eléctrica, chamarra con estoperoles, **muro de bocinas** detrás.
- **Prompt:** `legendary rockstar cat with an electric guitar, studded leather jacket, a wall of amplifiers floating behind`

### Tiempo

#### c_tic — Tic · Común · Tiempo · Soporte
- Gatito con un **reloj de bolsillo** enorme colgado del cuello.
- **Prompt:** `kitten wearing an oversized antique pocket watch around its neck, sepia tones`

#### r_arenita — Arenita · Raro · Tiempo · Controlador
- Gata hecha de **arena de reloj** que se escurre de su cola a un **reloj de arena** flotante.
- **Prompt:** `cat made of golden hourglass sand, sand pouring from her tail into a floating hourglass`

#### e_pendulo — Péndulo · Épico · Tiempo · Tanque
- Gato **reloj de pie**: carátula en el pecho y **cola de péndulo** dorada.
- **Prompt:** `cat shaped like a grandfather clock with a clock face on its chest and a golden pendulum tail`

#### l_cronos — Cronos · Legendario · Tiempo · Invocador
- **Anciano del tiempo**: túnica, **halo de carátula de reloj** y un **astrolabio** flotando.
- **Prompt:** `ancient wise cat in robes with a halo made of a clock face, a floating brass astrolabe, sepia and midnight blue`

### Vacío (llega con la historia del Capítulo 2)

#### c_hueco — Hueco · Común · Vacío · Asediador
- Gatito con un **hueco redondo atravesándole el cuerpo**: adentro se ve negro con estrellas.
- **Prompt:** `curious kitten with a perfectly round hole through its body showing a black starry void inside`

#### r_ecomudo — Eco Mudo · Raro · Vacío · Controlador
- Gato que es **solo contorno blanco**; adentro, vacío y estática.
- **Prompt:** `cat drawn only as a white outline with an empty black interior filled with TV static noise`

#### e_devoradora — Devoradora · Épica · Vacío · Demoledor
- Gata con una **boca-portal** violeta que se traga la luz.
- **Prompt:** `menacing cat with a swirling violet portal for a mouth swallowing light, black fur with magenta glitches`

#### l_nadie — Nadie · Legendario · Vacío · Francotirador
- **El gato que nadie quiere** (el del título del juego): silueta alta de **estática de TV**, **un solo ojo blanco**.
- **Prompt:** `tall silhouette cat made of TV static noise with a single white glowing eye, eerie and elegant`

---

## 5. Lote C · Heroicos y Divinos (8) → `lote-c-heroicos-y-divinos/`

### Heroicos (premios del Podio)

| id | Nombre | Elemento | Idea | Prompt |
|---|---|---|---|---|
| `h_zarpa` | Capitana Zarpa | Fuego | Espadachina pirata; **un espadazo a todos los gatos**. | `heroic pirate swordswoman cat with a flaming cutlass, tricorn hat, red coat, battle pose` |
| `h_granbigote` | Gran Bigote | Tierra | Luchador de sumo de piedra. | `heroic sumo wrestler cat with stone-textured body, champion belt, powerful stance` |
| `h_valquiria` | Valquiria | Tormenta | Guerrera alada con lanza de rayo. | `heroic winged valkyrie cat with a lightning spear and winged helmet` |
| `h_nekomante` | Nekomante | Magia | Hechicero con grimorio que se abre solo. | `heroic sorcerer cat with a floating open grimoire and glowing runes circling` |

### Divinos (los "rotos")

| id | Nombre | Elemento | Lo que hace | Prompt |
|---|---|---|---|---|
| `d_horizonte` | Horizonte de Eventos | Vacío/Cósmico | **Crea un agujero negro** a mitad de la batalla. | `divine cosmic cat with a black hole swirling behind it bending light, accretion disk halo` |
| `d_solcaido` | Sol Caído | Luz/Fuego | **Hace caer el sol** sobre el barco enemigo. | `divine cat holding a small blazing sun above its head, solar flares, golden radiant` |
| `d_milvidas` | Mil Vidas | Sombra | Mil cortes de sombra: **le pega a todos tus gatos**. | `divine shadow samurai cat surrounded by a thousand afterimages of itself, black katana` |
| `d_bigbang` | Big Bang | Sonido/Cósmico | **Explota la mitad del barco** de golpe. | `divine cat at the center of a cosmic explosion, shockwave rings and stardust` |

---

## 6. Después de que me los pases

1. MAI SVG los vectoriza (`high-color-preserved`) y genera la versión ligera.
2. Les hago el rig y reviso que parpadeen, muevan orejas y cola.
3. Les pongo poder, ficha de Catdex, historia y forma de conseguirlos.
4. Los PNG se quedan fuera del repo; al juego solo entra el SVG.

Si un dibujo no sirve para animarse (cola tapando la cara, ojos cerrados, cosas pegadas), te digo cuál y por qué para regenerarlo.
