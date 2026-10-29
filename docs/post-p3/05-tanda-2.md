# 05 · Tanda 2: 25 Multidimensionales más

> ⚠️ SPOILERS de la Parte III. Agente DISEÑO-2, 2026-10-29. Solo diseño: no se tocó el código del juego, no hay commits y no se generó ninguna imagen.
> El dueño pidió: «haz otros 25 multidimensionales con más referencias de otras cosas más diferentes».
> Las fichas completas están en `01-roster.md` (sección «Tanda 2») y en `04-roster.json` (`post.tanda = 2`). La fuente es `fuente/md_tanda2.py`.

## 1. Los 25

| # | Gato (`id`) | Referencia | Categoría (`origin`) | Estilo de arte | Mesa grande (`post.source`) | Poder |
|---|---|---|---|---|---|---|
| 1 | El Sombreronrón (`xp_sombreronron`) | El Sombrerón | leyendas | MITOS (arte popular guatemalteco) | Tragamichis | MIDNIGHT BRAID! Tres listones: lo que queda dentro del triángulo, trenzado |
| 2 | El Gatejo (`xp_gatejo`) | El Cadejo | leyendas | MITOS | Multiverso Holo | TWO CADEJOS! Escudos a tus gatos solos, mordida a los suyos que estén solos |
| 3 | La Maullorona (`xp_maullorona`) | La Llorona (tierna, sin muerte) | leyendas | MITOS | Multiverso Holo | WEEPING RIVER! 7 lagrimones que buscan al gato más herido |
| 4 | Quetzalgatl ★ (`xp_quetzalgatl`) | Quetzalcóatl | mitos | MITOS (códice) | Portal (todos) | FEATHERED WIND! El viento es tuyo 3 turnos y las plumas sellan cañones |
| 5 | Bastet (`xp_bastet`, promovida) | Bastet | mitos | MITOS (Egipto) | Portal (todos) | HOME GUARDIAN! Tus celdas no bajan del 30 % y el sol cobra cada golpe |
| 6 | Cleogatra (`xp_cleogatra`) | Cleopatra | historia | MITOS (pintura egipcia) | Portal (todos) | THE PEARL WAGER! Apuesta de daño de 2 turnos |
| 7 | Napoleón Bonapata (`xp_bonapata`) | Napoleón | historia | PINCELES (David) | Modo Eterno | GRAND CONQUEST! Cada celda destruida sube tu daño para siempre |
| 8 | Leonardo da Michi ★ (`xp_leonardo`) | Leonardo da Vinci | historia | PINCELES (sus cuadernos en sanguina) | Multiverso Holo | CODEX OF INVENTIONS! Mejora el próximo tiro de cada gato según su rol |
| 9 | La Michi de la Perla (`xp_perla`) | La joven de la perla | pinceles | PINCELES (Vermeer) | Portal (todos) | SOFT WINDOW LIGHT! Cura y repara a tu barco 4 turnos |
| 10 | Isaac Miauton (`xp_miauton`) | Newton | ciencia | PINCELES (Kneller) | Multiverso Holo | LAW OF GRAVITY! Sus tiros pesan ×2 y los tuyos ×0.5 |
| 11 | Miauzart (`xp_miauzart`) | Mozart niño | clasica | PINCELES (retrato de corte, década de 1760) | Portal (todos) | BRAVO, ENCORE! La siguiente ulti de tu tripulación se repite |
| 12 | Miausagi (`xp_miausagi`) | Sailor Moon | p3d_anime | ANIME_V2 | Portal Michi | FULL MOON UNITY! Pega más por cada elemento distinto de tu tripulación |
| 13 | Tanjimiau (`xp_tanjimiau`, promovido) | Tanjiro (Demon Slayer) | p3d_anime | ANIME_V2 | Portal Michi | FLOWING DRAGON! Dragón de agua por el borde del barco, que pega cada vez más |
| 14 | Tetrimiau (`xp_tetrimiau`, promovido) | Tetris | pixel | PIXEL | Tragamichis | LINE CLEAR! Borra la fila más llena |
| 15 | Lara Croqueta (`xp_laracroqueta`) | Lara Croft | pixel | PIXEL | Portal Michi | RELIC RAID! Le roba barra a todos sus gatos y te la da |
| 16 | Mi Pobre Gatito (`xp_pobregatito`) | Mi pobre angelito | pantalla | PANTALLA | La Caja | HOME TRAPS! 4 trampas escondidas castigan al que te dispara |
| 17 | Felinamente Rubia (`xp_felinamente`) | Legalmente rubia | pantalla | PANTALLA | Tragamichis | OBJECTION SUSTAINED! El estado que te pongan se les regresa a todos |
| 18 | Capitán Gorrimiau (`xp_gorrimiau`) | el capitán pirata excéntrico (giro Disney) | pantalla | PANTALLA | Modo Eterno | THE COMPASS SAYS TUNA! Tus tiros se curvan hacia su gato con más barra |
| 19 | Doc Miauwn ★ (`xp_docmiauwn`) | Doc (Volver al futuro) | pantalla | PANTALLA | La Caja | FIX THE PAST! Tus tiros fallados regresan y pegan |
| 20 | Pinkmiau (`xp_pinkmiau`, promovido) | Jesse (Breaking Bad), solo matraz y goggles | pantalla | PANTALLA | Modo Eterno | LAB PARTNER! Un estado extra por golpe; con Heisenmiau, cuenta doble |
| 21 | Miauty la Fea (`xp_miauty`) | Betty la fea | telenovela | VECINDAD | Tragamichis | BALANCE SHEET! Les quita la ventaja de vida y repara tu barco |
| 22 | El Michíncipe (`xp_michincipe`) | El principito | p3d_libros | LIBROS_V2 | La Caja | THE SHEEP IN THE BOX! La caja trae lo que necesitas: cura, quita escudos o embiste |
| 23 | Ricardo Garjona (`xp_garjona`, promovido) | Ricardo Arjona | p3d_pop | POP_V2 | Tragamichis | THE STORY GOES ON! Todo lo bueno de tu lado dura 2 turnos más |
| 24 | Shakimiau ★ (`xp_shakimiau`, promovida) | Shakira | p3d_pop | POP_V2 | Tragamichis | SEISMIC DANCE! Derrumba toda celda que quede bajo el 30 % |
| 25 | Miaucol Yordan ★ (`xp_miaucol`) | Michael Jordan | estadio | ESTADIO (el 23) | Portal Michi | DUNK FROM THE LINE! Pega más por cada gato suyo que noqueaste |

