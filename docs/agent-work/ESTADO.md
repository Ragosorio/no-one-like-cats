# Registro de trabajo del agente (auditoría 2026-10-08)

Bitácora corta para que otro agente pueda continuar. Lo verificado dice cómo se verificó.

## Herramientas

- Pruebas unitarias: `cd game && npm test` (vitest, `game/tests/`). Typecheck: `npm run typecheck`.
- Misiones (estático): `npx tsx scripts/verify-missions.ts --all` (ojo: solo revisa que exista quien emita
  cada contador, NO que la meta sea alcanzable; E18 pasaba "OK" siendo imposible).
- Playtest headless: Vite en otro puerto (`npx vite --port 5191 --strictPort`) + Chrome headless con perfil
  propio (`--user-data-dir` aparte, `--remote-debugging-port`) + puppeteer-core. Rutas `?save=<test-save>`,
  `?scene=island`, `&realtime=1`. Nunca usar el perfil real de Chrome.

## Partida real del jugador

- Vive en `localStorage` del origen `https://ragosorio.github.io` (PWA instalada, perfil Default de Chrome),
  claves `nolc-save-v1` / `nolc-save-prev` / `nolc-save-bak-*`.
- NO se pudo leer: Claude in Chrome no estaba conectado y leer el leveldb de Chrome directamente quedó
  bloqueado (contiene datos de otros sitios). Datos visibles en las capturas: Reino 38, ~1.9B oro, ~922M
  pescaditos, 68 gemas, Catdex 63/86, misiones K39 (55/70) y E18 "Rumores" (2/3), Podio Liga del Vacío IV.
- Respaldo: el jugador puede exportar desde Ajustes › RESPALDOS (copiar partida como texto).
  Ninguna prueba toca esa partida.

## Hallazgos confirmados

| # | Problema | Causa raíz | Estado |
|---|---|---|---|
| 1-3 | Franjas negras / mundo sin atenuar arriba y abajo en diálogos, victoria, resonancias | 41 capas "pantalla completa" dibujaban `rect(0,0,W,H)` (la caja 1920×1080) en vez de `game.view`; las barras de cine también | Implementado `ui/screen.ts` (`screenRect`, `followView`, `paintScreen`) + migración; diálogo anclado al borde real. Verificado en headless 1600×1000 |
| 5-6 | Nivel viejo en el hábitat tras alimentar | `HabitatPanel` pintaba sus tarjetas una vez y no escuchaba nada | Evento nuevo `G.emit('cat', {uid, why})` (nivel, estrellas, casa, nombre); `Modal.listen()`; hábitat y CatPanel redibujan. Verificado: `tests/catReactivity.test.ts` + headless (NV 40→41 en vivo) |
| E18 | "Rumores" imposible | solo 2 fuentes de `secret_rumors` (secretos 1 y 4), pide 3 | **verificado** (tests secretClues) |
| s_caos | inobtenible | requiere `flash_active`, que nadie activa | **verificado**: Tormenta+Cósmico Nv25+ |
| IR | misiones sin ruta | `secret_rumors`, `podio_win` (P01 abre Misiones), `gambit_play`, `micro_complete`, `reach_kl` | implementado (+ botón IR en el panel MISIONES) |
| Historia | sin final después de Parte 2 | H28 es el último evento; nada se dispara al cerrar las 6 grietas | **verificado e2e**: H29→batalla→escenas→créditos→H30 |
| Podio | gatos nuevos no pueden revanchas | la lógica soporta ligas pasadas pero el lobby fija `lg = p.league` | **verificado** (subagente): navegador de ligas, 1ª victoria por gato, catch-up, XP guardada; 9 tests |
| Gacha | destacado legendario sale como "épico" en HOLO | `casino.ts:801` condición siempre verdadera; no resetea pity ni cuenta como legendario | **verificado** (casinoGacha.test) |
| Casino | fichas sobre el tope se pierden en silencio | `addChips` recorta a 1500 | **arreglado**: el tope solo aplica a ingresos de campaña |

