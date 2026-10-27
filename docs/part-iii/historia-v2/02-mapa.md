# 02 · Mapa v2: actos → capítulos → misiones

> ⚠️ **SPOILERS de toda la Parte III.**
> Agente NARRATIVA · ronda 4 · 2026-10-26. Base: `../03-actos-y-capitulos.md` (se queda como historial). La historia y sus razones están en `01-biblia-v2.md`; las películas, en `03-peliculas.md`.
> **Revisión:** aplicadas las pasadas 1, 2, **3** (P1–P8, v3 de `../temperatura/04` §11.5), **4** (Q1–Q11, ronda C) y **5** (R1–R9, ronda D) de TEMPERATURA. La pasada 3 manda: silencio total sobre la mortalidad de Luzterna (la regla solo en H67), tejido secreto, sin contador cómico de Canelo, y **la muerte de Canelo con capítulo propio (H94)**.
> **H66–H69 quedan como están construidas.** Los ids de misión llegan hasta **H99** como máximo (regex de `missions.ts`). Esta v2 usa **H66–H97** y deja **H98–H99 de reserva**. Lo que no cabe en una H va como **beat de película**, **cadena lateral** o **subpaso** (marcado para MECÁNICAS).

## 0. Reglas del mapa

1. **Cada batalla de historia tiene una película de presentación** (PP) antes, de 20–60 s, sin interacción, solo con música derivada. Cuenta, en este orden:
   1. **DÓNDE** estamos (título con el estilo de la dimensión);
   2. **QUÉ PASA**;
   3. **POR QUÉ IMPORTA**;
   4. **EL RIVAL Y SU REGLA** (la regla se **muestra** con una acción, no solo se lee);
   5. **LO QUE ARRIESGAMOS**, con la letra de Luzterna en la Bitácora (y con la del Capi desde la muerte de Luzterna, en H94; ver `01` §4.5).
2. **Batalla de historia** = la batalla que cumple una misión (élite o jefe de ruta, encuentro de historia o batalla especial). Las batallas de actividad (La Ronda, Patrulla, Entrenamiento, Finales perdidos, La Gira) **no** llevan PP completa: llevan una tarjeta de 5–10 s con el estilo de su actividad.
3. **Cada capítulo dice qué entiende el jugador antes y después.** Si el «después» no se puede ver en pantalla, no cuenta.
4. **Una novedad de sistema por capítulo, como máximo** (regla de `../03` §0).
5. **Las películas de canción no se saltan la primera vez.** Las presentaciones sí, después de verlas una vez. Todo queda en «Volver a ver».
6. **Ritmo:** después de un pico de energía va un valle antes del siguiente (TEMPERATURA `01` §2.5). Cada acto tiene al menos un capítulo de respiro (♥) sin batalla obligatoria.

**Claves de las tablas:** **PP** película de presentación · **PC** película de canción · **PH** película de historia (escena hecha película, sin canción original) · ♥ respiro.

---

## 1. Panorama

| Parte | Caps. | Misiones | Dimensión (multiverso) | Novedad de sistema | Canciones | Tiempo propuesto |
|---|---|---|---|---|---|---|
| **Prólogo** «Una noche nomás» | P1–P3 | H66–H68 | Borracha (La Tele) | El segundo mapa | Drunck | 20–25 min (construido) |
| **Acto I** «La noche que no se reinicia» | 1.1–1.6 | H69–H74 | Borracha (La Tele) + La Cuadra 8 | Regla «Mareo» | **EM%EN**, **OH SHIT** | 2 h – 2 h 20 |
| **Acto II** «Se rompen las cajas» | 2.1–2.8 | H75–H82 | Superhéroes (El Cómic) · Anime (El Shōnen) | «Onomatopeya» · rareza Multidimensional · «Poder» | Daria | 3 h – 3 h 30 |
| **Acto III** «Lo que está escrito» | 3.1–3.6 | H83–H88 | Libros (La Biblioteca) | «Capítulos» + actividad «Finales perdidos» | **No wey**, **DISTOR** | 2 h 15 – 2 h 45 |
| **Acto IV** «La gira» | 4.1–4.4 | H89–H92 | POP (La Gira) | «Ritmo» + actividad «La Gira» | **NO G@ME NO LIF€**, xti es amor | 2 h – 2 h 20 |
| **Final** «Se apaga» | F1–F5 | H93–H97 | Tu isla y el bar | La noche sin Canelo (escena sin reloj) y la oscuridad | **SADIE** | 75–100 min, sin prisa |
| **Total** | 32 caps. | **32 misiones** (H66–H97) | | | 9 canciones | **≈ 10 h 45 – 12 h 15** (de ellas, ≈ 52 min de películas) |

**Batallas de historia (16), cada una con su PP:** H69 (B-5), H71, H73, H74, H75, H76, H77, H79, H81, H83, H85, H87, H88, H89, H91, H93.

---

## 2. Prólogo «Una noche nomás» (construido; no cambia)

| Cap. | Misión | Qué pasa | Películas | El jugador entiende ANTES → DESPUÉS |
|---|---|---|---|---|
| P1 | H66 «La última ronda» | El bar, el Momento Drunck, el oyente dormido | F00 Drunck (construido) | No sabe dónde está Canelo → **Canelo se fue a olvidar a otra caja, y allá habla** |
| P2 | H67 «¿Dónde andabas, gordo?» | La calle con Luzterna; el despertar de REGISTRO 000 | — (escena construida) | Canelo anda borracho → **REGISTRO 000 despertó y lo siguió; rompió la gatera** |
| P3 | H68 «La Carta de las Cajas» | Luzterna dibuja la Carta; Maneki cobra la llave | — (escena construida) | Hay rasgaduras → **hay un mapa nuevo, lo dibuja ella y la Borracha está abierta** |

