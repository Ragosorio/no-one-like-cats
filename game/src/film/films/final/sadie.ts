/**
 * F35 · PC SADIE «Linterna mágica» — the complete song, bar by bar (guiones/final/h94-sin-llama.md S1–S21,
 * musica-v2/sadie.md). 50 BPM, 1 bar = 4.8 s, c1 = 0 s, dry cut at c37 = 172.8 s.
 *
 * Her lantern projects her memories while it goes out. The frame stays in the frozen dawn (realism) with the strike
 * across her; over it, the IRIS of the projection grows on the string steps — c5 (45 %), c9 (60 %), c17 (90 %) —, holds
 * at c25 with one slide (the photo of H90), WASHES at c29–33 (colour and weight drain, fine cracks; it never explodes),
 * and is an ember the size of a coin on the clean piano (c33–37), smaller on every attack, until the cut.
 *
 * Slides change by sliding sideways; from c21 the ones that leave FALL like glass. Three optional «RECUERDA» (c9, c17,
 * c21) bring back what the player did with her (H48, H67, H73): on time the slide comes in sharp, otherwise softer —
 * no memory is ever lost. No clicks in her death (c25–37).
 */
import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { bakePlate, glass, LI, type PlateTex } from '../../styles/linterna';
import { COL, DEUDA_FALSA, inkStroke, island, knitScarf, lantern, sea, sky, STAND_INS } from './props';
import { flickerAt } from '../../styles/noir';

const BAR = 4.8;
const c = (bar: number) => (bar - 1) * BAR;
const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
/** the visible height in scope (2.39) of the 1920 design width */
const VIS_H = 1920 / 2.39;
const CENTER: [number, number] = [930, 420];
const R = 360;

/** iris radius (fraction of the visible height, as a diameter) at song time t */
export function irisAt(t: number): number {
  if (t < c(3)) return 0.2;
  if (t < c(5)) return 0.2 + 0.05 * sm((t - c(3)) / (2 * BAR));
  if (t < c(9)) return 0.25 + 0.2 * sm((t - c(5)) / 0.8);
  if (t < c(13)) return 0.45 + 0.15 * sm((t - c(9)) / 0.8);
  if (t < c(17)) return 0.6 + 0.1 * sm((t - c(13)) / (4 * BAR));
  if (t < c(33)) return 0.7 + 0.08 * sm((t - c(17)) / 0.8);
  // the ember: down to a coin, then smaller on every piano attack (every 2.4 s), out at the cut
  const k = sm((t - c(33)) / 1.2);
  const coin = 0.09;
  const steps = Math.floor((t - c(33)) / 2.4);
  const shrink = Math.max(0, coin * (1 - steps / 8));
  return t >= c(37) ? 0 : 0.78 + (shrink - 0.78) * k;
}

interface Slide {
  t: number;
  /** a memory brought back by a RECUERDA prompt (its id) */
  memo?: string;
  draw: (cc: Container, R: number, ctx: SceneCtx) => void;
  g: [number, number];
}

