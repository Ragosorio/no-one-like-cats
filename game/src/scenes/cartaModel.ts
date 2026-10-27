/**
 * Parte III · LA CARTA PARA VARIAS CAJAS — the pure model the Carta draws (docs/part-iii/mecanicas-v2/03 §2.4).
 * No Pixi here: scenes/GaterasMapScene.ts draws what this says, tests/p3Carta.test.ts checks it with a second box built
 * from data. Nothing in it names a box: every box comes from data/gateras/regiones.json.
 *
 *   boxes   every dimension with the LOOK it is drawn with: `tv` (the Borracha's old TV, on or off), a look another
 *           agent registers (registerBoxLook: comic, tesoro, estante, poster…), `sheet` (an open box with a screen and
 *           no look of its own yet: her notebook page in the box's palette) or `blank` (a box she hasn't reached)
 *   nodes   the stages of every OPEN box, keyed `<dim>:<node>`, at their place inside that box's screen — plus its
 *           extra nodes that aren't hidden (the detour once La Ronda revealed it, the activity, encounters)
 *   routes  the route of each open box (n → n+1), inked where n is won, and a detour's dotted path from its node
 *   focus   the box the camera goes to: the one you just fought in, else the furthest open box, else the first
 */
import * as GT from '../state/sys/gateras';
import type { DimDef, DimId, GateraNodeDef, GateraStageDef, NodeState } from '../state/sys/gateras';

export type Pt = [number, number];

/** looks drawn by the scene itself */
export const BUILTIN_LOOKS = ['tv', 'sheet', 'blank'] as const;
const EXTRA = new Set<string>();
/** another look exists (its builder registers in the scene: GaterasMapScene.registerBoxLook) */
export function declareLook(id: string) {
  EXTRA.add(id);
}
export const lookKnown = (id: string) => (BUILTIN_LOOKS as readonly string[]).includes(id) || EXTRA.has(id);

/** how a box is drawn now */
export function boxLook(d: DimDef, open = GT.isOpen(d.id)): string {
  if (d.look === 'tv') return 'tv';
  if (d.look && d.look !== 'blank' && EXTRA.has(d.look)) return d.look;
  return open && d.screen ? 'sheet' : 'blank';
}

export const nodeKey = (dim: DimId, node: number | string) => `${dim}:${node}`;
/** the first box of the Carta (by order): the one Maneki sells on the first visit */
export function firstBox(): DimId {
  return [...GT.DIMS].sort((a, b) => a.order - b.order)[0].id;
}
/** the boxes whose route is drawn: open, with a screen and stages (a line's, or the nodes of a bracket/shelf/tour) */
export function openBoxes(): DimDef[] {
  return [...GT.DIMS].sort((a, b) => a.order - b.order).filter((d) => GT.isOpen(d.id) && !!d.screen && (GT.stagesOf(d.id).length > 0 || GT.nodesOf(d.id).length > 0));
}
/** the camera's box: the one you just fought in (if open), else the furthest open box, else the first */
export function focusBox(memo?: DimId | null): DimId {
  const open = openBoxes();
  if (memo && open.some((d) => d.id === memo)) return memo;
  return open.length ? open[open.length - 1].id : firstBox();
}

export function nodePos(d: DimDef, def: Pick<GateraStageDef, 'at'>): Pt {
  const s = d.screen ?? { x: d.box.x, y: d.box.y, w: d.box.w, h: d.box.h };
  return [s.x + def.at[0] * s.w, s.y + def.at[1] * s.h];
}

export interface CartaNodeModel {
  key: string;
  dim: DimId;
  /** the node id (`3`, `d1`, `a1`) */
  node: string;
  /** the stage number (null for a node that isn't a stage) */
  n: number | null;
  /** 'normal' | 'elite' | 'boss' for a stage; the node's kind otherwise ('desvio', 'actividad', 'encuentro'…) */
  kind: string;
  def: GateraStageDef | GateraNodeDef;
  pos: Pt;
  state: Exclude<NodeState, 'hidden'>;
  frontier: boolean;
}
export interface CartaRouteModel {
  dim: DimId;
  /** node ids */
  from: string;
  to: string;
  /** the main route, or a side path (a detour) */
  side: boolean;
  a: Pt;
  b: Pt;
  cleared: boolean;
  /** the curve's bend (alternating, like the Diario del Mar) */
  bend: number;
}
export interface CartaModel {
  boxes: { dim: DimId; look: string; open: boolean }[];
  nodes: CartaNodeModel[];
  routes: CartaRouteModel[];
  focus: DimId;
}

