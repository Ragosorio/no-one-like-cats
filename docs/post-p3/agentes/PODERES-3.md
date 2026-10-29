# PODERES-3 · los poderes de la tanda 2 (25 Multidimensionales post) — 2026-10-29

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo: el poder propio de cada uno de los 25 Multidimensionales de la tanda 2 (diseño final de DISEÑO-2: `docs/post-p3/05-tanda-2.md`, `fuente/md_tanda2.py`, `04-roster.json` → `post.power`). Mismas reglas que PODERES-2: solo tu lado, una vez por batalla (dos a ★5), tope de estructura 45 % (18 % contra jefes), sin victorias instantáneas ni bloqueos, determinista.

## Qué estoy haciendo
Nada: terminado. Quedan las preguntas de balance para el dueño (abajo).

## Hecho
- **Los 25 poderes, en la arquitectura de PODERES-2** (`game/src/battle/multidimPost/`):
  - `kitD.ts`: estado de la tanda 2 (va dentro de `MdpState.d`: sin poder post en la pelea sigue sin crearse nada) y la geometría nueva (punto en triángulo, camarotes solos, el borde del barco, romper sin dejar nada colgando).
  - `powersD.ts` (1–13) y `powersE.ts` (14–25): los 25 en el orden del roster.
  - `rulesD.ts`: las reglas durante un tiro (viento, conquista, carritos, gravedad, máquinas de Leonardo, brújula, listones, bitácora de fallados, cuentas de Felinamente y Garjona, objeción, Vapor, encore, trampas, piso de Bastet, MARCADO).
  - `turnD.ts`: relojes y golpes al empezar un turno (listones sueltos, sol de Bastet, la perla de Cleogatra, la objeción sin usar, la luz de la Perla, el viento).
  - `hudD.ts`: cuándo los usa la IA y las fichas del HUD (incluida «LA CAJA TRAE…» de El Michíncipe antes de usarlo).
- **Ganchos:** se reusan los de PODERES-2. Nuevos: `mdFloor` en `sim.hurtCell` (Bastet), `mdAimShot` en la guía de puntería de `BattleScene` (tu guía muestra la gravedad de Miauton; la IA rival nunca la ve) y `mdExtendOwn` en `multidim.ts` (Garjona alarga también los relojes de la Parte III).
- **Combo Pinkmiau + Heisenmiau:** con Heisenmiau en tu tripulación, PURE CHEMISTRY cuenta cada estado ×2 (máx. 6 por celda) durante la ventana y 2 turnos más (`powersC.ts`, una línea).
- **Datos:** `multidimPowersPost.ts` trae los 25 al final, escritos desde el roster por `scratchpad/poderes3/gen_data_t2.py`.
- **Escena:** `multidimPostFx.ts` tiene una pieza propia para cada uno de los 25 y sus golpes `mdp*`.
- **Pruebas:** `game/tests/multidimPostT2.test.ts` (58 casos): datos, una revisión por gato, lado rival idéntico con poderes on/off, determinismo, la IA usándolos, tope de jefe, golpes diferidos con su tope, ★5, fichas y cuentas desde el inicio. `multidimPost.test.ts` queda para los primeros 60 (pero sus pruebas de datos y textos cubren los 85).

## Cambios al diseño (y por qué)
- **Tetrimiau:** la fila se borra, pero una celda cuya caída dejaría algo colgando se queda como pilar. El barco no baja sus filas como en el juego: borrar una fila de en medio tiraba gratis todo lo de arriba (hundía el barco o tiraba el núcleo). Texto cambiado en la fuente (`md_tanda2.py` → `generar.py`).
- **Shakimiau:** lo mismo con las celdas bajo el 30 %: se derrumban de arriba abajo y las que sostienen algo aguantan. Texto cambiado en la fuente.
- **El Sombreronrón:** si los 3 listones quedan casi en línea y el triángulo no deja ninguna celda adentro, pega en cada listón (como cuando la ventana se acaba). Solo en los números de la ficha.
- **Miauty:** el balance nunca rompe una celda (le deja al menos 1) y al núcleo no le quita más de la mitad de lo que le queda. Así no hay victoria instantánea por porcentaje. El texto ya lo permitía.
- **Miauzart:** el minueto son 3 notas que caen en abanico sobre su barco. Su ulti es una onda que rueda por el mar y, copiada, se quedaba en el agua.
- **Ricardo Garjona:** alarga ventanas, guardias y relojes de tu lado (también los de la Parte III), tus refuerzos y la ceguera que les dejaste, y los estados de su barco y sus gatos. Los aturdimientos no: dos turnos más de aturdido serían un bloqueo. Los escudos de gato no caducan, así que no hay nada que alargar.
- **Felinamente Rubia:** la objeción intercepta los estados que te ponen sus tiros (gatos, cañones y ultis). Los que caen al empezar un turno no cuentan.
- **Miauzart (encore):** repite el daño directo de esa ulti (celdas y gatos) al 60 % con su propio tope. Lo que dura turnos no se renueva.
- **Capitán Gorrimiau:** la brújula vuelve a apuntar el tiro hacia el blanco y se queda con la trayectoria real más cercana dentro de 2.5 celdas, así que las paredes lo siguen deteniendo. Los abanicos se corrigen juntos (por su punto medio).
- **Leonardo:** «+2 rebotes» (asediador) son dos saltos al 60 % desde donde cae; «+2 proyectiles» (artillero) en un tiro de un solo proyectil son dos tiros más a ±4°.
- **Revelado** (Felinamente, Miauty, Garjona) no tiene mecánica: no hay niebla. Igual que en PODERES-2.

