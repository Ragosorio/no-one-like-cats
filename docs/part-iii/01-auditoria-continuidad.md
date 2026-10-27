# 01 · Auditoría de continuidad (Parte I + Parte II → Parte III)

**Para qué sirve.** Antes de diseñar la Parte III hay que saber qué canon no se toca, qué quedó abierto a propósito, qué se explicó mal y qué prometió la Biblia de la Parte II sin cumplirlo.

**Método.** Contrasté los docs (`docs/part-ii/03, 05, 13, 28`, `agentes/HOTFIX-VIVO.md`, `docs/CONTEXTO-NARRATIVO.md`) con los datos (`game/src/data/content.json`, `data/rupturas/historia*.json`, `especies*.json`) y con el código. Hice la auditoría el 2026-10-13. No cambié nada en `game/`.

**Marcas.** **[C]**: verificado en el código o en los datos. **[D]**: solo está en un doc. Las rutas sin prefijo cuelgan de `game/src/`.

> Este documento trae giros de la Parte II. El dueño ya la terminó y pidió la trama completa (2026-10-13), así que la regla de no contarle sorpresas de `28-traspaso.md` §0 **ya no aplica a la Parte II**. Las sorpresas de partes futuras se siguen cuidando.

---

## a. Canon que hay que conservar

### a1. Personajes y su voz

1. **Luzterna.** Es capitana fantasma y ex-farera del Archivo. Es sarcástica y protectora, dice groserías ligeras y bromea con que está muerta. Le dice «grumete» al jugador hasta el Jefe 1 y «Capi» después.
   - Murió porque se quedó arriba con la linterna para que las páginas vieran por dónde caer: «Yo nunca solté». Al final colgó la linterna en el faro del jugador y se quedó ahí de farera.
   - En la Parte II descubre que su linterna es una señal y decide dejarla encendida: «Cuidar algo también es dejar que lo vean».
   - Fuentes **[C]**: `content.json:18964` (b01_despertar), `ui/story/finaleScript.ts:22–37`, `app/story.ts:378–388`, b48 (`historia-o2.json:379`).
2. **Canelo** (`c_canelo`). Es Común, de Fuego y «el Impaciente». Nació para dormir en una caja. Es glotón, defiende su palmera y lleva una bufanda que Luzterna odia.
   - **Nunca habla:** no tiene hablante registrado (`ui/story/text.ts:95–143`), y en b53 Luzterna dice «Nunca me contesta».
   - Tiene dos formas, Almirante y Astral, y en las dos «sigue siendo Canelo».
   - Su primera decisión libre fue dormirse encima de la página (b64).
   - Fuentes **[C]**: `content.json:1664`, `data/rupturas/formas.ts`, `historia-o4.json:275`.
3. **Nadie** (`l_nadie`). Es una entidad del Vacío que después se vuelve Legendario jugable. Habla con voz plana y muy pocas palabras.
   - «A Nadie le gustan los gatos» era una queja, no una orden. Cierra la Parte I con «…Mentira».
   - En la Parte II no dice nada; solo lo nombran en H47.
   - Fuentes **[C]**: `content.json:7700`, `finaleScript.ts:9–19`, `ui/story/script.ts:339–349`.
4. **Distraxia.** Era el olvido del Archivo. Terminó la Parte I convertida en página en blanco.
   - En la Parte II «habla» con tachones: sabía lo que iba a pasar, no se arrepiente y prefirió «ser un hueco».
   - Fuentes **[C]**: `finaleScript.ts:25`, b35 (`historia.json:210`), b61 (`historia-o4.json:220`).
5. **Velo Noctis.** Empezó como rival y terminó de aliada. Es elegante y burlona («Me debes una»).
   - En la Parte II solo aparece en una línea: la firma «—N.» no era de ella.
   - Fuentes **[C]**: `content.json:5612`, `script.ts:351`, b41 (`historia.json:315`).
