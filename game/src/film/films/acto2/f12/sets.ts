/**
 * F12 «Cerito» — the sets (shot list in ./index.ts). A NATURE DOCUMENTARY IN NIGHT VISION: the island drawn in values
 * (the `nocturna` post turns them into phosphor green), a camera viewfinder over everything (corner brackets, REC, a
 * running timecode, battery, the autofocus box that hunts), telephoto shallow focus. The brightest things are the cats'
 * eyes — they see in the dark (the seed of the end).
 */
import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { FilmSet, FrameInfo, SceneCtx, SetModule } from '../../../stage';
import { Beam, LANTERN, SLUG, StaticKitten, bob, castTex, glow, lanternAt, luzOf, outBack, rigPoint, rnd, seg, sm, word, type LuzRig } from '../kit';

const NV = { sky: 0x040404, sea: 0x121212, foam: 0x5a5a5a, sand: 0x2e2e2e, dark: 0x050505, light: 0xe8e8e8, mid: 0x1e1e1e } as const;
type Actor = NonNullable<ReturnType<SceneCtx['actor']>>;

/** the island in values (one drawing; each shot frames a part of it with the telephoto) — world px, wide = 1920×1080 */
function island(ctx: SceneCtx): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-1600, -1200, 5120, 1700).fill(NV.sky);
  for (let i = 0; i < 70; i++) g.circle(-1400 + rnd(i) * 4700, -1000 + rnd(i + 3) * 1300, 1.5 + rnd(i + 7) * 2.5).fill({ color: NV.light, alpha: 0.5 + rnd(i) * 0.5 });
  g.rect(-1600, 500, 5120, 1400).fill(NV.sea);
  for (let i = 0; i < 40; i++) g.rect(-1400 + rnd(i + 11) * 4700, 540 + rnd(i + 13) * 600, 60 + rnd(i) * 120, 4).fill({ color: NV.foam, alpha: 0.5 });
  // the island: sand, the palm (right), the lighthouse (left)
  g.ellipse(960, 760, 1150, 210).fill(NV.sand);
  g.ellipse(960, 740, 1050, 170).fill(0x383838);
  for (let i = 0; i < 30; i++) g.ellipse(-60 + rnd(i) * 2040, 700 + rnd(i + 2) * 120, 30, 8).fill({ color: NV.mid, alpha: 0.5 });
  // grass tufts
  for (let i = 0; i < 26; i++) {
    const x = 0 + rnd(i + 40) * 1900;
    const y = 690 + rnd(i + 41) * 120;
    for (let j = -2; j <= 2; j++) g.moveTo(x, y).lineTo(x + j * 8, y - 26 - rnd(i + j) * 14).stroke({ width: 3, color: NV.mid });
  }
  // the palm
  g.moveTo(1500, 760).bezierCurveTo(1530, 600, 1480, 450, 1540, 300).stroke({ width: 34, color: 0x1a1a1a });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55;
    g.moveTo(1540, 300).quadraticCurveTo(1540 + Math.cos(a) * 160, 300 + Math.sin(a) * 60 - 40, 1540 + Math.cos(a) * 280, 300 + Math.sin(a) * 120 + 80).stroke({ width: 22, color: 0x141414 });
  }
  // the lighthouse
  g.poly([300, 760, 440, 760, 410, 260, 330, 260]).fill(0x4a4a4a);
  for (let i = 0; i < 4; i++) g.poly([300 + i * 7.5, 700 - i * 120, 440 - i * 7.5, 700 - i * 120, 437 - i * 7.5, 660 - i * 120, 303 + i * 7.5, 660 - i * 120]).fill(0x262626);
  g.rect(310, 200, 120, 70).fill(0xd8d8d8).rect(300, 190, 140, 14).fill(0x5a5a5a).poly([300, 190, 370, 140, 440, 190]).fill(0x5a5a5a);
  c.addChild(g);
  return c;
}
/** the lighthouse beam: a wide white band sweeping (additive) */
function sweep(ctx: SceneCtx): Sprite {
  const s = new Sprite(castTex(ctx, 'cone'));
  s.anchor.set(0, 0.5);
  s.blendMode = 'add';
  s.tint = 0xffffff;
  return s;
}

