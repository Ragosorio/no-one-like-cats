/**
 * F27 · «Karaoke» — the sets: the photo booth's STRIP (a booth on top, four live photos below that freeze with a flash),
 * the dressing room (Canelo asleep, his flame), and the strip coming out of the slot. The song is invented for the
 * script (no real song is quoted); the base is `xti.gira`, the «melody» is the bouncing ball.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { FilmSet, SceneCtx, SetModule } from '../../../stage';
import { POP } from '../../../styles/pop';
import { XT_BEAT } from '../music';
import { Beam, Dressed, FLAME, SLUG, StaticKitten, balloon, bob, bokeh, caneloFlame, glowAt, lanternAt, luzOf, outBack, popIn, rnd, seg, sleepFlame, sm, word } from '../kit';
import { F27_FLASH } from './index';

const PW = 680;
const PH = 500;
const X0 = 960 - PW / 2;
const frameTop = (i: number) => 40 + i * 540;

/** a karaoke line: the text, lit syllable by syllable under a bouncing ball */
class Lyric extends Container {
  private lit: Sprite;
  private mask_ = new Graphics();
  private ball = new Graphics();
  private w: number;
  constructor(
    ctx: SceneCtx,
    text: string,
    readonly t0: number,
    readonly t1: number,
    who?: string,
  ) {
    super();
    const st = { fontFamily: 'Bangers', fontSize: 40, letterSpacing: 2, stroke: { color: POP.ink, width: 7, join: 'round' as const } };
    const base = ctx.k.text.sprite(text, { ...st, fill: 0xffffff }, 0);
    base.anchor.set(0.5, 0.5);
    this.lit = ctx.k.text.sprite(text, { ...st, fill: POP.yellow }, 0);
    this.lit.anchor.set(0.5, 0.5);
    this.w = base.width;
    this.lit.mask = this.mask_;
    this.addChild(base, this.lit, this.mask_, this.ball);
    if (who) {
      const tag = ctx.k.text.sprite(who, { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 18, fill: POP.cyan, letterSpacing: 3 }, 0);
      tag.anchor.set(0.5, 0.5);
      tag.position.set(0, -34);
      this.addChild(tag);
    }
    if (this.w > PW - 40) this.scale.set((PW - 40) / this.w);
  }
  update(t: number) {
    this.visible = t >= this.t0 - 0.4 && t < this.t1 + 0.6;
    if (!this.visible) return;
    const p = Math.max(0, Math.min(1, (t - this.t0) / (this.t1 - this.t0)));
    const m = this.mask_.clear();
    m.rect(-this.w / 2 - 10, -40, this.w * p + 10, 80).fill(0xffffff);
    // the ball hops from syllable to syllable on the beat, riding the lit edge
    const b = this.ball.clear();
    if (p > 0 && p < 1) {
      const hop = Math.abs(Math.sin(((t - this.t0) / XT_BEAT) * Math.PI));
      b.circle(-this.w / 2 + this.w * p, -36 - hop * 26, 10).fill(POP.hot).stroke({ width: 3, color: POP.ink });
    }
  }
}

/** a toy microphone (pink, a yellow star on top) at (x, y), rotation r */
function toyMic(g: Graphics, x: number, y: number, r = 0.3) {
  const c = Math.cos(r);
  const s = Math.sin(r);
  const P = (dx: number, dy: number): [number, number] => [x + dx * c - dy * s, y + dx * s + dy * c];
  g.poly([...P(-10, 0), ...P(10, 0), ...P(7, 90), ...P(-7, 90)]).fill(POP.hot).stroke({ width: 4, color: POP.ink, join: 'round' });
  const [sx, sy] = P(0, -16);
  g.star(sx, sy, 5, 26, 12, r).fill(POP.yellow).stroke({ width: 4, color: POP.ink, join: 'round' });
}
function fishShape(g: Graphics, x: number, y: number, k: number, flip = 1) {
  const s = 46 * k;
  g.ellipse(x, y, s, s * 0.42).fill(0x9fb8d8).stroke({ width: 3, color: 0x2a3a5a });
  g.poly([x + flip * s * 0.9, y, x + flip * s * 1.5, y - s * 0.4, x + flip * s * 1.5, y + s * 0.4]).fill(0x9fb8d8).stroke({ width: 3, color: 0x2a3a5a });
  g.circle(x - flip * s * 0.55, y - s * 0.08, s * 0.08).fill(0x1a2a4a);
}

