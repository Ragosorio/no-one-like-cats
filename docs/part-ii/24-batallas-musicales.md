# 24 · Batallas musicales (INTERNO)

> Agente BATTLE-MUSIC, 2026-10-09. Código: `game/src/battle/music/*`, `game/src/battle/sincro.ts`, datos:
> `game/src/data/music/battles.json`. Catálogo y mapas de beats: doc 18. Motor de audio: doc 19. Sin `git commit`.

> **2026-10-10 · BATTLE-REMIX:** todas las batallas suenan ahora con los **remixes de batalla** (`<canción>.battle`,
> doc 23 §Remixes de batalla); las 6 originales quedan para los Momentos musicales. Los planes se re-escribieron contra los
> mapas de beats de los remixes (§5) y los desbloqueos de originales **salieron de las batallas** (§5.1).

## Para el dueño

- **La pelea se arma alrededor de la canción.** En LIKY FIGHT la batalla empieza contenida (solo percusión: los
  barcos se preparan). Cuando el enemigo mueve por primera vez, la música entra en el compás de anacrusa y su primer
  golpe grande cae **exactamente** en el drop. Después, los cañones caen en los acentos fuertes, la cámara responde
  según la fuerza del golpe, el cielo se enciende y el mar salpica en los compases intensos. Cuando llega otra sección
  intensa hay un momento especial; los silencios de la canción congelan la pantalla un instante.
- **No es un juego de ritmo.** Apuntar y disparar sigue siendo inmediato. La música solo decide *cuándo se ve* lo que
  el enemigo ya decidió (como mucho espera un compás). Nunca se le explica la música al jugador.
- **SINCRO** (para la misión de Sincronía): un anillo discreto en tu gato al apuntar; si sueltas dentro del brillo y tu
  tripulación tiene Fuego + Tormenta, el tiro encadena una SOBRECARGA. Es generoso (≥ 150 ms a cada lado), funciona
  con el sonido apagado (el anillo marca el mismo pulso) y hay **Ajustes › Audio › Ajuste de ritmo** para audífonos
  Bluetooth.
- Se puede ver ya: `?scene=battle&music=liky_fight` (solo en desarrollo).
- Medido en Chrome con audio real: el primer golpe enemigo cae **2 ms** después del drop; los impactos sincronizados
  caen con mediana de **≈ 1–6 ms** del golpe; con la CPU 4× más lenta siguen en sincronía o se saltan limpio (§6).

---

## 1. Qué pasa en una batalla con plan

1. `BattleScene.enter` crea `BattleMusic` (`startBattleMusic`). Resuelve el **plan** (§3.3). Sin plan, no hace nada:
   la batalla suena como siempre (director, estado `battle`/`boss`).
2. Pide la canción con `audioApi.cue(track, { section, loop, sync: true, quantize: 'now', restart: true })` y el reloj
   espera a que **se oiga** (≤ 2,6 s). Si no llega (sin audio, bloqueado, 404, decodificación lenta), la batalla sigue
   con un **reloj interno** sobre el mismo mapa de beats: misma coreografía, mismas ventanas de SINCRO, cero esperas.
3. Cada cuadro, un **cursor** recorre el mapa (beats, compases, secciones, marcadores y golpes de coreografía) y
   dispara **reacciones** de presentación (§3.4).
4. En cada inicio de turno (y con señales de fase) se evalúan las **reglas de estado**: turno, casco, fase de jefe,
   señal → salto **cuantizado** a otra sección o canción.
5. Turno enemigo: el sim ya resolvió cada disparo. `beforeEnemyShot` elige el golpe donde debe caer el impacto, espera
   (≤ 1 compás; el primer gran movimiento hasta 1,25), el tirador **telegrafía** en los beats mientras espera, y el vuelo
   se estira (×0,8–1,3) para aterrizar justo en el golpe. Los cañones de una andanada quedan a ≥ 1 beat entre sí o se
   **agrupan** (hasta 3) en un acento fuerte. Al aterrizar: cámara por fuerza del golpe, luz del cielo, salpicadura.
6. Turno del jugador: nada espera. Si su impacto cae cerca (±130 ms) de un golpe fuerte, lleva un *flourish* (destellos
   + cámara). Con SINCRO activo, soltar dentro de una ventana es un input explícito para el sim (§4).
