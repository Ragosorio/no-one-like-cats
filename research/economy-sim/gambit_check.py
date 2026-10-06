#!/usr/bin/env python3
"""Mide cuanto aporta Cat's Gambit (y su varianza) en 24 semillas por perfil."""
import json, os, statistics
import sim
HERE = os.path.dirname(os.path.abspath(__file__))
B = json.load(open(os.path.join(HERE, "balance.json")))
for pk in ("normal", "optimizer", "gambler"):
    shares, fins, gem_g = [], [], []
    for s in range(24):
        g = sim.run_profile(B, pk, 2000 + s)
        tot = sum(v for k, v in g.gold_from.items() if k != "gambit") or 1
        shares.append(100 * g.gold_from["gambit"] / tot)
        fins.append((g.done_t or g.t) / 3600)
        gem_g.append(g.gem_from.get("gambit", 0))
    print(f"{sim.PROFILES[pk]['name']:<42} Gambit neto/oro no-Gambit: media {statistics.mean(shares):+.1f}%  "
          f"min {min(shares):+.1f}%  max {max(shares):+.1f}% | fin mediana {statistics.median(fins):.2f} h | gemas netas Gambit media {statistics.mean(gem_g):.1f}")
