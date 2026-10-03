import { Sprite } from 'pixi.js';
import { Scene } from '../core/scenes';
import { W, H } from '../core/App';
import { paperBg, poster, txt } from '../ui/widgets';
import { C, F } from '../ui/theme';
import { BattleCat, IslandCat, preloadCats, catTexture } from '../art/catArt';
import { ComicFilter, InkFilter } from '../fx/filters';
import { playCatReveal } from '../fx/sequences/catReveal';
import { scenes } from '../core/scenes';
import { Button } from '../ui/widgets';

/** Dev scene: compare cat render styles. */
export class ArtLab extends Scene {
  override async enter() {
    this.addChild(paperBg(W, H));
    const title = poster('DIMENSIONES', 120);
    title.position.set(40, 10);
    this.addChild(title);
    const cats: [string, string][] = [
      ['canelo_cozy_cat', 'fire'],
      ['jelly_aquatic_cat', 'water'],
      ['regal_cosmic_cat', 'cosmic'],
      ['lantern_spirit_cat', 'spirit'],
    ];
    await preloadCats(cats.map((c) => c[0]));
    cats.forEach(([slug, el], i) => {
      const x = 240 + i * 440;
      const isl = new IslandCat(slug, 170);
      isl.position.set(x - 110, 420);
      this.addChild(isl);
      const raw = new Sprite(catTexture(slug));
      raw.anchor.set(0.5, 0.94);
      raw.scale.set(170 / raw.texture.width);
      raw.position.set(x + 100, 420);
      raw.filters = [new ComicFilter({ levels: 5, dot: 4 })];
      this.addChild(raw);
      const bc = new BattleCat(slug, el, 240, false);
      bc.position.set(x - 60, 780);
      this.addChild(bc);
      const ink = new Sprite(catTexture(slug));
      ink.anchor.set(0.5, 0.94);
      ink.scale.set(170 / ink.texture.width);
      ink.position.set(x + 130, 780);
      ink.filters = [new InkFilter({ threshold: 0.45 })];
      this.addChild(ink);
      const label = txt(slug.toUpperCase(), { fontFamily: F.poster, fontSize: 26, fill: C.ink });
      label.position.set(x - 180, 820);
      this.addChild(label);
    });
    const legend = txt('isla · cómic  /  battle form · manga tinta', { fontFamily: F.ui, fontSize: 22 });
    legend.position.set(40, H - 50);
    this.addChild(legend);
    const b = new Button('REVELAR', async () => {
      await preloadCats(['regal_cosmic_cat']);
      await playCatReveal(scenes.overlayLayer, { slug: 'regal_cosmic_cat', name: 'Nova Real', elements: ['cosmic', 'magic'], rarity: 'legendary', serial: 47, caption: 'Mochi y Levi se fueron a invocar otro… y volvieron con ESTO.', subtitle: 'ARTILLERO · ULT: SUPERNOVA DE ESTAMBRE' });
    }, { w: 240 });
    b.position.set(W - 300, 30);
    this.addChild(b);
  }
}
