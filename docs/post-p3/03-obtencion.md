# 03 · Cómo se consiguen: la economía después de la Parte III

> ⚠️ SPOILERS. Agente DISEÑO, 2026-10-28. Las tablas las genera `fuente/generar.py` (no editarlas a mano); el texto es fijo.
> **Aprobado por el dueño el 2026-10-28** («dale con tus recomendaciones, las 4»): los números de `POST_CASINO` (§3), las **vitrinas** en las otras 7 mesas (§4), la **Copa como retos anclados a tu liga** (§5) y Merlina → «Michiércoles» sin la mano mascota.
> Lo implementa SISTEMA desde este documento. Lo que ya existe: `agentes/SISTEMA.md`, `game/src/data/postp3/reglas.ts`, `state/sys/postp3.ts`. Los números de §4 y §5 están también en `04-roster.json → postVitrinas` y `postCopa`.

## 0. En una frase

Cuando la Parte III termina («Continuará»), el Casino del Gato Negro y el Podio se llenan de gatos nuevos. Los **60 Multidimensionales, 20 Míticos y 10 Legendarios** salen de dos lugares:
- las cuatro mesas grandes (Portal, Tragamichis, La Caja y Modo Eterno);
- la **vitrina** de cada una de las otras siete mesas.

Los **8 Heroicos** los pagan los ocho retos de la **Copa Fuera de la Caja** en el Podio, que siempre se ponen a la altura de tu liga.

## 1. Reglas de la casa (se cumplen todas)

| Regla | Cómo se cumple |
|---|---|
| Sin dinero real | Todo sale de boletos, ojos de gato, fichas y oro ganados jugando. Nada se vende. |
| Sin anuncios | Ninguno. |
| Sin energía | No hay límite de tiradas, apuestas, tiros de vitrina ni intentos de la Copa. |
| Sin diarias | Nada depende del reloj ni del calendario. |
| Probabilidades visibles | Cada mesa imprime su parte, su garantía, el peso de cada gato, la probabilidad del Momento Vitrina, la tabla del Tiro de Vitrina y sus contadores. Las probabilidades de cada mesa **no cambian**: el Momento Vitrina es una tirada aparte que no toca el RTP. |
| Garantías | Mesas grandes: contador por mesa (§3). Vitrinas: un gato cada 5 tiros, un Multidimensional cada 15 y la chispa a los 25 (§4). Copa: el reto no se vence nunca y se reintenta gratis (§5). |

## 2. El candado

`postP3Unlocked()` (SISTEMA): se abre cuando viste «Continuará» (`b96_continuara`), o cuando H96 está cumplida, o cuando la historia ya pasó (H97 o una misión posterior). **Nada del lote existe antes**: no hay vitrinas, no hay Copa, la Catdex no los muestra y ninguna mesa los nombra. Ningún gato sale entre SADIE y «Continuará» (regla del duelo, `08` F-8).

## 3. Las cuatro mesas grandes (plomería de SISTEMA, ya construida)

Cuando el Portal, la Tragamichis (con fichas, líneas de GATO NEGRO), La Caja (Gato Misterioso) o el Modo Eterno sacan un gato **legendario o mítico**, una **parte** de ellos sale de la bolsa del Multiverso de esa mesa (por peso; ×3 si no lo tienes) y la **garantía** asegura uno cada tantos. Cada gato dice su mesa en `post.source`.

### 3.1 Reparto y números aprobados

| Mesa (post.source) | Gatos | MD · Mít · Leg | Parte / garantía aprobada (antes, provisional) |
|---|---|---|---|
| `casino:gacha` · Portal (todos) | 19 | 16 · 2 · 1 | **0.5 / 3** (antes 0.25 / 6) |
| `casino:gacha:michi` · Portal Michi | 16 | 10 · 4 · 2 | **0.5 / 3** (antes 0.25 / 6) |
| `casino:gacha:holo` · Multiverso Holo | 16 | 10 · 4 · 2 | **0.5 / 3** (antes 0.25 / 6) |
| `casino:slot` · Tragamichis | 24 | 15 · 6 · 3 | **0.4 / 4** (antes 0.25 / 6) |
| `casino:caja` · La Caja | 8 | 5 · 2 · 1 | **0.6 / 2** (antes 0.25 / 4) |
| `casino:eterno` · Modo Eterno | 7 | 4 · 2 · 1 | **0.75 / 2** (antes 0.5 / 2) |

