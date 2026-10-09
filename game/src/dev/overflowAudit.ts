/**
 * DEV ONLY — layout overflow detector for panels and modals.
 *
 * Walks the Pixi tree of what's open on `scenes.overlayLayer` (modals, sheets) — or the current
 * scene when nothing is open — and reports, in logical 1920×1080 coordinates:
 *  - `out`:     a visible Text (or tappable control) whose bounds leave its modal's content rect
 *               (the panel minus the title band) or the real screen (`game.view`)
 *  - `overlap`: two visible Texts whose boxes overlap (same-string pairs = print shadows, skipped)
 * Masks are honoured: anything scrolled out of a ScrollBox is clipped first, not reported.
 *
 * Usage (devtools / headless): `__overflow()` → { scope, out[], overlap[] }; `__overflow({ log: true })`.
 */
import { Container, Text } from 'pixi.js';
import { game, ViewRect } from '../core/App';
import { scenes } from '../core/scenes';
import { Modal } from '../ui/modal';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface OverflowHit {
  kind: 'text' | 'control';
  text: string;
  box: Box;
  /** how far it leaks past the limit on each side (logical px, > 0 = outside) */
  leak: { l: number; r: number; t: number; b: number };
  limit: 'modal' | 'screen';
  path: string;
}
export interface OverlapHit {
  a: string;
  b: string;
  boxA: Box;
  boxB: Box;
  /** overlap area / smaller box area */
  ratio: number;
}
export interface OverflowReport {
  scope: string;
  view: ViewRect;
  content: Box | null;
  texts: number;
  out: OverflowHit[];
  overlap: OverlapHit[];
}

const r1 = (n: number) => Math.round(n);
const rb = (b: Box): Box => ({ x: r1(b.x), y: r1(b.y), w: r1(b.w), h: r1(b.h) });

/** global (screen px) bounds → logical design coordinates */
function logical(c: Container): Box {
  const b = c.getBounds();
  const k = game.scale || 1;
  return { x: (b.x - game.root.x) / k, y: (b.y - game.root.y) / k, w: b.width / k, h: b.height / k };
}
function intersect(a: Box, b: Box): Box | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  return x2 > x && y2 > y ? { x, y, w: x2 - x, h: y2 - y } : null;
}
function label(c: Container) {
  return c.label || c.constructor.name;
}
function pathOf(c: Container, stop: Container) {
  const parts: string[] = [];
  for (let n: Container | null = c; n && n !== stop && parts.length < 6; n = n.parent) parts.unshift(label(n));
  return parts.join('>');
}

interface Leaf {
  node: Container;
  box: Box;
  text: string;
  isText: boolean;
}

/** visible leaves (Texts + tappable controls) with their mask-clipped logical boxes */
function collect(root: Container): Leaf[] {
  const out: Leaf[] = [];
  const walk = (n: Container, alpha: number, clip: Box | null) => {
    if (n.destroyed || !n.visible || !n.renderable) return;
    const a = alpha * n.alpha;
    if (a < 0.05) return;
    let c = clip;
    const m = n.mask as Container | null | undefined;
    if (m && typeof m === 'object' && 'getBounds' in m) {
      const mb = logical(m);
      c = c ? intersect(c, mb) : mb;
      if (!c) return;
    }
    if (n instanceof Text) {
      if (!n.text.trim() || a < 0.3) return;
      // a Text's box is its line box: poster fonts carry ~15% empty ascent/descent, trim it
      const b0 = logical(n);
      const trim = b0.h * 0.14;
      const b = { x: b0.x, y: b0.y + trim, w: b0.w, h: b0.h - 2 * trim };
      const v = c ? intersect(b, c) : b;
      if (v && v.w > 2 && v.h > 2) out.push({ node: n, box: v, text: n.text.replace(/\s+/g, ' ').slice(0, 60), isText: true });
      return;
    }
    if (n.eventMode === 'static' && n.cursor === 'pointer' && n.children.length) {
      const b = logical(n);
      const v = c ? intersect(b, c) : b;
      const cap = n.children.flatMap((ch) => (ch instanceof Text ? [ch.text] : (ch as Container).children?.filter((g) => g instanceof Text).map((g) => (g as Text).text) ?? []));
      if (v && v.w > 2 && v.h > 2) out.push({ node: n, box: v, text: `[${cap.join(' ').replace(/\s+/g, ' ').slice(0, 40) || label(n)}]`, isText: false });
    }
    for (const ch of n.children) walk(ch as Container, a, c);
  };
  walk(root, 1, null);
  return out;
}

