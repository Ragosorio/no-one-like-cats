# FILM-ACTO2 — películas del Acto II (ronda 4, oleada 2)

**Qué estoy haciendo:** TERMINADO. Espero la revisión del dueño. Sin commits ni push.

## Hecho

**Películas** (`game/src/film/films/acto2/`, registradas con una línea en `game/src/film/films.ts`; ruta `?film=<id>`):

| Id | Película | Estilo y presentación | Duración | Clics | Música |
|---|---|---|---|---|---|
| `f09` | PP «Ciudad Mayúscula» (H75) | Cómic moderno «verso arácnido»: las letras son los edificios, la cámara lee la página viñeta por viñeta, cada página cae en el platillo | 40,4 s | 0 | `fut.vineta` |
| `f10` | PP «Villanos sueltos» (H76) | Periódico que gira (noticiero de los 40): portadas de *El Clarín Viñeta* horneadas, frenazo en cada fanfarria | 30,4 s | 0 | `fut.vineta.noticiero` |
| `f11` | PP «Cruceta» (H77) | Edad de Plata dibujada por el rival: su portada nos pinta como villanos; páginas interiores; la portada real en manos de Luzterna | 40,4 s | 0 | `fut.vineta.mono` |
| `f12` | PH «Cerito» (H78 ♥) | Documental con visión nocturna: visor, código de tiempo, autoenfoque, narración susurrada en subtítulos; la tele se apaga | 80 s | 1 (la cobija: `inputs.cobija` = `left` faro / `right` palmera) | `xti.pad` (en loop) |
| `f13` | PP «El Gran Torneo» (H79) | Avance del próximo episodio de anime: cortinilla, llave del torneo, letras que golpean en cada corte | 29,9 s | 0 | `daria.calle` (en loop) |
| `f14_1`, `f14_2`, `f14_3` | PH «Entrenamiento» (H80 ♥) | Yonkoma: tira vertical de 4 viñetas en tramas, solo el azul de la linterna; al final se ve la tira entera | 3 × 20 s | 0 | `daria.piano` |
| `f15` | PP «Itō» (H81) | Rollo de ukiyo-e que se desenrolla de derecha a izquierda; cielo *bokashi*; Luzterna le hace una reverencia al dibujo y el dibujo se la devuelve | 40,4 s | 0 | `daria.piano` (en loop) |
| `f16` | PC Daria «Una sola línea» (H81) | Hilo continuo: el mundo es un hilo blanco sobre índigo; cada golpe corta el dibujo; el cuadro se deshilacha; en c81 el escenario se suelta y el hilo de Itō se vuelve gris (S4) | 103,4 s (c25 → fin, corte seco) | 2 opcionales (CORTA en c25,5; ¡FIN! en c80) | `daria` (original) |
| `f17` | PH «La Vocación» (H82) | Caravaggio: el anime se escurre a óleo en un marco dorado; *La vocación de san Mateo* y *La creación de Adán*; la linterna es la otra luz | 90 s | 1 (respuesta del Capi, cosmética) | `amb.vocacion` |

- **Cada PP lleva** dónde, qué pasa, por qué importa, el rival y **su regla mostrada** (un vuelo real del simulador, `battle/demo.ts` → `kit/demo.ts`, con el efecto de la regla dibujado encima), **una acción muda de Luzterna**, **una señal visible de Canelo** (la llama que baja) y LO QUE ARRIESGAMOS con su letra, sin nombrarse.
- **Giro (TEMPERATURA v3 y pasadas 4–6):** nada atraviesa a Luzterna, la regla no se repite, ninguna señal sobre su mortalidad; Esquirla va por Canelo; «Al gato no. Así no.»; el hilo de Itō gris al perder (S4); la gota de tinta **rebota** en la burbuja (H82) sin explicarse.
- **Estilos nuevos** (`game/src/film/styles/vineta.ts` + `vineta.catalog.ts`): `aracnido`, `periodico`, `edadplata`, `nocturna`, `manga`, `hilo`, `caravaggio`; tratamientos extra en `CAT_BAKES` (`hilo` = el gato como contorno blanco, `cel`, …). Documentados en `docs/part-iii/cine-v2/05-estilos-acto2.md`. Cambios en el núcleo: **dos líneas** (una en `film/catalog.ts`, otra en `film/styles/index.ts`), mismo patrón que FILM-ACTO1.
- **Kit** (`films/acto2/kit/`): página (`Panel`, `caption`, `balloon`, `Onoma`…), elenco y rasgos de suplentes, Bitácora con 4 entradas, tiros reales del simulador, `wordM` (la Ō que las fuentes no traen).
- **Plantilla de FILM-ACTO1** vestida para las dos cajas del acto: `registerBriefingSkin('p3d_superheroes' | 'p3d_anime', …)` en `films/acto2/index.ts`, fondos en `fondos.ts` / `fondoAnime.ts`. Muestras DEV: `?film=plantilla_s1`, `?film=plantilla_a1`.
- **Pruebas:** `game/tests/filmActo2.test.ts` (35, en verde). Suite completa: 948 pasan (2 saltadas). `tsc` limpio.
- **Rendimiento a 60 Hz** (M4, Chrome sin cabeza, 1920×1080, calidad alta, con sonido; la máquina tenía carga 3–26 por otros agentes, así que repetí las que tuvieron un tirón): las 11 películas a 59,9–60 fps, p95 16,7–16,8 ms, p99 16,8 ms. Sin tirones en la segunda medición: F10, F11, F12, F13, F14 (las 3), F16 y F17. Queda uno que se repite: **F09 a los 7,5 s** (50–117 ms, un cuadro); no aparece al avanzar cuadro por cuadro en modo scrub, así que no es un horneado que falte (parece del lado del audio o del navegador). F15 tuvo un cuadro de 67–83 ms en un momento distinto cada vez (ruido). Horneado: 1,1–8 s la primera vez (pinturas nuevas), 1,3–4 s con caché.
- **Integración** (mensaje del coordinador): ids `f14_1`/`f14_2`/`f14_3`; con la partida `?save=h75-acto2`, S-5 → `F09` y S-9 → `F11` (película), las demás etapas de Superhéroes → la plantilla con mi piel; `f12`, `f14_*`, `f16`, `f17` registradas para `actsFlow`.
- **Hojas de contacto (JPG):** `<scratch>/fa2/sheets/<id>.jpg`; con «Reducir movimiento» y «Reducir destellos»: `rm_<id>.jpg`; la plantilla vestida: `plantilla_s1_a1.jpg`.
- **Audio en loop verificado en vivo** (Chrome sin cabeza con sonido): F13 cambia de segmento sin congelarse (`filmEdit` de FILM-ACTO1).

