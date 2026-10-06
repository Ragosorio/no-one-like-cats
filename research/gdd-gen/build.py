# -*- coding: utf-8 -*-
"""Ensambla research/04-content.json desde los módulos de contenido + balance.json (solo lectura)
y rellena las tablas del GDD (plantilla gdd_template.md -> research/04-gdd-no-one-like-cats.md)."""
import json, os, sys, math, re, itertools

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = "/Users/roor.osorio/Desktop/No one"
RES = os.path.join(ROOT, "research")
sys.path.insert(0, HERE)

import c_elements as CE
import c_cats as CC
import c_world as CW
import c_events as CV
import c_missions as CM

B = json.load(open(os.path.join(RES, "economy-sim", "balance.json")))

EL7 = ["fire", "water", "nature", "earth", "storm", "magic", "cosmic"]
EMO = {e["id"]: e["emoji"] for e in CE.ELEMENTS}
ENAME = {e["id"]: e["name"] for e in CE.ELEMENTS}
RNAME = {"common": "Común", "rare": "Raro", "epic": "Épico", "legendary": "Legendario", "mythic": "Mítico"}
RANK = {"common": 0, "rare": 1, "epic": 2, "legendary": 3, "mythic": 4}

# ------------------------------------------------------------------ fixes puntuales
for u in CW.UTILITY_MODULES:
    if u["kind"] == "pantry":
        u["unlock"] = "mission:K06"

# ------------------------------------------------------------------ validación de gatos contra balance
bal_cat = {c["id"]: c for c in B["catdex"]}
cats = CC.CATS
ids = [c["id"] for c in cats]
assert len(ids) == len(set(ids)), "ids de gato duplicados"
for c in cats:
    if c["secret"]:
        continue
    b = bal_cat[c["id"]]
    assert b["rarity"] == c["rarity"], (c["id"], b["rarity"], c["rarity"])
    assert b["el"] == c["elements"], (c["id"], b["el"], c["elements"])
    assert (b.get("worker") or None) == (c["worker"] or None), (c["id"], b.get("worker"), c["worker"])
    c["obtain"]["balanceSource"] = b["source"]
    if b.get("min_parent_level"):
        c["obtain"]["minParentLevel"] = b["min_parent_level"]
    c["balanceName"] = b["name"]
missing = set(bal_cat) - set(ids)
assert not missing, missing
base_slugs = [c["art"]["slug"] for c in cats if not c["art"]["tint"]]
assert len(base_slugs) == 32 and len(set(base_slugs)) == 32, (len(base_slugs), len(set(base_slugs)))
assert set(base_slugs) == set(CC.AURA), set(CC.AURA) ^ set(base_slugs)

# ------------------------------------------------------------------ Resonancia (espejo exacto de las reglas de balance/sim)
RS = B["resonance"]
catdex48 = B["catdex"]


def res_dist(A, Bset, minlvl, rk=0, known=set(EL7), owned=frozenset(), pity=0):
    U = (set(A) | set(Bset)) & known
    shared = set(A) & set(Bset)
    buckets = {"common": [], "rare": [], "epic": [], "legendary": []}
    for sp in catdex48:
        r = sp["rarity"]
        if r == "mythic":
            continue
        els = set(sp["el"])
        if not els <= known:
            continue
        if r in ("common", "rare") and els <= U:
            buckets[r].append(sp["id"])
        elif r == "epic" and els <= U and minlvl >= sp.get("min_parent_level", 15):
            buckets["epic"].append(sp["id"])
        elif r == "legendary" and els <= shared and minlvl >= sp.get("min_parent_level", 20):
            buckets["legendary"].append(sp["id"])
    W = dict(RS["bucket_weights"])
    W["epic"] += RS["parent_rarity_bonus"]["epic_per_rank"] * rk + min(RS["pity"]["cap"], pity * RS["pity"]["epic_bonus_per_miss"])
    W["legendary"] += RS["parent_rarity_bonus"]["legendary_per_rank"] * rk
    secret = [sp["id"] for sp in catdex48 if sp["rarity"] in ("epic", "legendary") and sp["source"] == "resonance"
              and set(sp["el"]) <= known and sp["id"] not in owned]
    buckets["secret"] = secret
    tot = sum(W[k] for k, v in buckets.items() if v)
    res, secret_pct = [], 0.0
    for k in ("common", "rare", "epic", "legendary"):
        for sid in buckets[k]:
            res.append({"cat": sid, "name": bal_cat[sid]["name"], "rarity": k, "pct": round(100 * W[k] / tot / len(buckets[k]), 2)})
    if secret:
        secret_pct = round(100 * W["secret"] / tot, 2)
    return res, secret_pct, len(secret)


recipes = []
for a, b in itertools.combinations_with_replacement(EL7, 2):
    for scen, lvl in (("padres Nv<15", 1), ("padres Nv20+", 20)):
        res, sp, ns = res_dist([a], [b], lvl)
        recipes.append({"id": f"rec_{a}_{b}_{'low' if lvl == 1 else 'high'}", "parents": [a, b], "scenario": scen,
                        "assumptions": "Padres Comunes de un solo elemento (rango 0), sin pity, los 7 elementos descubiertos, sin especies épicas/legendarias registradas (bucket ??? lleno).",
                        "results": res, "secretPct": sp, "secretCandidates": ns})
# ejemplos de padres híbridos (regla de la UNIÓN de elementos)
HYB = [(("r_pimenton", ["fire", "nature"]), ("c_gelatino", ["water"]), 20, 1),
       (("e_infernal", ["fire", "earth"]), ("e_galaxia", ["water", "cosmic"]), 20, 4),
       (("r_marejada", ["water", "storm"]), ("r_astral", ["magic", "cosmic"]), 30, 2),
       (("c_canelo", ["fire"]), ("c_gelatino", ["water"]), 1, 0),
       (("c_canelo", ["fire"]), ("c_brote", ["nature"]), 1, 0)]
