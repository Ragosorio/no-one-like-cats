# 01 — Inventario de gatos (base de arte para NO ONE LIKE CATS)

Fuente: repo privado `Ragosorio/My-Beautiful-Dark-Twisted-Life` (rama `main`), carpeta
`apps/educatione/public/educatione/cats`. Se descargó en modo solo lectura (sin commits ni push).
Fecha del inventario: 2026-10-03.

- **32 gatos**. Cada uno tiene 1 SVG animado y 1 miniatura WebP.
- Metadata oficial encontrada en el repo: `scripts/educatione_cat_manifest.json` es la fuente de verdad
  (nombre, rareza, poderes e historia). `src/domain/game/cats/catalog.ts` es un archivo generado que
  añade el sello de invocación (motivo, partícula y 3 colores) y la condición de desbloqueo. Copias en
  `assets/cats-source/_meta/`.
- Vista rápida de los 32: `assets/cats-source/png/_contact_sheet.png`.

---

## 0. Tres hallazgos que cambian el plan

1. **Los SVG no son vectoriales.** Cada SVG es un *envoltorio animado* (sombra, halo, partículas y
   brillo hechos con CSS y vectores sencillos) alrededor de **una sola imagen raster WebP de 700×700
   px incrustada en base64**. El gato es un bitmap plano: no hay paths, ids ni grupos para ojos,
   orejas o cola. No se puede animar por partes ni recolorear "por paths". Ver §3.
2. **Arte intercambiado entre dos gatos.** `deepsea_sprite_cat.svg` (Abyss Lumi) contiene el arte del
   gato **de la mascarada**: negro, con antifaz y vestido de encaje morado. `masquerade_phantom_cat.svg`
   (Velo Noctis) contiene el gato **abisal**: pez linterna, conchas y puntos bioluminiscentes. Los
   colores del envoltorio sí corresponden a cada nombre (morado `#8c2bff` en masquerade, azul
   `#7cb0ff` en deepsea), así que lo que se cambió fue solo el raster. Las miniaturas tienen el mismo
   error. Educatione tiene este bug en producción. En el juego hay que emparejar cada arte con su nombre
   correcto. Las fichas de abajo describen el arte que contiene **realmente** cada archivo.
3. **Los originales en alta resolución no están en el repo.** `scripts/build-assets.mjs` dice que el
   arte fuente era PNG de 1254 px con alfa (~2 MB cada uno, ~56 MB en total) en
   `~/Desktop/educatione_animated_cat_svgs_all_32`, una carpeta que ya no existe en esta Mac. El repo
   solo guarda la versión reducida a 700 px (WebP con calidad 82). Para las *Battle Forms* y las
   pantallas grandes conviene recuperar esos originales si el usuario los tiene en otro lado.

Extra: la gata guía **Luzterna** tiene una segunda ilustración (`public/educatione/guides/luzterna.webp`,
610×640). Es un diseño **distinto** de `lantern_spirit_cat`: gata bruja tuxedo con sombrero y túnica
morados y una linterna dorada, frente a la gata fantasma azul translúcida. Se copió a
`assets/cats-source/_extra/guides/luzterna.webp` como referencia.

---

## 1. Estilo visual global

### Lo que hay hoy

- **Técnica**: ilustración digital pictórica muy renderizada. Pelaje pintado mechón a mechón,
  degradados tipo aerógrafo, *rim light*, destellos especulares y chispas. **No hay cel-shading** ni
  colores planos. El acabado (detalle uniforme e hiperdenso, rótulos como "Once upon ink…", variación
  de estilo entre lotes) **parece generado por IA**. Hay que tenerlo en cuenta por consistencia y
  derechos de uso si el juego se vuelve comercial.
- **Línea**: no hay contorno negro uniforme. El contorno es suave, entintado del color local (marrón
  oscuro, azul marino, etc.) y en muchas zonas se disuelve en el pelo. La silueta la definen el valor
  y el pelaje, no la línea, por eso **se pierde a tamaños pequeños** (a menos de 128 px el detalle se
  vuelve ruido).
- **Proporciones**: "gatito anime". La cabeza mide más o menos un tercio de la altura total (2,5 a 3
  cabezas). Los ojos son enormes y brillantes, con iris en degradado, 2 o 3 reflejos y pestañas
  marcadas. Hocico pequeño y rosado, boca en "w". **No es chibi deformado**: el cuerpo y las patas
  tienen anatomía felina creíble.
- **Nivel de ternura**: alto en general, pero hay **dos familias de arte** que se notan a simple vista
  (y coinciden con dos lotes y dos plantillas de SVG):
  - **Familia A, "fantasía elemental" (19 gatos)**: el cuerpo está *hecho* del material del tema
    (gelatina, cristal, piedra, lava, origami, porcelana, nube, tinta, mecha, enredaderas, encaje…).
    Siluetas muy reconocibles y saturación alta. Son: alien, candy, cyber, deepsea/masquerade (ambos),
    fossil, origami, jelly, kintsugi, lantern, mecha, molten, mushroom, neon, prism, regal, steampunk,
    storm y storybook.
  - **Familia B, "cozy semi-realista" (13 gatos)**: gatitos de pelo largo (tipo Maine Coon o persa) muy
    realistas. El tema se ve **solo en el accesorio** (collar, moño, bufanda, cámara, gorro) y en el
    color del pelaje. Paleta pastel o cálida de baja saturación. Son: arce, canelo, margarita, menta,
    mochi, nori, nube, sakura, selene, sol y los 3 Primordiales (sonata, lumen, bytewhisker). Sus
    siluetas se parecen mucho entre sí (casi todos sentados de frente o de pie con la cola en S).
- **Encuadre y pose**: no hay convención. Hay gatos sentados de frente, de pie de 3/4, caminando a la
  izquierda o a la derecha, y uno saltando (neon). Todos tienen **fondo transparente**. En algunos
  quedan restos del fondo blanco original: una mancha blanca entre las patas de `storybook_ink`, un
  manchón detrás del lomo de `cyber_bloom` y un "piso" blanco bajo las patas de `iridescent_origami`.
- **Paleta global**: cada gato tiene su propia paleta (ver fichas). La familia A usa neones y joyas
  (verde ácido, cian, magenta, violeta, naranja lava). La familia B usa cremas, caramelos, grises
  azulados y rosas pálidos, más dorado de accesorio.

### Cómo llevarlo a "anime épico" (Battle Form) sin perder identidad

Qué **conservar** en cada gato (su ADN visual):

1. **Rasgo de silueta insignia**: antenas (alien), cola de amonita (fossil), cola de medusa (jelly),
   cola de grullas (origami), linterna (lantern), cola de engranajes y tubos (steampunk), sombrero de
   hongo (mushroom), cola de pergamino (storybook), corona lunar (regal), etc.
2. **Paleta de 3 colores**: es la tríada del sello de invocación (`summon.colors`, tomada del propio
   SVG) más el color de ojos.
3. **Accesorio-firma convertido en arma o armadura**: el cascabel se vuelve campana de guerra, la
   bufanda una capa en llamas, la cámara un cañón-lente, los lentes un visor HUD, el moño de partitura
   un estandarte musical.
4. **Marcas faciales**: el antifaz de tuxedo, las rayas atigradas, la espiral de la frente (storm) y el
   glifo de la frente (fossil, origami).

Qué **cambiar** para que se lea anime de batalla:

- **Render**: pasar a cel-shading de 2 o 3 tonos + *rim light* del color del elemento, con línea de
  grosor variable (más gruesa en el contorno exterior) y lineart coloreado. Así se lee bien a 256 px en
  combate.
- **Proporciones**: 3,5 a 4 cabezas, patas más largas, pecho y hombros marcados y cola más larga y
  expresiva. La cara mantiene los ojos grandes, pero **más afilados** (párpado superior recto,
  pupila rasgada o de energía) y con brillo emisivo.
- **Pelo**: de mechones realistas a **mechones-púa estilizados** (tipo cabello anime), sobre todo en
  la melena, la cola y las orejas.
- **Pose**: dinámica, en diagonal y con escorzo (salto, carga o lanzamiento). Como se dispara desde un
  barco, **todas mirando a la derecha** para el lado del jugador (el enemigo usa flip horizontal).
- **VFX separados del personaje**: aura con la forma del elemento, runas o glifos y estelas en los
  ojos. Van en capas aparte para animarlos sin tocar el arte.
- **Para la familia B** el salto tiene que ser mayor: en Battle Form el accesorio **se vuelve
  elemento** (la bufanda de Canelo arde, las flores de Margarita forman una armadura de pétalos), para
  que dejen de parecer "gato normal con collar".

---

## 2. Fichas por gato

Leyenda de las fichas:

- **Nombre (Educatione)**: nombre oficial del manifest. **Nombre sugerido**: propuesta para el juego.
- **Paleta**: dominantes del arte (cuantización del raster, de mayor a menor área) + acentos
  saturados del arte + tríada del aura/sello del SVG (`summon.colors`).
- **Metadata**: rareza y poderes de Educatione, motivo y partícula del sello, condición de desbloqueo
  y resumen de la historia.
- Los poderes de Educatione son: Pista Suave (hint), Fragmento de Respuesta (fragment), Eco de Error
  (echo) y Salto de Ejercicio (skip). Sirven de pista de rol: hint → soporte/explorador, fragment →
  daño de ráfaga, echo → contraataque/defensa, skip → utilidad de turno.
- KB = peso del SVG descargado (incluye el raster).

---

