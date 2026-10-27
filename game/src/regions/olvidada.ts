/**
 * LA ISLA QUE NADIE RECUERDA (Parte II · Oleada 4 «El Umbral», las fronteras) — guion 13 H60/H61, biblia 05 §4,
 * concepto 10. «Es tu isla. La versión en la que nunca llegaste.»
 *
 * Built from YOUR save (olvidada/layout.ts): the coast of your archipelago, your habitats where you put them —
 * in ruins — the dark lighthouse where yours stands, the prologue's raft on the beach, and among the ruins the
 * silhouettes of the cats that live in those habitats, gray as paper left in the sun, not remembering their names.
 * Lens (art bible §7 + the beat's «SEPIA · FOTO VIEJA»): the world is an old photo — sepia, grain, dust, scratches —
 * and ONLY your visiting cats keep their colors (olvidada/memory.ts). Never punishing: it's sad, and you repair it.
 *
 * H60 (feature `olvidada`): tap a ruin → choose one of your cats (olvidada/picker.ts) → state/sys/olvidada.ts
 * repairRuin(). The rubble sinks, the habitat grows back out of the ground, the color opens around it like a
 * window, the music gains a layer (YONOSE TODO «Reconstrucción»: keys → + bass → + drums; doc 18 §5.2). The last
 * ruin sends the color over the whole island, the silhouettes become real cats, the full layer plays with the arc's
 * cell on top (the original song is reserved for the «Momentos musicales»), the lighthouse lights up, and Polvillo
 * shakes the dust off (b60 part b plays here).
 * H61 (feature `distraxia`): over your FIRST habitat floats a blank page that breathes; tap it → handwriting,
 * strikethroughs (the overlay is app/oleada4Flow.ts) → afterwards the strikes gather into a line of ink that
 * runs over the sea toward the edge of the chart.
 */
import * as THREE from 'three';
import type { POI, RegionBuild, RegionDef } from './types';
import { SKY_KEYS, type SkyKey } from '../engine/world/sky';
import type { LocalLight, PaperCat } from '../engine/world/paperCat';
import { G } from '../state/game';
import { CAT_BY_ID } from '../data/content';
import { sfx } from '../core/audio';
import { audioApi } from '../audio/api';
import { resolveTrack } from '../audio/catalog';
import { motif, stingerOr } from '../cine/sound';
import { artSlug, catLiteUrl, standInTint } from '../art/catArt';
import { catSlug } from '../state/sys/forms';
import { isRepaired, olvidadaOpen, olvidadaProgress, repairRuin, repairedBy, repairersFor } from '../state/sys/olvidada';
import { o4PendingCats, readDistraxia } from '../state/sys/rupturasO4';
import { Bin } from './paginas/kit';
import { Halos, devParams } from './cielo/kit';
import { addSkyCat } from './cielo/cats';
import { LENS_NOISE, devHook, ease, lensQuad, quietSay } from './fronteras/kit';
import { HALF, height, layout, paint, walkable } from './olvidada/layout';
import { MAX_SRC, memToon, memoryUniforms, patchTerrain, ruinDepth, ruinUniforms } from './olvidada/memory';
import { RuinMesher, buildRuins, scenery } from './olvidada/ruins';
import { blankPage, inkLine } from './olvidada/page';
import { pickRepairer } from './olvidada/picker';
import { hush } from '../ui/hush';
import { RARITY_H } from '../art/rarityHeight';

