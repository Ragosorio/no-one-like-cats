# 02 — Dragon City: deconstrucción de diseño para NO ONE LIKE CATS

Fecha: 2026-10-03. Juego analizado: *Dragon City* (Socialpoint, 2012–hoy).
Objetivo: entender a fondo cada sistema de Dragon City (DC) con números, para decidir qué copiar, qué
adaptar y qué evitar en NO ONE LIKE CATS (NOLC): gatos, Resonancia, barcos de artillería y la regla
"espera o sigue jugando".

> **Cómo se hizo y límites.** Los datos numéricos salen sobre todo de la Dragon City Wiki (fandom,
> leída con su API), del Centro de Ayuda oficial de Socialpoint (helpshift), de deetlist.com, de
> ditlep.com, de Wikipedia, de una presentación de Socialpoint en SlideShare y de **500 reseñas de la
> App Store de EE. UU.** (las "más útiles"). Varias tablas de la wiki son de versiones anteriores
> (nombres de cultivos, capacidad de hábitats, algunas tablas de daño). Si una cifra puede estar
> desactualizada, lo digo. No pude leer Reddit ni Deconstructor of Fun/GameRefinery en esta sesión
> (se agotó el cupo de búsquedas web). La voz de los jugadores sale de las reseñas de la App Store. El
> tutorial de DC ha cambiado varias veces: la §2.4 es una **reconstrucción** hecha con datos
> verificados (tiempos, costos, niveles), no una transcripción.
>
> **Relación con el simulador.** Ya existe `research/economy-sim/balance.json` (v1.0.0), la fuente de
> verdad del balance. En la §15 comparo cada propuesta con esos valores para no crear números
> paralelos.

---

## 0. Resumen ejecutivo: qué hace funcionar a Dragon City

1. **Un core loop de cuatro piezas encadenadas.** El hábitat produce oro, el oro compra comida, la
   comida sube de nivel al dragón y el dragón con más nivel produce más oro y pelea mejor. Cada
   sistema nuevo (cría, eventos, orbes) se cuelga de ese circuito.
2. **La cría es una lotería que se puede aprender.** La regla "un elemento de cada padre" es fácil de
   entender, pero el resultado exacto es azar. Así nacen el descubrimiento, el conocimiento compartido
   y las calculadoras de la comunidad.
3. **La colección es el motor de largo plazo.** Hay unos 2,215 dragones, un Dragon Book con siluetas
   en gris, colecciones con premio, maestría y skins por logros. Siempre falta uno.
4. **Los eventos reutilizan las acciones del core loop.** Niebla, Torre, Laberinto, Runner, Grid,
   Puzzle y Carrera Heroica se juegan con monedas que se ganan recolectando oro, cosechando,
   alimentando, criando y peleando. Cada evento le da un objetivo nuevo a lo que ya hacías.
5. **La Carrera Heroica es la joya y también el mayor punto de fricción.** Dura 11 días, enfrenta a 8
   jugadores en 27–29 vueltas de 5 nodos, garantiza el premio en la vuelta 15 y tiene vueltas
   cronometradas que dan doble premio. Es adictiva porque usa todos los sistemas a la vez. Frustra
   porque hay que competir contra jugadores que pagan y porque sus "pools" de tareas obligan a
   esperar.
6. **El tiempo y las gemas son el modelo de negocio.** Los timers crecen de 15 segundos a 58 horas
   (y 160 horas en mejoras de hábitat). Las gemas aceleran casi todo y se ganan gratis a ritmo de
   unas 8 al día. Las islas 3 a 16 cuestan de 25 a 1,800 gemas y las ranuras de la incubadora se pagan
   con gemas.
7. **El poder escala por capas que se multiplican**: rareza, nivel, rango (+70%), estrellas de
   Empower (+59%), perks y bonos de arena. A nivel máximo, un Heroico tiene cerca de 4 veces la vida
   y el ataque de un Común, y con rango y estrellas la diferencia llega a ~10x. De ahí vienen el
   *power creep* y la sensación de pay-to-win.
8. **Las mecánicas "rotas" se limitan con reglas, no con números bajos**: enfriamientos de 1 a 4
   turnos, autodaño, probabilidad, "una vez por combate", contramedidas explícitas (el perk Reaper
   contra el perk Phoenix, los golpes múltiples contra los escudos Titán) y prohibiciones por arena.
9. **Los elementos nuevos se presentan como misterio.** El primer dragón Luz (Archangel) apareció
   en 2013 como "elemento desconocido" en un evento, meses antes de que existiera el elemento Luz. Es
   justo la fantasía que quiere NOLC.
10. **Lo que más odian los jugadores**: gemas escasas, anuncios, esperas largas, eventos casi
    imposibles sin pagar, ofertas en ventanas emergentes y depender de amigos para expandirse. **Lo que
    aman**: criar y descubrir, ver crecer a los dragones, la nostalgia y lo relajante que es.

---

## 1. Ficha y contexto

| Dato | Valor |
|---|---|
| Desarrollador / editor | Socialpoint (Barcelona). Hoy es una franquicia de Take-Two |
| Lanzamiento | Facebook, mayo de 2012. iOS en 2013 (1M de usuarios diarios al lanzar). Android en octubre de 2013. Windows en febrero de 2019. Facebook cerró en febrero de 2020 |
| Escala inicial | 6M de usuarios diarios y 25M mensuales en Facebook (2012–13). Socialpoint tenía 44M mensuales en todo su catálogo |
| Contenido actual | ~2,215 dragones; 21–22 elementos; 7 rarezas; nivel máximo de jugador 200 |
| Modelo | Free-to-play: gemas, ofertas, pase de temporada (Divine Pass), islas premium, anuncios con recompensa (Dragon TV) |
| Arquetipo (análisis externo) | "Colección y cría" con monetización tipo gacha en la cría; los grandes pagadores se concentran en eventos competitivos como la Carrera Heroica |

---

## 2. Core loop, meta loop y primeros 30 minutos

### 2.1 Core loop

```
        ┌──────────────── ORO (hábitats) ◄────────────────┐
        │                                                  │
        ▼                                                  │
   GRANJA: plantar (oro) ──► COMIDA ──► ALIMENTAR (4 toques/nivel)
                                              │
                                              ▼
                                   DRAGÓN SUBE DE NIVEL
                     ┌─────────────┬──────────┴──────────┬───────────────┐
                     ▼             ▼                     ▼               ▼
              + oro/min       + HP/ATK, ataques     nivel 4: puede     nivel 7: forma
              (más oro)       nuevos (combate)      CRIAR              adulta (look)
                                    │                     │
                                    ▼                     ▼
                       COMBATE (arena, misiones)   CRÍA → huevo → INCUBADORA
                       gemas, orbes, tokens,       → DRAGÓN NUEVO → Dragon Book
                       comida, rangos                    │
                                    └──────────► MEJORAR / EXPANDIR (oro, gemas, tokens) ─┘
```

**Qué alimenta a qué:**
- Los **hábitats** convierten dragones en oro (fórmula en §4).
- La **granja** convierte oro en comida (y en XP de jugador).
- La **comida** convierte un dragón en un dragón mejor: más oro, más poder, forma adulta.
- La **cría** convierte dos dragones de nivel 4 o más en un tercero, con azar.
- El **combate** convierte dragones fuertes en recursos que la isla no produce: gemas, orbes, tokens
  de hábitat y rangos.
- La **expansión** (terreno, islas) convierte oro o gemas en espacio para más hábitats y granjas.

### 2.2 Bucles por duración de sesión

| Bucle | Duración | Qué hace el jugador |
|---|---|---|
| Micro | 10 s – 2 min | Recoger oro, replantar el cultivo de 30 s, abrir un cofre, alimentar 4 veces |
| Corto | 5 – 15 min | Gastar las 6 cargas de arena, iniciar cría o incubación, avanzar 1 o 2 nodos del evento |
| Diario | Varias entradas al día | Vaciar los hábitats antes de que se llenen, cosechar cultivos de 2 a 12 h, tareas del Divine Pass |
| Semanal | 3 – 11 días | Islas de evento (Niebla 4 d, Torre 3 d, Runner 4 d, Puzzle 5 d, Laberinto 6 d, Grid 7 d), temporada de arena (7 d), Rescate (1 semana) |
| Meta | Semanas o meses | Heroicos (Carrera cada 3–4 semanas), estrellas de Empower (hasta 2,000 orbes), colecciones, islas, nivel máximo (Dragon Roost) |

### 2.3 Meta loop

- **Calendario de eventos superpuestos.** Casi siempre hay 2 o 3 eventos activos y cada uno da su
  propia moneda por las mismas acciones del core loop.
- **Árbol de la Vida** (nivel 11 / 23). Los orbes se consiguen en eventos, arenas, rescates y cofres.
  Con ellos se Invoca un dragón (100 orbes), se Empodera (estrellas) o se Recuerda (sacrificar un
  dragón a cambio de orbes).
- **Gates de nivel.** El nivel máximo de los dragones sube con el Dragon Roost (de 10 a 40) y, para
  subirlo, hay que tener N dragones en el máximo actual. Las estrellas lo llevan hasta 70.
- **Colección**: Dragon Book, Colecciones, Maestría y Equipos de dragones (ver §12).
- **Competencia**: temporadas de arena semanales con reinicio parcial de trofeos, Arena Rush y la
  Carrera Heroica.

### 2.4 Los primeros 30 minutos (reconstrucción)

Datos verificados: la Incubadora es lo primero que se ve en el tutorial y el primer dragón siempre es
Terra. También están verificados los costos, tiempos y niveles de la tabla.

| Min. aprox. | Paso | Qué enseña | Números de DC |
|---|---|---|---|
| 0:00 | Bienvenida de un personaje guía (los Goals usan a Deus, Aurelia, Cortesia, Nefus y Parsival) | Tono y fantasía | — |
| 0:30 | **Incubadora**: eclosiona un huevo **Terra** | Eclosión con animación | 15 s; +50 XP |
| 1:00 | Construir **Hábitat Terra** y poner al dragón | Regla de elemento y hábitat | 100 de oro; 10 s; cabe 2 dragones; tope 500 de oro |
| 1:30 | **Recoger oro** | Ingreso pasivo | Terra Nv1 = 18 oro/min |
| 2:00 | Construir **granja** y plantar el cultivo de 30 s | Oro → comida | Granja 100 de oro. Cultivo: 50 de oro → 5 de comida en 30 s |
| 3:00 | **Alimentar** 4 veces → nivel 2 | Feedback de "ÑAM" y de subida de stats | Nivel 2 = 20 de comida |
| 4:00 | Comprar huevo **Flame** y su hábitat | Segundo elemento | Huevo 100 de oro (30 s); hábitat 150 de oro |
| 6:00 | Subir ambos al **nivel 4** | La comida como recurso | 140 de comida en total por dragón |
| 8:00 | **Montaña de Cría**: Terra + Flame | El híbrido | Resultado posible: Flaming Rock (30 s), Volcano (1 min) o Aztec |
| 10:00 | Eclosiona el primer híbrido; "¡Dragón nuevo!" | Descubrimiento | El Dragon Book pasa de 2 a 3 |
| 12:00 | **Primer combate** guiado | Ventaja de elemento (Terra pega x2 a Flame) | 3 contra 3 por turnos |
| 15:00 | **Nivel 4 del jugador**: se desbloquea Sea | Desbloqueo por nivel | 1,400 XP; Sea eclosiona en 30 s |
| 20:00 | Goals: expandir, construir, completar la colección **New Beginnings** (Terra, Flame, Volcano, Flaming Rock, Sea) | Metas cortas | Premio: Love Dragon, 2 gemas, 500 de oro, 500 de comida, 1,000 XP |
| 25:00 | **Nivel 6**: Nature | El primer timer "real" | Nature eclosiona en **20 min** |
| ~45–60 | **Nivel 10**: Electric | Los timers se alargan | 59,900 XP; Electric eclosiona en 30 min |
| Horas | **Nivel 13**: Ice | **Primer muro de tiempo** | Ice: cría de 9 h y eclosión de 15 h |

