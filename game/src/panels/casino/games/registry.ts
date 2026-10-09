/**
 * Casino game registry: one entry per table. The CasinoScene builds its left nav from this list (grouped,
 * scrollable) and loads each view lazily. To add a game: write its view (CasinoView, ideally extending
 * games/base.ts → MiniGame), its rules in state/sys/casino/<game>.ts, and add one entry here.
 */
import { Container, Graphics } from 'pixi.js';
import type { CasinoCtx, CasinoTab, CasinoView } from '../ctx';
import { CP, ticketIcon, paw } from '../kit';
import { txt } from '../../../ui/widgets';
import { F } from '../../../ui/theme';

export interface GameDef {
  id: CasinoTab;
  name: string;
  sub: string;
  color: number;
  group: string;
  icon: () => Container;
  load: (ctx: CasinoCtx, arg?: string) => Promise<CasinoView>;
  /** remembered as "the last table you played" (the floor reopens it) */
  remember?: boolean;
}

export const GROUPS = ['MÁQUINAS', 'MESAS', 'SUERTE RÁPIDA', 'PORTAL Y CANJE'] as const;

export const GAMES: GameDef[] = [
  { id: 'slot', name: 'TRAGAMICHIS', sub: 'Jala la cola', color: CP.pink, group: 'MÁQUINAS', icon: () => navIcon('slot'), remember: true, load: async (c) => new (await import('../SlotView')).SlotView(c) },
  { id: 'roulette', name: 'RULETA', sub: 'Rojo, negro o gato', color: CP.red, group: 'MÁQUINAS', icon: () => navIcon('roulette'), remember: true, load: async (c) => new (await import('../RouletteView')).RouletteView(c) },
  { id: 'plinko', name: 'PLINKO', sub: 'Suelta la croqueta', color: CP.cyan, group: 'MÁQUINAS', icon: () => navIcon('plinko'), remember: true, load: async (c) => new (await import('./PlinkoView')).PlinkoView(c) },
  { id: 'dice', name: 'DUELO DE DADOS', sub: 'Contra Don Cubilete', color: CP.yellow, group: 'MESAS', icon: () => navIcon('dice'), remember: true, load: async (c) => new (await import('./DiceView')).DiceView(c) },
  { id: 'hilo', name: 'MAYOR O MENOR', sub: 'La racha del gato', color: CP.green, group: 'MESAS', icon: () => navIcon('hilo'), remember: true, load: async (c) => new (await import('./HiloView')).HiloView(c) },
  { id: 'bingo', name: 'BINGO EXPRÉS', sub: 'Trece bolitas', color: 0xff6a1a, group: 'MESAS', icon: () => navIcon('bingo'), remember: true, load: async (c) => new (await import('./BingoView')).BingoView(c) },
  { id: 'scratch', name: 'RASCA Y GANA', sub: 'Con la uña', color: CP.softPink, group: 'SUERTE RÁPIDA', icon: () => navIcon('scratch'), remember: true, load: async (c) => new (await import('./ScratchView')).ScratchView(c) },
  { id: 'boxes', name: 'CAJAS MISTERIOSAS', sub: 'Elige bien', color: CP.violet, group: 'SUERTE RÁPIDA', icon: () => navIcon('boxes'), remember: true, load: async (c) => new (await import('./BoxesView')).BoxesView(c) },
  { id: 'gacha', name: 'PORTAL', sub: 'Invoca gatos', color: CP.violet, group: 'PORTAL Y CANJE', icon: () => navIcon('gacha'), remember: true, load: async (c, a) => new (await import('../GachaView')).GachaView(c, a) },
  { id: 'caja', name: 'LA CAJA', sub: 'Canjea fichas', color: CP.yellow, group: 'PORTAL Y CANJE', icon: () => navIcon('caja'), load: async (c) => new (await import('../CajaView')).CajaView(c) },
  { id: 'acc', name: 'ACCESORIOS', sub: 'Viste a tus gatos', color: CP.cyan, group: 'PORTAL Y CANJE', icon: () => navIcon('acc'), load: async (c, a) => new (await import('../AccessoryPanel')).AccessoryView(c, a) },
];
export const GAME_BY_ID = new Map(GAMES.map((g) => [g.id, g]));
export const isGame = (id: unknown): id is CasinoTab => typeof id === 'string' && GAME_BY_ID.has(id as CasinoTab);