★ = estrella de su mesa (peso 4). Los 25 poderes son distintos de los 25 de la Parte III, de los 60 post y de los de las 10 reservas que quedan. Ningún nombre de ulti contiene STARFALL, METEOR ni DECREE.

**Promovidos de la reserva:** conservan id y slug, y se rehicieron a la medida de titular.
- **Bastet:** poder nuevo, porque el anterior era casi el de Capitán Michimérica.
- **Tanjimiau:** poder nuevo, porque «la hermanita pelea 2 turnos» era casi el de Mr. Miaubody. Sus aretes llevan un pececito, no un sol.
- **Pinkmiau:** poder nuevo, porque «nube cada turno» era casi la pirámide de Daft Miau. Es la versión familiar: matraz y goggles, nada de bolsitas ni cristales.
- **Ricardo Garjona:** poder nuevo, porque la cura por turnos pasó a La Michi de la Perla.
- **Shakimiau:** epíteto «la que Hace Temblar el Escenario» (ya no «Caderas Sísmicas»). Su ulti es SEISMIC DANCE y su tiro, «Paso Sísmico». Se quitaron los pies descalzos, porque *Pies descalzos* es título de un disco.
- **Tetrimiau:** colores de bloque propios, no los siete clásicos.

## 2. Categorías: cómo quedaron

