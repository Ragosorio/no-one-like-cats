/**
 * CatCard — reusable trading card: portrait + rarity print frame (research/07 §3.16).
 * States follow the Catdex: unknown (sealed) · silhouette (???) · rumor · registered.
 * Usable anywhere (Catdex, Santuario, Altar, isla, campaña).
 *
 *   const card = new CatCard('r_pimenton', { w: 180, h: 240, stars: 2, level: 7 });
 */
import { Container, Graphics, Sprite, Text, Ticker, TilingSprite } from 'pixi.js';
import { C, F, RARITY } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { catDef } from '../../data/content';
import { dexStatus, DexStatus } from '../../state/sys/cats';
import { elColor, elEmoji, printRarity, PrintRarity } from '../../state/ext/collection';
import { cardFace, cardLayout, CardLayout, noiseTile, rainbowTile, sheenTexture, PrintStyle } from './printTextures';
import { portrait, variantSprite } from './art';

export interface CatCardOpts {
  w?: number;
  h?: number;
  /** override catdex status (default: live dexStatus) */
  status?: DexStatus;
  /** owned stars (shows ★ row) */
  stars?: number;
  level?: number;
  /** animated foil/holo/noise (default true) */
  live?: boolean;
  /** use the full-res painting (big detail cards) */
  hires?: boolean;
  /** show "RUMOR"/"NUEVO" style ribbon text */
  ribbon?: string;
  serial?: number;
}

const live = new Set<CatCard>();
let tickerOn = false;
let clock = 0;
function ensureTicker() {
  if (tickerOn) return;
  tickerOn = true;
  Ticker.shared.add((t) => {
    clock += t.deltaMS / 1000;
    for (const c of live) c.animate(clock);
  });
}

export function rarityName(r: PrintRarity) {
  return RARITY[r].name;
}
export function rarityColor(r: PrintRarity) {
  return RARITY[r].color;
}

/** fit a Text into maxW by shrinking */
export function fitText(t: Text, maxW: number) {
  if (t.width > maxW) t.scale.set(maxW / t.width);
}

export class CatCard extends Container {
  readonly cw: number;
  readonly ch: number;
  readonly L: CardLayout;
  readonly status: DexStatus;
  readonly rarity: PrintRarity;
  readonly style: PrintStyle;
  readonly art = new Container();
  private fx = new Container();
  private sheen?: Sprite;
  private holo?: TilingSprite;
  private noise?: TilingSprite;
  private glitchBars?: Graphics;
  private portraitNode?: Container;
  private phase = Math.random() * 10;
  private lastStep = -1;

