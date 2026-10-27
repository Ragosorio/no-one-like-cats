# Luzterna: todo lo que hace en el juego (y Canelo, para escribirlo fiel)

**Para qué sirve.** En la Parte III Luzterna muere en la batalla final. Ya es un fantasma, así que esta sería su segunda muerte. Este inventario dice **dónde podría aparecer viva por accidente** después de esa batalla y qué piezas del juego dependen de ella.

Lo armé con grep y el grafo de código el 2026-10-13. Las rutas cuelgan de `game/src/` salvo que diga otra cosa. **[C]** marca lo verificado en el código.

**Niveles de riesgo (si ella ya murió):**
- **ALTO:** sale sola, en una interfaz que el jugador ve siempre o en un disparador que puede ocurrir en cualquier momento.
- **MEDIO:** sale en algo que se puede repetir o que una partida vieja todavía no activó.
- **BAJO:** solo se ve como recuerdo («Volver a ver», créditos) o ya no puede ocurrir después de la Parte II.

---

## 0. Lo esencial en 5 puntos

1. **`tip()` habla como Luzterna por defecto.** Toda burbuja de esquina sin hablante explícito sale con su cara y su nombre (`ui/dialog.ts:493`). **[C]**
2. **Cada misión muestra su `line` firmada «— Luzterna»:** en el panel MISIONES, en el aviso NUEVA MISIÓN y en el panel de misión cumplida. Son 127 misiones de la Parte I y 35 de la Parte II. **[C]**
3. **El faro de la isla es su casa.** Al tocarlo sale una de las 5 frases de `FARO_LUZTERNA`, y la linterna sigue encendida. **[C]**
4. **NOVEDADES exige una línea suya en cada versión:** el campo `luzterna: string` es obligatorio (`data/updates.ts:16–17`). **[C]**
5. **No existe ningún estado «Luzterna está viva o muerta».** La Parte III tendrá que crearlo (por ejemplo un flag nuevo) y hacer que cada superficie de la tabla §2 lo consulte.

---

## 1. Cuánto habla (aproximado, contando líneas con hablante `LUZTERNA`)

| Fuente | Parte I | Parte II |
|---|---|---|
| Beats de historia | 42 (`data/content.json › story.beats`) + 75 (`ui/story/script.ts`) + 33 (`grietasScript.ts`) + 12 (`finaleScript.ts`) | 135 (`data/rupturas/historia*.json`: 47 + 34 + 25 + 29), que son el 59 % de las 228 líneas de beats |
| Presentaciones de sistemas | 67 líneas en 30 presentaciones (`ui/story/features.ts`, helper `L()`) | 0. Ningún sistema de la Parte II tiene presentación |
| Intros sueltas | 12 del Podio (`podio/lines.ts`), 6 del casino (`panels/casino/intro.ts`), 6 del perfil (`ui/story/profile.ts`), 2 de `app/story.ts:797–798` y 1 del prólogo (`scenes/PrologueScene.ts:566`) | 3 del aviso de la carta (`app/story.ts:569–571`), 3 del reflejo (`cine/scenes/reflejo.ts:46–52`), 4 de H48 (`ui/story/rupturasScriptO2.ts:87–99`) y 3 de H64 (`ui/story/rupturasScriptO4.ts:72–76`) |
| Diálogos en las islas 3D | — | ~49: Páginas (9 + 1), Corona (8), Umbral (6), Sueños (6 + 1 en una ficha), Nácar (6), Cometa (6), Invertidas (5) y Olvidada (2) |
| Frases de misión (`line`, firmadas por ella) | 127 | 35 |
| **Total aproximado** | **≈ 256 de diálogo + 127 frases de misión** | **≈ 200 de diálogo + 35 frases de misión** |

---

## 2. Inventario de funciones

### 2a. Interfaz permanente (riesgo ALTO)

