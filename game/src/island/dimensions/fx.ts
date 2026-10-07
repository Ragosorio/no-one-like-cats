/**
 * Live per-dimension animation at terrain level (under buildings) and in the dimension's sky:
 * ink boil, lava pulse + heat shimmer + banners, neon flicker, aurora, the glitch eye + RGB bursts,
 * prism caustics, orbiting star shards. Only ticks while the island is on screen.
 */
import { Container, DisplacementFilter, Graphics, Sprite, Texture } from 'pixi.js';
import { RGBSplitFilter } from 'pixi-filters';
import { isoToScreen, TW, TH } from '../iso';
import { key } from '../archipelago';
import { glowTexture, sparkTexture } from '../../art/textures';
import { RegionLayer } from './regionLayer';
import { bake, rng, particleTex } from './bake';
import { auroraTex, irisTex, skyTex, SKY_FRAMES } from './sky';
import type { CamInfo } from './state';

export interface DimFx {
  tick(dt: number, t: number, cam: CamInfo): void;
  destroy(): void;
}
export interface SkyCtx {
  /** holder in the backdrop layer (parallax), world coords */
  holder: Container;
  sprite: Sprite | null;
}

function landPoint(L: RegionLayer, r: () => number) {
  const t = L.plate.land[Math.floor(r() * L.plate.land.length)];
  const p = isoToScreen(t.gx + (r() - 0.5) * 0.8, t.gy + (r() - 0.5) * 0.8);
  return p;
}
function wetPoint(L: RegionLayer, r: () => number) {
  const t = L.plate.wet[Math.floor(r() * Math.max(1, L.plate.wet.length))];
  if (!t) return null;
  const p = isoToScreen(t.gx + (r() - 0.5) * 0.6, t.gy + (r() - 0.5) * 0.6);
  return { x: p.x, y: p.y + L.drop };
}

/** wavy noise for heat shimmer displacement */
function heatMap(): Texture {
  return bake('heat-map', 256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const v = 128 + Math.sin((y / h) * Math.PI * 2 * 6 + Math.sin((x / w) * Math.PI * 2 * 2) * 1.5) * 90;
        img.data[i] = v;
        img.data[i + 1] = 128 + Math.cos((x / w) * Math.PI * 2 * 3 + (y / h) * Math.PI * 2 * 2) * 30;
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  });
}

/** popping glints (snow sparkle / prism) on the island top */
class Glints {
  private items: { s: Sprite; t: number; d: number }[] = [];
  private r = rng(5);
  private acc = 0;
  constructor(
    private L: RegionLayer,
    private tints: number[],
    private rate: number,
    private size = 0.4,
  ) {}
  tick(dt: number) {
    this.acc += dt * this.rate;
    while (this.acc >= 1) {
      this.acc -= 1;
      const p = landPoint(this.L, this.r);
      const s = new Sprite(sparkTexture());
      s.anchor.set(0.5);
      s.tint = this.tints[Math.floor(this.r() * this.tints.length)];
      s.blendMode = 'add';
      s.position.set(p.x, p.y - 4);
      s.scale.set(0);
      this.L.fx.addChild(s);
      this.items.push({ s, t: 0, d: 0.5 + this.r() * 0.5 });
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const k = it.t / it.d;
      if (k >= 1) {
        it.s.destroy();
        this.items.splice(i, 1);
        continue;
      }
      const sc = Math.sin(k * Math.PI) * this.size;
      it.s.scale.set(sc);
      it.s.rotation = k * 1.2;
    }
  }
  destroy() {
    this.items.forEach((i) => i.s.destroy());
    this.items = [];
  }
}

export function createFx(L: RegionLayer, sky: SkyCtx): DimFx | null {
  switch (L.dim.id) {
    case 'home':
    case 'forest':
      return waterFx(L);
    case 'cliff':
      return inkFx(L, sky);
    case 'volcano':
      return infernoFx(L, sky);
    case 'ghost':
      return neonFx(L, sky);
    case 'ice':
      return auroraFx(L, sky);
    case 'ruins':
      return glitchFx(L, sky);
    case 'reef':
      return prismFx(L);
    case 'cosmic':
      return cosmicFx(L, sky);
    case 'sakura':
      return gentleFx(L, [0xffffff, 0xffc9de, 0xff9ec4], 4);
    case 'desert':
      return gentleFx(L, [0xfff2b0, 0xffd36a, 0xffffff], 3);
    case 'candy':
      return prismFx(L);
    case 'void':
      return voidFx(L);
  }
  return null;
}

