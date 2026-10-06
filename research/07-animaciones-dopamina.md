# 07 — Animaciones, game feel y dopamina (catálogo implementable)

**Proyecto:** NO ONE LIKE CATS · juego web 2D (TypeScript + PixiJS v8 + física 2D)
**Estética:** "multiverso de estilos" tipo *Into/Across the Spider-Verse* × anime/manga
**Relacionado:** `research/10-direccion-de-arte.md` (dimensiones de estilo, paletas, tipografías) y `research/01-gatos-inventario.md` (estado del arte de los gatos).
**Fecha:** 2026-10-03

---

## 0. TL;DR (lo que hay que llevarse)

1. **Juice = amplificar lo que ya funciona.** Primero un juego que responda en menos de 100 ms. Después le pones encima hitstop, shake, partículas, sonido y números que explotan. El juice nunca debe cargar con la mecánica (Swink; Jonasson y Purho).
2. **Cada evento tiene una "receta"** (datos, no código suelto): hitstop + trauma de cámara + flash + partículas + onomatopeya + SFX + filtro. Un único `JuiceDirector` las ejecuta y aplica en un solo lugar las opciones de accesibilidad.
3. **Tres relojes:** `game` (lo congela el hitstop y lo frena el slow-mo), `fx` (cámara, UI y partículas siempre a 60 fps) y `step` (personajes "en 2s" a 12 fps y en 3s a 8 fps). Esa separación es justo la firma visual de Spider-Verse y Cuphead: el personaje va con saltos y la cámara va fluida.
4. **Cinco tiers de recompensa** (micro → épico), con presupuesto por sesión, agregación, versión corta cuando se repite y salto siempre disponible. La intensidad es proporcional al valor real: nada de fuegos artificiales por +200 de oro (la CHARLA ya lo pide).
5. **Rareza = calidad de impresión.** Común es periódico a 1 tinta, Raro es risografía azul, Épico es CMYK rosa neón, Legendario es foil dorado, Mítico es "la imprenta se rompe" (glitch holográfico) y Primordial es negro con ruido de otra dimensión. Une rareza y estética.
6. **Cada elemento es un "universo" visual** con su propia cadencia: fuego en anime pintado, agua en ukiyo-e, espíritu en manga B/N, cósmico en glitch neón, tierra en grabado de periódico, etc.
7. **Sonido de dopamina:** capas (transiente + cuerpo + cola + sub), pitch que sube por la escala pentatónica en rachas y combos, **silencio de 100–250 ms antes de los golpes grandes**, ducking y stingers cuantizados al compás. Todo se puede generar sin assets comerciales con Web Audio, ZzFX, jsfxr, Tone.js y librerías CC0.
8. **Stack:** PixiJS v8 (forzar WebGL) + `pixi-filters` v6 + GSAP 3.13+ (gratis, incluidos los plugins) + `@esotericsoftware/spine-pixi-v8` (claves *stepped*) + partículas propias sobre `ParticleContainer` (o `@spd789562/particle-emitter`) + Howler.js + ZzFX (+ Tone.js para música adaptativa).
9. **Accesibilidad desde el día 1:** sliders de shake, flashes, aberración/glitch y velocidad de animación; modo fotosensible (≤ 3 destellos/s, sin rojo saturado a pantalla completa, impact frames sustituidos); respetar `prefers-reduced-motion`.

---

## 1. Glosario rápido

| Término | Qué es | Valor típico en este juego |
|---|---|---|
| **Hitstop / hitlag / freeze** | Congelar unos frames el juego al conectar un golpe | 40–250 ms según el peso |
| **Trauma** | Valor 0..1 que acumula el "estrés" de cámara; el shake es trauma² o trauma³ | decae ~1.6/s |
| **Camera kick** | Empuje direccional de la cámara (opuesto al disparo o en la dirección del impacto) | 4–10 px |
| **Zoom punch** | Zoom instantáneo y regreso suave | +3 % a +20 % |
| **Squash & stretch** | Aplastar y estirar conservando el área (sx·sy ≈ 1) | tierno 0.75/1.25, batalla 0.85/1.2 |
| **En 1s / 2s / 3s** | Pose nueva cada 1, 2 o 3 frames de 24 fps → 24, 12 u 8 fps | gatos de batalla en 2s, FX en 1s |
| **Smear / multiples** | Frame "embarrado" o con copias que vende la velocidad en vez de motion blur | 1–2 frames |
| **Impact frame** | 1–3 frames de alto contraste (B/N, invertido) en el instante del golpe | 33–100 ms |
| **Misregistro** | Las tintas C/M/Y desalineadas, como en un cómic mal impreso | 1–3 px base, 8–12 px en impacto |
| **Halftone / Ben-Day** | Puntos de imprenta cuyo tamaño depende del tono | celda de 6–12 px |
| **Kirby krackle** | Racimos de puntos negros que representan energía (Jack Kirby) | auras, rayos |
| **Speedlines (shūchūsen)** | Líneas radiales de concentración (manga) | ataques, reveals |
| **Stinger** | Frase musical corta que remata un evento | 1–4 compases |
| **Ducking** | Bajar un bus de audio para que otro destaque | −6 a −24 dB |

---

## 2. Principios de game feel (con números)

### 2.1 Marcos de referencia

- **Steve Swink (*Game Feel*):** el game feel es control en tiempo real de objetos virtuales en un espacio simulado, con interacciones enfatizadas por *polish*. Para que el control se sienta en tiempo real, la respuesta debe llegar en menos de ~100 ms. Para nosotros: **todo input responde en el mismo frame** (el botón se hunde, suena un clic), aunque la recompensa tarde más.
- **Pichlmair y Johansen (2020)** reparten el game feel en tres dominios: **física/tuning** (cómo se mueven las cosas), **amplificación/juicing** (enfatizar los eventos importantes) y **soporte/streamlining** (que el sistema lea la intención del jugador). Este documento es sobre todo amplificación, pero el disparo de artillería necesita también tuning (curva de potencia) y soporte (preview de trayectoria, "coyote time" al soltar).
- **"Juice it or lose it" (Jonasson y Purho, GDC 2012):** toman un Breakout gris y le añaden efecto por efecto: color, tweens de entrada con easing elástico, rotación, squash & stretch de pelota y paleta, sonido, música, partículas, bloques que caen al romperse, shake, estela y una cara en la paleta que sigue a la pelota y sonríe. La lección práctica es construir un **panel de sliders por efecto** para encender y apagar cada uno en vivo (ver §7.9).
- **"The Art of Screenshake" (Jan Willem Nijman, Vlambeer, 2013):** unos 30 trucos en 25 minutos sobre un shooter: animaciones base, más enemigos con menos vida, balas más grandes y rápidas, fogonazo, impactos, hit flash, knockback, **permanencia** (casquillos y cadáveres se quedan), cámara que se adelanta hacia donde apuntas, **sleep** (hitstop), **screenshake** y **camera kick**, más bajos en el sonido, etc. La lección: muchos trucos baratos que se apilan.
- **Contrapunto (sobre-juicing):** varios autores advierten que el exceso de efectos cansa, tapa la falta de profundidad y rompe la atmósfera. Por eso los tiers y el presupuesto de §4 son obligatorios y no opcionales.

### 2.2 Anticipación → impacto → follow-through

Regla de oro para un juego interactivo: **la anticipación larga solo va donde el jugador no está esperando controlar.**

| Situación | Anticipación | Impacto | Follow-through |
|---|---|---|---|
| Acción del jugador (disparar, tocar) | ≤ 80–100 ms o escondida en la fase de carga (barra de potencia) | 1–3 frames + hitstop | 200–400 ms (rebotes, humo, escombros) |
| Recompensa (reveal, cofre, estrella) | **Larga a propósito**: 400–1 500 ms de suspenso (temblor, grietas, riser) | hitstop + impact frame | 1–3 s de "lluvia" de resultados |
| ULTIMATE | 1–1.3 s (paneles + implosión), saltable | 100 ms de impact frames + 200 ms de hitstop | slow-mo 600 ms + recuperación |
| Feedback de UI | 0 | pop de 60–90 ms | asentamiento de 150–250 ms |

### 2.3 Easing (GSAP)

| Uso | Ease | Duración |
|---|---|---|
| Entrada de UI (paneles, tarjetas, banners) | `back.out(1.7)` o `expo.out` | 250–400 ms |
| Salida de UI | `power2.in` | 150–250 ms |
| Number pop | `power2.out` (crece) → `back.out(3)` (asienta) | 90 + 180 ms |
| Squash & stretch tierno (isla) | `elastic.out(1, 0.35)` | 400–600 ms |
| Movimiento "en 2s" (batalla, onomatopeyas) | `steps(n)` sobre la curva, o el reloj `step` (§7.3) | 12 fps |
| Monedas hacia el contador | `power2.in` (aceleran al llegar) | 450–600 ms |
| Cámara siguiendo | lerp exponencial `1 - exp(-k·dt)` | k ≈ 6–12 |
| Cámara regresando | `expo.out` | 300–500 ms |
| Carga / anticipación | `power2.in` / `power3.in` | variable |
| Barras | `back.out(1.8)` (overshoot) | 400–600 ms |
| Tick-up normal | `power3.out` | 0.35–2.2 s (escala logarítmica) |
| Tick-up jackpot | `power2.inOut` + pitch ascendente | 1.5–3 s |
| Entrar/salir de slow-mo | `sine.inOut` | 150 ms entrar / 400 ms salir |

### 2.4 Squash & stretch

- Conserva el área: `sx = 1 / sy`. Si no, el objeto "pierde masa".
- Ancla el `pivot` en el punto de contacto (las patas del gato o la base del módulo) para que no flote.
- **Isla:** exagerado y elástico (0.75 ↔ 1.25), en 1s, con `elastic.out`.
- **Batalla:** más seco (0.85 ↔ 1.2), en 2s, con 1 frame de overshoot y nada de rebote gelatinoso. Así se distingue el "gato tierno" del "gato anime".
- El arte actual de cada gato es **un solo bitmap 700×700** (ver 01-inventario). Para deformar sin partes usa `MeshPlane` de Pixi o un mesh de Spine sobre la imagen: respiración, "jelly", estirón al disparar.

### 2.5 Hitstop (freeze frames)

Sakurai (Smash) lo escala con el daño y lo ajusta por ataque, tiene **topes máximos**, y durante el congelado **hace vibrar** al golpeado (horizontal en suelo, vertical en el aire). En multijugador lo acorta para no frenar el ritmo.

| Evento | Hitstop | Trauma (+) | Zoom punch | Flash |
|---|---|---|---|---|
| Disparo (salida) | 0 | 0.08 + kick 4–6 px | 0 | fogonazo 1–2 frames |
| Impacto leve | 40–60 ms | 0.12 | 0 | hit flash del objetivo, 1 frame |
| Impacto medio | 70–100 ms | 0.25 | +0.03 | hit flash, 2 frames |
| Impacto pesado | 110–150 ms | 0.40 | +0.06 | + impact frame opcional |
| Módulo destruido | +80 ms (total ≤ 180) | 0.50 | +0.08 | impact frame, 2 frames |
| Crítico | +40 ms | +0.15 | +0.04 | borde rosa/amarillo |
| Impacto de ULTIMATE | 200–250 ms | 0.90 | +0.15 | secuencia de 3 frames |
| Golpe final (barco KO) | 250 ms + slow-mo 0.25× durante ~1.2 s | 1.00 | +0.20 | impact frame, 2 frames |
| Recompensas (estrella, ruptura de sello) | 80–120 ms | 0.25–0.35 | +0.05 | impact frame |

Reglas: si caen varios hits en el mismo frame se usa el **máximo, no la suma**; tope absoluto de 250 ms; mientras dura, el objetivo vibra ±2–3 px; la UI y la cámara **no** se congelan (corren con el reloj `fx`).

### 2.6 Screenshake por trauma (Eiserloh, GDC 2016)

- El trauma vive en [0, 1]. Cada golpe **suma**, decae **linealmente** con el tiempo y el shake real es **trauma² o trauma³**. Así los golpes chicos casi no se notan y los grandes se sienten mucho.
- Usa **ruido suave (Perlin/simplex)**, no `Math.random()` por frame: se ve orgánico y no da náusea.
- Traslación + rotación pequeña. A 1080p: offset máx. 16–20 px y rotación máx. ~1.5° (0.025 rad).
- **Frecuencia:** 18–25 Hz para impactos y 3–6 Hz para terremotos o la grieta del cielo (trauma sostenido).
- **Kick direccional > shake aleatorio** cuando el golpe tiene dirección (empuja la cámara en la dirección del impacto y vuelve con `expo.out`). Se lee mejor y marea menos.
- La UI **nunca** tiembla, salvo un "punch" de escala. El shake vive en una capa entre el mundo y la cámara.

### 2.7 Flashes

| Tipo | Cómo | Duración |
|---|---|---|
| Hit flash (objetivo) | shader `mix(color, blanco, uFlash)` o textura de silueta blanca pre-horneada | 1–2 frames |
| Flash de pantalla | `Graphics` blanco en modo aditivo, alfa 0.5–0.7 → 0 | 60–120 ms |
| Flash de color de elemento | overlay del color a 30–40 % | 100–200 ms |
| Impact frame | §3.7 | 33–100 ms |

**Presupuesto (FlashGuard):** como máximo 3 destellos de pantalla completa en cualquier ventana de 1 s (WCAG 2.3.1). En rojo saturado, como máximo 1 por segundo. Todo destello que exceda el presupuesto se sustituye por una salpicadura de tinta sin cambio de luminancia (§7.8).

### 2.8 Partículas

- **Pocas y con intención:** micro 3–12, pequeño 15–30, grande 60–150 (jackpot en `ParticleContainer`).
- Por material: madera (tablas y astillas), metal (tornillos y chispas), cristal, papel o collage (recortes de revista para recompensas), halftone (círculos que se encogen), Kirby krackle (puntos negros), pétalos de sakura, brasas, gotas, estrellas.
- **Animación de partículas en 2s:** el flipbook de cada partícula cambia de frame a 12 fps aunque su posición se mueva a 60 fps. Eso da look "dibujado a mano", el truco de Cuphead (animación a 24 fps en un juego que corre a 60).
- Variación: escala ±25 %, rotación aleatoria, vida 0.55–0.95 s, distribución en anillo con ~0.6 rad de jitter y un empujón hacia arriba al nacer.
- **Permanencia** (Nijman): decals de quemadura, grietas y restos flotando que se quedan toda la batalla.

