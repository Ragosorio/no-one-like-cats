#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NO ONE LIKE CATS - Simulador de economia del Capitulo 1 ("El Primer Mar").

Lee balance.json (misma carpeta) y simula jugadores con distintos estilos:
  normal     -> activo normal (juega seguido, decisiones razonables)
  optimizer  -> optimizador (decide rapido, ROI perfecto, exprime Ronroneo y Gambit)
  casual     -> casual que espera (sesiones de 6 min cada 3 h, 16 h despierto/dia)
  idle       -> idle puro (sesiones como casual pero NUNCA combate) -> demuestra que esperar no basta
  gambler    -> optimizador que apuesta el maximo a x20 en cada carga (solo con --profile gambler)

Uso:
  python3 sim.py                      # corre todos los perfiles, 1 semilla, imprime tablas
  python3 sim.py --seeds 20           # robustez: mediana/P10/P90 de los tiempos de hitos
  python3 sim.py --profile normal --csv --svg
Salidas: tablas por hora + hitos en stdout; --csv escribe out_<perfil>.csv; --svg escribe gold_curve.svg.
Otros scripts: gambit_check.py (lotería), sensitivity.py (palancas), tables.py (tablas de contenido desde el JSON).
Sin dependencias externas (solo stdlib).
"""
import argparse
import json
import math
import os
import random
import statistics

HERE = os.path.dirname(os.path.abspath(__file__))


# --------------------------------------------------------------------------------------
# Notacion de numeros
# --------------------------------------------------------------------------------------
SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]


def fmt(n):
    """Notacion del juego: <10,000 completo; despues 3 cifras significativas + sufijo."""
    if n is None:
        return "-"
    neg = n < 0
    n = abs(n)
    if n < 10:
        s = f"{n:.1f}"
    elif n < 10000:
        s = f"{n:,.0f}"
    else:
        e = int(math.floor(math.log10(n) / 3))
        if e < len(SUFFIXES):
            suf = SUFFIXES[e]
        else:  # aa, ab, ...
            k = e - len(SUFFIXES)
            suf = chr(97 + k // 26) + chr(97 + k % 26)
        v = n / (1000 ** e)
        s = f"{v:.2f}{suf}" if v < 10 else (f"{v:.1f}{suf}" if v < 100 else f"{v:.0f}{suf}")
    return ("-" if neg else "") + s


def hm(t):
    if t is None:
        return "  --  "
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    if h >= 24:
        return f"d{h // 24 + 1} {h % 24:02d}h{m:02d}"
    return f"{h}h{m:02d}"


# --------------------------------------------------------------------------------------
# Perfiles de jugador (solo simulacion; no van en balance.json)
# --------------------------------------------------------------------------------------
PROFILES = {
    "normal": dict(
        name="Activo normal", mode="continuous", hours=10,
        tick=20, battle_dur=85, gap=75, skill=0.0, perfect_skill=0.0,
        mistake=0.20, save_horizon=150, p_push=0.50, boss_p=0.35, farm_p=0.70,
        gambit="casual", purr="closest", expedition=3600, gems="basic", events=True),
    "optimizer": dict(
        name="Optimizador", mode="continuous", hours=10,
        tick=8, battle_dur=70, gap=40, skill=0.08, perfect_skill=0.10,
        mistake=0.0, save_horizon=240, p_push=0.55, boss_p=0.30, farm_p=0.70,
        gambit="max", purr="smart", expedition=900, gems="smart", events=True),
    "casual": dict(
        name="Casual que espera", mode="sessions", hours=24 * 14,
        session_every=3 * 3600, session_len=360, awake_h=16, battles_per_session=2,
        tick=30, battle_dur=90, gap=20, skill=-0.03, perfect_skill=0.0,
        mistake=0.25, save_horizon=3 * 3600, p_push=0.50, boss_p=0.40, farm_p=0.70,
        gambit="none", purr="closest", expedition=14400, gems="basic", events=True),
    "gambler": dict(
        name="Optimizador ludopata (Gambit x20 siempre)", mode="continuous", hours=10,
        tick=8, battle_dur=70, gap=40, skill=0.08, perfect_skill=0.10,
        mistake=0.0, save_horizon=240, p_push=0.55, boss_p=0.30, farm_p=0.70,
        gambit="max20", purr="smart", expedition=900, gems="smart", events=True),
    "idle": dict(
        name="Idle puro (0 combates)", mode="sessions", hours=24 * 3,
        session_every=3 * 3600, session_len=360, awake_h=16, battles_per_session=0,
        tick=30, battle_dur=90, gap=20, skill=0.0, perfect_skill=0.0,
        mistake=0.25, save_horizon=3 * 3600, p_push=0.50, boss_p=0.40, farm_p=0.70,
        gambit="none", purr="closest", expedition=14400, gems="basic", events=False),
}


# --------------------------------------------------------------------------------------
# Entidades
# --------------------------------------------------------------------------------------
class Cat:
    __slots__ = ("sp", "level", "stars", "role", "hab")

    def __init__(self, sp):
        self.sp = sp
        self.level = 1
        self.stars = 1
        self.role = None   # None | 'crew' | 'worker'
        self.hab = None


class Habitat:
    __slots__ = ("el", "tier", "buf", "cats", "busy")

    def __init__(self, el, tier=1):
        self.el = el
        self.tier = tier
        self.buf = 0.0
        self.cats = []
        self.busy = False


class Plot:
    __slots__ = ("level", "crop", "rem", "ready", "busy")

    def __init__(self):
        self.level = 1
        self.crop = None
        self.rem = 0.0
        self.ready = False
        self.busy = False


NOMINAL = [0.0]


class Job:
    __slots__ = ("kind", "rem", "data", "label")

    def __init__(self, kind, rem, data, label):
        NOMINAL[0] += rem
        self.kind = kind
        self.rem = rem
        self.data = data
        self.label = label


# --------------------------------------------------------------------------------------
# Juego
# --------------------------------------------------------------------------------------
class Game:
    def __init__(self, B, prof_key, seed=1):
        self.B = B
        self.pk = prof_key
        self.P = PROFILES[prof_key]
        self.rng = random.Random(seed)
        st = B["start"]
        self.t = 0.0
        self.gold = float(st["gold"])
        self.food = float(st["food"])
        self.gems = 0
        self.gems_earned = 0
        self.gems_spent = 0
        self.purr = 0.0                    # segundos
        self.purr_earned = 0.0
        self.scrap = 0.0
        self.bp = 0
        self.crystals = 0.0
        self.prisma = 0.0
        self.orbs = {}                     # species id -> orbs
        self.kl = 1
        self.xp = 0.0                      # fraccion de la barra actual
        self.M = 1.0
        self.species = {c["id"]: c for c in B["catdex"]}
        self.rank = {r: i for i, r in enumerate(B["rarities"]["order"])}
        self.cats = []
        self.owned = set()
        self.elements = {e["id"] for e in B["elements"] if e["unlock"] == "start"}
        for sid in st["cats"]:
            self._add_cat(sid, silent=True)
        self.habitats = [Habitat(h["element"], h["tier"]) for h in st["habitats"]]
        self.hab_plots = B["habitats"]["plots_start"]
        self.plots = [Plot() for _ in range(B["farms"]["plots_start"])]
        self.expansions = 0
        self.mk = dict(st["mk"])
        self.ships = {st["ship"]}
        self.builders = st["builders"]
        self.yardq = st["yard_queues"]
        self.jobs = []                     # island build jobs
        self.yard = []                     # shipyard jobs
        self.res_slots = B["resonance"]["slots_start"]
        self.res = []                      # list of [rem, species_id, ready]
        self.pity = 0
        self.exp_slots = 0
        self.exps = []                     # [rem, dur]
        self.stage = 1                     # siguiente etapa por ganar (1..54)
        self.bosses = 0
        self.analysis = 0.0
        self.bonus = {"food": 0.0, "gold": 0.0, "catdex": 0.0, "prisma_per_h": 0.0, "offline_bank_h": 2.0}
        self.purchased = set()             # gem conveniences
        self.purr_cap_mult = 1.0
        # combate / actividad
        self.in_battle_until = None
        self.next_decision = 0.0
        self.next_battle_ok = 0.0
        self.session_battles = 0
        self.last_session = -1
        self.gambit_charges = 0.0
        self.gem_bets = 0
        self.gambit_staked = 0.0
        self.gambit_won = 0.0
        self.victories = 0
        self.battles = 0
        self.last_battle_gold = 0.0
        self.gold_earned = 0.0
        self.gold_from = {"habitat": 0.0, "battle": 0.0, "mission": 0.0, "gambit": 0.0, "overflow": 0.0}
        self.gold_to = {}
        self.bank = 0.0
        # eventos
        self.flash = None                  # dict(end, wins, done)
        self.flash_levels_done = set()
        self.heroic_done = set()
        self.heroic = None
        self.black_flag_done = False
        self.events_log = []
        self.milestones = {}
        self.xp_from = {}
        self.gem_from = {}
        self.purr_applied = 0.0
        self.nominal_started = 0.0
        self.rows = []
        self.done_t = None
        self.auto_feed_clock = 0.0
        self._cache_dirty = True
        self.assign()

    # ------------------------------------------------------------------ helpers
    def ms(self, key):
        if key not in self.milestones:
            self.milestones[key] = self.t

    def unlocked(self, auto_id):
        for a in self.B["automation"]:
            if a["id"] == auto_id:
                return self.kl >= a["kl"]
        return False

    def drag(self):
        K = self.B["kingdom"]
        early = 1.0 + K.get("xp_early_boost", 0) * max(0.0, 1.0 - (self.kl - 1) / K.get("xp_early_levels", 10))
        return early / (1.0 + K["xp_drag_per_level"] * (self.kl - 1))

    def timescale(self):
        return 1.0 + self.B["ronroneo"]["kl_scale"] * (self.kl - 1)

    def mfac(self):
        return 1.0 + 0.5 * (self.M - 1.0)

    def online(self, t=None):
        t = self.t if t is None else t
        if self.P["mode"] == "continuous":
            return True
        d = t % 86400
        if d >= self.P["awake_h"] * 3600:
            return False
        return (d % self.P["session_every"]) < self.P["session_len"]

    def next_online(self):
        """segundos hasta el proximo inicio de sesion"""
        d = self.t % 86400
        se = self.P["session_every"]
        nxt = (math.floor(d / se) + 1) * se
        if nxt >= self.P["awake_h"] * 3600:
            nxt = 86400
        return max(1.0, nxt - d)

    # ------------------------------------------------------------------ cats
    def _add_cat(self, sid, silent=False):
        sp = self.species[sid]
        if sid in self.owned:
            self.orbs[sid] = self.orbs.get(sid, 0) + self.B["rarities"]["duplicate_orbs"][sp["rarity"]]
            return False
        self.owned.add(sid)
        self.cats.append(Cat(sp))
        self.orbs.setdefault(sid, 0)
        for e in sp["el"]:
            pass
        if not silent:
            r = sp["rarity"]
            self.gain_gems(self.B["rarities"]["discovery_gems"][r], "catdex")
            self.gain_purr("new_species")
            self.gain_xp(self.B["kingdom"]["xp_rewards_pct_of_bar"]["new_species"], "descubrir")
            self.momentum("new_species")
            if r == "legendary":
                self.ms("1er legendario")
            n = len(self.owned)
            for k in (10, 20, 30, 40):
                if n >= k:
                    self.ms(f"{k} especies")
        self._cache_dirty = True
        return True

    def cat_gold(self, c):
        R = self.B["rarities"]
        return (R["gold_base_per_s"][c.sp["rarity"]] * self.B["cats"]["gold_per_level"] ** (c.level - 1)
                * self.B["cats"]["stars"]["mult"][c.stars - 1])

    def cat_power(self, c):
        R = self.B["rarities"]
        return (R["power_base"][c.sp["rarity"]] * self.B["cats"]["power_per_level"] ** (c.level - 1)
                * self.B["cats"]["stars"]["mult"][c.stars - 1])

    def feed_cost(self, c):
        C = self.B["cats"]
        return C["feed_cost_base"] * C["feed_cost_growth"] ** (c.level - 1) * self.B["rarities"]["food_mult"][c.sp["rarity"]]

    def cat_cap(self):
        return min(self.B["kingdom"]["level_cap_cats"], self.kl + 5)

    # ------------------------------------------------------------------ habitats
    def tier(self, t):
        return self.B["habitats"]["tiers"][t - 1]

    def hab_mult(self, h):
        m = self.tier(h.tier)["mult"]
        bankers = sum(1 for c in h.cats if c.role == "worker" and c.sp.get("worker") == "banker")
        return m * (1 + self.B["cats"]["workers"]["banker"]["value"] * bankers)

    def global_gold(self):
        cd = (0.02 + self.bonus["catdex"]) * len(self.owned)
        return (1 + cd) * (1 + self.bonus["gold"]) * self.mfac()

    def hab_rate(self, h, g=None):
        g = self.global_gold() if g is None else g
        return sum(self.cat_gold(c) for c in h.cats) * self.hab_mult(h) * g

    def gold_rate(self):
        g = self.global_gold()
        return sum(self.hab_rate(h, g) for h in self.habitats)

    def passive_rate_nom(self):
        """oro/s sin momentum (para topes de Gambit y recompensas de mision)"""
        return self.gold_rate() / self.mfac()

    def assign(self):
        for h in self.habitats:
            h.cats = []
        order = sorted(self.cats, key=lambda c: -self.cat_gold(c))
        habs = sorted(self.habitats, key=lambda h: -self.tier(h.tier)["mult"])
        self.homeless = []
        for c in order:
            c.hab = None
            for h in habs:
                if h.el in c.sp["el"] and len(h.cats) < self.tier(h.tier)["capacity"]:
                    h.cats.append(c)
                    c.hab = h
                    break
            if c.hab is None:
                self.homeless.append(c)
        # tripulacion: mejores por poder (no trabajadores)
        ship = self.best_ship()
        for c in self.cats:
            if c.role == "crew":
                c.role = None
        cands = sorted([c for c in self.cats if c.role != "worker"], key=lambda c: -self.cat_power(c))
        for c in cands[: ship["crew"]]:
            c.role = "crew"
        # trabajadores
        if self.unlocked("workers"):
            W = self.B["cats"]["workers"]
            counts = {k: 0 for k in ("banker", "farmer", "builder", "voyager")}
            for c in self.cats:
                if c.role == "worker":
                    counts[c.sp["worker"]] += 1
            for c in sorted(self.cats, key=lambda c: -self.cat_gold(c)):
                w = c.sp.get("worker")
                if w and c.role is None and counts[w] < W[w]["max"]:
                    if w == "voyager" and self.exp_slots == 0:
                        continue
                    c.role = "worker"
                    counts[w] += 1
            self.workers = counts
        else:
            self.workers = {k: 0 for k in ("banker", "farmer", "builder", "voyager")}

    # ------------------------------------------------------------------ farms
    def crops_unlocked(self):
        return [c for c in self.B["farms"]["crops"] if c["kl"] <= self.kl]

    def food_mult(self):
        far = self.workers.get("farmer", 0) * self.B["cats"]["workers"]["farmer"]["value"] if hasattr(self, "workers") else 0
        return 1 + self.bonus["food"] + far

    def plot_yield(self, p, crop):
        return crop["food"] * self.B["farms"]["upgrade"]["yield_growth"] ** (p.level - 1) * self.food_mult()

    def food_rate_est(self):
        tot = 0.0
        for p in self.plots:
            if p.crop:
                tot += self.plot_yield(p, p.crop) / p.crop["time_s"] * self.mfac()
        return tot

    def choose_crop(self, p, empty_plots):
        crops = self.crops_unlocked()
        auto_cycle = self.unlocked("auto_harvest") and self.unlocked("crop_repeat")
        budget = self.gold * 0.30 / max(1, empty_plots)
        best = None
        bestv = -1
        for c in crops:
            if c["cost"] > budget and c is not crops[0]:
                continue
            if c["cost"] > self.gold:
                continue
            if self.P["mode"] == "sessions" and not auto_cycle:
                # una cosecha por sesion: maximiza comida por visita
                if c["time_s"] > self.P["session_every"] * 3.5:
                    continue
                v = c["food"] / max(c["time_s"], self.P["session_every"])
            else:
                if c["id"] == "leviatan":
                    continue  # el activo no siembra el cultivo de "noche"
                v = c["food"] / c["time_s"]
            if v > bestv:
                bestv, best = v, c
        return best

    def spend(self, amount, sink):
        self.gold -= amount
        self.gold_to[sink] = self.gold_to.get(sink, 0) + amount

    def plant(self, p, crop):
        self.spend(crop["cost"], "cultivos")
        p.crop = crop
        p.rem = crop["time_s"]
        p.ready = False

    def harvest(self, p, replant=False):
        if p.ready and p.crop:
            self.food += self.plot_yield(p, p.crop)
            p.ready = False
            self.momentum("harvest")
            crop = p.crop
            p.crop = None
            if replant and self.unlocked("crop_repeat"):
                # repetir receta: re-siembra la MEJOR receta disponible (el jugador la actualiza al entrar)
                c = self.choose_crop(p, 1) or crop
                if self.gold >= c["cost"]:
                    self.plant(p, c)

    # ------------------------------------------------------------------ ship
    def ship_def(self, sid):
        for s in self.B["ship"]["ships"]:
            if s["id"] == sid:
                return s

    def ship_power(self, sid=None):
        s = self.ship_def(sid) if sid else self.best_ship()
        F = self.B["ship"]["families"]
        g = self.B["ship"]["mk"]["power_growth"]
        mod = 0.0
        for f, n in s["slots"].items():
            if n and self.mk.get(f, 0) > 0:
                mod += n * F[f]["power"] * g ** (self.mk[f] - 1)
        crew = sorted([self.cat_power(c) for c in self.cats if c.role != "worker"], reverse=True)[: s["crew"]]
        return s["mult"] * (mod + sum(crew))

    def eff_power(self, sid, stage):
        """poder efectivo de un barco contra una etapa concreta (rasgos situacionales)"""
        C = self.B["combat"]
        z = C["zones"][min(len(C["zones"]), (stage - 1) // C["stages_per_zone"] + 1) - 1]
        pk = self.ship_def(sid).get("perk_data", {})
        m = 1.0
        if pk.get("bonus_vs") and set(z.get("enemy_elements", [])) & set(pk["bonus_vs"]):
            m += pk["value"]
        if self.is_boss(stage) and pk.get("boss_bonus"):
            m += pk["boss_bonus"]
        return self.ship_power(sid) * m

    def ship_for(self, stage):
        return max(self.ships, key=lambda sid: self.eff_power(sid, stage))

    def best_ship(self):
        best, bp = None, -1
        F = self.B["ship"]["families"]
        g = self.B["ship"]["mk"]["power_growth"]
        for sid in self.ships:
            s = self.ship_def(sid)
            mod = sum(n * F[f]["power"] * g ** (self.mk.get(f, 0) - 1) for f, n in s["slots"].items() if n and self.mk.get(f, 0) > 0)
            v = s["mult"] * (mod + s["crew"] * 30)
            if v > bp:
                bp, best = v, s
        return best

    def mk_cap(self):
        return min(self.B["ship"]["mk"]["max"], self.bosses + 2)

    def mk_cost(self, f):
        F = self.B["ship"]["families"][f]
        n = self.mk.get(f, 0)
        MK = self.B["ship"]["mk"]
        tgt = n + 1
        gold = F["cost_base"] * F["cost_growth"] ** n
        if f == "shield" and self.expansions >= 5:
            gold *= 0.8
        scrap = MK["scrap"][tgt - 1]
        if f == "weapon" and self.expansions >= 3:
            scrap = math.ceil(scrap * 0.8)
        bp = MK["blueprints"][tgt - 1]
        cr = MK["crystals_weapon_shield_core"][tgt - 1] if f in ("weapon", "shield", "core") else 0
        return gold, scrap, bp, cr, MK["time_s"][tgt - 1]

    # ------------------------------------------------------------------ combate
    def enemy_power(self, s):
        C = self.B["combat"]
        n = C["stages_per_zone"]
        z = C["zones"][min(len(C["zones"]), (s - 1) // n + 1) - 1]
        k = (s - 1) % n + 1
        if k == n:
            return z["boss_power"] / (1 + C["boss_analysis_power_bonus_max"] * self.analysis)
        last = z["boss_power"] / C["boss_over_last_stage"]
        return z["stage1_power"] * (last / z["stage1_power"]) ** ((k - 1) / (n - 2))

    def win_p(self, s):
        sp = max(self.eff_power(sid, s) for sid in self.ships)
        ep = self.enemy_power(s)
        p = 0.5 + 0.5 * math.tanh(self.B["combat"]["win_curve_k"] * math.log(sp / ep)) + self.P["skill"]
        return max(0.03, min(0.97, p))

    def is_boss(self, s):
        return s % self.B["combat"]["stages_per_zone"] == 0

    def boss_idx(self, s):
        return s // self.B["combat"]["stages_per_zone"]

    def choose_stage(self):
        f = self.stage
        p = self.win_p(f)
        if self.is_boss(f):
            b = self.B["bosses"][self.boss_idx(f) - 1]
            if self.kl >= b["kl"] and p >= self.P["boss_p"]:
                return f
        elif p >= self.P["p_push"]:
            return f
        # farmear la etapa ganada mas alta con buena probabilidad
        s = max(1, f - 1)
        while s > 1 and (self.win_p(s) < self.P["farm_p"] or self.is_boss(s)):
            s -= 1
        return s

    def battle(self):
        B = self.B
        R = B["combat"]["reward"]
        s = self.choose_stage()
        p = self.win_p(s)
        win = self.rng.random() < p
        perf = win and self.rng.random() < max(0.0, min(0.9, 0.2 + 0.6 * (p - 0.5) + self.P["perfect_skill"]))
        boss = self.is_boss(s)
        self.battles += 1
        loot = self.M * (B["events"]["flash"]["loot_mult"] if self.flash and not self.flash["done"] else 1.0)
        zone = (s - 1) // B["combat"]["stages_per_zone"] + 1
        ship = self.ship_def(self.ship_for(s))
        gold = max(R["gold_base"] * R["gold_growth"] ** (s - 1), R["gold_income_seconds"] * self.passive_rate_nom())
        gold *= loot * (1.0 if s == self.stage else R["farm_stage_mult"])
        scrap = (R["scrap_base"] + R["scrap_per_stage"] * s) * loot
        if ship["id"] == "merodeador":
            scrap *= 1.4
        if win:
            self.victories += 1
            mult = R["perfect_mult"] if perf else 1.0
            gold *= mult
            scrap *= mult
            self.gain_gold(gold, "battle")
            self.last_battle_gold = gold
            self.scrap += scrap
            if s >= R["blueprint_min_stage"] and self.rng.random() < R["blueprint_chance"]:
                self.bp += 1 + (zone - 1) // 2
            cr = (R["crystal_base"] + R["crystal_per_zone"] * zone) * (1.5 if ship["id"] == "bajel" else 1.0)
            self.crystals += cr
            if self.rng.random() < B["orbs"]["victory_drop_chance"]:
                sid = self.rng.choice(sorted(self.owned))
                self.orbs[sid] += B["orbs"]["victory_drop_amount"]
            if perf and self.rng.random() < R["perfect_gem_chance"]:
                self.gain_gems(1, "perfecta")
            self.gain_purr("victory")
            if perf:
                self.gain_purr("perfect_extra")
            self.gain_purr("core_destroyed")
            self.momentum("victory")
            if perf:
                self.momentum("perfect_extra")
            X = B["kingdom"]["xp_rewards_pct_of_bar"]
            self.gain_xp(X["victory"] + (X["perfect_extra"] if perf else 0), "combate")
            self.gambit_charges = min(B["gambit"]["max_charges"], self.gambit_charges + 1.0 / B["gambit"]["charges_per_victories"])
            if self.flash and not self.flash["done"]:
                self.flash["wins"] += 1
            if self.heroic:
                self.heroic["wins"] += 1
            if s == self.stage:
                if boss:
                    self.beat_boss(self.boss_idx(s))
                self.stage += 1
                self.ms(f"etapa {s}")
        else:
            self.gain_gold(gold * R["defeat_mult"], "battle")
            self.scrap += scrap * R["defeat_mult"]
            self.gain_purr("defeat")
            self.momentum("defeat")
            self.gain_xp(B["kingdom"]["xp_rewards_pct_of_bar"]["defeat"], "combate")
            if boss:
                self.analysis = min(1.0, self.analysis + B["combat"]["boss_analysis_per_defeat"])

    def beat_boss(self, n):
        B = self.B
        b = B["bosses"][n - 1]
        self.bosses = n
        self.analysis = 0.0
        self.ms(f"Jefe {n}: {b['name']}")
        self.gain_gems(b["gems"], "jefes")
        self.bp += B["combat"]["reward"]["boss_blueprints"]
        self.crystals += B["combat"]["reward"]["boss_crystals"]
        self.gain_purr("boss")
        self.momentum("boss")
        self.gain_xp(B["kingdom"]["xp_rewards_pct_of_bar"]["boss"], "jefe")
        best = max(self.cats, key=lambda c: self.cat_power(c))
        self.orbs[best.sp["id"]] += B["orbs"]["boss_orbs"]
        for u in b["unlocks"]:
            k, _, v = u.partition(":")
            if k == "element":
                self.elements.add(v)
                self.ms(f"Elemento {v}")
            elif k == "cat":
                self._add_cat(v)
            elif k == "ship":
                pass  # se compra en el astillero
            elif k == "family":
                pass
            elif k == "chapter_end":
                self.done_t = self.t
                self.ms("CAPITULO TERMINADO")
        self._cache_dirty = True
        self.assign()

    # ------------------------------------------------------------------ recompensas
    def gain_gold(self, g, src):
        self.gold += g
        self.gold_earned += g
        self.gold_from[src] = self.gold_from.get(src, 0) + g

    def gain_gems(self, n, src="otros"):
        self.gems += n
        self.gems_earned += n
        self.gem_from[src] = self.gem_from.get(src, 0) + n

    def purr_cap(self):
        R = self.B["ronroneo"]
        return (R["pool_cap_min_base"] + R["pool_cap_min_per_kl"] * self.kl) * 60 * self.purr_cap_mult

    def gain_purr(self, src, scale=1.0):
        R = self.B["ronroneo"]
        s = R["base_min"][src] * 60 * self.timescale() * self.mfac() * scale
        self.purr += s
        self.purr_earned += s
        cap = self.purr_cap()
        if self.purr > cap:
            over = self.purr - cap
            self.purr = cap
            self.gain_gold(over / 60 * R["overflow_to_gold_seconds_per_min"] * self.passive_rate_nom(), "overflow")

    def momentum(self, src):
        Mo = self.B["momentum"]
        self.M = min(Mo["max"], self.M + Mo["gain"][src])

    def gain_xp(self, pct, src="otros"):
        self.xp_from[src] = self.xp_from.get(src, 0) + pct * self.drag()
        self.xp += pct * self.drag()
        while self.xp >= 1.0 and self.kl < self.B["kingdom"]["level_cap"]:
            self.xp -= 1.0
            self.level_up()

    def level_up(self):
        B = self.B
        self.kl += 1
        for k in (5, 10, 15, 20, 25, 30, 35, 40, 45):
            if self.kl == k:
                self.ms(f"Reino {k}")
        self.gain_purr("level_up")
        self.momentum("mission")
        if self.kl % B["kingdom"]["milestone_gems_every"] == 0:
            self.gain_gems(B["kingdom"]["milestone_gems"], "hitos")
        self.gem_bets += B["gambit"]["gem_bets_per_level_up"]
        # misiones de progreso (no diarias): aparecen porque avanzaste
        MR = B["kingdom"]["mission_reward"]
        for _ in range(B["kingdom"]["missions_per_level_up"]):
            self.gain_gold(MR["gold_seconds_of_income"] * self.passive_rate_nom(), "mission")
            self.food += MR["food_seconds_of_income"] * max(self.food_rate_est(), 0.5)
            self.gain_purr("mission")
            if self.rng.random() < MR["gem_chance"]:
                self.gain_gems(1, "misiones")
            sid = self.rng.choice(sorted(self.owned))
            self.orbs[sid] += MR["orbs"]
            self.momentum("mission")
            self.xp += B["kingdom"]["xp_rewards_pct_of_bar"]["mission"] * self.drag()
            self.xp_from["misiones"] = self.xp_from.get("misiones", 0) + B["kingdom"]["xp_rewards_pct_of_bar"]["mission"] * self.drag()
        # elemento por historia
        for e in B["elements"]:
            if e["unlock"] == f"kl:{self.kl}":
                self.elements.add(e["id"])
                self.ms(f"Elemento {e['id']}")
        # eventos flash disparados por progreso
        F = B["events"]["flash"]
        if self.P["events"] and self.kl >= F["from_kl"] and self.kl % F["every_levels"] == 0 and self.flash is None:
            if self.online():
                self.flash = dict(end=self.t + F["duration_s"], wins=0, done=False)

    # ------------------------------------------------------------------ resonancia
    def res_distribution(self, a, b):
        B = self.B
        RS = B["resonance"]
        U = (set(a.sp["el"]) | set(b.sp["el"])) & self.elements
        shared = set(a.sp["el"]) & set(b.sp["el"])
        minlvl = min(a.level, b.level)
        buckets = {"common": [], "rare": [], "epic": [], "legendary": []}
        for sp in B["catdex"]:
            if sp["source"] in ("start",) or sp["rarity"] == "mythic":
                if not (sp["source"] == "start"):
                    continue
            r = sp["rarity"]
            els = set(sp["el"])
            if not els <= self.elements:
                continue
            if r == "common" and els <= U:
                buckets["common"].append(sp["id"])
            elif r == "rare" and els <= U:
                buckets["rare"].append(sp["id"])
            elif r == "epic" and els <= U and minlvl >= sp.get("min_parent_level", 15):
                buckets["epic"].append(sp["id"])
            elif r == "legendary" and els <= shared and minlvl >= sp.get("min_parent_level", 20):
                buckets["legendary"].append(sp["id"])
        W = dict(RS["bucket_weights"])
        rk = self.rank[a.sp["rarity"]] + self.rank[b.sp["rarity"]]
        W["epic"] += RS["parent_rarity_bonus"]["epic_per_rank"] * rk + min(RS["pity"]["cap"], self.pity * RS["pity"]["epic_bonus_per_miss"])
        W["legendary"] += RS["parent_rarity_bonus"]["legendary_per_rank"] * rk
        # secreto: algun epico/legendario no descubierto cuyos elementos conoces
        secret = [sp["id"] for sp in B["catdex"] if sp["rarity"] in ("epic", "legendary") and sp["source"] == "resonance"
                  and set(sp["el"]) <= self.elements and sp["id"] not in self.owned]
        buckets["secret"] = secret
        dist = {}
        self._secret_p = (W["secret"] / sum(W[k] for k, v in buckets.items() if v)) if secret else 0.0
        self._secret_ids = set(secret)
        tot = sum(W[k] for k, v in buckets.items() if v)
        for k, ids in buckets.items():
            if not ids:
                continue
            for sid in ids:
                dist[sid] = dist.get(sid, 0) + W[k] / tot / len(ids)
        return dist

    def pair_score(self, a, b):
        d = self.res_distribution(a, b)
        v = 0.0
        for sid, p in d.items():
            r = self.species[sid]["rarity"]
            rk = self.rank[r]
            if sid not in self.owned:
                v += p * (1.0 + 0.6 * rk)
            else:
                v += p * 0.05 * (1 + rk)
        return v, d

    def start_resonance(self):
        if len(self.res) >= self.res_slots or len(self.cats) < 2:
            return
        top = sorted(self.cats, key=lambda c: -(c.level + 5 * self.rank[c.sp["rarity"]]))[:12]
        best, bd, bv = None, None, -1
        pairs = []
        for i in range(len(top)):
            for j in range(i + 1, len(top)):
                v, d = self.pair_score(top[i], top[j])
                pairs.append((v, d))
                if v > bv:
                    bv, best, bd = v, (top[i], top[j]), d
        if best is None:
            return
        if self.P["mistake"] and self.rng.random() < self.P["mistake"] and len(pairs) > 3:
            pairs.sort(key=lambda x: -x[0])
            bv, bd = pairs[self.rng.randint(1, min(5, len(pairs) - 1))]
        # sortear resultado
        x = self.rng.random()
        acc = 0.0
        res = None
        for sid, p in bd.items():
            acc += p
            if x <= acc:
                res = sid
                break
        if res is None:
            res = list(bd.keys())[-1]
        r = self.species[res]["rarity"]
        if self.rank[r] >= 2:
            self.pity = 0
        else:
            self.pity += 1
        dur = self.B["rarities"]["resonance_time_s"][r]
        NOMINAL[0] += dur
        self.res.append([dur, res, False])

    def hatch_ready(self):
        keep = []
        for slot in self.res:
            if slot[2]:
                sid = slot[1]
                r = self.species[sid]["rarity"]
                self._add_cat(sid)
                self.gain_xp(self.B["kingdom"]["xp_rewards_pct_of_bar"]["hatch"][r], "resonancia")
            else:
                keep.append(slot)
        changed = len(keep) != len(self.res)
        self.res = keep
        if changed:
            self.assign()

    # ------------------------------------------------------------------ economia: alimentar / estrellas
    def feed(self):
        cap = self.cat_cap()
        if self.food <= 0:
            return
        g = self.global_gold()
        crew_w = 1.5 if self.blocked() else 0.35
        for _ in range(400):
            best, bv, bc = None, 0.0, 0.0
            for c in self.cats:
                if c.level >= cap:
                    continue
                cost = self.feed_cost(c)
                if cost > self.food:
                    continue
                dg = 0.0
                if c.hab is not None:
                    dg = self.cat_gold(c) * (self.B["cats"]["gold_per_level"] - 1) * self.hab_mult(c.hab) * g
                if c.role == "crew":
                    dg += crew_w * self.cat_gold(c) * self.tier(max(h.tier for h in self.habitats))["mult"] * g * 0.16
                if dg <= 0:
                    dg = 1e-9 * self.cat_gold(c)
                v = dg / cost
                if v > bv:
                    best, bv, bc = c, v, cost
            if best is None:
                break
            self.food -= bc
            best.level += 1
            self.xp += self.B["kingdom"]["xp_rewards_pct_of_bar"]["cat_level_up"] * self.drag()
            self.xp_from["alimentar"] = self.xp_from.get("alimentar", 0) + self.B["kingdom"]["xp_rewards_pct_of_bar"]["cat_level_up"] * self.drag()
            while self.xp >= 1.0 and self.kl < self.B["kingdom"]["level_cap"]:
                self.xp -= 1.0
                self.level_up()
                cap = self.cat_cap()
        self.assign()

    def food_value(self):
        """oro/s-equivalente ganado por unidad de comida en la mejor alimentacion disponible"""
        cap = self.cat_cap()
        g = self.global_gold()
        best = 0.0
        for c in self.cats:
            if c.level >= cap or c.hab is None:
                continue
            dg = self.cat_gold(c) * 0.16 * self.hab_mult(c.hab) * g
            best = max(best, dg / self.feed_cost(c))
        if self.blocked():
            sp = self.ship_power()
            inc = self.passive_rate_nom()
            mult = self.best_ship()["mult"]
            for c in self.cats:
                if c.role == "crew" and c.level < cap:
                    dsp = self.cat_power(c) * 0.07 * mult
                    best = max(best, (dsp / sp) * inc * 40 / self.feed_cost(c))
        return best

    def blocked(self):
        return self.win_p(self.stage) < self.P["p_push"] or (self.is_boss(self.stage) and self.win_p(self.stage) < self.P["boss_p"] + 0.15)

    def star_ups(self):
        S = self.B["cats"]["stars"]
        R = self.B["rarities"]
        for c in self.cats:
            while c.stars < S["max"]:
                need = R["star_orbs_base"][c.sp["rarity"]] * S["orb_steps"][c.stars - 1]
                if c.level < S["min_level"][c.stars - 1]:
                    break
                have = self.orbs.get(c.sp["id"], 0)
                use_prisma = 0
                if have < need and self.P["gems"] == "smart" and c.role == "crew":
                    use_prisma = min(self.prisma, need - have)
                if have + use_prisma < need:
                    break
                self.prisma -= use_prisma
                self.orbs[c.sp["id"]] = have + use_prisma - need
                c.stars += 1
                self.gain_xp(self.B["kingdom"]["xp_rewards_pct_of_bar"]["star_up"], "estrellas")
                if c.stars == 6:
                    self.ms("1er gato 6 estrellas")

    # ------------------------------------------------------------------ compras
    def free_builders(self):
        n = self.builders + (1 if "builder" in self.purchased else 0)
        return n - len(self.jobs)

    def free_yard(self):
        return self.yardq - len(self.yard)

    def build_time(self, s):
        b = self.workers.get("builder", 0) * self.B["cats"]["workers"]["builder"]["value"]
        return s * (1 - b)

    def candidates(self):
        """lista de (payback_s, coste_oro, accion, etiqueta, extra_check)"""
        B = self.B
        out = []
        inc = max(self.passive_rate_nom(), 1e-6)
        g = self.global_gold() / self.mfac()
        # expansion
        if self.expansions < len(B["expansions"]) and self.free_builders() > 0 and not any(j.kind == "exp" for j in self.jobs):
            e = B["expansions"][self.expansions]
            if self.kl >= e["kl"]:
                out.append((0.0, e["cost"], ("exp", e), f"Expansion {e['n']}", True))
        if self.free_builders() > 0:
            # nuevo habitat
            used = len(self.habitats) + sum(1 for j in self.jobs if j.kind == "newhab")
            if used < self.hab_plots and self.homeless:
                byel = {}
                for c in self.homeless:
                    for e in c.sp["el"]:
                        byel.setdefault(e, []).append(self.cat_gold(c))
                el, vals = max(byel.items(), key=lambda kv: sum(sorted(kv[1], reverse=True)[:2]))
                dg = sum(sorted(vals, reverse=True)[:2]) * g
                cost = B["habitats"]["new_habitat_cost_base"] * B["habitats"]["new_habitat_cost_growth"] ** (len(self.habitats) - 1)
                out.append((cost / max(dg, 1e-9), cost, ("newhab", el), f"Habitat {el}", True))
            # mejorar habitat
            tiers = B["habitats"]["tiers"]
            for h in self.habitats:
                if h.busy or h.tier >= len(tiers):
                    continue
                nt = tiers[h.tier]
                if nt["kl"] > self.kl or nt["crystals"] > self.crystals:
                    continue
                cur = self.hab_rate(h, g)
                ratio = nt["mult"] / self.tier(h.tier)["mult"]
                dg = cur * (ratio - 1)
                extra = nt["capacity"] - self.tier(h.tier)["capacity"]
                if extra > 0:
                    hl = sorted([self.cat_gold(c) for c in self.homeless if h.el in c.sp["el"]], reverse=True)[:extra]
                    dg += sum(hl) * nt["mult"] * g
                if dg <= 0:
                    dg = cur * 0.05 + 1e-9
                out.append((nt["cost"] / dg, nt["cost"], ("uphab", h), f"Habitat T{h.tier + 1}", nt["crystals"] <= self.crystals))
            # mejorar granja
            fv = self.food_value()
            U = B["farms"]["upgrade"]
            for p in self.plots:
                if p.busy or p.level >= U["max_level"] or not p.crop:
                    continue
                cost = U["cost_base"] * U["cost_growth"] ** (p.level - 1)
                dfood = self.plot_yield(p, p.crop) / p.crop["time_s"] * (U["yield_growth"] - 1)
                dg = dfood * fv * 600.0
                if dg <= 0:
                    continue
                out.append((cost / dg, cost, ("upfarm", p), "Granja", True))
        # astillero
        if self.free_yard() > 0:
            blocked = self.blocked()
            sp0 = self.ship_power()
            ship = self.best_ship()
            for f in B["ship"]["families"]:
                n = self.mk.get(f, 0)
                if n >= self.mk_cap():
                    continue
                if f == "shield" and self.bosses < 3:
                    continue
                if any(j.data == f for j in self.yard):
                    continue
                gold, scrap, bp, cr, _ = self.mk_cost(f)
                if scrap > self.scrap or bp > self.bp or cr > self.crystals:
                    continue
                if ship["slots"].get(f, 0) == 0:
                    continue
                gpow = B["ship"]["mk"]["power_growth"]
                pw = B["ship"]["families"][f]["power"] * ship["slots"][f]
                dsp = ship["mult"] * pw * ((gpow ** n) - (gpow ** (n - 1) if n > 0 else 0))
                rel = dsp / sp0
                w = 0.5 if blocked else 6.0
                out.append((gold / inc * w / max(rel * 10, 0.05), gold, ("mk", f), f"{f} Mk{n + 1}", True))
            # barcos nuevos
            for s in B["ship"]["ships"]:
                if s["id"] in self.ships:
                    continue
                k, _, v = s["unlock"].partition(":")
                ok = (k == "kl" and self.kl >= int(v)) or (k == "boss" and self.bosses >= int(v))
                if not ok:
                    continue
                cur = max(self.eff_power(x, self.stage) for x in self.ships)
                self.ships.add(s["id"])
                new = self.eff_power(s["id"], self.stage)
                self.ships.discard(s["id"])
                if new <= cur * 1.02:
                    continue
                w = 0.3 if blocked else 2.0
                out.append((s["cost"] / inc * w, s["cost"], ("ship", s), f"Barco {s['name']}", True))
        return out

    def do(self, act):
        B = self.B
        kind, x = act
        if kind == "exp":
            self.spend(x["cost"], "expansiones")
            self.jobs.append(Job("exp", self.build_time(x["clear_s"]), x, x["name"]))
        elif kind == "newhab":
            cost = B["habitats"]["new_habitat_cost_base"] * B["habitats"]["new_habitat_cost_growth"] ** (len(self.habitats) - 1)
            self.spend(cost, "habitats")
            self.jobs.append(Job("newhab", self.build_time(B["habitats"]["tiers"][0]["build_s"]), x, "habitat"))
        elif kind == "uphab":
            nt = B["habitats"]["tiers"][x.tier]
            self.spend(nt["cost"], "habitats")
            self.crystals -= nt["crystals"]
            x.busy = True
            self.jobs.append(Job("uphab", self.build_time(nt["build_s"]), x, nt["name"]))
        elif kind == "upfarm":
            U = B["farms"]["upgrade"]
            self.spend(U["cost_base"] * U["cost_growth"] ** (x.level - 1), "granjas")
            x.busy = True
            self.jobs.append(Job("upfarm", self.build_time(U["time_base_s"] * U["time_growth"] ** (x.level - 1)), x, "granja"))
        elif kind == "mk":
            gold, scrap, bp, cr, tm = self.mk_cost(x)
            self.spend(gold, "barco: modulos")
            self.scrap -= scrap
            self.bp -= bp
            self.crystals -= cr
            self.yard.append(Job("mk", tm, x, f"{x} Mk"))
        elif kind == "ship":
            self.spend(x["cost"], "barco: barcos nuevos")
            self.ships.add(x["id"])
            self.ms(f"Barco {x['name']}")
            self.assign()

    def spend_gold(self):
        for _ in range(25):
            c = self.candidates()
            if not c:
                return
            c.sort(key=lambda x: x[0])
            # expansion primero si existe
            if c[0][2][0] == "exp":
                if self.gold >= c[0][1]:
                    self.do(c[0][2])
                    continue
                wait = (c[0][1] - self.gold) / max(self.passive_rate_nom(), 1e-6)
                if wait < self.P["save_horizon"] * 6:
                    # gastar solo en cosas muy baratas mientras ahorra
                    cheap = [x for x in c[1:] if x[1] <= 0.03 * c[0][1] and x[1] <= self.gold and x[4]]
                    if cheap:
                        self.do(cheap[0][2])
                        continue
                    return
                c = c[1:]
                if not c:
                    return
            pick = c[0]
            if self.P["mistake"] and len(c) > 1 and self.rng.random() < self.P["mistake"]:
                pick = c[1]
            if pick[1] <= self.gold and pick[4]:
                self.do(pick[2])
                continue
            wait = (pick[1] - self.gold) / max(self.passive_rate_nom(), 1e-6)
            if wait < self.P["save_horizon"]:
                return
            alt = [x for x in c if x[1] <= self.gold and x[4] and x[0] < pick[0] * 4]
            if alt:
                self.do(alt[0][2])
                continue
            return

    # ------------------------------------------------------------------ ronroneo
    def timers(self):
        T = []
        for j in self.jobs:
            T.append(("job", j))
        for j in self.yard:
            T.append(("yard", j))
        for s in self.res:
            if not s[2]:
                T.append(("res", s))
        return T

    def apply_purr(self):
        if self.purr <= 1:
            return
        for _ in range(10):
            T = self.timers()
            if not T or self.purr <= 1:
                return
            def rem(x):
                return x[1].rem if x[0] != "res" else x[1][0]
            if self.P["purr"] == "smart":
                blocked = self.win_p(self.stage) < self.P["p_push"]
                def prio(x):
                    k = x[0]
                    base = {"yard": 3.0 if blocked else 1.0, "job": 2.0, "res": 1.5}[k]
                    if k == "job" and x[1].kind == "exp":
                        base = 4.0
                    return -base / max(rem(x), 1)
                T.sort(key=prio)
            else:
                T.sort(key=rem)
            k, obj = T[0]
            r = rem(T[0])
            use = min(self.purr, r)
            self.purr -= use
            self.purr_applied += use
            if k == "res":
                obj[0] -= use
            else:
                obj.rem -= use
            self.tick_timers(0.0)

    # ------------------------------------------------------------------ gemas
    def spend_gems(self):
        S = self.B["gems"]["sinks"]
        mode = self.P["gems"]
        if "resonance_slot" not in self.purchased and self.gems >= S["resonance_slot"]["cost"]:
            self.gems -= S["resonance_slot"]["cost"]; self.gems_spent += S["resonance_slot"]["cost"]
            self.purchased.add("resonance_slot"); self.res_slots += 1
        if "builder" not in self.purchased and self.gems >= S["builder"]["cost"]:
            self.gems -= S["builder"]["cost"]; self.gems_spent += S["builder"]["cost"]
            self.purchased.add("builder")
        if mode == "smart":
            if "purr_cap" not in self.purchased and self.gems >= S["purr_cap_plus50"]["cost"]:
                self.gems -= S["purr_cap_plus50"]["cost"]; self.gems_spent += S["purr_cap_plus50"]["cost"]
                self.purchased.add("purr_cap"); self.purr_cap_mult = 1.5
            # gemas sobrantes -> terminar timers del astillero cuando un jefe bloquea
            if len(self.purchased) >= 3 and self.gems > 10 and self.yard and self.win_p(self.stage) < self.P["p_push"]:
                j = self.yard[0]
                per = S["skip_productive_timer"]["minutes_per_gem"] * 60 * self.timescale()
                n = min(self.gems - 10, math.ceil(j.rem / per))
                self.gems -= n; self.gems_spent += n
                j.rem -= n * per
        elif len(self.purchased) >= 2 and self.gems > 40 and self.res:
            per = S["skip_productive_timer"]["minutes_per_gem"] * 60 * self.timescale()
            s = max(self.res, key=lambda s: s[0])
            n = min(self.gems - 30, math.ceil(s[0] / per))
            if n > 0:
                self.gems -= n; self.gems_spent += n
                s[0] -= n * per

    # ------------------------------------------------------------------ Gambit
    def gambit(self):
        G = self.B["gambit"]
        mode = self.P["gambit"]
        if mode == "none" or self.gambit_charges < 1:
            return
        if mode == "casual" and (self.gambit_charges < 3 or self.rng.random() > 0.5):
            return
        cap = min(G["stake_cap_gold_seconds_of_income"] * self.passive_rate_nom(), G["stake_cap_wallet_pct"] * self.gold)
        if cap <= 0:
            return
        if mode == "max":
            tier = G["tiers"][0]
            stake = cap
        elif mode == "max20":
            tier = G["tiers"][2]
            stake = cap
        else:
            tier = self.rng.choice(G["tiers"])
            stake = cap * 0.5
        stake = min(stake, G["max_payout_seconds_of_income"] * self.passive_rate_nom() / tier["mult"])
        self.gambit_charges -= 1
        self.gold -= stake
        self.gambit_staked += stake
        if self.rng.random() < tier["p"]:
            win = stake * tier["mult"]
            self.gold += win
            self.gambit_won += win
            self.gold_earned += win - stake
            self.gold_from["gambit"] += win - stake
        else:
            self.gold_earned -= stake
            self.gold_from["gambit"] -= stake
        # apuesta de gemas (limitada a 1 por nivel de Reino)
        if mode in ("max", "max20") and self.gem_bets > 0 and self.gems >= G["gem_bet_max"] and len(self.purchased) >= 3:
            self.gem_bets -= 1
            st = G["gem_bet_max"]
            self.gems -= st
            if self.rng.random() < G["tiers"][0]["p"]:
                self.gems += st * 2
                self.gems_earned += st
                self.gem_from["gambit"] = self.gem_from.get("gambit", 0) + st

    # ------------------------------------------------------------------ expediciones
    def expeditions(self, on):
        E = self.B["expeditions"]
        if self.exp_slots == 0:
            return
        auto = self.unlocked("auto_expedition")
        if not on and not auto:
            return
        while len(self.exps) < self.exp_slots:
            dur = self.P["expedition"]
            self.exps.append([dur, dur])

    def collect_expedition(self, dur):
        E = self.B["expeditions"]
        h = dur / 3600
        zone = min(6, self.bosses + 1)
        f = h ** E["hour_exponent"] * (1 + self.workers.get("voyager", 0) * self.B["cats"]["workers"]["voyager"]["value"])
        self.scrap += (E["scrap_per_h"] + E["scrap_per_zone_per_h"] * zone) * f
        self.crystals += E["crystals_per_h"] * f
        if self.rng.random() < E["blueprint_per_h"] * h:
            self.bp += 1
        sid = self.rng.choice(sorted(self.owned))
        self.orbs[sid] += int(E["orbs_per_h"] * f)

    # ------------------------------------------------------------------ eventos
    def events(self):
        B = self.B
        if not self.P["events"]:
            return
        # flash
        if self.flash and self.t >= self.flash["end"]:
            F = B["events"]["flash"]
            if self.flash["wins"] >= F["battles_needed"]:
                self.gain_gems(F["gems"], "eventos")
                self.crystals += F["crystals"]
                self.gain_purr("flash_event")
                self.events_log.append((self.t, "flash ok"))
            self.flash = None
        # heroico (relojes SAGRADOS: solo si el jugador puede quedarse)
        for h in B["events"]["heroic"]:
            if h["n"] in self.heroic_done or self.kl < h["kl"]:
                continue
            if self.heroic is None and self.P["mode"] == "continuous" and self.win_p(self.stage) >= 0.5:
                self.heroic = dict(n=h["n"], end=self.t + h["duration_s"], wins=0, kind="heroic", cfg=h)
        bf = B["events"]["black_flag"]
        if not self.black_flag_done and self.kl >= bf["kl"] and self.heroic is None and self.P["mode"] == "continuous":
            self.heroic = dict(n=0, end=self.t + bf["duration_s"], wins=0, kind="flag", cfg=bf)
        if self.heroic and self.t >= self.heroic["end"]:
            h = self.heroic
            if h["kind"] == "flag":
                self.black_flag_done = True
                if h["wins"] >= h["cfg"]["victories_needed"]:
                    self.ships.add("merodeador")
                    self.ms("Barco Merodeador (evento)")
            else:
                self.heroic_done.add(h["n"])
                if h["wins"] >= h["cfg"]["victories_needed"]:
                    self._add_cat(h["cfg"]["reward"].split(":")[1])
                    self.gain_gems(h["cfg"]["gems"], "eventos")
                    self.ms(f"Heroico {h['cfg']['name']}")
            self.heroic = None
            self.assign()

    # ------------------------------------------------------------------ tiempo
    def tick_timers(self, dt):
        B = self.B
        done = []
        for j in self.jobs:
            j.rem -= dt
            if j.rem <= 0:
                done.append(j)
        for j in done:
            self.jobs.remove(j)
            self.finish_job(j)
        done = []
        for j in self.yard:
            j.rem -= dt
            if j.rem <= 0:
                done.append(j)
        for j in done:
            self.yard.remove(j)
            self.mk[j.data] = self.mk.get(j.data, 0) + 1
            self.gain_xp(B["kingdom"]["xp_rewards_pct_of_bar"]["ship_upgrade"], "barco")
            if j.data == "hull" and self.mk[j.data] == 7:
                self.ms("Casco Mk VII")
        for s in self.res:
            if not s[2]:
                s[0] -= dt
                if s[0] <= 0:
                    s[2] = True

    def finish_job(self, j):
        B = self.B
        X = B["kingdom"]["xp_rewards_pct_of_bar"]
        if j.kind == "exp":
            e = j.data
            self.expansions += 1
            self.hab_plots += e["hab_plots"]
            for _ in range(e["farm_plots"]):
                self.plots.append(Plot())
            bo = e["bonus"]
            self.bonus["food"] += bo.get("food", 0)
            self.bonus["gold"] += bo.get("gold", 0)
            self.bonus["catdex"] += bo.get("catdex_bonus", 0)
            self.bonus["prisma_per_h"] += bo.get("prisma_per_h", 0)
            self.bonus["offline_bank_h"] += bo.get("offline_bank_h", 0)
            self.builders += bo.get("builders", 0)
            self.res_slots += bo.get("resonance_slots", 0)
            self.exp_slots += bo.get("expedition_slots", 0)
            self.yardq += bo.get("yard_queues", 0)
            self.ms(f"Expansion {e['n']}: {e['name']}")
            self.gain_xp(X["expansion"], "expansion")
        elif j.kind == "newhab":
            self.habitats.append(Habitat(j.data, 1))
            self.gain_xp(X["build_done"] + X["build_per_tier"], "construir")
            self.assign()
        elif j.kind == "uphab":
            h = j.data
            h.tier += 1
            h.busy = False
            if h.tier == 8:
                self.ms("1er Nucleo Celestial")
            self.gain_xp(X["build_done"] + X["build_per_tier"] * h.tier, "construir")
            self.assign()
        elif j.kind == "upfarm":
            j.data.level += 1
            j.data.busy = False
            self.gain_xp(X["build_done"], "construir")

    def advance(self, dt, on):
        B = self.B
        # momentum
        hl = B["momentum"]["half_life_s"]
        self.M = 1.0 + (self.M - 1.0) * 0.5 ** (dt / hl)
        # habitats
        g = self.global_gold()
        bank = self.unlocked("kingdom_bank")
        for h in self.habitats:
            r = self.hab_rate(h, g)
            cap = r * self.tier(h.tier)["buffer_min"] * 60
            prod = r * dt
            if bank:
                if on:
                    self.gain_gold(prod, "habitat")
                    continue
                bcap = self.bonus["offline_bank_h"] * 3600 * self.gold_rate_cached
                room = max(0.0, bcap - self.bank)
                take = min(prod, room)
                self.bank += take
                prod -= take
            h.buf = min(cap, h.buf + prod)
        # granjas
        sp = self.mfac()
        auto = self.unlocked("auto_harvest")
        for p in self.plots:
            if p.crop and not p.ready:
                p.rem -= dt * sp
                if p.rem <= 0:
                    p.ready = True
            if p.ready and auto:
                self.harvest(p, replant=True)
        # timers
        self.tick_timers(dt)
        # cola de resonancia: eclosiona sola aunque no estes
        if self.unlocked("resonance_queue") and not on:
            if any(s[2] for s in self.res):
                self.hatch_ready()
                self.start_resonance()
                while len(self.res) < self.res_slots:
                    before = len(self.res)
                    self.start_resonance()
                    if len(self.res) == before:
                        break
        # expediciones
        done = []
        for e in self.exps:
            e[0] -= dt
            if e[0] <= 0:
                done.append(e)
        if done and (on or self.unlocked("auto_expedition")):
            for e in done:
                self.exps.remove(e)
                self.collect_expedition(e[1])
            self.expeditions(on)
        # prisma
        self.prisma += self.bonus["prisma_per_h"] * dt / 3600
        # auto-alimentar offline
        if not on and self.unlocked("auto_feed"):
            self.auto_feed_clock += dt
            if self.auto_feed_clock >= 600:
                self.auto_feed_clock = 0
                self.feed()

    def collect(self):
        tot = sum(h.buf for h in self.habitats) + self.bank
        for h in self.habitats:
            h.buf = 0.0
        self.bank = 0.0
        if tot > 0:
            self.gain_gold(tot, "habitat")

    def decide(self):
        self.collect()
        # granjas
        for p in self.plots:
            self.harvest(p)
        empty = [p for p in self.plots if p.crop is None]
        for p in empty:
            c = self.choose_crop(p, len(empty))
            if c:
                self.plant(p, c)
        # resonancia
        self.hatch_ready()
        while len(self.res) < self.res_slots:
            n = len(self.res)
            self.start_resonance()
            if len(self.res) == n:
                break
        self.feed()
        self.star_ups()
        self.assign()
        self.spend_gold()
        self.expeditions(True)
        self.spend_gems()
        self.gambit()
        self.apply_purr()
        self.events()

    # ------------------------------------------------------------------ registro
    def snapshot(self):
        self.assign()
        return dict(
            t=self.t, gps=self.gold_rate(), gps_nom=self.passive_rate_nom(), food_ps=self.food_rate_est(),
            kl=self.kl, species=len(self.owned), stage=self.stage, bosses=self.bosses,
            sp=self.ship_power(), ep=self.enemy_power(self.stage), M=self.M,
            gems_earned=self.gems_earned, gems=self.gems, exps=self.expansions, gold=self.gold,
            gold_earned=self.gold_earned, battles=self.battles, victories=self.victories,
            loot=self.last_battle_gold, mk=dict(self.mk), habs=len(self.habitats),
            avg_lvl=sum(c.level for c in self.cats) / len(self.cats), purr_earned=self.purr_earned,
            scrap=self.scrap, bp=self.bp, ship=self.best_ship()["name"],
        )

    def run(self, hours=None, stop_on_finish=True, row_every=3600):
        T = (hours or self.P["hours"]) * 3600
        next_row = 0.0
        self.gold_rate_cached = self.gold_rate()
        while self.t < T:
            on = self.online()
            if on:
                dt = 2.0
            else:
                dt = min(60.0, self.next_online()) if self.P["mode"] == "sessions" else 2.0
            if self.t >= next_row:
                self.rows.append(self.snapshot())
                next_row += row_every
            self.gold_rate_cached = self.gold_rate()
            self.advance(dt, on)
            self.t += dt
            if on:
                self.act()
            if self.done_t is not None and stop_on_finish:
                self.rows.append(self.snapshot())
                break
        if self.done_t is None:
            self.rows.append(self.snapshot())
        return self

    def act(self):
        P = self.P
        # nueva sesion (casual)
        if P["mode"] == "sessions":
            sid = int(self.t // P["session_every"])
            if sid != self.last_session:
                self.last_session = sid
                self.session_battles = 0
                self.next_decision = self.t
        if self.in_battle_until is not None:
            if self.t >= self.in_battle_until:
                self.in_battle_until = None
                self.battle()
                self.next_battle_ok = self.t + P["gap"]
                self.next_decision = self.t
            else:
                return
        if self.t >= self.next_decision:
            self.decide()
            self.next_decision = self.t + P["tick"]
        # empezar combate
        if self.t >= self.next_battle_ok:
            if P["mode"] == "continuous" or self.session_battles < P.get("battles_per_session", 0):
                self.in_battle_until = self.t + P["battle_dur"]
                if P["mode"] == "sessions":
                    self.session_battles += 1


# --------------------------------------------------------------------------------------
# Reportes
# --------------------------------------------------------------------------------------
def table(rows, every_h=1):
    hdr = ("hora", "oro/s", "comida/s", "Reino", "especies", "etapa", "jefes", "PoderBarco", "PoderEnem",
           "Mom", "gemas(gan)", "exp", "botin/victoria", "barco")
    lines = ["| " + " | ".join(hdr) + " |", "|" + "|".join(["---"] * len(hdr)) + "|"]
    for r in rows:
        if r is not rows[-1] and int(round(r["t"] / 3600)) % every_h != 0:
            continue
        lines.append("| " + " | ".join([
            hm(r["t"]), fmt(r["gps"]), fmt(r["food_ps"]), str(r["kl"]), str(r["species"]),
            f"{(r['stage'] - 1) // 9 + 1}-{(r['stage'] - 1) % 9 + 1}", str(r["bosses"]), fmt(r["sp"]), fmt(r["ep"]),
            f"x{r['M']:.2f}", str(r["gems_earned"]), str(r["exps"]), fmt(r["loot"]), r["ship"],
        ]) + " |")
    return "\n".join(lines)


def milestones_text(g):
    items = sorted(g.milestones.items(), key=lambda kv: kv[1])
    keep = [k for k, _ in items if not k.startswith("etapa ")]
    return "\n".join(f"  {hm(v):>9}  {k}" for k, v in items if k in keep)


def svg_chart(results, path):
    """2 paneles: (A) horas de juego continuo, (B) dias de calendario. log10(oro/s). Sin dependencias."""
    W, PH, L, R, T, GAP = 900, 330, 64, 300, 28, 60
    H = T + PH * 2 + GAP + 40
    ymax = 8
    colors = {"normal": "#2f7ed8", "optimizer": "#d8572a", "casual": "#3a9d5d", "idle": "#8a8a8a", "gambler": "#9b59b6"}
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" font-family="sans-serif" font-size="12">',
             '<rect width="100%" height="100%" fill="#ffffff"/>']

    def panel(y0, title, maxx, unit, per, sel):
        def X(v):
            return L + (W - L - R) * v / maxx
        def Y(v):
            return y0 + (PH - 30) * (1 - max(0, min(ymax, v)) / ymax)
        parts.append(f'<text x="{L}" y="{y0 - 10}" fill="#222" font-weight="bold">{title}</text>')
        for e in range(0, ymax + 1):
            parts.append(f'<line x1="{L}" x2="{W - R}" y1="{Y(e):.1f}" y2="{Y(e):.1f}" stroke="#e8e8e8"/>')
            parts.append(f'<text x="{L - 6}" y="{Y(e) + 4:.1f}" text-anchor="end" fill="#555">{fmt(10 ** e)}</text>')
        for v in range(0, int(maxx) + 1):
            parts.append(f'<text x="{X(v):.1f}" y="{y0 + PH - 12}" text-anchor="middle" fill="#555">{v}{unit}</text>')
        i = 0
        for g in results:
            if g.pk not in sel:
                continue
            pts = []
            for r in g.rows:
                v = r["t"] / per
                if v > maxx:
                    break
                pts.append(f"{X(v):.1f},{Y(math.log10(max(r['gps'], 1))):.1f}")
            c = colors.get(g.pk, "#000")
            parts.append(f'<polyline fill="none" stroke="{c}" stroke-width="2.4" points="{" ".join(pts)}"/>')
            if g.done_t and g.done_t / per <= maxx:
                parts.append(f'<circle cx="{X(g.done_t / per):.1f}" cy="{Y(math.log10(max(g.rows[-1]["gps"], 1))):.1f}" r="4" fill="{c}"/>')
            parts.append(f'<rect x="{W - R + 16}" y="{y0 + 10 + i * 20}" width="14" height="4" fill="{c}"/>')
            short = {"normal": "Normal", "optimizer": "Optimizador", "casual": "Casual", "idle": "Idle puro", "gambler": "Ludopata"}.get(g.pk, g.pk)
            lab = short + (f": fin {hm(g.done_t)}" if g.done_t else ": no termina")
            parts.append(f'<text x="{W - R + 36}" y="{y0 + 16 + i * 20}" fill="#222">{lab}</text>')
            i += 1

    maxh = max(6, math.ceil(max(min(g.rows[-1]["t"] / 3600, 8) for g in results if g.P["mode"] == "continuous")))
    panel(T + 10, "A) Oro/s por hora de juego continuo (escala log)", maxh, "h", 3600, ("normal", "optimizer", "gambler"))
    panel(T + PH + GAP, "B) Oro/s por dia de calendario: sesiones de 6 min cada 3 h (escala log)", 7, "d", 86400, ("casual", "idle"))
    parts.append("</svg>")
    with open(path, "w") as f:
        f.write("\n".join(parts))


def run_profile(B, pk, seed, hours=None, row_every=3600):
    NOMINAL[0] = 0.0
    g = Game(B, pk, seed)
    g.run(hours=hours, row_every=row_every)
    g.nominal_started = NOMINAL[0]
    return g


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default="all")
    ap.add_argument("--seeds", type=int, default=1)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--csv", action="store_true")
    ap.add_argument("--svg", action="store_true")
    ap.add_argument("--balance", default=os.path.join(HERE, "balance.json"))
    ap.add_argument("--every", type=float, default=1.0, help="horas entre filas de la tabla")
    args = ap.parse_args()
    with open(args.balance) as f:
        B = json.load(f)
    profs = [k for k in PROFILES if k != "gambler"] if args.profile == "all" else args.profile.split(",")
    results = []
    for pk in profs:
        row_every = 3600 * args.every if PROFILES[pk]["mode"] == "continuous" else 3600 * 6 * args.every
        g = run_profile(B, pk, args.seed, row_every=row_every)
        results.append(g)
        print(f"\n## {g.P['name']}  (semilla {args.seed})")
        print(f"Termina capitulo: {hm(g.done_t) if g.done_t else 'NO (en ' + str(g.P['hours']) + ' h simuladas)'}")
        print(table(g.rows))
        print("\nHitos:")
        print(milestones_text(g))
        tot = max(1.0, sum(v for v in g.gold_from.values()))
        share = ", ".join(f"{k} {100 * v / tot:.1f}%" for k, v in g.gold_from.items())
        hrs = (g.done_t or g.t) / 3600
        print(f"\nOro por fuente: {share}")
        xt = sum(g.xp_from.values())
        print("XP por fuente: " + ", ".join(f"{k} {100*v/xt:.0f}%" for k, v in sorted(g.xp_from.items(), key=lambda kv: -kv[1])) + f"  (total {xt:.1f} barras)")
        print("Gemas por fuente: " + ", ".join(f"{k} {v}" for k, v in sorted(g.gem_from.items(), key=lambda kv: -kv[1])))
        print(f"Timers productivos: nominal {g.nominal_started/3600:.1f} h, saltado con Ronroneo {g.purr_applied/3600:.1f} h ({100*g.purr_applied/max(1,g.nominal_started):.0f}%)")
        tt = max(1.0, sum(g.gold_to.values()))
        print("Oro gastado en: " + ", ".join(f"{k} {100 * v / tt:.1f}%" for k, v in sorted(g.gold_to.items(), key=lambda kv: -kv[1])))
        print(f"Cartera final: {fmt(g.gold)} oro (= {g.gold / max(1, g.passive_rate_nom()) / 60:.0f} min de ingreso) | habitats {len(g.habitats)} tiers {sorted([h.tier for h in g.habitats], reverse=True)} | expansiones {g.expansions} | Mk {g.mk}")
        print(f"Gambit: apostado {fmt(g.gambit_staked)}, neto {fmt(g.gold_from['gambit'])} | "
              f"Gemas ganadas {g.gems_earned} ({g.gems_earned / hrs:.1f}/h), gastadas {g.gems_spent}, saldo {g.gems} | "
              f"Ronroneo ganado {g.purr_earned / 60:.0f} min ({g.purr_earned / 60 / hrs:.1f} min/h) | "
              f"Batallas {g.battles} (victorias {g.victories})")
        if args.csv:
            path = os.path.join(HERE, f"out_{pk}.csv")
            with open(path, "w") as f:
                keys = ["t", "gps", "food_ps", "kl", "species", "stage", "bosses", "sp", "ep", "M", "gems_earned", "exps", "gold_earned", "loot", "avg_lvl"]
                f.write(",".join(keys) + "\n")
                for r in g.rows:
                    f.write(",".join(str(round(r[k], 3)) if isinstance(r[k], float) else str(r[k]) for k in keys) + "\n")
    if args.svg:
        svg_chart([g for g in results], os.path.join(HERE, "gold_curve.svg"))
    if args.seeds > 1:
        print("\n## Robustez multi-semilla")
        keys = [f"Jefe {b['n']}: {b['name']}" for b in B["bosses"][:-1]] + ["Reino 20", "Reino 30", "Reino 40", "Expansion 8: Atolon Estelar", "CAPITULO TERMINADO"]
        for pk in profs:
            fins = []
            ms = {k: [] for k in keys}
            for s in range(args.seeds):
                g = run_profile(B, pk, 1000 + s)
                fins.append(g.done_t)
                for k in keys:
                    ms[k].append(g.milestones.get(k))
            done = [x for x in fins if x is not None]
            def q(v, p):
                v = sorted(v)
                return v[min(len(v) - 1, int(p * len(v)))]
            line = f"{PROFILES[pk]['name']:<24} terminan {len(done)}/{args.seeds}"
            if done:
                line += f" | fin mediana {hm(statistics.median(done))}  P10 {hm(q(done, 0.1))}  P90 {hm(q(done, 0.9))}"
            print(line)
            for k in keys[:-1]:
                v = [x for x in ms[k] if x is not None]
                if v:
                    print(f"    {k:<32} mediana {hm(statistics.median(v))}  ({len(v)}/{args.seeds})")


if __name__ == "__main__":
    main()
