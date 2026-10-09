# 03 · La historia que ya está en el juego (y en qué se parece a la sinopsis)

Reconstrucción de la historia **tal como corre hoy en el código**, no como la cuenta el GDD. Fuentes revisadas:
`game/src/data/content.json` (`missions[]`, `story.beats`, `story.characters`, `cats[]`, `bosses[]`, `expansions[]`,
`events`), `game/src/app/story.ts` (los ganchos que de verdad disparan cada escena), `game/src/ui/story/*`
(`script.ts`, `grietasScript.ts`, `finaleScript.ts`, `credits.ts`, `offline.ts`, `text.ts`, `profile.ts`),
`game/src/state/sys/{finale,grietas,storyBattles,secrets,micro}.ts`, `game/src/scenes/{Prologue,Title,Results,Island}Scene.ts`,
`game/src/panels/{Catdex,Sanctuary}.ts`, `game/src/panels/casino/*`, `game/src/podio/*`, `game/src/data/{chatter,updates,glossary}.ts`,
`game/src/island/chatter/lines.ts`, `docs/CONTEXTO-NARRATIVO.md`, `docs/guias/agregar-historia.md`,
`research/04-gdd-no-one-like-cats.md` §5 y `CHARLA.txt`.

> **Ojo con el nombre "Parte 2".** En el código y en los docs, "Parte 2" **ya significa las Grietas del Multiverso**
> (H23–H28): lo dicen los encabezados de `state/sys/grietas.ts`, `ui/story/grietasScript.ts`, `ui/story/text.ts` y
> `docs/arte/DIRECCION-ARTE-PARTE-2.md`. La "Parte II" nueva necesita un nombre y un prefijo propios para que nadie
> confunda una con otra.

> `CHARLA.txt` (la charla de diseño original) **no trae historia**: es diseño de mecánicas (Dragon City + Castle
> Busters, Resonancia, relojes, barcos), el título y el lema "Cute cats. Terrible consequences.". El lore del Archivo
> aparece por primera vez en el GDD (`research/04-gdd-no-one-like-cats.md` §5.1).

---

## 1. Línea de tiempo (lo que de verdad se dispara)

En ejecución, de cada beat solo cuentan `id` y `lines`. Lo que lo dispara es el gancho `ON_NEW` / `ON_DONE` / `WHEN`
de `app/story.ts` (los campos `trigger` y `time` del JSON son notas de diseño). Abreviaturas: **CJ** =
`game/src/data/content.json`, **SC** = `game/src/ui/story/script.ts`, **GS** = `grietasScript.ts`, **FS** = `finaleScript.ts`.

### Prólogo y Acto I: la balsa (Zona 1, Bahía Sardina)

| ID | Título | Disparo real | Qué pasa | Referencia |
|---|---|---|---|---|
| b00 | En algún momento del futuro… | Partida nueva | Salto al futuro: Astra Prima ★6 parte en tres al Leviatán ("mantén… y suelta"). Portada del Diario: ¡EXTRA! UN GATO PARTE UN BARCO EN TRES. Tarjeta "CAPÍTULO ∞". Corte a "MUCHO ANTES…": una balsa con una palmera y una caja donde duerme Canelo. | `scenes/PrologueScene.ts` (l. 1192: balsa + palmera + caja); CJ `b00_prologo` |
| H01 | ¡Despierta, Canelo! | `start` | b01: aparece Luzterna (capitana fantasma, ex-farera del Archivo) y te pide tocar a Canelo. Ficha del jugador: "REGISTRO DE TRIPULACIÓN · FOLIO 001". | CJ l.14671; `ui/story/profile.ts` |
| H02 | ¿Cómo se llama? | `mission:H01` | Le pones nombre a Canelo. | CJ `b02_nombre` |
| H03–H04 | Algo huele a pescado / Ese gato tiene hambre | cadena | Muelle, Pescaditos, ¡ÑAM! (b04, b05). | CJ |
| H05 | Ahora haz que valga la pena | `mission:H04` | b06: el Patito Pirata. Los gatos se transforman en batalla "por cosas del Archivo". | CJ l.14757 |
| H06 | Tus gatos se fueron a invocar otro | `mission:C01` | b07: la Resonancia, "sagrada y privada". | CJ |
| H07 | Eso no era una nube | `mission:H05` (meta Reino 3) | b09 al completarse: el cielo se oscurece y Luzterna nombra a **Distraxia, la Niebla del Olvido** ("te lo cuento cuando tengas un barco de verdad"). | CJ l.14803 |
| K07 (lateral) | ¡Mira lo que salió! | ON_DONE K07 | b08: el primer Raro (Pimentón). | CJ `b08_pimenton` |
| H08 | El Capitán Bigotes Rotos | `stage_cleared:1-8` | b10: Jefe 1. "¿Una balsa con TRES gatos?" Suelta el fósil, llega **Tierra** y Gea. | CJ l.14827 |

### Acto II: Noctis, la Gárgola y el Kraken (Zonas 2–3)

| ID | Título | Disparo | Qué pasa | Referencia |
|---|---|---|---|---|
| H09 | Una máscara en el horizonte | `boss:1` | b11: **Velo Noctis** te presume desde su barco: se burla de tu balsa. | CJ l.14851 |
| casino_intro | (beat de sistema) | `WHEN` jefes ≥ 1 | Luzterna: la caída de la Gárgola abrió una grieta en el muelle y detrás está **El Gato Negro**, el casino de **Madame Noir**, adonde cae lo que Distraxia borra, gatos perdidos incluidos. | `panels/casino/intro.ts` |
| z2_intro | Acantilados de Piedra | `WHEN` | Carta de zona + intro. | SC `ZONE_INTRO[2]` |
| H10 | Tormenta permanente | `stage_cleared:2-8` | La Gárgola Ronroneante (300 años dormida). Llega **Tormenta** y Tronador. | CJ l.14871; SC `BOSS_INTRO/OUTRO[2]` |
| H11 | El Heredero del Trueno | `boss:2` | Batalla de historia: Raijin (Mítico) se une. | `state/sys/storyBattles.ts` |
| H12 | Bandera Negra | `boss:2` | Se cumple comprando el Merodeador. **El evento de Noctis no existe**: el beat b14 nunca se reproduce. | CJ l.14912 |
| H13 | El primer escudo | `stage_cleared:3-8` | Kraken Voltaico: aparecen los ESCUDOS y el Bastión. Noctis te avisa de "una biblioteca hundida y alguien que arranca páginas". | SC `BOSS_OUTRO[3]` |

