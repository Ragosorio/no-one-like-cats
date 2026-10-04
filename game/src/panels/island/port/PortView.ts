/**
 * PUERTO DE LAS MAREAS — Expediciones (GDD 2.19 · 6.19). NOIR OCEÁNICO con niebla.
 * Two berths (balance via expansion bonus expedition_slots), destination = discovered zone,
 * duration = balance.expeditions.durations_s, crew 1–2 cats not on the active ship.
 * Loot preview uses the same formula as the claim (workforce.expeditionLoot).
 */
import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../../ui/modal';
import { C, F } from '../../../ui/theme';
import { Button, txt } from '../../../ui/widgets';
import { icon, IconKind } from '../../../ui/icons';
import { G } from '../../../state/game';
import { ZONES, EXPANSIONS, catDef } from '../../../data/content';
import { ELEMENT_NAME } from '../../../data/elementsMeta';
import { elementIcon } from '../../../ui/elementIcon';
import { elementFx } from '../../../art/catArt';
import { glowTexture } from '../../../art/textures';
import { fmt, fmtDuration, fmtTime } from '../../../core/format';
import { sfx } from '../../../core/audio';
import { checkMissions } from '../../../state/sys/missions';
import { expansionState } from '../../../state/sys/island';
import {
  ClaimedLoot,
  Expedition,
  claimExpedition,
  expeditionBlocker,
  expeditionDurations,
  expeditionLoot,
  expeditionSlots,
  expeditionZones,
  expeditions,
  startExpedition,
  workerRoleOf,
  zoneName,
} from '../../../state/sys/workforce';
import { catPortrait, chip, mix, wrapText } from '../ui';
import { onomatopoeia, sparkles, floatText } from '../../../fx/juice';
import { islandHooks } from '../../../island/hooks';

const NOIR = 0x1b2e38;
const NOIR_L = 0x27414e;
const FOG = 0xdfe8ec;

/** planner choice survives re-renders while the panel is open (and between openings) */
const plan = { zone: 1, secs: 0, cats: [] as string[] };

function durLabel(s: number) {
  return s < 3600 ? `${Math.round(s / 60)} MIN` : `${Math.round(s / 3600)} H`;
}

