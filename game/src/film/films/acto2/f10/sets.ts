/**
 * F10 «Villanos sueltos» — the sets (shot list in ./index.ts). A 1940s newsreel's SPINNING NEWSPAPER: each front page of
 * «El Clarín Viñeta» is composed once and BAKED to a texture (masthead in blackletter, a condensed headline, a halftone
 * photo, columns), then spun in from the dark of the printing press and stopped dead on the fanfare.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import {
  Beam,
  Bitacora,
  CMY,
  FLAME,
  INK,
  LANTERN,
  SLUG,
  bob,
  dotsFill,
  fitArcTo,
  flame,
  glow,
  jolt,
  lanternAt,
  luzOf,
  outBack,
  outExpo,
  realArcs,
  rnd,
  seg,
  sm,
  speedLines,
  stillRig,
  tailTip,
  word,
  yarnBall,
} from '../kit';

export const PW = 1600;
export const PH = 1000;
const NEWS = 0xefe6cf;
const NINK = 0x1c1712;

/** one front page (above the fold): masthead, date line, headline, photo box, columns; `photo` fills the box */
interface FrontOpts {
  head: string;
  sub?: string;
  /** the photo box [x, y, w, h] in page px */
  box: [number, number, number, number];
  photo: (c: Container, w: number, h: number) => void;
  /** headline size */
  size?: number;
  extra?: (c: Container) => void;
}
function front(ctx: SceneCtx, o: FrontOpts): Container {
  const k = ctx.k;
  const c = new Container();
  const paper = ctx.tex('pe:paper') as Texture | undefined;
  if (paper) {
    const p = new Sprite(paper);
    p.setSize(PW, PH);
    c.addChild(p);
  } else c.addChild(new Graphics().rect(0, 0, PW, PH).fill(NEWS));
  const g = new Graphics();
  g.rect(0, 0, PW, PH).stroke({ width: 6, color: 0xb8ab8a });
  g.rect(40, 150, PW - 80, 5).fill(NINK).rect(40, 162, PW - 80, 2).fill(NINK);
  g.rect(40, 210, PW - 80, 2).fill(NINK);
  c.addChild(g);
  const mast = word(k, 'El Clarín Viñeta', { fontFamily: 'UnifrakturMaguntia', fontSize: 112, fill: NINK });
  mast.position.set(PW / 2, 86);
  c.addChild(mast);
  const ears = word(k, 'EDICIÓN EXTRA', { fontFamily: 'Bebas Neue', fontSize: 30, fill: NINK, letterSpacing: 4 });
  ears.position.set(150, 86);
  const ears2 = word(k, '5 CENTAVOS', { fontFamily: 'Bebas Neue', fontSize: 30, fill: NINK, letterSpacing: 4 });
  ears2.position.set(PW - 150, 86);
  const date = word(k, 'CIUDAD MAYÚSCULA  ·  HOY, CON TODO Y LO QUE PASE  ·  AÑO XLII', { fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: 22, fill: NINK, letterSpacing: 3 });
  date.position.set(PW / 2, 186);
  c.addChild(ears, ears2, date);
  const hl = word(k, o.head, { fontFamily: 'Anton', fontSize: o.size ?? 128, fill: NINK, align: 'center', letterSpacing: 1, wordWrap: true, wordWrapWidth: PW - 120, lineHeight: (o.size ?? 128) * 1.02 });
  hl.position.set(PW / 2, 228 + hl.height / 2);
  c.addChild(hl);
  let y0 = 228 + hl.height + 14;
  if (o.sub) {
    const sb = word(k, o.sub, { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 40, fill: NINK });
    sb.position.set(PW / 2, y0 + 24);
    c.addChild(sb);
    y0 += 58;
  }
  // the photo box (the given box is moved below the headline if they'd overlap)
  const [bx, by0, bw, bh0] = o.box;
  const by = Math.max(by0, y0 + 10);
  const bh = Math.min(bh0, PH - 40 - by);
  const ph = new Container();
  const frame = new Graphics().rect(0, 0, bw, bh).fill(0xd8ccb0);
  ph.addChild(frame);
  o.photo(ph, bw, bh);
  ph.addChild(dotsFill(ctx.tex('ar:dots') ?? ctx.tex('ep:dots'), bw, bh, { tint: NINK, scale: 0.18, alpha: 0.12 }));
  const m = new Graphics().rect(0, 0, bw, bh).fill(0xffffff);
  ph.mask = m;
  const ph2 = new Container();
  ph2.addChild(ph, m, new Graphics().rect(0, 0, bw, bh).stroke({ width: 5, color: NINK }));
  ph2.position.set(bx, by);
  c.addChild(ph2);
  // the columns: grey lines of text left and right of the photo
  const col = new Graphics();
  const colX = bx > 300 ? [[40, bx - 30]] : [[bx + bw + 30, PW - 40]];
  for (const [x0, x1] of colX)
    for (let y = by; y < PH - 40; y += 22) {
      const w = (x1 - x0) * (0.75 + rnd(y) * 0.25);
      col.rect(x0, y, w, 8).fill({ color: NINK, alpha: 0.45 });
    }
  c.addChild(col);
  o.extra?.(c);
  return c;
}

