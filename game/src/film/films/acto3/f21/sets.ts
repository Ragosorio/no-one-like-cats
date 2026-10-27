/**
 * F21 · PH «El plan» (H86) — LEONARDO'S NOTEBOOK: La Mano explains her plan as a study of optics, light and the eye,
 * the two subjects of the notebooks. The index's open book becomes the codex and fills the screen; iron-gall sepia and
 * sanguine on vellum, left-handed hatching, mirror writing, drawings that animate inside the page: a lamp whose rays
 * pass through the walls of a box (her light, seen from above); Leonardo's ornithopters, a hand drawn on each wing,
 * gliding down the ray; «…Yo los traje.»; the anatomy of the eye — CANELO's, the flame in the pupil — «A una posibilidad
 * la sostienen dos cosas…»; the Vitruvian cat (Cerito held by two lines, the lantern's and the eye's); the mirror note;
 * La Gatoconda smiling in a portrait; «Apaga la luz. Y ciérrale los ojos al gato.» / «¿Y si no?»; she turns the page
 * to his eye again and says nothing; HER light burns a hole in the vellum right over the eye; «No, wey.»
 * Then the return (R3): «¿Qué quería?» / «Tus ojos. Le dije que no.»; he covers his eyes; she lowers his paws with the
 * beam; «Ya, gordo. Duérmete. Yo vigilo.»; alone at the bow, the lantern higher than usual.
 * Guion: historia-v2/guiones/acto-3/h86-lo-que-la-luz-trajo.md (P1–P14, G1–G4). The threat names only Canelo.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { circlePts, DV, hand, parchment, rectPts, Sketch, type Stroke } from '../../../styles/davinci';
import { Beam, BookFrame, env, flame, FLAME, glowSprite, lanternAt, LB, luzOf, bob, manoFigure, Printed, rnd, seg, sm, StaticKitten, STAND, tailTip, wob, word, prewarm } from '../kit';

const strokes = (list: [number, number][][], width = 2.4, color: number = DV.ink, seed = 1, amp = 1.6): Stroke[] => list.map((pts, i) => ({ pts: hand(pts, amp, seed + i * 13), width, color }));
const line = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [
  [x0, y0],
  [x1, y1],
];
/** left-handed hatching ↘ inside a rect (top-left to bottom-right strokes) */
function hatch(x: number, y: number, w: number, h: number, gap = 14): [number, number][][] {
  const out: [number, number][][] = [];
  for (let d = -h; d < w; d += gap) out.push(line(x + Math.max(0, d), y + Math.max(0, -d), x + Math.min(w, d + h), y + Math.min(h, h - (d + h - w > 0 ? d + h - w : 0))));
  return out;
}

/** the codex page: vellum over the whole frame, the stitched gutter (the notebook's seam) */
function vellum(ctx: SceneCtx, seed: number): Container {
  const c = new Container();
  const p = new Sprite(parchment(ctx.baker, 2900, 1700, seed));
  p.position.set(-490, -310);
  c.addChild(p);
  const g = new Graphics();
  g.rect(950, -160, 20, 1400).fill({ color: DV.burnt, alpha: 0.18 });
  for (let y = 20; y < 1080; y += 70) g.moveTo(954, y).lineTo(966, y + 30).stroke({ width: 3, color: DV.inkL, alpha: 0.6 });
  c.addChild(g);
  return c;
}

