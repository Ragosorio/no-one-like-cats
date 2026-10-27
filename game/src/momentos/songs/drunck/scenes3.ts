/**
 * «DRUNCK» — the edge and the page (c33–c48), polished (docs/part-iii/13 §3.3):
 *   acuarela (c33–36, ANIMATIC: four memories that bleed into each other like wet watercolor) · feria (c37–38, FUNCIÓN DE
 *   FERIA 1930: black and white and symmetric until his burp, then COLOR breaks out of his mouth in a wave) · umbral
 *   (c39, LEGIBLE: the three sides, one per beat, each in its style and named — he counts them on his claws) · baja (c40,
 *   the breath, LEGIBLE: the page comes down by your lighthouse and everyone follows it) · ojos (c40.75: everyone turns
 *   to look at him — their shadows from the real paintings, eyes lit, §2.2) · pagina (c41–46, LEGIBLE: lying on the
 *   page, the nights pass, every side waits in a bubble, the bottom of the glass multiplies their eyes, HIS FACE) ·
 *   espiral (c46.4: he gets up, the cat flap, the slide).
 */
import { TwistFilter } from 'pixi-filters';
import { ColorMatrixFilter, Container, Graphics, type Sprite } from 'pixi.js';
import type { Kit } from '../../anime/kit';
import type { Actor } from '../../anime/actor';
import { backdrop, bands, bell, capiPick, card, clamp01, easeIn, easeInOut, easeOut, easeOutBack, glow, headOf, lerp, perform, rnd, scr, tvArm, twinkle, txt, win, type Make } from './drawkit';
import { LW, TV } from './tv';
import { Silueta } from './silueta';

const GRAPHITE = 0x34343c;
const PAPER = 0xf4ecdc;

/** a wobbly pencil line (it boils on twos: the seed changes 12 times a second) */
function pencil(g: Graphics, pts: number[], seed: number, width = 3, color = GRAPHITE, alpha = 0.8) {
  for (let pass = 0; pass < 2; pass++) {
    const out: number[] = [];
    for (let i = 0; i < pts.length; i += 2) out.push(pts[i] + (rnd(seed + i + pass * 31) - 0.5) * 5, pts[i + 1] + (rnd(seed + i + 7 + pass * 17) - 0.5) * 5);
    g.poly(out, false).stroke({ width: width - pass, color, alpha: alpha - pass * 0.3, cap: 'round', join: 'round' });
  }
}
/** a watercolor wash: soft overlapping blots with a darker wet edge */
function wash(g: Graphics, x: number, y: number, r: number, color: number, seed: number, a = 0.18) {
  for (let i = 0; i < 4; i++) g.circle(x + (rnd(seed + i) - 0.5) * r * 0.5, y + (rnd(seed + i + 9) - 0.5) * r * 0.4, r * (0.6 + rnd(seed + i + 3) * 0.3)).fill({ color, alpha: a });
  g.circle(x, y, r * 0.95).stroke({ width: 4, color, alpha: a });
}
function circlePts(x: number, y: number, r: number) {
  const out: number[] = [];
  for (let i = 0; i <= 16; i++) out.push(x + Math.cos((i / 16) * Math.PI * 2) * r, y + Math.sin((i / 16) * Math.PI * 2) * r);
  return out;
}

