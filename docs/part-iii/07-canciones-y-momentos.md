# 07 · Inventario verificado de canciones y propuesta audiovisual

Las marcas [DUEÑO], [CANON], [PROPUESTA] y [ABIERTO] significan lo mismo que en `02`.

**Fuente única de los datos musicales:** `investigacion/soundtrap.md`, del agente MUSICA, 2026-10-13. Ese informe trae el método, las tablas de regiones por pista y los límites.

**Cómo se obtuvieron los datos.** Se inspeccionaron los 5 proyectos en el Chrome del dueño, con su sesión, **sin modificar nada**: la versión y la fecha de edición son las mismas antes y después.

## 0. Lo que se puede afirmar y con qué nivel de certeza

| Nivel | Qué significa | Ejemplos |
|---|---|---|
| **OBSERVADO** | Leído del mismo JSON que carga el editor de Soundtrap y cruzado con la UI. Los compases son **exactos**: cada región guarda su inicio y su largo | Tempo, tono, compases, pistas, regiones y automatizaciones |
| **MEDIDO** | Señal tomada durante la reproducción, **antes** de los faders y los efectos, con resolución de ~21 ms. **Solo en Drunck y SADIE.** Sirve para la estructura, **no para sincronizar** | Caídas de graves, patrón del bombo, ataques del piano |
| **INFERIDO** | Lectura musical del agente o del director: nombres de secciones, intención y acordes | «Drop», «clímax», progresiones |
| **ESCUCHADO** | **Nadie lo escuchó con oído humano.** Ningún dato de este documento viene de escuchar | — |

**Drunck ya tiene sincronías de SEÑAL** (beat map y onsets en el juego). **Las de las demás canciones quedan pendientes** hasta construir sus Momentos. Este documento ancla cada evento a un **compás exacto observado**. El milisegundo de cada golpe sale del archivo exportado, con `onsets.py`, como en la Parte II (`docs/part-ii/29` §6.1).

---

## 0.1 Contraste con los audios reales (2026-10-13, tarde) [SEÑAL]

El dueño exportó las 5 canciones a `~/Desktop/NO ONE LIKE CATS SONGS/`. Se copiaron con SHA-256 a `audio-derivados/originales/parte-iii/` y su carpeta no se tocó. El agente D las midió; el informe completo está en `investigacion/audio-real.md`.

- **Mapeo archivo ↔ proyecto confirmado** compás por compás: Drunck v6, No wey v306, Daria v306, xti v142 y SADIE v223.
- **Compás 1 = 0,000 s** en las 5 (el cebado de LAME ya viene recortado por ffmpeg y los navegadores). El tempo es exacto, sin deriva.
- **Lo que hay de más en cada archivo** es cola de reverb (en Drunck dura 2,96 s y se oye ~1,6 s). **SADIE no tiene cola**: corta en seco en 172,800 s.

**Correcciones al EDITOR que la señal impone** (ya aplicadas a las hojas de abajo):

| Canción | Lo observado en el editor | Lo medido en la señal |
|---|---|---|
| Drunck | El filtro se abre hasta c48 | La apertura audible **termina en c47** (66,9 s) |
| Drunck | Respiros en c16, c32 y c48 | Confirmados, y **uno más en c40**, justo antes del redoble |
| SADIE | Golpes «Error» en c8,875, c13, c29 y c31 | Confirmados c8,875, c29 y c31. **El de c13 no se separa** en la señal: queda como guía del editor, sin input encima |
| SADIE | Las cuerdas «suben el nivel» | Solo suben los agudos (escalones de 7,7 y 4,8 dB). El volumen total casi no cambia |
| No wey | Bombo tarde en c33 + 1,4 tiempos | El primer golpe audible cae en **c33 + 1,5** |
| No wey | Corte en c70,125 | No corta: la última nota **se apaga sola** |
| Daria | Hueco de batería en c41 + 1,25 | Los hats vuelven en **c41 + 1,5** |
| Daria | Secciones por volumen | **Pared de volumen** (LRA 0,8): lo que cambia es el brillo (hats, caja, voz). Los cambios visuales se cuelgan de eso, no del volumen |

