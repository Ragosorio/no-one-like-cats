# 03 · Estilos gráficos (FILM-ACTO1)

> Ronda 4 (2026-10-26). Código: `game/src/film/styles/grafico.ts` (Pixi) y `game/src/film/styles/grafico.catalog.ts` (catálogo puro, que `catalog.ts` incorpora). Cómo se agrega un estilo: [02-api.md](02-api.md) §7.
> ⚠️ Carpeta con spoilers de la Parte III.

Son tratamientos **genéricos** de las pinturas MAI aprobadas, más el *look* de posproducción y las texturas de papel o pantalla que necesita cada uno. Cada gato se hornea **una vez por película** (en la pantalla de carga): el títere anima la pintura tratada sin costo por cuadro. Nacieron para el Acto I (la Borracha es una tele: cada rival se presenta en el idioma de su mundo), pero sirven a cualquier acto.

| id | Para qué | El gato | Textura compartida (`ctx.tex`) | *Look* |
|---|---|---|---|---|
| `tv` | La caricatura de TV de la Borracha **a todo color** (F01, F02, F05…) | Los nativos (Hipólito, Espuma, Oficial Dona) tal como están pintados; los visitantes, con la lente TV (`bakeTv`) | `tv:scan` (barrido), `tv:static` (estática), `tv:glow` | Saturado, halo suave |
| `sombras` | Teatro de sombras (F02) | Recorte café oscuro (nunca negro) con borde de luz cálida del lado de la lámpara | `sb:spot` (el círculo de luz en la pared) | Cálido, viñeta fuerte, papel |
| `estencil` | Esténcil y cartel de propaganda (F03) | Tres tintas: negro, rojo y kraft, con puentes en el negro y salpicaduras de aerosol alrededor | `es:kraft` | Contraste, papel |
| `fotocopia` | Flyer fotocopiado (F05) | Blanco y negro de copiadora: trama gruesa a 45°, motas de tóner y una franja sin tinta | `fc:paper` | Mono, contraste alto, grano |
| `vhs` | VHS de cámara casera (F06) | La lente TV (el post la lava) | `vh:snow` (nieve), `vh:track` (banda de *tracking*) | Saturación baja, aberración cromática, halo |
| `cartel` | Cartel de lucha libre (F07) | Dos tintas sobre amarillo: trama roja con desregistro y negro en sombras y contorno | `ca:paper` | Papel |
| `comic` | Cómic impreso (F08: verso arácnido, Ciudad Mayúscula) | Color plano en tres tonos, puntos de trama en la sombra, contorno grueso y desregistro | `cm:dots` | Saturado |
| `anime` | Anime (F08) | El cel de los Momentos (`bakeCel`: Kuwahara, sombra dura, línea de color) | — | Halo |
| `pixel` | Videojuego de 8 bits (F08) | Bloques, paleta corta y un contorno oscuro de un bloque | — | Sin grano |
| `plastilina` | Plastilina (F08) | Color suave, brillo grande arriba a la izquierda y huellas digitales | — | Cálido |

**Usarlos:** `style: 'estencil'` en la escena. Las texturas se piden con `ctx.tex('es:kraft')` solo si alguna escena de la película usa ese estilo, porque el estilo es quien las hornea.

**Reglas que respetan** (de `13-pulido-arranque.md` §2.2 y `02-api.md` §12): las siluetas salen del arte real y nunca son negro puro; todo se hornea antes del reloj; los filtros nunca corren por cuadro.
