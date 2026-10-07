/**
 * El Podio — arenas (code-drawn, one per element of the rival: each one a "dimension" of the
 * multiverse). Sky baked once on a small canvas, the rest is ink-outlined Graphics: back silhouettes,
 * a crowd of cat silhouettes that cheers on big hits, spotlights, the stage and ambient particles.
 */
import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { glowTexture, dotTexture, sparkTexture, halftoneTexture } from '../art/textures';

export interface ArenaDef {
  id: string;
  name: string;
  skyTop: number;
  skyBot: number;
  far: number;
  floor: number;
  floorRim: number;
  accent: number;
  crowd: number;
  particle: 'ember' | 'bubble' | 'leaf' | 'dust' | 'rain' | 'rune' | 'star';
}

export const ARENAS: Record<string, ArenaDef> = {
  fire: { id: 'fire', name: 'COLISEO INFERNO', skyTop: 0x2a0303, skyBot: 0xff6a1a, far: 0x3a0806, floor: 0x3d1a10, floorRim: 0xff6a1a, accent: 0xffc94a, crowd: 0x1a0504, particle: 'ember' },
  water: { id: 'water', name: 'PISCINA ABISAL', skyTop: 0x06182a, skyBot: 0x3f9ccc, far: 0x0e3a4a, floor: 0x1c3a51, floorRim: 0x7fd8ff, accent: 0x7fd8ff, crowd: 0x061320, particle: 'bubble' },
  nature: { id: 'nature', name: 'RING DEL BOSQUE', skyTop: 0x123a22, skyBot: 0xc6e08a, far: 0x1d4a2a, floor: 0x4f5a45, floorRim: 0xa6cf7e, accent: 0xd4f27a, crowd: 0x0c2414, particle: 'leaf' },
  earth: { id: 'earth', name: 'CANTERA ROTA', skyTop: 0x3d2a1a, skyBot: 0xf2c98a, far: 0x6a4424, floor: 0x8a5a30, floorRim: 0xe0b77a, accent: 0xe0b77a, crowd: 0x2a1a0c, particle: 'dust' },
  storm: { id: 'storm', name: 'AZOTEA TORMENTA', skyTop: 0x05080f, skyBot: 0x34507a, far: 0x0a1222, floor: 0x26304a, floorRim: 0x00e5ff, accent: 0xffe14a, crowd: 0x04070d, particle: 'rain' },
  magic: { id: 'magic', name: 'TEATRO ARCANO', skyTop: 0x170c1c, skyBot: 0x8f6b93, far: 0x2a1530, floor: 0x3a2440, floorRim: 0xff7ab8, accent: 0xff7ab8, crowd: 0x120814, particle: 'rune' },
  cosmic: { id: 'cosmic', name: 'CRÁTER ESTELAR', skyTop: 0x020309, skyBot: 0x2a1f5a, far: 0x0c0a1e, floor: 0x16142a, floorRim: 0x8a5cff, accent: 0x00e5ff, crowd: 0x050410, particle: 'star' },
};

export function arenaFor(el: string): ArenaDef {
  return ARENAS[el] ?? ARENAS.fire;
}

const hex = (c: number, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

const skyCache = new Map<string, Texture>();
function skyTexture(a: ArenaDef): Texture {
  const hit = skyCache.get(a.id);
  if (hit && !hit.destroyed) return hit;
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 270;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 270);
  grd.addColorStop(0, hex(a.skyTop));
  grd.addColorStop(0.72, hex(a.skyBot));
  grd.addColorStop(1, hex(a.skyBot));
  g.fillStyle = grd;
  g.fillRect(0, 0, 480, 270);
  // soft radial bloom behind the stage
  const r = g.createRadialGradient(240, 170, 10, 240, 170, 220);
  r.addColorStop(0, hex(a.accent, 0.45));
  r.addColorStop(1, hex(a.accent, 0));
  g.fillStyle = r;
  g.fillRect(0, 0, 480, 270);
  if (a.id === 'cosmic' || a.id === 'storm' || a.id === 'water') {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (a.id === 'cosmic' ? 160 : 50); i++) {
      g.fillStyle = hex(0xffffff, 0.2 + rnd() * 0.6);
      const x = rnd() * 480;
      const y = rnd() * 180;
      const sz = rnd() < 0.1 ? 1.6 : 0.8;
      g.fillRect(x, y, sz, sz);
    }
  }
  const t = Texture.from(c);
  skyCache.set(a.id, t);
  return t;
}

