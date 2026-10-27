# Música v2 · las 9 canciones de la Parte III (LEEME)

> Agente **MUSICA-V2**, ronda 4 (`../14-plan-cinematografico.md` §3), 2026-10-26. ⚠️ Spoilers de la Parte III. Sin commits.
> **Oleada 3 (producción para las películas):** [`10-produccion-oleada3.md`](10-produccion-oleada3.md).
> **Línea de tiempo visual** (un solo HTML, sin raster): [`linea-de-tiempo.html`](linea-de-tiempo.html). Ábrelo en el navegador y pasa el mouse: dice compás, sección y qué suena.
> Etiquetas en todos los documentos: **EDITOR** = proyecto de Soundtrap leído en solo lectura · **SEÑAL** = medido en la exportación del dueño · **INFERIDO** = lectura del agente. **Nadie escuchó con oído humano.**

## 1. Las 9 canciones de un vistazo

| Canción | Tempo | Tono | Duración (archivo) | Compases | LUFS · LRA | Energía media | Distorsión media | Cómo se comporta la distorsión | Voz | Uso (PROPUESTA) |
|---|---|---|---|---|---|---|---|---|---|---|
| [Drunck](drunck.md) | 165 | B♭m | 1:12,8 | 48 | −8,4 · 6,1 | 0,81 | 0,68 | Sube de golpe en c9 y se queda; la intro se abre con un filtro (238 Hz → 9 kHz) | no | **Completa** (H66, ya construida) |
| [SADIE](sadie.md) | 50 | Dm | 2:52,9 | 36 | −20,1 · 6,1 | 0,52 | 0,33 | **Crece en escalones** hasta el clímax (0,15 → 0,28 → 0,41 → 0,48) y se rompe en c29 (piano delgado) | no | **Completa** (H93) |
| [Daria](daria.md) | 134 | Cm | 2:26,4 | 80 | −8,4 · 0,8 | 0,82 | 0,25 | Plana y limpia; solo cambia el brillo | sí: loop cantado | **Fragmento** c25 → fin (1:40) |
| [No wey](no-wey.md) | 74 | F♯m | 3:46,9 | 69 + 2 tiempos | −13,4 · 9,6 | 0,69 | 0,60 | Estable; baja en los breaks | no | **Completa** (H87) |
| [xti es amor](xti-es-amor.md) | 140 | F♯ (loops en D♯m) | 3:18,0 | 114 | −12,5 · 4,5 | 0,67 | 0,30 | Baja y estable; casi nula en el pad solo | no | **Completa** (H92) |
| [OH SHIT](oh-shit.md) | 145 | Em | 3:21,9 | 122 | −9,3 · 6,4 | 0,78 | 0,66 | Alta y pareja; las caídas son **cambios de mundo** (−3 dB), no golpes | no | **Fragmento** c45 → fin (2:09) |
| [EM%EN](em-en.md) | 103 | E♭m | 3:07,8 | 80 | −9,5 · **14,1** | 0,76 | 0,59 | **Sube cuando la energía cae**: quiebre y salida «bajos pero sucios» (0,63) | coro (loop «Chant»); **sin rap** | **Completa** (H73) |
| [DISTOR](distor.md) | 112 | F♯m | 2:53,9 | 81 | −8,8 · 3,6 | **0,84** | 0,64 | **Constante desde c1** (es un estado); picos cuando queda desnuda (c25: 0,71); el tiempo se desfasa en c65,875 | no | **Fragmento** c25 → fin (2:02) |
| [NO G@ME NO LIF€](no-game-no-life.md) | 90 (se siente a 180) | F♯m | 3:25,9 | 76 | −11,3 · 3,7 | 0,77 | 0,48 | **Entra por capas**: el sinte distorsionado se queda 5 → 8 → 7 → 20 compases; pico desnudo en c15–19 (0,62) | no | **Completa** (H91) |

- **Tempo**: en las 9 es constante (el JSON de cada proyecto tiene un solo `bpm`) y la señal lo confirma al milésimo de BPM. **El compás 1 está en 0,000 s** en las 9 exportaciones.
- **Energía y distorsión** están en una escala común de 0 a 1 (método en el §4). La energía media más alta es la de DISTOR y la más baja la de SADIE. La más sucia es Drunck y la más limpia Daria.
- **Voz**: solo Daria (un loop de voz de biblioteca, cantado) y EM%EN (un coro «Chant» y un coro de sinte). **Ninguna tiene letra propia ni rap**: las palabras de la batalla de EM%EN van en pantalla.
- **Las que van completas** (6): Drunck, SADIE, No wey, xti, EM%EN y NO G@ME. **Las que van en fragmento** (3): Daria, OH SHIT y DISTOR. Esto coincide con la biblia v2 de NARRATIVA (`../historia-v2/01-biblia-v2.md` §8). Los cortes que pidió («confirmar los cortes en límites de sección») están en cada documento, §1. `03-peliculas.md` todavía no existe; cuando exista, hay que revisar estos rangos con él.

