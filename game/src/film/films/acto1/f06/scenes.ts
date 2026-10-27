/**
 * F06 EM%EN «Cuadra 8» — the direction, scene by scene (guion h73 E1–E46). Times are film seconds = song seconds
 * (T(c) = bar c). Facing: Canelo, Hipólito, Espuma, Dona and Luzterna are painted looking LEFT (flip = look right);
 * the EMIAU stand-in looks RIGHT (flip = look left).
 */
import { Container, Graphics } from 'pixi.js';
import type { SetModule } from '../../../stage';
import { BAR, T, TV, balloon, donut, kick, mug, outBack, plate, put, rnd, scene, seg, sm, springIn, word, homiauAt, type Stage } from './sets';
import { CROWD, ESPUMA, DONA } from './lot';

const C = (c: number) => T(c);
/** the mic (drawn once, posed per frame) */
function micG(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-12, 0, 24, 120, 10).fill(0x2a2a36).stroke({ width: 5, color: TV.line });
  g.circle(0, -10, 30).fill(0x9aa3b8).stroke({ width: 5, color: TV.line });
  for (let i = -2; i <= 2; i++) g.moveTo(-22, -10 + i * 9).lineTo(22, -10 + i * 9).stroke({ width: 2, color: 0x5a6378 });
  c.addChild(g);
  return c;
}

// ================================================================== 0 · tele (the battle's last cartoon frame → the tape)
export const tele: SetModule = scene({
  cast: { canelo: 300, emiau: 360, luz: 220 },
  direct(lt, m, S, f) {
    const { cast } = S;
    put(cast.canelo, true, lt, 640, 980, { flip: true });
    put(cast.emiau, true, lt, 1290, 990, { flip: true });
    put(cast.luz?.actor, true, lt, 1480, 640 + Math.sin(lt * 1.7) * 8, {});
    cast.lantern(0.5, 1);
    S.crowd.update(lt, { nod: kick(S, m) });
    S.sodium.set(1);
    S.spot.alpha = 0.3;
    cast.drawFlame(lt, 0.55);
    // preparation of the wash: tracking lines climb from the bottom
    const p = seg(lt, 1.4, 2.9);
    S.hud.update(lt, f, { rec: 0, track: p, hudA: 0 });
  },
});

// ================================================================== 1 · entrada c1–9 (E1–E4)
export const entrada: SetModule = scene({
  cast: { canelo: 300, emiau: 720, luz: 230, dona: 760, hipo: 260 },
  fore: true,
  lines: [
    { a: C(3) + 0.3, b: C(5), text: '¡EL CAMPEÓN!', whole: true, at: 'top', size: 150, color: 0xffd23a },
    { a: C(5) + 0.2, b: C(7), text: '¡SLIM! ¡SLIM!', at: 'top', size: 110, even: true },
  ],
  extra: (ctx, base) => {
    const mic = micG();
    // Oficial Dona's microphone is a donut on a stick
    const dm = new Container();
    const g = new Graphics();
    g.roundRect(-10, 0, 20, 110, 8).fill(0x2a2a36).stroke({ width: 5, color: TV.line });
    donut(g, 0, -20, 40, 4);
    dm.addChild(g);
    void ctx;
    base.fx.parent?.addChild(dm);
    return { mic, dm };
  },
  direct(lt, m, S, f) {
    const { cast, extra } = S;
    const shotB = m >= C(3) && m < C(5);
    const shotC = m >= C(5) && m < C(7);
    const shotD = m >= C(7);
    const shotA = !shotB && !shotC && !shotD;
    S.crowd.update(lt, { nod: kick(S, m) * 0.6, lean: shotC ? -0.6 * sm(seg(m, C(5), C(6))) : 0 });
    S.sodium.set(1);
    // A: between the heads (the fore crowd), the circle far away
    if (S.fore) {
      S.fore.visible = shotA;
      S.fore.update(lt, { nod: kick(S, m) });
    }
    put(cast.hipo, shotA || shotD, lt, 1680, 760, {});
    // B: Oficial Dona hosts with his donut-mic; a fan's flash
    put(cast.dona, shotB, lt, 900, 1180, { flip: true });
    extra.dm.visible = shotB;
    if (shotB && cast.dona) {
      const [hx, hy] = cast.dona.head();
      extra.dm.position.set(cast.dona.x - hx * 0.1 + 160, cast.dona.y + hy * 0.62 + 40);
      extra.dm.rotation = -0.3;
      const fl = 1 - seg(m, C(3) + 0.05, C(3) + 0.35);
      if (fl > 0 && m >= C(3)) S.sfx.rect(-200, -200, 2320, 1480).fill({ color: 0xffffff, alpha: fl * (S.ctx.rf ? 0.25 : 0.6) });
    }
    // C: EMIAU walks into the ring from the right, low angle, the crowd opens
    const walk = sm(seg(m, C(5), C(6.6)));
    put(cast.emiau, shotC || shotD, lt, shotC ? 1500 - walk * 420 : 1560, shotC ? 1180 : 1300, { flip: true, sx: shotD ? 1.15 : 1, sy: shotD ? 1.15 : 1 });
    if (cast.emiau && shotD) cast.emiau.alpha = 0.95;
    // D: the reverse — Canelo small across the ring, his small flame; her, far, lantern low
    put(cast.canelo, shotA || shotD, lt, shotA ? 900 : 620, shotA ? 900 : 960, { flip: true, sx: shotA ? 0.8 : 1, sy: shotA ? 0.8 : 1 });
    put(cast.luz?.actor, shotD, lt, 1190, 610 + Math.sin(lt * 1.7) * 8, {});
    cast.lantern(shotD ? 0.35 : 0, 0.8);
    cast.drawFlame(lt, 0.45);
    S.spot.alpha = shotD ? 0.25 : 0.15;
    // the tape: REC appears after the wash; tracking at the cuts
    const cutT = [C(3), C(5), C(7)].some((c) => m >= c && m < c + 0.18) ? 1 : 0;
    S.hud.update(lt, f, { rec: sm(seg(lt, 0.5, 0.9)), track: Math.max(1 - seg(lt, 0, 0.9), cutT * 0.6) });
  },
});

