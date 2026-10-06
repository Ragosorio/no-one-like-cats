# 11 — Barcos estilo anime/cartoon que se rompen por partes

Pedido del usuario tras ver la batalla: *"menos pixels, más estilo anime, pero el barco con la destrucción"*. El render anterior dibujaba cada celda lógica de 40 px como un `Graphics` cuadrado con su contorno: el barco se leía como una rejilla de cuadritos. Este informe resume cómo resuelven otros juegos 2D la tensión entre "ilustración continua" y "se rompe por partes", y documenta la técnica elegida e implementada en `game/src/battle/anime/`.

---

## 1. El problema en una frase

La simulación necesita una rejilla (celdas con HP, material, estados, grafo estructural, colapso por BFS desde la quilla: ver `03-castle-busters.md` §8). El jugador debe ver **una sola ilustración** que, al recibir daño, **pierde exactamente los pedazos** que la simulación destruyó, con bordes de rotura creíbles y sin que la rejilla se note nunca.

## 2. Cómo lo hacen otros

| Referencia | Técnica | Qué tomamos |
|---|---|---|
| **Worms / Scorched Earth** | El terreno es un bitmap. Cada explosión "muerde" un círculo de píxeles (se escriben ceros en la máscara y se re-sube la textura). Colisión por píxel o por polígonos regenerados. | Solo la parte visual: **pintar el daño dentro de la textura** (grietas, hollín, agujeros) y re-subirla. La colisión sigue siendo la rejilla. |
| **Fractura Voronoi en sprites** (plugins de Unity, tesis de fractura en tiempo real) | Se trocea un sprite en polígonos irregulares con UV que apuntan a la textura original; los trozos cubren el área completa sin huecos ni solapes. | **Cada celda es un polígono irregular que muestra su trozo de la textura**. En vez de Voronoi libre usamos una rejilla deformada: así cada polígono coincide 1:1 con una celda lógica. |
| **Castle Busters / Angry Birds / Crush the Castle** | Bloques rígidos con juntas rompibles. | Solo para lo que ya se soltó: los trozos que salen volando o se hunden son cuerpos simples (balística analítica), no física completa. |
| **Cosmoteer / FTL** | Rejilla lógica + grafo estructural; lo desconectado se desprende. | Ya lo tenía `ShipModel.collapse()`. Faltaba el arte. |
| **Cuphead — Captain Brineybeard** | Barco animado a mano, contorno grueso, el daño se expresa con cambios de estado del personaje-barco y escora (se tambalea de lado a lado al ser derrotado). | **Escora y balanceo con resorte** al recibir impactos; módulos que cambian a su versión rota. |
| **Sid Meier's Pirates! / Sea of Thieves (sprites lejanos)** | Las velas dañadas se ven rasgadas, el casco dañado echa humo; variantes "velas arriba / abajo / mástil caído". | **Estados de módulo**: vela rasgada que cae, cañón doblado, núcleo apagado, humo persistente. |
| **Kingdom Rush / Brawl Stars** | Vector limpio, 2–3 tonos planos, contorno de tinta, brillos blancos "pegados". | Paleta de 3 tonos por material + rim light + brillos especulares en trazos blancos. |
| **Captain Yo-Ho (referencia del usuario)** | Casco abombado, molduras doradas, portillas, ancla, velas enormes con calavera, cañones negros con boca naranja, espuma estilizada. | Es el *target* del skin `pirate`. |
| **Galeón cósmico (referencia del usuario)** | Casco oscuro, neones magenta/cian/naranja, velas rojas rasgadas, muchos cañones. | Skin `cosmic` (Nave Celestial, late game). |

### 2.1 Alternativas evaluadas para "no se ve la rejilla"

