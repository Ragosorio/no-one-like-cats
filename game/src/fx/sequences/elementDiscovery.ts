/**
 * Storyboard (f) — new element discovered (T4, ~7.5 s, tap after 2 s = fast-forward):
 * sky darkens → a crack opens onto the element's dimension → "ELEMENTO DESCONOCIDO DETECTADO" →
 * impact frame and the world is reprinted in the element palette → giant poster "TIERRA" + badge →
 * resonance web with a "NUEVAS RESONANCIAS 0→N" counter → stamps → back to the world.
 */
import { CanvasTextMetrics, ColorMatrixFilter, Container, Graphics, Sprite, Text, TextStyle, TilingSprite } from 'pixi.js';
import { CRTFilter, GlitchFilter, RGBSplitFilter } from 'pixi-filters';
import gsap from 'gsap';
import { W, H, game } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { halftoneTexture, hatchTexture } from '../../art/textures';
import { catTexture, elementFx, loadCatTexture } from '../../art/catArt';
import { SilhouetteFilter } from '../filters';
import { sfx } from '../../core/audio';
import { music } from '../../core/music';
import { settings } from '../../core/settings';
import { Shaker, flash, sparkles } from '../juice';
import { CATS, ELEMENT_BY_ID, ELEMENTS } from '../../data/content';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementIcon } from '../../ui/elementIcon';
import { killTree } from '../../panels/campaign/common';
import { screenRect } from '../../ui/screen';

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
    const veil = screenRect(0x05060a);
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
    const dimBg = screenRect(main);
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
    const posterBg = screenRect(light);
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
    // (the multiverse elements of Parte 2 only join the web once known: no spoilers)
    const all = ELEMENTS.filter((e) => e.id !== el && (known.includes(e.id) || !/^(grieta|chapter)/.test(e.unlock)))
      .sort((a, b) => a.order - b.order)
      .map((e) => e.id);
    // the web sits a bit higher and flatter than the box center: the stamps live in their own strip below
    const center = { x: W / 2, y: H / 2 + 20 };
    const nodes: Container[] = [];
    const links = new Graphics();
    const ghostLinks = new Graphics();
    web.addChild(ghostLinks, links);
    // nodes at equal ARC LENGTH on the ellipse (equal angles crowd the left/right ends: labels overlapped)
    const spots = ellipseSpots(all.length, 600, 268);
    all.forEach((k, i) => {
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
      n.position.set(center.x + spots[i].x, center.y + spots[i].y);
      n.scale.set(0);
      (n as Container & { known?: boolean }).known = isKnown;
      // species that need BOTH elements: what this pair newly opens (highlighted one by one)
      const pairN = isKnown ? CATS.filter((c) => c.elements.includes(el) && c.elements.includes(k)).length : 0;
      if (pairN > 0) {
        const bdg = new Container();
        const bt = txt(`+${pairN}`, { fontFamily: F.poster, fontSize: 30, fill: dark });
        bt.anchor.set(0.5);
        bdg.addChild(new Graphics().circle(0, 0, 26).fill(accent).stroke({ width: 4, color: dark }), bt);
        bdg.position.set(48, -46);
        bdg.scale.set(0);
        n.addChild(bdg);
        (n as Container & { badge?: Container }).badge = bdg;
      }
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
      const bg = screenRect(light);
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
    // one connection at a time: a spark runs hub → element, the element flares, its +N pops, the counter
    // climbs; then energy keeps flowing along every link until the sequence ends
    const knownNodes = nodes.filter((n) => (n as Container & { known?: boolean }).known);
    const lit: Container[] = [];
    const spark = new Graphics().circle(0, 0, 14).fill(0xffffff).stroke({ width: 4, color: main });
    spark.visible = false;
    web.addChild(spark);
    const step = Math.min(0.22, 1.5 / Math.max(1, knownNodes.length));
    const drawLinks = (partial?: { n: Container; t: number }) => {
      links.clear();
      for (const n of lit) links.moveTo(center.x, center.y).lineTo(n.x, n.y);
      if (partial) links.moveTo(center.x, center.y).lineTo(center.x + (partial.n.x - center.x) * partial.t, center.y + (partial.n.y - center.y) * partial.t);
      links.stroke({ width: 8, color: main, alpha: 1 });
    };
    knownNodes.forEach((n, i) => {
      const t0 = 5.0 + i * step;
      const p = { t: 0 };
      tl.to(p, {
        t: 1,
        duration: step * 0.9,
        ease: 'power1.in',
        onStart: () => (spark.visible = true),
        onUpdate: () => {
          drawLinks({ n, t: p.t });
          spark.position.set(center.x + (n.x - center.x) * p.t, center.y + (n.y - center.y) * p.t);
        },
        onComplete: () => {
          lit.push(n);
          drawLinks();
          spark.visible = false;
          sfx('pop', 1 + (i / Math.max(1, knownNodes.length)) * 1.2);
          const ring = new Graphics().circle(0, 0, 60).stroke({ width: 8, color: accent });
          ring.position.copyFrom(n.position);
          web.addChild(ring);
          gsap.to(ring.scale, { x: 1.9, y: 1.9, duration: 0.45, ease: 'power2.out' });
          gsap.to(ring, { alpha: 0, duration: 0.45, onComplete: () => ring.destroy() });
          gsap.fromTo(n.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
          const bdg = (n as Container & { badge?: Container }).badge;
          if (bdg) gsap.to(bdg.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(4)' });
          const k = Math.round((o.resonances * (i + 1)) / knownNodes.length);
          counter.text = `NUEVAS RESONANCIAS: ${k}`;
          gsap.fromTo(counter.scale, { x: 1.08, y: 1.08 }, { x: 1, y: 1, duration: 0.2 });
        },
      }, t0);
    });
    const webDone = 5.0 + knownNodes.length * step + 0.05;
    tl.call(() => {
      counter.text = `NUEVAS RESONANCIAS: ${o.resonances}`;
      gsap.fromTo(counter.scale, { x: 1.2, y: 1.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
      sparkles(web, hub.x, hub.y, accent, 20, 260);
      // living web: pulses travel every link outward, the hub breathes
      if (!reduce) {
        const flow = new Graphics();
        web.addChildAt(flow, web.getChildIndex(links) + 1);
        let ft = 0;
        const flowTick = (_t: number, dt: number) => {
          if (flow.destroyed) return gsap.ticker.remove(flowTick);
          ft += dt / 1000;
          flow.clear();
          for (const n of lit) for (let q = 0; q < 3; q++) {
            const u = (ft * 0.7 + q / 3) % 1;
            flow.circle(center.x + (n.x - center.x) * u, center.y + (n.y - center.y) * u, 6 + 4 * Math.sin(u * Math.PI)).fill({ color: 0xffffff, alpha: 0.9 * Math.sin(u * Math.PI) });
          }
        };
        gsap.ticker.add(flowTick);
        gsap.to(hub.scale, { x: 1.06, y: 1.06, yoyo: true, repeat: -1, duration: 0.6, ease: 'sine.inOut' });
      }
    }, [], webDone);
    // 6600–7500: stamps
    // one layout for the whole strip (side by side when ALL fit the real screen, stacked otherwise)
    const stampW = o.stamps.map((s) => CanvasTextMetrics.measureText(s, new TextStyle({ fontFamily: F.poster, fontSize: 48, letterSpacing: 2 })).width + 48);
    const sv = game.view;
    const sideBySide = o.stamps.length > 1 && stampW.reduce((a, b) => a + b + 30, 0) <= sv.w - 80;
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
        // a strip at the bottom: side by side when they fit the real screen, stacked otherwise
        const n = o.stamps.length;
        if (c.width > sv.w - 80) c.scale.set((sv.w - 80) / c.width);
        if (sideBySide) {
          const total = stampW.reduce((a, b) => a + b + 30, -30);
          const x0 = W / 2 - total / 2 + stampW.slice(0, i).reduce((a, b) => a + b + 30, 0) + stampW[i] / 2;
          c.position.set(x0, H - 70);
        } else c.position.set(W / 2, H - 70 - (n - 1 - i) * 78);
        c.rotation = i % 2 ? 0.035 : -0.035;
        const sx = c.scale.x;
        stampLayer.addChild(c);
        gsap.from(c.scale, { x: sx * 2.4, y: sx * 2.4, duration: 0.16, ease: 'power3.in' });
        sfx('hit', 0.8 + i * 0.1);
        shaker.add(0.15);
      }, [], Math.max(6.6, webDone + 0.5) + i * 0.3);
    });
    const tEnd = Math.max(6.6, webDone + 0.5) + o.stamps.length * 0.3 + 1.2;
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

/** n points spread at equal arc length around an ellipse (rx, ry), starting at the top, clockwise */
function ellipseSpots(n: number, rx: number, ry: number) {
  const steps = 720;
  const pts: { x: number; y: number; d: number }[] = [];
  let d = 0;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const p = { x: Math.cos(a) * rx, y: Math.sin(a) * ry, d: 0 };
    if (i) d += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    p.d = d;
    pts.push(p);
  }
  const out: { x: number; y: number }[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / Math.max(1, n)) * d;
    const p = pts.find((q) => q.d >= target) ?? pts[0];
    out.push({ x: p.x, y: p.y });
  }
  return out;
}
