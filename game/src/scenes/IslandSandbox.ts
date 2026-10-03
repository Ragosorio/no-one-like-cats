import { Container, Graphics, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { IslandCamera } from '../island/camera';
import { generateArchipelago, RegionDef, TerrainView } from '../island/terrain';
import { isoToScreen, TW, TH } from '../island/iso';
import { habitatArt, farmArt, sanctuaryArt, plate, centerOf } from '../island/buildingArt';
import { IslandCat, preloadCats } from '../art/catArt';
import { halftoneTexture } from '../art/textures';
import { C } from '../ui/theme';

const REGIONS: RegionDef[] = [
  { id: 'home', biome: 'home', cx: 22, cy: 22, r: 6.2 },
  { id: 'forest', biome: 'forest', cx: 22, cy: 12.5, r: 4.6 },
  { id: 'cliff', biome: 'cliff', cx: 31, cy: 21, r: 4.4 },
  { id: 'ice', biome: 'ice', cx: 13, cy: 22, r: 4.6 },
  { id: 'ruins', biome: 'ruins', cx: 31, cy: 30, r: 4.2 },
  { id: 'volcano', biome: 'volcano', cx: 22, cy: 32, r: 4.8 },
  { id: 'cosmic', biome: 'cosmic', cx: 13, cy: 12, r: 4 },
];

/** Dev scene: validate the island look + camera. */
export class IslandSandbox extends Scene {
  bg = new Graphics();
  world = new Container();
  terrain!: TerrainView;
  objects = new Container();
  cam!: IslandCamera;
  cats: { cat: IslandCat; area: { x0: number; y0: number; w: number; h: number }; tx: number; ty: number; wait: number }[] = [];

  override async enter() {
    this.bg.rect(0, 0, W, H).fill(C.megaBlue);
    const dots = new TilingSprite({ texture: halftoneTexture(0x204a7a, 14, 3), width: W, height: H });
    this.addChild(this.bg, dots, this.world);
    const tiles = generateArchipelago(REGIONS);
    const rb = Object.fromEntries(REGIONS.map((r) => [r.id, r.biome]));
    this.terrain = new TerrainView(tiles, rb);
    this.terrain.redraw(new Set(['home', 'forest']));
    this.world.addChild(this.terrain, this.objects);
    this.objects.sortableChildren = true;

    await preloadCats(['canelo_cozy_cat', 'molten_ember_cat', 'jelly_aquatic_cat', 'menta_botanical_cat', 'mochi_bell_cat']);
    this.place(habitatArt('fire', 3, 3), 18, 18, 3, 3, 'HÁBITAT DE FUEGO', ['canelo_cozy_cat', 'molten_ember_cat']);
    this.place(habitatArt('water', 3, 3), 23, 18, 3, 3, 'HÁBITAT DE AGUA', ['jelly_aquatic_cat']);
    this.place(habitatArt('nature', 3, 3), 18, 23, 3, 3, 'HÁBITAT NATURALEZA', ['menta_botanical_cat', 'mochi_bell_cat']);
    this.place(farmArt(2, 2), 24, 23, 2, 2, 'SARDINAS', []);
    this.place(farmArt(2, 2, 3), 24, 26, 2, 2, 'SALMÓN', []);
    this.place(sanctuaryArt(3, 3), 20, 9, 3, 3, 'SANTUARIO', []);

    const input = new Graphics().rect(0, 0, W, H).fill({ color: 0, alpha: 0.001 });
    this.addChildAt(input, 2);
    this.cam = new IslandCamera(this.world, this);
    const home = isoToScreen(21, 21);
    this.cam.lookAt(home.x, home.y, false, 0.8);
  }

  place(art: Container, gx: number, gy: number, fw: number, fh: number, label: string, cats: string[]) {
    const p = isoToScreen(gx, gy);
    art.position.set(p.x, p.y);
    art.zIndex = gx + gy;
    this.objects.addChild(art);
    const ctr = centerOf(fw, fh);
    const pl = plate(label);
    pl.position.set(p.x + ctr.x, p.y + ctr.y - 120);
    pl.zIndex = 9999;
    this.objects.addChild(pl);
    art.eventMode = 'static';
    art.cursor = 'pointer';
    art.on('pointertap', () => {
      if (this.cam.wasDrag) return;
      gsap.fromTo(art.scale, { x: 1.06, y: 0.94 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
    });
    for (const slug of cats) {
      const cat = new IslandCat(slug, 96);
      const area = { x0: gx + 0.6, y0: gy + 0.6, w: fw - 1.2, h: fh - 1.2 };
      const tgx = area.x0 + Math.random() * area.w;
      const tgy = area.y0 + Math.random() * area.h;
      const sp = isoToScreen(tgx, tgy);
      cat.position.set(sp.x, sp.y + TH / 2);
      cat.zIndex = tgx + tgy + 0.5;
      this.objects.addChild(cat);
      this.cats.push({ cat, area, tx: tgx, ty: tgy, wait: Math.random() * 2 });
    }
  }

  override update(dt: number) {
    for (const c of this.cats) {
      c.wait -= dt;
      if (c.wait > 0) continue;
      const ngx = c.area.x0 + Math.random() * c.area.w;
      const ngy = c.area.y0 + Math.random() * c.area.h;
      const sp = isoToScreen(ngx, ngy);
      const dist = Math.hypot(sp.x - c.cat.x, sp.y + TH / 2 - c.cat.y);
      c.cat.face(sp.x > c.cat.x ? 1 : -1);
      c.wait = dist / 60 + 1.5 + Math.random() * 3;
      gsap.to(c.cat, {
        x: sp.x,
        y: sp.y + TH / 2,
        duration: dist / 60,
        ease: 'none',
        onUpdate: () => {
          c.cat.zIndex = (c.cat.y - TH / 2) / (TH / 2) + 0.5;
        },
      });
    }
  }
}

export { TW };
