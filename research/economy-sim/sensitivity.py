#!/usr/bin/env python3
"""Sensibilidad: como cambia el tiempo de fin (mediana, 8 semillas) al mover una palanca de balance.
Sirve de guia para rebalancear en updates sin re-simular a ciegas."""
import copy, json, os, statistics
import sim
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = json.load(open(os.path.join(HERE, "balance.json")))
SEEDS = 8


def scale_purr(B, k):
    for key in B["ronroneo"]["base_min"]:
        B["ronroneo"]["base_min"][key] *= k


def scale_bosses(B, k):
    for z in B["combat"]["zones"]:
        z["boss_power"] *= k
        z["stage1_power"] *= k


LEVERS = [
    ("base (balance.json)", lambda B: None),
    ("Ronroneo x0.5", lambda B: scale_purr(B, 0.5)),
    ("Ronroneo x1.5", lambda B: scale_purr(B, 1.5)),
    ("XP drag 0.025 (Reino mas rapido)", lambda B: B["kingdom"].__setitem__("xp_drag_per_level", 0.025)),
    ("XP drag 0.035 (Reino mas lento)", lambda B: B["kingdom"].__setitem__("xp_drag_per_level", 0.035)),
    ("Poder enemigo -10%", lambda B: scale_bosses(B, 0.9)),
    ("Poder enemigo +10%", lambda B: scale_bosses(B, 1.1)),
    ("Jefe final +10%", lambda B: B["combat"]["zones"][5].__setitem__("boss_power", B["combat"]["zones"][5]["boss_power"] * 1.1)),
    ("Botin batalla 20 s de ingreso", lambda B: B["combat"]["reward"].__setitem__("gold_income_seconds", 20)),
    ("Botin batalla 80 s de ingreso", lambda B: B["combat"]["reward"].__setitem__("gold_income_seconds", 80)),
    ("Momentum max x2", lambda B: B["momentum"].__setitem__("max", 2.0)),
    ("Planos 25% por victoria", lambda B: B["combat"]["reward"].__setitem__("blueprint_chance", 0.25)),
    ("Oro por nivel de gato 1.15", lambda B: B["cats"].__setitem__("gold_per_level", 1.15)),
    ("Costo comida por nivel 1.29", lambda B: B["cats"].__setitem__("feed_cost_growth", 1.29)),
]


def med(B, pk):
    v = []
    for s in range(SEEDS):
        g = sim.run_profile(B, pk, 3000 + s)
        v.append((g.done_t or g.t) / 3600)
    return statistics.median(v)


print("| Palanca | Normal (h) | Optimizador (h) |")
print("|---|---|---|")
for name, fn in LEVERS:
    B = copy.deepcopy(BASE)
    fn(B)
    print(f"| {name} | {med(B, 'normal'):.2f} | {med(B, 'optimizer'):.2f} |", flush=True)
