# 15 · Balance del Cristal y la regla del Sonido (H35 «Shhh»)

**Fecha:** 2026-10-09 · **Alcance:** `battle/cristal.ts`, `data/rupturas/especies.json` (números), `battle/ruido.ts` (nuevo), la batalla `ruptura_bibliotecario` de `state/sys/rupturas.ts`.
**Cómo se midió:** `game/scripts/balance-crystal.ts` (sims sin pantalla, la misma simulación y la misma IA que la pantalla y el estimador).

## 0. Resumen

- **El problema que se reportó** («Cristal pierde ~90 % contra Fuego en el barco de madera») **es real, pero no es culpa del Cristal.** Es el casco: el Fuego pega ×1.5 a la madera y además la quema. En presupuesto B, en madera, Cristal ganaba 19–25 % contra Fuego. La familia típica de la Parte I gana ahí **16 %** (mediana): 8 de 12 familias pierden igual o peor. En hierro y en cristal, el mismo Cristal le ganaba al Fuego 75–100 %.
- **El problema de verdad era el contrario: Cristal estaba pasado.** Ganaba **75 %** de los duelos de familia. La culpable era la **FACETA**: frenaba la mitad del mejor tiro rival en cada turno y le devolvía una esquirla ×0.35 al gato que tiró. Sin faceta, Cristal bajaba a 33–42 %.
- **Cambios** (solo números, ninguna mecánica nueva):
  - `CR_TUNE` en `cristal.ts`:
    - la faceta deja pasar **60 %** (antes 50 %);
    - el reflejo es **×0.15** (antes ×0.35);
    - las esquirlas de la refracción son **×0.75** (antes ×0.5): eso premia mezclar Cristal con otros elementos.
  - **Facetas:** tiro 55 → 45 y ulti 60 → 50. Era un tanque de 150 de vida con daño de francotirador (p86 de su rareza).
  - Se ajustaron los textos que muestran esos números (estados, reacciones, placas, glosario, «¿por qué?» del estimador, línea del rival).
- **Resultado:**
  - Cristal gana **56 %** en promedio. Antes ganaba 75 %; la familia mediana de la Parte I gana 54 %.
  - Queda en 35–65 % contra **6 de 13** familias (antes 2). Ninguna familia de la Parte I pasa de 4 de 12 (§4).
  - Contra **12 de 13** familias, Cristal queda dentro del rango normal de la Parte I (p25–p75). La excepción es Sonido, y es a propósito: Cristal le pega ×1.5.
  - Las tripulaciones **mixtas** con 1 gato de Cristal ganan **52 %** contra la misma familia pura. Con 2 gatos ganan **58 %**. Antes ganaban 59 % y 68 %: el Cristal pasó de casi obligatorio a una buena opción.
- **H35 «Shhh» (regla del Sonido)**, sin tocar ninguna otra batalla:
  - En `battle/ruido.ts`. El Sonido le pega ×2 a su barco.
  - Cada tiro de Sonido suma RUIDO. Con 3 de RUIDO grita «¡SHHHH!» y todo su turno siguiente pega ×1.5.
  - Una tripulación post-historia gana **31/32** sin gato de Sonido y **31/32 – 32/32** con Headliner a bordo.

## 1. Método

