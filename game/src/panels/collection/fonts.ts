/** Playfair Display italics for ORQUÍDEA REAL (main.ts only bundles the upright cuts). */
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/playfair-display/700-italic.css';

let p: Promise<void> | null = null;
export function ensureFonts(): Promise<void> {
  if (!p) {
    p = Promise.all([
      document.fonts.load('italic 400 40px "Playfair Display"'),
      document.fonts.load('italic 700 40px "Playfair Display"'),
      document.fonts.load('700 40px "Playfair Display"'),
    ])
      .then(() => undefined)
      .catch(() => undefined);
  }
  return p;
}
