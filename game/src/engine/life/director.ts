/**
 * Ambient life director (AgentGameEngine `life/director`): the "illusion of life" for many cats at
 * almost no cost. Utility AI, not simulation:
 * - each agent has needs (energy, play, social) that drift over time and traits (0..1 knobs);
 * - activities are small objects with score/start/update; the director re-plans only when an
 *   activity ends or something important happens (rain starts, night falls), with commitment
 *   (current activity gets a bonus) and noise (cats are not robots);
 * - steering is local: arrive + separation + circle obstacles + walkability; no navmesh needed for a
 *   single island.
 * The game supplies the activities (rupturas/life.ts) — the engine never knows what a "fire cat" is.
 */
import * as THREE from 'three';
import type { PaperCat } from '../world/paperCat';

export interface Needs {
  energy: number;
  play: number;
  social: number;
}

export interface Agent {
  id: string;
  name: string;
  cat: PaperCat;
  /** world position on the ground (y = ground height) */
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  target: THREE.Vector3 | null;
  speed: number;
  arrived: boolean;
  needs: Needs;
  traits: Record<string, number>;
  tags: Set<string>;
  activity: Activity | null;
  /** free-form per-activity memory */
  mem: Record<string, unknown>;
  /** human-readable "what is it doing" (UI) */
  label: string;
  busyWith: Agent | null;
  swimming: boolean;
  hop: number;
  /** reserved by another agent's social activity (chase, greet) */
  claimed: boolean;
}

export interface Activity {
  id: string;
  /** commitment: higher = harder to interrupt */
  stickiness?: number;
  /** may be interrupted by a world event replan */
  interruptible?: boolean;
  score(a: Agent, w: LifeWorld): number;
  start(a: Agent, w: LifeWorld): void;
  /** return true when finished */
  update(a: Agent, w: LifeWorld, dt: number): boolean;
  stop?(a: Agent, w: LifeWorld): void;
}

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

export interface LifeWorld {
  time: number;
  hour: number;
  night: number;
  rain: number;
  storm: number;
  agents: Agent[];
  obstacles: Obstacle[];
  groundAt(x: number, z: number): number;
  walkable(x: number, z: number): boolean;
  camera: THREE.Camera;
  /** hooks the game fills (particles, sound…) */
  fx: Record<string, (p: THREE.Vector3, a?: Agent) => void>;
}

const tmp = new THREE.Vector3();
const right = new THREE.Vector3();

export class LifeDirector {
  readonly agents: Agent[] = [];
  private lastRain = 0;
  private lastNight = 0;
  constructor(
    readonly world: LifeWorld,
    readonly activities: Activity[],
  ) {
    world.agents = this.agents;
  }

  add(a: Omit<Agent, 'vel' | 'target' | 'arrived' | 'activity' | 'mem' | 'label' | 'busyWith' | 'swimming' | 'hop' | 'claimed' | 'speed'>) {
    const ag: Agent = { ...a, vel: new THREE.Vector3(), target: null, speed: 2.2, arrived: true, activity: null, mem: {}, label: '', busyWith: null, swimming: false, hop: 0, claimed: false };
    this.agents.push(ag);
    return ag;
  }

  /** choose the best activity (noise + commitment) */
  plan(a: Agent) {
    let best: Activity | null = null;
    let bestS = -Infinity;
    for (const act of this.activities) {
      let s = act.score(a, this.world);
      if (s <= 0) continue;
      s *= 0.85 + Math.random() * 0.3;
      if (act === a.activity) s += act.stickiness ?? 0.15;
      if (s > bestS) {
        bestS = s;
        best = act;
      }
    }
    if (best && best !== a.activity) this.switchTo(a, best);
  }

  switchTo(a: Agent, act: Activity) {
    a.activity?.stop?.(a, this.world);
    a.activity = act;
    a.mem = {};
    act.start(a, this.world);
  }

