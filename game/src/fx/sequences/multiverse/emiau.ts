/**
 * EMIAU, «Slim Bigotes»: the underground battle. A grimy grayscale basement (bricks, flyers, grain) where the only
 * color is red spray paint. A mic drops into a spotlight on its cable, the boom-bap starts, his bars slam in white on
 * black — «SIETE VIDAS, OCHO BARRAS, NUEVE RIMAS… ¡Y NINGUNA SE ME OLVIDA!» — while his tag gets sprayed on the wall and
 * the crowd's hands go up. Payoff: the mic drop.
 */
import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { F } from '../../../ui/theme';
import { poster, txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { destroyTree } from '../../../panels/collection/ui';
import { noiseTile } from '../../../panels/collection/printTextures';
import { type Signature, type SigCtx, CHEER, backlight, cover, every, later, word } from './kit';
import { crowd, fadeKill, fitW, liveLoop, puff, rng, stash } from './kitB';

const RED = 0xff2b2b;
const FLOOR = 790;
/** where the mic hangs (the cable comes from the dark above) */
const MIC: [number, number] = [W / 2 + 330, 470];

/** the basement wall: bricks in four grays over the mortar, flyers, grime */
function wall(): Graphics {
  const g = new Graphics();
  const r = rng(8);
  g.rect(0, 0, W, FLOOR).fill(0x1f1f1f);
  const bw = 118;
  const bh = 42;
  for (let row = 0; row * (bh + 6) < FLOOR; row++) {
    const off = row % 2 ? -bw / 2 : 0;
    for (let x = off; x < W; x += bw + 6) {
      const tone = [0x343434, 0x3b3b3b, 0x2f2f2f, 0x424242][Math.floor(r() * 4)];
      g.rect(x, row * (bh + 6), bw, bh).fill(tone);
    }
  }
  // grime and water stains
  for (let i = 0; i < 14; i++) g.ellipse(r() * W, r() * FLOOR, 60 + r() * 160, 30 + r() * 90).fill({ color: 0x000000, alpha: 0.18 });
  for (let i = 0; i < 10; i++) {
    const x = r() * W;
    g.rect(x, 0, 3 + r() * 4, 120 + r() * 300).fill({ color: 0x000000, alpha: 0.2 });
  }
  // the floor: concrete, a stage edge
  g.rect(0, FLOOR, W, H - FLOOR).fill(0x262626);
  g.rect(0, FLOOR, W, 10).fill(0x3a3a3a);
  for (let i = 0; i < 8; i++) g.moveTo(W / 2 + (i - 3.5) * 120, FLOOR + 10).lineTo(W / 2 + (i - 3.5) * 420, H).stroke({ width: 2, color: 0x1a1a1a });
  return g;
}

/** a torn flyer pasted on the wall */
function flyer(line1: string, line2: string): Container {
  const k = new Container();
  const g = new Graphics().poly([-90, -120, 92, -114, 88, 118, 30, 112, 14, 124, -86, 120]).fill(0xbdbab2).stroke({ width: 2, color: 0x111111 });
  const a = poster(line1, 44, 0x151515);
  const b = txt(line2, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: 0x151515, letterSpacing: 2 });
  a.anchor.set(0.5);
  b.anchor.set(0.5);
  a.y = -50;
  b.y = 4;
  fitW(a, 160);
  fitW(b, 160);
  g.circle(0, 70, 30).fill(0x6a6a6a);
  k.addChild(g, a, b);
  return k;
}

/** a handheld mic hanging head-down from its cable */
function mic(): Container {
  const k = new Container();
  const cable = new Graphics().moveTo(0, -1200).bezierCurveTo(10, -800, -12, -400, 0, -70).stroke({ width: 5, color: 0x0a0a0a });
  const body = new Graphics()
    .poly([-13, -78, 13, -78, 19, 0, -19, 0])
    .fill(0x1a1a1a)
    .stroke({ width: 3, color: 0x050505 })
    .rect(-20, -4, 40, 12)
    .fill(0x8a8a8a)
    .stroke({ width: 2, color: 0x050505 });
  const head = new Graphics().circle(0, 34, 30).fill(0xb8b8b8).stroke({ width: 4, color: 0x050505 });
  for (let i = -2; i <= 2; i++) head.moveTo(i * 11, 8).lineTo(i * 11, 60).stroke({ width: 2, color: 0x6a6a6a });
  for (let j = 0; j < 4; j++) head.moveTo(-28, 16 + j * 12).lineTo(28, 16 + j * 12).stroke({ width: 2, color: 0x6a6a6a });
  head.circle(-10, 22, 7).fill({ color: 0xffffff, alpha: 0.6 });
  k.addChild(cable, body, head);
  return k;
}

