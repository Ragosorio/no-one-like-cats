# 03 — Castle Busters y el género de artillería + destrucción
### Informe de diseño para el combate de **NO ONE LIKE CATS** (NOLC)

> Fecha de investigación: 3 de octubre de 2026. Las fuentes están al final. Marcas de fiabilidad que uso en el texto:
> **[O]** fuente oficial (web, notas de parche o tiendas) · **[I]** prensa o analistas de la industria · **[C]** guías y comunidad (fiabilidad media) · **[?]** sin verificar, de memoria o con contradicciones.

---

## 0. Resumen ejecutivo

- **Castle Busters** (antes **"Castle Clashers!"**) lo desarrolla **EpiCoro Games** (Eslovenia) y lo publica **Voodoo** (París). Es un PvP **1v1 por turnos alternos** con rival en vivo. El marketing dice "real-time" porque el rival es humano y está conectado, no porque se dispare a la vez. Cada jugador lleva un castillo **sobre ruedas**, hasta **8 unidades** (al principio eran 4) y más de 30 unidades distintas. Se apunta **arrastrando para fijar dirección y potencia** y se suelta para disparar. Se gana **eliminando todas las unidades enemigas o destruyendo el castillo**.
- Es un **éxito comercial**: más de 19,7 M de descargas y más de 14,8 M USD en compras dentro de la app a mediados de 2026, con un pico de unos 4 M USD/mes en abril de 2026. Él solo hizo crecer 4,6× el subgénero "artillery shooter" **[I]**. Combina el combate de Worms con una meta de gacha y cofres al estilo Clash Royale/Habby, además de muchos anuncios con recompensa **[I]**.
- **Qué gusta:** la habilidad pesa más que la suerte; cada disparo cambia el mapa (abrir líneas de tiro, derrumbar pisos, dejar unidades expuestas); las partidas duran unos pocos minutos; las unidades son muy distintas entre sí. **Qué se critica:** pay-to-win con unidades premium de unos 10 USD, **temporizadores de entrenamiento** añadidos después del lanzamiento, emparejamiento contra jugadores que pagan o contra bots, crashes, tramposos, animaciones y paneos de cámara que no se pueden saltar, y **derrumbes en cadena impredecibles**. Este último punto lo corrigieron en el parche 1.18.
- **Recomendación técnica (resumen):** la *física de gameplay* debe ser **nuestra y determinista**: una **rejilla lógica de celdas o módulos con HP**, un **grafo estructural** para los colapsos, un **integrador balístico propio** (el mismo para el disparo, la vista previa y la IA) y una **flotación analítica**. La parte caótica y visual (trozos que se desprenden, escombros, gatos que caen al agua, barriles) la lleva **Rapier 2D (WASM)**. Se renderiza con **PixiJS v8** y la estructura se muestra con máscaras de daño "estilo Worms" para que los agujeros se vean orgánicos. Detalle en §8.
- **Propuesta para NOLC:** asedio naval por turnos de **3–5 min** con **3 condiciones de victoria** (núcleo, hundimiento, tripulación). Cada gato tiene una **trayectoria distinta según su elemento**. Hay unas **12 reacciones elementales sobre materiales y estados** y **unos 16 módulos de barco con efecto real al destruirse**. Los gatos rotos se equilibran con **condiciones visibles** (una bala, carga, berserk, segunda vida, escudos, posición) y nunca con números aburridos. Detalle en §9.

---

## 1. Ficha de Castle Busters

| Campo | Dato | Fuente |
|---|---|---|
| Nombre actual / anterior | **Castle Busters** / **Castle Clashers!** (paquete Android `com.epicoro.castleclashers`) | [O] |
| Estudio | **EpiCoro Games** (Eslovenia). Lo dirige Žan Korošec, creador de *100 Balls* (+40 M de descargas). Trabajan en Unity. | [O] epicoro.com |
| Publisher | **Voodoo** (París) | [O] |
| Plataformas | iOS/iPadOS, macOS (Apple Silicon), Android y Windows vía Google Play Games for PC | [O] |
| Lanzamiento | **26 de mayo de 2025** como *Castle Clashers!*. Empezó a despegar en febrero de 2026 y se renombró a *Castle Busters* en 2026. Versión 1.19 en octubre de 2026. | [I]/[O] |
| Modelo de negocio | F2P híbrido: compras (gemas 4,99–19,99 USD, Battle Pass 14,99, Forge Pass quincenal 14,99, "No RV" semanal 9,99, *Loss Offer* 0,99 tras perder, packs de evento) y **anuncios con recompensa** | [O] App Store |
| Métricas | +19,7 M de descargas y +14,8 M USD IAP (AppMagic, a mediados de 2026); 4 M USD/mes en abril de 2026; 10 M USD IAP entre abril y mayo de 2026; 5,8 M de instalaciones en mayo de 2026. El podcast *2.5 Gamers* habló de un pico de unos 220 k USD/día y unas 100 k descargas/día. | [I] |
| Peso de los anuncios | Según el resumen del episodio de *2.5 Gamers*: ~53 % de los ingresos vienen de anuncios, con ~47 ubicaciones de anuncio con recompensa. Mencionan gacha "plantilla Habby", *boss raids* y *blessings*. | [I]/[?] |
| Nota | Google Play 4,5★ (~200 k reseñas); App Store 4,6★ (~94 k) | [O] |
| Contexto de mercado | Antecesor de Voodoo: *Archery Clash!* (1v1 por turnos de arco: ángulo y fuerza), 4,9 M USD en toda su vida. Comparable histórico: *DDTank Adventure* (2022), con un pico de 14 M USD/mes antes de caer. | [I] |

**Juegos con nombre parecido (no confundir):**
- *Castle Crashers* (The Behemoth, 2008): beat'em up cooperativo.
- *Castle Clash* (IGG): constructor de bases y gacha de héroes.
- *Squad Busters* (Supercell).
- *Castle Busters* de "Dix" (itch.io): demake en PICO-8 del juego de cartas *Arcomage/Ants*.
- `castlebusters.org` y `taggame.io/castle-busters`: portales web con descripciones genéricas o inventadas, como "despliega unidades con elixir". **No son fiables.**
- Algunos agregadores dicen que "ambos disparan a la vez". **Las notas de parche oficiales lo desmienten**, porque hablan de "your turn", "opponent's turn", "turn flow" y efectos "al final de tu turno".
- **Pirate Rivals** (indie, Letonia) es casi exactamente "Castle Busters con barcos": duelos 1v1 de barcos, cañones intercambiables, cubiertas destructibles y victoria por destruir todos los cañones o hundir el casco. Es un competidor directo de nuestra fantasía y confirma que la idea funciona.

---

## 2. Mecánicas de combate en detalle

| Aspecto | Qué se sabe | Confianza |
|---|---|---|
| **Estructura de turno** | Turnos alternos 1v1 contra un rival online (o un bot). En tu turno puedes **mover el castillo** con sus ruedas (limitado por combustible), **elegir una unidad** de las que siguen vivas y **disparar una vez**. Algunos efectos se resuelven **al final del turno**: las tumbas de Graves disparan fantasmas, las nubes de veneno persisten varios turnos y la "restauración de muros" aparece con un fundido al acabar el turno. | [O] |
| **Temporizador** | No hay datos públicos sobre la duración del turno. En el género suele ir de 20 a 45 s. Worms usa unos 45 s configurables; Gunbound penaliza cada segundo con "delay". | [?] |
| **Apuntado** | Eliges la casilla de la unidad, **arrastras para fijar dirección y potencia** y sueltas. Hay una **línea de puntería que se pone verde** cuando el ángulo y la potencia son buenos; en el parche 1.16 le dieron más margen en el tutorial. El tiro sale **desde la posición de la unidad dentro del castillo**. | [O]/[C] |
| **Movimiento** | El castillo **rueda**: las ruedas tienen velocidad, combustible y un stat "Power" sin documentar. Moverse sirve para conseguir ángulo, y además **los castillos aplastan objetos al pasar por encima** (por ejemplo, las tumbas de Graves). | [O] |
| **Proyectiles** | Mucha variedad por unidad: bomba grande con área, detonación retardada, ráfagas de 4, orbes que llueven, láser recto, bumeranes que vuelven, ataque aéreo de seguimiento, napalm que "llueve" si apuntas hacia arriba, nube venenosa persistente, perforantes, *spray*, proyectil que se divide en 3 y tumbas que rebotan y luego invocan fantasmas (detalle en §4). | [O]/[C] |
| **Multiplicadores** | Existe un modificador **"x2"** (las notas de parche hablan de colores del láser "en el modificador x2"). Hay jugadores que se quejan de que **la cámara se desplaza sola** para enseñar las animaciones del multiplicador. Lo más probable es que haya zonas o anillos en la arena que multiplican el tiro: los *arena hazards* que cambian los ángulos. | [O]/[?] |
| **Destrucción física** | Motor de física en tiempo real: paredes, pisos, soportes y torres. Se puede **abrir una línea de tiro a través de 3 pisos**, **derrumbar un piso para que caigan las unidades** o **romper soportes para tirar una torre** sobre las posiciones enemigas. Los **materiales** del castillo mejoran por niveles: madera → piedra → … → diamante → magma. | [O] |
| **Cimientos** | Antes de la 1.18, romper una pared junto a un cimiento podía provocar **derrumbes en cadena no deseados** y el castillo se sentía "frágil de forma impredecible". **La 1.18 reworkeó los cimientos** para que refuercen activamente la estructura y la colocación importe más. **Lección clave: el colapso debe ser espectacular pero predecible.** | [O] |
| **Información oculta** | Las unidades que están dentro del castillo esconden su barra de vida hasta que se **revela**; por ejemplo, el veneno del Poisoner muestra sus barras de HP. | [C] |
| **Victoria** | 1) Eliminar todas las unidades enemigas, o 2) reducir el castillo a escombros. | [O] |
| **Duración** | "Partidas rápidas", "en unos pocos minutos", "sin partidas de 20 minutos". | [O] |
| **Cámara** | Sigue el proyectil y se desplaza sola a los eventos (multiplicadores). Hay quejas de que no se puede desactivar ni saltar, y de que las animaciones de recompensa tras la partida eran lentas (mejorado en 1.16). | [C]/[O] |
| **Bots** | En el emparejamiento hay bots: un parche arregló "bots que huían por el borde del mapa". Las reseñas hablan de "emparejamiento cargado de bots" en ciertos rangos de trofeos. | [O]/[C] |
| **Ayudas (helpers)** | Objetos ofensivos ("gadgets" para romper defensas o presionar unidades) y defensivos (sobrevivir, recuperar). Salen de la Forja. | [O] |