### 2.9 Aberración cromática / misregistro

Spider-Verse sustituyó el *motion blur* y la profundidad de campo por **misregistro de color y halftone**. Para nosotros:

- **Sobre papel claro** (UI y estilos de imprenta), un RGB split se lee como misregistro **CMY de imprenta**.
- **Sobre fondo oscuro** (cósmico, glitch), el mismo filtro se lee como **aberración cromática digital**.
- Base: 1–2 px en el fondo lejano (sustituye al desenfoque) y 0 en el foco. Impacto: pico de 8–12 px que decae a 0 en 250–500 ms. Texto que aparece: misregistro 8 → 0 px ("se imprime y se registra").
- **No usar `MotionBlurFilter`**: rompe la estética. Usa smears, speedlines y misregistro.

### 2.10 Slow-mo y kill cam (lección de Peggle)

Peggle, al pegarle a la última clavija naranja, pone súper slow-mo y súper zoom sobre la bola con la *Oda a la Alegría* a todo volumen ("Extreme Fever"). Lo traducimos a la **kill cam del último núcleo**: si la física predice que el proyectil destruye el último módulo vital, el tiempo baja a 0.25× unos 600–700 ms antes, la cámara se acerca, entran barras de cine y suena un redoble. Úsala **solo** en el golpe final, en el ULTIMATE y en el jackpot. Si se usa más, pierde valor.

### 2.11 Zoom punch

Zoom instantáneo de +3 % a +20 % según el tier y regreso con `expo.out` en 200–300 ms. Combinado con un *hard cut* (sin tween) a un primer plano da el corte de cámara anime.

### 2.12 Ritmo y sincronización con audio

- **Hi-Fi Rush:** todo lo que se anima en el mundo lo hace al beat. Si pierdes el ritmo, basta mirar el entorno para recuperarlo. Para nosotros: **los idles de los gatos de la isla rebotan al BPM de la música** (un `sin` a la fase del Transport). Es barato y se siente mágico.
- **Balatro:** cada carta suma con un clic, cada multiplicador con un tono ascendente, y cada efecto consecutivo sube un poco el **pitch y la velocidad** hasta un crescendo. Cuando la mano supera la meta, el marcador **se prende fuego**. Hay un selector de velocidad de juego (0.5× a 4×). Para nosotros: secuencias de recompensa que **aceleran** (cada paso es 10–15 % más rápido que el anterior), pitch ascendente y un "fuego" visual cuando el daño del turno supera el HP del módulo.
- **Cuantización:** los stingers de victoria, transformación y reveal esperan al siguiente tiempo o compás (máx. 250 ms de espera; si es más, no se cuantiza).

### 2.13 Number pop

| Tipo | Estilo | Escala | Movimiento |
|---|---|---|---|
| Daño | blanco con contorno de tinta grueso (Bangers / Dela Gothic One) | `1 + 0.18·log10(v)` | pop 0→1.35→1.0, sube 46 px, fade a 550 ms |
| Crítico | rosa `#E8879A` / amarillo `#FFD400` + sello "¡CRÍTICO!" | ×1.4 | + rotación ±8°, speedlines |
| Oro | dorado `#B89558` con brillo | `1 + 0.12·log10(v)` | sube y se desvanece; o vuela al contador |
| Curación / buff | menta `#A7E8D7` | ×1 | sube lento |
| Debuff | morado `#5C3D5B` | ×0.9 | baja |

- **Agregación:** los golpes que caen sobre el mismo objetivo en menos de 300 ms suman en un solo número que "rebota" al crecer, en vez de llenar la pantalla.
- Offset aleatorio de ±12 px en x para que no se encimen.
- Los números se dibujan **siempre en 1s** (60 fps): la legibilidad manda sobre el estilo.
- Formato de números enormes: sufijos propios (K, M, B, T, Qa…). Si el incremental pasa de 1e308, usar `break_eternity.js`.

### 2.14 Monedas que vuelan al contador

1. Spawn de `n = clamp(round(3·log10(monto+1)), 3, 24)` monedas, cada una vale `monto/n`.
2. **Estallido** radial corto (120–180 ms, `power2.out`) con un empujón hacia arriba.
3. **Vuelo** al contador por una curva (control point arriba), `power2.in`, 450–600 ms, escalonado 25–40 ms.
4. **Cada llegada:** el contador suma **esa parte** (no todo de golpe), punch de escala 1.06 (80 ms) y tick con pitch ascendente.
5. **Última moneda:** "DING" más grande, destello del icono, odómetro final.

### 2.15 Contadores que ruedan (tick-up)

- Duración proporcional al **logaritmo** del delta: `d = clamp(0.35 + 0.18·log10(Δ), 0.35, 2.2)` s.
- Normal: `power3.out` (arranca rápido y aterriza suave). Jackpot: `power2.inOut` con ticks cuyo pitch sube con el progreso: la **aceleración** se oye.
- Ticks de sonido cada ≥ 45 ms (no uno por frame), con `rate = 1 + 0.5·progreso`.
- **Odómetro por dígito:** cada dígito rueda por separado con un escalonado de ~50 ms entre dígitos (estilo tragamonedas).
- Al terminar: punch de 1.18 y "ding". **Tap = completar al instante.**

### 2.16 Barras que se llenan con overshoot

- **Barra fantasma** (como la vida en los juegos de pelea, al revés): una marca blanca salta al nuevo valor en 120 ms y la barra sólida la alcanza con `back.out(1.8)` en ~500 ms.
- **Overflow:** al llegar al 100 % hay destello, pop de "¡NIVEL!", la barra se reinicia a 0 y **sigue llenándose** con el sobrante.
- Cuando falta poco (≥ 90 %), la barra vibra un poco y brilla: "ya casi".

---

## 3. Lenguaje visual Spider-Verse × anime, aplicado

### 3.1 Qué hizo Spider-Verse (y qué robamos)

| Técnica en la película | Qué es | Cómo la usamos |
|---|---|---|
| Miles **en 2s** al principio y **en 1s** cuando gana confianza; Peter B. en 1s | La cadencia expresa el dominio del personaje | Los gatos tiernos van en 1s (suaves) y la Battle Form en 2s (tajante). Los gatos **6★ Ascended** pueden pasar a 1s en su ultimate: "ya domina su poder" |
| **Hobie (Spider-Punk):** cuerpo en 3s, partes en 2s, chaqueta en 4s, guitarra en 6s | Collage vivo; las capas a distintos fps lo hacen "pop" | Gatos **Origami/collage**: cuerpo en 3s, accesorios en 4s y props en 6s |
| Halftone/Ben-Day en superficies | Imita la imprenta CMYK de los cómics | Shader de halftone en sombras, fondos de UI y transiciones (§7.5) |
| **Misregistro** en lugar de motion blur o desenfoque | Tintas desalineadas | §2.9 |
| Smears y líneas de acción dibujadas | Velocidad sin blur | §3.8 |
| Onomatopeyas y cajas de texto | Lenguaje de cómic dentro del mundo | §3.11, §3.12 |
| Kirby krackle | Energía como puntos negros | Auras de eléctrico, cósmico y vacío |
| Cada Spider-persona en **su propio estilo** (Noir B/N, Peni anime, Ham cartoon); el mundo de Gwen en acuarela que cambia con sus emociones | Multiverso de estilos | **Cada elemento es un universo** (§3.15) |
| Líneas de tinta "por ángulo" (automáticas) y líneas a mano en expresiones y smears | Tinta híbrida | Contornos horneados en el arte + líneas extra en smears e impactos |

### 3.2 Reglas de cadencia por capa

| Capa | Cadencia | Motivo |
|---|---|---|
| Física, proyectiles, trayectorias, cámara | 60 fps | Precisión y legibilidad (es lo que controla el jugador) |
| UI interactiva, números de daño, barras, apuntado | 60 fps | Legibilidad; nunca stepped |
| Gatos en la isla | 1s (fluido, elástico) | Ternura, calma |
| Gatos en Battle Form | 2s (12 fps) | Energía anime, peso |
| Gatos Tierra/Fósil, jefes pesados | 3s (8 fps) | Masa |
| Accesorios collage (Origami) | 4s–6s | Look de recorte |
| Flipbooks de FX (fuego, explosión) | 1s–2s (24 o 12 fps) | Anime pintado vs. manga |
| Onomatopeyas, paneles, sellos | 2s (`steps`) | Cómic |
| Glitch (cósmico/vacío) | Saltos de 1 frame aleatorios | Error digital |
| Vacío (inquietante) | 4s | Incomodidad |

### 3.3 Halftone / Ben-Day como shader

- Puntos en una rejilla rotada (15° o 45°) cuyo **radio ∝ √oscuridad**, muestreando el color en el **centro de la celda** para que los puntos salgan limpios.
- Usos: sombras de personajes en reveals; fondos de póster (tile de puntos que se desliza lento); **disolvencia halftone** (los puntos crecen de 0 a 100 % para revelar a un gato); "foto de periódico" del momento de victoria.
- `DotFilter` de pixi-filters da un halftone monocromo rápido. Para tinta y papel de la paleta, o color, usa el shader de §7.5.

### 3.4 Misregistro CMYK

- `RGBSplitFilter` con desplazamientos opuestos (rojo a −x, azul a +x, verde en y). En reveals: tween de 8 px → 0 en 200 ms (efecto "se registra").
- Versión sostenida sutil (1 px) en el fondo de las pantallas de póster: da textura de imprenta.

### 3.5 Contornos de tinta y "line boil"

- **Hornea los contornos en el arte** (es lo más barato y lo mejor). `OutlineFilter` solo para estados temporales (seleccionado, objetivo).
- **Line boil:** en animación a mano, las líneas "hierven" porque cada dibujo es ligeramente distinto. Se simula con un `DisplacementFilter` de escala 1.5–3 px cuyo sprite de ruido **salta a una posición aleatoria cada 83 ms** (en 2s). Aplícalo a gatos en Battle Form y a la tipografía de cómic; nunca a números ni UI.
- Modo manga (ULT, impact frames): un shader Sobel sobre la luminancia + alfa genera tinta en todos los bordes durante 0.5–1 s (§7.5).

### 3.6 Speedlines radiales (shūchūsen)

- Shader sobre un quad de pantalla completa (o `Graphics` de triángulos finos) con centro en el gato o en el impacto, máscara interior (círculo limpio) y **semilla que cambia a 12 fps**: parpadean como en el anime.
- Usos: ULT, reveal de rareza, crítico, transformación, enfoque en el "!" de un evento. Duración: 150–800 ms.

### 3.7 Impact frames B/N invertidos

Son 1 a 3 frames de alto contraste (silueta B/N o negativo) en el instante del golpe: la retina retiene el destello y el impacto se siente visceral. Popularizados por Yutaka Nakamura (*Cowboy Bebop*, *One Punch Man*, *My Hero Academia*).

Receta de 3 frames a 30 fps (33 ms c/u):
1. **f1:** umbral B/N **invertido** (fondo negro, siluetas blancas).
2. **f2:** negativo teñido del color del elemento (rojo inferno, cian, magenta…).
3. **f3:** blanco al 70 % (solo si los flashes están permitidos) o directamente la imagen normal.

Úsalos solo en tier ≥ 2 (impacto pesado, núcleo, ULT, ruptura del sello). En el modo fotosensible se sustituyen por un **freeze de tinta**: imagen congelada con contorno grueso y salpicadura negra, sin inversión de luminancia.

### 3.8 Smear frames y "multiples"

- **Smear:** en el frame de máxima velocidad, el sprite se estira en la dirección del movimiento (`scale.x` 1.6–2.2 y `rotation` = ángulo de la velocidad) durante 1–2 frames.
- **Multiples:** 2 o 3 copias del sprite en posiciones anteriores, con alfa 0.6/0.35/0.15, durante 1–2 frames (ecos). Ideal para el zarpazo, el salto y el lanzamiento.
- Los dos sustituyen al motion blur. Crash Bandicoot ya usaba multiples en su giro y Sonic usaba smears.

### 3.9 Kirby krackle

Racimos de círculos negros (de 3 a 12 px) dentro y alrededor de la energía, generados como partículas que nacen agrupadas en "nubes" y laten. Encaja con eléctrico, cósmico, vacío y con el aura de cualquier ULT.

### 3.10 Paneles de cómic/manga para ataques

- **Viñetas que se abren:** la pantalla se divide en 2–4 paneles con gutter blanco de 6–10 px, máscaras poligonales (diagonales) y bordes de tinta. Cada panel entra con slide de 120 ms + zoom punch, escalonados.
- **Contenido típico:** A) ojos brillando, B) pata o arma cargando, C) nombre del ataque. Luego los paneles **se rompen en vidrios** (como el *All-Out Attack* de Persona 5) para revelar la acción a pantalla completa.
- **Line-up del equipo:** 4 viñetas con los 4 gatos, el capitán al centro (estilo collage de manga, ref. 16 de `conceptos/`).

### 3.11 Onomatopeyas tipográficas (catálogo en español)

| Evento | Onomatopeyas | Tipografía | Animación |
|---|---|---|---|
| Comer | ¡ÑAM! ¡ÑOM! ¡ÑAM ÑAM! ¡GULP! ¡MMM! | Bangers / Permanent Marker | pop en 2s, rotación ±10° |
| Disparo | ¡FIUUU! ¡PUM! ¡BAM! | Anton condensada | estirada en la dirección del disparo |
| Impacto madera | ¡KRAK! ¡CRAC! | Dela Gothic One | escala 0→1.3→1, temblor 2 px |
| Impacto metal | ¡CLANK! ¡KLANG! | Anton + contorno | rebote |
| Explosión | ¡BUUM! ¡¡BOOOOM!! | Dela Gothic One + halftone interno | ocupa hasta el 60 % de la pantalla en ULT |
| Agua | ¡SPLASH! ¡PLOF! | brush | gotas que caen de las letras |
| Eléctrico | ¡ZZZAK! ¡BZZT! | glitch / Rubik Glitch | jitter de 1 frame |
| Magia | ¡FWIIING! ✦ | Playfair Display | brillo que barre |
| Espíritu | ¡DON! / ドン | Dela Gothic One (katakana) | B/N manga |
| Romper sello / cristal | ¡KRASH! | Anton | se parte en dos |
| Moneda | ¡CHING! | Space Grotesk bold | pequeño |
| Subir estrella | ¡TUNK! | sello de goma | rotación −8° + salpicadura |
| Evento | ¡ALERTA! ¡RIFT! | Anton en blanco sobre rojo | banner inclinado |

