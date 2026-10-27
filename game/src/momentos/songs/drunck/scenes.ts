/**
 * «DRUNCK» — the scenes (docs/part-iii/04 §3, polished by 13 §3.3), each built ONCE before the clock and drawn as a pure
 * function of (m, lt = seconds since it came on). The score cuts between them with the `scn` key, and opens a memory out
 * of an object of the bar with `in` / `inP` / `obj` (stage.ts: the doorway).
 *
 *  scenes.ts   the present and Parte I: bar (THE STAGE OF MEMORY: its camera, its objects, Canelo performing) ·
 *              pint (inside the mug: a sea of beer, a tiny raft, his giant eye through the glass) · diario (the front
 *              pages on the counter, Canelo's cut-out jumping from photo to photo; c16 Nadie's lie) · astral (the card)
 *  scenes2.ts  Parte II, waves 1–3 · scenes3.ts the edge and the page
 */
import { BulgePinchFilter } from 'pixi-filters';
import { ColorMatrixFilter, Container, Graphics, type Sprite } from 'pixi.js';
import type { Kit } from '../../anime/kit';
import type { Actor } from '../../anime/actor';
import { BarSet, BAR } from './bar';
import { frameCamera } from './layout';
import { LW, TV, mug } from './tv';
import { SCENES2 } from './scenes2';
import { SCENES3 } from './scenes3';
import { inkMatrix } from './fxlook';
import { Silueta } from './silueta';
import {
  backdrop, bands, bell, card, clamp01, easeIn, easeInOut, easeOut, easeOutBack, glow, headOf, inkDrop, inkStroke, keyed, lerp, perform, rnd, scr, tearLine, tvArm, twinkle, txt, win,
  type Keyed, type Make, type PawKind,
} from './drawkit';
import type { DrunckStage } from './stage';
export type { Scn, Make } from './drawkit';

// ================================================================== BAR — the present (TV cartoon), THE STAGE OF MEMORY
/** the bar's objects a memory comes out of (bar world px, a quad clockwise from top-left) */
const OBJ: Record<string, number[]> = {
  diario: [790, 700, 1000, 700, 1016, 750, 770, 750],
  napkin: [1296, 702, 1440, 702, 1456, 750, 1280, 750],
  board: [100, 40, 400, 40, 400, 190, 100, 190],
  neon: [14, 284, 168, 284, 168, 426, 14, 426],
  tv: [1196, 86, 1394, 86, 1394, 224, 1196, 224],
  door: [-560, 160, -310, 160, -310, 680, -560, 680],
  ring: [1240, 688, 1404, 688, 1418, 716, 1226, 716],
};
const RIM: Record<string, number> = { tarro: TV.amberL, diario: 0xf0e2c2, napkin: TV.white, board: 0xd8f0e0, neon: TV.neonPink, tv: 0x9fe8ff, door: TV.pink, ring: 0x8ab4e0 };
const SEPIA = { paper: 0xf0e2c2, ink: 0x2a1a10, mid: 0x7a5a3a, red: 0xa8302a };

/** the neon sign walked around (the mug outline), and the galleon it bends into — 24 points each, bar px */
function neonPts(q: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 24; i++) {
    const p = (i / 24) * 4;
    const side = Math.floor(p);
    const f = p - side;
    const [x0, y0, x1, y1] = [30, 300, 120, 410];
    const a = side === 0 ? [x0 + (x1 - x0) * f, y0] : side === 1 ? [x1, y0 + (y1 - y0) * f] : side === 2 ? [x1 - (x1 - x0) * f, y1] : [x0, y1 - (y1 - y0) * f];
    // deck, stern, curved hull, bow (a galleon twice the sign's width, its masts drawn apart)
    const b = side === 0 ? [-10 + 180 * f, 360] : side === 1 ? [170 - 14 * f, 360 + 46 * f] : side === 2 ? [156 - 150 * f, 406 + Math.sin(f * Math.PI) * 14] : [6 - 16 * f, 406 - 46 * f];
    out.push(lerp(a[0], b[0], q), lerp(a[1], b[1], q));
  }
  return out;
}

