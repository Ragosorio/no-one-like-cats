# Cómo colaborar con NO ONE LIKE CATS

Primero: gracias. Este juego es de código abierto porque queremos que crezca con más manos, más ideas y más gatos de los que una sola persona podría dibujar. **Cualquier tipo de actualización es bienvenida**: un gato, un elemento, una misión, un barco, una animación, una canción, un arreglo, una idea, una corrección de ortografía. Si te da pena mandar algo chiquito, mándalo igual.

Este documento explica qué queremos que el juego sea (y qué no), cómo proponer una idea o mandar un cambio, las reglas que no se rompen y por dónde empezar según lo que sepas hacer.

Atajos: [índice de la documentación](docs/INDICE.md) · [mapa de repositorios](docs/REPOSITORIOS.md) · [estilos de arte](docs/arte/ESTILOS.md) · [arquitectura](docs/guias/arquitectura.md) · [rutas de desarrollo](docs/guias/rutas-de-desarrollo.md)

---

## 1. Los valores

- **Gratis de verdad, para todos.** La misión es hacer el mejor juego posible sin cobrarle nada a nadie.
- **Divertido antes que adictivo.** La dopamina viene de que aparezca una animación bonita o de un gato que hace algo inesperado, no de un reloj que te presiona.
- **Honesto.** Si hay azar, las probabilidades se ven completas. Si algo cambia, NOVEDADES lo cuenta.
- **Tu partida es tuya.** Una actualización nunca te quita lo que ganaste.
- **Hecho con cariño.** Cada gato tiene nombre, mañas y una línea de lore. Si no tiene personalidad, todavía no está listo.

## 2. El tono

El juego habla **español latino, sin filtro, con cariño**. Los gatos son tiernos y las consecuencias terribles. Los ataques se gritan en inglés o japonés (es parte del chiste). La capitana Luzterna es seca, dramática y un poco mentirosa.

Cómo se escribe aquí:

- Tuteo. Frases cortas. Que se lea rápido en un teléfono.
- El humor viene de los gatos, de la situación y de lo exagerado. Ejemplo real de lore: *"Nació para dormir en una caja. Lo despertaste para incendiar barcos. Ahora es tu problema."*
- Groserías leves sí, cuando el momento lo pide; cada una nueva lleva su versión suave en `SOFT` (`game/src/ui/story/text.ts`) para el modo "Familiar". Crueldad no.
- Para jugadores, no para programadores: "Tus gatos ahora ronronean más rápido", no "se ajustó el multiplicador de ronroneo".
- **Sin spoilers en lo público.** NOVEDADES, títulos de issues y PR no cuentan giros de la historia. La Parte III está en desarrollo: su trama no se publica.

**Límites claros**, sin excepción: nada de chistes sobre etnia, religión ni el Holocausto. Nada que se burle de grupos de personas. Las referencias pop son bienvenidas como homenaje, no como copia: personajes y nombres propios, con otro nombre y otro giro.

Código: los **comentarios del código van en inglés**; los textos del juego y la documentación, en español latino. Nada de emojis en la interfaz (los elementos tienen insignias SVG) ni en la documentación.

---

## 3. Reglas de oro

Estas reglas son el corazón del proyecto. Un cambio que las rompa no entra, por bonito que sea. Cada una está respaldada por código o pruebas; ahí puedes ver cómo se cumple.

1. **Gratis.** Sin anuncios, sin compras, sin "pases", sin monedas que se compran con dinero real. Nunca. El casino y el portal usan solo oro y gemas ganadas jugando (`game/src/state/sys/shop.ts`, `casino.ts`, `gacha.ts`).
2. **Sin energía ni trampas psicológicas.** Nada de energía que se acaba, ni ofertas con reloj que presionan, ni probabilidades escondidas. **"Espera o sigue jugando"**: si algo tarda, siempre hay otra cosa divertida que hacer. Nunca "vuelve mañana o paga".
3. **Cero raster.** Ni PNG, ni JPG, ni WebP, ni GIF: solo SVG o arte dibujado en código. El `.gitignore` bloquea `png`, `jpg`, `jpeg`, `webp`, `gif`, `avif` y `bmp`; el deploy (`.github/workflows/deploy.yml`) falla si aparece uno en `dist/`; el sitio de arte se niega a publicarlos (`ops/nolc-arte/publish.yml`) y también rechaza SVG con scripts (`game/scripts/art-publish.ts`). Las pinturas fuente viven fuera del repo. Las capturas para tu PR se adjuntan en el PR, **nunca se suben al repo**.
4. **La partida del jugador es sagrada.** Una actualización puede dar, reparar, reembolsar o reubicar. **Nunca quitar** oro, gemas, gatos, niveles ni progreso, y nunca romper una partida vieja:
   - campo nuevo → `GameState` + `defaultState()` (`normalize()` lo rellena en partidas viejas);
   - datos con otra forma → migración en `game/src/state/migrate.ts` y subir `SAVE_VERSION` (hoy es 3);
   - reglas nuevas que una partida ya usa → parche `registerPatch` (`game/src/state/patches.ts`);
   - los ids de gatos, misiones, beats, parches y novedades son **para siempre**: nunca se renombran ni se reutilizan;
   - el contenido de cada parte nueva va en su propio módulo (`game/src/data/rupturas/`, `game/src/data/gateras/`) y se une con `mergeContent`, que **solo agrega**: en desarrollo y en las pruebas truena si intentas sobrescribir un valor de la Parte I;
   - no se quitan las redes de seguridad: los respaldos de `core/save.ts`, El Baúl (`core/vault.ts`), el candado de una sola pestaña que escribe (`ui/saveGuard.ts`) y la regla de nunca guardar con menos tiempo de juego que el que ya está en disco (`state/game.ts`);
   - el juego nunca se muda de dominio: las partidas viven en el origen `ragosorio.github.io` ([docs/REPOSITORIOS.md](docs/REPOSITORIOS.md)).

   El proceso completo está en [docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md).
