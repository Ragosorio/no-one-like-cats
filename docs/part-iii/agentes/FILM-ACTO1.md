# FILM-ACTO1 — películas del Acto I (ronda 4, oleada 2)

**Qué estoy haciendo:** TERMINADO. Entregado al coordinador. Sin commits ni push.

**Verde al cierre:** `tsc` limpio · `vitest` 74 archivos / 948 pruebas (2 saltadas) · `tests/filmActo1.test.ts` 40 pruebas.

## Hecho

**Motor** (cambios chicos y compatibles, aprobados por el coordinador y avisados a CINE):
- `film/registry.ts`: `getFilm` acepta mayúsculas (los `F01`/`F07` de `regiones.json`).
- `film/types.ts` + `film/timeline.ts`:
  - `FilmDef.from`: película-fragmento. Ojo: `'#36'` = c37, porque las direcciones de compás empiezan en 0.
  - `filmEdit`: una pieza derivada más corta que su película se repite en su loop de `tracks.json`.
- `film/texturegc.ts` + `film/index.ts`: `playFilm` apaga el GC de GPU de Pixi (`renderer.gc.enabled`) mientras la película suena. Las texturas horneadas volvían a subirse a los 60 s y daban tirones de 0,3 a 1,9 s.
- `film/catalog.ts` y `film/styles/index.ts`: una línea cada uno que incorpora los estilos gráficos.
- Docs: `cine-v2/02-api.md` §12 (la trampa) y §18; `cine-v2/03-estilos-graficos.md`; `cine-v2/04-plantilla-presentacion.md`.

**Estilos** (`styles/grafico.ts` y `grafico.catalog.ts`): tv, sombras, estencil, fotocopia, vhs, cartel, comic, anime, pixel y plastilina.

**Kit del Acto I** (`film/films/acto1/kit/`): TvScreen, Bitacora, luzOf, lanternAt, Beam, StaticKitten, Homiau, flame, tailTip, balloon, popIn, rigPt, Drive y warmAll.

**Películas** (`film/films/acto1/`; ids estables, los usa MECÁNICAS-IMPL en H70–H74):

| id | Estilo | Duración | Clics | Música |
|---|---|---|---|---|
| f01 «Oficial Dona» (B-5) | Intro policiaca de los 70 en la tele: pantalla partida, cuadro congelado, regla mostrada con `battle/demo.ts` | 25 s | 0 | `drunck.barra` |
| f02 «El precio de bajar» | Teatro de sombras de manos + cortes a la mesa | 50 s | 1 | `drunck.resaca` |
| f03 «NINGUNA CAJA ES HOGAR» | Esténcil y cartel de propaganda | 35 s | 0 | `drunck.battle` |
| f04_prologo … f04_epilogo (6) | Cine mudo, viñeta redonda, iris, intertítulos art déco; R7 aplicada | 20 / 25,5 / 25 / 25 / 25 / 20 s | 1 en Donería, Hipo-Mart y parque | `drunck.cinemudo` (pendiente del OK del dueño) |
| f05 «La Batalla de Gatos» | Flyer fotocopiado | 30 s | 0 | `emen.publico` (en loop) |
| f06 EM%EN «Cuadra 8» | VHS de cámara + tipografía cinética sobre bombo y caja; el color vuelve desde Canelo; la linterna es el único color en el quiebre | 187,8 s | 3 (¡UUUH!, LUZ, ¡MIC!) | `emen` (original) |
| f07 «El Cadenero» (B-9) | Cartel de lucha libre | 30 s | 0 | `oh_shit.antes` (en loop) |
| f08 OH SHIT | Collage de 11 universos; la tele se raja y se rompe | 142,3 s (c37 → fin) | 3 (¡SALTA!, ¡GRITA!, ¡CAE!) | `oh_shit` (original, fragmento) |

**Plantilla de presentación** (`film/films/plantilla/`): una película por etapa armada con sus datos, en cinco tiempos: DÓNDE, QUÉ PASA (la acción muda de Luzterna), CONTRA QUIÉN, SU REGLA demostrada y LO QUE ARRIESGAMOS con la estimación en vivo. Dura ~27 s y tiene 0 clics. Tiene pieles por caja (`registerBriefingSkin`; la Borracha sale de `dims[].look = 'tv'`, sin literales de caja). DEV: `?film=plantilla_b1` … `plantilla_b9`.

