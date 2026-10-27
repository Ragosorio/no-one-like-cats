# Índice de la documentación

Todos los documentos del proyecto, uno por línea. Si buscas por dónde empezar, lee los de la primera sección en orden.

Volver a: [README](../README.md) · [CONTRIBUTING](../CONTRIBUTING.md)

> **Sobre spoilers.** La Parte II está en vivo y varios documentos de su diseño cuentan su historia completa: están marcados con *(spoilers de la Parte II)*. La Parte III está en desarrollo y su diseño no se resume aquí.

---

## Empieza aquí

- [README.md](../README.md): qué es el juego, cómo jugarlo e instalarlo, el mapa de repositorios y el arranque rápido.
- [CONTRIBUTING.md](../CONTRIBUTING.md): valores, tono, reglas de oro, cómo proponer y por dónde empezar según tu perfil.
- [INDICE.md](INDICE.md): este mapa.
- [REPOSITORIOS.md](REPOSITORIOS.md): los cuatro repos, cómo se conectan, shards de arte y variables.
- [LICENSE](../LICENSE): licencia MIT.

## Guías (`docs/guias/`)

- [arquitectura.md](guias/arquitectura.md): el mapa del código: capas, carpetas, arranque, estado, guardado y convenciones.
- [rutas-de-desarrollo.md](guias/rutas-de-desarrollo.md): todas las rutas de URL, laboratorios, partidas de prueba, ayudas de consola y capturas sin pantalla.
- [agregar-gato.md](guias/agregar-gato.md): ficha, pintura MAI SVG, rig, laboratorio y cómo se consigue un gato.
- [agregar-elemento.md](guias/agregar-elemento.md): afinidades, materiales, estados, insignia, hábitat y descubrimiento de un elemento.
- [agregar-historia.md](guias/agregar-historia.md): misiones, beats, ganchos, zonas y batallas de historia.
- [cines-y-estados.md](guias/cines-y-estados.md): estados del mundo derivados de la historia y cines declarativas.
- [agregar-momento.md](guias/agregar-momento.md): cómo se arma un Momento musical y la regla de las canciones originales.
- [dimensiones-y-gateras.md](guias/dimensiones-y-gateras.md): la Carta de las Cajas, las gateras, sus batallas y su partida (Parte III, sin spoilers).
- [agregar-barco.md](guias/agregar-barco.md): planos, módulos, pieles, enemigos y jefes.
- [animaciones.md](guias/animaciones.md): gatos vivos, secuencias, GSAP, movimiento reducido y cómo previsualizar.

## Arte

- [arte/ESTILOS.md](arte/ESTILOS.md): la galería de estilos (gatos pintados, rarezas, elementos, Parte II, Momentos y dimensiones) y el pipeline.
- [arte/DIRECCION-ARTE-PARTE-2.md](arte/DIRECCION-ARTE-PARTE-2.md): entrega, estilo base y fichas de los gatos de las Grietas (Heroicos y Divinos incluidos).
- [arte/hoja-de-produccion.html](arte/hoja-de-produccion.html): el "taller de gatos": ciclo de producción, carpeta, dirección visual y revisor (ábrela en tu navegador).
- [research/10-direccion-de-arte.md](../research/10-direccion-de-arte.md): la dirección de arte de la Parte I: gramática común, dimensiones de estilo, tipografías y shaders.
- [part-ii/08-biblia-arte.md](part-ii/08-biblia-arte.md): la biblia de arte 2.5D de la Parte II: luz por hora, jerarquía de detalle y lentes por región.
- [part-ii/04-catalogo-conceptos.md](part-ii/04-catalogo-conceptos.md) y [catalogo-conceptos.html](part-ii/catalogo-conceptos.html): los conceptos visuales de la Parte II, con su revisión de propiedad intelectual.

## Motor y sistemas

