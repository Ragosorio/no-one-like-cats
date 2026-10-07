# Contexto narrativo: cada sistema se explica solo

Feedback de jugadores: *"Al inicio cuesta porque te piden misiones sin saber qué está pasando. Si aparece
la siembra automática, explica POR QUÉ aparece. No son solo cajitas y dopamina: es contexto. Haces ESTO
para ESTO. Una misión dice 'Sube a Estrella 2', pero ¿qué es Estrella 2?"*

Este documento es la auditoría de cada sistema en el orden en que el jugador lo encuentra: cuándo aparece,
si el juego decía **QUÉ es + PARA QUÉ sirve + CÓMO se usa**, qué faltaba y qué se agregó.

## Cómo funciona (para quien agregue sistemas nuevos)

| Pieza | Archivo | Qué hace |
|---|---|---|
| Glosario (datos) | `game/src/data/glossary.ts` | Una entrada por término: QUÉ ES / PARA QUÉ SIRVE / CÓMO SE USA / DÓNDE. `gate` la muestra como "???" hasta que el jugador llega (sin spoilers). `missionTerms(m)` dice qué términos usa cada misión. |
| Glosario (panel) | `game/src/ui/story/glossary.ts` | `openGlossary(id?)`, `openMissionHelp(mission)` y el botón `whatIsThisButton()` ("¿QUÉ ES ESTO?" / "?"). |
| Presentaciones | `game/src/ui/story/features.ts` | Un beat corto de Luzterna (2–4 líneas) por sistema: razón en el mundo + "haz esto para esto". |
| Orquestación | `game/src/app/story.ts` | Las reproduce con la cola de beats existente: nunca en batalla, nunca encima de otro diálogo, separadas ≥ 20 s. |
| Estado | `G.s.explained: string[]` | Ids ya explicados (campo con default; `normalize()` lo agrega a partidas viejas, sin migración). |
| Misiones | `content.json › missions[].why` | "Para qué" de cada misión: se ve debajo del objetivo, en el aviso de misión nueva y en el glosario. |

**Tres disparadores por sistema:**

1. **Aparece** (`appear`): el sistema se acaba de abrir durante el juego (misión nueva, nivel de Reino, botón
   nuevo). El beat espera a que la isla/mapa esté en calma, sin panel abierto y sin otro beat.
2. **Se usa** (`panel` / `scene`): el jugador abre su panel (por el título del `Modal`) o entra a la escena.
   El beat sale enseguida, encima del panel. **Así reciben la explicación las partidas viejas.**
3. **Tip** (`tip: true`): los sistemas chicos usan la burbuja de la esquina, que no bloquea.

**Partidas viejas:** al cargar, todo lo que ya estaba disponible y nunca se explicó queda como "solo al usar"
durante esa sesión. Nada se descarga al cargar. El glosario está disponible para todos desde MISIONES › GLOSARIO,
desde el "?" de cada misión fijada y desde REINO › ¿QUÉ ES ESTO?.

**Agregar un sistema nuevo:** entrada en `GLOSSARY` + entrada en `FEATURES` con el mismo `id` (y `panel` con el
título de su Modal en mayúsculas). Si una misión lo pide, agrégale `why` y, si hace falta, su término en
`BY_GOAL`/`EXTRA` de `glossary.ts`.

## Auditoría (orden de aparición)

