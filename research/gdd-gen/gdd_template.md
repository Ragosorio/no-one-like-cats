# NO ONE LIKE CATS — GDD maestro · Capítulo 1 "El Primer Mar"

> **Cute cats. Terrible consequences.**
> Documento de diseño implementable (v1.0, 2026-10-03). Fusiona Dragon City (fuera de combate) + Castle Busters (dentro del combate) + incremental "espera o sigue jugando".
> **Fuentes de verdad:** números de economía → `research/economy-sim/balance.json` (se cita como `balance:clave`; **nunca** se copia un número aquí sin que gane balance.json si difieren) · contenido importable → `research/04-content.json` (generado desde las mismas tablas que este documento) · reglas, flujo y tono → este documento.
> **Leer con:** 01 (gatos), 02 (Dragon City), 03 (Castle Busters), 05 (psicología), 06 (pacing), 07 (juice), 08 (economía), 09 (referencias pop), 10 (arte), `CHARLA.txt` (visión).

**Convenciones**
- Ids en inglés `snake_case`; textos en español latino. Pantalla lógica **1920×1080**.
- **Reloj VERDE** = tiempo productivo (se acelera jugando con Ronroneo, corre offline). **Reloj ROJO** = tiempo de desafío (sagrado: no se pausa, no se extiende, ni con gemas; corre en tiempo de juego).
- **T0–T4** = tiers de recompensa de 07 §4.1. Storyboards (a)–(k) = 07 §5.
- "Interno" = número que usa la simulación de combate; "mostrado" = número que ve el jugador (2.9.8).
- `[POP]` = lugar donde el banco de 09 (`09-referencias-pop.json`) aporta nombres/chistes alternos o cosméticos.

**Índice:** 1. Visión · 2. Sistemas · 3. Roster · 4. Progresión minuto a minuto · 5. Historia · 6. Pantallas y UI · 7. Juice por evento · 8. Hitos de implementación · 9. Decisiones y conflictos · Anexos.

---

## 1. Visión en 1 página

**Fantasía.** Coleccionas gatos místicos que viven tiernos en tu isla; los cruzas ("se fueron a invocar otro gatito") para descubrir especies de otros mundos; los montas en barcos modulares que construyes tú; y en batalla se transforman en su **Battle Form** anime para partir barcos enemigos en pedazos con física. Todo lo que haces en la isla mejora tus gatos; todo lo que haces con tus gatos mejora la isla. Y cada vuelta del círculo es más rápida, más grande y más ridícula.

**Pilares (6)**
1. **Dos juegos, un solo círculo.** La isla (Dragon City) es la economía; el barco y la batalla (Castle Busters) son donde esa economía cobra sentido. Ningún modo es un minijuego: cada uno produce lo que el otro necesita.
2. **Esperas o sigues jugando. Nunca pagas.** Todo reloj verde se acelera jugando (Ronroneo); los relojes rojos son sagrados. Cero anuncios, cero tarjeta, cero energía, cero diarias.
3. **Rareza = complejidad, no fuerza bruta.** Un Común fiable puede ganarle a un Mítico mal usado. Los gatos "rotos" existen, pero con condiciones visibles y contra-juego.
4. **Destrucción legible y espectacular.** Lees el barco (módulos con función), disparas, y la física hace el resto: colapsos predecibles, reacciones elementales, trozos ilustrados que se hunden.
5. **El mundo se descubre.** Empiezas creyendo que existen 3 elementos; terminas con 7 y una silueta de un octavo. "???" en el Catdex, secretos bajo las rocas, rumores, sinergias que se registran al ocurrir.
6. **Cute cats. Terrible consequences.** Contraste cozy ↔ anime, multiverso de estilos (cada gato trae la tinta de su mundo) y humor latino sin filtro.

**El loop maestro**
```
                 🐟 MUELLE DE PESCA ──► PESCADITOS ──► 🐱 ALIMENTAR (nivel = oro + poder + ataque nuevo)
                       ▲                                   │                  │
                       │ Doblones                          ▼                  ▼
   🏝️ HÁBITATS ◄── 🐱 GATOS ◄── ✨ RESONANCIA ◄──────── 🧬 elementos     🚢 BARCO (Mk, módulos, tripulación)
        │  oro         ▲            ▲ (tiempo verde)       ▲                  │
        ▼              │            │                      │                  ▼
   💰 DOBLONES ──► mejoras, expansiones, cultivos, Mk ──────┤          ⚔️ BATALLA (artillería + física)
                       ▲                                   │                  │
                       │                     JEFES ──► elementos nuevos ◄─────┤ chatarra · planos · cristales · orbes
                       │                                                      │ Ronroneo · Momentum · XP de Reino
                       └──────────── todo acelera todo (Momentum, Ronroneo, automatizaciones) ◄┘
```
Loop corto (2–5 min): batalla → botín → acelera un reloj → alimenta/mejora → otra batalla. Loop medio (20–40 min): zona → jefe → elemento nuevo → Resonancias nuevas → barco mejor. Loop largo (capítulo): 6 zonas, 8 expansiones, 54 entradas de Catdex, final con gancho.

**La fusión explícita**

| Viene de **Dragon City** | Viene de **Castle Busters** | Es **nuevo** (NOLC) |
|---|---|---|
| Hábitats por elemento que producen oro con tope; granjas de comida (aquí **Muelle de Pesca**); alimentar 4 veces por nivel (¡ÑAM! x4); cría = **Resonancia**; Catdex con siluetas y sets; orbes por especie + comodín; estrellas; expansiones de terreno que abren cosas; Carrera Heroica (aquí **en solitario**, reloj sagrado); islas de evento → eventos flash; Primordiales (Origin Cats); elemento misterioso que llega por un jefe | Artillería 1v1 por turnos con ángulo y potencia; estructura destructible donde importa qué se rompe; unidades con disparos únicos (aquí: cada gato); doble condición de victoria (estructura o tripulación) + hundimiento; arrastrar para apuntar con vista previa; colapsos y unidades expuestas; partidas cortas | "Espera o sigue jugando" (Ronroneo + Momentum); relojes verde/rojo; el nivel del gato **cambia la mecánica de su ataque** (Nv10/20/30/40); reacciones elementales sobre materiales; barcos con astillero por familias Mk + rejilla editable; **andanada automática** de cañones; Battle Form con filtros; multiverso de estilos; misiones = tutorial + historia; probabilidades 100% visibles con pity; Cat's Gambit honesto; capítulo de un día con final y gancho (NADIE) |

**Duración (balance validado en 08):** activo normal **5 h 24 min** de mediana (P10 5h01 – P90 5h47; con lectura y menús ≈ 5h45–6h, la meta del usuario), optimizador 3h32, casual ~5 días de calendario, idle puro nunca pasa el Jefe 1 ("esperar solo no alcanza; jugar siempre sí").

---

## 2. Sistemas

### 2.0 Monedas y relojes (resumen de 08)

| Moneda (`id`) | Escala | Se gana | Se gasta |
|---|---|---|---|
| 🪙 Doblones (`gold`) | grande | Hábitats (~73%), batallas (~17%), misiones (~11%) | Barco (~48%), expansiones (~19%), hábitats (~23%), cultivos, Gambit |
| 🐟 Pescaditos (`food`) | grande | Muelle de Pesca, misiones, eventos | Alimentar |
| ⏳ Ronroneo (`purr`) | minutos con tope | Jugar (victoria, misión, jefe, especie nueva…) | Acelerar relojes verdes; desborde → oro |
| 🔮 Orbes de Alma (`orbs`, por especie) + 🌈 Orbe Prisma (`prisma`, comodín) | chica | Duplicados, victorias, jefes, misiones, expediciones, sets | Estrellas |
| ⚙️ Chatarra · 📜 Planos · 💠 Cristales por elemento | chica | **Solo combate** (y expediciones) | Mk del barco, hábitats tier 5+ |
| 👁️ Ojos de Gato (`gems`) | escasa (~150/capítulo) | Contenido: jefes, Catdex, hitos, eventos, secretos | Comodidades, saltar verdes, Prisma, cosméticos, Gambit |

No son monedas: XP de Reino, Momentum, Análisis del jefe, cargas del Gambit. Números grandes con `balance:notation` (completo < 10,000; luego 3 cifras + K/M/B/T/Qa…; tooltip con el número completo y "B = mil millones").

**Relojes.** Verde: cultivo, construcción, astillero, Resonancia, expedición, reparación, limpieza de expansión (máx. nominal `balance:timer_rules.max_nominal_productive_s` = 45 min; excepción: Banquete del Leviatán 6 h). Rojo: microeventos, flash, heroicas, Bandera Negra, Barco del Vacío. El color es **absoluto** en toda la UI (icono reloj de arena verde vs reloj con rayo rojo).

### 2.1 Isla, hábitats y oro

**Propósito:** el motor pasivo (la parte Dragon City) y el escenario donde viven los gatos.

**Reglas**
- Isla isométrica 2:1 (tiles 128×64, rejilla 44×44, `island/terrain.ts`). Región inicial `home` + 8 expansiones (2.16) con su bioma. Cada región tiene **parcelas** predefinidas: hábitat 2×2 tiles, granja 2×2; edificios fijos: Santuario de Resonancia 3×3, Astillero/Puerto de combate 3×3 (costa), Muelle de Pesca (costa), Altar de Almas 2×2 (tras K12), Mesa del Gato (Gambit, tras Jefe 1) 2×2, Banco del Reino 2×2 (KL15), Faro (nivel de Reino).
- Parcelas de hábitat: `balance:habitats.plots_start` (3) + `expansions[].hab_plots`. Inicio: Fuego y Agua tier 1 construidos (`balance:start.habitats`), 1 parcela libre (Brote no tiene casa → misión K03).
- Construir un hábitat nuevo: costo `new_habitat_cost_base · new_habitat_cost_growth^(H−1)` (H = hábitats actuales); al construir eliges su elemento entre los descubiertos. Un gato solo vive en un hábitat de **uno de sus elementos** (`balance:habitats.element_rule`). Gato sin casa = no produce (icono de caja vacía y cara triste).
- Tiers 1–8 (`balance:habitats.tiers`: Caja de Cartón → Núcleo Celestial): capacidad, multiplicador, **búfer** (minutos de producción que guarda antes de llenarse: 30–120), costo, cristales del elemento (tier 5+), tiempo de obra (verde).
- **Producción:** `oro/s del hábitat = Σ oro_gato · mult_tier · (1 + 0.25·banqueros) · global`; `oro_gato = gold_base_per_s[rareza] · 1.16^(nivel−1) · mult_estrella`; `global = (1 + (0.02 + bonus Arrecife)·especies) · (1 + bonos de oro de expansiones) · (1 + 0.5·(Momentum−1))`. Vapor Ronin produce x0.7 (CHARLA, no simulado).
- Al llenarse el búfer: deja de acumular, el hábitat muestra "LLENO" y un gato dormido encima. Recolectar = tap (T0, monedas vuelan al contador, storyboard h). KL3: Recolectar todo. KL15: Banco del Reino (auto-depósito, offline 2 h, +2 h con el Puerto).
- **Vida en la isla:** los gatos caminan por su región, duermen en cajas, persiguen ovillos, se pelean (2 gatos chocan → nube de polvo cómica 1 s), comen en el comedero; animados "en 2s" (bob, squash, saltitos). Crecen visualmente con el nivel: escala 0.85 (Nv1) → 1.0 (Nv50), aura suave en Nv10, marca elemental (decal) en Nv20, aura doble en Nv30, partículas permanentes en Nv40.
- **Decoraciones** (cosméticas, solo gemas 20–80): faroles, fogatas, buzones de gato; sin efecto económico.

**UI:** HUD de isla (6.2), panel de hábitat (tier, gatos, oro/s, búfer con barra, botón mejorar con costo y tiempo verde).
**Interacción:** gatos (nivel, rareza, oficio Banquero) → oro → todo lo demás. Momentum de batalla sube el oro de hábitats.
**Desbloqueo:** inicio; tiers por Reino.

### 2.2 Muelle de Pesca (granjas) y comida

**Propósito:** el puente oro → gato (la comida cuesta oro, como en DC).

**Reglas**
- Parcelas de pesca: `balance:farms.plots_start` (2) + `expansions[].farm_plots`. Cada parcela: elegir cultivo (`balance:farms.crops`, 8: Sardinas Diminutas 30 s → Atún de Nebulosa), pagar su costo en Doblones, esperar (verde), cosechar (tap, T1, ¡SPLASH!).
- Nivel de parcela 1–15 (`balance:farms.upgrade`): rendimiento x1.3 por nivel, costo `150·3^(nivel−1)`, obra verde `20·1.45^(nivel−1)` s.
- Comida total = `food · 1.3^(nivel−1) · (1 + bonos de comida de expansiones + 0.2·granjeros)`. Velocidad x(1 + 0.5·(Momentum−1)) — se muestra como **"🔥 BONUS DE COSECHA"** cuando Momentum > 1 (la idea de la CHARLA: "voy a jugar otra partida antes de cosechar").
- Automatización: KL9 repetir receta (re-siembra la mejor desbloqueada), KL21 **Mar de Pescados Automático** (auto-cosecha al Silo).
- **El muelle evoluciona visualmente** con el mejor cultivo desbloqueado: caña de pescar → red → banco de peces → estanque de salmón → granja de hielo (Glaciar) → pesca abisal nocturna con faroles → ballena-banquete → **Océano Cósmico** (los gatos pescan organismos espaciales; Atolón Estelar).
- La comida **no se pudre** (05 regla 5).

**UI:** panel de muelle (parcelas con reloj verde, botón cosechar/repetir, selector de cultivo con comida/min y comida por clic para decidir activo vs ausente).
**Desbloqueo:** inicio (misión H03); cultivos por Reino.

### 2.3 Alimentar y niveles (el nivel cambia el ataque)

**Reglas**
- Costo del nivel: `feed_cost_base · feed_cost_growth^(nivel−1) · food_mult[rareza]` (`balance:cats`). La UI lo divide en **4 ¡ÑAM!** por nivel (cada bocado = 1/4; storyboard i): tap = 1 bocado, mantener = bocados en cadena con pitch ascendente.
- Tope de nivel del gato = `min(50, Reino + 5)` (`balance:cats.level_cap_formula`).
- Subir de nivel: +16% oro del gato, +7% poder (`gold_per_level`, `power_per_level`), XP de Reino (`xp_rewards_pct_of_bar.cat_level_up`).
- **Umbrales que cambian el ataque** (por elemento del disparo; se ven en el panel del gato como "en 2 niveles: ¡su bola EXPLOTA!"):