Reglas: **máximo 2 onomatopeyas en pantalla**. Entran en 2s (`steps(3)` en el pop), con un bloque de color desplazado 4–6 px detrás (misregistro) y contorno de tinta grueso. Duran 300–500 ms y salen encogiéndose o "rasgadas". Las letras van escalonadas 20 ms y cada una con una rotación aleatoria de ±6°.

### 3.12 Cajas de texto de cómic

- **Caption box** (rectángulo amarillo `#FFD400` con borde de tinta, mayúsculas): narrador y misiones. "Mientras tanto, en el Santuario…", "Mochi y Levi se fueron a invocar otro…". En Spider-Verse los pensamientos de Miles aparecen como cajas.
- **Globo de grito** (borde dentado): nombres de ataques y frases de transformación.
- **Globo de pensamiento**: tips del tutorial disfrazados ("…¿y si le pego al mástil?").
- Animación: la caja entra con `steps(4)` y el texto aparece palabra por palabra a 40–60 ms, con un "tic" de máquina de escribir (Special Elite o Space Mono).

### 3.13 Transiciones de pantalla

| Transición | Cuándo | Implementación | Duración |
|---|---|---|---|
| **Papel rasgado** | isla ↔ puerto/batalla | Máscara con un borde dentado generado con ruido a lo largo de una diagonal; las dos mitades se separan (`power3.in`); tira de "fibra" blanca en el borde; sonido de rasgado | 350–450 ms |
| **Collage** | abrir menús, Catdex, tienda | 6–10 rectángulos con texturas de póster (rosa, amarillo, cian, papel periódico) caen en 2s con rotación ±8°, escalonados 30 ms, cubren la pantalla y salen revelando la nueva | 500–700 ms |
| **Vidrio roto (Persona)** | ULT, victoria, inicio de jefe | La pantalla capturada (`RenderTexture`) se parte en 12–20 polígonos que vuelan con rotación | 300–500 ms |
| **Glitch / salto dimensional** | transformación, eventos de otro universo, elemento nuevo | `GlitchFilter` (slices 8→20, `refresh()` cada 2 frames) + `RGBSplitFilter` + corte | 150–300 ms |
| **Wipe diagonal rojo/negro** | menús de batalla, resultados | Barras inclinadas que barren (Persona 5), tipografía ransom | 250 ms |
| **Halftone dissolve** | reveals, fade a negro | Puntos que crecen hasta cubrir | 300–400 ms |
| **Iris/círculo rosa** | volver a la isla | Círculo del póster suizo que se expande | 400 ms |

### 3.14 Lecciones de Persona 5 (UI con personalidad)

- Atlus trató la UI **como marketing**: un estilo memorable atrae a un público más amplio a bajo costo.
- **Cada pantalla tiene su propia coreografía**, nada es estático; las transiciones tapan los tiempos de carga.
- Composición diagonal (el menú partido entre negro/blanco y rojo) con **una línea central que guía la mirada**: estilo extremo pero información legible.
- **Ransom lettering** (letras recortadas, cada una con su fondo) en titulares, y texto de cuerpo limpio y de alto contraste.
- Para nosotros: base de **póster suizo** (retícula estricta, Anton gigante, círculo, bloques) y, en eventos y combate, **ruptura Persona** (diagonales, ransom, vidrio roto). La retícula da legibilidad y la ruptura da emoción.

### 3.15 "Cada elemento es un universo" (biblia de estilos de combate)

Las dimensiones y paletas siguen `10-direccion-de-arte.md`. **Cuando un gato ataca, trae su universo a la pantalla durante su turno:** el fondo se tiñe, cambia el grano, la cadencia y la tipografía de la onomatopeya. En cada turno el combate cambia de "película".

| Elemento | Universo visual | Paleta (de `conceptos/`) | Cadencia | Filtros / técnicas | SFX capa |
|---|---|---|---|---|---|
| 🔥 Fuego / Infernal | **ANIME INFERNO**: anime pintado tipo ufotable/Demon Slayer (ref. 13); llamas con rizos de ukiyo-e, brasas, llamas anguladas estilo Kanada | `#4E0000` `#C8102E` `#FF6A1A` `#FFC94A` | cuerpo en 2s, llamas en 1s | AdvancedBloom, distorsión de calor (Displacement), smears | crepitar, rugido |
| 💧 Agua / Acuático | **Ukiyo-e** (la ola de Hokusai, como el *Water Breathing* de Demon Slayer) sobre **NOIR OCEÁNICO** | `#172B35` `#204A7A` `#3569A3` + menta `#A7E8D7` | 2s; olas en 3s (grabado) | Displacement de ondas, Shockwave | burbujas, golpe de agua |
| 🌱 Naturaleza / Bloom | Acuarela (mundo de Gwen) + sakura (ref. 15) | menta `#C6F0E4`, ciruela `#64165D`, rosa | 2s; pétalos en 1s | KawaseBlur suave, pétalos | campanitas, viento |
| 🪨 Tierra / Fósil | **DIARIO DEL MAR**: grabado/xilografía + periódico (ref. 9) | tinta `#1F2B4A` sobre crema `#EAE1D3` | 3s (pesado) | halftone fuerte, CrossHatch | piedra, sub-bass |
| ⚡ Eléctrico / Plasma | Cómic Silver Age: Kirby krackle, alto contraste | negro, `#FFD400`, `#00E5FF` | 2s; rayos 1 frame | RGBSplit, **flicker ≤ 3 Hz** | zap, chisporroteo |
| ✨ Magia / Arcano | **ORQUÍDEA REAL**: tarot, art nouveau, foil | `#231626` `#8F6B93` `#B89558` `#EAE1D3` | 2s | shader de foil, Godray | coro, campanas |
| 🌌 Cósmico / Galáctico | **NEÓN GLITCH** (mariposa, ref. 6), datamosh | `#0D110F` `#FF2E88` `#00E5FF` `#8A5CFF` | 2s + saltos glitch | Glitch, RGBSplit, CRT | sintes, bitcrush |
| 👻 Espíritu | **MANGA TINTA** (refs. 16–17): B/N con tramas; el único color son los ojos | blanco/negro + 1 acento | 3s; impactos 1 frame | umbral B/N, screentone, speedlines | silencio + reverb |
| 🕳️ Vacío | Noir invertido (Spider-Man Noir) + ruido de transmisión | `#0D110F` y grises | 4s (inquietante) | negativo, OldFilm (grano), Pixelate | reverb invertida |
| 🍬 Alquímico / Candy | **EDITORIAL SUIZO** pop (refs. 1–2) | crema `#EDE4D6`, rosa `#E8879A`, negro `#171317` | 2s | plano, sin bloom | pop, burbujeo |
| 📄 Origami / Iridiscente | Collage tipo Hobie (multi-fps) | snake palette `#B7A4C7` `#8D728C` `#5C3D5B` | cuerpo 3s, accesorios 4s, props 6s | sombras de papel, holo | papel, pliegues |
| 🕰️ Tiempo (update futuro) | VHS: rewind y frames repetidos | sepia + magenta | frames que se repiten o retroceden | Glitch vertical | cinta rebobinando |
| 🌀 Multiverso (update futuro) | Cambia de estilo cada 2–4 frames (como el colapso de dimensiones en Spider-Verse) | todas | alterna | LUT que alterna | mezcla |
| 🐱 Isla (cozy) | **COZY ISLA** | crema + pasteles por gato | 1s | ninguno pesado | suaves |

### 3.16 Rareza = calidad de impresión

Alineado con los marcos de `10-direccion-de-arte.md` y con el código de color universal de los gachas: lo bajo es frío y callado, lo medio se calienta y lo alto es oro, arcoíris o estallido de luz.

| Rareza | "Impresión" | Luz / color | Revelación | Sonido |
|---|---|---|---|---|
| Común | Periódico a 1 tinta (halftone gris) | papel `#EAE1D3` | sello simple | "thunk" |
| Raro | Risografía a 2 tintas, misregistro leve | tinta azul `#3569A3` | + speedlines | + campana |
| Épico | CMYK completo, misregistro fuerte que se asienta | rosa neón `#FF2E88` | + impact frame, trauma 0.4 | + coro corto |
| Legendario | Foil dorado (brillo que barre) | `#B89558` → dorado brillante | + slow-mo 0.5×, godrays, tipografía gigante | + fanfarria |
| Mítico | "La imprenta se rompe": holográfico + glitch | arcoíris / CMY neón | + cambio de LUT del mundo, vidrio roto | silencio total 250 ms + tema propio |
| Primordial | Negro con ruido de otra dimensión | negro + el color del elemento | tier 4 (secuencia f) | tema del elemento |

> **Recomendación:** las **estrellas** muestran el progreso (subir estrellas) y la **rareza** se muestra con el sello o marco. Si ambas usan ⭐, el jugador confunde "Épico" con "4★".

### 3.17 Tipografía

Siguiendo `10-direccion-de-arte.md` (empaquetar con `@fontsource`): Anton/Bebas Neue (titulares gigantes), Bangers/Dela Gothic One (onomatopeyas y daño), Permanent Marker (brush), UnifrakturMaguntia (cabecera de periódico), Playfair Display (magia), Rubik Glitch (glitch) y Space Grotesk (UI y números chicos).

**Implementación:** genera **BitmapFonts MSDF** de Anton, Bangers y Space Grotesk para los números y las onomatopeyas que escalan hasta 3× (siguen nítidos y son baratos en Pixi v8). Usa `Text` normal solo para textos largos y estáticos.

---

## 4. Tiers de recompensa (5 niveles)

### 4.1 Tabla maestra

| Tier | Ejemplos | Duración | ¿Bloquea? | Saltar | Efectos | Sonido | Antifatiga |
|---|---|---|---|---|---|---|---|
| **T0 Micro** | recoger oro de 1 hábitat, ¡ÑAM!, tocar un edificio, +XP, golpe leve | 150–500 ms | Nunca | n/a (no estorba) | number pop, 3–12 partículas, squash de 1 ciclo, punch del contador; shake 0–0.08 | 1 capa (blip/tick), jitter ±4 %, **escalera de pitch en rachas** | agregación (sumar en un número), ≤ 6 pops simultáneos, variantes |
| **T1 Pequeño** | subir nivel de gato, paso de misión, cosecha, recolectar todo, módulo destruido | 0.6–1.5 s | No (toast/banner) | tap lo despacha | banner, onomatopeya, 15–30 partículas, barra con overshoot, zoom punch ≤ 0.05, trauma ≤ 0.25 | arpegio de 2–3 notas | en rachas se degrada a T0 salvo el último; 3 variantes de banner |
| **T2 Medio** | misión completada, arma o módulo nuevo, victoria normal, mejora de edificio, estrellas 1–3, combo x5, inicio de evento | 1.5–2.5 s | Semimodal (panel de cómic) | 1.er tap = 2× velocidad, 2.º tap = resumen | panel deslizante + caption box, cascada de recompensas con tick-up, speedlines, misregistro | stinger de 1 compás **cuantizado** | **versión corta** tras 3 en la sesión; combinar recompensas del mismo origen |
| **T3 Grande** | gato nuevo, Raro/Épico/Legendario, estrellas 4–6, barco nuevo, jackpot, Carrera Heroica ganada | 3–5 s | Modal a pantalla completa | Desde 1.0 s, o en cuanto se revela la rareza; repetidos (duplicado) → versión de 1.2–1.5 s | secuencia completa (silueta → elementos → rareza → nombre), impact frames, filtros, shake 0.4–0.6, slow-mo breve | **silencio previo** + riser + stinger + ducking de música | "**primera vez completa, después corta**"; "Ver de nuevo" en el Catdex |
| **T4 Épico** | elemento nuevo, jefe derrotado, Mítico/Primordial, fin de capítulo | 5–8 s | Modal + **el mundo cambia de estilo** | mantener 0.6 s para saltar, desde 1.5 s | todo lo anterior + LUT del mundo + póster tipográfico + árbol que se expande | tape-stop de la música, silencio, tema propio; la isla gana una capa musical nueva | rareza real (≤ ~10 en todo el Capítulo 1); nunca dos T4 seguidos sin volver al mundo |

### 4.2 Presupuesto por sesión (30 min, según el ritmo de la CHARLA)

| Tier | Esperado por sesión de 30 min |
|---|---|
| T0 | cientos (continuo) |
| T1 | 20–40 |
| T2 | 8–15 |
| T3 | 3–6 |
| T4 | 0–2 |

Si la telemetría muestra que un tier se dispara por encima de su presupuesto, **baja el tier del evento**; no agregues más efectos.

### 4.3 Reglas antifatiga

