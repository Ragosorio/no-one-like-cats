# NO ONE LIKE CATS — Dirección de arte

Fuente: los 17 conceptos de `conceptos/`. Idea central: **"Multiverso de estilos"**. Como en *Into the Spider-Verse*, cada gato, elemento, pantalla y momento del juego vive en una "dimensión de estilo" distinta, y el choque entre estilos ES la identidad. Lo que une todo es una gramática compartida: papel, tinta, bloques de color planos, tipografía enorme y cortes de collage.

## 1. Gramática común (lo que nunca cambia)

| Pieza | Regla |
|---|---|
| Soporte | Papel crema con grano (`#EAE1D3` Porcelain Linen / `#EDE4D6`). Ruido sutil + fibras. Toda la UI "está impresa". |
| Tinta | Negro tinta `#171317` y azul tinta editorial `#1F2B4A` (de "THE COMEBACK IS PERSONAL"). |
| Titulares | Sans condensada gigantesca (Anton / Bebas Neue), en mayúsculas, tracking apretado, a veces cortada por el borde de la pantalla. |
| Formas | Círculo grande de acento (rosa `#E8879A`, rojo `#C8102E`), bloques rectangulares sólidos que se superponen a la "foto", retícula de puntos 3×6, cruces "+" finas, coordenadas pequeñas en la esquina. |
| Imagen | Personajes y barcos con contorno de tinta + sombreado plano; los momentos épicos cambian a anime pintado o manga B/N. |
| Textura | Halftone (Ben-Day) en sombras, misregistro CMYK de 1–3 px en momentos de impacto, papel rasgado en transiciones. |
| Movimiento | Personajes animados "en 2s" (12 fps escalonado); cámara, UI y partículas a 60 fps. |

## 2. Dimensiones de estilo (por pantalla / elemento)

| Dimensión | Referencia | Paleta | Tipografía | Dónde se usa |
|---|---|---|---|---|
| **EDITORIAL SUIZO** | Budapest / Amsterdam | crema `#EDE4D6`, rosa `#E8879A`, negro `#171317` | Anton + Space Grotesk | UI base, menús, Catdex, tienda, hoja del barco |
| **DIARIO DEL MAR** | NYT + brush lettering, "THE COMEBACK IS PERSONAL" | crema envejecido, azul tinta `#1F2B4A`, negro | UnifrakturMaguntia (cabecera), Anton, Permanent Marker (brush) | Historia, titulares de misión, descubrir elemento ("EXTRA! EXTRA!"), derrota |
| **ANIME INFERNO** | Demon Slayer fuego | `#4E0000` Red Inferno, `#C8102E`, naranja `#FF6A1A`, amarillo `#FFC94A` | Dela Gothic One + Bangers | Batalla (Battle Form), ultimates de fuego, Hábitat volcánico |
| **MANGA TINTA** | JJK collage, HxH B/N | blanco/negro puro + 1 color de acento | Bangers / Dela Gothic One | Impact frames, gatos Espíritu, viñetas de ataque, bosses |
| **NEÓN GLITCH** | "font list" mariposa | negro caos `#0D110F`, magenta `#FF2E88`, cian `#00E5FF`, violeta `#8A5CFF` | Rubik Glitch + Space Grotesk | Cósmico, Void, Tech/Eléctrico, grietas y eventos de otro universo |
| **NOIR OCEÁNICO** | paleta Chaos Black → Mega Blue | `#0D110F` `#172B35` `#1C3A51` `#204A7A` `#3569A3` | Bebas Neue | Mar, batalla nocturna, Agua/Hielo, puerto |
| **ORQUÍDEA REAL** | Orchid Smoke + VIO + snake | `#231626` `#5C3D5B` `#8F6B93` `#B7A4C7` `#B89558` dorado, menta `#A7E8D7` | Playfair Display | Magia/Arcano, Santuario de Resonancia, reveal de rareza Mítica |
| **COLLAGE GRUNGE** | collage neón Tokyo | magenta `#E5007E`, amarillo `#FFD400`, cian `#2EC4E6`, gris `#3A3A44` | Anton torcido + Permanent Marker | Eventos flash (reloj ROJO sagrado), carreras heroicas |
| **PÓSTER RETRO** | póster rojo "Pinterest" | crema, rojo `#B3202A`, verde oliva `#4F5A45` | Anton + Playfair | Lotería "Cat's Gambit", mercader |
| **COZY ISLA** | (puente) | crema + pasteles derivados de cada gato | Space Grotesk / Bangers para números | La isla: tierno, cálido, legible |

### Regla de choque
Cuando dos dimensiones se tocan (p. ej. un gato Cósmico ataca en una batalla Noir), **se nota la costura**: cada uno conserva su estilo y frame rate (como Gwen vs. Miles vs. Spider-Ham). El gato atacante "trae" su dimensión a la pantalla durante su turno: el fondo se tiñe, cambia el grano y la tipografía de la onomatopeya.

## 3. Gatos

- **Forma Isla (chibi)**: los SVG originales de educatione, con bob/respiración/parpadeo; sin agresividad.
- **Battle Form (anime)**: mismo gato + capas en código: aura del elemento (llamas/partículas/glitch), ojos brillantes (pupila con forma: ♥, ✦, espiral), pelo/orejas con "spikes" de energía, sombra de contorno grueso, speedlines detrás, cartela con nombre del ataque en la tipografía de su dimensión.
- **Ascended (6★)**: Battle Form + halo/corona y paleta invertida en el ultimate.
- Rareza visible por el **marco**: Común (papel), Raro (tinta azul), Épico (rosa neón), Legendario (dorado tarnished + foil), Mítico (holográfico/iridiscente, shader), Primordial (negro + ruido de otra dimensión).

## 4. Tipografías (empaquetadas con @fontsource)

| Rol | Fuente |
|---|---|
| Titulares gigantes | Anton, Bebas Neue |
| Onomatopeyas / números de daño | Bangers, Dela Gothic One |
| Brush / manuscrito | Permanent Marker |
| Cabecera de periódico | UnifrakturMaguntia |
| Elegante / mágico | Playfair Display |
| Glitch | Rubik Glitch |
| UI pequeña y números | Space Grotesk |

## 5. Shaders / filtros necesarios
Halftone (puntos según luminancia), misregistro CMYK (RGBSplit), grano de papel, glitch por bandas, contorno de tinta, impact frame invertido B/N, shockwave, bloom para auras, pixelado de "transmisión" para Void.
