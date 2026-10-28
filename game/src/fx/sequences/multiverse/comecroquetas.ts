/**
 * Comecroquetas: the arcade universe. The screen powers on like an old cabinet, «INSERTA UNA CROQUETA», ¡LISTO!, and the
 * chase: a yellow wedge with cat ears chomps a row of kibble around a blue neon maze, four ghost-cats on its tail, the
 * 8-bit score ticking; WAKA WAKA. Payoff: the power kibble — a flash, the ghosts go blue and run, and get eaten one by
 * one (200 · 400 · 800 · 1600); ¡WAKA-MIAU!
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../../core/App';
import { sfx } from '../../../core/audio';
import { type Signature, type SigCtx, alive, backlight, burst, cheer, cover, every, flashOf, later, score, word } from './kit';
import { box, cardLoop, hideDisc, pixelText, ring, scanlines, vignette } from './kitA';

const BLUE = 0x2b3dff;
const YEL = 0xffd521;
const KIBBLE = 0xffb897;
const FRIGHT = 0x2a2ad8;
const GHOSTS = [0xff2a2a, 0xffb8ff, 0x22e6ff, 0xffb852];

/** the ring lane around the cat (clockwise from the top-left corner) */
const X0 = 420;
const Y0 = 215;
const X1 = 1500;
const Y1 = 830;
const LW = X1 - X0;
const LH = Y1 - Y0;
const PER = 2 * (LW + LH);
/** the power kibble sits on the bottom lane, right of center (clear of the lore box, the name and the cheer) */
const D_POW = LW + LH + (X1 - 1150);
/** how far behind the wedge each ghost runs */
const GAPS = [112, 204, 296, 388];
const R_PAC = 44;

type Dir = 0 | 1 | 2 | 3;
/** position along the ring at distance d (0 right, 1 down, 2 left, 3 up) */
function at(d: number): { x: number; y: number; dir: Dir } {
  let k = ((d % PER) + PER) % PER;
  if (k < LW) return { x: X0 + k, y: Y0, dir: 0 };
  k -= LW;
  if (k < LH) return { x: X1, y: Y0 + k, dir: 1 };
  k -= LH;
  if (k < LW) return { x: X1 - k, y: Y1, dir: 2 };
  k -= LW;
  return { x: X0, y: Y1 - k, dir: 3 };
}

/** a maze wall: the classic double neon line */
function wall(g: Graphics, x: number, y: number, w: number, h: number, r = 18, s = 1, color = BLUE) {
  g.roundRect(x, y, w, h, r).stroke({ width: 12 * s, color });
  g.roundRect(x, y, w, h, r).stroke({ width: 4 * s, color: 0x000000 });
}

/** a kibble (the dots of this maze) */
function kibble(g: Graphics, x: number, y: number, s: number) {
  g.roundRect(x - s / 2, y - s / 2, s, s, s * 0.3).fill(KIBBLE);
  if (s > 16) g.circle(x, y, s * 0.16).fill(0xc97a5a);
  return g;
}

/** the wedge: a yellow disc with a chomping mouth and two cat ears (drawn facing right) */
function pac(g: Graphics, r: number, mouth: number) {
  g.clear();
  const ear = (sx: number) => g.poly([sx * r * 0.18, -r * 0.78, sx * r * 0.62, -r * 1.32, sx * r * 0.78, -r * 0.5]).fill(YEL);
  ear(-1);
  ear(1);
  const m = Math.max(0.02, mouth) * 0.85;
  g.moveTo(0, 0).arc(0, 0, r, m, Math.PI * 2 - m).closePath().fill(YEL);
  g.circle(r * 0.12, -r * 0.5, r * 0.12).fill(0x000000);
}

