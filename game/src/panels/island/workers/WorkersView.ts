/**
 * OFICIOS (KL24 · GDD 2.15 "Gatos trabajadores", 6.17). Editorial suizo: four role posters
 * (Banquero, Granjero, Constructor, Viajero) with slots, live bonus and candidates.
 * Rule (balance.cats.workers.rule): a working cat keeps living/producing in its habitat but can't sail.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { Modal, toast } from '../../../ui/modal';
import { C, F } from '../../../ui/theme';
import { Button, dotGrid, txt } from '../../../ui/widgets';
import { G } from '../../../state/game';
import { BAL } from '../../../state/econ';
import { CATS, CONTENT, catDef } from '../../../data/content';
import { crew } from '../../../state/sys/ship';
import { checkMissions } from '../../../state/sys/missions';
import {
  WORKER_NAME,
  WORKER_ROLES,
  WorkerRole,
  assignWorker,
  catBusy,
  workerBlocker,
  workerCandidates,
  workerCfg,
  workerRoleOf,
  workers,
  workersUnlocked,
} from '../../../state/sys/workforce';
import { glyph, GlyphKind } from '../../../ui/hud/glyphs';
import { sfx } from '../../../core/audio';
import { catPortrait, chip, mix, wrapText } from '../ui';
import { sparkles, onomatopoeia } from '../../../fx/juice';

const ROLE_LOOK: Record<WorkerRole, { color: number; glyph: GlyphKind; verb: string }> = {
  banker: { color: 0xffc94a, glyph: 'coins', verb: 'cuenta monedas' },
  farmer: { color: 0x7fd8ff, glyph: 'fish', verb: 'pesca de más' },
  builder: { color: 0xff9f43, glyph: 'hammer', verb: 'martillea' },
  voyager: { color: 0xa7e8d7, glyph: 'ship', verb: 'zarpa lejos' },
};

function roleDesc(role: WorkerRole) {
  const w = (CONTENT as unknown as { workers: Record<string, { desc: string }> }).workers;
  return w?.[role]?.desc ?? '';
}

/** live bonus line for a role */
function bonusLine(role: WorkerRole) {
  const cfg = workerCfg(role);
  const n = Math.min(cfg.max, workers(role).length);
  const pct = Math.round(cfg.value * 100);
  switch (role) {
    case 'banker':
      return n ? `+${pct}% oro en el hábitat de cada uno` : `+${pct}% oro en su hábitat`;
    case 'farmer':
      return `+${Math.round(n * cfg.value * 100)}% comida global`;
    case 'builder':
      return `−${Math.round(n * cfg.value * 100)}% tiempo de obra`;
    case 'voyager':
      return `+${pct}% botín por viajero en expedición`;
  }
}

