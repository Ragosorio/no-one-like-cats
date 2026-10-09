# Parte II · 01 — Auditoría técnica y de juego (línea base)

Fecha: 2026-10-09. Base auditada: commit `d28edf9` (`main`). Rutas relativas a `game/` salvo que se diga otra cosa.
Método: lectura de código + conteos con `node` sobre `src/data/*.json` + un script vitest de solo lectura que carga
las partidas de `test-saves/` y llama a `state/sys/shop.ts` (no toca ninguna partida real). `npm test`: **66/66 OK**.

Leyenda:
- **[H]** HECHO VERIFICADO (con `archivo:línea`).
- **[HIP]** HIPÓTESIS (razonable, no medida).
- **[P]** PROBLEMA (bug, deuda, dato desactualizado o riesgo concreto).

> **Ojo, trabajo en curso de otro agente (no auditado como línea base):** durante esta auditoría aparecieron
> cambios sin commit: `package.json` agrega `three@^0.186.1` + `@types/three`, `src/art/livingCat.ts` se reescribió
> (−564 líneas) y existe `src/art/puppetCore.ts` (sin seguimiento en git). Todo lo de abajo sobre `livingCat` describe
> la versión de `HEAD` (`git show HEAD:./src/art/livingCat.ts`).

---

## 0. Números clave

| Cosa | Cantidad | Fuente |
|---|---|---|
| Líneas TS en `src/` | 103 802 | `find src -name '*.ts' \| xargs wc -l` |
| Especies de gato (Catdex) | **86** | `content.json › cats` |
| Elementos | **13** (fire, water, nature, earth, storm, magic, cosmic, void, ice, sound, shadow, time, light) | `content.json › elements` |
| Rarezas | **7** (common 20 · rare 22 · epic 17 · legendary 16 · mythic 3 · heroic 4 · divine 4) | `balance.json › rarities.order` + conteo |
| Gatos multi-elemento | 33 | conteo `cats[].elements.length>1` |
| Primordiales / secretos | 13 / 6 | `cats[].primordial`, `cats[].secret` |
| Misiones | **127** (H 30 · C 29 · K 39 · E 26 · P 3), 56 tipos de meta | `content.json › missions` (`meta.counts` dice 125: **[P]** desactualizado) |
| Zonas × etapas | 6 × 9 = 54 | `balance.json › combat.stages_per_zone`, `content.json › enemies` |
| Jefes | 12 entradas (6 de zona + 6 de historia/evento/secreto) | `content.json › bosses` |
| Barcos del jugador | 6 (`balsa, gorrion, merodeador, bastion, bajel, arca_celestial`) | `content.json › ships` |
| Expansiones de isla | 12 | `content.json › expansions` |
| Tiers de hábitat | 10 | `balance.json › habitats.tiers` |
| Biomas de hábitat | 13 (uno por elemento) | `src/island/habitats/biomes.ts:1548` |
| Reacciones elementales | 16 | `content.json › reactions` |
| Beats de historia en datos | 26 (b00–b25) + finale H29/H30 en código | `content.json › story.beats`, `state/sys/finale.ts` |
| Hitos de Reino | 50 (KL máx 50, nivel de gato máx 50) | `balance.json › kingdom.level_cap(_cats)` |
| Tests vitest | 10 archivos, 66 tests | `npm test` |

---

## 1. Arquitectura

### 1.1 Capas y arranque
- **[H]** Flujo de datos: `content.json`/`balance.json` → `data/content.ts` + `state/econ.ts` → `state/game.ts` (`G`) ←
  `state/sys/*` (reglas, se registran por efecto secundario desde `state/index.ts`) → `app/flow.ts` → `scenes/*`, `panels/*`.
  Coincide con `docs/guias/arquitectura.md` (sigue vigente en lo esencial).
- **[H]** Reloj de economía: `src/main.ts:120` (`Ticker.shared.add` → `G.tick(min(1000, deltaMS)*speed)` si hay gatos).
- **[H]** Autoguardado cada 10 s en `G.tick` (`src/state/game.ts:490-492`); guardado de emergencia en `beforeunload`/`visibilitychange`.
- **[H]** Caja lógica 1920×1080 escalada (`core/App.ts`), `resolution = min(devicePixelRatio, 2)`, `antialias: true`,
  `preference: 'webgl'` (`src/core/App.ts:35-38`). `game.view` = pantalla real en coordenadas lógicas.

### 1.2 Escenas (`src/scenes/`, líneas)
| Escena | Líneas | Rol |
|---|---|---|
| `BattleScene` | 2488 | vista de batalla (anima eventos de `battle/sim.ts`) |
| `IslandScene` | 1412 | isla isométrica, HUD, gatos |
| `PrologueScene` | 1238 | prólogo b00 |
| `MapScene` | 914 | DIARIO DEL MAR (campaña) |
| `PodioScene` | 817 | duelos 1v1 |
| `ResultsScene` | 716 | victoria/derrota |
| `CasinoScene` | 702 | casino |
| `TitleScene` | 176 | portada |
| Labs: `ShipArtLab` 473, `FxLab` 256, `BattleSandbox` 214, `DevLab` 173, `IslandSandbox` 110, `CatLiveLab` 90, `ArtLab` 60 | — | herramientas de dev, **accesibles en producción** vía `?scene=` (doc: "¿Solo en dev? no") |