`POST_CASINO` aprobado (pegar en `data/postp3/reglas.ts`):

```ts
gacha:  { share: 0.5,  pity: 3, subs: { michi: 'PORTAL MICHI', holo: 'MULTIVERSO HOLO' } },
slot:   { share: 0.4,  pity: 4 },
caja:   { share: 0.6,  pity: 2 },
eterno: { share: 0.75, pity: 2 },
```

Por qué esos números:
- **Portal:** con 0.25 / 6, un gato del lote tardaba 5–6 h en salir. Con 0.5 / 3 sale uno cada ~1.5–2 h de Portal.
- **Tragamichis:** es la mesa de más volumen, así que necesita menos parte que el Portal.
- **La Caja:** es la mesa más lenta (500 fichas, 10 % de legendario) y su bolsa es chica.
- **Modo Eterno:** se arriesga todo, y el riesgo se paga.

**Las 56 fichas de las siete vitrinas también viven en una mesa grande.** Su `post.source` es Portal Michi, Multiverso Holo, Tragamichis o La Caja. Así ningún gato queda en un callejón sin salida, y el validador de hoy los acepta.

### 3.2 Bolsas de cada mesa grande

#### `casino:gacha` — Portal (todos) (19)

| Gato | Rareza | Peso |
|---|---|---|
| Desborde | Legendario | 10 |
| Brasa Naranja | Mítico | 10 |
| Vigilia | Mítico | 10 |
| Capitán Ahabigotes | Multidimensional | 10 |
| Capitán Michimérica | Multidimensional | 10 |
| Doctor Doomiau | Multidimensional | 10 |
| Don Gatote de la Mancha | Multidimensional | 10 |
| Frankengato | Multidimensional | 10 |
| Gatogro | Multidimensional | 10 |
| Gomitas D. Michi | Multidimensional | 10 |
| Hierro Michi | Multidimensional | 10 |
| Luna Lovegata | Multidimensional | 10 |
| María Gatoñeta | Multidimensional | 10 |
| Mazingato Z | Multidimensional | 10 |
| Miautentación | Multidimensional | 10 |
| Michi-Wan ★ | Multidimensional | 4 |
| Pinomichi | Multidimensional | 10 |
| Sabrina Gatpenter | Multidimensional | 10 |
| Supermichi ★ | Multidimensional | 4 |

#### `casino:gacha:michi` — Portal Michi (16)

| Gato | Rareza | Peso |
|---|---|---|
| Catarata | Legendario | 10 |
| Ojos de Serpiente | Legendario | 10 |
| Basalto | Mítico | 10 |
| Gotera | Mítico | 10 |
| Granizo | Mítico | 10 |
| Revancha | Mítico | 10 |
| Garritas | Multidimensional | 10 |
| Gatistiano Ronaldo | Multidimensional | 10 |
| Gatojo ★ | Multidimensional | 4 |
| Kagebunyan | Multidimensional | 10 |
| Lamiau Yamal | Multidimensional | 10 |
| Miaupé | Multidimensional | 10 |
| Miaussi ★ | Multidimensional | 4 |
| Michi Atom | Multidimensional | 10 |
| Michi de Pegaso | Multidimensional | 10 |
| Un Zarpazo | Multidimensional | 10 |

#### `casino:gacha:holo` — Multiverso Holo (16)