| | |
|---|---|
| **Tripulaciones de familia** | 3 gatos cuyo **primer** elemento es el de la familia (sin secretos). Mismo presupuesto de rareza en los dos lados. **A** = común + raro + épico (Nv10). **B** = raro + épico + legendario (Nv20). Si hay varias especies de una rareza, la semilla *i* usa la candidata *(i + hueco) mod n*: en 16 semillas pasan todas. |
| **Barcos de prueba** | Gorrión (14×10, 3 camarotes, cañón, núcleo, pólvora) con las tres clases de casco del jugador. **Madera:** celda 75 (Balandra; conserva sus 2 costillas de hierro), cañón 64. **Hierro:** celda 110 (Galeón), cañón 77. **Cristal:** celda 145 (Acorazado Arcano), cañón 90. Mismo barco en los dos lados. |
| **Gatos** | Con los datos de su especie: `dmgMul 1`, `hpMul 1`, ★1. La rareza cuenta como presupuesto, no como multiplicador. |
| **IA** | La misma en los dos lados: `normal` y `hard` (puntería de `DIFFICULTY`). En las semillas pares, Cristal es el lado 0 (tira primero); en las impares, el lado 1. |
| **Semillas** | 16 por celda (barco × IA × presupuesto). Por familia: 192 batallas. Rejilla completa: 2 496 batallas. |
| **Referencia Parte I** | Cada familia contra las otras 12, con el mismo arnés: 3 barcos × A/B × IA `normal` × 12 semillas, ~11 000 batallas. Es la vara de «qué es normal» contra cada rival. |

Para reproducir, desde `game/`:

```
npx vite-node scripts/balance-crystal.ts                       # Cristal vs las 13 familias (rejilla completa, ~9 min)
npx vite-node scripts/balance-crystal.ts -- --vs fire --ship wood --budget B
npx vite-node scripts/balance-crystal.ts -- --me fire --vs fire --mix 1      # prueba espejo de tripulación mixta
npx vite-node scripts/balance-crystal.ts -- --tune facetKeep=0.5,facetReflect=0.35,shard=0.5   # el «antes»
npx vite-node scripts/balance-crystal.ts -- --biblio --seeds 16             # H35 «Shhh»
```

## 2. Por qué perdía contra Fuego en madera

| Cristal vs Fuego | madera | hierro | cristal |
|---|---|---|---|
| Antes (todas las celdas) | **38 %** | 84 % | 80 % |
| Antes, presupuesto B, normal / hard | **19 % / 25 %** | 100 % / 88 % | 75 % / 88 % |
| Después (todas las celdas) | 16 % | 55 % | 59 % |

- **Casco.** En el mismo duelo, cambiar madera por hierro sube a Cristal de 19 % a 100 %. Pesan dos reglas de la Parte I:
  - el Fuego pega **×1.5 a la madera**, mientras el Cristal pega ×1;
  - la madera **arde**: en 16 duelos B de diagnóstico (Cristal como lado 0), la quemadura le hizo 13 845 de daño al casco de Cristal y 4 413 al del Fuego.

  Ignis pega 897 por tiro en madera y 544 en hierro.
- **No es exclusivo del Cristal.** La familia mediana de la Parte I gana contra Fuego en madera:
  - **29 %** en A;
  - **16 %** en B (Agua 42, Tierra 75, Luz 75, Sonido 67, Sombra 50; Naturaleza, Cósmico, Hielo y Vacío 8; Tormenta y Magia 0).
- **Lo que se descartó:**
  - **Rebote de Madre Nácar:** sin rebote, el resultado no cambia (B: 30 % → 31 %).
  - **Duración del Prisma:** el Prisma casi no cuenta en tripulaciones puras. Solo lo refractan los cañones propios: 17–28 refracciones en 16 duelos.
  - **Números de especie bajos:** todas están en la banda de su rareza (§6).
  - **Subir el Cristal contra madera:** con ×1.25 o ×1.5, el duelo B contra Fuego en madera queda en 9–25 % y Cristal sube contra todos los demás.
- **La respuesta del Cristal es mezclar.** Con **un gato de Agua** (moja: lo mojado no arde) y dos de Cristal, contra Fuego en madera:
  - en A: **42 %** (Cristal puro: 25 %);
  - en B: **33 %** (Cristal puro: 6 %).
- **Contexto de juego.** El Cristal llega después de «Fin» (H39). Para entonces el casco del jugador ya es de cristal (`post-finale`: Casco Mk 6). Un duelo en madera es raro.

## 3. Qué lo hacía fuerte: la FACETA (medido)

