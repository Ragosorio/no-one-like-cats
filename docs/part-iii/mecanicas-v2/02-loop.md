# 02 · El loop jugable de la Parte III

> Agente **MECÁNICAS**, ronda 4, oleada 1 (2026-10-26). Es diseño: nada de esto está implementado salvo lo que se marca como «existe».
> ⚠️ Contiene spoilers de la Parte III.
> Base: `14-plan-cinematografico.md` (el contrato), `05` (Carta y dimensiones), `06` §1 (rareza), `03-actos` (= `../03-actos-y-capitulos.md`). Aquí, `03-plan` = `03-plan-implementacion.md` de esta carpeta. Si NARRATIVA cambia el orden de capítulos o misiones en `historia-v2/`, **este loop no se rompe**: las puertas de historia son datos (`dims[].story`, `nodes[].requires`).

---

## 0. El loop en una frase

**Ves una película que te dice qué pasa, contra quién vas y qué te juegas → zarpas con la estimación honesta en la mano → peleas con una regla que entiendes → ganas algo que se ve → la Carta crece → la siguiente película.**

Lo que el dueño pidió, traducido a reglas de diseño:

| Pedido | Regla del loop |
|---|---|
| «Entiendo qué estoy haciendo… a qué me estoy metiendo antes de una batalla» | Toda batalla tiene presentación (§8). La presentación **termina en la estimación** («Con esta tripulación: 72 %») |
| «Muchos más gatos, muchas más cosas» | 8–10 gatos nuevos por dimensión (§4) y algo nuevo en la Carta después de cada capítulo |
| «Mucha energía, mucha dopamina» | Algo visible en **cada** batalla, algo con forma de gato en **cada** capítulo y un momento grande por dimensión (§5). Batallas con riesgo real (§6) |
| «Que ya se pueda jugar algo» | El plan de `03-plan` deja una dimensión completa jugable (Borracha) en la oleada 2 sin esperar arte ni historia nueva |

---

## 1. El loop en tres escalas

### 1.1 Una batalla (3–6 min)

```
Carta ─ toca la etapa ─► TARJETA (rival, regla, botín, ESTIMACIÓN en vivo)
   └─ ZARPAR ─► [PELÍCULA DE PRESENTACIÓN: 1.ª vez obligatoria si es de historia; si no, la tarjeta animada de 6–8 s]
                 (mientras corre: se arma el BattleSpec y la estimación termina sus 40 simulaciones)
             ─► BATALLA (la regla en los chips; 4–8 turnos en una normal, 8–12 en élite y jefe)
             ─► VICTORIA: sello de la caja + huellas que vuelan a la Carta + lo que se desbloqueó
             ─► Carta: la ruta se entinta, aparece el nodo nuevo, nota al margen de Luzterna
```

- **Perder no cuesta nada más que tiempo**: 30 % del oro, ninguna huella, y un consejo honesto de la estimación («Prueba con Fuego: ×1.5 contra su casco»).
- **Reintentar no repite la película**: muestra la **tarjeta de regla** de 3 s (el recordatorio) y zarpa.

### 1.2 Un capítulo (15–35 min)

```
TARJETA DE CAPÍTULO (película corta: título con el estilo de la caja + PASA / IMPORTA / QUEREMOS / AHÍ)
 ─► 2–4 batallas, o una actividad, o una escena jugable (los capítulos ♥ no tienen pelea obligatoria)
 ─► película de cierre o escena corta
 ─► CAMBIÓ (se escribe a mano) + recompensa del capítulo (§5)
```

### 1.3 Una dimensión (1 h 30 – 3 h)

```
Puerta: historia (misión) + 25 huellas + oro (Maneki)  ─► la gatera se cose
 ─► película de la regla (X-1 la enseña) ─► ruta X-1…X-4 ─► élite X-5 (primer muro)
 ─► actividad de la dimensión (revela el desvío) ─► desvío (3 nodos, un rescate) ─► X-6…X-8
 ─► jefe X-9 (película de canción si le toca una) ─► gato Multidimensional / nativo ─► 34 huellas
 ─► se abre la rasgadura a la siguiente
```

Los encuentros (íconos que se mueven por la Carta) aparecen por avance de la historia, **nunca por reloj**, y se quedan hasta que los vences.

---

## 2. La Carta: progresión y puertas

### 2.1 Tres llaves por dimensión (existe para la Borracha)

| # | Dimensión | Llave de historia (`dims[].story`) | Huellas | Oro (s de ingreso / piso) | Forma |
|---|---|---|---|---|---|
| 1 | Borracha · La Última Ronda | H68 activa o hecha (**existe**) | 0 | 900 s / 4.5 B (**existe**) | Ruta de 9 + desvío «Trastienda» (3) + La Ronda (4 locales) |
| 2 | Superhéroes · Ciudad Mayúscula | el jefe de la Borracha (H73 en `03-actos`) | 25 | 1 800 s / 9 B | Página de cómic: 9 viñetas en orden de lectura + Patrulla (3 llamados) |
| 3 | Anime · Mar Shōnen | el jefe de Superhéroes (H76) | 25 | 2 700 s / 13.5 B | Llave de torneo (preliminares → final) + 3 islas de entrenamiento libres |
| 4 | Libros · Ex Libris | el punto medio (H81) | 25 | 3 600 s / 18 B | Estante: 3 cuentos en el orden que elijas; el índice se abre con 3 finales devueltos |
| 5 | POP · La Gira | el jefe de Libros (H87) | 25 | 4 500 s / 22.5 B | Gira: las fechas en el orden que elijas; el escenario principal al final |

