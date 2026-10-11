# 30 · Composiciones nuevas (agente COMPOSER)

> 2026-10-10. Encargo: las piezas nuevas que el código de la Parte II ya pedía y nunca se grabaron (doc 18 §9). Antes de esto el juego tocaba variaciones o motivos sintetizados en su lugar (o nada: ver §4.1). Las 6 canciones originales no se tocaron y ninguna de estas piezas es una original: citan motivos, stems o el pulso de las canciones, como hizo `amb.nacar` con la voz de WHEN I LOSE. Sin `git commit`.

## Para el dueño (sin sorpresas)

- **4 piezas largas nuevas** y **16 remates cortos** (11,1 MB en total, AAC 160k/128k).
- **Archipiélago de los Sueños** suena distinto en cada isla: tiene una base (una canción de cuna en piano con fieltro) y **4 capas**, una por tipo de gato que duerme en tu isla esa noche. Las capas se prenden solas según quién duerme.
- **El Umbral** tiene una base y **3 capas**, una por cada fuerza que está en el borde. Cuando una fuerza se va, su capa se apaga.
- **El Archivo**: un ambiente lento a 60 pulsos por minuto, como un latido.
- **«Hilos»**: la música de una fase de jefe del final (160 BPM, orquesta + la batería de Hemkade), con secciones y golpes marcados para que la batalla se mueva a su ritmo.
- Remates nuevos: REGISTRO 000 (dos versiones), el Eco de Canelo, la tromba, el Kit de Vuelo, el cambio de canción en batalla, los Correctores, los Titiriteros, el tachón, la corrección rota, el Leviatán, Canelo Astral, SINCRO, el ronroneo de Corona y dos «hallazgos» (en Fa menor y Sol menor).
- Para que suenen como instrumentos de verdad se instaló **FluidSynth** con el banco libre **GeneralUser GS** (fuera del repo). Piano, celesta, arpa, cuerdas, metales, coro, kalimba y cajita de música son muestras reales; lo que es puro tono (armónica de cristal, gotas, drones) sigue sintetizado.
- **No se pudo escuchar nada.** Todo está medido (volumen, picos, costuras, espectrogramas revisados uno por uno). Lo que conviene escuchar primero está en §6.

---

## 1. Piezas

Todas: A = 440, maestro FLAC 24 bit en `…/audio-derivados/composer/`, imágenes (onda + espectrograma, revisadas) en `composer/img/`, informes medidos en `composer/informes/`. Volumen: ambientes −18 / −17,5 LUFS con todo sonando; remates −14 LUFS-S de pico a corto plazo; TP ≤ −1,5 dBTP medido sobre el AAC decodificado.

| Id | Dónde suena | Duración | Tamaño | Tonalidad / tempo | Forma |
|---|---|---|---|---|---|
| `amb.suenos` + 4 capas | región `suenos` (`explore:suenos`), cine H58 | 81 s (loop 72 s) + 4 × 42 s (loop 36 s) | 1,63 + 4 × 0,6 MB | Re♭ mayor / Si♭ menor, 80 | base 24 compases = ciclo de 12 ×2; capas de 12 |
| `amb.umbral` + 3 capas | región `umbral` (`explore_mystery:umbral`) | 70 s (loop 64 s) + 3 × 36 s (loop 32 s) | 1,44 + 3 × 0,57 MB | pedal de Si♭, 120 | base 32 compases; capas de 16 |
| `amb.archivo` | cine H54 (`explore_mystery:cine:h54_maneki`) | 92 s (loop 80 s) | 1,84 MB | drone de Si♭, 60 | 20 compases de 4 s |
| `amb.hilos` (= `boss.umbral`) | H63, fase `titiriteros` de `umbral_final` | 54 s (loop 42 s) | 1,10 MB | Si♭ m ↔ Fa m, 160 | intro 4 · verse 8 · drop 8 · break 4 · climax 8 · outro 2 |
| 16 remates `stinger.*` | ver §2 | 0,9–7,2 s | 12–144 KB | — | — |