1. **Intensidad ∝ valor real.** +200 de oro nunca lleva fuegos artificiales.
2. **Agregación:** "Recolectar todo" es **una** cascada, no 12 popups. Los T0/T1 que ocurren durante un modal se guardan y se muestran después como un **chip resumen** ("+3 misiones, +12.4K oro").
3. **Habituación local:** si el mismo evento se repite N veces en 10 s, la siguiente instancia usa la variante corta. En feed-all, los niveles intermedios son T0 y solo el último es T1/T2.
4. **Variación:** 3–5 variantes por sonido y por animación, jitter de pitch ±3–5 %, semillas de partículas distintas, 2–3 layouts de banner.
5. **Control del jugador:** tap = acelerar, mantener = saltar; ajuste "Animaciones: completas / rápidas / mínimas" y **velocidad 1×/2×/4×** (como Balatro).
6. **Nunca bloquear input en T0/T1.** Las acciones de la isla siguen funcionando mientras vuelan las monedas.
7. **Rango dinámico:** el 80 % del tiempo la isla está calmada; por eso la batalla y los reveals pegan. Si todo grita, nada grita.
8. **Aceleración dentro de las secuencias:** cada paso de una cascada dura 10–15 % menos que el anterior (Balatro). La secuencia "agarra vuelo" en vez de alargarse.
9. **Fake-out solo hacia arriba y raro:** a lo sumo 1 de cada ~8 reveals de rareza alta hace la pausa de "¿sube?" (como los gachas: un destello de rareza media que dura medio tiempo de más antes de volverse oro), y **solo si de verdad sube**. Nunca un "casi" falso en una pérdida, sobre todo en la lotería.
10. **Cola con prioridad:** un T3 que llega mientras corre un T2 manda al T2 a su resumen; solo hay un modal a la vez.

### 4.4 Cola de recompensas (pseudo-código)

```ts
type Reward = { tier: 0|1|2|3|4; key: string; payload: unknown; mergeKey?: string };

class RewardQueue {
  private q: Reward[] = [];
  private playing?: { r: Reward; fastForward(): void };
  private seen = new Map<string, number>();          // key -> veces en esta sesión

  push(r: Reward) {
    if (r.tier <= 1 && !this.playing) return juice.play(r);           // micro/pequeño: inmediato, sin cola
    if (r.tier <= 1) return summary.merge(r);                          // durante un modal: al chip resumen
    const same = this.q.find(x => x.mergeKey && x.mergeKey === r.mergeKey);
    if (same) return mergePayload(same, r);                            // agrega (p.ej. 3 misiones -> 1 panel)
    this.q.push(r); this.q.sort((a, b) => b.tier - a.tier);
    if (this.playing && r.tier > this.playing.r.tier) this.playing.fastForward();
    this.next();
  }

  private async next() {
    if (this.playing || !this.q.length) return;
    const r = this.q.shift()!;
    const n = (this.seen.get(r.key) ?? 0) + 1; this.seen.set(r.key, n);
    const variant = n === 1 ? 'full' : n <= 3 ? 'normal' : 'short';   // primera vez completa, luego corta
    this.playing = sequences[r.key].start(r.payload, { variant, speed: settings.animSpeed });
    await this.playing.done; this.playing = undefined;
    summary.flush(); this.next();
  }
}
```

---

## 5. Storyboards (tiempos en ms)

Convenciones: **t** desde el inicio de la secuencia. "Hitstop" congela el reloj `game`. La cámara y la UI siguen en `fx`. "En 2s" = 12 fps escalonado.

### (a) Revelación de gato nuevo desde la Resonancia (T3; T4 si es Mítico/Primordial o el primero de un elemento)

Duración: **4.6 s** normal · 6.5 s Mítico · **duplicado 1.4 s**. Saltable desde 1.2 s.

| t | Imagen | Cámara / FX | Audio | Input |
|---|---|---|---|---|
| 0 | Tap en "Resonancia lista". El santuario hace squash (0.9/1.1) | zoom 1→1.35 (`power3.in`, 300) hacia el santuario; la isla se desatura (`AdjustmentFilter.saturation` 1→0.2) | música de la isla: lowpass 20 kHz→700 Hz en 300 ms, −12 dB | bloqueado salvo "Saltar" |
| 300 | **Corte duro** a fondo de papel crema (EDITORIAL SUIZO): círculo rosa gigante, bloques negro/rosa, "RESONANCIA Nº 047" y coordenadas en la esquina | sin tween, 1 frame | **silencio 120 ms** | |
| 420–1 300 | Sello/flor de Resonancia al centro. Tiembla **en 2s** con amplitud creciente 2→8 px. Grietas a 650/900/1 150 ms; por cada una se filtra luz blanca (más intensa cuanto más raro: pista sutil, sin color) | el halftone del fondo pulsa con cada grieta; Kirby krackle orbita cada vez más rápido | "tk" de cerámica por grieta, **+2 semitonos** cada vez; empieza el riser de ruido | **arrastrar sobre el sello adelanta la ruptura** (agencia, como abrir un sobre en Pokémon TCG Pocket); si no hay input, se rompe solo |
| 1 300 | **Ruptura:** hitstop 100 ms en la pose rota | impact frame B/N invertido (2 frames), Shockwave desde el centro (amp. 30, 400 ms), trauma +0.35 | golpe sub + papel o vidrio rompiéndose | aparece "Saltar ›" |
| 1 430–2 000 | **Silueta:** gato en tinta plana `#171317` recortado sobre el círculo rosa; entra con squash & stretch (sy 0.6→1.15→1.0) en 2s | speedlines radiales tenues (semilla a 12 fps) | el riser sigue subiendo (highpass que sube) | |
| 2 000–2 600 | **Elementos:** 1–3 emblemas entran como **sellos de goma** cada 200 ms desde fuera de cuadro (escala 2.0→1.0 con 1 frame de overshoot, rotación ±8°) y dejan salpicadura de tinta. Bloques del color del elemento barren el fondo | por sello: zoom punch +0.03, trauma +0.1; la silueta gana rim light del color del elemento | "THUNK" + capa del elemento (fuego crepita, agua salpica) en **arpegio ascendente** | |
| 2 600–3 300 | **Rareza:** el fondo "se reimprime" con la calidad de la rareza (§3.16). El marco se dibuja como un trazo progresivo. Épico o más: "ÉPICO" en Anton gigante cruza por detrás, recortada por los bloques | Épico: impact frame + RGBSplit 8→0. Legendario: barrido de foil + Godray + slow 0.5× (300 ms). Mítico: glitch + LUT de "otra dimensión" | campana por nivel (pentatónica ascendente); coro en Legendario; Mítico: **silencio total 250 ms** antes | (fake-out opcional §4.3.9) |
| 3 300–4 200 | **Nombre:** la silueta se llena de color con **disolvencia halftone** (puntos 0→100 % en 300 ms). Los ojos se encienden (glow + destello en estrella de 1 frame). Nombre letra por letra (30 ms) con misregistro 8→0 px. Caption box amarilla: *"Mochi y Levi se fueron a invocar otro… y volvieron con ESTO."* | bloom suave en los ojos; confeti de recortes de papel | **stinger cuantizado al siguiente tiempo** + maullido o voz | |
| 4 200–4 600 | Chips de rol, rasgo y ataque. **MUTACIÓN** (si hay): sello rojo extra con su propio golpe (sube un tier). La carta **vuela y encaja** en su hueco del Catdex con rebote (como TCG Pocket) y el contador "12/48→13/48" hace tick y pop | — | tick + "clack" de encaje | "Ver en Catdex" / "Al hábitat" |
| 4 600+ | Vuelta a la isla con papel rasgado | lowpass de regreso en 500 ms | vuelve la música de la isla | libre |

**Duplicado (1.4 s):** ruptura → silueta ya a color → sello "DUPLICADO" → los orbes vuelan a la barra de estrellas del gato (§2.14) → "+40 ORBES · 115/120" ("¡me faltaban 35!").
**Reducir movimiento:** sin shake ni impact frames ni zoom; las mismas fases con fundidos y escalas suaves.

### (b) Transformación tierna → Battle Form al entrar a batalla

Duración: **2.2 s** la primera vez por gato en la sesión · **0.9 s** las siguientes · equipo: solo el capitán completo y el resto en un *line-up* de 1.2 s.

| t | Imagen | Cámara / FX | Audio | Input |
|---|---|---|---|---|
| 0–350 | Papel rasgado en diagonal revela el puerto (NOIR OCEÁNICO). El gato tierno (en 1s, elástico) camina y se voltea a cámara | — | música de la isla → **tape-stop** (baja 1 octava en 300 ms) | tap = saltar a la batalla |
| 350 | **Corte duro** a primerísimo plano | zoom 1→1.8 en 1 frame | silencio 80 ms + latido grave | |
| 430–800 | Viñeta horizontal de los ojos (encuadre tipo ref. 15): se abren en 2 pasos (en 2s), la pupila cambia a su forma (♥, ✦, espiral), brillo emisivo, pétalos o partículas del elemento cruzan | bloom en los ojos 0→1.5; letterbox | "shiiing" metálico + respiración | |
| 800–950 | Impact frame B/N (2 frames) → **glitch de salto dimensional**: bandas 8→20, RGB split 10 px | trauma +0.25 | corte + bitcrush corto | |
| 950–1 700 | **Battle Form:** pose diagonal en silueta de tinta sobre un bloque del color del elemento → se rellena de color en 2 pasos. El aura va en 1s y el cuerpo en 2s. Speedlines. Cartela vertical inclinada (Persona): **"CANELO — INFERNAL FORM"**. Globo de grito con su frase | zoom punch +0.08 al rellenarse; misregistro 6→0 | golpe orquestal o sintetizado + grito | |
| 1 700–2 200 | La viñeta se rompe en vidrios y revela el campo de batalla; el barco emerge del agua (bob + salpicadura) | trauma 0.15; la cámara abre a plano general (`expo.out` 500) | el tema de batalla entra **en el downbeat** | control al jugador |

**Versión corta (0.9 s):** ojos (200) → glitch (100) → pose + cartela (400) → vidrio (200).
**Line-up del equipo (1.2 s):** 4 viñetas manga que se "imprimen" escalonadas 120 ms, cada una con un "¡TUNK!" ascendente y el capitán grande al centro.

### (c) Disparo normal + impacto en un módulo

| Fase / t | Imagen | Cámara / FX | Audio | Input |
|---|---|---|---|---|
| Apuntar (continuo) | Trayectoria punteada con puntos halftone que avanzan hacia afuera. La barra de potencia se llena y tiembla un poco al 90–100 % | zoom 0.95 para ver ambos barcos | tono continuo que sube de 220 a 660 Hz con la potencia; clic suave cada 10 % | todo a 60 fps |
| 0 (soltar) | Gato: squash de 80 ms (sy 0.85) → stretch al disparar (sy 1.15, 60 ms) → follow-through de 2 rebotes en 2s. Fogonazo de 2 frames (3 variantes) + humo | **camera kick** 4–6 px opuesto al disparo; trauma +0.08 | whoosh de salida + capa del elemento, pitch ±4 % | |
| Vuelo | Proyectil con estela (cinta) y stretch según la velocidad (`sx = 1 + v·k`, máx. 1.6); partículas del elemento; flipbook a 12 fps | la cámara sigue con lerp (k≈6) y se adelanta un 15 % en la dirección del vuelo | silbido con "Doppler" (el pitch baja después del ápice) | |
| T (impacto) | **Hitstop 50–150 ms** según el daño. El módulo vibra ±3 px durante el freeze. Hit flash blanco de 1–2 frames | Shockwave en el punto de impacto (amp. 20–40, 350 ms); trauma +0.12…0.4; zoom punch +0.03…0.06 | transiente (crack) + cuerpo (boom grave) + capa del material; música −6 dB durante 300 ms | |
| T+hitstop | Escombros según el material (tablas, tornillos, cristal) con física; chispas, polvo; **decal permanente**; el módulo cambia a su sprite dañado | — | cola de escombros | |
| T+hitstop | Número "−1 240" (pop 0→1.35→1, sube, fade). Onomatopeya según el material: ¡KRAK!, ¡CLANK!, ¡BUUM! | — | — | |
| Crítico | +40 ms de hitstop; número grande rosa/amarillo con borde de tinta; sello "¡CRÍTICO!" inclinado; speedlines 200 ms | RGBSplit 6→0 en 250 ms | "ding" agudo encima | |
| Módulo destruido | +80 ms; el módulo se rompe en piezas físicas; banner "¡MÓDULO DESTRUIDO!" (T1); combo +1 | trauma +0.5; impact frame si es el **núcleo** | explosión + "crunch" | |
| +600–1 000 | La cámara regresa | `expo.out` 400 ms | — | siguiente turno |

**Combo en el mismo turno** (rebotes, cadenas eléctricas): contador "x2, x3…" en el que cada paso sube **un grado de la pentatónica**, el número crece un 10 % y el color se calienta (blanco → amarillo → rosa → rojo). En x5: "¡COMBO BRUTAL!" (T2). **Daño que supera el HP restante del módulo → el marcador se prende fuego** (idea de Balatro).

### (d) ULTIMATE

Duración: **3.6 s** la primera vez en la batalla · **1.8 s** en los usos siguientes del mismo gato (sin paneles A y B) · en PvP cada espectador puede saltarlo localmente.
**Previo:** con el medidor lleno, el medidor brilla, los ojos del gato se encienden y el botón ULT late a 1 Hz.

| t | Imagen | Cámara / FX | Audio | Input |
|---|---|---|---|---|
| 0 | Tap ULT. **Todo se congela** (timeScale 0). El mundo pasa a B/N (MANGA TINTA) salvo el gato | umbral B/N en la capa del mundo | corte a silencio + drone grave ("el vacío") | |
| 150–900 | **3 viñetas manga** en diagonal, escalonadas 120 ms: **A)** ojos con pétalos o el elemento; **B)** pata o arma cargando con speedlines; **C)** el nombre del ataque en brush lettering sobre un collage de periódico: **"SOLAR CATACLYSM"** | cada viñeta entra con zoom punch +0.04 y misregistro 5→0 | "thwack" por viñeta; el **grito del nombre** empieza en C | tap = saltar a 1 300 |
| 900–1 100 | Las viñetas se rompen en vidrios (*All-Out Attack*) → splash art de la Battle Form: póster con tipografía gigante detrás y el círculo | — | cristal + golpe | |
| 1 100–1 300 | **Anticipación:** la cámara retrocede (1.0→0.92), el gato se encoge (squash 0.8) y todas las partículas son succionadas hacia él (implosión) | luz ambiente −30 % | el riser sube y **se corta a 1 150: 150 ms de silencio total** | |
| 1 300–1 400 | **Liberación:** impact frames: f1 B/N invertido, f2 negativo teñido del elemento, f3 blanco (si se permiten flashes), 33 ms cada uno | — | golpe principal (sub + rugido + elemento) | |
| 1 400–1 900 | El rayo o meteorito viaja **en 1s** con smears y multiples; llamas o explosiones anguladas (estilo Kanada) | la cámara sigue + zoom punch; `ZoomBlurFilter` breve hacia el objetivo | whoosh largo | |
| 1 900 | **Impacto:** hitstop 220 ms | trauma 0.9 (tope), 2 Shockwaves (a 0 y 120 ms), RGBSplit 12→0 en 500 ms | sub-bass + explosión + cola larga; música −12 dB | |
| 2 120–2 800 | **Slow-mo 0.3×** mientras vuelan escombros y fuego. Onomatopeya gigante **"¡¡BOOOOM!!"** con halftone por dentro (60 % de la pantalla). El daño hace tick-up de 0 al total en 700 ms | — | ticks con pitch ascendente; "ding" final | |
| 2 800–3 600 | El tiempo vuelve de 0.3 a 1 (`sine.inOut` 400 ms); sello "ULTIMATE"; la cámara regresa | — | la música vuelve con un golpe en el downbeat | sigue el turno |