/** a raised hand (open or a fist), arm down to the crowd */
function hand(open: boolean, s: number): Graphics {
  const g = new Graphics();
  g.moveTo(0, 260).lineTo(0, 40).stroke({ width: 30 * s, color: 0x0a0a0a, cap: 'round' });
  if (open) {
    g.roundRect(-24 * s, -10 * s, 48 * s, 52 * s, 16 * s).fill(0x0a0a0a);
    for (let i = 0; i < 4; i++) g.moveTo((-18 + i * 12) * s, -4 * s).lineTo((-22 + i * 14) * s, -48 * s + Math.abs(i - 1.5) * 8 * s).stroke({ width: 11 * s, color: 0x0a0a0a, cap: 'round' });
    g.moveTo(-22 * s, 26 * s).lineTo(-42 * s, 2 * s).stroke({ width: 11 * s, color: 0x0a0a0a, cap: 'round' });
  } else g.roundRect(-26 * s, -16 * s, 52 * s, 56 * s, 18 * s).fill(0x0a0a0a);
  return g;
}

/** a bar: white condensed letters on a black block (the last one on red) */
function bar(text: string, size: number, fill = 0x0a0a0a): Container {
  const k = new Container();
  const t = poster(text, size, 0xffffff, { letterSpacing: 1 });
  t.anchor.set(0.5);
  const g = new Graphics().rect(-t.width / 2 - 18, -t.height / 2 - 2, t.width + 36, t.height + 4).fill({ color: fill, alpha: 0.92 });
  k.addChild(g, t);
  return k;
}

/** a spray splat: a blob, flecks and drips */
function splat(r: number, seed: number): Graphics {
  const g = new Graphics();
  const rr = rng(seed);
  const pts: number[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const d = r * (0.7 + rr() * 0.5);
    pts.push(Math.cos(a) * d, Math.sin(a) * d);
  }
  g.poly(pts).fill(RED);
  for (let i = 0; i < 12; i++) {
    const a = rr() * Math.PI * 2;
    const d = r * (1.1 + rr() * 0.7);
    g.circle(Math.cos(a) * d, Math.sin(a) * d, 3 + rr() * r * 0.08).fill(RED);
  }
  for (let i = 0; i < 4; i++) g.roundRect(-r * 0.5 + rr() * r, r * 0.3, 6 + rr() * 6, r * (0.6 + rr()), 4).fill(RED);
  return g;
}

/** his tag on the wall: SLIM under a crown, red with ink outline */
function tag(): Container {
  const k = new Container();
  const t = txt('SLIM', { fontFamily: F.brush, fontSize: 210, fill: RED, stroke: { color: 0x0a0a0a, width: 14, join: 'round' }, letterSpacing: 4 });
  t.anchor.set(0.5);
  const crown = new Graphics().poly([-120, -110, -120, -190, -70, -140, 0, -210, 70, -140, 120, -190, 120, -110], false).stroke({ width: 12, color: RED, join: 'round', cap: 'round' });
  for (const x of [-120, 0, 120]) crown.circle(x, x === 0 ? -226 : -204, 10).fill(RED);
  k.addChild(crown, t);
  return k;
}

interface St {
  dropped: boolean;
  mic: Container;
  spot: Graphics;
  hands: Graphics[];
  pump: (k: number) => void;
}
const S = stash<St>();

