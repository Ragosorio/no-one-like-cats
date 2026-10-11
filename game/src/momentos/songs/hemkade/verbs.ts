/**
 * HEMKADE — scene verbs. 3D actions go through the stage's want*() requests (applied in late()); the 2D language of
 * this Momento is its own: SLAM (block letters extruded in 3D steps, Gurren-style, never LIKY's brush slab), the PLATE
 * (an engraver's frame with a cartouche for the breaks), SMASH (the plate shattering back into colour), SPIRAL (drill
 * speed lines for the climax) and the end card.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import * as THREE from 'three';
import type { Args } from '../../types';
import { W, H, clip, type Clip, type Kit, type VerbFn } from '../../anime/kit';
import { palCol } from '../../anime/fx';
import { safeFlashColor } from '../../flash';
import type { HemStage, Who } from './stage';

const S = (k: Kit) => k.stage as unknown as HemStage;
const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' && Number.isFinite(a[key] as number) ? (a[key] as number) : d);
const durOf = (k: Kit, a: Args, d: number) => (typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', d));
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ the starfire: Canelo's shot at a seal
/** fire at a seal: great = a thick beam + the seal SHATTERS · hit = a thin beam + it cracks · miss = it glances off */
const fire: VerbFn = (k, a, cue) => {
  const seal = num(a, 'seal', 0);
  const r = String(a.r ?? 'great');
  const d = r === 'great' ? 0.26 : r === 'hit' ? 0.18 : 0.2;
  let burst = false;
  const out: Clip[] = [
    clip(cue.m, d, {
      update: (lt) => {
        const st = S(k);
        const to = st.sealWorld(seal).clone();
        if (r === 'miss') to.add(new THREE.Vector3(26, 18, -20));
        const on = (1 - lt / d) ** 0.6;
        st.wantBeam(to, on, r === 'great' ? 3.4 : r === 'hit' ? 1.7 : 1.2);
        if (!burst) {
          burst = true;
          const at = st.sealWorld(seal).clone();
          if (r === 'great') {
            st.wantBurst({ t0: cue.m, kind: 'shards', at, scale: 2.6, seed: cue.id });
            st.wantBurst({ t0: cue.m, kind: 'star', at: at.clone(), scale: 3.2, seed: cue.id + 1 });
          } else st.wantBurst({ t0: cue.m, kind: 'sparks', at, scale: 2, seed: cue.id });
        }
        st.wantShake((r === 'great' ? 4 : 2) * (1 - lt / d));
        st.wantEmote('canelo', r === 'miss' ? 'hurt' : 'attack');
      },
    }),
  ];
  // the bursts keep living after the beam: re-request them for their life
  out.push(
    clip(cue.m + d, 1.5, {
      update: () => {
        const st = S(k);
        const at = st.sealWorld(seal).clone();
        if (r === 'great') {
          st.wantBurst({ t0: cue.m, kind: 'shards', at, scale: 2.6, seed: cue.id });
          st.wantBurst({ t0: cue.m, kind: 'star', at: at.clone(), scale: 3.2, seed: cue.id + 1 });
        } else st.wantBurst({ t0: cue.m, kind: 'sparks', at, scale: 2, seed: cue.id });
      },
    }),
  );
  if (r === 'miss') out.push(clip(cue.m + 0.08, 0.5, { update: (lt) => S(k).wantJolt(-1.6 * Math.exp(-lt * 6), 0.12 * Math.sin(lt * 18) * Math.exp(-lt * 5)) }));
  return out;
};

/** lightning in the storm (guarded: it lights the whole frame) */
const bolt: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 0.2);
  let grant: 'full' | 'soft' | 'none' = 'soft';
  const i = num(a, 'i', cue.id);
  return clip(cue.m, d, {
    mount: () => (grant = k.guard.request(cue.m, 'flash')),
    update: (lt) => {
      const st = S(k);
      const L = st.heartWorld(new THREE.Vector3());
      const ang = hash(i) * Math.PI * 2;
      const r = 160 + hash(i + 7) * 420;
      const on = lt < 0.05 ? 1 : lt < 0.09 ? 0.2 : lt < 0.13 ? 0.9 : Math.max(0, 1 - (lt - 0.13) / (d - 0.13));
      st.wantBolt(i, on, L.x + Math.cos(ang) * r, L.z + Math.sin(ang) * r);
      st.wantFlash((grant === 'full' ? 0.55 : 0.16) * on);
    },
  });
};

