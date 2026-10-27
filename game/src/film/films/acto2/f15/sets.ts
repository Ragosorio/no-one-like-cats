/**
 * F15 «Itō» — the sets (shot list in ./index.ts). An UKIYO-E SCROLL (makimono) unrolling from right to left under a
 * lateral travelling: woodblock lines, flat colour, a bokashi sky (indigo → pink), rice paper, vertical cartouches.
 * The paper is long (the camera reads it), so it's built in sections, each baked once; what moves (Itō breathing, the
 * strokes of the duel, the flame) lives on a thin live layer at the same depth.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import {
  Bitacora,
  FLAME,
  LANTERN,
  SLUG,
  bob,
  fitArcTo,
  flame,
  glow,
  lanternAt,
  luzOf,
  outBack,
  realArcs,
  rnd,
  seg,
  sm,
  stillRig,
  threadBundle,
  word,
  wordM,
} from '../kit';

export const UK = { indigo: 0x1f2a5a, prussian: 0x2a4a7a, pink: 0xe8a0a0, cream: 0xf2e6cc, vermilion: 0xc8402a, ochre: 0xc8963a, ink: 0x1a1612, gold: 0xd8a830, green: 0x5a7a4a, stone: 0x9a8e7a } as const;
/** the scroll's band (world px at z 1000) and where each section sits (reading right → left) */
export const ROLL = { top: 150, bot: 930, start: 1840, end: -6800 } as const;
import { AT } from './sets.anchors';
export { AT };

function washi(ctx: SceneCtx): Texture {
  return ctx.baker.shade(
    'a2-washi',
    1024,
    1024,
    `vec2 bakeUV() { return vTextureCoord / max(uInputClamp.zw, vec2(1e-4)); }
void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 4.0, 4.0);
  float fib = pnoise(uv * vec2(90.0, 9.0), 9.0) * 0.5 + pnoise(uv * vec2(9.0, 140.0), 9.0) * 0.5;
  float flecks = step(0.985, hash12(floor(uv * 300.0)));
  vec3 col = mix(vec3(0.9, 0.85, 0.74), vec3(0.97, 0.94, 0.86), n) * (0.95 + fib * 0.08) - flecks * 0.08;
  finalColor = vec4(col, 1.0);
}`,
    {},
    {},
    { res: 1 },
  );
}
/** a bokashi band: colour a at the top fading to b (many thin rects; baked) */
function bokashi(g: Graphics, x: number, y: number, w: number, h: number, a: number, b: number, steps = 40) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  for (let i = 0; i < steps; i++) {
    const t = Math.pow(i / (steps - 1), 1.4);
    const c = (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
    g.rect(x, y + (i * h) / steps, w, h / steps + 1).fill(c);
  }
}
/** a vertical cartouche: a framed paper slip; the words stacked (the first one big), read top → bottom */
function cartouche(ctx: SceneCtx, text: string, size = 46, fill: number = UK.cream): Container {
  const c = new Container();
  const words = text.split(' · ');
  const lines = words.map((w, i) => wordM(ctx.k, w, { fontFamily: i === 0 ? 'Dela Gothic One' : 'Bebas Neue', fontSize: i === 0 ? size * 1.5 : size, fill: UK.ink, letterSpacing: i === 0 ? 4 : 3 }));
  const W = Math.max(...lines.map((l) => l.width)) + size * 1.1;
  let y = size * 0.5;
  const pos: number[] = [];
  lines.forEach((l, i) => {
    const h = i === 0 ? size * 1.7 : size * 1.15;
    pos.push(y + h / 2);
    y += h;
  });
  const H = y + size * 0.5;
  const g = new Graphics().rect(-W / 2, 0, W, H).fill(fill).stroke({ width: 5, color: UK.ink }).rect(-W / 2 + 8, 8, W - 16, H - 16).stroke({ width: 2, color: UK.ink });
  c.addChild(g);
  lines.forEach((l, i) => {
    l.position.set(0, pos[i]);
    c.addChild(l);
  });
  return c;
}
/** a red seal (hanko) with abstract marks */
function seal(g: Graphics, x: number, y: number, s: number) {
  g.roundRect(x - s / 2, y - s / 2, s, s, 6).fill(UK.vermilion);
  g.rect(x - s * 0.3, y - s * 0.32, s * 0.6, s * 0.08).fill(UK.cream).rect(x - s * 0.04, y - s * 0.32, s * 0.08, s * 0.62).fill(UK.cream).rect(x - s * 0.3, y + s * 0.1, s * 0.25, s * 0.08).fill(UK.cream).rect(x + s * 0.08, y + s * 0.18, s * 0.22, s * 0.08).fill(UK.cream);
}
/** Hokusai-ish waves along the scroll's bottom edge */
function waves(g: Graphics, x0: number, x1: number, y: number, seed: number) {
  for (let x = x0; x < x1; x += 180) {
    const h = 70 + rnd(seed + x) * 50;
    g.moveTo(x, y + 60).bezierCurveTo(x + 40, y - h, x + 150, y - h * 0.9, x + 170, y - h * 0.3).bezierCurveTo(x + 150, y - h * 0.5, x + 100, y - h * 0.4, x + 120, y - h * 0.1).lineTo(x + 180, y + 60).fill(UK.prussian).stroke({ width: 4, color: UK.ink });
    for (let i = 0; i < 4; i++) g.circle(x + 140 + i * 9, y - h * 0.32 - i * 6, 7).fill(UK.cream).stroke({ width: 2, color: UK.ink });
  }
}
/** a crowd: rows of heads with topknots (woodblock style) */
function heads(g: Graphics, cx: number, cy: number, rx: number, rows: number, seed: number) {
  for (let r = 0; r < rows; r++)
    for (let i = 0; i < 28; i++) {
      const a = Math.PI * (0.06 + 0.88 * (i / 27));
      const x = cx - Math.cos(a) * (rx + r * 26);
      const y = cy - Math.sin(a) * (90 + r * 22);
      g.circle(x, y, 10).fill(UK.ink);
      g.circle(x + 3, y - 10, 4).fill(UK.ink);
      if (rnd(seed + i + r * 40) > 0.7) g.rect(x - 9, y + 6, 18, 10).fill(rnd(i) > 0.5 ? UK.vermilion : UK.prussian);
    }
}

