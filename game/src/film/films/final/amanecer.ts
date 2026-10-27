/**
 * F34 · PH «Antes del amanecer» (H94, A1–A12) with TEMPERATURA pass 5 (R2, R4, R6; R8 plugs between the films) and pass 7:
 *
 *   f34_amanecer   regreso (A1–A4c, pasada 7 · deuda falsa pagada: Cerito's spark dies, her beam and his nose together
 *                  bring the flame back SMALL; one pane of her lantern goes black for good; Cerito trembles without
 *                  static; Canelo wakes, «LLAMA 30 %»; «Me debes un vidrio, gordo.»; the scarf back on him with the beam.
 *                  DEUDA_FALSA off = the measured control: Cerito alone) ·
 *                  alivio (A5, in KLIMT GOLD LEAF, the peak of attachment just before the twist: he eats a whole fish,
 *                  the cats pile on him, she laughs and scolds him flying around; pass 6 S1: the ink ship weighs
 *                  anchor and goes, seen from BEHIND, backlit — no prow to see — while the cats boo from the shore)
 *   — the optional playable breakfast (R8) goes here, outside the film —
 *   f34_golpe      golpe (A6–A7: the light covers Canelo and Cerito, her back in shadow — Q3 kept; S1: La Mano RISES
 *                  FROM AN INK DROP on the shore, the rhyme of her tear in H95: «La luz cuida lo que alumbra…») · cenital2 (R6: the SAME overhead
 *                  framing as H93's K5 — the stroke goes round the light… and finds HER, outside it) · golpe2 (A9–A11:
 *                  «…y tú, si te vuelves a morir, te mato—», the stroke crosses her, «…Ah.»). No cut: SADIE.
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { bitacoraCard, COL, DEUDA_FALSA, homeSet, inkStroke, lantern, manoFigure, partial, RuleCone, scarfOnGround, spentPane, STAND_INS } from './props';
import { goldLeaf, KL } from '../../styles/klimt';
import { REGRESO } from './timing';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
const lanternOf = (luz: { puppet: { anchor: { x: number; y: number }; W: number; H: number; scale: { x: number; y: number } } | null } | null): [number, number] => {
  const p = luz?.puppet;
  return p ? [(104 - p.anchor.x * p.W) * p.scale.x, (318 - p.anchor.y * p.H) * p.scale.y] : [-70, -140];
};
const KLIMT_CATS = [STAND_INS.hipolito, STAND_INS.homiau, STAND_INS.grafitera, STAND_INS.maneki];

const mod: SetModule = {
  // per scene: only what each shot shows (each treatment is a bake at load)
  cats: ({ canelo, scene }) =>
    scene === 'alivio'
      ? [canelo, 'luzterna', ...KLIMT_CATS]
      : scene === 'regreso'
        ? [{ slug: canelo, bake: 'gris' }, { slug: canelo, bake: 'realismo' }, { slug: 'luzterna', bake: 'realismo' }, { slug: STAND_INS.cerito, bake: 'realismo' }]
        : scene === 'cenital2'
          ? []
          : [{ slug: STAND_INS.mano, bake: 'realismo' }, { slug: canelo, bake: 'realismo' }, { slug: 'luzterna', bake: 'realismo' }, { slug: STAND_INS.cerito, bake: 'realismo' }],
  build(ctx: SceneCtx): FilmSet {
    const id = ctx.scene.id;
    if (id === 'alivio') return alivio(ctx);
    if (id === 'cenital2') return cenital2(ctx);
    if (id === 'golpe2') return golpe2(ctx);
    if (id === 'golpe') return golpe(ctx);
    return regreso(ctx);
  },
};
export default mod;

/**
 * A1–A4c (pasada 7 · deuda falsa pagada; with DEUDA_FALSA off, the measured control: Cerito alone, no cost to her).
 *   0–2   A1   Cerito walks to the tail and touches it with his nose
 *   2–4   A1b  a spark that trembles and dies; a second one, weaker
 *   3–6   A2   she floats down (never touching the sand) and puts her beam on the tail, by his nose: together, it
 *              catches — the flame comes back small, on the theme's entry (4.5 s)
 *   4.9   A2b  one pane of the lantern goes black, a dry «tic», a thread of soot (the camera is on the lantern)
 *   6–9   A3   Cerito trembles without static; she covers him with the beam (through the pane left)
 *   9–11  A4   Canelo opens his eyes, wakes; «CANELO · LLAMA 30 %»
 *   11–15 A4b  she taps the black pane, blows on it, shrugs, points the lantern at Canelo and laughs: «Me debes un
 *              vidrio, gordo.» (Canelo meows, offended) — under the 30 %, in her hand: «Me debe un vidrio.»
 *   16–19 A4c  the scarf back on him with the beam (R2)
 * Without the debt the shot plays the old way on the same clock (one spark that catches; no pane, no joke).
 */