/** stage spots where the fighters stand (feet) */
export const SPOT = [
  { x: 560, y: 790 },
  { x: 1360, y: 790 },
];

export class Arena extends Container {
  readonly def: ArenaDef;
  private crowdRows: Container[] = [];
  private spots: Sprite[] = [];
  private amb = new Container();
  private ambAcc = 0;
  private t = 0;
  private flashG = new Graphics();
  private bolt = new Graphics();
  private boltT = 3;
  private cheer = 0;
  readonly floorLayer = new Container();

  constructor(el: string, leagueName: string, leagueColor: number) {
    super();
    const a = (this.def = arenaFor(el));
    // ---- sky (extends past the 16:9 box so wide screens see sky, not paper)
    const sky = new Sprite(skyTexture(a));
    sky.width = W + 800;
    sky.height = H + 400;
    sky.position.set(-400, -200);
    this.addChild(sky);
    this.addChild(this.bolt);
    this.addChild(this.backdrop(a));
    // ---- spotlights
    for (const [x, rot] of [
      [300, -0.32],
      [W - 300, 0.32],
    ] as const) {
      const cone = new Graphics().poly([-30, 0, 30, 0, 260, 900, -260, 900]).fill({ color: a.accent, alpha: 0.13 });
      cone.position.set(x, -40);
      cone.rotation = rot;
      cone.blendMode = 'add';
      this.addChild(cone);
      gsap.to(cone, { rotation: rot * 0.4, duration: 3.2 + Math.random(), yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
    // ---- crowd (3 rows of cat silhouettes behind the stage)
    for (let r = 0; r < 3; r++) {
      const row = this.crowdRow(a, r);
      this.crowdRows.push(row);
      this.addChild(row);
    }
    // ---- stage
    this.addChild(this.stage(a, leagueColor));
    // ---- league sign
    const sign = new Container();
    const st = txt('EL PODIO', { fontFamily: F.poster, fontSize: 54, fill: C.paper, letterSpacing: 4, stroke: { color: C.ink, width: 10, join: 'round' } });
    st.anchor.set(0.5);
    const sub = txt(`${leagueName} · ${a.name}`, { fontFamily: F.bebas, fontSize: 24, fill: a.accent, letterSpacing: 3, stroke: { color: C.ink, width: 6, join: 'round' } });
    sub.anchor.set(0.5);
    sub.y = 40;
    sign.addChild(st, sub);
    sign.position.set(W / 2, 64);
    this.addChild(sign);
    this.addChild(this.floorLayer, this.amb, this.flashG);
  }

  private backdrop(a: ArenaDef) {
    const g = new Graphics();
    const base = 610;
    switch (a.id) {
      case 'fire': {
        g.circle(W / 2, 360, 230).fill({ color: a.accent, alpha: 0.85 });
        g.poly([0, base, 220, 300, 380, base]).fill(a.far).stroke({ width: 4, color: C.ink });
        g.poly([1500, base, 1720, 260, 1920, base]).fill(a.far).stroke({ width: 4, color: C.ink });
        g.poly([1680, 290, 1720, 260, 1760, 290]).fill(0xff6a1a);
        break;
      }
      case 'water': {
        for (let i = 0; i < 9; i++) {
          const x = 60 + i * 230;
          g.moveTo(x, base).bezierCurveTo(x - 60, base - 200, x + 70, base - 300, x + 10, base - 420 - (i % 3) * 60).stroke({ width: 18, color: a.far, cap: 'round' });
        }
        break;
      }
      case 'nature': {
        for (let i = 0; i < 8; i++) {
          const x = 40 + i * 260 + (i % 2) * 60;
          const h = 300 + (i % 3) * 90;
          g.rect(x - 12, base - h * 0.4, 24, h * 0.4).fill(a.far);
          g.poly([x - 110, base - h * 0.3, x, base - h, x + 110, base - h * 0.3]).fill(a.far).stroke({ width: 4, color: C.ink });
        }
        break;
      }
      case 'earth': {
        g.poly([0, base, 0, 340, 260, 330, 300, base]).fill(a.far).stroke({ width: 4, color: C.ink });
        g.poly([1600, base, 1640, 300, 1920, 310, 1920, base]).fill(a.far).stroke({ width: 4, color: C.ink });
        g.poly([700, base, 760, 450, 900, 440, 960, base]).fill(a.far).stroke({ width: 4, color: C.ink });
        break;
      }
      case 'storm': {
        for (let i = 0; i < 12; i++) {
          const x = i * 170;
          const h = 160 + ((i * 53) % 5) * 70;
          g.rect(x, base - h, 140, h).fill(a.far).stroke({ width: 3, color: C.ink });
          for (let k = 0; k < 4; k++) if ((i + k) % 3 === 0) g.rect(x + 20 + k * 28, base - h + 30, 12, 18).fill({ color: a.accent, alpha: 0.7 });
        }
        break;
      }
      case 'magic': {
        // theatre curtains
        g.rect(-400, -200, 560, H + 400).fill(0x6a1030).stroke({ width: 4, color: C.ink });
        g.rect(W - 160, -200, 560, H + 400).fill(0x6a1030).stroke({ width: 4, color: C.ink });
        for (let i = 0; i < 5; i++) {
          g.moveTo(20 + i * 30, -200).lineTo(20 + i * 30, H).stroke({ width: 3, color: 0x3a0818 });
          g.moveTo(W - 140 + i * 30, -200).lineTo(W - 140 + i * 30, H).stroke({ width: 3, color: 0x3a0818 });
        }
        g.rect(-400, -200, W + 800, 120).fill(0x8a1a40).stroke({ width: 4, color: C.ink });
        break;
      }
      case 'cosmic': {
        g.circle(1500, 260, 120).fill(0x5c3d5b).stroke({ width: 4, color: C.ink });
        g.ellipse(1500, 260, 210, 40).stroke({ width: 8, color: a.accent, alpha: 0.7 });
        g.circle(380, 200, 40).fill(0xd9d4de).stroke({ width: 3, color: C.ink });
        break;
      }
    }
    return g;
  }

  private crowdRow(a: ArenaDef, r: number) {
    const row = new Container();
    const g = new Graphics();
    const y = 560 + r * 34;
    const sc = 0.8 + r * 0.15;
    const n = 26 - r * 3;
    for (let i = 0; i < n; i++) {
      const x = (i + (r % 2) * 0.5) * (W / (n - 1));
      const s = sc * (0.85 + ((i * 37 + r * 11) % 7) / 20);
      // a cat head + body silhouette (two ears)
      g.ellipse(x, y + 26 * s, 30 * s, 34 * s).fill(a.crowd);
      g.circle(x, y - 6 * s, 22 * s).fill(a.crowd);
      g.poly([x - 20 * s, y - 14 * s, x - 16 * s, y - 38 * s, x - 4 * s, y - 24 * s]).fill(a.crowd);
      g.poly([x + 20 * s, y - 14 * s, x + 16 * s, y - 38 * s, x + 4 * s, y - 24 * s]).fill(a.crowd);
      // glowing eyes on the darker rows
      if ((i + r) % 3 === 0) g.circle(x - 7 * s, y - 6 * s, 2.6 * s).circle(x + 7 * s, y - 6 * s, 2.6 * s).fill({ color: a.accent, alpha: 0.85 });
    }
    row.addChild(g);
    row.alpha = 0.75 + r * 0.12;
    return row;
  }

  private stage(a: ArenaDef, leagueColor: number) {
    const c = new Container();
    const cx = W / 2;
    const cy = 830;
    const g = new Graphics();
    // front skirt of the platform
    g.rect(cx - 900, cy, 1800, 300).fill(a.floor).stroke({ width: 5, color: C.ink });
    g.ellipse(cx, cy, 900, 150).fill(a.floor).stroke({ width: 5, color: C.ink });
    g.ellipse(cx, cy, 860, 132).stroke({ width: 6, color: a.floorRim, alpha: 0.8 });
    g.ellipse(cx, cy, 520, 80).stroke({ width: 3, color: a.floorRim, alpha: 0.35 });
    // podium discs
    for (const sp of SPOT) {
      g.ellipse(sp.x, sp.y + 14, 190, 40).fill({ color: C.ink, alpha: 0.35 });
      g.ellipse(sp.x, sp.y, 170, 34).fill(leagueColor).stroke({ width: 4, color: C.ink });
      g.ellipse(sp.x, sp.y - 4, 140, 24).stroke({ width: 3, color: C.paper, alpha: 0.5 });
    }
    // center logo: a paw
    g.circle(cx, cy + 10, 44).fill({ color: a.floorRim, alpha: 0.25 });
    for (const [dx, dy] of [
      [-40, -40],
      [-14, -56],
      [14, -56],
      [40, -40],
    ])
      g.circle(cx + dx, cy + 10 + dy * 0.6, 14).fill({ color: a.floorRim, alpha: 0.25 });
    c.addChild(g);
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 12, 2.4), width: 1800, height: 300 });
    dots.position.set(cx - 900, cy + 40);
    dots.alpha = 0.18;
    c.addChild(dots);
    for (const sp of SPOT) {
      const glow = new Sprite(glowTexture());
      glow.anchor.set(0.5);
      glow.tint = a.accent;
      glow.blendMode = 'add';
      glow.alpha = 0.35;
      glow.scale.set(3.4, 0.9);
      glow.position.set(sp.x, sp.y);
      c.addChild(glow);
      this.spots.push(glow);
    }
    return c;
  }

