# Guiones del Acto IV «La gira» · índice y convenciones

> ⚠️ **SPOILERS de la Parte III.**
> Agente NARRATIVA · ronda 4 · 2026-10-26. Para el agente de producción de películas (CINE) y para quien implemente las escenas.
> Historia: `../../01-biblia-v2.md`. Mapa: `../../02-mapa.md` §6. Fichas: `../../03-peliculas.md` (F26–F30). Música: `../../../musica-v2/no-game-no-life.md`, `../../../musica-v2/xti-es-amor.md` y `../../../musica-v2/00-LEEME.md` §3.2 y §6.
> **Diseño del giro:** pasada 3 de TEMPERATURA (`../../../temperatura/05-revision-narrativa.md` §3, P1–P8) y v3 (`../../../temperatura/04-engano-y-giro.md` §11.5). **Las convenciones generales son las del Acto I** (`../acto-1/00-indice.md` §3): columnas, marcas de los dos ritmos [P][M][C][A][R], reglas de escritura, `SOFT`, siluetas, accesibilidad.

## 1. Qué hay aquí

| Archivo | Misión | Películas | Batalla de historia |
|---|---|---|---|
| `h89-backstage.md` | H89 «Backstage» | Llegada a POP · **F26 PP «El mánager»** · regreso de EMIAU | **P-5 élite «El mánager»** (regla Ritmo) |
| `h90-la-gira.md` | H90 «La gira» ♥ | Tarjetas de los 3 shows · **F27 PH «Karaoke»** (fotomatón) · la foto | — (batallas de actividad) |
| `h91-firma.md` | H91 «Firma» | **F28 PP «Firma»** · **F29 PC NO G@ME NO LIF€ «El show»** (completa, compás por compás) · después | **P-9 jefe «Firma»** (regla «Pose de portada») |
| `h92-la-noche-estrellada.md` | H92 «La noche estrellada» ♥ | Tramo jugable de regreso · **F30 PC xti es amor «La noche estrellada»** (completa, Van Gogh, compás por compás) | — |

## 2. Lo que el jugador trae al empezar el Acto IV

- Los Correctores le leyeron a Luzterna su expediente y ella contestó «culpable» a todo (H87, No wey).
- Esquirla intentó usar a Cerito para romper todas las cajas; los Disruptores se partieron y **Esquirla huyó a POP** por una rasgadura (H88, DISTOR).
- La llama de Canelo está al 60 % desde H85 y baja con cada caja que se rompe.
- La Mano tiene un plan: «Sin luz ni ojos, vuelve a vacante. Ciérrale los ojos al gato» (H86).

**Lo que se lleva al salir:** la última alegría compartida; **La Mano sabe dónde duerme Cerito**; Cronos dijo algo que nadie quiso oír; Canelo cada vez más cansado.

## 3. Lo que cambia en las convenciones

### 3.1 Pantalla (`../../01-biblia-v2.md` §7)

| Tramo | Formato |
|---|---|
| POP (H89–H91) | **Pantallas LED del estadio**: el cuadro se arma con varias pantallas a la vez (la principal, dos laterales, una tira de abajo). Los momentos de fan se ven en **ventanas verticales 9:16** de celular, con la interfaz de grabación sin marcas (un punto rojo y un contador de tiempo) |
| F27 Karaoke | **Vertical**: una tira de fotomatón de 4 fotos al centro, con el estadio desenfocado alrededor |
| F29 en su quiebre | **Pantalla de arcade** (8 bits) que se come las LED |
| Casa (H92) | **A sangre, sin marco**. La pintura de Van Gogh llena todo |

### 3.2 Reglas que mandan en este acto (diseño v3)

- **De Luzterna no se ve nada sobre su mortalidad.** La regla se dijo en H67 y **no se repite**. Ni cambios en su cuerpo (frío, sombra, foto más opaca), ni avisos, ni despedidas. **No teje ni regala nada a la vista** [TEMP-P1]: la bufanda que teje a escondidas **no aparece en el Acto IV**.
- **Luzterna flota y todo lo carga con el haz de la linterna** (en H91 detiene el escenario con el haz, no con las manos).
- **Las banderas son de Canelo**: la llama que baja sola cuando duerme, el pescado «para mañana», Cronos (sin que nadie voltee). **Nada de señales cómicas** (sin contador de vidas, sin «GAME OVER? → CONTINUE?») [TEMP-P3].
- **Las presentaciones del Acto IV** muestran **la alegría de la gira y la llama baja de Canelo en el mismo plano** (TEMPERATURA `03` §5).
- **LO QUE ARRIESGAMOS** con la letra de Luzterna, **nunca la nombra a ella**.
- **Canelo habla en POP** (fuera de casa) y **solo maúlla en casa** (H92).
- **Parodias**: nombre felino, 3 rasgos legibles en el primer plano, ningún logo, ninguna frase de artistas reales: los gatos dicen sus propias líneas.

