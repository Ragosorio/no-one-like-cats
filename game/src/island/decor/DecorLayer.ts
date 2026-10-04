/**
 * Island decoration layer + PLACEMENT MODE (agente tienda).
 * Mounted by IslandScene (one line: `mountDecor({...})` — the only hook in the scene). It draws the
 * decorations of `G.s.decor.placed`, hides the natural shrubs under them, lets you tap one to
 * MOVER / GUARDAR / VENDER, and runs the "colocación" mode for the shop:
 *   · decor   → ghost follows the pointer, free tiles light up, tap = place (and pay if buying)
 *   · habitat → free plots pulse, tap one = build there (buildHabitatAt, same rules as BuildMenu)
 */
import { Container, FederatedPointerEvent, Graphics, Rectangle, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W } from '../../core/App';
import { scenes } from '../../core/scenes';
import { sfx } from '../../core/audio';
import { fmt } from '../../core/format';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { toast } from '../../ui/modal';
import { G } from '../../state/game';
import { HOME, habitatPlots, regionsUnlocked } from '../../state/sys/island';
import { buildBlocker, buildHabitatAt, habitatAt, regionLook } from '../../state/ext/island';
import {
  DECOR_SETS,
  DecorSet,
  buyDecor,
  decorBus,
  decorDef,
  decorPrice,
  decorState,
  moveDecor,
  placeDecor,
  sellDecor,
  sellPrice,
  setComplete,
  storeDecor,
} from '../../state/sys/decor';
import { nextReceipt } from '../../state/sys/shop';
import { isoToScreen, TW, TH } from '../iso';
import type { IslandCamera } from '../camera';
import type { IslandPlan, Spot } from '../layout';
import { decorArt, DecorArt } from './decorArt';
import { onomatopoeia, sparkles, floatText } from '../../fx/juice';
import { openPopMenu, closePopMenu } from '../../panels/island/PopMenu';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { elementFx } from '../../art/catArt';

export interface DecorHost {
  world: Container;
  objects: Container;
  bubbles: Container;
  wfx: Container;
  cam: IslandCamera;
  plan: IslandPlan;
  /** HUD (for the coin flight from the gold pill) */
  hud?: () => { target(k: 'gold' | 'food' | 'gems'): { x: number; y: number } | null } | null;
  /** region look (open/veil/…); defaults to state/ext/island.regionLook */
  look?: (region: string) => string;
  /** refresh island views right away (optional) */
  sync?: () => void;
}

export type PlaceReq = { kind: 'decor'; id: string; buy?: boolean; moveUid?: string } | { kind: 'habitat'; element: string };

let active: DecorLayer | null = null;

/** IslandScene hook: returns the unmount function */
export function mountDecor(host: DecorHost): () => void {
  active?.destroy();
  const layer = new DecorLayer(host);
  active = layer;
  return () => {
    layer.destroy();
    if (active === layer) active = null;
  };
}
export function islandDecorMounted() {
  return !!active && !active.dead;
}
/** start placement on the island (false if the island isn't on screen) */
export function requestPlacement(req: PlaceReq, onCancel?: () => void): boolean {
  if (!active || active.dead) return false;
  active.startPlacement(req, onCancel);
  return true;
}

const key = (x: number, y: number) => `${x},${y}`;
const HW = TW / 2;
const HH = TH / 2;
function worldToTile(x: number, y: number) {
  return { x: Math.round((y / HH + x / HW) / 2), y: Math.round((y / HH - x / HW) / 2) };
}
function diamond(g: Graphics, x: number, y: number, size = 1, inset = 0.06) {
  const a = isoToScreen(x - 0.5 + inset, y - 0.5 + inset);
  const b = isoToScreen(x + size - 0.5 - inset, y - 0.5 + inset);
  const c = isoToScreen(x + size - 0.5 - inset, y + size - 0.5 - inset);
  const d = isoToScreen(x - 0.5 + inset, y + size - 0.5 - inset);
  g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]);
}

interface View {
  uid: string;
  id: string;
  root: Container;
  art: DecorArt;
  x: number;
  y: number;
}

