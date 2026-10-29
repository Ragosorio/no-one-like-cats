# ARTE-POST-B · estado del agente

> Encargo: revisar → plan B → vectorizar → rig → integrar mis 25 Multidimensionales del lote post-P3 (los pinta la cola de ARTE-POST). Sin commits. Nunca el puerto 5173. Nada raster en el repo. Corridas de vectorizado `b1, b2, b3`. Servidor `arte-post-b` (5221).

## Qué estoy haciendo
**Terminado.** Los 25 están integrados (arte completo + lite + rig + pin al sitio 1) y en `especies.json` (postp3-sync: 98/98 del roster en el juego). 0 BLOQUEADO.

## Hecho
| Ola | Gatos | Notas |
|---|---|---|
| 1 (b1) | xp_persafalsa, xp_heisenmiau, xp_miaufalda, xp_hermiaune, xp_lunalovegata, xp_miaunce, xp_michiercoles, xp_miauki, xp_miautentacion, xp_miauknd, xp_miaussi, xp_miaupe, xp_lamiau | Hermiaune quedó en balanced (1,91 MB). Luna Lovegata se quedó en high (4,37 MB): su balanced daba MAE 12,5 |
| 2 (b2) | xp_garritas, xp_supermichi, xp_hierromichi, xp_michimerica, xp_doomiau, xp_michiwan, xp_postmaulone, xp_romiau, xp_partymichi, xp_gatistiano, xp_hannah | Garritas, Supermichi, Michimérica y Doomiau quedaron en balanced. Hierro Michi se quedó en high (4,90 MB): su balanced daba MAE 12,2 |
| 3 (b3) | xp_sabrina | — |

- **Plan B** (1 reintento cada uno, los tres pasaron en v2):
  - **xp_gatistiano:** la v1 tenía la cabeza chiquita sobre un cuerpo humano musculoso. La v2 trae cabeza grande y cuerpo de gato.
  - **xp_hannah:** la v1 tenía mirada entrecerrada y coqueta y el ombligo al aire (personaje adolescente). La v2 trae sonrisa abierta, ojos grandes y la panza cubierta.
  - **xp_sabrina:** la v1 tenía mirada coqueta y un vestido muy corto, contra sus propios significantes («modest, wholesome»). La v2 trae vestido a la rodilla, ojos abiertos y sonrisa dulce.
- `verificar-copias.sh`: ningún crudo mío es copia de otra sesión.
- **MAI colapsó** (MAE > 22) con lanczos3 en miaupe, postmaulone y gatistiano. `vect.sh` los repitió solo con mitchell y quedaron con MAE 4,4–7,9.
- **Títeres** revisados en `?scene=catlive` con los 10 estados (hojas `tit1…tit5.jpg` en `<scratchpad>/post-b/rev/`):
  - sin roturas;
  - sombreros, moños y lentes en la cabeza siguen a la cabeza;
  - los props sostenidos junto a la cara se quedan quietos.
- **Corrección de rig importante:** en `game/src/art/puppetCore.ts`, `pins` significa pintura que **no** sigue a la cabeza (props sostenidos cerca de la cara: escudo, micrófono, pata alzada, bolsita…). Los sombreros, moños y lentes **en** la cabeza van dentro de la elipse de la cabeza, y si hace falta se agranda la elipse. Al principio puse como pin el sombrero de Heisenmiau, el moño de Miaufalda, los lentes de Luna y los de Persa Falsa. Ya lo corregí y lo reintegré.
- `npx vitest run tests/catArtIntegrity.test.ts tests/artBase.test.ts`: 24/24.

- **2026-10-29 · Heisenmiau v2 (corrección de contenido aprobada por el dueño):**
  - **Problema:** la bolsita de cristales azules se leía como droga.
  - **Pintura:** plan B v2 con Luna gpt-5.6-luna en max (1 reintento de 2). Ahora sostiene un **matraz Erlenmeyer con líquido azul burbujeante**, sin bolsita, cristales ni polvo; lo demás no cambia.
  - **En el manifest**, además de la corrección en `corrections_en`, reescribí los campos que describían la bolsita para que el prompt no se contradijera: subject, signifiers, pose, hero prop, must-not-include, reference y los campos `_es` de look.
  - **Vectorizado:** corrida b4, preset high, 3,38 MB, MAE 5,6; lite de 582 KB.
  - **Rig nuevo:** la cabeza [340,172,125,135] cubre el sombrero y el matraz va como pin [165,180,52,105].
  - **Integración:** `integrar.py --only=xp_heisenmiau --force`. Tests de arte 24/24, postp3-sync sin cambios y títere revisado en catlive (5221, ya detenido). UNIVERSOS-G tiene que volver a medir los onCat de su revelación.

## Falta
Nada de mi lista.

## Cómo retomar
- **Estado:** `node lote-post-p3/herramientas/seg.mjs list | grep xp_`.
- **Comandos:** los de `ARTE-POST.md` §«Cómo retomar».
- **Mi arnés:** `<scratchpad>/post-b/pp`. `states.mjs` acepta `PORT=<puerto>` porque el tope de 5 servidores no me dejó levantar el 5221; usé, solo para leer, el 5212 de ARTE-POST y el 5222 de ARTE-POST-C.
- **Mis hojas** de revisión, rejillas y overlays: `<scratchpad>/post-b/rev/`.

## Última actualización
2026-10-29 06:20
