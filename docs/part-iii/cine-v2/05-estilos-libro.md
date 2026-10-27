# 05 · Los estilos de libro (Acto III) y el kit de la Biblioteca

> Agente FILM-ACTO3, ronda 4 · oleada 2 (2026-10-26). Lo leen quienes producen películas. API general: [02-api.md](02-api.md) (§19 resume lo nuevo del motor).
> ⚠️ Carpeta con spoilers de la Parte III.

## 1. Los ocho estilos

Código: `game/src/film/styles/libros.ts` (Pixi) y `libros.catalog.ts` (catálogo puro). Se registran con una línea en `film/catalog.ts` y otra en `film/styles/index.ts`. Sus tratamientos de gato también quedan en `CAT_BAKES`, así que cualquier película puede pedir `{ slug, bake }` con ellos.

Todos son genéricos: cada uno trae su tratamiento del gato (un horneado que se hace una vez), su post y las texturas que usan sus sets.

| id | Qué es | Tratamiento del gato (`bake`) | Texturas (`ctx.tex`) | Lo usa |
|---|---|---|---|---|
| `libros` | Lámina de libro ilustrado victoriano: pluma sepia temblorosa y acuarela plana de 3 valores, con pigmento en los bordes y granulado | `libros` | `lb:paper` (papel crema con fibras y manchas) | Las escenas «reales» del acto, la oscuridad de H85, la piel de la plantilla |
| `popup` | Libro desplegable: la pintura como recorte de cartulina impreso (4 valores, fibras, el pliegue oscuro en los pies) | `recorte` | `pp:card` (cartulina) | F18 |
| `dore` | Grabado de Doré: líneas de buril que siguen la forma, más gruesas en lo oscuro, cruzadas en las sombras hondas; tinta sobre crema | `grabado` | `dr:paper` | F19 |
| `expresionismo` | Expresionismo alemán (Caligari): 3 tonos pintados en verde y sepia, contorno grueso y quebrado, rayas pintadas en la sombra | `caligari` | `ex:streaks` (pinceladas diagonales) | F20 |
| `tecnico` | Plano técnico blanco sobre blanco: solo contornos gris perla y un tramado de 45° muy ralo | `tecnico` | `tc:grid` (cuadrícula) | F22, y La Mano «sin tramado» de F19 |
| `tinta` | Noir de tinta y aguada: 4 valores de aguada fría, bordes de tinta negra que sangran un poco; el post conserva un solo tono cálido | `tinta` | `tn:wash` (manchas de aguada) | F23 |
| `pirata` | Señal pirata de televisión: separación de color, líneas de barrido, posterizado y sobresaturado | `senal` | `pi:bars` (barras de color), `pi:scan`, `pi:snow` | F24, el monitor de la cola de F23 |
| `datamosh` | La lámina de libro bajo un post de compresión rota (el filtro lo monta el set) | `libros` | `dm:blocks` | F25 |

### Dos herramientas del kit de estilos

- **`engrave(baker, contenedor, opciones)`**: dibuja una composición en valores de gris (formas, una luna, pinturas de gatos) y la convierte, una sola vez y durante la carga, en el mismo grabado de Doré. Las líneas son paralelas y apenas curvas: nunca un remolino. Opciones: ángulo, separación, curvatura (`flow`), umbral del cruce (`cross`), tinta y papel. Devuelve la textura y su posición, como `Baker.raster`.
- **`moshFilter(otraLamina)` + `setMosh(filtro, …)`**: el *datamosh*. Por macrobloque:
  - unos bloques se quedan con un desfase viejo que crece a lo largo de un vector de movimiento: píxeles arrastrados por el cuadro anterior;
  - otros toman el color de la otra lámina (`uB`): un cuento que se derrite en el siguiente;
  - otros se vuelven su color promedio: la compresión.
  - Tiene dos zonas limpias: `clean` es un círculo (donde cae la luz de la linterna) y `wall` es una pared vertical (BASTA). Ahí la página aguanta.
  - Todo es función del tiempo. Con «Reducir destellos» (`slide`), los bloques se deslizan en vez de saltar.
  - Va en un contenedor de pantalla completa con `BIG_AREA()` y se declara en `FilmSet.filters`.