### 1.1 `amb.suenos` «Archipiélago de los Sueños»

- **Idea:** acuarela pastel, una canción de cuna que se sueña; la célula del arco **invertida** (Re♭–Do–Si♭, cae: en los sueños las cosas van al revés). Doc 18 §9.
- **Armonía (12 compases, dos veces):** Re♭maj9 ×2 · Si♭m9 ×2 · Sol♭maj7♯11 ×2 · Mi♭m9 · La♭7sus4 · Re♭maj7/Fa · Sol♭maj9 · Si♭m(add9) · La♭9.
- **Base:** piano muestreado con fieltro (velocidades suaves + paso-bajo 2,6–4,2 kHz): arpegio de cuna en corcheas, notas graves en el 1, melodía que abre con Re♭5–Do5–Si♭4 y en la segunda vuelta sube una octava (Re♭6–Do6–Si♭5) y se hunde; cuerdas lentas + pad cálido; sub; un siseo de cinta a −26 LU; *wow & flutter* de cinta en todo (un ciclo cada 6 compases, el mismo período en la base y en las capas: se tambalean juntas).
- **Capas** (una por tipo de soñador, `state/sys/suenosDream.ts` `DREAM_LAYER_OF`):
  - `calido` (fuego, tierra, naturaleza, luz): kalimba muestreada, ostinato sincopado sobre las notas del acorde.
  - `agua` (agua, hielo, viento, tormenta, rayo): armónica de cristal en notas largas, gotas en la pentatónica de Re♭, campanitas cada 4 compases.
  - `magia` (magia, espíritu, cósmico, tiempo, sonido, cristal): celesta con la célula invertida, coro «oo», un glissando de arpa **hacia abajo** en el compás 12.
  - `hondo` (sombra, vacío, gravedad, tech): piano al revés que se hincha hacia cada segundo compás, cajita de música grave desafinada (vaivén de 6 ms) con la célula invertida, pad coral oscuro.
- **Mezcla:** base sola −20,9 LUFS; con las 4 capas −17,5 LUFS (TP −3,9). Una capa presente suena a 0,45–1 (la del tipo dominante a 1).

### 1.2 `amb.umbral` «El Umbral»

- **Idea:** el borde de la página: blanco, quieto, con las tres fuerzas encima. Doc 18 §9 («combina los cuatro motivos»).
- **Base:** drone de Si♭1 + Fa2 (periódico exacto), pad *halo* + cuerdas lentas que derivan cada 2 compases entre **Si♭sus2 → Si♭maj7♯11 (lidio) → Si♭m(add9) → Sol♭maj7♯11/Si♭** (lo mayor de los Titiriteros contra lo menor del corazón), cuerdas muy agudas y suaves (Fa6–Si♭6–Do7), aire de papel (ruido de banda que respira) y la **célula de REGISTRO 000** (Si–Do♯–Re, cajita muy desafinada) en los compases 6 y 22.
- **Capas** (una por fuerza):
  - `correctores`: cajita **seca** (sin sala), el **riff de CIRCUS MALUS movido a Si♭** (Si♭ La♭ Si♭ Do♭…, la ♭2 en el mismo lugar), sus acordes «perfectos» del final transportados +6 (Do–Re♭–Fa–Sol♭ → Do–Re♭–Fa–La♭) y un tic de woodblock perfectamente parejo.
  - `disruptores`: **el 808 y los hats reales de te ODIO** (stems, verso, compases 10–25 = 16 compases a 120), paso-bajo 420 Hz + saturación; hats con *bitcrush*; la señal cae −24 dB en los «stops» (tiempo 3 de cada 4.º compás) con estática; *tape stop* en el último medio compás.
  - `titiriteros`: arpa en **Si♭ lidio** (Si♭–Do–Re–Mi: la célula del arco con la tercera «corregida»), hilos de cristal (glissandos agudos) y un lápiz que escribe. Sobre el acorde menor el arpa se detiene antes del Re.