/** nav icons (≈56 px, centered at 0,0), drawn in code */
export function navIcon(kind: CasinoTab): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (kind) {
    case 'slot':
      g.roundRect(-24, -26, 48, 52, 6).fill(CP.pink).stroke({ width: 3, color: CP.paper });
      g.rect(-17, -12, 34, 18).fill(CP.paper);
      for (let i = 0; i < 3; i++) g.circle(-11 + i * 11, -3, 3.5).fill(i === 1 ? CP.ink : CP.pink);
      g.moveTo(28, -18).lineTo(28, 10).stroke({ width: 4, color: CP.paper, cap: 'round' });
      g.circle(28, -20, 6).fill(CP.yellow);
      break;
    case 'roulette':
      g.circle(0, 0, 26).fill(CP.red).stroke({ width: 3, color: CP.paper });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const a2 = a + Math.PI / 8;
        g.poly([0, 0, Math.cos(a) * 24, Math.sin(a) * 24, Math.cos(a2) * 24, Math.sin(a2) * 24]).fill(i % 2 ? CP.ink : CP.red);
      }
      g.circle(0, 0, 8).fill(CP.yellow).stroke({ width: 2, color: CP.ink });
      g.circle(12, -14, 4).fill(CP.paper);
      break;
    case 'gacha':
      g.circle(0, 0, 26).stroke({ width: 5, color: CP.violet });
      g.circle(0, 0, 18).stroke({ width: 3, color: CP.cyan });
      g.star(0, 0, 4, 12, 4).fill(CP.paper);
      break;
    case 'caja':
      c.addChild(ticketIcon(48, CP.yellow));
      break;
    case 'acc':
      g.rect(-18, -24, 36, 30).fill(CP.ink).stroke({ width: 3, color: CP.paper });
      g.rect(-18, -2, 36, 7).fill(CP.cyan);
      g.ellipse(0, 8, 28, 7).fill(CP.ink).stroke({ width: 3, color: CP.paper });
      break;
    case 'plinko':
      for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) g.circle((i - r / 2) * 13, -20 + r * 12, 3).fill(CP.paper);
      g.circle(5, -30, 7).fill(CP.cyan).stroke({ width: 2, color: CP.ink });
      g.rect(-26, 26, 52, 6).fill(CP.yellow);
      break;
    case 'dice': {
      const die = (x: number, y: number, rot: number, n: number, col: number) => {
        const d = new Graphics().roundRect(-14, -14, 28, 28, 6).fill(col).stroke({ width: 3, color: CP.ink });
        const pips: Record<number, [number, number][]> = { 1: [[0, 0]], 3: [[-7, -7], [0, 0], [7, 7]], 5: [[-7, -7], [7, -7], [0, 0], [-7, 7], [7, 7]] };
        for (const [px, py] of pips[n]) d.circle(px, py, 2.6).fill(CP.ink);
        d.position.set(x, y);
        d.rotation = rot;
        c.addChild(d);
      };
      die(-10, -6, -0.2, 5, CP.paper);
      die(13, 9, 0.25, 3, CP.yellow);
      break;
    }
    case 'hilo': {
      for (const [x, r, col] of [[-9, -0.2, CP.paper], [9, 0.18, CP.green]] as [number, number, number][]) {
        const k = new Graphics().roundRect(-14, -20, 28, 40, 4).fill(col).stroke({ width: 3, color: CP.ink });
        k.position.set(x, 0);
        k.rotation = r;
        c.addChild(k);
      }
      g.poly([22, -28, 30, -16, 14, -16]).fill(CP.yellow);
      g.poly([22, 28, 30, 16, 14, 16]).fill(CP.pink);
      c.addChild(g);
      break;
    }
    case 'bingo': {
      g.circle(0, 0, 25).fill(0xff6a1a).stroke({ width: 3, color: CP.paper });
      g.circle(0, 0, 14).fill(CP.paper);
      const t = txt('13', { fontFamily: F.poster, fontSize: 16, fill: CP.ink });
      t.anchor.set(0.5);
      c.addChild(t);
      break;
    }
    case 'scratch':
      g.rect(-26, -18, 52, 36).fill(CP.paper).stroke({ width: 3, color: CP.ink });
      g.rect(-20, -12, 40, 24).fill(0xb9b2c4);
      g.moveTo(-14, 6).lineTo(-2, -6).lineTo(8, 4).lineTo(16, -4).stroke({ width: 6, color: CP.yellow, cap: 'round' });
      break;
    case 'boxes':
      g.rect(-22, -10, 44, 34).fill(CP.violet).stroke({ width: 3, color: CP.paper });
      g.rect(-26, -20, 52, 12).fill(CP.violet).stroke({ width: 3, color: CP.paper });
      g.rect(-4, -20, 8, 44).fill(CP.yellow);
      g.ellipse(-9, -25, 9, 6).stroke({ width: 3, color: CP.yellow });
      g.ellipse(9, -25, 9, 6).stroke({ width: 3, color: CP.yellow });
      break;
  }
  return c;
}
export { paw };