/** a Leonardo ornithopter with a hand drawn on each wing */
function ornithopter(cx: number, cy: number, s: number, seed: number): Stroke[] {
  const L: [number, number][][] = [];
  // the boat-like body
  L.push([
    [cx - 60 * s, cy],
    [cx - 30 * s, cy + 18 * s],
    [cx + 40 * s, cy + 18 * s],
    [cx + 70 * s, cy],
    [cx - 60 * s, cy],
  ]);
  for (const side of [-1, 1]) {
    // the wing frame with its ribs
    const tip: [number, number] = [cx + side * 190 * s, cy - 70 * s];
    L.push([[cx + side * 10 * s, cy - 4 * s], [cx + side * 90 * s, cy - 60 * s], tip]);
    for (let r = 0; r < 4; r++) L.push([[cx + side * (20 + r * 40) * s, cy - (8 + r * 12) * s], [cx + side * (40 + r * 42) * s, cy + (14 - r * 8) * s]]);
    L.push([[cx + side * 10 * s, cy + 6 * s], [cx + side * 100 * s, cy + 22 * s], tip]);
    // the hand on the wing: palm + four fingers
    const hx = cx + side * 100 * s;
    const hy = cy - 18 * s;
    L.push(circlePts(hx, hy, 12 * s, 12));
    for (let f = 0; f < 4; f++) L.push(line(hx - 9 * s + f * 6 * s, hy - 10 * s, hx - 12 * s + f * 8 * s, hy - 28 * s));
  }
  return strokes(L, 2, DV.ink, seed, 1.2);
}

/** CANELO's eye, anatomically: almond lids, iris rings, the flame in the pupil, sanguine shading */
function eyeStrokes(cx: number, cy: number, s: number, seed: number): Stroke[] {
  const L: [number, number][][] = [];
  const almond = (k: number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      pts.push([cx + Math.cos(t) * 330 * s * k, cy + Math.sin(t) * (Math.sin(t) > 0 ? 150 : 175) * s * k]);
    }
    return pts;
  };
  L.push(almond(1), almond(1.12));
  L.push(circlePts(cx, cy, 150 * s, 40), circlePts(cx, cy, 120 * s, 40));
  // the vertical slit pupil and, in it, a flame
  L.push([
    [cx, cy - 120 * s],
    [cx + 30 * s, cy],
    [cx, cy + 120 * s],
    [cx - 30 * s, cy],
    [cx, cy - 120 * s],
  ]);
  L.push([[cx - 16 * s, cy + 40 * s], [cx - 20 * s, cy - 10 * s], [cx, cy - 60 * s], [cx + 18 * s, cy - 10 * s], [cx + 14 * s, cy + 40 * s], [cx - 16 * s, cy + 40 * s]]);
  // iris fibres
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    L.push(line(cx + Math.cos(a) * 46 * s, cy + Math.sin(a) * 46 * s, cx + Math.cos(a) * 140 * s, cy + Math.sin(a) * 140 * s));
  }
  // lashes / the fur around
  for (let i = 0; i < 14; i++) L.push(line(cx - 300 * s + i * 46 * s, cy - 170 * s - (i % 2) * 10 * s, cx - 320 * s + i * 48 * s, cy - 230 * s));
  const out = strokes(L, 2.4, DV.ink, seed, 1.4);
  // sanguine shading under the lid
  for (const h of hatch(cx - 300 * s, cy + 90 * s, 600 * s, 70 * s, 12)) out.push({ pts: hand(h, 1.2, seed + 99), width: 1.6, color: DV.sanguine, alpha: 0.7 });
  return out;
}

const mod: SetModule = {
  cats: ({ canelo, scene }) => {
    if (scene === 'codice2') return [STAND.cerito];
    if (scene === 'retrato') return [{ slug: STAND.gatoconda, bake: 'plano' }, { slug: STAND.mano, bake: 'libros' }];
    if (scene.startsWith('codice') || scene === 'pagina') return [];
    return [{ slug: 'luzterna', bake: 'libros' }, { slug: STAND.mano, bake: 'libros' }, { slug: canelo, bake: 'libros' }, STAND.cerito];
  },
  async build(ctx: SceneCtx): Promise<FilmSet> {
    const id = ctx.scene.id;
    if (id === 'codice1') return codice1(ctx);
    if (id === 'codice2') return codice2(ctx);
    if (id === 'pagina') return pagina(ctx);
    if (id === 'regreso') return regreso(ctx);
    return indice(ctx);
  },
};
export default mod;