/** the roar: the maw, a shock, the frame shakes (the voice chop itself opens the maw: this is the big one) */
const roar: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.2);
  return clip(cue.m, d, {
    update: (lt) => {
      const st = S(k);
      st.wantShake(7 * Math.exp(-lt * 2.2));
      k.cam.shake(18 * Math.exp(-lt * 3), k.m, cue.id, 20);
    },
  });
};

/** a jolt of our hull (hits, landings) */
const jolt: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.6);
  const amt = num(a, 'amt', 1.5);
  return clip(cue.m, d, { update: (lt) => S(k).wantJolt(-amt * Math.exp(-lt * 6) * Math.cos(lt * 14), 0.1 * amt * Math.sin(lt * 16) * Math.exp(-lt * 5)) });
};

/** a cat's face for a while (deck puppets) */
const emote: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1);
  const who = String(a.who ?? 'canelo') as Who;
  const e = String(a.e ?? 'happy');
  return clip(cue.m, d, { update: () => S(k).wantEmote(who, e) });
};

/** a chain snaps (its state is derived from these cues: here only the sparks and the whip) */
const snap: VerbFn = (k, a, cue) => {
  const c = num(a, 'c', 0);
  return clip(cue.m, 1.4, {
    update: (lt) => {
      const st = S(k);
      const at = st.world.chains.attach[c]?.clone();
      if (at) {
        at.y += 60;
        st.wantBurst({ t0: cue.m, kind: 'sparks', at, scale: 4, seed: cue.id });
        st.wantBurst({ t0: cue.m, kind: 'star', at: at.clone(), scale: 3, seed: cue.id + 3 });
      }
      st.wantShake(5 * Math.exp(-lt * 4));
    },
  });
};

/** a spray / mist / star burst at a named place ('heart' | 'sea' | 'ship' | 'head') */
const burstV: VerbFn = (k, a, cue) => {
  const kind = String(a.kind ?? 'spray') as 'spray';
  const where = String(a.at ?? 'heart');
  const sc = num(a, 'scale', 3);
  const n = num(a, 'n', 1);
  return clip(cue.m, num(a, 'dur', 2.5), {
    update: () => {
      const st = S(k);
      for (let i = 0; i < n; i++) {
        let p: THREE.Vector3;
        if (where === 'ship') p = st.bowWorld(new THREE.Vector3());
        else if (where === 'head') p = st.world.lev.toWorld(st.world.lev.surface(0.95, -Math.PI / 2, 10, new THREE.Vector3()), new THREE.Vector3());
        else if (where === 'sea') {
          p = st.world.lev.toWorld(st.world.lev.surface(0.2 + i * 0.22, i % 2 ? 0 : Math.PI, 30, new THREE.Vector3()), new THREE.Vector3());
          p.y = 3;
        } else p = st.world.lev.toWorld(st.world.lev.surface(0.25 + i * 0.18, (i * 2.1) % 6.28, 20, new THREE.Vector3()), new THREE.Vector3());
        st.wantBurst({ t0: cue.m, kind, at: p, scale: sc, seed: cue.id * 7 + i });
      }
    },
  });
};

/** hide the deck cats (shots where they'd float wrong) */
const noCast: VerbFn = (k, a, cue) => clip(cue.m, durOf(k, a, 1), { update: () => S(k).wantHideCast() });