Win rate de Cristal contra las 13 familias. Las tres primeras filas usan la rejilla completa: 16 semillas, normal + hard, 3 barcos. Las demás son el barrido rápido: 12 semillas, IA normal, 3 barcos.

| Faceta deja pasar · reflejo · esquirla | A | B | Nota |
|---|---|---|---|
| 0.5 · 0.35 · 0.5 (**antes**) | 76 % | 74 % | 2 de 13 familias en 35–65 % |
| sin faceta (1 · 0 · 0.5) | 33 % | 42 % | la faceta valía **+35–40 puntos** |
| 0.6 · 0.15 · 0.75 (**después**) | 58 % | 55 % | 6 de 13 en 35–65 % |
| 0.5 · 0 · 0.5 | 57 % | 56 % | |
| 0.65 · 0 · 0.5 | 47 % | 52 % | |
| 0.6 · 0.1 · 0.5 | 53 % | 54 % | |
| 0.65 · 0.15 · 0.75 | 56 % | 53 % | |
| 0.8 · 0.2 · 0.5 | 52 % | 50 % | |
| 0.6 · 0.6 · 0.5 | 83 % | 80 % | |
| 0.65 · 0.9 · 0.5 | 89 % | 89 % | el reflejo tumba tripulaciones enteras |

- **El reflejo es lo que más pesa.** Cada faceta le devuelve daño al gato que disparó, y en peleas largas eso noquea a la tripulación. Además, contra Luz y Sonido el reflejo pega ×1.5, porque la afinidad del Cristal cuenta.
- **Por qué bajar el daño del Cristal no comprime los resultados.** Probé ×0.6–×0.8 de daño con más reflejo. Contra Magia y Tormenta seguía arriba de 85 %: el reflejo las noquea igual.

## 4. Antes y después, familia por familia

Rejilla completa: 16 semillas × IA normal/hard × madera/hierro/cristal. Cada celda de A o B suma 96 batallas; cada total, 192. «Parte I» es cómo les va a las otras 12 familias contra ese rival.

| Familia rival | Antes A | Antes B | **Antes total** | Después A | Después B | **Después total** | Parte I: mediana [p25–p75] | ¿35–65? |
|---|---|---|---|---|---|---|---|---|
| Fuego | 69 % | 66 % | **67 %** | 44 % | 43 % | **43 %** | 40 % [16–68] | sí |
| Agua | 95 % | 81 % | **88 %** | 88 % | 61 % | **74 %** | 69 % [51–86] | no |
| Naturaleza | 62 % | 82 % | **72 %** | 55 % | 82 % | **69 %** | 67 % [45–73] | no |
| Tierra | 38 % | 19 % | **28 %** | 30 % | 10 % | **20 %** | 29 % [16–33] | no |
| Tormenta | 91 % | 92 % | **91 %** | 73 % | 82 % | **78 %** | 90 % [72–94] | no |
| Magia | 97 % | 97 % | **97 %** | 81 % | 97 % | **89 %** | 86 % [70–95] | no |
| Cósmico | 71 % | 95 % | **83 %** | 60 % | 91 % | **76 %** | 73 % [51–79] | no |
| Hielo | 51 % | 67 % | **59 %** | 42 % | 29 % | **35 %** | 34 % [14–56] | sí |
| Sonido | 98 % | 56 % | **77 %** | 77 % | 23 % | **50 %** | 19 % [15–36] | sí |
| Sombra | 64 % | 65 % | **64 %** | 30 % | 29 % | **30 %** | 29 % [12–40] | no |
| Tiempo | 70 % | 89 % | **79 %** | 52 % | 56 % | **54 %** | 48 % [26–76] | sí |
| Luz | 95 % | 69 % | **82 %** | 64 % | 43 % | **53 %** | 28 % [17–54] | sí |
| Vacío | 85 % | 82 % | **84 %** | 58 % | 65 % | **61 %** | 52 % [38–69] | sí |
| **Todas** | 76 % | 74 % | **75 %** | 58 % | 55 % | **56 %** | | antes 2/13 · después 6/13 |

