# NO ONE LIKE CATS

**Cute cats. Terrible consequences.**

Una isla flotante llena de gatos que coleccionas, crías y consientes… y que luego mandas a hundir barcos piratas a cañonazos de bola de pelo. Gratis, sin anuncios, sin compras, sin energía. Se juega en el navegador y se instala como app.

**Jugar ahora:** https://ragosorio.github.io/no-one-like-cats/

**Laboratorio para desarrolladores:** https://ragosorio.github.io/no-one-like-cats/?scene=dev

**¿Quieres meterle mano?** Empieza por [Colabora](#colabora), el [mapa de repositorios](#mapa-de-repositorios) y el [índice de la documentación](docs/INDICE.md).

---

## Qué es

El juego avanza por partes, como una serie. Las dos primeras se juegan completas; la tercera se está haciendo.

| Parte | Nombre | Estado |
|---|---|---|
| Parte I | **El Primer Mar** (el Capítulo 1 y, después de los créditos, las Grietas del Multiverso) | En vivo |
| Parte II | **La Marea Imposible** | En vivo. Se abre cuando terminas la Parte I. |
| Parte III | **Fuera de la Caja** | En desarrollo. Todavía no está en la versión publicada. |

- **Tu isla de gatos.** Colecciona **120 gatos** de **15 elementos**: los 7 del Primer Mar (Fuego, Agua, Naturaleza, Tierra, Tormenta, Magia, Cósmico), los 6 que se cuelan por las Grietas del Multiverso (Hielo, Sonido, Sombra, Tiempo, Luz y Vacío) y los 2 de la Parte II (Cristal y Gravedad). Hay siete rarezas: Común, Raro, Épico, Legendario, Mítico, Heroico y Divino. Los 17 legendarios **primordiales** fundan cada elemento. Los 4 **Heroicos** y los 4 **Divinos** (los rotos) no se invocan: solo los pagan los campeones de las ligas del Podio. Cada gato tiene nombre, mañas, oficio y un lore que te va a dar ternura o miedo.
- **Resonancia.** Dos gatos se van a "invocar otro gatito". Las probabilidades se ven completas, sin letra chiquita.
- **Combate de artillería por turnos.** Apuntas, calculas el viento y disparas contra barcos modulares que se rompen celda por celda: casco, mástiles, cañones, la despensa. Tus gatos se transforman en su **Battle Form** y gritan sus ataques en inglés o japonés, como debe ser.
- **Parte I: El Primer Mar.** Seis zonas, jefes con mecánicas propias, una capitana (Luzterna) con más historia de la que admite y un periódico, el *Diario del Mar*, que publica cada victoria. Por el camino se abren el Podio (duelos de gato contra gato) y un casino honesto; después del final llegan las Grietas.
- **Parte II: La Marea Imposible.** Las estrellas empiezan a caer… para arriba. Hay ocho islas en 3D que recorres con tus gatos, de día y de noche, y un mundo que cambia de verdad cuando la historia lo dice. Trae escenas de cine que puedes volver a ver, batallas en el cielo, 34 gatos nuevos, formas nuevas para Canelo y niveles hasta el 100. También estrena seis **Momentos musicales**: videos interactivos al ritmo de las canciones originales del autor. Lo que tocas solo cambia la animación, nunca el resultado. Las canciones que encuentras se guardan en la **Fonoteca**.
- **Parte III: Fuera de la Caja (en desarrollo).** Un segundo mapa en 2D, la **Carta de las Cajas**, con dimensiones que se abren una por una. Cada dimensión tiene su propio estilo de arte y su propia regla de combate. No contamos más: la idea es que la vivas.
- **Gatos vivos.** No hay imágenes: cada gato es un SVG vectorial que respira, parpadea, mueve las orejas, te sigue con la mirada, bosteza y se estira.
- **"Espera o sigue jugando".** Nada te bloquea con energía ni te cobra por ir más rápido. Si algo tarda, hay otra cosa divertida que hacer mientras.

### Instálalo como app

El juego es una PWA: se instala, abre a pantalla completa con su propio ícono y funciona sin internet.

- **Computadora (Chrome / Edge):** botón **INSTALAR** en la pantalla de título, o el ícono de instalar en la barra de direcciones.
- **Android:** botón **DESCARGAR** en el título, o menú del navegador → *Instalar app*.
- **iPhone / iPad:** en Safari, botón *Compartir* (el cuadrito con flecha) → *Agregar a inicio*.

---

## Por qué existe este juego

> Hola, soy **ragosorio**.
>
> Lo que yo quería hacer en realidad era una herramienta para editar SVG: **[MAI SVG](https://github.com/Ragosorio/MAI-SVG)**. Para probarla en serio necesitaba un proyecto de verdad, con arte de verdad y exigencias de verdad. ¿Y qué mejor que un videojuego?
>
> Así nació NO ONE LIKE CATS. La idea fue evolucionando con muchísimas referencias (Dragon City, Castle Busters, el anime, los cómics, los periódicos viejos, los gatos de mi familia) hasta volverse algo propio. Lo hice con todo el corazón y de verdad espero que te guste.
>
> La misión es simple: **hacer el mejor juego posible, gratis.** Un juego diferente, con aire fresco, que no quiere cobrarte nada. Sobre todo, que sea para divertirse.
>
> Es totalmente de código abierto, y MAI SVG también. Los dos son para la comunidad: cualquier colaboración es bienvenida.

### Por qué SVG y no imágenes

Usamos SVG en lugar de imágenes porque **carga más rápido, se puede animar y no nos cuesta nada**. Esa regla aplica a todo el juego: gatos, íconos, barcos, efectos. El repositorio bloquea PNG/JPG/WebP/GIF a propósito y el deploy falla si alguno se cuela.

Cada gato tiene dos versiones vectoriales: una **ligera** que carga primero y una **completa**, con todo el detalle, que se baja cuando el gato se ve grande. Las completas pesan tanto que viven en un repo de arte aparte (ver abajo). Los estilos de arte, con ejemplos, están en [docs/arte/ESTILOS.md](docs/arte/ESTILOS.md).

---

## Mapa de repositorios

El proyecto vive en cuatro repos. Todo el código y todo el arte nacen en el primero; los repos de arte solo publican.

| Repo | Qué guarda | Dónde se ve |
|---|---|---|
| [Ragosorio/no-one-like-cats](https://github.com/Ragosorio/no-one-like-cats) | **El juego.** Código (TypeScript + PixiJS + three.js), datos, gatos en SVG (ligeros y completos), música, pruebas y documentación. Es la única fuente del arte. | https://ragosorio.github.io/no-one-like-cats/ |
| [Ragosorio/nolc-arte](https://github.com/Ragosorio/nolc-arte) | **El sitio de arte.** Solo tiene un workflow que toma el detalle completo de los gatos (`cats-svg/<slug>.svg`) del repo del juego y lo publica. No guarda arte en git. Comparte origen con el juego, así que las partidas y el CORS no se tocan. | https://ragosorio.github.io/nolc-arte/ |
| [Ragosorio/nolc-arte-2](https://github.com/Ragosorio/nolc-arte-2) | **El segundo sitio de arte**, para el arte nuevo cuando el primero se llene. El arte que ya existe nunca se muda. Está creado y configurado, pero **todavía no está activo**. | https://ragosorio.github.io/nolc-arte-2/ (aún sin publicar) |
| [Ragosorio/MAI-SVG](https://github.com/Ragosorio/MAI-SVG) | **La herramienta del autor** para vectorizar y editar SVG. Convierte pinturas en los SVG vectoriales puros del juego (completo y ligero) y en los rigs que los hacen moverse. | Se corre en tu computadora (editor local) |

Cómo se conectan (el deploy, los shards, las variables y qué tocar para agregar arte): [docs/REPOSITORIOS.md](docs/REPOSITORIOS.md).

---

## Empieza a programar

Necesitas Node 22 (el que usa el deploy).

```bash
git clone https://github.com/Ragosorio/no-one-like-cats.git
cd no-one-like-cats/game
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. Sin configurar nada, todo el arte se sirve desde `game/public/`: no necesitas los repos de arte para trabajar.

### Rutas de desarrollo

Las más útiles (la lista completa, con trucos para capturas sin pantalla, está en [docs/guias/rutas-de-desarrollo.md](docs/guias/rutas-de-desarrollo.md)):

| URL | Qué hace | ¿Solo con `npm run dev`? |
|---|---|---|
| `?scene=dev` | El LABORATORIO: todos los laboratorios en una página. | no |
| `?dev=1` | Muestra un botón **LAB** en la pantalla de título. | no |
| `?scene=catlive&cat=<slug>&rig=1` | Un gato vivo en grande con su rig encima. | no |
| `?scene=fxlab&cat=<id>` | Las secuencias grandes (revelación, invocación, estrellas, portada) con el gato que quieras. | no |
| `?save=<fixture>` | Copia una partida de prueba de `game/test-saves/` a tu ranura y sigue. **Pisa la partida de ese navegador.** | sí |
| `?stage=2-9` | Entra directo a esa batalla de campaña. | sí |
| `?momento=<id>` | Un Momento musical suelto (`&auto=great`, `&replay=1`). `?momento=lab` abre el laboratorio del tratamiento. | sí |
| `?scene=region&region=<id>` | Una isla 3D de la Parte II (`paginas`, `nacar`, `invertidas`, `corona`, `cometa`, `suenos`, `olvidada`, `umbral`, `reflejo`). | sí |
| `?scene=cajas` | La Carta de las Cajas (Parte III). Combínala con `&save=h65-normal`. | sí |
| `?scene=caja&set=bar` | El set de una dimensión de la Parte III (`set=bar` o `set=calle`). | sí |
| `?realtime=1` | Las animaciones siguen el reloj real aunque la pestaña esté en segundo plano (capturas sin pantalla). | sí |
| `?speed=4` | La economía corre 4 veces más rápido (las batallas no). | sí |

Partidas de prueba en `game/test-saves/`: `post-boss1`, `post-boss2`, `post-boss3`, `pre-boss3`, `late-game`, `post-story`, `post-finale`, `rupturas-mid`, `rupturas-h44`, `rupturas-fin`, `rupturas-o3`, `rupturas-o4`, `h65-normal` y más. Qué es cada una: [rutas-de-desarrollo.md](docs/guias/rutas-de-desarrollo.md#5-partidas-de-prueba).

### Pruebas y revisiones

Desde `game/`:

```bash
npm run typecheck                        # tipos (tsc --noEmit)
npm test                                 # vitest: game/tests/
npx tsx scripts/verify-missions.ts --all # revisa todas las misiones sin navegador
npm run build                            # tipos + build de producción en game/dist/
```

Con Node 22.18 o más nuevo, `node scripts/verify-missions.ts --all` también funciona sin `tsx`. `npm run build` es lo mismo que corre GitHub Pages en cada push a `main`.

---

## Colabora

**Aceptamos colaboraciones, y cualquier tipo de actualización es muy bienvenida.** Un gato nuevo, un elemento, un capítulo de historia, un barco, una animación, un arreglo de un bug, una traducción de un chiste que no se entendió, una mejora de rendimiento en tu teléfono viejito. Todo suma.

- **¿Quieres platicar una idea o preguntar algo?** Entra a **[Discussions](https://github.com/Ragosorio/no-one-like-cats/discussions)**. No tienes que programar: las mejores ideas de este juego salieron de conversaciones.
- **¿Ya tienes la idea clara?** Abre un issue con la plantilla **Idea**.
- **¿Encontraste un bug?** Plantilla **Bug**.
- **¿Dibujas?** Plantilla **Arte** para proponer un estilo o una pintura, o **Nuevo gato** si tienes un personaje en la cabeza.
- **¿Ya tienes el cambio?** Manda un Pull Request; la plantilla trae la lista de revisión.

Antes de mandar algo, lee **[CONTRIBUTING.md](CONTRIBUTING.md)**: los valores del proyecto, el tono, las reglas de oro y por dónde empezar según lo que sepas hacer (programar, dibujar, escribir, hacer música o probar).

Guías escritas contra el código real (en `docs/guias/`):

- [Arquitectura](docs/guias/arquitectura.md): el mapa del código.
- [Rutas de desarrollo](docs/guias/rutas-de-desarrollo.md): laboratorios, partidas de prueba y capturas.
- [Agregar un gato](docs/guias/agregar-gato.md): ficha, pintura MAI SVG, rig y cómo se consigue.
- [Agregar un elemento](docs/guias/agregar-elemento.md): afinidades, materiales, insignia, hábitat y descubrimiento.
- [Agregar historia](docs/guias/agregar-historia.md): misiones, diálogos, zonas y batallas de historia.
- [Cines y estados del mundo](docs/guias/cines-y-estados.md): escenas declarativas y un mundo que cambia con la historia.
- [Agregar un Momento musical](docs/guias/agregar-momento.md): partitura, pulsos, set y la regla de las canciones originales.
- [Dimensiones y gateras](docs/guias/dimensiones-y-gateras.md): la Carta de las Cajas de la Parte III, sin spoilers.
- [Agregar un barco](docs/guias/agregar-barco.md): planos, módulos, pieles, enemigos y jefes.
- [Animaciones](docs/guias/animaciones.md): gatos vivos, secuencias, GSAP y cómo previsualizar.

---

## Tus partidas y las actualizaciones

La partida vive en tu navegador (no hay servidor ni cuentas). Cuando sale una versión nueva:

- El juego avisa con **¡ACTUALIZACIÓN LISTA!**, guarda y recarga.
- Tu partida vieja se adapta sola a las reglas nuevas (migraciones y parches que **dan, reparan o reembolsan, nunca quitan**).
- **NOVEDADES** te cuenta qué cambió.
- En **Ajustes › RESPALDOS** hay copias automáticas, y puedes copiar tu partida como texto para pasarla a otro navegador o a la app instalada.
- **El Baúl** guarda un historial de tu isla y, en Chrome o Edge, puede escribir copias `.nocat` en una carpeta tuya. Son archivos reales en tu disco: borrar los datos del navegador no los toca.

Los detalles técnicos están en [docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md).

---

## Mapa de la documentación

Todos los documentos, uno por línea y agrupados, están en **[docs/INDICE.md](docs/INDICE.md)**. Los más útiles para empezar:

| Si quieres… | Lee |
|---|---|
| Entender el código | [docs/guias/arquitectura.md](docs/guias/arquitectura.md) |
| Ver los estilos de arte | [docs/arte/ESTILOS.md](docs/arte/ESTILOS.md) |
| Saber cómo se conectan los repos | [docs/REPOSITORIOS.md](docs/REPOSITORIOS.md) |
| Sacar una actualización sin romper partidas | [docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md) |
| Saber por qué PixiJS y cómo llegar a las tiendas | [docs/MOTOR-Y-PLATAFORMAS.md](docs/MOTOR-Y-PLATAFORMAS.md) |
| Leer el diseño de la Parte II (con spoilers de la Parte II) | [docs/part-ii/00-LEEME.md](docs/part-ii/00-LEEME.md) |

### Estructura

```
game/                 el juego (TypeScript + PixiJS v8 + three.js + GSAP, Vite, vitest)
  src/
    app/              flujos entre escenas (historia, batallas, regiones, cajas)
    art/              gatos vivos (malla + rig), carga de SVG, URLs y shards del arte
    audio/            música de la Parte II: catálogo, director, Fonoteca
    battle/           simulador de combate, barcos, disparos, jefes, reglas por elemento
    cine/             escenas declarativas (cámara, mundo, diálogo, sonido)
    core/             app, escenas, guardado, El Baúl, actualizaciones, PWA
    data/             contenido (content.json + módulos de cada parte), balance, rigs, música
    engine/           el motor 3D de las regiones (three.js)
    fx/               jugo (sacudidas, onomatopeyas, partículas) y secuencias grandes
    island/           la isla isométrica, hábitats, decoración, la noche
    momentos/         Momentos musicales: motor, kit de anime y una carpeta por canción
    panels/           ventanas sobre la isla (Catdex, Altar, Astillero, Fonoteca, Bitácora…)
    podio/            los duelos del Podio
    regions/          las islas 3D de la Parte II
    scenes/           título, isla, mapas, batalla, regiones, cajas y laboratorios
    state/            el estado del juego, sistemas, migraciones y parches
    ui/               widgets, tema, diálogos, guiones de historia, créditos
  public/             SVG de gatos (lite/ y completos), íconos, música, manifest, service worker
  scripts/            verificador de misiones, publicación del arte, generadores de partidas de prueba
  tests/              pruebas (vitest)
  test-saves/         partidas de prueba para ?save=
docs/                 guías, arte, repos, actualizaciones y el diseño de cada parte
ops/nolc-arte/        la plantilla del workflow de los repos de arte
research/             GDD, economía, referencias pop y dirección de arte de la Parte I
CHARLA.txt            la conversación de diseño original
```

Pantalla lógica de 1920×1080 que se adapta a cualquier pantalla (sin barras negras).

---

## Pipeline de arte (MAI SVG)

Los gatos y la capitana Luzterna son **SVG vectorial puro** (sin PNG, sin base64 embebido), hechos con **[MAI SVG](https://github.com/Ragosorio/MAI-SVG)**. Cada uno de los 120 gatos de la Catdex tiene su propia pintura.

1. Pintura original (vive fuera del repo) → `mai vectorize --preset high-color-preserved` (el alfa se vuelve máscara vectorial).
2. `scripts/game-export.ts` de MAI (perfil *game-compact*: el mismo dibujo, verificado píxel a píxel) → `game/public/cats-svg/<slug>.svg`.
3. `scripts/game-thumbs.ts` de MAI (traza ligera con control de calidad) → `game/public/cats-svg/lite/<slug>.svg`.
4. Rig (ojos, orejas, cabeza, cola, flotantes) en formato MAI → `game/src/data/catRigs.json`.

En el juego cada pintura se deforma sobre una malla (estilo Live2D, pero ligerito) con su rig: parpadeo, orejas, cabeza que mira al cursor o a quien habla, cola, objetos flotantes, respiración, caminata, siestas, bostezos. En combate se agachan al apuntar, se lanzan al disparar, se encogen con el golpe y el viento del mar les mueve el pelo.

El paso a paso para un gato nuevo está en [docs/guias/agregar-gato.md](docs/guias/agregar-gato.md). Los estilos (el pintado de siempre, rarezas, elementos, la Parte II, los Momentos y las dimensiones) están en [docs/arte/ESTILOS.md](docs/arte/ESTILOS.md).

---

## Créditos y gracias

Hecho con todo el corazón por **ragosorio** (Rolando Osorio).

Gracias a mi familia, que inspiró este juego. A quienes lo probaron primero y me dijeron la verdad. Y a todas las personas a las que les gustan los gatos (y a las que no, también: ya llegarán).

**Sigue a ragosorio en todas sus redes**, ahí salen los gatos nuevos primero: [instagram.com/ragosorio](https://www.instagram.com/ragosorio)

Los créditos completos están dentro del juego (al terminar el Capítulo 1, o en **Ajustes › CRÉDITOS**).

---

## Licencia

Código abierto bajo la licencia **MIT**: ver [LICENSE](LICENSE). Úsalo, apréndele, mejóralo. Si haces algo bonito con él, cuéntanos.