// ------------------------------------------------------------------ the scroll
export const rollo: SetModule = {
  cats: ({ canelo }) => [SLUG.ito, 'vapor_ronin_cat', 'kage_ninja_cat', 'zarpa_pirate_cat', canelo],
  build(ctx: SceneCtx): FilmSet {
    const k = ctx.k;
    const paperT = washi(ctx);
    // the lacquer table under the scroll (far: barely moves)
    const table = new Graphics().rect(-9000, -1200, 13000, 3500).fill(0x1a0e08);
    for (let i = 0; i < 30; i++) table.rect(-9000, -1200 + i * 120, 13000, 3).fill({ color: 0x2a1a10, alpha: 0.6 });
    ctx.plane(table, { z: 1400, bake: 'static', res: 0.25 });
    // the scroll, in sections (each baked once)
    const SEC = 2200;
    for (let x0 = ROLL.end; x0 < ROLL.start; x0 += SEC) {
      const x1 = Math.min(ROLL.start, x0 + SEC);
      const c = new Container();
      const shadow = new Graphics().rect(x0, ROLL.top + 18, x1 - x0, ROLL.bot - ROLL.top).fill({ color: 0x000000, alpha: 0.5 });
      c.addChild(shadow);
      const p = new Sprite(paperT);
      p.position.set(x0, ROLL.top);
      p.setSize(x1 - x0, ROLL.bot - ROLL.top);
      c.addChild(p);
      const g = new Graphics();
      // the bokashi sky: indigo at the top melting into pink, then the paper
      bokashi(g, x0, ROLL.top + 20, x1 - x0, 300, UK.indigo, UK.pink);
      g.rect(x0, ROLL.top + 320, x1 - x0, 60).fill({ color: UK.pink, alpha: 0.35 });
      waves(g, x0, x1, ROLL.bot - 80, x0);
      g.rect(x0, ROLL.top, x1 - x0, 18).fill(UK.gold).rect(x0, ROLL.bot - 18, x1 - x0, 18).fill(UK.gold);
      g.rect(x0, ROLL.top + 18, x1 - x0, 3).fill(UK.ink).rect(x0, ROLL.bot - 21, x1 - x0, 3).fill(UK.ink);
      c.addChild(g);
      // what's painted in this stretch
      sections(ctx, c, x0, x1);
      // keep only this stretch
      const m = new Graphics().rect(x0, ROLL.top - 40, x1 - x0, ROLL.bot - ROLL.top + 80).fill(0xffffff);
      c.mask = m;
      const holder = new Container();
      holder.addChild(c, m);
      ctx.plane(holder, { z: 1000, bake: 'static', res: 0.9 });
    }
    // the live layer: Itō (breathing, opening his eyes), the duel's strokes, Canelo's flame
    const live = new Container();
    const ito = ctx.actor(SLUG.ito, 470);
    const threads = new Graphics();
    if (ito) live.addChild(threads, ito);
    ito?.emote('sleepy', 1);
    const duel = new Graphics();
    live.addChild(duel);
    const A = ctx.actor('vapor_ronin_cat', 300);
    const Bc = ctx.actor('kage_ninja_cat', 300);
    const C = ctx.actor('zarpa_pirate_cat', 280);
    const aura = new Graphics();
    live.addChild(aura);
    for (const a of [A, Bc, C]) if (a) live.addChild(a);
    const can = ctx.actor(ctx.canelo, 300);
    const fg = new Graphics();
    if (can) live.addChild(can);
    live.addChild(fg);
    ctx.plane(live, { z: 1000 });
    // the rollers: the scroll's start (right) and the unrolling edge (follows the camera, left) + the dark beyond it
    const near = new Container();
    const cover = new Graphics();
    const rollL = new Graphics();
    const rollR = new Graphics();
    const drawRoller = (g: Graphics, x: number) => {
      g.clear();
      g.roundRect(x - 34, ROLL.top - 60, 68, ROLL.bot - ROLL.top + 120, 30).fill(0x6a3a1a).stroke({ width: 5, color: UK.ink });
      g.rect(x - 34, ROLL.top - 10, 68, 30).fill(UK.gold).rect(x - 34, ROLL.bot - 20, 68, 30).fill(UK.gold);
      g.roundRect(x - 22, ROLL.top - 90, 44, 40, 10).fill(0x3a1a0a).roundRect(x - 22, ROLL.bot + 50, 44, 40, 10).fill(0x3a1a0a);
    };
    drawRoller(rollR, ROLL.start + 30);
    near.addChild(cover, rollL, rollR);
    ctx.plane(near, { z: 1000 });
    const arc = realArcs()[0];
    // the duel's strokes: one each, by turns — the simulator's real flight, painted as a plate line
    const sA = fitArcTo(arc, [AT.regla - 520, 560], [AT.regla - 40, 600], 300);
    const sB = fitArcTo(arc, [AT.regla - 40, 560], [AT.regla - 520, 600], 300);
    const sC1 = fitArcTo(arc, [AT.regla + 320, 560], [AT.regla + 600, 640], 380);
    const sC2 = fitArcTo(arc, [AT.regla + 330, 570], [AT.regla + 620, 600], 330);
    let rollerX = ROLL.start - 300;
    return {
      update(lt, f) {
        const rm = f.rm;
        // the unrolling edge rides the camera's left side (it never goes back)
        const camX = f.cam.state.x;
        const want = Math.min(ROLL.start - 300, camX - 820);
        rollerX = Math.min(rollerX, want);
        if (lt < 0.05) rollerX = want;
        drawRoller(rollL, rollerX);
        cover.clear().rect(rollerX - 6000, ROLL.top - 120, 6000, ROLL.bot - ROLL.top + 240).fill(0x1a0e08);
        // Itō kneels, breathes; at 9.4 he opens his eyes
        ito?.pose(lt, AT.ito - 40, 800, { flip: true, sy: 1 + (rm ? 0 : Math.sin(lt * 1.6) * 0.012) });
        if (lt > 9.4 && lt < 9.5) ito?.emote('surprise', 0.5);
        const tg = threads.clear();
        if (ito) threadBundle(tg, AT.ito - 40 + 70, 800 - 380, 360, 2.35, UK.ink, 9);
        // the duel (scene-local seconds of the rule, 19.3 → 28)
        const d = duel.clear();
        const stroke = (pts: [number, number][], p: number, col: number, w: number) => {
          const n = Math.floor(pts.length * (rm ? (p > 0 ? 1 : 0) : p));
          if (n < 2) return;
          d.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < n; i++) d.lineTo(pts[i][0], pts[i][1]);
          d.stroke({ width: w, color: col, cap: 'round', join: 'round' });
        };
        const pA = seg(lt, 20.2, 21.2);
        const pB = seg(lt, 22.0, 23.0);
        const pC1 = seg(lt, 24.0, 24.6);
        const pC2 = seg(lt, 24.7, 25.3);
        stroke(sA, pA, UK.vermilion, 12);
        stroke(sB, pB, UK.prussian, 12);
        stroke(sC1, pC1, UK.ink, 10);
        stroke(sC2, pC2, UK.ink, 10);
        A?.pose(lt, AT.regla - 560, 760, { flip: true, rot: pA > 0 && pA < 1 ? -0.08 : 0 });
        Bc?.pose(lt, AT.regla, 760, { flip: false, rot: pB > 0 && pB < 1 ? 0.08 : 0 });
        // the third one strikes TWICE — its aura (a gold halo) goes out
        const out = seg(lt, 25.4, 26.4);
        C?.pose(lt, AT.regla + 300, 760, { flip: true });
        const ag = aura.clear();
        const alive = 1 - out;
        ag.circle(AT.regla + 300, 600, 150).fill({ color: UK.gold, alpha: 0.55 * alive }).stroke({ width: 6, color: UK.ink, alpha: 0.4 + 0.6 * alive });
        if (out > 0) ag.circle(AT.regla + 300, 600, 150).stroke({ width: 6, color: 0x7a7468, alpha: out });
        if (C) C.tint = out > 0.5 ? 0x9a948a : 0xffffff;
        // Canelo in the corner of the scroll, by the arena's tear: his flame goes down a little more
        can?.pose(lt, AT.canelo - 120, 820, { flip: false });
        const g = fg.clear();
        const tip = tailTip2(can);
        if (tip) flame(g, tip[0], tip[1], FLAME.chica - (FLAME.chica - FLAME.baja) * sm(seg(lt, 29.4, 30.4)), lt, { rm, color: UK.vermilion, core: UK.ochre, ink: UK.ink, scale: 1.2 });
      },
    };
  },
};
/** the tail tip of an actor (same as the kit, local) */
function tailTip2(a: ReturnType<SceneCtx['actor']>): [number, number] | null {
  const p = a?.puppet;
  const pts = p?.brain.model?.rig?.tail?.pts;
  if (!p || !pts?.length) return null;
  const [tx, ty] = pts[pts.length - 1];
  return [a!.x + (tx - p.anchor.x * p.W) * p.scale.x * a!.scale.x, a!.y + (ty - p.anchor.y * p.H) * p.scale.y * a!.scale.y];
}