/** the collapsed index by candlelight (P1, P5, P9, P10–P11, P14) */
function indice(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const id = ctx.scene.id;
  const g = new Graphics();
  g.rect(-400, -400, 2720, 1880).fill(0x1a120c);
  for (let i = 0; i < 9; i++) {
    const x = -340 + i * 290;
    g.poly([x, -200, x + 240, -160, x + 230, 860, x - 10, 860]).fill(0x2a1e14).stroke({ width: 3, color: 0x120a06 });
    for (let r = 0; r < 6; r++) g.moveTo(x, -100 + r * 160).lineTo(x + 236, -80 + r * 160).stroke({ width: 3, color: 0x120a06 });
  }
  // fallen books
  for (let i = 0; i < 30; i++) g.poly([200 + rnd(i) * 1500, 900 + rnd(i + 3) * 80, 260 + rnd(i) * 1500, 880 + rnd(i + 3) * 80, 270 + rnd(i) * 1500, 920 + rnd(i + 3) * 80]).fill([0x5a2a1a, 0x2a3a4a, 0x4a4a2a][i % 3]);
  g.rect(-400, 860, 2720, 700).fill(0x22180e);
  if (id === 'retrato') {
    // the studio's back wall: a small oval portrait (the cameo)
    g.rect(-400, -400, 2720, 1880).fill(0x2a1e12);
    g.ellipse(960, 470, 230, 300).fill(0x6a4a24).ellipse(960, 470, 200, 270).fill(0x3a4a3a);
    // the sfumato landscape behind her: winding road, misty blue hills
    g.ellipse(860, 420, 160, 50).fill({ color: 0x8aa0a0, alpha: 0.6 }).ellipse(1080, 450, 140, 40).fill({ color: 0x7a9090, alpha: 0.6 });
  }
  ctx.plane(g, { z: 1300, bake: 'static' });
  const st = new Container();
  // the lectern with the open notebook, the candle
  const lect = new Graphics();
  lect.poly([700, 860, 760, 640, 1160, 640, 1220, 860]).fill(0x4a3220).stroke({ width: 4, color: 0x1a120c });
  lect.poly([760, 640, 960, 600, 1160, 640, 1160, 660, 960, 622, 760, 660]).fill(0xe8d5a9).stroke({ width: 3, color: DV.inkL });
  lect.rect(1240, 560, 26, 120).fill(0xf0e6d0).rect(1226, 680, 54, 16).fill(0x6a4a2a);
  const candle = glowSprite(ctx, 0xffc27a, 2.4);
  const cflame = new Graphics();
  if (id !== 'retrato') st.addChild(lect, candle, cflame);
  const mano = manoFigure(ctx, 340, { bake: 'libros' });
  const luz = luzOf(ctx, 320, 'libros');
  const lamp = glowSprite(ctx, LB.lantern, 1.1);
  const smoke = new Graphics();
  st.addChild(mano.root);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(lamp, smoke);
  let portrait: Sprite | null = null;
  if (id === 'retrato') {
    portrait = ctx.stillAs('plano', STAND.gatoconda, 0.5, 1);
    if (portrait) {
      portrait.scale.set(420 / portrait.texture.height);
      portrait.position.set(960, 740);
      const m = new Graphics().ellipse(960, 470, 200, 270).fill(0xffffff);
      portrait.mask = m;
      st.addChild(portrait, m);
    }
    const fr = new Graphics().ellipse(960, 470, 214, 284).stroke({ width: 22, color: 0x8a6a2a }).ellipse(960, 470, 230, 300).stroke({ width: 6, color: 0x4a3214 });
    st.addChild(fr);
  }
  ctx.plane(st, { z: 1000 });
  const lines: Record<string, Printed[]> = {
    culpa: [new Printed(ctx.k, 'luz', '…Yo los traje.', { size: 70, align: 0.5, plate: LB.paper })],
    exige: [new Printed(ctx.k, 'mano', 'Apaga la luz. Y ciérrale los ojos al gato.', { size: 52, align: 0.5, plate: LB.paper, w: 1300 }), new Printed(ctx.k, 'luz', '¿Y si no?', { size: 64, align: 0.5, plate: LB.paper })],
    nowey: [new Printed(ctx.k, 'luz', 'No, wey.', { size: 110, align: 0.5, plate: LB.paper })],
  };
  const ui = new Container();
  for (const l of lines[id] ?? []) ui.addChild(l);
  (lines.culpa[0] ?? null)?.position.set(1240, 200);
  lines.exige[0].position.set(960, 170);
  lines.exige[1].position.set(1260, 210);
  lines.nowey[0].position.set(1280, 230);
  const book = id === 'indice' ? new BookFrame(ctx, { head: 'Ex Libris', title: 'El índice', folio: 220 }) : null;
  if (book) ui.addChild(book);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, st, ui);
  return {
    update(lt) {
      // the candle
      candle.position.set(1253, 548);
      candle.alpha = 0.55 * (rm ? 1 : 0.85 + 0.15 * wob(lt * 5, 1)) * (ctx.rf ? 0.9 : 1);
      cflame.clear();
      flame(cflame, 1253, 560, 0.42, lt, { rm, color: 0xffb050 });
      // La Mano sits before the notebook; Luzterna keeps her distance
      let mx = 600;
      let lx = 1500;
      let ly = 600;
      if (id === 'indice') lx = 2100 - sm(seg(lt, 1.0, 5.0)) * 650;
      if (id === 'culpa' || id === 'nowey') {
        lx = 1100;
        ly = 760;
        mx = -400;
      }
      if (id === 'exige') {
        lx = lt < 6 ? 1450 : 1180;
        ly = lt < 6 ? 600 : 740;
        mx = lt < 6 ? 640 : -400;
      }
      if (id === 'retrato') mx = -500;
      mano.root.visible = mx > -300;
      mano.actor?.pose(lt, 0, 0, {});
      mano.root.position.set(mx, 880);
      if (mano.actor?.puppet) mano.actor.puppet.brain.look = id === 'exige' ? 0.8 : 0.4;
      const closeUp = id === 'culpa' || id === 'nowey' || (id === 'exige' && lt >= 6);
      luz.actor && (luz.actor.visible = id !== 'retrato');
      luz.actor?.pose(lt, lx + bob(lt, rm), ly + bob(lt + 1, rm, 8), { flip: true, sx: closeUp ? 1.7 : 1, sy: closeUp ? 1.7 : 1 });
      // «¿Y si no?»: she lifts her chin (a small tilt back)
      if (luz.actor && id === 'exige' && lt >= 6) luz.actor.rotation = -0.06 * sm(seg(lt, 6.2, 6.8));
      const L = lanternAt(luz);
      lamp.position.set(L[0], L[1]);
      // P5: the lantern suddenly looks guilty — it dims and wavers while she looks at it
      const guilt = id === 'culpa' ? sm(seg(lt, 0.4, 1.4)) : 0;
      lamp.alpha = (0.55 - guilt * 0.3 + (rm ? 0 : guilt * 0.08 * wob(lt * 9, 4))) * (id === 'retrato' ? 0 : 1);
      if (luz.actor?.puppet) luz.actor.puppet.brain.look = id === 'culpa' ? -0.7 : 0;
      // P14: the notebook smokes between them
      const sg = smoke.clear();
      if (id === 'nowey')
        for (let i = 0; i < 18; i++) {
          const ph = (lt * 0.25 + rnd(i)) % 1;
          sg.circle(620 + rnd(i * 3) * 120 + Math.sin(ph * 6 + i) * 30, 900 - ph * 600, 16 + ph * 40).fill({ color: 0x9a948a, alpha: 0.18 * (1 - ph) });
        }
      lines.culpa[0].update(seg(lt, 1.2, 2.6), id === 'culpa' ? env(lt, 1.1, 5.6, 0.2, 0.3) : 0);
      lines.exige[0].update(seg(lt, 0.5, 3.6), id === 'exige' ? env(lt, 0.4, 5.8, 0.2, 0.3) : 0);
      lines.exige[1].update(seg(lt, 6.6, 7.4), id === 'exige' ? env(lt, 6.5, 10, 0.2, 0.3) : 0);
      lines.nowey[0].update(seg(lt, 0.6, 1.6), id === 'nowey' ? env(lt, 0.5, 6, 0.1, 0.4) : 0);
      book?.set({ open: 1 - sm(seg(lt, 5.4, 6.4)) });
    },
    anchor: (n) => (n === 'cuaderno' ? [960, 630] : null),
  };
}

