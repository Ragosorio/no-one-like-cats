/**
 * FLOTA column: every ship with its illustration (baked anime renderer), role, "RECOMENDADO PARA",
 * crew/cannon/shield/artifact counts and the obvious action (ZARPA / USAR ESTE / COMPRAR / requisito).
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt, Button } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { fmt } from '../../core/format';
import { G } from '../../state/game';
import { BAL } from '../../state/econ';
import { balanceShip, crew, crewSize, layoutOf, layoutSig, mk, playerBlueprint, shipName, shipRecommendedFor, shipRole, shipUnlocked, shipUnlockText } from '../../state/sys/ship';
import { artifactSlots } from '../../state/sys/gear';
import { P, label, stamp, clearChildren } from '../campaign/common';
import { shipThumb, moduleGlyph } from './art';

export interface FleetOpts {
  w: number;
  cardH: number;
  onActivate: (id: string) => void;
  onBuy: (id: string) => void;
}

/** short role (first sentence of the content role) */
function shortRole(id: string) {
  const r = shipRole(id);
  const cut = r.split(/[.:]/)[0];
  return cut.length > 4 ? cut : r;
}

export function buildFleet(root: Container, o: FleetOpts) {
  clearChildren(root);
  const head = label('FLOTA · UN BARCO PARA CADA PLEITO', 14, P.blue, { letterSpacing: 2 });
  root.addChild(head);
  const ships = BAL.ship.ships;
  ships.forEach((bs, i) => {
    const c = new Container();
    c.position.set(0, 26 + i * (o.cardH + 10));
    root.addChild(c);
    buildCard(c, bs.id, o);
  });
}

