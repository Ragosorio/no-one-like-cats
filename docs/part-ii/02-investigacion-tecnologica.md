# Parte II — 02 · Investigación tecnológica para el mundo 2.5D

> Fecha de corte: **2026-10-09**. Todas las versiones se verificaron ese día contra el registro de npm (`registry.npmjs.org`) o la documentación oficial. Los tamaños de bundle los **medimos nosotros** (esbuild 0.28.2, `--bundle --minify --format=esm`, gzip -9) sobre un import representativo; no son cifras de marketing.
>
> Contexto del proyecto: PixiJS 8.22.0 + GSAP 3.15.0 + TypeScript 7 + Vite 8. Gatos = 172 SVG de MAI (≈679 MB en `public/cats-svg`, ~36 000 `<path>` planos + 1 máscara de luminancia cada uno, ~4 MB por archivo) animados por el puppet de malla propio (`src/art/puppetCore.ts`, ya separado del renderer). Pixi se queda para UI/2D (decisión tomada).

---

## Resumen ejecutivo (la decisión)

| Capa | Elección | Versión exacta |
|---|---|---|
| Mundo 2.5D | **Three.js** con `WebGPURenderer` (`three/webgpu`) + **TSL**, fallback automático a WebGL 2 | `three@0.186.1` (r186, 2026-09-24) + `@types/three@0.186.0` |
| UI / 2D / batallas actuales | **PixiJS** con renderer **WebGL** (no WebGPU) | `pixi.js@8.22.0` |
| Tweening | GSAP (sin cambios) | `gsap@3.15.0` |
| Animación de gatos | **Puppet propio** (`puppetCore.ts`) con un segundo adaptador para Three | — |
| Post-proceso | `RenderPipeline` + nodos TSL incluidos en three (Bloom, DepthOfField, Godrays, SMAA/FXAA) | incluido en r186 |
| Partículas | **Propias en TSL** (instanced + compute) — *no* three.quarks | — |
| Picking / raycast de terreno | `three-mesh-bvh` | `0.9.16` |
| IA de gatos ambientales | FSM + selección por utilidad + steering propio | — (sin dependencia) |
| Raster SVG fuera del hilo principal | `@resvg/resvg-wasm` en Worker (con verificación de fidelidad) + la caché WebP existente | `2.6.2` |

**Integración Pixi + Three:** dos `<canvas>` apilados (Three abajo, Pixi WebGL arriba con fondo transparente), **un único bucle rAF** que dibuja ambos. Contexto WebGL compartido sólo como modo alternativo si se fuerza Three a WebGL2.

**Iluminación de gatos:** billboard "de papel" con **pseudo-normales generadas desde el campo de distancia del alfa** (domo/bisel), luz *half-Lambert* con rampa toon, *rim light* desde el borde del SDF, ambiente hemisférico ligado al ciclo día/noche, sombra de contacto tipo blob + sombra proyectada por alpha-test sólo en calidad alta.

**Banderas de licencia:** Spine (runtimes no libres, licencia por usuario, Enterprise obligatoria con >US$500k de ingresos/financiamiento), Rive (gratis con *splash screen*; sin splash requiere plan pago por asiento), Laigter (GPL-3: usar sólo como herramienta, nunca incrustar su código), GSAP (licencia propietaria "no charge" de Webflow, no OSI), resvg (MPL-2.0: copyleft por archivo — no modificar sus fuentes sin publicar los cambios).

---

## 1. Motor para la capa del mundo 2.5D

### Comparación

| Criterio | **Three.js r186** | Babylon.js 9 | PlayCanvas engine 2 | Phaser 4 | WebGPU crudo |
|---|---|---|---|---|---|
| Versión actual | `three@0.186.1` (2026-09-24), MIT | `@babylonjs/core@9.30.0` (2026-10-08), Apache-2.0 | `playcanvas@2.23.1` (2026-10-07), MIT | `phaser@4.2.1` (2026-07-09), MIT | API del navegador |
| WebGPU | `WebGPURenderer`, cae a WebGL2 solo; `forceWebGL` disponible | Sí (WebGPU + WebGL2) | Sí (WebGPU + WebGL2) | No es su foco (renderer 2D) | Sólo WebGPU; sin fallback |
| Lenguaje de shaders | TSL (JS → WGSL/GLSL) | NME / GLSL / WGSL | GLSL + WGSL (doble backend) | GLSL 2D | WGSL |
| Bundle medido (min / gz) | **880 / 241 KB** (`three/webgpu`+TSL); 533 / 132 KB con `WebGLRenderer` | 1593 / 369 KB (escena mínima con sombras, imports por módulo) | 2460 / 635 KB (`import *`; el paquete no se dejó podar bien) | n/a (no aplica a 3D) | 0 KB + meses de motor |
| Calidad visual alcanzable (estilizado) | Alta; post-proceso TSL: Bloom, DOF, Godrays, GTAO, SSR, Outline, SMAA, TRAA | Muy alta; clustered lighting, luz volumétrica, editor de partículas por nodos | Alta | Baja para 2.5D | La que escribas |
| Ergonomía TS | Buena; tipos en paquete aparte (`@types/three`) | Excelente (escrito en TS) | Buena (tipos incluidos) | Buena | Buena (`@webgpu/types`) |
| Ecosistema / ejemplos | El más grande de la web | Grande, foro muy activo | Mediano, centrado en su editor | Grande pero 2D | Pequeño |
| Convivencia con Pixi v8 | **Documentada oficialmente por Pixi** (contexto compartido + `resetState`) | Posible según la misma guía si se resetea estado; más fricción (tiene su propio loop/escena) | Igual que Babylon | Duplicaría Pixi (dos motores 2D) | Manual |
| Ritmo de cambios | Release ~mensual con *breaking changes* menores | Menor fricción de API | Estable | Estable | — |

