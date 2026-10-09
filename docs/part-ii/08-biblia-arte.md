# 08 · Biblia de Arte: La Era de las Rupturas

**Qué cubre este documento.** Es la dirección de arte de la Parte II, que pasa de 2D a 2.5D.

**Qué no cubre.** La dirección de arte de los gatos de las Grietas sigue en `docs/arte/DIRECCION-ARTE-PARTE-2.md` (es la "Parte 2" del código). Ese documento sigue vigente para pintar gatos.

**Cómo se marcan los estados.** Igual que en 05: [CONFIRMADO] = ya está en el slice, [DECIDIDO] y [PROPUESTO].

## 1. Identidad en una frase

**Gatos pintados viviendo en un diorama de juguete iluminado a mano.** Lo pintado manda: el mundo tiene formas simples y legibles para que los gatos sean lo más detallado de la pantalla.

## 2. Jerarquía de detalle **[DECIDIDO]**

| Prioridad | Qué | Detalle | Técnica |
|---|---|---|---|
| 1 | Gatos | Máximo: pintura MAI completa con contorno | PaperCat (billboard + malla del puppet) |
| 2 | Personajes y props narrativos (faro, Luzterna, REGISTRO 000, barco) | Alto | Low-poly con color plano o pintura |
| 3 | Hábitats | Medio, con mucha animación | Dioramas: shader, partículas y luz local |
| 4 | Terreno, agua, vegetación | Bajo en forma, alto en luz y movimiento | Toon de 3 bandas, viento e instancing |
| 5 | Lejanía | Mínimo | Niebla por hora, impostores y siluetas |

**Regla de legibilidad.** A la distancia normal de cámara (≈ 40 u), cada gato tiene que medir al menos 60 px de alto en 1080p. Por eso en el slice los gatos miden 2.3–3.4 u.

## 3. Formas y siluetas

**Mundo:**
- Volúmenes gordos y redondeados.
- Facetas visibles en rocas y cristales (flat shading). Nada de ruido fotográfico.
- Las palmeras se inclinan y tienen anillos.
- Los edificios son "de juguete": proporciones achatadas, techos grandes y mucho color.

**Gatos:**
- Se conserva la silueta pintada.
- Prohibido deformarlos más allá de lo que permite el rig: la cabeza no se estira y los ojos no se desplazan.

**Personajes no gatunos (facciones):**
- **Titiriteros:** manos y luz, nunca cuerpos completos.
- **Correctores:** simetría perfecta y blanco.
- **Disruptores:** glitch, grafiti y bordes rotos.

## 4. Luz y color **[CONFIRMADO en el slice]**

**Una tabla de keyframes por hora** (`engine/world/sky.ts` `SKY_KEYS`) define todos los colores de la escena: cénit, horizonte, sol, hemisferio, niebla, agua profunda y somera, *grade* de los gatos y nivel de noche.

**Paleta por hora:**

| Hora | Paleta |
|---|---|
| Amanecer (6 h) | Melocotón y lavanda |
| Día | Cielo cobalto y agua turquesa |
| Hora dorada (16–18 h) | Ámbar |
| Anochecer (19.6 h) | Malva y violeta |
| Noche | Azul profundo, **nunca negro** (los gatos se tienen que ver) |

**Reglas de luz para los gatos:**
- El sombreado pintado del gato domina (~70 %).
- La luz del mundo solo lo "asienta": grade, lambert suave y rim del lado del sol.
- De noche, el rim viene de la luna y el color lo ponen las **luces locales**: lava naranja, linterna ámbar, faro crema, cósmico violeta.

**Tormenta:**
- Desatura y oscurece con `overcast`.
- Los rayos son un destello global y breve.
- Con "Reducir movimiento", el destello queda al 25 %.

## 5. Animación

**Principios** (aplicados en el slice):

| Principio | Ejemplo en el slice |
|---|---|
| Anticipación | `crouch` antes de saltar, de perseguir y de lanzar el Colapso |
| Follow-through | La cabeza lidera la inclinación; la cola sigue al cuerpo |
| Peso | Saltitos que aplastan al aterrizar; los Primordiales usan actos "calm" (no se acicalan) |
| Reacción contextual | Un rayo sorprende a todos menos a los de Tormenta; Copito reacciona al vapor de Chispa |
| Ritmo | El puppet deforma a 20 fps en 3D y a 15 en 2D, para que se sienta animado a mano |
| Volteo de carta | Girar es pasar por el canto, como el papel |

**Qué se reutiliza y qué es propio de cada gato:**
- **Reutilizable**, en el PuppetBrain: resortes, parpadeos, orejas, cola, actos y emotes.
- **Identidad por especie:** el rig, el set de actos y las conductas ambientales por elemento (05 §8).
- **Nunca** una animación genérica que borre la personalidad: si dos especies hacen lo mismo, al menos su conducta tiene que ser distinta.

**Acting más rico** **[PROPUESTO]**: agregar al rig regiones de patas delanteras (lift o step) y "boca" (abrir/cerrar). Así se pueden hacer bostezos y maullidos con forma, y caminar con patas, no solo con bob.

## 6. Hábitats: firma por elemento

