/** Errand results poster (shown over the map after an errand battle). */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { Button, poster, txt } from '../../ui/widgets';
import { C, F } from '../../ui/theme';
import { iconText } from '../../ui/elementIcon';
import type { BattleResult } from '../../scenes/BattleScene';
import { ERRAND_BY_ID, ERRAND_RULES, ErrandLoot, lastRankUps } from '../../state/sys/campaign';
import { CAT_BY_ID } from '../../data/content';
import { resChip, stamp } from '../campaign/common';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import { sparkles } from '../../fx/juice';

export function showErrandResults(id: string, r: BattleResult, loot: ErrandLoot) {
  const e = ERRAND_BY_ID.get(id);
  const rule = ERRAND_RULES[id];
  if (!e) return;
  const won = r.won;
  const m = new Modal(won ? 'Encargo cumplido' : 'Encargo fallido', 1000, 660, { band: won ? rule?.color ?? C.yellow : C.inkBlue, bandText: won ? C.ink : C.paper });
  const b = m.body;
  const title = poster(e.name.toUpperCase(), 64, C.ink);
  title.position.set(0, 0);
  b.addChild(title);
  const s = stamp(won ? (loot.first ? '¡PAGADO!' : 'OTRA VEZ, BIEN') : 'NI MODO', won ? C.red : C.inkBlue, 50, -0.12);
  s.position.set(m.innerW - 170, 60);
  b.addChild(s);
  const sub = iconText(won ? (loot.first ? 'Premio del cartel cobrado. Y de propina, el botín de siempre.' : 'El cartel ya estaba cobrado: te llevas el botín normal.') : 'Te llevas un poco de chatarra y la lección. Prueba otro barco o tripulación.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink }, { wrap: 820 });
  sub.position.set(0, 90);
  b.addChild(sub);
  const rows = new Container();
  let x = 0;
  let y = 0;
  const add = (n: Container) => {
    if (x + n.width > 900) {
      x = 0;
      y += 56;
    }
    n.position.set(x, y);
    rows.addChild(n);
    x += n.width + 30;
  };
  if (loot.gold) add(resChip('gold', fmt(loot.gold), true, 40));
  if (loot.scrap) add(resChip('scrap', `${loot.scrap}`, true, 40));
  if (loot.blueprint) add(resChip('blueprint', `${loot.blueprint}`, true, 40));
  if (loot.prisma) add(resChip('orb', `${loot.prisma} Prisma`, true, 40, 0xff7ab8));
  if (loot.crystals) add(resChip('crystal', `${loot.crystals.n}`, true, 40));
  if (loot.orbs) add(resChip('orb', `${loot.orbs.n} de ${CAT_BY_ID.get(loot.orbs.species)?.name ?? 'gato'}`, true, 40));
  if (loot.gems) add(resChip('gem', `${loot.gems}`, true, 40));
  rows.position.set(0, 170);
  b.addChild(rows);
  if (lastRankUps.length) {
    const g = new Graphics().rect(0, 0, 900, 50 + lastRankUps.length * 34).fill(C.ink);
    g.position.set(0, 320);
    b.addChild(g);
    const h = poster('¡RANGO K.O. ARRIBA!', 30, C.yellow);
    h.position.set(16, 326);
    b.addChild(h);
    lastRankUps.forEach((u, i) => {
      const t = txt(`${u.from} → ${u.to}  (+2 orbes)`, { fontFamily: F.poster, fontSize: 24, fill: C.paper });
      t.position.set(16, 366 + i * 34);
      b.addChild(t);
    });
  }
  const again = new Button('TABLERO', async () => {
    m.close();
    const { openErrands } = await import('../Errands');
    openErrands();
  }, { w: 260, h: 76, size: 32, color: C.yellow });
  again.position.set(m.innerW - 540, m.innerH - 90);
  const ok = new Button('MAPA', () => m.close(), { w: 240, h: 76, size: 32, color: C.mint });
  ok.position.set(m.innerW - 250, m.innerH - 90);
  b.addChild(again, ok);
  m.open();
  sfx(won ? 'fanfare' : 'sting');
  if (won) {
    sparkles(m.panel, m.w / 2, 200, C.yellow, 24, 400);
    gsap.from(s.scale, { x: 3, y: 3, duration: 0.3, ease: 'back.out(2)', delay: 0.2 });
  }
}
