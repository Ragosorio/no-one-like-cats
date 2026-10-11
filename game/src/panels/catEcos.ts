/**
 * Parte II · Oleada 4 · H59 «Ecos de Vida» on the cat's sheet (state in state/sys/ecos.ts).
 *
 *   EcosSection   the ECOS section of the sheet (CatPanel › tab ECOS): the cat's other life, DESPIERTA / RECORDAR /
 *                 VER ECO. Style «TINTA Y PAPEL MOJADO»: the Eco settles on the page like a color that soaks in.
 *   EcoFrameLook  how an awake Eco shows on the sheet's portrait: an ink-and-wet-paper wash behind the cat and the
 *                 keepsake it brought back (a hat, sand from another beach, a scar…). Cosmetic only.
 *   drawKeepsake  the keepsakes, drawn in vector (no raster, ever).
 *
 * Every animation folds to its end state with «reducir movimiento».
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { Button, poster, txt } from '../ui/widgets';
import { fitLine } from '../ui/fit';
import { toast } from '../ui/modal';
import { settings } from '../core/settings';
import { sparkles } from '../fx/juice';
import { audioApi } from '../audio/api';
import { G } from '../state/game';
import { CAT_BY_ID } from '../data/content';
import { checkMissions } from '../state/sys/missions';
import {
  ECO_NIGHTS,
  ecoOf,
  ecoShown,
  ecoStatus,
  ecosReady,
  nightsHome,
  rememberEco,
  setEcoShown,
  wakeEco,
  type EcoDef,
  type Keepsake,
} from '../state/sys/ecos';

const rm = () => !!settings.reduceMotion;

/** seeded 0..1 (mulberry32): the same cat gets the same stains every time */
function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedOf(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}
const lighten = (c: number, k: number) => {
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const f = (x: number) => Math.round(x + (255 - x) * k);
  return (f(r) << 16) | (f(g) << 8) | f(b);
};

