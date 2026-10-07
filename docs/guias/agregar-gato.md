# Cómo agregar un gato nuevo

Un gato en NO ONE LIKE CATS son cuatro cosas: **datos** (quién es, qué dispara, cómo se consigue), **pintura** (un SVG vectorial puro), **rig** (dónde tiene la cabeza, las orejas, los ojos y la cola para poder "actuar") y **cariño** (un nombre con chiste y una línea de lore que dé ganas de tenerlo). Esta guía cubre las cuatro. La cuarta depende de ti.

Guías hermanas: [agregar-elemento.md](agregar-elemento.md) · [agregar-historia.md](agregar-historia.md) · [agregar-barco.md](agregar-barco.md) · [animaciones.md](animaciones.md) · [arquitectura.md](arquitectura.md) · [CONTRIBUTING](../../CONTRIBUTING.md)

---

## 1. Mapa de archivos

| Archivo | Qué pones ahí |
|---|---|
| `game/src/data/content.json` → `cats[]` | La ficha del gato: nombre, elementos, rareza, rol, disparo, ultimate, cómo se obtiene, lore. |
| `game/src/data/content.ts` | El tipo `CatDef` (qué campos lee el código de verdad) y `CATS`, `CAT_BY_ID`, `catDef()`. |
| `game/src/data/balance.json` | Números por rareza (`rarities.gold_base_per_s`, `power_base`, `duplicate_orbs`, `resonance_time_s`…). El gato hereda los de su rareza. |
| `game/public/cats-svg/<slug>.svg` | La pintura en detalle completo (MAI SVG, perfil *game-compact*). |
| `game/public/cats-svg/lite/<slug>.svg` | La misma pintura en versión ligera (la que carga primero todo el juego). |
| `game/src/data/catRigs.json` | El rig del gato, indexado por `slug`. |
| `game/src/art/livingCat.ts` | `CatPuppet` y el tipo `CatRig` (qué significa cada número del rig). |
| `game/src/art/catArt.ts` | `livingCat()`, `IslandCat`, `BattleCat`, `preloadCats()`; las rutas `catLiteUrl()` / `catSvgUrl()`. |
| `game/src/art/tint.ts` + `game/src/panels/collection/art.ts` | Variantes teñidas (mismo dibujo, otro color) y sus calcomanías (`drawDecal`). |
| `game/src/state/sys/resonance.ts` | Quién puede salir de una Resonancia (`oddsFor`) y las condiciones de los gatos secretos (`secretConditionMet`). |
| `game/src/battle/catShots.ts` | Traduce `combat.shot` y `combat.ultimate` a datos del simulador (`shotFromSpec`, `ultFromDef`). |

---

## 2. La ficha en `content.json`

Los ids siguen una convención por rareza: `c_` común, `r_` raro, `e_` épico, `l_` legendario, `m_` mítico, `h_` heroico, `d_` divino, `s_` secreto. **Un id es para siempre**: las partidas guardan gatos por `species` (el id), así que renombrar uno deja gatos huérfanos en partidas viejas.

Así se ve Canelo (recortado, es real):

```json
{
  "id": "c_canelo",
  "name": "Canelo",
  "epithet": "el Impaciente",
  "art": { "slug": "canelo_cozy_cat", "tint": null, "aura": ["#b87b4b", "#efcfb2", "#7e5135"] },
  "elements": ["fire"],
  "rarity": "common",
  "primordial": false,
  "secret": false,
  "role": "artillero",
  "worker": null,
  "trait": "impaciente",
  "battleForm": { "name": "CANELO — INFERNAL FORM", "cry": "HAIRBALL IGNITION!!" },
  "combat": {
    "hpBase": "roles.artillero.hp",
    "recarga": 0,
    "shot": {
      "name": "Hairball Ignition", "cry": "HAIRBALL IGNITION!!",
      "archetype": "bola_rebote", "element": "fire",
      "dmg": 60, "radius": 1.5, "projectiles": 1, "spreadDeg": 0,
      "bounces": 1, "pierce": 0, "status": "ardiendo", "statusTurns": 2,
      "gravityMul": 1, "speedMul": 1
    },
    "ultimate": {
      "name": "HAIRBALL BARRAGE! (毛玉乱射)",
      "effect": "Tres bolas de pelo en abanico (spread 12°), cada una rebota 1 vez. Ardiendo 2.",
      "dmg": 55, "meterCost": 100, "usesPerBattle": null, "chargeTurns": 0, "structureCap": 0.35
    },
    "limitation": null,
    "passive": "Calorcito: +10% daño a celdas de madera.",
    "star3": "★3: la bola deja un charco ardiente 1 turno donde explota.",
    "star5": "★5: +1 rebote (Hellball junior)."
  },
  "obtain": { "source": "start", "how": "Inicial. Duerme en una caja de cartón al empezar." },
  "hint": null,
  "lore": "Nació para dormir en una caja. Lo despertaste para incendiar barcos. Ahora es tu problema."
}
```