  constructor(
    public readonly species: string,
    o: CatCardOpts = {},
  ) {
    super();
    const w = (this.cw = o.w ?? 180);
    const h = (this.ch = o.h ?? 240);
    const def = catDef(species);
    this.status = o.status ?? dexStatus(species);
    this.rarity = printRarity(species);
    const L = (this.L = cardLayout(w, h));
    const known = this.status === 'registered' || this.status === 'rumor';
    const accent = elColor(def.elements[0]);
    this.style = this.status === 'unknown' ? (def.secret ? 'backSecret' : 'back') : known ? this.rarity : 'neutral';
    const dark = this.style === 'legendary' || this.style === 'mythic' || this.style === 'primordial';

    // shadow block
    const sh = new Graphics().rect(Math.max(4, w * 0.035), Math.max(4, w * 0.035), w, h).fill({ color: C.ink, alpha: 0.9 });
    const face = new Sprite(cardFace(this.style, w, h, accent));
    face.width = w;
    face.height = h;
    this.addChild(sh, face);

    if (this.status === 'unknown') {
      this.buildBack(def.secret);
      return;
    }

    // ---- portrait window
    const winMask = new Graphics().rect(L.win.x, L.win.y, L.win.w, L.win.h).fill(0xffffff);
    this.art.mask = winMask;
    this.addChild(this.art, winMask);
    const size = L.win.w * 1.04;
    const cx = L.win.x + L.win.w / 2;
    const cy = L.win.y + L.win.h * 0.54;
    let node: Container;
    if (this.status === 'registered') {
      if (o.hires) {
        const v = variantSprite(species, size);
        node = v.root;
      } else node = portrait(species, size, 'color');
    } else {
      node = portrait(species, size, dark ? 'ghost' : 'sil');
      if (dark) node.alpha = 0.8;
    }
    node.position.set(cx, cy);
    this.art.addChild(node);
    this.portraitNode = node;

    // element badges (top-left of the window)
    const r = Math.max(9, Math.round(w * 0.075));
    def.elements.forEach((el, i) => {
      const bx = L.win.x + r + 4 + i * (r * 2 + 3);
      const by = L.win.y + r + 4;
      const g = new Graphics().circle(bx, by, r).fill(elColor(el)).stroke({ width: Math.max(2, r * 0.18), color: C.ink });
      const em = txt(elEmoji(el), { fontSize: r * 1.15 });
      em.anchor.set(0.5);
      em.position.set(bx, by + 1);
      this.addChild(g, em);
    });

    // stars (top-right) — progress, never rarity
    if (o.stars && this.status === 'registered') {
      const ss = Math.max(7, Math.round(w * 0.05));
      for (let i = 0; i < o.stars; i++) {
        const g = new Graphics()
          .star(L.win.x + L.win.w - ss - 3 - i * (ss * 1.9), L.win.y + ss + 5, 5, ss, ss * 0.45)
          .fill(C.yellow)
          .stroke({ width: Math.max(1.5, ss * 0.22), color: C.ink });
        this.addChild(g);
      }
    }
    if (o.level && this.status === 'registered') {
      const lt = txt(`Nv ${o.level}`, { fontFamily: F.ui, fontWeight: '700', fontSize: Math.max(11, w * 0.075), fill: C.paper });
      const pad = 4;
      const bg = new Graphics().rect(0, 0, lt.width + pad * 2, lt.height + 1).fill(C.ink);
      const lc = new Container();
      lc.addChild(bg, lt);
      lt.position.set(pad, 0);
      lc.position.set(L.win.x + L.win.w - lc.width - 3, L.win.y + L.win.h - lc.height - 3);
      this.addChild(lc);
    }

    // ---- plate: name + rarity
    const nameColor = dark ? (this.style === 'primordial' ? accent : this.style === 'legendary' ? 0xffd77a : C.white) : C.ink;
    const name = known ? def.name.toUpperCase() : '???';
    const nt = txt(name, { fontFamily: F.poster, fontSize: Math.round(L.plate.h * 0.46), fill: nameColor, letterSpacing: 0.5 });
    nt.anchor.set(0.5, 0);
    fitText(nt, L.plate.w - 8);
    nt.position.set(w / 2, L.plate.y + L.plate.h * 0.1);
    this.addChild(nt);
    const rl = known ? rarityName(this.rarity) : def.elements.map((e) => elEmoji(e)).join(' ') + '  ¿?';
    const rt = txt(known ? rl : 'SIN REGISTRO', {
      fontFamily: F.ui,
      fontWeight: '700',
      fontSize: Math.max(10, Math.round(L.plate.h * 0.2)),
      fill: known ? (dark ? (this.style === 'primordial' ? accent : C.paper) : rarityColor(this.rarity) === C.ink ? C.ink : rarityColor(this.rarity)) : 0x6d6356,
      letterSpacing: 2,
    });
    rt.anchor.set(0.5, 0);
    rt.position.set(w / 2, L.plate.y + L.plate.h * 0.64);
    fitText(rt, L.plate.w - 6);
    this.addChild(rt);

    if (this.status === 'silhouette') {
      const q = txt('?', { fontFamily: F.poster, fontSize: L.win.h * 0.5, fill: C.paper, stroke: { color: C.ink, width: 6 } });
      q.anchor.set(0.5);
      q.position.set(cx + L.win.w * 0.28, cy + L.win.h * 0.12);
      q.rotation = 0.12;
      this.addChild(q);
    }
    if (o.ribbon || this.status === 'rumor') this.addRibbon(o.ribbon ?? 'RUMOR');

    this.addChild(this.fx);
    if (o.live !== false && known) this.buildLive(accent);
  }

  private buildBack(secret: boolean) {
    const { cw: w, ch: h } = this;
    const q = txt(secret ? '???' : '?', {
      fontFamily: secret ? F.glitch : F.poster,
      fontSize: secret ? w * 0.26 : w * 0.42,
      fill: C.paper,
      stroke: { color: C.ink, width: Math.max(3, w * 0.03) },
    });
    q.anchor.set(0.5);
    q.position.set(w / 2, h * 0.46);
    const t = txt(secret ? 'SECRETO' : 'SIN DESCUBRIR', { fontFamily: F.ui, fontWeight: '700', fontSize: Math.max(9, w * 0.065), fill: C.paper, letterSpacing: 3 });
    t.anchor.set(0.5);
    t.position.set(w / 2, h * 0.84);
    fitText(t, w - 16);
    const brand = txt('NO ONE LIKE CATS', { fontFamily: F.poster, fontSize: Math.max(8, w * 0.06), fill: secret ? C.violet : C.pink, letterSpacing: 1 });
    brand.anchor.set(0.5);
    brand.position.set(w / 2, h * 0.12);
    fitText(brand, w - 20);
    this.addChild(q, t, brand);
    if (secret) {
      // seal
      const seal = new Graphics().circle(w * 0.78, h * 0.72, w * 0.1).fill(C.red).stroke({ width: 2, color: C.ink });
      seal.star(w * 0.78, h * 0.72, 6, w * 0.06, w * 0.03).fill(0x8a0c22);
      this.addChild(seal);
    }
  }

