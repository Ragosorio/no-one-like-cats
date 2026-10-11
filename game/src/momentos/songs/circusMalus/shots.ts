/**
 * CIRCUS MALUS — full-frame shots (they cover the set: k.fullFrame). Each one is its own little cartoon «short»:
 * the title card, the stamp close-up, the chorus line close-up, the piano roll, the mirror, the clockwork.
 * Pure functions of their local time; built on mount, destroyed on unmount.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { clip, W, H, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { rng, starPts } from '../../anime/draw';
import { ease } from '../../score';
import { AXIS, CREAM, GOLD, GOLD_D, INK, PAPER, POSTER, RED, RED_D, SMALL, TEAL, TEAL_D, TITLE, WOOD, WOOD_D, both, bulb, decoFrame, gear, ribbon, sunburst } from './art';
import { SymCat } from './stage';
import { S, durOf, num } from './verbs';

/** a full-frame shot: a container over the set, its own picture, the music's frame (a punch on every kick) */
function shot<T>(k: Kit, t0: number, dur: number, build: (root: Container) => T, update: (st: T, lt: number, root: Container) => void, unmount?: (st: T) => void, z = 0): Clip {
  let outer: Container | null = null;
  let root: Container | null = null;
  let st: T | null = null;
  return clip(t0, dur, {
    z,
    mount: () => {
      outer = new Container();
      outer.zIndex = z;
      outer.pivot.set(W / 2, H / 2);
      outer.position.set(W / 2, H / 2);
      root = new Container();
      outer.addChild(root);
      st = build(root);
      k.layers.panels.addChild(outer);
    },
    update: (lt) => {
      if (!root || !st || !outer) return;
      const m = t0 + lt;
      const kick = k.env('kick', m, 0.09) * (k.reduceMotion ? 0.3 : 1) * (1 - k.num('still', 0));
      outer.scale.set(1 + 0.018 * kick);
      // the old film's gate weave
      outer.position.set(W / 2 + Math.sin(Math.floor(m * 12) * 2.3) * 1.5 * k.num('grain', 1), H / 2 + Math.cos(Math.floor(m * 12) * 1.7) * 1.8 * k.num('grain', 1));
      update(st, lt, root);
      outer.visible = root.visible;
      if (root.visible) k.fullFrame = true;
    },
    unmount: () => {
      if (st && unmount) unmount(st);
      outer?.destroy({ children: true });
      outer = root = null;
      st = null;
    },
  });
}
const stepped = (lt: number) => Math.floor(lt * 12) / 12;
/** a rubber-hose pop-in scale at local time t since it appeared */
const pop = (t: number) => (t < 0 ? 0 : t < 0.12 ? 0.3 + (t / 0.12) * 1.0 : t < 0.2 ? 1.3 - ((t - 0.12) / 0.08) * 0.3 : 1);