/** the whole Carta, now (pure given the save and the data) */
export function cartaModel(memo?: DimId | null): CartaModel {
  const boxes = [...GT.DIMS].sort((a, b) => a.order - b.order).map((d) => ({ dim: d.id, look: boxLook(d), open: GT.isOpen(d.id) }));
  const nodes: CartaNodeModel[] = [];
  const routes: CartaRouteModel[] = [];
  for (const d of openBoxes()) {
    // a bracket, a shelf, a tour: all nodes, edges from `requires` (a line keeps its route below, as it always was)
    if (GT.shapeOf(d.id) !== 'line') {
      shapeBox(d, nodes, routes);
      continue;
    }
    const f = GT.frontierOf(d.id);
    const st = GT.stagesOf(d.id);
    for (const def of st) nodes.push({ key: nodeKey(d.id, def.n), dim: d.id, node: String(def.n), n: def.n, kind: def.kind, def, pos: nodePos(d, def), state: GT.stageState(d.id, def.n), frontier: def.n === f });
    for (let i = 0; i < st.length - 1; i++)
      routes.push({ dim: d.id, from: String(st[i].n), to: String(st[i + 1].n), side: false, a: nodePos(d, st[i]), b: nodePos(d, st[i + 1]), cleared: GT.stageState(d.id, st[i].n) === 'cleared', bend: (i % 2 ? 1 : -1) * 14 });
    // the extra nodes that aren't hidden (a detour appears when La Ronda reveals it)
    for (const x of GT.nodesOf(d.id)) {
      if (/^\d+$/.test(x.id)) continue;
      const state = GT.nodeState(d.id, x.id);
      if (state === 'hidden') continue;
      nodes.push({ key: nodeKey(d.id, x.id), dim: d.id, node: x.id, n: null, kind: x.kind, def: x, pos: nodePos(d, x), state, frontier: false });
      const from = (x.requires ?? []).find((q) => !q.includes(':'));
      const src = from ? (/^\d+$/.test(from) ? GT.stageOf(d.id, Number(from)) : GT.nodeOf(d.id, from)) : undefined;
      if (src && x.kind === 'desvio') routes.push({ dim: d.id, from: from!, to: x.id, side: true, a: nodePos(d, src), b: nodePos(d, x), cleared: GT.nodeState(d.id, from!) === 'cleared' && GT.nodeState(d.id, x.id) === 'cleared', bend: 18 });
    }
  }
  return { boxes, nodes, routes, focus: focusBox(memo) };
}

/**
 * A box of another shape (a bracket, a shelf, a tour): its nodes that aren't hidden at their place in the screen, an
 * edge from every node each one `requires` (inked where that one is won; `mission:` / `flag:` draw nothing). The shape
 * lets you pick the order, so every open node is a frontier. Edges bow away from the screen's middle line: a bracket
 * opens out and closes in.
 */
function shapeBox(d: DimDef, nodes: CartaNodeModel[], routes: CartaRouteModel[]) {
  const shown = new Map<string, GateraNodeDef>();
  for (const x of GT.nodesOf(d.id)) {
    const state = GT.nodeState(d.id, x.id);
    if (state === 'hidden') continue;
    shown.set(x.id, x);
    nodes.push({ key: nodeKey(d.id, x.id), dim: d.id, node: x.id, n: null, kind: x.kind === 'stage' ? 'normal' : x.kind, def: x, pos: nodePos(d, x), state, frontier: state === 'open' });
  }
  const mid = d.screen!.y + d.screen!.h / 2;
  for (const x of shown.values())
    for (const from of x.requires ?? []) {
      const src = shown.get(from);
      if (!src) continue;
      const a = nodePos(d, src);
      const b = nodePos(d, x);
      const out = Math.sign((a[1] + b[1]) / 2 - mid) * Math.sign(b[0] - a[0] || 1);
      routes.push({ dim: d.id, from, to: x.id, side: false, a, b, cleared: GT.nodeCleared(d.id, from), bend: out * 14 });
    }
}
