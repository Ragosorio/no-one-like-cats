/**
 * F05 «La Batalla de Gatos» — the sets (shot list in ./index.ts). A photocopied flyer: everything black, white and
 * grey (the style's post is mono); the photos are the MAI paintings through the copier bake.
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { Bitacora, HOMIAU, TV, TvScreen, kitTex, luzOf, lanternAt, bob, outBack, rnd, seg, sm, word } from '../kit';
import { pasteLetters, ransom, staple, tape } from '../f03/print';
import { STANDINS } from '../../../standins';

const INK = 0x141414;
const PAPER = 0xf2f1ec;
/** EMIAU (his painting: platinum buzz cut, grey hoodie, chain) and his crew, Bocina and Scratch, in the burnt photo */
export const EMIAU_STANDIN = STANDINS.emiau;
const CREW = [STANDINS.bocina, STANDINS.scratch];
/** the mob in the burnt photo (existing species — STAND-INS for the Borracha's neighbours) */
const VECINOS = ['margarita_daisy_cat', 'guijarro_pebble_cat', 'ronron_purr_cat'];
/** the cat in the comic strips (a generic shooter) */
const TIRADOR = 'guijarro_pebble_cat';
const SPB = 60 / 165;
const SHEET_H = 3560;

const hand = (ctx: SceneCtx, text: string, size: number, color = INK) => word(ctx.k, text, { fontFamily: 'Permanent Marker', fontSize: size, fill: color });

/** the flyer sheet (paper texture), tall, x 200..1720 × y 0..SHEET_H */
function sheet(ctx: SceneCtx): Container {
  const c = new Container();
  c.addChild(new Graphics().rect(-400, -400, 2720, 4400).fill(0x2a2a2a));
  const tex = ctx.tex('fc:paper') as Texture | undefined;
  if (tex) {
    const t = new Sprite(tex);
    t.position.set(200, 0);
    t.setSize(1520, SHEET_H);
    c.addChild(t);
  } else c.addChild(new Graphics().rect(200, 0, 1520, SHEET_H).fill(PAPER));
  const g = new Graphics();
  // copier streaks and a grey border band (the copier's edge)
  g.rect(200, 0, 1520, SHEET_H).stroke({ width: 18, color: 0x7a7a7a, alpha: 0.6 });
  for (let i = 0; i < 5; i++) g.rect(260 + rnd(i) * 1400, 0, 3 + rnd(i + 2) * 5, SHEET_H).fill({ color: 0x8a8a8a, alpha: 0.25 });
  c.addChild(g);
  return c;
}

/** a «photo» print: white border, dark burnt interior; returns the frame + an inner container to fill */
function photo(w: number, h: number, rot: number): { root: Container; inner: Container } {
  const root = new Container();
  const g = new Graphics();
  g.rect(-w / 2 + 10, -h / 2 + 12, w, h).fill({ color: 0x000000, alpha: 0.35 });
  g.rect(-w / 2, -h / 2, w, h).fill(0xfafafa);
  g.rect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 50).fill(0x1a1a1a);
  root.addChild(g);
  const inner = new Container();
  const m = new Graphics().rect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 50).fill(0xffffff);
  inner.mask = m;
  root.addChild(inner, m);
  root.rotation = rot;
  return { root, inner };
}

/** a placard on a stick (a mob sign) */
function placard(ctx: SceneCtx, text: string, w: number, rot: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(-6, 0, 12, 230).fill(0x6a6a6a);
  g.rect(-w / 2, -120, w, 130).fill(PAPER).stroke({ width: 6, color: INK });
  c.addChild(g);
  const t = word(ctx.k, text, { fontFamily: 'Permanent Marker', fontSize: 30, fill: INK, align: 'center', wordWrap: true, wordWrapWidth: w - 24, lineHeight: 32 });
  t.position.set(0, -55);
  c.addChild(t);
  c.rotation = rot;
  return c;
}
/** a torch (flame drawn in grey: it's a photocopy) */
function torch(g: Graphics, x: number, y: number) {
  g.rect(x - 7, y, 14, 200).fill(0x5a5a5a);
  g.moveTo(x - 30, y).quadraticCurveTo(x - 34, y - 60, x + 4, y - 110).quadraticCurveTo(x + 36, y - 60, x + 30, y).quadraticCurveTo(x, y + 20, x - 30, y).fill(0xeaeaea).stroke({ width: 5, color: INK });
}