| # | Dónde | Qué hace | Cuándo se dispara | Riesgo si ya murió |
|---|---|---|---|---|
| 1 | `ui/dialog.ts:489–556` (`tip()`) | Burbuja de esquina. **Si no se le pasa hablante, usa `'LUZTERNA'`** y pone su retrato (`LuzternaPortrait(230)`) | Cada `tip()` sin hablante: el primer oro (`app/story.ts:762`), la pista del glosario (`app/story.ts:351`) y los tips de presentación (`app/story.ts:341`) | **ALTO.** Cualquier tip nuevo de la Parte III sale con su cara si nadie cambia el valor por defecto |
| 2 | `app/story.ts:452–460` | Aviso **NUEVA MISIÓN**: `personalize('LUZTERNA', m.line)` + `why`, con su retrato | Cada misión nueva que no tenga beat propio, incluidas las cadenas laterales K/C/E que siguen después del final | **ALTO** |
| 3 | `panels/Missions.ts:181` | Escribe «`line`» — Luzterna en cada tarjeta | Siempre que el panel MISIONES está abierto | **ALTO.** Las misiones de la Parte III también quedarían firmadas por ella |
| 4 | `ui/story/rewards.ts:179–188` + `ui/story/text.ts:225` (`DONE_QUIPS`) | Panel de misión cumplida con su retrato y una frase («Ni yo lo hubiera hecho mejor. Bueno, sí. Pero estoy muerta.») | Cada misión cumplida | **ALTO** |
| 5 | `ui/story/rewards.ts:366–367` (`RULE_QUIPS`) | «LUZTERNA: …» al subir de nivel de Reino | Cada subida de Reino | **ALTO** |
| 6 | `panels/kingdom/KingdomPanel.ts:77, 212` | Una cita «…» — Luzterna en el panel REINO | Al abrir REINO | **ALTO** |
| 7 | `ui/story/glossary.ts:38, 178, 212` + `data/glossary.ts:24` (campo `quip`) | Subtítulo «Lo que Luzterna te explicaría si tuviera paciencia»; las entradas bloqueadas dicen «Luzterna te lo explica»; cada `quip` se firma «— Luzterna» | Al abrir el GLOSARIO o el «?» de una misión | **ALTO** |
| 8 | `data/updates.ts:16–17` + `ui/updatesPanel.ts:69` | Cada NOVEDAD trae «LUZTERNA: …». Las partidas viejas ven todas las notas que se perdieron (`updates.ts:2`) | Una vez por versión | **ALTO** para versiones nuevas (el campo es obligatorio). **MEDIO** para las notas viejas que aparecen al volver |
| 9 | `ui/story/offline.ts:169–170` | El informe «Mientras no estabas…» trae su retrato y los botones | Al volver tras una ausencia | **ALTO** |
| 10 | `ui/story/nameCat.ts:105–201` | Al ponerle nombre a un gato sale su retrato, grande o asomándose, junto a «FOLIO 000 —vacante—» | Cada vez que se nombra un gato | **ALTO** |
| 11 | `panels/Settings.ts:242, 302, 368` | «Luzterna te dice "capi"», líneas de muestra del tono y el chiste de «Borrar TODO… Luzterna se queda (ya está muerta, no le afecta)» | Al abrir Ajustes | **MEDIO** (el último chiste se volvería cruel) |
| 12 | `ui/story/text.ts:96` + `ui/dialog.ts:397–408` | El hablante `LUZTERNA` es de tipo `luzterna`: caja amarilla y retrato fantasma grande | Cada `say()` con ese hablante | Base técnica, sin riesgo propio; hace falta para su despedida |

### 2b. El faro y la linterna

