# MECÁNICAS-IMPL (ronda 4, oleada 2)

- **Qué estoy haciendo**: TERMINADO. Quinta entrega: **los Actos II, III y IV (H75–H92)**. La Parte III encadena de H66 a H97 sin huecos; H92 pone `p3_final` y despierta el final. Sin commits ni push.
- **Verde al cierre (quinta entrega)**:
  - `tsc` limpio, incluido `src/film/**`.
  - `vitest`: 73 archivos + 1 saltado, 913 pruebas (2 saltadas).
  - `verify-missions --all`: 194 OK o dormidas.
- **Partida completa sin pantalla del final** (Chrome headless, 14 min), de `h93-final` a H97:
  - Las 11 películas reales de CINE, incluidas F31 (`f31_luz`) y F36 (`f36_mira`), que llegaron durante el trabajo. Las puertas «Toca el faro», «Seguir» y «Díselo» se tocaron como lo haría un jugador.
  - El asedio terminó sin pantalla de victoria; el estado pasó de sin llama a llama 30, y luego a muerta y duelo; el duelo terminó en «Continuará».
  - `ext.fin` quedó con `llama 30`, `faro naranja`, `linterna estante`, `quedo` y `premios`.
  - «Volver a ver» lista las 11 películas.
  - Al recargar no se repite nada, la voz del tip es BITÁCORA y ella no aparece.
  - 0 avisos o errores de consola.
  - Aparte, se verificaron «A oscuras» en modo batalla (2 turnos con disparo y MIRA en el turno 3), el camarote gris de Canelo y «Lo que quedó» sobre la Bitácora.
  - Capturas en `<scratch>/mi/shots-final/`, `shots-osc/` y `shots-quedo/`.
- **Verde al cierre (cuarta entrega)**:
  - `tsc` limpio, incluido `src/film/**`.
  - `vitest`: 70 archivos + 1 saltado, 854 pruebas (2 saltadas).
  - `verify-missions --all`: 176 OK o dormidas; H93–H97 figuran como DORMIDA hasta `p3_final`.
- **Partida completa sin pantalla** (Chrome headless, 14 min), de `h69-acto1` a H74:
  - Siete películas reales de FILM-ACTO1: F01, F02, F03, F05, F06 completa, F07 y F08. F04 salió por su respaldo, con el orden elegido parque → Hipo-Mart → Donería (la página tenía el código de antes; las seis partes de F04 quedaron conectadas después y probadas en `acto1.test.ts`).
  - La dona elegida, todas las tarjetas CAMBIÓ y nuevas, y las tres peleas de historia.
  - «Volver a ver» lista las 7 películas.
  - Al recargar no se repite nada (0 diálogos o tarjetas en 40 s).
  - 0 avisos o errores de consola.
  - Capturas en `<scratch>/mi/shots/`.

## Quinta entrega: los Actos II–IV (H75–H92) ⚠️ SPOILERS

Textos de NARRATIVA **literales**: las líneas de los guiones (`historia-v2/guiones/acto-2…4`) se extrajeron por sección con un script y quedaron en 51 beats `b75_…`–`b92_…`; las tarjetas son las del mapa (§4.1, §5.1, §6.1).

1. **Las cajas en datos** (`regiones.json`):
   - **Superhéroes**: línea S-1…S-9 + el encuentro El Estambre.
   - **Anime**: llave de torneo a1…a9.
   - **Libros**: estante l1…l9; los tres cuentos van en el orden que elijas.
   - **POP**: gira p1…p9; las fechas van en el orden que elijas.
   - Cada caja trae su forma, su regla (`dims[].rules`), plantel por tipo de etapa (02-loop §6.4), puertas (historia + 25 huellas + oro), aspecto, música de la Carta, el cataclismo de la caja en su élite y las películas de presentación.
   - Suplentes marcados en `$captain`.
2. **Reglas nuevas** (`game/src/battle/actRules.ts`, deterministas, con estado en un WeakMap):
   - **Onomatopeya** (Superhéroes): un golpe fuerte deja letras sólidas que tapan el siguiente tiro.
   - **Poder** (Anime): un gato bajo el 50 % de vida carga aura una vez (×1,25).
   - **Capítulos** (Libros): cada 3 turnos cambia la página: lluvia, calma, raíz.
   - **Ritmo** (POP): parejas del mismo elemento en el beat; la estimación cuenta la mitad de los tiros, sembrados.
   - De historia: **Duelo limpio** (Itō: un tiro, sin cañonazos), **Pausas** (el rescate de Cruceta; Brecha, Bisagra o los Disruptores), **Enredo** (El Estambre), **Corrección** (los Correctores), **Esquirlas** (Esquirla; un tiro de luz las saca) y **Pose de portada** (Firma).
   - Se agregaron `dark` (H85) y `luz` (su linterna dibuja las trayectorias: H87 y el asedio).