**Lectura de diseño:** el núcleo divertido es **"el mapa se rompe y crea nuevos ángulos"**. Por eso cada tiro es a la vez un ataque y una forma de esculpir el terreno: abrir un hueco hoy te deja una línea de tiro mañana, y también al rival. La victoria doble (unidades o estructura) permite estilos *cirujano* y *demoledor*.

---

## 3. Construcción y configuración del castillo

| Elemento | Detalle | Fuente |
|---|---|---|
| Estructura | El castillo es una rejilla de **filas y columnas**. Los héroes nuevos reaccionan a su **fila**, su **columna** o a sus **vecinos**. | [O] parche 1.16 |
| Ancho | Se compran **casillas de ancho**: la 4.ª cuesta unas 1.000 maderas y la 5.ª unas 10.000. | [C] |
| Cimientos | Piezas anti-colapso. Cada cimiento extra cuesta unas 15.000 maderas. Desde la 1.18 refuerzan de verdad. | [C]/[O] |
| Materiales | Durabilidad por niveles: madera, piedra … diamante, magma. Se mejoran "las partes que más importan". | [O] |
| Colocación de unidades | Las unidades se colocan en posiciones del castillo. La posición afecta a su línea de tiro, a su exposición y a sus sinergias (Sir Rally potencia a sus vecinos, Leif revive a los de su fila, Wolfie se transforma si muere un vecino). | [O] |
| Ruedas | Movilidad (velocidad, combustible). Salen de la Forja. | [O] |
| Límites | Hasta 8 unidades distintas. El ancho y los cimientos están limitados por coste. | [O]/[C] |

**Estrategias de diseño que aparecen en guías y reseñas** [C]:
- Poner a los **bombarderos abajo y al fondo** (protegidos, disparan en parábola).
- Esconder las unidades frágiles **detrás de dos paredes**.
- Hacer **muros señuelo** para provocar que el rival abra huecos que luego le perjudican.
- Hacer **trampas de colapso**.
- Elegir entre castillo **alto** (mejores ángulos, más frágil) y **ancho** (más estable).
- Concentrar el ataque en la **base** para derrumbarlo todo (Bomber, Wrecker), o en la **parte alta** (Air Striker, Napalmer).

---

## 4. Unidades

### 4.1 Roster documentado (parcial: oficialmente hay "30+")

| Unidad | Ataque / habilidad | Rol | Acceso | Fuente |
|---|---|---|---|---|
| **Wrecker** | Una bomba grande con mucho daño en área | Demolición de la base (difícil a larga distancia) | Inicial | [O]/[C] |
| **Bomber** | 4 proyectiles rápidos con buenas explosiones | Demolición fiable de la base. **Meta S** entre jugadores F2P. | Gratis | [C] |
| **Air Striker** | Impacto inicial seguido de una **lluvia aérea** sobre la zona | Romper defensas altas | Gratis | [C] |
| **Napalmer** | Si apuntas hacia arriba, el daño **llueve** y se reparte | Limpiar la parte alta | Gratis | [C] |
| **Crow** | 2 proyectiles con trayectoria **errática** | Daño (difícil de alinear con los multiplicadores) | — | [C] |
| **Poisoner** | Nubes de veneno que **duran varios turnos** y **revelan la vida** de las unidades ocultas | Información y presión | — | [C]/[O] |
| **Burrower** | Disparo rápido, preciso y con área pequeña | Anti-unidad | — | [C] |
| **Breacher** | **Perforante**: alcanza unidades detrás de estructuras | Quirúrgico | — | [C] |
| **Saxton** | 3 bumeranes que **vuelven al castillo** (pueden golpear "por detrás") | Alternativo e irregular | — | [O]/[C] |
| **Scout** | Ráfaga de poca precisión | Daño menor al principio | — | [C] |
| **Barrager** | Gran dispersión de proyectiles | Visual, poco eficiente | — | [C] |
| **Infector** | El proyectil se **divide en 3 explosiones** | Limpieza de estructuras ya dañadas | — | [C] |
| **Pulsar** | **Láser** preciso y potente en la dirección marcada | Precisión | — | [O] |
| **Bishop** | Bomba de **detonación retardada** | Trampa / control | Premium | [O] |
| **Fairy** | **Orbes que llueven** sobre el enemigo | Área | Premium | [O] |
| **Graves** | Lanza **lápidas que rebotan** hasta asentarse. **Al final de cada turno**, cada tumba dispara un fantasma que **prioriza unidades expuestas**. Las tumbas siguen en el campo hasta que un proyectil las destruye o **un castillo las aplasta al rodar**. | Presión persistente | Héroe (1.18) | [O] |
| **Sir Rally** | Aumenta el daño de los aliados **inmediatamente a su alrededor** (en la 1.17 recibió un retraso de lanzamiento) | Soporte posicional | Gratis en Arena 7 | [O] |
| **Leif** | Si **mata** a una unidad enemiga, **revive a los aliados caídos de su fila** | Remontada | Gratis en Arena 25 | [O] |
| **Wolfie** | Se **transforma** y pega mucho más cuando muere un **aliado adyacente** | Venganza | Exclusivo del Battle Pass | [O] |
| **Summoner** | Invoca fantasmas (Temporada 4) | — | Temporada | [O]/[C] |
| Ice Blaster, Vampire, Lazerman, Pirate | Aparecen nombrados. Lazerman y Pirate son premium y se perciben como **OP**. | — | — | [O]/[C] |

### 4.2 Roles, rareza, progresión y balance
- **Roles oficiales del marketing:** *Knights* rompen la primera línea, *Archers* castigan unidades expuestas, *Bombers* abren muros y torres, *Siege engines* aplastan secciones enteras.
- **"Rareza" en la práctica:** hay unidades **gratis por arena**, **premium** (de pago, unos 10 USD según las reseñas), **exclusivas del Battle Pass** y **de temporada**. No hay una escala clásica de común a legendario bien documentada.
- **Progresión:** **cartas + oro** suben de nivel. Al subir se desbloquean **perks** y **"power spikes"** que cambian cómo juega la unidad. Más tarde añadieron **temporizadores de entrenamiento** (horas por nivel, máximo 4 mejoras simultáneas, se aceleran con gemas) [C]. La 1.17 quitó el tope de "40 niveles por acción".
- **Balance observado:** la meta F2P la dominan las unidades de **área que atacan la base de la estructura** (Bomber, Air Striker, Wrecker). Las de un solo objetivo rinden peor contra castillos bien construidos. Las premium se perciben como "ganadoras instantáneas". **Lección: en un juego de destrucción, el daño estructural en área siempre tiende a ser la meta**, así que hay que darle costes (precisión, carga, recursos) o dar recompensas por los objetivos quirúrgicos (núcleo, gatos expuestos, módulos clave).

---

## 5. Progresión, meta y monetización

| Sistema | Cómo funciona en CB | Fuente |
|---|---|---|
| Trofeos y arenas | *Trophy road* con más de 25 arenas; la cima es "Coliseum Clash" (~8.200 de rating). Hay **modo ranked** y clasificaciones por temporada. | [O]/[C] |
| Emparejamiento | Por trofeos. La 1.17 lo rediseñó "para reflejar el nivel real". Las quejas apuntan a rivales que pagan y a bots. | [O]/[C] |
| Cofres | **Hasta 5 al día**. Cuando están llenos, **un anuncio los reinicia**. Se convierten en oro. | [C] |
| Monedas | **Oro** (unidades), **madera** (castillo), **gemas** (acelerar), **cartas o comodines** | [C] |
| Forja | Cada mejora de unidad o castillo da puntos. Los hitos dan oro, madera y cofres; también ruedas y objetos de ayuda. | [O]/[C] |
| Misiones | Diarias y semanales: oro y madera, más un cofre extra al completarlas todas | [C] |
| Tienda diaria | 3 compras por categoría al día (gemas, monedas, madera) | [C] |
| Battle Pass y temporadas | Pase corto (se completa en 2–3 días según una guía). Temporadas temáticas: *Machine Mayhem*, Temporada 4 *Summoner*... Hay torneos con reglas especiales (*Druid's Trial*, *Inventor's Challenge*, *Treasure Hunt*). | [O]/[C] |
| Recompensas por partida | Ganar da madera, oro y puntos de arena. **Perder da ~50 %**. Un anuncio duplica la recompensa. | [C] |
| Anuncios | Opcionales, pero hay muchos (~47 ubicaciones). Se queja la gente de anuncios que no entregan la recompensa. | [I]/[O] |

**Principales quejas** (reseñas de Play y App Store y análisis de terceros):
1. Pay-to-win por héroes premium y por emparejarte contra jugadores que pagan.
2. **Temporizadores de entrenamiento** añadidos después y recompensas de cofres recortadas ("ahora el grind es un suplicio").
3. Crashes, sobrecalentamiento y desincronizaciones PvP.
4. Tramposos (la 1.17 baneó a "decenas de miles").
5. Cámara o animaciones que no se pueden saltar.
6. Falta de contenido al llegar arriba ("me quedé sin metas").
7. Rutina diaria repetitiva.

**Para NOLC:** no tenemos presión de monetización y el juego "se termina en un día". Copiamos el **bucle de combate** y la **variedad de unidades** y tiramos a la basura todo el andamiaje de retención por fricción: temporizadores, anuncios, cofres con espera y el reinicio diario.

---

## 6. Referentes del género y qué aporta cada uno

