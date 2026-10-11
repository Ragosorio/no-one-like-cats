/**
 * HEMKADE — the set: a real 3D world (world.ts, three.js on its own canvas) shown as a Pixi texture INSIDE the kit's
 * camera layer, with the crew drawn on top as the Momento's baked paintings at their projected deck positions.
 *
 * Everything is a pure function of momento time:
 *  - props from the score's key tracks (shot + 'sh.*' knobs, 'lev.*', 'ship.*', 'line.*', sea, storm, stars, rift,
 *    style/wipe/plate for the GRABADO plates);
 *  - the always-on reactions read the onset tracks every frame (each KICK: a zoom punch, the pleats flare, a halo ring
 *    from the heart, the swim twitches, the chains jump, the hull dips; each BASS note: sway + fins, and the ♭II (G♭)
 *    tightens the chains — they glow; each strong MELODY attack: a ring of light runs along the body and, in a plate, a
 *    new line is drawn; VOICE chops: the maw opens);
 *  - world state derived from the score: the seals (judged taps), snapped chains (cues).
 * Clips (verbs.ts) ask for beams, bursts, bolts, jolts and emotes through want*(); late() applies them and renders.
 */
import { ColorMatrixFilter, Container, Sprite, Texture } from 'pixi.js';
import * as THREE from 'three';
import type { Kit, StageApi } from '../../anime/kit';
import { Actor } from '../../anime/actor';
import { Hem3D, type Burst, type WorldFrame } from './world';
import { CHAINS, SEALS, type SealState } from './chains';
import { SHOTS, type ShotCtx } from './shots';
import { HEM_PALETTES, PLATES } from './palettes';
import { HEM_VERBS } from './verbs';
import { SEAL_OF } from './score';

export type Who = 'canelo' | 'luzterna' | 'crew0' | 'crew1';
const WHO: Who[] = ['canelo', 'luzterna', 'crew0', 'crew1'];
const REFORM = 5.2;

interface BeamReq {
  on: number;
  to: THREE.Vector3;
  w: number;
}

export class HemStage implements StageApi {
  verbs = HEM_VERBS;
  palettes = HEM_PALETTES;
  /** prompts in this Momento's colours: navy ink, cream, gold, ultramarine, an orange mash (not LIKY's magenta) */
  promptTheme = { ink: 0x0a1a44, paper: 0xfff6e4, hot: 0xffc21a, body: 0x1c55a8, mash: 0xff7a1a, dim: 0x8a96b8, kata: true };
  props: Record<string, number | string> = {
    pal: 'hAbyss',
    shot: 'abyss',
    'sh.a': 0,
    'sh.d': 0,
    'sh.h': 0,
    'sh.f': 0,
    'sh.p': 0,
    'sh.s': -1,
    style: 0,
    wipe: 0,
    plate: 'sepia',
    'lev.x': 0,
    'lev.y': -90,
    'lev.z': 0,
    'lev.yaw': 0,
    'lev.pitch': 0,
    'lev.roll': 0,
    'lev.swim': 1,
    'lev.arch': 0,
    'lev.eye': 0,
    'lev.maw': 0,
    'lev.wet': 0,
    'lev.lookX': 0,
    'lev.lookY': 0,
    cascade: 0,
    'ship.dx': 120,
    'ship.dy': 60,
    'ship.dz': 160,
    'ship.sea': 1,
    'ship.yaw': 0.3,
    'ship.wings': 0,
    'ship.thrust': 0,
    'ship.pitch': 0,
    'line.dy': 820,
    'line.z': 0,
    strain: 0.4,
    slack: 0,
    lineCrack: 0,
    swell: 1,
    chop: 1,
    breach: 0,
    storm: 1,
    rain: 0,
    stars: 0,
    nebula: 0,
    rift: 0,
    'sun.az': 0.6,
    'sun.el': 0.35,
    'sun.size': 0.004,
    speed: 0,
    'fog.near': 500,
    'fog.far': 5200,
    'fog.max': 0.8,
    reform: 1,
    actors: 1,
  };
  slugs: Record<string, string> = { canelo: 'canelo_astral_cat', luzterna: 'luzterna', jonas: 'jonas_whale_cat' };
  world!: Hem3D;
  private tex!: Texture;
  private sprite!: Sprite;
  private cast = new Container();
  /** in a plate the crew is hand-tinted like the print (sepia), never full colour over an engraving */
  private castTone = new ColorMatrixFilter();
  actors: Partial<Record<Who, Actor>> = {};
  private rect = { x: 0, y: 0, w: 1920, h: 1080 };
  private pxPerUnit = 1;
  private lowRes = false;
  /** the frame handed to the 3D world (reused) */
  private f: WorldFrame;
  // derived from the score
  private shotKeys: { m: number; v: string }[] = [];
  private sealPrompts: { id: string; seal: number }[] = [];
  private snaps: { m: number; c: number }[] = [];
  private kicks: number[] = [];
  // per frame requests from clips
  private beams: BeamReq[] = [];
  private extraBursts: Burst[] = [];
  private bolts: { i: number; on: number; x: number; z: number }[] = [];
  private shake3 = 0;
  private flash3 = 0;
  private jolt = { dy: 0, roll: 0 };
  private emotes = new Map<Who, string>();
  private hideCast = false;
  private look: [number, number] | null = null;
  private wings = 0;
  private shipOff = new THREE.Vector3();
  // screen anchors computed in late()
  private anchors = new Map<string, [number, number]>();
  private sealState: SealState[] = Array.from({ length: SEALS }, () => ({ state: 0, knock: 0 }));
  private tmpA: [number, number, number] = [0, 0, 0];
  private v = new THREE.Vector3();