export const emiau: Signature = {
  dark: true,
  frame: RED,
  tag: 'BATALLA DE GALLOS',
  open(c: SigCtx) {
    const k = new Container();
    k.addChild(cover(0x101010), wall());
    const f1 = flyer('BATALLA', 'LA CUADRA 8 · VIERNES');
    f1.position.set(250, 300);
    f1.rotation = -0.06;
    const f2 = flyer('¡GALLOS!', 'ENTRADA: UN PESCADO');
    f2.position.set(1700, 560);
    f2.rotation = 0.05;
    k.addChild(f1, f2);
    // the tag, sprayed in during the takeover (there at once on a duplicate)
    const tg = tag();
    tg.position.set(1480, 330);
    tg.rotation = -0.1;
    k.addChild(tg);
    // the spotlights: the main one on him, a thin one on the mic
    const spot = new Graphics()
      .poly([W / 2 - 70, -20, W / 2 + 70, -20, W / 2 + 400, FLOOR + 40, W / 2 - 400, FLOOR + 40])
      .fill({ color: 0xf2efe6, alpha: 0.13 })
      .ellipse(W / 2, FLOOR + 30, 420, 70)
      .fill({ color: 0xf2efe6, alpha: 0.18 });
    spot.blendMode = 'add';
    const micSpot = new Graphics().poly([MIC[0] - 20, -20, MIC[0] + 20, -20, MIC[0] + 90, FLOOR + 30, MIC[0] - 90, FLOOR + 30]).fill({ color: 0xf2efe6, alpha: 0.1 });
    micSpot.blendMode = 'add';
    k.addChild(spot, micSpot);
    // the crowd, hands up
    const heads = crowd(new Graphics(), 930, 26, 0x070707, 88);
    const hands: Graphics[] = [];
    const hr = rng(21);
    for (let i = 0; i < 16; i++) {
      const left = i % 2 === 0;
      const x = left ? 60 + hr() * 600 : W - 60 - hr() * 600;
      const h = hand(hr() < 0.7, 0.9 + hr() * 0.4);
      h.position.set(x, 700 + hr() * 120);
      h.rotation = (left ? -1 : 1) * (0.05 + hr() * 0.25);
      k.addChild(h);
      hands.push(h);
    }
    k.addChild(heads);
    // grit: the same speckle twice, light and dark, jumping every frame (no filter, no shader to compile)
    const grit = [0xffffff, 0x000000].map((tint, i) => {
      const t = new TilingSprite({ texture: noiseTile(), width: W, height: H });
      t.tint = tint;
      t.alpha = i ? 0.35 : 0.12;
      t.tileScale.set(1.6 + i * 0.6);
      k.addChild(t);
      return t;
    });
    c.back.addChild(k);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.15 });
    const rim = backlight(0xf2efe6, 360, 0.3);
    rim.position.set(W / 2, c.catY);
    c.behind.addChild(rim);
    // the mic on its cable
    const m = mic();
    m.scale.set(1.7);
    m.position.set(MIC[0], MIC[1]);
    c.back.addChild(m);
    const y0 = hands.map((h) => h.y);
    const pumpK = { v: 0 };
    const pump = (amt: number) => {
      pumpK.v = amt;
    };
    if (!c.reduce)
      every(c, 30, (t) => {
        for (const g of grit) if (!g.destroyed) g.tilePosition.set(Math.random() * 512, Math.random() * 512);
        pumpK.v *= 0.86;
        hands.forEach((h, i) => !h.destroyed && (h.y = y0[i] - pumpK.v * (40 + (i % 3) * 14) + Math.sin(t * 3 + i) * 6));
        if (!m.destroyed && !S.get(c)?.dropped) m.rotation = Math.sin(t * 2.2) * 0.05;
      });
    S.set(c, { dropped: false, mic: m, spot, hands, pump });
    if (c.short) return;

    // lights off; the mic drops into its spotlight
    if (!c.reduce) {
      spot.alpha = 0;
      micSpot.alpha = 0;
      k.alpha = 0.55;
      gsap.fromTo(m, { y: MIC[1] - 700 }, { y: MIC[1], duration: 0.42, ease: 'back.out(1.6)' });
      later(c, 0.05, () => (micSpot.alpha = 1));
      later(c, 0.35, () => {
        spot.alpha = 1;
        k.alpha = 1;
      });
    }
    later(c, 0.05, () => sfx('hit', 0.45));
    later(c, 0.35, () => sfx('hit', 0.4));
    // boom-bap: kick, snare, hats
    const kick = (t: number) => later(c, t, () => (sfx('boom', 0.75), pump(0.7), c.shaker.add(0.12)));
    const snare = (t: number) => later(c, t, () => (sfx('hit', 1.35), pump(1)));
    const hat = (t: number) => later(c, t, () => sfx('tick', 1.3));
    [0.35, 1.25, 1.36, 1.92].forEach(kick);
    [0.8, 1.7, 2.15].forEach(snare);
    [0.57, 1.02, 1.47].forEach(hat);
    // the bars slam in on the beat, then wipe off before the reprint
    const bars: [string, number, number, number, number?][] = [
      ['SIETE VIDAS,', 0.35, 440, 250],
      ['OCHO BARRAS,', 0.8, 480, 365],
      ['NUEVE RIMAS…', 1.25, 440, 480],
      ['¡Y NINGUNA SE ME OLVIDA!', 1.7, W / 2, 880, RED],
    ];
    const out: Container[] = [];
    bars.forEach(([text, t, x, y, fill], i) =>
      later(c, t, () => {
        const b = bar(text, i === 3 ? 84 : 72, fill);
        b.position.set(x, y);
        b.rotation = i % 2 ? 0.025 : -0.03;
        c.fg.addChild(b);
        out.push(b);
        if (c.reduce) return;
        gsap.fromTo(b.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.12, ease: 'back.out(3)' });
        gsap.fromTo(b, { x: x - 30 }, { x, duration: 0.18, ease: 'elastic.out(1.4,0.3)' });
      }),
    );
    later(c, 2.3, () =>
      out.forEach((b, i) =>
        !b.destroyed && c.reduce
          ? fadeKill(b, 0, 0.3)
          : gsap.to(b, { x: b.x - 900, alpha: 0, duration: 0.3, delay: i * 0.04, ease: 'power2.in', onComplete: () => destroyTree(b) }),
      ),
    );
    if (c.reduce) return;
    // the tag gets sprayed: a mask sweeps across, mist around the nozzle, then it drips
    const mask = new Graphics();
    k.addChild(mask);
    tg.mask = mask;
    // the mist: a new little batch each step (one growing Graphics would re-tessellate everything every frame)
    const mist = new Container();
    k.addChild(mist);
    const b0 = { x: 1480 - 330, y: 330 - 260, w: 660, h: 400 };
    const sp = { k: 0 };
    gsap.to(sp, {
      k: 1,
      duration: 1.0,
      delay: 0.45,
      ease: 'none',
      onUpdate: () => {
        if (mask.destroyed) return;
        mask.clear().rect(b0.x, b0.y, b0.w * sp.k, b0.h).fill(0xffffff);
        const nx = b0.x + b0.w * sp.k;
        const dots = new Graphics();
        for (let i = 0; i < 5; i++) dots.circle(nx + (Math.random() - 0.5) * 60, b0.y + 60 + Math.random() * (b0.h - 80), 1.5 + Math.random() * 3).fill({ color: RED, alpha: 0.5 });
        mist.addChild(dots);
      },
      onComplete: () => {
        if (tg.destroyed) return;
        tg.mask = null;
        mask.destroy();
        const drips = new Graphics();
        k.addChild(drips);
        const d = { k: 0 };
        gsap.to(d, {
          k: 1,
          duration: 0.8,
          onUpdate: () => {
            if (drips.destroyed) return;
            drips.clear();
            for (let i = 0; i < 7; i++) drips.roundRect(1220 + i * 80 + (i % 2) * 20, 400 + (i % 3) * 14, 7, 20 + d.k * (40 + ((i * 37) % 60)), 4).fill(RED);
          },
        });
      },
    });
    [0.45, 0.8, 1.15].forEach((t) => later(c, t, () => sfx('splash', 2.4)));
    later(c, 2.12, () => word(c, W / 2 + 520, 200, '¡OOOOH!', 0xd8d8d8, 80, 0.8));
  },
  payoff(c: SigCtx) {
    const st = S.get(c);
    sfx('boom', 0.8);
    const fx = MIC[0];
    // the mic drop: the cable lets go, it falls, it hits the floor
    if (st && !st.mic.destroyed) {
      st.dropped = true;
      const m = st.mic;
      const cable = m.children[0];
      if (cable) gsap.to(cable, { alpha: 0, duration: 0.1 });
      gsap.to(m, { y: FLOOR + 50, duration: c.reduce ? 0.01 : 0.32, ease: 'power2.in' });
      gsap.to(m, { rotation: 1.5, duration: c.reduce ? 0.01 : 0.32, ease: 'power1.in' });
    }
    later(c, c.reduce ? 0.02 : 0.32, () => {
      sfx('bigboom', 0.7);
      sfx('error', 0.6);
      later(c, 0.08, () => sfx('freeze', 0.9));
      c.shaker.add(0.55);
      if (st && !st.mic.destroyed && !c.reduce) gsap.fromTo(st.mic, { y: FLOOR + 20 }, { y: FLOOR + 50, duration: 0.3, ease: 'bounce.out' });
      // a red shockwave along the floor
      const ring = new Graphics().ellipse(0, 0, 140, 26).stroke({ width: 12, color: RED });
      ring.position.set(fx, FLOOR + 60);
      c.back.addChild(ring);
      gsap.fromTo(ring.scale, { x: 0.3, y: 0.3 }, { x: 9, y: 9, duration: 0.8, ease: 'power2.out' });
      gsap.to(ring, { alpha: 0, duration: 0.8, onComplete: () => destroyTree(ring) });
      puff(c, c.back, fx, FLOOR + 40, 0x9a9a9a, 6, 50, 60);
      // lights out for a breath (not with Reducir destellos), then the crowd goes off
      if (st && c.flashes) gsap.fromTo(st.spot, { alpha: 0 }, { alpha: 1, duration: 0.05, delay: 0.14 });
      st?.pump(1.6);
      if (st && !c.reduce) {
        let n = 0;
        const stop = every(c, 1 / 0.33, () => {
          st.pump(1);
          if (++n > 8) stop();
        });
      }
      // red spray splats in the corners
      const spots: [number, number, number][] = [
        [150, 170, 90],
        [W - 160, 880, 110],
        [W - 380, 120, 60],
        [120, 960, 70],
      ];
      spots.forEach(([x, y, r], i) => {
        const s = splat(r, i * 13 + 5);
        s.position.set(x, y);
        s.rotation = i;
        c.back.addChild(s);
        if (!c.reduce) gsap.fromTo(s.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.18, delay: i * 0.07, ease: 'back.out(2)' });
      });
      // MIC DROP.
      const p = new Container();
      const b = bar('MIC DROP.', 150);
      const under = new Graphics().roundRect(-250, 62, 500, 22, 11).fill(RED);
      p.addChild(b, under);
      p.position.set(CHEER[0], CHEER[1]);
      p.rotation = -0.05;
      c.fg.addChild(p);
      gsap.fromTo(p.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' });
      gsap.fromTo(under.scale, { x: 0 }, { x: 1, duration: 0.25, delay: 0.15, ease: 'power2.out' });
      fadeKill(p, 2.3, 0.5);
    });
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    const u = Math.min(w, h) / 300;
    const g = new Graphics().rect(0, 0, w, h).fill(0x1f1f1f);
    const r = rng(8);
    const bw = 44 * u;
    const bh = 16 * u;
    for (let row = 0; row * (bh + 3 * u) < h * 0.82; row++)
      for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw + 3 * u) g.rect(x, row * (bh + 3 * u), bw, bh).fill([0x343434, 0x3b3b3b, 0x2f2f2f, 0x424242][Math.floor(r() * 4)]);
    g.rect(0, h * 0.82, w, h * 0.18).fill(0x262626);
    const spot = new Graphics().poly([w / 2 - 20 * u, 0, w / 2 + 20 * u, 0, w / 2 + 150 * u, h, w / 2 - 150 * u, h]).fill({ color: 0xf2efe6, alpha: 0.14 });
    const t = txt('SLIM', { fontFamily: F.brush, fontSize: 64 * u, fill: RED, stroke: { color: 0x0a0a0a, width: 5 * u, join: 'round' } });
    t.anchor.set(0.5);
    t.position.set(w * 0.78, h * 0.16);
    t.rotation = -0.12;
    const crown = new Graphics().poly([-34, -26, -34, -50, -20, -36, 0, -56, 20, -36, 34, -50, 34, -26], false).stroke({ width: 4, color: RED, join: 'round', cap: 'round' });
    crown.scale.set(u);
    crown.position.set(w * 0.78, h * 0.16);
    crown.rotation = -0.12;
    const sp1 = splat(26 * u, 3);
    sp1.position.set(w * 0.12, h * 0.2);
    const m = mic();
    m.scale.set(0.75 * u);
    m.position.set(w * 0.86, h * 0.5);
    const heads = crowd(new Graphics(), 0, 9, 0x070707, 88, w / u, 0);
    heads.scale.set(u * 0.6);
    heads.position.set(0, h - 34 * u);
    const hands = [hand(true, 1), hand(false, 1), hand(true, 1.1)];
    hands.forEach((hd, i) => {
      hd.scale.set(u * 0.5);
      hd.position.set([0.1, 0.24, 0.9][i] * w, h * 0.78);
      hd.rotation = [-0.2, -0.05, 0.2][i];
    });
    k.addChild(g, sp1, crown, t, spot, m, ...hands, heads);
    if (live) {
      const y0 = hands.map((hd) => hd.y);
      liveLoop(k, 30, (tt) => {
        m.rotation = Math.sin(tt * 2) * 0.06;
        hands.forEach((hd, i) => (hd.y = y0[i] - Math.max(0, Math.sin(tt * 4.4 + i)) * 10 * u));
      });
    }
    return k;
  },
};
