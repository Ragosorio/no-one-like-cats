/**
 * Príncipe Bigotón: the prince's universe. A royal night on a far planet; a green scouter lens locks on him and the power
 * reading climbs and climbs — «¡MÁS DE 8000!» — the lens cracks and explodes; violet lightning crackles around him, his
 * royal seal turns behind him, a gleam runs on his armor. Payoff: a violet beam across the screen; ¡SOY EL PRÍNCIPE!
 * (Not Super Siamés: cold night, electric violet, a HUD and a beam — no gold flame, no wasteland, no scream.)
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { poster, txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, CHEER, alive, backlight, bolt, burst, cheer, every, flashOf, later, score, word } from './kit';
import { cardLoop, hideDisc, segText } from './kitA';

const VIOLET = 0xa45cff;
const VIOLET_HI = 0xe2c6ff;
const ROYAL = 0x2a3d8c;
const LENS = 0x5dff7e;
const STEEL = 0xd8deea;

/** the planet: an indigo night, stars, a ringed planet, two moons, crystal spires on the horizon */
function planet(w = W, h = H, s = 1): Container {
  const k = new Container();
  k.addChild(new Graphics().rect(0, 0, w, h).fill(0x0b0a26));
  const sky = new Graphics();
  const bands = [0x0e0c30, 0x141039, 0x1b1446, 0x251a57, 0x33216a, 0x452a7d];
  bands.forEach((b, i) => sky.rect(0, (i * h * 0.72) / bands.length, w, (h * 0.72) / bands.length + 2).fill(b));
  k.addChild(sky);
  const stars = new Graphics();
  for (let i = 0; i < 90; i++) stars.circle((i * 211) % w, (i * 137) % (h * 0.62), ((i * 7) % 3) * 0.7 * s + 0.8 * s).fill({ color: 0xffffff, alpha: 0.35 + ((i * 13) % 6) / 10 });
  k.addChild(stars);
  // the ringed planet (upper left) and two small moons
  const pl = new Graphics();
  const px = w * 0.16;
  const py = h * 0.2;
  const pr = 130 * s;
  pl.ellipse(px, py, pr * 2.1, pr * 0.42).stroke({ width: 10 * s, color: 0xb6a2e8, alpha: 0.5 });
  pl.circle(px, py, pr).fill(0x8f7bd6);
  pl.circle(px + pr * 0.3, py - pr * 0.25, pr * 0.8).fill({ color: 0xb3a2ee, alpha: 0.45 });
  pl.ellipse(px - pr * 0.2, py + pr * 0.35, pr * 0.5, pr * 0.12).fill({ color: 0x6c5ab8, alpha: 0.6 });
  // the front half of the ring over the planet
  pl.moveTo(px - pr * 2.1, py).bezierCurveTo(px - pr * 1.2, py + pr * 0.6, px + pr * 1.2, py + pr * 0.6, px + pr * 2.1, py).stroke({ width: 10 * s, color: 0xd9ccff, alpha: 0.85 });
  pl.circle(w * 0.58, h * 0.1, 26 * s).fill(0xcfc4f5).circle(w * 0.58 + 8 * s, h * 0.1 - 6 * s, 22 * s).fill(0x1b1446);
  pl.circle(w * 0.36, h * 0.08, 12 * s).fill(0xe6defc);
  k.addChild(pl);
  // the horizon: crystal spires and rock, then the ground
  const hz = h * 0.72;
  const rock = new Graphics();
  const pts: number[] = [0, hz];
  let x = 0;
  let i = 0;
  while (x < w) {
    const sp = (40 + ((i * 53) % 70)) * s;
    const tall = (i % 5 === 2 ? 190 : i % 3 === 0 ? 110 : 50 + ((i * 31) % 40)) * s;
    pts.push(x + sp * 0.35, hz - tall, x + sp * 0.6, hz - tall * 0.8, x + sp, hz - 10 * s);
    x += sp;
    i++;
  }
  pts.push(w, hz, w, h, 0, h);
  rock.poly(pts).fill(0x1a0f33);
  k.addChild(rock);
  const ground = new Graphics().rect(0, hz, w, h - hz).fill(0x221340);
  for (let j = 1; j < 8; j++) ground.moveTo(0, hz + j * j * 5 * s).lineTo(w, hz + j * j * 5 * s).stroke({ width: 2 * s, color: 0x3a2366, alpha: 0.6 });
  k.addChild(ground);
  return k;
}