for (ia, ea), (ib, eb), lvl, rk in HYB:
    known = set(EL7) if ia != "c_canelo" else {"fire", "water", "nature"}
    res, sp, ns = res_dist(ea, eb, lvl, rk=rk, known=known)
    recipes.append({"id": f"rec_ej_{ia}_{ib}", "parents": [ia, ib], "scenario": f"ejemplo: ambos Nv{lvl}, suma de rangos de rareza {rk}" + (" (al inicio del juego: solo 🔥💧🌿 descubiertos)" if ia == "c_canelo" else ""),
                    "assumptions": "Unión de elementos de ambos padres; tabla tal cual la vería el jugador.", "results": res, "secretPct": sp, "secretCandidates": ns})

SECRET_RECIPES = [
    {"cat": "s_maneki", "condition": "Dos padres con oficio Banquero (balance worker 'banker'), ambos Nv15+.", "bucket": "secret (balance.resonance.bucket_weights.secret)", "altRoute": "10.º Gato Callejero."},
    {"cat": "s_caos", "condition": "Unión de padres incluye ⚡ y 🌌, con un Evento Flash activo.", "bucket": "secret", "altRoute": "Microevento Error 404."},
    {"cat": "s_sonata", "condition": "Unión de padres cubre ✨, 🌌 y ⚡; ambos Nv30+.", "bucket": "secret", "altRoute": "Santuario Gatuno Antiguo (Ruinas Arcanas)."},
    {"cat": "s_lumen", "condition": "Unión de padres cubre 🔥, 💧 y 🌿; ambos ★3+.", "bucket": "secret", "altRoute": "Registrar 40 especies."},
    {"cat": "s_eclipse", "condition": "Uno de los padres es Solar (r_solar) y el otro tiene 🌌; uno de los dos Nv20+ (CHARLA).", "bucket": "secret", "altRoute": "Ganar con Solar y Lunita a bordo durante Estrella Fugaz."},
    {"cat": "s_noctis", "condition": "No sale por Resonancia.", "bucket": None, "altRoute": "Historia: tras el jefe final."}
]
RESONANCE_RULES = {
    "balanceRules": RS["rules"],
    "weights": "balance.resonance.bucket_weights (común 55, raro 30, épico 11, legendario 3.5, secreto 0.5) + parent_rarity_bonus + pity (épico +1 por intento fallido, tope 15).",
    "times": "balance.rarities.resonance_time_s por rareza del RESULTADO (Común 3 min, Raro 10, Épico 30, Legendario 45). El reloj se muestra como UNO solo con dos fases: 'Resonando' (65%) y 'Eclosionando' (35% = hatch_share_of_time). Al empezar la 2.ª fase el portal toma el COLOR de la rareza (pista honesta: dorado = Épico o más).",
    "secretBucket": "El bucket '???' (0.5%) contiene: especies Épicas/Legendarias de Resonancia NO registradas cuyos elementos ya conoces (regla de sim.py) + los gatos secretos cuya condición se cumple en esa pareja. La UI lo muestra como una sola fila '??? x%'.",
    "secretPity": "DISEÑO (no simulado): si la pareja cumple la condición de un gato secreto, cada intento fallido suma +0.5 puntos al bucket '???' de esa misma condición (tope 5%).",
    "firstResonance": "Tutorial (balance.timer_rules.tutorial_first_resonance): Canelo + Brote, resultado garantizado en 90 s. Diseño elige PIMENTÓN (Raro) de las dos opciones que permite balance (Pimentón o Chispa), porque la regla 'el primer resultado de cada sistema nuevo es bueno' pide ≥ Raro.",
    "duplicates": "Duplicado → balance.rarities.duplicate_orbs (10/20/35/60/100). Si el duplicado trae mutación, el jugador elige: quedarse los orbes o transferir la mutación al gato que ya tiene.",
    "mutations": "Desde el hito de Reino 'Mutaciones' (KL20): 8% por Resonancia (x2 si ambos padres viven en el mismo hábitat). El hábitat sesga el sorteo hacia su mutación temática (fuego → Chamuscado/Scorched). Solo efectos de combate (no tocan la economía de balance).",
    "inheritance": "Desde 'Herencia' (KL30): 50% de que el hijo herede el RASGO de un padre (si no, rasgo de su especie). Desde 'Linaje' (KL35): 10% de mutación 'Eco Paterno' (hereda un modificador de disparo: Fireball + Triple Shot = Triple Fireball).",
    "copy": CV.RESONANCE_COPY,
    "revealCopy": CV.REVEAL_COPY
}