| Juego | Año / estudio | Mecánica clave | Qué tomamos para NOLC |
|---|---|---|---|
| **Scorched Earth** | 1991, Wendell Hicken | Ángulo y potencia, terreno destructible, armas absurdas | Arsenal exagerado. **Personalidades de IA** (Moron, Shooter, Tosser, Spoiler, Cyborg…) como modelo de dificultad (§7). |
| **Worms** (serie) | 1995+, Team17 | Equipo de unidades, terreno de **máscara de bits** destructible, viento, tiempo de retirada, humor, ***sudden death* en el que sube el agua** | Escuadrón de gatos con personalidad. El agua que sube es perfecta para barcos (**tormenta o marea roja** como muerte súbita). Agujeros orgánicos en el render. |
| **Worms Forts: Under Siege** | 2004, Team17 | Construir fuertes durante la partida. **Los edificios que no están conectados al Stronghold se caen.** Si cae el Stronghold, pierdes. | **Grafo de conectividad estructural** (lo que no conecta con la quilla se cae). Aviso: construir *durante* la partida lo hizo lento y la crítica lo notó; **la construcción va antes del combate.** |
| **Gunbound** | 2002+, Softnyx | "Mobiles" con 3 disparos (1, 2 y **SS** especial). **El orden de turno depende de un "delay"**: los tiros pesados retrasan tu siguiente turno y **cada segundo que tardas suma delay**. Viento y clima. | **Coste temporal de los poderes**: el especial "cuesta turnos". Inspira la **carga visible** de los gatos rotos y el clima como modificador. |
| **Pocket Tanks** | 2001, Blitwise | 1v1 rápido, cientos de armas en packs, **selección alterna de armas antes de jugar** [?] | Fase de *draft* o *pick* contra la IA en eventos. Partidas de pocos disparos por bando. |
| **ShellShock Live** | 2015, kChamp | +400 armas, **movimiento limitado por combustible**, XP y desbloqueos, modo "all-shot" simultáneo | Combustible por turno para maniobrar el barco. Desbloqueo constante de "verbos" nuevos. |
| **Archery Clash! / DDTank / Tank Stars** | Voodoo 2023 / 2009+ / Playgendary [?] | 1v1 de ángulo y fuerza con progresión de equipo | Confirman que el formato 1v1 de pocos minutos funciona en mercados masivos. |
| **Crush the Castle** | 2009, Armor Games | Trebuchet contra castillos: matar a los habitantes a través de la estructura | "Matar a la tripulación a través del barco" como condición de victoria. El placer del derrumbe. |
| **Angry Birds** | 2009, Rovio (Box2D) | **Materiales con personalidad** (madera, hielo/cristal, piedra), **habilidad a mitad de vuelo** (tocar para dividir, acelerar o explotar), la estructura se asienta y sigue puntuando | **Acción a mitad de vuelo** para cada gato (skill expression). Materiales con sonido y forma de romperse propios. La espera mientras todo cae es parte del placer. |
| **Bad Piggies** | 2012, Rovio | Construir artefactos con piezas en una rejilla, probarlos e iterar | **UX del astillero**: rejilla, piezas que encajan y "prueba rápida" del barco contra un muñeco. |
| **Siege Hero** (y *Pirate Pillage*) | ~2012, Armor Games [?] | Destrucción física de castillos con munición limitada | Retos de "hunde el barco con N disparos" para eventos y puzzles. |
| **Kingdom Wars** | varios títulos con ese nombre [?] | Castillo contra castillo con mejoras de muro | No pude identificar uno canónico; vale solo como referencia genérica. |
| **Boom Beach** | 2014, Supercell | **Cañonera con energía**: cada uso de la misma arma **cuesta más que el anterior** (Artillería +2, Barrage +6) y **destruir edificios devuelve energía** | **Energía del barco**: los disparos de cañón propios tienen coste creciente y destruir módulos recarga energía. Evita repetir siempre el mejor tiro. |
| **Battle Bay** | 2017, Rovio | Barcos con **clases** (Shooter, Speeder, Enforcer, Defender, Fixer) y **ranuras de armas**. 5v5 en tiempo real, 3D. | **Arquetipos de barco** con identidad (Sparrow, Bastion, Marauder, Arcane…) y ranuras. No es artillería por turnos. |
| **FTL: Faster Than Light** | 2012, Subset Games | **Cada sala del barco es un sistema** (escudos, motores, armas, oxígeno, enfermería). Si apuntas a una sala, la desactivas. Hay fuegos, brechas y tripulación que tripula salas. | **El mapeo más directo de "módulo destruido → efecto real".** Tripulación (gatos) en salas que potencian el sistema. |
| **Cosmoteer** | 2017+, Walt Destler | Barcos 2D modulares en rejilla. **Cada pieza se destruye por separado** y la nave **se parte en trozos** si se rompen las conexiones. Pasillos cortados = armas sin munición. | **Rejilla + conectividad + "islas" que se desprenden.** Ese es nuestro modelo técnico. |
| **Floating Sandbox** | Gabriele Giuseppini, open source | Red masa-resorte, agua que **entra por las brechas y se acumula**, olas con ecuaciones de aguas someras | Inspiración **visual** de la inundación. **No** copiar la simulación (demasiado costosa y poco legible). |
| **Sinking Ships Physics** (móvil) | indie | Compartimentos que se inundan hasta hundir el barco | Aviso de una reseña: "**llenas 1 compartimento y se hunde**". La inundación debe ser **gradual y legible**. |
| **Pirate Rivals** | indie, 2026 | 1v1 de barcos, cañones intercambiables, **victoria por destruir todos los cañones o hundir** | Competidor directo. Diferenciarnos con gatos, elementos, crianza y bosses. |
| **Lux Ahoy** (web) | — | Barcos piratas: ángulo + **mantener pulsado para la potencia** | Control mínimo viable en navegador. |
| **Pirates Outlaws** | 2019, FabledGame | **No es artillería**: es un *roguelike* de cartas (16 héroes, +700 cartas, +60 bosses) | Ideas de **variedad de bosses**, mapa de ruta y reliquias, no de combate físico. |
| "Sea Battle", "Ships of Battle", "Pirate Ship Shooter" | genéricos [?] | Suelen ser *Battleship* en rejilla o shooters 3D | Poco aplicable. |
| **Hardspace: Shipbreaker** | 2022, Blackbird | Desguazar naves cortando por puntos. Los **sistemas peligrosos** (reactor, combustible, presión) explotan si se cortan mal. | Módulos de **alto riesgo y alta recompensa** (polvorín, núcleo inestable) que detonan en cadena. |
| **Teardown** | 2022, Tuxedo Labs | Destrucción voxel total con reglas consistentes | La satisfacción viene de que **todo se rompa igual de forma coherente**. |

### 6.1 Qué hace que la destrucción se sienta satisfactoria (checklist)
Principios de *game feel* conocidos ("Juice it or lose it", Jonasson y Purho, GDC 2012; "The Art of Screenshake", Nijman/Vlambeer; los derrumbes de Angry Birds y Teardown) **[?: de memoria]**, más las lecciones de Castle Busters:

1. **Anticipación:** vista previa de la trayectoria, el gato se tensa y la cámara se aleja. En los tiros cargados, una barra que se llena con sonido.
2. **Impacto:** *hit-stop* de 60–120 ms, sacudida **proporcional** al daño, destello, onda expansiva (filtro de desplazamiento), sonido por capas (golpe, crujido del material, salpicadura).
3. **Secuelas (lo más importante):** trozos que se desprenden y **caen al agua**, columnas de agua, chispas, humo que persiste y **eventos secundarios en cadena** que llegan tarde (un mástil que se tambalea y cae medio segundo después). El jugador *mira cómo cae lo que provocó*.
4. **Causa → efecto legible:** cada reacción muestra **un icono o un número** ("CONDUCCIÓN ×1.5", "INCENDIO", "MÓDULO DESTRUIDO: MOTOR").
5. **Predecible pero sorprendente:** el colapso sigue reglas que se pueden **anticipar**: el soporte crujía y el inspector lo advertía. Castle Busters tuvo que rehacer los cimientos porque las cadenas imprevisibles se sentían injustas.
6. **Persistencia:** los agujeros, el fuego, la madera chamuscada y los mástiles caídos **se quedan** y cambian los ángulos del resto de la partida.
7. **Proporción:** los tiros normales tienen un *juice* moderado. Las ultimates y los golpes críticos tienen *slow-mo*, zoom y corte anime. Si todo explota igual, nada impresiona.
8. **Ritmo:** las secuelas duran ≤ 3–4 s y **siempre se pueden acelerar o saltar** con la barra espaciadora (lo que más se criticó de CB).
9. **Recompensa inmediata:** botín (madera, piezas, comida) que sale del módulo roto y vuela hacia la interfaz. Es dopamina de Dragon City dentro del combate.

---

## 7. Diseño de IA enemiga para artillería por turnos

### 7.1 Arquitectura (sin clonar mundos de física)
Como en NOLC **la balística y el daño son lógica propia y determinista** (§8), la IA puede **simular cientos de tiros en milisegundos** con el mismo código del juego.

```
decideTurn(state, ai):
  options = []
  for cat in ai.readyCats + ai.shipWeapons:
    for target in candidateTargets(state, ai.personality):      // módulos, gatos expuestos, celdas de soporte
      for (angle, power) in solveOrSample(cat.shot, origin(cat), target, state.wind):
        result = simulateShot(state.clone(), cat, angle, power) // integrador propio + resolver daño + pase estructural
        options.push({cat, angle, power, score: evaluate(result, ai)})
  best = softmaxPick(options, temperature = ai.temperature)     // no siempre la mejor: parece humana
  (angle, power) = applyError(best, ai, memory[target])          // ruido gaussiano + "horquillado"
  maybeMoveShip(ai)                                              // usa combustible si mejora el ángulo
  return {best.cat, angle, power, midFlightTiming}
```

- **Solución analítica** para el primer candidato, sin viento y con gravedad *g*. Con rapidez *v* hacia un objetivo en (x, y) relativo:
  `tanθ = (v² ± √(v⁴ − g(g·x² + 2·y·v²))) / (g·x)`. El "+" da el **tiro bombeado** y el "−" el **tiro tenso**.