3. **Misiones H75–H92** encadenadas.
   - Los flujos son DATOS (`game/src/app/actsFlow.ts`: lines, film, battle, choice, llama, dark, faro, gate), con cada paso guardado como beat.
   - Batallas de actividad en `game/src/state/sys/actBattles.ts`: H80 tres arcos, H84 tres cuentos, H90 tres fechas.
   - Elecciones guardadas: la cobija (`cobija:*`), los finales (`final_*`), el mapa para Brecha (`p3_mapa_brecha`, que cambia F25 y el asedio de H93) y la foto (`foto:*`, con su palabra).
   - **H92**: el regreso jugable (la película arranca al tocar el faro; `ui/story/faroTap.ts`) → F30 → `p3_final`.
4. **La llama de Canelo**: baja 5 % con cada caja que cruza (95 → 90 → 85 → 80), queda fija en **60 % desde H85** y se ve en su carta de tripulación y en la Bitácora.
5. **Películas**: las presentaciones se buscan por `stages/nodes[].film` («F09» encuentra `f09_…`). Las de historia y canción van por el flujo: F12, F14 en tres partes (`f14_1…3`), F16, F17, F19, `h85_oscuridad`, F21, F23, F25 (o `f25_bisagra` sin el mapa), F27, F29 y F30. «Volver a ver» las lista una vez vistas.
6. **Fixtures** (`game/scripts/make-act-fixtures.ts`, reemplaza a `make-h93-fixture.ts`): `h75-acto2`, `h83-acto3`, `h89-acto4` y `h93-final`, jugados con los sistemas reales (compras a Maneki, batallas, elecciones).
7. **Pruebas**: `game/tests/acts.test.ts` (nueva, 16): datos, recorrido por acto con recargas, las reglas y la cadena completa H66→H97.

### Calibración (12 peleas por celda, Bastión)

| Pelea | h65 | raros40 |
|---|---|---|
| S-5 | 92 % | 58 % |
| S-9 | 83 % | 100 % |
| El Estambre | 92 % | 83 % |
| A-5 | 75 % | 58 % |
| A-9 Itō | 75 % | 92 % |
| L-5 | 100 % | 83 % (con 1,35); quedó en 1,48, entre 67/42 y 100/83 |
| L-6, el derrumbe | 83 % | 92 % |
| L-7, los Correctores | 100 % | 67 % |
| L-9 Esquirla | 92 % | 50 % |
| P-5 | entre 83/25 y 100/67 (quedó en 2,2) | |
| P-9 Firma | 75 % | 58 % |

- Las actividades y las etapas normales dan casi siempre 100 %.
- Las reglas sin Mareo hacen las peleas mucho más fáciles que la Borracha: los multiplicadores son altos.
- Las que cierran con canción al 50 % (Itō, Correctores, Firma) necesitan ×3–5.
- El abanico fuerte/débil sigue (el tope del espejo es una decisión pendiente del dueño).

### Lo que no se hizo (simple, a propósito; se anota)

- La regla propia «Costura» de La Encuadernadora: la regla de la caja ya cambia cada capítulo.
- La barcaza civil y el «grado de daño» de El Estambre: sí está el enredo.
- La actividad «Patrulla».
- El espejo de «tu gato más fuerte» en A-5: ya mide «la caja te mide».
- Los gatos que se unen en la historia (Gato Araña, Murciégato, EMIAU, Gato Malo…): no hay arte aprobado, y `P3_MULTIDIM` está apagada.
- El ataque visual de Canelo en Anime y el cuarto libro «final ilegible» hasta H96.
- En Ritmo, la puntería del jugador sobre el beat real: hoy el beat es sembrado (la mitad), igual en la batalla y en la estimación.

## Cuarta entrega: el final «Se apaga» (H93–H97) ⚠️ SPOILERS

Textos de NARRATIVA **literales** (`historia-v2/guiones/final/`); las tarjetas son las del mapa `02-mapa.md` §7.1. Películas de CINE (`game/src/film/films/final/`).

1. **Misiones H93–H97** (`historia.json`): «La noche más oscura», «Sin llama», «Lo que no se ve», «El recado» y «La última ronda».
   - Cada una es `use_feature` y la cumple su propio flujo. La cadena sale de `mission:H92`.
   - **Dormidas** en `MISSION_GATES` con el flag `p3_final` (`FINAL_GATE` en `missionGoals.ts`). Lo pone quien integre H92, y lo pone la fixture.
   - Sin premio en el momento (`reward: { std: false }`): es el duelo. Los premios (40 gemas) llegan en silencio en «Lo que quedó».
   - El `goal.text` y el `why` los armé con frases de las tarjetas. Ninguno dice «protégela», «sálvala» ni «aguanta» (hay una prueba que lo revisa).