  constructor(private k: Kit) {
    const V = () => new THREE.Vector3();
    this.f = {
      m: 0,
      cam: { pos: V(), look: V(), fov: 50, roll: 0 },
      sky: [0, 0, 0, 0, 0],
      sea: [0, 0, 0],
      sun: { dir: V(), col: 0xffffff, size: 0.004 },
      fog: { col: 0, near: 500, far: 5000, max: 0.8 },
      amb: [0x8fb4ff, 0x203050],
      style: 0,
      wipe: 0,
      reveal: 1,
      paper: 0xf1e6cf,
      ink: 0x2a2018,
      kick: 0,
      flash: 0,
      flashCol: 0xffffff,
      stars: 0,
      nebula: 0,
      rift: 0,
      storm: 1,
      rain: 0,
      lightning: [],
      speed: 0,
      lev: { pos: V(), rotY: 0, pitch: 0, roll: 0, swim: 1, phase: 0, arch: 0, sway: 0.4, pleat: 0, maw: 0, rings: [-1, -1, -1, -1], ringI: [0, 0, 0, 0], fin: 0, fluke: 0, eyeOpen: 1, look: [0, 0], wet: 0, cascade: 0 },
      chains: { lineY: 900, lineZ: 0, strain: 0.4, vib: 0.3, seals: this.sealState, snapped: Array(CHAINS).fill(1), lineCrack: 0, hum: 0, slack: 0 },
      ship: { pos: V(), rotY: 0, fold: 0, thrust: 0, bob: 0, roll: 0, pitch: 0, visible: true },
      sea_: { swell: 1, breach: 0, breachAt: V(), chop: 1, visible: true },
      halos: [],
      bursts: [],
      beam: { on: 0, from: V(), to: V(), w: 1 },
    };
  }