- **Huellas:** 3 por primera victoria de cada nodo de pelea + 10 por el jefe ≈ 34 por dimensión (existe). Los nodos del desvío también dan 3: **explorar da margen** (hasta 43), pero **nunca hace falta farmear**: 34 − 25 = 9 de sobra al pasar.
- **Las huellas no se venden ni se compran.** Son el rastro de Cerito. Nada en la tienda cuesta huellas (evita que alguien se gaste las de la siguiente puerta).
- **El oro** es el sumidero con personaje (Maneki), no el candado. Ver §5.4 para que el veterano siga queriendo oro.
- **Precio con el ingreso pico** (nuevo): `max(piso, max(ingreso actual, ingreso pico visto) / Marea × s)`. Evita bajar el precio vaciando hábitats (`01` §4.5).

### 2.2 Dentro de una dimensión: un grafo de nodos, no una línea

El esquema actual (`cleared: number`) solo sabe de líneas. El loop necesita **nodos con requisitos** (detalle de datos en `03-plan` §1.3):

| Tipo de nodo | Se abre cuando | Da |
|---|---|---|
| `stage` / `elite` / `boss` | sus `requires` están ganados (línea: el anterior; llave: los dos de su rama; estante: cualquiera) | huellas la 1.ª vez; oro siempre |
| `desvio` | la actividad lo revela (flag) | un rescate (gato) o un secreto |
| `actividad` | la misión que la presenta | orbes, gatos, la revelación del desvío |
| `encuentro` | un flag de historia; en el post-juego, una semilla de la partida | un gato suelto, una línea de Bitácora |
| `escena` | un flag | una película o escena chica en la Carta |

La Borracha hoy es el caso «línea» y **sigue funcionando igual** con el modelo nuevo.

---

## 3. Cada dimensión: su regla, cómo se enseña y contra quién

**Principio:** una regla por dimensión, **reusando perillas** del simulador. La regla tiene que **cambiar cómo juegas**, no solo los números. Y cada regla se enseña **dos veces**: en la película de presentación de X-1 (la ves funcionar) y en la tarjeta de etapa (la lees).

**Cómo se enseña en la película** (gramática común para las cinco):
1. **Situación** (5 s): dónde estamos, con el título en el estilo de la caja.
2. **La regla en acción** (8–15 s): una **demostración determinista** hecha con el propio simulador (`Battle.integrate` sin pantalla de batalla): el mismo tiro dos veces, una bien y otra mal, con la trayectoria dibujada. Lo que se ve es exactamente lo que va a pasar.
3. **El rival** (5–10 s): su pintura, su nombre, su frase y **cómo usa la regla** en tu contra.
4. **Qué arriesgamos** (3–5 s): una línea de historia.
5. **Cierre**: el sello de la regla + la estimación («Con esta tripulación: 72 %») + ZARPAR.

### 3.1 Borracha · regla **MAREO** (existe)

| | |
|---|---|
| **Qué hace** | La guía se balancea (seno, con semilla) y el tiro sale por donde iba al soltar; desvío chico invisible; donas que curan al que las tiene; botellas que caen cada N turnos; karaoke (ulti +1 turno). `battle/mareo.ts` |
| **Qué cambia en tu juego** | Esperar el centro del vaivén; **no** darle a las donas (priorizar módulos); jugar con el reloj de las botellas |
| **Película de B-1** | La guía se mece; congelado en el borde → el tiro falla por un barco; congelado en el centro → pega. Gelatino, hipando: «¿Va a pagar eso?» |
| **Película de B-2** | Un tiro cae en la dona: el panadero se la come y su barra de vida sube en rosa. Luzterna: «NO le des de comer» |
| **Película de B-3** | El contador «BOTELLAS EN 2» baja; caen las botellas. «Mata al que las tira antes del turno 2» |

**Ruta completa** (B-1…B-5 existen; B-6…B-9 propuestas con perillas que ya existen; números calibrados en §6):