### Acto III: Magia, el Archivo y la estrella (Zonas 4–5)

| ID | Título | Disparo | Qué pasa | Referencia |
|---|---|---|---|---|
| H14 | Algo viene | `boss:3` | El **Heraldo del Arcanista** llega en un barco que brilla. Llega **Magia**, "un elemento que no debería existir en este mundo". Te acusa de andar "despertando primordiales". | SC `HERALDO_*` |
| H15 | El Ladrón de Páginas | `stage_cleared:4-8` | El Arcanista. Merlina se une. Primer **Fragmento del Vacío**, "frío y vacío" (1/10). | CJ `b17_arcanista`; SC `BOSS_OUTRO[4]` |
| H16 | Lo que guardan las ruinas | `expansion:6` | La Orquesta Muda (secreto 6): Sonata Prima + fragmento. **b18_archivo, el gran beat de lore**: el Archivo es una pila infinita de cajas, cada caja es un mundo con su propio trazo, los gatos son líquidos y pasan de caja en caja por las gateras, cada ataque "reimprime" el mundo ("no es un bug: es memoria"), Distraxia rasgó el Archivo y las páginas cayeron al mar, y Luzterna era la farera ("mi trabajo era que nadie se perdiera"). | CJ l.19321 |
| H17 | Cae una estrella | `stage_cleared:5-8` | Estrella Errante: "algo me empujó del cielo y viene por ti". Luzterna oye estática. Llega **Cósmico** y Astra Prima. | SC `BOSS_OUTRO[5]` |
| H18 | La Grieta | `boss:5` | La Singularidad (Mítico). Duerme en el camarote de Canelo. | SC `GRIETA_*` |
| H19 | Un barco que no debería existir | `mission:H18` | "A VOID SHIP HAS ENTERED YOUR WORLD". No se puede hundir: hasta 3 fragmentos según el daño. Al irse, la estática forma una palabra que nadie alcanza a leer. | SC `VACIO_*` |
| H20 | Hace mucho tiempo, en una balsa… | `boss:5` | La revancha del Patito (+1 fragmento). | SC `PATITO_*` |

### Acto IV: el Primer Mar y "Continuará" (Zona 6)

| ID | Título | Disparo | Qué pasa | Referencia |
|---|---|---|---|---|
| z6_intro | La Marea Sin Nombre | `WHEN` | "Aquí se olvida todo". Luzterna, medio en broma, deja un recado para Canelo por si le pasa algo. | SC `ZONE_INTRO[6]` |
| H21 | El Primer Mar | `stage_cleared:6-8` | Leviatán Almirante, manejado por **Distraxia** ("yo no destruyo: borro"). Noctis llega a ayudar con sus MIL ROSTROS y todas las ultimates quedan listas: es el plano del prólogo. **Ojo**: la intro que de verdad suena (`BOSS_INTRO[6]`) **no incluye "Él me lo pidió"**; esa línea solo vive en el JSON de referencia `b22_final`. | CJ l.15102; SC |
| b23 → b24 → b25 | Marea Final → UNKNOWN ELEMENT → créditos | ON_DONE H21 | Tu isla ×1000 durante 3 min. Luego el cielo se abre como la tapa de una caja y aparece una silueta de estática que pregunta quién derrotó a su almirante. Los gatos responden "…Nadie". "Yo soy NADIE. **NO ONE LIKES CATS**" (en inglés). Se oye un vaso caer. Caption: a NADIE le falta una "S". Siguen los créditos del Diario. | SC `MAREA_FINAL`, `UNKNOWN_END`; `credits.ts` |
| H22 | Continuará | `boss:6` (meta: ver b25) | **Velo Noctis se une** ("me debes una"). | SC `NOCTIS_JOINS` |

### Acto V: las Grietas del Multiverso ("Parte 2" en el código)

Los disparadores los pone un ticker en `state/sys/grietas.ts` (bandera `grieta:<el>`). Todas menos Hielo piden H23 hecha.

| ID | Grieta / Primordial | Disparo | Detalle narrativo | Referencia |
|---|---|---|---|---|
| H23 | Boreal / Bóreas (Hielo) | `mission:H22` | GRIETAS_EXPLAIN: el Leviatán, al hundirse, rompió el fondo del Primer Mar y el cielo se agrietó. | GS |
| H24 | Escenario / Headliner (Sonido) | ganar una liga del Podio | El público gritó tan fuerte que rompió el cielo. | GS |
| H25 | Faroles / Medianoche (Sombra) | Jardín Sakura limpio (exp. 9) | Las sombras caminan solas; para Medianoche, cada farol es una puerta. | GS |
| H26 | Reloj de Arena / Cronos (Tiempo) | Oasis Dorado limpio (exp. 10) | La arena sube. Cronos "ya vio cómo termina". | GS |
| H27 | Faro / Áurea (Luz) | Reino 36 + Atolón limpio (exp. 8) | El **Faro del Primer Mar** se prende solo y apunta a una grieta. | GS |
| H28 | Abismo / **Nadie** (Vacío) | Abismo limpio (exp. 12) **o** 10 fragmentos | Nadie viene a ver "si era cierto". Al perder dice "…Era cierto. A Nadie le gustan los gatos" y **se une como Legendario jugable** (`l_nadie`). | GS; `grietas.ts` |