class DecorLayer {
  dead = false;
  private views = new Map<string, View>();
  private hidden = new Set<Container>();
  private blocked = new Set<string>();
  private t = 0;
  private resyncAcc = 0;
  private unsub: (() => void)[] = [];
  // placement
  private req: PlaceReq | null = null;
  private onCancel?: () => void;
  private overlay: Container | null = null;
  /** ground-level part of the placement UI (below buildings/cats) */
  private under: Container | null = null;
  private grid: Graphics | null = null;
  private hover: Graphics | null = null;
  private ghost: DecorArt | null = null;
  private banner: Container | null = null;
  private hoverTile: { x: number; y: number } | null = null;
  private plotMarks: { region: string; plot: number; spot: Spot; g: Container; plate: Container }[] = [];

  constructor(private host: DecorHost) {
    const p = host.plan;
    const mark = (s: Spot | undefined) => {
      if (!s) return;
      for (let y = Math.floor(s.gy); y < Math.floor(s.gy) + s.h; y++) for (let x = Math.floor(s.gx); x < Math.floor(s.gx) + s.w; x++) this.blocked.add(key(x, y));
    };
    for (const r of p.plans.values()) {
      r.habitats.forEach(mark);
      r.farms.forEach(mark);
      mark(r.secret);
      mark(r.pier);
    }
    const h = p.home;
    [h.sanctuary, h.port, h.altar, h.mesa, h.lighthouse, h.bank, h.boat].forEach(mark);
    this.validate();
    this.sync();
    this.unsub.push(decorBus.on('changed', () => this.sync()));
    Ticker.shared.add(this.tick, this);
    window.addEventListener('keydown', this.onKey);
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.endPlacement(false);
    Ticker.shared.remove(this.tick, this);
    window.removeEventListener('keydown', this.onKey);
    this.unsub.forEach((f) => f());
    for (const v of this.views.values()) {
      gsap.killTweensOf(v.root);
      gsap.killTweensOf(v.root.scale);
      if (!v.root.destroyed) v.root.destroy({ children: true });
    }
    this.views.clear();
  }

  // ================================================================ free tiles
  private look(region: string) {
    return this.host.look ? this.host.look(region) : regionLook(region);
  }
  private tileFree(x: number, y: number, ignoreUid?: string) {
    const t = this.host.plan.tiles.get(key(x, y));
    if (!t) return false;
    if (!regionsUnlocked().includes(t.region) || this.look(t.region) !== 'open') return false;
    if (this.blocked.has(key(x, y))) return false;
    for (const p of decorState().placed) {
      if (p.uid === ignoreUid) continue;
      const s = decorDef(p.id)?.size ?? 1;
      if (x >= p.x && x < p.x + s && y >= p.y && y < p.y + s) return false;
    }
    return true;
  }
  fits(x: number, y: number, size: number, ignoreUid?: string) {
    const r0 = this.host.plan.tiles.get(key(x, y))?.region;
    for (let dy = 0; dy < size; dy++)
      for (let dx = 0; dx < size; dx++) {
        if (!this.tileFree(x + dx, y + dy, ignoreUid)) return false;
        if (this.host.plan.tiles.get(key(x + dx, y + dy))?.region !== r0) return false;
      }
    return true;
  }
  /** free origins for a footprint, nearest to the home center first */
  freeTiles(size = 1) {
    const home = this.host.plan.plans.get(HOME)!;
    const out: { x: number; y: number; d: number }[] = [];
    for (const t of this.host.plan.tiles.values()) if (this.fits(t.gx, t.gy, size)) out.push({ x: t.gx, y: t.gy, d: Math.hypot(t.gx - home.center.gx, t.gy - home.center.gy) });
    return out.sort((a, b) => a.d - b.d);
  }
  /** decorations that no longer fit (layout changed / region relocked) go back to the chest */
  private validate() {
    const st = decorState();
    let moved = 0;
    for (const p of [...st.placed]) {
      const d = decorDef(p.id);
      if (!d) {
        st.placed = st.placed.filter((q) => q !== p);
        continue;
      }
      if (!this.fits(p.x, p.y, d.size, p.uid)) {
        st.placed = st.placed.filter((q) => q !== p);
        st.owned[p.id] = (st.owned[p.id] ?? 0) + 1;
        moved++;
      }
    }
    if (moved) toast(`${moved} adorno(s) volvieron a tu baúl`, { sub: 'Su casilla ya no estaba libre. Colócalos desde la Tienda.', color: C.paper });
  }

