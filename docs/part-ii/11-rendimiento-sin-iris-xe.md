# 11 · Rendimiento en gama baja sin tener el Iris Xe

**Fecha:** 2026-10-09 · **Objetivo:** juntar la mejor evidencia posible sobre cómo correrá `rupturas.html` en una laptop con Intel Iris Xe (96 EU), nuestra GPU de escritorio de referencia para gama baja, **sin tener ese equipo**, y encontrar qué es lo que más cuesta.

> **Lo que se midió y lo que se estimó.** Todo lo de las secciones 2 a 7 son **mediciones** hechas en un Apple M4 (con GPU real, con la CPU frenada y con render por software). La sección 8 es una **ESTIMACIÓN** para el Iris Xe que se razona a partir de esas mediciones. No es una medición. Antes de dar por buena la cifra para el Iris Xe hay que validarla en el equipo real (ver §10).

---

## 0. Resumen

- **En el M4, con vsync y límite de cuadros apagados,** el juego va muy holgado: BAJO saca unos 465 fps, MEDIO unos 310, ALTO unos 260 y ULTRA unos 175 a 1920×1080. En ninguna escena hubo cuadros largos importantes. Con vsync se queda clavado en 60 fps (p99 de 16,8 ms).
- **Lo que más cuesta en la GPU es la sombra del sol.** En las dos tandas, quitarla bajó el timer de GPU de unos 3,8 ms a 2,2 ms (−42 %). También ahorró 0,7 ms de JS y unos 46 draw calls. En render por software (que se parece más a una GPU integrada sin TBDR), quitarla llevó MEDIO de 5–8 fps a 17,7 fps.
- **El segundo costo es el MSAA 4× de MEDIO.** Al apagarlo en el M4, la GPU de MEDIO bajó de 2,88 a 2,11 ms (−27 %) y el juego pasó de 330 a 420 fps. Y eso que el M4, por ser TBDR, resuelve el MSAA casi gratis. En el Iris Xe, que es de modo inmediato (IMR) y comparte la memoria con la CPU, el costo será mayor.
- **Después vienen el océano** (−0,5 a −0,85 ms, unos 17–22 %, limitado por fragmentos: bajar los segmentos no ayudó en el M4) **y la flora** (−0,3 a −0,9 ms; solo el pasto, unos 8–15 %).
- **Partículas, lluvia, cuerpos de gato, sombras proyectadas de gato y blobs** costaron casi nada (dentro del ruido de ±0,3 ms).
- **Lo que más cuesta en la CPU** (perfil de MEDIO con la CPU frenada 4×): `render` se lleva el 70 % del cuadro. La pasada de sombras es el 35 % de `render`, y `getProgram`/`getParameters` se recalculan **en cada cuadro** dentro de esa pasada. Le siguen `deform` de los títeres (≈10 % del tiempo ocupado) y la IA (`heightAt`, `slopeAt`, `walkable`, `steer`, ≈8 %).
- **ESTIMACIÓN para el Iris Xe a 1920×1080 (escala 125 %):** BAJO va holgado a 60. MEDIO queda al límite: a veces cumple 60 y en las escenas pesadas el p95 puede pasar los 20 ms, así que la auto-calidad lo bajaría. ALTO irá a unos 45–60 fps y la auto-calidad casi seguro bajará de tier. ULTRA no es viable. Con los cambios de §9 (MEDIO sin MSAA, con `dprCap 1` y sombras más baratas), MEDIO debería quedar holgado.

---

## 1. Método

### 1.1 Equipo y build

| Cosa | Valor |
|---|---|
| Máquina | Apple M4 (10 núcleos de CPU, GPU de 10 núcleos), 16 GB |
| Navegador | Google Chrome 154.0.8037.98, `headless: 'new'`, `puppeteer-core@24` |
| GPU real | `--use-angle=metal --enable-gpu`, con renderer `ANGLE Metal Renderer: Apple M4` |
| Sin tope de fps | `--disable-gpu-vsync --disable-frame-rate-limit` (**funcionó**: hubo más de 60 fps, de 170 a 600) |
| Software | `--use-angle=swiftshader --enable-unsafe-swiftshader`, con renderer `SwiftShader Device (LLVM 10.0.0)` sobre Vulkan |
| Viewport | 1536×864 CSS con `deviceScaleFactor 1.25`, que es una laptop típica con Iris Xe: panel 1920×1080 y escala de Windows al 125 %. En SwiftShader se usó 1280×720 a 1×. |
| Lienzo resultante | BAJO 1152×648 (dprCap 1 × escala 0,75), MEDIO/ALTO/ULTRA 1920×1080 |
| Código medido | **Build de producción sin minificar** (`vite build --minify false`) del árbol de trabajo del 2026-10-09 a las 09:40, servido con `vite preview` en un puerto aparte |