function regreso(ctx: SceneCtx): FilmSet {
  const isl = homeSet(ctx, 'dawn', { x: 1260 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const CAN: [number, number] = [780, gy(780) + 10];
  const LUZ: [number, number] = [1010, gy(1010) - 90];
  const debt = DEUDA_FALSA;
  const R = REGRESO;
  const scarf = scarfOnGround(140);
  const grey = ctx.actorAs('gris', ctx.canelo, 200);
  const can = ctx.actorAs('realismo', ctx.canelo, 200);
  const cer = ctx.actorAs('realismo', STAND_INS.cerito, 120);
  const luz = ctx.actorAs('realismo', 'luzterna', 260);
  const flame = new Graphics();
  const beam = new Graphics();
  const lamp = lantern(false, 1);
  // the pane that pays (pasada 7): over the right glass, black from A2b on
  const pane = spentPane(1);
  pane.alpha = 0;
  lamp.addChild(pane);
  const soot = new Graphics();
  st.addChild(scarf);
  for (const a of [grey, can, cer, luz]) if (a) st.addChild(a);
  st.addChild(flame, beam, lamp, soot);
  ctx.plane(st, { z: 1000 });
  const card = bitacoraCard(debt ? ['CANELO · LLAMA 30 %', 'Me debe un vidrio.'] : ['CANELO · LLAMA 30 %'], { hand: 'luz', w: 430, size: 32 });
  card.root.position.set(90, 150);
  const ui = new Container();
  ui.addChild(card.root);
  ctx.plane(ui, { z: 0, screen: true });
  const la = lanternOf(luz);
  /** a short jiggle that decays (the taps on the glass) */
  const jig = (lt: number, t0: number) => (lt > t0 && lt < t0 + 0.45 ? Math.sin((lt - t0) * 40) * 0.16 * (1 - (lt - t0) / 0.45) : 0);
  return {
    update(lt, f) {
      const wake = sm((lt - R.wakeAt) / 1.6);
      if (grey) {
        grey.visible = wake < 0.5;
        grey.pose(lt, CAN[0], CAN[1], { flip: true, rot: 1.45 * (1 - wake) });
        if (grey.puppet) grey.puppet.sleeping = true;
      }
      if (can) {
        can.visible = wake >= 0.5;
        can.pose(lt, CAN[0], CAN[1] - 10, { flip: true, rot: 1.45 * (1 - wake) });
      }
      // A1: Cerito walks to the tail and touches it with his nose; A3: he trembles, without static
      const walk = sm(lt / 2);
      const shiver = lt > 6 && lt < 9 && !f.rm ? Math.sin(lt * 40) * 2.5 : 0;
      const cx = 560 + walk * 310 + shiver;
      if (cer) {
        cer.pose(lt, cx, gy(cx), {});
        if (cer.puppet) cer.puppet.walk = lt < 2 ? 1 : 0;
      }
      // A2: she floats down (never onto the sand) to put the light on the tail, then back up
      const down = debt ? sm((lt - 3) / 1.2) * (1 - sm((lt - 6) / 1.5)) : 0;
      // A4b: the shrug (a hop) and the laugh
      const shrug = debt && lt > 13.3 && lt < 13.9 ? Math.sin(((lt - 13.3) / 0.6) * Math.PI) * 14 : 0;
      const laugh = debt && lt > 14.2 && lt < 15.6 && !f.rm ? Math.abs(Math.sin(lt * 11)) * 5 : 0;
      const lx = LUZ[0] - down * 40;
      const ly = LUZ[1] + down * 50 + Math.sin(lt * 1.1) * 6 * (1 - down) - shrug - laugh;
      if (luz) luz.pose(lt, lx, ly, { flip: false, rot: -down * 0.1 });
      const lan: [number, number] = [lx + la[0], ly + la[1]];
      lamp.position.set(lan[0], lan[1] + 26);
      // A4b: two taps on the glass, then the lantern points at Canelo
      const point = debt ? sm((lt - 13.8) / 0.4) * (1 - sm((lt - 15.2) / 0.5)) : 0;
      lamp.rotation = f.rm ? -0.5 * point : jig(lt, 11.6) + jig(lt, 12.1) - 0.5 * point;
      // A1b–A2: sparks, then the flame — small, smaller than ever (with the debt: two sparks die, the beam makes it)
      flame.clear();
      const tip: [number, number] = wake < 0.5 ? [CAN[0] + 105, CAN[1] - 30] : [CAN[0] - 70, CAN[1] - 60];
      const spark = (t0: number, t1: number, r: number) => {
        if (lt < t0 || lt > t1) return;
        const k = (lt - t0) / (t1 - t0);
        const fl = f.rf ? 1 : 0.7 + 0.3 * Math.sin(lt * 60);
        flame.circle(tip[0], tip[1], r * (1 - k * 0.6) * fl).fill({ color: 0xfff2b0, alpha: 1 - k });
      };
      if (debt) {
        spark(2, 2.8, 5);
        spark(3, 3.9, 3.5);
      } else spark(2, R.catchAt, 5);
      if (lt > R.catchAt) {
        const g = sm((lt - R.catchAt) / 1.2) * 0.6;
        flame.ellipse(tip[0], tip[1] - 12 * g, 8 * g + 2, 20 * g + 2).fill({ color: COL.orange, alpha: 0.95 });
      }
      beam.clear();
      // A2: the light on the tail, by Cerito's nose (together)
      if (debt && lt > 3.4 && lt < 6.2) {
        const a = sm((lt - 3.4) / 0.6) * (1 - sm((lt - 5.6) / 0.6));
        beam.poly([lan[0] - 8, lan[1] + 20, lan[0] + 8, lan[1] + 20, tip[0] + 26, tip[1] + 6, tip[0] - 26, tip[1] + 6]).fill({ color: COL.lanternBlue, alpha: 0.32 * a });
        beam.circle(tip[0], tip[1], 26).fill({ color: COL.lanternBlue, alpha: 0.22 * a });
      }
      // A3: she covers Cerito with the beam; A4b: the lantern points at Canelo; A4c: the scarf onto him (R2)
      const lift = sm((lt - R.scarfAt - 0.5) / 2.2);
      if (lt > 6 && lt < 9) beam.poly([lan[0], lan[1] - 8, lan[0], lan[1] + 8, cx + 70, gy(cx) - 10, cx - 70, gy(cx) - 10]).fill({ color: COL.lanternBlue, alpha: 0.18 });
      if (point > 0.05) beam.poly([lan[0], lan[1] + 10, lan[0], lan[1] + 24, CAN[0] + 40, CAN[1] - 150, CAN[0] + 40, CAN[1] - 60]).fill({ color: COL.lanternBlue, alpha: 0.16 * point });
      if (lt > R.scarfAt && lift < 1) beam.poly([lan[0], lan[1] - 8, lan[0], lan[1] + 8, scarf.x + 40, scarf.y + 20, scarf.x - 40, scarf.y - 20]).fill({ color: COL.lanternBlue, alpha: 0.2 });
      scarf.position.set(CAN[0] - 120 + lift * 120, CAN[1] - 6 - lift * 120);
      scarf.rotation = lift * -0.4;
      scarf.alpha = 1 - sm((lift - 0.8) / 0.2);
      // A2b: the pane goes black at once (a burnt bulb); a thread of soot; A4b: a puff when she blows on it
      pane.alpha = debt ? sm((lt - R.paneAt) / 0.18) : 0;
      soot.clear();
      const wisp = (t0: number, dur: number, n: number, col: number, a0: number) => {
        if (lt < t0 || lt > t0 + dur) return;
        const k = (lt - t0) / dur;
        for (let i = 0; i < n; i++) {
          const ox = lamp.x + 10 + Math.sin(i * 2.1 + lt * (f.rm ? 0.5 : 3)) * 6 * (1 + k * 2);
          const oy = lamp.y - 50 - k * 70 - i * 9;
          soot.circle(ox, oy, 3 + k * 6 + i).fill({ color: col, alpha: a0 * (1 - k) * (1 - i / n) });
        }
      };
      if (debt) {
        wisp(R.paneAt, 1.8, 5, 0x2a2826, 0.7);
        wisp(12.6, 0.8, 4, 0xe8eef6, 0.45);
      }
      card.root.alpha = sm((lt - R.wakeAt - 1) / 1) * (1 - sm((lt - 18.6) / 0.5));
      if (card.texts[1]) card.texts[1].alpha = sm((lt - 14.6) / 0.8);
    },
  };
}

/**
 * A5 in gold leaf — the last happy moment, warm and real. A calm warm ground; big figures in a clear composition (Canelo
 * eating his fish, Luzterna laughing over him, the cats celebrating round them); the GOLD is ornament — a frieze that
 * grows in from the edges and a mosaic halo that opens behind the two as the relief grows. Far away on the gold sea, the
 * ink ship goes, seen from behind against the light (pass 6, S1), while the cats boo.
 */
function alivio(ctx: SceneCtx): FilmSet {
  const b = ctx.baker;
  const bg = new Container();
  bg.addChild(
    new Sprite(
      b.shade(
        'kl-warm',
        2400,
        1400,
        `vec2 bakeUV() { return vTextureCoord / max(uInputClamp.zw, vec2(1e-4)); }
void main() {
  vec2 uv = bakeUV();
  vec3 top = vec3(0.32, 0.2, 0.08), mid = vec3(0.62, 0.42, 0.18), low = vec3(0.4, 0.26, 0.1);
  vec3 col = uv.y < 0.55 ? mix(top, mid, uv.y / 0.55) : mix(mid, low, (uv.y - 0.55) / 0.45);
  col *= 0.92 + 0.08 * fbm(uv * vec2(5.0, 3.0));
  float v = smoothstep(0.9, 0.3, length((uv - vec2(0.5, 0.55)) * vec2(1.0, 1.3)));
  finalColor = vec4(col * (0.75 + 0.35 * v), 1.0);
}`,
        {},
        {},
        { res: 0.5 },
      ),
    ),
  );
  bg.children[0].position.set(-240, -160);
  const seaBand = new Sprite(goldLeaf(b, 2400, 90, 3, 5, 0.1, 0.6));
  seaBand.position.set(-240, 520);
  seaBand.alpha = 0.7;
  bg.addChild(seaBand);
  ctx.plane(bg, { z: 1500, bake: 'static' });
  const far = new Container();
  // seen from behind, against the light: the stern, three masts, a gold rim — no prow to see
  const ship = new Graphics();
  ship.poly([-120, 0, 120, 0, 100, 90, -100, 90]).fill(KL.black).poly([-120, 0, 120, 0, 116, 8, -116, 8]).fill({ color: KL.goldL, alpha: 0.8 });
  for (const x of [-60, 0, 60]) ship.rect(x - 4, -260, 8, 260).fill(KL.black).rect(x - 2, -260, 2, 260).fill({ color: KL.goldL, alpha: 0.6 });
  ship.rect(-110, -200, 220, 6).fill(KL.black);
  ship.scale.set(0.45);
  const gulls = new Graphics();
  far.addChild(ship, gulls);
  ctx.plane(far, { z: 1400 });
  // the halo of mosaic behind the two (concentric gold rings with tesserae), it opens as the relief grows
  const halo = new Container();
  const hg = new Graphics();
  for (let i = 9; i >= 1; i--) hg.circle(0, 0, i * 46).fill(i % 2 ? KL.gold : KL.goldD);
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const r = 120 + (i % 5) * 70;
    hg.rect(Math.cos(a) * r - 7, Math.sin(a) * r - 7, 14, 14).fill(i % 7 === 0 ? KL.red : i % 11 === 0 ? KL.blue : KL.goldL);
  }
  halo.addChild(hg);
  halo.position.set(900, 560);
  ctx.plane(halo, { z: 1150 });
  const st = new Container();
  const can = ctx.actor(ctx.canelo, 380);
  const luz = ctx.actor('luzterna', 330);
  const pile = KLIMT_CATS.map((s) => ctx.actor(s, 210));
  // pasada 7: her lantern over the painting, with its black pane (it swings; nobody mentions it)
  const lamp = lantern(false, 330 / 260, true);
  const la = lanternOf(luz);
  const fish = new Graphics();
  const mug = new Graphics().roundRect(-20, -50, 40, 50, 5).fill(KL.goldL).rect(-20, -58, 40, 12).fill(0xfff6e0);
  for (const a of pile) if (a) st.addChild(a);
  if (can) st.addChild(can);
  st.addChild(fish, mug);
  if (luz) st.addChild(luz);
  st.addChild(lamp);
  const boos = [0, 1, 2].map((i) => {
    const t = new Text({ text: '¡buuu!', style: { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 30, fill: KL.black } });
    t.anchor.set(0.5);
    t.position.set(1240 + i * 120, 470 - i * 24);
    st.addChild(t);
    return t;
  });
  const slot = new Graphics();
  st.addChild(slot);
  ctx.plane(st, { z: 1000 });
  // the frieze: gold leaf that grows in from the edges (masked strips, rect masks redrawn each frame)
  const frieze = new Container();
  const strips = [
    { sp: new Sprite(goldLeaf(b, 2200, 160, 2, 11, 0.2, 0.6)), x: -140, y: -40, w: 2200, h: 160, side: 'top' },
    { sp: new Sprite(goldLeaf(b, 2200, 150, 0, 12, 0.3, 0.6)), x: -140, y: 980, w: 2200, h: 150, side: 'bottom' },
    { sp: new Sprite(goldLeaf(b, 150, 1200, 1, 13, 0.2, 0.6)), x: -150, y: -60, w: 150, h: 1200, side: 'left' },
    { sp: new Sprite(goldLeaf(b, 150, 1200, 1, 14, 0.2, 0.6)), x: 1920, y: -60, w: 150, h: 1200, side: 'right' },
  ].map((x) => {
    x.sp.position.set(x.x, x.y);
    const m = new Graphics();
    x.sp.mask = m;
    frieze.addChild(x.sp, m);
    return { ...x, m };
  });
  const sparks = Array.from({ length: 12 }, (_, i) => {
    const s = new Sprite(ctx.tex('kl:spark'));
    s.anchor.set(0.5);
    s.blendMode = 'add';
    s.tint = KL.goldL;
    s.position.set(i % 2 ? 60 + ((i * 271) % 1800) : 40 + ((i * 97) % 140), i % 2 ? 40 + ((i * 53) % 90) : 200 + ((i * 167) % 700));
    frieze.addChild(s);
    return s;
  });
  ctx.plane(frieze, { z: 0, screen: true });
  return {
    update(lt, f) {
      const grow = sm(lt / 18);
      // the frieze grows in from the edges; the halo opens
      for (const x of strips) {
        x.m.clear();
        const k = 0.25 + 0.75 * grow;
        if (x.side === 'top') x.m.rect(x.x, x.y, x.w, x.h * k).fill(0xffffff);
        if (x.side === 'bottom') x.m.rect(x.x, x.y + x.h * (1 - k), x.w, x.h * k).fill(0xffffff);
        if (x.side === 'left') x.m.rect(x.x + x.w * (1 - k), x.y, x.w * k, x.h).fill(0xffffff);
        if (x.side === 'right') x.m.rect(x.x, x.y, x.w * k, x.h).fill(0xffffff);
      }
      halo.scale.set(0.35 + 0.65 * grow);
      halo.alpha = 0.3 + 0.3 * grow;
      halo.rotation = f.rm ? 0 : lt * 0.03;
      // far away: the ship goes; gulls; the cats boo
      const go = sm((lt - 1) / 9);
      ship.position.set(1500 + go * 260, 540 - go * 20);
      ship.scale.set(0.45 * (1 - go * 0.6));
      ship.alpha = 1 - sm((go - 0.8) / 0.2);
      gulls.clear();
      for (let i = 0; i < 3; i++) {
        const x = 1450 + go * 300 + i * 50 + Math.sin(lt * 2 + i) * 14;
        const y = 380 - i * 20 + Math.sin(lt * 3 + i) * 8;
        gulls.moveTo(x - 14, y).quadraticCurveTo(x - 6, y - 10, x, y).quadraticCurveTo(x + 6, y - 10, x + 14, y).stroke({ width: 3, color: KL.black });
      }
      for (const [i, t] of boos.entries()) t.alpha = sm((lt - 1.5 - i * 0.5) / 0.4) * (1 - sm((lt - 7) / 1));
      // Canelo, big, eats his whole fish; she laughs over him; the cats celebrate round them
      const chew = f.rm ? 0 : Math.sin(lt * 7) * 0.015;
      if (can) can.pose(lt, 820, 960, { flip: true, sx: 1 + chew });
      fish.clear();
      const eaten = sm((lt - 2) / 7);
      if (eaten < 1) fish.ellipse(990 - eaten * 50, 860, 95 * (1 - eaten), 34 * (1 - eaten * 0.5)).fill(0xdfe6ee).poly([1080 - eaten * 100, 860, 1130 - eaten * 100, 820, 1130 - eaten * 100, 900]).fill(0xdfe6ee);
      const laugh = f.rm ? 0 : Math.sin(lt * 5) * 6;
      const lzx = 1130 + Math.sin(lt * 0.7) * (f.rm ? 10 : 50);
      const lzr = Math.sin(lt * 0.9) * 0.05;
      if (luz) luz.pose(lt, lzx, 640 + laugh, { flip: false, rot: lzr });
      // the lantern rides with her (rotated with her pose) and swings a little
      const c0 = Math.cos(lzr);
      const s0 = Math.sin(lzr);
      lamp.position.set(lzx + la[0] * c0 - la[1] * s0, 640 + laugh + la[0] * s0 + la[1] * c0 + 33);
      lamp.rotation = lzr + (f.rm ? 0 : Math.sin(lt * 2.3) * 0.08);
      lamp.visible = !!luz;
      pile.forEach((a, i) => {
        if (!a) return;
        const t0 = 4 + i * 1.4;
        const s = sm((lt - t0) / 1.2);
        const home: [number, number] = [[420, 980], [560, 1010], [1290, 1000], [1460, 980]][i] as [number, number];
        const x = home[0] + (1 - s) * (i < 2 ? -500 : 500);
        const hop = f.rm ? 0 : Math.abs(Math.sin(lt * 4 + i * 1.3)) * 18 * s;
        a.visible = lt > t0 - 0.6;
        a.pose(lt, x, home[1] - hop, { flip: i < 2 });
      });
      mug.position.set(650, 980);
      mug.visible = lt > 12;
      slot.clear();
      const on = sm((lt - 3) / 0.8);
      slot.roundRect(200, 180, 110, 110, 12).fill({ color: KL.gold, alpha: 0.2 + 0.6 * on }).roundRect(200, 180, 110, 110, 12).stroke({ width: 4, color: KL.goldL, alpha: on });
      for (const [i, s] of sparks.entries()) {
        const tw = Math.max(0, Math.sin(lt * (1.1 + (i % 4) * 0.35) + i * 1.7));
        s.alpha = tw * 0.7 * grow * (f.rf ? 0.4 : 1);
        s.scale.set(0.3 + tw * 0.35);
      }
    },
  };
}

/** A6–A7 — the light covers the two; her back in shadow (Q3 kept); La Mano on the shore */
function golpe(ctx: SceneCtx): FilmSet {
  const isl = homeSet(ctx, 'dawn', { x: 300 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const CAN: [number, number] = [880, gy(880)];
  const CER: [number, number] = [1080, gy(1080)];
  const LUZ: [number, number] = [1330, gy(1330) - 100];
  const can = ctx.actorAs('realismo', ctx.canelo, 200);
  const cer = ctx.actorAs('realismo', STAND_INS.cerito, 120);
  const luz = ctx.actorAs('realismo', 'luzterna', 270);
  const mano = manoFigure(ctx, 'realismo', 300);
  const cone = new RuleCone(ctx.stillAs('realismo', 'luzterna'));
  const lamp = lantern(false, 1, true);
  const drop = new Graphics();
  for (const a of [can, cer, luz]) if (a) st.addChild(a);
  st.addChild(drop, mano.root, lamp, cone.root);
  ctx.plane(st, { z: 1000 });
  const la = lanternOf(luz);
  return {
    update(lt) {
      if (can) can.pose(lt, CAN[0], CAN[1], { flip: true });
      if (cer) cer.pose(lt, CER[0], CER[1], {});
      const raise = sm(lt / 1.2);
      const ly = LUZ[1] - raise * 30;
      if (luz) luz.pose(lt, LUZ[0], ly, { flip: false });
      const lan: [number, number] = [LUZ[0] + la[0], ly + la[1] - raise * 40];
      lamp.position.set(lan[0], lan[1] + 26);
      if (luz) cone.follow(luz.x, luz.y, luz.scale.x * (luz.puppet?.scale.x ?? 1), luz.scale.y * (luz.puppet?.scale.y ?? 1));
      cone.draw(lan, CAN[0] - 200, CER[0] + 130, gy(CER[0]) + 10, raise, lan[0] + 10);
      // S1: an ink drop on the shore; La Mano rises out of it (the rhyme of her tear in H95)
      drop.clear();
      const dropA = sm((lt - 6.2) / 0.6);
      const appear = sm((lt - 7) / 1.4);
      if (dropA > 0) drop.ellipse(300, gy(300) + 4, 10 + 50 * appear, 4 + 10 * appear).fill({ color: COL.ink, alpha: dropA * (1 - appear * 0.4) });
      mano.root.position.set(300, gy(300));
      mano.root.scale.set(1, Math.max(0.001, appear));
      mano.root.alpha = appear;
      mano.hand.rotation = -0.4 * sm((lt - 8) / 1);
    },
  };
}

/** R6 — the rhyme with H93 K5: same overhead framing; the stroke goes round the light and finds HER outside it */
function cenital2(ctx: SceneCtx): FilmSet {
  const n = new Container();
  n.addChild(new Graphics().rect(-600, -400, 3120, 1880).fill(0x2a2a24));
  for (let i = 0; i < 40; i++) n.addChild(new Graphics().circle((i * 211) % 1920, (i * 137) % 1080, 30 + (i % 4) * 18).fill({ color: 0x3a3a30, alpha: 0.6 }));
  const light = new Graphics().circle(960, 540, 330).fill({ color: COL.lanternBlue, alpha: 0.14 }).circle(960, 540, 330).stroke({ width: 6, color: COL.lanternBlue, alpha: 0.7 });
  const two = new Graphics().ellipse(900, 560, 60, 40).fill(COL.canelo).ellipse(1010, 520, 36, 26).fill(0xdedede);
  // her, seen from above, just outside her own light: a dark shape, the lantern at the edge
  const her = new Graphics().ellipse(1335, 610, 70, 48).fill(0x0c0c14).circle(1290, 580, 12).fill(0xbfe4ff);
  // pasada 7: the black pane, seen from above too (half the little lantern dark)
  if (DEUDA_FALSA) her.arc(1290, 580, 12, -Math.PI / 2, Math.PI / 2).fill(0x07080c);
  const line = new Graphics();
  n.addChild(light, two, her, line);
  ctx.plane(n, { z: 1000 });
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI * 1.1 - (i / 40) * Math.PI * 1.75;
    const r = 380 + i * 1.2;
    pts.push([960 + Math.cos(a) * r, 540 + Math.sin(a) * r]);
  }
  pts.push([1335, 612]);
  return {
    update(lt) {
      line.clear();
      inkStroke(line, partial(pts, sm(lt / 2.6)), 18, COL.ink, 1, 7);
    },
  };
}

/** A9–A11 — the joke cut off, the stroke across her, «…Ah.» (the frame SADIE opens on) */
function golpe2(ctx: SceneCtx): FilmSet {
  const isl = homeSet(ctx, 'dawn', { x: 300 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const LUZ: [number, number] = [1420, gy(1400) - 70];
  const can = ctx.actorAs('realismo', ctx.canelo, 200);
  const cer = ctx.actorAs('realismo', STAND_INS.cerito, 150);
  const luz = ctx.actorAs('realismo', 'luzterna', 280);
  const ink = new Graphics();
  const lamp = lantern(false, 1, true);
  for (const a of [cer, luz, can]) if (a) st.addChild(a);
  st.addChild(ink, lamp);
  ctx.plane(st, { z: 1000 });
  const la = lanternOf(luz);
  return {
    update(lt) {
      if (can) can.pose(lt, 600, gy(600), { flip: true });
      if (cer) cer.pose(lt, 1580, gy(1580), { flip: true });
      if (luz) luz.pose(lt, LUZ[0], LUZ[1], { flip: false, rot: lt < 3 ? Math.sin(lt * 5) * 0.03 : 0 });
      lamp.position.set(LUZ[0] + la[0], LUZ[1] + la[1] + 30);
      // A10: the stroke crosses her from side to side, fast, and stays in the air
      ink.clear();
      const p = sm((lt - 3) / 0.5);
      const x0 = LUZ[0] - 150;
      const y0 = LUZ[1] - 250;
      const x1 = LUZ[0] + 130;
      const y1 = LUZ[1] - 10;
      if (p > 0) inkStroke(ink, partial([[x0 - 400, y0 - 300], [x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 8], [x1, y1]], p), 30, COL.ink, 1, 5);
    },
  };
}