/** halftone shading over a region of a photo (the press look) */
function grain(ph: Container, w: number, h: number) {
  ph.addChild(new Graphics().rect(0, 0, w, h).fill({ color: 0x000000, alpha: 0.06 }));
}
/** a brick wall */
function bricks(g: Graphics, w: number, h: number, col = 0x8a6a52) {
  g.rect(0, 0, w, h).fill(col);
  for (let y = 0; y < h; y += 34) for (let x = ((y / 34) % 2) * 34; x < w; x += 68) g.rect(x + 2, y + 2, 64, 30).fill({ color: 0x000000, alpha: 0.08 + rnd(x + y) * 0.06 }).stroke({ width: 2, color: 0x3a2a20, alpha: 0.6 });
}
/** a quick halftone ship (a small galleon) at (x, y), size s, `sus` = the suspicious low angle */
function ship(g: Graphics, x: number, y: number, s: number, sus = false) {
  const tilt = sus ? 0.12 : 0;
  const P = (u: number, v: number): [number, number] => [x + u * s * Math.cos(tilt) - v * s * Math.sin(tilt), y + u * s * Math.sin(tilt) + v * s * Math.cos(tilt)];
  g.poly([...P(-200, 0), ...P(200, 0), ...P(160, 70), ...P(-160, 70)]).fill(0x3a2a20).stroke({ width: 5, color: NINK });
  g.poly([...P(-180, -10), ...P(180, -10), ...P(170, 10), ...P(-170, 10)]).fill(0x6a4a30);
  for (const mx of [-90, 40]) {
    g.poly([...P(mx - 4, -10), ...P(mx + 4, -10), ...P(mx + 4, -260), ...P(mx - 4, -260)]).fill(NINK);
    g.poly([...P(mx - 70, -230), ...P(mx + 70, -230), ...P(mx + 60, -70), ...P(mx - 60, -70)]).fill(0xe8dcc0).stroke({ width: 4, color: NINK });
  }
  g.poly([...P(40, -270), ...P(110, -255), ...P(40, -240)]).fill(NINK);
  // the hull's dark side, the cannons' ports
  for (let i = 0; i < 4; i++) g.circle(...P(-120 + i * 80, 34), 9 * s).fill(NINK);
}