  private addRibbon(text: string) {
    const { cw: w, L } = this;
    const c = new Container();
    const t = txt(text, { fontFamily: F.poster, fontSize: Math.max(10, w * 0.08), fill: C.paper, letterSpacing: 1 });
    const bg = new Graphics().rect(-t.width / 2 - 8, -2, t.width + 16, t.height + 2).fill(C.red).stroke({ width: 2, color: C.ink });
    t.anchor.set(0.5, 0);
    c.addChild(bg, t);
    c.position.set(L.win.x + L.win.w - t.width / 2 - 8, L.win.y + L.win.h - t.height - 6);
    c.rotation = -0.08;
    this.addChild(c);
  }

  private buildLive(accent: number) {
    const { cw: w, ch: h } = this;
    const mask = new Graphics().rect(0, 0, w, h).fill(0xffffff);
    if (this.style === 'legendary') {
      const s = new Sprite(sheenTexture());
      s.anchor.set(0.5);
      s.width = w * 0.6;
      s.height = h * 2.2;
      s.rotation = 0.5;
      s.blendMode = 'add';
      s.alpha = 0.75;
      this.fx.addChild(s);
      this.addChild(mask);
      this.fx.mask = mask;
      this.sheen = s;
    } else if (this.style === 'mythic') {
      const ringMask = new Graphics()
        .rect(0, 0, w, h)
        .fill(0xffffff)
        .rect(this.L.b, this.L.b, w - this.L.b * 2, h - this.L.b * 2)
        .cut();
      const holo = new TilingSprite({ texture: rainbowTile(), width: w, height: h });
      holo.alpha = 0.85;
      holo.tileScale.set(Math.max(1, w / 180), 1);
      holo.mask = ringMask;
      this.fx.addChild(holo, ringMask);
      this.holo = holo;
      const bars = new Graphics();
      bars.visible = false;
      this.fx.addChild(bars);
      this.glitchBars = bars;
      const s = new Sprite(sheenTexture());
      s.anchor.set(0.5);
      s.width = w * 0.5;
      s.height = h * 2.2;
      s.rotation = -0.6;
      s.blendMode = 'add';
      s.alpha = 0.5;
      s.tint = 0x9ff7ff;
      this.fx.addChild(s);
      this.addChild(mask);
      this.fx.mask = mask;
      this.sheen = s;
    } else if (this.style === 'primordial') {
      const n = new TilingSprite({ texture: noiseTile(), width: w, height: h });
      n.alpha = 0.16;
      n.tint = accent;
      n.blendMode = 'add';
      this.fx.addChild(n);
      this.noise = n;
    } else if (this.style === 'epic') {
      const s = new Sprite(sheenTexture());
      s.anchor.set(0.5);
      s.width = w * 0.35;
      s.height = h * 2.2;
      s.rotation = 0.5;
      s.blendMode = 'add';
      s.alpha = 0.35;
      s.tint = 0xffb3d6;
      this.fx.addChild(s);
      this.addChild(mask);
      this.fx.mask = mask;
      this.sheen = s;
    } else return;
    live.add(this);
    ensureTicker();
  }

  /** called by the shared ticker */
  animate(t: number) {
    if (this.destroyed) return;
    const { cw: w, ch: h } = this;
    const tt = t + this.phase;
    if (this.sheen) {
      const period = this.style === 'mythic' ? 2.2 : 3.2;
      const k = (tt % period) / period;
      this.sheen.x = -w * 0.6 + k * w * 2.2;
      this.sheen.y = h / 2;
    }
    if (this.holo) this.holo.tilePosition.x = tt * 60;
    // on twos (12 fps) for the noisy stuff
    const step = Math.floor(tt * 12);
    if (step === this.lastStep) return;
    this.lastStep = step;
    if (this.noise) {
      this.noise.tilePosition.set(Math.random() * 128, Math.random() * 128);
      this.noise.alpha = 0.12 + Math.random() * 0.1;
    }
    if (this.glitchBars && this.portraitNode) {
      const glitch = tt % 3.1 < 0.18;
      this.glitchBars.visible = glitch;
      if (glitch) {
        const g = this.glitchBars.clear();
        for (let i = 0; i < 3; i++) {
          const y = this.L.win.y + Math.random() * this.L.win.h;
          g.rect(this.L.win.x, y, this.L.win.w, 2 + Math.random() * 6).fill({ color: i % 2 ? C.cyan : C.pinkHot, alpha: 0.6 });
        }
        this.portraitNode.x = this.L.win.x + this.L.win.w / 2 + (Math.random() - 0.5) * 8;
      } else this.portraitNode.x = this.L.win.x + this.L.win.w / 2;
    }
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    live.delete(this);
    super.destroy(options ?? { children: true });
  }
}

/** call (await) once before building cards outside the collection panels */
export { ensureCatArt } from './art';