/** the rig points (head centre, neck) of a STILL sprite of `slug` sized `size` (anchor 0.5, 0.97) */
function rigOf(ctx: SceneCtx, slug: string, size: number): { head: [number, number, number, number]; neck: [number, number] } | null {
  const p = ctx.studio.puppet(slug);
  const rig = p?.brain.model?.rig;
  if (!p || !rig) {
    p?.destroy();
    return null;
  }
  const s = size / p.H;
  const L = (x: number, y: number): [number, number] => [(x - p.anchor.x * p.W) * s, (y - p.anchor.y * p.H) * s];
  const [hx, hy] = L(rig.head[0], rig.head[1]);
  const neck = L(rig.neck[0], rig.neck[1]);
  const out = { head: [hx, hy, rig.head[2] * s, rig.head[3] * s] as [number, number, number, number], neck };
  p.destroy();
  return out;
}

/** an element icon: a flame or a drop (grey on the flyer) */
function element(g: Graphics, kind: 'fuego' | 'agua', x: number, y: number, s: number) {
  if (kind === 'fuego') {
    g.moveTo(x - 22 * s, y + 10 * s).quadraticCurveTo(x - 26 * s, y - 24 * s, x, y - 46 * s).quadraticCurveTo(x + 26 * s, y - 24 * s, x + 22 * s, y + 10 * s).quadraticCurveTo(x, y + 30 * s, x - 22 * s, y + 10 * s).fill(0x2a2a2a).stroke({ width: 4, color: INK });
    g.moveTo(x - 10 * s, y + 8 * s).quadraticCurveTo(x - 10 * s, y - 10 * s, x, y - 22 * s).quadraticCurveTo(x + 10 * s, y - 10 * s, x + 10 * s, y + 8 * s).fill(0xeaeaea);
  } else {
    g.moveTo(x, y - 44 * s).quadraticCurveTo(x + 30 * s, y - 4 * s, x + 22 * s, y + 14 * s).quadraticCurveTo(x, y + 34 * s, x - 22 * s, y + 14 * s).quadraticCurveTo(x - 30 * s, y - 4 * s, x, y - 44 * s).fill(0xffffff).stroke({ width: 4, color: INK });
    g.circle(x - 8 * s, y + 4 * s, 6 * s).fill(0x9a9a9a);
  }
}

interface FlyerParts {
  root: Container;
  /** things that get pasted (shown/animated by the film; all visible in the static riesgo copy) */
  head: { letters: Container[]; lines: Container[] };
  mob: Container;
  mobCap: { letters: Container[] };
  stapleG: Graphics;
  canelo: Container;
  qmarks: Container;
  reto: { letters: Container[] };
  emiau: Container;
  stamp: Container;
  champ: { letters: Container[] };
  panels: Container[];
  marks: Container[];
  regla: { letters: Container[] };
  reglaHand: Container;
}