// ================================================================== 2 · ataque c9–24 (E5–E11): the champion attacks
const barPlate = (draw: (g: Graphics, c: Container) => void) => (ctx: Parameters<typeof plate>[0]) => plate(ctx, draw);
export const ataque: SetModule = scene({
  cast: { canelo: 700, emiau: 640 },
  lines: [
    { a: C(9), b: C(10), text: 'Llegaste anoche…' },
    { a: C(10), b: C(11), text: '…con hambre de olvido,' },
    { a: C(13), b: C(14), text: 'catorce rondas…' },
    { a: C(14), b: C(15), text: '…y ni un «gracias, amigo».' },
    { a: C(17), b: C(18), text: 'Tu casa esperando,', at: 'bottom' },
    { a: C(18), b: C(19), text: 'tu hoja en el suelo,', at: 'bottom' },
    { a: C(21), b: C(24), text: 'y tú en la barra…' },
  ],
  inserts: [
    // E6: a burst of his night, in VHS — the bar, the fourteen mugs, Doña Espuma pointing at the board
    {
      a: C(11),
      b: C(11.5),
      make: barPlate((g) => {
        g.rect(-200, 640, 2320, 700).fill(0x9a5530).rect(-200, 640, 2320, 40).fill(0xc77a45);
        mug(g, 860, 420, 200, 260, { fill: 0.2 });
      }),
    },
    {
      a: C(11.5),
      b: C(12),
      make: barPlate((g) => {
        g.rect(-200, 700, 2320, 600).fill(0x9a5530);
        for (let i = 0; i < 14; i++) mug(g, 280 + (i % 7) * 200, 380 + Math.floor(i / 7) * 230, 120, 170, { fill: 0 });
      }),
    },
    {
      a: C(12),
      b: C(12.5),
      make: (ctx) =>
        plate(ctx, (g, c) => {
          g.roundRect(1000, 220, 560, 420, 10).fill(0x1d3a2a).stroke({ width: 8, color: 0x6e3820 });
          for (let i = 0; i < 14; i++) g.rect(1040 + i * 34, 300 + (i % 5 === 4 ? 0 : 0), 8, 120).fill(0xf3efe6);
          const t = word(ctx.k, 'CANELO', { fontFamily: 'Permanent Marker', fontSize: 70, fill: 0xf3efe6 });
          t.position.set(1280, 520);
          c.addChild(t);
          const es = ctx.still(ESPUMA);
          if (es) {
            es.scale.set(-700 / es.texture.height, 700 / es.texture.height);
            es.position.set(620, 1120);
            c.addChild(es);
          }
        }),
    },
    {
      a: C(12.5),
      b: C(13),
      make: barPlate((g) => {
        g.rect(-200, 640, 2320, 700).fill(0x9a5530);
        mug(g, 700, 300, 260, 360, { fill: 0.9, foam: 1, tilt: 0.3 });
        mug(g, 1060, 330, 240, 330, { fill: 0.6 });
      }),
    },
    // E10: the blank page by the lighthouse, cold
    {
      a: C(19),
      b: C(21),
      make: (ctx) =>
        plate(
          ctx,
          (g) => {
            g.rect(-200, 760, 2320, 600).fill(0x1a2a3a);
            g.rect(1180, 180, 120, 600).fill(0xe8eef6).stroke({ width: 6, color: TV.line });
            for (let i = 0; i < 5; i++) g.rect(1180, 220 + i * 120, 120, 40).fill(0xc04a4a);
            g.poly([1150, 180, 1330, 180, 1240, 90]).fill(0x2a3a5a).stroke({ width: 6, color: TV.line });
            g.poly([700, 860, 980, 840, 1010, 900, 720, 930]).fill(0xf6f8fc).stroke({ width: 5, color: TV.line });
            for (let i = 0; i < 40; i++) g.circle(rnd(i) * 1920, rnd(i + 3) * 700, 2).fill({ color: 0xffffff, alpha: 0.7 });
          },
          0x0f1a2e,
        ),
    },
  ],
  direct(lt, m, S, f) {
    const { cast } = S;
    const e5 = m < C(11);
    const e7 = m >= C(13) && m < C(15);
    const e8 = m >= C(15) && m < C(17);
    const e9 = m >= C(17) && m < C(19);
    const e11 = m >= C(21);
    const k = kick(S, m);
    S.crowd.visible = e9 || e8;
    S.crowd.update(lt, { nod: k, jump: e8 && m > C(16.5625) ? 0.4 : 0 });
    S.sodium.set(1);
    // E5/E7: EMIAU medium, rapping with his whole body: leans on the kick, points
    if (e5 || e7) put(cast.emiau, true, lt, 1000, 1150, { flip: true, rot: -0.04 - k * 0.05, sx: 1 + k * 0.03, sy: 1 - k * 0.03 });
    // E9: he circles Canelo like a shark (an ellipse; nearer = bigger)
    else if (e9) {
      const a = seg(m, C(17), C(19)) * Math.PI * 1.4 + Math.PI * 0.2;
      const near = (Math.sin(a) + 1) / 2;
      put(cast.emiau, true, lt, 960 + Math.cos(a) * 430, 930 + near * 120, { flip: Math.cos(a + 0.4) > 0, sx: 0.55 + near * 0.25, sy: 0.55 + near * 0.25 });
    } else if (e11) put(cast.emiau, true, lt, 1360, 1210, { flip: true, rot: -0.12 - k * 0.04 });
    else put(cast.emiau, false, lt);
    // E8: Canelo close-up — at the scratch (c16.56) a crash zoom and he shrinks
    if (e8) {
      const sq = m > C(16.5625) ? springIn(seg(m, C(16.5625), C(17)), 2, 6) : 0;
      put(cast.canelo, true, lt, 880, 1260, { flip: true, sx: 1 + sq * 0.08, sy: 1 - sq * 0.14 });
    } else if (e9) put(cast.canelo, true, lt, 960, 980, { flip: true, sx: 0.5, sy: 0.5 });
    else if (e11) put(cast.canelo, true, lt, 600, 1240, { flip: true, sx: 0.95, sy: 0.95 });
    else put(cast.canelo, false, lt);
    cast.drawFlame(lt, 0.45);
    S.spot.alpha = e9 ? 0.3 : 0.12;
    // the tape jumps a frame at the FX synth (c13) and at every cut
    const jump = [C(11), C(13), C(15), C(17), C(19), C(21)].some((c) => m >= c && m < c + 0.15) ? 1 : 0;
    S.hud.update(lt, f, { track: jump * 0.8 });
  },
});