**Desbloqueos por nivel de jugador en DC** (wiki y ayuda oficial): Sea 4 · Nature 6 · Maestría 7 ·
granja grande 8 · Electric 10 · Arenas y Árbol de la Vida 11 · Divine Pass 12 · Ice y Kindergarten 13
· Perks 14 · Ultra Breeding Tree 15 · Metal y Alianzas 16 · granja enorme 18 · Arena Rush 19 ·
Training Center y Dragonarium 20 · Dark 22 · Recall, Empower y Wizards' Hollow 23 · Breeding
Sanctuary y Rescate 25 · Light 26 · Ancient World 27 · War 30 · Pure 34 · Legend 38.

**Lectura de diseño.** Los primeros 20 minutos tienen timers de 15 s a 1 min y un desbloqueo cada
pocos minutos: es dopamina pura. Del nivel 6 en adelante los timers pasan a minutos. En el nivel 13
saltan a horas y el jugador se topa con la oferta de gemas. Ese muro es justo lo que NOLC quiere
eliminar.

---

## 3. Islas y expansiones de terreno

### 3.1 Islas

| # | Isla | Costo | Nota |
|---|---|---|---|
| 1 | Main | Inicial | 665 casillas |
| 2 | Lush | 50,000 de oro | La única que se compra con oro |
| 3 | Lava | 25 gemas | |
| 4 | Ivory | 40 gemas | |
| 5 | Desert | 74 gemas | |
| 6 | Skull | 125 gemas | |
| 7–16 | Rainbow, Ice, Gothic, Rune, Future, Moon, Tempest, Jurassic, Chronos, Nestling | 175 → 1,800 gemas | Se agregaron en 2014, 2016 y en el 10.º aniversario. La nueva aparece solo cuando terminas todas las expansiones de la actual |
| Premium | Marvel, Wonder, Mystic, Lustrous, Infinite, Glorious | US$ 9.99 – 29.99 | Compra directa con dinero real |

### 3.2 Expansiones

- Se toca un cartel de "FOR SALE" y se paga. En la tabla actual de la wiki, las primeras 6 son gratis,
  la 7 a la 40 cuestan **250 de oro, pero piden de 1 a 15 "vecinos"** (amigos), y desde la 41 cuestan
  **14.5M de oro + 20 gemas cada una**. Una versión anterior subía el precio de 10,000 en 10,000 de
  oro, desde 5,000 hasta 300,000.
- Las islas nuevas traen obstáculos (rocas, árboles, arbustos). Quitarlos cuesta oro y tiempo, y el
  tiempo se acelera con gemas. Hay descuentos temporales en las expansiones (icono % rojo).
- **Qué desbloquean**: solo **espacio**. Los hábitats pequeños miden 4×4 y los grandes 6×6. Los
  límites de construcción dependen del nivel del jugador: de 2 hábitats en Nv1 a 56 en Nv58 (luego se
  subió a 70 y a 120), y de 1 granja en Nv1 a 17 en Nv175.