/** a rect of the modal panel (panel-local coords) in logical coords */
function panelRect(m: Modal, y0: number): Box {
  const p = m.panel;
  const tl = game.root.toLocal(p.toGlobal({ x: 0, y: y0 }));
  const br = game.root.toLocal(p.toGlobal({ x: m.w, y: m.h }));
  return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
}
const under = (n: Container, anc: Container) => {
  for (let c: Container | null = n; c; c = c.parent) if (c === anc) return true;
  return false;
};

export function overflowAudit(o: { tol?: number; log?: boolean; overlapMin?: number } = {}): OverflowReport {
  const tol = o.tol ?? 4;
  const view = { ...game.view };
  const layers = scenes.overlayLayer.children.filter((c) => c.visible && !c.destroyed) as Container[];
  const top = layers[layers.length - 1];
  const modal = top instanceof Modal ? top : (layers.slice().reverse().find((c) => c instanceof Modal) as Modal | undefined);
  const root = top ?? (scenes.current as Container | null) ?? scenes.sceneLayer;
  // body content answers to the panel below the title band; the band's own parts (title, X,
  // subtitle) to the whole panel; anything outside the panel (backdrop, toasts) to the screen
  const content = modal ? panelRect(modal, 86) : null;
  const whole = modal ? panelRect(modal, 0) : null;
  const leaves = collect(root);
  const outHits: OverflowHit[] = [];
  for (const L of leaves) {
    const inPanel = !!modal && under(L.node, modal.panel);
    const lim = !modal || !inPanel ? view : under(L.node, modal.body) ? content! : whole!;
    const leak = {
      l: lim.x - L.box.x,
      r: L.box.x + L.box.w - (lim.x + lim.w),
      t: lim.y - L.box.y,
      b: L.box.y + L.box.h - (lim.y + lim.h),
    };
    if (Math.max(leak.l, leak.r, leak.t, leak.b) > tol)
      outHits.push({
        kind: L.isText ? 'text' : 'control',
        text: L.text,
        box: rb(L.box),
        leak: { l: r1(Math.max(0, leak.l)), r: r1(Math.max(0, leak.r)), t: r1(Math.max(0, leak.t)), b: r1(Math.max(0, leak.b)) },
        limit: inPanel ? 'modal' : 'screen',
        path: pathOf(L.node, root),
      });
  }
  const texts = leaves.filter((l) => l.isText);
  const overlap: OverlapHit[] = [];
  const minR = o.overlapMin ?? 0.18;
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const A = texts[i];
      const B = texts[j];
      if (A.text === B.text) continue;
      const x = intersect(A.box, B.box);
      if (!x) continue;
      const ratio = (x.w * x.h) / Math.max(1, Math.min(A.box.w * A.box.h, B.box.w * B.box.h));
      if (ratio < minR || x.w < 4 || x.h < 4) continue;
      overlap.push({ a: A.text, b: B.text, boxA: rb(A.box), boxB: rb(B.box), ratio: Math.round(ratio * 100) / 100 });
    }
  const rep: OverflowReport = {
    scope: modal ? `modal:${modal.panel.children.find((c) => c instanceof Text)?.text ?? '?'}` : `scene:${root.constructor.name}`,
    view: { x: r1(view.x), y: r1(view.y), w: r1(view.w), h: r1(view.h) },
    content: content ? rb(content) : null,
    texts: texts.length,
    out: outHits,
    overlap,
  };
  if (o.log) {
    console.groupCollapsed(`[overflow] ${rep.scope}: ${outHits.length} out, ${overlap.length} overlaps`);
    for (const h of outHits) console.log(h.limit, h.kind, JSON.stringify(h.text), h.leak, h.path);
    for (const h of overlap) console.log('overlap', JSON.stringify(h.a), '×', JSON.stringify(h.b), h.ratio);
    console.groupEnd();
  }
  return rep;
}

export function installOverflowAudit() {
  (window as unknown as { __overflow: typeof overflowAudit }).__overflow = overflowAudit;
}