interface Photo {
  root: Container;
  /** draw the photo at song time t (frozen = the instant of its flash) */
  update(t: number, frozen: number | null): void;
}

/** the photo booth strip: the booth on top (y < 0) and four photos below */
class Strip extends Container {
  readonly photos: Photo[] = [];
  readonly booth = new Container();
  private coin = new Graphics();
  private red = new Graphics();
  private curtain = new Graphics();
  private tails = new Graphics();
  private paper = new Container();
  constructor(
    private ctx: SceneCtx,
    o: { live?: boolean } = {},
  ) {
    super();
    // ---- the booth (a pastel metal box with a curtain, a coin slot and a little red light)
    const b = new Graphics();
    b.roundRect(960 - 460, -740, 920, 760, 30).fill(0xffc2d8).stroke({ width: 8, color: POP.ink });
    b.roundRect(960 - 420, -700, 600, 640, 18).fill(0x2a0e1a);
    b.rect(960 + 220, -560, 150, 220).fill(0xf6e6ee).stroke({ width: 6, color: POP.ink });
    b.rect(960 + 270, -520, 50, 10).fill(POP.ink);
    b.roundRect(960 - 300, -60, 600, 26, 8).fill(0x2a0e1a).stroke({ width: 4, color: POP.ink });
    const sign = word(ctx.k, 'FOTOS · 4 POSES', { fontFamily: 'Bangers', fontSize: 54, fill: POP.yellow, stroke: { color: POP.ink, width: 7 }, letterSpacing: 4 });
    sign.position.set(960 - 120, -770);
    this.booth.addChild(b, this.tails, this.curtain, this.red, this.coin, sign);
    this.addChild(this.booth);
    // ---- the strip of paper with four frames
    const pp = new Graphics().rect(X0 - 40, 0, PW + 80, 4 * 540 + 40).fill(0xfbf8f2).stroke({ width: 4, color: 0xd8d0c4 });
    this.paper.addChild(pp);
    this.addChild(this.paper);
    for (let i = 0; i < 4; i++) {
      const ph = this.makePhoto(i);
      ph.root.position.set(X0, frameTop(i));
      this.paper.addChild(ph.root);
      this.photos.push(ph);
    }
    void o;
  }
  get paperC() {
    return this.paper;
  }
  private frame(i: number): { root: Container; c: Container } {
    const root = new Container();
    const m = new Graphics().rect(0, 0, PW, PH).fill(0xffffff);
    const c = new Container();
    c.mask = m;
    root.addChild(c, m);
    void i;
    return { root, c };
  }
  private karaokeBg(c: Container, seed: number) {
    const g = new Graphics();
    for (let i = 0; i < 20; i++) g.rect(0, i * 25, PW, 26).fill(i < 10 ? 0x3a1468 : 0x5a1878);
    g.star(PW * 0.78, 120, 5, 80, 36).stroke({ width: 8, color: POP.hot, alpha: 0.9 });
    g.circle(80, 90, 40).stroke({ width: 6, color: POP.cyan, alpha: 0.8 });
    for (let i = 0; i < 14; i++) g.circle(rnd(i + seed) * PW, rnd(i * 3 + seed) * 300, 3).fill({ color: 0xffffff, alpha: 0.6 });
    g.rect(0, PH - 96, PW, 96).fill({ color: 0x0a0418, alpha: 0.82 });
    c.addChild(g);
  }
  private makePhoto(i: number): Photo {
    const ctx = this.ctx;
    const { root, c } = this.frame(i);
    const veil = new Graphics().rect(0, 0, PW, PH).fill(0x1a1a22);
    const print = new Graphics().rect(0, 0, PW, PH).fill({ color: 0xffffff, alpha: 0.07 });
    if (i === 0) {
      this.karaokeBg(c, 1);
      const luz = luzOf(ctx, 600);
      if (luz.actor) c.addChild(luz.actor);
      const beam = new Beam(ctx);
      const mic = new Graphics();
      c.addChild(beam, mic);
      const l1 = new Lyric(ctx, 'Gato gordo, gato naranja,', 3.4, 8.4);
      const l2 = new Lyric(ctx, 'se comió mi pan y mi esperanza.', 8.8, 14.2);
      for (const l of [l1, l2]) {
        l.position.set(PW / 2, PH - 44);
        c.addChild(l);
      }
      c.addChild(print);
      root.addChild(veil);
      return {
        root,
        update: (t, frozen) => {
          const tt = frozen ?? t;
          veil.alpha = t < 3.0 ? 1 : 0;
          print.visible = frozen !== null;
          // she sings with her whole body, eyes closed, off-key (a wobble on the beat)
          const b = Math.floor(tt / XT_BEAT);
          luz.actor?.pose(tt, 330, 640 + bob(tt, ctx.rm, 6), { flip: true, rot: (b % 2 ? 0.06 : -0.05) * (ctx.rm ? 0.4 : 1), step: frozen !== null ? 0 : b });
          if (luz.actor && frozen === null && tt > 4 && Math.floor(tt * 2) !== Math.floor((tt - 0.017) * 2)) luz.actor.emote('happy', 0.6);
          const [lx, ly] = lanternAt(luz);
          const [hx, hy] = luz.actor ? luz.actor.head() : [0, 0];
          beam.set([lx, ly], [330 - hx * 0.4, 640 + hy], 70, 0.7);
          toyMic(mic.clear(), 330 + 70, 640 + hy + 70, -0.5);
          l1.update(tt);
          l2.update(tt);
        },
      };
    }
    if (i === 1) {
      this.karaokeBg(c, 2);
      const luz = luzOf(ctx, 520);
      const can = new Dressed(ctx.actor(ctx.canelo, 470), () => undefined);
      if (luz.actor) c.addChild(luz.actor);
      if (can.actor) c.addChild(can.actor);
      const fx = new Graphics();
      c.addChild(fx);
      const bal = balloon(ctx.k, '¡Fuera! ¡Fuera! …No, quédate, pero cállate.', { size: 30, tail: [90, 70], wrap: 300, who: 'CANELO' });
      bal.position.set(430, 120);
      c.addChild(bal);
      const l1 = new Lyric(ctx, 'Duerme en la palmera, ronca en el mar,', 16.6, 20.8);
      const l2 = new Lyric(ctx, 'y si le pides algo, se pone a… roncar.', 21.2, 25.4);
      for (const l of [l1, l2]) {
        l.position.set(PW / 2, PH - 44);
        c.addChild(l);
      }
      c.addChild(print);
      root.addChild(veil);
      return {
        root,
        update: (t, frozen) => {
          const tt = frozen ?? t;
          veil.alpha = t < 15.6 ? 1 : 0;
          print.visible = frozen !== null;
          const b = Math.floor(tt / XT_BEAT);
          // she sings LOUDER (a bigger wobble); he comes in with a fish and boos (leans in and out)
          luz.actor?.pose(tt, 210, 600 + bob(tt, ctx.rm, 6), { flip: true, rot: (b % 2 ? 0.1 : -0.08) * (ctx.rm ? 0.4 : 1), sx: 1.04, step: frozen !== null ? 0 : b });
          const enter = sm(seg(tt, 16.2, 17.2));
          const boo = tt > 17.4 && tt < 21.6 ? Math.sin((tt - 17.4) * 9) * 0.07 : 0;
          can.actor?.pose(tt, 820 - enter * 330, 590, { flip: true, rot: boo * (ctx.rm ? 0.4 : 1), step: frozen !== null ? 0 : Math.floor(tt * 12) });
          can.follow();
          const f = fx.clear();
          if (can.actor) fishShape(f, can.actor.x - 150, can.actor.y - 180, 0.9, -1);
          if (frozen !== null) {
            bal.visible = false;
          } else popIn(bal, tt, 17.5, 21.8, ctx.rm, 1);
          l1.update(tt);
          l2.update(tt);
        },
      };
    }
    if (i === 2) {
      this.karaokeBg(c, 3);
      const hip = ctx.actor(SLUG.hipo, 280);
      if (hip) c.addChild(hip);
      const luz = luzOf(ctx, 520);
      const can = ctx.actor(ctx.canelo, 480);
      if (luz.actor) c.addChild(luz.actor);
      if (can) c.addChild(can);
      const mic = new Graphics();
      const claps = new Graphics();
      c.addChild(mic, claps);
      const cer = new StaticKitten(ctx, 150);
      c.addChild(cer);
      const l1 = new Lyric(ctx, '¡Gato gordo, gato naranja!', 28.2, 32.2, 'LOS DOS');
      const l2 = new Lyric(ctx, 'Fantasma flaca, fantasma azul…', 32.6, 36.4, 'CANELO');
      const l3 = new Lyric(ctx, '…¡que canta mejor que tú!', 36.8, 40.4, 'LUZTERNA');
      for (const l of [l1, l2, l3]) {
        l.position.set(PW / 2, PH - 40);
        c.addChild(l);
      }
      c.addChild(print);
      root.addChild(veil);
      return {
        root,
        update: (t, frozen) => {
          const tt = frozen ?? t;
          veil.alpha = t < 26.6 ? 1 : 0;
          print.visible = frozen !== null;
          const b = Math.floor(tt / XT_BEAT);
          const step = frozen !== null ? 0 : b;
          // Hipólito asleep at the back, nodding on the beat
          hip?.pose(tt, 560, 360, { rot: (b % 2 ? 0.08 : -0.02) * (ctx.rm ? 0.4 : 1), step });
          if (hip?.puppet) hip.puppet.sleeping = true;
          // cheek to cheek; the mic goes from her to him (30.5–31.5)
          luz.actor?.pose(tt, 260, 600 + bob(tt, ctx.rm, 4), { flip: true, rot: 0.08, step });
          can?.pose(tt, 440, 600, { flip: true, rot: -0.06 + (b % 2 ? 0.03 : 0), step });
          const pass = sm(seg(tt, 30.5, 31.5));
          toyMic(mic.clear(), 340 + pass * 140, 330 + Math.sin(pass * Math.PI) * -40, -0.3 + pass * 0.6);
          // applause from the imaginary crowd: hearts and «¡CLAP!» marks pop on the beats (the tap: bigger, more)
          const j = ctx.k.judged('aplaude');
          const more = j && j.r !== 'miss' && tt >= j.at ? 1 : 0;
          const cg = claps.clear();
          if (tt > 28) {
            const n = 4 + more * 6;
            for (let k2 = 0; k2 < n; k2++) {
              const ph = ((tt - 28) / (XT_BEAT * 2) + k2 / n) % 1;
              const x = 40 + rnd(k2 * 7 + Math.floor((tt - 28) / (XT_BEAT * 2) + k2 / n)) * (PW - 80);
              const y = 300 - ph * 160;
              const s = (12 + more * 8) * (1 - ph * 0.5);
              cg.moveTo(x, y + s).bezierCurveTo(x - s * 1.6, y - s * 0.4, x - s * 0.6, y - s * 1.8, x, y - s * 0.8).bezierCurveTo(x + s * 0.6, y - s * 1.8, x + s * 1.6, y - s * 0.4, x, y + s).fill({ color: k2 % 2 ? POP.hot : POP.yellow, alpha: 1 - ph });
            }
          }
          // Cerito peeking from the corner, just before the flash (a stain of static)
          const peek = sm(seg(tt, 39.4, 40.6));
          cer.visible = peek > 0.01;
          cer.position.set(40 + peek * 30, PH + 30 - peek * 120);
          cer.update(tt, { stare: 0.9 });
          l1.update(tt);
          l2.update(tt);
          l3.update(tt);
        },
      };
    }
    // i === 3 · the edge of the empty stage after the show
    const g = new Graphics();
    for (let k2 = 0; k2 < 20; k2++) g.rect(0, k2 * 25, PW, 26).fill(k2 < 12 ? 0x0e0a22 : 0x14102c);
    g.poly([0, 330, PW, 250, PW, PH, 0, PH]).fill(0x24183e);
    g.moveTo(0, 330).lineTo(PW, 250).stroke({ width: 6, color: POP.pink, alpha: 0.6 });
    for (let k2 = 0; k2 < 5; k2++) g.circle(80 + k2 * 130, 60 + (k2 % 2) * 20, 8).fill({ color: 0xfff0d8, alpha: 0.4 });
    // the buffet below the edge
    g.rect(330, 400, 330, 20).fill(0xf6e6ee).stroke({ width: 4, color: POP.ink });
    g.rect(340, 420, 310, 90).fill(0xff9ec8).stroke({ width: 4, color: POP.ink });
    for (let k2 = 0; k2 < 6; k2++) g.circle(380 + k2 * 44, 392, 14).fill(0xc87a3a).stroke({ width: 2, color: POP.ink });
    c.addChild(g);
    const luz = luzOf(ctx, 300);
    const can = ctx.actor(ctx.canelo, 300);
    if (luz.actor) c.addChild(luz.actor);
    if (can) c.addChild(can);
    const fx = new Graphics();
    c.addChild(fx);
    const mm = balloon(ctx.k, '¿mm?', { size: 34, tail: [-40, 60] });
    mm.position.set(560, 170);
    c.addChild(mm, print);
    root.addChild(veil);
    return {
      root,
      update: (t, frozen) => {
        const tt = frozen ?? t;
        veil.alpha = t < 41.6 ? 1 : 0;
        print.visible = frozen !== null;
        luz.actor?.pose(tt, 170, 300 + bob(tt, ctx.rm, 5), { flip: true, step: frozen !== null ? 0 : Math.floor(tt * 12) });
        if (luz.actor?.puppet) {
          luz.actor.puppet.crouch = 0.5;
          luz.actor.puppet.look = 0.6;
        }
        // he eats with both paws (a chew on twos); at 58 he looks up and raises the fish: ¿mm?
        const look = tt > 58;
        can?.pose(tt, 500, 470, { flip: !look, rot: look ? -0.05 : Math.sin(tt * 8) * 0.03, step: frozen !== null ? 0 : Math.floor(tt * 12) });
        const f = fx.clear();
        if (can) fishShape(f, can.x + (look ? -20 : -70), can.y - (look ? 230 : 150), 0.8);
        if (frozen !== null) mm.visible = false;
        else popIn(mm, tt, 58.3, 60, ctx.rm, 1);
      },
    };
  }
  /** the booth's own little show before the photos: the curtain sways, tails out, a coin drops, the red light */
  updateBooth(t: number, rm: boolean) {
    const cu = this.curtain.clear();
    const sway = rm ? 0 : Math.sin(t * 5) * 14 * (t < 2.6 ? 1 : 0.2);
    const push = t > 1.2 && t < 2.0 ? Math.sin(seg(t, 1.2, 2.0) * Math.PI) * 26 : 0;
    for (let k = 0; k < 7; k++) {
      const x = 960 - 410 + k * 84;
      cu.moveTo(x, -700).bezierCurveTo(x + 20, -500, x - 20 + sway + push, -280, x + sway * 1.5 + push, -70).lineTo(x + 84 + sway * 1.5 + push, -70).bezierCurveTo(x + 64 + sway + push, -280, x + 104, -500, x + 84, -700).closePath().fill(k % 2 ? 0xc81e3a : 0xb0162e).stroke({ width: 3, color: 0x5a0a16 });
    }
    // tails sticking out under the curtain (the crew squeezing in): orange, grey, and a blue glow
    const tl = this.tails.clear();
    if (t > 0.6) {
      tl.moveTo(960 - 300, -80).quadraticCurveTo(960 - 360, -20, 960 - 330, 30).stroke({ width: 22, color: 0xd9662a, cap: 'round' });
      tl.moveTo(960 - 60, -80).quadraticCurveTo(960 - 10, -10, 960 - 60, 40).stroke({ width: 26, color: 0x8a8a96, cap: 'round' });
      tl.circle(960 + 100, -90, 40).fill({ color: 0x9fd8ff, alpha: 0.35 });
    }
    // a coin drops into the slot (0.2–0.9), the little red light comes on (1.0)
    const co = this.coin.clear();
    const ck = seg(t, 0.2, 0.9);
    if (ck > 0 && ck < 1) co.ellipse(960 + 295, -640 + ck * 120, 18 * Math.abs(Math.cos(ck * 12)) + 3, 18).fill(POP.gold).stroke({ width: 3, color: 0x8a6a1a });
    const on = t > 1.0;
    this.red.clear().circle(960 + 295, -400, 16).fill(on ? 0xff2a3a : 0x5a1a1a).stroke({ width: 4, color: POP.ink });
  }
}

