# PODERES-2 · los poderes de los 60 Multidimensionales post (2026-10-28)

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo: el poder propio (mecánica + puesta en escena + texto) de cada uno de los 60 Multidimensionales post, como los 25 de la Parte III. Solo despierta en tu tripulación (lado 0), es determinista, tiene tope de estructura de 45 % (18 % contra jefes) y se usa una vez por batalla (dos a ★5).

## Qué estoy haciendo
Nada: cerrado por PODERES-2b (ver «Cierre (PODERES-2b)» al final). Falta que el dueño responda las preguntas de balance.

## Hecho
- **Textos:** `game/src/data/multidimPowersPost.ts` trae 60 poderes, con el color y la etiqueta de cada universo para el sello.
  - Salen del roster con `scratchpad/poderes2/gen_data.py`; se recortaron 21 cortos que pasaban de 60 caracteres.
  - `multidimPowers.ts` los fusiona en una línea.
- **Simulación:** `game/src/battle/multidimPost/`.
  - `kit.ts`: estado por batalla (WeakMap), relojes y ayudantes.
  - `powersA.ts`, `powersB.ts` y `powersC.ts`: los 60, de 20 en 20, en el orden del roster.
  - `hooks.ts`: las reglas que quedan en el campo durante un tiro. Es la única puerta que importa `multidim.ts`: reexporta lo de `turn.ts` y `hud.ts`.
  - `turn.ts`: los relojes y los golpes que caen al empezar un turno (`mdpStartTurn`).
  - `hud.ts`: la IA (`mdpWorth`) y las fichas del HUD (`mdpChips`). Solo lee el estado, nunca lo crea.
  - Entran a `MD_ULTS` por `postUlts()`, que es una función para que no se rompa el ciclo de imports.
- **Ganchos chicos:**
  - En `multidim.ts`, los post se reenvían desde mdShot, mdCellMul, mdDodge, mdCatMul, mdAfterHit, mdAfterFire, mdStartTurn, mdWorth (default), mdChips y mdFeats.
  - En `sim.ts`: mdFire, mdAltPaths y mdAfterShot en `fire`; mdImpact en `resolveImpact`; mdHitAdjust en `hitCat`; mdAbsorb en `cap`; mdBench en `shooters` y `cannons`; mdMeterMul en `meterMul`.
  - Sin un poder post en la pelea, ningún gancho hace nada: ni siquiera se crea el estado.
- **Escena:** `game/src/battle/fx/multidimPostFx.ts` (sello propio de los 60 y los golpes `mdp*`) y 4 trozos en `multidimFx.ts`.
  - Los dúos traen a su compañero: el casco dorado de Daft Miau y el afro de Party Michi.
  - El combo Grrrú + Miaunion se ve en el rayo y en los plátanos.
- **Pruebas:** `game/tests/multidimPost.test.ts` (129 casos).
  - Datos y texto.
  - Una revisión por gato de que hace lo que dice.
  - Lado rival idéntico con poderes on/off, determinismo y la IA usándolos.
  - Tope de jefe y topes de los golpes diferidos.
  - ★5 y fichas.
  - Sin poder post no se crea estado.
  - Inyecta las fichas del roster que aún no sincroniza SISTEMA.
- **PENDING de `multidimPowers.test.ts`:** vacío. Los 17 que ya sincronizó SISTEMA tienen poder.
  - Esa prueba ahora acepta poderes registrados antes que su especie: solo revisa los que ya están en `especies.json`.
- **Regresión A/B contra HEAD:** jefe H63 «El Umbral», 3 tripulaciones (historia, leyenda y una de Multidimensionales de la Parte III) × 5 semillas. Dan 310 líneas de bitácora idénticas.