### alien_galaxy_cat.svg — 134 KB
- **Nombre (Educatione)**: Astro Nori. **Nombre sugerido**: Astro Nori ("el Visitante").
- **Paleta**: arte `#8eb628` `#b5d71e` `#094c4d` `#3e7e3d` `#061727` · acentos `#e8f633` (estrellas),
  turquesa en patas y ojos, magenta-violeta dentro de las orejas · aura `#7dff6f` `#59f5ff` `#ffe978`
  (+ partícula `#d179ff`).
- **Rasgos visuales**: gato verde lima con brillo húmedo y destellos amarillos en el cuerpo. **Dos
  antenas con esferas de cristal**. Orejas gigantes con una **galaxia dentro** (planetas con anillo y
  nebulosa rosa-violeta). Ojos verde-esmeralda enormes con reflejos. Collar metálico tecnológico con un
  planeta-dije. Cola con manchas de galaxia y punta crema. Almohadillas turquesa. Pose de 3/4 caminando
  con una pata alzada.
- **Metadata**: Mítico · Pista Suave + Fragmento · sello `star`/`star` · desbloqueo: logro
  `first-transfer`. Historia: nació cuando una constelación olvidada cayó sobre una libreta abierta;
  convierte el asombro en pistas.
- **Elemento sugerido**: Cósmico (secundario: Mutante/Alien).
- **Rol de combate**: Artillero de gravedad (trayectorias curvas, control de área).
- **Battle Form "Astro Nori: Supernova"**: aura de nebulosa verde-cian con anillos orbitales. Las
  antenas se vuelven dos esferas-satélite que orbitan la cabeza. Ojos verde neón con pupila en espiral
  galáctica. Pose flotando, con la cola enroscada alrededor de un planetoide. **Ataque insignia:
  "Órbita Colapsante"**: lanza un mini planeta que abre un pozo gravitatorio; atrae escombros y
  proyectiles cercanos y aplasta el módulo donde cae.

### arce_autumn_cat.svg — 164 KB
- **Nombre (Educatione)**: Arce Autumn. **Nombre sugerido**: Arce ("Vendaval de Otoño").
- **Paleta**: arte `#793c24` `#8a492f` `#fae8d8` `#c66830` `#a1542c` · acentos `#e98c41` `#db7b3e`
  · aura `#d56b2e` `#f0b45c` `#b64924`.
- **Rasgos visuales**: atigrado naranja-rojizo de pelo largo, pecho y patas crema. Ojos ámbar. Collar
  rojo con **hojas de arce** y un dije de huella. Cola enorme y esponjosa en S. Familia B: realista,
  de pie, de perfil a la derecha.
- **Metadata**: Legendario · Eco de Error · sello `maple`/`leaf` · desbloqueo: recuperar 1 concepto.
  Historia: soltar un intento también es aprender; sus hojas giran alrededor de las respuestas
  apresuradas.
- **Elemento sugerido**: Naturaleza (secundario: Viento).
- **Rol de combate**: Hostigador / Marcador (sus ataques dejan "marcas" que aumentan el daño
  recibido; encaja con *Eco de Error*).
- **Battle Form "Arce, Vendaval Carmesí"**: aura en remolino de hojas rojas y doradas. La cola se
  convierte en un torbellino de hojas afiladas. Ojos ámbar incandescentes. Pose de salto con giro.
  **Ataque insignia: "Hojarasca Cortante"**: un tornado de hojas atraviesa la cubierta y marca cada
  módulo tocado; el siguiente impacto en un módulo marcado hace daño crítico.

### bytewhisker_cat.svg — 133 KB
- **Nombre (Educatione)**: Bytewhisker. **Nombre sugerido**: Bytewhisker ("Root").
- **Paleta**: arte `#efe1dd` `#e6d3ce` `#dbccca` `#aa9699` `#d1bebc` · acentos azul marino de la
  sudadera `#3b3355`/`#524a72`, dorado `#deaba0` · aura `#4d63c8` `#f0b24c` `#dbe4ff`.
- **Rasgos visuales**: gatito gris perla muy esponjoso, sentado de frente. **Lentes redondos
  dorados**. **Sudadera azul marino** con capucha, cordones, el logo `</>` dorado y dijes de código.
  Collar con cascabel `</>`. Ojos azules. Familia B, el más "nerd tierno". El envoltorio tiene
  partículas de rectángulos/código.
- **Metadata**: **Primordial** · los 4 poderes · sello `code`/`square` · desbloqueo: beta cerrada
  (elegible). Historia: despertó cuando el lenguaje de las máquinas aprendió a cuidar estudiantes;
  "compila" pistas, detecta bugs y ejecuta el permiso primordial.
- **Elemento sugerido**: Tech / Código (candidato a **Origin Cat del Tech**).
- **Rol de combate**: Controlador / Hacker (desactiva módulos, roba turnos, revela stats).
- **Battle Form "Bytewhisker: Kernel Mode"**: la sudadera se vuelve un exotraje con capucha holográfica.
  Los lentes son un **visor HUD** con líneas de código corriendo. Aura de bloques de código azul y
  dorado. Ojos con iris de cursor parpadeante. Pose con una pata "tecleando" en el aire.
  **Ataque insignia: "Kernel Panic"**: inyecta un bug en un módulo enemigo; lo apaga 2 turnos y, si se
  destruye mientras está "crasheado", rebota el error a un módulo vecino.

### candy_alchemist_cat.svg — 141 KB
- **Nombre (Educatione)**: Dulcera. **Nombre sugerido**: Dulcera ("Alquimista Caramelo").
- **Paleta**: arte `#894e52` `#2b1120` `#4e3945` `#db80aa` `#ca9a97` · acentos `#c54e74` `#d26782`,
  cian caramelo, arcoíris · aura `#ff82d7` `#60e4ff` `#ffe06f` (+ `#b57cff`).
- **Rasgos visuales**: gata alquimista de **caramelo translúcido**. Orejas de cristal rosa y turquesa
  y un tocado de frasco. Pelo como algodón de azúcar. Ojos heterocromos (cian y violeta). Bata de
  alquimista crema y rosa con moño violeta y una capa interior estrellada. **Bastón-paleta espiral
  arcoíris** y un **frasco con poción iridiscente humeante**. Cola de bastón de caramelo rayado
  translúcido y patas de gelatina. Es de los más detallados.
- **Metadata**: Legendario · Fragmento · sello `candy`/`bubble` · desbloqueo: descubrir 40 conceptos.
  Historia: transforma sesiones pesadas; sus caramelos conceptuales guardan fragmentos de respuesta.
- **Elemento sugerido**: Alquimia (secundario: Mágico).
- **Rol de combate**: Asediador de estados (pociones de área: corrosión, pegajoso, explosivo).
- **Battle Form "Dulcera, Gran Transmutadora"**: aura de vapor rosa-cian con burbujas de azúcar. Ojos
  heterocromos con círculos alquímicos girando. Pose de lanzamiento con el bastón-paleta como varita y
  el frasco en alto. **Ataque insignia: "Transmutación Caramelo"**: un frasco que convierte la
  madera o el metal del módulo en caramelo quebradizo; el siguiente golpe físico lo hace añicos.

### canelo_cozy_cat.svg — 162 KB
- **Nombre (Educatione)**: Canelo Cozy. **Nombre sugerido**: Canelo (el CHARLA ya lo usa de ejemplo:
  "Canelo / Canelo Infernal").
- **Paleta**: arte `#481f11` `#733c25` `#512718` `#ba7045` `#7b462e` · acentos `#d08555` `#e59b6a`
  · aura `#b87b4b` `#efcfb2` `#7e5135`.
- **Rasgos visuales**: atigrado marrón chocolate muy esponjoso, sentado de frente, con pecho crema.
  Ojos café grandes. **Bufanda tejida a rayas** marrón y crema con flecos y un parche de huella. Cola
  enorme. Familia B, el más "abrazable".
- **Metadata**: Legendario · Fragmento · sello `yarn`/`ring` · desbloqueo: completar 4 misiones.
  Historia: vive en noches largas y repasos silenciosos; entre bufandas y ovillos guarda fragmentos de
  respuesta.
- **Elemento sugerido**: Fuego (cálido/hogar). En el CHARLA: Fuego / Artillero / Rasgo "Impaciente".
  Familia "Cozy" del CHARLA: buffs, suerte y economía.
- **Rol de combate**: Artillero básico de inicio + pasiva de economía en la isla.
- **Battle Form "Canelo Infernal"**: la bufanda se vuelve una **capa larga en llamas** y los flecos son
  brasas. El ovillo de lana se vuelve una bola de fuego. Aura cálida naranja. Ojos café con brasas.
  Pose de lanzador de béisbol. **Ataque insignia: "Hairball Ignition"** (nombre del CHARLA): bola de pelo
  incendiada. Ascendido: **"HELLBALL"**, que rebota y explota en cadena al entrar por una abertura.

### cyber_bloom_cat.svg — 170 KB
- **Nombre (Educatione)**: Cyflora. **Nombre sugerido**: Cyflora.
- **Paleta**: arte `#454135` `#5e6949` `#040704` `#797266` `#21251c` · acentos `#ed91c4` (flores),
  `#9bbf74` (hojas), verde neón de las luces · aura `#6cff78` `#ff8dde` `#d4ff72` (+ `#54f5db`).
- **Rasgos visuales**: **gato robot blanco y negro con enredaderas y flores de cerezo rosa** creciendo
  entre las placas. Orejas con paneles verdes. Ojos verde esmeralda. Núcleo verde brillante en el
  pecho con un ícono de hoja. Articulaciones con luces verdes. **Cola segmentada como tallo con una
  gran flor-núcleo en la punta**. Hologramas de UI flotando con flores. Tiene un resto de fondo blanco
  detrás del lomo.
