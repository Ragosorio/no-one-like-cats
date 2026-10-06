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

| Elemento | Nv10 | Nv20 | Nv30 | Nv40 |
|---|---|---|---|---|
| 🔥 | **Bola Grande**: +25% radio de explosión. | **Brasa**: Ardiendo se aplica aunque la celda no sea inflamable (2 turnos). | **Deflagración**: Salpicadura: 50% del daño a los módulos vecinos del impacto. | **Meteorito**: 10% (PRNG con semilla) de que el disparo se vuelva meteorito: x2.5 y perfora 1 capa. |
| 💧 | **Corriente**: +25% radio y +0.2 s de recorrido submarino. | **Marea**: Mojado se aplica en un área 3x3. | **Presión**: La brecha abre también el compartimento vecino (si comparte mamparo). | **Tsunami**: 10%: una ola empuja el barco enemigo 1 celda hacia atrás y moja TODO su casco. |
| 🌿 | **Brote Doble**: Dispara 2 semillas (spread 6°). | **Espinas**: Enraizado dura +1 turno y el DoT +25%. | **Bosque**: La enredadera se extiende 2 celdas por turno. | **Árbol Ancestral**: 10%: crece un árbol que levanta la cubierta: x2.5 a la celda y 50% a las 4 vecinas. |
| 🪨 | **Peñasco**: +25% radio. | **Fractura**: +1 capa de perforación. | **Sismo**: Al impactar, todas las celdas enemigas con 1 solo apoyo reciben 30% del daño. | **Monolito**: 10%: cae un monolito vertical x2.5 que atraviesa 4 pisos. |
| ⚡ | **Arco**: Conducción/cadena +1 celda; ráfaga empuja +1 celda. | **Estática**: Cargado dura 2 turnos; Corriente dura 2 turnos. | **Tormenta**: Cada disparo lanza un rayo secundario (30%) a un módulo aleatorio (PRNG). | **Juicio**: 10%: rayo del cielo x2.5 que ignora cobertura y camarotes. |
| ✨ | **Runa Doble**: Al impactar suelta una segunda runa al 40%. | **Maldición**: Maldito dura 2 turnos. | **Sello**: El módulo impactado queda Sellado (desactivado) 1 turno. | **Grimorio**: 10%: lluvia de 5 runas a x0.6 cada una sobre módulos distintos. |
| 🌌 | **Órbita**: +25% radio de atracción. | **Ingravidez**: Ingrávido dura 2 turnos. | **Pozo**: Cada impacto deja un pozo de 1 turno (−precisión enemiga: vista previa −30%). | **Colapso**: 10%: mini agujero negro x2.5 que arranca hasta 3x3 celdas. |

- Además, cada gato tiene **★3 (efecto secundario)** y **★5 (pasiva de maestría)** propios (3. Roster) y ★4 cambia el VFX del ataque y su grito gana sufijo ("HAIRBALL IGNITION — KAI!!"), ★6 = Forma Ascendida (corona/halo, paleta invertida en el ultimate; T4).
- KL6 Alimentar hasta Nv X (barrido 15→16→17…, intermedios T0, último T1/T2). KL28 Auto-alimentar por hábitat.

### 2.4 Elementos

**Lista final del Cap. 1 y orden de descubrimiento** (= `balance:elements`; decisión documentada en 9): 🔥 Fuego, 💧 Agua, 🌿 Naturaleza (inicio) → 🪨 Tierra (Jefe 1) → ⚡ Tormenta (Jefe 2) → ✨ Magia (Reino 24, Heraldo del Arcanista) → 🌌 Cósmico (Jefe 5) → 🕳️ Vacío (solo teaser, Cap. 2). El **hielo no es elemento**: es la reacción Ventisca (Mojado + ráfaga ⚡). El Espíritu queda para un capítulo futuro (rumor en la Marea Fantasma).

Regla de diseño (06 §3.1): cada elemento nuevo trae (1) un estado/interacción física nueva, (2) hábitat y cristal nuevos, (3) Resonancias nuevas. Antes de descubrirlo, los enemigos que lo usan muestran su icono como **"???" con glitch** (Zona 4 antes del Reino 24, Zona 5 antes del Jefe 5).

| Elemento | Orden / cómo se descubre | Verbo | Disparo base | Estado | Fuerte vs (gato) | Débil vs | Dimensión de estilo |
|---|---|---|---|---|---|---|---|
| 🔥 **Fuego** | 1. `start` — Inicial (Canelo). | Incendiar | Bola parabólica (gravedad x1.0) que rebota 1 vez y explota (radio 1.5 celdas, caída lineal). Aplica Ardiendo. | ardiendo | Naturaleza | Agua | ANIME INFERNO |
| 💧 **Agua** | 2. `start` — Inicial (Gelatino). | Inundar | Torpedo: vuela parabólico hasta tocar el agua; desde ahí avanza recto 0.4 s bajo la línea de flotación (no lo frena el viento) y explota contra la primera celda de casco (radio 1.2). Si impacta bajo la línea de flotación abre BRECHA. Aplica Mojado. | mojado | Fuego | Tormenta | NOIR OCEÁNICO + ukiyo-e |
| 🌿 **Naturaleza** | 3. `start` — Inicial (Brote). | Enraizar | Semilla parabólica que se planta en la primera celda que toca (daño directo bajo). Al FINAL de cada turno del dueño, la enredadera hace daño (DoT) a su celda y se extiende 1 celda (máx. 3 turnos). Aplica Enraizado (un cañón o motor Enraizado no puede usarse). | enraizado | Tierra | Fuego | ACUARELA (Gwen) + sakura |
| 🪨 **Tierra** | 4. `boss:1` — Jefe 1: el barco del Capitán Bigotes Rotos llevaba un fósil vivo en la bodega (Gea). | Perforar | Roca pesada: gravedad x1.6 (alcance corto), perfora 2 capas de celdas (DDA) y explota en la tercera (radio 1.0). Sin estado. Bajo la línea de flotación abre BRECHA. Contra Congelado provoca ESTALLIDO. | — | Tormenta | Naturaleza | DIARIO DEL MAR (grabado/xilografía) |
| ⚡ **Tormenta** | 5. `boss:2` — Jefe 2: la Gárgola Ronroneante despierta una tormenta permanente (Tronador). | Electrocutar / Soplar | Dos variantes (cada gato usa una). RAYO: casi recto (gravedad x0.2), muy preciso, poco daño estructural; aplica Cargado; contra hierro = SOBRECARGA; contra Mojado = CONDUCCIÓN. RÁFAGA: recta, sin gravedad, empuja (gatos expuestos y escombros 1-2 celdas), deja CORRIENTE (desvía el próximo proyectil enemigo); contra Mojado = VENTISCA (Congelado). | cargado | Agua | Tierra | CÓMIC SILVER AGE (Kirby krackle) |
| ✨ **Magia** | 6. `kl:24` — Reino 24: una grieta se abre sobre la isla y llega el Heraldo del Arcanista. Su gato levanta el primer ESCUDO MÁGICO (¡CLANK!). Al vencerlo: Núcleo Arcano → MAGIA. | Hechizar | Runa teledirigida suave: tras 0.3 s de vuelo gira hasta 25°/s hacia el módulo marcado (clic derecho al apuntar) o hacia el centro de masa enemigo. Aplica Maldito (próximo daño recibido x1.5 y revela la vida). Con cualquier estado presente = AMPLIFICAR. | maldito | Cósmico | Cósmico | ORQUÍDEA REAL (tarot, art nouveau, foil) |
| 🌌 **Cósmico** | 7. `boss:5` — Jefe 5: la Estrella Errante cae al mar (Astra Prima). | Atraer | Orbe lento (velocidad x0.7) con gravedad propia: su trayectoria se curva hacia la masa (celdas) más cercana en un radio de 3 celdas. Aplica Ingrávido: las celdas sueltas (sin soporte) flotan 1 turno y luego caen sobre el barco como LLUVIA DE ESCOMBROS. | ingravido | Magia | Magia | NEÓN GLITCH (datamosh) |
| 🕳️ **Vacío** | 8. `chapter:2` — Al hundirse el Leviatán: UNKNOWN ELEMENT DETECTED. CONTINUARÁ. (No jugable en el Cap. 1; solo lo usa el Barco del Vacío.) | Devorar | Proyectil que atraviesa materia y BORRA celdas (no se pueden reparar). DEVORAR: elimina escudos, estados y segundas vidas. | vacio | — | — | NOIR INVERTIDO + ruido de transmisión |

**Afinidad gato-contra-gato** (y contra escudos elementales; solo cuenta el elemento PRIMARIO del defensor): ciclo de cinco **🔥 > 🌿 > 🪨 > ⚡ > 💧 > 🔥** (fuerte x1.5, débil x0.75) y par opuesto **✨ ⇄ 🌌** (x1.5 mutuo, neutros contra los cinco: un elemento nuevo agrega una capa, no reemplaza la anterior). El atacante usa el elemento de SU DISPARO. UI: "¡SÚPER EFECTIVO! x1.5" / "poco efectivo…".

**Materiales** (la estructura usa materiales, no afinidad; multiplicador por elemento del disparo):

| Ataca ↓ / Material → | Madera | Lona (velas) | Hierro | Piedra | Cristal / Coral arcano | Hueso (Leviatán, fantasmas) | Vacío (solo enemigos teaser) |
|---|---|---|---|---|---|---|---|
| 🔥 Fuego | x1.5 | x2 | x0.75 | x0.75 | x1 | x1 | x0.5 |
| 💧 Agua | x1 | x1 | x0.75 | x1 | x1 | x0.75 | x0.5 |
| 🌿 Naturaleza | x1.25 | x1 | x0.75 | x1.25 | x1 | x1.25 | x0.5 |
| 🪨 Tierra | x1 | x0.75 | x1.25 | x1.25 | x1.5 | x1 | x0.5 |
| ⚡ Tormenta | x0.75 | x1.25 | x1.5 | x0.75 | x0.75 | x1 | x0.5 |
| ✨ Magia | x1 | x1 | x1 | x1 | x0.75 | x1.5 | x1 |
| 🌌 Cósmico | x1 | x1 | x1.25 | x1 | x1 | x1 | x1 |
| HP por celda | 60 | 30 | 140 | 120 | 90 | 110 | 200 |

Multiplicador combinado (afinidad × material × estados) acotado a **[x0.5, x3.0]**.

**Estados de celda / módulo:**

| Estado | Sobre | Turnos | Efecto |
|---|---|---|---|
| **Mojado** | celda | 2 | Habilita Conducción, Ventisca, Vapor y Florecer. Apaga Ardiendo al aplicarse. |
| **Ardiendo** | celda | 2 | DoT 15%/turno del daño original; se propaga 1 celda/turno por material inflamable (máx. 3 turnos). Las velas ardiendo caen sobre la cubierta. |
| **Congelado** | celda | 2 | Módulo desactivado; la celda es quebradiza: el siguiente impacto de Tierra o cañón = ESTALLIDO. |
| **Cargado** | celda | 1 | El siguiente rayo que toque la celda hace x1.25. Gatos en celdas Cargadas pierden 10 de medidor de ultimate. |
| **Enraizado** | celda | 2 | Cañones y motores Enraizados no se pueden usar. El fuego quema las enredaderas (y las elimina). |
| **Maldito** | celda/gato | 1 | El siguiente daño recibido x1.5 y se revela la vida exacta. |
| **Ingrávido** | celda | 1 | Las celdas sueltas flotan en vez de caer; al terminar caen como Lluvia de escombros (daño de caída x2). |
| **Revelado** | módulo/gato | 2 | Se ve su vida y recibe +20% de daño. |
| **Vapor** | zona | 2 | Nube: quien apunte A TRAVÉS de ella pierde la vista previa de trayectoria. |
| **Corriente** | campo | 1 | El siguiente proyectil enemigo se curva ±(1 celda) según la corriente (la IA lo considera). |
| **Sellado** | módulo | 1 | Módulo desactivado (no dispara en la andanada, no da escudo, no da medidor). |
| **Aturdido** | gato | 1 | El gato no puede actuar su próximo turno. |
| **Expuesto** | gato | — | Su camarote fue destruido: recibe daño directo x1.5, pero su próximo disparo hace +25% y no gasta recarga (¡GATO SUELTO!). |
| **Marcado** | módulo | 2 | El siguiente impacto en el módulo es crítico garantizado (x1.3). |

**Estados visibles sobre los GATOS** (feedback del usuario: se tienen que ver): el gato hereda los estados aplicables de las celdas de su camarote al resolverse cada impacto, y los recibe directo si está Expuesto o flotando.

| Estado | Regla | Cómo se ve |
|---|---|---|
| **En llamas** | DoT: 8% de su vida máxima al inicio de cada turno de su bando, 2 turnos. El Mojado lo apaga. Gatos 🔥 son inmunes. | Llamitas en 2s pegadas al contorno del sprite (flipbook de 3 frames, color del fuego), humo encima, el gato hace 'saltitos' de dolor cómicos. Número de DoT naranja. |
| **Electrocutado** | Al recibir un rayo ⚡: pierde 10 de medidor de ultimate. Si además está MOJADO: queda Aturdido (pierde su próximo turno). Gatos ⚡ son inmunes al aturdimiento. | Parpadeo de RAYOS X: 3 flashes alternando el sprite normal con una silueta azul eléctrico + esqueleto de gato dibujado en código (huesitos blancos) a ~8 fps durante 0.5 s; chispas Kirby krackle; pelo erizado (escala Y 1.06). |
| **Mojado** | 2 turnos. Apaga 'En llamas'. Habilita Electrocutado→Aturdido y Congelado. | Sprite tintado azul 15%, gotas que caen (partículas), orejas abajo (squash 0.95 Y), charquito bajo el gato. |
| **Congelado** | Pierde su próximo turno. El siguiente impacto de Tierra o andanada sobre su camarote le hace x1.5 (Estallido) y rompe el hielo. Gatos 💧 resisten: solo 50% de probabilidad (PRNG). | BLOQUE DE HIELO: rectángulo de cristal translúcido con bordes facetados encima del sprite (sprite desaturado y quieto), escarcha alrededor; al romperse, esquirlas + '¡KRASH!'. |
| **Maldito** | El siguiente daño x1.5 y su vida se ve exacta. | Ojo violeta flotando sobre la cabeza; runas girando. |
| **Aturdido** | No actúa su próximo turno. | Estrellitas y pajaritos girando; ojos en espiral (overlay). |
| **Expuesto (¡GATO SUELTO!)** | Su camarote cayó: queda sobre la cubierta. Recibe x1.5 directo, pero su próximo disparo hace +25% y no gasta recarga. | Sale disparado del camarote con un salto en arco, cae de pie en la cubierta, se sacude; icono de signo de exclamación rojo. |

**Reacciones elementales** (cada una se registra la primera vez en el **Grimorio de Sinergias** con "¡SINERGIA DESCUBIERTA!", T2; icono + nombre + multiplicador siempre visibles):

| # | Reacción | Disparador | Efecto | Grimorio |
|---|---|---|---|---|
| 1 | **Conducción** | status=mojado, by=storm:rayo | El rayo salta a todas las celdas Mojadas conectadas (4-vecinas, máx. 6) con x1.5 y Aturde 1 turno a los gatos de esas celdas. | _Agua + electricidad. Tu abuela te lo advirtió._ |
| 2 | **Incendio** | element=fire, material=['wood', 'canvas'] | Ardiendo se propaga 1 celda por turno (máx. 3 turnos); las velas ardiendo caen sobre la cubierta (daño de caída). | _La madera arde. Sorpresa nula, satisfacción total._ |
| 3 | **Vapor** | status=mojado, by=fire, or={'status': 'ardiendo', 'by': 'water'} | Apaga el fuego y crea una nube de Vapor 3x3 durante 2 turnos: el rival pierde la vista previa si apunta a través. | _Fuego + agua = sauna de guerra._ |
| 4 | **Ventisca** | status=mojado, by=storm:rafaga | Las celdas Mojadas golpeadas por la ráfaga quedan Congeladas 2 turnos (módulos desactivados). | _Moja, sopla, congela. El hielo no es un elemento: es una consecuencia._ |
| 5 | **Estallido** | status=congelado, by=['earth', 'cannon'] | x2 a la celda congelada y esquirlas (x0.5) a sus 4 vecinas. | _Lo congelaste. Luego le aventaste una piedra. Eres un genio malvado._ |
| 6 | **Brecha** | by=['earth', 'water'], where=bajo línea de flotación | Abre el compartimento: se inunda 25% al final de cada turno (bombas de achique: −50%). Si el agua alcanza el núcleo, el barco se hunde. | _Un hoyito abajo vale más que diez arriba._ |
| 7 | **Avivar** | status=ardiendo, by=storm:rafaga | El fuego se propaga 2 celdas de golpe y hace +50% de daño este turno. | _Soplarle al fuego: técnica milenaria de las abuelitas y los pirómanos._ |
| 8 | **Florecer** | status=mojado, by=nature | La enredadera crece el doble (2 celdas/turno) y su DoT +50%. (El fuego la quema: contraataque natural.) | _Riega tu jardín… en el barco del enemigo._ |
| 9 | **Sobrecarga** | by=storm:rayo, target=['iron', 'escudo'] | Contra hierro (cañón, motor, núcleo): módulo desactivado 1 turno. Contra un escudo: rompe 1 capa y Aturde al gato que lo sostiene. | _Los escudos odian los rayos. Los rayos aman a los escudos._ |
| 10 | **Amplificar** | by=magic, status=cualquiera | Duplica la duración restante y la potencia de los estados presentes en la celda. | _La magia no inventa nada: solo exagera. Como tú en tus historias._ |
| 11 | **Lluvia de escombros** | status=ingravido, by=colapso | Los trozos sueltos Ingrávidos caen sobre el barco con daño de caída x2 (Meteorito si además había Tierra: x3). | _Lo que sube, baja. Encima de tu enemigo, de preferencia._ |
| 12 | **Devorar (teaser)** | by=void | Elimina escudos, estados y segundas vidas; las celdas borradas no se reparan. Solo el Barco del Vacío lo usa en el Cap. 1. | _???_ |

### 2.5 Gatos

**Ficha de cada gato** (todo en `04-content.json → cats[]`): especie (id de balance), nombre propio editable, elementos (1–3), rareza, rol de combate, oficio (económico, de balance), rasgo, mutación (0–1), nivel, estrellas, orbes, historia de obtención ("Momentos").

**Stats de economía** (balance): `oro base/s` por rareza (Común 0.5 → Mítico 3.2, x6.4: **la rareza paga en economía**), `poder base` (5.0 → 7.4, solo x1.48), `food_mult` (1.0 → 2.4), orbes por duplicado y por estrella.

**Stats de combate** (contenido): `vida = roles[rol].hp × catShare` (catShare 2.9.8), `recarga` en turnos tras disparar (Común 0 · Raro 1 · Épico 1 · Legendario 2 · Mítico 2, salvo excepción), **disparo normal** (arquetipo del elemento + daño interno + radio + proyectiles + rebotes + perforación + estado), **ultimate** (medidor 100, ver 2.9.4), **limitación** (los "rotos"), **pasiva** (siempre activa), ★3, ★5.

**Roles:** Artillero (100 vida), Demoledor (95), Francotirador (80), Asediador (90), Soporte (90), Tanque (150), Controlador (85), Invocador (85).

**Rareza ≠ poder bruto.** Común = disparo simple y fiable cada turno. Raro = un giro (multidisparo, marca, retardo). Épico = poder alto + limitación fuerte (los arquetipos rotos de la CHARLA). Legendario (Primordial) = firma de su elemento + aura +10% para su elemento. Mítico = absurdo + condición dura. Regla de presupuesto (03 §9.10): `poder × disponibilidad ≈ constante`; todo roto tiene (1) telegrafía visible, (2) contra-juego, (3) tope por acción.

**Los rotos de la CHARLA, todos presentes:** UNA BALA (Supernova — Starfall 1 vez por batalla, atraviesa 3 pisos), SEGUNDA VIDA (Vapor Ronin — revive 60%, −30% oro), VENGANZA/BERSERK (Rencor — x1.5/x2/x5 por aliado caído, solo = 2 acciones por turno), 3 ESCUDOS (Bastión — cada escudo baja su precisión), CARGA 2 TURNOS (Singularidad — "SINGULARITY CHARGING 1/2", "¡MATEN A ESE YA!"), CAÑÓN DE CRISTAL (Plasmín), INESTABLE (Pixel Glitch, Canelo Infernal), CARGA (Meteoro), retardo (Merlina, Nebulosa).

**Estrellas y orbes** (`balance:cats.stars`, `rarities.star_orbs_base`): ★2 (Nv10) +stats · ★3 (Nv20) efecto secundario · ★4 (Nv30) el ataque cambia visualmente · ★5 (Nv40) pasiva de maestría · ★6 (Nv50) Forma Ascendida. Se sube en el **Altar de Almas** (storyboard g). Duplicado → orbes (nunca decepciona: "¡ME FALTABAN 35!"). Orbes de especies que aún no tienes se **guardan** y su ficha pasa a "Rumor". Prisma = comodín.

**Rasgos** (uno por gato al nacer: 70% el de su especie, 30% aleatorio; heredable desde KL30). Solo efectos de combate:

- **Impaciente**: +10% daño en su primer disparo de la batalla.
- **Pirómano**: Ardiendo que aplica dura +1 turno.
- **Glotón**: La Despensa le cura el doble. (En la isla come con ¡ÑAM! más ruidosos.)
- **Dormilón**: Empieza con 50 de medidor de ultimate, pero no puede actuar en el turno 1.
- **Chismoso**: Al impactar revela la vida de los gatos del módulo vecino.
- **Bravucón**: +15% daño contra el gato enemigo con más vida.
- **Miedoso**: Si su camarote recibe daño se esconde: −50% daño recibido 1 turno, pero no dispara ese turno.
- **Presumido**: Sus críticos le dan +10 de medidor de ultimate.
- **Rencoroso**: +10 de medidor cuando un aliado es golpeado en su camarote.
- **Curioso**: Su vista previa de trayectoria es +20% más larga.
- **Perezoso**: Recarga +1, daño +20%.
- **Leal**: Si el gato del Puente de mando cae KO, +30% daño el resto de la batalla.
- **Travieso**: 10% (PRNG) de que su proyectil rebote una vez extra.
- **Callejero**: +10% daño en Duelos de Gatos.

