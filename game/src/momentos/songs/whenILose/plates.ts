/**
 * WHEN I LOSE — PLATES: full-frame pages of the Archive's memory (the panels layer, under its own ink filter). Each
 * plate turns in like a page (a fold sweeps right → left, the back of the page curls), holds while it tells its little
 * scene, and turns away. `style` 0 = sumi-e, 1 = illuminated, or a front {x, y, r} that splits the page between both.
 *
 *   portrait   a close-up miniature inside an ensō           writer    a scribe by candle in endless shelves
 *   duel       an old duel at sea under an ink moon          bow       the loser bows, the victor bows back
 *   archive    the Archive in its glory: shelves to a door   choir     the voices: rows of singing silhouettes
 *   split      him in ink | us in gold, face to face         manuscript  the last page: the duel as a miniature
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Args } from '../../types';
import { clip, W, H, type Kit, type VerbFn } from '../../anime/kit';
import { rng, vnoise } from '../../anime/draw';
import { ease } from '../../score';
import type { WilStage, Who } from './stage';
import { C, Galleon, Sloop, bookcase } from './set';
import { LOOK } from './ink';
import { FRAKTUR } from './verbs';

const S = (k: Kit) => k.stage as unknown as WilStage;
const num = (a: Args, key: string, d: number) => (typeof a[key] === 'number' ? (a[key] as number) : d);
const str = (a: Args, key: string, d: string) => (typeof a[key] === 'string' ? (a[key] as string) : d);
const INK = LOOK.ink;

interface Built {
  root: Container;
  /** per-frame animation of the plate's own life (lt in s, d = its length) */
  tick?: (lt: number, d: number) => void;
}

function still(k: Kit, who: string, h: number, flip = false): Sprite | null {
  const s = S(k);
  const slug = (s.slugs as Record<string, string>)[who] || who;
  const sp = s.studio.still(slug, 0.5, 0.97);
  if (!sp) return null;
  const [, ph] = s.studio.size(slug);
  sp.scale.set(((flip ? -1 : 1) * h) / ph, h / ph);
  return sp;
}

function ensoG(g: Graphics, cx: number, cy: number, r: number, seed: number, color = INK, w = 46) {
  const start = seed * 1.7;
  for (let i = 0; i < 90; i++) {
    const u = i / 90;
    const an = start + Math.PI * 1.86 * u;
    const ww = w * Math.sin(Math.min(1, u * 1.25) * Math.PI) * (0.6 + 0.4 * vnoise(u * 9, seed)) + 6;
    g.circle(cx + Math.cos(an) * r, cy + Math.sin(an) * r, ww / 2).fill(color);
  }
}

function paperBg(g: Graphics, v: Kit['view'], color: number = C.parchment) {
  g.rect(v.x - 40, v.y - 40, v.w + 80, v.h + 80).fill(color);
}

