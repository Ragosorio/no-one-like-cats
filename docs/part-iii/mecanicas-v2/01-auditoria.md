# 01 · Auditoría de mecánicas (Parte III y lo que la sostiene)

> Agente **MECÁNICAS**, ronda 4, oleada 1 (2026-10-26). Diseño y auditoría: **no se tocó código de juego, datos ni guardado**. Sin commits.
> ⚠️ Contiene spoilers de la Parte III.
> En esta carpeta, `02` y `03` son `02-loop.md` y `03-plan-implementacion.md`; los números sueltos (`05`, `06`, `10`…) son los documentos de `docs/part-iii/`.
> Las mediciones son del simulador real (`battle/autoplay.ts › autoBattle`, el mismo que usa la estimación). El arnés y los datos crudos están en el scratch de la sesión (§7). El detalle de la curva de dificultad está en `02-loop.md` §6.

---

## 0. Resumen en una pantalla

1. **Lo que hay funciona y está bien construido.** H66–H69, la Carta, B-1…B-5, la regla Mareo y las huellas son deterministas, honestas (estimación = batalla) y no tocan la Parte I ni la II. El guardado de la Parte III es opcional, se normaliza y nunca resta.
2. **Pero pelear no da miedo ni emoción.** Con el barco que tiene cualquiera que terminó la Parte II (Bastión Mk6), **todas las tripulaciones medidas ganan B-1…B-5 el 94–100 % de las veces**, incluso 4 comunes Nv35. La tripulación de `h65-normal` gana en 2–6 turnos y pierde solo 0–8 % del casco. La regla Mareo casi no cambia el resultado.
3. **La causa no es la rareza ni el nivel: es la escala y el barco.** El enemigo de la Carta pelea a **×0.85–1.27 de tu Poder**; los jefes de la Parte II, a **×1.45–2.1** y con reglas que castigan (cataclismo, Puertas Cerradas). Medido: subir el casco ×1.6, subir a los enemigos de rareza o multiplicar su ataque ×1.7 **casi no mueve** el resultado con el Bastión. Lo que sí lo mueve: el multiplicador de Poder, los **elementos de la tripulación enemiga** (con Sonido, que aturde, la victoria baja de 100 % a 16–62 %) y, sobre todo, **el barco**.
4. **La misma Borracha es un trámite en el Bastión y un muro en el Gorrión.** Con el Gorrión, la tripulación de h65 gana B-3 y B-5 el **0 %** de las veces. El piso fijo de 3 000 de Poder enemigo (`gaterasBattles.ts:24`) está calibrado al Bastión, y la Carta apagó la contramedida que la Parte I usa contra los barcos grandes (los cataclismos que pesan según el casco: las batallas son tipo `errand`, `campaign.ts:408`).
5. **La Carta solo sabe hacer una dimensión, lineal y de 9 etapas.** Hay `p3d_borracha` escrito a mano en la escena, en las batallas y en el estado. El normalizador y los ids de batalla asumen etapas 1–9 en línea. Las formas que pide el diseño (llave de torneo, estante no lineal, gira, desvíos) **rompen** el modelo actual al recargar.
6. **El techo H99 es real pero chico de arreglar.** Son dos regex (`missions.ts:280`, `verify-missions.ts:65`). Lo demás ya entiende 3 dígitos.
7. **El oro de batalla no da dopamina.** Una victoria paga 40 s de ingreso; una gatera cuesta 15–75 min. La recompensa que se siente tiene que ser otra (huellas, gatos, orbes de Multidimensionales, la Bitácora, las películas).

---

## 1. Qué existe hoy en la Parte III y si funciona

