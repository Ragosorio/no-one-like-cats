# 21 · Reinicio narrativo de la Parte II + registro de premios cobrados

**Pedido del dueño (2026-10-09).** Con la renovación audiovisual (doc 17), **todos** vuelven al inicio narrativo de la Parte II (H31) para vivir la apertura, las cinemáticas y la música nuevas — también quien iba a mitad de la Oleada 1 o ya la terminó — **sin perder nada**: gatos, rarezas, formas (Canelo Almirante sigue desbloqueado), niveles, estrellas, recursos, hábitats, barcos, edificios, islas, la Parte I, premios, desbloqueos permanentes, colecciones, canciones de la Fonoteca (`ext.music`) y logros. Repetir la historia **no** permite cobrar dos veces un premio único.

| Pieza | Archivo |
|---|---|
| El reinicio (parche de una sola vez) + re-armado de la revelación de la forma | `game/src/state/sys/rupturasReset.ts` |
| El registro de premios cobrados (hoja, sin ciclos de import) | `game/src/state/sys/rupturasLedger.ts` |
| Ganchos del registro | `storyBattles.ts` (`applyStoryResult`, `claimStoryCat`), `missions.ts` (`complete`), `app/storyFlow.ts` (textos de la revelación repetida) |
| Registro del parche antes de cargar | `game/src/state/index.ts` (una línea, después de las cuatro oleadas) |
| Fixtures (generadas con código) | `game/scripts/make-rupturas-fixtures.ts` → `game/test-saves/rupturas-{mid,fin,mid-v1,raro}.json` |
| Pruebas | `game/tests/rupturasReset.test.ts` (13) |

## 1. Cuándo corre

Parche `2026-10-rupturas-reinicio-v2` (id para siempre). Corre en `G.load()` → `runPatches()`, **una vez por partida**: el id queda en `G.s.patches` y además la partida guarda su propia marca `ext.rupturas.reset = { v: 2, … }` (si el registro de parches se perdiera, la marca igual impide un segundo reinicio).

| Partida | Qué pasa |
|---|---|
| Parte I sin terminar (H30 no hecha) | Nada, byte por byte. El parche queda marcado: cuando llegue a H31 la juega por primera vez, ya renovada. |
| Recién terminó la Parte I (H30 hecha, sin nada de la Parte II; o H31 activa sin haber visto su escena) | Nada. Verá la apertura nueva por primera vez. |
| Con cualquier avance de la Parte II (una misión H31+ hecha, un paso más allá de H31 activo, un beat de la Parte II visto, un flag de compuerta) | **Se reinicia** (§2) y recibe la nota de NOVEDADES (§5). |
| Partida nueva | `markAllPatched()`: nunca corre. |
| Restaurar la copia de RESPALDOS de antes del reinicio | No vuelve a correr (la copia lleva el id del parche, §4). |

El plan se calcula primero **solo leyendo** y se aplica de un golpe. Si algo falla, la partida queda **exactamente como estaba** (el parche se marca como no-op y la consola lo dice): nunca truena la carga.

## 2. Qué se reinicia y qué se conserva

Regla: se reinicia **solo la posición narrativa** (lo que haría saltarse o adelantar una escena). Todo lo que el jugador **tiene** se queda.