// ------------------------------------------------------------------ SLAM: block letters, extruded in steps
export const SLAM_FONT = 'Bebas Neue';
export function slamStyle(size: number, fill: number, ink: number) {
  return { fontFamily: SLAM_FONT, fontSize: size, fill, stroke: { color: ink, width: Math.round(size * 0.09), join: 'miter' as const }, letterSpacing: Math.round(size * 0.02) };
}
export function slamKataStyle(size: number, fill: number, ink: number) {
  return { fontFamily: 'Dela Gothic One', fontSize: size, fill, stroke: { color: ink, width: Math.round(size * 0.14) } };
}
/** the colors a slam bakes with (fixed at its instant so it can be baked ahead) */
export function slamColors(k: Kit, a: Args, pal = k.pal) {
  return { fill: typeof a.fill === 'number' ? (a.fill as number) : 0xffffff, ink: pal.ink, side: typeof a.color === 'number' ? (a.color as number) : (pal[(typeof a.color === 'string' ? a.color : 'accent') as 'accent'] as number) };
}
const slam: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 0.9);
  const text = String(a.text ?? '');
  const size = num(a, 'size', 190);
  const pal = k.palFor(cue);
  const col = slamColors(k, a, pal);
  // baked now (never on the beat)
  const face = k.text.get(text, slamStyle(size, col.fill, col.ink));
  const kata = typeof a.kata === 'string' ? k.text.get(a.kata as string, slamKataStyle(Math.round(size * 0.32), col.side, col.ink)) : null;
  let c: Container | null = null;
  const x0 = num(a, 'x', W / 2);
  const y0 = num(a, 'y', H * 0.42);
  const rot = num(a, 'rot', -0.09);
  const depth = k.quality === 'high' ? 9 : 5;
  return clip(cue.m, d, {
    z: 6,
    mount: () => {
      c = new Container();
      // the extrusion: the same word stepped back toward the lower right, darkening
      for (let i = depth; i >= 1; i--) {
        const s = new Sprite(face);
        s.anchor.set(0.5);
        s.tint = i === depth ? col.ink : col.side;
        s.position.set(i * size * 0.016, i * size * 0.016);
        s.alpha = i === depth ? 1 : 0.98;
        c.addChild(s);
      }
      const top = new Sprite(face);
      top.anchor.set(0.5);
      c.addChild(top);
      if (kata) {
        const kk = new Sprite(kata);
        kk.anchor.set(0, 0.5);
        kk.position.set(face.width * 0.36, -face.height * 0.52);
        kk.rotation = 0.06;
        c.addChild(kk);
      }
      c.skew.set(-0.22, 0);
      c.rotation = rot;
      k.layers.type.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const p = k.stage.anchor?.(String(a.at ?? ''), k);
      c.position.set(p ? p[0] : x0, p ? p[1] - size * 0.6 : y0);
      // slam in (2 frames huge), settle, then punch out
      const st = Math.floor(lt * 24);
      const sIn = st === 0 ? 2.1 : st === 1 ? 0.88 : st === 2 ? 1.06 : 1;
      const tail = lt > d - 0.14 ? 1 + ((lt - (d - 0.14)) / 0.14) * 0.5 : 1;
      c.scale.set(sIn * tail);
      c.alpha = lt > d - 0.14 ? Math.max(0, 1 - (lt - (d - 0.14)) / 0.14) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

// ------------------------------------------------------------------ the PLATE (breaks)
export const PLATE_TITLE = (size: number, ink: number) => ({ fontFamily: 'Playfair Display', fontSize: size, fontWeight: '700' as const, fill: ink, letterSpacing: Math.round(size * 0.12) });
export const PLATE_SUB = (size: number, ink: number) => ({ fontFamily: 'Playfair Display', fontSize: size, fill: ink, letterSpacing: Math.round(size * 0.3) });
const plate: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 8);
  const pal = k.palFor(cue);
  const ink = typeof a.ink === 'number' ? (a.ink as number) : pal.ink;
  const paper = typeof a.paper === 'number' ? (a.paper as number) : pal.light;
  const title = k.text.get(String(a.title ?? ''), PLATE_TITLE(46, ink));
  const sub = a.sub ? k.text.get(String(a.sub), PLATE_SUB(22, ink)) : null;
  let c: Container | null = null;
  let frame: Graphics | null = null;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      c = new Container();
      frame = new Graphics();
      c.addChild(frame);
      const cart = new Container();
      const tw = Math.max(title.width, sub?.width ?? 0) + 120;
      const g = new Graphics()
        .poly([-tw / 2 - 30, 0, -tw / 2, -46, tw / 2, -46, tw / 2 + 30, 0, tw / 2, 46, -tw / 2, 46])
        .fill(paper)
        .stroke({ width: 3, color: ink })
        .poly([-tw / 2 - 18, 0, -tw / 2 + 6, -36, tw / 2 - 6, -36, tw / 2 + 18, 0, tw / 2 - 6, 36, -tw / 2 + 6, 36])
        .stroke({ width: 1.5, color: ink });
      const t = new Sprite(title);
      t.anchor.set(0.5);
      t.position.set(0, sub ? -8 : 0);
      cart.addChild(g, t);
      if (sub) {
        const s = new Sprite(sub);
        s.anchor.set(0.5);
        s.position.set(0, 24);
        cart.addChild(s);
      }
      cart.label = 'cart';
      c.addChild(cart);
      k.layers.screen.addChild(c);
    },
    update: (lt) => {
      if (!c || !frame) return;
      const v = k.view;
      const m = 34;
      const reveal = Math.min(1, lt / 0.6);
      const out = lt > d - 0.25 ? Math.max(0, (d - lt) / 0.25) : 1;
      frame.clear();
      const x0 = v.x + m;
      const y0 = v.y + m;
      const w = v.w - m * 2;
      const h = v.h - m * 2;
      // the double rule drawn in, then corner fleurons (simple engraved knots)
      frame.rect(x0, y0, w * reveal, 4).fill(ink).rect(x0, y0 + h - 4, w * reveal, 4).fill(ink);
      frame.rect(x0, y0, 4, h * reveal).fill(ink).rect(x0 + w - 4, y0, 4, h * reveal).fill(ink);
      frame.rect(x0 + 12, y0 + 12, (w - 24) * reveal, 1.5).fill(ink).rect(x0 + 12, y0 + h - 13.5, (w - 24) * reveal, 1.5).fill(ink);
      frame.rect(x0 + 12, y0 + 12, 1.5, (h - 24) * reveal).fill(ink).rect(x0 + w - 13.5, y0 + 12, 1.5, (h - 24) * reveal).fill(ink);
      // the margin outside the plate: paper
      frame.rect(v.x - 40, v.y - 40, v.w + 80, m + 40).fill(paper).rect(v.x - 40, v.y + v.h - m, v.w + 80, m + 40).fill(paper);
      frame.rect(v.x - 40, v.y - 40, m + 40, v.h + 80).fill(paper).rect(v.x + v.w - m, v.y - 40, m + 40, v.h + 80).fill(paper);
      for (const [cx, cy] of [[x0 + 26, y0 + 26], [x0 + w - 26, y0 + 26], [x0 + 26, y0 + h - 26], [x0 + w - 26, y0 + h - 26]]) {
        frame.circle(cx, cy, 7 * reveal).stroke({ width: 1.5, color: ink }).circle(cx, cy, 2.5 * reveal).fill(ink);
      }
      const cart = c.getChildByLabel('cart');
      if (cart) {
        cart.position.set(v.x + v.w / 2, v.y + v.h - m - 64);
        cart.alpha = Math.min(1, Math.max(0, (lt - 0.4) / 0.5));
      }
      c.alpha = out;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
      frame = null;
    },
  });
};

