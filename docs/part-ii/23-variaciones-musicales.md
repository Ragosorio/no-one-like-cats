# 23 · Variaciones musicales y piezas nuevas (INTERNO — puede mencionar dónde suena cada cosa)

> Agente VARIATIONS & COMPOSITION, 2026-10-09. Base: doc 18 (§7 variaciones, §9 composiciones nuevas) y doc 17.
> Las 6 canciones originales **no se tocaron** (`~/Desktop/NO ONE LIKE CATS sounds/`). Los stems, los maestros FLAC, las imágenes y los informes viven **fuera del repo** en `…/audio-derivados/variaciones/`. No hay `git commit`.

## Para el dueño (sin sorpresas de historia)

- Hay **12 versiones nuevas** de tus canciones y **2 piezas nuevas** + 4 remates cortos. No son las canciones a otra velocidad: se armaron con las **pistas separadas** (voz, teclas, bajo, batería), quitando o cambiando la batería y **agregando instrumentos nuevos** que siguen los acordes de cada canción.
- Todas las que se repiten tienen un **bucle sin costura** comprobado con números, y suenan un poco más bajo que las canciones (−18 LUFS) para quedar debajo de los diálogos.
- Pesan **14,9 MB** en total (AAC 160 kbps).
- **No se pudo escuchar nada**: lo que está medido está medido; si algo «suena raro» al oído, se ajusta. Abajo está la lista de lo que más conviene que escuches tú.

| Canción | Versión nueva | Duración | Qué es |
|---|---|---|---|
| YONOSE TODO | Solo las teclas | 50,7 s | Las teclas solas, con colchón, campana y coro suave |
| YONOSE TODO | Reconstrucción (3 capas) | 3 × 40 s | La misma música en tres niveles: teclas → + bajo → + ritmo |
| YONOSE TODO | Intro en bucle | 22,1 s | El inicio original en bucle (recorte, sin cambios) |
| WHEN I LOSE | Voces de tinta | 60,0 s | Las voces y las teclas sin batería, sobre una nota grave tenida |
| WHEN I LOSE | Después de perder | 24,1 s | El puente, más lento y apagándose (sin bucle) |
| Hemkade | Cielo abierto | 57,0 s | La melodía a medio tiempo, sin bombo, con aire |
| LIKY FIGHT | Puerto de fiesta | 64,1 s | Percusión ligera sin bombo + marimba nueva |
| te ODIO | Señal filtrada | 38,0 s | Base filtrada que se corta como una señal de radio |
| te ODIO | Solo la voz | 38,0 s | La voz sin base y luego solo su eco |
| CIRCUS MALUS | Cajita de música | 84,0 s | El riff tocado por una cajita de música, perfecto y seco |
| CIRCUS MALUS | Corrección | 9,9 s | El final original como pieza suelta (recorte) |
| Nuevas | Noche de estrellas · Isla Nácar | 93 s · 101 s | Música nueva compuesta para el juego |
| Remates | el motivo · hallazgo (2 tonos) · desbloqueo | 1,9–3,8 s | Sonidos musicales cortos |

---

## 0. Entregado

**Archivos de juego:** `game/public/music/` (solo archivos nuevos; las 6 codificaciones originales intactas).
**Catálogo:** `game/src/data/music/tracks.json` (solo se agregaron variaciones y la colección `amb`; ningún id existente cambió).
**Beat maps nuevos:** `beatmaps/hemkade.ambient.json` (80 BPM), `beatmaps/when_i_lose.aftermath.json` (112 BPM), `beatmaps/amb.night_astral.json`, `beatmaps/amb.nacar.json` (con marcadores del motivo).
**Director:** `director.json` → `island_night_astral` prueba primero `amb.night_astral`; `stingers.star_fall` y `stingers.unlock` pasan a archivo; nuevos `stingers.discovery_sib` y `stingers.discovery_mi` (ver §4).

| Id (ref) | Kind | Título | Dur. (s) | KB | Loop (s) / compases | LUFS loop | TP (dBTP) |
|---|---|---|---|---|---|---|---|
| `yonose_todo.ambient` | ambient | Solo las teclas | 50,67 | 1013 | 2,622086–45,288753 / 16 a 90 | −18,0 | −4,5 |
| `yonose_todo.aftermath` | aftermath | Reconstrucción | 40,00 | 793 | 2,304354–34,304354 / 12 | −18,0 | −4,6 |
| `yonose_todo.aftermath_bajo` | aftermath | Reconstrucción · bajo | 40,00 | 795 | 2,112789–34,112789 / 12 | −17,5 | −2,4 |
| `yonose_todo.aftermath_ritmo` | aftermath | Reconstrucción · ritmo | 40,00 | 795 | 2,110181–34,110181 / 12 | −17,2 | −1,7 |
| `yonose_todo.menu_loop` | menu_loop | Intro en bucle | 22,08 | 438 | 5,298254–21,298254 / 6 | −16,7 | −2,2 |
| `when_i_lose.ambient` | ambient | Voces de tinta | 60,00 | 1203 | 1,533084–56,390227 / 32 a 140 | −18,0 | −4,6 |
| `when_i_lose.aftermath` | aftermath | Después de perder | 24,14 | 428 | — (una vez) | −18,0 | −5,9 |
| `hemkade.ambient` | ambient | Cielo abierto | 57,00 | 1143 | 2,966485–50,966485 / 16 a **80** | −18,1 | −7,2 |
| `liky_fight.explore` | explore | Puerto de fiesta | 64,12 | 1284 | 1,795261–60,421224 / 32 a 131 | −18,1 | −3,9 |
| `te_odio.explore` | explore | Señal filtrada | 38,00 | 766 | 1,572517–33,572517 / 16 a 120 | −18,0 | −4,8 |
| `te_odio.ambient` | ambient | Solo la voz | 38,00 | 749 | 1,749773–33,749773 / 16 | −18,0 | −5,0 |
| `circus_malus.explore` | explore | Cajita de música | 84,00 | 1516 | 1,893220–78,693220 / 32 a 100 | −18,0 | −6,5 |
| `circus_malus.stinger` | stinger | Corrección | 9,86 | 151 | — | −18,2 | −8,0 |
| `amb.night_astral` | ambient | Noche de estrellas | 93,33 | 1942 | 2,666667–88,000000 / 32 a 90 | −18,0 | −2,1 |
| `amb.nacar` | ambient | Isla Nácar | 101,14 | 2035 | 1,585692–97,585692 / 56 a 140 | −18,0 | −4,2 |
| `amb` (= `amb.motivo`) | original de la colección | El motivo | 3,80 | 62 | — | máx. S −14,0 | −6,7 |
| `stinger.discovery_sib` | (solo director) | — | 2,60 | 41 | — | máx. S −14,0 | −4,1 |
| `stinger.discovery_mi` | (solo director) | — | 2,60 | 42 | — | máx. S −14,1 | −4,1 |
| `stinger.unlock` | (solo director) | — | 1,95 | 29 | — | máx. S −14,1 | −4,7 |