7. Fin: victoria → la sección del plan en el **siguiente compás** (remixes: el remate `outro`; Bibliotecario: el
   `climax` sin loop; Corrector: el final raro re-orquestado, narrativo) + desbloqueo de Fonoteca **al salir de la batalla** (nunca debajo del
   cartel final). Derrota → la canción se desinfla (−12 dB + paso-bajo) bajo el cartel; la pantalla de resultados
   retoma la música. Un **objetivo** activo (H38) puede ganarle al final del plan (§5).

**Regla de oro:** ninguna llamada del sim lee el reloj. La música decide CUÁNDO se muestra algo, nunca QUÉ pasa.

## 2. Arquitectura

| Archivo | Qué hace |
|---|---|
| `battle/music/plan.ts` | Tipos, limpieza del JSON (`extends`, valores por defecto, límites), `resolvePlan`, reglas de estado y de reacción (puro). |
| `battle/music/timeline.ts` | Matemática pura en tiempo «desenrollado» del motor: golpes de coreografía (los de MUSIC o sintetizados), `landingSpots`, `Cursor` (entrega única + regla de salto), `chooseSlot` (dónde cae un impacto enemigo), `sincroJudge`. |
| `battle/music/clock.ts` | `MusicClock`: posición **oída** de la canción. Modos `audio` (`audioApi.trackTime()` − ajuste de ritmo), `internal` (performance.now sobre el mapa) y `pending`. Nunca cree en un deck viejo: un deck nuevo solo cuenta si su posición es plausible para lo pedido y rompe la continuidad del anterior. |
| `battle/music/index.ts` | `BattleMusic`: arranque, reacciones, reglas, coreografía enemiga, SINCRO, RUIDO, final, desbloqueos. Hook DEV `window.__battleMusic` (traza). |
| `battle/music/stage.ts` | Verbos de presentación: `camera`, `sky`, `sea`, `crew`, `ui`, `freeze`, `special`, `tide`, `telegraph`, `flourish`. Respetan *Reducir movimiento* / *Reducir destellos*. |
| `battle/music/sincroUi.ts` | El anillo de SINCRO + la única pista contextual («¡SUELTA EN EL BRILLO!», una vez por partida). |
| `battle/music/musicFilter.ts` | Paso-bajo solo de la música (RUIDO, derrota): se inserta entre `musicDuck` y `master` y se quita al abrirse. |
| `battle/sincro.ts` | Reglas de SINCRO en el sim (input explícito, combos, SOBRECARGA). |
| `dev/devMusicBattle.ts` | La pelea de prueba de `?scene=battle&music=liky_fight`. |

**Ganchos en BattleScene** (diff chico): campo `music`; `startBattleMusic` en `enter`; `dispose` en `exit`;
`beforeEnemyShot` antes de animar el disparo de un gato enemigo y de cada cañón enemigo (la andanada sincronizada
lanza sin esperar cada animación y espera todas al final); `flightAcc` en `flyShot` (un vuelo sincronizado avanza por
el reloj de audio, no por el tiempo de cuadro); `onImpact` en el evento `impact`; `beforeSetPiece` antes de un
cataclismo (arranca en el siguiente compás, ≤ 1); `sincroNow` al soltar el tiro; `onFinish` en `finish()`.

**Gancho en el sim:** `fire(…, cannonId?, input?: FireInput)` → `scBeginFire` / `scAfterFire` (`battle/sincro.ts`).

**Cambio al motor (mínimo y compatible):** `CueOpts.restart` (api.ts) + `Director.cue` lo pasa a `apply(…, restart)`.
Sin él, un `cue` de la canción que ya suena era un no-op y no se podía saltar de sección dentro de la misma canción.

**Fases de batalla:** `battle/fases.ts` (`onFase`) → señales `fase:<id>` y `phase:<n>` para las reglas
(`{ "when": { "signal": "fase:cielo" } }`). Otro código puede mandar las suyas con `scene.music?.signal('…')`.

## 3. `battles.json`: esquema y cómo escribir un plan

### 3.1 Documento

```jsonc
{
  "defaults": { … },            // se mezcla debajo de todo (sync, sincro, lateSkipMs…)
  "presets":  { "fiesta": {…}, "liky_fight": {…} },   // planes reutilizables
  "kinds":    { "default": null, "boss": null, … },   // plan por tipo de batalla (null = música del director)
  "goals":    { "H38": {…} },   // una misión activa que monta plan/remate sobre cualquier batalla
  "battles":  { "<id de batalla>": {…} }               // ids de STORY_BATTLES / especiales; ids desconocidos = sin error
}
```

