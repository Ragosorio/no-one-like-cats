# 05 · Estilos y kit del Acto II (página, viñeta, pantalla y óleo)

> Agente FILM-ACTO2, ronda 4 (2026-10-27). Lo usan las películas del Acto II y cualquier otra que los necesite: todos son genéricos. API general: [02-api.md](02-api.md). Plantilla de presentación: [04-plantilla-presentacion.md](04-plantilla-presentacion.md).
> ⚠️ Carpeta con spoilers de la Parte III.

## 1. Estilos nuevos (`game/src/film/styles/vineta.ts` + `vineta.catalog.ts`)

Cada estilo es un **tratamiento de gato** horneado una vez por película (el puppet anima la pintura tratada sin costo por cuadro), un **post** y las **texturas** de papel o pantalla que hornea en la carga. Se registran con una línea en `film/catalog.ts` (`...VINETA_STYLES`) y otra en `film/styles/index.ts` (`...VINETA_MODULES`).

| id | Qué es | Tratamiento del gato | Post | Texturas (`ctx.tex`) |
|---|---|---|---|---|
| `aracnido` | Cómic moderno del «verso arácnido» | Tinta plana impresa **corrida** de su línea (desregistro), trama en dos tintas (magenta 15°, cian 75°) en la sombra, línea negra gruesa, brillo duro | Aberración cromática 0,9, saturación alta | `ar:dots` |
| `periodico` | Periódico de los 40 | Trama negra a 45° sobre papel de diario + una tinta de color (el tono del propio gato) | Cálido, papel, un poco de suciedad | `pe:paper` |
| `edadplata` | Cómic de la Edad de Plata | Tintas de imprenta (cada canal a 0 / ½ / 1), puntos Ben-Day grandes en los medios tonos, línea gruesa, papel envejecido | Papel 0,5, cálido | `ep:paper`, `ep:dots` |
| `nocturna` | Documental con visión nocturna | La pintura tal cual | **Duotono verde fósforo** (lo oscuro casi negro, lo claro verde pálido), grano 0,13, viñeta, halación | `nv:scan`, `nv:noise` |
| `manga` | Yonkoma en tramas | Blanco y negro con trama de puntos y línea; **el azul se conserva** (la linterna) | Mono 0,97 con el tono azul guardado (`accHue` 0,58) | `mg:tone`, `mg:paper` |
| `hilo` | Hilo continuo | Los luchadores en **cel** (el horneado de los Momentos) | Índigo, halación (el hilo brilla) | `hl:indigo` |
| `caravaggio` | Tenebrismo | Óleo cálido, luz rasante desde arriba a la izquierda, las sombras se hunden en negro de sombra, un brillo | Contraste 1,18, viñeta 0,66, lienzo | `cv:canvas`, `cv:ray` (el rayo) |

**Tratamientos extra para `{ slug, bake }`** (se agregan a `CAT_BAKES` con una línea en `styles/index.ts`): `aracnido`, `periodico`, `edadplata`, `manga`, **`hilo`** (el gato dibujado **solo como contorno blanco**: figuras «dibujadas en hilo»), **`cel`** (el cel de los Momentos dentro de otro estilo) y `caravaggio`.

## 2. El kit del Acto II (`game/src/film/films/acto2/kit/`)

| Archivo | Qué trae |
|---|---|
| `t.ts` | Tiempos puros: `seg`, `sm`, `env`, `outBack`, `pop`, `jolt` (sacudida determinista, 0 con «Reducir movimiento»), `onTwos` |
| `ink.ts` | La página: `Panel` (viñeta con borde y medianil; su contenido enmascarado y una capa `over` para lo que rompe el borde; `show()` la abre con pop, caída o fundido), `caption` (caja de narración de color), `balloon` (globo; `shout` con picos, `whisper` punteado), `Onoma` (**onomatopeya sólida** con extrusión, grietas y humo), `burst`, `speedLines`, `streaks`, `dotsFill` (trama), `bandSky`, `reveal`, `wordM` (texto con la **Ō** que las fuentes de cartel no traen: ITŌ, SHŌNEN) |
| `cast.ts` | El elenco: `luzOf` / `lanternAt` / `Beam` (Luzterna y su haz), `flame` / `tailTip` / `FLAME` (la llama de Canelo, la señal del acto), `StaticKitten` (Cerito: estática que se calma, se borra o se eriza), `rigPoint` / `stillRig` (puntos del rig para poner accesorios), los **rasgos de los suplentes** dibujados en código (`inkMask`, `paperCape`, `yarnBall`, `headband`, `glitchShard`, `nibHand`, `threadBundle`, `sash`) y `SLUG` (la tabla de suplentes) |
| `bitacora.ts` | LO QUE ARRIESGAMOS con su letra (nunca su nombre), con cuatro entradas: `rise`, `slap` (como viñeta pegada), `slide` (tarjeta de episodio, con banda), `unroll` (sobre el rollo) |
| `demo.ts` | **Los tiros reales del simulador** (`battle/demo.ts` `ruleDemo`, que corre `Battle.integrate`): `realArcs()`, `fitArc`, `fitArcTo` (el mismo vuelo, escalado para caer exactamente sobre lo que la regla enseña), `along`, `crossAt` |

**Por qué un kit propio:** el del Acto I es de la tele 4:3 de la Borracha; el del Acto II es de la página de cómic y del anime. Copiar las piezas comunes (la Bitácora, el haz, la llama) evita que un cambio de un acto rompa al otro.

## 3. Reglas que se aprendieron

- **La demostración de la regla sale del simulador real** aunque la regla nueva todavía no exista en él: se toma un vuelo real (`ruleDemo('mareo')`) y se dibuja encima lo que hace la regla (las letras sólidas donde rebota, el cañón enredado que no dispara, el golpe con aura que sale enorme, un trazo por turno).
- **Las fuentes de cartel no traen la Ō** (subconjunto latino): usar `wordM`.
- **Una silueta que lleva la escena** (Cerito en el documental) necesita un contorno limpio: la de `copito_snowball_cat` (con su sombrero) se leía como una mancha; se usa `mochi_bell_cat`.
- **Sin texto en el reloj:** el código de tiempo del documental cambia las texturas de dígitos horneados (no crea texto por cuadro).
- **Pocos gatos por película:** cada pintura nueva cuesta en la carga (la primera vez se rasteriza el SVG completo). Los héroes de las azoteas de F09 son siluetas dibujadas en código.
- **Pieles de la plantilla:** `p3d_superheroes` (estilo `aracnido`, fondo `comicStreet`) y `p3d_anime` (estilo `anime`, fondo `animeGate`) en `films/acto2/index.ts` y `fondos.ts`. Muestras DEV: `?film=plantilla_s1` y `?film=plantilla_a1`.