  async build(k: Kit) {
    const crew = k.crew.filter((s) => s && !Object.values(this.slugs).includes(s)).slice(0, 2);
    await k.studio.loadAll([this.slugs.canelo, this.slugs.luzterna, ...crew]);
    const loaded = crew.filter((s) => k.studio.has(s));
    (k as Kit & { crewLoaded?: string[] }).crewLoaded = loaded;
    // the 3D world, its canvas a texture in the camera layer (with a bleed so punches and shakes never show an edge)
    this.world = new Hem3D({ high: k.quality === 'high' });
    this.layout(k);
    this.tex = Texture.from(this.world.canvas);
    this.tex.source.scaleMode = 'linear';
    this.sprite = new Sprite(this.tex);
    this.layout(k);
    k.layers.world.addChild(this.sprite);
    k.layers.world.addChild(this.cast);
    k.layers.world.addChild(k.layers.wfx);
    // the crew on deck
    const mk = (who: Who, slug: string | undefined) => {
      if (!slug || !k.studio.has(slug)) return;
      const a = new Actor(k.studio, slug, 100);
      a.smooth = true;
      a.visible = false;
      this.actors[who] = a;
      this.cast.addChild(a);
    };
    mk('canelo', this.slugs.canelo);
    mk('luzterna', this.slugs.luzterna);
    mk('crew0', loaded[0]);
    mk('crew1', loaded[1]);
    // what the score says, precomputed
    const sk = k.score.keys.get('shot') ?? [];
    this.shotKeys = sk.map((x) => ({ m: x.m, v: String(x.value) }));
    this.sealPrompts = k.score.prompts.filter((p) => SEAL_OF[p.id] !== undefined).map((p) => ({ id: p.id, seal: SEAL_OF[p.id] }));
    this.snaps = k.score.cues.filter((c) => c.act.verb === 'snap').map((c) => ({ m: c.m, c: Number(c.act.args.c ?? 0) })).sort((a, b) => a.m - b.m);
    this.kicks = k.onsetList('kick').filter((o) => o.strength >= 0.3).map((o) => o.t);
    // one frame now: compiles every program before the clock starts
    this.update(k, 0);
    this.world.warm();
  }

  private layout(k: Kit) {
    const v = k.view;
    const bx = v.w * 0.05;
    const by = v.h * 0.05;
    this.rect = { x: v.x - bx, y: v.y - by, w: v.w + bx * 2, h: v.h + by * 2 };
    const canvasW = (k.renderer as unknown as { canvas?: HTMLCanvasElement }).canvas?.width ?? 1920;
    this.pxPerUnit = canvasW / Math.max(1, v.w);
    const cap = this.lowRes || k.quality === 'low' ? 1100 : 2048;
    const s = Math.min(this.pxPerUnit, cap / this.rect.w);
    this.world.setSize(this.rect.w * s, this.rect.h * s);
    if (this.sprite) {
      this.sprite.position.set(this.rect.x, this.rect.y);
      this.sprite.width = this.rect.w;
      this.sprite.height = this.rect.h;
    }
  }

  // ---------------------------------------------------------------- requests from clips
  wantBeam(to: THREE.Vector3, on: number, w: number) {
    this.beams.push({ to, on, w });
  }
  wantBurst(b: Burst) {
    this.extraBursts.push(b);
  }
  wantBolt(i: number, on: number, x: number, z: number) {
    this.bolts.push({ i, on, x, z });
  }
  wantShake(a: number) {
    this.shake3 = Math.max(this.shake3, a);
  }
  wantFlash(a: number) {
    this.flash3 = Math.max(this.flash3, a);
  }
  wantJolt(dy: number, roll: number) {
    this.jolt.dy += dy;
    this.jolt.roll += roll;
  }
  wantEmote(who: Who, e: string) {
    this.emotes.set(who, e);
  }
  wantHideCast() {
    this.hideCast = true;
  }
  wantLook(x: number, y: number) {
    this.look = [x, y];
  }
  wantWings(v: number) {
    this.wings = Math.max(this.wings, v);
  }
  wantShipOffset(x: number, y: number, z: number) {
    this.shipOff.set(this.shipOff.x + x, this.shipOff.y + y, this.shipOff.z + z);
  }
  /** world positions for verbs */
  sealWorld(i: number) {
    return this.world.chains.sealPos[((i % SEALS) + SEALS) % SEALS];
  }
  bowWorld(out = new THREE.Vector3()) {
    this.world.ship.bow.updateWorldMatrix(true, false);
    return this.world.ship.bow.getWorldPosition(out);
  }
  heartWorld(out = new THREE.Vector3()) {
    return this.world.lev.toWorld(this.world.lev.surface(0.6, 0, 0, out), out);
  }
  /** a world point → design-box screen point (through the 3D camera AND the kit's 2D camera) */
  screenOf(p: THREE.Vector3): [number, number] | null {
    const r = this.world.project(p, this.rect, this.tmpA);
    if (r[2] < 0) return null;
    return this.k.cam.toScreen(r[0], r[1]);
  }