### 1.3 Estado (`GameState`, `src/state/game.ts:102-168`)
| Grupo | Campos |
|---|---|
| Meta | `v, createdAt, savedAt, playMs, patches[], updatesSeen[]` |
| Monedas planas | `gold, food, gems, purr (min), prisma, scrap, blueprint` |
| Monedas por clave | `crystals: Record<elemento, n>`, `orbs: Record<especie, n>` |
| Progreso | `kl, klXp, momentum, counters{}, flags{}, beatsSeen[], explained[], stats{}` |
| Gatos | `cats: OwnedCat[]` (`uid, species, name, level, bites 0..3, stars, habitat, trait, mutation, bornAtMs, moments[], kos?, holo?` — `game.ts:44-60`), `nextId`, `catdex: Record<especie,'rumor'\|'registered'>`, `elements[]`, `workers{uid→rol}` |
| Isla | `habitats: Habitat[]` (`id, element, tier, region, plot(legado), gx, gy, buffer, cats[], busy` — `game.ts:62-77`), `farms[]`, `expansions{bought[],cleared[],secrets[]}` (números 1..12), `decor?`, `timers[]` |
| Resonancia | `resonance{jobs[], pity, total, tutorialDone, slots}`, `resQueue[]` |
| Barco/combate | `ship{owned[], active, mk{hull,weapon,shield,engine,core}, crew{shipId→uid[]}, weapons?}`, `campaign{cleared[], bossesDefeated, analysis, stageWins}`, `gear?`, `errands?`, `layouts?` |
| Otros modos | `missions{active,done,progress,pinned,seenLines}`, `expeditions[]`, `casino?` (tickets, chips, pity, eterno…), `accessories?`, `podio` (por **uid** de gato), `player?{name,gender}` |
| Cajón de sastre | `ext?: Record<string, unknown>` — aquí viven `ext.shop` (goldOrbs), `ext.collection` (historial de cruces, sets), `ext.bank`, `ext.habFoot`, `ext.mareaUntil`… |

- **[P]** Mucho estado relevante vive en `ext` sin tipo y en `counters`/`flags` con claves string (p. ej. los
  Fragmentos del Vacío son el contador `void_fragments`, `state/sys/storyBattles.ts:273-275`; las grietas son flags `grieta:<el>`).
  Renombrar una clave = perder progreso en silencio.

### 1.4 Guardado, migración, parches, baúl
| Pieza | Hecho |
|---|---|
| Sobre de guardado | `{version, savedAt, build, state}` en `localStorage` `nolc-save-v1`; copia rotativa `nolc-save-prev`; `nolc-save-bak-<v>` antes de migrar (`core/save.ts`, 148 líneas) |
| Versión | **[H]** `SAVE_VERSION = 3` (`src/state/migrate.ts:18`). v2 = ledger de parches/novedades; v3 = hábitats `{region,plot}`→`{gx,gy}` con tabla literal `LEGACY_PLOTS` (`migrate.ts:46-56`) |
| `normalize()` | **[H]** rellena contra `defaultState()`, repara NaN/negativos, deduplica uids, descarta gatos sin `species` string (`migrate.ts:88-131`). **[P]** No descarta especies *desconocidas*: `catDef()` lanza `Error('unknown cat')` (`src/data/content.ts:204-208`) → un id de especie renombrado o borrado rompe la carga/recálculo. |
| Parches | **[H]** 12 `registerPatch` (todos `2026-10-*`: mamparos, duelo balsa, podio×2, bastión, hábitats×3, casino×2, fragmentos de jefes, grietas) |
| Anti-sobrescritura | **[H]** `G.save()` no escribe si la partida en disco tiene >120 s más de `playMs` (`game.ts:294-302`), ni con `newerSave/saveLocked/otherWindow`. Web Lock de escritor único (`ui/saveGuard.ts`). |
| Baúl (`core/vault.ts`, 315 l.) | **[H]** IndexedDB: snapshot cada 10 min de juego + antes de pegar/restaurar/borrar (15 recientes + 1/día × 30 días); carpeta del jugador con `.nocat` (File System Access); `storage.persist()`. |
| Tamaño de partida | **[H]** test-saves 5–12 KB (`post-story.json` 12 009 B). Sin riesgo de cuota hoy. |

### 1.5 Datos (`src/data/`)
| Archivo | Líneas | Contenido |
|---|---|---|
| `content.json` | 19 542 | 33 claves: `elements(13) affinity materials(7) statuses(18) reactions(16) roles(8) workers traits(14) mutations(11) catdexSets(19) tintDecals(13) cats(86) resonanceRules resonanceRecipes(73) secretRecipes(6) ships(6) modules{families 5, utility 9, relics 8, artifacts 6} volley koSequence enemyArchetypes(21) enemies(6 zonas) elites(6) bosses(12) missions(127) events expansions(12) automation(16) kingdomMilestones(50) story` |
| `balance.json` | 2 314 | todos los números (`rarities, cats, resonance, orbs, habitats, farms, expansions(8!), ship, combat, kingdom, ronroneo, momentum, gems, gambit, expeditions, …`) |
| `catRigs.json` | 1 línea, 24.5 KB | 87 rigs MAI (incluye stand-ins) |
| `podio.json` | 77 | ligas, niveles, premios de campeón (heroicos 8–11, divinos 12–15) |
| `content.ts` | 224 | accesos tipados (`CATS`, `CAT_BY_ID`, `catDef`, `EXPANSIONS`, `ZONES`, `stageDef`…) |
| `glossary.ts` 790, `updates.ts` 222, `chatter.ts` 130, `elementsMeta.ts` 40, `art-parte2.json` 34 | | |

