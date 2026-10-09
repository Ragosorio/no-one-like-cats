/**
 * What cats do on the home island when nobody is looking (Rupturas vertical slice).
 * Activities for the engine's LifeDirector. Personality = traits + element tags, e.g.
 * - fire cats love the lava and visit the snow just to watch it steam;
 * - water cats LOVE the rain (everyone else runs for cover) and swim off the beach;
 * - cosmic cats come out to stargaze at night; storm cats get hyper in thunderstorms;
 * - Canelo has his palm. It is his. He sleeps there, and when it rains he sleeps there harder.
 */
import * as THREE from 'three';
import type { Activity, Agent, LifeWorld } from '../engine/life/director';
import { walkable } from './island';

export interface Spots {
  home: Record<string, THREE.Vector3>;
  shelters: THREE.Vector3[];
  shore: THREE.Vector3[];
  iceCenter: THREE.Vector3;
  cosmic: THREE.Vector3;
  lava: THREE.Vector3;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const near = (a: Agent, p: THREE.Vector3 | Agent, r = 0.6) => {
  const q = 'pos' in p ? p.pos : p;
  return Math.hypot(a.pos.x - q.x, a.pos.z - q.z) < r;
};

function randomWalkable(w: LifeWorld, around: THREE.Vector3, r: number) {
  for (let k = 0; k < 20; k++) {
    const ang = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * r;
    const x = around.x + Math.cos(ang) * d;
    const z = around.z + Math.sin(ang) * d;
    if (walkable(x, z) && !w.obstacles.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.3)) return v(x, w.groundAt(x, z), z);
  }
  return around.clone();
}

function goTo(a: Agent, p: THREE.Vector3, speed = 2.2) {
  a.target = p.clone();
  a.speed = speed;
  a.arrived = false;
  a.mem.blocked = 0;
}

/** shared tail for "walk there, then do X for a while" */
function travel(a: Agent, dt: number) {
  if (!a.arrived) {
    // give up on unreachable spots instead of moon-walking against a cliff forever
    if (((a.mem.blocked as number) ?? 0) > 2.5) return 'stuck';
    return 'walking';
  }
  a.mem.stay = ((a.mem.stay as number) ?? 0) + dt;
  return 'there';
}

