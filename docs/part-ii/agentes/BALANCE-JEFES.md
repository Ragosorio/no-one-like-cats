# BALANCE-JEFES

Balance de las batallas de historia de la Parte II (H34–H63) más allá de Nv50. Detalle y tablas: `../27-oleada-4.md` §Balance de jefes y `../16-niveles-100.md` §4b. Sin commit (no hacer commit ni push).

## Qué estoy haciendo

Nada: la brecha de H63 quedó resuelta (2026-10-10, ~12:25). Espero instrucciones.

**Resumen de lo último (H63):**
- Las derrotas eran por núcleo: las ondas de Ronrón (`pierce` 8) y Grafitera (`pierce` 4) cruzaban todas las paredes.
- Regla nueva **PUERTAS CERRADAS** (`StoryBattleDef.wavePierce = 1` en `umbral_final`, aplicada en `buildStoryBattle`): ninguna onda cruza más de una pared, de ningún lado. La tarjeta lo avisa.
- `final.base` 1,56.
- Resultado con 64 semillas a Nv50 / Nv60:

  | tripulación | Nv50 | Nv60 |
  |---|---:|---:|
  | historia | 69 | 67 |
  | legend | 86 | 81 |
  | p2 (solo Parte II) | 47 | 47 |

  Promedio de las tres: 65–67 %. Diagnóstico completo y tablas en el doc 27.
- **Pendiente posible:** «legend» a Nv50 en 86 % (meta ≤ 82). La palanca que queda es la MANO de los Titiriteros, que regresa tiros al núcleo propio: `UMBRAL_RULES.byFase.titiriteros.hand`.

## Hecho

- **Fórmula** (`game/src/state/sys/storyScale.ts`): Poder enemigo = máx(5, tu Poder × `powerMul`) × `base` × (1 + `over`·x), con x = (mín(L,100) − 50)/50 y L = nivel medio de la tripulación.
  - Si L > 50: nivel enemigo = mín(100, L + `lvl`).
  - En jefe y final, ★ enemiga = la que pide ese nivel, máximo ★5 (`mirrorMaxStars`).
  - Si L ≤ 50: identidad.
- **Bandas:**

  | banda | `base` | `over` | `lvl` | ★ espejo |
  |---|---:|---:|---:|---|
  | `historia` | ×1 | 0 | 0 | no |
  | `jefe` (H49, H57, H62) | ×1,1 | 0 | +2 | sí |
  | `final` (H63) | ×1,56 + PUERTAS CERRADAS | 0 | +5 | sí |

  La Parte I no tiene banda y queda idéntica bit a bit.
- **Camarotes:** toda batalla con banda pide un camarote por gato enemigo (`buildStoryBattle`: `catrooms = def.catrooms ?? enemyCats.length`; `buildSiege` lo aplica). Ya no se pierde ningún gato en las 16 batallas de la Parte II. Comprobado en la sim: el gato extra dispara y usa su ulti.
- **Ajustes de `powerMul`** (ya con los 4 gatos):

  | batalla | `powerMul` | otros cambios |
  |---|---|---|
  | H34 | 1,1 | — |
  | H40 | 1,4 | — |
  | H52 | 1,1 | — |
  | H49 | 1,32 | casco ×3 |
  | H57 | 1,02 | casco ×3,5 |
  | H62 | 1,31 | — |
  | H63 | 1,35 | — |
  | H58 | 1,2 | luna de Duermevela, potencia 3,5 (`cata.power`) |

  Las demás conservan su valor.
- **Resultado** (promedio de las dos tripulaciones):
  - batallas `historia`: 85–93 % (H51 se queda en 100 %);
  - jefes a Nv50–60: H49 76 %, H57 78 %, H62 81 %;
  - H63: 65–67 % con tres tripulaciones (historia, legend, p2).
  
  Tablas completas en el doc 27 §Balance de jefes y el doc 16 §4b.
- **Archivos:**
  - nuevos: `storyScale.ts`, `scripts/balance-jefes.ts` (con `--comp p2`), `tests/storyScale.test.ts` (9 pruebas);
  - modificados: `campaign.ts`, `storyBattles.ts`, `rupturas.ts`, `rupturasO2.ts`, `rupturasO3.ts`, `rupturasO4Battles.ts`, docs 16 y 27.
- **Verificación (12:20):** typecheck limpio, `npm test` con 38 archivos y 445 pruebas en verde, verify-missions con 162 OK.

## Falta

- Nada de lo pedido.
- ~~Opcional: H63 con «legend» a Nv50 (86 %)~~ **Decisión (coordinador, 2026-10-10): se deja así.** Está dentro de las bandas que vigila `tests/storyScale.test.ts` (ninguna tripulación amurallada ni paseo) y el promedio de las tres queda en 65–67 %; el dueño hará el QA definitivo jugando.

## Cómo retomar

```
cd game
npx vite-node scripts/balance-jefes.ts -- --seeds 64 --crews n30,n50,n60,n65,n80,n100 \
   [--comp historia|legend] [--only id1,id2] [--noscale] [--json salida.jsonl] \
   [--tune jefe.base=1.3,final.base=1.6,jefe.over=0] [--mul id=1.2] [--hp id=3]
npm run typecheck && npm test && npx tsx scripts/verify-missions.ts --all
```

- Tripulaciones:
  - `n30` ★3, `n50` ★3, `n60` ★3, `n65` ★3, `n80` ★4, `n100` ★6.
  - `--comp historia`: Raijin, Ignis, Abisa, Madre Nácar, Masa Madre, Jonás, Brecha.
  - `--comp legend`: la del fixture `post-finale`.
  - Kit de Vuelo 1 y Kit Astral 1, sin SINCRO.
- Las batallas `historia` son iguales a cualquier nivel: basta medir Nv50. Los jefes cambian pasando 50 (★ espejo): hay que medir Nv60, 80 y 100.
- Una celda de 64 semillas tarda ~2–4 min. Conviene correr varios procesos en paralelo, cada uno con `--json` al mismo archivo.
- Los intermedios van en la carpeta scratchpad de la sesión (`.../scratchpad/jr/`); se pueden borrar.
- **Trampas:**
  - con 16 semillas el ruido es de ±12 puntos;
  - la tripulación «historia» trae a Masa Madre, así que H49 le cuesta menos;
  - «legend» trae a Gea (Tierra), así que gana siempre H40.

## Última actualización

2026-10-10 12:25