## 2. La distorsión que crece: lo que dice la medición

El dueño pidió ver las canciones «que tienen distorsiones que van aumentando con el tiempo». Medido:

| Canción | ¿Crece? | Cómo |
|---|---|---|
| **SADIE** | **Sí, en escalones** | La textura se ensucia y el brillo de las cuerdas sube en tres escalones (4–10 kHz: −30 → −8 → −1 → +5 dB en c1, c5, c9 y c17), que son los volúmenes del editor (−6,1 → +1,5 → +6 dB). El volumen total casi no cambia: **lo incremental es la textura, no el volumen**. En c29 el piano se distorsiona, pero suave: queda delgado y brillante, no ruidoso. |
| **NO G@ME NO LIF€** | **Sí, por presencia** | El sinte distorsionado (el mismo loop «Future Flu» de DISTOR) aparece cuatro veces y cada vez se queda más: c14–19, c27–35, c38–45 y c57–77. Su pico de exposición es c15–19 (sin batería); al final se queda 20 compases y ya no se va. |
| **DISTOR** | **No** | La distorsión viene en los loops desde el compás 1 y el índice se queda entre 0,63 y 0,68 (pendiente −0,02 por minuto). Lo que cambia es la exposición (picos sin batería) y el **ritmo**: en c65,875 el bajo y los sintes se corren medio tiempo contra la batería. Si la película necesita que la distorsión crezca, el crecimiento lo pone la imagen o el corte del fragmento. |
| EM%EN | Al revés | La distorsión sube cuando la energía baja: en el quiebre (c33–49) y en la salida (c73–81) entran un bajo y un shamisen distorsionados pero filtrados. El bajo sube con un fundido de 8 compases en c41–49 (+23 dB medidos). |
| Drunck | Solo en la intro | El filtro se abre en c1–9; después la distorsión es pareja hasta el final. |
| Daria, No wey, xti, OH SHIT | No | Estables. |

**Hilo de la distorsión** (biblia v2 §8): el loop «Boom – Future Flu (Breakdown Synth) [F♯m]» está en DISTOR y en NO G@ME (EDITOR). Es literalmente el mismo sonido, en la misma tonalidad: sirve como «la textura que rompe cosas».

## 3. Grupos de tempo y transiciones entre películas

### 3.1 Grupos

| Grupo | Canciones | Relación |
|---|---|---|
| Lentas (pulso amplio) | SADIE 50 · No wey 74 | 50 × 1,5 = 75 ≈ 74 (1,4 %) |
| Medias | NO G@ME 90 · EM%EN 103 · DISTOR 112 | 90 × 1,25 = 112,5 ≈ 112 (5:4) |
| Rápidas | Daria 134 · xti 140 · OH SHIT 145 | separadas por 4–8 % |
| Muy rápida | Drunck 165 | 112 × 1,5 = 168 (los tresillos de DISTOR caen cerca del pulso de Drunck) |

### 3.2 Parejas que pegan bien (tempo y tono)

| De → a | Tempo | Tono | Veredicto |
|---|---|---|---|
| **No wey → DISTOR** (H87 → H88, seguidas) | 74 × 1,5 = 111 ≈ 112 (0,9 %) | las dos en F♯m | **La transición más suave de todas**: misma tónica y relación 3:2. La intro de DISTOR (808 + sinte, sin batería) puede entrar sobre la melodía de No wey que se apaga sola. |
| **DISTOR → NO G@ME** (H88 → H91) | 5:4 | F♯m las dos, y comparten el loop «Future Flu» | Puente de timbre: el mismo sinte distorsionado une las dos. |
| **NO G@ME → xti** (H91 → H92) | sin relación simple | F♯m → F♯ mayor | De la oscuridad al calor con la misma tónica. Entrar en el pad solo de xti (sin batería) sobre la cola de 3,3 s de NO G@ME. |
| **xti → SADIE** (H92 → H93) | sin relación | F♯ → Dm (mediante cromática) | Choque a propósito: mejor un corte a silencio que un fundido. |
| EM%EN → OH SHIT (H73 → H74) | sin relación | E♭m → Em (medio tono arriba) | La subida de medio tono es una modulación dramática clásica; la salida de EM%EN no tiene batería y sirve de puente. |
| Daria ↔ NO G@ME | 90 × 1,5 = 135 ≈ 134 (0,7 %) | Cm / F♯m (trítono) | Pegan en tempo, no en tono. |
| No wey ↔ OH SHIT | 74 × 2 = 148 ≈ 145 (2 %) | F♯m / Em | Pegan en tempo. |
| SADIE ↔ EM%EN | 50 × 2 = 100 ≈ 103 (3 %) | Dm / E♭m | Pegan en tempo; el tono las separa. |

