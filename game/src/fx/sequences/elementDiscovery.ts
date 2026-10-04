/**
 * Storyboard (f) — new element discovered (T4, ~7.5 s, tap after 2 s = fast-forward):
 * sky darkens → a crack opens onto the element's dimension → "ELEMENTO DESCONOCIDO DETECTADO" →
 * impact frame and the world is reprinted in the element palette → giant poster "TIERRA" + badge →
 * resonance web with a "NUEVAS RESONANCIAS 0→N" counter → stamps → back to the world.
 */
import { ColorMatrixFilter, Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';
import { CRTFilter, GlitchFilter, RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { halftoneTexture, hatchTexture } from '../../art/textures';
import { catTexture, elementFx, loadCatTexture } from '../../art/catArt';
import { SilhouetteFilter } from '../filters';
import { sfx } from '../../core/audio';
import { music } from '../../core/music';
import { settings } from '../../core/settings';
import { Shaker, flash, sparkles } from '../juice';
import { ELEMENT_BY_ID, ELEMENTS } from '../../data/content';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementIcon } from '../../ui/elementIcon';
import { killTree } from '../../panels/campaign/common';

export interface ElementDiscoveryOpts {
  element: string;
  /** the scene behind (darkened, then reprinted in the element palette) */
  world?: Container | null;
  /** art slug of the primordial whose silhouette appears in the crack */
  primordialSlug?: string;
  /** elements already known (for the resonance web) */
  known: string[];
  resonances: number;
  stamps: string[];
  caption?: string;
}

function hexToNum(h: string | undefined, fb: number) {
  if (!h) return fb;
  const n = parseInt(h.replace('#', ''), 16);
  return isNaN(n) ? fb : n;
}
const rgb = (n: number) => [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];

/** luminance → duotone between dark and light (ColorMatrix offsets are 0..1 in pixi v8) */
function duotone(dark: number, light: number) {
  const f = new ColorMatrixFilter();
  const d = rgb(dark);
  const l = rgb(light);
  const m: number[] = [];
  for (let c = 0; c < 3; c++) {
    const k = l[c] - d[c];
    m.push(0.299 * k, 0.587 * k, 0.114 * k, 0, d[c]);
  }
  m.push(0, 0, 0, 1, 0);
  f.matrix = m as unknown as ColorMatrixFilter['matrix'];
  f.alpha = 0;
  return f;
}

/** dev/QA hook: the running timeline (seek it to inspect frames) */
export const discoveryDebug: { tl: gsap.core.Timeline | null } = { tl: null };

export async function playElementDiscovery(layer: Container, o: ElementDiscoveryOpts): Promise<void> {
  if (o.primordialSlug) await loadCatTexture(o.primordialSlug).catch(() => undefined);
  return new Promise((resolve) => {
    const el = o.element;
    const def = ELEMENT_BY_ID.get(el);
    const fx = elementFx(el);
    const pal = def?.palette ?? [];
    const dark = hexToNum(pal[0], fx.dark);
    const light = hexToNum(pal[1], 0xeae1d3);
    const main = hexToNum(pal[2], fx.main);
    const accent = hexToNum(pal[3], fx.accent);
    const name = ELEMENT_NAME[el] ?? el.toUpperCase();
    const reduce = settings.reduceMotion;

    const root = new Container();
    layer.addChild(root);
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    const shaker = new Shaker(root, 18, 0.015);

    // ----- world reaction: darken
    const world = o.world && !o.world.destroyed ? o.world : null;
    const prevFilters = world?.filters ? [...(world.filters as never[])] : null;
    const dim = new ColorMatrixFilter();
    const tone = duotone(dark, light);
    if (world) world.filters = [dim, tone];
    const dimState = { b: 1 };
    const veil = new Graphics().rect(0, 0, W, H).fill(0x05060a);
    veil.alpha = 0;
    root.addChild(veil);

    // ----- crack (the opening onto the element's dimension)
    const crackPts: [number, number][] = [];
    {
      let x = W * 0.34;
      let y = -20;
      crackPts.push([x, y]);
      for (let i = 0; i < 9; i++) {
        x += 40 + Math.random() * 70;
        y += 50 + Math.random() * 40;
        crackPts.push([x, y]);
      }
    }
    const dimension = new Container();
    const dimBg = new Graphics().rect(0, 0, W, H).fill(main);
    const hatch = new TilingSprite({ texture: hatchTexture(dark, 9, 2), width: W, height: H });
    hatch.alpha = 0.35;
    const dots = new TilingSprite({ texture: halftoneTexture(accent, 14, 3), width: W, height: H });
    dots.alpha = 0.5;
    dimension.addChild(dimBg, hatch, dots);
    let sil: Sprite | null = null;
    if (o.primordialSlug) {
      sil = new Sprite(catTexture(o.primordialSlug));
      sil.anchor.set(0.5);
      const s = 360 / Math.max(1, sil.texture.height);
      sil.scale.set(s);
      const mid = crackPts[Math.floor(crackPts.length / 2)];
      sil.position.set(mid[0], mid[1]);
      sil.filters = [new SilhouetteFilter(0x050505, 1)];
      sil.alpha = 0;
      dimension.addChild(sil);
    }
    const crackMask = new Graphics();
    dimension.mask = crackMask;
    const crackEdge = new Graphics();
    root.addChild(dimension, crackMask, crackEdge);
    const crack = { open: 0, len: 0 };
    const drawCrack = () => {
      const n = Math.max(2, Math.ceil(crack.len * crackPts.length));
      const pts = crackPts.slice(0, n);
      const w = crack.open;
      crackMask.clear();
      crackEdge.clear();
      if (pts.length < 2) return;
      const left: number[] = [];
      const right: number[] = [];
      pts.forEach(([x, y], i) => {
        const taper = Math.sin((i / (pts.length - 1)) * Math.PI) * w + 2;
        left.push(x - taper, y);
        right.unshift(x + taper * 0.8, y + taper * 0.3);
      });
      const poly = [...left, ...right];
      crackMask.poly(poly).fill(0xffffff);
      crackEdge.poly(poly).stroke({ width: 5, color: 0xffffff, alpha: 0.95 });
      crackEdge.poly(poly).stroke({ width: 14, color: accent, alpha: 0.35 });
    };

    // ----- teletype text
    const tele = new Container();
    const teleBg = new Graphics();
    const teleT = txt('', { fontFamily: 'monospace', fontWeight: '700', fontSize: 40, fill: 0x9cff9c, letterSpacing: 4 });
    teleT.position.set(30, 18);
    tele.addChild(teleBg, teleT);
    tele.position.set(W / 2 - 520, H - 250);
    tele.alpha = 0;
    root.addChild(tele);
    const message = 'ELEMENTO DESCONOCIDO DETECTADO';

    // ----- poster
    const poster = new Container();
    poster.alpha = 0;
    const blockA = new Graphics().rect(0, 0, 300, H).fill(dark);
    blockA.position.set(-340, 0);
    const blockB = new Graphics().rect(0, 0, 260, H).fill(accent);
    blockB.position.set(W + 40, 0);
    const big: Text = txt(name, { fontFamily: F.poster, fontSize: 760, fill: dark, letterSpacing: -10, stroke: { color: light, width: 16, join: 'round' } });
    if (big.width > W - 160) big.scale.set((W - 160) / big.width);
    big.anchor.set(0.5);
    big.position.set(W / 2, H / 2 + 30);
    const circle = new Graphics().circle(0, 0, 170).fill(main).stroke({ width: 10, color: dark });
    circle.position.set(W - 330, 250);
    const emo = elementIcon(el, 300);
    emo.position.copyFrom(circle.position);
    const tag = txt(`PRIMORDIAL DE ${name}`, { fontFamily: F.bebas, fontSize: 54, fill: light, letterSpacing: 4, stroke: { color: dark, width: 6 } });
    tag.anchor.set(0.5);
    tag.position.set(W / 2, 120);
    const cap = txt(o.caption ?? 'Has descubierto un elemento que no debería existir en este mundo.', { fontFamily: F.serif, fontWeight: '700', fontSize: 36, fill: dark, wordWrap: true, wordWrapWidth: 1200, align: 'center' });
    cap.anchor.set(0.5);
    const capBg = new Graphics();
    cap.position.set(W / 2, H - 130);
    capBg.rect(W / 2 - cap.width / 2 - 26, H - 130 - cap.height / 2 - 14, cap.width + 52, cap.height + 28).fill(light).stroke({ width: 5, color: dark });
    const posterBg = new Graphics().rect(0, 0, W, H).fill(light);
    const posterDots = new TilingSprite({ texture: halftoneTexture(main, 16, 3.4), width: W, height: H });
    posterDots.alpha = 0.25;
    poster.addChild(posterBg, posterDots, blockA, blockB, big, circle, emo, tag, capBg, cap);
    root.addChild(poster);

    // ----- resonance web
    const web = new Container();
    web.alpha = 0;
    root.addChild(web);
    const counter = txt('NUEVAS RESONANCIAS: 0', { fontFamily: F.poster, fontSize: 72, fill: light });
    counter.anchor.set(0.5);
    counter.position.set(W / 2, 96);
    const known = o.known.filter((k) => k !== el);
    // the whole chapter web: discovered elements in color, the rest as "???" ghosts
    const all = ELEMENTS.filter((e) => e.id !== el && e.id !== 'void').sort((a, b) => a.order - b.order).map((e) => e.id);
    const center = { x: W / 2, y: H / 2 + 50 };
    const nodes: Container[] = [];
    const links = new Graphics();
    const ghostLinks = new Graphics();
    web.addChild(ghostLinks, links);
    all.forEach((k, i) => {
      const a = (i / Math.max(1, all.length)) * Math.PI * 2 - Math.PI / 2;
      const isKnown = known.includes(k);
      const n = new Container();
      const kf = elementFx(k === 'storm' ? 'electric' : k);
      const g = new Graphics().circle(0, 0, 60).fill(isKnown ? kf.main : 0xcfc6b4).stroke({ width: 6, color: dark });
      const e = isKnown ? elementIcon(k, 104) : txt('?', { fontFamily: F.poster, fontSize: 60, fill: dark });
      e.anchor.set(0.5);
      const l = txt(isKnown ? ELEMENT_NAME[k === 'storm' ? 'electric' : k] ?? k : '???', { fontFamily: F.poster, fontSize: 28, fill: dark });
      l.anchor.set(0.5, 0);
      l.y = 66;
      n.addChild(g, e, l);
      n.alpha = isKnown ? 1 : 0.55;
      n.position.set(center.x + Math.cos(a) * 520, center.y + Math.sin(a) * 300);
      n.scale.set(0);
      (n as Container & { known?: boolean }).known = isKnown;
      web.addChild(n);
      nodes.push(n);
    });
    // existing resonances between known elements (faint)
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i] as Container & { known?: boolean };
        const B = nodes[j] as Container & { known?: boolean };
        if (A.known && B.known) ghostLinks.moveTo(A.x, A.y).lineTo(B.x, B.y);
      }
    ghostLinks.stroke({ width: 3, color: dark, alpha: 0.25 });
    ghostLinks.alpha = 0;
    const counterBg = new Graphics();
    web.addChild(counterBg);
    const hub = new Container();
    const hg = new Graphics().circle(0, 0, 96).fill(main).stroke({ width: 8, color: dark });
    const he = elementIcon(el, 176);
    hub.addChild(hg, he);
    hub.position.set(center.x, center.y);
    hub.scale.set(0);
    web.addChild(hub, counter);

    // ----- stamps
    const stampLayer = new Container();
    root.addChild(stampLayer);

    // ================================================================ timeline
    const tl = gsap.timeline();
    discoveryDebug.tl = tl;
    let sustain = 0;
    const sustainTick = () => {
      if (sustain > 0) shaker.add(0.03);
    };
    gsap.ticker.add(sustainTick);
    // 0–600: world reacts
    tl.call(() => {
      music.stop();
      sfx('charge', 0.35);
      sfx('drumroll', 0.6);
    }, [], 0);
    tl.to(dimState, { b: 0.55, duration: 0.6, ease: 'power2.out', onUpdate: () => dim.brightness(dimState.b, false) }, 0);
    tl.to(veil, { alpha: 0.35, duration: 0.6 }, 0);
    tl.call(() => {
      for (let i = 0; i < 5; i++) {
        const ex = txt('!', { fontFamily: F.comic, fontSize: 90, fill: C.yellow, stroke: { color: C.ink, width: 8 } });
        ex.anchor.set(0.5, 1);
        ex.position.set(260 + i * 340 + Math.random() * 60, H - 120 - Math.random() * 120);
        root.addChild(ex);
        gsap.from(ex.scale, { y: 0, duration: 0.2, delay: i * 0.04, ease: 'back.out(4)' });
        gsap.to(ex, { alpha: 0, delay: 1.2, duration: 0.3, onComplete: () => ex.destroy() });
      }
    }, [], 0.3);
    // 600–1800: crack + glitch + quake
    const glitch = new GlitchFilter({ slices: 2, offset: 30, seed: 0.3 });
    tl.call(() => {
      sustain = 1;
      sfx('glitch');
      if (!reduce) root.filters = [glitch];
    }, [], 0.6);
    tl.to(crack, { len: 1, duration: 0.7, ease: 'power2.out', onUpdate: drawCrack }, 0.6);
    tl.to(crack, { open: 150, duration: 1.2, ease: 'power2.inOut', onUpdate: drawCrack }, 0.8);
    tl.to(glitch, { slices: 12, offset: 60, duration: 1.2, onUpdate: () => (glitch.seed = Math.random()) }, 0.6);
    // 1800–2400: silhouette + teletype
    if (sil) tl.to(sil, { alpha: 1, duration: 0.4 }, 1.8);
    tl.call(() => {
      root.filters = reduce ? [] : [new CRTFilter({ lineWidth: 3, lineContrast: 0.35, noise: 0.2, vignetting: 0.25 })];
      tele.alpha = 1;
      teleT.text = '';
      teleBg.clear().rect(0, 0, 1040, 90).fill({ color: 0x000000, alpha: 0.85 }).stroke({ width: 3, color: 0x9cff9c });
    }, [], 1.8);
    const typeObj = { n: 0 };
    tl.to(typeObj, {
      n: message.length,
      duration: 0.55,
      ease: 'none',
      onUpdate: () => {
        const k = Math.floor(typeObj.n);
        if (teleT.text.length !== k) {
          teleT.text = message.slice(0, k) + (k < message.length ? '█' : '');
          sfx('tick', 1.6);
        }
      },
    }, 1.82);
    // 2400–2600: impact frame → reprint
    tl.call(() => {
      sustain = 0;
      sfx('bigboom');
      shaker.add(0.6);
      flash(root, C.ink, 1, 0.12);
      root.filters = [];
      tele.alpha = 0;
      dimension.visible = false;
      crackEdge.visible = false;
      veil.alpha = 0;
      dim.brightness(1, false);
    }, [], 2.4);
    tl.to(tone, { alpha: 1, duration: 0.2 }, 2.42);
    // 2600–4600: poster
    tl.call(() => {
      sfx('fanfare');
      sfx('reveal');
      poster.alpha = 1;
      if (!reduce) {
        const split = new RGBSplitFilter({ red: { x: -16, y: 0 }, green: { x: 0, y: 10 }, blue: { x: 14, y: -6 } });
        poster.filters = [split];
        gsap.to(split.red, { x: 0, duration: 0.8 });
        gsap.to(split.green, { y: 0, duration: 0.8 });
        gsap.to(split.blue, { x: 0, y: 0, duration: 0.8, onComplete: () => (poster.filters = []) });
      }
      // falling element particles
      for (let i = 0; i < 26; i++) {
        const p = new Graphics().poly([0, 0, 18, 4, 14, 20, 2, 16]).fill(i % 2 ? main : accent).stroke({ width: 3, color: dark });
        p.position.set(Math.random() * W, -40 - Math.random() * 300);
        poster.addChild(p);
        gsap.to(p, { y: H + 60, rotation: Math.random() * 6, duration: 1.4 + Math.random() * 1.2, ease: 'power1.in', onComplete: () => p.destroy() });
      }
    }, [], 2.6);
    tl.to(blockA, { x: 0, duration: 0.3, ease: 'power3.out' }, 2.6);
    tl.to(blockB, { x: W - 260, duration: 0.3, ease: 'power3.out' }, 2.66);
    tl.from(circle.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(2)' }, 2.62);
    tl.from(emo.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(3)' }, 2.7);
    tl.from(big.scale, { x: big.scale.x * 1.4, y: big.scale.y * 1.4, duration: 0.3, ease: 'power3.out' }, 2.6);
    tl.from(tag, { alpha: 0, y: 80, duration: 0.3 }, 2.9);
    tl.from([capBg, cap], { alpha: 0, duration: 0.4 }, 3.2);
    // 4600–6600: resonance web
    tl.to(poster, { alpha: 0, duration: 0.3 }, 4.6);
    tl.to(web, { alpha: 1, duration: 0.2 }, 4.6);
    tl.call(() => {
      const bg = new Graphics().rect(0, 0, W, H).fill(light);
      const d = new TilingSprite({ texture: halftoneTexture(main, 18, 2.4), width: W, height: H });
      d.alpha = 0.2;
      web.addChildAt(d, 0);
      web.addChildAt(bg, 0);
      sfx('whoosh');
    }, [], 4.6);
    tl.call(() => {
      counterBg.clear().rect(W / 2 - 440, 40, 880, 112).fill(dark);
    }, [], 4.62);
    tl.to(ghostLinks, { alpha: 1, duration: 0.3 }, 4.8);
    tl.to(hub.scale, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' }, 4.7);
    nodes.forEach((n, i) => {
      tl.to(n.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(3)' }, 4.85 + i * 0.03);
    });
    const linkP = { t: 0 };
    tl.to(linkP, {
      t: 1,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => {
        links.clear();
        for (const n of nodes) {
          if (!(n as Container & { known?: boolean }).known) continue;
          links.moveTo(center.x, center.y).lineTo(center.x + (n.x - center.x) * linkP.t, center.y + (n.y - center.y) * linkP.t);
        }
        links.stroke({ width: 8, color: main, alpha: 1 });
      },
    }, 5.0);
    const cnt = { n: 0 };
    let lastN = -1;
    tl.to(cnt, {
      n: o.resonances,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: () => {
        const k = Math.round(cnt.n);
        if (k !== lastN) {
          lastN = k;
          counter.text = `NUEVAS RESONANCIAS: ${k}`;
          sfx('pop', 1 + ((k % 12) / 12) * 1.0);
        }
      },
      onComplete: () => {
        gsap.fromTo(counter.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
        sparkles(web, hub.x, hub.y, accent, 20, 260);
      },
    }, 5.0);
    // 6600–7500: stamps
    o.stamps.forEach((s, i) => {
      tl.call(() => {
        const c = new Container();
        const t = txt(s, { fontFamily: F.poster, fontSize: 48, fill: C.red, letterSpacing: 2 });
        t.anchor.set(0.5);
        const b = new Graphics()
          .rect(-t.width / 2 - 24, -t.height / 2 - 8, t.width + 48, t.height + 16)
          .fill(light)
          .stroke({ width: 6, color: C.red })
          .rect(-t.width / 2 - 16, -t.height / 2, t.width + 32, t.height)
          .stroke({ width: 2, color: C.red });
        c.addChild(b, t);
        c.position.set(W / 2 + (i % 2 ? 300 : -300), H - 150 + (i % 2) * 40);
        c.rotation = (i % 2 ? 0.06 : -0.06);
        stampLayer.addChild(c);
        gsap.from(c.scale, { x: 2.4, y: 2.4, duration: 0.16, ease: 'power3.in' });
        sfx('hit', 0.8 + i * 0.1);
        shaker.add(0.15);
      }, [], 6.6 + i * 0.3);
    });
    const tEnd = 6.6 + o.stamps.length * 0.3 + 0.9;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      gsap.ticker.remove(sustainTick);
      gsap.to(root, {
        alpha: 0,
        duration: 0.4,
        onComplete: () => {
          tl.kill();
          shaker.destroy();
          killTree(root);
          root.destroy({ children: true });
          resolve();
        },
      });
      // the world keeps the element's tint fading out (so the "reprint" is felt on return)
      gsap.to(tone, {
        alpha: 0,
        duration: 1.4,
        onComplete: () => {
          if (world && !world.destroyed) world.filters = prevFilters ?? [];
        },
      });
    };
    tl.call(finish, [], tEnd);
    root.on('pointertap', () => {
      if (tl.time() > 2) tl.timeScale(5);
    });
  });
}