/** the plate breaks: paper shards with ink hatch fly out from a point, the colour world shows through */
const smash: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 0.42);
  const pal = k.palFor(cue);
  const paper = typeof a.paper === 'number' ? (a.paper as number) : 0xf1e6cf;
  const ink = typeof a.ink === 'number' ? (a.ink as number) : 0x2a2018;
  let g: Graphics | null = null;
  const n = 26;
  const R = (i: number) => hash(cue.id * 13 + i);
  void pal;
  return clip(cue.m, d, {
    z: 3,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const v = k.view;
      const cx = num(a, 'x', W / 2);
      const cy = num(a, 'y', H / 2);
      const t = lt / d;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + R(i) * 0.3;
        const r0 = 40 + R(i + 50) * Math.max(v.w, v.h) * 0.55;
        const sp = (900 + R(i + 99) * 1600) * t;
        const px = cx + Math.cos(ang) * (r0 + sp);
        const py = cy + Math.sin(ang) * (r0 + sp) + 600 * t * t;
        const s = (140 + R(i + 7) * 260) * (1 - t * 0.5);
        const rot = ang + t * (R(i + 3) - 0.5) * 8;
        const pts: number[] = [];
        for (let j = 0; j < 4; j++) {
          const aa = rot + j * (Math.PI / 2) + (R(i * 4 + j) - 0.5) * 0.9;
          pts.push(px + Math.cos(aa) * s * (0.5 + R(i + j * 9) * 0.5), py + Math.sin(aa) * s * (0.5 + R(i + j * 11) * 0.5));
        }
        g.poly(pts).fill({ color: paper, alpha: 1 - t * 0.3 }).stroke({ width: 3, color: ink });
        // hatch lines on the shard
        for (let l = -2; l <= 2; l++) g.moveTo(px - s * 0.4, py + l * s * 0.12).lineTo(px + s * 0.4, py + l * s * 0.12 - s * 0.1).stroke({ width: 2, color: ink, alpha: 0.8 - t * 0.5 });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** drill / spiral speed lines (the climax) — redrawn on twos */
const spiral: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  const col = palCol(k, a.color, 'light');
  let g: Graphics | null = null;
  let last = -1;
  return clip(cue.m, d, {
    z: 1,
    mount: () => {
      g = new Graphics();
      g.blendMode = 'add';
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      const step = Math.floor(lt * 12);
      g.alpha = Math.min(1, lt / 0.15) * (lt > d - 0.3 ? Math.max(0, (d - lt) / 0.3) : 1) * num(a, 'alpha', 0.55);
      if (step === last) return;
      last = step;
      g.clear();
      const cx = W / 2;
      const cy = H / 2;
      const arms = k.quality === 'high' ? 14 : 8;
      const turn = step * 0.22;
      for (let i = 0; i < arms; i++) {
        const a0 = (i / arms) * Math.PI * 2 + turn;
        g.moveTo(cx + Math.cos(a0) * 180, cy + Math.sin(a0) * 180);
        for (let s = 1; s <= 12; s++) {
          const r = 180 + s * 95;
          const aa = a0 + s * 0.16;
          g.lineTo(cx + Math.cos(aa) * r, cy + Math.sin(aa) * r);
        }
        g.stroke({ width: 5 + (i % 3) * 3, color: col });
      }
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** the end card: the rhythm grade (cosmetic), engraved-medal style */
const gradeCard: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 2.4);
  let c: Container | null = null;
  return clip(cue.m, d, {
    z: 9,
    mount: () => {
      let sum = 0;
      let n = 0;
      for (const p of k.score.prompts) {
        if (p.optional || p.type === 'choice') continue;
        const j = k.judged(p.id);
        sum += j?.r === 'great' ? 1 : j?.r === 'hit' ? 0.6 : 0;
        n++;
      }
      const pct = n ? sum / n : 1;
      const g = pct >= 0.92 ? 'S' : pct >= 0.75 ? 'A' : pct >= 0.5 ? 'B' : 'C';
      c = new Container();
      const medal = new Graphics().circle(0, 0, 118).fill(k.pal.ink).circle(0, 0, 104).fill(k.pal.accent).circle(0, 0, 92).stroke({ width: 3, color: k.pal.ink });
      for (let i = 0; i < 24; i++) {
        const an = (i / 24) * Math.PI * 2;
        medal.moveTo(Math.cos(an) * 96, Math.sin(an) * 96).lineTo(Math.cos(an) * 104, Math.sin(an) * 104).stroke({ width: 3, color: k.pal.ink });
      }
      const big = k.text.sprite(g, slamStyle(150, 0xffffff, k.pal.ink));
      big.position.set(0, 6);
      const lab = k.text.sprite('RITMO', PLATE_SUB(20, k.pal.ink));
      lab.position.set(0, 140);
      c.addChild(medal, big, lab);
      k.layers.ui.addChild(c);
    },
    update: (lt) => {
      if (!c) return;
      const v = k.view;
      c.position.set(v.x + v.w - 220, v.y + v.h - 230);
      const st = Math.floor(lt * 12);
      c.scale.set(st === 0 ? 1.5 : st === 1 ? 0.92 : 1);
      c.rotation = -0.06;
      c.alpha = lt > d - 0.2 ? Math.max(0, (d - lt) / 0.2) : 1;
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = null;
    },
  });
};

/** a soft colored wash (the plate sun, the rift's glow) — never a full-screen flash */
const wash: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1);
  const color = safeFlashColor(palCol(k, a.color, 'accent'));
  const amt = Math.min(0.24, num(a, 'amount', 0.18));
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    mount: () => {
      g = new Graphics().rect(-200, -200, W + 400, H + 400).fill(color);
      g.blendMode = 'add';
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (g) g.alpha = amt * Math.sin(Math.min(1, lt / d) * Math.PI);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};


// ------------------------------------------------------------------ more scene verbs
/** the cold open: the battle's last frame plunges up and away, as if we dropped under the sea */
const coldOpen: VerbFn = (k, a, cue) => {
  const d = num(a, 'dur', 1.6);
  let sp: Sprite | null = null;
  let veil: Graphics | null = null;
  return clip(cue.m, d, {
    z: 20,
    mount: () => {
      if (k.snapshot) {
        sp = new Sprite(k.snapshot);
        sp.zIndex = 20;
        k.layers.panels.addChild(sp);
      }
      veil = new Graphics().rect(-400, -400, W + 800, H + 800).fill(k.pal.ink);
      veil.zIndex = 21;
      k.layers.panels.addChild(veil);
    },
    update: (lt) => {
      const v = k.view;
      const t = Math.max(0, (lt - 0.25) / (d - 0.25));
      const e = t * t * (3 - 2 * t);
      if (sp) {
        sp.position.set(v.x, v.y - e * v.h * 0.9);
        sp.width = v.w;
        sp.height = v.h;
        sp.alpha = 1 - e;
      }
      if (veil) veil.alpha = lt < 0.25 ? 0 : Math.max(0, 0.85 * (1 - e) * Math.min(1, (lt - 0.25) * 6));
    },
    unmount: () => {
      sp?.destroy();
      veil?.destroy();
      sp = null;
      veil = null;
    },
  });
};

/** the eye looks (x, y in −1..1) */
const look: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 2);
  const x = num(a, 'x', 0.5);
  const y = num(a, 'y', 0.2);
  return clip(cue.m, d, {
    update: (lt) => {
      const e = Math.min(1, lt / 0.25) * (lt > d - 0.4 ? Math.max(0, (d - lt) / 0.4) : 1);
      S(k).wantLook(x * e, y * e);
    },
  });
};