// ------------------------------------------------------------------ the slides (hand-painted glass)
const still = (ctx: SceneCtx, slug: string, h: number, x: number, y: number, flip = false) => {
  const s = ctx.still(slug);
  if (!s) return null;
  const k = h / (s.texture.height || 700);
  s.scale.set(flip ? -k : k, k);
  s.position.set(x, y);
  return s;
};
const SLIDES: Slide[] = [
  // P1 · c1 — a girl at the foot of her father's dark lighthouse lights a candle (sepia: the anilines are not lit yet)
  {
    t: 0,
    g: [0xc8a878, 0x5a3a1e],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      g.poly([-40, 220, 40, 220, 26, -200, -26, -200]).fill(0x3a2410);
      g.rect(-34, -238, 68, 38).fill(0x2a1a0a);
      g.rect(-R, 220, R * 2, 200).fill(0x4a3018);
      g.circle(70, 196, 46).fill({ color: 0xffe2a0, alpha: 0.35 });
      g.rect(66, 176, 8, 30).fill(0xf6e6c4);
      g.ellipse(70, 168, 6, 12).fill(0xffe2a0);
      cc.addChild(g);
      const girl = still(ctx, 'luzterna', 150, 120, 236, true);
      if (girl) {
        girl.tint = 0xd8b890;
        cc.addChild(girl);
      }
    },
  },
  // P2 · c5 — the Archive tower the night of the tearing: pages fall in the dark; a young keeper does not come down
  {
    t: c(5),
    g: [0x1a2f6a, 0x0a1230],
    draw: (cc) => {
      const g = new Graphics();
      g.poly([-90, 300, 90, 300, 60, -240, -60, -240]).fill(0x0c1630);
      for (let i = 0; i < 6; i++) g.rect(-40, -200 + i * 70, 80, 26).fill({ color: LI.amber, alpha: i === 0 ? 0.95 : 0.25 });
      for (let i = 0; i < 18; i++) {
        const x = -280 + ((i * 97) % 560);
        const y = -260 + ((i * 53) % 520);
        g.poly([x, y, x + 22, y + 6, x + 18, y + 34, x - 4, y + 28]).fill({ color: LI.cream, alpha: 0.75 });
      }
      g.circle(0, -186, 18).fill(LI.amberL);
      cc.addChild(g);
    },
  },
  // P3 · c7 — baby Canelo asleep in the raft's box
  {
    t: c(7),
    g: [0x3a6fd0, 0x0a1a40],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      for (let i = 0; i < 5; i++) g.moveTo(-R, 120 + i * 40).bezierCurveTo(-100, 100 + i * 40, 100, 140 + i * 40, R, 120 + i * 40).stroke({ width: 10, color: 0x6aa0ff, alpha: 0.5 });
      g.poly([-170, 60, 170, 60, 140, 150, -140, 150]).fill(0x8a5a2a);
      g.rect(-130, -10, 260, 80).fill(0xb07a3a).rect(-130, -10, 260, 80).stroke({ width: 4, color: 0x5a3a1a });
      cc.addChild(g);
      const baby = still(ctx, ctx.canelo, 150, 0, 70);
      if (baby) cc.addChild(baby);
      const zz = new Text({ text: 'z z z', style: { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 34, fill: LI.cream } });
      zz.position.set(60, -110);
      cc.addChild(zz);
    },
  },
  // P4 · c8 — the lantern hanging at your lighthouse
  {
    t: c(8),
    g: [0x2a4a8a, 0x101a3a],
    draw: (cc) => {
      const g = new Graphics();
      g.poly([-60, 300, 60, 300, 44, -120, -44, -120]).fill(0xe8e0cc);
      g.rect(-50, -160, 100, 40).fill(0x2a2a34);
      g.circle(0, -60, 120).fill({ color: LI.blue, alpha: 0.35 });
      cc.addChild(g);
      const l = lantern(false, 1.6);
      l.position.set(0, -60);
      cc.addChild(l);
    },
  },
  // P5 · c9 — RECUERDA: the player's choice in H48 (two lights at a fork of the sea; the one they followed shines)
  {
    t: c(9),
    memo: 'recuerda_h48',
    g: [0x3a6fd0, 0x162a5a],
    draw: (cc, R) => {
      const g = new Graphics();
      g.moveTo(0, 300).bezierCurveTo(0, 100, -120, 20, -200, -160).stroke({ width: 60, color: 0x9ac8ff, alpha: 0.35 });
      g.moveTo(0, 300).bezierCurveTo(0, 100, 120, 20, 200, -160).stroke({ width: 60, color: 0xffd890, alpha: 0.7 });
      g.circle(-200, -170, 26).fill({ color: 0x9ac8ff, alpha: 0.6 });
      g.circle(200, -170, 40).fill(0xffe2a0);
      g.poly([-50, 250, 50, 250, 30, 290, -30, 290]).fill(0x4a2a12);
      g.rect(-4, 170, 8, 80).fill(0x4a2a12).poly([4, 176, 60, 220, 4, 236]).fill(LI.cream);
      cc.addChild(g);
      void R;
    },
  },
  // P6 · c10 — «Cuidar algo también es dejar que lo vean»
  {
    t: c(10),
    g: [0x1a2f6a, 0x3a1a4a],
    draw: (cc) => {
      const t = new Text({ text: 'Cuidar algo\ntambién es\ndejar que lo vean', style: { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 52, fill: LI.amberL, align: 'center', lineHeight: 64 } });
      t.anchor.set(0.5);
      cc.addChild(t);
    },
  },
  // P7 · c11 — Puerto Cometa: a harbour under a comet
  {
    t: c(11),
    g: [0x0e1a44, 0x3a2a5a],
    draw: (cc, R) => {
      const g = new Graphics();
      g.moveTo(-260, -220).lineTo(120, -40).stroke({ width: 18, color: LI.amberL, alpha: 0.5, cap: 'round' });
      g.circle(130, -36, 22).fill(0xfff2c8);
      for (let i = 0; i < 6; i++) g.rect(-260 + i * 90, 120 - (i % 3) * 30, 70, 160).fill(0x24183a).rect(-240 + i * 90, 150 - (i % 3) * 30, 20, 24).fill(LI.amber);
      g.rect(-R, 270, R * 2, 100).fill(0x1a2a5a);
      cc.addChild(g);
    },
  },
  // P8 · c13 — the island and the blue lighthouse (slow)
  {
    t: c(13),
    g: [0x1a3a7a, 0x0a1430],
    draw: (cc, R) => {
      const g = new Graphics();
      g.ellipse(0, 260, 300, 90).fill(0x3a5a2a);
      g.poly([-34, 220, 34, 220, 24, -60, -24, -60]).fill(0xeee6d4);
      g.poly([0, -70, -320, 120, -260, 180]).fill({ color: LI.blue, alpha: 0.4 });
      g.circle(0, -80, 18).fill(0xbfe4ff);
      cc.addChild(g);
      void R;
    },
  },
  // P9 · c15 — Canelo asleep on the blank page (slow)
  {
    t: c(15),
    g: [0x2a2a4a, 0x0e0e22],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      g.poly([-220, 120, 220, 100, 240, 230, -200, 250]).fill(0xf6ecd6);
      cc.addChild(g);
      const cat = still(ctx, ctx.canelo, 200, 0, 200);
      if (cat) cc.addChild(cat);
    },
  },
  // P10 · c17 — RECUERDA: the walk of H67 (she straightens him up: «DERECHO»)
  {
    t: c(17),
    memo: 'recuerda_h67',
    g: [0x2a1a4a, 0x0a0a1a],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      g.rect(-R, 200, R * 2, 200).fill(0x1a1a2a);
      for (let i = 0; i < 4; i++) g.rect(-300 + i * 170, -260, 16, 460).fill(0x0a0a14).circle(-292 + i * 170, -260, 26).fill({ color: LI.amber, alpha: 0.6 });
      cc.addChild(g);
      const cat = still(ctx, ctx.canelo, 190, -80, 250, true);
      if (cat) {
        cat.rotation = -0.12;
        cc.addChild(cat);
      }
      const luz = still(ctx, 'luzterna', 230, 120, 210);
      if (luz) cc.addChild(luz);
      const t = new Text({ text: 'DERECHO.', style: { fontFamily: 'Bebas Neue', fontSize: 46, fill: LI.amberL, letterSpacing: 6 } });
      t.anchor.set(0.5);
      t.position.set(120, -160);
      cc.addChild(t);
    },
  },
  // P11 · c17.75 — the hangover, in black and white
  {
    t: c(17.75),
    g: [0x8a8a8a, 0x2a2a2a],
    draw: (cc, R, ctx) => {
      const cat = still(ctx, ctx.canelo, 220, 0, 200);
      if (cat) {
        cat.tint = 0xb8b8b8;
        cat.rotation = 1.4;
        cc.addChild(cat);
      }
      const g = new Graphics().ellipse(-60, -60, 60, 40).fill({ color: 0xdadada, alpha: 0.9 });
      cc.addChild(g);
    },
  },
  // P12 · c18.75 — Cerito in night vision
  {
    t: c(18.75),
    g: [0x0a3a1a, 0x021a0a],
    draw: (cc, R, ctx) => {
      const cat = still(ctx, STAND_INS.cerito, 230, 0, 200);
      if (cat) {
        cat.tint = 0x9affa0;
        cc.addChild(cat);
      }
      const g = new Graphics();
      for (let y = -R; y < R; y += 8) g.rect(-R, y, R * 2, 2).fill({ color: 0x002a0a, alpha: 0.35 });
      cc.addChild(g);
    },
  },
  // P13 · c19.75 — the Gato-señal in the clouds
  {
    t: c(19.75),
    g: [0x1a1a3a, 0x050510],
    draw: (cc) => {
      const g = new Graphics();
      g.poly([0, 330, -200, -240, 200, -240]).fill({ color: 0xfff2c0, alpha: 0.25 });
      g.circle(0, -150, 120).fill({ color: 0xfff2c0, alpha: 0.85 });
      g.poly([-70, -170, -50, -250, -20, -190, 20, -190, 50, -250, 70, -170, 60, -100, -60, -100]).fill(0x101018);
      cc.addChild(g);
    },
  },
  // P14 · c21 — RECUERDA: the lantern lighting Canelo on the stage (H73)
  {
    t: c(21),
    memo: 'recuerda_h73',
    g: [0x3a1a5a, 0x0a0518],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      g.rect(-R, 190, R * 2, 200).fill(0x5a2a1a);
      g.poly([-40, -320, 40, -320, 220, 200, -220, 200]).fill({ color: 0x9ad0ff, alpha: 0.35 });
      cc.addChild(g);
      const cat = still(ctx, ctx.canelo, 260, 0, 210);
      if (cat) cc.addChild(cat);
      const t = new Text({ text: 'LUZ', style: { fontFamily: 'Bebas Neue', fontSize: 60, fill: 0xcfeaff, letterSpacing: 10 } });
      t.anchor.set(0.5);
      t.position.set(0, -230);
      cc.addChild(t);
    },
  },
  // P15 · c21.75 — the lantern put out in H85: only the cats' eyes
  {
    t: c(21.75),
    g: [0x05050a, 0x020205],
    draw: (cc) => {
      const g = new Graphics();
      for (let i = 0; i < 9; i++) {
        const x = -240 + ((i * 131) % 480);
        const y = -200 + ((i * 89) % 400);
        g.ellipse(x - 12, y, 8, 5).fill(0xf4dc72).ellipse(x + 12, y, 8, 5).fill(0xf4dc72);
      }
      cc.addChild(g);
    },
  },
  // P16 · c23.75 — the karaoke
  {
    t: c(23.75),
    g: [0x5a1a4a, 0x1a0518],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      g.roundRect(-14, -40, 28, 120, 10).fill(0x2a2a2a).circle(0, -60, 34).fill(0x8a8a9a);
      for (let i = 0; i < 6; i++) g.circle(-200 + i * 80, -200 + (i % 2) * 40, 12).fill(LI.rose).rect(-190 + i * 80, -260 + (i % 2) * 40, 5, 62).fill(LI.rose);
      cc.addChild(g);
      const a = still(ctx, 'luzterna', 200, -150, 260);
      const b = still(ctx, ctx.canelo, 180, 160, 270, true);
      if (a) cc.addChild(a);
      if (b) cc.addChild(b);
    },
  },
  // P17 · c24.25 — the starry night
  {
    t: c(24.25),
    g: [0x1b2a7a, 0x0f1d4a],
    draw: (cc) => {
      const g = new Graphics();
      for (let i = 0; i < 6; i++) g.circle(0, -40, 60 + i * 34).stroke({ width: 14, color: i % 2 ? 0x5d8fd8 : 0xa9c6ee, alpha: 0.6 });
      for (let i = 0; i < 7; i++) g.circle(-260 + i * 90, -220 + (i % 3) * 70, 14).fill(0xf8e27a);
      g.poly([-300, 340, -270, -80, -230, 340]).fill(0x0d1f16);
      cc.addChild(g);
    },
  },
  // P18 · c25 — the photo the player chose in H90 (a photobooth frame: her and the fat one)
  {
    t: c(25),
    g: [0xd8c8a8, 0x8a7a5a],
    draw: (cc, R, ctx) => {
      const g = new Graphics();
      g.roundRect(-210, -250, 420, 500, 10).fill(0xf6f0e2).roundRect(-180, -220, 360, 400, 6).fill(0x3a3040);
      cc.addChild(g);
      const a = still(ctx, 'luzterna', 280, -50, 170);
      const b = still(ctx, ctx.canelo, 230, 80, 180, true);
      if (a) cc.addChild(a);
      if (b) cc.addChild(b);
      const cap = new Text({ text: 'tú y yo, gordo', style: { fontFamily: 'Permanent Marker', fontSize: 26, fill: 0x3a2a1a } });
      cap.anchor.set(0.5);
      cap.position.set(0, 214);
      cc.addChild(cap);
    },
  },
];

