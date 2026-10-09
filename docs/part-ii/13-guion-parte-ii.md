# 13 · Guion de la Parte II: las cuatro oleadas, misión por misión

**Para qué sirve.** Es el mapa narrativo completo, para que la historia entre al juego por partes sin reinventarla en cada oleada.

**Cómo usarlo.**
- La **Oleada 1** está detallada e implementándose (`12-puente-oleada-1.md`).
- Las **Oleadas 2–4** quedan a nivel de misión. Cada misión indica qué sistema del juego usa, para saber si es solo contenido o si pide código.

**Reglas que valen para todas las oleadas:**
- Todo pasa en el juego de siempre (decisión del dueño, 2026-10-09). La única vista nueva son las **islas de la Parte II, que se visitan en 3D** (`14-regiones-3d.md`) y aparecen en la carta, en el MAR DE LAS RUPTURAS. La isla de casa sigue en 2D.
- Misiones `H` consecutivas. Batallas de historia con el patrón de `grietas.ts`. Datos en `data/rupturas/*.json`.
- Cada oleada abre con **una pregunta**, responde **una o dos** y deja **una más grande**.
- Nunca se castiga al jugador por haber construido su isla. Luzterna no es villana. El final de la Parte I no se invalida: se le ponen consecuencias.
- Humor siempre. Ninguna exposición dura más de 4 líneas sin acción.

---

## Oleada 1 · La Marea Imposible (H31–H41)

- **Pregunta:** ¿por qué el mundo dejó de comportarse?
- **Respuesta:** la página en blanco de Distraxia se está escribiendo, y alguien escribe en los márgenes.
- **Pregunta mayor:** ¿qué es REGISTRO 000?
- **Detalle completo:** `12-puente-oleada-1.md`.
- **Orden:** H31 faro (+ cinemática 3D «el reflejo») · H32 REGISTRO 000 · H33 desembarco en Páginas Hundidas (3D) · H34 La Biblioteca a la Deriva · H35 Shhh · **arco de Canelo:** H36 La página de Canelo (su Eco) → H37 Canelo quiere el timón (3 victorias en cualquier modo) → H38 ¡A BABOR! (el golpe final; forma Almirante) · H39 Isla Nácar (3D, puzle del haz) · H40 Madre Nácar · H41 La letra en el margen.

---

## Oleada 2 · El Cielo Despierta (H42–H49)

- **Pregunta:** ¿qué hay encima del mar?
- **Respuesta:** una capa del Archivo que los Correctores ya "arreglaron": Corona Celeste.
- **Pregunta mayor:** ¿quién mandaba al Leviatán?

**Sistemas nuevos:**
- **Elemento Gravedad**, con el verbo **mover**.
- **Kit de Vuelo:** un módulo de astillero que convierte TU barco en aerobarco.
- **Batallas con gravedad 0.7 y viento en capas.** Son parámetros del simulador; hay que agregarlos al `rules` de la batalla de historia.

| Misión | Título | Sistema | Resumen |
|---|---|---|---|
| H42 | Trombas | Contenido: misión + `use_feature` en el mapa | En el Primer Mar aparecen remolinos que suben. Luzterna: «Eso no es una tromba, Capi. Es un elevador. Y no hay botón de bajar.» |
| H43 | El Kit de Vuelo | Código: módulo de astillero nuevo | Un mecánico de Corona Celeste baja por la tromba a ofrecer el kit. Lo instalas en tu barco (y tu barco conserva su nombre). |
| H44 | Islas Invertidas | Batalla de historia con `gravity` < 1 y capitán de Gravedad | Cascadas que caen hacia arriba. Al ganar llega el elemento **Gravedad** y un gato. |
| H45 | Corona Celeste | Contenido: beat largo partido + misiones de exploración (encargos) | La ciudad más segura del mundo: nadie llora y nadie elige. Los gatos de ahí ronronean **todo el tiempo**. Luzterna: «Esto me da más miedo que estar muerta.» |
| H46 | La embajada | Batalla de historia «de daño» (`grade: 'damage'`) | Un Corrector diplomático te ofrece "corregir" a Canelo para que deje de ser impaciente. Pelea para que no lo toquen. |
| H47 | El otro almirante | Batalla de historia + revelación | Se repara la contradicción de la Parte I: el Leviatán tenía **otro almirante**, un Corrector. Nadie nunca le dio órdenes; los Correctores sí. |
| H48 | Luzterna lo sabe | Contenido: beat emocional | Luzterna descubre que su linterna es **una señal** hacia afuera de la caja. No lo sabía. Le duele. Tú decides con un diálogo de 2 opciones (cosmético; ninguna castiga): «apágala» / «déjala encendida». Ella la deja encendida: «Cuidar algo también es dejar que lo vean.» |
| H49 | Primordial de la Gravedad | Batalla de historia + primordial | Cierra la oleada. Gancho: el cielo tiene **costuras**, y detrás de una se ve **una mano de luz con un lápiz**. Es la primera imagen de un Titiritero. |

**REGISTRO 000 en la Oleada 2:** su ficha agrega una línea, «Visto: Corona Celeste», aunque nunca lo viste ahí.

---

## Oleada 3 · La Era Astral (H50–H57)