| Etapa | Tipo | Regla y prueba | Plantel (suplentes de especies existentes) | Qué enseña |
|---|---|---|---|---|
| B-1 Hipo-Mart | normal | Mareo suave | Gelatino, Burbujas (Agua) | Esperar el centro |
| B-2 La Donería | normal | + 1 dona | Brote, Musgo, Burbujas | No darle a la dona |
| B-3 Callejón de las botellas | normal | + botellas cada 3 | Espumita, Fanguito, Burbujas | El reloj de las botellas |
| B-4 Karaoke | normal | + karaoke **y dos gatos de Sonido** (aturden): es la etapa que **enseña** el control | DJ Bigotes, Tamborín, Marejada | Repartir la tripulación: un aturdido no dispara |
| **B-5 Oficial Dona** | élite | 3 donas | Oficial Dona (Terrón), Guijarro, Imán, Musgo | Priorizar módulos |
| B-6 Planta embotelladora | normal | Botellas cada 2 (el cataclismo de botellas) | La Embotelladora (Vaporronin), Marejada, Espumita, Neblino | Ganar rápido |
| B-7 El parque de la resaca | normal · **mañana en B/N** | Vaivén lento y ancho (±6°, 3.6 s), desvío ±1.6° | Don Bombín (suplente: Titiritera), Kage, Sombrita, Sonámbulo (Sombra) | Paciencia; la Sombra apuñala |
| B-8 La fila del baño | normal | Repaso: 2 donas + karaoke + botellas | Diva (el único gato de Sonido), Marejada, Espumita, Fanguito. **Con 4 de Sonido (primer borrador) la tripulación piso caía a 25 %** | Todo junto (prueba de fin de ruta) |
| **B-9 El Cadenero** | jefe | Mareo fuerte + 2 donas + botellas; fase 2 al 50 %: cierra la puerta (`fases`) | El Cadenero (suplente: Bastión épico), Golem, Contrapeso, Infernal (Tierra) | Todo lo aprendido |
| Desvío «Trastienda» (3) | normal ×3 | Variantes cortas (ganar en 3 turnos; sin perder módulos) | — | Un rescate: **Don Bombín** se une |
| La Ronda (4 locales) | actividad | Batallas cortas con condición de bar (`05` §4), semilla de la partida | — | Orbes de Hipólito; revela el desvío |

### 3.2 Superhéroes · regla **ONOMATOPEYA** (nueva)

| | |
|---|---|
| **Qué hace** | Un golpe fuerte (ulti, crítico o ≥ 18 % del casco de una celda… valor a calibrar) deja un **bloque de letras sólido** («¡KRAK!») **delante** de la cubierta golpeada, entre los barcos. Dura 2 turnos y bloquea tiros **de los dos lados** |
| **Perillas** | Geometría y choque de los islotes de `cielo.ts` (obstáculos temporales entre los barcos) + un `ttl` de 2 turnos. Estado en `WeakMap`, determinista |
| **Qué cambia en tu juego** | Pegar fuerte **te tapa tu propio siguiente tiro**: hay que alternar el ángulo, romper las letras o usar trayectorias que las rodean (rayo, onda, bombeo alto) |
| **Película de S-1** | Viñeta 1: tu ulti pega, aparece «¡KRAK!». Viñeta 2: tu siguiente tiro se estrella en la K. Viñeta 3: bombeo alto por encima. Rótulo: «LAS LETRAS TAMBIÉN PEGAN» |
| **Rivales** | Villanos sueltos (Rayo, Fuego, Sombra); **Cruceta** (S-9) usa sus letras como escudo y tira desde atrás |
| **Élite S-5** | La Pandilla del Ovillo: 3 gatos chicos que generan letras seguido |
| **Jefe S-9 Cruceta** | Fase 2: salva al gatito civil (la batalla se pausa un turno: escena) |

### 3.3 Anime · regla **PODER** (nueva)

| | |
|---|---|
| **Qué hace** | Bajo el 50 % de vida, cada gato **carga aura una vez**: su siguiente tiro hace +25 % (un solo uso). Para los dos lados |
| **Perillas** | Efecto de FASES por lado (`fases.ts`) o un módulo mínimo `battle/poder.ts` (~80 líneas) |
| **Qué cambia en tu juego** | No dejes a un enemigo a medias (su tiro siguiente pega más); tu gato herido es tu golpe guardado |
| **Película de A-1** | Corte diagonal: el gato herido grita, aura, flashback de 1 s, el tiro fuerte |
| **Rivales** | Luchadores varados (rosters de Fuego, Tormenta, Sonido); A-5 «El rival que no te conoce» (espejo de tu gato más fuerte) |
| **Jefe A-9 Itō** | Momento «Daria» en el cambio de fase (`fases.endsBattle`, como la Parte II) |

### 3.4 Libros · regla **CAPÍTULOS** (perillas existentes)

| | |
|---|---|
| **Qué hace** | La batalla se divide en capítulos de 3 turnos y cada uno trae una regla escrita: **lluvia** (`wetAll`), **calma** (viento 0), **raíz** (`regrow` a los dos) |
| **Perillas** | `fases` con `at:{turn}` + `env.calm` + efectos existentes. **Cero código de simulación nuevo** |
| **Qué cambia en tu juego** | Planear por capítulo: Tormenta pega más con lluvia; con calma, los tiros largos son exactos |
| **Película de L-1** | Una página se pasa: «Capítulo II: Lluvia». Las celdas se mojan; un rayo salta de celda en celda |
| **Rivales** | Personajes que se escaparon de su cuento; **la Encuadernadora** (L-5) escribe dos capítulos juntos |
| **Jefe L-9 Esquirla** | Escribe un capítulo **suyo** cada fase (`fases` por fase) |

### 3.5 POP · regla **RITMO** (SINCRO ampliada)