| Pieza | Dónde | Estado | Comentario |
|---|---|---|---|
| H66–H69 (misiones y beats) | `data/gateras/historia.json`, `ui/story/gaterasScript.ts` | ✅ funciona | 4 misiones encadenadas por `mission:H6x`. H69 pide `win_battle` de `p3d_borracha_5`. `verify-missions --all` en verde (166 OK al cierre de la ronda 3) |
| Tarjeta de 5 campos y Bitácora | `panels/Bitacora.ts`, `state/sys/gaterasWorld.ts` | ✅ | Las claves de tarjeta (`p3_tarjeta_H6x`) no llevan número `b`, así que ninguna regla de la Parte II las cuenta |
| La Carta de las Cajas | `scenes/GaterasMapScene.ts` (1 573 líneas) | ✅ para **una** dimensión | Ver §4.3: `const B = 'p3d_borracha'` (línea 63) y usos en 1297 y 1470 |
| Precio de Maneki | `state/sys/gateras.ts:205-212` | ✅ | `max(piso, incomePerSec()/mareaMult()·s)`. 15 B con h65 (17 M/s). La Marea no lo infla (probado) |
| Huellas de 000 | `gateras.ts:244-266` | ✅ | 3 por primera victoria, 10 por jefe, se gastan al abrir la siguiente (línea 224) |
| B-1…B-5 | `data/gateras/regiones.json › stages.p3d_borracha`, `state/sys/gaterasBattles.ts` | ✅ técnicamente, ❌ en balance | Ver §2 |
| Regla Mareo | `battle/mareo.ts` + `mareoFx.ts` | ✅ | Vaivén senoidal visible, desvío sembrado, donas, botellas, karaoke. 13 pruebas. Determinista |
| B-6…B-9, desvío, La Ronda, encargos, encuentros | `regiones.json › later` | ⛔ no existen | B-6…B-9 están dibujadas y cerradas (`playable:false`) |
| Guardado `ext.gateras` | `gateras.ts:86-151` | ✅ | Opcional, normalizador que nunca resta, una sección rota se aparta en `ext.gaterasBroken` |
| Seguridad frente al reinicio de la Parte II | `rupturasLedger.ts:22,30-35`, `rupturasReset.ts:75-79` | ✅ | H66+ y b66+ quedan fuera del registro de premios y del reinicio |

**Pruebas que ya cubren esto:** `gateras.test.ts` (11), `gaterasCimientos.test.ts`, `mareo.test.ts` (13), `p3Caja.test.ts`, `p3BarPulido.test.ts`, `p3CallePulido.test.ts`, `momentoDrunck.test.ts`, `rupturasReset.test.ts` (8b: una partida con H77 queda intacta).

---

## 2. ¿Es divertido? Lo que funciona y lo que no

### 2.1 Lo que sí funciona (y hay que conservar)

- **La gramática del Diario del Mar** en la Carta: nodo, ruta, élite, jefe, frontera y barquito. El jugador la reconoce sin explicación.
- **La estimación honesta.** La tarjeta de etapa simula la misma pelea. Eso es oro para «entiendo a qué me meto»: el problema es que hoy siempre dice 100 %.
- **El vaivén del Mareo es una habilidad visible**: «suelta en el centro». Es la clase de regla que se puede **enseñar en una película** de 20 s.
- **Las donas** son un giro táctico chico y gracioso («no le des de comer»). La IA las esquiva (`mareoShotValue`).
- **Las huellas como llave** narrativa: es el rastro de Cerito, no una moneda abstracta.

### 2.2 Lo que no funciona

**Medición** (32 batallas por celda, mitad puntería normal y mitad buena, como la estimación; Bastión Mk6 de `h65-normal`; detalle en `02` §6):

| Tripulación | B-1 | B-2 | B-3 | B-4 | B-5 élite |
|---|---|---|---|---|---|
| `h65` (7 legendarios/épico Nv45 ★3) | 100 % · 2 t | 100 % · 3 t | 100 % · 3 t | 100 % · 4 t | **100 % · 6 t · −8 % casco** |
| Legendarios Nv38 | 100 % | 100 % | 100 % | 100 % | 100 % |
| Épicos y raros Nv40 | 100 % | 100 % | 100 % | 100 % | 100 % |
| 5 raros Nv40 | 100 % | 100 % | 100 % | 100 % | 100 % · 10 t |
| 4 comunes Nv35 | 100 % | 100 % | 94 % | 94 % | 94 % · 14 t |
| Legendarios Nv80 ★4 | 100 % | 100 % | 100 % | 100 % | 100 % |
| Divinos/heroicos Nv100 ★6 | 100 % | 100 % | 100 % | 100 % | 100 % |