- **Metadata**: Legendario · Eco de Error · sello `bloom`/`petal` · desbloqueo: superar 10 niveles.
  Historia: mezcla jardín y algoritmo; florecen señales cuando detecta una secuencia rota.
- **Elemento sugerido**: Naturaleza + Tech (ya es un **híbrido**: buen ejemplo de "cruce" en el
  Catdex).
- **Rol de combate**: Reparador / Ingeniero (repara módulos propios con enredaderas, pone trampas).
- **Battle Form "Cyflora: Overgrowth Protocol"**: las enredaderas se vuelven cables-raíz luminosos.
  Aura de pétalos con escaneo verde. Ojos con retícula de flor. Pose anclada al suelo con raíces.
  **Ataque insignia: "Floración Sobrecargada"**: dispara semillas-dron que se clavan en el casco
  enemigo y germinan; al florecer revientan el módulo desde dentro.

### deepsea_sprite_cat.svg — 154 KB  ⚠ contiene el arte de MASQUERADE
- **Nombre (Educatione)**: Abyss Lumi (pero el raster es el de la mascarada). **Nombre sugerido para
  este arte**: Velo Noctis.
- **Paleta (del arte que contiene)**: `#040105` `#05010f` `#231236` `#331f45` `#3d2c4e` · acentos
  `#703a83` `#9c6aa6`, dorado de filigrana · aura del envoltorio (pensada para Abyss) `#7cb0ff`
  `#d6d8ff` `#5de0ff`.
- **Rasgos visuales**: gato **negro** con **antifaz veneciano morado y dorado**, ojos violeta. Cuello
  isabelino de encaje, vestido o capa de **encaje y seda morada** con joya violeta, cadenas doradas y
  medias de filigrana. La cola y la capa se deshacen en **humo de encaje con antifaces flotando**.
  Pose de 3/4 caminando a la izquierda, elegante.
- **Metadata (de Abyss Lumi)**: Mítico · Pista Suave + Fragmento · sello `deep`/`spark` · desbloqueo:
  logro `own-words`. Historia: nada donde llegan las preguntas más hondas; su luz de profundidad
  señala el rumbo.
- **Elemento sugerido (para el arte)**: Sombra / Ilusión.
- **Rol de combate**: Asesino de engaño (clones-señuelo, desvía disparos).
- **Battle Form "Velo Noctis: Baile de Máscaras"**: aura de humo violeta con antifaces orbitando. Ojos
  violeta tras el antifaz con una estela. Pose de reverencia de esgrimista. **Ataque insignia:
  "Danza de los Mil Rostros"**: crea 3 máscaras-señuelo sobre el barco enemigo; los disparos enemigos
  apuntan a las máscaras y la real explota en el núcleo.

### fossilstone_guardian_cat.svg — 141 KB
- **Nombre (Educatione)**: Relik. **Nombre sugerido**: Relik ("Guardián Ammonite").
- **Paleta**: arte `#6b5c3f` `#080703` `#8d7754` `#737660` `#948d72` · acentos `#6fbaaf` (turquesa
  rúnico), `#ccb38b` arenisca · aura `#44d9e6` `#d1b37b` `#8ef7ff` (+ `#7d9386`).
- **Rasgos visuales**: **gato-estatua de piedra arenisca** con **fósiles de amonita** en hombros, cadera
  y orejas. **Runas turquesa brillantes** grabadas. Cristales de cuarzo cian saliendo del lomo. Collar
  de bloques de piedra con gemas. **Cola de bloques que termina en espiral de amonita** con un dije de
  cristal. Ojos turquesa enormes. De pie y de frente, muy robusto.
- **Metadata**: Legendario · Fragmento · sello `fossil`/`glyph` · desbloqueo: sostener 8 conceptos.
  Historia: recuerda capas antiguas de conocimiento enterrado y excava un fragmento útil.
- **Elemento sugerido**: Piedra / Tierra (candidato a **Origin Cat de Tierra**).
- **Rol de combate**: Tanque / Muro (escudos de piedra sobre módulos; daño pesado y lento).
- **Battle Form "Relik, Coloso Ammonite"**: el cuerpo crece y las placas se separan con energía cian
  entre ellas. Las runas se encienden. Aura de polvo y fragmentos orbitando. Ojos cian sin pupila.
  Pose con la cola de amonita alzada como maza. **Ataque insignia: "Sismo Ammonite"**: un golpe de cola
  que manda una onda sísmica por el agua y sacude todo el barco enemigo, soltando las uniones de los
  módulos.

### iridescent_origami_cat.svg — 83 KB (el más liviano)
- **Nombre (Educatione)**: Ori Prisma. **Nombre sugerido**: Ori ("Mil Pliegues").
- **Paleta**: arte `#ede8f2` `#aca2c5` `#e3e2ea` `#3953a3` `#251a65` · acentos `#68a0d1` `#df9d78`
  `#c175a0` (iridiscencia) · aura `#8d6bff` `#56d8ff` `#ffa748` (+ `#ff7de2`).
- **Rasgos visuales**: **gato de papel origami low-poly** blanco con caras iridiscentes (violeta, azul,
  naranja, rosa). Ojos en forma de diamante facetado. Glifo geométrico dorado en la frente. Dije
  dorado. **Cola de pliegues en zigzag** y **grullas de papel** volando alrededor. Facetas planas sin
  pelo: es el más "gráfico" y el más fácil de llevar a cel-shading. Tiene un resto de "piso" blanco
  bajo las patas.
- **Metadata**: Legendario · Pista Suave · sello `fold`/`square` · desbloqueo: descubrir 25 conceptos.
  Historia: pliega conceptos complejos hasta volverlos legibles.
- **Elemento sugerido**: Viento / Papel (afinidad "Origami/Iridiscente" del CHARLA: velocidad, clones,
  reflectores, cortes).
- **Rol de combate**: Velocista multidisparo (muchos proyectiles pequeños, clones).
- **Battle Form "Ori, Tormenta de Grullas"**: el cuerpo se despliega en láminas afiladas como alas.
  Aura de papel iridiscente girando. Ojos-diamante emisivos. Pose en pleno despliegue.
  **Ataque insignia: "Mil Grullas"**: un enjambre de grullas de papel que cortan cuerdas, velas y
  mástiles; ignoran escudos de energía.

### jelly_aquatic_cat.svg — 173 KB
- **Nombre (Educatione)**: Marina Gel. **Nombre sugerido**: Marina Gel.
- **Paleta**: arte `#4d99f3` `#154fc0` `#01329d` `#011765` `#8cb6f9` · acentos `#2570dc`, rosa y
  durazno bioluminiscente en los puntos · aura `#a3f7ff` `#8ac6ff` `#ffb8ff`.
- **Rasgos visuales**: gato **azul cobalto semitranslúcido** con puntos bioluminiscentes rosas y
  durazno. Gorguera de volantes gelatinosos alrededor del cuello. Orejas y bigotes con tentáculos
  colgantes. **Cola-medusa** (umbrela rosa-lavanda y tentáculos largos con gotas). Ojos turquesa
  enormes. Pose de 3/4 caminando.
- **Metadata**: Mítico · Pista Suave + Eco de Error · sello `tide`/`bubble` · desbloqueo: logro
  `rescued`. Historia: lee el movimiento de las dudas como mareas; susurra pistas y avisa del peligro.
- **Elemento sugerido**: Agua (candidato a **Origin Cat del Agua**).
- **Rol de combate**: Asediador submarino (daño bajo la línea de flotación, "moja" módulos para
  combos eléctricos).
- **Battle Form (ya esbozada en el CHARLA)**: cuerpo de agua gelatinosa, ojos brillantes y tentáculos
  líquidos. Aura de burbujas y anillos de presión. Pose emergiendo del agua. **Ataque insignia: "Tidal
  Compression"**: rompe estructuras desde abajo, reventando cascos por presión, y deja el estado
  "Mojado".

### kintsugi_tea_spirit_cat.svg — 118 KB
- **Nombre (Educatione)**: Kintsu. **Nombre sugerido**: Kintsu ("Espíritu del Té").
- **Paleta**: arte `#8a6a42` `#2d3143` `#61554b` `#e4d3be` `#d1c7ba` · acentos `#bb9869` (oro),
  azul cobalto de la porcelana · aura `#d4a64b` `#3157b7` `#f5e6be` (+ `#8da5ff`).
- **Rasgos visuales**: gato de **porcelana blanca con motivos florales azul cobalto** (tipo Ming o
  Delft) y **grietas reparadas con oro (kintsugi)**. Túnica azul marino con borlas doradas. Placa con el
  kanji 茶 ("té"). Taza humeante en la pata. Tocado con tetera en miniatura. **Cola de tazas
  apiladas**. Ojos azules. Pose de 3/4.
- **Metadata**: Legendario · Fragmento · sello `seam`/`glyph` · desbloqueo: recuperar 3 conceptos.
  Historia: aprender también es reparar lo que se rompió; sus grietas doradas guardan fragmentos.
- **Elemento sugerido**: Espíritu (secundario: Tierra/Cerámica).
- **Rol de combate**: Reparador / Soporte (cura módulos; cada reparación deja un "sello dorado" más
  resistente).
- **Battle Form "Kintsu, la Grieta Dorada"**: las grietas de oro brillan como ríos de luz líquida.
  Vapor de té formando kanjis. Ojos dorados. Pose de ceremonia con la taza alzada. **Ataque insignia:
  "Sello Kintsugi"**: sella con oro las grietas del barco propio (escudo) o marca las grietas del
  enemigo; al siguiente impacto, la red de grietas doradas estalla.

