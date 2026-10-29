# SISTEMA-2 · estado del agente

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo (2026-10-29, palabras del dueño): A) el MODO ETERNO, cuando ya no se puede enfriar, también da boletos y más;
> B) un estandarte MULTIVERSO en el Portal después de la Parte III, con su aviso de broma (una sola vez); C) un
> Multidimensional que sale en una tirada muestra SU rareza, no el dorado del legendario.
> Sin commits ni push. Puerto 5211 (`sistema`); nunca el 5173.

## Qué estoy haciendo
Nada: A, B y C terminados y verificados (2026-10-29). Servidor 5211 detenido; Chrome cerrado.

## Hecho
- **A · Eterno** (`state/sys/casino/eterno.ts`, `panels/casino/eterno.ts`): `ETERNO.drops` (4 % por tirada; jackpot 50 %,
  doble; boleto 35 · gema 25 · pescaditos 30 s 20 · oro 30 s 20). `pot.extra` opcional (sin SAVE_VERSION);
  `luckyDrop`, `addDrop`, `potTotals`, `potHasAny`; `doublePot` duplica todo; ganar suma todo; perder igual que antes.
  Panel: «+3 BOLETOS» al caer, fila de extras en el botín, textos de confirmación y Reglas de la casa.
- **B · MULTIVERSO DESBORDADO** (`state/sys/gacha.ts` MULTIVERSO, `activeBanners()`, `postp3.ts multiversoPool /
  rollMultiverso / multiversoOdds`): solo tras el candado; 1 boleto / 8 gemas; leg. 2.5 % = Multidimensional por peso
  (×3 si no lo tienes), mít. 0.5 % = uno que no tienes; garantías 8/22→36/140/5; sin HOLO, sin riesgo, sin escapes;
  contadores `multiverso:*`. Pestaña y póster propios (`GachaView`), tabla exacta (`postOdds.openMultiversoOdds`).
  Aviso de MADAME NOIR una vez (`state/sys/multiversoAviso.ts`, `panels/casino/multiversoAviso.ts`, bandera
  `multiverso_aviso`), lanzado desde `CasinoScene.maybeAviso`.
- **C · rareza propia** (`casino.ts catShowTier`, `gacha.ts Pull.look`, `prizes.ts`, `mdLook.ts`, `gachaSummon.ts`,
  `postVitrina.ts`): la raíz era `pullOne` (pisaba el tier con el sorteado) y `tierOf` de la vitrina (mítico).

- **Headless (5211)**: Eterno ganar y perder por la mesa real (Tragamichis con fichas; la moneda del 50/50 forzada solo en
  la prueba): caen «+1 BOLETO»…, el botín muestra fichas + boletos/gemas/pescaditos/oro, todo ×16, ganar suma todo,
  perder deja todo en 0. Estandarte: no existe antes del final (h93-final), sí después; aviso de MADAME NOIR una vez
  (4 globos, «¡A VER ESAS CAJAS!» abre el estandarte; la segunda visita ya no lo muestra). Tiradas: MULTIVERSO ×1 y ×10
  y PORTAL MICHI ×10 con Doctor Doomiau del Multiverso: máquina, carta y resumen en color Multidimensional. La Caja y
  la Vitrina dan `tier: 'multidimensional'`. Arnés: scratchpad `sistema2/h/` (eterno.mjs, banner.mjs, pulls.mjs, cards.mjs).

- **Pruebas**: `npx tsc --noEmit -p .` limpio. `tests/casinoMultiverso.test.ts` 21/21; casinoEterno, casinoGacha,
  casinoGames, postp3, saveSafety, rarityFinite: todo pasa. Suite completa (con la máquina a carga 200–440): 1448 pasan;
  las 44 que fallan son tiempos agotados por la carga (se repitieron sueltas y pasan) o `multidimPost` «expected 85 to be
  60», que es la segunda tanda de 25 Multidimensionales de otro agente (sin poder todavía), no de esto.

- **Giros del Portal (pedido del coordinador, 2026-10-29)**: `fx/sequences/gachaSummon.ts` guarda los 3 giros sin fin
  (dashes 6 s, runas 9 s, anillo 14 s; y las estrellas del mítico) y los mata en un solo `teardown` para toda salida:
  CONTINUAR, el cierre del auto, SALTAR a media revelación y la capa destruida a media invocación (salir del casino).
  Medido headless (`h/leak.mjs`, con `pesado.sh`): giros del Portal 3 durante la invocación y 0 después en ×1, ×10,
  ×1+SALTAR, ×10+SALTAR y al salir a media invocación; 0 tweens sin fin sobre objetos destruidos. Datos: `datos/leak.json`.

## Falta
- La entrada de NOVEDADES (`data/updates.ts`) no la puse: es del coordinador al publicar (sin spoilers: el estandarte y
  el aviso solo existen tras el final).
- Abierto para el dueño: el estandarte trae a los 60 Multidimensionales (todas las mesas); si prefiere solo los del
  Portal, es un filtro en `postp3.ts multiversoPool`.

## Cómo retomar
- Brief: scratchpad `briefs/sistema2.md`. Pruebas: `cd game && npx vitest run tests/casinoMultiverso.test.ts`.
- Headless (siempre con `briefs/pesado.sh`): `preview_start sistema` (5211); `cd <scratchpad>/sistema2/h && node
  eterno.mjs ../out win|loss`, `node banner.mjs ../out`, `node pulls.mjs ../out`, `node cards.mjs ../out`,
  `node tabshot.mjs ../x.jpg` (node_modules → `qa-post/h`). Capturas para el dueño: `sistema2/para-el-dueno/`.
- Pendiente menor: la captura 10 es de antes de un ajuste de 1 línea (el nombre de la pestaña ya no toca la gema);
  no la repetí porque el disco bajó de 6 GB (regla del coordinador). `node tabshot.mjs` la rehace.
- Números: `ETERNO.drops` (eterno.ts) y `MULTIVERSO` (gacha.ts). Textos del aviso: `state/sys/multiversoAviso.ts`.

## Última actualización
2026-10-29