- **`origin` es solo una etiqueta.** El juego no la valida ni la usa para pintar a un gato post: `validate.ts` no la revisa y solo `p3cats.ts` la lee, para los gatos de la Parte III. Por eso entraron como etiquetas nuevas, **sin cambiar código**: `leyendas`, `mitos`, `historia`, `ciencia`, `clasica` y `telenovela`.
- **El estilo de arte sale de los locks que ya existen:**

| Categoría | Lock de arte | Por qué |
|---|---|---|
| leyendas, mitos | **MITOS** | El lock ya nombra «leyendas populares centroamericanas» y «códice». Cada gato trae su medio en `style_of_en`. |
| historia | **PINCELES** (Napoleón, Leonardo) y **MITOS** (Cleogatra) | Napoleón y Leonardo van en la manera de su pintor. Cleogatra va en pintura egipcia, el medio que mejor se lee. |
| ciencia, clásica | **PINCELES** | Kneller y el retrato de corte de la década de 1760. |
| telenovela | **VECINDAD** | El lock ya incluye «telenovelas». |

- **Un arreglo del generador:** Mitos y Pinceles ahora escriben una frase de STYLE CONSISTENCY por gato, con su propio medio. Antes Pinceles decía «rococó» para todos y Mitos decía «FIRST cat… style anchor».
- **Si algún día la Catdex agrupa por `origin`:** leyendas y mitos van con mitos; historia, ciencia y clásica con pinceles; telenovela con vecindad.

## 3. Obtención (solo datos, el balance no cambia)

- **Entran solo a las 4 mesas grandes**, en proporción a lo que ya tenía cada bolsa:

| Mesa | Antes | Tanda 2 | Ahora |
|---|---|---|---|
| Portal (todos) | 19 | +5 | 24 |
| Portal Michi | 16 | +4 | 20 |
| Multiverso Holo | 16 | +4 | 20 |
| Tragamichis | 24 | +6 | 30 |
| La Caja | 8 | +3 | 11 |
| Modo Eterno | 7 | +3 | 10 |

  - Hay 5 estrellas: Quetzalgatl, Leonardo, Shakimiau, Doc Miauwn y Miaucol.
  - **Parte y garantía iguales** (`POST_CASINO`, sin tocar). Un gato del lote sale igual de seguido; la bolsa es más grande, así que completar todo tarda más (las bolsas de MD crecen ~40 %).
  - El ×3 a los que no tienes ayuda a que salgan primero los nuevos.
- **Las vitrinas se quedan en 8, y la tanda 2 no entra.** Razones:
  1. El Tiro de Vitrina (14 / 11 / 15 %) y sus garantías están pensados para 1 legendario, 2 míticos y 5 MD.
  2. La pantalla dice «vitrina de 8 gatos» (`OddsPanel.ts`) y acomoda las cartas en dos filas de 4.
  3. «Rotar» pediría código.
- **Cómo queda en los datos:**
  - Su `post.vitrina` es el nombre de su mesa grande (`gacha`, `slot`, `caja`, `eterno`), que el validador ya acepta.
  - En el generador, los venues nuevos `gacha_michi`, `gacha_holo` y `caja` mapean a esas mesas sin vitrina.
- **Segundo camino, sin hacer nada:** el estandarte **MULTIVERSO** que está construyendo SISTEMA-2 (`multiversoPool()`, sin commit) toma a **todos** los Multidimensionales post por peso. Cuando llegue, los 25 salen también ahí.
- **Validación:**
  - El validador real del juego (`validate.ts` con vite-node, sobre lo que copia `postp3-sync.mjs`) da **0 problemas** en los 123 gatos y en las 10 reservas.
  - `generar.py` revisa además ids, nombres y slugs contra las 253 especies y las reservas.
- **Sets** (todos «Colección», sin balance):
  - **Nuevos:** Leyendas de la Abuela, Pirámides, Clase de Historia (incluye a María Gatoñeta), Sala del Museo (con Van Gato, La Gatoconda y El Gritito) y Noche de Videoclub.
  - **Altas en sets que ya existían:** Sábado de Anime (Miausagi, Tanjimiau), Fichas de Consola (Tetrimiau, Lara Croqueta), Maratón de Series (Pinkmiau), Puro Corazón Latino (Miauty) y Cartel del Festival (Garjona, Shakimiau).
  - **De los 98 en vivo, el único dato que cambia** es `xp_gatoneta.post.sets`, que suma «Clase de Historia». Pasa al juego cuando se corra el sync; los sets todavía no se cargan.