**Por barco.**

| Barco | IA normal | IA hard |
|---|---|---|
| Madera | 69 → 52 | 75 → 55 |
| Hierro | 72 → 52 | 77 → 58 |
| Cristal | 77 → 61 | 78 → 61 |
| **Todos** | **73 → 55** | **77 → 58** |

**Por qué «35–65 % contra CADA familia» no se puede cumplir con números.** Las familias de la Parte I no están parejas entre sí con el mismo presupuesto:

- Tormenta gana 17 % de sus duelos; Magia, 19 %; Sonido, 75 %; Tierra, 71 %.
- Contra Tormenta, la familia mediana gana **90 %**; contra Magia, **86 %**; contra Sonido, **19 %**; contra Tierra, **29 %**.
- Ninguna familia de la Parte I queda en 35–65 % contra más de **4 de sus 12** rivales. Fuego, Tierra, Cósmico y Tiempo llegan a 4; la mayoría se queda en 2–3.

Para que Cristal estuviera en 35–65 % contra todas, tendría que perder contra las más débiles y ganarle a las más fuertes. Con números no se logra: lo probé con más de 15 configuraciones (§3).

Lo que sí se cumple:

- Cristal es una familia **del medio**: 56 %.
- Tiene el **mejor reparto** del juego: 6 de 13 familias en 35–65 %.
- Contra cada familia queda donde queda una familia normal. Las desviaciones son las de su afinidad:
  - le pega ×1.5 a **Sonido** y a **Luz** (Sonido 50 % contra 19 % de la mediana; Luz 53 % contra 28 %);
  - **Tierra** es su contra: 20 % contra 29 % de la mediana. Además, los tiros pesados de Tierra perforan antes de que la faceta actúe, como manda la Biblia §9.4.

## 5. Tripulaciones mixtas: ¿el Cristal se gana su lugar?

Prueba espejo: la familia X con sus 1–2 huecos más baratos cambiados por gatos de Cristal de la misma rareza, contra la familia X pura. 16 semillas × normal/hard × 3 barcos × A/B: 192 batallas por familia.

| | Promedio | Fue | Agu | Nat | Tie | Tor | Mag | Cós | Hie | Son | Som | Tie | Luz | Vac |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **+1 Cristal, antes** | **59 %** | 33 | 77 | 49 | 47 | 77 | 69 | 74 | 51 | 60 | 65 | 52 | 61 | 49 |
| **+1 Cristal, después** | **52 %** | 29 | 67 | 45 | 44 | 68 | 57 | 65 | 49 | 49 | 53 | 47 | 54 | 50 |
| **+2 Cristal, antes** | **68 %** | 47 | 83 | 53 | 43 | 81 | 93 | 79 | 52 | 71 | 73 | 65 | 68 | 73 |
| **+2 Cristal, después** | **58 %** | 36 | 68 | 44 | 36 | 78 | 80 | 72 | 47 | 58 | 62 | 55 | 55 | 64 |

- **Es una opción real.** Con un gato de Cristal, la tripulación gana 44–68 % contra su versión pura en 12 de 13 familias; la excepción es Fuego. Las esquirlas más fuertes (×0.75) premian que otros elementos peguen sobre el Prisma.
- **No es obligatorio.** Ya no conviene en todas partes:
  - el Fuego queda peor (29 %), porque cambia a su común incendiario;
  - Tormenta, Magia y Cósmico mejoran mucho, pero mejoran con cualquier gato decente.

## 6. Banda de poder por rareza (las 12 especies del Lote D)

Daño por tiro (estructura + gatos) con IA normal contra un Gorrión pasivo. Es el promedio de madera, hierro y cristal, 6 semillas, Nv10. Las ultis van en el mismo escenario. Entre paréntesis va el percentil contra las especies de la Parte I de esa rareza.

