# 07 · AgentGameEngine: arquitectura del motor de NO ONE LIKE CATS

> El objetivo **no es** competir con Unity, Godot o Unreal. Es una capa de ingeniería hecha a la medida
> de lo que necesita NO ONE LIKE CATS. El renderizado general se lo dejamos a three.js y a Pixi.

## 1. Estado anterior y decisión

**Qué había** (verificado el 2026-10-09):

- `~/Desktop/AgentGameEngine` es un repositorio sin ningún commit; todos los archivos están sin seguimiento. Contiene:
  - un renderer propio de triángulos de color (WebGPU/WebGL2, sin texturas ni texto);
  - tick fijo, RNG con semilla, replay, saves con migraciones, caché de assets y layout con Yoga;
  - un servicio de autoría con MCP y 28 tests.
- Su `docs/DIRECTION-NOLC.md` (2026-10-08) ya había decidido que **Pixi se queda como renderer y el motor es la capa encima**.

**Decisiones de esta sesión** **[CONFIRMADO]**:

1. **El runtime del motor vive dentro del juego**, en `game/src/engine/`, y no en el repo aparte.
   - **Por qué:** el deploy de Pages solo compila `game/`.
   - Importar entre repos obligaría a publicar paquetes o a usar *submodules* antes de saber qué piezas sirven.
   - Cuando un módulo se estabilice, se extrae a `@agent-game/*` sin cambiar su API.
2. **El repo `AgentGameEngine` queda como laboratorio** de herramientas para agentes: AgentService/MCP, escenarios, auditoría de layout y la sim determinista con replay. No se borra nada.
3. **El mundo 2.5D usa three.js r186 con `WebGLRenderer` y GLSL.**
   - 02 recomienda `WebGPURenderer` + TSL.
   - Se elige WebGL2 por madurez y porque el juego ya corre en WebGL.
   - En M4 el slice va a 60 FPS sin problema.
   - Migrar a TSL es **opcional** y solo se hace si una medición en hardware de referencia lo justifica. Los shaders son pocos y están aislados por módulo.
4. **Pixi v8 sigue a cargo de la UI y de la isla 2D clásica.** Cuando la vista 2.5D entre al juego, se apilan dos canvas: three abajo y Pixi transparente arriba, con un solo rAF y los clics que no tocan UI reenviados al mundo (02 §2).

## 2. Mapa de módulos

```
game/src/
├── art/
│   ├── puppetCore.ts      ← NUEVO. Núcleo del puppet SIN renderer: PuppetModel + PuppetBrain
│   └── livingCat.ts       ← CatPuppet (Pixi) es ahora un adaptador fino sobre PuppetBrain (misma API)
├── engine/                ← AgentGameEngine (runtime)
│   ├── core/
│   │   ├── noise.ts       hash, value noise, fbm, rng con semilla (puro)
│   │   └── perf.ts        FrameStats (p50/p95/p99, cuadros largos), QUALITY (tiers), AutoQuality, heapMB
│   ├── world/
│   │   ├── heightfield.ts terreno desde cualquier función h(x,z) + pintor por vértice + rampa toon + textura de alturas
│   │   ├── ocean.ts       olas Gerstner idénticas en GPU y CPU (sample()), espuma de orilla, brillos, lluvia
│   │   ├── sky.ts         DayCycle (keyframes por hora → todos los colores) + SkyDome (sol, luna, estrellas, Ruptura)
│   │   ├── weather.ts     lluvia en GPU alrededor de la cámara, tormenta, rayos (señales rain/storm/flash)
│   │   ├── flora.ts       palmeras, rocas, pasto y flores instanciados con viento inyectado al material toon
│   │   └── paperCat.ts    PaperCat: gato MAI en 3D (malla del PuppetBrain, normales de almohada, rim, luces locales, sombra-silueta)
│   ├── fx/particles.ts    pools de partículas en GPU (ring buffer, movimiento en el vertex shader, presupuesto por tier)
│   ├── camera/rig.ts      órbita/pan/zoom/WASD, foco cinematográfico, follow, shake con trauma, clic vs arrastre
│   └── life/director.ts   IA ambiental por utilidad: necesidades, rasgos, compromiso, eventos del mundo, steering
└── rupturas/              ← CONTENIDO del vertical slice (juego, no motor)
    ├── island.ts          forma de la isla, pads, POIs, walkable
    ├── props.ts           faro con haz, muelle, hábitats Fuego/Hielo/Cósmico, barco
    ├── life.ts            11 actividades con personalidad por elemento
    ├── cast.ts            elenco (ids de content.json) + Luzterna + REGISTRO 000
    ├── collapse.ts        COLAPSO ESTELAR (línea de tiempo por beats) + balsa de práctica
    └── main.ts            ensamblado, UI DOM, HUD de rendimiento, ganchos de depuración (window.__rupturas)
game/rupturas.html         entrada Vite aislada (no importa el estado del juego, nunca lee ni escribe partidas)
```

