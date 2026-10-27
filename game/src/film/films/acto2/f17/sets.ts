/**
 * F17 «La Vocación» — the sets (shot list in ./index.ts). CARAVAGGIO: tenebrism, dark oil, ONE raking ray of light,
 * figures coming out of the black — with two famous compositions you recognise: the hand that points inside the ray
 * (The Calling of Saint Matthew) and the two hands that almost touch (The Creation of Adam). Her lantern is the OTHER
 * light of the painting. The 16:9 of anime drips into oil and sits inside a gilded museum frame.
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import { Beam, FLAME, LANTERN, SLUG, balloon, bob, flame, glow, lanternAt, luzOf, nibHand, outBack, rnd, seg, sm, stillRig, tailTip, threadBundle, word, type LuzRig } from '../kit';

const CV = { black: 0x070504, umber: 0x2a1a10, gold: 0xc9a040, goldL: 0xf0d080, goldD: 0x6a4a18, ray: 0xeaf0ff, cyan: 0x8ff0ff, red: 0x7a1a12 } as const;
type Actor = NonNullable<ReturnType<SceneCtx['actor']>>;

/** the gilded museum frame (screen space): thickness k (0 = none … 1 = full) */
class GoldFrame extends Graphics {
  draw(view: { x: number; y: number; w: number; h: number }, k: number) {
    this.clear();
    if (k <= 0.005) return;
    const t = 96 * k;
    const { x, y, w, h } = view;
    // outer moulding, inner bevel, the ornament band
    this.rect(x, y, w, t).fill(CV.gold).rect(x, y + h - t, w, t).fill(CV.gold).rect(x, y, t, h).fill(CV.gold).rect(x + w - t, y, t, h).fill(CV.gold);
    this.rect(x + t * 0.18, y + t * 0.18, w - t * 0.36, t * 0.12).fill(CV.goldL).rect(x + t * 0.18, y + h - t * 0.3, w - t * 0.36, t * 0.12).fill(CV.goldD);
    this.rect(x + t * 0.18, y + t * 0.18, t * 0.12, h - t * 0.36).fill(CV.goldL).rect(x + w - t * 0.3, y + t * 0.18, t * 0.12, h - t * 0.36).fill(CV.goldD);
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      this.circle(x + u * w, y + t * 0.55, t * 0.09).fill(CV.goldD).circle(x + u * w, y + h - t * 0.55, t * 0.09).fill(CV.goldD);
    }
    this.rect(x + t - 6, y + t - 6, w - 2 * t + 12, 6).fill(0x000000).rect(x + t - 6, y + h - t, w - 2 * t + 12, 6).fill(0x000000);
    this.rect(x + t - 6, y + t - 6, 6, h - 2 * t + 12).fill(0x000000).rect(x + w - t, y + t - 6, 6, h - 2 * t + 12).fill(0x000000);
  }
}
/** the dark canvas behind everything */
function canvasBack(ctx: SceneCtx, tint = 0xffffff): Container {
  const c = new Container();
  const t = ctx.tex('cv:canvas') as Texture | undefined;
  c.addChild(new Graphics().rect(-1600, -1200, 5120, 3480).fill(CV.black));
  if (t) {
    const s = new Sprite(t);
    s.position.set(-1600, -1200);
    s.setSize(5120, 3480);
    s.tint = tint;
    c.addChild(s);
  }
  return c;
}
/** the ray from the closed sky (additive shaft) */
function ray(ctx: SceneCtx): Sprite {
  const s = new Sprite(ctx.tex('cv:ray') as Texture);
  s.anchor.set(0.5, 0);
  s.blendMode = 'add';
  s.tint = CV.ray;
  return s;
}
/** La Mano (stand-in) with her white hand and its nib, drawn in her paint; `point` 0..1 lifts and aims the hand */
interface Mano {
  a: Actor | null;
  hand: Graphics;
}
function mano(ctx: SceneCtx, size: number): Mano {
  const a = ctx.actor(SLUG.mano, size);
  if (a) a.tint = 0xf2ece4;
  return { a, hand: new Graphics() };
}
function drawHand(m: Mano, ang: number, L: number, drop = false) {
  const g = m.hand.clear();
  if (!m.a) return;
  const sx = Math.sign(m.a.scale.x) || 1;
  const x = m.a.x - sx * m.a.size * 0.12;
  const y = m.a.y - m.a.size * 0.48;
  nibHand(g, x, y, L, ang, { inkDrop: drop });
}