6. **Maneki** (`s_maneki`). Fue «guardiana tierna» del Archivo. En la Parte II resulta que era la conserje de los Titiriteros y barría cajas.
   - Ella revela que el Archivo es un hospital, y se queda «porque alguien tiene que barrer».
   - Fuentes **[C]**: `content.json:5458`, b54 (`historia-o3.json:304`).
7. **Las tres fuerzas.** Ninguna tiene toda la razón.
   - **Titiriteros:** manos de luz y lápices; nunca dan la cara.
   - **Disruptores:** grafiti y glitch; su capitana es Brecha.
   - **Correctores:** blanco perfecto, simetría y ronroneo al unísono. Firman «—N.», de *Normal*, y hablan por La Redacción.
   - Fuentes: b63 (`historia-o4.json:257`) y `state/sys/rupturasO4Battles.ts:85–114` **[C]**; `05-biblia:201–209` **[D]**.
8. **Las voces nuevas de la Parte II** ya están registradas y tienen su tono: Hélice, Escafandra, el Bibliotecario, Madre Nácar, Masa Madre, Jonás, Bisagra, Brecha, Duermevela y La Redacción (`ui/story/text.ts:126–143`) **[C]**.

### a2. Reglas del mundo

1. **El Archivo** es una pila infinita de cajas. Cada caja es un mundo con su propio trazo.
   - Los gatos son líquidos: pasan de una caja a otra por las gateras.
   - Cada ataque «reimprime» el mundo con su estilo: «no es un bug: es memoria».
   - Es la base canónica de las «dimensiones» de la Parte III. Fuente: b18_archivo, `content.json:19321` **[C]**.
2. **El Archivo es un hospital.** Cada caja es un mundo que se estaba muriendo. Los Titiriteros a veces les escriben el final. La caja del jugador «está sanando». Fuente: b54 **[C]**.
3. **Ya nadie borra.** Distraxia borraba; desde que quedó en blanco, «alguien escribe». Las islas nuevas se escriben «con fecha de antes». Fuente: b35, partes b y c **[C]**.
4. **La página en blanco** se puede escribir, pero «nadie puede escribir debajo de un gato dormido. Es la ley más vieja del Archivo». Fuente: b64 **[C]**.
5. **FOLIO.** El jugador es el FOLIO 001. La ficha REGISTRO 000 apareció antes del Nº 01, y el FOLIO 000 figura como «~~vacante~~».
   - Fuentes **[C]**: b32, `ui/story/rupturasScript.ts:117–135`, `ui/story/nameCat.ts:44`.
6. **REGISTRO 000.** Su ficha dice: especie desconocida, elemento ninguno, rareza no aplicable. Nunca está cuando te acercas. Solo Canelo lo ve.
   - Al final de la Parte II su ESTADO cambia a **despertando**.
   - Fuentes **[C]**: `rupturasScript.ts:117–131`, `panels/collection/registro000.ts:226`, `state/sys/rupturasO4.ts:105`.
7. **La linterna** del faro del jugador alumbra hacia afuera de la caja. Es una señal, y «alguien allá afuera ya sabe dónde vivimos».
   - Fuentes **[C]**: b48, `rupturasScriptO2.ts:96–99`.
8. **Los Fragmentos del Vacío** tienen dos explicaciones que conviven: «pedazos de las cajas que ella borró» (H29) y «tinta seca de páginas borradas» (H47).
   - Fuentes **[C]**: `finaleScript.ts:17`, b47 parte c.
9. **El Leviatán** obedecía a los Correctores: su almirante era un Corrector. Nadie nunca le dio órdenes. Fuente: b47 **[C]**.
10. **Los Ecos** son otras vidas posibles del mismo gato. No dan poder y aparecen después de 3 noches en la isla. Fuente: `state/sys/ecos.ts:1–33` **[C]**.
11. **Reglas de escritura:**
    - nunca se castiga al jugador por su isla;
    - Luzterna no es villana;
    - humor siempre;
    - máximo 4 líneas por parte de beat;
    - todo hablante debe estar registrado.

    Fuentes: `13-guion:13–14` **[D]**; `tests/rupturasStory.test.ts:159–183` **[C]**.