(«t» = turnos promedio.) **El QA anterior midió 97 % con h65; aquí sale 100 %.** La diferencia es de semillas y de los ajustes que hizo el coordinador a B-4/B-5 después (`10` §7.3, punto 9).

**Por qué aburre:**

1. **No hay riesgo.** Perder 0–8 % del casco en una élite significa que la regla nunca te obliga a jugar distinto. El jugador no necesita leer el vaivén ni evitar las donas.
2. **La estimación siempre dice 100 %**, así que la tarjeta no genera tensión antes de zarpar.
3. **No hay razón para cambiar de tripulación**: ni la regla ni el rival piden un elemento o un rol.
4. **La recompensa no se siente**: oro de 40 s de ingreso y 3 huellas (§4.7).
5. **Las batallas cortas (2–4 turnos)** cortan cualquier arco dentro de la pelea: no hay «momento en que casi pierdo».

### 2.3 Por qué pasa (diagnóstico medido)

| Palanca | Qué hace hoy | Efecto medido en `h65` |
|---|---|---|
| Poder enemigo | `max(3 000, tu flota × powerMul)`, `powerMul` 0.85–1.15; la élite × 1.1 por la banda `jefe` (`gaterasBattles.ts:32-37`) | El cociente de poder queda en S = 0.71–1.06 (`campaign.ts:335-341`). **Es la palanca que sí mueve el resultado** (la Parte II necesitó ×1.45–2.1 para sus jefes, `docs/part-ii/27` §Balance de jefes) |
| Casco enemigo | `hpMulX` 1.6–3.2 | ×1.6 extra no cambia la victoria (solo alarga) |
| Rareza enemiga | comunes y raros | Subirlos a legendarios («paridad»): 100 → 94–97 % en la élite. Casi nada |
| Ataque enemigo | — | Prueba «espejo» (su ataque ×1.3–2, su vida ×√): B-1/B-3 siguen en 100 % |
| Barco del jugador | Bastión: 208 celdas, 5 cañones, 2 burbujas, Mk6 | **Es la razón de fondo.** El daño enemigo no llega a hacer mella. Con el **Gorrión**, la misma tripulación gana B-3/B-5 **0 %**; con el Merodeador, 17–75 % para tripulaciones medias; con el Bajel, 42–54 % para la tripulación piso en B-5/B-9 |
| Piso de Poder enemigo | 3 000 fijo (`gaterasBattles.ts:24`) | El Bastión de h65 tiene Poder 3 548: el piso casi no lo toca. Al Gorrión (1 514) le sube el enemigo al doble: cociente 0.38–0.5 |
| Poder de la caja (cataclismo) | apagado: las batallas son tipo `errand` (`gaterasBattles.ts:55`, `campaign.ts:408`) | Es la contramedida de la Parte I contra los barcos grandes: pega más cuanto más casco tienes (`cataclysm.ts › cataSize`, `CATA_FREE_CELLS = 95`). Con un cataclismo 0.6 en la élite, h65 baja a 79 % perdiendo 33 % del casco |
| Elementos de la tripulación enemiga | sin criterio | **La palanca más fuerte**: un rival con 2+ gatos de Sonido (aturde, `multiverso.ts:14-15, 222+`) baja la victoria a 16–62 % con las mismas cifras |
| Regla Mareo | ±3–4.5°, desvío ±0.6–1.2° | Casi neutra: pega igual a los dos lados y la IA del jugador apunta bien |
| Puntería del jugador | la estimación juega mitad «normal» (σ 3°) y mitad «hard» (σ 1.5°) | Con puntería torpe («easy», σ 6°) h65 y la tripulación piso **también** ganan B-1/B-3/B-5 el 100 %: no es que la estimación suponga un jugador demasiado bueno |
| Nivel enemigo | topado en 50 en etapas normales (`campaign.ts:413`) | Irrelevante: el nivel solo cuenta en los umbrales Nv10/Nv20 del disparo (lo midió la Parte II) |