// ------------------------------------------------------------------ V1 · the arena drips from cel into oil; the gold frame grows
function arenaPaint(ctx: SceneCtx, bake: 'cel' | null): Container {
  const c = new Container();
  const g = new Graphics();
  if (bake === 'cel') {
    g.rect(-1600, -1200, 5120, 1700).fill(0x5a9af0).rect(-1600, 300, 5120, 400).fill(0x8ac0ff);
    g.ellipse(960, 820, 900, 220).fill(0xb8a890).stroke({ width: 10, color: 0x14121e });
    g.ellipse(960, 800, 760, 170).fill(0xd8c8a8).stroke({ width: 8, color: 0x14121e });
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * (1.02 + (i / 39) * 0.96);
      g.circle(960 + Math.cos(a) * 880, 760 + Math.sin(a) * 260, 16).fill([0x3a2a4a, 0x6a3a2a, 0x2a3a6a][i % 3]).stroke({ width: 3, color: 0x14121e });
    }
  } else {
    g.rect(-1600, -1200, 5120, 3480).fill(0x0c0806);
    g.ellipse(960, 820, 900, 220).fill(0x2a1c10);
    g.ellipse(960, 800, 760, 170).fill(0x3a2a18);
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * (1.02 + (i / 39) * 0.96);
      g.circle(960 + Math.cos(a) * 880, 760 + Math.sin(a) * 260, 16).fill(0x1a120c);
    }
  }
  c.addChild(g);
  const put = (slug: string, x: number, y: number, h: number, flip = false) => {
    const s = bake ? ctx.stillAs(bake, slug, 0.5, 0.97) : ctx.still(slug, 0.5, 0.97);
    if (!s) return;
    s.setSize((s.width / s.height) * h, h);
    if (flip) s.scale.x *= -1;
    s.position.set(x, y);
    c.addChild(s);
  };
  put(SLUG.ito, 560, 860, 360, true);
  put(SLUG.canelo, 1180, 880, 270);
  put(SLUG.luz, 1450, 860, 330, true);
  return c;
}
export const escurre: SetModule = {
  cats: () => [SLUG.ito, SLUG.canelo, SLUG.luz, { slug: SLUG.ito, bake: 'cel' }, { slug: SLUG.canelo, bake: 'cel' }, { slug: SLUG.luz, bake: 'cel' }],
  build(ctx: SceneCtx): FilmSet {
    const cel = arenaPaint(ctx, 'cel');
    ctx.plane(cel, { z: 1000, bake: 'static', res: 0.8 });
    // the oil version, revealed by drips that run down from the top
    const oil = new Container();
    const oilPaint = arenaPaint(ctx, null);
    const r = ctx.baker.raster(oilPaint, { res: 0.8 });
    oilPaint.destroy({ children: true });
    const os = new Sprite(r.tex);
    os.position.set(r.x, r.y);
    const drips = new Graphics();
    os.mask = drips;
    oil.addChild(os, drips);
    ctx.plane(oil, { z: 999 });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    const N = 34;
    return {
      update(lt, f) {
        const rm = f.rm;
        const p = seg(lt, 0.6, 6.0);
        const d = drips.clear();
        if (rm) d.rect(-1600, -1200, 5120, 3480).fill({ color: 0xffffff, alpha: 1 });
        else
          for (let i = 0; i < N; i++) {
            const x = -300 + (i / N) * 2520;
            const w = 2520 / N + 4;
            const h = (p * (1 + rnd(i) * 0.9) - rnd(i + 3) * 0.3) * 1800;
            if (h <= 0) continue;
            d.rect(x, -1200, w, 1200 + h - 60).fill(0xffffff);
            d.circle(x + w / 2, h - 60 - 1200 + 1200, w * 0.5).fill(0xffffff);
          }
        oil.alpha = rm ? sm(p) : 1;
        frame.draw(ctx.k.view, sm(seg(lt, 3.0, 7.0)));
      },
    };
  },
};