1. **Máscara de daño en RenderTexture sobre un sprite único** (Worms puro). Muy bonito para agujeros redondos, pero los trozos que salen volando no existen como objetos, y hay que sincronizar máscara y rejilla a mano.
2. **Sprite completo + máscara stencil con la unión de celdas vivas.** Barato, pero la máscara stencil no tiene antialias fuera del MSAA, y los escombros siguen sin ser trozos de la ilustración.
3. **Voronoi libre sobre la ilustración.** Bonito, pero un trozo cubre media celda de una y media de otra: no hay correspondencia 1:1 con la simulación.
4. **Rejilla deformada (elegida).** Cada esquina de la rejilla recibe un *jitter* determinista y cada arista 5 puntos intermedios en diente de sierra; **los vértices se comparten entre vecinos**, así que intactos encajan perfecto (cero costuras) y al romperse dejan un borde dentado. Cada celda es un `MeshSimple` con UV hacia la textura del barco. Correspondencia 1:1 con la simulación, escombros gratis y barato de dibujar (≈ 25 vértices por pieza, se agrupan en lotes).

## 3. Técnica elegida (implementada)

### 3.1 Pintar el barco una vez como ilustración continua

`paint.ts` dibuja todo con **Canvas2D** (no con `Graphics` de Pixi) porque Canvas ofrece recortes (`clip`), composición `source-atop`/`destination-out`, patrones, gradientes y `shadowBlur` para neones: lo que hace falta para un cel-shading de verdad. Resultado: un canvas a 2× que se convierte en una `Texture` (`CanvasSource`).

- **Silueta curva desde el plano.** Se traza el contorno rectilíneo de las celdas "casco" (`layout.ts`), se redondea con recortes de esquina a distancia fija (26 → 13 → 7 → 3 px; no Chaikin, que redondea en proporción a la longitud del lado) y se **rastrilla** la roda hacia proa (+15 px) y el espejo hacia popa (−7 px) por encima de la línea de flotación. Los castillos de popa y proa se unen al combés con una curva de arrufo natural.
- **Cel-shading por "bandas de borde".** `rim(forma, dx, dy)` = forma − forma desplazada. Con eso salen bandas que siguen cualquier contorno: sombra en los bordes inferiores y de popa, rim light bajo la borda y en la proa, moldura dorada (borda) de 13 px con su línea de tinta. Como el pantoque queda bajo el mar, además se pinta un **terminador curvo** sobre la línea de flotación con una franja de **halftone** (puntos Ben-Day, coherente con `10-direccion-de-arte.md`) y un destello de reflejo del agua.
- **Tablones curvos.** Las tablas interpolan entre el perfil superior y el inferior suavizados, así convergen hacia proa y popa como un casco real; juntas escalonadas y vetas.
- **Contorno de tinta de peso variable**: 5.5 px más un segundo trazo desplazado abajo-atrás (más grueso en el lado de sombra).
- **Detalles colocados automáticamente** donde hay casco libre de módulos: portillas con brillo anime, ancla dorada con cadena (con óxido en `rat`/`pirate`, borde neón en `cosmic`), salvavidas, voluta en la proa, barandilla de balaustres sobre la cubierta, parches y chorreones de mugre (`rat`), placas remachadas para celdas de hierro, gemas para cristal, costillas para hueso.
- **Módulos con arte propio**: camarote de gato = cabina con techo, faroles y puerta en arco con luz cálida (en cubierta) o nicho con arco dorado (empotrado); núcleo = ventana circular con pernos y orbe brillante; polvorín = barriles con "TNT"; cañón = cureña con ruedas + caño negro; escudo = cúpula generadora; motor = caldera con boca de fuego, manómetro y chimenea; arcano = ventana de runas.

Una segunda textura, el **interior** (madera oscura con costillas, baos y sombra), se pinta con la misma silueta y solo se ve por los agujeros.

### 3.2 Partir la textura en piezas que coinciden con la simulación