// ================================================================== ACUARELA — c33–36 (YONOSE TODO: ANIMATIC)
const acuarela: Make = (st, k) => {
  const outer = new Container();
  const root = new Container();
  outer.addChild(root);
  const g = new Graphics();
  const cats = st.slugs.island.map((s) => st.actor('animatic', s, 330));
  const can = st.actor('animatic', st.slugs.canelo, 400);
  root.addChild(g);
  for (const c of cats) if (c) root.addChild(c);
  if (can) root.addChild(can);
  const fg = new Graphics();
  root.addChild(fg);
  const sorry = txt(k, 'Lo siento', { fontFamily: 'Permanent Marker', fontSize: 100, fill: GRAPHITE });
  const regret = txt(k, 'No me arrepiento', { fontFamily: 'Permanent Marker', fontSize: 100, fill: GRAPHITE });
  sorry.position.set(1060, 420);
  regret.position.set(1060, 600);
  const bleed = new Graphics();
  root.addChild(sorry, regret);
  // the wet bleed between memories sits over the camera (screen space)
  outer.addChild(bleed);
  const SPOTS: [number, number][] = [
    [380, 900],
    [760, 940],
    [1520, 910],
  ];
  const SUBS = [46.545, 48.0, 49.455, 50.909];
  let head: [number, number] = [1100, 600];
  let lastStep = -1;
  return {
    twos: true,
    root: outer,
    update(k, m, lt) {
      // ON TWOS (restarting on the beat): nothing here needs 60 redraws a second
      const stp = k.beatStep(m);
      if (stp === lastStep) return;
      lastStep = stp;
      const sub = Math.round(k.num('sub', 0));
      const seed = Math.floor(m * 12) * 101;
      g.clear();
      fg.clear();
      bleed.clear();
      backdrop(g, PAPER);
      for (let i = 0; i < 60; i++) g.circle(rnd(i) * 1920, rnd(i + 5) * 1080, 2).fill({ color: 0xd8ccb4, alpha: 0.6 });
      sorry.visible = regret.visible = sub === 3;
      const showCats = sub === 0 || sub === 1;
      cats.forEach((c) => c && (c.visible = showCats));
      const breath = 1 + Math.sin(m * 2.4) * 0.04;
      const ls = m - (SUBS[sub] ?? m);
      if (showCats) {
        for (let i = 0; i < 10; i++) g.ellipse(100 + i * 200, 180 + rnd(i) * 60, 260, 90).fill({ color: 0x9ab4d0, alpha: 0.12 });
        for (let i = 0; i < 10; i++) g.ellipse(100 + i * 200, 1000 + rnd(i + 3) * 40, 260, 120).fill({ color: 0x5a8ac8, alpha: 0.16 });
        for (let i = 0; i < 7; i++) g.ellipse(360 + i * 200, 930 + rnd(i + 7) * 20, 240, 80).fill({ color: 0x8ac87a, alpha: 0.2 });
        pencil(g, [60, 920, 500, 880, 960, 900, 1400, 870, 1860, 920], seed, 4);
        cats.forEach((c, i) => {
          if (!c) return;
          if (c.puppet) c.puppet.sleeping = true;
          c.pose(m, SPOTS[i][0], SPOTS[i][1], { sy: breath, sx: 1 / breath, flip: i === 2, step: Math.floor(m * 12) });
        });
        if (sub === 0) {
          // c33: everyone sleeps and breathes AT ONCE; ONE dream bubble rises out of all of them (lines from every head)
          const by = 520 - easeOut(ls / 1.2) * 300;
          for (const [x, y] of [...SPOTS, [1120, 930] as [number, number]]) pencil(fg, [x, y - 300, lerp(x, 1100, 0.5), lerp(y - 300, by + 110, 0.6), 1100, by + 110], seed + x, 2, GRAPHITE, 0.5);
          pencil(fg, circlePts(1100, by, 120 + Math.sin(m * 3) * 6), seed + 3, 3);
          wash(fg, 1100, by, 110, 0xe07a5a, 11);
          // the shared dream: a little lighthouse
          pencil(fg, [1080, by + 60, 1086, by - 40, 1114, by - 40, 1120, by + 60], seed + 5, 3);
          wash(fg, 1100, by - 50, 26, 0xffc04a, 7, 0.4);
        } else {
          // c34 the Echoes: hats, sand, scars they didn't have (one per beat); every footprint leads to ONE island
          const nOn = 1 + Math.floor(ls / k.beat);
          const hats: [number, number, number][] = [
            [SPOTS[0][0], SPOTS[0][1] - 330, 0xe07a5a],
            [SPOTS[1][0], SPOTS[1][1] - 330, 0x5a8ac8],
            [SPOTS[2][0], SPOTS[2][1] - 330, 0xc8a05a],
          ];
          hats.forEach(([x, y, c], i) => {
            if (i >= nOn) return;
            wash(fg, x, y, 60, c, x);
            pencil(fg, [x - 70, y + 24, x + 70, y + 24, x + 36, y - 46, x - 36, y - 46, x - 70, y + 24], seed + x, 3);
          });
          for (let i = 0; i < 18; i++) {
            const q = i / 17;
            if (q > clamp01(ls / 1.1)) break;
            const x = lerp(760, 1760, q);
            const y = lerp(1000, 360, q) + Math.sin(i * 1.3) * 22;
            fg.ellipse(x + (i % 2 ? 10 : -10), y, 12, 8).fill({ color: GRAPHITE, alpha: 0.6 });
          }
          wash(fg, 1780, 330, 110, 0x8ac87a, 19);
          pencil(fg, [1660, 344, 1780, 290, 1900, 344], seed + 5, 3);
        }
      }
      if (can) {
        can.visible = sub !== 3 || true;
        // Canelo: asleep with them (c33) → wakes and follows the footprints with his eyes (c34) → shivers before the
        // empty island (c35) → reads the page (c36)
        const sh = sub === 2 ? Math.sin(m * 50) * 4 : 0;
        if (can.puppet) can.puppet.sleeping = sub === 0;
        const P = [
          { x: 1120, y: 940, lean: 0, look: 0, headA: 0.1 },
          { x: 1120, y: 940, lean: 0.3, look: 0.8, headA: -0.12 },
          { x: 300 + sh, y: 1090, lean: -0.35, look: 0.6, headA: 0.12, crouch: 0.35 },
          { x: 300, y: 1090, lean: 0.4, look: 0.8, headA: 0.08 },
        ][sub];
        perform(st, k, can, m, { ...P, flip: true, sy: sub === 0 ? breath : 1, sx: sub === 0 ? 1 / breath : 1, amp: 0.3 });
        if (can.puppet && sub === 2) can.puppet.emote('hurt', 0.7);
        head = headOf(can, [1100, 600]);
      }
      if (sub === 2) {
        // c35 a sepia photo: YOUR island, empty — no cats (the version where you never arrived)
        card(g, 520, 140, 1100, 760, 0xe9d8b4, 4, 0x6a4a30);
        g.rect(560, 180, 1020, 680).fill(0xd6c094);
        g.ellipse(1070, 720, 360, 76).fill(0xb08a5a);
        g.poly([1030, 710, 1045, 440, 1095, 440, 1110, 710]).fill(0xe9d8b4).stroke({ width: 4, color: 0x6a4a30 });
        g.poly([1025, 440, 1070, 400, 1115, 440]).fill(0x8a6a48);
        for (let i = 0; i < 30; i++) g.circle(560 + rnd(i + (seed % 7)) * 1020, 180 + rnd(i + 3) * 680, 2).fill({ color: 0x6a4a30, alpha: 0.4 });
      } else if (sub === 3) {
        // c36 a blank page with strikethroughs: «~~Lo siento~~ No me arrepiento» (her hand)
        card(g, 520, 180, 1100, 720, 0xfbf8f0, 4, 0xb8b0a0);
        const q = clamp01(ls / 0.4);
        pencil(fg, [sorry.x - sorry.width / 2 - 10, 432, lerp(sorry.x - sorry.width / 2, sorry.x + sorry.width / 2 + 10, q), 412], seed, 9, GRAPHITE, 0.95);
        regret.alpha = clamp01((ls - 0.4) / 0.3);
      }
      // the camera per memory (a scale jump inside each): c33 still · c34 it travels along the footprints and dives
      // into THE island they all lead to · c35 the empty-island photo looms over him · c36 it leans in to read
      const cz = sub === 1 ? easeInOut(clamp01(ls / 1.3)) : sub === 2 ? easeOut(clamp01(ls / 1.2)) : sub === 3 ? easeOut(clamp01(ls / 0.6)) : 0;
      const target: [number, number, number] = sub === 1 ? [1700, 420, 1.8] : sub === 2 ? [1060, 520, 1.3] : sub === 3 ? [1000, 520, 1.15] : [960, 540, 1];
      root.pivot.set(lerp(960, target[0], cz), lerp(540, target[1], cz));
      root.position.set(960, 540);
      root.scale.set(lerp(1, target[2], cz));
      root.rotation = sub === 2 ? -0.04 * cz : 0;
      // the bleed between memories: a wet wash sweeps across at every change (wet-on-wet, never a hard cut)
      const since = ls;
      if (sub > 0 && since < 0.3) {
        const q = since / 0.3;
        const x = lerp(-400, 2300, q);
        const col = [0x9ab4d0, 0xe07a5a, 0xc8a05a, 0x8ac87a][sub];
        for (let i = 0; i < 8; i++) bleed.ellipse(x - i * 90, 120 + i * 120, 420, 220).fill({ color: col, alpha: 0.32 * bell(q) });
      }
      void lt;
    },
    anchor(name, k) {
      const z = root.scale.x;
      if (name === 'canelo') return scr(k, 960 + (head[0] - root.pivot.x) * z, 540 + (head[1] - root.pivot.y) * z);
      return null;
    },
  };
};

