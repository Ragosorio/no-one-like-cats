/**
 * LA ÚLTIMA RONDA — the bar and its alley, drawn in code in the Borracha's TV-cartoon style (tv.ts). Shared by the bar
 * scene (scenes/CajaScene.ts: sets 'bar' and 'calle') and the Momento «Drunck» (its present is this same bar).
 *
 * BAR (world px; the TV camera stands BEHIND the counter, a fixed sitcom shot):
 *   back wall (night-blue wallpaper, wainscot), the entrance door and the bathroom door on the left, a rainy window, the
 *   «APLAUSOS» lightbox (it lights up; no laugh track ever plays), pendant lamps, a beer neon, shelves of bottles, the
 *   tally board; the patrons sit on the far side of the counter (their bellies against it); the counter top runs across
 *   the bottom third and hides them from the belly down; under it, the bartender side's shelves.
 *   RULE OF THE LISTENER: nothing to the right of BAR.hideX is ever drawn before the reveal (no shadow, no reflection:
 *   there are no mirrors in this bar) — the scene clamps its camera to it too.
 * CALLE: the bar's facade (the neon «LA ÚLTIMA RONDA», whose last A flickers), a wet alley running right with lamp
 *   posts and puddles, and at the far end a cat flap painted on a wall with a tiny lighthouse drawn next to it.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { LW, TV, box, disc, donut, shape } from './tv';

import { BAR, CALLE } from './layout';
export { BAR, CALLE } from './layout';

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** a TV-cartoon text sprite (built once; never mid-performance) */
export function tvText(text: string, size: number, fill: number, o: { font?: string; stroke?: number; strokeW?: number; weight?: string; spacing?: number; italic?: boolean } = {}): Text {
  const t = new Text({
    text,
    style: {
      fontFamily: o.font ?? 'Bangers',
      fontSize: size,
      fill,
      fontWeight: (o.weight ?? 'normal') as 'normal',
      fontStyle: o.italic ? 'italic' : 'normal',
      letterSpacing: o.spacing ?? 2,
      stroke: o.stroke === undefined ? { color: TV.line, width: o.strokeW ?? 8, join: 'round' } : { color: o.stroke, width: o.strokeW ?? 8, join: 'round' },
      align: 'center',
    },
    resolution: 2,
  });
  t.anchor.set(0.5);
  return t;
}

// ================================================================== THE BAR
export class BarSet {
  readonly root = new Container();
  /** behind the patrons */
  readonly back = new Container();
  /** the patrons (the scene puts its actors here) */
  readonly cast = new Container();
  /** on the counter (mugs, the donut tower, the plate): over the patrons */
  readonly props = new Container();
  /** the counter top + the bartender side: hides the patrons from the belly down */
  readonly front = new Container();
  /** effects over everything (onomatopoeias, snore bubbles) */
  readonly fx = new Container();
  /** right of hideX: built only at the reveal */
  readonly secret = new Container();
  private rainG = new Graphics();
  private lampsG = new Graphics();
  private applauseOn = new Graphics();
  private neonG = new Graphics();
  private labels: Graphics[] = [];
  private blankLabels: Graphics[] = [];
  private fridgeGlow = new Graphics();
  private tvScreen = new Graphics();
  private tvLines = new Graphics();
  private graffiti = new Container();
  /** 0..1: the bottle labels turned into blank pages (the Momento's first hiccup) */
  blank = 0;
  /** the «APLAUSOS» box is lit */
  applause = 0;
  /**
   * The Momento «Drunck» takes over two objects of the bar (opt-in; the bar scene never sets them): the window neon
   * (it bends into the galleon) and the TV (it shows your lighthouse). While set, the set doesn't draw its own.
   */
  neonOff = false;
  tvOff = false;

  constructor() {
    this.root.addChild(this.back, this.cast, this.secret, this.props, this.front, this.fx);
    this.secret.visible = false;
    this.drawBack();
    this.drawFront();
  }

