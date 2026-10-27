/**
 * DEMO · II «Estudio del gato» (Da Vinci). A notebook page by candlelight; every line draws itself with a hand's wobble
 * (on 12 fps steps), in the order a draughtsman would:
 *
 *   0.0  the CIRCLE (where the moon was: the match cut lands on it) → the SQUARE
 *   2.3  the cat, drawn inside them (Canelo's painting baked as a sepia sketch: ink from the edges, left-handed
 *        hatching ↘ that crosses as it darkens, sanguine) — revealed dark lines first, hatching after
 *   3.0  a flying machine for a cat on the left page («¿puede un gato volar?», written right to left)
 *   4.6  the measure: six heads, ticks and numbers; «la cola mide tres cabezas»
 *   6.0  studies on the right page: the eye, the paw, the tail with its arrows; a sanguine circle round the eye
 *
 * Planes: the desk (1060), the page (1000, parchment baked), the drawings (999, live), the candle's glow, and in front,
 * out of focus, an ink pot and a quill (dof copies).
 */
import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../stage';
import { circlePts, DV, glowSprite, hand, mirrorNote, parchment, rectPts, Sketch, type Stroke } from '../styles/davinci';
import { glFilter, NOISE, uni } from '../gl';

const CX = 960;
const CY = 470;
const R = 300;
const SQ = { x: 705, y: 260, s: 510 };
const FOOT = 770;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (lt: number, a: number, b: number) => clamp01((lt - a) / (b - a));

/** the drawing-on reveal: dark lines first, then the hatching, top → down, in brushy patches (screen space) */
const REVEAL = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform float uP;
${NOISE}
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  vec2 q = vTextureCoord / max(uInputClamp.zw, vec2(1e-4));
  float dark = c.a > 0.0 ? 1.0 - lum(c.rgb / c.a) : 0.0;
  float order = fbm(q * vec2(9.0, 5.0)) * 0.45 + q.y * 0.35 + (1.0 - dark) * 0.35;
  float a = smoothstep(order - 0.06, order + 0.02, uP * 1.25);
  finalColor = c * a;
}`;

function strokesFor(list: [number, number][][], width = 2.2, color = DV.ink, seed = 1, amp = 1.6): Stroke[] {
  return list.map((pts, i) => ({ pts: hand(pts, amp, seed + i * 13), width, color }));
}

const mod: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx: SceneCtx): FilmSet {
    const b = ctx.baker;
    const k = ctx.k;
    // ---- the desk (dark walnut) and the page
    const desk = new Sprite(
      b.shade(
        'desk',
        3400,
        2100,
        `vec2 bakeUV() { return vTextureCoord / max(uInputClamp.zw, vec2(1e-4)); }