/** what is painted along the scroll (static, per baked stretch: everything is drawn, the mask keeps the stretch) */
function sections(ctx: SceneCtx, c: Container, x0: number, x1: number) {
  const k = ctx.k;
  const inside = (x: number, w: number) => x + w > x0 - 200 && x - w < x1 + 200;
  const g = new Graphics();
  c.addChild(g);
  // 1 · LA FINAL: the stone arena with banners and rows of heads, pines, the sun disc in the bokashi
  if (inside(AT.final, 900)) {
    const X = AT.final;
    g.circle(X + 420, ROLL.top + 150, 80).fill(UK.vermilion);
    g.ellipse(X, 760, 560, 130).fill(UK.stone).stroke({ width: 6, color: UK.ink });
    g.ellipse(X, 740, 420, 80).fill(0xd8c8a0).stroke({ width: 5, color: UK.ink });
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (0.05 + 0.9 * (i / 11));
      const x = X - Math.cos(a) * 520;
      const y = 760 - Math.sin(a) * 120;
      g.rect(x - 3, y - 160, 6, 160).fill(UK.ink);
      g.rect(x + 3, y - 160, 22, 90).fill(i % 2 ? UK.vermilion : UK.prussian).stroke({ width: 3, color: UK.ink });
    }
    heads(g, X, 740, 470, 3, 4);
    // pines
    for (const px of [X - 760, X + 720]) {
      g.rect(px - 8, 520, 16, 300).fill(0x4a2a1a);
      for (let i = 0; i < 4; i++) g.ellipse(px + (i % 2 ? 40 : -40), 540 + i * 50, 90 - i * 10, 22).fill(UK.green).stroke({ width: 3, color: UK.ink });
    }
    const ct = cartouche(ctx, 'LA FINAL', 54);
    ct.position.set(X + 760, 200);
    c.addChild(ct);
  }
  // 2 · ITŌ (the live layer draws him): his mat, a lantern on a pole, the cartouche
  if (inside(AT.ito, 700)) {
    const X = AT.ito;
    g.rect(X - 300, 800, 520, 20).fill(0xb89a5a).stroke({ width: 3, color: UK.ink });
    for (let i = 0; i < 6; i++) g.rect(X - 300 + i * 90, 800, 3, 20).fill(UK.ink);
    g.rect(X - 420, 420, 8, 400).fill(UK.ink);
    g.roundRect(X - 450, 380, 70, 90, 20).fill(UK.vermilion).stroke({ width: 4, color: UK.ink });
    const ct = cartouche(ctx, 'ITŌ · TITIRITERO · PELEA DE FRENTE', 40);
    ct.position.set(X + 380, 200);
    c.addChild(ct);
    seal(g, X + 380, 760, 70);
  }
  // 3 · the arena's gatera, chained in gold
  if (inside(AT.gatera, 700)) {
    const X = AT.gatera;
    g.roundRect(X - 220, 360, 440, 470, 220).fill(0x4a3a2a).stroke({ width: 7, color: UK.ink });
    g.roundRect(X - 170, 420, 340, 410, 170).fill(UK.ink);
    for (let i = 0; i < 10; i++) g.ellipse(X - 200 + i * 44, 600 + Math.sin(i * 0.6) * 14, 26, 15).stroke({ width: 9, color: UK.gold }).ellipse(X - 200 + i * 44, 600 + Math.sin(i * 0.6) * 14, 26, 15).stroke({ width: 2, color: UK.ink });
    g.roundRect(X - 36, 620, 72, 64, 10).fill(UK.gold).stroke({ width: 4, color: UK.ink });
    const ct = cartouche(ctx, 'EL CAMPEÓN CRUZA · LOS DEMÁS SE QUEDAN', 38);
    ct.position.set(X + 420, 200);
    c.addChild(ct);
  }
  // 4 · the rule: the mats of the duel; the cartouche
  if (inside(AT.regla, 1000)) {
    const X = AT.regla;
    g.rect(X - 700, 770, 1100, 14).fill(0xb89a5a).stroke({ width: 3, color: UK.ink });
    const ct = cartouche(ctx, 'DUELO LIMPIO · UN GOLPE CADA UNO', 40);
    ct.position.set(X + 820, 200);
    c.addChild(ct);
    // the turn marks: 一 (one) under each duelist, and two under the cheat
    for (const [x, n] of [
      [X - 560, 1],
      [X, 1],
      [X + 300, 2],
    ] as const)
      for (let i = 0; i < n; i++) g.rect(x - 40, 830 + i * 18, 80, 10).fill(UK.ink);
  }
  // 5 · the corner: the arena's tear (a rip in the paper with static at its edge), where Canelo sits
  if (inside(AT.canelo, 600)) {
    const X = AT.canelo;
    const rip: number[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = (i % 2 ? 50 : 90) + rnd(i + 2) * 20;
      rip.push(X + 180 + Math.cos(a) * r * 0.6, 640 + Math.sin(a) * r);
    }
    g.poly(rip).fill(0x0e0c0a).stroke({ width: 5, color: UK.ink });
    for (let i = 0; i < 24; i++) g.rect(X + 140 + rnd(i) * 80, 560 + rnd(i + 5) * 160, 10, 3).fill(0xffffff);
    seal(g, X - 330, 380, 80);
  }
  void k;
}