`extends` hereda de otro plan (objetos se mezclan, listas y valores se reemplazan; hasta 6 niveles).

### 3.2 Plan

| Campo | Tipo | Qué es |
|---|---|---|
| `track` | ref | Canción o versión (`liky_fight`, `liky_fight.explore`). |
| `fallback` | ref | Canción a usar mientras `track` no esté en el catálogo (versiones/composiciones por venir). |
| `startSection` / `startAt` | nombre / s | Dónde arranca (sección **o** marcador del beat map). |
| `loop` | bool | Repetir la región de loop de la canción (def. `true`). ⚠ Si arranca en o después del fin del loop, `false` (un buffer en loop salta directo al inicio del loop). |
| `fadeIn` | s | Entrada (def. 0,3). |
| `endTo` | destino | Si una sección sin loop llega al final de la canción en plena batalla, volver aquí. |
| `reactions[]` | §3.4 | Golpes/compases/marcadores → presentación. |
| `states[]` | §3.5 | Turno/casco/fase/señal → salto cuantizado. |
| `sync` | obj | Coreografía enemiga: `enabled`, `minStrength` (0,6), `strongStrength` (0,85), `maxDelayBars` (1, máx. 2), `minGapBeats` (1), `batchMax` (3), `stretch` ([0,8, 1,3]), `firstMove {kinds, minStrength, maxDelayBars}`, `setPieceMaxBars` (1). |
| `sincro` | obj | `enabled`, `minStrength` (0,8), `kinds` (`drop`, `reentry`), `windowMs` (170; nunca < 150), `teach` (batalla que enseña). |
| `ruido` | obj | `duckDb`, `duckFrom` (nivel 0–3), `lowpassHz[nivel]` (null = abierto). |
| `victory` / `defeat` | obj | `track?`, `section`, `quantize`, `narrative`, `releaseAfterSec`, `stinger`, `fade`, `unlock {song, source, delaySec}`. |
| `extraHits[]` | `{time, kind, strength}` | Golpes que el beat map no tiene (los stops de `chorus2` de te ODIO). |
| `lateSkipMs` | ms | Eventos de beat/compás/golpe más tarde que esto se saltan (def. 120). |

**Destino** (`to`, `endTo`, finales): `{ track?, section, quantize?: 'bar'|'beat'|'now', loop?, stinger?, narrative?, fallback? }`.
Si `loop` no se dice, se repite solo cuando el destino cae dentro de la región de loop.

### 3.3 Qué plan toca

`forzado (DEV) > id de la batalla > objetivo activo que aplica > tipo`. La batalla se identifica por
`spec.meta.special ?? spec.meta.key`; el tipo por `spec.boss / mode / meta.errand / meta.special`. Un **objetivo**
(`goals`) aplica si su misión está activa y (si dice `species`) ese gato va en la tripulación; su `plan` solo se usa si
la batalla no tiene uno propio, y su `finale` se monta encima de cualquiera.

### 3.4 Reacciones

```jsonc
{ "on": "bar" | "beat" | "hit" | "hit:<kind>" | "section" | "section:<n>" | "marker:<n>",
  "minStrength": 0.97, "minEnergy": 0.75, "maxEnergy": 0.6, "sections": ["drop"], "every": 2,
  "phases": ["aim", "enemy", "flight", "intro"], "do": ["sky", "camera"], "amount": 0.4, "color": "#9fc3ff" }
```

- `kind` de golpe: los de MUSIC (`kick snare stab phrase drop build stop reentry shout`). Canciones sin `hits`
  reciben golpes **sintetizados**: compás (`kick` 0,7; cada 4 `phrase` 0,85), tiempo 3 (`snare` 0,5), salto de energía
  de sección (`drop` 1,0), `big_hit_*` (`phrase` 1,0), `silence_*` (`stop` 0,9).
- `energy` es la de la sección donde cae el evento (beat map).
- Verbos: `camera` (golpe de cámara por fuerza), `sky` (luz del horizonte detrás de los barcos), `sea` (salpicadura),
  `crew` (las tripulaciones marcan el compás; nunca el gato que apuntas), `ui` (pulso de la carta elegida: «los barcos
  se preparan»), `freeze` (cuadro congelado del largo del silencio; nunca con un tiro en el aire), `special` (todo el
  escenario responde una vez), `tide` (tinta sobre el mar unos compases).
- Con un tiro en el aire la cámara es del tiro: los verbos de cámara y congelado se callan.