  private drawBack() {
    const b = this.back;
    const g = new Graphics();
    const { left, right, top, counterBack } = BAR;
    // wallpaper: night blue with darker vertical stripes and a little diamond pattern
    g.rect(left, top, right - left, counterBack + 80 - top).fill(TV.night);
    for (let x = left; x < right; x += 90) g.rect(x, top, 34, counterBack + 80 - top).fill(TV.nightD);
    for (let x = left + 62; x < right; x += 90) for (let y = top + 40; y < 470; y += 110) g.poly([x, y - 12, x + 10, y, x, y + 12, x - 10, y]).fill(TV.nightL);
    // wainscot (wood) and its rail
    g.rect(left, 480, right - left, counterBack + 80 - 480).fill(TV.woodD);
    for (let x = left; x < right; x += 140) g.rect(x + 8, 500, 124, counterBack + 60 - 500).fill(TV.wood).stroke({ width: LW * 0.7, color: TV.line });
    g.rect(left, 462, right - left, 26).fill(TV.woodL).stroke({ width: LW, color: TV.line });
    b.addChild(g);
    // --- the entrance door (left) with its little window: rain outside
    const door = new Graphics();
    box(door, -980, 120, 300, 560, TV.green, { shadow: TV.greenD });
    box(door, -930, 170, 200, 170, TV.nightD);
    door.rect(-930, 255, 200, 6).fill(TV.line).rect(-833, 170, 6, 170).fill(TV.line);
    disc(door, -720, 420, 16, TV.amberL);
    b.addChild(door);
    // --- the bathroom door «BAÑO» (c29: the graffiti)
    const wc = new Graphics();
    box(wc, -560, 160, 250, 520, TV.pink, { shadow: TV.pinkD });
    box(wc, -510, 210, 150, 90, TV.cream);
    b.addChild(wc);
    const wcT = tvText('BAÑO', 46, TV.pinkD, { stroke: TV.line, strokeW: 4 });
    wcT.position.set(-435, 255);
    b.addChild(wcT, this.graffiti);
    this.graffiti.position.set(-435, 470);
    // --- the rainy window (big, behind the counter's left half) + the rain outside
    const win = new Graphics();
    box(win, -170, 80, 640, 360, TV.nightD, { shadow: TV.line, r: 4 });
    win.rect(-170, 250, 640, 10).fill(TV.line).rect(140, 80, 10, 360).fill(TV.line);
    // the city outside: a far skyline in flat blue blocks with a few lit windows
    const sky = new Graphics();
    for (let i = 0; i < 9; i++) {
      const w = 50 + rnd(i) * 60;
      const h = 60 + rnd(i + 9) * 150;
      const x = -160 + i * 72;
      sky.rect(x, 436 - h, w, h).fill(i % 2 ? 0x22306a : 0x1a2558);
      for (let j = 0; j < 3; j++) if (rnd(i * 7 + j) > 0.5) sky.rect(x + 10 + j * 14, 436 - h + 20 + j * 26, 8, 12).fill(TV.amberL);
    }
    const mask = new Graphics().rect(-166, 84, 632, 352).fill(0xffffff);
    sky.mask = mask;
    this.rainG.mask = mask.clone();
    b.addChild(win, mask, sky, this.rainG.mask as Graphics, this.rainG);
    win.rect(-170, 250, 640, 10).fill(TV.line);
    // the beer neon (a mug outline) in the window
    b.addChild(this.neonG);
    // --- «APLAUSOS» lightbox (a sitcom with canned laughter that never sounds)
    const ap = new Graphics();
    box(ap, -930, -10, 380, 92, 0x3a2030, { shadow: TV.line });
    const apT = tvText('APLAUSOS', 56, 0x5a3040, { stroke: TV.line, strokeW: 4 });
    apT.position.set(-740, 36);
    this.applauseOn.alpha = 0;
    this.applauseOn.roundRect(-922, -2, 364, 76, 6).fill(0xff3b5c);
    const apT2 = tvText('APLAUSOS', 56, TV.cream, { stroke: 0xb0102e, strokeW: 4 });
    apT2.position.set(-740, 36);
    const apOn = new Container();
    apOn.addChild(this.applauseOn, apT2);
    apOn.alpha = 0;
    b.addChild(ap, apT, apOn);
    this.applauseC = apOn;
    // --- shelves with bottles (center-left wall): their labels turn into blank pages
    const sh = new Graphics();
    for (const sy of [190, 320]) {
      box(sh, 560, sy, 520, 22, TV.woodL, { shadow: TV.woodD, r: 3 });
    }
    b.addChild(sh);
    const bottles = new Graphics();
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 7; i++) {
        const x = 590 + i * 70 + (row ? 30 : 0);
        const y = row ? 320 : 190;
        const col = [TV.green, TV.amberD, TV.greenD, TV.pinkD, TV.green, TV.amber, TV.greenD][(i + row * 3) % 7];
        const h = 92 + ((i * 13 + row * 7) % 4) * 10;
        shape(bottles, [x - 20, y, x - 20, y - h + 40, x - 8, y - h + 20, x - 8, y - h, x + 8, y - h, x + 8, y - h + 20, x + 20, y - h + 40, x + 20, y], col);
        const lab = new Graphics().rect(x - 16, y - 60, 32, 30).fill(TV.cream).stroke({ width: 3, color: TV.line });
        lab.rect(x - 10, y - 52, 20, 5).fill(TV.pinkD).rect(x - 10, y - 42, 14, 4).fill(TV.amberD);
        const blank = new Graphics().rect(x - 18, y - 64, 36, 38).fill(TV.white).stroke({ width: 3, color: TV.line });
        blank.moveTo(x - 18, y - 64).lineTo(x - 8, y - 54).stroke({ width: 2, color: TV.chromeD });
        blank.alpha = 0;
        this.labels.push(lab);
        this.blankLabels.push(blank);
      }
    }
    b.addChild(bottles, ...this.labels, ...this.blankLabels);
    // --- the tally board («CUENTAS»): tally marks, no names
    const tb = new Graphics();
    box(tb, -260, -10, 300, 70, TV.woodD, { r: 4 });
    box(tb, 100, 40, 300, 150, 0x203a2c, { shadow: TV.line, r: 4 });
    for (let i = 0; i < 14; i++) {
      const gx = 128 + Math.floor(i / 5) * 72 + (i % 5) * 12;
      if (i % 5 === 4) tb.moveTo(gx - 52, 150).lineTo(gx + 4, 100).stroke({ width: 4, color: TV.cream });
      else tb.moveTo(gx, 100).lineTo(gx, 156).stroke({ width: 4, color: TV.cream });
    }
    b.addChild(tb);
    const tbT = tvText('CUENTAS', 30, TV.cream, { font: 'Permanent Marker', stroke: 0x203a2c, strokeW: 2 });
    tbT.position.set(250, 70);
    const sp = tvText('LA ÚLTIMA RONDA', 34, TV.amberL, { font: 'Bangers', strokeW: 5 });
    sp.position.set(-110, 25);
    b.addChild(tbT, sp);
    // --- the TV set in the corner (static / a fish show)
    const tvb = new Graphics();
    box(tvb, 1180, 70, 230, 170, 0x6a5a4a, { shadow: TV.line, r: 14 });
    tvb.rect(1290, 240, 12, 40).fill(TV.line);
    // the TV's scanlines: drawn once, over the screen
    for (let y = 90; y < 222; y += 8) this.tvLines.rect(1196, y, 198, 2).fill({ color: TV.line, alpha: 0.18 });
    b.addChild(tvb, this.tvScreen, this.tvLines);
    // --- the fridge (it hums: its glow breathes)
    const fr = new Graphics();
    box(fr, -1080, 220, 200, 470, TV.chrome, { shadow: TV.chromeD, r: 10 });
    box(fr, -1060, 250, 160, 300, 0x9fd6ff, { r: 6 });
    for (let i = 0; i < 3; i++) fr.rect(-1060, 320 + i * 80, 160, 6).fill(TV.line);
    for (let i = 0; i < 9; i++) {
      const x = -1045 + (i % 5) * 30;
      const y = 300 + Math.floor(i / 5) * 80;
      fr.roundRect(x, y - 40, 14, 40, 4).fill(i % 2 ? TV.green : TV.amberD).stroke({ width: 3, color: TV.line });
    }
    this.fridgeGlow.roundRect(-1060, 250, 160, 300, 6).fill({ color: 0xcff0ff, alpha: 1 });
    b.addChild(fr, this.fridgeGlow);
    // --- a cat-shaped dartboard and a poster (right part of the room; still left of hideX)
    const dart = new Graphics();
    disc(dart, 1500, 300, 70, TV.cream);
    disc(dart, 1500, 300, 48, TV.pink);
    disc(dart, 1500, 300, 22, TV.green);
    dart.poly([1450, 246, 1462, 210, 1478, 236]).fill(TV.cream).stroke({ width: LW, color: TV.line });
    dart.poly([1522, 236, 1538, 210, 1550, 246]).fill(TV.cream).stroke({ width: LW, color: TV.line });
    b.addChild(dart);
    // --- pendant lamps with their warm cones
    b.addChild(this.lampsG);
  }
  private applauseC!: Container;

  private drawFront() {
    const f = this.front;
    const g = new Graphics();
    const { left, right, counterBack, counterFront, floor } = BAR;
    // the counter top (the patrons' side edge is the back edge)
    g.rect(left, counterBack, right - left, counterFront - counterBack).fill(TV.woodL);
    g.rect(left, counterBack, right - left, 10).fill(TV.amberL);
    g.moveTo(left, counterBack).lineTo(right, counterBack).stroke({ width: LW, color: TV.line });
    g.rect(left, counterFront, right - left, 26).fill(TV.wood);
    g.moveTo(left, counterFront).lineTo(right, counterFront).stroke({ width: LW, color: TV.line });
    g.moveTo(left, counterFront + 26).lineTo(right, counterFront + 26).stroke({ width: LW, color: TV.line });
    // wood grain (a few long flat strokes)
    for (let i = 0; i < 18; i++) {
      const x = left + rnd(i) * (right - left);
      g.moveTo(x, counterBack + 24 + rnd(i + 3) * 30).lineTo(x + 120 + rnd(i + 5) * 160, counterBack + 24 + rnd(i + 3) * 30).stroke({ width: 3, color: TV.wood });
    }
    // the bartender side: dark cabinets with glasses and bottles (one hard shadow)
    g.rect(left, counterFront + 26, right - left, floor - counterFront).fill(TV.woodD);
    for (let x = left + 20; x < right; x += 260) {
      box(g, x, counterFront + 60, 230, 150, 0x4a2414, { r: 4 });
      for (let i = 0; i < 4; i++) {
        const gx = x + 30 + i * 52;
        g.roundRect(gx, counterFront + 110, 36, 90, 6).fill({ color: TV.chrome, alpha: 0.35 }).stroke({ width: 3, color: TV.line });
      }
      box(g, x, counterFront + 230, 230, 140, 0x4a2414, { r: 4 });
      disc(g, x + 115, counterFront + 300, 10, TV.amberL);
    }
    f.addChild(g);
    // beer taps (their handles stand on the counter): left of Canelo
    const taps = new Graphics();
    for (const [i, x] of [700, 780, 860].entries()) {
      taps.rect(x - 8, counterBack - 50, 16, 56).fill(TV.chrome).stroke({ width: 4, color: TV.line });
      box(taps, x - 16, counterBack - 150, 32, 104, [TV.amber, TV.green, TV.pink][i], { r: 10 });
    }
    f.addChild(taps);
    // the little plate of fries (B4) in front of Canelo
    const plate = new Graphics();
    plate.ellipse(1060, counterBack + 26, 70, 18).fill(TV.cream).stroke({ width: LW, color: TV.line });
    for (let i = 0; i < 7; i++) plate.roundRect(1010 + i * 14, counterBack + 6 - (i % 3) * 6, 10, 26, 3).fill(TV.amberL).stroke({ width: 3, color: TV.line });
    this.plate = plate;
    f.addChild(plate);
  }
  plate!: Graphics;

  /** built at the reveal only: the counter's right part with Hipólito's donut and the tower */
  buildSecret() {
    this.secret.visible = true;
    if (this.secretBuilt) return;
    this.secretBuilt = true;
    const g = new Graphics();
    // the tower of donuts on a cake stand
    const { tower, counterBack } = BAR;
    g.rect(tower.x - 8, counterBack - 30, 16, 40).fill(TV.chrome).stroke({ width: 4, color: TV.line });
    g.ellipse(tower.x, counterBack - 34, 110, 18).fill(TV.chrome).stroke({ width: LW, color: TV.line });
    this.secret.addChildAt(g, 0);
  }
  private secretBuilt = false;

  /** the bar's graffiti (c29: «NINGUNA CAJA ES HOGAR» sprayed on the bathroom door) */
  graffitiText(on: boolean) {
    if (on && !this.graffiti.children.length) {
      const t = tvText('NINGUNA CAJA\nES HOGAR', 40, TV.neonBlue, { font: 'Permanent Marker', stroke: TV.line, strokeW: 6 });
      t.rotation = -0.12;
      this.graffiti.addChild(t);
    }
    this.graffiti.visible = on;
  }

  /** per frame: rain, the lamps' cones, the neon, the fridge hum, the TV static, the applause box */
  update(t: number, o: { kick?: number; lamp?: number } = {}) {
    // rain on the window (diagonal cartoon streaks, a loop: a pure function of time)
    const r = this.rainG;
    r.clear();
    for (let i = 0; i < 46; i++) {
      const sp = 900 + rnd(i) * 500;
      const x0 = -200 + rnd(i + 50) * 720;
      const y = ((rnd(i + 99) * 400 + t * sp) % 420) + 60;
      const x = x0 - (y - 60) * 0.22;
      r.moveTo(x, y).lineTo(x - 10, y + 36).stroke({ width: 4, color: TV.rain, alpha: 0.85 });
    }
    // pendant lamps: warm flat cones; they sway a hair (and jump a frame with a kick)
    const lg = this.lampsG;
    lg.clear();
    const kick = o.kick ?? 0;
    for (const [i, x] of [-300, 420, 1060].entries()) {
      const sw = Math.sin(t * 0.9 + i) * 6 + kick * 8;
      const lx = x + sw;
      lg.moveTo(x, BAR.top).lineTo(lx, 70).stroke({ width: 4, color: TV.line });
      lg.poly([lx - 280, BAR.counterBack + 40, lx - 36, 104, lx + 36, 104, lx + 280, BAR.counterBack + 40]).fill({ color: TV.amberL, alpha: 0.13 + 0.05 * (o.lamp ?? 0) });
      shape(lg, [lx - 52, 112, lx - 26, 66, lx + 26, 66, lx + 52, 112], TV.green);
      lg.ellipse(lx, 114, 26, 9).fill(TV.amberL);
    }
    // the window neon: a mug outline, pink + blue tubes, a soft buzz
    const ng = this.neonG;
    ng.clear();
    if (!this.neonOff) {
    const buzz = 0.82 + 0.18 * Math.sin(t * 23) * Math.sin(t * 7.1);
    ng.roundRect(30, 300, 90, 110, 12).stroke({ width: 10, color: TV.neonPink, alpha: 0.35 * buzz });
    ng.roundRect(30, 300, 90, 110, 12).stroke({ width: 4, color: 0xffd0e6, alpha: buzz });
    ng.roundRect(116, 322, 30, 56, 10).stroke({ width: 4, color: 0xffd0e6, alpha: buzz });
    ng.moveTo(28, 300).bezierCurveTo(50, 270, 100, 270, 122, 300).stroke({ width: 4, color: 0xc8f2ff, alpha: buzz });
    }
    // the fridge hum: its light breathes
    this.fridgeGlow.alpha = 0.18 + 0.08 * Math.sin(t * 2.2);
    // the TV: a fish show in two tones, with scanlines (a cartoon inside the cartoon)
    const tv = this.tvScreen;
    tv.clear();
    if (!this.tvOff) {
    tv.roundRect(1196, 86, 198, 138, 12).fill(0x3fa0c8);
    const fx = 1230 + ((t * 40) % 170);
    tv.ellipse(fx, 160, 26, 14).fill(TV.amber).stroke({ width: 3, color: TV.line });
    tv.poly([fx - 24, 160, fx - 42, 148, fx - 42, 172]).fill(TV.amber).stroke({ width: 3, color: TV.line });
    }
    this.tvLines.visible = !this.tvOff;
    // the applause box (lit = it says so; nobody laughs)
    this.applauseC.alpha = this.applause;
    // labels → blank pages
    const k = this.blank;
    for (let i = 0; i < this.labels.length; i++) {
      const on = k > (i % 7) / 8 ? 1 : 0;
      this.labels[i].alpha = 1 - on;
      this.blankLabels[i].alpha = on;
    }
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

// the alley (StreetSet) lives in street.ts (the Luzterna scene's set, polished on its own); re-exported here
export { StreetSet } from './street';