/** the wings open with the mash taps */
const wingsMash: VerbFn = (k, a, cue) => {
  const id = String(a.prompt ?? '');
  const d = durOf(k, a, 6);
  return clip(cue.m, d + 0.6, {
    update: () => {
      const st = k.prompt(id);
      if (!st) return;
      const need = st.p.spec.need?.[1] ?? 20;
      S(k).wantWings(Math.min(1, st.taps / need));
    },
  });
};

/** our ship dodges (up / down / left / right) — the camera stays, the hull swerves */
const dodge: VerbFn = (k, a, cue) => {
  const side = String(a.side ?? 'up');
  const d = num(a, 'dur', 1.3);
  const dir = side === 'up' ? [0, 26, 0] : side === 'down' ? [0, -22, 0] : side === 'left' ? [0, 6, -34] : [0, 6, 34];
  return clip(cue.m, d, {
    update: (lt) => {
      const e = Math.sin(Math.min(1, lt / d) * Math.PI);
      S(k).wantShipOffset(dir[0] * e, dir[1] * e, dir[2] * e);
      S(k).wantJolt(0, (side === 'left' ? -0.35 : side === 'right' ? 0.35 : 0) * e);
      k.cam.roll((side === 'left' ? -0.05 : 0.05) * e);
    },
  });
};