## 3. Qué es del motor, qué es del juego y qué se reutiliza

| Pieza | Motor | Juego | Se reutiliza tal cual |
|---|---|---|---|
| Cómo se mueve un gato (resortes, parpadeos, actos, emotes) | `PuppetBrain` (núcleo) | rigs por especie (`catRigs.json`) | ✓ Pixi y three usan el MISMO cerebro (paridad probada) |
| Gato en 3D | `PaperCat`, lentes de material | qué gato, altura, rasgos | Arte MAI lite (`cats-svg/lite`) sin cambios |
| Terreno, agua, cielo y clima | módulos `world/*` | forma de la isla, paleta por hora, pintor de biomas | — |
| Vida ambiental | `LifeDirector` (necesidades, steering, re-plan) | actividades y personalidades | — |
| Habilidades | partículas, cámara, hit-stop, flash | guion por beats (`collapse.ts`) | La sim de combate (`battle/sim.ts`) se mantiene como autoridad cuando se migren las batallas |
| Economía, campaña, misiones, Santuario, Catdex | — | **todo** | ✓ Nada se mueve al motor |
| Partidas | — (el motor no persiste nada) | `core/save.ts`, `migrate.ts`, `patches.ts`, `vault.ts` | ✓ |

## 4. Técnicas y "trucos" usados (y por qué son baratos)

| Truco | Dónde | Costo |
|---|---|---|
| **Gato de papel**: pintura sobre la malla deformable del puppet + normales derivadas del campo de distancia de la silueta (domo/almohada) + rim al lado del sol | `paperCat.ts` | 1 draw por gato; normal map de 128² calculado una vez por arte |
| **Sombra-silueta proyectada**: la misma geometría del gato se aplasta en el shader sobre su plano de suelo, en la dirección del sol (o de la luna) | `paperCat.ts` | +1 draw por gato, sin shadow map |
| **Grading por hora** (keyframes de color) sobre los gatos, las velas del barco, el agua y la niebla | `sky.ts` | Uniforms |
| Hasta **4 luces locales por gato** (lava, linterna, faro), elegidas por cercanía | `paperCat.ts` | Bucle de 4 en el fragment |
| Agua sin reflejos reales: fresnel hacia el color del cielo, brillos con máscara de ruido que se apagan con la distancia y espuma desde la textura de alturas | `ocean.ts` | 1 draw, sin render targets |
| Olas iguales en CPU y GPU: el barco y los gatos que nadan flotan sobre la superficie real | `ocean.ts` `sample()` | ~8 senos por consulta |
| Lluvia en GPU que "envuelve" a la cámara | `weather.ts` | 1 draw, 9k segmentos |
| Partículas: la CPU solo escribe el nacimiento; la trayectoria se calcula en el shader | `particles.ts` | 1 draw por pool |
| Vegetación instanciada con viento inyectado al material estándar (se conservan luces, sombras y niebla) | `flora.ts` | 5 draws para miles de plantas |
| Cámara que esconde cortes: `cut()` detrás de flash o hit-stop | `rig.ts`, `collapse.ts` | — |
| Volteo de carta: girar = escala X que pasa por 0 | `paperCat.ts` | — |
| **Ruptura en el cielo**: estrellas que suben, hechas en el shader del domo | `sky.ts` | Gratis |

**Medido en Apple M4 (Chrome headless + ANGLE Metal), calidad Alta, 1600×900:**

| Escena | FPS | p50 / p95 / p99 | Draws | Triángulos | Heap JS |
|---|---|---|---|---|---|
| Isla de día | 60 | 16.7 / 16.7 / 16.8 ms | 89–158 | 340k–460k | 34–63 MB |
| Isla con tormenta | 60 | 16.7 / 16.8 / 16.8 ms | | | |
| Habilidad + barco | 60 | 16.7 / 16.8 / 16.8 ms | | | |

La sincronía vertical (vsync) limita a 60, así que no hay techo medido. **Falta medir en Iris Xe** (hardware de referencia de 02 §8).

## 5. Navegación en tres capas: diseño técnico **[PENDIENTE de prototipo]**

- **`WorldStream`** (próximo módulo): regiones como chunks `{ id, layer, bounds, load(): Promise<Group>, impostor }`.
  - Se carga por distancia a la cámara, con histéresis.
  - Se descarga con `dispose` auditado (lección de la fuga de Pixi de 01).