// ------------------------------------------------------------------ the title card
const titleCard: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 6.3);
  const words = [
    { tex: k.text.get('LA REDACCIÓN', SMALL(52, CREAM, INK)), y: 200, at: 0 },
    { tex: k.text.get('PRESENTA', SMALL(36, CREAM, INK)), y: 262, at: 0.6 },
    { tex: k.text.get('CIRCUS', TITLE(200, PAPER, INK)), y: 455, at: 2.4, shadow: k.text.get('CIRCUS', TITLE(200, INK, INK)) },
    { tex: k.text.get('MALUS', TITLE(200, RED, INK)), y: 650, at: 3.9, shadow: k.text.get('MALUS', TITLE(200, INK, INK)) },
    { tex: k.text.get('EL PLAN', POSTER(64, CREAM, INK)), y: 845, at: 4.8, ribbon: true },
  ];
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const bg = new Graphics();
      const frame = new Graphics();
      decoFrame(frame, 110, 70, W - 220, H - 140);
      const bulbs = new Graphics();
      const items = words.map((w) => {
        const c = new Container();
        if (w.ribbon) {
          const g = new Graphics();
          ribbon(g, 0, 6, w.tex.width + 120, w.tex.height + 10, RED);
          c.addChild(g);
        }
        if (w.shadow) {
          for (let i = 7; i >= 1; i--) {
            const s = new Sprite(w.shadow);
            s.anchor.set(0.5);
            s.position.set(i * 3.5, i * 3.5);
            c.addChild(s);
          }
        }
        const s = new Sprite(w.tex);
        s.anchor.set(0.5);
        c.addChild(s);
        c.position.set(W / 2, w.y);
        return { c, w };
      });
      const st = S(k);
      const mascots = [-1, 1].map((side) => {
        const c = new SymCat(st.studio, st.slugs.ronron, 330);
        c.position.set(W / 2 + side * 650, 950);
        c.scale.x = side;
        return c;
      });
      root.addChild(bg, ...mascots, frame, bulbs, ...items.map((i) => i.c));
      return { bg, bulbs, items, mascots };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const ms = S(k).stepM(m);
      const v = k.view;
      s.bg.clear();
      s.bg.rect(v.x, v.y, v.w, v.h).fill(INK);
      // the rays turn one wedge per beat (a mechanical clock, not a smooth spin)
      const beats = Math.floor(m / k.beat);
      sunburst(s.bg, W / 2, 560, 1500, 28, beats * ((Math.PI * 2) / 28) * 0.5, CREAM, 0xd8c8a8);
      s.bg.circle(W / 2, 560, 300).fill(RED_D).stroke({ width: 8, color: INK });
      s.bg.circle(W / 2, 560, 270).stroke({ width: 5, color: GOLD });
      // bulbs along the frame chase on the hats
      s.bulbs.clear();
      const chase = k.last('perc', m)?.i ?? 0;
      const kick = k.env('kick', m, 0.09);
      let i = 0;
      for (let x = 160; x <= W - 160; x += 80, i++) {
        bulb(s.bulbs, x, 100, 12, kick > 0.45 || (i + chase) % 3 === 0 ? 1 : 0.2);
        bulb(s.bulbs, x, H - 100, 12, kick > 0.45 || (i + chase + 1) % 3 === 0 ? 1 : 0.2);
      }
      const kickS = k.env('kick', ms, 0.09);
      for (const it of s.items) {
        const t = stepped(lt - it.w.at);
        it.c.visible = t >= 0;
        const p = pop(t);
        it.c.scale.set(p * (1 + 0.05 * kickS), p * (1 - 0.06 * kickS));
      }
      const hop = S(k).hop(ms);
      for (const [j, c] of s.mascots.entries()) {
        const side = j ? 1 : -1;
        c.position.y = 950 - hop * 30;
        c.scale.set(side * (1 + 0.06 * kickS), 1 - 0.08 * kickS);
      }
    },
  );
};

