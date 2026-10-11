# ANIMACIONES — estado del agente (para retomar si se corta)

Sin spoilers de historia. Encargo: punto 5 de la §3 de `../28-traspaso.md`. Son animaciones con propósito en el JUEGO NORMAL (no en los Momentos): anticipación, peso y reacciones según la personalidad. Prioridad: Canelo → primordiales → la isla durante los eventos de la Parte II.

## Qué estoy haciendo
Nada: el encargo está terminado, sin commit ni push. Queda solo que el coordinador lo revise e incluya los archivos en un commit.

## Hecho

### Sistema
Doc `../31-animaciones-con-proposito.md`.
- `game/src/art/temperament.ts` (nuevo, datos puros):
  - los 14 rasgos → temperamento (latencia, ritmo, rebote, saltos solos, valentía, paso, postura, manías y reacción por tipo de evento);
  - peso por rareza, y `SPECIES_MASS` para Plomito y Espumita;
  - `solemnize` para los primordiales;
  - `CANELO` (repertorio propio);
  - `DEFAULT_TEMPERAMENT` para cualquier especie;
  - `motionAmount(reduceMotion)` y `seedOf(uid)`.
- `game/src/art/intent.ts` (nuevo):
  - intents como keyframes sobre 8 canales (`crouch`, `lean`, `headDy`, `headA`, `look`, `lift`, `sx`, `sy`), con cues de emoción, acto y llamada;
  - constructores `hopIntent`, `departIntent`, `arriveIntent`, `reactionIntent` (17 reacciones) y `quirkIntent` (16 manías);
  - `IntentDriver` por gato, con su propia `Rng` sembrada por uid.
- `game/src/art/puppetCore.ts`: capa aditiva `PuppetBrain.pose`. Vale cero por defecto, así que nadie más cambia: batalla, Momentos y retratos siguen igual.
- `game/src/art/livingCat.ts`: getter `pose`.

### Integración
- `island/catActor.ts`:
  - anticipación al arrancar a caminar y asentamiento con inercia al llegar;
  - saltos y manías por temperamento (los primordiales no saltan);
  - sprint y derrape de Canelo;
  - postura de pie;
  - toque (`happy`) y rebote al hablar (`talk`);
  - entrada en carácter a las noches narrativas (setter de `night`) y variedad durante ellas;
  - API `react(kind, at, {delay, force, loud, gaze})`, `playReaction`, `swat`;
  - `uniform` (apaga la personalidad);
  - `motion()` (0 con «Reducir movimiento»).
- `island/night/stage.ts`:
  - los comandos de actor de grupo responden en carácter y con su latencia;
  - un solo gato conserva el golpe exacto del guion y solo suma el cuerpo;
  - `attack` con anticipación;
  - `react: 'canelo'` usa su `swat`;
  - ola de reacción a `shake`, `o3:shatter` y `o3:crack` (`boom`) y a `burst`, `shoot` e `ignite` (`wonder`).
- `island/night/cineFx.ts`: `pose` marca `uniform` (la sincronía de esa escena es a propósito).
- `island/night/index.ts`: con la estrella de día, los vecinos también la notan, uno por uno.
- `scenes/IslandScene.ts`: `catLevel` hace festejar a ese gato y `klUp` manda una ola de festejo.
- `scenes/CatLiveLab.ts`: `__catlab.intents`, `__catlab.play(i, …)`, `__catlab.profiles`.
- `docs/guias/animaciones.md`: una fila nueva en el mapa de archivos.

### Pruebas
- `tests/temperament.test.ts` (12, verdes): las 120 especies resuelven perfil; defaults; primordiales pesados y solemnes; Canelo el más rápido; todas las reacciones y manías son sanas y terminan en reposo; «Reducir movimiento» lo apaga; dados propios (nunca `Math.random`).
- También verdes: `npm run typecheck`; artBase, cine, oleada1/2/3Cine, worldState, pixiLeak, catReactivity, forms, rupturasO2/O3/O4, rupturasStory; `verify-missions --all` (162 OK).
- No corrí el `npm test` completo (lo hace el coordinador).

### Medición
Vsync, 1600×900, con otros agentes cargando la máquina.
- Antes/después en sesiones separadas:
  - `rupturas-o4` (30 gatos): 54,3/51,2 → 52,6/56,3 FPS; heap 175 → 172–174 MB.
  - `post-finale` (Parte I, 28 gatos): 60/60 → 55,8/52,8 FPS. Es ruido de carga: el A/B en la misma página da 60 contra 60.
- A/B en la MISMA página («Reducir movimiento» = actuación de antes contra sistema nuevo, alternando 3×8 s):
  - `post-finale`: 60,0 contra 60,0 FPS; los gatos cuestan 0,020 contra 0,022 ms por cuadro.
  - `rupturas-o4`: 54,5 contra 54,3 FPS de media (ruidoso en ambos lados); 0,030 contra 0,040 ms.
  - **Estrés con 150 gatos** (`rupturas-o4` + 120): 60,0 contra 60,0 FPS; 0,075 contra 0,097 ms por cuadro; heap 161 MB.

### Capturas
Tiras de cuadros exactos en `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/e9a3a7b3-f411-4663-b81c-1333e78c09b3/scratchpad/anim/sheets/`:
- `f-canelo-swat.jpg`
- `f-lab4.jpg`
- `f-primordiales.jpg`
- `isl-canelo-antes.jpg` / `isl-canelo-despues.jpg`
- `isl-wave-antes.jpg` / `isl-wave-despues.jpg`

Las sondas numéricas están en `probe.txt`: la ola tiene inicios repartidos de 0 a 1,8 s y 9 reacciones distintas, y la entrada a la noche, de 0 a 3,6 s.

## Falta
Nada del encargo; no queda nada sin revisar.

Ideas opcionales que NO hice:
- reacciones a las piezas del cielo O2/O3 sin cine (por ejemplo, mirar el galeón al pasar);
- llevar el sistema al gato 3D de las regiones (`engine/world/paperCat.ts` ya usa el mismo `PuppetBrain`, así que bastaría con un driver).

## Cómo retomar
- Vite propio: `npx vite --config <scratch>/anim/vite.anim.config.mjs` (puerto 5381, HMR apagado). Nunca 5191. Al terminar quedó apagado.
- Herramientas en el scratch de arriba:
  - `lib.mjs` (Chrome con perfil propio, `--remote-debugging-port=9381`);
  - `perf.mjs <label> <save>`;
  - `abperf.mjs <save> <rondas> <s> [gatosExtra]`;
  - `fstrip.mjs spec.json` (congela el ticker de la app, `Ticker.shared` y gsap, y avanza a mano: cuadros exactos);
  - `probe.mjs <save> "<js>" <cuadros> [rm]`.
- Hay que reinstalar `puppeteer-core` (`npm i` en el scratch): se borró `node_modules` para liberar disco.
- Trampas:
  - en `rupturas-o4` hay 24 gatos sin casa amontonados; para ver de cerca un primordial conviene el laboratorio;
  - las tarjetas de misión mueven la cámara: hay que ocultar `__scenes.overlayLayer` y `fxLayer` y fijar la cámara en cada cuadro (`perFrame`).

## Última actualización
2026-10-10, 19:10.