| | |
|---|---|
| **Qué hace** | La SINCRO de la Parte II (`battle/sincro.ts`) abierta a **cualquier par del mismo elemento**: tiro en el beat con un compañero vivo del mismo elemento = combo de ese elemento |
| **Ojo con la estimación** | Hoy la estimación **nunca** pasa la SINCRO (es una entrada del jugador): sería pesimista en POP. Propuesta: la estimación asume que **la mitad** de los tiros elegibles caen en el beat (fase sembrada, como el Mareo) y lo dice en ¿POR QUÉ? |
| **Qué cambia en tu juego** | Armar la tripulación en parejas; la lista de canciones de La Gira cambia qué elemento tiene SINCRO |
| **Película de P-1** | Prueba de sonido: dos gatos de Fuego disparan en el beat, el combo explota con luces |
| **Jefe P-9 Firma** | Fase 2: el escenario se cae (`fases`), Luzterna la salva (escena) |

### 3.6 El Final · **OSCURIDAD**

Se construye en el Acto II como la regla de origen de Murciégato (Noche) y el Final la reusa probada (`09` §3). Diseño en `08` §3.

---

## 4. Los gatos de referencia: cómo se consiguen sin pagar nada

**Regla de oro (de `06` §1.6):** los gatos de la Parte III **nunca** salen del Portal, del Casino ni de la Resonancia. No hay nada pagado en el juego.

| Fuente | Qué da | Cuándo | Ejemplos |
|---|---|---|---|
| **Historia** | El gato completo, una vez | Al ganar una etapa marcada o terminar un capítulo | Hipólito (H73), Gato Araña (S-6), Murciégato (H76) |
| **Rescate** (desvío o encuentro) | El gato completo | Al ganar el nodo de rescate | Don Bombín (Trastienda), Sonrisa (Libros, secreto) |
| **Actividad** | Orbes del gato; **el gato** al llegar a un umbral de la actividad | La Ronda, Patrulla, Entrenamiento, Finales perdidos, La Gira | Los orbes de Hipólito en La Ronda |
| **Repetir etapas** | Orbes del Multidimensional de esa caja (si ya lo conociste) | Siempre que repites; 35 % de probabilidad, sembrada | Orbes de Murciégato en Ciudad Mayúscula |
| **Recordar** (post-juego) | Los Titiriteros como coleccionables | Una misión corta por cada uno (`05` §9) | Itō, Cruceta, Firma |
| **Maneki · Tienda de la Caja** | **Orbes** (nunca el gato) de gatos que **ya conociste**, con oro | Siempre | Sumidero de oro del veterano (§5.4) |

**Cantidad objetivo:** 8–10 gatos nuevos por dimensión (2 de historia, 1 de rescate, 1–2 de actividad, 1–3 Multidimensionales, el capitán de la élite como coleccionable, el jefe en el post-juego) → **40–50 en la Parte III**. El catálogo concreto lo define ARTE (`arte-v2/`); el loop solo reserva los **huecos** y su fuente.

**Ritmo:** un gato nuevo cada **25–35 min** de juego. Ninguna fuente pide repetir.

---

## 5. Recompensas: dopamina sin farmeo

### 5.1 Principios

1. **Algo visible en cada batalla.** Nunca «solo oro».
2. **Algo con forma de gato en cada capítulo** (el gato, sus orbes o su ficha).
3. **Un momento grande por dimensión** (película de canción, Multidimensional, gatera nueva).
4. **Nada pide repetir, esperar ni pagar.** Repetir da extras opcionales.
5. **La recompensa cuenta la historia**: las huellas son el rastro, las fotos son el viaje, la Bitácora es la letra de ella.

### 5.2 La cadencia

| Cada… | Recompensa | Por qué se siente |
|---|---|---|
| **Batalla ganada (1.ª vez)** | 3 huellas que **vuelan a la Carta** y estiran el rastro de Cerito; el **sello** de la caja en la Bitácora (uno distinto por etapa, en el estilo de la caja); la nota al margen de Luzterna aparece | El mapa cambia frente a ti |
| **Élite o jefe ganado** | Una **foto del viaje** sacada sola (la escena de la victoria); 10 huellas en el jefe; el capitán entra al Catdex | Las fotos vuelven en la cabina de H89 y en las placas de SADIE (`08`): **la recompensa paga después, con lágrimas** |
| **Capítulo** | Un gato, sus orbes o su ficha; la línea CAMBIÓ escrita a mano; una canción nueva en la Fonoteca cuando toca | Cierre emocional + colección |
| **Actividad completada** | Orbes del gato de la dimensión + revelar el desvío | La Carta tiene un camino que antes no estaba |
| **Dimensión** | La película de canción del jefe (si le toca); el Multidimensional; la gatera nueva que se cose; la decoración de la caja para tu isla | El momento grande |
| **Repetición** | Oro ×0.7 (como siempre) + 35 % de orbes del Multidimensional de esa caja | Opcional, nunca obligatorio |

### 5.3 La pantalla de victoria de la Carta (nueva, chica)