### Campo por campo (lo que el código usa de verdad)

| Campo | Para qué sirve |
|---|---|
| `id` | Id de especie. Lo guarda la partida. Nunca lo cambies después de publicarlo. |
| `name`, `epithet` | Se muestran en Catdex, revelación, tarjetas y créditos. El epíteto es el chiste: "el Impaciente". |
| `art.slug` | Nombre del archivo SVG y del rig: `public/cats-svg/<slug>.svg`, `lite/<slug>.svg`, `catRigs.json[<slug>]`. Varias especies pueden compartir slug (ver variantes). |
| `art.tint` | `null` para la pintura original, o un `TintSpec` para una variante teñida (ver abajo). |
| `art.aura` | 3 colores hex del aura (marcos, brillos de revelación). |
| `elements` | 1 o 2 ids de `elements[]` (`fire`, `water`, `nature`, `earth`, `storm`, `magic`, `cosmic`). Decide hábitat, Resonancia y afinidad en combate. |
| `rarity` | `common`, `rare`, `epic`, `legendary`, `mythic`, `heroic` o `divine`. De aquí salen oro/s, poder, orbes y tiempo de Resonancia (`balance.json` → `rarities`). Heroicos y Divinos no salen de la Resonancia ni del casino (ver sección 6). |
| `primordial` | `true` para el legendario "fundador" de un elemento (Ignis, Gea…). Solo los primordiales legendarios salen de Resonancia, y solo si los padres comparten su elemento. |
| `secret` | `true` saca al gato de los pozos normales; necesita una condición propia (sección 6). |
| `role` | Uno de `roles[]`: `artillero`, `demoledor`, `francotirador`, `asediador`, `soporte`, `tanque`, `controlador`, `invocador`. Define la vida base. |
| `worker` | `null` o un oficio (`banker`, `farmer`, `builder`, `voyager`). Lo lee `state/sys/workforce.ts`. |
| `trait` | Uno de `traits[]` (`impaciente`, `gloton`, `dormilon`…). Es el rasgo por defecto al adoptarlo. |
| `battleForm.name`, `battleForm.cry` | El título de la transformación y el grito (en inglés o japonés, es parte del chiste). |
| `combat.shot` | El disparo. `archetype` decide la trayectoria (tabla abajo). `radius` va en celdas. `status` en español (`ardiendo`, `mojado`, `enraizado`, `cargado`, `maldito`, `congelado`). |
| `combat.ultimate` | La ulti. `dmg` se convierte en multiplicador contra `shot.dmg`; `usesPerBattle` y `chargeTurns` son límites. Si el nombre contiene `STARFALL`, `METEOR` o `DECREE` (o el arquetipo es `objetivo`) se vuelve meteoro. Los legendarios/míticos/secretos/heroicos/divinos llevan además una ulti con firma en `battle/ults.ts` (`ULTS`, `ultWorth` para la IA), su set piece en `battle/ultFx.ts`, una línea en `state/sys/estimate.ts` (`BIG_ULT`) y su ULTI del Podio en `podio/powers.ts` (`SIGNATURE`). |
| `combat.limitation` | `null` o una de las limitaciones con nombre (`UNA BALA`, `SEGUNDA VIDA (Revenant)`, `VENGANZA`, `3 ESCUDOS`, `CAÑÓN DE CRISTAL`, `INESTABLE`, `CARGA`, `CARGA 2 TURNOS`). La tabla `LIMIT` está en `battle/catShots.ts`. |
| `combat.passive`, `star3`, `star5` | Texto que se muestra (Altar, Catdex, subida de estrellas). Ojo: si `usesPerBattle` es 1 y `star5` dice «2 veces por batalla», a ★5 la ulti de verdad se puede usar dos veces (`battleCatFrom` en `battle/catShots.ts`). |
| `obtain.source` | Cómo se consigue: `start`, `resonance`, `boss:N`, `heroic:N`, `podio:N`, `secret`. `obtain.how` es el texto que lee el jugador. |
| `hint` | Pista para la Catdex mientras no lo tienes (sobre todo secretos). |
| `lore` | Una o dos frases. Sale en la revelación. Que dé risa o ternura, mejor si las dos. |