| Gato | Rareza | Peso |
|---|---|---|
| As Bajo la Manga | Legendario | 10 |
| Bolita | Legendario | 10 |
| Comodín | Mítico | 10 |
| Mala Suerte | Mítico | 10 |
| Tinta Gris | Mítico | 10 |
| Trompo | Mítico | 10 |
| Blumiau | Multidimensional | 10 |
| Conde Gatula | Multidimensional | 10 |
| Don Gatoleone ★ | Multidimensional | 4 |
| El Michipulín Colorado | Multidimensional | 10 |
| Hermiaune | Multidimensional | 10 |
| Miaunya | Multidimensional | 10 |
| Ryumiau | Multidimensional | 10 |
| Sherlock Ronrones | Multidimensional | 10 |
| The Miauknd | Multidimensional | 10 |
| Yugi Miauto ★ | Multidimensional | 4 |

#### `casino:slot` — Tragamichis (24)

| Gato | Rareza | Peso |
|---|---|---|
| La Cantadora | Legendario | 10 |
| Pozo Mayor | Legendario | 10 |
| Uña de Oro | Legendario | 10 |
| Coro | Mítico | 10 |
| Doblaje | Mítico | 10 |
| Doblón | Mítico | 10 |
| Píxel Muerto | Mítico | 10 |
| Trébol | Mítico | 10 |
| Viñeta | Mítico | 10 |
| Condorgato | Multidimensional | 10 |
| Daft Miau ★ | Multidimensional | 4 |
| El Miauki | Multidimensional | 10 |
| El Michito del Barril ★ | Multidimensional | 4 |
| Hannah Michitana ★ | Multidimensional | 4 |
| Miaang | Multidimensional | 10 |
| Miauby-Doo | Multidimensional | 10 |
| Miaufalda | Multidimensional | 10 |
| Michi Esponja | Multidimensional | 10 |
| Michiércoles | Multidimensional | 10 |
| Party Michi | Multidimensional | 10 |
| Persa Falsa | Multidimensional | 10 |
| Rick Michez | Multidimensional | 10 |
| Romiau Santos | Multidimensional | 10 |
| Ssssmichi | Multidimensional | 10 |

#### `casino:caja` — La Caja (8)

| Gato | Rareza | Peso |
|---|---|---|
| Moño Dorado | Legendario | 10 |
| Matrioska | Mítico | 10 |
| Rendija | Mítico | 10 |
| Gemichi | Multidimensional | 10 |
| Miaunce ★ | Multidimensional | 4 |
| Michimpostor | Multidimensional | 10 |
| Mr. Miaubody | Multidimensional | 10 |
| Zoomic | Multidimensional | 10 |

#### `casino:eterno` — Modo Eterno (7)

| Gato | Rareza | Peso |
|---|---|---|
| Sin Frenos | Legendario | 10 |
| Bucle | Mítico | 10 |
| Grafito | Mítico | 10 |
| Grrrú | Multidimensional | 10 |
| Heisenmiau ★ | Multidimensional | 4 |
| Miaunion | Multidimensional | 10 |
| Post Maulone | Multidimensional | 10 |


## 4. Las vitrinas de las otras siete mesas (aprobado)

**Mesas:** Plinko, Duelo de Dados, Mayor o Menor, Bingo Exprés, Rasca y Gana, Cajas Misteriosas y Ruleta. Hoy pagan solo monedas.

**Qué cambia:** cada una tiene su **vitrina** con **8 gatos**: 1 legendario, 2 míticos y 5 Multidimensionales, uno de ellos la «estrella», con peso 4. El campo `post.vitrina` de cada gato dice cuál es la suya.

