# HOTFIX-VIVO

**Qué estoy haciendo**: TERMINADO. `npm test` 48 archivos / 557 pruebas verdes, typecheck limpio, verify-missions 162 OK. Vite 5441 y Chrome 9441 apagados, perfil y capturas borrados.

**Hecho** (todo SIN COMMIT; lo sube el coordinador con el OK del dueño):

- **(1) Islas de la Parte II**. La captura del dueño era su archipiélago (el fondo de la dimensión «fantasma», arte normal de la Parte I): buscaba ahí las islas. Nada le decía que viven en la CARTA, y el reinicio narrativo había quitado de la carta las que ya conocía (Nácar).
  - `state/sys/rupturas.ts`: `knownRegions()` + `syncKnownRegions()` (dentro de `syncRegionFlags`, en cada carga y misión). Una isla que la partida ya tuvo (flag actual, `ext.rupturas.reset.flags`, visita o batalla cobrada en el registro) vuelve a la carta. El registro opcional `ext.rupturas.known` solo se escribe si el espacio `ext.rupturas` ya existe; los flags se reponen en silencio (sin evento `unlock`). Un jugador nuevo solo ve lo que la historia le mostró.
  - `freshChartIslands()` (islas con tinta sin ver, `carta_<id>`): ¡ZARPAR! late con «¡NUEVA ISLA!» (`ui/hud/Hud.ts`, `ActionBar.ts` `pulse`). La carta se desliza a la isla nueva y la rodea (`MapScene.showFreshIslands`; marca `carta_<id>` también en la hoja O4).
  - `chartIslandsToTell()` + `app/story.ts tellChartIslands()`: Luzterna lo explica una vez (flag `aviso_carta_islas`), nunca durante H31/H32 ni con beats en cola.
  - El IR de misión ya llevaba a la región (`regionForGoal`); no cambió.
- **(2) Solo suena el Momento**. `core/audio.ts › solo(key,on,fade)`: sfx, ambiente, voces y el nodo nuevo `procGate` (procedural) a 0, por retenciones con clave. `audio/player.ts › hushDecks`: la música que sonaba se apaga; `setBoost` la respeta. Fachada: `audioApi.solo(on, { key, fade, decks })`. `momentos/index.ts playMomento`: lo toma antes de la invitación (0,3 s) y lo suelta en el `finally` (0,6 s).
- **(3) El Momento TERMINA la batalla**.
  - `battle/fases.ts`: `FaseDef.endsBattle`. Al entrar, `winner` = jugador, `reason` = 'momento', sin efectos de la fase. El chip dice «GOLPE FINAL AL x%».
  - Marcado en `ruptura_bibliotecario/memoria`, `cielo_invertidas/cielo`, `ruptura_disruptores/glitch`, `ruptura_leviatan/cielo` y `umbral_correctores/el_plan`.
  - `BattleMusic.resume(over)` no re-cuea; `fasesFx` no pone el cartel; `BattleScene` muestra «¡LA PELEA ES TUYA!».
  - Intros de H44, H55, H57 y H62 ajustadas («GOLPE FINAL»). `VictoryReason` suma 'momento'.
  - Umbral de las 5 fases finales: **80 %**, sin disparador por turno (antes 40 %/t4, 35 %/t4, 50 %, 34 %, 50 %/t5). Con los de antes la pelea duraba ~2 turnos y se ganaba siempre. Si el jugador gana antes por otra vía (núcleo, tripulación), `fasesCheck` entra igual a la fase final en ese tiro: todo combate ganado termina con su Momento; la victoria conserva su motivo. Perder nunca lo reproduce.
  - Balance (`balance-jefes`, 16 semillas, crews n50/n80), antes → ahora:
    - H35: 88 % t7.8 → 100 % t5.3.
    - H44: 81–88 % t8.6 → 94 % t4.4.
    - H55: 88 % t8.3 → 94 % t7.0.
    - H57: 81–88 % t6.2 → 100 % t4.6.
    - H62: 75–81 % t11.8 → 94 % t7.9.
    - Con los umbrales viejos + fin: 100 % en t1.6–3.4.
- **(4) Páginas**. `regions/paginas/readPages.ts` (puro): una página del DIARIO cuenta como leída por su flag o por el registro `pagina:<n>`. Las sueltas salen una vez cada una (`pagina_suelta:<i>`). Nunca flotan más páginas de las que quedan. La ballena de Sueños dice cada línea una vez (`counters.suenos_ballena_lineas`).
- **(5) Avisos**.
  - `ui/toastAvoid.ts`: registra los paneles Modal, la caja de diálogo, el cartel CAPTION, la burbuja de tip y los periódicos. `toast()` usa una franja libre; si no hay, espera hasta 2,4 s y luego se encoge en la franja más grande.
  - Las «NUEVA VERSIÓN» que llegan juntas se agrupan en un solo aviso (`audio/versionsToast.ts`). La tarjeta de canción nueva espera si su esquina está tapada.
  - «Calidad 3D» sale una vez por sesión y nunca durante una lectura. La placa del nombre de la región se aparta mientras hay diálogo.
- **Pruebas**:
  - `tests/hotfixVivo.test.ts` (12).
  - Pruebas ajustadas al contrato nuevo: `momentosWIL`, `momentosH44`, `momentosTeOdio`, `momentoCircusMalus`, `rupturasO3` (prueba nueva de fase final), `rupturasO4` y `rupturasReset` (las islas conocidas se quedan).
- **Headless** (Vite 5441, CDP 9441, audio real):
  - H55 (umbral nuevo, camino propio de BattleScene) también, con la canción entera.
  - H35 y H44 con la canción entera: durante el Momento, solo, efectos/ambiente/voces = 0 y la música de batalla a 0; al cortar, victoria y todo restaurado.
  - H62 saliendo de la repetición: victoria, vuelta a la isla, `won_umbral_correctores`.
  - YONOSE (final): solo.
  - Reinicio de `rupturas-o4` → partida en H36: islas en la carta, ¡NUEVA ISLA!, Luzterna y la carta resalta.
  - Páginas: no se repiten. Avisos: agrupados y fuera del periódico.

**Falta**: (nada, salvo lo que diga el coordinador).

**Cómo retomar**:
- Scratch: `/private/tmp/claude-501/-Users-roor-osorio-Desktop-No-one/e9a3a7b3-f411-4663-b81c-1333e78c09b3/scratchpad/hotfix/` (`lib.mjs`, `drive.mjs`, `battle.mjs`, `s*.mjs`; capturas en `shots/`, fuera del repo).
- Vite: `npx vite --config <scratch>/vite.hotfix.config.ts` (5441).
- Chrome headless en 9441 con perfil `<scratch>/profile`.

**Última actualización**: 2026-10-10 ~22:55
