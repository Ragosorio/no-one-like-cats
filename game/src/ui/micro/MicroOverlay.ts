/** Global microevent layer (COLLAGE GRUNGE + red sacred clock). Mounted once in main.ts. */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../../core/scenes';
import { W, H } from '../../core/App';
import { C, F } from '../theme';
import { txt, poster } from '../widgets';
import { icon } from '../icons';
import { sfx } from '../../core/audio';
import { onomatopoeia, sparkles, floatText } from '../../fx/juice';
import { ActiveMicro, currentMicro, onMicro, setMicroAllowed, winMicro, MicroReward } from '../../state/sys/micro';
import { IslandScene } from '../../scenes/IslandScene';
import { catTexture, preloadCats } from '../../art/catArt';
import { SilhouetteFilter } from '../../fx/filters';
import { fmt } from '../../core/format';

let root: Container;
let banner: Container | null = null;
let clockTxt: ReturnType<typeof txt> | null = null;
let actor: Container | null = null;
let caught = 0;
let t = 0;

export function mountMicroOverlay() {
  root = new Container();
  scenes.fxLayer.addChild(root);
  onMicro((m, ended) => {
    if (m) show(m);
    else hide(ended);
  });
  Ticker.shared.add(tick);
}

function onIsland() {
  return scenes.current instanceof IslandScene;
}

function tick(tk: Ticker) {
  setMicroAllowed(onIsland());
  const m = currentMicro();
  root.visible = onIsland();
  if (!m || !clockTxt) return;
  const s = Math.ceil(m.leftMs / 1000);
  clockTxt.text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  t += tk.deltaMS / 1000;
  if (banner && s <= 10) banner.scale.set(1 + (Math.floor(t * 3) % 2) * 0.04);
  // fish rain: claim before the clock runs out
  if (m.def.id === 'lluvia_pescaditos' && m.leftMs < 400 && caught > 0) reward(winMicro(caught), W / 2, H / 2);
}

function show(m: ActiveMicro) {
  caught = 0;
  sfx('alarm');
  // banner (red clock = sacred, cannot be extended)
  banner = new Container();
  const bg = new Graphics().rect(6, 6, 470, 96).fill(C.ink).rect(0, 0, 470, 96).fill(C.red).stroke({ width: 5, color: C.ink });
  const clock = icon('clockRed', 54);
  clock.position.set(46, 48);
  const name = poster(m.def.name, 34, C.paper);
  name.position.set(84, 6);
  const desc = txt(m.def.desc, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.paper, wordWrap: true, wordWrapWidth: 270 });
  desc.position.set(86, 50);
  clockTxt = poster('0:45', 44, C.yellow, { stroke: { color: C.ink, width: 6 } });
  clockTxt.anchor.set(1, 0);
  clockTxt.position.set(458, 18);
  banner.addChild(bg, clock, name, desc, clockTxt);
  banner.position.set(W - 500, 210);
  banner.rotation = -0.02;
  root.addChild(banner);
  gsap.from(banner, { x: W + 40, duration: 0.35, ease: 'back.out(1.6)' });
  spawnActor(m);
}

function hide(ended?: 'won' | 'expired') {
  if (banner) {
    const b = banner;
    gsap.to(b, { x: W + 60, alpha: 0, duration: 0.3, onComplete: () => b.destroy({ children: true }) });
  }
  banner = null;
  clockTxt = null;
  if (actor) {
    const a = actor;
    gsap.to(a, { alpha: 0, duration: 0.3, onComplete: () => a.destroy({ children: true }) });
  }
  actor = null;
  if (ended === 'expired') floatText(root, W - 260, 330, 'SE FUE… (sin castigo)', { color: C.paper, size: 30 });
}

function reward(r: MicroReward, x: number, y: number) {
  sfx('fanfare');
  sparkles(root, x, y, C.yellow, 18, 220);
  const parts: string[] = [];
  if (r.food) parts.push(`+${fmt(r.food)} 🐟`);
  if (r.gold) parts.push(`+${fmt(r.gold)} 🪙`);
  if (r.scrap) parts.push(`+${r.scrap} ⚙️`);
  if (r.orbs) parts.push(`+${r.orbs.n} orbes`);
  if (r.purr) parts.push(`+${r.purr} min ⏳`);
  floatText(root, x, y - 60, parts.join('  ') || '¡LISTO!', { color: C.yellow, size: 46, rise: 80, dur: 1.6 });
}

function clickable(c: Container, onTap: () => void) {
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', onTap);
}