/** the viewfinder: brackets, REC, timecode (digit sprites swapped per frame — no text on the clock), battery, AF box */
class Visor extends Container {
  private digits: Sprite[] = [];
  private tex: Texture[] = [];
  private rec = new Graphics();
  readonly af = new Graphics();
  constructor(private ctx: SceneCtx) {
    super();
    const k = ctx.k;
    const v = k.view;
    const g = new Graphics();
    const L = 90;
    const m = 70;
    for (const [x, y, sx, sy] of [
      [v.x + m, v.y + m, 1, 1],
      [v.x + v.w - m, v.y + m, -1, 1],
      [v.x + m, v.y + v.h - m, 1, -1],
      [v.x + v.w - m, v.y + v.h - m, -1, -1],
    ] as const)
      g.moveTo(x, y + sy * L).lineTo(x, y).lineTo(x + sx * L, y).stroke({ width: 5, color: 0xffffff, alpha: 0.85 });
    // battery and the NV tag
    g.rect(v.x + v.w - 230, v.y + 100, 70, 32).stroke({ width: 4, color: 0xffffff, alpha: 0.85 }).rect(v.x + v.w - 160, v.y + 108, 8, 16).fill({ color: 0xffffff, alpha: 0.85 });
    for (let i = 0; i < 3; i++) g.rect(v.x + v.w - 224 + i * 21, v.y + 106, 16, 20).fill({ color: 0xffffff, alpha: 0.85 });
    this.addChild(g, this.rec, this.af);
    const style = { fontFamily: 'Space Grotesk', fontWeight: '600' as const, fontSize: 34, fill: 0xffffff, letterSpacing: 2 };
    const recT = word(k, 'REC', style, 0);
    recT.anchor.set(0, 0.5);
    recT.position.set(v.x + 160, v.y + 116);
    const nv = word(k, 'NV · 400 mm', style, 0);
    nv.anchor.set(0, 0.5);
    nv.position.set(v.x + 160, v.y + v.h - 116);
    this.addChild(recT, nv);
    for (let d = 0; d <= 9; d++) this.tex.push(word(k, String(d), style).texture);
    const colon = (x: number) => {
      const s = word(k, ':', style);
      s.position.set(x, v.y + 116);
      this.addChild(s);
    };
    const x0 = v.x + v.w - 560;
    for (let i = 0; i < 8; i++) {
      const s = new Sprite(this.tex[0]);
      s.anchor.set(0.5);
      s.position.set(x0 + i * 26 + Math.floor(i / 2) * 18, v.y + 116);
      this.digits.push(s);
      this.addChild(s);
      if (i % 2 === 1 && i < 7) colon(x0 + i * 26 + Math.floor(i / 2) * 18 + 22);
    }
  }
  /** m = film time: the timecode starts at 02:13:07 */
  update(m: number, f: FrameInfo, af?: { x: number; y: number; hunt: number }) {
    const t = 2 * 3600 + 13 * 60 + 7 + m;
    const hh = Math.floor(t / 3600);
    const mm = Math.floor((t % 3600) / 60);
    const ss = Math.floor(t % 60);
    const ff = Math.floor((t % 1) * 24);
    const vals = [hh, mm, ss, ff];
    vals.forEach((val, i) => {
      this.digits[i * 2].texture = this.tex[Math.floor(val / 10) % 10];
      this.digits[i * 2 + 1].texture = this.tex[val % 10];
    });
    const v = this.ctx.k.view;
    const r = this.rec.clear();
    if (Math.floor(m * 1.2) % 2 === 0 || f.rf) r.circle(v.x + 130, v.y + 116, 12).fill(0xffffff);
    const a = this.af.clear();
    if (af) {
      const j = af.hunt * (f.rm ? 0 : Math.sin(m * 22) * 18);
      const s = 70 + af.hunt * 30;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const)
        a.moveTo(af.x + j + sx * s, af.y + sy * s - sy * 22).lineTo(af.x + j + sx * s, af.y + sy * s).lineTo(af.x + j + sx * s - sx * 22, af.y + sy * s).stroke({ width: 4, color: 0xffffff, alpha: 0.9 });
    }
  }
}