| Mesa (`post.vitrina`) | También sale de (`post.source`) | Legendario | Míticos | Multidimensionales (★ = estrella, peso 4) |
|---|---|---|---|---|
| Plinko «La Cascada» (`plinko`) | `casino:gacha:michi` | Catarata | Gotera, Granizo | Michi Atom, Miaussi ★, Gatistiano Ronaldo, Miaupé, Lamiau Yamal |
| Duelo de Dados (`dice`) | `casino:gacha:michi` | Ojos de Serpiente | Basalto, Revancha | Kagebunyan, Gatojo ★, Un Zarpazo, Michi de Pegaso, Garritas |
| Mayor o Menor (`hilo`) | `casino:gacha:holo` | As Bajo la Manga | Comodín, Tinta Gris | Miaunya, Yugi Miauto ★, Sherlock Ronrones, Blumiau, Hermiaune |
| Bingo Exprés (`bingo`) | `casino:slot` | La Cantadora | Coro, Doblaje | El Michito del Barril ★, Miaufalda, Condorgato, Romiau Santos, El Miauki |
| Rasca y Gana (`scratch`) | `casino:slot` | Uña de Oro | Trébol, Viñeta | Miauby-Doo, Ssssmichi, Hannah Michitana ★, Persa Falsa, Michiércoles |
| Cajas Misteriosas (`boxes`) | `casino:caja` | Moño Dorado | Rendija, Matrioska | Mr. Miaubody, Michimpostor, Zoomic, Gemichi, Miaunce ★ |
| Ruleta (`roulette`) | `casino:gacha:holo` | Bolita | Mala Suerte, Trompo | Ryumiau, Conde Gatula, El Michipulín Colorado, Don Gatoleone ★, The Miauknd |

### 4.1 Momento Vitrina (cuándo se gana un tiro)

- **Apuesta que cuenta:** de **25 fichas o más**, o en oro de **¼ del tope de esa mesa o más** (la tercera opción de `miniStakes`). Las apuestas más chicas se juegan igual, pero no abren la vitrina.
- **Probabilidad:** **0.6 % fija por apuesta que cuenta**. Se tira aparte (RNG criptográfico), al liquidar la apuesta (`settle`), sin importar si ganaste o perdiste: **no toca el RTP** ni las tablas de la mesa.
- **Qué cuenta como apuesta en cada mesa:**
  - una caída en el Plinko;
  - un duelo pagado en Dados;
  - una mano pagada en Mayor o Menor;
  - un cartón en el Bingo (cada cartón se paga aparte, así que cada uno tira);
  - un boleto en el Rasca;
  - un estante pagado en Cajas;
  - una tirada en la Ruleta (aunque lleve varias fichas, es una sola apuesta).
- **No corre en el MODO ETERNO** (ahí la velocidad lo volvería una llave de agua). Con el auto de ×1/×10/×20 sí corre: lo que limita son las fichas, que salen de jugar.
- **En pantalla:** «¡SE ABRIÓ LA VITRINA!», con lo dorado de cada mesa: la croqueta dorada del Plinko, el dado dorado de Don Cubilete, la carta dorada, la bolita dorada, la casilla dorada del Rasca, la décima caja dorada y el bolsillo dorado de la Ruleta. El tiro se resuelve y se guarda **antes** de la animación, como todo premio del casino.

### 4.2 Tiro de Vitrina (qué da)

| Resultado | Probabilidad |
|---|---|
| Consuelo: 5 orbes de un gato de esa vitrina que ya tengas (por peso), o 40 fichas si no tienes ninguno | 60 % |
| Su legendario | 14 % |
| Uno de sus 2 míticos (por peso) | 11 % |
| Uno de sus 5 Multidimensionales (por peso; la estrella pesa 4, los demás 10) | 15 % |

- **No repite:** solo salen gatos de esa vitrina que **no tienes**.
  - Si la rareza que salió ya está completa, baja a la siguiente que te falte, en este orden: Multidimensional → mítico → legendario.
  - Con la vitrina completa, todo tiro es consuelo con orbes ×3 (15 orbes).
- **Garantías por vitrina** (contadores en `casino.pity`, sin campo nuevo):
  - `post:vit:<mesa>:c`: si van **5 tiros** sin gato, el siguiente es un gato.
  - `post:vit:<mesa>:md`: si van **15 tiros** sin Multidimensional, el siguiente es uno.
  - `post:vit:<mesa>:s` (la **chispa**): a los **25 tiros** en esa vitrina puedes **elegir** cualquier gato que te falte de ella, y el contador vuelve a 0.
  - Las tres se imprimen con su cuenta («faltan 3»).