// ================================================================== 3 · remate c24–25 (E12–E13): the punchline in the silence
export const remate: SetModule = scene({
  cast: { emiau: 700, homiau: 0.9 },
  lines: [{ a: C(24) + 0.05, b: C(24.5625), text: '…llorándole al hielo.', whole: true, at: 'center', size: 130 }],
  extra: () => ({ uuh: new Container() }),
  direct(lt, m, S, f) {
    const { cast } = S;
    const boom = m >= C(24.5625);
    const j = S.ctx.k.judged('uuuh');
    const big = j && (j.r === 'great' || j.r === 'hit') ? 1.6 : 1;
    // a nearly frozen frame: EMIAU finishes in the silence
    put(cast.emiau, !boom, lt, 1080, 1200, { flip: true, rot: -0.08 });
    S.crowd.visible = boom;
    S.crowd.update(lt, { jump: boom ? 0.9 * big * (1 - seg(m, C(24.5625) + 0.8, C(25))) : 0 });
    S.sodium.set(1);
    // Homiau spits his donut laughing
    homiauAt(S, boom, lt, 420, 1080, { chew: boom ? 1 : 0, squash: boom ? 0.6 : 0, raise: 0.4 }, 0.95);
    if (boom) {
      const p = seg(m, C(24.5625), C(24.5625) + 0.7);
      const x = 520 + p * 500;
      const y = 820 - Math.sin(p * Math.PI) * 300;
      donut(S.fx, x, y, 34 * big, 7);
      // ¡UUUUUH! is a wave of the crowd (bigger with the tap)
    }
    S.hud.update(lt, f, { track: boom && m < C(24.5625) + 0.15 ? 0.8 : 0 });
  },
  look: (lt, m) => (m < C(24.5625) ? { sat: 0.55, contrast: 1.05 } : null),
});

// ================================================================== 4 · cierre c25–33 (E14–E18)
export const cierre: SetModule = scene({
  cast: { canelo: 820, emiau: 640, dona: 300 },
  lines: [
    { a: C(25), b: C(26), text: 'Desde que llegaste…' },
    { a: C(26), b: C(27), text: '…aquí nadie olvida:' },
    { a: C(27), b: C(28), text: 'la noche se queda…', at: 'bottom' },
    { a: C(28), b: C(29), text: '…pegada a la vida.', at: 'bottom' },
    { a: C(29), b: C(30), text: 'Gato de fuego…' },
    { a: C(30), b: C(31), text: '…con llama de vela:' },
    { a: C(31), b: C(32), text: 'vete a tu caja…' },
    { a: C(32), b: C(32.5), text: '…que nadie te espera.' },
    { a: C(32.5), b: C(33), text: 'Tu turno, pisapapeles.', who: 'EMIAU', size: 80 },
  ],
  inserts: [
    // E15: the nights the neighbourhood remembers — a neighbour dancing on a table, Oficial Dona's secret donuts,
    // Doña Espuma singing into her rag
    {
      a: C(27),
      b: C(27.67),
      make: (ctx) =>
        plate(ctx, (g, c) => {
          g.rect(-200, 760, 2320, 600).fill(0x5a2a4a);
          g.roundRect(660, 700, 600, 60, 10).fill(0x9a5530).stroke({ width: 6, color: TV.line });
          g.rect(700, 760, 30, 260).fill(0x6e3820).rect(1190, 760, 30, 260).fill(0x6e3820);
          const s = ctx.still(CROWD[2]);
          if (s) {
            s.scale.set(520 / s.texture.height);
            s.position.set(960, 710);
            s.rotation = 0.12;
            c.addChild(s);
          }
        }),
    },
    {
      a: C(27.67),
      b: C(28.33),
      make: (ctx) =>
        plate(ctx, (g, c) => {
          g.rect(-200, 800, 2320, 600).fill(0x252b52);
          const s = ctx.still(DONA);
          if (s) {
            s.scale.set(700 / s.texture.height);
            s.position.set(860, 1120);
            c.addChild(s);
          }
          for (let i = 0; i < 5; i++) donut(g, 1240 + (i % 2) * 40, 940 - i * 60, 44, i);
        }),
    },
    {
      a: C(28.33),
      b: C(29),
      make: (ctx) =>
        plate(ctx, (g, c) => {
          g.rect(-200, 700, 2320, 600).fill(0x9a5530);
          const s = ctx.still(ESPUMA);
          if (s) {
            s.scale.set(760 / s.texture.height);
            s.position.set(980, 1150);
            c.addChild(s);
          }
          g.roundRect(1160, 420, 70, 150, 20).fill(0xff8a1e).stroke({ width: 6, color: TV.line });
          for (let i = 0; i < 4; i++) g.circle(1300 + i * 60, 360 - i * 40, 14).fill(0xfff6e0).stroke({ width: 4, color: TV.line });
        }),
    },
  ],
  extra: (_ctx, base) => {
    const mic = micG();
    base.fx.parent?.addChild(mic);
    return { mic };
  },
  direct(lt, m, S, f) {
    const { cast, extra } = S;
    const e14 = m < C(27);
    const e16 = m >= C(29) && m < C(31);
    const e17 = m >= C(31) && m < C(32.5);
    const e18 = m >= C(32.5);
    const k = kick(S, m);
    // E14: the crowd nods along — and the neighbours look at each other, ashamed
    S.crowd.visible = e14 || e18;
    S.crowd.update(lt, { nod: k, lean: e14 ? Math.sin(m * 1.3) * 0.5 : 0 });
    put(cast.dona, e14, lt, 1500, 820, {});
    // E16: his tail in close-up: the flame drops at «de vela» (c30)
    if (e16) put(cast.canelo, true, lt, 1180, 1520, { flip: false, sx: 1.25, sy: 1.25 });
    else if (e18) put(cast.canelo, true, lt, 760, 1170, { flip: true, sx: 0.75, sy: 0.75 });
    else put(cast.canelo, false, lt);
    const fk = e16 ? (m < C(30) ? 0.45 : 0.45 - 0.25 * sm(seg(m, C(30), C(30.5)))) : 0.3;
    cast.drawFlame(lt, fk);
    // E17: EMIAU throws the mic (it flies left); E18: Canelo catches it, clumsy
    put(cast.emiau, e17, lt, 1180, 1160, { flip: true, rot: e17 && m > C(32) ? 0.12 : -0.05 });
    const mic = extra.mic;
    mic.visible = e17 || e18;
    if (e17) {
      const p = seg(m, C(32), C(32.5));
      mic.position.set(1000 - p * 600, 700 - Math.sin(p * Math.PI) * 260);
      mic.rotation = p * 9;
    } else if (e18 && cast.canelo) {
      const p = seg(m, C(32.5), C(32.5) + 0.5);
      const [hx, hy] = cast.canelo.head();
      const tx = cast.canelo.x - hx * 0.6 + 120;
      const ty = cast.canelo.y + hy * 0.5;
      mic.position.set(tx + (1 - p) * 200 + Math.sin(p * 18) * 30 * (1 - p), ty - (1 - p) * 160);
      mic.rotation = (1 - p) * 4 + Math.sin(p * 20) * 0.3 * (1 - p);
    }
    S.sodium.set(1);
    const jump = [C(27), C(29), C(31), C(32.5625)].some((c) => m >= c && m < c + 0.15) ? 1 : 0;
    S.hud.update(lt, f, { track: jump * 0.8 });
  },
});