// ------------------------------------------------------------------------------- post-story ring
/** lagoon frames + glints in the dimension's colours (acuarela, sepia) */
function gentleFx(L: RegionLayer, tints: number[], rate: number): DimFx {
  let acc = 0;
  let f = 0;
  const glints = new Glints(L, tints, rate, 0.4);
  return {
    tick(dt) {
      acc += dt;
      if (acc > 0.42) {
        acc = 0;
        RegionLayer.frame(L.lagOv, ++f);
      }
      glints.tick(dt);
    },
    destroy() {
      glints.destroy();
    },
  };
}
/** photo negative: a red rim that breathes + white/red glints */
function voidFx(L: RegionLayer): DimFx {
  const rim = edgeGlow(L, 0xff2e48, () => true, 14, 3);
  const glints = new Glints(L, [0xffffff, 0xff2e48], 3, 0.35);
  return {
    tick(dt, t) {
      rim.alpha = 0.55 + Math.sin(t * 0.9) * 0.35;
      glints.tick(dt);
    },
    destroy() {
      glints.destroy();
    },
  };
}

// ------------------------------------------------------------------------------- cozy / valle
function waterFx(L: RegionLayer): DimFx {
  let acc = 0;
  let f = 0;
  return {
    tick(dt) {
      acc += dt;
      if (acc > 0.42) {
        acc = 0;
        RegionLayer.frame(L.lagOv, ++f);
      }
    },
    destroy() {},
  };
}

// ------------------------------------------------------------------------------- TINTA (boil)
function inkFx(L: RegionLayer, sky: SkyCtx): DimFx {
  let acc = 0;
  let f = 0;
  const skyFrames = SKY_FRAMES.cliff ?? 1;
  // a pencil stroke that redraws itself across the island now and then
  const pencil = new Graphics();
  L.fx.addChild(pencil);
  let pT = 2;
  let pPath: [number, number][] = [];
  let pK = 0;
  const r = rng(9);
  return {
    tick(dt) {
      acc += dt;
      if (acc >= 1 / 8) {
        acc = 0;
        f++;
        RegionLayer.frame(L.pat, f);
        RegionLayer.frame(L.lagOv, f);
        RegionLayer.frame(L.rockOv, f);
        if (sky.sprite && skyFrames > 1 && f % 2 === 0) sky.sprite.texture = skyTex(L.dim, false, (f / 2) % skyFrames);
        // pencil
        if (pPath.length) {
          pK = Math.min(pPath.length, pK + 3);
          pencil.clear();
          pencil.moveTo(pPath[0][0], pPath[0][1]);
          for (let i = 1; i < pK; i++) pencil.lineTo(pPath[i][0] + (r() - 0.5) * 1.5, pPath[i][1] + (r() - 0.5) * 1.5);
          pencil.stroke({ width: 2.2, color: 0x171317, alpha: 0.75, cap: 'round', join: 'round' });
          if (pK >= pPath.length) pT -= 1 / 8;
          if (pT < -0.6) {
            pencil.clear();
            pPath = [];
            pT = 2 + r() * 3;
          }
        }
      }
      if (!pPath.length) {
        pT -= dt;
        if (pT <= 0) {
          const a = landPoint(L, r);
          const n = 14;
          const ang = (r() < 0.5 ? -1 : 1) * 0.46;
          pPath = [];
          for (let i = 0; i < n; i++) pPath.push([a.x + i * 9, a.y + Math.tan(ang) * i * 9 + Math.sin(i * 0.9) * 4]);
          // a little hatch at the end
          const e = pPath[n - 1];
          for (let k = 0; k < 4; k++) pPath.push([e[0] + 6 + k * 4, e[1] - 6 + (k % 2) * 12]);
          pK = 0;
          pT = 0.6;
        }
      }
    },
    destroy() {
      pencil.destroy();
    },
  };
}