### 3.5 Reglas de estado

```jsonc
{ "id": "primer_golpe",
  "when": { "enemyTurn": 1, "before": "first_drop" },     // AND de todo lo que diga
  "to":   { "section": "build_1", "quantize": "bar" },
  "once": true }
```

`when`: `enemyTurn` / `playerTurn` (n-ésimo que empieza), `turnAtLeast`, `enemyHullBelow` / `playerHullBelow` (0..1),
`bossPhase`, `signal`, `before` (sección/marcador, solo la primera pasada), `unlessSection`. Se evalúan **al empezar
cada turno** (no a media animación: la música nunca adelanta el resultado de un tiro que todavía vuela) y con cada señal.

### 3.6 Cómo escribir un plan (receta)

1. Mira la canción en doc 18 §4 (secciones, marcadores, energía, loop).
2. Elige dónde arranca: contenido (intro/verse) si la batalla tiene que «crecer»; directo al loop si no.
3. Hereda reacciones de un preset (`fiesta`, `solemne`, `mecanico`, `epico`, `despecho`) y ajusta 1–3.
4. Pon pocas reglas de estado (≤ 3): un salto por momento dramático (primer turno enemigo, umbral de casco, fase).
5. Final: victoria en el siguiente compás a una sección que **resuelva**; derrota suave.
6. `npx vitest run tests/battleMusic.test.ts` comprueba que cada nombre exista en su canción y que nada arranque en
   loop desde el fin del loop. Para verlo: un `devMusicBattle` con su id (`?scene=battle&music=<id>`).

Ejemplo (la batalla de Sincronía, H51):

```json
"ruptura_sincronia": { "extends": "liky_fight", "sincro": { "enabled": true } }
```

## 4. SINCRO

- **Ventanas:** en los golpes con `strength ≥ 0,8` y en todo `drop` / `reentry` (LIKY: ~150 golpes fuertes, ≈ 0,6/s).
  Medio ancho **170 ms** (forzado ≥ 150). Se juzga la posición **oída** (reloj de audio con latencia compensada) menos
  el **Ajuste de ritmo** del jugador (−200…+200 ms, de a 10, `settings.rhythmOffsetMs`) y menos ~8 ms de lag de input.
- **Input explícito:** `BattleScene.playerFire` → `music.sincroNow()` → `sim.fire(…, { sincro })`. El sim lo registra
  (`scStats(b).inputs`) igual que el ángulo; repetir los mismos inputs con la misma semilla repite la batalla. El
  estimado (`autoBattle`) nunca pasa inputs: asume **sin SINCRO**.
- **Efecto:** solo si la tripulación viva tiene un combo y el tirador es parte de él. Hoy: **Fuego + Tormenta =
  SOBRECARGA** — el primer impacto en el rival encadena una descarga a los módulos vivos más cercanos (hasta 3 saltos,
  ≤ 4 celdas cada uno), cada salto a la celda más fuerte del módulo por 0,5 × ataque (y al gato de ese cuarto 0,15 ×).
  Respeta el tope de ultimate y la armadura; sin rng. Sin combo, el input no hace nada (ni se muestra el anillo).
- **UI:** anillo en la boca del tirador mientras apuntas: se cierra hacia cada ventana y brilla mientras está abierta.
  Al acertar: «SINCRO» + chispa + luz. Con *Reducir movimiento* el anillo no se encoge (solo aparece el brillo). Sin
  sonido, el reloj interno marca exactamente el mismo horario. Una sola pista contextual en la vida de la partida.
- **H51 enseña (`sincro.teach`):** en el primer turno, si nadie a bordo puede, dice que hace falta Fuego + Tormenta; si
  el gato elegido no puede pero otro sí, lo nombra. La pista del anillo sale siempre (4,5 s) y el primer acierto tiene su
  línea («¡ESO ES SINCRO!»). **No hay muro:** la misión se completa al ganar, con o sin SINCRO. Nota para la Oleada 3: la
  línea de intro de `ruptura_sincronia` dice «si dos gatos … llenan su medidor, pegan juntos»; lo que existe es «con Fuego
  y Tormenta en tu tripulación, suelta cuando brille el anillo: SOBRECARGA, el golpe salta de módulo en módulo».