**La lista «Cosas que ya no me pueden pasar» ya no se ve en H68** [TEMP-P3]: es una hoja que Luzterna esconde detrás del mapa y solo aparece en «Lo que quedó», después de la muerte (`01-biblia-v2.md` §4.3). H68 queda exactamente como está construida.

---

## 3. Acto I «La noche que no se reinicia» (La Tele + La Cuadra 8)

**Pregunta del acto:** ¿qué rompió Canelo al irse?
**Respuesta:** REGISTRO 000 rompe todo lo que cruza; los Titiriteros bajaron como gatos para atraparlo; los Disruptores lo quieren de bandera.
**Pregunta mayor:** ¿adónde lleva la rasgadura del baño?
**Arco de Canelo en el acto:** de esconderse a **hacerse cargo en público** (H73).

| Cap. | Misión | Objetivo emocional | Batalla de historia | Películas | Entiende ANTES → DESPUÉS | Cambio visible | Tiempo |
|---|---|---|---|---|---|---|---|
| 1.1 | **H69 «La mañana que no llegó»** (construida) | Comedia y extrañeza | **B-5 élite «Oficial Dona»**: cada dona que se come lo cura (hay 3 en su cubierta) | F01 PP «Oficial Dona» (**opcional**, retroadaptada) | Hay huellas → **la Borracha no se reinició: algo pasó por aquí y dejó marca** | Cartel «SE BUSCA: CANELO · DEBE 14 RONDAS» | 25–30 min |
| 1.2 | **H70 «Borrón»** | Curiosidad y simpatía por «el enemigo» | — (actividad: compartir donas) | F02 PH «El precio de bajar» (teatro de sombras) | Hay un gato con una mano marcada → **los Titiriteros se escribieron como gatos para atrapar «el folio cero»; perdieron el lápiz; olvidan; abajo todo se acaba** | Ficha de Borrón en el Catdex con 6 líneas; una se tacha sola | 12–15 min |
| 1.3 | **H71 «NINGUNA CAJA ES HOGAR»** | Adrenalina | **Brecha** en La Última Ronda. Regla: **sillas voladoras** (escombro que se mueve con el Mareo y sirve de cobertura un turno) | F03 PP «NINGUNA CAJA ES HOGAR» (esténcil de propaganda) | Los Disruptores existen (Parte II) → **regresaron, le dicen «La Llave» a REGISTRO 000 y lo quieren de bandera. Grafitera duda.** (Una silla perdida atraviesa a Luzterna: gag de fantasma, sin comentario) | Grafiti en la ruta 2 (más difícil, mejores premios) | 18–22 min |
| ♥ 1.4 | **H72 «La resaca»** | Calma, cariño, risa | — | F04 PH «La mañana en blanco y negro» (cine mudo, 4 viñetas que se exploran) | Canelo perdió la bufanda → **la linterna se inclina sola hacia las rasgaduras: la luz las nota.** Homiau se acuerda de anoche por primera vez en su vida | Canelo recupera la bufanda | 15–20 min |
| 1.5 | **H73 «La Batalla de Gatos»** [V2] | Vergüenza → orgullo | **EMIAU y su pandilla** en el karaoke convertido en estacionamiento. Regla propuesta: **«Rima»** (repetir elemento dos turnos seguidos: el público abuchea y ese tiro pega −20 %; variar suma combo). La fase 1 se juega; la canción cierra la batalla | F05 PP «La Batalla de Gatos» (*flyer* fotocopiado) · **F06 PC EM%EN «Cuadra 8»** (completa) | El barrio culpa al «gato naranja» de que ahora todos se acuerdan de sus noches → **Canelo confiesa en el escenario y el barrio lo perdona. EMIAU le cuenta que la rasgadura está detrás del baño y que El Cadenero no deja pasar a nadie desde esa noche.** «Si alguien paga, pago yo» | El cartel «SE BUSCA» cambia a «SE BUSCA: CANELO · YA NO DEBE NADA (DEBE 13)». **H73 termina en calma**: un plano quieto, sin música, de 5–8 s (el valle antes de H74). **Hipólito se une** (los sigue dormido; antes se unía con El Cadenero) | 25–30 min |
| 1.6 | **H74 «El Cadenero»** | Triunfo y un aviso inquietante | **B-9 jefe «El Cadenero»**. Regla propuesta: **«Lista VIP»** (cada turno «revisa» a tu gato más fuerte y ese no dispara; el que lo derribe gana el turno) | F07 PP «El Cadenero» (cartel de lucha libre) · **F08 PC OH SHIT «Caída por el multiverso»** (fragmento) | La rasgadura está detrás del baño → **Borrón, en silencio (solo zumba el neón): «No sigan. Mis jefes vienen siguiendo una luz»; mira solo la llama de Canelo, que parpadea [TEMP-Q5]. OH SHIT arranca desde ese silencio. Cruzamos: las cajas son multiversos y se están mezclando.** La llama de Canelo baja con cada pared rota | Se abre Superhéroes en la Carta (con dinero, huellas e historia) | 30–35 min |

### 3.1 Tarjetas de la Bitácora (Acto I)

