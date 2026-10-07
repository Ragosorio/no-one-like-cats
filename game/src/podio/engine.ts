/**
 * El Podio — turn engine (pure logic, no Pixi). Both sides follow the same rules; the scene only
 * animates the events each step returns. Deterministic for a given seed.
 *
 * Turn: start-of-turn effects (DOTs, regen, summons) → stun check → the actor uses one power
 * (player: chosen or auto; rival: AI) → cooldowns tick. Ends on a K.O. (or a judges' decision at max turns).
 */
import { affinityMult } from '../data/content';
import PB from '../data/podio.json';
import { PowerDef, StatusId, powerLevels } from './powers';

export interface FighterInit {
  side: 0 | 1;
  species: string;
  name: string;
  /** label above the bar (owner / trainer) */
  owner: string;
  slug: string;
  elements: string[];
  rarity: string;
  role: string;
  level: number;
  stars: number;
  podioLvl: number;
  /** combat power (econ.catPower × accessory/rank mods) */
  power: number;
  /** max HP in engine units */
  hp: number;
  powers: PowerDef[];
  trait: string;
  mutation: string | null;
  /** extra damage multiplier (champion buff, Salón de la Fama…) */
  dmgMul?: number;
  /** ULTI meter at the start (Los Rotos del Cielo) */
  meterStart?: number;
}

export interface Fighter extends FighterInit {
  hpMax: number;
  atk: number;
  meter: number;
  levels: [number, number, number, number];
  cds: number[];
  shield: number;
  statuses: { id: StatusId; turns: number; dmg: number }[];
  summon: { turns: number; dmg: number } | null;
  firstAttack: boolean;
  firstHitTaken: boolean;
  skipFirst: boolean;
  dmgDealt: number;
  /** turns acted */
  acted: number;
  /** just lost a turn to a stun: resists the next one */
  stunImmune: boolean;
}

export type Eff = 'super' | 'weak' | 'normal';
export type DuelEv =
  | { t: 'turn'; side: 0 | 1; n: number }
  | { t: 'use'; side: 0 | 1; slot: number; power: PowerDef }
  | { t: 'hit'; side: 0 | 1; from: 0 | 1; dmg: number; crit: boolean; eff: Eff; absorbed: number; hit: number; of: number; kind: PowerDef['kind']; element: string; dodged?: boolean }
  | { t: 'status'; side: 0 | 1; id: StatusId; turns: number }
  | { t: 'resist'; side: 0 | 1; id: StatusId }
  | { t: 'dot'; side: 0 | 1; id: StatusId | 'summon'; dmg: number }
  | { t: 'heal'; side: 0 | 1; amount: number }
  | { t: 'cleanse'; side: 0 | 1 }
  | { t: 'shield'; side: 0 | 1; amount: number }
  | { t: 'summon'; side: 0 | 1; turns: number }
  | { t: 'skip'; side: 0 | 1; why: 'stun' | 'shock' | 'sleep' }
  | { t: 'meter'; side: 0 | 1; v: number }
  | { t: 'ko'; side: 0 | 1 }
  /** a signature ULTI's extra (Heroicos / Divinos): a callout over that side */
  | { t: 'note'; side: 0 | 1; text: string; color: number }
  | { t: 'decision'; winner: 0 | 1 };

const S = PB.stats;

/** tiny seeded PRNG (mulberry32) */
function prng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function effMult(attEl: string, defEls: string[]) {
  let m = 1;
  for (const d of defEls) m *= affinityMult(attEl, d);
  return Math.max(0.5, Math.min(2.25, m));
}
export function effKind(m: number): Eff {
  return m > 1.01 ? 'super' : m < 0.99 ? 'weak' : 'normal';
}

export class Duel {
  f: [Fighter, Fighter];
  turn: 0 | 1 = 0;
  n = 0;
  over = false;
  winner: 0 | 1 | null = null;
  private rnd: () => number;
  /** how smart the rival is (0 = random-ish, 1 = sharp) */
  aiSkill: number;