// ================================================================== 5 · quiebre c33–41 (E19–E24): the confession
export const quiebre: SetModule = scene({
  cast: { canelo: 560, luz: 300 },
  fore: true,
  lines: [
    { a: C(37.5), b: C(38.5), text: 'Sí.', small: true, at: 'bottom' },
    { a: C(38.5), b: C(39.5), text: 'Me fui.', small: true, at: 'bottom' },
    { a: C(39.5), b: C(40.5), text: 'Vine a olvidar.', small: true, at: 'bottom' },
    { a: C(40.5), b: C(41), text: 'Por mí despertó lo que despertó.', small: true, at: 'bottom' },
  ],
  extra: (_ctx, base) => {
    const mic = micG();
    const dim = new Graphics().rect(-400, -300, 2720, 1700).fill(0x05040c);
    const mid = base.fx.parent!;
    mid.addChildAt(dim, mid.getChildIndex(base.crowd) + 1);
    mid.addChild(mic);
    return { mic, dim };
  },
  direct(lt, m, S, f) {
    const { cast, extra } = S;
    const rm = S.ctx.rm;
    const e19 = m < C(34);
    const e20 = m >= C(34) && m < C(35);
    const j = S.ctx.k.judged('luz');
    // she lifts it with the tap — or by herself half a bar later
    const tLuz = j && (j.r === 'great' || j.r === 'hit') ? Math.min(C(37.5), j.at) : C(37.5);
    const beamOn = m >= tLuz;
    const e21 = m >= C(35) && m < tLuz;
    const e22 = beamOn && m < tLuz + BAR * 0.9;
    const close = beamOn && !e22;
    // E19: the wide from behind the crowd: he's alone; the sodium half dies; the mic squeals
    if (S.fore) {
      S.fore.visible = e19;
      S.fore.update(lt, {});
    }
    S.crowd.visible = e19 || e21 || e22;
    S.crowd.update(lt, { lean: e22 ? -0.5 * sm(seg(m, tLuz, tLuz + 0.5)) : 0, tint: 0x6a6480 });
    S.sodium.set(e19 ? 1 - 0.6 * sm(seg(m, C(33), C(33.5))) : 0.35);
    // Canelo: E19 wide/small · E20 medium, a step toward the glowing exit · E22 lit in the ring · E23–24 close-up
    if (e19) put(cast.canelo, true, lt, 900, 900, { flip: true, sx: 0.75, sy: 0.75 });
    else if (e20) {
      const step = sm(seg(m, C(34.4), C(34.9)));
      put(cast.canelo, true, lt, 760 + step * 90, 1180, { flip: true });
    } else if (e22) put(cast.canelo, true, lt, 820, 980, { flip: true, sx: 0.6, sy: 0.6 });
    else if (close) put(cast.canelo, true, lt, 900, 1290, { flip: false, sx: 1.25, sy: 1.25 });
    else put(cast.canelo, false, lt);
    S.door.alpha = e20 ? sm(seg(m, C(34), C(34.4))) * 0.9 : e19 ? 0.2 : 0;
    // Luzterna at the back: the autofocus hunts and finds her; she lifts the lantern slowly
    const lift = sm(seg(m, C(35.5), tLuz));
    if (e21) put(cast.luz?.actor, true, lt, 1220, 720 + Math.sin(lt * 1.7) * 6 - lift * 30, { rot: -lift * 0.15, sx: 1.25, sy: 1.25 });
    else if (e22) put(cast.luz?.actor, true, lt, 1500, 600 + Math.sin(lt * 1.7) * 6, { rot: -0.15, sx: 0.8, sy: 0.8 });
    else put(cast.luz?.actor, false, lt);
    cast.lantern(e21 ? 0.4 + lift * 0.6 : e22 ? 1 : 0, e21 ? 1.3 : 1);
    // the beam crosses the crowd and falls on him like a spotlight (the only saturated colour of the film)
    if (e22 && cast.luz?.actor && cast.canelo) {
      const from = lanternAtSafe(S);
      const p = rm ? 1 : outBack(seg(m, tLuz, tLuz + 0.35), 1.1);
      const to: [number, number] = [from[0] + (cast.canelo.x - from[0]) * p, from[1] + (cast.canelo.y - 140 - from[1]) * p];
      S.beam.set(from, to, 150, 1);
    } else S.beam.set([0, 0], [1, 1], 1, 0);
    // in the close-ups the light is ON him (a pool + rim)
    S.spot.tint = 0x8fd8ff;
    S.spot.alpha = close ? 0.45 : e22 ? 0.4 * sm(seg(m, tLuz + 0.2, tLuz + 0.5)) : 0;
    S.spot.position.set(close ? 900 : 820, close ? 1150 : 940);
    extra.dim.alpha = e19 ? 0.15 + 0.2 * sm(seg(m, C(33), C(33.5))) : 0.36;
    // the mic's feedback squeal (rings around the mic) in E19
    const mic = extra.mic;
    mic.visible = e19 || close;
    if (cast.canelo && mic.visible) {
      const [hx, hy] = cast.canelo.head();
      const lower = close ? sm(seg(m, tLuz + BAR, tLuz + BAR * 1.6)) : 0;
      mic.position.set(cast.canelo.x + (close ? 220 : 90), cast.canelo.y + hy * cast.canelo.scale.y * 0.4 + (close ? 140 + lower * 120 : 40));
      mic.scale.set(close ? 1.3 : 0.6);
      mic.rotation = close ? -0.3 + lower * 0.5 : -0.4;
      if (e19 && m < C(33.6)) {
        const q = seg(m, C(33), C(33.6));
        for (let i = 0; i < 4; i++) S.fx.circle(mic.x, mic.y - 20, 30 + ((q * 4 + i / 4) % 1) * 160).stroke({ width: 5, color: 0xffffff, alpha: (1 - ((q * 4 + i / 4) % 1)) * 0.7 });
      }
      void hx;
    }
    cast.drawFlame(lt, close ? 0.3 : 0.25);
    const jump = [C(34), C(35), C(37)].some((c) => m >= c && m < c + 0.12) ? 0.5 : 0;
    S.hud.update(lt, f, { track: jump, hudA: 0.8 });
  },
  look: (lt, m) => {
    // dark and almost colourless; once her light lands, the blue is kept (the only saturated colour)
    const on = m >= C(37);
    return { mono: on ? 0.9 : 0.7, accHue2: 0.55, accW2: on ? 0.12 : 0, accHue: 0.07, accW: 0.05, lift: 0.02, contrast: 1.1 };
  },
});
function lanternAtSafe(S: Stage): [number, number] {
  const l = S.cast.luz;
  if (!l?.actor) return [1500, 600];
  const a = l.actor;
  const c = Math.cos(a.rotation);
  const s = Math.sin(a.rotation);
  const lx = l.lantern[0] * a.scale.x;
  const ly = l.lantern[1] * a.scale.y;
  return [a.x + lx * c - ly * s, a.y + lx * s + ly * c];
}