2. **Flujos** (`game/src/app/finalFlow.ts`, nuevo; el director despacha `h9…` ahí). Cada subpaso se guarda como beat (índice §4):
   - **H93**: F31 (CINE ya la tiene como `f31_luz`; la pido por prefijo) → «El asedio» 1 de 2 (Cruceta) y 2 de 2 (Firma). Se puede perder y se reintenta sin costo («¡OTRA VEZ!» o «AHORA NO»). Al ganar **no hay pantalla de victoria**: F32. CAMBIÓ «SIN LLAMA.» con su letra, temblando.
   - **H94**: F33 con sus puertas («Toca el faro» a los 90 s) → F34 parte 1 → **el desayuno** opcional (R8: tocas gatos y les das dona; el golpe llega a mitad, o con SEGUIR) → F34 parte 2 → **SADIE**.
     - El beat de SADIE se guarda **antes** de que suene: nunca se repite, y desde ahí ella está muerta y empieza el duelo.
     - Después, «A oscuras»: 3 turnos sin derrota posible, solo los ojos de tus gatos, y «MIRA» sobre Canelo en el turno 3. Cuando exista F36, la fase queda solo en el toque de «MIRA». Luego F36.
   - **H95**: F37 (la linterna queda en el escalón) → F38 (puerta «Seguir»).
   - **H96**: F39 (puerta «Díselo», faro naranja, créditos, «Continuará»; ahí termina el duelo). Sin la película, el respaldo muestra la nota de la Parte I con el nombre del jugador, lo que ella le dijo esa noche en gris y el botón DÍSELO.
   - **H97**: la próxima vez que se abre la Carta: F40.
   - Las tarjetas de H93–H96 salen en casa y las de H97 en la Carta.
3. **Canelo**:
   - **La noche** (de H93 hecha al amanecer): su camarote sigue siendo suyo, pero en gris («SIN LLAMA») y no zarpa (`ship.benched`, `crew()`, `autoCrew`, `setCrew` y el panel `CrewSelect`).
   - **La llama al 30 % para siempre**: va en el campo aditivo `ext.fin.llama`, que nunca sube. Se ve en su carta de tripulación («LLAMA 30 %») y en la Bitácora («CANELO · LLAMA 30 %»).
4. **Estado guardado `ext.fin`** (`game/src/state/sys/finalState.ts`, nuevo): `llama`, `faro`, `linterna`, `quedo` y `premios`.
   - Nunca se crea al cargar. El normalizador solo repara: aparta una sección rota (`finBroken`) o un campo roto (`<campo>Broken`).
   - Sin `SAVE_VERSION` nuevo. Migraciones probadas.
5. **Después de su muerte nunca reaparece viva por accidente** (`game/src/ui/story/ghost.ts`, nuevo):
   - Una línea suya en `say()` pasa a ser una nota de la Bitácora, sin cara.
   - `tip()` deja de usar su voz por defecto.
   - NOVEDADES pierde su línea; el informe al volver, los prompts, las recompensas y el retrato de nombrar gatos esconden su retrato.
   - El faro de la isla no habla y se apaga; con H96 se prende naranja.
   - En MISIONES y en el Reino firma «— de la Bitácora de L.» / «— L.».
   - «Volver a ver» es el único lugar donde se la ve (`asMemory`).
   - `luzternaFallecida` sigue derivada: SADIE empezó o H94 está hecha (antes decía H93).
6. **El duelo** (de SADIE a «Continuará»): sin tips, sin NOVEDADES, sin paneles ni banners del reino, sin explicaciones ni beats viejos. Solo siguen las tarjetas y los flujos del final (`story.ts`, `dueloMuted`).
7. **La Bitácora cambia de mano**: H93 es de ella (CAMBIÓ temblando); H94 es de ella hasta CAMBIÓ, que escribe el Capi; de H95 en adelante, todo es del Capi (`handOf`, `CAPI_HAND`: Playfair itálica en tinta de pluma; ARTE puede cambiarla en un solo lugar). La primera vez que se abre después de «Continuará» sale **«Lo que quedó»**: la lista escondida, tachada por ella, y el sobrecito.
8. **Batallas** (`game/src/state/sys/finalBattles.ts`, nuevo):
   - Usan la misma política de la Carta.
   - La simulación ganó la regla `undying` (un lado no puede perder).
   - `BattleScene` ganó `spec.final`: `quietWin` (sin jingle, confeti ni tarjeta final), `dark` y `mira`. Lo visual de las dos últimas está en `battle/ui/finalFx.ts`.
   - Suplentes: Cruceta = Supernova, Firma = Diva y los barcos de tinta = Tachón, Tintero y Titiritera.
   - Falta, porque depende de los Actos II–IV: Luzterna que ilumina las trayectorias, y los Disruptores o Bisagra según el mapa de H87.
9. **«Volver a ver»** lista las películas del final una vez vistas (las de prefijo con el título de la historia).
10. **Fixture**: `game/scripts/make-act-fixtures.ts` → `game/test-saves/h93-final.json`. Parte de h69-acto1, juega el Acto I con los sistemas reales, da H75–H92 por hechas y pone el flag.
11. **Pruebas**: `game/tests/final.test.ts` (nueva, 15). Revisa:
    - Datos literales y dormidos.
    - Ningún fixture despierta el final.
    - El recorrido H93→H97 con recargas en cada paso: el asedio perdido y reintentado, SADIE una sola vez, la llama, la noche.
    - DÍSELO con el nombre del jugador.
    - `ext.fin` y sus migraciones.
    - La guarda de la voz, con un escaneo de `src`.
    - El cambio de mano.
    - Las batallas: «A oscuras» no se pierde con ninguna semilla.