// ------------------------------------------------------------------ 2 · Luzterna bows to the drawing — and it bows back
export const reverencia: SetModule = {
  cats: () => [SLUG.ito, { slug: SLUG.luz, bake: 'cel' }],
  build(ctx: SceneCtx): FilmSet {
    const paperT = washi(ctx);
    const bg = new Graphics().rect(-1500, -1200, 4920, 3480).fill(0x1a0e08);
    ctx.plane(bg, { z: 1600, bake: 'static', res: 0.3 });
    const sc = new Container();
    const p = new Sprite(paperT);
    p.position.set(-200, 120);
    p.setSize(2320, 860);
    sc.addChild(new Graphics().rect(-200, 140, 2320, 860).fill({ color: 0x000000, alpha: 0.5 }), p);
    const g = new Graphics();
    bokashi(g, -200, 140, 2320, 300, UK.indigo, UK.pink);
    g.rect(-200, 120, 2320, 18).fill(UK.gold).rect(-200, 962, 2320, 18).fill(UK.gold);
    g.rect(980, 840, 520, 20).fill(0xb89a5a).stroke({ width: 3, color: UK.ink });
    sc.addChild(g);
    ctx.plane(sc, { z: 1300, bake: 'dof', blur: 10, dof: 1400 });
    // the drawing of Itō (a still in the scroll's treatment) that bows back
    const ito = ctx.actor(SLUG.ito, 560);
    const th = new Graphics();
    const draw = new Container();
    draw.addChild(th);
    if (ito) draw.addChild(ito);
    ctx.plane(draw, { z: 1300 });
    // Luzterna, real (the shōnen sea's cel), in front of the scroll
    const rig = luzOf(ctx, 760, 'cel');
    const lamp = glow(ctx, LANTERN, 220, 0.85);
    const lightOnPaper = glow(ctx, LANTERN, 700, 0.25);
    const near = new Container();
    near.addChild(lightOnPaper);
    if (rig.actor) near.addChild(rig.actor);
    near.addChild(lamp);
    ctx.plane(near, { z: 800 });
    const bit = new Bitacora(ctx, 'La gatera. Y que Itō olvide algo por nuestra culpa.', { enter: 'unroll', w: 1400, size: 60, top: 170, tilt: 0, paper: 0xf2e6cc });
    ctx.plane(bit, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        // she bows (0.4–1.4), holds; the drawing bows back (1.6–2.6)
        const bowL = sm(seg(lt, 0.4, 1.2)) * (1 - sm(seg(lt, 1.9, 2.6)));
        const bowI = sm(seg(lt, 1.6, 2.3)) * (1 - sm(seg(lt, 3.0, 3.6)));
        rig.actor?.pose(lt, 520, 1080 + bob(lt, rm, 6) + bowL * 20, { rot: bowL * 0.38, flip: false });
        const la = lanternAt(rig);
        lamp.position.set(la[0], la[1]);
        lightOnPaper.position.set(1200, 600);
        ito?.pose(lt, 1250, 860 + bowI * 14, { flip: true, rot: -bowI * 0.32 });
        const t2 = th.clear();
        threadBundle(t2, 1250 + 80, 860 - 450, 420, 2.35, UK.ink, 9);
        bit.update(lt - 4.0, rm);
      },
    };
  },
};