**Conclusión:** la Carta necesita una **política de dificultad propia**: Poder enemigo ×1.55–1.6 por banda, un **espejo** de calidad («la caja te mide»), el **poder de la caja** en las élites (cataclismo que pesa según tu casco), un **factor por clase de barco** y un piso por flota potencial en vez del 3 000 fijo. Además, planteles con elementos que pongan a prueba algo. Todo medido en `02` §6.

---

## 3. Lo que falta (para que se pueda jugar «algo» completo)

| Falta | Por qué importa | Prioridad |
|---|---|---|
| B-6…B-9 y El Cadenero | Sin el jefe no hay 34 huellas; con B-1…B-5 solo hay 15 y la segunda gatera pide 25. **Nada de Superhéroes se puede abrir antes** | Alta (oleada 2) |
| Política de dificultad de la Carta | §2 | Alta (oleada 2) |
| Gancho genérico de **película de presentación** antes de cada batalla | Pedido central del dueño | Alta (oleada 2, coordinado con CINE) |
| Carta multi-dimensión (datos en vez de `B` fijo) | Para la segunda caja | Alta antes del Acto II |
| Modelo de avance no lineal (nodos, desvíos, llaves, estante) | Las formas de `05` §1.4 | Alta antes del Acto II |
| La Ronda, desvío «Trastienda», 2 encargos, encuentros | El «muchas más cosas» del dueño | Media |
| Rareza Multidimensional | `06` §1 | Media (detrás de una bandera) |
| Reglas Onomatopeya, Poder, Capítulos, Ritmo | Una por dimensión | Por acto |
| Recompensas que se sientan | §4.7 | Alta (se diseña en `02` §5) |

---

## 4. Riesgos técnicos (con referencias)

### 4.1 El techo H99 de las misiones

- `state/sys/missions.ts:280`: `if (!/^[HCKE]\d\d$/.test(u)) G.flag(u)`. Un `unlocks: ['H100']` **se guardaría como flag** en vez de reconocerse como misión.
- `scripts/verify-missions.ts:65`: la misma regex para el validador (y `pad(r.id, 4)` en la línea 131, solo cosmético).
- **Lo demás ya entiende 3 dígitos:** `rupturasLedger.ts:26` (`\d{2,3}`), `rupturasReset.ts:78` (`b\d{3}` = Parte III en adelante), `o4Pagina.ts:486` y `gaterasWorld.ts:34,173` (comparan números).
- **Una trampa vieja:** la fixture `rupturas-raro` trae `H77` y `H99` como «basura» (`make-rupturas-fixtures.ts:192-195`). Desde la Parte III son ids reales. A-CIMIENTOS ya lo cubrió (`rupturasReset.test.ts` 8/8b).
- **Solución** en `03` (etapa 0): ampliar las dos regex a `\d{2,3}`, una prueba con una misión sintética H100 y, como política, **una misión = un capítulo** (las presentaciones van en las batallas, no en misiones nuevas). Con eso H66–H99 alcanza para la Parte III y la Parte IV empieza en H100 sin miedo.

### 4.2 El guardado y las migraciones