### Final: El Archivo Rasgado

| ID | Título | Disparo | Qué pasa | Referencia |
|---|---|---|---|---|
| H29 | Lo que el Archivo olvidó | H23–H28 completas | Las seis grietas se abren hacia arriba: detrás hay **estantes**. Distraxia: "Él me lo pidió". Nadie: "Yo no te pedí nada". Distraxia le recuerda que dijo "a nadie le gustan los gatos" mil veces, en mil cajas vacías. Nadie: era una queja, no una orden; estaba solo, ya no. Los fragmentos resultan ser **pedazos de las cajas borradas** (cada uno debilita a Distraxia un 2.5 %). Batalla `final_archivo`: galeón de niebla con ecos de Medianoche, Cronos, Bóreas y Áurea. | FS `FINAL_INTRO`; `state/sys/finale.ts` |
| H29 (ON_DONE) | — | victoria | La niebla se deshace en hojas que vuelven a los estantes y **Distraxia queda como una página en blanco**. Luzterna cuenta por qué está muerta: se quedó arriba con la linterna para que las páginas vieran por dónde caer y "se le olvidó bajar" ("yo nunca solté"). **Cuelga la linterna en el faro de TU isla** y se queda de farera. Nadie: "A Nadie le gustan los gatos." Los gatos: "…Mentira." Nadie: "…Mentira." Portada: EL ARCHIVO REABRE SUS PUERTAS. Créditos "edición definitiva". | FS `FINAL_OUTRO`; `credits.ts` (`final`) |
| H30 | Fin | `mission:H29` | Epílogo: el Archivo tiene infinitas cajas; si alguien abre otra, Luzterna estará ahí con la linterna prendida. "FIN. (Por ahora…)" | FS `FINAL_EPILOGUE` |

**Beats laterales con lore**: P01 (Podio), `heroico_intro` y `divino_intro` (los Divinos "estaban aquí antes que el mar"),
en `podio/lines.ts`; las uniones secretas de Maneki, Lumen y Eclipse (SC `SECRET_JOINS`); los textos de los 12 secretos
de expansión (`state/sys/secrets.ts` `REWARDS`).

---

## 2. Fichas de personajes

| Personaje | Rol | Dónde aparece | Lo que dice o es (parafraseado) |
|---|---|---|---|
| **Capitana Luzterna** | Narradora; ex-farera del Archivo, fantasma | Todo: beats, tips, NOVEDADES (`updates.ts`, una línea por versión), presentaciones (`features.ts`), retrato animado (`ui/story/portrait.ts`) | Sarcástica, protectora, chiste recurrente de estar muerta. Te dice "grumete" hasta el Jefe 1 y "Capi" después (`personalize()`). Al final suelta la linterna y se queda en tu faro. |
| **Capi / {name}** | El jugador, nunca se ve | Ficha "FOLIO 001", Diario, créditos | Nunca se explica por qué está en una balsa. Luzterna bromea con que "suena a alguien que ya se cayó de una balsa". |
| **Canelo** (renombrable) | Primer gato (Común, Fuego) | Prólogo (caja), H01–H02, informe "Mientras no estabas" (foto), créditos | Lore: nació para dormir en una caja. Tiene una bufanda que Luzterna odia. Su versión épica, Canelo Infernal, "ahora parte barcos en tres". **Ojo**: empiezas con 3 gatos (Canelo, Gelatino, Brote), no solo con Canelo. |
| **Distraxia, la Niebla del Olvido** | Antagonista | b09, H21, H29 y la reliquia de un evento flash que nunca se programó | Habla con mil voces y no tiene retrato (hablante tipo `system`). "Yo no destruyo, yo borro." Maneja al Leviatán. Tomó la queja de Nadie como orden. Termina como página en blanco. |
| **NADIE** | Entidad del Vacío; luego gato Legendario (`l_nadie`) | b24, H28, H29, Catdex, chatter, Podio | Una sola voz, plana. Su lema: "NO ONE LIKES CATS". Lore: nadie lo adoptó ni le puso nombre, así que se quedó con ese; cuando alguien dice que a nadie le gustan los gatos, levanta la pata. Cierra con "…Mentira." |
| **Velo Noctis** | Rival y luego aliada (`s_noctis`, secreto) | H09, H13, H15, H21, H22, H29; carta del secreto 4 | Elegante y burlona; roba "gatos, núcleos y protagonismo". Te salva en el final. Firma con "—N." la carta de la Botella del Faro. |
| **Madame Noir** | Croupier del casino El Gato Negro (gata negra dibujada en código) | `panels/casino/*`, NOVEDADES | "Rescata" gatos perdidos de otros multiversos y los pone de premio. Parodia la cultura pop y siempre recuerda las probabilidades. |
| **El Heraldo (del Arcanista)** | Mensajero; trae la Magia | H14 | Curioso y ominoso: "así que tú andas despertando primordiales". Te cita en las Ruinas. |
| **El Arcanista** | Jefe 4, "Ladrón de Páginas" | H15 | Sin paciencia; arranca páginas del Archivo (nunca se dice por qué). Suelta a Merlina y el primer fragmento. |
| **Sonata Prima** | Gato secreto Mítico (Magia/Cósmico/Tormenta) | Secreto 6 (La Orquesta Muda), H16 | Lore: nació del primer acorde que ordenó el caos del Archivo Vivo. |
| **Primordiales** | Gatos "origen" de cada elemento | Jefes y Grietas | Ignis, Abisa, Silvana, Gea, Tronador, Merlina, Astra Prima, y en las Grietas Bóreas, Headliner, Medianoche, Cronos, Áurea y Nadie. Cada uno trae su elemento. |
| **Leviatán Almirante / El Primer Mar** | Jefe final del Cap. 1 | Prólogo, H21 | Ballena-barco de hueso. Nadie lo llama "mi almirante". Al perder, Distraxia avisa que algo viene detrás de ti. |
| **Estrella Errante** | Jefe 5 | H17 | Cayó del cielo una vez; algo la empujó y "viene por ti". |
| **Patito Pirata** | Tutorial y revancha | H05, H20 | ¡Cuac! |
| **Bigotes Rotos, Gárgola, Kraken (y su capitancito)** | Jefes 1–3 | H08, H10, H13 | Fanfarrón cobarde; guardiana de 300 años; un pulpo que abraza. |
| **Lumen** | Gata secreta fotógrafa | 40 especies, casino, secreto 1 | Captura recuerdos antes de que Distraxia los borre. Ronda el Portal del casino tomando fotos. |
| **Mochi Maneki** | Gata secreta | 10 callejeros | Fue la primera en responder "cuando el Archivo pidió guardianes tiernos". |
| **Don Ganzúa** | Mercader sin cara | Solo en `story.characters` y `events.micro` | **No implementado.** |

