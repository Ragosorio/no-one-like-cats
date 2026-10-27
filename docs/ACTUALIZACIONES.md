# Cómo sacar una actualización sin romperle la partida a nadie

NO ONE LIKE CATS guarda la partida en el navegador de cada jugador (`localStorage`). No hay servidor:
cuando subimos una versión nueva, **la partida vieja de cada persona tiene que entender las reglas nuevas
sola**. Este documento explica el sistema que lo hace y las reglas para usarlo.

## Qué pasa cuando alguien abre el juego después de una actualización

```
GitHub Pages publica un build nuevo
        │
        ▼
version.json cambia ──► el juego abierto lo nota (cada 10 min o al volver a la pestaña)
        │                └► cartel "¡ACTUALIZACIÓN LISTA!" → guarda → recarga
        ▼
index.html (red primero) + sw.js?v=<build> (service worker nuevo, cachés de código nuevas)
        │
        ▼
G.load()  ── core/save.ts       lee la partida (si está dañada, usa la copia de hace unos minutos)
        │  ── backup             si la versión es vieja: copia intacta en nolc-save-bak-<versión>
        │  ── state/migrate.ts   MIGRATIONS[v]  → cambios de forma (renombrar/mover datos)
        │                        normalize()    → rellena campos nuevos, repara NaN, quita duplicados
        │  ── state/patches.ts   parches        → arreglos de juego con los sistemas cargados
        ▼
misiones se re-evalúan solas (state/sys/missions.ts): una misión nueva cuyo disparador ya se cumplió
se activa; una ya cumplida se completa
        ▼
NOVEDADES (ui/updatesPanel.ts): las notas que esa partida no ha visto + lo que los parches le hicieron
```

Un juego nuevo marca todos los parches como aplicados y todas las novedades como vistas.

## Las cuatro herramientas

| Necesito… | Uso | Archivo |
|---|---|---|
| Un campo nuevo en la partida | Agrégalo a `GameState` y a `defaultState()`. `normalize()` se lo pone a las partidas viejas. **No hace falta subir versión.** | `game/src/state/game.ts` |
| Cambiar la forma de datos que ya existen (renombrar, mover, convertir) | Una migración nueva `MIGRATIONS[n]` y `SAVE_VERSION = n` | `game/src/state/migrate.ts` |
| Que una partida vieja reciba algo que ahora el juego da (un gato, un elemento, un reembolso) o se adapte a una regla nueva | `registerPatch({ id, why, run })` | `game/src/state/patches.ts` (o el módulo del sistema) |
| Contarle al jugador qué cambió | Una entrada nueva ARRIBA de `UPDATES` | `game/src/data/updates.ts` |

### Migración (forma de los datos)

```ts
// state/migrate.ts
export const SAVE_VERSION = 3;
const MIGRATIONS = {
  2: (s) => { s.patches ??= []; s.updatesSeen ??= []; },
  3: (s) => {
    // ejemplo: habitats pasan de { region, plot } a { x, y }
    for (const h of s.habitats ?? []) if (h.x === undefined) Object.assign(h, plotToXY(h.region, h.plot));
  },
};
```

- Trabaja sobre JSON plano. No importes sistemas ni contenido.
- Tiene que poder correr sobre una partida a la que le falten campos.
- Nunca borres el dato viejo si no estás 100 % seguro: déjalo y deja de leerlo.

### Parche (reglas del juego)

```ts
// state/sys/tu-sistema.ts
import { registerPatch } from '../patches';

registerPatch({
  id: '2026-11-podio-desbloqueo',        // para siempre: nunca lo cambies ni lo reutilices
  why: 'El Podio se desbloquea con el Jefe 2; quien ya lo venció no vio la presentación.',
  run() {
    if (G.s.campaign.bossesDefeated < 2) return;      // no aplica: igual queda marcado como hecho
    G.flag('podio_unlocked');
    return 'El Podio ya está abierto en tu isla: duelos 1 contra 1.'; // se muestra en NOVEDADES
  },
});
```

Reglas de un parche:

1. **Dar, reparar, reembolsar o reubicar. Nunca quitar.** Ni oro, ni gemas, ni gatos, ni niveles, ni progreso.
   Si una regla nueva hace inválido algo que el jugador construyó, consérvalo en la partida y avísale
   (ejemplo real: `2026-10-mamparos-max-3` recorta mamparos sobrantes; si aún así no cuadra, guarda el
   diseño y el Astillero lo abre marcado en rojo).