### Recomendación
**Three.js r186 con `WebGPURenderer` + TSL.** Razones:
1. Es la única opción con guía oficial de Pixi para mezclarlos, y la de menor peso real (241 KB gz con WebGPU/TSL, frente a 369 KB de Babylon mínimo).
2. TSL escribe el shader una vez y lo compila a WGSL o GLSL según el backend, así que el agua, el cielo, el viento de la vegetación y la luz de los gatos funcionan igual en WebGPU y en el fallback WebGL2.
3. Todo lo nuevo de three se está construyendo sobre el renderer de nodos: r183 renombró `PostProcessing` → `RenderPipeline` (pensado para `WebGPURenderer`), r185 reemplazó `TiledLighting` por `ClusteredLighting`, r186 reservó los nombres sin sufijo (`LightProbeGrid`) para la versión WebGPU. Empezar hoy en `WebGLRenderer` + GLSL es empezar en la rama que se queda atrás.
4. Ya trae, listos para TSL, `SkyMesh` (Preetham), `WaterMesh`, `DepthOfFieldNode` (tilt-shift HD-2D), `GodraysNode`, `BloomNode`, `OutlineNode`.

Babylon 9 sería la segunda opción (más "motor completo", inspector, clustered lights), pero pesa ~50 % más, impone su propio loop y escena, y la integración con Pixi está menos transitada. PlayCanvas brilla con su editor, que no usaríamos. Phaser 4 y WebGPU crudo quedan descartados.

### Riesgos y mitigación
- **API inestable de three/TSL** (renombres en cada release: `directionToColor`→`packNormalToRGB` en r185, `PCFSoftShadowMap` eliminado en r186). → Fijar `"three": "0.186.1"` exacto (sin `^`), actualizar a propósito cada ~3 meses leyendo la *Migration Guide*.
- **WebGPU no siempre es más rápido que WebGL2** en three (hubo benchmarks de 2025 donde `WebGLRenderer` ganaba). → Medir en la máquina de referencia; si WebGPU rinde peor ahí, `forceWebGL: true` es un cambio de una línea gracias a TSL.
- **Cobertura WebGPU incompleta**: Chrome/Edge en Windows/macOS/ChromeOS desde la 113; Linux en progreso (Chromium añadió Intel Gen12+ en enero 2026); Firefox 141 sólo Windows, 145 macOS ARM, Linux e Intel Mac "en progreso"; Safari 26 sí. → El fallback WebGL2 es obligatorio y se debe probar en CI/headless.
- **Compute en el fallback**: el backend WebGL de three emula `compute()` con *transform feedback*, con restricciones (sin `count` en arreglo ni indirect). → Todo efecto de compute necesita un camino "CPU/instanced" para el tier bajo.
- **Ecosistema GLSL incompatible**: librerías basadas en `ShaderMaterial`/`onBeforeCompile` (three.quarks, `postprocessing` de pmndrs 6.39.5) **no funcionan** con `WebGPURenderer`.

---

## 2. Cómo combinar PixiJS v8 y Three.js

### Opciones

| | **A. Dos canvas apilados** (recomendado) | B. Un contexto WebGL compartido (guía oficial Pixi) | C. Un `GPUDevice` WebGPU compartido |
|---|---|---|---|
| Cómo | Canvas Three (abajo) + canvas Pixi WebGL (arriba, `backgroundAlpha: 0`) | `new WebGLRenderer()` de Pixi con `context: threeRenderer.getContext()`, `clearBeforeRender: false`, `resetState()` antes de cada renderer | Pixi `WebGPURenderer` acepta `gpu: { adapter, device }` ("shared device and adaptor from other engine"); el backend WebGPU de three acepta `parameters.device` |
| Backend de Three | WebGPU **o** WebGL2 (libre) | Debe ser WebGL2 (`WebGPURenderer({ forceWebGL: true })` o `WebGLRenderer`) | WebGPU |
| Backend de Pixi | WebGL (el que Pixi recomienda para producción) | WebGL | WebGPU (Pixi lo marca "🚧 Experimental") |
| Fugas de estado GL | Imposibles | Riesgo permanente; mitigado con `resetState()` en cada cambio | Menor (WebGPU no tiene estado global), pero sin guía |
| Resolución independiente | **Sí**: 3D a escala dinámica (0.67–1.0) y UI nítida a DPR completo | No: un solo framebuffer | Por canvas |
| Texturas compartidas | No | **No** ("Textures are not shared", guía Pixi) | Teóricamente sí; sin soporte documentado |
| Coste extra | Una capa más en el compositor del navegador (~8 MB a 1080p) | Ninguno | Desconocido |
| Pérdida de contexto | Aislada por capa | Tumba ambas | — |