**Total nuevo en `public/music/`: 14,9 MB** (límite pedido ≲ 25 MB). Todo en AAC-LC `.m4a` 160 kbps cvbr (`aac_at`), 44,1 kHz estéreo, mismo pipeline que doc 18 §2.

---

## 1. Método común

### 1.1 Cadena

1. **Fuente:** stems de demucs (`…/audio-derivados/stems/<id>/{vocals,drums,bass,other}.flac`), leídos sobre el timeline canónico (t = 0 = primera muestra; doc 18 §0.3). Los recortes del original (`menu_loop`, `circus_malus.stinger`) se decodifican del MP3 con ffmpeg, igual que en doc 18.
2. **Análisis por compás** (scripts `ana.py`, `trans.py`, `pyin16.py`): croma CQT de `other`+`bass`, raíz del bajo por compás, transcripción por corcheas y pYIN donde la línea es monofónica. De ahí salen los acordes de cada capa nueva (no se inventó la armonía: se midió).
3. **Procesamiento:** filtros Butterworth, *shelf* RBJ, HPSS de librosa (para quedarse con la parte armónica de `other` y quitar fuga de batería), *de-pumping* (Hemkade), compuerta rítmica (te ODIO), saturación `tanh` suave, reverb por **convolución con respuestas al impulso generadas en numpy** (ruido en 8 bandas con decaimiento por frecuencia + reflexiones tempranas + ancho estéreo), rubberband 4.0 (motor R3 `--fine`) para cambiar tempo sin cambiar la altura o para transponer sin cambiar el tempo.
4. **Capas nuevas sintetizadas en numpy:** pad aditivo con *unison* (cuerdas/sinte), coro «uu» con formantes, celesta, cajita de música (modos de lengüeta 1 / 6,27 / 17,55), campana (parciales de campana), armónica de cristal, vibráfono con arco, crótalos, marimba, arpa Karplus-Strong, sub y pedales. Afinación A = 440.
5. **Loop periódico exacto:** todo el procesamiento se aplica sobre `[x x x]` y se queda la última copia, así las colas de reverb y los filtros «dan la vuelta» al bucle. Las notas se colocan con envoltura (lo que pasa del final entra por el principio). Las capas tenidas se generan con frecuencias ajustadas a un número entero de ciclos por loop (≤ 0,01 Hz de corrimiento).
6. **Forma del archivo:** `[1 compás de entrada][loop][2 compases de salida]`.
   - El compás de entrada es el último compás del loop (con *fade-in* en su primera mitad); la salida es el principio del loop apagándose.
   - Así el loop queda **lejos del borde del archivo**: si un navegador no recorta las 2112 muestras de cebado AAC (doc 18 §0.3), el loop se corre 48 ms pero **sigue siendo periódico** (verificado, columna «cebado» en §5).
   - Y si la Fonoteca la toca una sola vez, termina con un *fade* musical y no con un corte.
   - La grilla sigue empezando en 0 (la entrada dura exactamente un compás), así `gridFromTempo(bpm)` cae en los tiempos correctos.
7. **Normalización:** solo ganancia estática al objetivo; nada de compresión. *Beds* (ambient/explore/aftermath): **−18 LUFS integrados medidos sobre el loop**. Remates: **−14 LUFS-S de pico a corto plazo** (doc 18 §9). Los recortes del original llevan **la misma ganancia que la canción** (−2,4 dB YONOSE, −8,0 dB CIRCUS) para que el cambio entre versión y original no salte de volumen.
8. **AAC 160k** → se **decodifica** el `.m4a` y se mide todo sobre lo decodificado: LUFS, *true peak* (sobremuestreo 4×), costura, bandas.
   - Si el TP decodificado pasaba de −1,5 dBTP, se bajaba la ganancia estática y se volvía a codificar. Pasó una sola vez (`aftermath_ritmo`, −0,19 dB).
   - Lección: a 128k el AAC sumaba +1,5 dB de sobrepico en la capa con batería. A 160k no pasa (por eso todo quedó en 160k).
9. **Puntos de loop:** se buscan **sobre el AAC decodificado** con un corrimiento común (inicio y fin igual, para que la duración siga siendo un número entero de compases). Se elige entre el punto exacto del compás y 24 candidatos silenciosos de hasta un tiempo antes, según dos criterios: el salto de muestra en la unión no supera el salto natural y la energía > 8 kHz en la unión queda debajo del percentil 90 del propio loop.
   - El maestro es periódico (identidad de la costura ≤ −93 dB). Lo único que queda en la unión es ruido del codec.
   - Los corrimientos van de 0 a −557 ms. La duración del loop sigue exacta.

### 1.2 Ganancia en el catálogo

- Las variaciones nuevas llevan `gainDb: 0` porque ya están masterizadas al nivel que deben sonar. Si no lo llevaran, `catalog.ts` les aplicaría el *trim* de la canción (`−16 − lufs`).
- Los dos recortes (`menu_loop`, `circus_malus.stinger`) **no** llevan `gainDb`: heredan el *trim* de su canción y suenan igual que ella.
- Campos extra (ignorados por el lector, útiles para humanos): `lufs` (del loop decodificado) y `note`.

---

## 2. Variaciones (doc 18 §7)

### 2.1 YONOSE TODO

**`yonose_todo.ambient` · «Solo las teclas»** (H48, estado `island`/`emotional` por defecto del director).
- **Fuente:** `other` de los compases 24–31 (64,0–85,3 s). Es el *break*: las teclas desnudas, sin bajo y con la batería a −38/−81 dB. Es el `other` más limpio de la canción: tiene 15 dB menos de agudos de fuga que el del verso. Se repite 2 veces y conserva la paridad A/B del ostinato.
- **Cadena:** HP 140 Hz, LP 4,8 kHz y `tanh` suave. Respira con una bajada de −3 dB centrada en el compás 13.
- **Capas nuevas:**
  1. celesta que dobla el ostinato una octava arriba (compases 8–15), transcrito: `Si♭ Fa Do Fa Re♭ Fa Si♭ Fa | Si♭ Sol♭ Do Sol♭ Re♭ Sol♭ Mi♭ Re♭`;
  2. pad sobre la armonía **medida** del verso (raíces del bajo Sol♭–Mi♭–Si♭–La♭ → **Sol♭maj7 – Mi♭m9 – Si♭m – La♭6**), con las voces enlazadas;
  3. sub en las raíces;
  4. **la célula del arco en aumentación** (campana + celesta): `Si♭4 Do5 Re♭5` en el compás 4 y `Si♭4 Do5 Re♭5 Fa5` en el 12, que sigue subiendo;
  5. coro «uu» (compases 8–15).
- **Reverb:** sala de 2,8 s y una de 4,5 s para campanas y coro.
- **Tempo:** 90, **en fase con la original**. H48 pide que el bajo «entre en el siguiente compás»: se puede cruzar con `aftermath_bajo` o con la original en compás.
- **Límite honesto:**
  - Es oscura: 0,5 % de la energía sobre 2 kHz. La propia sección de origen tiene 1,6 %.
  - Las teclas se repiten idénticas cada 8 compases (es el mismo audio). La variación la aportan las capas nuevas.