- **Impostores:** islas lejanas como *billboard* (una captura renderizada una vez a textura) o como LOD de 1 draw.
- **Cambio de capa:** la transición es una línea de tiempo de cámara (subir por la tromba). La carga del chunk se dispara al empezar la animación y se espera en el punto más alto, que queda tapado por nubes de partículas.
- **Agua por capa:** marítima = `Ocean`; celeste = "mar de nubes" (el mismo shader con otra paleta y espuma = nubes); astral = un domo de estrellas sin agua.

## 6. Cómo agregar contenido sin rehacer el juego

**Un gato nuevo en el mundo 2.5D:**
1. El arte y el rig siguen la guía que ya existe (`docs/guias/agregar-gato.md`).
2. Agregar una línea en `rupturas/cast.ts` con `tags` (elemento) y `traits`.
3. Hereda automáticamente las conductas de su elemento. Para una conducta única, crear una `Activity` nueva (unas 30 líneas) en `life.ts`.

**Una actividad o conducta nueva:**
- Es un objeto `{ id, score, start, update, stop }`. El director se encarga del resto (re-plan, compromiso, steering, interrupción por lluvia o noche).

**Una isla nueva:**
1. Escribir una función de altura (como `island.ts`) y un pintor.
2. `new Heightfield(...)` + `new Ocean({ heightTex })`.
3. Agregar props.
4. **Pendiente:** formalizarlo como `RegionDef` (datos) cargado por `WorldStream`.

**Una habilidad:**
- Es una línea de tiempo por beats con ganchos (`flash`, `shake`, `hitstop`, `focus`, `damage`, `say`) más pools de partículas. Ver `collapse.ts`.
- **Pendiente:** extraer un `Sequence` DSL compartido con las secuencias Pixi (`fx/sequences/*`), como pedía DIRECTION-NOLC §4.

**Un hábitat:**
- Es una función que devuelve `Prop` (`group`, `lights`, `update`).
- **Pendiente:** declarar *spots* con afordancias (05 §8.2).

## 7. Plan de migración (paralelo, reversible)

| Paso | Qué | Requisito para avanzar (gate) | Riesgo |
|---|---|---|---|
| 0 ✓ | `rupturas.html` aislado + `puppetCore` compartido | Paridad del puppet, 77/77 tests y typecheck | Ninguno para jugadores (nada se publica sin push) |
| 1 | **Puente de solo lectura**: el slice lee la partida real (localStorage `nolc-save-v1`, o un `.nocat` elegido) y muestra TUS gatos, hábitats y faro. **Nunca escribe.** | Test: cargar las 14 fixtures sin excepciones y sin escribir en storage (espía sobre `setItem`) | Bajo |
| 2 | **Vista Rupturas** dentro del juego (Ajustes › Vista: Clásica / Rupturas), con un canvas three bajo Pixi. La isla 2D sigue siendo la autoridad para construir. | Mismo flujo de construir/alimentar/cruzar en las dos vistas; FPS y memoria comparados con la línea base de ESTADO.md | Medio (2 contextos GL) |
| 3 | Construcción y colocación en 2.5D. Se traduce el layout 2D al diorama (función pura con tests). | Ningún hábitat solapado ni perdido en las fixtures; "por colocar" si no cabe | Medio |
| 4 | Mapa en capas (`WorldStream`) | Transiciones sin cuadros largos | Medio |
| 5 | Batallas 2.5D: **la sim no cambia**. Solo cambia la presentación (que hoy es la sim): se reproducen los mismos eventos | Estimación igual a la pantalla en 16 semillas (ya se mide así hoy) | Alto: se hace al final |

**Reglas:**
- Nunca hay doble escritura.
- `snapshot()` siempre va antes de reemplazar una partida (memoria del incidente del 2026-10-08).
- La guardia de `playMs` no se quita.

## 8. Instrumentación y depuración

- **HUD F3:** FPS, p50/p95/p99, cuadros largos, draws, triángulos, geometrías, texturas, heap, tier, DPR y backend.
- **`window.__rupturas`:** `setHour`, `setSky`, `cast()` (qué hace cada gato), `stats()`, `ability()`, `focus(id)`, `view(...)`, `scene`.
- **Harness headless** (fuera del repo, en el scratchpad de la sesión): puppeteer-core + Chrome con `--use-angle=metal` (GPU real) y guiones JSON con `eval`/`wait`/`shot`. Mover a `game/scripts/` cuando se estabilice.
  - El panel de navegador integrado va a ~1 FPS (memoria del proyecto): no sirve para medir.
- **Tests de motor:** `game/tests/engine.test.ts`. Cubren ruido, forma de la isla, olas en la CPU, percentiles, AutoQuality, director de vida (Canelo bajo la lluvia, Agua baila, Cósmico mira estrellas, nadie se mete al mar) y el snapshot de regresión del PuppetBrain.
