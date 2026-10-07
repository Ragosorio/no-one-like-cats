# NO ONE LIKE CATS

**Cute cats. Terrible consequences.**

Una isla flotante llena de gatos que coleccionas, crías y consientes… y que luego mandas a hundir barcos piratas a cañonazos de bola de pelo. Gratis, sin anuncios, sin compras, sin energía. Se juega en el navegador y se instala como app.

**Jugar ahora:** https://ragosorio.github.io/no-one-like-cats/

**Laboratorio para desarrolladores:** https://ragosorio.github.io/no-one-like-cats/?scene=dev

---

## Qué es

- **Tu isla de gatos.** Colecciona 78 gatos de 13 elementos: los 7 del Primer Mar (Fuego, Agua, Naturaleza, Tierra, Tormenta, Magia, Cósmico) y, después del Capítulo 1, los 6 que se cuelan por las Grietas del Multiverso (Hielo, Sonido, Sombra, Tiempo, Luz y Vacío). Cada uno tiene nombre, mañas, oficio y un lore que te va a dar ternura o miedo.
- **Resonancia.** Dos gatos se van a "invocar otro gatito". Las probabilidades se ven completas, sin letra chiquita.
- **Combate de artillería por turnos.** Apuntas, calculas el viento y disparas contra barcos modulares que se rompen celda por celda: casco, mástiles, cañones, la despensa. Tus gatos se transforman en su **Battle Form** y gritan sus ataques en inglés o japonés, como debe ser.
- **Capítulo 1: El Primer Mar.** Seis zonas, jefes con mecánicas propias, una capitana (Luzterna) con más historia de la que admite, y un periódico, el *Diario del Mar*, que publica cada victoria.
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

---

## Colabora

**Aceptamos colaboraciones, y cualquier tipo de actualización es muy bienvenida.** Un gato nuevo, un elemento, un capítulo de historia, un barco, una animación, un arreglo de un bug, una traducción de un chiste que no se entendió, una mejora de rendimiento en tu teléfono viejito. Todo suma.

Empieza aquí:

- **[CONTRIBUTING.md](CONTRIBUTING.md)**: los valores del proyecto, el tono, cómo mandar un cambio y qué revisamos.
- **Guías (en `docs/guias/`)**, escritas contra el código real:
  - [Agregar un gato](docs/guias/agregar-gato.md): ficha, pintura MAI SVG, rig, cómo se consigue.
  - [Agregar un elemento](docs/guias/agregar-elemento.md): afinidades, materiales, insignia, hábitat, descubrimiento.
  - [Agregar historia](docs/guias/agregar-historia.md): misiones, diálogos, zonas, batallas de historia.
  - [Agregar un barco](docs/guias/agregar-barco.md): planos, módulos, pieles, enemigos y jefes.
  - [Animaciones](docs/guias/animaciones.md): gatos vivos, secuencias, GSAP, cómo previsualizar.
  - [Arquitectura](docs/guias/arquitectura.md): el mapa del código.