- **Mezcla:** base sola −20,2 LUFS; con todo −17,5 (TP −4,0).
- **Región:** antes de H62 suenan `correctores` 1 y `titiriteros` 0,5; con H62 hecha 0,7 / 0 / 0,6; durante H63 las tres a 1; con H63 hecha, ninguna (solo la página). El efecto de cine `retirada` las apaga en su misma duración; el `drive` `fuerzas` las sigue.

### 1.3 `amb.archivo` «El Archivo»

- **Idea:** el Archivo como hospital: luminoso, clínico, con algo vivo abajo. Doc 18 §9 (drone de Si♭, pulso de 60 tipo latido o monitor, papel, citas del motivo de los Titiriteros).
- **Contenido:** drone de Si♭; cuerdas lentas + coro «oo» que alternan **Si♭maj7♯11 (lidio)** y **Si♭m(add9)** cada 2 compases, puente Sol♭maj7♯11 – Mi♭m9 – Fa7 (compases 8–11); latido suave en cada tiempo (descansa a medias en el puente); un *bip* de monitor (Fa6) en cada compás; páginas que pasan y un lápiz; el arpa con Si♭–Do–Re–Mi en los compases 4 y 14 + armónica de cristal; y una sola vez, lejos, la célula del arco en su menor (Si♭–Do–Re♭, celesta, compás 18).
- −18,0 LUFS, TP −3,7. Bandas: 22 % bajo 80 Hz (drone y latido).

### 1.4 `amb.hilos` «Hilos» (= `boss.umbral`)

- **Idea:** los Titiriteros no tienen canción, solo su motivo; aquí ese motivo hace de jefe. Es la **célula del arco «corregida»**: Si♭–Do–**Re**–Mi (en Fa: Fa–Sol–**La**–Si). La mano que tira de los hilos vuelve mayor la tercera menor; los trompetas contestan con la célula verdadera (…–La♭ / …–Re♭).
- **Tempo y tonalidad:** 160 BPM (la grilla de Hemkade), Si♭ menor en el verso → Fa menor en el drop y el clímax. Los dos últimos compases del clímax van en **Do mayor** (V de Fa menor) y el remate es un acorde de Do que resuena: entrega a `hemkade.battle` `climax` en cualquier compás.
- **Arreglo (muestras GeneralUser GS):** intro con trémolo de cuerdas en Si♭, el arpa dice el motivo, un hilo de cristal baja; verso de marioneta (pizzicato en corcheas, cuerdas graves en *spiccato*, timbales), trompas con el motivo; drop con **la batería y el bajo de Hemkade citados** (stems, compases 24–31, pedal de Fa), cuerdas en semicorcheas, coro, golpes de metales; break con coro + trémolo + arpa + hilos de cristal y un redoble de timbal; clímax con todo y el motivo una octava arriba. En el verso, la batería ligera de Hemkade (compases 8–15, sin bombo). No se usan la melodía ni los *supersaws* de Hemkade (son de la canción y ya están en `hemkade.battle`).
- **Mapa de beats** (`beatmaps/amb.hilos.json`): secciones `intro 0–6 · verse 6–18 · drop 18–30 · break 30–36 · climax 36–48 · outro 48–54`, marcadores del vocabulario de los remixes (`first_drop`, `pre_drop`, `build_1`, `breakdown`, `build_2`, `intense`, `last_bar`, `sting`, `loop_start/end`), **88 golpes** (28 con fuerza ≥ 0,8) con el método de `rlib.detect_hits` + golpes estructurales (`phrase` cada 4 compases, `drop`, `build`).
- −16,5 LUFS en el loop (como los remixes), TP −1,9.

## 2. Remates

`game/public/music/stinger.<id>.m4a`, declarados en `director.json › stingers` con su receta de respaldo (`procedural`). Desde esta mañana un remate grabado que falla o tarda más de 700 ms toca su receta (`audio/stingers.ts`); ahora la receta puede ser un **motivo de escena** del mismo nombre (§4.2).