# ------------------------------------------------------------------ enemigos por zona (poder con la regla de balance)
C = B["combat"]
enemies = []
for z in C["zones"]:
    n = z["n"]
    s1, boss = z["stage1_power"], z["boss_power"]
    last = boss / C["boss_over_last_stage"]
    elite = next(e for e in CW.ELITES if e["zone"] == n)
    zone_entry = {"zone": n, "name": z["name"], "elements": z["enemy_elements"], "aiDifficulty": CW.ZONE_AI[n], "stages": []}
    pool = [sp for sp in catdex48 if sp["rarity"] != "mythic" and set(sp["el"]) <= set(z["enemy_elements"]) | ({"fire", "water", "nature"} if n == 1 else set())]
    for k in range(1, 10):
        if k == 9:
            bd = CW.BOSSES[n - 1]
            zone_entry["stages"].append({"stage": f"{n}-9", "name": bd["name"], "type": "boss", "boss": bd["id"], "power": boss,
                                         "personality": bd["ai"]["personality"], "aiDifficulty": bd["ai"]["difficulty"]})
            continue
        ep = round(s1 * (last / s1) ** ((k - 1) / 7), 1)
        nm, arch, pers = CW.ZONE_STAGES[n][k - 1]
        typ = "elite" if k == 5 else "normal"
        if k == 5:
            nm = f"{elite['name']} — {elite['ship']}"
            pers = elite["personality"]
        maxr = 0 if k <= 3 else (1 if k <= 6 else 2)
        if n >= 4:
            maxr += 1
        cands = [sp for sp in pool if RANK[sp["rarity"]] <= maxr]
        cands.sort(key=lambda sp: (-RANK[sp["rarity"]], sp["id"]))
        crew_n = CW.ENEMY_ARCHETYPES[arch]["catrooms"]
        crew = [cands[(i * 3 + k + n) % len(cands)]["id"] for i in range(crew_n)] if cands else []
        unknown = [e for e in z["enemy_elements"] if (e == "magic" and n == 4) or (e == "cosmic" and n == 5)]
        st = {"stage": f"{n}-{k}", "name": nm, "type": typ, "archetype": arch, "personality": pers, "power": ep,
              "enemyCats": crew, "aiDifficulty": CW.ZONE_AI[n]}
        if k == 1 and n == 1:
            st.update({"name": "El Patito Pirata", "archetype": "patito (ver bosses.story_patito)", "personality": "torpe", "enemyCats": ["c_gelatino"],
                       "note": "Tutorial: no se puede perder (el enemigo hace 30% de daño)."})
        if unknown:
            st["unknownElementsUntil"] = {"magic": "balance kl:24 (Heraldo)", "cosmic": "jefe 5"} if n == 4 else {"cosmic": "jefe 5"}
        if k == 5:
            st["eliteRule"] = elite["rule"]
            st["eliteLine"] = elite["line"]
        zone_entry["stages"].append(st)
    zone_entry["errands"] = [e for e in CW.ERRANDS if e["zone"] == n]
    enemies.append(zone_entry)

# ------------------------------------------------------------------ expansiones (balance + diseño)
expansions = []
for e in B["expansions"]:
    x = CV.EXPANSION_EXTRAS[e["n"]]
    expansions.append({"n": e["n"], "id": x["id"], "name": e["name"], "biome": x["biome"], "region": x["region"],
                       "balance": {"kl": e["kl"], "cost": e["cost"], "clear_s": e["clear_s"], "hab_plots": e["hab_plots"],
                                   "farm_plots": e["farm_plots"], "bonus": e["bonus"], "opens": e["opens"]},
                       "opensDesign": x["opensDesign"], "secret": x["secret"], "visual": x["visual"]})

# ------------------------------------------------------------------ automatizaciones
automation = [{"kl": a["kl"], "id": a["id"], "name": a["name"], "source": "balance.automation", "rule": None} for a in B["automation"]]
AUTO_RULES = {
    "collect_all": "Botón 'Recolectar todo' en la HUD (cascada única de monedas, storyboard h).",
    "feed_bulk": "En el panel del gato: 'Alimentar hasta Nv X' (slider; respeta el tope KL+5). Niveles intermedios T0, último T1.",
    "crop_repeat": "Cada parcela recuerda su última receta y la vuelve a sembrar al cosechar (si hay Doblones).",
    "kingdom_bank": "Banco del Reino (edificio 2x2): el oro de todos los hábitats entra solo a la cartera; ignora el tope 'LLENO'. Offline hasta 2 h (+2 h con el Puerto).",
    "resonance_queue": "Cola de 3 parejas por ranura: al revelarse una, arranca la siguiente.",
    "auto_harvest": "'Mar de Pescados Automático': las cosechas listas van solas al Silo (la comida entra sin clic).",
    "workers": "Panel de Oficios: asigna gatos con oficio (balance.cats.workers). Trabajando NO suben al barco.",
    "auto_feed": "Regla por hábitat: 'mantener a sus gatos en el tope de nivel' o 'hasta Nv X'; gasta comida sola.",
    "auto_expedition": "Las expediciones se relanzan solas con la misma tripulación y duración.",
    "auto_star": "Las estrellas se suben solas al juntar orbes (si el nivel lo permite) y los módulos nuevos se equipan solos si suben el Poder de Barco.",
    "auto_battle": "Simulacro: batallas automáticas en etapas ya ganadas mientras haces otra cosa (70% del botín, balance).",
    "fleet_orders": "Órdenes de flota: el barco que NO está activo farmea la mejor etapa ganada en segundo plano."
}
for a in automation:
    a["rule"] = AUTO_RULES.get(a["id"])
for a in CV.AUTOMATION_EXTRAS:
    automation.append({"kl": a["kl"], "id": a["id"], "name": a["name"], "source": "diseño (no simulado)", "rule": a["rule"]})
automation.sort(key=lambda a: (a["kl"], a["id"]))

# ------------------------------------------------------------------ hitos de Reino (KL 1..50)
km = {k: [] for k in range(1, B["kingdom"]["level_cap"] + 1)}


def add(k, txt, kind, rule=False):
    if 1 <= k <= B["kingdom"]["level_cap"]:
        km[k].append({"text": txt, "kind": kind, "changesRules": rule})


for a in automation:
    add(a["kl"], f"Automatización: {a['name']}", "automation", True)
for t in B["habitats"]["tiers"]:
    if t["tier"] > 1:
        add(t["kl"], f"Hábitat tier {t['tier']}: {t['name']} (x{t['mult']}, cap. {t['capacity']})", "habitat")
for cr in B["farms"]["crops"]:
    if cr["kl"] > 1:
        add(cr["kl"], f"Cultivo: {cr['name']} ({cr['time_s']} s → {cr['food']} comida)", "crop")
for e in B["expansions"]:
    add(e["kl"], f"Expansión disponible: {e['name']}", "expansion")
for s in B["ship"]["ships"]:
    if s["unlock"].startswith("kl:"):
        add(int(s["unlock"][3:]), f"Barco en el astillero: {s['name']}", "ship")