/** the out-of-focus stadium around the strip (tall: the camera rides down the strip) */
function around(ctx: SceneCtx, seed: number) {
  const b = bokeh(ctx, { seed, n: 120, w: 2800, h: 4000, base: 0x150a2a, colors: [POP.pink, POP.cyan, POP.yellow, POP.lilac, 0xfff0d8] });
  b.position.set(-200, -1300);
  ctx.plane(b, { z: 1600, bake: 'static', res: 0.6 });
}

// ------------------------------------------------------------------ the strip (0–62): the booth, four photos, four flashes
export const tira: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    around(ctx, 27);
    const strip = new Strip(ctx, { live: true });
    ctx.plane(strip, { z: 1000 });
    const flash = new Graphics().rect(-200, -200, 2400, 1500).fill(0xffffff);
    ctx.plane(flash, { z: 0, screen: true });
    return {
      update(lt, f) {
        const rm = f.rm;
        const m = f.m;
        strip.updateBooth(m, rm);
        strip.photos.forEach((p, i) => {
          const fz = F27_FLASH[i];
          p.update(m, m >= fz ? fz : null);
        });
        // the flash: white, short (soft with «Reducir destellos»)
        let fl = 0;
        for (const t of F27_FLASH) if (m >= t && m < t + 0.4) fl = Math.max(fl, 1 - (m - t) / 0.4);
        flash.alpha = fl * (ctx.rf ? 0.25 : 0.85);
      },
    };
  },
};