- **Bien:** `ext.gateras` es opcional; una partida sin Parte III carga idéntica byte por byte (`gateras.test.ts`, primera prueba). No hay subida de `SAVE_VERSION` (`migrate.ts:18`).
- **Riesgo 1 · modelo lineal.** `normalizeGateras` deduce `cleared` de la victoria más alta y lo topa en 9 (`gateras.ts:117-118`); `stageState` es lineal (`gateras.ts:189-195`). Con un estante no lineal (Libros) o una gira (POP), ganar primero la etapa 7 haría que al recargar 1–6 aparezcan «ganadas». **Hay que ampliar el esquema antes** (campo nuevo `nodes`, sin tocar `cleared`, ver `03` §1.3).
- **Riesgo 2 · ids de batalla de un dígito.** `parseBattleId` usa `(\d)$` (`gateras.ts:82`) y el IR de misiones `/^p3d_[a-z]+_\d$/` (`cajasFlow.ts:90`). Un desvío (`p3d_borracha_d1`), un encuentro o una etapa 10 no se reconocen: la música y el botón IR fallan en silencio.
- **Riesgo 3 · lo que el esquema v1 no tiene:** actividades (semilla de La Ronda), encuentros, desvíos, películas vistas, la estrella de protagonista de la tripulación. Todo se puede agregar como campos opcionales con el mismo normalizador (`03` §1.3).
- **Reglas que siguen valiendo:** nunca restar, un id es para siempre, la guarda de `playMs` no se quita, la bóveda y el candado de escritura no se tocan (memoria «Save loss 2026-10-08»).

### 4.3 La Carta y las batallas están escritas para la Borracha

- `scenes/GaterasMapScene.ts:63` `const B: DimId = 'p3d_borracha'`; `:1297` `startGateraBattle(B, n)`; `:1470` clave de estimación `p3d_borracha_${n}`; `:590` solo dibuja el aspecto `tv`.
- `state/sys/gaterasBattles.ts:70` etiqueta «LA BORRACHA · B-n»; `:76-77` paleta y estilo `borracha` para toda batalla.
- `state/sys/gateras.ts:238` el contador de misión solo para la Borracha (correcto hoy, pero hay que generalizarlo: `feature_p3_gatera_<dim>`).
- **Riesgo:** la segunda dimensión obliga a refactorizar la escena más grande de la Parte III. Conviene hacerlo **antes** de que haya contenido nuevo encima (`03`, etapa 1).

### 4.4 El registro de premios y el reinicio de la Parte II

- **Bien acotado**: `isPart2Mission` solo H31–H65 (`rupturasLedger.ts:22,30-33`); `isPart2Beat` excluye b66+ (`rupturasReset.ts:78`).
- **Trampas para el futuro** (no hay bug hoy):
  - `isStoryGateFlag` considera de la Parte II **cualquier** flag `region:*` y `oleada<n>_fin` (`rupturasReset.ts:89, 95`). **La Parte III nunca debe usar esos prefijos.** Los suyos son `gatera:*`, `won_p3d_*`, `p3_*`.
  - El reinicio es un parche de una sola vez (`RESET_PATCH_ID`, `rupturasReset.ts:47`) que ya corrió. Si algún día hubiera un «reinicio v3», tiene que excluir H66+ a propósito.
  - Los premios únicos de la Parte III (gatos, gemas de primera victoria) **no** pasan por el registro. Si la Parte III algún día se puede volver a jugar, necesita su propio registro (`ext.gateras.claimed`), no el de la Parte II.

### 4.5 Inflación de la economía en partidas avanzadas