- **Sellos:** cada vez que LA CASA TE DEBE paga (cada 15 apuestas perdidas), da además **1 Sello** (contador `post:sellos`). Con **5 Sellos** tienes **1 Tiro** en la vitrina que elijas. Es la forma de apuntarle a la mesa que quieras.
- **Ritmo esperado:**
  - ~1 tiro por cada 100 apuestas que cuentan, sumando Sellos;
  - 12–20 tiros por hora de casino activo;
  - ~20 tiros por vitrina, así que las siete se completan en ~8–13 h de mesas, más lo que llega por las mesas grandes.

### 4.3 Para SISTEMA

- `PostGame` crece con `plinko | dice | hilo | bingo | scratch | boxes | roulette`.
  - La bolsa de una vitrina se arma con `post.vitrina === <mesa>`.
  - `post.source` sigue siendo su camino por la mesa grande: el gato vive en los dos.
- Los números están en `04-roster.json → postVitrinas`.
- La tabla de cada mesa (`panels/casino/games/odds.ts` y `postOdds.ts`) agrega una pestaña **VITRINA** con:
  - la probabilidad del Momento Vitrina;
  - la tabla del Tiro;
  - los 8 gatos, cada uno marcado con ✓ si lo tienes;
  - los tres contadores y los Sellos.
- El canje de Sellos va en esa misma pestaña.

## 5. La Copa Fuera de la Caja: retos anclados a tu liga (aprobado)

Cada caja de la Parte III, y tres de paso, manda a su campeón. La Copa es **una fila aparte en el lobby del Podio**: no ocupa ligas del escalafón, así que nadie tiene que llegar a la liga 16 para verla.

### 5.1 Los retos

| Reto | id (`podio:<id>`) | Multiplicador | Entrenador (lobby) | Su línea | Paga | Caja |
|---|---|---|---|---|---|---|
| 1 | `copa_borracha` | ×1.10 | LA INVICTA DE LA BARRA | «Codo en la mesa, gatito. El que suelta primero paga la ronda… de leche.» | La Vencidas (`hp_vencidas`) | Borracha |
| 2 | `copa_superheroes` | ×1.15 | LA LIGA DE LOS AYUDANTES | «Todos fuimos el que esperaba en el coche. Hoy manejamos nosotros.» | Kid Capa (`hp_kidcapa`) | Superhéroes |
| 3 | `copa_anime` | ×1.20 | LA SENSEI DEL TORNEO | «Inclínate. Luego, si puedes, levántate.» | Shinai (`hp_shinai`) | Anime |
| 4 | `copa_libros` | ×1.25 | LA GUARDIANA DE LA ÚLTIMA PÁGINA | «En mi biblioteca nadie se brinca al final.» | Dama Pergamino (`hp_pergamino`) | Libros |
| 5 | `copa_pop` | ×1.30 | LA DJ CAMPEONA | «Si no bailas, pierdes. Si bailas mal, también.» | B-Girl Bigotes (`hp_bgirl`) | POP |
| 6 | `copa_pinceles` | ×1.35 | EL CURADOR DEL MUSEO | «No toque las obras. Las obras sí lo van a tocar a usted.» | La Retiaria (`hp_retiaria`) | Pinceles (de paso) |
| 7 | `copa_pantalla` | ×1.40 | EL DIRECTOR DE MATINÉ | «¡Acción! …y que alguien traiga a la momia.» | Máscara de Oro (`hp_mascaradeoro`) | Pantalla (de paso) |
| 8 | `copa_pixel` | ×1.45 | EL CAMPEÓN DE LAS FICHAS | «Una ficha, una vida. Yo traigo noventa y nueve.» | Combo Infinito (`hp_combo`) | Píxel (de paso) |

### 5.2 Cómo funciona

- **Orden:** los retos van **en secuencia**. Se ve el siguiente sin ganar; los otros se ven sellados, con su caja y la silueta de su Heroico.
- **Poder del campeón**, calculado con tu liga frontera **del momento** (`ps().league`), nunca por debajo de la 8:
  `poder = poder del campeón de esa liga (bout 4, con champion_mult) × multiplicador del reto`.
  - El multiplicador es 1.10 en el primer reto y sube 0.05 por reto, hasta 1.45 en el octavo.
  - Siempre es un poco más difícil que tu liga y siempre es alcanzable. Si subes de liga, el reto sube contigo: no se puede esperar a que sea fácil.