Hoy la victoria muestra oro y chatarra. Propuesta: **tres golpes** en 2.5 s, saltables:
1. **El sello** cae sobre la página (sonido de sello, el estilo de la caja).
2. **Las huellas** vuelan a la Carta (se ven al volver).
3. **Lo nuevo** («B-6 abierta», «Desvío revelado», «¡Foto!»), y abajo, chico, el oro.

### 5.4 Que el oro siga importando (partidas avanzadas)

El precio de las gateras sigue al ingreso, así que el oro **no frena** a nadie. Para que el veterano tenga en qué gastar con sentido:

| Sumidero | Precio | Poder | Por qué tiene sentido |
|---|---|---|---|
| **Orbes de gatos ya conocidos** en la Tienda de la Caja (Maneki) | En minutos de ingreso, como los paquetes de orbes (`shop.ts:47-59`: 3–30 min por 5 orbes) | Sí (estrellas) | Acelera estrellas de los gatos de la Parte III sin saltarse la historia |
| **Decoración de la caja** para tu isla (una por dimensión) | 30–60 min de ingreso | No | Vida en la isla |
| **Hábitat de dimensión** | Lo de un tier 8 + cristales | No (conductas) | Los gatos de la caja viven en su estilo |

---

## 6. Curva de dificultad (medida con el simulador)

### 6.1 Cómo se midió

- **Simulador:** `autoBattle` (el de la estimación), 32 batallas por celda, mitad puntería `normal` y mitad `hard`; IA enemiga de cada etapa.
- **Partida:** `test-saves/h65-normal.json` (Bastión Mk6, 17 M/s), con la tripulación cambiada en memoria.
- **Tripulaciones:**

| Id | Qué representa | Gatos |
|---|---|---|
| `h65` | la partida típica al terminar la Parte II | 6 legendarios + 1 épico, Nv45 ★3 (la de la fixture) |
| `medio40` | quien no persiguió legendarios | 4 épicos + 3 raros, Nv40 ★2 |
| `raros40` | **el piso razonable** | 5 raros, Nv40 ★2 |
| `comunes35` | el extremo (nadie llega así a H66) | 4 comunes, Nv35 ★2 |
| `legend80` · `top100` | muy avanzadas | legendarios Nv80 ★4 · divinos/heroicos Nv100 ★6 |

### 6.2 Metas

Las mismas bandas que la Parte II usó para su historia (`docs/part-ii/27` §Balance de jefes), medidas **sobre la tripulación esperada** (`h65`) y con un **piso** para `raros40`:

| Tipo | `h65` (esperada) | `raros40` (piso) | Turnos en `h65` | Casco perdido en `h65` |
|---|---|---|---|---|
| Normal | 80–100 % (las de aprender pueden quedar en 100 %) | ≥ 60 % | 4–8 | 10–35 % |
| Élite | 65–85 % | ≥ 40 % | 7–10 | 30–50 % |
| Jefe | 55–75 % | ≥ 30 % | 8–12 | 40–60 % |

**Por qué el casco perdido importa:** es lo que el jugador **siente**. Ganar perdiendo 8 % (hoy) no se siente como pelea.

### 6.3 Lo que se midió (hoy y con propuestas)

Formato de cada celda: **victoria · turnos · casco perdido**. 24–32 batallas por celda (error de ±8–10 puntos en las celdas intermedias). B-6…B-9 son las propuestas de §3.1 instaladas en memoria.

**A · Hoy, con el Bastión** (datos actuales de `regiones.json`):

| Tripulación | B-1 | B-3 | B-5 élite | B-8 (borrador) | B-9 jefe (borrador) |
|---|---|---|---|---|---|
| `h65` | 100 · 2 · −0 | 100 · 3 · −3 | 100 · 6 · −8 | 100 · 5 · −8 | 100 · 6 · −13 |
| `top100` | 100 · 2 | 100 · 4 | 100 · 8 | 100 · 5 | 100 · 8 |
| `medio40` | 100 · 2 | 100 · 4 | 100 · 5 | 100 · 5 | 100 · 6 |
| `raros40` | 100 · 4 | 100 · 6 | 100 · 10 | 56 · 12 | 91 · 8 |
| `comunes35` | 100 · 4 | 94 · 7 | 94 · 14 | 62 · 7 | 53 · 11 |

**B · Qué palanca mueve qué** (B-5 élite; `h65` / `raros40`):

| Variante | `h65` | `raros40` | Lectura |
|---|---|---|---|
| Hoy | 100 % | 100 % | — |
| Casco ×1.6 y `powerMul` +0.15 | 100 % | 94 % | El casco solo alarga |
| Rivales legendarios («paridad») | 97 % | 78 % | Pega más a los débiles |
| Espejo k=1 (su ataque sube con la calidad de tu tripulación) | 97 % | 100 % | Solo, no alcanza |
| Un gato de Sonido en su plantel | 100 % | 62 % | El control castiga al débil |
| Poder ×2.2 / ×2.6 (sin banda) | 97 / 84 % | 66 / 59 % | El abanico se abre: el fuerte casi no lo siente |
| **Espejo + Poder ×2.0** | **78 %** | **66 %** | Cierra el abanico |
| Paridad + Sonido + Poder ×1.5 | 75 % | 59 % | También sirve, pero cambia el plantel de cada etapa |

