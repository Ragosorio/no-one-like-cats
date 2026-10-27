/**
 * PARTE III · EL FINAL — the small playable pieces between the films (⚠️ SPOILERS; historia-v2/guiones/final/):
 *
 *   onePress(label, o)    a single button over a dim (the faro «Toca el faro», the vigil's «Seguir»): no clock
 *   desayuno(cats)        R8, optional: breakfast on the beach — tap your cats to hand out donuts; the blow comes in
 *                         the middle of it (half of them fed), or when you say SEGUIR
 *   oscurasMira(n)        «A oscuras» reduced to its input (when F36 exists): the black, your cats' eyes, «MIRA»
 *   diselo(name)          H96, F39's fallback: the Part I note in her hand, what she said that night in grey, DÍSELO
 *   loQueQuedo()          «Lo que quedó»: the hidden list behind the map + the little envelope (no system text, no music)
 *
 * Never a goal or a text that says «protégela», «sálvala», «aguanta» or «antes de que sea tarde» (00-indice §2.5).
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { sfx } from '../../core/audio';
import { settings } from '../../core/settings';
import { W, H } from '../../core/App';
import { storyLayer } from '../dialog';
import { followView, screenRect } from '../screen';
import { C, F } from '../theme';
import { Button, poster, txt } from '../widgets';
import { hush } from '../hush';
import { catPortrait } from '../../panels/campaign/common';

const PAPER = 0xf6efdc;
const INK = C.inkBlue;

function overlay(alpha = 0.55, color: number = C.ink): Container {
  const root = new Container();
  root.label = 'p3Final';
  const dim = screenRect({ color, alpha });
  dim.eventMode = 'static';
  root.addChild(dim);
  // above any open panel (the Bitácora is a Modal on the same overlay layer: «Lo que quedó» opens over it)
  const l = storyLayer();
  const p = l.parent;
  if (p && p.children[p.children.length - 1] !== l) p.addChild(l);
  l.addChild(root);
  return root;
}
function close(root: Container) {
  if (root.destroyed) return;
  gsap.to(root, { alpha: 0, duration: 0.35, onComplete: () => root.destroy({ children: true }) });
}
function paper(w: number, h: number, rot = -0.015): Container {
  const c = new Container();
  const g = new Graphics();
  g.rect(12, 14, w, h).fill({ color: C.ink, alpha: 0.85 });
  g.rect(0, 0, w, h).fill(PAPER).stroke({ width: 4, color: C.ink, alignment: 1 });
  for (let y = 96; y < h - 16; y += 52) g.moveTo(18, y).lineTo(w - 18, y).stroke({ width: 2, color: 0x7fa6c9, alpha: 0.5 });
  g.moveTo(84, 8).lineTo(84, h - 8).stroke({ width: 2, color: C.red, alpha: 0.45 });
  c.addChild(g);
  c.rotation = rot;
  return c;
}
/** her hand (F.brush) */
const hand = (s: string, size = 34, width = 600, fill: number = INK) => txt(s, { fontFamily: F.brush, fontSize: size, fill, wordWrap: true, wordWrapWidth: width, lineHeight: size * 1.35, padding: 8 });

/** one button, no clock: resolves when it's pressed */
export function onePress(label: string, o: { dim?: number; sub?: string; color?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    const root = overlay(o.dim ?? 0.25);
    hush('p3_final', true);
    const b = new Button(label, () => {
      sfx('paper');
      hush('p3_final', false);
      close(root);
      resolve();
    }, { w: 360, h: 92, size: 44, color: o.color ?? C.yellow });
    root.addChild(b);
    let sub: Text | null = null;
    if (o.sub) {
      sub = txt(o.sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.paper, align: 'center', wordWrap: true, wordWrapWidth: 900 });
      sub.anchor.set(0.5, 1);
      root.addChild(sub);
    }
    followView(root, (v) => {
      b.position.set(v.x + (v.w - 360) / 2, v.y + v.h - 220);
      sub?.position.set(v.x + v.w / 2, v.y + v.h - 236);
    });
    if (!settings.reduceMotion) gsap.from(b, { alpha: 0, duration: 0.5 });
  });
}

/**
 * R8 · the optional breakfast: «si vienen, que nos encuentren comiendo» (H87). Tap each cat to give it a donut.
 * Resolves with how many were fed: at half the table (rounded up) the blow comes by itself — mid-breakfast, not on a
 * textbook beat — or at SEGUIR (0 = skipped).
 */
