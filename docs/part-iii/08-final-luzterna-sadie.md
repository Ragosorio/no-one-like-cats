# 08 · El final: Luzterna y «SADIE»

Las marcas [DUEÑO], [CANON], [PROPUESTA] y [ABIERTO] significan lo mismo que en `02`.

> **Actualizado (2026-10-27, GIRO):** el regreso de Canelo ahora es la **pasada 7 · deuda falsa pagada**: Cerito y la linterna, juntos; un vidrio de la linterna se queda negro para siempre y es lo único que queda en la linterna rota. «Continuará» se escribe con el lápiz del Capi sobre la Carta en penumbra. Fuente de verdad: `historia-v2/guiones/final/` (h94, h96) y `temperatura/06-ronda-f.md`. Este documento queda como base histórica.

**Lo que no se negocia [DUEÑO]:**
- En la batalla final, **los Titiriteros matan a Luzterna**.
- No es una desaparición ambigua y no hay resurrección.
- Entra «SADIE» y muestra su muerte como algo trágico.
- La muerte del guion no se confunde con un fracaso del jugador.
- No hay una posibilidad falsa de salvarla.
- **La Parte III termina con su muerte** (segunda ronda, 2026-10-13). Hay que darle espacio a la pérdida y a las reacciones, sin saltar a premios, chistes ni una invitación alegre a lo siguiente.
- **La historia hace creer que quien puede morir es Canelo** (`02` §4.8).
- **La Parte IV no se decide aquí.** No se cierran posibilidades (rescatarla, encontrarla de otra forma, alguien más), pero **no se anuncia ninguna resurrección** ni se usa un gancho que le quite peso a su muerte.

La storyboard del Momento depende de la composición real de SADIE. Lo que se pudo verificar está en `07` §SADIE. Este documento fija la **dramaturgia**; las **sincronías** se marcan como «pendientes» donde haga falta.

---

## 1. Cómo llegamos (resumen; detalle en `02` §3 y `03`)

1. Los Titiriteros bajaron siguiendo la luz de la linterna (lo revela La Mano en H85).
2. Su plan (H85): a Cerito lo sostienen **la luz** de la linterna y **los ojos de Canelo**. Sin las dos cosas, Cerito vuelve a *vacante* y las fronteras sanan. **La amenaza visible es Canelo.**
3. Luzterna se negó a apagar la luz: en H81 y en H85 («No, wey»). En H86 lo defendió peleando contra los Correctores.
4. Esquirla abrió una rasgadura en el concierto, y por ahí **La Mano vio que Cerito duerme en tu faro** (H90).
5. Itō vino a avisar: vienen esta noche (H92).
6. Vienen **a tu isla**, que es el lugar de la luz.

**Por qué en casa:** porque es donde está la luz. Y porque el jugador construyó ese faro y esa isla. La Parte II prometió que «el juego nunca castiga al jugador por haber construido su isla», y aquí **no se castiga la isla**: no se destruye nada que el jugador construyó (§5.5). Lo que se pierde es a ella.

## 2. Por qué los Titiriteros la matan (la lógica, para escribirla bien)

| Lo que creen | Por qué tiene sentido para ellos | Por qué es un error |
|---|---|---|
| «Una luz contra mil mundos» | El derrame está matando mundos enfermos en otras cajas. Son médicos haciendo triaje | No miraron cuántos mundos se salvarían de otra forma: no entienden a los gatos |
| «En la oscuridad, la posibilidad vuelve a nada» | Arriba siempre funcionó así: lo que nadie ve, no está escrito | **Los gatos ven en la oscuridad.** Recién encarnados, todavía no lo saben (Batcat lo dijo en el Acto II, `03` §5) |
| «La farera no es un ser vivo: es un fantasma pegado a una linterna» | Para un autor, un fantasma es una página sin terminar. Ponerle FIN es «arreglarla» | Ya tienen cuerpo y ya sienten. **Lo sabrán un segundo después de hacerlo** |
| «Le pedimos que la apagara. Dos veces» | Es verdad (H81, H85) | Pedir no es tener derecho |
| «El gato es el objetivo; la farera estorba» | Van por los ojos de Canelo. Luzterna se pone delante con la luz encendida y no se quita | **La Mano elige** tachar la luz con ella dentro para llegar a Canelo. No es un accidente: es una decisión, y le pesa |