**Por qué un build congelado y no el servidor de desarrollo.** Mientras medía, otro agente estaba editando `src/rupturas/main.ts`. En la primera pasada, el HMR de Vite recargó la página a mitad de una medición y dejó escenas con 0 cuadros. Con el build congelado eso no pasa, y además se parece más a lo que recibe el jugador. Consecuencia: **los números corresponden al código de las 09:40.** Los cambios que se hicieron después en `main.ts` (por ejemplo el respaldo a la lente PÁGINA) no están medidos.

### 1.2 Cómo se mide

- Antes de cargar se escribe `localStorage['nolc-rupturas-settings'] = {"auto":false, tier, fx:1}`, y el tier también se fuerza con `?q=`. Así la auto-calidad no puede bajar el tier en medio de la prueba.
- **Intervalo de cuadro:** se mide con un `requestAnimationFrame` propio y de ahí salen fps, p50, p95, p99 y los cuadros de más de 33,4 ms.
- **JS por cuadro:** se envuelve `window.requestAnimationFrame` y se toma `performance.now()` antes y después del callback `frame` del juego. Es el tiempo del hilo principal: lógica, títeres y la parte de `renderer.render` que corre en JS.
- **Timer de GPU:** `EXT_disjoint_timer_query_webgl2` (sí está disponible en ANGLE Metal), abierto alrededor del callback. **Cuidado:** en el M4 este timer funciona como **cota superior**. A veces marca más que el intervalo real porque incluye la cola de comandos y el compositor. Además, con vsync la GPU baja su reloj y el mismo cuadro sale en 9–10 ms en vez de 3,4 ms. **Úsese solo para comparar dentro de una misma tanda.**
- `calls` y `tris` vienen de `renderer.info` (vía `__rupturas.stats()`) e incluyen la pasada de sombras.
- **Escenas** (todas después de 3 s de calentamiento y 2,5 s de asentamiento):
  - *día*: `setHour(12)` con la vista por defecto `view(-2,4,40,0.5,0.35)`.
  - *noche*: `setHour(23)` con `view(27,-22,70,0.25,2.4)` (faro).
  - *tormenta*: `setSky('tormenta')` más 5 s para que el clima entre del todo.
  - *habilidad*: `ability()`, se espera a que el barco llegue (unos 7,3 s, hasta que aparece el toast "ASTRAPRIMA") y se miden 7 s del Colapso Estelar.
- Ventana de medición: 8 s por escena (5 s en los desgloses). Las mediciones van en serie, una sola a la vez, para que no compitan por la GPU.

---

## 2. A · GPU real (M4), sin vsync

### BAJO (lienzo 1152×648, sin MSAA)

| Escena | fps | p50 ms | p95 ms | p99 ms | >33 ms | JS/cuadro ms | GPU timer ms | draw calls | triángulos |
|---|---|---|---|---|---|---|---|---|---|
| día | 465 | 1.9 | 4.0 | 5.5 | 1 | 1.59 | 1.93 | 98 | 160k |
| noche (faro) | 446 | 2.2 | 3.9 | 4.7 | 0 | 1.73 | 2.01 | 139 | 184k |
| tormenta | 465 | 2.0 | 3.9 | 4.9 | 0 | 1.63 | 1.94 | 103 | 171k |
| habilidad | 529 | 2.1 | 3.6 | 4.6 | 1 | 1.57 | 1.60 | 136 | 176k |

### MEDIO (1920×1080, MSAA 4×)

| Escena | fps | p50 ms | p95 ms | p99 ms | >33 ms | JS/cuadro ms | GPU timer ms | draw calls | triángulos |
|---|---|---|---|---|---|---|---|---|---|
| día | 311 | 3.1 | 5.4 | 7.8 | 0 | 2.31 | 2.84 | 108 | 306k |
| noche (faro) | 252 | 3.3 | 8.7 | 16.2 | 0 | 2.59 | 3.23 | 147 | 325k |
| tormenta | 264 | 3.1 | 8.5 | 14.8 | 2 | 2.33 | 3.09 | 110 | 311k |
| habilidad | 229 | 3.4 | 10.8 | 17.5 | **6** | 2.50 | 3.01 | 145 | 316k |

### ALTO (1920×1080, MSAA 4×)

| Escena | fps | p50 ms | p95 ms | p99 ms | >33 ms | JS/cuadro ms | GPU timer ms | draw calls | triángulos |
|---|---|---|---|---|---|---|---|---|---|
| día | 258 | 3.6 | 6.9 | 9.2 | 0 | 2.69 | 3.44 | 108 | 440k |
| noche (faro) | 243 | 3.8 | 7.6 | 10.0 | 0 | 3.21 | 4.32 | 147 | 459k |
| tormenta | 270 | 3.6 | 6.0 | 8.6 | 0 | 2.80 | 3.56 | 107 | 440k |
| habilidad | 233 | 3.9 | 7.6 | 9.6 | 1 | 2.99 | 3.53 | 144 | 451k |

### ULTRA (1920×1080: el dprCap de 2,5 no aplica con DPR 1,25)