**`yonose_todo.aftermath` / `_bajo` / `_ritmo` · «Reconstrucción»** (H60, región `olvidada`).
- `layers` (doc 18 §0.1) **no está implementado** en `catalog.ts`. Por eso se entregan **3 archivos del mismo largo y la misma grilla**, como pide doc 18 para ese caso. El motor puede cambiar de uno a otro **en la misma posición** (`cue(ref, {at: trackTime()})`). La capa 3/3 es la original desde `climax` (149,333).
- **Teclas:** el mismo *break* limpio, repetido a 12 compases.
  - Capa 0: LP 2,2 kHz y sala de 3,2 s: lejos, «en ruinas», con un aire de ruido filtrado.
  - Capa 1: LP 3,6 kHz y más cerca.
  - Capa 2: casi secas.
- **Bajo y batería** de los compases 32–43 (el coro). El compás 32 trae el **golpe de +12 dB**: se reemplazó por el 36, que es el mismo compás Sol♭ del ciclo. Así el loop no repite un golpe cada 32 s.
- **Niveles:** −18,0 → −17,5 → −17,2 LUFS. Sube al repararse sin saltar.
- **Límite honesto:**
  - En la capa 2 la batería es la del coro original. Es un **arreglo por capas**, no una recomposición, y su función es mecánica.
  - El 38 % de la energía de `_bajo` está bajo 80 Hz (es el 808 del original).

**`yonose_todo.menu_loop` · «Intro en bucle»** (título de la Parte II; O1-CINE ya lo desbloquea en H31).
- **Es un recorte, no una composición:** compases 0–7 del original, con loop en los compases 2–7 (doc 18 §7) y la misma ganancia que la canción.
- **Costura:** fundido entre 160 y 90 ms antes del final. Los últimos 90 ms son exactamente los 90 ms que preceden al compás 2. Así el salto también es continuo si el navegador corre todo 48 ms (las dos transiciones son Mi♭m → Si♭m, ostinato B → A).

### 2.2 WHEN I LOSE

**`when_i_lose.ambient` · «Voces de tinta»** (H33 Páginas Hundidas; `explore_mystery:paginas`; también la usan `island` y `explore`).
- **Fuente:** compases 2–33 (3,429–58,286 s) de `vocals` + `other`.
- **Cadena:**
  - `other`: HPSS armónico (margen 2), 85 % de lo armónico, LP 4,2 kHz.
  - Voz: HP 150 y *shelf* −3 dB @ 7 kHz.
  - Unión de loop: los últimos 250 ms del compás 33 se funden con el audio que precede al compás 2, que es la continuación propia de la canción (C → Am del ciclo medido).
- **Capas nuevas:**
  1. **el bajo pasa a pedal de Mi** (Mi1 + Mi2 + Si2, que respira); el bajo original era 96 % Mi;
  2. coro «uu» + pad sobre el ciclo medido de 8 compases (**C C Am Am Em Em Em Em**; en el *break* 24–31, **Em B7 G B7**);
  3. armónica de cristal en notas largas (Si5, Mi6, Sol5, Re♯6), muy baja;
  4. cueva de 4,6 s oscura.
- 140 de grilla (se siente 70), 32 compases.
- **Límite honesto:** la voz trae consonantes y respiraciones (se ven en el espectrograma). Entre 41 y 55 s no hay voz porque en la canción tampoco la hay: es un respiro.

**`when_i_lose.aftermath` · «Después de perder»** (primera derrota desde H31 / H49; `victory` no, es la derrota).
- **Fuente:** puente, compases 68–75 (116,571–130,286 s), con `vocals` + `other` (armónico) + `bass`. **Sin batería** (la batería entra a mitad del puente en el original; aquí no).
- **Cambio de tempo:** rubberband R3 ×1,25 → **112 BPM**. Las voces van con `-F` (formantes preservados). Es una derrota cantada más lenta, con la altura intacta.
- **Cadena:** LP de 3 kHz que **se cierra a 900 Hz** en los últimos 4 compases y sala de 5,5 s. Queda un pedal de Mi (sub + coro) que es lo último que se oye. 25 ms de *fade-in*.
- **Sin loop:** 8 compases a 112 (17,14 s) + 7 s de cola. El beat map tiene `bridge`/`outro` y los marcadores `fade_start`/`last_bar`/`tail`.
- **Límite honesto:** estirar voces ×1,25 es moderado (R3 lo hace bien en general), pero **es lo primero que hay que escuchar** por si quedan artefactos de fase («metálico»).

### 2.3 Hemkade

**`hemkade.ambient` · «Cielo abierto»** (Islas Invertidas, `island_night_astral` como 3.ª opción).
- **Fuente:** `other` de la intro (compases 0–7) y del *breakdown* (40–47: la melodía sola). Los *breakdowns* 60–72 y 168–180 son idénticos, así que se usó uno.
- **De-pumping:** el `other` trae los «huecos» del *sidechain* del bombo cada negra, incluso sin bombo. Se compensaron con una envolvente de techo de 1 tiempo, máximo +9 dB.
- **Medio tiempo con rubberband ×2** (R3, altura intacta) → **80 BPM**: 1 compás de la variación = 2 de la canción (3 s). Así cambiar a la batalla en compás sigue cayendo en la grilla.
  - **Medido:** alineación ±17 ms con la original estirada. Los parciales siguen limpios en el espectrograma (se revisó a 4096 puntos): no se ven «manchas».
  - La planitud espectral baja de 0,062 a 0,029: menos ruido, más tonal.
- **Unión intro → breakdown:** fundido de 0,6 s con lo que precede al compás 40. En la vuelta, el *breakdown* se apaga 0,3 s y la intro entra (la intro arranca de la nada en la canción).
- **Capas nuevas:**
  1. sub en las **raíces medidas** de la intro (Si♭ Do Fa Fa = iv–V–i–i) y luego pedal de Fa;
  2. pad (cuerdas + coro) en **Si♭m – Do7 – Fm – Fm** / **Fm Fm Fm(add9) Re♭maj7 Fm Fm Fm(add9) Fm7** (de la croma por compás);
  3. aire de cielo (dos bandas de ruido que se alternan dos veces por loop);
  4. sala de 5 s.
- Se oscureció (LP 4,8 kHz y *shelf* −3 dB @ 2,5 kHz): queda 22 % de la energía en 2–6 kHz, que es el carácter de la canción (original 10,7 % + 5,1 % arriba de 6 kHz).
- **Beat map:** `hemkade.ambient.json` (80 BPM, `intro` / `break` / `outro`, marcador `breakdown` en 27,0).
- **Límite honesto:**
  - Un supersierra estirado ×2 puede sonar «líquido». Los números no lo detectan. **Necesita oído.**
  - Hay una pequeña respiración de nivel en la vuelta del loop (fin del *breakdown* → inicio de la intro), cubierta en parte por la reverb.

### 2.4 LIKY FIGHT

**`liky_fight.explore` · «Puerto de fiesta»** (Puerto Cometa, rotación de `explore`).
- **Fuente:** compases 16–47 (29,31–87,94 s): prechorus, chorus, break y drop. Conserva la forma (el *break* sin batería y la anacrusa del drop).
- **Cadena:**
  - `drums`: HP 180 Hz (orden 4: **sin bombo**), LP 10 kHz, −9 dB.
  - `other` completo.
  - `bass` −10 dB.