---

## 3. Lo verificado contra la sinopsis del dueño

| Afirmación de la sinopsis | Estado | Evidencia |
|---|---|---|
| Un Archivo infinito de cajas; cada caja es un mundo | **Sí** | b18_archivo (H16) |
| Los gatos cruzan los límites de las cajas cargando recuerdos | **Sí** (con matiz) | b18: todo lo aprendido vivía ahí en forma de gato, los gatos son líquidos y pasan por las gateras, cada gato que juntas "es una página que regresa" |
| Luzterna, la farera, cuidaba el Archivo | **Sí** | b01 ("ex-farera del Archivo"), b18 |
| En una caja vivía Nadie, que decía "A nadie le gustan los gatos" | **Parcial** | FINAL_INTRO: lo dijo "mil veces, en mil cajas vacías". No se dice que viviera en una caja concreta. Su lore lo pinta como callejero sin dueño. En b24 la frase sale en **inglés** ("NO ONE LIKES CATS"). |
| Distraxia lo tomó como una orden | **Sí** | FINAL_INTRO ("Él me lo pidió" / "Era una queja. No una orden") |
| El Archivo se rasgó | **Sí** | b18, título de la batalla final |
| Luzterna siguió alumbrando hasta morir | **Sí** | FINAL_OUTRO: se quedó con la linterna para que las páginas vieran dónde caer y "se le olvidó bajar" |
| El jugador despierta en una balsa con una palmera, una caja y Canelo | **Sí** (con matiz) | Prólogo l.1192 + b01. Hay **3 gatos iniciales** (Canelo, Gelatino, Brote) y Bigotes lo comenta. |
| Construye la isla; piratas, primordiales, Magia, Vacío | **Sí** | H05–H22, H14 (Magia), H28 (Vacío) |
| Primer Mar y luego seis grietas | **Sí** | H21 y luego H23–H28. Las grietas no van en orden: cada una tiene su condición. |
| Final: Nadie nunca quiso que los gatos desaparecieran | **Sí** | FINAL_INTRO |
| Distraxia se vuelve una página en blanco | **Sí** | FINAL_OUTRO |
| Luzterna encuentra hogar en el faro de nuestra isla | **Sí en diálogo, no en la isla** | FINAL_OUTRO. **El faro de la isla no cambia**: `IslandScene.ts` l.421–434 sigue con el mismo haz y el mismo texto al tocarlo ("El faro mira al Primer Mar…"), y ningún código lee `won_final_archivo` fuera de `finale.ts`. |
| "A nadie le gustan los gatos. Mentira." | **Sí** | FINAL_OUTRO: lo dice Nadie, los gatos contestan "…Mentira" y Nadie lo repite |

**Lo que difiere o la sinopsis no menciona:**
- Nadie **se une como gato jugable** antes del final (H28) y en H29 ya es aliado. La sinopsis no lo dice.
- En b24 Nadie llama al Leviatán **"mi almirante"**. El final dice que nunca pidió nada, y nadie explica la contradicción.
- El GDD original era otro: Nadie era la entidad de afuera que borra cajas y Distraxia, la niebla que queda. El final
  implementado lo reescribió (Distraxia actúa sola por un malentendido).
- El GDD decía que la linterna encendía el **Faro del Primer Mar**. Lo implementado la cuelga en **tu** faro.
  Ese Faro del Primer Mar lo enciende el jugador en el secreto 8 / E23, y otra vez "solo" en H27.
- Velo Noctis es una aliada central que la sinopsis no nombra.
- El casino tiene su propio lore: lo que Distraxia borra cae por las grietas y casi todo acaba en El Gato Negro.

**No implementado** (prometido en datos, docs o GDD):
- Evento **Bandera Negra** de Noctis (beat b14 sin usar; H12 se completa comprando el barco).
- **Eventos flash**, incluido "Niebla de Distraxia", cuyo premio era "lore de Distraxia" (`events.flashTypes`; nada los dispara).
- Microeventos **Botella con Mensaje**, **Don Ganzúa** y **Error 404** (`state/sys/micro.ts` solo tiene 5:
  pez dorado, callejero, cangrejo, lluvia y burbuja).
- **Mesa del Gato / Cat's Gambit**: al tocarla sale "Próximamente" (`IslandScene.ts` l.418).
- Página "**Próximo mar: ???**" del Catdex: el dato `catdexTeaser` (`t_void`) existe, pero nada lo dibuja.
- Las banderas `story:capitulo2` (secreto 12, "El Capítulo 2 ya sabe que existes") y `story:faro` (secreto 8):
  se ponen y **nadie las lee**.
- El cambio visual del faro de la isla después del final.
- En el GDD, el antifaz de Noctis "escondía algo del Vacío". No está en el juego.

---

## 4. Superficies narrativas que ya existen (para que REGISTRO 000 aparezca sin inventar pantallas)