| Misión | PASA | IMPORTA | QUEREMOS | AHÍ | CAMBIÓ (al terminar) |
|---|---|---|---|---|---|
| H69 | En la Borracha la mañana no reinició | Algo pasó por aquí y dejó marca | Seguir las huellas | Entran a la ruta del Hipo-Mart | REGISTRO 000 rompe todo lo que cruza |
| H70 | Hay un gato con una mano en la pata | Puede saber qué es REGISTRO 000 | Que nos cuente | Está en la Donería y no se quiere ir | Los Titiriteros bajaron como gatos. Y olvidan |
| H71 | Los Disruptores regresaron | Quieren a REGISTRO 000 | Que no se lo lleven | Están en La Última Ronda | Le dicen «La Llave». Grafitera duda |
| H72 | Canelo perdió la bufanda | (Es Canelo) | Encontrarla antes de que me ría | Está en algún lugar de la Borracha | Mi linterna apunta sola a las rasgaduras |
| H73 | El barrio culpa a Canelo de que ya nadie olvida | Sin el barrio no encontramos la rasgadura | Que lo escuchen | En la Batalla de Gatos lo que se dice arriba se respeta | Canelo dijo que fue él. Y que paga él |
| H74 | La rasgadura está detrás del baño del bar | Si no la cruzamos, perdemos el rastro | Pasar al Cadenero | Es la puerta del baño (sí) | Las cajas son muchas cajas. Y alguien viene siguiendo una luz |

---

## 4. Acto II «Se rompen las cajas» (El Cómic + El Shōnen)

**Pregunta del acto:** ¿quiénes nos persiguen y qué quieren?
**Respuesta:** los Titiriteros sangran tinta y olvidan al perder; la luz de Luzterna «llama»; REGISTRO 000 es un gatito que se llama Cerito; La Mano quiere cerrarlo todo.
**Pregunta mayor (punto medio):** ¿por qué La Mano mira así a Canelo?
**Arco de Luzterna en el acto:** de compañera graciosa a **la que le pone nombre a Cerito y le dice que no a La Mano**.

| Cap. | Misión | Objetivo emocional | Batalla de historia | Películas | Entiende ANTES → DESPUÉS | Cambio visible | Tiempo |
|---|---|---|---|---|---|---|---|
| 2.1 | **H75 «La Gato-señal»** | Asombro épico | **S-5 élite «La Pandilla del Ovillo»** (regla de la dimensión: **Onomatopeya**, los golpes fuertes dejan letras sólidas que cubren 2 turnos) | F09 PP «Ciudad Mayúscula» (cómic moderno arácnido) | Caímos en una ciudad de cómic → **la linterna proyecta una silueta de gato en las nubes y los héroes la toman por un llamado: la luz de Luzterna llama** | La Gato-señal en el cielo de la dimensión cada noche | 25–30 min |
| 2.2 | **H76 «Villanos sueltos»** | Responsabilidad | **Encuentro de historia: el villano suelto «El Estambre»** (protege el barco civil: grado de daño) | F10 PP «Villanos sueltos» (periódico que gira) | Los Disruptores abrieron la cárcel «para que respiren» → **romper una caja también suelta lo peor que había dentro. La ciudad cree que somos villanos. Gato Araña se une** | Titular «¿FORASTEROS O VILLANOS?» con tu barco en la foto | 25–30 min |
| 2.3 | **H77 «Cruceta»** | Duda moral | **S-9 jefe «Cruceta»**. A mitad de la pelea salva a un gatito civil y la batalla se pausa un turno | F11 PP «Cruceta» (cómic de Edad de Plata dibujado por él, donde los villanos somos nosotros) | Cruceta nos persigue → **es Titiritero, cree que somos los villanos y sangra tinta: no sabía que podía. Se presenta la rareza Multidimensional: Murciégato se une** y dice «La noche no es mía. Es de los gatos: nosotros sí vemos» | Foto de Cerito en el periódico: «¿QUIÉN ES EL GATO QUE ROMPE LA CIUDAD?» | 25–30 min |
| ♥ 2.4 | **H78 «Cerito»** | Ternura | — | F12 PH «Cerito» (documental de naturaleza con visión nocturna, narrado por Luzterna) | REGISTRO 000 es una mancha de estática → **se acerca al faro, Luzterna lo apoda Cerito, duerme en su luz. Canelo no duerme para seguir viéndolo; en la visión nocturna, sus ojos brillan solos. Luzterna confiesa, en chiste, que le da miedo la oscuridad** (se paga en H85 [TEMP-P2]) | Cerito en tu isla todas las noches, donde elegiste dejarle la cobija | 12–15 min |
| 2.5 | **H79 «El Gran Torneo»** | Fiesta shōnen | **A-5 élite «El rival que no te conoce»** (regla de la dimensión: **Poder**, bajo el 50 % cada gato carga aura una vez) | F13 PP «El Gran Torneo» (avance del próximo episodio) | Las huellas siguen a un mar de torneos → **la única gatera se gana peleando; los luchadores son gatos varados de otras versiones del anime.** Maneki: «Un gato no puede ver por dos mucho tiempo» | La llave del torneo en el mapa | 30–35 min |
| ♥ 2.6 | **H80 «Entrenamiento»** | Risa y compañía | — (actividad: 3 arcos cortos) | F14 PH «Entrenamiento» (*yonkoma*: tiras de cuatro viñetas) | Canelo quiere técnica secreta → **Luzterna es la peor sensei del Archivo; Canelo le enseña a gritar el nombre del ataque («¡RAYO DE… LUZ… TERNA!») y ella se muere de vergüenza** | Canelo estrena un ataque visual (solo en esta dimensión) | 15–20 min |
| 2.7 | **H81 «Itō»** | Respeto y tensión | **A-9 jefe «Itō»**, la final. Regla: **«Duelo limpio»** (un solo tiro por turno de cada lado; el primero en romper la regla pierde el aura) | F15 PP «Itō» (rollo de ukiyo-e) · **F16 PC Daria «Una sola línea»** (fragmento; cierra la batalla) | Itō es Titiritero y pelea limpio → **los Titiriteros olvidan cuando pierden: Itō olvida el nombre de un compañero frente a ti, para siempre.** Esquirla ataca **a Canelo** por la espalda e Itō lo bloquea: «Al gato no. Así no.» | La ficha de Itō pierde dos líneas en vivo | 20–25 min |
| 2.8 | **H82 «La Mano»** (punto medio) | Amenaza clara | — | F17 PH «La Vocación» (Caravaggio y *La creación de Adán*) | Ganamos el torneo → **La Mano, la mano de luz con lápiz de H49, ahora es gata; ofrece cerrarlo todo «sin dolor» a cambio de Cerito; Luzterna dice que no y su linterna hace rebotar la tinta de La Mano («¡REBOTE!») [TEMP-N5]. Itō se retira. La Mano mira a Canelo: «Ese gato ve demasiado»** | Huella de mano de tinta en el cielo de la Carta; se abre la gatera a Libros | 10–12 min |

