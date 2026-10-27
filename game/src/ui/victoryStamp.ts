/**
 * Parte III · EL SELLO DE LA VICTORIA (docs/part-iii/mecanicas-v2/02-loop.md §5.3): back on the Carta after a FIRST win,
 * three beats in ~2.5 s, skippable with a tap:
 *   1. THE STAMP slams onto the page (the stage's own stamp, `stages[].stamp`, in the box's style) — the rubber-stamp
 *      sound, a small shake, ink that spreads
 *   2. THE HUELLAS (the Carta's scene floats them to the node — it already did; here only the count on the stamp)
 *   3. WHAT'S NEW: «B-6 ABIERTA», «¡FOTO DEL VIAJE!», «GATERA SIGUIENTE: YA ALCANZAN LAS HUELLAS»… and, small, the gold
 * Nothing is saved here (the stamp is derived from the wins). «Reducir movimiento»: no shake, a fade instead of the drop.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { settings } from '../core/settings';
import { sfx } from '../core/audio';
import { C, F } from './theme';
import { poster, txt } from './widgets';
import { screenRect } from './screen';

export interface VictoryStampOpts {
  /** the stamp id (data `stages[].stamp`): its little drawing */
  stamp?: string;
  /** «B-5» */
  label: string;
  /** «OFICIAL DONA» */
  name: string;
  color: number;
  huellas: number;
  /** what opened / what's new, in order (short, Spanish) */
  news: string[];
  /** the small line at the bottom («+680 M oro · +12 chatarra») */
  small?: string;
}

/** the stamp's little drawing (procedural, no raster): one per Borracha stamp, a star for any other */
function glyph(id: string | undefined, col: number): Graphics {
  const g = new Graphics();
  const s = { width: 7, color: col };
  switch (id) {
    case 'ticket':
      g.roundRect(-46, -26, 92, 52, 6).stroke(s).moveTo(-20, -26).lineTo(-20, 26).stroke({ width: 4, color: col });
      break;
    case 'dona':
      g.circle(0, 0, 40).stroke(s).circle(0, 0, 13).stroke(s).moveTo(28, -26).lineTo(42, -40).stroke(s);
      break;
    case 'botella':
      g.roundRect(-16, -10, 32, 56, 8).stroke(s).rect(-7, -44, 14, 34).stroke(s);
      break;
    case 'micro':
      g.circle(0, -20, 22).stroke(s).moveTo(0, 2).lineTo(0, 44).stroke(s).moveTo(-20, 44).lineTo(20, 44).stroke(s);
      break;
    case 'placa':
      g.poly([0, -46, 40, -24, 32, 30, 0, 46, -32, 30, -40, -24]).stroke(s).star(0, 0, 5, 16, 7).stroke({ width: 4, color: col });
      break;
    case 'corcholata':
      g.star(0, 0, 14, 44, 36).stroke(s).circle(0, 0, 22).stroke({ width: 4, color: col });
      break;
    case 'lentes':
      g.circle(-24, 0, 20).stroke(s).circle(24, 0, 20).stroke(s).moveTo(-4, -4).lineTo(4, -4).stroke(s);
      break;
    case 'llave':
      g.circle(-26, 0, 18).stroke(s).moveTo(-8, 0).lineTo(44, 0).moveTo(30, 0).lineTo(30, 16).moveTo(40, 0).lineTo(40, 12).stroke(s);
      break;
    case 'pulsera':
      g.ellipse(0, 0, 46, 22).stroke(s).rect(-14, -30, 28, 16).stroke({ width: 4, color: col });
      break;
    default:
      g.star(0, 0, 5, 44, 20).stroke(s);
  }
  return g;
}