Hay campos en la ficha que hoy son notas de diseño y el código no lee (`economy.*` con textos `"balance:..."`, `combat.hpBase`, `obtain.balanceSource`, `balanceName`). Llénalos igual por consistencia, pero no esperes que cambien nada.

### Arquetipos de disparo

Viene de `TRAJ` en `game/src/battle/catShots.ts`:

| `archetype` | Trayectoria en el simulador |
|---|---|
| `bola_rebote` | `bounce` (si `bounces` es 0, parabólico normal) |
| `torpedo` | `torpedo` (viaja bajo el agua) |
| `semilla` | `seed` |
| `roca` | `heavy` (perfora 2 por defecto) |
| `rayo` | `beam` |
| `rafaga` | `gust` |
| `runa` | `homing` |
| `orbe_gravitatorio` | `orb` |
| `objetivo` | `meteor` |

Con `projectiles > 1` casi todas pasan a `spread` (abanico). Un arquetipo nuevo necesita código en `battle/` (simulador + vista), no solo datos: eso ya es una propuesta grande, ábrela como idea primero.

---

## 3. La pintura: de PNG a MAI SVG

Aquí no entra ni un píxel. El `.gitignore` bloquea `png`, `jpg`, `webp`, `gif`, `avif` y `bmp` a propósito: usamos SVG porque **carga más rápido, se puede animar y no nos cuesta nada**. Esa regla aplica a todo el juego.

