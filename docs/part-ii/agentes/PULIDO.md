# PULIDO — estado del agente (para retomar si se corta)

Sin spoilers de historia. Encargo: 6 arreglos visuales/de flujo chicos de la Parte II, en este orden:
1. Espuma blanca del océano del motor 3D (todas las regiones).
2. Props del cielo O2/O3 tapan islas lejanas en archipiélagos grandes (isla 2D).
3. Re-verificar el encuadre de Hélice en `h45_ciudad`.
4. El paso de Plomito (después de H44) se salta en silencio si no está en la isla.
5. Maneki se ve muy chica en `h54_maneki`.
6. Piezas del cielo persistentes de Puerto Cometa (O3) quedan detrás del archipiélago.

## Qué estoy haciendo
Nada: los 6 arreglos están hechos y verificados sin cabeza. Solo queda que el coordinador los revise y los incluya en un commit (no hice commit ni push).

## Hecho
- **1. Espuma del océano** (`game/src/engine/world/ocean.ts`, solo el fragment shader; los vértices y `sample()` no cambian → paridad CPU=GPU intacta, `tests/engine.test.ts` verde).
  Causa: era un bug de aliasing. La espuma de cresta umbralizaba la altura POR VÉRTICE (malla de 5 u/quad en alto y 11 u/quad en bajo para olas de 7,5–34 u) sobre un ruido de 2,3/u que a media distancia se volvía rayas blancas largas.
  Cambio: altura de cresta Gerstner evaluada por píxel con LOD por ola (cada ola se apaga cuando es más chica que unos píxeles, `fwidth`), espuma en líneas finas sobre las crestas de los 2 oleajes grandes solo donde se apilan, rota en encaje por un ruido que se promedia al alejarse; se apaga entre 35 y 120 u. Las bandas de orilla usan bordes con `fwidth` (sin escalones). Se probó la profundidad por píxel desde la textura de alturas y se descartó (se ven sus texeles).
- **2 y 6. Cielo O2/O3 vs. islas** (nuevo `game/src/ui/story/skyLine.ts`; `o2Sky.ts`; `o3Sky.ts`).
  Causa O2: la raíz se montaba ENCIMA de `graded` (delante de todo) y las islas colgantes/galeón/Corona se colocaban desde `bounds.minY` (centro de la loseta más alta + 100), así que su parte baja caía sobre las islas de arriba.
  Causa O3: piezas en espacio de pantalla DETRÁS de todo el mundo, en posiciones fijas de pantalla: las tapaban islas, cielos de dimensión y el cielo O2.
  Cambio: `SkyLine` calcula el borde superior del archipiélago por columnas (losetas del plan + margen para edificios/árboles). O2 en reposo vive en `skyWorld` (detrás de las islas, delante de los cielos de dimensión, con el grade nocturno del mundo) y cada pieza sube (nunca baja) hasta despejar las islas bajo ella; mientras una escena maneja cualquier pieza (`drive`) la raíz vuelve DELANTE y las piezas vuelven (con easing) a los lugares que encuadran las escenas; `release()` las devuelve. O3: grieta y costura (las persistentes) suben en pantalla hasta despejar las islas (si las islas llenan la pantalla, salen por arriba) y se dibujan en la capa delantera de O3 (ya no las tapa nada); tug/graffiti/leviatán/ojo sin cambios.
- **3. `h45_ciudad`** (`ui/story/o2Cines.ts`, `regions/corona.ts`). Verificado sin cabeza: el plano de Hélice (alto, 14 m, pitch 0.62) la dejaba diminuta en el pavimento blanco, donde hubiera paseado, y la mochila (hija de su raíz, en z−0.35) le tapaba la cara. Cambio: fx nuevo `heliceHold` en Corona (una actividad de espera en el director de vida: la deja en la puerta de su sótano y la suelta al terminar la escena) antes del plano; plano bajo y cercano (`yaw 0.9, pitch 0.24, dist 8`); la mochila va en el suelo a su lado, hacia la derecha de la cámara.
- **4. Plomito en `h44_gravedad`** (`ui/story/o2Cines.ts`, `o2Sky.ts`). Causa: los pasos apuntaban a `species:c_plomito`; si no está en la isla (en una flota o aún no es tuyo; ningún fixture `rupturas-*` lo tiene) la cámara no se movía, nadie se dormía y solo quedaba la línea «…Plomito ya se durmió en la cubierta». Cambio: `plomitoHome(c)` decide. Si no está, la cámara va a TU barco y `O2Sky.plomitoAboard()` lo hace caer del cielo a la cubierta (el barco se hunde un poco, «¡CRIIIC!»), se duerme («Zzz») y desaparece al terminar la escena (stopper). Con SALTAR no se crea. Si no hay barco, aparece junto a tu casa.
- **5. Maneki en `h54_maneki`** (`ui/story/o3Cines.ts`, `o3Sky.ts`). Causa: cámara a zoom 1.05 y Maneki (96 px, como cualquier gato) en `home+(150,96)`, que en islas grandes queda detrás de un edificio (el Puerto en `rupturas-o4`). Cambio: mientras su escena la sostiene (`setManeki`), el holder crece a ×1.4 (con easing) y se dibuja encima de los edificios; la cámara va a zoom 1.3. Fuera de la escena vuelve a ser un gato normal.
- **Pruebas:** `npm run typecheck` limpio. `npm test` con la máquina saturada (load ~40 por otros agentes) dio timeouts en tests de simulación de batalla; al correrlos uno por uno pasan `rupturasStory`, `rupturasO2`, `forms`, `crystal`, `battleMusic` y `oleada3Cine`. Solo `rupturasO3` › FASES deterministic sigue pasando de su timeout propio de 60 s (63 s) por carga: es del simulador (BALANCE-JEFES), no de estos cambios. `engine.test.ts` (paridad del océano) verde.

## Falta
- Nada de este encargo. Las dos ideas opcionales que quedaban las **hizo MENORES (2026-10-10)**: despeje de islas para las piezas O3 temporales y un lugar libre para Maneki (`ui/story/manekiSpot.ts`). Texto original: aplicar el mismo «despeje de islas» a las piezas O3 temporales (tug, graffiti, leviatán, ojo); elegir un lugar libre para Maneki en islas grandes (hoy se dibuja encima del edificio solo durante su escena).

## Cómo retomar
- Vite propio en el puerto 5311 (HMR apagado, `server.ws:false`), config temporal en el scratch del agente. Nunca 5191.
- Chrome headless con `--use-angle=metal --disable-gpu-vsync --disable-frame-rate-limit`, perfil propio y CDP; driver puppeteer que se conecta por CDP (como `drive.mjs` de otros agentes).
- Regiones: `?scene=region&region=<id>`; el tier se fuerza con `quality3d` en `localStorage['nolc-settings']` (`alto` = malla de agua 180, `bajo` = 80).
- Isla con cielo O2: `?save=rupturas-o3&scene=island`; cielo O3 persistente: `?save=rupturas-o4&scene=island`. Para ver la banda de arriba: `cam.lookAt(bounds.minX..maxX, bounds.minY, false, 0.45)`.
- Escenas: `await import('/src/cine/index.ts')` y `__cine.replay('h45_ciudad' | 'h44_gravedad' | 'h54_maneki' | 'h45_corona')`; Corona desde `?save=rupturas-o3&scene=region&region=corona` (espera `__corona.ready`).
- Trampa: `getBounds()` desde la consola falla sobre `terrain.backdrops` (TilingSprite); por eso `SkyLine` usa las losetas del plan.

## Última actualización
2026-10-10, 12:10.