- **Afinar:** `windowMs` (más ancho = más fácil), `minStrength` / `kinds` (más o menos ventanas), `SC_JUMP` / `SC_JUMPS`
  / `SC_REACH` en `sincro.ts`. Medido con el bot «en el pulso» (suelta en el centro de la ventana): 5/6 aciertos, error
  −14…−28 ms. `music.sincroAccuracy` da el % para la insignia «Coreografía» (H51, ≥ 90 %, la pone la Oleada 3).

## 5. Batallas conectadas (con los remixes de batalla, 2026-10-10)

Todas las pistas son remixes (`<canción>.battle`) o variaciones. Secciones comunes de los remixes: `intro · verse · drop · break ·
climax · outro`, marcadores `pre_drop` (2 compases antes del drop), `build_1`, `breakdown`, `build_2`, `intense`, `last_bar`
(doc 23 §Remixes de batalla). Todo lo que estaba en el loop de la original ahora está dentro del loop del remix (verse → climax);
el `outro` es el remate y está fuera del loop.

| Batalla | Misión | Música | Saltos / eventos | Final | Fonoteca (al salir) |
|---|---|---|---|---|---|
| `ruptura_paginas` | H34 | `when_i_lose.battle` desde `verse` | marea de tinta en `first_drop` | — | — |
| `ruptura_bibliotecario` | H35 | `when_i_lose.battle` desde `verse` | RUIDO 1/2/3: paso-bajo 2600/1100/520 Hz, duck −7 dB desde 2 | `climax` (sin loop: clímax + remate), narrativo, suelta a los 28 s | `when_i_lose.battle` |
| `ruptura_nacar` **(nuevo)** | H39 | `yonose_todo.battle` (preset `yonose_todo`) desde `intro` | 1.er turno enemigo → `pre_drop`; ≤ 35 % → `build_2` | `outro` | `yonose_todo.battle` |
| `ruptura_madrenacar` | H40 | `when_i_lose.battle` desde `drop` | casco ≤ 34 % → `climax` | — | — |
| `ruptura_corrector` | H41 | `circus_malus.battle` desde `verse` | — | `outro` = el final raro re-orquestado, narrativo | `circus_malus.battle` (8 s después) |
| cualquier batalla con H38 activa y Canelo | H38 | `liky_fight.battle` (si no tiene plan propio) | como LIKY | golpe final de Canelo → `climax` sin loop (clímax + remate), narrativo | `liky_fight.battle` |
| `cielo_invertidas` | H44 | `hemkade.battle` desde `verse` (sin bombo) → drop solo | — | — | `hemkade.ambient` |
| `cielo_embajada` | H46 | `circus_malus.battle` → casco ≤ 70 % → `stinger('swap')` + `liky_fight.battle` `drop` | duelo de temas | — | — |
| `cielo_almirante` | H47 | `hemkade.battle` desde `drop` | turno 3 (inversión) → `breakdown` → `climax` | — | — |
| `cielo_masamadre` | H49 | `when_i_lose.battle` `verse` | ≤ 67 % `drop` · ≤ 34 % `climax` | — | — |
| `ruptura_sincronia` | H51 | `liky_fight.battle` + **SINCRO** (enseñanza) | como LIKY | `outro` | — |
| `ruptura_estrella` | H52 | `te_odio.battle` `verse` | ≤ 30 % → `break` (filtrado + tartamudeo) → `climax` | — | `te_odio.battle` |
| `ruptura_disruptores` | H55 | `te_odio.battle` desde `drop` | los grafitis caen en los **cortes de señal** del gancho (stop/reentry del mapa; ya no hay `extraHits`) · `fase:glitch` → `break` | — | `te_odio.ambient` |
| `ruptura_leviatan` | H57 | `hemkade.battle` `drop` | `fase:cielo` → `climax` · `fase:grieta` → `breakdown` (→ `climax`) | `outro`, narrativo | `hemkade.battle` (5 s) |
| `umbral_suenos` | H58 | `liky_fight.explore` (respaldo `liky_fight.battle` `verse`) | frases con luz | — | — |
| `umbral_correctores` | H62 | `circus_malus.battle` `drop` | — | `stinger('correccion_rota')` | `circus_malus.stinger` |
| `umbral_final` | H63 | `circus_malus.battle` `drop` | `fase:disruptores` → `te_odio.battle` `climax` · `fase:titiriteros` → `boss.umbral` (respaldo `hemkade.battle` `breakdown`) · `fase:umbral` → `hemkade.battle` `climax`; cada cambio con `swap` | `hemkade.battle` `outro`, narrativo | — |
| `dev_liky_fight` | DEV | `liky_fight.battle` + SINCRO | como LIKY | `outro` | — |

