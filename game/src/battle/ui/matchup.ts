/**
 * Resistances in combat (player feedback: "the pre-battle explains materials, but mid-battle I can't see
 * it"). While you pick / aim a cat, a card above its crew card shows:
 *   - its shot element × each material of the enemy hull (what's left of it), with the share of the hull:
 *     HIERRO ×1.5 SÚPER EFECTIVO · MADERA ×0.75 RESISTE
 *   - its element vs the enemy cats' elements (affinity)
 *   - what this shot does (rebota, perfora, teledirigida…) and the field rules that touch it
 * Numbers are the sim's own (MAT_RESIST, structMul, affinity), so what you read is what hits.
 */
import { Container, Graphics } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { iconText } from '../../ui/elementIcon';
import { CONTENT } from '../../data/content';
import { Battle, MAT_RESIST, affinity, clampMul, isRayo } from '../sim';
import type { CatState, ShotDef } from '../types';

const INK = 0x171317;
const MAT_NAME: Record<string, string> = Object.fromEntries((CONTENT.materials as { id: string; name: string }[]).map((m) => [m.id, m.name.split(' ')[0].toUpperCase()]));
const EL_NAME: Record<string, string> = Object.fromEntries((CONTENT.elements as { id: string; name: string }[]).map((e) => [e.id, e.name]));
const toContent = (e: string) => (e === 'electric' || e === 'wind' ? 'storm' : e === 'ice' ? 'water' : e);

/** what the shot itself does, in one short line */
export function shotRule(s: ShotDef): string {
  const bits: string[] = [];
  switch (s.trajectory) {
    case 'bounce':
      bits.push('rebota 1 vez y explota en el segundo golpe');
      break;
    case 'heavy':
      bits.push(`cae pesado y perfora ${s.pierce ?? 2} capa${(s.pierce ?? 2) === 1 ? '' : 's'}`);
      break;
    case 'beam':
      bits.push('casi recto, el viento casi no lo mueve');
      break;
    case 'gust':
      bits.push('ráfaga recta: empuja el siguiente tiro rival (CORRIENTE)');
      break;
    case 'torpedo':
      bits.push('entra al agua y corre bajo la línea de flotación');
      break;
    case 'homing':
      bits.push('runa teledirigida hacia su núcleo');
      break;
    case 'orb':
      bits.push('orbe lento y flotante');
      break;
    case 'spread':
      bits.push(`${s.projectiles ?? 3} proyectiles en abanico`);
      break;
    case 'meteor':
      bits.push('cae del cielo sobre donde apuntes');
      break;
    case 'cluster':
      bits.push('se divide en el punto más alto');
      break;
  }
  if (s.trajectory !== 'heavy' && (s.pierce ?? 0) > 0) bits.push(`perfora ${s.pierce}`);
  if (s.statuses?.length) bits.push(`deja ${s.statuses.map((x) => STATUS_ES[x.id] ?? x.id).join(' + ')}`);
  return bits.join(' · ');
}
const STATUS_ES: Record<string, string> = { burning: 'Ardiendo', wet: 'Mojado', frozen: 'Congelado', charged: 'Cargado', rooted: 'Enraizado', cursed: 'Maldito', steam: 'Vapor', voided: 'Vacío', prism: 'Prisma' };

/** field / boss rules that matter for this shot (short, honest) */
export function fieldNotes(b: Battle, s: ShotDef): string[] {
  const out: string[] = [];
  const es = b.sides[1];
  const r = b.cfg.rules;
  const B = b.boss;
  if (es.ward && es.ward.layers > 0) out.push(isRayo(s) ? '{storm} ¡Tu rayo rompe una capa del escudo arcano!' : s.element === 'earth' || s.element === 'neutral' ? 'Escudo arcano: tu golpe físico le pega x1.5 a la capa' : 'Escudo arcano: se traga el golpe entero (rayo / tierra le ganan)');
  if (es.bubble > 0 && es.bubbleKind) out.push(isRayo(s) ? '{storm} Tu rayo REVIENTA su burbuja' : 'Su burbuja anula 1 impacto por turno (rayo la revienta)');
  if (B?.id === 'gargoyle') out.push(s.element === 'earth' ? 'Piel de piedra: tu {earth} Tierra le pega completo' : 'Piel de piedra: su piedra recibe x0.5 (salvo Tierra y Estallido)');
  if (B?.submerged) out.push(s.element === 'electric' || s.trajectory === 'torpedo' ? 'Está sumergido: tu tiro SÍ lo alcanza' : B.id === 'leviathan' && (s.element === 'water' || s.trajectory === 'gust') ? 'Sumergido: no le pegas, pero enfrías el mar ({water} congela)' : 'Está sumergido: solo {storm} rayo y torpedos lo alcanzan');
  if (r?.rod?.includes(1) && !es.rodUsed && isRayo(s)) out.push('Pararrayos: se traga tu primer rayo del turno');
  if (r?.wetDeck?.includes(1) && isRayo(s)) out.push('Su cubierta está mojada: tu rayo hace CONDUCCIÓN');
  if (r?.wetAll) out.push(s.element === 'fire' ? 'Diluvio: lo mojado apaga tu fuego (VAPOR x0.8)' : isRayo(s) ? 'Diluvio: todo conduce tu rayo' : 'Diluvio: todo está mojado');
  if (b.portals) out.push('Portales: lo que entra por uno sale por el otro… y cambia de dueño');
  if (b.field.gMul !== 1) out.push(`Gravedad x${b.field.gMul} para todos${b.field.anti ? ' · invertida sobre su barco' : ''}`);
  if (b.wellList().length) out.push('Pozos de gravedad: curvan los tiros que pasan cerca');
  const wetCells = es.ship.cells().filter((c) => c.status.wet).length;
  if (wetCells && isRayo(s) && !r?.wetDeck?.includes(1)) out.push(`${wetCells} celdas suyas mojadas: rayo = CONDUCCIÓN`);
  if (wetCells && s.element === 'fire') out.push('Lo mojado apaga tu fuego (VAPOR)');
  return out;
}