function spawnActor(m: ActiveMicro) {
  actor = new Container();
  root.addChild(actor);
  const id = m.def.id;
  if (id === 'pez_dorado') {
    const fish = new Container();
    const g = new Graphics();
    g.ellipse(0, 0, 46, 26).fill(0xffc94a).stroke({ width: 4, color: C.ink });
    g.poly([40, 0, 74, -24, 74, 24]).fill(0xffa21a).stroke({ width: 4, color: C.ink });
    g.circle(-24, -6, 6).fill(C.ink);
    g.circle(-26, -8, 2).fill(0xffffff);
    fish.addChild(g);
    actor.addChild(fish);
    let hits = 0;
    const path = { x: -100 };
    gsap.to(path, { x: W + 120, duration: m.def.durationMs / 1000, ease: 'none', onUpdate: () => fish.position.set(path.x, H - 210 + Math.sin(path.x / 90) * 40) });
    clickable(fish, () => {
      hits++;
      sfx('splash', 1 + hits * 0.1);
      onomatopoeia(root, fish.x, fish.y - 60, hits >= 3 ? '¡ATRAPADO!' : '¡CHAP!', { color: C.yellow, size: 60 });
      gsap.fromTo(fish, { y: fish.y - 40 }, { y: fish.y, duration: 0.3, ease: 'bounce.out' });
      if (hits >= 3) reward(winMicro(), fish.x, fish.y);
    });
  } else if (id === 'cangrejo_chatarrero') {
    const crab = new Container();
    const g = new Graphics();
    g.ellipse(0, 0, 40, 26).fill(C.red).stroke({ width: 4, color: C.ink });
    for (const s of [-1, 1]) {
      g.circle(s * 48, -18, 14).fill(C.red).stroke({ width: 4, color: C.ink });
      for (let i = 0; i < 3; i++) g.moveTo(s * 20, 10 + i * 4).lineTo(s * (40 + i * 6), 24 + i * 6).stroke({ width: 4, color: C.ink });
    }
    g.circle(-10, -26, 6).fill(0xffffff).stroke({ width: 3, color: C.ink });
    g.circle(10, -26, 6).fill(0xffffff).stroke({ width: 3, color: C.ink });
    const bolts = icon('scrap', 30);
    bolts.position.set(0, -50);
    crab.addChild(g, bolts);
    actor.addChild(crab);
    let hits = 0;
    const p = { x: 140 };
    gsap.to(p, { x: W - 140, duration: m.def.durationMs / 1000, ease: 'none', onUpdate: () => crab.position.set(p.x, H - 150 + (Math.floor(p.x / 20) % 2) * 4) });
    clickable(crab, () => {
      hits++;
      sfx('hit', 1 + hits * 0.12);
      onomatopoeia(root, crab.x, crab.y - 70, '¡PAF!', { color: C.yellow, size: 50 });
      if (hits >= 5) reward(winMicro(), crab.x, crab.y);
    });
  } else if (id === 'gato_callejero') {
    void preloadCats(['nube_dream_cat']).then(() => {
      if (!actor || actor.destroyed) return;
      const s = new Sprite(catTexture('nube_dream_cat'));
      s.anchor.set(0.5, 1);
      s.scale.set(0.22);
      s.filters = [new SilhouetteFilter(C.ink, 1)];
      const q = poster('?', 70, C.yellow, { stroke: { color: C.ink, width: 8 } });
      q.anchor.set(0.5);
      q.position.set(0, -170);
      const c = new Container();
      c.addChild(s, q);
      c.position.set(300 + Math.random() * (W - 900), 420 + Math.random() * 360);
      actor.addChild(c);
      gsap.to(q, { y: -190, duration: 0.5, yoyo: true, repeat: -1 });
      clickable(c, () => {
        sfx('meow', 1.2);
        (s.filters![0] as SilhouetteFilter).mix = 0;
        onomatopoeia(root, c.x, c.y - 200, '¡MIAU!', { color: C.paper, size: 70 });
        reward(winMicro(), c.x, c.y - 120);
      });
    });
  } else if (id === 'lluvia_pescaditos') {
    const counter = poster('0', 60, C.yellow, { stroke: { color: C.ink, width: 8 } });
    counter.position.set(W / 2 - 20, 260);
    actor.addChild(counter);
    const drop = () => {
      if (!actor || actor.destroyed || !currentMicro()) return;
      const f = icon('food', 54);
      f.position.set(160 + Math.random() * (W - 320), -60);
      actor.addChild(f);
      gsap.to(f, { y: H + 80, rotation: Math.random() * 4, duration: 2.2 + Math.random(), ease: 'power1.in', onComplete: () => f.destroy({ children: true }) });
      clickable(f, () => {
        caught = Math.min(40, caught + 1);
        counter.text = String(caught);
        sfx('coin', 1 + caught * 0.03);
        f.destroy({ children: true });
      });
      window.setTimeout(drop, 260 + Math.random() * 260);
    };
    drop();
  } else if (id === 'burbuja_resonancia') {
    const b = new Container();
    const g = new Graphics().circle(0, 0, 50).fill({ color: C.pink, alpha: 0.35 }).stroke({ width: 5, color: C.paper });
    const heart = txt('💗', { fontSize: 44 });
    heart.anchor.set(0.5);
    b.addChild(g, heart);
    actor.addChild(b);
    const p = { t: 0 };
    gsap.to(p, { t: 1, duration: m.def.durationMs / 1000, ease: 'none', onUpdate: () => b.position.set(400 + Math.sin(p.t * 9) * 260 + p.t * 900, H - 200 - p.t * 600) });
    clickable(b, () => {
      sfx('pop');
      onomatopoeia(root, b.x, b.y, '¡POP!', { color: C.pink, size: 70 });
      reward(winMicro(), b.x, b.y);
    });
  }
}
