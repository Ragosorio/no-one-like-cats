/**
 * COLAPSO ESTELAR — the ability demo of the Rupturas slice.
 * Astraprima throws a star; it opens a singularity over the practice raft that drags crates AND the
 * raft's return fire into itself (the strategic point: it eats projectiles), then collapses into a
 * shockwave. Authored as a timeline of beats; readable, skippable, reduced-motion aware.
 */
import * as THREE from 'three';
import type { ParticlePool } from '../engine/fx/particles';
import type { Ocean } from '../engine/world/ocean';
import { GLSL_NOISE } from '../engine/world/ocean';
import { toonGradient } from '../engine/world/heightfield';

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
  });
}

const toon = (c: THREE.ColorRepresentation) => new THREE.MeshToonMaterial({ color: c, gradientMap: toonGradient() });

interface Debris {
  mesh: THREE.Object3D;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  orbit: number;
  captured: boolean;
  enemy?: boolean;
}

export interface CollapseHooks {
  flash(strength: number): void;
  shake(a: number): void;
  hitstop(ms: number): void;
  damage(p: THREE.Vector3, text: string, big?: boolean): void;
  focus(p: THREE.Vector3, dist: number, pitch?: number): void;
  caster(): { pos: THREE.Vector3; emote(k: 'attack' | 'happy'): void; crouch(v: number): void };
  say(text: string): void;
}

export class PracticeRaft {
  readonly group = new THREE.Group();
  readonly crates: THREE.Mesh[] = [];
  readonly planks: THREE.Mesh[] = [];
  broken = false;
  constructor(readonly at: THREE.Vector3) {
    this.build();
  }
  build() {
    disposeTree(this.group);
    this.group.clear();
    this.crates.length = 0;
    this.planks.length = 0;
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 4.4), toon(i % 2 ? '#8a5a38' : '#9c6a44'));
      p.position.set(-1.9 + i * 0.76, 0.1, 0);
      p.castShadow = p.receiveShadow = true;
      this.planks.push(p);
      this.group.add(p);
    }
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), toon(i === 2 ? '#c23b44' : '#b0814f'));
      c.position.set(-1.2 + (i % 3) * 1.2, 0.65 + Math.floor(i / 3) * 0.9, -0.8 + (i % 2) * 1.4);
      c.rotation.y = i * 0.4;
      c.castShadow = true;
      this.crates.push(c);
      this.group.add(c);
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3, 5), toon('#4a3020'));
    mast.position.set(1.4, 1.6, 1.2);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ color: '#222', side: THREE.DoubleSide }));
    flag.position.set(2.0, 2.7, 1.2);
    this.group.add(mast, flag);
    this.broken = false;
  }
  float(ocean: Ocean) {
    const s = ocean.sample(this.at.x, this.at.z);
    this.group.position.set(this.at.x, s.y + 0.05, this.at.z);
    this.group.rotation.set(s.tiltZ * 0.5, 0.4, -s.tiltX * 0.5);
  }
}

export class StellarCollapse {
  readonly group = new THREE.Group();
  private core: THREE.Mesh;
  private disc: THREE.Mesh;
  private halo: THREE.Mesh;
  private shock: THREE.Mesh;
  private star: THREE.Mesh;
  private discMat: THREE.ShaderMaterial;
  private shockMat: THREE.ShaderMaterial;
  private t = -1;
  private debris: Debris[] = [];
  private from = new THREE.Vector3();
  private center = new THREE.Vector3();
  private fired = { star: false, open: false, enemy: false, boom: false, done: false };
  running = false;
  reducedMotion = false;