// ================================================================== FERIA — c37–38 (CIRCUS MALUS: 1930, symmetric) — the burp
const feria: Make = (st, k) => {
  const root = new Container();
  const g = new Graphics();
  const tach: (Actor | null)[] = [-1, 1].map(() => st.actor('toon', st.slugs.tachon, 420));
  const can = st.actor('toon', st.slugs.canelo, 460);
  const film = new Graphics();
  root.addChild(g);
  for (const a of tach) if (a) root.addChild(a);
  if (can) root.addChild(can);
  root.addChild(film);
  let head: [number, number] = [960, 560];
  let lastStep = -1;
  return {
    root,
    update(k, m) {
      const burped = m >= st.burpAt;
      const sb = burped ? m - st.burpAt : -1;
      // the color wave (the stage's post) runs smooth: out of his mouth, growing to the whole frame
      const waveR = burped ? easeIn(sb / 0.9) * 2.4 : 0;
      {
        const [wx, wy] = scr(k, head[0] + 40, head[1] + 40);
        st.waveAt = k.reduceMotion ? { x: wx, y: wy, r: burped ? 3 : 0, amt: burped ? 1 - clamp01(sb / 0.4) : 1 } : { x: wx, y: wy, r: waveR, amt: waveR >= 2.2 ? 0 : 1 };
      }
      // ON TWOS (restarting on the beat): nothing here needs 60 redraws a second
      const stp = k.beatStep(m);
      if (stp === lastStep) return;
      lastStep = stp;

      const tilt = burped ? Math.min(1, sb / 0.3) : 0;
      g.clear();
      backdrop(g, 0xf0e6d0);
      for (let i = -9; i < 9; i++) {
        const x0 = 960 + i * 130;
        g.poly([960, 20, x0, 760, x0 + 130, 760]).fill(i % 2 ? 0xc0302a : 0xf6efe0).stroke({ width: 4, color: 0x141010 });
      }
      g.rect(-1600, 900, 5120, 600).fill(0x6a4a30);
      g.ellipse(960, 920, 700, 60).fill(0x8a6a48).stroke({ width: 4, color: 0x141010 });
      for (let i = 0; i < 14; i++) {
        const x = 180 + i * 120;
        const sag = burped ? (i - 6.5) * 14 * tilt : 0;
        g.poly([x - 44, 110 + sag, x + 44, 110 + sag, x, 186 + sag]).fill(i % 2 ? 0xf0c040 : 0x2a9a9a).stroke({ width: 3, color: 0x141010 });
      }
      // everything hops IN UNISON on the beat (rubber hose) — mirrored, perfect; after the burp it all goes crooked
      const hop = Math.abs(Math.sin((m / k.beat) * Math.PI));
      tach.forEach((a, i) => {
        const side = i ? 1 : -1;
        perform(st, k, a, m, { x: 960 + side * 520, y: 940 - hop * 40 * (1 - tilt), flip: side > 0, rot: tilt * side * 0.3, lean: tilt * -0.5, headA: tilt * side * 0.2, look: tilt ? -side : 0, amp: 0 });
        if (a?.puppet && burped && sb < 0.6) a.puppet.emote('surprise', 1);
      });
      // Canelo: hops with them (rubber hose) … cheeks puff (anticipation) … ¡BUURP! (the stretch, the recoil)
      const puff = win(m, st.burpAt - 0.25, st.burpAt);
      const recoil = burped ? Math.exp(-sb / 0.15) : 0;
      perform(st, k, can, m, {
        x: 960,
        y: 950 - hop * 40 * (burped ? 0 : 1),
        sx: 1 + puff * 0.12 - recoil * 0.08,
        sy: 1 - puff * 0.06 + recoil * 0.18,
        headA: burped ? -0.25 * recoil : 0,
        headDy: -recoil * 14,
        lean: burped ? -0.3 * recoil : 0,
        rot: burped ? Math.sin(sb * 20) * 0.08 * (1 - tilt) : 0,
        amp: 0,
      });
      head = headOf(can, [960, 560]);
      // 1930's film: grain and scratches (until the color has filled the frame)
      film.clear();
      const fr = Math.floor(m * 24);
      if (waveR < 2) {
        for (let i = 0; i < 4; i++) film.rect(rnd(fr * 7 + i) * 1920, -40, 2, 1200).fill({ color: 0x141010, alpha: 0.25 });
        for (let i = 0; i < 30; i++) film.circle(rnd(fr * 3 + i) * 1920, rnd(fr * 5 + i) * 1080, 2).fill({ color: 0x141010, alpha: 0.4 });
      }
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
  };
};

// ================================================================== UMBRAL — c39 (LEGIBLE): «Tres bandos.»
/**
 * The Threshold: Bisagra, the door-cat, in the middle. The three sides arrive ONE PER BEAT, each owning a third of the
 * frame in its own style and named on a small card (scene B names them again): LOS BLANCOS (correction white: straight,
 * perfect, everything whitened) · LOS GRAFITEROS (spray that drips) · LAS MANOS DE LUZ (threads of light from above,
 * two hands). Canelo counts them on his claws.
 */
const umbral: Make = (st, k) => {
  const root = new Container();
  const g = new Graphics();
  const white = new Graphics();
  const grafG = new Graphics();
  const light = new Graphics();
  const emb = st.actor('toon', st.slugs.tachon, 380);
  const embC = new Container();
  if (emb) embC.addChild(emb);
  const bre = st.actor('comic', st.slugs.brecha, 330);
  const bis = st.actor('tv', st.slugs.bisagra, 340);
  const can = st.actor('tv', st.slugs.canelo, 460);
  const arm = new Graphics();
  const labels = ['LOS BLANCOS', 'LOS GRAFITEROS', 'LAS MANOS DE LUZ'].map((t, i) => {
    const s = txt(k, t, { fontFamily: 'Bangers', fontSize: 50, fill: [0x2e3440, TV.white, 0x5a4a10][i], letterSpacing: 2 });
    return s;
  });
  const labG = new Graphics();
  const tag = txt(k, 'ABRAN', { fontFamily: 'Permanent Marker', fontSize: 110, fill: 0xff2e88, stroke: { color: TV.line, width: 8 } });
  tag.position.set(960, 360);
  root.addChild(g, white, grafG, light, tag);
  if (bis) root.addChild(bis);
  root.addChild(embC);
  if (bre) root.addChild(bre);
  if (can) root.addChild(can);
  root.addChild(arm, labG, ...labels);
  const T0 = 55.273;
  let head: [number, number] = [960, 700];
  let lastStep = -1;
  return {
    twos: true,
    root,
    update(k, m) {
      // ON TWOS (restarting on the beat): nothing here needs 60 redraws a second
      const stp = k.beatStep(m);
      if (stp === lastStep) return;
      lastStep = stp;
      const lt = m - T0;
      // before c39 (the line «Tres bandos.»): the empty threshold, Bisagra waiting, Canelo with a fist up
      const on = [0, 1, 2].map((i) => easeOutBack(win(lt, i * k.beat, i * k.beat + 0.16), 1.6));
      g.clear();
      bands(g, [0x1a1430, 0x221a40, 0x2a2050], -1000, 2100);
      // Bisagra's door, the threshold itself
      g.roundRect(860, 140, 200, 360, 12).fill(0x120a1e).stroke({ width: LW, color: TV.amberL });
      perform(st, k, bis, m, { x: 960, y: 520, look: lerp(0, -0.6, on[0]) + lerp(0, 1.2, on[2]) * 0.5, amp: 0.5 });
      // 1 · LOS BLANCOS: the left third washed white, perfect lines, white ships, a whitened Corrector
      white.clear();
      if (on[0] > 0.01) {
        const w = 640 * clamp01(on[0]);
        white.rect(-1600, -1000, 1600 + w, 3200).fill({ color: 0xf4f6fb, alpha: 0.92 });
        for (let i = 0; i < 9; i++) white.moveTo(-200, 120 + i * 100).lineTo(w, 120 + i * 100).stroke({ width: 2, color: 0xc9d3e6 });
        for (let i = 0; i < 3; i++) {
          const x = 120 + i * 170;
          const y = 640 + i * 40;
          white.poly([x - 110, y, x + 110, y, x + 80, y + 56, x - 80, y + 56]).fill(0xffffff).stroke({ width: 3, color: 0xc9d3e6 });
          white.poly([x, y - 150, x, y - 4, x + 84, y - 10]).fill(0xffffff).stroke({ width: 3, color: 0xc9d3e6 });
        }
      }
      embC.visible = on[0] > 0.05;
      perform(st, k, emb, m, { x: 380, y: 1000, lean: -0.2, look: 0.6, alpha: clamp01(on[0]), amp: 0.3 });
      // 2 · LOS GRAFITEROS: spray drips over the middle, ABRAN, Brecha with her crowbar
      grafG.clear();
      tag.visible = on[1] > 0.01;
      tag.scale.set(clamp01(on[1]));
      if (on[1] > 0.01) {
        for (let i = 0; i < 10; i++) grafG.roundRect(760 + i * 44, 400, 12, 30 + (lt - k.beat) * 110 * (0.5 + rnd(i)), 6).fill(i % 2 ? 0xff2e88 : 0x00e5ff);
        for (let i = 0; i < 40; i++) grafG.circle(700 + rnd(i) * 520, 600 + rnd(i + 3) * 400, 5).fill({ color: 0xff2e88, alpha: 0.35 });
      }
      if (bre) {
        bre.visible = on[1] > 0.05;
        perform(st, k, bre, m, { x: 1150, y: 900, flip: true, lean: 0.4 * Math.sin(m * 4), look: -0.5, alpha: clamp01(on[1]), amp: 0.8 });
      }
      // 3 · LAS MANOS DE LUZ: threads of light from above (the right third), two hands of light at their ends
      light.clear();
      if (on[2] > 0.01) {
        const a = clamp01(on[2]);
        for (let i = 0; i < 9; i++) {
          const x = 1340 + i * 64;
          light.moveTo(x, -100).bezierCurveTo(x + Math.sin(m * 2 + i) * 40, 300, x - 30, 520, x + Math.sin(m + i) * 20, 680 * a).stroke({ width: 3, color: 0xfff6c0, alpha: 0.85 });
        }
        for (const [hx, hy, s] of [[1480, 640, 1], [1720, 600, -1]] as [number, number, number][]) {
          glow(light, hx, hy * a, 90, 0xfff6c0, 0.5);
          light.ellipse(hx, hy * a, 46, 56).stroke({ width: 5, color: 0xfff6c0, alpha: a });
          for (let f = 0; f < 4; f++) light.roundRect(hx - 40 + f * 22 + s * 4, hy * a - 100, 14, 54, 7).stroke({ width: 4, color: 0xfff6c0, alpha: a });
        }
      }
      // the name cards (calm boxes, legible)
      labG.clear();
      labels.forEach((s, i) => {
        s.visible = on[i] > 0.05;
        const x = [330, 960, 1600][i];
        const y = 980;
        s.position.set(x, y);
        s.scale.set(clamp01(on[i]));
        if (s.visible) labG.roundRect(x - s.width / 2 - 20, y - 36, s.width + 40, 72, 14).fill([0xffffff, 0xff2e88, 0xfff6c0][i]).stroke({ width: LW, color: TV.line });
      });
      // Canelo in front, counting them on his claws (one per beat)
      const n = on[2] > 0.05 ? 3 : on[1] > 0.05 ? 2 : on[0] > 0.05 ? 1 : 0;
      perform(st, k, can, m, { x: 860, y: 1170, flip: true, lean: 0.1, look: [-0.8, 0, 0.8][n - 1], headA: -0.06, amp: 0.6 });
      head = headOf(can, [960, 800]);
      arm.clear();
      tvArm(arm, head[0] + 50, head[1] + 210, head[0] + 230, head[1] + 20, 54, n ? 'claws' : 'mitt', Math.max(1, n));
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
  };
};

// ================================================================== BAJA — c40 (the breath, LEGIBLE): the page comes down by YOUR lighthouse
const baja: Make = (st, k) => {
  const root = new Container();
  const view = new Container();
  root.addChild(view);
  const g = new Graphics();
  const pg = new Graphics();
  const can = st.actor('tv', st.slugs.canelo, 300);
  view.addChild(g);
  if (can) view.addChild(can);
  view.addChild(pg);
  // closer on your lighthouse (the page lands by it, he follows it down): the camera eases in during the breath
  const Z = (lt: number) => lerp(1.35, 1.55, easeOut(lt / 1.1));
  // his rim of light from the lighthouse (painted + rim: «modo borde» of the silhouette rule, for separation at night)
  const rim = can?.puppet ? new Silueta(can.puppet, { light: { dir: [-1, -0.4], color: TV.amberL, width: 4 }, halo: { color: TV.amberL, alpha: 0.35 }, rimRest: 1 }) : null;
  let head: [number, number] = [1000, 640];
  let pagePt: [number, number] = [1100, 400];
  let lastStep = -1;
  return {
    twos: true,
    root,
    destroy: () => rim?.destroy(),
    update(k, m, lt) {
      // ON TWOS (restarting on the beat): nothing here needs 60 redraws a second
      const stp = k.beatStep(m);
      if (stp === lastStep) return;
      lastStep = stp;
      g.clear();
      bands(g, [0x070a1e, 0x0b1030, 0x101844], -1000, 760);
      bands(g, [0x0e1838, 0x0a1230, 0x060c22], 760, 2100);
      for (let i = 0; i < 40; i++) twinkle(g, rnd(i) * 1920, rnd(i + 3) * 700, 3 + rnd(i + 1) * 5, TV.cream, 0.8);
      // the three sides at the edges, small, all looking up at the page: white ships (left), graffiti drips on the
      // rocks, threads of light (right)
      for (let i = 0; i < 3; i++) g.poly([60 + i * 120, 760, 160 + i * 120, 760, 140 + i * 120, 790, 80 + i * 120, 790]).fill(0xffffff);
      for (let i = 0; i < 6; i++) g.moveTo(1640 + i * 40, -60).lineTo(1640 + i * 40 + Math.sin(m + i) * 20, 360).stroke({ width: 2, color: 0xfff6c0, alpha: 0.7 });
      g.ellipse(860, 790, 480, 70).fill(0x1d2a48).stroke({ width: LW, color: TV.line });
      for (let i = 0; i < 5; i++) g.roundRect(620 + i * 30, 790, 8, 40 + rnd(i) * 40, 4).fill(0xff2e88);
      g.poly([780, 780, 800, 440, 880, 440, 900, 780]).fill(TV.cream).stroke({ width: LW, color: TV.line });
      for (let i = 0; i < 3; i++) g.rect(792 + i * 4, 520 + i * 90, 96 - i * 8, 30).fill(TV.pinkD);
      g.rect(790, 400, 100, 44).fill(TV.amberL).stroke({ width: LW, color: TV.line });
      g.poly([780, 400, 840, 350, 900, 400]).fill(TV.pinkD).stroke({ width: LW, color: TV.line });
      glow(g, 840, 420, 260, TV.amberL, 0.35);
      const z = Z(lt);
      view.pivot.set(940, 560);
      view.position.set(960, 540);
      view.scale.set(z);
      // the blank page, swaying down like a leaf, settling by the lighthouse (beside him, never on him)
      const q = easeOut(lt / 1.0);
      const x = lerp(1380, 1260, q) + Math.sin(lt * 4) * 60 * (1 - q);
      const y = lerp(80, 770, q);
      const r = Math.sin(lt * 3) * 0.4 * (1 - q) + q * -0.08;
      const c = Math.cos(r);
      const s = Math.sin(r);
      const w = 130;
      const h = 86;
      pg.clear();
      pg.poly([x - w * c + h * s, y - w * s - h * c, x + w * c + h * s, y + w * s - h * c, x + w * c - h * s, y + w * s + h * c, x - w * c - h * s, y - w * s + h * c]).fill(0xfbf8f0).stroke({ width: 4, color: 0xd8d0c0 });
      glow(pg, x, y, 160, 0xffffff, 0.25);
      pagePt = [960 + (x - 940) * z, 540 + (y - 560) * z];
      // Canelo by his lighthouse looks up and follows it down
      perform(st, k, can, m, { x: 960, y: 790, flip: true, look: 0.5, headA: lerp(-0.22, 0.12, q), headDy: lerp(-6, 4, q), amp: 0 });
      if (rim) rim.update(0);
      const hd = headOf(can, [990, 620]);
      head = [960 + (hd[0] - 940) * z, 540 + (hd[1] - 560) * z];
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      if (name === 'page') return scr(k, pagePt[0], pagePt[1]);
      // the mash's prompt sits in the sky, never on his face
      if (name === 'center') return [960, 170];
      return null;
    },
  };
};

// ================================================================== OJOS — c40.75 → c41: everyone turns to look at Canelo
/**
 * In the dark, the cast as SHADOWS from their real paintings (silueta.ts, §2.2): the Correctors, the Disruptors,
 * Bisagra, Maneki, your cats — rim-lit from him (he's the light everyone's looking at), eyes LIT. On the roll they
 * all turn to him; with every hiccup of the mash their eyes blink.
 */
const ojos: Make = (st, k) => {
  const root = new Container();
  const g = new Graphics();
  const ring = new Container();
  const who = [st.slugs.tachon, st.slugs.brecha, st.slugs.bisagra, st.slugs.maneki, st.slugs.tachon, st.slugs.astral];
  const SP: [number, number, number, boolean][] = [
    [260, 520, 360, false],
    [560, 1080, 420, false],
    [960, 330, 300, false],
    [1660, 520, 360, true],
    [1360, 1080, 420, true],
    [1900, 1000, 340, true],
  ];
  const cast: { a: Actor; s: Silueta | null }[] = [];
  who.forEach((slug, i) => {
    const a = st.actor('tv', slug, SP[i][2]);
    if (!a) return;
    ring.addChild(a);
    const s = a.puppet ? new Silueta(a.puppet, { body: 0x1d1430, light: { dir: [SP[i][3] ? -1 : 1, 0.2], color: TV.amberL, width: 4 }, eyes: 'glow', eyeColor: [0xffffff, 0xff2e88, 0xfff6c0, 0x9fe8ff, 0xffffff, 0xd8ccff][i], halo: { color: 0x58306a, alpha: 0.45 } }) : null;
    cast.push({ a, s });
  });
  const can = st.actor('tv', st.slugs.canelo, 420);
  root.addChild(g, ring);
  if (can) root.addChild(can);
  const capi = new Graphics();
  root.addChild(capi);
  let lastBlink = -1;
  let head: [number, number] = [980, 560];
  return {
    twos: true,
    root,
    destroy: () => cast.forEach(({ s }) => s?.destroy()),
    update(k, m, lt) {
      g.clear();
      backdrop(g, 0x120c22);
      glow(g, 960, 760, 520, TV.amberL, 0.3);
      const p = k.prompt('hichichic');
      const taps = p ? ((p as unknown as { taps?: number }).taps ?? 0) : 0;
      const turn = easeOutBack(clamp01(lt / 0.14), 1.6);
      cast.forEach(({ a, s }, i) => {
        const [x, y, , right] = SP[i];
        perform(st, k, a, m, { x, y, flip: right, look: lerp(0.8, 0, turn) * (right ? 1 : -1) + turn * 0.9, lean: 0.2 * turn, amp: 0 });
        if (taps !== lastBlink) a.puppet?.blink();
        if (s) {
          s.k = 1;
          s.update(0);
        }
      });
      lastBlink = taps;
      // a balloon with the silhouette of the Capi's hand
      capi.clear();
      capi.ellipse(1560, 160, 160, 96).fill(TV.white).stroke({ width: LW, color: TV.line });
      capi.roundRect(1510, 132, 100, 70, 24).fill(0x8a8fb0);
      for (let i = 0; i < 4; i++) capi.roundRect(1515 + i * 24, 94, 18, 50, 9).fill(0x8a8fb0);
      // Canelo in the middle of all those eyes: frozen, a hiccup squash on every tap
      const hic = taps % 2 === 1 ? 1 : 0;
      perform(st, k, can, m, { x: 960, y: 980, flip: true, crouch: 0.2 + hic * 0.15, headDy: -hic * 10, look: 0.2, sy: 1 + hic * 0.06, amp: 0 });
      if (can?.puppet) can.puppet.emote('surprise', 1);
      head = headOf(can, [980, 600]);
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      if (name === 'center') return [960, 360];
      return null;
    },
  };
};

// ================================================================== PÁGINA — c41–46 (LEGIBLE): «Todos miran. Todos esperan. A mí.»
/**
 * THE central connection. Lying on the page by your lighthouse (the nights pass one per beat, its beam sweeping), while
 * every side closes in from the edges IN ITS OWN STYLE, each with its own eyes on him and its own bubble: the white
 * correction floods in from the left (a white Corrector leaning in: «¿PERFECTO?»), graffiti drips run down from the
 * right (Brecha leaning in with her crowbar: «¿ROMPERLO?»), threads of light come down from above (two hands of light:
 * «…»), and the Capi's bubble (H64's mentira:*) with the silhouette of his hand. They advance beat by beat (`press`);
 * the bottom of the glass multiplies their eyes (never over his face); then the camera comes to HIS FACE and holds,
 * the presences still at the edges of the frame. Text over calm sky.
 */
const pagina: Make = (st, k) => {
  const root = new Container();
  // screen space, behind: the night sea and your lighthouse far off
  const sky = new Graphics();
  const beam = new Graphics();
  root.addChild(sky, beam);
  // the camera that comes to his face (c46): the page and him
  const view = new Container();
  root.addChild(view);
  const page = new Graphics();
  const can = st.actor('tv', st.slugs.canelo, 560);
  const sweat = new Graphics();
  view.addChild(page);
  if (can) view.addChild(can);
  view.addChild(sweat);
  // the presences (screen space: they stay at the edges while the camera pushes in)
  const whiteG = new Graphics();
  const whiteF = new ColorMatrixFilter();
  whiteF.greyscale(0.9, false);
  whiteF.brightness(1.4, true);
  const cor = st.actor('toon', st.slugs.tachon, 600);
  const corC = new Container();
  if (cor) corC.addChild(cor);
  // (white by its own 1930 bake — no filter: it slides in from the edge, a filter would resize every beat)
  const grafG = new Graphics();
  const bre = st.actor('comic', st.slugs.brecha, 560);
  const lightG = new Graphics();
  const tag = txt(k, '¡ABRAN!', { fontFamily: 'Permanent Marker', fontSize: 70, fill: 0xff2e88, stroke: { color: TV.line, width: 7 } });
  tag.rotation = 0.12;
  root.addChild(whiteG, corC, grafG, tag, lightG);
  if (bre) root.addChild(bre);
  // the bubbles, each tied to its owner
  const pick = capiPick();
  const capiText = pick === 'perfecto' ? 'UN MUNDO PERFECTO' : pick === 'romper' ? 'ROMPAN TODO' : pick === 'nada' ? 'NADA' : '…';
  const bubbles = new Container();
  const bg = new Graphics();
  bubbles.addChild(bg);
  const B = [
    { x: 400, y: 250, t: '¿PERFECTO?', fill: 0xffffff, ink: 0x2e3440, tail: [180, 560] as [number, number] },
    { x: 1580, y: 300, t: '¿ROMPERLO?', fill: 0xff2e88, ink: TV.line, tail: [1720, 560] as [number, number] },
    { x: 1080, y: 120, t: '…', fill: 0xfff6c0, ink: 0x6a5a20, tail: [1080, 300] as [number, number] },
    { x: 640, y: 120, t: capiText, fill: 0x8fd8ff, ink: TV.line, tail: [760, 40] as [number, number], capi: true },
  ].map((b) => {
    const t = txt(k, b.t, { fontFamily: 'Bangers', fontSize: b.capi ? 70 : 76, fill: b.ink, letterSpacing: 2 });
    bubbles.addChild(t);
    return { ...b, s: t };
  });
  root.addChild(bubbles);
  // the bottom of the glass (thick amber rings, drawn once) multiplying their eyes
  const glassBottom = new Graphics();
  glassBottom.circle(960, 540, 1100).stroke({ width: 900, color: 0xb5651a, alpha: 0.4 });
  for (let r = 0; r < 4; r++) glassBottom.circle(960, 540, 420 + r * 70).stroke({ width: 18, color: 0xffd27a, alpha: 0.25 });
  const kal = new Graphics();
  root.addChild(glassBottom, kal);
  let head: [number, number] = [960, 760];
  let headScr: [number, number] = [960, 760];
  const LH = { x: 1500, y: 520 };
  return {
    twos: true,
    root,
    update(k, m) {
      const v = k.view;
      // ---- the nights pass, one per beat (a soft dusk ↔ night, never a strobe); your lighthouse sweeps its beam
      const beatN = m / k.beat;
      const nq = 0.5 + 0.5 * Math.cos(beatN * Math.PI);
      sky.clear();
      bands(sky, [0, 1, 2].map((i) => lerpC([0x2a3a7a, 0x3a4c98, 0x5a6ab8][i], [0x070a1e, 0x0b1030, 0x101844][i], nq)), -1000, 560);
      bands(sky, [0x0e1838, 0x0a1230, 0x060c22], 560, 2100);
      for (let i = 0; i < 30; i++) twinkle(sky, rnd(i) * 1920, rnd(i + 3) * 480, 4, TV.cream, 0.8 * nq);
      sky.ellipse(LH.x, LH.y + 40, 170, 26).fill(0x1d2a48).stroke({ width: 4, color: TV.line });
      sky.poly([LH.x - 22, LH.y + 36, LH.x - 16, LH.y - 70, LH.x + 16, LH.y - 70, LH.x + 22, LH.y + 36]).fill(TV.cream).stroke({ width: 4, color: TV.line });
      sky.rect(LH.x - 18, LH.y - 92, 36, 22).fill(TV.amberL).stroke({ width: 4, color: TV.line });
      beam.clear();
      const ang = beatN * Math.PI;
      const bx = Math.cos(ang) * 1400;
      const by = Math.sin(ang) * 140;
      beam.poly([LH.x, LH.y - 80, LH.x + bx, LH.y - 80 + by - 70, LH.x + bx, LH.y - 80 + by + 70]).fill({ color: TV.amberL, alpha: 0.18 });
      glow(beam, LH.x, LH.y - 80, 70, TV.amberL, 0.5);
      // ---- how close they've come (beat by beat, c42 → c45)
      const bq = k.num('bubbles', 0);
      const kq = clamp01(k.num('kaleido', 0));
      const press = clamp01(Math.floor(clamp01((m - 59.636) / (64.0 - 59.636)) * 12) / 12);
      const face = easeInOut(win(m, 65.455, 65.455 + 0.36));
      // ---- the page (it sinks as it grows heavy) and him, lying on it; then his face (c46)
      const sink = easeIn(kq) * 120;
      page.clear();
      page.poly([300, 720 + sink, 1620, 720 + sink, 1820, 1040 + sink, 100, 1040 + sink]).fill(0xfbf8f0).stroke({ width: LW, color: TV.line });
      page.poly([960, 880 + sink, 960 + Math.cos(ang) * 700, 860 + sink, 960 + Math.cos(ang + 0.3) * 700, 910 + sink]).fill({ color: TV.line, alpha: 0.12 });
      // the white creeps onto the page's left corner, the drips stain its right
      if (press > 0) {
        page.poly([300, 720 + sink, 300 + 420 * press, 720 + sink, 220 + 380 * press, 1040 + sink, 100, 1040 + sink]).fill({ color: 0xffffff, alpha: 0.95 });
        for (let i = 0; i < 6; i++) page.roundRect(1480 + i * 40, 730 + sink, 10, 40 + press * (60 + rnd(i) * 100), 5).fill(i % 2 ? 0xff2e88 : 0x00e5ff);
      }
      // he looks from one to the other as they come (left, right, up), more and more cornered
      const looks = [-0.9, 0.9, 0.1];
      const look = bq < 0.2 ? Math.sin(m * 0.7) * 0.4 : looks[Math.floor(beatN) % 3];
      perform(st, k, can, m, { x: 1000, y: 930 + sink, flip: true, rot: -1.2 + face * 0.5, lean: face * 0.3 - press * 0.1, headA: -0.1 - face * 0.1, look: face > 0.5 ? 0.15 : look, crouch: 0.1 + press * 0.25, amp: 0.4 });
      if (can?.puppet) {
        can.puppet.sleeping = false;
        if (m > 61.091) can.puppet.emote(face > 0.5 ? 'surprise' : 'hurt', face > 0.5 ? 1 : 0.4 + press * 0.5);
      }
      head = headOf(can, [800, 760]);
      const z = lerp(1, 1.12, press) * lerp(1, 2.2, face);
      const px = lerp(960, head[0], face);
      const py = lerp(560, head[1] + 30, face);
      view.pivot.set(px, py);
      view.position.set(960, 540);
      view.scale.set(z);
      sweat.clear();
      if (face > 0.5 || press > 0.6) {
        // a drop of sweat at his temple (beside the face, through his tilt)
        const r = can ? can.rotation : 0;
        const ox = 120 * Math.cos(r) + 90 * Math.sin(r);
        const oy = 120 * Math.sin(r) - 90 * Math.cos(r);
        const dy = ((m - 62) * 60) % 60;
        const sx = head[0] + ox;
        const sy = head[1] + oy + dy;
        sweat.poly([sx, sy - 30, sx + 12, sy, sx - 12, sy]).fill(TV.lantern).stroke({ width: 3, color: TV.line });
        sweat.circle(sx, sy + 4, 13).fill(TV.lantern).stroke({ width: 3, color: TV.line });
      }
      headScr = [960 + (head[0] - px) * z, 540 + (head[1] - py) * z];
      // ---- THE PRESENCES (screen space, at the edges; they advance beat by beat)
      const on = clamp01(bq / 0.6);
      const ed = 0.4 + 0.6 * press;
      // LEFT · the correction white: a flood with perfect ruled lines, a white Corrector leaning in
      whiteG.clear();
      if (on > 0) {
        const wx = v.x + lerp(-200, 520, on * ed);
        const edge: number[] = [];
        for (let i = 0; i <= 12; i++) edge.push(wx + Math.sin(i * 1.3 + m * 2) * 22, v.y - 40 + i * ((v.h + 80) / 12));
        whiteG.poly([v.x - 60, v.y - 40, ...edge, v.x - 60, v.y + v.h + 40]).fill({ color: 0xf6f8fc, alpha: 0.95 });
        for (let i = 0; i < 12; i++) whiteG.moveTo(v.x - 60, v.y + 40 + i * 90).lineTo(wx - 30, v.y + 40 + i * 90).stroke({ width: 2, color: 0xc9d3e6 });
        whiteG.poly(edge, false).stroke({ width: 5, color: 0xd6dbe6 });
      }
      corC.visible = !!cor && on > 0.05;
      perform(st, k, cor, m, { x: v.x + lerp(-260, 170, on * ed), y: v.y + v.h + 60, flip: false, lean: -0.5 * press - 0.1, headA: 0.12, look: 0.9, amp: 0 });
      // RIGHT · graffiti: drips running down from the top-right, a tag, Brecha leaning in
      grafG.clear();
      tag.visible = on > 0.3;
      if (on > 0) {
        for (let i = 0; i < 10; i++) {
          const x = v.x + v.w - 40 - i * 46 * (0.5 + on * ed);
          grafG.roundRect(x, v.y - 20, 14, (120 + rnd(i) * 360) * on * ed + 40, 7).fill(i % 2 ? 0xff2e88 : 0x00e5ff);
          grafG.circle(x + 7, v.y - 20 + (120 + rnd(i) * 360) * on * ed + 40, 10).fill(i % 2 ? 0xff2e88 : 0x00e5ff);
        }
        for (let i = 0; i < 30; i++) grafG.circle(v.x + v.w - rnd(i) * 420 * ed, v.y + 100 + rnd(i + 4) * 700, 5).fill({ color: 0xff2e88, alpha: 0.35 });
        tag.position.set(v.x + v.w - 260, v.y + 520);
      }
      if (bre) {
        bre.visible = on > 0.05;
        perform(st, k, bre, m, { x: v.x + v.w + lerp(260, -150, on * ed), y: v.y + v.h + 60, flip: true, lean: -0.5 * press - 0.1, headA: -0.1, look: -0.9, amp: 0 });
      }
      // ABOVE · threads of light and two hands of light reaching down to the page
      lightG.clear();
      if (on > 0) {
        // (when the camera comes to his face, the hands draw back up: nothing over his face)
        const reach = lerp(lerp(120, 380, on * ed), 60, face);
        for (let i = 0; i < 9; i++) {
          const x = 900 + i * 40;
          lightG.moveTo(x, v.y - 20).bezierCurveTo(x + Math.sin(m * 2 + i) * 30, reach * 0.5, x - 20, reach * 0.8, x + Math.sin(m + i) * 14, reach).stroke({ width: 3, color: 0xfff6c0, alpha: 0.85 });
        }
        for (const [hx, sgn] of [[960, -1], [1180, 1]] as [number, number][]) {
          glow(lightG, hx, reach + 40, 90, 0xfff6c0, 0.5);
          lightG.ellipse(hx, reach + 40, 40, 50).stroke({ width: 5, color: 0xfff6c0 });
          for (let f = 0; f < 4; f++) lightG.roundRect(hx - 36 + f * 20 + sgn * 4, reach + 50, 12, 50, 6).stroke({ width: 4, color: 0xfff6c0 });
          // its eyes: two points of light
          glow(lightG, hx - 12, reach + 30, 10, 0xffffff, 0.9, 2);
          glow(lightG, hx + 12, reach + 30, 10, 0xffffff, 0.9, 2);
        }
      }
      // ---- the bubbles, each with its tail to its owner (the Capi's: his hand's silhouette)
      bg.clear();
      bubbles.alpha = 1 - face;
      B.forEach((b, i) => {
        const o = i < 3 ? clamp01((bq - i * 0.3) / 0.4) : clamp01(bq - 1);
        b.s.visible = o > 0.01 && face < 0.99;
        if (!b.s.visible) return;
        const w = b.s.width / Math.max(0.01, b.s.scale.x) + 80;
        const h = b.s.height / Math.max(0.01, b.s.scale.y) + 70;
        const bx2 = v.x + (b.x / 1920) * v.w;
        const by2 = b.y + (1 - o) * 40;
        const tx = v.x + (b.tail[0] / 1920) * v.w;
        bg.poly([bx2 - 28, by2 + h / 2 - 10, bx2 + 28, by2 + h / 2 - 10, tx, b.tail[1]]).fill(b.fill).stroke({ width: LW, color: TV.line, join: 'round' });
        bg.ellipse(bx2, by2, (w / 2) * o, (h / 2) * o).fill(b.fill).stroke({ width: LW, color: TV.line });
        if (b.capi) {
          // the Capi's hand (a silhouette) beside his words
          const hx = bx2 - w / 2 + 10;
          bg.roundRect(hx - 40, by2 - 30, 70, 56, 20).fill(0x2a3a7a);
          for (let f = 0; f < 4; f++) bg.roundRect(hx - 38 + f * 17, by2 - 62, 13, 40, 6).fill(0x2a3a7a);
        }
        b.s.position.set(bx2 + (b.capi ? 30 : 0), by2);
        b.s.scale.set(o);
      });
      // ---- c44–45: THE BOTTOM OF THE GLASS — their eyes multiplied (never over his face; reduced motion: no spin)
      kal.clear();
      glassBottom.visible = kq > 0.01 && face < 0.99;
      glassBottom.alpha = kq * (1 - face);
      if (kq > 0.01 && face < 0.99) {
        const a = kq * (1 - face);
        const n = k.reduceMotion ? 6 : 12;
        const rot = k.reduceMotion ? 0 : m * 0.8;
        const cols = [0x9aa4c0, 0xff2e88, 0xfff6c0];
        for (let ringN = 1; ringN <= 3; ringN++) {
          for (let i = 0; i < n; i++) {
            const an = (i / n) * Math.PI * 2 + rot * (ringN % 2 ? 1 : -1);
            const r = ringN * 230 * (0.6 + kq * 0.6);
            const x = 960 + Math.cos(an) * r;
            const y = 540 + Math.sin(an) * r * 0.8;
            if (Math.hypot(x - headScr[0], y - headScr[1]) < 220) continue;
            kal.ellipse(x, y, 44, 24).fill({ color: 0xffffff, alpha: a }).stroke({ width: 4, color: cols[(i + ringN) % 3], alpha: a });
            kal.circle(x + (headScr[0] - x) * 0.04, y + (headScr[1] - y) * 0.04, 11).fill({ color: TV.line, alpha: a });
          }
        }
      }
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, headScr[0], headScr[1]);
      return null;
    },
  };
};
function lerpC(a: number, b: number, t: number) {
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bb = Math.round(lerp(a & 255, b & 255, t));
  return (r << 16) | (g << 8) | bb;
}

// ================================================================== ESPIRAL — c46.4 → c47 (the filter opens), then the slide to c48
const espiral: Make = (st, k) => {
  const root = new Container();
  const g = new Graphics();
  const mark = new Graphics();
  const can = st.actor('tv', st.slugs.canelo, 420);
  const fg = new Graphics();
  root.addChild(g, mark, fg);
  if (can) root.addChild(can);
  const twist = new TwistFilter({ radius: 600, angle: 0 });
  let head: [number, number] = [960, 460];
  return {
    twos: true,
    root,
    update(k, m, lt) {
      const slide = clamp01(k.num('slide', 0));
      const open = 0.844; // c46.4 → c47 (filter_open → filter_open_full, measured)
      g.clear();
      backdrop(g, TV.line);
      // the spiral: colored arms turning faster and faster (reduced motion: still arms, a slow fade)
      const arms = 10;
      const spin = k.reduceMotion ? 0 : lt * lt * 6;
      const cols = [TV.pink, TV.amber, TV.green, TV.neonBlue, TV.amberL];
      for (let i = 0; i < arms; i++) {
        const a0 = (i / arms) * Math.PI * 2 + spin;
        const pts: number[] = [960, 540];
        for (let j = 0; j <= 12; j++) pts.push(960 + Math.cos(a0 + j * 0.25) * j * 110, 540 + Math.sin(a0 + j * 0.25) * j * 110);
        for (let j = 12; j >= 0; j--) pts.push(960 + Math.cos(a0 + Math.PI / arms + j * 0.25) * j * 110, 540 + Math.sin(a0 + Math.PI / arms + j * 0.25) * j * 110);
        g.poly(pts).fill(cols[i % cols.length]);
      }
      // the twist (the world wrings itself around the flap): high tier, never with reduced motion
      const tw = k.quality === 'high' && !k.reduceMotion ? Math.sin(clamp01(lt / 2.2) * Math.PI) * 2.4 : 0;
      if (tw > 0.01) {
        twist.angle = tw;
        twist.radius = (k.renderer.screen.width / k.view.w) * 760;
        twist.offset = { x: k.renderer.screen.width / 2, y: k.renderer.screen.height / 2 };
        if (!g.filters?.length) g.filters = [twist];
      } else if (g.filters?.length) g.filters = null;
      mark.clear();
      fg.clear();
      if (slide < 0.01) {
        // ANTICIPATION (he coils on the page: squash) → THE LEAP (stretch, a smear trail) → into the flap
        const q = clamp01(lt / open);
        mark.ellipse(960, 900, 200, 50).fill({ color: 0xff9a3a, alpha: 0.5 + 0.3 * Math.sin(m * 6) });
        const flapR = 60 + easeOut(q) * 170;
        fg.roundRect(960 - flapR, 470 - flapR * 1.2, flapR * 2, flapR * 2.2, flapR).fill(TV.line).stroke({ width: LW + 4, color: TV.amberL });
        fg.rect(960 - flapR, 470 - flapR * 1.2, flapR * 2, flapR * 0.5).fill({ color: TV.amberL, alpha: 0.3 });
        const coil = q < 0.3 ? easeOut(q / 0.3) : 0;
        const jump = q < 0.3 ? 0 : easeIn((q - 0.3) / 0.7);
        if (can) {
          can.visible = q < 0.97;
          const y = lerp(900, 520, jump) - Math.sin(jump * Math.PI) * 220;
          const sx = q < 0.3 ? 1 + coil * 0.25 : 1 - jump * 0.75;
          const sy = q < 0.3 ? 1 - coil * 0.25 : (1 - jump * 0.75) * (1 + 0.4 * bell(jump));
          perform(st, k, can, m, { x: 960, y, flip: true, sx, sy, rot: jump * 0.6, crouch: coil * 0.6, lean: jump * 0.8, amp: 0 });
          // the smear: three ghost copies of his outline trailing the leap
          if (jump > 0.05 && jump < 0.9) for (let i = 1; i <= 3; i++) fg.ellipse(960, y + i * 70, 90 * sx, 140 * sy).fill({ color: TV.amberL, alpha: 0.18 / i });
          head = headOf(can, [960, 460]);
        }
      } else {
        // the slide of colors: down, round and round, toward the bar
        for (let j = 0; j < 40; j++) {
          const a = j * 0.5;
          const r = 80 + j * 22;
          fg.circle(960 + Math.cos(a) * r, 540 + Math.sin(a) * r * 0.6 + j * 6, 30).fill(cols[j % cols.length]).stroke({ width: 4, color: TV.line });
        }
        const a = slide * 40 * 0.5;
        const r = 80 + slide * 40 * 22;
        if (can) {
          can.visible = true;
          perform(st, k, can, m, { x: 960 + Math.cos(a) * r, y: 540 + Math.sin(a) * r * 0.6 + slide * 240, flip: Math.cos(a) < 0, sx: 0.5 + slide * 0.5, sy: 0.5 + slide * 0.5, rot: a * 0.3, lean: 0.5, amp: 0 });
          if (can.puppet) can.puppet.emote('happy', 1);
          head = headOf(can, [960, 460]);
        }
      }
    },
    anchor(name, k) {
      if (name === 'canelo') return scr(k, head[0], head[1]);
      return null;
    },
    prewarm() {
      g.filters = [twist];
    },
  };
};

export const SCENES3: Record<string, Make> = { acuarela, feria, umbral, baja, ojos, pagina, espiral };
export type { Kit, Sprite };