## 4. Cómo se midió

- **Soundtrap (EDITOR)**. Lectura de solo lectura en el Chrome del dueño, con el método de `../investigacion/soundtrap.md`: un GET al mismo JSON que carga el estudio (`api/project/getProject1` y `api/projectsnapshots/<id>/data/latest?maxSequenceNo=<versión>`) y a los blobs de notas (`user-assets/blob2/<id>/<server_id>.not`). Solo se abrió el estudio de OH SHIT; los otros proyectos se leyeron desde la lista de proyectos, sin abrir el editor. No se reprodujo nada en Soundtrap: la señal se midió en las exportaciones. Datos compactos en `audio-derivados/parte-iii/v2/soundtrap/<id>.json`.
- **Separación**: htdemucs (demucs 4.1.0) sobre la copia de cada MP3, decodificada con ffmpeg (t = 0 = primera muestra decodificada, como en la Parte II). Stems en `audio-derivados/parte-iii/v2/stems/<id>/`.
- **Rejilla**: la del editor, comprobada contra los ataques de batería. Las 9 dan el compás 1 en 0 s. En DISTOR (flams y tresillos) y OH SHIT (swing) el groove no cae en la semicorchea recta, pero la rejilla sí calza.
- **Onsets**: bombo = graves < 150 Hz del stem de batería **con clic** en 1–8 kHz; caja/palmas = 150–2500 Hz sin bombo a ±30 ms; hats = > 6 kHz; bajo = stem de bajo con altura por pyin; melodía = stem «other»; voz = stem de voz solo donde el editor tiene un loop de voz. Cada ataque se refina y se ajusta a la semicorchea o al tresillo si cae a < 8 ms. **Exactos desde las notas del editor**: el 808 de NO G@ME y, en SADIE, el bajo (nota grave de las cuerdas) y la melodía (lead + piano). Drunck conserva sus onsets validados.
- **Energía (0–1)** = 0,60 × sonoridad (LUFS momentáneo de ffmpeg ebur128: −36 → 0, −6 → 1) + 0,25 × densidad de ataques (0–8 por tiempo) + 0,15 × brillo (4–10 kHz contra 60–250 Hz).
- **Distorsión (0–1)**: media ponderada de cinco señales de saturación, cada una pesada por la presencia de su fuente:
  - **residuo HPSS**: la energía de los stems tonales (200–8000 Hz) que no es ni armónica ni percusiva, que es el ruido que agrega la distorsión (0,35);
  - **planitud espectral** de los stems tonales (0,25);
  - **razón de agudos** 2–8 kHz / 150–1000 Hz (0,15);
  - **armónicos del bajo** 250–2500 / 30–150 Hz, solo si el bajo suena (0,10);
  - **cresta baja** de la mezcla, porque saturar aplasta los picos (0,15).

  La curva **absoluta** se compara entre canciones; la **relativa** estira cada canción a su propio rango para ver la forma.
  - **Límite**: es un índice de textura, no la medida de un efecto. Un timbre brillante y limpio, como las cuerdas, también lo sube. Por eso cada documento explica de dónde viene la distorsión según el editor.
- **Tonalidad**: la del editor; el croma de los stems tonales confirma SADIE (Dm), Daria (Cm), xti (D♯m, relativa de F♯), No wey y OH SHIT (2.º lugar). En Drunck, EM%EN, DISTOR y NO G@ME el croma no es concluyente, porque la distorsión ensucia el croma.
- **Voz**: stem de voz por encima de −38 dBFS y a menos de 16 dB de la mezcla; cantada o hablada según pyin (fracción de cuadros con altura y salto entre cuadros). Es una inferencia.
- Scripts: `audio-derivados/parte-iii/scripts/v2/`. Para rehacer todo: `separar.py` → `analizar.py` → `onsets_v2.py` → HPSS (`resid.json`) → `curvas.py` → `tono.py` → `beatmaps_v2.py --write` → `gen_html.py` → `gen_docs.py`. Venv con torch, demucs y librosa en el scratchpad de la sesión; se rehace con `pip install torch demucs librosa soundfile scipy`.