/** P2–P4: the lamp and the box; the rays rise through its walls; the ornithopters glide down the ray */
function codice1(ctx: SceneCtx): FilmSet {
  ctx.plane(vellum(ctx, 3), { z: 1000, bake: 'static' });
  // the box (in perspective) and the lamp inside it
  const box = new Sketch(
    strokes(
      [
        [[560, 640], [900, 640], [900, 940], [560, 940], [560, 640]],
        [[560, 640], [660, 560], [1000, 560], [900, 640]],
        [[1000, 560], [1000, 860], [900, 940]],
        // the lamp
        [[700, 900], [760, 900], [770, 780], [690, 780], [700, 900]],
        [[690, 780], [730, 740], [770, 780]],
      ],
      2.6,
    ),
  );
  // the rays: through the walls, up to the page's top edge
  const rays = new Sketch(
    strokes(
      Array.from({ length: 9 }, (_, i): [number, number][] => {
        const a = -Math.PI / 2 + (i - 4) * 0.13;
        return [
          [730, 800],
          [730 + Math.cos(a) * 900, 800 + Math.sin(a) * 900],
        ];
      }),
      1.6,
      DV.inkL,
      40,
      2.2,
    ),
  );
  const shade = new Sketch(hatch(560, 640, 340, 300, 16).map((pts, i) => ({ pts: hand(pts, 1.2, 70 + i), width: 1.3, color: DV.inkL, alpha: 0.5 })));
  // the ornithopters (three), drawn once, glide down the ray in a spiral
  const orn = [0, 1, 2].map((i) => {
    const sk = new Sketch(ornithopter(0, 0, 1.45, 100 + i * 7));
    return sk;
  });
  const draw = new Container();
  draw.addChild(shade, box, rays, ...orn);
  ctx.plane(draw, { z: 999 });
  const m1 = new Printed(ctx.k, 'mano', 'Tu luz salía de la caja. Arriba la vimos.', { size: 46, w: 640, fill: 0x2a1a10 });
  m1.position.set(1200, 220);
  const m2 = new Printed(ctx.k, 'mano', 'Bajamos por ella.', { size: 56, w: 640, fill: 0x2a1a10 });
  m2.position.set(1220, 760);
  const ui = new Container();
  ui.addChild(m1, m2);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, draw, ui);
  return {
    update(lt, f) {
      box.draw(seg(lt, 0.4, 3.2), f.step12);
      shade.draw(seg(lt, 2.6, 4.4), f.step12);
      rays.draw(seg(lt, 3.6, 7.0), f.step12);
      m1.update(seg(lt, 4.4, 7.6), env(lt, 4.3, 12.4, 0.3, 0.5));
      // P4 (12 → 20): they glide down the ray, spiralling, toward the box
      orn.forEach((o, i) => {
        const k = seg(lt, 11.8 + i * 0.9, 19.4 + i * 0.5);
        o.visible = k > 0;
        o.draw(seg(lt, 11.8 + i * 0.9, 13.0 + i * 0.9), f.step12);
        const y = 60 + k * 620;
        const x = 730 + Math.sin(k * Math.PI * 3 + i * 2) * (220 - k * 160);
        o.position.set(x, y);
        o.rotation = Math.cos(k * Math.PI * 3 + i * 2) * 0.25;
        o.scale.set((ctx.rm ? 1 : 0.9 + 0.1 * Math.sin(lt * 8 + i)) * (0.7 + (1 - k) * 0.4));
      });
      m2.update(seg(lt, 13.6, 15.2), env(lt, 13.5, 20.2, 0.3, 0.4));
    },
  };
}