## Los 60 (P = fuerza de la ulti)
| Gato | Poder | Qué hace en batalla |
|---|---|---|
| Gomitas D. Michi | CATLING GUN! | 12 × 0.12·P en abanico por su cubierta (Mojado). Tu tripulación queda DE HULE sus 2 turnos: rayos, rocas y ondas rebotan sin daño ni estados. |
| Kagebunyan | NYAN CLONE PARADE! | 3 clones en tus camarotes (los gatos más fuertes primero). Cada uno se traga entero el siguiente golpe a su camarote y revienta de vuelta: 0.5·P a la celda suya más cercana al tirador. Duran 3 turnos suyos. |
| Gatojo | THE MIAURLD! | Su lado pierde su siguiente turno (gatos y andanada). Tus tiros de este turno y del siguiente se quedan en el aire y caen todos juntos ×1.3 (jefe ×1.15) al empezar su turno siguiente. |
| Un Zarpazo | SERIOUS PAW! | El módulo apuntado desaparece entero (se respeta el tope). Al núcleo le quita la mitad de lo que le queda. Él no actúa su siguiente turno. |
| Michi de Pegaso | PEGASUS MEOWTEOR! | 20 × 0.06·P repartidos, × (1 + 1.5 × vida perdida de tu tripulación), hasta ×2.5. |
| Michi Atom | INFINITE PITCH SHOT! | El balón cae al empezar tu 2.º turno siguiente: 3·P con el doble del radio de su tiro, en el módulo apuntado (o el más cercano). Su gato queda Expuesto (×1.5) 2 turnos. |
| Mazingato Z | ROCKET PAWNCH! | 2 puños de 0.45·P y un rayo de pecho de 0.4·P al núcleo (Ardiendo). ALEACIÓN 3 turnos suyos: ningún golpe le quita a un gato tuyo más del 20 % de su vida máxima. |
| Ryumiau | NOTE OF NINE LIVES! | Anota a su gato con más vida. Al empezar tu 3.er turno siguiente, cae (ignora escudos y vidas extra); un capitán jefe pierde 40 %. Si cae antes, la libreta pasa al siguiente. |
| Miaunya | TELEPATHY PEANUTS! | 2 turnos suyos: tus gatos esquivan sus tiros de gato. Los cañones y las ultis sí pegan, y la estructura recibe igual. |
| Yugi Miauto | FORBIDDEN FIVE! | +1 pieza por tiro suyo que daña su barco (máx. 5). La ulti pega 1·P × (1 + 0.4·piezas). Con 5, además 0.35·P a cada módulo vivo. |
| Don Gatote | CHARGE OF THE WINDMILLS! | Carga por toda la fila apuntada: 0.25·P por celda, ×2 si su barco está más entero que el tuyo. Si hay mástil o motor en la fila, «¡GIGANTE!»: pierde su siguiente turno. |
| Sherlock Ronrones | THE GAME IS AFOOT! | Marca sus 3 puntos más débiles (núcleo, camarote con gato o cañón): crítico ×1.5 hasta que les peguen. Tu andanada de ese turno va directo a ellos. |
| Frankengato | SPARK OF NINE LIVES! | Revive a tu caído más fuerte con 50 % de vida y la barra llena, en su camarote o en el libre más cercano. Si nadie cayó: cadena de 5 × 0.3·P (Cargado). |
| Conde Gatula | CHILDREN OF THE NIGHT! | 0.35·P directo a cada gato suyo. Lo que les quita cura a tu tripulación (al más herido primero); lo que sobra se vuelve escudos (1 por cada 20 % de vida, máx. 3 por gato). |
| Capitán Ahabigotes | THE WHITE FISH! | Arponea su módulo más grande (nunca el núcleo). Al empezar sus 3 turnos jala 10 %, 20 % y 30 % de su vida máxima, con un solo tope para los tres. Si el módulo se rompe, la cuerda salta al siguiente más grande (tampoco al núcleo). |
| Pinomichi | NOSE OF TRUTH! | La nariz crece +1 por cada turno tuyo sin usar la ulti (máx. 8). Un narizazo recto atraviesa esas celdas (0.45·P cada una, Enraizado). |
| El Michipulín Colorado | SHRINK PILL! | Su gato más fuerte queda CHIQUITO 3 turnos: pega ×0.3 y recibe ×1.3. Además Aturdido 1. Jefe: ×0.6 / ×1.15, 2 turnos. |
| El Michito del Barril | BARREL HIDEOUT! | Durante sus 2 turnos cada ulti suya se estrella en el barril (la barra se gasta). Al salir avienta 1.5·P al último que la usó (si nadie: al de más barra). |
| Miaufalda | WORLD BANDAGE! | +25 % de vida máxima a cada celda tuya no Borrada. Tu módulo destruido de más valor vuelve a funcionar con lo que quede, a la mitad. |
| Condorgato | BACKFLIP PUNCHLINE! | 3 andanadas: el último cañón de cada una pega ×3 y aturde al gato que toque (hasta Sordos). Sin cañones, el remate lo lleva tu tiro de gato. |
| Michi Esponja | I'M READY! | Tu tripulación con la barra llena (los que ya gastaron su única ulti siguen sin poder repetirla). Burbujas: 6 × 0.1·P, Mojado. |
| Rick Michez | PORTAL RUN! | El resto de este turno y tus 2 siguientes, cada tiro tuyo (gatos y cañones) sale de un portal 1 celda arriba de su mira: sin viento ni arco, y las paredes lo detienen. |
| Miaang | FOUR-ELEMENT STATE! | 4 × 0.35·P en la misma celda: Agua → Tormenta → Tierra → Fuego, cada uno con su estado (salen las reacciones que toquen). Aturde al gato de ese camarote. |
| Miauby-Doo | UNMASKED! | Les quita escudos de gato, refuerzos, pozos y su noche. Sus barreras (burbuja, escudo y capas arcanas) quedan apagadas 2 turnos suyos y luego vuelven. |
| Blumiau | THREE PAW CLUES! | 3 pistas en sus 3 mejores módulos. Un golpe tuyo en uno de ellos pega ×1.5 y la encuentra. Con la tercera: 2·P en ese módulo atravesando todo escudo. |
| Mr. Miaubody | BACK IN TIME! | Una copia de tu gato más fuerte (no se le puede pegar) dispara su tiro normal al mismo blanco después de tu gato, en tus 2 turnos siguientes (una vez por turno). |
| Gatogro | SWAMP SWEET SWAMP! | Todo Mojado y Enraizado (una vez), cañones atascados 3 turnos suyos, recarga +1 a cada gato que dispare en el pantano, y −20 de barra a cada uno. |
| Grrrú | FREEZE RAY! | Congela sólido a su gato más fuerte: 2 turnos no actúa y recibe ×1.5; su camarote queda Congelado (la siguiente roca o bala lo ESTALLA ×2). Con Miaunion en tu tripulación, también al 2.º más fuerte. Jefe: 1 turno. |
| Miaunion | BEE-DO BEE-DO! | El resto de este turno y tus 3 siguientes, cada ulti de tu tripulación trae un plátano bomba de 0.5·P (Cegado) al mismo lugar; la alarma ya avienta uno. Con Grrrú en tu tripulación, los plátanos congelan 1 turno. |
| Garritas | BERSERKER CLAWS! | 6 tajos de 0.2·P en dos diagonales. FACTOR CURATIVO: +15 % de vida al empezar 4 turnos tuyos y +10 de barra por golpe recibido. |
| Supermichi | SKY LIFT! | 0.6·P a cada celda de la quilla (con tope); lo que quede sin conexión se hunde. Las 2 últimas celdas de quilla aguantan en 1. |
| Hierro Michi | UPGRADE PROTOCOL! | 6 minimisiles de 0.2·P a sus 6 mejores módulos. Durante 3 turnos suyos, cada golpe que recibe le da +1 escudo (máx. 3) y +10 % de daño para el resto de la batalla (máx. +50 %). |
| Capitán Michimérica | NEVER FALL! | Durante 3 turnos suyos, el golpe que iba a dejar KO a un gato tuyo lo deja en 1, y Michimérica se lleva la mitad (puede caer él). Escudazo: 3 × 0.35·P de camarote en camarote. |
| Doctor Doomiau | DOOMIAU DECREES! | Durante 2 turnos suyos, el gato que te haga daño pierde el 25 % de lo que hizo y no se puede curar. Su núcleo queda Maldito 3. |
| Ssssmichi | BIG HUG! | 2·P de radio 3.5 en su camarote con más gatos y él queda KO. Si es tu último gato en pie no explota: sisea (onda de 0.4·P). |
| Michimpostor | EMERGENCY MEETING! | Expulsa 2 turnos (jefe: 1) al gato que más daño te ha hecho: no actúa, no se le puede pegar y su barra se congela. Vuelve con 50 % de vida como máximo. |
| Zoomic | RING RUSH! | 8 rebotes de 0.2·P y 30 ANILLOS. Cada golpe le tumba 10 anillos en vez de quitarle vida; si su siguiente tiro conecta, los recupera. |
| Hannah Michitana | SECRET IDENTITY! | Usa la ulti del gato suyo más fuerte (genérica, firma o poder MD), con la fuerza de su propia ulti. Sin ulti que copiar: 3 ondas de 0.45·P que aturden. |
| Gemichi | TWIN SWAP! | Intercambia la fracción de vida y los estados (y el aturdido) de tu gato más herido con su gato más sano. Con un capitán jefe, máximo 30 puntos. |
| Persa Falsa | UNDERCOVER! | Durante 2 turnos suyos, sus golpes a un camarote, el núcleo o un cañón caen en tu celda menos valiosa cercana (casco, mástil, motor). Contra jefes, solo sus cañones. |
| Hermiaune | TIME TURNER! | Deshace su último turno: tus celdas y gatos vuelven a como estaban (los caídos se levantan), revive los módulos que siguen en pie y les quita la barra que ganaron. |
| Luna Lovegata | UPSIDE-DOWN WORLD! | Sus escudos de gato se vuelven Expuesto 2, sus refuerzos y segundas vidas se vuelven Maldito, sus pozos jalan sus propios tiros 2 turnos, y el viento se voltea si los ayudaba. |
| Miaunce | MIND CATCH! | El siguiente tiro de gato o ulti suyo (en 2 turnos) se detiene entero y vuelve ×1.5 al camarote del tirador (una ulti respeta el tope). Los cañones no cuentan. |
| Heisenmiau | PURE CHEMISTRY! | Un matraz de 0.3·P (Prisma). Luego cada celda suya con estados explota con 0.3·P por estado (los consume), en cadena desde el matraz. |
| Michiércoles | PIRANHA POOL! | Al empezar sus 3 turnos: 0.2·P a cada celda en o bajo su línea de agua (un tope para los 3), Mojado, y −10 % de vida a los gatos de camarotes bajo el agua. |
| Michi-Wan | HIGH GROUND! | Este turno y tus 2 siguientes, tus tiros pegan ×1.2 y pasan la primera pared. Sus 3 turnos, los suyos pegan ×0.7 y no alcanzan tus celdas bajo el agua. |
| Don Gatoleone | THE OFFER! | Su gato más fuerte da su barra a tu tripulación y su siguiente tiro normal va contra su propio barco (su mejor módulo cerca). Jefe: −50 de barra. |
| María Gatoñeta | LET THEM EAT CAKE! | Durante 3 turnos suyos no ganan barra, y la primera ulti que intenten se anula: el que la lanza se duerme. |
| Romiau Santos | BACHATA SERENADE! | Su gato más fuerte se enamora 2 turnos (jefe: 1): no actúa, recibe ×1.25 y cada turno le pasa 25 de barra a Romiau. |
| El Miauki | TEARFUL BALLAD! | Su siguiente turno y el tuyo nadie dispara (los estados corren). Ahora mismo, +30 % de vida y +30 de barra a cada gato tuyo. |
| Post Maulone | CHILL VIBES! | Durante 3 turnos suyos tu tripulación no se aturde, no se congela ni se queda quieta (se le quita al momento). Guitarrazo de 0.6·P en cada celda de su cubierta (Congelado). |
| Miautentación | PAIN INTO ART! | Les quita todos los estados malos a tus gatos y celdas; cada uno es un golpe de 0.25·P con ese estado a sus mejores módulos (máx. 10). Sin estados: onda de 0.6·P. |
| Sabrina Gatpenter | SUGAR HEART! | Un corazón con el 25 % de la vida de tu barco se traga el daño a celdas y gatos durante 3 turnos suyos. Al romperse o acabarse: el 50 % de lo tragado en 8 golpes de confeti (Prisma, con tope). |
| Daft Miau | LIGHT PYRAMID! | 3 turnos: al cerrar cada turno tuyo, un láser de 0.4·P donde pegó tu gato (si falló, al módulo vivo más cercano). Alterna plata (Cargado) y oro (Cegado). |
| Party Michi | BASS DROP PILE-UP! | Todos sus gatos se amontonan en el camarote con más gatos hasta su turno. El bass drop de 1.2·P le pega completo a cada gato del montón. |
| The Miauknd | ENDLESS NIGHT! | Duplica los turnos de cada estado de su barco y sus gatos. Este turno y el siguiente, lo que les pongas entra doble. Fuego de 0.6·P en toda su cubierta (Ardiendo, doble). |
| Miaussi | DRIBBLE OF THE CENTURY! | El balón atraviesa hasta 5 celdas sin tocarlas y explota en la siguiente (1.3·P, sin escudos). Asistencia: tu siguiente tiro de gato ×2.5. |
| Gatistiano Ronaldo | HAT-TRICK! | 3 balonazos al mismo módulo de 0.4·P × 1, 1.5 y 2.5 (si cae, siguen al más cercano). +20 de barra a tu tripulación. |
| Miaupé | COUNTER-ATTACK! | Durante 2 turnos suyos, cada tiro de gato suyo que pega a tu barco recibe al instante 0.5·P de rayo (Cargado) en su camarote. No contesta cañones. |
| Lamiau Yamal | BACKDOOR CURL! | Rosca que entra por la popa a sus 2 módulos de atrás: 0.6·P × 1.5 que atraviesa todos los escudos, Flotando. |