/** the royal seal (it replaces the pink disc): royal blue, a silver rim of crown points, a mustache at its foot */
function seal(size: number): Graphics {
  // drawn at the reveal's size (300) and scaled, so the crown and the mustache keep their proportions on a card
  const r = 300;
  const g = new Graphics();
  g.scale.set(size / 300);
  g.circle(0, 0, r + 26).fill({ color: VIOLET, alpha: 0.18 });
  // a crown rim: tall points tipped with jewels, short points between
  const N = 10;
  const pts: number[] = [];
  for (let i = 0; i < N * 4; i++) {
    const a = (i / (N * 4)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 4 === 0 ? r * 1.22 : i % 4 === 2 ? r * 1.06 : r * 0.92;
    pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.poly(pts).fill(STEEL).stroke({ width: 5, color: C.ink, join: 'round' });
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    g.circle(Math.cos(a) * r * 1.24, Math.sin(a) * r * 1.24, 13).fill(i % 2 ? VIOLET : 0xffffff).stroke({ width: 4, color: C.ink });
  }
  g.circle(0, 0, r * 0.88).fill(ROYAL).stroke({ width: 5, color: C.ink });
  g.circle(0, 0, r * 0.8).stroke({ width: 4, color: STEEL, alpha: 0.7 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.circle(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84, 7).fill(STEEL);
  }
  // the crown on top and the mustache at the foot (they peek around the cat)
  const cy = -r * 0.66;
  g.poly([-110, cy + 40, -120, cy - 40, -60, cy, 0, cy - 62, 60, cy, 120, cy - 40, 110, cy + 40]).fill(STEEL).stroke({ width: 5, color: C.ink, join: 'round' });
  const my = r * 0.66;
  g.moveTo(0, my - 10)
    .bezierCurveTo(-40, my - 40, -110, my - 20, -150, my - 60)
    .bezierCurveTo(-130, my + 10, -60, my + 30, 0, my + 6)
    .bezierCurveTo(60, my + 30, 130, my + 10, 150, my - 60)
    .bezierCurveTo(110, my - 20, 40, my - 40, 0, my - 10)
    .fill(STEEL)
    .stroke({ width: 5, color: C.ink, join: 'round' });
  return g;
}

/** the electric aura: two jagged rings of violet lightning around (0,0), redrawn every frame (`k` 0..1 = size) */
function aura(g: Graphics, k: number, still: boolean) {
  g.clear();
  if (k <= 0.02) return;
  const rnd = still ? (i: number) => ((i * 7919) % 100) / 100 : () => Math.random();
  for (const [s, col, w, a] of [
    [1.12, VIOLET, 14, 0.55],
    [1, VIOLET_HI, 6, 0.95],
  ] as const) {
    const pts: number[] = [];
    const N = 46;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const up = Math.max(0, -Math.sin(ang));
      const j = 0.86 + rnd(i * 3 + (s > 1 ? 1 : 0)) * 0.3;
      const rx = 215 * k * s * j * (1 + up * 0.12);
      const ry = 300 * k * s * j * (1 + up * 0.35);
      pts.push(Math.cos(ang) * rx, Math.sin(ang) * ry - 30 * k);
    }
    pts.push(pts[0], pts[1]);
    if (s > 1) g.poly(pts).fill({ color: VIOLET, alpha: 0.13 });
    g.poly(pts).stroke({ width: w, color: col, alpha: a, join: 'miter' });
  }
}

interface Prince {
  aura: { k: number };
}
const state = new WeakMap<SigCtx, Prince>();

export const bigoton: Signature = {
  dark: true,
  frame: 0x8a4dff,
  tag: 'UNIVERSO PRÍNCIPE',
  open(c: SigCtx) {
    const bg = planet();
    c.back.addChild(bg);
    if (!c.short && !c.reduce) {
      bg.alpha = 0;
      gsap.to(bg, { alpha: 1, duration: 0.25 });
    }
    hideDisc(c, 0.2);
    // the royal seal behind him (it turns, slowly)
    const sl = seal(300);
    sl.position.set(W / 2, c.CY);
    c.behind.addChild(sl);
    const glow = backlight(VIOLET, 360, 0.7);
    glow.position.set(W / 2, c.catY);
    c.behind.addChild(glow);
    const ag = new Graphics();
    ag.position.set(W / 2, c.catY + 20);
    c.behind.addChild(ag);
    const sparks = new Graphics();
    c.behind.addChild(sparks);
    const arcs = new Graphics();
    c.behind.addChild(arcs);
    const A = { k: c.short || c.reduce ? 1 : 0.15 };
    state.set(c, { aura: A });

    if (!c.short && !c.reduce) {
      sl.scale.set(0);
      sl.visible = false;
    } else if (!c.reduce) gsap.to(sl, { rotation: Math.PI * 2, duration: 60, repeat: -1, ease: 'none' });

    // charging sparks spiral in (until the burst), then embers rise; the aura crackles all along
    const sp: { a: number; t: number; r: number }[] = [];
    let phase: 'in' | 'up' = c.short ? 'up' : 'in';
    if (c.reduce) {
      aura(ag, 1, true);
    } else {
      every(c, 40, (t) => {
        if (ag.destroyed) return;
        aura(ag, A.k, false);
        // new sparks
        for (let i = 0; i < 3; i++) sp.push({ a: Math.random() * Math.PI * 2, t, r: 0.6 + Math.random() * 0.6 });
        sparks.clear();
        for (let i = sp.length - 1; i >= 0; i--) {
          const s = sp[i];
          const p = (t - s.t) / (phase === 'in' ? 0.55 : 0.9);
          if (p >= 1) {
            sp.splice(i, 1);
            continue;
          }
          let x: number;
          let y: number;
          if (phase === 'in') {
            const rr = 620 * s.r * (1 - p) + 90;
            const a = s.a + p * 2.4;
            x = W / 2 + Math.cos(a) * rr;
            y = c.catY + Math.sin(a) * rr * 0.8;
          } else {
            x = W / 2 + Math.cos(s.a) * 230 * s.r;
            y = c.catY + 250 - p * 560 * s.r + Math.sin(s.a) * 60;
          }
          const L = 10 + 8 * s.r;
          sparks.poly([x, y - L, x + 4, y, x, y + L, x - 4, y]);
        }
        sparks.fill({ color: VIOLET_HI, alpha: 0.9 });
        // lightning arcs leap off the aura
        arcs.clear();
        if (A.k > 0.6 && Math.random() < 0.55) {
          for (let n = 0; n < 2; n++) {
            const a = Math.random() * Math.PI * 2;
            const x0 = W / 2 + Math.cos(a) * 200 * A.k;
            const y0 = c.catY + 20 + Math.sin(a) * 280 * A.k;
            bolt(arcs, x0, y0, x0 + Math.cos(a) * 150, y0 + Math.sin(a) * 120, VIOLET_HI, 4, 6, 34);
          }
        }
      });
    }
    if (c.short) return;

    // --- the scouter lens locks on, the reading climbs
    const sc = new Container();
    c.fg.addChild(sc);
    const lens = new Graphics();
    const LX0 = 330;
    const LX1 = 1590;
    const LY0 = 150;
    const LY1 = 770;
    lens.poly([LX0 + 40, LY0, LX1, LY0 - 30, LX1 + 30, LY1 - 10, LX0, LY1]).fill({ color: LENS, alpha: 0.14 }).stroke({ width: 8, color: LENS, alpha: 0.85, join: 'round' });
    for (let y = LY0 + 12; y < LY1; y += 8) lens.moveTo(LX0 + 20, y).lineTo(LX1 + 10, y - 20).stroke({ width: 1, color: LENS, alpha: 0.12 });
    const housing = new Graphics()
      .roundRect(LX1 + 20, LY0 + 60, 120, 420, 24)
      .fill(0x3a3f4a)
      .stroke({ width: 6, color: C.ink })
      .roundRect(LX1 + 50, LY0 + 110, 60, 120, 12)
      .fill(0x262a33)
      .circle(LX1 + 80, LY0 + 300, 22)
      .fill(0xff3344)
      .stroke({ width: 5, color: C.ink });
    const hud = new Graphics();
    const rd = new Graphics();
    const label = txt('PODER', { fontFamily: F.bebas, fontSize: 40, fill: LENS, letterSpacing: 6 });
    label.position.set(LX1 - 330, LY1 - 210);
    const tgt = txt('BUSCANDO…', { fontFamily: F.bebas, fontSize: 34, fill: LENS, letterSpacing: 4 });
    tgt.position.set(LX0 + 80, LY0 + 30);
    const crack = new Graphics();
    sc.addChild(lens, hud, rd, label, tgt, crack, housing);
    if (!c.reduce) {
      sc.alpha = 0;
      sc.x = 120;
      gsap.to(sc, { alpha: 1, x: 0, duration: 0.18, ease: 'power2.out', delay: 0.05 });
    }
    const pw = { v: 0 };
    let over = false;
    const drawRead = () => {
      if (rd.destroyed) return;
      rd.clear();
      const v = Math.round(pw.v);
      segText(rd, over ? '8001' : String(v).padStart(4, ' '), LX1 - 60, LY1 - 160, 110, over ? 0xff4455 : LENS, 0.08, true);
    };
    // the reticle: four brackets close in on his head, a triangle spins
    const ret = { k: c.reduce ? 1 : 0 };
    const drawHud = (t: number) => {
      if (hud.destroyed) return;
      hud.clear();
      const cx = W / 2;
      const cy = c.catY - 90;
      const s = 360 - 220 * ret.k;
      const L = 46;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        hud.moveTo(cx + sx * s, cy + sy * s - sy * L).lineTo(cx + sx * s, cy + sy * s).lineTo(cx + sx * s - sx * L, cy + sy * s);
      }
      hud.stroke({ width: 7, color: over ? 0xff4455 : LENS });
      const a = t * 3;
      const r = 40;
      hud.poly([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a + 2.09) * r, cy + Math.sin(a + 2.09) * r, cx + Math.cos(a + 4.19) * r, cy + Math.sin(a + 4.19) * r]).stroke({ width: 4, color: LENS });
      hud.moveTo(cx - s - 80, cy).lineTo(cx - s - 10, cy).moveTo(cx + s + 10, cy).lineTo(cx + s + 80, cy).stroke({ width: 3, color: LENS, alpha: 0.7 });
    };
    drawHud(0);
    drawRead();
    if (c.reduce) {
      over = true;
      drawRead();
      drawHud(0);
      tgt.text = '¡MÁS DE 8000!';
      for (let i = 0; i < 6; i++) bolt(crack, W / 2 + 220, c.catY - 160, W / 2 + 220 + Math.cos(i) * 300, c.catY - 160 + Math.sin(i) * 240, 0xffffff, 4, 6, 40);
      // the still frame keeps the cracked lens a moment, then the universe
      later(c, 1.4, () => gsap.to(sc, { alpha: 0, duration: 0.3, onComplete: () => sc.destroy({ children: true }) }));
      sl.scale.set(1);
      sl.visible = true;
      return;
    }
    const stopHud = every(c, 60, drawHud);
    gsap.to(ret, { k: 1, duration: 0.35, ease: 'power3.out', delay: 0.15 });
    later(c, 0.4, () => !tgt.destroyed && (tgt.text = 'OBJETIVO: 1'));
    let lastTick = 0;
    gsap.to(pw, {
      v: 8000,
      duration: 1.05,
      delay: 0.38,
      ease: 'expo.in',
      onUpdate: () => {
        drawRead();
        const now = performance.now();
        if (now - lastTick > 55 && alive(c)) {
          sfx('tick', 1.2 + (pw.v / 8000) * 1.8);
          lastTick = now;
        }
      },
    });
    gsap.to(A, { k: 0.75, duration: 1.3, delay: 0.3, ease: 'power1.in' });
    // overflow: red, ¡MÁS DE 8000!, the glass cracks…
    later(c, 1.45, () => {
      over = true;
      drawRead();
      if (!tgt.destroyed) {
        tgt.text = '¡ERROR!';
        tgt.style.fill = 0xff4455;
      }
      sfx('alarm', 1.4);
      word(c, W / 2, 140, '¡MÁS DE 8000!', 0xffffff, 104, 1.3);
    });
    later(c, 1.6, () => {
      if (crack.destroyed) return;
      for (let i = 0; i < 7; i++) bolt(crack, W / 2 + 180, c.catY - 150, W / 2 + 180 + Math.cos(i * 0.9) * 420, c.catY - 150 + Math.sin(i * 0.9) * 330, 0xffffff, 4, 7, 46);
      sfx('glitch', 1.3);
      c.shaker.add(0.15);
    });
    // …and explodes: the shards fly, the aura flares, the seal stamps behind him
    later(c, 1.78, () => {
      stopHud();
      phase = 'up';
      const ox = sc.x;
      sc.destroy({ children: true });
      burst(
        c,
        c.fg,
        (i) =>
          new Graphics()
            .poly([0, 0, 40 + (i % 3) * 20, 8, 14, 46 + (i % 4) * 12])
            .fill({ color: LENS, alpha: 0.5 })
            .stroke({ width: 3, color: 0xe8ffe8 }),
        22,
        W / 2 + 180 + ox,
        c.catY - 150,
        900,
        0.9,
      );
      flashOf(c, VIOLET_HI, 0.5, 0.35);
      sfx('boom', 0.9);
      sfx('zap', 0.7);
      c.shaker.add(0.45);
      gsap.to(A, { k: 1.15, duration: 0.12, ease: 'power2.out', onComplete: () => void gsap.to(A, { k: 1, duration: 0.5 }) });
      // the dust ring at his feet
      const dust = new Graphics().ellipse(0, 0, 120, 26).stroke({ width: 14, color: VIOLET_HI, alpha: 0.8 });
      dust.position.set(W / 2, c.catY + 255);
      c.back.addChild(dust);
      gsap.to(dust.scale, { x: 9, y: 5, duration: 0.7, ease: 'power2.out' });
      gsap.to(dust, { alpha: 0, duration: 0.7, onComplete: () => dust.destroy() });
    });
    later(c, 1.9, () => {
      sl.visible = true;
      gsap.fromTo(sl.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.22, ease: 'back.out(2.5)' });
      gsap.to(sl, { rotation: Math.PI * 2, duration: 60, repeat: -1, ease: 'none' });
      sfx('shield', 0.8);
      sfx('fanfare', 0.75);
    });
    // the armor gleams (a star glint on his chest, twice)
    for (const t of [2.5, 3.5])
      later(c, t, () => {
        const st = new Graphics().star(0, 0, 4, 46, 7).fill(0xffffff).circle(0, 0, 10).fill(0xffffff);
        st.position.set(W / 2 + 70, c.catY + 10);
        c.fg.addChild(st);
        gsap.fromTo(st.scale, { x: 0, y: 0 }, { x: 1.2, y: 1.2, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', onComplete: () => st.destroy() });
        gsap.to(st, { rotation: 1.2, duration: 0.36 });
        sfx('gem', 1.7);
      });
    score(c, [
      [0.05, 'whoosh', 1.3],
      [0.12, 'tick', 2.4],
      [0.3, 'charge', 0.8],
      [1.0, 'charge', 1.1],
    ]);
  },
  payoff(c: SigCtx) {
    const st = state.get(c);
    // the beam: a violet ball in his paws, then a beam across the screen to the left (over the cheer, under the stamp)
    const by = c.catY + 30;
    const bx = W / 2 - 110;
    const beam = new Graphics();
    c.behind.addChild(beam);
    const ball = new Graphics();
    c.fg.addChild(ball);
    const B = { ball: 0, th: 0, len: 0 };
    const draw = (t: number) => {
      if (beam.destroyed || ball.destroyed) return;
      ball.clear();
      if (B.ball > 0.01) {
        ball.circle(bx, by, 90 * B.ball).fill({ color: VIOLET, alpha: 0.45 });
        ball.circle(bx, by, 60 * B.ball).fill({ color: VIOLET_HI, alpha: 0.9 });
        ball.circle(bx, by, 32 * B.ball).fill(0xffffff);
      }
      beam.clear();
      if (B.th > 0.5) {
        const x1 = bx - B.len;
        for (const [k, col, a] of [
          [1, VIOLET, 0.55],
          [0.62, VIOLET_HI, 0.9],
          [0.28, 0xffffff, 1],
        ] as const) {
          const hh = (B.th / 2) * k;
          const pts: number[] = [bx, by - hh];
          for (let x = bx; x > x1; x -= 60) pts.push(x, by - hh - (c.reduce ? 0 : Math.random() * 14 * k));
          pts.push(x1, by - hh, x1, by + hh);
          for (let x = x1; x < bx; x += 60) pts.push(x, by + hh + (c.reduce ? 0 : Math.random() * 14 * k));
          pts.push(bx, by + hh);
          beam.poly(pts).fill({ color: col, alpha: a });
        }
        // the spiral rings running along it
        if (!c.reduce)
          for (let i = 0; i < 5; i++) {
            const x = bx - (((t * 1400 + i * 260) % Math.max(1, B.len)) as number);
            beam.ellipse(x, by, 22, B.th * 0.62).stroke({ width: 6, color: VIOLET_HI, alpha: 0.8 });
          }
      }
    };
    const stop = every(c, 60, draw);
    if (c.reduce) {
      B.ball = 1;
      B.th = 200;
      B.len = W;
      draw(0);
      later(c, 1.2, () => {
        stop();
        beam.destroy();
        ball.destroy();
      });
    } else {
      gsap.to(B, { ball: 1, duration: 0.16, ease: 'back.out(2)' });
      later(c, 0.28, () => {
        // where it hits: the left edge blooms
        for (let i = 0; i < 3; i++) {
          const b = new Graphics().circle(0, 0, 60).fill({ color: i ? VIOLET_HI : 0xffffff, alpha: 0.8 - i * 0.2 });
          b.position.set(30, by);
          c.fg.addChild(b);
          gsap.fromTo(b.scale, { x: 0.4, y: 0.4 }, { x: 4 + i * 2, y: 4 + i * 2, duration: 0.5 + i * 0.15, ease: 'power2.out' });
          gsap.to(b, { alpha: 0, duration: 0.5 + i * 0.15, onComplete: () => b.destroy() });
        }
      });
      later(c, 0.16, () => {
        sfx('bigboom', 0.85);
        sfx('zap', 0.6);
        flashOf(c, VIOLET_HI, 0.6, 0.4);
        c.shaker.add(0.6);
      });
      gsap.to(B, { len: W, duration: 0.14, delay: 0.16, ease: 'power2.out' });
      gsap.to(B, { th: 240, duration: 0.1, delay: 0.16 });
      gsap.to(B, { th: 0, ball: 0, duration: 0.35, delay: 1.15, ease: 'power2.in', onComplete: () => {
          stop();
          beam.destroy();
          ball.destroy();
        } });
      if (st) gsap.to(st.aura, { k: 1.25, duration: 0.15, yoyo: true, repeat: 1 });
    }
    score(c, [
      [0, 'charge', 1.6],
      [0.5, 'fanfare', 1.0],
    ]);
    cheer(c, '¡SOY EL PRÍNCIPE!', VIOLET_HI, 116, 1.9);
    later(c, 0.9, () => word(c, CHEER[0] + 40, CHEER[1] + 110, '…y tú, mi rival.', C.paper, 46, 1.8, F.ui));
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const s = Math.min(w, h) / 600;
    k.addChild(planet(w, h, s * 1.6));
    const sl = seal(Math.min(w, h) * 0.34);
    sl.position.set(w / 2, h * 0.52);
    k.addChild(sl);
    const ag = new Graphics();
    ag.position.set(w / 2, h * 0.55);
    ag.scale.set((Math.min(w, h) / 620) * 1.1);
    k.addChild(ag);
    aura(ag, 1, true);
    // a corner of the scouter: the reading
    const rd = new Graphics();
    segText(rd, '8001', w - 12 * s * 2, h - 70 * s * 2, 46 * s * 2, 0xff4455, 0.1, true);
    k.addChild(rd);
    const lab = poster('¡+8000!', Math.max(14, 34 * s * 2), LENS);
    lab.position.set(10 * s * 2, 8 * s * 2);
    k.addChild(lab);
    if (live) cardLoop(k, 20, () => aura(ag, 1, false));
    return k;
  },
};