### lantern_spirit_cat.svg — 126 KB
- **Nombre (Educatione)**: Luzterna (**gata guía**, inicial). **Nombre sugerido**: Luzterna.
- **Paleta**: arte `#84b0e6` `#a4d9f9` `#474e84` `#6588c9` `#8cc4f2` · acentos ámbar de la linterna
  y los ojos · aura `#ffe28c` `#a7d8ff` `#b4a2ff`.
- **Rasgos visuales**: **gata espíritu translúcida azul-celeste** con la cabeza azul oscuro y una
  llama-glifo celeste en la frente. Ojos ámbar luminosos. Capucha y bufanda morado oscuro con
  cascabeles dorados. **Sostiene una linterna de papel encendida**. La parte baja del cuerpo es humo o
  ectoplasma. Fuegos fatuos fantasma alrededor (tiernos). Aparece flotando y de frente.
  (Ojo: su arte de guía en `_extra/guides/luzterna.webp` es otra versión: bruja tuxedo morada.)
- **Metadata**: Legendario · Pista Suave · sello `firefly`/`spark` · desbloqueo: **starter** (la
  tienes desde el inicio) · `GUIDE_CAT_ID`. Tiene dos modos: Guía (sin enfriamiento) y Compañera.
  Historia: recorre el Archivo Vivo con una linterna de recuerdos serenos; ilumina el siguiente paso,
  nunca el camino completo.
- **Elemento sugerido**: Espíritu (candidata a **Origin Cat del Espíritu**; ideal como mascota o
  tutorial del juego).
- **Rol de combate**: Explorador (revela puntos débiles y módulos ocultos; disipa niebla).
- **Battle Form "Luzterna, Faro de Almas"**: la linterna crece y se vuelve un farol de guerra. Aura
  de fuegos fatuos en espiral. Ojos ámbar con estela. Pose flotando con la linterna en alto.
  **Ataque insignia: "Procesión de Fuegos Fatuos"**: suelta 3 fuegos fatuos teledirigidos que buscan el
  módulo más débil y lo dejan "Revelado" (más daño recibido).

### lumen_lens_cat.svg — 143 KB
- **Nombre (Educatione)**: Lumen Lens. **Nombre sugerido**: Lumen ("la Fotógrafa del Recuerdo").
- **Paleta**: arte `#754836` `#d9beb3` `#caa896` `#392423` `#b6998c` · acentos `#e0a991`, azul del
  pañuelo · aura `#5f88d7` `#f5e9cf` `#9c6f47`.
- **Rasgos visuales**: gatita bicolor (blanco + marrón), sentada, con una pata alzada. **Gorra de
  fotógrafo/explorador**, **pañuelo azul con huellas**, **cámara réflex** colgando y **morral de cuero
  con fotos polaroid**. Ojos ámbar enormes. Familia B.
- **Metadata**: **Primordial** · los 4 poderes · sello `lens`/`ring` · desbloqueo: beta cerrada.
  Historia: captura recuerdos antes de que Distraxia los borre; su cámara congela ideas, errores y
  descubrimientos.
- **Elemento sugerido**: Luz (secundario: Tiempo). Candidata a **Origin Cat de la Luz**.
- **Rol de combate**: Controladora temporal (congela un módulo o un proyectil; "fotografía" estados
  para repetirlos).
- **Battle Form "Lumen: Exposición Eterna"**: la cámara se vuelve un **cañón-lente** con diafragma
  giratorio y las polaroids flotan como escudos. Aura de destellos de flash. Ojos con diafragma en el
  iris. Pose apuntando. **Ataque insignia: "Instantánea Eterna"**: un flash que congela en el tiempo
  la zona fotografiada (los módulos no actúan) y guarda una "foto" que permite repetir el último
  ataque aliado.

### margarita_daisy_cat.svg — 140 KB
- **Nombre (Educatione)**: Margarita Daisy. **Nombre sugerido**: Margarita.
- **Paleta**: arte `#c38e5c` `#f4e1d0` `#f4dbc3` `#ddc1a7` `#dc9e5f` · acentos `#ebb87e`, verde oliva
  del pañuelo · aura `#e7c34d` `#90b757` `#fff7d6`.
- **Rasgos visuales**: atigrada crema-durazno claro de pelo largo. Margarita en la oreja. **Pañuelo
  verde oliva con margaritas** y un dije de margarita. Ojos verdes. De pie, a la derecha, cola en S.
  Familia B.
- **Metadata**: Legendario · Pista Suave · sello `daisy`/`petal` · desbloqueo: practicar 3 días.
  Historia: cuida la parte más luminosa del Archivo Vivo; sus flores traen una pista sencilla y amable.
- **Elemento sugerido**: Naturaleza (secundario: Luz).
- **Rol de combate**: Sanadora / Suerte.
- **Battle Form "Margarita, Juramento de Pétalos"**: armadura ligera de pétalos blancos con corazón
  dorado. Corona de margaritas. Aura de pétalos girando. Ojos verdes con una flor en el iris. Pose
  arrodillada lanzando pétalos. **Ataque insignia: "Me Quiere, No Me Quiere"**: deshoja 5 pétalos al
  azar; cada uno cura al barco propio o hace daño crítico al enemigo (alto RNG, ideal para la
  "dopamina").

### masquerade_phantom_cat.svg — 100 KB  ⚠ contiene el arte de DEEPSEA
- **Nombre (Educatione)**: Velo Noctis (pero el raster es el gato abisal). **Nombre sugerido para
  este arte**: Abyss Lumi.
- **Paleta (del arte que contiene)**: `#252e51` `#01020c` `#0a0f24` `#010518` `#5f7aac` · acentos
  `#9ec8ec` (bioluminiscencia) `#98aada` · aura del envoltorio (pensada para Masquerade) `#8c2bff`
  `#1f0f36` `#d296ff`.
- **Rasgos visuales**: gatito **negro-azul abisal** con **antena de pez linterna** que tiene una gota de
  luz celeste en la punta. Ojos plateados enormes sin pupila. **Aletas** en lugar de mechones en
  mejillas y orejas. **Conchas, caracoles y perlas** en las orejas y en un collar de cristal. Puntos
  bioluminiscentes por todo el cuerpo. Cola-capa de aleta translúcida violeta-azul. De pie y de
  frente. Muy "creepy-cute".
- **Metadata (de Velo Noctis)**: Mítico · Eco de Error + Pista Suave · sello `mask`/`glyph` ·
  desbloqueo: logro `clean-mission`. Historia: patrulla los rincones donde se esconden los errores
  elegantes.
- **Elemento sugerido (para el arte)**: Agua (secundario: Abismo/Oscuridad).
- **Rol de combate**: Francotirador de profundidad / Cebo (atrae proyectiles con su luz y
  contraataca).
- **Battle Form "Abyss Lumi: Señuelo del Abismo"**: el cuerpo se alarga, crece una mandíbula de
  sombras y la antena es un faro hipnótico. Aura de oscuridad de fosa marina con partículas
  bioluminiscentes. Ojos plateados con brillo de reflector. Pose acechando bajo el agua.
  **Ataque insignia: "Luz Abisal"**: la antena hipnotiza (el enemigo pierde precisión) y una
  dentellada de presión perfora el casco bajo el agua.

### mecha_neon_cat.svg — 142 KB
- **Nombre (Educatione)**: Volt Mecha. **Nombre sugerido**: Volt Mecha.
- **Paleta**: arte `#8c8da7` `#03040a` `#101626` `#3b3d50` `#090b1b` · acentos `#47d0e4` (cian),
  `#a81b91` (magenta) · aura `#3dfcff` `#ff3fd8` `#7ea0ff`.
- **Rasgos visuales**: gato tuxedo (negro y blanco) con **armadura mecha** negra y plateada y **luces
  neón cian y magenta**. **Visor-lente magenta** sobre los ojos y audífonos-cascos con anillos cian.
  Reactor circular en el pecho. **Cola segmentada robótica** con punta de pelo blanco. Garras de luz
  cian. Pose de 3/4 a la derecha, desafiante. Silueta ya muy "anime/mecha".
- **Metadata**: Legendario · Eco de Error · sello `bolt`/`bolt` · desbloqueo: completar 12 misiones.
  Historia: forjado entre circuitos; enciende los ojos y te frena antes del error.
- **Elemento sugerido**: Eléctrico (secundario: Tech). Candidato a **Origin Cat del Rayo**.
- **Rol de combate**: Francotirador (disparo recto de alta precisión; encadena a módulos "Mojados").
- **Battle Form "Volt Mecha: Overdrive"**: placas abiertas con energía, propulsores en la espalda y la
  cola convertida en cañón de riel. Aura eléctrica cian y magenta. Ojos tras el visor con líneas de
  escaneo. Pose de francotirador agachado. **Ataque insignia: "Railgun Voltaico"**: disparo recto que
  atraviesa 2 módulos; si alguno está Mojado, el rayo salta a todos los módulos mojados conectados.

### menta_botanical_cat.svg — 144 KB
- **Nombre (Educatione)**: Menta Botanical. **Nombre sugerido**: Menta.
- **Paleta**: arte `#9d8461` `#fae8d6` `#af9b7d` `#f3e3d2` `#5a5130` · acentos `#d5a183`, verde salvia
  de los listones · aura `#79a45d` `#dcefc9` `#537f47`.
- **Rasgos visuales**: gatita crema clara de pelo largo con ojos verde menta. **Hojas de menta y una
  florecita en la cabeza**. **Collar verde salvia con cascabel y pañuelo de hojas**. **Moño de listón
  verde con hojas en la cola**. De pie, de 3/4 a la izquierda. Familia B.