| # | Sistema | Cuándo aparece | Qué faltaba | Qué se agregó |
|---|---|---|---|---|
| 1 | Prólogo / Luzterna / Canelo | Inicio (b00–b02) | Nada: ya explicaba quién es quién | — (las misiones H01/H02 tienen `why`) |
| 2 | Doblones (oro) | Primer oro recogido (b03, K01) | Decía qué es, no **para qué** | `why` en K01 ("pagan casas, comida, barco y terreno") + glosario `doblones` |
| 3 | Hábitats / gato sin casa | K03 (Brote sin casa) | Solo la línea de la misión; nadie decía que la casa es por elemento ni qué da mejorarla | Beat `habitat` (aparece con K03; en partidas viejas al abrir CONSTRUIR / HÁBITAT DE… / SIN CASA) + glosario `habitat`, `constructores` |
| 4 | Muelle de Pesca / Pescaditos | H03 (b04) | b04 decía "siembra sardinas" pero no para qué sirve la comida | Línea nueva en b04: "¿Para qué tanto pescado? Para ALIMENTARLOS…"; beat `muelle` al abrir el Muelle si b04 no se vio; glosario `muelle`, `pescaditos` |
| 5 | Nivel / ¡ÑAM! / tope de nivel | H04 (b05) | El tope (Reino + 5) no se explicaba en historia | `why` en H04/K04 + glosario `nivel` (tope, umbrales Nv10/20) |
| 6 | Batalla / apuntar | H05 (b06) | Bien explicado | — (glosario `batalla`, `modulos`, `hundir`) |
| 7 | Carta náutica (mapa) | Primera vez en el mapa | Nadie explicaba zonas, élite, jefe ni la ESTIMACIÓN | Beat `mapa` (primer uso del mapa, para todos) + glosario `mapa`, `jefes` |
| 8 | Reino (nivel de cuenta) | H07 "Llega a Reino 3" | **La misión pedía Reino 3 sin decir qué es el Reino** | Beat `reino` (aparece con H07; en viejas al abrir REINO) + `why` + botón ¿QUÉ ES ESTO? en el panel REINO + glosario `reino`, `automaticos` |
| 9 | Chatarra / cristales | Primera victoria | Caían en el botín sin explicación | Tip `cristales` + glosario `cristales` |
| 10 | Racha (Momentum) | Primera racha | Sin explicación (solo una llamita) | Tip `momentum` + glosario |
| 11 | Ronroneo / relojes verdes y rojos | Primera victoria | Solo "cada victoria baja el reloj verde" (b07) | Beat `ronroneo` (isla) + glosario `ronroneo`, `relojes` |
| 12 | Orbes de Alma | K12 (primer orbe) | La misión pedía 10 orbes sin decir qué son ni para qué | Beat `orbes` + `why` K12 + glosario `orbes` |
| 13 | Altar de Almas / Estrellas ★2–★6 | K12 hecha (flag `altar_almas`) | **"Sube a ★2" sin definir estrella; no había ningún beat del Altar** | Beat `estrellas` (aparece al abrir el Altar; en viejas al abrir ALTAR DE ALMAS), objetivo de K13/K25 reescrito ("cuesta Orbes de su especie y pide Nv10"), glosario `estrellas`, `prisma` |
| 14 | Astillero / Mk / Poder | C02 (Armas Mk II) | "Mk II" nunca se definía | Beat `astillero` (aparece con C02; en viejas al abrir ASTILLERO) + `why` C02/C03/C10 + glosario `astillero`, `mk`, `poder`, `barcos`, `tripulacion` |
| 15 | Resonancia (Santuario) | H06 (b07) | Bien explicado en b07 | `why` H06 + glosario `resonancia`, `rareza`. El Santuario ahora tiene `label` para que la historia lo reconozca |
| 16 | Catdex | K07 hecha | Sin beat: no decía que cada especie da oro global | Beat `catdex` (+ versión para partidas viejas) + glosario `catdex`, `sets`, `secretos` |
| 17 | Recolectar todo | Reino 3 (E01) | La línea de E01 solo salía si la misión estaba fijada | Tip `recolectar_todo` (explica que es premio por haberlo hecho a mano) |
| 18 | Expansiones / secretos | Reino 3 (E02) | No decía qué abre cada terreno ni que hay secretos | Beat `expansiones` (aparece con E02; en viejas al abrir cualquier expansión) + glosario |
| 19 | Microeventos (reloj rojo) | Primer microevento (E04) | Sin explicación del reloj rojo | Tip `microeventos` + glosario `relojes` |
| 20 | Gorrión / flota | Reino 5 (C05) | Sin contexto de por qué otro barco | Tip `barcos` + glosario |
| 21 | Ultimate | Primer medidor lleno (C11) | La misión decía "(F)", **tecla que no existe** | Beat `ultimate`; objetivo corregido a "botón ULT en su carta" |
| 22 | Editor de plano | C12 | Solo la misión | Beat `editor` + glosario `editor`, `modulos` |
| 23 | Reparación | Primera reparación | Solo el cartel | Beat `reparacion` al abrir "Barco en reparación" |
| 24 | Asalto Rápido | Flag `can_quick_assault` (C14) | Solo la misión | Tip `asalto_rapido` + glosario |
| 25 | Encargos | Etapa 2-3 (C15) | Sin explicación de qué son | Beat `encargos` (mapa; en viejas al abrir el TABLERO) + glosario |
| 26 | Tienda / gemas / decoración | Tras la primera batalla | Sin explicación | Beat `tienda` al primer uso + glosario `tienda`, `gemas` |
| 27 | Repetir receta (siembra automática) | Reino 9 (K10) | **Aparecía sin decir por qué** (el ejemplo exacto del feedback) | Beat `repetir_receta`: "Ya sembraste a mano suficientes sardinas… por eso aparece" + `why` K10 |
| 28 | Sets del Catdex / Prisma | K15 / primer Prisma | Sin explicación del premio | Tips `sets`, `prisma` + glosario |
| 29 | Banco del Reino | Reino 15 | Solo el toast de apertura | Beat `banco` + glosario |
| 30 | Puerto / expediciones | Expansión 4 limpia | Solo el texto del panel | Beat `expediciones` + `why` E13/E14 + glosario |
| 31 | Escudos | Jefe 3 | b15 lo nombraba ("NUEVA MECÁNICA") sin decir qué hace | Tip `escudos` + glosario |
| 32 | Mutaciones / rasgos / herencia | Reino 20 / 30 | Sin explicación | Tip `mutaciones` + `why` K22/K28 + glosario `mutaciones`, `rasgos` |
| 33 | Mar de Pescados Automático (Silo) | Reino 21 | Sin explicación | Tip `silo` + glosario |
| 34 | Oficios | Reino 24 | Solo el texto del panel | Beat `oficios` + glosario |
| 35 | Batallas de historia / Fragmentos del Vacío | Jefe 2+ | Bien cubiertas por los beats de historia | `why` en H11–H22 + glosario `eventos`, `vacio` |
| 36 | Reacciones elementales | E12 | Solo la misión | Objetivo con ejemplo real (Vapor) + glosario `reacciones`, `elementos` |
| 37 | Casino | Jefe 1 | Lo cubre el equipo del casino | Solo una entrada neutra de glosario (`mesa`) |