- **Primer movimiento enemigo:** antes el salto iba a `build_1` (1 compás antes del drop). Los remixes pesan ~1,3 MB y el salto
  se oye en 0,3 s (antes 2 s de decodificación): con `build_1` el drop llegaba antes de que el enemigo apuntara. Ahora LIKY y YONOSE
  saltan a `pre_drop` (2 compases antes) y el primer gran golpe vuelve a caer en el drop (§6).
- **Director** (`director.json`): `battle_special` → `liky_fight.battle`; `emotional` → `yonose_todo.ambient` (en loop; antes era la
  original y la usaban las cines O4). `battle` y `boss` siguen en procedural (ponerles un remix haría sonar canciones no
  desbloqueadas y cargaría un archivo en cada batalla con plan propio).
- `tests/originalsReserved.test.ts` falla si `battles.json` o `director.json` nombran una original (id pelado o `.original`) en
  cualquier campo de pista (`track`, `fallback`, `song`, `tracks`, `file`).

### 5.1 Desbloqueos: las originales se movieron a los Momentos

- **Ninguna batalla desbloquea una original.** Los planes solo desbloquean su remix (`<canción>.battle`) o una variación
  (`hemkade.ambient`, `te_odio.ambient`, `circus_malus.stinger`).
- Cada original la desbloquea **su Momento musical** la primera vez que se completa (`src/momentos`, `def.unlocks`; doc 29).
- **Nada se revoca:** `unlockSong` solo agrega. Quien ya tiene una original desbloqueada (por la versión anterior de estos planes)
  la conserva; no hay migración ni parche que la quite.
- Siguen desbloqueando originales fuera de las batallas (no es código de batalla; avisado): `cine/sound.ts` (H35 `when_i_lose`,
  H38 `liky_fight`, H41 `circus_malus`), `cine/scenes/margen.ts`, `cine/scenes/correccion.ts`, `cine/scenes/almirante.ts` y
  `app/oleada4Flow.ts` (H64 `yonose_todo`, que es el propio Momento).

### 5.2 Decisión: `ruptura_nacar` (H39) se queda con el remix de YONOSE (MENORES, 2026-10-10)

El doc 18 §5.4 sugería WHEN I LOSE para las batallas de Nácar. Se revisó con los criterios de los docs 18, 23 y 24 y **se
queda `yonose_todo.battle`** (sin cambios en `battles.json`, salvo su `$doc`):

- **Carácter.** WHEN I LOSE es «solemne y antiguo» (doc 18 §4.4), el tema de los primordiales (doc 18 §5.2 H40). La pelea
  de H39 es contra una capitana vanidosa de cristal, no contra un primordial. El remix de YONOSE («decidido, energía
  media») le queda mejor, y el preset `fiesta` le da el baile de la tripulación que `solemne` no tiene.
- **Batallas vecinas.** Con WHEN I LOSE, H39 y H40 sonarían igual una tras otra, y serían 4 de las 6 batallas de la
  Oleada 1 (H34, H35, H39 y H40). Con YONOSE, el orden es WIL · WIL · LIKY · **YONOSE** · WIL · CIRCUS: ninguna pista se
  repite pegada salvo el par H34/H35, que es de la misma biblioteca.
- **El Momento de H35.** WHEN I LOSE (la original) es el Momento de H35. Volver a oír WIL en H39 y H40 gastaría su tema
  justo después de su Momento. H40, el primordial, sí lo conserva: ahí el tema tiene sentido.
- **Originales.** En batalla solo suenan remixes: `yonose_todo.battle` es un remix y la original de YONOSE sigue
  reservada para su Momento (H64→H65). `tests/originalsReserved.test.ts` lo cubre.
- **Fonoteca.** H39 es la única batalla que desbloquea `yonose_todo.battle`. Cambiarla dejaría ese remix sin fuente.
- Para cambiarla algún día basta con `"extends": "solemne"` y `"track": "when_i_lose.battle"` en el plan.

## 6. Medido (Chrome headless, GPU real, audio real, 48 kHz)