| Dato | Decisión | Por qué |
|---|---|---|
| `missions.done` / `active` con ids `H31`+ (incluye H42–H65 y cualquier id desconocido `H\d\d+` ≥ 31) | **Se quitan** | H31 vuelve sola por su disparador normal (`mission:H30`) en el `checkMissions()` del arranque. |
| `missions.pinned`, `missions.seenLines`, `missions.progress['H3x:…']` de la Parte II | **Se quitan** | La misión se vuelve a fijar, su tip suena y su línea base se toma de nuevo al reaparecer. |
| `beatsSeen` de la Parte II: `b31_…`–`b199_…` (con o sin `#parte`), `b31_reflejo`, todo beat de las tablas `RUPTURAS_ON_*`/`O2–O4_ON_*` y de `historia*.json`, y `carta_<región>` (la tinta «¡NUEVA ISLA!» de la carta) | **Se quitan** | Las escenas vuelven a sonar en su lugar. Los beats de la Parte I (`b00`–`b30`, `final_*`, etc.) no se tocan. |
| `won_<batalla>` / `event_done_<batalla>` de las batallas de la Parte II (`ruptura_*` y cualquier `STORY_BATTLES` con misión H31+) | **Se quitan** | Si quedaran, H34/H35/H39–H41 se cumplirían solas al aparecer. Las regiones 3D también los leen (el Bibliotecario vuelve a dormir; la puerta de Nácar se cierra). |
| `region:<isla>` (las islas de la carta) | **Se quitan** | Vuelven cuando la historia llega a ellas (`syncRegionFlags`, al aparecer H33 / H39). |
| `region_visited:<región>` | **Se quitan** | Marca de «primera vez que desembarcas»; nadie la usa como logro. |
| `nacar_haz_ok` + contador `feature_haz_nacar` → 0 | **Se reinician** | El puzle del haz se vuelve a jugar. El contador se pone en 0 porque `nacarHazOk()`/`syncRegionFlags` lo leen crudo (si no, el flag volvería solo). El valor anterior queda en `ext.rupturas.reset.counters`. |
| Contador `dmgpct_<batalla de la Parte II>` → 0 (mejor % de una batalla calificada por daño) | **Se reinicia** | Las metas `damage_pct` lo leen crudo. `dmgpct_paid_*` (lo ya pagado) se queda: es un registro. Hoy ninguna partida publicada lo tiene (llega con la Oleada 2). |
| `pagina_canelo_vista` | **Se quita** | Si quedara, la página dorada de H36 aparecería «ya leída» y **H36 no se podría completar**. |
| `oleada<n>_fin` | **Se quita** | Fin de oleada = posición narrativa; vuelve al terminar H41. |
| `forma:canelo_almirante` (y todo `forma:*`) | **Se conserva** | Desbloqueo permanente (pedido explícito). El gato sigue con su forma puesta. |
| `ext.forms.revealed` / `seen` | **Se conserva** | La revelación no salta fuera de orden. Al volver a completar **H38**, el reinicio la re-arma y `formsFlow` la vuelve a mostrar como escena (no da nada). |
| `pagina_leida:<n>` (DIARIO PERDIDO) | **Se conserva** | Es una colección (n/8) y su oro de primera lectura se paga en `regions/paginas.ts` (archivo de otro agente, todavía sin gancho al registro): borrarlas permitiría cobrar ese oro otra vez. Las páginas leídas quedan anotadas en el registro (`pagina:<n>`); si el dueño de regiones envuelve ese oro con `rewardClaimed/claimReward('pagina:'+n)` **antes de publicar**, se puede agregar `pagina_leida:` a las compuertas en este mismo parche. |
| `element:*`, `G.s.elements` (Cristal incluido), `crystals` | **Se conserva** | Un elemento descubierto no se «des-descubre». En la repetición, el descubrimiento se vuelve a ver como escena («CRISTAL: YA ERA TUYO»). |
| Contadores `feature_*` (faro, registro000, region_*, pagina_canelo, pagina), `wins_with_*`, `canelo_final_blow`, `registro_region_seen`, `missions_done`, `wins`… | **Se conservan** | Las metas de la Parte II miden **desde que aparece la misión** (línea base): no hace falta bajarlos. Son estadística. |
| Gatos (nivel, mordidas, estrellas, forma, holo, mutación, nombre, casa, K.O.), Catdex, orbes | **Se conservan** | Nunca se tocan. |
| Oro, comida, gemas, ronroneo, prisma, chatarra, planos, Reino, XP, momentum, tiempo jugado | **Se conservan** | Nunca se tocan. |
| Hábitats, granjas, expansiones, barcos, tripulaciones, diseños, armas, reliquias, tienda/decoración, accesorios, casino, Podio, encargos, expediciones, relojes | **Se conservan** | Nunca se tocan. |
| Parte I completa (misiones, beats, flags, campaña, fragmentos), `explained`, `updatesSeen`, `patches` | **Se conservan** | — |
| `ext.*` (Fonoteca `ext.music`, banco, colección, tienda, `habFoot`…) | **Se conserva** | Solo se **agrega** `ext.rupturas`. |