- **Metadata**: Legendario · Pista Suave · sello `mint`/`leaf` · desbloqueo: superar 3 niveles.
  Historia: hace crecer la atención como un jardín; sus hojas se inclinan hacia la idea correcta.
- **Elemento sugerido**: Naturaleza (secundario: Hielo, por la frescura de la menta).
- **Rol de combate**: Soporte de limpieza (quita Fuego y estados negativos, reduce enfriamientos).
- **Battle Form "Menta, Brisa Glacial"**: listones de hojas largos como bufanda al viento. Escarcha
  verde-menta. Aura de hojas con cristales de hielo. Ojos menta con brillo frío. Pose de giro.
  **Ataque insignia: "Brisa Mentolada"**: una ráfaga que apaga incendios en el barco propio y deja los
  módulos enemigos "Quebradizos" (frío).

### mochi_bell_cat.svg — 119 KB
- **Nombre (Educatione)**: Mochi Bell. **Nombre sugerido**: Mochi.
- **Paleta**: arte `#c39078` `#dbbea9` `#e9d5c5` `#ebd0bb` `#cca78f` · acentos `#e4a587`, azul del
  moño · aura `#d4a549` `#4f6db8` `#f2e2b4`.
- **Rasgos visuales**: gatita crema y blanca súper esponjosa, sentada y sonriente. Ojos ámbar. **Collar
  dorado con moño azul, cascabel dorado y florecita**. Cola esponjosa. Familia B, la más "mochi"
  (redonda).
- **Metadata**: Legendario · Pista Suave · sello `bell`/`ring` · desbloqueo: superar 1 nivel (de las
  primeras). Historia: fue la primera en responder cuando el Archivo pidió guardianes tiernos; su
  cascabel suena cuando estás a un detalle de comprender.
- **Elemento sugerido**: Sonido (secundario: Cozy/Suerte).
- **Rol de combate**: Soporte de economía y suerte (+monedas, +probabilidad de crítico del equipo).
- **Battle Form "Mochi, Campana del Alba"**: el cascabel crece hasta ser una **campana de templo** que
  ella golpea. El moño es un estandarte. Aura de ondas sonoras doradas. Ojos ámbar brillantes. Pose
  saltando con la campana. **Ataque insignia: "Campanazo"**: una onda sonora que hace vibrar el barco
  enemigo (aturde a la tripulación 1 turno) y da "Suerte" al equipo.

### molten_ember_cat.svg — 162 KB
- **Nombre (Educatione)**: Brasa. **Nombre sugerido**: Brasa (o "Ignis", el Origin Cat de Fuego del
  CHARLA).
- **Paleta**: arte `#473c4a` `#332b39` `#1b141d` `#1d0a12` `#0f070e` · acentos `#fa6713` `#f78d1c`
  `#e54114` (lava) · aura `#ff5c2a` `#ffb22a` `#ffef7a`.
- **Rasgos visuales**: gato **negro carbón de pelo largo** con **grietas de lava naranja** por todo el
  cuerpo. Ojos naranja fuego. **Cola de humo y llamas** con fragmentos de obsidiana flotando. Llamas
  en las patas. Pose de 3/4 a la derecha, intimidante. Ya es casi "battle-ready".
- **Metadata**: Legendario · Eco de Error · sello `ember`/`spark` · desbloqueo: descubrir 12
  conceptos. Historia: nació en la fragua donde se templan los intentos fallidos; su fuego no
  castiga.
- **Elemento sugerido**: Fuego (secundario: Tierra → **Magma**). Candidato fuerte a **Origin Cat del
  Fuego**.
- **Rol de combate**: Demoledor (daño masivo en área, deja "Incendio" sobre madera).
- **Battle Form "Brasa, Corazón de Fragua"**: las grietas de lava se abren en ríos y la melena se
  vuelve llamarada. Fragmentos de obsidiana orbitando. Ojos blancos-amarillos al rojo vivo. Pose
  rugiendo. **Ataque insignia: "Erupción de Fragua"**: cae como meteoro de lava; el impacto deja
  charcos ardientes que se propagan por los módulos de madera.

### mushroom_druid_cat.svg — 169 KB
- **Nombre (Educatione)**: Micelio. **Nombre sugerido**: Micelio.
- **Paleta**: arte `#825037` `#a57454` `#4d4b0c` `#857b1b` `#3e1f11` · acentos `#ad3517` (rojo
  amanita), `#c87343` · aura `#ffcf68` `#ffd54d` `#c9ff83`.
- **Rasgos visuales**: gato marrón y crema de pelo largo con **sombrero de amanita** (rojo con puntos
  blancos) cubierto de musgo y hongos. Capa de musgo y hojas. **Báculo de raíz con hongo y una luz
  amarilla**. Frasco y bolsita al cinto. Hongos creciendo en la cola. Luciérnagas o esporas brillantes.
  Ojos verdes. Sentado de 3/4.
- **Metadata**: Legendario · Pista Suave · sello `spore`/`bubble` · desbloqueo: superar 6 niveles.
  Historia: crece donde las ideas se conectan bajo la superficie; sus honguitos brillan cuando detecta
  relaciones.
- **Elemento sugerido**: Naturaleza (secundario: Veneno). Afinidad "Natural/Bloom" del CHARLA.
- **Rol de combate**: Asediador (daño en el tiempo, pudre la madera, invoca hongos-mina).
- **Battle Form "Micelio, Druida del Bosque Profundo"**: el sombrero se vuelve un dosel enorme y el
  báculo se ramifica. Red de micelio luminosa bajo los pies. Aura de esporas doradas. Ojos verdes con
  bioluminiscencia. Pose invocando con el báculo. **Ataque insignia: "Bosque de Esporas"**: siembra
  hongos en la cubierta enemiga; cada turno revientan, pudren la madera y se propagan a módulos
  adyacentes.

### neon_glitch_cat.svg — 138 KB
- **Nombre (Educatione)**: Pixel Glitch. **Nombre sugerido**: Pixel Glitch.
- **Paleta**: arte `#453458` `#372c43` `#f9eff1` `#f8ebe2` `#2e73d8` · acentos `#3cc1f1` `#bb22c4`
  `#6c1da4` · aura `#43e8ff` `#ff49ef` `#ffb143` (+ `#8f6bff`).
- **Rasgos visuales**: gato tuxedo negro y blanco **saltando**, con la lengua afuera y expresión
  traviesa. **Heterocromía** (ojo cian y ojo magenta-dorado). **Píxeles y fragmentos cuadrados
  desprendiéndose** en cian, magenta y naranja. Orejas con degradado neón. Almohadillas neón. Cola con
  "aberración cromática". Es el más **energético y anime** de todos y la silueta más delgada.
- **Metadata**: Legendario · Eco de Error · sello `glitch`/`square` · desbloqueo: completar 8 misiones.
  Historia: apareció dentro de un error de interfaz que decidió volverse útil.
- **Elemento sugerido**: Tech / Digital (secundario: Caos).
- **Rol de combate**: Asesino de teletransporte (ignora coberturas, daño a módulos internos).
- **Battle Form "Pixel Glitch: Fatal Error"**: el cuerpo parpadea entre posiciones y la mitad del
  cuerpo se pixela. Aura de scanlines y bloques RGB. Ojos con glitch y desfase de color. Pose en pleno
  teleport. **Ataque insignia: "Error 404: Casco No Encontrado"**: se teletransporta dentro del barco
  enemigo y "borra" un bloque de píxeles del casco, abriendo un hueco directo al núcleo.

### nori_lunar_cat.svg — 158 KB
- **Nombre (Educatione)**: Nori Lunar. **Nombre sugerido**: Nori Lunar.
- **Paleta**: arte `#11121c` `#0d0e17` `#161522` `#1c1d2b` `#20202e` · acentos `#344182` `#57609f`
  `#99a4ce` (reflejos azulados) · aura `#b8d5ff` `#6ea7ff` `#24386f`.
- **Rasgos visuales**: **gato negro de pelo largo** con reflejos azul-violeta. Ojos azul zafiro
  enormes. **Collar azul noche con estrellitas y un dije de luna creciente** con un cristal colgando.
  Cola enorme. De pie y de frente. Familia B. Junto con Selene forma la pareja lunar.
- **Metadata**: Mítico · Pista Suave + Eco de Error · sello `moon`/`star` · desbloqueo: logro
  `sky-connected`. Historia: observa desde el borde de una luna tranquila; su mirada azul detecta
  fallas sutiles.
- **Elemento sugerido**: Lunar / Oscuridad (secundario: Cósmico).
- **Rol de combate**: Francotirador nocturno (más daño en turnos de "noche" o con niebla).
- **Battle Form "Nori, Eclipse Silente"**: el pelaje negro absorbe la luz, con el contorno de luz lunar
  plateada. Media luna detrás de la cabeza como halo. Aura de noche estrellada. Ojos zafiro con una
  luna creciente en la pupila. Pose agazapada sobre el mástil. **Ataque insignia: "Eclipse
  Silencioso"**: oscurece el campo (el enemigo pierde precisión) y lanza un disparo de luz lunar
  invisible hasta impactar.

### nube_dream_cat.svg — 104 KB
- **Nombre (Educatione)**: Nube Dream. **Nombre sugerido**: Nube.
- **Paleta**: arte `#c5b5bf` `#cac5d5` `#ddd5dc` `#f9ebe1` `#f1eef3` · acentos azul cielo del moño,
  dorado · aura `#9fbfff` `#f1f7ff` `#d4e4ff`.