// ================================================================== 6 · subida c41–49 (E25–E28): the colour comes back from him
export const subida: SetModule = scene({
  cast: { canelo: 640, hipo: 360, homiau: 1.05 },
  lines: [
    { a: C(41), b: C(43), text: 'Por mí ustedes se acuerdan de todo.', small: true, at: 'bottom' },
    { a: C(47.5), b: C(49), text: 'Y saben qué…', small: true, at: 'bottom', size: 72 },
  ],
  direct(lt, m, S, f) {
    const { cast } = S;
    const e25 = m < C(43);
    const e26 = m >= C(43) && m < C(45);
    const e27 = m >= C(45) && m < C(47);
    const e28 = m >= C(47);
    // E25: Homiau lowers his donut without biting it
    homiauAt(S, e25, lt, 900, 1260, { raise: 0.6 - 0.6 * sm(seg(m, C(41.5), C(42.5))) }, 1.2);
    // E26: the wide, silent; Hipólito stirs in his sleep
    S.crowd.visible = e26;
    S.crowd.update(lt, { tint: 0xc0b8c8 });
    put(cast.hipo, e26, lt, 1560, 900, { rot: e26 ? Math.sin(m * 3) * 0.04 : 0 });
    // E27–28: Canelo; the colour returns from him: the flame first, then his fur, then the floor around him
    if (e26) put(cast.canelo, true, lt, 900, 960, { flip: true, sx: 0.6, sy: 0.6 });
    else if (e27) put(cast.canelo, true, lt, 900, 1180, { flip: true });
    else if (e28) {
      const up = sm(seg(m, C(47), C(47.6)));
      put(cast.canelo, true, lt, 900, 1290, { flip: true, sx: 1.25, sy: 1.25, rot: -up * 0.06 });
    } else put(cast.canelo, false, lt);
    const grow = sm(seg(m, C(45), C(49)));
    cast.drawFlame(lt, 0.3 + 0.35 * sm(seg(m, C(45), C(45.6))), 0xff7a0e);
    S.spot.tint = 0x8fd8ff;
    S.spot.alpha = e27 || e28 ? 0.35 : 0.2;
    S.spot.position.set(900, 1100);
    S.sodium.set(0.35 + 0.4 * grow);
    // the wash over everything — with a hole that opens from him (preparation → development; the exit is c49)
    if (e27 || e28) {
      const c = S.cast.canelo;
      const hx = c ? c.x : 900;
      const hy = c ? c.y - 260 : 900;
      S.wash.draw(1, [hx, hy, 40 + seg(m, C(45.4), C(49)) * 700]);
    } else S.wash.draw(1, null);
    S.hud.update(lt, f, { hudA: 0.8 });
  },
  look: (lt, m) => {
    // the flame is the first colour (kept hue: orange), then all of it rises with the hole
    const k = sm(seg(m, C(45.4), C(49)));
    return { mono: 0.75 * (1 - k), accHue: 0.07, accW: 0.1 + 0.1 * (1 - k), sat: 0.7 + 0.4 * k, aberr: 1.6 - 0.8 * k };
  },
});

