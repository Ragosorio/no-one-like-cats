/**
 * Text that must live inside a fixed box. Prefer re-wrapping at a smaller font size over scaling
 * the whole block (uniform scaling leaves a wide empty margin and gets unreadable fast).
 */
import { Text, TextStyleOptions } from 'pixi.js';
import { txt } from './widgets';

/** largest font size in `sizes` whose wrapped text fits w×h; at the smallest size it scales down */
export function fitBlock(text: string, w: number, h: number, style: TextStyleOptions, sizes = [16, 15, 14, 13, 12, 11]): Text {
  let t: Text | null = null;
  for (const fs of sizes) {
    t?.destroy();
    t = txt(text, { ...style, fontSize: fs, wordWrap: true, wordWrapWidth: w, lineHeight: Math.round(fs * 1.22) });
    if (t.height <= h) return t;
  }
  if (t && t.height > h) t.scale.set(h / t.height);
  return t!;
}

/** one line that never exceeds w (scaled down, never up) */
export function fitLine(t: Text, w: number) {
  t.scale.set(1);
  if (t.width > w) t.scale.set(w / t.width);
  return t;
}