## Cambios a los números del diseño (y por qué)
- **Un Zarpazo (PODERES-2b):** al núcleo le quita la mitad de lo que le queda, no lo deja en 1. Con el núcleo en 1, el siguiente golpe ahí (hasta los cañones de ese mismo turno) ganaba la pelea: en la grabación, un rival con 10 veces la vida cayó en el turno 5 con 70 % de barco. La Parte III ya hacía lo mismo: Cheshire nunca muerde el núcleo y Garbancito le quita 60 %.
- **Capitán Ahabigotes (PODERES-2b):** la cuerda nunca amarra el núcleo ni salta a él. Jala por vida máxima, sin importar el ataque ni la vida del rival, y un módulo cae con la mitad de sus celdas: en un barco cuyo módulo más grande es el núcleo, el tercer jalón lo rompía y ganabas seguro. En la grabación pasó dos veces, en el turno 5, contra un rival con 10 veces la vida.
- **Gatogro:** el pantano deja Enraizado una sola vez, no los 3 turnos. Cada turno de raíces quita 16 % de cada celda sin tope: con 3 serían ~48 % de su barco y pasaría el 45 %. Los 3 turnos se cumplen con Mojado y los cañones atascados.
- **Supermichi:** las 2 últimas celdas de la quilla aguantan en 1. Si cayera la quilla entera, se hundiría todo el barco de un golpe y el tope no serviría.
- **Ssssmichi:** si es tu último gato, la ulti sí se usa, pero solo sisea (onda de 0.4·P). Es lo que dice su texto, y así la IA nunca se queda con la ulti muerta en la mano. La ficha de números decía «no se puede usar».
- **Hannah:** la ulti copiada pega con la fuerza de su propia ulti (su ataque × su multiplicador). Con el multiplicador del otro gato, uno de tiro débil daba ×3–5.
- **Conde Gatula:** el sobrante en escudos tiene tope de 3 por gato.
- **Mr. Miaubody:** la copia dispara una vez por turno, después del primer tiro de gato.
- **Rick, Michi-Wan, Miaunion y The Miauknd:** cuentan también lo que queda del turno en que se lanzan (la andanada de ese turno). Los demás «próximos N turnos» siguen la regla de la Parte III: N turnos sin contar el actual.
- **Daft Miau:** la pirámide sigue disparando aunque él caiga (es un invocador).
- **Michi-Wan:** «desde arriba, ignoran las paredes de frente» se hace como pasar la primera pared sin dañarla y pegar en la siguiente celda. No hay tiro vertical literal.
- **Persa Falsa:** «nadie sabe quién es quién» = se reubica el golpe; la IA rival no cambia su puntería.
- **Miaufalda y Hermiaune:** la vista no puede volver a dibujar celdas que se cayeron del barco. «Rearmar» y «deshacer» devuelven lo que sigue en pie: vida de celdas y gatos, módulos vueltos a la vida y gatos que cayeron en ese turno. Lo que se cayó del barco no regresa, como lo Borrado.
- **Heisenmiau:** se agregó un matraz de 0.3·P que deja Prisma, para que el poder nunca salga vacío. La IA espera a que haya 6 celdas con estados, o al turno 4.
- **Luna Lovegata:** se agregó voltear el viento si los ayudaba, por la misma razón. Lo de «la regla de fase del jefe a tu favor» no se hizo: no hay un gancho genérico para las reglas de los jefes.
- **Miauby-Doo:** «suspende la regla de fase del jefe 2 turnos» se hizo como apagar las barreras 2 turnos (burbuja, escudo legado y capas arcanas), para cualquier rival. Vuelven solas.
- **Gatojo:** sus estados siguen corriendo; solo se detienen sus gatos y su andanada. Los tiros guardados caen al empezar su turno siguiente al congelado.
- **Zoomic:** recupera los anillos si su siguiente tiro conecta. Sus anillos caen en tu barco y su tiro va al suyo, así que no puede pasar por encima.
- **Michimpostor:** «su camarote queda vacío» = no se le puede pegar; el gato no se mueve.
- **Grrrú:** «sin escondite» = recibe ×1.5 mientras está congelado.
- **Miaunya, Sherlock y The Miauknd:** «revela vida y barra / el barco / Revelado» no tiene mecánica en el juego (no hay niebla). No se hizo.
- **Party Michi:** cada gato del montón recibe lo mismo que el del centro de la explosión (con el catMul normal de 0.5).