**Mutaciones** (desde KL20, 8% por Resonancia, x2 si ambos padres viven en el mismo hábitat; el elemento del hábitat sesga cuál sale — así "la ciudad participa en cómo evolucionan tus gatos" y la variante *Scorched* de la CHARLA existe). Solo combate:

- **Conductividad** (CHARLA): Sus impactos sobre celdas Mojadas aplican Cargado; si es eléctrico, la Conducción salta +2 celdas. _(sesgo de hábitat: Tormenta)_
- **Chamuscado (Scorched)** (CHARLA): Su disparo deja Ardiendo 1 turno en la celda de impacto. Pelaje con brasas (decal). _(sesgo de hábitat: Fuego)_
- **Escarchado**: 15% de Congelar las celdas Mojadas que golpea. Pelaje con escarcha. _(sesgo de hábitat: Agua)_
- **Musgoso**: Su camarote regenera 5% de vida por turno. _(sesgo de hábitat: Naturaleza)_
- **Fosilizado**: +20% vida. _(sesgo de hábitat: Tierra)_
- **Rúnico**: Maldito que aplica dura +1 turno; runas tatuadas en el pelaje. _(sesgo de hábitat: Magia)_
- **Estelar**: Sus proyectiles se curvan levemente (5°/s) hacia el núcleo enemigo. _(sesgo de hábitat: Cósmico)_
- **Doble Cola**: 8% de disparar un segundo proyectil al 50%. _(sesgo de hábitat: ninguno)_
- **Gigantismo**: +15% radio de explosión, −10% longitud de vista previa. Sprite 1.15x. _(sesgo de hábitat: ninguno)_
- **Eco Paterno (Linaje)** (CHARLA): Hereda UN modificador de disparo de un padre: +1 proyectil, +1 rebote o +1 capa de perforación (lo que el padre tenga). Ej.: Fireball + Triple Shot = Triple Fireball. Solo desde el hito de Reino 'Linaje'. _(sesgo de hábitat: ninguno)_
- **Bigote Dorado**: Cosmético: variante dorada con foil en la Battle Form. Sin efecto de combate (orgullo puro). _(sesgo de hábitat: ninguno)_

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

- **Pimentón + Gelatino** (ejemplo: ambos Nv20, suma de rangos de rareza 1): Vapor Ronin 13.2% · Neblino 10.15% · Pimenton 10.15% · Nenufar 10.15% · Canelo 9.31% · Chispa 9.31% · Gelatino 9.31% · Burbujas 9.31% · Brote 9.31% · Musgo 9.31% · **??? 0.51%**
- **Canelo Infernal + Galaxia** (ejemplo: ambos Nv20, suma de rangos de rareza 4): Neblino 7.18% · Magmito 7.18% · Fanguito 7.18% · Solar 7.18% · Canelo 6.58% · Chispa 6.58% · Gelatino 6.58% · Burbujas 6.58% · Terron 6.58% · Guijarro 6.58% · Cometin 6.58% · Lunita 6.58% · Vapor Ronin 4.55% · Canelo Infernal 4.55% · Galaxia 4.55% · Meteoro 4.55% · **??? 0.48%**
- **Marejada + Astral** (ejemplo: ambos Nv30, suma de rangos de rareza 2): Marejada 7.46% · Marea Encantada 7.46% · Runa Chispa 7.46% · Astral 7.46% · Galaxia 7.46% · Supernova 7.46% · Gelatino 6.84% · Burbujas 6.84% · Voltio 6.84% · Nimbo 6.84% · Linterna Espiritu 6.84% · Caramelo Alquimista 6.84% · Cometin 6.84% · Lunita 6.84% · **??? 0.5%**
- **Canelo + Gelatino** (ejemplo: ambos Nv1, suma de rangos de rareza 0 (al inicio del juego: solo 🔥💧🌿 descubiertos)): Neblino 35.09% · Canelo 16.08% · Chispa 16.08% · Gelatino 16.08% · Burbujas 16.08% · **??? 0.58%**
- **Canelo + Brote** (ejemplo: ambos Nv1, suma de rangos de rareza 0 (al inicio del juego: solo 🔥💧🌿 descubiertos)): Pimenton 35.09% · Canelo 16.08% · Chispa 16.08% · Brote 16.08% · Musgo 16.08% · **??? 0.58%**

**Gatos secretos ("???")** — 6, todos con dos rutas (una de suerte con pista, una fija):

| Secreto | Arte | Elementos | Rareza (stats) | Ruta A (Resonancia → bucket ???) | Ruta B (fija) | Pista ('Rumor') |
|---|---|---|---|---|---|---|
| **Mochi Maneki** | `mochi_bell_cat` | ✨ | Épico | Dos padres con oficio Banquero (balance worker 'banker'), ambos Nv15+. | 10.º Gato Callejero. | Dicen que aparece cuando dos gatos que cuidan el oro se ponen de acuerdo… o cuando ya rescataste a demasiados callejeros. |
| **Pixel Glitch** | `neon_glitch_cat` | ⚡🌌 | Épico | Unión de padres incluye ⚡ y 🌌, con un Evento Flash activo. | Microevento Error 404. | Algo se mueve entre píxeles cuando el cielo se rompe. |
| **Sonata Prima** | `sonata_prima_cat` | ✨🌌⚡ | Mítico | Unión de padres cubre ✨, 🌌 y ⚡; ambos Nv30+. | Santuario Gatuno Antiguo (Ruinas Arcanas). | En las ruinas, una partitura espera a quien conozca la magia, las estrellas y el trueno. |
| **Lumen** | `lumen_lens_cat` | 🔥💧🌿 | Legendario | Unión de padres cubre 🔥, 💧 y 🌿; ambos ★3+. | Registrar 40 especies. | Llega cuando tu colección vale la pena retratarse. |
| **Eclipse** | `selene_moonlit_cat` (tinte) | 🔥🌌 | Legendario | Uno de los padres es Solar (r_solar) y el otro tiene 🌌; uno de los dos Nv20+ (CHARLA). | Ganar con Solar y Lunita a bordo durante Estrella Fugaz. | Dicen que aparece cuando un gato de sol y uno de luna pelean del mismo lado. |
| **Velo Noctis** | `masquerade_phantom_cat` | 💧✨ | Legendario | No sale por Resonancia. | Historia: tras el jefe final. | Algunas rivales no se vencen: se convencen. |

### 2.7 Catdex

**Niveles de cada entrada** (05 regla 22):
- **???** — si conoces sus elementos: silueta negra + iconos de elemento + "???". Si es secreto: carta sellada sin silueta y, cuando encuentras su pista, una línea de **pista**.
- **Rumor** — la viste en una tabla de Resonancia, la usó un enemigo, tienes orbes suyos o leíste una botella: nombre, silueta, elementos, "posibles padres" y "condiciones conocidas" (formato de la CHARLA: "🌑 Eclipse · probabilidad conocida · posibles padres · condiciones").
- **Registrado** — la tienes: arte a color, stats, ataque en mini-clip, Momentos ("la sacaste a las 2:41 h de juego con Neblino y Canelo", primera ultimate, MVPs).
- Contador grande **"x/54"** + fila de elementos `🔥💧🌿 ??? ??? ??? ???` que se revela; tras el final aparece una página **"Próximo mar: ???"** con la silueta 🕳️ (no cuenta para el 54/54; el capítulo es completable al 100%).
- Cada especie nueva: +2% de oro global (balance), gemas por rareza (`discovery_gems`), Ronroneo `new_species`, Momentum.
- Pestañas: Gatos · Sets · **Grimorio de Sinergias** (12 reacciones con "?" hasta descubrirlas) · Momentos.

**Sets** (completar uno da `balance:orbs.prisma_from_catdex_set` Prismas + Ronroneo `catdex_set` + **una regla nueva**, T3):

- **Brasas del Hogar** (Canelo, Chispa, Ignis): Ardiendo dura +1 turno para todos tus gatos.
- **Hijos de la Marea** (Gelatino, Burbujas, Abisa): Tus torpedos atraviesan 1 mamparo.
- **Raíz y Brote** (Brote, Musgo, Silvana): Tus enredaderas curan 3% a tus módulos adyacentes al final de turno.
- **Piedra Viva** (Terrón, Guijarro, Gea): Tus rocas perforan +1 capa.
- **Ojo de la Tormenta** (Voltio, Nimbo, Tronador): La Conducción salta a 8 celdas (en vez de 6).
- **Biblioteca Arcana** (Linterna Espíritu, Caramelo Alquimista, Merlina): Maldito revela además los camarotes ocultos del módulo.
- **Polvo de Estrellas** (Cometín, Lunita, Astra Prima): Tus pozos de gravedad duran +1 turno.
- **Familia del Vapor** (Neblino, Vapor Ronin, Marea Encantada): Tus nubes de Vapor también bajan 20% el daño de los tiros que las cruzan.
- **Los Rotos** (Supernova, Rencor, Bastión, Vapor Ronin, Singularidad): Las ultimates de 'una vez por batalla' cargan con 25 de medidor inicial.
- **Gatos de Oficio** (Chispa, Gelatino, Musgo, Voltio): Cambiar a un gato de trabajador a tripulación no tiene espera (QoL).
- **Los Siete Orígenes** (Ignis, Abisa, Silvana, Gea, Tronador, Merlina, Astra Prima): Tus Primordiales empiezan cada batalla con la ultimate al 50%. (Set de prestigio del capítulo.)

### 2.8 Barcos, módulos y astillero

**Propósito:** el barco es tu build (pilar 1). Consume la misma economía (~48% del oro va al barco) y materiales que solo da el combate.

**Barcos** (`balance:ship.ships`; layouts por defecto en `04-content.json → ships[].hull/modules`, validados: rejilla conectada a la quilla, sin solapes, tripulación/armas/escudos = balance):

| Barco | Tripulación | Armas/Escudos/Motor/Núcleo (balance) | x Poder | Costo | Desbloqueo | Utilería | Artefactos | Perk / regla |
|---|---|---|---|---|---|---|---|---|
| **Balsa Bigotuda** | 3 | 1/0/0/0 | 1.0 | 0 | start | 1 | 0 | Balance: ninguno. Diseño: Sin Sala de Invocación por defecto: las ultimates cuestan 125 de medidor. |
| **Gorrion** | 4 | 2/0/1/0 | 1.1 | 1,500 | kl:5 | 2 | 0 | Balance: rapido: +1 disparo en el primer turno. Diseño: Perk de balance (+1 disparo en el primer turno): en tu turno 1 eliges DOS gatos (disparan uno tras otro) antes de la primera andanada. |
| **Merodeador** | 5 | 4/0/1/1 | 1.15 | 600K | kl:15 · gratis: Bandera Negra | 3 | 1 | Balance: +40% chatarra, bonus por modulo destruido. Diseño: Perk de balance: +40% chatarra y bonus por módulo destruido (cada módulo enemigo destruido suelta un cofrecito de chatarra extra que vuela a la UI). Gratis si ganas el evento Bandera Negra. |
| **Bastion** | 7 | 5/3/1/1 | 1.25 | 40.0M | boss:3 | 5 | 1 | Balance: +10% poder contra jefes; lento. Diseño: 3 ranuras de escudo; el más resistente para jefes. |
| **Bajel Arcano** | 6 | 3/2/1/1 | 1.4 | 800M | boss:4 | 4 | 2 | Balance: +20% poder contra enemigos de Magia o Cosmico, 2 ranuras de artefacto, cristales x1.5. Diseño: Transposición: 1 vez por turno intercambia 2 gatos de camarote sin gastar acción (como el 'barco fantasma que mueve gatos' de la CHARLA). Casco con celdas fijas de cristal ('C'): recibe x1.5 de Tierra. |

- **Barco activo** (el que pelea) se elige en el Mapa/Pre-batalla; el resto queda en el puerto (KL42: el libre farmea solo). "Un barco para cada pleito": Gorrión para Encargos de barco chico, Merodeador para farmear chatarra, Bastión para jefes (+10% contra jefes), Bajel para Zonas 4–6 (+20% contra Magia/Cósmico). La **Arca Celestial** es solo cinemática del prólogo y premio de la Marea Nueva / Cap. 2.
- **Poder de Barco (SP)** = `mult · (Σ ranuras poder_familia · 1.75^(Mk−1) + Σ poder de la tripulación) · (1 + perk situacional)` (08 §4.6). Se muestra grande en el astillero y en Pre-batalla junto a la probabilidad estimada.

**Familias y Mk** (`balance:ship.families` + `ship.mk`): Casco, Arma, Escudo (Jefe 3), Motor, Núcleo. Mk I → VII, **global por familia** (mejorar Armas mejora todas las armas de todos tus barcos). Costo `cost_base · 16^Mk_actual` Doblones + chatarra + planos (Mk III+) + cristales (Arma/Escudo/Núcleo Mk V+) + obra verde (20 s → 25 min). **Tope de Mk = jefes derrotados + 2.** Colas del astillero: 1 (+1 Puerto).

**Clases de casco** (cada Mk del Casco cambia material, arte y vida por celda: es la "reforja" de 06 sin reinicio):

| Mk | Nombre de clase | Material | Vida por celda | Look |
|---|---|---|---|---|
| 1 | Casco de Balsa | wood | 60 | tablas atadas con cuerda, parches |
| 2 | Balandra | wood | 75 | madera barnizada con bandas de cuerda |
| 3 | Fragata | iron | 90 | planchas de hierro remachadas, ojos de buey |
| 4 | Galeón | iron | 110 | hierro con ribetes dorados y mascarón de gato |
| 5 | Acorazado de Coral | crystal | 125 | coral arcano rosa-turquesa que brilla |
| 6 | Acorazado Arcano | crystal | 145 | coral con runas de foil dorado |
| 7 | Casco Celestial | crystal | 170 | cristal negro con constelaciones que se mueven (anuncia el Arca Celestial) |

**Tipos de arma** (sidegrades: el tipo se elige por ranura; el poder lo da el Mk). **Los cañones no son una acción del jugador:** disparan solos en la **andanada** al final de cada turno (2.9.3).

| Tipo de arma | Desbloqueo | Disparo | Sinergia |
|---|---|---|---|
| **Cañón** | `start` | Bala parabólica fiable: 40 de daño, radio 1.2, en cada andanada. | Santabárbara +25%. |
| **Mortero de Magma** | `secret:expansion_3` | Tiro muy bombeado (gravedad x1.3) que cae sobre el objetivo desde arriba (ignora muros frontales), perfora 1, 45 de daño, radio 1.5, Ardiendo. | +15% si hay un gato 🔥 a bordo. |
| **Bobina Tesla** | `boss:2` | Rayo recto 30 de daño, Cargado; provoca Conducción si el objetivo está Mojado. | CHARLA: 1 gato ⚡ a bordo: +15% alcance de cadena. 2 gatos ⚡: los saltos +1. 1 gato 💧: enemigos Mojados reciben x1.5 eléctrico. |
| **Lanzaescarcha** | `secret:expansion_5` | 3 esquirlas en abanico (15 c/u); Congela las celdas Mojadas (Ventisca), Moja las secas. | Estallido con Tierra. |
| **Arpón del Leviatán** | `event:migracion_leviatan` | Arpón recto que se clava y TIRA: arrastra el módulo 1 celda hacia ti (rompe soportes). 35 de daño. Solo dispara en andanadas pares (cada 2 turnos). | Pieza exclusiva del evento ('ese lo conseguí en la migración'). |
| **Riel Arcano** | `boss:4` | Runa recta perforante (3 capas), 30 de daño, Maldito. | +25% si hay un gato ✨ a bordo. |
| **Starbreaker** | `event:estrella_fugaz` | UNA vez por batalla, solo: dispara en la primera andanada cuyo objetivo esté a ≤3 celdas del núcleo enemigo (o en la andanada del turno 4 como máximo). Atraviesa el casco completo (perforación infinita), 120 de daño. | Arma de trofeo del evento. |

**Tipos de escudo** (desde el Jefe 3; "los escudos con personalidad" de la CHARLA):

| Tipo de escudo | Desbloqueo | Regla |
|---|---|---|
| **Escudo Burbuja** | `boss:3` | Anula 1 impacto completo por turno; se regenera al inicio de tu turno. |
| **Escudo Espejo** | `secret:expansion_7` | 20% (PRNG) de reflejar el proyectil de vuelta. |
| **Escudo Arcano** | `boss:4` | Absorbe hasta 150 de daño elemental por turno; recibe x1.5 de daño físico (Tierra, cañón). |
| **Escudo Sacrificial** | `event:marea_fantasma` | Absorbe 200 en total; al romperse cura 30% a todos tus gatos. |
| **Escudo del Vacío** | `chapter:2` | TEASER bloqueado: no bloquea daño; teletransporta un proyectil al azar. 'Requiere 🕳️'. |

**Motor:** combustible por turno = 2 + floor(Mk/2) celdas de maniobra (Bastión x0.5). **Núcleo:** todo barco tiene un **Corazón** (objetivo de victoria); con ranura de Núcleo da medidor de ultimate a toda la tripulación al inicio de tu turno (+5/+10/+15 según Mk).

**Módulos de utilería** (no suman poder: son táctica; cuestan "puntos de utilería" del barco; desmontar devuelve 100%):

| Módulo | Puntos | Vivo | Destruido | Se desbloquea |
|---|---|---|---|---|
| **Mástil / Cofa** (`mast`) | 1 | Vista previa de trayectoria al 100% (sin mástil: 45%), revela la vida de los gatos enemigos y activa la Vista previa de colapso. | Apuntas 'a ciegas' (vista previa 45%) y sin vista previa de colapso. | `start` |
| **Sala de Invocación** (`arcane`) | 1 | Ultimates a costo normal (100 de medidor); necesaria para Supernova y Astra Prima. | Ultimates cuestan 125; las de 'Majestad'/'Una bala' quedan bloqueadas. | `mission:C11` |
| **Santabárbara** (`powder`) | 1 | +25% daño de la andanada (todos tus cañones). | EXPLOTA en radio 3 (80 de daño + Ardiendo), también a ti. | `start` |
| **Despensa de Pescaditos** (`pantry`) | 1 | Cura 5% de vida a todos tus gatos al inicio de tu turno. | Sin curación; suelta comida como botín para el rival (en PvE: tú no pierdes nada). | `mission:K06` |
| **Bombas de Achique** (`pump`) | 1 | −50% de inundación por turno en todos tus compartimentos. | Inundación completa. | `mission:C07` |
| **Ancla** (`anchor`) | 1 | Escora −50%; inmune a empujes de ráfaga y a la Corriente. | El barco se balancea más (la vista previa tiembla). | `expansion:3` |
| **Puente de Mando** (`bridge`) | 1 | Activa la Reliquia de capitán equipada; el gato asignado al Puente es el 'Capitán' (trait Leal). | Pierdes la pasiva de la Reliquia. | `boss:1` |
| **Torre Elemental** (`tower`) | 2 | Elige elemento al instalar: +15% daño de ese elemento; versión ⚡ = Torre Tesla: +1 salto de Conducción. | Pierdes la sinergia. | `expansion:5` |
| **Mamparo** (`bulkhead`) | 0 | Separa compartimentos de inundación (gratis, pero ocupa celda). | Los compartimentos vecinos se unen. | `mission:C07` |

**Reliquias de capitán** (1 por barco, requieren Puente de Mando vivo): 

- **Bigote Roto** (boss:1): +10% daño contra madera.
- **Ojo de Gárgola** (boss:2): Vista previa de trayectoria +25%.
- **Antifaz de Noctis** (event:bandera_negra): El primer golpe que recibe cada camarote por batalla hace x0.5.
- **Corona del Trueno** (event:heroica_1 (sprint)): Conducción +1 salto.
- **Ventosa del Kraken** (boss:3): Inmune a empujes y a la Corriente enemiga.
- **Grimorio del Arcanista** (boss:4): Maldito que apliques dura +1 turno.
- **Polvo de la Estrella Errante** (boss:5): Tus pozos de gravedad duran +1 turno; tus orbes cósmicos curvan +5°.
- **Diente del Primer Mar** (boss:6): +10% daño a todo. (Para el Mar Abierto y la Marea Nueva.)

**Artefactos** (1 uso por batalla, ranuras: Merodeador 1, Bastión 1, Bajel 2; gratis, se recargan solos cada batalla):

- **Kit de Reparación** (`mission:C17`): Repara 30% a un módulo propio.
- **Burbuja de Emergencia** (`mission:C19`): Escudo de 1 impacto sobre un módulo.
- **Bomba de Humo** (`mission:C17`): El rival pierde la vista previa 2 turnos.
- **Ancla de Emergencia** (`mission:C20`): 1 turno inmune a hundimiento, empujes y Corriente.
- **Catnip Táctico** (`mission:C23`): Un gato no gasta recarga este turno y hace +20%.
- **Bengala** (`mission:E13`): Revela todo el barco enemigo (vida, camarotes, punto débil) 2 turnos.

**Astillero (pantalla, EDITORIAL SUIZO + plano técnico azul):**
- Izquierda: lista de barcos (comprar/seleccionar activo). Centro: **rejilla del barco** (celdas de 34 px) con la ilustración encima; arrastrar módulos y camarotes a celdas válidas (reglas: el mástil va en la cubierta superior; el motor en las 2 filas sobre la quilla; el Corazón a ≥1 celda del borde; los camarotes tocan cubierta o casco; todo debe conectar con la quilla — la UI marca en rojo lo que se caería). Derecha: familias con su Mk, costo y botón Mejorar (obra verde con Ronroneo), tipos de arma/escudo por ranura, tripulación (arrastrar gatos a camarotes; muestra su disparo y sinergias: "Bobina Tesla + 2 gatos ⚡ = +1 salto").
- **Vista previa de colapso** al pasar el ratón ("si cae esto, caen 7 celdas, incluido el Cañón 2").
- **Botón Probar:** batalla de práctica contra un muñeco (barco de entrenamiento indestructible que muestra daño por tiro), sin botín ni Ronroneo.
- Poder de Barco grande, con la diferencia que haría cada mejora ("+12%").

**Arte de barcos: ilustraciones continuas que se rompen en trozos ilustrados** (feedback del usuario):