5. **Las canciones originales del autor solo suenan en los Momentos musicales y en la Fonoteca.** Las batallas, la isla y el director de música usan sus variaciones y remezclas (`<canción>.battle`, `.explore`, `.ambient`…). La prueba `game/tests/originalsReserved.test.ts` falla si `battles.json` o `director.json` nombran una original. Detalle: [docs/guias/agregar-momento.md](docs/guias/agregar-momento.md).
6. **«Reducir movimiento» se respeta** (y «Reducir destellos» también). Están en `settings.reduceMotion` y `settings.reduceFlashes` (`game/src/core/settings.ts`); en la primera partida siguen la preferencia del sistema. Cada animación nueva los lee y acorta, quita o suaviza lo que gira, tiembla o parpadea. En las cines, cada paso puede traer su variante `reduced`. Los Momentos bajan sacudidas, zoom y giros al 30 % y nunca dan más de 3 destellos por segundo. Ver [docs/guias/animaciones.md](docs/guias/animaciones.md).

---

## 4. ¿Una idea o un cambio?

| Tienes… | Haz esto |
|---|---|
| Una idea a medio cocinar, una pregunta o ganas de platicar | Escríbela en **[Discussions](https://github.com/Ragosorio/no-one-like-cats/discussions)**. Ahí se platica antes de convertirla en issue. |
| Una idea concreta (mecánica, gato, zona, elemento, lo que sea) | Abre un issue con la plantilla **Idea**. No necesitas programar. |
| Un personaje en la cabeza | Plantilla **Nuevo gato**: nombre, epíteto, elemento, personalidad, grito y una línea de lore. El dibujo puede llegar después. |
| Un dibujo o una propuesta de estilo | Plantilla **Arte**: el estilo, tus referencias y para qué gato es. |
| Algo roto | Plantilla **Bug**: qué pasó, cómo repetirlo, dónde y una captura si puedes. |
| Un cambio listo | Un **Pull Request** contra `main`. La plantilla trae la lista de revisión. |
| Un cambio grande (un elemento, un sistema, la economía, la historia principal) | Primero un issue **Idea** para platicarlo. Te ahorra trabajo que quizá habría que rehacer. |

Las plantillas están en `.github/ISSUE_TEMPLATE/`. Las ideas sueltas, las preguntas y las conversaciones largas van en [Discussions](https://github.com/Ragosorio/no-one-like-cats/discussions). Los issues son para lo que ya se puede trabajar.

---

## 5. Cómo mandar un cambio

1. **Haz fork** del repositorio y clónalo.
2. **Crea una rama** con un nombre que diga qué haces: `gato/michi-tormentoso`, `arreglo/viento-en-iphone`, `historia/zona-7`.
3. **Corre el juego**: `cd game && npm ci && npm run dev`. No necesitas los repos de arte: sin configurar nada, todo se sirve desde `game/public/`.
4. **Haz tu cambio y pruébalo** (sección 7).
5. **Pasa las revisiones** (sección 6).
6. **Abre un Pull Request** contra `main`. Llena la lista con honestidad: no pasa nada si algo queda pendiente mientras lo digas.

Commits: mensajes cortos y claros, en inglés o español, con prefijo si quieres (`feat:`, `fix:`, `docs:`, `art:`).

---

## 6. La lista del Pull Request

Desde `game/`:

- [ ] `npm run typecheck` pasa.
- [ ] `npm test` pasa (vitest, `game/tests/`).
- [ ] `npx tsx scripts/verify-missions.ts --all` termina sin faltantes (con Node 22.18 o más nuevo, también `node scripts/verify-missions.ts --all`).
- [ ] `npm run build` pasa (es lo que corre el deploy).
- [ ] Cero raster en el diff: solo SVG o arte en código.
- [ ] Si es visual, **adjunté una captura o un video en el PR** (arrastrado a la descripción). Nunca en el repo.
- [ ] Probé con una partida nueva y con una vieja (`?save=post-boss3` u otra de `game/test-saves/`).
- [ ] Partidas: campo nuevo en `GameState` y `defaultState()`, migración si cambió la forma, parche si cambió una regla, nada quita progreso y hay entrada en NOVEDADES (`game/src/data/updates.ts`) si el jugador lo va a notar.
- [ ] Las animaciones nuevas respetan «Reducir movimiento» y «Reducir destellos».
- [ ] Ninguna canción original suena fuera de un Momento o de la Fonoteca.
- [ ] Textos en español latino con el tono del juego; comentarios del código en inglés; sin spoilers.

---

## 7. Cómo probar

- **Partida nueva**: `?scene=island&new=1` en `npm run dev` (reemplaza la partida de ese navegador; hay respaldo en Ajustes › RESPALDOS).
- **Partida vieja**: `?save=post-boss3` (u otra de `game/test-saves/`) carga una partida de prueba. Tu cambio tiene que funcionar con partidas que ya existían antes de él. Para la Parte II usa `rupturas-mid`, `rupturas-o3`, `rupturas-o4` o `h65-normal`. La lista completa está en [rutas-de-desarrollo.md](docs/guias/rutas-de-desarrollo.md#5-partidas-de-prueba).
- **Laboratorios** (`?scene=dev`): gatos vivos, rigs, secuencias, barcos, batalla de prueba e isla de prueba. Úsalos para ver tu cambio aislado.
- **Teléfono**: si tocaste interfaz, pruébala angosta (Chrome DevTools en modo dispositivo basta). Mucha gente juega en teléfono.
- **Movimiento reducido**: actívalo en Ajustes y repite tu animación.
- **Sin sonido**: el juego y los Momentos tienen que entenderse con el audio apagado.

---

## 8. Estilo de código

- **TypeScript** con `strict`. Nada de `any` si se puede evitar.
- **PixiJS v8 + GSAP** en 2D; **three.js** en las regiones 3D (`game/src/engine/`, `game/src/regions/`). Mata tus tweens cuando destruyes lo que animan (`gsap.killTweensOf`) y quita tus `Ticker` al salir.
- **Los datos van en datos.** Gatos, elementos, misiones, barcos y números viven en `game/src/data/` (`content.json` y los módulos de cada parte, `balance.json`, `music/*.json`). El código los lee; no metas números de balance sueltos en el código si pueden vivir ahí.
- **La batalla en pantalla es la simulación.** Las reglas nuevas van en `battle/sim.ts` o en un módulo que el simulador llame, nunca en la escena, para que la estimación de victoria dé lo mismo.
- **Escenas y paneles no se importan entre sí.** La navegación pasa por `game/src/app/` (`flow.ts` y los demás flujos).
- **Diseño en 1920×1080 lógicos**; el juego escala solo. Usa `W` y `H` de `core/App.ts`.
- **Comentarios en inglés**, cortos, explicando el porqué.
- Formato: el que ya tiene el archivo (comillas simples, punto y coma, 2 espacios). Si tienes Prettier, la línea larga está permitida.

El mapa completo del código está en [docs/guias/arquitectura.md](docs/guias/arquitectura.md).

---

## 9. Por dónde empezar según tu perfil

### Si programas

1. Lee [arquitectura.md](docs/guias/arquitectura.md) y corre el juego con [las rutas de desarrollo](docs/guias/rutas-de-desarrollo.md).
2. Busca issues con la etiqueta `good first issue` o `help wanted`.
3. Elige la guía de lo que quieres tocar: [gatos](docs/guias/agregar-gato.md), [elementos](docs/guias/agregar-elemento.md), [historia](docs/guias/agregar-historia.md), [cines](docs/guias/cines-y-estados.md), [Momentos](docs/guias/agregar-momento.md), [dimensiones](docs/guias/dimensiones-y-gateras.md), [barcos](docs/guias/agregar-barco.md), [animaciones](docs/guias/animaciones.md).
4. Rendimiento en teléfonos modestos siempre se agradece: [MOTOR-Y-PLATAFORMAS.md](docs/MOTOR-Y-PLATAFORMAS.md) y [docs/part-ii/11-rendimiento-sin-iris-xe.md](docs/part-ii/11-rendimiento-sin-iris-xe.md).

### Si dibujas

1. Mira [los estilos de arte](docs/arte/ESTILOS.md): el gato pintado de siempre, las rarezas, los elementos, la Parte II, los Momentos y las dimensiones.
2. Lee la entrega y el estilo base en [DIRECCION-ARTE-PARTE-2.md](docs/arte/DIRECCION-ARTE-PARTE-2.md): gato completo, vista 3/4 hacia la izquierda, los dos ojos abiertos, la cola visible y lejos de la cara, fondo transparente.
3. Abre un issue **Arte** con tu propuesta. Si ya la tienes, el paso a vector (MAI SVG), el rig y la integración están en [agregar-gato.md](docs/guias/agregar-gato.md). Si no usas MAI, manda tu pintura en el issue y la vectorizamos.
4. El arte tiene que ser **tuyo** o tener permiso explícito para publicarse bajo la licencia del proyecto. Nada generado a partir del estilo de un artista vivo sin su permiso, y nada de personajes con derechos de autor.

### Si escribes

1. Lee [el tono](#2-el-tono) y [agregar-historia.md](docs/guias/agregar-historia.md): misiones, beats, ganchos y batallas de historia.
2. Si tu escena necesita cámara, luz o un mundo que cambie, sigue con [cines-y-estados.md](docs/guias/cines-y-estados.md).
3. Cada sistema se explica solo: [CONTEXTO-NARRATIVO.md](docs/CONTEXTO-NARRATIVO.md) dice cómo escribir el "para qué" de cada misión.
4. Los chistes, los nombres de gatos y las líneas de lore se pueden proponer sin programar: issue **Idea** o **Nuevo gato**.

### Si haces música

1. Las canciones originales del autor están reservadas para los Momentos y la Fonoteca (regla de oro 5). Tu música puede ser variaciones, ambientes, remates cortos (*stingers*) o piezas nuevas.
2. Lee cómo está armado el audio: [docs/part-ii/19-audio-arquitectura.md](docs/part-ii/19-audio-arquitectura.md) (catálogo, director, capas), [24-batallas-musicales.md](docs/part-ii/24-batallas-musicales.md) (planes de batalla) y [32-herramientas-musica.md](docs/part-ii/32-herramientas-musica.md) (herramientas gratuitas para componer desde scripts).
3. Las pistas viven en `game/public/music/*.m4a` y se registran en `game/src/data/music/tracks.json`, con su mapa de pulsos en `game/src/data/music/beatmaps/`. Se nivelan alrededor de −16 LUFS.
4. La música tiene que ser tuya, o con una licencia que permita publicarla con el juego. Dila en el PR.

### Si pruebas

1. Juega la versión publicada y reporta con la plantilla **Bug**: dispositivo, navegador, en qué parte y una captura o video.
2. Si el bug depende de tu partida, en **Ajustes › RESPALDOS** puedes copiarla como texto y adjuntarla. Solo trae tus gatos y tu progreso.
3. Si corres el juego local, las partidas de prueba (`?save=…`) y los laboratorios te dejan repetir un caso exacto: [rutas-de-desarrollo.md](docs/guias/rutas-de-desarrollo.md).
4. Prueba en teléfono, con «Reducir movimiento» y sin sonido. Ahí salen los bugs que nadie más ve.

---

## 10. Cómo proponer contenido

| Quiero… | Lee | Y abre… |
|---|---|---|
| Un gato nuevo | [agregar-gato.md](docs/guias/agregar-gato.md) | issue **Nuevo gato** (con o sin dibujo) o PR directo |
| Un estilo o una pintura | [ESTILOS.md](docs/arte/ESTILOS.md) | issue **Arte** |
| Un elemento nuevo | [agregar-elemento.md](docs/guias/agregar-elemento.md) | issue **Idea** primero: toca medio juego |
| Misiones, diálogos, zonas | [agregar-historia.md](docs/guias/agregar-historia.md) | PR (o issue **Idea** si cambia la historia principal) |
| Una escena con cámara y luz | [cines-y-estados.md](docs/guias/cines-y-estados.md) | PR, con un video |
| Un Momento musical | [agregar-momento.md](docs/guias/agregar-momento.md) | issue **Idea** primero: las canciones originales son del autor |
| Un barco, enemigo o jefe | [agregar-barco.md](docs/guias/agregar-barco.md) | PR |
| Una animación o secuencia | [animaciones.md](docs/guias/animaciones.md) | PR, con un video o capturas del laboratorio |
| Arreglar un bug | — | issue **Bug** (o PR directo si ya sabes el arreglo) |

---

## 11. Dónde preguntar

- **Issues de GitHub**: para bugs, ideas, arte y gatos nuevos. Usa las plantillas.
- **Pull Requests**: para conversar sobre un cambio concreto.
- **Instagram de ragosorio**: [instagram.com/ragosorio](https://www.instagram.com/ragosorio), para saludar, mandar dibujos o enterarte de lo nuevo.

Al colaborar aceptas que tu aporte se publique bajo la [licencia MIT](LICENSE) del proyecto.

Ahora sí: a hundir barcos. Con cariño.
