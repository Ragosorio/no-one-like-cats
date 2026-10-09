/**
 * Weather (AgentGameEngine `world/weather`): rain as GPU streaks that wrap around the camera (fixed
 * buffer, no CPU per-drop work), eased state transitions and storm lightning. Exposes the scalar
 * signals the rest of the world reads: `rain` (0..1), `storm` (0..1), `flash` (0..1 lightning).
 */
import * as THREE from 'three';

export type Sky = 'despejado' | 'lluvia' | 'tormenta';

export class Weather {
  readonly mesh: THREE.LineSegments;
  private u: Record<string, THREE.IUniform>;
  state: Sky = 'despejado';
  rain = 0;
  storm = 0;
  flash = 0;
  private nextBolt = 4;
  private time = 0;
  /** fired on a lightning strike (sound, camera, cats) */
  onBolt: (() => void) | null = null;
  reducedFlashes = false;

  constructor(count = 9000, readonly box = 60) {
    const pos = new Float32Array(count * 2 * 3);
    const seed = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = Math.random() * box - box / 2;
      const y = Math.random() * box;
      const z = Math.random() * box - box / 2;
      pos.set([x, y, z, x, y, z], i * 6);
      seed[i * 2] = 0; // head
      seed[i * 2 + 1] = 1; // tail
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aEnd', new THREE.BufferAttribute(seed, 1));
    this.u = {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uBox: { value: box },
      uAmt: { value: 0 },
      uWind: { value: new THREE.Vector2(3, 1) },
      uCol: { value: new THREE.Color('#cfe0ff') },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aEnd; uniform float uTime; uniform vec3 uCam; uniform float uBox; uniform vec2 uWind; uniform float uAmt;
        varying float vA;
        void main(){
          vec3 p = position;
          float speed = 26.0;
          p.y = mod(p.y - uTime * speed, uBox);
          p.x += uWind.x * (uBox - p.y) * 0.04;
          p.z += uWind.y * (uBox - p.y) * 0.04;
          // wrap around the camera
          vec3 c = uCam - vec3(uBox*0.5, uBox*0.35, uBox*0.5);
          p = c + mod(p - c, uBox);
          p += aEnd * vec3(uWind.x, speed, uWind.y) * 0.03;
          float keep = step(fract(position.x * 12.9898 + position.z * 78.233), uAmt);
          vA = keep * (0.35 + aEnd * 0.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
          if (keep < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol, vA); }`,
    });
    this.mesh = new THREE.LineSegments(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 6;
  }

  set(s: Sky) {
    this.state = s;
  }

  update(dt: number, cam: THREE.Vector3, night: number) {
    this.time += dt;
    const tr = this.state === 'despejado' ? 0 : this.state === 'lluvia' ? 0.55 : 1;
    const ts = this.state === 'tormenta' ? 1 : 0;
    this.rain += (tr - this.rain) * (1 - Math.exp(-dt * 0.6));
    this.storm += (ts - this.storm) * (1 - Math.exp(-dt * 0.5));
    this.u.uTime.value = this.time;
    this.u.uCam.value.copy(cam);
    this.u.uAmt.value = this.rain;
    this.u.uWind.value.set(2 + this.storm * 6, 1 + this.storm * 2);
    this.u.uCol.value.setRGB(0.8, 0.86, 1).multiplyScalar(0.55 + (1 - night) * 0.45 + this.flash);
    this.mesh.visible = this.rain > 0.02;
    this.flash = Math.max(0, this.flash - dt * 3.5);
    if (this.storm > 0.6) {
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) {
        this.nextBolt = 3 + Math.random() * 7;
        this.flash = this.reducedFlashes ? 0.25 : 1;
        this.onBolt?.();
      }
    }
  }
}