## 5. Beat maps nuevos (en el juego)

> **Oleada 3 (2026-10-26):** las 8 originales ya están codificadas y registradas en `tracks.json` y en `ORIGINALS`, junto con 13 variaciones derivadas (entre ellas el tema de Canelo y el puente No wey → DISTOR) y dos piezas propias. Todo está en [`10-produccion-oleada3.md`](10-produccion-oleada3.md). Lo de abajo describe la oleada 1.

`game/src/data/music/beatmaps/{sadie,daria,no_wey,xti,oh_shit,emen,distor,no_game}.json` y `….onsets.json`:
- **Formato**: el esquema exacto de `drunck.json`, con `id`, `duration`, `bpm`, `offset` 0, `beatsPerBar` 4, `beats`, `downbeats`, `sections` con `energy` y `markers`, más `voice` en Daria y EM%EN. Los onsets usan el formato de `drunck.onsets.json`.
- **Oleada 1: sin registrar** (ni `tracks.json` ni audio en `game/public`). **Oleada 3: registradas** (ver arriba).
- **Pruebas**: `originalsReserved`, `momentos`, `battleMusic`, `audio` y `momentoDrunck` pasan, con 101 pruebas.
- **Marcadores**: los de las 4 canciones viejas son los ya confirmados en la señal por la ronda anterior; los de las 4 nuevas salen de las entradas y salidas del editor.
- **Cuando se registren**: agregar cada id a la lista `ORIGINALS` de `tests/originalsReserved.test.ts`, como se hizo con `drunck`, para que solo suenen en Momentos, películas y la Fonoteca.

## 6. Música de «briefing» antes de las batallas (PROPUESTA; la producción va después)

**Regla**: solo material de la propia canción, sin timbres ajenos. Lo que más le gusta al dueño son las reducciones despojadas, ambientales y de compositor (`../../part-ii/` y memoria de gustos). La mejor fuente es lo que llamo **islas**: compases donde la canción **ya suena despojada en la mezcla**. Se pueden usar sin separar stems y sin artefactos. Duración objetivo: 20–60 s en loop (las presentaciones duran eso). Técnicas ya probadas en la Parte II y en Drunck:
- estirar ×1,5–2 con rubberband R3, sin cambiar la altura;
- paso bajo o paso alto suave;
- sala generada;
- congelar un acorde;
- invertir una cola;
- sacar la batería con stems solo cuando no hay isla.

| Canción | Isla (sin batería en la mezcla) | Briefing propuesto | Cómo |
|---|---|---|---|
| Drunck | — | Ya existen `drunck.barra` «Desde la calle» y `drunck.resaca` «Bajo la almohada» | Reusar «Bajo la almohada» como briefing de la Borracha |
| SADIE | **c33–37: piano limpio solo** (19,2 s) · c1–4 piano + arpegio | «Antes de la luz»: el piano de c33–37 estirado ×1,5, con el arpegio del lead muy bajo | Sin cuerdas: las cuerdas son de la película (no gastar el clímax) |
| Daria | — (siempre hay bombo) | «Calle fría»: piano + shimmer de c9–17 (stem «other») con el 808 en paso bajo, sin voz | Loop de 8 compases (14,3 s) a tempo, para que la batalla del duelo entre a 134 |
| No wey | **c45–49: solo la melodía** (13 s) · c1–5 melodía + hats | «Lo que no dije»: la melodía sola de c45–49, estirada ×2, con la entrada del bajo de c49 en paso bajo como respiración | Es su momento más solo; sirve para presentar a Luzterna |
| xti es amor | **c73–81 y c1–8: pad solo** (13,7 s cada una) | «Pad de la noche»: el pad Bmaj7–F♯maj7–G♯m7–A♯m7 tal cual, con sala | Ya es una reducción de compositor; solo hace falta un loop limpio |
| OH SHIT | **c37–45: textura + melodía picada, sin beat** (13,2 s) · c25–29 bajo + melodía | «Antes de caer»: la textura y los cortes de la melodía de c37–45, con las sirenas de c73 lejos (paso bajo) | Suspenso de multiverso, sin la ráfaga |
| EM%EN | **c33–41: el quiebre** (18,6 s, ya filtrado y a −21 LUFS) · c1–9 intro sin batería | «El público espera»: la intro c1–9 (coro, stab, guitarra) para presentar la batalla; el quiebre para el momento antes del turno de Canelo | El quiebre ya es una reducción: no hay que tocarlo |
| DISTOR | **c1–5: 808 + sinte + FX, sin batería** (8,6 s) · c45–49 breakdown (con palmas) | «Señal rota»: c1–5 en loop con un paso bajo que se abre poco a poco a lo largo del briefing | El briefing anuncia la textura del derrame sin el golpe del drop |
| NO G@ME NO LIF€ | **c1–3: arpegio + 808** (5,3 s) · **c53–57: piano + 808** (10,7 s) | «PRESS START»: el arpegio de c1–3 como pantalla de inicio y el piano + 808 de c53–57 como reducción triste del show | Dos piezas: una alegre (el show) y una que ya sabe que es trampa |

