/** Tailor Swift: the tour of the eras. A stadium at night, the crowd's phone lights, the eras sweep by in their colors, friendship bracelets fly; fireworks: ¡ESTO VA A SER CANCIÓN! */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { txt } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, arrive, cheer, cover, drizzle, every, fall, later, word } from './kit';

const PINK = 0xff7ac0;
/** one color per era */
const ERAS = [0x5fb35f, 0xe8c46a, 0x8e5bc4, 0xc8102e, 0x8ad3f0, 0x2a2a2a, 0xff9ecf, 0x9a9a9a, 0x1c2a5a];

/** the stadium: night, light beams from the rig, a crowd of heads and phones */
function stadium(c: SigCtx): Container {
  const k = new Container();
  k.addChild(cover(0x160c2e));
  const beams = new Container();
  for (let i = 0; i < 6; i++) {
    const b = new Graphics().poly([-14, 0, 14, 0, 160, 1100, -160, 1100]).fill({ color: [PINK, 0xc9a6ff, 0xffe08a][i % 3], alpha: 0.16 });
    b.position.set(200 + i * 304, -20);
    b.rotation = (i % 2 ? 1 : -1) * 0.3;
    b.blendMode = 'add';
    beams.addChild(b);
    if (!c.reduce) gsap.to(b, { rotation: -b.rotation, duration: 2.2 + (i % 3) * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  k.addChild(beams);
  const crowd = new Graphics();
  for (let i = 0; i < 70; i++) crowd.circle((i * 29) % W, H - 40 - (i % 3) * 26, 34 + (i % 4) * 4).fill(0x0a0618);
  crowd.rect(0, H - 60, W, 60).fill(0x0a0618);
  k.addChild(crowd);
  const phones = new Graphics();
  k.addChild(phones);
  const dots = Array.from({ length: 150 }, (_, i) => [(i * 131) % W, H - 30 - ((i * 47) % 170)] as const);
  const twinkle = () => {
    if (phones.destroyed) return;
    phones.clear();
    for (const [x, y] of dots) phones.circle(x, y, 2.5).fill({ color: 0xfff6d8, alpha: 0.35 + Math.random() * 0.65 });
  };
  twinkle();
  if (!c.reduce) every(c, 8, twinkle);
  return k;
}

/** a friendship bracelet: beads on an arc, some with letters */
function bracelet(word: string): Container {
  const k = new Container();
  const n = 11;
  const letters = word.split('');
  const start = Math.floor((n - letters.length) / 2);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 0.15 + (i / (n - 1)) * Math.PI * 0.7;
    const x = Math.cos(a) * 70;
    const y = Math.sin(a) * 70;
    const li = i - start;
    const isLetter = li >= 0 && li < letters.length;
    const bead = new Graphics().circle(x, y, isLetter ? 14 : 10).fill(isLetter ? 0xffffff : [PINK, 0x8ad3f0, 0xe8c46a, 0xc9a6ff][i % 4]).stroke({ width: 2, color: C.ink });
    k.addChild(bead);
    if (isLetter) {
      const t: Text = txt(letters[li], { fontFamily: F.poster, fontSize: 17, fill: C.ink });
      t.anchor.set(0.5);
      t.position.set(x, y);
      k.addChild(t);
    }
  }
  return k;
}

/** a sequin */
function sequin(i: number): Graphics {
  const g = new Graphics().poly([0, -9, 6, 0, 0, 9, -6, 0]).fill([0xffffff, PINK, 0xffe08a, 0xc9a6ff][i % 4]);
  gsap.to(g, { alpha: 0.3, duration: 0.12 + (i % 3) * 0.05, yoyo: true, repeat: -1 });
  return g;
}

export const tailorswift: Signature = {
  dark: true,
  frame: PINK,
  tag: 'LA GIRA DE LAS ERAS',
  open(c: SigCtx) {
    const k = stadium(c);
    c.back.addChild(k);
    arrive(c, k, 0.4);
    gsap.to(c.circle, { alpha: 0, duration: c.short ? 0 : 0.3 });
    // a spotlight pool where her disc was
    const pool = new Graphics().circle(0, 0, 330).fill({ color: 0xfff1f8, alpha: 0.14 }).circle(0, 0, 260).fill({ color: 0xfff1f8, alpha: 0.12 });
    pool.position.set(W / 2, c.CY);
    c.behind.addChild(pool);
    if (c.short) return;

    // the eras sweep by, one color each (a slow crossfade with Reducir destellos)
    const fast = c.flashes && !c.reduce;
    const step = fast ? 0.17 : 0.5;
    const eras = fast ? ERAS : [ERAS[1], ERAS[4], ERAS[6]];
    const pitches = [1, 1.12, 1.26, 1.5, 1.68, 2, 2.24, 2.52, 3];
    eras.forEach((col, i) =>
      later(c, 0.2 + i * step, () => {
        const band = new Graphics().poly([-400, 0, W * 0.55, 0, W * 0.55 + 400, H, 0, H]).fill({ color: col, alpha: 0.85 });
        band.x = fast ? -W : 0;
        c.back.addChild(band);
        sfx('tick', pitches[i] * 1.2);
        if (fast) gsap.to(band, { x: W + 400, duration: 0.42, ease: 'power2.inOut', onComplete: () => band.destroy() });
        else {
          band.alpha = 0;
          gsap.to(band, { alpha: 0.6, duration: 0.25, yoyo: true, repeat: 1, onComplete: () => band.destroy() });
        }
      }),
    );
    later(c, 0.2 + eras.length * step, () => word(c, W / 2, 160, '¡ERA NUEVA!', PINK, 110, 1));
    // friendship bracelets thrown from the crowd
    later(c, 1.1, () => {
      const words = ['MIAU', '13', 'MIAU', 'ERAS', 'MIAU', '13'];
      words.forEach((w, i) => {
        const b = bracelet(w);
        const fromLeft = i % 2 === 0;
        b.position.set(fromLeft ? 100 + i * 60 : W - 100 - i * 60, H + 60);
        c.fg.addChild(b);
        const tx = fromLeft ? W * 0.62 + i * 40 : W * 0.38 - i * 40;
        if (c.reduce) {
          b.position.set(tx, 260 + i * 60);
          gsap.to(b, { alpha: 0, delay: 1, duration: 0.4, onComplete: () => b.destroy({ children: true }) });
          return;
        }
        const p = { u: 0 };
        const x0 = b.x;
        const y0 = b.y;
        gsap.to(p, {
          u: 1,
          duration: 1.1 + i * 0.06,
          delay: i * 0.07,
          ease: 'none',
          onUpdate: () => {
            if (b.destroyed) return;
            b.position.set(x0 + (tx - x0) * p.u, y0 - Math.sin(p.u * Math.PI) * 820 + p.u * 120);
            b.rotation = p.u * 7 * (fromLeft ? 1 : -1);
          },
          onComplete: () => b.destroy({ children: true }),
        });
      });
      sfx('whoosh', 1.5);
    });
    fall(c, c.fg, sequin, { n: 46, over: 1.8, dur: 2.2, spin: 2 });
    later(c, 1.65, () => word(c, W / 2 - 420, c.CY + 60, '13', 0xd0103a, 130, 1.1, F.brush));
    later(c, 0.1, () => sfx('drumroll', 1));
  },
  payoff(c: SigCtx) {
    sfx('fanfare', 1.15);
    // fireworks over the stage
    const shots: [number, number, number][] = [
      [W / 2 - 520, 230, PINK],
      [W / 2 + 560, 200, 0xffe08a],
      [W / 2 - 140, 120, 0xc9a6ff],
      [W / 2 + 230, 300, 0x8ad3f0],
    ];
    shots.forEach(([x, y, col], i) =>
      later(c, i * 0.22, () => {
        const fw = new Graphics();
        for (let r = 0; r < 18; r++) {
          const a = (r / 18) * Math.PI * 2;
          fw.moveTo(Math.cos(a) * 20, Math.sin(a) * 20).lineTo(Math.cos(a) * 120, Math.sin(a) * 120);
        }
        fw.stroke({ width: 5, color: col, cap: 'round' });
        for (let r = 0; r < 18; r++) {
          const a = (r / 18 + 0.03) * Math.PI * 2;
          fw.circle(Math.cos(a) * 140, Math.sin(a) * 140, 5).fill(0xffffff);
        }
        fw.position.set(x, y);
        fw.blendMode = 'add';
        c.back.addChild(fw);
        gsap.fromTo(fw.scale, { x: 0.1, y: 0.1 }, { x: 1.3, y: 1.3, duration: 0.7, ease: 'power3.out' });
        gsap.to(fw, { alpha: 0, delay: 0.4, duration: 0.7, onComplete: () => fw.destroy() });
        sfx('boom', 1.5 + i * 0.1);
      }),
    );
    cheer(c, '¡ESTO VA A SER CANCIÓN!', PINK, 90, 2);
    drizzle(c, c.fg, () => sequin(Math.floor(Math.random() * 4)), 0.18, 3.2);
  },
};