| # | Dónde | Qué hace | Cuándo se dispara | Riesgo |
|---|---|---|---|---|
| 13 | `ui/story/rupturasScript.ts:101–112` + `scenes/IslandScene.ts:115–121, 540–548` | Al tocar el faro: antes de «Fin», «El faro mira al Primer Mar…»; con H31 activa, `FARO_CALL`; después, una de las 5 frases de `FARO_LUZTERNA` («Luzterna está de guardia…», «Renta gratis. Ventaja de estar muerta.») | Cada toque del faro en la isla de casa, para siempre | **ALTO** |
| 14 | `island/buildingArt.ts:1348` (`lighthouseArt`) + el haz en `IslandScene.ts:536–539` | El faro con su lente encendida y el haz que gira | Siempre | **MEDIO.** Hay que decidir si la linterna se apaga, cambia de luz o la hereda alguien |
| 15 | `regions/reflejo.ts:76` | La luz cálida de tu faro sobre la roca, «Luzterna lives there now» | En la cine 3D del reflejo (H31 y «Volver a ver») | **BAJO** |
| 16 | `app/oleada2Flow.ts:62–127`, `state/sys/rupturasO2.ts:202–218` | Elección de H48 (`linterna:apagala` o `linterna:encendida`), su réplica y un tip `LINTERNA_LATER` | Una sola vez, durante la Oleada 2 | **BAJO**, pero es un recurso narrativo para su despedida |
| 17 | `ui/story/o4Pagina.ts` | La página en blanco descansa junto al faro (modo `rest`) | Siempre después de H65 | **BAJO.** No es ella, pero vive en su faro |

### 2c. Diálogos que se repiten en las islas 3D (se pueden visitar después del final)

| # | Dónde | Qué hace | Cuándo se dispara | Riesgo |
|---|---|---|---|---|
| 18 | `regions/invertidas.ts:321–324, 376, 648` | Comenta el puzle de los islotes («Otra vez al derecho…»), un pez y la pesca hacia arriba | Al interactuar en Islas Invertidas, cada visita | **ALTO** |
| 19 | `regions/corona.ts:297–343` | Comenta el buzón, el silencio de los gatos y el edificio que «se sabe mi agenda» | Cada visita a Corona Celeste | **ALTO** |
| 20 | `regions/cometa.ts:82–90, 343, 408` | Comenta el mirador, a Escafandra con su pecera y el pago por mirar | Cada visita a Puerto Cometa | **ALTO** |
| 21 | `regions/suenos.ts:99–110, 335` + `regions/suenos/residents.ts:81` | Dice quién sueña esta noche y comenta la ballena. La ficha de cada gato que sueña cita «Luzterna: "No lo despiertes…"» | Cada visita a Sueños | **ALTO** |
| 22 | `regions/umbral.ts:307–350` | Comenta la gata-puerta, el borde y los Disruptores | Cada visita al Umbral. **Ojo: es el escenario natural de una batalla final** | **ALTO** |
| 23 | `regions/nacar.ts:177–180, 292, 306–310` | Comenta los espejos, la puerta de luz y a Madre Nácar dormida | Cada visita a Nácar | **ALTO** |
| 24 | `regions/paginas/lore.ts:57–114` + `regions/paginas.ts:580–583` | Reacciona a cada página del Diario Perdido y a la roca de REGISTRO 000. Aviso al final: «Luzterna ya no quiere leer más» | Al pescar páginas, hasta completar el Diario | **ALTO** |
| 25 | `regions/olvidada.ts:470–474` | «En esta versión yo nunca llegué a tu faro» | En la Isla que Nadie Recuerda | **MEDIO** (puede dar un eco poético) |
| 26 | `regions/olvidada/picker.ts:62` | Mensaje de error: «(avísale a Luzterna)» | Solo si algo falla | **BAJO** |

### 2d. Historia, intros y avisos