## Verificación
- `npx tsc --noEmit -p .`: limpio.
- `tests/multidimPostT2.test.ts`: 58 de 58. `multidimPost.test.ts` + `multidimPowers.test.ts`: 312 de 312.
- `npx vitest run --maxWorkers=2` (con `briefs/pesado.sh`), corrida final con los 25 ya en `especies.json`: 89 archivos pasan y 1 se salta (`p3Balance.sim`, como siempre); 1562 pruebas pasan y 2 se saltan. `multidimPowers.test.ts` ya revisa también a los 25 (231 casos) y su PENDING sigue vacío.
- `node scripts/verify-missions.ts --all`: 194 OK o dormidas, 0 con faltantes.
- **Regresión A/B contra HEAD (8c5b17c):** jefe H63 «El Umbral», 4 tripulaciones × 5 semillas: historia, leyenda, una de la Parte III y una de 7 Multidimensionales post de la tanda 1. Dan 441 líneas de bitácora idénticas. Se hizo con un worktree disperso de 19 MB (solo `game/src`, `tests` y `test-saves`), ya borrado.

- **Grabaciones sin cabeza: los 25 disparan en batallas reales, 0 errores de consola.**
  - Etapa 5-4, rival con 10 veces la vida, servidor `poderes2`. A mitad del trabajo los 25 llegaron a `especies.json` con su arte, y las últimas tandas ya los muestran.
  - 9 tandas de 3: Gatejo y Tetrimiau se grabaron dos veces.
  - Hojas, una por tanda (sello | golpe): `scratchpad/poderes3/sheets/`. Clips: solo 2 (Quetzalgatl–Bastet–Cleogatra y Miauton–Miauzart–Miausagi) en `scratchpad/poderes3/rec/`; los demás se borraron por el disco.
  - Lo que arreglaron:
    - Los listones de El Sombreronrón no salían con ultis que pegan a mano (mordidas, lágrimas). Ahora clavan listón donde hicieron daño; dos golpes en el mismo punto clavan uno.
    - Los textos y piezas de la tanda 2 quedaban debajo de la banda del sello. Ahora van abajo de ella, y las palabras de los golpes se acomodan dentro de la pantalla.
    - Etiquetas repetidas (viento, listones, laboratorio, conquista), y «+2 TURNOS A 0 COSAS» de Garjona cuando no había nada que alargar.
    - La primera tanda falló porque el `timeout` también contaba la espera del candado. Ahora va dentro de `pesado.sh`, y el lote espera si el disco baja de 6 GB.

## Preguntas de balance para el dueño
1. **El Sombreronrón:** dos golpes en el mismo punto clavan un solo listón, porque tres listones juntos no hacen triángulo. ¿Así?
2. **La Maullorona:** contra un rival con 10 veces la vida dejó a un gato de 68 % en 20 %, porque los 7 lagrimones van siempre por el más herido. Es fuerte rematando. ¿Bajamos el bono por vida faltante (0.5·P)?
3. **Miauzart:** el encore repite el daño de la siguiente ulti al 60 %. Con una ulti MD fuerte puede ser mucho; lo detiene el tope de 45 %. ¿Bien?
4. **Ricardo Garjona:** no alarga los aturdimientos (para que no haya bloqueos). ¿Así?
5. **Tetrimiau y Shakimiau:** las celdas que sostienen algo aguantan, para que no se hunda el barco gratis. Se ve como una fila «casi» borrada. ¿Te gusta, o prefieres otra salida?

## Cómo retomar
- Diseño: `docs/post-p3/05-tanda-2.md` §4 y las fichas en `04-roster.json` (`post.tanda = 2`).
- Código: `game/src/battle/multidimPost/` (kit, powersA–C, hooks, turn, hud), `game/src/data/multidimPowersPost.ts`, `game/src/battle/fx/multidimPostFx.ts`.
- Sin commits. Nunca el puerto 5173.

## Última actualización
2026-10-29 (cierre)
