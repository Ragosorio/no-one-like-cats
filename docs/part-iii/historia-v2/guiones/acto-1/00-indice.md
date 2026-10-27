# Guiones del Acto I «La noche que no se reinicia» · índice y convenciones

> ⚠️ **SPOILERS de la Parte III.**
> Agente NARRATIVA · ronda 4 · 2026-10-26. Para el agente de producción de películas (CINE) y para quien implemente las escenas.
> Historia: `../../01-biblia-v2.md`. Mapa: `../../02-mapa.md` §3. Fichas de las películas: `../../03-peliculas.md` (F01–F08).
> **Revisión:** aplicadas las pasadas 0, 1, 2 y **3** de TEMPERATURA (`../../../temperatura/05-revision-narrativa.md`; la 3, plano por plano, en su §3.4). La pasada 3 manda: **ninguna pista visible sobre la mortalidad de Luzterna** y **la regla solo en H67** (no se repite en ningún guion).

## 1. Qué hay aquí

| Archivo | Misión | Películas | Batalla de historia |
|---|---|---|---|
| `h69-pp-oficial-dona.md` | H69 (construida) | F01 PP «Oficial Dona» (**opcional**) | B-5 élite (construida) |
| `h70-borron.md` | H70 «Borrón» | Escena en la Donería + actividad de donas + **F02 PH «El precio de bajar»** | — |
| `h71-ninguna-caja.md` | H71 «NINGUNA CAJA ES HOGAR» | **F03 PP** + escena de cierre | Brecha |
| `h72-la-resaca.md` | H72 «La resaca» ♥ | **F04 PH «La mañana en blanco y negro»** (prólogo + 4 viñetas + epílogo) | — |
| `h73-batalla-de-gatos.md` | H73 «La Batalla de Gatos» | Escena de entrada + **F05 PP** + **F06 PC EM%EN «Cuadra 8»** (completa) + cierre en calma | EMIAU y su pandilla |
| `h74-el-cadenero-y-oh-shit.md` | H74 «El Cadenero» | **F07 PP** + escena del aviso + **F08 PC OH SHIT «Caída por el multiverso»** (fragmento) | El Cadenero (B-9) |

## 2. Lo que el jugador ya trae al empezar el Acto I

- Canelo se fue a olvidar a La Última Ronda y **allá habla** (H66).
- Luzterna lo fue a buscar: «Te voy a buscar. Es mi trabajo. Y a mí ya no me puede pasar nada, gordo: ya me pasó todo» (H67).
- REGISTRO 000 despertó y siguió a Canelo; la gatera del faro quedó rasgada; cayó una dona en la palmera (H67).
- La Carta de las Cajas existe y la dibuja ella; Maneki cobra las llaves (H68).
- En la Borracha **la mañana no reinició**; hay huellas que no son de gato normal; Oficial Dona cayó (H69).
- En el mapa: «SE BUSCA: CANELO · DEBE 14 RONDAS».

## 3. Convenciones de los guiones

### 3.1 Columnas de las tablas de planos

| Columna | Qué lleva |
|---|---|
| **#** | Id del plano (`A1`, `F02-3`…) |
| **Tiempo / compás** | Segundos desde el inicio de la película o compás de la canción (`c17`, `c24,5`) |
| **Plano y cámara** | Encuadre (gran plano general, general, medio, primer plano, detalle, contrapicado…) y movimiento (fijo, dolly, grúa, paneo, mano, cambio de foco, *crash zoom*) |
| **Acción y actuación** | Lo que pasa y cómo actúa cada personaje (poses, squash & stretch, *smears*) |
| **Estilo, luz y clima** | El estilo de la película, la luz, el clima |
| **Sonido** | Música (derivada u original), efectos, silencios |
| **Texto** | Diálogo (globos), barras, intertítulos, tarjetas |
| **Ritmo** | La marca de los dos ritmos (§3.2) y la transición |

### 3.2 Los dos ritmos (`../../../13-pulido-arranque.md` §2.1)

Cada **idea importante** pasa por cuatro tiempos, y se marca así:

- **[P]** presentar: una línea o un título visual.
- **[M]** mostrar: una acción que lo ilustra.
- **[C]** consecuencia: una reacción legible (la cara de alguien), de medio compás o más.
- **[A]** avanzar.

Dentro de cada idea, la animación va rápida: cortes, exageración, cambios de estilo. Una **ráfaga** se marca **[R]** y siempre va entre dos planos legibles. **No se encadenan dos ideas importantes sin [C] en medio.**

### 3.3 Reglas de escritura