/** P6–P8: Canelo's eye; the Vitruvian cat held by two lines (one is cut: he starts to fade); the mirror note */
function codice2(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(vellum(ctx, 5), { z: 1000, bake: 'static' });
  const eye = new Sketch(eyeStrokes(560, 420, 0.95, 11));
  const eyeFlame = new Graphics();
  // the Vitruvian cat (right page): circle + square, Cerito drawn in sepia inside
  const VX = 1380;
  const VY = 560;
  const vit = new Sketch(strokes([circlePts(VX, VY, 300, 64), rectPts(VX - 265, VY - 265, 530, 530), line(VX - 300, VY, VX + 300, VY), line(VX, VY - 300, VX, VY + 300)], 2.2, DV.ink, 33, 1.4));
  const cer = ctx.still(STAND.cerito, 0.5, 0.5);
  const cerC = new Container();
  if (cer) {
    cer.scale.set(420 / cer.texture.height);
    cerC.addChild(cer);
  }
  cerC.position.set(VX, VY + 20);
  // a drawn lantern (lower left of the right page) and the two lines that hold him
  const lantern = new Sketch(strokes([[[1040, 980], [1100, 980], [1110, 880], [1030, 880], [1040, 980]], [[1030, 880], [1070, 850], [1110, 880]]], 2.2, DV.ink, 51));
  const holds = new Graphics();
  const draw = new Container();
  draw.addChild(eye, eyeFlame, vit, cerC, lantern, holds);
  ctx.plane(draw, { z: 999 });
  const m = new Printed(ctx.k, 'mano', 'A una posibilidad la sostienen dos cosas: una luz que la guíe y unos ojos que la vean. Sin luz ni ojos, vuelve a vacante.', { size: 40, w: 760, fill: 0x2a1a10 });
  m.position.set(150, 760);
  const mirror = new Printed(ctx.k, 'mano', 'Sin luz ni ojos, vuelve a vacante.', { size: 44, w: 900, fill: DV.inkL, mirror: true });
  mirror.position.set(1040, 160);
  const ui = new Container();
  ui.addChild(m, mirror);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, draw, ui);
  return {
    update(lt, f) {
      eye.draw(seg(lt, 0.0, 4.5), f.step12);
      const fg = eyeFlame.clear();
      if (lt > 3.0) flame(fg, 560, 452, 0.75 * sm(seg(lt, 3.0, 4.0)), lt, { rm, color: DV.sanguine, core: 0xe8a070 });
      m.update(seg(lt, 2.0, 8.6), env(lt, 1.9, 11.2, 0.3, 0.5));
      // P7 (10 → 20): the Vitruvian cat; the two lines tremble; at 15 the lantern's line is cut and he starts to fade
      vit.draw(seg(lt, 9.6, 12.4), f.step12);
      lantern.draw(seg(lt, 11.0, 12.4), f.step12);
      cerC.alpha = sm(seg(lt, 11.6, 12.8));
      const cut = seg(lt, 15.0, 15.2) > 0 && lt < 17.6;
      const fade = cut ? sm(seg(lt, 15.2, 17.0)) * 0.7 : 0;
      cerC.alpha *= 1 - fade;
      if (cer) cer.skew.x = cut && !rm ? (rnd(f.step12) - 0.5) * fade * 0.3 : 0;
      const hg = holds.clear();
      const k = seg(lt, 12.2, 13.6);
      if (k > 0) {
        const tr = rm ? 0 : 3;
        let n = 0;
        const j = () => (rnd(f.step12 * 7 + n++) - 0.5) * tr;
        // from the drawn lantern
        if (!cut) hg.moveTo(1070, 880).lineTo(1070 + (VX - 30 - 1070) * k + j(), 880 + (VY + 40 - 880) * k + j()).stroke({ width: 3, color: DV.sanguine });
        else hg.moveTo(1070, 880).lineTo(1150, 820).stroke({ width: 3, color: DV.sanguine, alpha: 0.6 });
        // from Canelo's eye (across the gutter)
        hg.moveTo(560 + 140, 420).lineTo(700 + (VX - 60 - 700) * k + j(), 420 + (VY - 40 - 420) * k + j()).stroke({ width: 3, color: DV.sanguine });
      }
      // P8 (20 → 24): the mirror note in the margin (readable if you pause and flip it)
      mirror.update(seg(lt, 19.6, 22.4), env(lt, 19.5, 24, 0.3, 0.3));
    },
  };
}