// ------------------------------------------------------------------ V2 · the ray comes down; La Mano descends inside it
export const rayo: SetModule = {
  cats: [SLUG.mano],
  build(ctx: SceneCtx): FilmSet {
    ctx.plane(canvasBack(ctx), { z: 1400, bake: 'static', res: 0.4 });
    const floor = new Graphics().ellipse(960, 900, 1100, 200).fill(0x1c120a).ellipse(960, 880, 260, 40).fill({ color: 0x5a4a38, alpha: 0.6 });
    // the gatera, dark, centre
    floor.roundRect(860, 560, 200, 330, 100).fill(0x0a0605).stroke({ width: 6, color: 0x2a1a10 });
    ctx.plane(floor, { z: 1100, bake: 'static' });
    const sh = ray(ctx);
    const m = mano(ctx, 520);
    const live = new Container();
    live.addChild(sh);
    if (m.a) live.addChild(m.a);
    live.addChild(m.hand);
    ctx.plane(live, { z: 1000 });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        const open = sm(seg(lt, 0.2, 2.2));
        sh.position.set(960, -200);
        sh.scale.set((600 * (0.3 + open * 0.7)) / 256, 1300 / 512);
        sh.alpha = open * 0.85;
        const y = -200 + sm(seg(lt, 1.6, 6.5)) * 1060 + bob(lt, f.rm, 6);
        m.a?.pose(lt, 960, y, { flip: true });
        drawHand(m, 2.4, 170);
        frame.draw(ctx.k.view, 1);
      },
    };
  },
};

