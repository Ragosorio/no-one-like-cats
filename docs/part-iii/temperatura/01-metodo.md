# 01 · Método: cómo medir la temperatura de la historia

> Agente TEMPERATURA · ronda 4 · 2026-10-26. ⚠️ Spoilers de la Parte III.
> **Para qué sirve:** puntuar cualquier escena, capítulo o película de la Parte III (guion, storyboard o build) con los mismos números, para saber si vamos hacia el giro que pidió el dueño:
> encariñarse con Canelo y con Luzterna → creer que muere Canelo → que muera Luzterna → «wow, ¿qué pasó?», sin que se sienta barato.
> Lo usan `02` (auditoría), `03` (curva objetivo), `04` (engaño y giro) y `05` (revisión de NARRATIVA).

---

## 1. Las ocho dimensiones

Todas van de **0 a 10**. Se puntúa **por escena** y el capítulo toma el valor que **le queda al jugador al salir** (no el promedio). Excepción: la energía, que se reporta como pico y valle.

| Sigla | Dimensión | Pregunta que contesta | Qué tipo de número es |
|---|---|---|---|
| **AC** | Apego a Canelo | «¿Cuánto me dolería perderlo?» | **Acumulado**: sube y baja poco a poco a lo largo del juego |
| **AL** | Apego a Luzterna | Igual, para ella | Acumulado |
| **TEN** | Tensión | «¿Algo que quiero está en riesgo **ahora**, y no sé cómo sale?» | Momentáneo |
| **HUM** | Humor | «¿Me reí?» | Momentáneo |
| **PAV** | Pavor | «¿Siento que **algo malo va a pasar más adelante**?» Es miedo anticipado, distinto de la tensión. | Acumulado, con decaimiento |
| **ENE** | Energía / dopamina | «¿Esto me prende?»: ritmo, espectáculo, música, inputs, premio | Momentáneo (pico y valle) |
| **CLA** | Claridad | «Entiendo qué hago y por qué» | Momentáneo |
| **QVM** | ¿Quién va a morir? | «Si alguien muere, ¿quién?» | Reparto de 100 % entre **Canelo / Luzterna / nadie / otro** |

### 1.1 Anclas de la escala (para que 7 signifique lo mismo para todos)

| Valor | AC / AL | TEN | HUM | PAV | ENE | CLA |
|---|---|---|---|---|---|---|
| 0 | No sé quién es | Nada en juego | Nada | Nada malo en el horizonte | Negro y silencio | No sé qué hago |
| 2 | Lo reconozco | Trámite | Una sonrisa | «Qué raro» | Escena quieta | Sé qué tocar, no por qué |
| 4 | Me cae bien | Batalla normal | Sonrisa clara | Una amenaza con nombre | Diálogo con movimiento | Sé qué y casi por qué |
| 6 | Me importa lo que le pase | Jefe o pérdida posible | Risa | Varias señales apuntan a alguien | Batalla viva | Sé qué, por qué y adónde |
| 8 | Me dolería perderlo | Alguien querido en riesgo y resultado incierto | Carcajada | Espero la desgracia en cualquier momento | Clímax de película o Momento | Lo podría explicar a otro |
| 10 | Lloraría | El golpe | Escena icónica («¿DESDE EL PATO?») | Ya sé que viene y no quiero que llegue | Drop + inputs + premio + cámara | Imposible confundirse |

---

## 2. Cómo puntuar desde un guion

Regla general: **se puntúa lo que el jugador ve, oye o hace**, no lo que dice la nota del diseñador. Si una pista solo está en el documento y no en la pantalla, vale 0 (regla de la Parte II: «si la historia dice que pasa, pasa en el mundo»).

### 2.1 Apego (AC, AL): el registro VÍNCULO

El apego se **acumula**. Cada escena suma un **Δ** según qué hace el personaje en pantalla:

| Letra | Criterio | Δ | Ejemplo real del juego |
|---|---|---|---|
| **V** | **Vulnerabilidad**: muestra miedo, culpa, cansancio o un deseo que no se cumple | +1 | «No lo sabía, Capi. Te juro que no lo sabía. ¿Qué hago? ¿La apago?» (b48) |
| **I** | **Interioridad**: dice algo de sí que no le sirve a la trama | +0,5 | «Mañana zarpamos. Hoy no. Hoy me da miedo. …Un poquito.» (`cine/scenes/reflejo.ts:52`) |
| **C** | **Cuidado activo**: hace algo por otro **y le cuesta** | +1,5 | «Te voy a buscar. Es mi trabajo.» (b67, tramo 3) + jala la bufanda en cada tramo |
| **J** | **El jugador actúa por o con el personaje**: agencia | +2 | Guardarle el golpe final a Canelo (H38); pelear para que no lo «corrijan» (H46); elegir qué hacer con la linterna (H48) |
| **D** | **Deseo propio**: quiere algo para sí, no solo cumplir su función | +1 | «Pues habla más seguido. Aunque sea para pedir perdón.» (b67) |
| **H** | **Humor con firma**: un chiste que solo ese personaje haría, ligado a su historia | +0,5 | «Renta gratis. Ventaja de estar muerta.» (`rupturasScript.ts:109`) |
| **R** | **Ritual o callback** con variación (bufanda, «gordo», «mantén… y suelta») | +0,5 | «Es horrible.» / «Por eso es mía.» (b67), eco de `script.ts:112` |
| **M** | **Muda**: la escena funciona sin leer | ×1,5 para quien salta textos; +0,5 para los demás | Luzterna cuelga la linterna en tu faro (`finaleScript.ts:31`) |

**Penalizaciones:**
- **−0,5** por capítulo en que el personaje **solo da instrucciones** («Toca la misión fijada»). Es la voz de tutorial: familiaridad sin apego.
- **−0,3** por capítulo de **ausencia**: el apego se enfría si no lo vemos.
- **Tope**: una escena suma como mucho **+3**. Una escena sola no hace a nadie querible.

**Conversión al número de la escala:** se parte del valor con que llega el jugador (ver `02` para el punto de partida) y se suman los Δ del capítulo. **Por encima de 8, cada punto cuesta el doble**: hacen falta dos Δ para subir uno.

**Dos lecturas obligatorias:**
1. **Con texto**: el jugador que lee.
2. **Muda**: el mismo capítulo con todo el texto tapado. Si el AL de la lectura muda sale 3 puntos o más por debajo de la lectura con texto, la escena **depende del diálogo** y hay que darle una acción.

### 2.2 Tensión (TEN)

TEN = la más alta de las tres preguntas, contestadas para **ese momento**:
- **¿Qué se pierde?** (0 = nada; 5 = una batalla; 8 = alguien querido; 10 = alguien querido, para siempre).
- **¿Qué tan incierto es?** Si el jugador ya sabe el resultado, divide entre 2.
- **¿Qué tan cerca está?** Si es «en algún momento», no es tensión: es pavor (§2.4).

Ejemplo: la fase 1 de H93 (pelea difícil en tu isla) = 7. El interludio, con el trazo de La Mano hacia Canelo = 9. El tachón sobre Luzterna = 10.

### 2.3 Humor (HUM)

Se puntúa el **mejor chiste** de la escena, no la cantidad.
- **+1** si el chiste **sale de un personaje** y no del narrador.
- **+1** si **se entiende sin leer** (slapstick, cara, reacción).
- **−2** si tapa una información de la historia o una cara importante (regla de `13` §2.3).

### 2.4 Pavor (PAV)

Es la temperatura del engaño. Se calcula con **señales activas**:

| Señal en pantalla | Suma | Decae |
|---|---|---|
| Profecía o advertencia sin resolver (Maneki, Cronos) | +2 | No decae hasta que se cumple |
| Debilidad visible del personaje (llama baja, desmayo) | +1,5 | −0,5 por capítulo si no se vuelve a ver |
| Amenaza con nombre y plan («Lo sostiene la mirada de tu gato») | +2 | −0,5 por capítulo |
| Bandera de muerte de género (despedida, testamento, «mañana te lo doy») | +1 | −0,5 por capítulo |
| Silencio o cambio de música después de una escena feliz | +0,5 | Inmediato |

