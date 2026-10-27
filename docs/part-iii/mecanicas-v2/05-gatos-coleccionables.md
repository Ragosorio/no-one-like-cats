# 05 · Los gatos de las cajas como coleccionables (implementado)

> Agente **GATOS-DATOS**, 2026-10-27. ⚠️ Spoilers de la Parte III.
> Implementa `02-loop.md` §4 (fuentes) y §7.4 (Multidimensionales). Los nombres, multiversos y rarezas vienen de `../arte-v2/02-catalogo-v2.md`; los slugs, de `../agentes/ARTE-INTEG.md`.

## 0. En una frase

35 gatos nuevos ya son coleccionables. Llegan por la historia, por las élites, por rescates, por actividades o después del final. **Nunca** salen del Portal, el Casino, la Resonancia, la tienda de gatos ni el Podio.

## 1. Dónde vive cada cosa

| Pieza | Archivo |
|---|---|
| Fichas de los 35 gatos (con su fuente en `p3` y su caja en `origin`) | `game/src/data/gateras/especies.json` (se fusiona al final de `CATS` en `data/content.ts`) |
| El motor de fuentes, los orbes y la puesta al día | `game/src/state/sys/p3cats.ts` |
| Cuándo suena la revelación | `game/src/ui/story/p3CatsScript.ts` (lo lee `app/story.ts`) |
| La revelación | `game/src/app/p3CatsFlow.ts` (`fx/sequences/catReveal.ts`) |
| Exclusiones de los pozos | `game/src/state/sys/multidim.ts` (`isP3Cat`, `poolableCat`): `resonance.ts`, `casino.ts` (Casino y Portal), `shop.ts`, `podio/ladder.ts`, `campaign.ts` |
| La Tienda de la Caja (Maneki) | `game/src/panels/TiendaCaja.ts`; botón MANEKI en la Carta (`scenes/GaterasMapScene.ts`) |
| La impresión MULTIDIMENSIONAL | `game/src/panels/collection/printTextures.ts` |
| Pruebas | `game/tests/p3Cats.test.ts` |

## 2. Las fuentes

| Fuente | Qué pasa | Cuándo se revisa |
|---|---|---|
| **historia** | Se completa su misión: el gato entero, una vez | Al completarse la misión y al cargar la partida |
| **etapa** | Primera victoria de un nodo marcado (el capitán de una élite o una etapa que pide la historia) | Al ganar; al cargar, si el nodo ya estaba ganado |
| **rescate** | Una victoria del nodo **mientras** se cumple su requisito (`after`). La tarjeta del nodo dice «RESCATE: …» y el Catdex lo muestra como RUMOR | Al ganar |
| **actividad** | Orbes del gato por cada batalla de la actividad (5, los `mission_orbs` de `balance.json`); el gato llega al completar la actividad | Orbes al ganar cada batalla; el gato al completarse |
| **recordar** | Después de H97 (el post-juego): una victoria de un nodo, o cualquier victoria de la Carta (Maneki) | Al ganar |
| **repetir** | Una victoria repetida de un nodo de una caja da orbes de un Multidimensional de esa caja que **ya tengas**: 35 % de las veces, 3 orbes (`victory_drop_chance` y `victory_drop_amount` de `balance.json`). Sembrado con la partida, el nodo y el número de victoria | Al ganar |
| **Tienda de la Caja** | Maneki vende orbes (nunca el gato) de los gatos de las cajas que ya tienes, al precio de los paquetes de orbes de la tienda (`shop.ts`: minutos de ingreso, con «calor» por especie) | Siempre |

**Estado guardado:** un flag por gato (`p3cat_<id>`). El gato se adopta en ese momento como cualquier descubrimiento (gemas, ronroneo y XP, igual que los gatos de historia de la Parte II). No hay campo nuevo ni migración. La revelación es solo presentación: la pone el director en la Carta, cuando hay calma, antes de la siguiente tarjeta. Un gato de historia espera el CAMBIÓ de su misión.

**Puesta al día:** lo que es un hecho de la partida se vuelve a revisar al cargar y al completar una misión: una misión hecha, una actividad completa o una élite ya ganada. Así una actualización llega a una partida que ya pasó por ahí. Un rescate necesita su victoria. Una partida sin Parte III no recibe nada.