Para cada superficie: **qué puede mostrar hoy**, **de dónde sale el texto** y **qué haría falta** para usarla.
"Solo datos" = agregar una línea a un arreglo o JSON que ya existe. "Código chico" = una condición o un parámetro nuevo.

| Superficie | Dónde | Texto | Arte | Cómo se alimenta | Para REGISTRO 000 |
|---|---|---|---|---|---|
| **Portada de victoria del Diario** (Results) | `scenes/ResultsScene.ts` l.147–230; `fx/sequences/victoryNews.ts` | Titular, kicker, subtítulo, **pie de foto** (pool `CAPTIONS`, incluye "FOTO: archivo del Diario…"), edición "AÑO I · Nº ####", lugar y fecha. Cuadro **"EN LA PRÓXIMA EDICIÓN"** (`teaser`), hoy solo en la primera victoria contra un jefe. Las columnas del cuerpo son barras falsas, no texto. | **Foto real** de la batalla (captura con medios tonos) + **gato MVP vivo** (cualquier especie, con tinte) | Pools aleatorios `HEADLINES`, `QUIPS` y `CAPTIONS` (SC y ResultsScene); `BOSS_NEWS` por jefe | **Solo datos**: un pie de foto o una frase rara con baja probabilidad. **Código chico**: un `teaser` fuera de los jefes, o una figura extra en la foto. |
| **Portada de derrota** | `ResultsScene.ts` ~l.560 | "EDICIÓN DE LUTO", copy (`story.defeatCopy`), frase del jefe | Ninguno | Pool en CJ | Solo datos |
| **Portada genérica `newspaper()`** (hablante PERIÓDICO) | `ui/dialog.ts` l.614+ | Titular (¡EXTRA! se separa como kicker), línea de edición (por defecto "AÑO ???"), pie de foto | **Foto opcional** (cualquier textura, con filtro de tinta) | Cualquier línea `['PERIÓDICO', …]` de un beat | Solo datos dentro de un beat nuevo. La línea de edición admite un número de folio. |
| **"Mientras no estabas…"** (al volver) | `ui/story/offline.ts` | Notas con kicker/título/cuerpo (economía, santuario, "SUCESOS: tiraron N vasos"), **TIP DEL DÍA**, mensaje de sistema | Foto de **Canelo dormido** (gato vivo, especie fija) con pie "el sospechoso…" | `items` armados en código; tip de `loadingTip()` | **Código chico**: una nota "SUCESOS" condicional. **Solo datos**: un tip nuevo. |
| **Tips de carga** | `ui/story/text.ts` `TIPS` | Una frase | Ninguno | Pool aleatorio. Sale en el prólogo y en el informe de regreso. Ya hay un tip con "Nadie quiere a los gatos, dijo el perro". | Solo datos |
| **Chatter de la isla** | `data/chatter.ts`, `island/chatter/lines.ts` (`EXTRA`, `DIM_LINES` por dimensión, `REACTIONS`) | Burbuja sobre un gato: frase y retractación | Es el gato mismo, caminando | Pool aleatorio, filtrable por elemento o dimensión. Ya existe: "Si dices NADIE tres veces frente al espejo…" | **Solo datos**; ideal para algo sutil (por dimensión, p. ej. `ruins` y `ghost`, que ya tienen chistes de "ojo gigante" y "me lagueé") |
| **Microevento Gato Callejero** | `ui/micro/MicroOverlay.ts` l.192–211; `state/sys/micro.ts` | Toast con nombre y descripción | **Silueta negra con "?"** que al tocarla se revela (hoy siempre usa el arte de Nimbo, `nube_dream_cat`) | Aparece solo cada 6–10 min en la isla | **Código chico**: que la silueta **no** se revele, o que sea otra. Es la superficie de "gato misterioso" más natural que hay. |
| **Catdex** | `panels/Catdex.ts` | Subtítulo fijo "EL PRIMER MAR · REGISTRO OFICIAL DE GATOS QUE NADIE QUIERE". Por especie: nombre, epíteto, LORE, "SE DICE QUE…"/PISTA (`hint`), estados SELLADO / SILUETA / RUMOR / REGISTRADO. Si es secreto y está sellado: "ARCHIVO SELLADO" con glitch. Insignias de elemento "???". | Arte de carta por especie; silueta | `cats[]` en CJ (lore, hint) | Una especie nueva cuesta caro (arte y rig; ver `agregar-gato.md`). Barato: dibujar el `catdexTeaser` que ya existe. **Ojo**: el jugador ya es el "FOLIO 001". |
| **Ficha de tripulación** | `ui/story/profile.ts` | Etiquetas "REGISTRO DE TRIPULACIÓN · FOLIO 001" y "CASILLA 2" | — | Fijas en código | Hace eco directo con "REGISTRO 000": el jugador es el folio **001**. Solo datos o código chico. |
| **Odds del Santuario** | `panels/Sanctuary.ts` l.840–867 | Filas de resultados posibles; las desconocidas salen como **"???" con glitch** | — | Calculado | Código chico (una fila fantasma). El tip "ese ??? de 1 % es real" ya prepara el terreno. |
| **Créditos** | `ui/story/credits.ts` | Bloques de texto (stats, GRACIAS, CÓMO NACIÓ…); "Momento favorito" sale de la bitácora del gato MVP | **La tripulación camina** por el pie de página (hasta 6 gatos vivos) | `ROLL` fijo + `stats()` | Código chico: un caminante de más o una línea en `ROLL`. También se abren desde Ajustes › CRÉDITOS. |
| **Pantalla de título** | `scenes/TitleScene.ts` l.81–148 | "CAPÍTULO 1 — EL PRIMER MAR", lema, **coordenadas "47.4979° N · 19.0402° E · ISLA SIN NOMBRE"** (son las de Budapest), pie | 4 paneles con **gatos vivos** por dimensión (Ignis, Linterna Espíritu, Pixel Glitch, Canelo) | Fijos | Solo datos: cambiar las coordenadas o el capítulo es muy sutil |
| **Faro de la isla** | `IslandScene.ts` l.420–434 | Texto flotante al tocarlo: "El faro mira al Primer Mar…" | Faro dibujado + haz | Fijo | Código chico: texto condicionado al final. Además salda la promesa de la linterna. |
| **Secretos de expansión** | `state/sys/secrets.ts` `REWARDS`; `island/landmarks.ts` | Texto de recompensa (p. ej. 12: "El Capítulo 2 ya sabe que existes") | Landmark dibujado (ojo, botella, faro…) | Fijo; banderas sin leer | Solo datos para el texto; ya hay una bandera `story:capitulo2` lista para usar |
| **Carta de zona** | `ui/story/zoneCard.ts`, SC `ZONE_CARDS` (zonas 2–6) | Nombre, facción, lema, viñetas, jefe | Íconos de elemento | Fijo | Solo para zonas nuevas |
| **Póster de elemento descubierto** | `ResultsScene.ts` `DISCOVERY_CAPTION`; GS `GRIETA_CAPTION` | Una línea | Póster del elemento | Fijo por elemento | Solo datos |
| **Diálogos** (`say()`) | `ui/dialog.ts`, hablantes en `ui/story/text.ts` | Líneas; acotaciones entre paréntesis que se *actúan* (`darkSky`) | Retrato por slug. Los hablantes **`???`**, `NADIE` y `DISTRAXIA` **no tienen cara** (tipo `system`) | Beats en CJ o en SC + ganchos de `story.ts` | El hablante `???` ya existe y está registrado |
| **Tip de esquina** (`tip()`) y `line` de misión | `story.ts` `maybeTip`; `missions[].line` y `why` | Una frase de Luzterna | Retrato de Luzterna | Al aparecer una misión | Solo datos |
| **NOVEDADES** | `data/updates.ts` | Título, línea de Luzterna, puntos | Retrato de Luzterna | Una vez por versión | Solo datos (coordinar). Muy sutil: una frase de Luzterna que "no cuadra". |
| **Glosario** | `data/glossary.ts` | Qué es / para qué sirve / cómo se usa / dónde / chiste. Se oculta como "???" hasta llegar (`gate`). | — | Datos | Solo datos (una entrada bloqueada para siempre) |
| **Casino: host y chat** | `panels/casino/lines.ts` (`H`, `CHAT`, `CHAT_USERS`) | Frases de Madame Noir (también por voz); **chat ficticio con usuarios** (`michi_420`, `vaso_caido`…) | Gata negra dibujada en código | Pools aleatorios | **Solo datos**: un usuario "registro_000" que comenta poco. Muy sutil. |
| **Podio** | `podio/ladder.ts` (`TRAINERS`, `CHAMPS`, `TAUNTS`), `podio/lines.ts` | Nombre del entrenador, burla, frases de victoria o derrota. Ya existe el campeón **"NADIE-EN-PARTICULAR"**. | Gato rival (especie real) | Pools y semilla por isla | Solo datos |
| **Panel de Fragmentos del Vacío** | `ui/fragmentsPanel.ts` | Lista de fuentes con su "dónde" | — | Fijo | Código chico (una fila "???" sin fuente) |
| **Bitácora del gato** (`moments`) | `state/sys/cats.ts`, `campaign.ts`, `ext/story.ts` | Frases como "★3 en el Altar…" o "Ascendió a…" | — | Hoy solo se ve en los créditos (Momento favorito) | Código chico |