  /** the crowd jumps (big hit / K.O.) */
  cheerUp(power = 1) {
    this.cheer = Math.min(2, this.cheer + power);
  }
  /** full-screen tint flash (super effective, ult) */
  flash(color: number, alpha = 0.5, dur = 0.3) {
    this.flashG.clear().rect(-400, -200, W + 800, H + 400).fill(color);
    this.flashG.alpha = alpha;
    gsap.killTweensOf(this.flashG);
    gsap.to(this.flashG, { alpha: 0, duration: dur, ease: 'power2.out' });
  }
  /** spotlight on the side that acts */
  focus(side: 0 | 1 | null) {
    this.spots.forEach((s, i) => gsap.to(s, { alpha: side === null ? 0.35 : side === i ? 0.75 : 0.15, duration: 0.25 }));
  }

  update(dt: number) {
    this.t += dt;
    this.cheer = Math.max(0, this.cheer - dt * 1.5);
    this.crowdRows.forEach((row, i) => {
      const k = this.cheer;
      row.y = -Math.abs(Math.sin(this.t * (6 + i) + i)) * (2 + k * 16);
    });
    // ambient particles (cheap: 1 sprite every ~0.12 s, tweened)
    this.ambAcc += dt;
    if (this.ambAcc > 0.12) {
      this.ambAcc = 0;
      this.spawnAmbient();
    }
    if (this.def.id === 'storm') {
      this.boltT -= dt;
      if (this.boltT <= 0) {
        this.boltT = 2 + Math.random() * 4;
        this.lightning();
      }
    }
  }

