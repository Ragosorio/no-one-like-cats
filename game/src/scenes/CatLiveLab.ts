import { Container, Graphics } from 'pixi.js';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { paperBg, poster, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { livingCat, preloadCats } from '../art/catArt';
import { ART, CatEmote, CatPuppet, catRig } from '../art/livingCat';
import { CATS } from '../data/content';

/**
 * Dev scene (?scene=catlive): every painting as a living MAI puppet.
 * &cat=<slug> shows one big · &rig=1 draws the MAI rig over it · click a cat to cycle emotes.
 * window.__catlab exposes the puppets for headless checks.
 */
export class CatLiveLab extends Scene {
  override async enter() {
    const q = new URLSearchParams(location.search);
    const pick = q.get('cats')?.split(',').filter(Boolean);
    const one = q.get('cat');
    const showRig = q.get('rig') === '1';
    this.addChild(paperBg(W, H));
    const title = poster(one ? one.toUpperCase() : 'GATOS VIVOS · MAI', one ? 64 : 84);
    title.position.set(30, 6);
    this.addChild(title);
    const slugs = one ? [one] : pick ?? [...new Set(CATS.map((c) => c.art.slug))].sort();
    await preloadCats(slugs);
    const puppets: CatPuppet[] = [];
    const cols = one ? 1 : pick ? Math.min(4, slugs.length) : 8;
    const rows = Math.ceil(slugs.length / cols);
    const cell = one ? 900 : Math.min(pick ? 470 : 225, (W - 40) / cols, (H - 190) / rows / 0.98);
    const ox = one ? W / 2 : (W - cols * cell) / 2 + cell / 2;
    const oy = one ? H - 60 : 130 + cell * 0.95;
    const emotes: CatEmote[] = ['happy', 'surprise', 'hurt', 'attack', 'sleepy'];
    slugs.forEach((slug, i) => {
      const holder = new Container();
      const x = ox + (i % cols) * cell;
      const y = oy + Math.floor(i / cols) * (one ? 0 : cell * 0.98);
      holder.position.set(x, y);
      const p = livingCat(slug, { anchorX: 0.5, anchorY: 0.94, fps: 15 });
      const size = one ? 900 : cell * 0.98;
      p.scale.set(size / ART);
      holder.addChild(p);
      if (showRig) holder.addChild(rigOverlay(slug, size));
      if (!one) {
        const label = txt(slug.replace(/_cat$/, '').replace(/_/g, ' ').toUpperCase(), { fontFamily: F.ui, fontSize: 15, fill: C.ink });
        label.anchor.set(0.5, 0);
        label.position.set(0, 6);
        holder.addChild(label);
      }
      let k = 0;
      holder.eventMode = 'static';
      holder.cursor = 'pointer';
      holder.on('pointertap', () => p.emote(emotes[k++ % emotes.length]));
      this.addChild(holder);
      puppets.push(p);
    });
    const legend = txt('arte: MAI SVG puro · rig MAI (ojos/orejas/cabeza/cola/flotantes) · click = emoción', { fontFamily: F.ui, fontSize: 20, fill: C.ink });
    legend.position.set(30, H - 34);
    this.addChild(legend);
    (window as unknown as { __catlab: unknown }).__catlab = { puppets, slugs };
  }
}

function rigOverlay(slug: string, size: number) {
  const rig = catRig(slug);
  const g = new Graphics();
  if (!rig) return g;
  const k = size / ART;
  const X = (v: number) => (v - ART * 0.5) * k;
  const Y = (v: number) => (v - ART * 0.94) * k;
  const [hx, hy, rx, ry] = rig.head;
  g.ellipse(X(hx), Y(hy), rx * k, ry * k).stroke({ width: 2, color: 0xffd400 });
  g.circle(X(rig.neck[0]), Y(rig.neck[1]), 5).fill(0xffd400);
  for (const [bx, by, tx, ty] of rig.ears) g.moveTo(X(bx), Y(by)).lineTo(X(tx), Y(ty)).stroke({ width: 3, color: 0xff2e2e });
  for (const [x0, y0, x1, y1] of rig.eyes) g.rect(X(x0), Y(y0), (x1 - x0) * k, (y1 - y0) * k).stroke({ width: 2, color: 0x22dd44 });
  if (rig.tail) {
    rig.tail.pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
    g.stroke({ width: 3, color: 0xff2ef0 });
  }
  for (const [fx, fy, fr] of rig.floats) g.circle(X(fx), Y(fy), fr * k).stroke({ width: 2, color: 0x00e5ff });
  return g;
}