// ------------------------------------------------------------------------------- INFERNO
function infernoFx(L: RegionLayer, sky: SkyCtx): DimFx {
  const r = rng(13);
  // heat shimmer on the sky (one displacement pass)
  const map = new Sprite(heatMap());
  map.texture.source.addressMode = 'repeat';
  map.scale.set(6);
  map.renderable = false;
  sky.holder.addChild(map);
  const disp = new DisplacementFilter({ sprite: map, scale: 9 });
  sky.holder.filters = [disp];
  // live waving banners flanking the island (silhouettes in the sky)
  const banners = new Graphics();
  sky.holder.addChild(banners);
  const P = L.plate;
  const poles = [
    { x: P.minX - 80, base: P.maxY + 260, len: 760, lean: -0.12, w: 120, h: 260 },
    { x: P.maxX + 60, base: P.maxY + 300, len: 820, lean: 0.14, w: 130, h: 300 },
    { x: P.minX + 120, base: P.minY + 40, len: 520, lean: -0.05, w: 90, h: 180 },
  ];
  // lava bubbles in the lagoon
  const bubbles: { g: Graphics; t: number; d: number }[] = [];
  let bAcc = 0;
  let acc = 0;
  let mapX = 0;
  return {
    tick(dt, t) {
      if (L.glow) L.glow.alpha = 0.5 + Math.sin(t * 2.1) * 0.22 + Math.sin(t * 7.3) * 0.08;
      RegionLayer.fade(L.lagOv, 0.5 + Math.sin(t * 0.9) * 0.5);
      mapX += dt * 40;
      map.position.set(mapX, -t * 60);
      acc += dt;
      if (acc >= 1 / 12) {
        acc = 0;
        banners.clear();
        for (const [i, b] of poles.entries()) {
          const tx = b.x + Math.sin(b.lean) * b.len;
          const ty = b.base - Math.cos(b.lean) * b.len;
          banners.moveTo(b.x, b.base).lineTo(tx, ty).stroke({ width: 9, color: 0x1a0204 });
          banners.poly([tx - 8, ty + 8, tx + Math.sin(b.lean) * 46, ty - 46, tx + 8, ty + 8]).fill(0x1a0204);
          const cx = tx - 6;
          const cy = ty + 34;
          banners.moveTo(cx - 10, cy).lineTo(cx + b.w + 10, cy + 6).stroke({ width: 6, color: 0x1a0204 });
          const pts: number[] = [cx, cy, cx + b.w, cy + 6];
          const seg = 6;
          for (let k = 0; k <= seg; k++) {
            const f = k / seg;
            const y = cy + 6 + b.h * f;
            const wav = Math.sin(t * 3.2 + f * 4 + i) * 14 * f;
            pts.push(cx + b.w + wav + (k === seg ? 0 : 0), y);
          }
          // tattered bottom
          for (let k = 0; k < 5; k++) pts.push(cx + b.w - (k + 0.5) * (b.w / 5) + Math.sin(t * 3.2 + 4 + i) * 14, cy + b.h + (k % 2 ? 26 : -8) + Math.sin(t * 5 + k) * 6);
          for (let k = seg; k >= 0; k--) {
            const f = k / seg;
            const wav = Math.sin(t * 3.2 + f * 4 + i + 0.6) * 12 * f;
            pts.push(cx + wav, cy + b.h * f);
          }
          banners.poly(pts).fill(i === 1 ? 0x2e0612 : 0x22040a);
          // sigil
          banners.circle(cx + b.w * 0.5 + Math.sin(t * 3.2 + 2 + i) * 6, cy + b.h * 0.42, b.w * 0.18).stroke({ width: 4, color: 0x7a0a14 });
        }
      }
      bAcc += dt;
      if (bAcc > 0.35) {
        bAcc = 0;
        const p = wetPoint(L, r);
        if (p) {
          const g = new Graphics().ellipse(0, 0, 7, 3.5).fill({ color: 0xffe2a0, alpha: 0.9 }).stroke({ width: 2, color: 0x3a1410 });
          g.position.set(p.x, p.y);
          L.lagoon.addChild(g);
          bubbles.push({ g, t: 0, d: 0.7 + r() * 0.4 });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.t += dt;
        const k = b.t / b.d;
        if (k >= 1) {
          b.g.destroy();
          bubbles.splice(i, 1);
          continue;
        }
        b.g.scale.set(0.4 + k * 1.6);
        b.g.alpha = k < 0.7 ? 1 : (1 - k) / 0.3;
      }
    },
    destroy() {
      sky.holder.filters = [];
      map.destroy();
      banners.destroy();
      bubbles.forEach((b) => b.g.destroy());
    },
  };
}

// ------------------------------------------------------------------------------- NEÓN NOIR
/** additive glowing outline along an island's coast edges */
function edgeGlow(L: RegionLayer, color: number, pick: (i: number) => boolean, wide = 12, core = 3.5) {
  const landSet = new Set(L.plate.land.map((t) => key(t.gx, t.gy)));
  const hw = TW / 2;
  const hh = TH / 2;
  const g = new Graphics();
  let i = 0;
  for (const t of L.plate.land) {
    const p = isoToScreen(t.gx, t.gy);
    const edges: [number, number, number, number, number, number][] = [
      [0, -1, p.x, p.y - hh, p.x + hw, p.y],
      [1, 0, p.x + hw, p.y, p.x, p.y + hh],
      [0, 1, p.x, p.y + hh, p.x - hw, p.y],
      [-1, 0, p.x - hw, p.y, p.x, p.y - hh],
    ];
    for (const [dx, dy, x0, y0, x1, y1] of edges) {
      if (landSet.has(key(t.gx + dx, t.gy + dy))) continue;
      if (!pick(i++)) continue;
      g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: wide, color, alpha: 0.22, cap: 'round' });
      g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: core, color, alpha: 0.95, cap: 'round' });
    }
  }
  g.blendMode = 'add';
  L.fx.addChild(g);
  return g;
}