### Recomendación
**Opción A, dos canvas, un solo bucle.** Es la única que permite usar WebGPU en three mientras Pixi sigue en WebGL (su recomendación de producción), da resolución dinámica al 3D sin degradar la UI y elimina por diseño la clase de bugs de estado compartido. Los gatos del mundo se dibujan **en Three** (necesitan profundidad, luz y sombras contra el terreno); Pixi sólo dibuja HUD, menús, paneles, Catdex y las escenas 2D existentes.

Detalles de implementación:
- **Un rAF maestro**: `Application` de Pixi con `autoStart: false` (o detener su ticker) y en el mismo callback: `world.update(dt)` → `threeRenderer.render()` (o `renderPipeline.render()`) → `pixiApp.renderer.render(stage)`. GSAP puede seguir siendo la fuente de tiempo (`gsap.ticker`).
- **Init asíncrono**: `await threeRenderer.init()` antes del primer frame; `resetState()`/`getContext()` lanzan error si el backend no está inicializado (verificado en `src/renderers/common/Renderer.js` de r186).
- **DPR**: Three `setPixelRatio(Math.min(devicePixelRatio, capDelTier) * renderScale)`; Pixi `resolution: devicePixelRatio, autoDensity: true`. Ambos canvas con el mismo tamaño CSS; un único `ResizeObserver` redimensiona los dos.
- **Entrada**: el canvas de Pixi recibe todos los eventos. Si el `EventSystem` de Pixi no golpea ningún objeto interactivo (target = stage), el puntero se reenvía al mundo: `Raycaster` de three (acelerado con `three-mesh-bvh` para el terreno). Nunca `pointer-events: none` en el canvas de Pixi (romperíamos la UI).
- **Modo B como respaldo**: si algún día hiciera falta un solo canvas (p. ej. captura de pantalla unificada), `WebGPURenderer({ forceWebGL: true, stencil: true })` + Pixi `init({ context: three.getContext(), clearBeforeRender: false })` + `resetState()` en cada cambio. `stencil: true` es requisito para las máscaras de Pixi.
- **Opción C** se revisa cuando Pixi quite el "Experimental" de WebGPU.

### Riesgos
- Doble memoria de textura si UI y mundo muestran el mismo gato → la UI usa retratos pequeños; el mundo, atlas por distancia (ver §7).
- Desfase de un frame si cada librería usa su propio ticker → prohibido; un solo rAF.
- Fondo premultiplicado: el canvas de Pixi debe limpiarse con alfa 0 cada frame; r185 cambió el manejo de alfa premultiplicado en `WebGPURenderer` → dar a la escena 3D un `scene.background` opaco.
- Lección ya aprendida (fuga de Graphics en Pixi, +67 MB por batalla): en Three, `dispose()` explícito de geometrías/materiales/texturas por isla; r186 añadió `Object3D.dispose()`.

---

## 3. Personajes 2D ilustrados dentro de una escena 3D

### Técnicas

| Técnica | Qué aporta | Coste en runtime | Coste de producción | Veredicto |
|---|---|---|---|---|
| Billboard plano sin luz | Base | Mínimo | Nulo | Insuficiente (se ven "pegados") |
| Billboard cilíndrico (gira sólo en Y) + leve inclinación a cámara | Se apoya en el suelo, no "flota" | Mínimo | Nulo | **Sí** |
| Sombra *blob* (decal/disco oscuro bajo el gato) | Anclaje al terreno, legibilidad | Ínfimo (1 quad) | Nulo | **Sí, en todos los tiers** |
| Sombra proyectada por silueta (alpha-test en el shadow map) | Sombra con forma de gato, alarga con el sol | 1 draw extra por gato en el pase de sombras | Nulo | **Sí, sólo tier Alto** |
| Pseudo-normales desde SDF del alfa (domo/bisel) | Luz direccional creíble sobre la ilustración, reacciona al día/noche | 1 muestreo extra de textura | **Automático** al rasterizar | **Sí — técnica central** |
| Normal maps estilo Laigter (gradiente de luminancia + bisel) | Más detalle de relieve | Igual | Automático (herramienta GPL-3, offline) | Opcional como referencia; generamos los nuestros |
| Sprite Lamp (perfiles de luz pintados a mano) | La mejor calidad | Igual | Muy alto (4–5 dibujos por pose) | No (172 gatos) |
| Rim light desde el borde del SDF | Separación del fondo, look "ilustración" | Ínfimo (en el mismo shader) | Nulo | **Sí** |
| Rampa toon / half-Lambert (*wrap lighting*) | Evita lados negros, mantiene colores del artista | Ínfimo | Nulo | **Sí** |
| Desplazamiento de profundidad desde el SDF (centro más cerca) | Intersecta pasto/agua de forma natural | Ínfimo (vértice) | Nulo | **Sí** |
| Outline por post-proceso (Sobel/OutlineNode) | Cohesión cel-shading | 1 pase pantalla completa | Nulo | No: los SVG de MAI ya traen contorno; sólo para resaltar selección |
| Tilt-shift / DOF (HD-2D de Octopath) | Look "diorama", oculta lejanía | 1–2 pases | Nulo | **Sí en Medio/Alto**, fijo en cámaras cinemáticas |

