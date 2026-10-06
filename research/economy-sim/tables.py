#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera las tablas de contenido (markdown) directamente desde balance.json.
Uso: python3 tables.py > tablas.md   (asi el documento de diseno nunca diverge del JSON)"""
import json
import os

import sim

HERE = os.path.dirname(os.path.abspath(__file__))
B = json.load(open(os.path.join(HERE, "balance.json")))
fmt = sim.fmt


def mmss(s):
    s = int(s)
    if s < 60:
        return f"{s} s"
    if s < 3600:
        return f"{s // 60} min" + (f" {s % 60} s" if s % 60 else "")
    return f"{s // 3600} h" + (f" {s % 3600 // 60} min" if s % 3600 // 60 else "")


def crops():
    U = B["farms"]["upgrade"]
    print("| # | Cultivo | Reino | Tiempo | Costo (oro) | Comida | Comida/min (granja nv1) | Comida/min (granja nv15) | Comida por oro |")
    print("|---|---|---|---|---|---|---|---|---|")
    for i, c in enumerate(B["farms"]["crops"], 1):
        pm = c["food"] / c["time_s"] * 60
        print(f"| {i} | {c['name']} | {c['kl']} | {mmss(c['time_s'])} | {fmt(c['cost'])} | {fmt(c['food'])} | {fmt(pm)} | "
              f"{fmt(pm * U['yield_growth'] ** (U['max_level'] - 1))} | {c['food'] / c['cost']:.2f} |")


def farm_levels():
    U = B["farms"]["upgrade"]
    print("| Nivel granja | Rendimiento | Costo de mejora | Tiempo de mejora |")
    print("|---|---|---|---|")
    for lv in (1, 3, 5, 8, 10, 12, 15):
        cost = U["cost_base"] * U["cost_growth"] ** (lv - 2) if lv > 1 else 0
        t = U["time_base_s"] * U["time_growth"] ** (lv - 2) if lv > 1 else 0
        print(f"| {lv} | x{U['yield_growth'] ** (lv - 1):.1f} | {fmt(cost) if lv > 1 else '-'} | {mmss(t) if lv > 1 else '-'} |")


def habitats():
    print("| Tier | Habitat | Reino | Capacidad | Mult. oro | Bufer offline | Costo (oro) | Cristales | Construccion |")
    print("|---|---|---|---|---|---|---|---|---|")
    for t in B["habitats"]["tiers"]:
        print(f"| {t['tier']} | {t['name']} | {t['kl']} | {t['capacity']} | x{t['mult']} | {t['buffer_min']} min | "
              f"{fmt(t['cost']) if t['cost'] else 'gratis*'} | {t['crystals'] or '-'} | {mmss(t['build_s'])} |")


def expansions():
    print("| # | Expansion | Reino | Costo | Limpieza | +Parcelas habitat | +Parcelas granja | Bonus | Que abre |")
    print("|---|---|---|---|---|---|---|---|---|")
    for e in B["expansions"]:
        bo = ", ".join(f"{k} +{v}" for k, v in e["bonus"].items())
        print(f"| {e['n']} | {e['name']} | {e['kl']} | {fmt(e['cost'])} | {mmss(e['clear_s'])} | {e['hab_plots']} | {e['farm_plots']} | {bo} | {e['opens']} |")


def modules():
    F = B["ship"]["families"]
    MK = B["ship"]["mk"]
    roman = ["I", "II", "III", "IV", "V", "VI", "VII"]
    print("| Mk | Casco | Arma | Escudo | Motor | Nucleo | Chatarra | Planos | Cristales (Arma/Escudo/Nucleo) | Tiempo | Poder x |")
    print("|---|---|---|---|---|---|---|---|---|---|---|")
    for n in range(1, MK["max"] + 1):
        row = [f"Mk {roman[n - 1]}"]
        for f in ("hull", "weapon", "shield", "engine", "core"):
            row.append(fmt(F[f]["cost_base"] * F[f]["cost_growth"] ** (n - 1)))
        row += [str(MK["scrap"][n - 1]), str(MK["blueprints"][n - 1]), str(MK["crystals_weapon_shield_core"][n - 1]),
                mmss(MK["time_s"][n - 1]) if MK["time_s"][n - 1] else "-", f"{MK['power_growth'] ** (n - 1):.1f}"]
        print("| " + " | ".join(row) + " |")


def ships():
    print("| Barco | Tripulacion | Casco | Armas | Escudos | Motor | Nucleo | Mult. | Costo | Desbloqueo | Rasgo |")
    print("|---|---|---|---|---|---|---|---|---|---|---|")
    for s in B["ship"]["ships"]:
        sl = s["slots"]
        print(f"| {s['name']} | {s['crew']} | {sl['hull']} | {sl['weapon']} | {sl['shield']} | {sl['engine']} | {sl['core']} | x{s['mult']} | "
              f"{fmt(s['cost']) if s['cost'] else '-'} | {s['unlock']}{' / evento ' + s['event_free'] if s.get('event_free') else ''} | {s['perk']} |")


def zones():
    C = B["combat"]
    print("| Zona | Nombre | Etapa 1 | Etapa 8 | Jefe | Jefe (Reino min) | Recompensa del jefe |")
    print("|---|---|---|---|---|---|---|")
    for z, b in zip(C["zones"], B["bosses"]):
        last = z["boss_power"] / C["boss_over_last_stage"]
        print(f"| {z['n']} | {z['name']} | {fmt(z['stage1_power'])} | {fmt(last)} | {b['name']}: {fmt(z['boss_power'])} | {b['kl']} | "
              f"{', '.join(b['unlocks'])}, {b['gems']} gemas |")


def cats_curve():
    C = B["cats"]
    R = B["rarities"]
    print("| Nivel | Oro/s Comun | Oro/s Epico | Comida para subir (Comun) | Comida acumulada (Comun) | Poder Comun |")
    print("|---|---|---|---|---|---|")
    acc = 0
    for lv in range(1, 51):
        cost = C["feed_cost_base"] * C["feed_cost_growth"] ** (lv - 1)
        if lv in (1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50):
            print(f"| {lv} | {fmt(R['gold_base_per_s']['common'] * C['gold_per_level'] ** (lv - 1))} | "
                  f"{fmt(R['gold_base_per_s']['epic'] * C['gold_per_level'] ** (lv - 1))} | {fmt(cost) if lv < 50 else '-'} | {fmt(acc)} | "
                  f"{fmt(R['power_base']['common'] * C['power_per_level'] ** (lv - 1))} |")
        acc += cost


def stars():
    S = B["cats"]["stars"]
    R = B["rarities"]
    print("| Paso | Nivel minimo | Comun | Raro | Epico | Legendario | Mitico | Mult. resultante | Desbloquea |")
    print("|---|---|---|---|---|---|---|---|---|")
    tot = {r: 0 for r in R["order"]}
    for i, step in enumerate(S["orb_steps"]):
        cells = []
        for r in R["order"]:
            n = R["star_orbs_base"][r] * step
            tot[r] += n
            cells.append(str(n))
        print(f"| {i + 1}->{i + 2} estrellas | {S['min_level'][i]} | " + " | ".join(cells) + f" | x{S['mult'][i + 1]} | {S['unlocks'][i + 1]} |")
    print("| **Total 1->6** | | " + " | ".join(f"**{tot[r]}**" for r in R["order"]) + " | | |")
    print("| Duplicado da | | " + " | ".join(str(R["duplicate_orbs"][r]) for r in R["order"]) + " | | |")


def resonance_examples():
    g = sim.Game(B, "normal", 1)
    g.elements = {"fire", "water", "nature", "earth", "storm", "magic", "cosmic"}

    def mk(sid, lvl):
        c = sim.Cat(g.species[sid])
        c.level = lvl
        return c

    ex = [("Canelo (Fuego, Comun) nv1 + Gelatino (Agua, Comun) nv1", mk("c_canelo", 1), mk("c_gelatino", 1)),
          ("Canelo nv18 + Gelatino nv18 (ya habilita Epico)", mk("c_canelo", 18), mk("c_gelatino", 18)),
          ("Neblino (Fuego/Agua, Raro) nv22 + Canelo (Fuego) nv22", mk("r_neblino", 22), mk("c_canelo", 22)),
          ("Solar (Fuego/Cosmico, Raro) nv25 + Astral (Magia/Cosmico, Raro) nv25", mk("r_solar", 25), mk("r_astral", 25))]
    for title, a, b in ex:
        d = g.res_distribution(a, b)
        sp, sids = g._secret_p, g._secret_ids
        agg = {}
        for sid, p in d.items():
            if sid in sids:
                p -= sp / len(sids)  # parte secreta se muestra aparte como ???
            if p <= 1e-9:
                continue
            r = g.species[sid]["rarity"]
            agg.setdefault(r, []).append((g.species[sid]["name"], p))
        print(f"\n**{title}**\n")
        print("| Rareza | Prob. total | Candidatos (prob. c/u) |")
        print("|---|---|---|")
        for r in B["rarities"]["order"]:
            if r in agg:
                tot = sum(p for _, p in agg[r])
                cand = ", ".join(f"{n} {100 * p:.1f}%" for n, p in sorted(agg[r], key=lambda x: -x[1])[:6])
                if len(agg[r]) > 6:
                    cand += f" (+{len(agg[r]) - 6} mas)"
                print(f"| {B['rarities']['names'][r]} | {100 * tot:.1f}% | {cand} |")
        if sp:
            print(f"| ??? (secreto) | {100 * sp:.1f}% | un Epico/Legendario aun no descubierto cuyos elementos ya conoces |")


def catdex():
    names = {e["id"]: e["name"] for e in B["elements"]}
    print("| Rareza | Gato | Elementos | Trabajador | Como se obtiene |")
    print("|---|---|---|---|---|")
    for c in B["catdex"]:
        print(f"| {B['rarities']['names'][c['rarity']]} | {c['name']} | {' + '.join(names[e] for e in c['el'])} | "
              f"{B['cats']['workers'][c['worker']]['name'] if c['worker'] else '-'} | {c['source']}"
              f"{' (padres >= nv' + str(c['min_parent_level']) + ')' if c.get('min_parent_level') and c['source'] == 'resonance' else ''} |")


def automation():
    print("| Reino | Automatizacion |")
    print("|---|---|")
    for a in B["automation"]:
        print(f"| {a['kl']} | {a['name']} |")


if __name__ == "__main__":
    for title, fn in [("Cultivos", crops), ("Niveles de granja", farm_levels), ("Habitats", habitats), ("Expansiones", expansions),
                      ("Modulos del barco (costo en oro por familia)", modules), ("Barcos", ships), ("Zonas y jefes", zones),
                      ("Curva del gato", cats_curve), ("Estrellas y orbes", stars), ("Ejemplos de Resonancia", resonance_examples),
                      ("Catdex", catdex), ("Automatizacion", automation)]:
        print(f"\n### {title}\n")
        fn()