const bar: Make = (st, k) => {
  const root = new Container();
  const frame = new Container();
  root.addChild(frame);
  const set = new BarSet();
  frame.addChild(set.root);
  // my layers inside the set: on the wall (graffiti, ink splats, the bathroom door opening), on the counter (over the
  // counter top: the newspaper, the napkin, the ring, the mug, his arm), and over everything (the TV's beam, the board)
  const wall = new Graphics();
  const wallC = new Container();
  wallC.addChild(wall);
  set.root.addChildAt(wallC, set.root.getChildIndex(set.back) + 1);
  const onCounter = new Container();
  set.root.addChildAt(onCounter, set.root.getChildIndex(set.front) + 1);
  const top = new Container();
  set.root.addChild(top);
  const espuma = st.actor('native', st.slugs.espuma, BAR.espuma.h);
  if (espuma) set.cast.addChild(espuma);
  const can = st.actor('tv', st.slugs.canelo, BAR.canelo.h);
  if (can) set.cast.addChild(can);
  // the Bibliotecario rises out of the ink on the counter (c19–20), Brecha leans out of the bathroom (c29)
  // (he lives in the set's BACK, so the one ink pass that washes the wall washes him too: no filter of his own)
  const biblio = st.actor('sepia', st.slugs.biblio, 560);
  if (biblio) set.back.addChild(biblio);
  const brecha = st.actor('comic', st.slugs.brecha, 470);
  const doorG = new Graphics();
  wallC.addChild(doorG);
  if (brecha) wallC.addChild(brecha);
  const wallFx = new Graphics();
  wallC.addChild(wallFx);
  // the graffiti's Ben-Day dots: drawn ONCE, revealed by a circle that grows out of the bathroom door
  const dots = new Graphics();
  for (let yy = 0; yy < 700; yy += 34) for (let xx = -1000; xx < 420; xx += 34) dots.circle(xx + ((yy / 34) % 2) * 17, yy, 6).fill({ color: 0xff2e88, alpha: 0.28 });
  const dotsMask = new Graphics();
  dots.mask = dotsMask;
  dots.visible = false;
  wallC.addChildAt(dots, 0);
  wallC.addChild(dotsMask);
  const graf = txt(k, 'NINGUNA CAJA\nES HOGAR', { fontFamily: 'Permanent Marker', fontSize: 58, fill: 0x00e5ff, stroke: { color: TV.line, width: 8 }, align: 'center', lineHeight: 64 });
  graf.position.set(-435, 470);
  graf.rotation = -0.1;
  const grafMask = new Graphics();
  graf.mask = grafMask;
  wallC.addChild(graf, grafMask);
  const tags = ['¡ABRAN!', 'DISRUPT', 'SIN CAJA'].map((t, i) => {
    const s = txt(k, t, { fontFamily: 'Permanent Marker', fontSize: 52, fill: [0xff2e88, 0x00e5ff, 0xffe14a][i], stroke: { color: TV.line, width: 7 } });
    s.position.set([-160, -740, 60][i], [120, 90, 560][i]);
    s.rotation = [-0.18, 0.12, -0.06][i];
    wallC.addChild(s);
    return s;
  });
  const counterG = new Graphics();
  onCounter.addChild(counterG);
  const mugC = new Container();
  const mugG = new Graphics();
  mugC.addChild(mugG);
  const armG = new Graphics();
  onCounter.addChild(mugC, armG);
  const topG = new Graphics();
  top.addChild(topG);
  // the board's page: REGISTRO 000 in chalk, F·O·L·I·O on the hats; the logbook's signature
  const chalk = txt(k, 'REGISTRO 000', { fontFamily: 'Permanent Marker', fontSize: 25, fill: 0x203a2c });
  const chalkMask = new Graphics();
  chalk.mask = chalkMask;
  const folio = 'FOLIO'.split('').map((ch) => txt(k, ch, { fontFamily: 'Bangers', fontSize: 34, fill: TV.pinkD, stroke: { color: TV.line, width: 4 } }));
  const sig = txt(k, 'el Capi', { fontFamily: 'Permanent Marker', fontSize: 34, fill: 0x9fd0ff });
  top.addChild(chalk, chalkMask, ...folio, sig);
  const shh = txt(k, '静', { fontFamily: 'Dela Gothic One', fontSize: 120, fill: 0xb0302a, stroke: { color: TV.line, width: 6 } });
  shh.position.set(420, 200);
  top.addChild(shh);
  // the filters of the bar: the glass of the mug bends it (c2), the ink washes it (c19–20)
  const bulge = new BulgePinchFilter({ radius: 300, strength: 0 });
  const inkF = new ColorMatrixFilter();
  const T = BAR.tarro;
  const MC: [number, number] = [T.x + T.w / 2, T.y + T.h / 2];
  // his rest pose, once: the head, the shoulder, the mouth (bar px)
  if (can) perform(st, k, can, -1, { x: BAR.canelo.x, y: BAR.canelo.y, flip: true });
  const H0 = headOf(can, [1157, 497]);
  const S0: [number, number] = [H0[0] + 26, H0[1] + 150];
  const MO: [number, number] = [H0[0] - 40, H0[1] + 70];
  const DRINK: [number, number] = [H0[0] + 80, H0[1] + 40];
  let canHead: [number, number] = H0;
  let cam = { x: 815, y: 470, zoom: 1.25 };
  let roll = 0;
  let mugQuad: number[] = [];
  let mugKey = -1;
  let lastDraw = -1;
  const toFrame = (x: number, y: number): [number, number] => {
    const dx = (x - cam.x) * cam.zoom;
    const dy = (y - cam.y) * cam.zoom;
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    return [960 + dx * c - dy * s, 540 + dx * s + dy * c];
  };
  const toScreen = (x: number, y: number): [number, number] => {
    const [fx, fy] = toFrame(x, y);
    return scr(k, fx, fy);
  };
  const quadToScreen = (q: number[]) => {
    const out: number[] = [];
    for (let i = 0; i < q.length; i += 2) out.push(...toFrame(q[i], q[i + 1]));
    return out;
  };

  /** Canelo's gesture at m: his performance, the arm (shoulder → paw) and the mug */
  function gesture(m: number) {
    const [g, g0] = st.keyAt(k, 'can', m, 'idle');
    const t = m - g0;
    const sway = 0.03 * Math.sin(m * 1.3);
    const p: Keyed & { rot?: number } = { look: 0.35, headA: sway };
    let arm: { to: [number, number]; kind: PawKind; w?: number; bend?: number; from?: [number, number]; n?: number } | null = null;
    let mugAt: { x: number; y: number; rot: number } = { x: MC[0], y: MC[1], rot: 0 };
    let fill = 0.85;
    let emote: 'surprise' | 'happy' | 'hurt' | 'sleepy' | null = null;
    if (g === 'drink') {
      // the trago: the mug up to his mouth, the head back
      const q = easeOutBack(t / 0.32, 1.2);
      mugAt = { x: lerp(MC[0], DRINK[0], q), y: lerp(MC[1], DRINK[1], q), rot: -0.95 * clamp01(q) };
      arm = { to: [mugAt.x - 40, mugAt.y + 20], kind: 'mitt' };
      Object.assign(p, { headA: 0.24 * clamp01(q), lean: -0.25 * clamp01(q), look: 0.1 });
      fill = lerp(0.85, 0.35, win(t, 0.3, 1.2));
    } else if (g === 'toast') {
      // ¡SALUD!: up and out toward whoever is on the right (the clink rings at the frame's edge)
      const q = easeOutBack(t / 0.18, 1.6);
      mugAt = { x: lerp(MC[0], H0[0] + 300, q), y: lerp(MC[1], H0[1] - 90, q), rot: 0.3 * clamp01(q) };
      arm = { to: [mugAt.x - 46, mugAt.y + 30], kind: 'mitt', bend: -30 };
      Object.assign(p, { lean: 0.5 * clamp01(q), look: 0.8, headA: -0.08 });
      emote = t < 0.6 ? 'happy' : null;
    } else if (g === 'slap') {
      // he slams the newspaper on the counter (wind-up, smear, contact)
      const up = t < 0.12;
      const q = up ? easeOut(t / 0.12) : 1;
      const hit = up ? 0 : easeOutBack((t - 0.12) / 0.1, 2);
      arm = { to: up ? [lerp(S0[0] + 80, 1010, q), lerp(S0[1], 560, q)] : [lerp(1010, 905, hit), lerp(560, 722, hit)], kind: 'mitt', w: 44 };
      Object.assign(p, { lean: up ? -0.2 : 0.55, look: -0.4, headA: up ? -0.05 : 0.08, crouch: up ? 0 : 0.2 });
      fill = 0.2;
    } else if (g === 'point') {
      // the rubber-hose arm stretches ALL the way across the bar to the tally board (exaggeration)
      const q = easeOutBack(t / 0.3, 1.5);
      const tx = lerp(S0[0] + 60, 345, clamp01(q));
      const ty = lerp(S0[1] - 40, 128 + Math.sin(m * 10) * 3, clamp01(q));
      arm = { to: [tx, ty], kind: 'point', w: 40, bend: -120 * clamp01(q) };
      Object.assign(p, { lean: -0.3, look: -0.8, headA: -0.05 });
    } else if (g === 'pointL') {
      // he points at the bathroom door across the bar (the graffiti), outraged
      const q = easeOutBack(win(t, 0.5, 0.75), 1.5);
      arm = { to: [lerp(S0[0] + 40, S0[0] - 330, q), lerp(S0[1], S0[1] - 150, q)], kind: 'point', w: 42, bend: 40 };
      Object.assign(p, { lean: -0.2, look: -0.9, headA: -0.06, crouch: 0.1 });
      emote = t > 0.5 ? 'hurt' : null;
    } else if (g === 'hush') {
      // «¡Shhh!»: the paw to his mouth, leaning in, eyes narrowed
      const q = easeOutBack(t / 0.2, 1.4);
      arm = { to: [lerp(S0[0] + 60, MO[0], q), lerp(S0[1], MO[1], q)], kind: 'point', w: 40, bend: 30 };
      Object.assign(p, { lean: 0.35, look: 0.9, headA: 0.06, crouch: 0.15 });
    } else if (g === 'stare') {
      // the consequence: he leans over the blank page that fell in front of him and stares at it
      const q = easeOut(t / 0.3);
      Object.assign(p, { lean: 0.45 * q, headA: 0.12 * q, headDy: 6 * q, look: -0.3, crouch: 0.15 * q });
      emote = t > 0.2 ? 'surprise' : null;
    } else if (g === 'shock') {
      Object.assign(p, { headDy: -10, look: 0.6, crouch: 0.1, lean: -0.15 });
      emote = 'surprise';
    } else if (g === 'drowsy') {
      Object.assign(p, { headA: 0.12 + 0.04 * Math.sin(m * 1.1), headDy: 8, look: -0.2, crouch: 0.2 });
      emote = 'sleepy';
      fill = 0.15;
    } else if (g === 'slump') {
      // c41: he slumps over the counter, his paw on the napkin (it becomes the page)
      const q = easeInOut(t / 0.5);
      p.rot = 0.55 * q;
      Object.assign(p, { crouch: 0.3 * q, headA: 0.15 * q, look: 0.2 });
      arm = { to: [lerp(S0[0] + 40, 1352, q), lerp(S0[1] + 40, 724, q)], kind: 'mitt', w: 42 };
      mugAt = { x: 960, y: MC[1] + 6, rot: 0 };
      fill = 0;
      emote = 'sleepy';
    } else if (g === 'empty') {
      fill = 0;
    }
    return { g, t, p, arm, mugAt, fill, emote };
  }

  /** the bar's filters follow the camera every frame (the bulge sits on the mug wherever it is on screen) */
  function applyFilters(k: Kit) {
    const v = k.view;
    // ---- the glass of the mug bends the bar as the camera pushes in (c2: «el vidrio del tarro curva el bar»)
    const bend = k.reduceMotion || k.quality !== 'high' ? 0 : clamp01(k.num('bend', 0));
    const fl: (BulgePinchFilter | ColorMatrixFilter)[] = [];
    if (bend > 0.001) {
      const [sx, sy] = toScreen(mugC.x, mugC.y);
      bulge.centerX = clamp01((sx - v.x) / v.w);
      bulge.centerY = clamp01((sy - v.y) / v.h);
      bulge.radius = (k.renderer.screen.width / v.w) * 760;
      bulge.strength = 0.85 * bend;
      fl.push(bulge);
    }
    const curF = (frame.filters ?? []) as readonly unknown[];
    if (curF.length !== fl.length || fl.some((f, i) => curF[i] !== f)) frame.filters = fl.length ? fl : null;
    // the ink washes the bar itself (wall, shelves, counter); the people telling it stay in their colors
    const want = inkF.enabled ? [inkF] : null;
    if ((set.back.filters?.[0] ?? null) !== (want?.[0] ?? null)) {
      set.back.filters = want;
      set.front.filters = want;
    }
  }

  return {
    root,
    update(k, m, lt) {
      const after = m >= st.pumM;
      const kick = after ? 0 : k.env('kick', m, 0.1, 0.4);
      const v = k.view;
      // ---- the bar's own camera, always inside THE LISTENER RULE (never right of BAR.hideX)
      roll = k.num('b.r', 0);
      cam = frameCamera(k.num('b.x', 815), k.num('b.y', 470), k.num('b.z', 1.25), v, 'bar', false, roll);
      frame.pivot.set(cam.x, cam.y);
      frame.position.set(960, 540);
      frame.scale.set(cam.zoom);
      frame.rotation = roll;
      set.blank = k.num('blank', 0);
      const tvMode = k.str('tv', '');
      const neonQ = clamp01(k.num('neon', 0));
      set.tvOff = tvMode === 'faro';
      set.neonOff = neonQ > 0.001;
      set.applause = clamp01(k.num('clap', 0));
      // a hiccup: the whole bar jumps one frame (the camera: every frame)
      const sh = st.sinceHic(m);
      if (sh < 1 / 12) k.cam.offset(0, -26);
      // everything DRAWN in the bar goes ON TWOS (restarting on the beat), the same steps the actors pose on
      const stp = k.beatStep(m);
      if (stp === lastDraw) {
        applyFilters(k);
        return;
      }
      lastDraw = stp;
      set.update(m, { kick });
      // ---- Espuma: polishes her glass, even now; she flinches at a hiccup and ducks the graffiti
      const gq = clamp01(k.num('graf', 0));
      if (espuma) perform(st, k, espuma, m, { x: BAR.espuma.x, y: BAR.espuma.y + gq * 60, flip: true, rot: 0.02 * Math.sin(m * 5.2), crouch: (sh < 0.2 ? 0.3 : 0) + gq * 0.4, look: 0.5, lean: -gq * 0.4, amp: 0.4 });
      // ---- Canelo performs (the score's 'can' key: drink, toast, slap, point, hush, shock, drowsy, slump)
      const G = gesture(m);
      const land = k.num('land', 1);
      const fall = 1 - easeOut(land);
      const hk = sh < 0.3 ? 1 - sh / 0.3 : 0;
      const x = BAR.canelo.x;
      const y = BAR.canelo.y - fall * 900 - hk * 30;
      if (can) {
        if (G.emote && can.puppet) can.puppet.emote(G.emote, 1);
        if (can.puppet) can.puppet.sleeping = false;
        if (after) perform(st, k, can, m, { x, y: BAR.canelo.y, flip: true, rot: -0.04, look: 0.4, amp: 0 });
        else
          perform(st, k, can, m, {
            x,
            y: y + (G.g === 'slump' ? 90 * easeInOut(G.t / 0.5) : 0),
            flip: true,
            rot: fall * -0.9 + (G.p.rot ?? 0),
            sy: 1 + hk * 0.12,
            sx: 1 - hk * 0.06,
            lean: G.p.lean,
            crouch: G.p.crouch,
            headA: G.p.headA,
            headDy: G.p.headDy,
            look: G.p.look,
          });
        canHead = headOf(can, H0);
      }
      // ---- the mug: full at the start (the trago goes on in the pint), empty at the end; the slam at ¡PUM!
      const pum = m - st.pumM;
      const lift = pum < 0 && pum > -0.35 ? easeOut((pum + 0.35) / 0.35) * 70 : 0;
      const end = lt > 0 && st.pumM - m < 2.2;
      const fill = end ? 0 : G.fill;
      // redrawn only when the beer level changes (its transform carries the motion)
      const fk = Math.round(fill * 40);
      if (fk !== mugKey) {
        mugKey = fk;
        mugG.clear();
        mug(mugG, -T.w / 2, -T.h / 2, T.w, T.h, { fill, foam: fill > 0.5 ? 1 : 0, side: 1 });
      }
      mugC.position.set(G.mugAt.x, G.mugAt.y - lift);
      mugC.rotation = G.mugAt.rot;
      const c = Math.cos(mugC.rotation);
      const s = Math.sin(mugC.rotation);
      mugQuad = [];
      for (const [qx, qy] of [[-T.w / 2, -T.h / 2], [T.w / 2, -T.h / 2], [T.w / 2, T.h / 2], [-T.w / 2, T.h / 2]] as [number, number][]) mugQuad.push(mugC.x + qx * c - qy * s, mugC.y + qx * s + qy * c);
      // ---- his arm (the rig has none): shoulder → paw; it rides his slump
      armG.clear();
      const end2 = after || end;
      const pumArm = pum > -0.35 && pum < 0.5;
      if (G.arm || pumArm) {
        const rot = G.p.rot ?? 0;
        const bx = BAR.canelo.x;
        const by = BAR.canelo.y + (G.g === 'slump' ? 90 * easeInOut(G.t / 0.5) : 0);
        const ox = S0[0] - bx;
        const oy = S0[1] - BAR.canelo.y;
        const sx0 = bx + ox * Math.cos(rot) - oy * Math.sin(rot);
        const sy0 = by + ox * Math.sin(rot) + oy * Math.cos(rot);
        if (pumArm) tvArm(armG, sx0, sy0, mugC.x - 52, mugC.y + 30, 44, 'mitt');
        else if (G.arm && !end2) tvArm(armG, sx0, sy0, G.arm.to[0], G.arm.to[1], G.arm.w ?? 44, G.arm.kind, G.arm.n ?? 3, 0xb0302a, G.arm.bend ?? 0);
      }
      // ---- on the counter: the newspaper, the napkin, the mug's wet ring (watercolor), the ink puddle
      counterG.clear();
      const paper = k.num('paper', 1);
      const soak = clamp01(k.num('soak', 0));
      if (paper > 0.01) {
        const q = OBJ.diario;
        counterG.poly(q).fill(lerp(1, 0.9, soak) > 0.95 ? SEPIA.paper : 0xd8c49a).stroke({ width: LW * 0.7, color: TV.line });
        for (let i = 0; i < 4; i++) counterG.rect(808 + i * 48, 712, 38, 4).fill({ color: SEPIA.ink, alpha: 0.6 });
        counterG.rect(806, 704, 150, 6).fill(SEPIA.ink);
        for (let i = 0; i < 6; i++) counterG.rect(800 + (i % 3) * 66, 724 + Math.floor(i / 3) * 10, 56, 3).fill({ color: SEPIA.ink, alpha: 0.35 });
        if (soak > 0.01) counterG.ellipse(900, 726, 120 * soak, 18 * soak).fill({ color: TV.foam, alpha: 0.7 });
      }
      const pd = clamp01(k.num('pageDrop', 0));
      if (pd > 0.001) {
        // c17: the blank page from the lie floats down onto the counter in front of him
        const y = lerp(380, 0, pd);
        const sw = Math.sin(pd * 9) * (1 - pd) * 60;
        const fl = lerp(1, 0.25, easeIn(pd));
        counterG.poly([960 + sw, 690 - y - 70 * fl, 1110 + sw, 690 - y - 70 * fl, 1126 + sw, 742 - y, 944 + sw, 742 - y]).fill(TV.white).stroke({ width: LW * 0.7, color: TV.line });
      }
      const nap = clamp01(k.num('napkin', 0));
      if (nap > 0.01) counterG.poly(OBJ.napkin).fill({ color: TV.white, alpha: nap }).stroke({ width: LW * 0.7, color: TV.line, alpha: nap });
      set.plate.visible = nap < 0.01;
      const ring = clamp01(k.num('ring', 0));
      if (ring > 0.001) {
        // the mug's wet ring bleeds into watercolor (blue, rose, green blots that keep spreading)
        const R = 70 + ring * 120;
        counterG.ellipse(1321, 702, 74, 12).stroke({ width: 5, color: 0x8ab4e0, alpha: 0.8 });
        const cols = [0x8ab4e0, 0xe07a5a, 0x8ac87a, 0x5a8ac8];
        for (let i = 0; i < 9; i++) counterG.ellipse(1321 + Math.cos(i * 2.1) * R * 0.6, 702 + Math.sin(i * 2.1) * R * 0.08, R * (0.5 + rnd(i) * 0.4), R * 0.1).fill({ color: cols[i % 4], alpha: 0.16 * ring });
      }
      // ---- INK invades the bar (c19.5–20), SUMI-E with a preparation, a development and an exit (§2.2):
      //   PREP (ink 0 → 0.2): a black drop falls into his spilled beer; it splashes; the amber blooms black
      //   DEVELOP (0.2 → 1): brush strokes run along the counter, drip over its edge, sweep up the wall (never over a
      //     face), splatter; the Bibliotecario forms out of strands of it
      //   EXIT (1 → 0, before the page turns): the strokes draw back into the puddle and the bar's color returns
      const ink = clamp01(k.num('ink', 0));
      wall.clear();
      wallFx.clear();
      if (ink > 0.001) {
        const O: [number, number] = [1150, 722];
        const prep = clamp01(ink / 0.2);
        const dev = clamp01((ink - 0.2) / 0.8);
        // the spilled beer (amber), blooming black from the center
        counterG.ellipse(O[0], O[1], 120, 16).fill({ color: TV.amber, alpha: 0.85 * (1 - dev) });
        if (prep > 0.5) counterG.ellipse(O[0], O[1], 120 * clamp01((prep - 0.5) * 2), 16 * clamp01((prep - 0.5) * 2)).fill({ color: 0x15131c, alpha: 0.92 });
        // the drop, falling out of the top of the frame (the card it came from), and its crown
        if (prep < 0.6) {
          const dy = lerp(160, O[1] - 8, easeIn(prep / 0.6));
          counterG.moveTo(O[0], dy - 110).lineTo(O[0], dy - 20).stroke({ width: 6, color: 0x15131c, alpha: 0.35, cap: 'round' });
          inkDrop(counterG, O[0], dy, 24, 0, -1);
        } else if (prep < 1 || dev < 0.2) {
          const sq = clamp01((prep - 0.6) / 0.4 + dev);
          for (let i = 0; i < 9; i++) {
            const an = Math.PI + (i / 8) * Math.PI;
            inkDrop(counterG, O[0] + Math.cos(an) * 90 * sq, O[1] - 10 + Math.sin(an) * 70 * sq + sq * sq * 60, 7 * (1 - sq * 0.5), Math.cos(an), Math.sin(an));
          }
        }
        if (dev > 0) {
          // strokes along the counter, from the puddle to the left (value variation, dry tails, wet sheen)
          const C: [number, number, number, number, number][] = [
            [O[0] - 40, 712, 420, 32, 1],
            [O[0] - 10, 732, 560, 24, 2],
            [O[0] - 80, 744, 300, 18, 3],
          ];
          for (const [x, y, L, w, sd] of C) inkStroke(counterG, [x, y], [x - L * 0.3, y - 10], [x - L * 0.7, y + 8], [x - L, y - 2], w, easeOut(dev * 1.2 - sd * 0.06), sd * 31);
          // drips over the counter's front edge (tapered, a round bead at the end)
          for (let i = 0; i < 6; i++) {
            const dx = O[0] - 60 - i * 95;
            const d = clamp01(dev * 1.4 - i * 0.12);
            if (d <= 0) continue;
            const len = (30 + rnd(i) * 70) * d;
            counterG.poly([dx - 9, 760, dx + 9, 760, dx + 3, 760 + len, dx - 3, 760 + len]).fill(0x15131c);
            counterG.circle(dx, 760 + len, 6 + 3 * d).fill(0x15131c);
          }
          // up the wall: big swooshes from the counter (between Espuma and the taps; right of his head), splatter
          inkStroke(wall, [690, 690], [660, 520], [760, 380], [700, 220], 46, easeOut(dev * 1.1 - 0.15), 71);
          inkStroke(wall, [560, 690], [470, 600], [440, 430], [520, 250], 40, easeOut(dev * 1.1 - 0.2), 83);
          inkStroke(wall, [1420, 690], [1480, 560], [1440, 420], [1530, 300], 44, easeOut(dev * 1.1 - 0.25), 97);
          // a long horizontal swoosh across the top of the wall (over the shelves)
          inkStroke(wall, [1500, 420], [1250, 380], [800, 450], [430, 400], 22, easeOut(dev * 1.2 - 0.35), 131);
          for (let i = 0; i < 12; i++) {
            const t = rnd(i + 5);
            const sx = i % 2 ? lerp(600, 820, t) : lerp(1400, 1560, t);
            const sy = 640 - rnd(i + 9) * 380 * dev;
            if (dev > 0.3 + rnd(i) * 0.5) inkDrop(wall, sx, sy, 4 + rnd(i + 2) * 7, rnd(i + 3) - 0.5, 1);
          }
          // the Bibliotecario forms out of it: strands rise from the counter into him
          for (let j = 0; j < 3; j++) inkStroke(wall, [740 + j * 30, 700], [700 + j * 40, 640], [800 - j * 30, 560], [760 + j * 10, 470], 12, clamp01(dev * 1.6 - 0.35 - j * 0.1) * (1 - clamp01((dev - 0.85) / 0.15) * 0.6), 113 + j);
        }
      }
      shh.visible = ink > 0.5;
      shh.alpha = clamp01((ink - 0.5) / 0.2);
      inkF.enabled = ink > 0.001;
      if (inkF.enabled) inkMatrix(inkF, ink * 0.92);
      if (biblio) {
        const rise = easeOut(clamp01((ink - 0.45) / 0.45));
        biblio.visible = rise > 0.01;
        // he is made of the ink he rises out of (sumi-e), like the bar around him
        perform(st, k, biblio, m, { x: 760, y: 900 - rise * 140, flip: true, lean: 0.2 * Math.sin(m * 2), headA: -0.1, look: 0.6, alpha: rise, amp: 0.3 });
      }
      // ---- GRAFFITI invades the bar (c29): the bathroom door is sprayed, the comic dots spread, Brecha leans out
      grafMask.clear();
      graf.visible = gq > 0.001;
      doorG.clear();
      for (const [i, t] of tags.entries()) t.visible = gq > 0.35 + i * 0.18;
      if (gq > 0.001) {
        grafMask.rect(-640, 360, 420 * clamp01(gq / 0.5), 240).fill(0xffffff);
        // drips under the letters
        for (let i = 0; i < 8; i++) wallFx.roundRect(-600 + i * 44, 520, 9, 20 + clamp01((gq - 0.4) / 0.6) * (60 + rnd(i) * 120), 4).fill(0x00e5ff);
        // Ben-Day dots spreading from the door
        const R = clamp01((gq - 0.2) / 0.8) * 1100;
        dots.visible = R > 1;
        dotsMask.clear();
        if (R > 1) dotsMask.circle(-435, 420, R).fill(0xffffff);
        // the door cracks open: the dark gap, the leaf swinging
        const open = easeOutBack(clamp01((gq - 0.3) / 0.25), 1.6);
        if (open > 0.01) {
          doorG.rect(-560, 160, 250, 520).fill(0x120a1e);
          const w = 250 * (1 - open * 0.7);
          doorG.poly([-560, 160, -560 + w, 160 - open * 30, -560 + w, 680 + open * 30, -560, 680]).fill(TV.pink).stroke({ width: LW, color: TV.line });
        }
        if (brecha) {
          brecha.visible = open > 0.05;
          perform(st, k, brecha, m, { x: -380, y: 720, flip: false, lean: 0.5 * open, look: 0.8, headA: 0.08 * Math.sin(m * 6), alpha: clamp01(open * 2), amp: 0.6 });
        }
        // the crack across the door
        if (gq > 0.75) {
          const cq = clamp01((gq - 0.75) / 0.25);
          const pts = [-440, 170, -470, 300, -420, 420, -480, 560, -430, 670];
          wallFx.poly(pts.slice(0, Math.max(4, Math.round((pts.length * cq) / 2) * 2)), false).stroke({ width: 7, color: TV.line });
        }
      } else {
        if (brecha) brecha.visible = false;
        dots.visible = false;
      }
      // ---- the BOARD: the blank page slaps on it, the chalk writes REGISTRO 000, the hats write F·O·L·I·O; the log
      const [bm, b0] = st.keyAt(k, 'board', m, 'tally');
      const bt = m - b0;
      topG.clear();
      chalk.visible = sig.visible = false;
      for (const f of folio) f.visible = false;
      if (bm === 'page') {
        // it comes off the counter (from his side) and slaps on the board
        const fly = easeOut(bt / 0.25);
        const px = lerp(900, 250, fly);
        const py = lerp(560, 112, fly);
        const sq = bt > 0.25 && bt < 0.4 ? 1 - Math.abs((bt - 0.32) / 0.08) : 0;
        topG.roundRect(px - 110 * (1 + sq * 0.1), py - 66 * (1 - sq * 0.12), 220 * (1 + sq * 0.1), 132 * (1 - sq * 0.12), 6).fill(TV.white).stroke({ width: 4, color: TV.line });
        chalk.visible = bt > 0.3;
        chalk.position.set(250, 86);
        chalkMask.clear().rect(150, 60, 200 * clamp01((bt - 0.3) / 0.5), 60).fill(0xffffff);
        const nOn = st.folios.filter((t) => t <= m + 1e-6).length;
        folio.forEach((f, i) => {
          f.visible = i < nOn;
          f.position.set(186 + i * 32, 140);
          f.scale.set(1 + (1 - easeOut((m - (st.folios[i] ?? m)) / 0.1)) * 0.6);
        });
      } else if (bm === 'log') {
        // the tallies line up into the logbook's ruled lines; your signature appears in another hand
        const q = easeInOut(bt / 0.5);
        topG.roundRect(104, 44, 292, 142, 4).fill({ color: 0xf6efe0, alpha: q });
        for (let i = 0; i < 5; i++) topG.rect(120, 70 + i * 22, 260, 3).fill({ color: 0x8fb0e0, alpha: q });
        sig.visible = bt > 0.35;
        sig.alpha = clamp01((bt - 0.35) / 0.2);
        sig.position.set(300, 150);
        sig.rotation = -0.06;
      }
      // ---- the NEON bends into the galleon (c23)
      if (neonQ > 0.001) {
        const pts = neonPts(neonQ);
        const buzz = 0.85 + 0.15 * Math.sin(m * 23);
        topG.poly(pts).stroke({ width: 22, color: TV.neonPink, alpha: 0.35 * buzz });
        topG.poly(pts).stroke({ width: 6, color: 0xffd0e6, alpha: buzz });
        if (neonQ > 0.4) {
          const mq = clamp01((neonQ - 0.4) / 0.6);
          // masts and sails grow out of the tube
          topG.moveTo(70, 360).lineTo(70, 360 - 120 * mq).stroke({ width: 6, color: 0xffd0e6 });
          topG.poly([74, 360 - 112 * mq, 74, 352, 74 + 70 * mq, 348]).stroke({ width: 6, color: 0x58d0ff });
          topG.moveTo(120, 360).lineTo(120, 360 - 80 * mq).stroke({ width: 6, color: 0xffd0e6 });
        }
      }
      // ---- the TV shows your lighthouse at night; its beam goes OUT of the screen, out of the bar (the kick cut)
      // the lights go down on the bar — not on him: the wall behind him (under the cast) and the counter in front
      const dark = clamp01(k.num('dark', 0));
      if (dark > 0.001) {
        wall.rect(BAR.left, BAR.top, BAR.hideX - BAR.left, BAR.counterBack + 80 - BAR.top).fill({ color: 0x070a1e, alpha: dark * 0.72 });
        counterG.rect(BAR.left, BAR.counterBack - 4, BAR.hideX - BAR.left, BAR.floor - BAR.counterBack + 4).fill({ color: 0x070a1e, alpha: dark * 0.72 });
      }
      if (tvMode === 'faro') {
        topG.roundRect(1196, 86, 198, 138, 12).fill(0x0b1030);
        for (let i = 0; i < 12; i++) twinkle(topG, 1210 + rnd(i) * 170, 96 + rnd(i + 3) * 60, 3, TV.cream, 0.8);
        topG.ellipse(1295, 214, 80, 14).fill(0x2a3a60);
        topG.poly([1286, 210, 1290, 150, 1304, 150, 1308, 210]).fill(TV.cream).stroke({ width: 3, color: TV.line });
        topG.rect(1288, 140, 18, 12).fill(TV.amberL);
        // the beam: out of the screen, across the wall, up through the ceiling
        topG.poly([1297, 146, 700, -60, 980, -60]).fill({ color: TV.amberL, alpha: 0.42 });
        topG.poly([1297, 146, 790, -60, 900, -60]).fill({ color: 0xffffff, alpha: 0.4 });
        glow(topG, 1297, 146, 90, TV.amberL, 0.5);
        // his face lit by it (the TV's cold light on the near side)
        glow(topG, canHead[0] + 30, canHead[1], 150, 0x9fe8ff, 0.32);
      }
      applyFilters(k);
    },
    anchor(name, k) {
      if (name === 'canelo') return toScreen(canHead[0], canHead[1]);
      if (name === 'tarro') return toScreen(mugQuad[6] ?? T.x, mugQuad[7] ?? T.y + T.h);
      // the rim of his raised mug (¡SALUD!: the clink and the foam burst start there)
      if (name === 'clink') return toScreen(mugQuad[2] ?? T.x + T.w, mugQuad[3] ?? T.y);
      if (name === 'center') return toScreen(cam.x, cam.y + 80);
      return null;
    },
    portal(obj) {
      const q = obj === 'tarro' ? mugQuad : OBJ[obj];
      if (!q || q.length < 8) return null;
      // world px (the scene root sits at the origin): the stage draws the doorway in the world layer
      return quadToScreen(q);
    },
    rim: (obj) => RIM[obj] ?? TV.amberL,
    prewarm(k) {
      // the filters compile now (not on the beat)
      frame.filters = [bulge];
      set.back.filters = [inkF];
      inkMatrix(inkF, 0.5);
      void k;
    },
    destroy: () => set.destroy(),
  };
};