Referencias de estilo: **HD-2D** (Octopath Traveler, UE4) combina sprites billboard con entornos 3D, luces puntuales que hacen que los personajes proyecten sombras, y DOF + tilt-shift para el efecto diorama. *Don't Starve* y *Cult of the Lamb* usan personajes 2D en un mundo 3D con cámara fija inclinada y sombras simples; *Paper Mario* acepta que los personajes son de papel y lo convierte en estética (giro al cambiar de dirección). Nuestro caso se parece más a Cult of the Lamb: cámara de ¾ fija o semifija, personajes siempre de frente.

### Recomendación: "gato de papel iluminado"
1. **Geometría**: la malla deformable del puppet (misma que en Pixi) como `BufferGeometry` con `position` en `DynamicDrawUsage`, orientada como billboard cilíndrico. Volteo horizontal (escala X = −1) al cambiar de dirección, con un giro corto tipo Paper Mario animado con GSAP.
2. **Texturas por gato** (generadas en el pipeline del §7): color (RGBA premultiplicado) + mapa auxiliar RGBA = (normal.x, normal.y, altura/SDF, AO).
   - SDF del alfa por *Euclidean Distance Transform* en Worker (512² es trivial).
   - Altura = domo suave `smoothstep(0, R, sdf)` → normales por Sobel; mezcla 20–30 % con normales de luminancia para relieve interno (orejas, mejillas).
   - Como la normal está en el espacio UV del sprite, **se deforma con el puppet sin trabajo extra**.
3. **Shader TSL del gato**: `half-Lambert` con rampa de 3 bandas → `mix(colorArtista, colorArtista * luz, intensidadLuz)` (el artista manda, la luz matiza); ambiente hemisférico (cielo/suelo) desde el mismo LUT del ciclo día/noche; rim = `(1 − sdf_normalizado) * fresnelFalso * colorRim`; desplazamiento de profundidad en vértice ∝ altura.
4. **Sombras**: blob siempre; silueta en el shadow map con `alphaTest` sólo en tier Alto.
5. **Noche/astral**: emisivos (ojos, accesorios mágicos) como canal opcional; bloom los recoge.

### Riesgos
- Alpha-test en bordes con MSAA → usar *alpha-to-coverage* en el material o borde premultiplicado de 1–2 px.
- Orden de transparencias entre muchos billboards → renderizar gatos como opacos con alpha-test + borde suave por coverage, nunca como transparentes ordenados.
- La luz puede "ensuciar" la paleta de MAI → `intensidadLuz` máxima 0.5–0.6 de día; dejar a dirección de arte la rampa.

---

## 4. Runtimes de animación 2D esquelética / de malla

| Opción | Versión / estado | Licencia | Integra con Three | Encaje con MAI SVG | Veredicto |
|---|---|---|---|---|---|
| **Puppet propio** (`puppetCore.ts`) | En producción; núcleo ya independiente del renderer (2026-10-09) | Nuestra | Adaptador nuevo (~200 líneas): Float32Array → atributo `position` | Total (rigs en `catRigs.json`) | **Elegido** |
| Spine | Runtimes `@esotericsoftware/spine-pixi-v8` y `spine-threejs` 4.3.13 (2026-07-24) | **Propietaria**: runtime ligado a licencia del editor; mallas requieren **Professional US$379/usuario** (precio de lista US$449); **Enterprise US$2 499 + US$379/usuario/año** si la empresa tiene ≥US$500k de ingresos *o financiamiento*; cada persona que integre o modifique el runtime necesita su propia licencia | Sí (oficial) | Malo: obliga a re-riggear 172 gatos en el editor e importar raster, no SVG | No |
| Rive | `@rive-app/canvas` / `webgl2` 2.44.1 (2026-10-09), runtime MIT | Editor freemium: Free exporta **con splash screen**; Cadet US$9/asiento/mes (máx. 3) para quitarlo; Voyager US$32; Enterprise US$120 (≥US$10M de ingresos) | Indirecto: renderiza a su propio canvas/contexto → copiar a textura cada frame | Medio (importa SVG, pero sería re-autoría) | No para gatos; quizá para UI animada |
| DragonBones | Oficial abandonado por Egret; ports comunitarios `dragonbones-pixijs` 1.0.5 (2025-05) y `pixi-dragonbones-runtime` 8.0.3 (2025-04) | MIT/ISC | No hay runtime para Three | Malo | **Descartado** (sin mantenimiento) |
| Lottie | `@lottiefiles/dotlottie-web` 0.81.0 (2026-10-06, ThorVG/WASM), `lottie-web` 5.13.0 (2025-05) | MIT | Sólo como textura de vídeo | Sólo reproducción, sin interacción ni física | Sólo para VFX de UI |