export const rotativa: SetModule = {
  cats: [SLUG.disruptor, SLUG.estambre],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    // the press, in the dark: rays from the centre (the newsreel glow) and the drums spinning
    const back = new Container();
    const bg = new Graphics().rect(-1200, -900, 4320, 2880).fill(0x15110c);
    back.addChild(bg);
    const rays = new Graphics();
    speedLines(rays, 0, 0, 80, 2400, { n: 36, color: 0x3a2e1e, seed: 2, width: 0.04 });
    rays.position.set(960, 540);
    back.addChild(rays);
    const drums = new Graphics();
    for (const [x, y, r] of [
      [140, 160, 220],
      [1800, 940, 260],
      [1820, 120, 160],
      [100, 960, 180],
    ] as const) {
      drums.circle(x, y, r).fill(0x241c12).stroke({ width: 10, color: 0x0a0806 });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        drums.moveTo(x, y).lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r).stroke({ width: 4, color: 0x0a0806, alpha: 0.6 });
      }
    }
    back.addChild(drums);
    ctx.plane(back, { z: 2200 });

    // the five front pages, baked once
    const arc = realArcs()[0];
    const pages: Container[] = [
      front(ctx, {
        head: '¡FUGA EN LA CÁRCEL DE VILLANOS!',
        box: [420, 470, 760, 470],
        photo: (ph, w, h) => {
          const g = new Graphics();
          bricks(g, w, h);
          // the hole: a jagged gap with rubble, the darkness inside
          const hole: number[] = [];
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            const r = (i % 2 ? 110 : 160) + rnd(i + 5) * 40;
            hole.push(w * 0.52 + Math.cos(a) * r * 1.1, h * 0.55 + Math.sin(a) * r * 0.8);
          }
          g.poly(hole).fill(0x0e0b08).stroke({ width: 6, color: NINK });
          for (let i = 0; i < 14; i++) g.rect(w * 0.3 + rnd(i) * w * 0.45, h - 40 - rnd(i + 3) * 40, 20 + rnd(i + 9) * 40, 14 + rnd(i) * 20).fill(0x6a5242).stroke({ width: 2, color: NINK });
          // the sign and the fresh graffiti
          g.rect(40, 30, 360, 60).fill(0xe8dcc0).stroke({ width: 4, color: NINK });
          g.moveTo(w * 0.72, 60).bezierCurveTo(w * 0.8, 20, w * 0.86, 110, w * 0.94, 50).stroke({ width: 16, color: 0x2a2018, cap: 'round' });
          g.moveTo(w * 0.74, 120).lineTo(w * 0.9, 140).stroke({ width: 12, color: 0x2a2018, cap: 'round' });
          ph.addChild(g);
          const sign = word(k, 'CÁRCEL DE VILLANOS', { fontFamily: 'Bebas Neue', fontSize: 44, fill: NINK, letterSpacing: 3 });
          sign.position.set(220, 60);
          ph.addChild(sign);
          grain(ph, w, h);
        },
      }),
      front(ctx, {
        head: 'LOS DISRUPTORES: "QUE RESPIREN"',
        box: [60, 470, 820, 480],
        photo: (ph, w, h) => {
          const g = new Graphics();
          bricks(g, w, h, 0x7a6252);
          // the bars of the jail and the tag across them
          for (let i = 0; i < 9; i++) g.rect(w * 0.18 + i * 60, 30, 14, h - 60).fill(0x3a342e).stroke({ width: 3, color: NINK });
          g.rect(w * 0.15, 30, 580, 18).fill(0x3a342e).rect(w * 0.15, h - 48, 580, 18).fill(0x3a342e);
          ph.addChild(g);
          const tag = word(k, 'QUE RESPIREN', { fontFamily: 'Permanent Marker', fontSize: 92, fill: 0x2a2018 });
          tag.position.set(w * 0.48, h * 0.42);
          tag.rotation = -0.08;
          ph.addChild(tag);
          const drips = new Graphics();
          for (let i = 0; i < 8; i++) drips.rect(w * 0.2 + i * 70, h * 0.48, 5, 30 + rnd(i) * 70).fill(0x2a2018);
          ph.addChild(drips);
          const dis = ctx.still(SLUG.disruptor, 0.5, 0.97);
          if (dis) {
            dis.setSize((dis.width / dis.height) * 380, 380);
            dis.position.set(w * 0.86, h + 20);
            dis.scale.x *= -1;
            ph.addChild(dis);
          }
          const spray = new Graphics();
          for (let i = 0; i < 40; i++) spray.circle(w * 0.7 - rnd(i) * 120, h * 0.38 + (rnd(i + 3) - 0.5) * 90, 2 + rnd(i + 7) * 4).fill({ color: 0x2a2018, alpha: 0.6 });
          ph.addChild(spray);
          grain(ph, w, h);
        },
      }),
      front(ctx, {
        head: '¡LA BARCAZA DEL MUELLE 9, ATRAPADA!',
        box: [420, 470, 760, 470],
        photo: (ph, w, h) => {
          const g = new Graphics();
          g.rect(0, 0, w, h * 0.5).fill(0xb8ac90);
          g.rect(0, h * 0.5, w, h * 0.5).fill(0x6e6450);
          for (let i = 0; i < 10; i++) g.rect(rnd(i) * w, h * 0.55 + rnd(i + 4) * h * 0.4, 80, 4).fill({ color: 0xe8dcc0, alpha: 0.5 });
          // the barge with passengers, caught in a GIANT yarn knot
          g.poly([w * 0.25, h * 0.62, w * 0.85, h * 0.62, w * 0.8, h * 0.78, w * 0.3, h * 0.78]).fill(0x4a3a2a).stroke({ width: 5, color: NINK });
          g.rect(w * 0.33, h * 0.48, w * 0.42, h * 0.14).fill(0xe8dcc0).stroke({ width: 4, color: NINK });
          for (let i = 0; i < 7; i++) g.circle(w * 0.36 + i * 46, h * 0.53, 13).fill(NINK);
          for (let i = 0; i < 9; i++) {
            const a = i * 0.7;
            g.ellipse(w * 0.55 + Math.cos(a) * 60, h * 0.6 + Math.sin(a) * 30, 230 - i * 8, 90 + i * 4).stroke({ width: 10, color: 0x9a4a3a, alpha: 0.85 });
          }
          // the dock with running civilians
          g.rect(0, h * 0.4, w * 0.22, 30).fill(0x5a4a3a).stroke({ width: 4, color: NINK });
          for (let i = 0; i < 4; i++) {
            const x = 30 + i * 40;
            g.circle(x, h * 0.3, 12).fill(NINK);
            g.rect(x - 8, h * 0.32, 16, 26).fill(NINK);
            g.moveTo(x - 6, h * 0.38).lineTo(x - 18, h * 0.4).moveTo(x + 6, h * 0.38).lineTo(x + 16, h * 0.4).stroke({ width: 5, color: NINK });
          }
          ph.addChild(g);
          grain(ph, w, h);
        },
      }),
      front(ctx, {
        head: 'EL ESTAMBRE ANDA SUELTO',
        sub: 'Lo que toca, lo enreda',
        box: [60, 460, 760, 500],
        size: 140,
        photo: (ph, w, h) => {
          ph.addChild(new Graphics().rect(0, 0, w, h).fill(0x9a8e74));
          // his painting, through the newsprint bake (the code-drawn wool thug only if it isn't loaded)
          const es = ctx.still(SLUG.estambre, 0.5, 0.97);
          if (es) {
            es.setSize((es.width / es.height) * h * 1.08, h * 1.08);
            es.position.set(w * 0.5, h + 24);
            ph.addChild(es);
          } else ph.addChild(estambre(w * 0.5, h * 1.0, 0.78));
          grain(ph, w, h);
        },
        extra: (c) => {
          // THE RULE in a small panel on the same page: a thread ties a ship's cannon — it doesn't fire
          const ix = 880;
          const iy = 560;
          const iw = 640;
          const ih = 380;
          const p = new Container();
          const g = new Graphics();
          g.rect(0, 0, iw, ih).fill(0xd8ccb0).stroke({ width: 5, color: NINK });
          g.rect(0, ih * 0.72, iw, ih * 0.28).fill(0x8a7e66);
          // the cannon on its carriage (left)
          g.roundRect(40, ih * 0.5, 180, 56, 18).fill(0x3a342e).stroke({ width: 4, color: NINK });
          g.circle(80, ih * 0.66, 30).fill(0x5a4a3a).stroke({ width: 4, color: NINK }).circle(180, ih * 0.66, 30).fill(0x5a4a3a).stroke({ width: 4, color: NINK });
          // the thread from the right ties the muzzle shut (a knot and loops)
          g.moveTo(iw, 40).bezierCurveTo(iw * 0.7, 20, iw * 0.55, ih * 0.6, 230, ih * 0.55).stroke({ width: 7, color: 0x9a4a3a });
          for (let i = 0; i < 4; i++) g.ellipse(226, ih * 0.57, 22 + i * 6, 34 - i * 3).stroke({ width: 6, color: 0x9a4a3a });
          // where the shot WOULD have gone (the real flight, dashed) — and the puff that never left
          const pts = fitArcTo(arc, [240, ih * 0.55], [iw - 40, ih * 0.7], 40);
          for (let i = 2; i < pts.length; i += 3) g.moveTo(pts[i - 1][0], pts[i - 1][1]).lineTo(pts[i][0], pts[i][1]);
          g.stroke({ width: 4, color: NINK, alpha: 0.45 });
          g.moveTo(iw - 70, ih * 0.62).lineTo(iw - 30, ih * 0.78).moveTo(iw - 30, ih * 0.62).lineTo(iw - 70, ih * 0.78).stroke({ width: 8, color: 0xb3261e });
          p.addChild(g);
          const pf = word(k, 'pfff…', { fontFamily: 'Bangers', fontSize: 54, fill: NINK });
          pf.position.set(290, ih * 0.32);
          const cap = word(k, 'CAÑÓN ENREDADO: NO DISPARA', { fontFamily: 'Bebas Neue', fontSize: 40, fill: NINK, letterSpacing: 2 });
          cap.position.set(iw / 2, ih - 26);
          p.addChild(pf, cap);
          p.position.set(ix, iy);
          c.addChild(p);
        },
      }),
      front(ctx, {
        head: '¿FORASTEROS O VILLANOS?',
        box: [60, 420, 1120, 540],
        size: 150,
        photo: (ph, w, h) => {
          const g = new Graphics();
          g.rect(0, 0, w, h).fill(0x5a5040);
          g.rect(0, h * 0.7, w, h * 0.3).fill(0x3a342a);
          ship(g, w * 0.5, h * 0.72, 1.3, true);
          // the dramatic shadow (it makes us look guilty)
          g.poly([0, 0, w * 0.35, 0, w * 0.1, h, 0, h]).fill({ color: 0x000000, alpha: 0.35 });
          ph.addChild(g);
          grain(ph, w, h);
        },
      }),
    ];
    const tex = pages.map((p) => {
      const r = ctx.baker.raster(p, { res: 1 });
      p.destroy({ children: true });
      return r.tex;
    });
    const stack = new Container();
    const spr = tex.map((t) => {
      const s = new Sprite(t);
      s.anchor.set(0.5);
      s.position.set(960, 540);
      stack.addChild(s);
      return s;
    });
    ctx.plane(stack, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        rays.rotation = rm ? 0 : lt * 0.05;
        drums.rotation = 0;
        // which page: each spins in at SPIN[i] and stops dead at STOP[i]
        let cur = -1;
        for (let i = 0; i < SPIN.length; i++) if (lt >= SPIN[i]) cur = i;
        spr.forEach((s, i) => {
          s.visible = i === cur || (i === cur - 1 && lt < STOP[cur]);
          if (!s.visible) return;
          if (i === cur - 1) {
            // the old page drops away behind the new one
            const q = seg(lt, SPIN[cur], STOP[cur]);
            s.scale.set(FIT * (1 - q * 0.15));
            s.alpha = 1 - q;
            s.rotation = 0;
            return;
          }
          const p = seg(lt, SPIN[i], STOP[i]);
          const e = outExpo(p);
          const [jx, jy] = jolt(lt, STOP[i], 10, rm, 0.25);
          if (rm) {
            s.rotation = 0;
            s.scale.set(FIT);
            s.alpha = sm(p * 1.5);
          } else {
            s.rotation = (1 - e) * Math.PI * 4 * (i % 2 ? -1 : 1);
            const bump = lt > STOP[i] ? Math.max(0, 1 - (lt - STOP[i]) / 0.2) * 0.04 : 0;
            s.scale.set(FIT * (0.04 + 0.96 * e) * (1 + bump));
            s.alpha = 1;
          }
          s.position.set(960 + jx, 540 + jy);
        });
      },
    };
  },
};
/** the newsreel's beats (scene-local): each page spins in at SPIN and stops dead at STOP (the fanfare) */
export const SPIN = [0.2, 4.15, 9.2, 14.25, 19.3];
export const STOP = [1.26, 5.05, 10.1, 15.16, 20.2];
const FIT = 1.0;