  constructor(a: FighterInit, b: FighterInit, seed: number, aiSkill = 0.8) {
    this.rnd = prng(seed);
    this.aiSkill = aiSkill;
    this.f = [mk(a), mk(b)];
    // the quicker style goes first (controllers and snipers), ties → the player
    const agi = (x: Fighter) => ({ controlador: 3, francotirador: 3, artillero: 2, asediador: 2, soporte: 1, invocador: 1, demoledor: 1, tanque: 0 })[x.role] ?? 1;
    this.turn = agi(this.f[1]) > agi(this.f[0]) ? 1 : 0;
  }

  /** whose powers are usable now (cooldown 0, unlocked, ult needs a full meter) */
  usable(side: 0 | 1, slot: number) {
    const f = this.f[side];
    if (f.levels[slot] <= 0) return false;
    if (f.cds[slot] > 0) return false;
    if (f.powers[slot].ult && f.meter < 100) return false;
    return true;
  }

  /** the side to act will lose this turn for sure (stun / dormilón): don't ask the player to choose */
  willSkip(side: 0 | 1) {
    const f = this.f[side];
    return f.skipFirst || this.hasStatus(f, 'stun');
  }

  /** run one full turn of the side to act. `choice` = slot for that side (auto/AI when undefined) */
  step(choice?: number): DuelEv[] {
    if (this.over) return [];
    const ev: DuelEv[] = [];
    const side = this.turn;
    const me = this.f[side];
    const foe = this.f[1 - side];
    this.n++;
    ev.push({ t: 'turn', side, n: this.n });
    // ---- start of turn: summons, DOTs, regen
    if (me.summon) {
      const dmg = this.applyDamage(foe, me.summon.dmg, ev, false);
      ev.push({ t: 'dot', side: foe.side, id: 'summon', dmg });
      if (--me.summon.turns <= 0) me.summon = null;
      if (this.checkKo(ev)) return ev;
    }
    for (const st of me.statuses) {
      if (st.id === 'burn' || st.id === 'root') {
        const dmg = this.applyDamage(me, st.dmg, ev, false);
        ev.push({ t: 'dot', side, id: st.id, dmg });
      }
      if (st.id === 'regen') {
        const amount = Math.min(me.hpMax - me.hp, st.dmg);
        me.hp += amount;
        if (amount > 0) ev.push({ t: 'heal', side, amount });
      }
    }
    if (me.mutation === 'musgoso' && me.hp > 0) {
      const amount = Math.min(me.hpMax - me.hp, me.hpMax * 0.05);
      me.hp += amount;
      if (amount > 0.01) ev.push({ t: 'heal', side, amount });
    }
    if (this.checkKo(ev)) return ev;
    // ---- can it act?
    let skip: 'stun' | 'shock' | 'sleep' | null = null;
    if (me.skipFirst) {
      me.skipFirst = false;
      skip = 'sleep';
    } else if (this.hasStatus(me, 'stun')) skip = 'stun';
    else if (this.hasStatus(me, 'shock') && this.rnd() < 0.3) skip = 'shock';
    if (skip) {
      ev.push({ t: 'skip', side, why: skip });
      if (skip === 'stun') {
        me.statuses = me.statuses.filter((s) => s.id !== 'stun');
        me.stunImmune = true;
      }
    } else {
      let slot = choice ?? this.decide(side);
      if (!this.usable(side, slot)) slot = this.decide(side);
      this.use(side, slot, ev);
      me.acted++;
    }
    // ---- end of turn: statuses age, cooldowns tick
    for (const st of me.statuses) if (st.id !== 'stun') st.turns--;
    me.statuses = me.statuses.filter((s) => s.turns > 0);
    for (let i = 0; i < 4; i++) if (me.cds[i] > 0) me.cds[i]--;
    if (this.checkKo(ev)) return ev;
    if (this.n >= S.max_turns) {
      // judges' decision: more HP% wins (ties → the player)
      const p0 = this.f[0].hp / this.f[0].hpMax;
      const p1 = this.f[1].hp / this.f[1].hpMax;
      this.over = true;
      this.winner = p1 > p0 ? 1 : 0;
      ev.push({ t: 'decision', winner: this.winner });
      return ev;
    }
    this.turn = (1 - side) as 0 | 1;
    return ev;
  }