## Tercera entrega: el Acto I «La noche que no se reinicia» (H70–H74)

Textos de NARRATIVA **literales** (`historia-v2/guiones/acto-1/`, mapa `02-mapa.md` §3), con las pasadas de TEMPERATURA: la 4 (en H73 contesta Doña Espuma «Empieza por las catorce rondas.», nadie responde a «pago yo») y la 5 (R7: «¿Cuál luz?» lo dice Canelo; el silencio de Borrón es miedo, «Si lo digo, me borran otra línea.»; en H72 la bufanda se acomoda sin «Es mi bufanda / Es horrible»). Releídos los guiones a las 20:39: coinciden línea por línea.

1. **Misiones** (`game/src/data/gateras/historia.json`): H70 «Borrón» (`use_feature p3_borron`), H71 «NINGUNA CAJA ES HOGAR» (gana `p3d_borracha_ebrecha`), H72 «La resaca» (`use_feature p3_resaca`), H73 «La Batalla de Gatos» (gana `p3d_borracha_eemiau`), H74 «El Cadenero» (gana `p3d_borracha_9`). Cada una se dispara con la anterior. Las tarjetas de 5 campos son las del mapa §3.1. El `goal.text` y el `why` los armé con frases del mapa y los guiones (NARRATIVA no los escribió): que los revise.
2. **Escenas** (beats `b70_…`–`b74_…` en `historia.json`; quién y cuándo en `ui/story/gaterasScript.ts`; el flujo en **`game/src/app/acto1Flow.ts`**, nuevo). El director (`app/story.ts`) ganó `special: 'flow'`. Cada flujo guarda sus **subpasos** como beats: al recargar sigue en el siguiente, nunca repite lo visto.
   - H70: la Donería, **«¿CUÁL DONA?»** (se guarda `dona:<id>`; vuelve en H96), F02 (o su respaldo), la ficha → H70 hecha.
   - H71: el cierre en La Última Ronda después de la pelea.
   - H72: F04 son **seis películas** de FILM-ACTO1: `f04_prologo`, **los tres lugares en el orden que elijas** (`f04_doneria` / `f04_hipomart` / `f04_parque`), `f04_bar` al final y `f04_epilogo`. Si falta una, salen sus intertítulos. Al terminar, H72 hecha.
   - H73: la entrada (la turba) → la Batalla → **F06 EM%EN** → un plano quieto, sin música, 5,5 s → el cierre.
   - H74: la lista → El Cadenero (F07 + pelea) → el aviso **en silencio** (sin música) → **F08 OH SHIT**.
   - Las tarjetas CAMBIÓ esperan a su escena (`after`). `catchUp` reencola los ON_DONE del Acto I si se cerró la pestaña en medio.
3. **Películas**: las de historia van por `playStoryFilm(id, respaldo)` (`app/stageIntro.ts`). Las presentaciones van por `stages[].film` / `nodes[].film`: F03 Brecha, F05 EMIAU, F07 Cadenero; F01 ya estaba en B-5.
   - Si FILM-ACTO1 registró la película, suena la película (las canciones no se saltan la primera vez); si no, el respaldo son las líneas del guion como diálogo.
   - Al terminar se guarda `film:<id>` (minúsculas).
   - **«Volver a ver»** (`panels/Replays.ts`) lista las películas vistas con sus títulos sin spoilers (`FILM_TITLES`) y las repite con `replayFilm`.
4. **Peleas nuevas** (`regiones.json`, nodos de la Borracha):
   - **Brecha** (`ebrecha`, encuentro, se revela con H70): mareo y 3 escombros que caen.
   - **EMIAU** (`eemiau`, se revela con H72): regla nueva **«Rima»** en `battle/barRules.ts`. Repetir elemento ×0.8 con «¡BUUU!»; cambiarlo ×1.1 con «¡OOOH!». La fase EM%EN al 50 % cierra la pelea.
   - **El Cadenero** (B-9): ahora pide `mission:H73`. Regla **«Lista VIP»**: cada turno aturde a tu gato más fuerte mientras el Cadenero siga en pie. Línea «Esta noche no pasa nadie.».
   - Chips en la batalla, líneas en la presentación. Superhéroes pasa a `story: mission:H74`.
5. **Suplentes** (no hay arte todavía), con su nombre canónico en pantalla: Borrón = tintero, Homiau = sol, EMIAU = `s_caos` (neón), El Cadenero = Bastión. Hipólito y Don Bombín no se entregan como gatos: falta su pintura.
6. **Calibración** (32 peleas por celda):

   | Pelea | h65 | raros40 |
   |---|---|---|
   | Brecha | 97 % | 72 % |
   | EMIAU | 81 % | 66 % |
   | El Cadenero con VIP | 78 % | 50 % |

   La regla «el que lo derribe gana el turno» de la Lista VIP quedó a medias (es una propuesta).