function neonFx(L: RegionLayer, sky: SkyCtx): DimFx {
  const mk = (color: number, pick: (i: number) => boolean) => edgeGlow(L, color, pick);
  const cyan = mk(0x00e5ff, (i) => i % 5 !== 0);
  const pink = mk(0xff2e88, (i) => i % 5 === 0);
  const tubes = [
    { g: cyan, off: 0, next: 1 },
    { g: pink, off: 0, next: 0.4 },
  ];
  const r = rng(17);
  // flying lights crossing the sky
  const cars: { s: Sprite; v: number; x0: number; x1: number }[] = [];
  const P = L.plate;
  for (let i = 0; i < 5; i++) {
    const s = new Sprite(glowTexture());
    s.anchor.set(0.5);
    s.scale.set(0.35, 0.12);
    s.tint = i % 2 ? 0xff2e88 : 0x00e5ff;
    s.blendMode = 'add';
    const y = P.minY - 160 - i * 70;
    const x0 = P.minX - 500;
    const x1 = P.maxX + 500;
    s.position.set(x0 + r() * (x1 - x0), y);
    sky.holder.addChild(s);
    cars.push({ s, v: (160 + r() * 160) * (i % 2 ? -1 : 1), x0, x1 });
  }
  let acc = 0;
  let f = 0;
  return {
    tick(dt) {
      for (const tb of tubes) {
        tb.next -= dt;
        if (tb.off > 0) {
          tb.off -= dt;
          tb.g.alpha = 0.12;
        } else tb.g.alpha = 0.85 + Math.sin(performance.now() * 0.05) * 0.08;
        if (tb.next <= 0) {
          tb.next = 0.08 + r() * (r() < 0.2 ? 0.2 : 2.4);
          tb.off = 0.04 + r() * 0.1;
        }
      }
      acc += dt;
      if (acc > 0.3) {
        acc = 0;
        RegionLayer.frame(L.lagOv, ++f);
      }
      for (const c of cars) {
        c.s.x += c.v * dt;
        if (c.v > 0 && c.s.x > c.x1) c.s.x = c.x0;
        if (c.v < 0 && c.s.x < c.x0) c.s.x = c.x1;
      }
    },
    destroy() {
      cyan.destroy();
      pink.destroy();
      cars.forEach((c) => c.s.destroy());
    },
  };
}

