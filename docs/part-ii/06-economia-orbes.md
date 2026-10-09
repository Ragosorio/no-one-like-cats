# 06 · Economía de orbes: precio con oro

Estado: implementado en `game/src/state/sys/shop.ts` (2026-10-09). Tests: `game/tests/orbPricing.test.ts`.
Contexto del problema: `01-auditoria-juego.md` §2.2.

## Antes

```
I = ingreso/s sin Momentum (piso 1/s)
k = orbes ya comprados con oro de esa especie (ext.shop.goldOrbs, nunca baja)
paquete(5 orbes) = Σ_{i<5} I·60·5·1.15^(k+i) ≈ 33.7 min de ingreso × 2.01^(paquetes previos)
```

Lineal con el ingreso y exponencial (×2.01 por paquete) para siempre. Con una isla de ~1 M/s, el primer paquete
costaba ~2 000 M: más que toda la cartera de un jugador con 1.9 B. El quinto, ×16; el décimo, ×530.

## Después

```
minutos(I) = clamp(33 × (I / 10)^(-0.15), 3, 30)     → oro de un paquete frío ∝ I^0.85
calor      = paquetes comprados de esa especie, −1 por cada hora real (nunca < 0, se guarda como máx. 13.3)
paquete    = nicePrice(max(60, I · 60 · minutos(I) · min(3, 1 + 0.15 · calor)))
```

Constantes (`shop.ts`): `ORB_PACK_MIN 33`, `ORB_INCOME_PIVOT 10`, `ORB_INCOME_EXP 0.85`, `ORB_PACK_MIN_CEIL 30`,
`ORB_PACK_MIN_FLOOR 3`, `ORB_HEAT_STEP 0.15`, `ORB_HEAT_MAX_MULT 3`, `ORB_HEAT_COOL_PER_H 1`.
Estado nuevo: `ext.shop.orbHeat[especie] = { h, at }` (opcional, lo crea la primera compra).

## Números (minutos de ingreso; entre paréntesis, oro)

"5.º paquete" = el quinto comprado seguido de la misma especie (antes k=20, ahora calor 4).

| Partida | ingreso/s | 1.er paquete antes | 1.er paquete ahora | 5.º antes | 5.º ahora | 5 paquetes seguidos antes → ahora |
|---|---|---|---|---|---|---|
| Temprano `post-boss1` | 9 | 33.7 (18 K) | **30** (16 K) | 552 (300 K) | **48** (26 K) | 1 061 → 195 min |
| Medio `late-game` | 1 993 | 33.7 (4.0 M) | **14.9** (1.8 M) | 552 (66 M) | **23.9** (2.9 M) | 1 061 → 97 min |
| Tardío `post-story` | 4 589 | 33.7 (9.3 M) | **13.2** (3.6 M) | 552 (152 M) | **21.1** (5.8 M) | 1 061 → 86 min |
| Post-historia simulado | 9 200 | 33.7 (19 M) | **11.9** (6.5 M) | 552 (305 M) | **19.0** (10 M) | 1 061 → 77 min |
| Jugador con ~1.9 B (≈1 M/s) | 1 000 000 | 33.7 (2.0 B) | **5.9** (350 M) | 552 (33 B) | **9.4** (560 M) | 1 061 → 38 min |
| Isla máxima (12 expansiones) | 25 000 000 | 33.7 (51 B) | **3.6** (5.4 B) | 552 (830 B) | **5.8** (8.7 B) | 1 061 → 24 min |

(Los ingresos de las test-saves salen de cargarlas con el código actual; difieren un poco de los de la auditoría
porque los parches de hábitats de octubre ya están aplicados.)

Metas de estrella, comprando todo de golpe:
- Legendario ★1→2 (40 orbes, 8 paquetes): antes ≈ 6.2 días de ingreso; ahora 12.2 paquetes fríos ≈ **3 h** a media
  aventura, **72 min** con 1 M/s.
- Legendario ★5→6 (320 orbes, 64 paquetes): antes imposible (10²² × ingreso); ahora ≈ 178 paquetes fríos de golpe
  (≈ 17 h de ingreso con 1 M/s) o ≈ 64 si se reparte en varios días (≈ 6 h).

## Por qué así

- **Exponente 0.85 en vez de lineal.** Todas las fuentes de oro pagan en "segundos de ingreso", así que un precio
  lineal en el ingreso nunca deja que el oro acumulado compre más. Con `I^0.85` los minutos de ingreso bajan despacio
  (30 → 15 → 6 → 3.6) conforme la isla crece: crecer se siente, pero un paquete sigue costando minutos de trabajo
  de la isla. El oro sigue valiendo: una estrella alta cuesta horas de ingreso.
- **Techo 30 min, no 20.** La regla del dueño era dejar el juego temprano ±20 %. Un techo de 20 min bajaría el primer
  paquete temprano un 40 %. Con 30 min el temprano baja 11 % y, gracias al exponente, el primer paquete ya está por
  debajo de 20 min desde ~320 oro/s (medio juego). Piso de 3 min para que los orbes nunca sean regalados.
- **Calor que se enfría con el tiempo real, no ventana móvil ni reinicio diario.** Una ventana móvil exige guardar
  una lista de compras con fecha; el calor es un número y una fecha por especie. Reiniciar a medianoche crea una cita
  diaria (tarea), y el dueño no quiere tareas. El calor sube +15 % por paquete, topa en ×3 y baja 1 paquete por
  hora, juegues o no: comprar en racha cuesta más, pero como mucho el triple, y cualquier día que vuelvas está frío.
  Usa el reloj real (no `playMs`) para que "volver mañana" no exija jugar horas. Si el reloj retrocede, el calor no
  crece; se guarda topado (13.3) para que una racha enorme se enfríe en ~13 h, no en días.
- **Calor por especie.** Igual que antes: comprar Canelo no encarece Brote.

## Partidas existentes

- `ext.shop.goldOrbs` se conserva tal cual y mantiene su significado (orbes comprados con oro, de por vida); solo
  deja de mover el precio. `orbHeat` es un campo opcional nuevo dentro de `ext.shop`, lo crea `buyOrbsGold`.
  No cambia la forma de ningún dato → **sin migración ni `SAVE_VERSION` nuevo**.
- No hace falta parche: nada guardado cambia. Quien compró mucho con la curva vieja empieza con todas sus especies
  frías (precio igual o menor que antes, nunca mayor).
- Test "old saves load unchanged": carga las tres test-saves con un `goldOrbs` inflado y verifica que ningún recurso
  baja, orbes y gatos idénticos, `goldOrbs` intacto y que consultar precios no escribe nada.
- NOVEDADES: `2026-10-13-orbes-a-precio-justo` en `src/data/updates.ts`. Texto de la tienda actualizado
  (`panels/shop/tabs/orbs.ts`).

## Pendiente / no tocado

- La vía gemas (8 gemas / 5 orbes, tope compartido con la Prisma: 10 por jefe, 60 de por vida) queda igual.
- Durante la Marea Final (×1000 de ingreso, 3 min) el precio con oro sube ~×350 (antes ×1000). Si molesta, dividir
  `incomePerSec()` entre `mareaMult()` solo para orbes.
