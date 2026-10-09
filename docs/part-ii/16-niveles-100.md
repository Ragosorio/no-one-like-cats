# 16 · Niveles 51–100: el tope por estrellas

**Fecha:** 2026-10-09 · **Pedido del dueño:** «No puedo subir mis gatos de Nv50 y los rivales del Podio son NV 53: no puedo mejorar. Que cada estrella desde la segunda dé 10 niveles más, hasta 100, y ajusta las batallas».
**Alcance:** `state/econ.ts` (una sola implementación), `data/balance.json` (`cats.beyond_50`), `state/sys/cats.ts`, `state/ext/collection.ts`, `podio/ladder.ts`, `panels/CatPanel.ts`, `panels/kingdom/KingdomPanel.ts`, `app/story.ts` (banner de Reino), `data/glossary.ts`.
**Cómo se midió:** `game/scripts/balance-levels.ts` (curvas, escalera del Podio antes/después, duelos con el motor del Podio y batallas de historia con la misma sim que la pantalla y el estimador). Pruebas: `game/tests/levelCap.test.ts`.

## 0. Resumen

- **Regla nueva:** mientras el tope del Reino (Reino + 5) esté abajo de 50, manda el Reino, igual que antes. Cuando llega a 50, **cada gato tiene su propio tope: 50 + 10 por cada ★ desde la ★2.** ★1 = 50, ★2 = 60, ★3 = 70, ★4 = 80, ★5 = 90, ★6 = **100**, que es el máximo.
- **Hasta Nv50 no cambia ni un número.** Oro/s, poder y costo de comida son la misma expresión con los mismos floats; las pruebas lo comparan bit a bit. Una partida vieja carga con el mismo oro/s y el mismo poder hasta que un gato pase de 50. No hay migración: no cambió el esquema.
- **Pasando 50, curvas suaves** (no se estiraron las exponenciales viejas):
  - oro **×1.04** por nivel: Nv100 = ×7.1 de su Nv50. La curva vieja daba ×1,661.
  - poder **×1.03** por nivel: Nv100 = ×4.4. La vieja daba ×29.
  - comida: subir de 50 a 51 cuesta **×40** la curva vieja y después **×1.13** por nivel. La vieja crecía ×1.27 por nivel: ×155,000 al llegar a 100.
- **Podio:** 10 niveles de poder (×1.344) ≈ una liga (×1.32). Ahora el nivel que muestra cada rival sale de la curva nueva: se quitó el tope de 60 y el máximo es 100. El poder de la escalera **no se tocó**.
  - Con ★6 a Nv50 el muro es el campeón del **VACÍO X** (9 % de victorias).
  - A **Nv60–80** se ganan el VACÍO X, XI y XII.
  - El **XIII y el XIV** piden **Nv90–100**.
  - El XV, a Nv100, se gana con buen elemento.
- **Batallas de historia** (grietas, final, rupturas): escalan con tu flota (`powerMul`) y dan **exactamente los mismos resultados** a Nv50, Nv70 y Nv100. La campaña tiene poder fijo: se vuelve más fácil, como siempre que creces. El estimador recibe el mismo `BattleSpec` que la pantalla, así que la paridad se mantiene.

## 1. La regla, en código

`econ.ts`:

| función | qué hace |
|---|---|
| `catLevelCap(kl)` | **sin cambios**: `min(50, Reino + 5)`. Es la parte del Reino, igual para todos los gatos. |
| `catLevelCapFor(kl, stars)` | **nuevo**: el tope de un gato. Si la parte del Reino es < 50, la devuelve tal cual. Si no, `min(100, 50 + 10 × (★ − 1))`. |
| `catLevelMax()` | 100 (`beyond_50.max_level`) |
| `catLevelForPower(r, ★, poder)` | **nuevo**: inversa de `catPower` (curva vieja abajo del poder de Nv50, curva nueva arriba). La usa el Podio. |
| `feedCostRange(a, b, r)` | comida exacta de Nv a → b, mordida por mordida (4 × ceil(costo/4)), igual que `cats.feed`. |

`cats.ts`: `levelCap(c)` ahora es **por gato**. La usan `feed`, `feedTo`, «Alimentar hasta Nv X» y todos los textos de tope. También hay `reinoLevelCap()`, para textos que hablan del Reino, y `levelCapInfo(c)`, que devuelve `{ cap, why: 'reino' | 'stars' | 'max', nextStarCap, perStar }` y explica el tope en el panel y en el toast. `collection.starInfo().levelCap` también es por gato.

`balance.json › cats.beyond_50`:

```json
{ "from": 50, "max_level": 100, "cap_per_star": 10,
  "gold_per_level": 1.04, "power_per_level": 1.03,
  "feed_wall": 40, "feed_cost_growth": 1.13 }
```