**C · El barco decide más que la tripulación** (B-5 / B-9; `h65` · `raros40`):

| Barco | Hoy | Propuesta (Poder ×1.6 + espejo) |
|---|---|---|
| Bastión (7 gatos) | 100 / 100 · 100 / 88 | 96 / 79 · 67 / 71 |
| Bajel (6) | 96 / 88 · 54 / 42 | 62 / 46 · 38 / 25 |
| Merodeador (5) | 96 / 75 · 17 / 8 | 33 / 29 · 25 / 12 |
| Gorrión (4) | **0 / 0 · 0 / 0** | 0 / 0 · 0 / 0 |

- **El piso fijo de 3 000 amuralla al Gorrión**: con él, su cociente de Poder es 0.38–0.5 (`gaterasBattles.ts:24`). Pero quitar el piso **no** alcanza (B-5 sigue en 0 %): el barco enemigo no se achica con el tuyo y las botellas no saben del tamaño del barco (los cataclismos de la Parte I sí: `cataclysm.ts › cataSize`, `CATA_FREE_CELLS = 95`).
- **Hacer trampa con el Bastión** (un solo gato para bajar el Poder enemigo): hoy el piso lo impide (`solo1`: 94–100 %, igual que una tripulación completa). Sin piso también se gana todo. Por eso el piso pasa a ser **la flota potencial** (`03-plan` §2.1), no un número fijo.
- **Factor por clase de barco** (`CARTA_SHIP_WEIGHT`, solo en la Carta; medido con espejo y sin banda en B-5):

| Barco | Poder ×0.6 | ×0.9 | ×1.2 | Factor propuesto (equivale al Bastión a ×2.0: 78 % / 66 %) |
|---|---|---|---|---|
| Bajel | 100 / 100 | 100 / 96 | 92 / 75 | **0.6** |
| Merodeador | 100 / 100 | 100 / 92 | 83 / 29 | **0.5** |
| Gorrión | 92 / 100 | 25 / 58 | 0 / 42 | **0.35** |

(B-5, `h65` / `raros40`, sin piso. El factor se recalibra cuando entre el piso por flota potencial.)

**D · La propuesta, con el Bastión** (todo con perillas que ya existen, salvo el espejo; B-5 y B-9 con cataclismo se midieron sin piso, el resto con el piso actual, que al Bastión no lo toca):

| Etapa | Receta | `h65` | `top100` | `medio40` | `raros40` | `comunes35` |
|---|---|---|---|---|---|---|
| B-1…B-4 (aprender) | `powerMul` ×1.55 + espejo | 97–100 · 3–7 t · −0–17 % | 100 | 97–100 | 97–100 | 94–100 |
| B-5 élite | ×1.6 + banda `jefe` + espejo + **poder de la caja** (cataclismo «LA BORRACHA», luna, cada 3 turnos, potencia 0.6, con sello) | **79 · 10 t · −33 %** | 79 | 88 | 58 | 21 |
| B-6, B-7 | ×1.55 + espejo | 100 · 5–7 t | 100 | 100 | 88–100 | 97–100 |
| B-8 (plantel corregido: 1 de Sonido) | ×1.55 + espejo | 97 · 8 t · −16 % | — | 100 | 69 | — |
| B-9 jefe | ×1.6 + banda `jefe` + espejo (las botellas ya son su poder; **sin** cataclismo extra) | **78 · 8 t · −26 %** | 66 | 69 | 62 | 28 |
| B-9 con cataclismo extra | (para comparar) | 46 | 50 | 58 | 29 | 21 |

**Valores propuestos** (para `gaterasBattles.ts` y `regiones.json`):

| Banda | Poder enemigo | Además |
|---|---|---|
| `p3n` (normal) | `powerMul` de la etapa (0.85–1.05) × **1.55** | espejo k=1 (tope ×2.2) |
| `p3e` (élite) | `powerMul` (1.15) × **1.6** × banda `jefe` (×1.1, +2 niveles, ★) | espejo + poder de la caja (cataclismo de la dimensión, 0.6) |
| `p3j` (jefe) | `powerMul` (1.2) × **1.6** × banda `jefe` | espejo; su poder propio (botellas, fases) en vez del cataclismo |
| piso | 0.8 × Poder de tu barco con sus mejores gatos (flota potencial) | reemplaza al 3 000 fijo |
| barco | × `CARTA_SHIP_WEIGHT` de la tabla de arriba | la estimación sugiere tu mejor barco («Con el Bastión: 82 %») |

**El espejo** es la única perilla nueva (`buildSiege`): el ataque del plantel enemigo × (calidad media de tu tripulación / la suya)^k, su vida × la raíz, con tope ×2.2; calidad = daño base del disparo de cada especie. Se lee como regla de mundo: **«la caja te mide»**. La Parte II no la usa, así que no cambia nada fuera de la Carta.

**Lo que esta propuesta no arregla:** las etapas normales siguen fáciles para una tripulación fuerte (100 %, 2–7 turnos). Está bien para B-1…B-4 (aprender), pero desde la segunda mitad de cada ruta la etapa normal debe traer **su prueba** (un gato de control anunciado en la película, §6.4).