- [ACTUALIZACIONES.md](ACTUALIZACIONES.md): cómo sacar una actualización sin romper partidas: migraciones, parches, NOVEDADES y respaldos.
- [MOTOR-Y-PLATAFORMAS.md](MOTOR-Y-PLATAFORMAS.md): por qué PixiJS, qué costaría cambiarlo y cómo llegar a App Store, Google Play y computadoras.
- [CONTEXTO-NARRATIVO.md](CONTEXTO-NARRATIVO.md): cada sistema se explica solo: glosario, presentaciones y el "para qué" de cada misión.
- [ECONOMIA-POSTHISTORIA.md](ECONOMIA-POSTHISTORIA.md): la economía después de la historia: hábitats libres.
- [part-ii/07-arquitectura-motor.md](part-ii/07-arquitectura-motor.md): el motor 3D (AgentGameEngine): módulos, mediciones y plan de migración.
- [part-ii/09-hosting-arte.md](part-ii/09-hosting-arte.md): dónde vive el arte, opciones de hosting, capacidad y plan de reversión.
- [part-ii/11-rendimiento-sin-iris-xe.md](part-ii/11-rendimiento-sin-iris-xe.md): rendimiento en equipos modestos y lo que se aplicó.
- [part-ii/14-regiones-3d.md](part-ii/14-regiones-3d.md): las islas 3D dentro del juego y cómo agregar una región.
- [part-ii/19-audio-arquitectura.md](part-ii/19-audio-arquitectura.md): el motor de audio: catálogo, director, capas y Fonoteca.
- [part-ii/20-estados-y-cine.md](part-ii/20-estados-y-cine.md): estados del mundo, cine y la apertura de la Parte II *(spoilers de la Parte II)*.
- [part-ii/21-migracion-reinicio.md](part-ii/21-migracion-reinicio.md): el reinicio narrativo de la Parte II y el registro de premios ya cobrados.
- [part-ii/24-batallas-musicales.md](part-ii/24-batallas-musicales.md): batallas sincronizadas con la música.
- [part-ii/29-momentos-musicales.md](part-ii/29-momentos-musicales.md): el motor de los Momentos y la hoja de cada canción *(spoilers de la Parte II)*.
- [part-ii/31-animaciones-con-proposito.md](part-ii/31-animaciones-con-proposito.md): temperamento, peso e intención en las animaciones del juego normal.

## Diseño de la Parte II (`docs/part-ii/`)

- [00-LEEME.md](part-ii/00-LEEME.md): índice de la Parte II y orden de lectura.
- [01-auditoria-juego.md](part-ii/01-auditoria-juego.md): auditoría técnica y de juego de la línea base.
- [02-investigacion-tecnologica.md](part-ii/02-investigacion-tecnologica.md): investigación de motores 3D, gatos 2D en 3D y licencias.
- [03-historia-actual.md](part-ii/03-historia-actual.md): la historia de la Parte I contra la sinopsis.
- [04-catalogo-conceptos.md](part-ii/04-catalogo-conceptos.md): los conceptos visuales, uno por uno.
- [05-biblia-parte-ii.md](part-ii/05-biblia-parte-ii.md): la biblia de diseño *(spoilers de la Parte II)*.
- [06-economia-orbes.md](part-ii/06-economia-orbes.md): el precio de los orbes, antes y después.
- [07-arquitectura-motor.md](part-ii/07-arquitectura-motor.md): el motor 3D.
- [08-biblia-arte.md](part-ii/08-biblia-arte.md): la biblia de arte.
- [09-hosting-arte.md](part-ii/09-hosting-arte.md): el hosting del arte.
- [10-estado-implementacion.md](part-ii/10-estado-implementacion.md): bitácora interna de implementación.
- [11-rendimiento-sin-iris-xe.md](part-ii/11-rendimiento-sin-iris-xe.md): rendimiento en gama baja.
- [12-puente-oleada-1.md](part-ii/12-puente-oleada-1.md): el puente de la Parte I a la II *(spoilers de la Parte II)*.
- [13-guion-parte-ii.md](part-ii/13-guion-parte-ii.md): el guion de las cuatro oleadas, misión por misión *(spoilers de la Parte II)*.
- [14-regiones-3d.md](part-ii/14-regiones-3d.md): las regiones 3D.
- [15-balance-cristal.md](part-ii/15-balance-cristal.md): balance del Cristal y la regla del Sonido.
- [16-niveles-100.md](part-ii/16-niveles-100.md): niveles 51 a 100 y el tope por estrellas.
- [17-plan-audiovisual.md](part-ii/17-plan-audiovisual.md): plan de la renovación audiovisual *(spoilers de la Parte II)*.
- [18-catalogo-musical.md](part-ii/18-catalogo-musical.md): catálogo y dirección musical *(spoilers de la Parte II)*.
- [19-audio-arquitectura.md](part-ii/19-audio-arquitectura.md): arquitectura de audio.
- [20-estados-y-cine.md](part-ii/20-estados-y-cine.md): estados del mundo y cine *(spoilers de la Parte II)*.
- [21-migracion-reinicio.md](part-ii/21-migracion-reinicio.md): reinicio narrativo y premios cobrados.
- [22-oleada-2.md](part-ii/22-oleada-2.md): Oleada 2, diseño y números *(spoilers de la Parte II)*.
- [23-variaciones-musicales.md](part-ii/23-variaciones-musicales.md): variaciones musicales y piezas nuevas *(cuenta dónde suena cada pieza)*.
- [24-batallas-musicales.md](part-ii/24-batallas-musicales.md): batallas musicales.
- [25-oleada-3.md](part-ii/25-oleada-3.md): Oleada 3, diseño e implementación *(spoilers de la Parte II)*.
- [26-oleada-1-cine.md](part-ii/26-oleada-1-cine.md): la Oleada 1 en escenas *(spoilers de la Parte II)*.
- [27-oleada-4.md](part-ii/27-oleada-4.md): Oleada 4 *(spoilers de la Parte II)*.
- [28-traspaso.md](part-ii/28-traspaso.md): traspaso interno: cómo va la Parte II y cómo continuar.
- [28b-bitacora-2026-10-09-10.md](part-ii/28b-bitacora-2026-10-09-10.md): bitácora de archivo de una noche de trabajo.
- [29-momentos-musicales.md](part-ii/29-momentos-musicales.md): Momentos musicales *(spoilers de la Parte II)*.
- [30-composiciones-nuevas.md](part-ii/30-composiciones-nuevas.md): composiciones nuevas.
- [31-animaciones-con-proposito.md](part-ii/31-animaciones-con-proposito.md): animaciones con propósito.
- [32-herramientas-musica.md](part-ii/32-herramientas-musica.md): herramientas gratuitas para hacer música desde scripts.
- [escuchar.html](part-ii/escuchar.html): página para escuchar la música (ábrela en tu navegador).
- [agentes/](part-ii/agentes/LEEME.md): el estado de cada agente que trabajó en la Parte II.