### Recomendación
Mantener el puppet propio. Ya hace lo que el juego necesita (resortes de inclinación/agachado/mirada/caminar/dormir, parpadeo, orejas, cola, emotes), no tiene coste de licencia, funciona con SVG puro y su núcleo ya es agnóstico del renderer. Hay que escribir sólo un adaptador Three (`paperCat`) que copie el `Float32Array` de vértices al atributo `position` y marque `needsUpdate`. Con >60 gatos animados a la vez, mover la deformación a la GPU: subir los parámetros del brain (≈16 floats por gato) a un `instancedArray`/`DataTexture` y deformar en el vertex shader TSL, para dibujar todos los gatos con un único `InstancedMesh` por atlas.

### Riesgos / banderas de licencia
- **Spine**: no es open source; si algún día se acepta código de colaboradores, cada uno necesitaría licencia. El umbral de US$500k cuenta también inversión y capital de riesgo.
- **Rive**: sin pagar, cada export muestra el splash; la tarifa es mensual por asiento (coste recurrente).
- Puppet propio: el riesgo es el *bus factor*. Mitigarlo con pruebas de vitest sobre `PuppetBrain` (determinismo de resortes por semilla).

---

## 5. Agua, cielo, nubes, niebla, luz volumétrica, partículas, vegetación

| Elemento | Opciones | Coste (tier Bajo) | Recomendación |
|---|---|---|---|
| Océano | (a) FFT/Tessendorf; (b) **Gerstner 3–4 ondas en vértice TSL** + normales analíticas; (c) `WaterMesh` (reflejo plano) | (a) alto; (b) bajo; (c) re-renderiza la escena | **(b)** + espuma de orilla por profundidad (`viewportDepthTexture`/`linearDepth` en TSL) + bandas toon + cáusticas de ruido desplazado. Reflejo plano sólo en tier Alto, a media resolución |
| Cielo / día-noche | Preetham/Hosek (`SkyMesh` TSL), atmósfera física (`@takram/three-atmosphere` 0.19.1, beta, geoespacial) o **gradientes pintados** | Gradiente: 1 lookup | **LUT 2D pintada (hora × altura)** que alimenta cielo, niebla, ambiente hemisférico y rim de gatos; estrellas/aurora astral como capa propia. `SkyMesh` sólo como referencia para calibrar el atardecer |
| Nubes | Volumétricas (`@takram/three-clouds` 0.7.6: WebGPU "en progreso"), raymarching propio, **sprites de nubes pintadas** | Sprites: casi nulo | **Billboards de nubes ilustradas** (pueden salir de SVG como los gatos) + "cookie" de sombra de nubes desplazada sobre terreno y agua |
| Niebla | `Fog`/`FogExp2`, niebla de altura en TSL | Ínfimo | Exponencial + de altura, color desde la LUT; oculta el borde del mundo y separa islas flotantes |
| Luz volumétrica | `GodraysNode` (pantalla), conos de geometría aditiva | Godrays: 1–2 pases; conos: ínfimo | **Conos/planos aditivos con fresnel y ruido** en todos los tiers; `GodraysNode` sólo en Alto |
| Partículas | three.quarks 0.17.1 (usa `ShaderMaterial` + `onBeforeCompile` → **incompatible** con `WebGPURenderer`; WebGPU sin marcar en su roadmap), **TSL propio** | Instanced: bajo | **Propias en TSL**: `InstancedMesh` de billboards; en WebGPU, simulación con `instancedArray` + `compute()`; en el fallback, atributos instanciados actualizados en CPU. Límite por tier |
| Vegetación | `InstancedMesh`, `BatchedMesh` | Bajo | `InstancedMesh` por **chunk** de isla (p. ej. 32×32 m) con viento en el vértice TSL; pasto como *cross-quads* pintados; flores/arbustos desde SVG rasterizados a atlas |
| LOD | `LOD` de three, impostores, fade por distancia | — | Fundido por distancia (dither) + reducción de densidad por tier; islas lejanas como impostores pintados |
| Culling | Frustum por objeto (incluido) | — | Frustum por chunk (bounding sphere por `InstancedMesh`); islas fuera de cámara se pausan (IA y animación incluidas) |

### Riesgos
- La espuma por profundidad necesita la textura de profundidad de la escena → con `WebGPURenderer` viene del nodo de viewport; en el fallback WebGL2 cuesta un *resolve* extra. Medirlo en Iris Xe.
- Las librerías de takram son geoespaciales (escala planeta) y están en beta; no encajan con islas pequeñas estilizadas.
- Un `InstancedMesh` gigante para toda la isla impide el culling → siempre por chunks.

---

## 6. Vida ambiental: decenas de gatos NPC ligeros

| Enfoque | Pros | Contras | Uso |
|---|---|---|---|
| FSM simple | Trivial, depurable, barato | Explota en transiciones si crece | Estados de bajo nivel |
| Behavior trees (`mistreevous` 4.3.1, MIT, 2025-07; DSL "MDSL") | Composición, buen tooling | Coste por tick, árbol por agente, sobra para "vida ambiental" | Sólo NPCs de historia con guion |
| **Utility AI** | Comportamiento emergente con pocas reglas; personalidad = pesos | Requiere afinar curvas | Elegir *qué* hacer |
| GOAP | Planes complejos | Caro, excesivo | No |
| Steering (Reynolds) | Movimiento natural | — | *Cómo* moverse |
| Yuka 0.7.8 (MIT) | Steering + FSM + navmesh | **Último release 2022-09** (sin mantenimiento) | Sólo como lectura de referencia |