- **Con viento u obstáculos:** muestreo (por ejemplo, ángulos de 5° a 85° cada 2°, × 12 potencias, unos 500 tiros) y luego **refinamiento por bisección** de la potencia alrededor de los 5 mejores. Con un integrador simple contra la rejilla, cada simulación cuesta microsegundos y todo cabe en < 15 ms dentro de un Web Worker.
- **Función de evaluación (utilidad):**
  `score = Σ(dañoCelda × valorMódulo) + bonusKO + bonusReacción + bonusColapso + bonusHundimiento − dañoPropio − desperdicio(overkill)`.
  Los **valores de módulo cambian según el estado**. Si un gato rival está cargando *Singularity 1/2*, su camarote vale ×5: la IA "entiende" el **"MÁTENLO YA"**. Si el escudo rival está activo, compensa más romper el generador. Si el rival está casi hundido, compensa una brecha bajo la línea de flotación.
- **Información justa:** la IA **no ve** la vida de los gatos ocultos hasta revelarlos (igual que el jugador) y estima el viento con su propio error.

### 7.2 Modelo de error controlado por dificultad

| Parámetro | Grumete (fácil) | Corsario (normal) | Capitán (difícil) | Leyenda / Boss |
|---|---|---|---|---|
| σ ángulo | 6° | 3° | 1,5° | 0,8° |
| σ potencia | 12 % | 6 % | 3 % | 1,5 % |
| Error al leer el viento | ±40 % | ±20 % | ±8 % | ±3 % |
| Temperatura del softmax | alta (elige el 2.º o 3.º mejor a menudo) | media | baja | ~0 + guion |
| Horquillado (*Tosser*) | σ × 0,7 por tiro repetido al mismo objetivo | × 0,6 | × 0,5 | no lo necesita |
| Combos elementales | no | simples (mojar → electrificar) | sí, planifica 2 turnos | sí, más reglas propias |
| Interrumpe cargas rivales | nunca | a veces | siempre que pueda | siempre, con frase de reto |
| Mueve el barco | no | a veces | sí | patrones propios |
| Tiempo de "pensar" mostrado | 1,5 s | 1,2 s | 1 s | 0,8 s + animación |

**Trucos para que la IA se sienta humana y justa:**
- **Horquillado:** en fácil o normal, el primer tiro a un objetivo nuevo se queda corto o largo *a propósito* y luego corrige. El jugador ve "que aprende".
- **Rubber band suave y oculto** (solo en campaña, nunca en bosses): si el jugador va muy perdiendo, σ × 1,25. Si va arrasando, la IA no se vuelve más precisa; usa mejores decisiones.
- **Nunca hacer trampas visibles:** nada de tiros imposibles ni de leer información oculta.
- **Telegrafiar:** antes de un tiro grande, la IA "anuncia" (icono de carga, frase del capitán). Así el jugador tiene un turno para responder.

### 7.3 Personalidades (modelo Scorched Earth adaptado a capitanes piratas)

| Personalidad | Inspiración | Comportamiento | Ejemplo de capitán |
|---|---|---|---|
| **Torpe** | *Moron* | Ángulo y potencia casi al azar cerca del objetivo | Grumete Bigotes (tutorial) |
| **Francotirador** | *Shooter* | Solo dispara si tiene línea recta: rayos, láseres | Capitana Mira |
| **Afinador** | *Tosser* | Empieza mal y afina hasta clavar el tiro | Contramaestre Ovillo |
| **Calculador** | *Spoiler* | Compensa la gravedad y el viento casi perfecto | Almirante Tictoque |
| **Vengativo** | *Cyborg* | Ataca al gato que más daño le hizo, al más débil o al líder | Lady Garra |
| **Saqueador** | nuevo | Prioriza módulos de botín (bodega, despensa) | Marauder Ratas |
| **Demoledor** | meta de CB | Ataca la quilla y los soportes para provocar colapsos | Barón Ladrillo |
| **Elementalista** | nuevo | Prepara estados y luego hace la reacción (mojar → electrificar) | Bruja Nimbus |

### 7.4 Bosses: reglas propias, fases y telegrafía
Plantilla: **3 fases** (100–66 %, 66–33 %, 33–0 %), **1 regla que rompe el juego normal**, **1 punto débil que se revela**, **ataques telegrafiados** y un ***enrage* suave** a partir del turno N.

| Boss | Elementos | Regla propia | Punto débil | Fase final |
|---|---|---|---|---|
| **Leviatán de Hierro** (barco-ballena) | Agua / Tierra | Se **sumerge cada 3 turnos**. Mientras está sumergido solo le afecta lo eléctrico (conduce por el agua) y lo cósmico. | El espiráculo (núcleo) queda expuesto al emerger | Embiste: empuja tu barco y te provoca una brecha |
| **Galeón Fantasma** | Spirit / Void | Casco **etéreo**: el daño físico se multiplica por 0,25 salvo en celdas **iluminadas** (fuego o magia). Los módulos destruidos **resucitan una vez**, salvo que los toque el Void. | Linternas de alma (3) | Abordaje de fantasmas que inmovilizan a tus gatos |
| **Fortaleza Relojera** | Eléctrico / Chronos | **Repara 1 módulo por turno** mientras viva la sala de máquinas. Cada 4 turnos "rebobina" tu último tiro. | Sala de máquinas, protegida por mamparos de metal | Sobrecarga: dispara 2 veces por turno |
| **Kraken del Vacío** | Void / Cósmico | **Tentáculos** como objetivos separados que agarran tus módulos y tiran gatos al agua. Agujero negro cada 3 turnos que atrae los escombros. | El ojo, solo cuando abre la boca | Engulle módulos enteros (borrado Void) |
| **Capitana Rival** (historia) | Copia los tuyos | **Usa contra ti tu elemento más usado** | Su gato "roto", visible cargando | Berserk si pierde a 2 gatos |

---

## 8. Implementación técnica en web

### 8.1 Motores de física para TypeScript en el navegador

| | **Matter.js** | **Planck.js** | **Rapier 2D** (WASM) | **Phaser Box2D** (v3 → JS) |
|---|---|---|---|---|
| Lenguaje | JS puro | JS/TS (reescritura de Box2D 2.x) | Rust → WASM (`@dimforge/rapier2d[-compat]`) | JS (port de Box2D 3.0) |
| Rendimiento orientativo a 60 fps | unos pocos cientos de cuerpos | ~500 cuerpos | **2.000+ cuerpos** (builds SIMD 2–5× más rápidas que las de 2024) | alto (solver *soft step*) |
| Estabilidad de pilas | **floja** (temblor y hundimiento en torres) | buena | buena | **muy buena** |
| CCD (anti-túnel de proyectiles) | no nativo | sí (*bullet*) | sí | sí |
| Juntas y fuerzas | básicas (*constraints*) | completas, con fuerza de reacción → juntas rompibles | completas | completas |
| Snapshot / clonar mundo | no | sin snapshot binario nativo | **`world.takeSnapshot()` / `World.restoreSnapshot()`** | no documentado |
| Determinismo | igual código + igual motor JS → normalmente sí; nada garantizado entre navegadores | ídem | **Paquete `rapier2d-deterministic`: determinismo bit a bit multiplataforma** | Box2D C ≥ 3.1 es determinista; el port JS 3.0 no lo garantiza |
| Tamaño | ligero (JS puro) | ligero (JS puro) | ~0,5 MB WASM (versión *compat* con base64 inline) | ~65 KB gzip |
| Ergonomía | la más fácil (prototipos) | técnica pero clara | buena; init asíncrono | API estilo C |
| Encaje para NOLC | prototipo de 1 semana | alternativa válida 100 % JS | **recomendado** | alternativa interesante |

### 8.2 Estrategias de destrucción

| Enfoque | Cómo funciona | Ventajas | Problemas | Uso en NOLC |
|---|---|---|---|---|
| **A. Máscara de bits** (Worms) | El terreno es una imagen. Una explosión borra píxeles; la colisión es por píxel o con *marching squares* → polígonos → colisionadores regenerados. | Agujeros orgánicos y bonitos; ideal para terreno | Sin colapso estructural (Worms tiene islas flotantes); regenerar colisionadores es caro; difícil de equilibrar | **Solo visual**: máscara de daño sobre el sprite del barco e islas del mapa |
| **B. Cuerpos rígidos + juntas rompibles** (Angry Birds, Crush the Castle, probablemente CB) | Cada bloque es un cuerpo; las juntas se rompen al superar una fuerza | Emergente, espectacular | **Impredecible** (lo de los cimientos de CB), torres inestables, coste alto, determinismo frágil, la IA tiene que clonar la física | Solo para **trozos que ya se soltaron** |
| **C. Rejilla lógica + grafo estructural + física para trozos** (Cosmoteer, FTL) | El barco es una rejilla de celdas y módulos con HP y material. El daño se aplica sobre la rejilla. Un BFS desde la quilla y los cimientos decide qué sigue sujeto. Lo desconectado se convierte en un **trozo físico**. | **Determinista, barato, legible, equilibrable**, la IA lo simula gratis, permite "vista previa de colapso" | Exige buen arte de fracturas para no verse "cuadriculado" | **Base del sistema** |

**Recomendación: un híbrido C + A (visual) + B (solo trozos).**

### 8.3 Cómo modelar el barco modular destructible

```
BARCO (vista lógica, rejilla de 16×10 celdas de 32 px)        Leyenda
 . . . . . . M . . . . . . . . .    ← cofa/mástil (lona+madera) M=mástil  S=vela
 . . . . . S M S . . . . . . . .                                C=cañón   G=camarote de gato
 . . C C . S M S . . G G . . . .                                X=núcleo  P=pólvora
 . . C C H H H H H H G G H . . .    ← cubierta                  E=motor   B=mamparo
 . H H G G H X X H P P H E E H .                                H=casco   K=quilla (carga)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  ← línea de flotación (fila 5)
 . H B H H B X X B H H B E E H .    ← compartimentos (B separa)
 . . K K K K K K K K K K K K . .    ← quilla: soporte raíz del BFS
```

