# ARTE-POST-C · estado del agente

> Encargo (brief `arte.md`): revisar → plan B → vectorizar → riggear → integrar los 38 gatos originales del lote post-P3:
> 8 heroicos (hp_), 10 legendarios (lp_) y 20 míticos (mp_). Orden: heroicos, legendarios, míticos.
> Corridas de vectorizado `c1`, `c2`. Servidor `arte-post-c` (5222), ya detenido. Sin commits ni push.

## Qué estoy haciendo
**Terminado.** Los 38 están integrados en el juego como arte y sincronizados en `especies.json` con postp3-sync.

## Hecho
- **Olas** (después de cada una: postp3-sync y aviso a `main`):
  1. 7 heroicos: vencidas, kidcapa, shinai, pergamino, retiaria, mascaradeoro y combo.
  2. 8 legendarios: pozomayor, bolita, catarata, ojoserpiente, asmanga, cantadora, monodorado y desborde.
  3. hp_bgirl (v2), lp_sinfrenos y lp_unadeoro. Con esta ola ya están los 8 heroicos y los 10 legendarios.
  4. Los 20 míticos.
- **Plan B (2):**
  - `hp_vencidas` v2 (2026-10-29, pedido del dueño): el tarro espumoso de la v1 parecía cerveza. Ahora lleva una malteada alta de fresa con popote a rayas, crema batida y cereza.
    - Corrida c3, balanced 2,88 MB, MAE 9,05; rig remedido (la malteada y el puño van como pin).
    - Integrado con `integrar.py --only=hp_vencidas --force` y revisado en catlive.
    - El nombre del tiro «Tarrazo» sigue aludiendo al tarro. Se lo avisé al coordinador; `especies.json` no se tocó.
  - `hp_bgirl`. La v1 tenía **tres orejas**: dos en el casco y una al lado de la cabeza.
  - Se agregó la corrección en `corrections_en`, se compiló y se corrió `gen.sh hp_bgirl 2`.
  - La v2 sale bien: dos orejas, un freeze de verdad y el cinturón.
  - La v1 nunca entró al juego, porque no le puse rig hasta tener la v2 vectorizada.
- **Revisados y APROBADOS por mí:** mp_trebol, mp_trompo, mp_vigilia y mp_vineta. Los otros 33 los había aprobado ARTE-POST. `verificar-copias.sh` sale limpio, salvo la v1 de brasanaranja, que ya se conocía.
- **Vectorizado:**
  - c1: bgirl v2 en high, y bgirl, sinfrenos y unadeoro en balanced.
  - c2: los 4 míticos nuevos en high, y los 20 míticos en balanced. trebol colapsó con lanczos3 (MAE 128) y se rehízo con mitchell (MAE 8,0).
  - Los 8 heroicos, 8 legendarios y 16 míticos en high venían de las corridas p5, p6 y p7 de ARTE-POST.
- **Preset (regla de la P3)** — se quedan en high porque su balanced pasa de MAE 11:
  | Gato | Rareza | High |
  |---|---|---|
  | bgirl v1 | heroico | ya no aplica: la v2 va en balanced |
  | pozomayor | legendario | 7,75 MB |
  | desborde | legendario | 7,32 MB |
  | sinfrenos | legendario | 7,54 MB |
  | vineta | mítico | 6,23 MB |
  | gotera | mítico | 5,58 MB |

  Todos los demás van en balanced, de 1,8 a 3,5 MB.
- **Rigs:**
  - Medidos con cuadrícula y zoom; script propio en `<scratchpad>/post-c/tools/zoom.mjs`. Verificados con overlay y como títeres en `?scene=catlive` en los 10 estados.
  - Hojas en `arte-nuevo/lote-post-p3/revision/post-c/`: `titeres-h1`, `titeres-l1`, `titeres-m1..m3`, y `ov-*` para los overlays.
  - Párpado elíptico en kidcapa, mascaradeoro (antifaz/máscara), cantadora (lentes) y sinfrenos (goggles).
  - Pines y flotantes: ver `rig-notes.json`.
- **Tests:** `catArtIntegrity`, `artBase` y `postp3` pasan, 64/64. No corrí la suite completa.

## Falta
- Nada de mi lista.
- Notas para el dueño o el coordinador:
  - **hp_vencidas:** resuelto con la v2 (malteada). En `manifest.json` siguen hablando del tarro `subject_en`, `look_es` e `identifying_features_es`.
  - **Pesos:** los 5 completos en high (5,6–7,8 MB) son los más pesados del lote.

## Cómo retomar
- Ver `ARTE-POST.md` §«Cómo retomar».
- Mis rigs borrador están en `<scratchpad>/post-c/rigs-{h,l,m}.json`. Ya están todos en `herramientas/rigs.json`.

## Última actualización
2026-10-29 06:20
