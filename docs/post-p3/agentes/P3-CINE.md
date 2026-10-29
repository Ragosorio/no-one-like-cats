# P3-CINE · estado del agente

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo (dueño, 2026-10-29): «la parte tres no me gusta la pantalla de carga, me gustaba más la parte dos que el entorno
> se convertía en lo que se iba a hacer, además no hay como "canciones" a las que volver a reproducir».
> 1) Quitar la pantalla de carga de la Parte III: que el mundo se transforme en lo que viene (como en la Parte II).
> 2) «Volver a ver»: canciones ♪ de la Parte III, como las de la Parte II.
> Sin commits, sin push. Puerto 5225 (Vite sin HMR desde `<scratchpad>/p3cine/`). Nunca el 5173.

## Qué estoy haciendo
Nada: terminado (2026-10-29). Servidores 5225 y 5226 detenidos, sin Chrome abierto.
- `vitest` completo con `--maxWorkers=2`: 1561 pasan y 1 falla, `tests/casinoMultiverso.test.ts` (casino, trabajo en curso
  de SISTEMA-2, ajeno a este encargo).
- `tsc`: un solo error ajeno, en `battle/multidimPost/powersD.ts:155` ('storm' no es ElementId).

## Hecho
- **La transformación** (`game/src/film/morph.ts`, nuevo): cuando una película arranca desde una pantalla del juego
  (la Carta, la isla, una batalla), el mundo toma la paleta y la textura del estilo de la película:
  - Van Gogh: azul con pinceladas en remolino.
  - Da Vinci: sepia con trama de tinta.
  - Noir: blanco y negro con lluvia.
  - Tele: líneas de barrido.
  - Cine mudo: sepia con rayas.
  - Ukiyo-e: índigo con olas.
  - Saul Bass: dos tonos con barras.

  La cámara se acerca al nodo de la Carta y los bordes se cierran en el color oscuro de la película. Dura al menos 1,25 s;
  la película se construye y su canción se decodifica detrás. El cartel «PELÍCULA» con cuenta regresiva queda solo como
  respaldo si la película no está lista a los 12 s (equipo muy lento); pasados 3 s de espera, un hilo fino al pie
  muestra que avanza.
- `film/index.ts › playFilm`: usa la transformación en lugar del cargador. No la usa:
  - sobre un cuadro sostenido;
  - en una continuación `bare`;
  - con `cut: true`;
  - en las rutas de desarrollo.

  `preloadFilm` también acepta una definición, lo que permite calentar las presentaciones hechas con la plantilla.
- **Precarga**:
  - La Carta calienta la película de la etapa al abrir su tarjeta: `stageIntro.warmStageFilm` / `dropStageFilm`,
    `GaterasMapScene.select`. El nodo es el foco de la transformación (`filmFocus`).
  - Los flujos de los actos calientan su siguiente película mientras corren las líneas o una elección
    (`actsFlow.warmAhead`, `acto1Flow.warm`).
- **Presentación → batalla**: el último cuadro de la película se sostiene, la batalla se arma debajo y el cuadro se
  funde. Antes se veía la Carta un momento y luego el telón de bloques (`stageIntro` con `hold`, `cajasFlow`).
- **El final**: se conservan sus cortes secos con `cut: true` en «La caída» (tras la batalla) y en el golpe (en medio del
  desayuno). El resto del final no cambia: cuadros sostenidos, silencio y música.
- **Canciones** (`game/src/app/p3Songs.ts`, nuevo): las 8 originales de la Parte III que suenan en películas son EM%EN
  (f06), OH SHIT (f08), Daria (f16), No wey (f23), DISTOR (f25 / f25_bisagra), NO G@ME NO LIF€ (f29), xti es amor (f30)
  y SADIE (f35_sadie). DRUNCK sigue siendo Momento.
  - «Volver a ver» (`panels/Replays.ts`) ordena así: Prólogo, escenas de la Parte II, ♪ de la Parte II, ▶ películas de
    la Parte III y ♪ de la Parte III (DRUNCK primero), en orden de historia.
  - La película de una canción ya no sale dos veces: solo aparece como ♪.
  - Solo se listan las canciones ya alcanzadas, es decir, con su película vista.