### (e) Barco enemigo destruyéndose / victoria

Duración: **5.0 s** · saltable desde 1.5 s (tap → resultados con totales finales).

| t | Imagen | Cámara / FX | Audio | Input |
|---|---|---|---|---|
| −700 | **Kill cam (Peggle):** si la física predice que el proyectil destruye el último núcleo, el tiempo baja de 1 a 0.25× (`sine.in` 200 ms) y entran barras de cine | zoom hacia el proyectil 1→1.4 | redoble + lowpass a la música | |
| 0 | Impacto final: **hitstop 250 ms** | impact frame de 2 frames; Shockwave grande; trauma 1.0 | 100 ms de silencio antes → el golpe más fuerte del juego | |
| 250–1 500 | **Explosiones en cadena** por módulo cada 120→70 ms (aceleran); el barco se parte en dos (se rompe la articulación física) y se hunde inclinado; salpicaduras, humo, restos flotando | la cámara se aleja lento; trauma +0.2 por explosión | cada explosión +1 semitono | |
| 1 500–2 200 | **"¡VICTORIA!"** letra por letra (60 ms) en Anton gigante con misregistro, círculo rosa y bloques que barren (EDITORIAL SUIZO); alternativa **"¡HUNDIDO!"** como cartela de Cuphead ("A KNOCKOUT!") | el tiempo vuelve a 1× | fanfarria cuantizada al compás | saltar |
| 2 200–4 200 | **Portada de periódico** (DIARIO DEL MAR): *"¡EXTRA! ¡EXTRA! CANELO PARTE BARCO EN TRES"* con una **foto halftone del frame del impacto** (captura con `RenderTexture`). Recompensas en cascada (oro con tick-up, piezas, orbes). Los "−8 min" son sellos que **vuelan al icono del timer de Resonancia** y lo hacen bajar visiblemente (los sistemas se conectan) | — | ticks + "clack" por sello | tap = completar |
| 4 200–5 000 | Momentum ×1.2 → ×1.5 (barra con overshoot); MVP: el gato en pose en 2s con su frase | — | stinger corto | botones |

**Derrota (2 s):** paleta NOIR OCEÁNICO, "DERROTA" en tinta azul con grano (OldFilm), pero **las recompensas igual hacen tick-up** (nunca "+0") y aparece "Análisis del jefe: 73 %". Tono amable.

### (f) Descubrimiento de elemento nuevo (T4)

Duración: **7.5 s** · saltable desde 2 s (mantener 0.6 s) · se puede ver de nuevo desde el Catdex.

| t | Imagen | Cámara / FX | Audio | Input |
|---|---|---|---|---|
| 0–600 | **El mundo reacciona:** el cielo se oscurece (brightness 1→0.55) y los gatos de la isla miran arriba, escalonados 40 ms, con "!" | zoom-out lento | **tape-stop** de la música; rumor grave | — |
| 600–1 800 | Una grieta se dibuja en el cielo; dentro se ve la dimensión del elemento con su estilo (p. ej. Magia en ORQUÍDEA REAL) | Glitch por bandas 2→12; **shake de terremoto** (4 Hz, trauma 0.3 sostenido) | rumble + acorde disonante que crece | |
| 1 800–2 400 | La silueta del Primordial aparece en la grieta. Texto mono tecleado: **"ELEMENTO DESCONOCIDO DETECTADO"** | CRT/scanlines breves ("transmisión") | beeps de teletipo | saltar disponible |
| 2 400–2 600 | Impact frame → **el mundo se reimprime:** toda la pantalla pasa a la paleta del elemento (`ColorMapFilter`/LUT 0→1 en 200 ms) | — | golpe + silencio 200 ms | |
| 2 600–4 600 | **Póster:** "MAGIA" en Anton al 70 % del alto, círculo con el emblema y bloques; "✨ PRIMORDIAL MÁGICO". Caption: *"Has descubierto un elemento que no debería existir en este mundo."* | misregistro que se asienta; partículas del elemento | **tema del elemento** (motivo de 4 compases) | |
| 4 600–6 600 | **Árbol de Resonancias:** zoom-out a la red de elementos; los nodos nuevos aparecen escalonados 30 ms con pop; contador "NUEVAS RESONANCIAS: 0→17" | — | pings en escala ascendente (se reinicia por octava) | |
| 6 600–7 500 | Sellos: "NUEVO EDIFICIO: HÁBITAT ARCANO", "NUEVA MECÁNICA: ESCUDOS". Regreso a la isla, que conserva una **marca permanente** (ruina o grieta) | — | la música de la isla vuelve **con una capa nueva del elemento, para siempre** | |

### (g) Subir estrella

Duración: **2.6 s** (estrellas 1–3, T2) · **3.2 s** (estrellas 4–5, T3) · la 6★ Ascended encadena una transformación (T4).

| t | Imagen | Cámara / FX | Audio |
|---|---|---|---|
| 0–800 | Chorro de 10–20 orbes que vuelan del inventario al gato (30 ms escalonados); barra 118/120 → 120/120 con overshoot | — | ping pentatónico ascendente por orbe |
| 800–1 300 | **Anticipación:** el gato pulsa (escala 1→1.08) 3 veces, cada vez más rápido (300/200/120 ms), con brillo blanco creciente | speedlines tenues | riser corto |
| 1 300 | **Impacto:** hitstop 80 ms, flash blanco del gato; la estrella nueva **cae como sello de goma** sobre la ficha (−8°, salpicadura de tinta) | trauma 0.25, zoom punch 0.05 | "¡TUNK!" + acorde mayor |
| 1 500–2 600 | Stats "ATK 820 → 1 040" en odómetro por dígito (50 ms escalonado) + "+220" en menta. La carta del efecto desbloqueado gira (scaleX 1→0→1): **"★★★: deja fuego"** | — | ticks + "flip" |
| 2 600–3 200 | 4★ y más: preview del ataque cambiado (mini-clip de 1 s). 6★: transición a la nueva forma (versión corta de b) | — | stinger |

### (h) Recolectar oro de todos los hábitats (T1, no bloquea)

Duración: **1.2–1.8 s**.

| t | Imagen | FX | Audio |
|---|---|---|---|
| 0 | Botón "Recolectar todo": squash y destello | — | "ching" |
| 0–500 | Cada hábitat (ordenados por distancia al contador) hace bounce escalonado 60→40 ms (acelera), suelta 3–8 monedas (log del monto) y muestra "+12.4K" encima | — | pops suaves |
| 150–1 400 | Las monedas estallan (180 ms) y vuelan en curva al contador (`power2.in`, 450–600 ms). **Cada llegada:** punch del contador 1.06, suma parcial | sparkle por llegada | tick con **pitch ascendente** (pentatónica; al cerrar la octava vuelve a empezar y agrega un brillo agudo) |
| última | Destello del icono + odómetro final. Si se cruza un hito ("¡PRIMER MILLÓN!") → T2 | — | "DING" grande |

**Reducir movimiento:** sin monedas que vuelan; el contador hace tick-up con un pulso suave.

### (i) Alimentar gato (¡ÑAM! + barra)

| t | Imagen | FX | Audio |
|---|---|---|---|
| 0 | Tap en comida: el pez salta del contador al gato (arco de 250 ms) | — | "fiu" corto |
| 180 | El gato anticipa: abre la boca y se inclina (squash 0.9) | — | — |
| 250 | **"¡ÑAM!"** (Bangers/Permanent Marker, ±10°, pop 0→1.2→1 en 120 ms `steps(3)`); masticada de 2 ciclos de squash & stretch (tierno, exagerado); migajas + corazón; la barra de XP sube con `back.out(1.8)` y marca fantasma blanca | 5–8 partículas | "ñam" (blip con formante), **+1 semitono por bocado** (tope 12; se reinicia tras 1.2 s sin comer) |
| mantener | La cadencia acelera de 250 a 120 ms; variantes ¡ÑAM!, ¡ÑOM!, ¡ÑAM ÑAM!, ¡GULP!, ¡MMM! | — | pitch sigue subiendo |
| sube de nivel | Barra al 100 % → destello → "¡NIVEL 12!" (pop + odómetro); salto feliz; el sobrante sigue llenando desde 0 | trauma 0.05 | arpegio de 3 notas |
| nivel hito (10, 20…) | El aura cambia: mini secuencia T2 "¡Su aura despertó!" (1.5 s) | speedlines + rim light | stinger |
| feed-all | 15→16→17… en micro (120 ms por nivel: el número rueda + mini destello); el **último nivel completo** | — | ticks ascendentes y acorde final |

### (j) Jackpot en la lotería (Cat's Gambit, T3)

Ética: **sin "casi ganas" falsos** en las pérdidas; la pérdida se resuelve en ≤ 1 s con tono amable. Se respeta el tope diario de gemas que propone la CHARLA.

| t | Imagen | FX | Audio |
|---|---|---|---|
| 0–1 200 | El gato tahúr baraja 3 cartas (en 2s) o giran los rodillos; los ticks se espacian (50→250 ms, desaceleración) | PÓSTER RETRO (crema, rojo `#B3202A`) | ticks que se frenan |
| 1 200 | Se detiene en **x20**: hitstop 120 ms; "x20" en foil dorado gigante sobre el círculo rojo | trauma 0.5, impact frame | golpe + campana |
| 1 300–3 500 | **Lluvia de monedas** desde arriba (80–150 en `ParticleContainer` con física simple) que rebotan abajo y luego vuelan al contador en lotes de 10; odómetro con aceleración; banner inclinado "¡JACKPOT!" (Persona); confeti de periódico; el gato baila en 2s | — | jingle en loop hasta que termina el conteo; el pitch de los ticks sube |
| 3 500–4 500 | El número final se estampa (punch 1.25) | — | "ding" + acorde |

Duración del conteo: 1.5–3 s (escala logarítmica). Tap = completar.

### (k) Inicio de evento flash con reloj rojo

Duración: **2.5 s** de interrupción y luego un reloj persistente que no bloquea.

| t | Imagen | FX | Audio |
|---|---|---|---|
| 0 | **"BOOOOM"**: interrupción. Overlay multiplicativo rojo inferno `#4E0000` al 40 % en 200 ms; el cielo cambia | trauma 0.3 | rayón de disco o tape-stop + golpe |
| 200–700 | Toma de "transmisión" (COLLAGE GRUNGE + glitch): bandas glitch; banner diagonal rojo **"🚨 RIFT EVENT"** entra deslizando | Glitch 150 ms, CRT scanlines | sirena de 2 tonos, **2 ciclos** (sin loop infinito) |
| 700–1 500 | El reloj **"14:59"** golpea al centro (Anton, rojo sobre crema) con un **TOCK** fuerte que dura un segundo real. *"Esto está pasando AHORA."* + carta del premio en silueta (Raijin "?") | zoom punch 0.08 | TOCK |
| 1 500–2 500 | El reloj se encoge y vuela a la HUD; queda un reloj rojo persistente con latido a 1 Hz; la misión se crea y entra deslizando a la lista | — | swoosh |
| persistente | Últimos 60 s: latido a 2 Hz + tic. Últimos 10 s: pop en cada número (**nunca más de 3 Hz de destellos**) | — | tic-tac |

**Código de color universal:** reloj **verde** = tiempo productivo (se acelera jugando); reloj **rojo** = tiempo competitivo (sagrado, no se acelera).

---

## 6. Diseño de sonido para dopamina

### 6.1 Principios

1. **Capas** en todo sonido importante: **transiente** (clic o crack, 5–20 ms) + **cuerpo** (tono o boom) + **cola** (reverb, chispas) + **sub** (40–80 Hz en impactos grandes).
2. **Pitch ascendente en rachas y combos** (monedas, ¡ÑAM!, orbes, ticks de contador, explosiones en cadena). Es la "escalera" de Balatro y Peggle. Usa la **pentatónica mayor** para que nunca suene disonante, súbela hasta 1–2 octavas y luego reinicia con una capa de brillo.
3. **Silencio antes del impacto:** 100–250 ms de vacío (ducking de todo a −30 dB) antes de los golpes T3/T4 y del ULT. El contraste vale más que el volumen.
4. **Ducking:** la música baja 6–12 dB durante los impactos y stingers (ataque de 30 ms, release de 400–500 ms).
5. **Variación:** jitter de pitch ±3–5 % y 3–5 variantes por sonido. Nunca la misma muestra dos veces seguidas.
6. **Cuantización musical:** stingers y entradas de tema en el siguiente tiempo o compás (Tone.Transport, `"@4n"` o `"@1m"`). Los idles de la isla rebotan al BPM.
7. **Sonido positivo = sube.** Recompensas con glissando o arpegio ascendente e intervalos mayores (4.ª y 5.ª justas, 3.ª mayor). Error o pérdida = intervalo descendente y suave, sin castigar.
8. **Música adaptativa por capas:** la isla tiene una base calmada y **cada elemento descubierto le suma una capa** (stem) para siempre. La progresión se oye.
9. **Tape-stop / rayón** para cambios de mundo (isla → batalla, eventos).

### 6.2 Escalas y fórmulas