7. **Fixture**: `game/scripts/make-h69-fixture.ts` → `game/test-saves/h69-acto1.json`. Parte de h65-normal y juega el prólogo con los sistemas reales: H66–H68 hechas, B-1…B-4 ganadas, H69 activa.
8. **Pruebas**: `game/tests/acto1.test.ts` (nuevo). Datos, el paseo H69→H74 con la fixture, recargar en medio, sin bloqueos y películas. Se ajustaron `gaterasCimientos`, `gaterasNodes`, `stageIntro` y `p3Politica`. `missions.ts` ignora ids activos desconocidos (antes `checkMissions` se caía con `rupturas-raro`).
9. **Arreglo en La Ronda** (de la segunda entrega): el hash que reparte las condiciones dejaba la **misma mezcla en todas las rondas** al ~12 % de las partidas (la semilla sale de la hora en que se abrió la caja). Por eso la prueba fallaba a veces. Le agregué la mezcla final de murmur3 (`h01` en `state/sys/gateras.ts`) y una prueba con 300 semillas. La Ronda no está publicada: no afecta a ninguna partida real.

## Segunda entrega (pedido del coordinador)

1. **Carta multi-caja completa** — `game/src/scenes/GaterasMapScene.ts` ya no nombra ninguna caja (sin `const B`).
   - Modelo puro `game/src/scenes/cartaModel.ts`: cajas y su aspecto, nodos de todas las cajas abiertas con clave `<dim>:<nodo>`, rutas y caja de la cámara (la de la última pelea, si no la más lejana abierta).
   - Registro de aspectos: `tv`, `sheet` (hoja abierta con ventana en la paleta de la caja), `blank`, y `registerBoxLook(id, builder)` para cómic, tesoro, estante o póster.
   - La escena guarda `selected: { dim, node }`. Título de Maneki y música salen de los datos (`dims[].gatera`, `dims[].music`). Las líneas de la Borracha solo suenan en la primera caja.
   - Verificado en el navegador con una segunda caja armada en datos: hoja, nodos, ruta, barquito y tarjeta «CIUDAD MAYÚSCULA · C-2», sin errores. Prueba: `tests/p3Carta.test.ts`.
2. **Desvío «Trastienda» y La Ronda** sobre el esquema de nodos.
   - Dos perillas de simulación en `battle/sim.ts`, con la razón nueva `'condicion'`:
     - `turnLimit` («LA ÚLTIMA Y NOS VAMOS»).
     - `intact` («SIN DERRAMAR», con `allow`: se permite perder 1 módulo; con 0 era una moneda al aire).
   - Catálogo, chips y líneas en `battle/ronda.ts`; chips y texto de fin en `BattleScene.ts` (dos líneas).
   - La Ronda (`dims[].ronda`, nodo `a1`, se abre al ganar B-5): 4 locales armados sobre B-3/B-2/B-1/B-4, más livianos y sin botellas. Cada uno lleva una condición sembrada (dos de cada una, la misma al recargar, otra mezcla en la siguiente ronda). Terminar la primera ronda pone `ronda_borracha_1` y revela el desvío. No da huellas.
   - Desvío d1 → d2 → d3 (sale de B-3): d1 «gana en 3 turnos», d2 «sin derramar», d3 el rescate de Don Bombín (se anuncia; se entrega cuando haya pintura). 3 huellas cada uno.
   - Estado aditivo `acts` / `nodes`. La API de batallas acepta cualquier nodo (`gateraBattleDef`, `buildGateraBattle(dim, 'd1' | 'r2' | 3)`), igual que la Carta, la tarjeta, la presentación y el sello («LA RONDA: 3 DE 4», «¡DESVÍO REVELADO!»).
   - Balance (24 peleas): locales 54–100 %, d1 75 % h65 / 42 % raros40, d2–d3 96–100 %. Prueba: `tests/p3Ronda.test.ts` (incluye una porción v1 sin `acts`).
3. **«Con el Bastión: N %»** — `withShip`, `shipAdvice` y `pickShipAdvice` en `gaterasBattles.ts`.
   - Cuando la estimación termina, simula la etapa (20 peleas) con cada otro barco tuyo que no esté en reparación, con su tripulación o sus mejores gatos.
   - Si uno gana 15+ puntos más, la tarjeta lo dice. Nada se guarda. Prueba en `tests/p3Politica.test.ts`.
4. **Numeración H70–H97: solo plan, sin andamio** (`docs/part-iii/mecanicas-v2/04-misiones-h70-h97.md`). Una misión en los datos se activaría sola y sus textos son de NARRATIVA.
   - Guardián: `tests/p3MissionPlan.test.ts`. Toda misión H66+ entra completa o dormida en `MISSION_GATES`; un `win_battle` de la Carta tiene que nombrar una batalla jugable; la puerta de historia de cada caja, una misión que exista.
   - Cuando exista H74, Superhéroes pasa a `story: mission:H74`.

## Primera entrega (pasos 1–9)

