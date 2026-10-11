/**
 * LIKY FIGHT — the two ships, drawn in the Momentos style: flat cel fills (base + one shadow band), colored ink lines,
 * no texture. Local space: (0, 0) = waterline at the ship's middle, y up is negative.
 *
 *  PartyShip  «La Cascada al Revés»: a fiesta galleon facing LEFT — speaker stacks with pumping woofers, a DJ booth,
 *             papel picado strings, paper lanterns, a disco ball, portholes and a giant coconut. Nine PARTY LIGHTS wake
 *             up one by one (setLit) — the cold open lights them on the kicks.
 *  OurShip    Canelo's ship facing RIGHT; the Kit de Vuelo (balloon + propellers) inflates with `kit` 0..1.
 */
import { Container, Graphics } from 'pixi.js';
import { rng, starPts } from '../../anime/draw';

export const INK = 0x1a0b35;

/** a scar on a hull (local coords): a jagged hole, splintered planks around it, a crack, a wisp of smoke */
export function drawScar(g: Graphics, x: number, y: number, r: number, seed: number, smokeT: number) {
  const R = rng(seed);
  const pts: number[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rr = r * (i % 2 ? 0.55 + R() * 0.2 : 0.9 + R() * 0.35);
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
  }
  g.poly(pts).fill(INK);
  g.poly(pts.map((v, i) => (i % 2 ? y + (v - y) * 0.6 : x + (v - x) * 0.6))).fill(0x0c0716);
  // splinters sticking out
  for (let i = 0; i < 6; i++) {
    const a = R() * Math.PI * 2;
    const L = r * (0.6 + R() * 0.7);
    const bx = x + Math.cos(a) * r * 0.8;
    const by = y + Math.sin(a) * r * 0.65;
    g.poly([bx - 3, by, bx + Math.cos(a) * L, by + Math.sin(a) * L * 0.8, bx + 3, by + 2]).fill(0xc8955a).stroke({ width: 2, color: INK });
  }
  g.moveTo(x + r * 0.8, y - r * 0.2).lineTo(x + r * 1.6, y - r * 0.5).lineTo(x + r * 2.1, y - r * 0.2).stroke({ width: 3, color: INK });
  // a wisp of smoke curling up (on twos)
  const st = Math.floor(smokeT * 6);
  for (let i = 0; i < 3; i++) {
    const yy = y - r - i * 26 - ((st * 7) % 26);
    const rr = 10 + i * 5;
    g.circle(x + Math.sin(st + i) * 8, yy, rr + 3).fill({ color: INK, alpha: 0.5 });
    g.circle(x + Math.sin(st + i) * 8, yy, rr).fill({ color: 0xd8d2e0, alpha: 0.8 });
  }
}
const LW = 7;

function lantern(g: Graphics, x: number, y: number, r: number, body: number, lit: boolean) {
  g.moveTo(x, y - r - 18).lineTo(x, y - r).stroke({ width: 3, color: INK });
  if (lit) g.circle(x, y, r * 2.4).fill({ color: body, alpha: 0.22 });
  g.ellipse(x, y, r + 4, r * 1.15 + 4).fill(INK);
  g.ellipse(x, y, r, r * 1.15).fill(lit ? body : 0x3a2d48);
  g.ellipse(x - r * 0.3, y - r * 0.2, r * 0.25, r * 0.6).fill({ color: 0xffffff, alpha: lit ? 0.55 : 0.12 });
  for (const k of [-0.5, 0, 0.5]) g.moveTo(x + k * r, y - r * 1.1).quadraticCurveTo(x + k * r * 1.6, y, x + k * r, y + r * 1.1).stroke({ width: 2, color: INK, alpha: 0.6 });
  g.rect(x - r * 0.45, y - r * 1.25, r * 0.9, r * 0.22).fill(INK);
  g.rect(x - r * 0.45, y + r * 1.05, r * 0.9, r * 0.22).fill(INK);
}

