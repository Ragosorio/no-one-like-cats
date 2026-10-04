/**
 * Story-layer reward juice:
 *  - missionPanel(): T2 comic panel sliding in when missions complete (grouped/short in streaks)
 *  - kingdomBanner(): T1 "REINO N" banner
 *  - milestonePoster(): T2 Swiss typographic poster for rule-changing milestones (★)
 */
import { Container, Graphics, Text, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { fmt } from '../../core/format';
import { C, F } from '../theme';
import { Counter, dotGrid, crosses, poster, txt } from '../widgets';
import { icon, IconKind } from '../icons';
import { halftoneTexture, paperTexture } from '../../art/textures';
import { elementFx } from '../../art/catArt';
import { catDef, MissionDef } from '../../data/content';
import type { MissionReward } from '../../state/sys/missions';
import { clean, doneQuip } from './text';
import { LuzternaPortrait, preloadStoryArt } from './portrait';
import { onomatopoeia, sparkles } from '../../fx/juice';
import { destroyDeep, settle } from './tweens';
import { onTapInside } from '../dialog';

const CHAIN: Record<MissionDef['chain'], { name: string; color: number; text: number }> = {
  historia: { name: 'HISTORIA', color: C.pinkHot, text: C.ink },
  capitan: { name: 'CAPITÁN', color: C.megaBlue, text: C.paper },
  criador: { name: 'CRIADOR', color: C.orange, text: C.ink },
  explorador: { name: 'EXPLORADOR', color: C.mint, text: C.ink },
};

export interface DoneItem {
  m: MissionDef;
  r: MissionReward | undefined;
}

function sumRewards(items: DoneItem[]) {
  const out = { gold: 0, food: 0, gems: 0, orbs: 0, orbSpecies: '' };
  for (const it of items) {
    if (!it.r) continue;
    out.gold += it.r.gold;
    out.food += it.r.food;
    out.gems += it.r.gems;
    if (it.r.orbs) {
      out.orbs += it.r.orbs.n;
      out.orbSpecies = it.r.orbs.species;
    }
  }
  return out;
}

function rewardRow(sum: ReturnType<typeof sumRewards>, size = 30, delay = 0.35): Container {
  const row = new Container();
  const entries: [IconKind, number, number?][] = [];
  if (sum.gold) entries.push(['gold', sum.gold]);
  if (sum.food) entries.push(['food', sum.food]);
  if (sum.gems) entries.push(['gem', sum.gems]);
  if (sum.orbs) {
    let tint: number = C.violet;
    try {
      tint = elementFx(catDef(sum.orbSpecies).elements[0]).main;
    } catch {
      /* unknown species */
    }
    entries.push(['orb', sum.orbs, tint]);
  }
  let x = 0;
  entries.forEach(([k, n, tint], i) => {
    const ic = icon(k, size + 6, tint);
    ic.position.set(x + size / 2 + 2, size / 2 + 4);
    const ctr = new Counter({ fontFamily: F.poster, fontSize: size + 4, fill: C.ink }, '+', fmt);
    ctr.position.set(x + size + 12, 0);
    row.addChild(ic, ctr);
    gsap.from(ic.scale, { x: 0, y: 0, duration: 0.3, delay: delay + i * 0.12, ease: 'back.out(3)' });
    gsap.delayedCall(delay + i * 0.12, () => {
      if (ctr.destroyed) return;
      ctr.set(n);
      sfx(k === 'gem' ? 'gem' : 'coin', 1 + i * 0.12);
    });
    // reserve width for the final number
    const probe = txt('+' + fmt(n), { fontFamily: F.poster, fontSize: size + 4 });
    x += size + 12 + probe.width + 30;
    probe.destroy();
  });
  return row;
}

/** T2 comic panel. `short` = streak version. Non-blocking (click to dismiss early). */
export async function missionPanel(layer: Container, items: DoneItem[], short: boolean): Promise<void> {
  if (!items.length) return;
  await preloadStoryArt();
  const sum = sumRewards(items);
  const multi = items.length > 1;
  const c = new Container();
  c.label = 'missionPanel';
  layer.addChild(c);
  const PW = short ? 560 : 660;
  const listH = multi ? Math.min(4, items.length) * 40 + 10 : 0;
  const PH = short ? 150 + listH : 300 + listH;
  const first = items[0].m;
  const ch = CHAIN[first.chain] ?? CHAIN.historia;
  const panel = new Container();
  panel.pivot.set(PW, 0);
  panel.position.set(W - 40, 250);
  panel.rotation = -0.022;
  c.addChild(panel);
  panel.addChild(new Graphics().rect(12, 12, PW, PH).fill(C.ink));
  panel.addChild(new TilingSprite({ texture: paperTexture(C.paper), width: PW, height: PH }));
  const dots = new TilingSprite({ texture: halftoneTexture(ch.color, 11, 2.6), width: PW * 0.45, height: PH });
  dots.alpha = 0.22;
  dots.position.set(PW * 0.55, 0);
  panel.addChild(dots);
  // chain strip
  const strip = new Graphics().rect(0, 0, 18, PH).fill(ch.color);
  panel.addChild(strip);
  panel.addChild(new Graphics().rect(0, 0, PW, PH).stroke({ width: 5, color: C.ink, alignment: 1 }));
  const chainT = txt(multi ? `${items.length} MISIONES` : `${ch.name} · ${first.id}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, letterSpacing: 3 });
  chainT.position.set(36, short ? 14 : 70);
  panel.addChild(chainT);

  let y = short ? 36 : 92;
  if (!short) {
    // big stamp
    const stamp = new Container();
    const st = (fill: number, dx: number, dy: number, a = 1) => {
      const t = txt(multi ? `¡${items.length} MISIONES!` : '¡MISIÓN COMPLETA!', {
        fontFamily: F.comic,
        fontSize: 64,
        fill,
        stroke: { color: C.ink, width: 8, join: 'round' },
        letterSpacing: 2,
      });
      t.position.set(dx, dy);
      t.alpha = a;
      return t;
    };
    const ga = st(C.cyan, -4, 3, 0.8);
    const gb = st(C.pinkHot, 4, -3, 0.8);
    ga.blendMode = 'multiply';
    gb.blendMode = 'multiply';
    stamp.addChild(ga, gb, st(C.yellow, 0, 0));
    stamp.position.set(24, -38);
    stamp.rotation = -0.05;
    panel.addChild(stamp);
    gsap.from(stamp.scale, { x: 2.2, y: 2.2, duration: 0.22, delay: 0.18, ease: 'power4.in' });
    gsap.from(stamp, { alpha: 0, duration: 0.05, delay: 0.18 });
  }
  if (multi) {
    items.slice(0, 4).forEach((it, i) => {
      const chc = CHAIN[it.m.chain] ?? CHAIN.historia;
      const tick = new Graphics().rect(0, 0, 28, 28).fill(chc.color).stroke({ width: 3, color: C.ink });
      tick.moveTo(6, 15).lineTo(12, 21).lineTo(23, 7).stroke({ width: 4, color: C.ink });
      tick.position.set(36, y + 4 + i * 40);
      const t = poster(it.m.title, 30, C.ink);
      t.position.set(76, y + i * 40);
      if (t.width > PW - 110) t.scale.set((PW - 110) / t.width);
      panel.addChild(tick, t);
      gsap.from([tick, t], { alpha: 0, x: '+=30', duration: 0.2, delay: 0.25 + i * 0.08 });
    });
    if (items.length > 4) {
      const more = txt(`+${items.length - 4} más`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink });
      more.position.set(PW - 110, y + 3 * 40 + 8);
      panel.addChild(more);
    }
    y += listH;
  } else {
    const t = poster(first.title, short ? 40 : 54, C.ink, { letterSpacing: -1 });
    t.position.set(36, y);
    if (t.width > PW - 70) t.scale.set((PW - 70) / t.width);
    panel.addChild(t);
    y += short ? 48 : 66;
  }
  const row = rewardRow(sum, short ? 26 : 32, short ? 0.2 : 0.45);
  row.position.set(36, y);
  panel.addChild(row);
  if (!short) {
    // Luzterna's mini caption
    const quip = doneQuip();
    const qb = new Container();
    const qt = txt(quip, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: C.ink, wordWrap: true, wordWrapWidth: PW - 230 });
    qt.position.set(14, 8);
    const qw = Math.min(PW - 186, qt.width + 28);
    qb.addChild(new Graphics().rect(5, 5, qw, qt.height + 16).fill(C.ink).rect(0, 0, qw, qt.height + 16).fill(C.yellow).stroke({ width: 3, color: C.ink, alignment: 1 }), qt);
    qb.position.set(158, PH - qt.height - 34);
    panel.addChild(qb);
    const lz = new LuzternaPortrait(150, 0.9);
    lz.position.set(70, PH + 18);
    panel.addChild(lz);
    gsap.from(qb, { alpha: 0, x: qb.x - 20, duration: 0.25, delay: 0.7 });
  }
  if (!short) sparkles(c, W - 40 - PW / 2, 290, ch.color, 12, 260);
  sfx(short ? 'pop' : 'fanfare');
  gsap.from(panel, { x: W + PW + 60, duration: 0.38, ease: 'back.out(1.3)' });

  const stay = short ? 2.0 : 3.4 + Math.min(1.5, items.length * 0.3);
  // hard cap in real time so a killed tween can never leave the story queue waiting forever
  await settle((res) => {
    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      gsap.killTweensOf(panel);
      gsap.to(panel, {
        x: W + PW + 80,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          destroyDeep(c);
          res();
        },
      });
    };
    // click-through (never eats a click meant for the map/island); tapping it still dismisses it early
    c.eventMode = 'none';
    const off = onTapInside([panel], close);
    c.on('destroyed', off);
    gsap.delayedCall(stay, close);
  }, (stay + 3) * 1000);
  destroyDeep(c);
}

// ------------------------------------------------------------------ kingdom
/** T1: top banner "REINO N" with what it unlocks (non-blocking). */
export function kingdomBanner(layer: Container, kl: number, lines: string[]) {
  const c = new Container();
  c.label = 'klBanner';
  layer.addChild(c);
  const bw = 740;
  const bh = lines.length ? 150 : 110;
  const g = new Graphics();
  g.rect(10, 10, bw, bh).fill(C.ink);
  g.rect(0, 0, bw, bh).fill(C.paper).stroke({ width: 5, color: C.ink, alignment: 1 });
  g.rect(0, 0, 210, bh).fill(C.ink);
  c.addChild(g);
  const dots = new TilingSprite({ texture: halftoneTexture(C.pinkHot, 10, 2.4), width: 240, height: bh });
  dots.alpha = 0.25;
  dots.position.set(bw - 240, 0);
  c.addChild(dots);
  const circle = new Graphics().circle(0, 0, 70).fill(C.pinkHot).stroke({ width: 5, color: C.ink });
  circle.position.set(105, bh / 2);
  const num = poster(String(kl), kl >= 10 ? 76 : 92, C.paper, { stroke: { color: C.ink, width: 6 } });
  num.anchor.set(0.5);
  num.position.set(105, bh / 2 + 2);
  c.addChild(circle, num);
  const k = txt('¡SUBISTE DE NIVEL!', { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.pinkHot, letterSpacing: 4 });
  k.position.set(236, 14);
  const t = poster(`REINO ${kl}`, 66, C.ink, { letterSpacing: -1 });
  t.position.set(234, 30);
  c.addChild(k, t);
  if (lines.length) {
    const s = txt(lines.slice(0, 3).join('  ·  '), { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink, wordWrap: true, wordWrapWidth: bw - 260 });
    s.position.set(236, 104);
    if (s.height > 42) s.scale.set(42 / s.height);
    c.addChild(s);
  }
  c.position.set(W / 2 - bw / 2, -bh - 30);
  c.rotation = -0.01;
  sfx('levelup');
  const tl = gsap.timeline({ onComplete: () => destroyDeep(c) });
  tl.to(c, { y: 26, duration: 0.4, ease: 'back.out(1.6)' })
    .fromTo(circle.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' }, 0.15)
    .fromTo(num.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.25, ease: 'power4.in' }, 0.25)
    .call(() => sparkles(layer, W / 2 - bw / 2 + 105, 26 + bh / 2, C.yellow, 12, 160), [], 0.5)
    .to(c, { y: -bh - 40, duration: 0.3, ease: 'power2.in' }, 3.1);
  // click-through: tapping the banner skips it, the click still reaches the HUD/map below
  c.eventMode = 'none';
  const off = onTapInside([c], () => tl.time() < 3.1 && tl.seek(3.1));
  c.on('destroyed', off);
}

const RULE_QUIPS: [RegExp, string][] = [
  [/recolectar todo/i, 'Se acabó picarle casita por casita. De nada.'],
  [/alimentar hasta/i, 'Mira los números rodar. Qué rico.'],
  [/repiten/i, 'Ya aprendiste a sembrar. Ahora deja de hacerlo tú.'],
  [/x10|max/i, 'Comprar de diez en diez. Como la gente con dinero.'],
  [/banco/i, 'Tu oro trabaja aunque tú no. Como debe ser.'],
  [/mutaci/i, 'Las Resonancias ahora pueden salir… raras. Más raras.'],
  [/herencia/i, 'Los hijos sacan cosas de los papás. Qué miedo.'],
];

function splitMilestone(text: string) {
  const m = text.match(/^([^:]+):\s*(.+)$/);
  let kicker = m ? m[1] : 'HITO';
  let main = m ? m[2] : text;
  let sub = '';
  const p = main.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (p) {
    main = p[1];
    sub = p[2];
  }
  const m2 = main.match(/^([^:]+):\s*(.+)$/);
  if (m2) {
    sub = sub || m2[2];
    main = m2[1];
  }
  kicker = kicker.trim().toUpperCase();
  return { kicker, main: main.trim().toUpperCase(), sub };
}

/** T2: Swiss typographic poster for a rule-changing milestone (click / 4.5 s to dismiss). */
export async function milestonePoster(layer: Container, kl: number, rules: string[]): Promise<void> {
  if (!rules.length) return;
  const root = new Container();
  root.label = 'milestone';
  layer.addChild(root);
  const dim = new Graphics().rect(0, 0, W, H).fill({ color: C.ink, alpha: 0.55 });
  dim.eventMode = 'static';
  root.addChild(dim);
  const PW = 1300;
  const PH = 760;
  const p = new Container();
  p.pivot.set(PW / 2, PH / 2);
  p.position.set(W / 2, H / 2);
  root.addChild(p);
  p.addChild(new Graphics().rect(18, 18, PW, PH).fill(C.ink));
  p.addChild(new TilingSprite({ texture: paperTexture(C.paper), width: PW, height: PH }));
  const circle = new Graphics().circle(0, 0, 330).fill(C.pink);
  circle.position.set(PW - 280, PH - 210);
  const cmask = new Graphics().rect(0, 0, PW, PH).fill(0xffffff);
  circle.mask = cmask;
  p.addChild(cmask);
  const block = new Graphics().rect(0, 0, 120, PH).fill(C.ink);
  const block2 = new Graphics().rect(0, 0, PW, 22).fill(C.pinkHot);
  block2.y = PH - 22;
  const dg = dotGrid(3, 6, 20, 3);
  dg.position.set(PW - 100, 40);
  const cr = crosses();
  cr.position.set(170, PH - 90);
  p.addChild(circle, block, block2, dg, cr);
  p.addChild(new Graphics().rect(0, 0, PW, PH).stroke({ width: 6, color: C.ink, alignment: 1 }));
  const vert = txt(`REINO ${kl} · CAMBIA LAS REGLAS · NO ONE LIKE CATS`, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.paper, letterSpacing: 4 });
  vert.rotation = -Math.PI / 2;
  vert.position.set(46, PH - 30);
  p.addChild(vert);
  const star = new Graphics().star(0, 0, 5, 80, 36).fill(C.yellow).stroke({ width: 6, color: C.ink });
  star.position.set(260, 150);
  p.addChild(star);
  const head = txt(`REINO ${kl}`, { fontFamily: F.poster, fontSize: 40, fill: C.pinkHot });
  head.position.set(370, 92);
  const head2 = txt('ESTO CAMBIA LAS REGLAS', { fontFamily: F.ui, fontWeight: '700', fontSize: 24, fill: C.ink, letterSpacing: 4 });
  head2.position.set(372, 146);
  p.addChild(head, head2);
  let y = 230;
  const mains: Text[] = [];
  for (const r of rules.slice(0, 3)) {
    const s = splitMilestone(r);
    const k = txt(`★ ${s.kicker}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 26, fill: C.ink, letterSpacing: 3 });
    k.position.set(180, y);
    const size = rules.length > 1 ? 104 : 168;
    const m = poster(s.main, size, C.ink, { letterSpacing: -4, lineHeight: size * 0.95 });
    m.position.set(172, y + 26);
    if (m.width > PW - 240) m.scale.set((PW - 240) / m.width);
    p.addChild(k, m);
    mains.push(m);
    y += 32 + m.height + 6;
    if (s.sub) {
      const sb = txt(clean(s.sub), { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink, wordWrap: true, wordWrapWidth: PW - 300 });
      sb.position.set(182, y);
      p.addChild(sb);
      y += sb.height + 18;
    }
    y += 10;
  }
  const quip = RULE_QUIPS.find(([re]) => rules.some((r) => re.test(r)))?.[1] ?? 'Ya aprendiste esto. Toma: ahora preocúpate por cosas más interesantes.';
  const qt = txt(`LUZTERNA: ${clean(quip)}`, { fontFamily: F.brush, fontSize: 30, fill: C.ink, wordWrap: true, wordWrapWidth: 700 });
  qt.position.set(180, PH - qt.height - 52);
  p.addChild(qt);

  sfx('drumroll');
  const reduce = settings.reduceMotion;
  p.scale.set(reduce ? 1 : 0.6);
  p.alpha = 0;
  dim.alpha = 0;
  await settle((res) =>
    gsap
      .timeline({ onComplete: res })
      .to(dim, { alpha: 1, duration: 0.2 }, 0)
      .to(p, { alpha: 1, duration: 0.1 }, 0.05)
      .to(p.scale, { x: 1, y: 1, duration: 0.35, ease: 'back.out(1.8)' }, 0.05)
      .from(mains, { x: '-=600', duration: 0.35, stagger: 0.12, ease: 'power4.out' }, 0.25)
      .from(star.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(3)' }, 0.4)
      .call(() => {
        sfx('fanfare');
        onomatopoeia(root, W / 2 + 380, H / 2 - 250, '¡NUEVA REGLA!', { size: 90, color: C.yellow, dur: 1.2 });
      }),
    1500,
  );
  gsap.to(star, { rotation: Math.PI * 2, duration: 8, repeat: -1, ease: 'none' });
  await settle((fin) => {
    dim.on('pointertap', fin);
    p.eventMode = 'static';
    p.on('pointertap', fin);
    gsap.delayedCall(5, fin);
  }, 9000);
  if (!root.destroyed) root.eventMode = 'none';
  await settle((done) => gsap.to(root, { alpha: 0, duration: 0.25, onComplete: done }), 700);
  gsap.killTweensOf(star);
  destroyDeep(root);
}