// ------------------------------------------------------------------ the dressing room (62–66): his flame drops by itself
export const sillon: SetModule = {
  cats: ({ canelo }) => [canelo],
  build(ctx: SceneCtx): FilmSet {
    const room = new Graphics();
    for (let i = 0; i < 26; i++) room.rect(-200 + i * 96, -200, 97, 1500).fill(i % 2 ? 0x5a3a5a : 0x4e3250);
    room.rect(-200, 840, 2400, 500).fill(0x2a1a34);
    room.rect(1380, 160, 360, 460).fill(0x6a5a6a).stroke({ width: 6, color: 0x2a1a34 });
    for (let i = 0; i < 6; i++) room.circle(1400 + i * 64, 150, 14).fill(0x8a7a6a);
    ctx.plane(room, { z: 1400, bake: 'static' });
    const c = new Container();
    // the armchair
    const ch = new Graphics();
    ch.roundRect(620, 560, 680, 360, 60).fill(0x8a3a5a).stroke({ width: 8, color: 0x2a0e1a });
    ch.roundRect(560, 700, 160, 260, 50).fill(0x9a4a6a).stroke({ width: 8, color: 0x2a0e1a });
    ch.roundRect(1200, 700, 160, 260, 50).fill(0x9a4a6a).stroke({ width: 8, color: 0x2a0e1a });
    ch.roundRect(680, 820, 560, 140, 40).fill(0xa85a7a).stroke({ width: 8, color: 0x2a0e1a });
    c.addChild(ch);
    const can = ctx.actor(ctx.canelo, 420);
    if (can) c.addChild(can);
    const fl = new Graphics();
    const fish = new Graphics();
    c.addChild(fl, fish);
    const lamp = glowAt(ctx, 1560, 380, 3, 0xffd8a0, 0.25);
    if (lamp) c.addChild(lamp);
    ctx.plane(c, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        can?.pose(lt, 960, 880, { rot: -0.08 });
        if (can?.puppet) {
          can.puppet.sleeping = true;
          can.puppet.crouch = 0.4;
        }
        // the half-eaten fish on the armrest
        const g = fish.clear();
        g.ellipse(1270, 690, 40, 16).fill(0x9fb8d8).stroke({ width: 3, color: 0x2a3a5a });
        g.rect(1230, 676, 30, 28).fill(0x9a4a6a);
        fl.clear();
        caneloFlame(fl, can, sleepFlame(lt, 0.4, 3.2, FLAME.act4, FLAME.baja), lt, rm);
      },
    };
  },
};

