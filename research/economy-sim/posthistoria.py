#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NO ONE LIKE CATS - simulador del POST-HISTORIA (hábitats libres, 2026-10).

Pregunta: un jugador que acaba de terminar el Capítulo 1 (~4.7 h, ~9 K oro/s con las reglas viejas),
¿cuánto juego activo necesita para cada expansión que le falta?

Lee los números REALES del juego (game/src/data/balance.json y content.json), con las reglas nuevas:
  - hábitats libres: precio = cost_base * growth^(min(N,late)-1) * growth_late^max(0,N-late) * element_copy^(mismos)
  - tiers con capacidad/multiplicador/costo/cristales de balance.habitats.tiers
  - expansiones de content.json (costo, Reino, bono de oro, constructores)
Con --legacy usa las reglas viejas (parcelas fijas, tiers viejos) para comparar.

Modelo (deliberadamente simple, documentado en docs/ECONOMIA-POSTHISTORIA.md):
  - punto de partida "fin de historia": Reino 32, 22 gatos de 6 elementos (rareza mixta) en nivel 33,
    1.5 estrellas de promedio, 12 hábitats tier 4, expansiones 1-5 limpias, 20 M de oro.
  - los gatos suben solos hasta el tope (Reino+5): +1 nivel cada 90 s (la comida sobra en post-historia).
  - Reino: XP de obras/mejoras/expansiones/eclosiones + 1 misión cada 4 min + subir gatos (fórmula del juego).
  - cristales: 1 por elemento cada 2 min de juego activo (peleas de granjeo, ~5 por victoria en zona 6).
  - la Resonancia sigue: una eclosión cada 5 min (da XP); 1 de cada 3 es un gato nuevo (el resto, orbes).
  - Momentum medio 1.2 (juego activo) y las batallas suman +20% al ingreso pasivo.
  - el jugador compra lo de mejor retorno (costo / oro extra por segundo) si se paga en < 25 min;
    si no, ahorra para la siguiente expansión.