## 4. Cambios de código que harían falta (no los escribí)

1. **Meter a los 25 al juego:** nada nuevo. `node scripts/postp3-sync.mjs` los copia conforme llega su arte y los pone en los PENDING de universos y poderes.
2. **Poderes (PODERES-3, `battle/multidimPost/`, `data/multidimPowersPost.ts`):** 25 mecánicas nuevas. Los números están en cada ficha («Números para PODERES»). Las que piden ganchos que hoy no existen:
   - **Doc:** guardar en una bitácora los tiros que cayeron al agua.
   - **Cleogatra:** contar el daño de los dos lados durante 2 turnos.
   - **El Sombreronrón:** registrar 3 impactos y probar qué celdas quedan dentro del triángulo.
   - **El Gatejo:** saber qué camarotes se tocan (estar «solo»).
   - **Miauton:** gravedad por lado, sin que la IA corrija la puntería.
   - **Gorrimiau:** corregir la trayectoria de los tiros hacia un blanco.
   - **Mi Pobre Gatito:** trampas ocultas en tus celdas, invisibles para la vista previa y la IA.
   - **Felinamente:** interceptar un estado nuevo antes de aplicarlo.
   - **Bastet:** piso de vida por celda en la tubería de daño.
   - **Ricardo Garjona:** sumar 2 turnos a todos los relojes de tu lado.
   - **Miauzart:** repetir la ulti de otro gato al 60 %; si es un poder MD, solo su daño directo.
   - **Pinkmiau + Heisenmiau:** combo de pareja (`post.pair`), como Grrrú + Miaunion.
3. **Universos:** 25 revelaciones y cartas nuevas (`fx/sequences/multiverse/`). La toma de 2,2 s y el remate de cada una están en su ficha.
4. **Opcional, si el dueño quiere a la tanda 2 en las vitrinas:**
   - cambiar el texto «vitrina de 8 gatos»;
   - acomodar más de 2 filas de cartas en la pestaña VITRINA (o 5 por fila);
   - decidir si el Tiro de Vitrina se reajusta.

## 5. Riesgos

- **Medio-alto:**
  - **Miausagi:** la marca tiene gatos oficiales. Va sin la luna en la frente, con diadema lisa y varita-juguete; su plan B es el uniforme lila y rosa.
  - **Capitán Gorrimiau:** es Disney. Va como bucanero genérico, sin calaveras ni vestuario de la película, y sin cita.
- **Medio:**
  - **El Michíncipe:** el libro sigue protegido en EE. UU. hasta 2039 y la familia del autor cuida la marca. El diseño es propio y nunca copia las acuarelas.
  - **Personas reales:** Ricardo Garjona, Shakimiau y Miaucol Yordan son gatos, sin letras ni títulos.
    - Miaucol lleva el 23 (como los futbolistas) y una pose de despegue, nunca la silueta de piernas abiertas del logo.
    - Su nombre lleva el apellido en fonética latina, la misma pregunta abierta que «Gatistiano Ronaldo».
  - **Mi Pobre Gatito:** la pose de las patas en los cachetes se parece a El Gritito (otro multiverso). Lo distinguen los colores de Navidad, el suéter rojo y el fleco; su plan B son las patas sin tocar la cara.
- **Arte pesado:** Pinceles pesa en MAI, y entran 5 gatos más ahí (Napoleón, Leonardo, Perla, Newton y Mozart). `elegir.mjs` ya los trata aparte.
- **Herramienta:** `generar.py --arte` ahora es **parcial**: solo la tanda 2, y conserva las `corrections_en` hechas a mano. **No correr `--arte-todo`**, que reescribe las 114 entradas del lote y borraría esas correcciones.
