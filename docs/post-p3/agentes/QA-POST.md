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

---

# Ronda 2 (2026-10-29): todo lo hecho desde 8c5b17c

## Qué estoy haciendo
Nada: ronda 2 terminada (2026-10-29 13:20). Servidores detenidos (5211), Chrome cerrado, dist borrado, entradas
`qa-post*` quitadas de `.claude/launch.json`. Arneses en `<scratchpad>/qa-post/h/` (queue*.sh, reveal2, eterno2,
eternoOld, gsim2, islands, findcoords, prodnav…); resultados en `<scratchpad>/qa-post/ronda2/`.

## Hecho (ronda 2)
- **Suite:** `tsc` limpio; `vitest run --maxWorkers=2`: 89 archivos, 1562 pasan, 2 saltadas (p3Balance.sim, como siempre).
- **Partidas:** las 28 de `game/test-saves` cargan; 25 sin pérdida, las 3 `rupturas-*` con el reinicio de la Parte II
  de siempre (igual que ronda 1). Antes del final: 0/123 en el Catdex, pools 0, Copa vacía, las 5 islas ocultas
  (`lllll`), estandartes `michi,holo,cofre` (sin MULTIVERSO). **`rupturas-raro` ya no abre el lote** (bug 2 de la ronda 1
  cerrado). Partida post nueva (h93-final → «Continuará» por el código del juego): 123 rumores, pools 24/44/44/30/11/10
  (= `05` §3), Copa 8, 0 pérdidas. m2-postboss2 dio 4 avisos «GSAP target null» (sin error; ver abajo).
- **Eterno viejo trabado** (forma de antes: pot `{cur, amount, doublings}` sin `extra`, `locked`): al abrir el casino se
  resuelve: GANAR → fichas 4000×2 + 9000 = 17000, oro ×2, gato especial (Capitán Gorrimiau); PERDER → todo a 0 y nada
  más tocado. 0 errores, 0 pérdidas fuera de lo que el 50/50 apuesta.
- **Tanda 2 por flujos reales, 10 revelaciones con su universo, 0 errores:** PORTAL MICHI → Miausagi (K), Quetzalgatl
  (J), Miaucol (L); MULTIVERSO HOLO → Miauton (K); MULTIVERSO DESBORDADO ×1 → Gatejo (J), Tetrimiau (K); ×10 →
  Shakimiau (L); La Caja → Doc Miauwn (L), El Michíncipe (K); Modo Eterno ganado → Napoleón Bonapata (J).
- **SISTEMA-2:** Eterno por la mesa real: botín con drops (36 boletos, 21 gemas, pescaditos, oro) ×16; ganar suma todo;
  perder deja todo en 0. Estandarte: no existe antes del final (h93-final), sí después («85 MULTIDIMENSIONALES
  ADENTRO»); aviso de MADAME NOIR 4 globos, una sola vez (segunda visita: nada). ×1/×10 del MULTIVERSO y ×10 del PORTAL
  MICHI: lo Multidimensional sale con su color/palabra, no dorado. Sim de 5000 tiros del MULTIVERSO: 294/294
  legendarios-míticos son MD; hueco máx. 31 (panel: 36), medio 17 (esperado 18,4); mítico máx. 140 (=140); épico ≤ 8; gato
  ≤ 5; frecuencias por gato = `multiversoOdds` (z máx. 2,4 en 85); «MD que te falta» solo da faltantes.
- **Batallas tanda 2** (`?stage=5-4`, 5 tripulaciones): 15 poderes disparan (Sombreronrón, Gatejo, Maullorona, Miauton,
  Miauzart, Miausagi, Mi Pobre Gatito, Felinamente, Gorrimiau, Doc Miauwn, Pinkmiau + Heisenmiau, Shakimiau, Tetrimiau,
  Garjona): 0 errores, 0 softlocks; fichas del HUD legibles (LISTONES 0/3, GRAVEDAD ×0.5, TRAMPAS ×4, MARCADO…). Solo
  encimes pasajeros de palabras de golpe («¡GLUGLU!», «¡SINERGIA DESCUBIERTA!») sobre el tooltip, como antes.
- **Catdex** (los 123 registrados): rejilla MD de 104 cartas (19 P3 + 85 post), estática (tickers/tweens no suben), 10
  detalles vivos, 0 errores nuevos. Vértices: máx. por detalle post 14 076 (Bonapata), 0 de 85 pasan 25k. Memoria, 15
  ciclos: heap +1,31 MB/ciclo (últimos 5: +0,74), ArrayBuffers +0,29 MB/ciclo, texturas 2437→2439 y batchers
  1101→1103 planos. Ronda 1: +1,25 / +0,16; HEAD c4cfa3c: +1,04 / +0,71. Acotado; los Graphics retenidos siguen el mismo
  mecanismo de HEAD (~6,5 por carta MD al abrir la rejilla, ahora 104 cartas).