Uso: python3 posthistoria.py [--legacy] [--hours 6]
"""
import argparse
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(HERE, '..', '..', 'game', 'src', 'data')
B = json.load(open(os.path.join(GAME, 'balance.json')))
C = json.load(open(os.path.join(GAME, 'content.json')))
EXP = C['expansions']

SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']


def fmt(n):
    if n < 10000:
        return f'{n:,.0f}'
    e = int(math.log10(n) // 3)
    v = n / 1000 ** e
    return (f'{v:.2f}' if v < 10 else f'{v:.1f}' if v < 100 else f'{v:.0f}') + SUF[min(e, len(SUF) - 1)]


def hm(s):
    return f'{int(s // 3600)}h{int(s % 3600 // 60):02d}'


ELS = ['fire', 'water', 'nature', 'earth', 'storm', 'magic']
RAR = ['common', 'rare', 'rare', 'epic', 'common', 'rare', 'epic', 'legendary', 'common', 'rare', 'rare']


class Sim:
    def __init__(self, legacy=False):
        self.legacy = legacy
        H = B['habitats']
        if legacy:
            self.tiers = [dict(t, capacity=l['capacity'], cost=l['cost'], crystals=l['crystals']) for t, l in zip(json.load(open(os.path.join(HERE, 'balance.json')))['habitats']['tiers'], H['legacy']['tiers'])]
        else:
            self.tiers = H['tiers']
        self.t = 0.0
        self.gold = 20e6
        self.kl = 32
        self.klxp = 0.0
        self.cats = [{'r': RAR[i % len(RAR)], 'el': ELS[i % 6], 'lvl': 33, 'stars': 1 + (i % 2)} for i in range(22)]
        self.habs = [{'el': ELS[i % 6], 'tier': 4, 'busy': 0.0} for i in range(12)]
        self.cleared = [1, 2, 3, 4, 5]
        self.crystals = {e: 6 for e in ELS}
        self.log = []
        self.lvl_acc = 0.0
        self.mis_acc = 0.0
        self.cry_acc = 0.0
        self.res_acc = 0.0
        self.hatches = 0
        self.plots = sum(LEGACY_PLOTS.get(e['id'], 0) for e in EXP if e['n'] in self.cleared) + 3

    # ------------------------------------------------------------------ economy
    def tier(self, t):
        return self.tiers[max(0, min(len(self.tiers) - 1, t - 1))]

    def cat_gold(self, c):
        return B['rarities']['gold_base_per_s'][c['r']] * B['cats']['gold_per_level'] ** (c['lvl'] - 1) * B['cats']['stars']['mult'][c['stars'] - 1]

    def bonus(self, k):
        return sum(EXP[n - 1]['balance']['bonus'].get(k, 0) for n in self.cleared)

    def island_mult(self):
        species = len(self.cats)
        return (1 + (0.02 + self.bonus('catdex_bonus')) * species) * (1 + self.bonus('gold')) * (1 + 0.5 * 0.2)

    def housing(self):
        """best cats into each habitat of their element (capacity)"""
        out = []
        for h in self.habs:
            out.append([])
        cats = sorted(self.cats, key=self.cat_gold, reverse=True)
        for c in cats:
            best = None
            for i, h in enumerate(self.habs):
                if h['el'] != c['el'] or (h['busy'] > 0 and h['tier'] == 0):
                    continue
                if len(out[i]) >= self.tier(h['tier'])['capacity']:
                    continue
                if best is None or self.tier(h['tier'])['mult'] > self.tier(self.habs[best]['tier'])['mult']:
                    best = i
            if best is not None:
                out[best].append(c)
        return out

    def rate(self, habs=None):
        habs = habs or self.habs
        save = self.habs
        self.habs = habs
        hs = self.housing()
        g = sum(sum(self.cat_gold(c) for c in hs[i]) * self.tier(h['tier'])['mult'] for i, h in enumerate(habs))
        self.habs = save
        return g * self.island_mult() * 1.2  # +20% from farm battles while active

    def builders(self):
        return 1 + self.bonus('builders')

    def busy(self):
        return sum(1 for h in self.habs if h['busy'] > 0)

    def hab_price(self, el):
        P = B['habitats']['placement']
        if self.legacy:
            n = len(self.habs)
            return 60 * 4.2 ** (n - 1)
        n = max(1, len(self.habs))
        same = sum(1 for h in self.habs if h['el'] == el)
        return P['cost_base'] * P['growth'] ** (min(n, P['late_from']) - 1) * P['growth_late'] ** max(0, n - P['late_from']) * P['element_copy'] ** same

    # ------------------------------------------------------------------ xp
    def xp(self, pct):
        K = B['kingdom']
        gain = pct * (1 + K['xp_early_boost'] * max(0, 1 - (self.kl - 1) / K['xp_early_levels'])) / (1 + K['xp_drag_per_level'] * (self.kl - 1))
        while gain > 0 and self.kl < K['level_cap']:
            room = 1 - self.klxp
            if gain >= room:
                gain -= room
                self.klxp = 0
                self.kl += 1
            else:
                self.klxp += gain
                gain = 0

    # ------------------------------------------------------------------ actions
    def options(self):
        base = self.rate()
        opts = []
        if self.busy() < self.builders():
            # new habitat for the element with the most homeless gold
            hs = self.housing()
            housed = {id(c) for l in hs for c in l}
            for el in ELS:
                homeless = [c for c in self.cats if c['el'] == el and id(c) not in housed]
                if not homeless:
                    continue
                if self.legacy and len(self.habs) >= self.plots:
                    continue
                cost = self.hab_price(el)
                gain = self.rate(self.habs + [{'el': el, 'tier': 1, 'busy': 0}]) - base
                if gain > 0:
                    opts.append((cost / gain, cost, 'hab', el))
            for i, h in enumerate(self.habs):
                if h['busy'] > 0 or h['tier'] >= len(self.tiers):
                    continue
                nx = self.tiers[h['tier']]
                if self.kl < nx['kl'] or self.crystals[h['el']] < nx['crystals']:
                    continue
                trial = [dict(x) for x in self.habs]
                trial[i]['tier'] += 1
                gain = self.rate(trial) - base
                if gain > 0:
                    opts.append((nx['cost'] / gain, nx['cost'], 'up', i))
        return sorted(opts)

    def next_exp(self):
        for e in EXP:
            if e['n'] not in self.cleared:
                return e
        return None

    def step(self, dt=10):
        self.t += dt
        r = self.rate()
        self.gold += r * dt
        # timers
        for h in self.habs:
            if h['busy'] > 0:
                h['busy'] -= dt
                if h['busy'] <= 0:
                    h['busy'] = 0
                    self.xp(B['kingdom']['xp_rewards_pct_of_bar']['build_done'] * (1 + h['tier'] * 0.2))
        # cats level to the cap (food is plentiful post-story)
        self.lvl_acc += dt
        if self.lvl_acc >= 90:
            self.lvl_acc = 0
            cap = min(B['kingdom']['level_cap_cats'], self.kl + 5)
            for c in self.cats:
                if c['lvl'] < cap:
                    c['lvl'] += 1
                    self.xp(B['kingdom']['xp_rewards_pct_of_bar']['cat_level_up'])
        self.mis_acc += dt
        if self.mis_acc >= 240:
            self.mis_acc = 0
            self.xp(B['kingdom']['xp_rewards_pct_of_bar']['mission'])
            self.gold += r * 60  # mission reward = 60 s of income
        self.cry_acc += dt
        if self.cry_acc >= 120:
            self.cry_acc = 0
            for e in ELS:
                self.crystals[e] += 1
        # Resonance keeps hatching cats (a new one every 5 min, mixed rarity, starts at half the cap)
        self.res_acc += dt
        if self.res_acc >= 300:
            self.res_acc = 0
            self.hatches += 1
            i = len(self.cats)
            self.xp(B['kingdom']['xp_rewards_pct_of_bar']['hatch'][RAR[(i * 7) % len(RAR)]])
            if self.hatches % 3 == 0:  # most hatches post-story are duplicates (orbs); 1 in 3 is a new cat
                self.cats.append({'r': RAR[(i * 7) % len(RAR)], 'el': ELS[(i * 5) % 6], 'lvl': max(1, (self.kl + 5) // 2), 'stars': 1})
        # expansions: buy as soon as possible (it's the goal)
        e = self.next_exp()
        if e and self.kl >= e['balance']['kl'] and self.gold >= e['balance']['cost'] and self.busy() < self.builders():
            self.gold -= e['balance']['cost']
            self.cleared.append(e['n'])
            self.xp(B['kingdom']['xp_rewards_pct_of_bar']['expansion'])
            if self.legacy:
                self.plots += LEGACY_PLOTS.get(e['id'], 0)
            self.log.append((self.t, e['n'], e['name'], e['balance']['cost'], r, self.kl))
        # spend on the best payback (< 25 min), keep saving otherwise
        for _ in range(3):
            opts = self.options()
            if not opts:
                break
            pb, cost, kind, ref = opts[0]
            if pb > 25 * 60 or cost > self.gold:
                break
            self.gold -= cost
            if kind == 'hab':
                self.habs.append({'el': ref, 'tier': 1, 'busy': 10})
            else:
                h = self.habs[ref]
                nx = self.tiers[h['tier']]
                self.crystals[h['el']] -= nx['crystals']
                h['tier'] += 1
                h['busy'] = nx['build_s']


LEGACY_PLOTS = {'bosque_costero': 2, 'acantilado_rocoso': 2, 'isla_volcanica': 2, 'puerto_mareas': 1, 'glaciar_bigote': 2, 'ruinas_arcanas': 2, 'arrecife_prismatico': 2, 'atolon_estelar': 2}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--legacy', action='store_true')
    ap.add_argument('--hours', type=float, default=7)
    a = ap.parse_args()
    s = Sim(a.legacy)
    print(f"{'LEGACY' if a.legacy else 'NUEVO'} · inicio: {fmt(s.rate())}/s · Reino {s.kl} · {len(s.habs)} hábitats")
    marks = {0.5, 1, 1.5, 2, 3, 4, 5, 6, 7}
    while s.t < a.hours * 3600:
        s.step()
        hr = s.t / 3600
        if any(abs(hr - m) < 1e-6 for m in marks):
            tiers = sorted(h['tier'] for h in s.habs)
            print(f"  {hm(s.t)}  {fmt(s.rate()):>7}/s  oro {fmt(s.gold):>7}  Reino {s.kl}  hábitats {len(s.habs)} (tiers {tiers[0]}-{tiers[-1]})  exp {max(s.cleared)}")
    prev = 0
    for t, n, name, cost, r, kl in s.log:
        print(f"  exp {n:>2} {name:<22} {fmt(cost):>6}  a los {hm(t)} (+{int((t - prev) / 60)} min)  ingreso {fmt(r)}/s  Reino {kl}")
        prev = t
    nx = s.next_exp()
    if nx:
        print(f"  pendiente: exp {nx['n']} {nx['name']} (Reino {nx['balance']['kl']}, {fmt(nx['balance']['cost'])})  ahora Reino {s.kl}, {fmt(s.rate())}/s")


if __name__ == '__main__':
    main()