  private lightning() {
    const g = this.bolt;
    g.clear();
    let x = 200 + Math.random() * (W - 400);
    let y = -50;
    g.moveTo(x, y);
    while (y < 520) {
      x += (Math.random() - 0.5) * 120;
      y += 40 + Math.random() * 50;
      g.lineTo(x, y);
    }
    g.stroke({ width: 5, color: 0xffffff });
    g.alpha = 1;
    gsap.to(g, { alpha: 0, duration: 0.35, ease: 'steps(3)' });
    this.flash(0xffffff, 0.12, 0.25);
  }

  private spawnAmbient() {
    const a = this.def;
    const p = a.particle;
    const tex = p === 'star' || p === 'rune' ? sparkTexture() : dotTexture();
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    const x = Math.random() * W;
    let y = Math.random() * H * 0.8;
    let dx = 0;
    let dy = 0;
    let sc = 0.3;
    let tint = a.accent;
    let dur = 3;
    switch (p) {
      case 'ember':
        y = H - Math.random() * 200;
        dy = -500 - Math.random() * 300;
        dx = (Math.random() - 0.5) * 120;
        sc = 0.2 + Math.random() * 0.25;
        tint = Math.random() < 0.5 ? 0xff6a1a : 0xffc94a;
        s.blendMode = 'add';
        break;
      case 'bubble':
        y = H - Math.random() * 100;
        dy = -700;
        dx = (Math.random() - 0.5) * 60;
        sc = 0.2 + Math.random() * 0.4;
        tint = 0xbfefff;
        s.alpha = 0.5;
        break;
      case 'leaf':
        y = -20;
        dy = 600;
        dx = 200 + Math.random() * 200;
        sc = 0.3 + Math.random() * 0.2;
        tint = Math.random() < 0.5 ? 0xa6cf7e : 0xd4f27a;
        dur = 4;
        break;
      case 'dust':
        dy = -40;
        dx = 160;
        sc = 0.15 + Math.random() * 0.2;
        tint = 0xf2dca8;
        s.alpha = 0.5;
        break;
      case 'rain':
        y = -20;
        dy = 1400;
        dx = -200;
        sc = 0.12;
        tint = 0x9fc6ff;
        s.scale.y = 1.6;
        dur = 0.9;
        break;
      case 'rune':
        dy = -120;
        sc = 0.25 + Math.random() * 0.2;
        tint = Math.random() < 0.5 ? 0xff7ab8 : 0x8a5cff;
        s.blendMode = 'add';
        break;
      case 'star':
        dy = 0;
        sc = 0.15 + Math.random() * 0.3;
        tint = Math.random() < 0.5 ? 0xffffff : 0x00e5ff;
        s.blendMode = 'add';
        break;
    }
    s.tint = tint;
    s.position.set(x, y);
    s.scale.set(sc, p === 'rain' ? sc * 6 : sc);
    const a0 = s.alpha;
    s.alpha = 0;
    this.amb.addChild(s);
    gsap
      .timeline({ onComplete: () => s.destroy() })
      .to(s, { alpha: a0 || 1, duration: Math.min(0.4, dur * 0.2) }, 0)
      .to(s, { x: x + dx * (dur / 3), y: y + dy * (dur / 3), rotation: p === 'leaf' ? 4 : 0, duration: dur, ease: 'none' }, 0)
      .to(s, { alpha: 0, duration: Math.min(0.5, dur * 0.3) }, dur * 0.7);
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    gsap.killTweensOf(this.flashG);
    gsap.killTweensOf(this.bolt);
    for (const ch of this.children) gsap.killTweensOf(ch);
    for (const s of this.spots) gsap.killTweensOf(s);
    for (const s of this.amb.children) gsap.killTweensOf(s);
    super.destroy(o);
  }
}