## Pares y dúos
- **Grrrú + Miaunion:** cuentan solo si están en tu tripulación y no están KO.
  - Con Miaunion, el rayo de Grrrú rebota y congela también al 2.º gato más fuerte.
  - Con Grrrú, los plátanos de Miaunion congelan 1 turno.
- **Daft Miau y Party Michi:** son un solo gato; el compañero aparece en el efecto (sello y pirámide / bass drop).

## Para SISTEMA (no edito su archivo)
- `game/scripts/postp3-sync.mjs` busca los poderes solo en `src/data/multidimPowers.ts`, con la regex `^\s{2}(\w+): \{$`. Los 60 viven en `src/data/multidimPowersPost.ts`.
- Mientras no lea ese archivo también, cada sincronización mete en PENDING Multidimensionales que ya tienen poder.
- Entonces `multidimPowers.test.ts` pide «remove these from PENDING» y hay que vaciarlo a mano.
- El arreglo es de una línea: sumar las llaves de `multidimPowersPost.ts` a `powers`.

## Preguntas de balance para el dueño
1. **Un Zarpazo contra el núcleo:** ahora le quita la mitad de lo que le queda. ¿Así, o prefieres que nunca toque el núcleo, como Cheshire?
2. **Los que más dañan a los gatos rivales de un tiro.** Prueba fija de las pruebas: 3 gatos nivel 30 contra 3. Mide qué parte de la vida de sus gatos se lleva el primer uso.
   - The Miauknd: 93 % (2 de 3 K.O.). Su fuego pega una vez por cada celda de cubierta de cada camarote.
   - Party Michi: 87 % (1.3 K.O.).
   - Lamiau Yamal: 64 % (2 K.O.).
   - Lo más alto de la Parte III es Ovillo, con 55 % (0 K.O.).
   - En la campaña real (etapa 5-4 con la partida h93) la Parte III también barre a los 2 gatos rivales de un tiro, así que no lo toqué. ¿Bajamos a The Miauknd para que su fuego pegue una sola vez a cada gato?