### 6.4 Regla de plantel por tipo de etapa (la palanca más fuerte)

Los gatos de **control** de la Parte II deciden más que cualquier número: **Sonido** aturde a cada gato cuya cabina cruza la onda (`multiverso.ts:14-15`); **Tiempo** hace perder turnos y repara; **Sombra** apuñala ignorando escudos; **Vacío** borra celdas que ya no se curan. Por eso:

| Tipo de etapa | Gatos de control en el plantel enemigo | Rareza del plantel |
|---|---|---|
| Normal (primera mitad de la ruta) | 0, salvo la etapa que **enseña** ese control (B-4 «Karaoke»: hasta 2 de Sonido, sin otra regla encima) | comunes y raros |
| Normal (segunda mitad) | 1 (la «prueba» de la etapa, anunciada en la película) | raros y épicos |
| Élite | 1 | épicos + el capitán |
| Jefe | 1–2, **nunca** 2 de Sonido | épicos y legendarios; míticos para los Titiriteros |

**Prueba automática propuesta** (`03-plan` §2.7): recorrer `regiones.json` y fallar si una etapa normal de la primera mitad trae un gato de control sin estar marcada `teaches`, si una etapa con donas o botellas trae 2+ de Sonido o si cualquier etapa trae 3+ de Sonido.

### 6.5 Por dimensión

La dificultad sube por dimensión **en el multiplicador de la banda**, no en el casco (el casco solo alarga, §6.3 B):

| Dimensión | Normal | Élite | Jefe |
|---|---|---|---|
| Borracha (aprender) | banda `p3n` | `p3e` | `p3j` |
| Superhéroes, Anime | ×1.05 sobre la Borracha | ×1.05 | ×1.05 |
| Libros, POP | ×1.10 | ×1.10 | ×1.10 |
| Final (H93) | — | — | banda `final` de la Parte II |

Los valores de `p3n`, `p3e` y `p3j` están en §6.3.

---

## 7. La rareza MULTIDIMENSIONAL: implementación

### 7.1 Datos

| Pieza | Dónde | Valor |
|---|---|---|
| Rareza | `RarityId` + `'multidimensional'` (`state/econ.ts:7`), **opción B** de `investigacion/sistemas.md` §3.6 (decisión del dueño: rareza propia) | — |
| Tablas | `balance.json › rarities` (8 tablas) | poder base **6.9**, oro base **2.4**, comida ×2.2, orbes por duplicado 80, orbes por ★ 45, gemas al descubrir 3 (`06` §1.3; se recalibran con la prueba de §7.3) |
| Orden | `rarities.order` sigue siendo el **orden de poder** (queda entre legendario y mítico); la interfaz usa un orden de **categoría** aparte, con MULTIDIMENSIONAL **al final** del filtro | Evita que `tiersAmong` la ponga primera o última por accidente |
| Gato | `CatDef` + `origin: DimId`, `originRule: OriginRuleId`, `cross: { element }` | Prefijo de id `x_` (libre) |
| Datos de especies | `data/gateras/especies.json`, fusionado con `mergeContent` | Igual que la Parte II |
| Bandera | `P3_MULTIDIM` (apagada en producción hasta el OK del dueño) | Con la bandera apagada, las especies `x_` no se fusionan |

### 7.2 Poder: cambia reglas, no números

Cada Multidimensional trae tres cosas (`06` §1.4):

1. **Regla de origen**: mientras está vivo en tu tripulación, mete una regla de su caja en la batalla.
2. **Cruce**: los gatos de la casa de un elemento ganan +10 % de daño. **Se aplica al armar el spec** (`dmgMul`), sin código de simulación.
3. **Ventaja de casa**: en su dimensión de origen su regla dura toda la batalla; fuera, se apaga 1 turno de cada 4.

**Cómo viaja a la batalla (determinista):** `buildSiege` lee la tripulación y escribe `StageRules.origin = [{ rule, side: 0, uid, home }]`. La simulación y la estimación reciben el mismo dato. Cada regla es un módulo puro en `battle/origin/<regla>.ts` con estado en `WeakMap` (patrón de `mareo.ts`).

**Reglas iniciales** (las 6 que `06` §1.5 pide probar): Noche (Murciégato), Telaraña (Gato Araña), Invulnerable al primer golpe (Supermichi), Transformación (Super Siamés), Hechizo escrito (Harry Gatter), Flow (Gato Malo). Elegidas porque reusan perillas: oscuridad (la del Final), pozo de gravedad, una burbuja, la regla Poder, `fases` y viento.

### 7.3 ¿Uno por tripulación? Plan de prueba

La propuesta de `06` §1.5 es buena, **pero su plan de prueba no alcanza**:

1. **Techo:** hoy la Borracha se gana 100 %. Medir si una pareja de reglas «sube la victoria» sobre 100 % es imposible. **Primero hay que armar una etapa sonda calibrada** a ~55 % para `h65` (y ~40 % para `raros40`), con la política de §6.
2. **Ruido:** con 16 semillas el error de una celda es ±12 puntos, igual al umbral. Para detectar 12 puntos con confianza hacen falta **128 semillas por celda** y **semillas emparejadas** (las mismas en todas las condiciones, que reduce la varianza de la resta).

