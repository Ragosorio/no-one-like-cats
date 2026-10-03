/** Isometric projection helpers (2:1 diamonds). */
export const TW = 128; // tile width in px
export const TH = 64; // tile height in px

export function isoToScreen(gx: number, gy: number) {
  return { x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) };
}

export function screenToIso(x: number, y: number) {
  const gx = (y / (TH / 2) + x / (TW / 2)) / 2;
  const gy = (y / (TH / 2) - x / (TW / 2)) / 2;
  return { gx: Math.floor(gx), gy: Math.floor(gy) };
}

/** depth key for painter's sorting */
export function depth(gx: number, gy: number, w = 1, h = 1) {
  return gx + w - 1 + (gy + h - 1);
}