1. **Celdas:** cada celda tiene `material`, `hp`, `estados` y `moduleUid`. Los módulos ocupan de 1×1 a 3×2 celdas. El HP del módulo es la suma de sus celdas, o un HP propio con celdas "piel".
2. **Daño:** la explosión es un círculo (o un cono o una línea según el disparo). A cada celda le llega `daño = base × caída(dist) × resistencia(material, elemento) × multiplicadores`. Los **perforantes** recorren la línea con DDA (Amanatides–Woo) y atraviesan N capas.
3. **Pase estructural** (después de cada impacto y al final del turno):
   ```
   supported = BFS desde celdas Quilla/Cimiento por vecinos 4-conectados
               cuyos materiales "transmiten carga" (no lona, no cristal roto)
   for cada componente conexa NO soportada:
       si su tamaño ≤ umbralChatarra → escombros (partículas + un par de cuerpos)
       si no → TROZO: quitar celdas de la rejilla, crear un cuerpo Rapier compuesto
              (cuboides por celda) con el impulso de la explosión
       daño de caída (lógico y determinista) = masa × altura × k, aplicado a la
              primera celda sólida debajo de su huella (con tope por turno)
   ```
   - **Vista previa de colapso:** al pasar el ratón por una celda, se muestra "si cae esto, caen 7 celdas, incluido el Cañón 2". En fácil siempre está activa. En difícil requiere el **Mástil/Cofa vivo**: así el módulo tiene una función clara.
   - **Crujido:** las celdas con un solo apoyo muestran grietas y suenan. El colapso se puede anticipar.
4. **Flotación y hundimiento (analíticos, sin fluido):**
   - `flotabilidad = Σ celdas de casco bajo la línea de flotación sin brecha × b(material)`; `peso = Σ masas + agua en compartimentos`.
   - **Brecha** = una celda de casco destruida bajo la línea de flotación. Su **compartimento** (región entre mamparos) **se inunda un X % al final de cada turno**, de forma gradual y con indicador. Las **bombas de achique** lo reducen.
   - Si `peso > flotabilidad`, el barco **baja una fila por turno**. Cuando el agua alcanza el núcleo, el barco **se hunde** (condición de victoria).
   - **Escora:** el ángulo depende de la diferencia de peso entre babor y estribor (`ángulo = clamp(k·Δmasa, ±12°)`), animado con un *spring*. El oleaje es un balanceo senoidal **puramente visual**, o sale de una semilla si afecta al apuntado.
   - El barco es un **cuerpo cinemático** en Rapier (sus colisionadores salen de la rejilla) para que los trozos y los gatos caídos reboten sobre él. **No** es un cuerpo dinámico: así evitamos vuelcos caóticos.
5. **Proyectiles:** **integrador propio** a dt fijo (`v += (g + viento·k)·dt; p += v·dt`) con raycast contra la rejilla (en coordenadas locales del barco, aplicando la escora), contra objetos del mapa y contra la superficie del agua. Es **el mismo código** para la vista previa, la IA, la repetición y el disparo real. Los trozos de Rapier **no bloquean** proyectiles (o solo los grandes, con un raycast de Rapier si se quiere).
6. **Render (PixiJS v8):** cada módulo es un sprite. Encima va una **máscara de daño (RenderTexture)** donde se "muerden" círculos irregulares en cada impacto (la técnica A, solo visual). Las grietas son *decals* por HP. Las partículas van en `ParticleContainer`. Hay filtros de onda expansiva, *glow* y aberración cromática en las ultimates. Los trozos son sprites recortados de la textura original (se ven como "pedazos del mismo barco").

### 8.4 Rendimiento y determinismo

| Presupuesto (PC de gama media, 60 fps) | Valor |
|---|---|
| Celdas por barco | ≤ 400 (por ejemplo 20×20) |
| Cuerpos dinámicos activos (trozos, gatos caídos, barriles) | ≤ 150–200 (Rapier va sobrado) |
| Partículas | ≤ 3.000 simultáneas |
| Física + lógica por frame | < 4 ms |
| IA por turno | < 20 ms en un Web Worker (cientos de tiros simulados) |
| Resolución tras el disparo | La simulación sigue hasta que todo **duerme** o pasan 4 s. **Espacio = ×4.** |

**Reglas de determinismo** (sirven para repeticiones, para semillas de bosses o eventos, para que la IA prediga lo mismo que pasa y por si algún día hay PvP asíncrono):
- **Paso fijo** de 1/60 s; el render interpola.
- **PRNG con semilla** (sfc32 o mulberry32) dentro del estado de batalla. **Prohibido `Math.random()` en la simulación.**
- **HP y daño en enteros.** Los flotantes solo en el integrador. +, −, ×, ÷ y `sqrt` de IEEE-754 son reproducibles en JS, pero **`Math.sin`, `cos`, `atan2`, `pow` y `exp` no están garantizados entre motores**: usar tablas propias o evitarlas en la lógica.
- **Orden estable** de iteración (arrays, nunca `Set` u objetos con orden ambiguo).
- Si algún día la física de los trozos afecta al resultado (por ejemplo, el pozo cósmico que lanza escombros), cambiar a `@dimforge/rapier2d-deterministic-compat` y usar `takeSnapshot()` para repeticiones y deshacer.

### 8.5 Recomendación concreta

> **PixiJS v8 (render) + lógica de combate propia en TypeScript (rejilla, daño, estados, grafo estructural, flotación, balística) + Rapier 2D `-compat` solo para trozos, escombros y elementos físicos decorativos.** Una capa `CombatSim` pura, sin DOM, que corre igual en el hilo principal y en un Worker (IA). **Matter.js** vale solo para un prototipo de 1–2 semanas. **Planck.js** es el plan B si no queremos WASM. Las **ruedas, el combustible y la escora** son lógica nuestra, no física.

### 8.6 Esquema de datos (TypeScript)

```ts
// ---------- Catálogos (datos estáticos, JSON) ----------
type ElementId = 'fire'|'water'|'electric'|'ice'|'earth'|'wind'|'nature'|'cosmic'|'magic'|'void';
type MaterialId = 'wood'|'iron'|'stone'|'crystal'|'canvas'|'bone'|'arcane';
type StatusId = 'wet'|'burning'|'frozen'|'brittle'|'charged'|'overloaded'|'rooted'
              |'weightless'|'cursed'|'voided'|'steam'|'smoke'|'revealed';
type ModuleRole = 'core'|'keel'|'hull'|'bulkhead'|'deck'|'mast'|'sail'|'engine'|'cannon'
                |'summoning'|'shield'|'bridge'|'cabin'|'magazine'|'pantry'|'pump'|'anchor'|'tower';

interface MaterialDef {
  id: MaterialId;
  hpPerCell: number;            // entero
  mass: number;                 // para flotación y caída
  buoyancy: number;             // aporte si está bajo la línea de flotación
  loadBearing: boolean;         // ¿transmite carga en el BFS?
  resist: Partial<Record<ElementId, number>>; // 1 = normal, 0.5 = resiste, 2 = débil
  tags: ('flammable'|'conductive'|'brittle'|'organic'|'ethereal')[];
  fx: { hitSfx: string; breakSfx: string; debris: string; decal: string };
}

interface ModuleEffect {        // pasivo mientras vive o disparado al destruirse
  kind: 'stat'|'grantAction'|'aura'|'onTurnEnd'|'explode'|'disable'|'spawn';
  target: 'ownShip'|'enemyShip'|'cellsInRadius'|'catsInModule'|'adjacentModules';
  params: Record<string, number|string|boolean>;
}

interface ModuleDef {
  id: string; name: string; role: ModuleRole;
  footprint: { w: number; h: number; mask?: number[] }; // celdas ocupadas
  material: MaterialId;
  hp: number;                     // HP del módulo (además del de sus celdas)
  catSlots?: number;              // camarotes
  energyCost?: number;            // presupuesto del astillero
  passive: ModuleEffect[];        // mientras vive
  onDestroyed: ModuleEffect[];    // al romperse (ej. polvorín → explode)
  value: number;                  // valor base para IA y botín
  loot?: { item: string; qty: [number, number] }[];
}

interface ShotDef {
  id: string; element: ElementId;
  trajectory: 'ballistic'|'straight'|'bounce'|'boomerang'|'homing'|'torpedo'|'targeted'|'plant';
  projectiles: number; spreadDeg: number;
  speed: [min: number, max: number]; gravityScale: number; windScale: number;
  explosion: { radius: number; damage: number; falloff: 'linear'|'none'|'quadratic'; pierceLayers: number };
  applies: { status: StatusId; turns: number; chance: number }[]; // chance ⇒ usar PRNG con semilla
  midFlight?: { action: 'split'|'dive'|'detonate'|'boost'|'stop'; params: Record<string, number> };
  limits?: { usesPerBattle?: number; chargeTurns?: number; cooldown?: number; energy?: number };
  previewLength: number;          // % de la trayectoria visible
}

interface CatCombatDef {
  catId: string;                  // enlaza con la colección (crianza, rareza, nivel…)
  elements: ElementId[]; role: 'artillero'|'demoledor'|'francotirador'|'soporte'|'invocador'|'tanque';
  baseHp: number; shot: ShotDef; ultimate?: ShotDef;
  passives: { trigger: 'allyDied'|'neighborDied'|'killedEnemy'|'turnStart'|'damaged'|'positional';
              effect: string; params: Record<string, number> }[];
  limitation?: 'oneShot'|'charge'|'berserk'|'secondLife'|'shields'|'glass'|'unstable'|'positional';
}

// ---------- Plano del barco (lo que guarda el jugador) ----------
interface ShipBlueprint {
  id: string; archetype: 'sparrow'|'bastion'|'marauder'|'arcane'|'celestial';
  grid: { w: number; h: number; waterlineRow: number };
  modules: { uid: string; defId: string; x: number; y: number; rot: 0|90|180|270; level: number }[];
  crew: { catUid: string; moduleUid: string; slot: number }[];   // gato → camarote
  captainRelic?: string; artifacts: string[];                     // objetos de un solo uso
  stats: { maxFuel: number; enginePower: number; shieldCap: number };
}

// ---------- Estado de batalla (serializable, determinista) ----------
interface CellState { moduleUid: string|null; material: MaterialId; hp: number; maxHp: number;
                      statuses: { id: StatusId; turns: number; stacks: number }[];
                      supported: boolean; damageMaskSeed: number; }
interface CompartmentState { id: number; cells: number[]; flood: number /*0..100*/; breached: boolean }
interface CatState { uid: string; defId: string; hp: number; maxHp: number; shields: number;
                     lives: number; charge: number; usesLeft: number|null; rage: number;
                     state: 'ready'|'charging'|'stunned'|'exposed'|'overboard'|'ko';
                     moduleUid: string|null; revealed: boolean; }
interface SideState { blueprintId: string; cells: CellState[]; compartments: CompartmentState[];
                      cats: CatState[]; fuel: number; energy: number; sinkRows: number;
                      heelDeg: number; shieldHp: number; }
interface BattleState {
  seed: number; rng: [number, number, number, number];   // estado del PRNG
  turn: number; active: 0|1; phase: 'move'|'aim'|'flight'|'resolve'|'endTurn';
  wind: number; sea: { amp: number; period: number }; weather: 'calm'|'storm'|'fog'|'void';
  sides: [SideState, SideState];
  field: { id: string; kind: 'mine'|'barrel'|'rock'|'ring'|'grave'|'vine'; x: number; y: number; hp: number }[];
  suddenDeathTurn: number; log: BattleEvent[];            // log → repeticiones y "MVP"
}
type BattleEvent = { t: number; kind: string; data: Record<string, unknown> };
```