## 3. La tabla: gato → dónde → cómo

★ = camino principal (no se puede saltar). ○ = opcional.

| Gato | Rareza | Caja | Dónde | Cómo |
|---|---|---|---|---|
| Oficial Dona | Raro | Borracha | ★ B-5 (H69) | Etapa: capitana de la élite, se queda contigo |
| Homiau Gatson | **Multidimensional** | Borracha | ★ B-6 con H72 hecha | Rescate («El vecino de la dona»). Si B-6 ya estaba ganada, llega al terminar H72 |
| Hipólito | Raro | Borracha | ★ H73 «La Batalla de Gatos» | Historia |
| Doña Espuma | Épico | Borracha | ○ La Ronda | Actividad: 5 orbes por local; llega al cerrar la primera ronda |
| Doctor Ovillo | Épico | Superhéroes | ★ S-5 (H75) | Etapa: capitán de la élite |
| Gato Araña | **Multidimensional** | Superhéroes | ★ H76 «Villanos sueltos» | Historia |
| J. J. Gatemson | Raro | Superhéroes | ★ S-8, la torre de El Clarín | Etapa |
| Murciégato | **Multidimensional** | Superhéroes | ★ H77 «Cruceta» (presenta la rareza) | Historia |
| Gato Araña Noir | Raro | Superhéroes | ○ S-6 después de H77 | Rescate («Variantes») |
| Gata Araña | Raro | Superhéroes | ○ S-4 después de H77 | Rescate («Variantes») |
| Gato Araña 2099 | Raro | Superhéroes | ○ S-7 después de H77 | Rescate («Variantes») |
| El Estambre | Épico | Superhéroes | ○ su encuentro, después de H77 | Rescate (se volvió a escapar) |
| Príncipe Bigotón | Legendario | Anime | ★ A-5 (H79) | Etapa: capitán de la élite |
| Super Siamés | **Multidimensional** | Anime | ★ H80 «Entrenamiento» | Actividad: 5 orbes por arco; llega al terminar los tres |
| Harry Gatter | **Multidimensional** | Libros | ★ L-1, El colegio (H83) | Etapa |
| La Encuadernadora | Épico | Libros | ★ L-5 (H83) | Etapa: capitana de la élite |
| Garbancito | Raro | Libros | ★ H84 «Finales perdidos» | Actividad: 5 orbes por cuento; llega al devolver los tres |
| Sir Simón de Gatterville | Épico | Libros | ★ L-8, La azotea | Etapa: capitán de la etapa |
| Sonrisa | Épico | Libros | ○ L-3 después de H84 | Rescate (secreto de la «Sección prohibida») |
| Bocina | Raro | POP | ★ P-2, Telonero | Etapa |
| El Mánager | Épico | POP | ★ P-5 (H89) | Etapa: capitán de la élite |
| EMIAU | Legendario | POP | ★ H89 «Backstage» | Historia (telonero) |
| Gato Malo | **Multidimensional** | POP | ★ P-6 | Etapa («se une al terminar P-6») |
| Tailor Swift | **Multidimensional** | POP | ★ P-8 | Etapa |
| Billie Bigotish | **Multidimensional** | POP | ○ P-4 después de H90 | Actividad + rescate: 5 orbes por cada fecha de H90; el gato, en la fila de autógrafos («La fila») |
| Scratch | Raro | POP | ○ P-1 después de H89 | Rescate |
| El Cadenero | Épico | Borracha | ○ B-9 después de H97 | Recordar (el jefe, en el post-juego) |
| Borrón | Mítico | Borracha | ○ B-2 después de H97 | Recordar. Su ficha aparece como RUMOR al terminar H70 |
| El Gritito | Común | Pinceles (de paso) | ○ B-7 después de H97 | Recordar |
| Gatzilla | Legendario | Pantalla (de paso) | ○ S-3 después de H97 | Recordar |
| Comecroquetas | Épico | Píxel (de paso) | ○ A-1 después de H97 | Recordar |
| El Lobo | Épico | Libros | ○ L-2 después de H97 | Recordar («alguien le escribió otra página») |
| La Gatoconda | Épico | Pinceles (de paso) | ○ L-4 después de H97 | Recordar |
| Vincent van Gato | **Multidimensional** | Pinceles (de paso) | ○ P-7 después de H97 | Recordar |
| Maneki, la conserje | Épico | Mitos | ○ cualquier victoria de la Carta después de H97 | Recordar |