  // ================================================================ views
  private posOf(x: number, y: number, size: number) {
    return isoToScreen(x + (size - 1) / 2, y + (size - 1) / 2);
  }
  private sync() {
    if (this.dead) return;
    const placed = decorState().placed;
    const seen = new Set<string>();
    for (const p of placed) {
      seen.add(p.uid);
      let v = this.views.get(p.uid);
      const d = decorDef(p.id);
      if (!d) continue;
      if (!v || v.id !== p.id) {
        if (v) v.root.destroy({ children: true });
        const art = decorArt(p.id);
        const root = new Container();
        root.addChild(art.c);
        root.label = `shopdecor:${p.uid}`;
        root.eventMode = 'static';
        const lb = art.c.getLocalBounds();
        root.hitArea = new Rectangle(lb.x - 6, lb.y - 6, lb.width + 12, lb.height + 12);
        root.cursor = 'pointer';
        const uid = p.uid;
        root.on('pointertap', (e: FederatedPointerEvent) => {
          if (this.host.cam.wasDrag || this.req) return;
          e.stopPropagation();
          this.tapDecor(uid);
        });
        this.host.objects.addChild(root);
        v = { uid: p.uid, id: p.id, root, art, x: -999, y: -999 };
        this.views.set(p.uid, v);
      }
      if (v.x !== p.x || v.y !== p.y) {
        v.x = p.x;
        v.y = p.y;
        const s = this.posOf(p.x, p.y, d.size);
        v.root.position.set(s.x, s.y);
        v.root.zIndex = p.x + p.y + (d.size - 1) + 0.05;
      }
      v.root.visible = this.look(p.region) === 'open';
    }
    for (const [uid, v] of this.views)
      if (!seen.has(uid)) {
        gsap.killTweensOf(v.root);
        gsap.killTweensOf(v.root.scale);
        v.root.destroy({ children: true });
        this.views.delete(uid);
      }
    this.hideShrubs();
  }
  /** natural decor (trees, rocks…) standing on a decorated tile is hidden */
  private hideShrubs() {
    for (const c of this.hidden) if (!c.destroyed) c.visible = true;
    this.hidden.clear();
    const occ = new Set<string>();
    for (const p of decorState().placed) {
      const s = decorDef(p.id)?.size ?? 1;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) occ.add(key(p.x + dx, p.y + dy));
    }
    if (!occ.size) return;
    for (const c of this.host.objects.children) {
      if (!c.label?.startsWith('decor:') || !c.visible) continue;
      const t = worldToTile(c.x, c.y);
      if (occ.has(key(t.x, t.y))) {
        c.visible = false;
        this.hidden.add(c);
      }
    }
  }

  private tick(tk: Ticker) {
    if (this.dead) return;
    const dt = Math.min(0.05, tk.deltaMS / 1000);
    this.t += dt;
    for (const v of this.views.values()) if (v.root.visible) v.art.tick?.(this.t);
    this.ghost?.tick?.(this.t);
    this.resyncAcc += dt;
    if (this.resyncAcc > 1.5) {
      this.resyncAcc = 0;
      // the scene may have re-shown shrubs (terrain redraw) or a region may have opened
      this.sync();
    }
    if (this.req?.kind === 'habitat') {
      const k = 0.55 + Math.sin(this.t * 5) * 0.25;
      for (const m of this.plotMarks) m.g.alpha = k + 0.2;
    }
  }

  // ================================================================ tap menu (move / store / sell)
  private tapDecor(uid: string) {
    const p = decorState().placed.find((q) => q.uid === uid);
    const v = this.views.get(uid);
    if (!p || !v) return;
    const d = decorDef(p.id);
    sfx('pop', 1.1);
    gsap.fromTo(v.root.scale, { x: 1.08, y: 0.92 }, { x: 1, y: 1, duration: 0.4, ease: 'elastic.out(1.2,0.4)' });
    const g = v.root.toGlobal({ x: 0, y: -v.art.top * 0.8 });
    const back = sellPrice(d);
    openPopMenu(g, d.name.toUpperCase().slice(0, 16), [
      { label: 'MOVER', color: C.mint, onTap: () => this.startPlacement({ kind: 'decor', id: p.id, moveUid: uid }) },
      {
        label: 'AL BAÚL',
        color: C.paper,
        onTap: () => {
          sfx('whoosh');
          const gp = v.root.getGlobalPosition();
          storeDecor(uid);
          toast(`${d.name} guardado en tu baúl`, { sub: 'Sácalo cuando quieras desde la Tienda › Decoración.', color: C.paper });
          void gp;
        },
      },
      {
        label: `VENDER ${fmt(back)}`,
        color: C.yellow,
        onTap: () =>
          openPopMenu(g, '¿SEGURO?', [
            {
              label: `SÍ · +${fmt(back)}`,
              color: C.pinkHot,
              textColor: C.paper,
              onTap: () => {
                const lp = this.host.wfx.toLocal(g);
                const got = sellDecor({ uid });
                if (got > 0) {
                  sfx('coin', 1.2);
                  floatText(this.host.wfx, lp.x, lp.y, `+${fmt(got)}`, { color: d.cur === 'gems' ? C.pinkHot : C.yellow, size: 40 });
                  sparkles(this.host.wfx, lp.x, lp.y + 30, C.yellow, 10, 90);
                }
              },
            },
            { label: 'NO', color: C.paper, onTap: () => undefined },
          ]),
      },
    ]);
  }

  // ================================================================ placement mode
  startPlacement(req: PlaceReq, onCancel?: () => void) {
    this.endPlacement(false);
    closePopMenu();
    this.req = req;
    this.onCancel = onCancel;
    const world = this.host.world;
    const ov = new Container();
    ov.eventMode = 'static';
    ov.hitArea = new Rectangle(-30000, -30000, 60000, 60000);
    ov.cursor = 'crosshair';
    this.grid = new Graphics();
    this.hover = new Graphics();
    const under = new Container();
    under.addChild(this.grid, this.hover);
    const oi = world.children.indexOf(this.host.objects);
    world.addChildAt(under, oi >= 0 ? oi : world.children.length);
    this.under = under;
    gsap.to(this.grid, { alpha: 0.55, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    world.addChild(ov);
    this.overlay = ov;
    ov.on('globalpointermove', (e: FederatedPointerEvent) => this.onMove(e));
    ov.on('pointertap', (e: FederatedPointerEvent) => {
      if (this.host.cam.wasDrag) return;
      this.onMove(e);
      this.commit();
    });
    if (req.kind === 'decor') {
      const d = decorDef(req.id);
      this.drawFreeGrid(d.size, req.moveUid);
      this.ghost = decorArt(req.id);
      this.ghost.c.alpha = 0.82;
      this.ghost.c.visible = false;
      ov.addChild(this.ghost.c);
      if (req.moveUid) {
        const v = this.views.get(req.moveUid);
        if (v) v.root.alpha = 0.25;
      }
      // camera: keep it, but make sure we're looking at open land
      const p = req.moveUid ? decorState().placed.find((q) => q.uid === req.moveUid) : null;
      if (p) {
        const s = isoToScreen(p.x, p.y);
        this.host.cam.lookAt(s.x, s.y - 40, true, Math.max(this.host.cam.zoom, 0.8));
      }
    } else {
      this.drawFreePlots();
      const first = this.plotMarks[0];
      if (first) {
        const s = isoToScreen(first.spot.gx + 1, first.spot.gy + 1);
        this.host.cam.lookAt(s.x, s.y - 40, true, Math.max(this.host.cam.zoom, 0.75));
      }
    }
    this.buildBanner();
    sfx('whoosh');
  }

  private drawFreeGrid(size: number, ignoreUid?: string) {
    const g = this.grid!;
    g.clear();
    for (const t of this.host.plan.tiles.values()) {
      if (!this.fits(t.gx, t.gy, 1, ignoreUid)) continue;
      diamond(g, t.gx, t.gy, 1, 0.08);
    }
    g.fill({ color: C.mint, alpha: 0.35 }).stroke({ width: 3, color: 0xffffff, alpha: 1 });
    void size;
  }
  private drawFreePlots() {
    this.plotMarks = [];
    const plan = this.host.plan;
    for (const r of regionsUnlocked()) {
      if (this.look(r) !== 'open') continue;
      const rp = plan.plans.get(r);
      if (!rp) continue;
      for (let i = 0; i < habitatPlots(r); i++) {
        if (habitatAt(r, i)) continue;
        const spot = rp.habitats[i];
        if (!spot) continue;
        const c = new Container();
        const g = new Graphics();
        diamond(g, spot.gx, spot.gy, 3, 0.1);
        g.fill({ color: C.pinkHot, alpha: 0.35 }).stroke({ width: 5, color: C.pinkHot });
        diamond(g, spot.gx, spot.gy, 3, 0.1);
        g.stroke({ width: 2, color: C.ink, alpha: 0.6 });
        const ctr = isoToScreen(spot.gx + 1, spot.gy + 1);
        const plate = new Container();
        const pt = txt('¡AQUÍ!', { fontFamily: F.poster, fontSize: 34, fill: C.paper });
        pt.anchor.set(0.5);
        const pb = new Graphics().rect(-pt.width / 2 - 14 + 5, -26 + 5, pt.width + 28, 52).fill(C.ink).rect(-pt.width / 2 - 14, -26, pt.width + 28, 52).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
        plate.addChild(pb, pt);
        plate.position.set(ctr.x, ctr.y - 30);
        gsap.to(plate, { y: ctr.y - 44, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        c.addChild(g);
        this.under!.addChildAt(c, 0);
        this.overlay!.addChild(plate);
        this.plotMarks.push({ region: r, plot: i, spot, g: c, plate });
      }
    }
  }

  private onMove(e: FederatedPointerEvent) {
    if (!this.req || !this.overlay) return;
    const p = this.host.world.toLocal(e.global);
    const req = this.req;
    const size = req.kind === 'decor' ? decorDef(req.id).size : 1;
    // for 2×2 the pointer is the footprint center
    const t = worldToTile(p.x - (size - 1) * 0, p.y - (size - 1) * HH);
    this.hoverTile = t;
    const h = this.hover!;
    h.clear();
    if (req.kind === 'decor') {
      const ok = this.fits(t.x, t.y, size, req.moveUid);
      diamond(h, t.x, t.y, size, 0.04);
      h.fill({ color: ok ? C.green : C.red, alpha: 0.6 }).stroke({ width: 5, color: ok ? 0xffffff : C.ink });
      if (this.ghost) {
        const s = this.posOf(t.x, t.y, size);
        this.ghost.c.visible = true;
        this.ghost.c.position.set(s.x, s.y);
        this.ghost.c.alpha = ok ? 0.9 : 0.45;
      }
    } else {
      const m = this.plotAt(t.x, t.y);
      for (const k of this.plotMarks) k.g.scale.set(1);
      if (m) {
        diamond(h, m.spot.gx, m.spot.gy, 3, 0.04);
        h.fill({ color: 0xffffff, alpha: 0.25 }).stroke({ width: 6, color: 0xffffff });
      }
    }
  }
  private plotAt(x: number, y: number) {
    return this.plotMarks.find((m) => x >= m.spot.gx && x < m.spot.gx + 3 && y >= m.spot.gy && y < m.spot.gy + 3) ?? null;
  }

  private commit() {
    const req = this.req;
    const t = this.hoverTile;
    if (!req || !t) return;
    if (req.kind === 'habitat') {
      const m = this.plotAt(t.x, t.y);
      if (!m) {
        sfx('error');
        toast('Toca una parcela marcada', { sub: 'Las rosas parpadeantes son las libres.', color: C.paper });
        return;
      }
      const blocker = buildBlocker();
      if (blocker) {
        sfx('error');
        toast(blocker, { color: C.paper });
        return;
      }
      const hab = buildHabitatAt(req.element, m.region, m.plot);
      if (!hab) {
        sfx('error');
        return;
      }
      const ctr = isoToScreen(m.spot.gx + 1, m.spot.gy + 1);
      this.payFx(ctr.x, ctr.y - 40, 'gold');
      sfx('whoosh');
      onomatopoeia(this.host.wfx, ctr.x, ctr.y - 120, '¡A CONSTRUIR!', { size: 76, color: elementFx(req.element).accent });
      sparkles(this.host.wfx, ctr.x, ctr.y - 40, C.yellow, 14, 140);
      toast(`¡Hábitat de ${(ELEMENT_NAME[req.element] ?? req.element).toLowerCase()} en obra!`, { sub: 'Los gatos de su elemento se mudan solos al terminar.', icon: 'clock' });
      this.host.sync?.();
      this.endPlacement(true);
      return;
    }
    const d = decorDef(req.id);
    if (!this.fits(t.x, t.y, d.size, req.moveUid)) {
      sfx('error');
      if (this.ghost) gsap.fromTo(this.ghost.c, { x: this.ghost.c.x - 8 }, { x: this.ghost.c.x, duration: 0.3, ease: 'elastic.out(1,0.3)' });
      return;
    }
    const region = this.host.plan.tiles.get(key(t.x, t.y))!.region;
    const before = (Object.keys(DECOR_SETS) as DecorSet[]).filter(setComplete);
    let uid: string | null = null;
    if (req.moveUid) {
      moveDecor(req.moveUid, region, t.x, t.y);
      uid = req.moveUid;
      sfx('pop');
    } else {
      if (req.buy) {
        const price = decorPrice(d);
        const r = buyDecor(d.id);
        if (!r.ok) {
          sfx('error');
          toast(d.cur === 'gems' ? 'Te faltan Ojos de Gato' : 'Te faltan Doblones', { sub: `${d.name} cuesta ${fmt(price)}.`, color: C.paper });
          return;
        }
        const s = this.posOf(t.x, t.y, d.size);
        this.payFx(s.x, s.y - 40, d.cur === 'gems' ? 'gems' : 'gold');
        nextReceipt();
        if (r.xp > 0) floatText(this.host.wfx, s.x, s.y - d.size * 40 - 150, `+XP DE REINO`, { size: 30, color: C.mint, font: F.poster, rise: 50, dur: 1.4 });
      }
      const p = placeDecor(d.id, region, t.x, t.y);
      uid = p?.uid ?? null;
    }
    // drop-in juice
    const v = uid ? this.views.get(uid) : null;
    const s = this.posOf(t.x, t.y, d.size);
    if (v) {
      v.root.alpha = 1;
      gsap.fromTo(v.root, { y: s.y - 60 }, { y: s.y, duration: 0.32, ease: 'bounce.out' });
      gsap.fromTo(v.root.scale, { x: 0.8, y: 1.25 }, { x: 1, y: 1, duration: 0.5, ease: 'elastic.out(1.2,0.4)' });
    }
    sfx('hit', 1.4);
    onomatopoeia(this.host.wfx, s.x, s.y - 110, req.buy ? '¡KA-CHING!' : '¡TOC!', { size: req.buy ? 70 : 54, color: req.buy ? C.yellow : C.paper });
    this.dust(s.x, s.y, d.size);
    const after = (Object.keys(DECOR_SETS) as DecorSet[]).filter(setComplete);
    const fresh = after.filter((x) => !before.includes(x));
    this.endPlacement(true);
    for (const set of fresh) this.celebrateSet(set);
    if (!fresh.length && !G.s.flags.ui_shop_decor_tip) {
      G.s.flags.ui_shop_decor_tip = true;
      toast('¡Quedó precioso!', { sub: 'Toca un adorno en la isla para moverlo, guardarlo en el baúl o venderlo.', color: C.mint, icon: 'paw' });
    }
  }

  private dust(x: number, y: number, size: number) {
    const w = this.host.wfx;
    for (let i = 0; i < 10; i++) {
      const g = new Graphics().circle(0, 0, 6 + Math.random() * 8).fill({ color: 0xf2e2bd, alpha: 0.9 }).stroke({ width: 2, color: C.ink, alpha: 0.4 });
      const a = (i / 10) * Math.PI * 2;
      g.position.set(x, y);
      w.addChild(g);
      gsap.to(g, { x: x + Math.cos(a) * 60 * size, y: y + Math.sin(a) * 26 * size - 6, alpha: 0, duration: 0.55, ease: 'power2.out', onComplete: () => g.destroy() });
      gsap.to(g.scale, { x: 1.8, y: 1.8, duration: 0.55 });
    }
  }

  /** coins fly from the HUD pill into the world point (paying) */
  private payFx(wx: number, wy: number, kind: 'gold' | 'gems') {
    const hud = this.host.hud?.();
    const from = hud?.target(kind);
    const layer = scenes.fxLayer;
    const to = layer.toLocal(this.host.wfx.toGlobal({ x: wx, y: wy }));
    const start = from ? layer.toLocal(from) : { x: W - 200, y: 40 };
    for (let i = 0; i < 7; i++) {
      const ic = icon(kind === 'gold' ? 'gold' : 'gem', 30);
      ic.position.set(start.x, start.y);
      layer.addChild(ic);
      const mid = { x: (start.x + to.x) / 2 + (Math.random() - 0.5) * 200, y: Math.min(start.y, to.y) - 80 - Math.random() * 80 };
      const o = { p: 0 };
      gsap.to(o, {
        p: 1,
        duration: 0.55 + i * 0.04,
        delay: i * 0.05,
        ease: 'power2.in',
        onUpdate: () => {
          const q = o.p;
          ic.position.set((1 - q) * (1 - q) * start.x + 2 * (1 - q) * q * mid.x + q * q * to.x, (1 - q) * (1 - q) * start.y + 2 * (1 - q) * q * mid.y + q * q * to.y);
          ic.rotation = q * 6;
        },
        onComplete: () => {
          ic.destroy({ children: true });
          if (i % 2 === 0) sfx('coin', 0.9 + i * 0.08);
        },
      });
    }
  }

  private celebrateSet(set: DecorSet) {
    const info = DECOR_SETS[set];
    sfx('fanfare');
    toast(`¡SET COMPLETO! ${info.name}`, { sub: `Bono activo: ${info.bonus}. Mientras sigan todos colocados.`, color: C.mint, dur: 3.6, icon: 'star' });
    for (const p of decorState().placed) {
      if (decorDef(p.id)?.set !== set) continue;
      const v = this.views.get(p.uid);
      if (!v) continue;
      sparkles(this.host.wfx, v.root.x, v.root.y - 50, info.color === C.ink ? C.yellow : C.yellow, 12, 110);
      gsap.fromTo(v.root.scale, { x: 1.2, y: 0.85 }, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1.3,0.4)' });
    }
  }

  private buildBanner() {
    const req = this.req!;
    const c = new Container();
    let title = '';
    let sub = '';
    let priceLine: { kind: 'gold' | 'gem'; v: number } | null = null;
    if (req.kind === 'decor') {
      const d = decorDef(req.id);
      title = req.moveUid ? `MOVIENDO: ${d.name.toUpperCase()}` : `COLOCAR: ${d.name.toUpperCase()}`;
      sub = 'Toca una casilla libre · arrastra para mover la cámara · ESC cancela';
      if (req.buy) priceLine = { kind: d.cur === 'gems' ? 'gem' : 'gold', v: decorPrice(d) };
    } else {
      title = `HÁBITAT DE ${(ELEMENT_NAME[req.element] ?? req.element).toUpperCase()}`;
      sub = this.plotMarks.length ? 'Toca una parcela rosa para construir · ESC cancela' : 'No hay parcelas libres: compra una expansión';
    }
    const tt = txt(title, { fontFamily: F.poster, fontSize: 38, fill: C.ink });
    tt.position.set(26, 8);
    const st = txt(sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 17, fill: C.ink });
    st.position.set(28, 58);
    let w = Math.max(tt.width, st.width) + 56;
    const parts: Container[] = [tt, st];
    if (priceLine) {
      const pc = new Container();
      const ic = icon(priceLine.kind, 30);
      ic.position.set(15, 18);
      const pv = txt(fmt(priceLine.v), { fontFamily: F.heavy, fontSize: 26, fill: C.ink });
      pv.position.set(36, 2);
      pc.addChild(ic, pv);
      pc.position.set(w, 18);
      w += pv.width + 70;
      parts.push(pc);
    }
    const btn = new Container();
    const bf = new Container();
    const bt = txt('CANCELAR', { fontFamily: F.poster, fontSize: 28, fill: C.paper });
    bt.position.set(16, 6);
    const bb = new Graphics().rect(5, 5, bt.width + 32, 50).fill(C.ink).rect(0, 0, bt.width + 32, 50).fill(C.red).stroke({ width: 3, color: C.ink });
    bf.addChild(bb, bt);
    btn.addChild(bf);
    btn.position.set(w, 18);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerover', () => gsap.to(bf, { x: -3, y: -3, duration: 0.1 }));
    btn.on('pointerout', () => gsap.to(bf, { x: 0, y: 0, duration: 0.1 }));
    btn.on('pointertap', () => {
      sfx('click');
      this.cancel();
    });
    w += bt.width + 32 + 26;
    const h = 92;
    const bg = new Graphics().rect(8, 8, w, h).fill(C.ink).rect(0, 0, w, h).fill(C.yellow).stroke({ width: 4, color: C.ink });
    const stripe = new Graphics();
    for (let x = -20; x < w; x += 26) stripe.poly([x, h - 10, x + 13, h - 10, x + 3, h, x - 10, h]).fill(C.ink);
    stripe.poly([0, h - 10, w, h - 10, w, h, 0, h]).fill({ color: C.ink, alpha: 0.0001 });
    c.addChild(bg, stripe, ...parts, btn);
    c.position.set(W / 2 - w / 2, 118);
    c.eventMode = 'static';
    scenes.overlayLayer.addChild(c);
    gsap.from(c, { y: c.y - 60, alpha: 0, duration: 0.25, ease: 'back.out(2)' });
    this.banner = c;
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.req) this.cancel();
  };
  private cancel() {
    const cb = this.onCancel;
    this.endPlacement(false);
    cb?.();
  }

  private endPlacement(_done: boolean) {
    if (!this.req) return;
    const req = this.req;
    this.req = null;
    this.onCancel = undefined;
    if (req.kind === 'decor' && req.moveUid) {
      const v = this.views.get(req.moveUid);
      if (v) v.root.alpha = 1;
    }
    for (const m of this.plotMarks) gsap.killTweensOf(m.plate);
    if (this.grid) gsap.killTweensOf(this.grid);
    this.plotMarks = [];
    const ov = this.overlay;
    if (ov && !ov.destroyed) {
      // never destroy the node that is dispatching the current pointer event: hide now, free next frame
      ov.visible = false;
      ov.eventMode = 'none';
      setTimeout(() => !ov.destroyed && ov.destroy({ children: true }), 0);
    }
    this.overlay = null;
    const un = this.under;
    if (un && !un.destroyed) {
      un.visible = false;
      setTimeout(() => !un.destroyed && un.destroy({ children: true }), 0);
    }
    this.under = null;
    this.grid = null;
    this.hover = null;
    this.ghost = null;
    this.hoverTile = null;
    if (this.banner && !this.banner.destroyed) {
      const b = this.banner;
      gsap.to(b, { alpha: 0, y: b.y - 30, duration: 0.18, onComplete: () => !b.destroyed && b.destroy({ children: true }) });
    }
    this.banner = null;
  }
}

/** dev/test helper: free tiles of `size` closest to the home center */
export function devFreeTiles(n = 5, size = 1) {
  if (!active || active.dead) return [];
  return active.freeTiles(size).slice(0, n);
}
