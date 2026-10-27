# BAR-PULIDO · el cruce, la escena A, la escena B y la revelación (pasada de pulido, ronda 3)

- **Qué estoy haciendo**: terminado y entregado al coordinador. Sin commits ni push.
- **Hecho**:
  - **El cruce** (`p3_pelo` → la calle):
    - preparación: la gatera se ilumina por dentro (halo, rayos por las orillas, se entreabre: fx de isla `p3_gateraLuz`);
    - la cámara entra por la portezuela y la pantalla queda en la luz de la gatera (`holdBlack` acepta un color; `FLAP_LIGHT`);
    - `goCaja(set, cruce)`: la escena del bar nace bajo esa misma luz (`armCruce`, caduca a los 3 s) y sin iris negro;
    - desarrollo: la luz se repinta en bandas planas de color TV que se barren una por una (`cruce`);
    - salida: el neón «LA ÚLTIMA RONDA» zumba al prenderse (parpadeo y halo, `neon`);
    - una hilera de pelos naranjas en la calle mojada, con un brillo que corre hacia la puerta (`pelos`); la cámara la sigue; el cliente que sale volando se conserva;
    - `drunck.barra` muy bajo en la calle; se corta con el corte a TV.
    - `enterH66`, `onFaroTap`, `setPaginaP3Tap`, `FaroPage.setCalling` y `hairToGatera` no se tocaron.
  - **Escena A**:
    - actuación de cuerpo entero: abraza el tarro (patas en el tarro), se inclina hacia el oyente, gesticula con la pata, se ofende con todo el cuerpo (anticipación, se estira, tiembla) y se desinfla;
    - Espuma pule más rápido y pone los ojos en blanco;
    - pista honesta: la espuma del segundo tarro respira y suelta burbujitas al ritmo de un ronquido (izquierda de `hideX`);
    - portada del Diario del Mar con su cara por medio segundo en «¿No sabes quién soy?»; APLAUSOS se prende y nadie aplaude;
    - la regla de las gateras con acción: inserto de la espuma, la uña dibuja una puertita, se abre a tu isla con el faro girando, se cierra con un «¡CLAC!»; línea nueva partida en dos alrededor de la acción;
    - el tarro deslizado con barrido de cámara y la atrapada con las dos patas; el trago largo A8 se conserva.
  - **Escena B** (la barra es el diagrama, dos ritmos):
    - la servilleta = «esa hoja» (la saca, la alisa, la pata encima);
    - la ventana pasa día–noche–día y salen rayitas;
    - la tele con dos pescados idénticos y su cabeza que no decide;
    - inserto cenital: terrón de azúcar pulido → el blanco perfecto invade y regresa; cátsup → grafiti, salpicadura y grietas, y regresa (queda una gota); manos de luz → escriben y sus hilos cruzan la barra;
    - la papa-Capi con sombrero de papel y palillo-pluma: 4 variantes (escribe «un mundo perfecto» y brilla; escribe «rompan todo» y lo raya; deja la hoja en blanco; nomás mira);
    - se acuesta en la servilleta y ronca; Espuma llega con el lápiz de su chongo y no puede escribir («¡PLIC!»);
    - borrador de niebla; se guarda la goma en la bufanda; el gis escribe solo cada vez más rápido hasta derramarse por la pared; «PISAPAPELES»;
    - la llama de la cola; cuenta con las garras (1…8); las rayas se multiplican;
    - el haz azul por la ventana (sostenido);
    - la bufanda sobre los ojos;
    - `drunck.resaca` muy bajo; se suelta antes de la revelación (lluvia y silencio).
  - **Revelación** (misma puesta, misma duración):
    - la caída lenta de Hipólito con anticipación y la torre arrastrada (el soporte se inclina con retraso, las donas salen de arriba primero, giran y dejan estela);
    - R7: las donas caen en cada pata y la corona al final, vuelve la burbuja, empuje lento;
    - R8: Canelo se baja tambaleándose.
  - **Archivos**:
    - nuevos: `src/scenes/caja/barDirector.ts`, `barInsertos.ts`, `barKit.ts`, `barRemate.ts`, `tests/p3BarPulido.test.ts`;
    - editados: `src/cine/scenes/p3Bar.ts`, `src/app/gaterasFlow.ts`, `src/ui/story/gaterasCines.ts` (solo `p3_pelo` y `holdBlack`), `src/ui/story/gaterasScript.ts` (`BAR_LINES`, comentario de `barSceneB`), `src/data/gateras/historia.json` (`b66_bar`), `src/scenes/CajaScene.ts` (ganchos de una línea + métodos del set bar), `src/momentos/songs/drunck/layout.ts` (solo se agregó `BAR_PULIDO`), `tests/p3Caja.test.ts` (solo la parte del bar).
  - **Líneas**: `b66_bar` pasa de 28 a 41. Las mitades y la línea nueva van al final (28–40): ningún índice viejo cambió y el texto se conserva (la prueba lo verifica uniendo las mitades).
  - **Verificación**: `tsc` limpio, 668/668 pruebas, `verify-missions --all` 166 OK, flujo completo A → Momento → B sin errores (solo el aviso de Pixi conocido al liberar el Momento), 60 fps (A: p95 17,5 ms; B: p95 18,7 ms).
  - **Capturas** (fuera del repo): antes `<scratch>/antes/cine-a.png`, `cine-b.png`; después `<scratch>/despues/bar/cine-a.png`, `cine-b.png` (misma herramienta), `ideas-a.jpg`, `ideas-b.jpg` (cada idea en un cuadro; B con `mentira:romper`), `cruce.jpg` (la entrada real con `h65-normal`).