- El precio en segundos de ingreso (`gateras.ts:205-207`) funciona para los tres perfiles: (a) 17 M/s → 15 B, (b) 88 M/s → 80 B, (c) 1 B/s → 0.9 T. **El oro no frena a nadie y está bien que no lo haga**: el candado es la historia + las huellas.
- **Riesgo real 1 · el oro deja de importar.** La partida del dueño tiene 7.4 h de ingreso guardadas (`investigacion/sistemas.md` §2.3). Sin gastos propios de cada dimensión, el veterano junta billones sin destino. Propuesta en `02` §5.4 (sumideros con sentido: orbes de gatos ya conocidos, decoraciones de caja, hábitat de dimensión).
- **Riesgo real 2 · el precio se puede «jugar».** Se cobra el ingreso **del momento** (`gateras.ts:210-212`). Sacar gatos de sus hábitats antes de pagar baja el precio. Es poco probable, pero gratis de cerrar: cobrar con el **ingreso más alto visto** (`ext.gateras.peak`), no el actual.
- **Riesgo real 3 · el Momentum cuenta dos veces en el oro de batalla.** `G.goldPerSec` ya incluye `(1 + 0.5·(M−1))` (`island.ts:104-105`, vía `globalGoldMult`) y `battleGold` multiplica otra vez por M (`econ.ts:162-163`). Con Momentum 3, una batalla paga ×6 en vez de ×3. Es de la Parte I y pesa poco (40 s de ingreso), pero la Parte III lo hereda (`gaterasBattles.ts:112`).
- **Riesgo menor · la Marea en el oro de batalla.** Durante los 3 min de la Marea Final (`island.ts:114-116`), `G.goldPerSec` vale ×1000 y una batalla paga 40 000 s de ingreso. La Marea es un evento único de la historia (b23), así que el riesgo es histórico.

### 4.6 Rendimiento

- **El simulador aguanta**: 0.1–1 s por batalla sin cabeza según su largo (medido: 4 320 batallas en ~10 min repartidas en 9 procesos). La estimación juega 40 por tarjeta (`estimate.ts:150`) en un worker. Cada regla nueva tiene que mantener ese costo: ganchos chicos, estado en `WeakMap`, sin asignar memoria por cuadro.
- **Riesgos visuales** (para CINE y ARTE, no para el simulador):
  - una Carta con 5 dimensiones, cada una con su filtro (CRT, Ben-Day, cel, papel, neón), cuesta GPU si se arman todas a la vez → construir cada región **al acercarse** y hornear su miniatura;
  - las películas hornean texturas: hay que medir memoria al cerrar (ya hubo una fuga de Pixi, `pixiLeak.test.ts`);
  - cada gato nuevo pesa 0.6 MB (lite) + 2–3.5 MB (completo); con 30 gatos más la caché del PWA crece ~100 MB (`nolc-arte-2`).
- **60 fps en batalla** con las reglas visuales nuevas (onomatopeyas sólidas como cobertura, auras): medirlo con la sonda sin cabeza de la porción.

### 4.7 El oro de batalla no da dopamina

- Una victoria paga `max(15·1.3^(abs−1), 40 s de ingreso)` (`econ.ts:160-164`, `balance.json:1872-1889`). En la Carta, `abs = 54 + n` (`gaterasBattles.ts:85,107`): con h65 manda el término de ingreso (680 M ≈ 0.7 min). Repetir paga ×0.7.
- Abrir una gatera cuesta 15–75 min de ingreso. **Diez batallas pagan menos del 10 % de la siguiente puerta.** El oro de batalla es ruido; la emoción tiene que venir de otra parte (`02` §5).

---

## 5. Salud de las mecánicas de las Partes I y II que la Parte III usa