```ts
// rate de reproducción para subir n semitonos: 2^(n/12)
const semis = (n: number) => Math.pow(2, n / 12);
const PENTA = [0, 2, 4, 7, 9];                               // pentatónica mayor
const comboSemis = (step: number) => PENTA[step % 5] + 12 * Math.floor(step / 5);
// paso 0..9 = dos octavas. Con Howler: sound.rate(semis(comboSemis(step)), id) (rango válido 0.5–4.0)
// ojo: playbackRate cambia pitch Y duración a la vez (es lo que queremos en ticks cortos)
```

### 6.3 Generar todo sin assets comerciales

| Herramienta | Para qué | Notas |
|---|---|---|
| **Web Audio API** puro | impactos, whooshes, risers, blips con control total | snippets abajo |
| **ZzFX** (MIT, < 1 KB) | SFX procedurales (monedas, saltos, golpes, power-ups); diseñador web con exportación a .wav | se diseña en el *ZzFX Sound Designer*, se copia el array de parámetros a `sfx.ts` y se cambia el 3.er parámetro (frecuencia) para subir el pitch |
| **jsfxr / sfxr.me / ChipTone** | generar .wav estilo arcade para luego procesarlos | revisa la licencia de cada herramienta; los sonidos generados normalmente son tuyos |
| **Tone.js** | sintes FM/AM para stingers mágicos, Transport para cuantizar al beat, `Draw` para sincronizar visuales con el reloj de audio | opcional; pesa más |
| **Howler.js** | reproducción de muestras (sprites de audio), desbloqueo de audio en el primer gesto, `rate()` para el pitch | base para SFX horneados y música |
| **Kenney / Freesound (CC0)** | foley (papel, cerámica, agua, madera) | **solo CC0**; registra la fuente |
| Grabación propia | ¡ÑAM!, maullidos, gritos de ataque (pitch-shift + formante) | da personalidad; subtítulos siempre |

### 6.4 Snippets Web Audio

```ts
const ctx = new AudioContext();
const bus = (v: number) => { const g = ctx.createGain(); g.gain.value = v; g.connect(ctx.destination); return g; };
const BUS = { sfx: bus(0.9), ui: bus(0.7), music: bus(0.6) };

// Blip/moneda: dos parciales en 4.ª justa (sube = positivo)
export function coin(step = 0) {
  const t = ctx.currentTime, base = 988 * semis(comboSemis(step)) * (1 + (Math.random() - 0.5) * 0.04);
  [[base, 0], [base * 4 / 3, 0.06]].forEach(([f, dt]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(f, t + dt);
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.exponentialRampToValueAtTime(0.25, t + dt + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.12);
    o.connect(g).connect(BUS.ui); o.start(t + dt); o.stop(t + dt + 0.15);
  });
}

// Ruido blanco reutilizable
const NOISE = (() => { const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();

// Impacto: seno que cae (thump) + ruido filtrado (crack)
export function impact(power = 1) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
  g.gain.setValueAtTime(0.9 * power, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g).connect(BUS.sfx); o.start(t); o.stop(t + 0.4);
  const n = ctx.createBufferSource(); n.buffer = NOISE;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(6000, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.2);
  const ng = ctx.createGain(); ng.gain.setValueAtTime(0.7 * power, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  n.connect(f).connect(ng).connect(BUS.sfx); n.start(t); n.stop(t + 0.25);
}

// Whoosh: ruido por bandpass que barre
export function whoosh(dur = 0.35, up = true) {
  const t = ctx.currentTime, n = ctx.createBufferSource(); n.buffer = NOISE;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2;
  f.frequency.setValueAtTime(up ? 300 : 3000, t); f.frequency.exponentialRampToValueAtTime(up ? 3000 : 300, t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(BUS.sfx); n.start(t); n.stop(t + dur + 0.05);
}

// Ducking (y el "silencio antes del golpe" es un duck a -30 dB)
export function duck(target: GainNode, db = -12, attack = 0.03, hold = 0.4, release = 0.5) {
  const t = ctx.currentTime, p = target.gain, v = p.value, low = v * Math.pow(10, db / 20);
  p.cancelScheduledValues(t); p.setValueAtTime(v, t);
  p.linearRampToValueAtTime(low, t + attack); p.setValueAtTime(low, t + attack + hold);
  p.linearRampToValueAtTime(v, t + attack + hold + release);
}
```

Stinger cuantizado + visual sincronizado (Tone.js):

```ts
import * as Tone from 'tone';
function stingerOnBeat(play: (time: number) => void, visual: () => void) {
  Tone.getTransport().scheduleOnce((time) => {
    play(time);                                   // audio en el tiempo exacto del beat
    Tone.getDraw().schedule(visual, time);        // visual en el frame más cercano a ese tiempo
  }, '@4n');                                      // siguiente negra ('@1m' = siguiente compás)
}
```

### 6.5 Mezcla

- Buses: **Música / SFX / UI / Voces**, cada uno con su slider. Limitador suave en el master (`DynamicsCompressorNode`) para que las cadenas de explosiones no saturen.
- **Prioridad de voces:** máximo ~24 voces simultáneas. Las de menor prioridad (ticks) se cortan antes que los impactos.
- **Latencia:** dispara el SFX en el mismo frame que el visual. Para los cuantizados, retrasa el **visual** al beat (≤ 250 ms).

---

## 7. Implementación web

### 7.1 Stack recomendada

| Pieza | Elección | Por qué / notas |
|---|---|---|
| Render | **PixiJS v8** con `preference: 'webgl'` | Estable. Los filtros custom solo necesitan GLSL (con WebGPU habría que escribir también WGSL) |
| Filtros | **`pixi-filters` v6** (compatible con v8) | AdjustmentFilter, AdvancedBloomFilter, GlitchFilter, RGBSplitFilter, ShockwaveFilter, ZoomBlurFilter, DotFilter, CRTFilter, OldFilmFilter, ColorMapFilter, ColorOverlayFilter, GodrayFilter, CrossHatchFilter, KawaseBlurFilter, OutlineFilter, PixelateFilter, SimplexNoiseFilter… |
| Tweens | **GSAP 3.13+** | 100 % gratis desde abril de 2025, incluidos los plugins (CustomEase, MotionPath, PixiPlugin). PixiPlugin tiene un ejemplo oficial con v8; algunas propiedades (p. ej. `fillColor` de Graphics) dieron problemas, así que tweenea propiedades numéricas directas |
| Personajes | **`@esotericsoftware/spine-pixi-v8`** (oficial, requiere Pixi ≥ 8.16) | Interpolación *stepped* por clave = animar en 2s; mallas para deformar un solo bitmap; `autoUpdate=false` + `update(dt)` desde el reloj `step` |
| Partículas | **Propias sobre `ParticleContainer`/`Particle` de v8** para el 90 % (monedas, chispas, escombros) | v8: ~1 M partículas a 60 fps en el benchmark oficial frente a ~200 K con Sprites. Todas las texturas de un `ParticleContainer` deben compartir **un TextureSource** (atlas) |
| Partículas (autoría) | `@spd789562/particle-emitter` (port v8 del clásico, mismo formato de config), `custom-pixi-particles` o `revolt-fx` | Para efectos diseñados por config o editor |
| Audio | **Howler.js** (muestras y sprites) + **ZzFX** (procedural) + Web Audio (§6.4); **Tone.js** opcional para música adaptativa | |
| Fuentes | `@fontsource` + **BitmapFont MSDF** para números y onomatopeyas | nítidas al escalar |
| Debug | **Tweakpane** o lil-gui | sliders por efecto (como el demo de "Juice it or lose it") |
| Números grandes | formateador propio con sufijos; `break_eternity.js` si se pasa de 1e308 | |

### 7.2 Arquitectura: eventos → recetas → primitivas

```
 Gameplay / Economía                 JuiceDirector                       Primitivas (FX)
 ───────────────────                 ─────────────                       ───────────────
 emit('impact.module', {...})  ──►  busca RECIPES[type]           ──►   Clocks.hitstop(ms)
 emit('reward.cat', {...})          aplica Settings (a11y, calidad)      TraumaShake.add(t)
 emit('ui.coin', {...})             FlashGuard (≤3/s)                    Camera.kick/zoomPunch
                                    RewardQueue (tiers, agregación)      Particles.burst(id)
                                    Telemetría (presupuesto por tier)    NumberPop / Onomato
                                                                         FilterPulse(rgb, shock…)
                                                                         Audio.play(id, step)
                                                                         Sequences (storyboards a–k)
```

- **Gameplay nunca llama a efectos directamente.** Solo emite eventos semánticos. Así se puede retocar el feel sin tocar la lógica, y "reducir movimiento" es un multiplicador en un solo lugar.
- Las **recetas son datos** (JSON/TS) y se tunean en vivo con el panel de debug.
- Las **secuencias** (storyboards a–k) son timelines de GSAP compuestas de primitivas, con etiquetas (`'silueta'`, `'rareza'`…) para saltar o acelerar (`tl.timeScale(2)`, `tl.seek('resumen')`).

```ts
// recipes.ts
export const RECIPES: Record<string, Recipe> = {
  'shot.fire':      { tier: 0, trauma: 0.08, kick: 5, particles: ['muzzle', 'smoke'], sfx: ['whoosh_out'], onomato: e => e.power > 0.8 ? '¡PUM!' : undefined },
  'impact.module':  { tier: 1, hitstopMs: e => 50 + 100 * e.power, trauma: e => 0.12 + 0.28 * e.power,
                      zoomPunch: e => 0.06 * e.power, flash: { scope: 'target', frames: 2 },
                      particles: e => [`debris_${e.material}`, 'sparks', 'dust'], decal: e => `crack_${e.material}`,
                      onomato: e => ONOMATO[e.material], sfx: e => ['impact', `mat_${e.material}`],
                      filters: [{ fx: 'shockwave', ms: 350, power: e => 20 + 20 * e.power }] },
  'impact.crit':    { tier: 1, hitstopMs: 40, trauma: 0.15, filters: [{ fx: 'rgbsplit', ms: 250, power: 6 }], onomato: '¡CRÍTICO!', sfx: ['ding_hi'] },
  'module.destroyed': { tier: 1, hitstopMs: 80, trauma: 0.5, impactFrame: e => e.isCore, sfx: ['explosion', 'crunch'] },
  'ui.coin':        { tier: 0, sfx: ['coin'], stepKey: 'coins' },     // stepKey => escalera de pitch compartida
  'cat.feed':       { tier: 0, onomato: () => pick(['¡ÑAM!', '¡ÑOM!', '¡GULP!']), sfx: ['nam'], stepKey: 'feed' },
};
```

### 7.3 Relojes: `game`, `fx`, `step` (hitstop, slow-mo, "en 2s")

```ts
export class Clocks {
  fx = 0; game = 0; scale = 1;                 // scale = slow-mo del gameplay
  private freezeUntil = 0;
  update(dtMS: number) {
    this.fx += dtMS;
    const gameDt = this.fx < this.freezeUntil ? 0 : dtMS * this.scale;
    this.game += gameDt;
    return { fxDt: dtMS, gameDt };
  }
  hitstop(ms: number) { this.freezeUntil = Math.max(this.freezeUntil, this.fx + Math.min(ms, 250)); } // máx, no suma
  slowmo(to: number, inMs = 150, holdMs = 600, outMs = 400) {
    gsap.timeline()
      .to(this, { scale: to, duration: inMs / 1000, ease: 'sine.inOut' })
      .to(this, { scale: 1, duration: outMs / 1000, ease: 'sine.inOut' }, `+=${holdMs / 1000}`);
  }
}

// GSAP manejado por el ticker de Pixi (un solo loop)
gsap.ticker.remove(gsap.updateRoot);
app.ticker.add(() => gsap.updateRoot(performance.now() / 1000));
// Los tweens de gameplay viven en su propio timeline para heredar hitstop/slow-mo:
export const gameplayTL = gsap.timeline({ autoRemoveChildren: true });
// cada frame: gameplayTL.timeScale(clocks.fx < freezeUntil ? 0 : clocks.scale)

// "En 2s": los proxies se tweenean suave y la vista se actualiza a 12 fps
export class StepGroup {
  private acc = 0;
  constructor(public fps: number, public items: { view: Container; proxy: { x: number; y: number; r: number; sx: number; sy: number }; spine?: Spine }[]) {}
  update(gameDtMS: number) {
    this.acc += gameDtMS;
    const step = 1000 / this.fps;
    if (this.acc < step) return;
    const elapsed = this.acc - (this.acc % step); this.acc %= step;
    for (const it of this.items) {
      it.view.position.set(it.proxy.x, it.proxy.y);
      it.view.rotation = it.proxy.r; it.view.scale.set(it.proxy.sx, it.proxy.sy);
      it.spine?.update(elapsed / 1000);        // spine.autoUpdate = false
    }
  }
}
// const onTwos = new StepGroup(12, battleCats); const onThrees = new StepGroup(8, heavyCats);
```

### 7.4 Primitivas (código corto)

**Shake por trauma** (capa `shakeLayer` entre el mundo y la cámara):

```ts
const noise1 = (seed: number, x: number) => {            // value noise suave en [-1, 1]
  const h = (n: number) => { const s = Math.sin((n + seed * 57.3) * 127.1) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
};
export class TraumaShake {
  trauma = 0; private t = 0;
  constructor(public maxPx = 18, public maxRot = 0.025, public decay = 1.6, public freq = 22, public mult = 1) {}
  add(a: number) { this.trauma = Math.min(1, this.trauma + a * this.mult); }   // mult = setting de accesibilidad
  apply(layer: Container, dtMS: number) {
    this.t += dtMS / 1000;
    this.trauma = Math.max(0, this.trauma - this.decay * dtMS / 1000);
    const s = this.trauma * this.trauma;                                        // trauma²
    layer.position.set(this.maxPx * s * noise1(1, this.t * this.freq), this.maxPx * s * noise1(2, this.t * this.freq));
    layer.rotation = this.maxRot * s * noise1(3, this.t * this.freq);
  }
}
```

**Number pop** (BitmapText MSDF + pool):