### 4.1 Tarjetas (Acto II)

| Misión | PASA | IMPORTA | QUEREMOS | AHÍ | CAMBIÓ |
|---|---|---|---|---|---|
| H75 | El chiquito cruzó a una ciudad de cómic | Ahí la gente está en peligro | Encontrar el rastro | La Gato-señal ilumina dónde cayó | Mi luz «llama» a los que la ven |
| H76 | Hay villanos sueltos | Por el derrame y por los Disruptores | Ayudar a los civiles | La ciudad pide ayuda | La ciudad cree que somos villanos. (Salimos feos en la foto) |
| H77 | Cruceta nos persigue | Es Titiritero y nos culpa | Que nos deje pasar | Cuida la azotea donde cayó 000 | Los Titiriteros sangran tinta. Llegan los Multidimensionales |
| H78 | 000 se acerca al faro | Por primera vez lo vemos de cerca | Que confíe | Mi luz está ahí | Se llama Cerito. Duerme en la luz |
| H79 | Cerito cruzó a un mar de torneos | La única gatera se gana peleando | Ganar el torneo | Es el único camino | Los luchadores son gatos varados |
| H80 | Canelo quiere una técnica secreta | Necesitamos ser más fuertes | Entrenar | Aquí se entrena gritando | El gordo me enseñó a gritar. Ya no me callo |
| H81 | La final es contra Itō | Es Titiritero, pero pelea limpio | Ganarle sin trampa | Es la final | Los Titiriteros olvidan cuando pierden |
| H82 | La Mano bajó por nosotros | Quiere a Cerito | No entregarlo | Está en la gatera del torneo | Le dije que no. Itō se fue. Y miró al gordo |

---

## 5. Acto III «Lo que está escrito» (La Biblioteca)

**Pregunta del acto:** ¿qué es Cerito y por qué lo quieren apagar?
**Respuesta:** su ficha original tiene tu letra; la luz de Luzterna trajo a los Titiriteros; a Cerito lo sostienen la luz y los ojos de Canelo.
**Pregunta mayor:** ¿qué va a hacer La Mano con Canelo?
**Arco de Luzterna:** la culpa («yo los traje»), su valentía (apaga la linterna en H85) y **su batalla**, en la que el enemigo le lee lo que hizo y ella dice «culpable».

| Cap. | Misión | Objetivo emocional | Batalla de historia | Películas | Entiende ANTES → DESPUÉS | Cambio visible | Tiempo |
|---|---|---|---|---|---|---|---|
| 3.1 | **H83 «Ex Libris»** | Maravilla de cuento | **L-5 élite «La Encuadernadora»** (regla de la dimensión: **Capítulos**, la batalla cambia de regla cada 3 turnos) | F18 PP «La Encuadernadora» (libro desplegable) | La Mano huyó a Libros → **en Libros los Titiriteros todavía pueden escribir un poco. Harry Gatter está varado. Hay personajes que se salieron de su cuento** | Las páginas del mapa pasan solas | 25–30 min |
| 3.2 | **H84 «Finales perdidos»** | Tristeza que se puede arreglar | — (actividad: batallas cortas + elección de final) | F19 PH «Lo que se derrama, se termina» (grabado de Doré, niebla) | El derrame borra finales → **el Lobo de Caperucita se salió de su libro y acorrala a Garbancito, que perdió el final de su historia; La Mano le escribe FIN al Lobo y el Lobo se termina. Brecha lo ve. Canelo encuentra la página de un Canelo que no volvió** y escribe su testamento | Los cuentos reparados recuperan color | 25–30 min |
| 3.3 | **H85 «La ficha original»** | Inquietud y valentía | **Batalla especial «La biblioteca se derrumba»**. Regla propuesta: **sobrevivir 4 turnos** mientras caen estantes (escombro grande cada turno); ganar = salir | F20 PP «El índice» (expresionismo alemán) | La primera ficha de Cerito está en el índice → **está escrita con tu letra y tiene un número tachado debajo. La Mano: «Un personaje que escribe.» Cerito huye y rompe la caja; Canelo se desmaya. Para esconder a Canelo y a Cerito de La Mano, Luzterna apaga la linterna por primera vez: tiembla, y los ojos de los gatos la guían hasta la salida** [TEMP-P2]. Ya afuera, lo carga con el haz hasta el barco | La Bitácora agrega una línea con tu letra que no escribiste. La llama de Canelo queda al 60 % para siempre | 20–25 min |
| 3.4 | **H86 «Lo que la luz trajo»** | Golpe emocional | — | F21 PH «El plan» (cuaderno de Leonardo) | La Mano quiere hablar con la farera → **la linterna guió a los Titiriteros hasta aquí: «Yo los traje». El plan: a Cerito lo sostienen la luz y los ojos de Canelo; «sin luz ni ojos, vuelve a vacante». La Mano: «Ciérrale los ojos al gato.» Ella: «No, wey». Después, a Canelo, sin secretos: «¿Qué quería?» / «Tus ojos. Le dije que no.»** [TEMP-P4, R3] | La huella de mano del cielo se oscurece | 10–12 min |
| 3.5 | **H87 «No, wey»** | Orgullo por Luzterna | **Los Correctores** en el muelle de Libros, comandada por Luzterna (su linterna ilumina las trayectorias). Regla propuesta: **«Corrección»** (cada 2 turnos blanquean un módulo tuyo: no se rompe, pero queda sin habilidad hasta que su luz lo toca) | F22 PP «La corrección» (plano técnico blanco) · **F23 PC No wey «El expediente»** (completa; cierra la batalla) | Los Correctores vienen a «corregir» su decisión → **le leen lo que hizo en esta aventura como un expediente de errores y ella contesta «culpable» a cada uno [TEMP-Q6]; el sexto cargo es de Canelo («ROMPER EL REINICIO»), y los dos quedan al frente [TEMP-S3]. Sabe pelear. La Mano no es Correctora: ve rebotar los rayos y renuncia a la luz en voz alta, «La luz no se deja apagar. Entonces, los ojos.» [TEMP-Q1]; el expediente termina con el sello «SENTENCIA: LOS OJOS» sobre la foto de Canelo [TEMP-R5]** En la azotea, su plan en la Bitácora: «esconder al gordo y a Cerito en el faro; cerrar la gatera; comprar donas». Elección: darle o no el mapa de gateras a Brecha | Insignia «Victoria de la farera» en la Bitácora | 30–35 min |
| 3.6 | **H88 «La ruptura»** (no se encadena con H87: se vuelve a la Carta antes [TEMP-N20]) | Rabia y alivio | **L-9 jefe «Esquirla»**. Brecha ayuda un turno si le diste el mapa | F24 PP «Señal pirata» (la presentación hackeada por Esquirla) · **F25 PC DISTOR «Datamosh»** (fragmento; cierra la batalla) | Esquirla quiere usar a Cerito para romper todas las cajas → **los Disruptores se parten. Esquirla huye por una rasgadura a POP** | Se abre la gatera a POP | 20–25 min |