### Recomendación: "FSM guiada por utilidad" + steering propio
- Cada gato tiene una FSM pequeña (`idle`, `deambular`, `sentarse`, `dormir`, `acicalarse`, `seguir`, `socializar`, `huir`, `mirar`) cuyos estados ya existen como actos/emotes del puppet.
- Al terminar un estado, una función de utilidad elige el siguiente: necesidades (energía, curiosidad, sociabilidad), contexto (hora, clima, distancia al jugador, gatos cerca) y personalidad del gato (pesos desde los datos del Catdex). Unas 150 líneas.
- Steering propio (seek, arrive, wander, separation, evitar obstáculos contra un *heightfield*/grilla caminable): ~150 líneas. Vecinos por *spatial hash*.
- **LOD de IA**: gatos visibles cerca a 10–20 Hz, lejanos a 2–5 Hz, fuera de pantalla a 1 Hz o congelados.
- **Determinismo**: RNG con semilla por gato y por día de juego; nunca persistir estado de IA efímero en el save (respeta el pipeline de saves y migraciones).

Riesgo: la utilidad mal calibrada produce gatos que "tiemblan" entre estados → histéresis (bonus al estado actual) y duración mínima por estado.

---

## 7. Pipeline SVG glossy → texturas

### Hechos verificados
- `createImageBitmap` con un **Blob SVG** no es fiable: reportes de que no se soporta; la especificación exige tamaño intrínseco (si no, `InvalidStateError`); en Workers no existe `Image`/DOM para decodificar SVG. Con raster (PNG/WebP) en Worker sí funciona.
- Los SVG de MAI: ~36 000 `<path>` planos + una `<mask>` de luminancia, 700×700 lógicos, ~4 MB cada uno; el raster en hilo principal cuesta ~15–25 ms un gato "lite" y bastante más uno "full" (medido en `rasterCache.ts`). Ya existe una caché persistente WebP (Cache Storage) invalidada por `BUILD_ID`.
- Basis Universal v2.5 (Apache-2.0) puede compilar **encoder y transcoder a WebAssembly** (`webgl/encoder`), con multihilo opcional; three trae sólo el transcoder (`KTX2Loader`).

### Opciones

| Etapa | Opción | Pros | Contras | Elección |
|---|---|---|---|---|
| Raster | `<img>` + `decode()` + `drawImage` en hilo principal (actual) | Fidelidad del navegador | Bloquea 15–25+ ms por gato | Fallback |
| Raster | **`@resvg/resvg-wasm` 2.6.2 en Worker** (MPL-2.0) | Fuera del hilo principal, soporta máscaras | Último release 2024-03; posible diferencia mínima vs Chrome | **Principal**, tras prueba de fidelidad (diff de píxeles contra Chrome en los 172 gatos) |
| Raster | Pre-raster en build (Chrome headless/resvg en CI) a WebP | Cero coste en runtime | Choca con la decisión "cero raster en el repo" sólo si se commitea; en `dist/` no | Opcional para tier Bajo |
| Caché | WebP en Cache Storage (actual) | Ya hecho y probado | — | **Mantener**; ampliar con tamaños por tier y el mapa auxiliar (normal/SDF) |
| GPU | RGBA8 + mipmaps | Simple, máxima calidad | 4 B/px | **Gatos** |
| GPU | KTX2 (UASTC→BC7/ASTC, ETC1S) | 4–8× menos VRAM | Codificar UASTC en el navegador es lento; artefactos en bordes con alfa | **Sólo texturas de entorno**, codificadas offline al hacer build |

### Recomendación
1. Worker de raster (`resvg-wasm`) → `ImageBitmap` RGBA a la resolución del tier → en el mismo Worker: SDF + normales → transferir ambos bitmaps al hilo principal → `THREE.Texture` (y `Pixi Texture` si la UI lo necesita).
2. Resoluciones: **256** (lejos/multitud), **512** (normal), **1024** (primer plano/cámara cinemática). Se elige por tamaño en pantalla con LRU y *streaming*.
3. Atlas por bioma para gatos ambientales de 256/512 (menos cambios de textura, habilita el `InstancedMesh` del §4).
4. Presupuesto de VRAM para texturas del mundo (color + auxiliar, con mips ≈ ×1.33):
   - 512² ≈ 1.4 MB color + 1.4 MB auxiliar ≈ **2.8 MB por gato**; 1024² ≈ **11 MB por gato**.
   - Bajo (Iris Xe, memoria compartida): ≤ **256 MB** en total para el mundo → ~40 gatos a 512 + entorno.
   - Medio: ≤ 512 MB. Alto: ≤ 1 GB (1024 sólo para ≤ 8 gatos en primer plano).
5. KTX2 para terreno, roca, agua y nubes, codificado offline (basisu/toktx) en el build hacia `dist/`.

