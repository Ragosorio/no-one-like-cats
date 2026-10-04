/**
 * Tablero de Encargos (GDD 2.9.13): wanted-poster board pinned on cork. Each errand is a lateral battle
 * with a ship/crew restriction ("barcos distintos para misiones distintas") and a one-time poster reward.
 * Click a poster → detail sheet (restrictions vs your current ship/crew, estimate, reward, ¡ZARPAR!).
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { Modal } from '../../ui/modal';
import { Button, txt, poster } from '../../ui/widgets';
import { C, F } from '../../ui/theme';
import { iconText } from '../../ui/elementIcon';
import { halftoneTexture } from '../../art/textures';
import { G } from '../../state/game';
import { ZONES } from '../../data/content';
import { cat as getCat } from '../../state/sys/cats';
import { setActiveShip, shipName, balanceShip } from '../../state/sys/ship';
import {
  ERRAND_BY_ID,
  ERRAND_RULES,
  ErrandDef,
  ErrandRule,
  buildErrand,
  errandBlock,
  errandBoard,
  errandCrew,
  errandWinChance,
} from '../../state/sys/campaign';
import { clipping, stamp, resChip, catPortrait, ensureCats, chanceColor, hash1 } from '../campaign/common';
import { shipPreview } from '../campaign/shipArt';
import { sfx } from '../../core/audio';

const CORK = 0x9a6b3f;

/** reward chips for a poster rule */
function rewardRow(rule: ErrandRule, size = 24): Container {
  const c = new Container();
  const r = rule.reward;
  let x = 0;
  const add = (n: Container) => {
    n.x = x;
    c.addChild(n);
    x += n.width + 14;
  };
  if (r.blueprint) add(resChip('blueprint', `x${r.blueprint}`, true, size));
  if (r.mvpOrbs) add(resChip('orb', `x${r.mvpOrbs} MVP`, true, size));
  if (r.prisma) add(resChip('orb', `x${r.prisma} PRISMA`, true, size, 0xff7ab8));
  if (r.crystals) add(resChip('crystal', `x${r.crystals.n}`, true, size));
  if (r.scrap) add(resChip('scrap', `x${r.scrap}`, true, size));
  if (r.gems) add(resChip('gem', `x${r.gems}`, true, size));
  return c;
}

function restrictionText(e: ErrandDef, rule: ErrandRule) {
  const parts: string[] = [];
  if (rule.ships) parts.push(`SOLO ${rule.ships.map((s) => shipName(s).toUpperCase()).join(' O ')}`);
  if (rule.maxCats) parts.push(`SOLO ${rule.maxCats} GATOS`);
  if (rule.noFire) parts.push('SIN GATOS {fire}');
  if (rule.wetAll) parts.push('TODO MOJADO');
  if (rule.enemyArmor) parts.push('BLINDAJE x2');
  if (rule.noBubble) parts.push('SIN BURBUJA');
  if (rule.noPreview) parts.push('SIN VISTA PREVIA');
  if (rule.scrapMul) parts.push(`CHATARRA x${rule.scrapMul}`);
  return parts.length ? parts.join(' · ') : e.restriction;
}