## Lista de trabajo

Verificado (headless + vitest, ver "Pruebas"):
- Capas a pantalla real (img 1-3, base) — `ui/screen.ts`; diálogo anclado al borde real con barras y degradado.
- Reactividad de nivel (img 5-6) — evento `cat`, `Modal.listen`, hábitat/CatPanel/Catdex redibujan.
- E18 Rumores — pistas por "forma" de receta en el Santuario (`secretClues/noteSecretClues`), progreso = pistas
  vigentes (rumor o registrado). s_caos: Tormenta+Cósmico Nv25+ (antes requería un evento inexistente).
  Rutas seguras reales: Maneki (10 callejeros), Lumen (40 especies), Eclipse (ganar con Solar+Lunita).
- IR de misiones: secret_rumors, podio_win (P01), gambit_play, micro/event, reach_kl.
- Santuario ("altar de cruces"): buscador/filtros/orden, historial de 40 parejas con ★ favoritos y ×N,
  LLENAR (rellena todas las ranuras libres con parejas que no comparten gato), condiciones muestran secretos.
- Selector de tripulación (img 9): `CrewSelect` con todos los gatos, filtros, poder, ataque/ulti, ubicación,
  ▲/▼ contra casco y gatos enemigos (`state/ext/matchup.ts`); SUGERIR pondera ventaja y explica por qué.
- Catdex (img 7/8): ficha con TU gato (instancias ‹ ›), ubicación, VER GATO / HÁBITAT / DARLE CASA / ALTAR
  apilados sobre el Catdex; cabecera de 13 elementos en 2 filas; chips de icono; búsqueda sin tildes.
- CatPanel (img 8): numeral de nivel centrado (pop en su sitio), orbes no chocan con ALTAR, textos que se
  re-envuelven (`ui/fit.ts`). Toasts: sin duplicados apilados, subtítulos con salto de línea.
- Final de la historia: `state/sys/finale.ts` (batalla EL ARCHIVO RASGADO), H29/H30 en content.json,
  guion `ui/story/finaleScript.ts`, créditos edición definitiva.

Verificado por subagentes: Podio justo (9 tests), Hábitats (13 biomas, terreno 3×3→4×4→5×5 por tier,
MOVER Y MEJORAR, partidas viejas compactas sin solapes; 12 tests; ~10–20% más costo de render).
Casino (subagente, verificado: 24 tests + headless): x1/x2/x10 + ETERNO (20 s, crypto 50/50, pérdida = 0 exacto de
gold/gems/food/casino.tickets/casino.chips, resolución idempotente por sesión, confirmación con montos reales y
"mantén presionado"); 6 juegos nuevos en `panels/casino/games/` (registro) + `state/sys/casino/*` con RTP
95.3–96.5% simulado ≥100k; autoplay sin tope de 25; gacha: bug del destacado HOLO y pity de riesgo; tope de fichas honesto.
NUNCA ejecutar una derrota de ETERNO sobre la partida real.
Pendiente: victoria (img 2) y resonancias (img 3) animadas; auditoría visual transversal; NOVEDADES + parches;
mejoras puntuales del gacha (las hace el agente del casino); AgentGameEngine (fase F).
Bloqueado: leer la partida real (Claude in Chrome desconectado; pedir export al jugador).

## Pruebas

- `npm test` (vitest): catReactivity, secretClues, catQuery (+ las de los subagentes).
- Headless (puppeteer, `?save=late-game|post-story`): img1 diálogo, img5-6 hábitat NV 40→41 en vivo,
  Santuario búsqueda/historial, PreBatalla+CrewSelect, Catdex cabecera/ficha/refresco, CatPanel pop.
- Final: H29 aparece al cerrar H23–H28; sims de 16 semillas por perfil para calibrar (ver finale.ts).
- Disco: el Mac quedó en 0 bytes una vez; se limpiaron solo cachés regenerables de perfiles de prueba.

