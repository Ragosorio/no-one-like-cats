# FILM-ACTO4 — películas del Acto IV «La gira» (ronda 4, oleada 2)

> ⚠️ Spoilers de la Parte III. Nada se commitea ni se publica sin el OK del dueño.

**Qué estoy haciendo:** terminado. Las cinco películas están entregadas, medidas y conectadas por MECÁNICAS-IMPL.

## Hecho

### Las películas (`game/src/film/films/acto4/`)

| Id | Tipo | Misión | Título | Estilo | Música | Duración | Clics |
|---|---|---|---|---|---|---|---|
| `f26` | PP | H89 · P-5 élite | El mánager | **Póster de festival** en la pared LED del estadio (los nombres caen en el beat, cada uno con su tipografía) + **pase de backstage** plastificado que gira | `xti.gira` | 31,7 s | 0 |
| `f27` | PH | H90 | Karaoke | **Fotomatón**: tira vertical de 4 fotos con karaoke (sílabas que se encienden bajo una pelotita que rebota) y *flash* que congela cada foto | `xti.gira`; **sin música desde la foto 4** (`quiet`) | 70,6 s | 1 («¡APLAUDE!») |
| `f28` | PP | H91 · P-9 jefe | Firma | **Portada de revista** (papel couché, titulares en relieve) que se abre en un **teaser de videoclip** (scope, cortes en el beat, destellos, cuenta regresiva) | `no_game.start` («PRESS START») | 34,7 s | 0 |
| `f29` | PC | H91 (cierra la batalla) | El show | **Videoclip que se vuelve videojuego**: pantalla de inicio → estadio con LED y celulares 9:16 → HUD que se come el show **capa por capa** (c14,021 · c27 · c38 · c57) → nivel de 8 bits → la caja se raja → la isla por la rasgadura | **NO G@ME NO LIF€**, completa (c1 → fin) | 3:25,9 | 3 («PRESS START» c4 · «¡LUCES!» c19 · «¡ATRAPA!» c58) |
| `f30` | PC | H92 | La noche estrellada | **Van Gogh**: *La noche estrellada* hecha tu isla; todo en pinceladas sobre campos de flujo; el haz del faro es un remolino más; la palmera es el ciprés; al final, lienzo craquelado | **xti es amor**, completa | 3:18,0 | 3 («Toca a Cerito» c38 · «Toca a Canelo» c78 · «Mira las estrellas» c90) |

Cada archivo `index.ts` trae su guion plano por plano en el comentario de arriba (tiempos y compases).

**F29, compás por compás (la distorsión por capas):** las escenas caen sobre los marcadores del mapa de pulsos (`distortion_1` c14,021 → `falla`; `distortion_2` c27 → `trampa`, con las dos pantallas que se contestan compás por compás; `distortion_3` c38 → `pirata` y el paso a 8 bits; `climax` c57 → `ruptura`; `call_response_2` c66 → el *ping-pong* isla/estadio; `end` c77 → las pantallas que se apagan con el eco). La prueba lo verifica contra `no_game.json`.

**F30, sobre sus secciones:** pad solo (cielo, balcón, la isla), bembé (un gato cada dos compases, en el golpe), break (Cerito aprende a entrar en la luz), tutti (el fuego, el pescado compartido, el solecito «para mañana»), break largo (Cronos, **nadie voltea**), pad solo (la llama de Canelo baja sola mientras duerme), tutti 2 (se duermen uno a uno), cierre (ella vigila; lienzo; se apaga). Toda la noche está coreografiada en **tiempo de canción** (`f30/world.ts`): cada escena es una cámara sobre el mismo mundo pintado.