- **Rasgos visuales**: **gatita blanca algodonosa** (persa), cara redonda, ojos gris-azul
  somnolientos y rubor. **Moño azul cielo con estrellas y dije de nubecita dormida + estrella
  dorada**. **Cola como nube cúmulo**. Sentada de frente. Familia B, la más suave.
- **Metadata**: Mítico · Pista Suave + Salto de Ejercicio · sello `cloud`/`bubble` · desbloqueo:
  logro `archive-fifty`. Historia: recoge pensamientos suaves antes de que Distraxia los disperse;
  puede cargarte por encima de un ejercicio áspero.
- **Elemento sugerido**: Viento / Sueño (Cielo).
- **Rol de combate**: Controladora (duerme a la tripulación o los cañones enemigos; mueve a aliados).
- **Battle Form "Nube, Reina del Cúmulo"**: el cuerpo se funde con una nube gigante que la carga,
  corona de nubes y estrellas. Aura de bruma pastel. Ojos semicerrados con brillo de estrellas. Pose
  recostada sobre la nube. **Ataque insignia: "Siesta Cúmulo"**: una nube de sueño cubre una zona y los
  cañones enemigos dentro no disparan el siguiente turno. Pasiva ligada a *Salto*: puede saltarse un
  turno enemigo una vez por combate.

### prism_crystal_cat.svg — 149 KB
- **Nombre (Educatione)**: Prisma. **Nombre sugerido**: Prisma.
- **Paleta**: arte `#a7a2e3` `#b8aadf` `#beccf1` `#5783ea` `#fcfaf5` · acentos `#74a3f0` `#85d0f8`
  `#4043a6` · aura `#7fe0ff` `#ff89ff` `#ffe78d` (+ `#9d8bff`).
- **Rasgos visuales**: gata lila pálido con **orejas, hombros, patas y cola de cristal facetado
  iridiscente** (azul, rosa, dorado). Tiara y collar dorados con gemas en rombo. Ojos violeta-azul con
  estrellas. **Cola larga de cristal en espiral** con bandas doradas. Fragmentos de cristal flotando.
  Caminando a la derecha con una pata alzada.
- **Metadata**: Mítico · Fragmento + Salto de Ejercicio · sello `shard`/`square` · desbloqueo: logro
  `route-done`. Historia: nació del reflejo de miles de soluciones correctas; puede abrir un "atajo
  sagrado".
- **Elemento sugerido**: Cristal (secundario: Luz).
- **Rol de combate**: Refractor (divide proyectiles y rebota láseres; escudos reflectantes).
- **Battle Form "Prisma, Refracción Absoluta"**: los cristales crecen hasta ser alas y una armadura de
  facetas. Aura de arcoíris refractado. Ojos facetados que proyectan rayos. Pose lanzando un haz.
  **Ataque insignia: "Refracción Prismática"**: un láser que se divide en 3 al pasar por un cristal y
  rebota entre los módulos enemigos.

### regal_cosmic_cat.svg — 187 KB (el más pesado)
- **Nombre (Educatione)**: Nova Real. **Nombre sugerido**: Nova Real ("Emperatriz Estelar").
- **Paleta**: arte `#1e205d` `#425ccc` `#151450` `#040a3f` `#edb3a3` · acentos `#182da2` `#7a33af`
  y oro · aura `#ffd974` `#8cc8ff` `#c48cff`.
- **Rasgos visuales**: gata **azul noche con el pelaje de galaxia** (nebulosas azul y violeta).
  **Corona de luna creciente dorada** con estrella. Joyería dorada (collar, brazaletes y adornos de
  estrella de 4 puntas). Velos violeta translúcidos. **Cola enorme de nebulosa con planetas y anillos
  dorados orbitando**. Ojos violeta. Sentada de 3/4, majestuosa. Ya tiene aire de "jefe".
- **Metadata**: Mítico · Fragmento + Salto de Ejercicio · sello `crown`/`star` · desbloqueo: logro
  `boss-cleared`. Historia: custodia los pergaminos del cielo profundo; su corona estelar firma el pase
  de un ejercicio imposible.
- **Elemento sugerido**: Cósmico (candidata a **Origin Cat Cósmico** o gato de evento/boss).
- **Rol de combate**: Demoledora cósmica (un solo tiro devastador por combate; afinidad "Galácticos"
  del CHARLA: gravedad, meteoros, agujeros negros).
- **Battle Form "Nova Real, Decreto Estelar"**: se alza sobre las patas traseras, la corona es un halo
  de supernova y los velos son auroras. Planetas alineados detrás. Ojos de estrella blanca. Pose de
  sentencia, señalando. **Ataque insignia: "Lluvia de Meteoros Reales"**: tras 1 turno de carga caen
  meteoros sobre todo el barco enemigo. Solo se usa una vez por combate.

### sakura_whisper_cat.svg — 119 KB
- **Nombre (Educatione)**: Sakura Whisper. **Nombre sugerido**: Sakura.
- **Paleta**: arte `#d9a09f` `#ddc3c0` `#d4b4b2` `#fcf2ef` `#ebd9d7` · acentos `#a36360` `#edafae`
  · aura `#ffb6d0` `#ff8fb8` `#ffdce8`.
- **Rasgos visuales**: gatita blanca-rosada esponjosa con **flores de cerezo en la oreja**. Ojos
  rosa-café con pestañas. **Moño rosa con flor de sakura y cascabel**. **Cola rosa degradada con
  pétalos cayendo**. Sentada de frente. Familia B.
- **Metadata**: Mítico · Pista Suave + Fragmento · sello `petal`/`petal` · desbloqueo: logro
  `week-held`. Historia: florece durante las rachas de estudio paciente; sus pétalos traen pistas.
- **Elemento sugerido**: Naturaleza (secundario: Espíritu/Viento).
- **Rol de combate**: Duelista de cortes (muchos golpes pequeños; crítico creciente por racha).
- **Battle Form "Sakura, Danza del Hanami"**: estética **samurái**: haori rosa, katana de pétalos y
  cola como torbellino de pétalos. Aura de pétalos en espiral. Ojos rosa con brillo afilado. Pose de
  iaido (desenvaine). **Ataque insignia: "Mil Pétalos"**: un corte iaido que suelta una tormenta de
  pétalos-cuchilla; hace más daño por cada turno seguido en que Sakura atacó (racha).

### selene_moonlit_cat.svg — 151 KB
- **Nombre (Educatione)**: Selene Moonlit. **Nombre sugerido**: Selene.
- **Paleta**: arte `#9793a8` `#7b85ac` `#5f6fa0` `#747795` `#b9b7ca` · acentos `#7993d3` `#99b2e8`
  `#495a8e` · aura `#9ec8ff` `#dff1ff` `#6e86e7`.
- **Rasgos visuales**: **gata gris plata atigrada** de pelo larguísimo con brillos azul hielo. **Luna
  creciente en la frente**. Arete de luna. **Moño azul marino con luna y gota de cristal**. Ojos azul
  celeste. Cola esponjosa con destellos. Sentada. Familia B.
- **Metadata**: Mítico · Fragmento + Salto de Ejercicio · sello `crystal`/`square` · desbloqueo: logro
  `thirty-days`. Historia: guarda los permisos nocturnos del aprendizaje; sus cristales ofrecen un
  fragmento perfecto o adelantan un ejercicio.
- **Elemento sugerido**: Lunar (secundario: Hielo/Cristal).
- **Rol de combate**: Guardiana de escudos (escudos de cristal lunar; refleja parte del daño).
- **Battle Form "Selene, Marea de Plata"**: el pelaje se vuelve plata líquida y la cola es una cascada
  de luz lunar. Cristales de hielo flotando. Luna llena detrás. Ojos plata y celeste. Pose de
  invocación con las patas alzadas. **Ataque insignia: "Marea Lunar"**: alza la marea bajo el barco
  enemigo (lo desestabiliza y reduce su precisión) y pone un escudo de cristal sobre el módulo aliado
  más dañado.

### sol_sunbeam_cat.svg — 150 KB
- **Nombre (Educatione)**: Sol Sunbeam. **Nombre sugerido**: Sol.
- **Paleta**: arte `#f6d9bf` `#b34d13` `#fbe8c9` `#dcac87` `#f49034` · acentos `#ee7a29` `#dc661a`
  `#f18634` · aura `#ffb431` `#ffe17a` `#ff7a18`.
- **Rasgos visuales**: **atigrado naranja intenso** con pecho crema. Expresión feliz con la boca
  abierta y ojos ámbar enormes. **Collar café con un dije de sol sonriente**. Caminando a la derecha con
  una pata alzada y la cola arriba. Familia B, pero **es la pose más dinámica de ese lote**.
- **Metadata**: Legendario · Pista Suave · sello `sun`/`spark` · desbloqueo: descubrir 5 conceptos
  (de los primeros). Historia: corre más rápido que la pereza de la tarde; energía contagiosa.
- **Elemento sugerido**: Fuego (secundario: Luz) → "Solar".
- **Rol de combate**: Velocista agresivo (ataca primero; buff de iniciativa al equipo).
- **Battle Form "Sol, Mediodía Eterno"**: corona de rayos solares detrás de la cabeza y rayas atigradas
  que brillan como llamas. Estela de luz al correr. Ojos dorados encendidos. Pose de sprint en
  diagonal. **Ataque insignia: "Rayo de Mediodía"**: un haz solar concentrado que funde metal y da
  +velocidad al equipo durante 1 turno.