Los requisitos de estrella (`min_level` 10/20/30/40/50 y orbes) no cambian.

## 2. Curvas (gato ★6; el oro es el de la especie, antes de hábitat y bonos)

| Nv | oro/s Divino | × Nv50 | poder Divino | × Nv50 | comida por nivel (Común) | comida por nivel (Divino) | comida acumulada desde Nv50 (Divino) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 49 | 15.3k | 0.86 | 569 | 0.93 | 576k (49→50) | 1.73M | — |
| **50** | 17.7k | 1.00 | 609 | 1.00 | 29.3M (50→51) | 87.8M | 0 |
| **60** | 26.3k | 1.48 | 818 | 1.34 | 99.4M | 298M | 1.62B |
| **70** | 38.9k | 2.19 | 1.10k | 1.81 | 337M | 1.01B | 7.11B |
| **80** | 57.6k | 3.24 | 1.48k | 2.43 | 1.15B | 3.44B | 25.8B |
| **90** | 85.2k | 4.80 | 1.99k | 3.26 | 3.89B | 11.7B | 89.0B |
| **100** | 126k | 7.11 | 2.67k | 4.38 | (máx.; 99→100: 11.7B) | (99→100: 35.0B) | **304B** |

Comida por tramo (mordida por mordida):

| rareza | 1→50 | 50→60 | 60→70 | 70→80 | 80→90 | 90→100 | **50→100** |
|---|---:|---:|---:|---:|---:|---:|---:|
| Común (×1) | 2.71M | 539M | 1.83B | 6.22B | 21.1B | 71.6B | **101B** |
| Legendario (×2) | 5.42M | 1.08B | 3.66B | 12.4B | 42.2B | 143B | **203B** |
| Divino (×3) | 8.13M | 1.62B | 5.49B | 18.6B | 63.3B | 215B | **304B** |

**Ritmo.** El dueño tiene ~5B de pescaditos guardados, ~50M/s de oro y gatos ★6 a Nv50:

- Con lo que tiene hoy, lleva **un Divino de 50 a 60** (1.62B) ahora mismo, o tres. Eso ya le gana al campeón del VACÍO X.
- Después depende de su ingreso de comida:

| | a 100k/s | a ~0.8M/s (13 parcelas Nv15 de Atún de Nebulosa, ~60k/s cada una) |
|---|---|---|
| 60→70 (5.5B) | ~15 h | ~2 h |
| 90→100 (215B) | ~25 días | ~3 días |
| 50→100 completo, un gato | ~35 días | ~4–5 días |

Para el Podio basta **un** gato, porque es 1 contra 1. Una tripulación entera a Nv100 es una meta de meses.

Cada tramo de 10 niveles cuesta ×3.4 el anterior: es una meta larga, pero se puede.

La curva vieja, estirada, hacía lo contrario: 50→60 costaba 81M (nada) y 90→100 costaba 1.16T.

Los dos números (`feed_wall`, `feed_cost_growth`) se ajustan en `balance.json` si el ritmo real del dueño resulta otro.

## 3. Podio

**Qué cambió.** `ladder.rival()` calculaba el nivel del rival con la curva 1.07 y lo topaba en 60. Ahora usa `catLevelForPower` (Nv1–100). Ese nivel es solo lo que se muestra: el duelo usa `power`, y `boutPower` no cambió. Así:

- Las ligas que ya jugaste quedan idénticas.
- Por debajo del poder de Nv50, el nivel de los rivales es el mismo que antes (lo comprueba una prueba).
- Por arriba, el número dice cuánto tienes que subir: con ×1.03 por nivel, cada liga equivale a ~10 niveles.

**Niveles del Podio** (XP propia, `PB.levels`): siguen separados. El tope es `1 + piso(Nv/3) + (★−1)`, con máximo 20. Un ★6 ya llegaba a 20 en Nv42, así que los niveles nuevos no lo cambian. A partir de la liga 12, los rivales también están en Podio 20.

**El rival que se muestra** (un Legendario; antes → ahora) y el nivel ★6 que necesitas para igualar su poder:

| liga | n.º | rival bout 0 | campeón | Nv ★6 Divino (b0 / campeón) |
|---|---:|---|---|---|
| VACÍO VIII | 15 | Nv43 → 43 | Nv49 → 49 | 40 / 47 |
| VACÍO IX | 16 | Nv47 → 47 | Nv53 → 57 | 44 / 52 |
| **VACÍO X** | 17 | **Nv51 → 52** | **Nv57 → 66** | 49 / 61 |
| VACÍO XI | 18 | Nv55 → 61 | Nv60 → 75 | 56 / 70 |
| VACÍO XII | 19 | Nv59 → 71 | Nv60 (tope) → 85 | 65 / 80 |
| VACÍO XIII | 20 | Nv60 (tope) → 80 | Nv60 (tope) → 94 | 75 / 89 |
| VACÍO XIV | 21 | Nv60 (tope) → 89 | Nv60 (tope) → 100 | 84 / 98 |
| VACÍO XV | 22 | Nv60 (tope) → 99 | Nv60 (tope) → 100 | 94 / 108 |
| VACÍO XVI | 23 | Nv60 (tope) → 100 | Nv60 (tope) → 100 | 103 / 117 |