**Lo que pasa justo antes**, en el interludio (máximo 4 líneas):
- La Mano **apunta a Canelo**: su uña de tinta ya empezó el trazo hacia él.
- Luzterna se pone delante, con la linterna en alto.
- **La Mano:** «Apártate, farera. No es contigo.»
- **Luzterna:** «Todo lo de este gato es conmigo.»
- **La Mano:** «Te lo pedí dos veces.» El trazo cambia de rumbo.

**Cómo la matan [PROPUESTA].** La Mano ya no tiene lápiz. Le queda **la uña**, que todavía es un plumín de tinta. **Tacha** la luz: un solo trazo negro que atraviesa la linterna y a Luzterna, que la sostiene.
- Es el gesto de un escritor, hecho con una pata de gato.
- La gramática visual del tachón ya existe en el juego: REGISTRO 000 tachó *observando* (b65) y Distraxia habló con tachones (b61). Aquí el tachón **mata**.

**Por qué es definitivo [PROPUESTA; regla de `02` §5.7].** Luzterna existía porque **nunca soltó** (Parte I: «Yo nunca solté»). Cuando la tachan, ella **sigue sin soltar**: protege a Cerito con la linterna hasta el final. La linterna se rompe con ella aferrada y no queda nada que la sostenga.
- En la Parte I, no soltar fue un accidente («se me olvidó bajar»).
- En la Parte III es **su decisión**: lo dice en su última línea (§4).

## 3. La batalla final: muerte del guion, no fracaso del jugador

**H93 «La noche más oscura».** Batalla de historia en **3 fases**, en tu isla de noche. Se usa el sistema de FASES de la Parte II (`registerFaseInterlude`, `FaseDef.endsBattle`).

| Fase | Objetivo jugable (lo que dice la UI) | Qué pasa | ¿Puede perder el jugador? |
|---|---|---|---|
| **1 · «El asedio»** | «Rompe el asedio» (hundir 2 barcos: Cruceta y Firma) | Pelea normal y difícil. Si en H86 le diste el mapa a Brecha, **los Disruptores llegan en el turno 3** y abren una rasgadura que desvía tiros enemigos. Si no, **Bisagra** hace de puerta y bloquea un turno. Luzterna **ilumina las trayectorias**, igual que en H86: es su ayuda de comandante | **Sí.** Perder aquí es perder una batalla normal: se reintenta sin costo, **antes** de la muerte |
| **Interludio** | — | Al ganar la fase 1 (nunca por vida ni por turno) llega el barco de tinta de La Mano. Escena corta en el motor (`cine`): **La Mano va por Canelo** y Luzterna se pone delante (§2). **Momento «SADIE»** (§4) | **No hay input que la salve** (§4.2) |
| **2 · «A oscuras»** | «Aguanta en la oscuridad» (sobrevivir 4 turnos) | Regla nueva y única: **oscuridad**. No hay guía de trayectoria; solo se ven los ojos de tus gatos y los fogonazos. En el turno 3, input de **Canelo mira** (§4.4) | Si caes, se reintenta **solo esta fase**, con un aviso: «Tómate tu tiempo». **El Momento no se repite**: la muerte ya pasó. Lo que se reintenta es el después |
| **3 · «Los ojos de casa»** | «Que La Mano vea» | Cerito eligió ser gato. Los ojos de todos tus gatos brillan. La Mano entiende que los gatos ven en la oscuridad y **se rinde**: la pelea termina en victoria por `reason: 'momento'` | Solo es animación y un golpe final de Canelo (con `final_blow`, como H38) |