**Lo que necesitaría del dueño para hacerlo mejor**: exportar desde Soundtrap las pistas sueltas (stems) de SADIE, EM%EN, DISTOR y NO G@ME. Con eso las reducciones salen sin artefactos de separación. Yo no puedo exportar.

## 7. Soundtrap: proyectos encontrados y verificación de que no cambiaron

Lista de proyectos del dueño (orden «última actualización»). Leídos con GET; ninguno se editó, guardó, renombró ni movió.

| Proyecto | Id | Versión al empezar | Última edición (UTC) | Al terminar (01:12 UTC del 27) |
|---|---|---|---|---|
| OH SHIT (Animated song…) | `rH_FA7HHQPuL3zy8sE-yZg` | 208 | 2026-10-13 18:57:46 | 208, la misma fecha |
| EM%EN (Hiphop estilo eminen…) | `rdY6Z4mvRhqM71LzVHknQw` | 114 | 2026-10-14 14:52:46 | 114, la misma |
| DISTOR (musica distorcionada…) | `w35dg5gsRJmgDcCESZKUhg` | 157 | 2026-10-27 00:17:16 | 157, la misma |
| NO G@ME NO LIF€ (distorcion igual que en DISTOR…) | `BsbHXoDMQhOjXRxO3zJKIg` | 227 | 2026-10-27 00:17:46 | 227, la misma |
| SADIE (piano and distorsion) | `fGRASEj8SdSwqi2aZkxTvg` | **284** (la exportación es la 223) | 2026-10-21 17:43:12 | 284, la misma |
| Drunck · No wey · Daria · xti | (ver `../investigacion/soundtrap.md`) | 6 · 306 · 306 · 142 | iguales a las del 2026-10-13 | iguales |
| **NO ONE LIKE ME** (trap con cierta distorcion pero mas emocionante) | `uOIz1O2BQQexbw6VimY9gg` | 337 | 2026-10-27 00:19:50 | 337, la misma |

Todas las fechas de última edición son anteriores a mi primera lectura (~00:40 UTC del 27).

**Dos avisos para el dueño:**
1. **SADIE cambió después de exportarla.** La v284 (21 de octubre) agrega una 4.ª capa de cuerdas en c17–25 (−5,3 dB) y un golpe «Error» más en c33. El MP3 de la carpeta es la v223. Si quiere esa versión en la película, hay que exportarla otra vez; los compases no cambian.
2. **Hay un 10.º proyecto sin exportar**: «NO ONE LIKE ME (trap con cierta distorcion pero mas emocionante)». Son 100 BPM en F♯m, 12 pistas y 72 compases (2:52,8). Se editó dos minutos después de exportar DISTOR y NO G@ME, así que puede estar en proceso. No está en la carpeta de canciones y no se analizó. Si va a la Parte III: es otra F♯m (familia de No wey, DISTOR y NO G@ME) y sus 100 BPM pegan con SADIE (50 × 2) y con EM%EN (103).

**El dueño dijo «SoundCloud»**: las 9 canciones están en Soundtrap, así que no hizo falta buscar en SoundCloud.

## 8. Lo que falta o queda abierto

1. **Escucha humana**: nadie oyó nada. Lo prioritario:
   - si el desfase de DISTOR en c65,875 se siente como un tropiezo intencional;
   - si las caídas «Portmore» de OH SHIT se sienten como «¡OH SHIT!» aunque bajen el volumen;
   - si el quiebre de EM%EN deja oír el bajo distorsionado o queda solo el coro.
2. **`historia-v2/03-peliculas.md`** no existe todavía: cuando NARRATIVA lo escriba, revisar los rangos de los fragmentos (Daria, OH SHIT, DISTOR) y los marcadores.
3. **Stems del dueño**: con stems exportados desde Soundtrap se mejoran los onsets (sobre todo bombo y bajo) y las reducciones de briefing.
4. **SADIE v284**: decidir si se reexporta.
5. **Producción de los briefings** (§6): es la oleada siguiente.
6. **Registro en el juego**: `tracks.json`, audio `.m4a` y `ORIGINALS` en la prueba cuando se construya cada película.