/** P12–P13: the page turns to his eye again; HER light burns a hole right over it, the edges catching and curling */
function pagina(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  ctx.plane(vellum(ctx, 7), { z: 1000, bake: 'static' });
  const eye = new Sketch(eyeStrokes(960, 520, 1.15, 23));
  eye.draw(1, 0);
  ctx.plane(eye, { z: 999, bake: 'static' });
  const live = new Container();
  const eyeFlame = new Graphics();
  const hole = new Graphics();
  const glow = glowSprite(ctx, LB.lantern, 3);
  const turn = new Graphics();
  live.addChild(eyeFlame, glow, hole, turn);
  ctx.plane(live, { z: 998 });
  prewarm(ctx, live);
  return {
    update(lt) {
      const fg = eyeFlame.clear();
      flame(fg, 960, 560, 0.9, lt, { rm, color: DV.sanguine, core: 0xe8a070 });
      // the page turning (0 → 1.2): a shadowed leaf sweeping right to left, revealing the eye under it
      const tp = seg(lt, 0.0, 1.2);
      const tg = turn.clear();
      if (tp < 1) {
        const x = 1920 - tp * 1900;
        tg.poly([x, -100, 2100, -100, 2100, 1180, x - 60, 1180]).fill(DV.vellum);
        tg.rect(x - 40, -100, 40, 1280).fill({ color: DV.burnt, alpha: 0.35 });
      }
      // P13 (5.0 → 12): the light burns through: a ragged hole that grows, ember rim, char ring, blue beyond
      const b = seg(lt, 5.0, 11.6);
      const hg = hole.clear();
      if (b > 0) {
        const R = 40 + sm(b) * 260;
        const pts: number[] = [];
        const ember: number[] = [];
        const st = rm ? 0 : Math.floor(lt * 10);
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const r = R * (0.82 + rnd(i * 3.1) * 0.3) + (rnd(i + st) - 0.5) * 6;
          pts.push(960 + Math.cos(a) * r, 520 + Math.sin(a) * r);
          ember.push(960 + Math.cos(a) * (r + 18), 520 + Math.sin(a) * (r + 18));
        }
        hg.poly(ember).fill({ color: 0x2a1408, alpha: 0.85 });
        hg.poly(pts).fill(0x0a1a2a);
        hg.poly(pts).stroke({ width: 8, color: 0xff8a2a, alpha: 0.9 });
        hg.poly(pts).stroke({ width: 3, color: 0xffe0a0 });
      }
      glow.position.set(960, 520);
      glow.alpha = b > 0 ? 0.35 + sm(b) * 0.4 : 0;
      glow.scale.set(1.5 + sm(b) * 2.5);
    },
  };
}