## 2. El kit de la Biblioteca (`game/src/film/films/acto3/kit/`)

La gramática del acto: **la pantalla es un libro abierto**, y en Libros **todos hablan como texto de libro**.

| Pieza | Qué hace |
|---|---|
| `BookFrame` | Márgenes de papel crema con la lámina dentro de una regla doble, la sombra del pliegue, la curva de las páginas, títulos corridos y folios. Tiene dos mitades, para inclinarlas (F20), partirlas (F25) o quemarlas (F23). `set({ open, tilt, split, gutter, lift })` |
| `Printed` | Una línea de texto impresa junto a quien habla, con la tipografía de cada uno (`VOICE`). Se revela por ancho. Canelo va en letras sueltas y chuecas, con manchas de grasa y temblor opcional; Luzterna con su letra (Permanent Marker azul); La Mano en el margen (Playfair cursiva, fría); Esquirla en Rubik Glitch; Brecha y Garbancito en esténcil; El Lobo con capitulares de cuento viejo; el expediente a máquina. Opciones: placa de papel detrás (lectura sobre zona calmada) y escritura en espejo |
| `Bitacora` | LO QUE ARRIESGAMOS con su letra, nunca su nombre: la página sube, el lápiz escribe con un brillo azul tenue. Tiene `big` (una última línea grande) y `rage` (letra temblorosa) |
| `luzOf` / `lanternAt` / `Beam` / `bob` | Luzterna siempre flotando, el punto de su linterna, el haz con que lo carga todo |
| `tailTip` / `flame` / `FLAME` | La llama de Canelo: `normal`, `sesenta` (desde H85), `baja`, `minima`; `draft` = vela con corriente (F20) |
| `StaticKitten` | Cerito de estática sobre la silueta de `copito_snowball_cat` (nunca `nadie_static_cat`). Tiene `fray`: sin luz, se deshace por los bordes |
| `manoFigure`, `garbancito`, `esquirlaFigure` | Los suplentes con sus rasgos dibujados en código: la mano blanca con la uña-plumín, el pañuelo rojo y el visor roto con el brazo de *glitch* |
| `demoShot` / `demoFalls` / `fitField` | Tiros reales de `battle/demo.ts`, con la misma física que la batalla. Las presentaciones los dibujan cuando enseñan una regla |
| `filmDuck` / `MusicDuck` | Silencio bajo la imagen como función del tiempo de película (el FIN de F19). Se suelta en `destroy` |
| `jagged` | Letras pintadas a mano y quebradas (intertítulos expresionistas) |
| `textos.ts` (puro) | Las palabras que importan a las reglas (LO QUE ARRIESGAMOS, los cargos, la sentencia). Las pruebas las leen |

## 3. La plantilla para las presentaciones genéricas

Las etapas de Libros sin película propia (L-1 a L-4, L-6 a L-8) usan la plantilla de FILM-ACTO1 con la piel de la Biblioteca:

- `registerBriefingSkin('p3d_libros', …)` en `films/acto3/index.ts`;
- estilo `libros` a 16:9;
- tipografía `davinci`;
- música `no_wey.melodia` (normal), `fut.fosa.niebla` (élite) y `distor.senal` (jefe);
- fondo `films/acto3/plantillaFondo.ts`: una sala de lectura con el nombre de la etapa en un letrero dorado sobre una puerta en arco.

## 4. Trampas

- Pixi compila los shaders como **GLSL ES 1.0**:
  - no se indexan arreglos con variables;
  - una variable no puede llamarse como una función (`step`).
- El papel crema tiene el mismo tono que el acento cálido del post `tinta`. Por eso en F23 el libro va en papel gris (`BookFrame({ paper })`).