**Reglas de honestidad con el jugador:**
1. **Nunca hay una meta de «protege a Luzterna».** Ella no tiene barra de vida, no es objetivo enemigo y nunca aparece en las cartas de la tripulación.
2. **El momento de la muerte no depende del desempeño.** Ocurre al terminar la fase 1, igual para todos. Ganar la fase 1 con 1 turno o con 20 lleva al mismo sitio.
3. **No hay pista falsa.** En la fase 1 no se le dice al jugador que se apure, y los textos nunca dicen «antes de que sea tarde».
4. **Después, nadie culpa al jugador.** Ninguna línea de nadie dice «si hubiéramos…». Itō, Borrón y Canelo culpan, cada uno, **a quien de verdad decidió**: a La Mano, y Canelo a sí mismo por haberse ido de la página. Esa culpa la resuelve el epílogo.
5. **Rejugar no cambia nada.** «Volver a ver» la reproduce igual. No hay final alternativo.

## 4. El Momento «SADIE»

### 4.1 Estilo [PROPUESTA]: «LINTERNA MÁGICA»

La linterna mágica es el proyector antiguo: una lámpara que proyecta **placas de vidrio pintadas a mano**. Aquí es **la linterna de Luzterna proyectando sus recuerdos mientras se apaga**.

- **Look:**
  - placas circulares de vidrio pintado, con colores de anilina translúcidos;
  - viñeta redonda con borde de latón;
  - parpadeo de llama, polvo en el haz, rayas finas del vidrio;
  - cambio de placa por **deslizamiento lateral**, como el aparato real.
- **Por qué este estilo:** es el único de los Momentos que **sale de la historia**. La luz que se apaga es literalmente la que proyecta la escena. Cuando ella muere, **la proyección se acaba**: el Momento termina en negro porque se apagó el proyector, no porque alguien cortó.
- **Lo técnico:** el kit de Momentos ya hornea gatos a otros estilos (`investigacion/arte-pipeline.md` §4.6). La placa de vidrio es un horneado nuevo, del tipo de `bakeMiniature`: color translúcido, contorno de pincel y textura de vidrio en shader. **La textura va en el shader, nunca en la pintura** (regla de arte, misma fuente §4.3).
- **El contraste:** el resto de la batalla final está en el estilo del juego. Solo lo que proyecta la linterna está en vidrio pintado.

### 4.2 Interacción [PROPUESTA]

Reglas de los Momentos (Parte II): la primera vez no se salta y los inputs cambian la animación, nunca el resultado.

- **Cada input es un recuerdo**, no un intento de salvarla. La indicación en pantalla **nunca dice «sálvala», «aguanta» ni «protege»**. Dice **«RECUERDA»**.
- Al tocar a tiempo, la placa que entra es un recuerdo compartido:
  - el primer «Capi» después del Jefe 1;
  - Canelo en la caja de la balsa;
  - la linterna colgada en tu faro;
  - «Cuidar algo también es dejar que lo vean»;
  - la resaca en blanco y negro;
  - la Gato-señal;
  - Cerito dormido en la cobija;
  - el karaoke desafinado.
- Si se toca fuera de tiempo, la placa entra igual, más borrosa. Ningún recuerdo se pierde.
- **La última placa es la foto que el jugador eligió en H89.** Es la única consecuencia directa de una decisión del jugador dentro del Momento. Si no eligió (no es posible: la cabina obliga a elegir), sale la de Canelo dormido en la palmera.
- **No se usa «mantén y suelta»**, el control del juego. Se pensó (ella «nunca soltó»), pero mantener presionado sugiere que aguantar la salva. Esa es justo la posibilidad falsa que el dueño prohíbe. [Decisión del director; se documenta para que nadie la reintroduzca]

### 4.3 Dramaturgia (lo que pasa, en orden)

**La hoja de coreografía anclada a los compases reales de SADIE está en `07` §3.3.** Por ejemplo: la linterna se rompe en c29 (2:14,4), donde el piano pasa a la pista distorsionada, y el tachón chisporrotea con los golpes «Error» de c8,875 y c13. Aquí va el orden dramático; las funciones musicales ya están verificadas en el editor.