interface Shot {
  can: Actor | null;
  luz: LuzRig | null;
  cer: StaticKitten | null;
  eyes: Sprite[];
  beam: Sprite;
  visor: Visor;
  lamp: Sprite | null;
  stage: Container;
}
/** every shot shares the island; `who` decides the cast on it */
function shot(ctx: SceneCtx, who: { can?: boolean; luz?: number; cer?: boolean } = {}): Shot {
  const far = island(ctx);
  ctx.plane(far, { z: 1300, bake: 'dof', blur: 16, dof: 900 });
  const stage = new Container();
  const beam = sweep(ctx);
  stage.addChild(beam);
  const cer = who.cer ? new StaticKitten(ctx, 120) : null;
  if (cer) stage.addChild(cer);
  const can = who.can ? ctx.actor(ctx.canelo, 240) : null;
  // in the green, his fur sits in the mid tones: what shines is the eyes (they see in the dark)
  if (can) {
    can.tint = 0x6e6e6e;
    stage.addChild(can);
  }
  const luz = who.luz ? luzOf(ctx, who.luz) : null;
  if (luz?.actor) stage.addChild(luz.actor);
  const lamp = luz ? glow(ctx, 0xffffff, 120, 0.9) : null;
  if (lamp) stage.addChild(lamp);
  const eyes = can ? [glow(ctx, 0xffffff, 60, 1), glow(ctx, 0xffffff, 60, 1)] : [];
  for (const e of eyes) stage.addChild(e);
  const cores = can ? [new Graphics().ellipse(0, 0, 10, 10).fill(0xffffff), new Graphics().ellipse(0, 0, 10, 10).fill(0xffffff)] : [];
  for (const c2 of cores) stage.addChild(c2);
  (eyes as (Sprite & { core?: Graphics })[]).forEach((e, i) => (e.core = cores[i]));
  ctx.plane(stage, { z: 1000 });
  const visor = new Visor(ctx);
  ctx.plane(visor, { z: 0, screen: true });
  return { can, luz, cer, eyes, beam, visor, lamp, stage };
}
/** the lighthouse sweep at film time m (the beam turns: a band crossing the island every ~7 s) */
function beamAt(s: Shot, m: number, rm: boolean, aim?: number) {
  const a = aim ?? (rm ? -0.25 : -0.6 + ((m * 0.14) % 1) * 1.5);
  s.beam.position.set(370, 230);
  s.beam.rotation = a;
  s.beam.scale.set(3600 / 512, 900 / 256);
  s.beam.alpha = 0.32;
}
/** Canelo's eyes shining in the dark (the brightest things in the frame), open 0..1 */
function eyesAt(s: Shot, open: number, rf: boolean) {
  const L = rigPoint(s.can, 'eyeL');
  const R = rigPoint(s.can, 'eyeR');
  s.eyes.forEach((e, i) => {
    const p = i ? R : L;
    if (!p) {
      e.visible = false;
      const core = (e as Sprite & { core?: Graphics }).core;
      if (core) core.visible = false;
      return;
    }
    e.visible = open > 0.02;
    e.position.set(p[0], p[1]);
    const sz = (s.can?.size ?? 240) * 0.2 * (rf ? 0.85 : 1);
    e.setSize(sz, sz * Math.max(0.08, open));
    e.alpha = 0.85;
    const core = (e as Sprite & { core?: Graphics }).core;
    if (core) {
      core.visible = e.visible;
      core.position.set(p[0], p[1]);
      const cs = (s.can?.size ?? 240) / 240;
      core.scale.set(cs * 0.7, cs * 0.7 * Math.max(0.1, open));
    }
  });
}
const PALM: [number, number] = [1420, 770];
const FARO: [number, number] = [470, 760];