Montaje: Vite propio (5215, sin HMR), Chrome headless con ANGLE Metal (M4), `--autoplay-policy=no-user-gesture-required`,
perfil propio, puppeteer-core en el scratch. La pelea `?scene=battle&music=liky_fight`, jugada por un bot (puntería de la
IA difícil; en turnos pares suelta en el centro de una ventana de SINCRO). `outputLatency` 16 ms + `baseLatency` 5,3 ms.
Trazas: `window.__battleMusic.trace` (entregas del cursor, eventos propios del motor, planes de cada disparo enemigo,
error de cada impacto, saltos, SINCRO). Capturas fuera del repo.

| Qué | 60 fps (CPU normal) | CPU ×4 (cuadro p95 21 ms) | CPU ×12 (≈ 17 fps, p95 133 ms) |
|---|---|---|---|
| Golpe del motor (`hit`) frente a cuando se oye | se entrega 14 ms **antes** (mediana; p90 −6, máx +9): un cuadro de anticipación, a propósito | 12 ms antes (máx +81) | — |
| Nuestro cursor frente al evento del motor | **0,0 ms** (p10 −0,1 · p90 0,0 · n = 134–242) | −0,8 ms (p90 +6) | ±1 cuadro |
| Eventos de beat saltados (> 120 ms tarde) | 0 | 0 | 39 de 458, sin duplicados |
| **Primer gran movimiento enemigo** frente al drop (71,450) | **+2 / +4 / +9 ms** (3 corridas) | +5 ms | +29 ms |
| Primer impacto de cada disparo sincronizado | **9/9 entre +1 y +9 ms** (mediana 6) | −3…+28 (mediana 4) | −5…+146 (≈ 1 cuadro) |
| Demora agregada antes de soltar | 0–1,17 s (tope 1 compás = 1,83 s) | igual | igual |
| Estiramiento del vuelo | ×0,78–1,2 | — | — |
| Pedir un salto → oírlo | primer turno enemigo 2,05–2,1 s (decodificar + compás) · remate/victoria 0,85–1,3 s | — | 2,1 s |
| Canción audible tras el `cue` inicial | 0,45–0,6 s | — | 2,4 s (antes del arreglo: entraba en bucle de re-cues; ver abajo) |

- **Cuadros** (screencast con marca de tiempo): el cuadro a +4 ms del primer impacto muestra la esquirla tocando el
  casco; los siguientes, ¡CRASH! con el horizonte iluminado y la salpicadura. La pantalla enemiga telegrafía en los
  beats mientras espera.
- **Sin audio** (sin gesto, `AudioContext` nulo): reloj interno; la batalla llega al final; primeros impactos −2…+7 ms
  del pulso interno; ventanas de SINCRO en el mismo horario (3 de 4 aciertos del bot, igual que con audio). Con los
  mismos inputs, las corridas con audio, con CPU ×4 y sin audio terminaron **igual** (mismo ganador y turno): la música
  no toca el sim.
- **SINCRO** (bot «en el pulso»): juzgado entre −28 y −10 ms (el bot suelta justo antes del golpe), 3/4–5/6 aciertos.
- **H35** (`?scene=battle&music=ruptura_bibliotecario`): RUIDO 2 → −7 dB + 1,1 kHz; furioso → 520 Hz; al ganar, el filtro
  sale del grafo, el duck se suelta y el `climax` se oye 0,85 s después de pedirlo, en el compás (178,298 s).
- **Bug encontrado y arreglado con CPU ×12:** si decodificar tardaba más que la espera (2,6 s), el reloj pasaba a
  interno y el re-cue cancelaba la carga en curso cada 8 s. Ahora el reloj sigue esperando ese deck (hasta 20 s) y se
  engancha cuando suena; nunca se pide otra vez encima de una carga.
- Ajustes › Audio con la fila nueva: sin desbordes ni textos encimados (`__overflow()` vacío) a 1600×900.

### 6.1 Con los remixes (2026-10-10, BATTLE-REMIX)

Vite propio en 5291 (sin HMR, `server.ws: false`, config temporal en el scratch), Chrome headless ANGLE Metal,
`--autoplay-policy=no-user-gesture-required`, perfil propio, el mismo bot (puntería IA σ 1,2°, turnos pares sueltan en el centro de
una ventana de SINCRO).