// ------------------------------------------------------------------ the slot (66–70.6): the strip comes out and hangs
export const ranura: SetModule = {
  cats: ({ canelo }) => [canelo, 'luzterna', SLUG.hipo, SLUG.cerito],
  build(ctx: SceneCtx): FilmSet {
    // the pull back frames the whole strip: a wide dark ground behind the stadium lights
    const far = new Graphics().rect(-4000, -4000, 10000, 10000).fill(0x150a2a);
    ctx.plane(far, { z: 1700 });
    around(ctx, 66);
    const strip = new Strip(ctx);
    // the strip slides out of the slot: mask everything of the paper above the slot
    const mask = new Graphics().rect(-400, -46, 2800, 4000).fill(0xffffff);
    strip.paperC.mask = mask;
    strip.addChild(mask);
    ctx.plane(strip, { z: 1000 });
    return {
      update(lt, f) {
        const rm = f.rm;
        strip.updateBooth(3, rm);
        strip.photos.forEach((p, i) => p.update(F27_FLASH[i], F27_FLASH[i]));
        const out = sm(seg(lt, 0.2, 2.2));
        strip.paperC.position.set(0, -2200 * (1 - out) + (rm ? 0 : Math.sin(lt * 2.4) * 6 * out));
        strip.paperC.rotation = rm ? 0 : Math.sin(lt * 1.6) * 0.006 * out;
      },
    };
  },
};
void outBack;
void FLAME;
void Sprite;