**Las ubicaciones de las tres canciones nuevas se confirman con estos datos, sin forzar escenas:**
- **No wey** es la más dinámica (LRA 9,6), con un break de solo melodía: sirve para la batalla de Luzterna.
- **Daria** tiene volumen constante y dos silencios cortos y precisos: sirve para el duelo de Itō.
- **xti es amor** tiene un intro quieto, zonas de pad solo y un final que se apaga: sirve para la última noche.

**Escucha humana: ninguna todavía.** Lo que el dueño tiene que oír, en orden, está en `investigacion/audio-real.md` §12 y arriba de `docs/part-ii/escuchar.html`.

## 1. Inventario

| Enlace | Título real (Soundtrap) | BPM | Tono | Compás | Duración (OBSERVADO) | Pistas | Batería |
|---|---|---|---|---|---|---|---|
| 1 `J5GouBnx…` | **Drunck (hardstyle)** [DUEÑO: prólogo] | 165 | B♭m | 4/4 | 48 compases · **1:09,8** | 11, loops «Druck – Aggressive» | Bombo rumble |
| 2 `znsBGFR4…` | **No wey (way, hiphop dark)** | 74 | F♯m | 4/4 | 69 compases + 2 tiempos · **3:44,2** | 9 | Kick & clap (audio) + kit «Corazón» (notas) |
| 3 `b5_MXIbc…` | **Daria (hiphop deep)** | 134 | Cm | 4/4 | 80 compases · **2:23,3** | 6 | Bombo, luego bombo + caja; hats trap |
| 4 `4riizrbW…` | **xti es amor, (jazz)** | 140 | F♯ | 4/4 | 114 compases · **3:15,4** | 7 (una de cuerdas, vacía) | Bembé, caja + hat abierto |
| 5 `fGRASEj8…` | **SADIE (piano and distorsion)** [DUEÑO: muerte de Luzterna] | 50 | Dm | 4/4 | 36 compases · **2:52,8** | 8 | **Ninguna** |

**Confirmado por el título:** Drunck es el enlace 1 y SADIE el enlace 5. **Ninguna de las cinco es una de las 6 canciones de la Parte II.**

**Sin confirmar [ABIERTO]:** el brief dice «mencioné cuatro canciones, pero hay cinco enlaces», pero solo nombra dos. **No sabemos cuáles son «las otras dos»** entre No wey, Daria y xti es amor. Este documento **propone usar las tres** (§4–6). Si una sobra, se quita su Momento sin tocar el resto.

---

## 2. «Drunck (hardstyle)» → Momento del prólogo, H66 [DUEÑO]

### 2.1 Composición

| Compases | Tiempo | Qué hay (OBSERVADO) | Lectura (INFERIDO) |
|---|---|---|---|
| c1–9 | 0:00–0:11,6 | Golpes **sueltos** de bombo en c1, c2,875, c3, c4,75 (redoble), c5, c6,875, c7 y c8,75 (redoble). Build-up. Sinte con *sweep* automatizado de **238 Hz a 8 946 Hz** | Intro: algo que se anuncia y se abre |
| c9–17 | 0:11,6–0:23,3 | **Bombo continuo** (rumble), sinte principal, percusión. Raw Percussion con fundido de entrada en c15–17 | Drop A |
| c16 | ~0:21,8 | MEDIDO: graves −19 dB (casi sin bombo) | Un compás de respiro |
| c17–25 | 0:23,3–0:34,9 | Entran el ride y los hats; se van las percusiones. **El bombo se corta en c24,649 (0:34,40)**: medio segundo sin él | B, con un mini-stop |
| c25–33 | 0:34,9–0:46,5 | Build-up **encima** de toda la batería. Respira en c32 (MEDIDO: graves −20) | C: la parte más llena |
| c33–41 | 0:46,5–0:58,2 | **Sin sintes.** El bombo para en c40,75 (0:57,8) y entra un **redoble** hasta c41 | Batería sola, luego el redoble |
| c41–49 | 0:58,2–1:09,8 | Todo junto. El sinte vuelve **cerrado a 716 Hz** y se abre entre c46,4 y c48 (1:06,1–1:08,3). Respira en c48. **Corte seco en c49** | Final |