- **Ronda 2 (pedido del coordinador, 10:15)**:
  - **El cliente de A1 es un gato real**: Guijarro (`guijarro_pebble_cat`, común del elenco de la Borracha), por el lente TV, como títere (`src/scenes/caja/barCliente.ts`). Sale volando y girando, cae aplastado con polvo, se marea con estrellitas, se sacude, se levanta y vuelve a entrar; la puerta se abre y se cierra. Se borró `catBack` de `CajaScene.ts`.
  - **La luz del cruce está viva**: `src/scenes/caja/barLuz.ts` (túnel de anillos, rayos que giran, el pelo naranja que flota, el arco de la gatera en los bordes). La dibujan el fundido de la isla (`holdBlack`) y la tapa del bar, que se repinta sola con su propio ticker mientras el bar carga; las bandas la recortan sin apagarla. La gatera de la isla brilla más y la cámara se acerca antes de entrar.
  - **Menos aire muerto** (mismas ideas, acciones y reacciones; solo esperas y sostenidos), medido con `barcap.mjs` y avance automático cada 1,1 s: **A 38 s → 32 s**, **B 111 s → 90 s**.
  - Pruebas: 670/670; `tsc` limpio. Hojas nuevas: `ideas-a.jpg`, `ideas-b.jpg`, `cruce.jpg` (las `cine-*.png` son de la ronda 1).
- **Ronda 3 (QA: el cruce se congelaba mientras se armaba el bar)**:
  - `src/scenes/caja/barPrecarga.ts`: mientras H66 espera en la isla (y otra vez al empezar `p3_pelo`), las pinturas del bar (Canelo, Espuma, Hipólito, Guijarro, Luzterna) se rasterizan y se suben a la GPU en tiempo ocioso, con la cola de arte (`requestCatSvg`, `requestIdleCallback`).
  - `CajaScene.enter` ya no hornea todo de golpe. Usa `bakeOneByOne`: primero compila los programas del horneado sobre una textura de 1×1 y luego, por cada pintura, la sube a la GPU en un cuadro y la hornea en el siguiente.
  - Medido con `<scratch>/pp/hold.mjs` (entrada real, `h65-normal`): antes, cuadros de 75–469 ms y el bar listo en ~1,3 s; después, en 2 corridas, el cuadro más largo del sostenido fue de 53 y 48 ms y el bar estuvo listo en ~0,2 s. Las mediciones son ruidosas: la máquina tenía carga 30–40 por otros agentes.
  - Caso peor (si el jugador toca la página antes de que termine la precarga): los rasterizados caen durante `p3_pelo` en la isla, no en el sostenido.
  - La nota de QA (tras recargar a mitad de B, el primer toque de la página solo movió la cámara) no está en mis archivos. `enterH66` sale sin hacer nada si hay una cine corriendo (`if (runningCine()) return;`); probablemente fue eso.
- **Falta / riesgos**:
  1. Que el dueño vea las patas dibujadas junto a la pintura (antebrazos esponjados con calcetín crema): es lo más «nuevo» en estilo.
  2. A y B duran más (A ≈ 38 s y B ≈ 110 s con avance automático, antes ≈ 19 y 55 s). Cada idea tiene su acción; si se siente largo, se pueden recortar las esperas de consecuencia (`wait`) sin tocar el texto.
  3. La luz de la gatera en la isla se ve chica antes del empuje de cámara; mientras carga el bar, la luz se sostiene 1–2 s.
  4. `barSceneB(...)` ya no es el orden exacto del cine (es el conjunto con la variante en la 5.ª posición, para no tocar `gaterasCimientos.test.ts`); el orden real está en `p3Bar.ts`.
- **Cómo retomar**: Vite en `http://127.0.0.1:5621`. Herramientas propias: `<scratch>/pp/barcap.mjs` (`SHOTS="A5p:0.2,..."` captura cuando empieza ese paso; `EVAL=` para poner `mentira:*`; `FPS=1` mide cuadros; `RM=1` reducir movimiento) y `<scratch>/pp/pelo.mjs` (la entrada real). Siempre `PROF=<scratch>/prof-bar`.
- **Última actualización**: 2026-10-14 13:05