**Ritmo** (con los tiempos de `../historia-v2/02-mapa.md`):
- **Camino principal:** 18 gatos en ~10 h de los Actos I–IV, uno cada ~34 min.
  - Acto I: 3. Acto II: 6. Acto III: 4. Acto IV: 5.
- **Con los opcionales del camino:** 28 gatos (con Doña Espuma, El Estambre, las 3 variantes, Sonrisa, Billie y Scratch, más ~40 min de batallas cortas), uno cada ~25 min.
- El hueco más largo del camino principal es H85–H87 (el corazón del Acto III), unos 80 min. Ahí cae Sonrisa (opcional).
- **Nada pide farmear:**
  - Los opcionales piden una sola victoria.
  - Los orbes de repetir son extra.
  - El post-juego tiene 9 gatos (ninguno entre SADIE y «Continuará»).

## 4. Decisiones (donde el diseño dejaba elegir)

1. **Rarezas de los «Personaje».** El catálogo no les da rareza a los personajes, y un coleccionable la necesita:
   - Doña Espuma, El Lobo, La Encuadernadora, El Mánager y Maneki: **Épico**.
   - Borrón: **Mítico** (los Titiriteros).
   - J. J. Gatemson: **Raro**.
   - Comecroquetas: **Épico** (como dice el catálogo, aunque el piloto se generó como Común). Príncipe Bigotón: **Legendario**.
2. **Multidimensionales:** se encendieron los **9 que tienen arte**: Homiau, Murciégato, Gato Araña, Super Siamés, Harry Gatter, Gato Malo, Tailor Swift, Billie Bigotish y Vincent van Gato.
   - Michi-Wan, Lince, Bastet y El Michito del Barril quedan dormidos: sin especie hasta que tengan arte.
   - Las **reglas de origen**, el **Cruce** y la **Ventaja de casa** (`02` §7.2) **no** se implementaron: piden la prueba de parejas de `02` §7.3, que mueve el balance (el dueño lo prueba él mismo).
   - Hoy un Multidimensional es una rareza con su categoría, su impresión, sus números de `balance.json` (poder base 6.9) y su fuente.
3. **El capitán de la élite es coleccionable** (`02` §4, §5.2): Oficial Dona, Doctor Ovillo, Príncipe Bigotón, La Encuadernadora y El Mánager se quedan al ganarles la primera vez.
4. **Los jefes van al post-juego** (`02` §4: «el jefe en el post-juego»):
   - El Cadenero y Borrón.
   - El Lobo («La Mano le escribe FIN» en H84: no puede unirse antes).
   - Los gatos de las cajas de paso: Pinceles, Pantalla, Píxel y Mitos.
   - Se usan etapas que ya existen, con requisito H97, en lugar de abrir nodos nuevos.
5. **Las cadenas laterales** («Variantes», «Sección prohibida», «La fila», `../historia-v2/02-mapa.md` §8.1) son **rescates en etapas que ya existen**, con su requisito de historia. No se agregaron nodos a la Carta.
6. **Bocina y Scratch no entran al plantel de H73.** Con EMIAU serían 3 gatos de Sonido, y `02` §6.4 lo prohíbe. EMIAU pelea con Scratch, que toma el lugar de Tamborín (2 de Sonido, como antes de medir).
7. **J. J. Gatemson no es el capitán de S-8.** Ponerlo bajaba la etapa de 83 %/75 % a 100 %/100 %. Se une al ganar en su torre.
8. **Nada del final paga:** ninguna fuente usa H93–H96. Las de «recordar» piden H97 hecha (`tests/p3Cats.test.ts` lo revisa).

## 5. Planteles: los suplentes que ahora son el gato propio

Medido con `autoBattle` (el de la estimación) en h65-normal, en el Bastión. Formato: antes → después, `h65` / `raros40`, con 24 peleas por celda (48 en EMIAU, El Estambre y B-9).