Además, el pavor se reporta **dirigido**: a quién apunta cada señal. Eso alimenta QVM.

### 2.5 Energía y dopamina (ENE)

| Sube | Baja |
|---|---|
| Cortes rápidos, cámara que se mueve, cambio de estilo | Planos quietos de cabeza parlante |
| Música con pulso o drop; inputs a tiempo con respuesta grande | Más de 4 líneas sin acción |
| Premio visible (gato, botín, foto, sello «¡VISTO!») | Cargas, esperas, menús |
| Un objetivo claro que se cumple (triunfo) | Repetir un nivel sin cambio |

Se reporta **pico y valle** por capítulo. La curva (`03`) exige que **se alternen**: después de un pico de 8 o más tiene que haber un valle de 4 o menos antes del siguiente pico. Los silencios planeados cuentan como valle, y son buenos.

### 2.6 Claridad (CLA)

Se usa la tarjeta de misión de 5 campos (`03` §3). Antes de la acción:
- **+2,5** por cada una de estas cuatro preguntas que el jugador **ya puede contestar**: ¿qué pasa?, ¿por qué importa?, ¿qué queremos?, ¿por qué ahí?
- **−2** por cada novedad de sistema de más (la regla es una por capítulo).
- **−2** si el único motivo que se entiende es el premio (fue la queja del dueño en la Parte II).
- **−1** si la película de presentación dura más de 60 s, o si el jugador no sabe qué se arriesga.

### 2.7 ¿Quién va a morir? (QVM)

**Punto de partida.** Al empezar la Parte III el jugador **no sabe** que alguien va a morir. Reparto inicial: Canelo 10 · Luzterna 3 · nadie 80 · otro 7.

**Cada señal mueve el reparto** hacia su objetivo (y luego se renormaliza a 100):

| Señal | Hacia | Peso base |
|---|---|---|
| Profecía, amenaza o plan que lo nombra | Al nombrado | +15 |
| Debilidad física visible | Al débil | +10 |
| Bandera de muerte de género | Al que la carga | +8 |
| **Prueba de inmunidad** (algo lo atraviesa, alguien dice que no puede morir) | Lo **saca** de la lista | −10 |
| Pista honesta notada | Al verdadero objetivo | Según saliencia: alta +12 · media +6 · baja +2 |
| El tono se oscurece (acto III en adelante) | Sube «alguien» y baja «nadie» | +10 a repartir |

**El filtro de atención.** Cada persona (§3) nota cada señal con una probabilidad que depende de su tipo: texto corto, texto largo, imagen, música o interfaz. El peso se multiplica por esa probabilidad. Al cazador de giros, además, las pruebas de inmunidad le pesan la mitad (desconfía) y las banderas el doble (las conoce).

---

## 3. El panel: cinco personas para los playtests simulados

Cada persona lee el borrador o mira el build, **en orden y sin saltar adelante**, y entrega su ficha (§4). Las cinco existen para cubrir maneras distintas de jugar; el giro tiene que funcionar para las cinco.