| Escena | fps | p50 ms | p95 ms | p99 ms | >33 ms | JS/cuadro ms | GPU timer ms | draw calls | triángulos |
|---|---|---|---|---|---|---|---|---|---|
| día | 173 | 5.2 | 11.6 | 15.6 | 3 | 4.47 | 7.26 | 108 | 662k |
| noche (faro) | 199 | 4.7 | 9.1 | 12.1 | 0 | 4.53 | 6.69 | 147 | 681k |
| tormenta | 198 | 4.9 | 7.6 | 10.9 | 0 | 4.48 | 6.92 | 110 | 667k |
| habilidad | 212 | 4.3 | 8.9 | 11.5 | 1 | 3.73 | 5.47 | 145 | 672k |

**Referencia con vsync (ALTO):** día y noche dan 60 fps con p50 de 16,7 y p99 de 16,8 ms. El JS por cuadro es de 0,8–1,1 ms y el timer de GPU marca 9–10 ms porque la GPU bajó su reloj.

**Qué se ve aquí:**
- **La noche en el faro es la escena más pesada:** hay unos 40 draw calls más (luces locales, haz del faro, Luzterna y REGISTRO 000).
- **La habilidad mete picos.** En MEDIO hubo 6 cuadros de más de 33 ms y p99 de 17,5 ms. Coinciden con el arranque del colapso, cuando se crean los escombros y se compilan materiales la primera vez. En Windows, ANGLE traduce y compila a HLSL para D3D11, que es más lento, así que el tirón será mayor.
- **En ALTO, a 1080p, el M4 no está limitado por relleno.** El barrido de DPR (§5.3) casi no cambia el resultado.

---

## 3. B · CPU frenada vía CDP (GPU real)

Se usó `Emulation.setCPUThrottlingRate` 4× y 6×, aplicado después de cargar.

**Calibración (importante).** En este Mac el freno de CDP rinde menos de lo que dice. Un bucle de JS de 10⁷ `Math.sqrt` dentro de la página del juego tardó 16,1 ms sin freno, 28,2 ms con 2×, 39,2 ms con 4× y 50,4 ms con 6×. O sea, 4× equivale de verdad a **≈2,4×** y 6× a **≈3,1×**. Por suerte eso es justo el rango que interesa. Un i5-1135G7 o un i7-1165G7 tiene más o menos la mitad del rendimiento de un solo hilo de un núcleo P del M4 cuando está enchufado, y un tercio con batería o con calor (**ESTIMACIÓN** de orden de magnitud, sin verificar en esta sesión).

| Tier / freno | Escena | fps | p50 | p95 | p99 | >33 ms | JS ms |
|---|---|---|---|---|---|---|---|
| BAJO 4× | día / noche / tormenta / habilidad | 435 / 418 / 592 / 406 | 2.0 / 2.1 / 1.5 / 2.3 | 4.5 / 4.3 / 3.3 / 4.4 | 6.0 / 6.2 / 4.8 / 5.5 | 2 / 0 / 0 / 0 | 1.5 / 1.6 / 1.2 / 1.7 |
| BAJO 6× | día / noche / tormenta / habilidad | 328 / 270 / 306 / 220 | 2.8 / 3.3 / 3.0 / 4.2 | 5.7 / 6.9 / 5.9 / 7.5 | 7.2 / 10.2 / 7.6 / 9.1 | 0 / 2 / 4 / 1 | 2.0 / 2.6 / 2.2 / 3.1 |
| MEDIO 4× | día / noche / tormenta / habilidad | 373 / 303 / 299 / 236 | 2.4 / 2.9 / 2.9 / 3.9 | 5.3 / 6.3 / 6.6 / 7.4 | 7.1 / 8.1 / 8.8 / 9.6 | 0 / 0 / 0 / 2 | 1.8 / 2.3 / 2.2 / 2.7 |
| MEDIO 6× | día / noche / tormenta / habilidad | 180 / 166 / 226 / 181 | 5.1 / 5.7 / 4.1 / 5.2 | 9.5 / 10.0 / 7.6 / 8.6 | 11.9 / 11.9 / 9.3 / 10.1 | 0 / 0 / 0 / 0 | 3.6 / 4.1 / 2.8 / 3.8 |

**Lectura:**
- Con 6× (≈3× real), MEDIO sigue con un p95 de unos 10 ms o menos. **La CPU no debería ser el cuello de botella en una laptop Iris Xe.** El riesgo está en la GPU.
- Con 4× la diferencia contra el caso sin freno queda dentro de la variación entre tandas: BAJO 4× incluso salió mejor que BAJO sin freno, por el boost y la temperatura del M4. **Es evidencia débil.** Lo más útil de esta sección es la fila de 6×.

---

## 4. C · Render por software (SwiftShader), peor caso