`Lattice` en `layout.ts`:
- Esquina `(i,j)` → jitter determinista ±4.5 px (si es interior).
- Arista → 5 puntos con diente de sierra alterno ±4 px, atenuado cerca de las esquinas.
- Aristas **expuestas** (celda llena junto a vacía) se empujan **20 px hacia afuera**, así la pieza cubre el contorno de tinta, la barandilla y la roda rastrillada.
- Triangulación con `earcut` (robusta aunque el diente de sierra haga el polígono no estrellado).

Intacto: no hay ni una línea de rejilla. Roto: el vecino conserva el borde dentado exacto; sobre él se dibuja **tinta + astillas claras** solo en los tramos donde la ilustración es opaca (se muestrea un `alphaMask` a 1×), para que no aparezcan líneas en el aire junto a un mástil.

### 3.3 Daño, estados y módulos

- **Daño parcial** (`refreshCell`): umbrales 18 / 45 / 72 % → grieta entintada con brillo de astilla, luego hollín y abolladuras, luego un agujero con interior y astillas. Se pinta **dentro de la textura** con `source-atop` recortado al polígono de la celda (solo sobre píxeles pintados), se marca sucia y se re-sube **una vez por frame**. Un golpe dispara un *hit flash* (malla blanca con la silueta horneada) y un temblor elástico de la pieza.
- **Estados por celda** (`statusFx.ts`), animados a 12 fps: `burning` (flipbook de 3 lenguas de fuego + brasas + humo negro + quemadura permanente), `wet` (gotas que resbalan + brillo), `frozen` (costra de hielo facetada, carámbanos, destello), `charged` (rayos en zigzag con tinta), `rooted` (enredaderas con hojas), `cursed` (runas violetas que suben), `voided` (glitch), `steam` (vapor). Además la malla de la pieza se **tiñe** (multiplicación) para que el color se lea a distancia.
- **Módulos rotos** (`updateModuleDecor`): velas que pasan a la versión rasgada y caen con rebote, un jirón que revolotea hasta el agua, bandera que cuelga; cañón doblado y sin brillo; orbe del núcleo agrietado y apagado con chispas; quemadura en el área del módulo y **humo persistente**.

### 3.4 Escombros que son la ilustración

- `knockOff`: la pieza se divide en 1–3 fragmentos de abanico (cada uno un `MeshSimple` con las mismas UV) con los cortes entintados; salen con velocidad radial + impulso, giran y caen. Si la pieza es de madera, **flota** unos segundos en la superficie y luego se hunde; el hierro se hunde enseguida. Astillas y polvo en dientes de sierra (stepped, 12 fps). El decor anclado a esa celda (vela, caño, orbe) se va con el trozo.
- `sinkChunk`: el grupo desprendido es un solo contenedor rígido con sus piezas, su decor y la tinta en la línea de rotura: salta, gira hacia afuera, salpica (callback `onSplash`) y se hunde oscureciéndose.
- La simulación de escombros (`debris.ts`) corre en `gsap.ticker` multiplicada por `gsap.globalTimeline.timeScale()`, así **el hitstop también congela los escombros**.

### 3.5 Animación viva (Spider-Verse × anime)

- **Velas y bandera en flipbook pintado**: 16 cuadros de velas y 8 de bandera, reproducidos "en 2s" (12 fps escalonado).
- **Balanceo** senoidal + **resortes** de giro, empuje, hundimiento y squash: `hitReact()` escora el casco alejándolo del impacto y lo devuelve con rebote; las piezas cercanas tiemblan. Con `autoReact` (por defecto) cada golpe a una celda ya mueve el casco.
- **Escora y hundimiento por daño**: el casco se inclina hacia el lado más dañado (máx. ±0.05 rad) y baja hasta 14 px.
- **Espuma** en la línea de flotación (burbujas entintadas, ola de proa, estela), brillo pulsante en bocas de cañón, núcleo, faroles y runas; humo de caricatura en dientes de sierra.

## 4. Rendimiento medido