**Rendimiento** (Apple M4, Chrome sin cabeza a 1920×1080, limitado a 60 Hz, calidad alta):

| Película | fps | p99 | Máximo |
|---|---|---|---|
| f01 | 60 | 16,8 ms | 16,8 ms |
| f06 | 60 | 16,8 ms | 33 ms (2 cuadros) |
| f08 | 60 | 16,8 ms | 16,8 ms |
| plantilla_b3 | 60 | 16,8 ms | 16,8 ms |
| f03 | 59,7 | 16,8 ms | 100 ms (un cuadro, con la máquina cargada; el fork la midió limpia) |

Las demás, según los forks: 60 fps y p99 16,8 ms.

**Suplentes (para cambiar cuando el dueño apruebe a los gatos nuevos):**
- Homiau: dibujado en código (`kit` → `Homiau`), en F02, F04, F05, F06 y F08.
- Borrón: `kage_ninja_cat` + sello de mano blanca en código (F02). En F06 aparece como imagen fija en el público.
- EMIAU: `headliner_rock_cat` + cadena con espina de pescado en código (F05, F06).
- El Cadenero: `granbigote_sumo_cat` + máscara, lentes y auricular en código sobre imagen fija (F07).
- Cerito / REGISTRO 000: silueta de `copito_snowball_cat` llena de estática, con ojos encendidos.
- Vecinos de F06: `nube_dream_cat`, `almohadon_pillow_cat`, `sonambulo_sleepwalker_cat`, `escarcha_frost_cat`, `burbujas_fizz_cat`, `cometin_stardust_cat` (elegidos para que no sean naranjas).
- F05: `margarita_daisy_cat`, `guijarro_pebble_cat`, `ronron_purr_cat`.
- F07: `chispa_sparkler_cat`, `tamborin_drum_cat`, `manzanita_apple_cat`.
- F08: Murciégato, Gato Araña y sus variantes, Gatzilla, Comecroquetas y los dioses egipcios (en código); vaquero = `supernova_gunslinger_cat`; familia de plastilina = `almohadon_pillow_cat`, `mochi_bell_cat`, `ronron_purr_cat`.
- F03: los Disruptores genéricos son siluetas de `brecha_crowbar_cat` y `grafitera_spray_cat` (aprobados).

**Hojas de contacto** (`<scratch>/fa1/sheets/`): `f01`, `f01-rm`, `f02`, `f02-rm`, `f03`, `f03-rm`, `f04_*`, `f04-hits`, `f05`, `f05-rm`, `f06`, `f06-rm`, `f07`, `f07-rm`, `f08`, `f08-rm`, `plantilla_b1`, `plantilla_b2`, `plantilla_b3` y `plantilla-rm`. Cada carpeta tiene su `sheet.png`.

## Falta (para el dueño o la siguiente oleada)

1. Escucha con audio real: en Chrome sin cabeza el reloj fue interno, así que la sincronía de las palabras de F06 con el bombo no se oyó.
2. Cambiar los suplentes cuando ARTE tenga a Homiau, EMIAU, El Cadenero, Borrón y Cerito.
3. Dar el OK a `drunck.cinemudo` (F04), que agrega un timbre.
4. B4 de F04 pide que el piano calle: el motor no tiene llave de volumen por escena.

## Cómo retomar

- Vite propio: `cd game && npx vite --config <scratch>/fa1/vite.fa1.config.ts` (puerto 5641, sin HMR). Ahora está apagado.
- Capturas: `<scratch>/fa1/pp/`.
  - `sheet.mjs`: hoja de contacto.
  - `run_music.mjs`: tiempos a 60 Hz; contesta la invitación de sonido.
  - `bins.mjs`: costo por tramo.
  - `tprobe.mjs`: tiempo de un `render(m)`.
  - Siempre con `PROF=<scratch>/fa1/prof-*`; los perfiles ya se borraron.
- `<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`.

**Última actualización:** 2026-10-27, 00:20.