// ------------------------------------------------------------------ keepsakes
/** a keepsake centered on (0,0), about `s` px tall, in the Eco's color with an ink line */
export function drawKeepsake(kind: Keepsake, s: number, color: number): Graphics {
  const g = new Graphics();
  const ink = { width: Math.max(2, s / 26), color: C.ink, join: 'round' as const, cap: 'round' as const };
  const light = lighten(color, 0.45);
  const u = s / 100;
  switch (kind) {
    case 'sombrero':
      g.ellipse(0, 18 * u, 50 * u, 13 * u).fill(color).stroke(ink);
      g.poly([-34 * u, 14 * u, -26 * u, -26 * u, 0, -40 * u, 26 * u, -26 * u, 34 * u, 14 * u]).fill(color).stroke(ink);
      g.rect(-30 * u, 2 * u, 60 * u, 8 * u).fill(light).stroke(ink);
      g.circle(0, -14 * u, 7 * u).fill(C.paper).stroke(ink);
      break;
    case 'arena':
      g.ellipse(0, 22 * u, 48 * u, 22 * u).fill(color).stroke(ink);
      for (let i = 0; i < 14; i++) g.circle(((i * 37) % 80) * u - 40 * u, 14 * u + ((i * 13) % 22) * u, 2.2 * u).fill(C.ink);
      g.poly([10 * u, 0, 22 * u, -18 * u, 34 * u, 0]).fill(light).stroke(ink);
      break;
    case 'cicatriz':
      g.moveTo(-40 * u, 20 * u).quadraticCurveTo(0, -30 * u, 40 * u, -14 * u).stroke({ ...ink, width: 7 * u, color });
      g.moveTo(-40 * u, 20 * u).quadraticCurveTo(0, -30 * u, 40 * u, -14 * u).stroke({ ...ink, width: 2 * u });
      for (const k of [-0.6, -0.2, 0.2, 0.6]) {
        const x = k * 40 * u;
        const y = -6 * u - (1 - k * k) * 14 * u + k * 14 * u * 0.5;
        g.moveTo(x - 6 * u, y - 10 * u).lineTo(x + 6 * u, y + 10 * u).stroke(ink);
      }
      break;
    case 'bufanda':
      g.roundRect(-44 * u, -24 * u, 88 * u, 22 * u, 10 * u).fill(color).stroke(ink);
      g.poly([10 * u, -4 * u, 30 * u, -4 * u, 26 * u, 42 * u, 8 * u, 40 * u]).fill(color).stroke(ink);
      for (const y of [8, 22]) g.rect(9 * u, y * u, 19 * u, 5 * u).fill(light);
      for (const x of [-30, -12, 6, 24]) g.rect(x * u, -24 * u, 6 * u, 22 * u).fill({ color: light, alpha: 0.8 });
      g.roundRect(-44 * u, -24 * u, 88 * u, 22 * u, 10 * u).stroke(ink);
      break;
    case 'llave':
      g.circle(-24 * u, 0, 18 * u).fill(color).stroke(ink);
      g.circle(-24 * u, 0, 7 * u).fill(C.paper).stroke(ink);
      g.rect(-8 * u, -5 * u, 52 * u, 10 * u).fill(color).stroke(ink);
      g.rect(30 * u, 5 * u, 7 * u, 13 * u).fill(color).stroke(ink);
      g.rect(18 * u, 5 * u, 7 * u, 9 * u).fill(color).stroke(ink);
      break;
    case 'pluma':
      g.moveTo(-36 * u, 40 * u)
        .quadraticCurveTo(-30 * u, -20 * u, 30 * u, -44 * u)
        .quadraticCurveTo(20 * u, 10 * u, -36 * u, 40 * u)
        .fill(color)
        .stroke(ink);
      g.moveTo(-40 * u, 46 * u).quadraticCurveTo(-8 * u, -4 * u, 26 * u, -38 * u).stroke(ink);
      for (let i = 1; i < 6; i++) {
        const k = i / 6;
        const x = -36 * u + k * 60 * u;
        const y = 40 * u - k * 80 * u;
        g.moveTo(x, y).lineTo(x + 10 * u, y + 4 * u).stroke({ ...ink, width: ink.width * 0.6 });
      }
      break;
    case 'concha': {
      const pts: number[] = [];
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + (i / 10) * Math.PI;
        const r = (i % 2 ? 40 : 44) * u;
        pts.push(Math.cos(a) * r, Math.sin(a) * r + 20 * u);
      }
      pts.push(8 * u, 34 * u, -8 * u, 34 * u);
      g.poly(pts).fill(color).stroke(ink);
      for (let i = 1; i < 6; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        g.moveTo(0, 30 * u).lineTo(Math.cos(a) * 38 * u, Math.sin(a) * 38 * u + 20 * u).stroke({ ...ink, width: ink.width * 0.7 });
      }
      break;
    }
    case 'estrella': {
      const pts: number[] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = (i % 2 ? 20 : 46) * u;
        pts.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.poly(pts).fill(color).stroke(ink);
      g.circle(-10 * u, -8 * u, 5 * u).fill({ color: 0xffffff, alpha: 0.7 });
      break;
    }
    case 'campana':
      g.moveTo(-34 * u, 26 * u)
        .quadraticCurveTo(-30 * u, -36 * u, 0, -38 * u)
        .quadraticCurveTo(30 * u, -36 * u, 34 * u, 26 * u)
        .closePath()
        .fill(color)
        .stroke(ink);
      g.rect(-40 * u, 22 * u, 80 * u, 9 * u).fill(light).stroke(ink);
      g.circle(0, 38 * u, 8 * u).fill(color).stroke(ink);
      g.circle(0, -44 * u, 6 * u).stroke(ink);
      break;
    case 'flor':
      g.moveTo(0, 8 * u).quadraticCurveTo(-8 * u, 30 * u, -2 * u, 48 * u).stroke({ ...ink, color: 0x4f7a3a, width: 5 * u });
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        g.ellipse(Math.cos(a) * 20 * u, Math.sin(a) * 20 * u - 8 * u, 15 * u, 15 * u).fill(color).stroke(ink);
      }
      g.circle(0, -8 * u, 11 * u).fill(C.yellow).stroke(ink);
      break;
    case 'sobre':
      g.rect(-46 * u, -30 * u, 92 * u, 60 * u).fill(C.paper).stroke(ink);
      g.moveTo(-46 * u, -30 * u).lineTo(0, 6 * u).lineTo(46 * u, -30 * u).stroke(ink);
      g.circle(0, 6 * u, 11 * u).fill(color).stroke(ink);
      break;
    case 'nota':
      g.ellipse(-16 * u, 28 * u, 16 * u, 11 * u).fill(color).stroke(ink);
      g.rect(-3 * u, -40 * u, 6 * u, 68 * u).fill(C.ink);
      g.moveTo(3 * u, -40 * u).quadraticCurveTo(34 * u, -26 * u, 26 * u, 0).stroke({ ...ink, width: 6 * u });
      break;
  }
  return g;
}