### 5.1 Tarjetas (Acto III)

| Misión | PASA | IMPORTA | QUEREMOS | AHÍ | CAMBIÓ |
|---|---|---|---|---|---|
| H83 | La Mano huyó a Libros | Ahí todavía puede escribir | Alcanzarla antes de que escriba | Es la caja de la tinta | Aquí la tinta todavía obedece. Mala señal |
| H84 | Los cuentos pierden su final | Un Disruptor chiquito perdió el suyo | Devolver los finales | Están en la Biblioteca | Lo que se derrama, se termina. Brecha entendió |
| H85 | En el índice está la primera ficha de Cerito | Puede decir quién lo escribió | Encontrarla | Al fondo de la Biblioteca | Tiene la letra del Capi. El gordo se desmayó |
| H86 | La Mano quiere hablar conmigo | Sabe algo de mi linterna | Escuchar | El índice | Mi luz los trajo. No la voy a apagar |
| H87 | Los Correctores quieren «corregirme» | Quieren quitarme la elección | Sacarlos | Bloquean el muelle | Sé pelear. (Ya sabía) |
| H88 | Esquirla quiere romper todo con Cerito | Los Disruptores se pelean | Detenerla | Tiene la rasgadura a POP | Los Disruptores se partieron |

---

## 6. Acto IV «La gira» (La Gira)

**Pregunta del acto:** ¿qué quiere Firma con «un invitado que no tiene forma»?
**Respuesta:** un show-trampa para Cerito; por su rasgadura La Mano ve **dónde duerme Cerito: en tu faro**.
**Pregunta mayor:** vienen a casa.
**Arco del acto:** la alegría compartida, **la última**. El contraste vuelve más duro el Final.

| Cap. | Misión | Objetivo emocional | Batalla de historia | Películas | Entiende ANTES → DESPUÉS | Cambio visible | Tiempo |
|---|---|---|---|---|---|---|---|
| 4.1 | **H89 «Backstage»** | Euforia | **P-5 élite «El mánager»** (regla de la dimensión: **Ritmo**, la SINCRO abierta a cualquier par del mismo elemento en el beat) | F26 PP «El mánager» (póster de festival y pase de backstage) | Esquirla huyó a POP → **Firma también está aquí y prepara un show con «un invitado sin forma». Gato Malo y Tailor Swift están de gira en una caja que no es la suya. EMIAU es el telonero y se une** | Luces de escenario en el cielo de POP | 25–30 min |
| ♥ 4.2 | **H90 «La gira»** | Alegría compartida | — (actividad: 3 shows) | F27 PH «Karaoke» (fotomatón: tira de 4 fotos con letras de karaoke) | Hay que infiltrarse → **Luzterna canta horrible y no le importa; Canelo la abuchea y termina a dúo. Su deseo: «Algún día quiero oír a este gordo hablar en casa. Aunque sea para pedir pescado.»** En el camerino, la llama de Canelo baja sola mientras duerme. Eliges **una foto** | La foto elegida (se toca sobre la tira del fotomatón) queda clavada en la Bitácora (vuelve en SADIE) | 25–30 min |
| 4.3 | **H91 «Firma»** | Heroísmo de Luzterna | **P-9 jefe «Firma»**. La fase 1 se juega; la canción cierra | F28 PP «Firma» (portada de revista y teaser de video) · **F29 PC NO G@ME NO LIF€ «El show»** (completa) | El show es una trampa → **Esquirla secuestra el show, la caja POP se rompe, Luzterna detiene con el haz lo que cae sobre Firma, y por la rasgadura La Mano ve tu faro, la cobija de Cerito y el hueco tibio donde duerme Canelo, bajo su palmera** | Una rasgadura de POP a tu isla; se cierra sola, pero ya la vieron | 25–30 min |
| ♥ 4.4 | **H92 «La noche estrellada»** | Paz: que el jugador quiera quedarse | — | **F30 PC xti es amor «La noche estrellada»** (completa; Van Gogh) | Volvemos a casa → **es una noche buena. Canelo comparte su pescado con Cerito y con Luzterna (ella lo huele, como el pan dulce de H72). Junto al fuego, Cronos, sin mirar a nadie: «Una bufanda en el suelo y alguien que no se levanta.» Nadie voltea; Canelo se rasca la llama, que le baja sola cuando se duerme** [TEMP-P1, P3]. Antes de la película, **un tramo jugable** de 30–90 s; **xti arranca cuando el jugador toca el faro** [TEMP-N14] | Cerito duerme en la cobija; el faro barre suave | 12–15 min |