- **Capa nueva:** **marimba a contratiempo** (en el «y» de cada tiempo) sobre el vaivén medido **Sol m / Re** (V de la armónica), con placa de 1,3 s.
- 131 BPM en fase con la original. 160k: la percusión necesita el *bitrate*.
- **Límite honesto:**
  - Es la más cercana a un *remix* de stems. La marimba es lo único nuevo.
  - Doc 18 no pedía ambient/aftermath de LIKY y no se hicieron (§6).

### 2.5 te ODIO

**`te_odio.explore` · «Señal filtrada»** (Disruptores H55; rotación de `explore`).
- **Fuente:** verso, compases 10–25 (20–52 s).
- **Cadena:**
  1. `other`: HPSS armónico y LP 750 Hz (orden 4).
  2. **Compuerta de «señal» en semicorcheas.** El patrón tiene huecos al 18 % (semilla fija). Además **se citan los stops de la canción**: del tiempo 3 de cada 4.º compás al siguiente tiempo 1, la señal cae a −22 dB.
  3. **El 808 se reemplazó** por un sub suave en las raíces medidas **La♭–Si♭–Sol–Fa**, que también obedece a la compuerta.
  4. Solo hats (`drums` HP 7 kHz).
  5. Estática de radio (crepitar + siseo) que sube en los cortes.
  6. Tensión: armónica de cristal en **Sol5 con un roce de La♭5** (el ♭2 frigio) cada 4 compases.
- **Límite honesto:** los cortes cada 8 s son marcados a propósito (en la onda bajan casi a silencio). Si cansan en exploración larga, se pueden bajar.

**`te_odio.ambient` · «Solo la voz»** (al ganar H55).
- **Fuente:** coro 2, compases 26–33 (52–68 s): `vocals` + `other` armónico. **Sin batería ni 808.**
- **16 compases:** 8 con la voz (placa de 2,4 s) y 8 donde **solo queda su eco** (*send* 100 % húmedo a una sala oscura de 6 s, LP 2 kHz, que da la vuelta al loop).
- **Capas nuevas:** pad en **La♭ – Si♭ – Sol m – Fa m** y sub suave.
- **Límite honesto:** se intentó transcribir el gancho de voz con pYIN para citarlo en otro instrumento. Dio alturas cromáticas inestables (Mi/Fa/Fa♯/Re♯), probablemente por *chops* procesados. **Se descartó**: no se resintetizó nada de la voz.

### 2.6 CIRCUS MALUS

**`circus_malus.explore` · «Cajita de música»** (Corona Celeste H45; `explore_mystery`). **Es un arreglo nuevo**, no un filtrado.
- **Riff medido con pYIN** en el stem `bass` (compases 0–3, octava de Mi1), tocado tres octavas arriba en **cajita de música**, cuantizado perfecto y seco:
  - `Mi · Re5 Mi5 Mi Fa Re Mi`
  - `Mi Mi Mi Mi Mi Mi Re Mi`
  - (A)
  - `Mi Mi Mi Mi Mi Mi Sol Fa♯`
  - Corrige el `Re♯` de doc 18 §4.1: pYIN lee **Fa** (♭2) en el tiempo 3.
- **Celesta** con una línea cromática en blancas sobre las clases de altura medidas (Si–Do / Si–La♯ / … / **Sol♯ y Sol**, la ambigüedad mayor/menor de la canción).
- **Pizzicato** «um-pa» (Karplus-Strong). **Se corta en los compases 28–31, como el bajo de la canción** en el *build*.
- **Mecanismo:** un tic parejo en cada corchea.
- **Pista:** en el compás 31, **una sola vez**, el acorde «torcido» del final (Fa♯–Sol–Si–Do) en celesta.
- **El original muy lejos:** el `other` (teclas) de los compases 0–31, LP 1,4 kHz, 100 % en una «carpa» de 3,5 s.
- Primer plano seco (resonancia de caja de 0,25 s al 8 %), «demasiado perfecta».
- **Límite honesto:** la cajita es sintética (modos de lengüeta). Puede sonar «de juguete» más de lo deseado. 96 % de la energía en 250 Hz–2 kHz.

**`circus_malus.stinger` · «Corrección»** (desbloqueo H62). **Recorte sin procesar** de 115,19–125,05 s, con 10 ms de entrada, 50 ms de salida y ganancia de la canción (−8 dB). No es una composición.

---

## 3. Piezas nuevas (doc 18 §9)

La colección **`amb` «Otras grabaciones»** (doc 18 §8) agrupa las grabaciones que no son de una canción.

- Los ids `amb.night_astral` y `amb.nacar` son los que **ya usan** `src/cine/sound.ts` (`O1_SONGS`) y `director.json` (`explore:nacar`).
- Con `amb` como canción, `songOf('amb.nacar') = 'amb'` y la Fonoteca los agrupa en una fila.
- Un id con punto como canción suelta (`amb.nacar` en la raíz) nunca se marcaría como desbloqueado.

**`amb.night_astral` · «Noche de estrellas»** (H31, estado `island_night_astral`). Composición nueva, 32 compases a 90 (85,3 s), Si♭ menor con colores de Re♭.
- **Armonía (4 compases cada uno), sobre un pedal de Si♭:** Si♭m(add9) – Sol♭maj7 – Re♭maj9/Si♭ – Mi♭m9 – Si♭m(add9) – Sol♭maj7♯11 – Re♭/Fa – Fa7sus4.
- **Capas:**
  - pedal (Si♭1 + Fa2, periódico exacto);
  - pad lento (ataque de 3 s);
  - coro «uu» en los compases 8–15 y 24–31;
  - **la célula del arco**, celesta + campana:
    - compás 0: `Si♭4 · Do5 · Re♭5`, lenta;
    - compás 16: una octava arriba, **sigue subiendo** a Fa6 y Si♭6;
  - **glissandos de arpa hacia arriba** en tonos del acorde (compases 6, 14, 22 y 30): las estrellas que suben;
  - centelleos de celesta en la pentatónica de Si♭ menor (semilla fija);
  - **las teclas reales de YONOSE TODO** (*break* 28–31) transpuestas +12 con rubberband (sin cambiar el tempo), muy lejos y 100 % en reverb, en los compases 4–11, como un recuerdo.
- **Sala nocturna** de 6 s.
- **Beat map** con `motif_1`, `memory`, `gliss_1..4`, `motif_2`, `loop_start`/`loop_end`. Sirve para sincronizar la subida de estrellas de H31 con la música (`audioApi.on('marker:gliss_1', …)`).
- **Mide:** −18,0 LUFS. 18 % de la energía bajo 80 Hz (el pedal; se bajó 5 dB después de la primera pasada, que tenía 42 %).
- **Costura:** el loop mide 3675 × 1024 muestras exactas. El AAC codifica la vuelta **idéntica** (diferencia −71,5 dB).

