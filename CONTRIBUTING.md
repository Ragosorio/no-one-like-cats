# Cómo colaborar con NO ONE LIKE CATS

Primero: gracias. Este juego es de código abierto porque queremos que crezca con más manos, más ideas y más gatos de los que una sola persona podría dibujar. **Cualquier tipo de actualización es bienvenida**: un gato, un elemento, una misión, un barco, una animación, un arreglo, una idea, una corrección de ortografía. Si te da pena mandar algo chiquito, mándalo igual.

Este documento explica qué queremos que el juego sea (y qué no), cómo mandar un cambio y dónde encontrar las guías.

---

## 1. Lo que no se negocia

Estas reglas son el corazón del proyecto. Un cambio que las rompa no entra, por bonito que sea.

1. **Gratis de verdad.** Sin anuncios, sin compras, sin "pases", sin monedas que se compran con dinero real. Nunca.
2. **Nada de pay-to-win ni de trampas psicológicas.** Nada de energía que se acaba, ni ofertas con reloj que presionan, ni probabilidades escondidas. Si hay azar, las probabilidades se muestran completas.
3. **"Espera o sigue jugando".** Si algo tarda, el jugador siempre tiene otra cosa divertida que hacer. Nunca "vuelve mañana o paga".
4. **SVG puro, cero raster.** Usamos SVG en lugar de imágenes porque carga más rápido, se puede animar y no cuesta nada. El `.gitignore` bloquea PNG/JPG/JPEG/WebP/GIF/AVIF/BMP y el deploy falla si aparece uno en `dist/`. El arte de gatos se hace con [MAI SVG](https://github.com/Ragosorio/MAI-SVG); todo lo demás (barcos, íconos, efectos) se dibuja en código o es SVG.
5. **La partida del jugador es sagrada.** Una actualización puede dar, reparar, reembolsar o reubicar. **Nunca quitar** oro, gemas, gatos, niveles ni progreso. Ver [docs/ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md).

---

## 2. El tono

El juego habla **español latino, sin filtro, con cariño**. Los gatos son tiernos y las consecuencias terribles. Los ataques se gritan en inglés o japonés (es parte del chiste). La capitana Luzterna es seca, dramática y un poco mentirosa.

Cómo se escribe aquí:

- Tuteo. Frases cortas. Que se lea rápido en un teléfono.
- El humor viene de los gatos, de la situación y de lo exagerado. Ejemplo real de lore: *"Nació para dormir en una caja. Lo despertaste para incendiar barcos. Ahora es tu problema."*
- Groserías leves sí, cuando el momento lo pide. Crueldad no.
- Para jugadores, no para programadores: "Tus gatos ahora ronronean más rápido", no "se ajustó el multiplicador de ronroneo".

**Límites claros**, sin excepción: nada de chistes sobre etnia, religión ni el Holocausto. Nada que se burle de grupos de personas. Las referencias pop son bienvenidas como homenaje, no como copia: personajes y nombres propios, con otro nombre y otro giro.

Código: los **comentarios del código van en inglés**; los textos del juego y la documentación, en español latino. Nada de emojis en la interfaz (los elementos tienen insignias SVG) ni en la documentación.

---

## 3. Cómo mandar un cambio

1. **Haz fork** del repositorio y clónalo.
2. **Crea una rama** con un nombre que diga qué haces: `gato/michi-tormentoso`, `arreglo/viento-en-iphone`, `historia/zona-7`.
3. **Corre el juego** (`cd game && npm ci && npm run dev`) y haz tu cambio.
4. **Pruébalo** (sección 4).
5. **`npm run build` tiene que pasar.** Incluye la revisión de tipos (`tsc --noEmit`). Si no pasa, no se puede publicar.
6. **Abre un Pull Request** contra `main`. La plantilla te pide una lista de revisión; llénala con honestidad, no pasa nada si algo queda pendiente mientras lo digas.
7. Si tu cambio es grande (un elemento nuevo, un sistema nuevo, cambios de economía), **abre primero un issue de tipo Idea** para platicarlo. Te ahorra trabajo que quizá habría que rehacer.

Commits: mensajes cortos y claros, en inglés o español, con prefijo si quieres (`feat:`, `fix:`, `docs:`, `art:`).

---

## 4. Cómo probar

- **Partida nueva**: `?new=1&scene=island` en tu entorno local (ojo: reemplaza la partida de ese navegador; hay respaldo en Ajustes › RESPALDOS).
- **Partida vieja**: `?save=post-boss3` (u otra de `game/test-saves/`) carga una partida de prueba. Tu cambio tiene que funcionar con partidas que ya existían antes de él.
- **Laboratorios** (`?scene=dev`): gatos vivos, rigs, secuencias, barcos, batalla de prueba, isla de prueba. Úsalos para ver tu cambio aislado.
- **Teléfono**: si tocaste interfaz, pruébala angosta (Chrome DevTools en modo dispositivo basta). Mucha gente juega en teléfono.
- **Movimiento reducido**: si agregaste animaciones, revisa que respeten `settings.reduceMotion` (Ajustes).

### Compatibilidad de partidas (copiado de [ACTUALIZACIONES.md](docs/ACTUALIZACIONES.md))

- [ ] Si agregaste un campo a la partida, está en `GameState` y en `defaultState()`.
- [ ] Si cambiaste la forma de datos guardados, hay migración y subiste `SAVE_VERSION`.
- [ ] Si cambiaste reglas que una partida ya usa, hay parche (`registerPatch`).
- [ ] Nada de lo anterior quita recursos ni progreso.
- [ ] Hay entrada en `game/src/data/updates.ts` (NOVEDADES) con lo que el jugador va a notar.

---

## 5. Estilo de código

- **TypeScript** con `strict`. Nada de `any` si se puede evitar.
- **PixiJS v8 + GSAP.** Las animaciones usan GSAP; mata tus tweens cuando destruyes lo que animan (`gsap.killTweensOf`) y quita tus `Ticker` al salir.
- **Los datos van en datos.** Gatos, elementos, misiones, barcos y números viven en `game/src/data/content.json` y `balance.json`. El código los lee; no metas números de balance sueltos en el código si pueden vivir ahí.
- **Escenas y paneles no se importan entre sí.** La navegación pasa por `game/src/app/flow.ts`.
- **Diseño en 1920×1080 lógicos**; el juego escala solo. Usa `W` y `H` de `core/App.ts`.
- **Comentarios en inglés**, cortos, explicando el porqué.
- Formato: el que ya tiene el archivo (comillas simples, punto y coma, 2 espacios). Si tienes Prettier, la línea larga está permitida.

El mapa completo del código está en [docs/guias/arquitectura.md](docs/guias/arquitectura.md).

---

## 6. Cómo proponer contenido

| Quiero… | Lee | Y abre… |
|---|---|---|
| Un gato nuevo | [agregar-gato.md](docs/guias/agregar-gato.md) | issue **Nuevo gato** (con o sin dibujo) o PR directo |
| Un elemento nuevo | [agregar-elemento.md](docs/guias/agregar-elemento.md) | issue **Idea** primero: toca medio juego |
| Misiones, diálogos, zonas | [agregar-historia.md](docs/guias/agregar-historia.md) | PR (o issue **Idea** si cambia la historia principal) |
| Un barco, enemigo o jefe | [agregar-barco.md](docs/guias/agregar-barco.md) | PR |
| Una animación o secuencia | [animaciones.md](docs/guias/animaciones.md) | PR, con un video o capturas del laboratorio |
| Arreglar un bug | — | issue **Bug** (o PR directo si ya sabes el arreglo) |

¿No sabes dibujar y tienes un gato en la cabeza? Igual mándalo: nombre, epíteto, elemento, personalidad, su grito de ataque y una línea de lore. El dibujo puede llegar después.

Sobre el arte: si mandas una ilustración, tiene que ser **tuya** o con permiso explícito para publicarse bajo la licencia del proyecto. Nada generado a partir del estilo de un artista vivo sin su permiso, y nada de personajes con derechos de autor.

---

## 7. Dónde preguntar

- **Issues de GitHub**: para bugs, ideas y gatos nuevos. Usa las plantillas.
- **Pull Requests**: para conversar sobre un cambio concreto.
- **Instagram de ragosorio**: [instagram.com/ragosorio](https://www.instagram.com/ragosorio), para saludar, mandar dibujos o enterarte de lo nuevo.

Al colaborar aceptas que tu aporte se publique bajo la [licencia MIT](LICENSE) del proyecto.

Ahora sí: a hundir barcos. Con cariño.
