# DISEÑO-2 · estado del agente (tanda 2: 25 Multidimensionales más)

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo (2026-10-29): el dueño pidió «haz otros 25 multidimensionales con más referencias de otras cosas más diferentes».
> Brief: scratchpad `briefs/diseno2.md`. Solo diseño: sin código del juego, sin commits, sin publicar y sin tocar el puerto 5173.

## Qué estoy haciendo
Nada: la tanda 2 está diseñada (2026-10-29). Esperan el arte (Luna), PODERES-3, los universos, QA y el OK del dueño.

## Hecho
- **Fuente:**
  - `fuente/md_tanda2.py` trae las 25 fichas completas: 19 nuevas y 6 promovidas de la reserva, con los mismos ids (xp_bastet, xp_tanjimiau, xp_tetrimiau, xp_pinkmiau, xp_garjona, xp_shakimiau).
  - `reservas.py` quedó con 10.
- **Generador (`generar.py`, `base.py`, `textos.py`):**
  - `origin` propio por ficha (leyendas, mitos, historia, ciencia, clasica, telenovela).
  - Venues nuevos `gacha_michi`, `gacha_holo` y `caja`, para mesas grandes sin vitrina. Su `post.vitrina` es el nombre de su mesa grande.
  - `post.tanda = 2`.
  - La validación ya no confunde a los 98 que están en el juego con choques, y revisa las reglas del encargo para la tanda 2: ulti sin STARFALL|METEOR|DECREE, línea de Catdex de 60 caracteres o menos, 3–5 rasgos y signifiers, universo, plan B.
  - Frase de STYLE CONSISTENCY por gato en Mitos y Pinceles.
  - Sets nuevos (leyendas, pirámides, historia, museo, videoclub) y altas en 5 sets que ya existían.
- **`--arte` ahora es parcial:** reemplaza o agrega solo las entradas de la tanda 2 y conserva las correcciones a mano del manifest. `--arte-todo` es el comportamiento viejo, que sí las borraría.
- **Arte (fuera del repo):**
  - Respaldo del manifest: `_respaldos/manifest-antes-tanda2-2026-10-29-073728.json`.
  - 25 entradas y prompts en el manifest; las otras 320 quedaron idénticas.
  - Cola en `lote-post-p3/COLA-tanda2.txt`.
  - `seg.mjs add` (respaldo `seg.mjs.antes-add`): los 25 quedaron como titular/PENDIENTE y los otros 109 registros están intactos.
  - Ya se le avisó a `main`.
- **Docs:** `01`, `02`, `03` (tablas) y `04-roster.json`, con 123 gatos (85 MD) y 10 de reserva. De los 98 en vivo solo cambia `xp_gatoneta`, que entra al set nuevo «Clase de Historia» (`post.sets`).

- **Validador real del juego** (`validate.ts` con vite-node, sobre lo que copia `postp3-sync.mjs`): 0 problemas en los 123 gatos y en las 10 reservas. Ulti, universos, remates y nombres: ninguno se repite.
- `05-tanda-2.md` (resumen, categorías, obtención, código que haría falta, riesgos) y la nota en `00-LEEME.md`. La instrucción vieja de `--arte` se corrigió en `00-LEEME.md` y `DISENO.md`.

## Falta (no es de este agente)
- Arte de los 25 (`COLA-tanda2.txt`).
- Poderes (PODERES-3): ganchos nuevos en `05` §4.
- 25 universos con su carta.
- Sync, QA y el OK del dueño para publicar.
- Decisión del dueño: ¿la tanda 2 en las vitrinas? Hoy no entra; pediría código, ver `05` §4.4.

## Cómo retomar
- Cambiar un gato: editar `fuente/md_tanda2.py` → `cd docs/post-p3/fuente && python3 generar.py`.
- Arte de la tanda 2: `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/lote-post-p3/herramientas/lock.sh python3 generar.py --arte`. Solo toca las 25 entradas, hace respaldo y recompila sus prompts.
- **Nunca `--arte-todo`**: reescribe las 114 entradas del lote y borra las `corrections_en` que pusieron los agentes de arte.

## Última actualización
2026-10-29 07:50
