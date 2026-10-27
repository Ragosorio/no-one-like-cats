# 13 · Pulido del arranque: entrada → bar → Drunck → revelación → Luzterna (ronda 3)

> Encargo del dueño (2026-10-14), después de jugar la porción. Este documento manda en la pasada de pulido. Va antes de ampliar la historia.
> No se publica ni se hace push. No se mete ningún ráster al repositorio: las capturas viven fuera, en el scratchpad.

## 0. Qué aprobó el dueño (se conserva)

- **Los 3 gatos** (Hipólito, Doña Espuma y Oficial Dona). Su dirección visual queda aprobada; no se tocan sus diseños.
- **El oyente oculto** y su revelación al final (la regla del oyente sigue igual).
- **El humor y el remate** («Lleva así desde la parte del pato»). Se entiende que buscamos a Canelo.
- **El cariño de la escena de Luzterna.** Se conservan el vínculo y las interacciones que lo construyen: la correa de bufanda, los tramos, «Te voy a buscar», «Es horrible / Por eso es mía», el hilo que se guarda, «Una noche. Ojalá.».

**Aprobar a los gatos y el remate no significa que las animaciones estén terminadas.** Lo que funciona se conserva y se ejecuta mejor.

## 1. Diagnóstico (capturas «antes»: `<scratch>/antes/`)

| Pieza | Qué se ve hoy | Qué falla |
|---|---|---|
| Entrada | El IR de H66 apuntaba con la flecha a la **lámpara del faro**, pero solo respondía la hoja. Además había 3 cosas tocables pegadas: el faro, la hoja y la gatera. | El dueño tocó el faro y no pasó nada. **Arreglado** (§3.1). |
| Escena A | 8 planos casi iguales: Canelo de perfil y quieto (solo cambia de emote) y el diálogo. Nada muestra que cruzamos a otra caja. | Faltan acción y actuación. Nadie explica la gatera. |
| Momento Drunck | 30 escenas en 70 s (en las secciones B y C, una por compás). Fondos planos y vacíos: la cerveza de c2–c8 es un rectángulo café con una balsa diminuta. Personajes chicos, pegados como recortes, sin actuación. | No da tiempo de entender. La conexión central (la hoja → todos esperan → se fue) llega tarde y corriendo. La psicodelia es «cambio de fondo», no transformación. |
| Escena B | 18 planos de cabeza parlante. Monólogos largos sobre planos fijos (B5–B12). | Canelo cuenta lo importante (los tres bandos, el Capi, la ley del gato dormido, la goma, la linterna), pero **nada se muestra**. |
| Revelación | Funciona (aprobada). La caída de Hipólito es un deslizamiento simple. | Solo pulir la ejecución de la caída y los planos de reacción. |
| Calle / Luzterna | Luzterna pequeña, magenta y en la misma pose todo el rato. Los 4 tramos se ven idénticos. **En V1 y V5, Canelo y Luzterna se cambian por siluetas genéricas dibujadas en código** (`catBack`/`ghostBack` en CajaScene). | Pierden forma, ojos, bufanda y linterna. Esto es lo que el dueño vio «poco elaborado» en las sombras de Luzterna. |

## 2. Reglas de esta pasada

### 2.1 Dos ritmos: lento para entender, rápido para sentir

- **Narración (ritmo lento).** Cada IDEA importante sigue 4 tiempos: **presentar** (una línea o un título visual) → **mostrar** (una acción que lo ilustra) → **consecuencia** (una reacción legible: la cara de Canelo, Espuma o el oyente; medio compás o más) → **avanzar**. No se encadenan dos ideas importantes sin consecuencia en medio.
- **Animación (ritmo rápido).** Dentro de cada idea: cortes rápidos, exageración (squash & stretch, smears, crash zooms), cambios de estilo y transformaciones. Una **ráfaga** (montaje rápido de recuerdos) está permitida cuando lo que cuenta es «sentir». Siempre va entre dos planos legibles.
- **No** se resuelve solo con más diálogo ni dejando imágenes quietas más tiempo. Si hace falta explicar más, la explicación es una **acción** o una **transición** que muestra lo que Canelo dice. Una línea nueva solo entra si una acción la acompaña.

### 2.2 Sombras y siluetas (regla única para todo el arranque)