/** a ghost-cat: dome, wavy skirt (2 frames), little ears; eyes look along `dir`; `fright` = blue and scared, `eyes` = eaten */
function ghost(g: Graphics, r: number, color: number, dir: Dir, frame: number, fright: boolean, eyesOnly = false, blink = false) {
  g.clear();
  const body = fright ? (blink ? 0xffffff : FRIGHT) : color;
  if (!eyesOnly) {
    g.poly([-r * 0.86, -r * 0.55, -r * 0.62, -r * 1.25, -r * 0.2, -r * 0.82]).poly([r * 0.86, -r * 0.55, r * 0.62, -r * 1.25, r * 0.2, -r * 0.82]).fill(body);
    const pts: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI + (i / 16) * Math.PI;
      pts.push(Math.cos(a) * r, Math.sin(a) * r - r * 0.1);
    }
    const teeth = 4;
    const by = r * 0.92;
    for (let i = 0; i <= teeth * 2; i++) {
      const x = r - (i / (teeth * 2)) * r * 2;
      const up = (i + frame) % 2 === 0;
      pts.push(x, up ? by - r * 0.28 : by);
    }
    g.poly(pts).fill(body);
  }
  if (fright && !eyesOnly) {
    const face = blink ? 0xff2a2a : 0xffd0b0;
    g.rect(-r * 0.42, -r * 0.42, r * 0.22, r * 0.22).rect(r * 0.2, -r * 0.42, r * 0.22, r * 0.22).fill(face);
    const m: number[] = [];
    for (let i = 0; i <= 6; i++) m.push(-r * 0.6 + (i / 6) * r * 1.2, r * 0.22 + (i % 2 ? -r * 0.12 : 0));
    g.moveTo(m[0], m[1]);
    for (let i = 2; i < m.length; i += 2) g.lineTo(m[i], m[i + 1]);
    g.stroke({ width: r * 0.1, color: face });
    return;
  }
  const dx = [1, 0, -1, 0][dir];
  const dy = [0, 1, 0, -1][dir];
  for (const sx of [-1, 1]) {
    g.ellipse(sx * r * 0.36 + dx * r * 0.12, -r * 0.28 + dy * r * 0.1, r * 0.26, r * 0.32).fill(0xffffff);
    g.circle(sx * r * 0.36 + dx * r * 0.24, -r * 0.26 + dy * r * 0.22, r * 0.14).fill(0x2121de);
  }
}

/** the maze: black screen, neon walls around the ring lane and side blocks, decorative kibble in the side lanes */
function maze(): { k: Container; walls: Graphics } {
  const k = new Container();
  k.addChild(cover(0x000000));
  const g = new Graphics();
  wall(g, X0 - 64, Y0 - 64, LW + 128, LH + 128, 30, 1, 0xffffff);
  wall(g, X0 + 64, Y0 + 64, LW - 128, LH - 128, 24, 1, 0xffffff);
  for (const x of [70, W - 290]) {
    wall(g, x, 215, 220, 110, 18, 1, 0xffffff);
    wall(g, x, 395, 220, 66, 18, 1, 0xffffff);
    wall(g, x, 531, 220, 110, 18, 1, 0xffffff);
    wall(g, x, 711, 220, 119, 18, 1, 0xffffff);
  }
  // the tunnels: openings on the sides, with the classic stubs
  g.rect(0, 452, 40, 6).fill(0xffffff).rect(W - 40, 452, 40, 6).fill(0xffffff);
  g.tint = BLUE;
  k.addChild(g);
  const dots = new Graphics();
  for (const y of [360, 496, 676]) for (let x = 46; x < 340; x += 40) {
    kibble(dots, x, y, 10);
    kibble(dots, W - x, y, 10);
  }
  for (let y = 240; y < 820; y += 40) {
    kibble(dots, 330, y, 10);
    kibble(dots, W - 330, y, 10);
  }
  k.addChild(dots);
  return { k, walls: g };
}