2. **Idempotente y seguro en cualquier partida**: nueva, vieja, a medias, de pruebas.
3. **Si truena, se salta** y se reintenta el siguiente arranque; el juego sigue cargando.
4. El sistema dueño importa el módulo desde `state/index.ts` para que el parche quede registrado antes de cargar.
5. Devuelve una frase corta en español (tono del juego) si el jugador debe enterarse; si no, nada.

### Contenido de una parte nueva (módulos que solo agregan)

Las partes nuevas no editan `content.json`: traen su contenido en módulos (`data/rupturas/*.json` en la Parte II,
`data/gateras/*.json` en la Parte III) que `content.ts` une con `mergeContent`. La unión **solo agrega**: en desarrollo
y en las pruebas truena si un módulo intenta sobrescribir un valor de la Parte I o repetir un `id`.

Lo que una parte guarda en la partida va en una **sección opcional** de `G.s.ext` (por ejemplo `ext.momentos`,
`ext.rupturas`, `ext.gateras`):

- una partida que nunca tocó esa parte queda idéntica;
- se normaliza en cada carga y la normalización solo repara (limita números, conserva claves desconocidas), nunca resta;
- si la sección está rota, se aparta en otra clave (como `ext.gaterasBroken`) en vez de borrarse.

### Novedades

```ts
// data/updates.ts — la más nueva arriba
{
  id: '2026-11-01-podio',              // único y para siempre
  date: '2026-11-01',
  title: 'El Podio',
  luzterna: 'Ahora los gatos se pegan uno a uno. Como en mis tiempos. Bueno, en mis tiempos no había gatos.',
  items: [{ tag: 'NUEVO', text: 'Duelos 1 contra 1 con cuatro poderes…' }],
}
```

Etiquetas: `NUEVO`, `ARREGLO`, `CAMBIO`, `BALANCE`. Escribe para jugadores, no para programadores.

## Respaldos (la red de seguridad)

`core/save.ts` guarda, además de la partida viva (`nolc-save-v1`):

- `nolc-save-prev` — la última partida buena, rotada cada 5 minutos. Si la viva se daña, se usa esta.
- `nolc-save-bak-<versión>` — una copia intacta antes de migrar desde esa versión. Nunca se sobrescribe.
- `nolc-save-bak-borrada` — la última partida que alguien borró desde Ajustes.
- `nolc-save-bak-undo` — lo que había antes de restaurar/pegar una partida.

El jugador las ve en **Ajustes › RESPALDOS**, donde también puede copiar su partida como texto y pegarla
en otro navegador o en la app instalada.

### El Baúl (`core/vault.ts`)

Encima de esos respaldos:

1. **Historial** en IndexedDB: una copia cada 10 minutos de juego, al ocultar la pestaña y **antes de cualquier cosa
   que reemplace la partida** (pegar, restaurar, partida nueva). Guarda las 15 más nuevas y una por día durante 30 días,
   cada una con un resumen (Reino, gatos, horas) para reconocer "la buena".
2. **Una carpeta del jugador** (Chrome y Edge, File System Access): `NoOneLikeCats.nocat` y una copia diaria en
   `respaldos/`. Son archivos reales: borrar los datos del navegador no los toca.
3. **Archivos `.nocat`** para descargar y abrir en cualquier lado (JSON legible).
4. `navigator.storage.persist()`, para que el navegador no desaloje el almacenamiento del juego.

Y dos candados contra pisar progreso:

- **Una sola pestaña escribe** a la vez (Web Locks, `ui/saveGuard.ts`). Las demás muestran un aviso y ofrecen recargar.
- `G.save()` **nunca guarda una partida con menos tiempo de juego** que la que ya está en disco: una pestaña vieja o
  una copia de otro dispositivo no puede borrar progreso. **No quites este candado.**

Todo código nuevo que reemplace la partida llama antes a `snapshot(motivo)`.

Si una pestaña vieja abre una partida escrita por una versión **más nueva**, juega pero **no guarda**
(`G.newerSave`) y ofrece recargar. Así una versión vieja jamás pisa datos nuevos.

## Checklist antes de subir

- [ ] `npm run typecheck`, `npm test` y `npm run build` pasan.
- [ ] Probé con una partida vieja: `?save=post-boss3` (fixtures en `game/test-saves/`) y con un juego nuevo.
- [ ] Si cambié reglas que una partida ya usa → hay parche.
- [ ] Si cambié la forma de datos guardados → hay migración y subí `SAVE_VERSION`.
- [ ] Hay entrada en `data/updates.ts` con lo que el jugador va a notar.
- [ ] Nada de lo anterior quita recursos ni progreso.
