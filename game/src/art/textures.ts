import { Texture } from 'pixi.js';

const cache = new Map<string, Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function hex(n: number) {
  return '#' + n.toString(16).padStart(6, '0');
}

/** Cream paper with grain + fibers. Tileable-ish. */
export function paperTexture(base = 0xede4d6, size = 512, strength = 1): Texture {
  const key = `paper-${base}-${size}-${strength}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(size, size);
  g.fillStyle = hex(base);
  g.fillRect(0, 0, size, size);
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 18 * strength;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.06 * strength;
  for (let i = 0; i < 160; i++) {
    g.strokeStyle = Math.random() < 0.5 ? '#000' : '#fff';
    g.lineWidth = Math.random() * 1.2;
    g.beginPath();
    const x = Math.random() * size;
    const y = Math.random() * size;
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.random() * 30 - 15, y + Math.random() * 30 - 15, x + Math.random() * 40 - 20, y + Math.random() * 40 - 20);
    g.stroke();
  }
  // blotches
  g.globalAlpha = 0.035 * strength;
  for (let i = 0; i < 18; i++) {
    const r = 20 + Math.random() * 80;
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, '#5a4630');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.translate(Math.random() * size, Math.random() * size);
    g.fillStyle = grd;
    g.fillRect(-r, -r, r * 2, r * 2);
    g.restore();
  }
  const t = Texture.from(c);
  t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}

/** Halftone dot pattern (Ben-Day), transparent background. */
export function halftoneTexture(color = 0x171317, cell = 10, radius = 2.6): Texture {
  const key = `ht-${color}-${cell}-${radius}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = cell * 16;
  const [c, g] = canvas(size, size);
  g.fillStyle = hex(color);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      g.beginPath();
      g.arc(x * cell + (y % 2 ? cell / 2 : 0), y * cell + cell / 2, radius, 0, Math.PI * 2);
      g.fill();
    }
  const t = Texture.from(c);
  t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}

/** Diagonal hatch lines for manga shading. */
export function hatchTexture(color = 0x171317, gap = 8, width = 1.5): Texture {
  const key = `hatch-${color}-${gap}-${width}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = gap * 16;
  const [c, g] = canvas(size, size);
  g.strokeStyle = hex(color);
  g.lineWidth = width;
  for (let i = -size; i < size * 2; i += gap) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + size, size);
    g.stroke();
  }
  const t = Texture.from(c);
  t.source.addressMode = 'repeat';
  cache.set(key, t);
  return t;
}

/** Soft radial glow sprite texture (white, alpha falloff) — tint it. */
export function glowTexture(size = 128): Texture {
  const key = `glow-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(size, size);
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = Texture.from(c);
  cache.set(key, t);
  return t;
}

/** Small round particle */
export function dotTexture(size = 32): Texture {
  const key = `dot-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(size, size);
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  g.fill();
  const t = Texture.from(c);
  cache.set(key, t);
  return t;
}

/** 4-point sparkle star */
export function sparkTexture(size = 64): Texture {
  const key = `spark-${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(size, size);
  const h = size / 2;
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(h, 0);
  g.quadraticCurveTo(h, h, size, h);
  g.quadraticCurveTo(h, h, h, size);
  g.quadraticCurveTo(h, h, 0, h);
  g.quadraticCurveTo(h, h, h, 0);
  g.fill();
  const t = Texture.from(c);
  cache.set(key, t);
  return t;
}