  update(dt: number) {
    const w = this.world;
    // world events trigger a replan of interruptible activities
    const rainEdge = (w.rain > 0.3) !== (this.lastRain > 0.3);
    const nightEdge = (w.night > 0.5) !== (this.lastNight > 0.5);
    this.lastRain = w.rain;
    this.lastNight = w.night;
    for (const a of this.agents) {
      // needs drift (per real second; the slice runs a compressed day)
      const sleeping = a.activity?.id === 'nap';
      a.needs.energy = THREE.MathUtils.clamp(a.needs.energy + (sleeping ? 0.03 : -0.0045 * (1 + w.night)), 0, 1);
      a.needs.play = THREE.MathUtils.clamp(a.needs.play + 0.006 * (a.traits.playful ?? 0.5), 0, 1);
      a.needs.social = THREE.MathUtils.clamp(a.needs.social + 0.004, 0, 1);
      if (!a.activity || ((rainEdge || nightEdge) && a.activity.interruptible !== false && !a.claimed)) this.plan(a);
      if (a.activity && a.activity.update(a, w, dt)) {
        a.activity.stop?.(a, w);
        a.activity = null;
        if (!a.claimed) this.plan(a);
      }
      this.steer(a, dt);
    }
  }

  /** move toward a.target with arrive + separation + obstacles; drive the puppet from velocity */
  private steer(a: Agent, dt: number) {
    const w = this.world;
    const cat = a.cat;
    const desired = tmp.set(0, 0, 0);
    if (a.target) {
      desired.set(a.target.x - a.pos.x, 0, a.target.z - a.pos.z);
      const d = desired.length();
      if (d < 0.35) {
        a.arrived = true;
        desired.set(0, 0, 0);
      } else {
        a.arrived = false;
        desired.multiplyScalar((a.speed * Math.min(1, d / 1.6)) / d);
      }
    }
    // separation
    for (const o of this.agents) {
      if (o === a) continue;
      const dx = a.pos.x - o.pos.x;
      const dz = a.pos.z - o.pos.z;
      const d2 = dx * dx + dz * dz;
      const min = a.busyWith === o ? 0.9 : 1.4;
      if (d2 < min * min && d2 > 1e-4) {
        const d = Math.sqrt(d2);
        desired.x += (dx / d) * (min - d) * 3;
        desired.z += (dz / d) * (min - d) * 3;
      }
    }
    a.vel.lerp(desired, 1 - Math.exp(-dt * 6));
    let nx = a.pos.x + a.vel.x * dt;
    let nz = a.pos.z + a.vel.z * dt;
    for (const ob of w.obstacles) {
      const dx = nx - ob.x;
      const dz = nz - ob.z;
      const d = Math.hypot(dx, dz);
      if (d < ob.r && d > 1e-4) {
        nx = ob.x + (dx / d) * ob.r;
        nz = ob.z + (dz / d) * ob.r;
      }
    }
    if (a.swimming || w.walkable(nx, nz)) {
      a.pos.x = nx;
      a.pos.z = nz;
    } else {
      a.vel.multiplyScalar(-0.3); // bump: turn back a little
      if (a.target && !a.arrived) a.mem.blocked = ((a.mem.blocked as number) ?? 0) + dt;
    }
    const g = w.groundAt(a.pos.x, a.pos.z);
    a.pos.y = a.swimming ? Math.max(g, 0) : g;
    // puppet from motion
    const sp = Math.hypot(a.vel.x, a.vel.z);
    const brain = cat.brain;
    brain.walk = Math.min(1, sp / 2.2);
    brain.lean = Math.min(0.6, Math.max(0, sp - 2.6) * 0.18);
    if (sp > 0.3) {
      right.setFromMatrixColumn(w.camera.matrixWorld, 0);
      const sx = a.vel.x * right.x + a.vel.z * right.z;
      if (Math.abs(sx) > 0.25) cat.facing = sx > 0 ? 1 : -1;
    }
    // hops while running fast
    if (sp > 3.2) a.hop += dt * 7;
    else a.hop = 0;
    const hopLift = sp > 3.2 ? Math.abs(Math.sin(a.hop)) * 0.45 : 0;
    cat.root.position.copy(a.pos);
    cat.ground = a.pos.y;
    if (!a.swimming) cat.lift = hopLift;
  }
}