// ------------------------------------------------------------------ the stamp close-up (low angle)
const stampShot: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.95);
  const id = String(a.prompt ?? '');
  const side = num(a, 'side', -1);
  const bat = !!a.bat;
  const hitAt = k.score.prompts.find((p) => p.id === id)?.m ?? cue.m + 0.5;
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const st = S(k);
      const bg = new Graphics();
      const can = st.studio.still(st.slugs.canelo, 0.5, 0.97);
      const sym = new SymCat(st.studio, st.slugs.canelo, 640);
      const fg = new Graphics();
      root.addChild(bg);
      if (can) root.addChild(can);
      root.addChild(sym, fg);
      const h = can ? can.texture.height : 700;
      if (can) can.scale.set(640 / h);
      return { bg, can, sym, fg, base: 640 / h };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const v = k.view;
      const j = k.judged(id);
      const r = j && j.at <= m + 1e-6 ? j.r : null;
      const before = m < hitAt;
      // background: the big top seen from below — stripes converging high above, a spotlight
      s.bg.clear();
      s.bg.rect(v.x, v.y, v.w, v.h).fill(CREAM);
      for (let i = -9; i <= 9; i += 2) s.bg.poly([W / 2, -900, W / 2 + i * 260, H + 60, W / 2 + (i + 1) * 260, H + 60]).fill(RED);
      s.bg.ellipse(W / 2 + side * 120, H - 40, 760, 160).fill({ color: PAPER, alpha: 0.85 });
      s.bg.rect(v.x, H - 120, v.w, 200).fill(WOOD_D);
      for (let i = -10; i <= 10; i++) s.bg.moveTo(W / 2 + i * 170, H - 120).lineTo(W / 2 + i * 260, H + 80).stroke({ width: 4, color: INK });
      // Canelo: low angle, big, off-centre to `side`
      const cx = W / 2 + side * 260;
      const cy = H - 80;
      let sx = 1;
      let sy = 1;
      let dx = 0;
      let rot = 0;
      let flat = false;
      if (!before) {
        const t = m - hitAt;
        if (r === 'great') {
          // the rubber-hose dodge (or the swing): stretched sideways out of the way
          dx = side * -320 * ease('out', Math.min(1, t / 0.2));
          sx = 1 + 0.5 * Math.max(0, 1 - t / 0.3);
          sy = 1 - 0.25 * Math.max(0, 1 - t / 0.3);
          rot = bat ? side * -0.35 * Math.max(0, 1 - t / 0.4) : side * -0.15;
        } else if (r === 'hit') {
          sy = 0.7;
          sx = 1.2;
          dx = side * -120;
        } else if (r === 'miss') {
          flat = true;
          sy = 0.25;
          sx = 1.7;
        }
      } else {
        // anticipation: he looks up, squashes a little as the shadow falls on him
        const u = (m - cue.m) / Math.max(0.05, hitAt - cue.m);
        sy = 1 - 0.06 * u;
        sx = 1 + 0.04 * u;
      }
      if (s.can) {
        s.can.visible = !flat;
        s.can.position.set(cx + dx, cy);
        s.can.rotation = rot;
        s.can.scale.set(s.base * sx * (side > 0 ? -1 : 1), s.base * sy);
      }
      s.sym.visible = flat;
      s.sym.position.set(cx, cy);
      s.sym.scale.set(sx, sy);
      k.setAnchor('canelo', [cx + dx + side * -330, cy - 520]);
      k.setAnchor('caneloHead', [cx + dx, cy - 560 * sy]);
      // the stamp: falls from above the frame onto him; great+bat → it flies off spinning
      s.fg.clear();
      const u = Math.min(1, (m - cue.m) / Math.max(0.05, hitAt - cue.m));
      let y = -620 + (cy - 120 + 620) * ease('in', u);
      let x = cx;
      let srot = 0;
      if (!before && r === 'great' && bat) {
        const t = m - hitAt;
        x = cx - side * 1500 * t;
        y = cy - 120 - 1600 * t + 1800 * t * t;
        srot = -side * t * 14;
      } else if (!before && r === 'great') {
        y = cy - 120;
      }
      drawStampBig(s.fg, x, y, 2.0, srot);
      if (!before && m - hitAt < 0.22) {
        const al = 1 - (m - hitAt) / 0.22;
        s.fg.poly(starPts(x, cy - 100, 520, 260, 12, 0.1)).stroke({ width: 12, color: INK, alpha: al });
      }
    },
    undefined,
    1,
  );
};
function drawStampBig(g: Graphics, x: number, y: number, s: number, rot: number) {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const P = (px: number, py: number): [number, number] => [x + px * cos - py * sin, y + px * sin + py * cos];
  const quad = (x0: number, y0: number, x1: number, y1: number) => [...P(x0, y0), ...P(x1, y0), ...P(x1, y1), ...P(x0, y1)];
  g.poly(quad(-120 * s, -70 * s, 120 * s, 0)).fill(WOOD).stroke({ width: 8, color: INK });
  g.poly(quad(-128 * s, -14 * s, 128 * s, 0)).fill(RED_D).stroke({ width: 6, color: INK });
  g.poly(quad(-26 * s, -170 * s, 26 * s, -60 * s)).fill(WOOD_D).stroke({ width: 8, color: INK });
  const [kx, ky] = P(0, -190 * s);
  g.circle(kx, ky, 52 * s).fill(WOOD).stroke({ width: 8, color: INK });
  const [gx, gy] = P(0, -240 * s);
  g.roundRect(gx - 75 * s, gy - 55 * s, 150 * s, 110 * s, 45 * s).fill(PAPER).stroke({ width: 8, color: INK });
  for (let i = -1; i <= 1; i++) g.moveTo(gx + i * 26 * s, gy - 35 * s).lineTo(gx + i * 26 * s, gy + 10 * s).stroke({ width: 6, color: INK, cap: 'round' });
  const [cx2, cy2] = P(0, -320 * s);
  g.poly(quad(-60 * s, -340 * s, 60 * s, -295 * s)).fill(PAPER).stroke({ width: 8, color: INK });
  g.moveTo(cx2, cy2).lineTo(cx2 - sin * 1200, cy2 - cos * 1200).stroke({ width: 16, color: INK });
}