  constructor(
    readonly scene: THREE.Scene,
    readonly raft: PracticeRaft,
    readonly sparks: ParticlePool,
    readonly dust: ParticlePool,
    readonly hooks: CollapseHooks,
  ) {
    this.core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: '#000000' }));
    this.discMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uI: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `uniform float uTime; uniform float uI; varying vec2 vUv; ${GLSL_NOISE}
        void main(){ vec2 c = vUv - 0.5; float r = length(c) * 2.0; float a = atan(c.y, c.x);
          float swirl = vn(vec2(a * 3.0 + r * 8.0 - uTime * 6.0, r * 4.0));
          float ring = smoothstep(0.32, 0.45, r) * smoothstep(1.0, 0.55, r);
          vec3 col = mix(vec3(1.0, 0.55, 0.2), vec3(0.75, 0.6, 1.0), r) * (0.6 + swirl * 0.9);
          gl_FragColor = vec4(col * ring * uI * 1.6, 1.0); }`,
    });
    this.disc = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), this.discMat);
    this.disc.rotation.x = -Math.PI / 2 + 0.35;
    this.halo = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.5, 48),
      new THREE.MeshBasicMaterial({ color: '#d8c8ff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.shockMat = new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float uK; varying vec2 vUv; void main(){ float r = length(vUv-0.5)*2.0; float w = smoothstep(uK-0.12, uK, r) * smoothstep(uK+0.02, uK-0.02, r); gl_FragColor = vec4(vec3(0.85,0.9,1.0) * w * (1.0-uK) * 2.0, 1.0); }`,
    });
    this.shock = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), this.shockMat);
    this.shock.rotation.x = -Math.PI / 2;
    this.star = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: '#fff4b8' }));
    // additive pieces draw after the (transparent) ocean, or the sea paints over them
    for (const m of [this.disc, this.halo, this.shock, this.star]) m.renderOrder = 6;
    this.group.add(this.core, this.disc, this.halo, this.shock, this.star);
    this.group.visible = false;
    scene.add(this.group);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.t = 0;
    this.fired = { star: false, open: false, enemy: false, boom: false, done: false };
    this.debris = [];
    this.center.copy(this.raft.at).setY(3.2);
    this.group.visible = true;
    this.core.scale.setScalar(0.001);
    this.halo.scale.setScalar(0.001);
    this.disc.scale.setScalar(0.001);
    this.shock.visible = false;
    this.star.visible = false;
    const c = this.hooks.caster();
    this.hooks.focus(c.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 10, 0.25);
    c.crouch(0.9);
    this.hooks.say('ASTRAPRIMA: «Esto no es personal. Bueno, un poquito.»');
  }

  /** dt may be 0 during hit-stop */
  update(dt: number, time: number, cam: THREE.Camera) {
    if (!this.running) return;
    this.t += dt;
    const t = this.t;
    const H = this.hooks;
    this.discMat.uniforms.uTime.value = time;
    this.halo.lookAt(cam.position);
    const c = H.caster();
    // beat 1: release (anticipation → action)
    if (t > 0.55 && !this.fired.star) {
      this.fired.star = true;
      c.crouch(0);
      c.emote('attack');
      this.from.copy(c.pos).add(new THREE.Vector3(0, 2, 0));
      this.star.visible = true;
      H.say('COLAPSO ESTELAR!! (星崩し)');
    }
    // beat 2: the star flies in an arc
    if (this.fired.star && t < 1.45) {
      const k = Math.min(1, (t - 0.55) / 0.9);
      const p = this.from.clone().lerp(this.center, k);
      p.y += Math.sin(k * Math.PI) * 9;
      this.star.position.copy(p);
      this.star.rotation.y += dt * 12;
      this.sparks.emit({ pos: p, spread: { x: 0.1, y: 0.1, z: 0.1 }, velJitter: { x: 0.6, y: 0.6, z: 0.6 }, life: 0.6, size: 0.45, color: '#fff4b8', color2: '#8a6bff', count: 4 });
      if (k > 0.35) H.focus(this.center, 30, 0.3);
    }
    // beat 3: the singularity opens
    if (t >= 1.45 && !this.fired.open) {
      this.fired.open = true;
      this.star.visible = false;
      H.flash(0.35);
      H.shake(0.25);
      for (const cr of this.raft.crates) this.debris.push({ mesh: cr, vel: new THREE.Vector3(), spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(4), orbit: 0, captured: false });
    }
    if (this.fired.open && !this.fired.boom) {
      const k = Math.min(1, (t - 1.45) / 0.45);
      const e = 1 - Math.pow(1 - k, 3);
      this.core.position.copy(this.center);
      this.disc.position.copy(this.center);
      this.halo.position.copy(this.center);
      this.core.scale.setScalar(1.3 * e);
      this.halo.scale.setScalar(1.3 * e);
      this.disc.scale.setScalar(e);
      this.disc.rotation.z += dt * 2.4;
      this.discMat.uniforms.uI.value = e;
      // streaming matter
      const ang = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * 3;
      const p = new THREE.Vector3(this.center.x + Math.cos(ang) * r, this.center.y + (Math.random() - 0.5) * 2, this.center.z + Math.sin(ang) * r);
      const v = this.center.clone().sub(p).multiplyScalar(0.9);
      this.dust.emit({ pos: p, vel: v, life: 1.1, size: 0.3, color: '#cbb8ff', color2: '#ff9a4a', count: 3 });
    }
    // beat 4: the raft shoots back — the singularity eats the cannonballs (strategic consequence)
    if (t > 2.0 && !this.fired.enemy) {
      this.fired.enemy = true;
      for (let i = 0; i < 3; i++) {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshBasicMaterial({ color: '#2a2a33' }));
        ball.position.copy(this.raft.at).add(new THREE.Vector3((i - 1) * 1.2, 1.2, 0));
        this.scene.add(ball);
        const toShip = c.pos.clone().sub(ball.position).setY(0).normalize().multiplyScalar(14);
        this.debris.push({ mesh: ball, vel: toShip.setY(6 + i), spin: new THREE.Vector3(), orbit: 0, captured: false, enemy: true });
      }
      H.say('El blanco de práctica dispara de vuelta… y el hoyo negro se lo come.');
    }
    // pull everything into a decaying orbit
    if (this.fired.open && !this.fired.boom) {
      for (const d of this.debris) {
        const wp = d.mesh.getWorldPosition(new THREE.Vector3());
        if (d.mesh.parent !== this.scene) {
          this.scene.attach(d.mesh);
        }
        const to = this.center.clone().sub(wp);
        const dist = to.length();
        if (dist < 1.4) {
          if (!d.captured) {
            d.captured = true;
            d.mesh.visible = false;
            this.sparks.emit({ pos: this.center, velJitter: { x: 3, y: 3, z: 3 }, life: 0.5, size: 0.5, color: d.enemy ? '#ff6a4a' : '#ffe2a0', color2: '#8a6bff', count: 12 });
            if (d.enemy) H.damage(this.center.clone().add(new THREE.Vector3(0, 2, 0)), 'ABSORBIDO', false);
          }
          continue;
        }
        const tangent = new THREE.Vector3(-to.z, 0, to.x).normalize();
        const pull = Math.min(40, 120 / (dist * dist + 1));
        d.vel.addScaledVector(to.normalize(), pull * dt * (d.enemy ? 2.2 : 1.4));
        d.vel.addScaledVector(tangent, pull * dt * 0.8);
        if (!d.enemy || dist < 12) d.vel.multiplyScalar(Math.exp(-dt * 0.6));
        else d.vel.y -= 9.8 * dt;
        d.mesh.position.addScaledVector(d.vel, dt);
        d.mesh.rotation.x += d.spin.x * dt;
        d.mesh.rotation.y += d.spin.y * dt;
      }
    }
    // beat 5: collapse → shockwave
    if (t > 4.1 && !this.fired.boom) {
      this.fired.boom = true;
      H.hitstop(this.reducedMotion ? 0 : 90);
      H.flash(1);
      H.shake(0.8);
      this.shock.visible = true;
      this.shock.position.set(this.center.x, 0.25, this.center.z);
      this.raft.broken = true;
      // the raft comes apart
      for (const p of this.raft.planks) {
        this.scene.attach(p);
        const out = p.position.clone().sub(this.raft.at).setY(0).normalize();
        this.debris.push({ mesh: p, vel: out.multiplyScalar(8 + Math.random() * 6).setY(7 + Math.random() * 5), spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), orbit: 0, captured: false });
      }
      for (const d of this.debris)
        if (d.captured && !d.enemy) {
          d.mesh.visible = true;
          d.mesh.position.copy(this.center);
          d.vel.set((Math.random() - 0.5) * 22, 6 + Math.random() * 10, (Math.random() - 0.5) * 22);
          d.captured = false;
        }
      this.sparks.emit({ pos: this.center, velJitter: { x: 16, y: 10, z: 16 }, life: 1.4, size: 0.8, color: '#ffffff', color2: '#8a6bff', count: 160 });
      this.dust.emit({ pos: { x: this.center.x, y: 0.4, z: this.center.z }, spread: { x: 3, y: 0.2, z: 3 }, vel: { x: 0, y: 7, z: 0 }, velJitter: { x: 6, y: 4, z: 6 }, life: 2.2, size: 1.0, color: '#e8f6ff', color2: '#7fb6d8', count: 90 });
      H.damage(this.center.clone().add(new THREE.Vector3(-1.5, 3, 0)), '−1.240', true);
      H.damage(this.center.clone().add(new THREE.Vector3(1.8, 2, 0.5)), '−620', false);
      H.damage(this.center.clone().add(new THREE.Vector3(0.2, 4.4, -0.6)), 'CASCO ROTO', false);
      H.say('El agujero negro escupe todo lo que se tragó. Incluidas tus dudas.');
      c.emote('happy');
    }
    if (this.fired.boom) {
      const k = Math.min(1, (t - 4.1) / 1.4);
      this.shockMat.uniforms.uK.value = k;
      this.core.scale.setScalar(Math.max(0.001, 1.3 * (1 - k * 6)));
      this.halo.scale.setScalar(Math.max(0.001, 1.3 + k * 4));
      (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
      this.discMat.uniforms.uI.value = Math.max(0, 1 - k * 3);
      for (const d of this.debris) {
        if (!d.mesh.visible) continue;
        d.vel.y -= 14 * dt;
        d.mesh.position.addScaledVector(d.vel, dt);
        d.mesh.rotation.x += d.spin.x * dt;
        d.mesh.rotation.z += d.spin.z * dt;
        if (d.mesh.position.y < -0.3 && d.vel.y < 0) {
          if (!d.mesh.userData.splashed) {
            d.mesh.userData.splashed = true;
            this.dust.emit({ pos: d.mesh.position, vel: { x: 0, y: 3, z: 0 }, velJitter: { x: 1.5, y: 1.5, z: 1.5 }, life: 0.8, size: 0.4, color: '#ffffff', color2: '#9fd8ff', count: 8 });
          }
          d.vel.multiplyScalar(0.9);
          d.vel.y = Math.max(d.vel.y, -1);
        }
      }
    }
    if (t > 8 && !this.fired.done) {
      this.fired.done = true;
      for (const d of this.debris) {
        d.mesh.parent?.remove(d.mesh);
        disposeTree(d.mesh);
      }
      this.debris = [];
      this.raft.build();
      this.group.visible = false;
      this.running = false;
      H.say('Blanco de práctica reparado. Los cangrejos sindicalizados cobran horas extra.');
    }
  }
}