/** a string of papel picado flags along a sagging curve from a to b */
function papel(g: Graphics, ax: number, ay: number, bx: number, by: number, n: number, lit: boolean, sway: number, seed: number) {
  const cols = [0xff3d7f, 0xffe14a, 0x2fd4e0, 0x8ee05a, 0xff8a1f, 0xb06bff];
  const sag = Math.abs(bx - ax) * 0.18;
  const pt = (t: number) => {
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t + Math.sin(t * Math.PI) * sag;
    return [x, y];
  };
  g.moveTo(ax, ay);
  for (let i = 1; i <= 16; i++) {
    const [x, y] = pt(i / 16);
    g.lineTo(x, y);
  }
  g.stroke({ width: 3, color: INK });
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [x, y] = pt(t);
    const w = 26;
    const h = 30;
    const sw = sway * (0.6 + R() * 0.8) * (i % 2 ? 1 : -1);
    const c = lit ? cols[(i + seed) % cols.length] : 0x3b3150;
    const p = [x - w / 2, y, x + w / 2, y, x + w / 2 + sw, y + h, x + sw * 0.5, y + h - 7, x - w / 2 + sw, y + h];
    g.poly(p).fill(c).stroke({ width: 2.5, color: INK });
    // cut-out pattern (the papel picado holes)
    g.poly(starPts(x + sw * 0.5, y + h * 0.45, 6, 2.5, 4, 0)).fill(INK);
  }
}