/** EL ESTAMBRE (code-drawn: a wool thug — the lower half unravels into a whirl of yarn, fists of yarn balls) */
function estambre(x: number, y: number, s: number): Container {
  const c = new Container();
  const g = new Graphics();
  const P = (u: number, v: number): [number, number] => [x + u * s, y + v * s];
  // the whirl of yarn instead of legs
  for (let i = 0; i < 9; i++) g.ellipse(...P(0, -40 - i * 18), 150 - i * 9, 26).stroke({ width: 9, color: i % 2 ? 0x8a7a5a : 0x5a5038 });
  // the striped shirt (olive and sand)
  g.roundRect(...P(-120, -380), 240 * s, 220 * s, 60 * s).fill(0x8a8a58).stroke({ width: 6, color: NINK });
  for (let i = 0; i < 5; i++) g.rect(...P(-118, -350 + i * 42), 236 * s, 16 * s).fill(0xc8b88a);
  // the wool head: a fuzzy ball, cat ears, a thug's grin
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    g.circle(...P(Math.cos(a) * 92, -470 + Math.sin(a) * 84), 22 * s).fill(0xb8a88a).stroke({ width: 3, color: NINK });
  }
  g.circle(...P(0, -470), 88 * s).fill(0xb8a88a);
  g.poly([...P(-80, -520), ...P(-64, -600), ...P(-26, -548)]).fill(0xb8a88a).stroke({ width: 5, color: NINK });
  g.poly([...P(80, -520), ...P(64, -600), ...P(26, -548)]).fill(0xb8a88a).stroke({ width: 5, color: NINK });
  for (let i = 0; i < 8; i++) g.moveTo(...P(-70 + i * 20, -500)).bezierCurveTo(...P(-60 + i * 20, -470), ...P(-80 + i * 20, -440), ...P(-66 + i * 20, -420)).stroke({ width: 3, color: 0x7a6a4a });
  g.moveTo(...P(-40, -500)).lineTo(...P(-14, -490)).moveTo(...P(40, -500)).lineTo(...P(14, -490)).stroke({ width: 7, color: NINK });
  g.circle(...P(-26, -478), 8 * s).fill(NINK).circle(...P(26, -478), 8 * s).fill(NINK);
  g.moveTo(...P(-44, -436)).quadraticCurveTo(...P(0, -410), ...P(46, -440)).stroke({ width: 7, color: NINK });
  g.rect(...P(-14, -432), 10 * s, 10 * s).fill(0xf4ecd8).rect(...P(10, -430), 10 * s, 10 * s).fill(0xf4ecd8);
  // arms and the yarn-ball fists
  g.moveTo(...P(-110, -340)).quadraticCurveTo(...P(-200, -300), ...P(-220, -230)).stroke({ width: 34 * s, color: 0x8a8a58, cap: 'round' });
  g.moveTo(...P(110, -340)).quadraticCurveTo(...P(190, -360), ...P(230, -420)).stroke({ width: 34 * s, color: 0x8a8a58, cap: 'round' });
  yarnBall(g, ...P(-222, -210), 52 * s, 0xb3463a, NINK);
  yarnBall(g, ...P(236, -440), 52 * s, 0xb3463a, NINK);
  c.addChild(g);
  return c;
}