**`amb.nacar` · «Isla Nácar»** (H39–H40, contexto `explore:nacar`). Composición nueva, Mi menor, 56 compases a 140 (se siente 70; cruza en compás con WHEN I LOSE), 96 s.
- **Armonía:** Em9 – Cmaj7♯11 – Am9 – B7sus4 · Em9 – Gmaj7/D – Cmaj7 – B7 · Em9 – Cmaj9 – Am9 – **Fmaj7♯11** (el color napolitano, «misterio de cristal») – Em9 – Bm7.
- **Capas:**
  - **armónica de cristal** (octava 4–5) + coro bajo;
  - sub en las raíces;
  - **crótalos** en arpegio (negras de la grilla de 140 = corcheas del pulso sentido), con frases que entran y salen;
  - **vibráfono con arco que cita el canto de WHEN I LOSE** (`La4 Si4 Do5 … Sol5 … Mi5`, doc 18 §4.4) en los compases 16 y 40;
  - **la voz real de WHEN I LOSE** (su primer canto, 3,43–10,29 s) **una vez**, muy lejos (sala de 6 s, LP 3,2 kHz), en los compases 28–31: el sintetizado pregunta y la voz antigua responde.
- **Sala «de cristal»** de 4,2 s, brillante.
- **No incluye la capa L3 de doc 18** (dembow suave a 140): la región explora y sus batallas ya usan WIL. `layers` tampoco existe en el catálogo.

**Remates** (`director.json › stingers`; **no** están en `tracks.json` como versiones porque la Fonoteca los mostraría como «???» para siempre). Excepción: **el motivo**, que es el «original» de la colección `amb`.

| Stinger (id del director) | Archivo | Qué es |
|---|---|---|
| `star_fall` | `music/amb.motivo.m4a` (3,8 s) | Doc 18 §9 `stinger.star_fall`. *Swell* invertido → **Si♭4 Do5 Re♭5** (la célula) → Fa5 Si♭5 (sigue subiendo) en celesta + campana + cajita, con un halo Sol♭ → Si♭m. La escena de apertura ya lo llama (`opening.ts`) |
| `unlock` | `music/stinger.unlock.m4a` (1,95 s) | Doc 18 §9 `unlock`. «Aguja» + **Si♭5 Do6 Re♭6** + Fa6 en cajita/celesta y una campana grave de Re♭4. Lo usa `engine.ts` al desbloquear una canción |
| `discovery_sib` | `music/stinger.discovery_sib.m4a` (2,6 s) | Arpegio menor que sube y se abre al relativo mayor (Si♭m → halo de Re♭). Celesta + cristal |
| `discovery_mi` | `music/stinger.discovery_mi.m4a` (2,6 s) | El mismo en **Mi menor** (Em → halo de Sol), para Páginas/Nácar |

`discovery` **se dejó procedural**. Un `discovery` en Si♭ menor sonando sobre la música de Nácar o Páginas (Mi menor) cae a un **trítono**. Las regiones deberían pedir `discovery_mi` o `discovery_sib` según su tonalidad. Fa m y Sol m (Invertidas y Cometa) **no se renderizaron**, pero el script es paramétrico: es un minuto de trabajo.

---

## 4. Integración: lo que se tocó y lo que falta en código ajeno

**Tocado:**
- `tracks.json`: variaciones agregadas al final de cada `variations[]` y la colección `amb`.
- `director.json`:
  - `island_night_astral.tracks` empieza con `amb.night_astral` (doc 18 §5.3);
  - `stingers.star_fall` y `stingers.unlock` pasan a archivo (`gain` 0,9);
  - nuevos `discovery_sib` y `discovery_mi`.
- Beat maps nuevos.
- Nada en `src/**`.

**Para los dueños del código (no se tocó):**
1. **Fonoteca, refs canónicas.** `unlockSong('amb.night_astral')` guarda esa clave, bien. Pero el «original» de la colección es `amb` (el motivo) y **nadie lo desbloquea todavía**.
   - Propuesta: desbloquear `amb` en H31, junto con `amb.night_astral`, porque el motivo suena en `star_fall`.
   - Mejor aún: que `unlockSong` normalice con `resolveTrack(ref)?.ref`.
2. **`yonose_todo.aftermath*`.** Son 3 archivos alineados: cambiar con `cue(ref, {at: audioApi.trackTime()})` en el siguiente compás. Si algún día existe `layers`, se pueden exportar los stems de cada capa desde los maestros.
3. **`nacar.ts`** pide `stingerOr('discovery')`. Con la música de Nácar en Mi menor, conviene `discovery_mi`.
4. **`hemkade.ambient` es de 80 BPM.** Su beat map existe y `bpm: 80` está en la variación. Las transiciones cuantizadas usan su propia grilla.
5. **Cebado AAC:** ver §1.1-6. Con la estructura entrada/loop/salida, los loops no dependen de que el navegador recorte el cebado.

---

## 5. Verificación (medido) frente a lo que necesita oído

Cada salida tiene en `…/audio-derivados/variaciones/`:
- `img/<id>.png`: onda + espectrograma del AAC decodificado, con loop y marcadores. **Se revisaron todas.**
- `informes/<id>.json`: todo lo medido.

| Id | Salto en la unión / natural | > 8 kHz en la unión / p90 del loop (dBFS) | Igual con cebado sin recortar | Identidad del maestro |
|---|---|---|---|---|
| yonose_todo.ambient | 0,0112 / 0,0114 | −70,4 / −65,4 | 0,0193 / 0,0198 · −67,3 / −65,6 | −99,6 dB |
| yonose_todo.aftermath | 0,0067 / 0,0070 | −66,6 / −62,5 | 0,0040 / 0,0076 · −65,9 / −62,4 | −98,2 |
| yonose_todo.aftermath_bajo | 0,0017 / 0,0038 | −82,2 / −77,2 | 0,0072 / 0,0127 · −79,8 / −76,8 | −100,5 |
| yonose_todo.aftermath_ritmo | 0,0031 / 0,0035 | −76,8 / −39,9 | 0,0029 / 0,0036 · −74,7 / −39,4 | −99,3 |
| yonose_todo.menu_loop | 0,0095 / 0,0107 | −71,6 / −69,2 | 0,0081 / 0,0076 · −77,9 / −68,9 | −70,8 (empalme) |
| when_i_lose.ambient | 0,0063 / 0,0063 | −83,6 / −60,0 | 0,0038 / 0,0040 · −85,0 / −59,9 | −94,2 |
| hemkade.ambient | 0,0097 / 0,0140 | −57,3 / −48,6 | 0,0159 / 0,0162 · −57,4 / −48,6 | −101,3 |
| liky_fight.explore | 0,0062 / 0,0078 | −57,1 / −39,7 | 0,0139 / 0,0245 · −50,5 / −39,8 | −95,3 |
| te_odio.explore | 0,0012 / 0,0014 | −58,7 / −47,3 | 0,0047 / 0,0057 · −51,3 / −47,1 | −93,4 |
| te_odio.ambient | 0,0073 / 0,0075 | −89,3 / −64,1 | 0,0014 / 0,0036 · −82,8 / −64,6 | −97,4 |
| circus_malus.explore | 0,0154 / 0,0162 | −79,2 / −59,0 | 0,0114 / 0,0122 · −63,9 / −58,1 | −102,2 |
| amb.night_astral | 0,0207 / 0,0207 | −66,0 / −58,4 | 0,0079 / 0,0079 · −66,2 / −58,4 | −99,2 |
| amb.nacar | 0,0146 / 0,0152 | −71,6 / −62,3 | 0,0075 / 0,0094 · −71,3 / −63,4 | −93,5 |