- **Su gato:** cada campeón pelea **con** el Heroico que paga (como hoy: «beat Zarpa to win Zarpa»), con las estrellas y el nivel que `rival()` le daría en esa liga.
- **Paga una sola vez**, con la bandera `postchamp_<id>`:
  - la primera victoria da el Heroico, más `orbs_champion`, `champion_gems` y la XP de primera victoria;
  - después, el reto se puede repetir con la recompensa de revancha de esa liga (`rewards.replay_mult`), sin el gato.
- **Perder no cuesta nada:** sin energía y sin espera; se reintenta cuando quieras.
- **Requisitos:** que `podioUnlocked()` y `postP3Unlocked()` estén abiertos.

### 5.3 Para SISTEMA

`POST_CHAMPIONS` deja de usar `league` y pasa a ser la lista ordenada de retos:

```ts
export interface PostChampion { id: string; order: number; mult: number; trainer?: string }
export const POST_CHAMPIONS: PostChampion[] = [
  { id: 'copa_borracha', order: 1, mult: 1.10, trainer: 'LA INVICTA DE LA BARRA' },
  { id: 'copa_superheroes', order: 2, mult: 1.15, trainer: 'LA LIGA DE LOS AYUDANTES' },
  { id: 'copa_anime', order: 3, mult: 1.20, trainer: 'LA SENSEI DEL TORNEO' },
  { id: 'copa_libros', order: 4, mult: 1.25, trainer: 'LA GUARDIANA DE LA ÚLTIMA PÁGINA' },
  { id: 'copa_pop', order: 5, mult: 1.30, trainer: 'LA DJ CAMPEONA' },
  { id: 'copa_pinceles', order: 6, mult: 1.35, trainer: 'EL CURADOR DEL MUSEO' },
  { id: 'copa_pantalla', order: 7, mult: 1.40, trainer: 'EL DIRECTOR DE MATINÉ' },
  { id: 'copa_pixel', order: 8, mult: 1.45, trainer: 'EL CAMPEÓN DE LAS FICHAS' },
];
```

Los parámetros (`anchor`, `minAnchorLeague`, `bout`, `multBase`, `multStep`) están en `04-roster.json → postCopa`. Las líneas del lobby están en `postChampions[].line`.

## 6. Sets del Catdex

Las reglas marcadas **«Propuesta»** son balance y el dueño las decide al probar. Las demás son «Colección», como Puerto Cometa. Ya están en `04-roster.json → catdexSets`, con el formato de `content.json`.

