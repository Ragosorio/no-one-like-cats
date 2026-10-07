# Motor y plataformas: qué usamos, qué cuesta cambiarlo y cómo llegar a las tiendas

Este documento responde tres preguntas del autor:

1. ¿Por qué usamos este motor de render (PixiJS)?
2. ¿Qué costaría cambiarlo por otro, o hacer uno propio?
3. ¿Qué podemos y qué no podemos cambiar si publicamos en App Store, Google Play o como app de computadora, con la meta de que se sienta **lo más nativo y fluido posible**?

Es un análisis de ingeniería honesto, no un folleto. Los datos de tiendas, precios y versiones se revisaron en las fuentes oficiales el **6 de octubre de 2026**. Lo marcado **(verificar)** es conocimiento propio sin fuente oficial a la mano; revísalo antes de tomar una decisión con dinero de por medio.

---

## Resumen corto

- **Nos quedamos con PixiJS.** El juego ya funciona bien en la web, que es su casa. Cambiar de motor significa reescribir alrededor de **56 mil de las 75 mil líneas** de TypeScript del juego y no compra nada que no podamos conseguir de forma más barata.
- **Lo que se siente "poco nativo" casi nunca es el motor**, sino carga, tiempos de rasterizado, empaquetado y detalles de plataforma. Ejemplo real: las barras negras en pantallas anchas eran **nuestra propia máscara de letterbox**, no PixiJS. Ya se arregló: cada escena pinta su fondo hasta los bordes (`bleed` en `game/src/core/scenes.ts`, vista extendida en `game/src/core/App.ts`).
- **Para tiendas:** Android con TWA (lo más barato) o Capacitor; iOS con Capacitor; computadoras con Tauri (o Electron para Steam en Linux). Todo reutiliza el mismo código web.
- **Lo que más se nota en fluidez** es un plan de rendimiento (caché de rasterizado, atlas en tiempo de ejecución, calidad adaptable), no un motor nuevo.

---

## 1. Qué usamos hoy

| Pieza | Versión | Para qué |
|---|---|---|
| PixiJS | 8.22 (`game/package.json`: `^8.22.0`) | Render 2D por GPU: sprites, `Graphics`, texto, mallas deformables, filtros. |
| GSAP | 3.15 | Todas las animaciones y secuencias (timelines). |
| pixi-filters | 6.1 | RGB split, glitch, contorno, etc. Más nuestros shaders propios (`InkFilter`, `ComicFilter` en `game/src/fx/filters.ts`). |
| Vite + TypeScript | Vite 8, TS 7 | Build y servidor de desarrollo. |
| PWA | `public/manifest.webmanifest`, `public/sw.js` | Instalable, pantalla completa, funciona sin internet. |

El renderer está fijado a WebGL: `preference: 'webgl'` en `game/src/core/App.ts`. Pantalla lógica de 1920×1080 que se escala a cualquier ventana.

### Por qué PixiJS encaja con este juego