3. **Ryumiau:** contra un rival de un solo gato que no es jefe, la libreta es una victoria segura en 3 turnos. ¿Está bien, por ser la Libreta?
4. **Cambios que hizo PODERES-2 y siguen esperando tu visto bueno:**
   - Gatogro: Enraizado una sola vez.
   - Supermichi: las 2 últimas celdas de quilla aguantan en 1.
   - Ssssmichi: si es tu último gato, sisea.
   - Hannah: copia con la fuerza de su propia ulti.
   - Conde Gatula: máximo 3 escudos por gato.
   - Rick, Michi-Wan, Miaunion y The Miauknd: cuentan el turno en que se lanzan.
   - Heisenmiau y Luna Lovegata: se les agregó un extra.
   - Miauby-Doo: apaga barreras en vez de la regla de fase del jefe.
   - Lo de «revelar» no se hizo, porque no hay niebla.
   - El detalle de cada uno está en «Cambios a los números del diseño».

## Cómo retomar
- `cd game && npx vitest run tests/multidimPost.test.ts tests/multidimPowers.test.ts`
- **A/B contra HEAD:** la salida de HEAD (c4cfa3c) está guardada en `scratchpad/poderes2/ab_head.txt`. PODERES-2b borró el worktree para liberar disco: si HEAD cambia, hay que crear otro con `git worktree add --detach`.
  - Copiar `scratchpad/poderes2/ab_h63.test.ts` a `game/tests/` con otro nombre, correrlo con `AB_OUT=… npx vitest run <archivo>`, borrar la copia y comparar con diff.