```ts
export function numberPop(layer: Container, value: number, at: PointData, kind: 'dmg' | 'crit' | 'gold' | 'heal') {
  const t = textPool.get(kind); t.text = fmt(value);
  const size = 1 + (kind === 'gold' ? 0.12 : 0.18) * Math.log10(Math.max(1, value)) * (kind === 'crit' ? 1.4 : 1);
  t.anchor.set(0.5); t.position.set(at.x + (Math.random() - 0.5) * 24, at.y); t.scale.set(0); t.alpha = 1;
  layer.addChild(t);
  gsap.timeline({ onComplete: () => textPool.release(t) })
    .to(t.scale, { x: size * 1.35, y: size * 1.35, duration: 0.09, ease: 'power2.out' })
    .to(t.scale, { x: size, y: size, duration: 0.18, ease: 'back.out(3)' })
    .to(t, { y: at.y - 46, duration: 0.6, ease: 'power1.out' }, 0)
    .to(t, { alpha: 0, duration: 0.25 }, 0.55);
}
```

**Monedas al contador** (MotionPathPlugin funciona con cualquier objeto que tenga x/y):

```ts
export function coinsToCounter(from: PointData, to: PointData, amount: number, onArrive: (part: number, i: number) => void) {
  const n = Math.min(24, Math.max(3, Math.round(3 * Math.log10(amount + 1)))), part = amount / n;
  for (let i = 0; i < n; i++) {
    const c = coinPool.get(); c.position.set(from.x, from.y);
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 60;
    const mid = { x: from.x + Math.cos(a) * r, y: from.y + Math.sin(a) * r - 40 };
    gsap.timeline({ delay: i * 0.035 })
      .to(c, { x: mid.x, y: mid.y, duration: 0.18, ease: 'power2.out' })
      .to(c, { motionPath: { path: [mid, { x: (mid.x + to.x) / 2, y: Math.min(mid.y, to.y) - 80 }, to], curviness: 1.4 },
               duration: 0.45 + Math.random() * 0.15, ease: 'power2.in',
               onComplete: () => { coinPool.release(c); onArrive(part, i); } });
  }
}
// onArrive = (p, i) => { counter.add(p); punch(counterLabel, 1.06); juice.emit('ui.coin', { step: i }); }
```

**Tick-up** (escala logarítmica, ticks con pitch y tap para terminar):

```ts
export function tickUp(label: BitmapText, from: number, to: number, jackpot = false) {
  const o = { v: from }, d = Math.min(2.2, Math.max(0.35, 0.35 + 0.18 * Math.log10(Math.max(1, to - from))));
  let last = 0;
  const tw = gsap.to(o, { v: to, duration: jackpot ? d * 1.4 : d, ease: jackpot ? 'power2.inOut' : 'power3.out',
    onUpdate() { label.text = fmt(o.v); const now = performance.now();
      if (now - last > 45) { last = now; audio.play('tick', { rate: 1 + 0.5 * this.progress() }); } },
    onComplete() { punch(label, 1.18); audio.play('ding'); } });
  input.onceTap(() => tw.progress(1));                // tap = completar
  return tw;
}
```

**Barra con fantasma y overshoot:**

```ts
export function fillBar(bar: { ghost: { ratio: number }; fill: { ratio: number } }, to: number) {
  gsap.to(bar.ghost, { ratio: to, duration: 0.12, ease: 'power2.out' });
  gsap.to(bar.fill, { ratio: to, duration: 0.5, ease: 'back.out(1.8)', delay: 0.08 });
}
```

**Onomatopeya en 2s:**

```ts
export function onomato(text: string, at: PointData, style: OnomatoStyle) {
  const g = buildOnomato(text, style);               // letras + bloque desplazado (misregistro) + contorno; cacheAsTexture
  g.position.copyFrom(at); g.rotation = (Math.random() - 0.5) * 0.35; g.scale.set(0);
  gsap.timeline({ onComplete: () => g.destroy() })
    .to(g.scale, { x: 1.3, y: 1.3, duration: 0.12, ease: 'steps(3)' })
    .to(g.scale, { x: 1, y: 1, duration: 0.12, ease: 'steps(2)' })
    .to(g, { alpha: 0, duration: 0.15, ease: 'steps(2)' }, '+=0.35');
}
```

### 7.5 Shaders GLSL (filtros de Pixi v8)

Vértice estándar de filtro en v8 (reutilízalo en todos):

```glsl
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) { return aPosition * (uOutputFrame.zw * uInputSize.zw); }
void main(void) { gl_Position = filterVertexPosition(); vTextureCoord = filterTextureCoord(); }
```

Montaje en TS:

```ts
import { Filter, GlProgram } from 'pixi.js';
export const halftone = new Filter({
  glProgram: new GlProgram({ vertex: FILTER_VERT, fragment: HALFTONE_FRAG, name: 'halftone' }),
  resources: { u: {
    uCell:  { value: 8, type: 'f32' },        uAngle: { value: 0.26, type: 'f32' },
    uInk:   { value: new Float32Array([0.09, 0.075, 0.09]), type: 'vec3<f32>' },     // #171317
    uPaper: { value: new Float32Array([0.918, 0.882, 0.827]), type: 'vec3<f32>' },   // #EAE1D3
    uMix:   { value: 1, type: 'f32' } } },
});
// animar: gsap.to(halftone.resources.u.uniforms, { uMix: 0, duration: 0.3 })
```

**Halftone / Ben-Day** (muestrea el centro de la celda para que los puntos salgan limpios):

```glsl
in vec2 vTextureCoord; out vec4 finalColor;
uniform sampler2D uTexture; uniform vec4 uInputSize; uniform vec4 uOutputFrame; uniform vec4 uInputClamp;
uniform float uCell; uniform float uAngle; uniform vec3 uInk; uniform vec3 uPaper; uniform float uMix;
void main() {
  vec2 screen = vTextureCoord * uInputSize.xy + uOutputFrame.xy;
  float s = sin(uAngle), c = cos(uAngle); mat2 rot = mat2(c, -s, s, c);
  vec2 grid = rot * screen / uCell;
  vec2 cell = floor(grid) + 0.5;
  vec2 centerUV = ((transpose(rot) * (cell * uCell)) - uOutputFrame.xy) / uInputSize.xy;
  vec4 src  = texture(uTexture, clamp(centerUV, uInputClamp.xy, uInputClamp.zw));
  vec4 here = texture(uTexture, vTextureCoord);
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  float radius = sqrt(1.0 - lum) * 0.71;                 // área del punto ∝ oscuridad
  float d = length(grid - cell), aa = fwidth(d);
  float dotMask = 1.0 - smoothstep(radius - aa, radius + aa, d);
  vec3 ht = mix(uPaper, uInk, dotMask) * here.a;         // premultiplicado
  finalColor = vec4(mix(here.rgb, ht, uMix), here.a);
}
```

**Misregistro CMY** (sobre papel claro se ve como imprenta; en la práctica `RGBSplitFilter` hace casi lo mismo):

```glsl
in vec2 vTextureCoord; out vec4 finalColor;
uniform sampler2D uTexture; uniform vec4 uInputSize; uniform vec4 uInputClamp;
uniform vec2 uOffC; uniform vec2 uOffM; uniform vec2 uOffY;     // en px; anímalos de 8 -> 0
vec4 tap(vec2 off) { return texture(uTexture, clamp(vTextureCoord + off * uInputSize.zw, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec4 c = tap(uOffC), m = tap(uOffM), y = tap(uOffY);
  // cada placa de tinta controla un canal: C absorbe rojo, M verde, Y azul
  finalColor = vec4(c.r, m.g, y.b, max(max(c.a, m.a), y.a));
}
```

**Tinta / modo manga** (Sobel sobre luminancia + alfa):

```glsl
in vec2 vTextureCoord; out vec4 finalColor;
uniform sampler2D uTexture; uniform vec4 uInputSize; uniform vec3 uInk; uniform float uThick; uniform float uMix;
float L(vec2 o) { vec4 c = texture(uTexture, vTextureCoord + o * uInputSize.zw * uThick); return dot(c.rgb, vec3(0.299,0.587,0.114)) + c.a; }
void main() {
  float gx = -L(vec2(-1,-1)) - 2.0*L(vec2(-1,0)) - L(vec2(-1,1)) + L(vec2(1,-1)) + 2.0*L(vec2(1,0)) + L(vec2(1,1));
  float gy = -L(vec2(-1,-1)) - 2.0*L(vec2(0,-1)) - L(vec2(1,-1)) + L(vec2(-1,1)) + 2.0*L(vec2(0,1)) + L(vec2(1,1));
  float edge = smoothstep(0.25, 0.6, length(vec2(gx, gy)));
  vec4 c = texture(uTexture, vTextureCoord);
  finalColor = vec4(mix(c.rgb, uInk * max(c.a, edge), edge * uMix), max(c.a, edge * uMix));
}
```

**Impact frame B/N** (sobre la capa del mundo, opaca):

```glsl
in vec2 vTextureCoord; out vec4 finalColor;
uniform sampler2D uTexture; uniform float uThreshold; uniform float uInvert; uniform vec3 uInk; uniform vec3 uPaper;
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  float b = step(uThreshold, dot(c.rgb, vec3(0.299, 0.587, 0.114)));
  b = mix(b, 1.0 - b, uInvert);                          // f1: uInvert=1, f2: teñido (uPaper = color del elemento)
  finalColor = vec4(mix(uInk, uPaper, b), 1.0);
}
```

**Speedlines radiales** (la semilla cambia a 12 fps):

```glsl
in vec2 vTextureCoord; out vec4 finalColor;
uniform sampler2D uTexture; uniform vec4 uInputSize; uniform vec4 uOutputFrame;
uniform vec2 uCenter; uniform float uSeed; uniform float uDensity; uniform float uInner; uniform vec3 uColor; uniform float uAmount;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec4 src = texture(uTexture, vTextureCoord);
  vec2 d = vTextureCoord * uInputSize.xy + uOutputFrame.xy - uCenter;
  float r = length(d) / length(uInputSize.xy);
  float a = atan(d.y, d.x) / 6.28318 + 0.5;
  float id = floor(a * uDensity), h = hash(id + uSeed), w = fract(a * uDensity);
  float line = step(0.55, h) * step(abs(w - 0.5), 0.3 * h);              // grosor variable
  float mask = smoothstep(uInner, uInner + 0.25 + 0.2 * hash(id * 3.1 + uSeed), r);
  finalColor = mix(src, vec4(uColor, 1.0), line * mask * uAmount);
}
```

**Line boil** (sin shader nuevo):

```ts
const boilSprite = Sprite.from('noise_256.png'); boilSprite.texture.source.addressMode = 'repeat';
const boil = new DisplacementFilter({ sprite: boilSprite, scale: 2.5 });
// cada 83 ms (en 2s): boilSprite.position.set(Math.random() * 256, Math.random() * 256);
battleCatsLayer.filters = [boil];
```

### 7.6 Recetas de `pixi-filters`

| Efecto | Filtro y parámetros clave | Dónde | Duración |
|---|---|---|---|
| Onda de impacto | `ShockwaveFilter({ center, amplitude: 20–40, wavelength: 160, speed: 500, radius: 250–400 })`; animar `time` | capa del mundo | 350–500 ms |
| Misregistro / aberración | `RGBSplitFilter({ red:{x:-n,y:0}, green:{x:0,y:n/2}, blue:{x:n,y:0} })` n: 8→0 | mundo o UI de reveal | 200–500 ms |
| Salto dimensional | `GlitchFilter({ slices: 8–20, offset: 40–100, red, blue, fillMode })`, `refresh()` cada 2 frames | pantalla | 150–300 ms |
| Desaturar / oscurecer mundo | `AdjustmentFilter({ saturation, brightness, contrast })` | mundo | 200–600 ms |
| Aura y ojos | `AdvancedBloomFilter({ threshold: 0.5, bloomScale: 1–1.5, blur: 8 })` a resolución 0.5 | capa de FX | sostenido |
| Zoom hacia el objetivo | `ZoomBlurFilter({ strength: 0.1–0.2, center, innerRadius: 80 })` | mundo | 100–200 ms |
| Transmisión de evento | `CRTFilter` (scanlines, ruido, viñeta) | pantalla | 300–700 ms |
| Derrota noir / vacío | `OldFilmFilter` (grano, rayas, viñeta) + `PixelateFilter` | pantalla | sostenido |
| Cambiar el mundo de estilo | `ColorMapFilter` (LUT por elemento), `mix` 0→1 | todo | 200 ms |
| Hit flash | `ColorOverlayFilter({ color: 0xffffff, alpha: 1 })` en el sprite (o silueta blanca horneada, más barata) | objetivo | 1–2 frames |
| Fondo de modal | `KawaseBlurFilter` sobre la escena congelada (**renderiza una vez a textura**) | detrás del modal | estático |
| Halftone rápido | `DotFilter` (monocromo) | fondos | sostenido |
| Rayos divinos | `GodrayFilter` | reveal Legendario, Magia | 600–1 200 ms |

### 7.7 Rendimiento (checklist)

- **Un filtro = un pase extra de render.** Aplica los post-efectos **a una capa contenedora** (mundo, UI), no sprite por sprite.
- **Quita el filtro cuando no se usa** (`container.filters = []` o `filter.enabled = false`): un filtro a intensidad 0 sigue costando su pase.
- Bloom y blur a `resolution: 0.5`. Define `filterArea` cuando el efecto es local (Shockwave en un radio).
- Pool de 2–3 Shockwaves. Si llega una cuarta, se recicla la más vieja.
- **Atlas** para todo. Las partículas de un `ParticleContainer` usan un solo `TextureSource`.
- **Pools de objetos** (monedas, textos, partículas, decals). Nada de `new` en el ticker.
- `BitmapText` (MSDF) para los números que cambian; `Text` solo para textos estáticos. **`cacheAsTexture`** para composiciones estáticas (pósters, cartelas, onomatopeyas ya armadas).
- Los "impact frames" y el vidrio roto parten de **una captura en `RenderTexture`**, no de re-renderizar la escena.
- `resolution: Math.min(devicePixelRatio, 2)` con `autoDensity: true`.
- **Calidad adaptativa:** si el promedio de frame supera 20 ms durante 2 s, bajas a "Media" (sin bloom, partículas ×0.5, sin line boil). Si supera 28 ms, "Baja" (sin filtros de pantalla salvo flashes).
- La física (paso fijo de 60 Hz) es independiente del render. Los escombros decorativos van a un mundo físico "barato" separado o se simulan como partículas sin colisión.
- Presupuesto orientativo por frame en batalla: ≤ 3 filtros de pantalla activos, ≤ 2 000 partículas y ≤ 24 voces de audio.