// ------------------------------------------------------------------ 2 · the real paper, in her hand
export const mano: SetModule = {
  cats: () => [{ slug: SLUG.luz, bake: 'aracnido' }, { slug: SLUG.canelo, bake: 'periodico' }],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    // the comic city behind (out of focus) — a dusk band with lit windows
    const city = new Graphics();
    city.rect(-1200, -900, 4320, 2880).fill(0x2a1450);
    for (let i = 0; i < 30; i++) {
      const x = -900 + i * 160;
      const h = 300 + rnd(i) * 500;
      city.rect(x, 1100 - h, 130, h).fill(0x3a1a5e).stroke({ width: 6, color: INK });
      for (let j = 0; j < 8; j++) if (rnd(i * 13 + j) > 0.4) city.rect(x + 20 + (j % 3) * 34, 1120 - h + Math.floor(j / 3) * 60, 16, 26).fill(0xffd23a);
    }
    ctx.plane(city, { z: 3000, bake: 'dof', blur: 18, dof: 1500 });
    // the paper (the last front page, now in the world — with the corner box) and her lantern's light on it
    const paper = new Container();
    const page = front(ctx, {
      head: '¿FORASTEROS O VILLANOS?',
      box: [60, 420, 1120, 540],
      size: 150,
      photo: (ph, w, h) => {
        const g = new Graphics();
        g.rect(0, 0, w, h).fill(0x5a5040);
        g.rect(0, h * 0.7, w, h * 0.3).fill(0x3a342a);
        ship(g, w * 0.5, h * 0.72, 1.3, true);
        g.poly([0, 0, w * 0.35, 0, w * 0.1, h, 0, h]).fill({ color: 0x000000, alpha: 0.35 });
        ph.addChild(g);
      },
    });
    paper.addChild(page);
    // the corner box: Canelo asleep standing on the deck, his flame small (the act's signal)
    const box = new Container();
    const bg = new Graphics().rect(0, 0, 330, 300).fill(0xd8ccb0).stroke({ width: 6, color: NINK });
    box.addChild(bg);
    const can = ctx.stillAs('periodico', SLUG.canelo, 0.5, 0.97);
    if (can) {
      can.setSize((can.width / can.height) * 230, 230);
      can.position.set(165, 280);
      box.addChild(can);
    }
    const cRig = stillRig(SLUG.canelo, 230);
    const tailAt: [number, number] = cRig?.tail ? [165 + cRig.tail[0], 280 + cRig.tail[1]] : [255, 190];
    const zz = word(k, 'z z z', { fontFamily: 'Bangers', fontSize: 40, fill: NINK });
    zz.position.set(250, 60);
    const capB = word(k, 'UN TRIPULANTE, DORMIDO DE PIE', { fontFamily: 'Bebas Neue', fontSize: 24, fill: NINK, letterSpacing: 2 });
    capB.position.set(165, 22);
    box.addChild(zz, capB);
    box.position.set(1220, 640);
    paper.addChild(box);
    const flameG = new Graphics();
    paper.addChild(flameG);
    // where the «VILLANOS» word sits on the page (headline line 1, right half) — her beam crosses it out
    const lightInk = new Graphics();
    paper.addChild(lightInk);
    const guapos = word(k, 'GUAPOS', { fontFamily: 'Permanent Marker', fontSize: 130, fill: 0xbfeeff, stroke: { color: LANTERN, width: 10, join: 'round' } });
    guapos.position.set(840, 392);
    guapos.rotation = -0.07;
    const gMask = new Graphics();
    guapos.mask = gMask;
    paper.addChild(guapos, gMask);
    paper.pivot.set(PW / 2, PH / 2);
    paper.position.set(1020, 560);
    paper.rotation = -0.03;
    const pP = new Container();
    pP.addChild(paper);
    ctx.plane(pP, { z: 1000 });
    // Luzterna at the left, close (cropped), lantern up
    const rig = luzOf(ctx, 900, 'aracnido');
    const beam = new Beam(ctx);
    const lamp = glow(ctx, LANTERN, 200, 0.8);
    const near = new Container();
    if (rig.actor) near.addChild(rig.actor);
    near.addChild(beam, lamp);
    ctx.plane(near, { z: 760 });
    // the Bitácora rises over the paper (screen)
    const bit = new Bitacora(ctx, 'Los civiles. Y nuestra cara en el periódico.', { enter: 'rise', w: 1400, size: 60, top: 600 });
    ctx.plane(bit, { z: 0, screen: true });
    // the word VILLANOS on the paper (page px): line 1 of the 150 px headline, right part
    const VX0 = 520;
    const VX1 = 1090;
    const VY = 462;
    return {
      update(lt, f) {
        const rm = f.rm;
        rig.actor?.pose(lt, 120, 1180 + bob(lt, rm, 8), { rot: 0.06, flip: true });
        const la = lanternAt(rig);
        lamp.position.set(la[0], la[1]);
        // the beam: first across VILLANOS (a strike), then writing GUAPOS above, then rests
        const strike = seg(lt, 0.4, 1.3);
        const write = seg(lt, 1.4, 2.8);
        let tx: number;
        let ty: number;
        if (lt < 1.4) {
          tx = VX0 + (VX1 - VX0) * strike;
          ty = VY + Math.sin(strike * 9) * 6;
        } else {
          tx = 600 + write * 480;
          ty = 392 + Math.sin(write * 26) * 30;
        }
        // page px → plane px (the paper is rotated and centred)
        const c = Math.cos(paper.rotation);
        const s = Math.sin(paper.rotation);
        const px = paper.x + (tx - PW / 2) * c - (ty - PH / 2) * s;
        const py = paper.y + (tx - PW / 2) * s + (ty - PH / 2) * c;
        // the near plane's parallax differs a little: aim in screen space through toScreen
        const on = lt < 3.2 ? 1 : 1 - seg(lt, 3.2, 3.8) * 0.6;
        beam.set(la, [px - 60, py + 40], 60, 0.5 * on);
        const g = lightInk.clear();
        if (strike > 0) g.moveTo(VX0, VY).lineTo(VX0 + (VX1 - VX0) * strike, VY + 4).stroke({ width: 16, color: LANTERN, alpha: 0.9 }).moveTo(VX0, VY).lineTo(VX0 + (VX1 - VX0) * strike, VY + 4).stroke({ width: 5, color: 0xffffff, alpha: 0.9 });
        gMask.clear().rect(560, 280, 600 * (rm ? (write > 0 ? 1 : 0) : write) + 20, 230).fill(0xffffff);
        guapos.visible = write > 0;
        // the corner box flame (small), on twos
        const fg = flameG.clear();
        if (can) flame(fg, box.x + tailAt[0], box.y + tailAt[1], FLAME.baja, lt, { rm, ink: NINK });
        zz.alpha = 0.6 + (rm ? 0 : 0.4 * Math.sin(lt * 3));
        bit.update(lt - BIT_AT, rm);
      },
    };
  },
};
/** the Bitácora rises (scene-local) */
export const BIT_AT = 5.0;