### a3. Cómo queda el mundo al final de la Parte II (lo que hereda la Parte III)

1. **H65 está hecha** y la partida tiene el flag `oleada4_fin`. La ficha de REGISTRO 000 dice **DESPERTANDO** en rosa. Fuentes: `rupturasO4.ts:13, 105` y `registro000.ts:226` **[C]**.
2. **La página en blanco** (lo que queda de Distraxia) descansa junto al faro del jugador, sin escribir y con la marca tibia donde durmió Canelo (modo `rest`). Fuente: `ui/story/o4Pagina.ts:1–12` **[C]**.
3. **Canelo** está despierto otra vez y tiene sus dos formas desbloqueadas. **Luzterna** sigue de farera: tocar el faro muestra `FARO_LUZTERNA`. Fuentes: `rupturasScript.ts:106–112` e `scenes/IslandScene.ts:115–121` **[C]**.
4. **Las tres fuerzas** se retiran del Umbral sin escribir la página, «esperando a alguien que decida». Del otro lado del Umbral no hay nada «todavía». Fuente: b63 **[C]**.
5. **El Leviatán** quedó libre, Jonás vive en la isla y la grieta astral quedó abierta. Fuentes: b57 **[C]**; `13-guion:75` **[D]**.
6. **La Isla que Nadie Recuerda** quedó reparada: «Ahora alguien sí llegó» (b60) **[C]**.
7. **Hay 34 especies nuevas** en los datos, y varios aliados que hablaron ya viven en la isla: Bibliotecario, Madre Nácar, Masa Madre, Hélice, Maneki, Grafitera, Jonás, Polvillo, Tachón y Bisagra. Fuente: `especies*.json` **[C]**.
8. **Dos elecciones quedaron guardadas:** H48 (`linterna:*`) y H64 (`mentira:*`). Ninguna tiene efecto todavía (ver f) **[C]**.
9. **La última línea de Luzterna** es «Creo que esto se acabó. Por ahora.» (b65) **[C]**.

---

## b. Misterios abiertos a propósito (no son errores)

1. **¿Qué es REGISTRO 000?** El juego nunca lo dice. La respuesta parcial («la primera entrada escrita en la página en blanco») solo está en `13-guion:82` **[D]**. En pantalla hay una ficha que pasa a «despertando».
2. **¿Quién lo escribió?** Queda para la Saga III (`13-guion:83`) **[D]**.
3. **La letra del jugador.** Una nota vieja al margen tiene la misma letra que la firma del jugador (H56). Luzterna responde: «No me contestes. No ahorita.» La relación del jugador con los Titiriteros solo se siembra: FOLIO 001 y la letra.
   - Fuentes: `05:246–247` **[D]**; b56 (`historia-o3.json:376`) **[C]**.
4. **La decisión de Canelo.** Por ahora «decidió que todavía no»; la decisión libre de verdad se guarda para el final de la Saga III. Fuentes: `05:248` **[D]**; b64 **[C]**.
5. **Budapest e «ISLA SIN NOMBRE».** Son las coordenadas 47.4979° N · 19.0402° E de la portada (`scenes/TitleScene.ts:115`) y de la revelación de gatos (`fx/sequences/catReveal.ts:121`).
   - Quedan reservadas para la Saga III (`05:243`, `13:110`).
   - **Ojo:** la Parte II no las sembró más; solo existe lo que ya venía de la Parte I **[C]**.