| # | Función musical (verificar en `07`) | Qué se ve | Qué se oye y se lee |
|---|---|---|---|
| 1 | **Entrada** de la canción | Batalla congelada. El trazo negro de La Mano ya atravesó la linterna: **se ve el tachón en el aire**, todavía sin efecto. Silencio de batalla (`audioApi.solo`, Parte II) | Sin diálogo |
| 2 | **Primeras frases** | El haz de la linterna, ya rajado, empieza a **proyectar** en el humo: la primera placa (la balsa, la caja, Canelo bebé dormido). Luzterna mira la proyección, sorprendida | «RECUERDA» (input) |
| 3 | **Desarrollo** | Placas de la Parte I y la Parte II, una por input. Entre placa y placa, cortes a Luzterna de verdad: **sigue de pie**, sostiene la linterna frente a Cerito, que se esconde detrás de su falda de luz | Luzterna, 1 línea: «No la voy a soltar, Capi. Esta vez no es que se me olvide.» |
| 4 | **Subida o clímax** | Placas de la Parte III, más rápidas: la resaca, la Gato-señal, el karaoke, la cobija. El tachón **avanza** por su cuerpo como tinta que se corre. Canelo corre hacia ella desde la palmera; **la cámara no lo deja llegar** | Sin diálogo. Solo la canción |
| 5 | **Calma** (c25–29) | Luzterna se arrodilla junto a Cerito. Le pone la mano en la cabeza. Mira a Canelo, que por fin llega, y le acomoda la bufanda «horrible». En el aire queda una sola placa: **la foto que elegiste** | Luzterna, la última línea, a Canelo: «Cuida la página, gordo. Y no te la comas.» |
| 6 | **Piano distorsionado** (c29–33) | **La linterna se rompe** en c29. Las placas que quedaban caen como vidrio; la proyección se distorsiona. Luzterna no suelta. **La bufanda que tejió cae al suelo** junto a Canelo: «una bufanda en el suelo y alguien que no se levanta» (Cronos, H91) | Sin palabras |
| 7 | **Piano limpio y final** (c33–37) | Queda una brasa que alumbra la foto. Canelo maúlla en c33. Con cada ataque del piano, la brasa se achica. En c37 **la proyección se acaba**: negro total, sin UI ni subtítulos | — |
| 8 | **Después del último sonido** | En el negro aparecen, uno a uno, **los ojos de tus gatos**: dos puntos de luz, otros dos, otros dos | Fin del Momento → fase 2 «A oscuras» |

**Notas de actuación:**
- Luzterna **no llora** en pantalla. Hace un chiste chico al principio, «¿Esto es lo que ve la gente cuando se muere? Qué cursi», y después deja de hacerlos. **Es la primera vez que no termina con chiste.** Esa ausencia es el golpe.
- Canelo no habla: está en tu isla, donde los gatos no hablan (`02` §5.2). Su grito es un **maullido**: el único sonido que no es la canción. SADIE no tiene voz ni batería (`07` §3.1). El maullido cae en c33, cuando vuelve el piano limpio y solo.
- Cerito ve todo. Su estática se calma en cada placa: está aprendiendo qué es «querer a alguien».

### 4.4 «Canelo mira» (fase 2, después del Momento)

- Turno 3 de la fase 2: aparece un input único, **«MIRA»**, sobre Canelo.
- Al tocarlo, la cámara entra a los ojos de Canelo y se ve a Cerito en la oscuridad, **claro como de día**. Cerito deja de tener estática y **elige pelaje**.
- Si el jugador no toca, Canelo mira igual a los 4 segundos. Es la regla de los Momentos: el resultado no cambia.
- Es el pago de H53 (Canelo es el único que lo ve) y de la línea de Batcat en el Acto II.

## 5. El después (consecuencias jugables)

### 5.1 El espacio del duelo (H94–H96) [DUEÑO: darle espacio a la pérdida]