function flyerParts(ctx: SceneCtx): FlyerParts {
  const root = new Container();
  // ---- A: the headline
  const lines: Container[] = [];
  const all: Container[] = [];
  const mk = (text: string, size: number, y: number, seed: number) => {
    const r = ransom(ctx, text, size, seed);
    r.root.position.set(960, y);
    root.addChild(r.root);
    lines.push(r.root);
    all.push(...r.letters);
    return r;
  };
  mk('BATALLA', 170, 190, 3);
  mk('DE GATOS', 170, 380, 11);
  mk('ESTA NOCHE', 92, 545, 19);
  mk('KARAOKE «EL ÚLTIMO TRAGO»', 50, 660, 27);
  // ---- B: the burnt photo of the mob (stapled) + caption
  const ph = photo(1000, 500, -0.03);
  ph.root.position.set(900, 1000);
  const bgp = new Graphics();
  bgp.rect(-500, -260, 1000, 520).fill(0x1a1a1a);
  const tg = new Graphics();
  for (const x of [-360, -60, 260, 420]) torch(tg, x, -40);
  ph.inner.addChild(bgp, tg);
  [...VECINOS, VECINOS[1], VECINOS[0]].forEach((slug, i) => {
    const s = ctx.still(slug);
    if (!s) return;
    s.scale.set(300 / s.texture.height);
    s.position.set(-400 + i * 200, 250 + (i % 2) * 20);
    if (i % 2) s.scale.x *= -1;
    ph.inner.addChild(s);
  });
  for (const [t, x, w, r] of [
    ['QUEREMOS OLVIDAR', -330, 250, -0.08],
    ['FUERA EL GATO NARANJA', 40, 300, 0.05],
    ['DEVUÉLVANNOS LA MAÑANA', 340, 280, -0.04],
  ] as const) {
    const p = placard(ctx, t, w, r);
    p.position.set(x, -110);
    ph.inner.addChild(p);
  }
  // Homiau, the only happy one, with the only different sign (his painting, a still like the others)
  const ho = ctx.still(HOMIAU);
  if (ho) {
    ho.scale.set(250 / ho.texture.height);
    ho.position.set(-150, 260);
    ph.inner.addChild(ho);
  }
  const hp = placard(ctx, 'YO SÍ ME QUIERO ACORDAR', 230, 0.1);
  hp.scale.set(0.8);
  hp.position.set(-120, 30);
  ph.inner.addChild(hp);
  root.addChild(ph.root);
  const stapleG = new Graphics();
  staple(stapleG, 470, 770, 0.05);
  staple(stapleG, 1330, 750, -0.08);
  root.addChild(stapleG);
  const mobCap = ransom(ctx, 'EL BARRIO SE ACUERDA DE TODO', 52, 41);
  mobCap.root.position.set(960, 1300);
  root.addChild(mobCap.root);
  // ---- C: Canelo cut out, scared, with marker question marks
  const can = new Container();
  const cs = ctx.still(ctx.canelo);
  const cw = ctx.silhouette(ctx.canelo);
  if (cs && cw) {
    const s = 430 / cs.texture.height;
    cs.scale.set(s);
    cw.scale.set(s * 1.06, s * 1.04);
    cw.tint = 0xfafafa;
    cw.position.set(0, 10);
    const shadow = ctx.silhouette(ctx.canelo)!;
    shadow.scale.set(s * 1.06, s * 1.04);
    shadow.tint = 0x000000;
    shadow.alpha = 0.35;
    shadow.position.set(12, 22);
    can.addChild(shadow, cw, cs);
  }
  can.position.set(1260, 1890);
  can.rotation = 0.06;
  root.addChild(can);
  const qmarks = new Container();
  for (const [x, y, s, r] of [
    [1040, 1560, 110, -0.2],
    [1500, 1520, 140, 0.25],
    [1560, 1760, 80, 0.1],
  ] as const) {
    const q = hand(ctx, '?', s);
    q.position.set(x, y);
    q.rotation = r;
    qmarks.addChild(q);
  }
  const sw = new Graphics();
  for (let i = 0; i < 3; i++) sw.moveTo(1080 + i * 26, 1670 - i * 6).lineTo(1060 + i * 26, 1710 - i * 6).stroke({ width: 7, color: INK, cap: 'round' });
  qmarks.addChild(sw);
  root.addChild(qmarks);
  const reto1 = ransom(ctx, 'RETADOR:', 70, 53);
  reto1.root.position.set(640, 1500);
  const reto2 = ransom(ctx, '¿¿EL GATO NARANJA??', 56, 61);
  reto2.root.position.set(900, 1990);
  root.addChild(reto1.root, reto2.root);
  // ---- D: EMIAU (his painting), his crew behind him (Bocina, Scratch), burnt contrast; INVICTO stamp
  const ep = photo(700, 640, 0.025);
  ep.root.position.set(760, 2370);
  const em = new Container();
  CREW.forEach((slug, i) => {
    const c = ctx.still(slug);
    if (!c) return;
    c.scale.set(400 / c.texture.height);
    if (i === 0) c.scale.x *= -1;
    c.position.set(i ? 205 : -205, -10);
    c.tint = 0xb4b4b4;
    em.addChild(c);
  });
  const es = ctx.still(EMIAU_STANDIN);
  const ER = 560;
  if (es) {
    es.scale.set(ER / es.texture.height);
    em.addChild(es);
  }
  em.position.set(0, 300);
  ep.inner.addChild(em);
  root.addChild(ep.root);
  const stamp = new Container();
  const sg = new Graphics();
  sg.roundRect(-250, -70, 500, 140, 14).stroke({ width: 12, color: INK });
  sg.roundRect(-232, -52, 464, 104, 8).stroke({ width: 4, color: INK });
  const st = word(ctx.k, 'INVICTO', { fontFamily: 'Anton', fontSize: 100, fill: INK, letterSpacing: 10 });
  stamp.addChild(sg, st);
  stamp.position.set(1270, 2270);
  stamp.rotation = -0.22;
  root.addChild(stamp);
  const champ = ransom(ctx, 'CAMPEÓN: EMIAU «SLIM BIGOTES»', 50, 71);
  champ.root.position.set(960, 2750);
  root.addChild(champ.root);
  // ---- E: two comic strips (three panels each) — the rule RIMA, shown
  const panels: Container[] = [];
  const marks: Container[] = [];
  const PW = 380;
  const PH = 300;
  const strip = (y: number, kinds: ('fuego' | 'agua')[], good: boolean) => {
    for (let i = 0; i < 3; i++) {
      const p = new Container();
      const g = new Graphics();
      g.rect(-PW / 2 + 8, -PH / 2 + 10, PW, PH).fill({ color: 0x000000, alpha: 0.3 });
      g.rect(-PW / 2, -PH / 2, PW, PH).fill(0xfbfbfb).stroke({ width: 8, color: INK });
      p.addChild(g);
      if (i < 2) {
        const cat = ctx.still(TIRADOR);
        if (cat) {
          cat.scale.set(200 / cat.texture.height);
          cat.position.set(-120, 130);
          p.addChild(cat);
        }
        const e = new Graphics();
        // the shot leaving the cannon with its element
        e.rect(-60, 40, 90, 34).fill(0x3a3a3a).stroke({ width: 4, color: INK });
        for (let k = 0; k < 4; k++) e.circle(60 + k * 34, 30 - k * 22, 5).fill(INK);
        element(e, kinds[i], 150, -60, 1.3);
        p.addChild(e);
      } else if (!good) {
        // boos, tomatoes, a weak «pff» hit
        const e = new Graphics();
        for (let k = 0; k < 5; k++) {
          const x = -150 + k * 70;
          const y = -60 + (k % 2) * 50;
          e.circle(x, y, 22).fill(0x4a4a4a).stroke({ width: 4, color: INK });
          e.poly([x - 6, y - 22, x, y - 34, x + 8, y - 22]).fill(0x1a1a1a);
          e.moveTo(x - 50, y + 26).lineTo(x - 30, y + 14).stroke({ width: 4, color: INK });
        }
        e.star(100, 90, 6, 30, 16).fill(0xdddddd).stroke({ width: 3, color: INK });
        p.addChild(e);
        const boo = word(ctx.k, '¡BUUU!', { fontFamily: 'Bangers', fontSize: 64, fill: INK, letterSpacing: 2 });
        boo.position.set(-40, -105);
        const pff = word(ctx.k, 'pff…', { fontFamily: 'Permanent Marker', fontSize: 40, fill: INK });
        pff.position.set(110, 30);
        p.addChild(boo, pff);
      } else {
        // the crowd roars, the shot comes out big: COMBO
        const e = new Graphics();
        e.star(30, 30, 14, 140, 70, 0.2).fill(0xffffff).stroke({ width: 6, color: INK });
        for (let k = 0; k < 7; k++) e.circle(-170 + k * 56, 120, 26).fill(0x2a2a2a);
        p.addChild(e);
        const oh = word(ctx.k, '¡OOOH!', { fontFamily: 'Bangers', fontSize: 66, fill: INK, letterSpacing: 2 });
        oh.position.set(-60, -100);
        const cb = word(ctx.k, 'COMBO ×2', { fontFamily: 'Anton', fontSize: 50, fill: INK, letterSpacing: 2 });
        cb.position.set(30, 30);
        p.addChild(oh, cb);
      }
      p.position.set(440 + i * 410, y);
      root.addChild(p);
      panels.push(p);
    }
    // the hand-drawn verdict at the strip's end
    const mk2 = new Container();
    const mg = new Graphics();
    if (good) mg.moveTo(-40, 0).lineTo(-8, 34).lineTo(50, -40).stroke({ width: 14, color: INK, cap: 'round', join: 'round' });
    else mg.moveTo(-38, -38).lineTo(38, 38).moveTo(38, -38).lineTo(-38, 38).stroke({ width: 14, color: INK, cap: 'round' });
    mg.circle(0, 0, 62).stroke({ width: 6, color: INK });
    mk2.addChild(mg);
    const lbl = hand(ctx, good ? 'VARÍA' : 'REPITE', 44);
    lbl.position.set(0, 96);
    mk2.addChild(lbl);
    mk2.position.set(1560, y - 10);
    root.addChild(mk2);
    marks.push(mk2);
  };
  strip(2930, ['fuego', 'fuego'], false);
  strip(3250, ['fuego', 'agua'], true);
  const regla = ransom(ctx, 'REGLA: RIMA', 82, 83);
  regla.root.position.set(960, 3440);
  const reglaHand = hand(ctx, 'Repite y te abuchean. Varía y te aplauden.', 48);
  reglaHand.position.set(960, 3515);
  reglaHand.rotation = -0.02;
  root.addChild(regla.root, reglaHand);
  void all;
  return { root, head: { letters: all, lines }, mob: ph.root, mobCap, stapleG, canelo: can, qmarks, reto: { letters: [...reto1.letters, ...reto2.letters] }, emiau: ep.root, stamp, champ, panels, marks, regla, reglaHand };
}