export function openPortView() {
  const m = new Modal('Puerto de las Mareas', 1720, 950, { band: C.ink, color: NOIR, subtitle: 'Expediciones · el canal de materiales mientras haces otra cosa' });
  // fog bands drifting across the panel (noir oceánico)
  const fog = new Container();
  for (let i = 0; i < 5; i++) {
    const s = new Sprite(glowTexture());
    s.anchor.set(0.5);
    s.tint = FOG;
    s.alpha = 0.06 + Math.random() * 0.05;
    s.scale.set(6 + Math.random() * 4, 1.2 + Math.random());
    s.position.set(Math.random() * 1720, 200 + i * 160);
    fog.addChild(s);
    gsap.to(s, { x: s.x + 220, duration: 9 + Math.random() * 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  m.panel.addChildAt(fog, 4);
  const content = new Container();
  m.body.addChild(content);
  const lives: (() => void)[] = [];
  if (!plan.secs) plan.secs = expeditionDurations()[0];

  const render = () => {
    content.removeChildren().forEach((c) => c.destroy({ children: true }));
    lives.length = 0;
    const slots = expeditionSlots();
    if (slots <= 0) {
      lockedView();
      return;
    }
    plan.cats = plan.cats.filter((u) => !expeditionBlocker(u) && G.s.cats.some((c) => c.uid === u));
    const zones = expeditionZones();
    if (!zones.includes(plan.zone)) plan.zone = zones[zones.length - 1] ?? 1;
    // ---- berths
    const bw = 640;
    const bh = (m.innerH - 24) / 2;
    const list = expeditions();
    for (let i = 0; i < slots; i++) {
      const ex = list[i];
      const card = ex ? berthCard(ex, bw, bh) : emptyBerth(i, bw, bh);
      card.position.set(0, i * (bh + 20));
      content.addChild(card);
    }
    // ---- planner
    content.addChild(planner(bw + 34, m.innerW - bw - 34, slots > list.length));
  };

  function lockedView() {
    const e = EXPANSIONS[3];
    const st = expansionState(4);
    const g = new Graphics().rect(0, 0, m.innerW, m.innerH - 10).fill({ color: NOIR_L, alpha: 0.6 }).stroke({ width: 3, color: FOG, alpha: 0.4 });
    content.addChild(g);
    const t = txt('LOS MUELLES ESTÁN EN LA NIEBLA', { fontFamily: F.poster, fontSize: 72, fill: C.paper });
    t.anchor.set(0.5, 0);
    t.position.set(m.innerW / 2, 160);
    const sub = wrapText(
      st === 'clearing'
        ? `Los gatitos con casco están limpiando ${e.name}. En cuanto terminen, zarpan las expediciones.`
        : `Compra y limpia ${e.name} (Reino ${e.balance.kl} · ${fmt(e.balance.cost)} Doblones): 2 muelles para mandar gatos a buscar chatarra, cristales, orbes y planos mientras tú haces otra cosa.`,
      980,
      22,
      F.ui,
      FOG,
      { align: 'center' },
    );
    sub.anchor.set(0.5, 0);
    sub.position.set(m.innerW / 2, 270);
    content.addChild(t, sub);
    const b = new Button('VER EXPANSIÓN', () => {
      m.close();
      islandHooks.focusRegion?.(4);
    }, { w: 360, h: 80, size: 38, color: C.yellow });
    b.position.set(m.innerW / 2 - 180, 420);
    content.addChild(b);
  }

  function header(text: string, x: number, y: number, color: number = FOG) {
    const c = new Container();
    const t = txt(text, { fontFamily: F.bebas, fontSize: 28, fill: color, letterSpacing: 3 });
    const line = new Graphics().rect(0, t.height + 2, Math.max(80, t.width), 3).fill(color);
    c.addChild(t, line);
    c.position.set(x, y);
    content.addChild(c);
    return c;
  }

  function lootRow(loot: { scrap: number; crystals: number; element: string; blueprints: number; orbs: { species: string; n: number }[] }, size = 26, color: number = C.paper) {
    const row = new Container();
    let x = 0;
    const add = (k: IconKind, v: string, tint?: number, badge?: string) => {
      const ic = icon(k, size + 8, tint);
      ic.position.set(x + (size + 8) / 2, size / 2 + 4);
      const t = txt(v, { fontFamily: F.heavy, fontSize: size, fill: color });
      t.position.set(x + size + 14, 0);
      row.addChild(ic, t);
      x += size + 14 + t.width + 8;
      if (badge) {
        const b = elementIcon(badge, size);
        b.position.set(x + size / 2, size / 2 + 4);
        row.addChild(b);
        x += size + 4;
      }
      x += 14;
    };
    add('scrap', fmt(loot.scrap));
    add('crystal', `${loot.crystals}`, elementFx(loot.element).main, loot.element);
    for (const o of loot.orbs) add('orb', `${o.n}`, elementFx(catDef(o.species).elements[0]).main);
    const bp = loot.blueprints;
    if (bp >= 1) add('blueprint', bp % 1 > 0.05 ? `${Math.floor(bp)}+${Math.round((bp % 1) * 100)}%` : `${Math.round(bp)}`);
    else if (bp > 0) add('blueprint', `${Math.round(bp * 100)}%`);
    return row;
  }

  function orbsSplit(total: number, cats: string[]) {
    const cs = cats.map((u) => G.s.cats.find((c) => c.uid === u)).filter((c): c is NonNullable<typeof c> => !!c);
    return cs.map((c, i) => ({ species: c.species, n: Math.floor(total / cs.length) + (i < total % cs.length ? 1 : 0) }));
  }

  function berthBg(w: number, h: number, accent: number) {
    const g = new Graphics();
    g.rect(8, 8, w, h).fill(0x0d171c);
    g.rect(0, 0, w, h).fill(NOIR_L).stroke({ width: 4, color: C.ink, alignment: 1 });
    g.rect(0, 0, 12, h).fill(accent);
    // plank lines
    for (let y = 40; y < h; y += 46) g.moveTo(12, y).lineTo(w, y).stroke({ width: 1, color: 0x000000, alpha: 0.2 });
    return g;
  }

  function berthCard(ex: Expedition, w: number, h: number) {
    const c = new Container();
    const ready = ex.ready;
    c.addChild(berthBg(w, h, ready ? C.yellow : C.green));
    const t = G.timer(ex.timerId);
    const title = txt(`MUELLE · ${zoneName(ex.zone).toUpperCase()}`, { fontFamily: F.poster, fontSize: 34, fill: C.paper });
    title.position.set(30, 12);
    c.addChild(title);
    const dur = chip(fmtDuration(ex.hours * 3600 * 1000), C.paper, C.ink, 18);
    dur.position.set(w - dur.width - 16, 18);
    c.addChild(dur);
    ex.cats.forEach((u, i) => {
      const cat = G.s.cats.find((x) => x.uid === u);
      if (!cat) return;
      const p = catPortrait(cat, 104);
      p.position.set(30 + i * 124, 70);
      c.addChild(p);
      if (workerRoleOf(u) === 'voyager') {
        const v = chip('VIAJERO', C.mint, C.ink, 14);
        v.position.set(30 + i * 124, 64);
        c.addChild(v);
      }
    });
    const loot = expeditionLoot(ex.zone, ex.hours, ex.cats);
    const lx = 290;
    const lt = txt(ready ? 'TRAJERON:' : 'BOTÍN PREVISTO', { fontFamily: F.bebas, fontSize: 24, fill: FOG, letterSpacing: 2 });
    lt.position.set(lx, 72);
    c.addChild(lt);
    const lr = lootRow({ ...loot, orbs: orbsSplit(loot.orbs, ex.cats) }, 24);
    lr.position.set(lx, 108);
    if (lr.width > w - lx - 20) lr.scale.set((w - lx - 20) / lr.width);
    c.addChild(lr);
    if (ready) {
      const stamp = new Container();
      const sb = new Graphics().rect(-120, -30, 240, 60).fill(C.yellow).stroke({ width: 5, color: C.ink });
      const st = txt('¡VOLVIERON!', { fontFamily: F.comic, fontSize: 40, fill: C.ink });
      st.anchor.set(0.5);
      stamp.addChild(sb, st);
      stamp.position.set(lx + 150, 186);
      stamp.rotation = -0.08;
      c.addChild(stamp);
      gsap.fromTo(stamp.scale, { x: 1.6, y: 1.6 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2.5)' });
      const b = new Button('¡RECLAMAR!', () => claim(ex, c), { w: w - 60, h: 78, size: 40, color: C.yellow });
      b.position.set(30, h - 100);
      c.addChild(b);
    } else if (t) {
      const barBg = new Graphics();
      barBg.position.set(30, h - 112);
      const tt = txt('', { fontFamily: F.heavy, fontSize: 30, fill: C.paper });
      tt.position.set(30, h - 76);
      const ic = icon('clock', 34);
      ic.position.set(w - 260, h - 58);
      c.addChild(barBg, tt, ic);
      const purr = new Button('RONRONEAR', () => {
        const tm = G.timer(ex.timerId);
        if (!tm) return;
        const used = G.spendPurrOn(tm);
        if (used > 0) {
          sfx('purr');
          floatText(m.panel, c.x + 28 + w - 120, c.y + 108 + h - 90, `−${used.toFixed(1)} min`, { color: C.green, size: 34 });
        } else {
          sfx('error');
          toast('Sin Ronroneo en la reserva', { sub: 'Se gana jugando: batallas, misiones, especies nuevas…', color: C.paper });
        }
      }, { w: 200, h: 54, size: 24, color: C.lilac });
      purr.position.set(w - 226, h - 86);
      c.addChild(purr);
      const fill = () => {
        const tm = G.timer(ex.timerId);
        if (barBg.destroyed) return;
        if (!tm) {
          render();
          return;
        }
        const p = 1 - tm.leftMs / tm.totalMs;
        barBg.clear().rect(4, 4, w - 60, 22).fill(0x0d171c).rect(0, 0, w - 60, 22).fill(0x0f1f27).stroke({ width: 3, color: C.ink, alignment: 1 }).rect(0, 0, (w - 60) * p, 22).fill(C.green);
        tt.text = fmtTime(tm.leftMs);
      };
      fill();
      lives.push(fill);
    }
    return c;
  }

  function emptyBerth(i: number, w: number, h: number) {
    const c = new Container();
    c.addChild(berthBg(w, h, 0x5a6b74));
    const t = txt(`MUELLE ${i + 1} · LIBRE`, { fontFamily: F.poster, fontSize: 34, fill: FOG });
    t.position.set(30, 12);
    t.alpha = 0.8;
    const s = wrapText('Arma una expedición a la derecha: destino, duración y 1–2 gatos que no estén en tu barco.', w - 70, 18, F.ui, FOG);
    s.position.set(30, 70);
    // little dashed boat outline
    const g = new Graphics();
    const bx = w / 2;
    const by = h - 90;
    g.moveTo(bx - 120, by).lineTo(bx + 120, by).lineTo(bx + 90, by + 40).lineTo(bx - 90, by + 40).closePath().stroke({ width: 3, color: FOG, alpha: 0.35 });
    g.moveTo(bx, by).lineTo(bx, by - 110).stroke({ width: 3, color: FOG, alpha: 0.35 });
    g.moveTo(bx + 4, by - 104).lineTo(bx + 80, by - 20).lineTo(bx + 4, by - 20).closePath().stroke({ width: 3, color: FOG, alpha: 0.35 });
    c.addChild(g, t, s);
    return c;
  }

  function planner(x0: number, pw: number, canSend: boolean) {
    const box = new Container();
    box.position.set(x0, 0);
    const bg = new Graphics().rect(0, 0, pw, m.innerH - 10).fill({ color: 0x0d171c, alpha: 0.35 }).stroke({ width: 3, color: FOG, alpha: 0.35 });
    box.addChild(bg);
    const t = txt('NUEVA EXPEDICIÓN', { fontFamily: F.poster, fontSize: 40, fill: C.paper });
    t.position.set(22, 10);
    box.addChild(t);
    // ---- destination
    const dh = txt('DESTINO', { fontFamily: F.bebas, fontSize: 24, fill: FOG, letterSpacing: 3 });
    dh.position.set(22, 66);
    box.addChild(dh);
    const zones = expeditionZones();
    const zw = (pw - 44 - 5 * 10) / 6;
    ZONES.forEach((z, i) => {
      const open = zones.includes(z.zone);
      const sel = plan.zone === z.zone;
      const zc = new Container();
      const g = new Graphics();
      g.rect(5, 5, zw, 96).fill(0x000000);
      g.rect(0, 0, zw, 96).fill(open ? (sel ? C.yellow : NOIR_L) : 0x26343b).stroke({ width: 3, color: sel ? C.ink : FOG, alpha: open ? 1 : 0.3 });
      zc.addChild(g);
      const n = txt(open ? String(z.zone) : '?', { fontFamily: F.poster, fontSize: 46, fill: sel ? C.ink : open ? C.paper : 0x5a6b74 });
      n.position.set(10, 0);
      zc.addChild(n);
      if (open)
        z.elements.forEach((e, k) => {
          const b = elementIcon(e, 22);
          b.position.set(zw - 16 - k * 24, 20);
          zc.addChild(b);
        });
      const nm = txt(open ? z.name : 'Niebla', { fontFamily: F.ui, fontWeight: '700', fontSize: 13, fill: sel ? C.ink : FOG, wordWrap: true, wordWrapWidth: zw - 14, lineHeight: 15 });
      nm.position.set(8, 58);
      zc.addChild(nm);
      zc.position.set(22 + i * (zw + 10), 100);
      if (open) {
        zc.eventMode = 'static';
        zc.cursor = 'pointer';
        zc.on('pointertap', () => {
          sfx('click');
          plan.zone = z.zone;
          render();
        });
      } else zc.alpha = 0.7;
      box.addChild(zc);
    });
    // ---- duration
    const uh = txt('DURACIÓN (reloj verde: corre aunque cierres el juego)', { fontFamily: F.bebas, fontSize: 24, fill: FOG, letterSpacing: 2 });
    uh.position.set(22, 216);
    box.addChild(uh);
    const durs = expeditionDurations();
    const dw = (pw - 44 - (durs.length - 1) * 14) / durs.length;
    durs.forEach((s, i) => {
      const sel = plan.secs === s;
      const b = new Button(durLabel(s), () => {
        plan.secs = s;
        render();
      }, { w: dw, h: 62, size: 32, color: sel ? C.yellow : NOIR_L, textColor: sel ? C.ink : C.paper });
      b.position.set(22 + i * (dw + 14), 250);
      box.addChild(b);
      const sub = txt(s <= 900 ? 'mientras juegas' : s <= 3600 ? 'un rato' : 'cuando te vayas', { fontFamily: F.ui, fontSize: 13, fill: FOG });
      sub.anchor.set(0.5, 0);
      sub.position.set(22 + i * (dw + 14) + dw / 2, 318);
      box.addChild(sub);
    });
    // ---- crew
    const ch = txt('TRIPULACIÓN (1–2 GATOS · fuera del barco activo)', { fontFamily: F.bebas, fontSize: 24, fill: FOG, letterSpacing: 2 });
    ch.position.set(22, 346);
    box.addChild(ch);
    const ps = 84;
    const perRow = Math.floor((pw - 44 + 12) / (ps + 12));
    const cats = [...G.s.cats].sort((a, b) => (expeditionBlocker(a.uid) ? 1 : 0) - (expeditionBlocker(b.uid) ? 1 : 0) || (workerRoleOf(b.uid) === 'voyager' ? 1 : 0) - (workerRoleOf(a.uid) === 'voyager' ? 1 : 0) || b.level - a.level);
    const shown = cats.slice(0, perRow * 2);
    shown.forEach((cat, i) => {
      const blk = expeditionBlocker(cat.uid);
      const sel = plan.cats.includes(cat.uid);
      const cc = new Container();
      const p = catPortrait(cat, ps, { name: false });
      cc.addChild(p);
      if (sel) {
        const ring = new Graphics().rect(-6, -6, ps + 12, ps + 12).stroke({ width: 5, color: C.yellow });
        const ok = new Graphics().circle(ps - 4, 4, 14).fill(C.yellow).stroke({ width: 3, color: C.ink });
        ok.moveTo(ps - 11, 4).lineTo(ps - 5, 10).lineTo(ps + 4, -3).stroke({ width: 3, color: C.ink });
        cc.addChild(ring, ok);
      }
      if (blk) {
        cc.alpha = 0.45;
        const tag = txt(blk.includes('barco') ? 'EN EL BARCO' : 'FUERA', { fontFamily: F.bebas, fontSize: 15, fill: C.paper, stroke: { color: C.ink, width: 4 } });
        tag.anchor.set(0.5, 1);
        tag.position.set(ps / 2, ps - 2);
        cc.addChild(tag);
      } else if (workerRoleOf(cat.uid) === 'voyager') {
        const v = chip('+50%', C.mint, C.ink, 13);
        v.position.set(ps - v.width + 4, ps - 20);
        cc.addChild(v);
      }
      cc.position.set(22 + (i % perRow) * (ps + 12), 384 + Math.floor(i / perRow) * (ps + 14));
      cc.eventMode = 'static';
      cc.cursor = blk ? 'not-allowed' : 'pointer';
      cc.on('pointertap', () => {
        if (blk) {
          sfx('error');
          toast(`${cat.name}: ${blk}`, { color: C.paper, sub: blk.includes('barco') ? 'Bájalo del barco en el Astillero, o elige otro.' : undefined });
          return;
        }
        sfx('click');
        if (sel) plan.cats = plan.cats.filter((u) => u !== cat.uid);
        else {
          plan.cats.push(cat.uid);
          if (plan.cats.length > 2) plan.cats.shift();
        }
        render();
      });
      box.addChild(cc);
    });
    // ---- preview + send
    const py = 384 + 2 * (ps + 14) + 6;
    const sep = new Graphics().rect(22, py - 6, pw - 44, 3).fill(FOG);
    sep.alpha = 0.5;
    box.addChild(sep);
    const lh = txt('BOTÍN PREVISTO', { fontFamily: F.bebas, fontSize: 24, fill: FOG, letterSpacing: 3 });
    lh.position.set(22, py + 6);
    box.addChild(lh);
    const hours = plan.secs / 3600;
    if (plan.cats.length) {
      const loot = expeditionLoot(plan.zone, hours, plan.cats);
      const row = lootRow({ ...loot, orbs: orbsSplit(loot.orbs, plan.cats) }, 26);
      row.position.set(22, py + 42);
      if (row.width > pw - 44) row.scale.set((pw - 44) / row.width);
      box.addChild(row);
      const note = txt(`Cristales de ${ELEMENT_NAME[loot.element]?.toLowerCase()} · los orbes son de quien zarpa (entrena a un gato para sus estrellas)`, { fontFamily: F.ui, fontSize: 14, fill: FOG });
      note.position.set(22, py + 84);
      box.addChild(note);
    } else {
      const n = txt('Elige al menos un gato.', { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: FOG });
      n.position.set(22, py + 46);
      box.addChild(n);
    }
    const reason = !canSend ? 'Los dos muelles están ocupados.' : !plan.cats.length ? 'Falta tripulación.' : null;
    const send = new Button('¡ZARPAR!', () => {
      if (reason) {
        sfx('error');
        toast(reason, { color: C.paper });
        return;
      }
      const ex = startExpedition(plan.zone, hours, plan.cats);
      if (!ex) {
        sfx('error');
        return;
      }
      checkMissions();
      sfx('whoosh');
      sfx('splash', 0.8);
      const names = ex.cats.map((u) => G.s.cats.find((c) => c.uid === u)?.name).join(' y ');
      toast(`¡${names} zarparon!`, { icon: 'clock', sub: `${zoneName(ex.zone)} · vuelven en ${fmtDuration(plan.secs * 1000)} (Ronroneo lo acelera)` });
      plan.cats = [];
      render();
    }, { w: 330, h: 84, size: 46, color: reason ? C.paperDark : C.pinkHot, textColor: reason ? C.ink : C.paper, disabled: !!reason });
    send.position.set(pw - 352, m.innerH - 116);
    box.addChild(send);
    if (reason) {
      const r = txt(reason, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.yellow });
      r.anchor.set(1, 0.5);
      r.position.set(pw - 368, m.innerH - 74);
      box.addChild(r);
    }
    return box;
  }

  function claim(ex: Expedition, card: Container) {
    const loot = claimExpedition(ex.id);
    if (!loot) return;
    checkMissions();
    sfx('fanfare');
    const cx = card.x + 28 + card.width / 2;
    const cy = card.y + 108 + 150;
    onomatopoeia(m.panel, cx, cy - 40, '¡BOTÍN!', { size: 110, color: C.yellow });
    sparkles(m.panel, cx, cy, C.yellow, 22, 260);
    burstLoot(loot, cx, cy);
    toast('¡Expedición de vuelta!', { sub: summary(loot), color: C.yellow, icon: 'scrap', dur: 3 });
    gsap.delayedCall(0.7, () => {
      if (!m.closed) render();
    });
  }

  function summary(l: ClaimedLoot) {
    const parts = [`${fmt(l.scrap)} chatarra`, `${l.crystals} cristales ${ELEMENT_NAME[l.element]?.toLowerCase() ?? ''}`];
    for (const o of l.orbs) parts.push(`${o.n} orbes de ${catDef(o.species).name}`);
    if (l.blueprints) parts.push(`${l.blueprints} plano${l.blueprints > 1 ? 's' : ''}`);
    return parts.join(' · ');
  }

  /** icons spray out of the berth and fall toward the HUD materials chevron */
  function burstLoot(l: ClaimedLoot, x: number, y: number) {
    const kinds: [IconKind, number | undefined][] = [];
    for (let i = 0; i < Math.min(8, 2 + Math.round(Math.log2(l.scrap + 1))); i++) kinds.push(['scrap', undefined]);
    for (let i = 0; i < Math.min(5, l.crystals); i++) kinds.push(['crystal', elementFx(l.element).main]);
    for (const o of l.orbs) for (let i = 0; i < Math.min(4, o.n); i++) kinds.push(['orb', elementFx(catDef(o.species).elements[0]).main]);
    for (let i = 0; i < l.blueprints; i++) kinds.push(['blueprint', undefined]);
    kinds.forEach(([k, tint], i) => {
      const ic = icon(k, 40, tint);
      ic.position.set(x, y);
      m.panel.addChild(ic);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const r = 120 + Math.random() * 140;
      gsap
        .timeline({ delay: i * 0.03, onComplete: () => ic.destroy() })
        .to(ic, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, duration: 0.35, ease: 'power2.out' })
        .to(ic, { x: m.w - 120, y: -120, alpha: 0.2, duration: 0.55, ease: 'power2.in' })
        .call(() => sfx('coin', 1 + i * 0.05));
    });
  }

  render();
  let acc = 0;
  const tick = (tk: Ticker) => {
    acc += tk.deltaMS;
    if (acc < 250 || m.closed) return;
    acc = 0;
    lives.forEach((f) => f());
  };
  Ticker.shared.add(tick);
  m.onClose = () => {
    Ticker.shared.remove(tick);
    gsap.killTweensOf(fog.children);
  };
  m.open();
  return m;
}

export { mix };