- En las 13 costuras, el salto de la unión es **≤ el salto natural** del audio en ese punto (la única excepción es el `menu_loop` con cebado sin recortar: 0,0081 frente a 0,0076, ≈ igual). La energía de alta frecuencia en la unión queda **debajo del p90** del propio loop. **No hay clic medible.**
- La «identidad del maestro» compara ±20 ms alrededor del fin con lo mismo alrededor del inicio en el WAV antes de codificar. −93 a −102 dB es igualdad numérica. El `menu_loop` es un empalme del original y da −70,8.
- **Medido:** LUFS integrados del loop (pyloudnorm) y del archivo (ffmpeg `ebur128`), TP con sobremuestreo 4× sobre el AAC decodificado (todas ≤ −1,7 dBTP), pico a corto plazo de los remates (−14,0 a −14,1 LUFS-S), largo de loop entero en compases, alineación del estirado y bandas espectrales.
- **No medible (necesita el oído del dueño), por prioridad:**
  1. `when_i_lose.aftermath`: las voces estiradas ×1,25 (¿fase o «metálico»?).
  2. `hemkade.ambient`: los supersierras a medio tiempo (¿se ensucian?) y la pequeña respiración en la vuelta.
  3. `circus_malus.explore`: si la cajita sintética convence o suena a juguete barato.
  4. `amb.night_astral`: si el recuerdo de las teclas transpuestas (compases 4–11) suena a «recuerdo» o a ruido, y si el pedal pesa en auriculares.
  5. `te_odio.explore`: si los cortes de señal cada 8 s cansan.
  6. Equilibrio general: las capas sintetizadas (pad, coro, cristal) frente a los stems. La mezcla se decidió por números y espectrogramas, no por oído.

---

## 6. Descartado o no hecho (y por qué)

- **Resíntesis de la melodía de Hemkade:** el `other` es un muro de supersierras polifónico; la transcripción por corcheas fue ruidosa. Se usó el stem estirado en lugar de un instrumento nuevo.
- **Cita del gancho de te ODIO:** pYIN inestable (§2.5).
- **Capas de jefe de Hemkade** como archivos: doc 18 dice que no hacen falta (se usan las secciones del original). No se generaron.
- **LIKY ambient/aftermath:** doc 18 no los pide; `explore` cubre Cometa y `victory` usa el `last_bar` del original.
- **`circus_malus.ambient`:** el director lo lista como 3.ª opción, pero doc 18 no lo define; `explore` cumple esa función.
- **`amb.archivo`, `amb.suenos`, `amb.umbral`, `boss.umbral`, motivos de facciones y REGISTRO 000:** son de las Oleadas 3–4. Quedan para después (el método y los sintetizadores ya están en los scripts).
- **`layers`** (doc 18 §0.1): no lo soporta el catálogo → 3 archivos para la reconstrucción.

---

## 7. Archivos y reproducción

| Qué | Dónde |
|---|---|
| Audio del juego (nuevo) | `game/public/music/{<id>.<kind>, amb.*, stinger.*}.m4a` — 14,9 MB |
| Maestros FLAC 24 bit | `…/audio-derivados/variaciones/<id>.flac` |
| Imágenes (onda + espectrograma) | `…/audio-derivados/variaciones/img/<id>.png` |
| Informes medidos | `…/audio-derivados/variaciones/informes/<id>.json` |
| Scripts | `…/audio-derivados/scripts/variaciones/`: `lib.py` (DSP + sintetizadores + análisis), `fin.py` (forma del archivo, normalización, AAC, verificación, imágenes), `comp.py` (enlace de voces), `v_*.py` (una por canción; `v_new.py` = noche + remates, `v_nacar.py`), `maps.py` (beat maps), `reencode.py`, `catalog_add.py` |

Para reproducir hace falta un venv con numpy, scipy, soundfile, librosa, pyloudnorm y matplotlib, más `rubberband` (Homebrew) y ffmpeg con `aac_at`. Los scripts leen los stems desde la ruta de doc 18. El venv de esta sesión se borró al terminar.

---

## Remixes de batalla

> Agente BATTLE-REMIX, 2026-10-10. Regla del dueño (doc 28): las 6 originales quedan para los **Momentos musicales**;
> en batallas y juego normal suenan versiones «más comprimidas, más diferentes». Sin `git commit`. Originales intactas.

### Para el dueño

- Hay **un remix de batalla por canción** (6 archivos, **7,6 MB** en total). Todas las batallas de la Parte II suenan ahora con
  ellos; ninguna batalla ni el director piden una original.
- No son la canción recortada: se **reordenaron las secciones** desde las pistas separadas y cada una tiene **un instrumento nuevo**
  que toma el gancho, más baterías/rellenos nuevos e impactos. Misma tonalidad, tempo y groove: se reconocen.
- Todas tienen la misma forma: intro corta → **bucle sin costura** (verso → drop → break → clímax) → **remate** final para la victoria.
- Suenan a −16,5 LUFS (YONOSE −17,4, la más dinámica), como las batallas de antes.
- **No se pudo escuchar nada.** Orden sugerido para escuchar: ① LIKY (el acordeón), ② CIRCUS (el calíope y el final raro
  re-orquestado), ③ WHEN I LOSE (los metales), ④ YONOSE (versión decidida), ⑤ te ODIO (los cortes de señal), ⑥ Hemkade.

| Id | Título | Dur. | KB | Loop (s) / compases | LUFS loop | TP | Qué la hace distinta |
|---|---|---|---|---|---|---|---|
| `liky_fight.battle` | Pelea de acordeón | 63,1 s | 1265 | 7,326–58,623 / 28 | −16,6 | −4,0 | **Acordeón musette nuevo** con el gancho (Re–Re–Re–Si♭–Sol / La…Fa♯) y comping a contratiempo; verso con la batería del coro y sin melodía; palmas, güira, impactos |
| `hemkade.battle` | Capas del cielo | 52,7 s | 1071 | 5,991–47,991 / 28 | −16,6 | −2,3 | Verso **sin bombo ni bajo** con redoble de bombo; **arpegio pluck nuevo** con sidechain; coro; remate de un acorde |
| `when_i_lose.battle` | Cuernos de tinta | 59,6 s | 1172 | 6,857–54,857 / 28 | −16,5 | −2,5 | **Metales nuevos** con el canto (La–Si–Do…Sol…Mi); verso instrumental (sin voces); **taikos**; las voces solo en intro, break y clímax |
| `circus_malus.battle` | Calíope | 65,0 s | 1334 | 4,792–57,592 / 22 | −16,5 | −3,4 | El riff en un **calíope nuevo** (intro sola); contracanto en cajita; hats/redobles de trap y 808; **el final raro re-orquestado** (4 acordes en blancas) |
| `te_odio.battle` | Señal rota | 64,4 s | 1365 | 3,980–59,980 / 28 | −16,5 | −4,3 | **Campana FM nueva** en arpegio; el gancho con **cortes de señal** (la voz sigue); tartamudeo glitch antes del clímax |
| `yonose_todo.battle` | Aunque no lo sepa todo | 70,1 s | 1383 | 5,331–63,998 / 22 | −17,4 | −1,6 | **Decidida, energía media**: cuerdas staccato sobre el ostinato, **metales que suben por la célula del arco**, timbales; remate con la célula en campanas |