  /** AI (also the player's auto): ult when ready, defend when low, else best expected damage */
  decide(side: 0 | 1): number {
    const me = this.f[side];
    const foe = this.f[1 - side];
    const opts = [0, 1, 2, 3].filter((i) => this.usable(side, i));
    if (!opts.length) return 0;
    if (opts.includes(3)) return 3;
    const sharp = side === 0 ? 1 : this.aiSkill;
    if (this.rnd() > sharp) return opts[Math.floor(this.rnd() * opts.length)];
    let best = opts[0];
    let bestV = -1;
    for (const i of opts) {
      const p = me.powers[i];
      let v = 0;
      if (p.kind === 'heal') v = me.hp / me.hpMax < 0.5 ? 2.2 : me.hp / me.hpMax < 0.8 ? 0.6 : 0;
      else if (p.kind === 'shield') v = me.shield > 0 ? 0 : me.hp / me.hpMax < 0.6 ? 1.9 : 0.9;
      else {
        v = p.mult * (p.hits ?? 1) * effMult(p.element, foe.elements) * this.lvlMul(me, i);
        if (p.status && !this.hasStatus(foe, p.status.id)) v += 0.35 * p.status.chance * (p.status.id === 'stun' ? 1.6 : 1);
        if (p.kind === 'summon' && !me.summon) v += 0.9;
        if (p.sureCrit) v *= 1.3;
      }
      if (v > bestV) {
        bestV = v;
        best = i;
      }
    }
    return best;
  }

  private lvlMul(f: Fighter, slot: number) {
    return 1 + S.power_level_dmg * Math.max(0, f.levels[slot] - 1);
  }
  hasStatus(f: Fighter, id: StatusId) {
    return f.statuses.some((s) => s.id === id);
  }