// ------------------------------------------------------------------ the wash (ink and wet paper)
/**
 * watercolor blooms in the Eco's hue (deterministic per cat), w×h from (0,0): each bloom is a stack of soft discs
 * (pigment pooling toward the middle) with a faint, irregular dried edge — wet paper, not bubbles
 */
export function ecoWash(w: number, h: number, hue: number, seed: number, strength = 1): Container {
  const c = new Container();
  const r = rng(seed);
  const g = new Graphics();
  const light = lighten(hue, 0.4);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x = w * (0.18 + r() * 0.64);
    const y = h * (0.15 + r() * 0.55);
    const rad = Math.min(w, h) * (0.18 + r() * 0.2);
    const col = i % 3 === 2 ? light : hue;
    for (let k = 0; k < 5; k++) {
      const rr = rad * (1 - k * 0.17);
      g.circle(x + (r() - 0.5) * rad * 0.12, y + (r() - 0.5) * rad * 0.12, rr).fill({ color: col, alpha: 0.035 * strength });
    }
    // the dried edge: a wobbly ring, barely there
    const pts: number[] = [];
    const seg = 22;
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      const rr = rad * (0.94 + r() * 0.1);
      pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.poly(pts).stroke({ width: 2, color: hue, alpha: 0.07 * strength });
  }
  c.addChild(g);
  return c;
}

// ------------------------------------------------------------------ the portrait look
/** on the sheet's portrait (FW×FH frame): the wash behind the cat + the keepsake + a small ECO stamp */
export class EcoFrameLook {
  readonly back = new Container();
  readonly front = new Container();
  private tweens: gsap.core.Tween[] = [];
  constructor(uid: string, eco: EcoDef, FW: number, FH: number, o: { animate?: boolean } = {}) {
    const wash = ecoWash(FW, FH, eco.hue, seedOf(uid), 2.2);
    const mask = new Graphics().rect(0, 0, FW, FH).fill(0xffffff);
    wash.mask = mask;
    this.back.addChild(wash, mask);
    const k = drawKeepsake(eco.keepsake, 92, eco.hue);
    k.position.set(FW - 96, FH - 210);
    k.rotation = -0.12;
    const stamp = new Container();
    const sb = new Graphics().rect(0, 0, 70, 30).fill(C.paper).stroke({ width: 3, color: eco.hue });
    const st = txt('ECO', { fontFamily: F.bebas, fontSize: 24, fill: eco.hue, letterSpacing: 4 });
    st.anchor.set(0.5);
    st.position.set(35, 16);
    stamp.addChild(sb, st);
    stamp.position.set(FW - 136, FH - 158);
    stamp.rotation = -0.1;
    this.front.addChild(k, stamp);
    if (o.animate && !rm()) {
      this.tweens.push(
        gsap.from(wash, { alpha: 0, duration: 1.6, ease: 'sine.out' }),
        gsap.from(wash.scale, { x: 0.9, y: 0.9, duration: 1.6, ease: 'sine.out' }),
        gsap.from(k, { y: k.y - 120, alpha: 0, duration: 0.9, delay: 0.6, ease: 'bounce.out' }),
        gsap.from(stamp, { alpha: 0, duration: 0.4, delay: 1.4 }),
        gsap.from(stamp.scale, { x: 1.8, y: 1.8, duration: 0.4, delay: 1.4, ease: 'back.out(3)' }),
      );
    }
  }
  destroy() {
    for (const t of this.tweens) t.kill();
    this.tweens = [];
    if (!this.back.destroyed) this.back.destroy({ children: true });
    if (!this.front.destroyed) this.front.destroy({ children: true });
  }
}