// ================================================================== PINT — inside the mug (c2.875–c9)
/**
 * A world of its own (local px): the beer's surface — the foam — at y 500; above it the inside of the glass and, looking
 * down into his mug, Canelo's giant face (SCALE: a tiny raft in a giant mug); below, the beer: bubbles that rise like
 * stars in three depths, shafts of light. The scene's own camera dives (deep → the surface → the raft → the box).
 */
const pint: Make = (st, k) => {
  const root = new Container();
  // beyond the glass (screen space): the dark of the bar, and HIS GIANT FACE looking into his mug
  const far = new Graphics();
  const faceC = new Container();
  const face = st.actor('tv', st.slugs.canelo, 1500);
  if (face) faceC.addChild(face);
  const faceMask = new Graphics();
  faceC.addChild(faceMask);
  faceC.mask = faceMask;
  // refraction streaks over him (the curved glass catching the light)
  const streaks = new Graphics();
  for (let i = 0; i < 6; i++) streaks.rect(-1600, 80 + i * 170 + (i % 2) * 40, 5120, 10 + (i % 3) * 8).fill({ color: 0xffffff, alpha: 0.1 });
  root.addChild(far, faceC, streaks);
  const view = new Container();
  root.addChild(view);
  const back = new Graphics();
  // the beer (bands of amber, darker below: seen through, the face behind it reads as a shape beyond the glass) and,
  // above the surface, the inside of the glass
  // (a thin amber wash over the bright beer behind: the face beyond the glass stays crisp, only warmed)
  for (const [i, c] of [0xffc84a, 0xf8b23a, 0xf4a62a, 0xe08f22, 0xc9771a, 0xa85c16].entries()) back.rect(-1600, 500 + i * 284, 5120, 285).fill({ color: c, alpha: 0.3 + i * 0.07 });
  back.rect(-1600, -1400, 5120, 1900).fill({ color: 0xfff0c8, alpha: 0.12 });
  for (let i = 0; i < 7; i++) glow(back, 120 + i * 300, -200 + (i % 2) * 140, 220, [TV.amberL, TV.pink, TV.green][i % 3], 0.4);
  // the light from above, pouring through the foam (the raft is a silhouette against it)
  glow(back, 1010, 470, 520, 0xfff6d8, 0.75, 7);
  const rays = new Graphics();
  const farB = new Graphics();
  const midB = new Graphics();
  const foam = new Graphics();
  const raft = new Container();
  const raftG = new Graphics();
  raft.addChild(raftG);
  const baby = st.actor('tv', st.slugs.baby, 120);
  if (baby?.puppet) baby.puppet.sleeping = true;
  if (baby) raft.addChild(baby);
  const boxFront = new Graphics();
  const zzz = new Graphics();
  raft.addChild(boxFront, zzz);
  // the bubble tiles (two copies stacked so they wrap), under the surface only
  const bubC = new Container();
  bubC.addChild(farB, midB);
  const bubMask = new Graphics().rect(-1600, 540, 5120, 1700).fill(0xffffff);
  bubC.addChild(bubMask);
  bubC.mask = bubMask;
  for (const off of [0, 1600]) {
    for (let i = 0; i < Math.round(46 * k.density); i++) {
      const x = -200 + rnd(i + 7) * 2320;
      const y = 540 + rnd(i + 3) * 1600 + off;
      if (i % 3 === 0) twinkle(farB, x, y, 6 + rnd(i) * 5, TV.white, 0.95);
      else farB.circle(x, y, 3 + rnd(i + 11) * 3).fill({ color: TV.white, alpha: 0.75 });
    }
    for (let i = 0; i < Math.round(26 * k.density); i++) {
      const x = -100 + rnd(i + 47) * 2120;
      const y = 540 + rnd(i + 43) * 1600 + off;
      const r = 9 + rnd(i + 51) * 12;
      // clear bubbles (a bright rim, a highlight) and the brightest of them turned to stars
      if (i % 3 === 0) {
        glow(midB, x, y, r * 2.4, TV.white, 0.5, 3);
        twinkle(midB, x, y, r * 2, TV.white, 1);
      } else {
        midB.circle(x, y, r).fill({ color: 0xfff6e0, alpha: 0.35 }).stroke({ width: 3, color: TV.white, alpha: 0.95 });
        midB.circle(x - r * 0.35, y - r * 0.35, r * 0.28).fill({ color: TV.white, alpha: 0.95 });
      }
    }
  }
  view.addChild(back, rays, bubC, foam, raft);
  let lastStep = -1;
  // in front of the camera: the near bubbles (big, soft), the glass walls, the murk of the closed filter
  const near = new Graphics();
  for (const off of [0, 1800]) {
    for (let i = 0; i < Math.round(9 * k.density); i++) {
      const x = rnd(i + 97) * 2400;
      const y = rnd(i + 93) * 1800 + off;
      const r = 40 + rnd(i + 99) * 50;
      near.circle(x, y, r).fill({ color: TV.foam, alpha: 0.16 }).stroke({ width: 4, color: TV.foam, alpha: 0.3 });
    }
  }
  const glass = new Graphics();
  const murk = new Graphics();
  root.addChild(near, glass, murk);
  const RAFT = { x: 1010, y: 470 };
  // where his near eye is on the face actor (local px): the face is placed so that eye lands where we want it
  const eyeLocal = (() => {
    const rig = face?.puppet?.brain.model?.rig;
    const [W, H] = st.studios.tv.size(st.slugs.canelo);
    const e = rig?.eyes?.[0];
    const s = 1500 / H;
    if (!e) return [0, -1100];
    return [-((e[0] + e[2]) / 2 - 0.5 * W) * s, ((e[1] + e[3]) / 2 - 0.97 * H) * s];
  })();
  // the scene's camera (local): deep → up to the surface (c4.75–c5) → the raft (c7) → into the box (c8.75)
  const camAt = (m: number) => {
    const up = easeInOut(win(m, 5.2, 5.9));
    const push = easeOut(win(m, 8.727, 9.5));
    const dive = easeIn(win(m, 11.273, 11.636));
    const y = lerp(lerp(980, 380, up), RAFT.y - 100, push);
    const x = lerp(960, RAFT.x + 60, push);
    const z = lerp(1, 2.3, push) * (1 + dive * 1.6);
    return { x, y, z, up, push };
  };
  let headScr: [number, number] = [1100, 300];
  return {
    root,
    update(k, m, lt) {
      const c = camAt(m);
      view.pivot.set(c.x, c.y);
      view.position.set(960, 540);
      view.scale.set(c.z);
      const v = k.view;
      // his giant face beyond the glass: deep down, his eye at the left wall; at the surface he looks DOWN into the
      // mug from above (a tiny raft, a giant eye); at the box he fades back (the baby is what we must read)
      far.clear();
      for (let i = 0; i < 5; i++) far.rect(v.x - 20, v.y - 20 + (i * (v.h + 40)) / 5, v.w + 40, (v.h + 40) / 5 + 1).fill([0xffe08a, 0xffd06a, 0xffbf4a, 0xf4a62a, 0xe08f22][i]);
      if (face) {
        const ex = lerp(v.x + 330, 1330, c.up);
        const ey = lerp(420, 150, c.up);
        const p = face.puppet?.pose;
        if (p) {
          p.look = lerp(0.6, -0.3, c.up);
          p.headA = 0.04 * Math.sin(m * 0.8);
        }
        const sc = lerp(1, 0.8, c.up);
        const swimA = k.reduceMotion ? 0 : Math.sin(Math.floor(m * 12) / 12 * 1.7) * 0.025;
        face.pose(m, ex - eyeLocal[0] * sc, ey - eyeLocal[1] * sc, { flip: true, sx: sc * (1.1 + swimA), sy: sc * (0.95 - swimA * 0.5), rot: lerp(0.15, -0.12, c.up), step: Math.floor(m * 12) });
        faceC.alpha = lerp(1, 0.5, c.push);
        if (face.puppet) face.puppet.tint = 0xffe6b8;
        // the glass refracts him WITHOUT a filter (pose above: the curved glass widens him and he swims a little; a
        // filter on this masked, ever-resizing container allocated a new render texture every frame through the
        // doorway — QA's 0.7 s freeze on the cut into the mug)
        // up at the surface he is OUTSIDE, above the mug: nothing of him below the foam line
        const foamY = 540 + (500 - c.y) * c.z;
        faceMask.clear().rect(v.x - 20, v.y - 20, v.w + 40, lerp(v.h + 40, foamY - v.y + 30, c.up)).fill(0xffffff);
        if (face.puppet && m > 8.727) face.puppet.emote('sleepy', 0.35);
      }
      // the bubbles rise like stars, three depths, each a tile drawn ONCE that scrolls up (no per-frame drawing)
      farB.y = -((m * 90) % 1600);
      midB.y = -((m * 240) % 1600);
      near.y = -((m * 560) % 1800);
      near.x = v.x;
      // shafts of light and the foam boil ON TWOS (the house style; and no geometry rebuilt every frame)
      const step = Math.floor(m * 12);
      if (step !== lastStep) {
        lastStep = step;
        const mt = step / 12;
        rays.clear();
        for (let i = 0; i < 6; i++) {
          const x = 160 + i * 330 + Math.sin(mt * 0.7 + i) * 40;
          rays.poly([x - 40, 520, x + 40, 520, x + 260, 2000, x + 60, 2000]).fill({ color: 0xffe2a0, alpha: 0.08 });
        }
        // the foam (the beer's surface): a band of blobs that curls into waves (c4.75)
        foam.clear();
        const wv = k.num('foamWave', 0);
        // the outer contour of the foam reads as one line: every blob stroked first, then all filled over it
        const blobs: [number, number][] = [];
        for (let i = -8; i < 30; i++) blobs.push([i * 90, 500 + Math.sin(i * 1.7) * 14 - wv * Math.sin(mt * 3 + i * 0.9) * 34]);
        for (const [x, y] of blobs) foam.circle(x, y, 66).stroke({ width: LW * 2, color: TV.line });
        foam.rect(-1600, 500, 5120, 46).fill(TV.foam);
        for (const [x, y] of blobs) foam.circle(x, y, 66).fill(TV.foam);
        for (const [x, y] of blobs) foam.circle(x - 18, y - 26, 16).fill({ color: TV.white, alpha: 0.9 });
        if (wv > 0.01) for (let i = -8; i < 30; i += 2) {
          // the crests rise and curl: a foam crest with its outline and a curl drawn into it
          const x = i * 90 + ((mt * 80) % 180);
          const h = (30 + 26 * wv) * wv;
          foam.circle(x, 466 - h, 34).stroke({ width: LW * 2, color: TV.line });
          foam.circle(x, 466 - h, 34).fill(TV.foam);
          foam.circle(x + 30, 470 - h * 0.6, 18).fill(TV.foam).stroke({ width: LW, color: TV.line });
          foam.moveTo(x - 2 + Math.cos(Math.PI * 0.9) * 16, 468 - h + Math.sin(Math.PI * 0.9) * 16).arc(x - 2, 468 - h, 16, Math.PI * 0.9, Math.PI * 2.1).stroke({ width: 4, color: TV.amberD });
        }
        foam.moveTo(-1600, 546).lineTo(3520, 546).stroke({ width: LW, color: TV.line, alpha: 0.5 });
      }
      // the raft (TINY in a giant mug), the palm and the box with baby Canelo
      const r = k.num('raft', 0);
      const p = k.num('palm', 0);
      raft.visible = r > 0.01;
      raftG.clear();
      zzz.clear();
      boxFront.clear();
      if (raft.visible) {
        const shake = m > 11.273 ? Math.sin(m * 60) * 4 : 0;
        raft.position.set(RAFT.x + shake, RAFT.y + Math.sin(m * 2.4) * 6);
        raft.scale.set(r * lerp(2.3, 1.5, c.push));
        raft.rotation = Math.sin(m * 1.7) * 0.05;
        // backlit by the light pouring through the foam: a readable silhouette, the logs dark with a warm rim
        glow(raftG, 0, -40, 230, 0xfff6d8, 0.55, 4);
        for (let i = 0; i < 5; i++) raftG.roundRect(-110 + i * 44, -18, 40, 36, 6).fill(TV.woodD).stroke({ width: 5, color: TV.line });
        raftG.rect(-110, -20, 216, 5).fill({ color: TV.amberL, alpha: 0.9 });
        if (p < 0.01) {
          // a bare mast with a rag (before the palm sprouts)
          raftG.moveTo(-60, -16).lineTo(-60, -120).stroke({ width: 8, color: TV.line });
          raftG.poly([-56, -116, -56, -60, -10, -70]).fill(TV.cream).stroke({ width: 4, color: TV.line });
        }
        if (p > 0.01) {
          raftG.moveTo(-70, -10).bezierCurveTo(-90, -120 * p, -60, -200 * p, -30, -230 * p).stroke({ width: 14, color: TV.woodD });
          for (let j = 0; j < 5; j++) {
            const an = -Math.PI / 2 + (j - 2) * 0.55;
            raftG.moveTo(-30, -230 * p).quadraticCurveTo(-30 + Math.cos(an) * 60 * p, -230 * p + Math.sin(an) * 70 * p - 20, -30 + Math.cos(an) * 110 * p, -230 * p + Math.sin(an) * 50 * p + 30).stroke({ width: 12, color: TV.green, cap: 'round' });
          }
          raftG.rect(10, -96 * p, 104, 82 * p).fill(0x9a6a3a).stroke({ width: 4, color: TV.line });
          // the front of the box, over him (he sleeps IN it), and its open flaps
          boxFront.rect(6, -52 * p, 112, 40 * p).fill(0xc9925a).stroke({ width: 4, color: TV.line });
          boxFront.poly([6, -52 * p, -16, -80 * p, 30, -84 * p, 40, -52 * p]).fill(0xd8a46a).stroke({ width: 3, color: TV.line });
          boxFront.poly([118, -52 * p, 140, -78 * p, 96, -84 * p, 86, -52 * p]).fill(0xd8a46a).stroke({ width: 3, color: TV.line });
        }
        if (baby) {
          baby.visible = p > 0.5;
          const br = 1 + Math.sin(m * 2.2) * 0.04;
          baby.pose(m, 62, -30, { sx: 0.9 * br, sy: 0.9 / br, step: Math.floor(m * 12) });
          // Zzz (the box is his whole world: he sleeps) — from the raft already, before the box sprouts
          if (r > 0.5) for (let j = 0; j < 3; j++) {
            const zt = (m * 0.6 + j / 3) % 1;
            const zs = 7 + zt * 6;
            const zx = 90 + zt * 30;
            const zy = -120 - zt * 80;
            zzz.moveTo(zx - zs, zy - zs).lineTo(zx + zs, zy - zs).lineTo(zx - zs, zy + zs).lineTo(zx + zs, zy + zs).stroke({ width: 5, color: TV.line, alpha: 1 - zt, join: 'round' });
          }
        }
      }
      // the glass walls (in front: curved highlights, the refraction band), on the screen
      glass.clear();
      glass.ellipse(v.x - 140, 540, 320, 920).stroke({ width: 46, color: 0xffe0a0, alpha: 0.22 });
      glass.ellipse(v.x + v.w + 140, 540, 320, 920).stroke({ width: 46, color: 0xffe0a0, alpha: 0.22 });
      glass.rect(v.x + 70, v.y, 18, v.h).fill({ color: 0xffffff, alpha: 0.12 });
      // the synth's sweep: the beer is murky at first and clears as the filter opens (238 Hz → 9 kHz)
      murk.clear();
      const sw = k.num('sweep', 0);
      const a = (1 - sw) * 0.3;
      if (a > 0.01) murk.rect(v.x - 20, v.y - 20, v.w + 40, v.h + 40).fill({ color: 0x3a1a04, alpha: a });
      const hx = RAFT.x + 90;
      const hy = RAFT.y - 130;
      headScr = [960 + (hx - c.x) * c.z, 540 + (hy - c.y) * c.z];
      void lt;
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, headScr[0], headScr[1]);
      if (name === 'center') return [960, 820];
      return null;
    },

  };
};