1. Cada barco es UNA ilustración continua estilo caricatura/anime de piratas (contorno de tinta grueso y variable, colores planos con 2 tonos de sombra, brillo especular, proporciones exageradas tipo juguete). Referencia de sensación: juegos móviles de piratas cartoon; nunca copiar diseños concretos.
2. La ilustración se GENERA EN CÓDIGO a partir de la rejilla lógica: (1) contorno del casco = marching squares sobre las celdas + suavizado Chaikin x2 → curva orgánica (proa afilada, popa redondeada); (2) relleno por material del Mk del Casco con patrón (tablones, remaches, coral, constelaciones); (3) módulos dibujados encima como piezas de la misma ilustración (cañones asomando por troneras, camarotes con ventana redonda donde se ve al gato, mástil con velas de lona y bandera de facción, chimeneas, faroles); (4) detalles de facción (mascarón, banderines, parches).
3. Se renderiza a una RenderTexture (cols x 34 px, rows x 34 px, x2 para nitidez) al entrar a la batalla. La rejilla lógica NO se ve: solo la ilustración.
4. Destrucción: al morir una celda se 'muerde' la ilustración con una máscara de borde dentado (ruido) y en el borde aparece el INTERIOR del material (madera astillada clara, hierro con remaches rojos de calor, coral con brillo interno, hueso). Daño parcial: decals de grietas en 3 estados por celda (66/33/10% de vida).
5. Trozos: cada componente desconectado por el BFS se recorta de la MISMA textura (sprite con máscara de sus celdas + borde dentado) y se vuelve cuerpo físico que gira, choca, salpica y se hunde. Así un barco se parte en pedazos que siguen siendo 'el mismo dibujo'.
6. Retroceso: al disparar un gato o una andanada, el barco entero hace recoil (−8 px en X opuesto al tiro y 1.5° de inclinación, resorte que vuelve en 300 ms) además del balanceo por oleaje (senoidal, visual).
7. Agua: el barco se dibuja con su línea de flotación cortada por una capa de agua frontal semitransparente (el prototipo ya tiene sea.frontLayer).

Skins de casco por Mk (se aplican a TODOS tus barcos):

- **Mk 1-2**: Madera de balsa → balandra barnizada (cafés cálidos, cuerdas, parches).
- **Mk 3-4**: Hierro remachado → galeón con ribetes dorados (gris azulado, dorado, ojos de buey).
- **Mk 5-6**: Coral arcano (rosa-turquesa con brillo interno; runas de foil en Mk VI).
- **Mk 7**: GALEÓN NEÓN CÓSMICO: casco negro con líneas neón cian/magenta, velas de constelaciones que se mueven, estela de estrellas (adelanto del Arca Celestial).

Barcos del jugador:

- **Balsa Bigotuda**: Balsa de tablones con una palmera chiquita, vela remendada con un calcetín, bandera de huellita.
- **Gorrión**: Balandra afilada roja con franja crema, mascarón de gorrión-gato, vela triangular.
- **Merodeador**: Bergantín pirata negro, bandera con calavera de gato y huesos de pescado, cofres en cubierta.
- **Bastión**: Acorazado-fortaleza con torretas en forma de orejas de gato, chimeneas, placas gruesas.
- **Bajel Arcano**: Galeón violeta con velas de pergamino escritas, faroles flotantes, casco con celdas de cristal brillante.

Facciones enemigas (cada zona es una facción con silueta y paleta propias; el jugador sabe dónde está por cómo se ven los barcos):

| Facción | Zona | Paleta | Material | Silueta | Cómo se rompe | Jefe |
|---|---|---|---|---|---|---|
| **Piratas de la Bahía Sardina** | 1 | #8A5A2E #C99358 #C8102E #EDE4D6 | madera parchada | botes, chalupas y pesqueros chuecos; velas con remiendos; bandera de sardina con parche | astillas claras, sardinas que saltan del interior | La Sardina Furiosa (barriles de pólvora en cubierta) |
| **Guardia de Piedra** | 2 | #6F6A5E #B9B2A0 #4F8F4A #171317 | piedra con musgo | fortalezas flotantes y torres con almenas, gárgolas en las esquinas | bloques de piedra con musgo, polvo | El Risco Flotante (gárgola enorme en la proa) |
| **Flota del Kraken** | 3 | #3569A3 #172B35 #FFD400 #00E5FF | hierro mojado | balandras de hierro con bobinas y pararrayos, cubiertas brillantes de agua | planchas de hierro con chispas | Barco atrapado por tentáculos (los tentáculos son trozos independientes) |
| **Biblioteca Hundida del Arcanista** | 4 | #231626 #5C3D5B #8F6B93 #B89558 | cristal arcano + madera de estantería | galeones-templo con estanterías, libros flotando, velas de pergamino | páginas sueltas que vuelan + cristales | La Biblioteca Errante (grimorio gigante como núcleo) |
| **Cometas Errantes** | 5 | #0D110F #FF2E88 #00E5FF #8A5CFF | hierro + cristal neón | GALEONES NEÓN CÓSMICOS, satélites con antenas, observatorios con cúpula | trozos con bordes neón que siguen brillando en el agua | El Cometa (núcleo-estrella) |
| **La Marea Sin Nombre (flota de Distraxia)** | 6 | #D9D4DE #413B44 #8A5CFF #171317 | hueso + madera podrida + niebla | barcos de costillas, velas rasgadas, ojos que parpadean en el casco | huesos y niebla que se disipa | El Leviatán Almirante (ballena-barco de hueso de 26x14) |
| **Bandera Negra (Velo Noctis)** | — | #0D0B10 #8C2BFF #D296FF #B89558 | madera negra lacada + encaje | bergantines elegantes con encaje morado, antifaces venecianos en la proa | astillas negras y plumas | Buque insignia de Noctis (5.º barco del evento) |
| **???** | — | #000000 #0D110F #FF2E88 | void | silueta de barco hecha de estática; no se ve su interior | no suelta trozos: las celdas se BORRAN (pixelado de transmisión) | Barco del Vacío (nave de NADIE) |

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

- **rule**: Al terminar el turno de un bando (después de que su gato disparó y se resolvieron las secuelas), todos sus cañones vivos disparan SOLOS, escalonados 120 ms, en el orden de proa a popa.
- **target**: Objetivo de Andanada = la celda que golpeó el gato de ese turno. Si el gato falló o no disparó (aturdido), el módulo enemigo vivo más cercano a donde cayó su tiro; si no hubo tiro, el camarote enemigo más dañado. Todos los cañones apuntan ahí (fuego concentrado = el jugador 'dirige' la andanada con su gato).
- **aim**: El ángulo se resuelve analíticamente (tiro tenso o bombeado según el tipo) con dispersión: σ ángulo = max(0.8°, 5° − 0.6°·Mk Arma); el viento sí afecta (excepto rayos). Los proyectiles atraviesan las celdas de su propio barco (sin fuego amigo).
- **damage**: Daño interno del tipo de arma x f(S) (igual que los gatos, ver 2.9). Santabárbara viva: +25%. Cañón Enraizado, Congelado, Sellado o Embarrado: no dispara esa andanada.
- **pace**: La andanada completa dura ≤ 1.2 s (cámara abierta mostrando ambos barcos). Mantener Espacio la acelera x4.
- **enemy**: El enemigo hace exactamente lo mismo al final de su turno, apuntando a donde golpeó su gato.
- **why**: El jugador solo elige QUÉ GATO dispara cada turno (y dónde). La construcción del barco (cuántos cañones, de qué tipo, dónde) pesa en cada turno sin agregar clics.

#### 2.9.4 Gatos en batalla
- **Recarga:** tras disparar, el gato no puede volver a disparar durante `recarga` turnos tuyos (Común 0: dispara cada turno).
- **Medidor de ultimate (0–100):** +25 por disparo propio, +15 cuando golpean su camarote, +10 cuando cae un aliado, + Núcleo por turno. Costo 100 (125 si tu Sala de Invocación no existe o fue destruida). Usarla es la acción del turno (ignora la recarga; después aplica la recarga normal). Una ultimate por turno. **Tope de daño de una ultimate: 35% de la estructura total inicial del barco enemigo** (40% para Starfall y Singularidad); los jefes tienen tope 15% por fase. Storyboard d (3.6 s la primera vez, 1.8 s después; saltable tras verla una vez).
- **Camarotes:** el gato recibe el 25% del daño hecho a las celdas de su camarote. Camarote destruido → **¡GATO SUELTO!** (Expuesto: sale volando en arco y cae de pie en la cubierta; recibe x1.5 directo pero su próximo disparo hace +25% y no gasta recarga — el rival elige: ¿destruyo el barco o remato al gato?). Si se rompe el piso bajo un gato expuesto, cae al agua: pierde 1 turno y vuelve nadando (momento cómico) — o queda fuera de combate si su vida llega a 0.
- **Fuera de combate (K.O.):** secuencia visible (feedback del usuario):

| t | Qué pasa |
|---|---|
| 0 ms | Hitstop 80 ms; impact frame B/N de 1 frame sobre el gato. |
| 80 ms | Estrellitas giran sobre su cabeza y los ojos se vuelven 'X' (overlay); el sprite se tambalea (rotación ±12° en 2s). |
| 450 ms | El ALMA sale: copia del sprite en blanco translúcido (alpha 0.6, sin color) sube 120 px ondulando y se desvanece; sonido de 'fiuuu' fantasmal. |
| 800 ms | El cuerpo cae al mar en arco (gravedad), da una vuelta, ¡SPLASH! |
| 1100 ms | Reaparece flotando dentro de un SALVAVIDAS rojo-blanco junto al barco, con cartel 'FUERA DE COMBATE' (Anton, inclinado). Se queda ahí meciéndose con el oleaje el resto de la batalla (clic: ver su daño total). |
| 1600 ms | El retrato del gato en la HUD se pone en gris con un salvavidas encima. |

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

| Zona | Etapa | Nombre | Tipo | Arquetipo | Personalidad IA | Poder enemigo (balance) |
|---|---|---|---|---|---|---|
| 1 Bahia Sardina | 1-1 | El Patito Pirata | normal | patito (ver bosses.story_patito) | torpe | 22 |
| 1 Bahia Sardina | 1-2 | Chalupa Pesquera | normal | chalupa | torpe | 27.6 |
| 1 Bahia Sardina | 1-3 | Barcaza con Muro | normal | barcaza_muro | afinador | 34.6 |
| 1 Bahia Sardina | 1-4 | Lancha de Contrabando | normal | lancha_polvora | afinador | 43.5 |
| 1 Bahia Sardina | 1-5 | Contramaestre Ovillo — La Madeja | elite | pesquero | afinador | 54.5 |
| 1 Bahia Sardina | 1-6 | Barco-Cangrejo | normal | cangrejo | afinador | 68.4 |
| 1 Bahia Sardina | 1-7 | Pesquero Pirata | normal | pesquero | saqueador | 85.8 |
| 1 Bahia Sardina | 1-8 | Chalupa Doble | normal | chalupa | vengativo | 107.7 |
| 1 Bahia Sardina | 1-9 | Capitán Bigotes Rotos | boss | — | afinador | 140 |
| 2 Acantilados de Piedra | 2-1 | Fortín de Piedra | normal | fortin_piedra | afinador | 110 |
| 2 Acantilados de Piedra | 2-2 | Galera de Raíces | normal | galera_raices | elementalista | 129.6 |
| 2 Acantilados de Piedra | 2-3 | Catapulta Flotante | normal | catapulta | demoledor | 152.6 |
| 2 Acantilados de Piedra | 2-4 | Torre-Barco | normal | torre_barco | francotirador | 179.8 |
| 2 Acantilados de Piedra | 2-5 | Barón Ladrillo — El Muro | elite | fortin_piedra | demoledor | 211.8 |
| 2 Acantilados de Piedra | 2-6 | Galera Musgosa | normal | galera_raices | elementalista | 249.5 |
| 2 Acantilados de Piedra | 2-7 | Fortín Doble | normal | fortin_piedra | demoledor | 293.9 |
| 2 Acantilados de Piedra | 2-8 | Torre de Vigía | normal | torre_barco | francotirador | 346.2 |
| 2 Acantilados de Piedra | 2-9 | La Gárgola Ronroneante | boss | — | demoledor | 450 |
| 3 Mar de Tormentas | 3-1 | Balandra Eléctrica | normal | balandra_electrica | elementalista | 360 |
| 3 Mar de Tormentas | 3-2 | Pararrayos | normal | pararrayos | francotirador | 395.3 |
| 3 Mar de Tormentas | 3-3 | Chalupa de Tormenta | normal | chalupa | afinador | 434 |
| 3 Mar de Tormentas | 3-4 | Balandra Doble | normal | balandra_electrica | elementalista | 476.4 |
| 3 Mar de Tormentas | 3-5 | Bruja Nimbus — Caldero Tormenta | elite | balandra_electrica | elementalista | 523.1 |
| 3 Mar de Tormentas | 3-6 | Pararrayos Gigante | normal | pararrayos | calculador | 574.3 |
| 3 Mar de Tormentas | 3-7 | Remolcador de Rayos | normal | cangrejo | vengativo | 630.6 |
| 3 Mar de Tormentas | 3-8 | Flota del Kraken | normal | balandra_electrica | calculador | 692.3 |
| 3 Mar de Tormentas | 3-9 | Kraken Voltaico | boss | — | elementalista | 900 |
| 4 Ruinas Sumergidas | 4-1 | Templo Flotante | normal | templo_flotante | calculador | 850 |
| 4 Ruinas Sumergidas | 4-2 | Biblioteca a la Deriva | normal | biblioteca | elementalista | 960.5 |
| 4 Ruinas Sumergidas | 4-3 | Galeón de Runas | normal | galeon_runas | calculador | 1085.4 |
| 4 Ruinas Sumergidas | 4-4 | Templo Hundido | normal | templo_flotante | francotirador | 1226.5 |
| 4 Ruinas Sumergidas | 4-5 | Capitana Mira — La Mirilla | elite | torre_barco | francotirador | 1386 |
| 4 Ruinas Sumergidas | 4-6 | Biblioteca Prohibida | normal | biblioteca | elementalista | 1566.2 |
| 4 Ruinas Sumergidas | 4-7 | Galeón Sellado | normal | galeon_runas | calculador | 1769.9 |
| 4 Ruinas Sumergidas | 4-8 | Puerta de las Ruinas | normal | templo_flotante | vengativo | 2000 |
| 4 Ruinas Sumergidas | 4-9 | El Arcanista | boss | — | calculador | 2600 |
| 5 Abismo Estelar | 5-1 | Satélite Pirata | normal | satelite | calculador | 1900 |
| 5 Abismo Estelar | 5-2 | Nave Cometa | normal | nave_cometa | afinador | 2070 |
| 5 Abismo Estelar | 5-3 | Observatorio | normal | observatorio | francotirador | 2255.2 |
| 5 Abismo Estelar | 5-4 | Satélite Doble | normal | satelite | calculador | 2457 |
| 5 Abismo Estelar | 5-5 | Almirante Tictoque — Fortaleza Relojera | elite | fortaleza_relojera | calculador | 2676.8 |
| 5 Abismo Estelar | 5-6 | Cometa Rojo | normal | nave_cometa | vengativo | 2916.3 |
| 5 Abismo Estelar | 5-7 | Gran Observatorio | normal | observatorio | francotirador | 3177.3 |
| 5 Abismo Estelar | 5-8 | Anillo de Escombros | normal | satelite | demoledor | 3461.5 |
| 5 Abismo Estelar | 5-9 | Estrella Errante | boss | — | calculador | 4500 |
| 6 La Marea Sin Nombre | 6-1 | Barco de Hueso | normal | barco_hueso | vengativo | 3300 |
| 6 La Marea Sin Nombre | 6-2 | Galeón de Niebla | normal | galeon_niebla | elementalista | 3587.6 |
| 6 La Marea Sin Nombre | 6-3 | Osario Flotante | normal | barco_hueso | demoledor | 3900.3 |
| 6 La Marea Sin Nombre | 6-4 | Niebla Viva | normal | galeon_niebla | calculador | 4240.2 |
| 6 La Marea Sin Nombre | 6-5 | Lady Garra — La Viuda Negra | elite | barco_hueso | vengativo | 4609.7 |
| 6 La Marea Sin Nombre | 6-6 | Costillar del Leviatán | normal | barco_hueso | demoledor | 5011.5 |
| 6 La Marea Sin Nombre | 6-7 | Muralla de Niebla | normal | galeon_niebla | calculador | 5448.2 |
| 6 La Marea Sin Nombre | 6-8 | Escolta del Almirante | normal | galeon_runas | vengativo | 5923.1 |
| 6 La Marea Sin Nombre | 6-9 | EL PRIMER MAR | boss | — | elementalista | 7700 |

**Encargos** (laterales, opcionales; no están en la ruta crítica del sim):

| Encargo | Zona (tras etapa) | Restricción | Premio |
|---|---|---|---|
| **Aguas Estrechas** | 2 (tras 2-3) | Solo barcos de ≤4 tripulantes (Balsa o Gorrión). | Planos x2 + orbes x10 del gato MVP |
| **Rescate Gatuno** | 2 (tras 2-6) | Solo puedes llevar 3 gatos. | Orbe Prisma x5 |
| **Diluvio Perpetuo** | 3 (tras 3-5) | Todo está Mojado siempre: prohibido llevar gatos 🔥. | Cristales ⚡ x10 + Planos x2 |
| **Asedio Pesado** | 4 (tras 4-6) | Enemigo con armadura x2: se recomienda Bastión y armas pesadas (Mortero/Riel). | Planos x4 + artefacto Ancla de Emergencia |
| **Tormenta Arcana** | 5 (tras 5-3) | Los escudos no-arcanos no funcionan (Bajel Arcano recomendado). | Cristales ✨ x15 + Orbe Prisma x5 |
| **Saqueo Estelar** | 5 (tras 5-6) | Solo Merodeador: cada módulo destruido suelta el doble de chatarra. | Chatarra x60 + Planos x3 |
| **La Última Niebla** | 6 (tras 6-4) | Sin vista previa de trayectoria (niebla total). Linterna Espíritu la ignora. | Fragmento del Vacío +1 (si aún no tienes 9) + gemas x2 |

### 2.10 Jefes

Plantilla (03 §7.4): 3 fases (100–66–33%), **una regla que rompe el juego normal**, un punto débil que se revela (Análisis), telegrafía, enrage suave. Reino mínimo = `balance:bosses[].kl`. Los jefes NO son obligatorios de inmediato: aparecen como nodo con calavera en el mapa y esperan a que estés listo.

#### Jefe 1 — Capitán Bigotes Rotos (El Tiburón Desbigotado)

- **Zona** 1 · **Reino mínimo** `balance:bosses[0].kl` · **Elementos** 💧🔥 · **IA** afinador / corsario · **Enrage** turno 12
- **Barco**: La Sardina Furiosa (16x10; madera + 6 barriles de pólvora en cubierta). Destacado: 2 cañones, santabárbara detrás del mástil, 3 camarotes, bodega con el 'fósil vivo' (Gea) visible tras la F2.
- **Capitán (arte)**: `arce_autumn_cat` enemigo: desaturado 40%, contorno rojo, parche en el ojo y bigotes chuecos (decals en código).
- **Regla propia**: BARRILES: hay 6 barriles de pólvora en su cubierta; si revientas uno explota en cadena con los vecinos (daño a ÉL). Enseña a leer el barco.
- **Punto débil**: La santabárbara detrás del mástil: si cae el mástil, queda expuesta.
  - **F (100–66%) ¡Arrr!**: Dispara bolas normales; IA Afinador (horquilla los tiros).
  - **F (66–33%) ¡A los remos!**: Maniobra 2 celdas por turno y se cubre detrás de su casco de proa; abre la bodega (se ve un fósil brillando).
  - **F (33–0%) ¡Fuego a discreción!**: Dispara 2 veces por turno, pero su santabárbara queda expuesta (telegrafiada con brillo rojo).
- **Líneas**: _"¡Arrr! ¿Una balsa? ¿Con TRES gatos? Esto va a ser más fácil que robarle el pescado a un gato dormido. Ah, no, espera…"_ · F2: _"¡A LOS REMOS, bola de inútiles! ¡Y que nadie toque la bodega!"_ · F3: _"¡Mis bigotes! ¡MIS BIGOTES! ¡FUEGO A TODO LO QUE SE MUEVA!"_ · Al perder: _"Bueno… quédate el fósil. Muerde."_ · Si te gana: _"¡JA! Vuelve cuando tu balsa tenga dientes."_
- **Premios**: bosses[0] (gemas, desbloqueos) + combat.reward.boss_blueprints/boss_crystals + orbs.boss_orbs + ronroneo.base_min.boss; desbloquea element:earth, cat:l_gea, zone:2; reliquia reliquia_bigote; extra: Puente de Mando (módulo de utilería), Cat's Gambit (la Mesa del Gato aparece en la isla).

#### Jefe 2 — La Gárgola Ronroneante (Guardiana de los Acantilados)

- **Zona** 2 · **Reino mínimo** `balance:bosses[1].kl` · **Elementos** 🪨🌿 · **IA** demoledor / corsario · **Enrage** turno 14
- **Barco**: El Risco Flotante (18x12; piedra (S) con enredaderas). Destacado: fortaleza de piedra, La Garganta (módulo central 2x2), 2 morteros, 4 camarotes.
- **Capitán (arte)**: `fossilstone_guardian_cat` enemigo: gris oscuro, alas de piedra (decal), ojos rojos.
- **Regla propia**: PIEL DE PIEDRA + RONRONEO: sus celdas de piedra reciben x0.5 de todo salvo Tierra y Estallido. Cada 3 turnos ronronea y se cura 10% (telegrafiado: 'RRRRR 1/3').
- **Punto débil**: La Garganta: golpearla interrumpe el Ronroneo y la Aturde 1 turno.
  - **F (100–66%) Piedra**: Morteros lentos y precisos; Ronroneo cada 3 turnos.
  - **F (66–33%) Despierta la tormenta**: Empieza a llover: TODO el campo queda Mojado cada turno (teaser de la Tormenta).
  - **F (33–0%) Vuelo**: La gárgola despega: se separa del barco y se vuelve un objetivo volador que lanza rocas (su barco ya no dispara).
- **Líneas**: _"Rrrrrrr… Llevo trescientos años durmiendo en este acantilado. ¿Y tú vienes a hacer ruido?"_ · F2: _"El cielo también ronronea cuando se enoja. Escucha."_ · F3: _"¡Ya me despertaste, MOCOSO! ¡Ahora vuelo!"_ · Al perder: _"Rrr… la tormenta ya no es mía. Llévatela. Hace ruido."_ · Si te gana: _"Duerme tú ahora."_
- **Premios**: bosses[1]; desbloquea element:storm, cat:l_tronador, zone:3; reliquia reliquia_ojo; extra: Arma: Bobina Tesla.

#### Jefe 3 — Kraken Voltaico (El Que Abraza Barcos)