### 7.8 Accesibilidad: reducir movimiento y destellos

| Opción | Valores | Efecto |
|---|---|---|
| Sacudida de cámara | 0–100 % | `TraumaShake.mult` |
| Destellos | Completos / Suaves / Apagados | Suaves: alfa máx. 0.35 y sin full-screen. Apagados: los sustituye la salpicadura de tinta |
| **Modo fotosensible** | on/off | ≤ 3 destellos/s, sin rojo saturado a pantalla completa, impact frames → freeze de tinta, rayos sin parpadeo, glitch sin cambios bruscos de luminancia |
| Aberración / glitch | on/off | desactiva RGBSplit, Glitch y CRT |
| Movimiento | Completo / Reducido | Reducido: sin zoom punch ni kick, slow-mo y transiciones sustituidos por fundidos, monedas que no vuelan, sin line boil |
| Velocidad de animación | 1× / 2× / 4× | `timeScale` de las secuencias (como Balatro) |
| Cinemáticas | Siempre / Solo nuevas / Nunca | usa el contador `seen` de la RewardQueue |
| Subtítulos | on/off | gritos de ataque, onomatopeyas leídas, maullidos con sentido |
| Volúmenes | Música / SFX / UI / Voces | buses |

```ts
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const settings = {
  shake: reduce ? 0 : 1, flash: reduce ? 'soft' : 'full', aberration: !reduce,
  motion: reduce ? 'reduced' : 'full', animSpeed: 1, photosensitive: false, cinematics: 'new',
};

// FlashGuard: ≤ 3 destellos en cualquier ventana de 1 s (WCAG 2.3.1); rojo saturado ≤ 1/s
export class FlashGuard {
  private times: number[] = []; private reds: number[] = [];
  allow(now: number, isRed: boolean) {
    this.times = this.times.filter(t => now - t < 1000); this.reds = this.reds.filter(t => now - t < 1000);
    const max = settings.photosensitive ? 1 : 3;
    if (this.times.length >= max || (isRed && this.reds.length >= 1)) return false;   // => usar sustituto sin luminancia
    this.times.push(now); if (isRed) this.reds.push(now); return true;
  }
}
```

Notas: WCAG 2.3.1 prohíbe más de 3 destellos en cualquier segundo (salvo que estén por debajo de los umbrales general y de rojo); el rojo saturado es especialmente riesgoso. Las Xbox Accessibility Guidelines (117) piden poder detener o reducir el contenido que se mueve o parpadea y ajustar el movimiento de cámara. Halo Infinite, por ejemplo, ofrece sliders de 0 a 100 % para shake, blur radial y speedlines. **El reloj rojo del evento late a 1–2 Hz, nunca más rápido.**

### 7.9 Herramientas de autoría y pipeline

- **Panel de juice** (Tweakpane): una carpeta por receta con sliders de hitstop, trauma, zoom, partículas, filtros y SFX, y un botón "disparar". Como en el demo de Jonasson y Purho, se enciende y apaga cada capa para ver qué aporta.
- **Grabación de GIFs o clips** del panel para comparar variantes (A/B de feel).
- **Spine:** claves *stepped* para la Battle Form (en 2s) y curvas para los idles de la isla (en 1s). Mallas sobre el bitmap único de cada gato. La metadata por gato (posición de los ojos, boca y punto de disparo) sirve para pegar el glow de los ojos, el ¡ÑAM! y el fogonazo en el lugar correcto.
- **Pipeline 3D→2D opcional** (como Dead Cells, que renderizaba modelos 3D a sprites de baja resolución sin antialias a 30 fps): sirve para barcos y módulos destructibles si se necesitan muchas vistas o estados de daño. Iterar timings pasa a ser mover keyframes.
- **Flipbooks de FX** dibujados (fuego, explosión, agua) a 12–24 fps, empaquetados en atlas. Hades llegó a decenas de miles de frames de FX: aquí conviene **pocos flipbooks reutilizables + recoloreo por shader** (ColorMap por elemento).
- **Telemetría de juice:** contador de eventos por tier y por sesión (§4.2) y tiempo total de "input bloqueado" por sesión. Debe quedar por debajo del ~5 %.

---

## 8. Orden de producción sugerido (MVP de juice)

| Fase | Qué | Por qué primero |
|---|---|---|
| 1 | Respuesta en < 100 ms a todo input (squash del botón + clic), `JuiceDirector`, `Clocks`, `TraumaShake`, hitstop, number pop, SFX con jitter | El 80 % del feel por el 20 % del costo |
| 2 | Disparo + impacto completos (c), partículas por material, decals, combo con pitch | Es el núcleo del combate |
| 3 | Monedas al contador, tick-up, barras con overshoot, ¡ÑAM! (h, i) | El núcleo de la economía de la isla |
| 4 | RewardQueue + tiers + accesibilidad + FlashGuard | Antes de que haya muchas recompensas |
| 5 | Onomatopeyas, speedlines, misregistro, halftone, transiciones (papel rasgado y collage) | La identidad Spider-Verse |
| 6 | Secuencias T3/T4: reveal (a), transformación (b), ULT (d), victoria (e) | El "WOW" |
| 7 | Estilos por elemento (LUT, flipbooks recoloreados), elemento nuevo (f), jackpot (j), evento (k) | Escala de contenido |
| 8 | Música adaptativa por capas + cuantización; idles al BPM | Pulido fino |

**Qué NO hacer:** motion blur (rompe la estética); shake en el texto de la UI; secuencias largas sin salto; destellos de más de 3 Hz o rojo a pantalla completa en estroboscopio; fuegos artificiales por recompensas triviales; bloquear el input en T0/T1; el mismo sonido sin variación; números en 2s (ilegibles); más de 2 onomatopeyas a la vez; "casi ganas" falsos en la lotería.

---

## 9. Fuentes

**Game feel y juice**
- Jonasson y Purho, *Juice It or Lose It* (GDC 2012): https://www.gdcvault.com/play/1016487/juice-it-or-lose · resumen: https://roblog.co.uk/2024/03/juicy-games/
- Jan Willem Nijman, *The Art of Screenshake* (INDIGO 2013): https://www.youtube.com/watch?v=AJdEqssNZ-U · experimentos: https://www.bluetengu.com/2014/12/12/art-of-screenshake-experiments/
- Squirrel Eiserloh, *Math for Game Programmers: Juicing Your Cameras With Math* (GDC 2016): http://www.mathforgameprogrammers.com/gdc2016/GDC2016_Eiserloh_Squirrel_JuicingYourCameras.pdf · implementación: https://roystan.net/articles/camera-shake/
- Steve Swink, *Game Feel*: https://en.wikipedia.org/wiki/Game_feel · capítulo 1: http://mycours.es/gamedesign2014/files/2014/10/Game-Feel-Steve-Swink-chapter-1.pdf
- Pichlmair y Johansen, *Designing Game Feel. A Survey* (2020): https://arxiv.org/abs/2011.09201
- Game feel en la web (squash, hitstop, partículas, reduced motion): https://valdemird.com/blog/game-feel-on-the-web/
- Sakurai sobre hitstop: https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/ · https://critpoints.net/2017/05/17/hitstophitfreezehitlaghitpausehitshit/ · https://www.ssbwiki.com/Hitlag
- Contra el sobre-juicing: https://www.gamedeveloper.com/design/video-indies-resist-the-urge-to-juice-it-or-lose-it- · https://www.wayline.io/blog/juice-overload-sensory-feedback-hurts-gameplay
- Celeste, game feel (hilo de Maddy Thorson): https://threadreaderapp.com/thread/1238338574220546049.html

**Juegos de referencia**
- Balatro: https://www.avclub.com/balatro-hones-the-art-of-making-numbers-go-up · https://www.answersforgamers.com/score-on-fire-balatro/ · https://medium.com/@yyh19971004/balatro-design-analysis-visual-packaging-and-interactive-feedback-cc6fa6a65370 · recreación web con valores de referencia (no oficiales): https://blakecrosley.com/guides/design/balatro
- Peggle (Extreme Fever / Oda a la Alegría): https://en.wikipedia.org/wiki/Peggle · https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Peggle
- Vampire Survivors (cofre tipo tragamonedas, primeros cofres generosos): https://en.wikipedia.org/wiki/Vampire_Survivors · https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors
- Reveals de gacha (color, suspenso, fake-outs, saltos): https://hostedgg.com/blog/gacha-pull-reveal-color-culture · Honkai Star Rail: https://www.ginx.tv/en/4-star-5-star-warp-animation-differences
- Pokémon TCG Pocket (abrir sobres, rarezas que cargan y tiemblan, encaje en el dex): https://60fps.design/apps/poke-mon-tcg-pocket · https://www.gameshub.com/news/features/pokemon-tcg-pocket-review-2646767/ · https://github.com/gabrielrauch/poke-pack-sim/pull/16
- Persona 5 UI: https://www.resetera.com/threads/atlus-talks-about-persona-5s-ui-design-dev-talk.5865/ · https://medium.com/@fruitcupkun/persona-5-menus-with-personality-and-readability-d6db2e0b253e · https://ridwankhan.com/the-ui-and-ux-of-persona-5-183180eb7cce
- Hi-Fi Rush (todo al beat): https://en.wikipedia.org/wiki/Hi-Fi_Rush
- Cuphead (animación a 24 fps en un juego a 60 fps; cartelas "WALLOP!"/"KNOCKOUT!"): https://en.wikipedia.org/wiki/Cuphead · https://www.hardcoregaming101.net/cuphead/
- Dead Cells (pipeline 3D→2D): https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-
- Hades (FX y UI "juicy"): https://mcvuk.com/business-news/behind-the-art-of-hades-we-value-artistic-integrity-and-excellence-in-artistic-craft-at-supergiant-however-were-first-and-foremost-a-game-design-lead-team/

**Spider-Verse, anime y cómic**
- Técnicas de *Into the Spider-Verse* (2s/1s, halftone, misregistro, onomatopeyas): https://marilajane.substack.com/p/into-the-spider-verse-animation-techniques · https://medium.com/everythingcg/spider-man-into-the-spider-verse-a-balance-between-art-and-technology-e7b88aab2a56 · https://www.flicks.com.au/features/by-subverting-comic-book-movies-into-the-spider-verse-evolved-the-animation-industry/
- Hobie / Spider-Punk con fps distintos por parte del cuerpo, StepSets, líneas de tinta: https://beforesandafters.com/2023/06/17/the-across-the-spider-verse-spider-punk-character-hobie-was-animated-with-different-frame-rates-for-different-parts-of-his-own-body-and-accessories/
- Estilos por universo en *Across the Spider-Verse*: https://fangirlblog.com/2023/07/animation-styles-in-spider-man-across-the-spider-verse/
- Ben-Day y Kirby Krackle: https://en.wikipedia.org/wiki/Ben_Day_process · https://en.wikipedia.org/wiki/Kirby_Krackle
- Impact frames: https://knowyourmeme.com/memes/cultures/impact-frames · https://www.sakugabooru.com/forum/show/1448
- Smear frames: https://en.wikipedia.org/wiki/Smear_frame · https://theses.fh-hagenberg.at/system/files/pdf/Lendenfeld18.pdf
- Itano Circus: https://en.wikipedia.org/wiki/Ichir%C5%8D_Itano
- Demon Slayer / ufotable (ukiyo-e, composición 2D/3D): https://www.thepopverse.com/movies-demon-slayer-kimetsu-no-yaiba-infinity-castle-ufotable-dynamic-anime-honors-koyoharu-gotouge · https://actionnews.online/anime/ufotable-studio-deep-dive-demon-slayer-fate-animation-style/

**Implementación web**
- pixi-filters v6 (lista de filtros, compatibilidad v8): https://github.com/pixijs/filters · ShockwaveFilter: https://pixijs.io/filters/docs/ShockwaveFilter.html · GlitchFilter: https://pixijs.io/filters/docs/GlitchFilter.html
- Filtros custom en PixiJS v8: https://pixijs.com/8.x/guides/components/filters
- ParticleContainer v8: https://pixijs.com/blog/particlecontainer-v8 · emisores: https://github.com/spd789562/pixi-v8-particle-emitter · https://github.com/lukasz-okuniewicz/custom-pixi-particles · https://github.com/bma73/revolt-fx
- Spine para Pixi v8: https://esotericsoftware.com/blog/spine-pixi-v8-runtime-released · https://www.npmjs.com/package/@esotericsoftware/spine-pixi-v8
- GSAP gratis (abril 2025): https://webflow.com/updates/gsap-becomes-free · https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/ · PixiPlugin: https://gsap.com/docs/v3/Plugins/PixiPlugin/ · incidencia v8: https://github.com/greensock/GSAP/issues/580
- Audio: ZzFX: https://github.com/KilledByAPixel/ZzFX · Howler.js: https://howlerjs.com/ · Tone.js: https://tonejs.github.io/ · Transport: https://github.com/tonejs/tone.js/wiki/Transport
- Accesibilidad: WCAG 2.3.1: https://www.w3.org/TR/UNDERSTANDING-WCAG20/seizure-does-not-violate.html · Xbox Accessibility Guideline 117: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117

**Material del proyecto**
- `/Users/roor.osorio/Desktop/No one/CHARLA.txt` (diseño del juego)
- `/Users/roor.osorio/Desktop/No one/conceptos/` (17 referencias visuales: pósters suizos, periódico + brush, collage neón, glitch, manga B/N, ojos anime con sakura, fuego Demon Slayer, paletas ciruela/lila/noir/rojo inferno)
- `/Users/roor.osorio/Desktop/No one/research/10-direccion-de-arte.md` y `01-gatos-inventario.md`