1. **Nunca se reemplaza a un personaje por una figura genérica.** La silueta sale del arte real: el alfa del puppet o del sprite. Así conserva el contorno exacto, la pose y la actuación (el puppet sigue animando).
2. **Capas** de una silueta bien hecha:
   - cuerpo oscuro, del color de línea de la escena y nunca negro puro;
   - **luz de borde** del lado de la fuente (2–5 px, color de la fuente);
   - **ojos** que se conservan o brillan cuando mira a cámara (posiciones del rig: `catRigs` `eyes`);
   - **accesorio clave en color o encendido**: la bufanda de Canelo, la linterna de Luzterna con su luz azul, la llama de la cola;
   - **separación del fondo**: halo suave detrás o fondo más claro.
3. **Toda transformación tiene preparación, desarrollo y salida.** Ejemplo:
   - preparación: la luz cambia de lado y el color se escurre de los pies hacia arriba en 0,3–0,6 s;
   - desarrollo: la silueta con su borde;
   - salida: el color vuelve como una ola, o la silueta se disuelve en algo que cuenta.
   - Nunca un corte seco de color a mancha.
4. **Si el tratamiento no cuenta nada o sigue viéndose mal, se reemplaza.** Por ejemplo, el plano de espaldas de V1 se puede rodar desde el lado de la gatera, con las caras iluminadas por su luz.
5. El módulo compartido es `src/momentos/songs/drunck/silueta.ts` (dueño: LUZ). El Momento lo importa.

### 2.3 Psicodelia con dirección

Recursos posibles (no es una lista obligatoria; cada momento elige los que lo cuentan):
- **perspectiva que se dobla**: el vidrio del tarro curva el bar, los postes se inclinan, la calle ondula;
- **objetos que se vuelven escenarios** (el recurso base del Momento, ver §3.3);
- **cambios de escala**: una balsa diminuta en un tarro gigante, Luzterna enorme al regañar;
- **reflejos imposibles**: sin espejos antes de la revelación (regla del oyente); sí en charcos, el vidrio del tarro o la tele;
- **estilos de jefes que invaden el espacio**: la tinta sumi-e se derrama por la barra, la corrección blanca blanquea los objetos, el grafiti gotea por la puerta del baño, los hilos de luz bajan de las lámparas.

**Alternancia:** después de cada explosión visual viene un plano legible. Los efectos nunca tapan el chiste, la cara de Luzterna ni la información de la historia (los textos y globos van por encima de los efectos y sobre fondo calmado).

### 2.4 Música

- **Drunck se queda intacta**: ni se acelera, ni se corta, ni se repite.
- Si una explicación no cabe dentro de los 70 s, se pasa a las escenas A y B, con pausas, reacciones y acciones.
- En A y B puede sonar muy bajo una variación derivada (`drunck.barra`, `drunck.resaca`). La revelación sigue en silencio con lluvia. Los originales solo suenan en el Momento.

### 2.5 Técnica

- 60 fps (medido con `pp/run.mjs` + `analyze.mjs` para el Momento). Las escenas se construyen antes del reloj.
- «Reducir movimiento» se respeta: fundidos en lugar de sacudidas o giros.
- La regla del oyente no se rompe: antes de `reveal()`, nada a la derecha de `BAR.hideX`.
- El guardado no se toca. Los beats que persisten (`b66_bar#a/#b`, `b67_salida#a`) no cambian de nombre.

## 3. Plan por pieza

### 3.1 Entrada (HECHO, coordinador)

- Tocar el **faro** durante H66 lleva al mismo recorrido (`onFaroTap → enterH66`), y no aparece su frase encima.
- La **gatera** también lleva al mismo recorrido mientras H66 espera (`cajasFlow.setGateraTap`).
- **La hoja llama**:
  - un anillo naranja que respira;
  - un pelo de Canelo parado sobre la marca fría;
  - el rótulo **«LA PÁGINA»** con flechita;
  - su zona de toque crece para cubrir el anillo y el rótulo (`FaroPage.setCalling`).
  - Al empezar el vuelo del pelo, todo eso se apaga.
- El **IR** de H66 apunta a la hoja, ya no a la lámpara.
- El objetivo dice «Toca LA PÁGINA, en el suelo al pie del faro, y sigue el pelo de Canelo hasta donde se fue.»
- Verificado en Chrome sin cabeza: faro → `p3_pelo`; gatera → `p3_pelo`; hoja → `p3_pelo`.

### 3.2 El cruce y la escena A (agente BAR)