**Reglas del acto que se cumplen:**
- De Luzterna, **nada** sobre su mortalidad: ni bufanda, ni tejido, ni regalos, ni frío, ni sombra (en F30 **no se le pinta sombra**; a los demás sí), ni despedidas. Su deseo en F27 es de futuro («hablar en casa»).
- Las banderas son de **Canelo**: la llama al 60 % siempre; chica en F26-6, F28-6, F29 (c39–41, c67); baja **sola** dormido en F27 (camerino) y F30 (c73–77); el pescado «para mañana» con el solecito (F30 c49); Cronos sin que nadie voltee (F30 c57–65).
- Sin contador de vidas ni «GAME OVER / CONTINUE» (la prueba lo revisa en todos los textos).
- Luzterna carga todo **con el haz**: arregla peinados (F26), voltea la gorra (F28), detiene el escenario (F29 c58), deja la luz en la arena para Cerito (F30).
- Canelo **habla en POP** (F27: «¡Fuera! ¡Fuera!…») y **no habla en casa** (F30: la única línea es la de Cronos).
- Parodias con nombre felino; sus líneas solo donde el guion las da; ninguna frase de artistas reales; sin logos (la revista es la inventada «GATÍSIMA»).

### Presentaciones genéricas: la plantilla de FILM-ACTO1 con la piel de La Gira
- `registerBriefingSkin('p3d_pop', …)` en `films/acto4/index.ts`: estilo `pop`, 16:9, tipografía `bass`, música `xti.gira` (normal y élite) y `no_game.start` (jefe), rótulo «PRESENTACIÓN · LA GIRA».
- Fondo propio (`kit/backdrop.ts`): el escenario visto desde el público, **el nombre de la etapa en la marquesina LED**, el rig y la gradería; la puerta es la trampilla del escenario.
- Cubre P-1…P-4 y P-6…P-8. P-5 y P-9 tienen película hecha a mano (F26 y F28).

### Estilo nuevo: `pop` (`game/src/film/styles/pop.ts` + `pop.catalog.ts`)
«Fotograma de videoclip o póster de era»: neón y pastel planos, una luz de escenario dura.
- **Horneado de gatos `popBake`:** la pintura en 4 tonos planos de su propio color (lo iluminado sube a pastel), una luz dura desde arriba a la izquierda, **borde de neón** en el lado de sombra (magenta arriba, cian abajo) y contorno violeta oscuro.
- **Trabajo `pop:led`:** texturas `pop:dots` (el píxel LED con subpíxeles), `pop:glow`, `pop:cone` (haz de escenario con polvo), `pop:flare` (destello anamórfico), `pop:spark`, `pop:static`.
- **Kit:** `LedPanel` (una pantalla con bisel, contenido enmascarado, rejilla LED en *multiply*, brillo y apagado de tele vieja), `PhoneFrame` (celular 9:16 sin marca: punto rojo y contador), `pixelText` (fuente de 5×7 dibujada con rectángulos, con Ñ, acentos, @ y €; sin archivo de fuente), `Confetti` (forma cerrada), `Spots` (reflectores que barren), `glitchFilter` (bloques, separación RGB, bloques invertidos) y `pixelFilter` (el paso a 8 bits que sube desde el piso).
- Registro: una línea en `catalog.ts` (`...POP_STYLES`) y una en `styles/index.ts` (`pop: {…}`).

### Kit del acto (`game/src/film/films/acto4/kit/`)
- `stadium.ts`: gradería con orejas de gato, mar de celulares (`PhoneSea`), primeras filas, escenario, `Truss` (el rig que se cae), `LedWall` (principal + dos laterales + tira), `GlassCube` (el cubo de Cerito con tapa y grietas), estuches de equipo con «STAFF», bokeh y `stadium()` (el estadio entero a 2×, con el texto nítido a fov 1).
- `cast.ts`: suplentes y sus **tres rasgos legibles** dibujados en código sobre el *rig* de la pintura (ver «Suplentes»); `Dressed` los mantiene sobre la cabeza mientras respira; `staffCap`.
- `rule.ts`: el tablero de la regla con el **simulador real** (`demoOf`: la misma batalla de `battle/demo.ts`, semilla 4242, y un tiro limpio con puntería gruesa: ~160 vuelos en vez de 1 600, para no frenar la carga).
- Reutiliza del kit de FILM-ACTO1: `Bitacora`, `luzOf`/`lanternAt`/`Beam`, `StaticKitten`, `flame`/`tailTip`, `balloon`/`popIn`. De CINE: la isla (`final/props`: `sky`, `sea`, `island`, `homeSet`, `beamFan`).