| Tier (lienzo) | Escena | fps | p50 ms | p95 ms | p99 ms | >33 ms | draw calls | tris |
|---|---|---|---|---|---|---|---|---|
| BAJO (960×540) | día | 19 | 51 | 106 | 124 | 119 | 99 | 165k |
| | noche | 18 | 46 | 118 | 177 | 98 | 139 | 184k |
| | tormenta | 17 | 56 | 122 | 131 | 118 | 98 | 160k |
| | habilidad | 20 | 30 | 105 | 628 | 71 | 137 | 174k |
| MEDIO (1280×720) | día | 6 | 148 | 287 | 725 | 43 | 107 | 306k |
| | noche | 5 | 151 | 403 | 732 | 36 | 148 | 325k |
| | tormenta | 13* | — | 299 | 331 | 33 | 109 | 306k |
| | habilidad | 9* | — | 422 | 721 | 21 | 132 | 311k |

\* Con SwiftShader los intervalos salen bimodales (entregas de cuadros en ráfagas). El p50 no sirve y el fps medio tiene mucho ruido: ±40 % entre repeticiones.

**Lectura:**
- Si a un jugador Chrome lo manda a SwiftShader (driver en lista negra, aceleración por hardware apagada, VM), **ni siquiera BAJO se puede jugar**, con 17–20 fps a 960×540.
- **Recomendación:** al arrancar, detectar `SwiftShader` o `llvmpipe` en `WEBGL_debug_renderer_info` y saltar directo al respaldo de la lente PÁGINA, sin esperar a que la auto-calidad lo descubra.

---

## 5. D · Desglose de costos (ALTO, M4, sin vsync)

Se fue ocultando un grupo a la vez en la escena (`visible = false`) o se apagó `sun.castShadow`. Los Δ son contra la medición base de la misma tanda. Hubo dos tandas independientes a 1080p (D y X) y una a 2688×1512.

### 5.1 Qué se quita y cuánto ahorra

| Se quita | Δ timer GPU (1080p, tanda D / X) | Δ JS/cuadro | Δ calls | Δ tris | Δ GPU a 2688×1512 | Veredicto |
|---|---|---|---|---|---|---|
| **Sombra del sol** (`castShadow=false`) | **−1.63 / −1.55 ms (−42 %)** | −0.5 / −0.7 ms | −46 | −89k | **−2.70 ms** | **Costo #1**, crece con los píxeles |
| Solo los proyectores (el mapa queda vacío pero se sigue muestreando) | — / ≈0 | ≈0 | −49 | −94k | — | El costo está en **recibir** la sombra (PCF en cada fragmento), no en dibujar el mapa |
| Mapa de sombra 1024 / 512 (en vez de 2048) | — / −0.3 / +0.2 | ≈0 | 0 | 0 | — | El tamaño del mapa casi no importa en el M4 |
| **Océano** (oculto) | **−0.85 / −0.40 ms** | ≈0 / −0.5 | −1 | −97k | −1.04 ms | Costo #2, limitado por fragmentos |
| Océano con 120 o 80 segmentos (en vez de 220) | — / +0.6 / +0.4 (ruido) | ≈0 | 0 | −68k / −76k | — | Los vértices no son el problema en el M4 |
| **Flora completa** | **−0.94 / −0.18 ms** | −0.15 | −8 | −103k | −0.81 ms | Costo #3 (ruidoso) |
| Solo el pasto (oculto / a la mitad) | −0.56 / −0.19 / +0.4 | ≈0 | −2 | −78k | −0.60 ms | 8–15 % |
| Terreno (oculto / sin proyectar) | −0.16 / +0.4 | ≈0 | −2 | −160k / −86k | +0.31 | Despreciable |
| Partículas (7 `Points`) | +0.29 (ruido) | ≈0 | −1 | ≈0 | +0.17 | Despreciable |
| Cuerpos de gato (10) | −0.05 | ≈0 | +5? | −31k | −0.02 | Despreciable en GPU |
| Sombras proyectadas de gato (10) | −0.09 | ≈0 | +5? | ≈0 | +0.12 | Despreciable |
| Blobs de contacto (10) | +0.21 | ≈0 | −6 | ≈0 | +0.14 | Despreciable |
| Lluvia (`LineSegments`, tormenta) | 0.00 | ≈0 | 0 | 0 | +0.21 | Despreciable |
| Escena vacía (solo limpiar y presentar) | queda en 0.79 ms | 0.11 ms | 1 | 1k | 1.69 ms | Costo fijo |

Bases de la tabla: GPU 3,85 ms (D), 3,68–3,84 ms (X) y 8,04 ms a 2688×1512. Los Δ por debajo de ±0,3 ms son ruido. Los "+5?" en calls son artefactos del contador, que varía de un cuadro a otro.

### 5.2 ¿Limitado por relleno o por vértices?

