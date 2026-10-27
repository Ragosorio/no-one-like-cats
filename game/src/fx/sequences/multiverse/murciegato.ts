/** Murciégato: the night universe. A giant bat wipes the screen, his silhouette against a full moon, the signal on the clouds, a swarm of bats; ¡KA-POW! */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { C, F } from '../../../ui/theme';
import { poster } from '../../../ui/widgets';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, cover, every, later, score, starburst, word } from './kit';

const NIGHT = 0x0c1128;
const SIGNAL = 0xffe27a;

/** the emblem: a bat with cat ears (right half mirrored), ~260 wide at s = 1 */
function batShape(g: Graphics, s: number, fill: number) {
  const half: [number, number][] = [
    [0, -28],
    [9, -28],
    [16, -54],
    [25, -26],
    [58, -34],
    [130, -50],
    [112, -12],
    [120, 22],
    [94, 8],
    [72, 34],
    [50, 10],
    [24, 40],
    [0, 60],
  ];
  const pts: number[] = [];
  for (const [x, y] of half) pts.push(x * s, y * s);
  for (let i = half.length - 2; i > 0; i--) pts.push(-half[i][0] * s, half[i][1] * s);
  return g.poly(pts).fill(fill);
}

/** a small flapping bat */
function bat(): Container {
  const b = new Container();
  const g = batShape(new Graphics(), 0.22 + Math.random() * 0.12, 0x05070f);
  b.addChild(g);
  gsap.to(g.scale, { y: 0.35, duration: 0.07 + Math.random() * 0.05, yoyo: true, repeat: -1 });
  return b;
}

/** the night: sky, moon, cloud bank, gothic skyline */
function night(c: SigCtx): { k: Container; moon: Graphics; clouds: Graphics } {
  const k = new Container();
  k.addChild(cover(NIGHT));
  const moon = new Graphics();
  moon.circle(0, 0, 320).fill({ color: 0xf3eccb, alpha: 0.18 });
  moon.circle(0, 0, 300).fill(0xf3eccb);
  for (const [x, y, r] of [
    [-90, -60, 46],
    [70, 40, 64],
    [-40, 130, 30],
    [120, -120, 26],
    [-170, 60, 22],
  ])
    moon.circle(x, y, r).fill(0xddd3a8);
  moon.position.set(W / 2, c.CY);
  k.addChild(moon);
  const clouds = new Graphics();
  for (let i = 0; i < 14; i++) clouds.ellipse(((i * 151) % (W + 300)) - 150, 120 + ((i * 59) % 120), 190, 54).fill({ color: 0x2a3354, alpha: 0.85 });
  k.addChild(clouds);
  const town = new Graphics();
  let x = -10;
  let i = 0;
  while (x < W) {
    const w = 70 + ((i * 41) % 90);
    const h = 160 + ((i * 89) % 300);
    town.rect(x, H - h, w, h);
    if (i % 3 === 0) town.poly([x, H - h, x + w / 2, H - h - 90, x + w, H - h]);
    if (i % 4 === 1) town.rect(x + w / 2 - 6, H - h - 60, 12, 60);
    x += w;
    i++;
  }
  town.fill(0x05070f);
  for (let j = 0; j < 60; j++) town.rect((j * 113) % W, H - 40 - ((j * 71) % 200), 8, 12).fill({ color: 0xffd76a, alpha: 0.7 });
  k.addChild(town);
  return { k, moon, clouds };
}

/** the signal on the clouds: a beam from the street and the emblem in a yellow ellipse */
function signal(): Container {
  const s = new Container();
  const beam = new Graphics().poly([-30, 0, 30, 0, 200, -760, -60, -760]).fill({ color: SIGNAL, alpha: 0.16 });
  beam.position.set(W - 420, H + 20);
  const disc = new Graphics().ellipse(0, 0, 200, 112).fill({ color: SIGNAL, alpha: 0.92 });
  batShape(disc, 1.15, 0x05070f);
  disc.position.set(W - 350, 240);
  disc.rotation = -0.08;
  s.addChild(beam, disc);
  return s;
}

/** a 60s comic burst with a word inside */
function pow(text: string, fill: number, ink: number, r: number): Container {
  const p = new Container();
  p.addChild(starburst(new Graphics(), r, 14, fill));
  const t = poster(text, r * 0.42, ink, { stroke: { color: C.ink, width: r * 0.06 }, fontFamily: F.comic });
  t.anchor.set(0.5);
  p.addChild(t);
  return p;
}