// ------------------------------------------------------------------ the tableau shared by V3, V7, V8: the crew at the left in penumbra, La Mano in the ray at the right
interface Tab {
  m: Mano;
  luz: LuzRig;
  can: Actor | null;
  cer: Actor | null;
  flameG: Graphics;
  sh: Sprite;
  beam: Beam;
  lamp: Sprite;
  fx: Graphics;
  frame: GoldFrame;
}
function tableau(ctx: SceneCtx): Tab {
  ctx.plane(canvasBack(ctx), { z: 1400, bake: 'static', res: 0.4 });
  const set = new Graphics();
  // the table of the Calling (a plank in the penumbra), the window frame of Caravaggio's wall
  set.rect(80, 760, 900, 40).fill(0x2a1a0e).rect(120, 800, 26, 200).fill(0x1a100a).rect(900, 800, 26, 200).fill(0x1a100a);
  set.rect(400, 120, 520, 300).stroke({ width: 10, color: 0x1a120a }).moveTo(660, 120).lineTo(660, 420).stroke({ width: 8, color: 0x1a120a });
  set.ellipse(960, 980, 1200, 160).fill(0x120c08);
  ctx.plane(set, { z: 1100, bake: 'static' });
  const live = new Container();
  const sh = ray(ctx);
  live.addChild(sh);
  const can = ctx.actor(ctx.canelo, 280);
  const cer = ctx.actor(SLUG.cerito, 120);
  if (cer) cer.tint = 0xd8d8d8;
  const luz = luzOf(ctx, 380);
  const m = mano(ctx, 470);
  for (const a of [can, luz.actor, cer, m.a]) if (a) live.addChild(a);
  const flameG = new Graphics();
  const fx = new Graphics();
  const beam = new Beam(ctx, LANTERN);
  const lamp = glow(ctx, LANTERN, 160, 0.9);
  live.addChild(flameG, m.hand, beam, lamp, fx);
  ctx.plane(live, { z: 1000 });
  const frame = new GoldFrame();
  ctx.plane(frame, { z: 0, screen: true });
  return { m, luz, can, cer, flameG, sh, beam, lamp, fx, frame };
}
function tabPose(ctx: SceneCtx, T: Tab, lt: number, f: FrameInfo, o: { point?: number; lantern?: number; flameShake?: number } = {}) {
  const rm = f.rm;
  T.sh.position.set(1420, -250);
  T.sh.scale.set(560 / 256, 1350 / 512);
  T.sh.alpha = 0.85;
  T.m.a?.pose(lt, 1460, 860 + bob(lt, rm, 4), { flip: true });
  // the pointing hand: it rises and aims at Cerito (left) through the ray
  const pt = o.point ?? 0;
  drawHand(T.m, Math.PI - 0.12 + (1 - pt) * 0.9, 150 + pt * 90);
  // Luzterna with her «skirt of light»; Cerito hides behind it
  const lp = o.lantern ?? 0;
  T.luz.actor?.pose(lt, 760 + lp * 260, 880 + bob(lt, rm, 6), { flip: false, rot: lp * -0.08 });
  T.cer?.pose(lt, 620 + lp * 300, 900, { flip: false });
  T.can?.pose(lt, 330, 900, { flip: false });
  if (T.can) T.can.tint = 0x7a6858;
  if (T.luz.actor) T.luz.actor.tint = lp > 0.5 ? 0xd8d0e0 : 0xa89888;
  if (T.cer) T.cer.tint = 0xb8b8bc;
  const la = lanternAt(T.luz);
  T.lamp.position.set(la[0], la[1]);
  T.beam.set(la, [la[0] + 260 + lp * 120, la[1] + 40], 140, 0.35 + lp * 0.35);
  const g = T.flameG.clear();
  const tip = tailTip(T.can);
  const shake = o.flameShake ?? 0;
  if (tip) flame(g, tip[0] + (rm ? 0 : Math.sin(lt * 40) * 4 * shake), tip[1], FLAME.chica - shake * 0.15, lt, { rm, scale: 1 });
  T.frame.draw(ctx.k.view, 1);
}

// ------------------------------------------------------------------ V3 · the Calling: the nib points through the ray at Cerito
export const vocacion: SetModule = {
  cats: ({ canelo }) => [SLUG.mano, canelo, SLUG.luz, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const T = tableau(ctx);
    return { update: (lt, f) => tabPose(ctx, T, lt, f, { point: sm(seg(lt, 2.0, 4.0)) }) };
  },
};

