/**
 * PELÍCULAS — the style library. A style = its post look (lens + stock), its cat treatment (Studio bake), the bake
 * jobs it queues at load, and a KIT of drawing helpers its sets use (vangogh.ts, davinci.ts, noir.ts). Parameters
 * come from the scene's StyleRef (`{ id: 'noir', params: { accent: 0.92 } }`) and override the look.
 *
 * The ids and job names mirror film/catalog.ts (tests/filmEngine.test.ts checks they agree).
 */
import type { PostLook } from '../post';
import type { Baker } from '../bake';
import type { CatBake } from './catbake';
import { acuarelaBake, impastoBake, klimtBake, linoBake, mudoBake, noirBake, planoBake, realismoBake, sketchBake, ukiyoeBake, vidrioBake } from './catbake';
import { bakeTv } from '../../momentos/songs/drunck/tv';
import { prepLinterna } from './linterna';
import { prepKlimt } from './klimt';
import { prepPosada } from './posada';
import { prepVanGogh } from './vangogh';
import { prepDaVinci } from './davinci';
import { prepNoir } from './noir';
import { GRAFICO_MODULES } from './grafico';
import { LIBROS_BAKES, LIBROS_MODULES } from './libros';
import { popBake, prepPop } from './pop';
import { VINETA_BAKES, VINETA_MODULES } from './vineta';
import { CAT_BAKES } from './catbake';

export interface StylePrep {
  baker: Baker;
  /** shared textures the style bakes once per film (its kit reads them) */
  tex: Map<string, import('pixi.js').Texture>;
  params: Record<string, number | string>;
}
export interface StyleModule {
  id: string;
  look: Partial<PostLook>;
  catBake: CatBake;
  /** queue the style's own bake jobs (names = catalog STYLES[id].bakes, except the '-cats' job the stage runs) */
  prepare?(p: StylePrep): void;
  /** the film's backdrop colour under this style (never shows through, but transitions to black fade to it) */
  ground: number;
}