export class MatchupPanel extends Container {
  private bg = new Graphics();
  private body = new Container();
  constructor() {
    super();
    this.addChild(this.bg, this.body);
    this.visible = false;
    this.alpha = 0.93;
  }

  update(b: Battle, cat: CatState | undefined, shot: ShotDef | undefined) {
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.bg.clear();
    if (!cat || !shot) {
      this.visible = false;
      return;
    }
    this.visible = true;
    const el = shot.element;
    const W = 470;
    let y = 10;
    const head = iconText(`{${toContent(el)}} ${shot.name.toUpperCase()} CONTRA SU CASCO`, { fontFamily: F.poster, fontSize: 20, fill: C.yellow }, { wrap: W - 24 });
    head.position.set(12, y);
    this.body.addChild(head);
    y += head.height + 6;
    // materials of the enemy ship still standing
    const count: Record<string, number> = {};
    let total = 0;
    for (const c of b.sides[1].ship.cells()) {
      count[c.material] = (count[c.material] ?? 0) + 1;
      total++;
    }
    const mats = Object.entries(count)
      .sort((a, z) => z[1] - a[1])
      .slice(0, 4);
    let x = 12;
    for (const [m, n] of mats) {
      const mul = clampMul((MAT_RESIST[m]?.[el] ?? 1) * (shot.structMul ?? 1));
      const chip = matChip(`${MAT_NAME[m] ?? m} ${Math.round((n / Math.max(1, total)) * 100)}%`, mul);
      if (x + chip.width > W - 8) {
        x = 12;
        y += 40;
      }
      chip.position.set(x, y);
      this.body.addChild(chip);
      x += chip.width + 8;
    }
    y += 42;
    // vs their cats
    const foes = b.sides[1].cats.filter((c) => !c.ko);
    const seen = new Map<string, number>();
    for (const f of foes) {
      const fe = f.def.elements[0];
      if (!fe || seen.has(fe)) continue;
      seen.set(fe, el === 'neutral' ? 1 : affinity(el, fe));
    }
    const affs = [...seen.entries()].filter(([, v]) => v !== 1);
    if (affs.length) {
      const t = iconText(`vs sus gatos: ${affs.map(([e, v]) => `{${toContent(e)}} x${v}${v > 1 ? ' ¡SÚPER EFECTIVO!' : ' resiste'}`).join('   ')}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.paper }, { wrap: W - 24 });
      t.position.set(12, y);
      this.body.addChild(t);
      y += t.height + 4;
    }
    const lines = [shotRule(shot), ...fieldNotes(b, shot)].filter(Boolean).slice(0, 4);
    for (const l of lines) {
      const t = iconText(l, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: 0xd9d4de }, { wrap: W - 24 });
      t.position.set(12, y);
      this.body.addChild(t);
      y += t.height + 2;
    }
    const h = y + 8;
    this.bg.rect(6, 6, W, h).fill(INK).rect(0, 0, W, h).fill({ color: 0x231a2c, alpha: 0.96 }).stroke({ width: 4, color: INK });
    this.bg.rect(0, 0, 8, h).fill(C.yellow);
  }
}

function matChip(label: string, mul: number) {
  const c = new Container();
  const good = mul > 1.01;
  const bad = mul < 0.99;
  const col = good ? 0x7ed957 : bad ? 0xff6b6b : 0xd9d4de;
  const tag = good ? 'SÚPER EFECTIVO' : bad ? 'RESISTE' : 'NORMAL';
  const t = txt(`${label}  x${+mul.toFixed(2)} ${tag}`, { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: INK });
  t.position.set(8, 6);
  const g = new Graphics().roundRect(0, 0, t.width + 16, 30, 6).fill(col).stroke({ width: 3, color: INK });
  c.addChild(g, t);
  return c;
}

/** "¡SÚPER EFECTIVO!" / "RESISTE" plate for a hit (element vs material) */
export function effLabel(mul: number, mat?: string): { text: string; color: number } | null {
  const m = mat ? MAT_NAME[mat] ?? mat.toUpperCase() : '';
  if (mul >= 1.2) return { text: `¡SÚPER EFECTIVO! x${+mul.toFixed(2)}${m ? ` (${m})` : ''}`, color: 0xffd400 };
  if (mul <= 0.8) return { text: `RESISTE x${+mul.toFixed(2)}${m ? ` (${m})` : ''}`, color: 0xb9b2a0 };
  return null;
}
export { EL_NAME };