### Riesgos
- Fidelidad de resvg con la máscara de luminancia de MAI → validar con diff; si falla en algún gato, ese gato usa el camino del hilo principal (por lista).
- MPL-2.0: usar el paquete tal cual; si se parchea un archivo de resvg, ese archivo se publica.
- Picos de memoria al rasterizar 36k paths a 1024² en Worker → cola de un raster a la vez por Worker, con 2 Workers como máximo.

---

## 8. Hardware de referencia y tiers de calidad

### Recomendación
**Hardware de referencia para 60 FPS en tier "Bajo": Intel Iris Xe (96 EU, Tiger Lake/Alder Lake) a 1920×1080 en Chrome estable, enchufado.**
**Referencia para tier "Medio" a resolución nativa: Apple M1 (GPU de 8 núcleos) / NVIDIA GTX 1650.**

Justificación:
- El público de un juego web es más de laptop que el de Steam (cuyo top 10 de septiembre 2026 es todo NVIDIA, con la RTX 5070 al frente con 6.15 %). Iris Xe es la GPU integrada más común en laptops de 2020–2024; si el juego corre a 60 ahí, corre en casi todo lo de escritorio.
- Iris Xe saca una mediana de ~1 517 en 3DMark Time Spy (UL), un orden de magnitud por debajo de una dGPU moderna y con memoria compartida, así que el límite real es el *fill rate* y el ancho de banda. Por eso el tier Bajo reduce la escala de render del 3D (posible gracias a los dos canvas) y no las cosas que se notan (UI, nitidez de gatos).
- M1 es el piso de los Mac que soportan WebGPU con Safari 26/Firefox 145 en ARM.

### Tiers (selección automática: info del adapter + frame time medido en los primeros 3 s; ajuste manual en Opciones)

| | **Bajo** (Iris Xe / UHD 7xx) | **Medio** (M1, GTX 1650, RX 6500) | **Alto** (RTX 3060+, M2 Pro+) |
|---|---|---|---|
| Escala de render 3D | 0.67–0.8 (dinámica) | 1.0 | 1.0 × DPR hasta 1.5 |
| Sombras | Sólo blob | 1 cascada 1024² (`PCFShadowMap`) | 2048², silueta de gatos |
| Agua | Gerstner + espuma, sin reflejo | + cáusticas | + reflejo plano a ½ resolución |
| Post | FXAA, sin bloom | Bloom ½ res, SMAA, tilt-shift en cinemáticas | + Godrays, DOF, GTAO |
| Partículas (máx. vivas) | 2 000 (CPU) | 10 000 | 50 000 (compute) |
| Gatos animados a la vez | 20 (resto congelado/impostor) | 40 | 80 |
| Texturas de gato | 256/512 | 512/1024 | 1024 |
| Presupuesto por frame | 16.6 ms: ~2 ms UI Pixi, ~9 ms mundo GPU, ~4 ms CPU (IA+puppet+lógica) | igual | igual |

Riesgos: los controladores Intel en Linux no siempre tienen WebGPU (Chromium Linux limitado a Intel Gen12+; Firefox Linux en progreso) → el tier Bajo debe validarse **en WebGL2** también. Las laptops con batería reducen la frecuencia de la GPU → avisar en Opciones; con batería el tier automático baja un nivel.

---

## Fuentes (todas consultadas el 2026-10-09)

**Versiones (registro npm, consultado vía `registry.npmjs.org/<paquete>`):**
three 0.186.1 (2026-09-24); @types/three 0.186.0; @babylonjs/core 9.30.0 (2026-10-08); playcanvas 2.23.1 (2026-10-07); phaser 4.2.1 (2026-07-09); pixi.js 8.22.0 (2026-10-01); @esotericsoftware/spine-pixi-v8 y spine-threejs 4.3.13 (2026-07-24); @rive-app/canvas y webgl2 2.44.1 (2026-10-09); dragonbones-pixijs 1.0.5 (2025-05-21); pixi-dragonbones-runtime 8.0.3 (2025-04-17); lottie-web 5.13.0; @lottiefiles/dotlottie-web 0.81.0; three.quarks 0.17.1 (2026-05-21); postprocessing 6.39.5; three-mesh-bvh 0.9.16; @takram/three-atmosphere 0.19.1; @takram/three-clouds 0.7.6; mistreevous 4.3.1 (2025-07-24); yuka 0.7.8 (2022-09-17); @resvg/resvg-wasm 2.6.2 (2024-03-26); gsap 3.15.0.

**Mediciones propias:** bundles con esbuild 0.28.2 sobre imports representativos (scratchpad de la sesión); inspección del código fuente de `three@0.186.1` (`src/renderers/common/Renderer.js`: `getContext()`, `resetState()` con error si no hubo `init()`; `webgl-fallback/WebGLBackend.js`: `parameters.context` y `compute()` vía transform feedback; `webgpu/WebGPUBackend.js`: `parameters.device`), de `pixi.js@8.22.0` (`GpuDeviceSystem.d.ts`: opción `gpu` "Using shared device and adaptor from other engine") y de `three.quarks@0.17.1` (usa `ShaderMaterial` y `onBeforeCompile`). Assets del juego: `game/public/cats-svg` y `game/src/art/rasterCache.ts`, `puppetCore.ts`.