export function openWorkersView() {
  const m = new Modal('Oficios', 1720, 940, { band: C.olive, subtitle: `Gatos trabajadores · Reino ${BAL.cats.workers.unlock_kl}` });
  const content = new Container();
  m.body.addChild(content);

  const render = () => {
    content.removeChildren().forEach((c) => c.destroy({ children: true }));
    const unlocked = workersUnlocked();
    // ---- intro + rule
    const intro = wrapText('Cada especie sabe hacer UNA cosa (además de dormir). Ponla a trabajar: sigue viviendo y produciendo en su hábitat, pero mientras trabaja NO sube al barco.', 1080, 19);
    content.addChild(intro);
    const rule = chip('TRABAJANDO = NO NAVEGA', C.red, C.paper, 22);
    rule.position.set(m.innerW - rule.width - 6, 2);
    content.addChild(rule);
    // ---- role posters
    const gap = 20;
    const cw = (m.innerW - gap * 3) / 4;
    const ch = m.innerH - 84;
    WORKER_ROLES.forEach((role, i) => {
      const card = roleCard(role, cw, ch, unlocked, render);
      card.position.set(i * (cw + gap), 74);
      content.addChild(card);
    });
    if (!unlocked) {
      const veil = new Graphics().rect(-8, 66, m.innerW + 16, ch + 18).fill({ color: C.paper, alpha: 0.55 });
      content.addChild(veil);
      const stamp = new Container();
      const sb = new Graphics().rect(-260, -70, 520, 140).fill(C.red).stroke({ width: 6, color: C.ink });
      sb.rect(-248, -58, 496, 116).stroke({ width: 2, color: C.paper });
      const st = txt(`REINO ${BAL.cats.workers.unlock_kl}`, { fontFamily: F.poster, fontSize: 84, fill: C.paper });
      st.anchor.set(0.5);
      st.y = -8;
      const ss = txt(`Te faltan ${BAL.cats.workers.unlock_kl - G.s.kl} niveles. Primero aprende a hacerlo a mano.`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.paper });
      ss.anchor.set(0.5);
      ss.y = 44;
      stamp.addChild(sb, st, ss);
      stamp.position.set(m.innerW / 2, 420);
      stamp.rotation = -0.06;
      content.addChild(stamp);
    }
  };

  function roleCard(role: WorkerRole, cw: number, ch: number, unlocked: boolean, rerender: () => void) {
    const look = ROLE_LOOK[role];
    const cfg = workerCfg(role);
    const card = new Container();
    const bg = new Graphics();
    bg.rect(8, 8, cw, ch).fill(C.ink);
    bg.rect(0, 0, cw, ch).fill(mix(look.color, C.paper, 0.78)).stroke({ width: 4, color: C.ink, alignment: 1 });
    bg.rect(0, 0, cw, 96).fill(look.color).stroke({ width: 4, color: C.ink, alignment: 1 });
    card.addChild(bg);
    // swiss: giant numeral of max slots + dot grid
    const big = txt(String(cfg.max), { fontFamily: F.poster, fontSize: 220, fill: C.ink });
    big.alpha = 0.07;
    big.anchor.set(1, 0);
    big.position.set(cw - 8, 70);
    card.addChild(big);
    const dg = dotGrid(3, 4, 14, 2.5, C.ink);
    dg.alpha = 0.35;
    dg.position.set(cw - 46, 112);
    card.addChild(dg);
    const gl = glyph(look.glyph, 60, C.ink, C.pink);
    gl.position.set(48, 48);
    card.addChild(gl);
    const nm = txt(WORKER_NAME[role].toUpperCase(), { fontFamily: F.poster, fontSize: 44, fill: C.ink });
    nm.position.set(92, 8);
    card.addChild(nm);
    const vb = txt(look.verb, { fontFamily: F.brush, fontSize: 18, fill: C.ink });
    vb.position.set(94, 60);
    card.addChild(vb);
    const desc = wrapText(roleDesc(role), cw - 28, 16, F.ui, C.ink, { fontWeight: '700' });
    desc.position.set(14, 108);
    card.addChild(desc);
    // live bonus
    const bonus = txt(bonusLine(role), { fontFamily: F.bebas, fontSize: 26, fill: C.green, letterSpacing: 1 });
    bonus.position.set(14, 108 + desc.height + 6);
    if (bonus.width > cw - 28) bonus.scale.set((cw - 28) / bonus.width);
    card.addChild(bonus);
    // slots
    const sy = 190;
    const slotW = Math.min(78, (cw - 28 - (cfg.max - 1) * 8) / cfg.max);
    const working = workers(role);
    for (let k = 0; k < cfg.max; k++) {
      const c = working[k];
      const x = 14 + k * (slotW + 8);
      if (c) {
        const p = catPortrait(c, slotW, { name: false });
        p.position.set(x, sy);
        card.addChild(p);
      } else {
        const g = new Graphics().rect(x, sy, slotW, slotW).fill({ color: C.paperDark, alpha: 0.5 }).stroke({ width: 3, color: C.ink, alpha: 0.4 });
        const l = txt('LIBRE', { fontFamily: F.bebas, fontSize: 18, fill: C.ink, letterSpacing: 1 });
        l.alpha = 0.45;
        l.anchor.set(0.5);
        l.position.set(x + slotW / 2, sy + slotW / 2);
        card.addChild(g, l);
      }
    }
    const cnt = txt(`${working.length}/${cfg.max} trabajando`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    cnt.position.set(14, sy + slotW + 8);
    card.addChild(cnt);
    // candidates
    const ly = sy + slotW + 40;
    const sep = new Graphics().rect(14, ly - 8, cw - 28, 3).fill(C.ink);
    card.addChild(sep);
    const cands = workerCandidates(role).sort((a, b) => (workerRoleOf(b.uid) ? 1 : 0) - (workerRoleOf(a.uid) ? 1 : 0) || b.level - a.level);
    if (!cands.length) {
      const known = CATS.filter((d) => d.worker === role && !d.secret).map((d) => (G.s.catdex[d.id] ? d.name : '???'));
      const t = wrapText(`Ningún gato tuyo sabe este oficio todavía. Lo saben: ${known.slice(0, 6).join(', ')}${known.length > 6 ? '…' : ''}`, cw - 28, 15);
      t.position.set(14, ly + 4);
      card.addChild(t);
      return card;
    }
    const rowH = 76;
    const maxRows = Math.floor((ch - ly - 12) / rowH);
    cands.slice(0, maxRows).forEach((c, k) => {
      const row = new Container();
      row.position.set(14, ly + 4 + k * rowH);
      const p = catPortrait(c, 62, { name: false });
      row.addChild(p);
      const n = txt(c.name, { fontFamily: F.poster, fontSize: 22, fill: C.ink });
      n.position.set(72, 0);
      if (n.width > cw - 230) n.scale.set((cw - 230) / n.width);
      row.addChild(n);
      const working = workerRoleOf(c.uid) === role;
      const busy = catBusy(c.uid);
      const onShip = crew().includes(c.uid);
      const tag = working ? chip('TRABAJANDO', C.green, C.paper, 15) : busy === 'expedition' ? chip('DE EXPEDICIÓN', C.megaBlue, C.paper, 15) : onShip ? chip('EN EL BARCO', C.pinkHot, C.paper, 15) : chip('DESCANSANDO', C.paperDark, C.ink, 15);
      tag.position.set(72, 32);
      row.addChild(tag);
      const blocker = working ? null : workerBlocker(c.uid);
      const b = new Button(working ? 'SOLTAR' : 'A TRABAJAR', () => {
        if (!unlocked) {
          sfx('error');
          toast(`Los oficios abren en Reino ${BAL.cats.workers.unlock_kl}`, { color: C.paper });
          return;
        }
        if (working) {
          assignWorker(c.uid, false);
          sfx('pop', 0.9);
          toast(`${c.name} vuelve a estar libre`, { sub: 'Ya puede subir al barco otra vez.', icon: 'paw' });
        } else {
          const b2 = workerBlocker(c.uid);
          if (b2) {
            sfx('error');
            toast(b2, { color: C.paper });
            return;
          }
          const wasCrew = crew().includes(c.uid);
          assignWorker(c.uid, true);
          checkMissions();
          sfx('levelup', 1.3);
          const gp = row.getGlobalPosition();
          const lp = m.panel.toLocal(gp);
          sparkles(m.panel, lp.x + 31, lp.y + 31, look.color, 12, 80);
          onomatopoeia(m.panel, lp.x + 120, lp.y, '¡A CHAMBEAR!', { size: 44, color: look.color });
          toast(`${c.name}: ${WORKER_NAME[role]}`, { sub: wasCrew ? 'Se bajó del barco: los trabajadores no navegan.' : bonusLine(role), icon: 'paw', color: look.color });
        }
        rerender();
      }, { w: 120, h: 44, size: 20, color: working ? C.paper : look.color, disabled: !unlocked || (!!blocker && !working) });
      b.position.set(cw - 28 - 124, 8);
      row.addChild(b);
      card.addChild(row);
    });
    if (cands.length > maxRows) {
      const more = txt(`+${cands.length - maxRows} más`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
      more.position.set(14, ch - 26);
      card.addChild(more);
    }
    return card;
  }

  render();
  m.open();
  gsap.from(content, { alpha: 0, duration: 0.25 });
  return m;
}

export { catDef };
