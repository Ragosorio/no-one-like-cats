# NO ONE LIKE CATS — Banco de Referencias Pop y Humor
### Documento 09 · Investigación de cultura pop + escritura de humor
*Cute cats. Terrible consequences.*

> Este documento es la biblia de chistes, guiños y nombres del juego. Todo lo que está aquí es **parodia u homenaje original**: juegos de palabras, situaciones y nombres alterados. Ningún texto, letra, logo ni diseño se copia tal cual. Los bancos están también en `09-referencias-pop.json` para que el programador los importe directo.

---

## 0. Cómo usar este documento

| Sección | Qué hay | Para quién |
|---|---|---|
| 1. Fuentes | De dónde salen las referencias, por qué encajan y cuánto duran vigentes | Diseño, escritura |
| 2. Gatos | Banco de gatos parodia organizados por elemento, con rareza, rol, ataque y pasiva | Diseño, arte, balance |
| 3. Ataques | Ataques y ultimates con elemento, efecto y grito | Diseño de combate, VFX, voz |
| 4. Mundo | Barcos, módulos, islas, jefes, comida y edificios | Diseño, economía, arte |
| 5. Contenido | Misiones, logros, eventos flash, tips de carga, Catdex, mensajes de sistema, easter eggs | Escritura, UI, programación |
| 6. Voz y tono | Cómo habla el juego, los dos niveles de groserías, Spanglish, reglas para no envejecer mal | Todos |
| 7. Biblia del multiverso | Por qué existen gatos de otros universos y estilos; arco del Capítulo 1; setup de updates | Narrativa, arte |

**Convenciones del JSON:** elementos en minúsculas sin acento (`fuego, agua, naturaleza, tierra, electrico, viento, hielo, magia, cosmico, espiritu, void, chronos, multiverso`); rarezas `comun, raro, epico, legendario, mitico`. Cada gato trae `unlock` (`cap1`, `update2_void`, `update3_chronos`, `update4_multiverso`) calculado según sus elementos, `signature` apunta al `id` de un ataque del banco `attacks`, y todo trae `ref` (de dónde sale el guiño) para que el equipo legal y el de escritura sepan qué se está parodiando. Los textos con versión grosera traen `sinFiltro` / `textSinFiltro` / `nameSinFiltro`.

---

## 0.1 Reglas legales y de estilo (léelas antes de agregar contenido)

1. **Parodia sí, copia no.** Nombre alterado + situación reconocible + chiste propio. Ejemplo bueno: *Obi-Wan Catnobi* y su "Tengo la repisa alta". Ejemplo malo: un gato que se llame "Obi-Wan Kenobi" con túnica idéntica.
2. **Cero letras de canciones.** Ni una línea. Tampoco melodías reconocibles (ni el jingle del Centro Pokémon ni Megalovania): la música del juego es 100% original. Se pueden mencionar *títulos* o *conceptos* ("una música de 8 bits que no se te sale de la cabeza"), no reproducirlos.
3. **Citas famosas: sólo parafraseadas y torcidas.** "¡No pasarás!" → "¡No pasarás... por la puerta sin abrirme!". Frases cortas de uso popular en Latinoamérica ("fue sin querer queriendo", "¡que no panda el cúnico!") se usan como guiño, siempre dentro de un chiste nuevo y nunca como nombre de producto.
4. **Marcas registradas nunca como nombre de producto del juego.** Nada de "Pokémon", "Jedi", "Roomba", "Labubu", "Thundercats", "Minions" en nombres de objetos. Se altera: *Puntero Láser de la Purrza*, *Michions*, *Truenogatos*, "aspiradora robot".
5. **Diseños visuales: a un paso de distancia.** El Gato Combi es una combi latina con letrero de ruta, no el Gatobús. Gatogu no debe ser verde con orejas de Grogu: es un gatito cósmico diminuto con túnica de costal. Regla práctica: si al quitarle el nombre todavía se confunde con el personaje original, hay que cambiar silueta, paleta o accesorio.
6. **Personas reales: no.** Ni políticos, ni cantantes, ni influencers, ni streamers. Excepción respetuosa: homenajes históricos (Félicette, Tesla) sin burla.
7. **El chiste tiene que funcionar sin captar la referencia.** "Saitamiau es Común porque llenó mal el formulario" da risa aunque no conozcas One Punch Man. Si un chiste sólo funciona para quien vio la serie, se reescribe o se va a un easter egg.
8. **Nada de humor de odio.** Cero chistes por raza, religión, orientación, género, discapacidad o nacionalidad. Ojo con memes latinos que traen insultos capacitistas (p. ej. la frase más famosa de cierta villana de telenovela): se usa la *villana*, no el insulto.
9. **Nombres ya usados por juegos de gatos (evitar):** *Cat Quest III* ya usa "Purribean", "Pi-Rat King", "Meowtallika" y "Takomeowki"; Fortnite tiene a "Meowscles"; Exploding Kittens tiene cartas como "Tacocat" y "Hairy Potato Cat"; Neko Atsume tiene gatos como "Tubbs". No los usamos. "Hairy Pawter" es un juego de palabras genérico muy distinto de "Hairy Potato Cat", pero que legal lo revise.

> **Nota legal honesta:** este documento lo escribió el equipo de diseño, no un abogado. La parodia tiene más protección en EE.UU. que en otros países, y en México y Latinoamérica la regla es más estricta. Antes del lanzamiento comercial, hay que pasarle los nombres más cercanos al original (marcados con `ref` de franquicias activas) a un abogado de propiedad intelectual.


---

## 1. Fuentes de referencias (por categoría)

**Leyenda de vigencia:** 🟢 *Clásico* (no caduca: 10+ años en la cultura) · 🟡 *Vigente* (fuerte en 2024–2026, probablemente dure) · 🔴 *Caduca rápido* (meme del momento; sólo en eventos o easter eggs reemplazables).

### 1.1 Anime (la columna vertebral del Battle Form)

El juego tiene un "modo tierno" en la isla y un "modo anime" en batalla. El anime es el lenguaje natural de las transformaciones, los ataques gritados y los poderes absurdos. Además, Latinoamérica creció con anime doblado: Dragon Ball, Caballeros del Zodiaco, Sailor Moon y Pokémon son memoria colectiva. En invierno de 2026, *Frieren* (temporada 2) y *Jujutsu Kaisen: El Juego del Sacrificio* fueron los dos anime más vistos, así que esas dos referencias están en su punto.

| Referencia | Vigencia | Por qué encaja | Cómo la usamos |
|---|---|---|---|
| **Dragon Ball** (doblaje latino) | 🟢 | Es EL anime de Latinoamérica. Transformaciones, rayos cargados, fusión. El "¡es más de 8,000!" latino es un chiste que sólo entendemos aquí. | Gatoku, Vegata, Frízer (Freezer = congelador), Michilín (siempre muere), Kamehamiau, la Resonancia como Danza de la Fusión, Croqueta del Ermitaño, Habitación de la Siesta y el Tiempo, las Siete Esferas del Gato. |
| **One Piece** | 🟢 | ¡Es de BARCOS Y PIRATAS! Tripulación con roles, barcos con personalidad, despedidas emotivas de barcos, frutas que impiden nadar (los gatos tampoco quieren). | Going Meowy (barco inicial con funeral vikingo), Thousand Sunbeam, Bigotes Blancos y "la Última Croqueta es real", Sanmichi (cocinero), Garroro Zoro (se pierde), Sogekitty (mentiroso), Namiau, Gear Miau (modo caricatura). |
| **Jujutsu Kaisen** | 🟡 | Expansiones de dominio = ultimates de área perfectos. Gojo es el personaje más memeado del anime reciente. | Satoru Gato y su "Expansión de Dominio: Bola de Estambre Infinita", Morado Hueco, Ryomen Sukunyan y su Santuario Malévolo... de arena. |
| **Demon Slayer** | 🟡 | "Respiraciones" con posturas numeradas = ataques con nombre gritado. Nezuko vive en una caja (¡una gata en caja!). | Gatanjiro, Michizuko, Zenmichi (sólo pelea dormido: los gatos duermen 16 h). |
| **Naruto** | 🟢 | Clones, ataques de esfera, "Talk no Jutsu" (meme de convencer villanos hablando). | Narumiau, Rasenbola, Gato Bunshin, Charla no Jutsu (convierte enemigos), Kakamichi (siempre tarde), Aldea Oculta entre las Cajas, Ichimichi Ramen. |
| **Hunter x Hunter** | 🟢 | Piedra-papel-tijera como ataque (Jajanken) = mecánica aleatoria divertida. | Killmiau, "¡Piedra, Papel o Garra!". |
| **Chainsaw Man** | 🟡 | Tono irreverente y violento-cómico; el gato de Power. | Inspiración de tono para jefes; referencia ligera (sin personajes directos). |
| **Frieren** | 🟡 | La maga milenaria que colecciona hechizos inútiles y cae en cofres mímicos: perfecto para Chronos y para la regla "rareza ≠ poder" (su hechizo más letal es el "ordinario"). | Frierin, Magia Ofensiva Ordinaria, Biblioteca de Hechizos Inútiles, Cofre Mímico. |
| **Spy x Family** | 🟡 | Familia falsa con secretos; telepatía tierna. | Anya Forgato (ve el próximo objetivo enemigo). |
| **Evangelion** | 🟢 | "Súbete al robot", campo AT, modo berserk, el final de "felicidades". | Misión "Súbete al Barco, Michi", Campo A.T. (Absoluto Territorio: los gatos son territoriales), Unidad Gata-01, logro "Felicidades". |
| **Sailor Moon** | 🟢 | Luna y Artemis SON GATOS que hablan con media luna en la frente. Transformaciones con listones. | Lunática, "¡Poder del Prisma Michi!", evento Noche del Prisma. |
| **Pokémon** | 🟢 | Colección, "¿Quién es ese Pokémon?", Magikarp inútil que evoluciona en bestia, Snorlax bloqueando el camino, el Equipo Rocket y su lema. | "¿Quién es ese Michi?" (revelación de Resonancia), Gatocarpa → Gyaramichi, Gordolax, Equipo Croqueta, Centro Michimón. |
| **JoJo's Bizarre Adventure** | 🟢 | Detener el tiempo, ráfagas de golpes, poses, la flecha de "To Be Continued". | ZA MIAURUDO (Chronos), GARRA GARRA GARRA, Gatarou, DIO Brandmiau, la flecha "CONTINUARÁ →" del final. |
| **Attack on Titan** | 🟢 | El titán que se asoma por la muralla = un gato gigante asomándose sobre tu isla. Tres murallas. | El Michi Colosal, Muralla Michi-Rosa-Siamesa, Gancho de Maniobras de Estambre. |
| **Studio Ghibli** | 🟢 | Ya tiene un gato-autobús, un demonio de fuego en un motor, una niña pez, un barón gato. La estética "Ghibli" fue además la tendencia visual de 2025. | Gato Combi (combi latina, no el gatobús), Calcifur, Ponmiau, Yiyi, Barón Bigotes, Sin Bigotes, Spa de la Abuela Garras, El Castillo en el Cielo (con el chiste latino del título original). |
| **Doraemon** | 🟢 | ¡Un gato robot del futuro con bolsillo 4D! Chronos + Multiverso en un personaje. | Doramichi, Bolsillo 4D, Gatera a Cualquier Parte, Dorayaki de Atún. |
| **Chi's Sweet Home / Natsume** | 🟢 | Gatos realistas y tiernos; un espíritu poderoso atrapado en un gato de la suerte. | Tono de la isla (modo tierno), Sensei Panzón, logro "Hogar, Dulce Caja". |
| **Los Caballeros del Zodiaco** (doblaje latino) | 🟢 | Leo es un caballero LEÓN y su técnica se llama "Plasma Relámpago" (y nosotros tenemos elemento Plasma). "Enciende tu cosmos" es memoria latina. | Michi de Leo, Lluvia de Meteoros de Pegagato. |
| **Supercampeones** (Captain Tsubasa) | 🟢 | La cancha infinita y el tiro que tarda tres episodios; el "Tiro del Tigre" (¡un felino!). | Oliver Atún, Tiro del Tigre. |
| **Mazinger Z** | 🟢 | "¡Puños fuera!" en voz de doblaje setentero; muy querido en Latinoamérica y España. | Mazinmichi Z, "¡Garras Fuera!". |
| **One Punch Man / Death Note / Digimon** | 🟢 | Héroe aburrido de ganar; la libreta; "digievolución". | Saitamiau (esfinge pelón, Común), "Michievolución" como texto de subir estrellas. |

### 1.2 Películas

El usuario pidió explícitamente Harry Potter y "muchas películas". Las películas dan **situaciones** reconocibles (no sólo nombres), y eso es oro para misiones y logros. En 2026 salen *La Odisea* de Nolan (julio), *Spider-Man: Brand New Day* (julio), *Toy Story 5*, *Dune: Parte Tres* y *Avengers: Doomsday* (diciembre), así que esas referencias van a estar en el aire durante el lanzamiento.

| Referencia | Vigencia | Por qué encaja | Cómo la usamos |
|---|---|---|---|
| **Harry Potter** | 🟢 | Magia, casas, hechizos con nombre gritado, McGonagall SE CONVIERTE EN GATA. | Hairy Pawter, Purrfessor Meowgonagall (se convierte en humana: terror), Severus Siamés, Hermiaune, Michi Dobby (calcetín), Expelliarmichis, Wingardium Miausa, Expecto Gatronum, Alohomiau, Accio Atún, Colegio Hogmichi, Banco de Gringatts, Ratón Dorado. |
| **Spider-Man: Un Nuevo Universo / A través del Spider-Verso** | 🟢 | Es literalmente la dirección de arte del juego: estilos visuales mezclados, cada personaje con su propio "trazo", eventos canónicos, la Sociedad. | Toda la biblia del multiverso (sección 7), Miguel O'Garra, Gato-Punk, Chat Noir, Manchas, Michi Señalando a Michi, Evento Canónico: El Vaso. |
| **Star Wars** | 🟢 | La repisa alta (high ground) = comportamiento real de gatos. El puerto de escape de la Estrella de la Muerte = jefe final con debilidad ridícula. | Obi-Wan Catnobi, Darth Siamés, Purrbacca, Millennium Furcon, Bola de Estambre de la Muerte, Gatogu, Casco de Gatskar. |
| **Piratas del Caribe** | 🟢 | Piratas, barcos malditos, ¿por qué se acabó el ron? | Capitán Jack Purrow, The Black Purrl, Davy Garras, ¡Parlamiau! |
| **Matrix** | 🟢 | Neo → **Neko** (gato en japonés): el juego de palabras perfecto. El déjà vu ES un gato negro. | Neko el Elegido, Tiempo Bala Felino, easter egg Déjà Miau, Nabucodonomichi. |
| **El Señor de los Anillos** | 🟢 | "No pasarás", el segundo desayuno, Gollum y su tesoro, el Ojo, Bárbol que tarda tres días en saludar. | Gatalf el Gris → el Blanco, Gatollum, Bigotárbol, Monte Arenero del Destino, Lembas, Ojo de Gatón. |
| **Interstellar** | 🟢 | Dilatación del tiempo = Chronos. TARS y su ajuste de humor. | Endurance-Miau, tip "una siesta = siete horas", easter egg Ajuste de Honestidad. |
| **Gladiador** | 🟢 | "¿No están entretenidos?" = taunt perfecto; el discurso del nombre. | Maximus Decimus Miauridius. |
| **Shrek / El Gato con Botas** | 🟢 | El doblaje latino de Shrek es legendario. El gato con botas viene de un cuento de Perrault (dominio público). Los ojos de súplica. Las nueve vidas. | El Gato con Chanclas, Ocho de Nueve, Lord Perrquaad, Cebolla de Ogro (dato real: los gatos no pueden comer cebolla). |
| **Toy Story** | 🟢 | "Al infinito y más allá", los marcianitos que veneran a La Garra (¡garra!). | Buzz Lightmiau, Los de La Garra, Templo de La Garra, misión "Hay un Gato en Mi Bota". |
| **Ratatouille** | 🟢 | Una rata que controla a un humano jalándole el pelo → una rata piloteando un gato gigante. El flashback del crítico. | Chef Ratatuí (jefe), Ratatouille de Sardina con flashback. |
| **Barbie / Oppenheimer** | 🟡 | "Barbenheimer" fue el meme de cine de la década. "Kenough". "Ahora me he convertido en..." | Oppengatímer, evento Michenheimer, logro "Soy Michiciente". |
| **Dune** | 🟡 | "La especia debe fluir" → el atún debe fluir. El gusano gigante = el arenero. | Arenakis, Especia de Atún, Shai-Arenero. |
| **Jurassic Park** | 🟢 | ADN en ámbar → pulga en ámbar. "La vida se abre camino." | Michisaurus Rex, Jurásic Purrk. |
| **Titanic** | 🟢 | Barco "insumergible", iceberg (Hielo), "había espacio en la puerta", "han pasado 84 años", la proa. | RMS Gatanic, misiones y logros, tip de carga. |
| **Flow** (2024) | 🟡 | Un gato en un velero durante un diluvio. Ganó el Óscar a Mejor Película Animada. Es básicamente nuestro juego sin cañones. | Michi del Diluvio; el capibara de primer oficial (El Capi). |
| **Coco / Día de Muertos** | 🟢 | Alebrijes, Catrina, ofrenda, puente de cempasúchil (todo tradición mexicana, no propiedad de Disney). | La Gatrina, Alebrijita, Ofrenda, Mictlán de los Michis. |
| **Matrix, Terminator, Volver al Futuro, E.T., Indiana Jones, Forrest Gump, Tiburón** | 🟢 | Frases y situaciones que todo el mundo conoce aunque no haya visto la película. | Gatominator, Marty McMiau, E.T. el Extra-Gato, Indiana Garras, Forrest Gato, "Vas a necesitar un barco más grande". |
| **Godzilla, Lilo & Stitch, Frozen, Mary Poppins, Minions, Wall·E, Up, Intensa-Mente** | 🟢 | Personajes-concepto fáciles de gatificar. | Gatzilla, Experimento 6-2-Miau, Reina Gatelsa, Gatolaf, Michi Poppins, Michions, Gat-E. |
| **Una película de Minecraft** (2025) | 🔴/🟡 | "¡Chicken jockey!" se volvió fenómeno en salas de cine. | "¡MICHI JINETE!" (easter egg), Pollo de Lava. |
| **Las Guerreras K-Pop** (2025) | 🟡 | Fue el fenómeno animado de 2025 en Netflix: ídolos que cazan demonios con canciones y una barrera mágica. | Jefe "Los Saja Michis" y escudo "Barrera Honmiau" (sin canciones, sólo el concepto). |
| **Cats (2019)** | 🟢 (como meme) | La "tecnología de pelaje digital" es el meme de horror felino definitivo. | Michi del Musical Maldito (Mítico, Multiverso, "lo sentimos"). |
| **La Odisea** (Homero / Nolan 2026) | 🟢 | Odiseo le dice al cíclope que se llama "Nadie". Encaja perfecto con el título del juego. | El villano NADIE y el barco "La Nadie" (sección 7). |


### 1.3 Series

| Referencia | Vigencia | Por qué encaja | Cómo la usamos |
|---|---|---|---|
| **Breaking Bad** | 🟢 | "Yo soy el que toca la puerta" → "yo soy el que tumba" (los gatos tiran cosas). El químico de sombrerito = candy_alchemist_cat. Los Pollos Hermanos. | Heisenbergato, Catnip Azul 99.1%, Los Pescados Hermanos, el abogado gato del easter egg de la tele. |
| **Stranger Things** (terminó en 2025) | 🟡 | El Mundo del Revés = Void. Once tira cosas con la mente (como gato). Vecna y su reloj = Chronos. Las luces de Navidad. | Michi Once, Demogorgato, El Mundo Patas Arriba, Vecmiau, easter egg de las lucecitas. |
| **Game of Thrones** | 🟢 | "Se acerca el invierno" = desbloqueo de Hielo. Títulos larguísimos. Dracarys. La caminata de la vergüenza (= "cat shaming"). | Khaleesimiau, Michi Nieve, Rey de la Siesta Nocturna, ¡GATARYS!, Más Allá del Muro. |
| **The Office** | 🟢 | "¡Declaro bancarrota!" = perder en la lotería. | Logro "¡Declaro Bancarrota!". |
| **Los Simpson** (doblaje latino) | 🟢 | Bola de Nieve II (gatos reemplazados), la señora que lanza gatos (¡artillería felina!), la Casita del Horror, la aurora boreal en la cocina. | Bola de Nieve V, Gatapulta, La Casita del Horror, evento Aurora Boreal, "el aliento de mi gato huele a comida de gato". |
| **Rick and Morty** | 🟢 | Multiverso, Pickle Rick (y los gatos le temen a los pepinos), cable interdimensional, la Ciudadela. | Michi C-137, ¡Michi Pepinillo!, Ciudadela de los Michis, Antena de Cable Interdimensional. |
| **The Mandalorian** | 🟡 | "Este es el camino", Grogu comiendo huevos ajenos, beskar. | Gatogu, Casco de Gatskar, misión "Este Es el Camino". |
| **El Juego del Calamar** | 🟡 | "Luz roja, luz verde" = los gatos sólo se mueven cuando no los ves (¡real!). Dalgona. | Evento Michi Rojo, Michi Verde; El Juego del Calamarí; Dalgona con Forma de Pescado. |
| **Avatar: La Leyenda de Aang** | 🟢 | Cuatro elementos, el Tío Iroh y su té (kintsugi_tea_spirit_cat nació para esto), el vendedor de coles. | Aangora (gato angora + Aang), Tío Michiroh, Topha, Bumerán Fiel, "¡¡MIS SARDINAS!!". |
| **Merlina / Los Locos Addams** | 🟡 | En Latinoamérica se llama Merlina (no Wednesday): guiño local. La mano que camina sola. | Merlina Gatams y su patita. |
| **Thundercats, He-Man, Don Gato y su Pandilla, Tom y Jerry, Garfield** | 🟢 | Caricaturas con gatos que la generación de los papás ama. He-Man tiene un gato miedoso que se transforma en tigre de guerra: ES nuestra mecánica. | Michi-O, Gato Miedoso / Gato de Batalla, Benito Bodoquito, Tomás de Caricatura, Lasañeitor, Momia-Ra. |

### 1.4 Videojuegos

| Referencia | Vigencia | Por qué encaja | Cómo la usamos |
|---|---|---|---|
| **The Legend of Zelda** | 🟢 | "Es peligroso ir solo", el hada molesta, Koroks escondidos, la espada en la piedra. | Misión 2, easter egg ¡Oye! ¡Escucha!, los 9 Gatitos Escondidos, Balista de la Garra Maestra. |
| **Mario** | 🟢 | "Tu princesa está en otro castillo", la estrella de invencibilidad, el caparazón azul. | Tip "tu croqueta está en otro barco". |
| **Dark Souls / Elden Ring** | 🟢 | "YOU DIED", "Let me solo her", mensajes en el piso, cofres mímicos. | Mensaje de derrota "TE MORISTE (pero +XP)", logro Déjame Solearlo, Cofre Mímico. |
| **Pokémon** | 🟢 | Ver anime. | — |
| **Minecraft** | 🟢 | Los creepers les tienen miedo a los gatos (mecánica real del juego). Estilo de bloques = universo visual. | Michi Cuadrado (antiexplosivos), ¡MICHI JINETE!. |
| **Among Us** | 🟡 | "Sus", el impostor, reunión de emergencia. | Evento Un Perro Entre Nosotros, logro "Era Sus". |
| **Balatro** | 🟡 | Multiplicadores visibles, sinergias rotas, la dopamina de ver números crecer. Inspiración directa de diseño (CHARLA). | Cat's Gambit y los multiplicadores de momentum. No se parodian sus nombres: se copia la *sensación*. |
| **Mortal Kombat** | 🟢 | "¡Ven pa'cá!" y los fatalities; rivalidad fuego vs. hielo. | Scorpimiau, Sub-Michi, ¡GATALITY!, Arpón. |
| **Metal Gear Solid** | 🟢 | Esconderse en una caja de cartón. Los gatos ya lo hacen. | Caja Táctica con el "!" gigante. |
| **Undertale** | 🟢 | "Te llena de DETERMINACIÓN" y el perro molesto. | "Te llenas de GATTERMINACIÓN" (guardado, logro). |
| **Hi-Fi Rush** | 🟡 | El compañero es un gato robot (808) y todo va al ritmo. | Gato 808, La Serenata. |
| **Hollow Knight: Silksong** | 🔴 | Fue el "nunca va a salir" de internet durante años... y salió en 2025. | Easter egg "Ya Salió". |
| **GTA VI** | 🔴 | Programado para el 19 de noviembre de 2026. El chiste "salió antes que GTA VI" caduca ese día. | Easter egg con texto que cambia por fecha (ejemplo de cómo manejar chistes con caducidad). |
| **Sonic, Kirby, Pikmin, Street Fighter, Tetris** | 🟢 | Velocidad, enjambres, poses. | Michi Sónico, Pikmichis. |

### 1.5 Memes de internet (gatos y generales)

Los memes de gatos son la materia prima natural: el juego es, básicamente, un meme de gatos con presupuesto. **Regla:** los memes *clásicos de comportamiento gatuno* (tirar vasos, cajas, pepinos, zoomies) son eternos porque son comportamiento real. Los memes *de formato* (6-7, brainrot italiano, aura farming) caducan y van en eventos o easter eggs.