6. **¿Quién ve la señal de la linterna desde afuera?** Fuentes: b48 y `LINTERNA_LATER` **[C]**.
7. **¿Qué le contesta a Canelo** cuando mira el peñasco, y por qué solo él ve a REGISTRO 000? Luzterna: «parece que alguien sí le contesta a él» (b53 c) **[C]**.
8. **¿De quién es la mano de luz?** Los Titiriteros nunca dan la cara. El código lo dice explícito: «you never see whose it is» (`ui/story/o2Cines.ts:291`) **[C]**.
9. **¿Qué hay del otro lado del Umbral?** «Todavía» nada. Fuentes: b63 y `regions/umbral.ts:307` **[C]**.
10. **Misterios que vienen de la Parte I y siguen abiertos:** quién es Madame Noir, el «CAPÍTULO ∞» del prólogo, y quién es Capi y por qué estaba en una balsa (`03-historia-actual` §5) **[D]**.

---

## c. Conexiones mal explicadas

1. **La premisa de toda la Parte II llega tarde.** Que Distraxia era el olvido y que ahora «alguien escribe» se dice **después** de vencer al Bibliotecario (H35, parte b: `ui/story/rupturasScript.ts:79`). Para entonces el jugador ya hizo cuatro misiones sin saber por qué.
2. **«—N.» = Normal se revela en un solo globo**, después de ganar H41 (`historia.json:315`). Es el pago de un hilo de la Parte I.
3. **Quién mandaba al Leviatán y qué son los Fragmentos** se dicen después de la pelea de H47, en una línea cada uno (b47, partes b y c: `rupturasScriptO2.ts:63–64`).
4. **Los Titiriteros casi no se presentan:**
   - En H49 son una «mano de luz» sin nombre (`o2Cines.ts:277–313`).
   - En H54 Maneki los nombra de pasada (`historia-o3.json:317`).
   - En H63 ya son una fase de batalla («LOS TITIRITEROS», `rupturasO4Battles.ts:93`), sin haber dicho una sola palabra.
5. **Los Disruptores llegan con la conclusión puesta.** El `why` de H55 dice «Tienen razón en algo, y eso incomoda» (`historia-o3.json:107`) antes de que el jugador los conozca, y su argumento llega después de la pelea (b55 b). Fuera de H55 y H63 no existen.
6. **FOLIO conecta con algo que el jugador no recuerda.** Se revela en un CAPTION de H32 (b32, `historia.json:167`) y remite a un rótulo de la Parte I («FOLIO 001», `ui/story/profile.ts`) que casi nadie notó.
7. **Hay un salto causal** de los Ecos a la Isla que Nadie Recuerda y de ahí a Distraxia:
   - «Todos los Ecos terminan en la misma isla» (b59).
   - En su centro flota Distraxia (b61), y nadie dice por qué está ahí.
8. **Jonás aparece sin preparación** al final de H57: «Llevo mil años ahí adentro» (b57, `historia-o3.json:406`).
9. **H64 pide escribir y la elección no cambia nada** (ver f-4). Además, la página «bajó a tu isla» sin causa dicha (`why` de H64, `historia-o4.json:124`).
10. **REGISTRO 000 usa el arte de Nadie** en las islas 3D (`nadie_static_cat`, el mismo slug que `l_nadie`). Aparece en `regions/paginas.ts:449`, `regions/nacar/residents.ts:82`, `regions/invertidas/residents.ts:54` y `regions/cometa/residents.ts:101`. Quien tenga a Nadie puede leer «REGISTRO 000 = Nadie». **Hay que confirmar si es intencional.**
11. **Las islas 3D siguen diciendo «Estado: observando» después de H65.** El texto está fijo en `regions/cometa/residents.ts:110`, `regions/invertidas/residents.ts:63`, `regions/nacar/residents.ts:88` y `regions/paginas/lore.ts:100`, mientras el Catdex ya dice DESPERTANDO.

---

## d. Sistemas prometidos que quedaron reducidos (Biblia 05 contra lo real)