### sonata_prima_cat.svg — 152 KB
- **Nombre (Educatione)**: Sonata Prima. **Nombre sugerido**: Sonata Prima ("la Primera Nota").
- **Paleta**: arte `#261d1f` `#e4d5ce` `#f8eee7` `#d2c1bc` `#554749` · acentos `#c29889`, dorado ·
  aura `#d4a54a` `#2d2b42` `#fff1c7`.
- **Rasgos visuales**: **gatita tuxedo** (negro y blanco) de pelo largo, sentada. Ojos ámbar enormes.
  **Mini sombrero de copa con teclas de piano, clave de sol dorada y flor blanca**. **Moño negro con
  teclas de piano y clave de sol**. El envoltorio trae partículas de notas musicales y un teclado.
  Familia B.
- **Metadata**: **Primordial** · los 4 poderes · sello `note`/`note` · desbloqueo: beta cerrada.
  Historia: nació del primer acorde que organizó el caos del Archivo Vivo; alinea memoria, atención y
  ritmo.
- **Elemento sugerido**: Sonido / Armonía (candidata a **Origin Cat del Sonido**).
- **Rol de combate**: Directora (buffs de equipo por ritmo de turnos; encadena combos).
- **Battle Form "Sonata Prima: Gran Finale"**: frac de directora de orquesta, batuta de luz y pentagrama
  dorado flotando alrededor. Aura de notas y ondas. Ojos ámbar con clave de sol. Pose de director con
  los brazos abiertos. **Ataque insignia: "Crescendo"**: cada aliado que ataca este turno suma una nota;
  con 4 notas, Sonata desata un acorde que golpea todos los módulos enemigos.

### steampunk_clockwork_cat.svg — 147 KB
- **Nombre (Educatione)**: Tictoque. **Nombre sugerido**: Tictoque.
- **Paleta**: arte `#fdf6e5` `#5d230c` `#f3a14a` `#7d3814` `#bf9886` · acentos `#e18246` `#fdc174`,
  verde azulado de la capa y las gafas · aura `#eac06b` `#8ee4ff` `#e49b51` (+ `#fff2cc`).
- **Rasgos visuales**: gato naranja y blanco con **chistera marrón, gafas de aviador turquesa con
  engranajes y pluma**. Arnés de cuero y **mochila caldera de latón con chimenea que echa vapor**.
  **Reloj de bolsillo** colgando. Engranajes en las patas (grebas de latón). Capa turquesa. **Cola
  mecánica de tubos de cobre con punta de pelo**. Caminando a la izquierda. Su envoltorio es el que más
  líneas tiene (32 `<line>`: engranajes dibujados).
- **Metadata**: Legendario · Fragmento · sello `gear`/`ring` · desbloqueo: practicar 5 días.
  Historia: regula el tiempo del estudio con engranajes; cuando el reloj del esfuerzo se llena, libera
  una pieza de respuesta.
- **Elemento sugerido**: Tiempo (secundario: Vapor/Tech). En el CHARLA aparece "Elemento tiempo".
- **Rol de combate**: Ingeniero (torretas y manipulación de turnos; acelera enfriamientos aliados).
- **Battle Form "Tictoque, Maquinista del Tiempo"**: la mochila se abre en un exoesqueleto de
  engranajes. Esfera de reloj gigante detrás (manecillas girando). Vapor a presión. Ojos con gafas
  encendidas. Pose ajustando un engranaje. **Ataque insignia: "Sobrecarga de Vapor"**: un cañón de
  vapor a presión que empuja módulos; pasiva "Cuerda": cada 3 turnos da un turno extra a un aliado.

### stormcloud_elemental_cat.svg — 151 KB
- **Nombre (Educatione)**: Nimbus. **Nombre sugerido**: Nimbus.
- **Paleta**: arte `#4e5e95` `#0e235c` `#7180b4` `#091536` `#8791bc` · acentos `#3562ba` `#5885d5`,
  celeste eléctrico de los rayos · aura `#d8ecff` `#64b5ff` `#498fff`.
- **Rasgos visuales**: **gato hecho de nubes de tormenta** gris-azul con **rayos azul eléctrico
  recorriéndolo**. Espiral de viento en la frente. Ojos azul eléctrico brillantes. Joyería de plata con
  **gotas de lluvia de cristal colgando**. **Cola de nube y tornado en S**. Patas como cúmulos. De pie
  y de frente, voluminoso.
- **Metadata**: Legendario · Eco de Error · sello `storm`/`bolt` · desbloqueo: practicar 8 días.
  Historia: vive entre tormentas de distracción; truena bajito para advertirte.
- **Elemento sugerido**: Tormenta (Viento + Eléctrico + Agua). Puente natural para combos
  Mojado→Rayo.
- **Rol de combate**: Artillero de área (lluvia que moja + rayos en cadena).
- **Battle Form "Nimbus, Juicio de la Tormenta"**: el cuerpo se expande en una supercelda y la cola es
  un tornado real. Rayos constantes. Ojos blancos-azules. Pose rugiendo con un relámpago detrás.
  **Ataque insignia: "Tormenta Perfecta"**: lluvia que deja todo el barco Mojado + 3 rayos que caen
  al azar y se encadenan por los módulos mojados.

### storybook_ink_cat.svg — 165 KB
- **Nombre (Educatione)**: Tinta. **Nombre sugerido**: Tinta ("Érase una Vez").
- **Paleta**: arte `#fefefe` `#504133` `#b69f86` `#342f29` `#675d54` · acentos `#e0c8ab`
  (pergamino), negro tinta · aura `#211818` `#c7a77d` `#5e4a43`.
- **Rasgos visuales**: gato con el **cuerpo de papel de libro antiguo** (texto impreso sobre la piel) y
  **manchas y salpicaduras de tinta negra** goteando. Antifaz de tinta sobre un ojo. Ojos ámbar.
  Medallón al cuello. **Cola de páginas de pergamino enrolladas con el texto "Once upon ink…"**.
  Caminando a la izquierda. Tiene restos de fondo blanco entre las patas.
- **Metadata**: Legendario · Pista Suave · sello `ink`/`glyph` · desbloqueo: completar 1 misión (de
  los primeros). Historia: nació entre márgenes subrayados y cuentos explicados en voz baja.
- **Elemento sugerido**: Mágico / Arcano (Tinta). El CHARLA menciona "elemento mágico" como
  descubrimiento.
- **Rol de combate**: Invocador (dibuja aliados o trampas temporales con tinta).
- **Battle Form "Tinta, Fin del Cuento"**: el cuerpo se vuelve trazo de tinta sumi-e vivo y la cola
  es un libro abierto del que salen palabras. Aura de salpicaduras y caligrafía. Ojos ámbar con
  manchas. Pose escribiendo en el aire con una pluma-cola. **Ataque insignia: "Y Vivieron... Hundidos"**:
  escribe "FIN" sobre un módulo enemigo; tras 2 turnos la palabra estalla en tinta y lo destruye. Si
  ese módulo cae antes, invoca un gato de tinta temporal.

---

## 3. Notas técnicas

### Estructura de los SVG (los 32 son iguales en lo esencial)

- `viewBox="0 0 1400 1400"`, `width/height=1400`. Tienen `role="img"`, `<title>` y `<desc>`.
- **Una sola** `<image x="73" y="73" width="1254" height="1254" href="data:image/webp;base64,…">`.
  El raster mide **700×700 px**, es WebP con pérdida (calidad 82) y tiene alfa. Pesa entre 60 y 141 KB
  y representa ~75 % del archivo. La parte vectorial solo pesa **3,6 a 6,7 KB**.
- **Capas vectoriales del envoltorio** (sin partes del gato):
  - `.shadow`: elipse de sombra en el suelo con animación de *squash*.
  - Halo: plantilla 1 = `.ring` (dos elipses discontinuas girando) + `.particle-blur` (círculos
    difuminados con pulso); plantilla 2 = `.halo` + `.glowCloud` (gradiente radial `bgAura` con pulso).
  - `.particle .p1…p5`: 4 o 5 partículas temáticas (círculos, paths de hoja, nota, gota o máscara,
    `rect` de código o píxel, `polygon` de cristal u origami, 32 `line` en los engranajes de steampunk)
    con `drift` y retrasos escalonados.
  - `.sprite`: el `<image>` con `bob` (flota 16 a 18 px y gira ±1°, ciclo de 4,6 a 4,8 s) y
    `filter:url(#glow)` (2 `feDropShadow` teñidos con los colores del aura).
  - `.shine`: elipse con gradiente radial blanco en `mix-blend-mode: screen` (*shimmer*).
- **Dos plantillas** según el lote:
  - Plantilla 1 (`ring`/`particle-blur`/`blurSoft`), 10 gatos: alien, jelly, lantern, mecha, molten,
    mushroom, neon, prism, regal y steampunk.
  - Plantilla 2 (`halo`/`glowCloud`/`softBlur`), los otros 22.
- **No hay ids ni clases útiles para animar partes** (ojos, orejas, cola, patas). Todo el gato es
  `.sprite`. Lo único recoloreable "por paths" son las partículas, el halo y la sombra (atributos
  `fill` y `stroke` con los hex del aura).
- Para el render estático el envoltorio usa CSS keyframes. En un `<img>` del navegador sí anima, pero
  muchos rasterizadores (resvg, Pixi, Quick Look) solo toman el fotograma 0.
- **Miniaturas** (`thumb/*.webp`): 320×320, WebP con pérdida y alfa, de 19 a 38 KB. Son el mismo
  raster reducido (no incluyen glow ni partículas).