## Misiones

Las 108 misiones tienen ahora `why` ("para qué"). Se muestra:

- debajo del objetivo en **MISIONES** ("Para qué: …"),
- en el aviso de **NUEVA MISIÓN** de Luzterna (chiste + para qué),
- en el **glosario** de la misión ("¿QUÉ ES ESTO?" en cada tarjeta, "?" en las misiones fijadas).

Se reescribieron los objetivos que usaban jerga sin definir (★2, Mk, Reino, orbes, encargos, santabárbara,
bombeado, hundir…) y se corrigieron textos que prometían cosas que no existen:

| Misión | Antes | Ahora |
|---|---|---|
| C11 | "usa su ultimate (F)" | "(botón ULT en su carta)" — no hay tecla F |
| H11 | línea "25 minutos REALES. No se pausan." | la batalla no tiene reloj: "Pararrayos con patas. Tumba el mástil primero." |
| K32 | "su ataque puede volverse mítico" | se quitó (el disparo mítico de Nv40 no está programado) |
| E20 | "una mina de Orbes Prisma" | se quitó (la mina no está programada) |

## Cosas que el contenido promete y el código no hace (para el equipo)

Encontradas durante la auditoría; no se explican en el glosario como si funcionaran:

- **Misiones que nunca se pueden completar:** C27 Simulacro (no implementado), E08 Evento Flash (nada los
  dispara), H12 Bandera Negra (nada pone `event_presage:bandera_negra`), H16 Orquesta Muda (el secreto 6 dice
  "Próximamente").
- **Automatizaciones solo de texto:** Comprar ×10/MAX (Reino 10), Auto-alimentar (28), Auto-estrellas (36),
  Simulacro (40), Órdenes de flota (42).
- **Reglas de set del Catdex**: se marca el flag pero ningún combate lo lee (el Prisma y el Ronroneo sí se dan).
- Umbrales de nivel por elemento: solo Nv10 (todos) y Nv20 (Tierra) se aplican en batalla.
- La mayoría de rasgos y mutaciones son solo texto (funcionan Perezoso, Impaciente, Dormilón, Gigantismo,
  Chamuscado, Fosilizado).
- Motor del barco ("maniobra A/D"), +40% chatarra del Merodeador y el bonus de "Expuesto" no están programados.
- La mesa del gato en la isla dice "Próximamente"; el casino real abre desde el botón CASINO.