**Lo que cambió del diseño viejo:** el antiguo H92 «Se acerca una luz» (Itō avisa) **ya no es misión**: es la presentación de la batalla final (F31). Así el aviso llega justo antes de pelear y la numeración de H93 en adelante es la misma que en `../03`.

### 6.1 Tarjetas (Acto IV)

| Misión | PASA | IMPORTA | QUEREMOS | AHÍ | CAMBIÓ |
|---|---|---|---|---|---|
| H89 | Esquirla huyó a POP | Firma también está aquí | Encontrarlas | POP es un escenario gigante | Hay estrellas de otras cajas de gira |
| H90 | Firma anuncia un show con «un invitado sin forma» | Habla de Cerito | Infiltrarnos en la gira | La gira es la única entrada | Tengo una foto del viaje. El gordo salió con la boca llena |
| H91 | El show es una trampa | Cerito puede caer | Romper la trampa | Es en el escenario principal | La Mano sabe dónde duerme Cerito |
| H92 | Volvemos a casa | Hace mucho que no dormimos en casa | Descansar | Es tu isla | Cerito ya duerme toda la noche |

---

## 7. Final «Se apaga» (tu isla y el bar)

**Se conserva `../08` completo, con los cambios de `01` §4.7 y §9.**

| Cap. | Misión | Objetivo emocional | Batalla de historia | Películas | Entiende ANTES → DESPUÉS | Cambio visible | Tiempo |
|---|---|---|---|---|---|---|---|
| F1 | **H93 «La noche más oscura»** | Lucha y la muerte falsa | **Fase 1 «El asedio»** (perdible, se reintenta) | **F31 PP «Se acerca una luz»** (realismo con tormenta; Itō avisa y se inclina solo ante Canelo) · **F32 PH «La caída»** | Vienen por Cerito, por la luz y por los ojos de Canelo → **Luzterna: «Al gordo no» [TEMP-Q7]; el trazo le apaga la llama a Canelo, su bufanda cae al suelo y no se levanta. La batalla termina en silencio, sin pantalla de victoria** | La casilla de Canelo, gris. CAMBIÓ, con la letra de ella, temblando: «SIN LLAMA.» | 20–25 min |
| F2 | **H94 «Sin llama»** [TEMP-P5] | La noche sin él, el alivio, la tragedia | **Fase «A oscuras»** al final: corta y sin derrota posible, con el input MIRA; sin PP [TEMP-R9b] | **F33 PH «La noche sin Canelo»** (escena interactiva sin reloj) · **F34 PH «Antes del amanecer»** (el regreso, el alivio, el golpe) · **F35 PC SADIE «Linterna mágica»** (completa) · **F36 PH «MIRA»** (visión de gato) | Canelo no se levanta → **Luzterna no puede prenderle la llama y le dice el recado completo a un Canelo que no la oye [TEMP-S2]; los gatos lo velan; La Mano vigila desde su barco los ojos cerrados de Canelo [TEMP-R1, Q10]; antes del amanecer, Cerito le devuelve la llama, al 30 % para siempre [TEMP-Q8]; el barco se va a contraluz, sin que se vea la proa [R4, S1]; La Mano reaparece levantándose de una gota de tinta. Alivio (con desayuno opcional, R8). La Mano: «La luz cuida lo que alumbra. A quien la carga, no. …Entonces la luz primero.» La mata. Los gatos ven en la oscuridad. Cerito elige ser gato «por ahora». La Mano se queda quieta** | El faro se apaga; solo brillan los ojos de tus gatos | 25–35 min |
| F3 | **H95 «Lo que no se ve»** | Duelo | — | **F37 PH «La Mano»** (la escena completa, con costo) · **F38 PH «La vigilia»** (plano secuencia hasta el amanecer) | La pelea terminó → **Canelo, con la bufanda de ella, se planta frente a La Mano y los ojos de los gatos la miran [TEMP-Q11]; no puede tachar a Cerito; su ficha se borra como la de Itō, empezando por «Antes: una mano» [TEMP-Q9]; deja la linterna rota en el escalón. Los gatos velaron toda la noche** [TEMP-P8] | Estado `p3_sin_luz` | 10–15 min |
| F4 | **H96 «El recado»** | Despedida | — | **F39 PH «El recado»** (la pintura del juego, luz naranja) · créditos (piano de SADIE sobre la Carta) · **«Continuará»** | Ella ya no está → **le dices a Canelo el recado que ella le dijo cuando no la oía [TEMP-Q10, S2]; Canelo pone la linterna rota en el estante, prende el faro con su llama chiquita y vuelve a la página** | Faro naranja; linterna rota en el estante; Canelo duerme en la página | 15–20 min |
| F5 | **H97 «La última ronda»** (sale la próxima vez que abres la Carta) | Duelo que sigue | — | **F40 PH «La última ronda»** (la caricatura sin risas grabadas) | Canelo volvió al bar → **no se toma el trago del olvido. «Ella siempre venía a buscarme.» / «¿Y luego?» / «Luego me acuerdo de ella. Todos los días.»** | Se abre el post-juego, en silencio | 5 min |