- **Build** (`npm run build` con `VITE_ART_BASE_FULL` de CI): OK, dist 370 MB, 0 raster, 283 completos fuera; dist
  borrado enseguida (el disco bajó a 4,4 GB). Sin raster en el repo; los 50 SVG nuevos sin scripts ni `<image>`.
- **Islas:** antes del final las 5 ocultas (estado `locked`, `buyExpansion(13)` = false); después, las 5 `available`
  selladas con su precio; comprar la 13 cobra 750B y pasa a `clearing`; panel de la 14 sin textos fuera. «Sin casa»:
  en las dos partidas había lugar (`move`); el caso «TERRENO · 750B» lo cubre `islasPost.test.ts`. Rendimiento (perf de
  ISLAS-POST en 5211, 3 alternancias): ocultas 56,5–60 fps, heap ~256 MB, 352 texturas (250 MB); las 5 abiertas + 10
  hábitats 55,9–60 fps, heap ~350 MB, 404 texturas (282 MB). Graphics más grande de isla nueva: 20 356 v (Siesta); el de
  41 391 v es el de siempre (también en HEAD).
- **Muelle:** 14 muelles a 2000×1300 y 1280×720: 0 textos fuera, 0 encimados, 0 errores.
- **Pantalla completa:** 7 revelaciones a 1500×1000 (3:2) y 2100×900 (21:9) (Homiau P3, Sherlock C, Gomitas E,
  Sombreronrón J, Perla K, Pobre Gatito L y un legendario): todas llenan la pantalla, cierran, 0 errores, 0 tweens
  sobrantes. Un primer cuadro lento (hasta 0,56 s a 21:9 en Sherlock/Sombreronrón: subida de texturas), p99 19 ms.
- **P3-CINE:** h75-acto2: 2 arranques de película (superhéroes 1 y 2) con TRANSFORMACIÓN, 0 cargadores; final
  (h93-final → H93): f31_luz con transformación, sin cargador. «Volver a ver»: 104 filas, ♪ de la Parte III en 96–104;
  ♪ EM%EN reprodujo f06 con `emen` (arranque 7,0 s en dev frío) y ♪ XTI ES AMOR f30 con `xti` (2,8 s); vuelta limpia;
  0 errores. Fonoteca: las 8 canciones desbloqueadas tras cargar.
- **Película fría en producción** (no se pudo rehacer dist por disco: se midió en la versión PUBLICADA, 8c5b17c, mismo
  motor de películas, servida desde GitHub Pages con caché vacío): «Volver a ver» → ▶ KARAOKE: el cargador se ve
  ~3,6 s y la película aparece entre 4,0 y 5,5 s después del toque (dev frío: 11–13 s según P3-CINE). Con la
  transformación nueva (mínimo 1,25 s, respaldo a los 12 s) el morph cubriría ~4–5 s en frío; nunca llega al respaldo.
- **Guarda del arte:** nolc-arte 122/122 idénticos; nolc-arte-2 publicado con 136 (404,1 MB, desde 8c5b17c) + **25
  nuevos sin publicar (60,1 MB)** → avisos, no error. Total al publicar: **161 archivos, 464,3 MB** (< 950).

- **Textos tanda 2 / aviso / islas:** español latino; sin letras de canciones; nada sexual; el aviso nombra a
  Luzterna («la tristeza por Luzterna») pero solo existe después del final (verificado). Marcados para el dueño (no
  tocados): Mi Pobre Gatito «Feliz Navidad, gato inmundo… y quédate con el cambio» (casi literal de la película) y
  «THIS IS MY BOX! I HAVE TO DEFEND IT!»; Felinamente «¿Qué? ¿Como si fuera difícil?» (frase famosa de la película);
  El Michíncipe «Lo esencial es invisible a los bigotes» y «DRAW ME A BOX!» (libro aún protegido en EE. UU.); Miausagi
  «IN THE NAME OF THE FULL BOWL!»; Doc Miauwn «GREAT SCRATCH!» y «1.21 gigamiaus» (+ un auto plateado tipo DeLorean en
  su universo); Pinkmiau «burbujas azules, michi» / «¡CIENCIA!» (eco de Breaking Bad). La línea `sf` (sin filtro) del
  casino «¡MULTIDIMENSIONAL, A HUEVO!» solo sale con el tono SIN FILTRO, como «No mames» de antes.

## Bugs ronda 2
- **Arreglados:** ninguno (nada chico y obvio que tocar).
- **Abiertos:** (1) MULTIVERSO HOLO sigue rompiendo su garantía impresa (bug 1 de la ronda 1): 4000 tiros → 45,5 % del
  Multiverso, hasta 4 legendarios/míticos seguidos sin uno (el panel dice 3). PORTAL MICHI bien (58,5 %, máx. 2).
  (2) m2-postboss2 dio 4 avisos «GSAP target null not found» en la primera pasada; al repetirla, 0: no se reproduce.

## Falta (ronda 2)
Nada de QA. Al publicar: ver «Al publicar» (ronda 1) + publicar nolc-arte-2 con los 25 nuevos (161 archivos, 464,3 MB).