- **Vértices: no es el problema en el M4.** Pasar de 220 a 80 segmentos de océano (−76k triángulos) y quitar el terreno (−160k) no movió el timer.
- **Relleno: depende de la GPU.**
  - En el M4 (TBDR), el barrido de `deviceScaleFactor` de 1 a 1,75 (lienzo de 1536×864 a 2688×1512, 3× píxeles) dejó la GPU entre 3,8 y 4,5 ms, casi plana.
  - Pero los costos que **sí** crecen con los píxeles son justo los que dominan: recibir sombra (−1,6 ms a 1080p y −2,7 ms a 2688×1512), el fragmento del océano y el MSAA.
  - Apagar el MSAA en MEDIO ahorró 27 % de GPU **incluso en un TBDR**.
  - En SwiftShader, que es un rasterizador inmediato, apagar sombras multiplicó el fps de MEDIO por 2,3–3,3 y apagar MSAA lo subió entre 15 y 60 %.
- **Conclusión:** en el Iris Xe (IMR, memoria compartida de 51–68 GB/s, sin resolver el MSAA dentro del chip) el juego va a estar **limitado por relleno y ancho de banda**: PCF de sombras, MSAA 4×, océano transparente a pantalla completa y pasto con `DoubleSide`. **Lo que más rinde es bajar píxeles, MSAA y sombras, no polígonos.**

### 5.3 Barrido de DPR (ALTO, M4)

| deviceScaleFactor | lienzo | fps | p95 ms | JS ms | GPU timer ms |
|---|---|---|---|---|---|
| 1.0 | 1536×864 | 303 | 4.9 | 3.05 | 4.19 |
| 1.25 | 1920×1080 | 304 | 5.0 | 2.97 | 4.13 |
| 1.5 | 2304×1296 | 253 | 7.4 | 2.73 | 3.78 |
| 1.75 | 2688×1512 | 277 | 5.5 | 3.22 | 4.51 |

### 5.4 Experimentos "¿y si…?" en SwiftShader (proxy de rasterizador inmediato)

Fps medio en 8 s. La base se midió dos veces (al principio y al final) porque el ruido es alto.

| MEDIO 1280×720 | fps | | BAJO 960×540 | fps |
|---|---|---|---|---|
| base (2 mediciones) | 5.4 / 7.6 | | base (2 mediciones) | 19.6 / 18.6 |
| **sin MSAA** (contexto con `antialias:false`) | **8.9** | | sombra 512 | 19.9 |
| sombra 1024 | 8.6 | | **sin sombra del sol** | **24.0** (+25 %) |
| **sin sombra del sol** | **17.7** (×2.3–3.3) | | sin proyectores | 19.3 |
| terreno sin proyectar | 6.7 | | sin pasto | 19.1 |
| pasto a la mitad / sin pasto | 7.9 / 6.2 | | océano 80 segmentos | 19.6 |
| sin flora | 6.2 | | sin océano | 21.3 (+12 %) |
| océano 120 / 80 / oculto | 7.3 / 5.9 / 5.6 | | | |

En el M4, MEDIO sin MSAA dio: día 420 fps (antes 330), GPU 2,11 ms (antes 2,88), p95 4,1 ms (antes 4,7). Noche: 395 fps (antes 273), GPU 2,38 ms (antes 3,87).

---

## 6. E · Perfil de CPU (MEDIO, freno 4×, 5 s, vista de día)

Se tomaron 5,26 s de muestras. `(program)`, que es nativo o sin atribuir, se lleva 1,79 s (34 %). El callback `frame` incluido todo lo que llama ocupa 3,34 s, y `WebGLRenderer.render` 2,35 s (**70 % del cuadro**).

**Las 10 funciones con más tiempo propio** (sin contar `(program)`):

| # | Función (archivo del build) | ms propios | % del total |
|---|---|---|---|
| 1 | `deform` (puppetCore, deformación de malla de los títeres) | 336 | 6.4 |
| 2 | `WebGLRenderer.renderBufferDirect` (three) | 284 | 5.4 |
| 3 | `renderObject` (pasada de sombras de three) | 158 | 3.0 |
| 4 | `getParameters` (three, cálculo de la clave del programa) | 119 | 2.3 |
| 5 | `projectObject` (three, recorrido y culling) | 118 | 2.3 |
| 6 | `updateMatrixWorld` (three) | 103 | 2.0 |
| 7 | `frame` (main.ts, cuerpo del loop) | 99 | 1.9 |
| 8 | `heightAt` (island.ts, fbm de 4 octavas por llamada) | 98 | 1.9 |
| 9 | `bindVertexArray` (nativo de WebGL) | 89 | 1.7 |
| 10 | `setProgram` (three) | 85 | 1.6 |

**Tiempos incluidos que importan:**
- `WebGLShadowMap.render` se lleva **823 ms**, que son 35 % de `render`.
- `setProgram` suma 952 ms, de los cuales `getProgram` son 244 ms, **llamado en cada cuadro desde la pasada de sombras**. La causa probable: el material de profundidad compartido de three alterna entre objetos instanciados y normales, y cada cambio fuerza a resolver el programa otra vez.
- Subida de uniforms (`setValue` + `upload`): unos 625 ms.
- `tick` de los títeres: 393 ms, de los que `deform` son 337.
- IA: `steer` 174, `heightAt` 131, `walkable` 85 y `slopeAt` 72 ms. `slopeAt` llama 4 veces a `heightAt` y `walkable` 5 veces.