**Motores y renderers**
- three.js — Migration Guide (r183–r186): https://github.com/mrdoob/three.js/wiki/Migration-Guide
- three.js — Docs de WebGPURenderer (forceWebGL, fallback WebGL2): https://threejs.org/docs/pages/WebGPURenderer.html
- three.js — KTX2Loader: https://threejs.org/docs/pages/KTX2Loader.html
- r186 (Gaussian splats, sólo WebGPU): https://radiancefields.com/three.js-ships-its-native-gaussian-splat-renderer-and-splat-raycasting-in-r186 · https://cgworld.jp/flashnews/01-202610-Threejs-r186.html
- r183 RenderPipeline (secundaria): https://app.cinevva.com/es/news/2026-03-18-threejs-r183-render-pipeline
- Rendimiento WebGPU vs WebGL en three (2025): https://ics.media/en/entry/250501/
- Babylon.js 9.0: https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0
- PlayCanvas 2.0 (fin de WebGL1): https://blog.playcanvas.com/playcanvas-engine-hits-2-0-0 · v2.19: https://forum.playcanvas.com/t/engine-v2-19-0/42321
- Phaser 4: https://phaser.io/download/stable · v4.2.1: https://gamedev.net/news/4825-phaser-v421-released/

**Pixi + Three**
- Guía oficial "Mixing PixiJS and Three.js": https://pixijs.com/8.x/guides/third-party/mixing-three-and-pixi
- Renderers de Pixi v8 (WebGPU "Experimental", recomendación WebGL en producción, `resetState`): https://pixijs.com/8.x/guides/components/renderers
- Pixi 8.7.0 (mejoras de contexto compartido): https://pixijs.com/blog/8.7.0

**Soporte WebGPU**
- web.dev, "WebGPU is now supported in major browsers" (2025-11-25): https://web.dev/blog/webgpu-supported-major-browsers
- Khronos SIGGRAPH 2026 (Chromium Linux Intel Gen12+): https://www.khronos.org/developers/linkto/webgl-and-webgpu-sigg26
- Estado 2026 (secundaria): https://vr.org/articles/webgpu-baseline-2026-three-js-webxr-default

**Personajes 2D en 3D**
- HD-2D: https://en.wikipedia.org/wiki/HD-2D · Spotlight de Unreal sobre Octopath Traveler: https://www.unrealengine.com/en-US/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true
- Laigter (GPL-3): https://laigter.readthedocs.io/en/latest/Introduction/intro.html · https://azagaya.itch.io/laigter/devlog/89223/laigter-is-now-open-source

**Animación 2D y licencias**
- Spine — compra y ediciones: https://esotericsoftware.com/spine-purchase
- Spine Runtimes License (actualizada 2025-04-05): https://esotericsoftware.com/spine-runtimes-license
- Rive — precios: https://rive.app/pricing · runtime web (MIT): https://github.com/rive-app/rive-wasm
- DragonBones (abandono por Egret, port Pixi v8): https://unpkg.com/dragonbones-pixijs@1.0.5/README.md
- GSAP Standard License: https://gsap.com/standard-license

**Agua, cielo, partículas**
- Toon water con espuma por profundidad (three.js forum): https://discourse.threejs.org/t/toon-water-shader-with-depth-based-fog-and-intersection-foam/35978
- Creating Toon Water for the Web (parte 1 y 2): https://code.tutsplus.com/creating-toon-water-for-the-web-part-1--cms-30447t · https://code.tutsplus.com/creating-toon-water-for-the-web-part-2--cms-30485t
- three.quarks (roadmap: WebGPU sin hacer): https://github.com/Alchemist0823/three.quarks
- takram three-geospatial (atmosphere WebGPU hecho, clouds en progreso): https://github.com/takram-design-engineering/three-geospatial

**IA**
- mistreevous: https://www.npmjs.com/package/mistreevous

**Texturas**
- Basis Universal v2.5 (encoder WASM, Apache-2.0): https://github.com/BinomialLLC/basis_universal
- createImageBitmap y SVG: https://github.com/whatwg/html/pull/972 · https://forum.babylonjs.com/t/dynamic-svg-texture-loading-fails-using-webgpu-but-works-using-webgl/41091/3 · https://caniuse.com/createimagebitmap

**Hardware**
- Intel Iris Xe en 3DMark (UL): https://benchmarks.ul.com/hardware/gpu/Intel%20Iris%20Xe%20Graphics+review
- Steam Hardware Survey, septiembre 2026 (resumen): https://ixbt.games/en/news/2026/10/02/valve-nazvala-samye-populiarnye-videokarty-steam-v-sentiabre-2026-goda-i-podtverdila-vaznost-russkoi-lokalizacii.html
- three.js en GPUs Intel integradas (foro): https://discourse.threejs.org/t/three-js-performance-on-intel-uhd-620-graphics/24676

> Nota de confianza: los costos por tier (ms, VRAM, número de partículas o gatos) son **presupuestos de diseño** derivados de los datos de arriba, no mediciones en la máquina de referencia. El primer prototipo debe medirlos en una Iris Xe real (en WebGPU y en WebGL2) antes de fijarlos.