### 1.6 Cómo se define una especie (`content.json › cats[]`)
```
id ("c_canelo"; prefijo = rareza: c_/r_/e_/l_/m_/h_/d_/s_)  name  epithet
art{slug, tint, aura[3]}   elements[1..3]   rarity   primordial   secret
role  worker(banker|farmer|builder|voyager|null)  trait
battleForm{name,cry}
economy{goldBasePerS,powerBase,foodMult → "balance:rarities.*"}
combat{hpBase, recarga, shot{archetype,element,dmg,radius,projectiles,bounces,pierce,status…}, ultimate{…}, limitation, passive, star3, star5}
obtain{source: start|resonance|boss:N|heroic:N|secret|grieta:<el>|podio:<liga>, how}
hint  lore  balanceName
```
- **[H]** Fuentes: resonance 57 · start 3 · secret 6 · grieta 6 · podio 8 · boss 4 · heroic 2.
- **[H]** Por elemento (cuenta multi-elemento): fire 16, cosmic 15, storm 14, magic 13, water 12, earth 12, nature 11, sound 5, shadow 5, light 5, void 5, ice 4, time 4.
- **[H]** Desbloqueo de elementos: fire/water/nature al inicio; earth `boss:1`; storm `boss:2`; magic `kl:24` (en la práctica, historia H14); cosmic `boss:5`; los 6 de Parte 2 por `grieta:<el>`.
- **[P]** Datos duplicados que ya divergen: `balance.json › catdex` (lista paralela de especies) y `balance.json › expansions` (solo 8; la #8 dice `kl 36`, `content.json` dice `kl 33` — el código usa content: `state/sys/island.ts:421-422`). `meta.counts.missions = 125` vs 127 reales.

---

## 2. Economía

### 2.1 Monedas y recursos
| Recurso (clave) | Ámbito | Fuentes principales | Sumideros principales |
|---|---|---|---|
| Doblones `gold` | global | hábitats (`habitatRate`, búfer de 30–180 min por tier), batallas (`battleGold` = máx(curva por etapa, **segundos de ingreso**)), misiones (`goldPerSec × gold_seconds_of_income`, `missions.ts:249`), Podio (`gold_income_seconds:30`), Banco offline, venta de hábitats | hábitats nuevos (`newHabitatCost`), mejoras de tier, expansiones (400 → 100 B), módulos de barco (`moduleCost`), tienda (gatos comunes, **orbes**, deco), casino |
| Pescaditos `food` | global | granjas (8 cultivos), muelle de pesca, Podio | alimentar (4 ÑAM/nivel, `feedCost = 6·1.27^(lv−1)·food_mult`) |
| Ojos de Gato `gems` | global | especie nueva (1–6 por rareza), jefes, hitos de Reino, misiones, secretos, grietas (2–3), Podio, casino/gacha | constructor 50, ranura de resonancia 40, reloj de arena 30, Prisma 2 c/u, orbes 8/5, saltar timers, cosméticos 20–80, apuestas |
| Ronroneo `purr` | global (min) | acciones (`purrMinutes`) | acelerar timers verdes (tope por KL) |
| Orbes de Alma `orbs[especie]` | por especie | duplicados (10/20/35/60/100/120/160), victoria 35%×3, jefe 25, misión 5, expedición 6/h, Podio 3/1/6, rangos K.O. +2, tienda | estrellas: `star_orbs_base[r] × [1,2,3,5,8][★−1]` (`econ.ts:33-35`) |
| Prisma `prisma` | global (comodín 1:1) | sets de Catdex (10), mina exp. 7 (6/h), gemas | estrellas |
| Chatarra `scrap`, Planos `blueprint` | global | batallas, expediciones | Mk de módulos |
| Cristales `crystals[el]` | por elemento | batallas por zona, expediciones, grietas (+20) | Mk 5–7 de arma/escudo/núcleo; tiers 5–10 de hábitat |
| Boletos `casino.tickets`, Fichas `casino.chips` | casino | `syncChips()` desde victorias/KL/jefes/perfectas (tope `CHIPS.cap` solo para esa vía, `casino.ts:210-218`), premios | juegos del casino, gacha |
| Momentum `momentum` | medidor 1..máx | eventos (`momentumAdd`), decae con vida media | multiplica oro/cosecha/ronroneo |
| XP de Reino `kl/klXp` | — | acciones (`xpFrac`) | — (desbloqueos) |
| Fragmentos del Vacío | contador `void_fragments` | jefes 4–6, H18/H19 | abren la Grieta del Vacío (10), debilitan a Distraxia |
| Podio XP/nivel | por uid de gato | duelos | — |

- **[H]** Multiplicador global de oro: `(1 + (0.02 + catdexBonus)·especies) × (1 + oroExpansiones) × (1 + 0.5·(momentum−1))`
  (`econ.ts:65-67`) × `mareaMult()` (×1000 durante la Marea Final, 3 min, `state/sys/island.ts:114-116`).
- **[H]** Casi todo ingreso y precio de la tienda se expresa en "segundos/minutos de ingreso" (`shop.ts:5-10`): la economía es **relativa a `goldPerSec`**.

### 2.2 Precio de los orbes con oro — veredicto

**Fórmula exacta [H]** (`src/state/sys/shop.ts`):
```ts
// :41-44
ORB_PACK = 5; ORB_PACK_GEMS = 8; ORB_GOLD_MIN = 5; ORB_GOLD_GROWTH = 1.15;
// :80-84  ingreso base SIN momentum (pero CON catdex, expansiones y Marea), piso 60/60 = 1 oro/s
incomePerSec() = max(1, G.goldPerSec / (1 + 0.5·(momentum−1)))
// :186-192  k = orbes YA comprados con oro de ESA especie (ext.shop.goldOrbs[especie], nunca baja)
orbGoldPrice(sp) = nicePrice(max(60, Σ_{i=0..4} incomePerSec·60·5 · 1.15^(k+i)))
```
Forma cerrada: **precio del paquete ≈ 2 022.7 × ingreso/s × 1.15^k** ≈ **33.7 min de ingreso** el primero, y
**×2.01 por cada paquete** posterior de la misma especie (1.15⁵).

- **¿Escala con la producción?** Sí, **lineal** con el ingreso/s (no con el oro en cartera).
- **¿Escala con compras pasadas?** Sí, **exponencial por especie** (`goldOrbs[especie]`, `shop.ts:207`) y **nunca se reinicia**.
- **Vía gemas** (`buyOrbsGems`, `shop.ts:213-222`): 8 gemas / 5 orbes, pero comparte tope con Prisma:
  `10 × jefesDerrotados − compradas` (`cats.ts:168-171`) → con 6 jefes, **60 orbes de por vida** entre todas las especies.

**Ejemplos numéricos [H]** (script vitest de solo lectura sobre `test-saves/`, especie `c_canelo`):
| Partida | KL | Oro en cartera | ingreso/s (sin momentum) | Paquete con k=0 | k=5 | k=10 | k=20 | k=40 | k=80 |
|---|---|---|---|---|---|---|---|---|---|
| Temprano `post-boss1` | 6 | 7 364 | 6 | 12 000 | 23 000 | 47 000 | 190 000 | 3.1 M | 830 M |
| Medio `late-game` | 36 | 50 M | 584 | 1.2 M | 2.4 M | 4.8 M | 19 M | 320 M | 85 B |
| Tardío `post-story` | 38 | 50 B | 1 405 | 2.8 M | 5.7 M | 11 M | 47 M | 760 M | 200 B |
| Jugador real (estimado) **[HIP]** | 38 | ~1.9 B | 1 M (rango sim. post-historia 0.13–25 M) | **≈ 2.0 B** | 4.1 B | 8.2 B | 33 B | 540 B | 145 T |

- **[P]** Las test-saves tienen solo 3 hábitats: su ingreso (584–1 405/s) está muy por debajo del simulado al final de
  la historia (~9.2 K/s → 25 M/s con 12 expansiones, `docs/ECONOMIA-POSTHISTORIA.md`). No sirven para calibrar precios de post-historia.
- Costo de una estrella entera con oro (desde k=0): común ★2→3 (20 orbes, 4 paquetes) ≈ **8.5 h de ingreso**;
  legendario ★1→2 (40 orbes, 8 paquetes) ≈ **6.2 días de ingreso**; legendario ★5→6 (320 orbes) ≈ 10²² × ingreso → **imposible**.

**¿Por qué un jugador con ~1.9 B siente los orbes caros? [HIP fundada en [H]]**
1. El precio no mira la cartera: mira el ingreso. Si su isla produce ~1 M/s, 1.9 B son ~32 min de ingreso y **el primer
   paquete cuesta ~34 min**: la cartera entera por 5 orbes. Su "número grande" nunca compra más orbes, porque todas las
   fuentes de oro (misiones, batallas, Podio) también pagan en segundos de ingreso.
2. El segundo paquete cuesta el doble, el quinto ×16; el contador por especie no se reinicia nunca. Después de 3–4
   paquetes por especie, el oro deja de ser vía.
3. Lo que necesita (estrellas altas de legendarios/míticos: 160–480 orbes por paso) queda órdenes de magnitud fuera.
4. La vía gemas está topada en 60 orbes de por vida. Los orbes reales salen de duplicados de Resonancia y del Podio.
5. Momento puntual: durante la Marea Final (×1000, 3 min) todos los precios indexados al ingreso suben ×1000. **[P]** menor.

Conclusión: es **intencional** según el comentario ("comodidad cara, no una ruta", `shop.ts:22-24`), pero con ingreso alto
se lee como "precio roto". Palancas para Parte II: indexar a la cartera o a un tope absoluto, reiniciar `k` por día o por
estrella, o subir los orbes por fuentes de juego (duplicados/Podio) en vez de la tienda.

---

## 3. Casino — modo ETERNO

- **[H]** Sesión de 40 s: 0–20 s se puede ENFRIAR (sin sorteo); 20–40 s todas las rondas ganan y el botín se duplica cada 4 s;
  a los 40 s, sorteo 50/50 con `crypto.getRandomValues` (`src/state/sys/casino/eterno.ts:25-44`, `:106-118`).
- **[H] Lo que puede quedar en 0** (y nada más): `AT_RISK = ['gold','gems','food','tickets','chips']` (`eterno.ts:47`);
  derrota = `G.s.gold = G.s.gems = G.s.food = casino.tickets = casino.chips = 0` (`eterno.ts:251-262`).
  Victoria = esos cinco ×2 + botín + 1 gato legendario 40% / legendario HOLO 35% / mítico 25% (`:232-250`, `:203-209`).
- **[H] No se pierden gatos:** ninguna rama de `resolveEterno` toca `G.s.cats`; en todo `src/` no hay `cats.splice`/
  `cats.pop`/`cats.shift` sobre `G.s.cats`, y la única reasignación es el filtro de `normalize()` para gatos sin especie
  (`migrate.ts:115`). Tampoco se tocan orbes, Prisma, cristales, chatarra, planos, búfer de hábitats ni el Banco.
  Test: `tests/casinoEterno.test.ts:60-62` (todo lo demás igual tras la derrota).
- **[H]** Idempotencia: la sesión se marca resuelta antes de aplicar; recarga después del bloqueo = se sortea al reabrir (`:191-200`, `:222-231`).
- **[P]** La victoria duplica **gemas**, que el diseño declara "solo se ganan jugando"; es una vía de gemas sin tope.
- **[P][HIP]** No hay `snapshot()` del baúl antes de la resolución; el baúl guarda copias cada 10 min, así que una derrota
  probablemente se puede deshacer restaurando un respaldo (exploit, o red de seguridad según se mire).

---

## 4. Santuario / Resonancia

| Aspecto | Hecho |
|---|---|
| Cruce | **[H]** `oddsFor(a,b)` (`state/sys/resonance.ts:31`): U = unión de elementos de los padres (descubiertos). Pozo: comunes mono-elemento ⊂ U; raros con elementos ⊂ U; épicos ⊂ U con **ambos padres Nv15+**; legendario primordial del elemento **compartido** con ambos Nv20+. Míticos/heroicos/divinos nunca. |
| Pesos | **[H]** `common 55 · rare 30 · epic 11 (+2/rango de padres +1/fallo de pity, tope 15) · legendary 3.5 (+0.5/rango) · secret 0.5`; cubos vacíos se redistribuyen (`balance.json › resonance`). |
| Tiempo | **[H]** común 3 min · raro 10 · épico 30 · legendario 45 (`rarities.resonance_time_s`). |
| Ranuras | **[H]** 1 inicial + exp. 3 + exp. 6 + 1 con gemas (40) → máx. 4 (`resonance.ts:231-240`); cola de 3 parejas desde KL18. |
| Mutaciones | **[H]** desde KL20, 8%, ×2 si comparten hábitat (`MUTATION_RULES`, `resonance.ts:293`); duplicado con mutación → elegir orbes o transferir. |
| "Recetas" | **[H]** NO hay recetas por especie en código: `content.json › resonanceRecipes` (73) solo se usa para contar en `state/ext/campaign.ts:205`; `secretRecipes` (6) **no se lee** en ningún `.ts`. Los secretos están en un `switch` (`resonance.ts:180-200`). **[P]** dos fuentes de verdad. |
| Secretos | **[H]** 6: `s_maneki` (2 banqueros Nv15+ o 10 callejeros), `s_caos` (Tormenta+Cósmico Nv25+), `s_sonata` (Magia+Cósmico+Tormenta Nv30+ u Orquesta Muda), `s_lumen` (Fuego+Agua+Naturaleza ★3+ o 40 especies), `s_eclipse` (Solar+Cósmico, uno Nv20+, o ganar con Solar+Lunita), `s_noctis` (historia). |
| Pistas | **[H]** sentar una pareja con la "forma" de un secreto lo marca `rumor` en Catdex + contador `secret_rumors` (`noteSecretClues`, `resonance.ts:165`); misión E18 lee eso. |
| Historial | **[H]** `HISTORY_CAP = 40` parejas (`resonance.ts:141`), una fila por pareja con contador ×N, **favoritos ★ nunca se recortan** (`:144-152`); se guarda por **uid** en `ext.collection.history`. LLENAR rellena ranuras libres con parejas sin gato repetido (`panels/Sanctuary.ts:955-959`, `:1733`). |

Fricciones **[P]/[HIP]**:
- Máx. 4 ranuras y una pareja por ranura: con 86 especies y 13 elementos, completar la Catdex por Resonancia es un
  embudo; no hay "REVELAR TODO" (no aparece en `Sanctuary.ts`).
- El cubo secreto pesa 0.5 (≈0.5 % por cruce) y además requiere condición: largo de sacar sin las rutas B.
- Favoritos ilimitados pueden empujar fuera todo el historial normal (cap 40 − favoritos).
- El historial es por uid de gato, no por especie: si el jugador quiere "la misma pareja de especies" con otros
  individuos, no aparece.
- `Sanctuary.ts` (1745 líneas) concentra UI + reglas de presentación: caro de tocar.

---

## 5. Catdex

- **[H] Modelo:** `G.s.catdex: Record<especie, 'rumor'|'registered'>`; estado derivado `dexStatus()` = `registered | rumor |
  silhouette (elementos descubiertos) | unknown` (`state/sys/cats.ts:186-192`). Sets: `content.json › catdexSets` (19),
  reclamados en `ext.collection.setsClaimed` (+10 Prisma por set). Cada especie registrada da +2% oro global (+1% extra con exp. 7 y 12).
- **[H] Lo que muestra** (`panels/Catdex.ts`, 930 l.): pestañas CATS / SETS / GRIMORIO; cabecera con 13 elementos en
  2 filas; carta (`collection/CatCard.ts`) con estrellas/nivel/mutación/holo; ficha: ATAQUE (shot), ULTIMATE,
  LIMITACIÓN, PASIVA, ★3, ★5, CÓMO SE OBTIENE, LORE, POSIBLES PADRES y condiciones, "SE DICE QUE…" (pista);
  tus instancias (‹ ›), ubicación y botones VER GATO / HÁBITAT / DARLE CASA / ALTAR (`Catdex.ts:740-850`).
- **[P]** Grimorio: el contador dice `x/12` (`Catdex.ts:187` y `:557`) pero hay **16** reacciones. Comentario de cabecera
  dice "x/54" (`Catdex.ts:2`).
- **[P]** Arte en Catdex: abrirlo en late-game costaba 5.5 s de hilo bloqueado; ahora usa streaming + `rasterCache` (ESTADO.md).

---

## 6. Barcos y batalla

| Pieza | Hecho |
|---|---|
| Modelo de barco | **[H]** rejilla de celdas de 40 px (`battle/ship.ts:57`), materiales `wood 60 · canvas 30 · iron 140 · stone 120 · crystal 90 · bone 110 · void 200` HP (`ship.ts:55`); integridad estructural: lo desconectado de la quilla se hunde. |
| Módulos | **[H]** `core, cannon, catroom, mast, shield, engine, powder, arcane` (`ship.ts:9-17`). Familias de mejora: `hull, weapon, shield, engine, core` con Mk 1..7; **Mk máx = jefes + 2** (`econ.ts:93`); costo chatarra/planos/cristales por Mk (`balance.json › ship.mk`). 9 utilidades, 8 reliquias (flota), 6 artefactos (por barco). |
| Barcos | **[H]** balsa (3 camarotes/1 cañón), gorrión (4/2), merodeador (5/4), bastión (7/5), bajel (6/3), **arca_celestial (0/0, "Solo cinemática en el Cap. 1")** → **[P]** casco reservado para Parte II. |
| Tripulación | **[H]** `ship.crew[shipId] = uid[]`, un gato por camarote; selector `panels/campaign/CrewSelect.ts` con ventajas (`state/ext/matchup.ts`). Gatos trabajadores no embarcan. |
| Turnos | **[H]** turnos alternos: el gato dispara (balística con viento), luego la **andanada** automática de los cañones apunta a donde pegó el gato (`content.json › volley`). Ultis con medidor. 4 niveles de IA (`aiDifficulty`). |
| Elementos | **[H]** afinidades por par (`content.json › affinity`, p. ej. fire→nature/ice ×1.5, water/time ×0.75), multiplicadores por material, 16 reacciones; los 6 de Parte 2 en `battle/multiverso.ts` (451 l., estado por batalla en `WeakMap`). |
| Determinismo | **[H]** `Battle` usa `new Rng(cfg.seed)` (`battle/sim.ts:451`); IA con `aiSeed` (`battle/autoplay.ts:50`); `Math.random` solo para la semilla por defecto (`autoplay.ts:18`). Estimación en Web Worker con paridad exacta (`workers/estimate.worker.ts`). Regla: toda regla nueva va en `sim.ts` o un módulo que él llame. |
| Jefes | **[H]** zona 1 Capitán Bigotes Rotos · 2 Gárgola Ronroneante · 3 Kraken Voltaico · 4 El Arcanista · 5 Estrella Errante · 6 EL PRIMER MAR; historia/evento: Patito Pirata, Heraldo, Raijin, La Grieta, Barco del Vacío, Orquesta Muda; finale `final_archivo` (Distraxia, `state/sys/finale.ts`). Reglas de 4–6 en `battle/bossLate.ts` (548 l.). |
| Cataclismos | **[H]** `meteors · moon · sun · tide` en zonas 4–6 (`battle/cataclysm.ts:34`), semilla propia derivada; SELLO que se rompe al cruzarlo. |
| Poder enemigo | **[H]** `enemyPower(zona, etapa)` interpola de `stage1_power` a `boss_power/boss_over_last_stage` (zona 1: 22→140 … zona 6: 3 300→7 700); `battleScaling` comprime la ventaja (exponentes 0.5/0.35). |
| Otros | Encargos (7), Simulacro KL40 (`state/sys/simulacro.ts`, 70% del botín cada 3 min), rangos K.O. (`ranks.ts`), Podio 1v1 (premios de campeón en ligas 8–15 = 4 heroicos + 4 divinos, ligas infinitas después; 20 niveles por gato). |

---

## 7. Mapa y navegación

- **[H]** El mapa del mar NO es un mundo navegable: `MapScene` dibuja 6 zonas en posiciones fijas de pantalla
  (`scenes/MapScene.ts:70-75`, dos filas de 3, las de arriba en espejo), 9 etapas por ruta punteada (élite en 5, jefe en 9),
  niebla "???" en zonas futuras, cámara con zoom (`MapScene.ts:249`). Selección por tarjeta con probabilidad honesta.
- **[H]** Las **grietas** no están en el mapa: son batallas de historia lanzadas desde su misión (`MapScene.ts:220`,
  `state/sys/grietas.ts`). Condiciones: ice tras créditos (H22); sound = campeón del Podio; shadow = exp. 9; time = exp. 10;
  light = KL36 + exp. 8; void = exp. 12 o 10 fragmentos (`grietas.ts:36-58`). No se repiten.
- **[H]** La isla (no el mar) es el espacio "navegable": archipiélago generado determinísticamente, rejilla `GRID = 52`
  (islas 1–8) y `GRID_EXT = 64` (islas 9–12) (`island/archipelago.ts:24-32`), proyección iso 2:1 `TW 128 × TH 64`
  (`island/iso.ts:2-3`), cámara arrastre + rueda, zoom 0.42–1.35 (`island/camera.ts:11-12`).
- **[P]** Para Parte II no existe un modelo de "mundo marino" reutilizable (rutas, nodos, posiciones de islas en el mar):
  todo lo de campaña es índice `zona-etapa` (`'2-9'`, `content.ts:209-212`).

---

## 8. Misiones, campaña, eventos y compuertas

| Sistema | Hecho |
|---|---|
| Cadenas | **[H]** historia H01–H30, capitán C, criador K, explorador E, Podio P (3). Disparadores: `mission` 47, `kl` 31, `boss` 15, `stage_cleared` 10, `element` 6, `grieta` 5, otros. Se re-evalúan al cargar (`state/sys/missions.ts`): misiones nuevas cuyo disparador ya se cumple se activan solas. |
| Recompensa de oro | **[H]** ingreso × `gold_seconds_of_income` (mín. 50) (`missions.ts:249`). |
| Compuertas | **[H]** nivel de gato ≤ `min(50, KL+5)` (`econ.ts:29-31`); Mk ≤ jefes+2; expansiones por KL (3, 7, 12, 17, 22, 27, 31, 33, 34, 35, 36, 38) y oro (400 → 100 B); automatizaciones por KL (16, de `collect_all@3` a `fleet_orders@42`); elementos por jefe/grieta; épico/legendario por nivel de padres; Podio tras jefe 1. |
| Microeventos | **[H]** 5 implementados en código (`pez_dorado, gato_callejero, cangrejo_chatarrero, lluvia_pescaditos, burbuja_resonancia`, `state/sys/micro.ts:20`), cada 6–10 min de juego. |
| Eventos flash | **[P]** `content.json › events` define 11 micro, 11 tipos flash, 21 programados, 2 heroicos, 4 especiales, pero **ningún `.ts` lee `events.*`**; la bandera `flash_active` (×1.5 oro en `battleGold`, `campaign.ts:569`) **nunca se activa**. Los "heroicos" existen como batallas de historia (`event_raijin`, etc.). |
| Expansiones | **[H]** comprar → timer `expansion` → `cleared` (`island.ts:418-430`, `:490-498`); 12 secretos de expansión (`state/sys/secrets.ts`, tipos battle/clicks/needs_fire_cat/open). |

---

## 9. Isla

| Aspecto | Hecho |
|---|---|
| Hábitats | **[H]** colocación libre (estilo Dragon City), huella 3×3 → 4×4 (T4) → 5×5 (T7) (`balance.json › habitats.tiers[].footprint`, `island/placement.ts`). 10 tiers: capacidad 2→14, oro ×1→×200, búfer 30→180 min. Un gato solo vive en hábitat de su elemento. Precio `60·3^(min(N,8)−1)·1.6^max(0,N−8)·1.3^M` (`econ.ts:55-60`). Vender: 50% + 25% de mejoras. |
| Biomas | **[H]** 13 (uno por elemento, `island/habitats/biomes.ts:1548`, 1548 l.), siluetas por tier (`island/habitatTiers.ts`, 696 l.), partículas ambientales por hábitat (`island/habitats/ambient.ts`: ember, bubble, leaf, petal, snow, note, spore, rune…). |
| Edificios fijos | **[H]** Santuario, Puerto + balsa, Altar, Mesa, Faro, Banco del Reino, muelle de expediciones, corrales de pesca (2×2 en agua), granjas; arte en código (`island/buildingArt.ts` 1398 l., `landmarks.ts` 583 l.). |
| Decoración | **[H]** ~21 piezas (`state/sys/decor.ts:61`), sets con bonos, colocación libre, venta 50%. Accesorios de gato ~19 (`state/sys/accessories.ts:28`), 4 ranuras (cabeza, ojos, cuello, espalda). |
| Dimensiones | **[H]** cada isla tiene "dimensión" (COZY, VALLE, TINTA, INFERNO, NEÓN, AURORA, GLITCH, PRISMA, ESTELAR…) con cielo, placas, terreno y FX propios (`island/dimensions/*`, ~4.8 K líneas). |
| Profundidad | **[H]** `objects.sortableChildren = true`, `zIndex = gx + gy (+ ajustes)` (`IslandScene.ts:166`, `:339-349`; `catActor.ts:416`; `DecorLayer.ts:260`). Orden de pintor, sin altura (z). |
| Gatos en la isla | **[H]** **un `CatActor` por cada gato poseído**, sin tope (`IslandScene.ts:572-600`); cada uno es un `IslandCat` = malla deformable `CatPuppet` a 12 fps con su propio `Ticker.shared.add` (`art/catArt.ts:257-271`). Pasean dentro del área de su hábitat; los sin casa van a un área común. |
| Comportamientos actuales | **[H]** estados `roam · sleep · sad (sin casa) · boxsleep` (`island/catActor.ts:69`), salto al despertar (`hop`), respiración, sombra de contacto; actos espontáneos del títere `look, yawn, groom, stretch, flick` y emociones `happy, hurt, surprise, sleepy, attack` (`HEAD:livingCat.ts:44-51`, `:384-404`); partículas de mutación y brillo holo; **charla**: cada 6–12 s un gato visible suelta una frase en globo y se retracta, a veces responde un vecino (`island/chatter/director.ts`); ambiente global: gaviotas, peces saltando, clima por dimensión (`island/ambient.ts`). **No hay** interacción gato-gato (jugar, pelear, seguirse), necesidades, ni rutas fuera del hábitat. |
| Duelo de isla | **[H]** `island/duel.ts`: secretos de expansión con batalla (Guardián Musgoso) usan el flujo de batalla y vuelven a la isla. |

---

## 10. Render y assets

| Tema | Hecho |
|---|---|
| Motor | **[H]** PixiJS `^8.22.0` + GSAP `^3.15` + pixi-filters `^6.1.5`; WebGL; DPR ≤ 2. 53 `Ticker.shared.add` en `src/`; GSAP en 133 archivos. |
| Filtros | **[H]** usos de `new …Filter`: ColorMatrix 21, RGBSplit 12, Outline 11, Ink (propio) 10, Comic (propio) 7, Glow 6, Glitch 4, Shockwave 2, Displacement/CRT/Blur 1 (`fx/filters.ts`). |
| Calidad | **[P]** no hay ajuste de calidad/rendimiento: `settings` solo tiene `reduceMotion, reduceFlashes, muted, sfxVolume, musicVolume, sinFiltro` (`core/settings.ts:2-10`). |
| Fuga corregida | **[H]** Pixi v8 no destruía el contexto propio de `Graphics` con `destroy({children})` (+67 MB/batalla) → `core/pixiFixes.ts` importado primero + `tests/pixiLeak.test.ts`. |
| Arte de gatos | **[H]** solo SVG MAI: `public/cats-svg/<slug>.svg` (full, **86 archivos, 617.5 MB**, el mayor 10 MB `rencor_ninetails_cat.svg`) y `cats-svg/lite/<slug>.svg` (**86, 94 MB**, ~130–220 KB gzip c/u según `catArt.ts:38`). Todo espera al lite; el full se pide en segundo plano cuando el gato se dibuja grande (`catArt.ts:174-219`). 32 ilustraciones base + 22 variantes teñidas (`meta.counts`) + stand-ins teñidos. |
| Caché | **[H]** `art/rasterCache.ts`: WebP del raster en Cache Storage por build (`nolc-cat-raster-v1`), apagado en dev salvo `?rastercache=1`. SW: `cats-svg/`, `story/`, `icons/` stale-while-revalidate en caché que sobrevive deploys (`public/sw.js:49`). |
| Rig | **[H]** `catRigs.json` (87 rigs, 24.5 KB): malla deformable tipo Live2D-lite sobre la pintura, sin piezas recortadas. |
| Peso del build | **[H]** `public/` 680 MB (cats-svg 679 MB), `dist/` 690 MB, JS 4.1 MB en `dist/assets` (9.5 MB total). Deploy: GitHub Pages con guardia anti-raster (`.github/workflows/deploy.yml`). **[HIP]** GitHub Pages documenta un límite de 1 GB por sitio publicado: quedan ~310 MB de margen. |
| Audio | **[H]** sintetizado (`core/audio.ts`, `core/music.ts`), sin archivos. |

---

## 11. Estado de los sistemas

| Terminado (con tests o verificado e2e) | Incompleto / reservado | Experimental | Datos o código muerto |
|---|---|---|---|
| Campaña 54 etapas + 6 jefes; historia H01–H30 con finale; 6 grietas; casino (11 juegos + ETERNO, RTP probado con ≥100 k tiros); gacha con pity; Podio (9 tests); Resonancia + pistas secretas; Catdex; hábitats libres 10 tiers (12 tests); 12 expansiones + secretos; baúl/anti-pérdida (`saveSafety.test.ts`); estimación en worker; reactividad de paneles | `arca_celestial` sin camarotes ni cañones ("solo cinemática"); `catdexTeaser`; mutaciones y equipo marcados "diseño, no simulado" (`resonance.ts` sección mutaciones, `gear.ts:1-7`); pendientes de ESTADO.md: animación de victoria/resonancias, ~60 textos de 13 px, placa del Reino a 16:10, brújula del mapa; AgentGameEngine (fase F) no empezado | Labs (`?scene=art|catlive|shiplab|sandbox|islandlab|fxlab|dev`) visibles en producción; **three.js + `puppetCore.ts` sin commit** (otro agente, hoy) | `content.events` completo (flash, heroicos, especiales) sin lector; `flash_active` nunca se prende; `secretRecipes` sin lector; `resonanceRecipes` solo como contador; `balance.catdex` y `balance.expansions` duplicados (divergentes); elementos `electric/wind/spirit/tech` en `ELEMENT_FX` (`catArt.ts:11-29`) y `art_reserved_for_future_elements` (`bytewhisker`, `neon_glitch`…: arte con rig, sin especie); `electric` sigue vivo como elemento de arma Tesla (`battle/weapons.ts:40`) |

---

## 12. Top 10 riesgos para una capa 2.5D + contenido de Parte II

| # | Riesgo | Por qué (evidencia) | Mitigación sugerida |
|---|---|---|---|
| 1 | **Presupuesto de assets** | `public/cats-svg` 679 MB, `dist` 690 MB; cada gato full nuevo ≈ 5–10 MB. **[HIP]** límite de 1 GB de Pages. Una capa 2.5D con modelos/texturas propias lo revienta. | Presupuesto por asset en CI (fallar si `dist` > ~850 MB); re-trazar los full más pesados; servir arte 2.5D generado/compartido en vez de por gato. |
| 2 | **Dos renderers** | three.js entrando junto a Pixi (cambio sin commit). Dos contextos WebGL, pérdida de contexto en móvil, doble ticker, orden de capas y eventos de puntero entre canvases. | Decidir un solo contexto (three dibujando a textura que Pixi compone, o Pixi como overlay en el mismo canvas); prueba de memoria isla→batalla→isla como la de `pixiLeak`. |
| 3 | **Ids inmutables** | `catDef` lanza con especie desconocida (`content.ts:204-208`); expansiones indexadas por **posición** `EXPANSIONS[n-1]` (`island.ts:78`, `:421`); flags/contadores con string (`grieta:<el>`, `void_fragments`, `won_<id>`); Podio y historial de cruces por uid. | Congelar ids (test que compare con una lista de ids publicados); nunca reordenar `expansions`; normalize que aparte especies desconocidas en lugar de romper. |
| 4 | **Coordenadas de la isla** | `gx/gy` de hábitats y deco, `GRID 52/64`, `LEGACY_PLOTS` copiado en la migración v3; profundidad = `gx+gy` sin altura. Una 2.5D con relieve o cámara rotable cambia la semántica de tile y el orden de pintor. | Mantener `gx/gy` como verdad lógica y derivar la vista; si hay altura, guardarla aparte (campo nuevo, sin migrar los existentes). |
| 5 | **Rendimiento de gatos vivos** | Un `CatPuppet` (malla deformada) + un ticker por gato poseído, sin tope (`IslandScene.ts:572-600`, `catArt.ts:257-271`). El jugador real tiene 63+ especies (más instancias). Sin ajuste de calidad. | LOD: títere solo cerca de cámara, sprite/cacheado lejos; tope de actores visibles; un solo ticker agregado; ajuste de calidad en Ajustes. |
| 6 | **Economía relativa al ingreso** | Precios de tienda, orbes, gatos, misiones, Podio y batallas en segundos de ingreso (`shop.ts:80-93`, `missions.ts:249`, `econ.ts:battleGold`). Cualquier multiplicador nuevo de Parte II encarece **todo** a la vez; Marea ×1000 ya lo demuestra. | Simular antes (hay `research/economy-sim/`); separar "ingreso de precio" del ingreso real o fijar topes absolutos. |
| 7 | **Fuentes de verdad duplicadas** | `balance.catdex`/`balance.expansions` vs `content`; `secretRecipes` vs `switch`; `events` sin lector; `meta.counts` y Grimorio `/12` desactualizados. Un agente que edite "los datos" puede no cambiar nada (o cambiar lo equivocado). | Antes de añadir contenido, borrar o marcar como `_doc` lo que no se lee; test que valide conteos. |
| 8 | **Determinismo de batalla** | La vista no decide nada; la estimación (worker) y la escena deben dar lo mismo con la misma semilla (`sim.ts:451`, `autoplay.ts:50`). Una vista 2.5D con física/colisiones propias rompería la paridad. | La 2.5D solo re-escenifica eventos de `Battle`; reglas nuevas solo en `sim.ts`/módulos puros; prueba de paridad en CI. |
| 9 | **Guardado y "nunca quitar nada"** | `SAVE_VERSION 3`; `normalize` rellena pero no migra semántica; ETERNO puede poner monedas en 0 y su lista `AT_RISK` es fija (`eterno.ts:47`); veteranos reciben de golpe misiones nuevas cuyo disparador ya se cumple. | Toda moneda nueva: decidir explícitamente si entra en `AT_RISK`; misiones de Parte II con disparador nuevo (no reutilizar condiciones viejas) o un parche que las escalone; `snapshot()` del baúl antes de migraciones grandes. |
| 10 | **Archivos monolíticos y trabajo concurrente** | `BattleScene` 2488, `sim.ts` 2061, `Sanctuary.ts` 1745, `bake.ts` 1600, `biomes.ts` 1548, `IslandScene` 1412; cambios sin commit de otro agente sobre `livingCat`. Choques de merge y regresiones visuales. | Un dueño por archivo grande; extraer interfaces (p. ej. `IslandView` para 2.5D) antes de reescribir; commit pequeño del refactor de `puppetCore` antes de construir encima. |

---

### Anexo: cómo reproducir los precios de orbes
Script vitest de solo lectura (en el scratchpad, no en el repo): carga `test-saves/<x>.json` → `migrate` → `normalize` →
`G.recalc()` → `shop.incomePerSec()` y `shop.orbGoldPrice(especie)` variando `shopState().goldOrbs[especie]`.
Ejecutar con `npx vitest run --root <carpeta-del-script> orb.test.ts` desde `game/`.