| Sistema | Lo que promete la Biblia 05 | Lo real **[C]** | Fuente del real |
|---|---|---|---|
| Especies nuevas | ≈80 (22 + 22 + 20 + 16), `05:336–340` | **34** (12 + 8 + 7 + 7) | `data/rupturas/especies*.json` |
| Evoluciones | ≈28, entre ellas Gelatino Marea, Cometín Perihelio y Copito Glaciar Nácar (`05:315, 327–330`) | **2**, las dos de Canelo. Su conducta en la isla (Almirante patrulla el muelle, Astral mira el peñasco; `05:324–325`) está «not wired yet»: solo cambia la pintura | `data/rupturas/formas.ts:52–53, 59–100` |
| Ecos | De 1 a 9 por especie, ≈110 en total, con apariencia, habilidad lateral y conducta (`05:303–310`) | **21 vidas genéricas + la de Canelo**. Cada gato despierta un solo Eco: recuerdo, objeto y lavado de tinta, sin poder | `state/sys/ecos.ts:1–22, 59–92` |
| Resonancia de Nueve Vidas / Nueve Destinos | Ulti para un Común con 9 Ecos (`05:311, 461`) | **No existe** | sin coincidencias en `src/` |
| Lo que sí se cumplió | 2 elementos (Cristal y Gravedad), batallas por capas (cielo 0.7, astral 0.25), jefe multicapa, Kit de Vuelo y naves | ✓ | `data/glossary.ts:651–695`, `battle/fases.ts`, `battle/cielo.ts`, `state/sys/rupturasO3.ts` |
| Combinaciones SINCRO | 8 (`05:439–448`) | **1**: Sobrecarga | `battle/sincro.ts:39` |
| Regiones | 8, más los bolsillos pop Viñetaria, Estadio y Ciudad del Scroll (`05:183`, PROPUESTO) | 8 navegables + «El reflejo» (solo cinemática). **0 bolsillos** | `regions/index.ts:12–24` |
| Mapa en capas (mar, cielo, astral, con zoom) | `05:102–118` | Hojas pegadas a la carta («Mar de las Rupturas») | `app/story.ts:569–571`, `regions/mapO4.ts` |
| Vista PÁGINA / MUNDO (tecla V) | DECIDIDO, `05:54–100` | **Solo en el slice** `rupturas.html`; el juego real no la tiene | `rupturas/views.ts`; `IslandViews` solo se importa en `rupturas/main.ts:32` |
| Recursos nuevos | Nácar, Combustible Astral y Tinta de Ruptura (`05:499–505`) | **Solo Combustible Astral** (`ext.astral.fuel`) | `state/sys/rupturasO3.ts:58–65` |
| REGISTRO 000 en superficies | 6 propuestas (`05:218–225`) | Ver la tabla f, fila 6. **Faltan** la silueta del Callejero, la fila «???» del Santuario y las coordenadas que cambian | `scenes/TitleScene.ts:115` (coordenadas fijas) |
| Catdex v2, Santuario v2 y naturalezas narrativas | Pestañas, genealogía `parents`, etiquetas Resonante/Onírico… (`05:295, 522–533`) | **No existen**. El subtítulo del Catdex sigue diciendo «EL PRIMER MAR» | `panels/Catdex.ts:100` |

**Consecuencia para la Parte III:** no hay que escribir como si existieran los Ecos por especie, las evoluciones de otros gatos, el Nácar, la Tinta de Ruptura ni la vista PÁGINA/MUNDO.

---

## e. Ritmo, presentación y comprensión

1. **Queja 1: «no sabía por qué hacía cada misión».**
   - 13 de 35 `why` terminan en un premio (H34, H35, H39, H40, H41, H44, H47, H50, H51, H52, H55, H58 y H62). Lo comprobé con una regex.
   - Ocho revelaciones llegan después de pelear: H35, H41, H47, H49, H52, H55, H57 y H62.
   - El «¿QUÉ ES ESTO?» de H31–H65 no tiene términos propios. `missionTerms` cae en `automaticos` + `reino` cuando la meta es `use_feature`, y en `batalla` + `mapa` cuando es `win_battle`. Fuentes: `data/glossary.ts` (`BY_GOAL`; `EXTRA` no tiene entradas de H31 en adelante).