// ------------------------------------------------------------------------------- AURORA
function auroraFx(L: RegionLayer, sky: SkyCtx): DimFx {
  const P = L.plate;
  const a = new Sprite(auroraTex());
  a.anchor.set(0.5, 0.5);
  a.blendMode = 'add';
  const w = (P.maxX - P.minX) * 2.2;
  a.width = w;
  a.height = w * 0.5;
  a.position.set(P.cx, P.minY - 120);
  sky.holder.addChild(a);
  const b = new Sprite(auroraTex());
  b.anchor.set(0.5, 0.5);
  b.blendMode = 'add';
  b.width = w * 0.8;
  b.height = w * 0.32;
  b.scale.x *= -1;
  b.position.set(P.cx + 60, P.minY - 60);
  b.tint = 0xb08cff;
  sky.holder.addChild(b);
  const glints = new Glints(L, [0xffffff, 0xc8f4ff, 0x7cffc4], 5, 0.42);
  const sy0 = a.scale.y;
  const sy1 = b.scale.y;
  return {
    tick(dt, t) {
      a.x = P.cx + Math.sin(t * 0.25) * 60;
      a.alpha = 0.65 + Math.sin(t * 0.7) * 0.25;
      a.scale.y = sy0 * (1 + Math.sin(t * 0.5) * 0.12);
      b.x = P.cx + 60 + Math.sin(t * 0.33 + 1) * 80;
      b.alpha = 0.45 + Math.sin(t * 0.9 + 2) * 0.3;
      b.scale.y = sy1 * (1 + Math.sin(t * 0.6 + 1) * 0.15);
      glints.tick(dt);
    },
    destroy() {
      a.destroy();
      b.destroy();
      glints.destroy();
    },
  };
}