| Sistema | Estado | Hallazgo concreto | Referencia |
|---|---|---|---|
| **Simulador de batalla** | ✅ sólido y determinista | Pantalla = estimación (probado llamada por llamada). Reglas puras con estado en `WeakMap` | `autoplay.ts`, `mareo.test.ts` |
| | ⚠️ balance | **Los elementos de la Parte II dominan**: Sonido aturde a toda cabina que cruza (`multiverso.ts:14-15, 222+`) y Tiempo hace perder turnos. Una tripulación enemiga con 2+ de ellos vuelve una batalla «normal» en un muro (medido: 16–62 %). Hay que repartirlos con intención | `02` §6 |
| | ⚠️ escala | El cociente de Poder comprime todo: con el enemigo a ×1 de tu flota, la diferencia la decide el barco. El Bastión gana casi cualquier pelea a ×1 | `campaign.ts:335-341`, `ship.ts:206` (`COMBAT_WEIGHT` bastión 0.9) |
| | ⚠️ piso | El piso de 3 000 de la Carta es **mayor** que el Poder de una tripulación débil: a 5 raros o 4 comunes les toca EP/SP 1.4–1.8 contra 0.94–1.41 de h65 | `gaterasBattles.ts:24`, medición |
| **Rareza** | ✅ | Primordial es un flag sobre legendario; el filtro por rareza de «Elegir tripulación» lee `BAL.rarities.order` | `catQuery.ts:57-67` |
| | ⚠️ copias | `RARITY_H` está copiado 6 veces; la de `regions/paginas.ts:89` solo tiene 4 rarezas (mítico+ caen a 2.5 en silencio). Una rareza nueva caería igual | `olvidada.ts:101`, `suenos/residents.ts:21`, `cielo/cats.ts:29`, `RegionScene.ts:46`, `paginas.ts:89` |
| | ⚠️ NaN | `catPower`/`catGoldPerSec` leen `B.rarities.*[r]` sin defensa: una rareza sin entrada da `NaN` en oro y Poder y puede guardarse | `econ.ts:27-31` |
| **Elegir tripulación** | ✅ | `crew()` filtra gatos que ya no existen; `autoCrew` llena con los más fuertes | `ship.ts:32-45` |
| | ⚠️ | `autoCrew` y `setCrew` no saben de reglas de tripulación (uno por tripulación, protagonista). Habrá que validarlas ahí y en el panel | `ship.ts:35-45`, `panels/campaign/CrewSelect.ts` |
| **Recompensas** | ⚠️ | La recompensa estándar de misión da 5 orbes a **un gato al azar** de toda la colección, aunque esté al máximo o nunca lo uses | `missions.ts:261-262` |
| | ⚠️ | Momentum doble y Marea en el oro de batalla (§4.5) | `econ.ts:162-163`, `island.ts:104-105` |
| **Economía ociosa** | ✅ | Todo cobra en segundos de ingreso; la Marea está descontada en los precios de la Parte III | `shop.ts:100-104`, `gateras.ts:205-212` |
| | ⚠️ | El ingreso crece ×50 de (a) a (c). Sin sumideros con sentido, el oro del veterano no tiene destino (§4.5) | `investigacion/sistemas.md` §2.3 |
| **Misiones** | ✅ | Disparadores por avance, nunca por reloj; `why` sin premio en la Parte III (prueba C-2) | `missions.ts:156-188` |
| | ⚠️ | Techo H99 (§4.1) | `missions.ts:280` |
| **Estados del mundo** | ✅ | Banda 130–159 reservada para la Parte III | `gaterasWorld.ts` |

---

## 6. Hallazgos principales (ordenados por impacto)

