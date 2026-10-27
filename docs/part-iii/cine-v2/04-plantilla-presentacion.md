# 04 · La plantilla de presentación (una película por etapa, desde los datos)

> Agente FILM-ACTO1, ronda 4 (2026-10-26). La usan los actos I a IV. Código: `game/src/film/films/plantilla/` (`index.ts` puro, `sets.ts` con Pixi, `samples.ts` para DEV). API general de películas: [02-api.md](02-api.md).
> ⚠️ Carpeta con spoilers de la Parte III.

## 1. Para qué sirve

El dueño pidió un video antes de **cada** batalla. Las batallas importantes tienen su película hecha a mano (F01 en B-5, F07 en B-9, F03, F05…). Todas las demás etapas de la Carta reciben **una película armada con sus propios datos**, sin escribirla a mano.

El gancho de MECÁNICAS-IMPL (`game/src/app/stageIntro.ts`) decide, en orden:

1. Una película registrada para la etapa: el id de `stages[].film` (por ejemplo `F01`; la búsqueda acepta mayúsculas) o el id de batalla `p3d_<caja>_<n>`.
2. **Esta plantilla** (`registerBriefingTemplate`), que ya queda registrada al cargar el motor (`film/films.ts` importa `films/plantilla`).
3. La tarjeta animada de MECÁNICAS, si algo falla.

Una presentación vista no se repite (eso lo guarda el gancho). La primera vez no se salta; después sale el chip SALTAR (regla del motor para `kind: 'briefing'`).

## 2. Qué cuenta (cinco tiempos, unos 27 s, 0 clics)

| Escena | Tiempo | Qué se ve | Dato que usa |
|---|---|---|---|
| `donde` | 0–5,2 s | La fachada del lugar con **su nombre encendido en el letrero**, llovizna, la mosca del canal («LA BORRACHA · B-3») y el sello de la etapa (B-3, ÉLITE o JEFE) | `title`, `tag`, `kind`, `dimName`, `n` |
| `pasa` | 4,7–10,3 s | Un cintillo de noticiero con QUÉ PASA. Las huellas de Cerito cruzan la calle hasta la puerta, y **el haz de Luzterna las recorre hasta que brillan**: la acción muda de Luzterna (su luz encuentra el rastro) | `pasa` |
| `rival` | 10,3–15,9 s | *Zoom* brusco a la puerta: el rival sale con su propia pintura, la placa con su nombre y su frase en un globo | `rival.name`, `rival.slug`, `rival.line` |
| `regla` | 15,5–21,9 s | **La regla, mostrada con el simulador real**: los dos barcos, el agua y el mismo tiro bien hecho (✔) y mal hecho (✘), dibujado mientras vuela; abajo, la explicación honesta. Sin demostración, las líneas de la regla como tarjetas | `rule.demo` (de `battle/demo.ts`), `rule.lines` |
| `riesgo` | 21,9–27 s | La página de la Bitácora sube y **su letra** escribe LO QUE ARRIESGAMOS (nunca su nombre); la estimación honesta en vivo («CON ESTA TRIPULACIÓN: 72 %») y las huellas que paga la primera victoria | `stakes`, `estimate()`, `huellas` |

- Cada tiempo sigue los dos ritmos: presentar, mostrar, consecuencia y avanzar.
- La estimación se dibuja con dígitos horneados antes del reloj: nunca se crea una textura mientras corre la película.
- La música es derivada, nunca una original: en la Borracha, `drunck.barra` para las normales y `drunck.battle` para élite y jefe. Si la pieza es más corta que la película, se repite en su loop (`filmEdit`, ver [02-api.md](02-api.md) §2).

## 3. Cómo la viste cada acto (pieles)

Cada caja usa los mismos cinco tiempos con su propio estilo. La Borracha ya está registrada; las demás cajas usan la piel neutra (la pintura del juego a 16:9) hasta que su acto registre la suya.

```ts
// en el index de tu acto (código puro; se ejecuta al importar)
import { registerBriefingSkin } from '../plantilla';

registerBriefingSkin('p3d_superheroes', {
  style: 'comic',                 // cualquier id del catálogo (catalog.ts)
  aspect: 16 / 9,                 // el formato de la caja
  tv: false,                      // true = la tele 4:3 de la Borracha (esquinas, barrido)
  type: 'tv',                     // tipografía de tarjetas (TypeStyle)
  track: { normal: 'fut.vineta', elite: 'fut.vineta', boss: 'fut.vineta.noticiero' },  // derivadas
  caption: 'PRESENTACIÓN · CIUDAD MAYÚSCULA',
  pal: { ink: 0x10081c, plate: 0x2a3d8e, accent: 0xffd23a, paper: 0xfff6e0, text: 0xfff6e0 },
  backdrop: () => import('./plantillaFondo'),   // opcional: el lugar detrás (Pixi, perezoso)
  rain: 0,                        // llovizna sobre el lugar (0 = nada)
});
```

**El fondo** (`backdrop`): un módulo con `export function backdrop(ctx: SceneCtx, a: { title: string; seed: number })` que devuelve `{ root: Container, glows: Sprite[], door: [x, y] }`:

- `root`: el lugar dibujado una vez (se hornea estático);
- `glows`: los brillos que se encienden y respiran (el letrero);
- `door`: el punto adonde llevan las huellas y de donde sale el rival.

El de la Borracha es `borrachaFacade` en `plantilla/sets.ts` y sirve de modelo. Sin `backdrop`, se usa ese.

## 4. Probar

- `?film=plantilla_b1` … `?film=plantilla_b9` (solo DEV): la plantilla llena con los datos reales de cada etapa de la Borracha (`regiones.json`). La estimación es una muestra fija y la regla la calcula el escenario con el `mareo` de la etapa.
- Para una caja nueva: registra su piel y prueba con `briefingFilm(datos)` en una prueba. En el juego, entra por la Carta.
- Pruebas: `game/tests/filmActo1.test.ts` (bloque «the briefing TEMPLATE»). Revisan que las 9 etapas den una película válida de 20 a 60 s, con música derivada, cero clics y piel por caja.

## 5. Límites conocidos

- Los gatos nuevos de cada caja salen con su pintura solo si `rival.slug` existe. Sin pintura, se ve un signo de interrogación en la puerta.
- La tripulación del rival (`rival.crew`) todavía no se dibuja (solo trae nombres, no pinturas).
- La demostración solo existe para las reglas que calcula `battle/demo.ts` (`mareo`, `donas`, `botellas`). Para las demás reglas (sillas voladoras, Rima, Lista VIP), la película de esa batalla se hace a mano o se muestran las líneas.
