# SISTEMA · estado del agente

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).

## Qué estoy haciendo
Nada: fase 2 terminada y verificada (2026-10-28). El juego ya trae 17 gatos post (los que tienen arte); el resto entra
solo con `node scripts/postp3-sync.mjs` cuando ARTE-POST integra cada ola.

## Hecho
### Fase 1 (plomería)
- **Candado** `postP3Unlocked()` (`game/src/state/sys/postp3.ts`): «Continuará» (`b96_continuara`), o H96 cumplida, o
  H97+ activa/cumplida. H96 activa no basta. Función pura de la partida, sin bandera.
- **Datos**: `game/src/data/postp3/especies.json`, `reglas.ts`, `validate.ts` (revisa cada gato al cargar).
  `isPostCat()` en `state/sys/multidim.ts`; nunca entra a las bolsas genéricas.
- **Catdex**: invisibles antes del candado; después RUMOR si una mesa los nombra, si no carta sellada.
- **Mesas grandes**: Portal / Tragamichis / La Caja / Modo Eterno: una parte de sus legendarios o míticos sale de la
  bolsa del Multiverso (por peso, ×3 si no lo tienes), con garantía. Contadores `casino.pity['post:<mesa>[:<sub>]']`.

### Fase 2 (lo aprobado por el dueño, `03-obtencion.md`)
- **Números** de `POST_CASINO`: Portal 0.5/3, Tragamichis 0.4/4, La Caja 0.6/2, Eterno 0.75/2.
- **Vitrinas** (`state/sys/postVitrina.ts`, `panels/casino/vitrina.ts`): Plinko, Dados, Mayor o Menor, Bingo, Rasca,
  Cajas y Ruleta. Momento Vitrina 0.6 % por apuesta que cuenta (≥ 25 fichas u oro ≥ ¼ del tope; nunca gemas; nunca en
  el ETERNO), tirado aparte al liquidar (`casino/common.ts settle`, `spinRoulette`). Tiro: 60 % consuelo / 14 % / 11 % /
  15 %, nunca repite (cae MD → mítico → legendario), garantías 5 / 15 / chispa 25 (eliges), Sellos de LA CASA TE DEBE
  (5 = un tiro). Contadores `post:vit:<mesa>:c|md|s` y `post:sellos`. En pantalla: insignia VITRINA en cada mesa,
  pestaña VITRINA en su tabla (Momento, tabla del tiro «ahorita», 8 gatos con ✓, contadores, canje de Sellos, chispa),
  «¡SE ABRIÓ LA VITRINA!» con lo dorado de cada mesa, y el auto espera a que termine (`AutoHost.autoSettle`).
- **Copa Fuera de la Caja** (`state/sys/podio.ts` copa*, `podio/lobby.ts`, `scenes/PodioScene.ts`): fila propia en el
  lobby (pestaña ESCALAFÓN · COPA), 8 retos en orden, poder = campeón de tu liga frontera (mín. 8) × 1.10…1.45, pelea
  con su Heroico, lo paga una vez (`postchamp_<id>`, + orbs_champion, champion_gems, XP de primera); luego revancha sin
  el gato. Perder no cuesta. El escalafón no cambia. Un campeón cuyo Heroico no tiene arte se salta.
- **Sincronizar el lote**: `game/scripts/postp3-sync.mjs` copia del roster solo los gatos con SVG completo + lite,
  nunca quita ni reordena lo que ya está, y mete los MD nuevos en los PENDING de universos y poderes.
  `--dry --pretend=slug,…` para probar.

## Verificación (2026-10-28, fase 2 + arreglos)
- `npx tsc --noEmit -p .` limpio · `npx vitest run` 1166 pasan · `verify-missions --all` 194 OK, 0 faltantes.
- Headless (5211, Heroico de prueba solo en la página): insignias y pestañas VITRINA (Plinko, Dados con chispa y Sellos,
  Ruleta), un Momento real en el Plinko, Reglas de la casa, fila de la Copa y un duelo de Copa. Sin errores.
  Capturas: scratchpad `sistema-f2b/`.

## Arreglos visuales (2026-10-28, pedido del coordinador)
- El Momento Vitrina ya no se encima con el premio de la mesa: espera ~1.15 s a que pase la palabra y las monedas de
  la mesa, oscurece el área de juego (el tablero; en la Ruleta, la rueda), pone el sello y lo dorado arriba y la carta
  del tiro debajo, sin tocarse. Revisado en las 7 mesas (capturas `sistema-fix-1080/`, `sistema-fix-roul/`).
- La insignia VITRINA ya no tapa texto: en el Plinko la pista «Toca ¡SUELTA!…» baja a una línea bajo la insignia
  (solo cuando la insignia existe). Prueba automática de traslapes en las 7 mesas, a 1920×1080 y 1280×720: cero
  (`sistema-fix-720/`). Antes/después: `sistema-fix-1080/before-after-plinko.png`.
- Decisiones del coordinador: umbral ¼ del tope, oro normal en la primera victoria de Copa, sets para después.

## Falta / abierto
1. 81 gatos esperan su arte (correr el sync en cada ola).
2. Los sets del Catdex (`04-roster.json → catdexSets`) no están cargados (§6: el dueño decide).
3. §7 sigue fuera: estandarte «Multiverso Desbordado», combos, reglas de sets.

## Cómo retomar
- Sin commits ni push; puerto 5211 (`.claude/launch.json` → `sistema`); nunca el 5173.
- Arte nuevo: `cd game && node scripts/postp3-sync.mjs && npx vitest run`.
- Números: solo en `game/src/data/postp3/reglas.ts` (`POST_CASINO`, `POST_VITRINA`, `POST_CHAMPIONS`, `POST_COPA`).

## Última actualización
2026-10-28