### Cambios chicos y compatibles en el motor (avisar a CINE)
- **Arreglo del reloj de los Momentos con música en bucle** (`game/src/momentos/clock.ts`, 3 líneas; prueba en `filmActo4.test.ts`). **Afectaba a todas las presentaciones con pieza derivada más corta que la película** (F07 de FILM-ACTO1, la plantilla y F26/F27/F28): cuando la pieza volvía al inicio de su bucle, la posición oída caía *dentro* del tramo actual, el reloj no reconocía el segmento nuevo y **se congelaba unos 14 s** (medido con audio real: F26 se quedaba en 15,44 s; F07 en 14,90 s), y después pasaba al reloj interno. Ahora, si el reloj ya está en el borde del tramo y la posición oída salta hacia atrás cerca del inicio del segmento siguiente, avanza. Sin bucle, nada cambia (pasan las 33 pruebas de `momentos.test.ts`).
- **`FilmDef.quiet?: [desde, hasta][]`** (`types.ts` + `index.ts`, unas 20 líneas): ventanas de tiempo de película en que **la música de la propia película se apaga** (con `audioApi.duck`, 40 dB, solo en vivo, y siempre se suelta al terminar). Lo usa F27 para que la foto 4 y el camerino vayan sin música, como pide el guion. Sin `quiet`, nada cambia.

### Suplentes (pinturas que todavía no están integradas)

| Personaje | Suplente | Rasgos dibujados en código |
|---|---|---|
| **Firma** | `aurea_halo_cat` (crema y dorado) | el trazo caligráfico gigante que la envuelve, sin letras legibles |
| **El mánager** | `tic_pocketwatch_cat` (el gato de los horarios) | audífono de diadema con micrófono, lentes oscuros, tabla con horario en blanco, gafete de backstage |
| **Gato Malo** | `sonata_prima_cat` (esmoquin) | gorro de pescador **con orejas de conejo**, lentes oscuros grandes, uñas de colores |
| **Tailor Swift** | `diva_pop_cat` | 4 lentejuelas grandes, micrófono de cristal, pulseras de la amistad, labio rojo plano |
| **EMIAU** | `headliner_rock_cat` (el mismo de FILM-ACTO1) | rapado platinado, sudadera gris con gorro, cadena con espina de pescado |
| **Esquirla** | `neon_glitch_cat` | capucha con ribete verde neón y el brazo de *glitch* (bloques) |
| **Nadie** (F30) | `ecomudo_static_cat` | — (no se usa `nadie_static_cat`) |
| **Homiau / Borrón** (F30, condicionales) | si están en tu isla, los suyos; si no, dos gatos de tu partida; si no, `dona_police_cat` / `fanguito_mud_cat` (los de CINE) | — |
| **Comecroquetas** | dibujado en código como *sprite* de 8 bits (bola amarilla con orejas y boca en cuña) | — |
| **Cerito** | `StaticKitten` (estática sobre la silueta de `copito_snowball_cat`, como en el Acto I) | — |
| Utilería en código | el cubo de vidrio, el conejo inflable, la cabina del fotomatón y su tira, el micrófono de juguete, las gorras «STAFF», el bufé, el pase, la revista, el ojo de tinta, la cobija, el pescado, el solecito, el fuego (pinceladas) | — |

Noctis (`masquerade_phantom_cat`), Maneki (`mochi_bell_cat`), Cronos, Grafitera, Hipólito y Luzterna usan sus pinturas de siempre.

### Pruebas
- `game/tests/filmActo4.test.ts` (29 pruebas): `validateFilm` sin avisos en las cinco; reglas del formato; F29 y F30 completas y alineadas con los marcadores de sus mapas; los clics; las reglas del acto en los textos; `quiet`; la piel `p3d_pop`; el estilo `pop`.

### Rendimiento (Apple M4, Chrome sin cabeza 1920×1080, limitado a 60 Hz, **con el reloj de audio real**, calidad alta)