AAC-LC 160k (`aac_at` cvbr), 44,1 kHz. Ganancia estática, **sin limitador** en ninguna. Todos los TP medidos sobre el AAC decodificado (≤ −1,6 dBTP).

### Forma (igual en las 6) y mapas de beats

`[intro] [verse | drop | break | climax] = LOOP [outro]`. Secciones y marcadores con los **mismos nombres** en las 6
(`beatmaps/<canción>.battle.json`), así los planes se escriben igual para todas:

| Nombre | Qué es |
|---|---|
| `intro` | 2–4 compases, antes del loop |
| `verse` | inicio del loop, contenido (energía ~0,7) |
| `pre_drop` (marcador) | 2 compases antes del drop: el **primer movimiento enemigo** salta aquí (ver doc 24 §5) |
| `build_1` (marcador) | el compás antes del drop (relleno/redoble) |
| `drop` · `first_drop` | el drop (impacto); golpe `drop` 1,0 |
| `break` · `breakdown` | 2–4 compases tranquilos (la melodía sola / el filtro) |
| `build_2` (marcador) | el compás antes del clímax (redoble, riser o tartamudeo) |
| `climax` · `intense` | lo más intenso del loop, **la sección a la que saltan las fases**; golpe `drop` 1,0 |
| `outro` · `last_bar` · `sting` | el **remate de victoria**, después del fin del loop (sin loop). Tocado sin loop, `climax` sigue directo al remate |

- `hits` (choreografía, SINCRO): el método de `hits.py` sobre las pistas ya mezcladas del remix (3 por compás, fuerza por rango
  0,3–1) + golpes estructurales (`phrase` cada 4 compases, `drop`, `build`, y en te ODIO 4 pares `stop`/`reentry`).
  73–100 golpes por remix; 27–37 con fuerza ≥ 0,8 (≈ 0,5–0,6 ventanas de SINCRO por segundo, como LIKY original).
- `voice` en WHEN I LOSE y te ODIO (dónde canta la voz).

### Cómo se hicieron (scripts en `…/audio-derivados/scripts/remixes/`)

- `rlib.py` (sobre `variaciones/lib.py` + `fin.py`): **carriles de stems por compás** (cada compás destino toma un compás fuente;
  cortes con fundido lineal de 10 ms con pre-roll propio), voces nuevas (acordeón musette de 3 lengüetas, metales con «blat»,
  calíope, pluck con filtro, campana FM, cuerdas staccato, taiko/toms, güira, palmas, hats, impacto, riser, redoble acelerado
  con un golpe recortado del stem de batería), nivel relativo por LUFS, detector de golpes, `assemble`, `finish`, `write_beatmap`.
- El **loop se renderiza circular**: los cortes, las notas y las reverbs dan la vuelta (`periodic()`), así el maestro es
  periódico a la muestra (identidad −240 dB). La intro termina en 30 ms de fundido + **90 ms que son el final del loop**:
  el punto de loop puede moverse ≤ 28 ms (refinado sobre el AAC) y un navegador que no recorte el cebado AAC (+48 ms) sigue
  saltando dentro de audio idéntico.
- `r_liky.py`, `r_hemkade.py`, `r_wil.py`, `r_circus.py`, `r_teodio.py`, `r_yonose.py`: el arreglo de cada una (cabecera
  de cada script = qué compases fuente van en cada sección). `catalog_add.py` agrega al catálogo.
- Maestros FLAC, PNG (onda + espectrograma, revisados los 6) e informes en `…/audio-derivados/remixes/`.

### Costuras (medido sobre el AAC decodificado)

| Id | Salto en la unión / natural | > 8 kHz unión / p90 loop (dBFS) | Con cebado sin recortar | Desplaz. |
|---|---|---|---|---|
| liky_fight.battle | 0,0088 / 0,0091 | −52,8 / −38,6 | 0,0178 / 0,0277 · −45,2 / −37,0 | −2,5 ms |
| hemkade.battle | 0,0177 / 0,0257 | −41,8 / −30,0 | 0,1578 / 0,1513 · −31,9 / −30,0 | −9,5 ms |
| when_i_lose.battle | 0,0052 / 0,0065 | −52,9 / −37,1 | 0,0061 / 0,0082 · −72,8 / −37,0 | 0 |
| circus_malus.battle | 0,0056 / 0,0062 | −67,1 / −41,4 | 0,0112 / 0,0143 · −54,5 / −41,1 | −8,2 ms |
| te_odio.battle | 0,0068 / 0,0080 | −53,0 / −36,2 | 0,0037 / 0,0067 · −56,3 / −34,0 | −20,3 ms |
| yonose_todo.battle | 0,0062 / 0,0061 | −73,1 / −37,7 | 0,0026 / 0,0044 · −70,8 / −38,1 | −2,0 ms |

En las 12 mediciones la energía de alta frecuencia en la unión queda bajo el p90 del loop y el salto ≈ el natural: **sin clic medible**.
(Hemkade con cebado: 0,158 frente a 0,151 natural, en pleno golpe de bombo.)

### Catálogo y Fonoteca

- `tracks.json`: una variación `kind: "battle"` al final de cada canción (`<canción>.battle`, `gainDb: 0`, `beatmap`, `loop`, `lufs`,
  `note`). Ningún id existente cambió.
- Desbloqueos (lógica de doc 18 §8: se desbloquea donde se gana su batalla): `when_i_lose.battle` H35 · `liky_fight.battle` H38
  (golpe final de Canelo) · `yonose_todo.battle` H39 · `circus_malus.battle` H41 · `te_odio.battle` H52 · `hemkade.battle` H57.
  **Las originales ya no las desbloquea ninguna batalla**: las desbloquea su Momento (ver doc 24 §5).

### Límites honestos / lo que necesita oído

1. Las capas nuevas son **sintetizadas en numpy** (acordeón, metales, calíope): pueden sonar «de juguete» o secas. Los niveles se
   pusieron por LUFS relativos, no por oído.
2. LIKY: el gancho del acordeón se armó con la transcripción (pYIN, ruidosa) + doc 18; puede chocar ritmicamente con la melodía
   original en el drop.
3. Los cortes de compás entre fuentes no contiguas (p. ej. LIKY verso → anacrusa 39) cortan colas de 808/pads: van en el tiempo 1,
   tapados por el golpe, pero conviene escucharlos.
4. YONOSE: el break (2 compases de teclas) es muy suave (−27 a −32 dB RMS) frente al resto: es a propósito (respira), quizá demasiado.
5. Hemkade: el verso sin bombo está ~5 dB debajo del drop.

---