| # | Dónde | Qué hace | Cuándo se dispara | Riesgo |
|---|---|---|---|---|
| 27 | `ui/story/features.ts` (30 presentaciones) + `app/story.ts:333–352` | Le explica cada sistema de la Parte I al jugador. En partidas viejas sale **la primera vez que se abre el panel** | En cualquier momento, si el sistema nunca se explicó (`G.s.explained`) | **ALTO.** Por ejemplo, alguien que abre el BANCO por primera vez en la Parte III |
| 28 | `ui/story/profile.ts:78–187` + `app/story.ts:506, 784, 797–798` | Pregunta nombre y género («Oye, oye… nunca te pregunté cómo te llamas») | Al cargar una partida sin `G.s.player` (partidas viejas o si se saltó la pregunta) | **MEDIO** |
| 29 | `app/story.ts:535–571` + `state/sys/rupturas.ts:189–192` | Aviso único de que las islas viven en la CARTA (flag `aviso_carta_islas`) | La primera vez que hay una isla de la Parte II en la carta sin explicar | **MEDIO.** Si la Parte III pega islas a la carta con el mismo mecanismo, este aviso es de ella |
| 30 | `podio/lines.ts:6–24` + `scenes/PodioScene.ts:758–780` | Intro del Podio y explicación del primer Heroico y del primer Divino | La primera vez que pasa cada cosa, aunque sea tarde | **MEDIO** |
| 31 | `ui/story/grietasScript.ts` (33 líneas) | Explica cada Grieta del Multiverso | Una partida vieja puede abrir una grieta tarde (al limpiar expansiones o ganar una liga del Podio) | **MEDIO** |
| 32 | `panels/casino/intro.ts:10–15` | Por qué existe el casino | La primera vez que aparece el casino (tras el Jefe 1) | **BAJO** |
| 33 | `ui/story/script.ts` (zonas, jefes) y `scenes/PrologueScene.ts:566` | Historia de la Parte I | Durante la Parte I o en una partida nueva | **BAJO** (una partida nueva siempre empieza con ella viva, y eso es correcto) |
| 34 | `state/sys/rupturas.ts:417` | Aviso de reinicio: «De noche, Luzterna te espera en el faro» | Solo en el reinicio narrativo de la Parte II | **BAJO** |
| 35 | `app/story.ts:378–388` (`personalize`) | Cambia «grumete» por «Capi» **solo si habla LUZTERNA** | En cada línea | Si otra voz hereda el papel de guía, esta regla no la cubre |

### 2e. Arte, retratos, cines y Momentos (como actriz)

| # | Dónde | Qué hace | Cuándo | Riesgo |
|---|---|---|---|---|
| 36 | `public/story/lite/luzterna.svg` + `ui/story/portrait.ts:17–118` | Su retrato vectorial MAI: un fantasma translúcido que flota «on twos» y cuya linterna late. Es un `CatPuppet` con rig `luzterna` (`data/catRigs.json`). Si falla, usa el arte de la especie `lantern_spirit_cat` (Linterna Espíritu, `c_linterna`, `content.json:2434`) | En cada diálogo o panel donde sale ella | Hace falta para su escena de muerte. **Ojo con la especie `c_linterna`:** se parece a ella y es un gato coleccionable |
| 37 | `momentos/anime/actor.ts:15–28` | Carga su retrato como actriz de los Momentos | En los Momentos | — |
| 38 | Los 6 Momentos | Actúa en todos: **LIKY FIGHT** (cut-ins y viñetas, `likyFight/score.ts:86–360`), **WHEN I LOSE** (en cubierta, sube la linterna: `whenILose/stage.ts:175, 272, 878`), **te ODIO** (la ronda HOLD «¡ESCUDO!» está anclada a ella, `teOdio/score.ts:123`, más los carteles «SE DERRAMA» y «MIS GATOS»), **HEMKADE** (tripulación en el barco 3D, `hemkade/ship.ts:195`), **CIRCUS MALUS** (farol de papel de los años 30, «la única luz de color verdadero», `circusMalus/stage.ts:518, 799`) y **YONOSE** (linterna, toques a Canelo y la réplica de H64, `yonoseTodo/stage.ts:162, 397, 617–623`) | En H35, H44, H55, H57, H62 y H64, y al repetirlos con «Volver a ver» o desde la Fonoteca | **MEDIO** al repetirlos (se leen como recuerdo). **Riesgo técnico:** un Momento nuevo no debe depender de su ancla |
| 39 | Cines de la Parte II con «Volver a ver» (`cine/replay.ts`; textos en `historia*.json` y `cine/scenes/reflejo.ts`) | Sus líneas en las 49 escenas | Al repetirlas | **BAJO** (son recuerdos) |
| 40 | `ui/story/creditsParteII.ts:100` | «Luzterna, desde el faro» en los créditos | En los créditos de la Parte II | **BAJO** |
| 41 | `rupturas/cast.ts:36–40` + `rupturas/main.ts:538–1033` | En el slice `rupturas.html`: un `PaperCat` en la galería del faro de noche y avisos con su voz | Solo en el slice, fuera del juego | **BAJO** |

