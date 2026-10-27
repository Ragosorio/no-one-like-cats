/**
 * «DRUNCK» — Parte II, waves 1 to 3 (c21–c32), each memory in the style of ITS Momento (docs/part-iii/07 §2.3), the
 * characters big and acting (docs/part-iii/13 §3.3):
 *   almirante (c21–22: the page, ¿CUÁNTOS?, the correction white that floods the fleet and reaches his hat) · neon (c23:
 *   NEÓN CEL, the galleon the bar's neon became, the bar rising under it) · corona (c24: the white city, the leaflet
 *   torn) · cometa (c25–26: SINCRO, the tug) · kitten (c27–28: the static kitten only he sees — Maneki looks and it's
 *   gone) · bitacora (c30: your signature, the same hand in the margin; the chart: a hospital) · coloso (c31–32: the
 *   chain he breaks on his own; the breath).
 * The ink (c19–20), the graffiti (c29) and the lighthouse (c24.6) happen IN the bar (scenes.ts): the bosses' styles
 * invade it.
 */
import { ColorMatrixFilter, Container, Graphics, type Sprite } from 'pixi.js';
import type { Kit } from '../../anime/kit';
import {
  FUR_WHITE, backdrop, bands, bell, card, clamp01, easeIn, easeInOut, easeOut, easeOutBack, glow, headOf, keyed, lerp, mix, perform, rnd, scr, tearLine, tvArm, twinkle, txt, win,
  type Keyed, type Make,
} from './drawkit';
import { LW, TV } from './tv';
import { Silueta } from './silueta';

/** an engraving's paw (the colossus plate) */
const FUR_SEPIA = { base: 0xb08a5a, dark: 0x6a4a30, light: 0xf0e2c4, pad: 0xc89a8a, stripe: 0x5a3a24 };

// ================================================================== ALMIRANTE — c21–22: the page, ¿CUÁNTOS?, white perfection
const almirante: Make = (st, k) => {
  const outer = new Container();
  const root = new Container();
  outer.addChild(root);
  const bgG = new Graphics();
  bands(bgG, [0x151d44, 0x1f2a5c, 0x2a3878, 0x3a4c98], -1000, 560);
  for (let i = 0; i < 30; i++) twinkle(bgG, rnd(i) * 1920, rnd(i + 2) * 480, 3 + rnd(i) * 5, TV.cream, 0.7);
  // the page header (out of the ink): a cream banner
  card(bgG, 620, 40, 1120, 200, TV.cream, 10);
  let lastStep = -1;
  const t1 = txt(k, 'CANELO, ALMIRANTE', { fontFamily: 'Anton', fontSize: 92, fill: TV.line, letterSpacing: 3 });
  const t2 = txt(k, 'DE LA FLOTA GATUNA', { fontFamily: 'Anton', fontSize: 60, fill: TV.pinkD, letterSpacing: 3 });
  t1.position.set(1180, 112);
  t2.position.set(1180, 190);
  const sea = new Graphics();
  const ships = new Graphics();
  const white = new Graphics();
  const sail = txt(k, '—N.', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 64, fill: 0x8892ad });
  const adm = st.actor('tv', st.slugs.admiral, 720);
  const arm = new Graphics();
  const splat = new Graphics();
  root.addChild(bgG, t1, t2, sea, ships, white, sail);
  if (adm) root.addChild(adm);
  root.addChild(arm, splat);
  let head: [number, number] = [420, 520];
  return {
    twos: true,
    root: outer,
    update(k, m, lt) {
      // the sea and the fleet are redrawn ON TWOS (restarting on the beat)
      const stp = k.beatStep(m);
      const redraw = stp !== lastStep;
      lastStep = stp;
      if (redraw) sea.clear();
      if (redraw) {
      bands(sea, [0x2f6ab8, 0x3f7fd0, 0x2f6ab8, 0x24559a], 560, 1300);
      for (let r = 0; r < 9; r++) {
        const y = 580 + r * r * 9;
        const sp = 40 + r * 16;
        for (let x = -400; x < 2400; x += sp * 2) {
          const xx = x + ((m * (20 + r * 14)) % (sp * 2));
          sea.moveTo(xx, y).quadraticCurveTo(xx + sp * 0.5, y - 4 - r, xx + sp, y).stroke({ width: 2 + r * 0.5, color: 0xbfe0ff, alpha: 0.5 });
        }
      }
      }
      // the ships: 3 sad ones · 40 · 1000 (the sea IS ships and Canelo walks on them), in perspective rows
      const pick = st.pickAtM(m);
      const wq = clamp01(k.num('white', 0));
      const wx = lerp(2400, -600, easeOut(wq));
      if (redraw) ships.clear();
      const n = !redraw ? 0 : pick === 3 ? 3 : pick === 1000 ? 160 : pick === 40 ? 40 : 0;
      const rows = pick === 1000 ? 8 : pick === 40 ? 4 : 1;
      const per = Math.ceil(n / rows);
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / per);
        const col = i % per;
        const depth = rows > 1 ? row / (rows - 1) : 0.5;
        const s = lerp(0.45, 1.25, depth) * (pick === 3 ? 1.5 : 1);
        const y = lerp(600, 960, depth) + Math.sin(m * 2.2 + i) * 6 * s;
        const span = 1800 + depth * 600;
        const x = pick === 3 ? 900 + col * 360 : 960 - span / 2 + ((col + 0.5) / per) * span + (row % 2) * 30;
        const whiteHere = wq > 0 && x > wx;
        const c = whiteHere ? 0xf4f4f0 : [TV.pink, TV.amber, TV.green, TV.wood][i % 4];
        ships.poly([x - 60 * s, y, x + 60 * s, y, x + 40 * s, y + 34 * s, x - 40 * s, y + 34 * s]).fill(c).stroke({ width: 4, color: whiteHere ? 0xc9d3e6 : TV.line });
        ships.poly([x, y - 80 * s, x, y - 4, x + 50 * s, y - 10]).fill(whiteHere ? 0xffffff : TV.cream).stroke({ width: 3, color: whiteHere ? 0xc9d3e6 : TV.line });
        if (pick === 3) {
          // three SAD little ships: droopy sails, a tear
          ships.circle(x - 20 * s, y - 30 * s, 6).fill(TV.line);
          ships.circle(x - 22 * s, y - 14 * s, 4).fill(TV.lantern);
        }
      }
      // c22: the CORRECTION WHITE floods in from the right (like liquid paper), a white ship riding its edge, «—N.»
      white.clear();
      sail.visible = wq > 0.01;
      if (wq > 0.01) {
        const edge: number[] = [];
        for (let i = 0; i <= 12; i++) edge.push(wx + Math.sin(i * 1.7 + m * 3) * 26, 560 + i * 60);
        white.poly([...edge, 2600, 1300, 2600, 560]).fill({ color: 0xffffff, alpha: 0.9 });
        white.poly(edge, false).stroke({ width: 6, color: 0xd6dbe6 });
        const sx = Math.max(wx + 260, 1300);
        white.poly([sx - 230, 720, sx + 230, 720, sx + 180, 820, sx - 180, 820]).fill(0xffffff).stroke({ width: 3, color: 0xc9d3e6 });
        white.poly([sx - 10, 360, sx - 10, 710, sx + 170, 690]).fill(0xffffff).stroke({ width: 3, color: 0xc9d3e6 });
        sail.position.set(sx + 60, 560);
      }
      // the Admiral, big in the foreground: proud (chest out) → «¡HUNDÍ CUARENTA BARCOS!» (the paw at the fleet) →
      // with 1 000 he walks ON the ships → the white reaches his hat: disgust, he shakes it off
      const disgust = clamp01((wq - 0.55) / 0.2);
      const walk = pick === 1000 ? ((lt * 140) % 300) : 0;
      const shake = disgust > 0 && disgust < 1 ? Math.sin(m * 40) * 0.08 : 0;
      const hit = Math.floor(m / k.beat) % 2;
      perform(st, k, adm, m, {
        x: 400 + walk,
        y: pick === 1000 ? 1020 : 1160,
        flip: true,
        lean: lerp(hit ? -0.45 : -0.2, 0.3, disgust),
        headA: lerp(hit ? -0.2 : -0.08, 0.12, disgust) + shake,
        crouch: disgust * 0.25,
        look: lerp(0.6, -0.4, disgust),
        sx: 1 + bell(win(m, 30.6, 30.8)) * 0.1,
        sy: 1 - bell(win(m, 30.6, 30.8)) * 0.08,
      });
      head = headOf(adm, [460, 560]);
      // the camera: a crash-zoom onto the Admiral's boast (c21), then a Dutch tilt that rocks with the sea on the beat;
      // the flood of white straightens it (perfect: level)
      const boast = 1 - easeOut(win(m, 29.091, 29.091 + 0.5));
      const beatN = Math.floor(m / k.beat);
      const tilt = (beatN % 2 ? 0.045 : -0.045) * (1 - wq);
      root.pivot.set(lerp(960, head[0] + 120, boast), lerp(540, head[1] + 60, boast));
      root.position.set(960, 540);
      root.scale.set(lerp(1, 1.55, boast));
      root.rotation = tilt;
      arm.clear();
      if (disgust < 0.5) {
        // he points at his fleet (on «¡HUNDÍ…!»)
        const q = easeOutBack(win(lt, 0, 0.25), 1.6);
        tvArm(arm, head[0] + 40, head[1] + 240, lerp(head[0] + 120, 1040, q), lerp(head[1] + 260, 640, q), 62, 'point', 3, 0, -30);
      }
      // the white splat on his hat (and flung off)
      splat.clear();
      if (wq > 0.6) {
        const off = clamp01((wq - 0.8) / 0.2);
        const sx = head[0] + off * 500;
        const sy = head[1] - 120 - off * 200 + off * off * 400;
        splat.circle(sx, sy, 50).fill(0xffffff).stroke({ width: 4, color: 0xd6dbe6 });
        for (let i = 0; i < 5; i++) splat.circle(sx + Math.cos(i * 1.3) * 60, sy + Math.sin(i * 1.3) * 40, 16).fill(0xffffff);
      }
    },
    anchor(name, k) {
      const z = root.scale.x;
      const c = Math.cos(root.rotation);
      const sn = Math.sin(root.rotation);
      const dx = (head[0] - root.pivot.x) * z;
      const dy = (head[1] - root.pivot.y) * z;
      if (name === 'canelo') return scr(k, 960 + dx * c - dy * sn, 540 + dx * sn + dy * c);
      return null;
    },
  };
};