### 3.3 Hablantes nuevos para registrar en `ui/story/text.ts`

**FIRMA**, **EL MÁNAGER**, **GATO MALO**, **TAILOR SWIFT**, **CRONOS** (si no está registrado desde la Parte I), **ESQUIRLA** (si no se registró en el Acto II), **PÚBLICO** (ya del Acto I). **EMIAU** ya existe (H73).

### 3.4 Beats que persisten

| Misión | Beats |
|---|---|
| H89 | `b89_llegada` · `b89_pp` · `b89_manager` · `b89_emiau` |
| H90 | `b90_show1` · `b90_show2` · `b90_show3` · `b90_karaoke` · `b90_foto` (la foto elegida, guardada) |
| H91 | `b91_pp` · `b91_fase1` · `b91_show` · `b91_rasgadura` |
| H92 | `b92_regreso` · `b92_noche` |

**Regla:** una película de canción ya vista no se repite al recargar. **La foto de H90 se guarda** y vuelve en SADIE (F35) y en la vigilia (F38).

### 3.5 Accesibilidad (este acto)

- **F29 tiene *glitch* y luces de estadio:** máximo **3 destellos por segundo** siempre. Con «Reducir destellos», el parpadeo del HUD se cambia por un barrido lento de color, los estrobos del escenario por un pulso suave y el paso a 8 bits por un fundido de píxel.
- **Confeti y grúas:** con «Reducir movimiento», las grúas pasan a cortes y el confeti cae más lento.
- **F30 (Van Gogh):** con «Reducir movimiento», los remolinos giran a la mitad de velocidad y las pinceladas del pasto no ondulan.
- Los globos y letras de karaoke van sobre zona calmada, con contorno.

## 4. Temperatura del acto

| Misión | Pico de energía | Valle | Lo que se lleva |
|---|---|---|---|
| H89 | La pelea contra El mánager en el beat | El reencuentro con EMIAU | Hay estrellas de otras cajas; Firma prepara algo con Cerito |
| H90 ♥ | Los 3 shows | El borde del escenario: el deseo de Luzterna; la llama de Canelo en el camerino | La alegría compartida; una foto |
| H91 | **NO G@ME NO LIF€** | c53–57, la última calma | La Mano sabe dónde duerme Cerito |
| H92 ♥ | — | **Toda la película** (la más quieta de la Parte III) | Fue una noche de casa. Cronos dijo algo. Canelo duerme con la llama baja |

## Preguntas para TEMPERATURA

1. En H92, el pescado que Canelo esconde «para mañana» se dice **sin palabras** (en casa no habla): dibuja un solecito en la arena junto al pescado. ¿Se lee como bandera sin texto, o hace falta reforzarlo?
2. En H91, la rasgadura muestra **el hueco donde duerme Canelo** bajo su palmera, con la cobija de Cerito al lado (Canelo está en el estadio, no en la isla). ¿Alcanza para la señal C12 («La Mano sabe dónde duerme Cerito: junto a Canelo»)?

## Necesidades para ARTE / MÚSICA / CINE / MECÁNICAS

- **ARTE:** Firma, El mánager, Gato Malo, Tailor Swift, EMIAU en traje de telonero, Comecroquetas, Cronos; el cubo de vidrio; la versión «a medio pixelar» de Firma; Canelo durmiendo de pie; las versiones de Van Gogh de los gatos de la isla.
- **CINE:** pantallas LED múltiples y ventanas 9:16; fotomatón con letras de karaoke; videoclip → HUD → 8 bits → ruptura; Van Gogh con pinceladas que siguen un campo de flujo y lienzo craquelado.
- **MÚSICA:** `xti.gira` (F26), karaoke derivado de `xti.gira` (F27, con la melodía inventada de Luzterna), «PRESS START» (F28); NO G@ME y xti completas; silencio entre F29 y F30 (xti entra por su pad solo).
- **MECÁNICAS:** regla Ritmo (H89) y «Pose de portada» (H91); F29 cierra la batalla (`reason: 'momento'`); la foto de H90 elegida sobre la tira y guardada; el tramo jugable de H92 que arranca F30 al tocar el faro.