// ------------------------------------------------------------------ D1 · the island at 2:13 a.m.
export const isla: SetModule = {
  cats: ({ canelo }) => [canelo, SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { can: true, luz: 120 });
    const place = word(ctx.k, 'ISLA DEL CAPI  ·  2:13 a. m.', { fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: 44, fill: 0xffffff, letterSpacing: 6 });
    const pl = new Container();
    pl.addChild(new Graphics().rect(-place.width / 2 - 30, -36, place.width + 60, 72).fill({ color: 0x000000, alpha: 0.7 }), place);
    pl.position.set(960, 230);
    ctx.plane(pl, { z: 0, screen: true });
    return {
      update(lt, f) {
        pl.alpha = sm(seg(lt, 0.5, 1.0)) * (1 - sm(seg(lt, 4.0, 4.6)));
        beamAt(s, f.m, f.rm);
        s.can?.pose(lt, PALM[0], PALM[1], { flip: true });
        eyesAt(s, 1, f.rf);
        s.luz?.actor?.pose(lt, 370, 190 + bob(lt, f.rm, 4));
        if (s.luz && s.lamp) s.lamp.position.set(...lanternAt(s.luz));
        s.visor.update(f.m, f);
      },
    };
  },
};
// ------------------------------------------------------------------ D2–D3 · the speck of static at the edge of the light; it gets scared
export const orilla: SetModule = {
  cats: () => [SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { cer: true });
    const lab = new Container();
    const sci = word(ctx.k, 'Registrum zero zero zero', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 46, fill: 0xffffff });
    lab.addChild(new Graphics().rect(-sci.width / 2 - 30, -40, sci.width + 60, 80).fill({ color: 0x000000, alpha: 0.75 }), sci);
    lab.position.set(960, 840);
    ctx.plane(lab, { z: 0, screen: true });
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm, -0.08);
        // D3: a step into the beam (6.4) → the static bristles → a jump back (7.4)
        const step = seg(lt, 6.4, 7.0);
        const back = seg(lt, 7.4, 7.8);
        const x = 1020 + step * 70 - back * 150;
        const y = 760 - Math.sin(back * Math.PI) * 60;
        s.cer?.position.set(x, y);
        s.cer?.update(lt, { stare: 0.7, bristle: env2(lt, 7.1, 8.0) });
        // the autofocus hunts, then locks (0.4–3.0)
        const hunt = 1 - sm(seg(lt, 1.0, 3.0));
        s.visor.update(f.m, f, { x: 960 + (1 - hunt) * 60, y: 600, hunt });
        lab.alpha = sm(seg(lt, 3.2, 3.8));
      },
    };
  },
};
const env2 = (lt: number, a: number, b: number) => Math.min(sm((lt - a) / 0.15), sm((b - lt) / 0.4));