const mod: SetModule = {
  cats: ({ canelo }) => [
    canelo,
    'luzterna',
    STAND_INS.cerito,
    { slug: canelo, bake: 'realismo' },
    { slug: 'luzterna', bake: 'realismo' },
    { slug: STAND_INS.cerito, bake: 'realismo' },
  ],
  build(ctx: SceneCtx): FilmSet {
    const b = ctx.baker;
    const k = ctx.k;
    // ---- the frozen dawn (realism), dimmed: the projection rules
    const bg = new Container();
    bg.addChild(Object.assign(new Sprite(sky(b, 'dawn', 3200, 1100, 4)), { x: -640, y: -420 }));
    bg.addChild(Object.assign(new Sprite(sea(b, 'dawn', 3600, 700, 5)), { x: -840, y: 600 }));
    const isl = island('dawn', { x: 300 });
    bg.addChild(isl.node);
    bg.addChild(new Graphics().rect(-900, -600, 3720, 2200).fill({ color: 0x05070e, alpha: 0.55 }));
    ctx.plane(bg, { z: 1300, bake: 'static' });

    const stage = new Container();
    const groundY = isl.ground(1400);
    const LUZ: [number, number] = [1420, groundY - 70];
    const CAN0: [number, number] = [470, isl.ground(470) + 4];
    const CER: [number, number] = [1580, isl.ground(1580) + 4];
    const ink = new Graphics();
    const pool = new Graphics();
    stage.addChild(pool);
    const cerito = ctx.actorAs('realismo', STAND_INS.cerito, 150);
    if (cerito) stage.addChild(cerito);
    const luz = ctx.actorAs('realismo', 'luzterna', 280);
    if (luz) stage.addChild(luz);
    const canelo = ctx.actorAs('realismo', ctx.canelo, 200);
    if (canelo) stage.addChild(canelo);
    stage.addChild(ink);
    // pasada 7: the lantern of the dawn — one pane black; broken at c29, that pane is all that is left in the frame
    const lamp = lantern(false, 1, true);
    const broken = lantern(true, 1, true);
    broken.visible = false;
    const knit = knitScarf(150);
    knit.visible = false;
    stage.addChild(lamp, broken, knit);
    const holdBeam = new Graphics();
    stage.addChild(holdBeam);
    const ember = new Graphics();
    stage.addChild(ember);
    ctx.plane(stage, { z: 1000 });
    // her lantern in the painting (silueta preset), in actor space
    let lanternAt: [number, number] = [-70, -150];
    if (luz?.puppet) {
      const p = luz.puppet;
      lanternAt = [(104 - p.anchor.x * p.W) * p.scale.x, (318 - p.anchor.y * p.H) * p.scale.y];
    }

    // ---- the projection: beam haze, iris (slides inside a round mask), brass rim, dust, cracks
    const proj = new Container();
    const beam = new Sprite(ctx.tex('li:beam'));
    beam.anchor.set(0.5);
    beam.blendMode = 'add';
    const slidesLayer = new Container();
    const mask = new Graphics();
    slidesLayer.mask = mask;
    const rim = new Sprite(ctx.tex('li:brass'));
    rim.anchor.set(0.5);
    const cracks = new Graphics();
    const dust: Sprite[] = [];
    const dustLayer = new Container();
    for (let i = 0; i < 28; i++) {
      const d = new Sprite(ctx.tex('li:beam'));
      d.anchor.set(0.5);
      d.blendMode = 'add';
      d.tint = 0xffe6b0;
      dust.push(d);
      dustLayer.addChild(d);
    }
    // pasada 7: the shadow of the black pane at the edge of the iris, on every slide (her memories go through a lantern
    // that is missing a pane): inside the round mask, a soft dark band beyond a chord on the right
    const notch = new Graphics();
    proj.addChild(beam, slidesLayer, mask, cracks, dustLayer, rim);
    // a projection on the morning mist: almost opaque, the stage shows faintly through
    proj.alpha = 0.9;
    ctx.plane(proj, { z: 1000, parallax: 0.6 });

    // bake every slide (+ its soft twin) and the washed photo
    const baked: { pt: PlateTex; slide: Slide; sp: Sprite; softSp: Sprite }[] = SLIDES.map((sl, i) => {
      const pt = bakePlate(b, R, glass(b, R * 2, sl.g[0], sl.g[1], i + 1), (cc, rr) => sl.draw(cc, rr, ctx));
      const sp = new Sprite(pt.tex);
      const soft = new Sprite(pt.soft);
      sp.anchor.set(0.5);
      soft.anchor.set(0.5);
      sp.visible = soft.visible = false;
      slidesLayer.addChild(sp, soft);
      return { pt, slide: sl, sp, softSp: soft };
    });
    const photo = baked[baked.length - 1];
    const washed = new Sprite(photo.pt.tex);
    washed.anchor.set(0.5);
    washed.tint = 0xe8e2d8;
    washed.visible = false;
    slidesLayer.addChild(washed);
    slidesLayer.addChild(notch);

    const softness = (memo: string | undefined): number => {
      if (!memo) return 0;
      const j = k.judged(memo);
      // on time: sharp · out of time / not pressed: softer (never lost)
      return j && (j.r === 'great' || j.r === 'hit') ? 0 : j ? 0.4 : 0.25;
    };

    return {
      update(lt, f) {
        const t = lt;
        const rm = f.rm;
        const ir = irisAt(t);
        const rad = (ir * VIS_H) / 2;
        // the flame breathes in the projection (tiny with «Reducir destellos»)
        const fl = t < c(33) ? 0.92 + 0.08 * flickerAt(t * 0.6, 4) * (f.rf ? 0.3 : 1) : 1;
        const [cx, cy] = CENTER;
        mask.clear();
        if (rad > 1) mask.circle(cx, cy, rad).fill(0xffffff);
        rim.position.set(cx, cy);
        rim.scale.set((rad * 2.06) / 1024);
        rim.visible = rad > 4;
        rim.alpha = t >= c(29) ? Math.max(0, 1 - (t - c(29)) / (4 * BAR)) : 1;
        beam.position.set(cx, cy);
        beam.scale.set((rad * 3.2) / 512);
        beam.alpha = 0.35 * fl * (t >= c(33) ? 0.5 : 1);
        // which slide: the current and the one leaving (slide sideways; from c21 the leaving one falls like glass)
        let cur = 0;
        for (let i = 0; i < baked.length; i++) if (t >= baked[i].slide.t) cur = i;
        const changeDur = t > c(17) ? 0.35 : 0.7;
        const since = t - baked[cur].slide.t;
        const pIn = sm(since / changeDur);
        for (const x of baked) x.sp.visible = x.softSp.visible = false;
        const show = (x: (typeof baked)[number], dx: number, dy: number, rot: number, a: number) => {
          const s = softness(x.slide.memo);
          const sc = rad / R;
          for (const [sp, al] of [
            [x.sp, a * (1 - s)],
            [x.softSp, a * s],
          ] as [Sprite, number][]) {
            sp.visible = al > 0.01;
            sp.position.set(cx + dx, cy + dy);
            sp.rotation = rot;
            sp.scale.set(sc);
            sp.alpha = al * fl;
          }
        };
        const cr = baked[cur];
        if (cur > 0 && since < changeDur) {
          const prev = baked[cur - 1];
          if (rm) show(prev, 0, 0, 0, 1 - pIn);
          else if (t > c(21)) show(prev, 0, pIn * rad * 1.6, pIn * 0.5, 1 - pIn * 0.6);
          else show(prev, -pIn * rad * 2.1, 0, 0, 1);
        }
        show(cr, rm ? 0 : (1 - pIn) * rad * 2.1, 0, 0, rm ? pIn : 1);
        notch.clear();
        if (DEUDA_FALSA && rad > 6) {
          const x0 = cx + rad * 0.68;
          notch.rect(x0 - rad * 0.08, cy - rad, rad * 0.08, rad * 2).fill({ color: 0x050407, alpha: 0.32 * fl });
          notch.rect(x0, cy - rad, rad * 0.4, rad * 2).fill({ color: 0x050407, alpha: 0.72 * fl });
        }
        // c29–33: the photo WASHES (colour and weight drain, fine cracks), then holds pale under the ember
        const wash = sm((t - c(29)) / (4 * BAR));
        if (cr === photo && wash > 0) {
          cr.sp.alpha *= 1 - wash * 0.85;
          washed.visible = true;
          washed.position.set(cx, cy);
          washed.scale.set(rad / R);
          washed.alpha = wash * 0.7 * fl;
        } else washed.visible = false;
        // cracks: a black crack at the «Error» of c8.875, the rim cracking at c21, fine lines in the wash
        cracks.clear();
        const crack = (seed: number, n: number, w: number, col: number, a: number) => {
          let s = seed * 7919;
          const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
          for (let i = 0; i < n; i++) {
            let x = cx + (r() - 0.5) * rad * 1.6;
            let y = cy + (r() - 0.5) * rad * 1.6;
            cracks.moveTo(x, y);
            for (let j = 0; j < 4; j++) {
              x += (r() - 0.5) * rad * 0.5;
              y += (r() - 0.5) * rad * 0.5;
              cracks.lineTo(x, y);
            }
          }
          cracks.stroke({ width: w, color: col, alpha: a });
        };
        if (t > c(8.875) && t < c(9) + 0.4) crack(3, 1, 4, 0x000000, 0.9);
        if (t > c(21) && t < c(29)) crack(11, Math.min(6, 1 + Math.floor((t - c(21)) / BAR)), 2, 0xeaf2ff, 0.7);
        if (wash > 0 && t < c(33)) crack(23, Math.floor(wash * 14), 1, 0xffffff, 0.5 * wash);
        // dust in the beam
        for (let i = 0; i < dust.length; i++) {
          const d = dust[i];
          const a = (i * 2.399 + t * (rm ? 0.03 : 0.12)) % (Math.PI * 2);
          const rr = rad * (0.2 + ((i * 0.37) % 0.75));
          d.position.set(cx + Math.cos(a) * rr, cy + Math.sin(a * 1.3) * rr * 0.8 + (rm ? 0 : Math.sin(t * 0.7 + i) * 6));
          d.scale.set(0.016 + (i % 3) * 0.008);
          d.alpha = rad > 20 ? 0.35 * fl : 0;
        }

        // ---- the stage: the strike, the ink, Canelo held by her beam, she kneels, the lantern breaks, the scarf falls
        const kneel = sm((t - c(25) - 1) / 2.4);
        const lx = LUZ[0];
        const ly = LUZ[1] + kneel * 64;
        if (luz) {
          luz.pose(t, lx, ly, { flip: false });
          if (luz.puppet) luz.puppet.crouch = kneel;
        }
        if (cerito) cerito.pose(t, CER[0], CER[1], { flip: true });
        // Canelo: still → runs to her at c17 → held by the beam (a little push back) → lets him come at c25
        const run = sm((t - c(17) - 1) / 1.6);
        const come = sm((t - c(25)) / 3.4);
        const held = t > c(17) + 2.6 && t < c(25) ? Math.sin(t * 9) * 3 : 0;
        const cxCan = CAN0[0] + run * 140 + come * 640 + (rm ? 0 : held);
        if (canelo) {
          canelo.pose(t, cxCan, isl.ground(cxCan) + 4, { flip: true });
          if (canelo.puppet) canelo.puppet.walk = (t > c(17) + 1 && t < c(17) + 2.6) || (t > c(25) && t < c(25) + 3.4) ? 1 : 0;
        }
        // her beam holding him away from the ink (c17+2.6 → c25)
        holdBeam.clear();
        const lantX = lx + lanternAt[0];
        const lantY = ly + lanternAt[1];
        if (t > c(17) + 2 && t < c(25) + 0.6) {
          const a = Math.min(1, (t - c(17) - 2) / 0.6) * (t > c(25) ? 1 - (t - c(25)) / 0.6 : 1);
          holdBeam.poly([lantX, lantY - 10, lantX, lantY + 10, cxCan + 30, isl.ground(cxCan) - 40, cxCan + 30, isl.ground(cxCan) - 190]).fill({ color: COL.lanternBlue, alpha: 0.22 * a });
        }
        // the lantern: whole until c29, then broken (she does not let go); the ember at c33
        const lanternWhole = t < c(29);
        lamp.visible = lanternWhole;
        broken.visible = !lanternWhole;
        lamp.position.set(lantX, lantY + 30);
        broken.position.set(lantX, lantY + 30);
        // the strike across her (still), sparking at c8.875, a palm longer at c13; the ink spills from c17
        ink.clear();
        const grow = 1 + 0.25 * sm((t - c(13)) / 1.2);
        const x0 = lx - 150;
        const y0 = ly - 250;
        const x1 = lx + 130 * grow;
        const y1 = ly - 40 + 30 * grow;
        inkStroke(ink, [
          [x0, y0],
          [(x0 + x1) / 2, (y0 + y1) / 2 + 8],
          [x1, y1],
        ], 30, COL.ink, 1, 5);
        if (t > c(8.875) && t < c(8.875) + 1.2 && !f.rf) for (let i = 0; i < 6; i++) ink.circle(x0 + (x1 - x0) * ((i * 0.17 + t * 2) % 1), y0 + (y1 - y0) * ((i * 0.17 + t * 2) % 1) - 10 - (i % 3) * 8, 3).fill(0xffffff);
        pool.clear();
        const spill = sm((t - c(17)) / (4 * BAR));
        if (spill > 0) pool.ellipse(lx - 40, isl.ground(lx) + 6, 40 + 260 * spill, 10 + 30 * spill).fill({ color: COL.ink, alpha: 0.9 });
        // the knitted scarf falls from her sleeve at c29 and stays by her
        const fall = sm((t - c(29)) / 1.4);
        knit.visible = t >= c(29);
        knit.position.set(lantX + 40 - fall * 30, lantY + 40 + fall * (isl.ground(lx) - lantY - 40));
        knit.rotation = (1 - fall) * -0.9 + fall * 0.08;
        // c33–37: an ember warms the photo and the scarf, smaller on every attack
        ember.clear();
        if (t >= c(33) && t < c(37)) {
          const e = Math.max(0, 1 - Math.floor((t - c(33)) / 2.4) / 8);
          ember.circle(knit.position.x, knit.position.y, 60 * e).fill({ color: COL.orange, alpha: 0.18 * e });
        }
      },
      look(lt) {
        // the wash drains colour and weight; the clean piano is almost colourless; after the cut, black
        const w = sm((lt - c(29)) / (4 * BAR));
        if (lt >= c(37)) return { expo: 0 };
        return w > 0 ? { sat: 1.05 - 0.75 * w, contrast: 1.02 - 0.18 * w, lift: 0.04 * w, flicker: 0.25 * (1 - w) } : null;
      },
      dirtAt: () => [CENTER[0] / 1920, CENTER[1] / 1080],
    };
  },
};
export default mod;