export class PartyShip extends Container {
  /** 0..9 lights on (fractional = the one popping) */
  private lit = -1;
  private litAt: number[] = [];
  readonly hull = new Graphics();
  readonly rig = new Graphics();
  readonly party = new Graphics();
  readonly cannons: Graphics[] = [];
  readonly deck = new Container();
  private woofers = new Graphics();
  private ball = new Graphics();
  /** scars that stay: holes, cracks and smoking splinters where shots landed (StageApi redraws them on twos) */
  readonly damage = new Graphics();
  private lastPump = -1;
  private lastStep = -1;
  constructor() {
    super();
    this.drawHull();
    for (let i = 0; i < 3; i++) {
      const c = new Graphics();
      c.roundRect(-70, -13, 80, 26, 8).fill(INK).roundRect(-64, -8, 70, 16, 6).fill(0x2a2a3e);
      c.circle(-66, 0, 15).fill(INK).circle(-66, 0, 9).fill(0x0c0716);
      c.position.set(-205 + i * 160, -108);
      this.cannons.push(c);
    }
    this.addChild(this.rig, this.party, ...this.cannons, this.hull, this.damage, this.woofers, this.deck, this.ball);
    this.setLit(0, 0);
  }
  private drawHull() {
    const g = this.hull;
    const hull = [-340, -178, -296, -150, 262, -150, 300, -198, 338, -198, 322, -120, 256, -40, 120, 2, -120, 6, -244, -40, -306, -112];
    g.poly(hull).fill(INK);
    g.poly(hull.map((v, i) => (i % 2 ? v + 0 : v))).stroke({ width: LW, color: INK });
    // base + shadow band (cel)
    g.poly([-330, -172, -292, -146, 258, -146, 296, -192, 330, -192, 316, -122, 252, -46, 118, -4, -118, 0, -238, -44, -298, -112]).fill(0x1d7a8c);
    g.poly([-300, -108, 318, -110, 252, -46, 118, -4, -118, 0, -238, -44]).fill(0x155e70);
    // the pink party stripe + gold trims
    g.poly([-312, -134, 324, -134, 320, -112, -302, -110]).fill(0xff3d7f);
    g.rect(-300, -152, 560, 9).fill(0xffc23a);
    g.poly([-300, -96, 314, -98, 310, -90, -296, -88]).fill(0xffc23a);
    // planks (thin ink lines on the shadow band), a rim light along the top of the hull
    for (const y of [-78, -58, -36]) g.moveTo(-262 + (y + 80) * 0.6, y).lineTo(262 - (y + 80) * 0.5, y).stroke({ width: 2, color: INK, alpha: 0.35 });
    g.poly([-322, -168, -290, -148, 256, -148, 292, -190, 300, -190, 262, -142, -288, -142]).fill({ color: 0xbff6ff, alpha: 0.55 });
    // full-height plank seams + bolts, a keel line
    for (const y of [-118, -100, -18]) g.moveTo(-250 + (y + 120) * 0.2, y).lineTo(250 - (y + 120) * 0.3, y).stroke({ width: 2.5, color: INK, alpha: 0.4 });
    for (let x = -240; x <= 240; x += 60) g.moveTo(x, -146).lineTo(x + 6, -96).stroke({ width: 2, color: INK, alpha: 0.3 });
    for (let x = -220; x <= 220; x += 44) g.circle(x, -104, 3).fill({ color: INK, alpha: 0.5 });
    g.moveTo(-230, -30).quadraticCurveTo(0, 18, 240, -36).stroke({ width: 4, color: INK, alpha: 0.5 });
    // deck railing
    g.moveTo(-292, -186).lineTo(250, -186).stroke({ width: 6, color: INK });
    g.moveTo(-292, -186).lineTo(250, -186).stroke({ width: 3, color: 0xffc23a });
    for (let x = -280; x <= 240; x += 40) g.rect(x - 2.5, -186, 5, 36).fill(INK);
    // name plate «LIKY»-free: a wave glyph
    g.moveTo(180, -70).bezierCurveTo(200, -90, 220, -50, 240, -70).stroke({ width: 5, color: 0xffc23a });
  }
  /** lights on: n (0..9), with the time each one popped (for the pop scale) */
  setLit(n: number, m: number, litAt: number[] = []) {
    const st = Math.floor(m * 12);
    if (n === this.lit && st === this.lastStep) return;
    this.lastStep = st;
    this.litAt = litAt;
    this.lit = n;
    const on = (i: number) => n > i;
    const pop = (i: number) => {
      const t = this.litAt[i];
      return t !== undefined && m - t < 0.25 && m >= t ? 1.25 - (m - t) : 1;
    };
    const R = this.rig;
    R.clear();
    // shrouds (rope ladders) from the mast top to the rails, both sides
    for (const [bx, n] of [
      [-200, 6],
      [230, 6],
    ] as const) {
      for (let j = 0; j <= n; j++) R.moveTo(23, -560).lineTo(bx + (j - n / 2) * 10, -186).stroke({ width: 2, color: INK, alpha: 0.75 });
      for (let j = 1; j < 8; j++) {
        const t = j / 8;
        R.moveTo(23 + (bx - 30 - 23) * t, -560 + (374 * t)).lineTo(23 + (bx + 30 - 23) * t, -560 + 374 * t).stroke({ width: 1.5, color: INK, alpha: 0.6 });
      }
    }
    // mast + crow's nest + sail
    R.rect(12, -600, 22, 455).fill(INK).rect(16, -596, 14, 447).fill(0x6b4330);
    R.rect(19, -596, 4, 447).fill({ color: 0xffffff, alpha: 0.25 });
    const sail = [-150, -540, 190, -548, 214, -300, -170, -292];
    R.poly(sail).fill(INK);
    R.poly([-142, -532, 182, -540, 204, -306, -160, -300]).fill(0xfff1e0);
    for (let i = 0; i < 4; i++) R.poly([-142 + i * 81, -532 - i * 2, -101 + i * 81, -533 - i * 2, -97 + i * 91, -303, -140 + i * 91, -302]).fill(0xff3d7f);
    R.poly([-160, -300, 204, -306, 196, -330, -156, -326]).fill(0xe2cdb8);
    // sail seams + reef points + a belly highlight
    for (let i = 1; i < 4; i++) R.moveTo(-150 + i * 85, -536).quadraticCurveTo(-140 + i * 90, -420, -150 + i * 92, -304).stroke({ width: 2, color: INK, alpha: 0.35 });
    for (let i = 0; i < 9; i++) R.circle(-130 + i * 38, -510, 3).fill(INK);
    R.poly([-120, -500, -60, -505, -70, -330, -125, -326]).fill({ color: 0xffffff, alpha: 0.18 });
    // emblem: a coconut wearing sunglasses
    R.circle(22, -420, 52).fill(INK).circle(22, -420, 45).fill(0x7a4a2a).circle(10, -440, 16).fill(0x9b6a42);
    R.roundRect(-18, -428, 36, 16, 6).fill(INK).roundRect(26, -428, 36, 16, 6).fill(INK).rect(14, -424, 14, 4).fill(INK);
    R.rect(-6, -470, 6, 40).fill(0xff3d7f);
    R.rect(-10, -616, 66, 30).fill(INK).rect(-6, -612, 58, 22).fill(0x8a5a3a);
    // DJ booth + turntables
    R.roundRect(80, -206, 170, 58, 8).fill(INK).roundRect(86, -200, 158, 46, 6).fill(0x2b1d4a);
    R.ellipse(125, -204, 30, 9).fill(INK).ellipse(125, -206, 24, 6).fill(0x55406f);
    R.ellipse(205, -204, 30, 9).fill(INK).ellipse(205, -206, 24, 6).fill(0x55406f);
    // speaker stacks (bow + stern)
    for (const sx of [-262, 256]) {
      R.roundRect(sx - 40, -282, 80, 132, 8).fill(INK).roundRect(sx - 34, -276, 68, 120, 6).fill(0x231a33);
    }
    // the coconut drink at the bow (straw + umbrella)
    R.circle(-232, -184, 40).fill(INK).circle(-232, -184, 33).fill(0x7a4a2a);
    R.ellipse(-232, -206, 26, 10).fill(0xfff1e0);
    R.moveTo(-222, -210).lineTo(-196, -262).stroke({ width: 6, color: on(8) ? 0x2fd4e0 : 0x4b4060 });
    R.poly([-250, -236, -200, -262, -150, -236]).fill(on(8) ? 0xffe14a : 0x4b4060).stroke({ width: 3, color: INK });
    // ---- the party layer (lights)
    const P = this.party;
    P.clear();
    // 0, 1: two lanterns on the bow string · 6: two more on the stern string
    lantern(P, -150, -330 * 1, 18 * pop(0), 0xff8a3d, on(0));
    lantern(P, -60, -385, 18 * pop(1), 0xffb347, on(1));
    lantern(P, 110, -420, 17 * pop(6), 0xff6fae, on(6));
    lantern(P, 210, -330, 18 * pop(6), 0xff8a3d, on(6));
    // 4, 5: papel picado strings (mast top → bow / stern)
    const sw = 0;
    papel(P, 24, -560, -330, -196, 9, on(4), sw, 1);
    papel(P, 24, -560, 330, -214, 8, on(5), sw, 4);
    // 2: portholes
    for (let i = 0; i < 5; i++) {
      const x = -160 + i * 90;
      if (on(2)) P.circle(x, -62, 26 * pop(2)).fill({ color: 0xffd36b, alpha: 0.28 });
      P.circle(x, -62, 16).fill(INK).circle(x, -62, 11).fill(on(2) ? 0xffe9a8 : 0x0f0a1f);
    }
    // 3: speaker LEDs
    for (const sx of [-262, 256]) for (let j = 0; j < 4; j++) P.circle(sx - 24 + j * 16, -150 - 132 + 10, 4).fill(on(3) ? [0x2fd4e0, 0xff3d7f, 0xffe14a, 0x8ee05a][j] : 0x3b3150);
    // 7: the disco ball on the mast top
    const db = pop(7);
    if (on(7)) P.circle(23, -640, 70 * db).fill({ color: 0xbfe9ff, alpha: 0.18 });
    P.moveTo(23, -616).lineTo(23, -600).stroke({ width: 4, color: INK });
    P.circle(23, -640, 26 * db).fill(INK).circle(23, -640, 21 * db).fill(on(7) ? 0xdfe9ff : 0x5a5470);
    if (on(7)) {
      for (let k = -2; k <= 2; k++) P.moveTo(23 - 20 * db, -640 + k * 8 * db).lineTo(23 + 20 * db, -640 + k * 8 * db).stroke({ width: 1.5, color: 0x7f86b8 });
      P.poly(starPts(8, -652, 9, 2, 4, 0.3)).fill(0xffffff);
    }
  }
  woofersTint(c: number) {
    this.woofers.tint = c;
  }
  /** woofers pump (0..1) on the kicks */
  pump(v: number, m: number) {
    const st = Math.floor(m * 24);
    if (st === this.lastPump) return;
    this.lastPump = st;
    const g = this.woofers;
    g.clear();
    for (const sx of [-262, 256])
      for (const [dy, r] of [
        [-240, 22],
        [-188, 26],
      ] as const) {
        const rr = r * (1 + v * 0.22);
        g.circle(sx, dy, rr + 4).fill(INK).circle(sx, dy, rr).fill(0x463a5c).circle(sx, dy, rr * 0.45).fill(INK).circle(sx - rr * 0.15, dy - rr * 0.15, rr * 0.15).fill({ color: 0xffffff, alpha: 0.4 });
      }
  }
  /** a cannon's muzzle (ship-local) */
  muzzle(i: number): [number, number] {
    const c = this.cannons[Math.max(0, Math.min(2, i))];
    return [c.x - 70 * Math.cos(c.rotation), c.y - 70 * Math.sin(c.rotation)];
  }
}