/** an old photo by day (milky sepia), a teal-dark night with amber where something still glows (concept 10) */
const SEPIA: SkyKey[] = [
  { h: 0, zenith: '#0e1a22', horizon: '#26383c', sun: '#a8b4b8', sunI: 0, hemiSky: '#46585c', hemiGround: '#1c1e20', hemiI: 0.62, fog: '#1c2a2e', deep: '#0c1a20', shallow: '#20383c', grade: '#c4c8cc', night: 1 },
  { h: 4.8, zenith: '#142026', horizon: '#3a4440', sun: '#a8b4b8', sunI: 0, hemiSky: '#4a5a5a', hemiGround: '#1e2020', hemiI: 0.62, fog: '#2a3432', deep: '#0e1c20', shallow: '#243a3c', grade: '#c8cacc', night: 1 },
  { h: 6.0, zenith: '#8a8270', horizon: '#e2c8a4', sun: '#ffd8b0', sunI: 1.1, hemiSky: '#d8ccb4', hemiGround: '#6a5a48', hemiI: 0.78, fog: '#d8c0a0', deep: '#6a6450', shallow: '#a49a7e', grade: '#fff0e4', night: 0.25 },
  { h: 8.0, zenith: '#a89c82', horizon: '#ece0c6', sun: '#fff2dc', sunI: 1.85, hemiSky: '#e6dcc8', hemiGround: '#7a6a56', hemiI: 0.88, fog: '#e2d6bc', deep: '#76705a', shallow: '#b0a688', grade: '#fff8f0', night: 0 },
  { h: 12.5, zenith: '#a49a84', horizon: '#eee4cc', sun: '#fffaf0', sunI: 2.05, hemiSky: '#ebe2d0', hemiGround: '#7e6e5a', hemiI: 0.92, fog: '#e6dcc4', deep: '#7a745e', shallow: '#b4aa8c', grade: '#ffffff', night: 0 },
  { h: 16.5, zenith: '#a49680', horizon: '#ecd8b8', sun: '#ffe6c4', sunI: 1.85, hemiSky: '#e4d6bc', hemiGround: '#7a6650', hemiI: 0.88, fog: '#e0cca8', deep: '#746c54', shallow: '#aca082', grade: '#fff2e4', night: 0 },
  { h: 18.3, zenith: '#7a6e5e', horizon: '#d8a880', sun: '#f0b088', sunI: 1.3, hemiSky: '#c8b49a', hemiGround: '#5a4838', hemiI: 0.8, fog: '#c8a080', deep: '#5c5444', shallow: '#8c7e66', grade: '#ffe0d0', night: 0.15 },
  { h: 19.6, zenith: '#2c3436', horizon: '#6a5a4a', sun: '#c09078', sunI: 0.35, hemiSky: '#6a6a62', hemiGround: '#282624', hemiI: 0.66, fog: '#4a4640', deep: '#1e2a2a', shallow: '#3e4a46', grade: '#d0ccc8', night: 0.7 },
  { h: 21, zenith: '#101c22', horizon: '#28383a', sun: '#a8b4b8', sunI: 0, hemiSky: '#46585c', hemiGround: '#1c1e20', hemiI: 0.62, fog: '#1e2c2e', deep: '#0c1a20', shallow: '#20383c', grade: '#c4c8cc', night: 1 },
  { h: 24, zenith: '#0e1a22', horizon: '#26383c', sun: '#a8b4b8', sunI: 0, hemiSky: '#46585c', hemiGround: '#1c1e20', hemiI: 0.62, fog: '#1c2a2e', deep: '#0c1a20', shallow: '#20383c', grade: '#c4c8cc', night: 1 },
];
const COLOR_FIELDS = ['zenith', 'horizon', 'sun', 'hemiSky', 'hemiGround', 'fog', 'deep', 'shallow', 'grade'] as const;
const ca = new THREE.Color();
const cb = new THREE.Color();
/** the sky keys between the old photo (0) and your island in color (1) */
function mixKeys(out: SkyKey[], k: number) {
  for (let i = 0; i < out.length; i++) {
    const a = SEPIA[i];
    const b = SKY_KEYS[i] ?? SKY_KEYS[SKY_KEYS.length - 1];
    const o = out[i];
    for (const f of COLOR_FIELDS) o[f] = '#' + ca.set(a[f]).lerp(cb.set(b[f]), k).getHexString();
    o.sunI = a.sunI + (b.sunI - a.sunI) * k;
    o.hemiI = a.hemiI + (b.hemiI - a.hemiI) * k;
    o.night = a.night + (b.night - a.night) * k;
  }
}
const KEYS: SkyKey[] = SEPIA.map((k) => ({ ...k }));

/** the old photo over the frame: sepia vignette, grain, dust and scratches that flicker like a projector */
const LENS = /* glsl */ `
  uniform float uTime; uniform float uK; uniform float uAspect; varying vec2 vUv;
  ${LENS_NOISE}
  void main(){
    vec2 p = vUv * vec2(uAspect, 1.0);
    float fr = floor(uTime * 12.0);
    float grain = lh(floor(p * 520.0) + fr);
    vec2 c = vUv - 0.5;
    float r = length(c * vec2(1.0, 0.9));
    vec3 f = vec3(1.0);
    f *= 1.0 - (grain - 0.5) * 0.12;
    f *= mix(vec3(1.0), vec3(0.62, 0.5, 0.38), smoothstep(0.32, 0.8, r));
    // dust specks (a few per frame) and a scratch that wanders
    vec2 cell = floor(p * 22.0);
    float sp = lh(cell + fr * 1.7);
    float dot0 = smoothstep(0.08, 0.0, length(fract(p * 22.0) - 0.5 - (vec2(lh(cell + 3.0 + fr), lh(cell + 9.0 + fr)) - 0.5) * 0.6));
    f *= 1.0 - step(0.985, sp) * dot0 * 0.6;
    float sx = 0.2 + 0.6 * lh(vec2(floor(uTime * 0.7), 4.0)) + sin(uTime * 3.0) * 0.004;
    f *= 1.0 - smoothstep(0.0008, 0.0, abs(vUv.x - sx)) * 0.16 * step(0.72, lh(vec2(fr, 2.0)));
    gl_FragColor = vec4(mix(vec3(1.0), f, uK), 1.0);
  }`;

const dev = devParams();
const silC = new THREE.Color();
/** the seed of a repaired ruin's color window, and the last wave over everything */
const SRC_R = 13;
const WAVE_R = 170;

const ruinName = (kind: string, el: string) =>
  kind === 'faro' ? 'EL FARO' : kind === 'muelle' ? 'EL MUELLE' : kind === 'casa' ? 'LA CASA' : `HÁBITAT DE ${(({ fire: 'FUEGO', water: 'AGUA', nature: 'NATURALEZA', earth: 'TIERRA', storm: 'TORMENTA', magic: 'MAGIA', cosmic: 'COSMOS', void: 'VACÍO', ice: 'HIELO', sound: 'SONIDO', shadow: 'SOMBRA', time: 'TIEMPO', light: 'LUZ', crystal: 'CRISTAL', gravity: 'GRAVEDAD' }) as Record<string, string>)[el] ?? el.toUpperCase()}`;