- **Grabar:** levantar el servidor `poderes2` (5213) con preview_start. Sirve el catálogo post con los 60 del roster sin tocar el repo.
  - Luego `scratchpad/poderes2/batch.sh a,b,c d,e,f …`: graba en tandas de 3 con `CAP=1 BOOST=10`. Los que fallan quedan en `rec/failed.txt`.
  - La bitácora de cada tanda dice por qué terminó la pelea y cuánta vida le queda al núcleo.
  - Para números sin video: `node scratchpad/poderes2b/probe.mjs <especies>`, desde `scratchpad/qa3/pp`.
- Sin commits ni push. Nunca el puerto 5173.

## Cierre (PODERES-2b)
PODERES-2 se detuvo justo al cerrar. PODERES-2b terminó el cierre sin agregar nada nuevo.

**División de `hooks.ts`:**
- `hooks.ts` (las reglas durante un tiro), `turn.ts` (los relojes y los golpes al empezar un turno) y `hud.ts` (la IA y las fichas) ya se describen en su encabezado y se apuntan entre sí.
- Se quitaron 13 importaciones que sobraron al dividir: 12 en `hooks.ts` y 1 en `powersB.ts`.
- `hooks.ts` ya no reexporta `CAT_K`/`DMG_K` (nadie lo usaba), y su encabezado decía «cinco contadores» cuando son cuatro.
- No se perdió nada:
  - `tsc` está limpio.
  - Cada campo de `MdpState` que tiene reloj se lee en `hooks`/`turn`/`hud`.
  - Pasan las 224 pruebas de las dos suites de poderes.
  - El A/B del jefe H63 contra HEAD sigue idéntico (310 líneas).

