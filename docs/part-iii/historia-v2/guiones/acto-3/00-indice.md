# Guiones del Acto III «Lo que está escrito» · índice y convenciones

> ⚠️ **SPOILERS de la Parte III.**
> Agente NARRATIVA · ronda 4 · 2026-10-26. Para el agente de producción de películas (CINE) y para quien implemente las escenas.
> Historia: `../../01-biblia-v2.md`. Mapa: `../../02-mapa.md` §5. Fichas: `../../03-peliculas.md` (F18–F25). Música: `../../../musica-v2/no-wey.md`, `distor.md` y `00-LEEME.md` §3.2.
> **Revisión:** escritos con la pasada 3 de TEMPERATURA y el diseño v3 (`../../../temperatura/05-revision-narrativa.md` §3; `../../../temperatura/04-engano-y-giro.md` §11.5). Las convenciones base son las del Acto I (`../acto-1/00-indice.md` §3); aquí va solo lo que cambia.

## 1. Qué hay aquí

| Archivo | Misión | Películas | Batalla de historia |
|---|---|---|---|
| `h83-ex-libris.md` | H83 «Ex Libris» | Escena de llegada · **F18 PP «La Encuadernadora»** (libro desplegable) · cierre | L-5 élite «La Encuadernadora» |
| `h84-finales-perdidos.md` | H84 «Finales perdidos» | Tarjeta de actividad · **F19 PH «Lo que se derrama, se termina»** (Doré) · el testamento · Brecha | — (actividad) |
| `h85-la-ficha-original.md` | H85 «La ficha original» | **F20 PP «El índice»** (expresionismo) · la ficha · **la oscuridad** · la grúa de luz | «La biblioteca se derrumba» |
| `h86-lo-que-la-luz-trajo.md` | H86 «Lo que la luz trajo» | **F21 PH «El plan»** (cuaderno de Leonardo) | — |
| `h87-no-wey.md` | H87 «No, wey» | **F22 PP «La corrección»** · **F23 PC No wey «El expediente»** (completa) + **cola-puente a DISTOR** · la azotea | Los Correctores |
| `h88-la-ruptura.md` | H88 «La ruptura» | **F24 PP «Señal pirata»** · **F25 PC DISTOR «Datamosh»** (c25 → fin) · cierre | L-9 jefe «Esquirla» |

## 2. Lo que el jugador trae al empezar el Acto III

- La Mano bajó en el punto medio (H82), pidió a Cerito «sin dolor» y Luzterna dijo que no; la tinta de La Mano **rebotó** en la luz que alumbraba a Cerito. La Mano miró a Canelo: «Ese gato ve demasiado.» Itō se retiró. La gatera a Libros está abierta.
- Canelo **paga con su llama** cada cruce de Cerito; Maneki lo dijo: «las nueve vidas no sirven para esto».
- Luzterna confesó, en chiste, que le da miedo la oscuridad (H78). **Ese miedo se paga en H85.**

## 3. Convenciones que cambian en Libros

### 3.1 La pantalla es un libro abierto

- **Formato:** dos páginas con el **pliegue al centro** (el *gutter*); papel con grano en shader; márgenes anchos.
- **Transición base:** **dar vuelta a la hoja** (la página se levanta, gira sobre el pliegue y deja ver la siguiente escena). Las elipsis largas son **varias hojas que pasan solas con el viento**.
- **Nada importante en el pliegue**: caras, globos y objetos clave van en una de las dos páginas; el pliegue puede «doblar» un objeto para un chiste (Canelo se atora en el pliegue).
- **Cada película rompe el libro a su manera** (`../../03-peliculas.md`): F20 inclina las páginas; F21 vuelve el libro un códice; F23 quema el pliegue con la luz de ella; F25 parte la pantalla en dos mitades desincronizadas.

### 3.2 Cómo se habla en Libros

En la caja de los libros **todos hablan como texto de libro**: sus líneas aparecen **impresas en la página**, junto a ellos, y se leen de izquierda a derecha.
- **CANELO** «habla en texto»: su tipografía es gruesa y chueca, con manchas de grasa de pescado. Es el chiste visual del acto (se le caen letras cuando grita, deja frases a medias en el pliegue).
- **LUZTERNA**: sus líneas salen **con su letra**, la misma de la Bitácora y de la Carta.
- **LA MANO**: escribe sus líneas **en el margen**, con tinta, a mano. Su letra es fría y perfecta.
- **ESQUIRLA**: su texto sale con *glitch* (letras corridas, bloques).
- **BRECHA** y **GARBANCITO**: tipografía de esténcil (Disruptores). Garbancito, en cuerpo minúsculo.
- **EL LOBO**: no habla; gruñe en tipografía de cuento antiguo («¡GRRR!» con capitular).

### 3.3 Hablantes nuevos para registrar en `ui/story/text.ts`

**EL LOBO**, **GARBANCITO**, **LA ENCUADERNADORA**, **HARRY GATTER** (la parodia de ARTE). **LA MANO**, **ESQUIRLA** y **BRECHA** pueden existir ya como fichas de la Parte II o de la porción; verificar y registrar los que falten.

### 3.4 Reglas que mandan en todo el acto (v3)

- **La regla de Luzterna no se dice.** Se dijo una vez en H67 y no se repite: ni en boca de ella, ni de otros, ni en tarjetas.
- **Nada visible sobre su mortalidad**: ningún cambio en su cuerpo (no toca el piso, no tiene frío, no se le queda tinta), nadie que «sepa» y avise, nada de tejido a la vista.
- **Siempre flota** y **todo lo carga con el haz de la linterna**.
- **Las presentaciones del Acto III dicen el peligro de Canelo con todas sus letras** en LO QUE ARRIESGAMOS, con la letra de ella, **que nunca se nombra a sí misma**.
- **Las señales de Canelo son serias**: la llama que baja con cada cruce, la página del Eco, el testamento en serio, el desmayo y la llama al 60 % para siempre.
- **H87 no es «la película de su vida»**: es **el expediente de los Correctores** y ella contesta «culpable».

