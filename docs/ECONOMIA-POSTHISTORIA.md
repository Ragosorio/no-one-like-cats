# Economía del post-historia: hábitats libres (2026-10)

Qué cambió para que, al terminar el Capítulo 1, el jugador siga progresando en vez de esperar 6 horas
por la siguiente expansión. Los números viven en `game/src/data/balance.json` (`habitats`) y
`game/src/data/content.json` (`expansions`). El simulador está en `research/economy-sim/posthistoria.py`
(salida guardada en `posthistoria_salida.txt`).

## El problema (antes)

- La historia termina en ~4.7 h con ~9.2 K oro/s.
- Las expansiones 6 y 7 costaban 200 M y 400 M: 6+ horas de espera.
- Cada isla tenía un número fijo de parcelas (3 en casa, 1–2 por expansión): 18 hábitats como máximo.
  Con la regla "un gato solo vive en un hábitat de su elemento", muchos gatos se quedaban sin casa
  (y un gato sin casa no produce).
- Subir de tier casi no cambiaba la capacidad (2/3/3/4/4/5/5/6).

## Las reglas nuevas

### Hábitats libres (estilo Dragon City)

- Se compran en la Tienda (o en el menú Construir) y se colocan **donde quepan** (huella 3×3) en
  cualquier isla tuya. Se pueden **mover gratis** y **vender**.
- Ya no hay parcelas. El límite es el espacio: casa ~7 hábitats, cada expansión ~5–8
  (`placement.regionRoom`).
- Precio del siguiente hábitat (N = hábitats que ya tienes, M = cuántos tienes de ese elemento):

  ```
  precio = 60 · 3^(min(N,8)−1) · 1.6^max(0,N−8) · 1.3^M
  ```

  | N | 2 | 3 | 4 | 6 | 8 | 10 | 12 | 15 | 20 | 25 | 30 | 40 |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|
  | nuevo (M=0) | 180 | 540 | 1.6 K | 14.6 K | 131 K | 336 K | 860 K | 3.5 M | 37 M | 387 M | 4.1 B | 447 B |
  | viejo 60·4.2^(N−1) | 252 | 1.1 K | 4.4 K | 78 K | 1.4 M | 24 M | 430 M | 32 B | — | — | — | — |

  Sube rápido al principio (no regala la historia) y suave después del 8.º (una isla grande sigue
  siendo alcanzable). Repetir elemento cuesta +30% por copia.
- Vender devuelve 50% de lo que costaría reponerlo + 25% de las mejoras pagadas. No se puede vender
  un hábitat en obra ni el último. Sus gatos se mudan solos a otro hábitat con espacio (si no hay,
  quedan sin casa y la isla lo avisa).
- XP de Reino por construir: solo cuando superas tu récord de hábitats (comprar-vender-comprar no
  farmea XP).

### Tiers: más espacio, más oro, se ven distintos

| Tier | Nombre | Reino | Capacidad (antes) | Oro × (antes) | Búfer | Costo (antes) | Cristales (antes) | Obra |
|---|---|---|---|---|---|---|---|---|
| 1 | Caja de Cartón | 1 | 2 (2) | 1.0 (1.0) | 30 m | 0 | 0 | 10 s |
| 2 | Cesta de Mimbre | 4 | 3 (3) | 1.8 (1.6) | 40 m | 700 | 0 | 30 s |
| 3 | Torre Rascadora | 9 | 4 (3) | 3.2 (2.6) | 50 m | 12 K | 0 | 1.5 m |
| 4 | Casita de Coral | 14 (15) | 5 (4) | 6 (4.2) | 60 m | 200 K (220 K) | 0 | 4 m |
| 5 | Palacio de Cojines | 19 (21) | 6 (4) | 11 (7) | 75 m | 3 M (4 M) | 2 (3) | 7 m (8) |
| 6 | Templo del Ronroneo | 24 (27) | 7 (5) | 20 (11) | 90 m | 40 M (70 M) | 3 (6) | 12 m (15) |
| 7 | Santuario Arcano | 28 (31) | 8 (5) | 36 (18) | 105 m | 300 M (600 M) | 5 (10) | 20 m (30) |
| 8 | Núcleo Celestial | 32 (36) | 10 (6) | 64 (30) | 120 m | 2 B (4 B) | 7 (15) | 30 m (45) |
| 9 | **Ancla Dimensional** (nuevo) | 34 | 12 | 115 | 150 m | 15 B | 9 | 45 m |
| 10 | **Trono Multiversal** (nuevo) | 37 | 14 | 200 | 180 m | 100 B | 12 | 60 m |