// ------------------------------------------------------------------ the section
export interface EcosHost {
  /** the cat's name as shown */
  name(): string;
  /** the Eco woke / was switched on or off: redraw the portrait (animate = it just woke) */
  lookChanged(animate: boolean): void;
  /** VOLVER A LA FICHA */
  back(): void;
}

/** the ECOS section (w×h), drawn over the sheet's right column */
export class EcosSection extends Container {
  private body = new Container();
  private tweens: gsap.core.Tween[] = [];
  constructor(
    private catUid: string,
    private w: number,
    private h: number,
    private host: EcosHost,
  ) {
    super();
    const bg = new Graphics().rect(8, 8, w, h).fill(C.ink).rect(0, 0, w, h).fill(C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    bg.eventMode = 'static';
    this.addChild(bg, this.body);
    this.draw(false);
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    for (const t of this.tweens) t.kill();
    this.tweens = [];
    super.destroy(o);
  }

  private draw(justWoke: boolean) {
    for (const t of this.tweens) t.kill();
    this.tweens = [];
    this.body.removeChildren().forEach((x) => x.destroy({ children: true }));
    const { w, h } = this;
    const b = this.body;
    const st = ecoStatus(this.catUid);
    const eco = ecoOf(this.catUid);
    const c = G.s.cats.find((x) => x.uid === this.catUid);
    if (!eco || !c) return;
    const PAD = 28;
    // header
    const head = txt('ECOS DE VIDA', { fontFamily: F.bebas, fontSize: 40, fill: C.ink, letterSpacing: 4 });
    head.position.set(PAD, 16);
    const rule = new Graphics().rect(PAD, 62, w - PAD * 2, 3).fill(C.ink);
    const sub = txt('Otra vida que este gato pudo tener. No cambia su fuerza: cambia cómo se ve y lo que recuerda.', { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink, wordWrap: true, wordWrapWidth: w - PAD * 2 });
    sub.position.set(PAD, 74);
    b.addChild(head, rule, sub);
    const top = 74 + sub.height + 18;
    const back = new Button('VOLVER A LA FICHA', () => this.host.back(), { w: 300, h: 56, size: 24, color: C.paper });
    back.position.set(w - PAD - 300, h - 56 - 22);
    b.addChild(back);
    const cardH = h - top - 56 - 44;

    if (st === 'awake') this.drawAwake(eco, top, cardH, justWoke);
    else if (st === 'ready') this.drawReady(eco, top, cardH);
    else this.drawDreaming(c.species === 'c_canelo' ? 0 : Math.min(ECO_NIGHTS - 1, nightsHome(c)), top, cardH, c.species === 'c_canelo');

    // others who can remember now (H59 hint; never this cat)
    const others = ecosReady()
      .filter((u) => u !== this.catUid)
      .map((u) => G.s.cats.find((x) => x.uid === u)?.name)
      .filter((n): n is string => !!n);
    if (others.length) {
      const more = txt(`También pueden recordar: ${others.slice(0, 3).join(', ')}${others.length > 3 ? ` y ${others.length - 3} más` : ''}.`, { fontFamily: F.ui, fontSize: 16, fill: C.ink, fontStyle: 'italic' });
      fitLine(more, w - PAD * 2 - 330);
      more.position.set(PAD, h - 22 - 28 - more.height / 2);
      b.addChild(more);
    }
  }

  private card(top: number, cardH: number, hue: number, washed: boolean) {
    const PAD = 28;
    const cw = this.w - PAD * 2;
    const card = new Container();
    card.position.set(PAD, top);
    const g = new Graphics().rect(0, 0, cw, cardH).fill(0xf6f0e4).stroke({ width: 3, color: C.ink });
    card.addChild(g);
    if (washed) {
      const wash = ecoWash(cw, cardH, hue, seedOf(this.catUid), 1.8);
      const mask = new Graphics().rect(0, 0, cw, cardH).fill(0xffffff);
      wash.mask = mask;
      card.addChild(wash, mask);
    }
    this.body.addChild(card);
    return { card, cw };
  }

  private drawDreaming(nights: number, top: number, cardH: number, canelo: boolean) {
    const { card, cw } = this.card(top, cardH, C.lilac, false);
    const name = this.host.name();
    const t = poster(canelo ? `${name} ya vivió la suya` : `${name} todavía sueña`, 46, C.ink);
    fitLine(t, cw - 60);
    t.position.set(30, 30);
    card.addChild(t);
    const msg = canelo
      ? 'Su otra vida le llega con la historia: una página con su nombre. Cuando la viva, aquí la vas a poder recordar.'
      : `Cuando haya dormido ${ECO_NIGHTS} noches en tu isla, va a recordar otra vida. Los gatos recuerdan mejor donde duermen tranquilos.`;
    const p = txt(msg, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 24, fill: C.ink, wordWrap: true, wordWrapWidth: cw - 60, lineHeight: 32 });
    p.position.set(30, 30 + t.height + 16);
    card.addChild(p);
    if (!canelo) {
      // the nights, as moons
      const row = new Container();
      for (let i = 0; i < ECO_NIGHTS; i++) {
        const full = i < nights;
        const m = new Graphics().circle(0, 0, 26).fill(full ? C.yellow : C.paperDark).stroke({ width: 3, color: C.ink });
        if (!full) m.circle(10, -6, 22).fill(0xf6f0e4);
        m.position.set(i * 74, 0);
        row.addChild(m);
      }
      const lab = txt(`${nights}/${ECO_NIGHTS} NOCHES EN TU ISLA`, { fontFamily: F.bebas, fontSize: 28, fill: C.ink, letterSpacing: 2 });
      lab.position.set(ECO_NIGHTS * 74, -16);
      row.addChild(lab);
      row.position.set(56, Math.min(cardH - 50, p.y + p.height + 60));
      card.addChild(row);
    }
  }