2. **Queja 2: «apareció demasiada cosa nueva de golpe».**
   - Solo la Oleada 1 abre: islas 3D, una hoja nueva en la carta, REGISTRO 000, el Diario Perdido, el puzle de espejos, Cristal, Formas, Fonoteca y Momentos.
   - Ningún sistema de la Parte II tiene presentación en `ui/story/features.ts`: las 30 que hay son de la Parte I.
   - El glosario llega hasta la Oleada 2 (Cristal, Gravedad, Kit de Vuelo, Cielo). Faltan Combustible Astral, Taller Cometa, SINCRO, FASES, Formas, Ecos, Fonoteca, Momentos y Diario Perdido.
3. **Queja 3: «las cargas de las cinemáticas cortan el ritmo».**
   - Las tablas de beats tienen 49 escenas `h3x`–`h6x`.
   - 37 partes llevan `travel: true`: sacan al jugador de la CARTA y lo llevan a la isla para verlas (`app/story.ts:239`).
   - 7 beats de apertura esperan entre 20 y 25 s antes de empezar (`delay: 20/25`: H31, H39, H42, H49, H50, H57 y H58).
   - Encima van los 6 Momentos y el reflejo 3D.
4. **Queja 4: «la mezcla de la música se siente rara».**
   - Fuera de los Momentos suenan a la vez las variaciones, el ambiente, el sonido procedural y los efectos.
   - El `solo` del hotfix solo actúa dentro de los Momentos (`HOTFIX-VIVO.md:12`).
   - Las originales están en −17,5 / −16,5 LUFS.
   - El traspaso lo admite: «Nadie la ha escuchado con oído humano; todo se midió con números» (`28-traspaso.md:117`).
5. **HOTFIX (1): el dueño no encontraba las islas nuevas.** Las buscaba en su archipiélago (el fondo de la dimensión «fantasma»), pero viven en la CARTA. Se parchó con:
   - un aviso único de Luzterna (`aviso_carta_islas`, `app/story.ts:569–571`);
   - el pulso «¡NUEVA ISLA!» en ¡ZARPAR!.

   La causa de fondo, que las islas no se ven desde casa, sigue igual.
6. **HOTFIX (3): los Momentos terminaban las peleas demasiado rápido** (~2 turnos con los umbrales viejos). Ahora el umbral es 80 % y el Momento cierra la batalla con `endsBattle` (5 fases marcadas, verificado en `state/sys/rupturas*.ts`). Cualquier Momento nuevo hereda este contrato.
7. **HOTFIX (4) y (5): páginas repetidas y avisos encima de paneles.** Son síntomas de demasiadas capas de interfaz al mismo tiempo (`HOTFIX-VIVO.md:26–30`).
8. **Luzterna dice 135 de las 228 líneas de beats de la Parte II (59 %)**, y 19 de esas son instrucciones del tipo «Toca la misión fijada». Es narradora y manual a la vez, así que la Parte III no puede quitarla sin poner otra guía en su lugar (ver `investigacion/luzterna-funciones.md`).
9. **Las elecciones de H48 y H64 se presentan como importantes** y no tienen ninguna consecuencia visible.
10. **Lo que funcionó y no hay que romper:**
    - el final de H64–H65 (10/10 del dueño);
    - Canelo dormido sobre la página;
    - los Momentos sincronizados con las canciones;
    - el humor corto.

---

## f. Verificado en código o solo documentado