export function openErrandBoard() {
  const m = new Modal('Tablero de encargos', 1640, 900, { band: C.ink, subtitle: 'Barcos distintos para misiones distintas' });
  const b = m.body;
  const W0 = m.innerW;
  const H0 = m.innerH;
  // cork
  const cork = new Graphics().rect(-10, -10, W0 + 20, H0 + 10).fill(CORK);
  const dots = new TilingSprite({ texture: halftoneTexture(0x5a3a1c, 9, 1.8), width: W0 + 20, height: H0 + 10 });
  dots.position.set(-10, -10);
  dots.alpha = 0.55;
  const frame = new Graphics().rect(-10, -10, W0 + 20, H0 + 10).stroke({ width: 12, color: 0x5a3a1c });
  b.addChild(cork, dots, frame);
  const list = errandBoard();
  const crewSpecies = [...new Set(G.s.cats.map((c) => c.species))];
  void ensureCats(crewSpecies);
  const cols = 4;
  const pw = 360;
  const ph = 340;
  list.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 20 + col * (pw + 30) + (row === 1 ? (pw + 30) / 2 : 0);
    const y = 12 + row * (ph + 22);
    const p = posterCard(it.def, it.rule, it.unlocked, it.done, i);
    p.position.set(x + pw / 2, y + ph / 2);
    p.rotation = (hash1(i * 7 + 3) - 0.5) * 0.07;
    b.addChild(p);
    gsap.from(p, { y: p.y - 40, alpha: 0, duration: 0.3, delay: i * 0.05, ease: 'back.out(2)' });
    if (it.unlocked) {
      p.eventMode = 'static';
      p.cursor = 'pointer';
      p.on('pointerover', () => gsap.to(p.scale, { x: 1.04, y: 1.04, duration: 0.15 }));
      p.on('pointerout', () => gsap.to(p.scale, { x: 1, y: 1, duration: 0.15 }));
      p.on('pointertap', () => {
        sfx('paper');
        openErrandDetail(it.def.id, m);
      });
    }
  });
  if (!list.some((x) => x.unlocked)) {
    const t = poster('GANA LA ETAPA 2-3 PARA TU PRIMER ENCARGO', 40, C.paper, { stroke: { color: C.ink, width: 6 } });
    t.anchor.set(0.5);
    t.position.set(W0 / 2, H0 - 40);
    b.addChild(t);
  }
  m.open();
}

