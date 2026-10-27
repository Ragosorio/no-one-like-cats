# Rutas de desarrollo, partidas de prueba y capturas

El juego se puede abrir directo en casi cualquier pantalla con un parámetro en la URL: un laboratorio, una batalla, un Momento musical, una isla 3D o una partida de prueba ya avanzada. Esta guía junta todas las rutas que existen hoy (leídas de `game/src/main.ts` y de cada laboratorio), las partidas de prueba y los trucos para sacar capturas sin pantalla.

Guías hermanas: [arquitectura.md](arquitectura.md) · [agregar-gato.md](agregar-gato.md) · [agregar-historia.md](agregar-historia.md) · [cines-y-estados.md](cines-y-estados.md) · [agregar-momento.md](agregar-momento.md) · [dimensiones-y-gateras.md](dimensiones-y-gateras.md) · [CONTRIBUTING](../../CONTRIBUTING.md)

---

## 1. Arrancar

```bash
cd game
npm ci
npm run dev        # http://127.0.0.1:5173
```

- El servidor escucha en `127.0.0.1:5173` (`game/vite.config.ts`).
- Hay dos páginas: `index.html` (el juego) y `rupturas.html`, la porción vertical aislada de la Parte II, que **nunca toca tu partida**.
- Sin variables de entorno, todo el arte sale de `game/public/`.

Las rutas marcadas **solo dev** funcionan únicamente con `npm run dev` (`import.meta.env.DEV`). Las demás también funcionan en el sitio publicado: https://ragosorio.github.io/no-one-like-cats/?scene=dev

---

## 2. Laboratorios (también en el sitio publicado)

Ninguno toca tu partida.

| Ruta | Qué hace | Archivo |
|---|---|---|
| `?scene=dev` | El **LABORATORIO**: una página que lista todos los laboratorios, qué hacen y qué guía los explica. | `scenes/DevLab.ts` (lista `LABS`) |
| `?dev=1` | Agrega un botón **LAB** a la pantalla de título que lleva a `?scene=dev`. | `scenes/DevLab.ts` |
| `?scene=catlive` | Todos los gatos como marionetas vivas. `&cat=<slug>` uno grande · `&cats=a,b,c` unos cuantos · `&lote=b\|c\|parte2` las pinturas nuevas (`data/art-parte2.json`) · `&rig=1` dibuja el rig encima. Click en un gato = recorre sus emociones. Funciona con cualquier slug, aunque ningún gato lo use todavía. | `scenes/CatLiveLab.ts` |
| `?scene=fxlab&cat=<slug o id>` | Las secuencias grandes con el gato que elijas: revelación (normal, duplicado, holo), elemento nuevo, invocación, estrellas, portada del periódico. | `scenes/FxLab.ts` |
| `?scene=art` | Compara estilos de render de un gato (isla, cómic, Battle Form, tinta) y prueba una revelación. | `scenes/ArtLab.ts` |
| `?scene=shiplab` | Todas las pieles de barco (jugador, enemigos, jefes) con tripulación y estados. | `scenes/ShipArtLab.ts` |
| `?scene=sandbox` | Arena para ver cómo se rompen los barcos. | `scenes/BattleSandbox.ts` |
| `?scene=battle` | Una batalla de prueba (`dev/devBattle.ts`); al terminar, otra igual. | `main.ts` |
| `?scene=islandlab` | La isla y su cámara, sin partida. | `scenes/IslandSandbox.ts` |

## 3. Saltar a una parte del juego