Ejemplo de dato (polvorín):
```json
{ "id": "powder_magazine_1", "name": "Santabárbara", "role": "magazine",
  "footprint": { "w": 2, "h": 1 }, "material": "wood", "hp": 60, "value": 40,
  "passive":    [{ "kind": "stat", "target": "ownShip", "params": { "cannonDamagePct": 25 } }],
  "onDestroyed":[{ "kind": "explode", "target": "cellsInRadius", "params": { "radius": 3, "damage": 80, "applyStatus": "burning" } }],
  "loot": [{ "item": "polvora", "qty": [2, 5] }] }
```

---

## 9. Conclusión aplicada: el combate de NO ONE LIKE CATS

### 9.1 Pilares
1. **Leer el barco:** cada módulo tiene una función y romperlo cambia algo real (FTL y Cosmoteer con la física de Castle Busters).
2. **Los elementos reaccionan con los materiales:** el agua moja, la electricidad conduce, el fuego prende la madera… El combo planificado es la *skill expression*.
3. **Gatos rotos con condiciones**, no con números aburridos.
4. **Destrucción legible y espectacular:** colapsos predecibles, secuelas jugosas, todo se puede acelerar.
5. **Partidas cortas (3–5 min)** dentro de un juego de un día. El combate nunca se vuelve una tarea.

### 9.2 Modos

| Modo | Formato | Duración objetivo | Para qué |
|---|---|---|---|
| **Asedio Naval** (principal) | 1 barco contra 1 barco, 3–7 gatos según el casco | 3–5 min | Campaña, botín de piezas, historia |
| **Duelo de Gatos** | 1v1 o 2v2: gatos sobre **balsas o plataformas destructibles**; la vida del gato es el objetivo; pueden dar saltitos cortos (estilo Worms) | 1–2 min | Farmear, eventos, **probar un gato nuevo nada más invocarlo** |
| **Boss** | Un barco o criatura enorme con fases | 6–10 min | Desbloquear elementos e islas |
| **Eventos y retos** | "Húndelo en 3 tiros", "solo fuego", clima extremo, semilla diaria | 1–4 min | Variedad y uso de gatos situacionales |
| **Asalto rápido** | Si tu poder es ≥ 2,5× el del rival, la batalla **se resuelve sola** con una animación resumen de 5 s | 5 s | Filosofía incremental: no castigar con *grind* lo que ya superaste |

### 9.3 Preparación (antes de la batalla)
- **Exploración:** silueta del barco enemigo, sus elementos y su personalidad. Invita a **contra-armar** el equipo (como el *arena counter* de CB).
- **Astillero:** se elige el barco (arquetipo), los módulos se colocan en la rejilla con presupuesto de energía y los gatos se asignan a camarotes. Hay un **botón de prueba** contra un muñeco (UX de Bad Piggies).
- **Equipo:** 3–7 gatos, 1 **reliquia de capitán** (pasiva) y 2 **artefactos** de un uso (equivalen a los *helper items*: kit de reparación, burbuja, bomba de humo, ancla de emergencia).
- **Sinergias posicionales** (heredadas de los héroes 1.16): aura a los vecinos, efectos por fila o columna, reacción cuando cae un vecino.

### 9.4 Flujo de un turno

```
INICIO DE TURNO ─► tick de estados (fuego se propaga, inundación +X%, veneno, plantas crecen)
                 ─► cargas +1, energía +1, comprobación de victoria/hundimiento
      │
MANIOBRA (opcional) ─► A/D mueven el barco con combustible del turno (motor + velas + viento)
      │
SELECCIÓN ─► 1-7 o clic en un gato (o en un cañón del barco). Se ve su tipo de tiro y sus límites.
      │
APUNTADO ─► arrastre tipo honda: dirección + potencia. Vista previa del X% del arco
            (depende del gato y del Mástil). Rueda = zoom, clic derecho = mover cámara.
            Sin temporizador contra la IA (opcional: 30 s en eventos contrarreloj).
      │
DISPARO ─► vuelo con cámara siguiendo ─► ACCIÓN EN VUELO (Espacio): dividir / picar / detonar
      │
IMPACTO ─► hit-stop + daño en rejilla + estados + REACCIONES + pase estructural + trozos
      │
SECUELAS (≤ 3-4 s, Espacio = ×4) ─► botín vuela a la UI, números, "MÓDULO DESTRUIDO"
      │
FIN DE TURNO ─► efectos persistentes (tumbas/enredaderas/torres actúan), escora y hundimiento
              ─► turno de la IA (pensar ~1 s visible + su disparo; se puede acelerar)
```

- **Una acción por turno:** un gato **o** un cañón del barco. Los cañones son la opción "Common fiable" y consumen **energía con coste creciente** (modelo Boom Beach). Destruir módulos enemigos **devuelve energía**.
- **Muerte súbita:** a partir del turno 10 de cada bando llega una **Tormenta**: al final de cada turno los dos barcos se inundan una fila. Así ninguna batalla pasa de unos 14 turnos.

### 9.5 Controles (PC)

| Acción | Ratón | Teclado |
|---|---|---|
| Seleccionar gato o cañón | clic en el gato | 1–7 / Q-E para rotar |
| Apuntar y potencia | arrastrar desde el gato (honda) | flechas ↑↓ ángulo, W/S potencia |
| Disparar | soltar | Enter |
| Acción en vuelo | clic | Espacio |
| Mover el barco | — | A / D (gasta combustible) |
| Ultimate | botón del retrato | F |
| Inspeccionar módulo o vista previa de colapso | pasar el ratón | Tab (vista táctica) |
| Cámara | rueda = zoom, arrastrar con clic derecho = mover | C = recentrar |
| Acelerar o saltar secuelas y turno IA | — | Espacio (mantener = ×4) |
| Accesibilidad | ajustes: sacudida 0–100 %, saltar cortes anime, daltonismo en iconos de estado | — |

**Cámara:** vista táctica con los dos barcos al apuntar; sigue el proyectil con *look-ahead*; zoom de +10 % y sacudida al impactar; *slow-mo* en KO o ultimate. **Nunca paneos forzados que no se puedan saltar.**

### 9.6 Tipos de disparo por elemento
(Gatos de ejemplo tomados de `assets/cats-source`, asignación tentativa.)

| Elemento | Disparo base (trayectoria) | Fuerte contra | Estado que aplica | Acción en vuelo | Gato ejemplo |
|---|---|---|---|---|---|
| 🔥 **Fuego** | Bola **parabólica que rebota 1 vez** y explota | Madera, lona (velas) | **Ardiendo** (DoT; se propaga por material inflamable) | Detonar antes | Brasa, Canelo |
| 💧 **Agua** | **Torpedo**: entra al agua y viaja recto **bajo la línea de flotación** | El casco bajo el agua (provoca **brechas**) | **Mojado** | Subir en geiser | Marina Gel, Abyss Lumi |
| ⚡ **Eléctrico** | **Rayo** casi recto (gravedad ×0,2), preciso, poco daño estructural | Metal, gatos | **Cargado** / **Sobrecarga** en metal | — (instantáneo) | Volt Mecha, Pixel Glitch |
| ❄️ **Hielo** | **3 esquirlas** en abanico | Módulos ya mojados | **Congelado → Quebradizo** | Abrir abanico | Selene Moonlit, Prisma |
| 🪨 **Tierra** | **Roca pesada** (gravedad ×1,6, alcance corto), **perfora 2 capas** | Piedra, quilla, soportes | — (daño puro) | Picar en vertical | Relik |
| 🌪️ **Viento** | **Ráfaga** recta que **empuja** | Escombros, gatos expuestos, velas | **Corriente**: desvía el próximo proyectil enemigo | Cambiar dirección | Nimbus, Nube Dream |
| 🌿 **Naturaleza** | **Semilla** que se planta (tipo Graves) | Estructuras por desgaste | **Enraizado**: las enredaderas dañan y atan al final de cada turno | Echar raíces antes | Micelio, Menta, Cyflora |
| 🌌 **Cósmico** | **Orbe lento con gravedad propia** (curva hacia las masas) | Trozos sueltos | **Ingrávido** (las celdas sueltas flotan) | Crear pozo de gravedad | Astro Nori, Nova Real |
| 🔮 **Magia** | Proyectil **teledirigido suave** | Escudos arcanos | **Maldito** (siguiente daño ×1,5; revela la vida) | Dividir en runas | Dulcera, Ori Prisma |
| 🕳️ **Void** | Proyectil que **atraviesa** materia y **borra** celdas | Todo lo que tenga buffs, escudos o segunda vida | **Vacío** (no se puede reparar) | Implosión | Velo Noctis |

### 9.7 Interacciones elementales sobre módulos
Regla de diseño: **cada elemento tiene un verbo principal y como mucho 2 reacciones de salida**. Las mutaciones de crianza añaden más (como "Conductividad" en CHARLA). Todas las reacciones muestran **icono + nombre + multiplicador**.