**Reglas desde que termina SADIE hasta el cierre:**
- **Ninguna recompensa a la vista:** sin panel de misión cumplida, sin jingle, sin revelación de gato, sin oro flotante ni logros.
- **Sin NOVEDADES, sin tips y sin avisos** de ningún sistema (`hush`, como en los Momentos).
- **Sin chistes.** Ningún personaje hace humor salvo lo involuntario y triste (por ejemplo, Hipólito despierto por primera vez).
- **Sin «siguiente aventura».** Nada de «continuará» con fanfarria ni de invitaciones a lo nuevo.
- Las recompensas que estas misiones darían quedan guardadas y aparecen **en silencio** en la Bitácora («Lo que quedó») cuando el jugador la abre, después del cierre.
- **La música** es `sadie.luto` (el piano limpio del final de SADIE, `07` §3.4) o silencio. Nada más.

| Momento | Qué pasa | Cómo |
|---|---|---|
| **Fin de la batalla** (H93) | Al rendirse La Mano, **no** sale la pantalla de victoria del Diario. Solo un fundido a negro y luego la isla de noche | `endsBattle` sin `ResultsScene`; la recompensa va a la Bitácora |
| **La Mano frente a Cerito** (H94) | Cerito, ya con forma de gato, se le acerca a La Mano y la huele. Ella levanta la pata para tacharlo y **no puede**: le tiembla. «Lo vi. Lo vi en la oscuridad.» Borrón llega tarde y sin hipo; Itō, sin espada. Nadie dice nada. Los tres se van por la gatera. Es la primera vez que un Titiritero llora. Máximo 4 líneas | Cine en la isla |
| **La vigilia** (H94) | Noche en tu isla, **larga**: el jugador decide cuándo seguir y no hay temporizador. Los gatos se acercan solos al faro, cada uno a su tiempo según su temperamento (sistema de `31`): los primordiales solemnes, los juguetones quietos por primera vez. Nadie: «…». Noctis deja su antifaz en el escalón. Maneki **no barre**. **Las decisiones pequeñas vuelven**: la cobija que eligió, la canción del karaoke suena bajito desde la rocola rota y la foto aparece en el escalón | El jugador puede tocar a cada gato; cada uno tiene **un gesto**, no una línea |
| **El recado** (H95) | Acción del jugador: tocar a Canelo. Aparece el texto de la Parte I, tal cual (`script.ts` l.112), con un aviso: «Te lo pidió hace mucho. Antes del Primer Mar.» Botón: **«DÍSELO»**. Al tocarlo, en la UI de diálogo (sin voz): **«Dice que tu bufanda siempre le pareció horrible. Con cariño.»** Canelo no responde con palabras (está en casa). Se acuesta. Luego se levanta y **recoge del suelo, junto al faro, la bufanda que ella le tejió** y que cayó esa noche. Se la queda puesta encima de la suya | Cine en la isla, con una interacción |
| **La luz nueva** (H95) | Canelo sube al faro y lo **prende con su propio fuego**: es gato de Fuego, Común desde el primer día. La luz es naranja, no la azulada de la linterna. **No es la luz de ella.** La linterna rota queda en un estante del faro | Estado del mundo nuevo |
| **La página** (H95) | Canelo se vuelve a dormir sobre la página en blanco, ahora por una promesa. Caption: «Nadie puede escribir debajo de un gato dormido. Y este no se va a ir.» | — |
| **Cierre** (H95) | Una tarjeta sobria en la letra del jugador: **«FIN DE LA PARTE III»**. Sin créditos con fanfarria: los créditos de la Parte III son **SADIE otra vez, solo el piano final**, sobre la Carta que ella dibujó | Créditos como datos (patrón de la Parte II) |
| **La última ronda** (H96) | **No aparece enseguida.** Sale la próxima vez que el jugador abre la Carta de las Cajas, sin reloj: es la primera vez que vuelve a mirar hacia afuera. Ver §5.2 | Misión de reserva H96 |

### 5.2 El epílogo del bar (revisado para respetar el duelo)

**Antes:** Canelo tiraba el vaso de un manotazo y salía con frase de remate. **Ahora:** nada de remates.