| Ruta | Qué hace | ¿Solo dev? |
|---|---|---|
| `?scene=island` / `?scene=map` | Carga tu partida y salta directo a la isla o al Diario del Mar. | no |
| `&new=1` (con `island` o `map`) | Empieza una partida nueva. **Reemplaza la partida de ese navegador** (hay respaldo en Ajustes › RESPALDOS). | sí |
| `?stage=Z-S` | Carga la partida y entra a esa batalla de campaña: `?stage=2-9` es la zona 2, etapa 9 (el jefe). | sí |
| `?scene=battle&music=liky_fight` | La batalla musical de prueba: el plan `dev_liky_fight` de `data/music/battles.json`. | sí |
| `?scene=region&region=<id>` | Una isla 3D de la Parte II. Ids (`regions/index.ts`): `paginas`, `nacar`, `reflejo`, `invertidas`, `corona`, `cometa`, `suenos`, `olvidada`, `umbral`. | sí |
| `?momento=<id>` | Un Momento musical suelto, con las reglas de la primera vez. Ids: `liky_fight`, `when_i_lose`, `te_odio`, `hemkade`, `circus_malus`, `yonose_todo` y `drunck` (Parte III). Ver la sección 5. | sí |
| `?momento=lab` | El laboratorio del tratamiento cel de los Momentos: `&cats=a,b` y variantes `&v=flat=0.5,radius=5;…`. | sí |
| `?scene=cajas` | La **Carta de las Cajas** (Parte III), en modo dev. Para que tenga sentido, combínala con `&save=h65-normal`. | sí |
| `?scene=caja&set=bar\|calle` | El set de una dimensión de la Parte III, solo (`window.__caja`). `&cine=<id>` reproduce una de sus cines como repetición (no guarda nada); `&flow=bar\|salida` corre el flujo entero como repetición y `&real=1` lo corre de verdad sobre la partida cargada. | sí |

## 4. Modificadores

| Parámetro | Qué hace | ¿Solo dev? |
|---|---|---|
| `?save=<fixture>` | Copia `game/test-saves/<fixture>.json` a tu ranura de guardado (`nolc-save-v1`), quita el parámetro de la URL y sigue. **Pisa la partida de ese navegador.** | sí |
| `?speed=4` | El reloj de la economía corre 4 veces más rápido. Las batallas no. | sí |
| `?realtime=1` | GSAP sigue el reloj real aunque la pestaña esté en segundo plano (`lagSmoothing(0)`). Úsalo en pruebas sin pantalla. | sí |

Se combinan: `?save=post-boss3&scene=map`, `?save=rupturas-h44&scene=island&speed=4`, `?save=h65-normal&scene=cajas`. La partida de prueba se carga **antes** de la ruta.

---

## 5. Partidas de prueba

Viven en `game/test-saves/`. Se cargan con `?save=<nombre>` (sin `.json`). Las que dicen "Parte II" se generaron **desde el código**, pasando por los sistemas reales del juego; sus generadores están en `game/scripts/make-*.ts` y se corren con `cd game && npx vite-node scripts/<archivo>.ts`.

| Nombre | Qué es |
|---|---|
| `post-boss1` | Parte I: Jefe 1 vencido (Reino 6). |
| `m2-zone2`, `zone2-par` | Parte I: zona 2 recién abierta. |
| `m2-preboss2`, `m2-postboss2` | Parte I: antes y después del Jefe 2. |
| `post-boss2`, `pre-boss3`, `m2-preboss3` | Parte I: después del Jefe 2, camino al Jefe 3. |
| `post-boss3` | Parte I: Jefe 3 vencido (Reino 22). La partida "vieja" de referencia para probar cambios. |
| `late-game` | Parte I avanzada: 5 jefes, Reino 36, 23 gatos. |
| `post-story` | La historia del Capítulo 1 terminada (6 jefes, Reino 38). |
| `post-finale` | La Parte I completa, Grietas incluidas: la puerta a la Parte II. |
| `isla-m2` | Isla temprana (Reino 6, tres hábitats) para probar la isla. |
| `casino` | Partida temprana con el casino todavía sin estrenar. |
| `casino-v1` | La misma etapa, con el casino ya jugado (boletos, pity y estadísticas). |
| `rupturas-mid` | Parte II, Oleada 1 a la mitad (H35 activa). |
| `rupturas-mid-v1` | La misma, en la forma de la versión 1 de la partida (prueba migraciones y el reinicio narrativo). |
| `rupturas-fin` | Parte II: Oleada 1 terminada (H41), con colecciones y música. |
| `rupturas-h44` | Parte II: H44 activa, con su Momento musical sin ver (`make-h44-fixture.ts`). |
| `rupturas-o3` | Parte II: inicio de la Oleada 3 (`make-o3-fixture.ts`). |
| `rupturas-o4` | Parte II: inicio de la Oleada 4 (`make-o4-fixture.ts`). |
| `rupturas-raro` | Parte II con registros inconsistentes a propósito: el juego tiene que cargarla sin romperse. |
| `h65-normal` | La Parte II recién terminada, jugada "normal": Reino 40, ~45 especies, hábitats construidos con las reglas reales. Es la entrada a la Parte III (`make-h65-fixture.ts`). |