---

## 7. Costos que **no** valen la pena (por ahora)

Partículas (las 7 pools), lluvia de 9000 líneas, el shader de los gatos de papel, sus sombras proyectadas y los blobs, el terreno y la cantidad de segmentos del océano: en el M4 ninguno movió la GPU más allá del ruido. Optimizarlos ahora es esfuerzo con poco retorno.

Una excepción menor: `ParticlePool.emit` sube **completos** los 4 atributos del pool en cada emisión, sin `addUpdateRange`. No apareció en el top 25 del perfil, pero en una CPU lenta conviene arreglarlo de paso.

---

## 8. ESTIMACIÓN para el Iris Xe (96 EU) · no es una medición

**Razonamiento:**

1. **Cómputo bruto.**
   - M4 de 10 núcleos: ≈10 × 128 ALU × 2 × ~1,6 GHz ≈ **4,2 TFLOPS**.
   - Iris Xe 96 EU: 96 × 8 × 2 × ~1,3 GHz ≈ **2,0 TFLOPS**.
   - Diferencia: **≈2×**.
2. **Ancho de banda.** El M4 tiene ≈120 GB/s. El Iris Xe tiene 51–68 GB/s **compartidos con la CPU**, y en laptops baratas con un solo canal de RAM la mitad, porque en ese caso Intel la rebaja a "UHD". Diferencia: **≈2–4×**.
3. **Arquitectura.**
   - El M4 es TBDR: elimina el sobredibujado opaco y resuelve el MSAA dentro del chip.
   - El Iris Xe es IMR: el MSAA 4×, el océano transparente a pantalla completa y el pasto con `DoubleSide` le cuestan ancho de banda real.
   - §5.2 mostró que nuestros costos dominantes son justamente de relleno.
4. **Temperatura y TDP.** A 15–28 W compartidos con la CPU, el reloj sostenido baja.
5. **Factor que se usa para la estimación:** el tiempo de GPU por cuadro en el Iris Xe ≈ **3–5×** el del M4 (3× en BAJO, que no tiene MSAA; hasta 5× en tiers con MSAA). El timer del M4 es cota superior, así que esto tiende a ser pesimista. Lo compensa el sobrecosto de ANGLE→D3D11 en Windows.

**ESTIMACIÓN a 1920×1080 con escala 125 %:**

| Tier | GPU M4 medida (media → p95) | ESTIMACIÓN GPU Iris Xe | ESTIMACIÓN fps | ¿La auto-calidad (p95 > 20 ms) lo baja? |
|---|---|---|---|---|
| BAJO | 1.6–2.0 → 3.1 ms | 5–8 ms (p95 ≈ 10–12) | **60 holgado** | No |
| MEDIO | 2.8–3.2 → 4.3–4.8 ms | 9–16 ms (p95 ≈ 13–24) | **50–60**, con caídas de noche, en tormenta y con la habilidad | Probable en escenas pesadas |
| ALTO | 3.4–4.3 → 4.7–5.4 ms | 10–22 ms (p95 ≈ 14–27) | **45–60** | Sí, casi seguro |
| ULTRA | 5.5–7.3 → 6.5–9.6 ms | 16–36 ms | **28–60** | Sí |

**CPU (ESTIMACIÓN):** en el M4 el JS por cuadro es de 2,3–3,2 ms en MEDIO y ALTO. Multiplicado por 2–3 da **5–10 ms** en un i5/i7 de 11.ª generación. Eso cabe en 16,7 ms, y además CPU y GPU trabajan en paralelo. La fila de 6× en §3 (≈3× real, p95 ≤ 10 ms) lo respalda. **El cuello va a ser la GPU.**

**Otro riesgo: tirones al compilar shaders.** La habilidad de MEDIO dio 6 cuadros de más de 33 ms en el M4. Con ANGLE D3D11 (HLSL → DXBC), compilar la primera vez puede llevar decenas o cientos de ms por programa.

---

## 9. Recomendaciones (de mayor a menor ganancia por costo)