{{TABLE:levels}}

- Además, cada gato tiene **★3 (efecto secundario)** y **★5 (pasiva de maestría)** propios (3. Roster) y ★4 cambia el VFX del ataque y su grito gana sufijo ("HAIRBALL IGNITION — KAI!!"), ★6 = Forma Ascendida (corona/halo, paleta invertida en el ultimate; T4).
- KL6 Alimentar hasta Nv X (barrido 15→16→17…, intermedios T0, último T1/T2). KL28 Auto-alimentar por hábitat.

### 2.4 Elementos

**Lista final del Cap. 1 y orden de descubrimiento** (= `balance:elements`; decisión documentada en 9): 🔥 Fuego, 💧 Agua, 🌿 Naturaleza (inicio) → 🪨 Tierra (Jefe 1) → ⚡ Tormenta (Jefe 2) → ✨ Magia (Reino 24, Heraldo del Arcanista) → 🌌 Cósmico (Jefe 5) → 🕳️ Vacío (solo teaser, Cap. 2). El **hielo no es elemento**: es la reacción Ventisca (Mojado + ráfaga ⚡). El Espíritu queda para un capítulo futuro (rumor en la Marea Fantasma).

Regla de diseño (06 §3.1): cada elemento nuevo trae (1) un estado/interacción física nueva, (2) hábitat y cristal nuevos, (3) Resonancias nuevas. Antes de descubrirlo, los enemigos que lo usan muestran su icono como **"???" con glitch** (Zona 4 antes del Reino 24, Zona 5 antes del Jefe 5).

{{TABLE:elements}}

**Afinidad gato-contra-gato** (y contra escudos elementales; solo cuenta el elemento PRIMARIO del defensor): ciclo de cinco **🔥 > 🌿 > 🪨 > ⚡ > 💧 > 🔥** (fuerte x1.5, débil x0.75) y par opuesto **✨ ⇄ 🌌** (x1.5 mutuo, neutros contra los cinco: un elemento nuevo agrega una capa, no reemplaza la anterior). El atacante usa el elemento de SU DISPARO. UI: "¡SÚPER EFECTIVO! x1.5" / "poco efectivo…".

**Materiales** (la estructura usa materiales, no afinidad; multiplicador por elemento del disparo):

{{TABLE:materials}}

Multiplicador combinado (afinidad × material × estados) acotado a **[x0.5, x3.0]**.

**Estados de celda / módulo:**

{{TABLE:statuses}}

**Estados visibles sobre los GATOS** (feedback del usuario: se tienen que ver): el gato hereda los estados aplicables de las celdas de su camarote al resolverse cada impacto, y los recibe directo si está Expuesto o flotando.

{{TABLE:cat_statuses}}

**Reacciones elementales** (cada una se registra la primera vez en el **Grimorio de Sinergias** con "¡SINERGIA DESCUBIERTA!", T2; icono + nombre + multiplicador siempre visibles):

{{TABLE:reactions}}

### 2.5 Gatos

**Ficha de cada gato** (todo en `04-content.json → cats[]`): especie (id de balance), nombre propio editable, elementos (1–3), rareza, rol de combate, oficio (económico, de balance), rasgo, mutación (0–1), nivel, estrellas, orbes, historia de obtención ("Momentos").

**Stats de economía** (balance): `oro base/s` por rareza (Común 0.5 → Mítico 3.2, x6.4: **la rareza paga en economía**), `poder base` (5.0 → 7.4, solo x1.48), `food_mult` (1.0 → 2.4), orbes por duplicado y por estrella.

**Stats de combate** (contenido): `vida = roles[rol].hp × catShare` (catShare 2.9.8), `recarga` en turnos tras disparar (Común 0 · Raro 1 · Épico 1 · Legendario 2 · Mítico 2, salvo excepción), **disparo normal** (arquetipo del elemento + daño interno + radio + proyectiles + rebotes + perforación + estado), **ultimate** (medidor 100, ver 2.9.4), **limitación** (los "rotos"), **pasiva** (siempre activa), ★3, ★5.

**Roles:** Artillero (100 vida), Demoledor (95), Francotirador (80), Asediador (90), Soporte (90), Tanque (150), Controlador (85), Invocador (85).

**Rareza ≠ poder bruto.** Común = disparo simple y fiable cada turno. Raro = un giro (multidisparo, marca, retardo). Épico = poder alto + limitación fuerte (los arquetipos rotos de la CHARLA). Legendario (Primordial) = firma de su elemento + aura +10% para su elemento. Mítico = absurdo + condición dura. Regla de presupuesto (03 §9.10): `poder × disponibilidad ≈ constante`; todo roto tiene (1) telegrafía visible, (2) contra-juego, (3) tope por acción.

**Los rotos de la CHARLA, todos presentes:** UNA BALA (Supernova — Starfall 1 vez por batalla, atraviesa 3 pisos), SEGUNDA VIDA (Vapor Ronin — revive 60%, −30% oro), VENGANZA/BERSERK (Rencor — x1.5/x2/x5 por aliado caído, solo = 2 acciones por turno), 3 ESCUDOS (Bastión — cada escudo baja su precisión), CARGA 2 TURNOS (Singularidad — "SINGULARITY CHARGING 1/2", "¡MATEN A ESE YA!"), CAÑÓN DE CRISTAL (Plasmín), INESTABLE (Pixel Glitch, Canelo Infernal), CARGA (Meteoro), retardo (Merlina, Nebulosa).

**Estrellas y orbes** (`balance:cats.stars`, `rarities.star_orbs_base`): ★2 (Nv10) +stats · ★3 (Nv20) efecto secundario · ★4 (Nv30) el ataque cambia visualmente · ★5 (Nv40) pasiva de maestría · ★6 (Nv50) Forma Ascendida. Se sube en el **Altar de Almas** (storyboard g). Duplicado → orbes (nunca decepciona: "¡ME FALTABAN 35!"). Orbes de especies que aún no tienes se **guardan** y su ficha pasa a "Rumor". Prisma = comodín.

**Rasgos** (uno por gato al nacer: 70% el de su especie, 30% aleatorio; heredable desde KL30). Solo efectos de combate:

{{TABLE:traits}}

**Mutaciones** (desde KL20, 8% por Resonancia, x2 si ambos padres viven en el mismo hábitat; el elemento del hábitat sesga cuál sale — así "la ciudad participa en cómo evolucionan tus gatos" y la variante *Scorched* de la CHARLA existe). Solo combate:

{{TABLE:mutations}}

**Gatos trabajadores (KL24, `balance:cats.workers`):** Banquero +25% oro de su hábitat (máx. 4), Granjero +20% comida (máx. 3), Constructor −20% obra (máx. 2), Viajero +50% expediciones (máx. 2). Siguen produciendo en su hábitat pero **no suben al barco** mientras trabajan: "necesito a este gato para mi build… pero está acelerando una obra de 2 horas". Cambiar de puesto: 60 s de espera (0 con el set "Gatos de Oficio").

**Retiro** (opcional, DC Recall adaptado): no hay. Un gato nunca se pierde; los duplicados ya son orbes.

### 2.6 Resonancia ("tus gatos se fueron a invocar otro gatito")

**Propósito:** cría/colección: la fuente de especies nuevas, con probabilidades honestas.

**Reglas** (espejo exacto de `balance:resonance` y `sim.py`)
1. Eliges 2 gatos (no pueden estar en el barco activo en batalla; sí pueden ser trabajadores). U = unión de sus elementos descubiertos; compartidos = intersección.
2. Candidatos: **Comunes** con elemento ⊆ U · **Raros** cuyo par ⊆ U · **Épicos** cuyo par ⊆ U si ambos padres ≥ Nv15 · **Legendario (Primordial)** del elemento que ambos COMPARTEN si ambos ≥ Nv20 · **Míticos nunca** (solo Heroicas).
3. Pesos de bucket: Común 55 · Raro 30 · Épico 11 · Legendario 3.5 · Secreto 0.5; +2 Épico y +0.5 Legendario por cada rango de rareza de los padres (Común 0 … Mítico 4); **pity** +1 Épico por intento sin Épico+ (tope +15, se reinicia). Cada bucket se reparte en partes iguales; los vacíos se redistribuyen.
4. **Bucket "???"** (0.5%): especies Épicas/Legendarias de Resonancia que aún no tienes cuyos elementos conoces + **gatos secretos** cuya condición cumple esta pareja. Se muestra como UNA fila "??? x%". Pity secreto (diseño, no simulado): +0.5 puntos por intento fallido que cumplía la condición, tope 5%.
5. **Duración** por rareza del RESULTADO (`balance:rarities.resonance_time_s`: 3/10/30/45 min). Un solo reloj verde con dos fases: "Resonando" (65%) y "Eclosionando" (35% = `hatch_share_of_time`); al empezar la 2.ª fase el portal se tiñe del color de la rareza (pista honesta: dorado = Épico o más).
6. **Primera Resonancia** (`balance:timer_rules.tutorial_first_resonance`): Canelo + Brote, 90 s, resultado garantizado **Pimentón (Raro)** (de las dos opciones que permite balance se elige la ≥ Raro: "el primer resultado de cada sistema es bueno").
7. Ranuras: 1 + Isla Volcánica + Ruinas Arcanas (+1 por 40 gemas). KL18: Cola de 3 parejas por ranura.
8. Mutación (KL20) y herencia de rasgo (KL30) / Eco Paterno (KL35) como en 2.5. Duplicado con mutación: eliges orbes o transferir la mutación.
9. Ronroneo afín: los descubrimientos (especie nueva, set) aceleran +50% la Resonancia.

**UI (pantalla Santuario, ORQUÍDEA REAL):** 2 cojines donde arrastras gatos → tabla viva con silueta, nombre (o "???" si no lo has visto), rareza y % de cada resultado, fila "???", rango de tiempo, condiciones que faltan ("Vapor Ronin: requiere ambos Nv15 — te faltan 3 niveles en Gelatino"), botón **¡A RESONAR!** y copy aleatorio:
> "{A} y {B} se fueron a invocar otro gatito. Regresan en {t}. No toques la puerta." · "{A} y {B} se fueron a hacer quién sabe qué…" · "Proceso sagrado en curso. Y privado. MUY privado."

**Revelación** (storyboard a, T3; T4 si es Mítico/Primordial/secreto/primer gato de un elemento): silueta → sellos de elemento → rareza (la imprenta cambia de calidad) → nombre con copy ("¡PUTA MADRE, MIRA LO QUE TE SALIÓ!" en Épico+, versión Familiar en 6.11) → chips de rol/rasgo/mutación → la carta vuela a su hueco del Catdex ("13/54").

**Ejemplos reales de tabla** (calculados con las reglas de balance; la tabla completa por par de elementos está en 3.3):

{{TABLE:recipes_examples}}

**Gatos secretos ("???")** — 6, todos con dos rutas (una de suerte con pista, una fija):

{{TABLE:secrets}}

### 2.7 Catdex

**Niveles de cada entrada** (05 regla 22):
- **???** — si conoces sus elementos: silueta negra + iconos de elemento + "???". Si es secreto: carta sellada sin silueta y, cuando encuentras su pista, una línea de **pista**.
- **Rumor** — la viste en una tabla de Resonancia, la usó un enemigo, tienes orbes suyos o leíste una botella: nombre, silueta, elementos, "posibles padres" y "condiciones conocidas" (formato de la CHARLA: "🌑 Eclipse · probabilidad conocida · posibles padres · condiciones").
- **Registrado** — la tienes: arte a color, stats, ataque en mini-clip, Momentos ("la sacaste a las 2:41 h de juego con Neblino y Canelo", primera ultimate, MVPs).
- Contador grande **"x/54"** + fila de elementos `🔥💧🌿 ??? ??? ??? ???` que se revela; tras el final aparece una página **"Próximo mar: ???"** con la silueta 🕳️ (no cuenta para el 54/54; el capítulo es completable al 100%).
- Cada especie nueva: +2% de oro global (balance), gemas por rareza (`discovery_gems`), Ronroneo `new_species`, Momentum.
- Pestañas: Gatos · Sets · **Grimorio de Sinergias** (12 reacciones con "?" hasta descubrirlas) · Momentos.

**Sets** (completar uno da `balance:orbs.prisma_from_catdex_set` Prismas + Ronroneo `catdex_set` + **una regla nueva**, T3):

{{TABLE:sets}}

### 2.8 Barcos, módulos y astillero

**Propósito:** el barco es tu build (pilar 1). Consume la misma economía (~48% del oro va al barco) y materiales que solo da el combate.

**Barcos** (`balance:ship.ships`; layouts por defecto en `04-content.json → ships[].hull/modules`, validados: rejilla conectada a la quilla, sin solapes, tripulación/armas/escudos = balance):

{{TABLE:ships}}

- **Barco activo** (el que pelea) se elige en el Mapa/Pre-batalla; el resto queda en el puerto (KL42: el libre farmea solo). "Un barco para cada pleito": Gorrión para Encargos de barco chico, Merodeador para farmear chatarra, Bastión para jefes (+10% contra jefes), Bajel para Zonas 4–6 (+20% contra Magia/Cósmico). La **Arca Celestial** es solo cinemática del prólogo y premio de la Marea Nueva / Cap. 2.
- **Poder de Barco (SP)** = `mult · (Σ ranuras poder_familia · 1.75^(Mk−1) + Σ poder de la tripulación) · (1 + perk situacional)` (08 §4.6). Se muestra grande en el astillero y en Pre-batalla junto a la probabilidad estimada.

**Familias y Mk** (`balance:ship.families` + `ship.mk`): Casco, Arma, Escudo (Jefe 3), Motor, Núcleo. Mk I → VII, **global por familia** (mejorar Armas mejora todas las armas de todos tus barcos). Costo `cost_base · 16^Mk_actual` Doblones + chatarra + planos (Mk III+) + cristales (Arma/Escudo/Núcleo Mk V+) + obra verde (20 s → 25 min). **Tope de Mk = jefes derrotados + 2.** Colas del astillero: 1 (+1 Puerto).

**Clases de casco** (cada Mk del Casco cambia material, arte y vida por celda: es la "reforja" de 06 sin reinicio):

{{TABLE:hull_mk}}