## 3. El registro de premios cobrados (`G.s.ext.rupturas.claimed`)

`{ [clave]: fecha }` — permanente, solo crece. Lo llena el reinicio **con la historia de la partida** y, desde ahora, cada ruta de premios de la Parte II al pagar.

| Clave | Se considera cobrada (al migrar) | Quién la consulta / marca | En la repetición |
|---|---|---|---|
| `battle:<id>` | `won_<id>` o `event_done_<id>`, o su misión hecha | `applyStoryResult` | Se pelea, cuenta para la misión, da oro y chatarra **a tarifa de etapa ya ganada** (no de primera vez), ronroneo y XP. **No** da gemas, cristales, fragmentos. `loot.alreadyPaid` → el toast dice «su premio especial ya era tuyo». |
| `cat:<id>` | batalla ganada **y** el gato está en la isla | `claimStoryCat(species, key)` (al adoptar, en la revelación) | Revelación con «YA ES PARTE DE TU TRIPULACIÓN»: no adopta copia ni da orbes de duplicado. Si el gato nunca llegó (una revelación interrumpida), la repetición se lo da **una vez**. |
| `mission:<id>` | misión H31+ hecha | `missions.complete` | Paga solo la parte de ingreso del premio estándar: oro y comida (proporcionales a tu producción, ~lo que ganas esperando lo mismo), ronroneo, momentum y XP. **Sin** gemas fijas, sin tirada de gema, sin orbes. |
| `pagina:<n>` | `pagina_leida:<n>` | (solo registro; ver §2) | — |

Decisión sobre el premio estándar en la repetición: **pequeño y renovable** (oro/comida por ingreso + la sensación de cumplir la misión), nunca lo único o escaso (gemas, orbes). Cada misión se repite **una sola vez** (el reinicio corre una vez), así que no hay ciclo para granjear.

Las batallas de la Parte I (H11–H20) **no** usan el registro: se comportan exactamente como antes.

**Contrato para las oleadas 2–4 y regiones nuevas:**

- Batallas: registrarlas en `STORY_BATTLES` con su misión `H42`+ basta; el registro las cubre solo.
- Cualquier otro premio único de la Parte II (oro de primera vez en una región, cristales de un puzle, una canción…) debe hacer `if (!rewardClaimed(k)) { pagar; claimReward(k) }` con `rupturasLedger.ts`.
- Marcas persistentes de escenas: usar ids de beat que reconozca `isPart2Beat` (numeración `b31`+, o el beat listado en `historia-o*.json` / las tablas `O*_ON_*`). El `persist` de `src/cine` usa `markBeat`: con esos ids, el reinicio los cubre.
- Flags que hacen saltar una escena: `region:*`, `won_*`/`event_done_*` de batallas de la Parte II y `oleada<n>_fin` ya están cubiertos; uno nuevo con otro nombre se agrega a `isStoryGateFlag`.
- Otro reinicio en el futuro = **id nuevo** + subir `RESET_V`.

## 4. Respaldo y reversa (RESPALDOS)

Antes de mover nada, el parche guarda la isla tal cual estaba, **marcada con el id del parche** (así, restaurarla devuelve esa isla sin reiniciarla otra vez):

1. **Historial (IndexedDB, `core/vault.ts › snapshot`)**: entrada «antes de la renovación de la Parte II» en *Ajustes › RESPALDOS › HISTORIAL DE TU ISLA*.
2. **Copia en localStorage** `nolc-save-bak-parte2-reinicio` (se ve como «antes de la actualización (versión 3)»). Nunca se sobrescribe. Se omite si el almacenamiento está apretado (la partida viva siempre conserva espacio para crecer).

**Reversa para un jugador:** *Ajustes › RESPALDOS* → RECUPERAR esa entrada. Vuelve su posición vieja y el reinicio no corre más en ella.