## Parte III

- [part-iii/](part-iii/): ⚠️ **SPOILERS**. Diseño interno de la Parte III, incluido su final. Solo si quieres saberlo todo antes de jugarla.

## Investigación (`research/`)

- [01-gatos-inventario.md](../research/01-gatos-inventario.md): inventario de gatos, la base del arte.
- [02-dragon-city.md](../research/02-dragon-city.md): Dragon City desarmado para este juego.
- [03-castle-busters.md](../research/03-castle-busters.md): Castle Busters y el género de artillería con destrucción.
- [04-gdd-no-one-like-cats.md](../research/04-gdd-no-one-like-cats.md): el GDD maestro del Capítulo 1.
- [04-content.json](../research/04-content.json): el contenido original del GDD, antes de entrar al juego.
- [05-psicologia-enganche.md](../research/05-psicologia-enganche.md): psicología del enganche y las reglas de diseño que salieron de ahí.
- [06-juegos-progresivos.md](../research/06-juegos-progresivos.md): juegos progresivos e incrementales: el ritmo.
- [07-animaciones-dopamina.md](../research/07-animaciones-dopamina.md): animaciones, game feel y dopamina.
- [08-economia.md](../research/08-economia.md): la economía completa del Capítulo 1.
- [09-referencias-pop.md](../research/09-referencias-pop.md) y [09-referencias-pop.json](../research/09-referencias-pop.json): el banco de referencias pop y humor.
- [10-direccion-de-arte.md](../research/10-direccion-de-arte.md): dirección de arte de la Parte I.
- [11-barcos-anime.md](../research/11-barcos-anime.md): barcos estilo anime que se rompen por partes.
- [economy-sim/](../research/economy-sim/tablas_generadas.md): el simulador de economía (Python) y sus salidas.
- [gdd-gen/](../research/gdd-gen/gdd_template.md): el generador del GDD.

## Otros

- [CHARLA.txt](../CHARLA.txt): la conversación de diseño original.
- [game/AGENTS_BRIEF.md](../game/AGENTS_BRIEF.md): brief histórico para los agentes de construcción (Hito 2).
- [agent-work/ESTADO.md](agent-work/ESTADO.md): registro de la auditoría del 2026-10-08.
- [ops/nolc-arte/publish.yml](../ops/nolc-arte/publish.yml): la plantilla del workflow de los repos de arte.
- [.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/config.yml) y [pull_request_template.md](../.github/pull_request_template.md): las plantillas de issues y de PR.
