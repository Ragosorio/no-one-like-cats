# 04 · Plan de las misiones H70–H97 (mecánicas)

> Agente **MECÁNICAS-IMPL**, ronda 4, oleada 2 (2026-10-26). Es un plan. **No se agregó ninguna misión a los datos.**
> ⚠️ Contiene spoilers de la Parte III.
> Base: el mapa de NARRATIVA (`../historia-v2/02-mapa.md`, H66–H97) y el loop (`02-loop.md`).

## 0. Por qué no hay andamio de datos todavía

- **Una misión en los datos se activa sola.** `checkMissions` activa toda misión cuyo disparador se cumple, y la cadena de la Parte III es `mission:H<n−1>`. Una H70 de relleno aparecería en el panel, en la Bitácora y en la tarjeta de 5 campos de cualquier partida que ya terminó H69.
- **La forma de dejarla dormida existe**: `MISSION_GATES` en `game/src/state/sys/missionGoals.ts` con un flag que nadie pone.
  - Pero entonces los títulos, metas y tarjetas serían inventados. Esos textos son de NARRATIVA y viven en `data/gateras/historia.json`, un archivo de A/NARRATIVA.
  - Escribir 28 misiones falsas solo para borrarlas después no aporta nada al jugador y sí agrega riesgo.
- **El guardián ya está.** `game/tests/p3MissionPlan.test.ts` falla si una misión H66+ entra a los datos incompleta y activable: le falta tarjeta, meta con evaluador o disparador, o trae texto de relleno (`BORRADOR`, `[TODO]`, `TBD`).
  - Si NARRATIVA necesita subir una misión antes de su contenido, la pone en `MISSION_GATES`.
  - El mismo archivo comprueba otras dos cosas: que el `win_battle` de una misión nombre una batalla que existe y se puede jugar, y que la puerta de historia de cada caja nombre una misión que existe.
- **Numeración:** H66–H97 cabe; H98–H99 quedan de reserva y H100+ ya funciona (`missionIds.test.ts`).
- **Regla de diseño que se mantiene:** una misión = un capítulo. Las presentaciones van en las batallas, nunca como misiones nuevas.

## 1. Qué pide cada misión a las mecánicas (Acto I: la Borracha)

| Misión (NARRATIVA) | Meta mecánica | Qué ya existe | Qué falta |
|---|---|---|---|
| H69 «La mañana que no llegó» | `win_battle p3d_borracha_5` | ✅ en los datos | — |
| H70 «Borrón» | actividad «compartir donas» (sin pelea) | el nodo de actividad (`dims[].nodes`, `kind: 'actividad'`) | la actividad en sí; meta `use_feature p3_borron` |
| H71 «NINGUNA CAJA ES HOGAR» | `win_battle p3d_borracha_ebrecha` (encuentro en La Última Ronda) | encuentros en el esquema (`kind: 'encuentro'`, id `e…`, batalla `p3d_borracha_e<id>`) | la regla «sillas voladoras» (escombro que se mueve con el Mareo); los datos del encuentro |
| H72 «La bufanda» | La Ronda (una vuelta completa) | ✅ **La Ronda se juega**; su primera vuelta pone `ronda_borracha_1` | meta `use_feature` o un flag de la Ronda; NARRATIVA decide si la bufanda es la recompensa |
| H73 «La Batalla de Gatos» | `win_battle p3d_borracha_eemiau` (encuentro) | encuentros; fases + `endsBattle` (la canción cierra) | la regla «Rima» (castigo por repetir elemento; ~40 líneas, determinista); EMIAU en arte |
| H74 «El Cadenero» | `win_battle p3d_borracha_9` | ✅ B-9 jugable, con fase 2 «¡CIERRA LA PUERTA!» | si NARRATIVA confirma «Lista VIP» (un gato tuyo no dispara cada turno), reemplaza o se suma a la fase |
| — | Desvío «Trastienda» (opcional) | ✅ d1–d3 jugables al terminar la primera Ronda | la pintura de Don Bombín (el rescate se anuncia, no se entrega) |

**Al escribir H74:** la puerta de Superhéroes (`regiones.json › dims[p3d_superheroes].story`) pasa de `flag:won_p3d_borracha_9` a `mission:H74`. La prueba `p3MissionPlan` exige que esa misión exista.

## 2. Actos II–IV (lo que cada caja necesita antes de su misión)

| Acto | Misiones | Batallas que nombrarán | Mecánica nueva | Puerta de la caja |
|---|---|---|---|---|
| II Superhéroes | H75–H78 | `p3d_superheroes_5` (élite), `p3d_superheroes_eestambre` (encuentro con grado de daño), `p3d_superheroes_9` (Cruceta) | **Onomatopeya** (`03` etapa 3); el grado «daño» ya existe en `storyBattles` | `mission:H74` |
| II Anime | H79–H82 | `p3d_anime_5`, `p3d_anime_9` (Itō, «Duelo limpio») | **Poder** + forma `bracket` (el esquema ya la soporta y está probado) | `mission:H77` (o la que NARRATIVA fije) |
| III Libros | H83–H88 | `p3d_libros_5`, la batalla especial «sobrevivir 4 turnos» (`retreat` del lado enemigo ya existe), `p3d_libros_9` (Esquirla) | **Capítulos** (fases por turno, sin código nuevo) + forma `shelf` | `mission:H82` |
| IV POP | H89–H92 | `p3d_pop_5`, `p3d_pop_9` (Firma; la canción cierra) | **Ritmo** + forma `tour` | `mission:H88` |
| Final | H93–H97 | el asedio en casa (no es de la Carta) | Oscuridad (la regla Noche reusada) | — |

## 3. Cómo se suben sin riesgo (para NARRATIVA y quien las implemente)

1. La misión entra a `data/gateras/historia.json` **completa**: tarjeta de 5 campos, meta, disparador `mission:H<n−1>` y beats `b<n>_…`.
2. Si su batalla todavía no existe, la misión va **dormida** en `MISSION_GATES` con un flag (`p3_contenido_H<n>`). La pone quien entrega la batalla.
3. `npx vitest run tests/p3MissionPlan.test.ts tests/missionIds.test.ts` y `npx tsx scripts/verify-missions.ts --all` en verde.
4. Las batallas de historia de la Carta son nodos con datos (`stages` o `dims[].nodes`). La presentación (`app/stageIntro.ts`) y la estimación salen solas; la película se busca por `stages[].film` o por el id de batalla.
