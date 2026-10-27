/**
 * F37 · PH «La Mano» (H95, M1–M10) in POSADA LINOCUT — grief in the language of the calaveras broadsides: black ink on
 * cream paper, and one second ink, orange, for the only warm things left (his small flame, the scarf she was knitting).
 * The silent reckoning: Canelo puts on her scarf over his own and stands before La Mano with every cat's eyes lit behind
 * him. She lowers her head; Cerito sniffs her; her nib trembles — (pass 6, S4) its ink comes out GREY and the stroke
 * leaves no mark: «el que ve ya no puede tachar», readable without a word. Her Catdex card erases line by line,
 * «Antes: una mano» first, her name last (the effect of Itō's, H81). «Lo vi. Lo vi en la oscuridad.» Borrón and Itō come;
 * (pass 5, R9a) «Así le pasó a Itō. El que ve ya no puede tachar.» She turns the broken lantern in her hands, cannot
 * light it, leaves it on the lighthouse step. A tear of ink in the sand.
 *
 * F38 · PH «La vigilia» (H95, V1–V6): one long take round the dark lighthouse while night becomes dawn; scope opens to
 * full frame with the first light. The broken lantern and the photo on the step; the cats come, each with a gesture
 * (free touches, or on their own); Canelo with both scarves lies down by the lantern. The player decides when (gate).
 */
import { Container, Graphics, Sprite, Text, TilingSprite, type Texture } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../stage';
import { COL, homeSet, knitScarf, lantern, manoHand, scarfOnGround, STAND_INS } from './props';
import { gouges, PO } from '../../styles/posada';

const sm = (x: number) => {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
};
const EYES = 14;

const mod: SetModule = {
  cats: ({ canelo }) => [canelo, STAND_INS.cerito, STAND_INS.ceritoGato, STAND_INS.mano, STAND_INS.borron, STAND_INS.ito, STAND_INS.hipolito, STAND_INS.maneki, STAND_INS.grafitera, 'ecomudo_static_cat'],
  build(ctx: SceneCtx): FilmSet {
    return ctx.scene.id === 'vigilia' ? vigilia(ctx) : mano(ctx, ctx.scene.id === 'mano2');
  },
};
export default mod;

/** the linocut night beach: paper, black sky with carved stars, the dark lighthouse, the step */
function linoBeach(ctx: SceneCtx): { step: [number, number]; ground: number } {
  const paper = new TilingSprite({ texture: ctx.tex('po:paper') as Texture, width: 3400, height: 1900 });
  paper.position.set(-740, -420);
  const g = new Graphics();
  g.rect(-740, -420, 3400, 1100).fill(PO.ink);
  for (let i = 0; i < 90; i++) {
    const x = -700 + ((i * 397) % 3300);
    const y = -380 + ((i * 211) % 900);
    g.moveTo(x - 5, y).lineTo(x + 5, y).stroke({ width: 2.5, color: PO.paper }).moveTo(x, y - 5).lineTo(x, y + 5).stroke({ width: 2.5, color: PO.paper });
  }
  // the lighthouse, off: black with the knife's lines
  const lx = 1500;
  g.poly([lx - 80, 820, lx + 80, 820, lx + 54, 330, lx - 54, 330]).fill(0x14100e);
  g.rect(lx - 70, 290, 140, 40).fill(0x14100e);
  gouges(g, lx - 60, 360, 120, 440, { angle: -0.15, gap: 22, len: 40, seed: 3 });
  // the beach: a black mass carved with long strokes
  g.rect(-740, 820, 3400, 700).fill(PO.ink);
  gouges(g, -740, 840, 3400, 500, { angle: 0.04, gap: 26, len: 140, seed: 9, width: 2.5 });
  g.rect(lx - 90, 812, 180, 16).fill(PO.paperD);
  const n = new Container();
  n.addChild(paper, g);
  ctx.plane(n, { z: 1100, bake: 'static' });
  return { step: [lx + 40, 812], ground: 830 };
}