export const STYLE_MODULES: Record<string, StyleModule> = {
  vangogh: {
    id: 'vangogh',
    // oil on canvas: rich, warm lights, a little canvas weave, almost no grain
    look: { grain: 0.025, vig: 0.32, sat: 1.12, contrast: 1.04, canvas: 0.5, hal: 0.12, halT: 0.78, halR: 9, warm: 0.1 },
    catBake: impastoBake,
    prepare: prepVanGogh,
    ground: 0x0b1440,
  },
  davinci: {
    id: 'davinci',
    // a page under a candle: warm, soft, the paper's own fibers
    look: { grain: 0.03, vig: 0.42, sat: 0.92, contrast: 1.02, paper: 0.55, warm: 0.22, lift: 0.01 },
    catBake: sketchBake,
    prepare: prepDaVinci,
    ground: 0x2a1a0e,
  },
  noir: {
    id: 'noir',
    // night stock: mono with two kept hues (the magenta neon, Canelo's cinnamon), grain, halation, aberration, dirt
    look: { grain: 0.085, vig: 0.5, mono: 0.94, accHue: 0.93, accW: 0.06, accHue2: 0.07, accW2: 0.09, contrast: 1.12, lift: 0, hal: 0.55, halT: 0.62, halR: 7, aberr: 0.35, dirt: 0.45, sat: 1.1 },
    catBake: noirBake([1, -0.35]),
    prepare: prepNoir,
    ground: 0x050608,
  },
  acuarela: {
    id: 'acuarela',
    look: { grain: 0.02, vig: 0.18, sat: 0.95, paper: 0.8, lift: 0.04, contrast: 0.95 },
    catBake: acuarelaBake,
    prepare: (p) => p.baker.add('acuarela:paper', 'papel de acuarela', () => undefined),
    ground: 0xf2ece0,
  },
  ukiyoe: {
    id: 'ukiyoe',
    look: { grain: 0.03, vig: 0.2, sat: 1.0, paper: 0.6, contrast: 1.05, warm: 0.08 },
    catBake: ukiyoeBake,
    prepare: (p) => p.baker.add('ukiyoe:paper', 'papel washi', () => undefined),
    ground: 0xefe4cc,
  },
  linterna: {
    id: 'linterna',
    // a magic-lantern show: warm, soft, flame flicker, dust in the beam
    look: { grain: 0.05, vig: 0.6, sat: 1.05, contrast: 1.02, warm: 0.18, flicker: 0.25, hal: 0.35, halT: 0.6, halR: 10 },
    catBake: vidrioBake,
    prepare: prepLinterna,
    ground: 0x050403,
  },
  klimt: {
    id: 'klimt',
    // gold leaf: warm, rich, a metallic bloom
    look: { grain: 0.02, vig: 0.35, sat: 1.1, contrast: 1.06, warm: 0.25, hal: 0.4, halT: 0.7, halR: 8, canvas: 0.15 },
    catBake: klimtBake,
    prepare: prepKlimt,
    ground: 0x2a1a06,
  },
  posada: {
    id: 'posada',
    // linocut on cream paper: two inks, the paper's tooth
    look: { grain: 0.03, vig: 0.3, mono: 1, contrast: 1.25, paper: 0.7, warm: 0.12 },
    catBake: linoBake,
    prepare: prepPosada,
    ground: 0xece2c8,
  },
  realismo: {
    id: 'realismo',
    // natural light, film stock: grain, a little halation, cool shadows
    look: { grain: 0.06, vig: 0.42, sat: 0.9, contrast: 1.08, hal: 0.35, halT: 0.7, halR: 7, aberr: 0.15, dirt: 0.2, warm: -0.05 },
    catBake: realismoBake,
    ground: 0x06080c,
  },
  pintura: {
    id: 'pintura',
    // the game's own painting, no filters: almost neutral
    look: { grain: 0.015, vig: 0.22 },
    catBake: planoBake,
    ground: 0x0a0d16,
  },
  borracha: {
    id: 'borracha',
    // the TV cartoon with its laugh taken away: washed colours, no bounce
    look: { grain: 0.03, vig: 0.3, sat: 0.62, contrast: 0.92, lift: 0.05, warm: -0.04 },
    catBake: bakeTv,
    ground: 0x1d1430,
  },
  gato: {
    id: 'gato',
    // cat vision: two colours, the dark seen clear, a wide field
    look: { grain: 0.06, vig: 0.55, duo: 1, duoA: 0x14246a, duoB: 0xf4dc72, lift: 0.08, contrast: 0.95 },
    catBake: planoBake,
    ground: 0x0a0f2a,
  },
  mudo: {
    id: 'mudo',
    look: { grain: 0.12, vig: 0.55, sepia: 0.85, contrast: 1.15, flicker: 0.8, scratch: 0.8, hal: 0.2 },
    catBake: mudoBake,
    ground: 0x0c0b09,
  },
  // the graphic styles (FILM-ACTO1, styles/grafico.ts)
  ...GRAFICO_MODULES,
  // POP (FILM-ACTO4, styles/pop.ts): neon and pastel flat, one hard stage light, LED dots
  pop: { id: 'pop', look: { grain: 0.03, vig: 0.3, sat: 1.12, contrast: 1.06, hal: 0.3, halT: 0.72, halR: 8, aberr: 0.25, warm: 0.02 }, catBake: popBake, prepare: prepPop, ground: 0x0b0618 },
  // the page & panel styles (FILM-ACTO2, styles/vineta.ts)
  ...VINETA_MODULES,
  // the book styles (FILM-ACTO3, styles/libros.ts)
  ...LIBROS_MODULES,
};
// their extra treatments for `{ slug, bake }` (aracnido, periodico, edadplata, manga, hilo, cel, caravaggio)
Object.assign(CAT_BAKES, VINETA_BAKES);
// FILM-ACTO3's book treatments (libros, recorte, grabado, caligari, tecnico, tinta, senal)
Object.assign(CAT_BAKES, LIBROS_BAKES);