**Tipos de arma** (sidegrades: el tipo se elige por ranura; el poder lo da el Mk). **Los cañones no son una acción del jugador:** disparan solos en la **andanada** al final de cada turno (2.9.3).

{{TABLE:weapons}}

**Tipos de escudo** (desde el Jefe 3; "los escudos con personalidad" de la CHARLA):

{{TABLE:shields}}

**Motor:** combustible por turno = 2 + floor(Mk/2) celdas de maniobra (Bastión x0.5). **Núcleo:** todo barco tiene un **Corazón** (objetivo de victoria); con ranura de Núcleo da medidor de ultimate a toda la tripulación al inicio de tu turno (+5/+10/+15 según Mk).

**Módulos de utilería** (no suman poder: son táctica; cuestan "puntos de utilería" del barco; desmontar devuelve 100%):

{{TABLE:utility}}

**Reliquias de capitán** (1 por barco, requieren Puente de Mando vivo): 

{{TABLE:relics}}

**Artefactos** (1 uso por batalla, ranuras: Merodeador 1, Bastión 1, Bajel 2; gratis, se recargan solos cada batalla):

{{TABLE:artifacts}}

**Astillero (pantalla, EDITORIAL SUIZO + plano técnico azul):**
- Izquierda: lista de barcos (comprar/seleccionar activo). Centro: **rejilla del barco** (celdas de 34 px) con la ilustración encima; arrastrar módulos y camarotes a celdas válidas (reglas: el mástil va en la cubierta superior; el motor en las 2 filas sobre la quilla; el Corazón a ≥1 celda del borde; los camarotes tocan cubierta o casco; todo debe conectar con la quilla — la UI marca en rojo lo que se caería). Derecha: familias con su Mk, costo y botón Mejorar (obra verde con Ronroneo), tipos de arma/escudo por ranura, tripulación (arrastrar gatos a camarotes; muestra su disparo y sinergias: "Bobina Tesla + 2 gatos ⚡ = +1 salto").
- **Vista previa de colapso** al pasar el ratón ("si cae esto, caen 7 celdas, incluido el Cañón 2").
- **Botón Probar:** batalla de práctica contra un muñeco (barco de entrenamiento indestructible que muestra daño por tiro), sin botín ni Ronroneo.
- Poder de Barco grande, con la diferencia que haría cada mejora ("+12%").

**Arte de barcos: ilustraciones continuas que se rompen en trozos ilustrados** (feedback del usuario):

{{TABLE:ship_render}}

Skins de casco por Mk (se aplican a TODOS tus barcos):

{{TABLE:hull_skins}}

Barcos del jugador:

{{TABLE:player_ship_looks}}

Facciones enemigas (cada zona es una facción con silueta y paleta propias; el jugador sabe dónde está por cómo se ven los barcos):

{{TABLE:factions}}

### 2.9 Combate

#### 2.9.1 Modos

| Modo | Formato | Duración objetivo | Para qué |
|---|---|---|---|
| **Asedio Naval** (principal) | 1 barco contra 1 barco; tripulación 3–7 según barco | 3–4 min (6–8 turnos por bando) | Campaña: 6 zonas x 9 etapas (etapa 5 = élite, 9 = jefe) |
| **Jefe** | Barco o criatura enorme con 3 fases | 6–10 min (final 10–15) | Elementos, zonas, Primordiales |
| **Encargo** | Etapa lateral opcional con restricción de barco/tripulación | 3–5 min | "Barcos distintos para misiones distintas" (CHARLA); botín extra |
| **Duelo de Gatos** | 1v1 o 2v2 sobre plataformas de madera 5x3; gana quien deja al rival fuera de combate; maniobra = saltar 1 celda | 1–2 min | Gato Callejero, santuarios secretos, Error 404, **Probar gato** recién invocado |
| **Asalto Rápido** | Etapa ya ganada con SP/EP ≥ 2.5: botón que la resuelve en 5 s con animación resumen | 5 s | No castigar con grind lo ya superado |
| **Simulacro** (KL40) | Batallas automáticas en etapas ganadas en segundo plano (70% del botín) | — | Fábrica tardía |
| **Puzle de demolición** (evento) | Hundir un barco en 3 turnos | 1–2 min | Variedad (sustituye el match-3 de DC) |

#### 2.9.2 Preparación (pantalla Pre-batalla)
Silueta del barco enemigo (facción), elementos (o "???"), personalidad del capitán, **Poder enemigo vs tu Poder** y **probabilidad estimada** (`balance:combat.win_formula`, honesta: "Estimación 79%"), recompensas previstas (oro, chatarra, chance de planos, cristales del elemento). Eliges barco, tripulación (botón "sugerir": contra-arma por afinidad), reliquia y artefactos. Botón **¡ZARPAR!** → transición tierna → Battle Form (storyboard b; capitán completo y line-up del resto).

#### 2.9.3 Flujo de un turno (los dos bandos usan el mismo)

```
INICIO DE TURNO ─► tick de estados: DoT (fuego en celdas y gatos), enredaderas y hongos crecen,
                   inundación +25% por compartimento con brecha (bombas −50%), Congelado/Aturdido consumen turno
                ─► recargas −1 · Núcleo da medidor · ¿victoria / hundimiento?
MANIOBRA (opcional) ─► A/D mueve el barco gastando combustible (solo con motor)
ELEGIR GATO ────► 1-7 o clic en un gato listo (recarga 0, no Aturdido/Congelado/KO)
APUNTAR ────────► arrastre tipo honda desde el gato: dirección + potencia; vista previa del arco
                  (100% con Mástil vivo, 45% sin él; −% por Niebla/Bastión/Eclipse);
                  clic derecho sobre un módulo = marcarlo (runas teledirigidas); F = ultimate si el medidor está lleno
DISPARO → VUELO ► la cámara sigue al proyectil · ESPACIO = acción en vuelo (una vez): detonar/géiser/picar/dividir/pozo…
IMPACTO ────────► hitstop + daño en rejilla + estados + REACCIONES + pase estructural (BFS desde la quilla)
                  + trozos ilustrados + estados/KO de gatos afectados
SECUELAS ≤3 s ──► botín vuela a la UI, números, "¡MÓDULO DESTRUIDO!" (ESPACIO mantenido = x4)
ANDANADA ───────► todos los cañones vivos disparan SOLOS al Objetivo de Andanada (≤1.2 s)
FIN DE TURNO ───► efectos persistentes (FIN de Merlina, semillas dron, hongos), escora, hundimiento → turno rival
```
- **Una acción por turno: un gato** (disparo normal o ultimate). Si todos tus gatos están en recarga/aturdidos, el turno pasa directo a la andanada.
- **Gorrión:** en tu turno 1 eliges dos gatos.
- **Muerte súbita:** desde el turno 10 de cada bando sopla la Tormenta: al final de cada ronda ambos barcos se inundan 1 fila. Ninguna batalla pasa de ~14 turnos.
- Sin temporizador de turno contra la IA (los eventos rojos ya presionan con su reloj global).

**Andanada automática** (feedback del usuario — el cañón ya no es acción del jugador):

{{TABLE:volley}}

#### 2.9.4 Gatos en batalla
- **Recarga:** tras disparar, el gato no puede volver a disparar durante `recarga` turnos tuyos (Común 0: dispara cada turno).
- **Medidor de ultimate (0–100):** +25 por disparo propio, +15 cuando golpean su camarote, +10 cuando cae un aliado, + Núcleo por turno. Costo 100 (125 si tu Sala de Invocación no existe o fue destruida). Usarla es la acción del turno (ignora la recarga; después aplica la recarga normal). Una ultimate por turno. **Tope de daño de una ultimate: 35% de la estructura total inicial del barco enemigo** (40% para Starfall y Singularidad); los jefes tienen tope 15% por fase. Storyboard d (3.6 s la primera vez, 1.8 s después; saltable tras verla una vez).
- **Camarotes:** el gato recibe el 25% del daño hecho a las celdas de su camarote. Camarote destruido → **¡GATO SUELTO!** (Expuesto: sale volando en arco y cae de pie en la cubierta; recibe x1.5 directo pero su próximo disparo hace +25% y no gasta recarga — el rival elige: ¿destruyo el barco o remato al gato?). Si se rompe el piso bajo un gato expuesto, cae al agua: pierde 1 turno y vuelve nadando (momento cómico) — o queda fuera de combate si su vida llega a 0.
- **Fuera de combate (K.O.):** secuencia visible (feedback del usuario):

| t | Qué pasa |
|---|---|
{{TABLE:ko}}

  Excepciones: Vapor Ronin (su alma se queda 2 turnos como vapor y regresa), Nimbo (se duerme con 1 de vida una vez). Los enemigos hacen lo mismo con el salvavidas de su facción.

#### 2.9.5 Condiciones de victoria y derrota
Ganas si: (1) el **Corazón/Núcleo** enemigo pierde más de la mitad de sus celdas, (2) **toda la tripulación enemiga** queda fuera de combate, o (3) el barco enemigo **se hunde** (el agua llega a su núcleo). Pierdes por lo mismo. **Victoria perfecta** = sin perder ningún gato. Núcleo destruido da Ronroneo extra (`ronroneo.base_min.core_destroyed`).

#### 2.9.6 Disparos por elemento
Arquetipos en 2.4 (`elements[].shotRule`); cada gato los modifica (proyectiles, rebotes, perforación, homing, retardo…). Las **acciones en vuelo** se activan con Espacio una vez por disparo. Los **rayos** casi no tienen gravedad; las **ráfagas** no tienen gravedad y empujan; los **orbes cósmicos** se curvan hacia las masas; las **rocas** caen pesado y perforan; los **torpedos** viajan bajo el agua.

#### 2.9.7 Balística y destrucción (técnica ya prototipada)
- Rejilla de celdas de 34 px por barco (`battle/ship.ts`); módulos multi-celda; materiales `wood, canvas, iron, stone, crystal, bone, void` (agregar `stone` 120 y `canvas` 30 al prototipo).
- Proyectil con integrador propio a dt fijo y viento (`battle/ballistics.ts`), **el mismo código** para vista previa, IA, repetición y disparo. PRNG con semilla en el estado de batalla (nunca `Math.random()`); HP y daño en enteros.
- Daño por celda = daño del disparo x caída por distancia (lineal en el radio) x multiplicadores; perforantes recorren la línea con DDA.
- Tras cada impacto: **BFS desde la quilla** (`collapse()`): lo desconectado se desprende como trozo ilustrado (2.8) con daño de caída lógico; vista previa de colapso con Mástil vivo.
- Flotación analítica por compartimentos (separados por mamparos): brecha bajo la línea de flotación → +25% de inundación por turno; el barco baja una fila cuando el peso supera la flotabilidad; escora visual ±12°.

#### 2.9.8 Traducción del Poder (balance) a daño (combate real)
La fórmula de balance (`P(victoria)`) modela al jugador promedio; en el juego, **SP/EP se siente como ventaja, nunca como dado** (08 R15). Regla exacta:
```
S        = SP_jugador / EP_etapa                               (EP de la etapa; jefe: / (1 + 0.25·Análisis))
f(S)     = clamp(S^0.8, 0.35, 3.0)                             multiplicador de TU daño;  el enemigo usa f(1/S)
catShare = clamp(poder_gato / poder_promedio_de_la_tripulación, 0.7, 1.4)
Daño     = dmg_interno_del_disparo · f(S) · catShare · afinidad(solo contra gatos/escudos elementales)
           · material(elemento vs material de la celda) · estados (Maldito x1.5, Revelado x1.2, crítico x1.3)
           · (1 + Σ pasivas/aura de Primordial/sets)        → multiplicador combinado acotado a [0.5, 3.0] salvo f(S)
Vida gato = roles[rol].hp · catShare (+ mutaciones);  vida celda enemiga = material.hp · (2.2 núcleo | 1.4 camarote | 1.0)
Vida celda propia 'H' = cellHp de la clase del Casco (60 → 170) · mismo multiplicador de módulo
Mostrado = interno · EP_etapa / 2   (daños y barras de vida del enemigo; los números crecen ~x300 en el capítulo)
```
- Así el TTK se mantiene (8–10 tiros buenos para hundir un barco de igual poder) mientras los números mostrados crecen.
- **Calibración:** la tasa real de victoria de un jugador medio debe aproximar `P(victoria)` de balance (±10 puntos). Palancas de playtest: exponente 0.8 y σ de la IA (2.9.10). Telemetría desde el prototipo.
- Revancha del Patito: número mostrado = `(SP/EP)^3 · 1000` (≈10⁹–10¹⁰, la broma de escala).

#### 2.9.9 Controles (PC)

| Acción | Ratón | Teclado |
|---|---|---|
| Elegir gato | clic en el gato o su retrato | 1–7, Q/E para rotar |
| Apuntar y potencia | arrastrar desde el gato (honda) | ↑↓ ángulo, W/S potencia |
| Disparar | soltar | Enter |
| Marcar módulo objetivo | clic derecho | — |
| Acción en vuelo | clic | Espacio |
| Ultimate | botón del retrato | F |
| Mover el barco | — | A / D (combustible) |
| Vista táctica (vida, colapso, objetivo de andanada) | mantener clic medio | Tab |
| Cámara | rueda = zoom; arrastrar con clic derecho en el agua | C = recentrar |
| Acelerar secuelas, andanada y turno IA | — | Espacio mantenido = x4 |
| Pausa / ajustes | — | Esc |

#### 2.9.10 IA enemiga
Arquitectura de 03 §7 (simula cientos de tiros con el mismo integrador en un Web Worker, < 20 ms): elige gato + objetivo + ángulo/potencia por utilidad (`Σ daño x valor del módulo + KO + reacciones + colapso + hundimiento − desperdicio`), con softmax por temperatura; su andanada es automática como la tuya. Valores dinámicos: si tu gato está cargando (Singularidad 1/2, Meteoro), su camarote vale x5 ("¡MATEN A ESE YA!"). **Información justa:** no ve vidas ocultas ni lee el viento perfecto. Personalidades (torpe, francotirador, afinador, calculador, vengativo, saqueador, demoledor, elementalista) y dificultad por zona:

| Dificultad | σ ángulo | σ potencia | error de viento | combos | interrumpe cargas | Zonas |
|---|---|---|---|---|---|---|
| Grumete | 6° | 12% | ±40% | no | nunca | 1 |
| Corsario | 3° | 6% | ±20% | simples | a veces | 2–3 |
| Capitán | 1.5° | 3% | ±8% | sí (2 turnos) | siempre | 4–6 |
| Leyenda | 0.8° | 1.5% | ±3% | reglas propias | siempre, con frase | jefes 5–6 |