for f in CV.FLASH_SCHEDULE:
    ft = next(t for t in CV.FLASH_TYPES if t["id"] == f["type"])
    add(f["kl"], f"Presagio de Evento Flash: {ft['name']}", "event")
for h in B["events"]["heroic"]:
    add(h["kl"], f"Presagio de Expedición Heroica: {h['name']}", "event")
add(B["events"]["black_flag"]["kl"], "Presagio: Bandera Negra (evento de 20 min)", "event")
for e in B["elements"]:
    if e["unlock"].startswith("kl:"):
        add(int(e["unlock"][3:]), f"Historia: 'Algo viene' → elemento {e['name']}", "element", True)
add(20, "Hito: MUTACIONES (las Resonancias pueden traer mutación de combate)", "rule", True)
add(30, "Hito: HERENCIA (el hijo puede heredar el rasgo de un padre)", "rule", True)
add(35, "Hito: LINAJE (mutación 'Eco Paterno': hereda un modificador de disparo)", "rule", True)
add(36, "Historia: Revancha del Patito Pirata", "story")
add(38, "Historia: A VOID SHIP HAS ENTERED YOUR WORLD", "story")
for k in range(1, B["kingdom"]["level_cap"] + 1):
    if k % B["kingdom"]["milestone_gems_every"] == 0:
        add(k, f"Hito: +{B['kingdom']['milestone_gems']} gemas", "gems")
kingdom = [{"kl": k, "catLevelCap": min(B["kingdom"]["level_cap_cats"], k + 5), "unlocks": v} for k, v in km.items()]

# ------------------------------------------------------------------ eventos
events = {
    "rules": {"micro": CV.MICRO_RULES, "flash": CV.FLASH_RULES, "heroic": CV.HEROIC_NOTE,
              "clocks": "VERDE = tiempo productivo (se acelera jugando, corre offline). ROJO = tiempo de desafío (sagrado: no se pausa, no se extiende, ni con gemas; corre en tiempo de juego)."},
    "micro": CV.MICRO_EVENTS,
    "flashTypes": CV.FLASH_TYPES,
    "flashSchedule": CV.FLASH_SCHEDULE,
    "flashBalance": B["events"]["flash"],
    "heroic": CV.HEROICS,
    "special": [CV.BLACK_FLAG] + CV.STORY_EVENTS
}

# ------------------------------------------------------------------ misiones (validación)
mids = [m["id"] for m in CM.MISSIONS]
assert len(mids) == len(set(mids))
for m in CM.MISSIONS:
    for part in re.split(r"\s*&\s*", m["trigger"]):
        if part.startswith("mission:"):
            assert part[8:] in mids, (m["id"], part)
    for u in m["unlocks"]:
        if re.fullmatch(r"[HCKE]\d\d", u):
            assert u in mids, (m["id"], u)

# ------------------------------------------------------------------ JSON final
content = {
    "meta": {
        "game": "NO ONE LIKE CATS", "chapter": 1, "chapterName": "El Primer Mar", "tagline": "Cute cats. Terrible consequences.",
        "language": "es-419", "logicalScreen": [1920, 1080],
        "authority": "Los NÚMEROS de economía viven en research/economy-sim/balance.json (fuente única). Este archivo es CONTENIDO y referencia claves de balance con el prefijo 'balance:'. Si hay discrepancia numérica, gana balance.json.",
        "balanceVersion": B["meta"]["version"], "gdd": "research/04-gdd-no-one-like-cats.md",
        "counts": {}
    },
    "elements": CE.ELEMENTS,
    "affinity": CE.AFFINITY,
    "materials": CE.MATERIALS,
    "statuses": CE.STATUSES,
    "reactions": CE.REACTIONS,
    "roles": CE.ROLES,
    "workers": CE.WORKERS,
    "traits": CE.TRAITS,
    "mutations": CE.MUTATIONS,
    "catdexSets": CE.CATDEX_SETS,
    "tintDecals": ["brasas", "grietas_lava", "musgo", "estrellas", "runas", "lodo", "raices", "vapor", "plasma", "rayos", "lunas", "burbujas", "corona"],
    "cats": cats,
    "catdexTeaser": {"id": "t_void", "name": "???", "elements": ["void"], "label": "Próximo mar", "note": "Silueta que aparece en el Catdex tras el final. No cuenta para el 54/54."},
    "resonanceRules": RESONANCE_RULES,
    "resonanceRecipes": recipes,
    "secretRecipes": SECRET_RECIPES,
    "ships": CW.SHIPS,
    "modules": {"families": CW.FAMILY_MODULES, "utility": CW.UTILITY_MODULES, "relics": CW.RELICS, "artifacts": CW.ARTIFACTS},
    "volley": CW.VOLLEY,
    "catStatuses": CE.CAT_STATUSES,
    "koSequence": CE.KO_SEQUENCE,
    "shipArt": CW.SHIP_ART,
    "aiDifficulty": CW.AI_DIFFICULTY,
    "enemyArchetypes": CW.ENEMY_ARCHETYPES,
    "bosses": CW.BOSSES,
    "elites": CW.ELITES,
    "enemies": enemies,
    "missions": CM.MISSIONS,
    "events": events,
    "expansions": expansions,
    "automation": automation,
    "kingdomMilestones": kingdom,
    "story": {"characters": [
        {"id": "luzterna", "name": "Capitana Luzterna", "role": "Narradora y guía", "art": "assets/cats-source/_extra/guides/luzterna.webp (bruja tuxedo con linterna); fallback: lantern_spirit_cat tintado violeta", "voice": "Sarcástica, protectora, groserías ligeras, rompe la cuarta pared."},
        {"id": "capi", "name": "Capi / Grumete", "role": "El jugador (nunca se ve)", "art": None, "voice": "—"},
        {"id": "noctis", "name": "Velo Noctis", "role": "Rival recurrente → aliada (secreto)", "art": "masquerade_phantom_cat", "voice": "Elegante, burlona, nunca pierde la pose."},
        {"id": "distraxia", "name": "Distraxia, la Niebla del Olvido", "role": "Antagonista del Cap. 1 (lore de Educatione): la niebla que queda cuando NADIE borra una caja; maneja al Leviatán Almirante", "art": "Niebla violeta con muchos ojos, generada en código", "voice": "Mil voces, susurro, 'yo no destruyo: borro'."},
        {"id": "nadie", "name": "NADIE", "role": "Entidad del Vacío (teaser del Cap. 2; idea de 09). Su lema: 'NO ONE LIKES CATS'. El título del juego le contesta sin la 'S'", "art": "Silueta sin cara hecha de estática (código)", "voice": "Una sola voz, plana. Casi no habla."},
        {"id": "patito", "name": "El Patito Pirata", "role": "Tutorial y revancha", "art": "jelly_aquatic_cat + gorro de papel", "voice": "¡Cuac!"},
        {"id": "ganzua", "name": "Don Ganzúa", "role": "Comerciante (microevento)", "art": "Solo ojos en la oscuridad de un bote (código)", "voice": "Susurros de vendedor de tianguis."}
    ], "beats": CV.STORY_BEATS, "defeatCopy": CV.DEFEAT_COPY}
}
content["meta"]["counts"] = {
    "catdexEntries": len(cats), "baseIllustrations": 32, "tintedVariants": sum(1 for c in cats if c["art"]["tint"]),
    "secrets": sum(1 for c in cats if c["secret"]), "byRarity": {r: sum(1 for c in cats if c["rarity"] == r) for r in RNAME},
    "resonanceRecipes": len(recipes), "missions": len(CM.MISSIONS),
    "missionsByChain": {ch: sum(1 for m in CM.MISSIONS if m["chain"] == ch) for ch in ("historia", "capitan", "criador", "explorador")},
    "microEvents": len(CV.MICRO_EVENTS), "flashTypes": len(CV.FLASH_TYPES), "flashScheduled": len(CV.FLASH_SCHEDULE),
    "heroic": len(CV.HEROICS), "specialEvents": 1 + len(CV.STORY_EVENTS),
    "zoneBosses": 6, "elites": len(CW.ELITES), "storyEventBosses": len(CW.BOSSES) - 6,
    "enemyStages": sum(len(z["stages"]) for z in enemies), "errands": len(CW.ERRANDS),
    "ships": len(CW.SHIPS), "expansions": len(expansions), "reactions": len(CE.REACTIONS), "storyBeats": len(CV.STORY_BEATS)
}

