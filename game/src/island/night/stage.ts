/**
 * The island as a CINE stage (src/cine/types.ts CineStage): camera, world look, cats, flourishes and
 * «tap the faro» interactions, on top of IslandNight. IslandScene creates it on enter and withdraws it on exit
 * (which interrupts any cine playing here).
 */
import { Container, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { onomatopoeia, sparkles } from '../../fx/juice';
import type { CineCtx, CineStage, ActorCmd, FxCmd, InteractCmd, Target } from '../../cine/types';
import type { WorldLook } from '../../state/sys/worldState';
import type { CatActor } from '../catActor';
import type { IslandCamera } from '../camera';
import { nearestWater } from './lights';
import { IslandCineFx } from './cineFx';
import { screenFx } from '../../cine/screenFx';
import type { IslandNight, NightAnchors } from './index';

export interface IslandStageHost {
  night: IslandNight;
  cam: IslandCamera;
  anchors: () => NightAnchors;
  actors: () => CatActor[];
  hud: () => Container | null;
  /** ungraded world fx layer ("!" marks, onomatopoeias) */
  wfx: Container;
  shake: (k: number) => void;
  /** world taps + camera drag on/off (off while the cine holds the camera) */
  input: (on: boolean) => void;
  alive: () => boolean;
  blocked: () => boolean;
}

/** flourishes the island's cats feel (others: nothing) */
const WAVE: Record<string, 'boom' | 'wonder'> = {
  shake: 'boom',
  'o3:shatter': 'boom',
  'o3:crack': 'boom',
  burst: 'wonder',
  shoot: 'wonder',
  ignite: 'wonder',
};

interface Later {
  t: number;
  fn: () => void;
}

/** named parameters / flourishes a later wave adds from its OWN files (Oleada 3: ui/story/o3Sky.ts), so the island
 *  stage never needs editing per wave. Ids are namespaced ('o3:rift'); unknown ids fall through as before. */
export interface IslandDrive {
  get(): number | undefined;
  set(k: number, ctx: CineCtx): void;
}
const EXTRA_DRIVES = new Map<string, IslandDrive>();
const EXTRA_FX = new Map<string, (cmd: FxCmd, ctx: CineCtx) => (() => void) | void>();
export function registerIslandDrive(id: string, d: IslandDrive) {
  EXTRA_DRIVES.set(id, d);
}
export function registerIslandFx(id: string, fn: (cmd: FxCmd, ctx: CineCtx) => (() => void) | void) {
  EXTRA_FX.set(id, fn);
}
/** named places a later wave adds (Oleada 3: 'maneki', where she sweeps): a camera / actor target like 'home' */
const EXTRA_TARGETS = new Map<string, () => { x: number; y: number } | null>();
export function registerIslandTarget(id: string, fn: () => { x: number; y: number } | null) {
  EXTRA_TARGETS.set(id, fn);
}

export class IslandStage implements CineStage {
  readonly id = 'island';
  private taps = new Map<string, Set<() => void>>();
  private later: Later[] = [];
  private hudWant = 1;
  private hudDriven = false;
  private extra: IslandCineFx;
  constructor(private h: IslandStageHost) {
    this.extra = new IslandCineFx({ night: h.night, actors: h.actors, wfx: h.wfx, pick: (w) => this.pick(w), resolve: (t) => this.resolve(t) });
  }

  // ------------------------------------------------------------------ lifecycle
  alive() {
    return this.h.alive();
  }
  blocked() {
    return this.h.blocked();
  }
  /** the player tapped something in the world (IslandScene calls it: 'faro'…) */
  tapped(id: string) {
    for (const f of [...(this.taps.get(id) ?? [])]) f();
  }
  /** per frame (IslandScene.update) */
  update(dt: number) {
    for (let i = this.later.length - 1; i >= 0; i--) {
      const l = this.later[i];
      l.t -= dt;
      if (l.t <= 0) {
        this.later.splice(i, 1);
        l.fn();
      }
    }
    // the HUD fades only while a cine drives it (nobody else's alpha is ever overwritten)
    const hud = this.h.hud();
    if (this.hudDriven && hud && !hud.destroyed) {
      const a = hud.alpha + (this.hudWant - hud.alpha) * Math.min(1, dt * 7);
      hud.alpha = Math.abs(a - this.hudWant) < 0.01 ? this.hudWant : a;
      hud.visible = hud.alpha > 0.01;
      if (hud.alpha === 1 && this.hudWant === 1) this.hudDriven = false;
    }
  }
  dispose() {
    this.later.length = 0;
    this.taps.clear();
    this.extra.dispose();
    this.h.input(true);
    const hud = this.h.hud();
    if (hud && !hud.destroyed) {
      hud.alpha = 1;
      hud.visible = true;
      hud.interactiveChildren = true;
    }
  }

  // ------------------------------------------------------------------ targets & camera
  resolve(t: Target): { x: number; y: number } | null {
    if (typeof t !== 'string') return t;
    const a = this.h.anchors();
    if (t === 'lagoon') {
      const f = a.faro;
      return f ? nearestWater(f.x, f.y + 170, 900) : null;
    }
    // «the rocks off your island»: open water a little out from the faro (H40's reflection sits there)
    if (t === 'rocks') {
      const f = a.faro;
      return f ? nearestWater(f.x - 260, f.y + 260, 1200) : null;
    }
    if (t in a && a[t]) return a[t]!;
    const extra = EXTRA_TARGETS.get(t)?.();
    if (extra) return extra;
    const actor = this.pick(t)[0];
    return actor ? { x: actor.x, y: actor.y - 60 } : null;
  }
  cameraGet() {
    const c = this.h.cam;
    return { x: c.center.x, y: c.center.y, zoom: c.zoom };
  }
  cameraSet(x: number, y: number, zoom: number) {
    this.h.cam.lookAt(x, y, false, zoom);
  }

  // ------------------------------------------------------------------ world
  worldGet(): WorldLook {
    return this.h.night.get();
  }
  worldSet(l: WorldLook) {
    this.h.night.hideMarker();
    this.h.night.set(l);
  }
  worldRelease(blend: number) {
    this.h.night.farDrive = null;
    this.h.night.release(blend);
  }
  /** the dawn scene: keep the story's daylight while you watch (the real clock resumes next time you come home) */
  holdDay() {
    this.h.night.holdClock = true;
  }
  // named parameters a scene can drive (DriveCmd): the island of books on the horizon
  driveGet(id: string) {
    return id === 'farIsle' ? (this.h.night.farDrive ?? 0) : EXTRA_DRIVES.get(id)?.get();
  }
  drive(id: string, k: number, ctx?: CineCtx) {
    if (id === 'farIsle') this.h.night.farDrive = k;
    else if (ctx) EXTRA_DRIVES.get(id)?.set(k, ctx);
  }
  hud(visible: boolean) {
    this.hudWant = visible ? 1 : 0;
    this.hudDriven = true;
    const hud = this.h.hud();
    if (hud && !hud.destroyed) hud.interactiveChildren = visible;
    this.h.input(visible);
  }

  // ------------------------------------------------------------------ actors
  private pick(who: string): CatActor[] {
    const all = this.h.actors();
    if (who === 'all') return all;
    if (who === 'canelo') return all.filter((a) => a.species === 'c_canelo');
    if (who.startsWith('cat:')) return all.filter((a) => a.catUid === who.slice(4));
    if (who.startsWith('species:')) return all.filter((a) => a.species === who.slice(8));
    if (who.startsWith('near:')) {
      const p = this.resolve(who.slice(5));
      if (!p) return [];
      return [...all].sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 6);
    }
    if (who.startsWith('awake')) return all.filter((a) => a.night !== 'sleep' && a.mood !== 'sleep' && a.mood !== 'boxsleep');
    return [];
  }

  actor(cmd: ActorCmd, ctx: CineCtx) {
    const list = this.pick(cmd.who);
    // a crowd answers in character, each after its own reaction time (art/temperament.ts): never in lockstep.
    // One named cat keeps the script's exact beat and only adds its body (anticipation, weight).
    const crowd = list.length > 1;
    list.forEach((a, i) => {
      const run = () => {
        if (a.destroyed) return;
        const sp = a.cat.sprite;
        switch (cmd.do) {
          case 'emote': {
            const kind = (cmd.arg ?? 'surprise') as Parameters<typeof sp.emote>[0];
            if (kind === 'surprise' || kind === 'happy') {
              const ev = kind === 'happy' ? 'joy' : 'startle';
              if (crowd) {
                if (!a.react(ev, null, { force: true })) sp.emote(kind, 1);
              } else {
                sp.emote(kind, 1);
                a.playReaction(a.prof.temperament.react[ev], null, 0);
              }
            } else if (kind === 'attack' && !crowd) {
              // the lunge gets its anticipation (lean back, gather) instead of snapping forward
              if (!a.playReaction('advance', null, 0)) sp.emote(kind, 1);
            } else sp.emote(kind, 1);
            break;
          }
          case 'act':
            sp.doAct((cmd.arg ?? 'look') as Parameters<typeof sp.doAct>[0]);
            break;
          case 'hop':
            if (!crowd || !a.react('joy', null, { force: true })) a.happy();
            break;
          case 'look': {
            const p = cmd.arg ? this.resolve(cmd.arg) : null;
            if (!p) break;
            const g = this.h.night.toGlobal(p);
            // a crowd turns one by one, and each body answers what it saw (the curious step closer, the shy duck)
            if (!crowd || !a.react('wonder', g, { force: true, gaze: cmd.dur ?? 3 })) a.gazeAt(g, cmd.dur ?? 3);
            break;
          }
          case 'mark':
            this.mark(a, cmd.arg ?? '!', ctx);
            break;
          case 'react':
            if (cmd.arg === 'canelo') this.caneloSwat(a, ctx);
            break;
        }
      };
      const d = (cmd.stagger ?? 0) * i;
      if (d > 0) this.later.push({ t: d, fn: run });
      else run();
    });
  }

  /** a comic «!» popping over a cat (ink, no emoji) */
  private mark(a: CatActor, text: string, ctx: CineCtx) {
    const t = txt(text, { fontFamily: F.comic, fontSize: 58, fill: C.yellow, stroke: { color: C.ink, width: 9, join: 'round' } }) as Text;
    t.anchor.set(0.5, 1);
    const k = Math.max(0.6, a.scale.y);
    t.position.set(a.x + 10, a.y - 112 * k);
    t.rotation = (Math.random() - 0.5) * 0.3;
    this.h.wfx.addChild(t);
    const rm = ctx.reduceMotion;
    t.scale.set(rm ? 1 : 0.2);
    const tl = gsap.timeline({ onComplete: () => t.destroy() });
    if (!rm) tl.to(t.scale, { x: 1, y: 1, duration: 0.28, ease: 'back.out(3)' });
    tl.to(t, { y: t.y - 26, duration: 1.4, ease: 'sine.out' }, 0).to(t, { alpha: 0, duration: 0.35 }, 1.25);
  }

  /** Canelo's own reaction: he jumps at the sky to catch a star. He misses. He'll pretend he didn't try. */
  private caneloSwat(a: CatActor, ctx: CineCtx) {
    const sp = a.cat.sprite;
    // his own repertoire (art/intent.ts 'swat'): wiggle, leap, miss, land, groom — «¡MÍA!» comes with the leap
    if (a.swat(null, true)) {
      if (!ctx.reduceMotion) this.later.push({ t: 0.36, fn: () => !a.destroyed && sparkles(this.h.wfx, a.x, a.y - 120, 0xfff1c8, 10, 110) });
      return;
    }
    sp.emote('attack', 1);
    a.happy();
    this.later.push({ t: 0.18, fn: () => !a.destroyed && a.happy() });
    onomatopoeia(this.h.wfx, a.x, a.y - 170, '¡MÍA!', { size: 70, color: C.yellow });
    if (!ctx.reduceMotion) sparkles(this.h.wfx, a.x, a.y - 120, 0xfff1c8, 10, 110);
    this.later.push({
      t: 1.6,
      fn: () => {
        if (a.destroyed) return;
        sp.emote('sleepy', 0.6);
        sp.doAct('groom');
      },
    });
  }

  // ------------------------------------------------------------------ flourishes
  fx(cmd: FxCmd, ctx: CineCtx): (() => void) | void {
    this.wave(cmd);
    const n = this.h.night;
    switch (cmd.id) {
      case 'burst':
        n.burst(Number(cmd.n ?? 40), Number(cmd.dur ?? 3), { far: cmd.far !== undefined ? Number(cmd.far) : undefined });
        return;
      case 'shoot':
        void n.shoot(!!cmd.reverse);
        return () => n.sky.clearShoots();
      case 'ignite':
        n.ignite();
        return;
      case 'shake':
        if (!ctx.reduceMotion) this.h.shake(Number(cmd.k ?? 0.3));
        return;
      case 'reflect':
        n.setReflect(Number(cmd.to ?? 1));
        return () => n.setReflect(0);
      case 'aim':
        n.aimFaro(cmd.angle === undefined || cmd.angle === null ? null : Number(cmd.angle));
        return () => n.aimFaro(null);
      case 'holdDay':
        // the dawn: the story's daylight stays while you watch (the real clock resumes next time you come home)
        if (!ctx.replay) n.holdClock = true;
        return;
    }
    const own = EXTRA_FX.get(cmd.id);
    if (own) return own(cmd, ctx) ?? undefined;
    return this.extra.fx(cmd, ctx) ?? screenFx(cmd, ctx);
  }

  /**
   * The island feels a flourish: the cats answer it in a wave from where it happened (the near ones first), each in
   * character and after its own reaction time (art/temperament.ts). Presentation only; a cat that just reacted to a
   * scripted beat keeps it (cooldown), the lockstep «corrected» pose and hidden cats are left alone.
   */
  private wave(cmd: FxCmd) {
    if (cmd.off) return;
    const kind = WAVE[cmd.id];
    if (!kind) return;
    const a = this.h.anchors();
    const src = kind === 'wonder' && a.faro ? { x: a.faro.x, y: a.faro.y - 260 } : null;
    const origin = src ?? this.cameraGet();
    const at = src ? this.h.night.toGlobal(src) : null;
    for (const c of this.h.actors()) {
      if (c.destroyed || !c.visible || c.alpha < 0.5) continue;
      const d = Math.hypot(c.x - origin.x, c.y - origin.y);
      c.react(kind, at, { delay: Math.min(0.9, d / 2200) });
    }
  }

  // ------------------------------------------------------------------ interaction
  interact(cmd: InteractCmd, _ctx: CineCtx) {
    const id = typeof cmd.target === 'string' ? cmd.target : '';
    const at = this.resolve(cmd.target);
    const off = at ? this.h.night.marker(at, cmd.prompt ?? '¡TOCA!') : () => undefined;
    let res!: () => void;
    const done = new Promise<void>((r) => (res = r));
    const set = this.taps.get(id) ?? new Set();
    this.taps.set(id, set);
    const hit = () => res();
    set.add(hit);
    return {
      done,
      cancel: () => {
        off();
        set.delete(hit);
      },
    };
  }
}