**Grabaciones sin cabeza: 60 de 60 poderes disparan en batalla real, 0 errores de consola.**
- Son 20 tandas de 3 en la etapa 5-4, con el rival a 10 veces la vida. Quedan 20 clips a ~60 fps, más una imagen del sello y una del golpe por poder.
- Clips e imágenes: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad/poderes2/rec/`.
- Hojas de contacto, una por tanda (sello | golpe): `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad/poderes2b/sheets/`.
- Dos tandas se colgaron una vez con la máquina cargada (carga 8). Al repetirlas salieron limpias.

**Errores corregidos al revisar las imágenes:**
1. **Victoria instantánea, Un Zarpazo:** dejaba el núcleo en 1 y el siguiente golpe ganaba. En la grabación, un rival con 10 veces la vida cayó en el turno 5.
   - Ahora le quita la mitad de lo que le queda. Cambió el texto. Prueba nueva.
2. **Victoria instantánea, Capitán Ahabigotes:** si el módulo más grande era el núcleo, el tercer jalón lo rompía siempre, porque jala por vida máxima. Pasó dos veces, en el turno 5.
   - Ahora la cuerda nunca amarra el núcleo ni salta a él. Cambió el texto. Prueba nueva.
3. **Sellos ilegibles en bandas casi negras:** el nombre salía del mismo color que la banda.
   - Afectaba a Condorgato, Grrrú, Gatojo y Miaupé, y a Gatoleone mientras no tenga universo.
   - Ahora el nombre va en papel cuando la banda es casi negra. Está en `multidimFx.stampBanner`, así que vale también para la Parte III.
4. **«¡ANDANADA x5!» encima del sello:** pasaba con los poderes instantáneos (Luna Lovegata, Rick), porque los cañones salían con el sello todavía en pantalla.
   - Con un sello en pantalla, la etiqueta baja de la banda: `mdStampUp()` en `multidimFx` y `autoVolley` en `BattleScene`.
5. **Textos cortados en el borde derecho:**
   - «ELEMENTAL, MI QUERIDO MICHI» de Sherlock (`word()`).
   - «¡Y LO HUBIERA LOGRADO…!» de Miauby-Doo (`bang()` de los post).
   - «¡AMARRADO! JALA 3 TURNOS…» de Ahab: era una etiqueta `info` de `BattleScene`, y ahora se acomoda dentro de la pantalla como ya hacía `flt()`.
6. **La revista de Luna Lovegata** quedaba entera debajo de la banda del sello. Ahora sale junto a ella.
- Las correcciones de PODERES-2 se confirmaron en las grabaciones nuevas: «¡ZA… MIAURLDO!» y «¡JUNTA DE EMERGENCIA!» ya no tapan el nombre.

**Verificación final:**
- `npx tsc --noEmit -p .`: limpio.
- `npx vitest run`: 84 archivos pasan y 1 se salta (`p3Balance.sim`, como siempre); 1296 pruebas pasan y 2 se saltan. `multidimPost` ya tiene 131 casos.
- `node scripts/verify-missions.ts --all`: 194 OK o dormidas, 0 con faltantes.
- El servidor `poderes2` quedó detenido.

## Última actualización
2026-10-28 (PODERES-2b)
