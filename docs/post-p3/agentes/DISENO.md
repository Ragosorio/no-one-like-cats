# DISEÑO · estado del agente

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).

## Qué estoy haciendo
Nada: el lote está terminado (2026-10-28). Espera la revisión del dueño y las decisiones del coordinador sobre `03-obtencion.md` §6.

## Hecho
- **60 Multidimensionales** titulares: los 30 que pidió el dueño más 30 del diseño. Además, 16 de reserva, 20 Míticos, 10 Legendarios y 8 Heroicos. Mia Khalifa quedó excluida y Sabrina Carpenter entró en su lugar. Shrek, Gru y un Minion entraron, con combo Grrrú + Miaunion.
- `00-LEEME.md`, `01-roster.md` (una ficha por gato), `02-arte-briefs.md`, `03-obtencion.md` y `04-roster.json`. Todos salen de `fuente/` con `generar.py`.
- `04-roster.json` cumple el contrato de SISTEMA:
  - `obtain.source` empieza con `post:`;
  - `post.source` usa las mesas reales (`casino:gacha[:michi|:holo]`, `casino:slot`, `casino:caja`, `casino:eterno`) y `podio:copa_*`;
  - `weight` es mayor que 0; ningún gato es secreto ni trae bloque `p3`;
  - los MD tienen `usesPerBattle: 1`, el nombre de la ulti es el del poder y `star5` dice «2 veces por batalla».
  - El validador real (`game/src/data/postp3/validate.ts`, corrido con vite-node) da **0 problemas** en los 98 gatos y en los 16 de reserva.
- **Decisiones del dueño (2026-10-28) aplicadas:**
  - `POST_CASINO` aprobado (`03` §3);
  - vitrinas en 7 mesas con reglas exactas (`03` §4 y `postVitrinas`);
  - Copa con retos anclados a tu liga (`03` §5, `postCopa` y `POST_CHAMPIONS` con `order` y `mult`);
  - Merlina → `xp_michiercoles` «Michiércoles», sin mano mascota y con violonchelo. La ficha `xp_miaurlina` salió del manifest (un solo cambio, verificado contra el respaldo `manifest-antes-lote-post-p3-2026-10-28-1658.json`) y su prompt está en `_respaldos/2026-10-28-lote-post-p3-retirados/`.
- **Arte** (en `arte-nuevo/`, solo agregado):
  - 114 entradas `lote-post-p3` en el manifest; el diff es solo de líneas agregadas y los 212 assets viejos quedaron idénticos;
  - respaldo en `_respaldos/manifest-antes-lote-post-p3-2026-10-28.json`;
  - 114 prompts en `prompts/lote-post-p3/`, cuya sección B extrae `gen.sh` sin problema;
  - locks CARICATURA, TIRA y ESTADIO en `lote-post-p3/estilo/`, y `lote-post-p3/COLA.txt`.
  - **No se generó ninguna imagen.**

## Falta (no es de este agente)
1. Que el dueño revise la lista y conteste las preguntas de `00-LEEME.md`.
2. Que el coordinador decida `03` §7: el estandarte `casino:gacha:desborde`, los combos de pareja y las reglas de los sets. SISTEMA implementa las vitrinas y la Copa desde `03` §4–5.
3. Los agentes de datos y sistemas:
   - copiar `cats` a `game/src/data/postp3/especies.json`;
   - pegar `POST_CHAMPIONS` y ajustar `POST_CASINO`;
   - poner los MD en `PENDING` hasta que tengan universo (`fx/sequences/multiverse/`) y poder (`battle/multidim.ts`, `data/multidimPowers.ts`); los textos y números están en `post.power` / `post.universe`.
4. Que el agente de arte corra la cola.

## Cómo retomar
- Cambiar un gato: editar su ficha en `fuente/*.py` → `cd docs/post-p3/fuente && python3 generar.py` (docs + JSON + validación) → `python3 generar.py --arte` (desde 2026-10-29, DISEÑO-2: solo las entradas de la tanda 2; el modo viejo es `--arte-todo` y borraría las `corrections_en` que pusieron los agentes de arte: no usarlo).
- La validación de `generar.py` revisa:
  - ids, nombres y slugs contra las 155 especies y `cats-svg`;
  - las refs `balance:`, los roles, los rasgos y los elementos;
  - el formato de `post.source` y el contrato de poder MD.
- Encargo: solo diseño, sin código del juego, sin commits y sin tocar el puerto 5173.

## Última actualización
2026-10-28