// ------------------------------------------------------------------ V4 · the Creation, backwards: her hand reaches for Cerito's paw — a centimetre apart
export const adan: SetModule = {
  cats: [SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    ctx.plane(canvasBack(ctx, 0xd8c0a0), { z: 1400, bake: 'static', res: 0.4 });
    const g0 = new Graphics();
    // the red mantle billowing behind the hand that creates (here: un-creates), the bare ground behind the little paw
    g0.moveTo(2000, 120).bezierCurveTo(1700, 60, 1300, 260, 1250, 460).bezierCurveTo(1350, 560, 1700, 700, 2000, 680).fill(CV.red);
    g0.moveTo(1300, 300).bezierCurveTo(1450, 380, 1600, 340, 1800, 420).stroke({ width: 8, color: 0x4a0c08 });
    g0.moveTo(-200, 820).bezierCurveTo(200, 700, 500, 760, 820, 700).lineTo(820, 1300).lineTo(-200, 1300).fill(0x2a1c10);
    ctx.plane(g0, { z: 1150, bake: 'static' });
    const live = new Container();
    const hand = new Graphics();
    const paw = new Graphics();
    const soft = glow(ctx, 0xfff0d0, 900, 0.18);
    soft.position.set(960, 540);
    live.addChild(soft, paw, hand);
    ctx.plane(live, { z: 1000 });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        // her hand slides in from the right; it stops with a centimetre left (the gap holds)
        const reach = sm(seg(lt, 0.5, 6.5));
        const h = hand.clear();
        nibHand(h, 1560 - reach * 300, 500, 640, Math.PI + 0.04);
        // Cerito's little paw from the left, limp like Adam's, one toe lifting toward hers
        const p = paw.clear();
        const px = 470 + reach * 90;
        const py = 540;
        const skin = 0xcfd0d6;
        p.moveTo(-160, 700).bezierCurveTo(60, 660, 240, 600, px - 30, py).stroke({ width: 70, color: 0x1a1210, cap: 'round' });
        p.moveTo(-160, 700).bezierCurveTo(60, 660, 240, 600, px - 30, py).stroke({ width: 62, color: skin, cap: 'round' });
        for (let i = 0; i < 7; i++) p.moveTo(40 + i * 50, 650 - i * 14).lineTo(52 + i * 50, 672 - i * 14).stroke({ width: 3, color: 0x8a8a92 });
        p.ellipse(px + 10, py + 6, 62, 44).fill(skin).stroke({ width: 4, color: 0x1a1210 });
        p.ellipse(px + 10, py + 18, 22, 15).fill(0xd8a0a8);
        for (let i = 0; i < 3; i++) p.circle(px + 46 + i * 2, py - 26 + i * 24, 13).fill(skin).stroke({ width: 3, color: 0x1a1210 });
        const lift = reach * 0.25;
        p.moveTo(px + 50, py - 10).lineTo(px + 98, py - 22 - lift * 60).stroke({ width: 24, color: 0x1a1210, cap: 'round' });
        p.moveTo(px + 50, py - 10).lineTo(px + 98, py - 22 - lift * 60).stroke({ width: 18, color: skin, cap: 'round' });
        frame.draw(ctx.k.view, 1);
      },
    };
  },
};

// ------------------------------------------------------------------ V5–V6 · the offer, looking at CANELO; the Capi answers (a choice, cosmetic)
export const oferta: SetModule = {
  cats: ({ canelo }) => [SLUG.mano, canelo],
  build(ctx: SceneCtx): FilmSet {
    ctx.plane(canvasBack(ctx), { z: 1400, bake: 'static', res: 0.4 });
    const live = new Container();
    const sh = ray(ctx);
    const m = mano(ctx, 720);
    const can = ctx.actor(ctx.canelo, 300);
    const fg = new Graphics();
    live.addChild(sh);
    if (can) live.addChild(can);
    if (m.a) live.addChild(m.a);
    live.addChild(m.hand, fg);
    ctx.plane(live, { z: 1000 });
    // the Capi's answer: a balloon in the margins' handwriting (both built, the chosen one shown)
    const ans = new Container();
    const mk = (t: string) => {
      const b = balloon(ctx.k, t, { size: 64, font: 'Permanent Marker', wrap: 520, tail: [0, 90], fill: 0xf3ead2, ink: 0x2c3e6b });
      b.visible = false;
      ans.addChild(b);
      return b;
    };
    const no = mk('No.');
    const ni = mk('Ni lo sueñes.');
    const lab = new Container();
    const l1 = word(ctx.k, '◀  «NO.»', { fontFamily: 'Permanent Marker', fontSize: 50, fill: 0xf3ead2 });
    l1.position.set(-380, 0);
    const l2 = word(ctx.k, '«NI LO SUEÑES.»  ▶', { fontFamily: 'Permanent Marker', fontSize: 50, fill: 0xf3ead2 });
    l2.position.set(400, 0);
    lab.addChild(l1, l2);
    lab.position.set(960, 300);
    ans.position.set(960, 420);
    const top = new Container();
    top.addChild(ans, lab);
    ctx.plane(top, { z: 0, screen: true });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    const ASK = 8.0;
    const DECIDE = 10.6;
    return {
      update(lt, f) {
        const rm = f.rm;
        sh.position.set(1260, -260);
        sh.scale.set(700 / 256, 1400 / 512);
        sh.alpha = 0.8;
        // she speaks LOOKING AT CANELO (left, in the penumbra); he feels it
        m.a?.pose(lt, 1300, 1150 + bob(lt, rm, 4), { flip: true });
        drawHand(m, Math.PI * 0.82, 180);
        const feel = sm(seg(lt, 2.5, 3.2));
        can?.pose(lt, 360, 960, { flip: false, sy: 1 - feel * 0.03 });
        if (can) can.tint = 0x6a5a4a;
        const g = fg.clear();
        const tip = tailTip(can);
        if (tip) flame(g, tip[0], tip[1], FLAME.chica - feel * 0.1, lt, { rm });
        // the choice (V6)
        lab.visible = lt >= ASK && lt < DECIDE + 0.2;
        const j = ctx.k.judged('capi');
        const side = (j?.r as string) === 'right' ? 'right' : 'left';
        const shown = lt >= DECIDE || !!j;
        no.visible = shown && side === 'left' && lt < 14;
        ni.visible = shown && side === 'right' && lt < 14;
        for (const b of [no, ni]) if (b.visible) b.scale.set(rm ? 1 : 0.6 + 0.4 * outBack(seg(lt, j?.at ? Math.min(lt, DECIDE) : DECIDE, DECIDE + 0.3), 2));
        frame.draw(ctx.k.view, 1);
      },
    };
  },
};