| Set | Gatos | Regla |
|---|---|---|
| **Sábado de Anime** (`set_pp_shonen`) | Gomitas D. Michi, Kagebunyan, Gatojo, Un Zarpazo, Michi de Pegaso, Michi Atom, Mazingato Z, Ryumiau, Miaunya, Yugi Miauto | Propuesta: tus Multidimensionales de anime empiezan cada batalla con 25 de barra. |
| **Clásicos de Biblioteca** (`set_pp_biblioteca`) | Don Gatote de la Mancha, Sherlock Ronrones, Frankengato, Conde Gatula, Capitán Ahabigotes, Pinomichi | Colección: los seis clásicos de dominio público. |
| **Los Tres del Colegio** (`set_pp_colegio`) | Harry Gatter, Hermiaune, Luna Lovegata | Propuesta: con los tres en la tripulación, sus poderes empiezan con 20 de barra. |
| **Puro Corazón Latino** (`set_pp_latino`) | El Michipulín Colorado, El Michito del Barril, Miaufalda, Condorgato | Colección: la tele, la tira y la historieta de la tarde. |
| **Tarde de Caricaturas** (`set_pp_tarde`) | Michi Esponja, Rick Michez, Miaang, Miauby-Doo, Blumiau, Mr. Miaubody | Colección: la barra de caricaturas completa. |
| **Función de Estreno** (`set_pp_estreno`) | Gatogro, Grrrú, Miaunion, Mr. Miaubody | Colección: las películas animadas. |
| **Villanos con Plan** (`set_pp_villanos`) | Grrrú, Miaunion, Doctor Doomiau, Heisenmiau, Don Gatoleone | Colección: todos tienen un plan. Ninguno funciona. |
| **Liga de Capas** (`set_pp_liga`) | Supermichi, Hierro Michi, Capitán Michimérica, Garritas, Murciégato, Gato Araña | Propuesta: tus superhéroes empiezan cada batalla con 1 escudo. |
| **Fichas de Consola** (`set_pp_consola`) | Ssssmichi, Michimpostor, Zoomic, Comecroquetas | Colección: los de la maquinita. |
| **Maratón de Series** (`set_pp_series`) | Hannah Michitana, Miaunce, Heisenmiau, Michiércoles | Colección: un capítulo más y ya. |
| **Función de Medianoche** (`set_pp_cine`) | Gemichi, Persa Falsa, Michi-Wan, Don Gatoleone | Colección: palomitas no incluidas. |
| **Cartel del Festival** (`set_pp_festival`) | Romiau Santos, El Miauki, Post Maulone, Miautentación, Sabrina Gatpenter, Daft Miau, Party Michi, The Miauknd | Colección: el cartel completo (propuesta cosmética: la Tragamichis estrena luces de festival). |
| **Selección Michi** (`set_pp_seleccion`) | Miaussi, Gatistiano Ronaldo, Miaupé, Lamiau Yamal | Propuesta: en el Podio, tus seleccionados pegan +10 %. |
| **La Casa Siempre Gana** (`set_pp_casa`) | Pozo Mayor, Bolita, Catarata, Ojos de Serpiente, As Bajo la Manga, La Cantadora, Uña de Oro, Moño Dorado, Desborde, Sin Frenos | Propuesta: el medidor de LA CASA TE DEBE se llena un 10 % más rápido (se imprime en Reglas de la casa). |
| **Amuletos de la Mesa** (`set_pp_amuletos`) | Trébol, Mala Suerte, Comodín, Doblón | Colección: la buena, la mala y la que quema. |
| **Lo que Quedó Después** (`set_pp_despues`) | Brasa Naranja, Vigilia, Tinta Gris, Grafito | Colección. |
| **Copa Fuera de la Caja** (`set_pp_copa`) | La Vencidas, Kid Capa, Shinai, Dama Pergamino, B-Girl Bigotes, La Retiaria, Máscara de Oro, Combo Infinito | Propuesta: en el Podio, tus gatos empiezan cada duelo con 25 de barra. |

## 7. Requiere sistema nuevo (sigue abierto)

Lo aprobado ya está arriba, en §3–5. Queda abierto:
1. **Un estandarte propio en el Portal, «MULTIVERSO DESBORDADO»** (`casino:gacha:desborde`).
   - Tabla: común 50 %, raro 30 %, épico 13 %, legendario 4.5 %, mítico 1 % y **MULTIDIMENSIONAL 1.5 %**.
   - Garantías: Multidimensional seguro a los 70 tiros y mítico seguro a los 140.
   - El destacado cambia con tu progreso (el siguiente Multidimensional que te falta), nunca con la fecha.
   - Los 19 gatos de `casino:gacha` pasarían ahí.
2. **Combos de pareja** (`post.pair`).
   - Grrrú + Miaunion: el rayo congela a dos y los plátanos congelan.
   - Heisenmiau + Pinkmiau, si entra la reserva: la nube pega doble.
   - Los Tres del Colegio.
   - Los números están en cada ficha (`01-roster`).
3. **Las seis reglas «Propuesta» de §6.**

## 8. Qué medir cuando el dueño juegue

1. Minutos hasta el primer gato del lote, en las mesas grandes y en las vitrinas. Meta: menos de 30 min de casino activo.
2. Horas hasta completar todo el casino. Meta: 25–40 h.
3. Que ningún tramo de más de ~1 h de casino pase sin un gato del lote o sin un tiro garantizado a la vista.
4. Que cada reto de la Copa se gane en 1–5 intentos con el mejor gato del jugador.