Horquillado en fácil/normal (el primer tiro a un objetivo nuevo se queda corto o largo y luego corrige), rubber band oculto solo en campaña (si vas muy perdiendo, σ x1.25; nunca en jefes), telegrafía de tiros grandes 1 turno antes.

#### 2.9.11 Recompensas (balance) y derrota que también da
- **Victoria:** oro `max(15·1.3^(etapa−1), 40 s de ingreso)` (x0.7 en etapas ya ganadas, x1.5 perfecta, x Momentum, x1.5 en flash) · chatarra `(2 + 0.5·etapa)` repartida por módulo destruido (cada módulo suelta tuercas que vuelan) · planos 35% desde la etapa 3 · cristales `1 + 0.75·zona` del elemento enemigo · 35% de 3 orbes (de un gato de tu tripulación, el MVP con doble peso) · 5% gema si perfecta · Ronroneo · Momentum · XP · 1/3 de carga del Gambit.
- **Derrota:** 30% del oro y la chatarra, Ronroneo 0.4 min, XP 2%, Momentum +0.03, **+20% de Análisis del Jefe** (20%: ves la vida de sus fases · 40%: punto débil · 60%: telegrafía 1 turno antes · hasta −25% de su poder) y **+3 orbes de una especie enemiga estudiada** (su ficha pasa a Rumor). Nunca "+0". Tras 3 derrotas contra el mismo jefe se ofrece el Análisis completo en una pantalla de "plan de ataque" (sin recortar premios).
- **Reparación** (`balance:ship.repair`, no simulada): tras pelear, reloj verde de `0.6 s por 1% de daño` y 2% del costo de la última mejora; una victoria sin daño no deja reloj; puedes zarpar con otro barco mientras.
- **Rangos por KO** (por gato, cuentan aunque pierdas: módulos destruidos + gatos noqueados): Bronce I-III (5/15/30), Plata I-III (50/80/120), Oro I-III (170/230/300). Cada rango: +2 orbes de ese gato y una insignia; bono de daño acumulado máx. +10% (solo combate).

#### 2.9.12 Cámara y dinamismo (feedback del usuario: "que se sienta muy dinámico")
- **Apuntar:** cámara abierta con ambos barcos (zoom 0.95), parallax de 3 capas de mar/cielo, oleaje que mece ambos barcos (visual).
- **Disparo:** squash del gato (80 ms) → stretch al soltar → follow-through; fogonazo de 2 frames; **retroceso del barco** (−8 px y 1.5° con resorte de 300 ms); camera kick 4–6 px opuesto al disparo.
- **Vuelo:** la cámara **sigue al proyectil** con look-ahead del 15% en la dirección de vuelo (lerp k≈6) y zoom dinámico según la altura del arco; estela y stretch del proyectil por velocidad; silbido con "Doppler".
- **Impacto:** hitstop 50–150 ms (220 en ultimate), zoom punch +3–6%, trauma de cámara proporcional al daño estructural, onda expansiva, decals permanentes, astillas y trozos ilustrados con física, géiseres al caer al agua, número de daño que escala con la magnitud.
- **Reacciones de los gatos:** se encogen cuando golpean su camarote, festejan cuando su tiro destruye un módulo, el rival hace burla si fallas; onomatopeyas por material (¡KRAK!, ¡CLANK!, ¡BUUM!).
- **Andanada:** plano general, fogonazos escalonados de proa a popa y retroceso por cañón; la cámara hace un pequeño barrido hacia el objetivo.
- **Kill cam** cuando el tiro va a terminar la batalla (slow-mo 0.25x, barras de cine) y explosiones en cadena del barco enemigo (storyboard e).
- Transiciones de turno ≤ 0.4 s; nunca paneos forzados que no se puedan saltar. Accesibilidad: sliders de sacudida/destellos, velocidad 1x/2x/4x, "reducir movimiento".

#### 2.9.13 Enemigos por zona (poder con `balance:combat.enemy_power_rule`; arquetipos en `04-content.json → enemyArchetypes`)

{{TABLE:enemies}}

**Encargos** (laterales, opcionales; no están en la ruta crítica del sim):

{{TABLE:errands}}

### 2.10 Jefes

Plantilla (03 §7.4): 3 fases (100–66–33%), **una regla que rompe el juego normal**, un punto débil que se revela (Análisis), telegrafía, enrage suave. Reino mínimo = `balance:bosses[].kl`. Los jefes NO son obligatorios de inmediato: aparecen como nodo con calavera en el mapa y esperan a que estés listo.

{{TABLE:bosses}}

**Otros encuentros (historia, eventos, secretos y élites de etapa 5):**

{{TABLE:other_bosses}}

### 2.11 Misiones (tutorial + historia, cero diarias)

**Reglas**
- 4 cadenas simultáneas: **Historia** (beats y tutorial), **Capitán** (barco y combate), **Criador** (gatos, comida, hábitats, Resonancia, estrellas), **Explorador** (expansiones, elementos, secretos, eventos, Catdex). Cada misión **enseña algo, abre algo o avanza la historia** (columna "Para qué"); si no, no existe.
- Aparecen **porque avanzaste** (trigger de progreso), nunca por calendario. Máx. **3 fijadas** en la HUD (las demás en el panel). La siguiente misión de una cadena aparece **ya empezada** si ya cumpliste parte (progreso dotado).
- Premio `std` = `balance:kingdom.mission_reward` (60 s de oro, 60 s de comida, 5 orbes, 15% de 1 gema) + Ronroneo `mission` + XP 6% de barra + Momentum; varias suman extras fijos (gemas, piezas, desbloqueos). Las tres primeras dan premio fijo de tutorial (CHARLA: "+300 oro, +100 comida, +1 gema").
- Completar = T2 (panel de cómic con la línea de Luzterna); en rachas, versión corta.
- **108 misiones** (~2.5 por nivel de Reino; balance modela 2 por nivel — ver 9). Las updates agregan cadenas después de las existentes.

{{TABLE:missions}}

### 2.12 Eventos (el mundo reacciona a tu progreso)

**Tres escalas** (todas con reloj ROJO, todas disparadas por progreso; `balance:events.rule`: sagrados):

**⚡ Microeventos** (30 s – 3 min; aparecen solos):

{{TABLE:micro}}

Reglas: 1 cada 6–10 min de juego activo, nunca durante batallas, jefes o modales T3/T4; nunca el mismo dos veces seguidas; premios indexados a la producción; si lo ignoras, se va sin castigo.

**🔥 Eventos Flash** (`balance:events.flash`: cada 2 niveles de Reino desde el 5; 8 min; 3 victorias; botín x1.5; premio 1 gema + 6 cristales + Ronroneo). Empiezan con un **PRESAGIO** (banner sin reloj: hasta 10 min para prepararte y aceptar); al aceptar, storyboard k (BOOOOM, reloj rojo "07:59" que golpea la pantalla). Nunca dos relojes rojos a la vez; nunca interrumpen a un jefe; si fallas, lo ganado por batalla se queda. Corren en tiempo de juego (cerrar la pestaña no te lo roba). Tipos (cada uno es el core loop con otro objetivo):

{{TABLE:flash}}

Orden por Reino (en la Marea Nueva se baraja con semilla: "playthrough A: Raijin en Reino 14 / B: Marea Fantasma primero"): {{TABLE:flash_schedule}}.

**👑 Expediciones Heroicas** (la Carrera Heroica de DC en solitario; 25:00 sagrados; usan TODA tu economía; prepararte antes de aceptar es parte del juego):

{{TABLE:heroic}}

**Bandera Negra** (`balance:events.black_flag`, Reino 15, 20:00): gana 5 batallas contra la flota de Velo Noctis (el 5.º es su buque insignia) → **Merodeador gratis** (si ya lo compraste: Reliquia "Antifaz de Noctis" + 2 gemas). Siempre da la reliquia. Es la decisión de la CHARLA: "un evento que te da un barco = otra forma de jugar".

**Eventos de historia:** "Algo viene" (Reino 24 → Heraldo del Arcanista → MAGIA; sin reloj), "A VOID SHIP HAS ENTERED YOUR WORLD" (Reino 38; rojo 14:59; no se puede ganar; daño → Fragmentos del Vacío; la CHARLA: "¿QUÉ PUTAS ES VOID?"), "Hace mucho tiempo, en una balsa…" (Reino 36; revancha del Patito).

**Fragmentos del Vacío (0/10, lore):** 1 del Arcanista, 1–2 de la Estrella Errante, 1–3 del Barco del Vacío, 1 del Encargo "La Última Niebla", el resto en el jefe final (siempre se llega a 10/10 al vencerlo). Investigación muestra `ELEMENT: ??? x/10`.

### 2.13 Cat's Gambit ("Siete Vidas")

**Reglas** (`balance:gambit`, validado en 08 §4.16: +0.5–3% del oro, no es estrategia óptima):
- **Mesa del Gato** en la isla (aparece tras el Jefe 1). Flujo: carga → gato → recurso y cantidad → mesa → resolución → resultado honesto.
- **Cargas:** 1 por cada 3 victorias, máx. 5 (jugar llena la mesa; sin calendario).
- **Mesas:** **Clásica** x2 (60%) · **Audaz** x5 (22%) · **Siete Vidas** x20 (6%). **Gato Maneki** (Mochi Maneki, secreto): +3/+2/+1 puntos. **Gato del Caos** (Pixel Glitch, secreto): habilita la mesa **x50 al 2.5%** (todo o nada). Nada exclusivo se gana SOLO apostando (los dos gatos de suerte se consiguen por otras rutas).
- **Apuesta máxima** = min(180 s de ingreso, 25% de la cartera, 600 s de ingreso / multiplicador). Comida igual. **Gemas:** máx. 3 por apuesta y 1 apuesta de gemas cada 2 niveles de Reino. Nunca se apuesta chatarra, planos, orbes ni Ronroneo.
- **Ética (05 §7):** probabilidades y premio visibles ANTES de apostar; se muestra el número sorteado (1–100) contra el umbral; **cero casi-aciertos fabricados**, cero pérdidas disfrazadas de ganancias; historial con balance neto ("23 apuestas · 9 ganadas · −3%"); sin tirada automática; sin iconografía de casino (nada de tragamonedas, fichas ni naipes); interruptor en Ajustes para **ocultar el Gambit** (sus misiones se completan solas).
- **Resolución temática (1–2 s):** "¿Se cae el vaso?": tu gato empuja un vaso al borde de la mesa; aparece el número; si gana, el vaso cae y explota en monedas (storyboard j, T3 en x20/x50); si pierde, el gato lo mira, lo deja en su lugar y se va ofendido (≤1 s, tono amable).