/** a score popup in cyan pixels (200 · 400 …) rising from (x,y) */
function popup(c: SigCtx, text: string, x: number, y: number) {
  const g = pixelText(new Graphics(), text, 0, 0, 7, 0x22e6ff, 'center');
  g.position.set(x, y - 24);
  c.fg.addChild(g);
  if (c.reduce) {
    later(c, 1.4, () => g.destroy());
    return;
  }
  gsap.to(g, { y: y - 70, duration: 1.0, ease: 'power1.out' });
  gsap.to(g, { alpha: 0, delay: 0.8, duration: 0.3, onComplete: () => g.destroy() });
}

interface Arcade {
  /** switch the ghosts to blue and turn the chase around */
  power(): void;
}
const state = new WeakMap<SigCtx, Arcade>();

export const comecroquetas: Signature = {
  dark: true,
  frame: YEL,
  tag: 'UNIVERSO ARCADE',
  open(c: SigCtx) {
    if (c.short || c.reduce) hideDisc(c, 0.15);
    const { k, walls } = maze();
    c.back.addChild(k);
    const lane = new Graphics();
    k.addChild(lane);
    const pow = new Graphics();
    kibble(pow, 0, 0, 30);
    const pp = at(D_POW);
    pow.position.set(pp.x, pp.y);
    k.addChild(pow);
    const glow = backlight(0x4a64ff, 340, 0.85);
    glow.position.set(W / 2, c.catY);
    c.behind.addChild(glow);
    const actors = new Container();
    k.addChild(actors);
    const hud = new Graphics();
    k.addChild(hud);
    k.addChild(scanlines(W, H, 4, 0.22), vignette(W, H, 0x000000, 0.6));

    // the pellets around the ring: eaten as the wedge passes
    const pellets: number[] = [];
    for (let d = 20; d < PER; d += 40) if (Math.abs(d - D_POW) > 30) pellets.push(d);
    let eaten = -1;
    const drawPellets = (upTo: number) => {
      lane.clear();
      for (const d of pellets) {
        if (d <= upTo) continue;
        const p = at(d);
        kibble(lane, p.x, p.y, 15);
      }
    };
    let pts = 0;
    let shownPts = -1;
    let blinkOn = true;
    let record = false;
    const drawHud = () => {
      hud.clear();
      if (blinkOn) pixelText(hud, '1UP', 70, 30, 6, 0xff3b3b);
      pixelText(hud, String(pts).padStart(6, '0'), 70, 82, 6, 0xffffff);
      pixelText(hud, record ? '¡NUEVO RÉCORD!' : 'RÉCORD', W / 2, 30, 6, record ? YEL : 0xffffff, 'center');
      pixelText(hud, String(Math.max(pts, 9990)).padStart(6, '0'), W / 2, 82, 6, 0xffffff, 'center');
      // the lives: two little wedges, bottom left
      for (let i = 0; i < 2; i++) {
        hud.moveTo(80 + i * 64, 1012).arc(80 + i * 64, 1012, 20, Math.PI + 0.6, Math.PI * 3 - 0.6).closePath().fill(YEL);
      }
    };
    drawHud();

    const pg = new Graphics();
    const gs = GHOSTS.map(() => new Graphics());
    actors.addChild(...gs, pg);
    pg.visible = false;
    gs.forEach((g) => (g.visible = false));

    // the clock: the wedge reaches the power kibble right when the color fills (payoff)
    const tPay = c.short ? 0.55 : 4.2;
    const tStart = c.short ? -10 : 1.25;
    const V = c.short ? 700 : D_POW / (tPay - tStart);
    /** power mode: the wedge grows */
    const sz = { v: 1 };
    let mode: 'chase' | 'power' = 'chase';
    let tp = 0;
    let dPow = D_POW;
    const caught = [false, false, false, false];
    const gone = [false, false, false, false];
    let lastWaka = 0;
    let wakaHi = false;
    let tNow = 0;

    const draw = (t: number) => {
      if (pg.destroyed) return;
      tNow = t;
      const frame = Math.floor(t * 8) % 2;
      let dC: number;
      if (mode === 'chase') {
        dC = Math.min(D_POW, D_POW - V * (tPay - Math.max(t, tStart)));
      } else {
        dC = dPow - V * 1.5 * (t - tp);
      }
      const P = at(dC);
      const dir: Dir = mode === 'power' ? (((P.dir + 2) % 4) as Dir) : P.dir;
      const atPow = mode === 'chase' && dC >= D_POW - 1;
      pac(pg, R_PAC, c.reduce ? 0.35 : atPow ? 0.5 : Math.abs(Math.sin(t * Math.PI * 7)) * 0.55);
      pg.position.set(P.x, P.y);
      pg.rotation = dir === 1 ? Math.PI / 2 : dir === 3 ? -Math.PI / 2 : 0;
      pg.scale.set(dir === 2 ? -sz.v : sz.v, sz.v);
      // pellets + score + waka
      if (mode === 'chase') {
        const upTo = dC;
        const n = pellets.filter((d) => d <= upTo).length;
        if (n !== eaten) {
          if (eaten >= 0 && n > eaten) {
            pts += (n - eaten) * 10;
            if (!c.reduce && t - lastWaka > 0.12 && alive(c)) {
              sfx('pop', wakaHi ? 1.7 : 1.3);
              wakaHi = !wakaHi;
              lastWaka = t;
            }
          }
          eaten = n;
          drawPellets(upTo);
        }
      }
      // ghosts
      for (let i = 0; i < 4; i++) {
        const g = gs[i];
        if (gone[i]) continue;
        let dG: number;
        if (mode === 'chase') dG = dC - GAPS[i];
        else dG = dPow - GAPS[i] - V * 0.45 * (t - tp);
        if (mode === 'power' && !caught[i] && dC <= dG + 12 + R_PAC * (sz.v - 1)) {
          caught[i] = true;
          const at0 = at(dG);
          const val = [200, 400, 800, 1600][caught.filter(Boolean).length - 1];
          pts += val;
          popup(c, String(val), at0.x, at0.y);
          sfx('nyam', 1.2 + i * 0.12);
          sfx('coin', 1.3 + i * 0.15);
          c.shaker.add(0.12);
          // the eyes fly home (behind the cat)
          ghost(g, R_PAC, GHOSTS[i], 3, 0, false, true);
          if (c.reduce) gone[i] = true;
          else {
            gone[i] = true;
            gsap.to(g, { x: W / 2, y: c.CY + 40, duration: 0.55, ease: 'power1.in', onComplete: () => !g.destroyed && (g.visible = false) });
          }
          continue;
        }
        const Q = at(dG);
        const gdir: Dir = mode === 'power' ? (((Q.dir + 2) % 4) as Dir) : Q.dir;
        const blink = mode === 'power' && t - tp > 1.6 && Math.floor(t * 6) % 2 === 0 && c.flashes;
        ghost(g, R_PAC, GHOSTS[i], gdir, frame, mode === 'power', false, blink);
        g.position.set(Q.x, Q.y + Math.sin(t * 10 + i) * (c.reduce ? 0 : 1.5));
      }
      if (shownPts !== pts) {
        shownPts = pts;
        drawHud();
      }
    };

    const show = () => {
      pg.visible = true;
      gs.forEach((g) => (g.visible = true));
    };
    // the power kibble blinks (a small, slow blink; steady under Reducir destellos)
    if (!c.reduce && c.flashes) every(c, 5, () => !pow.destroyed && (pow.visible = !pow.visible && mode === 'chase'));

    state.set(c, {
      power() {
        if (mode === 'power') return;
        mode = 'power';
        tp = tNow;
        const dNow = Math.min(D_POW, D_POW - V * (tPay - Math.max(tNow, tStart)));
        dPow = c.reduce ? D_POW : dNow;
        if (!pow.destroyed) pow.visible = false;
        pts += 50;
        if (!c.reduce) gsap.to(sz, { v: 1.75, duration: 0.3, ease: 'back.out(2.5)' });
        // the maze flashes white (Reducir destellos: it stays blue)
        if (!c.reduce && c.flashes) {
          for (let i = 0; i < 6; i++) later(c, i * 0.12, () => !walls.destroyed && (walls.tint = i % 2 ? BLUE : 0xffffff));
        }
        if (!c.reduce) {
          const p0 = at(dPow);
          burst(c, c.fg, () => kibble(new Graphics(), 0, 0, 18), 16, p0.x, p0.y, 520, 0.9);
        }
        // the still frame: the ghosts go blue where they are, and the wedge is fed
        if (c.reduce) draw(tNow);
        later(c, c.reduce ? 0.2 : 0.75, () => {
          record = true;
          if (!c.reduce && c.flashes) every(c, 4, () => !hud.destroyed && ((blinkOn = !blinkOn), drawHud()));
          drawHud();
        });
      },
    });

    if (c.reduce) {
      // still: the chase frozen mid-ring, the wedge on its way to the power kibble
      show();
      draw(c.short ? 0 : 2.4);
      return;
    }
    every(c, 60, draw);
    if (c.short) {
      show();
      return;
    }

    // a giant wedge chomps across the screen, eating the paper: the maze is behind it
    // (behind the silhouette, so the cat that just broke out stays in view)
    const big = new Graphics();
    c.back.addChild(big);
    const wipe = new Graphics();
    c.back.addChild(wipe);
    k.mask = wipe;
    const bx = { x: -700 };
    const drawBig = () => {
      if (big.destroyed || wipe.destroyed) return;
      pac(big, 640, Math.abs(Math.sin(((bx.x + 700) / (W + 1500)) * Math.PI * 3)) * 0.6 + 0.04);
      big.position.set(bx.x, H / 2);
      wipe.clear().rect(0, 0, Math.max(1, bx.x), H).fill(0xffffff);
      if (bx.x > W / 2 - 200) hideDisc(c, 0.05);
    };
    drawBig();
    gsap.to(bx, {
      x: W + 760,
      duration: 0.62,
      ease: 'power1.in',
      onUpdate: drawBig,
      onComplete: () => {
        if (k.destroyed) return;
        k.mask = null;
        wipe.destroy();
        big.destroy();
      },
    });
    score(c, [
      [0.0, 'whoosh', 0.7],
      [0.08, 'nyam', 0.6],
      [0.3, 'nyam', 0.55],
      [0.5, 'nyam', 0.5],
    ]);
    later(c, 0.42, () => c.shaker.add(0.25));
    // «INSERTA UNA CROQUETA» (blinks), the kibble goes in: CRÉDITO 1
    const ins = new Graphics();
    c.fg.addChild(ins);
    const drawIns = (s: string, col: number) => {
      if (ins.destroyed) return;
      ins.clear();
      pixelText(ins, s, W / 2, 935, 6, col, 'center');
    };
    ins.visible = false;
    let blink = () => {};
    later(c, 0.3, () => {
      ins.visible = true;
      drawIns('INSERTA UNA CROQUETA', 0xffffff);
      blink = every(c, 8, () => !ins.destroyed && (ins.alpha = ins.alpha > 0.5 ? 0.15 : 1));
    });
    later(c, 0.8, () => {
      blink();
      ins.alpha = 1;
      drawIns('CRÉDITO 1', YEL);
      sfx('coin', 1);
    });
    later(c, 1.6, () => gsap.to(ins, { alpha: 0, duration: 0.2, onComplete: () => ins.destroy() }));
    // ¡LISTO! (the actors appear, frozen), then the chase
    const ready = pixelText(new Graphics(), '¡LISTO!', W / 2, Y1 - 24, 7, YEL, 'center');
    ready.visible = false;
    c.fg.addChild(ready);
    later(c, 0.9, () => {
      ready.visible = true;
      show();
    });
    later(c, 1.45, () => ready.destroy());
    score(c, [
      [0.9, 'tick', 1.0],
      [0.97, 'tick', 1.26],
      [1.04, 'tick', 1.5],
      [1.11, 'tick', 2.0],
    ]);
    later(c, 1.55, () => word(c, W / 2 + 470, 420, 'WAKA WAKA', YEL, 104, 1.2));
  },
  payoff(c: SigCtx) {
    const s = state.get(c);
    s?.power();
    const pp = at(D_POW);
    flashOf(c, 0xcfd6ff, 0.75, 0.45);
    ring(c, c.fg, pp.x, pp.y, YEL, 40, 9, 14, 0.6);
    ring(c, c.fg, pp.x, pp.y, BLUE, 40, 6, 10, 0.8);
    sfx('levelup', 1.2);
    sfx('gem', 0.8);
    c.shaker.add(0.35);
    cheer(c, '¡WAKA-MIAU!', YEL, 130, 1.8);
    if (c.reduce) popup(c, '1600', pp.x, pp.y - 90);
    else later(c, 0.8, () => sfx('fanfare', 1.4));
  },
  card(w: number, h: number, live: boolean) {
    const k = new Container();
    k.addChild(box(w, h, 0x000000));
    const s = Math.min(w, h) / 300;
    // the painting sits at (w/2, 0.54h): a blue glow there, the maze around it, the chase on the bottom lane
    const glow = backlight(0x4a64ff, Math.min(w, h) * 0.42, 0.7);
    glow.position.set(w / 2, h * 0.54);
    k.addChild(glow);
    const g = new Graphics();
    const m = 10 * s;
    const lw = Math.max(0.35, s * 0.6);
    wall(g, m, m + 26 * s, w - m * 2, h - m * 2 - 26 * s, 14 * s, lw);
    const bw = Math.min(w * 0.16, 60 * s);
    wall(g, m + 18 * s, h * 0.3, bw, h * 0.16, 10 * s, lw);
    wall(g, w - m - 18 * s - bw, h * 0.3, bw, h * 0.16, 10 * s, lw);
    wall(g, m + 18 * s, h * 0.54, bw, h * 0.16, 10 * s, lw);
    wall(g, w - m - 18 * s - bw, h * 0.54, bw, h * 0.16, 10 * s, lw);
    k.addChild(g);
    k.addChild(pixelText(new Graphics(), '1UP 003050', m + 4 * s, m + 4 * s, Math.max(1.2, 2.2 * s), 0xffffff));
    const row = h - m - 30 * s;
    const dots = new Graphics();
    const pg = new Graphics();
    const gh = GHOSTS.map(() => new Graphics());
    k.addChild(dots, ...gh, pg);
    const r = 15 * s;
    const span = w + r * 14;
    const draw = (x: number, t: number, fright: boolean) => {
      dots.clear();
      for (let dx = 14 * s; dx < w - 30 * s; dx += 20 * s) if (dx > x + r * 0.3) kibble(dots, dx, row, 6 * s);
      if (!fright) kibble(dots, w - 24 * s, row, 13 * s);
      pac(pg, r, live ? Math.abs(Math.sin(t * 9)) * 0.55 : 0.45);
      pg.position.set(x, row);
      gh.forEach((gg, i) => {
        ghost(gg, r * 0.92, GHOSTS[i], 0, Math.floor(t * 6) % 2, fright);
        gg.position.set(x - (i + 1) * r * 2.5, row + 2 * s);
      });
    };
    draw(w * 0.64, 0, false);
    k.addChild(scanlines(w, h, Math.max(3, 3 * s), 0.2));
    if (live) cardLoop(k, 30, (t) => draw(((w * 0.64 + r * 2 + t * 80 * s) % span) - r * 2, t, false));
    return k;
  },
};