  private use(side: 0 | 1, slot: number, ev: DuelEv[]) {
    const me = this.f[side];
    const foe = this.f[1 - side];
    const p = me.powers[slot];
    ev.push({ t: 'use', side, slot, power: p });
    me.cds[slot] = p.cd + (p.cd > 0 && me.trait === 'perezoso' ? 1 : 0);
    if (p.ult) me.meter = 0;
    else this.meter(me, S.meter_per_action, ev);
    const lv = this.lvlMul(me, slot);
    if (p.kind === 'heal') {
      const amount = Math.min(me.hpMax - me.hp, me.hpMax * (p.amount ?? 0.25) * lv * (me.trait === 'gloton' ? 1.5 : 1));
      me.hp += amount;
      ev.push({ t: 'heal', side, amount });
      if (me.statuses.some((s) => s.id !== 'regen')) {
        me.statuses = me.statuses.filter((s) => s.id === 'regen');
        ev.push({ t: 'cleanse', side });
      }
      return;
    }
    if (p.kind === 'shield') {
      me.shield = Math.max(me.shield, me.hpMax * (p.amount ?? 0.3) * lv);
      ev.push({ t: 'shield', side, amount: me.shield });
      return;
    }
    if (p.kind === 'summon') {
      me.summon = { turns: 3, dmg: me.atk * p.mult * lv * (me.dmgMul ?? 1) };
      ev.push({ t: 'summon', side, turns: 3 });
    }
    const hits = (p.hits ?? 1) + (me.trait === 'travieso' && this.rnd() < 0.1 ? 1 : 0) + (me.mutation === 'doble_cola' && this.rnd() < 0.08 ? 1 : 0);
    const eff = effMult(p.element, foe.elements);
    for (let h = 0; h < hits && foe.hp > 0; h++) {
      // a clean dodge now and then (never against the ULTI or a sure-crit snipe; stunned cats can't dodge)
      if (!p.ult && !p.sureCrit && !this.hasStatus(foe, 'stun') && this.rnd() < S.dodge_chance) {
        ev.push({ t: 'hit', side: foe.side, from: side, dmg: 0, crit: false, eff: effKind(eff), absorbed: 0, hit: h, of: hits, kind: p.kind, element: p.element, dodged: true });
        continue;
      }
      let dmg = me.atk * p.mult * lv * eff * (me.dmgMul ?? 1);
      if (h >= (p.hits ?? 1)) dmg *= 0.5;
      dmg *= 1 - S.variance + this.rnd() * S.variance * 2;
      // traits & mutations
      if (me.trait === 'callejero') dmg *= 1.1;
      if (me.trait === 'impaciente' && me.firstAttack) dmg *= 1.1;
      if (me.trait === 'perezoso') dmg *= 1.2;
      if (me.trait === 'bravucon' && foe.hp / foe.hpMax > me.hp / me.hpMax) dmg *= 1.15;
      if (me.trait === 'leal' && me.hp / me.hpMax < 0.3) dmg *= 1.3;
      if (me.mutation === 'gigantismo' && slot === 1) dmg *= 1.1;
      if (this.hasStatus(me, 'soak')) dmg *= 0.8;
      if (this.hasStatus(foe, 'crack')) dmg *= 1.3;
      if (this.hasStatus(foe, 'curse')) {
        dmg *= 1.5;
        foe.statuses = foe.statuses.filter((s) => s.id !== 'curse');
      }
      if (foe.trait === 'miedoso' && foe.firstHitTaken) dmg *= 0.5;
      const critC = S.crit_chance + (['chismoso', 'curioso'].includes(me.trait) ? 0.05 : 0) + (me.mutation === 'estelar' ? 0.05 : 0);
      const crit = !!p.sureCrit || p.ult === true ? true : this.rnd() < critC;
      if (crit) dmg *= S.crit_mult;
      const absorbed = p.pierceShield ? 0 : Math.min(foe.shield, dmg);
      foe.shield -= absorbed;
      const dealt = this.applyDamage(foe, dmg - absorbed, ev, true);
      me.dmgDealt += dealt;
      ev.push({ t: 'hit', side: foe.side, from: side, dmg: dealt, crit, eff: effKind(eff), absorbed, hit: h, of: hits, kind: p.kind, element: p.element });
      foe.firstHitTaken = false;
      this.meter(foe, S.meter_per_hit_taken + (foe.trait === 'rencoroso' ? 10 : 0), ev);
      if (crit && me.trait === 'presumido') this.meter(me, 10, ev);
    }
    me.firstAttack = false;
    if (p.ult) this.signature(me, foe, p, lv, ev);
    // status on hit (once per power)
    if (foe.hp > 0) {
      let st = p.status;
      if (!st && slot === 0 && me.mutation === 'chamuscado') st = { id: 'burn', turns: 1, chance: 1 };
      if (!st && me.mutation === 'escarchado' && p.element === 'water' && this.rnd() < 0.15) st = { id: 'stun', turns: 1, chance: 1 };
      if (st) {
        let chance = st.chance + (st.id === 'shock' && me.mutation === 'conductividad' ? 0.15 : 0);
        if (p.ult) chance = 1;
        if (this.rnd() < chance) {
          let turns = st.turns;
          if (st.id === 'burn' && me.trait === 'piromano') turns++;
          if (st.id === 'curse' && me.mutation === 'runico') turns++;
          const dotDmg = (st.id === 'burn' ? me.atk * 0.35 * lv : st.id === 'root' ? me.atk * 0.28 * lv : 0) * (p.dotMul ?? 1);
          // stun can't chain: a cat that just lost a turn to it resists the next one
          if (st.id === 'stun' && (foe.stunImmune || this.hasStatus(foe, 'stun'))) {
            foe.stunImmune = false;
            ev.push({ t: 'resist', side: foe.side, id: st.id });
          } else {
            foe.statuses = foe.statuses.filter((s) => s.id !== st!.id);
            foe.statuses.push({ id: st.id, turns, dmg: dotDmg });
            ev.push({ t: 'status', side: foe.side, id: st.id, turns });
          }
        }
      }
    }
  }

