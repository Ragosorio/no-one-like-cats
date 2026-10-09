/**
 * World3D (AgentGameEngine `world/World3D`): one living 2.5D place — renderer, sky + day cycle, ocean,
 * heightfield terrain, flora, weather, GPU particles, paper cats with ambient life, camera rig and
 * measured quality tiers — built from a description and torn down without leaks.
 *
 * It is the reusable form of the Rupturas vertical slice: game content (a region) supplies the terrain
 * functions, props, residents and points of interest; the world runs and renders them. It renders to
 * its OWN canvas (meant to sit under the Pixi HUD canvas) and is driven by the caller's frame loop.
 */
import * as THREE from 'three';
import { Heightfield, type HeightFn, type Painter } from './heightfield';
import { Ocean } from './ocean';
import { DayCycle, SkyDome, type SkyKey, SKY_KEYS } from './sky';
import { Flora, wind, type Placement } from './flora';
import { PaperCat, loadPaperArt, paperLighting, type LocalLight } from './paperCat';
import { ParticlePool } from '../fx/particles';
import { Weather, type Sky } from './weather';
import { CameraRig } from '../camera/rig';
import { AutoQuality, FrameStats, QUALITY, type Tier } from '../core/perf';
import { LifeDirector, type Activity, type Agent, type LifeWorld, type Obstacle } from '../life/director';

export interface WorldProp {
  group: THREE.Object3D;
  lights?: LocalLight[];
  update?(dt: number, t: number, night: number): void;
  dispose?(): void;
}

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  /** element that receives pointer input for the camera (usually the HUD canvas on top) */
  input: HTMLElement;
  /** true when the pointer is over HUD UI (the camera ignores those events) */
  isUiHit?: (clientX: number, clientY: number) => boolean;
  tier: Tier;
  autoQuality?: boolean;
  reducedMotion?: boolean;
  half: number;
  height: HeightFn;
  paint: Painter;
  walkable: (x: number, z: number) => boolean;
  skyKeys?: SkyKey[];
  /** 0..1 how strongly the sky shows the Rupture (stars falling upward) */
  rupture?: number;
  fog?: { near: number; far: number };
  camera: { target: THREE.Vector3; yaw: number; pitch: number; dist: number; minDist?: number; maxDist?: number; bound?: number };
  /** called when the auto quality steps down (UI toast) */
  onTierDrop?: (t: Tier) => void;
}

export interface ResidentOpts {
  id: string;
  name: string;
  slug: string;
  url: string;
  height: number;
  home: THREE.Vector3;
  tags: string[];
  traits?: Record<string, number>;
  acts?: 'all' | 'calm' | 'battle' | 'none';
  /** joins the ambient-life director (false = static, positioned by the caller) */
  alive?: boolean;
}