const BUILD: Record<string, (k: Kit, a: Args) => Built> = {
  portrait(k, a) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view);
    // a wash of lapis behind (becomes a grey wash in sumi), the ensō
    g.circle(W / 2 + 40, H / 2 - 20, 420).fill(C.lapis);
    ensoG(g, W / 2 + 40, H / 2 - 20, 430, 3);
    root.addChild(g);
    const who = str(a, 'who', 'biblio');
    const sp = still(k, who, num(a, 'h', 1100), !!a.flip);
    if (sp) {
      sp.position.set(W / 2 + num(a, 'dx', 0), H + 260);
      root.addChild(sp);
    }
    return {
      root,
      tick: (lt, d) => {
        root.scale.set(1 + 0.05 * (lt / d));
        root.pivot.set(W / 2, H / 2);
        root.position.set(W / 2, H / 2);
      },
    };
  },
  writer(k) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view, C.umberDeep);
    // two walls of shelves converge to the dark
    for (let i = 0; i < 6; i++) {
      const s = 1 - i * 0.14;
      bookcase(g, 40 + i * 120, 980 - i * 40, 300 * s, 900 * s, 300 + i, s * 0.8, { top: false });
      bookcase(g, W - 340 - i * 120, 980 - i * 40, 300 * s, 900 * s, 320 + i, s * 0.8, { top: false });
    }
    // the desk and the candle
    g.rect(560, 760, 800, 40).fill(C.wood).rect(600, 800, 30, 280).fill(C.woodDark).rect(1290, 800, 30, 280).fill(C.woodDark);
    g.poly([700, 760, 1180, 760, 1150, 700, 730, 700]).fill(C.parchment);
    g.rect(1220, 650, 26, 110).fill(C.parchment);
    root.addChild(g);
    const cat = still(k, 'archivista', 560);
    if (cat) {
      cat.position.set(820, 830);
      root.addChild(cat);
    }
    const ink = new Graphics();
    const flame = new Graphics();
    root.addChild(ink, flame);
    return {
      root,
      tick: (lt) => {
        // the quill writes: lines appear one by one
        ink.clear();
        const n = Math.min(6, lt * 2.4);
        for (let i = 0; i < Math.ceil(n); i++) {
          const L = i < Math.floor(n) ? 1 : n - Math.floor(n);
          ink.moveTo(760, 712 + i * 9).lineTo(760 + 360 * L, 712 + i * 9 + Math.sin(i) * 2).stroke({ width: 3, color: INK });
        }
        const f = 1 + 0.12 * Math.sin(lt * 21) + 0.06 * Math.sin(lt * 37);
        flame.clear().ellipse(1233, 628, 14 * f, 30 * f).fill(C.candle).ellipse(1233, 636, 7, 14).fill(0xfff6d8);
        flame.circle(1233, 630, 120 * f).fill({ color: 0xffd27a, alpha: 0.12 });
      },
    };
  },
  duel(k) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view, 0x1b2a52);
    // the moon (an ensō with a pale disc), low behind his ship: the galleon is a silhouette on it
    g.circle(930, 330, 220).fill(0xf3ead2);
    ensoG(g, 930, 330, 232, 7, 0x5a4a3a, 26);
    // the sea: long ink swells, the moon's road broken on them
    for (let i = 0; i < 7; i++) g.rect(k.view.x - 40, 700 + i * 60, k.view.w + 80, 60).fill(i % 2 ? 0x16244a : 0x1f3366);
    for (let i = 0; i < 9; i++) {
      const w = 260 - i * 22;
      g.rect(930 - w / 2 + ((i * 53) % 40) - 20, 716 + i * 38, w, 7).fill({ color: 0xf3ead2, alpha: 0.85 - i * 0.07 });
    }
    // a thin ink cloud across the moon
    g.ellipse(840, 250, 200, 20).fill({ color: INK, alpha: 0.75 });
    g.ellipse(1040, 392, 140, 13).fill({ color: INK, alpha: 0.6 });
    root.addChild(g);
    const a = new Sloop();
    const b = new Galleon();
    a.scale.set(0.6);
    b.scale.set(0.6);
    a.position.set(460, 760);
    b.position.set(1400, 760);
    root.addChild(a, b);
    const fx = new Graphics();
    root.addChild(fx);
    return {
      root,
      tick: (lt) => {
        a.rotation = Math.sin(lt * 1.3) * 0.03;
        b.rotation = Math.sin(lt * 1.1 + 1) * 0.03;
        a.y = 760 + Math.sin(lt * 1.3) * 6;
        b.y = 760 + Math.sin(lt * 1.1 + 1) * 6;
        root.position.x = -lt * 14;
        // two shots cross in the dark
        fx.clear();
        const u = (lt % 1.7) / 1.7;
        fx.circle(720 + 440 * u, 520 - Math.sin(u * Math.PI) * 200, 12).fill(C.goldLight);
        fx.circle(1120 - 440 * u, 540 - Math.sin(u * Math.PI) * 170, 12).fill(INK);
      },
    };
  },
  bow(k, a) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view);
    g.rect(k.view.x - 40, 820, k.view.w + 80, 300).fill(C.parchShade);
    // between them, a sinking ship far away (the duel is over)
    const far = new Galleon();
    far.scale.set(0.25);
    far.position.set(960, 830);
    far.rotation = 0.35;
    root.addChild(g, far);
    const L = still(k, str(a, 'left', 'tintero'), 520);
    const R = still(k, str(a, 'right', 'archivista'), 560, true);
    if (L) {
      L.position.set(560, 980);
      root.addChild(L);
    }
    if (R) {
      R.position.set(1360, 980);
      root.addChild(R);
    }
    return {
      root,
      tick: (lt, d) => {
        // the loser bows first, the victor answers half a beat later
        const x1 = ease('inOut', Math.max(0, Math.min(1, (lt - d * 0.2) / 0.9)));
        const x2 = ease('inOut', Math.max(0, Math.min(1, (lt - d * 0.2 - 0.5) / 0.9)));
        if (L) L.rotation = 0.38 * x1;
        if (R) R.rotation = -0.38 * x2;
        far.y = 830 + lt * 18;
        far.alpha = Math.max(0, 1 - lt / d);
      },
    };
  },
  archive(k) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view, C.umberDeep);
    // the door at the end: gold light
    g.rect(880, 260, 160, 420).fill(C.goldLight);
    g.circle(960, 260, 80).fill(C.goldLight);
    // endless shelves, two converging walls, gilded
    for (let i = 0; i < 9; i++) {
      const s = 1 - i * 0.1;
      const w = 220 * s;
      const h = 1000 * s;
      const y = 1080 - i * 40;
      bookcase(g, 860 - (9 - i) * 95 - w, y, w, h, 400 + i, s * 0.7, { top: false });
      bookcase(g, 1060 + (9 - i) * 95, y, w, h, 420 + i, s * 0.7, { top: false });
    }
    // a lapis floor with a gold runner to the door
    g.poly([0, 1080, W, 1080, 1040, 680, 880, 680]).fill(C.lapis);
    g.poly([760, 1080, 1160, 1080, 990, 680, 930, 680]).fill(C.gold);
    root.addChild(g);
    const books = new Graphics();
    root.addChild(books);
    return {
      root,
      tick: (lt) => {
        books.clear();
        for (let i = 0; i < 8; i++) {
          const R = rng(700 + i);
          const x = 300 + R() * 1300;
          const y = 900 - ((lt * (40 + R() * 40) + R() * 700) % 700);
          books.rect(x - 22, y - 30, 44, 60).fill([C.vermilion, C.malachite, C.lapis, C.ochre][i % 4]).rect(x - 22, y - 30, 44, 8).fill(C.gold);
        }
        root.scale.set(1 + lt * 0.02);
        root.pivot.set(W / 2, H / 2);
        root.position.set(W / 2, H / 2);
      },
    };
  },
  choir(k) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view, C.lapisDeep);
    // gold rays from the top
    for (let i = 0; i < 9; i++) g.poly([960, -100, 700 + i * 70, 1200, 740 + i * 70, 1200]).fill({ color: C.gold, alpha: 0.25 });
    root.addChild(g);
    // the singers: the paintings themselves (illuminated miniatures), each on a gold nimbus; the back row in shadow
    const halos = new Graphics();
    root.addChild(halos);
    const cats: { sp: Sprite; hx: number; hy: number; r: number }[] = [];
    const slugs = ['lantern_spirit_cat', 'archivista_scholar_cat', 'arcanito_lantern_cat', 'aurea_halo_cat', 'astral_tarot_cat', 'marcapaginas_bookmark_cat'];
    let i = 0;
    for (const row of [0, 1]) {
      for (let j = 0; j < 5; j++) {
        const slug = slugs[(i++ * 7 + row) % slugs.length];
        const sp = S(k).stillAny(slug);
        if (!sp) continue;
        const [, ph] = S(k).sizeAny(slug);
        const h = row ? 400 : 300;
        sp.scale.set(((j + row) % 2 ? -1 : 1) * (h / ph), h / ph);
        const x = 230 + j * 360 + row * 120 - (row ? 60 : 0);
        const y = row ? 1080 : 720;
        sp.position.set(x, y);
        if (!row) sp.tint = 0xb8a890;
        cats.push({ sp, hx: x, hy: y - h * 0.72, r: h * 0.3 });
      }
    }
    // back row first, then the front row over it
    for (const c of cats) root.addChild(c.sp);
    return {
      root,
      tick: (lt) => {
        const vox = k.env('vox', k.m, 0.3, 0.3);
        halos.clear();
        cats.forEach((c, n) => {
          const r = c.r * (1 + 0.12 * vox) + Math.sin(lt * 2 + n) * 3;
          halos.circle(c.hx, c.hy, r).fill({ color: C.gold, alpha: 0.9 });
          halos.circle(c.hx, c.hy, r * 0.82).stroke({ width: 6, color: C.goldLight });
        });
      },
    };
  },
  split(k) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view);
    g.circle(520, 520, 400).fill(C.umber);
    g.circle(1400, 520, 400).fill(C.vermilion);
    root.addChild(g);
    const L = still(k, 'biblio', 980, true);
    const R = still(k, 'canelo', 900);
    if (L) {
      L.position.set(560, 1300);
      root.addChild(L);
    }
    if (R) {
      R.position.set(1380, 1260);
      root.addChild(R);
    }
    return {
      root,
      tick: (lt) => {
        if (L) L.x = 560 + lt * 10;
        if (R) R.x = 1380 - lt * 10;
      },
    };
  },
  manuscript(k) {
    const root = new Container();
    const g = new Graphics();
    paperBg(g, k.view);
    // the border: lapis and vermilion bands, gold corners, vines
    g.rect(120, 60, 1680, 960).stroke({ width: 30, color: C.lapis });
    g.rect(150, 90, 1620, 900).stroke({ width: 8, color: C.vermilion });
    for (const [x, y] of [
      [120, 60],
      [1800, 60],
      [120, 1020],
      [1800, 1020],
    ])
      g.circle(x, y, 54).fill(C.gold).circle(x, y, 26).fill(C.vermilion);
    for (let i = 0; i < 26; i++) {
      const x = 200 + i * 60;
      g.circle(x, 75 + Math.sin(i) * 6, 9).fill(C.malachite).circle(x, 1005 + Math.cos(i) * 6, 9).fill(C.malachite);
    }
    // the miniature: the two ships on lapis under a gold sky
    g.rect(560, 180, 1100, 560).fill(C.gold);
    g.rect(560, 560, 1100, 180).fill(C.lapis);
    g.rect(560, 180, 1100, 560).stroke({ width: 10, color: C.umber });
    // the drop cap
    g.rect(220, 180, 300, 300).fill(C.lapis).rect(240, 200, 260, 260).stroke({ width: 8, color: C.gold });
    // text lines
    for (let i = 0; i < 8; i++) g.rect(220, 520 + i * 54, 300, 10).fill({ color: C.umber, alpha: 0.6 });
    for (let i = 0; i < 3; i++) g.rect(560, 790 + i * 54, 1100 - i * 120, 10).fill({ color: C.umber, alpha: 0.6 });
    root.addChild(g);
    const cap = k.text.sprite('C', FRAKTUR(250, C.goldLight, 0x3a2410));
    cap.position.set(370, 330);
    root.addChild(cap);
    const a = new Sloop();
    const b = new Galleon();
    a.scale.set(0.4);
    b.scale.set(0.4);
    a.position.set(840, 600);
    b.position.set(1380, 600);
    root.addChild(a, b);
    return {
      root,
      tick: (lt) => {
        a.rotation = Math.sin(lt * 1.2) * 0.02;
        b.rotation = Math.sin(lt * 1.2 + 1) * 0.02;
      },
    };
  },
};