| | **Vale** | **Ramiro** | **Sofi** | **Toño** | **Marta** |
|---|---|---|---|---|---|
| Quién es | 24 años, casual. Juega en el celular 20–40 min al día | 31, **cazador de giros**. Foros, teorías, anime, Pixar, Undertale | 10, niña. Juega sola o con su hermano | 19, **salta-textos**. Va por batallas y gacha | 45, **veterana emocional**. Jugó las Partes I y II completas, unas 80 h |
| Qué lee | Líneas cortas sí; bloques largos los pasa | Todo, dos veces. Abre la Bitácora y el glosario | Lento; lee chistes, se salta explicaciones | Casi nada: toca para pasar. Ve películas, batallas y a veces la tarjeta | Todo, sin teorizar |
| Filtro de atención (texto corto / largo / imagen / música / interfaz) | 0,7 / 0,3 / 0,8 / 0,5 / 0,4 | 0,95 / 0,95 / 0,95 / 0,8 / 0,9 | 0,5 / 0,2 / 0,9 / 0,6 / 0,3 | 0,1 / 0,05 / 0,85 / 0,6 / 0,3 | 0,9 / 0,85 / 0,8 / 0,7 / 0,6 |
| A quién quiere de entrada | A Canelo, «porque es el gordo» | A Luzterna por los diálogos; a Canelo por el lore | A Canelo y a todos los gatos | A Canelo (lo usa) y a los gatos fuertes | A los dos; a Canelo como a una mascota de dos años |
| Sesgos que importan | Cree lo que dicen los personajes | Conoce los tropos: **muerte del mentor**, **banderas de muerte**, la «muerte final» de *Coco* (un fantasma también puede desaparecer). Desconfía de lo que «no puede pasar» | «Fantasma» = «ya no se muere». Se angustia con animales en peligro | No conoce la regla. Ni la falsa ni la verdadera | Se acuerda de todo lo de la Parte I, incluido «si algo me pasa, dile a Canelo…» |
| Riesgo para el giro | Que no le importe Luzterna lo suficiente | **Que lo vea venir** | Que no entienda qué pasó | **Que no le duela**: para él, «se murió la del cuadro amarillo» | Que lo sienta como castigo o como barato |
| Su frase de éxito | «¡NO! ¿Por qué ella?» | «Estaba TODO ahí y no lo vi» | «¿Luz se murió de verdad? ¿Pero no que ya estaba muerta?» | «Wey… ¿qué pasó?» (y regresa a ver la película) | «Me rompió. Y era justo.» |

**Cómo se usan:** para cada capítulo, cada persona da sus 8 números, su reparto QVM, **lo que notó** y **lo que se le pasó**, y una frase en su voz. El informe del panel va en `04` §8 (diseño) y en `05` (borradores de NARRATIVA).

---

## 4. Ficha de puntuación (plantilla)

```
CAPÍTULO: H__ «…»   ·   Borrador: historia-v2/…   ·   Pasada: _
Escena por escena:
  [esc] AC Δ (letras VÍNCULO) | AL Δ (letras) | TEN | HUM | PAV (+señales y a quién) | ENE | CLA
Al salir del capítulo:
  AC __ · AL __ · TEN __ · HUM __ · PAV __ · ENE pico/valle __/__ · CLA __
  QVM: Canelo __ · Luzterna __ · nadie __ · otro __
  Lectura muda: AL __ (diferencia con texto: __)
Pistas honestas de Luzterna en pantalla: [id, saliencia, ¿quién la tapa?]
Señales de Canelo en pantalla: [id, tipo]
Panel: Vale «…» · Ramiro «…» · Sofi «…» · Toño «…» · Marta «…»
Arreglos: …
```

---

## 5. Ejemplos ya puntuados (para calibrar)

**H67, tramo 3** («¿Y si un día me voy a una caja y no vuelvo?» / «Te voy a buscar. Es mi trabajo. Y a mí ya no me puede pasar nada, gordo: ya me pasó todo.» / «…Perdón por irme, Luz.»).
- **AC +1** (V: él teme irse y no volver) **+0,5** (I: pide perdón).
- **AL +1,5** (C: «te voy a buscar») **+2** (J: en esa misma caminata el jugador toca para que ella lo enderece). Sale **+3** por el tope.
- TEN 2 · HUM 1 (el tramo es serio, entre dos chistosos) · **PAV +0,5** (la lluvia se calma y la luz de ella baja apenas, `p3Salida.ts:186–192`; el pavor apunta a nadie: no se nota) · ENE 3 · CLA 9.
- QVM: la línea es una **prueba de inmunidad** de Luzterna (−10, dicha por ella) y a la vez una **pista honesta de saliencia baja** (+2). Neto para Vale: Luzterna baja de 3 a 1.

**H48 «Luzterna lo sabe»** (b48 + la elección de `rupturasScriptO2.ts:79–92`).
- **AL +1** (V: «No lo sabía. Te juro que no lo sabía») **+2** (J: el jugador elige) **+1** (D: quería «una luz de casa»). Sale **+3** por el tope. Es la mejor escena de apego que tiene en la Parte II.
- PAV +1, dirigido a «otro» («si alguien viene, que venga»). Al volver a verla, la dirección real es Luzterna.