export function desayuno(cats: { species: string; slug?: string; name: string }[]): Promise<number> {
  return new Promise((resolve) => {
    const root = overlay(0.35, 0x1a1408);
    hush('p3_final', true);
    const panel = new Container();
    root.addChild(panel);
    const PW = 1180;
    const PH = 560;
    const bg = new Graphics().rect(10, 12, PW, PH).fill(C.ink).rect(0, 0, PW, PH).fill(0xfff1cf).stroke({ width: 5, color: C.ink, alignment: 1 });
    panel.addChild(bg);
    const t = poster('EL DESAYUNO', 70, C.ink, { letterSpacing: -1 });
    t.position.set(40, 26);
    const tag = txt('SI VIENEN, QUE NOS ENCUENTREN COMIENDO', { fontFamily: F.bebas, fontSize: 28, fill: C.pinkHot, letterSpacing: 3 });
    tag.position.set(44, 112);
    const sub = txt('Toca a cada gato para darle su dona.', { fontFamily: F.ui, fontWeight: '700', fontSize: 22, fill: C.ink });
    sub.position.set(44, 150);
    panel.addChild(t, tag, sub);
    const shown = cats.slice(0, 6);
    const need = Math.max(1, Math.ceil(shown.length / 2));
    let fed = 0;
    let done = false;
    const finish = (n: number) => {
      if (done) return;
      done = true;
      hush('p3_final', false);
      close(root);
      resolve(n);
    };
    const cw = Math.min(180, (PW - 80) / Math.max(1, shown.length));
    shown.forEach((c, i) => {
      const cell = new Container();
      const p = catPortrait(c.species, 120, { slug: c.slug });
      p.position.set(cw / 2, 90);
      const nm = txt(c.name.toUpperCase(), { fontFamily: F.poster, fontSize: 20, fill: C.ink });
      nm.anchor.set(0.5, 0);
      nm.position.set(cw / 2, 160);
      if (nm.width > cw - 10) nm.scale.set((cw - 10) / nm.width);
      const dona = new Graphics().circle(0, 0, 22).fill(0xf2a0c0).stroke({ width: 4, color: C.ink }).circle(0, 0, 8).fill(0xfff1cf).stroke({ width: 3, color: C.ink });
      dona.position.set(cw / 2 + 46, 40);
      dona.visible = false;
      cell.addChild(p, nm, dona);
      cell.position.set(40 + i * cw, 200);
      cell.eventMode = 'static';
      cell.cursor = 'pointer';
      let got = false;
      cell.on('pointertap', () => {
        if (got || done) return;
        got = true;
        sfx('pop');
        dona.visible = true;
        if (!settings.reduceMotion) gsap.from(dona.scale, { x: 0.2, y: 0.2, duration: 0.3, ease: 'back.out(3)' });
        fed++;
        // the blow comes in the middle of the breakfast (R8): half the table fed, a beat later
        if (fed >= need) setTimeout(() => finish(fed), 900);
      });
      panel.addChild(cell);
    });
    const seguir = new Button('SEGUIR', () => finish(fed), { w: 220, h: 64, size: 32, color: C.paper });
    seguir.position.set(PW - 260, PH - 90);
    panel.addChild(seguir);
    followView(panel, (v) => panel.position.set(v.x + (v.w - PW) / 2, v.y + Math.max(30, (v.h - PH) / 2)));
    if (!settings.reduceMotion) gsap.from(panel, { y: panel.y + 40, alpha: 0, duration: 0.45, ease: 'power2.out' });
  });
}

/** «A oscuras» as just its input (F36 exists): the black, `n` pairs of eyes, «Que no se lleven a Cerito», then MIRA */
export function oscurasMira(n: number, o: { delay?: number; auto?: number; goal?: string; label?: string } = {}): Promise<'tap' | 'auto'> {
  return new Promise((resolve) => {
    const root = overlay(1, 0x020306);
    hush('p3_final', true);
    const eyes = new Graphics();
    root.addChild(eyes);
    const pairs = Array.from({ length: Math.max(2, Math.min(14, n)) }, (_, i) => ({ x: 0.12 + ((i * 0.618) % 1) * 0.76, y: 0.42 + ((i * 0.37) % 1) * 0.36, ph: i * 1.7 }));
    const goal = txt(o.goal ?? 'Que no se lleven a Cerito', { fontFamily: F.bebas, fontSize: 34, fill: 0xd9d4c4, letterSpacing: 4 });
    goal.anchor.set(0.5, 0);
    root.addChild(goal);
    let t = 0;
    let vw = { x: 0, y: 0, w: W, h: H };
    followView(root, (v) => {
      vw = v;
      goal.position.set(v.x + v.w / 2, v.y + 60);
    });
    const tick = () => {
      t += 1 / 60;
      eyes.clear();
      pairs.forEach((p, i) => {
        if (t < 0.4 + i * 0.25) return;
        const open = Math.sin(t * 0.8 + p.ph) > 0.97 ? 0.15 : 1;
        const x = vw.x + p.x * vw.w;
        const y = vw.y + p.y * vw.h;
        eyes.ellipse(x - 10, y, 6, 6 * open).fill(0xffd84a).ellipse(x + 10, y, 6, 6 * open).fill(0xffd84a);
      });
    };
    gsap.ticker.add(tick);
    let done = false;
    const end = (how: 'tap' | 'auto') => {
      if (done) return;
      done = true;
      gsap.ticker.remove(tick);
      hush('p3_final', false);
      close(root);
      resolve(how);
    };
    setTimeout(() => {
      if (done || root.destroyed) return;
      const bw = o.label ? 360 : 220;
      const b = new Button(o.label ?? 'MIRA', () => end('tap'), { w: bw, h: 84, size: 46, color: 0xffd84a });
      b.position.set(vw.x + (vw.w - bw) / 2, vw.y + vw.h * 0.6);
      root.addChild(b);
      setTimeout(() => end('auto'), (o.auto ?? 4) * 1000);
    }, (o.delay ?? 3) * 1000);
  });
}