  /** the extras of a Heroico / Divino ULTI (powers.ts SIGNATURE): halve, drain, self shield / heal */
  private signature(me: Fighter, foe: Fighter, p: PowerDef, lv: number, ev: DuelEv[]) {
    if (p.halve && foe.hp > 0) {
      // the rival loses half of what it has left: brutal, but never a K.O. on its own
      const dealt = this.applyDamage(foe, foe.hp * 0.5, ev, true);
      me.dmgDealt += dealt;
      ev.push({ t: 'note', side: foe.side, text: '¡LA MITAD!', color: 0xffd400 });
      ev.push({ t: 'hit', side: foe.side, from: me.side, dmg: dealt, crit: false, eff: 'normal', absorbed: 0, hit: 1, of: 2, kind: p.kind, element: p.element });
    }
    if (p.drain && foe.hp > 0 && foe.meter > 0) {
      foe.meter = Math.max(0, foe.meter - 100 * p.drain);
      ev.push({ t: 'note', side: foe.side, text: p.drain >= 1 ? '¡SIN BARRA!' : `−${Math.round(p.drain * 100)}% BARRA`, color: 0xff7ab8 });
      ev.push({ t: 'meter', side: foe.side, v: foe.meter });
    }
    if (p.selfShield) {
      me.shield = Math.max(me.shield, me.hpMax * p.selfShield * lv);
      ev.push({ t: 'shield', side: me.side, amount: me.shield });
    }
    if (p.selfHeal && me.hp < me.hpMax) {
      const amount = Math.min(me.hpMax - me.hp, me.hpMax * p.selfHeal * lv);
      me.hp += amount;
      ev.push({ t: 'heal', side: me.side, amount });
    }
  }

  private meter(f: Fighter, n: number, ev: DuelEv[]) {
    if (f.levels[3] <= 0) return;
    const v = Math.min(100, f.meter + n);
    if (v !== f.meter) {
      f.meter = v;
      ev.push({ t: 'meter', side: f.side, v });
    }
  }

  private applyDamage(f: Fighter, dmg: number, _ev: DuelEv[], _direct: boolean) {
    const d = Math.max(0, Math.min(f.hp, dmg));
    f.hp -= d;
    return d;
  }

  private checkKo(ev: DuelEv[]) {
    for (const f of this.f)
      if (f.hp <= 0.0001 && !this.over) {
        f.hp = 0;
        this.over = true;
        this.winner = (1 - f.side) as 0 | 1;
        ev.push({ t: 'ko', side: f.side });
        return true;
      }
    return false;
  }
}

function mk(i: FighterInit): Fighter {
  const levels = powerLevels(i.podioLvl);
  const f: Fighter = {
    ...i,
    hpMax: i.hp,
    atk: i.power,
    meter: Math.min(100, Math.max(i.trait === 'dormilon' ? 50 : 0, i.meterStart ?? 0)),
    levels,
    cds: [0, 0, 0, 0],
    shield: 0,
    statuses: [],
    summon: null,
    firstAttack: true,
    firstHitTaken: true,
    skipFirst: i.trait === 'dormilon',
    dmgDealt: 0,
    acted: 0,
    stunImmune: false,
  };
  return f;
}