/** one wanted poster (centered at 0,0) */
function posterCard(e: ErrandDef, rule: ErrandRule | undefined, unlocked: boolean, done: boolean, seed: number): Container {
  const c = new Container();
  const w = 360;
  const h = 340;
  const paper = clipping(w, h, { seed: seed + 11, color: unlocked ? 0xefe4cb : 0xc9bfa9 });
  paper.position.set(-w / 2, -h / 2);
  c.addChild(paper);
  const band = new Graphics().rect(-w / 2 + 14, -h / 2 + 14, w - 28, 50).fill(unlocked ? rule?.color ?? C.yellow : 0x8a8378).stroke({ width: 4, color: C.ink });
  const tag = poster(unlocked ? 'ENCARGO' : 'ENCARGO ???', 36, C.ink);
  tag.anchor.set(0.5);
  tag.position.set(0, -h / 2 + 39);
  c.addChild(band, tag);
  // the target ship (ink silhouette while locked)
  if (unlocked) {
    try {
      const spec = buildErrand(e.id, () => undefined);
      const prev = shipPreview(spec.enemy.blueprint, { maxW: w - 60, maxH: 120, flip: true, style: spec.enemyStyle, animate: false });
      prev.position.set(-prev.hullW * prev.k * 0.5 - prev.ox, -h / 2 + 64);
      c.addChild(prev);
    } catch (err) {
      console.warn('[errands] preview failed', err);
    }
  } else {
    const q = poster('?', 90, 0x8a8378);
    q.anchor.set(0.5);
    q.position.set(0, -h / 2 + 118);
    c.addChild(q);
  }
  const name = poster((unlocked ? e.name : '???').toUpperCase(), 38, C.ink);
  name.anchor.set(0.5, 0);
  name.position.set(0, -h / 2 + 184);
  if (name.width > w - 40) name.scale.set((w - 40) / name.width);
  if (unlocked) c.addChild(name);
  else name.destroy();
  const zone = txt(`ZONA ${e.zone} · ${ZONES[e.zone - 1]?.name.toUpperCase() ?? ''} · TRAS ${e.zone}-${e.afterStage}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: 0x5a4a30 });
  zone.anchor.set(0.5, 0);
  zone.position.set(0, -h / 2 + 226);
  c.addChild(zone);
  const strip = new Graphics().rect(-w / 2 + 14, -h / 2 + 248, w - 28, 40).fill(C.ink);
  c.addChild(strip);
  const rt = iconText(unlocked && rule ? restrictionText(e, rule) : 'RESTRICCIÓN DESCONOCIDA', { fontFamily: F.poster, fontSize: 18, fill: C.yellow }, { wrap: w - 50 });
  rt.position.set(-w / 2 + 24, -h / 2 + 256);
  if (rt.height > 34) rt.scale.set(34 / rt.height);
  c.addChild(rt);
  if (unlocked && rule) {
    const rw = rewardRow(rule, 22);
    rw.position.set(-rw.width / 2, -h / 2 + 300);
    c.addChild(rw);
  }
  // pushpin
  const pin = new Graphics().circle(0, 0, 13).fill(C.red).stroke({ width: 3, color: C.ink }).circle(-4, -4, 4).fill({ color: 0xffffff, alpha: 0.7 });
  pin.position.set(0, -h / 2 - 2);
  c.addChild(pin);
  if (done) {
    const s = stamp('¡CUMPLIDO!', C.red, 54, -0.18);
    s.position.set(0, 10);
    c.addChild(s);
  } else if (!unlocked) {
    const s = stamp(`GANA LA ${e.zone}-${e.afterStage}`, 0x7a2a1a, 30, 0.1);
    s.position.set(0, -h / 2 + 190);
    c.addChild(s);
  }
  return c;
}

/** detail sheet for one errand */
export function openErrandDetail(id: string, board?: Modal) {
  const e = ERRAND_BY_ID.get(id)!;
  const rule = ERRAND_RULES[id];
  if (!e || !rule) return;
  const m = new Modal(`Encargo: ${e.name}`, 1360, 780, { band: rule.color, bandText: C.ink });
  const draw = () => {
    m.body.removeChildren().forEach((c) => c.destroy({ children: true }));
    const b = m.body;
    // left: target + captain line
    const left = clipping(560, 600, { seed: 77, color: 0xefe4cb });
    b.addChild(left);
    try {
      const spec = buildErrand(id, () => undefined);
      const prev = shipPreview(spec.enemy.blueprint, { maxW: 520, maxH: 280, flip: true, style: spec.enemyStyle });
      prev.position.set(20, 20);
      b.addChild(prev);
    } catch (err) {
      console.warn('[errands] preview failed', err);
    }
    const enemy = poster(rule.enemy.toUpperCase(), 40, C.ink);
    enemy.position.set(24, 320);
    if (enemy.width > 520) enemy.scale.set(520 / enemy.width);
    const capt = txt(`${rule.captain}:`, { fontFamily: F.poster, fontSize: 22, fill: C.red });
    capt.position.set(24, 376);
    const line = txt(`“${rule.line}”`, { fontFamily: F.comic, fontSize: 28, fill: C.ink, wordWrap: true, wordWrapWidth: 510 });
    line.position.set(24, 404);
    const tagline = iconText(rule.tagline, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: 0x3d3020 }, { wrap: 510 });
    tagline.position.set(24, 500);
    b.addChild(enemy, capt, line, tagline);
    // right: restrictions vs. your fleet
    const x0 = 600;
    const head = poster('RESTRICCIONES', 34, C.ink);
    head.position.set(x0, 0);
    b.addChild(head);
    const ship = G.s.ship.active;
    const shipOk = !rule.ships || rule.ships.includes(ship);
    let y = 50;
    const row = (ok: boolean, text: string) => {
      const g = new Graphics().rect(0, 0, 700, 46).fill(ok ? 0x1f3a2a : 0x4e0000).stroke({ width: 3, color: C.ink });
      const mark = new Graphics();
      if (ok) mark.moveTo(14, 24).lineTo(24, 34).lineTo(40, 12).stroke({ width: 6, color: C.mint, cap: 'round' });
      else mark.moveTo(14, 12).lineTo(38, 34).moveTo(38, 12).lineTo(14, 34).stroke({ width: 6, color: C.pink, cap: 'round' });
      const t = iconText(text, { fontFamily: F.poster, fontSize: 24, fill: C.paper }, { wrap: 640 });
      t.position.set(54, 8);
      const r = new Container();
      r.addChild(g, mark, t);
      r.position.set(x0, y);
      b.addChild(r);
      y += 56;
    };
    if (rule.ships) row(shipOk, `BARCO: ${rule.ships.map((s) => shipName(s).toUpperCase()).join(' O ')} (llevas ${shipName(ship)})`);
    if (rule.maxCats) row(true, `SOLO ${rule.maxCats} GATOS A BORDO`);
    if (rule.noFire) row(true, 'SIN GATOS {fire}: se quedan en casa');
    if (rule.wetAll) row(true, 'TODO ESTÁ MOJADO SIEMPRE: {storm} conduce, {fire} hace vapor');
    if (rule.enemyArmor) row(true, 'ENEMIGO CON BLINDAJE x2');
    if (rule.noBubble) row(true, 'TU BURBUJA NO FUNCIONA');
    if (rule.noPreview) row(true, 'SIN VISTA PREVIA DE TRAYECTORIA');
    // crew that would sail
    const uids = errandCrew(id);
    const ct = poster('VAN A BORDO', 28, C.ink);
    ct.position.set(x0, y + 6);
    b.addChild(ct);
    uids.forEach((u, i) => {
      const cat = getCat(u);
      if (!cat) return;
      const pt = catPortrait(cat.species, 78);
      pt.position.set(x0 + 44 + i * 92, y + 92);
      b.addChild(pt);
      const nm = txt(cat.name, { fontFamily: F.ui, fontWeight: '700', fontSize: 14, fill: C.ink });
      nm.anchor.set(0.5, 0);
      nm.position.set(pt.x, pt.y + 42);
      b.addChild(nm);
    });
    y += 166;
    // estimate + reward
    const p = errandWinChance(id);
    const est = poster(`ESTIMACIÓN ${Math.round(p * 100)}%`, 40, chanceColor(p), { stroke: { color: C.ink, width: 6 } });
    est.position.set(x0, y);
    b.addChild(est);
    const rwT = poster(G.s.errands?.done.includes(id) ? 'PREMIO (YA COBRADO)' : 'PREMIO DEL CARTEL', 26, C.ink);
    rwT.position.set(x0, y + 58);
    const rw = rewardRow(rule, 28);
    rw.position.set(x0, y + 94);
    b.addChild(rwT, rw);
    // actions
    const block = errandBlock(id);
    const by = m.innerH - 80;
    if (!shipOk && rule.ships) {
      const owned = rule.ships.filter((s) => G.s.ship.owned.includes(s));
      if (owned.length) {
        owned.forEach((s, i) => {
          const btn = new Button(`CAMBIAR A ${shipName(s).toUpperCase()}`, () => {
            setActiveShip(s);
            sfx('levelup');
            draw();
          }, { w: 340, h: 70, size: 26, color: C.yellow });
          btn.position.set(x0 + i * 356, by);
          b.addChild(btn);
        });
      } else {
        const t = txt(`Necesitas ${rule.ships.map((s) => `${shipName(s)} (${balanceShip(s)?.crew ?? '?'} tripulantes)`).join(' o ')}: cómpralo en el Astillero.`, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.red, wordWrap: true, wordWrapWidth: 420 });
        t.position.set(x0, by);
        b.addChild(t);
      }
    }
    const go = new Button('¡ZARPAR!', async () => {
      if (errandBlock(id)) return;
      m.close();
      board?.close();
      const { startErrandBattle } = await import('../../app/battleFlow');
      await startErrandBattle(id);
    }, { w: 260, h: 84, size: 42, color: C.pink, disabled: !!block });
    go.position.set(m.innerW - 260, by - 8);
    b.addChild(go);
    if (block && shipOk) {
      const t = txt(block, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.red });
      t.anchor.set(1, 0);
      t.position.set(m.innerW, by - 36);
      b.addChild(t);
    }
  };
  draw();
  m.open();
}