### 2.2 Función narrativa

Es el **relato de Canelo a toda velocidad**: la Parte I y la Parte II contadas en 70 segundos de hardstyle, como se acuerda un borracho. La canción es corta e intensa, así que **el diálogo largo va antes y después**, en el bar en silencio (`04`). Dentro de la canción, Canelo habla en globos de 1 a 4 palabras.

### 2.3 Estilo [PROPUESTA]: «PSICODELIA DE TABERNA»

- **El presente** (el bar) es caricatura de TV de la Borracha (`06` §3).
- **Los recuerdos de la Parte I** se ven como **portadas animadas del *Diario del Mar***: grabado sepia, periódico y titulares «¡EXTRA!». Es el lenguaje visual del mapa y de las victorias de la Parte I.
- **Los recuerdos de la Parte II** se ven **en el estilo de su Momento**: NEÓN CEL, TINTA Y PERGAMINO, GRAFITI Y SEÑAL ROTA, COLOSO/GRABADO, FUNCIÓN DE FERIA 1930 y ANIMATIC (`docs/part-ii/29`). El kit ya hornea gatos en esos seis estilos (`arte-pipeline.md` §4.6).
- **Las transiciones son físicas, no filtros:**
  - la espuma que se vuelve mar;
  - el fondo del vaso como caleidoscopio;
  - el letrero de neón que se vuelve la galera de LIKY FIGHT;
  - la tinta de la cerveza derramada que se vuelve sumi-e;
  - el grafiti de la puerta del baño que se vuelve te ODIO.
- **El hipo** es el corte: cada golpe suelto de la intro cambia algo del bar.
- **La psicodelia:**
  - rotación de tono por sección dentro de cada paleta;
  - visión doble: dos estilos lado a lado que se juntan en el golpe;
  - rebote *rubber-hose* en todo lo toon.

### 2.4 Sincronía

La hoja de coreografía completa está en `04` §3. Todos los anclajes van a compases **observados**. El milisegundo exacto queda **pendiente de verificar** con el archivo exportado.

### 2.5 Uso fuera del Momento [PROPUESTA]

| Id | Qué es | Dónde |
|---|---|---|
| `drunck.barra` | Reducción: solo el rumble, muy bajo, con la cama de taberna | Mapa y niveles nocturnos de la Borracha |
| `drunck.resaca` | El loop del sinte al 50 %, con paso bajo fuerte, como oído a través de una almohada | La mañana en blanco y negro (H72, B-7) |
| `drunck.battle` | Remix de batalla con el material propio de la canción (sin sintes ni campanas agregados: regla de `gustos-musicales`) | Batallas de la Borracha |

---

## 3. «SADIE (piano and distorsion)» → Momento de la muerte de Luzterna, H93 [DUEÑO]

### 3.1 Composición