// ------------------------------------------------------------------------------- GLITCH
function glitchFx(L: RegionLayer, sky: SkyCtx): DimFx {
  const P = L.plate;
  const r = rng(23);
  // the psychedelic eye torn open in the floating rock (always visible: ruins is the front island)
  const EW = Math.min(220, L.profile.halfW * 0.42);
  const EH = EW * 0.4;
  const eye = new Container();
  eye.position.set(P.cx, P.maxY + L.drop + L.profile.D * 0.36);
  const halo = new Sprite(glowTexture());
  halo.anchor.set(0.5);
  halo.tint = 0xff2e88;
  halo.blendMode = 'add';
  halo.scale.set(EW / 30, EW / 64);
  halo.alpha = 0.6;
  const almond = (g: Graphics, k = 1) => {
    g.moveTo(-EW * k, 0)
      .bezierCurveTo(-EW * 0.5 * k, -EH * 1.25 * k, EW * 0.5 * k, -EH * 1.25 * k, EW * k, 0)
      .bezierCurveTo(EW * 0.5 * k, EH * 1.25 * k, -EW * 0.5 * k, EH * 1.25 * k, -EW * k, 0);
    return g;
  };
  // ragged brushy socket
  const socket = new Graphics();
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2;
    const rr = 0.9 + r() * 0.35;
    const x = Math.cos(a) * EW * rr;
    const y = Math.sin(a) * EH * rr * 1.05;
    socket.moveTo(x * 0.85, y * 0.85).lineTo(x * 1.1 + (r() - 0.5) * 40, y * 1.1 + (r() - 0.5) * 20).stroke({ width: 10 + r() * 14, color: [0x05030a, 0x00e5ff, 0xff2e88, 0xffe066, 0x2020ff][i % 5], alpha: 0.9, cap: 'round' });
  }
  almond(socket, 1.08).fill(0x05030a);
  const lidded = new Container();
  const ball = almond(new Graphics(), 1).fill(0x05030a);
  const iris = new Sprite(irisTex());
  iris.anchor.set(0.5);
  iris.width = iris.height = EH * 1.9;
  const mask = almond(new Graphics(), 0.98).fill(0xffffff);
  lidded.addChild(ball, iris, mask);
  iris.mask = mask;
  const lash = new Graphics();
  eye.addChild(halo, socket, lidded, lash);
  L.back.addChild(eye);
  // glitch apparatus
  const rgb = new RGBSplitFilter({ red: { x: -10, y: 0 }, green: { x: 0, y: 4 }, blue: { x: 10, y: -3 } });
  const bars = new Graphics();
  bars.blendMode = 'add';
  L.fx.addChild(bars);
  const scan = new Graphics();
  scan.blendMode = 'add';
  L.fx.addChild(scan);
  const pixels = new Container();
  L.fx.addChild(pixels);
  let burst = 0;
  let nextBurst = 1.5;
  let blink = 0;
  let nextBlink = 3;
  let scanY = -1;
  let nextScan = 2;
  let acc = 0;
  let f = 0;
  const look = { x: 0, y: 0 };
  return {
    tick(dt, t, cam) {
      // iris follows the camera centre (the player is being watched)
      const dx = cam.cx - eye.x;
      const dy = cam.cy - eye.y;
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(1, d / 900);
      look.x += ((dx / d) * m * EW * 0.42 - look.x) * Math.min(1, dt * 3);
      look.y += ((dy / d) * m * EH * 0.35 - look.y) * Math.min(1, dt * 3);
      iris.position.set(look.x, look.y);
      iris.rotation += dt * 0.6;
      halo.alpha = 0.5 + Math.sin(t * 1.3) * 0.15;
      // blink
      nextBlink -= dt;
      if (nextBlink <= 0 && blink <= 0) {
        blink = 0.22;
        nextBlink = 3 + r() * 5;
      }
      if (blink > 0) {
        blink -= dt;
        const k = Math.sin((1 - Math.max(0, blink) / 0.22) * Math.PI);
        lidded.scale.y = Math.max(0.04, 1 - k);
        lash.clear();
        if (k > 0.6) lash.moveTo(-EW, 0).quadraticCurveTo(0, EH * 0.5, EW, 0).stroke({ width: 8, color: 0x05030a, cap: 'round' });
      } else lidded.scale.y = 1;
      // pixel shimmer on the land
      acc += dt;
      if (acc > 0.4) {
        acc = 0;
        RegionLayer.frame(L.pat, ++f);
        RegionLayer.frame(L.lagOv, f);
      }
      // RGB burst
      nextBurst -= dt;
      if (nextBurst <= 0) {
        nextBurst = 2 + r() * 3.5;
        burst = 0.12 + r() * 0.16;
        rgb.red = { x: -6 - r() * 16, y: (r() - 0.5) * 6 };
        rgb.blue = { x: 6 + r() * 16, y: (r() - 0.5) * 6 };
        sky.holder.filters = [rgb];
        bars.clear();
        const n = 3 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) {
          const y = P.minY + r() * (P.maxY - P.minY + 60);
          const x = P.minX + r() * (P.maxX - P.minX) * 0.6;
          bars.rect(x, y, 60 + r() * (P.maxX - P.minX) * 0.5, 3 + r() * 9).fill({ color: r() < 0.5 ? 0x00e5ff : 0xff2e88, alpha: 0.55 });
        }
        for (let i = 0; i < 10; i++) {
          const p = landPoint(L, r);
          const s = new Sprite(particleTex('pixel'));
          s.anchor.set(0.5);
          s.tint = [0x00e5ff, 0xff2e88, 0xffe066, 0x7cff6a][i % 4];
          s.scale.set(0.4 + r() * 0.9, 0.3 + r() * 0.5);
          s.position.set(p.x, p.y - r() * 40);
          pixels.addChild(s);
        }
        const sh = (r() < 0.5 ? -1 : 1) * (3 + r() * 5);
        L.land.x = L.over.x = sh;
        L.lagoon.x = -sh * 0.6;
      }
      if (burst > 0) {
        burst -= dt;
        if (burst <= 0) {
          sky.holder.filters = [];
          bars.clear();
          pixels.removeChildren().forEach((c) => c.destroy());
          L.land.x = L.over.x = L.lagoon.x = 0;
        }
      }
      // scanline sweep
      nextScan -= dt;
      if (nextScan <= 0 && scanY < 0) {
        scanY = 0;
        nextScan = 3.5 + r() * 3;
      }
      if (scanY >= 0) {
        scanY += dt * 1.1;
        const y = P.minY - 40 + scanY * (P.maxY - P.minY + 160);
        scan.clear();
        scan.rect(P.minX, y, P.maxX - P.minX, 3).fill({ color: 0x7ff3ff, alpha: 0.5 });
        scan.rect(P.minX, y - 18, P.maxX - P.minX, 18).fill({ color: 0x00e5ff, alpha: 0.08 });
        if (scanY >= 1) {
          scanY = -1;
          scan.clear();
        }
      }
    },
    destroy() {
      sky.holder.filters = [];
      eye.destroy({ children: true });
      bars.destroy();
      scan.destroy();
      pixels.destroy({ children: true });
      L.land.x = L.over.x = L.lagoon.x = 0;
    },
  };
}