export class World3D {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.3, 2000);
  readonly rig: CameraRig;
  readonly cycle: DayCycle;
  readonly sky: SkyDome;
  readonly terrain: Heightfield;
  readonly ocean: Ocean;
  readonly weather: Weather;
  readonly hemi = new THREE.HemisphereLight('#cfe8ff', '#6b5a40', 0.9);
  readonly sun = new THREE.DirectionalLight('#fff4e0', 2.4);
  readonly stats = new FrameStats(240);
  readonly auto: AutoQuality;
  readonly pools: Record<'embers' | 'smoke' | 'snow' | 'stars' | 'sparks' | 'dust' | 'motes' | 'pages', ParticlePool>;
  readonly props: WorldProp[] = [];
  readonly cats: PaperCat[] = [];
  readonly residents = new Map<string, { cat: PaperCat; agent?: Agent; opts: ResidentOpts }>();
  readonly obstacles: Obstacle[] = [];
  director: LifeDirector | null = null;
  readonly life: LifeWorld;
  hour = 12;
  time = 0;
  hitstop = 0;
  tier: Tier;
  private flora: Flora | null = null;
  private frameN = 0;
  private lastShadowAt = new THREE.Vector3();
  private autoT = 0;
  private disposed = false;
  private readonly hw: HeightFn;

  constructor(readonly o: WorldOptions) {
    this.tier = o.tier;
    const q = QUALITY[o.tier];
    this.hw = o.height;
    this.renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: q.msaa, powerPreference: 'high-performance', alpha: false });
    const r = this.renderer;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = false;
    this.scene.fog = new THREE.Fog('#cfe6f5', o.fog?.near ?? 80, o.fog?.far ?? 300);

    this.cycle = new DayCycle(o.skyKeys ?? SKY_KEYS);
    this.sky = new SkyDome();
    this.sky.u.uRupture.value = o.rupture ?? 1;
    this.scene.add(this.sky.mesh);
    this.terrain = new Heightfield({ half: o.half, segments: q.terrainSeg, height: o.height, paint: o.paint, texSize: 160 });
    this.scene.add(this.terrain.mesh);
    this.ocean = new Ocean({ size: 900, segments: q.waterSeg, heightTex: this.terrain.heightTex, terrainHalf: o.half });
    this.scene.add(this.ocean.mesh);
    this.scene.add(this.hemi);
    this.sun.castShadow = q.shadows;
    this.sun.shadow.mapSize.setScalar(q.shadowMap);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -60;
    sc.right = sc.top = 60;
    sc.near = 1;
    sc.far = 260;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.12;
    this.scene.add(this.sun, this.sun.target);

    this.pools = {
      embers: new ParticlePool(700, { gravity: -0.4, wobble: 0.35 }),
      smoke: new ParticlePool(160, { additive: false, wobble: 0.3 }),
      snow: new ParticlePool(500, { additive: false, wobble: 0.5, shape: 'flake' }),
      stars: new ParticlePool(500, { wobble: 0.25, shape: 'star' }),
      sparks: new ParticlePool(1200, { wobble: 0.1, shape: 'star' }),
      dust: new ParticlePool(1000, { additive: false, gravity: 9, wobble: 0.1 }),
      motes: new ParticlePool(300, { wobble: 0.6, shape: 'star' }),
      pages: new ParticlePool(300, { additive: false, wobble: 0.9, gravity: 0.6 }),
    };
    for (const p of Object.values(this.pools)) this.scene.add(p.points);
    this.applyBudget();

    this.weather = new Weather(Math.round(9000 * Math.min(1, q.particles + 0.3)));
    this.weather.reducedFlashes = !!o.reducedMotion;
    this.scene.add(this.weather.mesh);

    const c = o.camera;
    this.rig = new CameraRig(this.camera, o.input, { target: c.target.clone(), yaw: c.yaw, pitch: c.pitch, dist: c.dist });
    this.rig.reducedMotion = !!o.reducedMotion;
    if (c.minDist) this.rig.limits.minDist = c.minDist;
    if (c.maxDist) this.rig.limits.maxDist = c.maxDist;
    if (c.bound) this.rig.limits.bound = c.bound;
    if (o.isUiHit) this.rig.ignore = o.isUiHit;

    this.auto = new AutoQuality(o.tier, (t) => {
      this.setTier(t);
      o.onTierDrop?.(t);
    });
    this.auto.enabled = o.autoQuality !== false;

    const fx = (pool: keyof World3D['pools']) => this.pools[pool];
    this.life = {
      time: 0,
      hour: 12,
      night: 0,
      rain: 0,
      storm: 0,
      agents: [],
      obstacles: this.obstacles,
      groundAt: (x, z) => this.hw(x, z),
      walkable: o.walkable,
      camera: this.camera,
      fx: {
        zzz: (p) => fx('motes').emit({ pos: { x: p.x, y: p.y + 1.6, z: p.z }, vel: { x: 0.2, y: 0.5, z: 0 }, life: 2.2, size: 0.3, color: '#cfd8ff', color2: '#ffffff', count: 1 }),
        dust: (p) => fx('dust').emit({ pos: { x: p.x, y: p.y + 0.2, z: p.z }, spread: { x: 0.4, y: 0, z: 0.4 }, vel: { x: 0, y: 2, z: 0 }, velJitter: { x: 1.4, y: 0.8, z: 1.4 }, life: 0.7, size: 0.35, color: '#f2e2b8', color2: '#d8c39a', count: 10 }),
        steam: (p) => fx('smoke').emit({ pos: { x: p.x, y: p.y + 0.3, z: p.z }, spread: { x: 0.6, y: 0.1, z: 0.6 }, vel: { x: 0, y: 1.6, z: 0 }, velJitter: { x: 0.4, y: 0.4, z: 0.4 }, life: 1.6, size: 1.1, color: '#ffffff', color2: '#d8e8ff', count: 2 }),
        starmote: (p) => fx('stars').emit({ pos: { x: p.x, y: p.y + 1.8, z: p.z }, spread: { x: 1, y: 0.6, z: 1 }, vel: { x: 0, y: 0.4, z: 0 }, life: 2.5, size: 0.3, color: '#fff6c8', color2: '#9fd8ff', count: 1 }),
        spark: (p) => fx('sparks').emit({ pos: { x: p.x, y: p.y + 1, z: p.z }, velJitter: { x: 3, y: 3, z: 3 }, life: 0.4, size: 0.35, color: '#fff7a0', color2: '#7fd0ff', count: 14 }),
        splash: (p) => fx('dust').emit({ pos: { x: p.x, y: 0.2, z: p.z }, vel: { x: 0, y: 3.5, z: 0 }, velJitter: { x: 1.5, y: 1.2, z: 1.5 }, life: 0.8, size: 0.35, color: '#ffffff', color2: '#9fd8ff', count: 14 }),
        heart: (p) => fx('sparks').emit({ pos: { x: p.x, y: p.y + 2, z: p.z }, vel: { x: 0, y: 0.8, z: 0 }, velJitter: { x: 0.4, y: 0.2, z: 0.4 }, life: 1.2, size: 0.5, color: '#ff7ab8', color2: '#ffd1e6', count: 4 }),
      },
    };
    this.resize();
  }

  /** sample the terrain (the region's pure height function) */
  heightAt(x: number, z: number) {
    return this.hw(x, z);
  }

  private applyBudget() {
    for (const p of Object.values(this.pools)) p.budget = QUALITY[this.tier].particles;
  }

  setTier(t: Tier) {
    this.tier = t;
    const q = QUALITY[t];
    this.applyBudget();
    this.sun.shadow.mapSize.setScalar(q.shadowMap);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null as unknown as THREE.WebGLRenderTarget;
    // recreate it on the very next frame (the map is refreshed every N frames, never left empty)
    this.renderer.shadowMap.needsUpdate = true;
    if (this.sun.castShadow !== q.shadows) {
      this.sun.castShadow = q.shadows;
      this.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m) m.needsUpdate = true;
      });
    }
    for (const c of this.cats) {
      c.shadowAllowed = q.catShadows;
      c.shadow.visible = q.catShadows;
    }
    this.resize();
  }

  resize() {
    const q = QUALITY[this.tier];
    const dpr = Math.min(globalThis.devicePixelRatio || 1, q.dprCap) * q.scale;
    const w = this.o.canvas.clientWidth || innerWidth;
    const h = this.o.canvas.clientHeight || innerHeight;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  addProp(p: WorldProp) {
    this.props.push(p);
    this.scene.add(p.group);
    return p;
  }

  setFlora(f: { palms?: Placement[]; rocks?: Placement[]; grass?: Placement[]; flowers?: Placement[] }) {
    if (this.flora) {
      this.scene.remove(this.flora.group);
      this.flora.dispose();
    }
    const g = QUALITY[this.tier].grass;
    const grass = (f.grass ?? []).filter((_, i) => (i * 0.61803) % 1 < g);
    this.flora = new Flora({ palms: f.palms ?? [], rocks: f.rocks ?? [], grass, flowers: f.flowers ?? [] });
    this.scene.add(this.flora.group);
  }

  /** enable ambient life with the region's activities (call before adding residents) */
  enableLife(activities: Activity[]) {
    this.director = new LifeDirector(this.life, activities);
  }

  /** a cat living here: painted paper puppet, optionally driven by the ambient-life director */
  async addResident(r: ResidentOpts) {
    const art = await loadPaperArt(r.url, 512);
    if (this.disposed) return null;
    const cat = new PaperCat({ slug: r.slug, url: r.url, height: r.height, acts: r.acts }, art);
    cat.shadowAllowed = QUALITY[this.tier].catShadows;
    cat.shadow.visible = cat.shadowAllowed;
    this.scene.add(cat.root);
    this.cats.push(cat);
    let agent: Agent | undefined;
    if (r.alive !== false && this.director) {
      const start = r.home.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2));
      if (!this.o.walkable(start.x, start.z)) start.copy(r.home);
      start.y = this.hw(start.x, start.z);
      agent = this.director.add({
        id: r.id,
        name: r.name,
        cat,
        pos: start,
        needs: { energy: 0.5 + Math.random() * 0.4, play: Math.random() * 0.6, social: Math.random() * 0.5 },
        traits: r.traits ?? { playful: 0.5, curious: 0.5 },
        tags: new Set(r.tags),
      });
    } else {
      cat.root.position.copy(r.home);
      cat.ground = r.home.y;
    }
    this.residents.set(r.id, { cat, agent, opts: r });
    return cat;
  }

  setWeather(s: Sky) {
    this.weather.set(s);
  }

  /** screen-space (CSS px) of a world point; null when behind the camera */
  project(p: THREE.Vector3, out = new THREE.Vector2()): THREE.Vector2 | null {
    const v = p.clone().project(this.camera);
    if (v.z > 1) return null;
    const w = this.o.canvas.clientWidth || innerWidth;
    const h = this.o.canvas.clientHeight || innerHeight;
    return out.set((v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h);
  }

  /** the resident nearest to a screen point (within `radius` CSS px) */
  pickResident(x: number, y: number, radius = 70) {
    let best: { id: string; cat: PaperCat } | null = null;
    let bd = radius;
    for (const [id, r] of this.residents) {
      if (!r.cat.root.visible) continue;
      const p = this.project(r.cat.root.position.clone().add(new THREE.Vector3(0, r.cat.lift + r.cat.height * 0.5, 0)));
      if (!p) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = { id, cat: r.cat };
      }
    }
    return best;
  }

  /** advance and render one frame (dt in seconds, already capped by the caller) */
  frame(rawDt: number) {
    if (this.disposed) return;
    this.stats.push(rawDt * 1000);
    let dt = rawDt;
    if (this.hitstop > 0) {
      this.hitstop -= rawDt;
      dt = 0;
    }
    this.time += dt;
    const w = this.weather;
    w.update(dt, this.camera.position, this.cycle.s.night);
    this.cycle.overcast = Math.min(1, w.rain * 0.55 + w.storm * 0.45);
    const s = this.cycle.evaluate(this.hour);
    this.sky.apply(s, this.time, this.cycle.overcast);
    if (w.flash > 0) this.sky.u.uHorizon.value.lerp(new THREE.Color('#e8f0ff'), w.flash * 0.7);
    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGround);
    this.hemi.intensity = s.hemiI + w.flash * 2.5;
    const useMoon = s.night > 0.55;
    const dir = useMoon ? s.moonDir : s.sunDir;
    this.sun.color.copy(useMoon ? new THREE.Color('#9fb4ff') : s.sun);
    this.sun.intensity = useMoon ? 0.55 * (1 - this.cycle.overcast * 0.7) : s.sunI;
    this.sun.target.position.set(this.rig.cur.target.x, 0, this.rig.cur.target.z);
    this.sun.position.copy(this.sun.target.position).addScaledVector(dir, 120);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(s.fog);
    fog.far = (this.o.fog?.far ?? 300) - this.cycle.overcast * 130;
    const ou = this.ocean.uniforms;
    ou.uDeep.value.copy(s.deep);
    ou.uShallow.value.copy(s.shallow);
    ou.uSky.value.copy(s.horizon);
    ou.uSunDir.value.copy(s.sunDir);
    ou.uSunCol.value.copy(s.sun).multiplyScalar(Math.min(1.2, s.sunI));
    ou.uMoonDir.value.copy(s.moonDir);
    ou.uNight.value = s.night;
    ou.uRain.value = w.rain;
    this.ocean.amp = 1 + w.storm * 1.2;
    this.ocean.update(dt);
    this.terrain.wetness = w.rain;
    wind.value = 0.35 + w.rain * 0.4 + w.storm * 0.9;
    wind.time.value = this.time;

    const L = paperLighting;
    L.sunDir.copy(s.sunDir);
    L.sunCol.copy(s.sun);
    L.sunI = s.sunI * (1 - this.cycle.overcast * 0.6);
    L.moonDir.copy(s.moonDir);
    L.hemiSky.copy(s.hemiSky).multiplyScalar(s.hemiI + w.flash * 1.5);
    L.hemiGround.copy(s.hemiGround).multiplyScalar(s.hemiI);
    L.grade.copy(s.grade).lerp(new THREE.Color('#ffffff'), w.flash * 0.8);
    L.night = s.night;
    L.wet = w.rain;
    L.lights = this.props.flatMap((p) => p.lights ?? []);

    for (const p of this.props) p.update?.(dt, this.time, s.night);
    if (this.director) {
      const lw = this.life;
      lw.time = this.time;
      lw.hour = this.hour;
      lw.night = s.night;
      lw.rain = w.rain;
      lw.storm = w.storm;
      this.director.update(dt);
      for (const a of this.director.agents)
        if (a.swimming) {
          const sw = this.ocean.sample(a.pos.x, a.pos.z, this.hw(a.pos.x, a.pos.z));
          a.cat.lift = sw.y - a.cat.height * 0.42;
          a.cat.ground = 0.05;
        }
    }
    for (const c of this.cats) c.update(dt, this.camera, this.time);
    const vh = this.renderer.domElement.height;
    for (const p of Object.values(this.pools)) p.update(dt, vh);
    this.rig.update(rawDt, (x, z) => Math.max(this.hw(x, z), 0));

    const every = QUALITY[this.tier].shadowEvery;
    const moved = this.sun.position.distanceToSquared(this.lastShadowAt) > 0.25;
    if (every > 0 && this.sun.castShadow && (this.frameN++ % every === 0 || moved)) {
      this.renderer.shadowMap.needsUpdate = true;
      this.lastShadowAt.copy(this.sun.position);
    }
    this.renderer.render(this.scene, this.camera);

    this.autoT += rawDt;
    if (this.autoT > 1 && this.time > 6) {
      this.autoT = 0;
      this.auto.sample(this.stats.pct(95));
    }
  }

  /** compile every program now (first ability / first lens must not hitch) */
  warmup() {
    this.renderer.compile(this.scene, this.camera);
  }

  /** free everything this world created on the GPU and the DOM (safe to call twice) */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.rig.dispose();
    for (const p of this.props) p.dispose?.();
    for (const c of this.cats) c.dispose();
    this.flora?.dispose();
    for (const p of Object.values(this.pools)) p.dispose();
    this.terrain.dispose();
    this.ocean.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      for (const mat of mats) {
        for (const v of Object.values(mat as unknown as Record<string, unknown>)) if (v instanceof THREE.Texture) v.dispose();
        const u = (mat as THREE.ShaderMaterial).uniforms;
        if (u) for (const x of Object.values(u)) if (x?.value instanceof THREE.Texture) x.value.dispose();
        mat.dispose();
      }
    });
    this.sun.shadow.map?.dispose();
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