**H85, diseño de `../03` y de la v2** (Canelo se desmaya y Luzterna lo carga hasta el barco; en `../03` era H84).
- **AC +1,5** (V, debilidad física visible) · **AL +1,5** (C: lo carga) · **PAV +1,5 hacia Canelo** · TEN 7.
- Si además **los pies de ella tocan el piso por primera vez** (propuesta de `04` §3): pista honesta de saliencia **media**, tapada por el desmayo de Canelo. Ramiro la nota con probabilidad 0,95 × 0,5 (tapada) ≈ 0,5.

---

## 6. Cómo sabemos que el giro funcionó (métricas finales)

| Métrica | Cómo se calcula | Meta |
|---|---|---|
| **Sorpresa (S)** | 1 − P(Luzterna) justo antes del tachón | ≥ 0,85 para Vale, Sofi y Toño · ≥ 0,80 para Marta · ≥ 0,65 para Ramiro |
| **Falso clímax** | P(Canelo) en el pico del interludio, cuando se le apaga la llama | ≥ 70 % para todos |
| **Justicia (J)** | Cuántas de las 8 pistas núcleo (`04` §2) reconoce cada uno cuando las vuelve a ver o lee la Bitácora | ≥ 4 Ramiro y Marta · ≥ 2 Vale · ≥ 2 visuales para Toño y Sofi |
| **Apego final** | AL y AC en H92 | AL ≥ 9 y AL > AC en las cinco personas (Toño con AL ≥ 6 en lectura muda) |
| **Barato (B)** | ¿Rompió el juego una regla que **él mismo** afirmó? ¿La muerte depende de que el jugador falle? ¿El mecanismo nunca se mostró antes? | Tres «no». Un solo «sí» es barato |
| **Duelo** | Premios, jingles, NOVEDADES o chistes entre el final de SADIE y la tarjeta FIN (`08` F-8) | 0 |
| **Comprensión (Sofi)** | Después de SADIE, ¿puede decir quién murió, quién la mató y por qué Canelo sigue vivo? | 3 de 3 |

**Playtest real (humanos, cuando haya build):** se aplican las mismas preguntas en tres cortes (fin del Acto II, fin del Acto IV y después de SADIE): «¿quién crees que está en peligro?», «del 0 al 10, ¿cuánto te dolería perder a Canelo? ¿Y a Luzterna?» y, al final, «¿lo viste venir?» y «¿te pareció justo?». Es el criterio F-9 de `08`.

---

## 7. La prueba ciega (lectores que no conocen el giro)

**Por qué existe.** El panel de §3 lo simula alguien que **ya sabe** el final, y eso lo sesga: subestima cuánto se notan las pistas. El 2026-10-26 la primera prueba ciega lo demostró: mi simulación le daba 25 % de sospecha al cazador de giros y los lectores reales llegaron a 55–65 % (`04` §11). **La simulación sirve para diseñar; la prueba ciega decide.**

**Cómo se hace:**
1. Se escribe un **resumen «vista de jugador»**: lo que se ve, se oye y se lee en pantalla, en orden, sin notas de diseño, sin negritas en las pistas y con la misma prosa para lo importante y lo de relleno. Se guarda **fuera del repo** (scratchpad).
2. Se lanzan **lectores independientes** (subagentes) que no tienen acceso al repositorio. Cada uno recibe una persona de §3 y la regla: solo leer el archivo de su ronda.
3. Se entrega **por cortes**: prólogo, cada acto, y el final en tres pasos (el pico del «¡no!», el alivio, el golpe). En cada corte dan las temperaturas, el reparto QVM y **por qué**.
4. Al final: sorpresa, justicia, dolor, qué les pareció barato, **las 3–5 pistas más delatoras** y **qué los habría engañado**.
5. Se corrige el diseño y se repite con **lectores nuevos** (los anteriores ya saben).

**Límites que hay que recordar:** el resumen comprime 11 horas en unas páginas, así que **concentra** las pistas más que el juego real. Por eso la prueba es exigente a propósito: si una pista se nota en el resumen, en un foro con mil jugadores también se va a notar.