// ------------------------------------------------------------------ V7–V8 · «No.» — her lantern between the two hands; the drop bounces off the bubble
export const linterna: SetModule = {
  cats: ({ canelo }) => [SLUG.mano, canelo, SLUG.luz, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const T = tableau(ctx);
    const bubble = new Graphics();
    const reb = word(ctx.k, '¡REBOTE!', { fontFamily: 'Bangers', fontSize: 86, fill: CV.cyan, stroke: { color: 0x061018, width: 9 } });
    reb.position.set(960, 380);
    T.fx.parent?.addChild(bubble);
    const top = new Container();
    top.addChild(reb);
    ctx.plane(top, { z: 990 });
    const DROP = 6.0;
    return {
      update(lt, f) {
        const rm = f.rm;
        // V7: she moves the lantern in between (0–3): the blue cone becomes the second light
        const lp = sm(seg(lt, 0.6, 2.6));
        tabPose(ctx, T, lt, f, { point: 1, lantern: lp });
        const la = lanternAt(T.luz);
        // the bubble of light in front of Cerito (it holds the ink off)
        const b = bubble.clear();
        const bx = la[0] + 170;
        const by = la[1] + 90;
        const hitT = DROP + 0.75;
        const glowK = lt > hitT ? Math.max(0, 1 - (lt - hitT) / 0.6) : 0;
        b.ellipse(bx, by, 150, 190).fill({ color: LANTERN, alpha: 0.1 + glowK * 0.25 }).stroke({ width: 3 + glowK * 6, color: glowK > 0 ? CV.cyan : LANTERN, alpha: 0.5 + glowK * 0.5 });
        // V8: a drop of ink falls from the nib toward Cerito, BOUNCES off the bubble, splats on the floor
        const g = T.fx.clear();
        const start: [number, number] = [1180, 700];
        if (lt >= DROP) {
          const fall = seg(lt, DROP, hitT);
          const after = seg(lt, hitT, hitT + 0.7);
          let x: number;
          let y: number;
          if (lt < hitT) {
            x = start[0] + (bx + 150 - start[0]) * fall;
            y = start[1] + (by - 40 - start[1]) * fall * fall;
          } else {
            x = bx + 150 + after * 220;
            y = by - 40 - Math.sin(after * Math.PI) * 120 + after * after * 260;
          }
          if (after < 1) g.ellipse(x, y, 12, 16).fill(0x0a0606);
          else g.ellipse(bx + 380, 960, 48, 10).fill(0x0a0606);
        }
        reb.visible = lt > hitT && lt < hitT + 1.6;
        if (reb.visible) reb.scale.set(rm ? 1 : 0.5 + 0.5 * outBack(seg(lt, hitT, hitT + 0.25), 2.2));
      },
    };
  },
};