function mano(ctx: SceneCtx, second: boolean): FilmSet {
  const { step, ground } = linoBeach(ctx);
  const st = new Container();
  // the cats' eyes behind him, lit in the dark
  const eyes = new Graphics();
  st.addChild(eyes);
  const CAN: [number, number] = [760, ground];
  const MANO: [number, number] = [1180, ground];
  const can = ctx.actor(ctx.canelo, 230);
  const cer = ctx.actor(STAND_INS.ceritoGato, 130);
  const mn = ctx.actor(STAND_INS.mano, 300);
  const hand = manoHand(1.1);
  const borron = ctx.actor(STAND_INS.borron, 220);
  const ito = ctx.actor(STAND_INS.ito, 240);
  const knit = knitScarf(140);
  const own = scarfOnGround(120);
  const flame = new Graphics();
  const broken = lantern(true, 1.1, true);
  const tear = new Graphics();
  const grey = new Graphics();
  for (const a of [borron, ito, mn, cer, can]) if (a) st.addChild(a);
  st.addChild(own, knit, grey, hand, flame, broken, tear);
  ctx.plane(st, { z: 1000 });
  // the Catdex card that erases (screen)
  const card = new Container();
  const frame = new Graphics().rect(0, 0, 560, 330).fill(PO.paper).rect(0, 0, 560, 330).stroke({ width: 6, color: PO.ink }).rect(12, 12, 536, 306).stroke({ width: 2, color: PO.ink });
  card.addChild(frame);
  const lines = ['TITIRITERA ENCARNADA', 'Antes: una mano', 'Caja: los libros', 'Postura: una luz contra mil mundos', 'LA MANO'];
  const texts = lines.map((l, i) => {
    const t = new Text({ text: l, style: { fontFamily: i === 0 || i === 4 ? 'Bebas Neue' : 'Playfair Display', fontStyle: i === 0 || i === 4 ? 'normal' : 'italic', fontSize: i === 4 ? 54 : i === 0 ? 34 : 28, fill: PO.ink, letterSpacing: i === 0 ? 6 : 0 } });
    t.position.set(32, 28 + [0, 62, 106, 150, 210][i]);
    card.addChild(t);
    return t;
  });
  const masks = texts.map((t) => {
    const m = new Graphics();
    card.addChild(m);
    t.mask = m;
    return m;
  });
  card.position.set(1290, 170);
  const ui = new Container();
  ui.addChild(card);
  ctx.plane(ui, { z: 0, screen: true });
  // erase order: «Antes: una mano» first, then the box, the stance… and the name last
  const ERASE = [1, 2, 3, 0, 4];
  return {
    update(lt, f) {
      const rm = f.rm;
      // eyes: they light up behind Canelo when he stands before her (M3)
      eyes.clear();
      const lit = second ? 1 : sm((lt - 14) / 3);
      for (let i = 0; i < EYES; i++) {
        const a = Math.min(1, lit * EYES - i);
        if (a <= 0) continue;
        const x = 120 + ((i * 173) % 560);
        const y = 560 + ((i * 97) % 220);
        eyes.ellipse(x - 13, y, 9, 5).fill({ color: PO.paper, alpha: a }).ellipse(x + 13, y, 9, 5).fill({ color: PO.paper, alpha: a });
      }
      // M1: La Mano comes from her ship, walks toward the lighthouse; M4 she lowers her head
      const walk = second ? 1 : sm(lt / 6);
      const mx = MANO[0] + (1 - walk) * 520;
      const bow = second ? 1 : sm((lt - 22) / 2);
      if (mn) {
        mn.pose(lt, mx, MANO[1], { flip: false, rot: bow * 0.12 });
        if (mn.puppet) mn.puppet.walk = !second && lt < 6 ? 1 : 0;
      }
      // M5: the nib rises toward Cerito… and trembles; it cannot
      const raise = second ? 0 : sm((lt - 28) / 1.2) * (1 - sm((lt - 33) / 1));
      const shake = raise > 0.6 && !rm ? Math.sin(lt * 45) * 3 : 0;
      hand.position.set(mx - 90 + shake, MANO[1] - 190 - raise * 60);
      hand.rotation = -0.3 - raise * 0.5;
      // S4: she tries the stroke: grey ink, and it fades as it is drawn — no mark
      grey.clear();
      if (!second && lt > 30.5 && lt < 34) {
        const p = sm((lt - 30.5) / 1.4);
        const fade = 1 - sm((lt - 31.6) / 1.6);
        const x0 = mx - 120;
        const y0 = MANO[1] - 300;
        grey.moveTo(x0, y0).lineTo(x0 - 160 * p, y0 + 150 * p).stroke({ width: 10, color: 0x8a8682, alpha: 0.85 * fade, cap: 'round' });
      }
      // M2: Canelo picks up her scarf and puts it on over his own
      const pick = second ? 1 : sm((lt - 7) / 4);
      if (can) can.pose(lt, CAN[0], CAN[1], { flip: true });
      knit.position.set(CAN[0] + 90 - pick * 90, CAN[1] - pick * 120);
      knit.rotation = (1 - pick) * 0.1;
      knit.scale.set(1 - pick * 0.25);
      own.visible = false;
      flame.clear();
      flame.ellipse(CAN[0] - 80, CAN[1] - 70, 6, 13).fill({ color: COL.orange, alpha: 0.9 });
      // Cerito (a cat now) sniffs her
      const sniff = second ? 1 : sm((lt - 26) / 2);
      if (cer) cer.pose(lt, CAN[0] + 120 + sniff * 200, CAN[1], { flip: true });
      // the card (M6), the lantern (M9–M10), Borrón and Itō (M8), the tear
      const c0 = second ? 0 : 99;
      card.alpha = second ? sm((lt - c0) / 1) * (1 - sm((lt - 18) / 1.5)) : 0;
      texts.forEach((t, i) => {
        const order = ERASE.indexOf(i);
        const e = second ? sm((lt - 2 - order * 2.4) / 1.6) : 0;
        const m = masks[i];
        const w = t.width + 20;
        m.clear().rect(t.x - 10 + w * e, t.y - 6, w * (1 - e), t.height + 12).fill(0xffffff);
        t.alpha = 1 - e * 0.5;
      });
      const arrive = second ? sm((lt - 14) / 3) : 0;
      // «Borrón (sin hipo, sin dona) e Itō (sin espada)» (h95 M8): his painting holds his donut up by his cheek, so he
      // arrives turned toward Itō, who stops IN FRONT of that paw — the donut stays behind Itō's kimono
      if (borron) {
        borron.visible = arrive > 0.01;
        borron.pose(lt, 1700 - arrive * 250, ground, { flip: true });
      }
      if (ito) {
        ito.visible = arrive > 0.01;
        ito.pose(lt, 1820 - arrive * 300, ground, { flip: false });
      }
      // she turns the broken lantern, shakes it, nothing; leaves it on the step
      const hold = second ? sm((lt - 20) / 1) : 0;
      const leave = second ? sm((lt - 30) / 2) : 0;
      broken.visible = hold > 0.01;
      broken.position.set(mx - 80 + (step[0] - (mx - 80)) * leave, MANO[1] - 150 + (step[1] - (MANO[1] - 150)) * leave);
      broken.rotation = leave < 0.01 && !rm ? Math.sin(lt * 9) * 0.25 * hold : 0;
      tear.clear();
      if (second && lt > 33) {
        const dy = sm((lt - 33) / 1.2) * 120;
        tear.ellipse(mx - 30, MANO[1] - 200 + dy, 6, 10).fill(PO.ink);
      }
      // they go through the cat flap (fade out together)
      const gone = second ? sm((lt - 36) / 2) : 0;
      for (const a of [mn, borron, ito]) if (a) a.alpha = 1 - gone;
      hand.alpha = 1 - gone;
    },
  };
}