/**
 * H96 · DÍSELO (F39's fallback): the Part I note, in her hand, like an old note — «Te lo pidió hace mucho» — and under
 * it, in grey, what she said that night when he couldn't hear. The button has no clock.
 */
export function diselo(note: string, aviso: string, gris: string): Promise<void> {
  return new Promise((resolve) => {
    const root = overlay(0.5);
    hush('p3_final', true);
    const PW = 980;
    const PH = 520;
    const page = paper(PW, PH, 0.012);
    root.addChild(page);
    const a = hand(note, 36, PW - 160);
    a.position.set(110, 40);
    const k = txt(aviso, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink });
    k.alpha = 0.7;
    k.position.set(112, a.y + a.height + 18);
    const g = hand(gris, 30, PW - 160, 0x8a8a8a);
    g.position.set(110, k.y + k.height + 22);
    page.addChild(a, k, g);
    const b = new Button('DÍSELO', () => {
      sfx('paper');
      hush('p3_final', false);
      close(root);
      resolve();
    }, { w: 300, h: 88, size: 44, color: C.yellow });
    root.addChild(b);
    followView(root, (v) => {
      page.position.set(v.x + (v.w - PW) / 2, v.y + Math.max(30, (v.h - PH) / 2 - 70));
      b.position.set(v.x + (v.w - 300) / 2, page.y + PH + 30);
    });
    if (!settings.reduceMotion) gsap.from(page, { y: page.y - 40, alpha: 0, duration: 0.4, ease: 'back.out(1.4)' });
  });
}

/** «Lo que quedó»: her hidden list (01-biblia-v2 §4.3), crossed out by her long ago, as a joke; and the envelope */
export const LISTA_ESCONDIDA: { item: string; nota: string }[] = [
  { item: 'Morirme', nota: '(ya, gracias)' },
  { item: 'Que Canelo me hable', nota: '(¡¿ME HABLÓ?!)' },
  { item: 'Cansarme', nota: '(cargando al gordo con la luz. Vale la pena.)' },
  { item: 'Tener frío', nota: '(Cerito se me durmió encima. Vale la pena.)' },
  // the owner may cut the 5th (h96-el-recado.md: «si prefiere que no exista ni por escrito, la hoja termina en el 4»)
  { item: 'Morirme otra vez', nota: '(imposible: ya la usé)' },
];
export const SOBRECITO = 'Hilos del gordo (robados): muchos.';
export function loQueQuedo(o: { lista?: typeof LISTA_ESCONDIDA } = {}): Promise<void> {
  const lista = o.lista ?? LISTA_ESCONDIDA;
  return new Promise((resolve) => {
    const root = overlay(0.45);
    hush('p3_final', true);
    const PW = 900;
    const PH = 170 + lista.length * 78;
    const page = paper(PW, PH, -0.03);
    root.addChild(page);
    lista.forEach((l, i) => {
      const it = hand(`${i + 1}. ${l.item}`, 40, PW - 160);
      it.position.set(110, 40 + i * 78);
      // crossed out by her, long ago
      const strike = new Graphics().moveTo(104, it.y + 30).lineTo(110 + it.width + 6, it.y + 24).stroke({ width: 4, color: INK });
      const n = hand(l.nota, 26, PW - 180);
      n.position.set(130, it.y + 44);
      n.alpha = 0.85;
      page.addChild(it, strike, n);
    });
    // the little envelope, next to the list
    const env = new Container();
    const eg = new Graphics().rect(6, 6, 320, 180).fill(C.ink).rect(0, 0, 320, 180).fill(0xf3e3c2).stroke({ width: 4, color: C.ink, alignment: 1 }).moveTo(0, 0).lineTo(160, 76).lineTo(320, 0).stroke({ width: 3, color: C.ink });
    const et = hand(SOBRECITO, 23, 290);
    et.position.set(16, 88);
    env.addChild(eg, et);
    env.rotation = 0.06;
    root.addChild(env);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      hush('p3_final', false);
      close(root);
      resolve();
    };
    // no system text: a tap anywhere closes it (after a moment to read)
    setTimeout(() => {
      if (root.destroyed) return;
      root.eventMode = 'static';
      root.on('pointertap', end);
    }, 1500);
    followView(root, (v) => {
      page.position.set(v.x + Math.max(20, v.w / 2 - PW / 2 - 140), v.y + Math.max(20, (v.h - PH) / 2));
      env.position.set(page.x + PW - 60, page.y + PH - 190);
    });
    if (!settings.reduceMotion) gsap.from(page, { x: page.x - 60, alpha: 0, duration: 0.6, ease: 'power2.out' });
  });
}