- **Fonoteca**: antes, las 8 canciones se quedaban en «???» para siempre, porque nada las desbloqueaba.
  - Ahora, al ver la película, la canción entra con su disco. Durante el duelo entra en silencio, sin jingle.
  - Una partida que ya las vio las recibe calladas después de cargar, con un solo aviso.
  - `audio/fonoteca.ts › unlockSong(..., { silent })`.
- **Tras una pelea de historia ganada en la Carta**, la película de canción que abre su cierre (EM%EN, Daria, No wey,
  DISTOR) se calienta durante la tarjeta final y el regreso: `actsFlow.warmAfterWin`, llamada desde `cajasFlow`.
- Los grados de color se aplican en el orden pensado. Ojo: con `multiply`, Pixi antepone el paso nuevo
  (`morph.ts › chain`).
- Pruebas: `tests/p3Cine.test.ts` (12) más las relacionadas (stageIntro, acto1, acts, final, finalFluido, filmEngine,
  momentoYonoseTodo, audio): 121 en verde. `tsc` limpio en mis archivos.
- **Medido sin pantalla** (partida `h75-acto2`, 4 presentaciones de Ciudad Mayúscula: tarjeta → ZARPAR → película →
  batalla):
  - ANTES (HEAD, máquina normal): 4 pantallas de carga, 11,7 s en total (2,8 / 1,9 / 3,4 / 3,5 s), más un telón de
    bloques entre cada película y su batalla. Con la máquina saturada (carga 150–180) fueron 39,4 s.
  - DESPUÉS: 0 pantallas de carga. 4 transformaciones de 2,0 s cada una (la película ya estaba caliente desde la
    tarjeta), y de la película se pasa a la batalla sin telón. 0 errores de consola.
  - Final (`h93-final`): ANTES, 1 pantalla de carga de 2,0 s («Se acerca una luz») al abrir H93. DESPUÉS, 0 cargas:
    la isla se transforma durante 2,3 s y entra F31. El resto queda idéntico: cuadro sostenido → asedio → corte seco a
    «La caída».
  - «Volver a ver» (partida con las películas vistas): 104 filas. Las ♪ de la Parte III son las filas 96–104: DRUNCK,
    EM%EN, OH SHIT, Daria, No wey, DISTOR, NO G@ME NO LIF€, xti es amor y SADIE.
    - ♪ EM%EN reprodujo f06 con la pista `emen`.
    - ♪ SADIE reprodujo f35_sadie con `sadie`.
    - ♪ xti es amor reprodujo f30 con `xti`.
    - En los tres casos la vuelta quedó limpia: isla, sin película, sin transformación, capa de escena sin filtros y
      escala 1. 0 errores.
  - Fonoteca: las 8 canciones quedaron desbloqueadas después de cargar, con su lugar de origen.
  - Ojo: en el servidor de desarrollo, una repetición en frío (película sin precargar) tardó 11–13 s en arrancar, porque
    Vite transforma cada módulo la primera vez. Por eso el respaldo quedó en 12 s y hay un hilo de progreso desde los 3 s.
    En la versión publicada los módulos van empaquetados.
- Capturas: `<scratchpad>/p3cine/para-el-dueno/`.

## Falta (decisión del dueño o integración)
- Que el dueño vea la transformación y diga si quiere más o menos:
  - el mínimo de 1,25 s;
  - el acercamiento de la cámara;
  - la textura de cada estilo.
- NOVEDADES: no se escribió ninguna nota. Si se quiere avisar («las canciones de la Parte III ya están en Volver a ver
  y en la Fonoteca»), lo integra el coordinador.
- Siguen abiertas, y no son de este encargo, las películas mudas de los actos II–IV que dejan sonar la música del juego
  durante su transformación y su reproducción.

## Cómo retomar
- Servidor: `cd game && npx vite --config <scratchpad>/p3cine/vite.p3cine.config.mjs` (puerto 5225), dentro de
  `briefs/pesado.sh` para las sesiones con Chrome.
- Arneses en `<scratchpad>/p3cine/h/`:
  - `p3rec.mjs <partida> <salida> <n>` recorre arranques de misión y mide CARGA / TRANSFORMACIÓN; `report.mjs` lo resume.
  - `morphlook.mjs` captura la transformación por estilo.
  - `bakes.mjs` mide cuánto tarda en armarse cada película.

## Última actualización
2026-10-29