**Lectura de diseño.** En DC la expansión no abre mecánicas: son "más cuadritos". Además estuvo
**atada a tener amigos**, algo que las reseñas critican mucho ("no tengo amigos, no puedo comprar
terreno"). En NOLC cada terreno debe abrir algo nuevo (ya está así en `balance.json`).

---

## 4. Hábitats

### 4.1 Reglas

- Un dragón solo vive en un hábitat de **uno de sus elementos**. Un dragón con varios elementos puede
  ir en cualquiera de ellos.
- Hay 20 hábitats elementales, más los de evento (aceptan 4 o 5 elementos y hasta 20–25 dragones), el
  Rainbow y el Divine (aceptan todo), el **Kindergarten** (universal, 5 dragones, que se ven siempre
  como bebés) y el **Dragonarium**, un almacén donde los dragones no producen ni pelean. El
  Dragonarium trae 6 lugares gratis y el resto cuesta de 5 a 50 gemas cada uno (10,520 gemas por
  300).
- **El precio sube con cada copia** del mismo elemento, y los elementos tardíos son más caros.
- Los **Cristales elementales** (se compran con oro) dan **+20% de oro** a cada dragón cercano del
  mismo elemento dentro de un radio que se ve en pantalla.

### 4.2 Fórmula de oro

```
Oro/min (nivel ≤ 10) = StartCoin + AddCoin × (Nivel − 1)
Oro/min (nivel > 10) = StartCoin + AddCoin × (Nivel + 8) / 2   ← cada nivel después del 10 da la mitad
```

| Dragón | Rareza | Start / Add | Nv1 | Nv10 | Nv20 | Nv40 |
|---|---|---|---|---|---|---|
| Sea | Común | 3 / 2 | 3 | 21 | 31 | 51 |
| Flame | Común | 7 / 5 | 7 | 52 | 77 | 127 |
| Terra | Común | 18 / 12 | 18 | 126 | 186 | 306 |
| War | Raro | 16 / 11 | 16 | 115 | 170 | 280 |
| Pure | Épico | 24 / 16 | 24 | 168 | 248 | 408 |
| Legacy (Legend) | Legendario | 32 / 21 | 32 | 221 | 326 | 536 |
| Mythmarvelous | Mítico | 30/min en Nv1 | 30 | — | — | — |
| High Fenrir | Heroico | 33/min en Nv1 | 33 | — | — | — |

**Insight.** La rareza **casi no cambia el oro**: un Heroico produce menos de 2x que Terra. Lo que
multiplica el oro es el **nivel** (×7 hasta Nv10) y la **cantidad de dragones y hábitats**. Por eso
"tener muchos hábitats" es el consejo número uno de las guías.

### 4.3 Capacidad, mejoras y costos (Terra y Flame como ejemplo)

| Nv hábitat | Dragones | Tope de oro Terra | Precio | Tiempo | Tope de oro Flame | Tiempo Flame |
|---|---|---|---|---|---|---|
| 1 | 2 | 500 | 100 de oro | 10 s | 5,000 | 15 s |
| 2 | 4 | 10K | 24K de oro | 30 s | 20K | 2 h |
| 3 | 5 | 50K | 100 tokens | 4 h | 60K | 6 h |
| 4 | 6 | 70K | 150–200 tokens | 16 h | 80K | 18 h |
| 5 | 7 | 80K | 260–350 tokens | 40 h | 90K | 42 h |
| 6 | 8 | 88K | 450–500 tokens | 88 h | 98K | 90 h |
| 7 | 9 | 92K | 700–840 tokens | 160 h | 102K | 162 h |

- Del nivel 3 en adelante hacen falta **tokens del elemento** (16 tipos), que salen de cofres,
  eventos, misiones, calendario y arenas. Mejorar un hábitat a nivel 7 tarda **casi una semana**.
- Los hábitats tardíos guardan más oro: Light 40K→202K, War y Wind 60K→262K, Legend 350K→~760K, Divine
  hasta 800K (nivel 50).

### 4.4 Por qué el jugador los organiza

1. **Elemento**: hay que tener el hábitat correcto, y los dragones con varios elementos permiten
   "mover" dragones para liberar lugar.
2. **Ritmo contra capacidad**: dos Terra de Nv1 llenan un hábitat Terra de Nv1 en **~14 min**; dos Sea
   de Nv1 tardarían **~21 h** en llenar el suyo. Eso crea dos estilos: hábitats de revisión frecuente
   (alta producción y poca capacidad) y hábitats "para la noche" (poca producción y mucha capacidad).
3. **Cristales con radio**: conviene agrupar hábitats del mismo elemento.
4. **Torres Guardianas**: bonos temporales de oro y botón de "recoger todo".
5. **Espacio**: hábitats 4×4 frente a 6×6, islas con formas irregulares y decoraciones.
6. **Truco de XP**: construir y vender hábitats grandes para subir de nivel rápido (Big Nature: 1 de
   oro por XP).

---

## 5. Granjas y comida

### 5.1 Granjas

| Granja | Nv jugador | Costo | Cultivos |
|---|---|---|---|
| Food Farm | 1 | 100 de oro | 30 s, 5 min, 30 min |
| Big Food Farm | 8 | 25,000 de oro | 2 h, 3 h, 6 h |
| Huge Food Farm | 18 | 500,000 de oro | 9 h, 12 h, 24 h |

Cantidad de granjas por nivel: 1 (Nv1–2), 2 (3–4), 3 (5–6), 4 (7–9), 5 (10–12) … 14 (Nv35+), 17
(Nv175). Las **Alianzas** desbloquean cultivos con +10% de comida. El Greenhouse da otro extra
limitado (algunas reseñas dicen que solo funciona 3 h al día).

### 5.2 Cultivos (eficiencia calculada)

| Cultivo (nombre actual) | Tiempo | Oro | Comida | XP | **Comida/min** | **Oro por comida** |
|---|---|---|---|---|---|---|
| Bluebell Flower | 30 s | 50 | 5 | 25 | **10.0** | 10 |
| Chili Pops | 5 min | 250 | 25 | 250 | 5.0 | 10 |
| Berry Parcel | 30 min | 1,000 | 75 | 1,000 | 2.5 | 13 |
| Single-Spear Corn | 2 h | 5,000 | 200 | 5,000 | 1.7 | 25 |
| Lil's Blooms | 6 h | 15,000 | 500 | 15,000 | 1.4 | 30 |
| Rainbow Sprouts | 3 h | 150,000 | 2,250 | 18,750 | 12.5 | 67 |
| Prickly Pods | 9 h | 1M | 10,000 | 100,000 | 18.5 | 100 |
| Venus Plant | 12 h | 3M | 25,000 | 150,000 | 34.7 | 120 |
| Stellar Fruit | 24 h | 20M | 150,000 | 1.25M | 104 | 133 |

**Insights:**
- **Dentro de cada granja, el cultivo más corto da más comida por minuto** (10 contra 1.4). El
  jugador activo que replanta cada 30 s gana más que el que espera. Esto ya es "espera o sigue
  jugando" sin gemas, y conviene copiarlo.
- **Las granjas superiores rompen la curva**: Rainbow y Stellar dan entre 12 y 104 comida/min, pero
  la comida sale **13 veces más cara en oro**. El cuello de botella pasa de la comida al oro.
- Las guías de Carrera Heroica recomiendan **replantar el cultivo de 50 de oro una y otra vez**,
  porque cada cosecha tiene una probabilidad de soltar un objeto del evento. La tarea premia hacer
  clics, no tomar decisiones (evitar).
- Las reseñas se quejan de que la comida es cara y escasa ("75 de comida por 1,000 de oro"). El
  jugador siente la granja como un **impuesto**.

---

## 6. Alimentación y niveles

### 6.1 Curva de comida (siempre **4 alimentaciones por nivel**)

| Nivel | Comida por toque | Para subir ese nivel | Acumulado desde Nv1 |
|---|---|---|---|
| 2 | 5 | 20 | 20 |
| 5 | 30 | 120 | 260 |
| 10 | 65 | 260 | 1,280 |
| 11 | 145 | 580 | 1,860 |
| 20 | 880 | 3,520 | 21,820 |
| 21 | 3,190 | 12,760 | 34,580 |
| 30 | 24,000 | 96,000 | 565,660 |
| 31 | 45,600 | 182,400 | 748,060 |
| 40 | 240,000 | 960,000 | 6.28M |
| 50 | 921,600 | 3.69M | 30.9M |
| 70 | 1.12M | 4.47M | 112.8M |

La curva es lineal por tramos y **salta en los niveles 11, 21, 31 y 41**. El acumulado se multiplica
×17 del Nv10 al 20, ×26 del 20 al 30 y ×11 del 30 al 40.

### 6.2 Qué cambia al subir de nivel

| Cambio | Detalle en DC |
|---|---|
| Stats | HP, daño y velocidad (la velocidad decide quién ataca primero) |
| Oro | +AddCoin por nivel (la mitad desde el Nv10) |
| **Look** | Huevo → bebé → **joven en Nv4** → **adulto en Nv7**. Los Heroicos: joven en Nv10 y adulto en Nv20 |
| Ataques | Se aprenden por nivel (ejemplo: ataques en Nv1, Nv8 y Nv15) y otros se entrenan en el Training Center (Nv15+, de 12 a 48 h) |
| Cría | Disponible desde el Nv4 |
| Skins por logros | "Golden Flame" al subir cualquier Flame a Nv10; "Terra Crush" al criar con Terra 30 veces |
| Recall | Más orbes al sacrificarlo (40 en Nv1, 100 en Nv30+) |
| Tope de nivel | Dragon Roost: 10 → 15 (10K de oro) → 20 (800K) → 25 (3M) → 30 (5M) → 35 (16M) → 40. Cada paso exige tener de 3 a 10 dragones en el tope actual y tarda de 8 a 96 h. Empower lo sube a 45/50/55/60/70 |

### 6.3 XP del jugador

Nv10 = 59,900 · Nv20 = 5.69M · Nv30 = 43.4M · Nv40 = 131M · Nv50 = 268M · Nv100 = 5,000M. Cada nivel
da 1 gema, y algunos (40, 80, 90, 100) dan de 14 a 20.

---

## 7. Crianza (breeding)

### 7.1 Reglas

1. Ambos padres deben tener **nivel 4 o más** y no estar ocupados.
2. **Se toma un elemento de cada padre** y el resultado se elige del grupo de dragones que tienen esos
   elementos. Más elementos en los padres = más combinaciones posibles = un grupo más grande.
3. Solo salen **elementales puros** si ambos padres comparten ese elemento.
4. **Opuestos**: Terra–Metal, Flame–Ice, Sea–War, Nature–Electric, Dark–Light. Los "híbridos raros"
   (por ejemplo Gummy, que es Nature/Electric) exigen que **ambos padres sean híbridos**.
5. Los **Legend** son comodines: aportan cualquier elemento (o varios) y saltan requisitos de nivel.
6. **Pure × Pure** da Pure o Legend. La comunidad midió **~6%** de Legend por intento.
7. Dos dragones **idénticos** tienden a producir otro igual.
8. **El tiempo de cría es casi igual al tiempo de eclosión** del resultado. Acelerar con gemas no
   cambia el resultado.
9. **Factores que SÍ influyen** (ayuda oficial): elementos, **rareza** y **nivel de Empower** de los
   padres, el boost de la Torre de Phaun y los perks de cría (+5% cada uno). El nivel del dragón NO
   influye.

### 7.2 Edificios

| Edificio | Requisito | Costo | Efecto |
|---|---|---|---|
| Breeding Mountain | Inicial | 500 de oro (+150 gemas por −20% de tiempo) | 1 pareja |
| Ultra Breeding Tree | Nv15 | **100 gemas**, 3 h (+150 gemas por −20%) | 2.ª pareja |
| Breeding Sanctuary | Nv25 | **25 gemas**. Se sube de nivel con "pasos" de oro o con 90–280 gemas por nivel | 8 niveles, cada uno con 5 dragones exclusivos. Si el santuario supera por mucho el nivel de un exclusivo, su probabilidad cae casi a 0 |
| Deus Breeding Nest | Jugadores de nivel bajo | — | 3.ª pareja |
| Incubadora | Inicial | Ranuras 2–6: **15 / 30 / 60 / 120 / 240 gemas** | Hasta 6 huevos a la vez |
| Breeding Event Island | Eventos | — | Recetas temporales con probabilidad baja de un dragón de evento; cría de 11 h a 2 d |
| Soulmates (dic. 2024) | — | — | Parejas específicas que producen un dragón exclusivo |

### 7.3 Tiempos de referencia (cría / eclosión)

| Dragón | Rareza | Cría | Eclosión |
|---|---|---|---|
| Terra | Común | 15 s | 15 s |
| Flame / Flaming Rock | Común | 30 s | 30 s |
| Volcano | Común | 1 min | 1 min |
| Nature | Común | 20 min | 20 min |
| Electric | Común | 30 min | 30 min |
| Dark | Raro | 2 h | 2 h |
| Archangel / War | Raro | 5 h | 7 h |
| Star (híbrido) | Raro | 7 h | 9 h |
| Ice / Pure | Común / Épico | 9 h | 15 h |
| Legacy (Legend) | Legendario | 50 h | 58 h |
| Mythmarvelous | Mítico | No se cría | 48 h |
| High Fenrir | Heroico | No se cría | 58 h |

### 7.4 Cómo se comunica la probabilidad

- Desde **"Breeding Reborn" (nov. 2020)**: botón **"Possible Results"** con la lista de resultados
  posibles, y una **barra verde** que muestra cuánto suben las dos rarezas más altas cuando los padres
  son raros o tienen Empower. Algunos exclusivos solo aparecen con padres Empowered.
- Durante la cría hay un **corazón dorado** si sale algo especial (exclusivo o de santuario) y un
  **corazón rojo** si es común. Es una pista anticipada que crea expectativa.
- **No se muestran porcentajes por dragón.** La comunidad los reconstruye (calculadoras de deetlist
  y ditlep, "grupos de dificultad", "Gen I–IV").
- Los paquetes de cartas sí publican probabilidades (por ejemplo 9.09% por huevo) y la ruleta de
  Dragon TV muestra porcentajes. Es transparencia selectiva.
- **Frustraciones en las reseñas**: "no hay una respuesta clara de qué saldrá"; "un huevo tardó 45 h y
  no me avisó antes"; "crié un común y tardó 5 h". Las guías de Carrera dicen que para conseguir un
  objeto de cría hay que intentar **de 30 a 40 veces** Terra+Terra.

### 7.5 Tipos de dragones según cómo se obtienen

Elementales, híbridos (2 elementos), híbridos raros (elementos opuestos), exclusivos de nivel
(10/15/20, que requieren un Legend), exclusivos de Santuario, puros e híbridos puros, Legend (Pure ×
Pure), exclusivos de evento (no se crían: se ganan en islas o carreras, o se invocan con 100–500
orbes), Heroicos (solo en Carrera Heroica), Míticos (desde 2024, más de 150) y familias VIP (Titanes,
Vampiros, Karma, Corruptos, Ascendidos).

---

## 8. Elementos

### 8.1 Lista y desbloqueo por nivel

| Grupo | Elementos (nivel de jugador) |
|---|---|
| Base | Terra 1, Flame 1, Sea 4, Nature 6, Electric 10, Ice 13, Metal 16, Dark 22, Light 26, War 30 |
| Tardíos | Pure 34, Primal ~36, Legend 38, Wind, Time |
| Antiguos (Ancient World, Nv27) | Magic, Chaos, Happy, Dream, Beauty, Soul (más el elemento "Ancient"). Siempre hacen daño normal |

### 8.2 Fortalezas y debilidades (versión actual)

Un ataque fuerte hace ×2 y uno débil hace ×½. Solo cuenta el **primer elemento** del defensor; los
demás elementos del dragón definen qué ataques puede aprender.

| Ataque de… | Hace ×2 contra | Hace ×½ contra |
|---|---|---|
| Terra | Flame, Electric | Metal, War |
| Flame | Nature, Ice | Sea, Terra |
| Sea | Flame, War | Nature, Electric |
| Nature | Sea, Light | Flame, Ice |
| Electric | Sea, Metal | Terra, Light |
| Ice | Nature, War | Flame, Metal |
| Metal | Terra, Ice | Electric, Dark |
| Dark | War, Light | Metal |
| Light | Electric, Dark | Nature |
| War | Terra, Dark | Sea, Ice |
| **Pure** | Wind | Primal |
| **Wind** | Time | Legend |
| **Time** | Legend | Wind |
| **Legend** | Primal | Pure |
| **Primal** | Pure | Time |

**Insight clave:** los 5 elementos tardíos forman **su propio ciclo cerrado** (Pure → Wind → Time →
Legend → Primal → Pure) y no golpean fuerte a los 10 de base, ni al revés. Los antiguos son neutrales.
Así, un elemento nuevo **no deja obsoleta la tabla anterior**: agrega una capa encima. Es un buen
patrón para las expansiones de NOLC.

### 8.3 Cómo fueron apareciendo

| Momento | Cambio |
|---|---|
| 2012 (lanzamiento) | Earth, Fire, Water, Plant, Electric, Ice, Metal, Dark, más Pure y Legend. Ice y Dark eran "elementos bonus" |
| Dic. 2012 | Cambio de nombres: Earth→Terra, Fire→Flame, Water→Sea, Plant→Nature |
| 2012–13 | Evento *Dungeon Island*: el **Archangel**, con un "elemento desconocido", aparece al vencer a Cerberus y Demon. Solo se podía obtener ahí |
| 26 jul. 2013 | **Update "Light and War"**: el elemento desconocido era **Luz**. También llega **War**. Pure pasa a ser un elemento normal y los Legend se vuelven mucho más difíciles |
| ~2015 | **Ancient World**: 6 elementos antiguos, minas, cristales y platino. Es una economía paralela |
| Abr. 2016 | Nueva rareza **Heroica** (High Fenrir) |
| Finales de la década de 2010 | **Primal** (Gaia, Árbol de la Vida) y **Wind** |
| May. 2022 (10.º aniversario) | **Time** y una revisión de la tabla de elementos |
| Feb. 2024 | Nueva rareza **Mítica** |

La tabla original tenía errores (Sea pegaba ×2 a 3 elementos, Dark recibía ×2 de 3, Pure se hacía
×½ a sí mismo) y se corrigió dos veces. Lección: hay que diseñar la tabla pensando que se va a
ampliar.

---

## 9. Rarezas, rangos, orbes, estrellas, habilidades y mecánicas especiales

### 9.1 Rarezas

Común → Raro → Muy raro → Épico → Legendario → **Mítico** (2024) → **Heroico** (2016, el más alto).

**Stats máximos por categoría (wiki, nivel máximo):**

| Categoría | Rareza | HP máx. | ATK máx. |
|---|---|---|---|
| 1 (elementales) | Común/Raro | 68,052 | 16,010 |
| 5 | Épico | 133,252 | 31,353 |
| 5 | Legendario | 193,422 | 45,511 |
| 9 | Legendario | 207,234 | 48,762 |
| 10 | Mítico | 227,953 | 59,330 |
| 11 | Heroico | 267,294 | 58,968 |

Un Heroico tiene ~3.9 veces la vida y ~3.7 veces el ataque de un elemental. Si además se suman rango
(+70%) y Empower (+59%), la brecha llega a **~10x**. Esa es la raíz del *power creep*.

### 9.2 Rangos (por enemigos vencidos)

| Rango | Dragones vencidos | Bono de HP y ATK | Orbes |
|---|---|---|---|
| Bronce I / II / III | 5 / 15 / 35 | +5 / 10 / 15% | +2 cada uno |
| Plata I / II / III | 60 / 90 / 120 | +20 / 25 / 30% | +4 |
| Oro I / II / III | 160 / 200 / 250 | +35 / 40 / 50% | +6 |
| Platino I / II / III | 320 / 400 / 500 | +55 / 60 / 70% | +8 |

Desde 2022 cada rango da orbes. Las **Rank Up Coins** permiten subir de rango sin pelear, pero solo
salen de ofertas y de la Treasure Shop (es un atajo pagado).

### 9.3 Orbes, Invocar, Empower y Recall

- **Orbes**: cada dragón tiene los suyos, de su misma rareza. Salen de cofres, arenas, colecciones,
  islas de evento, el Rescate y del Recall. Los **orbes comodín** (Joker) de la misma rareza cubren
  hasta el 20% del costo. La **Tienda de Orbes** vende orbes por 10–80 gemas y rota cada 12 h. Dentro
  de una alianza se intercambian orbes con "Trade Essence".
- **Invocar**: 100 orbes (Míticos 150, Heroicos nuevos 200, Heroicos VIP 500). El proceso tarda días
  o se salta con gemas.
- **Empower (estrellas)**:

| Estrella | Orbes del paso | Acumulado | Stats | Tope de nivel | Tiempo |
|---|---|---|---|---|---|
| 1★ | 120 | 120 | +12% | 45 | 1× la eclosión |
| 2★ | 200 | 320 | +24% | 50 | 1.25× |
| 3★ | 320 | 640 | +36% | 55 | 1.5× |
| 4★ | 560 | 1,200 | +48% | 60 | 1.75× |
| 5★ | 800 | 2,000 | +59% | 70 | 2× |

  Cada estrella agrega un **aro cosmético** bajo el dragón y mejora sus probabilidades de cría. El
  dragón debe ser adulto.
- **Recall**: "devuelves" al dragón al Dragonverse y te deja sus orbes (40 en Nv1, 100 en Nv30+, más
  todos los orbes de Empower que tenía). Es el sumidero de duplicados: **un duplicado nunca es inútil**.

### 9.4 Habilidades especiales (selección)

Todas tienen **enfriamiento en turnos**. Muchas de las de arena tienen una versión base y una
"entrenada" (12 h).

| Habilidad | Elemento | Efecto | Enfriamiento | Límite incorporado |
|---|---|---|---|---|
| Rock Throw / Meteor Fall | Terra | Golpea de 1 a 5 veces | 3 | Azar; el escudo Titán bloquea el primer golpe |
| Ignition / Explosion | Flame | Más daño | 3 | **Cuesta el 10% de la vida propia** |
| Foam / Wave | Sea | Posible turno extra | 2 (3 si sale) | Probabilidad |
| Root Sap | Nature | Recupera el 40% del daño hecho | 3 | — |
| Electro Switch | Electric | Ataca y cambia de dragón gratis | 2 | Cambio al azar |
| Snow Mirror | Ice | Copia el último ataque rival con más daño | 3 | Depende del rival |
| Nail Fall | Metal | Puede pegar a todos | 4 | Puede fallar objetivos |
| Crazyness / Berserk | Dark | **Más daño cuanto más daño recibió** | 3 | Hay que aguantar golpes |
| Holy Light | Light | Se cura a sí mismo | 4 | No ataca |
| Dragonitarian | Pure | Puede curar a todo el equipo | 4 | No ataca y puede fallar |
| Call for Help | Legend | Lanza una habilidad al azar | 4 | Azar total |
| Divine Sacrifice | Light y otros | Daña a todos y cura a los aliados | 2 | **El usuario pierde 2/3 de su vida** |
| Divine Intervention | Flame y otros | El daño sobrante pasa a otro rival | 2 | Solo si el golpe noquea |
| Atomic Ace | Metal y otros | No se puede esquivar | **0** | Daño moderado |
| Time Steal | Time | Varios golpes y turno extra | 4 | Enfriamiento largo |
| Bunker | Antiguos | Daña y reduce el daño recibido del equipo un 25% durante 3 turnos | 3 | No se acumula con Guard |
| Mythical Ultimatum / Final Ultimatum | Beauty / Terra | Más daño cuanta menos vida le queda | 2–3 | Hay que estar al borde |

### 9.5 Familias con mecánicas pasivas ("rotas con límite")

- **Titanes**: un **escudo que anula el primer ataque** del combate. Además **producen comida**. El
  escudo es de una sola vez: no vuelve al revivir y los ataques de daño 0 no lo rompen. Se contrarresta
  con golpes múltiples, ataques a objetivos al azar (rompen el escudo desde la banca) o turnos extra.
- **Perk Phoenix** (Pro): **revive una vez**. Su contra es el **perk Reaper**, que quita un 3% de la
  vida máxima al dragón que revivió por cada Reaper equipado. Es diseño explícito de contramedida.
- **Karma**: pueden esquivar y, tras absorber un ataque, pegar crítico a cualquier elemento.
- **Vampiros**: roban vida (hasta el 100% del daño); los **Corruptos** roban el 75%.
- **Equipos de dragones**: si tienes 2 o más dragones con la misma habilidad, se activa un bono que
  crece con cada estrella. Vender uno lo rompe.
- **Perks** (Nv14): Básicos (Daño, Vida, Cría +5%; se pueden poner varios), Avanzados y Pro (Phoenix,
  Reaper; muy pocos por dragón). El límite depende de la rareza.
- **Runas**: no encontré un sistema de runas equipables en DC (existe en *Monster Legends*, el otro
  juego de Socialpoint). Su equivalente son los perks.

**Cómo DC equilibra lo "roto"**: enfriamiento, autodaño, azar, "una vez por combate", contramedidas
(Reaper, golpes múltiples, ataques que no se esquivan) y **reglas de arena** (Heroicos prohibidos en
varias arenas, arenas de una sola rareza, elementos obligatorios o potenciados).

---

## 10. Combate

### 10.1 Estructura

- **3 contra 3 por turnos.** Ataca primero el que tiene más velocidad. Cada dragón tiene hasta 4
  ataques: los aprende por nivel o los entrena (12/24/48 h).
- **Cambiar de dragón no gasta el turno.** Hay una tabla de elementos dentro del combate (ícono "?").
  El daño tiene un margen aleatorio.
- **El "PvP" es asíncrono**: el rival lo controla la IA, que usa primero sus ataques fuertes.
- El poder sale de: nivel, rango, estrellas, perks, bonos de arena o temporada y habilidades.

### 10.2 Modos

| Modo | Tipo | Reglas clave | Premios |
|---|---|---|---|
| **Arenas** (Nv11) | PvP asíncrono | **6 cargas** (una cada 30 min; 2.5 h para llenarlas). Trofeos con descenso de arena. ~30 arenas con reglas por elemento o rareza. Temporadas de 7 días con reinicio parcial. "Showdowns" sin enfriamientos | Cofre del Guerrero cada **20 dragones vencidos (cuentan aunque pierdas)**, un dragón por ascenso, premios de temporada. El "Arena Booster" pagado sube las cargas de 6 a 10 |
| **Arena Rush** (Nv19) | Tabla de posiciones | Puntos por KO en ventanas de mar a jue y de vie a lun | Según puesto |
| **Ligas** (formato antiguo) | PvP asíncrono | 3 combates cada 6 h. Vencer a 8 rivales da gemas y recarga los combates | Gemas, oro |
| **Coliseo / Misiones ("Cups")** | PvE | Copas permanentes y de evento con requisitos (dragones, nivel) | Dragones exclusivos, orbes, objetos de colección |
| **Rescate de dragón perdido** (Nv25) | PvE automático **6 contra 6** | Eliges el dragón a rescatar. 15–25 etapas, 1 o 3 jefes de Nv45–60. Llaves (10–35). Cada dragón usado descansa 4–6 h. La vida enemiga no se recupera entre intentos. Dura 1 semana | Hasta 100 orbes del dragón elegido |
| **Batallas amistosas de alianza** | PvP asíncrono | Contra miembros de tu alianza | Oro, comida, XP, rango |
| *Tournament Island* (retirado) | PvP | **Bono de racha**: 3–5 victorias +25% … 26+ victorias +300% | Gemas y dragones por puesto |

### 10.3 Qué se siente bien y qué se siente mal

**Bien:**
- Elegir el elemento correcto y ver el "×2". El combate se vuelve un puzle de tabla.
- Las habilidades con efectos visibles (escudo azul, revivir, golpes múltiples).
- **Progresar aunque pierdas**: los KO cuentan para el cofre y para el rango.
- Dragones de premio por ascender de arena y reglas de arena que cambian el meta cada semana.

**Mal (según reseñas y guías):**
- Rivales con dragones 7 niveles por encima ("no es justo"). Algunos jugadores **evitan subir de
  nivel** a propósito para que el emparejamiento les toque rivales más fáciles.
- "Las Ligas están hechas para hacerte rabiar si no pagas."
- Energía (6 cargas) y enfriamientos de dragón: el juego **te frena justo cuando quieres jugar**.
- El combate es poco visual y de menús. Después de miles de peleas se vuelve rutina.
- Gana quien más multiplicadores acumula, y varios de esos multiplicadores se compran.

---

## 11. Eventos

### 11.1 Carrera Heroica

| Aspecto | Detalle |
|---|---|
| Frecuencia | Una cada **3–4 semanas**. Empieza en jueves y dura **11 días** (algunas 10). Desde 2024 se alterna con **Carreras Míticas** y **Maratones** |
| Rivales | **8 jugadores**, emparejados por nivel de jugador |
| Estructura | **27–29 vueltas × 5 nodos**. Cada nodo tiene 1 o 2 tareas |
| Tareas | Alimentar, recolectar oro, recolectar comida, criar, eclosionar, combates (misiones), combates de liga o arena y misiones temporales |
| **Pool y espera** | Cada tarea tiene un **pool** de objetos disponibles al instante. Cuando se vacía, entra **1 objeto por cada "espera"** (de instantáneo a más de 4 h), y el contador se reinicia con cada objeto recogido. Tiempo mínimo = (objetos requeridos − pool) × espera. **No se acelera con gemas** y el juego **no lo explica** |
| Probabilidad por acción | No toda acción cuenta. Deetlist lista ~1% por recolección de oro, ~10% por comida, alimentación, cría o eclosión, y 100% por combate. Las acciones más "caras" (crías largas, cultivos grandes) tienen más probabilidad |
| Ejemplos | Vuelta 1: alimentar 4, oro 5, comida 4, alimentar 6 (pool 5 + 5 min), 2 combates. Vuelta 5: alimentar 35 (pool 26, espera 7 min ≈ 1 h), 4 combates (mínimo 5 h). Vuelta 29: **15 combates (mínimo 1 d 8 h)** y comida 56 (pool 17, espera 21 min ≈ 13.6 h) |
| Vueltas cronometradas | Las vueltas 6, 9, 16, 17, 19, 20 y 24 dan **doble premio** si se terminan en 8 h |
| Premios | Cofres, gemas y comida desde la vuelta 5. **La vuelta 15 garantiza el Heroico** sin importar tu puesto. Por puesto: 1.º lleva 4 dragones (incluido el top), 2.º–3.º lleva 3 y 4.º–8.º lleva 2 (formato 2026). Hay una **ruleta gratis** que completa una tarea. Los premios se reclaman en un máximo de 7 días |
| Estrategias de la comunidad | Guardar dragones en Nv1 para alimentarlos durante la carrera; repetir el cultivo de 50 de oro; criar Terra+Terra sin parar (de 30 a 40 intentos por objeto); dejar el giro gratis para el combate más largo; poner alarmas para el pool |

**Por qué es adictiva:** usa **todos los sistemas** (tu economía importa), tiene una barra de
progreso con rivales visibles, un umbral seguro (vuelta 15), sprints de doble premio, un premio
exclusivo (el único origen de Heroicos) y se prepara de una carrera a la siguiente.

**Por qué frustra:** pools ocultos que te paran aunque quieras jugar, rivales que pagan o viven en el
juego ("ojalá no te toque gente que vive aquí"), 11 días de exigencia diaria y tareas que premian el
spam de clics. En las reseñas: "se me acabó el reloj atascado en una tarea de comida", "las carreras
son casi imposibles".

### 11.2 Islas de evento y otros

| Evento | Duración típica | Moneda (se gana con acciones del core loop) | Mecánica | Premio | Gancho |
|---|---|---|---|---|---|
| **Fog Island** | 4 días | Monedas de niebla | Cuadrícula cubierta de niebla. Moverse y "revelar" zonas cuesta monedas | Piezas de dragón (**5–8 por dragón**) y cofres | Exploración y ruta óptima |
| **Tower Island** | 3 días | Monedas de torre | Palanca de **1 a 3 movimientos** (los dados de la animación engañan). **Cada giro cuesta más mientras más alto estás**. Catapultas que suben o bajan | Exclusivo en la cima y piezas en el camino | Apuesta y escalada |
| **Maze Island** | 6 días | Hasta 2,000 monedas cada 24 h (12,000 en total) | Cada dragón tiene **su propio camino**. Algunos necesitan **llaves** de dragones anteriores. Hay combates en el camino | Costos de 860 a **23,595** monedas por dragón | Planear y priorizar |
| **Runner Island** | 4 días | "Flight Stamps" por misiones | Corredor lateral de carriles: esquivar rocas y juntar molinetes | Premios por umbral de molinetes. **Revivir cuesta gemas** | Habilidad |
| **Grid Island** | 7 días | Monedas de grid | Moverse por una cuadrícula. **Combates antes de cada dragón**. Retroceder es gratis | Dragones y recompensas | Priorizar |
| **Puzzle Island** | 5 días | Movimientos (misiones con tiempo; gratis cada 4 h) | **Match-3** | Dragones por puntaje | Género casual ajeno |
| **Breeding Event Island** | Variable | — | Receta temporal con probabilidad baja | Dragón de evento | "Una más" |
| **Wizards' Hollow** | Permanente; premio cada 3 días | — | 50 salas con 4 orbes cada una. Si sale un mago, **pierdes todo lo acumulado** | Dragón exclusivo | Arriesgar o retirarse |
| **Dragon Trails** | Limitado | Giros | Ruleta de pasos por un camino. El *Booster* multiplica pasos y premios | Cofres por hitos | Ruleta |
| **Collector's Hunt** | Limitado | — | Misiones de criar, subir, dar rango o Empower a dragones concretos | Premios por hitos | Usa tu colección |
| **Sticker Album** | Limitado | Paquetes | Álbum de estampas con duplicados | Dragones, orbes, skins | Completar (las reseñas se quejan de los duplicados) |
| **Pet** | Limitado | Comida de mascota | Alimentar a una mascota. **Si no completas un nivel a tiempo, se reinicia el nivel** | Mascota permanente | Presión de tiempo |
| **Divine Pass** | Temporadas | Puntos por metas **diarias y semanales** | Pista gratis y pista premium | Dragones Divinos | Hábito diario |
| **Torres Guardianas** | Permanente | — | **Mandar hasta 4 dragones** de ciertos elementos a misiones. A más nivel, más probabilidad de traer una pieza | 9 poderes: +oro, gema gratis, cultivos más rápidos, buff de combate, cría y entrenamiento más cortos, **recoger todo**, eclosión rápida, más rareza al criar | Expedición y calidad de vida |

**Patrón común:**
1. **La moneda del evento sale de las acciones de siempre**: el evento le da otro sentido a lo que ya
   haces.
2. **Tope de moneda por tiempo** (el Laberinto da 2,000 cada 24 h), así no se puede terminar en una
   sola sesión.
3. **Costos que suben** (la Torre) y **cadenas de llaves** (el Laberinto).
4. **Premios por piezas** (5–8 por dragón) y por niveles: siempre se gana algo.
5. **Eventos superpuestos y FOMO**: el dragón "solo está esta semana".

---

## 12. Colección

- **Dragon Book**: los que tienes salen a color y los que no, en gris. Se filtra por rareza, elemento,
  estrellas, rango, origen y si lo tienes o no. Cada ficha dice cómo se consigue (cría, arena,
  tienda, misión, santuario, colección, alianza, orbes, Soulmates…). Tiene ~2,215 entradas.
- **Colecciones**: grupos de 5 a 15 dragones que, al completarse, dan **un dragón exclusivo** más
  gemas, oro, comida y XP. Por ejemplo, *New Beginnings* (5 comunes) da Love Dragon y 2 gemas;
  *Experimenter* (10) da Midas Dragon, 8 gemas y 500K XP.
- **Maestría** (Nv7): metas que dan Master Points y puesto en una tabla.
- **Dragon Points**: puntaje por dragón según categoría y nivel (sin premios).
- **Skins por logros**, **Equipos de dragones** y **Sticker Album**.
- **Lectura**: la colección es "la razón de todo". Cada dragón nuevo completa algo (una colección,
  una maestría o un equipo) y por eso **todos los dragones sirven para algo**, aunque no peleen.

---

## 13. UI/UX y animaciones

### 13.1 Pantallas

Isla (vista principal, varias islas flotantes) · Tienda (hábitats, edificios, decoraciones, dragones)
· Incubadora · Cría · **Pantalla de alimentar** (stats, ataques, rango y estrellas; desde 2020 abre el
Training Center) · Dragon Book (Dragones, Colecciones, Maestría) · Árbol de la Vida (Invocar,
Recordar, Empower, Tienda de Orbes, Intercambio) · Combate (Arenas, Coliseo, Rescate, Alianza) ·
Islas de evento · Alianza · Divine Pass · Ofertas · Almacén · Ajustes (incluye confirmar gastos de
más de 20 gemas).

### 13.2 Momentos de recompensa

| Momento | Cómo se presenta en DC |
|---|---|
| Eclosión | El huevo se agita y se rompe en la Incubadora; aparece la tarjeta "¡Nuevo dragón!" con elemento y rareza |
| Cría | Corazones durante el proceso: **dorado si sale algo especial** y rojo si es común |
| Alimentar | 4 toques, la barra se llena, el dragón come y los stats suben. **Cambio de forma en Nv4 y Nv7** |
| Rango | "You achieved New Rank!" con animación de insignia; después del combate se marca quién subió |
| Empower | Aro permanente en el suelo y estrella en la ficha |
| Colección | Ventana con el dragón de premio |
| Cofres | Apertura con revelación por rareza; las ruletas muestran porcentajes |

### 13.3 Lo que se siente mal en la UI (reseñas)

- **Ventanas emergentes de ofertas al entrar** ("más de 15 anuncios al iniciar, luego el bono
  diario…"), **anuncios** que interrumpen y tiempos de carga largos.
- Mecánicas importantes **sin explicar** (los pools de la Carrera; cuánto tardará un huevo antes de
  criarlo).
- Islas llenas de íconos de eventos que compiten entre sí.

---

## 14. Críticas y cariño de los jugadores

**Muestra**: 500 reseñas "más útiles" de la App Store de EE. UU.: 241 de 5★, 106 de 4★, 66 de 3★, 42
de 2★ y 45 de 1★. Conté palabras clave en las **153 reseñas de 3★ o menos** (una reseña puede caer
en varios temas):

| Tema (≤3★) | Reseñas |
|---|---|
| Gemas escasas o caras | 87 |
| Anuncios | 68 |
| Esperas y timers | 67 |
| Eventos difíciles o con "muro" | 51 |
| Pay-to-win / paywall | 50 |
| Ofertas caras | 45 |
| Cría (lenta o aleatoria) | 43 |
| Comida escasa | 35 |
| Carrera Heroica | 34 |
| Bugs o cuentas perdidas | 34 |
| Arena o PvP injusto | 23 |

**Lo que odian (paráfrasis):**
- "Todo cuesta gemas": acelerar, entrar a eventos, comprar materiales. Y las gemas casi no se
  consiguen gratis.
- **Esperas**: huevos de 24 h o más y crías de 12 h o más. "Es un juego de esperar", "haces una cosa y
  vuelves en días".
- **Eventos amurallados**: muchos premios parecen imposibles sin pagar. Las carreras exigen tanto que
  terminan contra gente que "vive en el juego".
- **Depender de amigos** para comprar terreno o islas.
- **Anuncios** cada pocos minutos y ofertas al iniciar.
- La **comida** es cara y escasa ("comer 3 millones de comida = semanas de grind").
- **Emparejamiento** contra dragones más fuertes.
- Duplicados en las estampas y premios basura.

**Lo que aman:**
- **Criar y descubrir** dragones; la variedad enorme; "ver a tus bebés convertirse en bestias".
- **Nostalgia**: "lo juego desde niño", "jugaba con mis hijos hace 11 años".
- Es **relajante** y sirve "para cuando estás aburrido".
- Los eventos "siempre traen algo nuevo".

**Por qué la gente juega años:**
1. Colección casi infinita y siempre ampliándose.
2. Eventos que rotan cada pocos días.
3. Metas largas (Heroicos, estrellas, colecciones).
4. Rutina corta y de poco estrés (recoger, alimentar, criar).
5. Identidad y apego a "sus" dragones.
6. Comunidad (alianzas, YouTube, calculadoras).

---

## 15. Conclusión aplicada a NO ONE LIKE CATS

### 15.1 COPIAR / ADAPTAR / EVITAR

| # | Sistema de DC | Veredicto | Por qué / cómo en NOLC |
|---|---|---|---|
| 1 | Core loop hábitat → oro → granja → comida → nivel → más oro | **COPIAR** | Es la columna del "Dragon City" que quiere el usuario. Cambia la granja por el **Muelle de Pesca** y la comida por **Pescaditos** |
| 2 | 4 alimentaciones por nivel, cambio de forma en Nv4/Nv7 | **COPIAR** | Feedback de "ÑAM". Cambio de look en hitos (bebé → joven → adulto) y aura en las estrellas altas |
| 3 | Hábitat por elemento, capacidad que sube, precio que crece por copia | **COPIAR** | Ya está en `balance.json` |
| 4 | Ritmo contra capacidad por elemento (Terra rápido, Sea lento y grande) | **ADAPTAR** | Dar a cada elemento una "personalidad económica" (por ejemplo, Agua acumula más y Fuego produce más rápido) para que organizar hábitats sea una decisión |
| 5 | Cristales con radio (+20% al mismo elemento) | **COPIAR** | Una "Fogata" o "Faro" elemental que premia agrupar. Así decorar también es una decisión |
| 6 | Cultivo corto con más comida/min que el largo | **COPIAR** | Es "sigue jugando" puro: el jugador activo gana más por minuto y el ausente gana más por clic |
| 7 | Regla de cría "un elemento de cada padre" | **COPIAR** | Fácil de aprender y genera descubrimiento |
| 8 | Opuestos e híbridos raros que exigen padres híbridos | **COPIAR** | Ejemplo: Fuego + Agua (Vapor) solo con padres híbridos. Es un puzle de descubrimiento |
| 9 | Probabilidades ocultas, Legend al ~6%, de 30 a 40 intentos | **EVITAR** | Mostrar la tabla exacta, "???" con su porcentaje y **pity**. Ya está en `balance.json`: tabla visible y +1% épico por fallo, hasta 15% |
| 10 | Pista anticipada (corazón dorado o rojo) | **COPIAR** | Un color del "portal de Resonancia" que anticipa la rareza; da suspenso sin mentir |
| 11 | Cría e incubación como dos esperas separadas | **ADAPTAR** | Un solo reloj de Resonancia con la revelación al final (`hatch_share_of_time` 0.35 lo divide; mejor mostrarlo como un solo reloj) |
| 12 | Ranuras de incubadora y edificios de cría con gemas | **EVITAR** | Las ranuras extra se ganan jugando (expansiones, jefes). `balance.json` vende una ranura por 40 gemas ganadas: es aceptable porque las gemas no se compran |
| 13 | Orbes por especie + comodín por rareza + duplicado → orbes | **COPIAR** | "Orbes de Alma" y "Orbe Prisma". Un duplicado nunca decepciona |
| 14 | Estrellas: +stats, +tope de nivel y aura | **ADAPTAR** | Cada estrella cambia una mecánica del ataque (ya definido en `cats.stars.unlocks`), no solo números |
| 15 | Recall (sacrificar por orbes) | **ADAPTAR** | "Retiro": el gato se va a la Isla de Retiro (sigue en el Catdex, sin pérdida emocional) y deja sus orbes |
| 16 | Rango por enemigos vencidos, que **cuenta aunque pierdas** | **COPIAR** | Contar módulos destruidos y gatos derrotados. Encaja con "aunque perdí, avancé" |
| 17 | Rank Up Coins de pago | **EVITAR** | — |
| 18 | Habilidades con enfriamiento, autodaño, "una vez por combate" y contramedidas | **COPIAR** | Es exactamente lo que pide la CHARLA: Supernova (1 tiro), Revenant (2.ª vida), Vengeance (más daño cuanto más daño recibió). Diseñar desde el inicio la contra de cada mecánica rota (Phoenix ↔ Reaper) |
| 19 | Escudo Titán (anula el primer impacto) y Phoenix (revive una vez) | **COPIAR** | Escudo Burbuja, gato con 2.ª vida. En un juego de artillería se leen de inmediato |
| 20 | Rareza que multiplica stats (Heroico ~4x) | **EVITAR** | La rareza da complejidad y economía, no fuerza bruta. `balance.json` usa poder base 5.0 → 7.4 (×1.5 máx.). Mantenerlo |
| 21 | Energía de arena (6 cargas), enfriamientos de dragón y Ligas | **EVITAR** | Nada de energía. DC la quita en sus propios "Showdowns", señal de que es fricción |
| 22 | Emparejamiento por nivel que castiga progresar | **EVITAR** | En el capítulo 1 todo es PvE; si llega PvP, emparejar por poder de barco y no castigar subir de nivel |
| 23 | Carrera Heroica: vueltas y nodos con todos los sistemas, umbral garantizado, vueltas cronometradas x2 | **ADAPTAR** | Expedición Heroica **en solitario** de 25–30 min, con nodos que usan isla, Resonancia, pesca y combate. Ver §15.4 |
| 24 | Pools y esperas ocultos y probabilidad por acción en la Carrera | **EVITAR** | Las tareas cuentan acciones con sentido, las metas escalan con tu producción y nada te obliga a quedarte quieto |
| 25 | Islas de evento alimentadas por el core loop | **COPIAR** | Los eventos flash cambian el rendimiento del core loop (Migración de Leviatán: ×15 de comida) |
| 26 | Fog / Tower / Maze / Grid / Runner | **ADAPTAR** | Ver §15.5 |
| 27 | Puzzle (match-3) | **EVITAR** | Rompe la identidad. Sustituirlo por "puzles de demolición" (romper X en 3 tiros) |
| 28 | Wizards' Hollow (arriesgar o retirarse) | **ADAPTAR** | Es la base del **Cat's Gambit**: solo con recursos ganados y con tope por ingreso (ya en `balance.json`) |
| 29 | Torres Guardianas (misiones por elemento que desbloquean poderes) | **COPIAR** | "Faros Guardianes": mandar gatos de ciertos elementos en expedición desbloquea automatizaciones (recoger todo, auto-cosecha). Une colección y calidad de vida |
| 30 | Rescate (elegir un dragón y farmear sus orbes en 15 etapas) | **ADAPTAR** | "Rescate": eliges al gato que quieres subir de estrellas y haces una ruta corta de combates. Sin llaves ni enfriamientos |
| 31 | Dragon Book, colecciones con premio y skins por logros | **COPIAR** | Catdex con siluetas, sets con un gato de premio y skins por hitos ("Canelo Dorado": sube 3 gatos de Fuego a Nv20) |
| 32 | Desbloquear un elemento como misterio (Archangel → Luz) | **COPIAR** | Un jefe o una grieta muestran un gato de "elemento desconocido" antes de que exista en tu mundo |
| 33 | Nuevos elementos en su propio ciclo | **COPIAR** | Magia, Espíritu y Cósmico en un ciclo aparte y neutrales contra los primordiales. Ningún gato viejo queda obsoleto |
| 34 | Expansiones que solo dan espacio, con gemas o amigos | **EVITAR** | Cada terreno abre algo nuevo, se paga solo con oro y nunca exige amigos (ya es así en `balance.json`) |
| 35 | Timers de 9 a 160 h | **EVITAR** | Tope de 25–50 min en el capítulo y todos reducibles jugando |
| 36 | Divine Pass, calendario, bono diario, Dragon TV, ofertas | **EVITAR** | Viola la filosofía. Las misiones nacen del progreso, no del calendario |
| 37 | Mascota que reinicia el nivel si no llegas a tiempo | **EVITAR** | Es castigo por ausencia |
| 38 | Más de 15 monedas (16 tokens, 6 cristales × 10 purezas, monedas de evento) | **EVITAR** | Pocas monedas. `balance.json` tiene 9 y con eso basta. Si hace falta, los Cristales de Elemento cumplen el papel de los tokens |
| 39 | Dragon Roost: subir el tope de nivel exige N dragones en el tope actual | **ADAPTAR** | Es buena idea para ensanchar la colección (obliga a subir varios gatos). Puede convivir con `min(cap, KL+5)` como misión ("sube 3 gatos al tope") |
| 40 | Kindergarten (hábitat universal) y Dragonarium | **ADAPTAR** | Un "Cojín Comunitario" universal que se gana jugando. Almacén gratis e ilimitado |

### 15.2 Cómo se traduce cada sistema a gatos, barcos y "espera o sigue jugando"

| Sistema de DC | En NOLC | Su espera | Cómo se acelera jugando |
|---|---|---|---|
| Hábitat de dragones | Hábitat por elemento (Caja de Cartón → Núcleo Celestial) | Llenado del tope de oro | Momentum (+oro), Banco del Reino, gatos Banquero |
| Granja | Muelle de Pesca (Sardinas → Atún de Nebulosa) | Tiempo de pesca | Ronroneo por cosechas, Bonus de cosecha después de un combate, gatos Granjero |
| Alimentar | Darle Pescaditos al gato (4 por nivel), "Alimentar hasta Nv X" | Ninguna (cuesta comida) | La comida sale de jugar |
| Cría + incubadora | **Resonancia** ("tus gatos se fueron a invocar otro gatito") | 3–60 min | Ronroneo, con +50% si viene de descubrir |
| Combate 3v3 por menús | Asedio naval de artillería con módulos destructibles | — | Es la forma de jugar |
| Arenas y ligas | Capítulo 1: etapas PvE por zona con jefes. Después, un PvP opcional sin energía | — | — |
| Rescate | Ruta de combates para conseguir orbes de un gato elegido | — | — |
| Torres Guardianas | Faros Guardianes (expediciones por elemento) | 15 min / 1 h / 4 h | Ronroneo; los gatos de nivel alto tienen más probabilidad de éxito |
| Tokens de hábitat | Cristales de Elemento (salen de barcos de ese elemento) | — | Combates contra barcos de ese elemento |
| Islas / expansiones | 8 terrenos (Bosque Costero → Atolón Estelar), cada uno abre una mecánica | Despejar el terreno | Ronroneo, gatos Constructor |
| Árbol de la Vida | Altar de Almas (Invocar con orbes, Estrellas, Retiro) | Corta | Ronroneo |
| Carrera Heroica | Expedición Heroica (2 por capítulo) | **Reloj rojo, sagrado** | Solo jugando mejor; no se extiende |
| Islas de evento | Eventos flash (5–20 min) y microeventos (30 s – 3 min) | **Reloj rojo** | — |
| Divine Pass y diarias | Cadenas de misiones de progreso (Capitán, Criador, Explorador) | — | — |

### 15.3 Números propuestos para un capítulo de 4–8 h

El balance ya vive en `research/economy-sim/balance.json`. Estos son los **puntos de referencia que
salen de DC** y lo que sugiero ajustar.

#### A. Reglas de tiempo

| Regla | Valor propuesto | Contraste con DC |
|---|---|---|
| Timer productivo máximo en el capítulo | **≤ 50 min** (`balance.json`: Resonancia 60 min, construcción hasta 50 min, Leviatán 6 h para la noche) | DC: 58 h de eclosión y 160 h de mejora |
| Rendimiento de jugar | **1 minuto jugado debe ahorrar 2–3 minutos de espera.** Una victoria (~2–3 min) debería dar ~4–8 min de Ronroneo a mitad del capítulo. Con la fórmula actual (`base 1.0 × (1 + 0.06×(KL−1)) × (1 + 0.5×(Momentum−1))`), en KL20 una victoria da **~2.1 min** sin Momentum (hasta ~4.3 con Momentum ×3, más 50% si es afín). **Sugerencia**: subir `victory` a 2.0, o `kl_scale` a 0.1, y validar en `sim.py` | DC: jugar no reduce timers; solo las gemas |
| Timers de desafío | Sagrados (ya está) | DC: tampoco se extienden, pero los pools obligan a esperar |
| Ritmo de desbloqueos | Algo nuevo cada **3–5 min** en la primera hora y cada 8–12 min después | DC: cada 1–3 min en los primeros 20 min y después se estira a horas |

#### B. Producción de oro

DC muestra que el oro se multiplica por **nivel × cantidad**, no por rareza (en DC el oro sube de
forma lineal con el nivel). `balance.json` lo vuelve exponencial (×1.16 por nivel, rareza de 0.5 a 3.2
oro/s) y agrega los multiplicadores de hábitat (×1 → ×30), terreno y Momentum para llegar a cientos de
millones por minuto. El margen de rareza (×6.4 entre Común y Mítico) es mayor que en DC (<×2). Eso
está bien: la rareza paga en economía, no en fuerza. Puntos de control **orientativos** para validar
con `sim.py`:

| Tiempo | KL aprox. | Gatos | Oro/min objetivo | Compra típica (10–15 min de ingreso) |
|---|---|---|---|---|
| 0:05 | 2 | 3 | 30 | 60–300 (2.º hábitat, sardinas) |
| 0:30 | 6 | 6 | 300 | 700 (Cesta de Mimbre); 400 (Bosque Costero, ya en `balance.json`) |
| 1:00 | 10 | 10 | 2K | 12K (Torre Rascadora); 7K (Acantilado) |
| 2:00 | 17 | 16 | 30K | 120K (Isla Volcánica) – 220K (Casita de Coral) |
| 3:00 | 24 | 24 | 350K | 2M (Puerto de las Mareas) – 4M (Palacio de Cojines) |
| 4:00 | 30 | 30 | 4M | 35M (Glaciar Bigote) – 70M |
| 5:00 | 37 | 38 | 35M | 600M (Ruinas Arcanas) |
| 6:00 | 43 | 45 | 300M | 1.2B–10B (Santuario Arcano, Arrecife Prismático) |

`balance.json` pone el último terreno (Atolón Estelar) en **160B** en KL40. Con un ingreso de unos
300M/min eso son ~9 h de ingreso. **Hay que verificar en `sim.py`** que el ingreso real en KL40 sea
del orden de 10B/min; si no, ese terreno se vuelve un muro que contradice la filosofía.

#### C. Muelle de pesca

`balance.json` (sardinas 30 s → 24 de comida/min … nebulosa 1 h → 91.7K/min) hace que **cada
cultivo nuevo domine al anterior** en comida por minuto. La lección de DC es dar también un dilema
activo/pasivo **dentro de cada nivel**. Propuesta: sin agregar filas, cada cultivo tiene dos modos.

| Modo | Tiempo | Comida | Para quién |
|---|---|---|---|
| **Red rápida** | 1/3 del tiempo | 45% de la comida (≈ **+35% de comida/min**) | El que está jugando |
| **Red normal** | Tiempo base | 100% | El que sale a pelear o se va |

Más el **Bonus de cosecha** (CHARLA): después de una victoria, ×2 de velocidad de pesca durante 3 min
(×4 si fue perfecta). Así pescar rápido y pelear se refuerzan entre sí.

#### D. Curva de alimentación

En `sim.py`, cada nivel cuesta `6 × 1.27^(Nv−1) × food_mult(rareza)` (1.0 para Común y 2.4 para
Mítico). Comparación de la comida acumulada para un Común:

| Hasta Nv | 5 | 10 | 20 | 30 | 40 | 50 |
|---|---|---|---|---|---|---|
| `balance.json` (Común) | 36 | 169 | 2.1K | 22.7K | 248K | 2.7M |
| Curva "DC comprimida" (×1.32/nivel) | 127 | 698 | 12.1K | 196K | 3.15M | 50.6M |
| DC (referencia) | 260 | 1,280 | 21.8K | 566K | 6.28M | 30.9M |

Lo que importa no es el número absoluto sino **cuántos minutos de pesca cuesta cada nivel**. Eso se
valida en `sim.py`. Dos reglas tomadas de DC:
1. **Dividir cada nivel en 4 "ÑAM"** en la interfaz (aunque el simulador lo modele como un solo
   costo). El ritmo de 4 toques es gran parte del placer.
2. **Los cambios de forma (Nv4 joven, Nv7 adulto) deben llegar en los primeros 10 minutos** de cada
   gato, para que el primer cambio de look llegue rápido.

#### E. Resonancia

| Elemento | Propuesta | Contraste con DC |
|---|---|---|
| Requisito | Ambos padres en Nv4+ (Épico en Nv10+ y Legendario en Nv20+, como en `balance.json`) | DC: Nv4; exclusivos en Nv10/15/20 |
| Tiempos | Común 3 min · Raro 10 · Épico 30 · Legendario 60 (`balance.json`) | DC: 15 s – 58 h |
| Primera Resonancia | Antes del **minuto 8** y con un resultado garantizado de 1–2 min | DC: el primer híbrido sale cerca del min 8–10 y tarda 30 s – 1 min |
| Probabilidades | Tabla visible + "???" con su porcentaje + pity (ya existe) | DC: solo la lista |
| Boost por padres | +2% épico por cada rango de rareza de los padres (ya existe). Agregar **+1% por estrella** de cada padre y mostrarlo como la "barra verde" de DC | DC: rareza y Empower de los padres |
| Pista anticipada | Color del portal: dorado si el resultado es Épico o mejor | Corazón dorado de DC |
| Opuestos | Fuego↔Agua, Naturaleza↔Tormenta, Magia↔Cósmico: sus híbridos raros (Vapor, Rayo Verde, Astral) requieren **padres híbridos** | Híbridos raros de DC |

Ejemplo de la tabla que vería el jugador: Magma (Fuego/Tierra) + Coral (Agua/Naturaleza) → Lodo
32% · Musgo Ígneo 26% · Barro Florido 22% · **Vapor (raro opuesto) 12%** · Ceniza Floral 7% · **???
1%**.

#### F. Estrellas y orbes

| | DC | `balance.json` (Común) | Comentario |
|---|---|---|---|
| Orbes por paso | 120 / 200 / 320 / 560 / 800 | 10 / 20 / 30 / 50 / 80 (`star_orbs_base` × `orb_steps`) | La misma progresión en ~1/10 de escala. Bien para 4–8 h |
| Bono por estrella | +12% de stats | Multiplicador 1.25 → 2.8 | NOLC agrega una mecánica por estrella |
| Tope de nivel | +5 por estrella | `min(cap, KL+5)` | Se puede agregar +2 de tope por estrella como bono |
| Duplicado | Recall: 40–100 orbes | 10–100 orbes por rareza | OK |

#### G. Rangos por KO (nuevo; DC lo comprime bien)

| Rango | Módulos destruidos + gatos derrotados | Bono | Orbes |
|---|---|---|---|
| Bronce I / II / III | 5 / 15 / 30 | +3 / 6 / 9% | +2 |
| Plata I / II / III | 50 / 80 / 120 | +12 / 15 / 18% | +4 |
| Oro I / II / III | 170 / 230 / 300 | +21 / 25 / 30% | +6 |

Con unas 8 piezas por combate (`modules_destroyed_avg`) y 80–120 combates en el capítulo, el gato
principal llega a Oro y los secundarios a Plata. Los bonos son la mitad que en DC para no romper el
balance.

### 15.4 Expedición Heroica (la Carrera Heroica en solitario)

`balance.json` define 2 Heroicas de 25 min con "5 victorias". La lección de DC es que la Carrera
engancha **porque usa todos los sistemas**. Propuesta de 6 nodos y un jefe:

| Nodo | Tarea (metas escaladas a TU producción al empezar) | Sistema | Premio del nodo |
|---|---|---|---|
| 1 | Recolecta oro equivalente a **4 min** de tu ingreso | Isla | Pescaditos |
| 2 | Pesca comida equivalente a **3 min** de tu producción | Muelle | Orbes |
| 3 | Gana **2 combates** con al menos un gato del elemento del evento | Combate | Cristales |
| 4 | Haz **1 Resonancia** con un padre del elemento del evento (Común: 3 min) | Resonancia | Orbe Prisma |
| 5 | Sube **5 niveles** en total a cualquier gato | Alimentar | Gemas |
| 6 | Destruye **15 módulos** | Combate | Planos |
| Jefe | Vence al gato del evento (Raijin, Singular) | Combate | **Gato Mítico** |

- Reloj de **25–30 min, sagrado**.
- **Umbral seguro** (como la vuelta 15 de DC): si completas 5 de los 6 nodos, recibes **orbes del
  Mítico** (30–50% de una invocación).
- **Sprint opcional** (como las vueltas cronometradas): los nodos 1–3 en menos de 8 min dan premio x2.
- **Invitación con preparación**: el evento aparece y tienes hasta 10 min para aceptarlo. El jugador
  puede prepararse antes (llenar hábitats, dejar una Resonancia lista), algo que la comunidad de DC
  valora mucho.

### 15.5 Otros eventos de DC adaptados (flash de 5–20 min y microeventos)

| Evento de DC | En NOLC | Forma | Premio |
|---|---|---|---|
| Fog Island | **Niebla del Arrecife** (al comprar el Arrecife o en un evento flash de 10 min) | Cuadrícula de 6×6 con niebla. Cada combate ganado da 3 brújulas. Revelar cuesta 1 y moverse cuesta 1 | 5 piezas de un gato y un cofre de Planos |
| Tower Island | **Ascenso del Mástil** (8 min) | Movimientos de 1 a 3 (en NOLC, **con el porcentaje visible**). Cada giro cuesta 1 más que el anterior. "Cañones-catapulta" que suben o bajan | Módulo exclusivo en la cima |
| Maze Island | **Corrientes** (persistente dentro de una zona) | Cada gato tiene su ruta. Las llaves salen de rutas anteriores. Combates en el camino | 3–4 gatos raros |
| Grid Island | **Carta Náutica** | Cuadrícula con combates antes de cada premio. Retroceder es gratis | Gato y cristales |
| Runner Island | **Regata** (minijuego de 60–90 s, flechas del teclado) | Esquivar rocas y juntar conchas. **Sin revivir de pago** | Conchas por umbral |
| Breeding Event Island | **Luna de Resonancia** (flash de 15 min) | Receta temporal visible con porcentaje y pity | Gato de luna |
| Wizards' Hollow | **Cofres del Capitán** (parte del Cat's Gambit) | 10 salas con 4 cofres. Un "Cangrejo Ladrón" termina la ronda. Puedes retirarte cuando quieras | Gemas o recursos, con tope por ingreso |
| Torres Guardianas | **Faros Guardianes** | Expediciones por elemento que desbloquean automatizaciones | Recoger todo, auto-cosecha, etc. |

**Cadencia sugerida en el capítulo (≈6 h):**
- Microeventos cada 6–10 min desde el minuto 20, unos 35–40 en total.
- Eventos flash cada ~2 niveles de Reino desde el KL5, unos 8–10 en total (ya en `balance.json`).
- **2 Heroicas**: KL14 (~1:45) y KL37 (~5:00).
- Bandera Negra en KL18.

Se activan por hitos, no por calendario.

### 15.6 Primeros 30 minutos de NOLC (siguiendo el ritmo de DC)

| Min. | Paso | Lo que enseña (como en DC) | Lo que agrega NOLC |
|---|---|---|---|
| 0:00 | Canelo duerme en una caja; un toque y despierta | Bienvenida | Tono cute |
| 0:30 | Recoger oro de la Caja de Cartón (Fuego) | Ingreso pasivo | Animación de monedas con huellas |
| 1:00 | Muelle: Sardinas (30 s) y recoger | Oro → comida | Gato que pesca |
| 2:00 | Alimentar 4 veces → Nv2 ("ÑAM ×4") | Comida → nivel | Números que saltan |
| 3:00 | **Primer combate guiado**: Balsa contra el barco-cangrejo, con Canelo, Gelatino y Brote (los 3 iniciales de `balance.json`) | Apuntar, potencia, destruir módulos | El **WOW**: transformación anime |
| 6:00 | Recompensa: Chatarra + 2 min de Ronroneo + comida suficiente para llevar a Canelo y Brote al Nv4 | "Aunque pierdas, avanzas" | Ronroneo visible en un reloj |
| 8:00 | **Primera Resonancia** (Canelo + Brote: Fuego + Naturaleza, 1–2 min garantizada) | Cría | "Tus gatos se fueron a invocar otro gatito" |
| 9:00 | Combate 2 mientras espera: el reloj baja | **Espera o sigue jugando** | La regla maestra, enseñada jugando |
| 10:00 | Revelación: gato nuevo y Catdex 4/48 | Descubrimiento | Silueta → color |
| 12:00 | Gelatino (Agua) al Nv4 → forma joven | Cambio de look | — |
| 15:00 | Recolectar todo (KL3) + Bosque Costero (400) | Calidad de vida y expansión | Cada terreno abre algo |
| 20:00 | Primer microevento: Pez Dorado (45 s) | Sorpresa | Reloj rojo, sin presión de pago |
| 25:00 | Instalar el primer cañón Mk II | Barco = economía | — |
| 30:00 | Jefe 1 a la vista: Capitán Bigotes Rotos (KL6) → Tierra | Gancho de elemento | "Elemento desconocido" |

### 15.7 Reglas de diseño que salen de este análisis

1. **Toda espera debe tener una forma de acelerarse jugando y una forma de usarse en otra cosa.**
2. **La rareza compra complejidad y economía, no fuerza bruta** (DC demuestra adónde lleva lo
   contrario).
3. **Ninguna tarea debe premiar el spam de clics** (el cultivo de 50 de oro, Terra+Terra 40 veces).
4. **Nada importante puede quedar oculto** (pools, probabilidades, tiempos antes de confirmar).
5. **Cada mecánica rota nace con su contra** (Phoenix ↔ Reaper; escudo ↔ golpes múltiples).
6. **Un elemento nuevo agrega una capa, no reemplaza la anterior** (ciclos separados).
7. **Los duplicados siempre suman** (orbes).
8. **Los eventos son el core loop con otro objetivo**, nunca un minijuego desconectado.
9. **Nunca depender de amigos, anuncios ni calendario.**
10. **Progresar aunque pierdas**: KO, módulos, análisis del jefe y orbes del rival estudiado.

---

## Fuentes

**Dragon City Wiki (fandom), leída con la API de MediaWiki**
- https://dragoncity.fandom.com/wiki/Farms
- https://dragoncity.fandom.com/wiki/Food
- https://dragoncity.fandom.com/wiki/Gold
- https://dragoncity.fandom.com/wiki/Habitat
- https://dragoncity.fandom.com/wiki/Habitat/Upgrades
- https://dragoncity.fandom.com/wiki/Habitat_capacity
- https://dragoncity.fandom.com/wiki/Habitat/Big
- https://dragoncity.fandom.com/wiki/Habitat/Pure
- https://dragoncity.fandom.com/wiki/Habitat/Special
- https://dragoncity.fandom.com/wiki/Element_Tokens
- https://dragoncity.fandom.com/wiki/Experience_Points
- https://dragoncity.fandom.com/wiki/Islands/Buildable
- https://dragoncity.fandom.com/wiki/Breeding
- https://dragoncity.fandom.com/wiki/Breeding/Facts
- https://dragoncity.fandom.com/wiki/Breeding/Chart/Main_Chart
- https://dragoncity.fandom.com/wiki/Breeding_Sanctuary
- https://dragoncity.fandom.com/wiki/Ultra_Breeding_Tree
- https://dragoncity.fandom.com/wiki/Breeding_Mountain
- https://dragoncity.fandom.com/wiki/Hatchery
- https://dragoncity.fandom.com/wiki/Breeding_Event_Island
- https://dragoncity.fandom.com/wiki/Tutorial/Breeding_Legends
- https://dragoncity.fandom.com/wiki/Tutorial/Breeding_Rare_Hybrids
- https://dragoncity.fandom.com/wiki/Elements
- https://dragoncity.fandom.com/wiki/Battle
- https://dragoncity.fandom.com/wiki/Attacks
- https://dragoncity.fandom.com/wiki/Attacks/Special_Skills
- https://dragoncity.fandom.com/wiki/Combat_Strategies
- https://dragoncity.fandom.com/wiki/Arenas
- https://dragoncity.fandom.com/wiki/Leagues
- https://dragoncity.fandom.com/wiki/Quests
- https://dragoncity.fandom.com/wiki/Stadium
- https://dragoncity.fandom.com/wiki/Tournament_Island
- https://dragoncity.fandom.com/wiki/Missing_Dragon_Rescue
- https://dragoncity.fandom.com/wiki/Tree_of_Life
- https://dragoncity.fandom.com/wiki/Tree_of_Life/Empower
- https://dragoncity.fandom.com/wiki/Tree_of_Life/Summon
- https://dragoncity.fandom.com/wiki/Tree_of_Life/Recall
- https://dragoncity.fandom.com/wiki/Tree_of_Life/Orbs_Shop
- https://dragoncity.fandom.com/wiki/Category:Titan
- https://dragoncity.fandom.com/wiki/Perks
- https://dragoncity.fandom.com/wiki/Training_Center
- https://dragoncity.fandom.com/wiki/Dragon_Roost
- https://dragoncity.fandom.com/wiki/Kindergarten
- https://dragoncity.fandom.com/wiki/Dragonarium
- https://dragoncity.fandom.com/wiki/Dragon_Book
- https://dragoncity.fandom.com/wiki/Collections
- https://dragoncity.fandom.com/wiki/Goals
- https://dragoncity.fandom.com/wiki/Gems
- https://dragoncity.fandom.com/wiki/Chest
- https://dragoncity.fandom.com/wiki/Towers
- https://dragoncity.fandom.com/wiki/Wizards%27_Hollow
- https://dragoncity.fandom.com/wiki/Dragon_TV
- https://dragoncity.fandom.com/wiki/Divine_Pass
- https://dragoncity.fandom.com/wiki/Mines
- https://dragoncity.fandom.com/wiki/Version_History
- https://dragoncity.fandom.com/wiki/Terra_Dragon
- https://dragoncity.fandom.com/wiki/Flame_Dragon
- https://dragoncity.fandom.com/wiki/Legacy_Dragon
- https://dragoncity.fandom.com/wiki/High_Fenrir_Dragon
- https://dragoncity.fandom.com/wiki/S-Rank_Dragon
- https://dragoncity.fandom.com/wiki/New_Beginnings_Heroic_Race
- https://dragoncity.fandom.com/wiki/Deep_Space_Heroic_Race/Lap_14
- https://dragoncity.fandom.com/wiki/Storyteller_Dragon_Mythical_Race
- https://dragoncity.fandom.com/wiki/New_Beginnings_Fog_Island
- https://dragoncity.fandom.com/wiki/Reborn_Tower_Island
- https://dragoncity.fandom.com/wiki/Acro_Run_Runner_Island
- https://dragoncity.fandom.com/wiki/Grid_of_Nature_Grid_Island
- https://dragoncity.fandom.com/wiki/Pearls_of_Protection_Puzzle_Island

**Centro de Ayuda oficial de Socialpoint (helpshift)**
- https://socialpoint.helpshift.com/hc/en/7-dragon-city/ (índice; artículos leídos: 635, 4517, 4496, 4519, 4167, 4168, 4169, 4175, 4176, 4177, 4178, 4179, 4180, 4759, 4220, 4221, 4222, 4764, 1941, 1732, 1733, 2416, 4668, 4669, 4670, 1602, 1605, 1607, 1610, 1611, 1734, 4502, 4182, 4204, 4207, 4208, 4211, 4212, 4388, 4206, 4210, 630, 1946, 4228, 625, 1213, 1212, 1622, 1198, 2303, 1131, 2744, 3536, 4223, 4225, 4230, 4234, 4922, 4925, 4960, 4961, 4963, 4995, 4997, 4999, 4192, 4194, 4290, 5045, 5102, 2618, 934, 1197, 758, 628, 633, 634)
- Ejemplos: https://socialpoint.helpshift.com/hc/en/7-dragon-city/faq/4167-how-often-can-i-play-the-heroic-race/ · https://socialpoint.helpshift.com/hc/en/7-dragon-city/faq/4221-how-can-i-boost-my-breeding-chances/ · https://socialpoint.helpshift.com/hc/en/7-dragon-city/faq/1607-what-are-arena-seasons/

**Guías y datos de la comunidad**
- https://www.deetlist.com/dragoncity/events/race/ (pool, espera, probabilidad y vueltas de la Carrera Heroica)
- https://deetlist.com/dragoncity/events/maze/
- https://deetlist.com/dragoncity/events/tower/
- https://deetlist.com/dragoncity/events/fog/
- https://deetlist.com/dragoncity/pages/beginners-guide/
- https://deetlist.com/dragoncity/elements/ (y `?type=Terra` … `?type=Time`)
- https://www.ditlep.com/post/1035/story-teller-heroic-race-guide-%E2%80%93-dragon-city

**Contexto, negocio y jugadores**
- https://en.wikipedia.org/wiki/Dragon_City
- https://www.slideshare.net/slideshow/creating-dc-mobile-28457187/28457187 (Socialpoint, "Creating Dragon City for Mobile")
- https://x.com/DragonCityGame/status/1531230858526437377 (nuevo sistema de rangos, 2022)
- https://dev.to/truongpx396/the-social-games-playbook-2i51 (arquetipo y monetización; fuente secundaria)
- Reseñas de la App Store de EE. UU.: https://itunes.apple.com/us/rss/customerreviews/id=561941526/sortby=mosthelpful/json y `sortby=mostrecent`; ficha: https://apps.apple.com/us/app/dragon-city-mobile/id561941526

**Documentos internos del proyecto**
- `/Users/roor.osorio/Desktop/No one/CHARLA.txt`
- `/Users/roor.osorio/Desktop/No one/research/economy-sim/balance.json`