**El cruce (`p3_pelo` → la calle).** Se sigue al pelo a través de la gatera:
- la cámara entra por la portezuela;
- **preparación**: la luz de la gatera;
- **desarrollo**: el mundo se repinta a caricatura de TV en bandas planas que lo invaden (otra caja, otro estilo);
- **salida**: el neón «LA ÚLTIMA RONDA» zumba al encenderse.

En la calle mojada, **una hilera de pelos naranjas** lleva a la puerta del bar: se ve que seguimos a Canelo. Después, el cliente que sale volando (se conserva).

**Escena A.** Además de lo que hay:
- **Actuación de Canelo**: gesticula con la pata, se inclina hacia el oyente, se ofende con todo el cuerpo (no solo con un emote). Espuma reacciona: pule más rápido, pone los ojos en blanco.
- **Una pista honesta del oyente**: la espuma del segundo tarro, en el borde derecho del cuadro, hace burbujitas al ritmo de un ronquido. Se entiende en la revelación. Nada a la derecha de `hideX`.
- **«¿No sabes quién soy?»**: por medio segundo el bar se vuelve una portada del Diario del Mar con su cara (un adelanto del Momento) y regresa. Se prende APLAUSOS y nadie aplaude.
- **Explicar la gatera (la regla del mundo que hace falta para H68)**, con una acción:
  - Canelo dibuja una puertita en la espuma de su tarro con la uña;
  - la puertita se abre y deja ver medio segundo de otra caja (una ráfaga);
  - se cierra.
  - Línea nueva (corta), en boca de Canelo: «Las cajas tienen gateras, compa. Puertitas. Nadie las ve porque nadie se quiere ir.»
- El trago largo (A8) se conserva como entrada al Momento.

### 3.3 Momento «Drunck» (agente MOMENTO)

**Recurso base: el bar es el escenario de la memoria.** Cada recuerdo **sale de un objeto del bar y vuelve a él** (empuje de cámara hacia el objeto, el objeto se transforma en el escenario):
- tarro → mar;
- periódico de la barra → portadas;
- pizarrón de cuentas → ficha y bitácora;
- neón → galeón;
- tele → faro;
- puerta del baño → grafiti;
- servilleta → la página.

Esto da continuidad (siempre sabemos que Canelo lo está contando en el bar) y es literalmente «objetos que se vuelven escenarios». Entre ideas, **planos de reacción en el bar** (Canelo contando, medio compás) hacen de «consecuencia».

**Mapa de ideas.** Las ideas legibles van con al menos 2 compases; las ráfagas pueden ir rápido.

| Sección | Para ENTENDER (legible, con consecuencia) | Para SENTIR (ráfaga, psicodelia) |
|---|---|---|
| c1–9 El trago | «Yo dormía. En una caja.»: el gatito dormido en su caja, sostenido 1 compás. | La caída dentro del tarro: el vidrio curva el bar, las burbujas se vuelven estrellas, la espuma se vuelve olas. Cambio de escala (balsa diminuta en un mar de cerveza). Hoy está vacío: necesita profundidad, capas y el ojo gigante de Canelo a través del vidrio. |
| c9–17 Parte I | c16: «NO ONE LIKES CATS.» … «Mentira.»: la mentira de Nadie. **Silueta según §2.2**, con preparación (la sombra entra por el borde de la hoja), desarrollo (crece sobre la portada) y salida (la pata de Canelo sella «MENTIRA» y la sombra se rasga). | Las portadas: Canelo, recortado, salta de una foto a la siguiente y rompe el papel; los villanos aparecen en la foto. |
| c17–25 Oleadas 1–2 | c17–18: «Una ficha. Antes del uno.» (REGISTRO 000 se planta). c24.6, congelado: «La luz…», el haz del faro sale más allá del cielo (se planta la señal de Luzterna). | La tinta invade la barra («Shhh»), el almirante con ¿CUÁNTOS?, el barco blanco que blanquea, el neón que se vuelve galeón, la ciudad blanca. Agrupados en máximo 3 golpes, **invadiendo el bar** en lugar de cambiar de fondo. |
| c25–33 Oleada 3 | «Yo lo veo. Nadie más.»: el gatito de estática (REGISTRO 000), 2 compases, legible. Se planta para el despertar. | Sincro, el remolcador, el hospital, el grafiti en la puerta del baño, la bitácora y el coloso: una ráfaga. |
| c33–41 El borde | «Tres bandos.»: los 3 bandos se identifican claramente por su estilo (corrección blanca, grafiti, hilos de luz), porque la escena B los vuelve a nombrar. «La hoja bajó junto a mi faro.» | Acuarela y feria de 1930 (blanco y negro con regla §2.2 si hay siluetas). El eructo rompe la simetría. |
| c41–49 La página | «Todos miran. Todos esperan. A mí.»: la conexión central. Su cara, sostenida. «Me fui.»: la gatera. | El caleidoscopio de ojos, el tobogán de colores y el aterrizaje en cámara lenta. |