En el lab con 3 barcos (296 piezas) y gatos:
- Render de la escena completa: **≈ 0.7 ms** de CPU (las piezas son mallas de < 100 vértices: Pixi las agrupa en lotes).
- `bob()` de 3 barcos: despreciable.
- Frame con repintado de daño + re-subida de textura: **≈ 1.8 ms**.
- Peor caso, 120 celdas ardiendo con paso de animación en cada frame: **≈ 4.4 ms** (en juego el paso ocurre a 12 fps). Los fuegos son sprites de un flipbook horneado.
- Memoria: 3 canvas por barco (arte 2×, interior 2×, silueta 1×); unos 20–25 MB por barco de 18×11.

## 5. Por qué esta técnica

1. **1:1 con la simulación**: cada pieza visual es exactamente una celda; `sim.ts` no cambia y la IA sigue simulando gratis.
2. **No se ve la rejilla**: vértices compartidos + jitter → cero costuras intacto, bordes dentados al romper.
3. **Los escombros son la ilustración** sin trabajo extra: misma textura, mismas UV.
4. **Daño orgánico** estilo Worms (pintado en la textura), sin perder el control de la rejilla.
5. **Skins paramétricas**: todo color sale de `ShipStyle`; añadir un estilo es añadir una entrada en `STYLES`.
6. **Barato**: se hornea una vez; por frame solo se mueven contenedores y se cambian texturas de flipbook.

## 6. Siguientes pasos sugeridos

- Integrar en `BattleScene` (ver la respuesta final): `new AnimeShipView(model, flip, style)`, llamar a `hitReact` en eventos `impact` y a `fireCannon()` al disparar.
- Skins extra (hueso/espectral, hielo, jungla) y planos con más curva por tipo de barco.
- Impact frame B/N de 2 cuadros sobre el barco en críticos (`InkFilter` ya existe).
- Cadena de explosiones al hundirse el barco enemigo (storyboard `07-animaciones-dopamina.md` §5e) usando `sinkChunk` por mitades.

## Fuentes

- [Real Time Mesh Fracturing Using 2D Voronoi Diagrams (DiVA)](https://www.diva-portal.org/smash/get/diva2:1452512/FULLTEXT02)
- [Real-time fracturing in video games (Springer)](https://link.springer.com/article/10.1007/s11042-022-13049-x)
- [Unity Sprite Voronoi Fracturer 2D (GitHub)](https://github.com/al-9k/Unity-Sprite-Voronoi-Fracturer-2D)
- [Destructible 2D — documentación](https://carloswilkes.com/Documentation/Destructible2D)
- [How To: Worms' destructible terrain (GameDev.net)](https://gamedev.net/forums/topic/523821-how-to-worms-destructible-terrain/4397765)
- [Worms-like destructible terrain (GameDev.net)](https://gamedev.net/forums/topic/313522-worms-like-destructible-terrain/)
- [PixiJS v8 — Mesh / MeshSimple](https://pixijs.com/8.x/guides/components/scene-objects/mesh)
- [Cuphead Wiki — The Ship / Captain Brineybeard](https://cuphead.fandom.com/wiki/The_Ship)
- [Sid Meier's Pirates! — Naval Combat](https://sidmeierspirates.fandom.com/wiki/Naval_Combat)
- [Sea of Thieves — ship rendering with masts down](https://www.seaofthieves.com/community/forums/topic/93651/ship-rendering-with-masts-down/3)
- [Cel Shading: a comprehensive guide (GarageFarm)](https://garagefarm.net/blog/cel-shading-a-comprehensive-guide)
- [Cartoon character shading (Blender Studio)](https://studio.blender.org/blog/cartoon-character-shading-with-geometry-nodes/)
- Internas: `03-castle-busters.md` §8, `07-animaciones-dopamina.md` §3 y §5c/§5e, `10-direccion-de-arte.md`.