export const murciegato: Signature = {
  dark: true,
  frame: SIGNAL,
  tag: 'UNIVERSO NOCTURNO',
  open(c: SigCtx) {
    const n = night(c);
    gsap.to(c.circle, { alpha: 0, duration: 0 });
    const sig = signal();
    if (c.short) {
      c.back.addChild(n.k, sig);
      return;
    }
    // a giant bat wipes the screen; behind it, the night
    const wipe = batShape(new Graphics(), 9, 0x05070f);
    wipe.position.set(W + 1300, H / 2);
    c.fg.addChild(wipe);
    if (!c.reduce) gsap.to(wipe, { x: -1300, duration: 0.55, ease: 'power1.inOut', onComplete: () => wipe.destroy() });
    else wipe.destroy();
    if (c.reduce) c.back.addChild(n.k);
    else later(c, 0.22, () => c.back.addChild(n.k));
    sfx('whoosh', 0.5);
    // the signal flickers on
    later(c, 0.75, () => {
      c.back.addChild(sig);
      sfx('hit', 0.55);
      sfx('sting', 0.8);
      if (!c.reduce) gsap.fromTo(sig, { alpha: 0 }, { alpha: 1, duration: 0.06, repeat: 4, yoyo: true });
    });
    if (!c.reduce) every(c, 30, (t) => !n.clouds.destroyed && (n.clouds.x = Math.sin(t * 0.25) * 60));
    // the swarm out of the moon
    later(c, 1.25, () => {
      for (let i = 0; i < (c.reduce ? 8 : 34); i++) {
        const b = bat();
        b.position.set(W / 2 + (Math.random() - 0.5) * 120, c.CY + (Math.random() - 0.5) * 120);
        b.scale.set(0.3);
        c.fg.addChild(b);
        const a = Math.random() * Math.PI * 2;
        const d = 900 + Math.random() * 500;
        gsap.to(b.scale, { x: 1 + Math.random(), y: 1 + Math.random(), duration: 1.2 });
        gsap.to(b, { x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d * 0.7, duration: 1 + Math.random() * 0.5, delay: Math.random() * 0.25, ease: 'power1.in', onComplete: () => {
            gsap.killTweensOf(b.children[0].scale);
            b.destroy({ children: true });
          } });
      }
      score(c, [
        [0, 'whoosh', 1.3],
        [0.1, 'tick', 2.8],
        [0.2, 'whoosh', 1.6],
        [0.28, 'tick', 3.2],
        [0.4, 'tick', 2.6],
      ]);
    });
    later(c, 1.7, () => word(c, 360, 300, '¡ZAS!', SIGNAL, 110, 0.9));
  },
  payoff(c: SigCtx) {
    const hits: [string, number, number, number, number][] = [
      ['¡KA-POW!', SIGNAL, C.red, 430, c.CY + 170],
      ['¡ZAS!', C.red, SIGNAL, W - 400, c.CY - 30],
      ['¡BIFF!', C.cyan, C.paper, W - 440, c.CY + 230],
    ];
    hits.forEach(([t, fill, ink, x, y], i) =>
      later(c, i * 0.16, () => {
        const p = pow(t, fill, ink, i === 0 ? 150 : 120);
        p.position.set(x, y);
        p.rotation = (i % 2 ? 0.12 : -0.14) + (Math.random() - 0.5) * 0.08;
        c.fg.addChild(p);
        gsap.fromTo(p.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.14, ease: 'back.out(3)' });
        gsap.to(p, { alpha: 0, delay: 1.5 - i * 0.1, duration: 0.4, onComplete: () => p.destroy({ children: true }) });
        sfx('hit', 0.8 + i * 0.2);
        sfx('boom', 1.2 + i * 0.15);
        c.shaker.add(0.25);
      }),
    );
    // the camera tilts (dutch angle): the universe leans
    if (!c.reduce) {
      c.back.pivot.set(W / 2, H / 2);
      c.back.position.set(W / 2, H / 2);
      gsap.to(c.back, { rotation: -0.06, duration: 0.5, ease: 'back.out(2)' });
      gsap.to(c.back.scale, { x: 1.14, y: 1.14, duration: 0.5 });
    }
  },
};