Cada tier agrega algo visible al patio (macetas → banderines y faroles → camino de piedra y adorno
del elemento → muro con estandartes → arco con emblema → anillo de runas y orbes → aura y haz de luz →
rocas flotantes → aureola dorada) y la casa crece un poco; los tiers 7–10 tienen silueta propia
(`game/src/island/habitatTiers.ts`).

### Expansiones

| # | Isla | Dimensión | Reino (antes) | Costo (antes) | Bono |
|---|---|---|---|---|---|
| 6 | Ruinas Arcanas | Glitch | 27 | 200 M | 3.ª Resonancia, +15% oro |
| 7 | Arrecife Prismático | Prisma | 31 | 400 M | Prisma 6/h, Catdex +1% |
| 8 | Atolón Estelar | Estelar | 33 (36) | 1.5 B | +25% oro |
| 9 | **Jardín Sakura** | Acuarela | 34 | 4 B | 3.er Constructor, +30% oro |
| 10 | **Oasis Dorado** | Sepia | 35 | 10 B | +40% oro, Banco offline +2 h |
| 11 | **Isla Caramelo** | Caramelo | 36 | 30 B | +50% oro, +30% pesca |
| 12 | **Abismo del Ronroneo** | Vacío | 38 | 100 B | +75% oro, Catdex +1% |

Las islas 9–12 forman un anillo exterior (el tablero creció de 52 a 64 casillas; las islas 1–8 y
todo lo que había en ellas quedan exactamente donde estaban). Cada una trae un secreto con premio.

## Resultado del simulador

Jugador "fin de historia": Reino 32, 22 gatos de 6 elementos en nivel 33, 12 hábitats tier 4,
expansiones 1–5. Supuestos: los gatos suben solos al tope (Reino+5), 1 misión cada 4 min, 1 cristal
por elemento cada 2 min (combates), 1 eclosión cada 5 min (1 de cada 3 es gato nuevo), Momentum 1.2,
+20% por combates. Compra lo que se paga en < 25 min; si no, ahorra para la expansión.

| Expansión | Costo | Minutos desde la anterior | Ingreso al comprarla |
|---|---|---|---|
| 6 Ruinas Arcanas | 200 M | 28 | 130 K/s |
| 7 Arrecife Prismático | 400 M | 30 | 267 K/s |
| 8 Atolón Estelar | 1.5 B | 45 | 573 K/s |
| 9 Jardín Sakura | 4 B | 60 | 1.3 M/s |
| 10 Oasis Dorado | 10 B | 62 | 3.6 M/s |
| 11 Isla Caramelo | 30 B | 72 | 8.9 M/s |
| 12 Abismo del Ronroneo | 100 B | 80 | 25 M/s |

Media ≈ 54 min por expansión, ~6 h 20 m para tenerlo todo; el ingreso pasa de ~33 K/s a ~50 M/s.
Con las reglas viejas de hábitats (mismo jugador, mismas expansiones) a las 7 h todavía faltan dos.
El modelo es conservador: no compra hábitats nuevos para gatos sin casa (el jugador real sí), y no
cuenta Gambit, cofres ni eventos.

## Partidas viejas

- **Migración v3** (`state/migrate.ts`): cada hábitat `{region, plot}` recibe `{gx, gy}` = la casilla
  exacta de su parcela vieja (tabla literal `LEGACY_PLOTS`). Tier, elemento, gatos, búfer y obras no
  se tocan. Un hábitat sin parcela conocida se reubica en el lugar libre más cercano al cargar (nunca
  se borra).