// ------------------------------------------------------------------ the chorus line close-up
const lineShot: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2.4);
  const withT = !!a.tachon;
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const st = S(k);
      const bg = new Graphics();
      root.addChild(bg);
      const faces: SymCat[] = [];
      const n = 5;
      for (let i = 0; i < n; i++) {
        const mid = i === 2;
        const slug = withT && mid ? st.slugs.tachon : st.slugs.ronron;
        const c = new SymCat(st.studio, slug, mid && withT ? 820 : 700);
        c.position.set(W / 2 + (i - 2) * 390, H + 300);
        root.addChild(c);
        faces.push(c);
      }
      return { bg, faces };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const st = S(k);
      const ms = st.stepM(m);
      const v = k.view;
      s.bg.clear();
      s.bg.rect(v.x, v.y, v.w, v.h).fill(CREAM);
      for (let x = -40; x < W + 40; x += 160) s.bg.rect(x, v.y, 80, v.h).fill(RED);
      s.bg.rect(v.x, v.y, v.w, 90).fill(RED_D);
      const hop = st.hop(ms);
      const kick = k.env('kick', ms, 0.09);
      const sn = k.last('snare', m, 0.3);
      const tilt = sn && m - sn.o.t < 0.4 ? (sn.i % 2 ? 0.08 : -0.08) * (1 - (m - sn.o.t) / 0.4) : 0;
      s.faces.forEach((c, i) => {
        // perfectly identical, perfectly together
        c.position.y = H + 300 - hop * 40;
        c.rotation = tilt;
        c.scale.set(1 + 0.06 * kick, 1 - 0.08 * kick);
        void i;
      });
    },
  );
};