| Rareza (Parte I) | Tiro: mín / p25 / mediana / p75 / máx | Ulti: mín / mediana / máx |
|---|---|---|
| Común (n=20) | 85 / 197 / 253 / 380 / 617 | 103 / 923 / 1 997 |
| Rara (n=22) | 66 / 186 / 267 / 432 / 725 | 107 / 565 / 2 506 |
| Épica (n=17) | 66 / 191 / 412 / 633 / 3 116 | 96 / 1 477 / 9 748 |
| Legendaria (n=16) | 61 / 316 / 646 / 1 043 / 1 236 | 278 / 1 071 / 25 398 |

| Especie | Tiro (pct.) | Ulti (pct.) | Vida | Nota |
|---|---|---|---|---|
| Brillito | 188 (p25) | 918 (p50) | 90 | |
| Marcapáginas | 199 (p30) | 1 308 (p80) | 100 | |
| Espumita | 223 (p40) | 300 (p25) | 90 | |
| **Facetas** | **458 (p82)** · antes 560 (p86) | 1 287 (p82) · antes 1 543 | 150 | tiro 55 → 45 y ulti 60 → 50: tanque con daño de raro alto, ya no de los mejores |
| Espejito | 221 (p45) | 272 (p27) | 85 | |
| Tintero | 331 (p64) | 1 249 (p82) | 85 | |
| Farolillo | 261 (p50) | 309 (p27) | 80 | |
| Prismarina | 539 (p65) | 706 (p29) | 80 | |
| Refracta (secreto) | 347 (p47) | 1 800 (p59) | 90 | |
| Archivista | 283 (p41) | 1 569 (p53) | 90 | |
| Madre Nácar | 674 (p56) | 4 533 (p94) | 85 | ulti alta solo cuando no hay nada que recordar (perlas ×1.5); en tripulación repite el último tiro y suelta perlas ×1 |
| Bibliotecario | 976 (p75) | 1 238 (p56) | 95 | |

`tests/crystalBalance.test.ts` vigila esto de forma barata: daño, radio, ulti y recarga de cada especie nueva dentro del mínimo–máximo de su rareza. También vigila los límites de `CR_TUNE`, que los textos digan los mismos números que las reglas, y un duelo determinista contra Vacío (antes 14/16, ahora 10/16; tiene que quedar en 25–75 %).

## 7. H35 «Shhh»: el Bibliotecario Ahogado odia el ruido

**La regla** (`battle/ruido.ts`, `StageRules.noise = { side: 1 }`, solo en `ruptura_bibliotecario`):

- **×2:** un tiro de Sonido (de gato o de cañón) que le pega a **su** barco hace ×2 ahí: celdas, gatos que alcanza y piezas de jefe. Contra tu barco, su Sonido es normal.
- **RUIDO:** cada tiro de Sonido suma 1. Cuenta una vez por tiro, aunque la onda cruce 8 celdas.
- **¡SHHHH!:** con 3 de RUIDO se despierta furioso. RUIDO vuelve a 0 y **todo su turno siguiente** pega ×1.5: gatos y andanada de cañones. Se calma cuando vuelves a jugar.
- **Determinista:** no usa azar. Una batalla sin gatos de Sonido es idéntica con la regla o sin ella (lo prueba un test).
- **IA:** valora los tiros de Sonido contra él ×1.6. Si ese tiro lo despertaría, solo ×1.3.

**En pantalla** (con las piezas de siempre):

