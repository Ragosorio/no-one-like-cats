# Dimensiones y gateras (Parte III, sin spoilers)

La Parte III, **«Fuera de la Caja»**, está en desarrollo. Agrega un **segundo mapa en 2D**, la **Carta de las Cajas**, con **dimensiones**: cajas con su propio estilo de arte, sus propias batallas y una regla de combate propia. Esta guía explica cómo está armado eso por dentro, contra el código que ya existe. **No cuenta la historia**: ni quién aparece, ni por qué, ni qué pasa.

> El código de la Parte III todavía no está en la versión publicada. Si algo de aquí no coincide con lo que ves, el código gana y esta guía merece un arreglo.

Guías hermanas: [rutas-de-desarrollo.md](rutas-de-desarrollo.md) · [cines-y-estados.md](cines-y-estados.md) · [agregar-momento.md](agregar-momento.md) · [agregar-barco.md](agregar-barco.md) · estilos: [ESTILOS.md §8](../arte/ESTILOS.md#8-parte-iii-las-dimensiones)

---

## 1. Las piezas

| Pieza | Archivo | Qué hace |
|---|---|---|
| Los datos de la Carta | `game/src/data/gateras/regiones.json` | Las dimensiones, sus precios, su geometría en la carta y las etapas de cada una. |
| La historia de la porción | `game/src/data/gateras/historia.json` | Sus misiones y beats. Se une al contenido con `mergeContent` (solo agrega). |
| El estado | `game/src/state/sys/gateras.ts` | La sección de la partida, el precio de una gatera, abrirla, las huellas y las victorias. Puro, sin Pixi. |
| Las batallas | `game/src/state/sys/gaterasBattles.ts` | Arma cada pelea con la fábrica de asedios de la campaña. |
| La regla de la Borracha | `game/src/battle/mareo.ts` (+ `mareoFx.ts` para verla) | El MAREO: reglas puras que el simulador llama. |
| La Carta | `game/src/scenes/GaterasMapScene.ts` | El segundo mapa. |
| La escena de una dimensión | `game/src/scenes/CajaScene.ts` (+ `scenes/caja/`) | Una caja en 2D, con sus sets. Es el escenario de cine `caja`. |
| Los flujos | `game/src/app/cajasFlow.ts`, `game/src/app/gaterasFlow.ts` | El pegamento entre escenas (las escenas no se importan entre sí). |
| El mundo | `game/src/state/sys/gaterasWorld.ts` | Los estados del mundo de la Parte III (banda de prioridad 130–159). |
| La Bitácora | `game/src/panels/Bitacora.ts` | La tarjeta de cada misión de la Parte III. |
| El estilo de la Borracha | `game/src/momentos/songs/drunck/tv.ts` | La paleta, la línea y el horneado de "caricatura de TV". |

---

## 2. La Carta de las Cajas

Se lee como el Diario del Mar (`scenes/MapScene.ts`): etapas numeradas a lo largo de una ruta, el escudo de élite en la 5, el jefe en la 9, el anillo de frontera que late, el barquito encima, la ruta que se entinta al ganar y la tarjeta con probabilidades honestas. Pero está dibujada como un **cuaderno a mano**, con tu isla y su faro en el centro y **cinco gateras** alrededor. En esta versión solo una está abierta; las demás se ven como hojas en blanco.

**La geometría es dato, no código.** Todo sale de `regiones.json`:

| Clave | Qué guarda |
|---|---|
| `huellas` | Cuántas huellas da una etapa: `firstWin` (3) y `boss` (10). |
| `island` | Dónde va tu isla en la carta (y su faro). |
| `dims[]` | Cada dimensión: `id` (`p3d_*`), `order`, `name`, `sub`, `look` (`tv` o `blank`), `price` (`secs`, `floor`, `huellas`), `box` y `screen` (su lugar en la carta), `tear` (la gatera), `palette`, `notes`. |
| `stages` | Por dimensión, sus etapas: `n`, `name`, `kind` (`normal`, `elite`, `boss`), `playable`, `at` (posición 0..1 en su pantalla), capitán, tripulación, arquetipo de barco, IA, `powerMul`, la configuración de su regla (`mareo`) y `teach` (qué enseña). |
| `later` | Lo que está diseñado pero no entra todavía. |

`regiones.json` tiene **su propio espacio de nombres**: nada de esto entra a `content.enemies`, que es de la Parte I y se rompería.

---

## 3. Abrir una gatera

- **Precio** (`priceFor`, `gateraPrice`): minutos del ingreso de tu isla, con un piso. `max(piso, ingreso por segundo × segundos)`, corregido para que los multiplicadores de fin de juego no disparen el precio. La primera dimensión cuesta 900 segundos de ingreso con un piso de 4 500 millones de oro; las siguientes, más.
- **Huellas**: 3 por la primera victoria en cada etapa y 10 por un jefe. Las da el juego; no se pueden farmear. Las dimensiones siguientes piden huellas además de oro.
- **Abrirla** (`buyGatera`, `openGatera`) guarda la fecha en la partida. **Un id de dimensión es para siempre.**
- **La historia manda**: `cartaAvailable()` y `storyAllows(dim)` deciden cuándo aparece la Carta y qué gatera se puede comprar. Con `?scene=cajas` en desarrollo (`setGaterasDev`) todas las puertas de historia se abren; en producción, nunca.

---

## 4. La partida

La Parte III guarda todo en una sección opcional:

```ts
G.s.ext.gateras = {
  v: 1,
  open:    { [dim]: fecha },                         // cuándo se abrió cada gatera
  huellas: número,
  stages:  { [dim]: { cleared, wins: { [n]: victorias } } },
  seen:    string[],                                 // escenas y notas ya mostradas (nunca dos veces)
};
```

Las reglas de la casa, aplicadas aquí:

- **Una partida sin Parte III queda idéntica, byte por byte.** La sección solo se crea cuando una acción de la Parte III la necesita.
- `normalizeGateras` **solo repara**: limita números, conserva claves desconocidas, y `cleared` nunca baja de lo que prueban las victorias. **Nunca resta.**
- Una sección rota (que no es un objeto) **se aparta** en `ext.gaterasBroken`; no se borra en silencio.

Más en [ACTUALIZACIONES.md](../ACTUALIZACIONES.md).

---

## 5. Las batallas

- **Se arman con la fábrica de asedios** de la campaña (`buildSiege`), como los Encargos, **nunca** a través de `content.enemies`.
- **El poder del enemigo te sigue**: `max(3 000, tu flota × powerMul)`, con `powerMul` entre 0,85 y 1,05 según la etapa. La élite usa la banda de jefe. Nunca es un muro.
- **El id de una batalla** es `p3d_<dimensión>_<n>`. Con él se encuentra su plan de música en `data/music/battles.json`, y la primera victoria levanta la bandera `won_p3d_<dimensión>_<n>`.
- **La regla es dato**: `StageRules.mareo` en el spec de la batalla. Por eso la estimación de victoria simula exactamente la misma pelea.

### La regla de la Borracha: el MAREO

Reglas puras en `battle/mareo.ts`, sin render y sin tocar el azar de la batalla. El simulador las llama con ganchos chiquitos (`mareoInit`, `mareoAngle`, `mareoImpact`, `mareoStartTurn`, `mareoMeterMul`) y la IA esquiva las donas (`mareoShotValue`).

| Pieza | Qué hace |
|---|---|
| **Vaivén** | Cada disparo de gato (de los dos lados: en esa caja todos están mareados) sale con un balanceo senoidal. La guía de puntería lo muestra: esperar el centro del vaivén es la habilidad. |
| **Desvío** | Un desvío chiquito y determinista por disparo, que la guía no muestra. |
| **Donas** | Donas en la cubierta. Un impacto que cae sobre una se la come y **cura** a ese lado. |
| **Botellas** | Cada cierto número de turnos caen botellas sobre el otro barco. |
| **Karaoke** | La barra de la ultimate de un lado se llena más lento. |

Cada etapa trae su propia dosis en `regiones.json` (`mareo: { sway, period, drift, … }`) y una línea `teach` que dice qué enseña.

---

## 6. La escena de una dimensión

`CajaScene` es una escena 2D con **sets** (hoy, `bar` y `calle`) y es el escenario de cine `caja` ([cines-y-estados.md](cines-y-estados.md#24-escenarios)). Sus guiones viven en `cine/scenes/` como los demás.

- **Los gatos de tu casa que la visitan** se hornean una vez con la lente de la dimensión (`bakeTv`): la misma pintura, nunca redibujada.
- **Los nativos de la dimensión** se dibujan como pinturas propias.
- **La textura de tele** (curvatura, líneas de barrido) es un filtro de pantalla (`CRTFilter`), no parte de la pintura.

El estilo completo, con paleta y reglas de línea, está en [ESTILOS.md §8](../arte/ESTILOS.md#8-parte-iii-las-dimensiones).

---

## 7. La Bitácora

Cada misión de la Parte III trae una **tarjeta** (`card` en `MissionDef`) con cinco campos de una línea: **PASA**, **IMPORTA**, **QUEREMOS** y **AHÍ** cuando la misión aparece, y **CAMBIÓ** cuando se cumple. El premio va al final, chiquito: la tarjeta existe para que el jugador sepa **por qué** hace cada cosa. `panels/Bitacora.ts` las muestra siempre con la misma pieza de interfaz, escrita a mano.

Si escribes una misión de la Parte III, llena su tarjeta en `data/gateras/historia.json`.

---

## 8. Probar

| Ruta (solo con `npm run dev`) | Qué ves |
|---|---|
| `?save=h65-normal&scene=cajas` | La Carta, con una partida que acaba de terminar la Parte II. |
| `?scene=caja&set=bar` / `&set=calle` | Un set solo (`window.__caja`). |
| `?scene=caja&set=bar&cine=<id>` | Una cine de la dimensión como repetición (no guarda nada). |
| `?momento=drunck` | El Momento musical de la dimensión. |

Pruebas (`npm test`): `gateras.test.ts`, `gaterasCimientos.test.ts`, `mareo.test.ts`, `p3Caja.test.ts`, `p3BarPulido.test.ts`, `p3CallePulido.test.ts` y `momentoDrunck.test.ts`.

---

## 9. Si quieres ampliar una dimensión

Las dimensiones nuevas y su historia se diseñan con el autor: **abre primero un issue Idea**. Lo que sí está claro en el código:

1. **Etapas**: más entradas en `stages` de `regiones.json` (`playable: true` cuando estén listas). La forma la valida `gateras.test.ts`.
2. **Regla**: un módulo puro en `battle/`, como `mareo.ts`: estado en un `WeakMap`, sin azar de la batalla, ganchos chiquitos en `sim.ts` y su configuración en `StageRules`. La vista va aparte (como `mareoFx.ts`).
3. **Estilo**: un candado de estilo documentado en [ESTILOS.md](../arte/ESTILOS.md), su lente de horneado y su paleta.
4. **Música**: un plan en `battles.json` con el id de la batalla y, si hay canción original, su remezcla `.battle` (nunca la original: [agregar-momento.md](agregar-momento.md#0-la-regla-de-las-canciones-originales)).
5. **Partida**: nada fuera de `ext.gateras`; ids nuevos con el prefijo `p3d_`, para siempre.

Diseño interno completo: `docs/part-iii/` (contiene spoilers).