// ------------------------------------------------------------------ D4 · Canelo by the palm: his eyes shine on their own
export const ojos: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { can: true });
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm);
        s.can?.pose(lt, PALM[0], PALM[1], { flip: true });
        eyesAt(s, 1, f.rf);
        s.visor.update(f.m, f, { x: 960, y: 520, hunt: 0 });
      },
    };
  },
};
// ------------------------------------------------------------------ D5 · if the gordo stops seeing him… he erases a little
export const borra: SetModule = {
  cats: ({ canelo }) => [canelo, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { can: true, cer: true });
    let slept = false;
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm, -0.1);
        // his eyes droop (1.2–2.6)… Cerito loses his ink … snap open at 4.4 → Cerito redraws
        const close = sm(seg(lt, 1.2, 2.6));
        const snap = lt > 4.4 ? 1 : 0;
        const open = snap ? 1 : 1 - close;
        if (!slept && lt > 1.6 && lt < 4.4) {
          s.can?.emote('sleepy', 1);
          slept = true;
        }
        if (slept && lt >= 4.4) {
          s.can?.emote('surprise', 1);
          slept = false;
        }
        s.can?.pose(lt, 760, 900, { flip: false, rot: close * (1 - snap) * 0.08 });
        eyesAt(s, open, f.rf);
        const erase = snap ? Math.max(0, 0.75 - seg(lt, 4.4, 5.6) * 0.75) : close * 0.75;
        s.cer?.position.set(1260, 760);
        s.cer?.update(lt, { stare: 0.6, erase });
        s.visor.update(f.m, f);
      },
    };
  },
};
// ------------------------------------------------------------------ D6–D7 · a paw in the light; the static calms; he sleeps; «Cerito»
export const toca: SetModule = {
  cats: () => [SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { cer: true });
    const lab = new Container();
    const sci = word(ctx.k, 'Registrum zero zero zero', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 46, fill: 0xffffff });
    const strike = new Graphics();
    const name = word(ctx.k, 'Cerito', { fontFamily: 'Permanent Marker', fontSize: 64, fill: 0xffffff });
    name.position.set(0, -70);
    name.rotation = -0.05;
    const nm = new Graphics();
    name.mask = nm;
    lab.addChild(new Graphics().rect(-sci.width / 2 - 30, -40, sci.width + 60, 80).fill({ color: 0x000000, alpha: 0.75 }), sci, strike, name, nm);
    lab.position.set(960, 840);
    ctx.plane(lab, { z: 0, screen: true });
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm, -0.06);
        // he comes back slowly (0–3), a paw into the light (3–4.5): the static calms; curls up (8–10)
        const come = sm(seg(lt, 0, 3));
        const touch = sm(seg(lt, 3.2, 4.6));
        const curl = sm(seg(lt, 8.2, 10));
        s.cer?.position.set(1180 - come * 160, 760 + curl * 14);
        s.cer?.scale.set(1, 1 - curl * 0.25);
        s.cer?.update(lt, { stare: 0.6 - curl * 0.5, clear: touch });
        s.visor.update(f.m, f, { x: 1010, y: 640, hunt: 0 });
        // the scientific name gets crossed out and rewritten (10.2–12)
        const st = seg(lt, 10.2, 10.8);
        strike.clear();
        if (st > 0) strike.moveTo(-sci.width / 2, 4).lineTo(-sci.width / 2 + sci.width * st, 0).stroke({ width: 6, color: 0xffffff });
        const w = seg(lt, 10.9, 12.0);
        nm.clear().rect(-160, -130, 320 * (f.rm ? (w > 0 ? 1 : 0) : w), 120).fill(0xffffff);
        name.visible = w > 0;
        lab.alpha = sm(seg(lt, 0.2, 0.8));
      },
    };
  },
};
// ------------------------------------------------------------------ D8 · the blanket: «¿Dónde la quiere el señor?» — the lighthouse or Canelo's palm (choice)
export const cobija: SetModule = {
  cats: ({ canelo }) => [canelo, SLUG.cerito, SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { can: true, cer: true, luz: 300 });
    const beamL = new Beam(ctx, 0xffffff);
    const blanket = new Graphics();
    const signs = new Container();
    const lf = word(ctx.k, '◀ EL FARO', { fontFamily: 'Bebas Neue', fontSize: 54, fill: 0xffffff, letterSpacing: 4 });
    lf.position.set(330, 470);
    const rp = word(ctx.k, 'LA PALMERA ▶', { fontFamily: 'Bebas Neue', fontSize: 54, fill: 0xffffff, letterSpacing: 4 });
    rp.position.set(1590, 470);
    signs.addChild(lf, rp);
    const top = new Container();
    top.addChild(beamL, blanket, signs);
    ctx.plane(top, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        beamAt(s, f.m, rm, -0.1);
        // the choice is decided at 4.6 (the fallback: the lighthouse)
        const j = ctx.k.judged('cobija');
        const side: 'left' | 'right' = (j?.r as string) === 'right' ? 'right' : 'left';
        const decided = lt >= 4.6 || !!j;
        const dest = side === 'left' ? FARO : PALM;
        s.luz?.actor?.pose(lt, 960, 500 + bob(lt, rm, 6), { flip: side === 'right' && decided });
        const la = s.luz ? lanternAt(s.luz) : ([960, 420] as [number, number]);
        if (s.lamp) s.lamp.position.set(la[0], la[1]);
        // the blanket: lifted by her beam (1.0–2.0), hovers, then floats to the chosen place (5.0–7.0) and falls on Cerito
        const lift = sm(seg(lt, 1.0, 2.0));
        const go = decided ? sm(seg(lt, 5.0, 6.8)) : 0;
        const bx = 960 + (dest[0] - 960) * go;
        const by = 640 - lift * 120 + (dest[1] - 60 - (640 - 120)) * go + Math.sin(lt * 2) * 8 * (1 - go);
        const g = blanket.clear();
        const wv = rm ? 0 : Math.sin(lt * 4) * 10;
        g.moveTo(bx - 80, by - 30 + wv).quadraticCurveTo(bx, by - 50, bx + 80, by - 30 - wv).lineTo(bx + 70, by + 30).quadraticCurveTo(bx, by + 20 + wv, bx - 70, by + 30).fill(0xbdbdbd).stroke({ width: 4, color: 0x2a2a2a });
        for (let i = 0; i < 3; i++) g.moveTo(bx - 60 + i * 40, by - 30).lineTo(bx - 60 + i * 40, by + 24).stroke({ width: 3, color: 0x6a6a6a });
        beamL.set(la, [bx, by], 50, (1 - go * 0.6) * lift * 0.6);
        // Cerito trots to the chosen place, under the blanket
        const cx = 980 + (dest[0] + 30 - 980) * sm(seg(lt, 5.2, 7.2));
        s.cer?.position.set(cx, 770);
        s.cer?.update(lt, { clear: 1, stare: 0.4 });
        s.can?.pose(lt, PALM[0] + 90, PALM[1] + 10, { flip: true });
        eyesAt(s, 1, f.rf);
        signs.visible = lt > 2.2 && lt < 5.2;
        signs.alpha = sm(seg(lt, 2.2, 2.6));
        s.visor.update(f.m, f);
      },
    };
  },
};
// ------------------------------------------------------------------ D9 · and a blanket for the gordo too
export const cobija2: SetModule = {
  cats: ({ canelo }) => [canelo, SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { can: true, luz: 260 });
    const beamL = new Beam(ctx, 0xffffff);
    const blanket = new Graphics();
    const meow = word(ctx.k, 'miau…', { fontFamily: 'Bangers', fontSize: 44, fill: 0xffffff });
    meow.position.set(1320, 470);
    const top = new Container();
    top.addChild(beamL, blanket, meow);
    ctx.plane(top, { z: 1000 });
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm, -0.12);
        const nod = (f.rm ? 0.5 : (Math.sin(lt * 1.3) + 1) / 2) * (1 - sm(seg(lt, 4.2, 4.6)));
        s.can?.pose(lt, 1200, 840, { flip: true, rot: nod * 0.1 });
        eyesAt(s, 1 - nod * 0.6, f.rf);
        s.luz?.actor?.pose(lt, 620, 520 + bob(lt, f.rm, 6), { flip: false });
        const la = s.luz ? lanternAt(s.luz) : ([620, 440] as [number, number]);
        if (s.lamp) s.lamp.position.set(la[0], la[1]);
        const go = sm(seg(lt, 1.0, 3.8));
        const bx = 760 + (1200 - 760) * go;
        const by = 560 + (720 - 560) * go - Math.sin(go * Math.PI) * 90;
        const g = blanket.clear();
        g.moveTo(bx - 120, by - 30).quadraticCurveTo(bx, by - 70, bx + 120, by - 30).lineTo(bx + 110, by + 50).quadraticCurveTo(bx, by + 30, bx - 110, by + 50).fill(0x6a6a6a).stroke({ width: 4, color: 0x111111 });
        for (let i = 0; i < 4; i++) g.moveTo(bx - 80 + i * 50, by - 40).lineTo(bx - 80 + i * 50, by + 40).stroke({ width: 3, color: 0x3a3a3a });
        beamL.set(la, [bx, by], 60, 0.5 * (1 - sm(seg(lt, 4.0, 4.6))));
        meow.visible = lt > 4.6 && lt < 6.6;
        s.visor.update(f.m, f);
      },
    };
  },
};
// ------------------------------------------------------------------ D10 · close on her, nearly white in the green: the confession, in jest
export const confesion: SetModule = {
  cats: () => [SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { luz: 760 });
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm, -0.9);
        // she looks at the lantern (2.4–4.2), laughs at herself (8.0–9.5)
        const look = sm(seg(lt, 2.4, 3.2)) * (1 - sm(seg(lt, 6.0, 6.8)));
        const laugh = f.rm ? 0 : Math.max(0, Math.sin((lt - 8) * 14)) * (lt > 8 && lt < 9.5 ? 1 : 0);
        s.luz?.actor?.pose(lt, 960, 1180 + bob(lt, f.rm, 5) - laugh * 8, { rot: -look * 0.08 });
        if (s.luz && s.lamp) {
          s.lamp.position.set(...lanternAt(s.luz));
          s.lamp.setSize(260, 260);
        }
        s.visor.update(f.m, f);
      },
    };
  },
};
// ------------------------------------------------------------------ D11–D12 · the island; «Cerito: población, 1.»; the night vision switches off like an old TV
export const final: SetModule = {
  cats: ({ canelo }) => [canelo, SLUG.cerito, SLUG.luz],
  build(ctx: SceneCtx): FilmSet {
    const s = shot(ctx, { can: true, cer: true, luz: 120 });
    const card = new Container();
    const cb = new Graphics().rect(-430, -60, 860, 120).fill({ color: 0x000000, alpha: 0.6 });
    const ct = word(ctx.k, 'Cerito: población, 1.', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 64, fill: 0xffffff });
    card.addChild(cb, ct);
    card.position.set(960, 880);
    const off = new Graphics();
    const scr = new Container();
    scr.addChild(card, off);
    ctx.plane(scr, { z: 0, screen: true });
    return {
      update(lt, f) {
        beamAt(s, f.m, f.rm);
        // where the blanket went (the choice) — Cerito sleeps there
        const j = ctx.k.judged('cobija');
        const dest = (j?.r as string) === 'right' ? PALM : FARO;
        s.cer?.position.set(dest[0] + 30, 770);
        s.cer?.scale.set(1, 0.78);
        s.cer?.update(lt, { clear: 1, stare: 0.1 });
        s.can?.pose(lt, PALM[0], PALM[1], { flip: true });
        eyesAt(s, 1, f.rf);
        s.luz?.actor?.pose(lt, 370, 190 + bob(lt, f.rm, 4));
        if (s.luz && s.lamp) s.lamp.position.set(...lanternAt(s.luz));
        card.alpha = sm(seg(lt, 0.8, 1.4)) * (1 - sm(seg(lt, 4.8, 5.2)));
        s.visor.update(f.m, f);
        // the TV-off: the picture collapses to a white line, then a dot
        const v = ctx.k.view;
        const p = seg(lt, 5.3, 5.9);
        const o = off.clear();
        if (p > 0) {
          const h = Math.max(4, (1 - p) * v.h * 0.5);
          o.rect(v.x - 10, v.y - 10, v.w + 20, v.h / 2 - h + 10).fill(0x000000).rect(v.x - 10, v.y + v.h / 2 + h, v.w + 20, v.h / 2 - h + 10).fill(0x000000);
          o.rect(v.x, v.y + v.h / 2 - 2, v.w * (1 - Math.max(0, p - 0.7) * 3), 4).fill({ color: 0xffffff, alpha: 0.9 });
        }
      },
      // the night vision lets go: the green drains back to the island's own colour as the tube switches off
      look: (lt) => (lt > 5.2 ? { duo: 1 - sm(seg(lt, 5.2, 5.6)), grain: 0.05 } : null),
    };
  },
};
void outBack;