// ------------------------------------------------------------------ the piano roll (the plan, punched in paper)
const rollShot: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 4.8);
  const notes = k.onsetList('bass');
  const mel = k.onsetList('melody');
  const pitches = [...new Set(notes.map((o) => o.midi).filter((x): x is number => typeof x === 'number'))].sort((x, y) => x - y);
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const paper = new Graphics();
      const holes = new Graphics();
      const machine = new Graphics();
      const plan = new Graphics();
      root.addChild(paper, holes, plan, machine);
      return { paper, holes, machine, plan };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const v = k.view;
      const BAR = 800;
      const speed = 300;
      const z = 1.25 - 0.25 * ease('inOut', Math.min(1, lt / d));
      const sx = (x: number) => W / 2 + (x - W / 2) * z;
      const sy = (y: number) => BAR + (y - BAR) * z;
      s.paper.clear();
      s.paper.rect(v.x, v.y, v.w, v.h).fill(WOOD_D);
      const x0 = sx(360);
      const x1 = sx(W - 360);
      s.paper.rect(x0, v.y, x1 - x0, v.h).fill(PAPER).stroke({ width: 6, color: INK });
      // the paper scrolls: its edge perforations and faint column rules move with it
      const off = (m * speed * z) % (60 * z);
      for (let y = v.y - 60 + off; y < sy(BAR); y += 60 * z) {
        s.paper.circle(x0 + 26 * z, y, 9 * z).fill(WOOD_D);
        s.paper.circle(x1 - 26 * z, y, 9 * z).fill(WOOD_D);
      }
      for (let i = 0; i < 10; i++) both((f) => s.paper.moveTo(f(sx(W / 2 - 60 - i * 52)), v.y).lineTo(f(sx(W / 2 - 60 - i * 52)), sy(BAR)).stroke({ width: 2, color: 0xd8ccb4 }));
      // the spool at the top
      s.paper.roundRect(x0 - 40, v.y - 10, x1 - x0 + 80, 70 * z, 20).fill(WOOD).stroke({ width: 6, color: INK });
      // the holes: every bass note and piano stab of the song, punched where it will be read (mirrored: the plan is
      // symmetric even when the song isn't)
      s.holes.clear();
      const cols = 5;
      const colX = (i: number) => sx(W / 2 - 60 - i * 52);
      for (const o of notes) {
        const y = sy(BAR - (o.t - m) * speed);
        if (y < v.y - 40 || y > BAR + 40) continue;
        const i = Math.round((Math.max(0, pitches.indexOf(o.midi ?? pitches[0])) / Math.max(1, pitches.length - 1)) * 4);
        const len = Math.max(14, (o.dur ?? 0.15) * speed * z * 0.9);
        both((f) => {
          const x = f(colX(i));
          s.holes.roundRect(x - 18 * z, y - len, 36 * z, len, 12 * z).fill(INK);
        });
      }
      for (const o of mel) {
        const y = sy(BAR - (o.t - m) * speed);
        if (y < v.y - 40 || y > BAR + 40 || o.strength < 0.3) continue;
        both((f) => {
          const x = f(colX(5 + (Math.round(o.t * 20) % 2)));
          s.holes.circle(x, y, 20 * z).fill(INK);
        });
      }
      // the drums are punched too (the machine plays everything): kicks as squares, hats as pin holes, at the edges
      for (const [tr, col, r] of [['kick', 7, 22], ['snare', 8, 17], ['perc', 9, 10]] as const) {
        for (const o of k.onsetList(tr)) {
          const y = sy(BAR - (o.t - m) * speed);
          if (y < v.y - 40 || y > BAR + 40 || o.strength < 0.25) continue;
          both((f) => {
            const x = f(colX(col));
            if (tr === 'kick') s.holes.rect(x - r * z, y - r * z, 2 * r * z, 2 * r * z).fill(INK);
            else s.holes.circle(x, y, r * z).fill(INK);
          });
        }
      }
      // the brass tracker bar + the keys that the holes press
      s.machine.clear();
      s.machine.rect(v.x, sy(BAR), v.w, 40 * z).fill(GOLD).stroke({ width: 6, color: INK });
      s.machine.rect(v.x, sy(BAR) + 40 * z, v.w, v.h).fill(WOOD);
      const keyW = 64 * z;
      for (let i = -12; i <= 12; i++) {
        const kx = W / 2 + i * keyW;
        // a key goes down while a hole is over the bar in its column (bass under the axis, melody further out)
        const col = Math.abs(i) - 1;
        let down = 0;
        if (col >= 0 && col < cols) {
          const x = k.last('bass', m);
          const c = x ? Math.round((Math.max(0, pitches.indexOf(x.o.midi ?? pitches[0])) / Math.max(1, pitches.length - 1)) * 4) : -1;
          if (x && c === col && m - x.o.t < Math.max(0.12, x.o.dur ?? 0.15)) down = 1;
        } else if (col === 5 || col === 6) {
          const x = k.last('melody', m, 0.3);
          if (x && m - x.o.t < 0.12 && 5 + (Math.round(x.o.t * 20) % 2) === col) down = 1;
        } else if (col >= 7 && col <= 9) {
          const x = k.last((['kick', 'snare', 'perc'] as const)[col - 7], m, 0.25);
          if (x && m - x.o.t < 0.1) down = 1;
        }
        s.machine.roundRect(kx - keyW / 2 + 3, sy(BAR) + 44 * z + down * 14 * z, keyW - 6, 150 * z, 8).fill(i % 2 ? CREAM : PAPER).stroke({ width: 5, color: INK });
      }
      // the second bar: the paper shows what the holes will make — a perfectly symmetric world (the plan)
      s.plan.clear();
      const show = Math.max(0, Math.min(1, (lt - 2.4) / 0.6));
      if (show > 0) {
        const base = sy(470);
        for (let i = 0; i < 6; i++) {
          both((f) => {
            const x = f(W / 2 - 80 - i * 95 * z);
            const h = (90 + ((i * 37) % 3) * 40) * z * show;
            s.plan.rect(x - 34 * z, base - h, 68 * z, h).stroke({ width: 5, color: RED });
            s.plan.poly([x - 40 * z, base - h, x, base - h - 40 * z * show, x + 40 * z, base - h]).stroke({ width: 5, color: RED });
          });
        }
        s.plan.circle(W / 2, base - 200 * z * show, 70 * z * show).stroke({ width: 6, color: RED });
        s.plan.moveTo(W / 2 - 52 * z * show, base - 200 * z * show).lineTo(W / 2 + 52 * z * show, base - 200 * z * show).stroke({ width: 10, color: RED });
      }
    },
  );
};