| Id | Dur. | Qué es | Respaldo | Lo llama |
|---|---|---|---|---|
| `registro_000` | 3,4 s | *observando*: Si4–Do♯5–Re5 en cajita −30 cents con vaivén, siseo de cinta; termina en Re | motivo `registro_000` | H32, panel REGISTRO 000, H53, O2 |
| `registro_000_despertando` | 7,2 s | lo mismo, resbala medio tono y cae **afinado** en Si♭–Do–Re♭ (celesta + cajita) → Si♭m con Fa arriba | `registro_000` | créditos (`creditsParteII.ts`) |
| `eco` | 3,4 s | la célula de LIKY (Re5–Si♭4–Sol4) en cajita, dos veces, la segunda se queda sin cuerda; Sol m en cuerdas | `eco` | H36, Ecos (`catEcos.ts`) |
| `canelo_astral` | 3,8 s | la célula de LIKY en celesta, sube más allá (Si♭–Re–Sol–Re6) y abre a **Sol mayor** (glock, cuerdas, coro) | `canelo_astral` | H53 |
| `sincro` | 0,9 s | Re5 + Sol5 en celesta + Sol6 en glock (131 BPM, Sol m) | receta nueva `sincro` | SINCRO acertado |
| `tromba` | 3,2 s | viento que sube + arpa por Fa menor → cae en **Fa** (cuerdas y metales al unísono, timbal) | `tromba` | H42 |
| `kit_vuelo` | 2,6 s | llave inglesa, trinquete, arpegio de **Fa mayor** que despega (glock + arpa, metales) | `kit_vuelo` | H43 |
| `ronroneo` | 3,4 s | seis ronroneos idénticos **exactamente en fase** (pulso de 26 Hz, respiración) + zumbido de Fa2 | `ronroneo` | Corona Celeste (O2) |
| `swap` | 1,4 s | *tape stop* de un golpe grave + rasguño + platillo invertido (sin tonalidad) | `swap` | H46, H63 (cambio de canción) |
| `correctores` | 3,4 s | acordes del final de CIRCUS (Fa♯–Sol–Si–Do → Fa♯–Sol–Si–Re) en cajita **seca**, un tic | `correctores` | H47, O2 |
| `titiriteros` | 4,8 s | arpa Si♭–Do–Re–Mi–Fa + halo Si♭maj7♯11, hilos de cristal, lápiz | `titiriteros` | H49, H54 |
| `leviatan_gracias` | 6,0 s | glissando grave de ballena en Fa (±7 semitonos) + **trompa Si♭3–Do4–Re♭4** (la célula), Fa m → Re♭ | `leviatan_gracias` | H57 |
| `tachon` | 1,3 s | lápiz que tacha + piano Si♭ al revés que se hincha y se corta | motivo `pluma` | H61, cada tachón |
| `correccion_rota` | 6,4 s | los acordes de CIRCUS secos; el 4.º se deforma y se para (*tape stop*); el piano toca Si♭–Do–Re♭ → Si♭m y la sala se abre | motivo `correccion` | H62 (victoria) |
| `discovery_fa` | 2,6 s | el hallazgo de doc 23 en **Fa menor** | `discovery` | Islas Invertidas (antes `discovery` en Do) |
| `discovery_sol` | 2,6 s | el mismo en **Sol menor** | `discovery` | Puerto Cometa (antes `discovery` en Do) |

Cinco remates percusivos (`correctores`, `sincro`, `kit_vuelo`, `canelo_astral`, `tromba`) llevan un limitador de pico suave (≤ 2,5 dB) para llegar a −14 LUFS-S; `correctores` quedó en −15,9 (la cajita seca es casi todo ataque) y `sincro` en −14,8 (dura 0,9 s).

## 3. API de capas (decisión)

**Elegido: N stems del mismo largo de grilla tocados en sincronía, cada uno con su ganancia**, como extensión compatible:

- `tracks.json`: una variación puede llevar `layers: [{ id, file, loop: {start, end}, gain? }]` (`gain` = valor por defecto, 1). El loop de cada capa **divide exactamente** el loop de la base (Sueños: 72 s / 36 s; Umbral: 64 s / 32 s), en compases exactos, sin refinar (si se moviera uno, se desalinearían). Los archivos de capa son `[1 compás][loop][1 compás]` y **nunca** llevan fundidos: el motor solo los toca dentro del loop.
- `audioApi.setLayers(ref, gains | null, { fade })` (`src/audio/api.ts`): ganancias 0..1 por id de capa; las que no se nombran quedan en silencio; `null` = los valores por defecto. Se guarda por pista: aplica ya si suena, o cuando empiece.
- `src/audio/layers.ts` (`LayerMixer`, nuevo; **no toca `player.ts`**, que es de MOMENTOS): un vigilante de 5 Hz mira el deck actual. Si es un deck decodificado (modo *buffer*) de una pista con capas, decodifica una vez cada capa con ganancia > 0 y la arranca como `AudioBufferSource` en bucle, en la muestra que corresponde a la posición del deck (mismo reloj del `AudioContext`: alineación a la muestra; `offset = capa.loop.start + mod(pos − base.loop.start, largo_capa)`). La capa entra por un `GainNode` **dentro del nodo de ganancia del deck**, así los fundidos, el *crossfade*, el *ducking*, el *trim* y el bus de música la afectan igual que a la base. Si el deck se adelanta, se pausa o se reanuda (cambia su fuente), las capas se realinean; si el deck se detiene, se van con él. Un deck que no está en bucle (la Fonoteca tocándola una vez) apaga las capas con el final del archivo.
- `catalog.ts` lee `layers` (`Resolved.layers` con URLs); `engine.ts` instala `layers.watch()` y `window.__audio.layers()` (DEV); `director.ts`: en la Fonoteca, una pista con capas se toca en modo *buffer* (necesita el reloj de muestra) y suena con sus capas por defecto (todas).
- **Descartado:** variantes premezcladas por cantidad (menos tamaño de código, pero 4 tipos de soñador × combinaciones no caben en el presupuesto, y no permitiría que las fuerzas del Umbral se vayan de a una); meter las capas dentro de `Deck` (invasivo en `player.ts`, que otro agente estaba cambiando).
- **Costo:** solo se descargan y decodifican las capas que suenan. Sueños con 4 capas ≈ 29 MB (base recortada al loop) + 4 × 16 MB decodificados a 48 kHz; el Umbral ≈ 25 + 3 × 14 MB.
- `yonose_todo.aftermath*` (3 archivos de doc 23) podría pasar a este sistema; no se tocó.

## 4. Qué se conectó y dónde

### 4.1 Hallazgo
Antes de esto, `audioApi.stinger('eco' | 'tachon' | 'swap' | 'sincro' | 'correccion_rota' | 'registro_000')` llamado **directo** (sin `stingerOr`) no sonaba nada: no tenían receta ni SFX con ese nombre. Ahora todos tienen archivo y respaldo.

### 4.2 Código
- `src/audio/layers.ts` (nuevo), `api.ts` (`setLayers`), `catalog.ts` (`layers`), `engine.ts`, `director.ts` (una línea), `stingers.ts`: receta `sincro` + `setStingerMotifs()` (si el archivo falla y no hay receta con ese nombre, toca el **motivo de escena** del mismo nombre), `cine/sound.ts` registra sus `MOTIFS` ahí.
- `state/sys/suenosDream.ts`: `DREAM_LAYER_OF` (elemento → tipo de soñador) y `dreamLayers(save)` (puro).
- `regions/suenos.ts`: `setLayers('amb.suenos', dreamLayers(G.s))` al entrar, `null` al salir. `regions/umbral.ts`: `forceMix(k)` al entrar, en `retirada`, en el `drive` `fuerzas` y `null` al salir.
- `ui/story/o4Cines.ts` (H58): la isla sueña con sus propias capas. `o2Cines.ts`: `ronroneo` por `stingerOr` (4 lugares). `o3Cines.ts`: `canelo_astral` y `titiriteros` (H54) por `stingerOr`. `regions/invertidas.ts` → `discovery_fa`; `regions/cometa.ts` → `discovery_sol`. `creditsParteII.ts` → `registro_000_despertando`. `app/oleada4Flow.ts`: la Fonoteca de H65 apunta a `amb.registro_000` (antes `registro_000`, que nunca existía) y H62 ya no toca el motivo `correccion` encima de su grabación.
- `dev/devMusicBattle.ts`: la ruta `?scene=battle&music=` también acepta planes `umbral_*` (para probar H62/H63).