/** a rubber stamp: double ring, the glyph, the stage label and name around it */
function rubberStamp(o: VictoryStampOpts): Container {
  const c = new Container();
  const col = o.color;
  // a scrap of her notebook paper under the ink, so the stamp reads over any page
  const paper = new Graphics().circle(0, 0, 172).fill({ color: 0xf2ede2, alpha: 0.96 }).circle(0, 0, 172).stroke({ width: 3, color: C.ink, alpha: 0.5 });
  const ring = new Graphics().circle(0, 0, 150).stroke({ width: 10, color: col }).circle(0, 0, 128).stroke({ width: 4, color: col });
  const g = glyph(o.stamp, col);
  g.y = -24;
  const lbl = poster(o.label, 46, col);
  lbl.anchor.set(0.5);
  lbl.y = 52;
  const nm = poster(o.name.toUpperCase(), 26, col, { letterSpacing: 2 });
  nm.anchor.set(0.5);
  nm.y = 96;
  if (nm.width > 220) nm.scale.set(220 / nm.width);
  const top = poster('GANADA', 24, col, { letterSpacing: 6 });
  top.anchor.set(0.5);
  top.y = -100;
  c.addChild(paper, ring, g, lbl, nm, top);
  return c;
}

/** play it over `parent` (the Carta's overlay); resolves when it's gone */
export async function playVictoryStamp(parent: Container, o: VictoryStampOpts): Promise<void> {
  const still = settings.reduceMotion;
  const layer = new Container();
  layer.eventMode = 'static';
  layer.hitArea = { contains: () => true };
  parent.addChild(layer);
  const dim = screenRect({ color: C.ink, alpha: 0.55 });
  layer.addChild(dim);
  const st = rubberStamp(o);
  st.position.set(W / 2, H / 2 - 60);
  st.rotation = -0.12;
  layer.addChild(st);
  let skip = false;
  layer.once('pointertap', () => (skip = true));
  const waitMs = async (ms: number) => {
    const t0 = performance.now();
    while (!skip && performance.now() - t0 < ms) await new Promise((r) => setTimeout(r, 40));
  };
  // 1 · the stamp
  if (still) {
    st.alpha = 0;
    gsap.to(st, { alpha: 1, duration: 0.25 });
  } else {
    st.scale.set(2.6);
    st.alpha = 0;
    gsap.to(st, { alpha: 1, duration: 0.12 });
    gsap.to(st.scale, { x: 1, y: 1, duration: 0.22, ease: 'power4.in', onComplete: () => gsap.fromTo(layer, { x: -6 }, { x: 0, duration: 0.25, ease: 'elastic.out(1,0.3)' }) });
  }
  sfx('hit');
  sfx('paper');
  await waitMs(380);
  // 2 · the huellas (on the stamp: the scene floats them to the node)
  if (o.huellas) {
    const h = poster(`+${o.huellas} HUELLAS DE 000`, 40, 0xe8a33d, { stroke: { color: C.ink, width: 6 } });
    h.anchor.set(0.5);
    h.position.set(W / 2, H / 2 + 130);
    layer.addChild(h);
    if (!still) gsap.from(h.scale, { x: 0.3, y: 0.3, duration: 0.3, ease: 'back.out(3)' });
    sfx('pop');
    await waitMs(500);
  }
  // 3 · what's new
  o.news.slice(0, 3).forEach((t, i) => {
    const row = poster(t, 34, C.paper, { stroke: { color: C.ink, width: 6 } });
    row.anchor.set(0.5);
    row.position.set(W / 2, H / 2 + 190 + i * 48);
    layer.addChild(row);
    if (!still) gsap.from(row, { alpha: 0, y: row.y + 20, duration: 0.25, delay: i * 0.18 });
  });
  if (o.small) {
    const sm = txt(o.small, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.paper });
    sm.anchor.set(0.5);
    sm.position.set(W / 2, H / 2 + 200 + Math.min(3, o.news.length) * 48);
    layer.addChild(sm);
  }
  await waitMs(o.news.length ? 1500 : 900);
  await new Promise<void>((r) => gsap.to(layer, { alpha: 0, duration: 0.25, onComplete: () => r() }));
  gsap.killTweensOf(layer);
  if (!layer.destroyed) layer.destroy({ children: true });
}