  // ---------------------------------------------------------------- the frame
  update(k: Kit, m: number) {
    if (k.quality === 'low' && !this.lowRes) {
      this.lowRes = true;
      this.layout(k);
    }
    const f = this.f;
    f.m = m;
    const P = k.pal;
    f.sky = P.sky;
    f.sea = P.sea;
    // ---- always-on reactions
    const kick = k.env('kick', m, 0.09, 0.3);
    const bassL = k.last('bass', m, 0.15);
    const bass = k.env('bass', m, 0.22, 0.15);
    const flat2 = bassL && (bassL.o.midi === 30 || bassL.o.midi === 42 || bassL.o.midi === 18) ? Math.exp(-(m - bassL.o.t) / 0.5) : 0;
    const vox = k.env('vox', m, 0.12, 0.55);
    const perc = k.env('perc', m, 0.06, 0.3);
    f.kick = kick;
    k.cam.punch(0.014 * kick);
    // ---- style (COLOSO ↔ GRABADO)
    f.style = k.num('style');
    f.wipe = k.num('wipe');
    const plate = PLATES[k.str('plate', 'sepia')] ?? PLATES.sepia;
    f.paper = plate[0];
    f.ink = plate[1];
    f.reveal = this.reveal(k, m);
    // ---- sky, sun, fog
    const az = k.num('sun.az');
    const el = k.num('sun.el');
    f.sun.dir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    f.sun.col = P.light;
    f.sun.size = k.num('sun.size', 0.004) * (1 + kick * 0.25);
    f.fog.col = P.sky[4];
    f.fog.near = k.num('fog.near', 500);
    f.fog.far = k.num('fog.far', 5000);
    f.fog.max = k.num('fog.max', 0.8);
    f.amb = [P.sky[2], P.sea[1]];
    f.stars = k.num('stars');
    f.nebula = k.num('nebula');
    f.rift = k.num('rift') * (1 + kick * 0.08);
    f.storm = k.num('storm', 1);
    f.rain = k.num('rain');
    f.speed = k.num('speed') * (0.7 + 0.5 * perc);
    // ---- the Leviathan
    const L = f.lev;
    L.pos.set(k.num('lev.x'), k.num('lev.y'), k.num('lev.z'));
    L.rotY = k.num('lev.yaw');
    L.pitch = k.num('lev.pitch');
    L.roll = k.num('lev.roll');
    L.swim = k.num('lev.swim', 1) * (1 + 0.3 * bass);
    L.phase = m * 1.15 + this.kickTwitch(m) * 0.5;
    L.arch = k.num('lev.arch');
    L.sway = 0.35 + bass * 0.55;
    L.pleat = Math.min(1, kick * 1.2 + flat2 * 0.3);
    L.maw = Math.max(k.num('lev.maw'), vox * 0.9);
    this.melodyRings(k, m, L.rings, L.ringI);
    L.fin = Math.sin(L.phase * 0.8) * 0.5 + bass * 0.7;
    L.fluke = Math.sin(L.phase) * 0.4;
    L.eyeOpen = Math.max(0, Math.min(1, k.num('lev.eye'))) * this.blink(m);
    L.look = [k.num('lev.lookX'), k.num('lev.lookY')];
    L.wet = k.num('lev.wet');
    L.cascade = k.num('cascade');
    // ---- chains + seals
    const C = f.chains;
    C.lineY = L.pos.y + k.num('line.dy', 820);
    C.lineZ = k.num('line.z');
    C.strain = Math.min(1, k.num('strain') + flat2 * 0.45 + kick * 0.15);
    C.vib = 0.25 + kick * 1.3 + bass * 0.5;
    C.lineCrack = k.num('lineCrack');
    C.hum = Math.min(1, flat2 + kick * 0.3);
    C.slack = k.num('slack');
    this.seals(k, m);
    for (let c = 0; c < CHAINS; c++) C.snapped[c] = 1;
    for (const s of this.snaps) if (s.m <= m) C.snapped[s.c] = 0.18 + ((s.c * 37) % 10) / 40;
    // ---- our ship
    const S = f.ship;
    const sea = Math.max(0, Math.min(1, k.num('ship.sea')));
    const sy = (L.pos.y + k.num('ship.dy')) * (1 - sea);
    const onSea = sea > 0.5;
    S.pos.set(L.pos.x + k.num('ship.dx'), sy, L.pos.z + k.num('ship.dz'));
    // riding the breach: the water dome and its ring lift the hull (same formula as the sea shader)
    if (sea > 0) {
      const br = k.num('breach');
      const r = Math.hypot(S.pos.x - L.pos.x, S.pos.z - L.pos.z);
      S.pos.y += sea * br * (Math.exp(-((r / 210) ** 2)) * 60 + Math.exp(-(((r - 260 - br * 120) / 40) ** 2)) * 18);
    }
    S.rotY = k.num('ship.yaw');
    S.fold = k.num('ship.wings');
    S.thrust = k.num('ship.thrust') * (0.75 + 0.35 * perc);
    S.bob = (onSea ? Math.sin(m * 1.3) * 0.9 + Math.sin(m * 0.7) * 0.6 : Math.sin(m * 2.1) * 1.4) - kick * 0.9;
    S.roll = Math.sin(m * 1.1) * (onSea ? 0.06 : 0.04) + bass * 0.04;
    S.pitch = k.num('ship.pitch') + Math.sin(m * 0.9) * 0.03 + kick * 0.03;
    S.visible = true;
    // ---- the sea
    const W = f.sea_;
    W.swell = k.num('swell', 1);
    W.chop = k.num('chop', 1);
    W.breach = k.num('breach');
    W.breachAt.copy(L.pos);
    // ---- kick halos (the last few kicks)
    f.halos.length = 0;
    for (let i = this.kickIndex(m); i >= 0 && f.halos.length < 4; i--) {
      const age = m - this.kicks[i];
      if (age > 0.6) break;
      f.halos.push({ t: age, s: 1 });
    }
    // ---- bursts from the music (spray off the fins at sea, stars in space)
    f.bursts.length = 0;
    this.musicBursts(k, m, f.bursts);
    f.lightning.length = 0;
    f.flash = 0;
    f.flashCol = P.light;
    // ---- camera (the shot + knobs)
    const shot = k.str('shot', 'surface');
    const fn = SHOTS[shot] ?? SHOTS.surface;
    const ctx = this.ctx(k, m, shot);
    const cam = fn(ctx);
    f.cam.pos.copy(cam.pos);
    f.cam.look.copy(cam.look);
    f.cam.fov = cam.fov;
    f.cam.roll = cam.roll;
    // «reducir movimiento»: dutch angles ×0.3, speed streaks at half (the same timeline)
    if (k.reduceMotion) {
      f.cam.roll *= 0.3;
      f.speed *= 0.5;
    }
    // only the deep shot goes under the sea (the others ride above the swell and the breach dome)
    // (a shot whose subject is itself under the sea stays down there with it: the eye in the deep)
    const subjectDown = f.cam.look.y < -20 && L.pos.y < -40;
    if (shot !== 'abyss' && !subjectDown && f.cam.pos.y < 10 + W.breach * 40) f.cam.pos.y = 10 + W.breach * 40;
    // the sea only below the clouds' reach
    W.visible = f.cam.pos.y < 2600;
    // underwater
    // underwater: light from above, the deep below; things fade into a mid-water haze as dark shapes
    if (f.cam.pos.y < 0) {
      const [hi, mid, deep] = P.sea;
      f.fog = { col: mid, near: 40, far: 1150, max: 0.8 };
      f.sky = [mixHex(hi, 0xd8f6ff, 0.35), hi, mixHex(hi, mid, 0.5), mid, mixHex(mid, deep, 0.5)];
    }
  }