Reglas del Momento:
- Se conservan la canción, los anclajes medidos y los 14 inputs (se pueden mover dentro del mismo compás si la escena nueva lo pide; las pruebas se actualizan).
- Se conservan el humor de los globos y su tamaño (1–4 palabras).
- Personajes **más grandes y actuando**:
  - poses que cambian por golpe, squash & stretch, smears;
  - Canelo reacciona en cada recuerdo;
  - en lugar de pegar recortes estáticos se usan los puppets (`st.actor`) con emotes.
- Referencia de calidad: los Momentos de la Parte II (`te_odio`, `liky_fight`, `hemkade`, `yonose_todo`). Antes de diseñar, el agente saca su hoja de contacto con `pp/sheet.mjs`.

### 3.4 Escena B y la revelación (agente BAR)

**La barra se vuelve el diagrama de lo que cuenta.** Cada idea es una acción con utilería, más una ráfaga corta del estilo del recuerdo (0,4–0,8 s) y un plano de consecuencia:

| Línea (b66_bar) | Acción que la explica |
|---|---|
| 7 «Llevo no sé cuántas noches encima de esa hoja… todos esperando que yo decida» | Saca una **servilleta blanca** y la alisa en la barra: «esa hoja». Pone la pata encima. La ventana pasa día–noche–día rápido y salen rayitas en el pizarrón. |
| 8 «Los blancos… Los grafiteros… Las manos de luz…» | Pone 3 cosas alrededor de la servilleta: un **terrón de azúcar** que pule hasta blanquearlo (corrección blanca), la **botella de cátsup** que salpica (grafiti) y la **luz de la lámpara** que baja en dos manitas (hilos de luz). Cada objeto invade la barra con su estilo, rápido, y regresa. |
| 9–12 el Capi (según `mentira:*`) | Una **papa frita** de su platito hace de Capi con un palillo de pluma: escribe «mundo perfecto», raya «rompan todo», la deja en blanco, o nomás mira. Las 4 variantes se conservan. |
| 14 «Luego me dormí encima… nadie puede escribir debajo de un gato dormido» | Se acuesta sobre la servilleta y ronca. **Espuma intenta apuntarle la cuenta en la servilleta y su lápiz no puede**: un chiste que explica la ley. |
| 15 «La niebla borraba… le quitamos la goma… ahora todo se escribe solo… pisapapeles» | En el pizarrón: un borrador de niebla limpia. Canelo se guarda el borrador. El gis se levanta solo y escribe cada vez más rápido (psicodelia). Canelo se echa encima de la servilleta y aparece un letrerito «PISAPAPELES». |
| 16 «nueve vidas… ya voy en la once» | Cuenta con las garras; las rayitas del pizarrón se multiplican. |
| 17 «Y la Luz… su linterna manda señal para afuera» | Por la ventana, **un haz azul** atraviesa la lluvia hacia arriba (se planta; plano sostenido). |
| 18 «una noche sin que nadie me viera» | Se jala la bufanda sobre los ojos. |

- Las líneas largas se pueden partir en dos con la acción en medio. El texto se conserva salvo cortes mínimos para el ritmo.
- Si se mueven índices, se actualizan `gaterasScript.ts` (`BAR_LINES`) y `p3Bar.ts` juntos.
- **La revelación** (R1–R10): se conserva el escenario. Se pule la ejecución:
  - la caída lenta de Hipólito con la torre de donas, con anticipación y arrastre;
  - el plano de suelo R7;
  - Canelo tambaleándose al salir (R8).

### 3.5 La calle con Luzterna (agente LUZ)

