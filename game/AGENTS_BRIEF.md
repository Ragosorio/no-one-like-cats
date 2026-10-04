# NO ONE LIKE CATS — Brief para agentes de construcción (Hito 2)

Juego web para PC: **TypeScript + PixiJS v8 + GSAP + pixi-filters v6**, Vite. Pantalla lógica **1920×1080** (todo se dibuja en esas coordenadas; `core/App.ts` escala a la ventana). Idioma: **español latino "sin filtro"** (groserías ligeras, humor irreverente, referencias pop; ataques gritados en inglés/japonés). Arte 100% en código + las 32 ilustraciones pintadas de gatos (`public/cats/<slug>.webp`).

**El Hito 1 está terminado y verificado de punta a punta** (título → prólogo → tutorial H01–H09 → Zona 1 → Jefe 1 → Tierra + Gea). Ahora construimos el **Hito 2: hasta el Jefe 3** (GDD §8 "M2"). No rompas el Hito 1.

## Diseño (fuente de verdad)
- `../research/04-gdd-no-one-like-cats.md` — GDD maestro. **Lee §8 (M2)** y las secciones de tu área (astillero 2.8, expansiones/isla 2.3–2.5, Altar/estrellas/rasgos/mutaciones 2.6–2.7, combate 2.9–2.14, misiones 4.x, historia §5, pantallas §6, juice §7, decisiones §9).
- `src/data/content.json` (tipado en `src/data/content.ts`) — contenido (gatos, misiones, zonas, jefes, élites, enemigos, barcos, módulos, rasgos, mutaciones, sets, expansiones, automatización, hitos de Reino, historia).
- `src/data/balance.json` — TODOS los números de economía. Nunca hardcodees números de economía (lo no simulado —rasgos, reliquias, tipos de arma— puede vivir en tu código o en content, según GDD §9 #24).
- `../research/10-direccion-de-arte.md` (multiverso de estilos) y `../research/07-animaciones-dopamina.md` (tiers T0–T4, storyboards con tiempos).

## Arquitectura (úsala, no la dupliques)
- **Estado**: `G` (`src/state/game.ts`) = estado + recursos + relojes verdes (`G.s.timers`, `G.startTimer/onTimer/timerFor/rush`) + Ronroneo (`G.purr`, `G.spendPurrOn`) + Momentum + XP de Reino (`G.xp`) + guardado (`G.save`, autosave 10 s) + bus (`G.on/emit`: 'res','timerDone','catAdded','catLevel','klUp','purr','mission','unlock','element'…) + contadores para misiones (`G.count(key, n)`, `G.flag(key)`, `G.has(key)`). Campos M2 ya agregados (opcionales, inicialízalos con `??=`): `G.s.gear`, `G.s.errands`, `G.s.layouts`, `G.s.ext` (estado libre por módulo: `G.s.ext.bank`, …), `OwnedCat.kos`.
- **Sistemas**: `state/sys/cats.ts`, `island.ts`, `resonance.ts`, `ship.ts`, `campaign.ts` (buildBattle con escalado SP/EP, applyResult → Loot, jefes, SPECIALS/buildDuel/applySpecialResult), `missions.ts`, `secrets.ts`, `micro.ts`, `workforce.ts` (oficios, expediciones, cola de Resonancia). Fórmulas: `state/econ.ts`. `window.__G` en consola.
- **Combate**: `battle/sim.ts` (Battle determinista: rejilla CELL=40, colapso BFS, balística compartida preview/IA/disparo, elementos —el sim usa `'electric'` para 'storm'—, estados, reacciones, escudos, santabárbara, inundación/brecha, duelo, fx de gatos, K.O., andanada automática de cañones al final del turno), `battle/ai.ts`, `battle/catShots.ts`, `battle/weapons.ts`, `battle/anime/**` (AnimeShipView: una ilustración Canvas2D horneada + trozos por celda + escombros; estilos `styleFor`), `scenes/BattleScene.ts`, `app/battleFlow.ts`.
- **Navegación**: `src/app/flow.ts` (`goTitle`, `goIsland`, `goMap`, `goBattle(zone, stage)`). Nunca importes una escena desde otra.
- **Paneles**: `src/panels/*.ts` exportan `openX(...)`. `Modal` (`ui/modal.ts`), `toast()`, UI kit `ui/widgets.ts` (txt, poster, Button, Bar, Counter…), `ui/theme.ts` (C, F, RARITY), `ui/icons.ts`, `ui/dialog.ts` (`say`, `tip`, `newspaper`). Arte: `art/catArt.ts`, `art/tint.ts`, `art/textures.ts`, `fx/juice.ts`, `fx/particles.ts`, `fx/sequences/*`. Audio `core/audio.ts` `sfx(name)`, `core/music.ts`.
- Seguridad de animaciones: nunca dejes tweens GSAP vivos sobre objetos destruidos (usa `killTweensDeep`/`destroyDeep` existentes; `core/safety.ts` ya mata tweens en destroy).

## Reglas de colaboración (5 agentes a la vez)
1. Edita solo **tus archivos** (tabla abajo). Puedes crear archivos nuevos dentro de tus carpetas. `src/state/game.ts`, `src/main.ts`, `src/app/flow.ts`, `src/core/**`, `src/ui/widgets.ts|theme.ts|icons.ts|modal.ts` son del orquestador: si necesitas algo ahí, hazlo en tu módulo o pídelo en tu reporte final (cambios mínimos y aditivos solo si te bloquea, y repórtalos).
2. Si encuentras un BUG en un archivo ajeno, arréglalo solo si te bloquea (mínimo) y repórtalo.
3. `npx tsc --noEmit -p .` en `/Users/roor.osorio/Desktop/No one/game` sin errores en tus archivos.
4. **No hagas commits** (el orquestador los hace). No borres ni reviertas trabajo ajeno.
5. Calidad: muy bonito y con personalidad (pósters suizos, tinta, halftone, onomatopeyas, multiverso de estilos), legible, juice proporcional al valor. Nada de "UI de programador". Itera con capturas.
6. Contratos entre agentes (créalos PRIMERO como stub con esta firma exacta para que los demás puedan importarlos):
   - Astillero crea `src/state/sys/gear.ts` → `export function gearBattleMods(shipId: string): { hpMul: number; cannonAtkMul: number; catDmgMul: number; ultStart: number; notes: string[] }` (neutro = 1,1,1,0,[]). Combate lo aplica en `buildBattle`.
   - Combate crea `src/state/sys/ranks.ts` → `export function koRank(kos: number): { id: string; name: string; tier: number; next: number | null }` y `export const KO_RANKS`. Colección muestra la insignia en CatPanel; Combate suma `OwnedCat.kos` al final de cada batalla.
   - Combate crea `src/panels/Errands.ts` → `export function openErrands(): void` (tablero de Encargos). Historia agrega el botón en el mapa.
   - Historia crea `src/panels/Kingdom.ts` → `export function openKingdom(): void` (Reino: hitos y automatizaciones). Isla lo abre al tocar el escudo/número de Reino del HUD.
   - Isla crea `src/panels/island/WorkersPanel.ts` (`openWorkers()`) y `src/panels/island/PortPanel.ts` (`openPort()`: expediciones).

## Dueños de archivos
| Agente | Archivos |
|---|---|
| **combate** | `src/battle/**`, `src/scenes/BattleScene.ts`, `src/app/battleFlow.ts`, `src/state/sys/campaign.ts`, `src/state/sys/ranks.ts` (nuevo), `src/panels/Errands.ts` + `src/panels/errands/**` (nuevo), `src/dev/**`, `src/scenes/BattleSandbox.ts`, `src/scenes/ShipArtLab.ts` |
| **astillero** | `src/panels/Shipyard.ts`, `src/panels/shipyard/**` (nuevo), `src/state/sys/ship.ts`, `src/state/sys/gear.ts` (nuevo) |
| **isla** | `src/scenes/IslandScene.ts`, `src/island/**`, `src/panels/island/**`, `src/ui/hud/**`, `src/ui/micro/**`, `src/state/sys/island.ts`, `src/state/sys/workforce.ts`, `src/state/sys/secrets.ts`, `src/state/sys/micro.ts`, `src/state/ext/island*.ts` |
| **colección** | `src/panels/Sanctuary.ts`, `src/panels/Catdex.ts`, `src/panels/Altar.ts`, `src/panels/CatPanel.ts`, `src/panels/collection/**`, `src/fx/sequences/catReveal.ts`, `src/fx/sequences/starUp.ts`, `src/state/sys/resonance.ts`, `src/state/sys/cats.ts`, `src/state/ext/collection.ts` |
| **historia** | `src/state/sys/missions.ts`, `src/panels/Missions.ts`, `src/panels/Kingdom.ts` (nuevo), `src/app/story.ts`, `src/ui/story/**`, `src/ui/dialog.ts`, `src/scenes/PrologueScene.ts`, `src/scenes/MapScene.ts`, `src/scenes/ResultsScene.ts`, `src/scenes/TitleScene.ts`, `src/panels/campaign/**`, `src/fx/sequences/victoryNews.ts`, `src/fx/sequences/elementDiscovery.ts`, `src/state/ext/campaign.ts`, `src/panels/Settings.ts` |

## Cómo probar (OBLIGATORIO: headless Chrome a velocidad real)
El panel del navegador integrado corre a ~1 fps: **no lo uses para jugar**. Usa el arnés de puppeteer:
`/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/477cf546-7671-4e6f-93df-70e7a9f79d6f/scratchpad/pp/README.md` (léelo). Resumen:
- Levanta **tu propio** Vite con `hmr: false` y **tu propio** Chrome headless (puertos y perfil únicos, ver tabla) con `run_in_background` y `timeout: 7200000`. Copia `pp/` a tu carpeta (`cp -R`).
- `CDP=<cdp> GAME=http://127.0.0.1:<vite> SHOTS=<dir> node drive.mjs paso.mjs` → clics en coordenadas lógicas, `h.shot(name, 0.5)` (luego Read de la imagen), `h.clickText(/regex/)`, `h.G('expr')`, `h.ff()` (adelanta relojes), `playBattle`/`campaign`.
- Rutas dev: `?save=post-boss1` (carga la partida de prueba tras el Jefe 1: Reino 6, 5 gatos, Zona 1 completa), `?stage=2-1` (salta a esa batalla con la partida cargada), `?scene=island&new=1`, `?scene=map`, `?scene=battle`, `?realtime=1`. Puedes guardar tus propias partidas de prueba en `game/test-saves/<nombre>.json` (`localStorage['nolc-save-v1']`).
- Como tu Vite no tiene HMR, recarga la página (`h.goto(...)`) después de editar.

| Agente | Vite | CDP |
|---|---|---|
| combate | 5181 | 9341 |
| astillero | 5182 | 9342 |
| isla | 5183 | 9343 |
| colección | 5184 | 9344 |
| historia | 5185 | 9345 |

Al terminar: apaga tu Vite y tu Chrome, y entrega un reporte breve: qué hiciste, archivos tocados (incluye cualquier archivo ajeno y por qué), cómo probarlo, pendientes/bugs conocidos.

## ACTUALIZACIÓN (feedback nuevo del usuario) — aplica a TODOS
- **Cero emojis en la UI.** Elementos → `elementIcon(el, size)` / `iconText('texto {fire} y {water}', style, { wrap })` de `src/ui/elementIcon.ts` (insignias SVG `public/icons/el-*.svg`, precargadas en el boot; `iconText` también convierte emojis viejos). Otros símbolos (📌🔒🛡🐟🏦⚓…) → `icon()` de `ui/icons.ts` o dibujo en código. `ELEMENT_ICON` de `data/elementsMeta.ts` queda obsoleto (no lo uses en textos). content.json ya no trae emojis de elementos en sus textos (salvo el campo `elements[].emoji`: no lo muestres).
- Perfil del jugador: `G.s.player = { name, gender: 'm'|'f'|'x' }` (lo pregunta el prólogo). Texto con género/nombre: `gtxt('¿Miedo, {name}? Bienvenid{g:o|a|e}')` y `gword(m,f,x)` de `src/ui/gender.ts`.
- Charla de gatos en la isla: `pickChatter(elements)` de `src/data/chatter.ts` (frase `a` y retractación `b`; tokens {name},{g:},{cat}).
- Estado nuevo (opcional, inicializa con `??=`): `G.s.decor` (Tienda), `G.s.casino` (Casino/Gacha), `G.s.accessories`, `OwnedCat.holo` (variante foil del gacha).

### Agentes nuevos
| Agente | Archivos | Vite | CDP |
|---|---|---|---|
| **dimensiones** | `src/island/terrain.ts`, `src/island/sea.ts`, `src/island/ambient.ts`, `src/island/catActor.ts`, `src/island/dimensions/**` (nuevo), `src/island/chatter/**` (nuevo) | 5186 | 9346 |
| **tienda** | `src/panels/shop/**` (nuevo), `src/state/sys/shop.ts` (nuevo), `src/state/sys/decor.ts` (nuevo), `src/island/decor/**` (nuevo) | 5187 | 9347 |
| **casino** | `src/scenes/CasinoScene.ts` (nuevo), `src/panels/casino/**` (nuevo), `src/state/sys/casino.ts`, `src/state/sys/gacha.ts`, `src/state/sys/accessories.ts` (nuevos), `src/fx/sequences/gacha*.ts` (nuevo), `src/core/voice.ts` (nuevo) | 5188 | 9348 |
El agente **isla** cede a **dimensiones**: terrain.ts, sea.ts, ambient.ts y catActor.ts (estilo visual por isla/dimensión y burbujas de charla). Isla conserva la jugabilidad (expansiones, limpieza, secretos, parcelas, paneles, HUD, worldUi, buildingArt, IslandScene).
Contratos nuevos: tienda crea `src/panels/shop/Shop.ts` → `openShop(tab?: string)`; casino crea `src/scenes/CasinoScene.ts` y `src/panels/casino/open.ts` → `openCasino()` y `openGacha()`; isla agrega los botones TIENDA y CASINO en el HUD de la isla (import dinámico). Para entrar a una escena nueva usa `scenes.go(...)` desde tu propio módulo (el orquestador agregará `goCasino` a flow si hace falta).