### 2f. Pistas en la carta o el mapa

- La presentación `mapa` (`ui/story/features.ts:91`, `scene: 'map'`) es suya: explica zonas, élite, jefe y la ESTIMACIÓN la primera vez que se abre el mapa. **ALTO** para una partida que nunca abrió el mapa (raro).
- El aviso de las islas en la CARTA es suyo (fila 29).
- Las notas al margen de la carta de noche («¿y esta isla?», «(ver folio 000)», «—N.»; `island/night/mapNight.ts:27–29`) **no** son suyas.

### 2g. Saludos y comentarios del ambiente

- **El chatter de los gatos no la menciona nunca** (`data/chatter.ts` e `island/chatter/lines.ts`: 0 coincidencias). **[C]**
- Los tips de carga (`TIPS`) no la mencionan. **[C]**
- Sí la nombran: `FARO_LUZTERNA`, `DONE_QUIPS`, las frases de REINO y las citas del glosario (filas 4–7 y 13).

---

## 3. Campos de partida que la involucran

Ninguno guarda «Luzterna viva o muerta». Estos dependen de ella:

| Campo | Dónde | Qué guarda |
|---|---|---|
| `G.s.explained` | `state/game.ts:139–140` | Qué sistemas ya explicó «Luzterna» |
| `G.s.missions.seenLines` | `state/ext/story.ts:29–34` | Qué frases de misión ya se dijeron |
| `G.s.beatsSeen` | `state/game.ts:138` | Qué beats ya vio, incluido `glossary_hint` |
| `G.s.player` | `state/game.ts:155–156` | El nombre y el género que ella preguntó |
| Flags `linterna:apagala`, `linterna:encendida`, `o2_linterna_later` | `state/sys/rupturasO2.ts:202`; `app/oleada2Flow.ts:110–127` | La elección de H48 |
| Flag `aviso_carta_islas` | `state/sys/rupturas.ts:190` | Que ya avisó dónde están las islas |
| Flags `mentira:*` | `state/sys/rupturasO4.ts:74` | La elección de H64 (su réplica) |

---

## 4. Pruebas que dependen de `LUZTERNA`

- **`tests/artBase.test.ts:25–106`.** Exige `LUZTERNA.url === 'story/lite/luzterna.svg'` y que el SVG esté entre los archivos de arte remotos. Si alguien borra el SVG o mueve `rupturas/cast.ts`, falla.
- **Pruebas de cines** (`tests/cine.test.ts:109`, `oleada1Cine.test.ts:155`, `oleada2Cine.test.ts:81`, `oleada3Cine.test.ts:79`, `rupturasO4.test.ts:258, 328`). Usan `['LUZTERNA', '…']` como línea simulada. No fallan si ella muere.
- **`tests/rupturasStory.test.ts:159–183`, `rupturasO2.test.ts:162–182`, `rupturasO3.test.ts:189–208` y `rupturasO4.test.ts:176–205`.** Exigen que todo hablante esté registrado en `ui/story/text.ts`. Si hay un narrador nuevo, hay que registrarlo; un hablante sin registrar sale **con la cara de Canelo** (`text.ts:147`).
- **`tests/hotfixVivo.test.ts:9, 224, 247`.** Comprueba que el aviso de la carta salga una sola vez.

---

## 5. Lo mínimo que la Parte III tiene que decidir

1. **Quién narra después de su muerte:** a quién pasa el valor por defecto de `tip()`, la firma de las misiones, los paneles de misión cumplida y de Reino, el glosario y NOVEDADES.
2. **Qué pasa con el faro:** qué dice al tocarlo y si la linterna se apaga, cambia o la hereda alguien.
3. **Qué dicen las islas 3D (§2c):** se silencian, cambian de voz o se reescriben como recuerdos.
4. **Qué hacen las partidas viejas que todavía tienen presentaciones o intros pendientes (§2d):** decidir si ella sigue presentando la Parte I «en flashback» o si esas presentaciones pasan a otra voz.

---

## 6. Canelo: ficha para escribirlo fiel

**Datos** **[C]**