| # | Cambio | Evidencia | Ganancia esperada en Iris Xe (ESTIMACIÓN) | Costo |
|---|---|---|---|---|
| 1 | **Abaratar la sombra del sol.** (a) Respetar el campo `shadows` de `QUALITY`, que hoy **nadie lee** porque `renderer.shadowMap.enabled` siempre es `true`, y ponerlo en `false` en BAJO (los gatos ya tienen blob). (b) En MEDIO, mapa de 1024 y frustum de ±35 en vez de ±60 para conservar la nitidez. (c) `renderer.shadowMap.autoUpdate = false` y `needsUpdate = true` cada 2–3 cuadros, o solo cuando el objetivo del sol se mueva más de 0,5 u o la dirección cambie más de 0,5°, porque el sol avanza 24 h cada 300 s. | −42 % de GPU y −0,7 ms de JS en el M4. BAJO +25 % y MEDIO ×2,3–3,3 en SwiftShader. La pasada de sombras es 35 % del `render` en CPU. | **−25 a −40 %** del cuadro en MEDIO y ALTO | Bajo (pocas líneas en `main.ts`) |
| 2 | **Apagar el MSAA en MEDIO** (y bajar `dprCap` a 1,0, ver la tabla de abajo). El estilo toon y las cartas de papel con `alphaToCoverage` lo aguantan. Si se extraña, poner un FXAA o SMAA barato solo en ALTO. | M4: −27 % de GPU en MEDIO, 330 → 420 fps. SwiftShader: +15–60 %. | **−20 a −35 %** de GPU en MEDIO (en IMR pesa más) | Trivial (tabla) |
| 3 | **Menos píxeles en MEDIO:** `dprCap 1.25 → 1.0`. En una laptop al 125 %, el lienzo baja de 1920×1080 a 1536×864, que son 36 % menos píxeles. | Lo que domina es relleno: PCF, MSAA y el fragmento del océano. | **−15 a −30 %** de GPU | Trivial (tabla) |
| 4 | **Arreglar el `getProgram` por cuadro en la pasada de sombras:** darle a los `InstancedMesh` que proyectan (troncos, frondas, rocas y los instanciados de `props.ts`) un `customDepthMaterial` propio, o quitar `castShadow` a las rocas y props chicos. Hoy hay 58 proyectores. | `getProgram` + `getParameters` ≈ 7 % del tiempo ocupado del hilo principal. | −0,3 a −0,7 ms de CPU | Bajo |
| 5 | **Océano más barato por fragmento:** cortar destellos y espuma de cresta pasado `far` (hoy calcula 3 `vn()` por fragmento en todo el mar) y considerar `waterSeg` más bajo en BAJO, porque el Iris Xe es relativamente más flojo en vértices que el M4. | −0,4 a −0,85 ms en el M4 (17–22 %). +12 % en SwiftShader BAJO. | −10 a −15 % | Medio (shader) |
| 6 | **Pasto en celdas:** partir el `InstancedMesh` del pasto en unos 8×8 bloques para que el culling por frustum funcione (hoy una sola esfera cubre toda la isla y nunca se descarta) y desvanecerlo por distancia. Bajar `grass` en MEDIO de 0,65 a 0,5. | Pasto ≈ 8–15 % de GPU. Flora ≈ 13–24 %. | −5 a −10 % | Medio |
| 7 | **Títeres:** saltar `deform` en gatos fuera del frustum y usar ~10 fps de deformación a más de 40 m. Hoy están a 20 fps para todos. | `deform` es el #1 en tiempo propio (≈10 % del tiempo ocupado). | −0,2 a −0,5 ms de CPU | Bajo |
| 8 | **IA:** que `heightAt`, `slopeAt` y `walkable` lean una grilla precalculada (por ejemplo la misma de `terrain.heightTex`, con interpolación bilineal) en vez de un fbm de 4 octavas por llamada. | Juntos ≈ 8 % del tiempo ocupado. | −0,2 a −0,4 ms de CPU | Bajo |
| 9 | **Precompilar los materiales del colapso** al arrancar (`renderer.compileAsync(scene, camera)` con el grupo del colapso visible un cuadro fuera de pantalla). | 6 cuadros de más de 33 ms al lanzar la habilidad en MEDIO (M4). | Quita el tirón de la habilidad | Bajo |
| 10 | **Detectar SwiftShader o llvmpipe** al arrancar y ir directo a BAJO más el respaldo PÁGINA. Si el renderer es "Intel" sin "Arc", arrancar en MEDIO en vez de ALTO (el default actual). | BAJO en SwiftShader da 17–20 fps. | Primer minuto sin tirones ni bajadas visibles de calidad | Trivial |

**No priorizar:** partículas, lluvia, shader de gatos, sombras proyectadas de gato, segmentos de terreno.

### Tabla `QUALITY` propuesta para `game/src/engine/core/perf.ts` (no se editó)

```ts
export const QUALITY: Record<Tier, QualityCfg> = {
  //            dprCap  scale  shadowMap  shadows  waterSeg terrainSeg particles catShadows grass  msaa
  bajo:  { dprCap: 1,    scale: 0.75, shadowMap: 1024, shadows: false, waterSeg: 80,  terrainSeg: 120, particles: 0.35, catShadows: false, grass: 0.25, msaa: false },
  medio: { dprCap: 1,    scale: 1,    shadowMap: 1024, shadows: true,  waterSeg: 120, terrainSeg: 160, particles: 0.65, catShadows: true,  grass: 0.5,  msaa: false },
  alto:  { dprCap: 1.5,  scale: 1,    shadowMap: 2048, shadows: true,  waterSeg: 180, terrainSeg: 200, particles: 1,    catShadows: true,  grass: 1,    msaa: true  },
  ultra: { dprCap: 2.5,  scale: 1,    shadowMap: 4096, shadows: true,  waterSeg: 300, terrainSeg: 256, particles: 1.3,  catShadows: true,  grass: 1.4,  msaa: true  },
};
```