### 3.5 Beats que persisten

| Misión | Beats |
|---|---|
| H83 | `b83_llegada` · `b83_pp` · `b83_encuadernadora` · `b83_cierre` |
| H84 | `b84_finales` (las 3 elecciones de final, guardadas) · `b84_lobo` (F19 vista) · `b84_testamento` · `b84_brecha` |
| H85 | `b85_pp` · `b85_ficha` · `b85_derrumbe` · `b85_oscuridad` · `b85_grua` |
| H86 | `b86_recado` · `b86_plan` (F21 vista) · `b86_regreso` |
| H87 | `b87_pp` · `b87_fase1` · `b87_nowey` · `b87_azotea` (elección: el mapa para Brecha, guardada) |
| H88 | `b88_pp` · `b88_fase1` · `b88_distor` · `b88_cierre` |

**Regla:** una película de canción vista no se repite al recargar. **H88 no se encadena con H87**: después de la azotea, el juego vuelve a la Carta ([TEMP-N20]).

### 3.6 Accesibilidad

- **Reducir movimiento:** las vueltas de hoja pasan a fundido; las páginas inclinadas de F20 se quedan rectas; la pantalla partida de F25 pasa a un fundido cruzado entre las dos mitades.
- **Reducir destellos:** máximo 3 destellos por segundo siempre; en F24 y F25 el *glitch* se cambia por un **barrido lento** (los bloques se deslizan en lugar de parpadear).
- **La oscuridad de H85:** nunca negro absoluto más de 1,5 s sin un punto de referencia (los ojos de los gatos aparecen antes); con «Reducir destellos», los ojos se encienden en fundido, no de golpe.

## 4. Temperatura del acto (lo que tiene que sentir el jugador)

| Misión | Pico | Valle | Lo que se lleva |
|---|---|---|---|
| H83 | La batalla contra La Encuadernadora | La llegada, el libro enorme | Maravilla; la tinta todavía obedece; huellas de lobo entre los cuentos |
| H84 | El FIN sobre el Lobo | El testamento de Canelo, escrito solo | Lo escrito se puede terminar; **el Canelo de otra caja no volvió**; Canelo se despide por escrito |
| H85 | La biblioteca que se derrumba | **La oscuridad** y el barco en silencio | Tu letra en la ficha; **Canelo se desmaya**; ella apaga la luz y los gatos ven por ella |
| H86 | «No, wey» quemando el pergamino | «Yo los traje» | Su luz trajo a los Titiriteros; **van por los ojos de Canelo** |
| H87 | **No wey** | La azotea, el plan de las donas | Ella sabe pelear; «culpable» y orgullosa |
| H88 | **DISTOR**, el desfase | Las páginas que caen como nieve | Los Disruptores se parten; Esquirla se va a POP |

## Preguntas para TEMPERATURA

1. **H85, la oscuridad:** para justificar que apague la luz, Cerito **parpadea** (la luz lo sostiene) mientras dura la oscuridad, y vuelve a estabilizarse cuando ella la prende afuera. Es una siembra honesta del plan de H86 («una luz que la guíe»). ¿Suma, o la escena se carga demasiado y deja de leerse como **su** valentía?
2. **H84, el testamento:** lo escribe Canelo solo, de noche, y el jugador lo ve escribirse letra por letra. ¿Es una bandera de Canelo suficientemente ruidosa, o su última línea («díganle a la Luz que gracias por buscarme siempre») hace mirar a Luzterna?
3. **H87, la azotea:** el plan de las donas termina en un chiste de ella («que nos encuentren comiendo»). ¿Queda claro que el plan es esconder **a Canelo y a Cerito** y no a ella, sin que nadie pregunte «¿y tú?»?

## Necesidades para ARTE / MÚSICA / CINE / MECÁNICAS

- **ARTE:** Harry Gatter (de ARTE), La Encuadernadora (élite), **El Lobo** con gorro y camisón de abuela, **Garbancito** (del tamaño de un garbanzo, con pañuelo de Disruptor), Brecha y Esquirla en acuarela de Libros, La Mano con su uña-plumín, Bisagra (si no le das el mapa a Brecha), la ficha original de REGISTRO 000 (con tu letra y un número tachado), la página del Eco, el testamento.
- **CINE:** libro abierto con pliegue y vueltas de hoja; libro desplegable (F18), Doré (F19), expresionismo (F20), cuaderno de Leonardo con escritura de espejo (F21), plano técnico blanco (F22), noir de un color (F23), señal pirata (F24), *datamosh* (F25); **la oscuridad de H85** con ojos de gato que guían; el haz como grúa.
- **MÚSICA:** `nowey.melodia` (F18), `fut.fosa` (F19, F20), pieza propia de laúd y cuerdas (F21), «Lo que no dije» (F22), No wey completa (F23), **el puente «Señal rota»** en la cola de F23, «Señal rota» (F24), DISTOR c25 → fin (F25).
- **MECÁNICAS:** regla de dimensión «Capítulos»; «La biblioteca se derrumba» (sobrevivir 4 turnos); «Corrección»; «Esquirlas»; la actividad «Finales perdidos» con 3 elecciones guardadas y **el final del Eco bloqueado hasta H96**; la elección del mapa para Brecha (cambia F25 y la fase 1 de H93); el indicador de la llama de Canelo al 60 % desde H85; una línea de la Bitácora que se escribe sola con la letra del Capi (H85).
