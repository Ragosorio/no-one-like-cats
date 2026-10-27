# Guiones del Acto II «Se rompen las cajas» · índice y convenciones

> ⚠️ **SPOILERS de la Parte III.**
> Agente NARRATIVA · ronda 4 · 2026-10-26. Para el agente de producción de películas (CINE) y para quien implemente las escenas.
> Historia: `../../01-biblia-v2.md`. Mapa: `../../02-mapa.md` §4. Fichas de las películas: `../../03-peliculas.md` (F09–F17). Convenciones base: `../acto-1/00-indice.md` §3 (columnas, marcas [P]/[M]/[C]/[A]/[R], reglas de escritura).
> **Diseño del giro:** TEMPERATURA, pasada 3 (`../../../temperatura/05-revision-narrativa.md` §3) y v3 (`../../../temperatura/04-engano-y-giro.md` §11.5). En este acto **no hay ninguna pista visible sobre la mortalidad de Luzterna** y la regla de H67 **no se repite**.

## 1. Qué hay aquí

| Archivo | Misión | Películas | Batalla de historia |
|---|---|---|---|
| `h75-la-gato-senal.md` | H75 «La Gato-señal» | Escena de llegada + **F09 PP «Ciudad Mayúscula»** + cierre | S-5 élite «La Pandilla del Ovillo» |
| `h76-villanos-sueltos.md` | H76 «Villanos sueltos» | **F10 PP «Villanos sueltos»** + rescate + portada | Encuentro «El Estambre» |
| `h77-cruceta.md` | H77 «Cruceta» | **F11 PP «Cruceta»** + la tinta + Murciégato | S-9 jefe «Cruceta» |
| `h78-cerito.md` | H78 «Cerito» ♥ | **F12 PH «Cerito»** (documental con visión nocturna, completo) | — |
| `h79-el-gran-torneo.md` | H79 «El Gran Torneo» | Maneki en la Carta + **F13 PP «El Gran Torneo»** + la llave | A-5 élite «El rival que no te conoce» |
| `h80-entrenamiento.md` | H80 «Entrenamiento» ♥ | **F14 PH «Entrenamiento»** (*yonkoma*, 3 tiras) | — (3 arcos de actividad) |
| `h81-ito.md` | H81 «Itō» | **F15 PP «Itō»** + **F16 PC Daria «Una sola línea»** (c25 → fin, compás por compás) + la ficha | A-9 jefe «Itō» |
| `h82-la-mano.md` | H82 «La Mano» (punto medio) | **F17 PH «La Vocación»** + la huella | — |

## 2. Lo que el jugador ya trae al empezar el Acto II

- Canelo confesó en público («si alguien paga, pago yo») y el barrio lo perdonó (H73).
- Borrón avisó: «Mis jefes vienen siguiendo una luz», y miró la linterna y la llama de Canelo (H74).
- Las cajas son multiversos y se están mezclando; la llama de Canelo bajó con cada pared rota (OH SHIT).
- Aterrizaron en una ciudad de cómic y la linterna, sin querer, proyectó una silueta de gato en las nubes.

## 3. Lo que cambia respecto de las convenciones del Acto I

### 3.1 Pantalla (`../../01-biblia-v2.md` §7)

| Tramo | Formato | Reglas |
|---|---|---|
| **Superhéroes** (H75–H77) | **Página de cómic**: 3 a 6 viñetas a la vez; los bordes son objetos (un villano los rompe, una telaraña los cruza) | Las transiciones son **pasar la página** (el papel se dobla hacia la cámara). Los diálogos van en **globos de cómic**; la narración, en **cajas de texto** de color. Canelo habla en globos |
| **Casa** (H78) | **A sangre**, sin marco (con el visor de cámara del documental encima) | Canelo **no habla**: maúlla |
| **Anime** (H79–H81) | **16:9 de anime de tele** con *eyecatch* (cortinilla de mitad de episodio) | Cada misión termina con la tarjeta «CONTINUARÁ EN EL PRÓXIMO EPISODIO». Canelo habla normal |
| **H82** | El 16:9 **se escurre a óleo** dentro de un marco dorado | Una sola composición por plano, como cuadro |

**En la columna «Plano y cámara»**, en las escenas de cómic se indica la viñeta: `V1/4` = viñeta 1 de una página de 4.

### 3.2 Reglas del giro en este acto (TEMPERATURA v3)

- **Luzterna:** ninguna repetición de la regla, ninguna prueba de que «no le pasa nada», ningún cambio en su cuerpo, nada que la atraviese para probarlo, nada tejido a la vista, nadie que «sepa» y avise. Todo lo carga con el haz de la linterna.
- **Canelo:** solo señales serias: la llama que baja al cruzar una rasgadura, Maneki (H79), Esquirla que lo ataca por la espalda (H81), La Mano que lo mira (H82). Nada de contador de vidas.
- **Cada PP del Acto II** lleva **una acción muda de Luzterna** y **una señal visible de Canelo** (TEMPERATURA `03` §5). LO QUE ARRIESGAMOS va con su letra y **nunca la nombra**.