- **Gatos vivos.** Cada gato es una pintura SVG rasterizada a textura y montada sobre una malla (`Mesh` de Pixi) que deformamos cada cuadro con su rig: parpadeo, orejas, cabeza, cola, respiración (`game/src/art/livingCat.ts`). Pixi hace eso barato y directo. Muchos motores lo harían con huesos y piezas recortadas, que es justo lo que no queremos.
- **Filtros y shaders.** La identidad visual ("cada elemento imprime su propia dimensión": cómic, tinta manga, glitch, risografía) depende de filtros por objeto. Pixi los trae y deja escribir los nuestros.
- **Es web primero.** Abres un link y juegas. Sin instalar 40 MB de motor antes de ver el primer gato. La PWA y el modelo "gratis para todos" se apoyan en eso.
- **Es una biblioteca, no un framework.** Nuestro estado, simulador de combate, economía y misiones no dependen de Pixi (sección 3). Eso hace que el motor sea reemplazable si algún día de verdad hiciera falta.
- **WebGPU ya está en camino.** PixiJS 8 trae renderer WebGPU, pero su documentación lo marca como *experimental* y recomienda WebGL para producción por diferencias entre navegadores (revisado 2026-10-06, [pixijs.com](https://pixijs.com/8.x/guides/components/renderers)). Cuando lo marquen estable, probarlo es cambiar una línea (`preference`) y medir.

---

## 2. Qué está atado al motor y qué no

Medido sobre `game/src/` (archivos `.ts`):

| Carpeta | Líneas | En archivos que importan Pixi o GSAP |
|---|---:|---:|
| `state/` (estado, sistemas, migraciones, parches) | 8 154 | 0 |
| `data/` (+ `content.json`, `balance.json`) | 434 | 0 |
| `battle/` (simulador, IA, barcos, vistas) | 12 356 | 5 934 |
| `panels/` | 21 588 | 21 117 |
| `island/` | 12 036 | 10 643 |
| `scenes/` | 8 119 | 8 119 |
| `ui/`, `fx/`, `art/`, `app/`, `core/` | ~12 350 | ~10 650 |
| **Total** | **~75 100** | **~56 500** |

Traducido: unas **18 mil líneas** (estado, datos, simulador de combate, IA, economía) se mudan a cualquier motor que corra TypeScript/JavaScript casi sin cambios. Las otras **56 mil** son interfaz, isla, escenas, efectos y arte en código: eso es lo que se reescribe si cambiamos de motor. Si el motor nuevo usa otro lenguaje (C#, GDScript, Dart, Lua), se reescribe **todo**.

---

## 3. Alternativas y lo que costarían

Estimaciones en **meses de una persona a tiempo completo**, con el contenido actual del Capítulo 1. Son órdenes de magnitud para decidir, no promesas.

| Opción | Estado (2026-10-06) | Qué ganaríamos | Qué perderíamos / riesgo | Costo de migrar |
|---|---|---|---|---|
| **Seguir con PixiJS** | 8.22, mantenido | Nada que migrar. WebGPU cuando madure. | Nada nuevo. | 0 |
| **Phaser 4** | 4.0 salió en abril de 2026, va en 4.2.1 | Escenas, física, cámara y cargadores integrados; comunidad grande. | Mismo tipo de render (WebGL) que ya tenemos: no es más "nativo". Las mallas deformables y los filtros por objeto hay que rehacerlos. | 3 a 5 meses (reescribir toda la capa visual; el estado se conserva) |
| **WebGL/WebGPU propio** | — | Control total, tamaño mínimo. | Reinventar batching, texto, filtros, máscaras, eventos de puntero, accesibilidad. Mucho riesgo para un equipo chico. | 6 a 12 meses, y mantenimiento para siempre |
| **Godot 4.7** | Estable 4.7.2. Web: solo WebGL 2 (renderer Compatibility), sin WebGPU; C# **no** exporta a web; hilo único por defecto desde 4.3 | Exportación nativa real a iOS, Android, Windows, Mac, Linux y consolas (vía terceros). Editor visual. | Reescritura completa en GDScript. La versión web pesa varios MB de motor antes del primer cuadro (peor primera carga que hoy). El SVG se rasteriza al importar: se pierde el "SVG vivo" tal como lo tenemos. | 8 a 12 meses |
| **Unity 6** | WebGPU pasó de experimental (6.2) a soportado en 6.6 según su documentación (confirmación parcial) | Herramientas enormes, tiendas de assets, consolas. | Reescritura completa en C#. Build web pesado. Ecosistema pensado para 3D y para monetización que no usamos. Condiciones de licencia que hay que vigilar (verificar). | 9 a 12 meses |
| **Defold** | 1.13.2; HTML5 con WebGL 2, builds con y sin hilos | Motor ligero, muy bueno en móvil, gratis. | Reescritura completa en Lua. Comunidad más chica. Mallas y shaders propios hay que rehacerlos. | 6 a 9 meses |
| **Flutter + Flame** | (verificar versiones) | Una base de código para app nativa y web. | Reescritura completa en Dart. En web, Flutter carga un runtime de render grande. Flame es menos maduro para efectos 2D pesados que Pixi. | 6 a 9 meses |

**Conclusión:** ningún cambio de motor se paga solo. El único escenario donde valdría la pena pensarlo es si el juego llegara a consolas, y aun ahí la vía más barata sería un *port* específico, no mudar la versión web.

---

## 4. Empaquetado: de la web a las tiendas

La regla: **un solo código web**, varios envoltorios. Qué existe y qué cuesta:

### Web / PWA (hecho)

- Se instala desde Chrome, Edge, Android y Safari (iPhone: *Compartir → Agregar a inicio*). Pantalla completa, ícono propio, sin internet.
- Costo: USD 0. Publicación: GitHub Pages en cada push a `main`.
- Actualizaciones al instante (sistema de `docs/ACTUALIZACIONES.md`).

### Android

**Opción A: TWA (Trusted Web Activity) con Bubblewrap o PWABuilder.** La app de Play abre nuestra PWA a pantalla completa usando Chrome.

- Bubblewrap sigue mantenido (release 1.25.0 del 31-jul-2026, apunta a Android SDK 36). PWABuilder es la interfaz gráfica y usa Bubblewrap por debajo. ([github.com/GoogleChromeLabs/bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap), [pwabuilder.com](https://www.pwabuilder.com))
- Requiere **Digital Asset Links**: un `/.well-known/assetlinks.json` en la **raíz del dominio** cuya huella coincida con la llave de firma (ojo: la de *Play App Signing*, no la tuya local). Si falla la verificación, la app se abre como pestaña con barra de URL. ([developer.chrome.com](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start))
- **Detalle práctico para nosotros:** el juego vive en `ragosorio.github.io/no-one-like-cats/`, y el `assetlinks.json` tiene que estar en `ragosorio.github.io/.well-known/`. Eso exige el repositorio de sitio de usuario (`Ragosorio/ragosorio.github.io`) o, mejor, un **dominio propio**. Con GitHub Pages hay que asegurarse de que la carpeta `.well-known` se publique (archivo `.nojekyll`) (verificar).
- Ventajas: las actualizaciones web llegan solas, sin pasar por revisión; el APK pesa muy poco. La partida vive en el almacenamiento de Chrome para ese origen.
- No encontramos un requisito oficial vigente de puntaje Lighthouse para TWA; no lo des por regla.

**Opción B: Capacitor 8.** El juego se empaqueta dentro de la app (WebView del sistema).

- Capacitor 8 es estable desde diciembre de 2025 (va en 8.5.2; ya hay 9.0 alfa). Mínimos: **Android 7.0 (API 24)** e **iOS 15**. ([capacitorjs.com](https://capacitorjs.com/docs/main/reference/support-policy))
- Ventajas: funciona sin internet desde el primer arranque, acceso a vibración, notificaciones, Play Games, etc.
- Desventaja: cada actualización pasa por la tienda.

**Costos y reglas de Google Play** (revisado 2026-10-06):

- Registro: **USD 25, una sola vez**. ([support.google.com](https://support.google.com/googleplay/android-developer/answer/6112435))
- Cuentas personales nuevas: **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de poder pedir producción. Si un tester sale y vuelve, el conteo se reinicia. ([support.google.com](https://support.google.com/googleplay/android-developer/answer/14151465))
- Desde el 31-ago-2026 las apps nuevas y actualizaciones deben apuntar a **Android 16 (API 36)** (se podía pedir prórroga hasta el 1-nov-2026). ([support.google.com](https://support.google.com/googleplay/android-developer/answer/11926878))

### iOS / iPadOS (App Store)

Apple no acepta TWA: la vía es **Capacitor** (WKWebView con el juego dentro del binario).

- **Costo:** USD 99 al año (el precio local puede variar). La exención de cuota existe solo para organizaciones sin fines de lucro, instituciones educativas o gobierno; no aplica a personas. ([developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/), [fee waivers](https://developer.apple.com/help/account/membership/fee-waivers))
- **Regla 4.2 (funcionalidad mínima):** la app tiene que ir más allá de un "sitio web reempaquetado" y sentirse como app. Nosotros cumplimos si: el juego va **dentro** del binario, funciona sin internet, respeta áreas seguras (notch), usa vibración háptica en golpes y tiene íconos y pantalla de arranque propios. ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/))
- **Regla 4.7 (mini apps y juegos HTML5):** desde el 13-nov-2025 menciona explícitamente juegos HTML5/JavaScript que **no** vienen en el binario, y exige cosas como no exponer APIs nativas a ese contenido sin permiso (4.7.2) y control de edad (4.7.5). Nuestra lectura (no es texto de Apple): si empaquetamos el juego completo dentro de la app, nos evaluarán sobre todo por 4.2 y 2.5.2; si cargáramos el juego remoto desde GitHub Pages, entraríamos en 4.7. **Recomendación: empaquetarlo dentro.** ([developer.apple.com/news](https://developer.apple.com/news/?id=ey6d8onl))
- Desde el 28-abr-2026 hay que compilar con **Xcode 26 y el SDK de iOS 26**. También hay que responder el cuestionario nuevo de clasificación por edad. ([upcoming requirements](https://developer.apple.com/news/upcoming-requirements/))
- WebGPU llegó a Safari 26 (macOS, iOS, iPadOS) y, según un ingeniero de Apple en sus foros, en WKWebView funciona cuando está activado por defecto, como en iOS 26. No lo necesitamos hoy (usamos WebGL). ([webkit.org](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/))

### Computadoras

| | **Tauri 2** | **Electron** |
|---|---|---|
| Estado | Estable desde oct-2024; va en 2.12.1. La 3.0 alfa agrega un runtime opcional con Chromium (CEF). | v44.6 |
| Tamaño | "Una app mínima puede pesar menos de 600 KB" + nuestros assets ([v2.tauri.app](https://v2.tauri.app/start/)) | Embebe Chromium: decenas de MB extra (unos 45 a 120 MB según plataforma; cifra de terceros, verificar) |
| Motor web | El del sistema: WebView2 (Chromium) en Windows, WKWebView en Mac, **WebKitGTK en Linux** | Chromium igual en todos lados |
| Riesgo | En Linux, WebGL 2 puede caer a render por software o ir lento; problemas con NVIDIA (workaround `WEBKIT_DISABLE_DMABUF_RENDERER=1`). Tauri recomienda tener un camino sin WebGL en Linux. ([linux graphics](https://v2.tauri.app/develop/debug/linux-graphics/)) | Pesado, pero predecible |

**Recomendación:** Tauri para Windows y Mac (liviano, se siente nativo). Para Linux / Steam Deck, Electron o esperar la opción CEF de Tauri 3, porque nuestro juego depende de WebGL y de mallas deformables.

**Tiendas de computadora:**

- **Steam Direct:** USD 100 por app, no reembolsable, pero se recupera al llegar a USD 1 000 de ingresos ajustados. Como el juego es gratis, ese dinero no se recupera. ([partner.steamgames.com](https://partner.steamgames.com/doc/gettingstarted/appfee))
- **Microsoft Store:** registro **sin costo** para individuos y empresas entrando por `storedeveloper.microsoft.com` (piden identificación y selfie). Una PWA se publica empaquetada con PWABuilder; los cambios de código web no requieren reenviar, los del manifest sí. ([learn.microsoft.com](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store))
- **itch.io:** gratis, acepta el build web tal cual o el ejecutable de Tauri/Electron.

### El tema del peso

Hoy `game/public/cats-svg/` pesa unos **220 MB sin comprimir**: ~190 MB de SVG completos (unos 1.5 MB comprimidos cada uno) y ~30 MB de versiones `lite/` (unos 200 KB comprimidos cada uno). En la web no importa porque solo se baja lo que se ve. En una app empaquetada sí:

- Empaquetar solo `lite/` dentro de la app (unos pocos MB comprimidos) y bajar los completos bajo demanda (con caché) mantiene la app ligera.
- Empaquetar todo funciona, pero la descarga inicial crece mucho. No lo recomendamos.

---

## 5. Partidas entre plataformas

Hoy la partida vive en `localStorage` del navegador (`game/src/core/save.ts`), con respaldos rotativos y un **exportar/importar como texto** en **Ajustes › RESPALDOS** (`exportSave()` / `importSave()`).

Lo que cambia por plataforma:

- **PWA y TWA:** usan el almacenamiento del navegador para ese origen. Una TWA en Android comparte la partida con el sitio abierto en Chrome (mismo origen).
- **Capacitor:** la app tiene su propio origen, así que **no** comparte partida con la web. Además, la documentación de Capacitor recomienda no confiar en `localStorage` para datos importantes porque el sistema puede limpiarlo bajo presión de espacio (verificar); conviene guardar también con su plugin de preferencias o en un archivo. Como todo el guardado pasa por `core/save.ts`, cambiar el "dónde" es un trabajo acotado.
- **Tauri/Electron:** conviene guardar en un archivo en la carpeta de datos del usuario. Eso además habilita **Steam Cloud** (sincroniza archivos) sin servidor propio.

Opciones de sincronización en la nube, de menos a más trabajo:

1. **Lo que ya existe:** copiar y pegar la partida como texto. Cero costo.
2. **Código de transferencia:** subir la partida a un almacén tipo clave-valor serverless (por ejemplo Cloudflare Workers KV o similar, con capa gratuita) y recuperarla con un código de 8 caracteres. Sin cuentas ni datos personales. Unas 2 a 3 semanas con pruebas.
3. **Nube de cada plataforma:** Steam Cloud (archivos), iCloud key-value (iOS), Play Games guardado en la nube (Android). Cada una es un plugin nativo distinto: 1 a 2 semanas por plataforma.

Cualquiera de estas debe respetar las reglas de `docs/ACTUALIZACIONES.md`: una versión vieja nunca pisa una partida más nueva.

---

## 6. Plan de rendimiento (lo que de verdad hace que se sienta nativo)

Lo que más cuesta hoy es **rasterizar SVG grandes en el hilo principal**: el navegador convierte cada SVG en textura y eso puede trabar unos cuadros al cargar un gato por primera vez. Plan, por orden de impacto:

1. **Medir primero.** Tareas largas (`PerformanceObserver` de `longtask`) en el arranque, al abrir la Catdex y al entrar a batalla, en un Android de gama baja real.
2. **Caché de rasterizado en tiempo de ejecución.** La primera vez que un gato se rasteriza, guardar el resultado (por ejemplo como `ImageBitmap`/blob en IndexedDB o Cache Storage), con clave por build. La segunda visita no rasteriza nada. Ojo: esto es caché del navegador del jugador; en el repo siguen entrando **solo SVG**.
3. **Atlas armados en tiempo de ejecución.** Para pantallas con muchos gatos chiquitos (Catdex, tienda), empacar las versiones lite en una o pocas texturas grandes: menos cambios de textura por cuadro, menos memoria de video.
4. **Rasterizar fuera del hilo principal.** Los navegadores no decodifican SVG dentro de un Worker (verificar por navegador), así que la vía es un rasterizador WebAssembly (por ejemplo `resvg`) en un Worker con `OffscreenCanvas`. Cuesta unos cientos de KB a pocos MB de WASM; vale la pena solo si el punto 2 no alcanza.
5. **Calidad adaptable.** Ya limitamos la resolución a 2× (`Math.min(devicePixelRatio, 2)` en `core/App.ts`). Siguiente paso: bajar a 1.5× y apagar filtros caros (glitch, RGB split) en equipos que no sostienen 60 cuadros por segundo, y respetar siempre "movimiento reducido".
6. **Nivel de detalle en las mallas.** Cada gato vivo usa una malla de unas 26×26 celdas; los gatos que se ven chiquitos (isla lejana, cuadrículas) podrían usar una malla más simple.
7. **WebGPU** cuando PixiJS lo marque estable: probarlo detrás de un ajuste y medir.
8. **En apps empaquetadas:** vibración háptica en golpes y explosiones, ocultar barras del sistema, respetar áreas seguras, pantalla de arranque nativa mientras carga la primera escena. Son detalles chicos que hacen que "se sienta app".

---

## 7. Qué podemos y qué no podemos cambiar

| Cambio | ¿Se puede? | Costo |
|---|---|---|
| Envolver el juego para tiendas (TWA, Capacitor, Tauri, Electron) | Sí | Bajo a medio |
| Pasar de WebGL a WebGPU | Sí, cuando Pixi lo marque estable | Muy bajo (una línea + pruebas) |
| Cambiar dónde se guarda la partida (archivo, nube) | Sí, todo pasa por `core/save.ts` | Bajo a medio |
| Calidad adaptable, caché de rasterizado, atlas | Sí | Medio |
| Actualizar Pixi o GSAP de versión mayor | Sí, con pruebas | Medio |
| Reemplazar GSAP | Posible, pero no hace falta (GSAP es gratis incluso para uso comercial desde 2025, verificar) | Medio a alto |
| Cambiar de motor | Posible, pero se reescribe el ~75 % del código | Muy alto (sección 3) |
| Volver a imágenes PNG/JPG | **No.** Es la identidad del proyecto y su ventaja: carga rápida, animación, costo cero | — |
| Cobrar, anuncios, energía | **No.** Ver `CONTRIBUTING.md` | — |
| Actualizar en caliente una app de iOS con código descargado | Con mucho cuidado: Apple limita el código descargado que cambia la app (regla 2.5.2 y 4.7). Para iOS, actualizaciones por la tienda | — |

---

## 8. Ruta recomendada

Estimaciones para una persona a tiempo parcial. Cada fase se puede hacer sola.

| Fase | Qué | Esfuerzo | Costo fijo |
|---|---|---|---|
| 0 | Medir rendimiento en un teléfono de gama baja; caché de rasterizado; calidad adaptable | 1 a 2 semanas | USD 0 |
| 1 | **Android:** TWA con PWABuilder (necesita dominio propio o el repo `ragosorio.github.io` para `assetlinks.json`); prueba cerrada de 12 testers por 14 días | 1 semana + 14 días de prueba | USD 25 una vez (+ dominio, opcional) |
| 2 | **Computadoras:** Tauri para Windows y Mac; publicar en itch.io y Microsoft Store | 1 a 2 semanas | USD 0 |
| 3 | **iOS:** Capacitor, juego empaquetado, áreas seguras, hápticos, guardado robusto; revisión de Apple | 3 a 4 semanas | USD 99 al año |
| 4 | **Steam:** build de escritorio (Electron o Tauri), Steam Cloud por archivo, página de tienda | 2 a 3 semanas | USD 100 por app |
| 5 | Sincronización con código de transferencia | 2 a 3 semanas | Capa gratuita de un servicio serverless |

Orden sugerido: 0 → 1 → 2 (baratos y con mucho alcance), luego 3 y 4 según lo que pida la comunidad.

---

## Fuentes (revisadas el 2026-10-06)

- Apple: [inscripción](https://developer.apple.com/programs/enroll/), [exención de cuota](https://developer.apple.com/help/account/membership/fee-waivers), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [cambios de nov-2025](https://developer.apple.com/news/?id=ey6d8onl), [requisitos próximos](https://developer.apple.com/news/upcoming-requirements/), [WebGPU en WKWebView](https://developer.apple.com/forums/thread/770862)
- Google Play: [cuota de registro](https://support.google.com/googleplay/android-developer/answer/6112435), [prueba cerrada de cuentas personales](https://support.google.com/googleplay/android-developer/answer/14151465), [nivel de API objetivo](https://support.google.com/googleplay/android-developer/answer/11926878), [TWA](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start), [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [Capacitor: política de soporte](https://capacitorjs.com/docs/main/reference/support-policy)
- Tauri: [2.0 estable](https://v2.tauri.app/blog/tauri-20/), [inicio](https://v2.tauri.app/start/), [versiones de webview](https://v2.tauri.app/reference/webview-versions/), [gráficos en Linux](https://v2.tauri.app/develop/debug/linux-graphics/)
- [WebKit: Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [Steam Direct](https://partner.steamgames.com/doc/gettingstarted/appfee)
- Microsoft: [cuenta de desarrollador](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account), [PWA en la Store](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)
- Motores: [PixiJS renderers](https://pixijs.com/8.x/guides/components/renderers), [Godot web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), [Defold HTML5](https://defold.com/manuals/html5/), [Unity WebGPU](https://docs.unity3d.com/6000.6/Documentation/Manual/WebGPU.html)