/** the whole chain rig jerks (a haul) */
const snapShake: VerbFn = (k, a, cue) =>
  clip(cue.m, 0.7, {
    update: (lt) => {
      const st = S(k);
      st.wantShake(5 * Math.exp(-lt * 6));
      k.cam.shake(14 * Math.exp(-lt * 7), k.m, cue.id, 26);
      if (lt < 0.02) for (let c = 0; c < 6; c++) {
        const at = st.world.chains.attach[c]?.clone();
        if (at) st.wantBurst({ t0: cue.m, kind: 'sparks', at, scale: 2.4, seed: cue.id * 9 + c });
      }
    },
  });

/** a charge while a hold / mash runs: starfire gathers at the bow (amount = how far the gesture is) */
const charge: VerbFn = (k, a, cue) => {
  const id = String(a.prompt ?? '');
  const d = durOf(k, a, 4);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 2,
    mount: () => {
      g = new Graphics();
      g.blendMode = 'add';
      k.layers.wfx.addChild(g);
    },
    update: () => {
      if (!g) return;
      g.clear();
      const st = k.prompt(id);
      if (!st) return;
      let amt = 0;
      if (st.p.type === 'mash') amt = Math.min(1, st.taps / (st.p.spec.need?.[1] ?? 12));
      else if (st.from !== undefined && st.to === undefined && !st.done) amt = Math.min(1, (k.m - st.from) / Math.max(0.2, st.p.mEnd - st.from));
      else if (st.done && st.result !== 'miss') amt = Math.max(0, 1 - (k.m - st.p.mEnd) / 0.3);
      if (amt <= 0.01) return;
      const stg = S(k);
      const bow = stg.bowWorld(new THREE.Vector3());
      const step = Math.floor(k.m * 8);
      stg.wantBurst({ t0: step / 8, kind: 'star', at: bow, scale: 0.8 + amt * 1.6, seed: step });
      stg.wantShake(amt * 0.8);
      const p = k.stage.anchor?.('bow', k);
      if (!p) return;
      const s = Math.floor(k.m * 12);
      const R = 40 + amt * 120;
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * Math.PI * 2 + s * 0.4;
        g.moveTo(p[0] + Math.cos(an) * R * 0.3, p[1] + Math.sin(an) * R * 0.3).lineTo(p[0] + Math.cos(an) * R, p[1] + Math.sin(an) * R).stroke({ width: 4 + amt * 6, color: palCol(k, 'accent'), alpha: 0.7 });
      }
      g.circle(p[0], p[1], R * 0.35).fill({ color: 0xfff6dc, alpha: 0.5 + amt * 0.4 });
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** the broadside: n shots from our guns at the wrap chain, staggered */
const volley: VerbFn = (k, a, cue) => {
  const n = num(a, 'n', 6);
  const out: Clip[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = cue.m + i * 0.11;
    out.push(
      clip(t0, 1.2, {
        update: (lt) => {
          const st = S(k);
          const u = i % 2 ? 0.36 : 0.7;
          const tgt = st.world.lev.toWorld(st.world.lev.surface(u, -Math.PI / 2 + (i - n / 2) * 0.2, 3, new THREE.Vector3()), new THREE.Vector3());
          if (lt < 0.12) st.wantBeam(tgt, 1 - lt / 0.12, 1.4);
          st.wantBurst({ t0, kind: 'sparks', at: tgt, scale: 2.4, seed: cue.id * 31 + i });
          if (lt < 0.2) st.wantShake(1.5);
        },
      }),
    );
  }
  return out;
};

/** a link the size of a house drops past us (2D silhouette in front, a shake) */
const bigLink: VerbFn = (k, a, cue) => {
  const d = durOf(k, a, 1.4);
  let g: Graphics | null = null;
  return clip(cue.m, d, {
    z: 4,
    mount: () => {
      g = new Graphics();
      k.layers.screen.addChild(g);
    },
    update: (lt) => {
      if (!g) return;
      g.clear();
      const v = k.view;
      const y = v.y - 700 + (lt / d) * (v.h + 1400);
      const x = v.x + v.w * 0.62;
      g.ellipse(x, y, 260, 420).stroke({ width: 110, color: k.pal.ink }).ellipse(x, y, 260, 420).stroke({ width: 70, color: k.pal.shadow });
      g.ellipse(x - 30, y - 30, 240, 400).stroke({ width: 10, color: k.pal.light, alpha: 0.5 });
      S(k).wantShake(3);
    },
    unmount: () => {
      g?.destroy();
      g = null;
    },
  });
};

/** the big starfire: Canelo's charged beam (at a wrap chain, or THE LINE) */
const mega: VerbFn = (k, a, cue) => {
  const p = num(a, 'power', 1);
  const d = 0.5 + p * 0.5;
  const toLine = !!a.line;
  return [
    clip(cue.m, d, {
      update: (lt) => {
        const st = S(k);
        const tgt = toLine ? st.heartWorld(new THREE.Vector3()).setY(st.world.chains.line.position.y) : st.world.chains.attach[1]?.clone() ?? st.heartWorld(new THREE.Vector3());
        const on = lt < 0.06 ? lt / 0.06 : Math.max(0, 1 - (lt - 0.06) / (d - 0.06)) ** 0.5;
        st.wantBeam(tgt, on, 2.5 + p * 4.5);
        st.wantShake(6 * p * on);
        st.wantBurst({ t0: cue.m, kind: 'star', at: tgt, scale: 3 + p * 3, seed: cue.id });
        st.wantBurst({ t0: cue.m, kind: 'sparks', at: tgt.clone(), scale: 3 + p * 2, seed: cue.id + 5 });
        st.wantEmote('canelo', 'attack');
      },
    }),
    ...([wash(k, { color: 'accent', amount: 0.12 + p * 0.08, dur: d }, cue)].flat().filter(Boolean) as Clip[]),
  ];
};

export const HEM_VERBS: Record<string, VerbFn> = { fire, bolt, roar, jolt, emote, snap, burst: burstV, noCast, slam, plate, smash, spiral, gradeCard, wash, coldOpen, look, wingsMash, dodge, snapShake, charge, volley, bigLink, mega };