### 3.3 Hablantes nuevos para registrar en `ui/story/text.ts`

**MURCIÉGATO**, **GATO ARAÑA**, **CRUCETA**, **EL ESTAMBRE**, **VOCEADOR** (el niño que vende *El Clarín Viñeta*), **SUPER SIAMÉS**, **EL RIVAL** (el que no te conoce), **ITŌ**, **ESQUIRLA**, **LA MANO**. **MANEKI** y **BRECHA** ya existen (Parte II).

### 3.4 Beats que persisten

| Misión | Beats |
|---|---|
| H75 | `b75_llegada` · `b75_pp` · `b75_ovillo` · `b75_cierre` |
| H76 | `b76_pp` · `b76_estambre` · `b76_arana` · `b76_portada` |
| H77 | `b77_pp` · `b77_cruceta` · `b77_tinta` · `b77_murciegato` |
| H78 | `b78_doc` · `b78_cobija` (elección guardada: `faro` / `palmera`) |
| H79 | `b79_maneki` · `b79_pp` · `b79_rival` · `b79_llave` |
| H80 | `b80_tira1` · `b80_tira2` · `b80_tira3` (una por arco) |
| H81 | `b81_pp` · `b81_fase1` · `b81_daria` · `b81_ficha` |
| H82 | `b82_vocacion` · `b82_huella` |

**Regla:** una película de canción vista no se repite al recargar. Una PP vista se puede saltar.

### 3.5 Accesibilidad

- **Reducir movimiento:** las páginas de cómic se cambian con fundido (no se doblan); las líneas de velocidad del anime quedan quietas; los cortes de hilo de F16 pasan como fundidos; la cámara del documental no tiembla.
- **Reducir destellos:** los flashes de impacto del cómic y del anime, máximo 3 por segundo.
- Globos, cajas de texto y subtítulos siempre sobre zona calmada y con contorno.

## 4. Mapa del acto en temperatura

| Misión | Pico | Valle | Lo que se lleva el jugador |
|---|---|---|---|
| H75 | La pelea con la Pandilla, las onomatopeyas sólidas | La azotea con la Gato-señal | Llegamos a otro universo; la luz de ella «llama» |
| H76 | El rescate con Gato Araña | La portada con nuestra cara | Romper una caja suelta lo peor; la ciudad nos culpa |
| H77 | Cruceta salvando al gatito a media pelea | Murciégato en la cornisa | Los Titiriteros sangran tinta; «los gatos sí vemos» |
| H78 ♥ | — | Todo: silencio, ternura | Cerito tiene nombre; a Canelo le cuesta no dormir |
| H79 | El avance del torneo | Maneki en la Carta | «Esto se cobra de la vida de verdad» |
| H80 ♥ | Las tiras más chistosas del acto | — | Risa y compañía |
| H81 | **Daria** | La ficha de Itō que se borra | Esquirla fue por Canelo; los Titiriteros olvidan |
| H82 | La mano en el rayo | 3 s de silencio después | La Mano quiere a Cerito y mira a Canelo |

## Preguntas para TEMPERATURA

1. En H77, **Cruceta sangra tinta y no sabía que podía**. Es sobre los Titiriteros (encarnar los vuelve mortales), y no hay plano de reacción de Luzterna. ¿Lo cuentas como pista de ella o como regla del mundo?
2. En H81, Itō olvida **el nombre de Cruceta** (su balón de texto se borra a media palabra). ¿Funciona como «perder cuesta para siempre» sin parecer chiste?

## Necesidades para ARTE / MÚSICA / CINE / MECÁNICAS

- **ARTE:** Murciégato, Gato Araña (disfraz casero), Cruceta, El Estambre, La Pandilla del Ovillo (3 gatos), el voceador, Super Siamés, El rival que no te conoce, Itō, Esquirla, La Mano; Canelo y Luzterna en cómic (puntos de impresión) y en cel de anime.
- **CINE:** página de cómic con bordes que son objetos; cómic moderno «arácnido» (F09) y de Edad de Plata (F11); periódico que gira (F10); documental con visión nocturna (F12); avance de anime (F13); *yonkoma* (F14); rollo de ukiyo-e (F15); hilo continuo (F16); Caravaggio con *La creación de Adán* (F17).
- **MÚSICA:** `fut.vineta` (por componer) para H75–H77; «Pad de la noche» (xti) para F12; «Calle fría» (Daria c9–17) para F13–F15; Daria original c25 → fin para F16; pieza propia de órgano y cuerdas para F17.
- **MECÁNICAS:** regla de dimensión «Onomatopeya» (H75–H77) y «Poder» (H79–H81); «Rescate» de Cruceta; «Duelo limpio» de Itō; la presentación de la rareza Multidimensional en H77 (glosario); la elección de la cobija en H78 (vuelve en la vigilia).