function buildCard(c: Container, id: string, o: FleetOpts) {
  const w = o.w;
  const h = o.cardH;
  const bs = balanceShip(id);
  const owned = G.s.ship.owned.includes(id);
  const active = G.s.ship.active === id;
  const unlocked = shipUnlocked(id);
  const fill = active ? C.ink : owned ? C.paper : unlocked ? 0xf6e7bf : 0xcfc8b8;
  const fg = active ? C.paper : C.ink;
  const sub = active ? C.mint : P.blue;
  c.addChild(new Graphics().rect(6, 6, w, h).fill(C.ink).rect(0, 0, w, h).fill(fill).stroke({ width: active ? 4 : 3, color: active ? C.pinkHot : C.ink }));
  // illustration (right)
  const tw = 168;
  const th = 92;
  const hullMk = Math.max(1, mk('hull'));
  const bp = playerBlueprint(id).bp;
  const key = `${id}|${hullMk}|${layoutSig(layoutOf(id))}|${G.s.ship.mk.shield}`;
  const art = shipThumb(key, bp, hullMk, tw, th, unlocked || owned ? {} : { silhouette: 0x6f6a5e });
  art.position.set(w - tw - 6, 6);
  c.addChild(art);
  if (active) {
    // little wave under the active one
    const wave = new Graphics();
    for (let x = w - tw - 6; x < w - 6; x += 14) wave.moveTo(x, th + 6).quadraticCurveTo(x + 7, th + 1, x + 14, th + 6);
    wave.stroke({ width: 2, color: C.mint });
    c.addChild(wave);
  }
  const nm = txt(shipName(id).toUpperCase(), { fontFamily: F.poster, fontSize: 28, fill: fg });
  nm.position.set(12, 4);
  c.addChild(nm);
  const role = label(`${shortRole(id)} · poder ×${bs.mult.toFixed(2)}`, 12, sub, { wordWrap: true, wordWrapWidth: w - tw - 30, fontWeight: '700', lineHeight: 14 });
  role.position.set(12, 42);
  c.addChild(role);
  // counts row: paws (crew) · cannons · shields · artifacts
  const sl = bs.slots as Record<string, number>;
  const counts: [string, number][] = [
    ['catroom', bs.crew],
    ['cannon', sl.weapon],
    ['shield', sl.shield],
  ];
  let cx = 12;
  const cy = 82;
  for (const [k, n] of counts) {
    if (!n && k === 'shield') continue;
    const g = moduleGlyph(k, 20, fg);
    g.position.set(cx + 10, cy + 10);
    const t = txt(`×${n}`, { fontFamily: F.bebas, fontSize: 20, fill: fg });
    t.position.set(cx + 22, cy - 1);
    c.addChild(g, t);
    cx += 22 + t.width + 10;
  }
  const arts = artifactSlots(id);
  if (arts) {
    const d = new Graphics().poly([cx + 8, cy + 1, cx + 15, cy + 10, cx + 8, cy + 19, cx + 1, cy + 10]).fill(active ? C.yellow : C.gold).stroke({ width: 2, color: fg });
    const t = txt(`×${arts}`, { fontFamily: F.bebas, fontSize: 20, fill: active ? C.yellow : C.gold });
    t.position.set(cx + 18, cy - 1);
    c.addChild(d, t);
    cx += 18 + t.width + 10;
  }
  // recommended for (highlighter) — this is what Encargos ask for
  const rec = shipRecommendedFor(id);
  if (rec && rec !== '—') {
    const ry = 108;
    const hl = new Graphics().rect(10, ry + 1, 104, 17).fill(active ? C.pinkHot : C.yellow);
    hl.rotation = -0.012;
    const rl = txt('RECOMENDADO', { fontFamily: F.bebas, fontSize: 17, fill: C.ink, letterSpacing: 1 });
    rl.position.set(14, ry);
    const rt = label(rec, 11.5, fg, { wordWrap: true, wordWrapWidth: w - 168, fontWeight: '700', lineHeight: 13 });
    rt.position.set(12, ry + 21);
    c.addChild(hl, rl, rt);
  }
  // action
  if (active) {
    const s = stamp('¡ZARPA!', C.pinkHot, 24, -0.1);
    s.position.set(w - 78, h - 28);
    c.addChild(s);
    const n = crew(id).length;
    if (n < crewSize(id)) {
      const warn = txt(`${crewSize(id) - n} CAMAROTE${crewSize(id) - n > 1 ? 'S' : ''} VACÍO${crewSize(id) - n > 1 ? 'S' : ''}`, { fontFamily: F.bebas, fontSize: 15, fill: C.paper, letterSpacing: 1 });
      const pill = new Graphics().roundRect(0, 0, warn.width + 12, 20, 4).fill(C.red).stroke({ width: 2, color: C.ink });
      const pc = new Container();
      warn.position.set(6, 1);
      pc.addChild(pill, warn);
      pc.position.set(w - pc.width - 10, 4);
      c.addChild(pc);
    }
  } else if (owned) {
    const btn = new Button('USAR ESTE', () => o.onActivate(id), { w: 132, h: 40, size: 21, color: C.mint });
    btn.position.set(w - 144, h - 50);
    c.addChild(btn);
  } else if (unlocked) {
    const can = G.s.gold >= bs.cost;
    const btn = new Button(`COMPRAR ${fmt(bs.cost)}`, () => o.onBuy(id), { w: 140, h: 40, size: 19, color: C.yellow, disabled: !can });
    btn.position.set(w - 152, h - 50);
    const gi = icon('gold', 22);
    gi.position.set(w - 162, h - 30);
    c.addChild(btn, gi);
    if (can) gsap.to(btn.scale, { x: 1.04, y: 1.04, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  } else {
    const lk = icon('lock', 24);
    lk.position.set(w - 130, h - 26);
    const lt = txt(shipUnlockText(id).toUpperCase(), { fontFamily: F.poster, fontSize: 22, fill: C.ink });
    lt.position.set(w - 112, h - 41);
    c.addChild(lk, lt);
    c.alpha = 0.85;
  }
}