export function activities(spots: Spots): Activity[] {
  const wander: Activity = {
    id: 'wander',
    score: (a) => 0.35 + (a.traits.curious ?? 0.5) * 0.3,
    start(a, w) {
      const home = spots.home[a.id] ?? a.pos;
      goTo(a, randomWalkable(w, home, 9), 1.6 + Math.random() * 0.8);
      a.label = 'pasea por ahí';
      a.mem.dur = 3 + Math.random() * 4;
    },
    update(a, _w, dt) {
      const s = travel(a, dt);
      if (s === 'stuck') return true;
      if (s === 'there') a.label = 'se quedó viendo la nada';
      return s === 'there' && (a.mem.stay as number) > (a.mem.dur as number);
    },
  };

  const nap: Activity = {
    id: 'nap',
    stickiness: 0.5,
    score: (a, w) => (1 - a.needs.energy) * 1.4 + w.night * 0.4 * (a.tags.has('cosmic') ? 0.2 : 1) + (a.tags.has('canelo') && w.rain > 0.3 ? 0.9 : 0),
    start(a, w) {
      // rain sends sleepers to a roof (water cats do not care)
      let spot = spots.home[a.id] ?? a.pos;
      if (w.rain > 0.3 && !a.tags.has('water') && !a.tags.has('canelo')) spot = nearest(a, spots.shelters);
      goTo(a, spot.clone().add(v((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8)), 1.7);
      a.label = a.tags.has('canelo') ? 'va a SU palmera' : 'busca dónde dormir';
    },
    update(a, w, dt) {
      const s = travel(a, dt);
      if (s === 'stuck') return true;
      if (s === 'there') {
        a.cat.brain.sleeping = true;
        a.label = a.tags.has('canelo') ? (w.rain > 0.3 ? 'duerme bajo su palmera mientras llueve' : 'duerme bajo su palmera') : 'duerme';
        if (Math.random() < dt * 0.25) w.fx.zzz?.(a.pos, a);
      }
      return a.needs.energy > 0.97 && !(a.tags.has('canelo') && w.rain > 0.3);
    },
    stop(a) {
      a.cat.brain.sleeping = false;
      a.cat.brain.emote('sleepy', 0.8);
    },
  };

  const chase: Activity = {
    id: 'chase',
    stickiness: 0.6,
    interruptible: false,
    score(a, w) {
      if (a.claimed || w.rain > 0.5 || w.night > 0.8) return 0;
      const partner = w.agents.find((o) => o !== a && !o.claimed && o.activity?.id !== 'nap' && !o.swimming && (o.traits.playful ?? 0) > 0.5);
      return partner ? a.needs.play * (a.traits.playful ?? 0.4) * 1.5 : 0;
    },
    start(a, w) {
      const partner = w.agents
        .filter((o) => o !== a && !o.claimed && o.activity?.id !== 'nap' && !o.swimming)
        .sort((p, q) => p.pos.distanceTo(a.pos) - q.pos.distanceTo(a.pos))[0];
      if (!partner) return;
      partner.activity?.stop?.(partner, w);
      partner.activity = fleeing;
      partner.mem = { chaser: a };
      partner.claimed = true;
      partner.busyWith = a;
      a.busyWith = partner;
      a.mem.prey = partner;
      a.mem.t = 0;
      a.mem.swaps = 0;
      a.cat.brain.crouch = 0.8; // anticipation
      partner.cat.brain.emote('surprise');
      a.label = `persigue a ${partner.name}`;
      partner.label = `huye de ${a.name}`;
    },
    update(a, w, dt) {
      const prey = a.mem.prey as Agent | undefined;
      if (!prey) return true;
      a.mem.t = (a.mem.t as number) + dt;
      if ((a.mem.t as number) > 0.35) a.cat.brain.crouch = 0;
      goTo(a, prey.pos, 4.4);
      // tag! swap roles a couple of times, then both flop down happy
      if (near(a, prey, 1.0) && (a.mem.t as number) > 1.2) {
        a.mem.swaps = (a.mem.swaps as number) + 1;
        a.cat.brain.emote('happy');
        prey.cat.brain.emote('happy');
        w.fx.dust?.(prey.pos);
        if ((a.mem.swaps as number) >= 3) return true;
        a.mem.t = 0;
        // swap: the prey flees from a new direction (role flip without replanning)
        const away = prey.pos.clone().sub(a.pos).setY(0).normalize().multiplyScalar(6);
        prey.mem.flee = randomWalkable(w, prey.pos.clone().add(away), 3);
      }
      return (a.mem.t as number) > 7;
    },
    stop(a, w) {
      const prey = a.mem.prey as Agent | undefined;
      a.busyWith = null;
      a.needs.play = 0;
      a.needs.social = 0;
      if (prey) {
        prey.claimed = false;
        prey.busyWith = null;
        prey.needs.play = 0.1;
        prey.activity = null;
        prey.target = null;
        prey.cat.brain.emote('happy');
      }
      a.target = null;
      void w;
    },
  };

  const fleeing: Activity = {
    id: 'flee',
    score: () => 0,
    start() {},
    update(a, w) {
      const ch = a.mem.chaser as Agent | undefined;
      if (!ch) return true;
      let f = a.mem.flee as THREE.Vector3 | undefined;
      if (!f || near(a, f, 1.2)) {
        const away = a.pos.clone().sub(ch.pos).setY(0).normalize().multiplyScalar(7);
        // run in circles around home instead of off to the far end of the island
        const home = spots.home[a.id] ?? a.pos;
        const want = a.pos.clone().add(away).lerp(home, Math.min(0.8, a.pos.distanceTo(home) / 18));
        f = randomWalkable(w, want, 3);
        a.mem.flee = f;
      }
      goTo(a, f, 4.2);
      return false;
    },
  };

  /** fire cats visit the snow to watch it hiss; the ice cat is NOT amused, then kind of is */
  const steamVisit: Activity = {
    id: 'steam',
    score: (a, w) => (a.tags.has('fire') && !a.tags.has('canelo') && w.rain < 0.3 ? 0.35 + a.needs.play * 0.6 : 0),
    start(a, w) {
      goTo(a, randomWalkable(w, spots.iceCenter, 2.5), 2.6);
      a.label = 'va a derretir la nieve';
      a.mem.puff = 0;
    },
    update(a, w, dt) {
      const s = travel(a, dt);
      if (s === 'stuck') return true;
      if (s === 'there') {
        a.label = 'derrite la nieve (a propósito)';
        a.mem.puff = (a.mem.puff as number) - dt;
        if ((a.mem.puff as number) <= 0) {
          a.mem.puff = 0.18;
          w.fx.steam?.(a.pos);
        }
        if ((a.mem.stay as number) > 0.6 && !a.mem.reacted) {
          a.mem.reacted = true;
          const ice = w.agents.find((o) => o.tags.has('ice'));
          if (ice && ice.pos.distanceTo(a.pos) < 9) {
            ice.cat.brain.emote('surprise');
            ice.mem.annoyedAt = a;
          }
          a.cat.brain.emote('happy');
        }
        if (Math.random() < dt * 0.6) a.cat.brain.crouch = Math.random() < 0.5 ? 0.6 : 0;
      }
      return (a.mem.stay as number) > 6;
    },
    stop(a) {
      a.cat.brain.crouch = 0;
      a.needs.play *= 0.3;
    },
  };

  const stargaze: Activity = {
    id: 'stargaze',
    stickiness: 0.4,
    score: (a, w) => (a.tags.has('cosmic') ? w.night * 1.3 * (1 - w.rain) : 0),
    start(a, w) {
      goTo(a, randomWalkable(w, spots.cosmic, 3), 1.6);
      a.label = 'sale a ver las estrellas';
    },
    update(a, w, dt) {
      const s = travel(a, dt);
      if (s === 'stuck') return true;
      if (s === 'there') {
        a.label = w.night > 0.6 ? 'mira estrellas que caen hacia ARRIBA' : 'espera a que oscurezca';
        a.cat.brain.crouch = -0.3; // stretch up, chin high
        if (Math.random() < dt * 2.5) w.fx.starmote?.(a.pos, a);
      }
      return w.night < 0.3 || w.rain > 0.5;
    },
    stop(a) {
      a.cat.brain.crouch = 0;
    },
  };

  const shelter: Activity = {
    id: 'shelter',
    stickiness: 0.4,
    score: (a, w) => (w.rain > 0.3 && !a.tags.has('water') && !(a.tags.has('storm') && w.storm > 0.5) ? 1.2 * w.rain : 0),
    start(a) {
      goTo(a, nearest(a, spots.shelters).clone().add(v((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2)), 3.6);
      a.label = 'corre a cubrirse';
      a.cat.brain.emote('surprise', 0.6);
    },
    update(a, w, dt) {
      const s = travel(a, dt);
      if (s === 'stuck') return true;
      if (s === 'there') {
        a.label = 'espera a que pare de llover';
        a.cat.brain.crouch = 0.25;
      }
      return w.rain < 0.2;
    },
    stop(a) {
      a.cat.brain.crouch = 0;
    },
  };

  const rainDance: Activity = {
    id: 'raindance',
    score: (a, w) => (a.tags.has('water') && w.rain > 0.3 ? 1.4 : a.tags.has('storm') && w.storm > 0.5 ? 1.5 : 0),
    start(a, w) {
      a.label = a.tags.has('storm') ? '¡TORMENTA! (está feliz)' : 'baila bajo la lluvia';
      goTo(a, randomWalkable(w, a.pos, 5), a.tags.has('storm') ? 4.6 : 2.6);
    },
    update(a, w, dt) {
      if (a.arrived || ((a.mem.blocked as number) ?? 0) > 1.5) {
        goTo(a, randomWalkable(w, spots.home[a.id] ?? a.pos, 6), a.tags.has('storm') ? 4.6 : 2.6);
        a.cat.brain.emote('happy');
        if (a.tags.has('storm')) w.fx.spark?.(a.pos, a);
      }
      void dt;
      return w.rain < 0.25 && w.storm < 0.3;
    },
  };

  const swim: Activity = {
    id: 'swim',
    stickiness: 0.3,
    score: (a, w) => (a.tags.has('water') && w.rain < 0.3 ? 0.55 + a.needs.play * 0.5 : 0),
    start(a) {
      const shore = nearest(a, spots.shore);
      goTo(a, shore, 2.4);
      a.label = 'va a nadar';
      a.mem.phase = 'go';
    },
    update(a, w, dt) {
      const ph = a.mem.phase as string;
      if (ph === 'go') {
        const s = travel(a, dt);
        if (s === 'stuck') return true;
        if (s === 'there') {
          a.swimming = true;
          const out = a.pos.clone().setY(0);
          out.multiplyScalar(1 + 6 / Math.max(10, out.length()));
          goTo(a, out, 1.2);
          a.mem.phase = 'swim';
          a.mem.stay = 0;
          w.fx.splash?.(a.pos);
        }
      } else if (ph === 'swim') {
        a.label = 'nada (los gatos SON líquidos)';
        a.mem.stay = ((a.mem.stay as number) ?? 0) + dt;
        if (a.arrived && Math.random() < dt * 0.5) {
          const p = a.pos.clone().add(v((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6));
          goTo(a, p, 1.1);
        }
        if ((a.mem.stay as number) > 14) {
          goTo(a, nearest(a, spots.shore), 1.4);
          a.mem.phase = 'back';
        }
      } else {
        if (a.arrived || walkable(a.pos.x, a.pos.z)) {
          a.swimming = false;
          a.cat.lift = 0;
          w.fx.splash?.(a.pos);
          a.cat.brain.emote('happy');
          return true;
        }
      }
      return false;
    },
    stop(a) {
      if (a.swimming) {
        a.swimming = false;
        a.cat.lift = 0;
        a.pos.copy(nearest(a, spots.shore));
      }
    },
  };

  const lavaLounge: Activity = {
    id: 'lava',
    stickiness: 0.5,
    score: (a, w) => (a.tags.has('fire') && a.tags.has('lava') ? 0.9 + w.night * 0.3 : 0),
    start(a, w) {
      goTo(a, randomWalkable(w, spots.lava, 1.5), 1.4);
      a.label = 'se baña en lava (spa)';
    },
    update(a, w, dt) {
      const s = travel(a, dt);
      if (s === 'stuck') return true;
      if (s === 'there') {
        a.cat.brain.crouch = 0.3;
        if (Math.random() < dt * 0.15) a.cat.brain.doAct('stretch');
      }
      return (a.mem.stay as number) > 20 || w.rain > 0.5;
    },
    stop(a) {
      a.cat.brain.crouch = 0;
    },
  };

  const greet: Activity = {
    id: 'greet',
    score(a, w) {
      if (a.claimed) return 0;
      const o = w.agents.find((x) => x !== a && !x.claimed && !x.swimming && x.activity?.id !== 'nap' && x.pos.distanceTo(a.pos) < 7);
      return o ? a.needs.social * 0.9 : 0;
    },
    start(a, w) {
      const o = w.agents.filter((x) => x !== a && !x.claimed && !x.swimming && x.activity?.id !== 'nap').sort((p, q) => p.pos.distanceTo(a.pos) - q.pos.distanceTo(a.pos))[0];
      a.mem.o = o;
      if (o) {
        goTo(a, o.pos, 2.0);
        a.label = `va a saludar a ${o.name}`;
      }
    },
    update(a, w, dt) {
      const o = a.mem.o as Agent | undefined;
      if (!o) return true;
      if (!a.mem.met) {
        goTo(a, o.pos, 2.0);
        if (near(a, o, 1.5)) {
          a.mem.met = true;
          a.target = null;
          a.mem.t = 0;
          a.cat.brain.emote('happy');
          o.cat.brain.emote('happy');
          w.fx.heart?.(a.pos.clone().lerp(o.pos, 0.5));
          a.label = `choca la cabeza con ${o.name}`;
        }
        return ((a.mem.blocked as number) ?? 0) > 3;
      }
      a.mem.t = (a.mem.t as number) + dt;
      return (a.mem.t as number) > 2.5;
    },
    stop(a) {
      a.needs.social = 0;
    },
  };

  const sit: Activity = {
    id: 'sit',
    score: (a) => 0.3 + (1 - (a.traits.curious ?? 0.5)) * 0.25,
    start(a) {
      a.target = null;
      a.label = ['se acicala', 'mira el mar', 'juzga en silencio', 'existe'][Math.floor(Math.random() * 4)];
      a.mem.dur = 4 + Math.random() * 5;
      a.mem.t = 0;
      if (a.label === 'se acicala') a.cat.brain.doAct('groom');
    },
    update(a, _w, dt) {
      a.mem.t = (a.mem.t as number) + dt;
      return (a.mem.t as number) > (a.mem.dur as number);
    },
  };

  return [wander, nap, chase, steamVisit, stargaze, shelter, rainDance, swim, lavaLounge, greet, sit];
}

function nearest(a: Agent, list: THREE.Vector3[]) {
  let best = list[0];
  let bd = Infinity;
  for (const p of list) {
    const d = Math.hypot(a.pos.x - p.x, a.pos.z - p.z);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}