  private drawReady(eco: EcoDef, top: number, cardH: number) {
    const { card, cw } = this.card(top, cardH, eco.hue, false);
    const name = this.host.name();
    // a fogged memory: the hue is there, the life isn't yet
    const fog = ecoWash(cw, cardH, eco.hue, seedOf(this.catUid), 0.7);
    fog.alpha = 0.8;
    card.addChild(fog);
    const t = poster(`${name} trae un ECO`, 50, C.ink);
    fitLine(t, cw - 60);
    t.position.set(30, 28);
    card.addChild(t);
    const p = txt('Ya durmió sus noches aquí y se acuerda de otra vida que pudo tener. Despiértala: sigue siendo tu gato, nomás que con más pasado.', {
      fontFamily: F.serif,
      fontStyle: 'italic',
      fontSize: 24,
      fill: C.ink,
      wordWrap: true,
      wordWrapWidth: cw - 60,
      lineHeight: 32,
    });
    p.position.set(30, 28 + t.height + 14);
    card.addChild(p);
    const q = txt('?', { fontFamily: F.poster, fontSize: 150, fill: eco.hue });
    q.anchor.set(0.5);
    q.alpha = 0.35;
    q.position.set(cw - 110, cardH - 110);
    card.addChild(q);
    const go = new Button('DESPIERTA', () => this.wake(), { w: 340, h: 84, size: 44, color: C.pinkHot, textColor: C.paper });
    go.position.set(30, Math.min(cardH - 84 - 26, p.y + p.height + 40));
    card.addChild(go);
    if (!rm()) this.tweens.push(gsap.to(go.scale, { x: 1.04, y: 1.04, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  }

  private drawAwake(eco: EcoDef, top: number, cardH: number, justWoke: boolean) {
    const { card, cw } = this.card(top, cardH, eco.hue, true);
    const k = drawKeepsake(eco.keepsake, 150, eco.hue);
    k.position.set(cw - 120, 118);
    k.rotation = -0.1;
    card.addChild(k);
    const kick = txt('EN OTRA VIDA', { fontFamily: F.bebas, fontSize: 26, fill: eco.hue, letterSpacing: 4 });
    kick.position.set(30, 22);
    const title = poster(eco.title, 50, C.ink);
    fitLine(title, cw - 270);
    title.position.set(30, 50);
    const mem = txt(`«${eco.memory}»`, { fontFamily: F.serif, fontStyle: 'italic', fontSize: 26, fill: C.ink, wordWrap: true, wordWrapWidth: cw - 290, lineHeight: 34 });
    mem.position.set(30, 50 + title.height + 18);
    const brought = txt(`TRAJO ${eco.thing.toUpperCase()}`, { fontFamily: F.bebas, fontSize: 26, fill: C.ink, letterSpacing: 2 });
    fitLine(brought, cw - 60);
    brought.position.set(30, mem.y + mem.height + 18);
    card.addChild(kick, title, mem, brought);
    // RECORDAR · VER ECO
    const by = cardH - 66 - 22;
    const again = new Button('RECORDAR', () => this.remember(mem), { w: 230, h: 66, size: 30, color: C.yellow });
    again.position.set(30, by);
    const shown = ecoShown(this.catUid);
    const toggle = new Button(shown ? 'VER ECO: SÍ' : 'VER ECO: NO', () => {
      setEcoShown(this.catUid, !ecoShown(this.catUid));
      this.host.lookChanged(false);
      this.draw(false);
    }, { w: 250, h: 66, size: 28, color: shown ? C.mint : C.paper });
    toggle.position.set(30 + 230 + 24, by);
    card.addChild(again, toggle);
    if (justWoke && !rm()) {
      // the color soaks in, the keepsake lands, the words write themselves
      this.tweens.push(gsap.from(k, { y: k.y - 160, alpha: 0, duration: 0.9, delay: 0.5, ease: 'bounce.out' }));
      for (const [i, n] of [kick, title, mem, brought].entries()) this.tweens.push(gsap.from(n, { alpha: 0, x: n.x - 24, duration: 0.6, delay: 0.9 + i * 0.35, ease: 'power2.out' }));
    }
  }

  private wake() {
    const r = wakeEco(this.catUid);
    if (!r) return;
    audioApi.stinger('eco');
    const p = this.toGlobal({ x: this.w / 2, y: this.h / 2 });
    const layer = this.parent;
    if (layer && !rm()) sparkles(layer, layer.toLocal(p).x, layer.toLocal(p).y, r.eco.hue, 26, 260);
    this.host.lookChanged(true);
    this.draw(true);
    if (r.gift) toast(`${this.host.name()} trajo ${r.eco.thing}`, { icon: 'gem', sub: `+${r.gift} gema · su Eco ya es parte de su ficha. Su fuerza no cambia.`, color: lighten(r.eco.hue, 0.55) });
    if (r.mission) checkMissions();
  }

  private remember(mem: Text) {
    audioApi.stinger('eco', { gain: 0.6 });
    if (!rm()) this.tweens.push(gsap.fromTo(mem, { alpha: 0.15 }, { alpha: 1, duration: 1.4, ease: 'sine.inOut' }));
    if (rememberEco(this.catUid)) checkMissions();
  }
}

/** the species-flavored name of a cat (for the section's lines) */
export function ecoCatName(uid: string) {
  const c = G.s.cats.find((x) => x.uid === uid);
  return c?.name ?? CAT_BY_ID.get(c?.species ?? '')?.name ?? 'Tu gato';
}