- **[Laboratorio para desarrolladores](https://ragosorio.github.io/no-one-like-cats/?scene=dev)** (`?scene=dev`): todos los laboratorios en una página. Gatos vivos con su rig, un previsualizador de secuencias (revelar gato, elemento nuevo, invocación, estrellas, portada del periódico) con el gato que elijas, el astillero de arte de barcos, la arena de destrucción, una batalla de prueba y la isla de prueba. Ninguno toca tu partida.
- **[docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md)**: cómo sacar una actualización sin romperle la partida a nadie.
- **[docs/MOTOR-Y-PLATAFORMAS.md](docs/MOTOR-Y-PLATAFORMAS.md)**: por qué PixiJS, qué costaría cambiarlo y cómo llevar el juego a App Store, Google Play y computadoras.

¿Tienes una idea pero no programas? Abre un *issue* de tipo **Idea** o **Nuevo gato**. Las mejores ideas de este juego salieron de conversaciones.

---

## Tus partidas y las actualizaciones

La partida vive en tu navegador (no hay servidor ni cuentas). Cuando sale una versión nueva:

- El juego avisa con **¡ACTUALIZACIÓN LISTA!**, guarda y recarga.
- Tu partida vieja se adapta sola a las reglas nuevas (migraciones y parches que **dan, reparan o reembolsan, nunca quitan**).
- **NOVEDADES** te cuenta qué cambió.
- En **Ajustes › RESPALDOS** hay copias automáticas, y puedes copiar tu partida como texto para pasarla a otro navegador o a la app instalada.

Los detalles técnicos están en [docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md).

---

## Correr en local

Necesitas Node 22 (el que usa el deploy).

```bash
cd game
npm ci
npm run dev
```

Abre http://127.0.0.1:5173. Atajos útiles en desarrollo:

| URL | Qué hace |
|---|---|
| `?scene=dev` | El LABORATORIO con todos los laboratorios. |
| `?dev=1` | Muestra un botón **LAB** en la pantalla de título. |
| `?scene=catlive&cat=<slug>&rig=1` | Un gato vivo en grande con su rig encima. |
| `?scene=fxlab&cat=<id>` | Secuencias grandes con el gato que quieras. |
| `?save=post-boss1` | Carga una partida de prueba de `game/test-saves/` (solo en `npm run dev`). |
| `?stage=2-9` | Entra directo a esa batalla de campaña (solo en `npm run dev`). |

`npm run build` revisa los tipos y genera `game/dist/`, que es lo que publica GitHub Pages en cada push a `main`.

---

## Estructura

```
game/                 el juego (TypeScript + PixiJS v8 + GSAP + pixi-filters, Vite)
  src/
    app/              flujos entre escenas (historia, batallas, navegación)
    art/              gatos vivos (malla + rig), carga de SVG, variantes teñidas
    battle/           simulador de combate, barcos, disparos, jefes
    core/             app, escenas, guardado, actualizaciones, audio, PWA
    data/             content.json (gatos, elementos, misiones, historia), balance.json, rigs
    fx/               jugo (sacudidas, onomatopeyas, partículas) y secuencias grandes
    island/           la isla isométrica, hábitats, decoración
    panels/           ventanas sobre la isla (Catdex, Altar, Astillero, Tienda, Casino…)
    scenes/           título, isla, mapa, batalla, resultados, prólogo y laboratorios
    state/            el estado del juego, sistemas, migraciones y parches
    ui/               widgets, tema, diálogos, créditos
  public/             SVG de gatos (lite/ y completos), íconos, manifest, service worker
  test-saves/         partidas de prueba para ?save=
docs/                 guías, actualizaciones, motor y plataformas, dirección de arte
research/             GDD, economía, referencias pop, dirección de arte
CHARLA.txt            la conversación de diseño original
```

Pantalla lógica de 1920×1080 que se adapta a cualquier pantalla (sin barras negras).

---

## Pipeline de arte (MAI SVG)

Los 54 dibujos de gatos y la capitana Luzterna son **SVG vectorial puro** (sin PNG, sin base64 embebido), hechos con **[MAI SVG](https://github.com/Ragosorio/MAI-SVG)**:

1. PNG original (vive fuera del repo) → `mai vectorize --preset high-color-preserved` (el alfa se vuelve máscara vectorial).
2. `scripts/game-export.ts` de MAI (perfil *game-compact*: el mismo dibujo, verificado píxel a píxel) → `game/public/cats-svg/`.
3. `scripts/game-thumbs.ts` de MAI (traza ligera con control de calidad) → `game/public/cats-svg/lite/`.
4. Rigs (ojos, orejas, cabeza, cola, flotantes) en formato MAI → `game/src/data/catRigs.json`.

En el juego cada pintura se deforma sobre una malla (estilo Live2D, pero ligerito) con su rig: parpadeo, orejas, cabeza que mira al cursor o a quien habla, cola, objetos flotantes, respiración, caminata, siestas, bostezos. En combate se agachan al apuntar, se lanzan al disparar, se encogen con el golpe y el viento del mar les mueve el pelo. Hay dos niveles de detalle, ambos vectoriales: `lite/` carga rápido y el completo se baja solo cuando el gato se ve grande. Cada uno de los 54 gatos de la Catdex tiene su propio dibujo (los 22 que antes eran variantes teñidas se rediseñaron en el lote A).

---

## Créditos y gracias

Hecho con todo el corazón por **ragosorio** (Rolando Osorio).

Gracias a mi familia, que inspiró este juego. A mi hermana. A mi cuñado Manu. A quienes lo probaron primero y me dijeron la verdad. Y a todas las personas a las que les gustan los gatos (y a las que no, también: ya llegarán).

**Sigue a ragosorio en todas sus redes**, ahí salen los gatos nuevos primero: [instagram.com/ragosorio](https://www.instagram.com/ragosorio)

Los créditos completos están dentro del juego (al terminar el Capítulo 1, o en **Ajustes › CRÉDITOS**).

---

## Licencia

Código abierto bajo la licencia **MIT**: ver [LICENSE](LICENSE). Úsalo, apréndele, mejóralo. Si haces algo bonito con él, cuéntanos.