// ================================================================== 7 · respuesta c49–64 (E29–E34): Canelo answers
export const respuesta: SetModule = scene({
  cast: { canelo: 640, emiau: 600, homiau: 1.1 },
  lines: [
    { a: C(49), b: C(51), text: 'Acordarse cuesta,' },
    { a: C(51), b: C(53), text: 'olvidar sale caro;' },
    { a: C(53), b: C(55), text: 'vine a olvidarlo…', at: 'bottom' },
    { a: C(55), b: C(57), text: '…y me salió al revés, claro.', at: 'bottom' },
    { a: C(57), b: C(59), text: 'Homiau, ¿de qué te acuerdas?' },
    { a: C(59), b: C(61), text: '¡Del cumpleaños de mi hija!', who: 'HOMIAU', color: 0xffd23a },
  ],
  inserts: [
    // E34: in colour, the good things the neighbours remember
    {
      a: C(61),
      b: C(61.67),
      make: (ctx) =>
        plate(
          ctx,
          (g, c) => {
            g.rect(-200, 700, 2320, 600).fill(0x9a5530);
            const s = ctx.still(ESPUMA);
            if (s) {
              s.scale.set(720 / s.texture.height);
              s.position.set(820, 1140);
              c.addChild(s);
            }
            const b = balloon(ctx.k, '¡DON CHUCHO! ¡AÑEJO, SIN HIELO!', { size: 50, tail: [-160, 130], wrap: 560 });
            b.position.set(1300, 380);
            c.addChild(b);
          },
          0x3a5a9a,
        ),
    },
    {
      a: C(61.67),
      b: C(62.33),
      make: (ctx) =>
        plate(
          ctx,
          (g, c) => {
            g.rect(-200, 760, 2320, 600).fill(0x2e9a5a);
            const s = ctx.still(DONA);
            if (s) {
              s.scale.set(720 / s.texture.height);
              s.position.set(900, 1160);
              c.addChild(s);
            }
            donut(g, 1280, 360, 70, 11);
            for (let i = 0; i < 8; i++) g.moveTo(1280 + Math.cos(i * 0.78) * 90, 360 + Math.sin(i * 0.78) * 60).lineTo(1280 + Math.cos(i * 0.78) * 140, 360 + Math.sin(i * 0.78) * 95).stroke({ width: 7, color: 0xffd23a });
          },
          0xf4a62a,
        ),
    },
    {
      a: C(62.33),
      b: C(63),
      make: (ctx) =>
        plate(
          ctx,
          (g, c) => {
            const s = ctx.still(CROWD[4]);
            if (s) {
              s.scale.set(700 / s.texture.height);
              s.position.set(900, 1140);
              c.addChild(s);
            }
            for (let i = 0; i < 6; i++) {
              const x = 1200 + i * 90;
              const y = 420 - Math.sin(i) * 80;
              g.circle(x, y, 18).fill(TV.line).rect(x + 14, y - 90, 7, 90).fill(TV.line);
            }
          },
          0xff7fb0,
        ),
    },
  ],
  direct(lt, m, S, f) {
    const { cast } = S;
    const k = kick(S, m);
    const e30 = m < C(53);
    const e31 = m >= C(53) && m < C(57);
    const e32 = m >= C(57) && m < C(59);
    const e33 = m >= C(59) && m < C(61);
    const e63 = m >= C(63);
    S.crowd.visible = e31 || e63;
    S.crowd.update(lt, { nod: k, jump: e31 ? 0.25 : 0, tint: 0xb8bcdc });
    S.sodium.set(0.8);
    // E29–30: he steps in on the downbeat and raps with his whole body, exaggerated, funny
    const step = springIn(seg(m, C(49), C(49) + 0.5), 2, 5);
    if (e30) put(cast.canelo, true, lt, 900, 1220, { flip: true, rot: -0.05 + k * 0.06, sx: 1 + (1 - step) * 0.12 + k * 0.04, sy: 1 - (1 - step) * 0.12 - k * 0.04 });
    else if (e32) put(cast.canelo, true, lt, 700, 1200, { flip: true, rot: 0.05 });
    else if (e63) put(cast.canelo, true, lt, 960, 980, { flip: true, sx: 0.6, sy: 0.6 });
    else put(cast.canelo, false, lt);
    // E31: EMIAU, arms crossed, raises an eyebrow (a little lean)
    put(cast.emiau, e31 && m > C(55), lt, 1200, 1180, { flip: true, rot: 0.06 });
    // E32–33: Homiau, asked — he remembers something good and cries
    homiauAt(S, e32 || e33, lt, e32 ? 1350 : 960, e32 ? 1180 : 1240, { cry: e33 ? sm(seg(m, C(59.3), C(60))) : 0, raise: e33 ? 0.8 : 0.2, squash: e33 ? k * 0.4 : 0 }, e33 ? 1.4 : 0.9);
    cast.drawFlame(lt, 0.7);
    S.spot.tint = 0x8fd8ff;
    S.spot.alpha = 0.3;
    S.spot.position.set(cast.canelo?.x ?? 900, 1100);
    // the tape now lives only at the edges of the frame
    S.wash.draw(0.6, [960, 560, 760]);
    const jump = [C(53), C(55), C(57), C(59), C(61), C(63)].some((c) => m >= c && m < c + 0.12) ? 0.5 : 0;
    S.hud.update(lt, f, { track: jump });
  },
  look: () => ({ sat: 1.08, aberr: 0.6, lift: 0.02, contrast: 1.04 }),
});