El «NV 53» que veía el dueño era el bout 2 del VACÍO X. Ahora ese rival muestra Nv58: lo que un Legendario ★6 necesita para igualarlo.

**Duelos simulados.** Datos de la simulación:

- motor `podio/engine.ts`, el mismo de `PodioScene`;
- 10 gatos tuyos ★6: 4 Divinos, 4 Heroicos y 2 Míticos;
- Podio Nv20, sin accesorios ni rango K.O.;
- tu lado juega con la IA automática;
- 6 islas × 6 semillas = 360 duelos por casilla.

Cada casilla es el % de victorias en bout 0 / bout 2 / campeón:

| liga | Nv50 | Nv60 | Nv70 | Nv80 | Nv90 | Nv100 |
|---|---|---|---|---|---|---|
| VACÍO VIII | 100/100/68 | 100/100/86 | 100/100/97 | 100/100/100 | 100/100/100 | 100/100/100 |
| VACÍO IX | 97/91/45 | 100/98/90 | 100/100/100 | 100/100/100 | 100/100/100 | 100/100/100 |
| **VACÍO X** | 71/53/**9** | 96/86/35 | 100/98/**76** | 100/100/93 | 100/100/99 | 100/100/100 |
| VACÍO XI | 26/13/0 | 86/56/9 | 98/89/47 | 100/99/**86** | 100/100/98 | 100/100/99 |
| VACÍO XII | 2/2/0 | 24/16/0 | 80/50/10 | 99/87/48 | 100/98/**92** | 100/100/99 |
| VACÍO XIII | 0/0/0 | 5/1/0 | 29/10/0 | 76/47/8 | 97/91/49 | 100/99/**88** |
| VACÍO XIV | 0/0/0 | 0/0/0 | 2/0/0 | 19/15/0 | 79/64/17 | 96/95/**63** |
| VACÍO XV | 0 | 0 | 1/0/0 | 6/1/0 | 49/10/1 | 89/53/14 |
| VACÍO XVI | 0 | 0 | 0 | 0 | 10/1/0 | 40/17/1 |

**Cómo leer la tabla:**

- **Antes**, el dueño se quedaba en el VACÍO X sin forma de mejorar.
- **Ahora**, cada ~10 niveles abre una liga:
  - el campeón del X sale a Nv60–70;
  - el del XI, a ~Nv75;
  - el del XII, a ~Nv85;
  - el del XIII, a ~Nv95;
  - el del XIV, a Nv100.
- El XV es el reto final: a Nv100 se gana eligiendo bien el elemento (el promedio de la tabla mezcla buenas y malas parejas), con accesorios (hasta +8 %) y con rango K.O. (hasta +10 %).
- Después del XV, la escalera sigue subiendo ×1.32 por liga, como siempre («forever»): es zona de presumir.

## 4. Batallas de historia y campaña

Simulación: `post-finale` con **toda** la tripulación ★6 a Nv50, Nv70 y Nv100. Poder de la tripulación: 3.62k, 6.54k y 15.9k. 8 semillas, IA normal/difícil.

| batalla | Nv50 | Nv70 | Nv100 |
|---|---:|---:|---:|
| event_raijin · story_heraldo · event_grieta · event_vacio · story_patito_revancha | 100 % | 100 % | 100 % |
| grieta_ice · grieta_time · grieta_light · grieta_void | 100 % | 100 % | 100 % |
| grieta_sound | 88 % | 88 % | 88 % |
| grieta_shadow | 75 % | 75 % | 75 % |
| final_archivo | 100 % | 100 % | 100 % |
| ruptura_paginas · _bibliotecario · _nacar · _madrenacar · _corrector | 100 % | 100 % | 100 % |

Los resultados son idénticos por construcción:

- El enemigo tiene `shipPower × powerMul`. La sim escala con la razón SP/EP, que no cambia.
- La parte de cada gato (`share`) es su poder entre el promedio de la tripulación.
- El nivel del gato en la sim solo activa los umbrales Nv10/20 del disparo.
- El nivel enemigo sale de EP y ya se topaba en 50.

La campaña (poder fijo por etapa) y los encargos se vuelven más fáciles, como siempre que creces. `fS` ya se topa en ×5.

**Paridad con el estimador:** el worker recibe el `BattleSpec` que arma el hilo principal, y todo el poder sale de `econ.catPower`, que es una sola implementación.

## 5. Interfaz

- **Panel del gato.** El bloque de nivel tiene una columna izquierda de 154 px:
  - `TOPE Nv 60`, en rojo cuando está en el tope (si no, «tope Nv 70»). Se ajusta con `fitLine`.
  - Abajo, dos renglones con el porqué:
    - «★2 · sube una ★ / para +10 niveles»;
    - «★3 · cada ★ nueva / suma +10 niveles»;
    - «sube tu Reino: / +1 de tope por nivel» y «tu Reino + 5 / (hasta Nv 50)»;
    - «★6 · el máximo. / Solo queda presumir».
  - Antes, «TOPE Nv 50 (sube tu Reino)» se encimaba con el «− HASTA NV 50 +». El número grande subió 4 px.
  - Se revisó sin pantalla a 1600×900 y 1600×1100 en 6 casos (Reino 30; ★1 en 50; ★2 en 60; ★3 en 63; ★6 en 88 y en 100). `__overflow()` no reporta nada encimado ni fuera del panel.
- **Toast del tope** (al dar ¡ÑAM! en el tope):
  - «Con ★3 en el Altar de Almas su tope sube a Nv 70.»;
  - antes de 50: «Cada nivel de Reino sube el tope +1 (hasta 50; después, las ★).»;
  - en Nv100: «el techo del universo».
- **Reino.** Tarjeta y barra: «Tope de nivel de gato: 50 (+10 por ★ desde la ★2, hasta 100)». La línea «50 → 50 al subir» de Reino 45–49 también cambió a ese texto. El banner de subir de Reino dice «Tope de nivel de gato: 50 (+10 por ★ desde la ★2)».
- **Glosario:** «Nivel y ¡ÑAM!» (la regla, para qué sirve pasar de 50, qué hacer en el tope) y «Reino» («hasta 50; más arriba lo suben sus estrellas»).
- **Automatizaciones:**
  - «Alimentar hasta Nv X» respeta el tope de cada gato.
  - Al subir una ★ (en el Altar o desde el panel), el panel se refresca con el evento `cat`/`stars`. El tope sube y el selector deja seguir alimentando.
  - «Auto-alimentar» (R28) y «Auto-estrellas» (R36) **solo existen como texto** en el panel del Reino; no tienen código. No hay nada que ajustar ahí: queda anotado como pendiente.

## 6. Partidas vivas

- No hay migración ni parche: niveles y estrellas son los mismos campos.
- Ningún camino de producción ponía gatos arriba de 50, así que **nadie pierde nada**.
- Un gato de ★2 o más en Nv50 con Reino ≥ 45 ya puede seguir comiendo.
- Prueba en `post-finale` y `late-game`: cargar no cambia ningún nivel. Para cada gato, el oro/s y el poder son idénticos (bit a bit) a las fórmulas viejas, y ninguno queda arriba de su tope.
- NOVEDADES: las escribe el lead (`data/updates.ts`).

## 7. Pruebas y cómo reproducir

`tests/levelCap.test.ts` (13 pruebas) cubre:

- topes por Reino y estrellas;
- `feed`, `feedTo` y `starInfo` por gato;
- comida pagada mordida por mordida;
- números ≤ 50 idénticos bit a bit a las fórmulas viejas;
- curvas monótonas hasta 100;
- comida razonable (50→60 entre 0.5B y 5B; 90→100 entre 50B y 1T);
- `catLevelForPower` como inversa de `catPower`;
- partidas viejas con los mismos números;
- escalera del Podio: mismo poder, mismo nivel abajo de Nv50, sin tope de 60, máximo 100, continua en 50;
- duelos (campeón del VACÍO X: < 35 % a Nv50, > 85 % a Nv100; campeón del XII: < 30 % a Nv60, > 85 % a Nv100);
- el nivel de Podio sigue topado en 20.

```
cd game && npm run typecheck && npm test
npx vite-node scripts/balance-levels.ts -- --from 15 --to 23 --islands 6 --seeds 6 --story --story-seeds 8   # ~3 min
```

## 8. Pendientes

- R28 «Auto-alimentar» y R36 «Auto-estrellas» se anuncian en el panel del Reino, pero no están implementadas.
- El Podio dice «sube a NV 51 en la isla (o una estrella)» cuando un gato ★1 en Nv50 tiene su nivel de Podio topado (17). La parte «(o una estrella)» es la correcta. Se podría afinar `nextCapLevel` para que mencione la ★ cuando el Nv que pide está arriba del tope de la isla (`podio/lobby.ts`, `podio/results.ts`).
- Si el ingreso real de comida del dueño resulta muy distinto, se ajusta `feed_wall` / `feed_cost_growth`; los ≤ 50 no se mueven.