| # | Qué pasa |
|---|---|
| 1 | La Última Ronda, de día. Vacía, salvo **La Mano**, sola en una esquina, con un vaso del trago que borra la noche. No lo ha tocado |
| 2 | Canelo entra y se sienta donde se sentó en el prólogo. **Hipólito está despierto.** Es la primera vez |
| 3 | Doña Espuma le sirve el mismo trago, sin preguntar. Lo empuja despacio hacia él |
| 4 | Canelo lo mira mucho rato. Lo aparta con la pata, despacio. El vaso llega al borde y **cae solo**. El sonido de la Parte I. Nadie se mueve |
| 5 | **Hipólito**, despierto, en voz baja: «¿Y luego?». No es un chiste: es lo único que sabe preguntar |
| 6 | **Canelo:** «Luego me acuerdo de ella. Todos los días.» |
| 7 | Canelo se va. La Mano sigue mirando su vaso. **No lo toma.** Queda abierto si se perdona o no |
| 8 | Fundido. **El post-juego se abre después**, en silencio: la Carta queda disponible y la Bitácora tiene «Lo que quedó» |

### 5.3 Lo que dejan abierto para la Parte IV (sin anunciar nada) [DUEÑO]

| Hilo | Por qué no le quita peso a su muerte |
|---|---|
| **La linterna rota** queda en el estante, no se tira | Es un objeto de duelo. No hace nada; solo está |
| **La gatera que no cerró** da hacia afuera (`02` §4.4) | Es el misterio de Cerito, no de ella |
| **La señal se apagó** (H48): quien la recibía «afuera» ya no la recibe | No sabemos quién era. No es una promesa |
| **Los Titiriteros varados** recuerdan lo que hicieron | Es culpa, no una solución |

**Lo que NO se hace:** no hay una escena que diga «quizá vuelva»; la Bitácora no la llama «desaparecida»; nadie busca a Luzterna; ningún Momento termina con su silueta.

### 5.4 Lo que cambia para siempre en tu isla

| Elemento | Antes | Después | Implementación |
|---|---|---|---|
| Faro de noche | Luz azul de la linterna, haz hacia afuera | **Luz naranja de Canelo**, haz que barre **hacia la isla** (ya no manda señal afuera) | Estado del mundo derivado del progreso (H95 hecha), como todos los de la Parte II |
| Estante del faro | — | **La linterna rota.** Al tocarla: «Ya no prende. No hace falta.» (texto fijo, sin voz) | Objeto de la isla derivado de la partida, como la página de `o4Pagina.ts` |
| Canelo en la isla | Su palmera | Su palmera de día; **de noche duerme en la página**. Lleva **la bufanda de ella encima de la suya**, como accesorio vectorial (mismo sistema que el objeto de los Ecos, `27` §Ecos) | `catActor` + la página. El accesorio es código, no pintura nueva |
| Cerito | — | Gato que vive en tu isla, con la forma de quien lo miraba. Su ficha: «ESPECIE: gato (por ahora) · RAREZA: no aplicable». Duerme en la cobija que Luzterna eligió en H77. **No tiene sombra** cuando Canelo no lo mira | Especie nueva fuera del gacha, con su categoría propia en el Catdex (`06`). **No se le asigna rareza común**: no se cierra su naturaleza |
| Bitácora | Letra de Luzterna | Su última entrada interrumpida a mitad de palabra; las nuevas, con **tu letra** | `03` §4 |
| Carta de las Cajas | Dibujada por ella | Lo que no alcanzó a dibujar queda **en lápiz, a medio trazar**. Lo nuevo se dibuja con tu letra. Nunca se borra lo suyo | Capa del segundo mapa |

### 5.5 Lo que no cambia (para no castigar)

- No se destruye ni se resta nada: edificios, hábitats, gatos, recursos y barcos quedan igual.
- La batalla final no puede dañar la isla de la partida. El asedio es un escenario de batalla, no la isla editable.
- Ningún gato del jugador muere ni se pierde.

## 6. Las funciones de Luzterna después de su muerte

**Fuente:** `investigacion/luzterna-funciones.md` (inventario del agente AUDITORIA). Aquí va la **regla** y la propuesta por categoría; la tabla línea por línea vive en ese inventario.

### 6.1 La regla