| Película | fps | p95 | p99 | Cuadros > 33 ms | Horneado | El reloj arranca |
|---|---|---|---|---|---|---|
| F26 | 60,0 | 16,7 ms | 16,8 ms | 0 | 2,4 s | ~3 s |
| F27 | 60,0 | 16,7 ms | 16,8 ms | 0 | 1,6 s | ~2,5 s |
| F28 | 59,9 | 16,7 ms | 16,8 ms | 1 (50 ms a los 6 s) | 2,0 s | ~3 s |
| F29 | 60,0 | 16,7 ms | 16,8 ms | 0 (2 cuadros perdidos de 33,3 ms en 3:26) | 7,4 s | ~8,5 s |
| F30 | 60,0 | 16,7 ms | 16,8 ms | 0 | 5,9 s | ~7 s |

- Con perfil nuevo de Chrome (sin caché) el primer horneado tarda más (las pinturas se descargan): F29 hasta 18 s y F30 hasta 10 s. Después, lo de la tabla.
- **F30 era una sola escena por toma** y eso dejaba ~110 títeres vivos (cada `CatPuppet` corre en el ticker aunque no se vea): el reloj del Momento bajaba la calidad sin que se perdieran cuadros. Ahora la noche es **una escena** con un solo mundo pintado y diez gatos; las tomas son cortes de cámara en los compases.
- El tablero de la regla (F26, F28) pasó de 1 600 vuelos a ~80 (`demoOf`): la basura que dejaba se cobraba a los 5–6 s de reloj (66–166 ms). Queda un cuadro de 50 ms en F28.

### Hojas de contacto (fuera del repo)
`<scratch>/fa4/sheets/f26.jpg`, `f27.jpg`, `f28.jpg`, `f29.jpg`, `f30.jpg` y, con «Reducir movimiento» + «Reducir destellos», `rmrf-f26.jpg` … `rmrf-f30.jpg`.

### Integración (hecha por MECÁNICAS-IMPL)
- P-5 y P-9 piden `F26` y `F28` desde `regiones.json` (`dims[p3d_pop].nodes`), y el resto de las etapas de La Gira usan la plantilla con la piel `p3d_pop`.
- `app/actsFlow.ts`: H90 → `f27` y luego la elección de la foto; H91 → `f29` (cierra la batalla); H92 → al tocar el faro, `f30`. `FILM_TITLES` ya tiene los cinco títulos.
- `?save=h89-acto4` carga sin errores de consola (no jugué la cadena entera).

## Falta
- **Jugar la cadena H89 → H92 de verdad** desde `?save=h89-acto4` (yo solo cargué la partida) y revisar los empalmes: F27 termina con la tira colgando, justo antes de la elección de la foto.
- **CINE:** revisar los dos cambios del motor (el reloj con bucle y `quiet`) y pasarlos a `02-api.md` si los acepta.
- **ARTE:** cuando lleguen las pinturas de Firma, El mánager, Gato Malo, Tailor Swift, EMIAU, Esquirla y Comecroquetas, se cambian los `SLUG` de `kit/cast.ts` y se quitan los rasgos dibujados que ya traiga la pintura.
- **El dueño:** escuchar F27 con el silencio de la foto 4 (`quiet`) y decidir si la base del karaoke queda en `xti.gira` o MÚSICA hace una base propia.

## Cómo retomar
- Vite propio: `cd game && npx vite --config <scratch>/fa4/vite.fa4.config.ts` (puerto 5671, sin HMR).
- Ver: `?film=f26` … `?film=f30` (`&seen=1`, `&scrub=1`, `&rm=1&rf=1`, `&invite=0`).
- Captura: `<scratch>/fa4/pp/` (copia de las de CINE en el puerto 5671; `npm i puppeteer-core@24` hecho). Hoja: `PROF=<scratch>/fa4/prof-x TIMES=… node pp/sheet.mjs <salida> 'film=f29&scrub=1'`. Rendimiento a 60 Hz: `CAP=1 PROF=… node pp/run.mjs 'film=f29&invite=0'`.
- `<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`.
- Trampa conocida: `expo` del post es multiplicador (1 = neutro); un `expo` negativo deja la escena en negro.

**Última actualización:** 2026-10-27, 00:45.