Regla de oro al probar: **una partida nueva y una vieja**. La vieja es la que más se rompe.

---

## 6. La consola del navegador

Con `npm run dev` quedan colgadas algunas ayudas (las marcadas "siempre" existen también en producción):

| Global | Para qué |
|---|---|
| `__G` (siempre) | El estado del juego: `__G.s` es la partida. |
| `__gsap`, `__scenes` | GSAP y el administrador de escenas. |
| `__overflow()` | Lista textos y controles que se salen del panel abierto y textos encimados (`__overflow({ log: true })`). |
| `__story` (siempre) | `state()` (dónde estás, qué beats esperan), `beat('<id>')`, `speed(0.2)` (todo en cámara lenta), `freeze()` / `thaw()` (congela el render para una captura). |
| `__cine` (siempre) | `play(id)`, `replay(id)`, `skip()`, `pause()`, `resume()`, `abort()`, `state()`, `ids()`. Ver [cines-y-estados.md](cines-y-estados.md). |
| `__momento` | Mientras suena un Momento: `state()`, `result()`, `trace()`, `pause()`, `cut()` y, con `&scrub=1`, `render(m)` para dibujar cualquier instante. Al terminar, `__momento.last` trae el resultado, la traza y las advertencias. |
| `__catlab` | En `?scene=catlive`: `play(i, 'hop' \| 'depart' \| 'arrive' \| <reacción>)`, las animaciones con propósito. |
| `__caja` | En `?scene=caja`: la escena de la dimensión. |
| `__celLab` | En `?momento=lab`: las medidas de cada horneado. |
| `__rupturas` | En `rupturas.html`: `ready()`, `setHour(h)` y más. |

---

## 7. Capturas y pruebas sin pantalla

- **Nunca subas capturas al repo.** Son PNG: el `.gitignore` las bloquea y el deploy falla si una llega a `dist/`. Guárdalas fuera del repo y adjúntalas en tu PR.
- **Un puerto propio** si corres varias cosas a la vez: `npx vite --port 5191 --strictPort`.
- **`?realtime=1`** siempre en pruebas sin pantalla: una pestaña en segundo plano frena los tweens.
- **GPU real.** En macOS, Chrome sin cabeza con `--use-angle=metal` usa la GPU de verdad (60 fps); sin eso cae en SwiftShader y todo va lentísimo.
- **Coordenadas.** El juego es una caja lógica de 1920×1080 escalada a la ventana. Con una ventana de 1920×1080 los clicks caen 1 a 1 sobre las coordenadas de diseño.
- **Arnés incluido:** `game/scripts/headless-shot.mjs` maneja Chrome sin cabeza con pasos en JSON (`eval`, `wait`, `click`, `clickEval`, `shot`):

  ```bash
  cd game
  npm i --no-save puppeteer-core@24
  npx vite --port 5191 --strictPort &
  node scripts/headless-shot.mjs pasos.json /ruta/fuera/del/repo/
  ```

  ```json
  { "url": "http://127.0.0.1:5191/rupturas.html",
    "do": [{ "eval": "window.__rupturas.setHour(23)", "wait": 2000, "shot": "noche" }] }
  ```

  Tal como está espera a `window.__rupturas.ready()`, así que sirve para `rupturas.html`. Para el juego, cambia esa espera por la tuya (por ejemplo, que exista `__G`). La ruta de Chrome es la de macOS; ajústala en tu sistema.
- **Momentos sin manos:** `?momento=<id>&auto=great` (o `hit`, `miss`, `none`) lo juega solo; `&mq=low` prueba la calidad baja; `&scrub=1` + `__momento.render(m)` dibuja cualquier instante para hojas de contacto.
- **Animaciones lentas:** `__story.speed(0.2)` para revisar cuadro por cuadro; `__story.freeze()` para congelar justo antes de la captura.
- **Pruebas automáticas:** `npm test` corre `game/tests/` (vitest). Muchas usan las mismas partidas de prueba; si agregas una ruta o una partida, agrégale su prueba.