> **Luzterna puede aparecer en lo que es un recuerdo y en lo que pasa antes de su muerte en la línea de tiempo de ESA partida. Nunca en un presente posterior.**

- **Por partida, no global.** Una partida nueva que empieza la Parte I tiene a Luzterna viva hasta que llega a H93.
- La condición es **derivada del progreso**: `luzternaFallecida(save) = missions.done incluye 'H93'`. No es un flag suelto: sobrevive a recargas y migraciones, igual que los estados del mundo de la Parte II (`20` §1.1).
- **No hay reinicio narrativo de la Parte III.** El de la Parte II (`21`) nunca debe volver a correr para partidas que ya pasaron H93. Hay que agregar una guarda y su prueba.

### 6.2 Qué pasa con cada función

Los números entre corchetes son las filas del inventario en `investigacion/luzterna-funciones.md`.

**Hoy no existe ningún estado «viva o muerta».** La Parte III lo crea como predicado derivado (§6.1) y **cada superficie de esta tabla lo consulta en un solo lugar**: un `voiceFor(superficie, save)` nuevo, para no dejar 30 `if` regados.

| Superficie de hoy | Riesgo | Después de H93 | Por qué |
|---|---|---|---|
| `tip()` con LUZTERNA por defecto [1] | ALTO | El valor por defecto pasa a **BITÁCORA**: hablante nuevo de tipo `system`, sin retrato, con papel y letra. Hay que registrarlo en `text.ts`; si no, sale con la cara de Canelo (`text.ts:147`) | Todo tip futuro saldría con su cara |
| Aviso NUEVA MISIÓN y tarjeta MISIONES firmados «— Luzterna» (127 + 35 `line`) [2, 3] | ALTO | Las misiones de la Parte I y II **conservan su firma**, pero como **«— de la Bitácora de L.»**: algo que ella escribió antes. **Las misiones posteriores a H93 se firman con tu letra** | Una nota escrita es pasado; una voz con retrato es presente |
| Panel de misión cumplida con retrato y `DONE_QUIPS` [4] | ALTO | Sin retrato. Sello de la Bitácora y otro pool de frases (del Diario) | Aparecería viva en cada misión |
| `RULE_QUIPS` de Reino y cita del panel REINO [5, 6] | ALTO | Frases nuevas, del Diario o de Canelo en mímica | — |
| Glosario: subtítulo y `quip` firmados [7] | ALTO | El subtítulo pasa a «Lo que Luzterna dejó escrito». Los `quip` quedan, firmados «— L.» | Es un texto que ella escribió |
| NOVEDADES: el campo `luzterna` es obligatorio [8] | ALTO | Desde la versión de la Parte III, cada nota trae **dos líneas**: `luzterna` (para partidas antes de H93) y `bitacora` (para partidas después). El panel elige según la partida. **La nota de lanzamiento de la Parte III sí la trae a ella**: quien la lee todavía no llegó a H93 | Así se puede publicar una actualización sin traerla de vuelta |
| «Mientras no estabas…» con retrato [9] | ALTO | Sin retrato; lo firma el Diario | — |
| Retrato al nombrar un gato [10] | ALTO | Sin retrato. En su lugar, la linterna rota en el estante | — |
| Chiste de Ajustes «Luzterna se queda (ya está muerta…)» [11] | MEDIO, **cruel** | Se quita después de H93 | Regla de escritura de `02` §7 |
| Faro: `FARO_LUZTERNA` al tocarlo [13] y la lente encendida [14] | ALTO | Frases nuevas de la luz de Canelo (§5.4) y la linterna rota en el estante | — |
| Comentarios en las islas 3D de la Parte II, que se pueden volver a visitar [18–25] | ALTO | **Se silencian.** En cada isla, **un** solo comentario suyo vuelve como tarjeta de RECUERDO la primera vez que regresas («Aquí dijo: …»). Después, silencio | El silencio en esos lugares también cuenta la pérdida |
| Presentaciones de sistemas pendientes (`features.ts`, 30) [27] | ALTO | Las mismas presentaciones, como **notas escritas en su letra** en la Bitácora: «lo dejó explicado» | Es plausible que la farera dejara instrucciones; no habla en presente |
| Pregunta de nombre y género [28], aviso de la carta [29], Podio [30], Grietas [31] | MEDIO | Si se disparan después de H93 (partidas raras), las presenta la Bitácora | — |
| `personalize()` solo cambia «grumete» por «Capi» si habla LUZTERNA [35] | — | Que también aplique a BITÁCORA | Si no, la Bitácora te diría «grumete» |
| Diálogos y cines de la Parte I y II en «Volver a ver» [39] y Momentos repetidos desde la Fonoteca [38] | BAJO | Siguen igual, **con marco de RECUERDO** (borde de placa de linterna mágica) | Son recuerdos: ella está viva *en* ellos |
| Especie `c_linterna`, Linterna Espíritu [36] | — | Se queda. Su ficha del Catdex agrega «Desde aquella noche, brilla un poco menos» (solo datos) | Se parece a ella; ignorarla sería raro |
| **Prueba automática** | — | Nueva: con una partida posterior a H93, recorrer todas las superficies de esta tabla y fallar si aparece `LUZTERNA` o su retrato fuera de un RECUERDO | Es la única forma de garantizarlo |