**Plan corregido:**

| Paso | Cómo | Umbral |
|---|---|---|
| 0. Sonda | 3 etapas sonda (normal, élite, jefe) de la Borracha calibradas con §6.3 | `h65` 50–60 %, `raros40` 35–45 % |
| 1. Una regla | Cada una de las 6 reglas sola × 3 tripulaciones × 128 semillas emparejadas | Ninguna regla sola sube más de **+15 puntos** (si no, la regla está pasada de fuerte y se ajusta antes de probar parejas) |
| 2. Parejas | Las 15 parejas × 3 tripulaciones × 128 semillas | Si alguna pareja sube **más de 12 puntos sobre la mejor de sus dos reglas sola**, hay que limitar |
| 3. Legibilidad | Captura sin cabeza de cada pareja + revisión del dueño | Si la guía de trayectoria no se lee a 1080p, hay que limitar |
| 4. Estimación | La estimación con dos reglas = la batalla (prueba de paridad llamada por llamada, como `mareo.test.ts`) | Determinista |

**Costo:** (1 + 6 + 15) × 3 × 128 ≈ 8 500 batallas ≈ 10–15 min en 10 procesos (medido: 0.1–1 s por batalla según su largo).

**Si hay que limitar** (decisión ya propuesta en `06`): **«una sola regla activa»**. Llevas los Multidimensionales que quieras; solo **el protagonista** (estrella en «Elegir tripulación») activa su regla; los demás pelean con sus números y su Cruce. Guardado: `G.s.ship.star?: Record<shipId, uid>` (campo opcional nuevo).

**Dónde se valida:** `setCrew`/`autoCrew` (`ship.ts:35-45`) y el panel `CrewSelect.ts`; `buildSiege` solo lee la regla del protagonista. Una partida vieja sin estrella: el primer Multidimensional de la lista es el protagonista (nunca resta).

### 7.4 Cómo se consiguen

Como en §4: el primero de cada uno, por historia o rescate; orbes por su actividad y por repetir en su caja; nunca Portal, Casino ni Resonancia (excluirlos en `resonance.ts:51`, `casino.ts:834`, `gacha.ts`).

---

## 8. Dónde entran las películas

| Momento | Tipo de película | Duración | ¿Obligatoria? | Gancho |
|---|---|---|---|---|
| Al aparecer una misión principal | **Tarjeta de capítulo** (título con el estilo de la caja + los 4 campos de la tarjeta) | 6–10 s | Sí, se adelanta con un toque | `P3_ON_NEW` (`ui/story/gaterasScript.ts:53`), reemplaza la tarjeta estática |
| ZARPAR en una batalla **de historia** (élite, jefe y las que pide una misión) | **Presentación** (§3) | 20–60 s | La 1.ª vez sí; después se salta | `startGateraBattle` (`app/cajasFlow.ts:38`) antes de `scenes.go(new BattleScene)` |
| ZARPAR en una etapa normal | **Tarjeta animada** generada de los datos (rival, regla, botín, estimación) | 6–8 s | Se salta siempre | El mismo gancho |
| Cambio de fase del jefe | **Película de canción** (si le toca) | completa o fragmento | La 1.ª vez no se salta | `fases.endsBattle` + `registerFaseInterlude` (como la Parte II) |
| Al ganar una etapa marcada | Escena corta | 10–30 s | Sí | `P3_WHEN` (`gaterasScript.ts:79`) |
| Ajustes → **Volver a ver** | Todas las vistas | — | — | `panels/Replays.ts`, `cine/replay.ts` |

**Reglas del gancho:**

1. **La película es la pantalla de carga.** Mientras corre se arma el `BattleSpec` y la estimación termina sus simulaciones. Al terminar, la película muestra la estimación y el botón ZARPAR: el jugador nunca espera dos veces.
2. **Saltar** cuenta como visto: después de la 1.ª vez aparece SALTAR (la película de canción, no; `14` §2).
3. **Reintento:** la tarjeta de regla de 3 s, sin película.
4. **Datos, no código:** cada etapa dice su película en `regiones.json` (`film: 'fb_p3d_borracha_5'`). Sin `film`, la tarjeta animada genérica. Ver `03-plan` §2.3.
5. **Vistas:** `ext.gateras.seen` ya existe («escenas y notas ya mostradas»). Las películas usan la clave `film:<id>`. Volver a ver las lista desde ahí (o desde el registro que defina CINE en `cine-v2/02-api.md`).
6. **Accesibilidad:** «Reducir movimiento» y «Reducir destellos» siempre; subtítulos sobre zonas calmadas (`14` §2).

---

## 9. Lo que el loop no hace

- No hay tareas diarias, temporizadores para jugar ni energía.
- No hay nada pagado.
- Ninguna misión pide repetir una etapa.
- El oro no es un muro: la historia y las huellas son el candado.
- Perder no te quita nada guardado.
