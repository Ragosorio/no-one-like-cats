# QA-POST · estado del agente

> ⚠️ SPOILERS de la Parte III (esta carpeta los permite).
> Encargo: QA final antes de publicar el lote post-P3 (98 gatos). Headless en el juego integrado. Sin commits, sin push,
> sin publicar. Puerto 5211 (`sistema`); nunca el 5173. Capturas en `<scratchpad>/qa-post/`.

## Qué estoy haciendo
Nada: QA terminado (2026-10-29). Servidores 5211 y 5291 detenidos; `qa-post-head` quitado de `.claude/launch.json`.

## Hecho
- **1 Partidas:** las 28 de `game/test-saves` cargan sin errores; 25 sin pérdida. Las 3 `rupturas-*` pierden solo
  misiones/beats/banderas de la Parte II (el reinicio narrativo de siempre, `21-migracion-reinicio.md`; lista idéntica en HEAD), nunca
  gatos ni moneda. Ninguna previa al final ve el lote (0/98 en el Catdex, pools 0, Copa vacía), **salvo `rupturas-raro`** (abierta:
  su H99 fantasma activa abre el candado; ver Bugs). Partida post armada con el código del juego (h93-final → H93–H96 +
  «Continuará»): candado abierto, 98 rumores, pools 19/35/35/24/8/7, Copa 8 en orden, 0 pérdidas. playMs intacto.
- **2 Casino:** las 6 bolsas MULTIVERSO = `03` §3.2 (gato, rareza y peso), share/pity 0.5/3 · 0.4/4 · 0.6/2 · 0.75/2.
  Las 7 vitrinas: insignia, 8 gatos = `03` §4, 0.6 %. 8 revelaciones por flujo real con su universo (Plinko, Rasca,
  Bingo, Ruleta, Sellos en Cajas, chispa en Dados, Portal, La Caja): I, F, C, E, H, G, I, D. Contadores se mueven.
- **3 Copa:** fila en el lobby (pestaña «COPA FUERA DE LA CAJA · 0/8»), 8 retos en orden por PodioScene real
  (estados n→p, los sellados sin rival), poder = campeón de la liga ancla × 1.10…1.45 (76→100 en liga 8; ancla mín. 8,
  sigue a tu liga: 14 → poder ×5,3), cada Heroico pagado 1 vez con `postchamp_<id>`; revancha sin gato. 0 errores.
- **4 Catdex:** rejilla MD (79: 19 P3 + 60 post) estática (tickers/tweens no suben), 10 detalles post vivos, 0 errores
  nuevos. Vértices: máx. por detalle post 11 036 (Michimérica), 0 de 60 pasan 25k. Memoria, 15 ciclos (abrir → MD →
  scroll → 6 detalles → cerrar): heap +1,25 MB/ciclo (últimos 5: +0,26), ArrayBuffers +0,16 MB/ciclo, texturas y
  batchers planos (2172 / 931). HEAD c4cfa3c (servidor scratch 5291): heap +1,04, AB +0,71. Graphics retenidos: mismo
  mecanismo que en HEAD (~5–6 por carta MD al abrir la rejilla), ahora con 79 cartas MD en vez de 19.
- **5 Batalla:** 6 batallas reales (`?stage=5-4`), 18 MD post disparan su poder (Gatojo, Hermiaune, Kagebunyan, Grrrú,
  Miaunion, Ssssmichi, Michimpostor, Miaubody, Sabrina, Ryumiau, Michi Atom, Frankengato, Daft Miau, Party Michi, Rick,
  Supermichi, Michimérica, Doomiau): 0 errores, 0 softlocks, HUD legible.
- **6 Build:** `npm run build` (con `VITE_ART_BASE_FULL` como en CI) OK, dist 353 MB, 0 raster, 258 completos fuera;
  `dist` borrado. `art-publish check`: OK con 98 avisos (los completos nuevos aún no están en nolc-arte-2).
- **Arreglos:** «de el» → «del» en el «cómo se obtiene» (32 gatos: `especies.json`, `04-roster.json` y `fuente/generar.py`);
  «Reglas de la casa» se salía del panel con las 2 líneas nuevas (`OddsPanel.ts rules()`: se encoge para caber).