out = os.path.join(RES, "04-content.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(content, f, ensure_ascii=False, indent=1)
json.load(open(out, encoding="utf-8"))
print("JSON OK", out, os.path.getsize(out), "bytes")
print(json.dumps(content["meta"]["counts"], ensure_ascii=False))

# ================================================================== TABLAS MARKDOWN
T = {}


def el(c):
    return "".join(EMO[e] for e in c)


def fmt(n):
    if n is None:
        return "—"
    if n < 10000:
        return f"{n:,.0f}"
    suf = ["", "K", "M", "B", "T", "Qa"]
    e = int(math.floor(math.log10(n) / 3))
    v = n / 1000 ** e
    return (f"{v:.2f}" if v < 10 else f"{v:.1f}" if v < 100 else f"{v:.0f}") + suf[e]


def tint_txt(t):
    if not t:
        return "—"
    parts = []
    if t["hue"]:
        parts.append(f"hue {t['hue']:+d}°")
    if t["sat"] != 1:
        parts.append(f"sat x{t['sat']}")
    if t["bright"] != 1:
        parts.append(f"brillo x{t['bright']}")
    if t["overlay"]:
        parts.append(f"capa {t['overlay']} {int(t['overlayAlpha'] * 100)}%")
    if t["decal"]:
        parts.append(f"decal '{t['decal']}'")
    if t["scale"] != 1:
        parts.append(f"escala x{t['scale']}")
    return ", ".join(parts)


gold = B["rarities"]["gold_base_per_s"]
rows = ["| # | id | Arte (slug) | Tinte (variante) | Nombre | Elem. | Rareza | Rol | Oficio | Disparo normal | Ultimate (grito) | Limitación | Pasiva | Oro base/s | Cómo se obtiene |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
for i, c in enumerate(cats, 1):
    cb = c["combat"]
    lim = cb["limitation"]["text"].split(":")[0] if cb["limitation"] else "—"
    rar = RNAME[c["rarity"]] + (" · PRIMORDIAL" if c["primordial"] else "") + (" · ???" if c["secret"] else "")
    g = gold[c["rarity"]] * (c["economy"]["goldMod"] or 1)
    rows.append(f"| {i} | `{c['id']}` | `{c['art']['slug']}` | {tint_txt(c['art']['tint'])} | **{c['name']}**, {c['epithet']} | {el(c['elements'])} | {rar} | {c['role']} | {CE.WORKERS[c['worker']]['name'] if c['worker'] else '—'} | {cb['shot']['name']} ({cb['shot']['archetype']}, {cb['shot']['dmg']}) | {cb['ultimate']['name']} | {lim} | {cb['passive']} | {g:g} | {c['obtain']['how']} |")
T["roster"] = "\n".join(rows)

# recetas: tabla compacta por par
rows = ["| Padres | Escenario | Resultados posibles (%) | ??? |", "|---|---|---|---|"]
for r in recipes:
    if r["id"].startswith("rec_ej"):
        continue
    res = " · ".join(f"{x['name']} {x['pct']:g}%" for x in sorted(r["results"], key=lambda x: -x["pct"]))
    rows.append(f"| {EMO[r['parents'][0]]} + {EMO[r['parents'][1]]} | {r['scenario']} | {res} | {r['secretPct']:g}% |")
T["recipes"] = "\n".join(rows)
rows = []
for r in recipes:
    if not r["id"].startswith("rec_ej"):
        continue
    nm = {c["id"]: c["name"] for c in cats}
    res = " · ".join(f"{x['name']} {x['pct']:g}%" for x in sorted(r["results"], key=lambda x: -x["pct"]))
    rows.append(f"- **{nm[r['parents'][0]]} + {nm[r['parents'][1]]}** ({r['scenario']}): {res} · **??? {r['secretPct']:g}%**")
T["recipes_examples"] = "\n".join(rows)

rows = ["| Secreto | Arte | Elementos | Rareza (stats) | Ruta A (Resonancia → bucket ???) | Ruta B (fija) | Pista ('Rumor') |", "|---|---|---|---|---|---|---|"]
for s in SECRET_RECIPES:
    c = next(x for x in cats if x["id"] == s["cat"])
    rows.append(f"| **{c['name']}** | `{c['art']['slug']}`{' (tinte)' if c['art']['tint'] else ''} | {el(c['elements'])} | {RNAME[c['rarity']]} | {s['condition']} | {s['altRoute']} | {c['hint']} |")
T["secrets"] = "\n".join(rows)

# misiones
rows = ["| id | Cadena | Título | Objetivo | Aparece cuando | Para qué | Premio (además de 'std') | Abre | Aprox. |", "|---|---|---|---|---|---|---|---|---|"]
for m in CM.MISSIONS:
    rw = {k: v for k, v in m["reward"].items() if k != "std"}
    rtxt = ("SIN std; " if m["reward"]["std"] is False else "") + (", ".join(f"{k}: {v}" for k, v in rw.items()) or "—")
    rows.append(f"| {m['id']} | {m['chain']} | {m['title']} | {m['goal']['text']} | `{m['trigger']}` | {m['purpose']} | {rtxt} | {', '.join(m['unlocks']) or '—'} | {m['estTime'] or '—'} |")
T["missions"] = "\n".join(rows)

# eventos
rows = ["| id | Nombre | Duración | Aparece desde | Tarea | Premio |", "|---|---|---|---|---|---|"]
for e in CV.MICRO_EVENTS:
    rows.append(f"| {e['id']} | {e['name']} | {e['duration_s']} s | `{e['trigger']}` | {e['task']} | {e['reward']} |")
T["micro"] = "\n".join(rows)
rows = ["| id | Nombre | Presagio | Giro de reglas | Bonus |", "|---|---|---|---|---|"]
for e in CV.FLASH_TYPES:
    rows.append(f"| {e['id']} | {e['name']} | _{e['presage']}_ | {e['twist']} | {e['bonus']} |")
T["flash"] = "\n".join(rows)
T["flash_schedule"] = " · ".join(f"KL{f['kl']} {next(t['name'] for t in CV.FLASH_TYPES if t['id'] == f['type'])}" for f in CV.FLASH_SCHEDULE)
rows = []
for h in CV.HEROICS:
    rows.append(f"**{h['name']}** — {h['trigger']} Reloj: {h['duration']}. Pista: `{h['track']}`\n")
    rows.append("| Nodo | Tarea | Sistema | Premio del nodo |\n|---|---|---|---|")
    for nd in h["nodes"]:
        rows.append(f"| {nd['n']} | {nd['task']} | {nd['system']} | {nd['reward']} |")
    rows.append(f"\n- {h['safety']}\n- {h['sprint']}\n- {h['retry']}\n")
T["heroic"] = "\n".join(rows)

# expansiones
rows = ["| # | Expansión | Bioma (prototipo) | Reino | Costo (Doblones) | Limpieza | Parcelas hab/granja | Bono (balance) | Qué abre | Secreto |", "|---|---|---|---|---|---|---|---|---|---|"]
for e in expansions:
    bb = e["balance"]
    bonus = ", ".join(f"{k} {v}" for k, v in bb["bonus"].items())
    rows.append(f"| {e['n']} | **{e['name']}** | {e['biome']} | {bb['kl']} | {fmt(bb['cost'])} | {bb['clear_s']} s | {bb['hab_plots']}/{bb['farm_plots']} | {bonus} | {bb['opens']}. {e['opensDesign']} | **{e['secret']['name']}**: {e['secret']['content']} → {e['secret']['reward']} |")
T["expansions"] = "\n".join(rows)

rows = ["| Reino | Automatización | Origen | Regla |", "|---|---|---|---|"]
for a in automation:
    rows.append(f"| {a['kl']} | **{a['name']}** | {a['source']} | {a['rule']} |")
T["automation"] = "\n".join(rows)

rows = ["| Reino | Tope Nv gato | Qué pasa (★ = cambia reglas) |", "|---|---|---|"]
for k in kingdom:
    if not k["unlocks"]:
        continue
    txt = " · ".join(("★ " if u["changesRules"] else "") + u["text"] for u in k["unlocks"])
    rows.append(f"| {k['kl']} | {k['catLevelCap']} | {txt} |")
T["kingdom"] = "\n".join(rows)

rows = ["| Zona | Etapa | Nombre | Tipo | Arquetipo | Personalidad IA | Poder enemigo (balance) |", "|---|---|---|---|---|---|---|"]
for z in enemies:
    for s in z["stages"]:
        rows.append(f"| {z['zone']} {z['name']} | {s['stage']} | {s['name']} | {s['type']} | {s.get('archetype', '—')} | {s['personality']} | {s['power']:g} |")
T["enemies"] = "\n".join(rows)
rows = ["| Encargo | Zona (tras etapa) | Restricción | Premio |", "|---|---|---|---|"]
for e in CW.ERRANDS:
    rows.append(f"| **{e['name']}** | {e['zone']} (tras {e['zone']}-{e['afterStage']}) | {e['restriction']} | {e['reward']} |")
T["errands"] = "\n".join(rows)

rows = ["| Barco | Tripulación | Armas/Escudos/Motor/Núcleo (balance) | x Poder | Costo | Desbloqueo | Utilería | Artefactos | Perk / regla |", "|---|---|---|---|---|---|---|---|---|"]
for s in B["ship"]["ships"]:
    d = next(x for x in CW.SHIPS if x["id"] == s["id"])
    sl = s["slots"]
    rows.append(f"| **{s['name']}** | {s['crew']} | {sl['weapon']}/{sl['shield']}/{sl['engine']}/{sl['core']} | {s['mult']} | {fmt(s['cost'])} | {s['unlock']}{' · gratis: ' + s['event_free'] if s.get('event_free') else ''} | {d['utilityBudget']} | {d['artifactSlots']} | Balance: {s['perk']}. Diseño: {d['special']} |")
T["ships"] = "\n".join(rows)

rows = ["| Mk | Nombre de clase | Material | Vida por celda | Look |", "|---|---|---|---|---|"]
for h in CW.HULL_BY_MK:
    rows.append(f"| {h['mk']} | {h['name']} | {h['material']} | {h['cellHp']} | {h['look']} |")
T["hull_mk"] = "\n".join(rows)

rows = ["| Módulo | Puntos | Vivo | Destruido | Se desbloquea |", "|---|---|---|---|---|"]
for u in CW.UTILITY_MODULES:
    rows.append(f"| **{u['name']}** (`{u['kind']}`) | {u['cost']} | {u['alive']} | {u['destroyed']} | `{u['unlock']}` |")
T["utility"] = "\n".join(rows)
rows = ["| Tipo de arma | Desbloqueo | Disparo | Sinergia |", "|---|---|---|---|"]
for w in CW.FAMILY_MODULES["weapon"]["types"]:
    rows.append(f"| **{w['name']}** | `{w['unlock']}` | {w['shot']} | {w['synergy']} |")
T["weapons"] = "\n".join(rows)
rows = ["| Tipo de escudo | Desbloqueo | Regla |", "|---|---|---|"]
for w in CW.FAMILY_MODULES["shield"]["types"]:
    rows.append(f"| **{w['name']}** | `{w['unlock']}` | {w['rule']} |")
T["shields"] = "\n".join(rows)
T["relics"] = "\n".join(f"- **{r['name']}** ({r['from']}): {r['effect']}" for r in CW.RELICS)
T["artifacts"] = "\n".join(f"- **{r['name']}** (`{r['unlock']}`): {r['effect']}" for r in CW.ARTIFACTS)

rows = []
for b in CW.BOSSES[:6]:
    rows.append(f"#### Jefe {b['n']} — {b['name']} ({b['title']})\n")
    rows.append(f"- **Zona** {b['zone']} · **Reino mínimo** `{b['klGate']}` · **Elementos** {el(b['elements'])} · **IA** {b['ai']['personality']} / {b['ai']['difficulty']} · **Enrage** turno {b['enrageTurn']}")
    rows.append(f"- **Barco**: {b['ship']['name']} ({b['ship']['size']}; {b['ship']['materials']}). Destacado: {', '.join(b['ship']['notable'])}.")
    rows.append(f"- **Capitán (arte)**: {('`' + b['captainArt']['slug'] + '` ') if b['captainArt']['slug'] else ''}{b['captainArt']['treatment']}.")
    rows.append(f"- **Regla propia**: {b['rule']}")
    rows.append(f"- **Punto débil**: {b['weakPoint']}")
    for p in b["phases"]:
        rows.append(f"  - **F ({int(p['range'][0] * 100)}–{int(p['range'][1] * 100)}%) {p['name']}**: {p['behavior']}")
    ln = b["lines"]
    rows.append(f"- **Líneas**: _\"{ln['intro']}\"_ · F2: _\"{ln['phase2']}\"_ · F3: _\"{ln['phase3']}\"_ · Al perder: _\"{ln['defeat']}\"_ · Si te gana: _\"{ln['win']}\"_")
    rows.append(f"- **Premios**: {b['rewards']['balance']}; desbloquea {', '.join(b['rewards']['unlocks'])}; reliquia {b['rewards']['relic']}; extra: {', '.join(b['rewards']['extra'])}.\n")
T["bosses"] = "\n".join(rows)
rows = ["| Encuentro | Tipo | Dónde/cuándo | Regla | Premio |", "|---|---|---|---|---|"]
for b in CW.BOSSES[6:]:
    rows.append(f"| **{b['name']}** — {b['title']} | {b['type']} | Zona {b['zone']} | {b['rule']} | {', '.join(b['rewards']['extra'])} |")
for e in CW.ELITES:
    rows.append(f"| **{e['name']}** ({e['ship']}) | élite (etapa {e['zone']}-5) | Zona {e['zone']} | {e['rule']} _\"{e['line']}\"_ | botín de etapa + orbes x10 |")
T["other_bosses"] = "\n".join(rows)

rows = ["| # | Reacción | Disparador | Efecto | Grimorio |", "|---|---|---|---|---|"]
for i, r in enumerate(CE.REACTIONS, 1):
    trig = r["trigger"]
    ttxt = ", ".join(f"{k}={v}" for k, v in trig.items())
    rows.append(f"| {i} | **{r['name']}** | {ttxt} | {r['effect']} | _{r['grimoire']}_ |")
T["reactions"] = "\n".join(rows)
rows = ["| Estado | Sobre | Turnos | Efecto |", "|---|---|---|---|"]
for s in CE.STATUSES:
    rows.append(f"| **{s['name']}** | {s['target']} | {s['turns'] if s['turns'] is not None else '—'} | {s['effect']} |")
T["statuses"] = "\n".join(rows)
rows = ["| Elemento | Orden / cómo se descubre | Verbo | Disparo base | Estado | Fuerte vs (gato) | Débil vs | Dimensión de estilo |", "|---|---|---|---|---|---|---|---|"]
for e in CE.ELEMENTS:
    rows.append(f"| {e['emoji']} **{e['name']}** | {e['order']}. `{e['unlock']}` — {e['discovery']} | {e['verb']} | {e['shotRule']} | {e['status'] or '—'} | {ENAME.get(e['beats'], '—') if e['beats'] else '—'} | {ENAME.get(e['beatenBy'], '—') if e['beatenBy'] else '—'} | {e['dimension']} |")
T["elements"] = "\n".join(rows)
rows = ["| Elemento | Nv10 | Nv20 | Nv30 | Nv40 |", "|---|---|---|---|---|"]
for e in CE.ELEMENTS:
    if not e["levelUpgrades"]:
        continue
    lu = e["levelUpgrades"]
    rows.append(f"| {e['emoji']} | **{lu['10']['name']}**: {lu['10']['effect']} | **{lu['20']['name']}**: {lu['20']['effect']} | **{lu['30']['name']}**: {lu['30']['effect']} | **{lu['40']['name']}**: {lu['40']['effect']} |")
T["levels"] = "\n".join(rows)
hdr = "| Ataca ↓ / Material → | " + " | ".join(m["name"] for m in CE.MATERIALS) + " |"
rows = [hdr, "|---" * (len(CE.MATERIALS) + 1) + "|"]
for e in EL7:
    rows.append(f"| {EMO[e]} {ENAME[e]} | " + " | ".join(f"x{m['mult'][e]:g}" for m in CE.MATERIALS) + " |")
rows.append("| HP por celda | " + " | ".join(str(m["hp"]) for m in CE.MATERIALS) + " |")
T["materials"] = "\n".join(rows)
T["sets"] = "\n".join(f"- **{s['name']}** ({', '.join(next(c['name'] for c in cats if c['id'] == x) for x in s['cats'])}): {s['rule']}" for s in CE.CATDEX_SETS)
T["traits"] = "\n".join(f"- **{t['name']}**: {t['effect']}" for t in CE.TRAITS)
T["mutations"] = "\n".join(f"- **{m['name']}**{' (CHARLA)' if m.get('charla') else ''}: {m['effect']} _(sesgo de hábitat: {ENAME.get(m['habitatBias'], '—') if m['habitatBias'] else 'ninguno'})_" for m in CE.MUTATIONS)
rows = []
for b in CV.STORY_BEATS:
    rows.append(f"**{b['time']} · {b['title']}** _(disparador: {b['trigger']}; estilo: {b['style']})_\n")
    for sp, tx in b["lines"]:
        rows.append(f"> **{sp}**: {tx}  ")
    rows.append("")
T["story"] = "\n".join(rows)
T["counts"] = json.dumps(content["meta"]["counts"], ensure_ascii=False)

rows = ["| Facción | Zona | Paleta | Material | Silueta | Cómo se rompe | Jefe |", "|---|---|---|---|---|---|---|"]
for f in CW.SHIP_ART["enemyFactions"]:
    rows.append(f"| **{f['name']}** | {f['zone'] or '—'} | {' '.join(f['palette'])} | {f['materials']} | {f['silhouette']} | {f['chunks']} | {f['boss']} |")
T["factions"] = "\n".join(rows)
T["ship_render"] = "\n".join(f"{i}. {x}" for i, x in enumerate(CW.SHIP_ART["renderSpec"], 1))
T["hull_skins"] = "\n".join(f"- **Mk {'-'.join(str(m) for m in h['mk'])}**: {h['skin']}" for h in CW.SHIP_ART["hullSkinsByMk"])
T["player_ship_looks"] = "\n".join(f"- **{next(x['name'] for x in CW.SHIPS if x['id'] == p['id'])}**: {p['look']}" for p in CW.SHIP_ART["playerShips"])
rows = ["| Estado | Regla | Cómo se ve |", "|---|---|---|"]
for c in CE.CAT_STATUSES:
    rows.append(f"| **{c['name']}** | {c['rule']} | {c['visual']} |")
T["cat_statuses"] = "\n".join(rows)
T["ko"] = "\n".join(f"| {st['t']} ms | {st['what']} |" for st in CE.KO_SEQUENCE["steps"])
T["volley"] = "\n".join(f"- **{k}**: {v}" for k, v in CW.VOLLEY.items())
bal_art = {c["id"]: (c.get("art") or "") for c in B["catdex"]}
rows = ["| id | Arte en balance.json (provisional del agente de economía) | Arte en 04-content.json (decisión) |", "|---|---|---|"]
for c in cats:
    if c["secret"]:
        continue
    ba = bal_art.get(c["id"], "")
    mine = c["art"]["slug"] + (" + tinte" if c["art"]["tint"] else "")
    if ba.split(" ")[0] != c["art"]["slug"] or c["art"]["tint"]:
        if ba or c["art"]["tint"] is None:
            rows.append(f"| `{c['id']}` | {('`' + ba.split(' ')[0] + '`') if ba else '(vacío)'} | `{mine}` |")
T["art_diff"] = "\n".join(rows)

tpl_path = os.path.join(HERE, "gdd_template.md")
if os.path.exists(tpl_path):
    tpl = open(tpl_path, encoding="utf-8").read()

    def rep(m):
        k = m.group(1)
        assert k in T, k
        return T[k]
    md = re.sub(r"\{\{TABLE:([a-z_]+)\}\}", rep, tpl)
    left = re.findall(r"\{\{[^}]*\}\}", md)
    assert not left, left
    gdd = os.path.join(RES, "04-gdd-no-one-like-cats.md")
    open(gdd, "w", encoding="utf-8").write(md)
    print("GDD OK", gdd, len(md.splitlines()), "líneas")
else:
    print("(sin plantilla todavía) tablas:", sorted(T))
