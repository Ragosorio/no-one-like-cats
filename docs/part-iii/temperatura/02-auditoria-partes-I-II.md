# 02 · Auditoría: lo que el jugador ya vivió con Canelo y con Luzterna

> Agente TEMPERATURA · 2026-10-26. ⚠️ Spoilers de la Parte III.
> **Pregunta:** ¿con cuánto apego llega el jugador a la Parte III, a quién quiere más y qué falta construir?
> **Fuentes:** solo texto y escenas que **están en el juego**: `game/src/data/**`, `game/src/ui/story/**`, `game/src/cine/scenes/**` y los Momentos (`game/src/momentos/**`). Las rutas cuelgan de `game/src/`. Los beats se citan por id y por índice de línea (#n, desde 0).
> **Método:** registro VÍNCULO de `01` §2.1 (V vulnerabilidad · I interioridad · C cuidado activo · J el jugador actúa · D deseo propio · H humor con firma · R ritual · M muda).

---

## 0. Resumen

| | Canelo | Luzterna |
|---|---|---|
| **Apego al empezar H66** (lector promedio) | **7,0** | **6,5** |
| **Apego al terminar H69** (lector promedio) | **7,5** | **7,0** |
| De qué está hecho | **Pertenencia**: es tu primer gato, le pusiste nombre, lo llevaste al timón y peleaste para que no lo «corrigieran». Casi todo sin palabras | **Compañía**: es la voz que te acompañó unas 80 horas. Tres escenas grandes (su muerte contada, la linterna de H48 y la calle de H67) y unas 25 bromas de «estoy muerta» |
| Qué tan robusto es | **Alto en todas las personas**: funciona sin leer (tocar, nombrar, apuntar, verlo en su palmera) | **Depende del texto**: el salta-textos la tiene en 3 de 10 |
| El hueco más grande | Nunca había hablado hasta H66: hay cariño de mascota, no intimidad | Casi nunca hace algo **con las manos** ni **para sí misma**. La mitad de lo que dice en la Parte I son instrucciones |

**Lo que ya favorece al giro:**
1. **El orden ya es el que pidió el dueño.** Hoy la mayoría quiere un poco más a Canelo, que es el que tiene que parecer en peligro. La Parte III tiene que hacer que Luzterna lo **rebase**.
2. **La regla falsa está sobre-entrenada.** Unas 25 bromas de «estoy muerta» (§3.3) más la línea de H67. Nadie piensa que pueda morir. Es justo lo que hace falta, con un riesgo: que su muerte se lea como otro chiste, si el golpe no rompe el patrón.
3. **Ya hay pistas honestas en el canon** que nadie ha notado: «si algo me pasa» (Parte I), «casi me da otra vez» (Grieta del Vacío), el frío frente a la roca de REGISTRO 000 y la burbuja de *te ODIO* que rebota tinta (§7).
4. **Ya hay señales de peligro de Canelo construidas en H66 y H67**: las nueve vidas «gastadas» y la llama de la cola que baja. Nadie las comenta, y así debe ser.

**Lo que corrigió la prueba ciega (`04` §11):** con lectores que no sabían el final, **la línea de H67 («a mí ya no me puede pasar nada, gordo: ya me pasó todo») fue la bandera n.º 1** en las dos rondas, junto con el hilo que se guarda. Las bromas de muerta de las Partes I–II no delatan: son costumbre. Una promesa explícita de invulnerabilidad sí, porque suena a «últimas palabras». Conclusión: la regla falsa ya está plantada de sobra con H67 y no hay que repetirla nunca más.

---

## 1. Cómo se auditó

1. Volqué todos los beats de las Partes I, II y III (`data/content.json › story.beats`, `ui/story/script.ts`, `finaleScript.ts`, `grietasScript.ts`, `data/rupturas/historia*.json`, `data/gateras/historia.json`) y las réplicas de las elecciones (`ui/story/rupturasScriptO2.ts`, `rupturasScriptO4.ts`).
2. Busqué las escenas en las cines y los Momentos donde Canelo o Luzterna **actúan** (no solo hablan).
3. Puntué cada momento con VÍNCULO y sumé el apego por tramo.
4. Repetí la suma en **lectura muda** (sin texto) para el salta-textos.

**Lo que no se cuenta:** las frases de misión firmadas (`line`, 127 + 35) y los `DONE_QUIPS` se ven cientos de veces. Dan **familiaridad**, no apego: los cuento solo como ritual (R) cuando tienen firma.

---

## 2. Canelo: los momentos de apego que el jugador ya vivió

### 2.1 Parte I: el primer gato

| # | Momento | Cita o acción | Fuente | VÍNCULO | Δ |
|---|---|---|---|---|---|
| C-I-1 | El despertar: el primer toque del juego | «Ese que ronca en la caja se llama Canelo. Tócalo. Con cariño… o no, tú sabrás.» | `content.json` b01 #2 | **J** M | +2,5 |
| C-I-2 | Ponerle nombre | «¿Le vas a cambiar el nombre? Si le pones 'Michi' no te juzgo. Mucho.» El jugador lo nombra (`personalize()` lo usa en todo el juego) | b02 | **J** (pertenencia) | +2 |
| C-I-3 | La primera batalla: su bola de pelo contra el patito | «Arrastra desde el gato, apunta… y suelta.» | b06 #3 | J | +1 |
| C-I-4 | La Resonancia | «Canelo y Brote se fueron a hacer quién sabe qué…» | b07 #1 (CAPTION) | H | +0,5 |
| C-I-5 | Tiene miedo | «Se quedó dormida en el camarote de Canelo. Canelo no va a decir nada. Canelo le tiene miedo.» | `ui/story/script.ts:311` | H I | +1 |
| C-I-6 | La bufanda (primera vez) | «Si algo me pasa, {name}, dile a Canelo que su bufanda siempre me pareció horrible. Con cariño.» | `script.ts:112` | R (nace el objeto) | +0,5 |
| C-I-7 | La nostalgia del primer gato | «Tu primer gato lanzaba bolas de pelo. Hoy borras patos con un dedo.» | b21 #1; créditos b25 #1 | R | +0,5 |
| C-I-8 | Vive en tu isla | Su palmera, su caja, su temperamento: salta primero, da doble saltito y **nunca admite que falló** (`art/temperament.ts:235–245`). Duerme más cuando llueve (`regions/life.ts:84–91`) | Sistemas | M R (decenas de horas) | +1 |

**Al cerrar la Parte I: AC ≈ 6** (lector) · 6 (muda). Es cariño de mascota: no ha mostrado vulnerabilidad ni deseo, pero es **tuyo**.

### 2.2 Parte II: el gato que decide

| # | Momento | Cita o acción | Fuente | VÍNCULO | Δ |
|---|---|---|---|---|---|
| C-II-1 | Su Eco: la página con su nombre | «Capi, esa página dice «Canelo». NUESTRO Canelo. Ve a leerla antes de que él se entere… o peor: antes de que se la coma.» | `rupturas/historia.json` b36 #1 | D (quiere ser almirante) H | +1,5 |
| C-II-2 | Se sube al timón | «Tres victorias y no se ha bajado del timón. Ni para comer: come AHÍ. Hay migajas en la brújula.» | b37 #3 | H R | +0,5 |
| C-II-3 | **¡A BABOR!** El jugador le guarda el golpe final | «Plan: bájale la vida al rival y guárdale el remate a Canelo. Que SU tiro sea el último que le pegue. Él solo quiere la foto.» · «Sigue siendo el mismo gato impaciente. Ahora con sombrero.» + cine `cine/scenes/almirante.ts` | b38 #0, #3 | **J** D M | +3 |
| C-II-4 | **Que no lo «corrijan»** | «¿Corregir a Canelo? Canelo no está descompuesto. Canelo ES así. Eso es lo que lo hace Canelo.» · «Y que no le pongan una pata encima.» El jugador pelea por él. Cine `h46_ronron`: Canelo enseña los dientes y gana el duelo de temas (`ui/story/o2Cines.ts:13, 537`) | `historia-o2.json` b46 #1, #2 | **J** (protección) M | +2,5 |
| C-II-5 | Canelo Astral: ve lo que nadie ve | «¿Canelo? …Sigue siendo Canelo. Misma bufanda. Misma panza. Ahora brilla.» · «¿Qué ves, gordo? …No me contesta.» El jugador rompe el sello con él (crac · ¡CRAC! · ¡¡CRAAAC!!, `o3Cines.ts:15`) | `historia-o3.json` b53 #3, #4 | I (misterio) J R | +2 |
| C-II-6 | **Mentira**: su primera decisión libre | «Antes de que el lápiz toque el papel, Canelo se sube a la página. Da tres vueltas. Se acuesta encima.» · «Es la primera vez que decide algo él solito, Capi. Y decidió que todavía no.» Momento *YONOSE*: el jugador marca sus tres vueltas (`momentos/songs/yonoseTodo/score.ts:87–95`) | `historia-o4.json` b64 #3, #6 | **D** **J** M | +3 |
| C-II-7 | Después de los créditos se queda dormido en la página, junto al faro | «Amanece. Canelo sigue dormido encima de la página. Nadie se atreve a moverlo.» (`ui/story/o4Pagina.ts`, modo `canelo` → `rest`) | b65 #0 | M R | +0,5 |

**Al cerrar la Parte II: AC ≈ 7** (lector) · 7 (muda). Es el personaje más querido **sin hablar**: casi todo su apego viene de **acciones del jugador** (J).

### 2.3 Parte III ya construida (H66–H69)

| # | Momento | Cita o acción | Fuente | VÍNCULO | Δ |
|---|---|---|---|---|---|
| C-III-1 | **Habla por primera vez** | «Tú no me juzgas. Por eso te quiero.» · «Vine a olvidar, compa. A eso viene uno a un bar.» | `data/gateras/historia.json` b66_bar #0, #1 | I H | +1 |
| C-III-2 | La presión de decidir | «¡Yo! Que no sé decidir entre pescado y pescado.» · «Y yo soy el pisapapeles.» | b66_bar #31, #37 | V H | +1 |
| C-III-3 | El deseo más chico del mundo | «…Yo nomás quería una noche sin que nadie me viera.» · «Una noche. ¿Qué puede pasar en una noche?» | b66_bar #18, #40 | **V D** | +1,5 |
| C-III-4 | Las nueve vidas (y la llama más chica) | «Dicen que tenemos nueve vidas. Yo ya gasté como ocho.» · «…Bueno, no sé contar. Igual ya voy en la once.» Plano de la llamita (`cine/scenes/p3Bar.ts:408–413`) | b66_bar #16, #38 | H (+ pavor bajo) | +0,5 |
| C-III-5 | «Gracias por escuchar» → no lo escuchaba nadie | «Oye… gracias por escuchar. De verdad. Nadie me había escuchado así nunca.» → «Lleva así desde la parte del pato.» → «…¿DESDE EL PATO?» | b66_bar #20, #22, #23 | V H (risa y lástima juntas) | +1 |
| C-III-6 | El Momento Drunck: su relato | 14 inputs; ¿CUÁNTOS barcos? 3 / 40 / 1 000 (`docs/part-iii/04` §3.3) | Momento `drunck` | J H M | +1,5 |
| C-III-7 | Pide perdón | «¿Y si un día me voy a una caja y no vuelvo?» · «…Perdón por irme, Luz.» | b67_salida #11, #13 | V I | +1 |
| C-III-8 | Su bufanda | «Es mi bufanda.» / «Es horrible.» / «Por eso es mía.» | b67_salida #21–23 | H R | +0,5 |
| C-III-9 | En casa vuelve a maullar; la llama baja | Mira el peñasco vacío; la llama tiembla y baja (`ui/story/gaterasCines.ts:286, 405–438`). «¿Canelo? ¿Qué ves?» «…Ya sé. Aquí no se puede.» | b67_despierta #0, #1 | M (+ pavor) | +0,5 |

Sumados pasarían el tope, pero arriba de 8 cada punto cuesta el doble (`01` §2.1). **Al terminar H69: AC ≈ 7,5** (lector) · 7 (muda, porque la voz se pierde). La voz le dio **intimidad**, que era lo que faltaba.

---

## 3. Luzterna: los momentos de apego que el jugador ya vivió

### 3.1 Parte I: la voz que te acompaña

| # | Momento | Cita o acción | Fuente | VÍNCULO | Δ |
|---|---|---|---|---|---|
| L-I-1 | Se presenta | «Soy Luzterna. Capitana fantasma, ex-farera del Archivo y, desde hoy, tu jefa. No preguntes por qué soy transparente.» | `content.json` b01 #1 | H | +1 |
| L-I-2 | Su primera herida | «Y yo era la farera. Mi trabajo era que nadie se perdiera. …Ya ves cómo me fue.» | b18 #4 (`content.json:19345`) | V I | +1,5 |
| L-I-3 | Orgullo por el jugador | «Tu primer gato lanzaba bolas de pelo. Hoy borras patos con un dedo. Estoy orgullosa y un poquito asustada.» | b21 #1 (`content.json:19404`) | I | +0,5 |
| L-I-4 | **«Si algo me pasa»** | «…Al fondo está el Primer Mar. Si algo me pasa, {name}, dile a Canelo que su bufanda siempre me pareció horrible. Con cariño.» | `ui/story/script.ts:112` | V R | +1 |
| L-I-5 | La promesa | «Es la última pelea de esta historia. …Y después te cuento por qué estoy muerta. Lo prometo.» | `ui/story/finaleScript.ts:19` | I (crea espera) | +0,5 |
| L-I-6 | **Por qué está muerta** | «Me quedé arriba con la linterna, para que vieran por dónde caer.» · «Me quedé tanto que se me olvidó bajar. «Mantén… y suelta», ¿te acuerdas? Yo nunca solté.» · «Y tú juntaste cada página que yo alumbré. Una por una. Con croquetas.» | `finaleScript.ts:28–30` | **V C** I | +3 |
| L-I-7 | **Cuelga la linterna en tu faro** | «(Luzterna mira su linterna un largo rato. Luego la cuelga en el faro de tu isla.)» · «Listo. Ya solté. …No, no me voy a ningún lado. ¿Quién te va a decir todo lo que haces mal? Me quedo de farera. De tu faro.» | `finaleScript.ts:31–32` | **D M** H | +2 |
| L-I-8 | La promesa de quedarse | «Y si alguien abre otra caja, aquí voy a estar. Con la linterna prendida.» | `finaleScript.ts:41` | R | +0,5 |
| — | **Penalización de tutorial** | Cerca de la mitad de lo que dice en la Parte I es instrucción o táctica: presentaciones de zona y de jefe (`script.ts`), 30 presentaciones de sistemas (`features.ts`) y las Grietas (`grietasScript.ts`). «Toca la misión fijada» sale 25 veces | — | — | −2 en total |

**Al cerrar la Parte I: AL ≈ 6** (lector) · **2,5** (muda: solo la linterna colgada se entiende sin leer).

### 3.2 Parte II: la compañera con miedo

| # | Momento | Cita o acción | Fuente | VÍNCULO | Δ |
|---|---|---|---|---|---|
| L-II-1 | Te despierta de noche | «Capi. Capi. Despierta.» · «Sube al faro, que desde arriba se ve mejor. Y no hagas ruido: hay gatos durmiendo.» | `rupturas/historia.json` b31 #0, #3 | I | +0,5 |
| L-II-2 | Tiene miedo | «Mañana zarpamos. Hoy no. Hoy me da miedo. …Un poquito.» | `cine/scenes/reflejo.ts:52` | V | +1 |
| L-II-3 | Corona Celeste | «Esto me da más miedo que estar muerta, Capi.» | `historia-o2.json` b45 #3 | V | +0,5 |
| L-II-4 | **Defiende a Canelo** | «Canelo no está descompuesto. Canelo ES así.» | b46 #1 | **C** | +1,5 |
| L-II-5 | **La linterna (H48)** | «Mi linterna no alumbra para afuera porque sí. Está mandando una SEÑAL.» · «No lo sabía, Capi. Te juro que no lo sabía. ¿Qué hago? ¿La apago?» · El jugador elige (`rupturasScriptO2.ts:79–92`): si dice «apágala», «Luzterna pone la mano sobre el vidrio. Se queda así un rato largo. No la apaga.» · «La dejo encendida. Cuidar algo también es dejar que lo vean.» | b48 #0–3 | **V J D** | +3 |
| L-II-6 | No hay a quién culpar | «No sé si estoy enojada. Creo que sí. Pero no hay a quién gritarle. Nadie aquí es malo, Capi. Eso es lo peor.» | `historia-o3.json` b52 #4 | I V | +1 |
| L-II-7 | **«Nunca me contesta»** | «¿Qué ves, gordo? …No me contesta. Nunca me contesta. Pero ahora parece que alguien sí le contesta a él.» | b53 #4 | **V** (su soledad con Canelo) | +1 |
| L-II-8 | Tu letra | «Capi… ¿desde cuándo escribes así de bonito?» · «…No me contestes. No ahorita.» | b56 #3, #4 | I | +0,5 |
| L-II-9 | Lo más bonito | «De nada, grandote. Ve a nadar donde quieras. …Eso fue lo más bonito que he visto estando muerta.» | b57 #3 | I H | +0,5 |
| L-II-10 | **El escudo de *te ODIO*** | El jugador **sostiene** «¡ESCUDO!» y la linterna de Luzterna hace una burbuja que **rebota la tinta** del grafiti de Grafitera: «¡REBOTE!» | `momentos/songs/teOdio/score.ts:123`; `verbs.ts:429–470` | **J** C M | +2 |
| L-II-11 | Los Ecos | «Misma panza, otro destino. Y aun así eligió quedarse contigo.» | `historia-o4.json` b59 #5 | I | +0,5 |
| L-II-12 | La página: «Canelo, en serio» | «Canelo. Bájate. …Canelo, en serio.» · «Es la primera vez que decide algo él solito, Capi.» | b64 #4, #6 | C H (orgullo por él) | +1 |
| — | Penalización de tutorial | En los beats de la Parte II baja a cerca de 1 de cada 4 líneas (mecánicas de cada elemento, «toca la misión fijada») | — | — | −1 |

**Al cerrar la Parte II: AL ≈ 6,5–7** (lector) · **3** (muda).

### 3.3 La regla falsa ya entrenada: las bromas de «estoy muerta»

Antes de la Parte III el jugador ya oyó, solo en texto con hablante, **al menos 22 veces** que la muerte de Luzterna es un chiste. Varias son de las que se repiten al azar (`DONE_QUIPS`, el faro), así que en una partida larga suman **decenas de exposiciones**:

| Dónde | Cita |
|---|---|
| `ui/story/script.ts:88` | «Bueno, yo ya no tomo café. Estoy muerta. Pero me acuerdo del mal humor.» |
| `script.ts:288` | «Ni yo tengo uno. Bueno, yo tengo uno: yo. Pero estoy muerta, no cuento.» |
| `ui/story/text.ts:264` (`DONE_QUIPS`, al azar en cada misión cumplida) | «Ni yo lo hubiera hecho mejor. Bueno, sí. Pero estoy muerta.» |
| `ui/story/rupturasScript.ts:109` (`FARO_LUZTERNA`, al tocar el faro) | «Renta gratis. Ventaja de estar muerta.» |
| `finaleScript.ts:19, 29` | «Y después te cuento por qué estoy muerta.» · «Yo nunca solté.» |
| `ui/story/grietasScript.ts:30, 42, 86` | «Yo no tengo sombra, estoy muerta.» · «Y yo ya me morí. Así que imagínate.» · **«Ya me dio, estoy muerta, pero casi me da otra vez.»** |
| `rupturas/historia.json:281, 312` | «Yo ya no salgo y no me quejo.» · «¿Corregirnos? Sobre mi cadáver. …Ah, verdad.» |
| `historia-o2.json:188, 404` | «Ok. Ok. Respira. …Yo no respiro. Tú respira.» · «Aquí hay gatos, un faro y una muerta muy enojada.» |
| `historia-o3.json:393, 427` | «Yo te detengo la pluma. Bueno, no puedo, soy fantasma.» · «…Eso fue lo más bonito que he visto estando muerta.» |
| `regions/paginas/lore.ts:39, 114` | «Y estoy muerta: he leído MUCHO.» · **«Qué raro que una roca vacía me dé tanto frío. Estoy MUERTA, no debería tener frío.»** |
| `app/story.ts:865` | «En mi defensa: estoy muerta. Se me olvidan los modales. Y las llaves. Y el cuerpo.» |
| `data/updates.ts:141` (NOVEDADES) | «Te prometí que te contaba por qué estoy muerta.» |
| `panels/Settings.ts:368` (interfaz) | «Luzterna se queda (ya está muerta, no le afecta).» |
| Parte III: `data/gateras/historia.json` b67_salida #2, #12, #19 | «Tú estás muerta. No combina.» · «Y a mí ya no me puede pasar nada, gordo: ya me pasó todo.» · «No le hice. Me morí. No te lo recomiendo.» |

**Lectura:**
- La regla falsa **no hay que construirla: hay que mantenerla y rematarla.** Nadie en el panel le da más de 5 % a la muerte de Luzterna al empezar la Parte III, salvo el cazador de giros (`04` §8).
- **Riesgo:** con tantos chistes, su muerte puede leerse como uno más («¿otra vez lo de muerta?»). Por eso el golpe tiene que **romper el patrón del chiste**: su último chiste queda cortado a media palabra y ella misma se sorprende («…Ah.», `04` §6).
- **Ojo con la interfaz:** la línea de Ajustes la dice el sistema, no ella. Habla de borrar la partida, no de morir, así que no rompe la regla «el juego nunca lo afirma». Pero hay que quitarla después de H93 (`08` §6.2, fila 11).
- **Dos de estas bromas son pistas honestas** sin que nadie lo sepa: «casi me da otra vez» y el frío frente a la roca de REGISTRO 000. Las uso en `04` §2.

### 3.4 Parte III ya construida (H66–H69)

| # | Momento | Cita o acción | Fuente | VÍNCULO | Δ |
|---|---|---|---|---|---|
| L-III-1 | Canelo habla de ella sin que esté | «Y la Luz… su linterna manda señal para afuera.» · «Ella la dejó prendida, porque así es ella: cuida dejando que la vean.» | b66_bar #17, #39 | R (la quieren) | +0,5 |
| L-III-2 | Lo encuentra | «Canelo.» · «Te seguí el pelo. Dejaste pelo en TRES cajas, gordo.» Le levanta la bufanda como correa | b67_salida #1, #3 | C H M | +1,5 |
| L-III-3 | La caminata (el jugador toca y ella lo endereza) | «Derecho. DERECHO. Eso no es derecho, eso es una opinión.» Crece enorme al regañar (`cine/scenes/p3Salida.ts:9`) | b67_salida #8 | **J** H M | +2 |
| L-III-4 | **«Te voy a buscar»** | «Te voy a buscar. Es mi trabajo. Y a mí ya no me puede pasar nada, gordo: ya me pasó todo.» (su luz baja apenas, `p3Salida.ts:191–192`) | b67_salida #12 | **C** | +1,5 |
| L-III-5 | **Por primera vez le contesta** | «Es la primera vez que te oigo, ¿sabes? Toda la vida hablándote y tú nomás «mrr».» · «Pues habla más seguido. Aunque sea para pedir perdón.» | b67_salida #14, #16 | **D** V | +1,5 |
| L-III-6 | Su muerte, en broma, a Canelo | «Luz… ¿tú cómo le hiciste? Para cargar esa linterna tanto tiempo.» · «No le hice. Me morí. No te lo recomiendo.» | b67_salida #18, #19 | I H | +0,5 |
| L-III-7 | El hilo | Sonríe sin que él la vea y **se guarda un hilo suelto** de la bufanda en la manga (inserto V4) | `docs/part-iii/04` §5.3; `p3Salida.ts` V4 | M D | +1 |
| L-III-8 | «Una noche. Ojalá.» | (bajito, mirando al bar) | b67_salida #24 | I V | +0,5 |
| L-III-9 | Dibuja la Carta | «Si mi gato cruza cajas y algo lo sigue, yo necesito una carta. Era farera. Mi trabajo era que nadie se perdiera.» Animación de su mano dibujando | b68_carta #0 | C D M | +1,5 |
| L-III-10 | Humor de negocios | «Le pagamos a una conserje con llaves. Esto ya es un negocio.» | b68_carta #4 | H | +0,5 |

**Al terminar H69: AL ≈ 7** (lector) · **4** (muda). H67 es, por mucho, **la mejor escena de apego de Luzterna en todo el juego**, y el dueño la aprobó (`13` §0). Sus ingredientes son la receta para el resto de la Parte III: el jugador actúa con ella, ella cuida a Canelo, ella quiere algo para sí, hay un chiste y luego algo bajito.

---

## 4. Niveles actuales por persona (al terminar H69)

Las personas de `01` §3. AC y AL de 0 a 10.

| Persona | AC | AL | ¿A quién quiere más? | Por qué |
|---|---|---|---|---|
| **Vale** (casual) | 7,5 | 6,0 | Canelo | Lo vio, lo nombró y lo usó. A Luzterna la quiere por H67 y por los chistes cortos; los bloques largos (su muerte contada, la linterna) los pasó rápido |
| **Ramiro** (cazador de giros) | 6,5 | **7,5** | Luzterna | Leyó todo: la linterna de H48, «nunca me contesta», su muerte. Canelo le interesa como enigma (ve a REGISTRO 000) |
| **Sofi** (niña) | **8,0** | 4,5 | Canelo | Es un gato gordo con bufanda que se emborracha y se cae. Luzterna es «la fantasma que habla mucho»; le gustó cuando creció enorme y regañó |
| **Toño** (salta-textos) | 6,0 | **3,0** | Canelo | Lo usa en la tripulación. A Luzterna la conoce como el cuadro amarillo. Lo único que vio de ella sin leer: la linterna colgada, la burbuja de *te ODIO* y la calle de H67 |
| **Marta** (veterana) | 8,0 | 8,0 | Empate | 80 horas con los dos. Se acuerda de «si algo me pasa» |
| **Lector promedio** (Vale + Marta) | **7,5** | **7,0** | Canelo, por poco | — |

**Diagnóstico:**
- El punto de partida sirve para el engaño: **4 de 5 quieren igual o más a Canelo**.
- **Lo que hay que construir:** que AL rebase a AC antes del Acto IV en las cinco personas. Para Sofi, la meta realista es AL ≥ AC − 0,5. La mayor distancia es **Toño: +3,5 puntos en lectura muda**, y solo se cierra con imágenes y acciones.

---

## 5. El dúo: lo que ya vivieron juntos

| Momento | Quién hace qué | Ida y vuelta |
|---|---|---|
| b01 (Parte I) | Ella lo presenta; él ronca | Solo ella |
| `script.ts:112` | Ella le manda un recado | Solo ella (el recado nunca se entrega: se paga en H95) |
| b46 | Ella lo defiende de los Correctores | Él enseña los dientes en la cine: **acción** |
| b53 | «¿Qué ves, gordo? …No me contesta. Nunca me contesta.» | Solo ella, y lo dice |
| b64 / YONOSE | Ella le pide que se baje; él se duerme encima. En el Momento, ella lo pica (`yonoseTodo/score.ts:15`) | Él la ignora, con cariño |
| **H67** | Ella lo regaña, lo lleva de la bufanda y le promete buscarlo; él le pide perdón y le contesta | **La primera conversación de los dos** |
| H67, despertar | Ella le pregunta qué ve; él solo maúlla. «…Ya sé. Aquí no se puede.» | Ella lo entiende sin palabras |

**Hallazgo:** durante dos partes el vínculo fue **de un solo lado**: ella le habla y él no contesta. H67 lo abrió. Es la escena que más apego le dio a los dos a la vez, y la Parte III tiene que repetir esa fórmula en cada respiro (♥).

---

## 6. Huecos: lo que la Parte III tiene que construir

| # | Hueco | Para quién | Qué hacer (detalle en `03` y `04`) |
|---|---|---|---|
| G1 | **El apego a Luzterna depende del texto** (lectura muda: 4) | Toño, Sofi, Vale | Escenas de apego que funcionan sin leer: teje, carga a Canelo, le arregla el faro, cuida a Cerito, salva a Firma, crece enorme al regañar. Las películas son la oportunidad (`14` §2) |
| G2 | **El jugador casi nunca actúa por ella** (solo H48 y el escudo de *te ODIO*; por Canelo, tres veces: H38, H46 y H64) | Todos | Acciones del jugador para ella: devolverle la linterna (H72), arreglarle el faro (H78), elegir dónde deja la cobija (H78), su batalla como comandante (H87), elegir la foto (H90) |
| G3 | **Luzterna casi no quiere nada para sí** (solo «una luz de casa», L-I-7, y «habla más seguido», L-III-5) | Todos | Darle deseos de futuro que la muerte corte: oír a Canelo en casa, ver a Cerito con forma, darle la bufanda, cantar en el karaoke. Un deseo cortado es lo que más duele |
| G4 | **Nunca ha estado en peligro físico, y Canelo tampoco** (los KO de batalla no cuentan como historia) | Todos | Peligro real y creciente **solo para Canelo** (`04` §4). Para ella, pruebas de que nada la toca (`04` §5) |
| G5 | **Nunca la vimos ser competente peleando**: comenta desde afuera | Ramiro, Toño | H87, su batalla. Y que se vea en el mapa: su linterna ilumina trayectorias |
| G6 | **El vínculo de los dos era de un solo lado** (§5) | Todos | Una escena de dúo con ida y vuelta en cada capítulo ♥ |
| G7 | **Es la voz de tutorial** (25 «Toca la misión fijada») | Todos | En la Parte III, las instrucciones las llevan la tarjeta de misión y la Bitácora. Cada línea de ella es personaje, no manual |
| G8 | **Las bromas de muerta pueden convertir su muerte en chiste** (§3.3) | Ramiro, Marta | El golpe rompe el patrón: el chiste cortado y el «…Ah.» (`04` §6). Después, el chiste no vuelve nunca |
| G9 | **La bufanda que teje no existe todavía**: solo el hilo de H67 | Todos | Verla tejer por lo menos 3 veces (H72, H78, H92) y que el jugador sepa que es para Canelo |
| G10 | **Canelo sigue siendo mudo en casa** | Todos | Así se queda (`08` §6.3). Su intimidad vive en las cajas: cada viaje es también «ir a oír a Canelo» (`02` §4.6) |

---

## 7. Pistas y señales que ya están sembradas (para `04`)

**Pistas honestas de que Luzterna puede morir** (nadie las ha notado como tales):

| Pista | Fuente |
|---|---|
| «Si algo me pasa, {name}, dile a Canelo…» | `ui/story/script.ts:112` |
| «Me quedé tanto que se me olvidó bajar… Yo nunca solté.» y «aquí voy a estar. Con la linterna prendida.» | `finaleScript.ts:29, 41` |
| «Ya me dio, estoy muerta, pero casi me da otra vez.» | `grietasScript.ts:86` |
| «Qué raro que una roca vacía me dé tanto frío. Estoy MUERTA, no debería tener frío.» Siente frío **frente a la roca de REGISTRO 000** | `regions/paginas/lore.ts:114` |
| «Y si alguien viene, que venga.» | `historia-o2.json` b48 #4 |
| La burbuja de *te ODIO* rebota tinta mientras el jugador la sostiene | `momentos/songs/teOdio/score.ts:123` |
| «Y a mí ya no me puede pasar nada, gordo: ya me pasó todo.», con su luz que baja apenas | `data/gateras/historia.json` b67_salida #12; `cine/scenes/p3Salida.ts:191–192` |

**Señales de peligro de Canelo:**

| Señal | Fuente |
|---|---|
| «Yo ya gasté como ocho.» / «Igual ya voy en la once.» + la llamita más chica | b66_bar #16, #38; `cine/scenes/p3Bar.ts:408–413` |
| La llama de la cola tiembla y baja cuando se rasga la gatera | `ui/story/gaterasCines.ts:286, 405–438` |
| Es el único que ve a REGISTRO 000 | `historia-o3.json` b53 #4 |
| «Una noche. ¿Qué puede pasar en una noche?» | b66_bar #40 |