// ------------------------------------------------------------------ the mirror (verse2)
const mirrorShot: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 9.6);
  const ids = [0, 1, 2, 3].map((i) => `espejo${i}`);
  const at = ids.map((id) => k.score.prompts.find((p) => p.id === id)?.m ?? 0);
  // Canelo's four «faces» (tilt, squash, stretch, the flip) and what a wrong reflection does instead
  const moves = [
    { rot: -0.22, sx: 1, sy: 1 },
    { rot: 0, sx: 1.25, sy: 0.75 },
    { rot: 0.12, sx: 0.82, sy: 1.22 },
    { rot: -0.08, sx: -1, sy: 1 },
  ];
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const st = S(k);
      const bg = new Graphics();
      const frame = new Graphics();
      const glass = new Graphics();
      const inside = new Container();
      const mask = new Graphics().ellipse(W / 2 + 230, 520, 300, 400).fill(0xffffff);
      inside.mask = mask;
      const refl = new SymCat(st.studio, st.slugs.canelo, 600);
      refl.position.set(W / 2 + 230, 900);
      inside.addChild(glass, refl);
      const can = st.studio.still(st.slugs.canelo, 0.5, 0.97);
      const h = can ? can.texture.height : 700;
      if (can) {
        can.scale.set(620 / h);
        can.position.set(470, H + 40);
      }
      const esp = new SymCat(st.studio, st.slugs.espejito, 360);
      esp.position.set(W / 2 + 640, H + 10);
      const cracks = new Graphics();
      root.addChild(bg, mask, inside, cracks, frame, esp);
      if (can) root.addChild(can);
      return { bg, frame, glass, refl, can, base: 620 / h, cracks, esp };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const st = S(k);
      const ms = st.stepM(m);
      const v = k.view;
      const hop = st.hop(ms);
      const kick = k.env('kick', ms, 0.09);
      // the dressing room: striped wallpaper, a vanity table
      s.bg.clear();
      s.bg.rect(v.x, v.y, v.w, v.h).fill(TEAL_D);
      for (let x = -40; x < W + 40; x += 120) s.bg.rect(x, v.y, 60, v.h).fill(TEAL);
      s.bg.rect(v.x, H - 170, v.w, 200).fill(WOOD).stroke({ width: 6, color: INK });
      // the mirror: a gold oval with bulbs; it hops on the beat (it belongs to them)
      const my = 520 - hop * 10;
      s.glass.clear();
      s.glass.rect(W / 2 - 100, 100, 700, 860).fill(0xd8e4e0);
      s.glass.poly([W / 2 - 40, 200, W / 2 + 40, 200, W / 2 - 120, 900, W / 2 - 200, 900]).fill({ color: 0xffffff, alpha: 0.35 });
      s.frame.clear();
      s.frame.ellipse(W / 2 + 230, my, 330, 430).stroke({ width: 44, color: GOLD });
      s.frame.ellipse(W / 2 + 230, my, 330, 430).stroke({ width: 6, color: INK });
      s.frame.ellipse(W / 2 + 230, my, 308, 408).stroke({ width: 6, color: INK });
      const chase = k.last('perc', m)?.i ?? 0;
      for (let i = 0; i < 16; i++) {
        const an = (i / 16) * Math.PI * 2;
        bulb(s.frame, W / 2 + 230 + Math.cos(an) * 352, my + Math.sin(an) * 452, 13, kick > 0.45 || (i + chase) % 2 === 0 ? 1 : 0.2);
      }
      // which move is live, and how the reflection answers it
      let mv = -1;
      for (let i = 0; i < at.length; i++) if (m >= at[i]) mv = i;
      const cm = mv >= 0 ? moves[mv] : { rot: 0, sx: 1, sy: 1 };
      const tIn = mv >= 0 ? m - at[mv] : 9;
      const snap = Math.min(1, tIn / 0.1);
      if (s.can) {
        s.can.rotation = cm.rot * snap;
        s.can.scale.set(s.base * (1 + (cm.sx - 1) * snap), s.base * (1 + (cm.sy - 1) * snap));
      }
      let rm = { rot: 0, sx: 1, sy: 1 };
      let greats = 0;
      for (let i = 0; i <= mv; i++) if (k.judged(ids[i])?.r === 'great') greats++;
      if (mv >= 0) {
        const r = k.judged(ids[mv])?.r ?? 'miss';
        if (r === 'great') rm = moves[(mv + 2) % 4]; // it gets it WRONG
        else if (r === 'hit') rm = tIn > 0.25 ? cm : { rot: 0, sx: 1, sy: 1 }; // late
        else rm = cm; // perfect copy
      }
      // mirrored: the reflection's rotation is the opposite
      s.refl.position.set(W / 2 + 230, 900 - hop * 18);
      s.refl.rotation = -rm.rot;
      s.refl.scale.set(rm.sx * (1 + 0.05 * kick), rm.sy * (1 - 0.06 * kick));
      s.esp.position.y = H + 10 - hop * 24;
      s.esp.scale.set(1 + 0.05 * kick, 1 - 0.07 * kick);
      // the cracks: one per great so far; at the very end the glass gives way
      s.cracks.clear();
      const R = rng(77);
      const n = greats * 3 + (lt > d - 0.35 ? 8 : 0);
      for (let i = 0; i < n; i++) {
        const an = R() * Math.PI * 2;
        const len = 120 + R() * 260;
        const cx = W / 2 + 230 + Math.cos(an) * 30;
        const cy = my + Math.sin(an) * 30;
        s.cracks.moveTo(cx, cy).lineTo(cx + Math.cos(an) * len * 0.5 + (R() - 0.5) * 40, cy + Math.sin(an) * len * 0.5).lineTo(cx + Math.cos(an) * len, cy + Math.sin(an) * len).stroke({ width: 5, color: INK });
      }
      k.setAnchor('espejo', [W / 2 - 120, 260]);
      k.setAnchor('caneloHead', [470, 520]);
    },
  );
};

