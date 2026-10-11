# MOMENTOS — estado del agente (para retomar si se corta)

Sin spoilers de historia. Documento técnico completo: `docs/part-ii/29-momentos-musicales.md`.

## Qué estoy haciendo

Nada en curso: la segunda pasada de LIKY FIGHT está terminada y entregada al coordinador (sin commit).

## Hecho

- Motor `game/src/momentos/**` (doc 29 §4–5): partitura declarativa, reloj (audio/interno/pausa/entrada tardía/edición),
  núcleo de inputs, guardia de destellos, partida `ext.momentos`, «Volver a ver», gancho de batalla.
- H44 en dos fases (`state/sys/rupturasO2.ts`, cielo dormido en `battle/cielo.ts`), `BattleMusic.suspend/resume`.
- **Petición 1 — sincronía (hecho):** onsets por stem para las 6 canciones en
  `game/src/data/music/beatmaps/<id>.onsets.json` (kick, snare/acentos, perc, bass con duración y nota, melody, vox).
  Script fuera del repo: `~/Desktop/No one - raster (fuera del repo)/audio-derivados/scripts/onsets.py`.
  En pantalla: cada bombo = micro-golpe de cámara + pulso de luz + bote de los barcos + bocinas; cada acento = cañonazo /
  salpicadura / impacto; cada nota grave = balanceo del casco y oleaje (las más graves hacen temblar); la melodía =
  destellos y cut-ins. `audibleNow` compensa `outputLatency + baseLatency`.
- **Petición 2 — más fuerte (hecho):** `audioApi.musicBoost(db)` sube la canción hasta +6 dB mientras dura el Momento
  (nada la atenúa; los efectos van debajo). Medido: pico de salida −14,9 dBFS (mucho margen), ducking 0 dB.
- **Petición 3 — toda la canción (hecho):** los 237 s completos, segunda mitad nueva que escala (escenas nuevas, los
  barcos conservan sus daños, clímax en 218,0, final de verdad en el outro) y corte a la batalla al terminar.
- Medido en tiempo real (canción completa): deriva entre lo dibujado y lo que suena: mediana 0 ms, p99 0 ms en 61 691
  cuadros; 0 ms tras pausar/reanudar y tras ocultar la pestaña. Nota S, 49 inputs juzgados.
- Pulido del coordinador: planos a pantalla completa, swing en poses clave, primeros planos de Cascada, contrapicado,
  carga, salto, choques, final heroico; prompts pegados a la bala; barcos con tablones, obenques, cicatrices y astillas.

- Rendimiento (12:30): los «huecos de cuadros» eran del banco de pruebas (dibujaba a ~600 fps sin vsync). Con vsync,
  como en un navegador normal: **60 fps estables** toda la canción (p99 22,5 ms). Se quitaron los tirones reales
  (palabras que se creaban justo en el golpe): ahora se preparan antes de empezar.
- Sincronía medida con la **tira de prueba** (coro, 8 compases): cada bombo y cada acento se ven en el cuadro siguiente
  al sonido (máx 19 ms). Los bombos suaves de un redoble ahora también se notan (las reacciones se suman).
- Doc 29 actualizado: onsets (formato y cómo usarlos), regla de volumen y latencia, canción completa, hoja de la segunda
  mitad, mediciones, «estilos para los próximos Momentos» (§3.1).
- Herramientas de análisis: no se instaló nada (poco disco y requieren pytorch); el pipeline propio con numpy basta.

- Hojas de contacto `-v2` de las 17 secciones y tira de sincronía (en el scratch, nunca en el repo).
- Pruebas: typecheck limpio; `tests/momentos*` 40/40; `verify-missions --all` 162 OK. En la corrida completa fallaron
  por tiempo (5 s) pruebas de otros agentes con la máquina cargada; la del cielo pasa sola en 4,9 s (justo).

## Falta (en orden)

1. Peticiones del dueño 1, 2 y 3: **hechas**. Esperando su opinión al verlo.
2. ~~Los otros cinco Momentos~~ **Hechos (2026-10-10):** WHEN I LOSE, te ODIO, Hemkade, CIRCUS MALUS y YONOSE TODO (doc 29 §14–§18 y sus `MOMENTO-*.md`).

## Cómo retomar

- Vite propio: `cd game && npx vite --config <scratch>/momentos/vite.momentos.config.mjs` (puerto 5281, sin HMR).
  Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/f8d0e043-0e92-467b-a5d4-e9b12fa6c140/scratchpad/momentos/`.
- Rutas DEV: `?momento=liky_fight` · `&auto=great|miss|none` · `&scrub=1` (`window.__momento.render(m)`) · `&mq=low|high`
  · `?momento=lab` (tratamiento cel).
- Fixture del flujo real: `?save=rupturas-h44&scene=island` y luego `import('/src/app/storyFlow.ts').then(m => m.startStoryBattle('cielo_invertidas'))`.
- Herramientas en el scratch: `sheet.mjs <nombre> "auto=great" t0 t1 n cols` (hojas de contacto), `full.mjs` (canción entera
  en tiempo real), `vis.mjs` + `strip.mjs` (tira de sincronía), `h44.mjs perfect|none|miss`
  (flujo real con bot de teclado, sincronía, FPS, memoria), `perf.mjs high|low N`, `pause.mjs`, `internal.mjs`.
  puppeteer-core vive en el scratch (`npm i puppeteer-core@24` si falta). Para medir FPS/sincronía: `VSYNC=1`.
- Hojas de contacto: `<scratch>/momentos/sheets/`.
- Trampas: no usar el puerto 5191; los PNG nunca en el repo; editar archivos compartidos releyéndolos antes; el disco
  anda en ~5 GB libres.

## Última actualización

2026-10-10 13:05