/** G1–G4: the ship at night — «¿Qué quería?» / «Tus ojos. Le dije que no.»; he covers his eyes; «Yo vigilo.» */
function regreso(ctx: SceneCtx): FilmSet {
  const rm = ctx.rm;
  const g = new Graphics();
  g.rect(-400, -400, 2720, 1880).fill(0x1a2032);
  g.circle(1500, 190, 70).fill(0xe8eef8);
  for (let i = 0; i < 60; i++) g.circle(rnd(i) * 2400 - 240, rnd(i + 5) * 500 - 200, 1.5 + rnd(i + 2) * 2).fill({ color: 0xe8eef8, alpha: 0.6 });
  g.rect(-400, 560, 2720, 1000).fill(0x2a3448);
  g.poly([-300, 1200, 2220, 1200, 2220, 820, -300, 860]).fill(0x4a3220).stroke({ width: 4, color: 0x1a120c });
  for (let i = 0; i < 7; i++) g.moveTo(-300, 880 + i * 46).lineTo(2220, 840 + i * 52).stroke({ width: 2, color: 0x1a120c, alpha: 0.6 });
  g.roundRect(520, 900, 480, 110, 40).fill(0x8a3a3a).stroke({ width: 4, color: 0x3a1a1a });
  ctx.plane(g, { z: 1200, bake: 'static' });
  const st = new Container();
  const can = ctx.actorAs('libros', ctx.canelo, 300);
  const cer = new StaticKitten(ctx, 110, STAND.cerito);
  const luz = luzOf(ctx, 320, 'libros');
  const beam = new Beam(ctx);
  const fl = new Graphics();
  const paws = new Graphics();
  const lamp = glowSprite(ctx, LB.lantern, 1.3);
  if (can) st.addChild(can);
  st.addChild(cer, paws);
  if (luz.actor) st.addChild(luz.actor);
  st.addChild(beam, lamp, fl);
  ctx.plane(st, { z: 1000 });
  const q = new Printed(ctx.k, 'canelo', '¿Qué quería?', { size: 60, align: 0.5, plate: LB.paper });
  q.position.set(700, 260);
  const a = new Printed(ctx.k, 'luz', 'Tus ojos. Le dije que no.', { size: 60, align: 0.5, plate: LB.paper });
  a.position.set(1240, 200);
  const b = new Printed(ctx.k, 'luz', 'Ya, gordo. Duérmete. Yo vigilo.', { size: 58, align: 0.5, plate: LB.paper, w: 1300 });
  b.position.set(1100, 200);
  const ui = new Container();
  ui.addChild(q, a, b);
  ctx.plane(ui, { z: 0, screen: true });
  prewarm(ctx, st, ui);
  // his eyes (from the rig) for the paws that cover them
  const eyesAt = (): [number, number][] => {
    const p = can?.puppet;
    const rig = p?.brain.model?.rig;
    if (!can || !p || !rig?.eyes?.length) return [];
    return rig.eyes.map((e) => [can.x + ((e[0] + e[2]) / 2 - p.anchor.x * p.W) * p.scale.x, can.y + ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * p.scale.y] as [number, number]);
  };
  return {
    update(lt) {
      // G1: she floats back (0 → 4); he waits awake with Cerito on top
      const back = sm(seg(lt, 0, 4));
      const alone = sm(seg(lt, 18.6, 21));
      const lx = alone > 0 ? 1180 + alone * 420 : 2100 - back * 900;
      const ly = 620 - alone * 80;
      luz.actor?.pose(lt, lx + bob(lt, rm), ly + bob(lt + 1, rm, 8), { flip: alone < 0.5 });
      can?.pose(lt, 760, 960, {});
      cer.position.set(760, 760);
      cer.update(lt, { stare: 0.6, clear: 0.2 });
      const tip = tailTip(can);
      fl.clear();
      if (tip) flame(fl, tip[0], tip[1], FLAME.sesenta, lt, { rm, line: 0x6a2a0a });
      // G3: he covers his eyes with his paws (11 → 15); her beam lowers them, gently (14 → 16)
      const cover = env(lt, 10.8, 15.2, 0.4, 0.8);
      const pg = paws.clear();
      if (cover > 0.01)
        for (const [ex, ey] of eyesAt()) {
          const y = ey + (1 - cover) * 90;
          pg.ellipse(ex, y, 30, 24).fill(0xb06a3a).stroke({ width: 3, color: 0x4a2a14 });
          for (let i = 0; i < 3; i++) pg.ellipse(ex - 14 + i * 14, y - 18, 7, 8).fill(0xc8845a);
        }
      const L = lanternAt(luz);
      beam.set(L, [760, 820], 80, env(lt, 13.6, 17.0, 0.4, 0.6) * 0.85);
      lamp.position.set(L[0], L[1]);
      // G4: alone at the bow, the lantern held higher than usual
      lamp.alpha = 0.55 + alone * 0.3;
      lamp.scale.set(1.3 + alone * 1.2);
      if (luz.actor) luz.actor.y -= alone * 30;
      q.update(seg(lt, 4.4, 5.6), env(lt, 4.3, 8.0, 0.2, 0.3), lt);
      a.update(seg(lt, 7.0, 8.8), env(lt, 6.9, 11.0, 0.2, 0.3));
      b.update(seg(lt, 14.4, 16.6), env(lt, 14.3, 18.6, 0.2, 0.4));
    },
  };
}
void word;