// ------------------------------------------------------------------ V9 · her gaze goes from the lantern… to Canelo, and stays; his flame trembles
export const mirada: SetModule = {
  cats: ({ canelo }) => [SLUG.mano, canelo],
  build(ctx: SceneCtx): FilmSet {
    ctx.plane(canvasBack(ctx), { z: 1400, bake: 'static', res: 0.4 });
    const live = new Container();
    const sh = ray(ctx);
    const m = mano(ctx, 900);
    const can = ctx.actor(ctx.canelo, 260);
    const fg = new Graphics();
    const lamp = glow(ctx, LANTERN, 300, 0.6);
    lamp.position.set(140, 700);
    live.addChild(sh, lamp);
    if (can) live.addChild(can);
    if (m.a) live.addChild(m.a);
    live.addChild(fg);
    ctx.plane(live, { z: 1000 });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        sh.position.set(1250, -260);
        sh.scale.set((620 - sm(seg(lt, 1, 7)) * 260) / 256, 1400 / 512);
        sh.alpha = 0.85;
        // her head turns: toward the lantern (left, low) then to Canelo, and holds
        const turn = sm(seg(lt, 1.4, 3.0));
        m.a?.pose(lt, 1300, 1320, { flip: true, rot: -0.05 + turn * 0.07 });
        can?.pose(lt, 520, 980, { flip: false });
        if (can) can.tint = 0x6a5a4a;
        const g = fg.clear();
        const tip = tailTip(can);
        const tremble = turn;
        if (tip) flame(g, tip[0] + (rm ? 0 : Math.sin(lt * 46) * 5 * tremble), tip[1], FLAME.chica - tremble * 0.12 + (rm ? 0 : Math.sin(lt * 31) * 0.04 * tremble), lt, { rm });
        frame.draw(ctx.k.view, 1);
      },
    };
  },
};

// ------------------------------------------------------------------ V10 · Itō kneels at the edge of the ray, sheathes his threads
export const ito: SetModule = {
  cats: [SLUG.ito],
  build(ctx: SceneCtx): FilmSet {
    ctx.plane(canvasBack(ctx), { z: 1400, bake: 'static', res: 0.4 });
    const live = new Container();
    const sh = ray(ctx);
    const a = ctx.actor(SLUG.ito, 640);
    const th = new Graphics();
    live.addChild(sh, th);
    if (a) live.addChild(a);
    ctx.plane(live, { z: 1000 });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    return {
      update(lt, f) {
        sh.position.set(1500, -260);
        sh.scale.set(520 / 256, 1400 / 512);
        sh.alpha = 0.6;
        const kneel = sm(seg(lt, 0.8, 2.4));
        a?.pose(lt, 860, 1000 + kneel * 40, { flip: true, sy: 1 - kneel * 0.16, rot: kneel * 0.1 });
        // the threads go back into their sheath (2.6–5)
        const sheath = sm(seg(lt, 2.6, 5.0));
        const t = th.clear();
        threadBundle(t, 860 + 120, 1000 - 360 + kneel * 60, 520 * (1 - sheath * 0.55), -1.15, 0xf0e8d8, 11);
        frame.draw(ctx.k.view, 1);
      },
    };
  },
};

