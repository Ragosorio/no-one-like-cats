# ART-F · Arte del Lote F (Oleada 3) en el juego

## Qué estoy haciendo

Terminado: los 7 gatos del Lote F están en el juego, verificados y documentados. No hay nada a medias.

## Hecho

| Especie | Slug | Completo (KB) | Lite (KB) | Trazado |
|---|---|---|---|---|
| c_satelito | satelito_dish_cat | 5.278 | 787 | lanczos3, error 6,2 |
| c_tanquecito | tanquecito_fuel_cat | 6.166 | 878 | lanczos3, error 6,7 |
| r_escafandra | escafandra_fishbowl_cat | 6.751 | 969 | lanczos3, error 10,0 |
| r_grafitera | grafitera_spray_cat | 7.360 | 1.064 | lanczos3, error 7,4 |
| e_brecha | brecha_crowbar_cat | 8.340 | 1.186 | lanczos3, error 8,2 |
| l_jonas | jonas_whale_cat | 9.411 | 1.298 | lanczos3, error 8,9 |
| s_platillo | platillo_saucer_cat | 4.753 | 720 | lanczos3, error 9,5 |

- **Trazado:** ninguno se colapsó, así que no hizo falta mitchell ni 224 px. Los 7 lite pasaron a 240 px.
- **Compactación:** píxel idéntica.
- **Archivos:**
  - `game/public/cats-svg/<slug>.svg` y `lite/<slug>.svg`. Los manifiestos `game-export.json` y `lite/game-thumbs.json` solo ganan entradas (122 cada uno).
  - `game/src/data/catRigs.json`: 7 claves nuevas, ningún rig existente cambió.
  - Copias en formato MAI: `~/Desktop/MAI SVG/exports/game-rigs/<slug>.rig.json`.
- **Pins** (accesorios que no arrastran la cola, la cabeza ni las orejas):
  - el minisatélite de Satélito;
  - el tanque y las toberas de Tanquecito;
  - la llave inglesa de Escafandra, en dos partes;
  - la lata derecha y la capucha de Grafitera;
  - la garra, la punta, la barra y la hombrera de Brecha;
  - la tetera y el báculo de Jonás, en tres partes;
  - el platillo de Platillo.
- **Flotantes:** Platillo flota entero con el platillo, como Almohadón con su almohada. También flotan los objetos sueltos de Satélito (el satélite y las bolitas de la órbita), la nube de pintura de Grafitera y las burbujas de Jonás.
- **Suplentes:** quitados de `STAND_IN` en `game/src/art/catArt.ts`. El test `tests/rupturasO3.test.ts` ahora exige un rig y los dos SVG para cada especie, y que no haya suplente.
- **Verificado en headless:**
  - laboratorio `catlive` a 450 y 900 px: parpadeo, orejas, cola y viento;
  - revelación de Escafandra y de Platillo;
  - ficha del Catdex;
  - batalla con los 7 de tripulación;
  - Puerto Cometa: Escafandra en el mostrador del Taller con su arte real, y los 7 viven en la isla.
- **Pruebas:** typecheck limpio. `rupturasO3`, `rupturasO2` y `artBase` pasan solos (48/48). `storyScale.test.ts` falla, pero es un test nuevo y sin terminar de BALANCE-JEFES, no de este trabajo.

## Falta

1. Al publicar, con el OK del dueño, subir las 7 pinturas completas a `nolc-arte`. El cron lo hace en 6 h o menos; también se puede correr `publish.yml` a mano.
2. ~~Opcional: más brillo en el rayo de Platillo~~ **Hecho por MENORES (2026-10-10):** capa de luz vectorial en el SVG completo y el lite (`game/scripts/platillo-beam.mjs`); no hizo falta retrazar. Al publicar, subir también la versión nueva de `platillo_saucer_cat.svg` a `nolc-arte`.

Ya están hechos PROGRESO.md (7 filas en ENTREGADO), el doc 10 §2e «Lote F», la bitácora del doc 28 (punto 26) y la limpieza del scratch. No se hace commit.

## Cómo retomar

- **Fuentes:** `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/lote-f-astral/*.png`, de 1024 px. Nunca se copian al repo.
- **Reducir a 700 px** con sharp, kernel `lanczos3`. Si un trazado se colapsa en silueta (error > 22, típico de 50 a 130), repetir con `mitchell`.
- **Trazado completo:** dentro de `~/Desktop/MAI SVG`, correr `npm run mai -- vectorize <dir700> --preset high-color-preserved --output <vec>`. El error está en `<vec>/<slug>/high-color-preserved.json`, campo `premultipliedRgbMae`; lo normal es de 6 a 11.
- **Compactar:** `npx tsx scripts/game-export.ts <dirPlano> <out>`. Después hay que fusionar el `game-export.json` parcial en el del juego: el script lo sobreescribe, así que hay que agregar solo las entradas.
- **Lite:** `npx tsx scripts/game-thumbs.ts <dir700> <out> 240`. Si colapsa, pasarle `224`; 256 da silueta plana. Fusionar `game-thumbs.json` igual que el anterior.
- **Rigs:** editar a la vez `catRigs.json` y la copia de MAI. Los campos están en `docs/guias/agregar-gato.md` §4. `pins` son elipses que no siguen a la cabeza, las orejas ni la cola.
- **Laboratorio:**
  - Levantar Vite en un puerto propio, con HMR y `ws` apagados (nunca el 5191).
  - Abrir `?scene=catlive&cats=<slug1>,<slug2>` o `?scene=catlive&cat=<slug>&rig=1` para ver el rig.
  - En consola, `window.__catlab.puppets` permite forzar `sleeping`, `wind` y `emote('happy')`.
- **Puerto Cometa:** `?scene=region&region=cometa`. `window.__cometa.cam([x,y,z], dist, pitch, yaw)` mueve la cámara. Escafandra está cerca de (13, 2, 24).

## Última actualización

2026-10-10 11:10 (cerrado)