// ------------------------------------------------------------------------------- PRISMA
function prismFx(L: RegionLayer): DimFx {
  const glints = new Glints(L, [0xff7ab8, 0xffc94a, 0x7cffc4, 0x7fd8ff, 0xb59cff], 6, 0.5);
  return {
    tick(dt, t) {
      RegionLayer.fade(L.pat, 0.5 + Math.sin(t * 1.4) * 0.5);
      RegionLayer.fade(L.lagOv, 0.5 + Math.sin(t * 1.1 + 1) * 0.5);
      glints.tick(dt);
    },
    destroy() {
      glints.destroy();
    },
  };
}

// ------------------------------------------------------------------------------- ESTELAR
function cosmicFx(L: RegionLayer, sky: SkyCtx): DimFx {
  const P = L.plate;
  const r = rng(29);
  const shards: { s: Sprite; a: number; v: number; rx: number; ry: number; yo: number }[] = [];
  const rx = (P.maxX - P.minX) * 0.62;
  for (let i = 0; i < 9; i++) {
    const s = new Sprite(particleTex('shard'));
    s.anchor.set(0.5);
    s.tint = [0x8a5cff, 0x00e5ff, 0xff7ab8, 0xffffff][i % 4];
    s.scale.set(0.8 + r() * 1.4);
    L.back.addChild(s);
    shards.push({ s, a: r() * Math.PI * 2, v: 0.12 + r() * 0.18, rx: rx * (0.8 + r() * 0.4), ry: rx * 0.28, yo: L.drop + 60 + r() * 120 });
  }
  const stars: { g: Graphics; t: number }[] = [];
  let next = 1.5;
  const glints = new Glints(L, [0xffffff, 0xc8b4ff, 0x9ff3ff], 4, 0.35);
  const rimV = edgeGlow(L, 0x8a5cff, (i) => i % 4 !== 0, 14, 3);
  const rimC = edgeGlow(L, 0x00e5ff, (i) => i % 4 === 0, 10, 2.5);
  return {
    tick(dt, t) {
      rimV.alpha = 0.7 + Math.sin(t * 1.2) * 0.25;
      rimC.alpha = 0.7 + Math.sin(t * 1.2 + 2) * 0.25;
      for (const s of shards) {
        s.a += s.v * dt;
        s.s.position.set(P.cx + Math.cos(s.a) * s.rx, P.cy + s.yo + Math.sin(s.a) * s.ry);
        s.s.rotation += dt * 0.8;
        s.s.alpha = 0.6 + Math.sin(s.a * 3) * 0.3;
      }
      for (const o of L.pat) o.alpha = 0.75 + Math.sin(t * 2.3) * 0.25;
      glints.tick(dt);
      next -= dt;
      if (next <= 0) {
        next = 2.5 + r() * 4;
        const g = new Graphics();
        const x = P.minX + r() * (P.maxX - P.minX);
        const y = P.minY - 250 - r() * 250;
        g.moveTo(0, 0).lineTo(-140, -60).stroke({ width: 3, color: 0xffffff, alpha: 0.9, cap: 'round' });
        g.moveTo(-140, -60).lineTo(-260, -112).stroke({ width: 2, color: 0xc8b4ff, alpha: 0.4, cap: 'round' });
        g.circle(0, 0, 4).fill(0xffffff);
        g.position.set(x, y);
        sky.holder.addChild(g);
        stars.push({ g, t: 0 });
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.t += dt;
        s.g.x += 520 * dt;
        s.g.y += 225 * dt;
        s.g.alpha = Math.max(0, 1 - s.t / 0.9);
        if (s.t > 0.9) {
          s.g.destroy();
          stars.splice(i, 1);
        }
      }
    },
    destroy() {
      shards.forEach((s) => s.s.destroy());
      stars.forEach((s) => s.g.destroy());
      glints.destroy();
      rimV.destroy();
      rimC.destroy();
    },
  };
}