**Lo que *no* existe** (habría que inventarlo): un álbum o galería de fotos, un "archivo" navegable de portadas viejas,
cinemáticas aparte de las escenas a mano del prólogo y las secuencias de revelación, y una página de lore fuera del glosario.

---

## 5. Hilos sueltos y misterios abiertos (material para la Parte II)

| Hilo | Dónde | Por qué sirve |
|---|---|---|
| **"¿Quién derrotó a mi almirante?"**: Nadie se presenta como dueño del Leviatán, pero en H29 dice que nunca pidió nada | SC `UNKNOWN_END` vs FS `FINAL_INTRO` | Entonces, ¿quién mandaba al Almirante? Es una contradicción en el canon que vale la pena aprovechar. |
| **La palabra de estática que "nadie alcanza a leer"** | SC `VACIO_OUTRO`; `bosses[] event_vacio.leave` | Un mensaje sin leer. Candidato natural para "REGISTRO 000". |
| **¿Quién tripula el Barco del Vacío?** | H19 (capitán "???"); el GDD dice "nave de NADIE", pero el juego no | Sin dueño en pantalla. |
| **¿Qué empujó a la Estrella del cielo?** | `bosses[] boss_5.defeat`, SC `BOSS_OUTRO[5]` (Luzterna oye "una tele vieja prendida en otro cuarto") | Nunca se dice. |
| **"Algo viene detrás de ti"**: lo dice Distraxia al perder en el Primer Mar | `bosses[] boss_6.defeat` | Nadie lo retoma. |
| **¿Qué son los Fragmentos?** Hay tres versiones: "de un barco que no debería existir", "fríos y vacíos" y "pedazos de cajas borradas" | `ui/fragmentsPanel.ts` l.33, `glossary.ts` `vacio`, FS | Se pueden reconciliar con una revelación. |
| **¿Por qué el Arcanista arranca páginas?** ¿Y para quién trabaja el Heraldo, que habla de "despertar primordiales"? | SC `HERALDO_*`, `BOSS_INTRO[4]`, `ZONE_CARDS[4]` "Biblioteca del Arcanista" | Ni el motivo ni el patrón aparecen. |
| **¿De dónde salió la Magia** si "no debería existir en este mundo"? | b16, `HERALDO_OUTRO` | Abierto. |
| **¿Quién llevaba el Archivo?** Maneki "respondió cuando el Archivo pidió guardianes"; Sonata nació "del primer acorde que ordenó el caos del Archivo Vivo" | `cats[] s_maneki.lore`, `s_sonata.lore` | Luzterna era la farera. ¿Quién era el archivista? ¿Hay registros anteriores al **001**? |
| **¿Quién es Capi?** ¿Por qué estaba en una balsa? ¿De qué caja salió la de Canelo? | b01, `c_canelo.lore`, `profile.ts` (FOLIO 001) | El origen del jugador no se toca nunca. |
| **El prólogo dice "CAPÍTULO ∞" y "en algún momento del futuro"** | `PrologueScene.ts` l.497 | Ese futuro ya se cumplió en H21, pero lo de "∞" no se explica. |
| **El Archivo "reabre sus puertas"** | Titular de FS | Es la puerta perfecta: el Archivo vuelve a estar abierto y se puede visitar. |
| **"Si alguien abre otra caja, aquí voy a estar"** | FS `FINAL_EPILOGUE` | Luzterna deja preparada una secuela. |
| **Secreto 12: "El Capítulo 2 ya sabe que existes"**. El ojo del Abismo parpadea y ronronea. | `secrets.ts` REWARDS[12]; bandera `story:capitulo2` sin leer | Ya hay una bandera puesta en partidas viejas. |
| **La carta firmada "—N."** ("Bonita isla. Me la quedo luego.") | `secrets.ts` REWARDS[4], E15 | La "N." puede ser de Noctis o de Nadie. |
| **El antifaz de Noctis "esconde algo del Vacío"** | GDD §5.2 (no está en el juego) | Una semilla del diseño original que nunca se usó. |
| **El Faro del Primer Mar** lo enciende el jugador (secreto 8 / E23) y luego "se prende solo" (H27). Luzterna dice que estaba apagado "desde que era chiquita". | `secrets.ts` REWARDS[8], GS `light` | Choca con la cronología. También sirve como misterio: ¿quién más lo prende? |
| **Madame Noir** "rescata" gatos de otros multiversos y nunca se dice quién es | `panels/casino/intro.ts` | Una tercera fuerza neutral. |
| **Lumen fotografía recuerdos antes de que se borren** | `s_lumen.lore`, `casino/intro.ts` | La fotógrafa del Archivo encaja con fotos en el Diario donde aparece "algo". |
| **Los Divinos "estaban aquí antes que el mar"** y la escalera del Podio "guardaba" a los rotos | `podio/lines.ts` `DIVINO_INTRO`; Big Bang: "antes de él no había nada" | Una cosmología previa al Archivo. |
| **Cronos ya vio cómo termina** | GS `time` | Un vidente que puede soltar pistas. |
| **El campeón "NADIE-EN-PARTICULAR"** del Podio | `podio/ladder.ts` `CHAMPS` | Un guiño que ya existe. |
| **Coordenadas de Budapest + "ISLA SIN NOMBRE"** en el título | `TitleScene.ts` l.107 | ¿Huevo de pascua o relleno? Se puede volver canon. |
| **La Singularidad duerme en el camarote de Canelo**, y Canelo le tiene miedo | SC `GRIETA_OUTRO` | Hilo menor. |

