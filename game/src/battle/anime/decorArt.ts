/**
 * Pre-baked animated decor: sail and flag flipbooks (painted on canvas, played "on twos"),
 * cartoon smoke puffs, plus small vector props drawn with Pixi Graphics (cannon barrel, core orb, flames).
 */
import { CanvasSource, Graphics, Texture } from 'pixi.js';
import { ShipStyle, EmblemKind, DebrisKind } from './styles';
import { css, mix, rng } from './util';

const RES = 2;
const lum = (c: number) => (((c >> 16) & 255) * 0.299 + ((c >> 8) & 255) * 0.587 + (c & 255) * 0.114) / 255;
const cache = new Map<string, Texture[]>();

function canvasTex(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): Texture {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * RES);
  c.height = Math.ceil(h * RES);
  const g = c.getContext('2d')!;
  g.scale(RES, RES);
  paint(g);
  return new Texture({ source: new CanvasSource({ resource: c, resolution: RES }) });
}

// ---------------------------------------------------------------- emblems

export function drawEmblem(g: CanvasRenderingContext2D, kind: EmblemKind, s: number, fill: string, shade: string, ink: string, glow?: string, eye?: string) {
  g.save();
  const eyeCol = eye ?? ink;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  if (kind === 'crescent') {
    g.shadowColor = glow ?? fill;
    g.shadowBlur = 12;
    g.beginPath();
    g.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    g.arc(s * 0.17, -s * 0.08, s * 0.34, 0, Math.PI * 2, true);
    g.fillStyle = fill;
    g.fill('evenodd');
    g.shadowBlur = 0;
    g.strokeStyle = ink;
    g.lineWidth = 2.2;
    g.stroke();
    // star
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? s * 0.06 : s * 0.17;
      const x = s * 0.2 + Math.cos(a) * r;
      const y = -s * 0.02 + Math.sin(a) * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
    g.shadowColor = glow ?? fill;
    g.shadowBlur = 10;
    g.fillStyle = '#ffffff';
    g.fill();
    g.restore();
    return;
  }
  if (drawEmblemExtra(g, kind, s, fill, shade, ink, glow, eyeCol)) {
    g.restore();
    return;
  }
  // crossbones behind
  for (const sgn of [-1, 1]) {
    g.save();
    g.rotate(sgn * 0.7);
    g.beginPath();
    g.roundRect(-s * 0.55, -s * 0.05, s * 1.1, s * 0.1, s * 0.05);
    for (const ex of [-s * 0.55, s * 0.55]) {
      g.moveTo(ex + s * 0.07, -s * 0.06);
      g.arc(ex, -s * 0.06, s * 0.07, 0, Math.PI * 2);
      g.moveTo(ex + s * 0.07, s * 0.06);
      g.arc(ex, s * 0.06, s * 0.07, 0, Math.PI * 2);
    }
    g.strokeStyle = ink;
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = fill;
    g.fill();
    g.restore();
  }
  const head = new Path2D();
  if (kind === 'catSkull') {
    head.moveTo(-s * 0.32, -s * 0.12);
    head.lineTo(-s * 0.34, -s * 0.44);
    head.lineTo(-s * 0.14, -s * 0.3);
    head.quadraticCurveTo(0, -s * 0.36, s * 0.14, -s * 0.3);
    head.lineTo(s * 0.34, -s * 0.44);
    head.lineTo(s * 0.32, -s * 0.12);
    head.quadraticCurveTo(s * 0.38, s * 0.14, s * 0.18, s * 0.22);
    head.lineTo(s * 0.16, s * 0.32);
    head.lineTo(-s * 0.16, s * 0.32);
    head.lineTo(-s * 0.18, s * 0.22);
    head.quadraticCurveTo(-s * 0.38, s * 0.14, -s * 0.32, -s * 0.12);
    head.closePath();
  } else {
    // rat skull: round ears + tapering snout
    head.moveTo(-s * 0.24, -s * 0.2);
    head.arc(-s * 0.28, -s * 0.32, s * 0.13, Math.PI * 0.4, Math.PI * 1.9);
    head.quadraticCurveTo(0, -s * 0.36, s * 0.18, -s * 0.38);
    head.arc(s * 0.28, -s * 0.32, s * 0.13, Math.PI * 1.1, Math.PI * 0.6);
    head.quadraticCurveTo(s * 0.3, s * 0.05, s * 0.1, s * 0.34);
    head.lineTo(-s * 0.1, s * 0.34);
    head.quadraticCurveTo(-s * 0.3, s * 0.05, -s * 0.24, -s * 0.2);
    head.closePath();
  }
  g.strokeStyle = ink;
  g.lineWidth = 4.5;
  g.stroke(head);
  g.fillStyle = fill;
  g.fill(head);
  g.save();
  g.clip(head);
  g.fillStyle = shade;
  g.beginPath();
  g.ellipse(s * 0.22, s * 0.25, s * 0.35, s * 0.25, -0.4, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // eyes
  g.fillStyle = eyeCol;
  for (const sx of [-1, 1]) {
    g.beginPath();
    if (kind === 'catSkull') g.ellipse(sx * s * 0.14, -s * 0.06, s * 0.1, s * 0.12, sx * 0.25, 0, Math.PI * 2);
    else g.ellipse(sx * s * 0.11, -s * 0.12, s * 0.075, s * 0.09, sx * 0.3, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (const sx of [-1, 1]) ((g.beginPath(), g.arc(sx * s * 0.12 - s * 0.03, -s * 0.1, s * 0.025, 0, Math.PI * 2)), g.fill());
  // nose & teeth
  g.fillStyle = eyeCol;
  g.beginPath();
  if (kind === 'catSkull') {
    g.moveTo(-s * 0.05, s * 0.08);
    g.lineTo(s * 0.05, s * 0.08);
    g.lineTo(0, s * 0.14);
  } else {
    g.moveTo(-s * 0.04, s * 0.16);
    g.lineTo(s * 0.04, s * 0.16);
    g.lineTo(0, s * 0.2);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = ink;
  g.lineWidth = 1.6;
  if (kind === 'catSkull') {
    g.beginPath();
    for (let i = 0; i <= 4; i++) {
      const x = -s * 0.12 + (i / 4) * s * 0.24;
      g.moveTo(x, s * 0.22);
      g.lineTo(x, s * 0.31);
    }
    g.moveTo(-s * 0.13, s * 0.22);
    g.lineTo(s * 0.13, s * 0.22);
    g.stroke();
    // whiskers
    g.beginPath();
    for (const sx of [-1, 1]) {
      g.moveTo(sx * s * 0.22, s * 0.12);
      g.lineTo(sx * s * 0.42, s * 0.08);
      g.moveTo(sx * s * 0.22, s * 0.16);
      g.lineTo(sx * s * 0.42, s * 0.18);
    }
    g.stroke();
  } else {
    g.beginPath();
    g.rect(-s * 0.05, s * 0.22, s * 0.045, s * 0.09);
    g.rect(s * 0.005, s * 0.22, s * 0.045, s * 0.09);
    g.fillStyle = '#f4ead0';
    g.fill();
    g.stroke();
  }
  g.restore();
}


/** emblems beyond the skulls/crescent; returns false if `kind` is not handled here */
function drawEmblemExtra(g: CanvasRenderingContext2D, kind: EmblemKind, s: number, fill: string, shade: string, ink: string, glow: string | undefined, eye: string): boolean {
  const blob = (p: Path2D, w = 4) => {
    g.strokeStyle = ink;
    g.lineWidth = w;
    g.stroke(p);
    g.fillStyle = fill;
    g.fill(p);
  };
  switch (kind) {
    case 'paw': {
      const p = new Path2D();
      p.ellipse(0, s * 0.12, s * 0.26, s * 0.22, 0, 0, Math.PI * 2);
      for (const [x, y, r] of [[-s * 0.3, -s * 0.12, 0.1], [-s * 0.11, -s * 0.3, 0.11], [s * 0.11, -s * 0.3, 0.11], [s * 0.3, -s * 0.12, 0.1]]) {
        p.moveTo(x + s * r, y);
        p.ellipse(x, y, s * r, s * r * 1.2, 0, 0, Math.PI * 2);
      }
      blob(p);
      g.save();
      g.clip(p);
      g.fillStyle = shade;
      g.fillRect(-s, s * 0.18, s * 2, s);
      g.restore();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.beginPath();
      g.ellipse(-s * 0.08, s * 0.04, s * 0.07, s * 0.04, -0.5, 0, Math.PI * 2);
      g.fill();
      return true;
    }
    case 'duck': {
      // rubber duck silhouette with an eye patch
      const p = new Path2D();
      p.ellipse(-s * 0.05, s * 0.16, s * 0.4, s * 0.22, 0, 0, Math.PI * 2);
      p.moveTo(s * 0.32, -s * 0.18);
      p.arc(s * 0.12, -s * 0.18, s * 0.2, 0, Math.PI * 2);
      blob(p);
      const beak = new Path2D();
      beak.moveTo(s * 0.28, -s * 0.2);
      beak.quadraticCurveTo(s * 0.5, -s * 0.22, s * 0.5, -s * 0.12);
      beak.quadraticCurveTo(s * 0.4, -s * 0.06, s * 0.27, -s * 0.1);
      beak.closePath();
      g.fillStyle = '#ff8a1a';
      g.fill(beak);
      g.strokeStyle = ink;
      g.lineWidth = 2.5;
      g.stroke(beak);
      // patch + strap
      g.beginPath();
      g.moveTo(-s * 0.06, -s * 0.32);
      g.lineTo(s * 0.3, -s * 0.06);
      g.strokeStyle = eye;
      g.lineWidth = 2;
      g.stroke();
      g.fillStyle = eye;
      g.beginPath();
      g.ellipse(s * 0.15, -s * 0.2, s * 0.065, s * 0.055, 0, 0, Math.PI * 2);
      g.fill();
      return true;
    }
    case 'tower': {
      const p = new Path2D();
      const w = s * 0.42;
      p.moveTo(-w, s * 0.4);
      p.lineTo(-w * 0.8, -s * 0.2);
      for (let i = 0; i < 4; i++) {
        const x0 = -w * 0.8 + (i / 3.5) * w * 1.6;
        p.lineTo(x0, -s * 0.38);
        p.lineTo(x0 + w * 0.22, -s * 0.38);
        p.lineTo(x0 + w * 0.22, -s * 0.24);
        p.lineTo(Math.min(w * 0.8, x0 + w * 0.46), -s * 0.24);
      }
      p.lineTo(w * 0.8, -s * 0.2);
      p.lineTo(w, s * 0.4);
      p.closePath();
      blob(p);
      g.fillStyle = eye === ink ? shade : eye;
      g.beginPath();
      g.moveTo(-s * 0.1, s * 0.4);
      g.lineTo(-s * 0.1, s * 0.12);
      g.arc(0, s * 0.12, s * 0.1, Math.PI, 0);
      g.lineTo(s * 0.1, s * 0.4);
      g.fill();
      g.strokeStyle = shade;
      g.lineWidth = 1.5;
      for (const y of [-s * 0.05, s * 0.1, s * 0.25]) ((g.beginPath(), g.moveTo(-w * 0.8, y), g.lineTo(w * 0.85, y)), g.stroke());
      return true;
    }
    case 'kraken': {
      const p = new Path2D();
      p.ellipse(0, -s * 0.14, s * 0.26, s * 0.24, 0, 0, Math.PI * 2);
      blob(p);
      g.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const x = -s * 0.22 + i * s * 0.11;
        const dir = i < 2 ? -1 : i > 2 ? 1 : 0;
        const tp = new Path2D();
        tp.moveTo(x, s * 0.04);
        tp.bezierCurveTo(x + dir * s * 0.1, s * 0.2, x - dir * s * 0.05, s * 0.32, x + dir * s * 0.18, s * 0.38);
        g.strokeStyle = ink;
        g.lineWidth = s * 0.1 + 3;
        g.stroke(tp);
        g.strokeStyle = fill;
        g.lineWidth = s * 0.1;
        g.stroke(tp);
      }
      g.fillStyle = eye;
      for (const sx of [-1, 1]) ((g.beginPath(), g.ellipse(sx * s * 0.1, -s * 0.12, s * 0.055, s * 0.075, 0, 0, Math.PI * 2)), g.fill());
      return true;
    }
    case 'book': {
      const p = new Path2D();
      p.moveTo(0, -s * 0.22);
      p.quadraticCurveTo(-s * 0.22, -s * 0.34, -s * 0.46, -s * 0.24);
      p.lineTo(-s * 0.46, s * 0.26);
      p.quadraticCurveTo(-s * 0.22, s * 0.16, 0, s * 0.28);
      p.quadraticCurveTo(s * 0.22, s * 0.16, s * 0.46, s * 0.26);
      p.lineTo(s * 0.46, -s * 0.24);
      p.quadraticCurveTo(s * 0.22, -s * 0.34, 0, -s * 0.22);
      p.closePath();
      blob(p);
      g.strokeStyle = shade;
      g.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        const y = -s * 0.14 + i * s * 0.09;
        g.beginPath();
        g.moveTo(-s * 0.38, y);
        g.quadraticCurveTo(-s * 0.2, y - s * 0.06, -s * 0.06, y);
        g.moveTo(s * 0.06, y);
        g.quadraticCurveTo(s * 0.2, y - s * 0.06, s * 0.38, y);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(0, -s * 0.22);
      g.lineTo(0, s * 0.28);
      g.strokeStyle = ink;
      g.lineWidth = 2;
      g.stroke();
      // arcane eye above the book
      g.beginPath();
      g.ellipse(0, -s * 0.4, s * 0.12, s * 0.06, 0, 0, Math.PI * 2);
      g.fillStyle = fill;
      g.fill();
      g.strokeStyle = ink;
      g.stroke();
      g.fillStyle = eye;
      g.beginPath();
      g.arc(0, -s * 0.4, s * 0.035, 0, Math.PI * 2);
      g.fill();
      return true;
    }
    case 'fishbone': {
      g.lineCap = 'round';
      const spine = new Path2D();
      spine.moveTo(-s * 0.36, 0);
      spine.lineTo(s * 0.22, 0);
      for (let i = 0; i < 5; i++) {
        const x = -s * 0.24 + i * s * 0.1;
        spine.moveTo(x, 0);
        spine.quadraticCurveTo(x + s * 0.04, -s * 0.12, x - s * 0.02, -s * 0.2);
        spine.moveTo(x, 0);
        spine.quadraticCurveTo(x + s * 0.04, s * 0.12, x - s * 0.02, s * 0.2);
      }
      g.strokeStyle = ink;
      g.lineWidth = 6;
      g.stroke(spine);
      g.strokeStyle = fill;
      g.lineWidth = 3;
      g.stroke(spine);
      const head = new Path2D();
      head.moveTo(s * 0.2, -s * 0.16);
      head.quadraticCurveTo(s * 0.5, -s * 0.12, s * 0.5, 0);
      head.quadraticCurveTo(s * 0.5, s * 0.12, s * 0.2, s * 0.16);
      head.closePath();
      const tail = new Path2D();
      tail.moveTo(-s * 0.34, 0);
      tail.lineTo(-s * 0.5, -s * 0.16);
      tail.lineTo(-s * 0.46, 0);
      tail.lineTo(-s * 0.5, s * 0.16);
      tail.closePath();
      blob(head, 3.5);
      blob(tail, 3.5);
      g.fillStyle = eye;
      g.beginPath();
      g.arc(s * 0.34, -s * 0.03, s * 0.045, 0, Math.PI * 2);
      g.fill();
      return true;
    }
    case 'mask': {
      const p = new Path2D();
      p.moveTo(-s * 0.46, -s * 0.12);
      p.quadraticCurveTo(-s * 0.24, -s * 0.26, 0, -s * 0.12);
      p.quadraticCurveTo(s * 0.24, -s * 0.26, s * 0.46, -s * 0.12);
      p.quadraticCurveTo(s * 0.42, s * 0.16, s * 0.18, s * 0.16);
      p.quadraticCurveTo(s * 0.04, s * 0.16, 0, s * 0.06);
      p.quadraticCurveTo(-s * 0.04, s * 0.16, -s * 0.18, s * 0.16);
      p.quadraticCurveTo(-s * 0.42, s * 0.16, -s * 0.46, -s * 0.12);
      p.closePath();
      // feathers
      for (let i = 0; i < 3; i++) {
        const f = new Path2D();
        const a = -0.5 + i * 0.4;
        f.ellipse(s * 0.3 + i * s * 0.05, -s * 0.34, s * 0.06, s * 0.2, a, 0, Math.PI * 2);
        g.strokeStyle = ink;
        g.lineWidth = 3;
        g.stroke(f);
        g.fillStyle = shade;
        g.fill(f);
      }
      blob(p);
      g.fillStyle = eye;
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.ellipse(sx * s * 0.2, -s * 0.02, s * 0.1, s * 0.055, sx * 0.25, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.beginPath();
      g.ellipse(-s * 0.3, -s * 0.12, s * 0.06, s * 0.025, -0.3, 0, Math.PI * 2);
      g.fill();
      return true;
    }
    case 'question': {
      g.shadowColor = glow ?? fill;
      g.shadowBlur = 12;
      g.font = `bold ${Math.round(s * 0.9)}px "Rubik Glitch", Anton, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = fill;
      g.fillText('?', 0, s * 0.04);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(0,229,255,0.7)';
      g.fillText('?', -s * 0.04, s * 0.02);
      g.fillStyle = fill;
      g.fillText('?', 0, s * 0.04);
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- sails

export interface SailFrames {
  frames: Texture[];
  /** anchor in texture px of the yard center */
  ax: number;
  ay: number;
}

/**
 * Square sail facing the viewer, hanging from a yard at (0,0).
 * billow frames: index 0..n-1 (sinusoidal); torn = shredded version for destroyed masts.
 */
export function sailFrames(st: ShipStyle, w: number, h: number, torn: boolean, n = 8): SailFrames {
  const key = `sail-${st.id}-${w}-${h}-${torn}-${n}`;
  const padX = 22;
  const padT = 10;
  const padB = 34;
  const TW = w + padX * 2;
  const TH = h + padT + padB;
  let frames = cache.get(key);
  if (!frames) {
    frames = [];
    for (let i = 0; i < n; i++) {
      const ph = (i / n) * Math.PI * 2;
      const b = 0.5 + 0.5 * Math.sin(ph);
      const sway = Math.sin(ph + 0.9) * 3.5;
      frames.push(canvasTex(TW, TH, (g) => {
        g.translate(TW / 2, padT);
        paintSail(g, st, w, h, torn ? b * 0.4 : b, sway, torn, i);
      }));
    }
    cache.set(key, frames);
  }
  return { frames, ax: TW / 2, ay: padT };
}

function paintSail(g: CanvasRenderingContext2D, st: ShipStyle, w: number, h: number, b: number, sway: number, torn: boolean, frame: number) {
  const ink = css(st.ink);
  const R = rng(1234 + (torn ? 77 : 0));
  const top = 3;
  const hw = w / 2;
  const bulge = 4 + b * 7;
  const sag = 10 + b * 10;
  const bl: [number, number] = [-hw - 5 + sway, h];
  const br: [number, number] = [hw + 5 + sway, h];
  const ragged = st.sail.ragged || torn;
  const cloth = new Path2D();
  cloth.moveTo(-hw, top);
  // lashing scallops on the top edge
  const nL = 6;
  for (let i = 1; i <= nL; i++) {
    const x0 = -hw + ((i - 1) / nL) * w;
    const x1 = -hw + (i / nL) * w;
    cloth.quadraticCurveTo((x0 + x1) / 2, top + 4, x1, top);
  }
  cloth.quadraticCurveTo(hw + bulge, h * 0.5, br[0], br[1]);
  if (ragged) {
    const teeth = torn ? 9 : 7;
    for (let i = 1; i <= teeth; i++) {
      const t = i / teeth;
      const x = br[0] + (bl[0] - br[0]) * t;
      const yBase = h + Math.sin(t * Math.PI) * sag;
      const depth = (i % 2 ? 1 : 0.25) * (torn ? 22 : 14) * (0.5 + R());
      cloth.lineTo(x + (R() - 0.5) * 6, yBase - (i === teeth ? 0 : depth));
    }
  } else {
    cloth.quadraticCurveTo(sway, h + sag * 2, bl[0], bl[1]);
  }
  cloth.quadraticCurveTo(-hw - bulge, h * 0.5, -hw, top);
  cloth.closePath();

  g.fillStyle = css(st.sail.base);
  g.fill(cloth);
  g.save();
  g.clip(cloth);
  // inner lit belly
  g.fillStyle = css(st.sail.light);
  g.beginPath();
  g.ellipse(-w * 0.08 + sway * 0.3, h * 0.42, w * 0.3, h * 0.3 + b * 4, -0.15, 0, Math.PI * 2);
  g.fill();
  // cel shadow on the leeward side + under the yard
  g.fillStyle = css(st.sail.shadow);
  g.beginPath();
  g.moveTo(hw * 0.35 + sway, top);
  g.quadraticCurveTo(hw * 0.75 + bulge + sway * 0.5, h * 0.55, hw * 0.45 + sway, h + sag * 2);
  g.lineTo(hw + 40, h + 40);
  g.lineTo(hw + 40, top);
  g.closePath();
  g.fill();
  g.fillRect(-hw - 20, top - 2, w + 40, 7);
  // second (deeper) cel band
  g.fillStyle = css(mix(st.sail.shadow, st.ink, 0.25));
  g.beginPath();
  g.moveTo(hw * 0.78 + sway, top);
  g.quadraticCurveTo(hw * 0.95 + bulge + sway * 0.5, h * 0.55, hw * 0.8 + sway, h + sag * 2);
  g.lineTo(hw + 40, h + 40);
  g.lineTo(hw + 40, top);
  g.closePath();
  g.fill();
  // stitched seams
  g.strokeStyle = css(st.sail.stitch, 0.8);
  g.lineWidth = 1.3;
  g.setLineDash([4, 3]);
  for (const f of [-0.62, -0.22, 0.22, 0.62]) {
    g.beginPath();
    g.moveTo(f * hw, top + 4);
    g.quadraticCurveTo(f * hw * (1 + b * 0.12) + sway * 0.5, h * 0.55, f * (hw + 5) + sway, h + sag * (1 - Math.abs(f)) * 1.8);
    g.stroke();
  }
  g.setLineDash([]);
  // fold lines (anime)
  g.strokeStyle = css(st.ink, 0.55);
  g.lineWidth = 1.7;
  g.lineCap = 'round';
  for (const f of [-0.5, 0, 0.5]) {
    g.beginPath();
    g.moveTo(f * hw, top + 4);
    g.quadraticCurveTo(f * hw + 4 + sway * 0.3, top + 14 + b * 6, f * hw + 2 + sway * 0.4, top + 24 + b * 10 + (frame % 2) * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(bl[0] + 8, h - 6);
  g.quadraticCurveTo(bl[0] + 18, h - 18, bl[0] + 30, h - 14);
  g.moveTo(br[0] - 8, h - 6);
  g.quadraticCurveTo(br[0] - 18, h - 20, br[0] - 30, h - 15);
  g.stroke();
  // patches
  if (st.sail.patches) {
    for (const [px, py, pw, ph, rot] of [[-hw * 0.55, h * 0.25, 18, 14, -0.2], [hw * 0.45, h * 0.7, 16, 16, 0.25]] as const) {
      g.save();
      g.translate(px + sway * 0.4, py);
      g.rotate(rot);
      g.fillStyle = css(mix(st.sail.base, 0x6a5a3a, 0.35));
      g.fillRect(-pw / 2, -ph / 2, pw, ph);
      g.strokeStyle = ink;
      g.lineWidth = 1.6;
      g.strokeRect(-pw / 2, -ph / 2, pw, ph);
      g.strokeStyle = css(st.sail.stitch);
      g.lineWidth = 1;
      g.setLineDash([2, 2]);
      g.strokeRect(-pw / 2 + 2.5, -ph / 2 + 2.5, pw - 5, ph - 5);
      g.setLineDash([]);
      g.restore();
    }
  }
  paintSailDeco(g, st, w, h, b, sway, top);
  // emblem
  const es = Math.min(w, h) * 0.6;
  g.save();
  g.translate(sway * 0.45, h * 0.47 + b * 2);
  g.scale(1 + b * 0.05, 1);
  drawEmblem(g, st.emblem, es, css(st.sail.emblem), css(st.sail.emblemShade), ink, css(st.sail.emblem), lum(st.sail.emblem) < 0.3 ? css(st.sail.light) : undefined);
  g.restore();
  g.restore();
  // holes
  if (ragged) {
    const holes = torn ? 5 : 2;
    for (let i = 0; i < holes; i++) {
      const hx = (R() - 0.5) * w * 0.8 + sway * 0.4;
      const hy = h * (0.2 + R() * 0.65);
      const hr = (torn ? 7 : 5) + R() * (torn ? 9 : 5);
      const p = new Path2D();
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2;
        const rr = hr * (0.6 + R() * 0.6);
        k ? p.lineTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr) : p.moveTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr);
      }
      p.closePath();
      g.save();
      g.strokeStyle = css(mix(st.sail.shadow, 0x000000, 0.5));
      g.lineWidth = 5;
      g.stroke(p);
      g.globalCompositeOperation = 'destination-out';
      g.fill(p);
      g.restore();
      g.strokeStyle = ink;
      g.lineWidth = 1.8;
      g.stroke(p);
    }
  }
  if (torn) {
    // a big rip from the bottom
    const rx = (R() - 0.3) * w * 0.4;
    const rip = new Path2D();
    rip.moveTo(rx - 14, h + 30);
    rip.lineTo(rx - 3, h * 0.45);
    rip.lineTo(rx + 2, h * 0.5);
    rip.lineTo(rx + 16, h + 30);
    rip.closePath();
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.fill(rip);
    g.restore();
  }
  g.lineJoin = 'round';
  g.strokeStyle = ink;
  g.lineWidth = 3;
  g.stroke(cloth);
  // yard
  g.beginPath();
  g.roundRect(-hw - 12, -3.5, w + 24, 7.5, 3.5);
  g.fillStyle = css(st.wood.base);
  g.fill();
  g.fillStyle = css(st.wood.shadow);
  g.fillRect(-hw - 10, 1, w + 20, 2.5);
  g.beginPath();
  g.roundRect(-hw - 12, -3.5, w + 24, 7.5, 3.5);
  g.strokeStyle = ink;
  g.lineWidth = 2.4;
  g.stroke();
  for (const ex of [-hw - 12, hw + 12]) {
    g.beginPath();
    g.arc(ex, 0, 4.2, 0, Math.PI * 2);
    g.fillStyle = css(st.neon[0] ?? st.trim.base);
    g.fill();
    g.stroke();
  }
  // lashing ropes
  g.strokeStyle = ink;
  g.lineWidth = 1.4;
  for (let i = 0; i <= 6; i++) {
    const x = -hw + (i / 6) * w;
    g.beginPath();
    g.ellipse(x, 2, 2.2, 3.4, 0, 0, Math.PI * 2);
    g.stroke();
  }
}


function paintSailDeco(g: CanvasRenderingContext2D, st: ShipStyle, w: number, h: number, b: number, sway: number, top: number) {
  const ink = css(st.ink);
  const hw = w / 2;
  const R = rng(4321);
  switch (st.feat.sailDeco) {
    case 'sock': {
      // a striped sock sewn on as a patch (lower corner)
      g.save();
      g.translate(-hw * 0.55 + sway * 0.4, h * 0.62);
      g.rotate(-0.35);
      const sock = new Path2D();
      sock.moveTo(-7, -16);
      sock.lineTo(7, -16);
      sock.lineTo(7, 4);
      sock.quadraticCurveTo(7, 12, 16, 12);
      sock.quadraticCurveTo(22, 14, 18, 20);
      sock.lineTo(-2, 20);
      sock.quadraticCurveTo(-7, 20, -7, 12);
      sock.closePath();
      g.fillStyle = '#f4f0e6';
      g.fill(sock);
      g.save();
      g.clip(sock);
      g.fillStyle = '#e8322e';
      for (let y = -16; y < 22; y += 8) g.fillRect(-10, y, 34, 4);
      g.restore();
      g.strokeStyle = ink;
      g.lineWidth = 2;
      g.stroke(sock);
      g.strokeStyle = css(st.sail.stitch);
      g.lineWidth = 1;
      g.setLineDash([2, 2]);
      g.stroke(sock);
      g.setLineDash([]);
      g.restore();
      break;
    }
    case 'writing': {
      g.strokeStyle = css(st.sail.stitch, 0.75);
      g.lineWidth = 1.2;
      for (let row = 0; row < 7; row++) {
        const y = top + 12 + row * ((h - 20) / 7);
        let x = -hw + 8 + R() * 6;
        while (x < hw - 10) {
          const len = 6 + R() * 14;
          g.beginPath();
          g.moveTo(x + sway * 0.3, y);
          for (let k = 0; k <= len; k += 3) g.lineTo(x + k + sway * 0.3, y + Math.sin(k * 1.3 + row) * 1.4);
          g.stroke();
          x += len + 4 + R() * 4;
        }
      }
      // rune circle
      g.strokeStyle = css(st.accent.shadow, 0.8);
      g.lineWidth = 1.6;
      g.beginPath();
      g.arc(hw * 0.55 + sway * 0.4, top + 18, 9, 0, Math.PI * 2);
      g.moveTo(hw * 0.55 + sway * 0.4 - 6, top + 18);
      g.lineTo(hw * 0.55 + sway * 0.4 + 6, top + 18);
      g.stroke();
      break;
    }
    case 'constellation': {
      const stars: [number, number][] = [];
      for (let i = 0; i < 9; i++) stars.push([(R() - 0.5) * w * 0.85 + sway * 0.4, top + 8 + R() * (h - 14)]);
      g.strokeStyle = 'rgba(200,250,255,0.45)';
      g.lineWidth = 1;
      g.beginPath();
      stars.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.stroke();
      g.fillStyle = '#ffffff';
      g.shadowColor = css(st.accent.base);
      g.shadowBlur = 6;
      for (const [x, y] of stars) {
        const r = 1.2 + R() * 1.6 + b * 0.4;
        g.beginPath();
        g.moveTo(x, y - r * 2);
        g.lineTo(x + r * 0.5, y - r * 0.5);
        g.lineTo(x + r * 2, y);
        g.lineTo(x + r * 0.5, y + r * 0.5);
        g.lineTo(x, y + r * 2);
        g.lineTo(x - r * 0.5, y + r * 0.5);
        g.lineTo(x - r * 2, y);
        g.lineTo(x - r * 0.5, y - r * 0.5);
        g.closePath();
        g.fill();
      }
      g.shadowBlur = 0;
      break;
    }
    case 'lace': {
      g.fillStyle = css(st.accent.base);
      g.strokeStyle = ink;
      g.lineWidth = 1.2;
      for (let x = -hw - 4; x < hw + 4; x += 8) {
        g.beginPath();
        g.arc(x + 4, top + 3, 4.2, 0, Math.PI);
        g.fill();
        g.stroke();
        g.fillStyle = css(st.sail.shadow);
        g.beginPath();
        g.arc(x + 4, top + 4.5, 1.3, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = css(st.accent.base);
      }
      break;
    }
  }
}

// ---------------------------------------------------------------- flag

export function flagFrames(st: ShipStyle, n = 6): SailFrames {
  const key = `flag-${st.id}-${n}`;
  const W = 46;
  const H = 30;
  const pad = 10;
  const TW = W + pad * 2;
  const TH = H + pad * 2 + 10;
  let frames = cache.get(key);
  if (!frames) {
    frames = [];
    for (let i = 0; i < n; i++) {
      const ph = (i / n) * Math.PI * 2;
      frames.push(canvasTex(TW, TH, (g) => {
        g.translate(pad, pad);
        paintFlag(g, st, W, H, ph);
      }));
    }
    cache.set(key, frames);
  }
  return { frames, ax: pad, ay: pad };
}

function paintFlag(g: CanvasRenderingContext2D, st: ShipStyle, W: number, H: number, ph: number) {
  const off = (x: number) => (x / W) * 5.5 * Math.sin((x / W) * Math.PI * 2.2 - ph);
  const slope = (x: number) => off(x + 1) - off(x);
  const N = 12;
  // flag is drawn extending to -x from the pole at x=0 (trails behind the ship)
  const pts = (yy: number) => {
    const out: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W;
      out.push([-x, yy + off(x) + (yy > 0 ? (x / W) * 2 : 0)]);
    }
    return out;
  };
  const topE = pts(0);
  const botE = pts(H);
  // swallow tail at the free end
  const tail: [number, number] = [-W + 9, H / 2 + off(W - 9)];
  const path = new Path2D();
  topE.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
  path.lineTo(tail[0], tail[1]);
  for (let i = N; i >= 0; i--) path.lineTo(botE[i][0], botE[i][1]);
  path.closePath();
  g.fillStyle = css(st.flag.base);
  g.fill(path);
  g.save();
  g.clip(path);
  // fold shading strips
  for (let i = 0; i < N; i++) {
    const x = (i / N) * W;
    if (slope(x) > 0.05) {
      g.fillStyle = css(st.flag.shadow, 0.85);
      g.fillRect(-x - W / N, -10, W / N + 0.5, H + 20);
    }
  }
  // emblem (small)
  g.translate(-W * 0.5, H * 0.5 + off(W * 0.5));
  drawEmblem(g, st.emblem, H * 0.95, css(st.flag.emblem), css(mix(st.flag.emblem, 0x000000, 0.25)), css(st.flag.shadow), undefined, lum(st.flag.emblem) < 0.3 ? css(st.flag.base) : undefined);
  g.restore();
  g.lineJoin = 'round';
  g.strokeStyle = css(st.ink);
  g.lineWidth = 2.4;
  g.stroke(path);
}

// ---------------------------------------------------------------- smoke puff

export function puffTexture(): Texture {
  const key = 'puff';
  const hit = cache.get(key);
  if (hit) return hit[0];
  const S = 64;
  const t = canvasTex(S, S, (g) => {
    const blobs: [number, number, number][] = [
      [32, 36, 17],
      [20, 38, 12],
      [44, 38, 12],
      [27, 25, 12],
      [40, 26, 11],
    ];
    g.fillStyle = '#171317';
    for (const [x, y, r] of blobs) ((g.beginPath(), g.arc(x, y, r + 2.6, 0, Math.PI * 2)), g.fill());
    g.fillStyle = '#c9c4cf';
    for (const [x, y, r] of blobs) ((g.beginPath(), g.arc(x, y, r, 0, Math.PI * 2)), g.fill());
    g.fillStyle = '#ffffff';
    for (const [x, y, r] of blobs) ((g.beginPath(), g.arc(x - r * 0.18, y - r * 0.22, r * 0.78, 0, Math.PI * 2)), g.fill());
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.ellipse(24, 22, 4, 2.2, -0.5, 0, Math.PI * 2);
    g.fill();
  });
  cache.set(key, [t]);
  return t;
}

/** jagged splinter shard (white, tint it) */
export function shardTexture(): Texture {
  const key = 'shard';
  const hit = cache.get(key);
  if (hit) return hit[0];
  const t = canvasTex(24, 12, (g) => {
    g.beginPath();
    g.moveTo(1, 6);
    g.lineTo(8, 1.5);
    g.lineTo(23, 5);
    g.lineTo(9, 10.5);
    g.closePath();
    g.fillStyle = '#ffffff';
    g.fill();
    g.strokeStyle = '#171317';
    g.lineWidth = 1.6;
    g.stroke();
  });
  cache.set(key, [t]);
  return t;
}


/** White-based debris sprites per material (tint them). */
export function debrisTexture(kind: DebrisKind): Texture {
  if (kind === 'wood') return shardTexture();
  const key = `debris-${kind}`;
  const hit = cache.get(key);
  if (hit) return hit[0];
  const ink = '#171317';
  let t: Texture;
  switch (kind) {
    case 'stone':
      t = canvasTex(22, 18, (g) => {
        g.beginPath();
        g.moveTo(2, 9);
        g.lineTo(6, 2);
        g.lineTo(16, 1.5);
        g.lineTo(21, 8);
        g.lineTo(17, 16.5);
        g.lineTo(5, 16);
        g.closePath();
        g.fillStyle = '#ffffff';
        g.fill();
        g.fillStyle = '#c8c8c8';
        g.beginPath();
        g.moveTo(11, 9);
        g.lineTo(21, 8);
        g.lineTo(17, 16.5);
        g.lineTo(9, 16);
        g.closePath();
        g.fill();
        g.strokeStyle = ink;
        g.lineWidth = 1.8;
        g.lineJoin = 'round';
        g.beginPath();
        g.moveTo(2, 9);
        g.lineTo(6, 2);
        g.lineTo(16, 1.5);
        g.lineTo(21, 8);
        g.lineTo(17, 16.5);
        g.lineTo(5, 16);
        g.closePath();
        g.stroke();
      });
      break;
    case 'iron':
      t = canvasTex(20, 14, (g) => {
        g.beginPath();
        g.moveTo(1.5, 3);
        g.lineTo(18, 1.5);
        g.lineTo(18.5, 12);
        g.lineTo(3, 12.5);
        g.closePath();
        g.fillStyle = '#ffffff';
        g.fill();
        g.fillStyle = '#b8b8c0';
        g.fillRect(2, 9, 16, 3);
        g.strokeStyle = ink;
        g.lineWidth = 1.6;
        g.stroke();
        g.fillStyle = '#e0e0e8';
        for (const [x, y] of [[5, 5], [15, 4.5]]) ((g.beginPath(), g.arc(x, y, 1.4, 0, Math.PI * 2)), g.fill());
      });
      break;
    case 'paper':
      t = canvasTex(18, 22, (g) => {
        g.beginPath();
        g.moveTo(2, 2);
        g.lineTo(13, 1.5);
        g.lineTo(16.5, 5);
        g.lineTo(16, 20.5);
        g.lineTo(2.5, 20);
        g.closePath();
        g.fillStyle = '#ffffff';
        g.fill();
        g.strokeStyle = ink;
        g.lineWidth = 1.4;
        g.stroke();
        g.strokeStyle = 'rgba(80,60,40,0.6)';
        g.lineWidth = 1;
        for (let y = 7; y < 19; y += 3) ((g.beginPath(), g.moveTo(4.5, y), g.lineTo(13.5, y)), g.stroke());
      });
      break;
    case 'bone':
      t = canvasTex(26, 12, (g) => {
        const p = new Path2D();
        p.roundRect(6, 4, 14, 4, 2);
        for (const [x, y] of [[5, 3.5], [5, 8.5], [21, 3.5], [21, 8.5]]) {
          p.moveTo(x + 3, y);
          p.arc(x, y, 3, 0, Math.PI * 2);
        }
        g.strokeStyle = ink;
        g.lineWidth = 3;
        g.stroke(p);
        g.fillStyle = '#ffffff';
        g.fill(p);
      });
      break;
    case 'feather':
      t = canvasTex(12, 28, (g) => {
        g.beginPath();
        g.ellipse(6, 13, 4.5, 11.5, 0.15, 0, Math.PI * 2);
        g.fillStyle = '#ffffff';
        g.fill();
        g.strokeStyle = ink;
        g.lineWidth = 1.4;
        g.stroke();
        g.beginPath();
        g.moveTo(5, 26);
        g.lineTo(7, 2);
        g.stroke();
      });
      break;
    case 'coral':
      t = canvasTex(20, 20, (g) => {
        const p = new Path2D();
        p.moveTo(10, 19);
        p.lineTo(10, 10);
        p.lineTo(4, 3);
        p.moveTo(10, 11);
        p.lineTo(16, 5);
        p.moveTo(13, 8);
        p.lineTo(17, 12);
        g.lineCap = 'round';
        g.strokeStyle = ink;
        g.lineWidth = 6;
        g.stroke(p);
        g.strokeStyle = '#ffffff';
        g.lineWidth = 3.4;
        g.stroke(p);
      });
      break;
    case 'rubber':
      t = canvasTex(18, 16, (g) => {
        g.beginPath();
        g.moveTo(3, 8);
        g.quadraticCurveTo(2, 2, 9, 2);
        g.quadraticCurveTo(17, 2, 16, 9);
        g.quadraticCurveTo(15, 15, 8, 14);
        g.quadraticCurveTo(3, 14, 3, 8);
        g.fillStyle = '#ffffff';
        g.fill();
        g.strokeStyle = ink;
        g.lineWidth = 1.8;
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,1)';
        g.beginPath();
        g.ellipse(7, 5.5, 2.5, 1.2, -0.4, 0, Math.PI * 2);
        g.fill();
      });
      break;
    case 'glitch':
    default:
      t = canvasTex(8, 8, (g) => {
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 8, 8);
      });
      break;
  }
  cache.set(key, [t]);
  return t;
}

// ---------------------------------------------------------------- flame flipbook

/** 8-frame cluster of 3 cartoon flame tongues (base at the bottom centre of the texture). */
export function flameFrames(n = 8): { frames: Texture[]; ax: number; ay: number } {
  const key = `flame-${n}`;
  const W = 56;
  const H = 66;
  let frames = cache.get(key);
  if (!frames) {
    frames = [];
    const R = rng(77);
    for (let f = 0; f < n; f++) {
      frames.push(canvasTex(W, H, (g) => {
        g.translate(W / 2, H - 8);
        const tongues: [number, number, number, number][] = [
          [-11, 13, 24 + R() * 10, Math.sin(f * 1.7) * 5],
          [11, 13, 22 + R() * 10, Math.sin(f * 1.7 + 2) * 5],
          [0, 17, 36 + R() * 12, Math.sin(f * 1.7 + 4) * 6],
        ];
        for (const [x, w, h, lean] of tongues) canvasFlame(g, x, 0, w, h, lean);
        // embers
        g.fillStyle = '#ffc94a';
        for (let i = 0; i < 2; i++) {
          const ph = ((f / n) + i * 0.5) % 1;
          g.beginPath();
          g.arc((i ? 8 : -9) + Math.sin(f + i) * 3, -10 - ph * 40, 2.4 * (1 - ph) + 0.4, 0, Math.PI * 2);
          g.fill();
        }
      }));
    }
    cache.set(key, frames);
  }
  return { frames, ax: 0.5, ay: (H - 8) / H };
}

function canvasFlame(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lean: number) {
  const tip = (sc: number) => {
    const hw = (w / 2) * sc;
    const hh = h * sc;
    g.beginPath();
    g.moveTo(x - hw, y);
    g.bezierCurveTo(x - hw * 1.25, y - hh * 0.45, x + lean * 0.4 - hw * 0.3, y - hh * 0.6, x + lean, y - hh);
    g.bezierCurveTo(x + lean * 0.4 + hw * 0.5, y - hh * 0.55, x + hw * 1.25, y - hh * 0.4, x + hw, y);
    g.quadraticCurveTo(x, y + hw * 0.55, x - hw, y);
    g.closePath();
  };
  tip(1);
  g.fillStyle = '#ff5a1a';
  g.fill();
  g.strokeStyle = '#171317';
  g.lineWidth = 2.4;
  g.lineJoin = 'round';
  g.stroke();
  tip(0.68);
  g.fillStyle = '#ffb21a';
  g.fill();
  tip(0.36);
  g.fillStyle = '#fff2a8';
  g.fill();
}

// ---------------------------------------------------------------- vector props (Pixi Graphics)

/** Cannon barrel pointing +x from the breech pivot (0,0). */
export function drawBarrel(g: Graphics, st: ShipStyle, broken: boolean, len = 52) {
  g.clear();
  const ink = st.ink;
  const m = st.metal;
  if (!broken) {
    // breech knob
    g.circle(-4, 0, 7).fill(m.base).stroke({ width: 2.6, color: ink });
    g.moveTo(0, -10).lineTo(len - 6, -8).lineTo(len - 6, 8).lineTo(0, 10).closePath().fill(m.base).stroke({ width: 2.6, color: ink, join: 'round' });
    // cel shade bottom + light top
    g.moveTo(2, 3).lineTo(len - 8, 3).lineTo(len - 8, 6.5).lineTo(2, 8).closePath().fill(m.shadow);
    g.moveTo(4, -6.5).lineTo(len - 12, -5.2).stroke({ width: 2.4, color: m.light, cap: 'round' });
    g.circle(len * 0.5, -5.6, 1.2).fill(0xffffff);
    // reinforcing rings
    for (const rx of [10, len * 0.55]) g.roundRect(rx - 2.5, -11, 5, 22, 2).fill(m.base).stroke({ width: 2, color: ink });
    // muzzle
    g.roundRect(len - 8, -11, 10, 22, 3).fill(m.base).stroke({ width: 2.6, color: ink });
    g.ellipse(len + 2, 0, 3.2, 8).fill(ink);
    g.ellipse(len + 2.2, 0, 2.2, 5.6).fill(st.muzzle);
    g.ellipse(len + 2.4, 0, 1, 2.6).fill(0xfff2a8);
    // gold accent
    if (!st.neon.length) g.roundRect(len - 8, -11, 3, 22, 1).fill(st.trim.base);
    else g.roundRect(len - 8, -11, 3, 22, 1).fill(st.neon[0]);
  } else {
    // bent, cracked barrel drooping down
    g.circle(-4, 0, 7).fill(m.shadow).stroke({ width: 2.6, color: ink });
    g.moveTo(0, -10).lineTo(len * 0.45, -8).lineTo(len * 0.5, 9).lineTo(0, 10).closePath().fill(m.shadow).stroke({ width: 2.6, color: ink, join: 'round' });
    const a = 0.75;
    const cx = len * 0.48;
    const cy = 0;
    const rot = (x: number, y: number) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)] as const;
    const pts = [rot(cx, -8), rot(len - 4, -7), rot(len - 4, 7), rot(cx, 8)];
    g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
    g.closePath().fill(m.shadow).stroke({ width: 2.6, color: ink, join: 'round' });
    const mz = rot(len, 0);
    g.ellipse(mz[0], mz[1], 7, 4).fill(ink);
    // crack + scorch
    g.moveTo(len * 0.3, -9).lineTo(len * 0.36, -2).lineTo(len * 0.32, 4).stroke({ width: 2, color: ink });
    g.moveTo(len * 0.31, -8).lineTo(len * 0.37, -2).stroke({ width: 1, color: m.light, alpha: 0.6 });
  }
}

/** Glowing core orb (radius r) at 0,0. */
export function drawOrb(g: Graphics, st: ShipStyle, r: number, broken: boolean, phase = 0) {
  g.clear();
  const ink = st.ink;
  if (!broken) {
    g.circle(0, 0, r).fill(st.core.base).stroke({ width: 3, color: ink });
    g.circle(r * 0.12, r * 0.16, r * 0.78).fill(mix(st.core.base, 0x000000, 0.18));
    g.circle(-r * 0.12, -r * 0.12, r * 0.6).fill(st.core.base);
    // swirl
    const a = phase;
    g.arc(0, 0, r * 0.5, a, a + 2.2).stroke({ width: 2.5, color: st.core.light, cap: 'round' });
    g.arc(0, 0, r * 0.3, a + 3.2, a + 4.8).stroke({ width: 2, color: st.core.light, cap: 'round' });
    // anime specular
    g.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.12).fill({ color: 0xffffff, alpha: 0.95 });
    g.circle(-r * 0.08, -r * 0.6, r * 0.07).fill(0xffffff);
    g.arc(0, 0, r * 0.82, 0.3, 1.1).stroke({ width: 2, color: 0xffffff, alpha: 0.6, cap: 'round' });
  } else {
    const dead = mix(st.core.base, 0x2a2030, 0.78);
    g.circle(0, 0, r).fill(dead).stroke({ width: 3, color: ink });
    g.circle(r * 0.15, r * 0.18, r * 0.7).fill(mix(dead, 0x000000, 0.3));
    g.moveTo(-r * 0.7, -r * 0.4).lineTo(-r * 0.1, -r * 0.05).lineTo(-r * 0.25, r * 0.4).lineTo(r * 0.2, r * 0.75).stroke({ width: 2.4, color: ink });
    g.moveTo(-r * 0.1, -r * 0.05).lineTo(r * 0.55, -r * 0.35).lineTo(r * 0.75, -r * 0.1).stroke({ width: 2.4, color: ink });
    g.moveTo(-r * 0.66, -r * 0.42).lineTo(-r * 0.08, -r * 0.08).stroke({ width: 1, color: st.core.light, alpha: 0.7 });
    g.ellipse(-r * 0.4, -r * 0.45, r * 0.16, r * 0.08).fill({ color: 0xffffff, alpha: 0.45 });
  }
}

/** Cartoon flame tongue: base at (x,y), height h, width w, lean = horizontal tip offset. */
export function drawFlame(g: Graphics, x: number, y: number, w: number, h: number, lean: number, ink: number) {
  const tip = (sc: number) => {
    const hw = (w / 2) * sc;
    const hh = h * sc;
    g.moveTo(x - hw, y);
    g.bezierCurveTo(x - hw * 1.25, y - hh * 0.45, x + lean * 0.4 - hw * 0.3, y - hh * 0.6, x + lean, y - hh);
    g.bezierCurveTo(x + lean * 0.4 + hw * 0.5, y - hh * 0.55, x + hw * 1.25, y - hh * 0.4, x + hw, y);
    g.quadraticCurveTo(x, y + hw * 0.55, x - hw, y);
    g.closePath();
  };
  tip(1);
  g.fill(0xff5a1a).stroke({ width: 2.4, color: ink, join: 'round' });
  tip(0.68);
  g.fill(0xffb21a);
  tip(0.36);
  g.fill(0xfff2a8);
}
