# 12 · Hosting del arte para la Parte III (`nolc-arte-2`)

**Estado (2026-10-13):**
- Capacidad del repo actual **medida**.
- Código de shards fijados **implementado y probado en local, sin publicar**.
- `Ragosorio/nolc-arte-2` **creado y configurado, sin publicar**: todavía no hay arte de la Parte III en el juego publicado.

## 1. ¿Alcanza el repo actual?

| Dato (medido hoy) | Valor | Fuente |
|---|---|---|
| Arte completo servido por `nolc-arte` | **122 archivos, 881,3 MB** | `https://ragosorio.github.io/nolc-arte/art-manifest.json` |
| Tope de publicación | 950 MB (`NOLC_ART_LIMIT_MB`); GitHub Pages admite 1 GB por sitio | `game/scripts/art-publish.ts` |
| Espacio libre | **~68 MB**, es decir, unos 9 gatos de 7,2 MB o ~15 en estilo plano (estimado, 3–5 MB) | — |
| Alcance de la Parte III | Lote S: 2 pinturas. Catálogo inicial: 18. Catálogo ampliado: ~30 (`06`) | `06` §2 |

**Conclusión:**
- La porción vertical (2 gatos) **cabe hoy** en `nolc-arte`.
- **El alcance de la Parte III no cabe.** Por eso se abrió `nolc-arte-2`, con la autorización del dueño del 2026-10-13.

## 2. Qué se cambió en el código del juego (local, sin commit)

**El problema:** el reparto viejo, `fnv1a(slug) % n`, movía **la mitad** del arte publicado al pasar de 1 a 2 sitios. Cambiaban sus URL y cada jugador volvía a bajarlo.

**La solución:** *shards fijados*.

| Archivo | Cambio |
|---|---|
| `game/src/art/artShardPins.ts` (nuevo) | Las 123 claves que existen hoy (122 gatos + Luzterna) quedan fijadas al sitio 0 para siempre |
| `game/src/art/artPaths.ts` | `shardFor(key, n)`: con 1 sitio, siempre 0 (igual que hoy). Una clave fijada va a su sitio. **Cualquier clave nueva va al sitio más nuevo** (n−1). `resolveArtUrl` y `filesForArtSite` lo usan. `shardOf` queda solo como referencia |
| `game/scripts/art-publish.ts` | `check` usa `shardFor` |
| `game/tests/artBase.test.ts` | Probado: con 2 sitios, los 122 gatos conservan **exactamente** su URL actual; un gato nuevo va al sitio 2; con 1 sitio no cambia nada |

**Verificación local** (`node scripts/art-publish.ts build … --count 2`):
- el sitio 0 publica los mismos **122 archivos, 881,3 MB**;
- el sitio 1 publica **0** por ahora.

## 3. `Ragosorio/nolc-arte-2` (creado hoy)

- **Repo público**, con el mismo sistema que el primero: el workflow `publish.yml` toma el arte del repo del juego. El arte no se guarda en el repo de arte.
- **Variables:** `NOLC_ART_TIERS=full`, `NOLC_ART_SHARD=1`, `NOLC_ART_COUNT=2`.
- **Pages** en modo workflow: `https://ragosorio.github.io/nolc-arte-2/` (mismo origen que el juego).
- **El cron está apagado a propósito.** Si corriera ahora, el `main` del juego todavía tiene la regla vieja y copiaría la mitad de los gatos aquí. No rompería nada, pero sería basura.
- **`nolc-arte` y las variables del repo del juego NO se tocaron.**

## 4. Orden de activación (cuando el dueño dé el OK para publicar la actualización del juego)

0. **Antes del push** (agregado por el coordinador el 2026-10-27): en el `publish.yml` de `nolc-arte` y de `nolc-arte-2`, sumar `game/src/art/artShardPins.ts` a la lista `sparse-checkout`.
   - El workflow baja solo algunos archivos del juego, y `artPaths.ts` ahora importa `artShardPins.ts`. Sin esa línea, `art-publish.ts` falla con `ERR_MODULE_NOT_FOUND` y ningún sitio publica.
   - Se reprodujo simulando la descarga parcial. La plantilla `ops/nolc-arte/publish.yml` ya lo tiene.
   - Una ruta que todavía no existe en `main` no rompe la descarga parcial, así que este paso puede ir primero.
1. Push del juego a `main`, con `artShardPins.ts` y los SVG nuevos de la Parte III.
   - El deploy del juego hace `art-publish check` contra el sitio único actual.
   - Los SVG completos nuevos todavía no están publicados: el check solo **avisa**, y los gatos nuevos se ven en lite mientras tanto.
   - Nada se rompe.
2. En `nolc-arte`: variables `NOLC_ART_SHARD=0` y `NOLC_ART_COUNT=2`, y correr su workflow.
   - Publica **los mismos 122 archivos** (fijados): idéntico byte por byte.
3. Correr el workflow de `nolc-arte-2`. Publica solo el arte nuevo.
4. En el repo del juego: `NOLC_ART_BASE_FULL=https://ragosorio.github.io/nolc-arte/,https://ragosorio.github.io/nolc-arte-2/` y volver a desplegar.
   - El check pasa y los gatos nuevos cargan su arte completo desde `nolc-arte-2`.
5. Descomentar el cron de `nolc-arte-2`.

**Rollback:**
- Quitar la segunda base de `NOLC_ART_BASE_FULL` y volver a desplegar: los gatos nuevos quedan en lite.
- `nolc-arte` nunca cambia sus rutas.
