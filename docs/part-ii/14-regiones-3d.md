# 14 · Regiones 3D de la Parte II (dentro del juego real)

**Decisión del dueño (2026-10-09):**
- La isla de casa se queda en 2D, igual que en la Parte I.
- Las **islas nuevas de la Parte II se visitan en 3D**, con gatos vivos, día y noche según la hora real, clima, actividades y REGISTRO 000.
- Todo esto aparece **solo en la Parte II**, después de H30.

## Cómo está armado

```
app/flow.ts        goRegion(id)                      ← la carta náutica y la historia entran por aquí
scenes/RegionScene  escena Pixi (HUD) + canvas three.js DEBAJO
engine/world/World3D   el mundo reutilizable (ex vertical slice)
regions/index.ts   ids + batallas de cada región + flag que la muestra en la carta
regions/types.ts   RegionDef / RegionCtx / POI (la API del contenido)
regions/<id>.ts    contenido: terreno, props, residentes, POIs, cinemática
regions/life.ts    actividades de vida ambiental compartidas (pasear, siesta, perseguir…)
regions/shapes.ts  kit de terreno (isla deformada + pads)
```

**Dos canvas apilados.**
- Pixi se inicializa con `backgroundAlpha: 0.999`, que le da un contexto WebGL con canal alfa y en la Parte I se ve idéntico.
- Mientras `RegionScene` está activa, Pixi pone su fondo en alfa 0 y el canvas de three queda visible debajo.
- La HUD, los diálogos (`say`), los toasts y los marcadores siguen siendo Pixi, con el mismo estilo de siempre.

**Entrada.**
- Los clics caen en el canvas de Pixi.
- `rig.ignore` usa `renderer.events.rootBoundary.hitTest`: si el clic toca UI de Pixi, se queda en Pixi; si no, mueve la cámara 3D. Un clic sin arrastre selecciona un gato.

**Carga perezosa.** `three`, el motor y las regiones viajan en el chunk de `RegionScene`. Un jugador de la Parte I nunca los descarga.

**Ciclo de vida.**
- Al entrar se crea el `World3D` y la región construye lo suyo.
- Llegan los **visitantes**: Canelo, en su forma activa, y tus 2 mejores gatos.
- Se emite `feature_region_<id>`.
- Al salir, `World3D.dispose()` recorre la escena y libera geometrías, materiales y texturas, y fuerza la pérdida del contexto WebGL.

**Tiempo y clima.** La hora es la **hora local real** del jugador. El clima del día sale de una semilla con la fecha: mayormente despejado, a veces lluvia, rara vez tormenta. Una región puede fijar ambos (la cinemática fija las 23:12 y cielo despejado).

**Calidad.** Arranca en `alto` (o en `settings.quality3d` si existe) y la auto-calidad baja de nivel sola, con un toast.

## Contrato con la historia y la carta

| Cosa | Dónde |
|---|---|
| Ids | `paginas`, `nacar`, `reflejo` (`regions/index.ts`) |
| Visible en la carta | flag `region:<id>`, que pone la misión que la abre |
| Batallas de la región | `REGION_INFO[id].battles`. El marcador «¡A PELEAR!» aparece en `battleSpot` si la misión de historia activa pelea ahí y `battleGate` lo permite |
| Actividades | `feature_pagina_canelo` (Páginas, con H36 activa) y `feature_haz_nacar` + flag `nacar_haz_ok` (Nácar) |
| Cinemática | `reflejo`: la llama el `ON_DONE` de H31; vuelve sola a la isla (o con SALTAR) |

## Agregar una región nueva

1. Agregar el id en `regions/index.ts` (con sus batallas y su flag de carta) y el loader en `RegionScene.LOADERS`.
2. Crear `regions/<id>.ts`, que exporta `region: RegionDef`:
   - funciones de terreno (`islandHeight` sirve);
   - pintor y `walkable`;
   - cámara, `arrival` y `battleSpot`;
   - `skyKeys` (la lente de la región);
   - `build(ctx)`, que agrega props (`world.addProp`), flora (`world.setFlora`), residentes (`world.addResident`) y devuelve POIs.
3. Probar con la ruta dev `?save=post-finale&scene=region&region=<id>`.

## Verificado

- `reflejo` corre dentro del juego real, con la HUD Pixi y los diálogos encima del 3D, sin errores (capturas en headless).
- Problema resuelto: el contexto de Pixi se creaba sin alfa y tapaba el 3D.