### 4.3 Datos
- `tracks.json` (solo agregado, al final de la colección `amb` «Otras grabaciones»): `amb.suenos` (con `layers`), `amb.umbral` (con `layers`), `amb.archivo`, `amb.hilos` (`kind: battle`), `amb.registro_000` (el remate *despertando* como disco de la Fonoteca, doc 18 §8).
- **Fonoteca:** `amb.archivo` (H54, `o3Cines` `O3_SONGS`), `amb.suenos` (H58) y `amb.umbral` (H63) ya estaban en las listas y se desbloquean solos ahora que existen; `amb.hilos` al ganar `umbral_final`; `amb.registro_000` en H65.
- `director.json`: 16 remates con `file` + `procedural` + `gain`; contexto `explore_mystery:cine:h54_maneki` → `amb.archivo` (respaldo `circus_malus.explore`). `explore:suenos` y `explore_mystery:umbral` ya listaban sus ids.
- `battles.json`: `umbral_final` › regla `titiriteros` → `amb.hilos` `intro` con `loop: true` (entra por la intro y sigue en su loop; sin `loop` el `endTo` lo devolvía a CIRCUS) y respaldo `hemkade.battle` `breakdown` intacto; la victoria desbloquea `amb.hilos`.
- **Id:** `boss.umbral` se publica como **`amb.hilos`**. Un id `boss.umbral` necesitaría una «canción» `boss` con su original; como variación de `amb` su ref canónica sería `amb.boss.umbral` y el reloj de la batalla (`currentTrack() === tl.track`) nunca se engancharía.
- Mapas nuevos: `beatmaps/amb.{suenos,umbral,archivo,hilos}.json`.

## 5. Verificación

- `npm run typecheck`: limpio. Tests de audio y música (`originalsReserved`, `battleMusic`, `stingers`, `audio`, `oleada3Cine`): 67/67. `tests/oleada3Cine.test.ts` se actualizó: antes exigía que `amb.archivo` **no** existiera; ahora exige el disco y su archivo.
- `npm test` completo: 435/444 en una corrida con otros agentes trabajando; las 9 fallas fueron *timeouts* y paridades de sim (`crystal`, `forms`, `rupturasO2`, `momentos`) que **pasan aisladas (92/92)**: carga de la máquina, no estos cambios.
- **Headless con audio** (Vite propio en 5301 sin HMR ni ws y con caché propia; Chrome `--use-angle=metal --autoplay-policy=no-user-gesture-required`, perfil propio):
  - Sueños (`rupturas-o4`): suena `amb.suenos` en deck *buffer*; capas `calido` 1, `agua` 0,63, `magia` 0,54 (la partida no tiene soñadores «hondos»), 3 decodificadas, 0 fallas; bus de música −35 dB RMS.
  - Umbral: `amb.umbral` + `correctores` 1 y `titiriteros` 0,5 (antes de H62), −34 dB RMS.
  - Archivo: `setState('explore_mystery', { context: 'cine:h54_maneki' })` → `amb.archivo` (deck *buffer*).
  - Fonoteca: `listen('amb.suenos')` → deck *buffer* con capas; un `seek` realinea las capas; al final del archivo las capas bajan a 0 con él.
  - 16 remates: los 16 archivos respondieron 200 y el bus de música subió a −26…−37 dB RMS con cada uno.
  - H63 (`?scene=battle&music=umbral_final`): `signal('fase:titiriteros')` → `amb.hilos` desde la intro; el reloj de la batalla en modo `audio` sobre `amb.hilos` (posición oída = `trackTime`); `fase:umbral` → `hemkade.battle`.