- Un chip en la tira de reglas, bajo la barra del rival: «RUIDO n/3 · SONIDO ×2». Con 2 de RUIDO se pone amarillo y pulsa; cuando se despierta cambia a «¡SHHHH! FURIOSO ×1.5».
- Etiquetas sobre su barco en cada golpe: «RUIDO 2/3 · SONIDO ×2». Al empezar su turno de furia: «¡FURIOSO! ESTE TURNO ×1.5».
- El evento `boss: 'shhh'` saca el globo del capitán («¡SHHHH! ¡ESTO ES UNA BIBLIOTECA!»), el aviso «¡DESPERTÓ! SU TURNO PEGA ×1.5», la alarma y una sacudida.

**La tarjeta de entrada** tiene 4 líneas:

- «Odia el ruido: tus tiros de {sound} Sonido le pegan ×2 a su barco.»
- «Cada golpe de {sound} suma RUIDO. Con 3 grita ¡SHHHH! y su turno pega ×1.5.»
- La línea de Tormenta/Luz que ya existía.
- La línea del cataclismo.

**Calibración.** Partida `test-saves/post-finale.json` (tripulación del Bastión), 16 semillas por fila, con tu puntería normal y hard. La IA rival usa `capitan`.

| Tripulación | Regla | Normal | Hard | Turnos | ¡SHHHH! por pelea |
|---|---|---|---|---|---|
| La suya (sin Sonido) | sí | 15/16 | 16/16 | 4.7 / 5.7 | 0 |
| La suya (sin Sonido) | no | 15/16 | 16/16 | 4.7 / 5.7 | — |
| Headliner en vez de Merlina | sí | 15/16 | 16/16 | 4.9 / 4.3 | 0.3 |
| Headliner en vez de Merlina | no | 16/16 | 16/16 | 4.8 / 5.6 | — |
| Headliner en vez de Abisa | sí | 16/16 | 16/16 | 5.1 / 5.2 | 0.2 / 0.4 |
| Headliner en vez de Abisa | no | 16/16 | 16/16 | 5.3 / 5.3 | — |

- La historia nunca te tranca: **94–100 %** en todos los casos.
- Con Sonido, la pelea en hard dura 4.3 turnos en vez de 5.6. Y un despertar de vez en cuando se nota sin volverse un muro.
- `powerMul` sigue en ×1.25.
- Tests: `tests/ruido.test.ts`. Cubren:
  - el ×2;
  - que RUIDO cuente una vez por tiro;
  - el despertar y que el reinicio llegue en el turno correcto;
  - el ×1.5 en `fire()`;
  - la repetición con la misma semilla y que el estimador (`autoBattleSteps`) dé lo mismo que `autoBattle`;
  - que la regla no haga nada sin gatos de Sonido;
  - la tarjeta y que ninguna otra batalla odie el ruido.

## 8. Archivos

- `game/src/battle/cristal.ts`: `CR_TUNE` (antes eran constantes sueltas) y sus valores nuevos.
- `game/src/data/rupturas/especies.json`:
  - Facetas: 45 / 50;
  - textos de Prisma, Faceta, Refracción y Reflejo (`mult` 0.6);
  - números de misión renumerados en «cómo se consigue»: H34, H35, H39, H40 y H41.
- `game/src/battle/labels.ts`, `battle/multiverso.ts`, `data/glossary.ts`, `state/sys/estimate.ts`: textos con los números nuevos.
- `game/src/battle/ruido.ts` (nuevo). Ganchos en:
  - `battle/sim.ts`: `StageRules.noise`, `BossWhat 'shhh'`, `fire`, `startTurn` y `resolveImpact`;
  - `battle/ai.ts`;
  - `scenes/BattleScene.ts`: chip y evento `shhh`.
- `game/src/state/sys/rupturas.ts`: `rules?` opcional en `RupturaSpec` (se mezcla con el cataclismo) y `ruptura_bibliotecario` (regla e intro).
- `game/scripts/balance-crystal.ts` (nuevo): el arnés.
- Tests: `game/tests/crystalBalance.test.ts` y `game/tests/ruido.test.ts` (nuevos); `game/tests/crystal.test.ts` (el reflejo sigue a `CR_TUNE.facetKeep`).