- **7 Textos:** español latino (cacahuate, ahorita, chamaco, ándale); sin letras de canciones, sin rostros de personas
  reales, nada sexual. Paráfrasis de frases famosas y muletillas (decisión del dueño, no tocadas): Michi-Wan «que la
  croqueta te acompañe», Don Gatoleone «oferta que no podrá ronronear», Heisenmiau «I AM THE ONE WHO… KNEADS» (+ «catnip
  azul purísimo / cocino química»: alusión a droga), Hierro Michi «GENIUS. BILLIONAIRE. NAPPER.», Michimérica «toda la
  siesta», Garritas «I'M THE BEST THERE IS…», «bub», «¡SHIKT!», Supermichi «¿Es un pájaro? ¿Un avión?…» (+ «hierbita verde…
  se pone tontísimo»), Hermiaune «MIAU-LO-sa», Miaunce «los amigos no mienten», Gatogro «como cebollas: capas», Gomitas
  «KING OF THE CATS», Kagebunyan «¡DE VERITAS, MIAU!», Gatojo «¡ZA… MIAURLDO!», Pegaso «¡ARDE, COSMOS!», Miaunya «MIAKU
  MIAKU», Michi Atom «THE BALL IS MY FRIEND», Yugi «¡Activo mi carta trampa!», Miaufalda «STOP THE WORLD…», Condorgato
  «¡Exijo una siesta!». Citas de dominio público: Don Gatote «¡Non fuyades…!» (literal del Quijote), Ahab, Gatula,
  Sherlock. Doblón «Cara o Cruz» suena a España (en LatAm: cara o sello / águila o sol). La Vencidas: el tarro se ve de
  cerveza (texto dice leche; ya lo marcó ARTE-POST-C).

## Bugs abiertos (con repro)
1. **Garantía del Multiverso en MULTIVERSO HOLO** (media-baja): 4000 tiros → 266 legendarios/míticos, 115 del
   Multiverso (43 %), hasta **5 seguidos** sin uno (el panel dice 3). PORTAL MICHI: 56 %, máx. 2 (bien). Causa:
   `casino.ts rollCatDef` solo tira el Multiverso si la rareza sorteada es legendaria/mítica; las entradas «épico o
   legendario (destacado 50 %)» de HOLO devuelven el destacado LEGENDARIO desde un sorteo «épico» y se saltan la bolsa y
   el contador. Repro: `<scratchpad>/qa-post/h/gsim.mjs`. Decisión de diseño (destacado vs. Multiverso): no lo toqué.
2. **`rupturas-raro` abre el lote en la Parte II** (baja): su H99 activa (id fantasma) cumple «H97+ activa» en
   `postP3Unlocked()`; el test «old saves» lo excluye a propósito y `save([], ['H101'])` = abierto es intencional.
   Solo pasa con un id desconocido H97–H99 en la partida. Sugerencia: contar activas > H96 solo si existen en este build
   o si son ≥ H100.
3. **Menores, preexistentes:** Graphics de 41 391 vértices en la isla (también en HEAD); `ovillo.ts:144` avisa al
   dibujar su carta (también en HEAD); con Grrrú+Miaunion la fila de fichas del rival tapa «TURNO» un momento.

## Al publicar
- Push a `main` → el deploy corre `art-publish check` contra los 2 sitios: nolc-arte 122/122 idénticos; nolc-arte-2
  38 iguales + **98 completos nuevos sin publicar = 98 avisos, no error** → pasa. Los gatos nuevos se ven en lite hasta que
  nolc-arte-2 publique (cron cada 6 h, `53 */6`), o ya: `gh workflow run publish.yml -R Ragosorio/nolc-arte-2 -f ref=main`
  (como Ragosorio). Queda en 136 archivos / 403,6 MB (< 950). nolc-arte también se republica (mismos 122).
- Luego verificar `https://ragosorio.github.io/nolc-arte-2/art-manifest.json` (136 archivos) y, si se quiere el check
  limpio, volver a correr el deploy del juego. Nada que cambiar en variables (`NOLC_ART_BASE_FULL` ya tiene los 2).

## Falta
- Nada de QA. El dueño decide los bugs abiertos 1–2 y los textos marcados.

## Cómo retomar
- `preview_start sistema` (5211). Arnés: `<scratchpad>/qa-post/h/` (node_modules → `qa3/pp`). Partida post:
  `node mkpost.mjs ../post` → `../post/post-save.json`; luego `saves.mjs`, `casino.mjs`, `reveal.mjs`, `counters.mjs`,
  `gsim.mjs`, `copa.mjs`, `catdex.mjs`, `gleak.mjs`, `verts.mjs`, `battle.mjs` (cada uno documenta su uso arriba).
- HEAD publicado para comparar: `<scratchpad>/qa-post/head/` (git archive c4cfa3c sin public + symlinks), servidor
  `qa-post-head` (5291).

## Última actualización
2026-10-29 03:00