## Suplentes (arte nuevo sin aprobar)

| Personaje | Suplente | Rasgos dibujados en código |
|---|---|---|
| Cruceta | `storybook_ink_cat` | antifaz de tinta, capa de papel de guion |
| La Pandilla del Ovillo | `milvidas_shadow_cat`, `sombrita_shadow_cat`, `medianoche_king_cat` | ovillos colgando del cinturón |
| El Estambre | todo en código (foto del periódico) | cuerpo de lana, remolino de estambre, playera de rayas, puños de ovillo |
| Gato Araña (en la portada de Cruceta) | todo en código | máscara roja con telaraña, ojos en lágrima, suéter azul con huellita de 8 patas |
| Héroes en las azoteas (F09) | siluetas en código | capa, casco, bufanda, sombrero; cada uno con su grosor de línea |
| Un Disruptor (F10) | `grafitera_spray_cat` | — |
| Gatito civil (F11) | `ronron_purr_cat` | — |
| Cerito | `mochi_bell_cat` (silueta + estática) | anillo blanco en la frente. **Ojo:** el Acto I usa `copito_snowball_cat`; aquí la silueta lleva la escena y la de copito (con sombrero) se leía como mancha |
| Super Siamés | `valquiria_lightning_cat` | cinta roja en la cintura |
| El rival que no te conoce | `molten_ember_cat` | banda en la frente, lágrimas |
| Gato ninja (tira 2) | `kage_ninja_cat` | — |
| Itō | `kintsugi_tea_spirit_cat` (alto, «kimono» de porcelana) | haz de hilos a la espalda como funda. **Ojo:** CINE usa `arcanito_lantern_cat` en el final; conviene unificar |
| Esquirla | `neon_glitch_cat` | esquirla de pantalla rota cian como cuchilla |
| La Mano | `tachon_strikeout_cat` pálido (como CINE) | mano blanca larga con uña de plumín |
| Duelistas del rollo (F15) | `vapor_ronin_cat`, `kage_ninja_cat`, `zarpa_pirate_cat` | aura dorada que se apaga |
| Tripulación en hilo (F16) | `zarpa_pirate_cat`, `valquiria_lightning_cat` (tratamiento `hilo`) | — |

Nunca se usa `nadie_static_cat`.

## Para otros agentes

- **MECÁNICAS-IMPL** (ya integrado por ellos; verificar solo esto): `b78_cobija` sale de `FilmResult.inputs.cobija` (`left` = faro, `right` = palmera; sin tocar, faro). F16 cierra la fase 1 de Itō (`reason: 'momento'`).
- **FILM-ACTO1 (plantilla):** el sello de la etapa dice `B-${n}` también en otras cajas (en Superhéroes debería ser S-n y en Anime A-n).
- **CINE / ARTE:** unificar suplentes de Itō y de Cerito entre actos.

## Falta

1. Revisión del dueño (empezar por F16, F12 y F09).
2. Cuando ARTE apruebe los gatos nuevos: cambiar `SLUG` en `kit/cast.ts` (un solo lugar) y quitar los rasgos dibujados que sobren.
3. El tirón de F09 a los 7,5 s, si se reproduce en el juego publicado.

## Cómo retomar

- `<scratch>` = `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/00759032-a2ee-4015-8909-72095c55724a/scratchpad`.
- Vite propio: `cd game && npx vite --config <scratch>/fa2/vite.fa2.config.ts` (puerto 5651, sin HMR).
- Herramientas en `<scratch>/fa2/pp/` (puerto 5651; `npm i puppeteer-core@24` ya instalado): `sheet.mjs` (hoja en JPG; borra los cuadros), `run.mjs` (rendimiento; `CAP=1` = 60 Hz), `val.mjs` (valida películas en el servidor), `clock.mjs` (reloj con sonido: detecta congelamientos), `scrubplay.mjs`, `fixture.mjs`, `perfall.sh`, `sheets.sh`. Un solo perfil por herramienta y se borra al terminar. El Vite y los perfiles ya se cerraron y borraron.
- Hojas de contacto: `<scratch>/fa2/sheets/`.

**Última actualización:** 2026-10-27, 01:05.