/**
 * A PLATE: turns in (fold right → left, `turnIn` s), lives, turns out (or cuts when `cut`). style: 0 ink · 1 gold ·
 * 'split' (him ink | us gold) · or numbers per side with args.front = [x, y, r].
 */
const plate: VerbFn = (k, a, cue) => {
  const d = typeof a.beats === 'number' ? (a.beats as number) * k.beat : num(a, 'dur', 3);
  const kind = str(a, 'kind', 'portrait');
  const tin = num(a, 'turnIn', 0.55);
  const tout = a.cut ? 0 : num(a, 'turnOut', 0.5);
  let c: Container | null = null;
  let b: Built | null = null;
  let mask: Graphics | null = null;
  let back: Graphics | null = null;
  // built and drawn once BEFORE the clock (a plate is hundreds of shapes: tessellating them on the frame it turns in
  // cost a visible hitch); a later re-mount (scrub, seek back) builds again
  let pre: Built | null = null;
  if (cue.id >= 0) {
    try {
      pre = (BUILD[kind] ?? BUILD.portrait)(k, a);
      S(k).prewarmDraw(pre.root);
      S(k).prebuilt.add(pre.root);
    } catch {
      pre = null;
    }
  }
  return clip(cue.m, d, {
    mount: () => {
      c = new Container();
      c.zIndex = 1;
      b = pre ?? (BUILD[kind] ?? BUILD.portrait)(k, a);
      if (pre) S(k).prebuilt.delete(pre.root);
      pre = null;
      mask = new Graphics();
      back = new Graphics();
      b.root.mask = mask;
      c.addChild(b.root, mask, back);
      k.layers.panels.addChild(c);
    },
    update: (lt) => {
      if (!c || !b || !mask || !back) return;
      const v = k.view;
      b.tick?.(lt, d);
      const uin = tin > 0 ? ease('inOut', Math.min(1, lt / tin)) : 1;
      const uout = tout > 0 ? ease('inOut', Math.max(0, Math.min(1, (lt - (d - tout)) / tout))) : 0;
      // in: the plate is revealed from the right edge; out: it shrinks away to the left
      const left = v.x + v.w * (1 - uin);
      const right = v.x + v.w * (1 - uout);
      mask.clear().rect(left, v.y, Math.max(0, right - left), v.h).fill(0xffffff);
      back.clear();
      const fold = uin < 1 ? left : uout > 0 ? right : -1;
      if (fold >= 0) {
        const bw = 160 * Math.sin((uin < 1 ? uin : uout) * Math.PI);
        if (uin < 1) back.poly([fold, v.y, fold + bw, v.y + 24, fold + bw, v.y + v.h - 24, fold, v.y + v.h]).fill(C.parchShade);
        else back.poly([fold, v.y, fold - bw, v.y + 24, fold - bw, v.y + v.h - 24, fold, v.y + v.h]).fill(C.parchShade);
        back.rect(fold - 5, v.y, 10, v.h).fill({ color: INK, alpha: 0.3 });
      }
      if (uin >= 1 && uout <= 0) k.fullFrame = true;
      // the art of this page
      const st = a.style;
      const s = S(k);
      if (st === 'split') s.plateStyle = { in: 1, out: 0, front: [W * 1.62, H / 2, W * 0.88], blank: 0 };
      else if (Array.isArray(a.front)) s.plateStyle = { in: num(a, 'in', 1), out: num(a, 'out', 0), front: a.front as [number, number, number], blank: 0 };
      else s.plateStyle = { in: 0, out: typeof st === 'number' ? st : 0, front: [W / 2, H / 2, -1], blank: num(a, 'blank', 0) };
    },
    unmount: () => {
      c?.destroy({ children: true });
      c = b = mask = back = null;
    },
  });
};

export const PLATE_VERBS: Record<string, VerbFn> = { plate };