function vigilia(ctx: SceneCtx): FilmSet {
  const isl = homeSet(ctx, 'dark', { x: 1000, skyZ: 4000 });
  // dawn comes: a live dawn sky that grows over the dark one
  const dawnSky = new Container();
  const dawn = new Sprite(skyTex(ctx));
  dawn.position.set(-840, -500);
  dawn.alpha = 0;
  dawnSky.addChild(dawn);
  ctx.plane(dawnSky, { z: 3990 });
  const st = new Container();
  const gy = (x: number) => isl.ground(x) + 4;
  const step = isl.step;
  const broken = lantern(true, 0.9, true);
  broken.position.set(step[0], step[1] - 2);
  const photo = new Graphics().rect(step[0] + 30, step[1] - 44, 30, 44).fill(0xf0e8d8).rect(step[0] + 33, step[1] - 41, 24, 30).fill(0x3a3040);
  const blanket = new Graphics().ellipse(1260, gy(1260) + 8, 90, 18).fill(0x8a3a3a);
  const paint = new Graphics();
  const can = ctx.actor(ctx.canelo, 190);
  const cer = ctx.actor(STAND_INS.ceritoGato, 110);
  const guests = [
    { slug: 'ecomudo_static_cat', x: 560, t: 4, gesture: 'nadie' },
    { slug: STAND_INS.maneki, x: 760, t: 9, gesture: 'escoba' },
    { slug: STAND_INS.hipolito, x: 1440, t: 14, gesture: 'sin_tarro' },
    { slug: STAND_INS.grafitera, x: 1600, t: 19, gesture: 'faro' },
  ].map((g) => ({ g, a: ctx.actor(g.slug, 150) }));
  const knit = knitScarf(110);
  const broom = new Graphics().moveTo(0, 0).lineTo(30, -110).stroke({ width: 5, color: 0x8a6a3a });
  const dots = new Text({ text: '…', style: { fontFamily: 'Playfair Display', fontSize: 40, fill: 0xe8e0d0 } });
  dots.anchor.set(0.5);
  st.addChild(blanket, broken, photo, paint, broom, dots);
  for (const { a } of guests) if (a) st.addChild(a);
  if (cer) st.addChild(cer);
  if (can) st.addChild(can);
  st.addChild(knit);
  const flame = new Graphics();
  st.addChild(flame);
  ctx.plane(st, { z: 1000 });
  const ref = ctx.plane(new Container(), { z: 1000 });
  const touched: Record<string, number> = {};
  const spots: Record<string, [number, number]> = {};
  return {
    update(lt, f) {
      dawn.alpha = sm((lt - 26) / 18);
      for (const { g, a } of guests) {
        if (!a) continue;
        const come = sm((lt - g.t * 0.5) / 3);
        const x = g.x + (1 - come) * (g.x < 1000 ? -500 : 500);
        a.pose(lt, x, gy(x), { flip: g.x < 1000 });
        if (a.puppet) a.puppet.walk = come > 0.02 && come < 0.98 ? 1 : 0;
        spots[g.slug] = [x, gy(x) - 70];
        const when = Math.min(g.t + 6, touched[g.slug] ?? Infinity);
        const d = sm((lt - when) / 1.2);
        if (g.gesture === 'escoba') {
          broom.position.set(x + 50, gy(x));
          broom.rotation = 0.2;
          broom.alpha = d;
        }
        if (g.gesture === 'nadie') {
          dots.position.set(x, gy(x) - 170);
          dots.alpha = d * (1 - sm((lt - when - 3) / 1));
        }
        if (g.gesture === 'faro') {
          paint.clear();
          if (d > 0) {
            const px = isl.lamp[0] + 60;
            const py = gy(isl.lamp[0]) - 120;
            paint.poly([px - 8, py, px + 8, py, px + 5, py - 40 * d, px - 5, py - 40 * d]).fill(0xf0ece0);
            if (d > 0.7) paint.poly([px, py - 42, px - 60, py - 70, px - 60, py - 50]).fill({ color: COL.lanternBlue, alpha: (d - 0.7) / 0.3 });
          }
        }
      }
      if (cer) {
        cer.pose(lt, 1260, gy(1260) + 4, {});
        if (cer.puppet) cer.puppet.sleeping = true;
      }
      // Canelo, with both scarves, lies down by the broken lantern; he does not sleep
      const lie = sm((lt - 24) / 3);
      if (can) can.pose(lt, step[0] - 140, gy(step[0] - 140), { flip: false, rot: -lie * 0.18 });
      knit.position.set(step[0] - 150, gy(step[0] - 140) - 118 + lie * 10);
      knit.scale.set(0.7);
      flame.clear();
      flame.ellipse(step[0] - 60, gy(step[0]) - 60, 5, 11).fill({ color: COL.orange, alpha: 0.95 });
      flame.circle(step[0] - 60, gy(step[0]) - 60, 50).fill({ color: COL.orange, alpha: 0.08 });
      void f;
    },
    hotspots: (f) => Object.entries(spots).map(([name, p]) => {
      const [x, y] = f.toScreen(ref, p);
      return { name, x, y, r: 80 };
    }),
    tap: (name, lt) => {
      touched[name] = lt;
    },
  };
}
function skyTex(ctx: SceneCtx): Texture {
  return ctx.baker.shade(
    'vig-dawn',
    3600,
    1200,
    `vec2 bakeUV() { return vTextureCoord / max(uInputClamp.zw, vec2(1e-4)); }
void main() {
  vec2 uv = bakeUV();
  vec3 a = vec3(0.12, 0.16, 0.3), m = vec3(0.5, 0.52, 0.62), c = vec3(0.96, 0.78, 0.6);
  vec3 col = uv.y < 0.6 ? mix(a, m, uv.y / 0.6) : mix(m, c, (uv.y - 0.6) / 0.4);
  finalColor = vec4(col, 1.0);
}`,
    {},
    {},
    { res: 0.5 },
  );
}