export const region: RegionDef = {
  id: 'olvidada',
  name: 'La Isla que Nadie Recuerda',
  subtitle: 'La versión de tu isla en la que nunca llegaste.',
  half: HALF,
  height,
  paint,
  walkable,
  skyKeys: KEYS,
  rupture: 0.2,
  fog: { near: 70, far: 300 },
  hour: dev.hour,
  weather: dev.weather ?? 'despejado',
  // the shape is YOUR island: read when the visit starts (RegionScene reads the camera first)
  get camera() {
    const L = layout();
    const c = L.center;
    return { target: [c.x, 3, c.z - 2] as [number, number, number], yaw: 0.0, pitch: 0.5, dist: Math.max(56, Math.min(120, L.radius * 1.5 + 30)), minDist: 8, maxDist: 150, bound: Math.max(50, L.radius + 16) };
  },
  get arrival() {
    return layout().arrival;
  },
  async build(ctx): Promise<RegionBuild> {
    const w = ctx.world;
    const rng = ctx.rng;
    const bin = new Bin();
    const L = layout();
    const uNight = { value: 0 };
    const mem = memoryUniforms();
    const ruinsU = ruinUniforms();
    const root = new THREE.Group();
    root.name = 'olvidada';
    const done60 = () => ctx.missionDone('H60');
    /** named camera points for the region's CINE scenes (ui/story/o4RegionCines.ts); some appear later (Polvillo) */
    const cinePoints: Record<string, THREE.Vector3> = {};
    const restoredAtStart = done60() || (L.ruins.length > 0 && L.ruins.every((r) => isRepaired(r.ruin.id)));

    // ── the memory lens on the ground and the sky ──
    patchTerrain(w.terrain.material, mem);
    w.terrain.material.emissive.set('#141010');
    let colorAll = restoredAtStart ? 1 : 0;
    let keysK = -1;
    const syncKeys = () => {
      if (Math.abs(colorAll - keysK) < 0.004) return;
      keysK = colorAll;
      mixKeys(KEYS, colorAll * 0.92);
    };
    syncKeys();
    const lens = lensQuad(bin, LENS);
    root.add(lens.mesh);

    // ── the ruins (one mesh, both states) and the scenery ──
    L.ruins.forEach((sp, i) => {
      ruinsU.uRuinC.value[i].set(sp.x, sp.y, sp.z);
      ruinsU.uBuilt.value[i] = isRepaired(sp.ruin.id) || restoredAtStart ? 1 : 0;
    });
    const seaDir = (p: THREE.Vector3) => {
      // toward the nearest water
      let best = new THREE.Vector3(0, 0, 1);
      let bd = 1e9;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        for (let d = 2; d < 30; d += 1.5) {
          if (height(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d) < 0.2) {
            if (d < bd) {
              bd = d;
              best = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
            }
            break;
          }
        }
      }
      return best;
    };
    const R = new RuinMesher();
    buildRuins(R, L.ruins, rng, seaDir);
    const ruinMat = memToon(bin, mem, { uNight, ruins: ruinsU, key: 'ruins' });
    const ruinMesh = new THREE.Mesh(bin.add(R.build()), ruinMat);
    ruinMesh.castShadow = true;
    ruinMesh.receiveShadow = true;
    ruinMesh.customDepthMaterial = ruinDepth(bin, ruinsU);
    ruinMesh.frustumCulled = false;
    root.add(ruinMesh);
    // scenery: dark lighthouse (unless it's one of the ruins), raft, dry palms, barrels adrift
    const palms: THREE.Vector3[] = [];
    const barrels: THREE.Vector3[] = [];
    for (let i = 0; i < 300 && (palms.length < 6 || barrels.length < 7); i++) {
      const a = rng() * Math.PI * 2;
      const d = rng() * (L.radius + 18);
      const x = L.center.x + Math.cos(a) * d;
      const z = L.center.z + Math.sin(a) * d;
      const h = height(x, z);
      const clear = L.ruins.every((sp) => Math.hypot(x - sp.x, z - sp.z) > sp.r + 2) && Math.hypot(x - L.lighthouse.x, z - L.lighthouse.z) > 4 && Math.hypot(x - L.arrival[0], z - L.arrival[2]) > 4;
      if (h > 0.6 && h < 1.4 && walkable(x, z) && clear && palms.length < 6) palms.push(new THREE.Vector3(x, h, z));
      else if (h < -1.5 && h > -3 && barrels.length < 7) barrels.push(new THREE.Vector3(x, 0, z));
    }
    const S = new RuinMesher();
    const hasFaroRuin = L.ruins.some((sp) => sp.ruin.kind === 'faro');
    const sc = scenery(S, { lighthouse: hasFaroRuin ? null : L.lighthouse, raft: L.raft, palms, barrels, decor: L.decor, groundAt: height }, rng);
    const sceneMesh = new THREE.Mesh(bin.add(S.build()), memToon(bin, mem, { uNight, key: 'scenery' }));
    sceneMesh.castShadow = true;
    sceneMesh.receiveShadow = true;
    root.add(sceneMesh);
    const lampAt = hasFaroRuin ? new THREE.Vector3(L.ruins.find((sp) => sp.ruin.kind === 'faro')!.x, L.ruins.find((sp) => sp.ruin.kind === 'faro')!.y + 9.9, L.ruins.find((sp) => sp.ruin.kind === 'faro')!.z) : sc.lamp[0] ?? null;
    const halos = new Halos(bin, 80);
    root.add(halos.mesh);

    // ── the blank page and the line of ink (H61) ──
    const page = blankPage(bin);
    const pageAt = L.page.clone().add(new THREE.Vector3(0, 9.5, 0));
    page.mesh.position.copy(pageAt);
    page.mesh.scale.setScalar(1.35);
    root.add(page.mesh);
    const ink = inkLine(bin, new THREE.Vector3(L.page.x, 0, L.page.z), L.edgeDir, 110);
    root.add(ink.mesh);
    // a scene may hold the page / its writing / the line of ink (a replay paints the moment back): null = the save's
    let pageForce: number | null = null;
    let inkForce: number | null = null;
    const pageShown = () => (pageForce !== null ? pageForce > 0 : ctx.activeStory() === 'H61' || (ctx.missionDone('H61') && !ctx.missionDone('H64')));
    const writing = (k: number) => {
      page.u.uInk.value = k;
      page.u.uStrike.value = k;
    };
    if (ctx.missionDone('H61')) {
      writing(1);
      ink.u.uLen.value = 1;
    }

    // ── memory sources: one per raised ruin, plus the last wave ──
    const src = mem.uMemSrc.value;
    const srcR: number[] = L.ruins.map((sp) => (isRepaired(sp.ruin.id) || restoredAtStart ? SRC_R : 0));
    let wave = restoredAtStart ? WAVE_R : 0;
    let waveFrom = new THREE.Vector3(L.center.x, 0, L.center.z);
    /** the glow of each window's opening edge (1 while it opens, then it fades) */
    const srcF: number[] = L.ruins.map(() => 0);
    let waveF = 0;
    const syncSrc = (dt = 0) => {
      L.ruins.forEach((sp, i) => {
        srcF[i] = Math.max(0, srcF[i] - dt * 0.5);
        if (i < MAX_SRC - 1) src[i].set(sp.x, sp.z, srcR[i], srcF[i]);
      });
      waveF = Math.max(0, waveF - dt * 0.35);
      src[MAX_SRC - 1].set(waveFrom.x, waveFrom.z, wave, waveF);
      mem.uMemAll.value = wave >= WAVE_R ? 1 : 0;
    };
    syncSrc();

    // ── residents: the silhouettes among the ruins, the repairers, Polvillo ──
    const sil: { cat: PaperCat; ruin: number; k: number }[] = [];
    let silCount = 0;
    for (const sp of L.ruins) {
      for (const species of sp.ruin.silhouettes.slice(0, 2)) {
        if (silCount >= 12) break;
        const def = CAT_BY_ID.get(species);
        if (!def) continue;
        const a = rng() * Math.PI * 2;
        const home = new THREE.Vector3(sp.x + Math.cos(a) * (sp.r + 1.3), 0, sp.z + Math.sin(a) * (sp.r + 1.3));
        home.y = height(home.x, home.z);
        const drawn = artSlug(def.art.slug);
        const id = `olv_sil_${sp.i}_${silCount}`;
        const cat = await w.addResident({ id, name: def.name, slug: drawn, url: catLiteUrl(drawn), height: RARITY_H[def.rarity] ?? 2.5, home, tags: [...def.elements, 'silueta'], acts: 'none', alive: false });
        if (!cat) continue;
        silCount++;
        const k = restoredAtStart ? 0 : isRepaired(sp.ruin.id) ? 0.35 : 0.82;
        cat.flash('#a89a82', k);
        cat.brain.energy = 0.3;
        cat.brain.look = Math.cos(a) > 0 ? -0.6 : 0.6;
        cat.facing = Math.cos(a) > 0 ? -1 : 1;
        sil.push({ cat, ruin: sp.i, k });
        ctx.describe.set(id, {
          title: restoredAtStart ? `${def.name}` : 'Una silueta',
          text: restoredAtStart
            ? `Vivía aquí, en la versión de tu isla en la que nunca llegaste. Ya se acordó de su nombre: ${def.name}.`
            : `Tiene la forma de ${def.name}. No recuerda su nombre. Mira su casa como quien mira una foto vieja.`,
        });
      }
    }
    // the cats you sent: each one stays a while by the ruin it raised
    const visitorUids = new Set(
      (() => {
        const mine = [...G.s.cats];
        const canelo = mine.find((c) => c.species === 'c_canelo');
        const crew = mine.filter((c) => c !== canelo).sort((p, q) => (q.stars ?? 0) - (p.stars ?? 0) || (q.level ?? 0) - (p.level ?? 0)).slice(0, 2);
        return [canelo, ...crew].filter(Boolean).map((c) => c!.uid);
      })(),
    );
    const repairers = new Map<string, PaperCat>();
    const addRepairer = async (uid: string, sp: (typeof L.ruins)[number]) => {
      if (visitorUids.has(uid) || repairers.has(uid)) return null;
      const own = G.s.cats.find((c) => c.uid === uid);
      const def = own ? CAT_BY_ID.get(own.species) : null;
      if (!own || !def) return null;
      const slug = catSlug(own);
      const drawn = artSlug(slug);
      const home = new THREE.Vector3(sp.x, 0, sp.z + sp.r + 1.6);
      home.y = height(home.x, home.z);
      const id = `olv_rep_${uid}`;
      const cat = await w.addResident({ id, name: own.name, slug: drawn, url: catLiteUrl(drawn), height: RARITY_H[def.rarity] ?? 2.5, home, tags: [...def.elements], traits: { playful: 0.5, curious: 0.7 } });
      if (!cat) return null;
      const tint = standInTint(slug);
      if (tint !== undefined) cat.flash(tint, 0.22);
      repairers.set(uid, cat);
      ctx.describe.set(id, { title: own.name, text: `Levantó ${ruinName(sp.ruin.kind, sp.ruin.element).toLowerCase()} con sus propias patas. Bueno, con una piedra. Las demás se acordaron solas.` });
      return cat;
    };
    for (const sp of L.ruins) {
      const uid = repairedBy(sp.ruin.id);
      if (uid && repairers.size < 6) await addRepairer(uid, sp);
    }
    let polvillo: PaperCat | null = null;
    const addPolvillo = async (at: THREE.Vector3) => {
      if (polvillo || !o4PendingCats().includes('c_polvillo')) return;
      cinePoints.polvillo = at.clone().add(new THREE.Vector3(0, 1.2, 0));
      polvillo = await addSkyCat(ctx, { id: 'olv_polvillo', species: 'c_polvillo', home: at, tags: ['olvidada'], here: 'Salió del polvo de la última ruina. Dice que te estaba esperando. Que tardaste. Estornuda un cumpleaños ajeno y se sienta a tu lado.' });
      w.pools.dust.emit({ pos: { x: at.x, y: at.y + 0.6, z: at.z }, spread: { x: 1, y: 0.4, z: 1 }, vel: { x: 0, y: 2.4, z: 0 }, velJitter: { x: 2, y: 1, z: 2 }, life: 1.6, size: 0.7, color: '#e8dcc0', color2: '#b8a888', count: 40 });
    };
    if (done60()) await addPolvillo(new THREE.Vector3(L.arrival[0] + 2.5, height(L.arrival[0] + 2.5, L.arrival[2] - 1.5), L.arrival[2] - 1.5));

    // ── lights ──
    const pageLight: LocalLight = { pos: pageAt.clone().add(new THREE.Vector3(0, -2, 0)), color: new THREE.Color('#fff4dc'), range: 12, intensity: 0 };
    const lampLight: LocalLight = { pos: lampAt?.clone() ?? new THREE.Vector3(), color: new THREE.Color('#ffe2a0'), range: 16, intensity: 0 };
    const winLights: LocalLight[] = L.ruins.map((sp) => ({ pos: new THREE.Vector3(sp.x, sp.y + 2, sp.z), color: new THREE.Color('#ffd27a'), range: 8, intensity: 0 }));

    // ── music: YONOSE TODO «Reconstrucción», a layer per third of the island raised (doc 18 §5.2 H60) ──
    let cued: string | null = null;
    const LAYERS = ['yonose_todo.aftermath', 'yonose_todo.aftermath_bajo', 'yonose_todo.aftermath_ritmo'];
    const layerFor = (p: number) => LAYERS[Math.min(2, Math.floor(p * 3 + 1e-6))];
    const cueLayer = (ref: string, first: boolean) => {
      const r = resolveTrack(ref);
      if (!r || cued === ref) return;
      let at: number | undefined;
      const t = audioApi.trackTime();
      if (!first && t !== null) {
        at = t;
        if (r.loop && at > r.loop.end) at = r.loop.start + ((at - r.loop.start) % (r.loop.end - r.loop.start));
      }
      audioApi.cue(ref, { narrative: true, loop: true, sync: true, quantize: 'now', fadeIn: first ? 3 : 1.2, ...(at !== undefined ? { at } : {}) });
      cued = ref;
    };
    if (restoredAtStart) {
      audioApi.setState('emotional', { fade: 3, context: 'olvidada' });
      audioApi.ambience('sea', { fade: 2.5, level: 0.5 });
    } else {
      cueLayer(layerFor(olvidadaProgress()), true);
      if (!cued) audioApi.setState('emotional', { fade: 3, context: 'olvidada' });
      audioApi.ambience('wind', { fade: 2.5, level: 0.5 });
    }

    // ── repairs ──
    const { st, say } = quietSay(ctx);
    let alive = true;
    // the last ruin's show (rising, the wave, Polvillo) holds the story: its scene (h60_color) plays after it
    let obra = false;
    const holdStory = (on: boolean) => {
      if (on === obra) return;
      obra = on;
      hush('olvidada_obra', on);
    };
    const anims: { t: number; dur: number; fn: (k: number) => void; done?: () => void }[] = [];
    const anim = (dur: number, fn: (k: number) => void) => new Promise<void>((done) => anims.push({ t: 0, dur, fn, done }));
    const silTarget = new Map(sil.map((s) => [s, s.k]));
    const finale = async (last: (typeof L.ruins)[number]) => {
      // the last window opens over the whole island
      waveFrom = new THREE.Vector3(last.x, 0, last.z);
      // the island sounds whole again: the last layer (keys + bass + drums) and the arc's cell on top. (The song
      // itself, complete, is kept for the «Momentos musicales»: regions only play its variations.)
      // (the stinger + the arc's motif on the mission's answer, and the Fonoteca record, are app/oleada4Flow.ts')
      cueLayer(LAYERS[2], false);
      audioApi.ambience('sea', { fade: 4, level: 0.5 });
      w.rig.follow = null;
      w.rig.focus(new THREE.Vector3(L.center.x, 4, L.center.z), Math.max(60, L.radius * 1.4 + 24), 0.42, w.rig.goal.yaw);
      for (const s of sil) silTarget.set(s, 0);
      waveF = 1;
      await anim(4.2, (k) => {
        waveF = Math.max(waveF, 1 - k * 0.6);
        wave = ease(k) * WAVE_R;
        colorAll = ease(Math.max(0, (k - 0.15) / 0.85));
      });
      wave = WAVE_R;
      colorAll = 1;
      for (const s of sil) {
        s.cat.brain.emote('happy', 1);
        const d = ctx.describe.get([...w.residents.entries()].find(([, r]) => r.cat === s.cat)?.[0] ?? '');
        if (d) {
          d.title = d.title === 'Una silueta' ? 'Ya se acordó' : d.title;
          d.text = 'Vivía aquí, en la versión de tu isla en la que nunca llegaste. Ahora alguien sí llegó: se acordó de su nombre.';
        }
      }
      await addPolvillo(new THREE.Vector3(last.x + 1.5, height(last.x + 1.5, last.z + last.r + 2.5), last.z + last.r + 2.5));
    };
    const repair = async (sp: (typeof L.ruins)[number]) => {
      if (st.busy || !olvidadaOpen() || isRepaired(sp.ruin.id)) return;
      st.busy = true;
      try {
        const cats = repairersFor(sp.ruin.id);
        const uid = await pickRepairer({ title: ruinName(sp.ruin.kind, sp.ruin.element), element: sp.ruin.element, cats, kind: sp.ruin.kind });
        if (!uid || !alive) return;
        const last = !done60() && L.ruins.filter((r) => !isRepaired(r.ruin.id)).length === 1;
        if (!repairRuin(sp.ruin.id, uid)) return;
        if (last) holdStory(true);
        w.rig.follow = null;
        w.rig.focus(new THREE.Vector3(sp.x, sp.y + 3, sp.z), 26, 0.36, w.rig.goal.yaw);
        await addRepairer(uid, sp);
        repairers.get(uid)?.brain.emote('happy', 1);
        sfx('charge');
        // the first stone: dust, then the habitat remembers itself
        w.pools.dust.emit({ pos: { x: sp.x, y: sp.y + 0.4, z: sp.z }, spread: { x: sp.r, y: 0.2, z: sp.r }, vel: { x: 0, y: 2.8, z: 0 }, velJitter: { x: 1.6, y: 1.2, z: 1.6 }, life: 1.4, size: 0.7, color: '#e8dcc0', color2: '#b8a888', count: 60 });
        await anim(0.5, () => undefined);
        stingerOr(['discovery_sib', 'discovery'], 'arco', 0.8);
        sfx('reveal');
        w.rig.shake(0.18);
        for (const s of sil) if (s.ruin === sp.i) silTarget.set(s, 0.35);
        await anim(1.8, (k) => {
          srcF[sp.i] = 1;
          ruinsU.uBuilt.value[sp.i] = k;
          srcR[sp.i] = ease(Math.min(1, k * 1.2)) * SRC_R;
        });
        w.pools.stars.emit({ pos: { x: sp.x, y: sp.y + 3, z: sp.z }, spread: { x: sp.r * 0.6, y: 1.5, z: sp.r * 0.6 }, vel: { x: 0, y: 1.2, z: 0 }, velJitter: { x: 1, y: 1, z: 1 }, life: 2, size: 0.45, color: '#fff3c0', color2: '#ffb46a', count: 30 });
        for (const s of sil) if (s.ruin === sp.i) s.cat.brain.emote('surprise', 0.8);
        const p = olvidadaProgress();
        if (p >= 1 || done60()) await finale(sp);
        else {
          cueLayer(layerFor(p), false);
          const left = L.ruins.filter((r) => !isRepaired(r.ruin.id)).length;
          ctx.toast(left === 1 ? 'FALTA UNA' : `FALTAN ${left}`, 'Toca otra ruina y elige quién la levanta.');
        }
      } finally {
        st.busy = false;
        holdStory(false);
      }
    };

    // ── the page ──
    let pageGlow = 0;
    // the page arrives (it fades in the first time it shows in a visit; already there if it was)
    let pageIn = pageShown() ? 1 : 0;
    const touchPage = async () => {
      if (st.busy || ctx.activeStory() !== 'H61') return;
      st.busy = true;
      try {
        w.rig.follow = null;
        w.rig.focus(pageAt.clone(), 16, 0.18, w.rig.goal.yaw);
        motif('pluma');
        pageGlow = 1;
        // somebody writes… (the strikethroughs follow as an overlay the moment the mission answers)
        readDistraxia();
        await anim(2.6, (k) => {
          page.u.uInk.value = Math.max(page.u.uInk.value as number, k);
        });
        await anim(1.2, (k) => (page.u.uStrike.value = Math.max(page.u.uStrike.value as number, k)));
      } finally {
        st.busy = false;
      }
    };
    // the strikes gather into a line that points at the edge of the chart (once H61 is answered)
    let inkGrow = !ctx.missionDone('H61');
    const faroLore = () =>
      say(
        done60()
          ? [
              ['CAPTION', 'El faro de esta isla prendió solo, la noche que la levantaste. Apunta hacia afuera. Como el tuyo.'],
              ['LUZTERNA', 'Ahora ya hay alguien que la recuerde, Capi. Eso es lo único que le faltaba.'],
            ]
          : [
              ['CAPTION', 'Un faro como el tuyo, en el mismo lugar. Nunca lo prendió nadie.'],
              ['LUZTERNA', 'En esta versión yo nunca llegué a tu faro, Capi. Ni tú. Por eso está tan oscuro.'],
            ],
      );

    // ── every frame ──
    let moteT = 0;
    const tmp = new THREE.Vector3();
    w.addProp({
      group: root,
      lights: [pageLight, lampLight, ...winLights],
      update(dt, t, night) {
        uNight.value = night;
        mem.uMemTime.value = t;
        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i];
          a.t = Math.min(a.dur, a.t + dt);
          a.fn(a.t / a.dur);
          if (a.t >= a.dur) {
            anims.splice(i, 1);
            a.done?.();
          }
        }
        syncSrc(dt);
        syncKeys();
        lens.update(w, t);
        lens.u.uK.value = 1 - colorAll * 0.82;
        w.terrain.material.emissiveIntensity = 0.4 + night * 0.4;
        halos.begin();
        // silhouettes slowly take their color back
        for (const s of sil) {
          const want = silTarget.get(s) ?? s.k;
          s.k += (want - s.k) * Math.min(1, dt * 1.2);
          s.cat.flash(silC.set('#a89a82').multiplyScalar(1 - night * 0.55), s.k);
        }
        // windows of the raised habitats at night, the lighthouse once the island is back
        L.ruins.forEach((sp, i) => {
          const b = ruinsU.uBuilt.value[i];
          winLights[i].intensity = b * (0.1 + night * 0.8);
          if (b > 0.9 && sp.ruin.kind === 'habitat') halos.add(tmp.set(sp.x, sp.y + 2.4, sp.z), sp.r * 1.6, '#ffd27a', night * 0.16 * b);
        });
        if (lampAt) {
          const on = colorAll;
          lampLight.intensity = on * (0.3 + night * 1.2);
          halos.add(lampAt, 5 + on * 3, '#ffe9b0', on * (0.15 + night * 0.6));
        }
        // the page: breathes, faces you, glows a little
        const showPage = pageShown();
        pageIn = showPage ? Math.min(1, pageIn + dt / 2.2) : 0;
        page.mesh.visible = showPage && pageIn > 0.01;
        if (page.mesh.visible) {
          page.mesh.scale.setScalar(1.35 * ease(pageIn));
          if (pageIn < 1 && Math.random() < 0.5) w.pools.stars.emit({ pos: { x: pageAt.x, y: pageAt.y, z: pageAt.z }, spread: { x: 2, y: 2.5, z: 0.5 }, vel: { x: 0, y: 0.4, z: 0 }, life: 1.6, size: 0.35, color: '#fffbe8', color2: '#d8d0c0', count: 2 });
          page.u.uTime.value = t;
          pageGlow = Math.max(0, pageGlow - dt * 0.3);
          page.u.uGlow.value = 0.35 + pageGlow + night * 0.3;
          page.mesh.position.set(pageAt.x, pageAt.y + Math.sin(t * 0.7) * 0.4, pageAt.z);
          page.mesh.rotation.y = Math.atan2(w.camera.position.x - pageAt.x, w.camera.position.z - pageAt.z) + Math.sin(t * 0.3) * 0.15;
          // a glow only when it's touched (a halo over it would wash the handwriting out): the light does the rest
          if (pageGlow > 0.02) halos.add(pageAt, 8, '#fff4dc', pageGlow * 0.2);
          pageLight.intensity = 0.2 + night * 0.7;
        } else pageLight.intensity = 0;
        ink.mesh.visible = inkForce !== null || (ctx.missionDone('H61') && !ctx.missionDone('H64'));
        if (inkForce !== null) {
          ink.u.uTime.value = t;
          ink.u.uLen.value = inkForce;
        } else if (ink.mesh.visible) {
          ink.u.uTime.value = t;
          if (inkGrow) ink.u.uLen.value = Math.min(1, (ink.u.uLen.value as number) + dt / 7);
        } else if (ctx.missionDone('H61')) inkGrow = false;
        // dust motes in the old light; fireflies once the island remembers
        moteT -= dt;
        if (moteT <= 0) {
          moteT = 0.1;
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * (L.radius + 4);
          const x = L.center.x + Math.cos(a) * d;
          const z = L.center.z + Math.sin(a) * d;
          const y = Math.max(0.5, height(x, z)) + 0.5 + Math.random() * 3;
          if (colorAll < 0.5) w.pools.motes.emit({ pos: { x, y, z }, vel: { x: 0.15, y: 0.08, z: 0 }, velJitter: { x: 0.1, y: 0.05, z: 0.1 }, life: 5, size: 0.18, color: '#efe2c4', color2: '#c8b898', count: 1 });
          else if (night > 0.4) w.pools.motes.emit({ pos: { x, y, z }, vel: { x: 0, y: 0.15, z: 0 }, velJitter: { x: 0.4, y: 0.2, z: 0.4 }, life: 3, size: 0.26, color: '#fff3a0', color2: '#b8ff8a', count: 1 });
          if (polvillo && Math.random() < 0.3) w.pools.dust.emit({ pos: { x: polvillo.root.position.x, y: polvillo.root.position.y + 0.3, z: polvillo.root.position.z }, vel: { x: 0, y: 0.8, z: 0 }, velJitter: { x: 0.4, y: 0.2, z: 0.4 }, life: 1.2, size: 0.3, color: '#e8dcc0', color2: '#c8b898', count: 2 });
        }
        halos.end();
      },
    });

    // ── points of interest ──
    const pois: POI[] = [
      ...L.ruins.map(
        (sp): POI => ({
          id: `ruina_${sp.ruin.id}`,
          pos: new THREE.Vector3(sp.x, sp.y + 5.5, sp.z),
          label: `REPARAR · ${ruinName(sp.ruin.kind, sp.ruin.element)}`,
          kind: 'activity',
          visible: () => !st.busy && olvidadaOpen() && !isRepaired(sp.ruin.id) && w.camera.position.distanceTo(tmp.set(sp.x, sp.y, sp.z)) < 120,
          onTap: () => repair(sp),
        }),
      ),
      {
        id: 'pagina',
        pos: pageAt.clone().add(new THREE.Vector3(0, 4.2, 0)),
        label: 'LA PÁGINA EN BLANCO',
        kind: 'activity',
        visible: () => !st.busy && ctx.activeStory() === 'H61',
        onTap: () => touchPage(),
      },
      {
        id: 'faro',
        pos: (lampAt ?? L.lighthouse).clone().add(new THREE.Vector3(0, 4, 0)),
        // once the island is back, the lighthouse is no longer «apagado»
        label: restoredAtStart ? 'EL FARO' : 'EL FARO APAGADO',
        kind: 'lore',
        // (once it lights up in this visit, it isn't «apagado» anymore: the label goes away until the next one)
        visible: () => !st.busy && !!lampAt && (restoredAtStart || colorAll < 0.5) && w.camera.position.distanceTo(L.lighthouse) < 90,
        onTap: () => faroLore(),
      },
    ];

    if (olvidadaOpen() && !restoredAtStart && olvidadaProgress() === 0) ctx.toast('REPARA LAS RUINAS', 'Toca una ruina y elige a uno de tus gatos para levantarla.');

    const offDev = devHook(
      'olvidada',
      w,
      {
        layout: () => ({ k: L.k, radius: L.radius, ruins: L.ruins.map((r) => ({ id: r.ruin.id, kind: r.ruin.kind, el: r.ruin.element, x: Math.round(r.x), z: Math.round(r.z), repaired: isRepaired(r.ruin.id) })) }),
        repair: (i: number, uid?: string) => {
          const sp = L.ruins[i];
          if (!sp) return false;
          const who = uid ?? repairersFor(sp.ruin.id)[0]?.uid;
          if (!who || !repairRuin(sp.ruin.id, who)) return false;
          void (async () => {
            await addRepairer(who, sp);
            for (const s of sil) if (s.ruin === sp.i) silTarget.set(s, 0.35);
            await anim(1.8, (k) => {
              srcF[sp.i] = 1;
              ruinsU.uBuilt.value[sp.i] = k;
              srcR[sp.i] = ease(Math.min(1, k * 1.2)) * SRC_R;
            });
            if (olvidadaProgress() >= 1) await finale(sp);
            else cueLayer(layerFor(olvidadaProgress()), false);
          })();
          return true;
        },
        page: touchPage,
        color: (k: number) => {
          colorAll = k;
          wave = k >= 1 ? WAVE_R : 0;
        },
      },
      (h) => {
        region.hour = Math.max(0.01, h);
        w.hour = region.hour;
      },
    );

    return {
      pois,
      cine: {
        points: Object.assign(cinePoints, {
          llegada: new THREE.Vector3(L.arrival[0], L.arrival[1] + 1.5, L.arrival[2]),
          centro: new THREE.Vector3(L.center.x, 4, L.center.z),
          pagina: pageAt.clone(),
          faro: (lampAt ?? L.lighthouse).clone(),
          balsa: L.raft.clone().add(new THREE.Vector3(0, 1.5, 0)),
          borde: new THREE.Vector3(L.page.x, 2, L.page.z).addScaledVector(L.edgeDir, 60),
          ...Object.fromEntries(L.ruins.map((sp) => [`ruina_${sp.ruin.id}`, new THREE.Vector3(sp.x, sp.y + 2.5, sp.z)])),
        }),
        fx: (cmd) => {
          if (cmd.id === 'ola') {
            // the color returns from a point over the whole island (a replay of the last wave)
            const at = Array.isArray(cmd.at) ? new THREE.Vector3(Number(cmd.at[0]), 0, Number(cmd.at[2])) : new THREE.Vector3(L.center.x, 0, L.center.z);
            waveFrom = at;
            waveF = 1;
            void anim(Number(cmd.dur ?? 4), (k) => {
              wave = ease(k) * WAVE_R;
              colorAll = ease(Math.max(0, (k - 0.15) / 0.85));
            });
            return null;
          }
          if (cmd.id === 'tachones') {
            page.u.uInk.value = 0;
            page.u.uStrike.value = 0;
            void anim(2.4, (k) => (page.u.uInk.value = k)).then(() => anim(1.2, (k) => (page.u.uStrike.value = k)));
            return null;
          }
          if (cmd.id === 'tinta') {
            inkGrow = false;
            void anim(Number(cmd.dur ?? 5), (k) => (ink.u.uLen.value = k));
            return null;
          }
          if (cmd.id === 'polvo' && polvillo) {
            const p = (polvillo as PaperCat).root.position;
            w.pools.dust.emit({ pos: { x: p.x, y: p.y + 0.6, z: p.z }, spread: { x: 1, y: 0.4, z: 1 }, vel: { x: 0, y: 2.4, z: 0 }, velJitter: { x: 2, y: 1, z: 2 }, life: 1.6, size: 0.7, color: '#e8dcc0', color2: '#b8a888', count: 40 });
            (polvillo as PaperCat).brain.emote('happy', 1);
            return null;
          }
          return undefined;
        },
        drive: (id, k) => {
          if (id === 'color') {
            colorAll = Math.max(0, Math.min(1, k));
            wave = colorAll >= 1 ? WAVE_R : 0;
          }
          if (id === 'reparada')
            L.ruins.forEach((_, i) => {
              const kk = Math.max(0, Math.min(1, k));
              ruinsU.uBuilt.value[i] = kk;
              // each raised habitat's window of color opens with it
              srcR[i] = ease(Math.min(1, kk * 1.2)) * SRC_R;
            });
          // the scenes of H60/H61 (ui/story/o4RegionCines.ts): k < 0 hands each one back to the save
          if (id === 'pagina') {
            pageForce = k < 0 ? null : k;
            if (pageForce !== null && pageForce > 0) pageIn = Math.max(pageIn, 0.02);
          }
          if (id === 'escritura') writing(k < 0 ? (ctx.missionDone('H61') ? 1 : 0) : Math.min(1, k));
          if (id === 'linea') {
            inkForce = k < 0 ? null : Math.min(1, k);
            if (inkForce !== null) inkGrow = false;
            else if (ctx.missionDone('H61')) ink.u.uLen.value = 1;
          }
        },
        driveGet: (id) =>
          id === 'color'
            ? colorAll
            : id === 'reparada'
              ? L.ruins.length
                ? L.ruins.reduce((s, _, i) => s + ruinsU.uBuilt.value[i], 0) / L.ruins.length
                : 1
              : id === 'polvillo'
                ? polvillo
                  ? 1
                  : 0
                : id === 'pagina'
                  ? (pageForce ?? (pageShown() ? 1 : 0))
                  : id === 'linea'
                    ? (inkForce ?? (ink.mesh.visible ? (ink.u.uLen.value as number) : 0))
                    : id === 'escritura'
                      ? (page.u.uInk.value as number)
                      : undefined,
      },
      dispose() {
        alive = false;
        holdStory(false);
        anims.length = 0;
        if (cued) audioApi.release(2.5);
        audioApi.ambience('none', { fade: 1.5 });
        bin.dispose();
        offDev();
      },
    };
  },
};