- **Calidad de Luzterna.** Comparar el horneado TV actual con alternativas: por ejemplo, la pintura con solo la línea uniforme y una gradación suave. Se elige la que conserve su cara y su linterna. Debe verse más grande en sus planos.
- **Actuación.** Su linterna se mece. Se inclina para regañar. **Al decir «DERECHO. DERECHO.» crece enorme** como en una caricatura y luego vuelve a su tamaño.
- **L4, Canelo la ve de cabeza:** el plano literalmente se voltea 180° como su punto de vista (rápido y chistoso), y se endereza.
- **Los tramos son distintos:**
  1. La calle se dobla en perspectiva de borracho.
  2. «El piso se mueve»: **el piso ondula**. «El piso no se mueve…»: ella pisa y las ondas se congelan y se aplanan (un chiste que explica).
  3. «¿Y si un día me voy…?» / «Te voy a buscar… ya me pasó todo»: plano de dos, cerca y quieto; la lluvia se calma y su luz baja apenas. Es una presagio sin subrayar.
  4. «Perdón por irme, Luz.»: ella se detiene.
- **V1–V5 sin siluetas genéricas** (regla §2.2):
  - o se ruedan desde el lado de la gatera, con las caras iluminadas por su luz cálida y la azul de la linterna;
  - o, si se conserva el contraluz, se hace con el arte real: borde de luz, bufanda en color, linterna encendida, llama de la cola, y preparación y salida.
- **V4, el hilo**, en un inserto legible: su manga guarda el hilo naranja. Importa más adelante.
- **V5**: él cruza la gatera con un squash y ella mira hacia el bar.

## 4. Agentes y dueños de archivos (máximo 4 a la vez)

| Agente | Es dueño de | Puede tocar con cuidado |
|---|---|---|
| **BAR** | `cine/scenes/p3Bar.ts`; `app/gaterasFlow.ts`; `ui/story/gaterasCines.ts` (`p3_pelo` y el cruce; no tocar `enterH66`, `onFaroTap` ni `setPaginaP3Tap`); `scenes/caja/bar*.ts` (nuevos); en `CajaScene.ts`, los métodos y fx del set bar; líneas de `b66_bar` en `data/gateras/historia.json` y `BAR_LINES` en `ui/story/gaterasScript.ts`; `tests/p3BarPulido.test.ts` (nuevo) | `momentos/songs/drunck/layout.ts` (solo **agregar** constantes, sin cambiar las existentes); `tests/p3Caja.test.ts` (solo lo del bar) |
| **MOMENTO** | `momentos/songs/drunck/{score,stage,scenes,scenes2,scenes3,verbs,drawkit,bar}.ts` (`bar.ts` = `BarSet`); `tests/momentoDrunck.test.ts` | `layout.ts` (solo agregar); `tv.ts` (solo agregar paleta); importa `silueta.ts` |
| **LUZ** | `cine/scenes/p3Salida.ts`; `momentos/songs/drunck/street.ts` (`StreetSet`); `momentos/songs/drunck/silueta.ts` (nuevo, compartido); en `tv.ts`, el horneado (`bakeTv`/`bakePlain`/`TV_SAT`); `scenes/caja/calle*.ts` (nuevos); en `CajaScene.ts`, el set calle (caminata, luz, correa, hilo, `backs`, `catBack`/`ghostBack`) y un modo de silueta para `Toon`; líneas de `b67_salida` y `SALIDA_LINES`; `tests/p3CallePulido.test.ts` (nuevo) | `tests/p3Caja.test.ts` (solo lo de la calle) |

- `CajaScene.ts` y `historia.json` son compartidos: **volver a leer antes de cada edición**, hacer ediciones chicas y localizadas, y meter la lógica nueva en archivos propios.
- Nadie toca `state/`, el guardado, `story.ts` ni la entrada (§3.1).
- Cada agente mantiene `docs/part-iii/agentes/<AGENTE>.md`.

## 5. Aceptación y comparación antes/después

- Capturas **después** con las mismas herramientas y en los mismos momentos (`pp/sheet.mjs`, `pp/cine.mjs`), guardadas en `<scratch>/despues/`. Para el Momento, la comparación va por compás.
- Una **comparación lado a lado de las escenas de sombra** (c16, la feria, los ojos, V1 y V5, y las apariciones de Luzterna).
- Cada idea de §3.3 y §3.4 se reconoce en una captura fija **sin leer el diálogo**.
- 60 fps en el Momento (p95 < 20 ms en alta) y deriva dibujado–oído p99 < 1 ms.
- `tsc` limpio, toda la suite de pruebas en verde y `verify-missions --all` OK.
- Flujo completo con `test-saves/h65-normal.json`: entrada → bar → Momento → B → revelación → calle → despertar, sin bloqueos al recargar.