| Nodo | Suplente → gato propio | `h65` | `raros40` |
|---|---|---|---|
| B-5 | Terrón → Oficial Dona | 83 → 83 % | 54 → 67 % |
| B-9 | Bastión → El Cadenero | 71 → 81 % | 44 → 40 % |
| EMIAU (H73) | Caos + Tamborín → EMIAU + Scratch | 83 → 94 % | 69 → 69 % |
| S-5 | Rencor → Doctor Ovillo | 92 → 79 % | 63 → 67 % |
| El Estambre (H76) | Origami → El Estambre | 88 → 94 % | 92 → 92 % |
| A-5 | Ignis → Príncipe Bigotón | 63 → 71 % | 58 → 46 % |
| L-5 | Archivista → La Encuadernadora | 79 → 75 % | 46 → 50 % |
| L-8 | Kage → Sir Simón | 83 → 75 % | 88 → 92 % |
| P-5 | Péndulo → El Mánager | 96 → 92 % | 42 → 58 % |

Todas quedan dentro del ruido de una celda de 24 peleas (±10 puntos). No se tocó ningún multiplicador.

## 6. Lo que se ve en pantalla

- **La tarjeta del nodo** dice qué gato da, con pocos spoilers:
  - «SI LE GANAS, OFICIAL DONA SE QUEDA CONTIGO» (el capitán);
  - «BOTÍN: ¡UN GATO NUEVO!» (una etapa marcada: no dice quién);
  - «RESCATE: GATO ARAÑA NOIR»;
  - «+5 ORBES DE DOÑA ESPUMA POR LOCAL»;
  - «REPETIR: 35 % DE ORBES DE HOMIAU GATSON».
- **El sello de victoria** pone «¡… SE UNE!» como **primera** línea (el sello muestra 3). Un rescate en una victoria repetida también lleva sello. Los orbes van al final; en una victoria repetida sin gato salen en el aviso.
- **La revelación** es la de los gatos de historia, con su encabezado: SE QUEDA CONTIGO, SE UNE A TU TRIPULACIÓN, RESCATE, ACTIVIDAD COMPLETA o DESPUÉS DE TODO.
- **El Catdex:**
  - Un gato de las cajas es carta sellada, nunca silueta. Al pedirle detalle dice «FUERA DE LA CAJA».
  - Como RUMOR dice «CÓMO SE CONSIGUE» en lugar de «POSIBLES PADRES».
  - Solo aparece cuando empezó la Parte III; antes, el total y los números son los de siempre.
  - Chip MULTIDIMENSIONAL al final del filtro.
- **La Carta:** botón MANEKI (Tienda de la Caja), arriba de las huellas, cuando ya tienes un gato de las cajas.

**Hallazgo en la prueba sin pantalla (no es de este agente):** la Carta solo dibuja los nodos de la Borracha.
- **Qué pasa:**
  - Superhéroes, Anime, Libros y POP no tienen `screen` en `regiones.json`, y `cartaModel.openBoxes()` pide `stages`, que las cajas de forma llave, estante y gira no tienen.
  - Por eso esas cajas se ven en blanco («aquí no he llegado») aunque estén abiertas, y no hay nodo que tocar.
  - Las pruebas de QA arrancan esas batallas desde código (`startGateraBattle`).
- **Por qué importa:**
  - Para jugar de verdad hace falta dibujarlas: lo pide la historia (Actos II–IV) y lo piden los rescates y los «recordar» de esas cajas.
  - La lógica de los gatos ya funciona con la batalla arrancada desde código (probado: el rescate de Gato Araña Noir en S-6).

## 7. Lo que queda dormido

- Las reglas de origen, el Cruce y la Ventaja de casa de los Multidimensionales (§4.2).
- Los 4 huecos Multidimensionales sin arte.
- Don Bombín, el rescate del desvío «Trastienda»: no tiene arte, y la tarjeta sigue diciendo «cuando llegue su pintura».
- Las ultis con firma (`battle/ults.ts`) de los legendarios, el mítico y los Multidimensionales: usan `ultFromDef`, como cualquier gato sin firma.
- Los sets del Catdex de las cajas (por ejemplo, «El verso arácnido»): un set promete una regla de combate, y eso es balance.
- La actividad «Patrulla» de Superhéroes no existe; esa caja no tiene gato de actividad.
- Los rigs los hace ARTE-INTEG. Un gato sin rig se dibuja con su pintura quieta (`art/catArt.ts artSlug`), como siempre.
