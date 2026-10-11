# MOMENTO-TE-ODIO — estado del agente

Sin spoilers. Momento musical de te ODIO en H55 (batalla de los Disruptores, al entrar en su fase glitch). Carpeta
`game/src/momentos/songs/teOdio/`, ruta DEV `?momento=te_odio`, Vite propio en el puerto 5341.

## Qué estoy haciendo

Nada: el encargo está terminado (2026-10-10, 2.ª sesión).

## Hecho

- Estilo «GRAFITI Y SEÑAL ROTA»: el mismo mundo en dos artes (cómic limpio de la caja / spray callejero), frente
  entre ambas, grietas como ventanas al otro arte, filtro propio (señal rota, plantilla, fotocopia).
- Archivos: `score.ts` (canción entera, 0 → 214,0; 48 prompts: 43 calificados + 3 opcionales + 2 elecciones), `stage.ts`, `art.ts`,
  `spray.ts`, `bake.ts` (gatos en cómic y en plantilla), `post.ts` (SignalFilter), `verbs.ts`, `shots.ts`, `index.ts`.
- Motor (retrocompatible): `StageApi.post` (filtros propios del set, en `runner.applyPost`), `MomentoDef.source`
  (lugar que muestra la Fonoteca; antes estaba fijo en «Islas Invertidas»).
- Registrado en `songs/index.ts`; el gancho de batalla es `battle: { id: 'ruptura_disruptores', fase: 'glitch' }`
  (BattleScene → runBattleMomento, como LIKY FIGHT).
- `tests/momentosTeOdio.test.ts` (hoy 11): cero advertencias, canción entera, inputs sobre onsets medidos, mismo
  resultado con 3 bots, guardia de destellos, registro.

- Pulido (2.ª sesión): cara de Luzterna centrada; Brecha a bordo en la proa y Canelo/tripulación hacia el mástil
  (cara a cara legible; frente empujado a `style` 0,24 y cámaras recentradas en verse2); canaletas de la caja entre
  los sujetos (0,5 / 0,9 y una franja sobre la popa); el muro de la grieta es la caja de noche (Ben-Day, canaletas,
  tags desvaídos) con Brecha colgada de su palanca; la caja de la cinta se comba con ¡ROMPE! y se agrieta desde las
  esquinas; prompt de las grietas en el borde (ancla `riftARim`), no en la cara; «TE ODIO» de la voz bajo la barbilla
  en los primeros planos; el chisporroteo de Eco Mudo es ahora un primer plano.
- Tirón arreglado: el primer golpe (¡RASGA!, 4,0 s) tardaba 57–164 ms porque las palabras de las ramas se horneaban
  con una semilla que dependía del id del cue (la pasada en seco usa −1): ahora la semilla sale del texto
  (`textSeed`), y la nota de ritmo hornea S/A/B/C antes del reloj. Medido: el cuadro del golpe baja a ~17 ms.
- Fuga de memoria arreglada: el heap subía ~14 MB por reproducción porque las tramas Ben-Day a pantalla completa eran
  miles de círculos (~100 k vértices) y los batchers en pool de Pixi crecen hasta la geometría más grande que
  sirvieron. Ahora `benDayLayer` (spray.ts) usa TilingSprites con una baldosa de puntos por tamaño (cacheada en la
  sesión). Ciclos con dispose: 59 → 77 → 83 → 88 → 90 → 93 MB (LIKY en el mismo arnés: 59 → 75 → 80 → 83 → 82).
- Pósters y placas se arman antes del reloj (`stage.prebuild`: dibujados una vez fuera de pantalla).
- «Reducir destellos» también calma la nieve y los bloques de la señal rota (`SignalFilter.commit(..., calm)`).
- Prueba nueva: H55 con la misma semilla da la misma pelea (vacío → glitch) con o sin el Momento registrado y con la
  spec clonada como al worker (11 pruebas en `momentosTeOdio.test.ts`).

- Flujo real de H55 (fixture `rupturas-o3` + `__o3.jump('H55')` + Kit Astral/combustible como en el Taller +
  `startStoryBattle`): vacío → Momento → fase glitch; con bots perfecto / sin input / fallado el simulador queda
  idéntico antes y después del Momento y la partida solo gana `ext.momentos.te_odio` (S / C / C).
- Medido con vsync (cifras en doc 29 §17.4): deriva p99 0,1 ms; bombo → cuadro mediana 10,8 ms, p99 23,2; acento →
  cuadro mediana 7,5, p99 19,5; 59,7 fps (alta) y 59,9 fps (baja); Esc y pestaña oculta congelan; memoria en tiempo
  real 59,8 → 85,7 → 97,3 MB; audio decodificado vuelve a 0.
- Pruebas: `tests/momento*` 8 archivos / 103 pruebas OK, `originalsReserved` OK, typecheck OK, verify-missions 162 OK.
- Doc 29 §17 (hoja + guía de estilo + mediciones) y fila de §2; línea en la bitácora del doc 28.
- Limpieza: Vite :5341 apagado, perfiles de Chrome, cuadros, trazas y caché borrados. Quedan 6 hojas en
  `<scratch viejo>/teodio/tools/final/`.

## Falta

Nada del encargo. (Ideas opcionales, no pedidas: hacer baldosas también de las tramas de los pósters de cómic; el
arnés de memoria `memprobe.mjs` podría vivir en `game/scripts/` para todos los Momentos.)

## Cómo retomar

- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/f8d0e043-0e92-467b-a5d4-e9b12fa6c140/scratchpad/teodio/tools/`
  (`par.sh all.txt` = 9 hojas en 3 carriles; `shot.mjs "t1,t2" nombre` = cuadros exactos; `run.mjs high|low N` =
  tiempo real con vsync; `h55.mjs perfect|none|miss` = flujo real; `memprobe.mjs` = fugas). Vite: `npx --prefix game
  vite --config <scratch>/teodio/tools/vite.config.mjs` (puerto 5341). El flujo H55 necesita instalar el Kit Astral
  en la fixture (si no, el preflight abre el Taller Cometa).

## Última actualización

2026-10-10 18:58 (2.ª sesión: TERMINADO)
