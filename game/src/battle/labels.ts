/**
 * Readable battle labels:
 *  - LabelLanes: keeps world-space text boxes from piling on top of each other (damage numbers,
 *    onomatopoeia, reaction plates, "¡MÓDULO DESTRUIDO!"…): a new label slides up until it's free.
 *  - REACTION_INFO + reactionPlate(): reaction name + what it did + the two elements involved.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt, poster } from '../ui/widgets';
import { elementIcon } from '../ui/elementIcon';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  until: number;
}

export class LabelLanes {
  private boxes: Box[] = [];
  /** returns a y (center) for a box of w×h near (x, y) that doesn't overlap recent labels */
  place(x: number, y: number, w: number, h: number, life = 900, minY = 175): number {
    const now = performance.now();
    this.boxes = this.boxes.filter((b) => b.until > now);
    let yy = Math.max(minY + h / 2, y);
    let dir = -1;
    for (let guard = 0; guard < 16; guard++) {
      const hit = this.boxes.find((b) => Math.abs(b.x - x) < (b.w + w) / 2 + 6 && Math.abs(b.y - yy) < (b.h + h) / 2 + 4);
      if (!hit) break;
      // stack upward; when we hit the ceiling, stack downward instead
      const up = hit.y - (hit.h + h) / 2 - 6;
      if (dir < 0 && up - h / 2 < minY) dir = 1;
      yy = dir < 0 ? up : hit.y + (hit.h + h) / 2 + 6;
    }
    this.boxes.push({ x, y: yy, w, h, until: now + life });
    return yy;
  }
  clear() {
    this.boxes = [];
  }
}

export interface ReactionInfo {
  ono: string;
  color: number;
  desc: string;
  els: string[];
}
export const REACTION_INFO: Record<string, ReactionInfo> = {
  'CONDUCCIÓN': { ono: '¡BZZZT!', color: 0xffe14a, desc: 'Salta por lo Mojado ×1.5 · Aturde', els: ['water', 'storm'] },
  VENTISCA: { ono: '¡FSHHH!', color: 0xc6f0e4, desc: 'Congela lo Mojado · módulos fuera', els: ['water', 'storm'] },
  ESTALLIDO: { ono: '¡KRASH!', color: 0xa7e8d7, desc: 'Hielo roto ×2 + esquirlas', els: ['earth', 'water'] },
  AVIVAR: { ono: '¡FWOOOM!', color: 0xff6a1a, desc: 'El fuego se aviva ×1.5 y se riega', els: ['fire', 'storm'] },
  SOBRECARGA: { ono: '¡KZZZT!', color: 0xffe14a, desc: 'Hierro / escudo fuera de servicio', els: ['storm'] },
  VAPOR: { ono: '¡PSSSH!', color: 0xf2f2f2, desc: 'Apaga el fuego · nube de vapor', els: ['fire', 'water'] },
  BRECHA: { ono: '¡GLUG!', color: 0x7fd8ff, desc: 'Hoyo bajo el agua: se inunda', els: ['water'] },
  FLORECER: { ono: '¡BLOOM!', color: 0x7ed957, desc: 'Las raíces crecen el doble', els: ['water', 'nature'] },
  'MAR HELADO': { ono: '¡CRIC!', color: 0xc6f0e4, desc: 'Congela lo Mojado', els: ['water'] },
  AMPLIFICAR: { ono: '¡ZING!', color: 0xff7ab8, desc: 'Duplica los estados', els: ['magic'] },
  DEVORAR: { ono: '¡...!', color: 0xff2e88, desc: 'Borra estados y escudos', els: ['void'] },
  '¡SANTABÁRBARA!': { ono: '¡KABOOM!', color: 0xff6a1a, desc: 'Pólvora: explosión en cadena', els: ['fire'] },
  '¡PARARRAYOS!': { ono: '¡ZAP!', color: 0xffe14a, desc: 'El pararrayos se tragó tu rayo', els: ['storm'] },
};

/** big reaction plate: elements + NAME + effect line */
export function reactionPlate(layer: Container, x: number, y: number, name: string, mult: number) {
  const info = REACTION_INFO[name] ?? { ono: '¡!', color: C.yellow, desc: '', els: [] };
  const c = new Container();
  const title = poster(name, 64, C.ink, { stroke: { color: C.paper, width: 8 } });
  title.anchor.set(0.5);
  const descStr = info.desc + (mult > 1.01 && !/×/.test(info.desc) ? `  ×${mult.toFixed(1)}` : '');
  const desc = txt(descStr, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.paper });
  desc.anchor.set(0.5);
  desc.y = 50;
  const iconsW = info.els.length * 46;
  const w = Math.max(title.width + iconsW + 30, desc.width + 30);
  const plate = new Graphics()
    .rect(-w / 2 + 8, -38 + 8, w, 108)
    .fill(C.ink)
    .rect(-w / 2, -38, w, 70)
    .fill(info.color)
    .stroke({ width: 5, color: C.ink })
    .rect(-w / 2, 32, w, 38)
    .fill(C.ink);
  c.addChild(plate, title, desc);
  title.x = iconsW / 2;
  info.els.forEach((el, i) => {
    const ic = elementIcon(el, 40);
    ic.position.set(-w / 2 + 30 + i * 46, -3);
    c.addChild(ic);
  });
  c.position.set(x, y);
  c.rotation = -0.06;
  layer.addChild(c);
  gsap.from(c.scale, { x: 0.2, y: 0.2, duration: 0.22, ease: 'back.out(3)' });
  gsap.to(c, { alpha: 0, y: y - 30, delay: 1.5, duration: 0.35, onComplete: () => c.destroy({ children: true }) });
  return { node: c, w, h: 116, info };
}

/** small tag (info events: CORRIENTE, PIEL DE PIEDRA ×0.5, ¡GLUB! SUMERGIDO…) */
export function tagLabel(layer: Container, x: number, y: number, text: string, color: number) {
  const t = txt(text, { fontFamily: F.poster, fontSize: 30, fill: color, stroke: { color: C.ink, width: 7 }, letterSpacing: 1 });
  t.anchor.set(0.5);
  t.position.set(x, y);
  t.rotation = (Math.random() - 0.5) * 0.12;
  layer.addChild(t);
  gsap.from(t.scale, { x: 0.3, y: 0.3, duration: 0.18, ease: 'back.out(3)' });
  gsap.to(t, { y: y - 40, alpha: 0, delay: 0.9, duration: 0.4, onComplete: () => t.destroy() });
  return t;
}