// ================================================================== 8 · golpe c64–65 (E35–E36)
export const golpe: SetModule = scene({
  cast: { canelo: 420 },
  lines: [
    { a: C(64) + 0.05, b: C(64.5625), text: 'Lo bueno también se queda…', whole: true, at: 'center', size: 110 },
    { a: C(64.5625), b: C(65), text: '…no nomás la cruda fija.', at: 'top', size: 96 },
  ],
  direct(lt, m, S, f) {
    const boom = m >= C(64.5625);
    put(S.cast.canelo, true, lt, 960, 1000, { flip: true, sx: boom ? 1.05 : 1, sy: boom ? 0.95 : 1 });
    S.crowd.update(lt, { jump: boom ? 0.8 : 0 });
    S.sodium.set(0.8);
    S.cast.drawFlame(lt, 0.75);
    S.wash.draw(0.6, [960, 560, 760]);
    S.hud.update(lt, f, { track: boom && m < C(64.5625) + 0.12 ? 0.6 : 0 });
  },
  look: (lt, m) => (m < C(64.5625) ? { sat: 0.95, contrast: 1.06 } : { sat: 1.1, aberr: 0.6 }),
});

// ================================================================== 9 · gana c65–73 (E37–E42)
export const gana: SetModule = scene({
  cast: { canelo: 660, emiau: 640, luz: 260, hipo: 380 },
  lines: [
    { a: C(65), b: C(66), text: 'Tú siempre te acordaste…' },
    { a: C(66), b: C(67), text: '…de todo, solito;' },
    { a: C(67), b: C(68), text: 'ahora somos muchos:' },
    { a: C(68), b: C(69), text: 'ya no estás solito.' },
    { a: C(69.5), b: C(70.25), text: 'Si esto lo rompí yo,', at: 'bottom' },
    { a: C(70.25), b: C(71), text: 'lo arreglo yo;', at: 'bottom' },
    { a: C(71), b: C(72), text: 'y si alguien paga…', at: 'bottom', size: 104 },
    { a: C(72), b: C(72.5625), text: '…pago yo.', at: 'bottom', size: 120, whole: true },
    { a: C(72.5625), b: C(73), text: '¿Y luego?', who: 'HIPÓLITO', at: 'top', size: 110, whole: true },
  ],
  direct(lt, m, S, f) {
    const { cast } = S;
    const k = kick(S, m);
    const e37 = m < C(69);
    const e38 = m >= C(69) && m < C(69.5);
    const e39 = m >= C(69.5) && m < C(71);
    const e40 = m >= C(71) && m < C(72.5625);
    const e42 = m >= C(72.5625);
    // E37: face to face; EMIAU's guard comes down (he leans back, softens)
    const soft = sm(seg(m, C(66), C(69)));
    if (e37) {
      put(cast.canelo, true, lt, 640, 1200, { flip: true, rot: 0.02 + k * 0.03 });
      put(cast.emiau, true, lt, 1300, 1190, { flip: true, rot: -0.1 + soft * 0.14, sx: 1 - soft * 0.03 });
    } else if (e38) {
      put(cast.canelo, false, lt);
      const sq = springIn(seg(m, C(69), C(69.4)), 2, 6);
      put(cast.emiau, true, lt, 1000, 1320, { flip: true, sx: 1.3 + (1 - sq) * 0.06, sy: 1.3 - (1 - sq) * 0.06 });
    } else if (e39) {
      put(cast.emiau, false, lt);
      put(cast.canelo, true, lt, 900, 1210, { flip: true, rot: -0.04 });
    } else if (e40) {
      put(cast.emiau, false, lt);
      // solemn, for the first time: the camera doesn't move, he doesn't bounce
      put(cast.canelo, true, lt, 920, 1320, { flip: false, sx: 1.35, sy: 1.35 });
    } else {
      put(cast.canelo, false, lt);
      put(cast.emiau, false, lt);
    }
    // the blue light is still on him (from her, at the back)
    put(cast.luz?.actor, e37 || e39, lt, 1560, 560 + Math.sin(lt * 1.7) * 6, { sx: 0.8, sy: 0.8, rot: -0.12 });
    cast.lantern(e37 || e39 ? 0.9 : 0, 0.9);
    if ((e37 || e39) && cast.canelo?.visible) S.beam.set(lanternAtSafe(S), [cast.canelo.x, cast.canelo.y - 200], 160, 0.55);
    else S.beam.set([0, 0], [1, 1], 1, 0);
    S.spot.tint = 0x8fd8ff;
    S.spot.alpha = e40 || e39 ? 0.4 : 0.25;
    S.spot.position.set(cast.canelo?.x ?? 900, 1150);
    // E42: Hipólito wakes up in his plastic chair — exactly on time — and the crowd explodes
    put(cast.hipo, e42, lt, 1000, 1180, { sx: 1.4, sy: 1.4 });
    if (cast.hipo?.puppet) cast.hipo.puppet.sleeping = !e42;
    S.crowd.visible = e42;
    S.crowd.update(lt, { jump: e42 ? 1 : 0 });
    S.sodium.set(0.8);
    cast.drawFlame(lt, e40 ? 0.8 : 0.75);
    S.wash.draw(0.55, [960, 560, 780]);
    const jump = [C(69), C(69.5), C(71), C(72.5625)].some((c) => m >= c && m < c + 0.1) ? 0.5 : 0;
    S.hud.update(lt, f, { track: jump });
  },
  look: () => ({ sat: 1.08, aberr: 0.55, lift: 0.02 }),
});