// ================================================================== DIARIO — Parte I on the front pages (c9.5–c16)
const HEADLINES = [
  'UNA MUERTA DESPIERTA A UN GATO',
  '¡UN PATO PIRATA ATACA UNA BALSA!',
  'EL CAPITÁN BIGOTES ROTOS, HUNDIDO',
  'LA GÁRGOLA RONRONEA  /  KRAKEN ABRAZA BARCO',
  'EL ARCANISTA ROBA PÁGINAS DEL ARCHIVO',
  'CAE UNA ESTRELLA: «ALGO ME EMPUJÓ»',
  'EL LEVIATÁN Y LA NIEBLA: «YO NO DESTRUYO: BORRO»',
];
const PW = 1120;
const PH = 760;
/** where Canelo's cut-out lands in each photo (page px) and how he reacts to who's in it */
const CUT_AT: [number, number][] = [
  [470, 700],
  [560, 700],
  [200, 700],
  [560, 700],
  [200, 700],
  [210, 700],
  [520, 700],
];
const CUT_POSE: Keyed[] = [
  { headA: 0.12, crouch: 0.3, look: -0.6 }, // woken by a ghost: yawning, half up
  { crouch: 0.55, lean: 0.4, look: 0.8, sx: 0.95, sy: 0.9 }, // a duck pirate: ducking
  { lean: -0.4, sy: 1.1, headA: -0.15, look: 0.5 }, // Bigotes sunk: chest out
  { sx: 0.84, sy: 1.12, headA: 0.1, look: 0.9 }, // hugged by a kraken
  { lean: 0.6, look: 0.9, headA: 0.05 }, // the thief: lunging
  { headA: -0.2, headDy: -8, look: 0.4 }, // a falling star: looking up
  { crouch: 0.2, look: -0.3, headA: 0.08 }, // the fog: fading
];
function buildPage(st: DrunckStage, k: Kit, n: number, sepia: ColorMatrixFilter): { c: Container; who: (Actor | null)[] } {
  const c = new Container();
  c.pivot.set(PW / 2, PH / 2);
  const g = new Graphics();
  card(g, 0, 0, PW, PH, SEPIA.paper, 4, SEPIA.ink);
  g.rect(40, 118, PW - 80, 5).fill(SEPIA.ink).rect(40, 128, PW - 80, 2).fill(SEPIA.ink);
  c.addChild(g);
  const mast = txt(k, 'El Diario del Mar', { fontFamily: 'UnifrakturMaguntia', fontSize: 92, fill: SEPIA.ink }, 0.5, 0);
  mast.position.set(PW / 2, 16);
  const kick = txt(k, '¡EXTRA!', { fontFamily: 'Anton', fontSize: 50, fill: SEPIA.red, letterSpacing: 3 }, 0.5, 0);
  kick.position.set(PW / 2, 140);
  const head = txt(k, HEADLINES[n], { fontFamily: 'Anton', fontSize: 64, fill: SEPIA.ink, align: 'center', wordWrap: true, wordWrapWidth: PW - 100, lineHeight: 68 }, 0.5, 0);
  head.position.set(PW / 2, 196);
  if (head.height > 150) head.scale.set(150 / head.height);
  c.addChild(mast, kick, head);
  // the photo (an engraving, ANIMATED: whoever the headline is about acts in it)
  const ph = new Container();
  ph.position.set(60, 370);
  const pg = new Graphics();
  pg.rect(0, 0, 640, 350).fill(0xe2cfa6).stroke({ width: 4, color: SEPIA.ink });
  for (let i = 0; i < 26; i++) pg.moveTo(0, 230 + i * 5).lineTo(640, 226 + i * 5 + Math.sin(i) * 3).stroke({ width: 2, color: SEPIA.mid, alpha: 0.5 });
  ph.addChild(pg);
  const eng = new Container();
  eng.filters = [sepia];
  ph.addChild(eng);
  const extra = new Graphics();
  if (n === 0) extra.rect(170, 240, 140, 100).fill(0xc9a46a).stroke({ width: 4, color: SEPIA.ink });
  else if (n === 1) for (let i = 0; i < 4; i++) extra.rect(330 + i * 40, 300, 36, 20).fill(0xb08a5a).stroke({ width: 3, color: SEPIA.ink });
  else if (n === 4) for (let i = 0; i < 6; i++) extra.rect(380 + rnd(i) * 200, 40 + rnd(i + 4) * 200, 50, 64).fill(SEPIA.paper).stroke({ width: 3, color: SEPIA.ink });
  else if (n === 5) {
    extra.rect(440, 20, 180, 120).fill(0x1a1612).stroke({ width: 4, color: SEPIA.ink });
    for (let i = 0; i < 60; i++) extra.rect(444 + rnd(i) * 170, 24 + rnd(i + 60) * 110, 6, 4).fill(i % 2 ? 0xd8d0c0 : 0x6a625a);
  } else if (n === 6) {
    extra.moveTo(40, 260).bezierCurveTo(160, 120, 320, 330, 470, 180).bezierCurveTo(540, 120, 590, 160, 600, 200).stroke({ width: 26, color: SEPIA.ink });
    for (let i = 0; i < 9; i++) extra.ellipse(60 + i * 70, 120 + rnd(i) * 80, 90, 34).fill({ color: 0xf0e6d0, alpha: 0.85 });
  }
  eng.addChild(extra);
  const who: Record<number, string[]> = { 0: [st.slugs.luzterna], 1: [st.slugs.patito], 2: [st.slugs.bigotes], 3: [st.slugs.gargola, st.slugs.kraken], 4: [st.slugs.arcanista], 5: [st.slugs.estrella], 6: [] };
  const actors = (who[n] ?? []).map((slug) => {
    const a = st.actor('sepia', slug, 300);
    if (a) eng.addChild(a);
    return a;
  });
  const mask = new Graphics().rect(0, 0, 640, 350).fill(0xffffff);
  ph.addChild(mask);
  ph.mask = mask;
  c.addChild(ph);
  // the columns of the article (fake text)
  const cols = new Graphics();
  for (let ci = 0; ci < 2; ci++) for (let ly = 0; ly < 330; ly += 16) cols.rect(730 + ci * 180, 372 + ly, 160 * (ly % 112 === 96 ? 0.5 : 0.9 + rnd(ly + ci) * 0.1), 6).fill({ color: SEPIA.ink, alpha: 0.35 });
  c.addChild(cols);
  return { c, who: actors };
}
const diario: Make = (st, k) => {
  const root = new Container();
  // the counter seen from above: warm wood planks, the lamp's light, the mug's wet rings (we are still at the bar)
  const wood = new Graphics();
  backdrop(wood, TV.woodD);
  for (let i = -6; i < 16; i++) wood.rect(-600, i * 96, 3200, 90).fill(i % 2 ? TV.wood : 0xa86038).rect(-600, i * 96 + 88, 3200, 8).fill(TV.woodD);
  for (let i = 0; i < 26; i++) wood.moveTo(-400 + rnd(i) * 2600, rnd(i + 3) * 1080).lineTo(-400 + rnd(i) * 2600 + 200, rnd(i + 3) * 1080 + 4).stroke({ width: 3, color: TV.woodD, alpha: 0.7 });
  for (const [x, y, r] of [[1700, 220, 110], [260, 900, 90], [1620, 960, 120]] as [number, number, number][]) wood.ellipse(x, y, r, r * 0.9).stroke({ width: 10, color: 0x6e3820, alpha: 0.5 });
  const light = new Graphics();
  const pages = new Container();
  const stamps = new Container();
  const cutC = new Container();
  const tears = new Graphics();
  root.addChild(wood, light, pages, tears, cutC, stamps);
  const sepia = (() => {
    const f = new ColorMatrixFilter();
    f.sepia(false);
    f.contrast(0.2, true);
    return f;
  })();
  const built = Array.from({ length: 7 }, (_, n) => buildPage(st, k, n, sepia));
  for (const p of built) {
    p.c.visible = false;
    pages.addChild(p.c);
  }
  // Canelo, CUT OUT in cartoon with a white paper border — a living puppet, bigger than the photos: he jumps from one to
  // the next and tears his way out of each
  const border = st.silhouette('tv', st.slugs.canelo, 0.5, 0.97);
  const cut = st.actor('tv', st.slugs.canelo, 330);
  if (border) {
    border.tint = 0xffffff;
    cutC.addChild(border);
  }
  if (cut) cutC.addChild(cut);
  // ¡VISTO! stamps (one per ¡EXTRA!), stamped by his present paw
  const visto = Array.from({ length: 5 }, () => {
    const s = txt(k, '¡VISTO!', { fontFamily: 'Anton', fontSize: 80, fill: SEPIA.red, stroke: { color: SEPIA.red, width: 2 }, letterSpacing: 6 });
    s.visible = false;
    stamps.addChild(s);
    return s;
  });
  const pawG = new Graphics();
  root.addChild(pawG);
  // c16: the black page — Nadie's lie. Its shadow follows the silhouette rule (docs/part-iii/13 §2.2, silueta.ts): it
  // comes out of the REAL painting (his outline, his pose, his acting), body in the page's ink (never pure black), a rim
  // from the lamp's side, his eyes lit, a halo that separates him from the black
  const blackPage = new Container();
  blackPage.pivot.set(PW / 2, PH / 2);
  const bp = new Graphics();
  blackPage.addChild(bp);
  const nolc = txt(k, 'NO ONE LIKES CATS.', { fontFamily: 'Anton', fontSize: 120, fill: 0xf4ecdc, letterSpacing: 2 });
  nolc.position.set(PW / 2, 140);
  const small = txt(k, '…Mentira.', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 34, fill: 0xb8b0a8 });
  small.position.set(PW / 2, PH - 50);
  blackPage.addChild(nolc, small);
  const nadieC = new Container();
  nadieC.pivot.set(PW / 2, PH / 2);
  const nadie = st.actor('sepia', st.slugs.nadie, 520);
  const nadieMask = new Graphics().rect(0, 0, PW, PH).fill(0xffffff);
  if (nadie) nadieC.addChild(nadie);
  nadieC.addChild(nadieMask);
  nadieC.mask = nadieMask;
  const shadow = nadie?.puppet
    ? new Silueta(nadie.puppet, { body: 0x2a2236, detail: 0.16, light: { dir: [-1, -0.35], color: 0xf4ecdc, width: 4.5, from: [1, -0.3] }, eyes: 'glow', eyeColor: 0xd8f4ff, halo: { color: 0x8a7f96, alpha: 0.6, spread: 40 } })
    : null;
  const halves = new Graphics();
  const mentira = txt(k, 'MENTIRA', { fontFamily: 'Anton', fontSize: 150, fill: 0xd8302a, stroke: { color: 0xd8302a, width: 3 }, letterSpacing: 10 });
  mentira.visible = false;
  // the blank page under the tear (Distraxia becomes a blank page: it floats into c17)
  const blank = new Graphics();
  blank.rect(-230, -300, 460, 600).fill(0xfbf8f0).stroke({ width: 5, color: 0xd8d0c0 });
  blank.visible = false;
  root.addChildAt(blank, root.getChildIndex(pages));
  pages.addChild(blackPage);
  root.addChild(halves, nadieC, mentira);
  const SPOT = (n: number): [number, number, number] => [960 + ((n * 37) % 5 - 2) * 18, 560 + ((n * 13) % 3 - 1) * 10, ((n * 7) % 5 - 2) * 0.03];
  /** a point of page n (page px) → scene px */
  const onPage = (n: number, px: number, py: number, x: number, y: number, r: number, s: number): [number, number] => {
    const dx = (px - PW / 2) * s;
    const dy = (py - PH / 2) * s;
    return [x + dx * Math.cos(r) - dy * Math.sin(r), y + dx * Math.sin(r) + dy * Math.cos(r)];
  };
  let cutHead: [number, number] = [400, 500];
  const B16 = 21.818;
  return {
    twos: true,
    root,
    // the silhouette's shader and its halo go back (the halo bake is shared and ref-counted)
    destroy: () => shadow?.destroy(),
    update(k, m) {
      const bass = k.env('bass', m, 0.2, 0.1);
      // the lamp's light pool on the counter: on the right; at c15.75 the light moves to the other side (the prep)
      const swing = easeInOut(win(m, B16 - 0.37, B16));
      light.clear();
      glow(light, lerp(1500, 360, swing), lerp(260, 300, swing), 900, TV.amberL, 0.35 + bass * 0.1, 6);
      // ---- the pages: the newest falls on its downbeat and lands with a slam; the one before stays under it
      let cur = -1;
      for (let i = 0; i < st.portadas.length; i++) if (st.portadas[i].m <= m + 1e-6) cur = i;
      for (const p of built) p.c.visible = false;
      for (const s of visto) s.visible = false;
      blackPage.visible = blank.visible = mentira.visible = false;
      tears.clear();
      pawG.clear();
      cutC.visible = false;
      if (cur < 0) return;
      const show = [cur - 1, cur].filter((i) => i >= 0);
      let curXY: [number, number, number, number] = [960, 560, 0, 0.92];
      for (const i of show) {
        const { m: m0, n } = st.portadas[i];
        if (n > 6) continue;
        const p = built[n];
        const t = m - m0;
        const [x, y, r] = SPOT(n);
        const fall = easeOut(t / 0.16);
        const ex = n - 2;
        const j = ex >= 0 && ex < 5 ? k.judged(`extra${ex}`) : null;
        const crooked = j && j.r === 'miss' && j.at <= m ? 0.16 : 0;
        p.c.visible = true;
        const land = t > 0.16 && t < 0.3 ? 1 - Math.abs((t - 0.23) / 0.07) : 0;
        const s = 0.92 * (1 + land * 0.03) * (i < cur ? 0.97 : 1);
        const pr = r + (1 - fall) * 0.5 * (n % 2 ? 1 : -1) + crooked;
        p.c.position.set(x, y - (1 - fall) * 900);
        p.c.rotation = pr;
        p.c.scale.set(s);
        if (i === cur) curXY = [x, y, pr, s];
        // the engraving acts on the beat
        p.who.forEach((a, wi) => {
          if (!a) return;
          const bx = p.who.length > 1 ? 180 + wi * 280 : n === 0 ? 250 : 400;
          const pose: Keyed = n === 1 ? { lean: 0.6, look: -0.8 } : n === 2 ? { rot: 0.35 + t * 0.05, crouch: 0.3 } : n === 3 ? { lean: wi ? -0.3 : 0.3, look: wi ? -0.6 : 0.6 } : n === 4 ? { lean: 0.5, look: 0.7 } : n === 5 ? { rot: -0.3, headA: 0.2 } : {};
          perform(st, k, a, m, { x: bx, y: 345 + (n === 5 ? -40 + t * 30 : 0), rot: pose.rot ?? 0, lean: pose.lean, crouch: pose.crouch, look: pose.look, headA: pose.headA, alpha: n === 0 ? 0.65 : 1, amp: 0.7 });
        });
        // a torn hole where his cut-out was (on the page under the newest; not once the lie's ink is in)
        if (i < cur && m < B16 - 0.36) {
          const [hx, hy] = onPage(n, 60 + CUT_AT[n][0] * 0.95, 370 + 160, x, y, pr, s);
          const hole: number[] = [];
          for (let q = 0; q < 12; q++) {
            const a = (q / 12) * Math.PI * 2;
            const rr = (q % 2 ? 70 : 96) * s * (0.85 + rnd(q + n) * 0.3);
            hole.push(hx + Math.cos(a) * rr * 0.8, hy + Math.sin(a) * rr * 1.25);
          }
          tears.poly(hole).fill(TV.woodD).stroke({ width: 4, color: SEPIA.ink });
        }
        // ¡VISTO!: his present paw stamps it (a good tap); a miss leaves the page crooked
        if (ex >= 0 && ex < 5 && j && j.r !== 'miss' && j.at <= m && i === cur) {
          const sv = visto[ex];
          const since = m - j.at;
          sv.visible = true;
          sv.position.set(x + 260, y + 240);
          sv.rotation = -0.2;
          sv.scale.set(1 + (1 - easeOut(since / 0.12)) * 0.6);
          if (since < 0.35) {
            const up = since < 0.08 ? 1 - since / 0.08 : easeIn((since - 0.08) / 0.27);
            tvArm(pawG, 1500, 1260, x + 300, y + 260 - up * 140, 64, 'stamp');
          }
        }
      }
      // ---- Canelo's cut-out: it leaps from the previous photo to the newest one, tearing out of it
      if (cut && cur >= 0 && st.portadas[cur].n <= 6) {
        cutC.visible = true;
        const nNow = st.portadas[cur].n;
        const t = m - st.portadas[cur].m;
        const [x, y, r, s] = curXY;
        const fall = easeOut(t / 0.16);
        const to = onPage(nNow, 60 + CUT_AT[nNow][0] * 0.95, 370 + 330, x, y - (1 - fall) * 900, r, s);
        let px = to[0];
        let py = to[1];
        let rot = r;
        let sx = 1;
        let sy = 1;
        if (cur > 0 && t < 0.32) {
          const prev = st.portadas[cur - 1];
          const [x0, y0, r0] = SPOT(prev.n);
          const from = onPage(prev.n, 60 + CUT_AT[prev.n][0] * 0.95, 370 + 330, x0, y0, r0, 0.92 * 0.97);
          const q = easeInOut(clamp01((t - 0.04) / 0.26));
          px = lerp(from[0], to[0], q);
          py = lerp(from[1], to[1], q) - bell(q) * 260;
          rot = lerp(r0, r, q) + (q < 1 ? Math.sin(q * Math.PI) * 0.6 * (nNow % 2 ? 1 : -1) : 0);
          // stretch in the air, squash on landing
          sx = q < 0.9 ? 0.88 : 1.12;
          sy = q < 0.9 ? 1.16 : 0.86;
          // paper shreds from the tear
          for (let q2 = 0; q2 < 8; q2++) {
            const a = rnd(q2 + cur) * Math.PI * 2;
            const d = t * 700;
            tears.rect(from[0] + Math.cos(a) * d, from[1] - 120 + Math.sin(a) * d * 0.6 + t * t * 900, 16, 10).fill(SEPIA.paper).stroke({ width: 2, color: SEPIA.ink });
          }
        }
        const pose = CUT_POSE[nNow] ?? {};
        cutC.position.set(px, py);
        cutC.rotation = rot;
        const flip = nNow % 2 === 1;
        if (border) {
          const bs = (330 / border.texture.height) * 1.07;
          border.scale.set((flip ? -bs : bs) * sx, bs * 1.04 * sy);
          border.position.set(0, 8);
        }
        perform(st, k, cut, m, { x: 0, y: 0, flip, sx: (pose.sx ?? 1) * sx, sy: (pose.sy ?? 1) * sy, lean: pose.lean, crouch: pose.crouch, headA: pose.headA, headDy: pose.headDy, look: pose.look, alpha: nNow === 6 ? 0.75 : 1 });
        const [hx, hy] = headOf(cut, [0, -250]);
        cutHead = [px + hx * Math.cos(rot) - hy * Math.sin(rot), py + hx * Math.sin(rot) + hy * Math.cos(rot)];
      }
      // ---- c16: the lie. PREP (c15.75): the lamp's light swings to the other side and the ink creeps in from the page's
      // edge, Nadie's shadow with it · DEVELOP (c16): the page is black, his shadow rises over it, rim-lit, eyes lit ·
      // EXIT (c16.5): his present paw stamps MENTIRA — the black page TEARS in two and the shadow dissolves into the
      // light, leaving a blank page (Distraxia's: «La hoja.»)
      const pre = win(m, B16 - 0.36, B16);
      nadieC.visible = false;
      halves.clear();
      if (pre > 0 && cur >= 0) {
        const [x, y, r, s] = curXY;
        const t16 = m - B16;
        const grow = easeOutBack(win(m, B16, B16 + 0.6), 1.2);
        const exit = win(m, B16 + 0.727, B16 + 1.15);
        const e = easeIn(exit);
        blackPage.visible = exit <= 0;
        blackPage.position.set(x, y);
        blackPage.rotation = r;
        blackPage.scale.set(s);
        bp.clear();
        const front = lerp(PW + 40, -60, easeIn(pre));
        bp.poly([front, 0, PW, 0, PW, PH, front - 40, PH, ...tearLine(front - 40, PH, front, 0, 8, 26, 3).slice(2, -2)]).fill(0x0e0b10);
        nolc.visible = small.visible = t16 > 0;
        nolc.alpha = clamp01(t16 / 0.12);
        nolc.scale.set(1 + (1 - clamp01(t16 / 0.12)) * 0.3);
        // the shadow: it comes in with the ink from the right edge (prep), rises and grows (develop), dissolves (exit)
        if (nadie) {
          nadieC.visible = true;
          nadieC.position.set(x, y);
          nadieC.rotation = r;
          nadieC.scale.set(s);
          nadieC.mask = exit > 0 ? null : nadieMask;
          nadieMask.visible = exit <= 0;
          const sc = lerp(0.62, 1.1, grow);
          perform(st, k, nadie, m, { x: PW / 2 + lerp(560, 40, easeOut(pre)), y: PH + 40, sx: sc, sy: sc, lean: 0.25 * grow, headA: -0.06 + 0.04 * Math.sin(m * 3), look: -0.5, amp: 0 });
          if (shadow) {
            shadow.k = clamp01(pre * 1.25);
            shadow.how = 'dissolve';
            shadow.out = exit;
            shadow.update(0);
          }
        }
        if (exit > 0) {
          // the black page in two halves, flying apart (their torn edges ragged), the blank page under them
          blank.visible = true;
          blank.position.set(x, y - e * 40);
          blank.rotation = r * 0.5 + Math.sin(m * 1.4) * 0.05;
          const line = tearLine(PW / 2 + 40, 0, PW / 2 - 30, PH, 10, 40, 16);
          for (const side of [-1, 1]) {
            const pts: number[] = side < 0 ? [0, 0] : [PW, 0];
            for (let q = 0; q < line.length; q += 2) pts.push(line[q], line[q + 1]);
            pts.push(side < 0 ? 0 : PW, PH);
            const ang = r + side * e * 0.5;
            const ox = x + side * e * 520;
            const oy = y + e * e * 520;
            const out: number[] = [];
            for (let q = 0; q < pts.length; q += 2) {
              const dx = (pts[q] - PW / 2) * s;
              const dy = (pts[q + 1] - PH / 2) * s;
              out.push(ox + dx * Math.cos(ang) - dy * Math.sin(ang), oy + dx * Math.sin(ang) + dy * Math.cos(ang));
            }
            halves.poly(out).fill(0x0e0b10).stroke({ width: 4, color: 0x3a3040 });
          }
        }
        for (const p of built) p.c.visible = p.c.visible && pre < 1;
        // the stamp: his present paw slams MENTIRA across the shadow (c16.5)
        const ss = m - (B16 + 0.727);
        if (ss > -0.18) {
          mentira.visible = true;
          mentira.position.set(x + 20, y + 40);
          mentira.rotation = -0.18;
          mentira.scale.set(ss < 0 ? 0 : 1 + (1 - easeOut(ss / 0.1)) * 0.5);
          mentira.alpha = ss < 0 ? 0 : 1 - clamp01((ss - 0.55) / 0.2);
          if (ss < 0.3) {
            const up = ss < 0 ? -ss / 0.18 : easeIn(ss / 0.3);
            tvArm(pawG, 300, 1300, x - 40, y + 70 - up * 220, 74, 'stamp', 3, 0xd8302a);
          }
        }
        // his cut-out steps off the page onto the counter and watches it, scared; after the stamp, proud
        if (cut && t16 > -0.2) {
          cutC.visible = true;
          const q = easeOut(win(m, B16 - 0.2, B16 + 0.15));
          const px = lerp(cutC.x, 330, q);
          const py = lerp(cutC.y, 1040, q);
          cutC.position.set(px, py);
          cutC.rotation = lerp(cutC.rotation, -0.05, q);
          if (border) border.scale.x = Math.abs(border.scale.x);
          perform(st, k, cut, m, { x: 0, y: 0, flip: false, crouch: exit > 0 ? 0.05 : 0.35, lean: exit > 0 ? 0.3 : -0.35, look: 0.8, headA: exit > 0 ? -0.1 : 0.12, amp: 0 });
          if (cut.puppet && t16 > 0 && exit <= 0) cut.puppet.emote('hurt', 0.6);
          const [hx, hy] = headOf(cut, [0, -250]);
          cutHead = [px + hx, py + hy];
        }
      }
    },
    anchor(name, k) {
      // the prompt sits to the right of the page; Canelo's balloons come from his cut-out
      if (name === 'page') return [1700, 780];
      if (name === 'canelo') return scr(k, cutHead[0], cutHead[1]);
      return null;
    },
  };
};