| # | Combinación | Reacción | Efecto |
|---|---|---|---|
| 1 | Mojado + ⚡ | **Conducción** | Salta a todas las celdas mojadas conectadas (máx. 6) con ×1,5 y **aturde** a los gatos de esas celdas 1 turno |
| 2 | 🔥 + madera o lona | **Incendio** | Se propaga 1 celda por turno; las velas ardiendo **caen**; se apaga con agua |
| 3 | Mojado + 🔥 (o 🔥 + 💧) | **Vapor** | Apaga el fuego. **Nube de vapor** durante 2 turnos: el rival **pierde la vista previa** si apunta a través de ella |
| 4 | Congelado + 🪨 o cañón | **Estallido** | ×2 al módulo congelado y fragmentos a las celdas vecinas |
| 5 | Mojado + ❄️ | **Mar helado** | El agua alrededor del barco se congela: **no se mueve ni se hunde** ese turno (uso defensivo) |
| 6 | 🌪️ + 🔥 | **Avivar** | El fuego se propaga 2 celdas y hace +50 % de daño |
| 7 | 🌪️ sobre un proyectil enemigo | **Desvío** | La corriente persiste 1 turno y curva el siguiente tiro rival (la IA la tiene en cuenta) |
| 8 | ⚡ + metal (cañón o motor) | **Sobrecarga** | El módulo queda **desactivado 1 turno** |
| 9 | 🪨 o 💧 bajo la línea de flotación | **Brecha** | Abre el compartimento: **inundación** progresiva |
| 10 | 🌌 + trozos sueltos | **Lluvia de escombros** | El pozo de gravedad atrae los trozos y los **lanza** contra el barco |
| 11 | 🔮 + cualquier estado | **Amplificar** | Duplica la duración o potencia del estado presente |
| 12 | 🕳️ + escudo, buff o segunda vida | **Devorar** | Elimina escudos y estados (también sirve para **limpiar** los del rival en tu barco) |
| 13 | 🌿 + Mojado | **Florecer** | Las enredaderas crecen el doble (🔥 las quema: contraataque natural) |

### 9.8 Módulos del barco y efecto al destruirlos

| Módulo | Función viva | Si se destruye | Nota de diseño |
|---|---|---|---|
| **Núcleo arcano** | "Corazón": energía +1 por turno | **Derrota** (o daño masivo en bosses con varios núcleos) | Victoria 1; se protege en el centro |
| **Quilla / cimientos** | **Raíz del soporte** estructural | Todo lo que dependía de ella **se derrumba** (vista previa disponible) | Lo que CB aprendió en la 1.18: refuerza y se puede predecir |
| **Casco** | Estructura + flotabilidad | Por encima de la línea de flotación, abre hueco y ángulo. Por debajo, **brecha → inundación** | Material según nivel (madera → hierro → coral → arcano) |
| **Mamparo** | Separa compartimentos | La inundación se comunica con el compartimento vecino | Decisión de diseño: más mamparos, menos espacio |
| **Mástil / cofa** | **Longitud de la vista previa** + revela la vida de los gatos ocultos + vista previa de colapso | **Pierdes la vista previa larga** (apuntas "a ciegas") | Hace realidad lo de "pierde visión" de CHARLA |
| **Velas** | +combustible con viento a favor | Pierdes movilidad. Si estaban ardiendo, **caen sobre la cubierta** | Inflamables |
| **Motor de marea** | Combustible por turno | **Sin maniobra**; el barco va a la deriva con el viento | Encaja con el arquetipo Sparrow |
| **Cañones** | Acción alternativa (tiro fiable, coste de energía) | Pierdes esa acción | Objetivo de la victoria alternativa en eventos (estilo Pirate Rivals) |
| **Sala de invocación** | Permite **ultimates** e invocaciones | Ultimates **bloqueadas** (o cuestan +1 carga) | Lo de CHARLA: "rompes la sala arcana" |
| **Generador de escudo** | Burbuja que absorbe N daño por turno | Escudo caído durante el resto de la batalla | Débil a la magia y al Void |
| **Camarote de gato** | Protege al gato (cobertura) | El gato queda **expuesto** (recibe ×1,5 directo). Si se rompe el suelo, el gato **cae al agua**, pierde 1 turno y vuelve nadando (momento cómico) | Fuente de momentos "Crush the Castle" |
| **Puente de mando** | Pasiva del **capitán o reliquia** | Pierdes la pasiva | — |
| **Santabárbara (polvorín)** | +25 % de daño de los cañones | **Explota** en radio 3 y prende fuego (también a ti) | Riesgo y recompensa (Shipbreaker) |
| **Despensa / pescadería** | Cura a los gatos +X por turno | Sin curación; suelta **comida como botín** | Conecta con la economía de granjas |
| **Bombas de achique** | −50 % de inundación por turno | Inundación completa | Contra-juego del agua y la tierra |
| **Ancla** | −escora, inmune al empuje del viento | El barco se balancea más (la vista previa tiembla) | Contra-juego del viento |
| **Torre elemental** (ej. Tesla) | +alcance de la cadena eléctrica o bonus del elemento | Pierdes la sinergia | Builds del tipo "barco eléctrico" de CHARLA |

### 9.9 Cómo se ve un *ultimate* (storyboard, ≤ 3,5 s, se puede saltar tras verlo una vez)

| t | Imagen | Audio |
|---|---|---|
| 0,0 s | Pulsas F. La pantalla se oscurece al 60 % y el tiempo baja a ×0,2 | Corte de música, inhalación |
| 0,2–1,1 s | **Corte anime**: banda diagonal con la **forma de batalla** del gato (de la ternura de la isla al modo épico), líneas de velocidad del color de su elemento, glifo del elemento y nombre gigante "**STARFALL**" | Grito o maullido épico + golpe |
| 1,1–1,5 s | Vuelve la cámara, se aleja hasta el objetivo y aparece la retícula | Zumbido creciente |
| 1,5–2,6 s | El efecto: la estrella cae **atravesando 3 pisos**, *hit-stop* de 120 ms, onda expansiva, aberración cromática, géiser, lluvia de escombros | Impacto grave + crujidos |
| 2,6–3,5 s | Secuelas en *slow-mo*: trozos al agua, rótulos "MÓDULO DESTRUIDO ×3", botín volando a la UI | Coro corto + campanitas de botín |

Reglas: una ultimate por turno; necesita la **sala de invocación viva**; su daño está topado en **~30–40 % de la estructura** del barco enemigo (nunca ganar de un tiro desde vida completa, salvo en Asalto rápido).

### 9.10 Gatos rotos con limitaciones

| Arquetipo | Ejemplo (CHARLA) | Poder | Limitación | Contra-juego | Indicador en UI |
|---|---|---|---|---|---|
| **Una bala** | Supernova Cat — *Starfall* | Elige cualquier punto; atraviesa 3 pisos | **1 vez por batalla** | Destruir la sala de invocación antes | Icono "1" que se apaga |
| **Carga** | Singularity Cat | Agujero negro que atrae partes del barco | **2 turnos de carga** visibles para el rival ("CHARGING 1/2") | **Golpear su camarote reinicia la carga** | Barra sobre el gato, aviso al rival |
| **Venganza / berserk** | Vengeance Cat | Rabia ×1,5 / ×2 / ×5 por aliado caído. Cuando queda solo: **BERSERK** (2 acciones por turno) | Necesita que caigan aliados. En berserk pierde un 10 % de vida por turno. | Rematarlo antes; dejar vivos a sus aliados | Contador de rabia en llamas |
| **Doble vida** | Revenant Cat | Revive con un 60 % de vida | Tarda 2 turnos en volver y en la isla produce −30 % de oro | **Void "Devorar"** borra la segunda vida | Fantasmita en el retrato |
| **Escudos** | Bastion Cat | 3 escudos (casi inmortal) | **Cada escudo reduce su precisión** (vista previa más corta y temblorosa) | Multi-impacto (Bomber, esquirlas) y magia | 3 burbujas que se rompen |
| **Cañón de cristal** | — | Daño ×3 | Si su camarote recibe **cualquier golpe**, cae KO | Cualquier tiro preciso | Camarote con brillo rojo |
| **Inestable** | — | Cada disparo es de un **elemento aleatorio** (PRNG con semilla) o se sobrecalienta tras 3 tiros | Imprevisible / 2 turnos de enfriamiento | — | Ruleta de elementos |
| **Posicional** (herencia de CB 1.16) | estilo Sir Rally, Leif, Wolfie | Aura a los vecinos / revive a su fila si mata / se transforma si cae un vecino | Depende del diseño del barco | Romper el camarote vecino o la fila | Resalte de celdas afectadas |
| **Persistente** (herencia de Graves) | Micelio, Luzterna | Planta objetos que **actúan al final de cada turno** | Los objetos se pueden destruir o aplastar | Fuego quema plantas, viento barre linternas | Iconos en el campo |
| **Sacrificio** | — | Destruye su propio camarote para un tiro devastador | Pierdes el módulo y al gato | — | Confirmación con dos clics |

**Regla de presupuesto de poder:** `poder × disponibilidad ≈ constante`. Un tiro de una sola vez puede valer unas 4–5 veces un tiro normal; uno con 2 turnos de carga, unas 2,5 veces. **Todo gato roto debe tener: (1) telegrafía visible, (2) al menos 1 contra-juego, (3) un tope de daño por acción.** Tal como dice CHARLA: un Common fiable (como Cannon Cat) puede ser mejor elección que un Mythic situacional.

### 9.11 Duración objetivo (juego que "se termina en un día")

| Tipo | Turnos por bando | Duración | TTK de referencia |
|---|---|---|---|
| Tutorial | 3–5 | 1–2 min | El enemigo cae en 3–4 tiros |
| Normal | 6–8 | **3–4 min** | ~8–10 tiros "buenos" para hundir un barco de igual nivel |
| Élite | 8–10 | 4–6 min | Requiere combos o ultimates |
| Boss | 10–16 (3 fases) | 6–10 min | Fases al 66 % y 33 % |
| Duelo de gatos | 3–6 | 1–2 min | — |

Cálculo: turno del jugador de unos 18 s (apuntar + secuelas) y turno de la IA de unos 6 s (≈1 s pensando + resolución acelerable). 8 × 18 + 8 × 6 ≈ 3,2 min + 20 s de intro y salida. Si el día de juego son unas 8 h con ~50 % en combate, salen **unas 60–80 batallas en total**. Entonces: **unos 10 bosses**, **unas 40 batallas de campaña** y el resto en eventos, duelos y asaltos rápidos. Para mantener la sensación incremental, **los números crecen pero el TTK se mantiene constante** gracias al escalado enemigo. La sensación de poder viene de **nuevos verbos** (elementos, ultimates, módulos) y de **overkills** visuales en las zonas ya superadas.

