/** Expansion card: aspirational price, what it opens, bonus, buy (needs Reino + free builder). */
import { Container, Graphics } from 'pixi.js';
import { Modal, toast } from '../../ui/modal';
import { C, F } from '../../ui/theme';
import { Button, txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { G } from '../../state/game';
import { EXPANSIONS } from '../../data/content';
import { builders, buildersBusy, buyExpansion, expansionState } from '../../state/sys/island';
import { checkMissions } from '../../state/sys/missions';
import { secretInfo } from '../../state/sys/secrets';
import { fmt, fmtDuration } from '../../core/format';
import { sfx } from '../../core/audio';
import { BIOMES } from '../../island/terrain';
import { decorArt } from '../../island/decorArt';
import { heading, wrapText, chip } from './ui';
import type { DecorKind } from '../../island/layout';

const BONUS_TXT: Record<string, (v: number) => string> = {
  food: (v) => `+${Math.round(v * 100)}% pesca`,
  gold: (v) => `+${Math.round(v * 100)}% oro de hábitats`,
  builders: (v) => `+${v} constructor`,
  resonance_slots: (v) => `+${v} ranura de Resonancia`,
  expedition_slots: (v) => `+${v} expediciones`,
  yard_queues: (v) => `+${v} dique del astillero`,
  offline_bank_h: (v) => `+${v} h de banco offline`,
  prisma_per_h: (v) => `${v} Orbes Prisma/h`,
  catdex_bonus: (v) => `+${Math.round(v * 100)}% oro por especie`,
};
const BIOME_NAME: Record<string, string> = {
  forest: 'Bosque',
  cliff: 'Acantilado',
  volcano: 'Volcán',
  ghost: 'Puerto fantasma',
  ice: 'Glaciar',
  ruins: 'Ruinas',
  reef: 'Arrecife',
  cosmic: 'Cósmico',
};
const BIOME_DECOR: Record<string, DecorKind[]> = {
  forest: ['pine', 'mushroom', 'tree'],
  cliff: ['boulder', 'column', 'rock'],
  volcano: ['lava', 'crystal', 'boulder'],
  ghost: ['lamp', 'tree', 'rock'],
  ice: ['snow', 'crystal', 'pine'],
  ruins: ['column', 'crystal', 'column'],
  reef: ['coral', 'star', 'coral'],
  cosmic: ['star', 'crystal', 'column'],
};

export function openExpansionPanel(n: number, onBought?: () => void) {
  const e = EXPANSIONS[n - 1];
  if (!e) return;
  const st = expansionState(n);
  const m = new Modal(e.name, 1260, 720, { subtitle: `EXPANSIÓN ${n} · ${(BIOME_NAME[e.biome] ?? e.biome).toUpperCase()}`, band: C.ink });
  // ---- left: biome swatch postcard
  const b = BIOMES[e.biome] ?? BIOMES.home;
  const card = new Container();
  const g = new Graphics();
  g.rect(10, 10, 440, 560).fill(C.ink);
  g.rect(0, 0, 440, 560).fill(C.paper).stroke({ width: 4, color: C.ink, alignment: 1 });
  g.rect(20, 20, 400, 360).fill(0x4b93c4);
  // mini island diamond
  g.poly([220, 120, 380, 200, 220, 280, 60, 200]).fill(b.top).stroke({ width: 4, color: C.ink });
  g.poly([60, 200, 220, 280, 220, 320, 60, 240]).fill(b.side).stroke({ width: 4, color: C.ink });
  g.poly([220, 280, 380, 200, 380, 240, 220, 320]).fill(b.sideDark).stroke({ width: 4, color: C.ink });
  card.addChild(g);
  (BIOME_DECOR[e.biome] ?? ['tree']).forEach((k, i) => {
    const d = decorArt(k, 0.3 + i * 0.25);
    d.position.set(150 + i * 70, 210 + (i % 2) * 24);
    d.scale.set(1.3);
    card.addChild(d);
  });
  const vis = wrapText(e.visual, 400, 17, F.ui, C.ink, { fontStyle: 'italic' });
  vis.position.set(20, 396);
  card.addChild(vis);
  if (st === 'locked') {
    const veil = new Graphics().rect(20, 20, 400, 360).fill({ color: C.paper, alpha: 0.55 });
    for (let k = -20; k < 40; k++) veil.moveTo(20 + k * 22, 20).lineTo(20 + k * 22 - 200, 380).stroke({ width: 2, color: C.ink, alpha: 0.12 });
    const mask = new Graphics().rect(20, 20, 400, 360).fill(0xffffff);
    veil.mask = mask;
    card.addChild(mask, veil);
  }
  m.body.addChild(card);
  // ---- right: info
  const x0 = 490;
  let y = 0;
  const price = new Container();
  const pi = icon('gold', 60);
  pi.position.set(30, 34);
  const pv = txt(fmt(e.balance.cost), { fontFamily: F.poster, fontSize: 72, fill: G.s.gold >= e.balance.cost ? C.ink : C.red });
  pv.position.set(70, -12);
  price.addChild(pi, pv);
  price.position.set(x0, y);
  m.body.addChild(price);
  const chips = [chip(`REINO ${e.balance.kl}`, G.s.kl >= e.balance.kl ? C.mint : C.red, G.s.kl >= e.balance.kl ? C.ink : C.paper, 22), chip(`LIMPIEZA ${fmtDuration(e.balance.clear_s * 1000)}`, C.green, C.paper, 22)];
  let cx = x0;
  for (const c of chips) {
    c.position.set(cx, y + 92);
    m.body.addChild(c);
    cx += c.width + 12;
  }
  y += 150;
  const h1 = heading('Qué abre', 24);
  h1.position.set(x0, y);
  const opens = wrapText(e.opensDesign, m.innerW - x0, 18);
  opens.position.set(x0, y + 38);
  m.body.addChild(h1, opens);
  y += 50 + opens.height + 14;
  const h2 = heading('Terreno', 24);
  h2.position.set(x0, y);
  const bonus = Object.entries(e.balance.bonus)
    .map(([k, v]) => BONUS_TXT[k]?.(v) ?? `${k} ${v}`)
    .join(' · ');
  const plots = txt(`${e.balance.hab_plots} parcelas de hábitat · ${e.balance.farm_plots} de pesca${bonus ? ` · ${bonus}` : ''}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 18, fill: C.ink, wordWrap: true, wordWrapWidth: m.innerW - x0 });
  plots.position.set(x0, y + 38);
  m.body.addChild(h2, plots);
  y += 50 + plots.height + 14;
  const h3 = heading('Secreto', 24);
  h3.position.set(x0, y);
  const si = secretInfo(n);
  const secText = st !== 'cleared' ? '??? — algo se esconde debajo de las rocas.' : si.done ? `${e.secret.name} · ¡ENCONTRADO!` : si.sealed ? `${e.secret.name} · ${si.sealedReason}` : `${e.secret.name} · ${si.hint}`;
  const sec = wrapText(secText, m.innerW - x0, 18, F.ui, si.done ? C.green : C.ink, { fontStyle: 'italic', fontWeight: si.done ? '700' : '400' });
  sec.position.set(x0, y + 38);
  m.body.addChild(h3, sec);
  // clearing: the green clock can be sped up with Ronroneo (never paid)
  const tmr = st === 'clearing' ? G.timerFor('expansion', String(n)) : null;
  if (tmr) {
    const purr = new Button('RONRONEAR', () => {
      const used = G.spendPurrOn(tmr);
      if (used > 0) {
        sfx('purr');
        toast(`−${used.toFixed(1)} min de limpieza`, { icon: 'clock', color: C.lilac });
        m.close();
      } else {
        sfx('error');
        toast('Sin Ronroneo en la reserva', { sub: 'Se gana jugando: batallas, misiones, especies nuevas…', color: C.paper });
      }
    }, { w: 240, h: 60, size: 28, color: C.lilac });
    purr.position.set(x0, m.innerH - 180);
    const left = txt(`Faltan ${fmtDuration(tmr.leftMs)}`, { fontFamily: F.heavy, fontSize: 24, fill: C.green });
    left.position.set(x0 + 260, m.innerH - 166);
    m.body.addChild(purr, left);
  }
  // ---- action
  let reason: string | null = null;
  if (st === 'cleared') reason = '¡Ya es tuya!';
  else if (st === 'clearing') reason = 'Limpiando… (reloj verde)';
  else if (st === 'locked') reason = `Necesitas Reino ${e.balance.kl}. Lo imposible de hoy es el "de una" de mañana.`;
  else if (buildersBusy() >= builders()) reason = 'Tus constructores están ocupados.';
  else if (G.s.gold < e.balance.cost) reason = `Te faltan ${fmt(e.balance.cost - G.s.gold)} Doblones.`;
  const btn = new Button(st === 'available' ? '¡COMPRAR!' : st === 'locked' ? 'BLOQUEADA' : st === 'clearing' ? 'LIMPIANDO' : 'LISTA', () => {
    if (expansionState(n) !== 'available' || !buyExpansion(n)) {
      sfx('error');
      if (reason) toast(reason, { color: C.paper });
      return;
    }
    checkMissions();
    sfx('coin', 0.6);
    sfx('whoosh');
    toast(`¡A limpiar ${e.name}!`, { icon: 'clock', sub: `Gatitos con casco trabajando · ${fmtDuration(e.balance.clear_s * 1000)}` });
    m.close();
    onBought?.();
  }, { w: 340, h: 84, size: 44, color: st === 'available' && !reason ? C.pinkHot : C.paperDark, textColor: st === 'available' && !reason ? C.paper : C.ink, disabled: !!reason });
  btn.position.set(m.innerW - 350, m.innerH - 100);
  m.body.addChild(btn);
  if (reason) {
    const r = wrapText(reason, m.innerW - x0 - 380, 17, F.ui, st === 'locked' || st === 'available' ? C.red : C.green, { fontWeight: '700' });
    r.position.set(x0, m.innerH - 88);
    m.body.addChild(r);
  }
  m.open();
  return m;
}