const ALL = (ctx: SceneCtx) => [ctx.canelo, EMIAU_STANDIN, TIRADOR, ...VECINOS, HOMIAU, ...CREW];

// ------------------------------------------------------------------ 1 · the flyer: pasted on the beat
export const flyer: SetModule = {
  cats: ({ canelo }) => [canelo, EMIAU_STANDIN, ...VECINOS, HOMIAU, ...CREW],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    ctx.plane(sheet(ctx), { z: 1000, bake: 'static', res: 1.1 });
    const F = flyerParts(ctx);
    ctx.plane(F.root, { z: 1000 });
    const scr = new TvScreen(ctx);
    ctx.plane(scr, { z: 0, screen: true });
    const pop = (c: Container, lt: number, t0: number, big = 0.4) => {
      const p = seg(lt, t0, t0 + 0.16);
      c.visible = lt >= t0;
      if (!c.visible) return;
      const base = (c as Container & { _base?: number })._base ?? (((c as Container & { _base?: number })._base = c.scale.x), c.scale.x);
      const k = rm ? 1 : 1 + (1 - outBack(p, 2.4)) * big;
      c.scale.set(base * k, Math.abs(base) * k);
      c.alpha = rm ? sm(p * 2) : 1;
    };
    return {
      update(lt, f) {
        // A · letters land on the beat (the whole headline in ~3.4 s)
        pasteLetters(F.head.letters, lt, 0.15, 3.3, rm);
        // B · the photo is slapped and STAPLED on the strong beat (4.0), then the caption
        pop(F.mob, lt, 4.1, 0.25);
        F.stapleG.visible = lt >= 4.4;
        pasteLetters(F.mobCap.letters, lt, 5.2, 7.2, rm);
        // C · Canelo's cut-out, the marker ?? scribbled, the caption
        pop(F.canelo, lt, 9.15, 0.3);
        F.qmarks.visible = lt >= 9.8;
        F.qmarks.alpha = sm(seg(lt, 9.8, 10.1));
        pasteLetters(F.reto.letters, lt, 10.2, 12.0, rm);
        // D · EMIAU's photo; the INVICTO stamp falls on the beat (13.85), the caption
        pop(F.emiau, lt, 13.15, 0.2);
        const sp = seg(lt, 13.85, 14.0);
        F.stamp.visible = lt >= 13.85;
        F.stamp.scale.set(rm ? 1 : 1 + (1 - sp) * 1.6);
        F.stamp.alpha = rm ? sm(sp) : Math.min(1, sp * 3);
        pasteLetters(F.champ.letters, lt, 14.6, 16.6, rm);
        // E · the strips, panel by panel; the verdicts; the rule
        F.panels.forEach((p, i) => pop(p, lt, 18.2 + (i < 3 ? i * 0.62 : 2.2 + (i - 3) * 0.62), 0.18));
        pop(F.marks[0], lt, 20.1, 0.5);
        pop(F.marks[1], lt, 22.3, 0.5);
        pasteLetters(F.regla.letters, lt, 22.6, 23.4, rm);
        F.reglaHand.visible = lt >= 23.0;
        F.reglaHand.alpha = sm(seg(lt, 23.0, 23.4));
        // the stapler / stamp jolts the camera (a document camera knocked on the beat)
        const j = (lt >= 4.4 && lt < 4.6) || (lt >= 13.85 && lt < 14.05) ? 1 : 0;
        F.root.position.set(0, j && !rm ? Math.sin(lt * 90) * 6 : 0);
        scr.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 2 · luz: «¡VAMOS, GORDO!» in the air
export const luz: SetModule = {
  cats: ['luzterna'],
  build(ctx): FilmSet {
    const rm = ctx.rm;
    const g = new Graphics();
    // the karaoke from the back: the little stage, the screen with lyrics, heads of the crowd
    g.rect(-200, -200, 2320, 1500).fill(0x4a4468);
    g.rect(480, 140, 960, 380).fill(0x3a3460).stroke({ width: 6, color: TV.line });
    for (let i = 0; i < 4; i++) g.roundRect(560, 200 + i * 70, 500 + (i % 2) * 200, 26, 12).fill(0x6a6490);
    g.rect(240, 600, 1440, 80).fill(0x4a3a2a).stroke({ width: 6, color: TV.line });
    g.rect(940, 430, 10, 180).fill(0x8a8a9a);
    g.circle(945, 420, 22).fill(0x6a6a7a).stroke({ width: 4, color: TV.line });
    for (let i = 0; i < 16; i++) {
      const x = 260 + i * 92 + (i % 2) * 20;
      const y = 900 + (i % 3) * 40;
      g.circle(x, y, 60).fill(0x1a1628).stroke({ width: 5, color: TV.line });
      g.poly([x - 50, y - 30, x - 40, y - 90, x - 10, y - 50]).fill(0x1a1628);
      g.poly([x + 50, y - 30, x + 40, y - 90, x + 10, y - 50]).fill(0x1a1628);
    }
    ctx.plane(g, { z: 1200, bake: 'static' });
    const live = new Container();
    const lr = luzOf(ctx, 470);
    if (lr.actor) live.addChild(lr.actor);
    // the light writing: a glowing text revealed by the lantern's tip + the half «O» that runs out
    const sty = { fontFamily: 'Permanent Marker', fontSize: 96, fill: 0x9fe4ff };
    const txt = word(ctx.k, '¡VAMOS, GORD', sty, 0);
    txt.anchor.set(0, 0.5);
    const glow1 = word(ctx.k, '¡VAMOS, GORD', { ...sty, fill: 0x2aa8ff }, 0);
    glow1.anchor.set(0, 0.5);
    glow1.blendMode = 'add';
    glow1.scale.set(1.03);
    const TX = 330;
    const TY = 330;
    for (const s of [txt, glow1]) s.position.set(TX, TY);
    glow1.position.set(TX - 6, TY - 2);
    const wm = new Graphics();
    const wc = new Container();
    wc.addChild(glow1, txt);
    wc.mask = wm;
    live.addChild(wc, wm);
    const half = new Graphics();
    const sparks = new Graphics();
    live.addChild(half, sparks);
    const glow = new Sprite(kitTex(ctx, 'glow'));
    glow.anchor.set(0.5);
    glow.tint = TV.lantern;
    glow.blendMode = 'add';
    live.addChild(glow);
    ctx.plane(live, { z: 1000 });
    const scr = new TvScreen(ctx);
    ctx.plane(scr, { z: 0, screen: true });
    const W0 = 0.25;
    const W1 = 1.85;
    const TW = txt.width;
    const OX = TX + TW + 52;
    return {
      update(lt, f) {
        const b = bob(lt, rm, 8);
        // her lantern rides the writing head (she moves along under the letters)
        const wp = seg(lt, W0, W1);
        const hx = TX + TW * wp;
        const shake = lt > 2.35 && lt < 2.95 && !rm ? Math.sin(lt * 50) * 0.25 : 0;
        lr.actor?.pose(lt, Math.min(OX, hx) + 150, 900 + b, { flip: true, rot: shake });
        wm.clear().rect(TX - 20, TY - 90, (hx - TX) + 20, 180).fill(0xffffff);
        // the last O: only half of it before the light sputters out
        const hp = seg(lt, W1, 2.3);
        const h = half.clear();
        if (hp > 0) {
          const a0 = -Math.PI * 0.4;
          const a1 = a0 - Math.PI * 1.05 * hp;
          const flick = rm ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(lt * 37));
          h.arc(OX, TY + 6, 40, a0, a1, true).stroke({ width: 22, color: 0x2aa8ff, alpha: 0.45 * flick, cap: 'round' });
          h.arc(OX, TY + 6, 40, a0, a1, true).stroke({ width: 9, color: 0x9fe4ff, alpha: flick, cap: 'round' });
        }
        // sparks at the tip while writing; a last fizzle
        const s = sparks.clear();
        const tipX = hp > 0 ? OX - 40 * Math.cos(Math.PI * 0.4 + Math.PI * 1.05 * hp) : hx;
        const tipY = hp > 0 ? TY + 6 - 40 * Math.sin(-Math.PI * 0.4 - Math.PI * 1.05 * hp) : TY + 20;
        const on = lt >= W0 && lt < 2.5;
        if (on) {
          const st = Math.floor(lt * 24);
          const n = lt > 2.2 ? 4 : 12;
          for (let i = 0; i < n; i++) {
            const a = rnd(i + st) * Math.PI * 2;
            const d = 10 + rnd(i * 3 + st) * 40;
            s.moveTo(tipX, tipY).lineTo(tipX + Math.cos(a) * d, tipY + Math.sin(a) * d).stroke({ width: 3, color: 0xd8f4ff, alpha: 0.9 });
          }
        }
        if (lr.actor) {
          const [lx, ly] = lanternAt(lr);
          glow.position.set(lx, ly);
          const dim = lt > 2.3 ? 0.5 + 0.5 * (1 - sm(seg(lt, 2.3, 2.5))) : 1;
          glow.scale.set(1.1 * dim);
          glow.alpha = 0.7 * dim;
        }
        scr.update(f);
      },
    };
  },
};

// ------------------------------------------------------------------ 3 · riesgo: back on the flyer (everything pasted) + the logbook
export const riesgo: SetModule = {
  cats: ({ canelo }) => [canelo, EMIAU_STANDIN, ...VECINOS, HOMIAU, ...CREW],
  build(ctx): FilmSet {
    const c = new Container();
    c.addChild(sheet(ctx));
    const F = flyerParts(ctx);
    c.addChild(F.root);
    const tp = new Graphics();
    tape(tp, 380, 60, 200, -0.3);
    tape(tp, 1540, 60, 200, 0.3);
    c.addChild(tp);
    ctx.plane(c, { z: 1000, bake: 'static' });
    const pg = new Bitacora(ctx, 'Que el barrio nos dé la espalda. Y la dignidad del gordo (poca).');
    const ui = new Container();
    ui.addChild(pg);
    ctx.plane(ui, { z: 0, screen: true });
    const scr = new TvScreen(ctx);
    ctx.plane(scr, { z: 0, screen: true });
    return {
      update(lt, f) {
        pg.update(lt - 0.1, ctx.rm);
        scr.update(f);
      },
    };
  },
};
void [ALL, SPB, Sprite];