**Inconsistencias que conviene limpiar (o aprovechar) antes de la Parte II:**
- El título y el subtítulo del Catdex siguen diciendo "CAPÍTULO 1 / EL PRIMER MAR" después del final.
- El JSON de `b25_creditos` dice "{catdex}/54". El código usa el total real (86).
- La línea "Él me lo pidió" de `b22_final` nunca suena en H21. En el juego aparece por primera vez en H29.
- La `line` de H27 dice que el faro se prendió solo "y no apunta a casa". Al final la linterna sí se queda en casa (en tu faro), pero la isla no lo muestra.
- Los IDs `H31+` están libres (el regex de `unlocks` asume `[HCKE]\d\d`).

---

## 6. Guía de tono (sacada de las líneas reales)

**Registro.** Español latino con modismos **mexicanos** sobre todo (wey, no mames, chingón, ahorita, galleta María,
grupo de WhatsApp, telenovelas, las tías en Navidad). El modo por defecto es "Sin filtro". El modo "Familiar" cambia
cada grosería por una versión blanda (`SOFT` en `ui/story/text.ts`); **toda grosería nueva necesita su versión suave**.

**Nivel de groserías.** Ligero o medio, siempre para remate y nunca contra el jugador: *qué putas* (el famoso
"¡¿QUÉ PUTAS?!" en momentos de sorpresa), *chingón*, *romperle la madre*, *carajo*, *cabrones* (con cariño, para los
gatos), *chingaderas*, *pendejadas*, *ni pedo*. Límites duros: nada de chistes de etnia, religión ni Holocausto
(`agregar-historia.md`, `chatter.ts`). El casino nunca dice "la próxima es la buena" (falacia del apostador).

**Patrones de humor que se repiten:**
1. **Decir y retractarse**: una polémica y, un instante después, el arrepentimiento. Es la columna del chatter.
2. **El chiste de que Luzterna está muerta**: casi le da algo, y "ya me dio, estoy muerta". Se puede usar, pero el final le dio peso emocional, así que hay que dosificarlo.
3. **Romper la cuarta pared y meta-humor**: los bugs, "no hay anuncios", "despedimos al periodista", "no es un bug: es memoria".
4. **Anticlímax tierno**: algo letal que se ve tierno ("se ve tierna… pelea como chile"), o algo épico que se vuelve trivial (el pato).
5. **"Literal."** como remate ("rompió el cielo. Literal.").
6. **Periodismo falso**: titulares en mayúsculas, "PRECIO: UNA SARDINA", "un pescado que pasaba lo grabó todo", "los peces no comentan; no se acuerdan".
7. **Explicación honesta envuelta en chiste**: primero el chiste y luego la regla clara ("Toca la misión fijada…").
8. **Juego con la palabra "Nadie"** = nobody ("Nadie tocó mis cosas… eso dicen siempre"; "Alguien para Nadie").
9. **Giro sincero al final de los arcos**: la muerte de Luzterna, "ya solté". Una vez por arco, sin burla después.
10. **Referencias pop con giro** (Star Wars, Harry Potter, Dragon Ball, anime, streamers). El casino las parafrasea; el chatter cita frases cortas.