void main() {
  vec2 uv = bakeUV();
  vec2 p = uv * uSize / 400.0;
  float grain = fbm(vec2(p.x * 0.6, p.y * 9.0)) * 0.6 + vnoise(vec2(p.x * 2.0, p.y * 40.0)) * 0.4;
  vec3 c = mix(vec3(0.11, 0.06, 0.03), vec3(0.24, 0.13, 0.06), grain);
  c *= 0.7 + 0.3 * smoothstep(1.2, 0.2, length(uv - vec2(0.3, 0.25)));
  finalColor = vec4(c, 1.0);
}`,
        {},
        {},
        { res: 0.5 },
      ),
    );
    desk.position.set(-740, -520);
    const deskNode = new Container();
    deskNode.addChild(desk);
    ctx.plane(deskNode, { z: 1060, bake: 'none' });
    const page = new Sprite(parchment(b, 2240, 1420, 3, Math.max(0.6, b.res * 0.9)));
    page.position.set(CX - 1120, 540 - 710);
    const shadow = new Graphics().roundRect(CX - 1110, 540 - 690, 2240, 1420, 30).fill({ color: 0x000000, alpha: 0.45 });
    const pageNode = new Container();
    pageNode.addChild(shadow, page);
    ctx.plane(pageNode, { z: 1000, bake: 'none' });

    // ---- the drawings (live)
    const draw = new Container();
    const circle = new Sketch(strokesFor([circlePts(CX, CY, R, 72, -Math.PI * 0.62)], 2.6, DV.ink, 3, 2.2));
    const square = new Sketch(strokesFor([rectPts(SQ.x, SQ.y, SQ.s, SQ.s)], 2.4, DV.ink, 7, 1.8));
    const axes = new Sketch(
      strokesFor(
        [
          [
            [CX, CY - R - 40],
            [CX, FOOT + 30],
          ],
          [
            [SQ.x - 40, CY + 40],
            [SQ.x + SQ.s + 40, CY + 40],
          ],
        ],
        1.2,
        DV.inkL,
        11,
        1,
      ),
    );
    // the measure: six heads
    const mx = 1270;
    const headH = (FOOT - 300) / 6;
    const measureLines: [number, number][][] = [
      [
        [mx, 300],
        [mx, FOOT],
      ],
    ];
    for (let i = 0; i <= 6; i++)
      measureLines.push([
        [mx - 14, 300 + i * headH],
        [mx + 14, 300 + i * headH],
      ]);
    const measure = new Sketch(strokesFor(measureLines, 1.6, DV.inkL, 21, 0.9));
    const nums = new Container();
    for (let i = 1; i <= 6; i++) {
      const t = k.text.sprite(String(i), { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 22, fill: DV.inkL }, 0.5);
      t.scale.x = -1;
      t.position.set(mx + 30, 300 + (i - 0.5) * headH);
      nums.addChild(t);
    }
    // the right page: eye, paw, tail
    const eyeC: [number, number] = [1580, 300];
    const eyeLines: [number, number][][] = [
      Array.from({ length: 25 }, (_, i) => {
        const a = (i / 24) * Math.PI;
        return [eyeC[0] - 110 * Math.cos(a), eyeC[1] - 48 * Math.sin(a)] as [number, number];
      }),
      Array.from({ length: 25 }, (_, i) => {
        const a = (i / 24) * Math.PI;
        return [eyeC[0] - 110 * Math.cos(a), eyeC[1] + 44 * Math.sin(a)] as [number, number];
      }),
      circlePts(eyeC[0], eyeC[1], 40, 40),
      [
        [eyeC[0], eyeC[1] - 36],
        [eyeC[0] - 7, eyeC[1]],
        [eyeC[0], eyeC[1] + 36],
        [eyeC[0] + 7, eyeC[1]],
        [eyeC[0], eyeC[1] - 36],
      ],
    ];
    for (let i = 0; i < 9; i++)
      eyeLines.push([
        [eyeC[0] - 30 + i * 7, eyeC[1] - 30 + i * 2],
        [eyeC[0] - 22 + i * 7, eyeC[1] + 26],
      ]);
    const eye = new Sketch(strokesFor(eyeLines, 1.9, DV.ink, 31, 1.2));
    const sang = new Sketch(strokesFor([circlePts(eyeC[0], eyeC[1], 150, 50, -2.2, Math.PI * 1.9)], 3.2, DV.sanguine, 33, 2.4));
    const pawC: [number, number] = [1590, 650];
    const pawLines: [number, number][][] = [circlePts(pawC[0], pawC[1] + 30, 52, 30, 0, Math.PI * 2)];
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI * 0.85 + (i * Math.PI * 0.7) / 3;
      pawLines.push(circlePts(pawC[0] + Math.cos(a) * 82, pawC[1] + 30 + Math.sin(a) * 82, 22, 20));
    }
    const paw = new Sketch(strokesFor(pawLines, 2, DV.ink, 41, 1.3));
    const tailPts: [number, number][] = Array.from({ length: 30 }, (_, i) => {
      const t = i / 29;
      return [1380 + t * 420, 880 - Math.sin(t * Math.PI * 1.2) * 70 + t * 20] as [number, number];
    });
    const tail = new Sketch(
      strokesFor(
        [
          tailPts,
          [
            [1380, 960],
            [1800, 960],
          ],
          [
            [1395, 948],
            [1380, 960],
            [1395, 972],
          ],
          [
            [1785, 948],
            [1800, 960],
            [1785, 972],
          ],
        ],
        2,
        DV.ink,
        51,
        1.2,
      ),
    );
    // the left page: a flying machine for a cat (bat wings with ribs, a seat, a crank)
    const fm: [number, number] = [400, 380];
    const fmLines: [number, number][][] = [];
    for (const side of [-1, 1]) {
      const wing: [number, number][] = [];
      for (let i = 0; i <= 5; i++) {
        const a = -0.2 - i * 0.22;
        wing.push([fm[0] + side * Math.cos(a) * (220 - i * 18), fm[1] + Math.sin(a) * (150 - i * 6) + i * 18]);
      }
      fmLines.push(wing);
      for (let i = 0; i <= 5; i++) fmLines.push([fm, wing[i]]);
      // the scalloped trailing edge
      const edge: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        edge.push([fm[0] + side * t * 200, fm[1] + 40 + Math.sin(t * Math.PI * 5) * 14 - t * 30]);
      }
      fmLines.push(edge);
    }
    fmLines.push(circlePts(fm[0], fm[1] + 70, 34, 30), circlePts(fm[0], fm[1] + 70, 12, 16), [
      [fm[0] - 50, fm[1] + 130],
      [fm[0] + 50, fm[1] + 130],
    ]);
    const machine = new Sketch(strokesFor(fmLines, 1.8, DV.ink, 61, 1.4));
    const notes = [
      { sp: mirrorNote(k.text, '¿puede un gato volar?', 30), at: [400, 600] as [number, number], t: 4.0 },
      { sp: mirrorNote(k.text, 'la cola mide\ntres cabezas', 28), at: [1430, 560] as [number, number], t: 5.6 },
      { sp: mirrorNote(k.text, 'el ojo guarda la luz', 26), at: [1580, 430] as [number, number], t: 8.2 },
      { sp: mirrorNote(k.text, 'nunca está quieto', 26), at: [1590, 1010] as [number, number], t: 10.4 },
    ];
    const noteMasks = notes.map(() => new Graphics());
    for (const [i, n] of notes.entries()) {
      n.sp.position.set(...n.at);
      n.sp.mask = noteMasks[i];
      draw.addChild(n.sp, noteMasks[i]);
    }
    draw.addChild(circle, square, axes, measure, nums, eye, sang, paw, tail, machine);
    // the cat, revealed by the drawing-on filter
    const catHost = new Container();
    const cat = ctx.actor(ctx.canelo, 470);
    if (cat) catHost.addChild(cat);
    const reveal = glFilter('film-reveal', REVEAL, { uP: { value: 0, type: 'f32' } });
    catHost.filterArea = new Rectangle(-4000, -4000, 9920, 9080);
    catHost.filters = [reveal];
    draw.addChild(catHost);
    const drawPlane = ctx.plane(draw, { z: 999 });

    // ---- the candle (top left): its light breathes on the page
    const glow = glowSprite(ctx.tex('dv:glow'));
    glow.position.set(140, 60);
    glow.scale.set(4.2);
    glow.alpha = 0.5;
    const flame = new Graphics();
    const candle = new Container();
    const wax = new Graphics().roundRect(110, -120, 60, 170, 8).fill(0xe9dcc0).roundRect(110, -120, 18, 170, 8).fill({ color: 0xffffff, alpha: 0.25 });
    candle.addChild(glow, wax, flame);
    ctx.plane(candle, { z: 980 });

    // ---- in front, out of focus: an ink pot and a quill
    const fg = new Container();
    const pot = new Graphics().ellipse(150, 1010, 110, 36).fill(0x0c0806).roundRect(60, 900, 180, 110, 30).fill(0x14100c).ellipse(150, 900, 90, 26).fill(0x050403).ellipse(120, 920, 20, 60).fill({ color: 0xffffff, alpha: 0.08 });
    const quill = new Graphics();
    const q0: [number, number] = [1540, 1130];
    const q1: [number, number] = [2120, 760];
    quill.moveTo(...q0).lineTo(...q1).stroke({ width: 6, color: 0xd8ccb0 });
    for (let i = 0; i < 46; i++) {
      const t = 0.25 + (i / 45) * 0.75;
      const x = q0[0] + (q1[0] - q0[0]) * t;
      const y = q0[1] + (q1[1] - q0[1]) * t;
      const len = 70 * Math.sin(((t - 0.25) / 0.75) * Math.PI) + 10;
      quill.moveTo(x, y).lineTo(x - len * 0.55, y - len * 0.9).stroke({ width: 3, color: i % 3 ? 0xeee6d0 : 0xc8bca0, alpha: 0.9 });
      quill.moveTo(x, y).lineTo(x + len * 0.85, y + len * 0.3).stroke({ width: 3, color: i % 4 ? 0xf2ecdc : 0xd0c4a8, alpha: 0.9 });
    }
    fg.addChild(pot, quill);
    ctx.plane(fg, { z: 520, bake: 'dof', dof: 380, blur: 16 });

    const sm = (x: number) => x * x * (3 - 2 * x);
    return {
      update(lt, f) {
        const st = f.step12;
        circle.draw(sm(seg(lt, 0.0, 1.5)), st);
        square.draw(seg(lt, 1.2, 2.6), st);
        axes.draw(seg(lt, 2.2, 3.0), st);
        machine.draw(seg(lt, 3.0, 5.6), st);
        measure.draw(seg(lt, 4.6, 6.0), st);
        nums.alpha = seg(lt, 5.4, 6.0);
        eye.draw(seg(lt, 6.0, 8.0), st);
        paw.draw(seg(lt, 7.4, 9.0), st);
        tail.draw(seg(lt, 8.8, 10.4), st);
        sang.draw(seg(lt, 11.0, 12.2), st);
        // notes write themselves right → left (the mask grows from the right edge)
        notes.forEach((n, i) => {
          const p = seg(lt, n.t, n.t + 1.4);
          const w = n.sp.width + 20;
          const h = n.sp.height + 20;
          noteMasks[i].clear().rect(n.at[0] + w / 2 - w * p, n.at[1] - h / 2, w * p, h).fill(0xffffff);
        });
        // the cat: drawn on, then alive
        const rp = seg(lt, 2.3, 5.4);
        uni(reveal).uP = rp;
        const want = rp < 1 ? [reveal] : [];
        if ((catHost.filters?.length ?? 0) !== want.length) catHost.filters = want;
        if (cat) {
          cat.pose(lt, CX, FOOT, {});
          if (cat.puppet) cat.puppet.look = Math.sin(lt * 0.4) * 0.3;
        }
        // the candle: flame + light flicker (deterministic noise; small with «Reducir destellos»)
        const fl = Math.sin(lt * 9.1) * 0.5 + Math.sin(lt * 23.7 + 1.3) * 0.3 + Math.sin(lt * 4.3) * 0.2;
        const amp = f.rf ? 0.25 : 1;
        glow.alpha = 0.46 + fl * 0.06 * amp;
        glow.scale.set(4.2 + fl * 0.08 * amp);
        const sway = f.rm ? 0 : Math.sin(lt * 3.3) * 4;
        flame
          .clear()
          .moveTo(140, -122)
          .bezierCurveTo(118, -150, 140 + sway, -180, 140 + sway * 1.6, -205)
          .bezierCurveTo(162 + sway, -175, 160, -150, 140, -122)
          .fill(0xffd27a)
          .ellipse(140, -140, 7, 12)
          .fill(0xfff6e0);
        void drawPlane;
      },
      look(lt) {
        // the page warms as the candle settles
        return { warm: 0.18 + 0.06 * Math.min(1, lt / 6) };
      },
      filters: [reveal],
      dirtAt: () => [0.08, 0.06],
    };
  },
};
export default mod;