1. **Techo H99** — `MISSION_ID_RE = /^[HCKE]\d{2,3}$/` en `game/src/state/sys/missions.ts` (los `unlocks` que son misiones nunca se guardan como flag) y la misma regex en `game/scripts/verify-missions.ts` (+ `pad(r.id, 5)`). Ids de nodo de varios dígitos: `parseBattleId` → `{ dim, node, n }` (`10`, `d1`, `a2`, `e…`), `GATERA_BATTLE_RE` también en el IR de `game/src/app/cajasFlow.ts`. Prueba: `tests/missionIds.test.ts` (H100 sintética con `unlocks: ['H101','flag_x']`, orden numérico de la Bitácora).
2. **Esquema de nodos aditivo** (`game/src/state/sys/gateras.ts`) — campos opcionales `nodes`, `peak`, `acts`, `enc`, `photos` (nunca se crean al cargar; una sección rota se aparta en `<campo>Broken`). Datos: `dims[].shape` (`line` por defecto · `bracket` · `shelf` · `tour`) y `dims[].nodes` (desvío, actividad, encuentro, escena) con `requires` (`'3'`, `mission:H70`, `flag:x`) y `revealedBy`. `nodeState` (cleared/open/locked/hidden), `recordNodeWin` (3 huellas por nodo de pelea, también desvíos; 10 el jefe; 0 actividades), `stageState` delega en `nodeState`. «Ganar n prueba 1…n» **solo** en `line`. Prueba: `tests/gaterasNodes.test.ts`.
3. **Precio con ingreso pico** — `notePeakIncome()` (al abrir la Carta, después de cada batalla y cada 20 s si la partida ya tiene Parte III; nunca durante la Marea ni 5 s después) y `gateraPrice = max(ingreso ahora, pico)`. Una partida sin Parte III no recibe nada.
4. **Política de dificultad** (`CARTA_POLICY` en `game/src/state/sys/gaterasBattles.ts`): EP = max(0.8 × flota potencial, tu Poder) × powerMul × banda × storyScale × peso del barco.
   - Bandas calibradas **1.55 / 1.35 / 1.5** (normal / élite / jefe; el diseño proponía 1.55/1.6/1.6 y dejaba a raros40 en 47 % en la élite).
   - Espejo «la caja te mide» **k 1.5**, tope ×2.2, como perilla `mirror` de `buildSiege` (`state/sys/campaign.ts`; sin el campo nada cambia: probado con batallas de la Parte I y la II).
   - Piso por flota potencial **debajo** de los multiplicadores (con el piso afuera, como decía la fórmula del diseño, un solo gato común en el Bastión ganaba B-5 84 % y B-9 94 %: la trampa seguía abierta; ahora 38 % / 78 %).
   - Peso por barco y tipo de etapa (Bastión 1 · Bajel 0.75/0.75/0.65 · Merodeador 0.6/0.6/0.45 · Gorrión 0.5/0.5/0.4): reemplaza el piso fijo de 3 000. El jefe pesa menos en barcos chicos porque sus botellas no escalan con tu casco.
   - Cataclismo de la caja en la élite desde los datos (`stages[].cata`: luna, cada 3 turnos, potencia 0.6, pega según TU casco).
   - `CARTA_POLICY.off = true` devuelve la porción de antes (para comparar). Prueba: `tests/p3Politica.test.ts`.
