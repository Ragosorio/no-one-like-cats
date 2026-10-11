/**
 * A Parte II 3D region as a CINE stage (src/cine/types.ts CineStage), registered by RegionScene as 'region'
 * once the island is built (withdrawn on exit, which interrupts the scene playing there).
 *
 * - camera: `{ camera: { to: [x, y, z], dist, pitch, yaw, dur } }` tweens the orbit rig on the cine's clock
 *   (FPS-independent; SALTAR jumps to the last frame; reduce motion cuts)
 * - actor: residents by 'canelo' | 'res:<id>' | 'all' (emote / hop)
 * - fx: 'stars' (a burst of rising stars), 'shake', 'float' (floating text); anything else → the region's own
 *   RegionBuild.cine.fx, then the screen-level flourishes (cine/screenFx.ts)
 * - drive: the region's named parameters (Páginas: 'rise' = the island coming up out of the sea)
 * - hud: the region's Pixi HUD (name plate, back button, markers) fades out while a scene holds the screen
 * The world look (night/grade) isn't used by 3D regions: their sky follows their own hour.
 */
import * as THREE from 'three';
import type { Container } from 'pixi.js';
import gsap from 'gsap';
import type { World3D } from '../engine/world/World3D';
import type { ActorCmd, CameraCmd, CineCtx, CineStage, FxCmd, InteractCmd, Target } from '../cine/types';
import { lookOf, type WorldLook } from '../state/sys/worldState';
import { screenFx } from '../cine/screenFx';
import type { RegionBuild } from './types';

export interface RegionStageHost {
  regionId: string;
  world: World3D;
  hud: Container;
  build: () => RegionBuild | null;
  alive: () => boolean;
  blocked: () => boolean;
  floatText: (p: THREE.Vector3, text: string) => void;
  /** a scene holds the screen: the scene ignores taps on residents / markers */
  hold: (on: boolean) => void;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** shortest way around for yaw */
function lerpAngle(a: number, b: number, k: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

export class RegionStage implements CineStage {
  readonly id = 'region';
  private look: WorldLook = lookOf('normal');
  constructor(private h: RegionStageHost) {}
  get regionId() {
    return this.h.regionId;
  }
  alive() {
    return this.h.alive();
  }
  blocked() {
    return this.h.blocked();
  }
  resolve(t: Target): { x: number; y: number } | null {
    return typeof t === 'string' ? null : t;
  }
  cameraGet() {
    return { x: 0, y: 0, zoom: 1 };
  }
  cameraSet() {
    /* 3D: cameraTween */
  }
  cameraTween(c: CameraCmd) {
    const rig = this.h.world.rig;
    const pts = this.h.build()?.cine?.points ?? {};
    const to3 = Array.isArray(c.to) ? new THREE.Vector3(...c.to) : typeof c.to === 'string' && pts[c.to] ? pts[c.to].clone() : null;
    if (!to3) return null;
    rig.follow = null;
    const from = { t: rig.cur.target.clone(), yaw: rig.cur.yaw, pitch: rig.cur.pitch, dist: rig.cur.dist };
    const to = { yaw: c.yaw ?? from.yaw, pitch: c.pitch ?? from.pitch, dist: c.dist ?? from.dist };
    return (k: number) => {
      const g = rig.goal;
      g.target.lerpVectors(from.t, to3, k);
      g.yaw = lerpAngle(from.yaw, to.yaw, k);
      g.pitch = lerp(from.pitch, to.pitch, k);
      g.dist = lerp(from.dist, to.dist, k);
      rig.cut();
    };
  }
  worldGet() {
    return { ...this.look };
  }
  worldSet(l: WorldLook) {
    this.look = l;
  }
  worldRelease() {
    this.look = lookOf('normal');
  }
  private saved: { click: World3D['rig']['onClick']; ignore: World3D['rig']['ignore'] } | null = null;
  hud(visible: boolean) {
    const hud = this.h.hud;
    this.h.hold(!visible);
    // while a scene holds the screen the camera is the scene's: no orbiting, no taps on the island
    const rig = this.h.world.rig;
    if (!visible && !this.saved) {
      this.saved = { click: rig.onClick, ignore: rig.ignore };
      rig.onClick = null;
      rig.ignore = () => true;
    } else if (visible && this.saved) {
      rig.onClick = this.saved.click;
      rig.ignore = this.saved.ignore;
      this.saved = null;
    }
    if (hud.destroyed) return;
    hud.interactiveChildren = visible;
    gsap.to(hud, { alpha: visible ? 1 : 0, duration: 0.35 });
  }

  private residents(who: string) {
    const all = [...this.h.world.residents.entries()];
    if (who === 'all') return all.map(([, r]) => r);
    if (who === 'canelo') return all.filter(([, r]) => r.opts.tags.includes('canelo')).map(([, r]) => r);
    if (who.startsWith('res:')) return all.filter(([id]) => id === who.slice(4)).map(([, r]) => r);
    return [];
  }
  actor(cmd: ActorCmd) {
    this.residents(cmd.who).forEach((r, i) => {
      const run = () => {
        const b = r.cat.brain;
        if (cmd.do === 'emote') b.emote((cmd.arg ?? 'surprise') as Parameters<typeof b.emote>[0], 0.8);
        else if (cmd.do === 'hop') b.emote('happy', 0.8);
      };
      const d = (cmd.stagger ?? 0) * i;
      if (d > 0) setTimeout(run, d * 1000);
      else run();
    });
  }
  fx(cmd: FxCmd, ctx: CineCtx): (() => void) | void {
    const w = this.h.world;
    const at = (v: unknown, dflt: THREE.Vector3) => (Array.isArray(v) && v.length === 3 ? new THREE.Vector3(Number(v[0]), Number(v[1]), Number(v[2])) : dflt);
    switch (cmd.id) {
      case 'shake':
        if (!ctx.reduceMotion) w.rig.shake(Number(cmd.k ?? 0.4));
        return;
      case 'stars': {
        // stars falling UP from the sea (the sky's rupture, seen from a 3D sea)
        const p = at(cmd.at, w.rig.cur.target.clone());
        const n = Math.round(Number(cmd.n ?? 40) * (ctx.reduceMotion ? 0.4 : 1));
        const spread = Number(cmd.spread ?? 30);
        w.pools.stars.emit({ pos: { x: p.x, y: p.y, z: p.z }, spread: { x: spread, y: 0.5, z: spread }, vel: { x: 0, y: Number(cmd.up ?? 7), z: 0 }, velJitter: { x: 0.6, y: 2.5, z: 0.6 }, life: Number(cmd.life ?? 4), size: Number(cmd.size ?? 1.3), color: '#fff6c8', color2: '#b79cff', count: n });
        return;
      }
      case 'float':
        this.h.floatText(at(cmd.at, w.rig.cur.target.clone()), String(cmd.text ?? ''));
        return;
    }
    const own = this.h.build()?.cine?.fx?.(cmd, ctx);
    if (own !== undefined) return own || undefined;
    return screenFx(cmd, ctx);
  }
  driveGet(id: string) {
    return this.h.build()?.cine?.driveGet?.(id);
  }
  drive(id: string, k: number, ctx: CineCtx) {
    this.h.build()?.cine?.drive?.(id, k, ctx);
  }
  interact(_cmd: InteractCmd) {
    return { done: Promise.resolve(), cancel: () => undefined };
  }
}
