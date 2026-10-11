# 17 · Plan de la renovación audiovisual + Parte II completa (INTERNO — contiene spoilers)

**Pedido del dueño (2026-10-09, noche).** Llevar la Parte II a «otra generación»:

- apertura renovada: el cielo se oscurece **de verdad** y el estado persiste;
- 6 canciones originales integradas (`~/Desktop/NO ONE LIKE CATS sounds/`), con versiones tranquilas;
- música adaptativa, Fonoteca coleccionable, invitación elegante a activar el sonido;
- cinemáticas con propósito y escenas interactivas;
- reinicio narrativo de la Parte II **sin tocar nada del progreso**;
- terminar las Oleadas 2–4 (H42–H65, guion en `13-guion-parte-ii.md`).

**Regla de comunicación:** al dueño **no se le revelan sorpresas** (giros, identidades, finales). Los docs internos sí las tienen.

**Regla de mundo:** si la historia dice que algo pasa, **pasa en pantalla**: luz, cielo, gatos, sonido.

## Fases

| Fase | Qué | Dueño (agente) | Depende de |
|---|---|---|---|
| 1 | Análisis musical, mapas de beats, codificación para distribución, catálogo (`17-catalogo-musical` → doc 18) | MUSIC | — |
| 1 | Motor de audio: buses, director adaptativo, sincronía, ambientes, stingers, ducking, invitación al sonido, **Fonoteca**, ajustes de volumen | AUDIO | `tracks.json` de MUSIC (puede empezar con su propia copia de prueba) |
| 1 | Estados narrativos del mundo + noche astral en la isla 2D + **cine** (timeline declarativo) + apertura H31 | OPENING | fachada `audio/api.ts` |
| 1 | Reinicio narrativo de la Parte II (migración idempotente, registro de premios cobrados) | MIGRATION | — |
| 1 | Oleada 2: sistemas (Gravedad, Kit de Vuelo, batallas celestes), H42–H49, especies con suplentes + manifest de Codex (lote E) | WAVE2 | — |
| 1 | Oleada 2: regiones 3D Islas Invertidas y Corona Celeste + hoja celeste de la carta | WAVE2-REGIONS | — |
| 2 | Variaciones musicales reales (stems, ambient, aftermath), batalla LIKY FIGHT sincronizada, pulido cinemático de la Oleada 1 con `cine`, Oleada 3 | varios | Fase 1 |
| 3 | Oleada 4, recorrido completo, rendimiento, publicación | varios | Fase 2 |

## Contratos (no romper)

- **Audio:** solo a través de `src/audio/api.ts` (`audioApi.setState/cue/release/ambience/stinger/duck/trackTime/on/unlockSong`). Los ids de pistas están en `src/data/music/tracks.json`. Los archivos originales nunca se tocan; los de distribución viven en `game/public/music/`.
- **Contenido por oleada** (se fusiona solo agregando):
  - datos: `src/data/rupturas/{especies,historia}-o{2,3,4}.json`;
  - hooks: `src/ui/story/rupturasScriptO{2,3,4}.ts` (exports `O{n}_ON_NEW/ON_DONE/COVERED`);
  - sistemas: `src/state/sys/rupturasO{2,3,4}.ts`.
- **Regiones:** los ids ya están registrados en `regions/index.ts` y `RegionScene.LOADERS`: `invertidas`, `corona` (O2), `cometa` (O3), `suenos`, `olvidada`, `umbral` (O4). Cada uno tiene un placeholder en `regions/<id>.ts` que su agente reemplaza.
- **Estados del mundo:** `src/state/sys/worldState.ts` (OPENING). Cada oleada registra los suyos con `registerWorldState(...)`. El estado se **deriva del progreso de misiones** (no de un flag suelto), así sobrevive a recargas y al reinicio narrativo.
- **Cine:** `src/cine/*` (OPENING). Es un timeline declarativo: cámara, actores, mundo, audio, diálogo, interacción, persistencia. Las escenas nuevas lo usan en lugar de lógica a mano.
- **Ids de misión:** H31–H41 (O1, publicada); H42–H49 (O2), H50–H57 (O3), H58–H65 (O4). Nunca se reusan.

## Distribución musical (hipótesis; MUSIC la confirma o la cambia al analizar)

| Canción | Intención probable | Uso hipotético |
|---|---|---|
| LIKY FIGHT (merengueton) | Fiesta y pelea | Batalla especial coreografiada |
| Hemkade (hardstyle épico) | Escala y clímax | Jefe multi-capa |
| CIRCUS MALUS (trap con piano, final raro) | Inquietud y circo | Facción inquietante / región que se rompe |
| WHEN I LOSE (reggaetón pop, voces ancestrales) | Lo antiguo, la derrota con dignidad | Primordiales / después de perder |
| YONOSE TODO (triste pero feliz) | Agridulce | Escenas emocionales, cierre y créditos |
| te ODIO (base trap con emoción) | Rivalidad y despecho | Rival o antagonista con corazón |

Cada canción tiene versión **original** (momento intenso) y, si musicalmente aplica, **ambient/aftermath** (exploración). El arco: un motivo que abre la Parte II y regresa transformado al final.