### 9.12 Tabla COPIAR / ADAPTAR / EVITAR

| | Qué | De dónde | Cómo en NOLC |
|---|---|---|---|
| ✅ **COPIAR** | Doble condición de victoria (unidades **o** estructura) | Castle Busters | + hundimiento como 3.ª vía |
| ✅ COPIAR | Arrastrar para apuntar con línea de ayuda que "se pone verde" | Castle Busters | Vista previa parcial que depende del Mástil |
| ✅ COPIAR | Cada unidad con un **comportamiento de proyectil único** | CB, Worms, Angry Birds | Un tipo de disparo por elemento + variantes por gato |
| ✅ COPIAR | Abrir líneas de tiro, derrumbar pisos, exponer unidades | Castle Busters | Camarotes con cobertura; gato al agua |
| ✅ COPIAR | Sinergias posicionales (vecinos, fila) | CB 1.16 | Diseño de camarotes como decisión de build |
| ✅ COPIAR | Unidades persistentes que actúan al final del turno | Graves (CB 1.18) | Naturaleza y Spirit |
| ✅ COPIAR | Vida oculta que se revela | CB (Poisoner) | Mástil y Magia revelan |
| ✅ COPIAR | Partidas de pocos minutos | CB, Pocket Tanks | 3–5 min |
| 🔁 **ADAPTAR** | Ruedas + combustible | CB, ShellShock Live | Motor y velas + viento, maniobra corta |
| 🔁 ADAPTAR | Cimientos anti-colapso | CB 1.18 | Quilla y cimientos con **vista previa de colapso** |
| 🔁 ADAPTAR | Forja / cofres / Battle Pass | CB | Taller del barco y botín **por destruir módulos**, sin esperas |
| 🔁 ADAPTAR | Objetos de ayuda | CB | Artefactos de 1 uso |
| 🔁 ADAPTAR | Delay por disparo pesado | Gunbound | Carga visible e interrumpible |
| 🔁 ADAPTAR | Energía con coste creciente | Boom Beach | Cañones del barco; destruir devuelve energía |
| 🔁 ADAPTAR | Salas = sistemas | FTL | Tabla de módulos (§9.8) |
| 🔁 ADAPTAR | Rejilla + conectividad + piezas que se separan | Cosmoteer, Worms Forts | Grafo estructural y trozos de Rapier |
| 🔁 ADAPTAR | Muerte súbita con agua que sube | Worms | Tormenta a partir del turno 10 |
| 🔁 ADAPTAR | Acción a mitad de vuelo | Angry Birds | Espacio: dividir, picar o detonar |
| 🔁 ADAPTAR | Personalidades de IA | Scorched Earth | Capitanes piratas (§7.3) |
| ⛔ **EVITAR** | Temporizadores de entrenamiento y gemas para acelerar | CB | "Esperas o sigues jugando" (CHARLA) |
| ⛔ EVITAR | Unidades premium que deciden partidas | CB | Los gatos rotos se consiguen jugando o criando, siempre con contra-juego |
| ⛔ EVITAR | Colapsos en cadena impredecibles | CB antes de 1.18 | BFS determinista + crujido + vista previa |
| ⛔ EVITAR | Paneos de cámara forzados y animaciones que no se pueden saltar | Quejas de CB | Espacio ×4, ajustes de sacudida |
| ⛔ EVITAR | Anuncios con recompensa, "Loss Offer", reinicio diario | CB | Nada de eso; las misiones son la progresión |
| ⛔ EVITAR | Construir durante la partida (lento) | Worms Forts | Astillero solo fuera del combate |
| ⛔ EVITAR | Simulación de fluidos realista | Floating Sandbox | Flotación analítica por compartimentos |
| ⛔ EVITAR | Hundir el barco por un solo compartimento | Reseñas de Sinking Ships | Inundación gradual por turnos y achique |
| ⛔ EVITAR | Viento demasiado aleatorio o daño con RNG | Género | Viento visible por turno; el daño es determinista |
| ⛔ EVITAR | Física de juntas rompibles como base del gameplay | Riesgo técnico | Física solo para trozos y efectos |
| ⛔ EVITAR | Disparos simultáneos | Agregadores sobre CB / ShellShock all-shot | Turnos alternos claros |

---

## Notas de fiabilidad
- **Dato no público:** la duración exacta del turno en CB, la lista completa de más de 30 unidades, las rarezas formales y las fórmulas de daño. Las guías de fans sobre CB (castlebustersguide.com) **evitan inventar datos**, y he seguido el mismo criterio.
- **Real-time frente a turnos:** el marketing de CB dice "real-time 1v1", pero el App Store dice "turn-based" y las notas oficiales describen turnos alternos. Los sitios que afirman "disparos simultáneos" parecen texto generado automáticamente.
- Reddit (r/CastleBusters) no fue accesible desde mis herramientas. Las opiniones de jugadores salen de las reseñas de Google Play y App Store y de guías que citan hilos de Reddit.
- Las cifras de *2.5 Gamers* (53 % de ingresos por anuncios, 47 ubicaciones, plantilla Habby) vienen del resumen del episodio, no de un dato auditado.

---

## Fuentes

**Castle Busters: oficiales**
- https://castlebusters.com/
- https://castlebusters.com/patch-notes-1-16/
- https://castlebusters.com/patch-notes-1-17/
- https://castlebusters.com/patch-notes-1-18/
- https://play.google.com/store/apps/details?id=com.epicoro.castleclashers
- https://apps.apple.com/us/app/castle-busters/id6746328263
- https://apps.apple.com/us/app/castle-busters/id6746328263?see-all=reviews&platform=iphone
- https://epicoro.com/

**Industria y análisis**
- https://www.gamigion.com/castle-busters-a-new-game-changer-in-the-artillery-shooter-market/
- https://www.gamigion.com/voodoos-new-big-three-castle-busters-marble-sort-sand-loop/
- https://mobidictum.com/voodoo-marble-sort-castle-busteres-midcore/
- https://www.youtube.com/watch?v=YH3SMLjRxUc (2.5 Gamers: "Castle Clashers!: Voodoo's new HIT is scaling hard")
- https://mwm.ai/apps/castle-clashers/6746328263

**Guías, comunidad y vídeos**
- https://castlebustersguide.com/guides/castle-busters-unit-database/
- https://castlebustersguide.com/guides/castle-busters-patch-1-18/
- https://castlebustersguide.com/guides/castle-upgrades/
- https://castlebustersguide.com/guides/wheels-and-helper-items/
- https://castlebustersguide.com/guides/castle-busters-formation/
- https://www.treyexgaming.com/castle-busters-tier-list/
- https://www.treyexgaming.com/castle-busters-beginner-guide/
- https://grindnstrat.com/castle-busters-tier-list/
- https://www.iofreeonline.com/IOS/game/Castle-Clashers.html
- https://iphoneappsarena.com/castle-busters/
- https://castle-clashers.en.uptodown.com/android
- https://www.youtube.com/watch?v=smf1RvREefQ · https://www.youtube.com/watch?v=oQgxgsQi6Fs · https://www.youtube.com/watch?v=yiT8UANyyDU
- https://www.reddit.com/r/CastleBusters/ (no accesible desde la herramienta)

**Nombres parecidos y competidores**
- https://dix.itch.io/castlebusters
- https://castlebusters.org/ · https://taggame.io/castle-busters (poco fiables)
- https://play.google.com/store/apps/details?id=com.ViceAvenueGames.pirateclash (Pirate Rivals)
- https://play.google.com/store/apps/details?id=archery.clash.tournament (Archery Clash!)

**Referentes del género**
- https://en.wikipedia.org/wiki/Scorched_Earth_(video_game)
- https://en.wikipedia.org/wiki/Worms_(series)
- https://en.wikipedia.org/wiki/Worms_Forts:_Under_Siege
- https://strategywiki.org/wiki/Gunbound/Gameplay
- https://en.wikipedia.org/wiki/Pocket_Tanks
- https://en.wikipedia.org/wiki/ShellShock_Live
- https://en.wikipedia.org/wiki/Crush_the_Castle
- https://en.wikipedia.org/wiki/Angry_Birds_(video_game)
- https://en.wikipedia.org/wiki/Bad_Piggies
- https://boombeach.fandom.com/wiki/Gunboat · https://boombeach.fandom.com/wiki/Artillery · https://boombeach.fandom.com/wiki/Barrage
- https://www.pocketgamer.com/battle-bay/rovio-brings-the-real-time-pvp-combat-game-battle-bay-to-ios-and-android/
- https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light · https://ftl.fandom.com/wiki/Systems
- https://cosmoteer.net/ · https://waltdestler.com/cosmoteer.html
- https://github.com/GabrieleGiuseppini/Floating-Sandbox
- https://play.google.com/store/apps/details?id=com.Cochu444.SinkingShipPhysics
- https://plays.org/lux-ahoy/
- https://store.steampowered.com/app/1046300/Pirates_Outlaws/
- https://en.wikipedia.org/wiki/Teardown_(video_game)

**IA**
- Manual de Scorched Earth 1.5 (tipos de IA): https://ia801901.us.archive.org/view_archive.php?archive=/28/items/retrokit-manuals/pc/pc-compressed.zip&file=Scorched%20Earth%20(en).pdf
- https://en.wikipedia.org/wiki/Artillery_game
- https://github.com/a11ce/artillery

**Tecnología**
- https://rapier.rs/docs/user_guides/javascript/serialization/
- https://www.npmjs.com/package/@dimforge/rapier2d-deterministic
- https://box2d.org/posts/2024/08/determinism/
- https://phaser.io/news/2024/12/announcing-phaser-box2d · https://github.com/phaserjs/phaser-box2d
- https://napejs.org/benchmark.html
- https://www.abratabia.com/game-physics/best-web-physics-engine.php
- https://github.com/liabru/matter-js/issues/608
- https://emanueleferonato.com/2013/07/11/box2d-destructible-terrain-demo-using-only-geometry/
- https://love2d.org/forums/viewtopic.php?t=86793&p=227793