| # | Afirmación | Qué dice el doc | Qué encontré en el código o los datos | Estado |
|---|---|---|---|---|
| 1 | Dónde aparecen los Disruptores | H55 y H63 (`13:73, 92`) | **H55:** la batalla `ruptura_disruptores` (`rupturasO3.ts:459`), el grafiti en el cielo mientras H55 está activa (`ui/story/o3Sky.ts:84`) y el Momento te ODIO. **H63:** la fase 2 (`rupturasO4Battles.ts:85, 113`), dos residentes del Umbral (`regions/umbral/residents.ts:64`) y un garabato en la carta (`regions/mapO4.ts:312`) | **[C]** solo H55 y H63 |
| 2 | Cómo se ven los Titiriteros | Manos de luz y lápices; nunca dan la cara (`05:205`) | La mano con lápiz de la cine `h49_continuara` (`o2Cines.ts:277–313`); hilos de luz y lápices gigantes en el Umbral (`regions/umbral/props.ts:173, 291`); la fase con mecánica de «mano» (`rupturasO4Battles.ts:93, 114`); las notas «¿y esta isla?» y «(ver folio 000)» en la carta de noche (`island/night/mapNight.ts:27–28`) | **[C]** nunca tienen voz ni cuerpo |
| 3 | La elección de H48 es cosmética | `13:47` | Guarda el flag `linterna:apagala` o `linterna:encendida` (`rupturasO2.ts:202–218`). Efecto: 2 líneas de réplica y 1 tip después de H49 (`app/oleada2Flow.ts:110–127`). La linterna queda encendida en los dos casos | **[C]** cosmética |
| 4 | La elección de H64 («¿Qué escribes?») se guarda | `o4Cines.ts:197` | Guarda el flag `mentira:perfecto`, `mentira:romper` o `mentira:nada` (`rupturasO4.ts:74–84`). Solo se usa para la réplica inmediata; `o4Choice` (`o4Cines.ts:328`) no lo importa nadie | **[C]** se guarda y **nadie lo lee**: la Parte III lo tiene disponible |
| 5 | Pistas de la Fonoteca `amb.suenos`, `amb.umbral` y `registro_000` | docs 27 y 30 | `amb.suenos`, `amb.umbral` y `amb.registro_000` existen en `data/music/tracks.json:606, 660, 737` con sus archivos en `public/music/`. En cambio, `unlockSoon('registro_000')` (`app/o4Finale.ts:104`) no hace nada: ese id no existe y `resolveTrack` necesita un punto. La pista igual se desbloquea por `O4_SONGS` (`app/oleada4Flow.ts:164`) | **[C]** las tres existen; hay una llamada muerta |
| 6 | Dónde aparece REGISTRO 000 | 6 superficies (`05:218–225`) | **Sí aparece en:** la ficha del Catdex (`registro000.ts`, con una línea en la O2 y otra en la O3: `rupturasScriptO2.ts:102`, `rupturasScriptO3.ts:101`); el pie de foto del Diario al 2 % (`scenes/ResultsScene.ts:227`); el chat del casino al 5 % (`panels/casino/lines.ts:277`); «FOLIO 000 —vacante—» al nombrar un gato (`nameCat.ts:44`); de noche en 4 islas 3D; la nota «(ver folio 000)» en la carta; los créditos de la Parte II (`creditsParteII.ts:292–342`); el Momento YONOSE (`momentos/songs/yonoseTodo/ui.ts:266`). **No aparece en:** la silueta del Callejero, la fila del Santuario ni las coordenadas del título | **[C]** parcial |
| 7 | La ficha de REGISTRO 000 termina en «despertando» | `13:94` | Sí en el Catdex cuando H65 está hecha (`registro000.ts:226`). En las 4 islas 3D sigue diciendo «observando» (ver c-11) | **[C]** con una inconsistencia |
| 8 | Canelo es el único que ve a REGISTRO 000 | `05:325` | Hay una línea en la ficha (`REGISTRO_O3_LINE`) y la cine `h53_penasco` (`o3Cines.ts:18, 401`). En la isla no hay ninguna conducta (`formas.ts:52`) | **[C]** parcial |
| 9 | La nota de `story:capitulo2` en la ficha | `05:228`: la ficha lleva la fecha de la noche del secreto | Muestra la nota «Observando desde antes de que llegaras.» **sin fecha** (`registro000.ts:239`) | **[C]** reducido |
| 10 | Vista PÁGINA / MUNDO | `05` §2.5, DECIDIDO | Solo en `rupturas.html` | **[C]** solo en el slice |
| 11 | Ecos por especie (de 1 a 9) | `05:303` | Un Eco por gato, de un catálogo de 21 vidas | **[C]** reducido |
| 12 | Los Momentos terminan la batalla | `HOTFIX-VIVO.md:13–18` | `endsBattle` en `battle/fases.ts:82, 207`. Marcado en `rupturas.ts:312`, `rupturasO2.ts:301`, `rupturasO3.ts:477, 515` y `rupturasO4Battles.ts:132` | **[C]** |
| 13 | Luzterna explica una sola vez dónde están las islas | HOTFIX (1) | `app/story.ts:535, 569–571`; flag `aviso_carta_islas` (`state/sys/rupturas.ts:190`) | **[C]** |
| 14 | 13 de 35 `why` terminan en premio | Dato medido por el coordinador (encargo de esta auditoría) | Recontado con una regex sobre las cuatro `historia*.json` | **[C]** |
| 15 | La Parte II siembra Budapest | `13:110` | Solo existen las coordenadas de la Parte I (`TitleScene.ts:115`, `catReveal.ts:121`) | **[D]** no se sembró nada nuevo |