| Meme | Vigencia | Uso en el juego |
|---|---|---|
| Gatos tirando cosas de la mesa | 🟢 | Pilar del lore: el "Evento Canónico" que mantiene estable el multiverso. |
| "If I fits, I sits" (cajas) | 🟢 | Escudo de cartón, Caja Táctica, la cama de 800 pesos que nadie usa. |
| Gatos vs. pepinos | 🟢 | ¡Michi Pepinillo!, Lanzapepinos, easter egg (con nota de bienestar animal). |
| Zoomies de las 3 a.m. | 🟢 | Michi Sónico, mensaje de las 3 a.m. |
| "Los gatos son líquidos" (premio Ig Nobel 2017) | 🟢 | Michi Líquido. |
| Gatos naranjas con una sola neurona | 🟡/🟢 | Canelo y la mecánica Neurona Naranja. |
| Cat loaf (gato en posición de pan) | 🟢 | Michi Hogaza / Modo Hogaza. |
| Mujer gritándole a un gato (el gato blanco en la mesa) | 🟢 | Michi Ensalada. |
| Nyan Cat | 🟢 (nostalgia) | Michi Tostada Arcoíris. |
| Gato que gira (OIIA) / banana cat (2024) | 🟡 | Michi Giratorio, Michi Plátano. |
| Spider-Man señalando a Spider-Man | 🟢 | Duplicados y Michi Señalando a Michi. |
| "Absolute Cinema" | 🟡 | Logro de ver ultimates. |
| Aura farming (2025, el niño bailando en la proa de un bote) | 🔴/🟡 | ¡Es en un bote! Logro y easter egg de la proa. |
| 6-7 (meme #1 de 2025 según Know Your Meme) | 🔴 | Michi Seis-Siete; easter egg al nombrar un gato "67". Marcado como caducable. |
| Brainrot italiano (2025) | 🔴 | Evento La Grieta Brainrot y Gattolino Bombardino; nombres originales al estilo, no los nombres existentes. |
| 2016 de vuelta ("2026 is the new 2016": bottle flip, mannequin challenge) | 🔴 | Logros Botella Volteada y Reto del Maniquí (funcionan aunque se olvide la tendencia). |
| Capibaras (el animal más 'tranqui' de internet) | 🟡 | El Capi, primer oficial del barco: "Nadie quiere a los gatos, pero todos quieren al capibara". |
| "Clanker" (insulto de 2025 contra robots e IA) | 🔴 | **No usar**: está en zona gris como insulto. Los gatos robot se defienden con chistes propios. |
| Memes políticos y de personas reales del top 2025 | — | **Fuera.** Ni uno. |

### 1.6 Cultura latina (el sabor que nos hace únicos)

Esto es lo que ningún otro juego de gatos tiene. El humor del creador es mexicano-latinoamericano; la base es mexicana, con guiños panlatinos para que funcione de Tijuana a la Patagonia.

| Fuente | Por qué encaja | Uso |
|---|---|---|
| **El Chavo del 8** | Humor blanco, frases que todo latino conoce, un niño que vive en un barril (= gato en caja). | El Michi del 8, La Gata del 71, Señor Barriga (jefe al que siempre le cae un gato encima), La Vecindad, Torta de Jamón, Agua de Limón que Parece de Jamaica... |
| **El Chapulín Colorado** | Antenitas de vinil, chipote chillón, chiquitolina, "no contaban con mi astucia", "que no panda el cúnico". | El Chapulín Michirado, Ratoncito Chillón, Croqueta Chiquitolina, Antenitas de Vinil. |
| **Telenovelas** | Zoom triple, gemelas malvadas, villanas con parche, desmayos dramáticos. | Gatalina Creel, La Usurgata, efecto ¡¿QUÉEE?! *zoom zoom zoom* al sacar rarezas. |
| **Yo soy Betty, la fea** | Clásico panlatino (Colombia): la fea brillante con la mejor contabilidad. | Michi la Fea (gata de economía). |
| **Doblaje latino** | Más de 8,000, "¡Kakaroto!", Freezer, Bruno Díaz, Merlina, "Fondo de Bikini". | Nombres y chistes que sólo pegan en español latino. |
| **La chancla, la cuenta de mamá, la abuela que te da de comer** | Memes universales de familia latina. | Chancla Teledirigida, "Uno... dos... dos y medio...", Abuelita Panzona, el tóper que trae frijoles. |
| **Vendedores ambulantes** | Fierro viejo, el afilador, el tamalero, el merenguero que juega volados. | Eventos micro y el Puesto del Merenguero (Cat's Gambit). |
| **Juegos tradicionales** | Lotería, pirinola, volado, truco argentino. | Cat's Gambit: Volado, Pirinola, Lotería Michi, Truco (subir apuestas: truco → retruco → vale cuatro). |
| **Fútbol** | "¡GOOOOL!", "jugamos como nunca, perdimos como siempre", el quinto partido, la ola del 86. Mundial 2026 en México. | ¡GATOOOOL! (críticos), mensajes de derrota, logros, La Ola del 86. |
| **Comida** | Tacos, tamales, ceviche, arepas, mate, michelada, pan dulce. | Banco de comida con juegos de palabras. |
| **Folclor** | La Llorona, alebrijes, Catrina, Día de Muertos, Mictlán, limpias con huevo, martes 13. | La Maullona, Alebrijita, La Gatrina, Ofrenda, Limpia con Huevo, easter egg martes 13. |
| **Frases de internet latino** | "Ola k ase", "ahorita", "pregúntale a tu madre", "si voy y lo encuentro". | Logros, mensajes de sistema y misiones. |

### 1.7 Dominio público y mitos (sin riesgo legal, mucho potencial)

Perrault (*El Gato con Botas*), Lewis Carroll (Gato de Cheshire), Julio Verne (Nautilus), Melville (Moby Dick), Oscar Wilde (El Fantasma de Canterville), Barrie (Peter Pan), Homero (*La Odisea* y "Nadie"), mitología griega y nórdica (Sísifo, Thor, Olimpo), leyendas latinas (Llorona, fuego fatuo), el Holandés Errante, el experimento de Schrödinger, el cartel *Le Chat Noir* (1896), Félicette (historia real). **Úsenlos sin miedo**: son la fuente más segura y más elegante del banco.

### 1.8 Lo que aprendimos de otros juegos

| Juego | Lección para NO ONE LIKE CATS |
|---|---|
| **Borderlands** | Casi todo es referencia, pero funciona porque el mundo tiene voz propia. *Lección:* las referencias van encima de un tono original, no en su lugar. |
| **Fortnite** | Colabora con marcas porque paga licencias. *Lección:* nosotros no; parodiamos. Ya tienen un gato musculoso ("Meowscles"): evitamos ese terreno. |
| **Hi-Fi Rush** | Un gato robot de compañero + todo al ritmo = personalidad instantánea. *Lección:* una mecánica chiquita con chiste (Gato 808) vale más que diez nombres. |
| **Cult of the Lamb** | Tierno por fuera, oscuro por dentro. *Lección:* es literalmente "Cute cats. Terrible consequences." El contraste es la marca. |
| **Stardew Valley** | La carta del abuelo, los Junimos, la elección perro/gato al inicio. *Lección:* la calidez gana jugadores; el chiste es la sazón. |
| **Undertale** | Humor en mensajes de sistema y guardado. *Lección:* cada texto de UI es una oportunidad de chiste. |
| **Balatro** | La dopamina es visual: números que crecen y multiplicadores que explotan. *Lección:* el narrador grita "¡GATOOOOL!" con el multiplicador. |
| **Neko Atsume** | Los gatos visitan si les dejas juguetes; colección sin estrés. *Lección:* la isla debe dejar que los gatos hagan cosas solos y graciosas. |
| **Cat Quest III** | Ya hizo "gatos piratas con barcos y puros juegos de palabras". *Lección:* nuestra diferencia es el Spider-Verso, la cultura latina y el combate de artillería; no competir en el chiste "pirata-gato" básico. Evitar sus nombres. |
| **Stray** | Un gato que tira cosas y aprieta botones en un mundo de robots es suficiente para emocionar. *Lección:* el comportamiento real de los gatos es el mejor chiste. |
| **Exploding Kittens** | Gatos + explosiones + cartas absurdas. *Lección:* lo absurdo vende si es visual; evitar sus nombres de cartas. |
| **Shrek** | Parodia de cuentos que no envejeció porque los personajes tenían corazón. *Lección:* cada gato parodia debe tener una emoción propia (Michilín siempre muere pero siempre vuelve; Ocho de Nueve sabe que le queda una). |

### 1.9 Fuentes consultadas en la investigación (2024–2026)

- Rolling Stone, "The 25 Best Memes of 2025": https://www.rollingstone.com/culture/culture-lists/best-memes-2025-1235467154/
- Know Your Meme, "Meme Of The Year: The Top 20 Memes Of 2025": https://knowyourmeme.com/editorials/poll/meme-of-the-year-the-top-20-memes-of-2025
- Daily Dot, "30 of the best memes of 2025": https://dailydot.com/best-memes-2025
- Wikipedia, "2026 is the new 2016": https://en.wikipedia.org/wiki/2026_is_the_new_2016
- Azteca Laguna, trends y memes virales de 2025 (6-7, farmear aura, Labubu, filtros Ghibli, cónclave): https://www.aztecalaguna.com/viral-y/notas/trends-2025-los-momentos-y-memes-mas-virales-del-ano/
- Milenio / Infobae / El Universal, memes mexicanos 2025: https://www.milenio.com/virales/estos-son-los-mejores-memes-por-el-15-de-septiembre-2025
- LiveChart, anime más popular de invierno 2026: https://www.livechart.me/rankings/anime?metric=popularity&season=winter&year=2026
- The Hollywood Reporter, estrenos 2026: https://www.hollywoodreporter.com/lists/2026-new-movie-releases/
- Wikipedia, *Flow* (2024): https://en.wikipedia.org/wiki/Flow_(2024_film)
- Wikipedia, *Cat Quest III* (nombres a evitar): https://en.wikipedia.org/wiki/Cat_Quest_III
- Wikipedia, *Grand Theft Auto VI* (fecha 19/11/2026): https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI
- Meme Wiki, *Chicken Jockey*: https://meme.fandom.com/wiki/Chicken_Jockey · Wikipedia, *KPop Demon Hunters*: https://en.wikipedia.org/wiki/KPop_Demon_Hunters
- Borderlands Wiki, referencias pop: https://borderlands.fandom.com/wiki/Borderlands_2_pop_culture_references
- Cheezburger, tuits de gatos más virales de 2025: https://cheezburger.com/43738885/50-most-viral-cat-tweets-of-2025-to-fill-the-rest-of-your-year-with-pawsitivity-and-laughs


---

## 2. Banco de gatos parodia

**137 gatos**, agrupados por su elemento principal (el primero de la lista). Rareza sugerida, rol de combate, ataque firma (ver sección 3) y pasiva. `Base` indica qué arte existente de los gatos de Rationale (ver `01-gatos-inventario.md`) puede servir de punto de partida para su forma en la isla.

**Distribución:**

| Elemento | Gatos | Común | Raro | Épico | Legendario | Mítico |
|---|---|---|---|---|---|---|
| 🔥 Fuego | 12 | 2 | 4 | 2 | 1 | 3 |
| 💧 Agua | 10 | 2 | 4 | 2 | 2 | 0 |
| 🌱 Naturaleza | 11 | 6 | 1 | 3 | 1 | 0 |
| 🪨 Tierra | 15 | 3 | 5 | 4 | 2 | 1 |
| ⚡ Eléctrico/Plasma | 11 | 0 | 3 | 3 | 4 | 1 |
| 🌪️ Viento | 12 | 3 | 3 | 3 | 3 | 0 |
| ❄️ Hielo | 8 | 2 | 2 | 2 | 1 | 1 |
| ✨ Magia/Arcano | 11 | 1 | 3 | 3 | 2 | 2 |
| 🌌 Cósmico | 12 | 1 | 3 | 2 | 4 | 2 |
| 👻 Espíritu | 10 | 1 | 3 | 4 | 2 | 0 |
| 🕳️ Void | 8 | 0 | 0 | 3 | 2 | 3 |
| ⏳ Chronos | 5 | 0 | 1 | 1 | 2 | 1 |
| 🌀 Multiverso | 12 | 4 | 1 | 2 | 3 | 2 |

### 🔥 Fuego (12)

- **Gatoku** · 🔥 Fuego · *Legendario* · Artillero · Cap. 1 · Base: `canelo_cozy_cat`  
  Llegó del espacio en una cápsula del tamaño de una caja de zapatos. Saluda con '¡Hola, soy Gatoku!', se come 47 croquetas y pregunta si hay postre. Su nivel de pelea es MÁS DE 8,000 (versión latina, la buena).  
  **Ataque:** Kamehamiau · **Pasiva:** Saiyagato: bajo 30% de HP el pelo se le pone dorado y su daño sube x2.  
  <sub>Ref: Dragon Ball (doblaje latino)</sub>
- **Vegata, Príncipe de los Siameses** · 🔥 Fuego · *Épico* · Destructor · Cap. 1 · Base: `molten_ember_cat`  
  Orgulloso hasta la médula. Le dice 'insecto' a todo, incluida la aspiradora. Odia que Gatoku siempre llegue primero al plato.  
  **Ataque:** Resplandor Final de Bigotes · **Pasiva:** Orgullo de Príncipe: +25% daño si Gatoku va en el mismo barco, pero discuten y pierden 1 turno cada 5.  
  <sub>Ref: Dragon Ball (Vegeta)</sub>
- **Canelo, Portador de la Neurona** · 🔥 Fuego · *Común* · Artillero · Cap. 1 · Base: `canelo_cozy_cat`  
  Todos los gatos naranjas del multiverso comparten una sola neurona. Hoy le toca a Canelo. Mañana, quién sabe.  
  **Ataque:** Bola de Pelo Incendiada · **Pasiva:** Neurona Naranja: entre tus gatos naranjas sólo uno por turno tiene la neurona (+50% precisión). Rota cada turno.  
  <sub>Ref: Meme: todos los gatos naranjas comparten una sola neurona</sub>
- **Calcifur** · 🔥 Fuego / ✨ Magia/Arcano · *Raro* · Soporte · Cap. 1 · Base: `lantern_spirit_cat`  
  Espíritu de fuego que vive dentro del motor. Se queja de todo, pero si le das un módulo de madera viejo, el barco vuela.  
  **Ataque:** Combustión de Motor · **Pasiva:** Motor Vivo: consume 1 módulo de madera destruido para +1 de movimiento.  
  <sub>Ref: El Castillo Ambulante (Ghibli)</sub>
- **Khaleesimiau, Madre de Bolas de Pelo** · 🔥 Fuego · *Mítico* · Invocador · Cap. 1 · Base: `molten_ember_cat`  
  Michi de la Casa Bigotes, la Primera de su Nombre, Señora de las Cajas, Rompedora de Vasos, Reina del Sillón Verde y Madre de Bolas de Pelo. El título ocupa toda la tarjeta del Catdex.  
  **Ataque:** ¡GATARYS! · **Pasiva:** Madre de Peluches: al iniciar invoca 3 bolas de pelo con alas que explotan al tocar madera.  
  <sub>Ref: Game of Thrones (Daenerys)</sub>
- **Heisenbergato** · 🔥 Fuego / ✨ Magia/Arcano · *Épico* · Destructor · Cap. 1 · Base: `candy_alchemist_cat`  
  Era un gato tranquilo que daba clases de química. Ahora cocina catnip azul con 99.1% de pureza y usa sombrerito. Él no está en peligro: él es el que tumba las cosas de la mesa.  
  **Ataque:** Yo Soy el que Tumba · **Pasiva:** Pureza 99.1%: sus explosiones dejan cristales azules que dan +10% XP al recogerlos.  
  <sub>Ref: Breaking Bad</sub>
- **Sanmichi, Pata Negra** · 🔥 Fuego · *Raro* · Soporte · Cap. 1  
  Cocinero del barco. Jamás pelea con las patas delanteras porque 'son para cocinar'. Patea como un desgraciado y se derrite cuando ve una gata bonita.  
  **Ataque:** Pata del Diablo · **Pasiva:** Chef de a Bordo: la comida usada en batalla cura +30%.  
  <sub>Ref: One Piece (Sanji)</sub>
- **Scorpimiau** · 🔥 Fuego · *Raro* · Francotirador · Cap. 1  
  Ninja espectral con arpón. Grita '¡VEN PA'CÁ!' y saca a un gato enemigo de su habitación como quien saca a un niño de la alberca.  
  **Ataque:** ¡Ven Pa'cá!  
  <sub>Ref: Mortal Kombat (Scorpion)</sub>
- **Lasañeitor** · 🔥 Fuego · *Raro* · Tanque · Cap. 1 · Base: `canelo_cozy_cat`  
  Odia los lunes con pasión cósmica. Duerme 20 horas, come lasaña las otras 4 y aun así es el mejor tanque de la isla.  
  **Ataque:** Lasañazo · **Pasiva:** Odio los Lunes: en lunes reales (fecha del sistema) pierde 10% de daño pero gana +50% de armadura por puro coraje.  
  <sub>Ref: Garfield</sub>
- **Oppengatímer** · 🔥 Fuego / 🌌 Cósmico · *Mítico* · Destructor · Cap. 1  
  Miró al cielo, miró una lata de atún y entendió algo que nunca debió entender. 'Ahora me he convertido en Gato, destructor de vasos.'  
  **Ataque:** Destructor de Vasos · **Pasiva:** Una Sola Prueba: su ultimate se usa una vez por batalla.  
  <sub>Ref: Oppenheimer / Barbenheimer</sub>
- **Michions** · 🔥 Fuego · *Común* · Invocador · Cap. 1 · Base: `candy_alchemist_cat`  
  Una docena de gatitos amarillos idénticos que sólo dicen '¡Sardina!' y aplauden cuando algo explota. Nadie sabe quién es su jefe.  
  **Ataque:** ¡Sardina!  
  <sub>Ref: Mi Villano Favorito (Minions)</sub>
- **Gatzilla** · 🔥 Fuego / 💧 Agua · *Mítico* · Destructor · Cap. 1 · Base: `molten_ember_cat`  
  Despertó en el fondo del mar porque alguien abrió una lata de sardinas a 300 km. Mide 50 metros. Sigue cabiendo en una caja.  
  **Ataque:** Aliento Atómico de Sardina  
  <sub>Ref: Godzilla</sub>

### 💧 Agua (10)

- **Capitán Jack Purrow** · 💧 Agua · *Legendario* · Francotirador · Cap. 1 · Base: `deepsea_sprite_cat`  
  Capitán. CAPITÁN Jack Purrow. Su brújula no apunta al norte: apunta a lo que más desea, que siempre es la cocina. Pregunta todo el tiempo por qué se acabó el atún.  
  **Ataque:** ¿Por Qué Se Acabó el Atún? · **Pasiva:** ¡Parlamiau!: una vez por batalla, si va a morir, pide parlamento y pasa 1 turno sin recibir daño.  
  <sub>Ref: Piratas del Caribe</sub>
- **Gatanjiro** · 💧 Agua · *Legendario* · Artillero · Cap. 1  
  Huele las emociones de los barcos enemigos. Su haori de cuadritos es un mantel de picnic. Carga en la espalda una caja de madera donde duerme su hermanita (es gata: obvio que vive en una caja).  
  **Ataque:** Respiración del Atún: Primera Postura · **Pasiva:** Caja con Hermana: si el barco tiene un módulo 'caja', invoca a Michizuko al perder 50% HP.  
  <sub>Ref: Demon Slayer (Tanjiro)</sub>
- **Michizuko** · 💧 Agua / 👻 Espíritu · *Épico* · Tanque · Cap. 1  
  Vive en una caja, muerde un rascador de bambú y patea con la fuerza de un camión. Si alguien toca a su hermano, crece a tamaño gato adulto.  
  **Pasiva:** Bambú: no ataca con la boca, sólo con patadas (+20% daño estructural).  
  <sub>Ref: Demon Slayer (Nezuko)</sub>
- **Gatocarpa** · 💧 Agua · *Común* · Invocador · Cap. 1  
  Gatocarpa usó Salpicadura. No pasó nada. Es el gato más inútil del juego... hasta las 6 estrellas, cuando se convierte en Gyaramichi y nadie vuelve a burlarse de él.  
  **Ataque:** Salpicadura · **Pasiva:** Paciencia: a 6 estrellas se transforma en Gyaramichi (Mítico).  
  <sub>Ref: Pokémon (Magikarp)</sub>
- **Davy Garras** · 💧 Agua / 👻 Espíritu · *Épico* · Destructor · Cap. 1 · Base: `deepsea_sprite_cat`  
  Sus bigotes son tentáculos. Guarda su corazón en un cofre y su arenero en el fondo del mar. Si le debes croquetas, te las cobra en la otra vida.  
  **Ataque:** El Cajón de Davy Garras  
  <sub>Ref: Piratas del Caribe (Davy Jones)</sub>
- **Michi del Diluvio** · 💧 Agua · *Raro* · Soporte · Cap. 1 · Base: `deepsea_sprite_cat`  
  Un gato gris que sobrevivió a una inundación en un velero con un capibara, un lémur y un perro. No dice una sola palabra en toda su historia. No le hace falta.  
  **Pasiva:** Sin Palabras: inmune a provocaciones y miedo.  
  <sub>Ref: Flow (2024, Óscar a Mejor Película Animada)</sub>
- **Namiau, la Navegante** · 💧 Agua · *Común* · Economía · Cap. 1  
  Predice tormentas con los bigotes y te cobra hasta por mirarla. Si le debes oro, te cobra 300% de interés.  
  **Pasiva:** Cartógrafa Codiciosa: +10% oro por batalla ganada.  
  <sub>Ref: One Piece (Nami)</sub>
- **Ponmiau** · 💧 Agua · *Raro* · Soporte · Cap. 1 · Base: `jelly_aquatic_cat`  
  Una pececita que quería ser niña, se equivocó de hechizo y quedó gatita. Ama el jamón. Cada vez que se emociona, el mar sube dos metros.  
  **Pasiva:** Marea Emocionada: al ganar, la marea sube y moja un módulo enemigo.  
  <sub>Ref: Ponyo (Ghibli)</sub>
- **Michi Líquido** · 💧 Agua · *Raro* · Tanque · Cap. 1 · Base: `jelly_aquatic_cat`  
  La ciencia lo comprobó: un gato toma la forma de su recipiente. Este cabe en cualquier slot del barco, incluso en los que no existen.  
  **Pasiva:** Reología Felina: puede ocupar un slot de módulo como si fuera escudo.  
  <sub>Ref: Premio Ig Nobel 2017: 'los gatos son líquidos'</sub>
- **Gatollum** · 💧 Agua / 🕳️ Void · *Raro* · Francotirador · Update 2 (Void)  
  Vive en una cueva junto a un lago y le habla a una lata de atún. 'Mi tesssoro.' Tiene dos personalidades: una tierna y otra que te roba la comida.  
  **Pasiva:** Doble Personalidad: alterna cada turno entre +30% precisión y +30% robo de botín.  
  <sub>Ref: El Señor de los Anillos (Gollum)</sub>

### 🌱 Naturaleza (11)

- **Yo Soy Gato** · 🌱 Naturaleza · *Épico* · Tanque · Cap. 1 · Base: `arce_autumn_cat`  
  Sólo sabe decir 'Miau'. Los subtítulos del juego traducen cada 'Miau' distinto, y a veces son devastadoramente emotivos.  
  **Ataque:** Raíces de Guardián · **Pasiva:** Nosotros Somos Gato: al morir deja un brote que revive con 30% HP a los 3 turnos.  
  <sub>Ref: Guardianes de la Galaxia (Groot)</sub>
- **Bigotárbol** · 🌱 Naturaleza · *Épico* · Tanque · Cap. 1 · Base: `arce_autumn_cat`  
  Un gato tan viejo y tan lento que tardó tres días en decir 'buenos días'. No hay que apresurarse. Cuando por fin se enoja, se cae medio bosque sobre el barco enemigo.  
  **Pasiva:** No Hay Que Apresurarse: actúa cada 2 turnos con x3 daño.  
  <sub>Ref: El Señor de los Anillos (Bárbol y los Ents)</sub>
- **Michinimos** · 🌱 Naturaleza / 👻 Espíritu · *Común* · Economía · Cap. 1 · Base: `mushroom_druid_cat`  
  Espíritus del bosque con forma de gatito que cosechan tus granjas cuando no estás viendo. Si los miras, se congelan y fingen ser un arbusto.  
  **Pasiva:** Cosecha Automática: cosechan 1 granja cada 5 min, aunque estés en combate.  
  <sub>Ref: Stardew Valley (Junimos)</sub>
- **¡Michi Pepinillo!** · 🌱 Naturaleza · *Legendario* · Destructor · Cap. 1 · Base: `menta_botanical_cat`  
  Se convirtió en pepinillo para no bañarse. Ahora le tiene pánico a su propio reflejo. Los gatos enemigos también: saltan dos metros al verlo.  
  **Ataque:** ¡Soy Michi Pepinillo!  
  <sub>Ref: Rick and Morty (Pickle Rick) + videos virales de gatos asustados con pepinos</sub>
- **Hiedra Michinosa** · 🌱 Naturaleza / ⚡ Eléctrico/Plasma · *Épico* · Francotirador · Cap. 1 · Base: `cyber_bloom_cat`  
  Mitad planta, mitad circuito, todo actitud. Sus rosas tienen espinas con wifi.  
  **Pasiva:** Polen Tóxico: sus impactos hacen estornudar (-20% precisión enemiga).  
  <sub>Ref: Batman (Hiedra Venenosa)</sub>
- **Pikmichis** · 🌱 Naturaleza · *Común* · Artillero · Cap. 1  
  Gatitos-brote que se lanzan en racimo. Caen con mucha dignidad y una vocecita muy triste. Siempre vuelven a brotar.  
  **Ataque:** Lanzamiento de Pikmichis  
  <sub>Ref: Pikmin</sub>
- **Hufflepurr** · 🌱 Naturaleza · *Común* · Soporte · Cap. 1 · Base: `mushroom_druid_cat`  
  Leal, trabajador, amable y subestimado. Todos lo ignoran hasta que es el único que sigue de pie.  
  **Pasiva:** Lealtad: +15% HP a gatos adyacentes.  
  <sub>Ref: Harry Potter (Hufflepuff)</sub>
- **Michi Plátano** · 🌱 Naturaleza · *Común* · Soporte · Cap. 1  
  Llora dentro de un disfraz de plátano. Nadie sabe por qué está triste. Los enemigos sienten tanta lástima que a veces no le disparan.  
  **Pasiva:** Lástima: 20% de que el enemigo pierda el turno apuntándole.  
  <sub>Ref: Meme 'banana cat' llorando (2024)</sub>
- **Michi Ensalada** · 🌱 Naturaleza · *Común* · Tanque · Cap. 1 · Base: `margarita_daisy_cat`  
  Un gato blanco frente a un plato de verduras con cara de 'yo no pedí esto'. Le gritan desde el barco enemigo y no le importa.  
  **Pasiva:** Indiferencia: inmune a provocaciones.  
  <sub>Ref: Meme 'mujer gritándole a un gato'</sub>
- **Abuelita Panzona** · 🌱 Naturaleza · *Raro* · Soporte · Cap. 1 · Base: `margarita_daisy_cat`  
  '¿Ya comiste, mijo? Estás muy flaco.' Alimenta a todos los gatos de su hábitat aunque estén en nivel máximo. Trae en el delantal un ungüento mentolado que cura todo, incluido el casco del barco.  
  **Pasiva:** Come, Mijo: +20% XP de comida en su hábitat; repara 5% del barco por turno.  
  <sub>Ref: Cultura latina: la abuela que te da de comer aunque ya comiste</sub>
- **Benito Bodoquito** · 🌱 Naturaleza · *Común* · Soporte · Cap. 1  
  El gatito más chiquito y tierno de la pandilla, con chalequito azul. Se mete en problemas y siempre grita el nombre de su jefe.  
  **Pasiva:** Ternura: los jefes de evento lo ignoran el primer turno.  
  <sub>Ref: Don Gato y su Pandilla (Benito Bodoque)</sub>

### 🪨 Tierra (15)

- **Bigotes Blancos** · 🪨 Tierra / 💧 Agua · *Mítico* · Destructor · Cap. 1  
  El gato más fuerte del mar. Comió la Fruta del Ronroneo: cuando ronronea, tiemblan los océanos. Llama 'hijos' a todos los gatos de su barco (gracias a la Resonancia, a veces es verdad).  
  **Ataque:** Ronrón Ronrón: Terremoto · **Pasiva:** Padre de Todos: +10% HP a cada aliado.  
  <sub>Ref: One Piece (Barbablanca)</sub>
- **Michisaurus Rex** · 🪨 Tierra · *Épico* · Destructor · Cap. 1 · Base: `fossilstone_guardian_cat`  
  Clonado a partir de una pulga atrapada en ámbar hace 65 millones de años. La vida se abre camino. El gato también: directo a la mesa.  
  **Pasiva:** Brazos Cortos: no usa armas pequeñas, pero rompe pisos con un pisotón.  
  <sub>Ref: Jurassic Park</sub>
- **Topha Garrafuerte** · 🪨 Tierra · *Raro* · Francotirador · Cap. 1  
  Es ciega, pero 've' con los bigotes: siente las vibraciones del barco enemigo y sabe dónde está cada gato. Te dice 'pies ligeros' y te avienta una roca.  
  **Pasiva:** Bigotes Sísmicos: revela módulos ocultos y gatos escondidos.  
  <sub>Ref: Avatar: La Leyenda de Aang (Toph)</sub>
- **Mazinmichi Z** · 🪨 Tierra / ⚡ Eléctrico/Plasma · *Legendario* · Artillero · Cap. 1 · Base: `mecha_neon_cat`  
  Robot gigante con forma de gato, piloteado por un gatito sentado en la cabeza. Grita sus ataques con voz de doblaje setentero.  
  **Ataque:** ¡Garras Fuera!  
  <sub>Ref: Mazinger Z</sub>
- **Saitamiau** · 🪨 Tierra · *Común* · Destructor · Cap. 1  
  Un gato esfinge (sin pelo; o sea, pelón) que hizo 100 lagartijas diarias durante 3 años. Destruye todo de un golpe y está deprimido por eso. Es Común porque se registró como 'héroe por hobby'.  
  **Ataque:** Garrazo Serio · **Pasiva:** Aburrimiento: si el enemigo tiene menos de 20% HP, se aburre y no ataca.  
  <sub>Ref: One Punch Man (Saitama)</sub>
- **Maximus Decimus Miauridius** · 🪨 Tierra · *Legendario* · Tanque · Cap. 1  
  Comandante de los ejércitos del Norte (del sillón), general de las Legiones Felinas, leal servidor del verdadero emperador. Tendrá su venganza, en esta vida o en la siguiente (le quedan siete).  
  **Ataque:** ¿No Están Entretenidos?  
  <sub>Ref: Gladiador</sub>
- **Garroro Zoro** · 🪨 Tierra · *Épico* · Destructor · Cap. 1  
  Espadachín de tres garras (la tercera, en la boca). Lo pusiste en la proa y apareció en la cocina. Se pierde en línea recta.  
  **Ataque:** Estilo de Tres Garras · **Pasiva:** Sin Orientación: 15% de que su disparo salga hacia otro lado (y a veces le atina a algo mejor).  
  <sub>Ref: One Piece (Zoro)</sub>
- **Indiana Garras** · 🪨 Tierra · *Épico* · Francotirador · Cap. 1  
  Arqueólogo, aventurero, odia las serpientes (y los pepinos, que se parecen). Usa la cola como látigo y siempre lo persigue una roca gigante.  
  **Ataque:** La Roca Rodante  
  <sub>Ref: Indiana Jones</sub>
- **El Michi del 8** · 🪨 Tierra · *Común* · Tanque · Cap. 1  
  Vive en un barril en la vecindad. Nadie sabe su nombre real. Cuando tira un vaso, jura que fue sin querer queriendo.  
  **Ataque:** Torta de Jamón Imaginaria · **Pasiva:** Barril: -30% de daño recibido si está en un módulo pequeño.  
  <sub>Ref: El Chavo del 8</sub>
- **Michi la Fea** · 🪨 Tierra · *Raro* · Economía · Cap. 1  
  Lentes enormes, frenillos, flequillo de casco y la mejor contabilidad del archipiélago. Sin ella tu isla habría quebrado hace dos capítulos. A 6 estrellas tiene su cambio de look y nadie la reconoce.  
  **Pasiva:** Contadora Maestra: +25% oro en su hábitat.  
  <sub>Ref: Yo soy Betty, la fea</sub>
- **Michi Hogaza** · 🪨 Tierra · *Común* · Tanque · Cap. 1 · Base: `mochi_bell_cat`  
  Se sienta con las patas escondidas hasta parecer un pan. Es imposible moverlo, imposible hacerle daño e imposible convencerlo de atacar.  
  **Ataque:** Modo Hogaza  
  <sub>Ref: Meme 'cat loaf' (gato en posición de pan)</sub>
- **Sísifo Michi** · 🪨 Tierra · *Raro* · Artillero · Cap. 1  
  Condenado a empujar una roca hasta la cima por toda la eternidad. Él es feliz: la empuja para TIRARLA desde arriba. Es lo más gato que existe.  
  **Pasiva:** Eterno Retorno: cada roca que lanza hace +10% más que la anterior.  
  <sub>Ref: Mitología griega (Sísifo)</sub>
- **Gat-E** · 🪨 Tierra / ⚡ Eléctrico/Plasma · *Raro* · Economía · Cap. 1 · Base: `bytewhisker_cat`  
  Un robotito solitario que compacta chatarra en cubitos. Lleva 700 años limpiando la playa. Se enamoró de una aspiradora robot y nadie tuvo corazón para decirle.  
  **Pasiva:** Compactador: cada módulo destruido da +1 pieza extra.  
  <sub>Ref: WALL·E</sub>
- **Gato Miedoso / Gato de Batalla** · 🪨 Tierra · *Épico* · Tanque · Cap. 1  
  En la isla es el gato más cobarde: se esconde hasta de las hojas. Pero cuando alguien levanta el rascador y grita '¡Por el poder del Gran Rascador!', se vuelve un tigre acorazado. Es, literalmente, la mecánica de este juego.  
  **Pasiva:** Doble Vida: en batalla +50% HP; en la isla produce -50% oro (está escondido).  
  <sub>Ref: He-Man (Cringer / Battle Cat)</sub>
- **Purrbacca** · 🪨 Tierra · *Raro* · Tanque · Cap. 1  
  Copiloto peludo de 2 metros. Sólo ruge 'RRRWAAARGH', pero todos le entienden. Le arranca los brazos al que le gane al ajedrez (es broma; sólo le esconde el control).  
  **Pasiva:** Copiloto: +10% esquiva al barco mientras él viva.  
  <sub>Ref: Star Wars (Chewbacca)</sub>

### ⚡ Eléctrico/Plasma (11)

- **Michi de Leo, Caballero Dorado** · ⚡ Eléctrico/Plasma / 🌌 Cósmico · *Legendario* · Francotirador · Cap. 1  
  El único caballero dorado que es literalmente un felino. Enciende su cosmos y lanza cien millones de golpes por segundo. Su armadura es una caja dorada (de cartón).  
  **Ataque:** Plasma Relámpago  
  <sub>Ref: Los Caballeros del Zodiaco (Aioria de Leo)</sub>
- **Zenmichi** · ⚡ Eléctrico/Plasma · *Épico* · Artillero · Cap. 1 · Base: `stormcloud_elemental_cat`  
  Cobarde, llorón y chillón... hasta que se queda dormido. Dormido es el gato más rápido del mundo. Como los gatos duermen 16 horas al día, es bastante útil.  
  **Ataque:** Respiración del Trueno: Primera Postura · **Pasiva:** Sonámbulo: ataca a máxima potencia sólo si no lo has usado en 2 turnos.  
  <sub>Ref: Demon Slayer (Zenitsu)</sub>
- **Killmiau** · ⚡ Eléctrico/Plasma · *Épico* · Francotirador · Cap. 1  
  Gatito de una familia de asesinos profesionales que sólo quiere ser normal y comer chocolates (de mentira; el chocolate es tóxico para gatos). Sus garras echan chispas.  
  **Ataque:** Velocidad Divina  
  <sub>Ref: Hunter x Hunter (Killua)</sub>
- **Kakamichi Sensei** · ⚡ Eléctrico/Plasma · *Raro* · Francotirador · Cap. 1  
  Llega tarde a todas las batallas porque 'se perdió en el camino de la vida'. Lee un libro que nadie ha visto. Tiene un ojo que copia ataques.  
  **Ataque:** Raikiri de Bigotes · **Pasiva:** Ojo Copiador: copia el último ataque enemigo con 50% de daño.  
  <sub>Ref: Naruto (Kakashi)</sub>
- **Neko, el Elegido** · ⚡ Eléctrico/Plasma / ⏳ Chronos · *Mítico* · Francotirador · Update 3 (Chronos) · Base: `bytewhisker_cat`  
  Tomó la croqueta roja. Ahora ve el código detrás de cada barco. No hay cuchara: hay lata. Y ya sabe kung-fu.  
  **Ataque:** Tiempo Bala Felino  
  <sub>Ref: Matrix (Neo) — y 'neko' significa 'gato' en japonés</sub>
- **Gatominator T-808** · ⚡ Eléctrico/Plasma · *Legendario* · Tanque · Cap. 1 · Base: `bytewhisker_cat`  
  Endoesqueleto de titanio cubierto de pelaje, enviado desde el futuro para proteger tu comida. Volverá. Siempre vuelve. Sobre todo a la hora de comer.  
  **Ataque:** Hasta la Vista, Croqueta · **Pasiva:** Volveré: revive una vez con 40% HP.  
  <sub>Ref: Terminator</sub>
- **Thormiau** · ⚡ Eléctrico/Plasma · *Épico* · Destructor · Cap. 1 · Base: `stormcloud_elemental_cat`  
  Dios del trueno. Su martillo es una lata de atún que sólo levanta quien sea digno (y tenga abrelatas). Después de cada lata la estrella contra el piso y grita '¡OTRO!'.  
  **Ataque:** Martillo del Atún  
  <sub>Ref: Mitología nórdica / Thor</sub>
- **El Chapulín Michirado** · ⚡ Eléctrico/Plasma · *Legendario* · Soporte · Cap. 1  
  Más ágil que una tortuga, más fuerte que un ratón, más noble que una lechuga. Sus antenitas de vinil detectan la presencia del enemigo. Pelea con un ratoncito chillón.  
  **Ataque:** Ratoncito Chillón · **Pasiva:** ¡No Contaban con mi Astucia!: al recibir un crítico, contraataca.  
  <sub>Ref: El Chapulín Colorado</sub>
- **Michi-O, Señor de los Truenogatos** · ⚡ Eléctrico/Plasma · *Legendario* · Artillero · Cap. 1 · Base: `stormcloud_elemental_cat`  
  Líder de una tribu de gatos guerreros que huyó de su planeta. Su garra mágica le da visión más allá de lo evidente... y más allá del plato vacío.  
  **Ataque:** Garra del Augurio  
  <sub>Ref: Thundercats</sub>
- **Gato 808** · ⚡ Eléctrico/Plasma · *Raro* · Soporte · Cap. 1 · Base: `sonata_prima_cat`  
  Gato-robot que hace todo al ritmo de la música. Si disparas en el beat, el daño sube. Si no, te mira feo.  
  **Pasiva:** Al Ritmo: disparos sincronizados con el beat hacen +25% daño.  
  <sub>Ref: Hi-Fi Rush (808) / cajas de ritmo</sub>
- **Nikola Gatesla** · ⚡ Eléctrico/Plasma · *Raro* · Artillero · Cap. 1  
  Genio incomprendido de la electricidad. Le cayó mal un tal Edison-Perro. Sueña con dar atún inalámbrico gratis a todo el mundo.  
  **Pasiva:** Corriente Alterna: sus rayos saltan a un módulo extra si está mojado.  
  <sub>Ref: Nikola Tesla (historia)</sub>

### 🌪️ Viento (12)

- **Narumiau Uzumaki** · 🌪️ Viento · *Legendario* · Artillero · Cap. 1  
  El gatito al que nadie quería en la aldea. Ahora quiere ser Hokagato. Termina cada frase con '¡dattemiau!' y convence a los villanos de ser buenos platicando.  
  **Ataque:** Rasenbola · **Pasiva:** Charla no Jutsu: 10% de convertir a un gato enemigo derrotado en aliado temporal.  
  <sub>Ref: Naruto</sub>
- **Aangora, el Último Maestro Aire** · 🌪️ Viento · *Legendario* · Soporte · Cap. 1 · Base: `nube_dream_cat`  
  Un gato angora con una flecha azul en la frente. Pasó 100 años congelado en un iceberg y despertó con hambre. Domina el aire y está aprendiendo los otros tres.  
  **Ataque:** Estado Avatar  
  <sub>Ref: Avatar: La Leyenda de Aang</sub>
- **El Gato Combi** · 🌪️ Viento / 👻 Espíritu · *Épico* · Soporte · Cap. 1  
  Gato-transporte de 12 patas que hace paradas donde sea. '¡Súbale, súbale, hay lugares! ¡Recórranse para atrás!' Nunca da el cambio.  
  **Pasiva:** Ruta Express: una vez por turno mueve a un aliado a cualquier módulo.  
  <sub>Ref: Mi Vecino Totoro (Gatobús) + las combis latinoamericanas</sub>
- **El Gato con Chanclas** · 🌪️ Viento · *Legendario* · Artillero · Cap. 1  
  Primo latino del famoso gato de las botas. Hace ojitos de súplica tan grandes que el enemigo pierde el turno. Pero cuando se quita la chancla... corran.  
  **Ataque:** La Chancla Teledirigida · **Pasiva:** Ojitos de Súplica: una vez por batalla, el enemigo salta su turno.  
  <sub>Ref: El Gato con Botas (cuento de Perrault, dominio público) + la chancla de mamá</sub>
- **Michi Sónico** · 🌪️ Viento · *Raro* · Francotirador · Cap. 1  
  A las 3 de la mañana corre a la velocidad del sonido por toda la isla sin razón aparente. Después se duerme como si nada.  
  **Ataque:** Zoomies de las 3 AM  
  <sub>Ref: Sonic + los zoomies de las 3 AM</sub>
- **Oliver Atún** · 🌪️ Viento / 💧 Agua · *Raro* · Artillero · Cap. 1  
  Su disparo es tan largo que tarda tres episodios en cruzar la cancha... digo, el mar. Cuando por fin llega, nadie se acuerda de quién disparó.  
  **Ataque:** Tiro del Tigre  
  <sub>Ref: Supercampeones (Captain Tsubasa)</sub>
- **Sogekitty** · 🌪️ Viento / 🔥 Fuego · *Raro* · Francotirador · Cap. 1  
  Dice que tiene 8,000 seguidores y que derrotó solito a un gato gigante. Todo es mentira. Su puntería, no.  
  **Pasiva:** Mentira Piadosa: una vez por batalla finge su muerte y regresa al turno siguiente.  
  <sub>Ref: One Piece (Usopp / Sogeking)</sub>
- **Michi Poppins** · 🌪️ Viento / ✨ Magia/Arcano · *Épico* · Soporte · Cap. 1 · Base: `nube_dream_cat`  
  Llega volando con un paraguas cuando cambia el viento. Mete en su bolsa cosas más grandes que la bolsa. Es prácticamente perfecta en todo sentido.  
  **Pasiva:** Bolso sin Fondo: +1 artefacto equipado.  
  <sub>Ref: Mary Poppins</sub>
- **Yiyi, Servicio de Entregas** · 🌪️ Viento · *Común* · Economía · Cap. 1  
  Gatito negro que vuela en escoba repartiendo paquetes por el archipiélago. Habla, pero sólo con quien cree en él.  
  **Pasiva:** Entregas: expediciones -10% de tiempo.  
  <sub>Ref: Kiki: Entregas a Domicilio (Ghibli)</sub>
- **Michi Giratorio** · 🌪️ Viento · *Común* · Artillero · Cap. 1  
  Gira y gira haciendo un sonido inexplicable hasta convertirse en un tornadito. Nadie lo entiende. Todos lo aman.  
  **Ataque:** ¡UIIIA UIIIA!  
  <sub>Ref: Meme del gato que gira (2024)</sub>
- **Forrest Gato** · 🌪️ Viento · *Común* · Francotirador · Cap. 1  
  Un día empezó a correr y ya no paró. Su mamá le decía que la vida es como una caja: nunca sabes qué gato te va a salir.  
  **Pasiva:** ¡Corre, Forrest Gato!: +1 esquiva por turno.  
  <sub>Ref: Forrest Gump</sub>
- **Gattolino Bombardino** · 🌪️ Viento / 🔥 Fuego · *Épico* · Artillero · Cap. 1  
  Mitad gato, mitad avión bombardero, 100% producto de un universo que no debería existir. Su nombre suena italiano. No es italiano.  
  **Ataque:** Bombardeo de Croquetas  
  <sub>Ref: Brainrot italiano (2025)</sub>

### ❄️ Hielo (8)

- **Frízer, Emperador del Congelador** · ❄️ Hielo · *Mítico* · Destructor · Cap. 1 · Base: `prism_crystal_cat`  
  Vive en el congelador de la cocina y se cree emperador del universo. Tiene tres transformaciones: refrigerador, congelador y congelador horizontal de tienda. Educadísimo y cruel.  
  **Ataque:** Bola de Muerte Helada  
  <sub>Ref: Dragon Ball (Freezer, doblaje latino)</sub>
- **Bola de Nieve V (llámalo II)** · ❄️ Hielo · *Común* · Artillero · Cap. 1  
  Es el quinto gato con este nombre. Por razones de presupuesto le seguiremos diciendo 'segundo'. No preguntes qué pasó con los otros.  
  **Pasiva:** Reemplazo: si muere, uno idéntico toma su lugar con 50% HP (una vez).  
  <sub>Ref: Los Simpson (Bola de Nieve II)</sub>
- **Michi Nieve** · ❄️ Hielo · *Raro* · Tanque · Cap. 1  
  No sabe nada. Literalmente: le preguntas algo y se te queda viendo. Pero cuando se acerca el invierno, es el primero en la muralla.  
  **Ataque:** Se Acerca el Invierno  
  <sub>Ref: Game of Thrones (Jon Nieve)</sub>
- **Reina Gatelsa** · ❄️ Hielo / ✨ Magia/Arcano · *Épico* · Francotirador · Cap. 1 · Base: `prism_crystal_cat`  
  Encerró sus poderes por años. Un día los soltó y congeló un reino entero. Suelta los vasos de la mesa con la misma actitud.  
  **Ataque:** Suéltalo (el Vaso)  
  <sub>Ref: Frozen</sub>
- **Gatolaf** · ❄️ Hielo · *Común* · Soporte · Cap. 1  
  Un gato de nieve que ama los abrazos cálidos. Nadie le ha explicado qué le pasa a un gato de nieve cuando recibe un abrazo cálido.  
  **Pasiva:** Abrazo Cálido: cura 25% a un aliado y se derrite un poquito (-10% HP propio).  
  <sub>Ref: Frozen (Olaf)</sub>
- **Sub-Michi** · ❄️ Hielo · *Épico* · Destructor · Cap. 1  
  Ninja del hielo y eterno rival de Scorpimiau. Congela un módulo y luego lo rompe con un final espectacular.  
  **Ataque:** ¡GATALITY!  
  <sub>Ref: Mortal Kombat (Sub-Zero)</sub>
- **El Rey de la Siesta Nocturna** · ❄️ Hielo / 👻 Espíritu · *Legendario* · Invocador · Cap. 1  
  Ojos azules brillantes, corona de hielo y cero prisa. Levanta las patas y todos los gatos caídos se levantan... para dormir otra siesta.  
  **Pasiva:** Ejército Dormido: revive aliados caídos como gatos de hielo con 20% HP.  
  <sub>Ref: Game of Thrones (el Rey de la Noche)</sub>
- **Abominable Michi de las Nieves** · ❄️ Hielo · *Raro* · Tanque · Cap. 1  
  Mide tres metros, es blanco y esponjoso. Nadie tiene una foto clara de él porque siempre sale borroso.  
  **Pasiva:** Borroso: -15% precisión enemiga contra él.  
  <sub>Ref: Yeti (folclor himalayo)</sub>

### ✨ Magia/Arcano (11)

- **Hairy Pawter** · ✨ Magia/Arcano · *Legendario* · Artillero · Cap. 1 · Base: `storybook_ink_cat`  
  El gato que vivió (ocho veces). Tiene una cicatriz de rayo porque se cayó de la repisa. Vivía en una alacena bajo la escalera por gusto: era una caja.  
  **Ataque:** Expelliarmichis  
  <sub>Ref: Harry Potter</sub>
- **Purrfessor Meowgonagall** · ✨ Magia/Arcano · *Épico* · Soporte · Cap. 1  
  Profesora de Transformaciones. Su truco es convertirse en humana, lo cual aterroriza a todos los alumnos. Diez puntos menos para tu hábitat.  
  **Pasiva:** Disciplina: los gatos Comunes de su barco ganan +20% daño.  
  <sub>Ref: Harry Potter (McGonagall)</sub>
- **Gatalf el Gris** · ✨ Magia/Arcano · *Mítico* · Tanque · Cap. 1  
  Un mago nunca llega tarde ni temprano: llega exactamente cuando oye abrir una lata. A 6 estrellas regresa como Gatalf el Blanco.  
  **Ataque:** ¡No Pasarás (por la Puerta)!  
  <sub>Ref: El Señor de los Anillos (Gandalf)</sub>
- **Severus Siamés** · ✨ Magia/Arcano / 🕳️ Void · *Épico* · Francotirador · Update 2 (Void)  
  Pelo negro, grasoso y mirada de desprecio. Odia a todos los gatos nuevos. —¿Después de tanto tiempo? —Siempre. (Tiene hambre siempre.)  
  **Pasiva:** Doble Agente: 25% de que un ataque dirigido a él rebote.  
  <sub>Ref: Harry Potter (Snape)</sub>
- **Hermiaune Granger** · ✨ Magia/Arcano · *Raro* · Soporte · Cap. 1  
  Estudió todos los hechizos antes de la primera clase. Te corrige cada vez que pronuncias mal: es mi-Á-u, no miau-Á.  
  **Pasiva:** Sabelotodo: revela el elemento débil del barco enemigo.  
  <sub>Ref: Harry Potter (Hermione)</sub>
- **Michi Dobby** · ✨ Magia/Arcano · *Común* · Soporte · Cap. 1  
  ¡A Michi le dieron un calcetín! ¡Michi es libre! (Michi se queda: aquí hay comida.)  
  **Pasiva:** Calcetín: con el artefacto 'Calcetín' equipado, +50% velocidad.  
  <sub>Ref: Harry Potter (Dobby) + la obsesión de los gatos con los calcetines</sub>
- **La Gata del 71** · ✨ Magia/Arcano · *Raro* · Invocador · Cap. 1  
  Toda la vecindad le dice bruja. No es bruja. Bueno, sí hace magia, pero eso no le da derecho a nadie de decirle así.  
  **Pasiva:** No Soy Bruja: las maldiciones contra ella se devuelven.  
  <sub>Ref: El Chavo del 8 (la Bruja del 71)</sub>
- **Anya Forgato** · ✨ Magia/Arcano · *Raro* · Soporte · Cap. 1 · Base: `lumen_lens_cat`  
  Gatita telépata adoptada por un gato espía y una gata asesina. Lee la mente del enemigo y pone carita de 'jeh'. Waku waku.  
  **Pasiva:** Telepatía: muestra el próximo objetivo del enemigo.  
  <sub>Ref: Spy x Family</sub>
- **Michi Once** · ✨ Magia/Arcano / ⚡ Eléctrico/Plasma · *Épico* · Francotirador · Cap. 1  
  Escapó de un laboratorio. Tira vasos de la mesa con la mente, lo cual para un gato es un upgrade de eficiencia. Ama los waffles. Los amigos no mienten; los gatos sí, sobre si ya comieron.  
  **Ataque:** Vaso Telequinético  
  <sub>Ref: Stranger Things (Once)</sub>
- **Doctor Gatraño** · ✨ Magia/Arcano / ⏳ Chronos · *Mítico* · Soporte · Update 3 (Chronos) · Base: `lumen_lens_cat`  
  Vio 14 millones de futuros posibles. En todos tiraste el vaso. En uno ganas esta batalla. No te va a decir cuál.  
  **Pasiva:** Uno en 14 Millones: una vez por batalla repite el turno completo del jugador.  
  <sub>Ref: Doctor Strange</sub>
- **Barón Bigotes von Siesta** · ✨ Magia/Arcano / 🌪️ Viento · *Legendario* · Soporte · Cap. 1  
  Una estatuilla de gato elegantísimo que cobra vida al atardecer. Sombrero de copa, bastón, modales impecables. Te ayuda a escapar del Reino de los Gatos... o a encontrarlo.  
  **Pasiva:** Caballero: los aliados no reciben críticos mientras él viva.  
  <sub>Ref: Haru en el Reino de los Gatos (Ghibli)</sub>

### 🌌 Cósmico (12)

- **Satoru Gato** · 🌌 Cósmico / 🕳️ Void · *Mítico* · Destructor · Update 2 (Void) · Base: `alien_galaxy_cat`  
  Usa venda en los ojos para no deslumbrarse con su propia belleza. Entre él y el universo hay un 'infinito': nada lo toca, ni la aspiradora. 'En el cielo y en la tierra, sólo yo soy el michi honrado.'  
  **Ataque:** Expansión de Dominio: Bola de Estambre Infinita · **Pasiva:** Infinito: el primer impacto de cada batalla no le hace daño.  
  <sub>Ref: Jujutsu Kaisen (Gojo Satoru)</sub>
- **Obi-Wan Catnobi** · 🌌 Cósmico · *Legendario* · Francotirador · Cap. 1 · Base: `regal_cosmic_cat`  
  Maestro de la Purrza. Saluda con un 'Hola... qué tal' elegantísimo. Su regla de oro: siempre tener la repisa alta.  
  **Ataque:** Tengo la Repisa Alta  
  <sub>Ref: Star Wars (Obi-Wan Kenobi)</sub>
- **Darth Siamés** · 🌌 Cósmico / 🕳️ Void · *Legendario* · Destructor · Update 2 (Void)  
  Respira fuerte a través de una máscara (tiene alergia al polen). Le encanta revelar a media batalla que es el padre de algún gato. Gracias a la Resonancia, a veces es cierto.  
  **Ataque:** Lado Oscuro de la Croqueta  
  <sub>Ref: Star Wars (Darth Vader)</sub>
- **Gatogu** · 🌌 Cósmico · *Mítico* · Soporte · Cap. 1 · Base: `nori_lunar_cat`  
  Tiene 50 años, mide 30 cm y se come huevos de rana que no son suyos. Mueve cosas con la Purrza y luego duerme 8 horas. Este es el camino.  
  **Pasiva:** Este Es el Camino: cura 15% a todo el barco una vez y luego duerme 2 turnos.  
  <sub>Ref: The Mandalorian (Grogu)</sub>
- **Lunática** · 🌌 Cósmico · *Épico* · Soporte · Cap. 1 · Base: `selene_moonlit_cat`  
  Gata negra con una media luna en la frente. Habla, te da poderes y te regaña. En el nombre de la luna... y del atún.  
  **Ataque:** ¡Poder del Prisma Michi!  
  <sub>Ref: Sailor Moon (Luna)</sub>
- **Experimento 6-2-Miau** · 🌌 Cósmico · *Épico* · Destructor · Cap. 1 · Base: `alien_galaxy_cat`  
  Creado en un laboratorio para destruir todo lo que toca. Lo adoptó una niña en una isla y ahora sólo destruye lo que no es de su familia. Ohana significa que nadie se queda sin croqueta.  
  **Pasiva:** Ohana: +20% daño por cada aliado vivo.  
  <sub>Ref: Lilo & Stitch</sub>
- **Los de La Garra** · 🌌 Cósmico · *Común* · Invocador · Cap. 1 · Base: `alien_galaxy_cat`  
  Tres gatitos verdes de tres ojos que veneran a La Garra. Nadie sabe qué es La Garra. Cuando la ven: 'Ooooooh'.  
  **Ataque:** Ooooh... La Garra  
  <sub>Ref: Toy Story (los marcianitos de la máquina de garra)</sub>
- **Buzz Lightmiau** · 🌌 Cósmico · *Raro* · Artillero · Cap. 1  
  Está convencido de que es un guardián espacial y no un gato de juguete. Grita '¡Al infinito y a la caja!' antes de cada salto. No vuela: cae con estilo.  
  **Ataque:** ¡Al Infinito y a la Caja!  
  <sub>Ref: Toy Story (Buzz Lightyear)</sub>
- **E.T., el Extra-Gato** · 🌌 Cósmico · *Raro* · Soporte · Cap. 1  
  Se perdió en la Tierra, se escondió entre los peluches y apunta al cielo con un dedo que brilla. 'Mi caja... teléfono.'  
  **Pasiva:** Dedo Brillante: cura 10% a un aliado por turno.  
  <sub>Ref: E.T. el Extraterrestre</sub>
- **Gatarou Kujo** · 🌌 Cósmico · *Legendario* · Destructor · Cap. 1  
  Gorra fusionada con el pelo y cara de 'yare yare' permanente. Su espíritu guardián golpea más rápido que la vista.  
  **Ataque:** ¡GARRA GARRA GARRA!  
  <sub>Ref: JoJo's Bizarre Adventure (Jotaro)</sub>
- **Comandante Felicitas** · 🌌 Cósmico · *Legendario* · Soporte · Cap. 1 · Base: `regal_cosmic_cat`  
  Homenaje a la gata pionera del espacio. Todos los gatos cósmicos la saludan con respeto. Ella sólo quiere su cojín.  
  **Pasiva:** Pionera: los gatos Cósmicos aliados ganan +1 estrella temporal en batalla.  
  <sub>Ref: Félicette, la primera gata en ir al espacio y volver (Francia, 1963 — historia real)</sub>
- **Michi Tostada Arcoíris** · 🌌 Cósmico · *Raro* · Artillero · Cap. 1 · Base: `candy_alchemist_cat`  
  Cuerpo de pan tostado, estela de arcoíris y una música de 8 bits que no se te va a salir de la cabeza nunca. Viene de un universo que sólo existe en loop.  
  **Pasiva:** Loop Eterno: su ataque se repite gratis cada 3 turnos.  
  <sub>Ref: Nyan Cat (meme 2011)</sub>

### 👻 Espíritu (10)

- **La Maullona** · 👻 Espíritu / 💧 Agua · *Legendario* · Invocador · Cap. 1  
  Recorre los muelles de noche llorando '¡Aaay, mis gatitos!'. Nadie sabe dónde quedaron. Si la ayudas a buscarlos, te los presta para la batalla.  
  **Ataque:** ¡Ay, Mis Gatitos!  
  <sub>Ref: Leyenda de La Llorona (folclor latinoamericano)</sub>
- **La Gatrina** · 👻 Espíritu · *Épico* · Soporte · Cap. 1 · Base: `lantern_spirit_cat`  
  Elegantísima, con sombrero de plumas y cara de calaverita. Cada noviembre visita a los gatos que se fueron y se lleva una concha de la ofrenda.  
  **Pasiva:** Ofrenda: revive a un aliado caído una vez por batalla.  
  <sub>Ref: La Catrina (Día de Muertos, J. G. Posada)</sub>
- **Michilín** · 👻 Espíritu · *Común* · Tanque · Cap. 1  
  Siempre es el primero en morir. Siempre. Por suerte, también siempre revive. Es el gato más resucitado del multiverso.  
  **Pasiva:** ¡Mataron al Michilín!: al morir, aliados +30% daño; revive en 2 turnos.  
  <sub>Ref: Dragon Ball (Krilin) — '¡Mataron a Krilin!'</sub>
- **Ocho de Nueve** · 👻 Espíritu / 🔥 Fuego · *Épico* · Destructor · Cap. 1  
  Gastó ocho de sus nueve vidas haciendo tonterías. Le queda una y lo sabe. Cada vez que oye un silbido, se le eriza el pelo.  
  **Pasiva:** Última Vida: +100% daño, pero no puede ser revivido.  
  <sub>Ref: El Gato con Botas: El Último Deseo</sub>
- **Tío Michiroh** · 👻 Espíritu / 🔥 Fuego · *Legendario* · Soporte · Cap. 1 · Base: `kintsugi_tea_spirit_cat`  
  Un viejo general que cambió la guerra por el té. Tiene grietas doradas porque se rompió muchas veces y se reparó con más cariño. Siempre trae un consejo y la tetera caliente.  
  **Ataque:** Té del Dragón del Oeste  
  <sub>Ref: Avatar: La Leyenda de Aang (Tío Iroh)</sub>
- **Fuego Fatuo Bigotón** · 👻 Espíritu · *Raro* · Francotirador · Cap. 1 · Base: `lantern_spirit_cat`  
  Una lucecita que flota sobre los pantanos de noche. Si la sigues, te lleva a un tesoro... o a la cocina. Para un gato es lo mismo.  
  **Pasiva:** Guía: revela un cofre oculto por batalla.  
  <sub>Ref: Fuego fatuo (folclor)</sub>
- **Sensei Panzón** · 👻 Espíritu · *Raro* · Economía · Cap. 1 · Base: `mochi_bell_cat`  
  Un espíritu poderosísimo atrapado en el cuerpo de un gato de la suerte gordito. Exige comida, toma leche deslactosada y levanta la patita para atraer oro.  
  **Pasiva:** Gato de la Suerte: +5% de probabilidad en Cat's Gambit.  
  <sub>Ref: Natsume Yuujinchou (Nyanko-sensei) + maneki-neko</sub>
- **Alebrijita** · 👻 Espíritu / ✨ Magia/Arcano · *Épico* · Artillero · Cap. 1 · Base: `iridescent_origami_cat`  
  Un jaguar-gato con alas, cuernos y colores neón que guía a las almas por el puente de cempasúchil. Brilla más cuando está contenta.  
  **Pasiva:** Guía de Almas: los gatos Espíritu aliados ganan +15% daño.  
  <sub>Ref: Alebrijes (arte popular mexicano)</sub>
- **El Fantasma de Gatterville** · 👻 Espíritu · *Raro* · Invocador · Cap. 1 · Base: `masquerade_phantom_cat`  
  Fantasma de 300 años que lleva siglos intentando asustar a la familia nueva. Nadie le hace caso. Le limpian sus manchas de 'sangre' (es salsa de tomate).  
  **Pasiva:** Ignorado: los enemigos no lo atacan hasta que sea el último.  
  <sub>Ref: El Fantasma de Canterville (Oscar Wilde, dominio público)</sub>
- **Merlina Gatams** · 👻 Espíritu / 🕳️ Void · *Épico* · Francotirador · Update 2 (Void) · Base: `masquerade_phantom_cat`  
  No sonríe. Nunca. Excepto cuando un barco enemigo se hunde. Baila raro en las fiestas. Su mascota es una patita que camina sola.  
  **Pasiva:** Patita: una patita independiente roba un objeto del barco enemigo por batalla.  
  <sub>Ref: Los Locos Addams / Merlina (Wednesday)</sub>

### 🕳️ Void (8)

- **Manchas** · 🕳️ Void · *Legendario* · Invocador · Update 2 (Void)  
  Un gato blanco cubierto de manchas negras... que son agujeros. Mete la pata en una y sale por otra al otro lado del mar. Exige que lo tomen en serio como villano.  
  **Ataque:** Agujeros de Manchas  
  <sub>Ref: Spider-Man: A través del Spider-Verso (La Mancha)</sub>
- **Sin Bigotes** · 🕳️ Void / 👻 Espíritu · *Épico* · Economía · Update 2 (Void)  
  Una sombra silenciosa con máscara. Ofrece pepitas de oro a cambio de comida. Si le das demasiada, crece. Mucho.  
  **Pasiva:** Oro por Comida: convierte comida sobrante en oro x2.  
  <sub>Ref: El Viaje de Chihiro (Sin Cara)</sub>
- **Demogorgato** · 🕳️ Void · *Épico* · Destructor · Update 2 (Void)  
  Viene del Mundo Patas Arriba. Su cara se abre como flor. Se lleva a los gatos que salen de noche (los regresa en la mañana, con hambre).  
  **Pasiva:** Portal: puede atacar desde debajo del barco.  
  <sub>Ref: Stranger Things (Demogorgon)</sub>
- **Thanomiau el Inevitable** · 🕳️ Void · *Mítico* · Destructor · Update 2 (Void)  
  Juntó las seis gemas en un collar de cascabeles. Intentó chasquear los dedos. Los gatos no pueden chasquear. Sonó 'plop'. Igual funcionó.  
  **Ataque:** Chasquido de Almohadilla  
  <sub>Ref: Avengers (Thanos)</sub>
- **Gato de Schrödinger** · 🕳️ Void / 🌀 Multiverso · *Mítico* · Francotirador · Update 4 (Multiverso)  
  Está vivo y muerto al mismo tiempo hasta que abres la caja. Él preferiría que no la abrieras: estaba dormido.  
  **Ataque:** Caja de Schrödinger  
  <sub>Ref: Experimento mental de Schrödinger (física cuántica)</sub>
- **Gatman** · 🕳️ Void · *Épico* · Francotirador · Update 2 (Void) · Base: `masquerade_phantom_cat`  
  De día es Bruno Michi-Díaz, millonario. De noche es la venganza, es la noche, es el que te despierta a las 4 de la mañana. No tiene superpoderes: tiene dinero y una caja negra.  
  **Pasiva:** Gadgets: equipa un artefacto extra si es de tipo herramienta.  
  <sub>Ref: Batman (en el doblaje latino clásico: Bruno Díaz)</sub>
- **Ryomen Sukunyan** · 🕳️ Void / 🌌 Cósmico · *Mítico* · Destructor · Update 2 (Void)  
  El Rey de las Maldiciones. Cuatro ojos, dos bocas y cero modales. Su Santuario Malévolo es un arenero de 200 metros que corta todo lo que entra.  
  **Ataque:** Santuario Malévolo de Arena  
  <sub>Ref: Jujutsu Kaisen (Sukuna)</sub>
- **Unidad Gata-01** · 🕳️ Void / ⚡ Eléctrico/Plasma · *Legendario* · Destructor · Update 2 (Void) · Base: `mecha_neon_cat`  
  Gato biomecánico morado y verde que se pilotea desde adentro. Funciona con cable. Cuando se acaba la batería entra en modo berserk y nadie lo controla. Súbete al gato, Shinji.  
  **Pasiva:** Berserk: tras 5 turnos sin energía ataca sin control con x3 daño.  
  <sub>Ref: Neon Genesis Evangelion</sub>

### ⏳ Chronos (5)

- **DIO Brandmiau** · ⏳ Chronos · *Mítico* · Destructor · Update 3 (Chronos)  
  Aristócrata vampiro que detiene el tiempo y aparece detrás de ti con una aspiradora robot gigante. '¡Fui yo, MICHI!'  
  **Ataque:** ¡ZA MIAURUDO!  
  <sub>Ref: JoJo's Bizarre Adventure (DIO)</sub>
- **Doramichi** · ⏳ Chronos / 🌀 Multiverso · *Legendario* · Soporte · Update 4 (Multiverso)  
  Gato-robot azul del siglo XXII. No tiene orejas porque se las mordió un ratón, así que les tiene pánico. Saca de su bolsillo 4D cualquier cosa, menos lo que necesitas.  
  **Pasiva:** Bolsillo 4D: +2 slots de artefacto; un artefacto aleatorio extra por batalla.  
  <sub>Ref: Doraemon</sub>
- **Frierin** · ⏳ Chronos / ✨ Magia/Arcano · *Legendario* · Francotirador · Update 3 (Chronos) · Base: `sakura_whisper_cat`  
  Maga elfa-gata que ha vivido mil años. Para ella, diez años 'fueron sólo una siesta'. Colecciona hechizos inútiles y se mete de cabeza en cofres que son mímicos. Todas las veces.  
  **Ataque:** Magia Ofensiva Ordinaria · **Pasiva:** Coleccionista: aprende un hechizo inútil aleatorio al inicio de cada batalla.  
  <sub>Ref: Frieren: Más allá del final del viaje</sub>
- **Marty McMiau** · ⏳ Chronos · *Épico* · Artillero · Update 3 (Chronos) · Base: `steampunk_clockwork_cat`  
  Viajó al pasado en un arenero con ruedas a 88 ronroneos por minuto. Si no consigue que sus padres hagan Resonancia, va a desaparecer de las fotos.  
  **Ataque:** 88 Ronroneos por Minuto  
  <sub>Ref: Volver al Futuro</sub>
- **Benjamín Botones** · ⏳ Chronos · *Raro* · Soporte · Update 3 (Chronos) · Base: `steampunk_clockwork_cat`  
  Nació siendo un gato viejito. Con cada estrella se vuelve más joven. A 6 estrellas es un gatito recién nacido y el más fuerte de todos.  
  **Ataque:** Botones de Benjamín · **Pasiva:** Al Revés: sube stats en orden inverso a los demás gatos.  
  <sub>Ref: El Curioso Caso de Benjamin Button</sub>

### 🌀 Multiverso (12)

- **Miguel O'Garra, Gato 2099** · 🌀 Multiverso · *Legendario* · Destructor · Update 4 (Multiverso)  
  Líder de la Sociedad Gatuna. Vigila que cada gato de cada universo cumpla sus eventos canónicos: tirar el vaso, sentarse en el teclado e ignorar la cama de 800 pesos para dormir en la caja.  
  **Ataque:** Evento Canónico: El Vaso  
  <sub>Ref: Spider-Verso (Miguel O'Hara / Sociedad Araña)</sub>
- **Gato-Punk** · 🌀 Multiverso / ⚡ Eléctrico/Plasma · *Épico* · Artillero · Update 4 (Multiverso) · Base: `neon_glitch_cat`  
  Hecho de recortes de revista y pura anarquía. Está en contra del horario de comida. Y del horario. Y de la comida (mentira, ama la comida).  
  **Pasiva:** Anarquía: 1 de cada 3 ataques ignora escudos.  
  <sub>Ref: Spider-Punk (Spider-Verso)</sub>
- **Chat Noir** · 🌀 Multiverso / 🕳️ Void · *Épico* · Francotirador · Update 4 (Multiverso) · Base: `storybook_ink_cat`  
  Viene de un universo en blanco y negro de los años 30 donde siempre llueve. No ve colores. No entiende para qué sirve un arcoíris.  
  **Pasiva:** Noir: inmune a ceguera, brillo y confusión.  
  <sub>Ref: Spider-Man Noir + el cartel 'Le Chat Noir' (1896)</sub>
- **Michi 8-Bits** · 🌀 Multiverso · *Común* · Artillero · Update 4 (Multiverso) · Base: `neon_glitch_cat`  
  Se mueve en cuadritos, hace 'bip' al saltar y tiene un sprite de 16x16. Es el gato más honesto: lo que ves es lo que hay.  
  **Pasiva:** 1-UP: +1 vida extra a cambio de -50% HP máximo.  
  <sub>Ref: Videojuegos retro de los 80</sub>
- **Michi Cuadrado** · 🌀 Multiverso / 🪨 Tierra · *Común* · Tanque · Update 4 (Multiverso)  
  Viene de un mundo hecho de bloques. Los enemigos que explotan le tienen miedo y huyen. Grita '¡MICHI JINETE!' cuando se sube a una gallina.  
  **Pasiva:** Antiexplosivos: los enemigos explosivos no pueden apuntarle.  
  <sub>Ref: Minecraft</sub>
- **Michi C-137** · 🌀 Multiverso / ✨ Magia/Arcano · *Legendario* · Invocador · Update 4 (Multiverso)  
  El michi más michi de todos los universos. Eructa a media frase, tiene una pistola de portales hecha con un tubo de papel y grita 'Miaubba lubba dub dub' cuando está triste.  
  **Ataque:** Pistola de Portales de Cartón  
  <sub>Ref: Rick and Morty</sub>
- **Michi del Musical Maldito** · 🌀 Multiverso · *Mítico* · Destructor · Update 4 (Multiverso)  
  Viene del universo más perturbador del multiverso: gatos con cara de actor y proporciones incorrectas. Nadie pidió que llegara. Llegó. Lo sentimos.  
  **Ataque:** Tecnología de Pelaje Digital  
  <sub>Ref: Cats (película de 2019) y su 'tecnología de pelaje digital'</sub>
- **Michi D. Ruffi, Modo Caricatura** · 🌀 Multiverso / 🔥 Fuego · *Mítico* · Destructor · Update 4 (Multiverso) · Base: `sol_sunbeam_cat`  
  Un gato de goma que quiere ser Rey de los Piratas... de la siesta. Cuando despierta su forma final se vuelve caricatura de los años 30, se ríe sin parar y la física deja de aplicar.  
  **Ataque:** Gear Miau: Modo Caricatura  
  <sub>Ref: One Piece (Luffy, Gear 5)</sub>
- **Michi Señalando a Michi** · 🌀 Multiverso · *Raro* · Soporte · Update 4 (Multiverso)  
  Siempre viene de a dos. Se señalan mutuamente. Ninguno sabe quién es el original. Probablemente ninguno.  
  **Ataque:** ¿Tú Eres Yo?  
  <sub>Ref: Meme de Spider-Man señalando a Spider-Man</sub>
- **Gato Sonrisa** · 🌀 Multiverso / 🕳️ Void · *Legendario* · Soporte · Update 4 (Multiverso) · Base: `storybook_ink_cat`  
  Desaparece poco a poco hasta que sólo queda su sonrisa flotando. Da indicaciones hacia todos lados al mismo tiempo. Dice que aquí todos están locos. Tiene razón.  
  **Pasiva:** Desvanecer: invisible 1 de cada 3 turnos.  
  <sub>Ref: Alicia en el País de las Maravillas (Gato de Cheshire, dominio público)</sub>
- **Tomás de Caricatura** · 🌀 Multiverso · *Común* · Tanque · Update 4 (Multiverso)  
  Lo han aplastado con un piano, planchado con una aplanadora y doblado como acordeón. Siempre vuelve a su forma con un 'boing'.  
  **Pasiva:** Física de Caricatura: sobrevive un golpe letal con 1 HP una vez por batalla.  
  <sub>Ref: Tom y Jerry (física de caricatura clásica)</sub>
- **Michi Seis-Siete** · 🌀 Multiverso · *Común* · Soporte · Update 4 (Multiverso)  
  Mueve las patitas arriba y abajo diciendo 'seis siete'. Nadie sabe qué significa. Él tampoco. Llegó de un universo de 2025 y no se quiere ir.  
  **Pasiva:** Seis Siete: +6.7% de crítico para todo el barco.  
  <sub>Ref: Meme '6-7' (2025) — caduca rápido, ver guía de tono</sub>

---

## 3. Ataques y ultimates

**90 ataques.** Tipo = forma del disparo o efecto (proyectil parabólico, rayo, área, interno, control, defensa, tiempo...). El grito es lo que el gato dice en el Battle Form.

### 🔥 Fuego (13)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Kamehamiau** | rayo | Carga 1 turno; rayo recto que atraviesa hasta 3 módulos. | ¡KA-ME-HA-ME-MIAUUUUU! | Dragon Ball |
| **Resplandor Final de Bigotes** | rayo | Rayo enorme; +50% daño si el objetivo es más grande que su barco. | ¡INSECTOOO! | Dragon Ball (Final Flash) |
| **Bola de Pelo Incendiada** | proyectil | Proyectil parabólico que deja fuego 2 turnos sobre madera. | *cof cof* ¡HAIRBALL IGNITION! | Original (CHARLA) + vida real gatuna |
| **Combustión de Motor** | buff | +1 movimiento y +20% daño de fuego al barco por 2 turnos. | ¡Dame leña y te doy velocidad! | El Castillo Ambulante |
| **¡GATARYS!** | area | Cono de fuego que incendia todos los módulos de madera de una cubierta. | ¡GATARYS! | Game of Thrones (Dracarys) |
| **Yo Soy el que Tumba** | interno | Bomba química que entra por huecos y explota dentro; empuja objetos fuera de las repisas del barco enemigo. | Yo no estoy en peligro. Yo SOY el que tumba. | Breaking Bad |
| **Pata del Diablo** | proyectil | Patada en llamas a corta distancia: x2 daño a escudos. | ¡DIABLE PATTE! | One Piece (Diable Jambe) |
| **¡Ven Pa'cá!** | control | Arpón que saca a un gato enemigo de su módulo y lo deja colgando 1 turno. | ¡VEN PA'CÁÁÁ! | Mortal Kombat (Get over here) |
| **Lasañazo** | proyectil | Lanza una charola de lasaña ardiente; aturde 1 turno. Los lunes hace x2. | Odio los lunes. | Garfield |
| **Destructor de Vasos** | area | Ultimate de un solo uso: destello blanco, silencio de 2 segundos y explosión gigante en el centro del barco enemigo. | Ahora me he convertido en Gato... destructor de vasos. | Oppenheimer |
| **¡Sardina!** | invocacion | Lanza 6 michions que explotan en cadena; daño bajo pero rompe escudos burbuja. | ¡SARDINAAA! *aplausos* | Minions |
| **Aliento Atómico de Sardina** | rayo | Carga 2 turnos; rayo azul que barre el barco de proa a popa. | *rugido de kaiju* ...miau. | Godzilla |
| **Uno... Dos... Dos y Medio...** | carga | Ultimate de carga: cada turno que esperas suma x1 de daño, hasta x5. El enemigo ve la cuenta. | Uno... dos... dos y medio... ¡DOS Y TRES CUARTOS! | La cuenta de mamá (cultura latina) |

### 💧 Agua (6)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **¿Por Qué Se Acabó el Atún?** | control | Roba 10% de la comida o el oro que el enemigo lleva como botín. | ¿POR QUÉ SIEMPRE SE ACABA EL ATÚN? | Piratas del Caribe |
| **Respiración del Atún: Primera Postura** | proyectil | Corte de agua en arco que moja y parte un módulo; los mojados reciben x1.5 de eléctrico. | ¡Respiración del Atún... Primera Postura! | Demon Slayer |
| **Salpicadura** | broma | No pasa nada. 1% de probabilidad de crítico x100. | *splash* | Pokémon (Splash) |
| **El Cajón de Davy Garras** | interno | Tentáculos desde el agua jalan un módulo inferior al fondo del mar. | ¿Le temes a la muerte... o al baño? | Piratas del Caribe |
| **La Ola del 86** | area | Todos tus gatos se levantan en secuencia y generan un tsunami que golpea la línea de flotación. | ¡LA OLAAAA! | La ola del estadio (Mundial México 86) |
| **¡Liberen al Krakatún!** | invocacion | Invoca un kraken-atún que abraza el barco enemigo: -1 movimiento 2 turnos. | ¡LIBEREN AL KRAKATÚÚÚN! | Furia de Titanes |

### 🌱 Naturaleza (4)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Raíces de Guardián** | defensa | Raíces cubren 2 módulos aliados con escudo de madera. | Miau. (Subtítulo: 'Nosotros somos Gato.') | Guardianes de la Galaxia |
| **¡Soy Michi Pepinillo!** | control | Lanza un pepinillo gigante: los gatos enemigos cercanos saltan en pánico y salen de sus módulos 1 turno. | ¡SOY MICHI PEPINILLOOO! | Rick and Morty + gatos vs. pepinos |
| **Lanzamiento de Pikmichis** | proyectil | Lanza 5 gatitos-brote que se pegan al casco y hacen daño por turno. | ¡Vayan, mis pequeños! (Ellos: *grititos*) | Pikmin |
| **¡Piedra, Papel o Garra!** | aleatorio | Elige al azar: Piedra (daño estructural), Papel (ciega 1 turno) o Garra (crítico garantizado). | ¡Piedra, papel o... GARRA! | Hunter x Hunter (Jajanken) / cachipún |

### 🪨 Tierra (8)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Ronrón Ronrón: Terremoto** | area | Ronroneo sísmico que agrieta todo el barco enemigo y desplaza 1 módulo al azar. | ¡La Última Croqueta... ES REAL! | One Piece (Gura Gura) |
| **¡Garras Fuera!** | proyectil | Dispara ambas garras como cohetes; regresan solas al siguiente turno. | ¡GARRAS FUERAAA! | Mazinger Z (Puños fuera) |
| **Garrazo Serio** | proyectil | Destruye por completo un módulo. Pero el gato se pone a pensar en las ofertas del súper y pierde el siguiente turno. | Garrazo... serio. | One Punch Man |
| **¿No Están Entretenidos?** | provocacion | Todos los enemigos deben atacarlo 1 turno; él gana +40% defensa. | ¿¡NO ESTÁN ENTRETENIDOS!? | Gladiador |
| **Estilo de Tres Garras** | proyectil | Tres cortes en línea; 15% de que salgan hacia otro lado. | Santoryu... ¿dónde estoy? | One Piece (Santoryu) |
| **La Roca Rodante** | proyectil | Una roca gigante rueda por la cubierta enemiga golpeando todo a su paso. | ¡¿Por qué siempre una roca?! | Indiana Jones |
| **Torta de Jamón Imaginaria** | buff | Cura 20% a sí mismo pensando en una torta que nunca le van a dar. | ¡Es que no me tienen paciencia! | El Chavo del 8 |
| **Modo Hogaza** | defensa | Se vuelve pan: inmune al daño 2 turnos, no puede actuar. | ... | Meme 'cat loaf' |

### ⚡ Eléctrico/Plasma (11)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Plasma Relámpago** | rayo | Cien millones de golpes por segundo: 12 impactos pequeños que encadenan electricidad. | ¡Enciende tu cosmos! ¡PLASMA RELÁMPAGO! | Los Caballeros del Zodiaco |
| **Respiración del Trueno: Primera Postura** | rayo | Destello instantáneo que cruza el mapa; x3 si el gato estaba dormido. | *ronquido* ...Primera Postura. *ZAS* | Demon Slayer |
| **Velocidad Divina** | buff | Actúa dos veces este turno. | Yo no soy normal... pero quiero chocolates (de mentira). | Hunter x Hunter (Godspeed) |
| **Raikiri de Bigotes** | proyectil | Embestida eléctrica que perfora metal. | Perdón por la tardanza. ¡RAIKIRI! | Naruto |
| **Tiempo Bala Felino** | defensa | Esquiva automáticamente los próximos 2 proyectiles en cámara lenta. | No hay cuchara. Hay lata. | Matrix |
| **Hasta la Vista, Croqueta** | proyectil | Disparo pesado al núcleo; si lo destruye, el gato hace una pose con lentes oscuros. | Hasta la vista, croqueta. | Terminator |
| **Martillo del Atún** | area | Lata-martillo que cae como rayo; aturde a todos los gatos de una cubierta. | ¡OTRO! | Thor |
| **Ratoncito Chillón** | proyectil | Martillazo con un ratón de juguete: poco daño, pero aturde y suena muy fuerte. | ¡Síganme los michis! *chuii chuii* | El Chapulín Colorado (chipote chillón) |
| **Garra del Augurio** | control | Revela todos los módulos ocultos y el punto débil del barco enemigo. | ¡Garra del Augurio, dame visión más allá del plato vacío! | Thundercats |
| **¡Que No Panda el Cúnico!** | curacion | Elimina miedo y pánico de todo tu barco. | ¡Que no panda el cúnico! | El Chapulín Colorado |
| **¡No Contaban con mi Astucia!** | contraataque | Prepara un contraataque automático contra el próximo golpe recibido. | ¡No contaban con mi astucia! | El Chapulín Colorado |

### 🌪️ Viento (10)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Rasenbola** | proyectil | Esfera de viento y estambre que taladra 2 pisos. | ¡RASENBOLA, DATTEMIAU! | Naruto (Rasengan) |
| **Gato Bunshin no Jutsu** | invocacion | Crea 3 clones que atraen disparos enemigos 1 turno. | ¡Gato Bunshin no Jutsu! | Naruto (Kage Bunshin) |
| **Charla no Jutsu** | control | Convierte a un gato enemigo con menos de 30% HP en aliado por 1 turno. | Mira, yo también estuve solo... (3 minutos de diálogo). | Naruto (meme Talk no Jutsu) |
| **Estado Avatar** | area | Ojos brillantes: lanza un ataque de cada elemento conocido por tu barco. | *voces de todos los avatares anteriores* MIAU. | Avatar: La Leyenda de Aang |
| **La Chancla Teledirigida** | proyectil | Proyectil guiado que dobla esquinas y siempre encuentra su objetivo. Imposible de esquivar. | ¡UNO... DOS... DOS Y MEDIO! | La chancla de mamá (cultura latina) |
| **Zoomies de las 3 AM** | proyectil | Corre por todo el barco enemigo golpeando 5 puntos al azar. | ¡BRRRRRMMMM! (son las 3:00 a.m.) | Sonic + comportamiento real de gatos |
| **Tiro del Tigre** | proyectil | Disparo de trayectoria larguísima: tarda 1 turno extra en llegar pero hace x3. | ¡TIRO DEL TIGREEE! (episodio 1 de 3) | Supercampeones |
| **Bombardeo de Croquetas** | area | Pasa volando y suelta una alfombra de bombas-croqueta en línea. | ¡Bombardino croquetino! | Brainrot italiano |
| **¡UIIIA UIIIA!** | control | Tornado giratorio que desvía el próximo proyectil enemigo. | ¡UIIIA UIIIA UIIIA! | Meme del gato giratorio |
| **¡GATOOOOOL!** | buff | Si el siguiente disparo es crítico, el daño se duplica y el narrador lo grita como gol. | ¡GATOOOOOOOOOOL! | Narración de fútbol latinoamericana |

### ❄️ Hielo (4)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Bola de Muerte Helada** | area | Esfera de hielo enorme que congela medio barco; congelado = x2 daño físico. | Este ni siquiera es mi congelador final. | Dragon Ball (Death Ball) |
| **Se Acerca el Invierno** | area | Congela la cubierta superior enemiga 1 turno. | Se acerca el invierno... y la hora de comer. | Game of Thrones |
| **Suéltalo (el Vaso)** | area | Tormenta de hielo que tira al mar todos los módulos pequeños sueltos. | ¡SUÉLTALOOO! | Frozen |
| **¡GATALITY!** | ejecucion | Destruye instantáneamente un módulo congelado. | ¡GATALITY! | Mortal Kombat (Fatality) |

### ✨ Magia/Arcano (8)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Expelliarmichis** | control | Desactiva un arma enemiga 2 turnos. | ¡EXPELLIARMICHIS! | Harry Potter |
| **Wingardium Miausa** | control | Levita un módulo enemigo y lo deja caer sobre otro. | Es mi-Á-usa, no miau-Á. | Harry Potter |
| **Alohomiau** | control | Abre (anula) un escudo enemigo. | Alohomiau. *clic* | Harry Potter |
| **Accio Atún** | control | Roba un consumible del barco enemigo. | ¡ACCIO ATÚN! | Harry Potter |
| **¡No Pasarás (por la Puerta)!** | defensa | Bloquea por completo el siguiente proyectil enemigo. | ¡NO PASARÁS! ...sin abrirme la puerta. | El Señor de los Anillos |
| **Vaso Telequinético** | proyectil | Lanza con la mente todos los objetos sueltos de su barco al enemigo. | *hilito de concentración* ...vaso. | Stranger Things |
| **Abracatdabra** | aleatorio | Efecto aleatorio de una ruleta de 8 hechizos (incluye convertir un cañón en pato). | ¡ABRACATDABRA! | Magia de escenario clásica |
| **Croqueta Chiquitolina** | defensa | Encoge a un gato aliado: -70% probabilidad de ser golpeado 2 turnos. | *glup* ...¿dónde quedé? | El Chapulín Colorado (pastillas de chiquitolina) |

### 🌌 Cósmico (9)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Expansión de Dominio: Bola de Estambre Infinita** | area | Durante 1 turno todos tus ataques aciertan automáticamente; el barco enemigo queda envuelto en estambre infinito. | Expansión de Dominio... ¡BOLA DE ESTAMBRE INFINITA! | Jujutsu Kaisen (Muryokusho) |
| **Morado Hueco: Croqueta Imaginaria** | rayo | Combina atracción y repulsión: borra una línea recta del barco enemigo. Una vez por batalla. | Técnica imaginaria... MORADO. | Jujutsu Kaisen (Hollow Purple) |
| **Tengo la Repisa Alta** | buff | +60% daño si su módulo está más alto que el objetivo. | Se acabó, enemigo. Tengo la repisa alta. | Star Wars (High ground) |
| **Lado Oscuro de la Croqueta** | control | Atrae a un gato enemigo hacia el borde de su módulo; 25% de que caiga al mar. | Únete a mí... y gobernaremos la cocina. | Star Wars |
| **¡Poder del Prisma Michi!** | buff | Transformación con listones y brillos: +30% daño a todo el barco 2 turnos. | ¡PODER DEL PRISMA MICHI... TRANSFÓRMATE! | Sailor Moon |
| **Ooooh... La Garra** | control | Una garra de feria baja del cielo y se lleva a un gato enemigo 1 turno. | Ooooooooh... la garraaa. | Toy Story |
| **¡Al Infinito y a la Caja!** | proyectil | Salto balístico; aterriza dentro de un módulo enemigo y lo ocupa. | ¡AL INFINITO... Y A LA CAJA! | Toy Story |
| **¡GARRA GARRA GARRA!** | proyectil | Ráfaga de 20 golpes en un solo módulo. | ¡GARRA GARRA GARRA GARRA GARRA! | JoJo (Ora ora) |
| **Lluvia de Meteoros de Pegagato** | area | Decenas de meteoritos pequeños sobre todo el barco. | ¡METEOROS DE PEGAGATO! | Los Caballeros del Zodiaco |

### 👻 Espíritu (4)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Expecto Gatronum** | defensa | Invoca un gato espiritual plateado que bloquea un ataque mágico o de espíritu. | ¡EXPECTO GATRONUM! | Harry Potter |
| **¡Ay, Mis Gatitos!** | control | Grito fantasmal: los gatos enemigos tienen 30% de fallar su próximo disparo por miedo. | ¡AAAAAY, MIS GATIIITOS! | La Llorona |
| **Té del Dragón del Oeste** | curacion | Cura 30% a todo el barco y elimina estados de miedo. | Siéntate. El té no se toma con prisa. | Avatar (Tío Iroh) |
| **Limpia con Huevo** | curacion | Quita todas las maldiciones y debuffs de un gato aliado. | Quédate quietito, que traes mucha mala vibra. | Limpias tradicionales (cultura latina) |

### 🕳️ Void (4)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Agujeros de Manchas** | control | Coloca dos portales: lo que entra por uno (incluso disparos enemigos) sale por el otro. | ¿Me tomas en serio ahora? | Spider-Verso (The Spot) |
| **Chasquido de Almohadilla** | area | Una vez por batalla: la mitad de los módulos enemigos pierden su armadura. | Soy inevitable. *plop* | Avengers (el chasquido) |
| **Caja de Schrödinger** | aleatorio | El disparo hace x2 o nada; no se sabe hasta que impacta (y el juego muestra ambos resultados superpuestos). | ¿Le atiné? Depende de si miras. | Física cuántica |
| **Santuario Malévolo de Arena** | area | Dominio: un arenero gigante que corta todos los módulos de una cubierta durante 2 turnos. | Expansión de Dominio... Santuario Malévolo. (Huele raro.) | Jujutsu Kaisen |

### ⏳ Chronos (4)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **¡ZA MIAURUDO!** | tiempo | Detiene el tiempo: el jugador obtiene un turno extra completo. | ¡ZA MIAURUDO! ¡El tiempo se ha detenido! | JoJo (Za Warudo) |
| **Magia Ofensiva Ordinaria** | rayo | Rayo simple, preciso y barato. Es 'ordinaria' y aun así rompe casi todo. Rareza no es poder. | Es un hechizo común. Por eso funciona. | Frieren (Zoltraak) |
| **88 Ronroneos por Minuto** | tiempo | Rebobina tu último disparo y lo deja repetir con otro ángulo. | ¡GRAN GARRA! ¡A 88 ronroneos por minuto! | Volver al Futuro |
| **Botones de Benjamín** | control | Rejuvenece un módulo enemigo hasta su estado de plano: queda inactivo 2 turnos. | Todo se vuelve nuevo... y frágil. | El Curioso Caso de Benjamin Button |

### 🌀 Multiverso (5)

| Ataque | Tipo | Efecto sugerido | Grito | Ref |
|---|---|---|---|---|
| **Evento Canónico: El Vaso** | control | Obliga a un gato enemigo a tirar al mar un módulo pequeño. Es canon. No se puede evitar. | Es un evento canónico. Todos los gatos tiran el vaso. | Spider-Verso (canon events) |
| **Pistola de Portales de Cartón** | invocacion | Abre un portal y llama a un gato aleatorio de otro universo por 1 turno. | ¡Miaubba lubba dub dub! | Rick and Morty |
| **Tecnología de Pelaje Digital** | control | Horror visual: todos los enemigos pierden 40% de precisión 2 turnos. | *canta muy de cerca de la cámara* | Cats (2019) |
| **Gear Miau: Modo Caricatura** | buff | El gato cambia a estilo cartoon de los años 30: sus ataques ignoran la física (rebotan, se estiran, aplastan) 3 turnos. | ¡JAJAJAJA! ¡El ritmo de la liberación! | One Piece (Gear 5) |
| **¿Tú Eres Yo?** | copia | Copia el último ataque usado por cualquier gato. | ¡Tú eres yo! / ¡No, tú eres yo! | Meme de Spider-Man señalando |

---

## 4. Mundo: barcos, módulos, islas, jefes, comida y edificios

### 4.1 Barcos (28)

| Barco | Clase | Gatos / Armas / Escudos | Descripción | Ref |
|---|---|---|---|---|
| **Going Meowy** | Inicial | 3 / 1 / 0 | Tu primer barco, hecho con tablas de una caja de mudanza. Hace agua, rechina y tiene cara de borrego en la proa. Al final del Capítulo 1 recibe un funeral vikingo con todos tus gatos llorando en la orilla. | One Piece (Going Merry) |
| **Thousand Sunbeam** | Fragata | 5 / 3 / 1 | Sucesor del Going Meowy. Tiene un rayito de sol permanente en la cubierta donde siempre hay un gato acostado. Su especial: 'Coup de Bola de Pelo', un tosido que lo impulsa 3 casillas. | One Piece (Thousand Sunny) |
| **The Black Purrl** | Marauder | 5 / 4 / 0 | Velas negras, casco negro, gatos negros. Bajo la luna llena la tripulación se vuelve esquelética (bonus de Espíritu). Nadie sabe quién es el capitán; todos dicen que son ellos. | Piratas del Caribe (Black Pearl) |
| **Millennium Furcon** | Sparrow | 3 / 2 / 1 | Parece un montón de chatarra, pero hizo la Ruta de la Croqueta en menos de 12 pársecs. Velocidad donde importa. Su copiloto ruge todo el tiempo. | Star Wars (Millennium Falcon) |
| **RMS Gatanic** | Bastion | 7 / 5 / 3 | El barco 'insumergible'. Enorme, lujoso, con orquesta de gatos que sigue tocando pase lo que pase. Recibe x3 de daño de Hielo. Nadie lee la letra chiquita. | Titanic |
| **El Gatandés Errante** | Fantasma | 6 / 3 / 2 | Barco fantasma condenado a navegar para siempre sin tocar puerto ni arenero. Puede mover gatos entre habitaciones atravesando paredes. | El Holandés Errante (leyenda marinera) |
| **Arca Celestial** | Celestial | 8 / 4 / 3 | Barco de late game que manipula la gravedad. Lleva dos gatos de cada elemento por si acaso. | Original (CHARLA) + Arca de Noé |
| **Nautimichi** | Submarino | 4 / 3 / 1 | Submarino del Capitán Nemiau. Puede sumergirse 1 turno para esquivar todo. Los gatos odian estar bajo el agua, pero aman las ventanitas. | 20,000 Leguas de Viaje Submarino (Julio Verne, dominio público) |
| **El Barco Ambulante de Aullido** | Mágico | 5 / 2 / 2 | Un barco con patas de gallina que camina sobre el agua. El motor es un demonio de fuego quejumbroso. Cambia de forma cada vez que lo mejoras. | El Castillo Ambulante (Ghibli) |
| **Trajinera 'La Lupita'** | Fiesta | 6 / 2 / 1 | Trajinera de colores con el nombre pintado en arco de flores. Llega con mariachi gatuno a bordo: +moral, y en cada batalla se acerca una canoa a venderte elotes de sardina. | Trajineras de Xochimilco (cultura mexicana) |
| **La Combi Anfibia** | Transporte | 8 / 1 / 1 | ¡Súbale, súbale, hay lugares! Lleva más gatos que ningún otro barco, siempre cabe uno más. No da cambio. | Combis/peseras latinoamericanas + Gatobús |
| **El Tóper Acorazado de la Abuela** | Defensivo | 4 / 2 / 3 | Un contenedor de plástico gigantesco con tapa hermética. Todos creen que trae comida; trae frijoles. La tapa funciona como escudo que se sella 1 vez por batalla. | Meme latino: el tóper de la abuela |
| **La Bola de Estambre de la Muerte** | Jefe Final Cap. 1 | 12 / 10 / 5 | Estación de batalla del Almirante Firulais. Tamaño de una luna, forma de bola de estambre. Debilidad: un agujero de ratón de dos metros que nadie tapó. | Star Wars (Estrella de la Muerte) |
| **USS Entergato** | Explorador Cósmico | 6 / 3 / 3 | Su misión: explorar extraños mundos nuevos, buscar nuevas formas de croqueta y llegar audazmente a donde ningún gato ha llegado (la azotea del vecino). | Star Trek |
| **Nabucodonomichi** | Hacker | 5 / 2 / 1 | Nave de la resistencia que ve el código del mar. Su arma especial hackea un módulo enemigo y lo pone de tu lado 1 turno. | Matrix (Nabucodonosor) |
| **Endurance-Miau** | Chronos | 5 / 3 / 2 | Estación giratoria. Cerca de un agujero negro, 1 turno aquí son 7 turnos para el enemigo. Para acoplarse hay que girar al mismo ritmo: ¿es posible? No. ¿Es necesario? Sí. | Interstellar |
| **La Nadie** | Héroe | 6 / 4 / 2 | Barco legendario del final del Capítulo 1. Cuando el cíclope de la isla preguntó quién lo había derrotado, la tripulación respondió: 'Nadie'. Y es verdad. | La Odisea (Homero, 'Nadie'), en el año de La Odisea de Nolan |
| **El Barril del 8** | Mini | 1 / 1 / 0 | Un barril que flota. Cabe un solo gato. Es casi imposible pegarle. Inmune al Señor Barriga. | El Chavo del 8 |
| **Drakkar Chimiaulo** | Vikingo | 5 / 3 / 2 | Barco vikingo con mascarón de dragón negro que persigue puntitos de luz como gato. +daño de Fuego; se distrae con láseres enemigos. | Cómo Entrenar a tu Dragón (Chimuelo) |
| **La Gatinave** | Sigilo | 3 / 3 / 1 | Negra, silenciosa y llena de gadgets. Es invisible el primer turno. El dueño es un millonario que no tiene superpoderes. | Batman |
| **Barquito de Papel** | Origami | 3 / 2 / 0 | Como los que hacías cuando llovía y los ponías a correr en la banqueta. Se dobla para esquivar. Si se moja demasiado, se deshace. | Infancia latinoamericana + origami |
| **Pequod-Miau** | Cazador | 5 / 4 / 1 | Barco del obsesivo Capitán Acab. +50% daño contra jefes marinos. -50% contra todo lo demás porque no le interesa. | Moby Dick (Melville, dominio público) |
| **La Venganza de la Reina Gatana** | Marauder | 6 / 5 / 1 | Barco pirata clásico con bandera de calavera felina. Puede abordar barcos enemigos. Huele a pólvora y a sardina. | Barco histórico de Barbanegra |
| **Arca de Noé-Miau** | Resonancia | 8 / 1 / 2 | Barco de soporte: cada batalla ganada con él reduce -10 min todas tus Resonancias activas. | Arca de Noé (tradición) |
| **Caja Voladora** | Aéreo | 3 / 2 / 0 | Una caja de cartón con hélice. Si quepo, me subo. Cambia la física de la batalla: dispara desde arriba. | 'If I fits, I sits' (meme) |
| **El Sumergible Atunero** | Submarino | 4 / 2 / 2 | Pesquero-submarino que convierte cada módulo enemigo hundido en comida para la isla. | Original |
| **Barca Kame-Michi** | Entrenamiento | 2 / 1 / 1 | Una casita rosa sobre una isla diminuta que flota. Los gatos que pelean en ella ganan x2 XP. Su dueño es un maestro viejito con lentes oscuros. | Dragon Ball (Kame House) |
| **La Serenata** | Musical | 5 / 2 / 2 | Barco con bocinas enormes. Sus disparos van al ritmo; los gatos con 'Al Ritmo' hacen +25% extra. | Hi-Fi Rush / sonideros latinos |

### 4.2 Módulos, armas y escudos (52)

**Armas (16)**

| Módulo | Elemento | Efecto | Ref |
|---|---|---|---|
| **Gatapulta** | ⚪ Neutral | Lanza a un gato aliado como proyectil: daño según su peso y nivel. El gato aterriza de pie (siempre). | Catapulta + Los Simpson (la señora que lanza gatos) |
| **Cañón Chancla Teledirigida** | 🌪️ Viento | Proyectil guiado que dobla esquinas. Imposible de esquivar, daño medio. | La chancla de mamá |
| **Puntero Láser de la Purrza** | 🌌 Cósmico | Rayo continuo de bajo daño; los gatos enemigos que lo ven pierden su turno persiguiendo el puntito rojo. | Star Wars (sable de luz) + gatos vs. láser |
| **Bazuca de Bolas de Pelo** | 🔥 Fuego | Disparo parabólico pegajoso: deja el módulo 'asqueroso' (-20% eficiencia). | Vida real gatuna |
| **Lanzarratones de Cuerda** | ⚡ Eléctrico/Plasma | Torpedos con forma de ratón de cuerda que avanzan por la cubierta enemiga y explotan. | Juguetes de gato clásicos |
| **Ratoncito Chillón Mk II** | ⚡ Eléctrico/Plasma | Martillo de corto alcance: aturde 1 turno y suena 'chuii'. | El Chapulín Colorado |
| **Mortero de Croquetas** | 🪨 Tierra | Lluvia de croquetas duras en área; los gatos enemigos 1% de probabilidad de ponerse a comer. | Original |
| **Balista de la Garra Maestra** | ✨ Magia/Arcano | Arma legendaria clavada en una roca: sólo la puede equipar un gato de 5 estrellas o más. Daño perforante enorme. | Zelda (Espada Maestra) + la espada en la piedra |
| **Cañón Starbreaker** | 🌌 Cósmico | Un solo disparo por combate, atraviesa el casco completo. | Original (CHARLA, evento Lluvia de Meteoros) |
| **Rayo Tractor de La Garra** | 🌌 Cósmico | Máquina de garra de feria: atrapa un módulo pequeño enemigo y lo trae a tu barco. | Toy Story / máquinas de garra |
| **Bobina de Gatesla** | ⚡ Eléctrico/Plasma | Rayo encadenado; +1 salto por cada gato eléctrico a bordo; x1.5 contra mojados. | Bobina de Tesla (CHARLA: Tesla Cannon) |
| **Arpón ¡Ven Pa'cá!** | 🔥 Fuego | Engancha un módulo enemigo y lo jala hacia tu barco (puedes robarlo si lo rompes). | Mortal Kombat |
| **Lanzapepinos** | 🌱 Naturaleza | Daño mínimo, pero cada gato enemigo golpeado salta de pánico fuera de su módulo. | Videos virales de gatos vs. pepinos |
| **Bumerán Fiel** | 🌪️ Viento | Golpea al ir y al volver. Si falla, regresa igual (siempre regresa). | Avatar (el bumerán de Sokka) |
| **Lanzallamas Gatarys** | 🔥 Fuego | Cono corto de fuego que prende toda la madera. | Game of Thrones |
| **Cañón Piñata** | ⚪ Neutral | Dispara piñatas: al romperse, sueltan dulces que dan oro extra al ganar. | Piñatas (cultura mexicana) |

**Escudos (11)**

| Módulo | Elemento | Efecto | Ref |
|---|---|---|---|
| **Campo A.T. (Absoluto Territorio)** | ✨ Magia/Arcano | Hexágonos naranjas: bloquea todo ataque de un gato que no haya 'marcado territorio' en tu barco. | Evangelion (campo AT) + gatos territoriales |
| **Escudo Burbuja** | 💧 Agua | Bloquea un impacto completo. Los gatos lo revientan si se aburren. | Original (CHARLA) |
| **Escudo Espejo** | ✨ Magia/Arcano | 20% de reflejar el proyectil. Si se rompe: 7 turnos de mala suerte. | Superstición: romper un espejo |
| **Tapa Hermética del Tóper** | 🪨 Tierra | Se sella 1 vez por batalla y bloquea todo 1 turno. Al abrirla salen frijoles (cura 5%). | El tóper de la abuela |
| **Escudo del Capitán Atún** | 🪨 Tierra | Tapa redonda de lata gigante: rebota el proyectil a otro módulo enemigo. | Capitán América |
| **Escudo 'Si Quepo, Me Siento'** | ⚪ Neutral | Caja de cartón: frágil, pero un gato dentro gana +50% defensa y no se mueve por nada. | Meme 'If I fits, I sits' |
| **Muralla Michi-Rosa-Siamesa** | 🪨 Tierra | Tres capas de muralla. Cuando cae la primera, todos gritan. | Attack on Titan (murallas) |
| **Paraguas de Michi Poppins** | 🌪️ Viento | Desvía proyectiles verticales (morteros, meteoros). | Mary Poppins |
| **Escudo del Vacío** | 🕳️ Void | No bloquea: teletransporta el proyectil a un lugar aleatorio del mapa. | Original (CHARLA) |
| **Escudo de la Ofrenda** | 👻 Espíritu | Al romperse cura a todos tus gatos 25%. | Original (CHARLA) + ofrenda de Día de Muertos |
| **Barrera Honmiau** | ✨ Magia/Arcano | Escudo dorado que se fortalece si tus gatos atacan en armonía (mismo elemento en turnos seguidos); se agrieta si discuten. | Las Guerreras K-Pop (2025) — la barrera mágica, sin canciones |

**Cascos (5)**

| Módulo | Elemento | Efecto | Ref |
|---|---|---|---|
| **Malla de Mithrilmiau** | 🪨 Tierra | Ligera como seda, dura como diamante. Un gato la usó debajo del suéter y nadie se dio cuenta. | El Señor de los Anillos |
| **Casco de Gatskar** | 🪨 Tierra | Metal sagrado: inmune al primer rayo de cada batalla. Este es el camino. | The Mandalorian (beskar) |
| **Casco de Cartón Corrugado** | ⚪ Neutral | Barato y ligero: +velocidad, -armadura. Los gatos lo aman más que cualquier casco caro. | Los gatos y las cajas |
| **Casco Kintsugi** | 👻 Espíritu | Cada vez que se rompe y se repara con oro, gana +10% armadura permanente en esa batalla. | Kintsugi (arte japonés) |
| **Casco de Hojalata de Atún** | 💧 Agua | Resistente a Agua; huele tan bien que los gatos enemigos apuntan peor (se distraen). | Original |

**Motores (7)**

| Módulo | Elemento | Efecto | Ref |
|---|---|---|---|
| **Motor Calcifur** | 🔥 Fuego | Se come los módulos de madera destruidos para dar +1 movimiento. | El Castillo Ambulante |
| **Motor de Marea** | 💧 Agua | Se mueve con la marea: +1 movimiento en turnos pares. | Original (CHARLA: Tide Engine) |
| **Rueda de Gato** | ⚪ Neutral | Un gato corre dentro de una rueda gigante: entre más zoomies, más velocidad. | Ruedas de ejercicio para gatos (vida real) |
| **Motor Ronroneo V8** | 🪨 Tierra | Funciona con ronroneos. Si un gato está feliz a bordo, +20% eficiencia. | Original |
| **Hiperimpulsor '¡Pícale, Purrbacca!'** | 🌌 Cósmico | Escape instantáneo de una batalla perdida conservando 50% del botín. | Star Wars (hiperimpulsor) |
| **Condensador de Ronroneo** | ⏳ Chronos | Al llegar a 88 ronroneos por minuto, rebobina el último turno enemigo (1 vez). | Volver al Futuro (condensador de flujo) |
| **Vela Solar de Siesta** | 🌌 Cósmico | Se carga con rayitos de sol. Un gato dormido en la vela duplica su carga. | Gatos durmiendo al sol |

**Especiales (13)**

| Módulo | Elemento | Efecto | Ref |
|---|---|---|---|
| **Gancho de Maniobras de Estambre** | 🌪️ Viento | Permite a un gato balancearse hasta el barco enemigo y atacar cuerpo a cuerpo. | Attack on Titan (equipo de maniobras) |
| **Cámara de Resonancia** | ✨ Magia/Arcano | Cada batalla ganada reduce -5 min tus Resonancias activas. | Original (CHARLA) |
| **Bolsillo 4D** | ⏳ Chronos | +2 slots de artefacto. Te da lo que pediste... casi nunca. | Doraemon |
| **Gatera a Cualquier Parte** | 🌀 Multiverso | Una gatera que conecta dos módulos: mueve un gato a cualquier lado 1 vez por turno. | Doraemon (Puerta Mágica) |
| **Cocina de Sanmichi** | 🔥 Fuego | Cocina comida a media batalla: cura 15% al gato más herido cada 2 turnos. | One Piece (Sanji) |
| **Arenero Táctico** | 🪨 Tierra | Los gatos adyacentes regeneran 5% por turno. Los enemigos evitan dispararle (huele). | Original |
| **Cofre Mímico** | ✨ Magia/Arcano | Señuelo: parece el núcleo; los enemigos le disparan. Si un gato aliado se mete, se lo come 1 turno. | Frieren (los mímicos) / Dark Souls |
| **Caja Táctica** | ⚪ Neutral | Esconde a un gato: no puede ser apuntado hasta que ataque. Al atacar aparece un '!' enorme. | Metal Gear Solid |
| **Altar de Ofrenda** | 👻 Espíritu | Revive a un gato caído 1 vez por batalla con 50% HP. | Día de Muertos |
| **Neurona Naranja (frasco)** | 🔥 Fuego | Si tienes 3+ gatos naranjas, la neurona compartida da +15% precisión a quien la tenga ese turno. | Meme de los gatos naranjas |
| **Antenitas de Vinil** | ⚡ Eléctrico/Plasma | Detectan la presencia del enemigo: revelan el próximo objetivo enemigo. | El Chapulín Colorado |
| **Torre del Ojo de Gatón** | 🕳️ Void | Un ojo en llamas en lo alto del mástil: revela todo el barco enemigo, pero todos te apuntan a ti. | El Señor de los Anillos (Ojo de Sauron) |
| **Tocadiscos Mariachi** | ⚪ Neutral | +10% daño a todo el barco mientras suene; si lo rompen, todos se ponen tristes (-10%). | Mariachi (cultura mexicana) |

### 4.3 Islas y expansiones (22)

| Isla | Elemento | Costo / Desbloqueo | Abre | Descripción | Ref |
|---|---|---|---|---|---|
| **Isla del Abuelo Bigotes** | ⚪ Neutral | Inicial | 2 hábitats, 1 granja, puerto pequeño, Santuario de Resonancia | Heredaste esta isla por una carta de tu abuelo que decía: 'Cuida a los gatos. Ellos no te van a cuidar a ti.' Hay una caja de cartón con tu nombre. | Stardew Valley (la carta del abuelo) |
| **Bosque de los Michinimos** | 🌱 Naturaleza | 15,000 oro | Granjas mejores, gatos Naturaleza, Michinimos recolectores | Bosque costero donde los arbustos se mueven cuando no los miras. | Stardew Valley (Junimos) |
| **Acantilado de la Repisa Alta** | 🌪️ Viento | 85,000 oro | Hábitat Viento, +ángulo de tiro a módulos altos | Quien controla la repisa alta controla la isla. Lo dijo un maestro con barba. | Star Wars (high ground) |
| **Monte Arenero del Destino** | 🔥 Fuego | 600,000 oro | Hábitats de Fuego, Forja, piezas de cañón, minerales | Un volcán con forma de arenero gigante. Ahí se forjó la Neurona Naranja. Huele a azufre (y a otra cosa). | El Señor de los Anillos (Monte del Destino) |
| **Más Allá del Muro (de Hielo)** | ❄️ Hielo | 2.5M oro | Gatos Hielo, comida congelada, materiales defensivos, jefe Frízer | Detrás de una muralla de hielo de 200 metros. Se acerca el invierno; aquí ya llegó. | Game of Thrones |
| **Colegio Hogmichi de Magia y Gatería** | ✨ Magia/Arcano | Derrotar a Dumbledog (nivel 37) | Elemento Magia, escudos, Hábitat Arcano, 17 Resonancias nuevas | Ruinas mágicas donde una caja seleccionadora decide en qué casa vives (siempre elige la caja más chica). | Harry Potter |
| **Jurásic Purrk** | 🪨 Tierra | 1.2M oro | Laboratorio de Ámbar, gatos fósiles | Bienvenidos. No reparamos en gastos. Aquí clonamos gatos prehistóricos a partir de pulgas en ámbar. ¿Qué podría salir mal? | Jurassic Park |
| **Xochimichi** | 💧 Agua | 350,000 oro | Canales, trajineras, mercado flotante, Trajinera 'La Lupita' | Canales de colores, trajineras con nombres pintados y una lancha que te ofrece elotes de sardina cada cinco minutos. | Xochimilco (México) |
| **La Vecindad del 8** | 🪨 Tierra | 40,000 oro | Hábitat para gatos Comunes (barriles), El Michi del 8, jefe Señor Barriga | Un patio con lavaderos, una fuente y catorce meses de renta atrasada. Todos los gatos dicen 'fue sin querer queriendo'. | El Chavo del 8 |
| **El Castillo en el Cielo** | 🌪️ Viento | 8M oro | Barcos aéreos, Hábitat de Nubes | Una isla flotante con robots jardineros. Su nombre original en japonés no lo vamos a usar en español, por razones que cualquier latino entiende. | El Castillo en el Cielo (Ghibli) — el chiste latino del título original |
| **Mictlán de los Michis** | 👻 Espíritu | Ganar la batalla del Santuario Ancestral | Elemento Espíritu, Altar de Ofrenda, puente de cempasúchil | El lugar a donde van los gatos que ya se fueron. Hay música, pan de muerto y un puente de pétalos naranjas. Nadie está triste aquí. | Mictlán y Día de Muertos (tradición mexicana), respetuosamente |
| **Isla Kame-Michi** | ⚪ Neutral | 200,000 oro | Dojo, x2 XP de entrenamiento | Una isla diminuta con una casita rosa y una palmera. El maestro que vive ahí entrena gatos a cambio de revistas (de pesca). | Dragon Ball (Kame House) |
| **Aldea Oculta entre las Cajas** | 🌪️ Viento | 900,000 oro | Ninjas felinos, módulo Caja Táctica | Una aldea ninja construida dentro de cajas de cartón apiladas. El líder es el Hokagato. | Naruto (Aldea Oculta de la Hoja) |
| **Arenakis** | 🪨 Tierra | 25M oro | Especia de Atún, Gusano de Arenero (jefe), gatos del desierto | Un planeta-desierto donde el atún debe fluir. Camina sin ritmo o despertarás al gusano. | Dune |
| **La Ciudadela de los Michis** | 🌀 Multiverso | Update 4 | Consejo de Gatos de Todos los Universos, Sociedad Gatuna | El lugar donde se reúnen gatos de todas las realidades a votar quién se sienta en la caja central. | Rick and Morty (Ciudadela) + Spider-Verso (Sociedad Araña) |
| **El Mundo Patas Arriba** | 🕳️ Void | Update 2 (fragmentos ??? x10) | Elemento Void, Demogorgato | Una copia oscura y al revés de tu isla. Aquí los gatos caen de espalda (y aun así de pie). | Stranger Things (El Mundo del Revés) |
| **Isla del Reloj Detenido** | ⏳ Chronos | Update 3 | Elemento Chronos, Habitación de la Siesta y el Tiempo | Todos los relojes marcan la hora de comer. Una siesta aquí dura un año afuera. | Dragon Ball (Habitación del Tiempo) + Interstellar |
| **Atlántida Gatuna** | 💧 Agua | 12M oro | Gatos de aguas profundas, Nautimichi | Una ciudad hundida con columnas de mármol y peceras al revés (los peces miran a los gatos). | Atlántida (mito) |
| **Olimpo de los Rascadores** | ⚡ Eléctrico/Plasma | 40M oro | Gatos Eléctricos míticos, Thormiau | La montaña donde viven los dioses felinos. Se pelean por el rascador más alto. Hay rayos todos los martes. | Mitología griega/nórdica (año de La Odisea) |
| **Isla de Nunca Jamás Me Bañé** | ✨ Magia/Arcano | 3M oro | Gatos que nunca crecen (kittens permanentes), polvo de hadas | Una isla donde ningún gato crece y ninguno se baña. El capitán pirata de la zona le tiene miedo a un cocodrilo con reloj. | Peter Pan (J. M. Barrie, dominio público) |
| **Isla Calavera de Gato** | 💧 Agua | 5M oro | Bandera Negra, piratas, The Black Purrl | Una roca con forma de cráneo felino. Adentro hay un tesoro. Adentro también hay un gato gigante que se llama Kong-Miau. | King Kong / islas pirata clásicas |
| **Akiba-Neko** | ⚡ Eléctrico/Plasma | 6M oro | Cafés de gatos (hábitats de oro), gatos cyber | Distrito flotante lleno de neón, tiendas de figuras y cafés donde los humanos pagan por ver gatos. Los gatos cobran comisión. | Akihabara + cafés de gatos de Japón |

### 4.4 Jefes (20)

#### Almirante Firulais, de la Armada Ladradora · 🪨 Tierra

- **Barco:** Varios; final: La Bola de Estambre de la Muerte
- **Personalidad:** Perro de ojos llorosos y medallas de plástico. Se toma todo personal: su dueño adoptó un gato y lo mandó a dormir al patio. Desde entonces jura que nadie quiere a los gatos.
- **Entrada:** *"¡ESCÚCHENME BIEN! ¡NADIE QUIERE A LOS GATOS! ¡NA-DIE!"*
- **Al ser derrotado:** *"Esto no se acaba aquí... *se va moviendo la cola sin querer*"*
- **Desbloquea:** Antagonista recurrente del Capítulo 1
- <sub>Ref: 'Firulais' (nombre genérico de perro en Latinoamérica) + el título del juego</sub>

#### Albus Perrcival Ladrador Dumbledog · ✨ Magia/Arcano

- **Barco:** El Arcanista
- **Personalidad:** Mago perro anciano, amable en apariencia, siempre con un plan que no te va a contar. Fue el primero en usar escudos.
- **Entrada:** *"Ah... llegas justo a tiempo. Diez puntos menos para tu barco por llegar justo a tiempo."*
- **Al ser derrotado:** *"Fascinante. Es nivel 37 y aun así... fascinante."*
- **Desbloquea:** Elemento Magia + mecánica de Escudos + Hábitat Arcano (nivel 37)
- <sub>Ref: Harry Potter (Dumbledore) + The Arcanist (CHARLA)</sub>

#### Lord Frízer, Emperador del Congelador · ❄️ Hielo

- **Barco:** Nave Congeladora (3 fases)
- **Personalidad:** Educadísimo, sádico y friolento. Habla de usted. Tiene tres formas: refrigerador, congelador y congelador horizontal de tienda.
- **Entrada:** *"Qué gusto conocerlo. Le advierto que éste ni siquiera es mi congelador final."*
- **Al ser derrotado:** *"Imposible... ¡¿derrotado por unos gatos de AGUA TIBIA?!"*
- **Desbloquea:** Elemento Hielo + Frízer jugable
- <sub>Ref: Dragon Ball (Freezer, doblaje latino)</sub>

#### Capitán Acab y Moby Atún · 💧 Agua

- **Barco:** Pequod-Miau
- **Personalidad:** Un perro marinero obsesionado con un atún blanco gigante que le comió una pata. Habla en monólogos larguísimos.
- **Entrada:** *"¿LO HAN VISTO? ¿HAN VISTO AL ATÚN BLANCO? ¡Por todos los mares lo perseguiré, y a ustedes de paso!"*
- **Al ser derrotado:** *"El atún... sigue allá afuera... *se hunde con el barco mientras sigue hablando*"*
- **Desbloquea:** Pequod-Miau + gatos de aguas profundas
- <sub>Ref: Moby Dick (Melville, dominio público)</sub>

#### Gatalina Creel, la Capitana del Parche · 💧 Agua

- **Barco:** La Cuna de Lobos de Mar
- **Personalidad:** Villana de telenovela. Cambia el color de su parche para combinar con su vestido. Cada vez que revela algo, la cámara hace triple zoom.
- **Entrada:** *"¿Creíste que ibas a quedarte con MI barco, querido? *zoom* *zoom* *ZOOM*"*
- **Al ser derrotado:** *"Esto... no... se va a quedar... ¡ASÍIII! *se desmaya sobre un sillón que apareció de la nada*"*
- **Desbloquea:** Parches de pirata cosméticos + Escudo Espejo
- <sub>Ref: Cuna de Lobos (Catalina Creel) y telenovelas latinas</sub>

#### Chef Ratatuí · 🌱 Naturaleza

- **Barco:** Gato-Mecha de Cocina
- **Personalidad:** Una rata chef genial que pilotea un gato-robot gigante jalándole las orejas. Odia la comida enlatada.
- **Entrada:** *"¡Cualquiera puede cocinar! ¡Y cualquiera puede pilotear un gato gigante!"*
- **Al ser derrotado:** *"Al final... era un buen platillo. *flashback de su infancia*"*
- **Desbloquea:** Edificio Cocina + Ratatouille de Sardina
- <sub>Ref: Ratatouille</sub>

#### El Michi Colosal · 🪨 Tierra

- **Barco:** Ninguno: es el jefe
- **Personalidad:** Un gato de 60 metros que se asoma por encima de la muralla de tu isla. No dice nada. Sólo mira. Luego tumba una torre como quien tumba un vaso.
- **Entrada:** *"*la cámara sube despacio por la muralla... aparecen dos ojos enormes* ...miau."*
- **Al ser derrotado:** *"*se acuesta encima de la muralla y se duerme. La muralla se vuelve su cama oficial*"*
- **Desbloquea:** Muralla Michi-Rosa-Siamesa
- <sub>Ref: Attack on Titan (Titán Colosal)</sub>

#### Bigotes Blancos el Viejo · 🪨 Tierra

- **Barco:** Moby Michi
- **Personalidad:** El pirata más fuerte del mar. Ama a su tripulación como hijos. Pelea contigo para ver si eres digno del mar.
- **Entrada:** *"Gurarara... ¿Así que tú eres el que anda juntando gatos? Demuéstrame que eres digno, mocoso."*
- **Al ser derrotado:** *"La Última Croqueta... ¡ES REAL!"*
- **Desbloquea:** Bigotes Blancos jugable + rumbo al jefe final
- <sub>Ref: One Piece (Barbablanca)</sub>

#### La Maullona · 👻 Espíritu

- **Barco:** Barca de la Niebla
- **Personalidad:** No es mala: está desesperada. Busca a sus gatitos desde hace siglos.
- **Entrada:** *"*niebla* ...¡AAAAAY, MIS GATIIIITOS!"*
- **Al ser derrotado:** *"*encuentra a sus gatitos en tu barco, se los lleva abrazados y te deja una vela encendida*"*
- **Desbloquea:** Evento Marea Fantasma + La Maullona jugable
- <sub>Ref: La Llorona (leyenda latinoamericana)</sub>

#### Davy Garras del Gatandés Errante · 👻 Espíritu

- **Barco:** El Gatandés Errante
- **Personalidad:** Capitán fantasma con tentáculos en los bigotes. Toca el órgano mientras pelea.
- **Entrada:** *"¿Le temes a la muerte? ¿Le temes... al BAÑO?"*
- **Al ser derrotado:** *"Cien años más sin tocar arenero... *se pierde en la niebla*"*
- **Desbloquea:** El Gatandés Errante (barco)
- <sub>Ref: Piratas del Caribe</sub>

#### Equipo Croqueta · ⚪ Neutral

- **Barco:** Globo Aerostático con Forma de Lata
- **Personalidad:** Dos gatos que siempre fallan y un perro que habla (al revés del original). Reaparecen cada cierto tiempo con disfraces malísimos.
- **Entrada:** *"¡Prepárense para las croquetas! ¡Y más vale que tengan hambre! ¡Perro que habla, así es!"*
- **Al ser derrotado:** *"¡EL EQUIPO CROQUETA DESPEGA DE NUEVOOO! *brillito en el cielo*"*
- **Desbloquea:** Mini-jefe recurrente; da orbes y cosméticos
- <sub>Ref: Pokémon (Equipo Rocket, doblaje latino)</sub>

#### Lord Perrquaad · 🪨 Tierra

- **Barco:** Un barco ENORME (está compensando algo)
- **Personalidad:** Un perro diminuto con un barco gigantesco y un ego todavía más grande. Organiza torneos donde otros pelean por él.
- **Entrada:** *"Algunos de ustedes perderán su siesta... pero es un sacrificio que estoy dispuesto a hacer."*
- **Al ser derrotado:** *"¡Esto es inaceptable! ¡Exijo un barco más grande!"*
- **Desbloquea:** Arena de Duelos (modo Duelo de Gatos)
- <sub>Ref: Shrek (Lord Farquaad)</sub>

#### Ryomen Sukunyan, Rey de las Maldiciones Arenosas · 🕳️ Void

- **Barco:** Santuario Flotante
- **Personalidad:** Arrogante, cruel y elegante. Se ríe de todo. Su dominio es un arenero infinito.
- **Entrada:** *"Conoce tu lugar, gatito. Expansión de Dominio..."*
- **Al ser derrotado:** *"Je... fue divertido. Por ahora."*
- **Desbloquea:** Teaser del Void (Update 2)
- <sub>Ref: Jujutsu Kaisen (Sukuna)</sub>

#### Señor Barriga, Cobrador de Rentas · 🪨 Tierra

- **Barco:** Lancha de Cobranza
- **Personalidad:** Viene a cobrar catorce meses de renta atrasada. Cada vez que llega, le cae un gato en la cara. Es el jefe más maltratado del juego y aun así siempre regresa.
- **Entrada:** *"¡Vengo a cobrar los catorce meses de ren...! *¡PAF!* (le cae un gato encima)"*
- **Al ser derrotado:** *"Tenía que ser... tenía que ser..."*
- **Desbloquea:** Banco de Gringatts (intereses de oro)
- <sub>Ref: El Chavo del 8 (Señor Barriga)</sub>

#### La Usurgata · ✨ Magia/Arcano

- **Barco:** Copia exacta de tu barco
- **Personalidad:** Gemela malvada de tu mejor gato. Se ve idéntica, salvo por un lunar. Te roba el hábitat, la cama y el amor de tus gatos.
- **Entrada:** *"¿Quién es la original? Yo. ¿Y tú? Tú eres la copia, querida."*
- **Al ser derrotado:** *"¡Maldita sea! ¡Me descubrieron por el lunar!"*
- **Desbloquea:** Evento 'La Usurpadora'
- <sub>Ref: La Usurpadora (telenovela)</sub>

#### Shai-Arenero, el Gran Gusano · 🪨 Tierra

- **Barco:** Él mismo
- **Personalidad:** Un gusano gigantesco que vive bajo la arena del arenero cósmico. No odia a nadie; sólo tiene hambre.
- **Entrada:** *"*el suelo vibra* *alguien caminó con ritmo*"*
- **Al ser derrotado:** *"*se sumerge y deja a la vista un yacimiento de Especia de Atún*"*
- **Desbloquea:** Especia de Atún
- <sub>Ref: Dune</sub>

#### Vecmiau, el del Reloj del Abuelo · ⏳ Chronos

- **Barco:** Torre-Reloj Flotante
- **Personalidad:** Un gato maldito que maldice con tiempo. Cada vez que suena su reloj, alguien pierde un turno.
- **Entrada:** *"Tic... tac... tic... tac... Tu tiempo se acabó, michi."*
- **Al ser derrotado:** *"Tic... *el reloj se detiene* ...tac."*
- **Desbloquea:** Teaser de Chronos (Update 3)
- <sub>Ref: Stranger Things (Vecna)</sub>

#### Momia-Ra el Inmortal · 👻 Espíritu

- **Barco:** Pirámide Flotante
- **Personalidad:** Un gato momificado decrépito que se transforma en una bestia musculosa con un hechizo ridículo.
- **Entrada:** *"¡Antiguos espíritus del arenero, transformen este cuerpo decadente en MOMIA-RA, EL INMORTAAAL!"*
- **Al ser derrotado:** *"¡Volveréééé! (Y sí vuelve, cada 30 niveles.)"*
- **Desbloquea:** Pirámide (hábitat Espíritu)
- <sub>Ref: Thundercats (Mumm-Ra)</sub>

#### Los Saja Michis · 👻 Espíritu

- **Barco:** Escenario Flotante
- **Personalidad:** Una boy band de cinco gatos-demonio guapísimos que hipnotizan a tus gatos con coreografías. Su debilidad: que tus gatos se ignoren el baile (los gatos son expertos en ignorar).
- **Entrada:** *"¡Un, dos, tres, cuatro! *luces* *gritos de fans* ...¿por qué tus gatos nos están dando la espalda?"*
- **Al ser derrotado:** *"¡Nadie ignora a los Saja Michis! *los gatos siguen ignorándolos*"*
- **Desbloquea:** Barrera Honmiau + emote de baile
- <sub>Ref: Las Guerreras K-Pop (2025)</sub>

#### NADIE · 🕳️ Void

- **Barco:** ??? (silueta)
- **Personalidad:** La entidad del Void que borra universos. No tiene cara, ni nombre. Por eso todos los que lo vieron dicen que no los atacó 'nadie'. Él inventó la frase 'No one likes cats'.
- **Entrada:** *"..."*
- **Al ser derrotado:** *"(No se puede derrotar en el Capítulo 1.) CONTINUARÁ."*
- **Desbloquea:** Final del Capítulo 1 → Update 2: Void
- <sub>Ref: La Odisea ('Nadie') + el título del juego</sub>

### 4.5 Comida y cultivos (29)

| Cultivo | Nivel | Tiempo | Rinde | Descripción | Ref |
|---|---|---|---|---|---|
| **Cebolla de Ogro** | 0 | Bloqueada | 0 | Los ogros son como las cebollas, tienen capas. Los gatos NO pueden comer cebolla: es tóxica. Este cultivo existe sólo para decirte eso. | Shrek + dato real de salud felina |
| **Sardinas Diminutas** | 1 | 20 s | +25 | La comida de los inicios humildes. Algún día te va a dar risa haberlas cosechado. | Original (CHARLA) |
| **Agua de Limón que Parece de Jamaica pero Sabe a Tamarindo** | 1 | 45 s | +60 | Nadie entiende cómo funciona. Funciona. Da +5% velocidad de cosecha a la granja vecina. | El Chavo del 8 |
| **Torta de Jamón (que Nunca te Dan)** | 1 | 1 min | +80 | Cultivo trampa: 30% de las veces la cosecha 'se la comió otro'. Las demás veces da el doble. | El Chavo del 8 |
| **Conchas de Mar** | 1 | 2 min | +300 | Las de pan dulce, no las de la playa. Bueno, son de la playa. Bueno, son de pan con forma de concha de la playa. Ya no sabemos. | Pan dulce mexicano (juego de palabras) |
| **Leche Deslactosada** | 1 | 1 min | +70 | Porque los gatos adultos son intolerantes a la lactosa, por más que las caricaturas digan lo contrario. | Dato real + cliché de caricatura |
| **Tacos al Pescador** | 2 | 5 min | +1,500 | Con trompo de atún, piña y cilantro. Los gatos se comen el atún y dejan la tortilla. | Tacos al pastor (juego de palabras) |
| **Michilada (sin Alcohol)** | 2 | 6 min | +1,800 | Con chamoy, limón y sal en el borde. Es para gatos: no lleva cerveza, lleva agua mineral y orgullo. | Michelada (juego de palabras) |
| **Tamales Oaxaqueños de Atún** | 2 | 8 min | +3,000 | Se anuncian solos con una bocina que pasa por la isla. Calientitos. | Los tamaleros con altavoz (cultura mexicana) |
| **Ceviche Multiversal** | 2 | 10 min | +4,500 | Pescado de seis universos distintos curado en limón. Uno de los pescados todavía no termina de existir. | Ceviche (Perú y toda Latinoamérica) |
| **Arepa Rellena de Sardina** | 2 | 10 min | +4,800 | Rellena hasta que no cierra. Discusión eterna sobre si es venezolana o colombiana: el juego no se mete. | Arepas (Venezuela / Colombia) |
| **Mate de Catnip** | 2 | 12 min | +5,500 | Se pasa de gato en gato. El que lo ceba no lo toca. Da +10% XP a todo el hábitat. | Mate (Argentina / Uruguay / Paraguay) |
| **Ramen del Ichimichi** | 2 | 15 min | +8,000 | El tazón favorito de los ninjas. Pide el doble de chashu de atún. | Naruto (Ichiraku Ramen) |
| **¿Es Croqueta?** | 2 | 7 min | +2,000 | Parece un zapato. Parece una lámpara. La cortas por la mitad: es croqueta. | Meme '¿Es pastel?' |
| **Dorayaki de Atún** | 3 | 20 min | +20K | El postre preferido de un gato robot azul del futuro, ahora relleno de algo que sí comería un gato. | Doraemon |
| **Lembas de Croqueta** | 3 | 30 min | +40K | Un solo bocado llena a un gato adulto. Bueno, lo llena 10 minutos. | El Señor de los Anillos (lembas) |
| **Segundo Desayuno** | 3 | 30 min | +45K | ¿Ya desayunaste? ¿Y el segundo desayuno? Da un buff de +20% a todos los gatos Comunes. | El Señor de los Anillos (hobbits) |
| **Croquetas de Todos los Sabores de Berti Bigotes** | 3 | 35 min | +50K | Pueden saber a pollo, a salmón... o a calcetín, a arena o a lunes. Cada cosecha da un efecto aleatorio. | Harry Potter (grageas de todos los sabores) |
| **Dalgona con Forma de Pescado** | 3 | 40 min | +60K | Si la recortas sin romper la figura, la cosecha se duplica. Si la rompes... no pasa nada grave, este es un juego tranquilo. | El Juego del Calamar |
| **Pollo de Lava** | 3 | 45 min | +85K | Crece sólo en el Monte Arenero. Viene con gallina jinete incluida. | Una película de Minecraft (2025) |
| **Pan de Muerto de Atún** | 3 | 30 min | +50K | Cultivo de temporada (noviembre). Se pone en la Ofrenda y los gatos Espíritu bajan a visitarte. | Día de Muertos |
| **Rosca de Reyes de Pescado** | 3 | 30 min | +45K | Cultivo de enero. Si te sale el muñequito, debes tamales el 2 de febrero (y el juego no lo olvida). | Rosca de Reyes y Día de la Candelaria (México) |
| **Ratatouille de Sardina** | 4 | 1 h | +250K | Al dárselo al gato favorito activa un 'flashback de croqueta' en sepia de cuando era bebé: +1 nivel instantáneo. | Ratatouille (el flashback del crítico) |
| **Especia de Atún** | 4 | 2 h | +900K | El atún debe fluir. Sólo se cultiva en Arenakis. Los gatos que la comen ven el futuro (de su plato). | Dune (la especia) |
| **Catnip Azul 99.1%** | 4 | 2 h | +1.2M | Cristalino, puro, perfecto. Da x2 XP 10 minutos. Lo cultiva un profesor de química con sombrerito. | Breaking Bad |
| **Lasaña de los Lunes** | 4 | 3 h | +3M | Si se cosecha en lunes (fecha real), rinde x3, para compensar. | Garfield |
| **Croqueta del Ermitaño** | 5 | 4 h | Especial | Una sola croqueta cura por completo a un gato en batalla. El maestro de la isla tortuga las regala de a una. | Dragon Ball (semillas del ermitaño) |
| **Banquete del Leviatán** | 5 | 6 h | +18M | Un pescado del tamaño de una isla. Literalmente: hay que comprar otra isla para guardarlo. | Original (CHARLA) |
| **Atún de Nebulosa** | 6 | 1 h (escala cósmica) | +3.7M por tick | Los gatos cósmicos lo pescan en el espacio con cañas de luz. Brilla en la oscuridad. Sabe a estrellas. | Original (CHARLA) |

### 4.6 Edificios y hábitats (30)

| Edificio | Tipo | Descripción | Ref |
|---|---|---|---|
| **Santuario de Resonancia** | Crianza | Dos gatos entran, se cierra la cortina, suena una música sospechosa. Al salir hacen una pose de fusión: '¡RE-SO-NAN-CIA!'. | Dragon Ball (Danza de la Fusión) |
| **Torre Hogmichi** | Hábitat Magia | Cuatro casas: Gatyffindor, Slytherpaw, Hufflepurr y Ravenclaw (a Ravenclaw no hubo que cambiarle el nombre). | Harry Potter |
| **Habitación de la Siesta y el Tiempo** | Hábitat Chronos | Una siesta de un día adentro equivale a un año de entrenamiento afuera. Los gatos salen con el pelo más largo. | Dragon Ball (Habitación del Tiempo) |
| **Los Pescados Hermanos** | Restaurante / Comida | Cadena de comida rápida de pescado administrada por un gerente muy, muy amable. Demasiado amable. Sospechosamente amable. | Breaking Bad (Los Pollos Hermanos) |
| **Terminal del Gato Combi** | Viaje rápido | Base de viaje rápido entre islas. '¡Súbale, súbale!' Tiempo de viaje: ahorita. | Gatobús + combis |
| **Cuartel de la Sociedad Gatuna** | Multiverso | Sede donde se vigila que todos los gatos de todos los universos cumplan sus eventos canónicos. Tiene una pared llena de pantallas con vasos cayéndose. | Spider-Verso |
| **Ofrenda Gatuna** | Hábitat Espíritu | Altar con cempasúchil, veladoras, pan de muerto y fotos de los gatos de los jugadores. Los gatos Espíritu producen oro aquí. | Día de Muertos |
| **Ichimichi Ramen** | Potenciador de comida | Puestito de ramen: +20% al valor de toda la comida de tipo caldo. El dueño siempre te fía. | Naruto |
| **Banco de Gringatts** | Banco | Guarda oro y genera intereses. Lo atienden ratones con monóculo que odian a los gatos, pero el dinero es dinero. | Harry Potter (Gringotts) |
| **Café de Gatos de Akiba** | Hábitat de oro | Los humanos pagan por ver gatos durmiendo. Los gatos duermen. Es el negocio perfecto. | Cafés de gatos (Japón) |
| **Spa de la Abuela Garras** | Curación | Casa de baños para espíritus. Los gatos odian el agua, así que es puro vapor y toallitas. | El Viaje de Chihiro |
| **La Vecindad** | Hábitat Comunes | Barriles para los gatos Comunes. Producen poco oro pero tienen +50% de felicidad. 'Eso, eso, eso.' | El Chavo del 8 |
| **Corral de los Michinimos** | Automatización | Casita donde viven los espíritus recolectores. Más nivel = más granjas cosechadas solas. | Stardew Valley (Junimos) |
| **Torre del Ojo de Gatón** | Vigilancia | Un ojo en llamas que todo lo ve. Avisa 30 segundos antes de los eventos flash. | El Señor de los Anillos |
| **Dojo del Maestro Rascador** | Entrenamiento | Entrenamiento clásico: dar lengüetazo, quitar lengüetazo. Pintar la cerca (con la cola). Al final, el gato sabe karate sin saber cómo. | Karate Kid |
| **Puesto del Merenguero** | Cat's Gambit | Aquí se juega la lotería: Volado (águila o sol), Pirinola, Lotería Michi y Truco. Nada se paga con dinero real; todo se gana jugando. | Merengueros y juegos de azar tradicionales latinoamericanos |
| **Fábrica de Croquetas de Willy Gatonka** | Producción de comida | Ríos de salsa, árboles de croqueta y unos gatitos naranjas que cantan cada vez que algo sale mal. | Charlie y la Fábrica de Chocolate |
| **Astillero Sombrero de Paja** | Taller de barcos | Aquí se construyen y mejoran barcos. El carpintero es un gato cyborg que grita 'SUPER' en cada mejora. | One Piece (Franky) |
| **Forja del Monte Arenero** | Herrería | Armas y módulos forjados en lava. Un anillo, digo, un cascabel para gobernarlos a todos. | El Señor de los Anillos |
| **Centro Michimón** | Reparación | Reparación de barcos y curación de gatos con una melodía de cinco notas inconfundible (no, no es la original). | Pokémon (Centro Pokémon) |
| **Servicio de Entregas de Yiyi** | Expediciones | Desde aquí salen las expediciones. Los gatos vuelan en escoba y traen materiales. | Kiki: Entregas a Domicilio |
| **Laboratorio de Doc Bigotes** | Investigación | Investigación de tecnologías y mutaciones. Si ves un arenero con ruedas y un relámpago cerca, es normal. | Volver al Futuro |
| **Biblioteca de Hechizos Inútiles** | Investigación / Catdex | Hechizos como 'encontrar la tapa del atún', 'calentar el lugar donde estaba sentado alguien' o 'hacer que la caja parezca más grande'. Algunos sirven. | Frieren |
| **Mar de Pescados Automático** | Granja avanzada | Evolución final de las granjas: un mar entero que produce solo. Después se vuelve Océano Cósmico. | Original (CHARLA) |
| **La Casita del Horror** | Decoración / Halloween | Teatro que sólo abre en octubre. Proyecta historias de terror cortas: el gato que encontró la puerta del baño abierta. | Los Simpson (doblaje latino) |
| **Antena de Cable Interdimensional** | Decoración / Easter egg | Una tele en tu casa que pasa comerciales falsos de otros universos (rotan con los tips de carga). | Rick and Morty |
| **Compactadora de Gat-E** | Reciclaje | Convierte chatarra de batalla en cubitos útiles (piezas). | WALL·E |
| **Templo de La Garra** | Recompensas | Los gatitos alienígenas veneran esta máquina de feria. Con boletos de batalla tiras la garra y sacas orbes al azar. 'Ooooooh.' | Toy Story |
| **Muelle de la Ola** | Puerto de combate | El gran puerto de batalla. Al entrar, cambia la música y tus gatos se transforman en su Battle Form. | Original (CHARLA) |
| **El Rascacielos-Rascador** | Monumento | Monumento de fin de capítulo: un rascador tan alto que tiene su propio clima. | Original |

---

## 5. Contenido: misiones, logros, eventos, tips, Catdex, sistema y easter eggs

### 5.1 Misiones (50)

Sin misiones diarias ni semanales: cada misión aparece porque avanzaste, y cada una enseña algo, abre algo o mueve la historia. Cuatro cadenas en paralelo.

**Cadena Capitán (12)**

| # | Misión | Descripción | Objetivo | Ref |
|---|---|---|---|---|
| 1 | **Súbete al Barco, Michi** | Tu primer gato no quiere subir al barco. Tú tampoco querrías: hace agua. | Asigna un gato al Going Meowy. | Evangelion (súbete al robot) |
| 2 | **Es Peligroso Ir Solo** | Toma esto: un cañón oxidado que encontraste en la playa. | Instala tu primera arma. | The Legend of Zelda |
| 3 | **Mi Primer Gatapultazo** | Apunta, carga, suelta. El gato aterriza de pie. El barco enemigo, no. | Gana tu primera batalla. | Original |
| 4 | **Había Espacio en la Puerta** | Perdiste un módulo. Pudiste haberlo salvado. Había espacio. Repáralo y no hablemos más del tema. | Repara un módulo destruido. | Titanic |
| 5 | **¡GATOOOOOL!** | El narrador lleva tres misiones esperando gritar algo. | Consigue tu primer golpe crítico. | Narración de fútbol latinoamericana |
| 6 | **Tengo la Repisa Alta** | Todo gato sabe que el que está más arriba gana. | Gana una batalla con un gato en el módulo más alto de tu barco. | Star Wars |
| 7 | **¿No Están Entretenidos?** | La multitud de gaviotas pide más destrucción. | Destruye 10 módulos en una sola batalla. | Gladiador |
| 8 | **La Chancla Siempre Encuentra** | Tu mamá nunca falló un tiro. Tú tampoco vas a fallar. | Acierta 3 disparos con el Cañón Chancla Teledirigida. | Cultura latina |
| 9 | **Vas a Necesitar un Barco Más Grande** | Algo enorme se movió bajo el agua. Tu barco actual cabe en su boca. | Desbloquea tu segundo barco. | Tiburón |
| 10 | **Este Es el Camino** | Un barco con identidad. Una filosofía. Un elemento. | Equipa un barco con 3 módulos del mismo elemento. | The Mandalorian |
| 11 | **Adiós, Going Meowy** | Te llevó hasta aquí haciendo agua. Merece una despedida a la altura. | Retira tu primer barco con honores (funeral vikingo). | One Piece (despedida del Going Merry) |
| 12 | **Usa la Purrza, Michi** | Una estación del tamaño de una luna. Un agujero de ratón de dos metros. Un solo disparo. | Destruye el agujero de ratón de la Bola de Estambre de la Muerte. | Star Wars |

**Cadena Criador (12)**

| # | Misión | Descripción | Objetivo | Ref |
|---|---|---|---|---|
| 1 | **Algo Huele a Pescado** | Tu primera granja ya produjo. Tu primer gato ya lo olió. | Produce 50 de comida. | Original (CHARLA) |
| 2 | **Ese Gato Tiene Hambre** | Siempre. Siempre tiene hambre. | Alimenta a un gato hasta nivel 3. | Original (CHARLA) |
| 3 | **Tus Gatos se Fueron a Invocar Otro** | No preguntes. Cierra la cortina del Santuario. | Completa tu primera Resonancia. | Original (CHARLA) |
| 4 | **¿Quién Es Ese Michi?** | Silueta negra, música de suspenso y el grito de todos los niños de los 2000. | Descubre tu primer gato híbrido. | Pokémon (¿Quién es ese Pokémon?) |
| 5 | **Michievolución** | Tu gato michievoluciona a... ¡él mismo, pero con más brillitos! | Sube un gato a 3 estrellas. | Digimon (digievolución) |
| 6 | **Duplicado No Es Decepción** | Te salió otra vez el mismo. No llores: son orbes. | Convierte un duplicado en orbes. | Original (CHARLA) |
| 7 | **Michi, Yo Soy Tu Padre** | Ese gato salió de una Resonancia. Ahora él va a Resonar. El árbol genealógico se complica. | Usa como padre a un gato nacido de una Resonancia. | Star Wars |
| 8 | **Pregúntale a Tu Madre** | —¿Cómo se saca este gato? —Pregúntale a tu madre. —Dice que te pregunte a ti. | Descubre una pista oculta de Resonancia en el Catdex. | Diálogo universal de casa latina |
| 9 | **¡FU-SIÓN-HA!** | Dos Resonancias al mismo tiempo. Dos cortinas. Dos músicas sospechosas. | Ten 2 Resonancias activas a la vez. | Dragon Ball |
| 10 | **La Vida Es Como una Caja** | Nunca sabes qué gato te va a salir. | Obtén un resultado '???' de Resonancia. | Forrest Gump |
| 11 | **Michi Señalando a Michi** | ¿Cuál es el original? ¿Importa? | Lleva dos copias del mismo gato en un barco. | Meme de Spider-Man |
| 12 | **Ahora Me He Convertido en Gato** | Seis estrellas. Forma Ascendida. Animación completa. No la saltes. | Sube un gato a 6 estrellas. | Oppenheimer |

**Cadena Explorador (12)**

| # | Misión | Descripción | Objetivo | Ref |
|---|---|---|---|---|
| 1 | **Carta del Abuelo Bigotes** | 'Si estás leyendo esto, ya no estoy. Cuida a los gatos. Y no abras la caja azul.' | Lee la carta y reclama la isla. | Stardew Valley |
| 2 | **Uno No Simplemente Entra al Bosque** | Primero se paga la expansión. Luego se entra. | Compra tu primera expansión de terreno. | El Señor de los Anillos (meme de Boromir) |
| 3 | **Si Voy y lo Encuentro...** | Tu mamá siempre encontraba todo. Ahora te toca a ti. | Encuentra 5 objetos perdidos en las ruinas. | Cultura latina (la amenaza materna) |
| 4 | **Gordolax Bloquea el Camino** | Un gato gordísimo duerme en el puente. Lleva así tres generaciones. | Despiértalo con el sonido de un abrelatas. | Pokémon (Snorlax) |
| 5 | **¡Yajaja! ¡Me Encontraste!** | Hay 9 gatitos escondidos en el archipiélago. Uno por vida. | Encuentra tu primer gatito escondido. | Zelda (Koroks) |
| 6 | **Se Acerca el Invierno** | Al norte de la isla, el agua se volvió sólida. | Desbloquea la isla Más Allá del Muro. | Game of Thrones |
| 7 | **No Reparamos en Gastos** | Una pulga en ámbar. Un laboratorio carísimo. ¿Qué podría salir mal? | Clona tu primer gato fósil. | Jurassic Park |
| 8 | **Hay un Gato en Mi Bota** | En la Vecindad alguien grita que hay un gato en su bota. Es una chancla. Y el gato es legendario. | Encuentra al Gato con Chanclas. | Toy Story + El Gato con Botas |
| 9 | **El Castillo en el Cielo** | Una isla flota sobre las nubes. Su nombre original no lo vamos a decir. | Llega a la isla flotante. | Ghibli |
| 10 | **Camina Sin Ritmo** | Algo enorme se mueve bajo la arena. Algo que odia el ritmo. | Cruza Arenakis sin despertar al gusano. | Dune |
| 11 | **El Santuario Ancestral** | Limpiaste unas rocas y había una puerta con huellitas talladas. | Gana la batalla del Santuario y descubre el Espíritu. | Original (CHARLA) |
| 12 | **Más Allá de lo Evidente** | Los 9 gatitos escondidos dicen que hay un décimo. No existe. ¿O sí? | Encuentra los 9 gatitos escondidos. | Thundercats + Zelda |

**Cadena Historia (14)**

| # | Misión | Descripción | Objetivo | Ref |
|---|---|---|---|---|
| 1 | **Una Isla Hecha Pedazos** | Tres gatos, una granja y un barco que flota por voluntad propia. | Completa el prólogo. | Original |
| 2 | **Algo Viene** | El mar cambió de color. Tus gatos miran fijamente el horizonte. (También miran fijamente la pared, así que no sabemos.) | Investiga el horizonte. | Original (CHARLA) |
| 3 | **Nadie Quiere a los Gatos** | Un perro con medallas de plástico grita el nombre del juego. Mal conjugado. | Sobrevive al primer encuentro con el Almirante Firulais. | Título del juego |
| 4 | **Diez Puntos Menos para tu Barco** | Nivel 37. La música cambia. Una grieta mágica sobre la isla. | Derrota a Dumbledog y descubre la Magia. | Harry Potter + CHARLA |
| 5 | **Éste Ni Siquiera Es Mi Congelador Final** | Tres transformaciones. Tres electrodomésticos. | Derrota a Lord Frízer. | Dragon Ball |
| 6 | **La Marea Fantasma** | Los barcos hundidos regresan. Con niebla. Y llorando. | Ayuda a La Maullona a encontrar a sus gatitos. | La Llorona + CHARLA (Ghost Tide) |
| 7 | **Una Grieta Arriba de la Isla** | Del cielo cae un gato que no debería existir en este mundo. | Recibe al primer Primordial Cósmico. | Original (CHARLA) |
| 8 | **Evento Canónico** | Un gato de otro universo te explica por qué todos los gatos de todas las realidades tiran el vaso. | Conoce a Miguel O'Garra (cameo) y presencia un evento canónico. | Spider-Verso |
| 9 | **¿Por Qué Se Acabó el Atún?** | La Armada Ladradora bloqueó las rutas de pesca. Crisis económica en la isla. | Rompe el bloqueo y recupera 3 rutas. | Piratas del Caribe |
| 10 | **La Última Croqueta Es Real** | El pirata más fuerte del mar quiere saber si eres digno. | Derrota a Bigotes Blancos. | One Piece |
| 11 | **¡Michivengers, Reúnanse!** | Un gato de cada elemento. Todos en la misma toma circular de cámara. | Arma una flota con 5 elementos distintos. | Avengers |
| 12 | **Un Agujero de Ratón de Dos Metros** | La Bola de Estambre de la Muerte tapa el sol. Su debilidad es ridícula. Nadie la reparó. | Derrota al Almirante Firulais. | Star Wars |
| 13 | **UNKNOWN ELEMENT DETECTED** | El mar se eleva. El cielo se abre. Una silueta sin cara pregunta quién derrotó a su almirante. Tus gatos responden: 'Nadie'. | Ve la cinemática final. | La Odisea + CHARLA |
| 14 | **Continuará →** | Flecha amarilla en la esquina. Tú sabes cuál. | Termina el Capítulo 1: First Sea. | JoJo (To Be Continued) |

### 5.2 Logros (42)

| Logro | Condición | Texto | Ref |
|---|---|---|---|
| **Yamchado** | Pierde una batalla con todos tus gatos fuera de combate. | Tu gato quedó en un cráter, en LA pose. Ya sabes cuál. | Dragon Ball (pose de Yamcha) |
| **¡Declaro Bancarrota!** | Pierde todo lo apostado en Cat's Gambit. | Gritarlo no funciona. Pero se siente bien. | The Office |
| **Jugamos Como Nunca, Perdimos Como Siempre** | Pierde una batalla después de destruir 90% del barco enemigo. | Tradición nacional. | Frase de aficionado al fútbol (Latinoamérica) |
| **El Quinto Partido** | Gana 5 batallas seguidas contra jefes. | Llegaste al famoso quinto partido. Disfrútalo; mucha gente se murió esperándolo. | Meme de la Selección Mexicana |
| **Ola K Ase** | Abre el juego entre las 3:00 y las 4:00 a.m. | ¿Invocando gatos o k ase? Ve a dormir. | Meme latino clásico |
| **Déjame Solearlo** | Derrota a un jefe usando un solo gato. | Con un tarro en la cabeza, de preferencia. | Elden Ring (meme 'Let me solo her') |
| **Han Pasado 84 Años...** | Deja terminar sola una Resonancia de más de 8 horas sin acelerarla. | Y todavía huele a pintura fresca. | Titanic (meme) |
| **Farmeando Aura** | Gana una batalla con un gato haciendo el baile de la proa. | Lentes oscuros, cero expresión, bailecito en la punta del barco. | Meme 'aura farming' (2025) |
| **Perfectamente Balanceado** | Termina un turno con exactamente el mismo % de HP en ambos barcos. | Como todas las cosas deberían ser. | Avengers (Thanos) |
| **Hola... Qué Tal** | Gana con Obi-Wan Catnobi desde la repisa alta. | Una adición audaz a tu colección. | Star Wars (meme 'Hello there') |
| **Michi la Fea Tenía Razón** | Ahorra 1,000,000 de oro sin gastar nada. | La contabilidad sí importaba. | Yo soy Betty, la fea |
| **Neurona Compartida** | Lleva 5 gatos naranjas en el mismo barco. | Una neurona. Cinco gatos. Cero planes. | Meme de gatos naranjas |
| **El Gato que Vivió (8 Veces)** | Revive al mismo gato 8 veces. | Le queda una. Cuídala. | Harry Potter + las 9 vidas |
| **¿Eso Es una Referencia de JoJo?** | Usa ZA MIAURUDO y GARRA GARRA GARRA en el mismo turno. | Sí. | JoJo's Bizarre Adventure |
| **Paseo de la Vergüenza** | Tus gatos tiran 100 vasos (eventos canónicos). | ¡Vergüenza! *campanita* ¡Vergüenza! | Game of Thrones + 'cat shaming' |
| **Botella Volteada** | Un proyectil cae parado sobre la cubierta sin explotar. | 2016 está de vuelta. | Bottle flip challenge (2016, revivido en 2026) |
| **Reto del Maniquí** | No toques nada durante 2 minutos en batalla. | Tus gatos se quedaron congelados. Ellos sí entendieron el reto. | Mannequin challenge (2016) |
| **¡Soy el Rey del Mundo!** | Coloca un gato en la proa del RMS Gatanic. | Brazos abiertos, viento en los bigotes, iceberg en el horizonte. | Titanic |
| **Insumergible** | Pierde el RMS Gatanic contra un gato de Hielo. | Todos sabíamos cómo iba a terminar. | Titanic |
| **Necesitábamos un Barco Más Grande** | Ten 5 barcos. | Y luego otro más grande. | Tiburón |
| **Todos Quieren a los Gatos** | Completa el Catdex del Capítulo 1. | El Almirante Firulais estaba equivocado. Gramaticalmente también. | Título del juego (inversión) |
| **Cine Absoluto** | Mira 10 animaciones de ultimate completas sin saltarlas. | *manos extendidas* Cine. | Meme 'Absolute Cinema' (2024) |
| **Sin Querer Queriendo** | Destruye un módulo propio con un rebote. | Fue sin querer. Bueno, queriendo. Bueno, ya. | El Chavo del 8 |
| **¡Que No Panda el Cúnico!** | Gana con todos tus gatos en estado de pánico. | Cundió. Pero ganaste. | El Chapulín Colorado |
| **Soy Michiciente** | Derrota a un jefe Mítico usando sólo gatos Comunes. | Rareza no es poder. Sólo es rareza. | Barbie ('Kenough') |
| **Tecnología de Pelaje Digital** | Obtén al Michi del Musical Maldito. | Lo sentimos mucho. | Cats (2019) |
| **Ni Te Cases Ni Te Embarques** | Zarpa a batalla en un martes 13 (fecha real). | Lo dijo tu abuela. Lo hiciste igual. | Superstición hispana del martes 13 |
| **¡Habemus Michi!** | Completa 100 Resonancias. | Fumata blanca sobre el Santuario. | El cónclave (2025, tendencia viral) |
| **Te Llenas de GATTERMINACIÓN** | Vence a un jefe después de perder contra él 5 veces. | La idea de tirar ese vaso te llena de determinación. | Undertale |
| **Mi Tesssoro** | Acumula 1,000,000 de comida. | Precioso. Nuestro. | El Señor de los Anillos |
| **Maestro del Charla no Jutsu** | Convierte 10 gatos enemigos con diálogo. | Le hablaste de tu infancia a un barco pirata y lloró. | Naruto |
| **¿Qué Rayos Tuve que Cruzar? *(sin filtro: ¿QUÉ PUTAS TUVE QUE CRUZAR?)*** | Obtén un gato de 3 elementos. | Nadie sabe. Ni tú. | Frase del creador (CHARLA) |
| **Yo Soy el que Tumba** | Destruye 1,000 módulos. | Toc, toc. | Breaking Bad |
| **No Hay Cuchara** | Esquiva 50 proyectiles. | Hay lata. | Matrix |
| **Despegando de Nuevo** | Derrota al Equipo Croqueta 5 veces. | *brillito en el cielo* x5. | Pokémon |
| **Hogar, Dulce Caja** | Coloca 10 cajas de cartón como decoración. | El hábitat de 2 millones de oro está vacío. Todos están en las cajas. | Chi's Sweet Home + vida real |
| **¡¡MIS SARDINAS!!** | Destruye el puesto del Vendedor de Sardinas 10 veces. | Ese señor no hizo nada. | Avatar (el vendedor de coles) |
| **¡Toma Todo!** | Saca 'Toma Todo' en la Pirinola. | La mesa entera es tuya. | Pirinola (juego tradicional) |
| **Odio los Lunes** | Gana una batalla un lunes (fecha real) con Lasañeitor. | Venciste al lunes. Por hoy. | Garfield |
| **Felicidades** | Termina el Capítulo 1. | Todos tus gatos te aplauden en círculo. Felicidades. Felicidades. Felicidades. | Evangelion (final) |
| **¿Ya Comiste, Mijo?** | Alimenta a un gato que ya está en nivel máximo. | La Abuelita Panzona está orgullosa. | Cultura latina |
| **Era Sus** | Encuentra al perro disfrazado en el evento 'Un Perro Entre Nosotros' en menos de 30 segundos. | Las orejas eran de cartón. Obvio. | Among Us |

### 5.3 Eventos (23)

Recordatorio de diseño: **los relojes de evento son sagrados**. No se extienden con gemas, ni con nada.

| Evento | Tipo | Duración | Mecánica | Premio | Ref |
|---|---|---|---|---|---|
| **El Ratón Dorado** | ⚡ Micro | 45 s | Un ratoncito dorado con alas cruza la pantalla en zigzag. Haz clic antes de que escape. Tus gatos lo persiguen por toda la isla. | Comida x10 o 1 gema | Harry Potter (la snitch dorada) |
| **Un Perro Entre Nosotros** | ⚡ Micro | 3 min | Un perro con orejas de cartón se coló en un hábitat. Revisa hábitats, encuentra al sospechoso y vota para expulsarlo. Si fallas: 'Michi no era el impostor'. | Orbes del gato encontrado + logro 'Era Sus' | Among Us |
| **El Fierro Viejo** | ⚡ Micro | 2 min | Pasa una lancha con altavoz: 'Se compraaan cascos, mástiles, cañones, escudos, o algo de fierro viejo de barco que vendaaan'. Vende chatarra a x3 de su valor. | Oro x3 por chatarra | Grabación callejera icónica de la CDMX (parodiada) |
| **El Afilador de Garras** | ⚡ Micro | 60 s | Se oye la flautita del afilador. Haz clic en su bicicleta flotante y elige a 3 gatos. | +15% crítico por 3 batallas | El afilador ambulante (tradición latina y española) |
| **Ya Pasó el Tamalero** | ⚡ Micro | 90 s | Un altavoz anuncia tamales calientitos. Haz clic tres veces en la canoa antes de que se vaya. | Tamales Oaxaqueños de Atún x5 | Tamaleros con altavoz (México) |
| **El Puntito Rojo** | ⚡ Micro | 30 s | Un barco enemigo apunta un láser a tu isla y todos tus gatos lo persiguen. Haz clic en el puntito para atrapar el láser antes de que tus gatos se caigan al agua. | Módulo Puntero Láser de la Purrza (prob. baja) o piezas | Gatos vs. puntero láser |
| **La Usurpadora** | ⚡ Micro | 2 min | Tu mejor gato tiene una gemela malvada idéntica en su hábitat. Encuentra el lunar y señala a la falsa. | Orbes + jefe La Usurgata si fallas 3 veces | La Usurpadora (telenovela) |
| **Aurora Boreal (en Tu Cocina)** | ⚡ Micro | 60 s | ¿Una aurora boreal? ¿En esta época del año, a esta hora, en esta parte del archipiélago, localizada enteramente en tu cocina? Haz clic en la cocina para recolectar polvo cósmico. | Polvo Cósmico x20 | Los Simpson (meme de las hamburguesas al vapor) |
| **Michi Rojo, Michi Verde** | 🔥 Flash | 5 min | Una muñeca gigante canta y se voltea. Tus gatos avanzan sólo cuando no mira (como los gatos de verdad). Si se mueven cuando voltea, regresan al inicio con cara de 'yo no fui'. | Gato 456 (Raro) y orbes | El Juego del Calamar |
| **La Marea Fantasma** | 🔥 Flash | 7 min | Los barcos destruidos regresan como barcos fantasma. Derrota a su capitana (La Maullona) antes de que acabe la niebla. | Elemento Espíritu (primera vez) + orbes de La Maullona | Original (CHARLA: Ghost Tide) + La Llorona |
| **Michenheimer: Rosa Atómico** | 🔥 Flash | 10 min | Explosiones color rosa por todo el mapa. Gatos Fuego y Magia hacen x3 daño, pero tus granjas producen -50%. Decide: ¿al diablo las granjas? | Oppengatímer (prob. baja) + cristales rosas | Barbenheimer + Volcanic Overload (CHARLA) |
| **La Grieta Brainrot** | 🔥 Flash | 8 min | Se abre una grieta a un universo de criaturas con nombres pseudoitalianos (Gattolino Bombardino, Michilini Atunini, Ron Ron Ron Ronroneo). Derrótalos para juntar Polvo Brainrot. Su música no tiene sentido. Nada tiene sentido. | Gattolino Bombardino con 100 de Polvo Brainrot | Brainrot italiano (2025) — evento de duración limitada; caduca rápido |
| **¡Liberen al Krakatún!** | 🔥 Flash | 10 min | Migración de leviatanes: todos los mares producen x15 comida, pero aparecen barcos-leviatán. Destruye 3. | Pieza exclusiva de barco 'Mascarón de Krakatún' | Original (CHARLA: Leviathan Migration) + Furia de Titanes |
| **El Juego del Calamarí** | 🔥 Flash | 15 min | Seis rondas de minijuegos de eliminación con tus gatos (tirar de la cuerda de estambre, canicas-croqueta, galleta dalgona, puente de cristal de vasos). Nadie muere: los eliminados se van a dormir. | Calamar Frito del Juego + título 'Gato 456' | El Juego del Calamar |
| **Lluvia de Meteoros de Pegagato** | 🔥 Flash | 12 min | Caen meteoros en tus islas. Encuéntralos antes de que se enfríen y gana la batalla que custodia cada uno. | Cañón Starbreaker + orbes de Meteor Cat | Original (CHARLA) + Caballeros del Zodiaco |
| **Bandera Negra: ¡Parlamiau!** | 🔥 Flash | 20 min | Temporada de saqueo: completa 5 abordajes. Puedes gritar '¡Parlamiau!' una vez para pausar una pelea perdida y negociar. | Barco The Black Purrl | Original (CHARLA: Black Flag) + Piratas del Caribe |
| **Rápidos y Furriosos: El Heredero del Trueno** | 👑 Heroico | 25 min | Carrera Heroica de 6 nodos contra ti mismo (cosecha, módulos, oro, alimentar, gato eléctrico, jefe). El reloj es sagrado: nada lo extiende. Todo es por la familia. | Raijin Cat (Mítico) | Rápidos y Furiosos (título latino) + CHARLA (Heroic Expedition) |
| **Noche del Prisma: Luna Llena** | 👑 Heroico | 30 min | Bajo la luna llena, los gatos Cósmicos se transforman con listones y brillitos. Completa 5 batallas transformado. | Lunática (Épica) + cosmético de media luna | Sailor Moon |
| **La Rifa de la Rosca** | 📅 Por fecha | 6 de enero (todo el día) | Partes la Rosca de Reyes con tus gatos. Si te toca el muñequito, el 2 de febrero el juego te 'cobra' tamales (una misión de producir tamales; recompensa extra). | Rosca de Reyes de Pescado + misión de Candelaria | Tradición mexicana |
| **Noche de Muertos Michi** | 📅 Por fecha | 1 y 2 de noviembre | El puente de cempasúchil se ilumina. Los gatos que se fueron (eliminados en batallas) visitan la Ofrenda y dejan regalos. | La Gatrina (prob.) + Pan de Muerto de Atún | Día de Muertos |
| **Gordolax Ronca** | ⚡ Micro | 2 min | Gordolax se volvió a dormir en el puente. Toca la melodía del abrelatas (secuencia de 4 notas) para despertarlo. | Orbes de Gordolax + paso libre | Pokémon (Snorlax) |
| **Sobrecarga Volcánica *(sin filtro: A la Mierda las Granjas)*** | 🔥 Flash | 10 min | Fuego x3 de daño; granjas -50%. Ideal para matar a ese jefe que no podías. | Fragmentos de Fuego Primordial | Original (CHARLA: Volcanic Overload) |
| **Una Nave del Vacío Entró a tu Mundo** | 🔥 Flash | 14:59 | Intercepta una nave desconocida. Probablemente no puedas destruirla. Haz todo el daño posible para recolectar fragmentos. | Fragmento ??? x1–3 (10 abren el Void en Update 2) | Original (CHARLA) |

### 5.4 Frases de carga y tips (71)

1. Tip: los gatos de Agua odian el agua. Pelean mejor cuando están enojados. <sub>· chiste · Original</sub>
2. Tip: jugar acelera todo. Esperar también funciona. Pagar no existe. <sub>· tip · Regla de diseño (CHARLA)</sub>
3. Ahí está el detalle: un gato Común bien usado le gana a un Mítico mal usado. *(Sin filtro: Ahí está el detalle: un gato Común bien usado le parte la madre a un Mítico mal usado.)* <sub>· tip · Cantinflas + regla 'rareza no es poder'</sub>
4. Dato real: los gatos duermen entre 12 y 16 horas al día. Zenmichi duerme 23 y es el más rápido. <sub>· chiste · Dato real + Demon Slayer</sub>
5. El aliento de mi gato huele a comida de gato. <sub>· chiste · Los Simpson (Ralph)</sub>
6. Tip: el Hielo vuelve quebradizos los módulos. Congela primero, rompe después. <sub>· tip · Original</sub>
7. Tip: Electricidad + módulo mojado = el rayo salta. Agua primero, rayo después. Ciencia. <sub>· tip · Original (CHARLA)</sub>
8. Los gatos de Fuego no pueden comer cebolla. Ningún gato puede. Ni los ogros deberían. <sub>· chiste · Shrek + dato real</sub>
9. Cargando... Han pasado 84 años... <sub>· chiste · Titanic (meme)</sub>
10. Tip: un duplicado no es un fracaso. Son orbes con otra cara. <sub>· tip · Original (CHARLA)</sub>
11. Es peligroso ir solo. Llévate un gato. O cinco. <sub>· chiste · The Legend of Zelda</sub>
12. Gracias, Michi, pero tu croqueta está en otro barco. <sub>· chiste · Super Mario Bros.</sub>
13. Tip: el reloj de los eventos es sagrado. Nada lo extiende. Ni las gemas. Ni llorar. <sub>· tip · Regla 'challenge clocks are sacred' (CHARLA)</sub>
14. La vida es como una caja: nunca sabes qué gato te va a salir de la Resonancia. <sub>· chiste · Forrest Gump</sub>
15. En el planeta de Miller una hora son siete años. En tu isla, una siesta de gato son siete horas. <sub>· chiste · Interstellar</sub>
16. Tip: los gatos naranjas comparten una neurona. Con 3 o más, la neurona da +15% de precisión a quien la tenga ese turno. <sub>· tip · Meme de gatos naranjas</sub>
17. Uno no simplemente entra a la cocina. Primero hay que maullar 40 minutos. <sub>· chiste · El Señor de los Anillos (Boromir)</sub>
18. Un mago nunca llega tarde. Un gato tampoco: llega exactamente cuando abres la lata. <sub>· chiste · El Señor de los Anillos</sub>
19. Tip: perder también da botín. Nadie sale con las manos vacías de este juego. <sub>· tip · Original (CHARLA)</sub>
20. Tip: el 'Análisis de Jefe' sube aunque pierdas. Al 100% descubres su debilidad. <sub>· tip · Original (CHARLA)</sub>
21. Los amigos no mienten. Los gatos sí, sobre todo cuando dicen que no han comido. <sub>· chiste · Stranger Things</sub>
22. No hay cuchara. Hay lata. <sub>· chiste · Matrix</sub>
23. Tip: la repisa alta da ventaja. Pon a tus francotiradores arriba. <sub>· tip · Star Wars</sub>
24. Se acerca el invierno. También se acerca la hora de comer. Una de las dos es más urgente. <sub>· chiste · Game of Thrones</sub>
25. Dato real: en 2017 unos científicos ganaron un premio Ig Nobel por estudiar si los gatos son líquidos. Sí lo son. <sub>· chiste · Premio Ig Nobel 2017 (dato real)</sub>
26. Dato real: Félicette fue la primera gata en ir al espacio y volver, en 1963. Comandante Felicitas la honra. <sub>· tip · Historia real</sub>
27. Tip: los Michinimos cosechan por ti mientras peleas. No los mires directamente; se ponen nerviosos. <sub>· tip · Stardew Valley</sub>
28. Ola k ase. ¿Invocando gatos o k ase? <sub>· chiste · Meme latino clásico</sub>
29. El tiempo nunca te impide jugar. A veces, jugar es la forma de vencer al tiempo. <sub>· tip · Filosofía del juego (CHARLA)</sub>
30. Tip: la Gatapulta lanza a tu propio gato. No te preocupes, siempre cae de pie. <sub>· tip · Original</sub>
31. ¿Ya llegamos? ¿Ya llegamos? ¿Ya llegamos? (Pantalla de carga patrocinada por el burro de otro universo.) <sub>· chiste · Shrek (doblaje latino)</sub>
32. Ningún gato fue dañado en la creación de este juego. Varios vasos sí. <sub>· chiste · Original</sub>
33. Cualquiera puede invocar. No cualquiera puede invocar bien. <sub>· tip · Ratatouille</sub>
34. Tip: la Resonancia muestra probabilidades. Ese '???' de 1% es real. Y es peligroso. <sub>· tip · Original (CHARLA)</sub>
35. Pregúntale a tu madre. —Dice que le preguntes a tu padre. (Así funcionan las pistas del Catdex.) <sub>· chiste · Cultura latina</sub>
36. Tip: el Martes 13 tus gatos negros tienen x13 de suerte en Cat's Gambit. Ni te cases ni te embarques... o sí. <sub>· tip · Superstición del martes 13</sub>
37. Si voy y lo encuentro... — Tu mamá, encontrando el módulo que llevabas 20 minutos buscando. <sub>· chiste · Cultura latina</sub>
38. La chancla teledirigida no se esquiva. Se acepta. <sub>· chiste · Cultura latina</sub>
39. Tip: los gatos de Espíritu producen más oro en la Ofrenda. Y en noviembre, todavía más. <sub>· tip · Día de Muertos</sub>
40. Ningún barco es insumergible. Pregúntale al RMS Gatanic. <sub>· chiste · Titanic</sub>
41. Tip: los escudos mágicos absorben magia pero sufren con golpes físicos. Llévale una roca. <sub>· tip · Original (CHARLA)</sub>
42. Tu gato no te ignora. Está procesando. Lleva tres años procesando. <sub>· chiste · Original</sub>
43. Ponle 'Michi' a un gato. Ponle 'Michi' a otro. Ya tienes un evento canónico. <sub>· chiste · Spider-Verso + cultura latina</sub>
44. Tip: el Gato Combi mueve a un aliado a cualquier módulo. ¡Súbale, hay lugares! <sub>· tip · Combis + Gatobús</sub>
45. Su nivel de pelea es de más de 8,000. (Sí, ocho. Así lo dijo el doblaje y así se queda.) <sub>· chiste · Dragon Ball Z (doblaje latino)</sub>
46. Algunos de ustedes perderán su siesta. Es un sacrificio que el Almirante está dispuesto a hacer. <sub>· chiste · Shrek (Lord Farquaad)</sub>
47. Tip: las expansiones de terreno no sólo dan espacio: cada una cambia una regla de tu economía. <sub>· tip · Original (CHARLA)</sub>
48. ¿Por qué el juego se llama NO ONE LIKE CATS? Pregúntale al Almirante Firulais. Y luego corrígele la gramática. <sub>· chiste · Título del juego</sub>
49. En el cielo y en la tierra, sólo un gato es el honrado. Y está dormido en tu teclado. <sub>· chiste · Jujutsu Kaisen</sub>
50. Tip: los jefes abren elementos nuevos. Cada elemento nuevo abre docenas de Resonancias. <sub>· tip · Original (CHARLA)</sub>
51. Un gato gris sobrevivió a un diluvio en un velero sin decir una palabra. Tu gato hace drama porque se le acabó el agua del plato. <sub>· chiste · Flow (2024)</sub>
52. Dato real: los gatos adultos son intolerantes a la lactosa. Todas las caricaturas te mintieron. <sub>· tip · Dato real</sub>
53. Tip: el momentum sube con cada victoria y baja despacito si te vas. No te castiga: te espera. <sub>· tip · Original (CHARLA)</sub>
54. Ninguna gema se compra con dinero real. Si alguien te las vende, no es este juego. <sub>· tip · Regla de diseño (CHARLA)</sub>
55. Que la Purrza te acompañe. Sobre todo a la hora de cortarle las uñas. <sub>· chiste · Star Wars</sub>
56. Tip: en la Pirinola, 'Todos Ponen' también te incluye a ti. Lo sentimos. <sub>· tip · Pirinola (juego tradicional)</sub>
57. Los gatos son como las cebollas: tienen capas. Capas de pelo. En todos tus suéteres. <sub>· chiste · Shrek</sub>
58. Tip: Michi Hogaza no ataca. Michi Hogaza no se mueve. Michi Hogaza aguanta. Respeta a Michi Hogaza. <sub>· tip · Meme 'cat loaf'</sub>
59. Ahorita termina la Resonancia. (Ahorita puede significar 5 minutos o 3 días. Es un ahorita latino.) <sub>· chiste · Cultura latina</sub>
60. Tip: Saitamiau es Común. No te dejes engañar. <sub>· tip · One Punch Man</sub>
61. Cuando un gato tira un vaso, en algún otro universo otro gato tira el mismo vaso. Es canon. <sub>· chiste · Spider-Verso</sub>
62. Tip: la Caja Táctica esconde a un gato hasta que ataca. Luego aparece un '!' gigante. Es parte del encanto. <sub>· tip · Metal Gear Solid</sub>
63. ¿Sabías que en Latinoamérica el martes 13 es el día de mala suerte, no el viernes? Tus gatos negros sí lo saben. <sub>· chiste · Superstición hispana</sub>
64. Tip: si el enemigo carga un ultimate de 2 turnos, ves el contador. Mátenlo ya. *(Sin filtro: Tip: si el enemigo carga un ultimate de 2 turnos, ves el contador. MATEN A ESE CABRÓN YA.)* <sub>· tip · Original (CHARLA)</sub>
65. El tóper de la abuela nunca trae lo que dice la etiqueta. El cofre misterioso tampoco. <sub>· chiste · Cultura latina</sub>
66. Tip: Lasañeitor odia los lunes reales. El juego revisa la fecha de tu computadora. Lo sentimos por él. <sub>· tip · Garfield</sub>
67. Uno... dos... dos y medio... (Cargando con la técnica de tu mamá.) <sub>· chiste · Cultura latina</sub>
68. Tip: Gatalf el Gris se vuelve Gatalf el Blanco a 6 estrellas. Nadie sabe cómo lo lavaron. <sub>· chiste · El Señor de los Anillos</sub>
69. Dato real: en Japón, el 22 de febrero (2-2-2, ni-ni-ni) es el Día del Gato. Entra ese día y verás. <sub>· tip · Neko no Hi (Japón)</sub>
70. Tip: la Cocina de Sanmichi cura en batalla. El cocinero patea, pero cocina rico. <sub>· tip · One Piece</sub>
71. Nadie quiere a los gatos, dijo el perro. Todos los gatos lo ignoraron, que es la respuesta más gato posible. <sub>· chiste · Título del juego</sub>

### 5.5 Entradas del Catdex con lore (25)

**Gatoku** — *Universo de origen: Universo 'Esfera-7' (estilo anime 90s, cel shading con líneas gruesas)*  
Cayó en tu isla en una cápsula que se abrió con un 'pssst' y un aroma a arroz. Dice que viene de un planeta donde todos pelean para hacerse más fuertes y luego comen. Cuando le preguntaron por qué peleaba, respondió: 'Porque hay alguien más fuerte... y porque tengo hambre'. Su primer acto en tu isla fue comerse la granja entera. Su segundo acto fue disculparse y sembrarla otra vez, más grande.  
> 🔒 Pista de Resonancia: *Dicen que aparece cuando un gato de Fuego entrena más de lo que duerme. Eso no pasa nunca.*

**Canelo, Portador de la Neurona** — *Universo de origen: Este universo (y todos los demás, al mismo tiempo)*  
Los sabios del Colegio Hogmichi confirmaron que la Neurona Naranja es un objeto real que viaja entre todos los gatos naranjas del multiverso. Ayer la tuvo un gato naranja en otra galaxia que resolvió un teorema. Hoy la tiene Canelo, que acaba de entender que la puerta corrediza se abre hacia el lado. Mañana, quién sabe. Canelo no lo sabe. Canelo nunca lo sabe.  
> 🔒 Pista de Resonancia: *Dos gatos naranjas. Un solo cerebro. Haz cuentas.*

**Capitán Jack Purrow** — *Universo de origen: Universo 'Ron de Sal' (pintura al óleo, acuarela sucia, mucho sepia)*  
Nadie lo invitó a tu isla. Llegó caminando por el muelle mientras su barco se hundía detrás de él, saludó con mucha dignidad y pidió atún. Ha intentado venderte tu propio barco tres veces. Su brújula apunta a la cocina, aunque él jura que apunta 'a la aventura'. Para él son lo mismo.  
> 🔒 Pista de Resonancia: *Busca en una isla calavera, con una botella vacía y una mala decisión.*

**Satoru Gato** — *Universo de origen: Universo 'Maldición Azul' (anime moderno, efectos de partículas, ojos que brillan como galaxias)*  
Se quita la venda y el Catdex tarda tres segundos en cargar la imagen porque hay demasiados brillos. Entre él y todo lo demás existe un infinito: los proyectiles se acercan cada vez más lento y nunca llegan. La aspiradora tampoco. Es el único gato que nunca ha sido bañado. Su autoestima es más grande que la isla, y la isla es grande.  
> 🔒 Pista de Resonancia: *Cósmico + Void, nivel 30+, durante un eclipse. O eso dicen. Él dice que con verte ya basta.*

**Hairy Pawter** — *Universo de origen: Universo 'Pergamino' (ilustración de libro infantil, tinta y acuarela)*  
Vivió once años dentro de una caja debajo de la escalera y nunca se quejó: era una caja. Un día llegó una carta con sello de cera. Luego cien cartas. Luego mil. Se las comió todas. Finalmente lo fue a buscar un gato gigantesco con barba que le dijo: 'Eres un mago, Michi'. Él respondió: 'Miau'. Fue suficiente.  
> 🔒 Pista de Resonancia: *Magia + Espíritu. La cicatriz con forma de rayo no es casualidad... bueno, sí: se cayó de la repisa.*

**El Michi del 8** — *Universo de origen: Universo 'Vecindad' (TV de los 70, colores lavados, risas grabadas)*  
Nadie sabe su nombre. Nadie sabe dónde vive cuando no está en el barril. Nadie sabe por qué siempre tiene hambre. Lo que todos saben es que si algo se rompe en la vecindad, fue él, y que fue sin querer queriendo. Cuando alguien le da una torta, el universo hace un sonido de triunfo. Pasa muy poco.  
> 🔒 Pista de Resonancia: *Pon a un gato Común a dormir en un barril durante 14 meses. O cómprale una torta. Lo que pase primero.*

**La Maullona** — *Universo de origen: Este archipiélago (leyenda local)*  
Los pescadores viejos de la isla dicen que antes de que llegaras ya se oía en las noches. Un gemido largo, desde la niebla: '¡Ay, mis gatitos!'. Cuentan que perdió a sus crías en una tormenta y que desde entonces navega una barca sin remos buscándolas. No es mala. Está desesperada. Si la ayudas, te los presta. Si no, te los presta igual, porque es muy buena gente.  
> 🔒 Pista de Resonancia: *Sólo aparece con Marea Fantasma. Deja una vela encendida en el muelle.*

**Tío Michiroh** — *Universo de origen: Universo 'Cuatro Naciones' (animación 2D occidental con influencia anime)*  
Fue general. Fue temido. Perdió una guerra y a alguien que quería. Decidió que lo que valía la pena era una buena taza de té y una buena conversación. Tiene grietas de oro por todo el cuerpo: se rompió muchas veces y cada vez se reparó con más cariño. Si estás perdiendo, te va a ofrecer té. Acéptalo. Es mejor que cualquier buff.  
> 🔒 Pista de Resonancia: *Fuego + Espíritu con un gato que haya perdido 10 batallas. Los que caen y se levantan saben a qué sabe el té.*

**Saitamiau** — *Universo de origen: Universo 'Golpe Único' (anime de trazo simple; él tiene menos detalle que el fondo)*  
Un gato esfinge que hizo 100 lagartijas, 100 abdominales, 100 sentadillas y corrió 10 km todos los días durante tres años. Perdió todo el pelo (bueno, nunca tuvo). Ahora destruye cualquier cosa de un golpe y está profundamente aburrido. Se registró como 'Común' en el Catdex porque llenó mal el formulario. No le importa. Va al súper los martes porque hay oferta de atún.  
> 🔒 Pista de Resonancia: *Tierra + Tierra, Común con Común, con mucha paciencia. Es Común. De verdad. No te engañes.*

**El Gato Combi** — *Universo de origen: Universo 'Bosque Vecino' cruzado con 'Ruta 57' (acuarela de bosque + calcomanías de combi)*  
Nadie sabe si es un espíritu del bosque o un microbús con alma. Tiene doce patas, un letrero luminoso que cambia de destino y una bocina que suena como ronroneo. Si lo llamas en el momento justo, se para frente a ti y abre una puerta en su costado. Adentro siempre hay lugar. Siempre. Aunque no haya.  
> 🔒 Pista de Resonancia: *Viento + Espíritu en la Terminal. Grita '¡bajan!' tres veces.*

**Manchas** — *Universo de origen: Universo 'Hoja en Blanco' (boceto a lápiz sin terminar)*  
Era un gato blanco común hasta que un experimento lo llenó de manchas que son agujeros a otros lugares. Mete la pata en una mancha y saca una croqueta del refrigerador de otra isla. Insiste en que es tu némesis. Le das por su lado. A veces te da pena y lo dejas ganar un poquito. Eso lo enoja más.  
> 🔒 Pista de Resonancia: *Sólo en el Update Void. Aunque hay quien dice haber visto una mancha moviéndose en el Catdex...*

**Thanomiau el Inevitable** — *Universo de origen: Universo 'Titán Morado' (cómic de los 70, puntos de impresión, colores saturados)*  
Juntó seis gemas brillantes, las puso en su collar de cascabeles y decidió que la mitad de todos los barcos del universo debía desaparecer. Levantó la pata para chasquear los dedos. Los gatos no pueden chasquear. Se oyó 'plop'. Hubo un silencio incómodo. Igual funcionó, porque la Purrza es así. Ahora está en tu isla, sentado en una banca, mirando el atardecer. Dice que descansa. Sospechamos que está planeando algo.  
> 🔒 Pista de Resonancia: *Seis orbes de seis elementos distintos. Y una pata que no sabe chasquear.*

**Doramichi** — *Universo de origen: Siglo XXII (animación limpia de los 70, colores primarios)*  
Fue enviado desde el futuro para ayudar a un niño flojo. El niño ya creció. Doramichi se quedó sin chamba y llegó a tu isla por una gatera que conecta a cualquier lugar. Su bolsillo tiene de todo, pero cuando lo necesitas saca un nabo, un calcetín y una flauta antes de encontrar lo que pediste. No tiene orejas. No preguntes por los ratones.  
> 🔒 Pista de Resonancia: *Chronos + Multiverso. Busca una gatera que no lleve a ningún lado... o a todos.*

**Michi D. Ruffi, Modo Caricatura** — *Universo de origen: Universo 'Gran Ruta' (anime de barcos; en su forma final, caricatura de goma de los años 30)*  
Comió una fruta extraña que lo hizo de goma. No sabe nadar (ningún usuario de esas frutas sabe; los gatos tampoco quieren). Cuando despierta su forma final se vuelve blanco, el cabello se le hace de nubes, se ríe sin parar y la física decide tomarse el día. Los demás gatos dicen que esa risa suena a tambores. Él dice que tiene hambre.  
> 🔒 Pista de Resonancia: *Fuego + Multiverso, con un gato que se haya reído en batalla. Los gatos no se ríen. Por eso es mítico.*

**Gato de Schrödinger** — *Universo de origen: Una caja (literalmente)*  
Hasta que abres esta página del Catdex, este gato está desbloqueado y bloqueado a la vez. Ya la abriste. Felicidades: ahora es uno de los dos. Él te mira con cara de 'yo estaba durmiendo'. Pide que vuelvas a cerrar la caja. Hay una teoría de que todos los gatos son un poco de Schrödinger: nunca sabes si están dentro o fuera hasta que abres la puerta.  
> 🔒 Pista de Resonancia: *50% de las veces aparece. 50% no. Las dos cosas son verdad.*

**Michi del Musical Maldito** — *Universo de origen: Universo 'Pelaje Digital' (CGI fotorrealista mal calibrado)*  
Llegó cantando. Nadie le pidió que cantara. Tiene cara de actor famoso, cuerpo de gato y proporciones que no deberían existir. Los demás gatos de la isla se esconden cuando pasa. Los científicos de Hogmichi llevan meses intentando devolverlo a su universo. Su universo no lo acepta de vuelta.  
> 🔒 Pista de Resonancia: *El Catdex se niega a dar pistas. Por tu bien.*

**Gato Sonrisa** — *Universo de origen: Universo 'Madriguera' (grabado victoriano, tinta negra, papel amarillento)*  
Aparece en ramas que no existen y desaparece de la cola a los bigotes, hasta que sólo queda su sonrisa flotando en el aire. Si le preguntas por dónde ir, te dice que depende de a dónde quieras llegar. Si le dices que no sabes, te dice que entonces da igual. Es el gato más sabio y más inútil del Catdex al mismo tiempo.  
> 🔒 Pista de Resonancia: *Multiverso + Void. Busca una sonrisa sin gato. O un gato sin sonrisa. Ambos sirven.*

**Miguel O'Garra, Gato 2099** — *Universo de origen: Universo 2099 (neón, lluvia, líneas de escaneo)*  
Fundó la Sociedad Gatuna después de ver qué pasa cuando un gato NO tira el vaso: el universo entero se desestabiliza y empieza a desaparecer. Desde entonces vigila. Sabe que hay eventos canónicos que todo gato debe vivir: tirar el vaso, sentarse en el teclado, rechazar la cama cara, dormir en la caja de la cama cara. Es intenso. Muy intenso. Necesita una siesta.  
> 🔒 Pista de Resonancia: *Sólo con el Update Multiverso. Si un gato tuyo nunca ha tirado un vaso, Miguel ya lo sabe.*

**Michi del Diluvio** — *Universo de origen: Universo 'Corriente' (3D pictórico, luz natural, sin diálogos)*  
No habla. No maúlla. No pide nada. Un día el mundo se inundó y él subió a un velero con un capibara, un lémur y un perro, y navegó hasta que el agua bajó. Llegó a tu isla en ese mismo velero. Se bajó, miró el mar, miró tu isla y se quedó. Los otros gatos lo respetan sin saber por qué.  
> 🔒 Pista de Resonancia: *Agua + Agua, en un día lluvioso de verdad (si llueve en tu ciudad, el juego no lo sabe; pero tú sí).*

**Gato Miedoso / Gato de Batalla** — *Universo de origen: Universo 'Castillo del Poder' (animación de los 80, músculos y colores planos)*  
En la isla es el gato más cobarde que existe: le tiene miedo a las hojas, a su sombra y a los días martes. Pero cuando alguien levanta el rascador y grita la frase, un rayo le cae encima, le aparece una armadura y se vuelve un tigre de guerra. Después de la batalla vuelve a ser miedoso y se esconde de una mariposa. Es literalmente la premisa de este juego, y lo sabe.  
> 🔒 Pista de Resonancia: *Tierra + cualquier gato de Batalla. El rayo hace el resto.*

**Michi Seis-Siete** — *Universo de origen: Universo '2025' (video vertical, subtítulos amarillos gigantes)*  
Nadie sabe qué significa 'seis siete'. Los investigadores del Colegio Hogmichi pasaron meses estudiándolo. Concluyeron que no significa nada y que eso es exactamente lo que significa. El gato mueve las patitas arriba y abajo. Los gatos jóvenes lo imitan. Los gatos viejos suspiran.  
> 🔒 Pista de Resonancia: *Seis gatos de un elemento y siete de otro. O sólo escribe 67 en el nombre de un gato.*

**Comandante Felicitas** — *Universo de origen: Este universo (historia real, con respeto)*  
Inspirada en Félicette, una gatita callejera de París que en 1963 se convirtió en la primera gata en viajar al espacio y regresar. Todos los gatos Cósmicos del juego, por más alienígenas que sean, se cuadran cuando ella pasa. Ella sólo quiere su cojín junto a la ventana. Se lo ganó.  
> 🔒 Pista de Resonancia: *Desbloquea a 5 gatos Cósmicos. Ella llega sola, a su tiempo.*

**Bola de Nieve V (llámalo II)** — *Universo de origen: Universo 'Ciudad Amarilla' (animación 2D, cuatro dedos)*  
Es el quinto gato con este nombre. Los primeros cuatro... digamos que tuvieron accidentes de caricatura. Por presupuesto, el juego le sigue diciendo 'Bola de Nieve II'. Él lo acepta. Ha visto cosas. Muchas cosas.  
> 🔒 Pista de Resonancia: *Hielo + Común. Si pierdes uno, siempre llega otro igualito. Nadie habla de eso.*

**Neko, el Elegido** — *Universo de origen: Universo 'El Código' (todo verde, cayendo)*  
Le ofrecieron dos croquetas: una roja y una azul. Con la azul despertaría en su cama creyendo lo que quisiera. Con la roja vería qué tan profundo es el arenero. Se comió las dos. Ahora ve el código detrás de los barcos y, a veces, un gato negro que pasa dos veces por el mismo lugar. Eso significa que algo cambiaron.  
> 🔒 Pista de Resonancia: *Eléctrico + Chronos. Cuando veas al mismo gato negro pasar dos veces, haz clic.*

**La Gatrina** — *Universo de origen: Mictlán de los Michis (grabado en metal, papel picado, cempasúchil)*  
Llega cada noviembre por el puente de pétalos naranjas, con su sombrero enorme y su vestido elegante. Visita a los gatos que se fueron, les lleva pan de muerto y escucha sus historias. Cuando sonríe, todos sonríen. Nadie le tiene miedo: aquí la muerte se viste bonito y viene a cenar.  
> 🔒 Pista de Resonancia: *Espíritu + Espíritu en la Ofrenda, el 1 o 2 de noviembre.*

### 5.6 Mensajes del sistema (62)

Variables entre llaves (`{A}`, `{t}`, `{n}`, `{oro}`...) las rellena el código.

| Contexto | Familiar | Sin filtro |
|---|---|---|
| `resonancia_inicio` | Tus gatos se fueron a invocar otro gatito. No preguntes. | Tus gatos se fueron a invocar otro gatito. Tú no viste nada, cabrón. |
| `resonancia_inicio` | {A} y {B} se fueron a hacer quién sabe qué... | {A} y {B} se fueron a hacer quién sabe qué chingaderas... |
| `resonancia_inicio` | Ola k ase. ¿Invocando o k ase? | Ola k ase. ¿Invocando o k ase? Ah, ya veo. |
| `resonancia_progreso` | Resonancia en curso. Se escucha una música sospechosa detrás de la cortina. | Resonancia en curso. Mejor ni te asomes. |
| `resonancia_progreso` | Faltan {t}. O puedes echarte unas partidas y que falte menos. | Faltan {t}. O te echas dos partidas y le bajas, tú sabes. |
| `resonancia_lista` | ¡Fumata blanca! ¡HABEMUS MICHI! | ¡Fumata blanca! ¡HABEMUS MICHI, A HUEVO! |
| `resonancia_revelacion` | ¿QUIÉN ES ESE MICHI? | ¿QUIÉN ES ESE MICHI? *redoble* |
| `resonancia_rara` | ¡¿QUÉEE?! *zoom* *zoom* *ZOOM* | ¡¿QUÉ PUTAS?! *zoom* *zoom* *ZOOM* |
| `resonancia_duplicado` | Michi señalando a Michi. Duplicado convertido en +{n} orbes. | Otra vez este wey. Tranqui: +{n} orbes. |
| `resonancia_3_elementos` | ¿Qué rayos tuviste que cruzar para sacar eso? | ¿QUÉ PUTAS TUVISTE QUE CRUZAR PARA SACAR ESO? |
| `nuevo_gato` | ¡NUEVO GATO DESCUBIERTO! Catdex {x}/{y}. | ¡NUEVO GATO, CARAJO! Catdex {x}/{y}. |
| `estrella_sube` | ¡{gato} michievoluciona a... {gato}, pero con más brillitos! | ¡{gato} michievoluciona a... {gato}, pero más mamado! |
| `estrella_6` | Forma Ascendida. Esto es cine absoluto. No la saltes. | Forma Ascendida. Ni se te ocurra saltar esta madre. |
| `victoria` | ¡VICTORIA! El barco enemigo se fue a dormir con los peces. | ¡VICTORIA! Le partiste la madre a ese barco. |
| `victoria` | ¡GATOOOOOOOL! Digo... ¡VICTORIA! | ¡GATOOOOOOOL, CABRONES! Digo... ¡VICTORIA! |
| `victoria_perfecta` | Victoria perfecta. Ni un rasguño. Bueno, uno, pero fue de otro gato. | Victoria perfecta. Ni los despeinaron. |
| `victoria_jefe` | ¡El jefe cayó! El mundo acaba de hacerse más grande. | ¡Se lo chingaron! El mundo acaba de hacerse más grande. |
| `derrota` | Jugamos como nunca, perdimos como siempre. Pero cobraste: +{oro} oro, +{p} piezas. | Jugamos como nunca, perdimos como siempre. Al menos te llevas +{oro} oro. |
| `derrota` | TE MORISTE. (Pero +{xp} XP. Nadie sale con las manos vacías.) | TE CARGÓ EL PAYASO. (Pero +{xp} XP.) |
| `derrota` | Tus gatos quedaron en un cráter, en LA pose. | Tus gatos quedaron como Yamcha. Ni modo. |
| `derrota_casi` | Casi. Análisis del jefe: {n}%. La próxima es la buena. | Casi, carajo. Análisis del jefe: {n}%. La próxima sí. |
| `derrota_racha` | Tranquilo. Respira. El Tío Michiroh te sirvió un té. | Ya, ya, ya. Tómate un té con el Tío Michiroh y regresa a romper madres. |
| `critico` | ¡CRÍTICO! ¡Su nivel de pelea es de más de 8,000! | ¡CRÍTICO! ¡No mames, más de 8,000! |
| `modulo_destruido` | Módulo destruido. Fue sin querer queriendo. | Módulo a la verga. Fue sin querer queriendo. |
| `modulo_propio_destruido` | Le diste a tu propio barco. Se te chispoteó. | Te diste a ti mismo, genio. |
| `ultimate_cargando` | Cargando ultimate: uno... dos... dos y medio... | Cargando ultimate: uno... dos... dos y medio... ya casi, aguanta. |
| `ultimate_enemigo` | ¡EL ENEMIGO ESTÁ CARGANDO ALGO! 1/2. Detenlo ya. | ¡EL ENEMIGO ESTÁ CARGANDO ALGO! 1/2. ¡MATEN A ESE HIJO DE SU MADRE! |
| `gambit_apuesta` | ¿Le jugamos un volado? Águila o sol. | ¿Le jugamos un volado, compa? Águila o sol. |
| `gambit_gana` | ¡Ganaste x{m}! El merenguero no lo puede creer. | ¡x{m}! Al merenguero le acaba de dar el patatús. |
| `gambit_pierde` | ¡Declaro bancarrota! (No funciona así, pero se siente bien.) | Te quedaste sin nada. Ni pa' los chicles. |
| `gambit_limite` | Ya apostaste todas las gemas de hoy. El merenguero se fue a descansar. | Ya estuvo de apostar por hoy, vicioso. |
| `pirinola_toma_todo` | ¡TOMA TODO! La mesa es tuya. | ¡TOMA TODO, A HUEVO! |
| `pirinola_todos_ponen` | Todos ponen. Tú también. Sí, tú. | Todos ponen. Sí, tú también, codo. |
| `cosecha` | ¡Cosecha lista! Algo huele a pescado (en el buen sentido). | ¡Cosecha lista! Ya huele a pescado, ve por ella. |
| `cosecha_masiva` | Cosechaste {n}. Hace tres horas 100 era una fortuna. Mírate ahora. | Cosechaste {n}. Hace tres horas te emocionabas con 100. Mírate, millonario. |
| `cosecha_bono` | ¡BONO DE COSECHA! Tus granjas producen x4 por 10 minutos. ¿Otra partida antes de cosechar? | ¡BONO DE COSECHA x4! ¿Te echas otra antes de cosechar o qué? |
| `alimentar` | ÑAM. ÑAM. ÑAM. (Barra de XP subiendo.) | ÑAM. ÑAM. ÑAM. Tragón. |
| `alimentar_maximo` | ¿Ya comiste, mijo? Ya está en nivel máximo, pero la abuela insiste. | Ya está en nivel máximo, pero la abuela le sigue dando. Así son. |
| `oro_recolectado` | +{n} de oro. Michi la Fea ya lo anotó en la libreta. | +{n} de oro. Ya hay pa' las chelas... de leche deslactosada. |
| `construccion_lista` | ¡Construcción terminada! Tus gatos ya se sentaron adentro sin permiso. | ¡Construcción lista! Y ya se metieron los gatos, obvio. |
| `expansion_comprada` | Nueva isla. Hace dos horas costaba 'imposible'. Hoy: 'ah, sí, de una'. | Nueva isla. Hace dos horas decías 'ni de pedo'. Ahora: 'de una'. |
| `elemento_descubierto` | Has descubierto un elemento que no debería existir en este mundo. | Has descubierto un elemento que no debería existir. Ya valió. |
| `evento_flash` | 🚨 ¡AHORA! Este reloj no se detiene, no se compra y no se negocia. | 🚨 ¡AHORA, CABRÓN! Este reloj no se detiene ni se compra. |
| `evento_expira` | Se acabó el tiempo. Lo que ganaste, ganado está. | Se acabó el tiempo. Lo que agarraste, agarrado. |
| `evento_void` | 🌑 UNA NAVE DEL VACÍO ENTRÓ A TU MUNDO. ¿Qué es el Vacío? Exacto. | 🌑 UNA NAVE DEL VACÍO ENTRÓ A TU MUNDO. ¿QUÉ PUTAS ES VOID? |
| `tiempo_reducido` | Victoria: -{m} min a todo lo que estaba esperando. Jugar acelera. | Victoria: -{m} min. Ves que sí conviene jugar. |
| `momentum` | MOMENTUM x{m}. Estás en racha. No pares. | MOMENTUM x{m}. Estás que ardes. |
| `momentum_baja` | Tu momentum bajó un poquito mientras no estabas. No pasa nada: te estaba esperando. | Tu momentum bajó un poco. Ni pedo, aquí sigue. |
| `regreso_jugador` | ¡Volviste! Mientras no estabas, tus gatos produjeron {oro} de oro y tiraron {v} vasos. | ¡Volviste! Tus gatos hicieron {oro} de oro y rompieron {v} vasos. Cabrones. |
| `juego_noche` | Son las 3 a.m. Tus gatos tienen zoomies. ¿Y tú? | Son las 3 a.m. Vete a dormir... después de esta Resonancia, va. |
| `mision_completa` | ¡Misión completada! Recompensa, animación y una misión nueva. Así es esto. | ¡Misión completada! Toma, toma y toma. Sigue. |
| `logro` | Logro desbloqueado: {nombre}. | Logro desbloqueado: {nombre}. Presume, ándale. |
| `barco_nuevo` | ¡Barco nuevo! Vas a necesitar uno más grande. Pero hoy no. | ¡Barco nuevo! Está bien chulo. |
| `reparacion` | Reparación completa. El barco tiene más cinta que madera, pero flota. | Reparado con puro cinta y fe. Flota. |
| `gato_perdido` | Un gato desconocido apareció en tus hábitats. Encuéntralo antes de que se aburra. | Se coló un gato. Encuéntralo antes de que se mee en algo. |
| `perro_detectado` | Hay un perro entre nosotros. Sus orejas son de cartón. | Hay un perro entre nosotros. Está bien sus. |
| `evento_canonico` | Evento canónico: un gato tiró un vaso. El multiverso está a salvo. | Evento canónico: otro vaso al piso. El multiverso, a salvo. |
| `error_red` | No hay conexión... pero este juego no la necesita. Sigue jugando, para eso es. | Se fue el internet. Ni falta que hace. Sigue. |
| `guardar` | Progreso guardado. La idea de tirar ese vaso te llena de GATTERMINACIÓN. | Guardado. Te llenas de GATTERMINACIÓN. |
| `salir_juego` | ¿Te vas? El mundo sigue. Tus gatos también. Vuelve cuando quieras. | ¿Ya te vas? Va. Tus gatos van a seguir haciendo pendejadas. |
| `pantalla_titulo` | NO ONE LIKE CATS. Cute cats. Terrible consequences. | NO ONE LIKE CATS. Cute cats. Terrible consequences. |
| `final_capitulo` | UNKNOWN ELEMENT DETECTED... CONTINUARÁ → | UNKNOWN ELEMENT DETECTED... CONTINUARÁ → |

### 5.7 Easter eggs secretos (29)

| Easter egg | Cómo se activa | Qué pasa | Ref |
|---|---|---|---|
| **Código Michi** | En la isla: ↑ ↑ ↓ ↓ ← → ← → B A. | Todos los gatos de la isla hacen 'miau' a la vez y aparece el 'Modo 30 Vidas' (cosmético: corazoncitos sobre cada gato por 1 hora). Logro secreto 'Ya Sabías'. | Código Konami |
| **¿Perros o Gatos?** | Pantalla de nueva partida: el juego pregunta '¿Prefieres perros o gatos?'. Elige 'Perros'. | El narrador dice: '...Vamos a fingir que no dijiste eso.' y la opción 'Perros' se convierte en 'Gatos'. Si insistes 5 veces, te da el título 'Traidor de la Especie' y un gato con un disfraz de perro. | Stardew Valley (elección de mascota) |
| **Déjà Miau** | Aleatorio (1 en 200 visitas a la isla): un gato negro cruza la pantalla dos veces seguidas exactamente igual. Haz clic en el segundo. | Glitch verde en pantalla + 'Algo cambiaron.' Desbloquea a Neko, el Elegido como pista en el Catdex. | Matrix (el gato negro del déjà vu) |
| **Ni te Cases Ni te Embarques** | Fecha real: martes 13. | Los barcos zarpan con nubes negras. Gatos negros: x13 de suerte en Cat's Gambit. Espejos rotos dan 7 turnos de mala suerte en lugar de 7 años. | Superstición hispana |
| **Lunes de Lasaña** | Fecha real: cualquier lunes. | Lasañeitor tiene la carita triste en su hábitat y la Lasaña de los Lunes rinde x3. | Garfield |
| **Ni-Ni-Ni** | Fecha real: 22 de febrero (Día del Gato en Japón). | Todos los gatos usan orejas de gato... encima de sus orejas de gato. +22% oro todo el día. | Neko no Hi (Japón) |
| **Día Internacional del Gato** | Fecha real: 8 de agosto. | Las Resonancias del día tienen +8% de probabilidad de resultado raro. Pastel en el Santuario. | Día Internacional del Gato |
| **Puente de Cempasúchil** | Fecha real: 1 y 2 de noviembre. | Aparece el puente de pétalos al Mictlán de los Michis; los gatos que perdiste en batallas dejan regalitos en la Ofrenda. | Día de Muertos |
| **El Muñequito** | Fecha real: 6 de enero. Parte la rosca en el Puesto del Merenguero. | Si te sale el muñequito, el 2 de febrero el juego te 'cobra' tamales con una misión especial. | Rosca de Reyes / Candelaria |
| **La Casita del Horror** | Fecha real: 31 de octubre, entra a la Casita del Horror. | Tres 'historias de terror' de 20 segundos: el gato que encontró el baño abierto, el gato que vio la transportadora y el gato que escuchó la aspiradora. | Los Simpson (La Casita del Horror) |
| **Bautizo Saiyajin** | Renombra a cualquier gato 'Kakaroto'. | Vegata (si lo tienes) aparece en pantalla, grita '¡KAKAROTOOO!' y gana +5% daño por puro coraje. | Dragon Ball (doblaje latino) |
| **Seis Siete** | Renombra a un gato '67' o 'seis siete'. | El gato hace el gesto con las patitas cada vez que lo tocas. Si lo haces 67 veces, aparece Michi Seis-Siete en el Catdex. | Meme '6-7' (2025) — easter egg de caducidad rápida |
| **Todos se Llaman Michi** | Ten 10 gatos llamados 'Michi'. | Mensaje: 'Esto ya es un evento canónico.' Miguel O'Garra aparece unos segundos en la isla, asiente, y se va. | Spider-Verso + cultura latina |
| **Odio los Lunes (Versión Pirata)** | Renombra a un gato naranja 'Lasaña'. | El gato se acuesta panza arriba y no se levanta en 1 minuto real. Produce x2 oro mientras tanto. | Garfield |
| **¡MICHI JINETE!** | Haz clic 10 veces seguidas en la aspiradora robot de tu casa. | Un gatito se sube a la aspiradora y recorre la isla gritando '¡MICHI JINETE!'. Se vuelve un adorno permanente. | Una película de Minecraft ('Chicken jockey') + videos de gatos en aspiradoras robot |
| **Los 9 Gatitos** | Hay 9 gatitos escondidos en las islas (detrás de árboles, en macetas, en una caja). Al encontrar cada uno dice '¡Yajaja! ¡Me encontraste!'. | Con los 9 te dan un regalo... es una hoja seca. (Modo sin filtro: es una lagartija.) Y el logro 'Más Allá de lo Evidente'. | Zelda (Koroks y el 'regalo' de Hestu) + gatos que traen 'regalos' |
| **Cable Interdimensional** | Haz clic en la tele de tu casa. | Pasa comerciales falsos de otros universos: 'Croquetas Sabor Lunes', 'Abogado Gato Goodman: ¿te acusaron de tirar un vaso? ¡Mejor llama a Garras!', 'Seguros contra Vasos Rotos'. | Rick and Morty + Breaking Bad (Better Call Saul) |
| **¡Oye! ¡Escucha!** | Silencia al hada-guía del tutorial 3 veces. | El hada se ofende, te dice 'Bueno, ya, me voy a otro juego' y desaparece. Logro 'Navi Se Fue'. | The Legend of Zelda: Ocarina of Time |
| **El Vaso en la Orilla** | En tu casa hay un vaso en la orilla de la mesa. Arrástralo al centro. | Un gato lo regresa a la orilla. Hazlo 20 veces y el gato te mira fijamente y lo tira. Logro 'Evento Canónico Cumplido'. | Comportamiento universal de los gatos |
| **La Cama de 800 Pesos** | Compra la decoración 'Cama Premium para Gato'. | Llega en una caja. Todos los gatos duermen en la caja. Nadie usa la cama. Jamás. | Meme universal de gatos |
| **El Pepino** | Arrastra un pepino (decoración) detrás de un gato dormido. | El gato salta dos metros en cámara lenta. Logro secreto. (El juego aclara: no lo hagas con gatos de verdad, los estresa.) | Videos virales de gatos y pepinos |
| **Las Lucecitas de Navidad** | Diciembre: las luces de la isla parpadean. | Si las anotas, deletrean un código en el alfabeto pegado en la pared. Escribirlo en Ajustes da el cosmético 'Suéter de Navidad Feo'. | Stranger Things (las luces de Navidad) |
| **Ajuste de Honestidad** | Ajustes > Tono. El control dice 'Nivel de humor: 75%' como un robot de película espacial. | Subirlo a 100% activa el modo 'Sin Filtro'. Bajarlo a 0% hace que el narrador sólo diga 'Afirmativo.' durante 1 minuto. | Interstellar (TARS) |
| **Píntame como a Una de tus Gatas Francesas** | En el Modo Foto, pon a un gato acostado en un sillón con la pose 'diván'. | El filtro se vuelve dibujo a lápiz. El gato no tiene ropa porque nunca tiene ropa. | Titanic (meme) |
| **Ya Salió** | Escribe 'silksong' en el buscador del Catdex. | Mensaje: 'Durante años fue un meme que nunca saldría. Salió. Todo es posible. Incluso tu gato Mítico.' +1 gema (una vez). | Hollow Knight: Silksong (esperado durante años, salió en 2025) |
| **Antes que...** | Escribe 'gta' en el buscador del Catdex. | Mensaje: 'Este juego salió antes que cierto juego muy esperado.' (El texto cambia automáticamente a 'Sí, ya salió. Ya lo jugamos.' después de su fecha de lanzamiento.) | GTA VI (programado para el 19 de nov. de 2026) — ejemplo de chiste con fecha de caducidad |
| **Las Siete Esferas del Gato** | Junta 7 orbes 'de estrella' (con 1 a 7 estrellas dibujadas) que aparecen muy raramente en expediciones. | El cielo se oscurece, aparece Michirón, un dragón-gato gigante, y te concede un deseo de una lista absurda: '1 millón de oro', 'un gato Mítico aleatorio' o 'una caja de cartón muy bonita' (todos eligen la caja). | Dragon Ball (las esferas del dragón) |
| **Farmeo de Aura** | Pon a un gato en la proa del barco y no lo toques durante 30 segundos en el puerto. | El gato se pone lentes oscuros y empieza a bailar con cara seria. Logro 'Farmeando Aura'. | Meme 'aura farming' (2025, el niño en la proa del bote) |
| **Todos Quieren...** | Mira los créditos completos. | Al final, el Almirante Firulais aparece solo en el escenario, con un gatito dormido en su cabeza. Dice: 'Bueno... a lo mejor uno.' | Título del juego |

---

## 6. Guía de voz y tono

### 6.1 La regla madre

**"El juego es tierno; los gatos son unos desgraciados; el narrador es tu compa."**

- **La isla** habla bajito, cálido, con humor de abuela y de vecindad.
- **La batalla** habla a gritos, en anime, con nombres de ataques en mayúsculas y onomatopeyas.
- **El sistema** (UI, mensajes) habla como un amigo que te está viendo jugar desde el sillón: te echa porras, se burla poquito, nunca te regaña.
- **Nunca** habla como tienda: nada de "¡Oferta!", "¡Compra ya!", "¡No te lo pierdas!". En este juego no hay nada que comprar con dinero real, y el tono lo tiene que dejar claro.

### 6.2 Quién habla y cómo

| Voz | Personalidad | Ejemplo |
|---|---|---|
| **Narrador / Sistema** | Compa burlón y orgulloso de ti. Sorpresa genuina cuando pasa algo raro. | "¿Qué rayos tuviste que cruzar para sacar eso?" |
| **El Capi** (capibara, primer oficial) | Tranquilísimo, nada le altera, frases cortas. El único animal que todos quieren. | "Tranqui. El barco se está hundiendo, pero tranqui." |
| **Profesor Bigotales** (mentor del tutorial) | Profesor solemne y enamoradizo; entra con "¡Ta, ta, ta, taaa!". | "Muy bien. Ahora apunte. No, a mí no." |
| **Chispa** (hada-guía molesta) | Interrumpe con "¡Oye! ¡Escucha!". Se puede silenciar (y se ofende). | "¡Oye! ¡Escucha! ¡Hay un botón!" |
| **Gatos en la isla** | No hablan: maúllan. Los subtítulos los "traducen" con mucha libertad. | *Miau.* (Subtítulo: "Ese plato está medio vacío. Es una emergencia.") |
| **Gatos en Battle Form** | Shonen total. Gritos, nombres de técnicas, poses, frases de rival. | "¡RESPIRACIÓN DEL ATÚN... PRIMERA POSTURA!" |
| **Jefes** | Cada uno tiene una muletilla y una entrada teatral. Villanos de telenovela, de anime o de película de los 80. | "Éste ni siquiera es mi congelador final." |
| **NPCs latinos** (Abuelita, Merenguero, Vendedor de Sardinas) | Cariñosos, exagerados, de barrio. | "¿Le jugamos un volado, joven?" / "¡¡MIS SARDINAS!!" |

### 6.3 Dos niveles de groserías: "Familiar" y "Sin filtro"

Se elige en Ajustes > Tono (el control es un guiño a TARS: "Nivel de humor: 75%"). **Familiar** es el predeterminado. **Sin filtro** desbloquea groserías mexicanas/latinas *casuales*, nunca insultos de odio.

**Qué cambia:** sólo vocabulario e intensidad. El chiste es el mismo. Si un chiste sólo funciona con la grosería, no es un buen chiste.

| Situación | Familiar | Sin filtro |
|---|---|---|
| Sale un gato de 3 elementos | "¿Qué rayos tuviste que cruzar para sacar eso?" | "¿QUÉ PUTAS TUVISTE QUE CRUZAR PARA SACAR ESO?" |
| Victoria | "¡VICTORIA! El barco enemigo se fue a dormir con los peces." | "¡VICTORIA! Le partiste la madre a ese barco." |
| Enemigo carga ultimate | "¡Está cargando algo! Detenlo ya." | "¡MATEN A ESE HIJO DE SU MADRE YA!" |
| Derrota | "Te moriste. Pero +350 de oro." | "Te cargó el payaso. Pero +350 de oro." |
| Rareza inesperada | "¡¿QUÉEE?!" | "¡¿QUÉ PUTAS?!" |
| Evento flash | "¡AHORA! Este reloj no se detiene." | "¡AHORA, CABRÓN! Este reloj no se detiene." |
| Te disparas a ti mismo | "Se te chispoteó." | "Te diste a ti mismo, genio." |
| Cosecha enorme | "Hace tres horas 100 era una fortuna. Mírate." | "Hace tres horas te emocionabas con 100. Mírate, millonario." |
| Expansión comprada | "Hace dos horas costaba 'imposible'." | "Hace dos horas decías 'ni de pedo'." |
| Volcanic Overload | "Sobrecarga Volcánica" | "A la Mierda las Granjas" |
| Tip de rareza | "Un Común bien usado le gana a un Mítico mal usado." | "Un Común bien usado le parte la madre a un Mítico mal usado." |
| Regreso del jugador | "Tus gatos tiraron 14 vasos." | "Tus gatos rompieron 14 vasos. Cabrones." |

**Lista de palabras "Sin filtro" permitidas** (casuales, de amigos): madre (partir la madre, a toda madre), cabrón, puta/putas (como exclamación), pedo (ni de pedo, qué pedo), chingar/chingadera, verga (sólo en "a la verga" como exclamación), no mames, a huevo, wey, pinche, carajo, mierda.

**Prohibidas en ambos niveles:** insultos racistas, homofóbicos, misóginos o capacitistas (incluidos "retrasado", "mongol", "lisiada", "maricón", "puto" como insulto a personas); groserías dirigidas *al jugador* como persona (nos burlamos de lo que pasó, no de quien juega); chistes sexuales explícitos; chistes sobre tragedias reales, drogas duras, armas reales o política.

**Nota regional:** "Sin filtro" usa base mexicana. Si se localiza a Argentina/Chile/Colombia, se adaptan (boludo, weón, parcero), pero las palabras de la lista de prohibidas siguen prohibidas en cualquier región.

### 6.4 Spanglish estilo anime

El juego está en español, pero los ataques suenan como anime doblado que no tradujo el nombre de la técnica. Reglas:

1. **Nombres de técnicas:** pueden ir en inglés, japonés romanizado o español, siempre en MAYÚSCULAS cuando se gritan. "¡ZA MIAURUDO!", "¡HAIRBALL IGNITION!", "¡RESPIRACIÓN DEL ATÚN!".
2. **Estructura de grito:** [Escuela/estilo] + [número de postura o técnica] + [nombre]. "Santoryu... ¿dónde estoy?" / "Expansión de Dominio... ¡BOLA DE ESTAMBRE INFINITA!".
3. **Sistemas grandes en inglés (marca):** Battle Form, Catdex, Cat's Gambit, Momentum, Heroic Expedition. **Acciones del jugador en español:** Resonancia, Alimentar, Cosechar, Zarpar.
4. **Sufijos de cariño japoneses permitidos** en diálogo de gatos anime (-chan, -sensei, -sama), con medida.
5. **Onomatopeyas:** las del manga ("ゴゴゴ" del menace se puede mostrar como efecto visual, no como texto obligatorio) y las latinas ("¡PAF!", "¡ZAS!", "¡ÑAM!").
6. **El "miau" como sufijo:** sólo en gatos tontos o tiernos ("¡dattemiau!"). No abusar: máximo uno por línea.
7. **Nunca** mezclar idiomas a mitad de un mensaje de sistema largo; el Spanglish es para gritos y nombres, no para instrucciones.

### 6.5 Fórmulas de chiste que funcionan (para escribir más)

| Fórmula | Cómo | Ejemplo |
|---|---|---|
| **Cita + giro gatuno** | Frase famosa parafraseada, se le cambia el final por algo de gato. | "¡No pasarás... por la puerta sin abrirme!" |
| **Nombre + mecánica que explica el chiste** | El juego de palabras se vuelve regla de juego. | Zenmichi sólo pelea bien dormido. |
| **Dato real + exageración** | Un comportamiento real de gato llevado al absurdo. | Los gatos son líquidos → cabe en cualquier slot. |
| **Escala absurda** | El juego se ríe de su propia progresión. | "Hace dos horas costaba 'imposible'." |
| **Ternura que se rompe** | Empieza tierno y termina mal (marca: Cute cats. Terrible consequences.). | "Le gustan los abrazos cálidos. Nadie le ha explicado lo que pasa." |
| **Cultura latina como sistema** | Una costumbre latina convertida en mecánica. | La cuenta de mamá = ultimate de carga. |
| **Lo que no se dice** | El chiste está en lo que el juego se niega a mostrar. | "Tus gatos se fueron a invocar otro gatito. No preguntes." |

### 6.6 Reglas para que los chistes no envejezcan mal

1. **Regla 70/20/10.** 70% del contenido es humor original o de comportamiento gatuno (no caduca nunca). 20% son referencias clásicas con más de 10 años. 10% máximo son memes del momento.
2. **Los memes 🔴 viven en datos, no en código.** Todo meme caducable va en el JSON con su `ref`, para poder cambiarlo sin parchear el juego. Nunca en un nombre de gato principal ni en la historia.
3. **Prueba de la sobrina y el abuelo.** Antes de aprobar un chiste: ¿le da risa a alguien de 12 años que no conoce la referencia? ¿Y a alguien de 60? Si a ninguno, fuera.
4. **Fecha de caducidad explícita.** Chistes que dependen de una fecha (GTA VI, "todavía no sale tal cosa") deben tener texto alterno automático por fecha.
5. **Nada de personas reales.** Las personas cambian, se vuelven polémicas o mueren. Los personajes de ficción y los gatos no.
6. **Nada de política ni tragedias.** Ni siquiera en clave. Varios de los memes más grandes de 2025 son políticos; no entra ninguno.
7. **Los memes de formato se usan como eventos.** Brainrot, 6-7, aura farming: eventos de duración limitada o easter eggs. Si en 2027 nadie los recuerda, se reemplazan por los nuevos.
8. **Auditoría de memes por update.** Cada update revisa los 🔴 y decide: ¿se quedan, se reescriben o se retiran?
9. **El chiste se ríe de la situación, no del jugador.** Perder da botín y un chiste solidario, nunca humillación.
10. **El cariño gana.** Si una parodia trata con desprecio a la obra original, se reescribe. Las referencias son homenajes de fans.


---

## 7. Mini biblia del multiverso

### 7.1 La premisa: el multiverso es una pila de cajas

Antes de todo había una **Caja**. Nadie sabe quién la puso ahí. Un gato se metió. Porque cabía.

Cada universo es una caja dentro de una pila infinita de cajas. Cada caja tiene su propio **trazo**: en una todo es acuarela, en otra todo es anime de los 90, en otra todo es blanco y negro y siempre llueve, en otra todo está hecho de bloques, en otra todos tienen cuatro dedos. Los habitantes de cada caja no saben que hay otras.

Los gatos sí.

**¿Por qué los gatos pueden cruzar entre universos?** Porque, como comprobó la ciencia (Ig Nobel 2017), **los gatos son líquidos**. Toman la forma de su recipiente. Si existe una rendija entre dos cajas, un gato pasa. Las rendijas se llaman **gateras**, y aparecen donde un gato se queda mirando fijamente una pared sin razón. (Eso explica por qué los gatos miran fijamente las paredes.)

**¿Por qué cada gato tiene un estilo visual distinto?** Porque cuando un gato cruza a otra caja **conserva el trazo de su universo de origen**. Por eso en tu isla conviven un gato de acuarela, uno de anime con líneas gruesas, uno pixelado, uno en blanco y negro y uno de goma de los años 30. Es exactamente la lógica del Spider-Verso: cada personaje trae su propia forma de estar dibujado, y el choque de estilos es parte del encanto.

### 7.2 Por qué todos los gatos tiran el vaso: el Evento Canónico

En todas las cajas, todos los gatos hacen ciertas cosas: tirar el vaso de la mesa, sentarse en el teclado, ignorar la cama cara para dormir en su caja, mirar la pared a las 3 a.m. Son **Eventos Canónicos**.

La Sociedad Gatuna (fundada por Miguel O'Garra, Gato 2099) descubrió por qué: **cada vez que un gato tira algo, refuerza las paredes de su caja.** Un universo donde los gatos dejan de tirar cosas empieza a deshacerse. Así que los gatos no son destructivos: **están manteniendo el multiverso.** (Esto es lo que les dicen a sus humanos. Los humanos no les creen.)

### 7.3 Por qué existe la Resonancia

Cuando dos gatos entran juntos al Santuario y ronronean en la misma frecuencia, generan una **gatera temporal** hacia otra caja. Desde ahí "llaman" a un gato cuya frecuencia combine con la suya. Por eso:

- El resultado depende de los elementos de los padres (cada elemento es una frecuencia).
- A veces sale un gato de un estilo visual que nunca habías visto: viene de una caja nueva.
- El 1% de "???" existe porque a veces contesta alguien de una caja que todavía no conoces.
- El mensaje "Tus gatos se fueron a invocar otro gatito" es literal. Y lo que pase detrás de la cortina es asunto de ellos.

### 7.4 Los elementos como capas de la Caja

| Capa | Elementos | Qué significa | Cuándo se descubre |
|---|---|---|---|
| **El piso** | 🔥 Fuego · 💧 Agua · 🌱 Naturaleza · 🪨 Tierra | Lo primero que tocas. Los cuatro Primordiales básicos. | Inicio |
| **Las paredes** | ⚡ Eléctrico/Plasma · 🌪️ Viento · ❄️ Hielo | Lo que sostiene la caja. | Capítulo 1 (expansiones y jefes) |
| **La tapa** | ✨ Magia · 👻 Espíritu | Lo que separa tu caja de las demás. Por aquí se cuelan cosas que "no deberían existir en este mundo". | Capítulo 1 (Dumbledog, Santuario Ancestral) |
| **Afuera de la caja** | 🌌 Cósmico | El espacio entre cajas: estrellas, galaxias, gatos alienígenas. | Capítulo 1 (la Grieta) |
| **Lo que está afuera del afuera** | 🕳️ Void | Donde no hay caja. Donde vive NADIE. | Update 2 |
| **Cuánto tiempo lleva abierta la caja** | ⏳ Chronos | El tiempo mismo, que para los gatos es "hora de comer" y "no es hora de comer". | Update 3 |
| **La pila** | 🌀 Multiverso | Todas las cajas a la vez. | Update 4 |

**Primordiales (los gatos origen de cada elemento):** Ignis (Fuego), Marea (Agua), Raíz (Naturaleza), Roca (Tierra), Céfiro (Viento), Volta (Eléctrico), Escarcha (Hielo), Arcana (Magia), Ánima (Espíritu), Astra (Cósmico), Nul (Void), Kairós (Chronos) y Mil (Multiverso). No son parodias: son la mitología seria del juego, el contraste que hace que las parodias brillen.

### 7.5 Reglas de arte del multiverso (para producción)

Para que la mezcla de estilos sea barata de producir y se entienda de inmediato:

1. **Cada gato trae una etiqueta de universo** (`origin` en el Catdex) que define: grosor de línea, paleta, textura y **frame rate**.
2. **El frame rate vende el estilo:** gatos de anime animados "en 2s" (12 fps), gatos 8-bits a 4 fps, gatos de caricatura de los 30 con rebote exagerado, gatos de la isla a 24 fps suaves. Es el truco del Spider-Verso y casi no cuesta.
3. **Shaders en lugar de redibujar:** halftone (cómic), posterizado (pixel), escala de grises + lluvia (noir), papel + borde de acuarela (Ghibli), contorno grueso (anime). Un mismo modelo base con distinto shader = distinto universo.
4. **El "glitch" de llegada:** cuando un gato de otro universo aparece por primera vez, parpadea entre su estilo y el de la isla durante un segundo, como los personajes del Spider-Verso que no pertenecen a su dimensión.
5. **Battle Form:** en batalla todos los gatos se suben un nivel de "anime" (aura, ojos brillantes, líneas de velocidad), pero conservan su trazo de origen. El gato noir sigue en blanco y negro; sólo que ahora con aura gris.

### 7.6 El villano: NADIE (y por qué el juego se llama así)

En la *Odisea*, cuando Odiseo engaña al cíclope, le dice que se llama **"Nadie"**. Luego, cuando el cíclope pide ayuda gritando que Nadie lo está atacando, nadie viene.

**NADIE** es una entidad del Void: no tiene cara, no tiene nombre, no tiene caja. Borra universos completos porque los gatos "los desordenan". Su lema, que repite toda su flota, es **"NO ONE LIKES CATS"**: *a nadie le gustan los gatos*. Lo dice tan seguido que la frase llegó a todas las cajas.

El juego le contesta con su título, al que deliberadamente le falta la "S": **NO ONE LIKE CATS**. *No hay nadie como los gatos.* El narrador lo corrige en un tip de carga, los gatos lo ignoran (que es la respuesta más gata posible) y el final del Capítulo 1 lo convierte en el gran momento del título.

**El Almirante Firulais** es el antagonista del Capítulo 1: un perro con medallas de plástico al que su dueño mandó a dormir al patio cuando adoptó un gato. Es ridículo y en el fondo da ternura. No sabe que trabaja para NADIE. En la escena post-créditos aparece con un gatito dormido en la cabeza: "Bueno... a lo mejor uno."

**El Capi**, un capibara, es el primer oficial de tu barco. Todos los animales lo quieren, incluidos los perros de la Armada. Es el chiste recurrente de que "nadie quiere a los gatos, pero TODOS quieren al capibara".

### 7.7 Capítulo 1 — "First Sea" (4–8 horas)

| Acto | Qué pasa | Elementos y mecánicas que se abren | Momentos de humor clave |
|---|---|---|---|
| **Prólogo: La carta** | Llega la carta del Abuelo Bigotes. Isla miserable, 3 gatos, Going Meowy haciendo agua. El Capi ya está ahí, sin explicación. | 🔥💧🌱🪨, granjas, hábitats, primera batalla. | Profesor Bigotales: "¡Ta, ta, ta, taaa!"; "Súbete al barco, Michi". |
| **Acto 1: Aguas tranquilas** | Te expandes por el archipiélago. El Equipo Croqueta te molesta. Aparece el Almirante Firulais gritando "¡NADIE QUIERE A LOS GATOS!". | Expansiones, Cat's Gambit, Viento, Eléctrico, Vecindad del 8. | El Señor Barriga cobrando renta (¡PAF!); la primera "¿Quién es ese Michi?". |
| **Acto 2: Grietas** | Nivel 37: la música cambia y Dumbledog trae los escudos (Magia). Lord Frízer congela el norte (Hielo). La Marea Fantasma trae a La Maullona (Espíritu). Una grieta cósmica deja caer a un Primordial. | ✨ 👻 ❄️ 🌌, escudos, Resonancias de 2 y 3 elementos. | Cameo de Miguel O'Garra que explica el Evento Canónico y advierte: "algo está borrando cajas". |
| **Acto 3: La Última Croqueta** | La Armada bloquea las rutas de pesca (crisis económica). Bigotes Blancos te pone a prueba. Reúnes a tus Michivengers. | Flota multielemento, barcos grandes, armas legendarias. | "La Última Croqueta... ¡ES REAL!"; toma circular de los Michivengers. |
| **Final: La Bola de Estambre de la Muerte** | La estación del Almirante tapa el sol. Su debilidad es un agujero de ratón de dos metros. Al ganar, el Going Meowy recibe su funeral vikingo y zarpa **La Nadie**. | Final del capítulo. | Todos tus gatos lloran en la orilla... y uno se distrae con una mariposa. |

**La escena final (guion):**

1. Victoria. Fuegos artificiales. Tus gatos celebran. El Capi dice: "Tranqui. Ganamos."
2. El mar empieza a elevarse sin viento. Todos los gatos miran fijamente al mismo punto del cielo (por primera vez, no es la pared).
3. Texto en pantalla: **UNKNOWN ELEMENT DETECTED**.
4. Se abre el cielo como la tapa de una caja. Una silueta sin cara se asoma.
5. La silueta: "¿Quién derrotó a mi almirante?"
6. Todos tus gatos, al mismo tiempo: "...Nadie."
7. La silueta, después de un silencio: "Yo soy Nadie."
8. Pantalla negra. Se oye un vaso caerse de una mesa en algún lugar.
9. Flecha amarilla en la esquina: **CONTINUARÁ →**
10. Logro "Felicidades" (todos los gatos aplauden en círculo).
11. Post-créditos: el Almirante Firulais con un gatito dormido en la cabeza. "Bueno... a lo mejor uno."

### 7.8 Semillas para los updates (sembrar en el Capítulo 1)

| Update | Subtítulo propuesto | Nuevo elemento | Semillas que deben existir desde el Capítulo 1 |
|---|---|---|---|
| **Update 2** | *NO ONE LIKE CATS: Voidfall* | 🕳️ Void | Evento "Una Nave del Vacío Entró a tu Mundo" con fragmentos ??? (0/10); una mancha negra que se mueve sola en el Catdex (Manchas); el arenero del jefe Sukunyan; el Mundo Patas Arriba visible un segundo en el reflejo del agua. |
| **Update 3** | *NO ONE LIKE CATS: La Hora de Comer* (Chronos) | ⏳ Chronos | Un reloj de abuelo en la isla que siempre marca la hora de comer; Vecmiau mencionado en una misión ("tic... tac..."); el easter egg Déjà Miau; Frierin diciendo que "diez años fueron una siesta". |
| **Update 4** | *NO ONE LIKE CATS: Beyond the Stars* (Multiverso) | 🌀 Multiverso | Cameo de Miguel O'Garra; el Cuartel de la Sociedad Gatuna visible pero cerrado ("Próximamente: cuando el multiverso lo permita"); gatos que hacen glitch de estilo un segundo; la tele de Cable Interdimensional. |

**Filosofía de updates:** cada update no sube el nivel máximo: **agrega una caja nueva a la pila**. Nuevo elemento, nuevo Primordial, nuevos jefes, nuevos barcos, nuevas Resonancias y nuevos memes en el banco de datos (con la regla 70/20/10 intacta).


---

## Anexo: conteos de los bancos

| Banco | Cantidad |
|---|---|
| `cats` | 137 |
| `attacks` | 90 |
| `ships` | 28 |
| `modules` | 52 |
| `islands` | 22 |
| `bosses` | 20 |
| `foods` | 29 |
| `buildings` | 30 |
| `missions` | 50 |
| `achievements` | 42 |
| `events` | 23 |
| `loadingTips` | 71 |
| `catdexLore` | 25 |
| `systemMessages` | 62 |
| `easterEggs` | 29 |

*Fin del documento 09. Cute cats. Terrible consequences.*