## Re-arreglos 2026-10-10 (pedido del dueño después de escuchar las 58)

> Agente REMIX-ARREGLOS. El dueño escuchó todo y pidió cambiar **solo estas 4**. Lo demás quedó igual. Lo anterior está
> respaldado fuera del repo en `…/audio-derivados/respaldo-remixes-2026-10-10/` (m4a, FLAC, beatmaps, scripts, `tracks.json`).
> Scripts nuevos: `…/audio-derivados/scripts/arreglos/` (`alib.py` = FluidSynth + GeneralUser GS con afinación fina por pitch
> bend; `a_circus.py`, `a_yonose.py`, `a_teodio.py`, `a_wil.py`; análisis `splice.py`, `novelty.py`, `rough.py`, `spec.py`,
> `measure.py`). Variantes descartadas en `…/audio-derivados/arreglos/<pista>_<variante>/`.

| Id | Lo que dijo el dueño | Qué se quitó | Qué se puso / cambió |
|---|---|---|---|
| `circus_malus.explore` «Cajita de música» | «se escucha tétrica… cambiaría los sints de su original a algo más propio» | El **fantasma del piano/sintes de la original** (stem `other` en una «carpa» de 3,5 s; además estaba **~26 cents bajo** frente a la cajita en La 440, y eso sonaba a desafinado), la cajita sintetizada en numpy, el **tic** de mecanismo, la línea **cromática descendente** de celesta y el acorde «torcido» del compás 31 | El mismo riff medido en una **cajita de música real** (muestreada, una octava arriba, como suenan las cajitas), **celesta** con un contracanto que canta en **Mi mayor** (Sol♯), **arpa** suave en el «um-pa» (quinta abierta; se corta en 28–31 como el bajo de la canción) y en arpegios en el break, un arpegio de celesta que devuelve el loop, sala pequeña y cálida (1,4 s, 16 %). Armonía por ciclo de 4 compases: Mi (quinta abierta) · Mi7 · Mi · Do → Mi m (la ambigüedad Sol/Sol♯ de la canción, ahora dulce). Rugosidad (Plomp-Levelt) 0,078 → **0,034**; perfil de Mi mayor 0,55 → 0,75 |
| `yonose_todo.battle` «Aunque no lo sepa todo» | «está raro ese sint que le añadiste» | Los **metales sintetizados** (la célula del arco), las «cuerdas staccato» (una voz de pad desafinada que doblaba el ostinato) y los toms sintéticos que hacían de timbales; en el remate, el acorde de metales y las campanas numpy | Solo la música de la canción + **timbales orquestales muestreados** con el mismo ritmo (afinados −10 cents, como la canción), los redobles de su propia caja, impactos 1 dB más bajos. Remate: el golpe del clímax + **cuerdas** en Si♭m + la célula del arco en **celesta** (como en «Solo las teclas»). Variante B (cuerdas muestreadas con la célula) descartada |
| `te_odio.battle` «Señal rota» | «está un poco rara esas "campanas" que le añadiste» | El **arpegio de campana FM** (verso y, una octava arriba, el clímax) | Nada ajeno: las **teclas de la propia canción** en el verso se abren poco a poco (paso bajo 1,2 → 6 kHz en los 8 compases, antes fijo en 1,5 kHz), así el verso sigue creciendo hacia el gancho. Cortes de señal, tartamudeo, hats e impactos iguales. Variante B (piano muestreado suave) descartada |
| `when_i_lose.battle` «Cuernos de tinta» | «está raro el cambio, no me disgusta, solo lo siento antinatural un poco» | Las dos uniones que la canción nunca hace: (1) la intro era la **primera mitad** de la frase de voces (0–3) y el dembow entraba **completo desde el silencio** (+10 dB de golpe; en la canción la batería crece en 8–15); (2) el verso llegaba al drop sin el respiro previo | (1) La intro es la **segunda mitad** de esa frase (4–7, termina donde termina la frase) sobre el golpe de apertura (bajo del compás 0), y entra **la batería de la propia canción de los compases 14–15**: el verso llega igual que 15 → 16 en la original (salto 26 → 14,5 dB pasa a 21 → 14,5). (2) El último compás del verso es **el compás previo al drop de la canción** (39: batería más fina, el bajo respira) y el golpe del 40 cae como en la original; impacto 2 dB más bajo. (3) El canto de los «cuernos» (mismas notas) ahora en **cornos franceses + trombones muestreados**, con un respiro de crescendo al entrar, −1 dB. Variante A (mismas transiciones, metales numpy) descartada |

**Mediciones (AAC decodificado; antes → después).** Duraciones, tempo, compases y secciones idénticos; el loop dura lo mismo
(solo se corre el punto refinado, ≤ 27 ms, dentro de lo que pide `originalsReserved`).

| Id | Duración | LUFS loop | TP (dBTP) | Loop (s) | Costura (salto / natural · >8 kHz vs p90) |
|---|---|---|---|---|---|
| `circus_malus.explore` | 84,03 = | −18,02 → **−18,01** | −6,5 → −4,5 | 1,893–78,693 → **2,376–79,176** (32 compases) | 0,023 / 0,023 · −78 / −59 dBFS |
| `yonose_todo.battle` | 70,10 = | −17,41 → **−17,47** | −1,6 → −2,3 | 5,331–63,998 → **5,308–63,975** (22) | 0,006 / 0,006 · −77 / −37 |
| `te_odio.battle` | 64,43 = | −16,54 → **−16,55** | −4,3 → −4,1 | 3,980–59,980 → **3,973–59,973** (28) | 0,002 / 0,008 · −50 / −35 |
| `when_i_lose.battle` | 59,60 = | −16,53 → **−16,53** | −2,5 → −3,1 | 6,857–54,857 → **6,832–54,832** (28) | 0,001 / 0,002 · −81 / −38 |

- Maestros periódicos a la muestra (identidad −240 dB en los remixes, −97 dB en la cajita); con cebado AAC sin recortar
  también sin clic. YONOSE: el remate se bajó 1,4 dB porque su golpe marcaba el pico del archivo; así el loop quedó en −17,5
  como antes, sin limitador.
- Beatmaps de las 3 batallas regenerados con el mismo método (mismas secciones, marcadores, `stop`/`reentry` de te ODIO y
  `voice`; en WHEN I LOSE la voz de la intro ahora empieza en 0). Golpes: YONOSE 71 (28 fuertes), te ODIO 88 (35), WIL 92 (34).
- Instrumentos muestreados: **GeneralUser GS v2.0.3** (S. Christian Collins; licencia libre para hacer música) con
  **FluidSynth 2.6.1** (LGPL), ya instalados por COMPOSER. No se bajó nada nuevo; solo un venv de Python fuera del repo.
- Catálogo: `tracks.json` (loop, `lufs`, `note` de las 4); `battles.json` solo cambió el texto `$doc` de YONOSE.
- **Para volver atrás:** copiar `respaldo-remixes-2026-10-10/music/*.m4a` → `game/public/music/`,
  `respaldo…/beatmaps/*.json` → `game/src/data/music/beatmaps/` y los 4 bloques de `respaldo…/catalogo/tracks.json`.