// ================================================================== NEON — c23 (LIKY FIGHT: NEÓN CEL): the party in the sky
const neon: Make = (st, k) => {
  const outer = new Container();
  const root = new Container();
  outer.addChild(root);
  // a closer camera on the deck (the dancers big), drifting up with the galleon
  root.pivot.set(940, 470);
  root.position.set(960, 540);
  root.scale.set(1.22);
  const sky = new Graphics();
  const ship = new Graphics();
  const barG = new Graphics();
  const cas = st.actor('cel', st.slugs.cascada, 520);
  const can = st.actor('cel', st.slugs.canelo, 440);
  const conf = new Graphics();
  root.addChild(sky, barG, ship);
  if (cas) root.addChild(cas);
  if (can) root.addChild(can);
  root.addChild(conf);
  // the dance: a key pose per beat (they snap on the kick)
  const DANCE: Keyed[] = [
    { lean: 0.6, headA: -0.15, crouch: 0.1, rot: -0.12 },
    { lean: -0.6, headA: 0.15, crouch: 0.35, rot: 0.12 },
    { lean: 0.3, headA: 0.1, crouch: 0, rot: -0.06, sy: 1.12 },
    { lean: -0.4, headA: -0.1, crouch: 0.5, rot: 0.1, sx: 1.1 },
  ];
  let head: [number, number] = [1100, 500];
  return {
    twos: true,
    root: outer,
    update(k, m, lt) {
      sky.clear();
      bands(sky, [0x120838, 0x1d0b4f, 0x2c0f66, 0x47137a, 0x6a1a86], -1000, 2100);
      for (let i = 0; i < 30; i++) twinkle(sky, rnd(i) * 1920, rnd(i + 5) * 600, 5 + rnd(i + 2) * 7, 0xffd6f5, 0.8);
      // the camera rises with the galleon: the bar is left below (scale: it becomes a toy house)
      const up = easeOut(lt / 1.2);
      const kick = st.bounce(k, m);
      ship.clear();
      const y = 560 + Math.sin(m * 1.6) * 10;
      ship.poly([260, y, 1660, y, 1580, y + 190, 340, y + 190]).fill(0x3b1a6b).stroke({ width: 12, color: 0xff2e88 });
      ship.rect(260, y - 18, 1400, 18).fill(0xffe14a).stroke({ width: 4, color: 0x150a33 });
      for (let i = 0; i < 9; i++) ship.circle(390 + i * 140, y + 90, 26 + kick * 8).fill(0x00e5ff).stroke({ width: 5, color: 0x150a33 });
      ship.rect(980, y - 420, 18, 420).fill(0xffd6f5).stroke({ width: 4, color: 0x150a33 });
      ship.poly([998, y - 410, 998, y - 50, 1250, y - 70]).fill(0xff2e88).stroke({ width: 6, color: 0x150a33 });
      ship.poly([980, y - 380, 980, y - 70, 660, y - 90]).fill(0x00e5ff).stroke({ width: 6, color: 0x150a33 });
      for (let i = 0; i < 11; i++) ship.circle(280 + i * 135, y - 40 - Math.sin((i / 10) * Math.PI) * 70, 10).fill([0xffe14a, 0xff2e88, 0x00e5ff][(i + Math.floor(m / k.beat)) % 3]);
      ship.circle(1420, y - 260, 60).fill(0xd9d4e8).stroke({ width: 5, color: 0x150a33 });
      ship.moveTo(1420, y - 320).lineTo(1420, y - 420).stroke({ width: 4, color: 0xffd6f5 });
      for (let i = 0; i < 7; i++) {
        const an = m * 2 + i;
        ship.moveTo(1420, y - 260).lineTo(1420 + Math.cos(an) * 800, y - 260 + Math.sin(an) * 400).stroke({ width: 8, color: [0xff2e88, 0x00e5ff, 0xffe14a][i % 3], alpha: 0.22 });
      }
      // the bar sinking away below (the toy house with its neon, the window it came out of)
      barG.clear();
      const by = lerp(820, 1300, up);
      const bs = lerp(1, 0.5, up);
      barG.rect(960 - 260 * bs, by, 520 * bs, 300 * bs).fill(TV.woodD).stroke({ width: LW, color: TV.line });
      barG.poly([960 - 280 * bs, by, 960, by - 140 * bs, 960 + 280 * bs, by]).fill(TV.brick).stroke({ width: LW, color: TV.line });
      barG.rect(960 - 200 * bs, by + 60 * bs, 160 * bs, 120 * bs).fill(TV.amber).stroke({ width: LW, color: TV.line });
      // the dance (a pose per beat)
      const beat = Math.floor(m / k.beat);
      const pc = keyed([[0, DANCE[beat % 4]]], 0);
      const pa = keyed([[0, DANCE[(beat + 2) % 4]]], 0);
      perform(st, k, cas, m, { x: 600, y: y + 6, rot: pa.rot, lean: pa.lean, crouch: pa.crouch, headA: pa.headA, sx: pa.sx, sy: pa.sy, amp: 2, look: 0.5 });
      perform(st, k, can, m, { x: 1180, y: y + 4, flip: true, rot: pc.rot, lean: pc.lean, crouch: pc.crouch, headA: pc.headA, sx: pc.sx, sy: pc.sy, amp: 2, look: -0.4 });
      if (can?.puppet && beat % 2 === 0) can.puppet.emote('happy', 1);
      const hd = headOf(can, [1180, 300]);
      head = [960 + (hd[0] - 940) * 1.22, 540 + (hd[1] - 470) * 1.22];
      // confetti on the beat
      conf.clear();
      for (let i = 0; i < Math.round(40 * k.density); i++) {
        const x = rnd(i) * 1920 + Math.sin(m * 2 + i) * 30;
        const yy = ((m * (180 + rnd(i + 3) * 160) + rnd(i + 7) * 1100) % 1100) - 40;
        conf.rect(x, yy, 14, 8).fill([0xffe14a, 0xff2e88, 0x00e5ff, 0xffffff][i % 4]);
      }
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
  };
};

// ================================================================== CORONA — c24: the white city, the leaflet torn
const corona: Make = (st, k) => {
  const root = new Container();
  const bgG = new Graphics();
  const row = new Container();
  const whiteF = new ColorMatrixFilter();
  whiteF.greyscale(0.9, false);
  whiteF.brightness(1.35, true);
  row.filters = [whiteF];
  const ROW: Sprite[] = [];
  // the city, drawn once
  backdrop(bgG, 0xeef0f4);
  // perfect towers converging to one vanishing point (a symmetric city), a chalk leviathan on the sky
  for (let i = 0; i < 12; i++) {
    const x = 40 + i * 170;
    const h = 520 - Math.abs(i - 5.5) * 40;
    bgG.poly([x, 760, x + 120, 760, x + 112, 760 - h, x + 8, 760 - h]).fill(0xffffff).stroke({ width: 3, color: 0xd6dbe6 });
    for (let j = 0; j < 6; j++) bgG.rect(x + 30, 760 - h + 40 + j * 70, 60, 30).fill(0xf0f3f8);
  }
  bgG.moveTo(1300, 200).bezierCurveTo(1500, 60, 1750, 300, 1900, 140).stroke({ width: 14, color: 0xb8c4d8 });
  bgG.circle(1290, 200, 34).stroke({ width: 8, color: 0xb8c4d8 });
  bgG.rect(-1600, 760, 5120, 600).fill(0xe2e6ee);

  for (let i = 0; i < 11; i++) {
    const s = st.still('toon', st.slugs.tachon, 0.5, 0.97);
    if (!s) continue;
    const d = i / 10;
    s.scale.set(lerp(70, 150, 1 - Math.abs(d - 0.5) * 2) / s.texture.height);
    s.position.set(160 + i * 160, 700);
    row.addChild(s);
    ROW.push(s);
  }
  // the ambassador: a white Corrector, big, holding out the leaflet
  const emb = st.actor('toon', st.slugs.tachon, 600);
  const embC = new Container();
  if (emb) embC.addChild(emb);
  embC.filters = [whiteF];
  const leaf = new Container();
  const lg = new Graphics();
  const lt1 = txt(k, 'CANELO 2.0', { fontFamily: 'Anton', fontSize: 62, fill: 0x2e3440 });
  const lt2 = txt(k, '— SIN IMPACIENCIA —', { fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: '700', fontSize: 30, fill: 0x2e3440 });
  lt1.position.set(0, -34);
  lt2.position.set(0, 34);
  leaf.addChild(lg, lt1, lt2);
  const halves = new Graphics();
  const can = st.actor('tv', st.slugs.canelo, 660);
  const arms = new Graphics();
  root.addChild(bgG, row, embC, leaf, halves);
  if (can) root.addChild(can);
  root.addChild(arms);
  // CANELO 2.0: the correction white drains up him from the feet while the ambassador holds out the leaflet (they
  // are «correcting» him: prep → develop), and when he tears it the color floods back from his head (exit) — §2.2
  const corrected = can?.puppet ? new Silueta(can.puppet, { body: 0xf2f4fa, detail: 0.3, light: { dir: [1, -0.3], color: 0xc9d3e6, width: 3 }, eyes: 'keep', halo: false }) : null;
  let head: [number, number] = [500, 520];
  return {
    twos: true,
    root,
    update(k, m, lt) {
      // the row of purring cats: identical, in step
      const hop = Math.abs(Math.sin((m / k.beat) * Math.PI)) * 8;
      for (const s of ROW) s.y = 700 - hop;
      // the ambassador holds the leaflet out; it's torn in two on the beat
      perform(st, k, emb, m, { x: 1500, y: 1120, lean: -0.2, headA: -0.08, look: -0.6, amp: 0.4 });
      const torn = m >= st.tearAt;
      const tt = torn ? m - st.tearAt : 0;
      lg.clear();
      halves.clear();
      arms.clear();
      leaf.visible = !torn || tt < 0.05;
      const lx = 1040;
      const ly = 420 + Math.sin(m * 2) * 6;
      if (leaf.visible) {
        card(lg, -260, -100, 520, 200, 0xffffff, 6, 0xb8c4d8);
        leaf.position.set(lx, ly);
        leaf.rotation = -0.04;
        tvArm(arms, 1380, 640, lx + 200, ly + 60, 54, 'mitt', 3, 0, 20, FUR_WHITE);
      } else {
        for (const side of [-1, 1]) {
          const e = tt;
          const ox = lx + side * (60 + e * 900);
          const oy = ly + e * e * 1100 - e * 200;
          const pts = side < 0 ? [-260, -100, 0, -100, ...tearLine(0, -100, 0, 100, 6, 14, 5).slice(2, -2), 0, 100, -260, 100] : [0, -100, 260, -100, 260, 100, 0, 100, ...tearLine(0, 100, 0, -100, 6, 14, 5).slice(2, -2)];
          const a = side * e * 3;
          const out: number[] = [];
          for (let i = 0; i < pts.length; i += 2) out.push(ox + pts[i] * Math.cos(a) - pts[i + 1] * Math.sin(a), oy + pts[i] * Math.sin(a) + pts[i + 1] * Math.cos(a));
          halves.poly(out).fill(0xffffff).stroke({ width: 3, color: 0xb8c4d8 });
        }
      }
      // Canelo, big and furious: he reads it (lean in, squint), grabs it with both paws, TEARS it
      const rage = torn ? 1 : win(m, st.tearAt - 0.35, st.tearAt);
      // he stiffens as the white climbs (a perfect, polite posture), then BURSTS out of it, bigger
      const drain = clamp01((m - 33.455) / 0.33) * 0.8;
      const burst = torn ? easeOutBack(clamp01(tt / 0.2), 2) : 0;
      perform(st, k, can, m, {
        x: 520 + burst * 30,
        y: 1180,
        flip: true,
        lean: torn ? 0.6 : lerp(0.25, -0.15, drain),
        crouch: torn ? 0.3 : 0.1 - drain * 0.1,
        headA: torn ? -0.12 : lerp(0.05, -0.08, drain),
        look: torn ? 0.8 : lerp(0.8, 0, drain),
        sx: torn ? 1 + 0.18 * bell(clamp01(tt / 0.3)) : 1 - drain * 0.04,
        sy: torn ? 1 + 0.1 * bell(clamp01(tt / 0.3)) : 1 + drain * 0.03,
        amp: torn ? 1 : 0.2,
      });
      if (corrected) {
        corrected.k = torn ? 0.8 : drain;
        corrected.how = 'flood';
        corrected.out = torn ? clamp01(tt / 0.3) : 0;
        corrected.update(0);
      }
      if (can?.puppet && torn) can.puppet.emote('attack', 1);
      head = headOf(can, [520, 560]);
      if (!torn || tt < 0.1) {
        const reach = easeOutBack(win(m, st.tearAt - 0.3, st.tearAt - 0.05), 1.4);
        const grabX = torn ? lx - 60 - tt * 900 : lerp(head[0] + 200, lx - 220, reach);
        tvArm(arms, head[0] + 30, head[1] + 250, grabX, ly + 30 + (torn ? tt * tt * 900 : 0), 60, 'mitt', 3, 0, -20);
      }
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
    destroy: () => corrected?.destroy(),
  };
};

// ================================================================== COMETA — c25–26: Puerto Cometa (retro-future, scanlines), SINCRO, the tug
const cometa: Make = (st, k) => {
  const outer = new Container();
  const root = new Container();
  outer.addChild(root);
  const g = new Graphics();
  const kanji = txt(k, '同期', { fontFamily: 'Dela Gothic One', fontSize: 240, fill: 0x9fe8ff, stroke: { color: TV.line, width: 10 } });
  kanji.position.set(1500, 240);
  const log = new Container();
  const lg = new Graphics();
  card(lg, -230, -150, 460, 300, 0xf6efe0, 8);
  for (let i = 0; i < 7; i++) lg.rect(-200, -110 + i * 34, 330, 6).fill({ color: TV.line, alpha: 0.3 });
  const order = txt(k, 'empújenla.', { fontFamily: 'Permanent Marker', fontSize: 40, fill: 0xb0302a });
  order.position.set(120, 96);
  order.rotation = -0.3;
  log.addChild(lg, order);
  log.position.set(1560, 840);
  const star = st.actor('tv', st.slugs.estrella, 300);
  const can = st.actor('tv', st.slugs.canelo, 620);
  // the x-ray of the zap: his own outline (the real painting's), flashing cyan behind him on every beat
  const xray = st.silhouette('tv', st.slugs.canelo, 0.5, 0.97);
  if (xray) xray.tint = 0x9fe8ff;
  const bolt = new Graphics();
  const port = new Container();
  const portG = new Graphics();
  port.addChild(portG);
  root.addChild(port, g, kanji);
  if (star) root.addChild(star);
  if (xray) root.addChild(xray);
  if (can) root.addChild(can);
  root.addChild(bolt, log);
  const scan = new Graphics();
  for (let y = -200; y < 1300; y += 8) scan.rect(-1600, y, 5120, 3).fill({ color: 0x000000, alpha: 0.18 });
  outer.addChild(scan);
  const MODS: [number, number][] = [
    [160, 300],
    [520, 200],
    [880, 330],
    [1240, 220],
    [1600, 320],
  ];
  // the port, drawn once (it hops as ONE thing on every beat: that's the SINCRO)
  const sky = new Graphics();
  bands(sky, [0x0b1630, 0x10204a, 0x183068, 0x204080], -1000, 2100);
  sky.rect(-1600, 980, 5120, 400).fill(0x2a3a60);
  root.addChildAt(sky, 0);
  for (let i = 0; i < MODS.length - 1; i++) portG.moveTo(MODS[i][0], MODS[i][1]).lineTo(MODS[i + 1][0], MODS[i + 1][1]).stroke({ width: 10, color: 0x6a7aa8 });
  for (const [x, y] of MODS) {
    portG.roundRect(x - 110, y - 70, 220, 140, 60).fill(0xc9d3e6).stroke({ width: LW, color: TV.line });
    portG.circle(x - 40, y, 22).fill(0x9fe8ff).stroke({ width: 5, color: TV.line });
    portG.circle(x + 40, y, 22).fill(0x9fe8ff).stroke({ width: 5, color: TV.line });
  }
  let head: [number, number] = [1180, 500];
  return {
    twos: true,
    root: outer,
    update(k, m, lt) {
      g.clear();
      bolt.clear();
      const tug = clamp01(k.num('tug', 0));
      const ph = (m % k.beat) / k.beat;
      const zap = tug < 0.05 ? Math.exp(-(ph * k.beat) / 0.08) : 0;
      // SINCRO: the whole port hops as one, on every beat
      const hop = tug < 0.05 ? Math.sin(Math.min(1, ph * 2) * Math.PI) : 0;
      port.y = -hop * 26;
      port.scale.set(1, 1 + hop * 0.02);
      kanji.y = 240 - hop * 26;
      // the bolt jumps module to module, one per beat — and down into Canelo
      const b = Math.floor(m / k.beat) % (MODS.length - 1);
      const [x0, y0] = MODS[b];
      const [x1, y1] = MODS[b + 1];
      const pts: number[] = [x0, y0 - 80 + port.y];
      for (let i = 1; i < 6; i++) pts.push(lerp(x0, x1, i / 6) + (rnd(i + b) - 0.5) * 40, lerp(y0, y1, i / 6) - 80 + port.y + (rnd(i + b + 9) - 0.5) * 80);
      pts.push(x1, y1 - 80 + port.y);
      if (tug < 0.05) bolt.poly(pts, false).stroke({ width: 14, color: TV.amberL });
      if (zap > 0.2) {
        const zp: number[] = [x1, y1 + 60];
        for (let i = 1; i < 5; i++) zp.push(lerp(x1, head[0], i / 5) + (rnd(i + b * 3) - 0.5) * 60, lerp(y1 + 60, head[1] - 80, i / 5));
        zp.push(head[0], head[1] - 90);
        bolt.poly(zp, false).stroke({ width: 12, color: 0x9fe8ff, alpha: zap });
        // electric jaggies all around him
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * Math.PI * 2;
          const r0 = 220;
          bolt.moveTo(head[0] + Math.cos(an) * r0, head[1] + 120 + Math.sin(an) * r0 * 1.4).lineTo(head[0] + Math.cos(an + 0.12) * (r0 + 40), head[1] + 120 + Math.sin(an + 0.12) * (r0 + 40) * 1.4).lineTo(head[0] + Math.cos(an + 0.2) * (r0 + 10), head[1] + 120 + Math.sin(an + 0.2) * (r0 + 10) * 1.4).stroke({ width: 6, color: 0x9fe8ff, alpha: zap });
        }
      }
      // c26: the tug drags a HUGE planetoid with the Star on it (scale: Canelo tiny under it), on a cable of light
      if (tug > 0.01) {
        const tx = lerp(-500, 520, easeInOut(tug));
        g.roundRect(tx - 100, 600, 200, 90, 30).fill(TV.pink).stroke({ width: LW, color: TV.line });
        g.rect(tx - 30, 550, 40, 50).fill(TV.pinkD).stroke({ width: LW, color: TV.line });
        g.moveTo(tx + 100, 645).lineTo(tx + 420, 470).stroke({ width: 10, color: 0x9fe8ff });
        glow(g, tx + 700, 440, 420, 0x9fe8ff, 0.25);
        g.circle(tx + 700, 440, 340).fill(0x8a7a6a).stroke({ width: LW, color: TV.line });
        for (let i = 0; i < 7; i++) g.circle(tx + 580 + rnd(i) * 260, 330 + rnd(i + 2) * 240, 24 + rnd(i + 4) * 18).fill(0x6a5a4a);
        if (star) {
          star.visible = true;
          perform(st, k, star, m, { x: tx + 700, y: 120, rot: 0.15, crouch: 0.3, headA: 0.2, look: -0.6, amp: 0.3 });
          if (star.puppet) star.puppet.emote('hurt', 0.5);
        }
      } else if (star) star.visible = false;
      log.visible = tug > 0.3;
      log.alpha = clamp01((tug - 0.3) / 0.2);
      kanji.alpha = clamp01(lt / 0.15) * (1 - tug);
      kanji.scale.set(1 + st.bounce(k, m) * 0.05);
      // Canelo: zapped on every beat (fur on end, squash, the x-ray flash), then shrinking back from the planetoid
      perform(st, k, can, m, {
        x: 1180,
        y: 1200,
        flip: false,
        sx: 1 + zap * 0.16,
        sy: 1 - zap * 0.12,
        headDy: -zap * 14,
        lean: tug > 0.05 ? -0.5 : 0,
        look: tug > 0.05 ? 0.6 : 0.6,
        headA: tug > 0.05 ? -0.2 : -0.05,
        crouch: tug > 0.05 ? 0.35 : 0,
      });
      if (can?.puppet) can.puppet.emote(tug > 0.05 ? 'surprise' : 'surprise', tug > 0.05 ? 0.8 : zap);
      head = headOf(can, [1180, 500]);
      if (xray && can) {
        xray.visible = zap > 0.35;
        const s0 = (620 / xray.texture.height) * 1.08;
        xray.scale.set(s0 * can.scale.x, s0 * can.scale.y);
        xray.position.set(can.x, can.y + 10);
        xray.alpha = zap;
      }
      // the camera: a crash-zoom onto his zapped face on c25.5 (half a beat), back; it pulls out for the planetoid
      const crash = bell(win(m, 35.636, 36.1));
      const zc = lerp(1, 1.9, crash) * lerp(1, 0.86, easeInOut(tug));
      root.pivot.set(lerp(960, head[0], crash), lerp(540, head[1], crash));
      root.position.set(960, 540);
      root.scale.set(zc);
    },
    anchor(name, k) {
      if (name === 'canelo') {
        const z = root.scale.x;
        return scr(k, 960 + (head[0] - root.pivot.x) * z, 540 + (head[1] - root.pivot.y) * z);
      }
      return null;
    },
  };
};

// ================================================================== KITTEN — c27–28 (LEGIBLE): the static kitten only he sees
/**
 * PRESENT: Canelo Astral breaks the seal (anticipation, strike, the ring shatters) · SHOW: on the rock, a kitten made of
 * static (its outline is a real painting's, filled with static; its eyes lit) — «Yo lo veo. Nadie más.» ·
 * CONSEQUENCE: Maneki sweeps past and looks right at it: it's GONE while she looks, back when she turns away (it looks
 * at the camera); he points, frustrated. Planted for the awakening.
 */
const kitten: Make = (st, k) => {
  const root = new Container();
  const g = new Graphics();
  const ast = st.actor('tv', st.slugs.astral, 640);
  const man = st.actor('tv', st.slugs.maneki, 420);
  const kitC = new Container();
  const sil = st.silhouette('tv', st.slugs.baby, 0.5, 0.97);
  const noise = new Graphics();
  const eyes = new Graphics();
  if (sil) {
    sil.scale.set(190 / sil.texture.height);
    sil.tint = 0xb8b8c8;
    kitC.addChild(sil);
  }
  const nmask = sil ? st.silhouette('tv', st.slugs.baby, 0.5, 0.97) : null;
  if (nmask) {
    nmask.scale.set(190 / nmask.texture.height);
    kitC.addChild(noise, nmask);
    noise.mask = nmask;
  }
  kitC.addChild(eyes);
  const arm = new Graphics();
  const fx = new Graphics();
  root.addChild(g, kitC);
  if (man) root.addChild(man);
  if (ast) root.addChild(ast);
  root.addChild(arm, fx);
  const skyK = new Graphics();
  bands(skyK, [0x140a2e, 0x1e1048, 0x2a1660, 0x34207a], -1000, 2100);
  for (let i = 0; i < 50; i++) twinkle(skyK, rnd(i) * 1920, rnd(i + 3) * 1080, 3 + rnd(i) * 6, 0xd8ccff, 0.7);
  root.addChildAt(skyK, 0);
  const KX = 1500;
  const KY = 690;
  // the eye spots of the painting (rig) in the silhouette's local px
  const rigEyes = (() => {
    const r = st.studios.tv.has(st.slugs.baby) ? (sil ? sil.texture : null) : null;
    void r;
    return [
      [-62, -128],
      [12, -118],
    ];
  })();
  let head: [number, number] = [500, 500];
  return {
    twos: true,
    root,
    update(k, m, lt) {
      g.clear();
      // the seal (a ring of light) — the strike shatters it
      const hit = 0.32;
      const q = clamp01((lt - hit) / 0.25);
      if (lt < hit + 0.6) {
        g.circle(620, 420, 270).stroke({ width: 20, color: 0xd8ccff, alpha: 1 - q });
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * Math.PI * 2 + 0.3;
          const d = 270 + q * 360;
          g.poly([620 + Math.cos(an) * d, 420 + Math.sin(an) * d, 620 + Math.cos(an + 0.12) * (d + 50), 420 + Math.sin(an + 0.12) * (d + 50), 620 + Math.cos(an + 0.24) * d, 420 + Math.sin(an + 0.24) * d]).fill({ color: 0xd8ccff, alpha: 1 - q });
        }
      }
      // the rock, lit from the crack
      glow(g, KX, KY - 60, 260, 0x8a6aff, 0.3);
      g.poly([KX - 260, 900, KX - 160, 700, KX + 60, 660, KX + 220, 740, KX + 280, 900]).fill(0x3a3456).stroke({ width: LW, color: TV.line });
      // the kitten: real outline, filled with static (on twos), eyes lit — gone while Maneki looks at it
      const mt = m - 39.273;
      const looking = mt > 0.25 && mt < 0.95;
      const shown = lt > hit + 0.1 && !looking;
      kitC.visible = shown || (looking && Math.floor(m * 24) % 5 === 0);
      kitC.position.set(KX, KY);
      noise.clear();
      eyes.clear();
      if (kitC.visible) {
        const s = Math.floor(m * 12);
        for (let i = 0; i < 160; i++) noise.rect(-110 + rnd(i * 3 + s) * 220, -200 + rnd(i * 7 + s) * 200, 10, 8).fill(rnd(i + s) > 0.5 ? 0xe8e8f0 : 0x3a3a4a);
        const stare = mt > 0.95 ? 1 : 0.6;
        for (const [ex, ey] of rigEyes) glow(eyes, ex, ey, 22 * stare, 0x9fe8ff, 0.9, 3);
      }
      // Maneki sweeps in from the right, looks at the rock (nothing), shrugs, turns away
      if (man) {
        const inQ = easeOut(clamp01(mt / 0.3));
        man.visible = mt > -0.1;
        perform(st, k, man, m, { x: lerp(2200, 1180, inQ), y: 960, flip: false, look: looking ? 0.9 : -0.6, headA: mt > 0.7 && mt < 1.1 ? -0.15 : 0, lean: Math.sin(m * 9) * 0.15, amp: 0.5 });
      }
      // Canelo Astral: crouch (anticipation) → the strike (smear) → he sees it → he points (and insists)
      const strike = lt < hit ? 0 : 1;
      const insist = mt > 0.25 ? 1 : 0;
      perform(st, k, ast, m, {
        x: 470,
        y: 1160,
        flip: true,
        crouch: lt < hit ? 0.5 * easeOut(lt / hit) : 0.05,
        lean: lt < hit ? -0.4 : lerp(0.6, 0.3, clamp01((lt - hit) / 0.3)) + insist * 0.25,
        headA: insist ? 0.1 * Math.sin(m * 14) : -0.05,
        look: 0.8,
        sx: strike && lt < hit + 0.08 ? 1.18 : 1,
        sy: strike && lt < hit + 0.08 ? 0.86 : 1,
      });
      if (ast?.puppet) ast.puppet.emote(insist ? 'attack' : 'surprise', 0.8);
      head = headOf(ast, [500, 520]);
      arm.clear();
      fx.clear();
      if (lt < hit + 0.12) {
        // the strike at the seal (a smear arc)
        const a = easeOutBack(clamp01(lt / hit), 1.2);
        tvArm(arm, head[0] + 40, head[1] + 240, lerp(head[0] + 60, 620, a), lerp(head[1] + 280, 420, a), 66, 'mitt');
        if (lt > hit - 0.08) fx.moveTo(620 + Math.cos(-1.2) * 300, 420 + Math.sin(-1.2) * 300).arc(620, 420, 300, -1.2, 0.6).stroke({ width: 40, color: TV.amberL, alpha: 0.7 });
      } else {
        // pointing at the kitten (shaking with insistence when Maneki doesn't see it)
        const jit = insist ? Math.sin(m * 30) * 8 : 0;
        tvArm(arm, head[0] + 40, head[1] + 240, 1180 + jit, 640, 64, 'point', 3, 0, -40);
      }
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
  };
};

// ================================================================== BITÁCORA — c30: your signature and the same hand · the chart (a hospital)
const bitacora: Make = (st, k) => {
  const root = new Container();
  const g = new Graphics();
  const pageC = new Container();
  const pg = new Graphics();
  const sigT = txt(k, 'el Capi', { fontFamily: 'Permanent Marker', fontSize: 96, fill: 0x2a3a8a });
  sigT.position.set(900, 640);
  sigT.rotation = -0.06;
  const margin = txt(k, 'sigue, sigue…', { fontFamily: 'Permanent Marker', fontSize: 52, fill: 0x2a3a8a });
  margin.position.set(400, 470);
  margin.rotation = -Math.PI / 2;
  pageC.addChild(pg, sigT, margin);
  const chart = new Container();
  const cg = new Graphics();
  card(cg, -560, -330, 1120, 660, 0xfdf8ea, 10);
  cg.rect(-560, -330, 1120, 110).fill(0xd8e8f0);
  const h1 = txt(k, 'HOSPITAL DEL ARCHIVO', { fontFamily: 'Anton', fontSize: 64, fill: TV.line, letterSpacing: 3 });
  h1.position.set(0, -275);
  const c1 = txt(k, 'PACIENTE: un mundo con gatos', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 52, fill: TV.line }, 0, 0.5);
  const c2 = txt(k, 'ESTADO: sanando', { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 52, fill: TV.green }, 0, 0.5);
  c1.position.set(-500, -80);
  c2.position.set(-500, 30);
  chart.addChild(cg, h1, c1, c2);
  chart.position.set(1040, 470);
  const boxes = new Graphics();
  const man = st.actor('tv', st.slugs.maneki, 380);
  const can = st.actor('tv', st.slugs.canelo, 560);
  root.addChild(g, pageC, chart, boxes);
  if (man) root.addChild(man);
  if (can) root.addChild(can);
  const HOSP = 42.909;
  let head: [number, number] = [1500, 700];
  return {
    twos: true,
    root,
    update(k, m, lt) {
      g.clear();
      backdrop(g, TV.nightD);
      pg.clear();
      card(pg, 300, 80, 1320, 920, 0xf6efe0, 10);
      pg.rect(460, 80, 4, 920).fill(0xd04040);
      for (let i = 0; i < 18; i++) pg.rect(490, 150 + i * 46, 1100, 3).fill({ color: 0x8fb0e0, alpha: 0.7 });
      for (let i = 0; i < 7; i++) pg.rect(520, 170 + i * 46, 600 + rnd(i) * 400, 8).fill({ color: TV.line, alpha: 0.35 });
      sigT.alpha = clamp01(lt / 0.25);
      margin.alpha = clamp01((lt - 0.3) / 0.25);
      // the page turns to the chart (c30.5): a hospital
      const flip = win(m, HOSP - 0.12, HOSP + 0.1);
      pageC.visible = flip < 0.5;
      chart.visible = flip >= 0.5;
      const sx = Math.abs(Math.cos(flip * Math.PI));
      pageC.scale.x = sx;
      pageC.x = 960 * (1 - sx);
      chart.scale.x = chart.visible ? sx : 0;
      // Maneki's broom sweeps boxes across the bottom (each box a patient)
      boxes.clear();
      if (chart.visible) {
        const b = m / k.beat;
        for (let i = 0; i < 7; i++) {
          const x = 2000 - ((m - HOSP) * 500 + i * 260);
          boxes.rect(x - 60, 900, 120, 100).fill(0xc9925a).stroke({ width: LW, color: TV.line });
          boxes.moveTo(x - 60, 900).lineTo(x - 80, 870).stroke({ width: 5, color: TV.line });
        }
        void b;
      }
      if (man) {
        man.visible = chart.visible;
        perform(st, k, man, m, { x: lerp(2100, 1500, easeOut((m - HOSP) / 0.4)), y: 1100, flip: false, lean: Math.sin(m * 12) * 0.3, look: -0.5, amp: 0.5 });
      }
      // Canelo peeks in from the corner, squinting at the margin (suspicious): the same hand…
      const peek = easeOutBack(win(lt, 0, 0.3), 1.5);
      perform(st, k, can, m, { x: lerp(1950, 1650, peek), y: 1230, rot: -0.18, lean: 0.4, headA: 0.14 + 0.04 * Math.sin(m * 3), look: -0.9, crouch: 0.1 });
      if (can?.puppet) can.puppet.emote('hurt', 0.35);
      head = headOf(can, [1600, 700]);
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
  };
};

// ================================================================== COLOSO — c31–32 (Hemkade: an engraved plate): chains of orders
const coloso: Make = (st, k) => {
  const outer = new Container();
  const root = new Container();
  outer.addChild(root);
  const plate = new Graphics();
  const lev = new Graphics();
  const chains = new Graphics();
  // the engraved plate's Canelo comes from the sepia bake itself (no filter: the crash-zoom would resize one every frame)
  const can = st.actor('sepia', st.slugs.canelo, 660);
  const castC = new Container();
  if (can) castC.addChild(can);
  const arm = new Graphics();
  castC.addChild(arm);
  const crack = new Graphics();
  root.addChild(plate, crack, lev, chains, castC);
  const tags = ['ORDEN', 'OBEDECE', 'BORRA', 'ORDEN'].map((t) => {
    const s = txt(k, t, { fontFamily: 'Anton', fontSize: 34, fill: 0x2a1a10 });
    root.addChild(s);
    return s;
  });
  const CH = [420, 860, 1260, 1560];
  let head: [number, number] = [860, 600];
  return {
    twos: true,
    root: outer,
    update(k, m, lt) {
      const free = clamp01(k.num('free', 0));
      const broke = m >= st.chainAt;
      const sinceB = broke ? m - st.chainAt : -1;
      // the engraved plate WARPS under the strain: its hatching bends around the Leviathan as he pulls on the chain
      const strain = broke ? Math.max(0, 1 - sinceB / 0.4) : win(m, 43.636, st.chainAt);
      plate.clear();
      backdrop(plate, 0xe9dcc0);
      for (let i = 0; i < 70; i++) {
        const y0 = i * 18;
        const pts: number[] = [];
        for (let x = -200; x <= 2200; x += 120) {
          const ly = 330 + Math.sin(((x - 120) / 1700) * Math.PI * 2 + m) * 70;
          const d = (y0 + ((x + 200) / 2400) * 40 - ly) / 160;
          pts.push(x, y0 + ((x + 200) / 2400) * 40 + strain * 46 * Math.sign(d) * Math.exp(-d * d));
        }
        plate.poly(pts, false).stroke({ width: 2, color: 0x3a2414, alpha: 0.12 + strain * 0.06 });
      }
      // the Leviathan, upside down: a long scaled body (engraved); straining against its chains; swimming away when free
      lev.clear();
      const ox = free * 1600;
      const pts: number[] = [];
      for (let i = 0; i <= 22; i++) {
        const t = i / 22;
        pts.push(120 + t * 1700 + ox, 330 + Math.sin(t * Math.PI * 2 + m * (1 + free * 3)) * (70 + (broke ? 30 : 0)));
      }
      lev.poly(pts, false).stroke({ width: 150, color: 0x5a3a24, cap: 'round' });
      lev.poly(pts, false).stroke({ width: 112, color: 0x8a6a48, cap: 'round' });
      // upside down: its dorsal fins point DOWN, engraved spikes along the belly line
      for (let i = 2; i < pts.length - 2; i += 2) {
        const x = pts[i];
        const y = pts[i + 1];
        lev.poly([x - 26, y + 60, x + 26, y + 60, x + 6, y + 120 + (i % 4) * 10]).fill(0x6a4a30).stroke({ width: 5, color: 0x3a2414 });
      }
      for (let i = 0; i < pts.length; i += 2) lev.moveTo(pts[i] - 22, pts[i + 1] - 34).lineTo(pts[i] + 22, pts[i + 1] + 34).stroke({ width: 4, color: 0x3a2414 });
      // the head (upside down): a long jaw, teeth, an eye that glares at the chains (free: it closes, relieved)
      const hx = 100 + ox;
      lev.ellipse(hx, 360, 160, 96).fill(0x8a6a48).stroke({ width: 8, color: 0x3a2414 });
      lev.poly([hx - 150, 380, hx - 300, 420, hx - 150, 440]).fill(0x8a6a48).stroke({ width: 6, color: 0x3a2414 });
      for (let t = 0; t < 5; t++) lev.poly([hx - 280 + t * 26, 416, hx - 268 + t * 26, 440, hx - 256 + t * 26, 418]).fill(0xf0e2c2).stroke({ width: 2, color: 0x3a2414 });
      lev.ellipse(hx - 40, 400, 26, free > 0.5 ? 4 : 20).fill(0xf0e2c2).stroke({ width: 4, color: 0x3a2414 });
      if (free <= 0.5) lev.circle(hx - 46, 402, 9).fill(0x2a1a10);
      lev.moveTo(hx - 80, 370).lineTo(hx - 10, 384).stroke({ width: 8, color: 0x3a2414 });
      // the chains of orders: his — the second — gets pulled taut, then SNAPS
      chains.clear();
      const pull = broke ? 0 : win(m, 43.636, st.chainAt);
      CH.forEach((x, i) => {
        if (free > 0.02) return;
        const mine = i === 1;
        if (mine && broke) return;
        const bx = mine ? x + pull * 120 : x;
        for (let y = -40; y < 300; y += 40) {
          const jx = mine ? Math.sin(m * 40 + y) * pull * 6 : 0;
          chains.ellipse(lerp(x, bx, (y + 40) / 340) + jx + (y % 80 ? 6 : -6), y, 18, 26).stroke({ width: 9, color: 0x3a2414 });
        }
        tags[i].position.set(bx + 46, 150);
      });
      tags.forEach((t, i) => (t.visible = free < 0.02 && !(i === 1 && broke)));
      // c32: the astral crack breathes; through it, the edge of a page
      crack.clear();
      if (free > 0.02) {
        const br = 1 + Math.sin(lt * 4) * 0.08;
        crack.poly([960, 120, 1000, 300 * br, 940, 420, 1010, 620 * br, 960, 860, 920, 620 * br, 980, 420, 900, 300 * br]).fill(0xfbf8f0).stroke({ width: 6, color: 0x8a6aff });
      }
      // Canelo: he grabs HIS chain and pulls (anticipation: crouch, lean back, shaking with effort) → SNAP: he flies
      // back on his tail (smear) → up, proud: «¡Yo solito!»
      const fly = broke ? easeOut(clamp01(sinceB / 0.2)) : 0;
      const proud = broke ? clamp01((sinceB - 0.3) / 0.2) : 0;
      perform(st, k, can, m, {
        x: 1000 - fly * 140 + proud * 60,
        y: 1230 + fly * 30 - proud * 30,
        flip: false,
        lean: broke ? lerp(-0.8, 0.0, proud) : -0.5 * pull,
        crouch: broke ? lerp(0.5, 0, proud) : 0.35 * pull,
        headA: broke ? lerp(0.2, -0.15, proud) : Math.sin(m * 30) * 0.05 * pull,
        look: -0.5,
        rot: broke ? lerp(0.35, 0, proud) : 0,
        sx: broke && sinceB < 0.08 ? 1.3 : 1,
        sy: broke && sinceB < 0.08 ? 0.78 : 1,
        amp: 0.7,
      });
      if (can?.puppet) can.puppet.emote(proud > 0.5 ? 'happy' : 'attack', proud > 0.5 ? 1 : pull);
      head = headOf(can, [880, 620]);
      arm.clear();
      // both paws on HIS chain, shaking with the effort; then one claw up, proud
      if (!broke) {
        const sh = Math.sin(m * 40) * 6 * pull;
        tvArm(arm, head[0] - 60, head[1] + 240, CH[1] + pull * 100 + sh, 300, 62, 'mitt', 3, 0, 30, FUR_SEPIA);
        tvArm(arm, head[0] + 40, head[1] + 250, CH[1] + pull * 110 - sh, 360, 58, 'mitt', 3, 0, -30, FUR_SEPIA);
      } else if (proud > 0.2 && free < 0.02) tvArm(arm, head[0] - 30, head[1] + 230, head[0] - 120, head[1] - 60, 60, 'claws', 1, 0xb0302a, 0, FUR_SEPIA);
      // the camera: a crash-zoom onto the snapping link (a scale jump), then back out to the whole colossus
      const crash = broke ? bell(clamp01(sinceB / 0.45)) : 0;
      root.pivot.set(lerp(960, CH[1], crash), lerp(540, 260, crash));
      root.position.set(960, 540);
      root.scale.set(lerp(1, 1.7, crash));
    },
    anchor(name, k) {
      const z = root.scale.x;
      const to = (x: number, y: number) => scr(k, 960 + (x - root.pivot.x) * z, 540 + (y - root.pivot.y) * z);
      if (name === 'canelo') return to(head[0], head[1]);
      if (name === 'chain') return to(CH[1], 200);
      return null;
    },
  };
};

export const SCENES2: Record<string, Make> = { almirante, neon, corona, cometa, kitten, bitacora, coloso };
export type { Kit };
// kept for the ones that use them through this module
export { Silueta, mix, easeIn };