**Gritos de ataque.** La forma de batalla grita en **inglés, en mayúsculas y con signo de exclamación** ("HAIRBALL
IGNITION!!"). Las ultimates van en inglés con el **nombre en japonés entre paréntesis** (p. ej. HAIRBALL BARRAGE! con
毛玉乱射). Hay alguna mezcla en español ("MIL PÉTALOS: STEAM SLASH!"). Los Divinos gritan **frases completas y amenazantes
en inglés**. El prólogo pone los kanji en vertical (星の勅令) más "STELLAR DECREE:". El presentador del Podio mezcla
"¡FIGHT!", "¡HAJIME!" y "¡PELEEN!". Los avisos grandes del sistema van en inglés: "UNKNOWN ELEMENT DETECTED",
"A VOID SHIP HAS ENTERED YOUR WORLD — 14:59". **Para REGISTRO 000**: lo natural es un aviso de sistema en inglés, en
mayúsculas y seco, o el formato de folio de la ficha ("REGISTRO … · FOLIO 000").

**Cómo habla cada voz:** Luzterna, frases cortas con remate. Noctis, burla elegante en una sola línea. Distraxia,
susurro solemne. Nadie, palabras sueltas y planas, con muchos "…". El Diario, mayúsculas y comillas de "declaración".

---

## 7. Riesgos de propiedad intelectual

| Elemento | Dónde | Parecido | Riesgo |
|---|---|---|---|
| **"Catdex"** | Panel principal y glosario | Calca "Pokédex", marca de Nintendo y The Pokémon Company | Bajo-medio. Es un acrónimo descriptivo, pero es la pantalla central. |
| **"Plinko"** como título de mesa | `panels/casino/games/*` ("PLINKO") | Marca de *The Price Is Right* (Fremantle) | **Medio**: es un nombre comercial visible. Conviene renombrarlo ("Cascada", "Pachinko gatuno"…). |
| **Tiempo: "TIME STOP" con 時よ止まれ** | `c_tic`, Cronos, Arenita, Péndulo | Frase icónica de DIO en *JoJo's Bizarre Adventure* | Bajo-medio. Cambiar la glosa japonesa le quita el calco. |
| **Vapor Ronin: "MIL PÉTALOS" con 千本桜** | `e_vaporronin` | El bankai Senbonzakura de Byakuya (*Bleach*) y la canción Vocaloid | Bajo-medio |
| **Solar: "HIGH NOON!"** | `r_solar` | La ultimate de McCree/Cassidy en *Overwatch* | Bajo |
| **Merlina** (gata de Magia con estilo de libro de cuentos) | `l_merlina` | En Latinoamérica "Merlina" es el nombre oficial de Wednesday Addams | Bajo (es un nombre común), pero se nota mucho en LATAM |
| **Rarezas Heroico y Divino, Primordiales, orbes, "Carrera Heroica"** (GDD) | Sistema de rarezas y eventos | Vocabulario de *Dragon City* (Heroic, orbs, eventos Heroic Race) | Bajo: las mecánicas no se protegen. Evitar copiar nombres exactos de eventos. |
| **Chatter con frases literales** ("Yo soy tu padre", "You shall not pass!", "Hakuna matata", "Wubba lubba dub dub", "Gomu Gomu no…", "Plus Ultra", "Dattebayo", "Expecto Patronum") | `data/chatter.ts` | Frases cortas de franquicias; "Hakuna Matata" es marca registrada de Disney | Bajo (parodia corta, no se usan como marca), pero **contradice la regla del casino** de "parafrasear, nunca citar literal" |
| **Personas reales nombradas** (Rubius, Messi, Pattinson, el Mario de Chris Pratt, "Siuuu") | `data/chatter.ts`, `island/chatter/lines.ts` | Derecho de imagen; `casino/lines.ts` prohíbe nombrar gente real | Bajo, pero inconsistente con la regla del propio proyecto |
| **Nadie / "Nobody"** como ser del Vacío | `l_nadie`, b24 | Recuerda a los *Incorpóreos* (Nobodies) de *Kingdom Hearts*; el "Nadie" de Ulises es dominio público | Bajo: el concepto es genérico y el juego de palabras es propio |
| **NEKRONOMICON / PAGE 666** | `h_nekomante` | Necronomicón de Lovecraft (en gran parte dominio público) | Muy bajo |
| **Ultimates repetidas**: "EVENT HORIZON" / 事象の地平線 en Singularidad **y** Devoradora | `m_singular`, `e_devoradora` | No es propiedad intelectual, es una duplicación interna | Solo pulido |
| **RMS Gatanic, "84 años", "más de 8,000", "Es peligroso ir solo"** | `TIPS` | Parodias de *Titanic*, *DBZ* y *Zelda* | Muy bajo |

**Recomendación para la Parte II:** que "REGISTRO 000" y su diseño no se apoyen en franquicias (nada de "Missingno",
"Glitch Pokémon", "SCP-000" ni "Expediente X"). Hay que vigilar especialmente **SCP**: "Registro/Folio 000" con estética de
expediente roza la convención de numeración de la SCP Foundation. Sus textos son CC BY-SA, así que se puede, pero el
contenido derivado hereda la licencia y la atribución. La firma tipográfica y de numeración debería salir del Diario
del Mar y del FOLIO 001 que ya existen.