- **Parche `2026-10-habitats-reembolso`**: devuelve la diferencia entre el precio viejo y el nuevo de
  cada hábitat extra que ya compraste (en orden de compra) y de cada mejora de tier pagada (oro y
  cristales). Nunca cobra.
- **Parche `2026-10-habitats-capacidad`**: con la capacidad nueva, los gatos sin casa que ya caben se
  mudan solos.

## Parte 2: las Grietas del Multiverso (2026-10)

Seis elementos nuevos (Hielo, Sonido, Sombra, Tiempo, Luz y Vacío) y 24 gatos (4 por elemento: Común,
Raro, Épico y Legendario primordial) alargan la curva del post-historia sin pedir oro nuevo: cada grieta
se abre con algo que el jugador ya está persiguiendo. Código: `game/src/state/sys/grietas.ts`.

| Grieta | Elemento | Se abre con | Ritmo esperado (simulador de arriba) |
|---|---|---|---|
| Grieta Boreal | Hielo | Créditos del Capítulo 1 (H23) | min 0 |
| Grieta del Escenario | Sonido | Campeón de una liga del Podio | cuando el jugador juegue el Podio |
| Grieta de los Faroles | Sombra | Jardín Sakura limpio (exp. 9) | ~+1 h |
| Grieta del Reloj de Arena | Tiempo | Oasis Dorado limpio (exp. 10) | ~+2 h |
| Grieta del Faro | Luz | Reino 36 + Atolón Estelar limpio (exp. 8) | ~+3 h |
| Grieta del Abismo | Vacío | Abismo del Ronroneo limpio (exp. 12) **o** 10 Fragmentos del Vacío | ~+6 h (o antes, si juntaste todos los fragmentos) |

Todas menos la primera piden haber ganado la Grieta Boreal (ahí Luzterna explica qué son).

**De dónde sale cada gato**

- Legendario primordial (Bóreas, Headliner, Medianoche, Cronos, Áurea, Nadie): ganar su grieta (una vez).
  Duplicados: Resonancia de dos padres que compartan el elemento, Nv20+ (regla de siempre).
- Común / Raro / Épico: Resonancia con al menos un padre del elemento (`oddsFor` arma el pozo solo; el
  épico pide ambos padres Nv15+). En cuanto descubres el elemento, también entran a la Tienda (comunes),
  al Casino y al Portal (por rareza, con los pesos de siempre) y a los rivales del Podio.
- Las grietas no se repiten. **Cristales del elemento** (los piden los tiers 5–10 del hábitat): +20 al
  ganar la grieta, y las **expediciones con un gato de ese elemento** traen cristales de SU elemento
  (en vez del de la zona).

**Hábitats**: se compran en la Tienda en cuanto el elemento existe, con la fórmula de siempre
(`60 · 3^(min(N,8)−1) · 1.6^max(0,N−8) · 1.3^M`). Como cada elemento nuevo empieza con M = 0, su primer
hábitat cuesta lo mismo que cualquier hábitat N-ésimo (≈ 37 M con 20 hábitats). Producen igual que los
demás (oro por rareza y nivel del gato × tier). El empujón económico real es la **Catdex**: 24 especies
más = +48% de oro global (2% c/u, más el +1%/especie de las expansiones 7 y 12), repartido a lo largo
de las ~6 h del post-historia.

**Batallas de grieta**: enemigo = tu poder × 1.15–1.35 y casco ×2.5 (con la tripulación de la partida de
prueba `post-story`, todas se ganan en 4–7 turnos; con una tripulación normal de fin de capítulo, la
ESTIMACIÓN marca la dificultad real). Premio: elemento + primordial + 2–3 gemas + 20 cristales.

**Partidas viejas**: parche `2026-10-grietas-multiverso` (avisa en NOVEDADES a quien ya terminó el
capítulo). Las misiones H23–H28, K33–K39 y C29 se activan solas cuando su condición ya se cumple
(por ejemplo: quien ya limpió el Jardín Sakura recibe la Grieta de los Faroles al ganar la Boreal).