// ------------------------------------------------------------------ V11–V12 · she goes up the ray; it closes; an ink handprint in the sky — then the oil drips back to cel
export const sube: SetModule = {
  cats: () => [SLUG.mano, SLUG.ito, SLUG.canelo, SLUG.luz, { slug: SLUG.ito, bake: 'cel' }, { slug: SLUG.canelo, bake: 'cel' }, { slug: SLUG.luz, bake: 'cel' }],
  build(ctx: SceneCtx): FilmSet {
    ctx.plane(canvasBack(ctx), { z: 1400, bake: 'static', res: 0.4 });
    const live = new Container();
    const sh = ray(ctx);
    const m = mano(ctx, 420);
    const print = new Graphics();
    live.addChild(sh);
    if (m.a) live.addChild(m.a);
    live.addChild(m.hand, print);
    ctx.plane(live, { z: 1000 });
    // V12: the cel arena comes back, revealed by drips running down (the reverse of V1)
    const cel = new Container();
    const celPaint = arenaPaint(ctx, 'cel');
    const r = ctx.baker.raster(celPaint, { res: 0.8 });
    celPaint.destroy({ children: true });
    const cs = new Sprite(r.tex);
    cs.position.set(r.x, r.y);
    const drips = new Graphics();
    cs.mask = drips;
    cel.addChild(cs, drips);
    ctx.plane(cel, { z: 990 });
    const frame = new GoldFrame();
    ctx.plane(frame, { z: 0, screen: true });
    const BACK = 8.0;
    return {
      update(lt, f) {
        const rm = f.rm;
        const close = sm(seg(lt, 3.0, 6.0));
        sh.position.set(960, -260);
        sh.scale.set((620 * (1 - close)) / 256, 1400 / 512);
        sh.alpha = 0.85 * (1 - close * 0.9);
        const up = sm(seg(lt, 0.4, 5.6));
        m.a?.pose(lt, 960, 880 - up * 900, { flip: true, alpha: 1 - sm(seg(lt, 4.8, 5.8)) });
        drawHand(m, -Math.PI / 2 + 0.2, 160);
        // the handprint left where her paw touched the sky
        const pk = sm(seg(lt, 5.0, 6.0));
        const p = print.clear();
        // the place in the sky where the ray was keeps a faint warm glow; the ink handprint sits on it
        const sky = Math.max(close * 0.6, pk * 0.5) * (1 - sm(seg(lt, 7.4, 8.4)));
        p.ellipse(960, 300, 380, 240).fill({ color: 0x6a5238, alpha: sky * 0.55 }).ellipse(960, 300, 230, 150).fill({ color: 0x9a7a52, alpha: sky * 0.5 });
        if (pk > 0) {
          const s2 = 1.3;
          const cx = 960;
          const cy = 330;
          p.ellipse(cx, cy, 70 * pk * s2, 84 * pk * s2).fill({ color: 0x050303, alpha: 0.95 });
          for (let i = 0; i < 4; i++) p.roundRect(cx - 74 * s2 + i * 40 * s2, cy - 170 * s2 * pk, 26 * s2, 100 * s2 * pk, 13).fill({ color: 0x050303, alpha: 0.95 });
          p.roundRect(cx + 66 * s2, cy - 30, 84 * s2 * pk, 28 * s2, 13).fill({ color: 0x050303, alpha: 0.95 });
          for (let i = 0; i < 3; i++) p.circle(cx - 40 + i * 40, cy + 120 * s2 * pk + i * 14, 7 + i * 2).fill(0x050303);
        }
        // V12: drips of cel run down over the oil; the gold frame retreats
        const q = seg(lt, BACK, BACK + 3.4);
        const d = drips.clear();
        if (rm) {
          if (q > 0) d.rect(-1600, -1200, 5120, 3480).fill(0xffffff);
          cel.alpha = sm(q);
        } else {
          cel.alpha = 1;
          for (let i = 0; i < 34; i++) {
            const x = -300 + (i / 34) * 2520;
            const w = 2520 / 34 + 4;
            const h = (q * (1 + rnd(i + 9) * 0.9) - rnd(i + 2) * 0.3) * 1800;
            if (h <= 0) continue;
            d.rect(x, -1200, w, h - 60).fill(0xffffff);
            d.circle(x + w / 2, h - 60 - 1200, w * 0.5).fill(0xffffff);
          }
        }
        frame.draw(ctx.k.view, 1 - sm(seg(lt, BACK + 0.8, BACK + 3.6)));
      },
    };
  },
};
void stillRig;
void Graphics;