- **Zona** 3 · **Reino mínimo** `balance:bosses[2].kl` · **Elementos** ⚡💧 · **IA** elementalista / capitan · **Enrage** turno 14
- **Barco**: Barco atrapado por el Kraken (20x12 + 4 tentáculos; hierro + carne de kraken (material 'bone')). Destacado: 4 tentáculos (objetivos separados, 300 de vida c/u), Generador de Estática, el Ojo.
- **Capitán (arte)**: `mecha_neon_cat` enemigo: capitán diminuto en la cabeza del kraken; el kraken (tentáculos, ojo, pico) se dibuja en código.
- **Regla propia**: TENTÁCULOS + PRIMER ESCUDO DEL JUEGO: los tentáculos agarran tus módulos (los desactivan) y tiran gatos al agua. Desde la F2, BURBUJA DE ESTÁTICA: anula 1 impacto por turno (¡CLANK!) salvo multi-impacto o ⚡ (Sobrecarga la rompe).
- **Punto débil**: El Ojo: solo es golpeable cuando abre el pico (cada 3 turnos, telegrafiado).
  - **F (100–66%) Abrazo**: Los tentáculos atacan; cada tentáculo vivo agarra 1 módulo tuyo por turno.
  - **F (66–33%) Estática**: Levanta la Burbuja de Estática (primer escudo que ves). Mensaje: 'NUEVA MECÁNICA: ESCUDOS'.
  - **F (33–0%) Inmersión**: Se sumerge cada 2 turnos: bajo el agua solo le afectan ⚡ (conduce) y torpedos 💧.
- **Líneas**: _"(el kraken no habla; su capitán sí) ¡Míralo! ¡Le caíste bien! ¡Te va a abrazar HASTA QUE TRUENES!"_ · F2: _"¿Ves esa burbuja? Se llama 'no puedes'. Bonita, ¿no?"_ · F3: _"¡A las profundidades, bebé!"_ · Al perder: _"Ok, ok… ¡suéltalo! ¡Llévate los planos del escudo pero suéltalo!"_ · Si te gana: _"¡Abrazo grupal!"_
- **Premios**: bosses[2]; desbloquea ship:bastion, family:shield, zone:4; reliquia reliquia_ventosa; extra: Escudo Burbuja.

#### Jefe 4 — El Arcanista (Ladrón de Páginas)