El flujo con [MAI SVG](https://github.com/Ragosorio/MAI-SVG) (la herramienta hermana de este juego, también de código abierto):

1. **Dibuja o consigue la ilustración** del gato en 700×700 lógicos, fondo transparente, cuerpo completo, sentado o de tres cuartos (mira los 54 que ya existen para el encuadre). El PNG fuente vive **fuera** del repo. Si llega más grande (los del lote A venían a 1024×1024, gato al 90 % de alto), redúcelo a 700×700 antes de vectorizar: así el viewBox, el rig y el peso del SVG quedan como los demás.
2. **Vectoriza** con MAI: `mai vectorize --preset high-color-preserved` (el alfa se vuelve máscara vectorial). Mira el `premultipliedRgbMae` del reporte: lo normal es 6–11. Si sale enorme (70+), el trazador se colapsó en una silueta plana; reduce el PNG con otro filtro (p. ej. `mitchell` en vez de `lanczos3`, o al revés: Kage colapsó con `mitchell` y salió bien con `lanczos3`) y repite.
3. **Exporta para el juego** con `scripts/game-export.ts` de MAI (perfil *game-compact*: mismo dibujo, verificado píxel a píxel) → `game/public/cats-svg/<slug>.svg`. El manifiesto de tamaños queda en `game/public/cats-svg/game-export.json`.
4. **Genera la versión ligera** con `scripts/game-thumbs.ts` de MAI → `game/public/cats-svg/lite/<slug>.svg`.

Por qué dos archivos: `lite/` (aprox. 1 MB sin comprimir en el caso de Canelo) es lo que espera todo el juego para isla, batalla, tienda y Catdex. El completo (aprox. 8.6 MB sin comprimir) solo se baja en segundo plano cuando el gato se dibuja más grande que unos 640 px en pantalla (`requestCatSvg` en `catArt.ts`). Ambos usan el mismo espacio de 700×700, así que el rig sirve para los dos.

El `slug` termina en `_cat` por convención (`canelo_cozy_cat`, `jelly_aquatic_cat`). Usa minúsculas y guiones bajos.

### Variantes teñidas (gato nuevo sin dibujo nuevo)

Hoy ningún gato de la Catdex lo usa (los 22 que reutilizaban otra pintura se rediseñaron en el lote A), pero sigue siendo la forma más barata de sumar un gato. Ejemplo (así era Chispa antes de tener su propio dibujo):

```json
"art": {
  "slug": "sol_sunbeam_cat",
  "tint": { "hue": -12, "sat": 1.25, "bright": 1, "overlay": "#ff6a1a", "overlayAlpha": 0.18, "decal": "brasas", "scale": 0.92 },
  "aura": ["#ff6a1a", "#ffc94a", "#ff2e2e"]
}
```

- `hue`, `sat`, `bright` van a un `ColorMatrixFilter` (`tintFilter` en `art/tint.ts`).
- `overlay` + `overlayAlpha` se mezclan en el `tint` del sprite (`overlayTint`).
- `decal` dibuja una calcomanía en código sobre la pintura (`drawDecal` en `panels/collection/art.ts`). Las disponibles: `brasas`, `grietas_lava`, `musgo`, `estrellas`, `runas`, `lodo`, `raices`, `vapor`, `plasma`, `rayos`, `lunas`, `burbujas` (más algunas de mutaciones como `escarcha`, `grietas`, `oro`). Una calcomanía nueva es un `case` nuevo en `drawDecal`.
- `scale` hace al gato un poco más grande o más chico.

---

## 4. El rig (para que actúe)

Sin rig el gato se ve como una calcomanía quieta. Con rig parpadea, mueve las orejas, gira la cabeza hacia el cursor, menea la cola, respira, bosteza, se estira y actúa en batalla. El rig se hace en MAI (`exports/game-rigs/<slug>.rig.json`) y se compacta dentro de `game/src/data/catRigs.json`, indexado por `slug`.

Rig real de `alien_galaxy_cat`:

```json
{
  "head": [372, 280, 128, 108],
  "neck": [385, 388],
  "ears": [[250, 212, 110, 135, 62], [452, 168, 482, 10, 55]],
  "eyes": [[274, 270, 364, 352], [407, 228, 475, 310]],
  "tail": { "pts": [[468, 580], [580, 560], [592, 470], [545, 400], [600, 355], [632, 392], [615, 432]], "r": 42 },
  "floats": []
}
```

Todas las coordenadas están en el espacio de la pintura (700×700, salvo que el rig traiga `size`). Lo que significa cada cosa, según el tipo `CatRig` de `art/livingCat.ts`:

| Campo | Formato | Qué mueve |
|---|---|---|
| `head` | `[cx, cy, rx, ry]` | Elipse de la cabeza: lo que se inclina, asiente y mira. |
| `neck` | `[x, y]` | Pivote sobre el que gira la cabeza. |
| `ears` | `[[baseX, baseY, puntaX, puntaY, medioAncho], ...]` | Cada oreja: tiemblan y se aplastan con las emociones. |
| `eyes` | `[[x0, y0, x1, y1], ...]` | Caja de cada ojo; el párpado de arriba está en `y0`, el de abajo en `y1`. Así parpadea. |
| `tail` | `{ pts: [[x,y]...], r }` o `null` | La cola como polilínea desde la base hasta la punta, con radio de influencia `r`. |
| `floats` | `[[cx, cy, r], ...]` | Objetos sueltos que flotan (cristales, linternas, fueguitos). |
| `size` | `[w, h]` opcional | Solo si la pintura no es 700×700 (hoy solo `luzterna`). |

Consejos que te ahorran una tarde:

- Si un ojo está tapado (pelo, máscara), mejor deja ese ojo fuera de `eyes` que hacer parpadear la máscara.
- Las cajas de ojos chicas y bien ajustadas se ven mejor que las generosas.
- La cola va **de la base a la punta**. Al revés, el gato menea el trasero.

---

## 5. Probarlo en el laboratorio

Con `npm run dev` corriendo (desde `game/`):

- `?scene=catlive` muestra **todos** los gatos vivos. El tuyo debe estar ahí con su etiqueta.
- `?scene=catlive&cat=<slug>` lo pone grande. Haz click para recorrer emociones (`happy`, `surprise`, `hurt`, `attack`, `sleepy`).
- `?scene=catlive&cat=<slug>&rig=1` dibuja el rig encima: cabeza en amarillo, orejas en rojo, ojos en verde, cola en magenta, flotantes en cian. Si algo no cae donde debe, ahí lo ves.
- `?scene=catlive&cats=<slug1>,<slug2>` compara pocos lado a lado. Funciona con cualquier slug, aunque ningún gato de `content.json` lo use todavía.
- `?scene=catlive&lote=b` / `lote=c` / `lote=parte2` muestra las pinturas nuevas de `game/src/data/art-parte2.json` (id → slug).
- `?scene=fxlab&cat=<id o slug>` dispara con tu gato la revelación (normal, duplicado, holo), el descubrimiento de elemento, la invocación, la subida de estrellas y la portada del periódico.
- `?scene=dev` es el **LABORATORIO**: la lista de todos los laboratorios con su guía.

Luego pruébalo en el juego de verdad: en Resonancia (si `source` es `resonance`), en batalla (su disparo, su ulti, la Battle Form) y en la Catdex.

---

## 6. Cómo se consigue

Según `obtain.source`:

- **`start`**: está en `balance.json` → `start.cats` (hoy `c_canelo`, `c_gelatino`, `c_brote`). Agregar un gato inicial cambia el arranque de todas las partidas nuevas: háblalo antes.
- **`resonance`**: no hay recetas a mano. `oddsFor()` en `state/sys/resonance.ts` arma los pozos solo, a partir de los elementos de los padres:
  - Comunes: solo si tienen **un** elemento y ese elemento está entre los de los padres.
  - Raros: cualquiera cuyos elementos estén todos entre los de los padres.
  - Épicos: lo mismo, y además ambos padres Nv15+.
  - Legendarios: solo `primordial: true` cuyo elemento compartan **los dos** padres, ambos Nv20+.
  - Los míticos y secretos no entran a los pozos normales.

  O sea: si haces un raro de Fuego + Naturaleza, aparece solito al cruzar padres de esos elementos. `content.json` → `resonanceRecipes[]` es una tabla de probabilidades calculada para documentación y para las pistas de campaña (`state/ext/campaign.ts`); si tu gato cambia los pozos, actualízala para que las pistas no mientan.
- **`boss:N`**: el jefe lo entrega con un `cat:<id>` en sus `unlocks` de `balance.json` → `bosses[]` (por ejemplo `"unlocks": ["element:earth", "cat:l_gea", "zone:2"]`). Ver [agregar-historia.md](agregar-historia.md).
- **`heroic:N`** y eventos: los da una batalla de historia (`state/sys/storyBattles.ts`, `reward.cat`).
- **`podio:N`** (rarezas HEROICO y DIVINO): el campeón de la liga N del Podio lo paga la PRIMERA vez que le ganas, y pelea CON ese gato. La tabla liga → gato está en `data/podio.json` → `champion_prizes` (hoy: Heroicos en las ligas 8–11, Divinos en 12–15); `state/sys/podio.ts` (`championPrize`, `applyDuel`) lo entrega y `PodioScene` hace la revelación. Su ulti de barco va en `battle/ults.ts` (con su propio tope en `ultBudgetFrac`) y su set piece en `battle/ultFx.ts`; su ULTI del Podio en `podio/powers.ts` (`SIGNATURE`).
- **`secret`**: necesita código. Agrega un `case` con tu id en `secretConditionMet()` de `state/sys/resonance.ts`, y documenta la condición en `content.json` → `secretRecipes[]` y la pista en `hint`. Ejemplo real:

```ts
case 's_maneki':
  return da.worker === 'banker' && db.worker === 'banker' && la >= 15 && lb >= 15;
```

### Colecciones de la Catdex

`content.json` → `catdexSets[]` agrupa gatos. Completar un set da Prisma y levanta el flag `<set.id>` (ver `checkSets()` en `state/sys/cats.ts`):

```json
{ "id": "set_brasas", "name": "Brasas del Hogar", "cats": ["c_canelo", "c_chispa", "l_ignis"], "rule": "Ardiendo dura +1 turno para todos tus gatos." }
```

Si tu gato completa un tema, súmalo a un set o propón uno nuevo. Ojo: hoy el texto de `rule` se muestra y el flag se levanta, pero verifica en `battle/` si la regla concreta ya está aplicada en combate antes de prometerla.

---

## 7. Partidas viejas y números

- Un gato nuevo **no** necesita migración: las partidas guardan especies por id, y un id nuevo simplemente no está en ellas todavía.
- Si quieres regalarlo a quien ya pasó el punto donde se obtiene (por ejemplo, lo entrega el Jefe 2 y alguien ya lo venció), eso es un **parche** (`registerPatch`), ver [ACTUALIZACIONES.md](../ACTUALIZACIONES.md).
- El total de la Catdex se usa en varios lados (`meta.counts.catdexEntries` y algunos textos como los créditos, que dicen `/54`). Si sumas gatos, busca ese número.
- Cuéntaselo a los jugadores con una entrada en `game/src/data/updates.ts` (NOVEDADES).

---

## 8. Checklist

- [ ] Ficha en `content.json` → `cats[]` con id nuevo y con el prefijo de su rareza.
- [ ] `lite/<slug>.svg` y `<slug>.svg` en `game/public/cats-svg/` (o una variante teñida de un slug existente). Cero raster.
- [ ] Rig en `catRigs.json` revisado con `?scene=catlive&cat=<slug>&rig=1`.
- [ ] Se ve bien en `?scene=fxlab&cat=<id>` (revelación y Battle Form).
- [ ] Cómo se consigue funciona (Resonancia real, jefe, evento o condición secreta).
- [ ] Lore y grito revisados: tono del juego, sin chistes sobre etnia, religión ni el Holocausto.
- [ ] `npm run build` pasa.
- [ ] Probado con partida nueva y con una vieja (`?save=post-boss3`).
- [ ] Entrada en NOVEDADES (`game/src/data/updates.ts`) y, si aplica, parche para partidas viejas.