Cambios contra la tabla actual:

- **BAJO:** `shadows` pasa a `false`, `waterSeg` de 110 a 80 y `grass` de 0,35 a 0,25. **Ojo: `shadows` solo tiene efecto si `main.ts` lo lee.** Por ejemplo, `renderer.shadowMap.enabled = Q().shadows` y `sun.castShadow = Q().shadows`. Al cambiarlo en caliente hay que marcar `material.needsUpdate` porque cambia la variante del shader.
- **MEDIO:** `dprCap` de 1,25 a 1, `shadowMap` de 2048 a 1024, `waterSeg` de 160 a 120, `grass` de 0,65 a 0,5 y `msaa` a `false`.
- **ALTO:** `dprCap` de 1,75 a 1,5 (en pantallas de 2× ahorra 27 % de píxeles) y `waterSeg` de 220 a 180.
- **ULTRA:** sin cambios.
- `terrainSeg` y `particles` se quedan como están porque lo medido dice que no cuestan.

**ESTIMACIÓN con la tabla propuesta y las recomendaciones 1 y 2:** MEDIO en el Iris Xe daría ≈5–9 ms de GPU (p95 ≈ 8–14 ms), o sea **60 fps holgados**. Una cuenta aproximada: en el M4, MEDIO sin MSAA ya da 2,1 ms; con 36 % menos píxeles y sombras más baratas quedaría en ≈1,5–1,8 ms; por 3–5 da eso.

---

## 10. Advertencias

1. **El M4 no es un Iris Xe.** El factor de 3–5× está razonado con especificaciones y arquitectura, **no medido**. Es mejor tomarlo como rango que como número.
2. **Timer de GPU:** en ANGLE Metal incluye la cola y el compositor. Sirve para comparar dentro de una tanda, no como milisegundos absolutos. Con vsync el M4 baja su reloj y el mismo cuadro marca el triple.
3. **El freno de CPU de CDP** rinde menos de lo que promete: 4× ≈ 2,4× y 6× ≈ 3,1× reales en este Mac. Además, el M4 tiene variación de boost y temperatura entre tandas de ±10–15 %.
4. **SwiftShader** sirve como peor caso y para ordenar costos en un rasterizador inmediato, pero sus magnitudes no se trasladan a una GPU real. Su ruido es de ±40 %, así que solo los efectos grandes (sombras, MSAA) son confiables.
5. **El modo headless no tiene el compositor de una ventana real** con el DWM de Windows. En Windows ANGLE usa D3D11, con su propio costo por draw call y por compilación de shaders.
6. **Código congelado** a las 09:40 del 2026-10-09. Lo que se cambió después en `main.ts` no está medido.
7. **Un tercio de los Δ del desglose son menores a ±0,3 ms, que es ruido.** Solo son sólidos: sombra del sol, MSAA, océano oculto y, en menor grado, flora y pasto.

**Cómo validarlo de verdad** (cuando alguien tenga un Iris Xe): abrir `rupturas.html?q=medio` con la auto-calidad apagada y F3 para el HUD (fps, p50/p95/p99, cuadros largos). Recorrer las 4 escenas de §1.2 y anotar el p95. Lo mismo con `?q=alto`. Si el p95 de MEDIO de noche en el faro sale menor a 16 ms, la estimación de §8 fue pesimista.

## 11. Reproducir

El arnés vive **fuera del repo**, en el scratchpad de la sesión (es temporal): `run.mjs`, que es una adaptación de `game/scripts/headless-shot.mjs` con métricas por cuadro, timer de GPU, desglose, "¿y si…?", barrido de DPR, perfil de CPU y `noMsaa` (parcha `getContext`). Los JSON crudos de cada tanda y el `.cpuprofile` de MEDIO 4× también quedaron ahí. Si se quiere conservar, se puede mover a `game/scripts/perf-probe.mjs`. Necesita `puppeteer-core@24` como dependencia de desarrollo sin guardarla.

```bash
cd game && npx vite build --outDir /tmp/nolc-perf/dist --minify false
npx vite preview --outDir /tmp/nolc-perf/dist --port 5192 --strictPort --host 127.0.0.1
node perf-probe.mjs '{"tier":"medio","scenes":["day","night","storm","ability"]}'
node perf-probe.mjs '{"tier":"alto","breakdown":true,"dprSweep":true,"measureMs":5000}'
node perf-probe.mjs '{"gpu":"swiftshader","tier":"bajo","w":1280,"h":720,"dsf":1,"scenes":["day"]}'
node perf-probe.mjs '{"tier":"medio","throttle":4,"scenes":[],"profile":5000}'
```