- **Pregunta:** ¿quién escribe en los márgenes?
- **Respuesta:** los Titiriteros. Construyeron el Archivo como hospital de mundos.
- **Pregunta mayor:** ¿y el jugador qué tiene que ver?

**Sistemas nuevos:**
- **Plasma** como estado de la Resonancia de combate (Fuego + Tormenta sincronizados). No es elemento.
- **Naves astrales** que gastan **Combustible Astral**.
- **Jefe multi-capa:** los cambios de fase cambian los parámetros del simulador.
- **Canelo Astral:** se rompe el sello de la forma.

| Misión | Título | Sistema | Resumen |
|---|---|---|---|
| H50 | Puerto Cometa | Contenido + nueva tienda | Un astillero retrofuturo. Su dueño, un gato con casco de pecera, cobra en **Combustible Astral**. |
| H51 | Sincronía | Código: botón SINCRO (Resonancia de combate) | Primera sincronía: Fuego + Tormenta = **Sobrecarga**. Luzterna explica gritando en japonés. |
| H52 | La Estrella que empujaron | Batalla astral, gravedad 0.25 | Paga el hilo de la Parte I: un Titiritero «reubicó» la Estrella para salvar otra caja. Hubo daño colateral, pero nadie es malvado. |
| H53 | Canelo Astral | Forma (sistema de la Oleada 1) | Se rompe el sello. Canelo es el único que **puede ver a REGISTRO 000**, y no dice nada: se lo queda viendo. |
| H54 | Maneki, el conserje | Revelación: un gato secreto que ya existe se vuelve clave | Maneki trabajaba para los Titiriteros: barría las cajas. Te confirma que el Archivo es un hospital. |
| H55 | Los Disruptores | Batalla + facción nueva | Piratas de grieta que quieren romper las cajas «para liberar a los mundos». Tienen razón en algo, y eso incomoda. |
| H56 | La nota al margen que es tuya | Contenido (semilla) | Una nota al margen está escrita **con tu letra**. No se explica. Luzterna: «Capi… ¿desde cuándo escribes así de bonito?» |
| H57 | El Leviatán Invertido | Jefe multi-capa: mar → cielo → grieta astral | La pelea grande de la saga. Al ganar: el Leviatán, ya libre, te da las gracias, y la grieta astral se queda abierta. |

---

## Oleada 4 · El Umbral (H58–H65)

- **Pregunta:** ¿qué es REGISTRO 000?
- **Respuesta parcial:** la primera entrada escrita en la página en blanco. Una posibilidad que todavía no eligió ser nada.
- **Pregunta mayor (Saga III):** ¿quién lo escribió, y qué decidirá Canelo?

| Misión | Título | Sistema | Resumen |
|---|---|---|---|
| H58 | El Archipiélago de los Sueños | Batalla con reglas oníricas sorteadas | Las islas cambian según qué gatos duermen en tu isla (se lee de la partida). |
| H59 | Ecos de Vida | Código: sistema de Ecos | Los gatos recuerdan vidas que no vivieron. Se desbloquea el primer Eco de cada gato que haya dormido 3 noches en tu isla. (Canelo ya vivió el suyo en H36–H38: su página de almirante.) |
| H60 | La Isla que Nadie Recuerda | Generada desde **tu** partida: tus hábitats en ruinas, las siluetas de tus gatos | Es tu isla, la versión en la que nunca llegaste. No castiga: es triste, y la vas reparando con tus gatos. |
| H61 | Lo que Distraxia sabía | Contenido: Distraxia como página en blanco (sin cara) | Distraxia, en blanco, «habla» con tachones. Sabía lo que pasaría si dejaba de olvidar. No se arrepiente. |
| H62 | Los Correctores tienen un plan | Batalla grande | Quieren escribir **un mundo perfecto** en la página en blanco. Todos los gatos felices porque ninguno puede elegir otra cosa. |
| H63 | El Umbral | Región frontera + jefe final de la saga | La frontera del Archivo. Aparecen las tres fuerzas, y ninguna tiene toda la razón. |
| H64 | Mentira | Final con decisión | Remata la frase de la Parte I: «A nadie le gustan los gatos. Mentira.» Ahora con otro sentido: los gatos cruzan límites sin perder quiénes son. La página en blanco **no se escribe todavía**: Canelo se echa a dormir encima y nadie puede escribir debajo de un gato dormido. Es su primera decisión libre. |
| H65 | Continuará | Créditos de la Parte II + gancho | REGISTRO 000 cambia su estado de *observando* a **despertando**. |

---

## Hilos de la Parte I: dónde se paga cada uno

| Hilo | Dónde se paga |
|---|---|
| Palabra de estática | H32 (FOLIO) |
| Faro del Primer Mar que no apunta a casa | H31 |
| «Algo viene detrás de ti» | H35 |
| Carta «—N.» | H41 |
| ¿Quién mandaba al Leviatán? | H47 |
| La Estrella empujada | H52 |
| ¿Quién llevaba el Archivo? | H54 |
| Fragmentos del Vacío | Oleada 2: son tinta seca de páginas borradas |
| Coordenadas de Budapest | Saga III, solo se siembra |
