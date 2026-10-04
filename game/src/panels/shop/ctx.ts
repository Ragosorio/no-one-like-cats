/** Tienda: shared types + tab table (kept apart from Shop.ts so tabs never import it back). */
import { Container, Graphics } from 'pixi.js';
import type { Modal } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';

export type ShopTab = 'habitats' | 'edificios' | 'decoracion' | 'orbes' | 'gatos' | 'cofres';
export type ShopPage = ShopTab | 'home';

export interface ShopCtx {
  m: Modal;
  /** content root (cleared on every tab switch) */
  root: Container;
  w: number;
  h: number;
  page: ShopPage;
  /** optional preselection (decor id, element…) */
  focus?: string;
  go(page: ShopPage, focus?: string): void;
  /** re-render the current page (after a purchase) keeping the focus */
  refresh(focus?: string): void;
  /** global position of the wallet icon (coin flights) */
  walletAt(cur: 'gold' | 'gems'): { x: number; y: number };
  close(): void;
}

export const TABS: { id: ShopPage; label: string; color: number; fg: number }[] = [
  { id: 'home', label: 'VITRINA', color: C.paper, fg: C.ink },
  { id: 'habitats', label: 'HÁBITATS', color: C.mint, fg: C.ink },
  { id: 'edificios', label: 'EDIFICIOS', color: C.yellow, fg: C.ink },
  { id: 'decoracion', label: 'DECORACIÓN', color: C.pink, fg: C.ink },
  { id: 'orbes', label: 'ORBES', color: C.lilac, fg: C.ink },
  { id: 'gatos', label: 'GATOS', color: C.orange, fg: C.ink },
  { id: 'cofres', label: 'COFRES', color: C.red, fg: C.paper },
];
export const tabColor = (p: ShopPage) => TABS.find((x) => x.id === p)?.color ?? C.paper;

/** poster section header with a thick rule */
export function sectionHead(text: string, w: number, color: number = C.ink): Container {
  const c = new Container();
  const tx = txt(text, { fontFamily: F.bebas, fontSize: 30, fill: color, letterSpacing: 3 });
  const g = new Graphics().rect(0, tx.height + 2, w, 4).fill(color);
  c.addChild(tx, g);
  return c;
}