- **Costuras** (sobre el AAC decodificado; el maestro es periódico a la muestra en todas): el salto en la unión ≈ el salto natural en ese punto y la energía > 8 kHz en la unión ≤ la natural del inicio del loop (en `amb.archivo` y `amb.umbral.correctores` la unión cae en un ataque real: el *bip*/latido y la primera nota de la cajita). También con el cebado AAC sin recortar.

## 6. Lo que necesita oído (por prioridad)

1. **`amb.hilos`**: el balance orquesta (GeneralUser GS) contra la batería de Hemkade, y si el motivo «corregido» de las trompas se oye como amenaza o como fanfarria.
2. **`amb.suenos` con distintas islas**: que cada capa sola sobre la base suene bien (sobre todo `hondo`, el piano al revés).
3. **`amb.umbral.disruptores`**: el 808 de te ODIO sobre el pedal de Si♭ (La♭–Si♭–Sol–Fa contra Si♭ es a propósito, pero puede pesar).
4. **`registro_000_despertando`** y **`correccion_rota`**: si el resbalón y la deformación se entienden en 1–2 s.
5. **`ronroneo`**: si suena a gatos o a motor.
6. `amb.archivo`: si el latido y el *bip* cansan en exploración larga.

## 7. Lo que falta

- Los Momentos (doc 29) no se tocaron.
- `titiriteros` tiene una sola versión (doc 18 pedía tres: nota al margen / mano de luz / revelación). Las escenas llaman un solo id.
- `motif.disruptores` (doc 18 §9) no se hizo como remate: ningún código lo llama; su idea vive en la capa `disruptores`.
- La capa L3 de `amb.nacar` (dembow) y `layers` para `yonose_todo.aftermath*` siguen pendientes; el sistema ya existe.
- H61 sigue con `when_i_lose.ambient` (doc 18 §5.2); `amb.archivo` podría ir ahí si se prefiere.
- `amb.hilos` no se puede probar desde una pelea real hasta llegar a H63; la ruta DEV `?scene=battle&music=umbral_final` lo muestra.

## 8. Herramientas y reproducción

- **Instalado** (fuera del repo, licencias libres):
  - `fluid-synth` 2.6.1 (Homebrew, LGPL-2.1, 3,2 MB).
  - SoundFont **GeneralUser GS v2.0.3** (S. Christian Collins, `github.com/mrbumpy409/GeneralUser-GS`; licencia: uso libre para crear música, también comercial), 31 MB, en `audio-derivados/tools/soundfonts/` con su `LICENSE`.
  - En el venv temporal (borrado al terminar): numpy, scipy, soundfile, librosa, pyloudnorm, matplotlib, mido.
- **Scripts:** `…/audio-derivados/scripts/composer/`: `clib.py` (voces nuevas, foley, efectos de cinta, `sf_render` con FluidSynth en modo periódico, `finish_layered`, `legato_chords`, `ambient_map`), `s_suenos.py`, `s_umbral.py`, `s_archivo.py`, `s_hilos.py`, `s_stingers.py [id…]`. Usan `../variaciones/{lib,fin,comp}.py` y `../remixes/rlib.py`.
- **Correr:** `python3 -m venv venv && venv/bin/pip install numpy scipy soundfile librosa pyloudnorm matplotlib mido`, luego `cd …/scripts/composer && ../../venv-o-el-tuyo/bin/python s_suenos.py`. Escriben directo en `game/public/music/` y en `src/data/music/beatmaps/`; los valores de `tracks.json` se copian de `composer/informes/<id>.json`.
- **`sf_render(circular=True)`** toca las notas 3 veces desfasadas un loop y se queda la copia del medio: el resultado es periódico (las colas dan la vuelta), igual que `periodic()`.