// ------------------------------------------------------------------ the clockwork (build)
const gearsShot: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2.4);
  return shot(
    k,
    cue.m,
    d,
    (root) => {
      const g = new Graphics();
      root.addChild(g);
      return { g };
    },
    (s, lt) => {
      const m = cue.m + lt;
      const v = k.view;
      const b = k.last('bass', m);
      const notch = b ? b.i : 0;
      const sn = k.onsetList('snare').filter((o) => o.t >= cue.m && o.t <= m && o.strength >= 0.3).length;
      const a1 = notch * (Math.PI / 10);
      const z = 1.15 - 0.15 * (lt / d);
      s.g.clear();
      s.g.rect(v.x, v.y, v.w, v.h).fill(WOOD_D);
      const G = (x: number, y: number, r: number, t: number, rot: number, f: number) => gear(s.g, W / 2 + (x - W / 2) * z, H / 2 + (y - H / 2) * z, r * z, t, rot, f);
      both((sx, side) => {
        G(sx(AXIS - 330), 420, 300, 18, side * a1, GOLD);
        G(sx(AXIS - 760), 760, 220, 14, -side * a1 * 1.3 + 0.1, CREAM);
        G(sx(AXIS - 820), 180, 160, 11, -side * a1 * 1.6, GOLD);
      });
      G(AXIS, 900, 200, 14, sn * (Math.PI / 7), GOLD_D);
      // the ratchet pawl clicks on every snare
      const last = k.last('snare', m, 0.3);
      const age = last ? m - last.o.t : 1;
      const pr = age < 0.1 ? -0.25 : 0;
      s.g.poly([W / 2 - 30, 640, W / 2 + 30, 640, W / 2 + 10 + pr * 200, 720, W / 2 - 10 + pr * 200, 720]).fill(GOLD).stroke({ width: 6, color: INK });
    },
  );
};

export const SHOT_VERBS: Record<string, VerbFn> = { titleCard, stampShot, lineShot, rollShot, mirrorShot, gearsShot };