| # | Tipo | Hallazgo | Referencia | Arreglo propuesto |
|---|---|---|---|---|
| 1 | Balance | La Borracha se gana 94–100 % con cualquier tripulación y el Bastión; h65 en 2–6 turnos, −0–8 % de casco | `regiones.json` B-1…B-5, `gaterasBattles.ts:32-37` | Bandas `p3n/p3e/p3j` (Poder ×1.55–1.6), espejo k=1 y poder de la caja en élites: h65 79 % en la élite, 78 % en el jefe (`02` §6.3) |
| 2 | Bug de balance | **El piso fijo de 3 000 y los cascos enemigos calibrados al Bastión amurallan a los barcos chicos**: Gorrión 0 % en B-3/B-5 con la tripulación de h65; Merodeador 8–38 % para tripulaciones medias. Contradice «nunca es un muro» | `gaterasBattles.ts:24,34`, `campaign.ts:408` | Piso por flota potencial + `CARTA_SHIP_WEIGHT` (Bajel 0.6, Merodeador 0.5, Gorrión 0.35) + la estimación sugiere el mejor barco (`02` §6.3 C) |
| 3 | Balance | Los elementos de la tripulación enemiga deciden más que cualquier número: Sonido/Tiempo convierten una etapa en muro | `multiverso.ts:14-15, 222+` | Regla de plantel por tipo de etapa + prueba automática (`02` §6.4) |
| 4 | Riesgo | La Carta, las batallas y el estado están escritos para una sola dimensión | `GaterasMapScene.ts:63,590,1297,1470`, `gaterasBattles.ts:70,76-77`, `gateras.ts:238` | Generalizar por datos (`03` §2.4) |
| 5 | Riesgo de guardado | El normalizador asume avance lineal de 9 etapas; las formas no lineales se corrompen al recargar | `gateras.ts:117-118, 189-195` | Campo `nodes` aditivo (`03` §1.3) |
| 6 | Bug latente | Ids de batalla de un dígito: desvíos, encuentros y etapas 10+ no se reconocen | `gateras.ts:82`, `cajasFlow.ts:90` | `([a-z0-9]+)$` + prueba |
| 7 | Riesgo | Techo H99 | `missions.ts:280`, `verify-missions.ts:65` | `\d{2,3}` + prueba H100 + «una misión = un capítulo» |
| 8 | Bloqueo | Con B-1…B-5 solo hay 15 huellas; la segunda gatera pide 25 → B-6…B-9 son prerrequisito de todo el Acto II | `gateras.ts:244-271`, `regiones.json` | Oleada 2: B-6…B-9 |
| 9 | Diseño | El oro de batalla (40 s de ingreso) no da dopamina; repetir paga ×0.7 | `econ.ts:160-164`, `gaterasBattles.ts:105-136` | Cadencia de recompensas sin oro (`02` §5) |
| 10 | Economía | El precio se puede bajar vaciando hábitats; Momentum doble en el oro de batalla | `gateras.ts:210-212`; `econ.ts:162-163` + `island.ts:104-105` | Cobrar con el ingreso pico; dividir `goldPerSec` por el Momentum en `battleGold` (decisión del dueño: cambia el oro de la Parte I) |
| 11 | Riesgo | Una rareza nueva toca ~20 archivos; 6 copias de `RARITY_H`; `NaN` silencioso | `econ.ts:27-31`, §5 | Tablas exhaustivas `Record<RarityId,…>`, una sola `RARITY_H`, prueba de finitud (`03` §1.5 y etapa 2) |

---

## 7. Cómo reproducir las mediciones

- **Arnés:** `<scratch>/p3sim/p3-balance.ts` (scratch de esta sesión: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad/p3sim/`). Carga `h65-normal`, cambia la tripulación en memoria, instala etapas propuestas en `REG.stages` en memoria y juega `autoBattle` con 32 semillas (mitad `normal`, mitad `hard`, como la estimación).
  ```
  cd game && npx vite-node <scratch>/p3sim/p3-balance.ts -- --crews h65,raros40 --stages B1,B5,B9 --seeds 32 --json out.jsonl
  # variantes: --scen base|banda|paridad|duro|sonido|tiempo|paridadSon|prop|propCata|b8fix · --mirrorK 1 · --hullK 0.5
  #           --pm 1.6 · --hpx 3 · --noband · --floor 0 · --cataP 0.6 · --ship bastion|bajel|merodeador|gorrion · --aim easy|normal|hard
  ```
- **Copia en el repo** (para la oleada 2): `game/tests/p3Balance.sim.test.ts`. No corre con `npm test`; se activa con `NOLC_SIM=1` (ver su cabecera).
- **Datos crudos** (JSON por línea, en el mismo scratch): `base.jsonl` (9 tripulaciones × 15 etapas), `scen.jsonl` (palancas), `curva.jsonl` (barrido de Poder), `combo.jsonl` (combinaciones, barco y puntería), `prop.jsonl` (la propuesta), `ships.jsonl` (4 barcos × 3 variantes), `cata.jsonl` (poder de la caja), `shipf.jsonl` (factor por barco).