- **Especie:** `c_canelo`, «Canelo, el Impaciente». Común, Fuego, artillero, rasgo `impaciente` (+10 % de daño en su primer disparo). Pintura `canelo_cozy_cat` (`content.json:1664–1738`).
- **Se puede renombrar** (H02). `personalize()` cambia «Canelo» por el nombre del jugador en todo diálogo; la excepción es «CANELO ALMIRANTE» en mayúsculas (`app/story.ts:381–386`). **Escribe siempre «Canelo», nunca su nombre ya resuelto.**
- **Grito y ataques:**
  - Battle Form: «CANELO — INFERNAL FORM», grita «HAIRBALL IGNITION!!»;
  - ulti: «HAIRBALL BARRAGE! (毛玉乱射)»;
  - pasiva: «Calorcito».
- **Formas** (`data/rupturas/formas.ts`). En las dos «sigue siendo Canelo».

  | Forma | Pintura | Suma | Ulti | Battle Form y grito | Tagline |
  |---|---|---|---|---|---|
  | `canelo_almirante` | `canelo_admiral_cat` | Agua | ¡A BABOR! (取舵いっぱい) | «CANELO — ALMIRANTE DE LA BAÑERA» / «¡A BABOR, BOLA DE INÚTILES!» | «Ahora con gorro y ganas de mandar» |
  | `canelo_astral` | `canelo_astral_cat` | Cósmico | BOLA DE PELO DE HORIZONTE (地平線) | «CANELO — LA ANOMALÍA» / «¿QUIÉN ESTÁ EN LAS ROCAS?» | «Mira algo que tú no ves. Y no parpadea» |

- **Ojo:** `e_infernal` («Canelo Infernal, el Pirómano»; Épico, Fuego y Tierra; grita «HELLBALL!!!») es **otra especie**, no una forma. Su lore dice «el mismo gato que dormía en una caja».
- **Eco:** `CANELO_ECO`, «Almirante de una flota de papel»; cuenta como despierto en cuanto tiene la forma Almirante (`state/sys/ecos.ts:85–92`).
- **Temperamento en la isla:** `CANELO` (`art/temperament.ts:235–245`). Es impaciente: salta primero, da doble saltito, manotea estrellas que no están y **nunca admite que falló**. Es igual en todas sus formas.
- **Su palmera:** en las islas 3D duerme bajo SU palmera, y más si llueve (`regions/life.ts:84–91`).

**Reglas de voz**

1. **Canelo no habla.** No tiene hablante registrado: su cara solo se usa para «TUS GATOS» y para los hablantes desconocidos (`ui/story/text.ts:119, 147`). Se expresa con actos: se sube, da vueltas, se duerme encima, come, gruñe y se queda mirando.
2. **No es un dios secreto.** Su importancia es que sigue siendo Canelo (`05-biblia:252`).
3. **Sus rasgos fijos:** impaciente, glotón, dormilón, dueño de la palmera y de la caja, con bufanda y panza. Le tiene miedo a la Singularidad, ve a REGISTRO 000 y no dice nada.

**Frases típicas sobre él** (las dicen otros, sobre todo Luzterna)

- «Ese que ronca en la caja se llama Canelo.» (b01)
- «Dile a Canelo que su bufanda siempre me pareció horrible. Con cariño.» (`ui/story/script.ts:112`)
- «Canelo no va a decir nada. Canelo le tiene miedo.» (`script.ts:311`)
- «Lo dijo con la boca llena, pero lo dijo.» y «Ni para comer: come AHÍ. Hay migajas en la brújula.» (b37)
- «Sigue siendo el mismo gato impaciente. Ahora con sombrero.» (b38)
- «Canelo no está descompuesto. Canelo ES así. Eso es lo que lo hace Canelo.» (b46)
- «Misma bufanda. Misma panza. Ahora brilla. Ay, no: también es más impaciente.» y «¿Qué ves, gordo? …No me contesta.» (b53)
- «Da tres vueltas. Se acuesta encima.» y «Es la primera vez que decide algo él solito.» (b64)
- «FOTO: el sospechoso, minutos después del incidente del vaso.» (`ui/story/offline.ts:111`)