## Auditoría visual transversal (subagente, 1600×900 y 1600×1000)

Corregidos: CRÉDITOS bajo BORRAR PARTIDA (Ajustes, fila 2 por ancho real) · CAMBIAR A <barco> bajo ¡ZARPAR!
(Encargos) · tarjetas de MISIONES fuera de la columna (modo compacto / "+n") · ayuda del HUD de batalla
sobre la barra de gatos (placa anclada a la pantalla real) · línea de poder del Astillero (wrap) ·
"recomendado" de la flota (2 líneas + …) · etiqueta sobre ★N del Altar · derrota con bandas a 16:10 ·
BÚFER del hábitat · nombre/nivel de camarotes · "Zona III" sobre el mástil · texto de dev en la Tienda ·
pines de misión a 9 px (ahora 2 líneas + …) · banner "necesita casa" · etiqueta NV mínima 14 · etiquetas
de 11 px del Santuario y camarotes. Global: `Button` ajusta su texto (encoge ≤28% y luego 2 líneas).
Pendiente (menor): textos de 13 px en ~60 lugares (se ven a 10.8 px), placa del REINO en el HUD a 16:10,
título del Podio vs subtítulo, compás del mapa.

## Partidas a prueba de pérdidas (2026-10-08, tras perder el jugador su isla)

Causa probable no determinable (Chrome compactó su base a las 18:41 y descartó versiones viejas; no hay
Time Machine). Riesgos reales encontrados y cerrados: NUEVA PARTIDA en la portada borraba sin preguntar;
dos ventanas (pestaña vieja + PWA) se pisaban cada 10 s; una sola copia "-undo"/"-borrada" que se
sobrescribía. Nuevo: `core/vault.ts` (historial IndexedDB con resumen, carpeta del jugador con .nocat vía
File System Access, descargar/abrir .nocat, `storage.persist()`), `ui/saveGuard.ts` (Web Lock de escritor
único + aviso), guardia en `G.save()` (nunca escribe con menos playMs que el disco), confirmación de
nueva partida, `file_handlers` .nocat en el manifest. Tests: `tests/saveSafety.test.ts`.

## Rendimiento (medido 2026-10-08, headless Chrome con GL por software: tareas largas de CPU son fiables, FPS absolutos no)

| Acción (late-game) | Antes | Después | Cambio |
|---|---|---|---|
| Abrir Catdex | 61 tareas largas, 5.5 s de hilo bloqueado, ~7 FPS | abre al instante; cartas en streaming (`core/sliced.ts`) | arte por lotes + solo lo visible primero |
| Cargar los 86 gatos (2ª sesión) | 62 tareas largas, 5.4 s | **0 tareas largas**, 1.1 s en segundo plano | `art/rasterCache.ts` (WebP en Cache Storage por build) |
| Abrir Santuario (peor cuadro) | 507 ms | 68 ms | solo arte de tus gatos |
| Entrar a batalla (peor cuadro) | 472 ms | 117 ms | idem |
| Pre-batalla / ESTIMACIÓN | 449 ms + sims de 50–120 ms en el hilo principal | sims en Web Worker: **0 tareas largas**, paridad exacta (72.5/0/70% iguales) | `workers/estimate.worker.ts`, respaldo automático |

| Memoria tras 3 rondas isla→batalla→isla | 124 → 326 MB (+67 MB/ronda, tras GC forzado) | 123 → 154 MB (+7–10 MB = cachés) | **fuga de Pixi v8**: `Graphics.destroy({children})` no destruye su contexto propio; `core/pixiFixes.ts` + `tests/pixiLeak.test.ts` |

## Decisiones

- No migrar a AgentGameEngine todavía: su render es un pipeline de triángulos sin texturas/sprites/texto
  (Pixi v8 ya lo hace mejor). Reutilizable más adelante: tick determinista + replay, `Saves`, `Jobs`,
  `AssetManager`, `audit()` de layout, patrón AgentService/MCP. Ver informe inicial.