- **Canelo habla** en todas las escenas del Acto I: es la Borracha, una caja de caricatura donde los animales hablan. En las viñetas de cine mudo habla por intertítulo.
- **Globos de 1–6 palabras dentro de las canciones**; fuera, máximo 4 líneas seguidas sin acción.
- **Canelo se puede renombrar** (`personalize()`): el guion escribe «Canelo»; los demás le dicen «gordo», que no depende del nombre. «Capi» se personaliza como siempre.
- **Groserías** con su versión suave, marcada **[SOFT: …]**. El Acto I casi no tiene.
- **Luzterna siempre flota** (`../../01-biblia-v2.md` §4.2): la linterna se mece, la falda de luz no toca nada, **y todo lo carga con el haz de la linterna**. Si algo la atraviesa, es un gag de fantasma del que **ni ella ni nadie hace comentario**; nunca se usa para probar que «no le pasa nada». **No teje a la vista** (el único hilo es el de H67, canon).
- **La llama de la cola de Canelo** es un objeto de actuación: se marca su tamaño cuando cambia (normal / chica / mínima).
- **Siluetas** con la regla de `../../../13-pulido-arranque.md` §2.2: del arte real, con borde de luz, ojos y accesorio encendido; nunca negro puro; con preparación, desarrollo y salida.
- **Pantalla del Acto I:** **4:3 de televisor** con esquinas redondas, curvatura leve y líneas de barrido (`../../01-biblia-v2.md` §7). Las películas de la Borracha son «programas».

### 3.4 Hablantes nuevos para registrar en `ui/story/text.ts`

**BORRÓN**, **HOMIAU**, **EMIAU**, **EL CADENERO** y **PÚBLICO** (coro, sin retrato). **BRECHA** y **GRAFITERA** ya existen (Parte II). **DOÑA ESPUMA**, **HIPÓLITO** y **OFICIAL DONA** ya existen (porción).

### 3.5 Beats que persisten (para recargar sin perder el lugar)

| Misión | Beats |
|---|---|
| H70 | `b70_doneria` · `b70_donas` (elección guardada) · `b70_sombras` (F02 vista) · `b70_ficha` |
| H71 | `b71_pp` · `b71_batalla` · `b71_cierre` |
| H72 | `b72_prologo` · `b72_doneria` · `b72_hipomart` · `b72_parque` · `b72_bar` · `b72_epilogo` |
| H73 | `b73_entrada` · `b73_flyer` · `b73_fase1` · `b73_emen` · `b73_despues` |
| H74 | `b74_pp` · `b74_cadenero` · `b74_aviso` · `b74_ohshit` |

**Regla:** una película de canción ya vista no se repite al recargar; se retoma en el beat siguiente. Una PP vista se puede saltar.

### 3.6 Accesibilidad (vale para todo el acto)

- **Reducir movimiento:** sin sacudidas ni giros; los *crash zoom* pasan a corte; el vidrio que se rompe en F08 pasa a fundido.
- **Reducir destellos:** máximo 3 por segundo; la torreta de F01 y los relámpagos de F08 se suavizan.
- Los textos van sobre zona calmada y con contorno.

## 4. Mapa del acto en temperatura (lo que tiene que sentir el jugador)

| Misión | Pico de energía | Valle | Lo que se lleva |
|---|---|---|---|
| H70 | F02 (sombras con hipo) | La Donería, conversación | Los Titiriteros son gatos tristes que olvidan; Homiau y Borrón, amigos de dona |
| H71 | La pelea de bar | El cierre: el grafiti y Grafitera que duda | Los Disruptores quieren a «La Llave»; Grafitera duda |
| H72 ♥ | Las viñetas de *slapstick* | El parque y la bufanda en el suelo | Ternura, risa; el pan dulce que ella huele |
| H73 | **EM%EN** | El plano quieto del final | Canelo se hizo cargo; ella lo iluminó |
| H74 | La batalla del Cadenero → **OH SHIT** | El aviso de Borrón en silencio | Alguien viene siguiendo una luz; las cajas son multiversos |

## Preguntas para TEMPERATURA

1. En H70, ¿la elección de dona (3 opciones) suma apego a Luzterna o solo es un chiste de Borrón? Le puse que ella elija una de las tres (§ de `h70-borron.md`) para que haya dúo.
2. En H72, ¿la viñeta del pan dulce (Canelo se lo ofrece, ella lo huele) es demasiado tierna para un Acto I que debería ser de Canelo? Es su única «I» del acto.

## Necesidades para ARTE / MÚSICA / CINE / MECÁNICAS

- **ARTE:** Borrón, Homiau, EMIAU, El Cadenero, la pandilla de EMIAU (2–3 gatos de La Cuadra 8), vecinos de la Borracha para el público (pueden ser especies existentes con lente toon), Brecha y Grafitera en caricatura.
- **CINE:** teatro de sombras de manos (F02), esténcil (F03), cine mudo (F04), *flyer* (F05), VHS de cámara (F06), cartel de lucha libre (F07), collage multiverso (F08), intro policiaca de los 70 (F01).
- **MÚSICA:** `drunck.barra`, `drunck.resaca`, `drunck.battle` (ya existen); `emen.beat` (nuevo, derivado); `fut.jefe` (existe). Cortes de OH SHIT.
- **MECÁNICAS:** reglas «sillas voladoras» (H71), «Rima» (H73), «Lista VIP» (H74). Hipólito se une al final de H73 (antes: con El Cadenero).