5. **B-6…B-9 + El Cadenero** jugables (`game/src/data/gateras/regiones.json`, valores de `02` §3.1) con **SUPLENTES** marcados en `$captain`: La Embotelladora = Vapor Ronin · Don Bombín = Titiritera · «La que no sale del baño» = Diva · El Cadenero = Bastión (épico). Líneas marcadas `$line: BORRADOR` (NARRATIVA las reemplaza). El Cadenero: banda jefe y fase 2 al 50 % «¡CIERRA LA PUERTA!» (calma + botellas cada turno, una más: `FASE_EFFECTS.mareoPuerta` en `game/src/battle/mareo.ts`). B-4 marcada `teaches: ['sound']`. Sellos por etapa (`stamp`), películas B-5 `F01` y B-9 `F07`. Planes de música de B-6…B-9 en `data/music/battles.json` (el loop de `drunck.battle`; MÚSICA puede darles su plan). **Puerta de 25 huellas abierta**: B-1…B-9 dan 34; Superhéroes `story: flag:won_p3d_borracha_9` (provisional hasta la misión de NARRATIVA). La Carta ya no dice «Hasta aquí dibujó Luzterna» al ganar B-5.
6. **Gancho de presentación** — `game/src/app/stageIntro.ts`, llamado dentro de `startGateraBattle` (`app/cajasFlow.ts`): arma el spec y lanza la estimación **antes**; luego película de CINE si existe → plantilla de CINE si la registró → **tarjeta animada** `game/src/ui/briefingCard.ts` (7.2 s: QUÉ PASA · CONTRA QUIÉN con la pintura del rival · SU REGLA con la demostración · QUÉ ARRIESGAMOS + «CON ESTA TRIPULACIÓN: N %» en vivo; ¡ZARPAR! / VOLVER; «Reducir movimiento» respetado). Vista una vez → no se repite (la tarjeta de 3 s de la batalla es el recordatorio); después de una presentación completa se quita la tarjeta de intro de la batalla (sin tarjeta doble). **`game/src/battle/demo.ts`**: `ruleDemo('mareo' | 'donas' | 'botellas', cfg)` calculado con `Battle.integrate` (el mismo tiro en el centro y en el borde del vaivén: «en el centro le das al cañón; en el borde cae en el agua»; dona vs barco; las botellas sembradas). Prueba: `tests/stageIntro.test.ts`. Verificado en el navegador: la tarjeta de B-5 se ve bien y sin errores de consola.
7. **Sello de victoria** — `game/src/ui/victoryStamp.ts` + `victoryStampOpts` (puro, en `gaterasBattles.ts`): en la primera victoria cae el sello de la etapa sobre un papel, las huellas, «B-6 ABIERTA», «¡FOTO DEL VIAJE!» (élite/jefe → `ext.gateras.photos`), «CAJA VENCIDA», «YA ALCANZAN LAS HUELLAS: CIUDAD MAYÚSCULA». Repetir: el aviso de siempre. **`tests/p3Rosters.test.ts`**: la regla de planteles de `02` §6.4.
8. **MULTIDIMENSIONAL detrás de `P3_MULTIDIM`** (apagada): `RarityId` + todas las tablas por rareza (`balance.json` rarities.* y `kingdom.xp_rewards_pct_of_bar.hatch` con los valores de `02` §7.1, `ui/theme` RARITY, impresión de carta, los RANK, `RARITY_MASS`, orden de colección). `game/src/state/sys/multidim.ts`: orden de poder entre legendario y mítico, al final en la interfaz, `poolable()` (Casino, Portal y Resonancia la excluyen). **Una sola `RARITY_H`** (`game/src/art/rarityHeight.ts`) reemplaza las 6 copias (la de `paginas.ts` era parcial; ningún residente de Páginas es mítico+, así que no cambia nada en pantalla). `rarities.order` intacto: con la bandera apagada nadie la ve. Prueba: `tests/rarityFinite.test.ts`. Sin gatos nuevos.
9. **Carta multi-caja (parcial)**: la característica de misión por caja (`feature_p3_gatera_<caja>`), la bandera `won_<id de batalla>` genérica, la clave de estimación sin literal, etiqueta y aspecto de batalla desde los datos (`dims[].code`, `dims[].battle`). `tests/p3Carta.test.ts`: una segunda caja con etapas en datos arma sus batallas sin código de la Borracha, y ningún literal `p3d_borracha` nuevo entra al código (lista de permitidos).

## Balance (antes → después, 32 peleas por celda; la confirmación con 64 da h65 78 % / 77 % y raros40 55 % / 55 % en B-5 / B-9 del Bastión)

| Barco · tripulación | B-5 élite antes | B-5 después | B-9 jefe antes | B-9 después |
|---|---|---|---|---|
| Bastión · h65 | 100 % (−8 % casco) | **81 %** (−28 %) | 97 % (−13 %) | **78 %** (−25 %) |
| Bastión · raros40 | 100 % | **53 %** | 88 % | **56 %** |
| Bastión · medio40 | 100 % | 100 % | 97 % | 78 % |
| Bastión · un solo gato (trampa) | — | 38 % | — | 78 % |
| Bajel · h65 | 97 % | 94 % | 94 % | 81 % |
| Bajel · raros40 | 53 % | 44–55 % | 53 % | 59 % |
| Merodeador · h65 / raros40 | 97 % / 19 % | 97 % / 66 % | 84 % / 12 % | 97 % / 62 % |
| Gorrión · h65 / raros40 | **28 % / 3 %** | 91 % / 72 % | **19 % / 0 %** | 88 % / 69 % |

Normales (Bastión): h65 94–100 %, raros40 66–100 %. Datos crudos: `<scratch>/cal/r1-*.jsonl` (antes), `r7.jsonl` (final), `r3.jsonl`/`r6.jsonl` (64 peleas).

## Compatibilidad de partidas (evidencia en las pruebas)

- Todas las fixtures de `game/test-saves/` (Parte I, II y h65) cargan sin crear `ext.gateras`, y guardar → recargar da lo mismo.
- Una porción v1 con B-1…B-5 ganadas (escrita por los flujos reales, y la forma que escribe la versión publicada) se lee byte por byte igual en todas las fixtures; `stageState` coincide con el modelo lineal viejo en 240 casos.
- En forma `shelf`, ganar el nodo 7 primero no marca 1–6 al recargar. Normalizador idempotente; secciones rotas apartadas.
- La guarda de `playMs` no se tocó; no hay `SAVE_VERSION` nuevo ni migración (todo es opcional).

## Contrato con CINE (el gancho ya funciona sin película)