  /** the plate is drawn in on the melody: each strong attack since the break began draws more lines */
  private reveal(k: Kit, m: number) {
    const sec = k.map.sections.find((s) => m >= s.start && m < s.end);
    if (!sec || !sec.name.startsWith('break')) return 1;
    const mel = k.onsetList('melody');
    let n = 0;
    for (const o of mel) {
      if (o.t < sec.start) continue;
      if (o.t > m) break;
      if (o.strength >= 0.3) n++;
    }
    return Math.min(1, 0.06 + n / 26);
  }
  private kickIndex(m: number) {
    const l = this.kicks;
    let lo = 0;
    let hi = l.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (l[mid] <= m) lo = mid + 1;
      else hi = mid;
    }
    return lo - 1;
  }
  /** each kick advances the swim by a quick twitch (count + the tail of the last ones) */
  private kickTwitch(m: number) {
    const i = this.kickIndex(m);
    let v = i + 1;
    for (let j = i; j >= 0 && j > i - 3; j--) v -= Math.exp(-(m - this.kicks[j]) / 0.07);
    return v;
  }
  private blink(m: number) {
    const ph = (m % 5.3) / 5.3;
    return ph > 0.97 ? 0.15 : 1;
  }
  /** strong melody attacks: rings of light run from the tail to the snout (it sings) */
  private melodyRings(k: Kit, m: number, pos: number[], amt: number[]) {
    const mel = k.onsetList('melody');
    const x = k.last('melody', m, 0.45);
    let n = 0;
    for (let i = 0; i < 4; i++) {
      pos[i] = -1;
      amt[i] = 0;
    }
    if (!x) return;
    for (let i = x.i; i >= 0 && n < 4; i--) {
      const o = mel[i];
      if (o.strength < 0.45) continue;
      const age = m - o.t;
      if (age > 1.4) break;
      pos[n] = 0.06 + (age / 1.4) * 0.94;
      amt[n] = (1 - age / 1.4) * Math.min(1, o.strength * 1.3);
      n++;
    }
  }
  /** seals: shattered by a great (they re-form a few seconds later while the line holds), cracked by a hit, knocked by any */
  private seals(k: Kit, m: number) {
    const reform = k.num('reform', 1) > 0.5;
    for (const s of this.sealState) {
      s.state = 0;
      s.knock = 0;
    }
    const last = new Map<number, { at: number; r: string }[]>();
    for (const p of this.sealPrompts) {
      const j = k.judged(p.id);
      if (!j || j.at > m) continue;
      let l = last.get(p.seal);
      if (!l) last.set(p.seal, (l = []));
      l.push({ at: j.at, r: j.r });
    }
    for (const [i, evs] of last) {
      evs.sort((a, b) => a.at - b.at);
      const st = this.sealState[i];
      let state = 0;
      let at = -1;
      for (const e of evs) {
        if (e.r === 'great') state = 2;
        else if (e.r === 'hit') state = Math.max(state === 2 ? 0 : state, 1);
        at = e.at;
      }
      if (state === 2 && reform && m - at > REFORM) state = 0;
      st.state = state;
      st.knock = Math.exp(-(m - at) / 0.22);
    }
  }
  private musicBursts(k: Kit, m: number, out: Burst[]) {
    const L = this.f.lev;
    const sea = L.pos.y < 260;
    const snare = k.onsetList('snare');
    const x = k.last('snare', m, 0.55);
    if (!x) return;
    let n = 0;
    for (let i = x.i; i >= 0 && n < 4; i--) {
      const o = snare[i];
      if (o.strength < 0.55) continue;
      const age = m - o.t;
      if (age > 2.2) break;
      n++;
      const side = i % 2 ? 1 : -1;
      if (sea && this.world) {
        // the fins slap the sea: a wall of spray beside the body
        const p = this.world.lev.toWorld(this.world.lev.surface(0.7, side > 0 ? 0.2 : Math.PI - 0.2, 40, this.v), new THREE.Vector3());
        p.y = 2;
        out.push({ t0: o.t, kind: 'spray', at: p, scale: 2.2, seed: i });
      } else if (this.world && this.f.stars > 0.3) {
        const p = this.world.lev.toWorld(this.world.lev.surface(0.3 + ((i * 0.137) % 0.6), (i * 1.3) % 6.28, 30, this.v), new THREE.Vector3());
        out.push({ t0: o.t, kind: 'star', at: p, scale: 3, seed: i });
      }
    }
  }

  private shotStart(m: number) {
    let s = 0;
    for (const x of this.shotKeys) {
      if (x.m > m + 1e-6) break;
      s = x.m;
    }
    return s;
  }
  private ctx(k: Kit, m: number, _shot: string): ShotCtx {
    const w = this.world;
    // the 3D pose must be current before we read body points: apply the transform early
    const L = this.f.lev;
    w.lev.group.position.copy(L.pos);
    w.lev.group.rotation.set(L.roll, L.rotY, L.pitch, 'YZX');
    w.lev.P.swim = L.swim;
    w.lev.P.phase = L.phase;
    w.lev.P.arch = L.arch;
    w.lev.P.sway = L.sway;
    w.lev.group.updateMatrixWorld(true);
    const S = this.f.ship;
    w.ship.group.position.copy(S.pos);
    w.ship.group.rotation.set(0, S.rotY, 0);
    w.ship.group.updateMatrixWorld(true);
    const body = (u: number, th: number, lift = 0) => w.lev.toWorld(w.lev.surface(u, th, lift, new THREE.Vector3()), new THREE.Vector3());
    const fwd = new THREE.Vector3(Math.cos(S.rotY), 0, -Math.sin(S.rotY));
    return {
      lt: m - this.shotStart(m),
      m,
      body,
      heart: body(0.6, 0),
      head: body(0.95, 0),
      eye: body(0.885, -0.18, -1),
      eyeN: body(0.885, -0.18, 0).sub(body(0.885, Math.PI + 0.18, 0)).normalize(),
      ship: S.pos.clone(),
      shipFwd: fwd,
      bow: S.pos.clone().addScaledVector(fwd, 9),
      seal: (i: number) => w.chains.sealPos[((i % SEALS) + SEALS) % SEALS].clone(),
      lineY: this.f.chains.lineY,
      a: k.num('sh.a'),
      d: k.num('sh.d'),
      h: k.num('sh.h'),
      f: k.num('sh.f'),
      p: k.num('sh.p'),
      s: k.num('sh.s', -1),
      calm: k.reduceMotion ? 0.3 : 1,
    };
  }

  late(k: Kit, m: number) {
    const f = this.f;
    // requests from the clips
    const bow = this.bowWorld(new THREE.Vector3());
    f.beam.on = 0;
    for (const b of this.beams) {
      if (b.on > f.beam.on) {
        f.beam.on = b.on;
        f.beam.from.copy(bow);
        f.beam.to.copy(b.to);
        f.beam.w = b.w;
      }
    }
    for (const b of this.extraBursts) f.bursts.push(b);
    for (const b of this.bolts) f.lightning[b.i % 4] = { on: b.on, x: b.x, z: b.z, seed: b.i };
    f.flash = Math.min(0.85, this.flash3);
    if (this.shake3 > 0 && !k.reduceMotion) {
      const s = this.shake3;
      f.cam.pos.x += Math.sin(m * 61) * s;
      f.cam.pos.y += Math.sin(m * 47 + 1) * s;
      f.cam.look.x += Math.sin(m * 53 + 2) * s * 0.6;
    }
    f.ship.bob += this.jolt.dy;
    f.ship.roll += this.jolt.roll;
    f.ship.pos.add(this.shipOff);
    f.ship.fold = Math.max(f.ship.fold, this.wings);
    if (this.look) f.lev.look = [this.look[0], this.look[1]];
    this.world.frame(f);
    this.tex.source.update();
    this.placeCast(k, m);
    // anchors (screen)
    this.anchors.clear();
    for (let i = 0; i < SEALS; i++) {
      const p = this.screenOf(this.world.chains.sealPos[i]);
      if (p) this.anchors.set(`seal${i}`, p);
    }
    const put = (name: string, p: THREE.Vector3) => {
      const s = this.screenOf(p);
      if (s) this.anchors.set(name, s);
    };
    put('bow', bow);
    put('ship', f.ship.pos);
    put('heart', this.heartWorld(new THREE.Vector3()));
    put('eye', this.world.lev.toWorld(this.world.lev.surface(0.885, -0.18, 0, new THREE.Vector3()), new THREE.Vector3()));
    put('head', this.world.lev.toWorld(this.world.lev.surface(0.97, -Math.PI / 2, 0, new THREE.Vector3()), new THREE.Vector3()));
    // the requests were for this frame
    this.beams.length = 0;
    this.extraBursts.length = 0;
    this.bolts.length = 0;
    this.shake3 = 0;
    this.flash3 = 0;
    this.jolt.dy = this.jolt.roll = 0;
    this.emotes.clear();
    this.hideCast = false;
    this.look = null;
    this.wings = 0;
    this.shipOff.set(0, 0, 0);
  }

  private placeCast(k: Kit, m: number) {
    const w = this.world;
    const cam = w.camera;
    const show = k.num('actors', 1) > 0.5 && !this.hideCast && !k.fullFrame;
    const plate = this.f.style > 0.5 || this.f.wipe > 0.5;
    if (plate && !this.cast.filters?.length) {
      this.castTone.reset();
      this.castTone.sepia(false);
      this.castTone.contrast(0.25, true);
      this.cast.filters = [this.castTone];
    } else if (!plate && this.cast.filters?.length) this.cast.filters = [];
    const focal = this.rect.h / 2 / Math.tan((cam.fov * Math.PI) / 360);
    w.ship.body.updateMatrixWorld(true);
    for (const who of WHO) {
      const a = this.actors[who];
      if (!a) continue;
      const pt = w.ship.deckPts[who];
      if (!show || !pt) {
        a.visible = false;
        continue;
      }
      pt.getWorldPosition(this.v);
      const r = w.project(this.v, this.rect, this.tmpA);
      // the camera under the deck can't see them
      const below = cam.position.y < this.v.y - 0.5;
      const px = r[2] > 0 ? (5.8 * focal) / r[2] : 0;
      a.visible = r[2] > 0 && !below && px > 26;
      if (!a.visible) continue;
      const s = Math.min(px, 900) / 100;
      // (r is the shared projection buffer: read it before screenFacing() projects again)
      const sx = r[0];
      const sy = r[1];
      const flip = this.screenFacing(who);
      a.pose(m, sx, sy, { sx: s * (flip ? -1 : 1), sy: s, step: k.beatStep(m) });
      const e = this.emotes.get(who);
      if (e) a.emote(e as Parameters<Actor['emote']>[0]);
    }
  }
  /** the cats face the bow: flip when the bow points left on screen */
  private screenFacing(_who: Who) {
    const w = this.world;
    const a = this.screenOf(this.f.ship.pos);
    const b = this.screenOf(this.bowWorld(this.v));
    return !!(a && b && b[0] < a[0]);
  }

  anchor(name: string): [number, number] | null {
    return this.anchors.get(name) ?? null;
  }

  destroy() {
    this.cast.filters = [];
    this.castTone.destroy();
    this.sprite?.destroy();
    this.tex?.destroy(true);
    this.world?.dispose();
    for (const a of Object.values(this.actors)) a?.destroy({ children: true });
  }
}

function mixHex(a: number, b: number, k: number) {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k) << s;
  return ch(16) | ch(8) | ch(0);
}

export default function createStage(k: Kit): StageApi {
  return new HemStage(k);
}