| Qué | `liky_fight` (dev, SINCRO) | `cielo_almirante` (cielo) | `ruptura_leviatan` (jefe por fases) | `ruptura_bibliotecario` |
|---|---|---|---|---|
| Reloj | audio | audio | interno 2 turnos (el clic del arnés llegó después del arranque) → audio | audio |
| Primer gran movimiento enemigo frente al drop (21,985) | **−1 / +5 / +2 ms** (3 corridas; antes del arreglo `pre_drop`: caía 1,4 s después, en un bombo) | — | — | — |
| Impactos sincronizados (primer impacto de cada disparo) | mediana **+2 ms** (−7…+11) | mediana **+1 ms** (−5…+9) | mediana **+5 ms** (0…+10) | mediana **0 ms** (−1…+12) |
| Nuestro cursor frente al `hit` del motor | mediana 0,0 ms (p10 −0,2 · p90 0) | −0,1 ms | −0,4 ms | −0,1 ms |
| Saltos | `primer_golpe` → `pre_drop` | turno 3 → `breakdown` | `fase:cielo` → `climax` oído **0,36 s** después · `fase:grieta` → `breakdown` **0,88 s** | — |
| SINCRO | sueltas del bot en el pulso: **−5…−8 ms** (todas dentro de ±170) | — | — | — |
| RUIDO (forzado con `nzImpact`) | — | — | — | nivel 1 → paso-bajo 2644 Hz; nivel 2 → 1104 Hz + duck −7 dB |
| Victoria (`onFinish(true)`) | `outro` oído 1,4–1,6 s después (compás siguiente) | — | — | CIRCUS (`ruptura_corrector`): `outro` a los 3,3 s (compás de 2,4 s) |

## 7. Limitaciones y pendientes

- **Saltos = un deck nuevo.** Saltar de sección decodifica la canción otra vez (≈ 0,2–0,4 s) y entra en el siguiente
  compás después de eso: medido 1,2–2,1 s entre pedirlo y oírlo. Mientras dos decks se cruzan hay ~150 MB de audio
  decodificado por un instante. Mejora del motor sugerida: `player.jumpTo(file, quantize)` que reutilice el buffer.
- **Paso-bajo por fuera del motor.** `musicFilter.ts` reconecta `musicDuck → master` a través de un filtro y deja el
  grafo como estaba al abrirse. Sugerido: `audio.musicLowpass(hz)` en `core/audio.ts`.
- **Los saltos de estado se evalúan al empezar turnos**, no a mitad de animación (a propósito).
- **Golpes sintetizados** para las canciones sin `hits` (todas menos LIKY): suficientes para caer en compás; una
  coreografía fina pediría que MUSIC exporte `hits` de las demás.
- **Stingers nuevos** (`swap`, `sincro`, `correccion_rota`…) no existen todavía: `audioApi.stinger` los ignora sin error.
- **Versiones / composiciones nuevas** (`boss.umbral`) usan `fallback` hasta que lleguen.
- Los **Momentos musicales** que ocurren dentro de una batalla (H44, H55, H57, H62) tocan la original por encima: al volver,
  `watchSong` re-pide el remix donde iba. La integración Momento ↔ plan (pausar el plan durante el Momento) es de MOMENTOS.
- Con **ESPACIO (acelerar)** no se sincroniza nada (no se pelea con quien quiere ir rápido).
- La insignia «Coreografía» y la UI de H51 son de la Oleada 3 (`music.sincroAccuracy` está listo).
- SINCRO implementa un combo (SOBRECARGA); los demás de la biblia §9.3 son datos para `SINCRO_COMBOS`.

## 8. Pruebas

`tests/battleMusic.test.ts` (23, actualizados a los remixes) + `tests/originalsReserved.test.ts` (4: ninguna original en
`battles.json`/`director.json`, cada plan suena una variación que existe, los 6 remixes con archivo y mapa, vocabulario de secciones,
loop en compases enteros, golpes fuertes y drops): planes y `extends`; cada sección/marcador nombrado existe en su canción (o tiene
respaldo); nada arranca en loop desde el fin del loop; límites (SINCRO ≥ 150 ms); resolución (id > objetivo > tipo,
H38 con y sin Canelo, ids desconocidos); reglas (primer turno antes del drop, casco, `unlessSection`, `once`, señales);
reacciones; golpes de LIKY (382) y sintetizados (WIL, te ODIO + extraHits); cursor (sin duplicados con loops, salto de
2 s, `reset`); `chooseSlot` (demora ≤ tope, vuelo × ritmo = golpe exacto, el primer movimiento va al drop, andanada
con separación o lote); ventana de SINCRO (bordes, input lag, ajuste ±120 ms); sim con y sin SINCRO (determinista,
SOBRECARGA ≤ 3 saltos, sin combo no cambia nada, inputs registrados) y **paridad con el estimado**.