**Pantalla:** PÓSTER RETRO (crema, rojo #B3202A, oliva). Cartas de mesa con %, multiplicador y premio exacto; selector de gato (muestra su modificador); slider de apuesta con el tope.

### 2.14 Ronroneo y Momentum ("el tiempo se dobla a tu favor")

**Ronroneo** (`balance:ronroneo`):
- Se gana jugando: victoria 1.0 min base, +0.75 perfecta, +0.25 núcleo, derrota 0.4, jefe 10, especie nueva 2.5, misión 0.75, nivel de Reino 2.5, flash 2, set de Catdex 5; escala `x (1 + 0.05·(Reino−1)) x (1 + 0.5·(Momentum−1))`.
- **Auto-Ronroneo:** lo ganado se aplica solo al reloj verde **fijado** (📌, el jugador fija uno con un clic) o, si no hay, al más cercano a terminar. **Afinidad +50%** si la fuente combina con el reloj: combate → astillero/reparación · cosecha → granjas · descubrimiento → Resonancia · misiones → construcción. Lo que sobra va a la **reserva** (tope `(20 + 3·Reino)` min, +50% con 30 gemas), que se gasta a mano en cualquier verde; el desborde de la reserva se convierte en oro (15 s de ingreso por minuto).
- Feedback: tras cada victoria, los "−3 min" vuelan como sellos hacia el icono del reloj y lo hacen bajar a la vista (07 e). El jugador **ve** que jugar acelera.
- **Regalo de bienvenida** (08 R12): al volver tras ≥1 h, hasta 10 min de Ronroneo (no simulado; desactivable si el playtest lo pide).

**Momentum** (`balance:momentum`): barra x1.0–x3.0 en la HUD. Suma por victoria +0.10, perfecta +0.08, derrota +0.03, jefe +0.6, especie nueva +0.12, misión +0.04, cosecha +0.01. Se enfría con vida media de 5 min (nunca baja de x1; cerrar el juego no castiga). Efectos: botín de batalla xM, oro de hábitats y velocidad de cultivo x(1 + 0.5·(M−1)) (**BONUS DE COSECHA**), Ronroneo x(1 + 0.5·(M−1)). Color de la barra se calienta (blanco → amarillo → rosa → rojo en llamas a x3).

### 2.15 Automatizaciones ("ya aprendiste esto; toma, ahora preocúpate por cosas más interesantes")

Llegan después de que el jugador hizo la tarea a mano 10–20 veces y cada una trae un problema nuevo (06 §6.4).

{{TABLE:automation}}

### 2.16 Expansiones de terreno (las islas de Dragon City, pero cada una abre algo)

Se compran solo con Doblones (requieren Reino y un Constructor libre); limpiar el terreno es un reloj verde (rocas que se rompen, gatos constructores con cascos); al terminar se revela el bioma y su **secreto** (T3). Los precios bloqueados se ven desde el inicio ("Bosque Costero: 400 · Acantilado: 7,000 · Isla Volcánica: 120K · Ruinas: 200M…": lo imposible queda grabado; dos horas después "ah sí, la volcánica, de una").

{{TABLE:expansions}}

Regiones (centros en la rejilla 44x44 para `generateArchipelago`): en `04-content.json → expansions[].region`. Bioma nuevo **`reef`** para el Arrecife (paleta en la tabla). El Atolón Estelar es atajo narrativo, **no requisito** del jefe final.

### 2.17 Reino (nivel de cuenta)

- XP como % de una barra que crece (`balance:kingdom`): construcciones, mejoras de barco, niveles de gato, estrellas, eclosiones, especies, victorias/derrotas, jefes (60%), expansiones (50%), misiones. Impulso de tutorial (x2 en Reino 1, desaparece en el 11) y "arrastre" que alarga los niveles altos. Tope 50; el capítulo termina en Reino ~43 (44–50 = post-capítulo).
- Subir de nivel: T1 (T2 en hitos), +2.5 min de Ronroneo, misiones nuevas, presagios, gemas cada 5 niveles, tope de nivel de gato +1.
- **Hitos que cambian reglas** cada 20–30 min (★):

{{TABLE:kingdom}}

### 2.18 Gemas (Ojos de Gato)

- **~150 por capítulo** (normal 157, optimizador 161, casual 144: atadas a contenido, no al tiempo). Fuentes: jefes 6 (final 15), Catdex 1/1/2/2/3 por rareza, hitos de Reino (2 cada 5), misiones (15% c/u + fijas), perfectas (5%), heroicas (5), flash (1), **secretos de expansión (2–4 c/u, ~18 en total)**, Gambit (limitado).
- Sumideros (`balance:gems.sinks`): ranura extra de Resonancia 40 (máx. 1) · Constructor extra 50 (máx. 1) · Reloj de arena grande +50% reserva de Ronroneo 30 (máx. 1) · Orbe Prisma 2 (máx. 10 por jefe derrotado) · **saltar un reloj VERDE**: 1 gema = 2 min x (1 + 0.05·(Reino−1)), máx. 10 por reloj, **nunca rojos** · cosméticos 20–80 (auras, skins de barco, decoraciones) · Gambit.
- Nunca "paga gemas para seguir jugando": todo lo que compran también se consigue jugando.

### 2.19 Expediciones (Puerto de las Mareas)

`balance:expeditions`: 2 ranuras (Puerto), duración 15 min / 1 h / 4 h (verde), botín `h^0.85 x (1 + 0.5·viajeros) x {chatarra (5 + 1.5·zona)/h · cristales 2/h · orbes 6/h · planos 0.25/h}` de la zona elegida (ya descubierta). Tripulación: 1–2 gatos que no estén en el barco activo; los orbes son del gato enviado (así "entrenas" a uno para sus estrellas). Mientras están fuera siguen produciendo oro (están registrados en su hábitat) pero no pelean. KL32: se repiten solas. Es el canal offline de materiales (para el casual).

### 2.20 Offline y "Mientras no estabas"

- Corren: relojes verdes (obras, astillero, Resonancias, cultivos, expediciones, limpieza), producción de hábitats hasta su búfer (30–120 min) o, con Banco del Reino, hasta 2 h (+2 h con el Puerto). Nada se pudre ni decae como castigo.
- No corren: relojes rojos (los eventos solo se disparan jugando; los presagios esperan). El Momentum se enfría según su fórmula.
- Al volver: pantalla **"Mientras no estabas…"** (DIARIO DEL MAR): "Tus gatos produjeron 4.2M · terminaron 3 cosechas · la Resonancia de Canelo y Gelatino está lista · tiraron 14 vasos" + botón **Recolectar todo** + cola de revelaciones (se reproducen en orden, saltables) + Regalo de bienvenida de Ronroneo. Cero notificaciones fuera del juego.

### 2.21 Post-capítulo

- **Mar Abierto:** etapas infinitas por zona con poder x2 por nivel, para probar builds; botín normal; sin nuevo contenido de historia.
- **Marea Nueva (NG+ opcional):** reinicia isla y barco; conservas Catdex y gemas; ganas **Ecos de Marea** = `floor(√(oro_vida / 10¹⁰))` (+5% de producción por Eco, 08 §2.2); eventos flash en orden barajado; premio: el **Arca Celestial** jugable con stats de prueba (calibrar con el Cap. 2).
- Caza de "???" restantes, sets, Grimorio completo, Reino 44–50, rangos Oro, Forma Ascendida (★6). Todo el Cap. 1 es **completable al 100%**; lo único "abierto" es la pregunta de NADIE.

---

## 3. Roster del Capítulo 1

### 3.1 Reglas de arte del roster
- **54 entradas de Catdex** = las 48 especies de `balance:catdex` (ids, rarezas, elementos y oficios idénticos) + **6 secretos**. Las **32 ilustraciones** se usan cada una **una vez sin tinte** (su "versión real"); **22 variantes** reutilizan una ilustración con tinte. Prioridad de arte base: 7 Primordiales, 2 Míticos, los 3 iniciales y los 6 secretos.
- Tinte (`cats[].art.tint`) = `hue` (grados, ColorMatrixFilter) · `sat` · `bright` · capa `overlay` (color en modo multiply/overlay con alpha) · `decal` (capa de detalle dibujada en código sobre el sprite: brasas, grietas de lava, musgo, estrellas, runas, lodo, raíces, vapor, plasma, rayos, lunas, burbujas, corona) · `scale` (crías más chicas) · `aura` (3 colores del glow y partículas). Con el tiempo se puede pasar a máscaras de región + gradient map (01 §3), pero el MVP usa esto.
- **Battle Form** = mismo sprite + filtros (contorno de tinta, halftone, glow del elemento, aura de púas, ojos emisivos, impact frames B/N) + la cartela gritada en la tipografía de su dimensión (10, 07 §3.15). Todos miran a la derecha en el lado del jugador (flip para el enemigo).
- Los enemigos usan las mismas especies con "tratamiento pirata": desaturado 30–40%, contorno rojo, accesorio de facción dibujado en código (parche, gorro, antifaz).
- Arte de la narradora: `assets/cats-source/_extra/guides/luzterna.webp` (fallback: `lantern_spirit_cat` tintado violeta).
- Corrección vigente: en el juego `deepsea_sprite_cat` = gato abisal (pez linterna) y `masquerade_phantom_cat` = gato de la mascarada.

### 3.2 Tabla del roster (54)

Columnas de economía: "Oro base/s" = `balance:rarities.gold_base_per_s` (x1.16 por nivel, x estrella). Daño = interno (2.9.8). Detalle completo (★3, ★5, pasiva completa, lore, pista) en `04-content.json → cats[]`.

{{TABLE:roster}}

### 3.3 Recetas de Resonancia del capítulo (por par de elementos)

Supuestos de esta tabla: padres Comunes de un solo elemento, sin pity, los 7 elementos descubiertos y sin Épicos/Legendarios registrados (por eso "???" está lleno). Con padres híbridos aplica la regla de la **unión** (ejemplos en 2.6). La UI calcula siempre la tabla viva con el estado real del jugador. Los Primordiales de Tierra, Tormenta, Magia y Cósmico salen primero de sus jefes; después, sus duplicados también por Resonancia (dos padres que compartan el elemento, Nv20+).

{{TABLE:recipes}}

### 3.4 Diferencias con el campo `art` provisional de balance.json
El agente de economía dejó 25/48 asignaciones de arte provisionales y reservó 7 ilustraciones para elementos futuros. Este GDD asigna las 32 en el Cap. 1 (encargo explícito) y prioriza Primordiales y Míticos con arte base. **Para el arte manda `04-content.json → cats[].art`** (no es un número de balance). Diferencias:

{{TABLE:art_diff}}

Las 7 "reservadas" se usan como secretos o raros que en updates futuros pueden ganar su elemento nuevo (Velo Noctis → 🕳️ en el Cap. 2; Tictoque/Imán → ⏳; Bytewhisker/Pixel Glitch → Tech; Lumen → Luz; Sonata → Sonido).

---

## 4. Progresión minuto a minuto (Capítulo 1)

Tiempos = jugador **activo normal** (mediana de 24 semillas de `sim.py`, 08 §5.7/§6). El optimizador llega ~0.65x antes; el casual lo reparte en ~5 días. Cadencias objetivo (06 §6.4): algo nuevo cada 1–2 min (0–15 min), 3–5 min (15–60), 6–12 min (1–4 h), revelaciones cada 15–20 min (4 h+); siempre los **4 horizontes** visibles (algo comprable ya, algo que termina en < 2 min, una meta a 10–20 min, un misterio "???").

### 4.1 Los primeros 15 minutos (guion de onboarding)

| Min | Qué pasa | El jugador hace | Misión / sistema | Emoción |
|---|---|---|---|---|
| 0:00 | Logo **NO ONE LIKE CATS** estalla con onomatopeya; "Jugar" (ajustes en esquina, sin menús) | Clic | — | Expectativa |
| 0:10 | **Prólogo "en el futuro"**: Arca Celestial (Mk VII neón), Astra Prima ★6 Ascendida frente al Leviatán gigante. Una instrucción: "Mantén… y suelta" | Dispara la ultimate (no puede fallar) | b00 | Asombro, poder |
| 0:40 | El barco gigante se parte en tres en viñetas; periódico "¡EXTRA! UN GATO PARTE UN BARCO EN TRES". Corte: **"MUCHO ANTES…"**: balsa con palmera, caja de cartón, Canelo roncando | Mira | b00 → b01 | Risa por contraste |
| 0:50 | Luzterna aparece (fantasma, linterna): "Despierta, grumete… no, tú no: el gato" | Toca a Canelo | H01 | Ternura |
| 1:10 | Hábitat de Fuego (Caja de Cartón) con monedas; tap → +oro (T0) | Recolecta 3 veces | K01 | Control |
| 2:00 | "¿Cómo se llama?" (o deja "Canelo") | Escribe | H02 | Apego (IKEA) |
| 2:15 | Muelle: siembra Sardinas (30 s). Luzterna regala 2 min de Ronroneo: el reloj verde baja solo → **regla maestra enseñada en pequeño** | Siembra, ve el reloj bajar, cosecha 50 | H03 (+300 oro, +100 comida, +1 gema) | Competencia |
| 3:15 | Comedero: ¡ÑAM! x4 → Nv2… Nv3; el gato crece un poquito; aviso "Nv10: Bola Grande" | Alimenta | H04 (+5 orbes) | Satisfacción |
| 3:45 | Brote no tiene casa (no produce) → construir hábitat de Naturaleza (252 Doblones) | Construye (10 s) | K03 | Comprensión del sistema |
| 4:30 | Puerto: la Balsa Bigotuda. **Primera batalla** contra El Patito Pirata (1-1). Transformación tierna → **Battle Form** (storyboard b). Tiro 1: ¡KRAK!; la andanada automática de tu cañoncito remata; el pato responde (te hace poquito); tiro 3: núcleo → "¡CUAAAC!" | Apunta (honda) y dispara 3 veces | H05 | **WOW**: cute → anime destructivo |
| 6:00 | Resultados: oro, chatarra, XP + **¡BOTÍN DORADO!** (garantizado). "Siguiente batalla" con vista previa | Recoge | C01 aparece | Euforia |
| 6:30 | Etapa 1-2 y 1-3 (barcaza con muro → hay que bombear el tiro) | Aprende el tiro alto | C01, C04 | Flow |
| 7:00 | Reino 3: **Recolectar todo**; Bosque Costero (400) visible y comprable; el cielo se oscurece un segundo: "…Eso no era una nube" | Compra el Bosque (limpieza 30 s) | H07, E01, E02, E03 | Intriga |
| 8:00 | Santuario de Resonancia: Canelo + Brote. "Canelo y Brote se fueron a hacer quién sabe qué…" (90 s) | Elige la pareja | H06 | Curiosidad |
| 8:45 | Batalla mientras espera: al ganar, el sello "−1 min" vuela al reloj de la Resonancia | Pelea | — | "¡Jugar acelera!" |
| 9:00 | Reino 5: **Gorrión** (1,500) en el astillero; primer **Presagio Flash: Migración del Leviatán** (cosechas x15 durante 8 min; reloj ROJO) | Compra el Gorrión; acepta el evento | C05, C06, E08 | Codicia sana |
| 9:30 | **Revelación** (storyboard a): silueta → 🔥🌿 → RARO → **PIMENTÓN**. Se abre el Catdex: 4/54, fila 🔥💧🌿 ??? ??? ??? ??? | Mira, abre Catdex | K07, K08 | "¡Mira lo que me salió!" |
| 10:30 | Reino 4–6: Cesta de Mimbre, Anchoas, Alimentar hasta Nv X | Mejora, siembra | K05, K06, K09 | Crecimiento (x1.6) |
| 11:00 | Astillero: Armas Mk II (960 + 8 chatarra) → el cañón cambia de sprite | Mejora | C02 | Orgullo |
| 12:00 | Acantilado Rocoso (7,000, Reino 7) → 2.º Constructor; Presagio Flash: Tormenta en el Horizonte (fragmentos ⚡ "???") | Compra | E06, E07 | Escala |
| 14:00 | Primer microevento: **¡Pez Dorado!** (45 s) | Lo atrapa | E04 | Sorpresa |
| 15:00 | **Hilos abiertos**: Reino 8 al 70%, granja lista en 0:40, Capitán 4/9, Bahía 5/8, santuario sellado (Reino 5), "Eso no era una nube…" | — | — | "Una más" |

### 4.2 Del minuto 15 al final

| Tiempo | Reino | Qué se desbloquea / pasa | Misiones nuevas | Evento | Jefe / elemento |
|---|---|---|---|---|---|
| 0:18 | 8 | Primeras estrellas (orbes de victorias); Altar de Almas | K12, K13 | Micro: Gato Callejero (duelo) | — |
| 0:20 | 9 | Repetir receta; Torre Rascadora; Caballa; santuario del Bosque (duelo Guardián Musgoso, 2 gemas) | K10, K11, E05 | Flash: Demolición Exprés | — |
| 0:22 | 9 | Primera ultimate → Sala de Invocación desbloqueada; editor del astillero | C11, C12 | — | — |
| 0:25 | 10 | Comprar x10/MAX; Bahía 8/8 | C09 | — | Nodo de jefe con calavera |
| **0:28** | 10–11 | **JEFE 1: Capitán Bigotes Rotos** (barriles de pólvora). Al vencer: el "fósil vivo" de su bodega → **🪨 TIERRA** (storyboard f, T4) + **Gea** + Zona 2 + Mk III + Puente de Mando + reliquia Bigote Roto + **Mesa del Gato (Gambit)** | H08, C10, K14, E11 | — | 🪨 Tierra |
| 0:31 | 11 | Velo Noctis cruza el horizonte ("Bonita balsa. ¿La hiciste tú? Se nota.") | H09 | Flash: Niebla de Distraxia | — |
| 0:34 | 12 | **Isla Volcánica** (120K) → 2.ª ranura de Resonancia; Forja Dormida → Mortero de Magma | E09, E10, K16 | — | — |
| 0:40 | 13 | Primer Épico posible (padres Nv15): Canelo Infernal / Vapor Ronin ("¡NOOOO!") | K17 | Flash: Sobrecarga Volcánica | — |
| 0:47 | 14–15 | **Merodeador** (600K) o… | C17 | — | — |
| 0:50 | 15 | **Banco del Reino** (auto-depósito, offline 2 h); Casita de Coral; Salmón | K18, K19 | **Bandera Negra** (20:00) → Merodeador gratis / reliquia | — |
| 0:55 | 15–16 | Rango Bronce III en el gato MVP; Encargo "Aguas Estrechas" | C15 | Flash: Mar de Cristal | — |
| **1:06** | 17 | **JEFE 2: La Gárgola Ronroneante** (piel de piedra + ronroneo). → **⚡ TORMENTA** (T4) + **Tronador** + Zona 3 + Bobina Tesla + reliquia Ojo de Gárgola. Primera **Conducción** → Grimorio ("¡SINERGIA DESCUBIERTA!") | H10, C16, E12 | — | ⚡ Tormenta |
| 1:09 | 18 | Cola de Resonancia (3 parejas) | K20 | — | — |
| 1:11 | 20 | **Hito MUTACIONES**; Encargo "Rescate Gatuno" | K22, C22 | Flash: Marea Fantasma (Escudo Sacrificial, pista de Noctis) | — |
| 1:15 | 20 | **Puerto de las Mareas** (2M) → Expediciones, 2.º dique, Banco +2 h (niebla, barcos fantasma) | E13, E14, E15 | **Heroica 1: El Heredero del Trueno** (25:00) → **RAIJIN** (Mítico, T4) | — |
| 1:16 | 21 | **Mar de Pescados Automático**; Palacio de Cojines (cristales) | K21, K23 | Flash: Diluvio | — |
| **1:44** | 23 | **JEFE 3: Kraken Voltaico** — primer **ESCUDO** del juego (¡CLANK!) → Escudos (familia) + **Bastión** (astillero) + Zona 4 + reliquia Ventosa | H13, C19, C20 | — | 🛡️ Escudos |
| 1:46 | 24 | **Gatos trabajadores** ("¿trabaja o pelea?") | K24 | — | — |
| **1:50** | 24 | **"Algo viene"**: grieta sobre la isla, el barco que brilla, el Heraldo del Arcanista levanta un escudo mágico ("¡¿QUÉ PUTAS?!") → **✨ MAGIA** (T4: "un elemento que no debería existir en este mundo") + Hábitat Arcano + Resonancias nuevas. Los enemigos "???" de la Zona 4 revelan su elemento | H14 | — | ✨ Magia |
| 1:55 | 25 | **Glaciar Bigote** (35M) → granjas +25%, escudos −20%, Lanzaescarcha, Torre Elemental | E16, E17 | Flash: Luna de Resonancia | — |
| 2:27 | 27 | **Bastión** (40M): 7 camarotes, 3 escudos; "Flota" (3 barcos) | C21 | Flash: Niebla de Distraxia | — |
| 2:36 | 28 | Auto-alimentar por hábitat; Templo del Ronroneo; Encargo "Asedio Pesado" | K26, C23 | — | — |
| **2:47** | 29 | **JEFE 4: El Arcanista** (escudos arcanos en capas, teletransporte de módulos, gatos de tinta) → **Merlina** + **Bajel Arcano** + Escudo Arcano + Riel Arcano + Zona 5 + **Fragmento del Vacío 1/10** ("está frío… y vacío") | H15, C24 | — | Fragmento ??? |
| 2:54 | 30 | **Hito HERENCIA**; 30 especies | K28, K27 | Flash: Lluvia de Polvo Estelar (silueta de Astra Prima) | — |
| 3:06 | 32 | Expediciones automáticas; Santuario Arcano (tier 7) | K30 | Flash: Sobrecarga Volcánica | — |
| 3:20 | 32 | Zona 5 (Abismo Estelar): galeones **neón cósmicos** con elemento "???"; Encargo "Tormenta Arcana" (Bajel) | C25 | — | — |
| 3:45 | 33 | **Ruinas Arcanas** (200M) → 3.ª Resonancia; secreto bajo las rocas: **Santuario Gatuno Antiguo** → "La Orquesta Muda" → **Sonata Prima** (secreto triple ✨🌌⚡) + lore del Archivo Vivo | E19, H16 | Flash: Estrella Fugaz (Starbreaker, orbes de Meteoro, ruta de Eclipse) | — |
| **3:57** | 34–35 | **JEFE 5: Estrella Errante** (gravedad que cambia por fase) → **🌌 CÓSMICO** (T4) + **Astra Prima** + Zona 6 + Fragmentos 2–3/10 ("algo la empujó del cielo") + **Hito LINAJE** | H17 | — | 🌌 Cósmico |
| 3:59 | 36 | Auto-estrellas y auto-equipar; Núcleo Celestial (tier 8); Atolón disponible | — | Micro: Error 404 (Pixel Glitch) | — |
| 4:20 | 36 | **Revancha del Patito Pirata** (daño 10⁹: "hace dos horas te emocionabas con 100") | H20 | — | — |
| 4:30 | 37–38 | **Arrecife Prismático** (400M) → Mina de Prisma, Escudo Espejo; **Bajel Arcano** comprado; 40 especies → llega **Lumen** (secreto) | E20, E21, K31 | **Heroica 2: Grieta Cósmica** → **SINGULARIDAD** (Mítico, T4) | — |
| 4:34 | 40 | **Simulacro** (auto-batalla 70%) | C27 | Flash: Marea Fantasma | — |
| **4:45** | 38–40 | **A VOID SHIP HAS ENTERED YOUR WORLD** (rojo 14:59): batalla imposible; daño → Fragmentos 5–7/10 ("¿qué putas es VOID?") | H19, E25 | Barco del Vacío | 🕳️ ??? |
| 5:05 | 41 | **Atolón Estelar** (1.5B): faro que apunta al Leviatán; Atún de Nebulosa ("los gatos pescan organismos espaciales") | E22, E23 | Flash: Mar de Cristal | — |
| 5:10 | 42 | Órdenes de flota; Mk VII → todos tus barcos se vuelven **galeones neón cósmicos** | C26 | — | — |
| **5:24** | 43 | **JEFE FINAL: EL PRIMER MAR — Leviatán Almirante** (3 fases: escudos arcanos ⚡✨ → mar vivo: Mojar + Ventisca + Estallido 🪨 → gravedad invertida y Distraxia borra módulos; Velo Noctis aparece a ayudar: todas las ultimates listas) → el último golpe es el mismo plano del prólogo: "Mantén… y suelta" (STELLAR DECREE: STARFALL) | H21 | — | — |
| 5:27 | — | **MAREA FINAL**: toda la isla x1000 durante 3:00 (la cámara recorre la isla trabajando; el contador de Doblones sube de sufijo) | — | — | — |
| 5:30 | — | El mar se eleva sin viento; los gatos miran al cielo: **UNKNOWN ELEMENT DETECTED**; el cielo se abre como la tapa de una caja; silueta de estática: "¿Quién derrotó a mi almirante?" — Gatos: "…Nadie." — "Yo soy **NADIE**." — "NO ONE LIKES CATS." — negro, un vaso que se cae — **CONTINUARÁ →** (Fragmento 10/10; el contador hace glitch a "???") | — | — | 🕳️ Vacío (teaser) |
| 5:32 | — | Créditos personales (DIARIO DEL MAR): "Tu primer hábitat era una caja de cartón. Tu último costó {X}. Tu primer gato lanzaba bolas de pelo. Hoy {MVP} borra medio barco." Velo Noctis se une ("me debes una"). Página del Catdex "Próximo mar: ???" | H22 | — | — |
| Post | 43–50 | Mar Abierto, Marea Nueva (Ecos + Arca Celestial), "???" restantes, Reino 44–50, ★6, Grimorio completo | — | Flash 41/43/45, Revanchas Heroicas | — |

---

## 5. Historia y personajes

### 5.1 Premisa
Antes de este mar existió el **Archivo Vivo**: un universo hecho de todo lo que alguien aprendió alguna vez. El Archivo es una **pila infinita de cajas**; cada caja es un mundo dibujado con su propio trazo (acuarela, manga, neón, grabado…). Los recuerdos más valiosos toman forma de gato, y como **los gatos son líquidos**, se cuelan de una caja a otra por las **gateras** (por eso miran fijamente las paredes). **Distraxia, la Niebla del Olvido**, rasgó el Archivo: sus páginas —sus gatos— cayeron a los mares. El **Primer Mar** es donde todo cae primero, y donde todo se olvida… salvo que alguien lo recuerde muy fuerte.

Tú eres **Capi**, un grumete sin barco que despierta en una balsa con tres gatos dormidos. La **Capitana Luzterna**, fantasma y ex-farera del Archivo, te recluta para reunir a los gatos perdidos antes de que la niebla los borre. Al final descubres que Distraxia solo es la niebla que queda cuando algo de afuera borra una caja: **NADIE**, la entidad del Vacío cuyo lema es "NO ONE LIKES CATS". El título del juego le contesta, sin la "S": *no hay nadie como los gatos*.

**Por qué el multiverso de estilos:** cada gato conserva el trazo de su caja de origen (10 · 09 §7.5). Cuando un gato ataca, "reimprime" la pantalla con su tinta durante su turno (Fuego = anime inferno, Agua = ukiyo-e noir, Tierra = grabado de periódico, Tormenta = cómic Silver Age, Magia = tarot art nouveau, Cósmico = neón glitch). La UI misma está "impresa" en papel (editorial suizo) porque el Archivo es un libro. No es un bug: es memoria.

**Resonancia, explicada en el mundo:** dos gatos que ronronean en la misma frecuencia abren una gatera temporal y "llaman" a un gato de otra caja cuya frecuencia combine. El "???" es alguien de una caja que todavía no conoces. Y lo que pase detrás de la cortina es asunto de ellos.

### 5.2 Personajes
- **Capitana Luzterna** — narradora y guía (cajas de texto amarillas). Bruja tuxedo fantasma con linterna. Sarcástica, protectora, rompe la cuarta pared, groserías ligeras. Su arco: era la farera cuyo trabajo era que nadie se perdiera ("…ya ves cómo me fue"); al final su linterna enciende el Faro del Primer Mar.
- **Capi (tú)** — nunca se ve. Luzterna te dice "grumete" hasta el Jefe 1 y "Capi" después.
- **Velo Noctis** — rival recurrente (Capitana de la Bandera Negra, gato de la mascarada). Roba núcleos, presume, te regala un barco por aburrimiento, y en la fase 3 del final te cubre con sus Mil Rostros. Se une al final (secreto). Semilla del Cap. 2 (su antifaz esconde algo del Vacío).
- **Distraxia** — antagonista del Cap. 1: la niebla violeta de muchos ojos que maneja al Leviatán. "Yo no destruyo, grumete. Yo BORRO." Trabaja para alguien ("Él me lo pidió").
- **NADIE** — el Vacío. Casi no habla. Aparece solo en el final.
- **Jefes:** Capitán Bigotes Rotos (pirata cobarde y fanfarrón), La Gárgola Ronroneante (300 años dormida), Kraken Voltaico y su capitán diminuto, El Arcanista (ladrón de páginas, sin paciencia), Estrella Errante (cayó dos veces), el Leviatán Almirante / El Primer Mar. Élites con muletilla (2.10).
- **El Patito Pirata** — tutorial y revancha. "¡Cuac!"
- **Don Ganzúa** — comerciante sin cara (solo ojos en un bote).
- `[POP]` El banco de 09 trae otro elenco cómico (Almirante Firulais, El Capi capibara, Profesor Bigotales, Equipo Croqueta…): queda como **banco de cameos/cosméticos y updates**, porque requiere arte no felino que el Cap. 1 no tiene (ver 9).

### 5.3 Guion por beats

{{TABLE:story}}

### 5.4 Tono
- **Sin filtro** por defecto (decisión del usuario); Ajustes > Tono permite **Familiar** (09 §6.3: mismo chiste, otro vocabulario: "¡¿QUÉ PUTAS?!" → "¡¿QUÉEE?!"; "A LA MIERDA LAS GRANJAS" → "Sobrecarga Volcánica"). Palabras permitidas y prohibidas: 09 §6.3 (nunca insultos de odio, nunca groserías dirigidas al jugador).
- Isla = cálida y bajita; batalla = gritos anime en inglés/japonés en MAYÚSCULAS ("HAIRBALL IGNITION!!", "雷神降臨"); sistema = compa burlón que nunca regaña. Una sonrisa cada 5 minutos. Derrotas graciosas, nunca humillantes.
- Textos de carga, mensajes de sistema, logros y easter eggs: importar de `09-referencias-pop.json` (`loadingTips`, `systemMessages`, `achievements`, `easterEggs`) filtrando los que mencionen elementos que no existen en el Cap. 1. `[POP]`

---

## 6. Pantallas y UI

Estilo base: **EDITORIAL SUIZO** (papel crema con grano, tinta #171317, Anton/Bebas gigante, círculo rosa, retícula de puntos). Cada pantalla vive en una "dimensión de estilo" (10 §2). Transiciones de 07 §3.13 (papel rasgado isla↔puerto, collage para menús, vidrio roto en ultimates/victorias, iris rosa para volver a la isla). Rareza = calidad de impresión del marco (07 §3.16).

| # | Pantalla / panel | Contenido | Acciones | Dimensión de estilo |
|---|---|---|---|---|
| 6.1 | **Título** | Logo NO ONE LIKE CATS con onomatopeya; tagline; "Continuar/Nueva partida"; ajustes en esquina | Jugar | Editorial suizo + glitch sutil |
| 6.2 | **HUD de isla** | Arriba: Doblones, Pescaditos, Ojos de Gato, Chatarra/Planos/Cristales (desplegable), barra de Reino con %. Izquierda: hasta 3 misiones fijadas con botón directo. Derecha: columna de **relojes** (verdes con 📌 y botón Ronronear; rojos con latido), reserva de Ronroneo, Momentum. Abajo: barra de acciones (Isla, Muelle, Santuario, Catdex, Astillero, **Zarpar**/Mapa, Reino, Mesa del Gato). Banner de **Presagio** cuando hay evento | Tap a edificios, recolectar, arrastrar comida, abrir paneles | **COZY ISLA** |
| 6.3 | **Panel de hábitat** | Tier, gatos (retratos), oro/s, búfer (barra "LLENO"), oficio Banquero | Mejorar (verde), mover gatos | Cozy + editorial |
| 6.4 | **Muelle de Pesca** | Parcelas con cultivo, reloj verde, nivel; selector de cultivo con comida/min vs comida/clic | Sembrar, cosechar, repetir, mejorar | Cozy + Noir oceánico |
| 6.5 | **Panel de gato** | Arte grande (forma isla) con botón "ver Battle Form"; nombre editable; elementos, rareza (marco), rol, oficio, rasgo, mutación; nivel + barra ÑAM + **"en N niveles: [umbral]"**; estrellas + orbes; stats de combate (vida, recarga, disparo, ultimate, limitación, pasiva, ★3/★5); oro/s; Momentos | Alimentar (tap/mantener/hasta Nv X), Subir estrella (Altar), asignar oficio, mandar a expedición, Probar (duelo de prueba) | Editorial suizo + dimensión del elemento en la Battle Form |
| 6.6 | **Santuario de Resonancia** | 2 cojines, tabla viva de probabilidades (silueta, nombre o ???, rareza, %), fila ???, tiempo estimado, condiciones faltantes, ranuras y cola | Arrastrar padres, ¡A RESONAR!, Ronronear | **ORQUÍDEA REAL** |
| 6.7 | **Revelación** | Secuencia (a): silueta → elementos → rareza → nombre → chips; copy; "Ver en Catdex / Al hábitat / Probar" | Arrastrar el sello para romperlo antes; saltar | Editorial suizo → "reimpresión" por rareza |
| 6.8 | **Catdex** | Contador x/54, fila de elementos, cuadrícula de cartas (???/Rumor/Registrado), filtros por elemento/rareza; pestañas Sets, **Grimorio de Sinergias**, Momentos; página "Próximo mar" tras el final | Ver ficha, ver de nuevo una revelación | Editorial suizo |
| 6.9 | **Astillero** | Barcos (comprar/activo), rejilla editable con ilustración, familias Mk (costo, tiempo, poder), tipos de arma/escudo por ranura, utilería (puntos), reliquia, artefactos, tripulación, vista previa de colapso, Poder de Barco | Arrastrar módulos/gatos, mejorar (verde), Probar contra muñeco | Plano técnico azul sobre editorial |
| 6.10 | **Mapa marino (selección de batalla)** | Carta náutica: 6 zonas como islas con camino punteado de 9 etapas (élite con insignia, jefe con calavera), Encargos laterales, nodos de evento en rojo, zonas futuras con niebla "???". Por etapa: facción, poder, estrellas de dificultad, botín previsto, Asalto Rápido si aplica | Elegir etapa, Asalto Rápido, ver Análisis de jefe | **DIARIO DEL MAR** (mapa de periódico antiguo) |
| 6.11 | **Pre-batalla** | Silueta enemiga, elementos, personalidad, Poder vs Poder, probabilidad estimada, botín; selector de barco, tripulación sugerida, reliquia, artefactos | Cambiar tripulación, ¡ZARPAR! | Noir oceánico + editorial |
| 6.12 | **HUD de batalla** | Ambos barcos (ilustrados) y mar; arriba: barra de estructura de cada barco + núcleo, viento (flecha + número), turno; abajo: retratos de tu tripulación (vida, recarga, medidor de ultimate, estado visible, salvavidas si cayó), artefactos, botón ultimate; objetivo de andanada (mira); contador de turnos para la Tormenta; mini-log de reacciones | Elegir gato, apuntar, F, Espacio, A/D, Tab | **NOIR OCEÁNICO** + dimensión del gato que ataca en su turno |
| 6.13 | **Resultados** | Victoria: portada de periódico con foto del impacto; cascada de botín con tick-up; sellos de Ronroneo que vuelan a sus relojes; Momentum; MVP; misiones avanzadas; "Siguiente batalla". Derrota: "DERROTA" en tinta azul con grano + botín igual + Análisis del jefe | Siguiente / Repetir / Isla | Diario del mar (victoria) · Noir (derrota) |
| 6.14 | **Misiones** | 4 cadenas con progreso, misión actual de cada una con premio visible, historial | Fijar (máx. 3), ir a | Editorial suizo + caption amarilla |
| 6.15 | **Eventos** | Presagio (banner + carta de premio en silueta), reloj rojo persistente, objetivos; **Heroica**: pista con nodos 🚩━●━●━🏆, tareas, premios por nodo, umbral seguro, sprint | Aceptar/posponer presagio, ir a la tarea | **COLLAGE GRUNGE** (rojo sagrado) |
| 6.16 | **Cat's Gambit** | Cartas de mesa (x2/x5/x20/x50 si Caos) con % y premio exacto; gato elegido y su modificador; slider de apuesta con topes; cargas; historial con balance neto | Elegir mesa, gato, recurso, cantidad, ¡Que se caiga el vaso! | **PÓSTER RETRO** |
| 6.17 | **Reino** | Nivel, barra, hitos pasados y siguientes (★ reglas), automatizaciones con interruptores, oficios (trabajadores) | Activar/desactivar automatizaciones, asignar oficios | Editorial suizo |
| 6.18 | **Expansiones** | Vista de archipiélago con terrenos bloqueados y precios aspiracionales; al comprar: limpieza (verde) y revelación del secreto | Comprar, acelerar limpieza | Cozy isla |
| 6.19 | **Puerto / Expediciones** | 2 ranuras, destino (zona), duración, tripulación, botín previsto | Enviar, recoger | Noir oceánico (niebla) |
| 6.20 | **Mientras no estabas** | Resumen de producción, relojes terminados, revelaciones en cola, regalo de Ronroneo | Recolectar todo, ver revelaciones | Diario del mar |
| 6.21 | **Ajustes** | Audio (música/efectos/voces), **Tono: Sin filtro / Familiar**, animaciones completas/rápidas/mínimas, velocidad 1x/2x/4x, sacudida 0–100, destellos, glitch/aberración, modo fotosensible, reducir movimiento, saltar cortes anime ya vistos, notación (sufijos/científica), **ocultar Cat's Gambit**, borrar partida (con doble confirmación) | — | Editorial suizo |
| 6.22 | **Créditos personales / CONTINUARÁ** | Periódico especial con tus estadísticas, Momentos, MVP, barco favorito | Continuar al post-capítulo | Diario del mar → Noir invertido |

---

## 7. Feedback / juice por evento

Tiers y presupuestos de 07 §4 (T0 cientos por sesión, T1 20–40, T2 8–15, T3 3–6, T4 0–2; ≤ ~10 T4 en todo el capítulo; "primera vez completa, después corta"; nunca bloquear input en T0/T1; nunca dos T4 seguidos sin volver al mundo).

| Evento | Tier | Storyboard / receta (07) | Notas |
|---|---|---|---|
| Recolectar oro de un hábitat | T0 | (h) monedas al contador | Pitch ascendente en racha |
| Recolectar todo | T1 | (h) cascada única | Agregación |
| Bocado ¡ÑAM! | T0 | (i) | +1 semitono por bocado |
| Subir de nivel (gato) | T1 | (i) "¡NIVEL 12!" | Feed-all: intermedios T0 |
| Umbral Nv10/20/30/40 | T2 | (i) "¡Su ataque evolucionó!" + mini-clip del disparo nuevo | Cambio visible del ataque |
| Cosecha | T1 | ¡SPLASH! + pescaditos al contador | x15 en Migración: T2 |
| Misión completada | T2 | panel de cómic + caption de Luzterna | Versión corta tras 3 |
| Nivel de Reino | T1 (T2 si hito ★) | barra con overshoot + sello del hito | — |
| Hito que cambia reglas | T2 | póster tipográfico del hito | — |
| Disparo + impacto | T0/T1 | (c) | Hitstop 50–150 ms |
| Crítico | T1 | (c) sello "¡CRÍTICO!" | — |
| Módulo destruido | T1 | (c) banner + tuercas que vuelan | Combo pentatónico |
| Reacción elemental (primera vez) | T2 | flash "¡SINERGIA DESCUBIERTA!" + Grimorio | Después T1 |
| Andanada | T0/T1 | fogonazos escalonados + retroceso del barco | ≤ 1.2 s |
| Gato con estado (fuego, rayos X, hielo, mojado) | T0 | 2.4 tabla de estados de gatos | Siempre visible en el sprite y el retrato |
| Gato fuera de combate | T1 (T2 último rival) | secuencia K.O. 2.9.4 | Salvavidas "FUERA DE COMBATE" |
| ¡GATO SUELTO! | T1 | salto en arco + "!" | — |
| Transformación a Battle Form | T2 | (b) | 0.9 s tras la primera vez |
| Ultimate | T3 en batalla | (d) | 1.8 s en repeticiones |
| Victoria | T2 | (e) + periódico | Kill cam si aplica |
| Derrota | T1 | (e) derrota amable | Nunca "+0" |
| Gato nuevo (Común/Raro) | T3 | (a) | Duplicado 1.4 s |
| Gato nuevo Épico/Legendario | T3 | (a) con reimpresión dorada/foil | — |
| Mítico, Primordial, secreto o primer gato de un elemento | T4 | (a) + LUT de otra dimensión | — |
| Subir estrella ★2–3 / ★4–5 / ★6 | T2 / T3 / T4 | (g) | ★6 encadena transformación |
| Elemento nuevo | T4 | (f) | La isla gana una capa musical para siempre |
| Jefe derrotado | T3 (+ elemento T4 encadenado) | (e) + (f) | Primero T3, vuelve al mundo, luego T4 |
| Expansión comprada / secreto revelado | T2 / T3 | rocas que estallan, bioma que se colorea | — |
| Barco nuevo | T3 | el barco emerge del agua con su bandera | — |
| Mejora Mk | T2 | el módulo cambia de sprite con sello | Mk VII del casco: T3 (galeón neón) |
| Set del Catdex | T3 | póster + regla nueva | — |
| Primer millón / cambio de sufijo | T2 | contador que arde (Balatro) | — |
| Presagio / inicio de flash | T2 | (k) | Reloj rojo persistente |
| Heroica ganada | T3 (premio Mítico T4) | (k) + (a) | — |
| Jackpot del Gambit (x20/x50) | T3 | (j) | Pérdida ≤ 1 s amable |
| Microevento | T1 | banner rojo pequeño | — |
| Marea Final + UNKNOWN ELEMENT + CONTINUARÁ | T4 | (f) invertido + guion 4.2 | Último T4 del capítulo |

---

## 8. Plan de implementación por hitos

Base existente: `game/` (Vite + TS + PixiJS v8 + GSAP; `battle/ship.ts` rejilla + BFS, `ballistics.ts`, `blueprints.ts` balsa/sparrow, `fx/` filtros y juice, `island/terrain.ts` archipiélago con biomas, `art/catArt.ts` sprites y ELEMENT_FX, `core/save.ts`, `rng.ts`). Todo el contenido se importa de `04-content.json` y todos los números de `balance.json` (copiar ambos a `game/src/data/` en build; nunca hardcodear números).

### M1 — Núcleo jugable (≈30–45 min de contenido: inicio → Jefe 1)
- **Datos:** loaders tipados de balance.json y 04-content.json; notación de números; save/load (localStorage, versión).
- **Isla:** región home + Bosque + Acantilado; hábitats tier 1–3 con búfer y "LLENO"; Muelle (Sardinas, Anchoas, Caballa) con niveles; alimentar con ¡ÑAM! x4; Recolectar todo (KL3), Alimentar hasta (KL6), Repetir receta (KL9).
- **Gatos:** 14 Comunes + 6 Raros de 🔥💧🌿🪨 + Gea; arte con tintes; Battle Form con filtros; niveles con umbrales Nv10/20.
- **Resonancia:** 1 ranura, tabla viva exacta, pity, ???, tutorial Canelo + Brote → Pimentón; revelación (a).
- **Catdex** básico (???/Rumor/Registrado, contador).
- **Combate:** Asedio completo (turno, andanada, honda, vista previa con mástil, acción en vuelo, daño por material, BFS y trozos ilustrados, flotación/brecha, estados Mojado/Ardiendo/Enraizado y reacciones Incendio/Vapor/Brecha/Florecer, estados visibles en gatos y secuencia K.O., recarga y ultimate, IA grumete/corsario, traducción SP/EP→daño); Zona 1 (8 etapas + élite + Jefe 1 con barriles); Balsa y Gorrión ilustrados; astillero Mk I–III (Casco, Arma, Motor) sin editor de layout.
- **Economía viva:** Ronroneo (auto + 📌 + reserva), Momentum, XP de Reino, recompensas de balance, misiones H01–H09, C01–C11, K01–K14, E01–E07.
- **Juice:** T0–T3 (a, b, c, d, e, h, i), RewardQueue, accesibilidad básica.
- **Historia:** prólogo "en el futuro", b01–b11.
- **Hecho cuando:** un tester nuevo llega del minuto 0 al Jefe 1 en 25–45 min sin explicación externa; primera batalla < 5 min; primera Resonancia revelada < 12 min; ningún reloj verde > 3 min antes del Jefe 1; jugar acelera visiblemente (sellos volando); el sim de balance y el juego coinciden ±25% en Reino al vencer el Jefe 1; 60 fps con 2 barcos y 3,000 partículas; save/load sin pérdida.

### M2 — Barco, astillero, expansiones, estrellas, automatización (≈ hasta Jefe 3)
- Editor de layout del astillero (utilería con puntos, validación de conexión, vista previa de colapso, Probar); familias Mk hasta V con planos y cristales; tipos de arma (Cañón, Mortero, Bobina Tesla) y escudo Burbuja; Merodeador y Bastión ilustrados; reliquias y artefactos; Encargos de Zonas 2–3.
- Expansiones 1–5 con limpieza, secretos y biomas; tiers de hábitat 4–6; cultivos hasta Pulpo; Banco del Reino; Cola de Resonancia; Mar de Pescados Automático; oficios (KL24).
- Altar de Almas (estrellas ★2–★5, Prisma), rasgos, mutaciones (KL20).
- Zonas 2–3 + Jefes 2–3 + élites; elemento Tormenta (rayo y ráfaga), reacciones Conducción/Ventisca/Estallido/Avivar/Sobrecarga; Duelo de Gatos; Asalto Rápido; rangos por KO; reparación.
- Misiones hasta H13/C22/K23/E17. Expediciones (Puerto).
- **Hecho cuando:** el Jefe 3 llega en 1h30–2h00 (normal); el jugador cambia de barco según la misión al menos una vez (telemetría); ningún tipo de arma tiene < 10% de uso; el editor no permite barcos inválidos; las automatizaciones retiran las tareas viejas (clics por minuto en la isla bajan ≥ 40% entre la h1 y la h2).

### M3 — Eventos, jefes 4–5, Gambit, Heroicas
- Microeventos (11), eventos Flash (11 tipos, presagios, reloj rojo sagrado, cola sin superposición), Bandera Negra, Heroicas 1–2 con nodos, umbral seguro, sprint y revancha.
- Magia (Heraldo, escudos arcanos, Maldito/Amplificar) y Cósmico (orbes gravitatorios, Ingrávido, Lluvia de escombros); Zonas 4–5, Jefes 4–5; Bajel Arcano; Escudos Arcano/Sacrificial/Espejo; Riel, Lanzaescarcha, Arpón, Starbreaker; Torre Elemental.
- Cat's Gambit completo con ética y ocultar; gatos secretos con sus dos rutas; Grimorio de Sinergias; Herencia (KL30) y Linaje (KL35); sets del Catdex con reglas.
- Expansiones 6–7 (Santuario Gatuno Antiguo / Orquesta Muda), tiers 7; Fragmentos del Vacío.
- **Hecho cuando:** 0 relojes rojos modificables por cualquier vía (test automatizado); ninguna superposición de rojos; el Gambit aporta entre −3% y +12% del oro (como 08); los 6 secretos son obtenibles por su ruta fija en una partida de prueba; Heroicas completables por un jugador normal en 25 min con preparación (≥70% en playtest).

### M4 — Late game, final y pulido
- Zona 6 + Leviatán/El Primer Mar (3 fases + golpe final guionizado) + Marea Final + UNKNOWN ELEMENT/NADIE + CONTINUARÁ + créditos personales; Barco del Vacío; revancha del Patito.
- Atolón Estelar, Núcleo Celestial, Atún de Nebulosa, Mk VII (galeón neón cósmico), Simulacro, Órdenes de flota, auto-estrellas.
- Post-capítulo: Mar Abierto, Marea Nueva (Ecos, flash barajados), página "Próximo mar".
- Pulido: música adaptativa por capas (capa nueva por elemento), sonido por material, todas las secuencias T3/T4, LUT por elemento, accesibilidad completa (fotosensible), tono Familiar, textos de 09, "Mientras no estabas", telemetría de 06 §6.8.
- **Hecho cuando:** capítulo completo de punta a punta en 4h45–6h15 (normal) y 3–4 h (optimizador) en playtest; % de oro activo 60–70% (no < 40, no > 85); rachas sin compra < 5 min el 95% del tiempo; final sin grind (la última hora es 100% contenido nuevo); el Catdex se puede completar 54/54; build sin errores de tipos; 60 fps en PC de gama media.

---

## 9. Decisiones y conflictos resueltos

| # | Tema | Lo que decían los informes | Decisión | Por qué |
|---|---|---|---|---|
| 1 | **Elementos y su orden** | 06: Tierra → Rayo → Hielo → Magia → Espíritu → Cósmico. 03: 10 elementos (hielo, viento, eléctrico separados). 09: 4 de piso + viento/eléctrico/hielo + magia/espíritu + cósmico. CHARLA: "🔥💧🌱🪨⚡✨🌌". balance/08: 🔥💧🌿 → 🪨 (J1) → ⚡ (J2) → ✨ (Reino 24) → 🌌 (J5) → 🕳️ teaser | **balance/08** (= exactamente la lista de la CHARLA). Tormenta absorbe eléctrico + viento (dos variantes de disparo); **el hielo es una reacción** (Ventisca), no un elemento; Espíritu queda para un capítulo futuro (rumor en Marea Fantasma) | Números ya validados en el sim; 7 elementos son legibles en 6 h; el hielo como consecuencia premia el combo |
| 2 | **Reforja de casco** | 06: clases de casco con reinicio a nivel 1 y x4 | **Mk por familia de balance**, sin reinicio; las "clases" son los nombres/arte del Casco Mk I–VII y su vida por celda | Balance no modela niveles dentro del Mk; mismo efecto de escalón sin pérdida |
| 3 | **Cat's Gambit con EV > 1** | 05: retorno esperado < 1 ("Siete Vidas"). balance/08: x2 60%, x5 22%, x20 6% (EV 1.1–1.2) con topes por ingreso | **Números de balance** + **todas** las reglas éticas de 05 (transparencia, sin casi-aciertos, sin estética de casino, ocultable) | Validado: +0.5–3% del oro, el "ludópata" termina más tarde; es un premio por jugar, no la estrategia óptima |
| 4 | **Jefe final** | Encargo: "El Primer Mar". balance: "Leviatán Almirante" | **EL PRIMER MAR — Leviatán Almirante**: el Leviatán es el avatar del mar, manejado por Distraxia; id `boss_6` = balance `bosses[5]` | Respeta ambos; y "¿Quién derrotó a mi almirante?" engancha a NADIE |
| 5 | **El cañón ya no es acción del jugador** | 03: "una acción por turno: un gato **o** un cañón (con energía creciente)" | **Feedback nuevo del usuario:** andanada automática al final de cada turno; el jugador solo elige gato. Se elimina la energía; el Núcleo ahora da medidor de ultimate | El barco pesa cada turno sin agregar clics; turnos más rápidos |
| 6 | **Magia: ¿Arcanista o Reino?** | CHARLA: aparece "THE ARCANIST" y al vencerlo: MAGIA + ESCUDOS. 06: Magia al vencer al Jefe 2. balance: Magia en Reino 24, Escudos en Jefe 3, Arcanista = Jefe 4 | **Reino 24 → Heraldo del Arcanista** (primer encuentro, batalla de historia, escudo mágico "¡CLANK!") → MAGIA; el Arcanista vuelve como Jefe 4. El **primer escudo** del juego lo pone el Kraken (Jefe 3), que desbloquea la familia Escudo | Cumple el beat de la CHARLA dentro de los disparadores de balance |
| 7 | **Primera Resonancia** | 05: ≥ Raro. 02: Canelo + Brote, 1–2 min. 05: 🔥+💧 "Vapor". balance `timer_rules`: Canelo + Brote, Pimentón o Chispa, 90 s | **Canelo + Brote → Pimentón (Raro), 90 s** | Está en balance; Pimentón cumple ≥ Raro; el "salió vapor" queda para Neblino/Vapor Ronin |
| 8 | **Sets del Catdex** | 06: set completo = x1.5 global | **balance:** +2% de oro por especie; los sets dan Prisma + Ronroneo + **una regla de combate** | Un x1.5 rompería la curva validada |
| 9 | **Opuestos que exigen padres híbridos** | 02: Fuego↔Agua, etc. requieren padres híbridos | **Regla de balance** (unión de elementos de los padres) | Es la que simula `sim.py`; la profundidad viene de niveles, rarezas y ??? |
| 10 | **"1.00aa" al final** | 06: el contador cruza 10¹⁵ y muestra "1.00aa" | **No depende del número**: la Marea Final sube de sufijo y el contador hace glitch a "???" | La notación de balance usa Qa…Dc antes de "aa" y el oro final es ~10¹²–10¹³ |
| 11 | **Arte de los gatos** | balance.json trae un campo `art` provisional (25/48) y reserva 7 ilustraciones para el futuro | **Manda `04-content.json → cats[].art`**: las 32 en el Cap. 1, Primordiales y Míticos con arte base, 22 variantes tintadas; tabla de diferencias en 3.4. Brote/Musgo/Nenúfar se alinearon con la propuesta de economía | Encargo explícito; el arte no es número de balance |
| 12 | **Rareza "Primordial"** | Prototipo (`ui/theme.ts`) la trata como rareza. balance: Legendario + `primordial: true` | **Legendario de balance** con bandera; marco y reveal propios de Primordial (negro + ruido) | Las fórmulas usan 5 rarezas |
| 13 | **Corazón en barcos sin ranura de Núcleo** | balance: Balsa/Gorrión con `core: 0`. Prototipo: todo barco tiene 'core' (victoria) | Todo barco tiene **Corazón** (objetivo); la familia Núcleo lo mejora | Sin núcleo no hay condición de victoria clara |
| 14 | **Reloj activo x1.5 y golpes en %** | 05: tic activo x1.5 y reducciones en % de la duración | **Ronroneo de balance** (minutos con tope, auto-aplicado, afinidad +50%) | Es lo simulado; una sola moneda de tiempo |
| 15 | **Marea de bienvenida** | 05: x2 producción 10 min al volver | **No**; en su lugar el **regalo de Ronroneo ≤ 10 min** que propone 08 R12 | No altera la curva de oro |
| 16 | **Heroica 1 antes de la Tormenta** | balance: Reino 14; la Tormenta llega con el Jefe 2 (Reino ≥11, ~1:06) | Disparador = Reino 14 **y** Tormenta descubierta | Raijin (⚡) sin ⚡ sería raro; en el sim normal ya ocurre así |
| 17 | **Atolón Estelar "ruta al jefe final"** | balance: "muelle hacia el Leviatán" | Atajo narrativo, **no requisito** | Un requisito de 1.5B podría ser muro para perfiles lentos |
| 18 | **"Hábitats de Naturaleza +25%" (Bosque)** | Texto en `opens` de balance, sin clave numérica | Se trata como texto (bioma), **sin** multiplicador | No está simulado ni tiene clave |
| 19 | **Elenco de 09** | 09 §7: Almirante Firulais (perro), El Capi (capibara), Profesor Bigotales, Abuelo Bigotes, Dumbledog | Se adopta **NADIE**, las "cajas", gateras y Eventos Canónicos como lore; el resto queda como banco de cameos/cosméticos/updates `[POP]` | Requieren arte no felino; el Cap. 1 se arma con las 32 ilustraciones + código |
| 20 | **Groserías por defecto** | 09: "Familiar" por defecto | **"Sin filtro" por defecto** (decisión del usuario), "Familiar" en Ajustes | Decisión ya tomada con el usuario |
| 21 | **Canelo Infernal** | CHARLA: Fuego/Oscuridad | **🔥🪨** (balance) | No hay Oscuridad en el Cap. 1 |
| 22 | **Tutorial: Patito vs Bote de Ratas** | 05: El Patito Pirata. 06: Bote de las Ratas | **El Patito Pirata** (tutorial y revancha) | Más legible y más chistoso; el Bote de Ratas es la etapa-arquetipo |
| 23 | **Cantidad de misiones** | balance/08: ~2 por nivel de Reino (~90) | **108** (4 cadenas) | Cubren todos los tutoriales; ~+20% de premios de misión (pequeño; re-simular si hace falta) |
| 24 | **Contenido no simulado** | `balance.meta.not_simulated` | Microeventos, secretos, mutaciones, rasgos, reliquias, artefactos, tipos de arma/escudo, Encargos y Duelos son **solo de combate o indexados a la producción** | No mueven la curva de oro validada |
| 25 | **Gemas de secretos** | balance las lista sin número | 2 por secreto (4 en Ruinas y Atolón): ~18 en total | Queda dentro de 140–170 por capítulo |
| 26 | **Elementos "???" antes de descubrirlos** | Zona 4 (Magia) se pelea antes del Reino 24; Zona 5 (Cósmico) antes del Jefe 5 | El icono se muestra como **"???" con glitch** hasta descubrirlo | Convierte la inconsistencia en misterio (Archangel de DC) |
| 27 | **Vapor Ronin −30% oro** | CHARLA (Revenant) | Se aplica (`goldMod 0.7`), marcado como no simulado | Petición explícita; efecto mínimo |
| 28 | **c_fosil → c_guijarro** | balance renombró la especie Común de Tierra | id `c_guijarro` "Guijarro" (arte: Fósil Guardián tintado, cría de Gea) | Ids siempre iguales a balance |

---

## Anexo A — Integración con el prototipo
- `battle/ship.ts`: agregar materiales `stone` (120) y `canvas` (30); agregar `ModuleKind` `pantry, pump, anchor, bridge, tower, bulkhead`; `kind: 'arcane'` = Sala de Invocación; la vida de celdas 'H' viene de `HULL_BY_MK[mk].cellHp`; mantener "un módulo muere con > 50% de celdas perdidas".
- `battle/blueprints.ts`: reemplazar por `04-content.json → ships[]` (letras de casco: `H` = material del Casco por Mk, `W/I/S/C/B` fijos).
- `battle/ballistics.ts`: agregar `gravityMul` por disparo (ya existe), velocidad submarina de torpedo, homing de runas (giro máx. 25°/s), atracción de orbes cósmicos, perforación DDA; misma función para IA y vista previa.
- `art/catArt.ts`: `ELEMENT_FX` ya tiene fire/water/nature/earth/magic/cosmic/void; usar `electric` como skin de `storm` (o renombrar); agregar `applyTint(sprite, tint)` (ColorMatrixFilter + overlay + decal) y retratos con estado.
- `island/terrain.ts`: agregar bioma `reef`; las regiones salen de `expansions[].region`.
- `fx/`: recetas de juice por evento como datos (07 §7.2), RewardQueue (07 §4.4).
- Nuevo `sim/combat/`: estado de batalla serializable (03 §8.6) + PRNG con semilla; `sim/economy/`: fórmulas de balance (mismas que `sim.py`).

## Anexo B — Mapa de `04-content.json`
`meta` (conteos) · `elements` · `affinity` · `materials` · `statuses` · `catStatuses` · `koSequence` · `reactions` · `roles` · `workers` · `traits` · `mutations` · `catdexSets` · `tintDecals` · `cats` (54) · `catdexTeaser` · `resonanceRules` · `resonanceRecipes` · `secretRecipes` · `ships` · `modules` {families, utility, relics, artifacts} · `volley` · `shipArt` {renderSpec, hullSkinsByMk, playerShips, enemyFactions} · `aiDifficulty` · `enemyArchetypes` · `bosses` · `elites` · `enemies` (6 zonas x 9 etapas + encargos) · `missions` (108) · `events` {rules, micro, flashTypes, flashSchedule, flashBalance, heroic, special} · `expansions` · `automation` · `kingdomMilestones` (Reino 1–50) · `story` {characters, beats, defeatCopy}.

Conteos de esta versión: `{{TABLE:counts}}`