---

## g. Cómo responde la Parte III a esta auditoría (agregado por el director)

| Hallazgo | Respuesta en la Parte III | Dónde |
|---|---|---|
| c-1. La premisa llegó tarde | El prólogo del bar cuenta la Parte I y la Parte II **antes** de la primera misión, con la voz de Canelo | `04` |
| c-4 y c-5. Los Titiriteros y los Disruptores casi no se presentaban | Encarnan y actúan en cada dimensión; tienen desacuerdos visibles y su explicación nunca va solo después de vencerlos | `02` §4, `03` §2 |
| c-10. REGISTRO 000 usaba el arte de Nadie | Cerito tiene pintura propia (Lote S/A) | `06` §3 |
| c-11. Las islas 3D decían «observando» | Con H66 o más, el texto cambia a DESPIERTO. Es un parche chico de datos | `09` §2, etapa 0 |
| d. Lo prometido que se redujo | La Parte III **no** reutiliza nada que no exista. Promete menos y lo cumple: catálogo inicial de 18 pinturas nuevas con estados por gato | `06` §2 |
| e-1. El porqué de cada misión | Tarjeta de 5 campos y Bitácora | `03` §3–4 |
| e-2. Demasiado de golpe | Una novedad de sistema por capítulo, como máximo | `03` §6 |
| e-3. Las cinemáticas cortan el ritmo | Las escenas de la Parte III ocurren **donde está el jugador**: en el mapa 2D o en la dimensión, sin `travel` a la isla salvo que la historia pase en casa. Se precargan durante la tarjeta | `09` §5, C-3 |
| e-4. La mezcla | Bus de mezcla fuera de los Momentos y escucha humana del dueño antes de publicar | `07` §6, `09` |
| f-3 y f-4. Elecciones de H48 y H64 sin efecto | H48 **pesa** en la Parte III: la linterna que ella decidió dejar encendida es el faro que trae a los Titiriteros. H64 (`mentira:*`) se lee en el prólogo: Canelo recuerda qué quiso escribir el jugador | `02` §3, `04` §3 |
| e-8. Luzterna es narradora y manual a la vez | Se mantiene así hasta H93; después, la Bitácora y el Diario | `08` §6 |