export class OurShip extends Container {
  readonly hull = new Graphics();
  readonly kitG = new Graphics();
  readonly props = new Graphics();
  readonly deck = new Container();
  readonly cannons: Graphics[] = [];
  /** scars that stay (see PartyShip.damage) */
  readonly damage = new Graphics();
  private lastKit = -1;
  private lastProp = -1;
  constructor() {
    super();
    this.draw();
    for (let i = 0; i < 2; i++) {
      const c = new Graphics();
      c.roundRect(-10, -12, 76, 24, 8).fill(INK).roundRect(-4, -7, 66, 14, 6).fill(0x2a2a3e);
      c.circle(66, 0, 14).fill(INK).circle(66, 0, 8).fill(0x0c0716);
      c.position.set(40 + i * 150, -106);
      this.cannons.push(c);
    }
    this.addChild(this.kitG, ...this.cannons, this.hull, this.damage, this.props, this.deck);
  }
  private draw() {
    const g = this.hull;
    const hull = [330, -178, 290, -150, -250, -150, -292, -196, -330, -196, -316, -118, -250, -40, -110, 4, 120, 4, 244, -42, 304, -116];
    g.poly(hull).fill(INK);
    g.poly([320, -172, 286, -146, -246, -146, -288, -190, -322, -190, -310, -120, -246, -46, -108, -2, 118, -2, 238, -46, 296, -114]).fill(0x2a3a78);
    g.poly([-300, -110, 294, -112, 238, -46, 118, -2, -108, -2, -246, -46]).fill(0x1c275a);
    g.poly([-304, -134, 318, -134, 312, -114, -298, -112]).fill(0xff8a1f);
    g.rect(-252, -152, 540, 9).fill(0xffc23a);
    for (let i = 0; i < 4; i++) g.circle(-140 + i * 95, -66, 15).fill(INK).circle(-140 + i * 95, -66, 10).fill(0xffd36b);
    for (const y of [-84, -40]) g.moveTo(-250 + (y + 84) * 0.4, y).lineTo(250 - (y + 84) * 0.6, y).stroke({ width: 2, color: INK, alpha: 0.35 });
    g.poly([318, -168, 286, -148, -246, -148, -284, -186, -292, -186, -254, -142, 282, -142]).fill({ color: 0xffd9b0, alpha: 0.5 });
    g.moveTo(-250, -184).lineTo(290, -184).stroke({ width: 6, color: INK });
    g.moveTo(-250, -184).lineTo(290, -184).stroke({ width: 3, color: 0xffc23a });
    for (let x = -240; x <= 280; x += 40) g.rect(x - 2.5, -184, 5, 34).fill(INK);
    // plank seams, bolts, keel
    for (const y of [-120, -100, -20]) g.moveTo(-246 + (y + 120) * 0.25, y).lineTo(260 - (y + 120) * 0.3, y).stroke({ width: 2.5, color: INK, alpha: 0.4 });
    for (let x = -230; x <= 250; x += 60) g.moveTo(x, -146).lineTo(x - 6, -96).stroke({ width: 2, color: INK, alpha: 0.3 });
    g.moveTo(-240, -36).quadraticCurveTo(0, 16, 230, -30).stroke({ width: 4, color: INK, alpha: 0.5 });
    // the ship's wheel at the stern
    g.circle(-200, -214, 26).stroke({ width: 6, color: INK }).circle(-200, -214, 22).stroke({ width: 3, color: 0xc8955a });
    for (let i = 0; i < 8; i++) g.moveTo(-200, -214).lineTo(-200 + Math.cos((i / 8) * Math.PI * 2) * 32, -214 + Math.sin((i / 8) * Math.PI * 2) * 32).stroke({ width: 3, color: INK });
    g.rect(-206, -192, 12, 44).fill(INK);
    // shrouds
    for (const bx of [-180, 210]) {
      for (let j = 0; j <= 6; j++) g.moveTo(-19, -540).lineTo(bx + (j - 3) * 10, -184).stroke({ width: 2, color: INK, alpha: 0.7 });
      for (let j = 1; j < 8; j++) {
        const t = j / 8;
        g.moveTo(-19 + (bx - 30 + 19) * t, -540 + 356 * t).lineTo(-19 + (bx + 30 + 19) * t, -540 + 356 * t).stroke({ width: 1.5, color: INK, alpha: 0.55 });
      }
    }
    // sail seams
    for (let i = 1; i < 4; i++) g.moveTo(-182 + i * 82, -492).quadraticCurveTo(-170 + i * 86, -380, -196 + i * 90, -270).stroke({ width: 2, color: INK, alpha: 0.3 });
    // rigging: mast top to bow and stern
    g.moveTo(-19, -556).lineTo(320, -178).stroke({ width: 3, color: INK });
    g.moveTo(-19, -556).lineTo(-320, -192).stroke({ width: 3, color: INK });
    // a stern lantern
    g.moveTo(-300, -196).lineTo(-300, -240).stroke({ width: 4, color: INK });
    g.circle(-300, -252, 16).fill(INK).circle(-300, -252, 11).fill(0xffd36b);
    // mast, sail with the flame-cat emblem, flag
    g.rect(-30, -560, 22, 412).fill(INK).rect(-26, -556, 14, 404).fill(0x6b4330);
    g.poly([-190, -500, 150, -508, 172, -270, -206, -262]).fill(INK);
    g.poly([-182, -492, 142, -500, 162, -276, -196, -270]).fill(0xfff1d6);
    g.poly([-196, -270, 162, -276, 156, -300, -190, -296]).fill(0xe6d2b6);
    // emblem: a flame with cat ears
    const ex = -20;
    const ey = -390;
    g.poly([ex - 52, ey + 50, ex - 46, ey - 40, ex - 22, ey - 10, ex, ey - 70, ex + 22, ey - 10, ex + 46, ey - 40, ex + 52, ey + 50]).fill(INK);
    g.poly([ex - 42, ey + 42, ex - 38, ey - 22, ex - 20, ey + 2, ex, ey - 52, ex + 20, ey + 2, ex + 38, ey - 22, ex + 42, ey + 42]).fill(0xff6a1a);
    g.poly([ex - 22, ey + 40, ex - 10, ey + 6, ex, ey - 18, ex + 10, ey + 6, ex + 22, ey + 40]).fill(0xffd34a);
    g.circle(ex - 14, ey + 18, 4).fill(INK).circle(ex + 14, ey + 18, 4).fill(INK);
    g.poly([-24, -560, 60, -540, -24, -520]).fill(0xff3d7f).stroke({ width: 3, color: INK });
  }
  /** the Kit de Vuelo: balloon + propellers (0 = packed, 1 = flying) */
  setKit(v: number, m: number) {
    const k = Math.max(0, Math.min(1, v));
    const st = Math.floor(m * 12);
    if (Math.abs(k - this.lastKit) < 0.001 && st === this.lastProp) return;
    this.lastProp = st;
    this.lastKit = k;
    const g = this.kitG;
    g.clear();
    if (k > 0.01) {
      const by = -640 - 140 * k;
      const rx = 30 + 190 * k;
      const ry = 26 + 150 * k;
      // ropes
      for (const dx of [-0.7, 0, 0.7]) g.moveTo(-18 + dx * 120, -540).lineTo(-18 + dx * rx * 0.8, by + ry * 0.8).stroke({ width: 3, color: INK });
      g.ellipse(-18, by, rx + 7, ry + 7).fill(INK);
      g.ellipse(-18, by, rx, ry).fill(0xff8a1f);
      for (let i = -2; i <= 2; i++) g.ellipse(-18 + i * rx * 0.36, by, rx * 0.11, ry * 0.98).fill(0xfff1d6);
      g.ellipse(-18 - rx * 0.4, by - ry * 0.35, rx * 0.18, ry * 0.25).fill({ color: 0xffffff, alpha: 0.5 });
      g.rect(-18 - rx * 0.6, by + ry * 0.7, rx * 1.2, 12).fill(INK);
    }
    const P = this.props;
    P.clear();
    if (k > 0.3) {
      // two propellers at the stern, blades on twos
      for (const [px, py] of [
        [-318, -120],
        [-318, -40],
      ]) {
        P.rect(px - 30, py - 4, 30, 8).fill(INK);
        const a = st * 1.1 * k;
        for (const s of [0, Math.PI]) {
          const x2 = px - 34 + Math.cos(a + s) * 6;
          const y2 = py + Math.sin(a + s) * 46 * k;
          P.ellipse(x2, (py + y2) / 2, 9, Math.abs(y2 - py) / 2 + 4).fill(0xd8dce8).stroke({ width: 3, color: INK });
        }
        P.circle(px - 34, py, 7).fill(INK);
      }
    }
  }
  muzzle(i: number): [number, number] {
    const c = this.cannons[Math.max(0, Math.min(1, i))];
    return [c.x + 70 * Math.cos(c.rotation), c.y + 70 * Math.sin(c.rotation)];
  }
}
