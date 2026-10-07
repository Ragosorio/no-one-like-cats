/**
 * FRAGMENTOS DEL VACÍO: where every one of the 10 fragments comes from, which ones you already have,
 * and a button that takes you straight to the next one (mission E25's IR button opens this).
 */
import { Container, Graphics } from 'pixi.js';
import { Modal, toast } from './modal';
import { Button, txt, poster } from './widgets';
import { C, F } from './theme';
import { G } from '../state/game';
import { STORY_BATTLES, voidFragments } from '../state/sys/storyBattles';

interface Source {
  name: string;
  where: string;
  got: number;
  max: number;
  /** null = not reachable yet (the text says why) */
  go: (() => void) | null;
}

const cnt = (k: string) => G.s.counters[k] ?? 0;
const missionOpen = (id: string) => G.s.missions.active.includes(id) || G.s.missions.done.includes(id);

function storyGo(id: string) {
  return () => void import('../app/storyFlow').then((f) => f.startStoryBattle(id));
}

function sources(): Source[] {
  const boss = G.s.campaign.bossesDefeated;
  const vacioPaid = Math.min(3, Math.floor(cnt('dmgpct_paid_event_vacio') / 15));
  const ruinsCleared = G.s.expansions.cleared.includes(6);
  const orquestaDone = G.s.expansions.secrets.includes(6);
  return [
    { name: 'El Arcanista', where: 'Jefe de la zona 4', got: G.has('frag_boss_4') ? 1 : 0, max: 1, go: null },
    { name: 'La Estrella Errante', where: 'Jefe de la zona 5', got: G.has('frag_boss_5') ? 1 : 0, max: 1, go: null },
    { name: 'El Primer Mar', where: 'Jefe de la zona 6', got: G.has('frag_boss_6') ? 2 : 0, max: 2, go: null },
    {
      name: 'La Grieta',
      where: boss >= 5 ? 'Batalla de historia: la Singularidad' : 'Se abre al vencer al Jefe 5',
      got: G.has('won_event_grieta') ? 1 : 0,
      max: 1,
      go: missionOpen(STORY_BATTLES.event_grieta.mission) && !G.has('won_event_grieta') ? storyGo('event_grieta') : null,
    },
    {
      name: 'Barco del Vacío',
      where: missionOpen('H19') ? '1 por cada 15% de daño antes de que se vaya (repítelo cuantas veces quieras)' : 'Llega después de La Grieta',
      got: vacioPaid,
      max: 3,
      go: missionOpen('H19') && vacioPaid < 3 ? storyGo('event_vacio') : null,
    },
    {
      name: 'La revancha del Patito',
      where: boss >= 5 ? 'Batalla de historia' : 'Se abre al vencer al Jefe 5',
      got: G.has('won_story_patito_revancha') ? 1 : 0,
      max: 1,
      go: missionOpen('H20') && !G.has('won_story_patito_revancha') ? storyGo('story_patito_revancha') : null,
    },
    {
      name: 'La Orquesta Muda',
      where: ruinsCleared ? 'Secreto de las Ruinas Arcanas: duelo 3 contra 3' : 'Compra y limpia las Ruinas Arcanas (expansión 6) en tu isla',
      got: orquestaDone ? 1 : 0,
      max: 1,
      go: ruinsCleared && !orquestaDone ? () => void import('../island/duel').then((d) => d.startIslandDuel('secret_orquesta', 6)) : null,
    },
  ];
}

export function openFragments() {
  const list = sources();
  const m = new Modal('FRAGMENTOS DEL VACÍO', 1240, 820, { band: C.ink, subtitle: `TIENES ${voidFragments()} DE 10` });
  const W2 = m.innerW;
  const intro = txt('Pedacitos de un barco que no debería existir. Cada uno sale de un lugar distinto: esto es lo que te falta y a dónde ir.', {
    fontFamily: F.ui,
    fontWeight: '700',
    fontSize: 19,
    fill: C.ink,
    wordWrap: true,
    wordWrapWidth: W2,
  });
  m.body.addChild(intro);
  const rows = new Container();
  rows.y = intro.height + 18;
  m.body.addChild(rows);
  const RH = 78;
  list.forEach((s, i) => {
    const r = new Container();
    r.y = i * (RH + 6);
    const done = s.got >= s.max;
    const bg = new Graphics().rect(0, 0, W2, RH).fill(done ? C.mint : C.paper).stroke({ width: 3, color: C.ink, alignment: 1 });
    const name = poster(s.name.toUpperCase(), 28, C.ink);
    name.position.set(16, 6);
    const where = txt(s.where, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink, wordWrap: true, wordWrapWidth: W2 - 420 });
    where.position.set(16, 44);
    const count = poster(`${s.got}/${s.max}`, 34, done ? 0x2e8a52 : C.ink);
    count.position.set(W2 - 360, 18);
    r.addChild(bg, name, where, count);
    if (!done && s.go) {
      const go = s.go;
      const b = new Button('IR', () => {
        m.close();
        go();
      }, { w: 150, h: 54, size: 30, color: C.pink });
      b.position.set(W2 - 170, 12);
      r.addChild(b);
    } else if (done) {
      const ok = poster('LISTO', 26, 0x2e8a52);
      ok.position.set(W2 - 160, 24);
      r.addChild(ok);
    }
    rows.addChild(r);
  });
  m.open();
  if (!list.some((s) => s.go && s.got < s.max) && voidFragments() < 10) toast('Por ahora no hay fragmentos a tu alcance', { sub: 'Sigue la historia: cada fuente dice cómo se abre.' });
  return m;
}