### 6.3 Quién guía al jugador después [DUEÑO: provisional]

**Provisional:** la **Bitácora** (texto, con tu letra) y el **Diario** (la voz de sistema que ya existe). **Eso no decide quién será el guía de la Parte IV.**
- **Canelo** no habla en la isla, y así se queda: su silencio en casa es parte del duelo.
- **Cerito** no la sustituye: no habla ni guía.

## 7. Lo que responde desde afuera [DUEÑO: se puede desarrollar si encaja y no le quita peso]

**Revisado:** el parpadeo **no** va en el final ni en el epílogo, porque ahí se leería como esperanza y le quitaría peso a su muerte.

- **Cuándo:** en el post-juego, después de varias visitas a la Carta.
- **Dónde:** al mirar desde el faro hacia la gatera que no cerró.
- **Qué:** algo, muy lejos, repite **una sola vez** el ritmo de la linterna de H48 (tres cortas y una larga).
- **Qué no tiene:** línea, explicación ni entrada en la Bitácora.
- **Quién lo ve:** Canelo levanta la cabeza. El jugador decide qué piensa.
- **Qué es:** una pregunta del afuera, no una promesa sobre ella. Le sirve a la Parte IV con cualquier camino: rescate, encuentro o alguien más.

## 8. Criterios de aceptación del final

| Id | Criterio | Cómo se verifica |
|---|---|---|
| F-1 | La muerte ocurre siempre en el mismo punto, sin importar vida, turnos ni gatos | Test del simulador con 16 semillas y 3 tripulaciones: el interludio dispara al ganar la fase 1 y nunca antes |
| F-2 | No existe ningún objetivo ni texto que sugiera salvarla | Revisión de textos + test: ningún `goal.text` ni prompt de Momento contiene «salva», «protege», «aguanta» ni «antes de que» |
| F-3 | Luzterna no habla en presente después de H93 | Prueba de hablantes de §6.2 |
| F-4 | El Momento termina en negro real y el primer sonido después es un maullido | Captura sin cabeza + registro de `audioApi` |
| F-5 | La foto elegida en H89 aparece como última placa | Test con 3 fotos distintas |
| F-6 | Nada de la isla se resta | Diff de la partida antes y después de H93–H95: solo agrega (`ext.p3.*`, la especie Cerito, el accesorio de Canelo) |
| F-7 | El dueño llora o casi | Playtest del dueño (en serio: es el criterio que importa) |
| F-8 | Entre el final de SADIE y la tarjeta FIN no aparece ningún premio, panel de misión cumplida, NOVEDADES, tip ni chiste | Prueba con una partida en H93: se registran las superficies que se abren y debe salir 0 de esa lista |
| F-9 | El jugador cree que puede morir Canelo | Playtest: antes de H93, «¿quién crees que está en peligro?». Al volver a ver la historia, las pistas a–f de `02` §4.8 encajan |