// ================================================================== 10 · salida c73–81 + tail (E43–E46)
export const salida: SetModule = scene({
  cast: { canelo: 560, emiau: 600, luz: 230, espuma: 640 },
  lines: [{ a: C(77.3), b: C(79), text: 'Empieza por las catorce rondas.', who: 'DOÑA ESPUMA', small: true, at: 'bottom', size: 60 }],
  extra: (_ctx, base) => {
    const mic = micG();
    const glass = new Graphics();
    const bar = new Graphics();
    const mid = base.fx.parent!;
    mid.addChildAt(bar, 0);
    mid.addChild(mic, glass);
    return { mic, glass, bar };
  },
  direct(lt, m, S, f) {
    const { cast, extra } = S;
    const rm = S.ctx.rm;
    const e43 = m < C(75);
    const e44 = m >= C(75) && m < C(77);
    const e45 = m >= C(77) && m < C(79);
    const e46 = m >= C(79);
    const j = S.ctx.k.judged('mic');
    const tDrop = j && (j.r === 'great' || j.r === 'hit') ? Math.min(C(73.75), j.at) : C(73.75);
    // E43: slow motion — the mic leaves his paw, spins in the air, the crowd follows it with their eyes
    put(cast.canelo, e43, lt, 860, 1200, { flip: true });
    const mic = extra.mic;
    mic.visible = e43;
    if (e43 && cast.canelo) {
      const p = seg(m, tDrop, C(75));
      mic.position.set(cast.canelo.x + 200, cast.canelo.y - 380 + p * p * 520);
      mic.rotation = (rm ? 0.6 : 1) * p * 5;
      if (p >= 1) mic.visible = false;
    }
    S.crowd.visible = e43 || e44;
    S.crowd.update(lt, { lean: e43 ? 0.3 : 0, jump: e44 ? 0.35 : 0 });
    // E44: EMIAU bumps his fist; the crowd lifts Canelo on their shoulders (slow)
    const lift = sm(seg(m, C(75.6), C(77)));
    if (e44) {
      put(cast.emiau, m < C(76), lt, 1180, 1190, { flip: true, rot: -0.06 });
      put(cast.canelo, true, lt, m < C(76) ? 760 : 960, (m < C(76) ? 1190 : 1000) - lift * 220, { flip: true, rot: lift * 0.08, sx: m < C(76) ? 1 : 0.7, sy: m < C(76) ? 1 : 0.7 });
      if (m < C(76)) {
        const p = seg(m, C(75.2), C(75.6));
        const x = 960 + (1 - p) * 80;
        S.fx.circle(x, 880, 26).fill(0xf4a65a).stroke({ width: 5, color: TV.line });
        if (p >= 1) for (let i = 0; i < 6; i++) S.fx.moveTo(960 + Math.cos(i) * 40, 880 + Math.sin(i) * 40).lineTo(960 + Math.cos(i) * 80, 880 + Math.sin(i) * 80).stroke({ width: 5, color: 0xffd23a });
      }
    } else put(cast.emiau, false, lt);
    // E45: the bar — Doña Espuma answers from afar, polishing a glass; at the back, out of focus, Luzterna smiles
    // with her lantern low and says nothing
    const b = (extra.bar as Graphics).clear();
    const gl = (extra.glass as Graphics).clear();
    if (e45) {
      b.rect(-400, -300, 2720, 1700).fill(0x2a1a3a);
      b.rect(-400, 860, 2720, 600).fill(0x9a5530).rect(-400, 860, 2720, 40).fill(0xc77a45);
      for (let i = 0; i < 9; i++) b.roundRect(200 + i * 170, 360, 50, 150, 12).fill([TV.green, TV.amber, TV.pink][i % 3]).stroke({ width: 5, color: TV.line });
      b.rect(160, 520, 1600, 16).fill(0x6e3820);
    }
    put(cast.espuma, e45, lt, 760, 1120, { flip: true });
    put(cast.luz?.actor, e45, lt, 1440, 700 + Math.sin(lt * 1.5) * 5, { sx: 0.75, sy: 0.75, alpha: 0.55 });
    if (cast.luz?.actor && e45) cast.luz.actor.alpha = 0.55;
    cast.lantern(e45 ? 0.3 : 0, 0.7);
    if (e45 && cast.espuma) {
      const x = cast.espuma.x + 230;
      const y = 820 + Math.sin(lt * 6) * 6;
      gl.roundRect(x - 40, y - 90, 80, 110, 12).fill({ color: 0xcfe8ff, alpha: 0.6 }).stroke({ width: 5, color: TV.line });
      gl.ellipse(x + Math.sin(lt * 6) * 18, y - 30, 56, 30).fill(0xff8a1e).stroke({ width: 5, color: TV.line });
    }
    S.sodium.set(e45 ? 0 : 0.7);
    S.spot.alpha = 0;
    cast.drawFlame(lt, 0.7);
    // E46: REC blinks and stops; static — and the cartoon comes back with a TV flicker
    const stop = m >= C(79.5);
    const snow = e46 ? sm(seg(m, C(79.6), C(80.5))) * (1 - sm(seg(m, C(81) - 0.2, C(81) + 0.4))) : 0;
    S.wash.draw(e46 ? 0.4 * (1 - sm(seg(m, C(81) - 0.2, C(81) + 0.4))) : 0.5, [960, 560, 780]);
    S.hud.update(lt, f, { stopped: stop, snow, rec: m < C(81) ? 1 : 0, track: e46 ? 0.6 * (1 - sm(seg(m, C(80.5), C(81)))) : 0 });
  },
  look: (lt, m) => {
    // the tape gives way to the cartoon (the colour TV again) after the static
    const back = sm(seg(m, C(81) - 0.1, C(81) + 0.5));
    return { sat: 1.04 + 0.04 * back, aberr: 0.55 * (1 - back), lift: 0.02 * (1 - back), grain: 0.09 - 0.05 * back, hal: 0.3 - 0.18 * back };
  },
});
export { rnd, word };