- **Zona** 4 · **Reino mínimo** `balance:bosses[3].kl` · **Elementos** ✨🪨 · **IA** calculador / capitan · **Enrage** turno 15
- **Barco**: La Biblioteca Errante (18x12; cristal arcano + madera). Destacado: 3 Generadores Arcanos (capas), Grimorio (núcleo), Espejo.
- **Capitán (arte)**: `candy_alchemist_cat` enemigo: paleta ORQUÍDEA REAL oscura (#231626), sombrero puntiagudo y grimorio flotante (código).
- **Regla propia**: ESCUDOS ARCANOS EN CAPAS (3): absorben daño elemental, reciben x1.5 físico; 20% de reflejar runas (espejo). Sobrecarga ⚡ rompe una capa y aturde al gato que la sostiene.
- **Punto débil**: Su Grimorio (núcleo): se abre (vulnerable x1.5) el turno después de invocar.
  - **F (100–66%) Tres capas**: Escudos arcanos x3; runas teledirigidas Malditas.
  - **F (66–33%) Teletransporte**: Intercambia de lugar 2 de sus módulos cada turno (telegrafiado 1 turno antes).
  - **F (33–0%) Grimorio abierto**: Invoca 2 gatos de tinta (objetivos temporales que disparan); su Grimorio queda vulnerable.
- **Líneas**: _"Ah, el grumete de la balsa. Ya conoces mi magia. Ahora conoce mi PACIENCIA. …Mentira, no tengo."_ · F2: _"¿Dónde quedó tu cañón? Ups. Ahora es mío. Ahora es tuyo. Ahora es mío."_ · F3: _"¡Que se escriba tu final! ¡Tinta, a mí!"_ · Al perder: _"Llévate a esa gata del grimorio… nunca dejó de corregirme la ortografía."_ · Si te gana: _"Fin. Con mayúscula."_
- **Premios**: bosses[3]; desbloquea cat:l_merlina, ship:bajel, zone:5; reliquia reliquia_grimorio; extra: Escudo Arcano, Arma: Riel Arcano, Fragmento del Vacío 1/10 (cae de su grimorio: '¿esto qué es?').

#### Jefe 5 — Estrella Errante (La que Cayó Dos Veces)

- **Zona** 5 · **Reino mínimo** `balance:bosses[4].kl` · **Elementos** 🌌⚡ · **IA** calculador / leyenda · **Enrage** turno 15
- **Barco**: El Cometa (20x11; hierro + cristal; núcleo-estrella). Destacado: Núcleo-estrella, 2 pozos de gravedad, 4 camarotes.
- **Capitán (arte)**: `alien_galaxy_cat` enemigo: blanco-dorado brillante (hue 40, bright 1.4), cola de cometa en código.
- **Regla propia**: GRAVEDAD ERRANTE: cada fase cambia la gravedad del campo para TODOS (F1 normal, F2 baja x0.5: proyectiles flotan, F3 invertida del lado enemigo: tus tiros caen 'hacia arriba' cerca de su barco).
- **Punto débil**: El núcleo-estrella brilla (vulnerable x2) solo mientras carga 'Lluvia de Estrellas' (1 turno, telegrafiado).
  - **F (100–66%) Órbita**: Orbes gravitatorios; gravedad normal.
  - **F (66–33%) Ingravidez**: Gravedad x0.5 para todos; sus escombros flotan y luego caen sobre TI.
  - **F (33–0%) Caída**: Gravedad invertida cerca de su barco; carga Lluvia de Estrellas cada 3 turnos.
- **Líneas**: _"Caí una vez del cielo. No me gustó. Ahora tú vas a caer."_ · F2: _"¿Sientes eso? Ya no pesas nada. Igual que tus argumentos."_ · F3: _"¡ABAJO ES ARRIBA, GRUMETE!"_ · Al perder: _"Ahí está… lo que me empujó del cielo. Viene por ti. ¿Lo oyes?"_ · Si te gana: _"Otra estrella fugaz. Pide un deseo."_
- **Premios**: bosses[4]; desbloquea element:cosmic, cat:l_astraprima, zone:6; reliquia reliquia_polvo; extra: Fragmentos del Vacío 2-3/10.

#### Jefe 6 — EL PRIMER MAR (Leviatán Almirante (balance: 'Leviatan Almirante'))

- **Zona** 6 · **Reino mínimo** `balance:bosses[5].kl` · **Elementos** 🌌✨🔥 · **IA** elementalista / leyenda · **Enrage** turno 20
- **Barco**: El Leviatán Almirante (26x14 (ocupa 2/3 de la pantalla); hueso + escamas de coral arcano). Destacado: 3 núcleos (uno por fase), Espiráculo, aletas-cañón, Niebla de Distraxia.
- **Capitán (arte)**: El Leviatán (ballena-barco de hueso) se dibuja en código; Distraxia es una niebla violeta con ojos. El Primer Mar es el océano mismo levantándose..
- **Regla propia**: EL MAR ES EL JEFE: cada fase exige una mecánica aprendida. 3 núcleos (uno por fase): destruir el núcleo de la fase la termina. Clímax con cierre circular (el último golpe es el STARFALL del prólogo).
- **Punto débil**: El Espiráculo (núcleo de F2) solo emerge tras congelar el mar a su alrededor.
  - **F (100–66%) Escamas arcanas**: Escudos arcanos en capas (exige Sobrecarga ⚡ + Maldito ✨).
  - **F (66–33%) Casco de agua viva**: Se sumerge; para sacarlo hay que Mojar y luego Ventisca (congelar el mar alrededor) y romper con Estallido 🪨; la Conducción por el mar mojado le pega aunque esté sumergido.
  - **F (33–0%) El mar se traga todo**: Gravedad invertida; Distraxia 'devora' (borra) 1 módulo tuyo por turno. TODOS tus gatos empiezan la fase con la ultimate al 100%. Al llegar a 10% de vida: cinemática y golpe final guionizado con Astra Prima — STELLAR DECREE: STARFALL (mismo plano del prólogo).
- **Líneas**: _"(Distraxia, con mil voces) Este mar recuerda todo lo que el Archivo olvidó. Y yo me encargo de que lo olvide otra vez."_ · F2: _"¿Un barco? ¿Gatos? Qué cosa tan… memorable. Qué lástima."_ · F3: _"Yo no destruyo, grumete. Yo BORRO."_ · Al perder: _"No… no es posible… algo… algo viene detrás de ti…"_ · Si te gana: _"Shhh. Ya no te acuerdas de nada."_
- **Premios**: bosses[5] (15 gemas); desbloquea chapter_end, teaser:void; reliquia reliquia_diente; extra: Fragmento del Vacío 10/10, Marea Final, Velo Noctis se une (secreto), Arca Celestial (teaser, NG+).


**Otros encuentros (historia, eventos, secretos y élites de etapa 5):**

| Encuentro | Tipo | Dónde/cuándo | Regla | Premio |
|---|---|---|---|---|
| **El Patito Pirata** — Tutorial (y revancha) | story | Zona 1 | No se puede perder (el enemigo hace 30% de daño). Al hundirse hace '¡cuac!'. Revancha (KL≥36): mismo barco, tu daño se muestra como (SP/EP)³ x 1000 → ~10⁹-10¹⁰. | Botín Dorado garantizado (primera victoria), Revancha: 1 gema + logro 'Hace mucho tiempo, en una balsa…' |
| **Heraldo del Arcanista** — Algo viene (Reino 24) | story | Zona 4 | Batalla de historia: poder enemigo = 0.6 x tu Poder de Barco. Su gato levanta un ESCUDO MÁGICO (¡CLANK!): absorbe todo salvo Tierra/cañón x1.5. Al vencerlo: Núcleo Arcano → NUEVO ELEMENTO: MAGIA (secuencia T4). | element:magic (balance kl:24), Hábitat Arcano, Resonancias nuevas (conteo dinámico) |
| **Raijin** — Nodo final de la Heroica 1 | event_boss | Zona 3 | Su pararrayos absorbe tus disparos ⚡ y le carga la ultimate: usa fuego, tierra o agua. | cat:m_raijin (balance events.heroic[0]) |
| **La Grieta** — Nodo final de la Heroica 2 | event_boss | Zona 5 | La Singularidad carga 2 turnos: si llega a 2/2, arranca 4x4 celdas de tu barco. Golpear su camarote reinicia la carga ('¡MATEN A ESE YA!'). | cat:m_singular (balance events.heroic[1]) |
| **Barco del Vacío** — A VOID SHIP HAS ENTERED YOUR WORLD | event_boss | Zona 6 | NO SE PUEDE GANAR: se va al turno 8. El premio depende del daño hecho (Fragmentos del Vacío: 1 por cada 15% de daño, máx. 3). Reloj ROJO 14:59. | Fragmentos del Vacío +1..3 |
| **La Orquesta Muda** — Santuario Gatuno Antiguo (Ruinas Arcanas) | secret | Zona 4 | Duelo de Gatos: los atriles tocan una nota por turno; con 4 notas, acorde que golpea a todos. Rompe los atriles en orden (do-re-mi-fa) para silenciarla. | cat:s_sonata, Lore: el Archivo Vivo |
| **Contramaestre Ovillo** (La Madeja) | élite (etapa 1-5) | Zona 1 | Sus tiros empiezan cortos/largos y afinan: si no lo hundes rápido, te clava. _"Uno corto… uno largo… y el tercero, en tu cara."_ | botín de etapa + orbes x10 |
| **Barón Ladrillo** (El Muro) | élite (etapa 2-5) | Zona 2 | Apunta a tu quilla y soportes para provocarte colapsos (usa la vista previa de colapso). _"No te voy a hundir. Te voy a DERRUMBAR."_ | botín de etapa + orbes x10 |
| **Bruja Nimbus** (Caldero Tormenta) | élite (etapa 3-5) | Zona 3 | Moja tu barco y luego electrocuta (te enseña Conducción a golpes). _"Primero te mojo. Luego ya sabes."_ | botín de etapa + orbes x10 |
| **Capitana Mira** (La Mirilla) | élite (etapa 4-5) | Zona 4 | Solo dispara rayos rectos y caza gatos Expuestos. _"No fallo. Nunca. Bueno, una vez. No hablemos de eso."_ | botín de etapa + orbes x10 |
| **Almirante Tictoque** (Fortaleza Relojera) | élite (etapa 5-5) | Zona 5 | Repara 1 módulo por turno mientras viva su sala de máquinas; cada 4 turnos 'rebobina' tu último tiro (lo deshace). _"Tic. Tac. Tu turno terminó hace tres segundos."_ | botín de etapa + orbes x10 |
| **Lady Garra** (La Viuda Negra) | élite (etapa 6-5) | Zona 6 | Ataca siempre al gato que más daño le hizo; si pierde 2 gatos entra en Berserk. _"Recuerdo cada rasguño. Y los devuelvo dobles."_ | botín de etapa + orbes x10 |

### 2.11 Misiones (tutorial + historia, cero diarias)

**Reglas**
- 4 cadenas simultáneas: **Historia** (beats y tutorial), **Capitán** (barco y combate), **Criador** (gatos, comida, hábitats, Resonancia, estrellas), **Explorador** (expansiones, elementos, secretos, eventos, Catdex). Cada misión **enseña algo, abre algo o avanza la historia** (columna "Para qué"); si no, no existe.
- Aparecen **porque avanzaste** (trigger de progreso), nunca por calendario. Máx. **3 fijadas** en la HUD (las demás en el panel). La siguiente misión de una cadena aparece **ya empezada** si ya cumpliste parte (progreso dotado).
- Premio `std` = `balance:kingdom.mission_reward` (60 s de oro, 60 s de comida, 5 orbes, 15% de 1 gema) + Ronroneo `mission` + XP 6% de barra + Momentum; varias suman extras fijos (gemas, piezas, desbloqueos). Las tres primeras dan premio fijo de tutorial (CHARLA: "+300 oro, +100 comida, +1 gema").
- Completar = T2 (panel de cómic con la línea de Luzterna); en rachas, versión corta.
- **108 misiones** (~2.5 por nivel de Reino; balance modela 2 por nivel — ver 9). Las updates agregan cadenas después de las existentes.

| id | Cadena | Título | Objetivo | Aparece cuando | Para qué | Premio (además de 'std') | Abre | Aprox. |
|---|---|---|---|---|---|---|---|---|
| H01 | historia | ¡Despierta, Canelo! | Toca a Canelo para despertarlo. | `start` | teach | SIN std; gold: 10 | K01 | 1:10 |
| H02 | historia | ¿Cómo se llama? | Ponle nombre a tu primer gato (o acepta 'Canelo'). | `mission:H01` | teach | SIN std; gold: 20 | — | 2:00 |
| H03 | historia | Algo huele a pescado | Junta 50 Pescaditos en el Muelle. | `mission:H02` | teach | SIN std; gold: 300, food: 100, gems: 1 | K02 | 3:15 |
| H04 | historia | Ese gato tiene hambre | Alimenta a un gato hasta nivel 3 (¡ÑAM! x8). | `mission:H03` | teach | orbsOfFedCat: 5 | — | 4:00 |
| H05 | historia | Ahora haz que valga la pena | Lleva a tus gatos a su primer combate y hunde al Patito Pirata. | `mission:H04` | teach | goldenLoot: True | C01, H07, puerto_combate | 6:00 |
| H06 | historia | Tus gatos se fueron a invocar otro | Lleva a Canelo y Brote al Santuario de Resonancia (resultado garantizado en 90 s). | `mission:C01` | teach | — | santuario_resonancia, K07 | 8:00 |
| H07 | historia | Eso no era una nube | Llega a Reino 3. | `mission:H05` | story | gems: 1 | E01, E02, micro:pez_dorado | 7:00 |
| H08 | historia | El Capitán Bigotes Rotos | Derrota al jefe de la Bahía Sardina. | `stage_cleared:1-8` | story | boss: 1 | H09, C10, E11 | ~28:00 |
| H09 | historia | Una máscara en el horizonte | Gana tu primera batalla en los Acantilados de Piedra. | `boss:1` | story | — | — | ~31:00 |
| H10 | historia | Tormenta permanente | Derrota a La Gárgola Ronroneante. | `stage_cleared:2-8` | story | boss: 2 | C16 | ~1:06 |
| H11 | historia | El Heredero del Trueno | Completa la Expedición Heroica (o al menos 5 nodos). | `event_presage:heroica_1` | story | — | — | ~1:15 |
| H12 | historia | Bandera Negra | Gana el evento Bandera Negra (o consigue el Merodeador). | `event_presage:bandera_negra` | story | — | C17 | ~0:55 |
| H13 | historia | El primer escudo | Derrota al Kraken Voltaico. | `stage_cleared:3-8` | story | boss: 3 | C19, C20 | ~1:44 |
| H14 | historia | Algo viene | Investiga el barco que brilla en el horizonte. | `element_unlock_trigger:magic (balance kl:24)` | story | — | element:magic | ~1:50 |
| H15 | historia | El Ladrón de Páginas | Derrota al Arcanista. | `stage_cleared:4-8` | story | boss: 4 | C24 | ~2:47 |
| H16 | historia | Lo que guardan las ruinas | Limpia las Ruinas Arcanas y entra al santuario que hay debajo. | `expansion:6` | story | gems: 2 | — | ~3:50 |
| H17 | historia | Cae una estrella | Derrota a la Estrella Errante. | `stage_cleared:5-8` | story | boss: 5 | — | ~3:57 |
| H18 | historia | La Grieta | Completa la Expedición Heroica 'Grieta Cósmica'. | `event_presage:heroica_2` | story | — | — | ~4:35 |
| H19 | historia | Un barco que no debería existir | Hazle al menos 15% de daño al Barco del Vacío antes de que se vaya. | `event:barco_vacio` | story | gems: 2 | E25 | ~4:45 |
| H20 | historia | Hace mucho tiempo, en una balsa… | Vuelve a la Bahía Sardina. Alguien te espera. | `kl:36` | story | gems: 1 | — | ~4:20 |
| H21 | historia | El Primer Mar | Derrota al Leviatán Almirante. | `stage_cleared:6-8` | story | boss: 6 | chapter_end | ~5:24 |
| H22 | historia | Continuará | Mira lo que pasó después. | `boss:6` | story | SIN std; gems: 3 | post:mar_abierto, post:marea_nueva, cat:s_noctis | ~6:15 |
| C01 | capitan | Al agua, patos | Gana 2 batallas más en la Bahía Sardina. | `mission:H05` | teach | — | H06 | 7:30 |
| C02 | capitan | Un cañón que sí pegue | Mejora las Armas a Mk II en el Astillero. | `mission:C01` | teach | — | C03 | ~10:00 |
| C03 | capitan | Casco que no se moje | Mejora el Casco a Mk II (Balandra). | `mission:C02` | teach | — | C04 | ~14:00 |
| C04 | capitan | Bombea ese tiro | Destruye un módulo que esté detrás de un muro (tiro bombeado). | `stage_reached:1-3` | teach | — | — | ~7:00 |
| C05 | capitan | Gorrión | Compra el Gorrión en el Astillero. | `kl:5` | open | — | C06 | ~9:00 |
| C06 | capitan | Tripulación completa | Asigna 4 gatos al Gorrión. | `mission:C05` | teach | — | — | ~10:00 |
| C07 | capitan | Hunde, no rompas | Gana una batalla hundiendo al enemigo (inundación). | `mission:C06` | teach | — | module:pump, module:bulkhead | ~18:00 |
| C08 | capitan | Lee el barco | Haz explotar una santabárbara enemiga. | `stage_reached:1-4` | teach | — | — | ~16:00 |
| C09 | capitan | Bahía limpia | Gana las 8 etapas de la Bahía Sardina. | `mission:C04` | open | — | H08 | ~30:00 |
| C10 | capitan | Mk III | Lleva cualquier familia a Mk III (Fragata). | `boss:1` | teach | — | — | ~40:00 |
| C11 | capitan | Tu primera ultimate | Llena el medidor de un gato y usa su ultimate (F). | `first_meter_full` | teach | — | module:arcane | ~20:00 |
| C12 | capitan | Astillero creativo | Mueve un módulo o camarote en el editor y prueba contra el muñeco. | `mission:C11` | teach | — | — | ~25:00 |
| C13 | capitan | Victoria perfecta | Gana sin perder ningún gato. | `mission:C09` | teach | — | — | ~35:00 |
| C14 | capitan | Asalto rápido | Usa Asalto Rápido en una etapa que ya ganaste. | `can_quick_assault` | teach | — | — | ~45:00 |
| C15 | capitan | Aguas Estrechas | Completa el Encargo 'Aguas Estrechas' (solo barcos chicos). | `stage_cleared:2-3` | teach | — | — | ~50:00 |
| C16 | capitan | Dos armas, dos ideas | Equipa 2 tipos de arma distintos (p. ej. Cañón + Bobina Tesla). | `boss:2` | teach | — | — | ~1:15 |
| C17 | capitan | Merodeador | Consigue el Merodeador (evento o astillero). | `kl:15` | open | — | artifact:kit_reparacion, artifact:bomba_humo | ~0:50 |
| C18 | capitan | Saqueo | Destruye 30 módulos con el Merodeador. | `mission:C17` | teach | — | — | ~1:30 |
| C19 | capitan | Escudo arriba | Instala tu primer escudo. | `boss:3` | teach | — | artifact:burbuja_emergencia | ~1:45 |
| C20 | capitan | El acorazado | Compra el Bastión. | `boss:3` | open | — | artifact:ancla_emergencia | ~2:27 |
| C21 | capitan | Flota | Ten 3 barcos. | `mission:C20` | teach | — | — | ~2:24 |
| C22 | capitan | Rescate Gatuno | Completa el Encargo 'Rescate Gatuno' (solo 3 gatos). | `stage_cleared:2-6` | teach | — | — | ~1:05 |
| C23 | capitan | Asedio Pesado | Completa el Encargo 'Asedio Pesado'. | `stage_cleared:4-6` | teach | — | — | ~2:50 |
| C24 | capitan | Bajel Arcano | Compra el Bajel Arcano. | `boss:4` | open | — | artifact:catnip | ~4:31 |
| C25 | capitan | Tormenta Arcana | Completa el Encargo 'Tormenta Arcana' (solo escudos arcanos). | `stage_cleared:5-3` | teach | — | — | ~4:00 |
| C26 | capitan | Mk VII | Lleva cualquier familia a Mk VII (Casco Celestial). | `boss:5` | teach | — | — | ~5:10 |
| C27 | capitan | Simulacro | Activa el Simulacro (auto-batalla en etapas ganadas). | `kl:40` | teach | — | — | ~4:34 |
| C28 | capitan | Rango Oro | Lleva a un gato al rango Oro I (170 KO entre módulos y gatos). | `mission:C13` | teach | — | — | ~3:00 |
| K01 | criador | Recoge tu oro | Recolecta los Doblones de un hábitat 3 veces. | `mission:H01` | teach | — | — | 2:00 |
| K02 | criador | Pesca de verdad | Cosecha Sardinas 3 veces. | `mission:H03` | teach | — | — | 5:00 |
| K03 | criador | Una casa para Brote | Construye un hábitat de Naturaleza: Brote no tiene casa y no produce. | `mission:K01` | teach | — | — | 3:45 |
| K04 | criador | Crecidito | Sube a un gato a nivel 5. | `mission:H04` | teach | — | — | 9:00 |
| K05 | criador | Cesta de Mimbre | Mejora un hábitat a Cesta de Mimbre. | `kl:4` | teach | — | — | ~12:00 |
| K06 | criador | Anchoas Saltarinas | Siembra y cosecha Anchoas. | `kl:4` | teach | — | module:pantry | ~13:00 |
| K07 | criador | ¿Qué salió? | Revela tu primera Resonancia. | `mission:H06` | teach | gems: 1 | K08, catdex | 9:30 |
| K08 | criador | Registra a tus gatos | Registra 5 especies en el Catdex. | `mission:K07` | teach | — | — | ~18:00 |
| K09 | criador | Alimentar hasta… | Usa 'Alimentar hasta nivel X'. | `kl:6` | teach | — | — | ~20:00 |
| K10 | criador | Granja en piloto automático | Activa 'Repetir receta' en una granja. | `kl:9` | teach | — | — | ~26:00 |
| K11 | criador | Torre Rascadora | Mejora un hábitat a Torre Rascadora. | `kl:9` | teach | — | — | ~28:00 |
| K12 | criador | Primeros orbes | Junta 10 Orbes de Alma de un mismo gato. | `first_orb_drop` | open | — | altar_almas | ~20:00 |
| K13 | criador | Una estrella más | Sube un gato a ★2 en el Altar de Almas. | `mission:K12` | teach | — | — | ~35:00 |
| K14 | criador | El Primordial | Consigue un Primordial (Legendario). | `boss:1` | story | — | — | ~33:00 |
| K15 | criador | Set completo | Completa cualquier set del Catdex (p. ej. Piedra Viva). | `mission:K08` | open | — | — | ~45:00 |
| K16 | criador | Dos a la vez | Ten 2 Resonancias activas al mismo tiempo. | `expansion:3` | teach | — | — | ~35:00 |
| K17 | criador | ¡Épico! | Consigue un gato Épico (padres Nv15+). | `kl:10` | teach | — | — | ~1:00 |
| K18 | criador | Casita de Coral | Mejora un hábitat a Casita de Coral. | `kl:15` | teach | — | — | ~1:00 |
| K19 | criador | Salmón Imperial | Cosecha Salmón Imperial. | `kl:15` | teach | — | — | ~1:05 |
| K20 | criador | Cola de Resonancia | Deja 3 parejas en la Cola de Resonancia. | `kl:18` | teach | — | — | ~1:20 |
| K21 | criador | Mar de Pescados Automático | Activa la Auto-cosecha al Silo. | `kl:21` | teach | — | — | ~1:25 |
| K22 | criador | Mutante | Consigue un gato con mutación. | `kl:20` | teach | — | — | ~1:30 |
| K23 | criador | Palacio de Cojines | Mejora un hábitat a Palacio de Cojines (necesita cristales). | `kl:21` | teach | — | — | ~1:40 |
| K24 | criador | Gatos con oficio | Asigna un gato como trabajador (Banquero, Granjero, Constructor o Viajero). | `kl:24` | teach | — | — | ~1:45 |
| K25 | criador | Efecto secundario | Sube un gato a ★3 (desbloquea su efecto secundario). | `mission:K13` | teach | — | — | ~2:00 |
| K26 | criador | Templo del Ronroneo | Mejora un hábitat a Templo del Ronroneo. | `kl:27` | teach | — | — | ~2:40 |
| K27 | criador | Treinta | Registra 30 especies. | `mission:K15` | story | — | — | ~3:00 |
| K28 | criador | Herencia | Haz una Resonancia donde el hijo herede el rasgo de un padre. | `kl:30` | teach | — | — | ~3:20 |
| K29 | criador | Banquete del Leviatán | Siembra un Banquete del Leviatán (cultivo largo para cuando te vayas). | `kl:33` | teach | — | — | ~4:10 |
| K30 | criador | Santuario Arcano | Mejora un hábitat a Santuario Arcano. | `kl:31` | teach | — | — | ~4:25 |
| K31 | criador | Cuarenta | Registra 40 especies. | `mission:K27` | story | — | route:s_lumen | ~4:40 |
| K32 | criador | Nivel Leyenda | Sube un gato a nivel 40 (umbral Leyenda: su ataque puede volverse mítico). | `kl:35` | teach | — | — | ~5:15 |
| E01 | explorador | Recolectar todo | Usa 'Recolectar todo'. | `kl:3` | teach | — | — | 7:00 |
| E02 | explorador | Bosque Costero | Compra la expansión Bosque Costero. | `kl:3` | open | — | E03, K15 | ~7:00 |
| E03 | explorador | Debajo de las rocas | Termina de limpiar el Bosque Costero. | `mission:E02` | open | — | E05 | ~7:30 |
| E04 | explorador | ¡Pez dorado! | Completa tu primer microevento. | `first_micro` | teach | — | — | 14:00 |
| E05 | explorador | El santuario sellado | Abre el santuario del bosque (Reino 5) y vence a su guardián. | `kl:5 & mission:E03` | open | gems: 2 | — | ~20:00 |
| E06 | explorador | Acantilado Rocoso | Compra el Acantilado Rocoso. | `kl:7` | open | — | E07 | ~12:00 |
| E07 | explorador | Fósil en la pared | Saca el fósil incrustado en el acantilado. | `mission:E06` | open | gems: 2 | — | ~13:00 |
| E08 | explorador | Reloj rojo | Completa tu primer Evento Flash. | `first_flash_presage` | teach | — | — | ~9:00 |
| E09 | explorador | Isla Volcánica | Compra la Isla Volcánica. | `kl:12` | open | — | E10, K16 | ~34:00 |
| E10 | explorador | La Forja Dormida | Enciende la forja apagada con un gato 🔥 de nivel 10+. | `mission:E09` | open | gems: 2 | weapon:mortero | ~36:00 |
| E11 | explorador | Cat's Gambit | Juega una mano en la Mesa del Gato (se puede ocultar en Ajustes; si está oculta, se completa sola). | `boss:1` | teach | — | — | ~40:00 |
| E12 | explorador | ¡Sinergia descubierta! | Provoca tu primera reacción elemental (p. ej. Vapor o Conducción). | `mission:K07` | teach | — | grimorio, artifact:bengala | ~25:00 |
| E13 | explorador | Puerto de las Mareas | Compra el Puerto de las Mareas. | `kl:17` | open | — | E14, E15 | ~1:15 |
| E14 | explorador | Mándalos a pasear | Completa tu primera Expedición. | `mission:E13` | teach | — | — | ~1:30 |
| E15 | explorador | Botella del Faro | Abre la botella que llegó al Puerto. | `mission:E13` | story | gems: 2 | — | ~1:20 |
| E16 | explorador | Glaciar Bigote | Compra el Glaciar Bigote. | `kl:22` | open | — | E17 | ~1:55 |
| E17 | explorador | Gato en el hielo | Descongela al gato del glaciar con un gato 🔥. | `mission:E16` | open | gems: 2 | weapon:escarcha | ~2:05 |
| E18 | explorador | Rumores | Encuentra pistas de 3 gatos '???' secretos. | `mission:E15` | open | gems: 1 | — | ~2:30 |
| E19 | explorador | Ruinas Arcanas | Compra las Ruinas Arcanas. | `kl:27` | open | — | H16 | ~3:45 |
| E20 | explorador | Arrecife Prismático | Compra el Arrecife Prismático. | `kl:31` | open | — | E21 | ~4:30 |
| E21 | explorador | Concha Espejo | Asómate a la concha gigante del arrecife. | `mission:E20` | open | gems: 2 | shield:espejo | ~4:33 |
| E22 | explorador | Atolón Estelar | Compra el Atolón Estelar. | `kl:36` | open | — | E23 | ~5:05 |
| E23 | explorador | Faro del Primer Mar | Enciende el faro del atolón. | `mission:E22` | story | gems: 4 | — | ~5:08 |
| E24 | explorador | Grimorio de Sinergias | Descubre 8 reacciones elementales. | `mission:E12` | teach | gems: 2 | — | ~4:30 |
| E25 | explorador | Fragmentos | Junta 7/10 Fragmentos del Vacío. | `mission:H19` | story | — | — | ~5:30 |
| E26 | explorador | Viaje largo | Completa una Expedición de 4 h (déjala cuando te vayas). | `mission:E14` | teach | — | — | offline |

### 2.12 Eventos (el mundo reacciona a tu progreso)

**Tres escalas** (todas con reloj ROJO, todas disparadas por progreso; `balance:events.rule`: sagrados):

**⚡ Microeventos** (30 s – 3 min; aparecen solos):

| id | Nombre | Duración | Aparece desde | Tarea | Premio |
|---|---|---|---|---|---|
| pez_dorado | ¡Pez Dorado! | 45 s | `kl:3 (el primero está guionizado tras la misión H07)` | Un pez dorado cruza la costa de la isla: haz clic sobre él → minijuego de 20 s (revienta 8 burbujas que suben). | Comida = 5 min de tu producción de comida (+ Ronroneo 0.5 min afín a granjas). |
| gato_callejero | Gato Callejero | 120 s | `kl:4` | Un gato desconocido aparece escondido entre tus hábitats (silueta con '?'). Encuéntralo (clic) → te reta a un Duelo de Gatos 1v1. | +15 Orbes de Alma (de una especie aleatoria que tengas; si sale una que no tienes, su ficha pasa a 'Rumor'). El 10.º callejero es Mochi Maneki (secreto). |
| cangrejo_chatarrero | Cangrejo Chatarrero | 90 s | `kl:5` | Un cangrejo cruza la playa cargando tornillos: hazle clic 5 veces antes de que llegue al agua. | Chatarra = la de 1 victoria en tu etapa frontera. |
| botella_mensaje | Botella con Mensaje | 180 s | `expansion:1` | Una botella flota junto al muelle: ábrela. | Pista de un secreto (su ficha pasa a 'Rumor') o, si ya tienes todas las pistas, 1 gema (20%) o Doblones = 2 min de ingreso. |
| lluvia_pescaditos | Lluvia de Pescaditos | 40 s | `kl:8` | Llueven peces sobre la isla: atrapa todos los que puedas (clic). | Comida = 4 s de producción por pez atrapado (máx. 40 peces). |
| ovillo_rodante | Ovillo Rodante | 60 s | `kl:6` | Un ovillo rueda por la isla y tus gatos lo persiguen. Atrápalo antes de que caiga al mar. | Momentum +0.1 y +10 de medidor de ultimate inicial en tu próxima batalla. |
| gato_dormido_canon | Gato Dormido en el Cañón | 90 s | `first_yard_job` | Un gato se durmió dentro de un cañón del astillero. Despiértalo (clic) sin dispararlo… o dispáralo (es tu decisión; no le pasa nada, cae en una caja). | Ronroneo +2 min afín al Astillero. |
| comerciante | Don Ganzúa, el Comerciante | 180 s | `boss:1` | Un bote sin cara (solo se le ven los ojos) atraca: ofrece 2 cambios de excedentes. | Cambios: Doblones (10 min de ingreso) → 1 Orbe Prisma · 5 Chatarra → 1 Plano · 20 Cristales de un elemento → 15 de otro. Máx. 1 de cada por visita. |
| burbuja_resonancia | Burbuja de Resonancia | 60 s | `resonance_running` | Una burbuja con un corazón sale del Santuario y flota por la isla: revientala. | Ronroneo 1.5 min afín a la Resonancia en curso. |
| meteorito_chiquito | Meteorito Chiquito | 60 s | `element:cosmic` | Cae una piedrita brillante en una expansión: encuéntrala. | Cristales 🌌 x3. |
| error_404 | Error 404 | 60 s | `element:cosmic (una sola vez hasta capturarlo)` | Glitches aparecen sobre la isla: atrapa 5 en 60 s → Duelo contra Pixel Glitch. | Pixel Glitch, el Gato del Caos (secreto). Si fallas, vuelve más adelante. |

Reglas: 1 cada 6–10 min de juego activo, nunca durante batallas, jefes o modales T3/T4; nunca el mismo dos veces seguidas; premios indexados a la producción; si lo ignoras, se va sin castigo.

**🔥 Eventos Flash** (`balance:events.flash`: cada 2 niveles de Reino desde el 5; 8 min; 3 victorias; botín x1.5; premio 1 gema + 6 cristales + Ronroneo). Empiezan con un **PRESAGIO** (banner sin reloj: hasta 10 min para prepararte y aceptar); al aceptar, storyboard k (BOOOOM, reloj rojo "07:59" que golpea la pantalla). Nunca dos relojes rojos a la vez; nunca interrumpen a un jefe; si fallas, lo ganado por batalla se queda. Corren en tiempo de juego (cerrar la pestaña no te lo roba). Tipos (cada uno es el core loop con otro objetivo):

| id | Nombre | Presagio | Giro de reglas | Bonus |
|---|---|---|---|---|
| migracion_leviatan | Migración del Leviatán | _El mar huele a sardina gigante…_ | Todas las cosechas que TERMINEN durante el evento dan x15 comida (CHARLA). Aparecen barcos-ballena en tu etapa frontera. | Si las 3 victorias son contra barcos-ballena: pieza exclusiva 'Arpón del Leviatán' (tipo de arma, una sola vez). |
| tormenta_horizonte | Tormenta en el Horizonte | _Truena… pero no hay nubes._ | Los enemigos traen chispas: cada victoria suelta 1 Fragmento de Tormenta '???' (lore antes de descubrir Tormenta; si ya la tienes: cristales ⚡). | 3 Fragmentos → la ficha de Tronador pasa a 'Rumor'. |
| demolicion_expres | Demolición Exprés | _Un cartel flota: 'SE BUSCA DEMOLEDOR'._ | Puzles de demolición: 3 barcos-reto que tienes que hundir en 3 turnos (3 disparos de gato + sus andanadas). La solución existe: colapso, polvorín o brecha. | +1 Plano por puzle resuelto al primer intento. |
| niebla_distraxia | Niebla de Distraxia | _Todo se ve borroso… ¿de qué estábamos hablando?_ | Batallas con niebla: la vista previa de trayectoria se corta al 50% para todos (Linterna Espíritu la ignora). | Lore de Distraxia + Orbes x10 de un gato de la tripulación. |
| sobrecarga_volcanica | Sobrecarga Volcánica | _La Isla Volcánica tose humo._ | Durante 8 min: gatos 🔥 hacen x3 de daño, pero tus granjas producen −50% comida (decisión horrible y deliciosa: 'A LA MIERDA LAS GRANJAS'). | Cristales 🔥 x10. |
| mar_de_cristal | Mar de Cristal | _El agua se puso dura. Y brillante._ | Todos los barcos enemigos están hechos de cristal (x1.5 contra Tierra, quebradizos). | Cristales 🪨 x10. |
| marea_fantasma | Marea Fantasma | _Las olas regresan… sin hacer ruido._ | Los barcos que hundes regresan UNA vez como fantasmas (30% de vida, casco de hueso) y hay que hundirlos otra vez. El último es el Capitán Fantasma. | Primera vez: Escudo Sacrificial (tipo de escudo) + pista de Velo Noctis. Después: Orbes x10. |
| diluvio | Diluvio | _Va a llover. Mucho. Sobre todo._ | Ambos barcos están Mojados siempre: la Conducción es una fiesta (para los dos). | Cristales ⚡ x10. |
| luna_resonancia | Luna de Resonancia | _Sale una luna rosa… tus gatos se ponen raros._ | Las Resonancias que TERMINEN durante el evento traen mutación garantizada (de combate, ver Mutaciones). | Orbe Prisma x3. |
| lluvia_polvo_estelar | Lluvia de Polvo Estelar | _Brillitos caen del cielo. Pican._ | Cada victoria suelta Polvo Cósmico '???'; con 3 victorias tu Catdex muestra la silueta de Astra Prima (Rumor). Si ya tienes Cósmico: cristales 🌌. | Cristales del elemento más alto que tengas x10. |
| estrella_fugaz | Estrella Fugaz | _¡Algo cayó en una de tus islas!_ | Antes de las batallas: tienes 5:00 (rojo) para encontrar la estrella caída en tu isla (clic). Si la encuentras, la batalla del evento es contra su guardián. | Orbes de Meteoro x50 (o 5% de Meteoro completo si no lo tienes); primera vez: arma Starbreaker. Si ganas con Solar y Lunita a bordo: Eclipse (secreto). |

Orden por Reino (en la Marea Nueva se baraja con semilla: "playthrough A: Raijin en Reino 14 / B: Marea Fantasma primero"): KL5 Migración del Leviatán · KL7 Tormenta en el Horizonte · KL9 Demolición Exprés · KL11 Niebla de Distraxia · KL13 Sobrecarga Volcánica · KL15 Mar de Cristal · KL17 Migración del Leviatán · KL19 Marea Fantasma · KL21 Diluvio · KL23 Demolición Exprés · KL25 Luna de Resonancia · KL27 Niebla de Distraxia · KL29 Lluvia de Polvo Estelar · KL31 Sobrecarga Volcánica · KL33 Estrella Fugaz · KL35 Marea Fantasma · KL37 Mar de Cristal · KL39 Diluvio · KL41 Estrella Fugaz · KL43 Luna de Resonancia · KL45 Migración del Leviatán.

**👑 Expediciones Heroicas** (la Carrera Heroica de DC en solitario; 25:00 sagrados; usan TODA tu economía; prepararte antes de aceptar es parte del juego):

**El Heredero del Trueno** — Reino ≥ balance.events.heroic[0].kl (14) Y Tormenta descubierta (jefe 2). Reloj: balance.events.heroic[0].duration_s (1500 s = 25:00), ROJO sagrado. Pista: `🚩━━●━━●━━●━━●━━●━━●━━🏆`

| Nodo | Tarea | Sistema | Premio del nodo |
|---|---|---|---|
| 1 | Recolecta Doblones = 4 min de tu ingreso (medido al aceptar). | isla | Comida = 3 min de producción |
| 2 | Gana 2 batallas con al menos un gato ⚡ en la tripulación. | combate | Cristales ⚡ x6 |
| 3 | Pesca comida = 3 min de tu producción. | muelle | Orbes de Raijin x10 (se guardan aunque aún no lo tengas) |
| 4 | Destruye 12 módulos enemigos. | combate | Planos x2 |
| 5 | Sube 5 niveles en total a tus gatos. | alimentar | Gemas x2 |
| 6 | Gana 2 batallas cualesquiera. | combate | Orbe Prisma x5 |
| 7 | FINAL: derrota a Raijin (batalla especial 'Nube de Guerra'). | jefe | RAIJIN (Mítico) + balance gems (5) |

- Umbral seguro: con 5 de 7 nodos completados recibes Orbes de Raijin x30 aunque no llegues al final.
- Sprint: nodos 1-3 en menos de 8:00 → premios de esos nodos x2 y Reliquia 'Corona del Trueno'.
- Si se acaba el reloj, la Heroica regresa 3 niveles de Reino después como 'Revancha Heroica' conservando los nodos hechos.

**Grieta Cósmica** — Reino ≥ balance.events.heroic[1].kl (37) (Cósmico ya descubierto por el jefe 5). Reloj: 1500 s (25:00), ROJO sagrado. Pista: `🚩━━●━━●━━●━━●━━●━━●━━🕳️`

| Nodo | Tarea | Sistema | Premio del nodo |
|---|---|---|---|
| 1 | Recolecta Doblones = 4 min de tu ingreso. | isla | Comida = 3 min |
| 2 | Termina 1 Resonancia con al menos un padre 🌌 (se acelera con Ronroneo). | resonancia | Orbe Prisma x5 |
| 3 | Gana 2 batallas con al menos un gato 🌌. | combate | Cristales 🌌 x8 |
| 4 | Sube de estrella a cualquier gato O sube 5 niveles en total. | estrellas | Gemas x2 |
| 5 | Destruye 15 módulos. | combate | Planos x3 |
| 6 | Gana 2 batallas cualesquiera. | combate | Orbes de Singularidad x10 |
| 7 | FINAL: La Grieta ('¡MATEN A ESE YA!'). | jefe | SINGULARIDAD (Mítico) + 5 gemas |

- 5 de 7 nodos → Orbes de Singularidad x30.
- Nodos 1-3 en menos de 8:00 → premios x2.
- Revancha Heroica 3 niveles después (post-capítulo si hace falta).


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

| Reino | Automatización | Origen | Regla |
|---|---|---|---|
| 1 | **Asalto Rápido** | diseño (no simulado) | En etapas ya ganadas con PoderBarco/PoderEnemigo ≥ 2.5 (p ≥ 0.95 según balance.combat.win_formula): botón que resuelve la batalla en 5 s con animación resumen. Botín normal de etapa ya ganada (farm_stage_mult). |
| 1 | **Análisis de Jefe** | diseño (no simulado) | Cada derrota contra un jefe suma balance.combat.boss_analysis_per_defeat (20%). 20%: ves la vida de cada fase · 40%: punto débil revelado · 60%: telegrafía 1 turno antes · 80-100%: el poder del jefe baja hasta balance.combat.boss_analysis_power_bonus_max (25%). |
| 1 | **Auto-Ronroneo** | diseño (no simulado) | El Ronroneo que ganas se aplica solo al reloj verde FIJADO (📌) o, si no hay, al que esté más cerca de terminar. Lo que sobra va a la reserva (tope balance.ronroneo.pool_cap). |
| 3 | **Recolectar todo** | balance.automation | Botón 'Recolectar todo' en la HUD (cascada única de monedas, storyboard h). |
| 6 | **Alimentar hasta nivel X** | balance.automation | En el panel del gato: 'Alimentar hasta Nv X' (slider; respeta el tope KL+5). Niveles intermedios T0, último T1. |
| 9 | **Granjas repiten la ultima receta** | balance.automation | Cada parcela recuerda su última receta y la vuelve a sembrar al cosechar (si hay Doblones). |
| 10 | **Comprar x10 / MAX** | diseño (no simulado) | Botones x10 y MAX en mejoras de granja y alimentar (sentir la escala). |
| 15 | **Banco del Reino: auto-deposito de oro (offline hasta 2 h)** | balance.automation | Banco del Reino (edificio 2x2): el oro de todos los hábitats entra solo a la cartera; ignora el tope 'LLENO'. Offline hasta 2 h (+2 h con el Puerto). |
| 18 | **Cola de Resonancia (3 parejas)** | balance.automation | Cola de 3 parejas por ranura: al revelarse una, arranca la siguiente. |
| 21 | **Auto-cosecha al Silo** | balance.automation | 'Mar de Pescados Automático': las cosechas listas van solas al Silo (la comida entra sin clic). |
| 24 | **Gatos trabajadores** | balance.automation | Panel de Oficios: asigna gatos con oficio (balance.cats.workers). Trabajando NO suben al barco. |
| 28 | **Auto-alimentar (regla por habitat)** | balance.automation | Regla por hábitat: 'mantener a sus gatos en el tope de nivel' o 'hasta Nv X'; gasta comida sola. |
| 32 | **Expediciones se repiten solas** | balance.automation | Las expediciones se relanzan solas con la misma tripulación y duración. |
| 36 | **Auto-estrellas y auto-equipar modulos** | balance.automation | Las estrellas se suben solas al juntar orbes (si el nivel lo permite) y los módulos nuevos se equipan solos si suben el Poder de Barco. |
| 40 | **Simulacro: auto-batalla en etapas ya ganadas (70% botin)** | balance.automation | Simulacro: batallas automáticas en etapas ya ganadas mientras haces otra cosa (70% del botín, balance). |
| 42 | **Ordenes de flota: el barco libre farmea solo mientras juegas otra cosa** | balance.automation | Órdenes de flota: el barco que NO está activo farmea la mejor etapa ganada en segundo plano. |

### 2.16 Expansiones de terreno (las islas de Dragon City, pero cada una abre algo)

Se compran solo con Doblones (requieren Reino y un Constructor libre); limpiar el terreno es un reloj verde (rocas que se rompen, gatos constructores con cascos); al terminar se revela el bioma y su **secreto** (T3). Los precios bloqueados se ven desde el inicio ("Bosque Costero: 400 · Acantilado: 7,000 · Isla Volcánica: 120K · Ruinas: 200M…": lo imposible queda grabado; dos horas después "ah sí, la volcánica, de una").

| # | Expansión | Bioma (prototipo) | Reino | Costo (Doblones) | Limpieza | Parcelas hab/granja | Bono (balance) | Qué abre | Secreto |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Bosque Costero** | forest | 3 | 400 | 30 s | 2/1 | food 0.1 | Habitats de Naturaleza +25%, misiones de Criador. Cadena del Criador (misiones). Hábitat de Naturaleza (bioma bosque). | **Santuario Sellado**: Duelo contra el Guardián Musgoso (Musgo pirata). → 2 gemas + pista de Lumen (Rumor) |
| 2 | **Acantilado Rocoso** | cliff | 7 | 7,000 | 60 s | 2/0 | builders 1 | 2o Constructor, ruinas de Tierra (Zona 2). 2.º Constructor; ruinas de Tierra (puerta a la Zona 2). | **Fósil en la Pared**: Un fósil incrustado: clic 10 veces para sacarlo. → 2 gemas + 5 orbes de Gea (se guardan) |
| 3 | **Isla Volcanica** | volcano | 12 | 120K | 120 s | 2/1 | resonance_slots 1, gold 0.1 | 2a ranura de Resonancia, Forja de canones (-20% chatarra Armas). 2.ª ranura de Resonancia; Forja de cañones; Ancla (módulo). | **Forja Dormida**: Una forja apagada: enciéndela con un gato 🔥 de nivel 10+. → 2 gemas + tipo de arma Mortero de Magma |
| 4 | **Puerto de las Mareas** | ghost | 17 | 2.00M | 240 s | 1/1 | expedition_slots 2, yard_queues 1, offline_bank_h 2 | Expediciones, 2o dique del Astillero, Banco del Reino offline +2 h. Expediciones; 2.º dique del astillero; Banco del Reino offline +2 h. | **Botella del Faro**: Una botella con una carta firmada con un antifaz. → 2 gemas + lore + pista de Velo Noctis (Rumor) |
| 5 | **Glaciar Bigote** | ice | 22 | 35.0M | 420 s | 2/2 | food 0.25 | Granjas +25%, Escudos -20% costo, parcelas de cultivo largas. Granjas +25% (balance bonus food), escudos −20% costo, parcelas de cultivo largas; Torre Elemental (módulo). | **Gato en el Hielo**: Un gato congelado (Fanguito pirata) sostiene un cañón raro. Descongélalo con un gato 🔥. → 2 gemas + tipo de arma Lanzaescarcha |
| 6 | **Ruinas Arcanas** | ruins | 27 | 200M | 720 s | 2/0 | resonance_slots 1, gold 0.15 | 3a Resonancia, Bajel Arcano, secretos. 3.ª Resonancia, astillero del Bajel Arcano, secretos. | **Santuario Gatuno Antiguo**: Batalla especial 'La Orquesta Muda' (secret_orquesta). → 4 gemas + Sonata Prima (secreto) + lore del Archivo Vivo |
| 7 | **Arrecife Prismatico** | reef | 31 | 400M | 1200 s | 2/1 | prisma_per_h 6, catdex_bonus 0.01 | Mina de Orbes Prisma (6/h), Catdex +1% extra por especie. Mina de Orbes Prisma; +1% extra por especie del Catdex. | **Concha Espejo**: Una concha gigante que refleja tu barco. → 2 gemas + Escudo Espejo |
| 8 | **Atolon Estelar** | cosmic | 36 | 1.50B | 1800 s | 2/1 | gold 0.25 | +25% oro, parcelas para Nucleo Celestial y Atun de Nebulosa, muelle hacia el Leviatan. Núcleo Celestial, Atún de Nebulosa, 'muelle hacia el Leviatán' (atajo narrativo; NO es requisito del jefe final). | **Faro del Primer Mar**: Un faro apagado que apunta a la Zona 6. → 4 gemas + escena: el faro se enciende y señala al Leviatán |

Regiones (centros en la rejilla 44x44 para `generateArchipelago`): en `04-content.json → expansions[].region`. Bioma nuevo **`reef`** para el Arrecife (paleta en la tabla). El Atolón Estelar es atajo narrativo, **no requisito** del jefe final.

### 2.17 Reino (nivel de cuenta)

- XP como % de una barra que crece (`balance:kingdom`): construcciones, mejoras de barco, niveles de gato, estrellas, eclosiones, especies, victorias/derrotas, jefes (60%), expansiones (50%), misiones. Impulso de tutorial (x2 en Reino 1, desaparece en el 11) y "arrastre" que alarga los niveles altos. Tope 50; el capítulo termina en Reino ~43 (44–50 = post-capítulo).
- Subir de nivel: T1 (T2 en hitos), +2.5 min de Ronroneo, misiones nuevas, presagios, gemas cada 5 niveles, tope de nivel de gato +1.
- **Hitos que cambian reglas** cada 20–30 min (★):

| Reino | Tope Nv gato | Qué pasa (★ = cambia reglas) |
|---|---|---|
| 1 | 6 | ★ Automatización: Asalto Rápido · ★ Automatización: Análisis de Jefe · ★ Automatización: Auto-Ronroneo |
| 3 | 8 | ★ Automatización: Recolectar todo · Expansión disponible: Bosque Costero |
| 4 | 9 | Hábitat tier 2: Cesta de Mimbre (x1.6, cap. 3) · Cultivo: Anchoas Saltarinas (120 s → 80 comida) |
| 5 | 10 | Barco en el astillero: Gorrion · Presagio de Evento Flash: Migración del Leviatán · Hito: +2 gemas |
| 6 | 11 | ★ Automatización: Alimentar hasta nivel X |
| 7 | 12 | Expansión disponible: Acantilado Rocoso · Presagio de Evento Flash: Tormenta en el Horizonte |
| 9 | 14 | ★ Automatización: Granjas repiten la ultima receta · Hábitat tier 3: Torre Rascadora (x2.6, cap. 3) · Cultivo: Banco de Caballa (300 s → 520 comida) · Presagio de Evento Flash: Demolición Exprés |
| 10 | 15 | ★ Automatización: Comprar x10 / MAX · Hito: +2 gemas |
| 11 | 16 | Presagio de Evento Flash: Niebla de Distraxia |
| 12 | 17 | Expansión disponible: Isla Volcanica |
| 13 | 18 | Presagio de Evento Flash: Sobrecarga Volcánica |
| 14 | 19 | Presagio de Expedición Heroica: El Heredero del Trueno |
| 15 | 20 | ★ Automatización: Banco del Reino: auto-deposito de oro (offline hasta 2 h) · Hábitat tier 4: Casita de Coral (x4.2, cap. 4) · Cultivo: Salmon Imperial (720 s → 3400 comida) · Barco en el astillero: Merodeador · Presagio de Evento Flash: Mar de Cristal · Presagio: Bandera Negra (evento de 20 min) · Hito: +2 gemas |
| 17 | 22 | Expansión disponible: Puerto de las Mareas · Presagio de Evento Flash: Migración del Leviatán |
| 18 | 23 | ★ Automatización: Cola de Resonancia (3 parejas) |
| 19 | 24 | Presagio de Evento Flash: Marea Fantasma |
| 20 | 25 | ★ Hito: MUTACIONES (las Resonancias pueden traer mutación de combate) · Hito: +2 gemas |
| 21 | 26 | ★ Automatización: Auto-cosecha al Silo · Hábitat tier 5: Palacio de Cojines (x7.0, cap. 4) · Cultivo: Pulpo Glaseado (1500 s → 22000 comida) · Presagio de Evento Flash: Diluvio |
| 22 | 27 | Expansión disponible: Glaciar Bigote |
| 23 | 28 | Presagio de Evento Flash: Demolición Exprés |
| 24 | 29 | ★ Automatización: Gatos trabajadores · ★ Historia: 'Algo viene' → elemento Magia |
| 25 | 30 | Presagio de Evento Flash: Luna de Resonancia · Hito: +2 gemas |
| 27 | 32 | Hábitat tier 6: Templo del Ronroneo (x11.0, cap. 5) · Expansión disponible: Ruinas Arcanas · Presagio de Evento Flash: Niebla de Distraxia |
| 28 | 33 | ★ Automatización: Auto-alimentar (regla por habitat) · Cultivo: Pez Linterna Abisal (2700 s → 140000 comida) |
| 29 | 34 | Presagio de Evento Flash: Lluvia de Polvo Estelar |
| 30 | 35 | ★ Hito: HERENCIA (el hijo puede heredar el rasgo de un padre) · Hito: +2 gemas |
| 31 | 36 | Hábitat tier 7: Santuario Arcano (x18.0, cap. 5) · Expansión disponible: Arrecife Prismatico · Presagio de Evento Flash: Sobrecarga Volcánica |
| 32 | 37 | ★ Automatización: Expediciones se repiten solas |
| 33 | 38 | Cultivo: Banquete del Leviatan (21600 s → 2400000.0 comida) · Presagio de Evento Flash: Estrella Fugaz |
| 35 | 40 | Presagio de Evento Flash: Marea Fantasma · ★ Hito: LINAJE (mutación 'Eco Paterno': hereda un modificador de disparo) · Hito: +2 gemas |
| 36 | 41 | ★ Automatización: Auto-estrellas y auto-equipar modulos · Hábitat tier 8: Nucleo Celestial (x30.0, cap. 6) · Cultivo: Atun de Nebulosa (3600 s → 5500000.0 comida) · Expansión disponible: Atolon Estelar · Historia: Revancha del Patito Pirata |
| 37 | 42 | Presagio de Evento Flash: Mar de Cristal · Presagio de Expedición Heroica: Grieta Cosmica |
| 38 | 43 | Historia: A VOID SHIP HAS ENTERED YOUR WORLD |
| 39 | 44 | Presagio de Evento Flash: Diluvio |
| 40 | 45 | ★ Automatización: Simulacro: auto-batalla en etapas ya ganadas (70% botin) · Hito: +2 gemas |
| 41 | 46 | Presagio de Evento Flash: Estrella Fugaz |
| 42 | 47 | ★ Automatización: Ordenes de flota: el barco libre farmea solo mientras juegas otra cosa |
| 43 | 48 | Presagio de Evento Flash: Luna de Resonancia |
| 45 | 50 | Presagio de Evento Flash: Migración del Leviatán · Hito: +2 gemas |
| 50 | 50 | Hito: +2 gemas |

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

| # | id | Arte (slug) | Tinte (variante) | Nombre | Elem. | Rareza | Rol | Oficio | Disparo normal | Ultimate (grito) | Limitación | Pasiva | Oro base/s | Cómo se obtiene |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `c_canelo` | `canelo_cozy_cat` | — | **Canelo**, el Impaciente | 🔥 | Común | artillero | — | Hairball Ignition (bola_rebote, 60) | HAIRBALL BARRAGE! (毛玉乱射) | — | Calorcito: +10% daño a celdas de madera. | 0.5 | Inicial. Duerme en una caja de cartón al empezar. |
| 2 | `c_chispa` | `sol_sunbeam_cat` | hue -12°, sat x1.25, capa #ff6a1a 18%, decal 'brasas', escala x0.92 | **Chispa**, la Sonrisa Peligrosa | 🔥 | Común | artillero | Banquero | Chispazo (bola_rebote, 55) | SUNNY SIDE UP! (目玉焼き) | — | Iniciativa: si es el primer gato en disparar en la batalla, +15% daño. | 0.5 | Resonancia con al menos un padre 🔥 (Común). |
| 3 | `c_gelatino` | `jelly_aquatic_cat` | — | **Gelatino**, el Blandito | 💧 | Común | asediador | Granjero | Torpedo de Gelatina (torpedo, 55) | TIDAL COMPRESSION! (潮圧) | — | Rebote blandito: el primer golpe directo que recibe por batalla hace 50% menos. | 0.5 | Inicial. |
| 4 | `c_burbujas` | `jelly_aquatic_cat` | hue +40°, sat x1.15, brillo x1.1, capa #a3f7ff 20%, decal 'burbujas', escala x0.92 | **Burbujas**, la Efervescente | 💧 | Común | soporte | — | Burbujazo (bola_rebote, 40) | BUBBLE PARTY! (泡祭り) | — | Espuma: tus celdas Ardiendo adyacentes a su camarote se apagan al inicio de tu turno. | 0.5 | Resonancia con al menos un padre 💧 (Común). |
| 5 | `c_brote` | `margarita_daisy_cat` | — | **Brote**, la Margarita Terca | 🌿 | Común | asediador | Granjero | Semilla de Margarita (semilla, 45) | FRESH BLOOM! (開花) | — | Rocío: tus módulos Ardiendo adyacentes a su camarote pierden 1 turno de fuego. | 0.5 | Inicial. |
| 6 | `c_musgo` | `menta_botanical_cat` | — | **Musgo**, el que Nunca se Mueve | 🌿 | Común | tanque | Constructor | Bola de Musgo (semilla, 50) | MOSS WALL! (苔壁) | — | Raíces: su camarote tiene +30% de vida. | 0.5 | Resonancia con al menos un padre 🌿 (Común). |
| 7 | `c_terron` | `kintsugi_tea_spirit_cat` | — | **Terrón**, de Azúcar | 🪨 | Común | soporte | Constructor | Taza Voladora (roca, 60) | KINTSUGI! (金継ぎ) | — | Grietas doradas: cada módulo que repares recibe −20% del siguiente golpe. | 0.5 | Resonancia con al menos un padre 🪨 (Común). Requiere Tierra descubierta. |
| 8 | `c_guijarro` | `fossilstone_guardian_cat` | hue +10°, sat x0.6, brillo x1.1, capa #d1b37b 15%, escala x0.88 | **Guijarro**, la Cría de Piedra | 🪨 | Común | demoledor | — | Amonita (roca, 70) | AMMONITE QUAKE! (地震) | — | Pesado: no lo empujan las ráfagas ni el viento. | 0.5 | Resonancia con al menos un padre 🪨 (Común). |
| 9 | `c_voltio` | `mecha_neon_cat` | hue +50°, sat x1.1, brillo x1.1, capa #ffe14a 18%, decal 'rayos', escala x0.9 | **Voltio**, el Cable Pelado | ⚡ | Común | francotirador | Viajero | Rayito (rayo, 50) | ZAP ZAP ZAP! (ビリビリ) | — | Puntería: vista previa de trayectoria +30%. | 0.5 | Resonancia con al menos un padre ⚡ (Común). Requiere Tormenta descubierta. |
| 10 | `c_nimbo` | `nube_dream_cat` | — | **Nimbo**, la Siesta con Viento | ⚡ | Común | controlador | — | Ventolera (rafaga, 35) | CUMULUS NAP! (積雲の昼寝) | — | Siesta salvadora: una vez por batalla, si recibe un golpe letal, se duerme y queda con 1 de vida. | 0.5 | Resonancia con al menos un padre ⚡ (Común). |
| 11 | `c_linterna` | `lantern_spirit_cat` | — | **Linterna Espíritu**, la que Alumbra lo Feo | ✨ | Común | controlador | — | Fuego Fatuo (runa, 45) | WILL-O'-WISP PARADE! (鬼火行列) | — | Faro: mientras viva, ignoras la Niebla y ves la vida de todos los gatos enemigos. | 0.5 | Resonancia con al menos un padre ✨ (Común). Requiere Magia descubierta. |
| 12 | `c_caramelo` | `candy_alchemist_cat` | — | **Caramelo Alquimista**, Dulcera | ✨ | Común | asediador | Banquero | Frasco Caramelo (bola_rebote, 50) | SUGAR RUSH TRANSMUTATION! (錬金) | — | Sobredosis: Maldito que aplica dura +1 turno. | 0.5 | Resonancia con al menos un padre ✨ (Común). |
| 13 | `c_cometin` | `alien_galaxy_cat` | hue +150°, brillo x1.1, capa #59f5ff 20%, decal 'estrellas', escala x0.9 | **Cometín**, el Visitante Chiquito | 🌌 | Común | artillero | Viajero | Mini Planeta (orbe_gravitatorio, 55) | COLLAPSING ORBIT! (崩壊軌道) | — | Turista: +10% daño en su primera batalla contra cada zona nueva. | 0.5 | Resonancia con al menos un padre 🌌 (Común). Requiere Cósmico descubierto. |
| 14 | `c_lunita` | `nori_lunar_cat` | hue +20°, sat x0.9, brillo x1.25, capa #b8d5ff 22%, decal 'lunas', escala x0.9 | **Lunita**, la del Lado Oscuro | 🌌 | Común | francotirador | — | Rayo Lunar (orbe_gravitatorio, 55) | SILENT ECLIPSE! (月蝕) | — | Nocturna: +15% daño en batallas de noche o con niebla. | 0.5 | Resonancia con al menos un padre 🌌 (Común). |
| 15 | `r_neblino` | `nube_dream_cat` | hue -30°, sat x0.7, capa #ffb0a0 18%, decal 'vapor' | **Neblino**, el Vaporcito | 🔥💧 | Raro | controlador | — | Bocanada de Vapor (bola_rebote, 55) | STEAM CURTAIN! (蒸気の幕) | — | Nublado: los gatos enemigos que le apuntan tienen vista previa −30%. | 0.8 | Resonancia cuya unión de elementos incluya 🔥 y 💧 (p. ej. Canelo + Gelatino). |
| 16 | `r_pimenton` | `arce_autumn_cat` | — | **Pimentón**, el Vendaval de Otoño | 🔥🌿 | Raro | asediador | Banquero | Hojarasca Picante (bola_rebote, 30) | AUTUMN INFERNO! (紅葉旋風) | — | Marcador: el siguiente gato que golpee un módulo Marcado hace crítico garantizado. | 0.8 | Resonancia cuya unión de elementos incluya 🔥 y 🌿. Primera Resonancia del tutorial (Canelo + Brote): resultado garantizado en 90 s (balance.timer_rules.tutorial_first_resonance). |
| 17 | `r_nenufar` | `sakura_whisper_cat` | — | **Nenúfar**, la Flor que Flota | 💧🌿 | Raro | soporte | Granjero | Me Quiere, No Me Quiere (runa, 25) | PETAL OATH! (花の誓い) | — | Suerte de flor: +5% de crítico a todo el equipo. | 0.8 | Resonancia cuya unión incluya 💧 y 🌿. |
| 18 | `r_magmito` | `molten_ember_cat` | hue +15°, brillo x1.15, capa #ff9a3a 20%, decal 'grietas_lava', escala x0.88 | **Magmito**, el Hijo de la Fragua | 🔥🪨 | Raro | demoledor | — | Roca Fundida (roca, 75) | LAVA BOMB! (溶岩弾) | — | Caliente: sus impactos contra celdas Congeladas hacen x2 (deshielo violento). | 0.8 | Resonancia cuya unión incluya 🔥 y 🪨. |
| 19 | `r_fanguito` | `kintsugi_tea_spirit_cat` | hue -20°, sat x0.6, brillo x0.8, capa #6b4a2b 30%, decal 'lodo' | **Fanguito**, el Charco con Patas | 💧🪨 | Raro | tanque | — | Bola de Lodo (roca, 55) | MUDSLIDE! (泥流) | — | Barro: −20% de daño de fuego recibido. | 0.8 | Resonancia cuya unión incluya 💧 y 🪨. |
| 20 | `r_raizvieja` | `mushroom_druid_cat` | hue +25°, sat x0.7, brillo x0.85, capa #857b1b 20%, decal 'raices', escala x0.92 | **Raíz Vieja**, la Abuela del Bosque | 🌿🪨 | Raro | invocador | Constructor | Hongo Mina (semilla, 40) | ROOT QUAKE! (根地震) | — | Paciencia: sus hongos hacen +10% por cada turno que sobreviven. | 0.8 | Resonancia cuya unión incluya 🌿 y 🪨. |
| 21 | `r_plasmin` | `mecha_neon_cat` | hue -140°, sat x1.2, capa #ff2e88 20%, decal 'plasma' | **Plasmín**, el Enchufe Caliente | 🔥⚡ | Raro | francotirador | — | Bala de Plasma (rayo, 85) | PLASMA OVERDRIVE! (プラズマ) | CAÑÓN DE CRISTAL | Sobrecalentado: +25% daño contra hierro. | 0.8 | Resonancia cuya unión incluya 🔥 y ⚡. |
| 22 | `r_marejada` | `selene_moonlit_cat` | — | **Marejada**, la Marea de Plata | 💧⚡ | Raro | tanque | Viajero | Ola Lunar (torpedo, 55) | SILVER TIDE! (銀の潮) | — | Luna llena: tus módulos con escudo reflejan 15% del daño que reciben. | 0.8 | Resonancia cuya unión incluya 💧 y ⚡. |
| 23 | `r_cyberbloom` | `cyber_bloom_cat` | — | **Cyber Bloom**, el Jardinero Protocolo | 🌿⚡ | Raro | soporte | Granjero | Semilla Dron (semilla, 70) | OVERGROWTH PROTOCOL! (過成長) | — | Mantenimiento: al inicio de tu turno repara 5% al módulo propio más dañado. | 0.8 | Resonancia cuya unión incluya 🌿 y ⚡. |
| 24 | `r_iman` | `steampunk_clockwork_cat` | — | **Imán**, Tictoque el Maquinista | 🪨⚡ | Raro | controlador | Banquero | Bala Magnética (roca, 60) | STEAM OVERLOAD! (蒸気過負荷) | — | Cuerda: cada 3 turnos, el siguiente aliado que dispare no gasta su recarga. | 0.8 | Resonancia cuya unión incluya 🪨 y ⚡. |
| 25 | `r_arcanito` | `lantern_spirit_cat` | hue +180°, sat x1.2, capa #ff6a1a 22%, decal 'runas' | **Arcanito**, el Farolito Rabioso | 🔥✨ | Raro | asediador | — | Fuego Arcano (runa, 55) | ARCANE BONFIRE! (秘火) | — | Llama eterna: su fuego no se apaga con agua (el Vapor no lo extingue). | 0.8 | Resonancia cuya unión incluya 🔥 y ✨. |
| 26 | `r_mareaenc` | `deepsea_sprite_cat` | hue +60°, sat x1.1, brillo x1.05, capa #d296ff 22%, decal 'runas' | **Marea Encantada**, la Sirena de la Biblioteca | 💧✨ | Raro | controlador | — | Ola Hechizada (torpedo, 50) | ENCHANTED UNDERTOW! (魔潮) | — | Amplifica: el Mojado que aplica dura el doble. | 0.8 | Resonancia cuya unión incluya 💧 y ✨. |
| 27 | `r_origami` | `iridescent_origami_cat` | — | **Origami Iridiscente**, Ori de Mil Pliegues | 🌿✨ | Raro | artillero | Constructor | Mil Grullas (runa, 22) | THOUSAND CRANES! (千羽鶴) | — | Plegable: −25% de daño recibido de explosiones de área. | 0.8 | Resonancia cuya unión incluya 🌿 y ✨. |
| 28 | `r_runachispa` | `bytewhisker_cat` | — | **Runa Chispa**, Bytewhisker (root) | ⚡✨ | Raro | controlador | — | Kernel Panic (rayo, 40) | KERNEL PANIC: SUDO RM! (強制終了) | — | Debug: ves el siguiente objetivo de la IA (icono de mira sobre el módulo o gato que van a atacar). | 0.8 | Resonancia cuya unión incluya ⚡ y ✨. |
| 29 | `r_solar` | `sol_sunbeam_cat` | — | **Solar**, el Mediodía Eterno | 🔥🌌 | Raro | francotirador | — | Rayo de Mediodía (rayo, 65) | HIGH NOON! (正午) | — | Amanecer: en el turno 1 todos tus gatos ganan +20 de medidor. | 0.8 | Resonancia cuya unión incluya 🔥 y 🌌. |
| 30 | `r_astral` | `alien_galaxy_cat` | hue +90°, sat x1.1, capa #c48cff 22%, decal 'estrellas' | **Astral**, la Viajera del Tarot | ✨🌌 | Raro | artillero | Viajero | Carta Astral (orbe_gravitatorio, 30) | ASTRAL PROJECTION! (星幽体) | — | Destino: 10% (PRNG) de que su disparo sea 'carta mayor' (x2). | 0.8 | Resonancia cuya unión incluya ✨ y 🌌. |
| 31 | `e_vaporronin` | `sakura_whisper_cat` | sat x0.85, brillo x1.05, capa #dff1ff 12%, decal 'vapor' | **Vapor Ronin**, el que Vuelve | 🔥💧 | Épico | francotirador | — | Iaido de Vapor (rayo, 60) | MIL PÉTALOS: STEAM SLASH! (千本桜) | SEGUNDA VIDA (Revenant) | Racha samurái: +15% acumulable por turno consecutivo atacando. | 0.91 | Resonancia cuya unión incluya 🔥 y 💧, ambos padres Nv15+. Mutación estrella: Conductividad. |
| 32 | `e_infernal` | `canelo_cozy_cat` | hue -10°, sat x1.4, brillo x0.75, capa #4e0000 35%, decal 'grietas_lava', escala x1.05 | **Canelo Infernal**, el Pirómano | 🔥🪨 | Épico | demoledor | — | Hellball (bola_rebote, 70) | HELLBALL!!! (地獄玉) | SOBRECALENTADO | Pirómano: su Ardiendo dura +1 turno y se propaga también por hierro. | 1.3 | Resonancia cuya unión incluya 🔥 y 🪨, ambos padres Nv15+. Tip: Canelo + un gato de Tierra. |
| 33 | `e_golem` | `fossilstone_guardian_cat` | hue +70°, sat x0.9, brillo x0.9, capa #4f8f4a 28%, decal 'musgo', escala x1.08 | **Gólem Musgoso**, la Montaña que Respira | 🌿🪨 | Épico | tanque | Constructor | Puño Musgoso (roca, 90) | LIVING FORTRESS! (生ける要塞) | PESADO | Guardián: los camarotes adyacentes al suyo reciben −30% daño. | 1.3 | Resonancia cuya unión incluya 🌿 y 🪨, ambos padres Nv15+. |
| 34 | `e_rencor` | `arce_autumn_cat` | hue -25°, sat x1.3, brillo x0.6, capa #c8102e 30%, decal 'rayos' | **Rencor**, el Gato Vengativo | 🔥⚡ | Épico | demoledor | — | Zarpazo Eléctrico (rayo, 70) | WRATH OF THE NINE LIVES! (九生の怒り) | VENGANZA | Rencor: la Rabia nunca baja durante la batalla. | 1.3 | Resonancia cuya unión incluya 🔥 y ⚡, ambos padres Nv15+. |
| 35 | `e_bastion` | `prism_crystal_cat` | — | **Bastión**, la Refracción Absoluta | 🪨✨ | Épico | tanque | — | Refracción (rayo, 60) | ABSOLUTE REFRACTION! (絶対屈折) | 3 ESCUDOS | Prisma: cuando se le rompe un escudo lanza 3 esquirlas automáticas (20 c/u). | 1.3 | Resonancia cuya unión incluya 🪨 y ✨, ambos padres Nv15+. |
| 36 | `e_galaxia` | `jelly_aquatic_cat` | hue +70°, sat x1.2, brillo x0.7, capa #204a7a 35%, decal 'estrellas', escala x1.05 | **Galaxia**, la Medusa Sideral | 💧🌌 | Épico | controlador | Banquero | Marea de Estrellas (torpedo, 70) | GALACTIC UNDERTOW! (銀河逆潮) | LENTA | Nebulosa: los gatos enemigos Mojados reciben +20% de daño cósmico. | 1.3 | Resonancia cuya unión incluya 💧 y 🌌, ambos padres Nv15+. |
| 37 | `e_meteoro` | `regal_cosmic_cat` | hue -150°, sat x1.2, brillo x0.95, capa #ff6a1a 25%, decal 'brasas' | **Meteoro**, la Lluvia Real | 🪨🌌 | Épico | demoledor | — | Meteorito Real (objetivo, 110) | ROYAL METEOR SHOWER! (流星雨) | CARGA | Escombros: los trozos que caen por su impacto hacen daño de caída x2. | 1.3 | Resonancia cuya unión incluya 🪨 y 🌌, ambos padres Nv15+. Sus orbes salen del evento Estrella Fugaz. |
| 38 | `e_supernova` | `sol_sunbeam_cat` | hue +170°, sat x0.9, brillo x1.2, capa #8cc8ff 30%, decal 'estrellas' | **Supernova**, la de Una Sola Bala | ⚡🌌 | Épico | demoledor | — | Destello (rayo, 40) | STARFALL!!! (星墜) | UNA BALA | Supermasiva: su medidor empieza lleno (Starfall listo desde el turno 1). | 1.3 | Resonancia cuya unión incluya ⚡ y 🌌, ambos padres Nv15+. |
| 39 | `e_nebulosa` | `alien_galaxy_cat` | — | **Nebulosa**, Astro Nori, el Visitante | 🌿🌌 | Épico | asediador | Granjero | Semilla Nebular (semilla, 60) | COLLAPSING NEBULA! (星雲崩壊) | LAG ESPACIAL | Clorofila estelar: sus enredaderas no se queman. | 1.3 | Resonancia cuya unión incluya 🌿 y 🌌, ambos padres Nv15+. |
| 40 | `l_ignis` | `molten_ember_cat` | — | **Ignis**, la Primera Llama | 🔥 | Legendario · PRIMORDIAL | demoledor | — | Erupción de Fragua (bola_rebote, 95) | FIRST FLAME: FORGE ERUPTION! (始原の炎) | IGNITION | Origen del Fuego: todos tus gatos 🔥 hacen +10% de daño. | 2.1 | Resonancia de dos padres que COMPARTAN 🔥, ambos Nv20+ (bucket Legendario). También puede salir en '???'. |
| 41 | `l_abisa` | `deepsea_sprite_cat` | — | **Abisa**, Madre Marea | 💧 | Legendario · PRIMORDIAL | francotirador | — | Luz Abisal (torpedo, 85) | ABYSSAL LURE! (深淵の灯) | CEBO | Origen del Agua: tus gatos 💧 +10% daño; las brechas inundan +25% más rápido. | 2.1 | Resonancia de dos padres que compartan 💧, ambos Nv20+. |
| 42 | `l_silvana` | `mushroom_druid_cat` | — | **Silvana**, Raíz Primera | 🌿 | Legendario · PRIMORDIAL | invocador | — | Bosque de Esporas (semilla, 35) | PRIMAL FOREST! (原始の森) | PERSISTENTE | Origen de la Naturaleza: tus gatos 🌿 +10%; tus enredaderas curan 3% a tus módulos adyacentes. | 2.1 | Resonancia de dos padres que compartan 🌿, ambos Nv20+. |
| 43 | `l_gea` | `fossilstone_guardian_cat` | — | **Gea**, Corazón de Piedra | 🪨 | Legendario · PRIMORDIAL | tanque | — | Sismo Ammonite (roca, 80) | HEART OF STONE! (石の心) | COLOSO | Origen de la Tierra: tus gatos 🪨 +10%; tu quilla tiene +50% de vida. | 2.1 | Jefe 1 (Capitán Bigotes Rotos): era el 'fósil vivo' de su bodega. Duplicados: Resonancia de dos padres que compartan 🪨, Nv20+. |
| 44 | `l_tronador` | `stormcloud_elemental_cat` | — | **Tronador**, el Juicio de la Tormenta | ⚡ | Legendario · PRIMORDIAL | artillero | — | Chubasco (rayo, 70) | PERFECT STORM! (完全嵐) | TORMENTOSO | Origen de la Tormenta: tus gatos ⚡ +10%; Conducción salta +2 celdas. | 2.1 | Jefe 2 (La Gárgola Ronroneante): la tormenta permanente toma forma de gato. Duplicados: dos padres que compartan ⚡, Nv20+. |
| 45 | `l_merlina` | `storybook_ink_cat` | — | **Merlina**, la Arcana | ✨ | Legendario · PRIMORDIAL | invocador | — | Y Vivieron… Hundidos (runa, 30) | THE END! (完) | RETARDO | Origen de la Magia: tus gatos ✨ +10%; Maldito revela también camarotes ocultos. | 2.1 | Jefe 4 (El Arcanista): estaba atrapada en su grimorio. Duplicados: dos padres que compartan ✨, Nv20+. |
| 46 | `l_astraprima` | `regal_cosmic_cat` | — | **Astra Prima**, Emperatriz Estelar | 🌌 | Legendario · PRIMORDIAL | demoledor | — | Decreto (orbe_gravitatorio, 90) | STELLAR DECREE: STARFALL! (星の勅令) | MAJESTAD | Origen del Cosmos: tus gatos 🌌 +10%; tus pozos de gravedad duran +1 turno. | 2.1 | Jefe 5 (Estrella Errante): cae al mar con la estrella. Duplicados: dos padres que compartan 🌌, Nv20+. |
| 47 | `m_raijin` | `mecha_neon_cat` | — | **Raijin**, Heredero del Trueno | ⚡ | Mítico | francotirador | — | Railgun Voltaico (rayo, 100) | RAIJIN: THUNDER GOD OVERDRIVE! (雷神降臨) | SOBRECARGA | Heredero: con 2+ gatos ⚡ en el barco, sus Conducciones saltan una vez extra (sinergia con Bobina Tesla). | 3.2 | Premio de la Expedición Heroica 'El Heredero del Trueno' (Reino 14+ con Tormenta descubierta). |
| 48 | `m_singular` | `nori_lunar_cat` | — | **Singularidad**, Eclipse Silente | 🌌 | Mítico | demoledor | — | Pozo Silencioso (orbe_gravitatorio, 70) | SINGULARITY: EVENT HORIZON! (事象の地平線) | CARGA 2 TURNOS | Horizonte: los proyectiles enemigos que pasan a ≤2 celdas de su camarote se curvan (−precisión enemiga). | 3.2 | Premio de la Expedición Heroica 'Grieta Cósmica' (Reino 37). |
| 49 | `s_maneki` | `mochi_bell_cat` | — | **Mochi Maneki**, la Campana de la Suerte | ✨ | Épico · ??? | soporte | — | Campanazo (rafaga, 35) | LUCKY BELL OF DAWN! (招き鐘) | — | Maneki: en el Cat's Gambit suma +3/+2/+1 puntos de probabilidad a las mesas x2/x5/x20 (balance.gambit.cat_mods.maneki). | 1.3 | Ruta A: Resonancia de dos gatos con oficio Banquero, ambos Nv15+ → entra al bucket '???'. Ruta B: rescata 10 Gatos Callejeros (microevento): el 10.º es Mochi. |
| 50 | `s_caos` | `neon_glitch_cat` | — | **Pixel Glitch**, el Gato del Caos | ⚡🌌 | Épico · ??? | francotirador | — | Error 404: Casco No Encontrado (objetivo, 80) | FATAL ERROR! (致命的エラー) | INESTABLE | Caos: habilita en el Cat's Gambit la mesa x50 'todo o nada' (balance.gambit.cat_mods.caos). | 1.3 | Ruta A: Resonancia cuya unión incluya ⚡ y 🌌 mientras hay un Evento Flash activo → bucket '???'. Ruta B: microevento 'Error 404' (tras descubrir Cósmico): atrapa 5 glitches en 60 s → duelo → se une. |
| 51 | `s_noctis` | `masquerade_phantom_cat` | — | **Velo Noctis**, Capitana de la Mascarada | 💧✨ | Legendario · ??? | controlador | — | Danza de los Mil Rostros (runa, 70) | MASQUERADE: THOUSAND FACES! (千の仮面) | — | Bandera Negra: +40% chatarra si va en el Merodeador (se suma al perk del barco). | 2.1 | Historia: tras vencer al Primer Mar, la rival se une a tu tripulación ('me debes una'). |
| 52 | `s_sonata` | `sonata_prima_cat` | — | **Sonata Prima**, la Primera Nota | ✨🌌⚡ | Mítico · ??? | soporte | — | Crescendo (rafaga, 30) | GRAN FINALE! (大団円) | — | Metrónomo: mientras viva, la recarga de todos tus gatos es −1 (mín. 0). | 3.2 | Ruta A: Resonancia cuya unión cubra ✨, 🌌 y ⚡ con ambos padres Nv30+ → bucket '???'. Ruta B: Santuario Gatuno Antiguo (secreto de las Ruinas Arcanas): vence a 'La Orquesta Muda'. |
| 53 | `s_lumen` | `lumen_lens_cat` | — | **Lumen**, la Fotógrafa del Recuerdo | 🔥💧🌿 | Legendario · ??? | controlador | — | Instantánea Eterna (rayo, 45) | ETERNAL EXPOSURE! (永遠の一瞬) | — | Álbum: guarda la foto del mejor golpe de cada batalla en 'Momentos' del Catdex. | 2.1 | Ruta A: Resonancia cuya unión cubra 🔥, 💧 y 🌿 con ambos padres ★3+ → bucket '???'. Ruta B: registra 40 especies en el Catdex y llega sola ('vine a tomarle foto a tu colección'). |
| 54 | `s_eclipse` | `selene_moonlit_cat` | sat x0.2, brillo x0.35, capa #ffd974 25%, decal 'corona' | **Eclipse**, la que Apaga el Sol | 🔥🌌 | Legendario · ??? | francotirador | — | Corona Negra (rayo, 90) | TOTAL ECLIPSE! (皆既日食) | — | Penumbra: +20% daño a gatos enemigos Expuestos. | 2.1 | Ruta A (CHARLA): Resonancia con Solar + cualquier padre 🌌, uno de ellos Nv20+ → bucket '???'. Ruta B: gana una batalla con Solar y Lunita en la tripulación durante el evento Estrella Fugaz. |

### 3.3 Recetas de Resonancia del capítulo (por par de elementos)

Supuestos de esta tabla: padres Comunes de un solo elemento, sin pity, los 7 elementos descubiertos y sin Épicos/Legendarios registrados (por eso "???" está lleno). Con padres híbridos aplica la regla de la **unión** (ejemplos en 2.6). La UI calcula siempre la tabla viva con el estado real del jugador. Los Primordiales de Tierra, Tormenta, Magia y Cósmico salen primero de sus jefes; después, sus duplicados también por Resonancia (dos padres que compartan el elemento, Nv20+).

| Padres | Escenario | Resultados posibles (%) | ??? |
|---|---|---|---|
| 🔥 + 🔥 | padres Nv<15 | Canelo 49.55% · Chispa 49.55% | 0.9% |
| 🔥 + 🔥 | padres Nv20+ | Canelo 46.61% · Chispa 46.61% · Ignis, la Primera Llama 5.93% | 0.85% |
| 🔥 + 💧 | padres Nv<15 | Neblino 35.09% · Canelo 16.08% · Chispa 16.08% · Gelatino 16.08% · Burbujas 16.08% | 0.58% |
| 🔥 + 💧 | padres Nv20+ | Neblino 31.09% · Canelo 14.25% · Chispa 14.25% · Gelatino 14.25% · Burbujas 14.25% · Vapor Ronin 11.4% | 0.52% |
| 🔥 + 🌿 | padres Nv<15 | Pimenton 35.09% · Canelo 16.08% · Chispa 16.08% · Brote 16.08% · Musgo 16.08% | 0.58% |
| 🔥 + 🌿 | padres Nv20+ | Pimenton 35.09% · Canelo 16.08% · Chispa 16.08% · Brote 16.08% · Musgo 16.08% | 0.58% |
| 🔥 + 🪨 | padres Nv<15 | Magmito 35.09% · Canelo 16.08% · Chispa 16.08% · Terron 16.08% · Guijarro 16.08% | 0.58% |
| 🔥 + 🪨 | padres Nv20+ | Magmito 31.09% · Canelo 14.25% · Chispa 14.25% · Terron 14.25% · Guijarro 14.25% · Canelo Infernal 11.4% | 0.52% |
| 🔥 + ⚡ | padres Nv<15 | Plasmin 35.09% · Canelo 16.08% · Chispa 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 🔥 + ⚡ | padres Nv20+ | Plasmin 31.09% · Canelo 14.25% · Chispa 14.25% · Voltio 14.25% · Nimbo 14.25% · Rencor 11.4% | 0.52% |
| 🔥 + ✨ | padres Nv<15 | Arcanito 35.09% · Canelo 16.08% · Chispa 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| 🔥 + ✨ | padres Nv20+ | Arcanito 35.09% · Canelo 16.08% · Chispa 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| 🔥 + 🌌 | padres Nv<15 | Solar 35.09% · Canelo 16.08% · Chispa 16.08% · Cometin 16.08% · Lunita 16.08% | 0.58% |
| 🔥 + 🌌 | padres Nv20+ | Solar 35.09% · Canelo 16.08% · Chispa 16.08% · Cometin 16.08% · Lunita 16.08% | 0.58% |
| 💧 + 💧 | padres Nv<15 | Gelatino 49.55% · Burbujas 49.55% | 0.9% |
| 💧 + 💧 | padres Nv20+ | Gelatino 46.61% · Burbujas 46.61% · Abisa, Madre Marea 5.93% | 0.85% |
| 💧 + 🌿 | padres Nv<15 | Nenufar 35.09% · Gelatino 16.08% · Burbujas 16.08% · Brote 16.08% · Musgo 16.08% | 0.58% |
| 💧 + 🌿 | padres Nv20+ | Nenufar 35.09% · Gelatino 16.08% · Burbujas 16.08% · Brote 16.08% · Musgo 16.08% | 0.58% |
| 💧 + 🪨 | padres Nv<15 | Fanguito 35.09% · Gelatino 16.08% · Burbujas 16.08% · Terron 16.08% · Guijarro 16.08% | 0.58% |
| 💧 + 🪨 | padres Nv20+ | Fanguito 35.09% · Gelatino 16.08% · Burbujas 16.08% · Terron 16.08% · Guijarro 16.08% | 0.58% |
| 💧 + ⚡ | padres Nv<15 | Marejada 35.09% · Gelatino 16.08% · Burbujas 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 💧 + ⚡ | padres Nv20+ | Marejada 35.09% · Gelatino 16.08% · Burbujas 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 💧 + ✨ | padres Nv<15 | Marea Encantada 35.09% · Gelatino 16.08% · Burbujas 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| 💧 + ✨ | padres Nv20+ | Marea Encantada 35.09% · Gelatino 16.08% · Burbujas 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| 💧 + 🌌 | padres Nv<15 | Gelatino 24.77% · Burbujas 24.77% · Cometin 24.77% · Lunita 24.77% | 0.9% |
| 💧 + 🌌 | padres Nv20+ | Gelatino 20.68% · Burbujas 20.68% · Cometin 20.68% · Lunita 20.68% · Galaxia 16.54% | 0.75% |
| 🌿 + 🌿 | padres Nv<15 | Brote 49.55% · Musgo 49.55% | 0.9% |
| 🌿 + 🌿 | padres Nv20+ | Brote 46.61% · Musgo 46.61% · Silvana, Raiz Primera 5.93% | 0.85% |
| 🌿 + 🪨 | padres Nv<15 | Raiz Vieja 35.09% · Brote 16.08% · Musgo 16.08% · Terron 16.08% · Guijarro 16.08% | 0.58% |
| 🌿 + 🪨 | padres Nv20+ | Raiz Vieja 31.09% · Brote 14.25% · Musgo 14.25% · Terron 14.25% · Guijarro 14.25% · Golem Musgoso 11.4% | 0.52% |
| 🌿 + ⚡ | padres Nv<15 | Cyber Bloom 35.09% · Brote 16.08% · Musgo 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 🌿 + ⚡ | padres Nv20+ | Cyber Bloom 35.09% · Brote 16.08% · Musgo 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 🌿 + ✨ | padres Nv<15 | Origami Iridiscente 35.09% · Brote 16.08% · Musgo 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| 🌿 + ✨ | padres Nv20+ | Origami Iridiscente 35.09% · Brote 16.08% · Musgo 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| 🌿 + 🌌 | padres Nv<15 | Brote 24.77% · Musgo 24.77% · Cometin 24.77% · Lunita 24.77% | 0.9% |
| 🌿 + 🌌 | padres Nv20+ | Brote 20.68% · Musgo 20.68% · Cometin 20.68% · Lunita 20.68% · Nebulosa 16.54% | 0.75% |
| 🪨 + 🪨 | padres Nv<15 | Terron 49.55% · Guijarro 49.55% | 0.9% |
| 🪨 + 🪨 | padres Nv20+ | Terron 46.61% · Guijarro 46.61% · Gea, Corazon de Piedra 5.93% | 0.85% |
| 🪨 + ⚡ | padres Nv<15 | Iman 35.09% · Terron 16.08% · Guijarro 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 🪨 + ⚡ | padres Nv20+ | Iman 35.09% · Terron 16.08% · Guijarro 16.08% · Voltio 16.08% · Nimbo 16.08% | 0.58% |
| 🪨 + ✨ | padres Nv<15 | Terron 24.77% · Guijarro 24.77% · Linterna Espiritu 24.77% · Caramelo Alquimista 24.77% | 0.9% |
| 🪨 + ✨ | padres Nv20+ | Terron 20.68% · Guijarro 20.68% · Linterna Espiritu 20.68% · Caramelo Alquimista 20.68% · Bastion 16.54% | 0.75% |
| 🪨 + 🌌 | padres Nv<15 | Terron 24.77% · Guijarro 24.77% · Cometin 24.77% · Lunita 24.77% | 0.9% |
| 🪨 + 🌌 | padres Nv20+ | Terron 20.68% · Guijarro 20.68% · Cometin 20.68% · Lunita 20.68% · Meteoro 16.54% | 0.75% |
| ⚡ + ⚡ | padres Nv<15 | Voltio 49.55% · Nimbo 49.55% | 0.9% |
| ⚡ + ⚡ | padres Nv20+ | Voltio 46.61% · Nimbo 46.61% · Tronador 5.93% | 0.85% |
| ⚡ + ✨ | padres Nv<15 | Runa Chispa 35.09% · Voltio 16.08% · Nimbo 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| ⚡ + ✨ | padres Nv20+ | Runa Chispa 35.09% · Voltio 16.08% · Nimbo 16.08% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% | 0.58% |
| ⚡ + 🌌 | padres Nv<15 | Voltio 24.77% · Nimbo 24.77% · Cometin 24.77% · Lunita 24.77% | 0.9% |
| ⚡ + 🌌 | padres Nv20+ | Voltio 20.68% · Nimbo 20.68% · Cometin 20.68% · Lunita 20.68% · Supernova 16.54% | 0.75% |
| ✨ + ✨ | padres Nv<15 | Linterna Espiritu 49.55% · Caramelo Alquimista 49.55% | 0.9% |
| ✨ + ✨ | padres Nv20+ | Linterna Espiritu 46.61% · Caramelo Alquimista 46.61% · Merlina, la Arcana 5.93% | 0.85% |
| ✨ + 🌌 | padres Nv<15 | Astral 35.09% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% · Cometin 16.08% · Lunita 16.08% | 0.58% |
| ✨ + 🌌 | padres Nv20+ | Astral 35.09% · Linterna Espiritu 16.08% · Caramelo Alquimista 16.08% · Cometin 16.08% · Lunita 16.08% | 0.58% |
| 🌌 + 🌌 | padres Nv<15 | Cometin 49.55% · Lunita 49.55% | 0.9% |
| 🌌 + 🌌 | padres Nv20+ | Cometin 46.61% · Lunita 46.61% · Astra Prima 5.93% | 0.85% |

### 3.4 Diferencias con el campo `art` provisional de balance.json
El agente de economía dejó 25/48 asignaciones de arte provisionales y reservó 7 ilustraciones para elementos futuros. Este GDD asigna las 32 en el Cap. 1 (encargo explícito) y prioriza Primordiales y Míticos con arte base. **Para el arte manda `04-content.json → cats[].art`** (no es un número de balance). Diferencias:

| id | Arte en balance.json (provisional del agente de economía) | Arte en 04-content.json (decisión) |
|---|---|---|
| `c_terron` | (vacío) | `kintsugi_tea_spirit_cat` |
| `c_voltio` | `mecha_neon_cat` | `mecha_neon_cat + tinte` |
| `c_cometin` | `selene_moonlit_cat` | `alien_galaxy_cat + tinte` |
| `c_lunita` | `nori_lunar_cat` | `nori_lunar_cat + tinte` |
| `r_magmito` | `molten_ember_cat` | `molten_ember_cat + tinte` |
| `r_marejada` | `deepsea_sprite_cat` | `selene_moonlit_cat` |
| `r_iman` | (vacío) | `steampunk_clockwork_cat` |
| `r_runachispa` | (vacío) | `bytewhisker_cat` |
| `r_astral` | `prism_crystal_cat` | `alien_galaxy_cat + tinte` |
| `e_golem` | `mushroom_druid_cat` | `fossilstone_guardian_cat + tinte` |
| `e_bastion` | `kintsugi_tea_spirit_cat` | `prism_crystal_cat` |
| `e_galaxia` | `alien_galaxy_cat` | `jelly_aquatic_cat + tinte` |
| `e_nebulosa` | (vacío) | `alien_galaxy_cat` |
| `l_ignis` | (vacío) | `molten_ember_cat` |
| `l_abisa` | (vacío) | `deepsea_sprite_cat` |
| `l_silvana` | (vacío) | `mushroom_druid_cat` |
| `m_raijin` | (vacío) | `mecha_neon_cat` |
| `m_singular` | (vacío) | `nori_lunar_cat` |

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

**0:00 · En algún momento del futuro…** _(disparador: nueva partida; estilo: NEÓN GLITCH + MANGA TINTA)_

> **CAPTION**: EN ALGÚN MOMENTO DEL FUTURO…  
> **LUZTERNA**: ¿Ves esa cosa enorme? Sí, esa. La que tapa el cielo. Bueno: mantén… y suelta.  
> **SISTEMA**: (El jugador mantiene y suelta: ASTRA PRIMA ★6 — STELLAR DECREE: STARFALL. El barco gigante se parte en tres en viñetas.)  
> **PERIÓDICO**: ¡EXTRA! ¡EXTRA! UN GATO PARTE UN BARCO EN TRES  
> **CAPTION**: MUCHO ANTES…  

**0:50 · Una balsa, una palmera y un gato dormido** _(disparador: fin del prólogo; estilo: COZY ISLA)_

> **LUZTERNA**: Ey. Ey. EY. Despierta, grumete. No, tú no: el gato. Bueno, los dos.  
> **LUZTERNA**: Soy Luzterna. Capitana fantasma, ex-farera del Archivo y, desde hoy, tu jefa. No preguntes por qué soy transparente.  
> **LUZTERNA**: Ese que ronca en la caja se llama Canelo. Tócalo. Con cariño… o no, tú sabrás.  

**1:30 · ¿Cómo se llama?** _(disparador: H01; estilo: COZY ISLA)_

> **LUZTERNA**: ¿Le vas a cambiar el nombre? Si le pones 'Michi' no te juzgo. Mucho.  

**2:00 · Doblones** _(disparador: primer toque a hábitat; estilo: COZY ISLA)_

> **LUZTERNA**: Eso que brilla son Doblones. Los gatos los producen nomás por existir. Ojalá yo.  

**2:15 · Algo huele a pescado** _(disparador: H03; estilo: COZY ISLA)_

> **LUZTERNA**: Los gatos comen. Mucho. Siembra sardinas en el muelle.  
> **LUZTERNA**: Tarda poquito. Puedes esperar… o puedes hacer algo útil mientras. Esa es la regla de este mar: esperas o sigues jugando.  

**3:15 · ¡ÑAM!** _(disparador: H04; estilo: COZY ISLA)_

> **LUZTERNA**: ¿Viste? Creció. Y ojo: aquí subir de nivel no es '+27 de ataque'. Es 'en dos niveles su bola de pelo EXPLOTA'.  

**4:30 · Ahora haz que valga la pena** _(disparador: H05; estilo: NOIR OCEÁNICO → ANIME INFERNO)_

> **LUZTERNA**: ¿Ves ese patito de hule? Es un barco. Es pirata. Y nos está viendo feo.  
> **PATITO**: ¡Cuac! ¡Esta es mi bahía! ¡Cuac!  
> **LUZTERNA**: Ah, sí: tus gatos se transforman en batalla. Cosas del Archivo. No preguntes. Se ve chingón.  
> **LUZTERNA**: Arrastra desde el gato, apunta… y suelta. Si fallas, no pasa nada. Bueno, sí pasa: el pato se ríe.  
> **PATITO**: ¡CUAAAAC!  
> **LUZTERNA**: Aunque pierdas, avanzas. Pero no perdiste. Mira nomás ese botín.  

**7:00 · Eso no era una nube** _(disparador: H07; estilo: DIARIO DEL MAR)_

> **SISTEMA**: (El cielo se oscurece un segundo; la música se corta.)  
> **LUZTERNA**: …Eso no era una nube.  
> **LUZTERNA**: Era Distraxia. La Niebla del Olvido. Larga historia. Te la cuento cuando tengas un barco que no sea de cartón.  

**8:00 · Tus gatos se fueron a invocar otro** _(disparador: H06; estilo: ORQUÍDEA REAL)_

> **LUZTERNA**: El Santuario de Resonancia: juntas a dos gatos y… se van a invocar otro gatito. No preguntes cómo. Es sagrado. Y privado.  
> **CAPTION**: Canelo y Brote se fueron a hacer quién sabe qué…  
> **LUZTERNA**: Tarda minuto y medio. Puedes esperar… o ir a romperle la madre a alguien mientras tanto. Cada victoria baja el reloj verde.  

**9:30 · ¡Mira lo que salió!** _(disparador: K07; estilo: EDITORIAL SUIZO)_

> **CAPTION**: Canelo y Brote se fueron a invocar otro… y volvieron con ESTO.  
> **LUZTERNA**: ¿Un gato de fuego Y planta? ¿Un RARO a la primera? Qué suertudo. No te acostumbres. (Sí acostúmbrate.)  
> **LUZTERNA**: Ahora junta fuego con agua y espera a que crezcan… dicen que de ahí sale vapor. Y a veces, algo MUCHO peor.  

**~28:00 · El Capitán Bigotes Rotos** _(disparador: H08; estilo: MANGA TINTA → DIARIO DEL MAR)_

> **BIGOTES**: ¡Arrr! ¿Una balsa? ¿Con TRES gatos? Esto va a ser más fácil que robarle el pescado a un gato dormido.  
> **LUZTERNA**: Tiene barriles de pólvora en la cubierta. Yo nomás digo.  
> **BIGOTES**: Bueno… quédate el fósil. Muerde.  
> **LUZTERNA**: ¿Un fósil VIVO en la bodega? Ese pirata no sabía lo que tenía. Tú tampoco, pero tú sí lo vas a usar.  
> **SISTEMA**: NUEVO ELEMENTO DESCUBIERTO: TIERRA 🪨 · Gea, Corazón de Piedra se une.  

**~31:00 · Una máscara en el horizonte** _(disparador: H09; estilo: ORQUÍDEA REAL)_

> **NOCTIS**: Bonita balsa. ¿La hiciste tú? Se nota.  
> **LUZTERNA**: Velo Noctis. Capitana de la Bandera Negra. Roba gatos, roba núcleos, roba protagonismo.  
> **NOCTIS**: Nos vemos en el siguiente mar, grumete. Si llegas.  

**~1:06 · Tormenta permanente** _(disparador: H10; estilo: DIARIO DEL MAR → CÓMIC SILVER AGE)_

> **GÁRGOLA**: Rrrrrr… Trescientos años durmiendo en este acantilado. ¿Y tú vienes a hacer ruido?  
> **GÁRGOLA**: La tormenta ya no es mía. Llévatela. Hace ruido.  
> **SISTEMA**: NUEVO ELEMENTO DESCUBIERTO: TORMENTA ⚡ · Tronador se une.  

**~1:15 · El Heredero del Trueno** _(disparador: heroica_1; estilo: COLLAGE GRUNGE)_

> **LUZTERNA**: Algo truena en el horizonte y no es tu estómago. Un heredero del trueno anda buscando pleito.  
> **LUZTERNA**: Tienes 25 minutos REALES. No se pausan. Ni con gemas. Ni llorando. Prepárate antes de aceptar.  
> **RAIJIN**: Ok. Me caes bien. Me voy contigo. Pero yo elijo el camarote.  

**~0:55 · Bandera Negra** _(disparador: bandera_negra; estilo: COLLAGE GRUNGE + PÓSTER RETRO)_

> **NOCTIS**: Cinco barcos. Veinte minutos. Si ganas, te regalo uno. Si pierdes… me quedo con tu dignidad.  
> **NOCTIS**: Tch. Quédatelo. Ya me estaba aburriendo de ese barco.  

**~1:44 · El primer escudo** _(disparador: H13; estilo: NOIR OCEÁNICO + CÓMIC)_

> **SISTEMA**: ¡CLANK!  
> **LUZTERNA**: ¿Una BURBUJA? ¿Desde cuándo los calamares traen escudo? …Ok. Anótalo: NUEVA MECÁNICA: ESCUDOS.  
> **LUZTERNA**: Te quedas con los planos del escudo. Y con el Bastión, ese acorazado que flota de milagro.  

**~1:50 (Reino 24) · Algo viene** _(disparador: algo_viene; estilo: GLITCH → ORQUÍDEA REAL)_

> **LUZTERNA**: …Ese barco brilla. Los barcos no brillan. ¿Por qué brilla?  
> **SISTEMA**: ¡CLANK! (su gato levanta un escudo mágico)  
> **LUZTERNA**: ¡¿QUÉ PUTAS?! ¡Eso no es un escudo normal!  
> **HERALDO**: Interesante. Muy interesante. Nos vemos en las Ruinas, grumete.  
> **SISTEMA**: Has descubierto un elemento que no debería existir en este mundo: MAGIA ✨  

**~2:47 · El Ladrón de Páginas** _(disparador: H15; estilo: ORQUÍDEA REAL)_

> **ARCANISTA**: Ya conoces mi magia. Ahora conoce mi PACIENCIA. …Mentira, no tengo.  
> **ARCANISTA**: Llévate a esa gata del grimorio… nunca dejó de corregirme la ortografía.  
> **LUZTERNA**: ¿Y esto? Se cayó de su grimorio. Está frío. Y está… vacío. (FRAGMENTO ??? 1/10)  

**~3:50 (al limpiar las Ruinas) · Lo que guardan las ruinas** _(disparador: H16; estilo: MANGA TINTA → ORQUÍDEA REAL)_

> **LUZTERNA**: Antes de este mar hubo un Archivo. Todo lo que alguien aprendió alguna vez vivía ahí, en forma de gato.  
> **LUZTERNA**: El Archivo es una pila infinita de cajas. Cada caja es un mundo dibujado con su propio trazo. Los gatos son líquidos: se cuelan de una caja a otra por las gateras. Por eso tu Resonancia 'llama' gatos de otros mundos.  
> **LUZTERNA**: Cada página se imprimió con una tinta distinta. Por eso cuando un gato ataca, el mundo se reimprime con su estilo. No es un bug: es memoria.  
> **LUZTERNA**: Distraxia rasgó el Archivo. Las páginas cayeron al mar. Cada gato que juntas es una página que regresa.  
> **LUZTERNA**: Y yo era la farera. Mi trabajo era que nadie se perdiera. …Ya ves cómo me fue.  

**~3:57 · Cae una estrella** _(disparador: H17; estilo: NEÓN GLITCH)_

> **ESTRELLA**: Caí una vez del cielo. No me gustó. Ahora tú vas a caer.  
> **ESTRELLA**: Ahí está… lo que me empujó del cielo. Viene por ti. ¿Lo oyes?  
> **SISTEMA**: NUEVO ELEMENTO DESCUBIERTO: CÓSMICO 🌌 · Astra Prima se une.  

**~4:45 (Reino 38) · Un barco que no debería existir** _(disparador: barco_vacio; estilo: NOIR INVERTIDO)_

> **SISTEMA**: A VOID SHIP HAS ENTERED YOUR WORLD — 14:59  
> **LUZTERNA**: No. No, no, no. Eso no es de este mar. Eso no es de NINGÚN mar.  
> **LUZTERNA**: No lo vas a hundir. Solo hazle daño. Que se acuerde de ti.  

**~4:20 (Reino 36) · Hace mucho tiempo, en una balsa…** _(disparador: revancha_patito; estilo: COZY → ANIME INFERNO)_

> **PATITO**: ¿Te… te acuerdas de mí? ¡Cuac! …no, por favor, no con ESO.  
> **LUZTERNA**: Tu primer gato lanzaba bolas de pelo. Hoy borras patos con un dedo. Estoy orgullosa y un poquito asustada.  

**~5:24 · El Primer Mar** _(disparador: H21; estilo: TODAS (colapso de dimensiones))_

> **LUZTERNA**: Este es. El Primer Mar. Todo lo que cae aquí se olvida… a menos que alguien lo recuerde muy fuerte.  
> **DISTRAXIA**: Este mar recuerda todo lo que el Archivo olvidó. Y yo me encargo de que lo olvide otra vez. Él me lo pidió.  
> **DISTRAXIA**: Yo no destruyo, grumete. Yo BORRO.  
> **NOCTIS**: ¿Qué? ¿Creíste que te iba a dejar la gloria a ti solito? Muévete, que les tapo la vista. ¡MIL ROSTROS!  
> **SISTEMA**: (Fase 3: todos tus gatos tienen la ultimate lista.)  
> **LUZTERNA**: ¿Ves esa cosa enorme? Ya sabes qué hacer. Mantén… y suelta.  

**~5:27 · Marea Final** _(disparador: boss:6; estilo: EDITORIAL SUIZO (póster))_

> **SISTEMA**: MAREA FINAL — TODA TU ISLA x1000 DURANTE 3:00  
> **LUZTERNA**: Mira tu isla. Mírala trabajar. Eso lo hiciste tú. Bueno, ellos. Pero tú les diste de comer.  

**~5:30 (tras la Marea Final) · UNKNOWN ELEMENT DETECTED — NADIE** _(disparador: fin de la Marea Final; estilo: NOIR INVERTIDO)_

> **SISTEMA**: (El mar empieza a subir sin viento. Todos tus gatos miran fijamente el mismo punto del cielo. Por primera vez, no es la pared.)  
> **SISTEMA**: UNKNOWN ELEMENT DETECTED  
> **SISTEMA**: (El cielo se abre como la tapa de una caja. Se asoma una silueta sin cara hecha de estática. El contador de Doblones hace glitch: '???'.)  
> **???**: ¿Quién derrotó a mi almirante?  
> **TUS GATOS**: (todos a la vez) …Nadie.  
> **???**: (silencio) …Yo soy NADIE.  
> **NADIE**: NO ONE LIKES CATS.  
> **SISTEMA**: (Pantalla negra. Se oye un vaso caerse de una mesa en algún lugar.)  
> **CAPTION**: NO ONE LIKE CATS. (A NADIE le falta una 'S'. A los gatos no les falta nada.)  
> **CAPTION**: CONTINUARÁ →  

**~5:32 · Créditos personales** _(disparador: tras CONTINUARÁ; estilo: DIARIO DEL MAR)_

> **PERIÓDICO**: EDICIÓN ESPECIAL: TU CAPÍTULO 1  
> **SISTEMA**: Tu primer hábitat era una caja de cartón. Tu último costó {ultimo_habitat}. Tu primer gato lanzaba bolas de pelo. Hoy {mvp} borra medio barco.  
> **SISTEMA**: Barcos hundidos: {victorias} · Gatos descubiertos: {catdex}/54 · Momento favorito: {momento}  
> **NOCTIS**: Me debes una. Y un camarote con vista al mar.  
> **LUZTERNA**: Capítulo 1 completo. Tu isla seguirá produciendo. Nos vemos en el próximo mar.  


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

Conteos de esta versión: `{"catdexEntries": 54, "baseIllustrations": 32, "tintedVariants": 22, "secrets": 6, "byRarity": {"common": 14, "rare": 16, "epic": 11, "legendary": 10, "mythic": 3}, "resonanceRecipes": 61, "missions": 108, "missionsByChain": {"historia": 22, "capitan": 28, "criador": 32, "explorador": 26}, "microEvents": 11, "flashTypes": 11, "flashScheduled": 21, "heroic": 2, "specialEvents": 4, "zoneBosses": 6, "elites": 6, "storyEventBosses": 6, "enemyStages": 54, "errands": 7, "ships": 6, "expansions": 8, "reactions": 12, "storyBeats": 26}`