- **Pesos**: SVG de 82 KB (origami) a 187 KB (regal). Total 4,5 MB los 32 SVG y 0,9 MB las 32
  miniaturas.
- **Proporción útil del lienzo**: el gato ocupa entre 31 % (neon) y 57 % (canelo, sonata) de los
  píxeles del raster de 700 px, así que el margen transparente es grande. Conviene recortar por canal
  alfa al empaquetar el atlas (Educatione ya tiene un `scripts/alpha-bbox.mjs` que lo hace para otros
  assets).

### Recomendación para un juego web (PixiJS / Canvas)

1. **Rasterizar y hacer atlas; no usar SVG en vivo.** Pixi convierte el SVG en textura de todos modos
   y pierde las animaciones CSS. Además los filtros SVG (`feDropShadow`, `feGaussianBlur`) son caros en
   el DOM con muchos gatos a la vez. Flujo sugerido:
   - Fuente: `raster-webp/*.webp` (o los PNG de 1254 px si se recuperan) → recorte por alfa →
     atlas por tamaño: **512 px** (isla y primer plano), **256 px** (batalla) y **128 px** (iconos y
     Catdex). Formato WebP o AVIF; KTX2/Basis si el número de gatos crece mucho.
   - Rehacer el envoltorio dentro de Pixi: *bob* con un tween de `y` y `rotation`, glow con
     `GlowFilter`/`AdvancedBloomFilter` de `pixi-filters` usando la tríada `summon.colors`, partículas
     con `@pixi/particle-emitter` usando el `particle_shape` de cada gato (`star`, `spark`, `bubble`,
     `leaf`, `petal`, `bolt`, `glyph`, `ring`, `square`, `note`). Toda esa info ya está en
     `_meta/cats-metadata.json`.
2. **Animación por partes**: hoy no se puede (bitmap único). Opciones de menor a mayor costo:
   - a) **Deformación por malla** sobre la imagen completa (Spine Mesh, DragonBones o `MeshPlane` de
     Pixi con huesos pintados por peso): da respiración, balanceo de cola y orejas y parpadeo con
     un *overlay* de párpado, sin redibujar nada. Es lo más rápido para la forma tierna de la isla.
   - b) **Recortar en capas** (cabeza, orejas, cola, cuerpo, patas, ojos) con *inpainting* de las
     zonas ocultas, montarlo en Spine y animar idle, salto y ataque. Sirve para unos 10 gatos clave.
   - c) **Battle Forms como arte nuevo** pensado desde el inicio en capas (PSD o Spine), con cel-shading.
     Es lo recomendable porque el estilo anime requiere redibujar de todos modos.
3. **Variantes de color e híbridos**:
   - *Hue-shift global* (`ColorMatrixFilter.hue`) es barato pero tosco: cambia también ojos, nariz rosa
     y oro de los accesorios. Solo sirve para variantes "shiny" rápidas.
   - **Recomendado: máscaras de región + gradient map.** Una vez por gato se genera una máscara RGBA
     (R = pelaje, G = acento o accesorio, B = ojos, A = efecto elemental), a mano o con un segmentador
     tipo SAM. En un shader se aplica un *gradient map* o LUT por canal. Así un híbrido Fuego×Agua
     toma la silueta de A, el pelaje con la rampa de B, los ojos de B y el aura de ambos.
   - **Capas de superposición elemental** (decals con modo de fusión): grietas de lava, venas de
     rayo, facetas de cristal, musgo, porcelana con grietas doradas o salpicaduras de tinta. Se reusan
     sobre cualquier silueta para generar combinaciones sin dibujar cada cruce.
   - **Intercambio de accesorio** (collar, moño, sombrero) como sprite aparte: es barato y comunica
     el "linaje".
   - "Recolor por paths" del SVG **solo aplica al envoltorio** (partículas y halo). Basta con
     reemplazar los hex del aura para que el glow combine con el híbrido.
4. **Limpieza previa recomendada**: corregir el intercambio deepsea↔masquerade; limpiar los restos de
   fondo blanco en `storybook_ink`, `cyber_bloom` e `iridescent_origami`; normalizar la orientación (todos
   mirando a la derecha) y la línea del suelo (sombra en la misma Y) para que se alineen en el barco.

### Metadata del juego original reutilizable

- **Rarezas de Educatione**: 19 Legendarios (1 poder), 10 Míticos (2 poderes) y 3 Primordiales (4
  poderes: Sonata Prima, Lumen Lens y Bytewhisker). Encaja con la idea de **Origin Cats** del CHARLA:
  los Primordiales pueden ser los "padres" de Sonido, Luz/Tiempo y Tech.
- **Lore global**: el Archivo Vivo, amenazado por **Distraxia, la Niebla del Olvido**, y los "Gatos
  del Recuerdo" que protegen a los aprendices. Distraxia tiene arte propio en el repo
  (`public/educatione/enemies/distraxia.webp`) y podría ser antagonista o boss de barco.
- **Sello de invocación** por gato (`motif`, `shape` y 3 colores): sirve directo como especificación
  de VFX.
- **Desbloqueos** en Educatione: por progreso real (conceptos, niveles, misiones, días, logros, beta).
  No se compran, una filosofía alineada con "sin tarjetazo".

### Resumen de elementos sugeridos (para el sistema de cruces)

| Elemento | Gatos (primario) | Posible Origin Cat |
|---|---|---|
| Fuego | molten_ember, canelo_cozy, sol_sunbeam | Brasa |
| Agua | jelly_aquatic, *arte abisal* (archivo masquerade) | Marina Gel |
| Naturaleza | menta, margarita, mushroom, arce, sakura, cyber_bloom (Tech) | Micelio |
| Tierra / Piedra | fossilstone (y kintsugi como secundario) | Relik |
| Eléctrico / Tormenta | mecha_neon, stormcloud | Volt Mecha |
| Tech / Digital | bytewhisker, neon_glitch, (steampunk, cyber_bloom) | Bytewhisker (Primordial) |
| Cósmico | alien_galaxy, regal_cosmic | Nova Real |
| Lunar / Oscuridad | nori_lunar, selene_moonlit | Nori Lunar |
| Espíritu | lantern_spirit, kintsugi | Luzterna |
| Luz / Cristal | prism_crystal, lumen_lens | Lumen Lens (Primordial) |
| Sonido | sonata_prima, mochi_bell | Sonata Prima (Primordial) |
| Viento / Cielo | iridescent_origami, nube_dream | Ori Prisma |
| Tiempo | steampunk_clockwork (y lumen_lens) | Tictoque |
| Alquimia / Mágico | candy_alchemist, storybook_ink | Dulcera |
| Sombra / Ilusión | *arte mascarada* (archivo deepsea) | Velo Noctis |

---

## 4. Archivos descargados y generados (rutas locales)

Raíz: `/Users/roor.osorio/Desktop/No one/assets/cats-source/` (166 archivos en total).

**Del repo (copia exacta, mismos bytes):**
- 32 SVG: `/Users/roor.osorio/Desktop/No one/assets/cats-source/<slug>.svg`
- 32 miniaturas: `/Users/roor.osorio/Desktop/No one/assets/cats-source/thumb/<slug>.webp`
- Extra (gata guía): `/Users/roor.osorio/Desktop/No one/assets/cats-source/_extra/guides/luzterna.webp`
- Metadata: `/Users/roor.osorio/Desktop/No one/assets/cats-source/_meta/educatione_cat_manifest.json`,
  `_meta/educatione_catalog.ts.txt` y `_meta/educatione_types.ts.txt`

**Generados aquí:**
- Raster original extraído de cada SVG (700 px, WebP sin recomprimir):
  `/Users/roor.osorio/Desktop/No one/assets/cats-source/raster-webp/<slug>.webp`
- PNG del gato solo (700×700, alfa): `/Users/roor.osorio/Desktop/No one/assets/cats-source/png/<slug>.png`
- PNG del SVG completo con glow, partículas y sombra (fotograma 0, Quick Look, 700×700):
  `/Users/roor.osorio/Desktop/No one/assets/cats-source/png/composite/<slug>.png`
- Hoja de contactos con los 32: `/Users/roor.osorio/Desktop/No one/assets/cats-source/png/_contact_sheet.png`
- Metadata unificada (manifest + sello + desbloqueo + paletas + rutas + incidencias):
  `/Users/roor.osorio/Desktop/No one/assets/cats-source/_meta/cats-metadata.json`

Slugs (32): alien_galaxy_cat, arce_autumn_cat, bytewhisker_cat, candy_alchemist_cat, canelo_cozy_cat,
cyber_bloom_cat, deepsea_sprite_cat, fossilstone_guardian_cat, iridescent_origami_cat,
jelly_aquatic_cat, kintsugi_tea_spirit_cat, lantern_spirit_cat, lumen_lens_cat, margarita_daisy_cat,
masquerade_phantom_cat, mecha_neon_cat, menta_botanical_cat, mochi_bell_cat, molten_ember_cat,
mushroom_druid_cat, neon_glitch_cat, nori_lunar_cat, nube_dream_cat, prism_crystal_cat,
regal_cosmic_cat, sakura_whisper_cat, selene_moonlit_cat, sol_sunbeam_cat, sonata_prima_cat,
steampunk_clockwork_cat, stormcloud_elemental_cat, storybook_ink_cat.

Código fuente consultado en el repo (solo lectura): `apps/educatione/scripts/educatione_cat_manifest.json`,
`scripts/build-cat-catalog.mjs`, `scripts/build-assets.mjs`, `src/domain/game/cats/{catalog,types,unlocks}.ts`,
`docs/archivo-vivo.md`, `docs/art-assets.md` y `docs/design.md`.