// ================================================================== ASTRAL — c18: the board's page becomes a card (REGISTRO 000)
const astral: Make = (st, k) => {
  const root = new Container();
  const sky = new Graphics();
  // the card 001 (the Capi's) slides in under it: 000 comes BEFORE the one
  const c1 = new Container();
  const c1g = new Graphics();
  card(c1g, -230, -150, 460, 300, 0x2a2f58, 18);
  const c1t = txt(k, '001 · EL CAPI', { fontFamily: 'Anton', fontSize: 50, fill: TV.cream, letterSpacing: 3 });
  c1.addChild(c1g, c1t);
  const cardC = new Container();
  const cg = new Graphics();
  cardC.addChild(cg);
  const t1 = txt(k, 'REGISTRO 000', { fontFamily: 'Anton', fontSize: 72, fill: TV.cream, letterSpacing: 4 });
  t1.position.set(0, -150);
  const t2 = txt(k, 'ESTADO: observando', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 30, fill: 0xb8c6ff });
  t2.position.set(0, 160);
  const letters = 'FOLIO'.split('').map((ch) => {
    const s = txt(k, ch, { fontFamily: 'Bangers', fontSize: 104, fill: TV.amberL, stroke: { color: TV.line, width: 8 } });
    s.visible = false;
    cardC.addChild(s);
    return s;
  });
  cardC.addChild(t1, t2);
  const can = st.actor('tv', st.slugs.canelo, 640);
  const arm = new Graphics();
  root.addChild(sky, c1, cardC);
  if (can) root.addChild(can);
  root.addChild(arm);
  let head: [number, number] = [420, 520];
  return {
    twos: true,
    root,
    update(k, m, lt) {
      sky.clear();
      bands(sky, [0x0a0b2a, 0x111640, 0x1a2058, 0x232a6e], -1000, 2100);
      // stars falling UP (the opening of the Parte II), in two depths
      for (let i = 0; i < 70; i++) {
        const sp = 200 + rnd(i) * 300;
        const x = -400 + rnd(i + 4) * 2720;
        const y = 1300 - ((m * sp + rnd(i + 9) * 1800) % 1800);
        twinkle(sky, x, y, 6 + rnd(i + 2) * 8, TV.cream, 0.9);
        sky.moveTo(x, y + 10).lineTo(x, y + 60).stroke({ width: 2, color: TV.cream, alpha: 0.3 });
      }
      // the page shrinks into a dark card, with a glitch on the way
      const q = easeOut(lt / 0.45);
      const w = lerp(300, 620, q);
      const h = lerp(380, 460, q);
      const gl = lt < 0.5 && Math.floor(lt * 24) % 3 === 0 ? 16 : 0;
      cg.clear();
      cg.roundRect(-w / 2 + 14 + gl, -h / 2 + 14, w, h, 20).fill(TV.neonBlue);
      cg.roundRect(-w / 2 - gl, -h / 2, w, h, 20).fill(q > 0.5 ? 0x1b1f3a : 0xfbf8f0).stroke({ width: LW, color: TV.line });
      cg.rect(-w / 2 + 30, -90, w - 60, 4).fill({ color: TV.neonBlue, alpha: q });
      cardC.position.set(1180, 440);
      cardC.rotation = Math.sin(m * 1.1) * 0.03;
      t1.alpha = t2.alpha = q;
      const nOn = st.folios.filter((t) => t <= m + 1e-6).length;
      letters.forEach((s, i) => {
        s.visible = i < nOn;
        s.position.set(-200 + i * 100, 40);
        const since = m - (st.folios[i] ?? m);
        s.scale.set(1 + (1 - easeOut(since / 0.1)) * 0.5);
      });
      const c1q = easeOutBack(win(lt, 0.55, 0.85), 1.5);
      c1.visible = c1q > 0.01;
      c1.position.set(1180 + 120, 440 + lerp(500, 300, c1q));
      c1.rotation = 0.08;
      // Canelo, big at the left, points at the card and taps the 000 twice (on the beats)
      const tap = Math.abs(Math.sin((m / k.beat) * Math.PI));
      perform(st, k, can, m, { x: 430, y: 1130, flip: true, lean: 0.35, look: 0.9, headA: -0.08 + (lt > 0.7 ? 0.1 : 0), amp: 0.8 });
      head = headOf(can, [430, 560]);
      arm.clear();
      tvArm(arm, head[0] + 40, head[1] + 230, lerp(900, 1230 - tap * 26, easeOut(lt / 0.3)), 372 + tap * 16, 60, 'point', 3, 0, -40);
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
  };
};

export const SCENES: Record<string, Make> = { bar, pint, diario, astral, ...SCENES2, ...SCENES3 };
export type { Sprite };