- CINE registra un `FilmDef` con id = `stages[].film` (B-5 `F01`, B-9 `F07`, como `historia-v2/03-peliculas.md`) **o** el id de batalla `p3d_<dim>_<n>`.
- El gancho llama `getFilm(id)` y `playFilm(id, { seen })`; la primera vez `seen: false` (sin SALTAR).
- `'done'` o `'exited'` marcan visto en `ext.gateras.seen`: `intro:<id de batalla>` y `film:<id>`. «Volver a ver» puede leer `filmSeen(id)` de `app/stageIntro.ts`.
- Plantilla parametrizada: `registerBriefingTemplate((d: BriefingData) => FilmDef | null)`. `BriefingData` trae dim, etiqueta, título, PASA, rival (nombre, línea, slug, tripulación), regla (líneas + `RuleDemo` con trayectorias en coordenadas del mundo), lo que arriesgamos, huellas y `estimate()` en vivo.
- `null`, `'aborted'` o un error → sale la tarjeta. Nunca bloquea la batalla. Nada de esto toca `game/src/film/**`.

## Falta

- Arte propio de los suplentes: capitanes de B-6…B-8, el desvío, Don Bombín, Borrón, Homiau, EMIAU, El Cadenero e Hipólito.
- Las líneas `BORRADOR` de B-6…B-8: NARRATIVA no las escribió en el Acto I.
- Los Actos II y III (H75+): esperan los guiones.
- Las reglas de las otras cajas (Onomatopeya, Poder, Capítulos, Ritmo), por acto.

## Pendiente de decisión del dueño

**Del final** (construí el diseño actual):
- **El giro** («deuda falsa pagada» o no): sigue pendiente del dueño. Lo construido es el diseño vigente.
- **El quinto renglón** de la lista escondida («Morirme otra vez»): está; se quita en una línea (`LISTA_ESCONDIDA`).
- **Los textos que armé yo**, porque los guiones no los traen: el `goal.text` y el `why` de H93–H97; el desayuno («EL DESAYUNO», «Toca a cada gato para darle su dona.»); el aviso del reintento del asedio («Los barcos siguen ahí. Perder no cuesta nada: se vuelve a intentar.»); y las acotaciones (CAPTION) de los respaldos.
- **La letra del Capi**: Playfair itálica en tinta de pluma (`CAPI_HAND`). No hay otra letra a mano cargada; ARTE decide.
- **Los premios del final**: 40 gemas en silencio en «Lo que quedó» (`PREMIOS_FINAL`).

**De antes:**

1. **Momentum contado dos veces** en el oro de batalla (`econ.ts:162-163` + `island.ts:104-105`). Afecta al juego publicado: **no se tocó**.
2. **Tope del espejo ×2.2**: deja a una tripulación tope (divinos Nv100) en 56 % contra El Cadenero, menos que h65 (78 %). Es «la caja te mide» a propósito; el dueño decide si se baja el tope.
3. **4 comunes Nv35**: caen a 16 % (B-5) y 9 % (B-9). El diseño dice que nadie llega así a H66.
4. **La Borracha se endurece** en las 5 etapas que el dueño ya jugó (B-5: de 100 % a ~80 %).
5. **Bajel con h65**: la élite queda fácil (≈ 94 %). Con un solo peso no se cumplen a la vez h65 ≤ 85 % y raros40 ≥ 55 %; se priorizó el piso.

## Cómo retomar

- **Verde**: `cd game && npx tsc --noEmit -p . && npx vitest run && npx tsx scripts/verify-missions.ts --all`.
- **Calibración real** (lee `CARTA_POLICY`): `npx vite-node <scratch>/cal/p3cal.mts -- --crews h65,raros40 --ships bastion,bajel --stages 5,9 --seeds 64`. Opciones: `[--off] [--band 1.55,1.35,1.5] [--mk 1.5] [--w bajel=0.75:0.75:0.65]`.
- **Tabla**: `python3 <scratch>/cal/tab.py <archivos.jsonl>`.
- **Fixture del Acto I**: `cd game && npx vite-node scripts/make-h69-fixture.ts`.
- **Fixture del final**: `cd game && npx vite-node scripts/make-act-fixtures.ts` (parte de `h69-acto1`).
- **El final sin pantalla**: con el mismo Vite, `cd <scratch>/mi/pp && node final.mjs`. Para probar solo «A oscuras» en modo batalla, `node oscuras.mjs`; para «Lo que quedó», `node quedo.mjs`.
- **Partida completa sin pantalla** (Acto I, H69 → H74): con un Vite sin HMR en el puerto 5197 (`npx vite --config <scratch>/mi/vite.mi.config.ts`), correr `cd <scratch>/mi/pp && node acto1.mjs`. Las capturas quedan en `<scratch>/mi/shots/`. Juega escenas, elecciones, películas y tarjetas de verdad; en cada pelea fuerza la victoria en el primer turno de apuntar (después corre el fin real de la batalla).
- Scratch = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad/`. Copias de los archivos de antes de la política en `<scratch>/impl-bak/` (`historia.before-acto1.json` es la de antes del Acto I).

## Reglas

- Sin commits ni push.
- No se toca `game/src/film/**`, `momentos/songs/drunck/*`, `CajaScene.ts`, `cine/scenes/p3*`.
- La guarda de `playMs` no se toca.
- La economía de las Partes I/II no se toca.

**Última actualización:** 2026-10-26 (cierre de la cuarta entrega: el final). Ningún proceso queda corriendo.