| Compases | Tiempo | Qué hay (OBSERVADO) | Lectura (INFERIDO) |
|---|---|---|---|
| c1–5 | 0:00–0:19,2 | Loop de piano (acordes, 4 compases) + **arpegio** del lead en corcheas, que entra con fundido | Intro íntima |
| c5–17 | 0:19,2–1:16,8 | Entran las **cuerdas** (c5; MEDIDO: +15 dB) y suben un escalón en c9. Golpes **«YM – Error»** en **c8,875 (0:37,8)** y **c13 (0:57,6)**. El lead se apaga en c13–17 | Crecida |
| c17–25 | 1:16,8–1:55,2 | Cuerdas en su máximo (+6 dB). La línea **YM «Error» picada** en 6 trozos. El lead vuelve en **c21 (1:36,0)** | Clímax con «error» |
| c25–29 | 1:55,2–2:14,4 | Piano y cuerdas que se apagan | Calma |
| c29–33 | 2:14,4–2:33,6 | El piano pasa a la pista **«Dub» con distorsión** (juicydist), delay y filtro. Golpes YM en **c29 (2:14,4)** y **c31 (2:24,0)**. Sin cuerdas ni lead | El quiebre |
| c33–37 | 2:33,6–2:52,8 | **Piano limpio, solo**, hasta el final (c37) | Despedida |
| — | — | MEDIDO: el piano ataca cada **2 tiempos (2,4 s)**; el arpegio va cada 0,6 s | Pulso para los inputs |

### 3.2 Función y estilo

Ver `08` §4: estilo **«LINTERNA MÁGICA»** (placas de vidrio pintadas que proyecta su linterna mientras se apaga).

**La composición encaja con la dramaturgia:**
- Los golpes **«Error»** son el **tachón** de La Mano chisporroteando sobre la luz.
- El **piano distorsionado (c29)** es **la linterna que se rompe**.
- El **piano limpio solo (c33–37)** es la última brasa.

### 3.3 Hoja de coreografía (anclada a compases OBSERVADOS; milisegundos pendientes)