### 7.1 Tarjetas (Final)

| Misión | PASA | IMPORTA | QUEREMOS | AHÍ | CAMBIÓ |
|---|---|---|---|---|---|
| H93 | Vienen esta noche | Vienen por Cerito y por la luz | Que no se lo lleven | Es casa | *(letra de ella, temblando)* SIN LLAMA. |
| H94 | El gordo no se levanta | Es el gordo | Que vuelva | Es su palmera | *(letra del Capi)* Luzterna murió. Cerito eligió ser gato |
| H95 | La pelea terminó. Ella no | La isla está a oscuras | Quedarnos con ella un rato | Es su faro | La Mano se olvidó de su nombre. Los gatos velaron toda la noche |
| H96 | Ella ya no está | Le prometiste algo en la Parte I | Cumplir | Canelo está en el faro | El faro tiene luz de nuevo. No la suya |
| H97 | Canelo volvió al bar | Ahí empezó todo | Acompañarlo | La Última Ronda | Se acuerda. Todos los días |

**La tarjeta de H94 la empieza ella y la termina el Capi:** PASA, IMPORTA, QUEREMOS y AHÍ los escribe ella esa noche, junto a Canelo. CAMBIÓ sale con la letra del Capi. Su último trazo en la Bitácora es esa tarjeta, donde, otra vez, no se anotó.

---

## 8. Lo que no es misión: cadenas laterales, subpasos y beats de película

### 8.1 Cadenas laterales «Cruces del multiverso» [V2, para MECÁNICAS]

Para tener **muchos más gatos** sin gastar ids H. Cada dimensión tiene una cadena de 2–3 pasos que recluta parodias de su multiverso. Aparecen por avance, nunca por reloj. Propuesta de ids: `p3x_<dim>_<n>` (fuera del regex H; MECÁNICAS decide el espacio de nombres).

| Cadena | Dimensión | Se abre con | Qué es | Recluta |
|---|---|---|---|---|
| «El vecino de la dona» | Borracha | H72 | Homiau perdió su dona de la suerte en la Planta Embotelladora (B-6) | **Homiau Gatson** |
| «Variantes» | Superhéroes | H77 | Tres Gatos Araña de otras versiones caen por la misma rasgadura; hay que devolverlos (o no) | Gato Araña Noir · Gata Araña · Gato Araña 2099 |
| «Héroes de reserva» | Superhéroes | H77 | Patrullas especiales | Supermichi · Hambrón · Gatopool · Gata Maravilla |
| «La aldea y el mar» | Anime | H80 | Los arcos de entrenamiento en dificultad alta | Gomitas · Kagebunyan · Príncipe Bigotón · Sailor Michi · Gatojo |
| «Sección prohibida» | Libros | H84 | El desvío de la biblioteca | Gatodalf · Sherlock Ronrones · Don Gatote · Frankengato · Sonrisa |
| «La fila» | POP | H90 | Los fans y los camerinos | Billie Bigotish · Shakimiau · Michimami · La Michota · Peso Pelusa · Divo de Gatárez · Lady Gata · The Miauknd · Ed Tangerino · Freddie Mercurio · El Rey del Ronroneo |

Cada cadena cierra con **una película corta de presentación del gato** (8–15 s) en el estilo de su versión, que muestra sus 3 rasgos (`01` §6.2). No es una PP de batalla: es una «tarjeta de estrella». CINE puede hacer una plantilla por multiverso.

### 8.2 Subpasos dentro de una misión

| Misión | Subpasos (beats que persisten, para recargar sin perder el lugar) |
|---|---|
| H73 | `b73_flyer` (PP vista) · `b73_fase1` (batalla) · `b73_emen` (película) · `b73_despues` |
| H74 | `b74_pp` · `b74_cadenero` · `b74_borron` (el aviso) · `b74_ohshit` (película) |
| H85 | `b85_indice` · `b85_ficha` · `b85_derrumbe` (batalla) · `b85_carga` |
| H87 | `b87_pp` · `b87_fase1` · `b87_nowey` · `b87_azotea` (elección de Brecha) |
| H91 | `b91_pp` · `b91_fase1` · `b91_show` · `b91_rasgadura` |
| H93 | `b93_pp` · `b93_asedio` · `b93_caida` |
| H94 | `b94_noche` · `b94_amanecer` (la llama vuelve; el alivio; el golpe) · `b94_sadie` · `b94_oscuras` · `b94_ojos` |

Regla de recarga (de `../13` y de la Parte II): **una película de canción vista no se repite al recargar**; se retoma en el subpaso siguiente. En H94: **SADIE nunca se repite**; si caes en la fase «A oscuras», se reintenta solo esa fase.

### 8.3 Beats de película sin misión

| Beat | Dónde | Qué es |
|---|---|---|
| Tarjetas de estrella | Cadenas laterales (§8.1) | Presentación de cada parodia reclutada |
| Tarjetas de actividad | La Ronda, Patrulla, Entrenamiento, Finales perdidos, La Gira | 5–10 s con el estilo de la actividad |
| «Lo que quedó» | Bitácora, después de «Continuará» | Los premios del final, en silencio, y **la lista escondida** detrás del mapa (la 5 se tacha sola con la letra del Capi) |
| El parpadeo de afuera | Post-juego (`../08` §7) | Sin texto |