**Reversa de soporte (consola):** `ext.rupturas.reset` guarda qué se movió (`done`, `active`, `beats`, `flags`, `counters`). Para volver a aplicar el reinicio a una copia restaurada: quitar `2026-10-rupturas-reinicio-v2` de `patches` y borrar `ext.rupturas.reset` (el registro `claimed` **no** se borra nunca).

## 5. Lo que ve el jugador

Nota de NOVEDADES del parche (el líder agrega además la entrada de `data/updates.ts`):

> La Parte II recibió una renovación cinematográfica y musical: su historia vuelve a empezar y tu progreso queda intacto (tus gatos, formas, islas y recursos siguen contigo). Las escenas se vuelven a ver; los premios únicos que ya ganaste no se repiten. Luzterna te espera en el faro.

En la repetición: revelaciones de gatos con «YA ES PARTE DE TU TRIPULACIÓN» (sin botón ni contador del Catdex), el descubrimiento del Cristal con «CRISTAL: YA ERA TUYO · TUS HÁBITATS Y CRISTALES SIGUEN CONTIGO», y el toast de la batalla con «su premio especial ya era tuyo».

## 6. Pruebas (`tests/rupturasReset.test.ts`)

«Antes» = la misma fixture cargada con el parche ya marcado (mismas migraciones, `normalize()` y parches); «después» = la carga normal.

| # | Caso | Fixture | Resultado |
|---|---|---|---|
| 1 | Parte I sin terminar: intacta byte por byte | `late-game`, `post-story`, `post-boss1/2/3`, `pre-boss3`, `casino-v1`, `m2-postboss2`, `isla-m2` | ✅ sin cambios, sin nota, sin respaldo, sin `ext.rupturas` |
| 2 | Recién terminó la Parte I | `post-finale` | ✅ no-op; H31 aparece |
| — | Jugador de Parte I que llega después a la Parte II | `post-finale` | ✅ cobra todo la primera vez; el registro se llena en vivo |
| 3 | A mitad de la Oleada 1 (H35 activa) | `rupturas-mid` | ✅ reinicio; respaldo pedido **antes** de mutar y con la isla vieja; inventario idéntico; registro lleno; H31 vuelve a aparecer y se fija |
| 4 | Oleada 1 terminada (H41, Canelo Almirante, Cristal) + **repetir toda la oleada** | `rupturas-fin` | ✅ forma y elemento intactos; la repetición no da gemas (salvo hito de Reino), cristales, orbes, prisma ni gatos; la revelación de la forma se re-arma en H38; al final todo vuelve a estar como antes |
| 5 | Premios y colecciones (Fonoteca `ext.music`, casino, decoración, accesorios, equipo, banco, holo) | `rupturas-fin` | ✅ idénticos |
| — | Totales (recursos, gatos, estrellas, niveles, orbes, cristales) antes = después | **todas** las fixtures | ✅ |
| 6 | Forma vieja (SAVE v1) | `rupturas-mid-v1` | ✅ migra v2+v3 y reinicia en la misma carga |
| 7 | Recargar después del reinicio | `rupturas-fin` | ✅ no vuelve a correr (ni perdiendo el id del registro de parches); estado estable |
| — | Restaurar la copia de RESPALDOS | `rupturas-mid` | ✅ vuelve la isla vieja sin reiniciarse |
| 8 | Registros inconsistentes (H38 hecha sin H36, activa y hecha a la vez, ids desconocidos H77/H99, sin `ext`) | `rupturas-raro` | ✅ resultado sano; solo H31 activa tras `checkMissions()` |
| — | Nunca truena; almacenamiento casi lleno → reinicia sin la copia extra | `rupturas-mid` | ✅ |

**Regenerar las fixtures** (desde `post-finale.json`, jugando la oleada con el código real y quitando lo que solo escribe la versión nueva):

```
cd game && npx vite-node scripts/make-rupturas-fixtures.ts
```


**Ajuste del líder (2026-10-09):** el oro de las páginas del Diario Perdido (`regions/paginas.ts`) ahora pasa por el registro (`pagina:<n>`), así que el reinicio también limpia `pagina_leida:*`. Las páginas se vuelven a leer y el oro no se paga dos veces.