| Elemento | Firma visual | Estado |
|---|---|---|
| Fuego | Lava con corteza que fluye, venas brillantes, cono humeante, brasas, luz parpadeante | **[CONFIRMADO]** |
| Hielo | Montículo de nieve, cristales con fresnel, iglú, nieve que cae y vapor si viene un gato de Fuego | **[CONFIRMADO]** |
| Cósmico | Domo-universo, planetas en órbita, runas pulsantes, polvo estelar | **[CONFIRMADO]** |
| Agua | Piscina con cascada y burbujas | [PROPUESTO] |
| Naturaleza | Árbol que florece por hora, luciérnagas de noche | [PROPUESTO] |
| Tierra | Terrazas que tiemblan, fósiles | [PROPUESTO] |
| Tormenta | Nube propia sobre el hábitat que llueve aunque esté despejado | [PROPUESTO] |
| Magia | Libros flotantes que se reordenan solos | [PROPUESTO] |
| Vacío | Un hueco en el suelo que no refleja nada | [PROPUESTO] |
| Sonido | Bocinas que vibran a ritmo y notas como partículas | [PROPUESTO] |
| Sombra | Su sombra no coincide con el sol | [PROPUESTO] |
| Tiempo | Relojes de arena; el hábitat va 5 min "atrasado" respecto al cielo | [PROPUESTO] |
| Luz | Vitral que proyecta color sobre los gatos | [PROPUESTO] |
| Cristal | Facetas que refractan el haz del faro | [PROPUESTO] |
| Gravedad | Rocas que orbitan y agua que sube | [PROPUESTO] |

## 6.5 La PÁGINA (vista de la Parte I) **[CONFIRMADO en el slice]**

Es la lente que define la cara "Página" de la isla (05 §2.5).

| Elemento | Cómo se ve |
|---|---|
| Fondo | Papel |
| Mar | Dos azules de carta (`#4b93c4` / `#7fd0de`, los mismos de `island/terrain.ts`) con cuadrícula de diamantes |
| Costa | Línea de tinta y orilla blanca |
| Terreno | Colores planos con cuadrícula iso |
| Gatos | Sin iluminación, ×1.9 de tamaño (estampas) |
| Luz | Siempre de día y neutra |
| Cámara | Iso fija (yaw 45°, FOV 16°, casi ortográfica) |
| Notas al margen | En Permanent Marker, color tinta café, rotadas a mano |

**Transición pop-up:**
- Ola desde el centro, con rebote de papel (`easeOutBack`), en 1.8 s.
- Con "reducir movimiento": 0.6 s y sin rebote.

## 7. Estilos regionales (lentes) **[DECIDIDO]**

Cada región aplica una **lente**: postproceso y/o material, más su tabla `SKY_KEYS`. El motor, los gatos y la UI son los mismos.

| Región | Lente |
|---|---|
| Primer Mar e isla | Diorama toon base (el slice) |
| Páginas Hundidas | Grano de papel, bordes entintados y niebla sepia |
| Nácar | Refracción, cáusticas y bloom suave |
| Corona Celeste | Ilustración luminosa y clara (concepto 9), contornos limpios |
| Islas Invertidas | Cielo abajo y océano arriba: se invierte la tabla de luz |
| Puerto Cometa | Retrofuturo: scanlines suaves, neón y pintura metálica |
| Sueños | Acuarela (concepto 15): bordes sangrados y paleta pastel |
| Isla que Nadie Recuerda | Desaturación selectiva: solo tus gatos conservan color |
| Viñetaria (bolsillo) | Halftone, contorno grueso y onomatopeyas |

**Prueba de coherencia.** Con la lente apagada, todo tiene que verse como el mismo juego.

## 8. Producción de arte

**Gatos nuevos:**
- Siguen el pipeline actual: Codex en `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/`, con `coat_en` obligatorio (el generador tiende a pintar tabbies cafés), luego vectorizado MAI (full y lite) y rig.
- **Cero raster en el repo** (es una regla del proyecto y la valida el deploy).

**Ecos baratos:** usar lentes de material de PaperCat en vez de pintura nueva:
- `ghost` (estática) ya existe;
- faltan cristal, oro, tinta, acuarela y holograma.

**Evoluciones:** pintura nueva completa más su rig. Son 20–30 en total; es un presupuesto realista.

**Props y regiones:** geometría generada en código y shaders. Se evitan los modelos importados mientras el estilo no lo exija. Si hacen falta (los barcos astrales complejos), se usa glTF con Draco y se mide su peso.

**Conceptos:**
- 04 lista qué conceptos se usan como dirección y cuáles son solo referencia por riesgo de propiedad intelectual (1, 3, 9, 14 y 19).
- **Faltan conceptos:** gravedad invertida real, interior de Nácar, Páginas bajo el agua, Canelo Almirante naranja, tu isla en ruinas y versiones de día.

## 9. Interfaz

- Se conservan las fuentes del juego: Bangers para títulos y gritos, y Space Grotesk para texto.
- Rosa `#FF3D8B` y oro `#FFD23F` como acentos.
- Paneles oscuros translúcidos sobre el 3D y toasts de papel con sombra rosa (estilo del slice).
- Los números de daño usan Bangers con contorno de tinta. El grande es oro.