| Compases | Imagen | Input |
|---|---|---|
| c1–5 | Batalla congelada. El tachón negro de La Mano, quieto en el aire. Del haz rajado sale la **primera placa**: la balsa, la caja y Canelo bebé | «RECUERDA» en c3, sobre un ataque del piano |
| c5 (entran las cuerdas) | La proyección **llena la pantalla**: los colores de anilina se encienden de golpe | — |
| c5–9 | Placas de la Parte I: el primer «Capi», la linterna colgada en tu faro | «RECUERDA» en c5 y c7 |
| **c8,875 (YM)** | El tachón **chisporrotea**: una grieta negra recorre la placa y la placa sigue | — (el golpe es de ella) |
| c9–13 | Placas de la Parte II (b48: «Cuidar algo también es dejar que lo vean»). Corte a Luzterna de pie con Cerito detrás. **Línea:** «No la voy a soltar, Capi. Esta vez no es que se me olvide.» | «RECUERDA» en c9 y c11 |
| **c13 (YM)** | El tachón avanza un palmo **por su brazo** | — |
| c13–17 | El lead se apaga: Luzterna mira las placas como quien ve fotos viejas. **Línea:** «¿Esto es lo que ve la gente cuando se muere? Qué cursi.» Es su último chiste | «RECUERDA» en c15 |
| **c17–25** (clímax, «Error» picado) | Placas de la Parte III **más rápidas**, una por trozo de YM: la resaca, la Gato-señal, el karaoke y la cobija. El tachón se corre como tinta por su cuerpo. **Canelo corre** desde la palmera y la cámara no lo deja llegar | «RECUERDA» en c17, c19 y c23 (sobre la entrada de cada trozo) |
| **c21** (vuelve el lead) | La linterna se **raja**: las placas que quedaban empiezan a caer como vidrio | — |
| c25–29 (calma) | Luzterna se arrodilla junto a Cerito y le pone la mano en la cabeza. Canelo llega. Ella le acomoda la bufanda «horrible». **Última línea:** «Cuida la página, gordo. Y no te la comas.» Queda una sola placa en el aire: **la foto que elegiste en H89** | **Ninguno**: en su muerte no hay inputs |
| **c29 (distorsión + YM)** | **La linterna se rompe.** La proyección se distorsiona: vidrio quebrado, color corrido. Luzterna no suelta. **La bufanda que tejió**, que traía para dárselo a Canelo esa mañana, **cae al suelo** (la profecía de Cronos, `02` §4.8 #7) | — |
| **c31 (YM)** | La llama se dobla | — |
| **c33 (piano limpio)** | Queda una brasa. **Canelo maúlla.** Es el único sonido que no es la canción (`audioApi.solo` + un efecto, excepción documentada) | — |
| c33–37 | La brasa ilumina la foto, cada vez menos, con cada ataque del piano | — |
| c37 (fin) | Se apaga. **Negro total.** Sin UI | — |
| Después | Los ojos de tus gatos se encienden uno a uno → fase 2 de H93 | — |

**Inputs:** 10, todos «RECUERDA», todos **antes** de la calma. **No hay ninguno durante su muerte** (c25–37), para no sugerir que se la puede salvar (`08` §4.2).

**Pendiente de verificar con el archivo exportado:**
1. el milisegundo de cada ataque del piano;
2. cómo suena la distorsión;
3. si el pulso que se siente es la corchea del arpegio (0,6 s) o la negra (1,2 s), para elegir la grilla de los inputs.

### 3.4 Uso fuera del Momento [PROPUESTA]

- `sadie.luto`: el piano limpio de c33–37 en bucle. Suena en tu isla de noche **solo** en el estado `p3_sin_luz` (H94–H95).
- Después de H95 **no vuelve a sonar** fuera de la Fonoteca.
- La original **nunca** suena en batalla.

---

## 4. «Daria (hiphop deep)» → Momento del duelo con Itō, H80 [PROPUESTA]

### 4.1 Composición (OBSERVADO; sin medición de señal)

| Compases | Tiempo | Qué hay |
|---|---|---|
| A c1–17 | 0:00–0:28,7 | Piano de vinilo, bombo solo, 808, voz de biblioteca «Cold» en Cm; el *shimmer* entra en c9 |
| B c17–33 | 0:28,7–0:57,3 | Bombo + caja; voz en **Am** (c17–25). **Stop de 2 tiempos al empezar c25 (0:43,0 → 0:43,9)**: callan piano, 808 y *shimmer* |
| C c33–49 | 0:57,3–1:26,0 | Sin voz; hats trap. **Hueco de batería de 1¼ tiempos al empezar c41 (1:11,6 → 1:12,2)** |
| A' c49–65 | 1:26,0–1:54,6 | Vuelven la voz y el bombo solo; caja y voz en Am desde c57 |
| C' c65–81 | 1:54,6–2:23,3 | Hats y caja, sin voz. **Corte seco** en c81 |

### 4.2 Por qué aquí

El hip-hop con piano de vinilo y un duelo de espadas es una combinación con tradición en el anime (el «samurái con hip-hop»). Itō es el Titiritero de **hilos** que pelea limpio.
- Los dos **silencios cortos** (c25 y c41) son los dos instantes de un duelo de iaidō: **el silencio antes del corte**.
- La voz «Cold» en dos tonos (Cm y Am) son **los dos rivales**.

### 4.3 Estilo [PROPUESTA]: «UNA SOLA LÍNEA»

- **El mundo está dibujado con un solo hilo continuo**, blanco sobre índigo, como dibujo de línea continua o *string art*.
- Los luchadores van en cel anime (`bakeCel`) y el escenario es solo hilo. Cuando Itō corta, **se corta la línea del dibujo**: el escenario se deshilacha.
- El disco de vinilo gira en la esquina; cada *scratch* es un cambio de plano.
- **No se parece a ninguno de los 6 estilos de la Parte II.**

### 4.4 Hoja de coreografía (borrador)

| Sección | Qué pasa | Input |
|---|---|---|
| A | Arena de hilo. Itō hace una reverencia; Canelo copia la reverencia y se cae. Cada bombo, un paso | Tap en los bombos de c9–17 (dar pasos) |
| B | Intercambio de golpes con caja. **c25, el stop de 2 tiempos:** todo el dibujo **se tensa** y queda quieto | Hold desde c24 y soltar en c25,5 (el corte): perfecto = el hilo de Itō se corta limpio; fallo = el de Canelo se enreda |
| C | Hats trap = ráfagas de hilos. **c41, hueco de batería:** Itō olvida un nombre frente a ti (la revelación de H80, `03`). El dibujo pierde un trazo | Mash en c33–40; ninguno en c41 |
| A' | Vuelve la voz: Itō pelea por honor, no por odio | Taps |
| C' | Remate. **Corte seco** en c81 = el último corte: Itō cae y el escenario de hilo se suelta entero | Tap en c80 |

### 4.5 Fuera del Momento

`daria.piano`: solo el piano de vinilo y el 808, para el mapa y el entrenamiento de Anime. `daria.battle`, sin voz, para las batallas de Anime.

---

## 5. «No wey (way, hiphop dark)» → Momento de «No, wey», H86 [PROPUESTA]

### 5.1 Composición (OBSERVADO; sin medición de señal)

| Compases | Tiempo | Qué hay |
|---|---|---|
| Intro c1–9 | 0:00–0:25,9 | Melodía de sinte y hats (patrón A del kit); el bajo entra en c5 |
| Beat 1 c9–17 | 0:25,9–0:51,9 | Kick & clap |
| Break c17–29 | 0:51,9–1:30,8 | Sin bombo: la otra copia de la melodía, el bajo y, desde c21, «Bumble Bee». Los hats vuelven en c25–29 |
| Beat 2 c29–45 | 1:30,8–2:22,7 | Vuelve el bombo. **El bombo de c33 entra 1,4 tiempos tarde (c33,349 = 1:44,9)**. Melodías solapadas en c41–45 |
| Break 2 c45–53 | 2:22,7–2:48,6 | c45–49, **solo la melodía**; el otro bajo entra en c49 |
| Beat 3 c53–61 | 2:48,6–3:14,6 | Bombo, bajo, melodía y Bumble Bee |
| Cierre c61–70,125 | 3:14,6–3:44,2 | Sin bombo; el bajo se va en c65; **la melodía sola** corta a mitad de c70 |

### 5.2 Por qué aquí

El título es la respuesta de Luzterna.
- En H85 La Mano le pide apagar la luz y ella dice «No, wey».
- **En H86 los Correctores llegan a «corregir» su decisión**: ellos quitan la elección, y ella defiende la suya.
- Es **su** batalla (comandada por ella, `03` 3.4). El hip-hop oscuro y lento (74 BPM) es su paso firme.
- Es el Momento que muestra a Luzterna **con poder y voluntad** antes de su muerte.

**Cambio de orden en el Acto III:** H85 pasa a ser la escena de La Mano y H86 la batalla. `03` ya está actualizado.

### 5.3 Estilo [PROPUESTA]: «NOIR DE LINTERNA»

- Cine negro en tinta y aguada, en blanco, negro y grises fríos. **El único color es el de su linterna**: un cono cálido, como un reflector.
- Persianas de sombra, contraluces y humo.
- Los barcos blancos de los Correctores se ven **demasiado blancos**, recortados.
- Al final, el texto **«NO, WEY.»** se escribe con su luz sobre el mar: es la única palabra del Momento.
- Contraste buscado: en **No wey** la linterna es **un arma**; en **SADIE**, **un proyector que se apaga**.

### 5.4 Hoja de coreografía (borrador)

| Sección | Qué pasa | Input |
|---|---|---|
| Intro | La flota blanca en simetría perfecta. Luzterna sola en la proa, con la linterna baja. En c5, con el bajo, levanta la cabeza | — |
| Beat 1 | Cada palmada es un rayo de «corrección» blanco que pega en su luz **y no la apaga** | Tap en cada clap: perfecto = el rayo rebota en la linterna |
| Break | Cartelones mudos de La Redacción: «UNA LUZ MENOS. UN ERROR MENOS.» Ella se ríe sin sonido. Los hats de c25 son tus gatos que se forman detrás de ella | Hold de c25 a c29: los gatos se forman |
| Beat 2 | Contraataque: su luz como reflector barre la flota y cada barco que toca se pone gris. **c33,349, el bombo tarde:** La Mano, en la orilla, **levanta la pata para detenerla… y la baja** | Taps de barrido |
| Break 2 (solo melodía) | Ella voltea a ver a Canelo. Placa breve de la Parte I: «Yo nunca solté» | — |
| Beat 3 | Empuje final; la flota se retira | Taps |
| Cierre | Sin bombo. Ella baja la linterna. **«NO, WEY.»** se escribe con su luz, letra por letra, con la melodía sola hasta el corte de c70 | Tap opcional: subrayar la frase |

### 5.5 Fuera del Momento

`nowey.melodia`, solo la melodía y el bajo, para el mapa de Libros. `nowey.battle` para las batallas de Libros.

---

## 6. «xti es amor, (jazz)» → Momento «Última noche tranquila», H91 [PROPUESTA]

### 6.1 Composición (OBSERVADO; sin medición de señal)

- **Pad** con la progresión **Bmaj7 – F♯maj7 – Bmaj7 – F♯maj7 – G♯m7 – A♯m7** (INFERIDO de las notas), en bucle de 8 compases idéntico en las 13 regiones.

| Compases | Qué hay |
|---|---|
| Intro c1–17 | Pad solo; el *songstarter* entra en c9 |
| c17–33 | Entra la batería: fill de bembé y bembé con fundido de entrada en c21–25 |
| Break c33–41 | Solo el songstarter |
| Tutti c41–57 | Pad, songstarter, bembé y bajo; caja y hat abierto desde c49 |
| Break largo c57–81 | Sin batería salvo el fill de c65–73; **c73–81, el pad solo** |
| Tutti c81–105 | — |
| Cierre c105–115 | El songstarter solo y luego **el pad solo** hasta c115 |

La pista de cuerdas está **vacía** (OBSERVADO).

### 6.2 Por qué aquí

«Por ti es amor.» Es la **última noche en paz con Luzterna**: el Momento que hace que el jugador quiera quedarse ahí. Es la convivencia que el dueño pidió para preparar la emoción del final.
- **No es una batalla.** Es un Momento **de paseo**: la primera vez que un Momento ocurre en tu isla sin pelea.
- Dura 3:15, con dos breaks largos para escenas quietas.

### 6.3 Estilo [PROPUESTA]: «ÁLBUM DE NOCHE»

- **Polaroids que se revelan.** Cada escena con un gato empieza como foto instantánea en blanco que se revela al ritmo del pad. Después cobra vida en un loop corto, en la pintura del juego con la luz cálida del faro.
- Es el estilo **más cercano al juego**, a propósito: **la casa**.
- **Las fotos son las que el jugador sacó en el viaje.** Conecta con la cabina de fotos de H89 y prepara la última placa de SADIE.

### 6.4 Hoja de coreografía (borrador)

| Sección | Qué pasa | Input |
|---|---|---|
| Intro (pad) | Tu isla de noche; Luzterna en el faro, tejiendo. La cámara baja despacio | — |
| Batería (bembé) | Recorrido: tocas a un gato y su foto se revela (Canelo, Cerito, Nadie, Noctis, Maneki, Grafitera, Hipólito, Borrón si desertó). Cada uno tiene **una** línea con Luzterna (en globo, porque en casa los gatos no hablan; su línea es un dibujito) | Tap en cada gato, en el tiempo fuerte |
| Break (songstarter) | Luzterna le enseña a Cerito a acercarse a la luz | — |
| Tutti | Todos los gatos alrededor del faro; Canelo se roba la cobija de Cerito y se la devuelve | Taps |
| Break largo; c73–81, el pad solo | Luzterna y tú en la azotea del faro. Te enseña la bufanda casi terminada y **la esconde**. «Mañana la termino» | — |
| Tutti | Vuelven las fotos del día; se arma el álbum | Taps |
| Cierre (pad solo) | Todos se duermen. La luz barre suave. Se cierra el álbum | — |

### 6.5 Fuera del Momento

- `xti.gira`: las secciones tutti, para la actividad «La Gira» de POP. Usa material de la propia canción, sin timbres agregados.
- `xti.pad`: el pad solo, para tu isla de noche **mientras Luzterna vive** en la Parte III.

---

## 7. Reparto de música por lugar [PROPUESTA]

Regla de la Parte II: **las originales solo suenan en los Momentos y la Fonoteca**; en el juego suenan variaciones y piezas propias. Gusto del dueño (`gustos-musicales`): reducciones íntimas, ambiente y composición propia; **nada de timbres extraños pegados** a sus canciones.

| Lugar | Pista | Origen |
|---|---|---|
| Carta de las Cajas | `fut.menu` «Carta de navegación» (ya compuesta y aprobada por el dueño) | `audio-derivados/futuro/` |
| Bitácora | `fut.carta` «Carta sin enviar» (piano íntimo) | Ídem. Después de H93 es su tema |
| Tu isla de noche, con Luzterna viva | `xti.pad` + `fut.faro` con sus capas | Ídem |
| Tu isla después de H95 | `fut.marea` «Marea baja» («después» por capas) | Ídem |
| Borracha | `drunck.barra` / `drunck.resaca` / `drunck.battle` | Variaciones nuevas |
| Superhéroes | Composición nueva `fut.vineta`: metales y percusión de serie de acción | Por componer |
| Anime | `daria.piano` / `daria.battle` | Variaciones nuevas |
| Libros | `nowey.melodia` / `nowey.battle` + `fut.fosa` en la sección prohibida | Variaciones + ya compuesta |
| POP | `xti.gira` | Variación nueva |
| Jefes de dimensión | `fut.jefe` «Ojo del huracán» | Ya compuesta |
| Remates | `fut.st.*` (hallazgo, amigo, puerta, faro, victoria, derrota) | Ya compuestos |

**Mezcla** (queja 4 de la Parte II): fuera de los Momentos, un bus con prioridades:
- música por debajo de los diálogos;
- ambiente por debajo de la música;
- el sonido procedural apagado en las escenas.

Antes de publicar, **escucha humana del dueño** (criterio M-6 en `09`).

---

## 8. Lo que falta para sincronizar (pasos para el dueño)

1. **Confirmar cuáles canciones van** (§1) [ABIERTO].
2. **Exportar la mezcla** de cada canción elegida desde Soundtrap (Archivo → Exportar → WAV, o MP3 de alta calidad) a `~/Desktop/No one - raster (fuera del repo)/audio-derivados/originales/`. Si su plan lo permite, exportar también las **pistas por separado** (stems), que ayudan a las variaciones.
   - El agente **no exportó ni descargó nada**: el permiso era de inspección.
   - Otra opción es que el dueño **autorice explícitamente** al agente a exportar desde su sesión.
3. **No editar** los proyectos después de hoy, o avisar. Los compases de este documento valen para las versiones Drunck 6, No wey 306, Daria 306, xti 142 y SADIE 223.
4. Con los archivos, el agente de música:
   - genera `<id>.onsets.json` con `onsets.py`;
   - confirma el bombo de Drunck en c16, c32 y c48, la cola de reverb y la distorsión de SADIE;
   - fija los milisegundos de las hojas de coreografía.

**Nota de Chrome:** quedó una «Nueva pestaña» vacía fuera del grupo de Claude que la herramienta no pudo cerrar. Se puede cerrar a mano.