---

## 9. Tabla de conversión: numeración vieja (`../03`) → nueva

| Vieja | Título | Nueva | Nota |
|---|---|---|---|
| H66–H72 | Prólogo, H69–H72 | **H66–H72** | Igual |
| — | — | **H73** «La Batalla de Gatos» | **Nueva** (EM%EN) |
| H73 | El Cadenero | **H74** | + OH SHIT |
| H74 | La Gato-señal | **H75** | |
| H75 | Villanos sueltos | **H76** | |
| H76 | Cruceta | **H77** | |
| H77 | Noche de tele | **H78** «Cerito» | Cambia de título |
| H78 | El Gran Torneo | **H79** | |
| H79 | Entrenamiento | **H80** | |
| H80 | Itō | **H81** | Daria |
| H81 | La Mano | **H82** | |
| H82 | Ex Libris | **H83** | |
| H83 | Finales perdidos | **H84** | |
| H84 | La ficha original | **H85** | Ahora con batalla especial |
| H85 | Lo que la luz trajo | **H86** | |
| H86 | No, wey | **H87** | No wey |
| H87 | La ruptura | **H88** | DISTOR |
| H88 | Backstage | **H89** | |
| H89 | La gira | **H90** | |
| H90 | Firma | **H91** | NO G@ME NO LIF€ |
| H91 | Última noche tranquila | **H92** «La noche estrellada» | xti es amor; cambia de título [TEMP-P3] |
| H92 | Se acerca una luz | — | **Se funde** con la PP de H93 (F31) |
| H93 | La noche más oscura | **H93** | Ahora termina con la caída de Canelo |
| — | — | **H94** «Sin llama» | **Nueva**: la noche sin Canelo, el golpe y SADIE [TEMP-P5] |
| H94 | Lo que no se ve | **H95** | La Mano con costo + la vigilia |
| H95 | El recado | **H96** | + créditos y «Continuará» |
| H96 | La última ronda | **H97** | |
| H97–H99 | Reserva | **H98–H99** | Reserva |

---

## Preguntas para TEMPERATURA

**Contestadas en la pasada 1 y aplicadas:** dos canciones en el Acto I alcanzan si H73 termina en calma y OH SHIT arranca desde el silencio del aviso de Borrón (hecho en H73 y H74); tramo jugable entre NO G@ME y xti (hecho en H92, N14); los respiros del Acto II dan valle suficiente; la tarjeta de H76 reporta lo que dice la ciudad (N2).

**Nuevas:**
1. Las **cadenas laterales** (§8.1) se abren por avance y reclutan muchas parodias. ¿Alguna cae en un tramo donde el humor tapa algo importante (por ejemplo, «La fila» de POP justo antes de H91)? Si sí, la muevo al post-juego.
2. H85 tiene ahora **batalla especial** (sobrevivir 4 turnos a la biblioteca que se derrumba) antes del desmayo. ¿La batalla sube la tensión o le roba el valle de silencio (S6) que pedías después del desmayo? El silencio va **después** de la batalla, en el barco.

## Necesidades para ARTE / MÚSICA / CINE / MECÁNICAS

**MECÁNICAS**
- Numeración H70–H97 (§9). `isPart2Mission` ya acotado a H31–H65 (hecho en la porción); verificar que las H70+ nuevas tampoco caigan en el registro ni en el reinicio de la Parte II.
- **Reglas de batalla propuestas** (confirmar, cambiar o reemplazar): «Rima» (H73), «Lista VIP» (H74), «Duelo limpio» (H81), «La biblioteca se derrumba» (H85, sobrevivir 4 turnos), «Corrección» (H87). El resto usa las reglas de dimensión de `../05` §3.
- **Las canciones cierran batallas** en H73, H81, H87, H88 y H91, como en la Parte II (la película arranca al ganar la fase 1 y la batalla termina con `reason: 'momento'`). En H93, SADIE va **entre** fases, nunca como cierre.
- Subpasos y beats que persisten (§8.2). Cadenas laterales con ids fuera del regex H (§8.1).
- **Bloqueo** [TEMP-N17]: en «Finales perdidos», el final de la página del Eco de Canelo («…Ella no volvió.») solo se puede restaurar con **H96 hecha**. Antes, aparece como «final ilegible».
- **H88 no se encadena con H87** [TEMP-N20]: al terminar la azotea, el juego vuelve a la Carta.
- La Bitácora: tarjetas de 5 campos con cambio de letra en H94; llama de Canelo como indicador; **la lista escondida**, que solo aparece en «Lo que quedó».
- **H93** termina con la caída de Canelo, **sin pantalla de victoria**. **H94 «Sin llama»**: escena nocturna sin reloj (casilla de Canelo gris, ficha «SIN LLAMA», su tema fuera, gatos tocables), el regreso, el alivio, el golpe, SADIE y la fase «A oscuras» con MIRA (sin PP). Nunca un objetivo de «protégela».

**ARTE**
- Jefes y rivales con ficha nueva: El Cadenero, EMIAU y su pandilla, El Estambre (villano suelto), «El rival que no te conoce», La Encuadernadora, El mánager. Los Correctores ya existen (Parte II).
- Las parodias de las cadenas laterales (§8.1) y sus «tarjetas de estrella».

**CINE**
- Una plantilla de **tarjeta de estrella** por multiverso (§8.1) y de **tarjeta de actividad** (§8.3).

**MÚSICA**
- Una variación derivada por presentación (16) y por actividad; lista en `03-peliculas.md`.
