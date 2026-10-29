#!/usr/bin/env python3
"""
Genera el lote post-Parte III desde la fuente única (base.py + md_*.py + reservas.py + originales.py).

  python3 generar.py          → 01-roster.md, 02-arte-briefs.md, 03-obtencion.md (tablas), 04-roster.json + validación
  python3 generar.py --arte   → además: style locks y entradas del manifest de arte-nuevo (SOLO las de lote-post-p3)
                                 y compila sus prompts con herramientas/compilar.mjs <id>. Respaldo previo en _respaldos/.
"""
import json, os, re, subprocess, sys, glob, shutil, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import base
from base import *  # noqa
import md_anime, md_libros, md_caricaturas, md_comics_juegos, md_pantalla, md_musica_deporte, md_tanda2, reservas, originales  # noqa: F401
import textos

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
REPO = os.path.dirname(os.path.dirname(DOCS))
GAME_DATA = os.path.join(REPO, 'game', 'src', 'data')
ARTE = os.path.expanduser('~/Desktop/No one - raster (fuera del repo)/arte-nuevo')

# ------------------------------------------------------------------ obtención (contrato de SISTEMA: data/postp3/reglas.ts)
# Fase 1 = solo las 4 mesas que ya dan gatos. Las otras 7 mesas son la «vitrina» propuesta (Requiere sistema nuevo).
PHASE1 = {'gacha': 'casino:gacha', 'slot': 'casino:slot', 'eterno': 'casino:eterno',
          'plinko': 'casino:gacha:michi', 'dice': 'casino:gacha:michi',
          'hilo': 'casino:gacha:holo', 'roulette': 'casino:gacha:holo',
          'bingo': 'casino:slot', 'scratch': 'casino:slot', 'boxes': 'casino:caja',
          # tanda 2 (DISEÑO-2): mesas grandes SIN vitrina (las vitrinas se quedan en 8; ver 05-tanda-2.md)
          'gacha_michi': 'casino:gacha:michi', 'gacha_holo': 'casino:gacha:holo', 'caja': 'casino:caja'}
# post.vitrina de los venues sin vitrina = el nombre de su mesa grande (el validador del juego acepta las claves de POST_CASINO)
VIT_OF = {'gacha_michi': 'gacha', 'gacha_holo': 'gacha'}
TANDA2_MODE = 'tanda2'  # --arte: solo regenera/agrega las entradas de la tanda 2; --arte-todo: el comportamiento viejo (todo el lote)
SRC_TXT = {'casino:gacha': 'puede salir cuando el Portal te da un gato legendario o mítico (cualquier estandarte)',
           'casino:gacha:michi': 'puede salir cuando el PORTAL MICHI te da un gato legendario o mítico',
           'casino:gacha:holo': 'puede salir cuando el MULTIVERSO HOLO te da un gato legendario o mítico',
           'casino:slot': 'puede salir en la Tragamichis con fichas, en las líneas de GATO NEGRO',
           'casino:caja': 'puede salir del Gato Misterioso de La Caja cuando trae un legendario',
           'casino:eterno': 'puede ser el gato del premio del MODO ETERNO cuando ganas el 50/50'}
COPA = {}  # champion id -> dict (se llena con los heroicos)
COPA_LEAGUE0 = 16
ORIGIN = {'anime': 'p3d_anime', 'libros': 'p3d_libros', 'superheroes': 'p3d_superheroes', 'pop': 'p3d_pop', 'pantalla': 'pantalla',
          'pixel': 'pixel', 'vecindad': 'vecindad', 'mitos': 'mitos', 'pinceles': 'pinceles', 'caricatura': 'caricatura', 'tira': 'tira', 'estadio': 'estadio'}
LOCK_NAME = {k: (v.get('style_lock') or f"dimensiones/{v['dimension'].upper()}.txt").split('/')[-1].replace('.txt', '') for k, v in FAM.items()}


def strip_jp(name):
    return name


def shot_json(c):
    s = c['shot']
    el = s.get('element', c['el'])
    arche, st, stt = EL_SHOT[el]
    arche = s.get('archetype', arche)
    status = s['status'] if 'status' in s else st
    turns = s.get('st', (stt if 'status' not in s else (1 if status in ('aturdido', 'cegado', 'congelado', 'corriente', 'cargado') else 2))) if status else 0
    d, radius, pierce = ROLE_SHOT[c['role']]
    dmg = s.get('dmg', BASE_DMG[c['rarity']] + d)
    return {'name': s['name'], 'cry': s.get('cry'), 'archetype': arche, 'element': el, 'dmg': dmg,
            'radius': s.get('radius', radius), 'projectiles': s.get('projectiles', 1), 'spreadDeg': s.get('spread', 0),
            'bounces': s.get('bounces', 0), 'pierce': s.get('pierce', pierce), 'status': status, 'statusTurns': turns,
            'gravityMul': s.get('grav', 1.0), 'speedMul': s.get('speed', 1.0), 'special': s['special']}


def recarga(c):
    r, role = c['rarity'], c['role']
    if r == 'heroic':
        return 1
    if r == 'mythic':
        return 2
    if r == 'legendary':
        return 2 if role in HEAVY | {'francotirador'} else 1
    return 2 if role in HEAVY else 1


def star3(c, shot):
    if c.get('s3'):
        return c['s3']
    if shot['projectiles'] > 1:
        return '★3: suelta un proyectil más.'
    if shot['status']:
        return f"★3: {STATUS_ES.get(shot['status'], shot['status'])} dura un turno más."
    if shot['bounces']:
        return '★3: su tiro rebota una vez más.'
    if shot['pierce']:
        return '★3: su tiro atraviesa una celda más.'
    return '★3: su tiro explota un poco más grande.'


def star5(c, uname):
    if c['rarity'] == 'heroic':
        return c.get('s5') or f'★5: {uname} pega un 25 % más y su efecto dura un turno más.'
    return f'★5: {uname} se puede usar 2 veces por batalla.'


def table_of(c):
    if c['rarity'] == 'heroic':
        return f"podio:{c['copa'][0]}"
    return PHASE1[c['venue']]


VIT_TXT = {'plinko': 'el Plinko', 'dice': 'el Duelo de Dados', 'hilo': 'Mayor o Menor', 'bingo': 'el Bingo Exprés', 'scratch': 'el Rasca y Gana',
           'boxes': 'las Cajas Misteriosas', 'roulette': 'la Ruleta'}


def de_(t):
    """«de» + the table's name, with the contraction (de + el → del)"""
    return f"del {t[3:]}" if t.startswith('el ') else f"de {t}"


def how(c):
    src = table_of(c)
    if src.startswith('podio:'):
        ch = COPA[c['copa'][0]]
        return f"Premio del Podio, después de la Parte III: gana el reto {ch['order']} de la Copa Fuera de la Caja ({ch['trainer']}). El reto se pone a la altura de tu liga y paga una sola vez."
    if c['venue'] in VIT_TXT:
        return f"Después de la Parte III, en el Casino: sale de la vitrina {de_(VIT_TXT[c['venue']])} (Momento Vitrina), y también {SRC_TXT[src]}."
    return f"Después de la Parte III, en el Casino: {SRC_TXT[src]}."


def cat_json(c):
    r = c['rarity']
    shot = shot_json(c)
    uname, jp, ueffect = c['ult']
    dmg, uses, cap = ULT[r]
    ult = {'name': f'{uname} ({jp})', 'effect': ueffect, 'dmg': dmg, 'meterCost': 100, 'usesPerBattle': uses, 'chargeTurns': 0, 'structureCap': cap}
    art = c['art']
    # tanda 2: `origin` propio (leyendas, mitos, historia, ciencia, clasica, telenovela) cuando la ficha lo trae; si no, el de su familia de arte
    origin = c.get('origin') or (ORIGIN[art['fam']] if 'fam' in art else ('podio' if r == 'heroic' else 'casino'))
    src = table_of(c)
    post = {'kind': 'copa' if r == 'heroic' else 'mesa', 'source': src, 'weight': c.get('w', 10), 'gate': 'postP3Unlocked'}
    if r != 'heroic':
        post['vitrina'] = VIT_OF.get(c['venue'], c['venue'])
        post['star'] = bool(c.get('star'))
    if c.get('tanda'):
        post['tanda'] = c['tanda']
    if c.get('sets'):
        post['sets'] = c['sets']
    if c.get('pair'):
        post['pair'] = c['pair']
    if r == 'multidimensional':
        post['power'] = {'name': uname, 'short': c['pw'], 'text': ueffect, 'nums': c['nums']}
        post['universe'] = {'tag': c['uni'][0], 'open': c['uni'][1], 'payoff': c['uni'][2]}
    if c.get('reserve'):
        post['reserve'] = True
        post['swap'] = c.get('swap')
    return {
        'id': c['id'], 'name': c['name'], 'epithet': c['ep'],
        'art': {'slug': art['slug'], 'tint': None, 'aura': art['aura']},
        'elements': [c['el']], 'rarity': r, 'primordial': False, 'secret': False,
        'role': c['role'], 'worker': None, 'trait': c['trait'],
        'battleForm': {'name': c['form'], 'cry': c['fcry']},
        'economy': {'goldBasePerS': f'balance:rarities.gold_base_per_s.{r}', 'powerBase': f'balance:rarities.power_base.{r}',
                    'foodMult': f'balance:rarities.food_mult.{r}', 'goldMod': None, 'note': None, 'gambitMod': None},
        'combat': {'hpBase': f"roles.{c['role']}.hp", 'recarga': recarga(c), 'shot': shot, 'ultimate': ult,
                   'limitation': c.get('lim'), 'passive': c['passive'], 'star3': star3(c, shot), 'star5': star5(c, uname)},
        'obtain': {'source': 'post:podio' if r == 'heroic' else 'post:casino', 'how': how(c), 'balanceSource': 'post:podio' if r == 'heroic' else 'post:casino'},
        'hint': c['hint'], 'lore': c['lore'], 'balanceName': c['name'], 'origin': origin, 'post': post,
    }


# ------------------------------------------------------------------ arte (manifest)
def first_sentence(t):
    m = re.match(r'(.+?[.!?»])(\s|$)', t)
    return m.group(1) if m else t


def manifest_md(c, el_dims):
    a = c['art']
    fam = FAM[a['fam']]
    mni = list(MNI)
    if a.get('foot'):
        mni[0] = f"No logos, club crests, sponsors or kit-brand marks, no letters; the only glyph allowed is the jersey number {a['foot']}."
    if a.get('real'):
        mni.append(MNI_REAL)
    mni += a.get('mni', [])
    e = {'id': c['id'], 'name': c['name'], 'epithet': c['ep'], 'lote': 'post', 'folder': LOTE_DIR, 'file': f"{LOTE_DIR}/{c['id']}.png",
         'parte': 'Post Parte III — lote post-p3 (Casino y Podio)', 'dimension': fam['dimension']}
    if fam.get('style_lock'):
        e['style_lock'] = fam['style_lock']
    e.update({'references': [], 'rarity': RARITY_ES[c['rarity']], 'elements': [EL_ES[c['el']]], 'role': ROLE_ES[c['role']],
              'replaces_recolor_of': None, 'reference_en': a['ref_en'], 'referencia_es': c['src'], 'concept_es': c['hint'],
              'look_es': '; '.join(c['traits']), 'identifying_features_es': c['traits'], 'signifiers_en': a['sig'],
              'evoke_not_copy_en': EVOKE + a.get('ev', []), 'subject_en': a['subject'], 'coat_en': a['coat'],
              'style_of_en': a.get('style_of', fam['style_of_en']), 'proportions_en': fam['proportions_en'], 'line_en': fam['line_en'],
              'palette': a['pal'], 'color_en': fam['color_en'], 'shading_en': fam['shading_en'], 'texture_en': 'NONE painted',
              'pose_en': a['pose'], 'expression_en': a.get('expr', EXPR), 'hero_prop_en': a['prop'], 'rarity_treatment_en': MD_TREAT,
              'rig_notes_en': RIG + a.get('rig', []), 'must_not_include_en': mni, 'corrections_en': []})
    sc = fam.get('style_consistency_en')
    if a.get('style_of') and fam['dimension'] in ('pinceles', 'mitos'):
        # un estilo por gato: la frase nombra el medio de ESTE gato (el de la familia decía «rococo» para todos los de Pinceles)
        sc = (f"This cat lives in the {fam['dimension'].upper()} box, where each cat keeps the style of ITS source: "
              f"follow the reference medium above ({a['style_of'].split(':')[0]}), not the style of any other cat.")
    if sc:
        e['style_consistency_en'] = sc
    e.update({'slug': a['slug'], 'riesgo_moderacion': c['risk'], 'plan_b_es': c['planb'], 'plan_b_en': a.get('planb_en'),
              'reserva': bool(c.get('reserve')), 'post_source': table_of(c)})
    return e


def manifest_orig(c, el_dims):
    a = c['art']
    elx = EL_ES[c['el']]
    e = {'id': c['id'], 'name': c['name'], 'epithet': c['ep'], 'lote': 'post', 'folder': LOTE_DIR, 'file': f"{LOTE_DIR}/{c['id']}.png",
         'parte': 'Post Parte III — lote post-p3 (Casino y Podio)', 'rarity': RARITY_ES[c['rarity']], 'elements': [elx], 'role': ROLE_ES[c['role']],
         'replaces_recolor_of': None, 'concept_es': first_sentence(c['lore']), 'look_es': a['look'], 'identifying_features_es': a['feats'],
         'palette': a['pal'], 'element_dimensions': [{'element': elx, 'dimension': el_dims.get(elx)}], 'subject_en': a['subject'], 'coat_en': a['coat']}
    if c['rarity'] == 'heroic':
        e['battle_power_es'] = a['power']
    if a.get('expr'):
        e['expression_note_en'] = a['expr']
    e.update({'corrections_en': [], 'slug': a['slug'], 'reserva': False, 'post_source': table_of(c)})
    return e


# ------------------------------------------------------------------ validación
def load_game():
    cats = []
    for f in ['content.json'] + sorted(glob.glob(os.path.join(GAME_DATA, 'rupturas', 'especies*.json'))) + ['gateras/especies.json', 'postp3/especies.json']:
        p = f if os.path.isabs(f) else os.path.join(GAME_DATA, f)
        if os.path.exists(p):
            cats += json.load(open(p)).get('cats', [])
    return cats


def validate(all_json, allc):
    errs = []
    game = load_game()
    # los gatos del lote que YA están en el juego (data/postp3/especies.json, mismo id y slug) son ellos mismos, no choques
    shipped = {}
    pp = os.path.join(GAME_DATA, 'postp3', 'especies.json')
    if os.path.exists(pp):
        shipped = {c['id']: c['art']['slug'] for c in json.load(open(pp)).get('cats', [])}
    game = [c for c in game if not (c['id'] in shipped and any(j['id'] == c['id'] for j in all_json))]
    gids = {c['id'] for c in game}
    gnames = {c['name'].lower() for c in game}
    gslugs = {c['art']['slug'] for c in game}
    svgs = {os.path.splitext(x)[0] for x in os.listdir(os.path.join(REPO, 'game', 'public', 'cats-svg'))} - set(shipped.values())
    for j in all_json:
        if j['id'] in shipped and shipped[j['id']] != j['art']['slug']:
            errs.append(f"{j['id']}: ya está en el juego con otro slug ({shipped[j['id']]})")
    # tanda 2: las reglas del encargo de DISEÑO-2
    src_by_id = {c['id']: c for c in allc}
    for j in all_json:
        c = src_by_id.get(j['id'], {})
        if not c.get('tanda') or j['rarity'] != 'multidimensional':
            continue
        i = j['id']
        if re.search(r'STARFALL|METEOR|DECREE', j['combat']['ultimate']['name'], re.I): errs.append(f'{i}: nombre de ulti prohibido (STARFALL|METEOR|DECREE)')
        if len(c['pw']) > 60: errs.append(f"{i}: post.power.short de {len(c['pw'])} caracteres (máx. 60)")
        if not 3 <= len(c['traits']) <= 5: errs.append(f'{i}: {len(c["traits"])} rasgos (3–5)')
        if not 3 <= len(c['art']['sig']) <= 5: errs.append(f'{i}: {len(c["art"]["sig"])} signifiers (3–5)')
        if not c.get('uni') or len(c['uni']) != 3: errs.append(f'{i}: falta el universo')
        for k in ('planb', 'risk', 'nums', 'pw', 'passive', 'hint'):
            if not c.get(k): errs.append(f'{i}: falta {k}')
        if not c['art'].get('planb_en'): errs.append(f'{i}: falta art.planb_en')
    bal = json.load(open(os.path.join(GAME_DATA, 'balance.json')))
    content = json.load(open(os.path.join(GAME_DATA, 'content.json')))
    roles = {r['id'] for r in content['roles']}
    traits = {t['id'] for t in content['traits']}
    elements = {e['id'] for e in content['elements']} | {'crystal', 'gravity'}
    seen, slugs, names = set(), set(), set()
    for j in all_json:
        i = j['id']
        if i in seen: errs.append(f'{i}: id repetido')
        if i in gids: errs.append(f'{i}: el id ya existe en el juego')
        if j['name'].lower() in gnames: errs.append(f'{i}: el nombre «{j["name"]}» ya existe en el juego')
        if j['name'].lower() in names: errs.append(f'{i}: nombre repetido en el lote')
        if j['art']['slug'] in gslugs or j['art']['slug'] in svgs: errs.append(f'{i}: slug ya usado')
        if j['art']['slug'] in slugs: errs.append(f'{i}: slug repetido')
        seen.add(i); slugs.add(j['art']['slug']); names.add(j['name'].lower())
        if j['role'] not in roles: errs.append(f'{i}: rol {j["role"]}')
        if j['trait'] not in traits: errs.append(f'{i}: rasgo {j["trait"]}')
        for e in j['elements'] + [j['combat']['shot']['element']]:
            if e not in elements: errs.append(f'{i}: elemento {e}')
        for k in ('goldBasePerS', 'powerBase', 'foodMult'):
            ref = j['economy'][k][8:].split('.')
            v = bal
            for x in ref: v = v.get(x) if isinstance(v, dict) else None
            if not isinstance(v, (int, float)): errs.append(f'{i}: {k} no resuelve')
        src = j['post']['source']
        if not re.fullmatch(r'casino:(gacha(:michi|:holo)?|slot|caja|eterno)|podio:[a-z0-9_]+', src): errs.append(f'{i}: post.source {src}')
        if not j['obtain']['source'].startswith('post:'): errs.append(f'{i}: obtain.source')
        if j['rarity'] == 'multidimensional':
            u = j['combat']['ultimate']
            if u['usesPerBattle'] != 1 or not u['name'].startswith(j['post']['power']['name']) or '2 veces por batalla' not in j['combat']['star5']:
                errs.append(f'{i}: contrato del poder MD')
        if len(j['lore']) > 420: errs.append(f'{i}: lore largo ({len(j["lore"])})')
    return errs


# ------------------------------------------------------------------ main
def main():
    arte = '--arte' in sys.argv
    heroes = [c for c in ORIGINALES if c['rarity'] == 'heroic']
    for k, c in enumerate(heroes):
        cid, trainer, box = c['copa']
        COPA[cid] = {'id': cid, 'order': k + 1, 'mult': round(1.10 + 0.05 * k, 2), 'trainer': trainer, 'box': box, 'prize': c['id'], 'line': textos.COPA_LINES[cid]}
    order = {'mythic': 0, 'legendary': 1, 'heroic': 2}
    origs = sorted(ORIGINALES, key=lambda c: order[c['rarity']])
    cats = [cat_json(c) for c in ROSTER] + [cat_json(c) for c in origs]
    reserve = [cat_json(c) for c in RESERVA]
    errs = validate(cats + reserve, ROSTER + RESERVA + origs)
    if errs:
        print('ERRORES:\n  ' + '\n  '.join(errs)); sys.exit(1)
    out = {'$comment': textos.JSON_COMMENT, 'cats': cats, 'reserve': reserve, 'catdexSets': textos.SETS,
           'postChampions': [{'id': v['id'], 'order': v['order'], 'mult': v['mult'], 'trainer': v['trainer'], 'prize': v['prize'], 'line': v['line']} for v in COPA.values()],
           'postCasino': textos.POST_CASINO, 'postVitrinas': textos.POST_VITRINAS, 'postCopa': textos.POST_COPA}
    # los sets solo nombran ids que existen (lote + juego)
    known = {c['id'] for c in cats} | {c['id'] for c in load_game()}
    for s in textos.SETS:
        bad = [x for x in s['cats'] if x not in known]
        assert not bad, (s['id'], bad)
    json.dump(out, open(os.path.join(DOCS, '04-roster.json'), 'w'), ensure_ascii=False, indent=1)
    open(os.path.join(DOCS, '04-roster.json'), 'a').write('\n')
    textos.write_docs(DOCS, ROSTER, RESERVA, origs, cats, reserve, COPA, PHASE1, LOCK_NAME, table_of)
    print(f'OK: {len(cats)} gatos ({len(ROSTER)} MD, {len(origs)} originales) + {len(reserve)} de reserva. Docs y JSON escritos.')
    if '--arte-todo' in sys.argv:
        do_arte(ROSTER + RESERVA, origs, only=None)
    elif arte:
        do_arte(ROSTER + RESERVA, origs, only={c['id'] for c in ROSTER + RESERVA + origs if c.get('tanda')})


def do_arte(mds, origs, only=None):
    """only=None: el comportamiento viejo (reescribe TODO el lote; borra las correcciones que los agentes de arte pusieron a mano en el
    manifest). only={ids}: modo tanda 2 (DISEÑO-2, 2026-10-29): reemplaza esas entradas en su lugar (o las agrega al final), compila solo
    sus prompts y deja intactas las demás entradas, sus prompts y COLA.txt."""
    if only is not None:
        return do_arte_parcial(mds, origs, only)
    do_arte_todo(mds, origs)


def do_arte_parcial(mds, origs, only):
    man_path = os.path.join(ARTE, 'manifest.json')
    m = json.load(open(man_path))
    el_dims = {}
    for a in m['assets']:
        for d in a.get('element_dimensions') or []:
            if d.get('dimension'): el_dims.setdefault(d['element'], d['dimension'])
    entries = [manifest_md(c, el_dims) for c in mds if c['id'] in only] + [manifest_orig(c, el_dims) for c in origs if c['id'] in only]
    ids = {e['id'] for e in entries}
    clash = [a['id'] for a in m['assets'] if a['id'] in ids and a.get('folder') != LOTE_DIR]
    assert not clash, f'ids que ya existen en otro lote: {clash}'
    bk = os.path.join(ARTE, '_respaldos', f"manifest-antes-tanda2-{datetime.datetime.now():%Y-%m-%d-%H%M%S}.json")
    shutil.copy(man_path, bk)
    tmp = os.path.join(HERE, '_entradas-manifest.json')
    json.dump(entries, open(tmp, 'w'), ensure_ascii=False, indent=2)
    js = ("const fs=require('fs');const p=process.argv[1];const m=JSON.parse(fs.readFileSync(p,'utf8'));"
          "const add=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const by=new Map(add.map(a=>[a.id,a]));let rep=0;"
          "m.assets=m.assets.map(a=>{if(a.folder==='lote-post-p3'&&by.has(a.id)){const n=by.get(a.id);by.delete(a.id);rep++;"
          "if(a.corrections_en&&a.corrections_en.length&&!(n.corrections_en&&n.corrections_en.length))n.corrections_en=a.corrections_en;return n;}return a;});"
          "const nu=[...by.values()];m.assets=m.assets.concat(nu);"
          "fs.writeFileSync(p,JSON.stringify(m,null,2)+'\\n');console.log('manifest:',m.assets.length,'assets ·',rep,'reemplazadas en su lugar ·',nu.length,'nuevas al final');")
    subprocess.run(['node', '-e', js, man_path, tmp], check=True)
    os.remove(tmp)
    for e in entries:
        subprocess.run(['node', 'herramientas/compilar.mjs', e['id']], cwd=ARTE, check=True, stdout=subprocess.DEVNULL)
    open(os.path.join(ARTE, LOTE_DIR, 'COLA-tanda2.txt'), 'w').write(
        textos.cola(entries).replace('# Cola del lote post-p3 (DISEÑO, 2026-10-28).', '# Cola de la TANDA 2 del lote post-p3 (DISEÑO-2, 2026-10-29).')
        .replace('./_p3v2/cola.sh <HH:MM> <tamaño de ola> $(grep -v "^#" lote-post-p3/COLA.txt | grep -v "^$" | grep -v "^R ")',
                 'lote-post-p3/herramientas/cola.sh <tamaño de ola> $(grep -v "^#" lote-post-p3/COLA-tanda2.txt | grep -v "^$")'))
    print(f'arte (tanda 2): {len(entries)} entradas · respaldo {os.path.basename(bk)} · prompts en prompts/{LOTE_DIR}/ · {LOTE_DIR}/COLA-tanda2.txt')


def do_arte_todo(mds, origs):
    man_path = os.path.join(ARTE, 'manifest.json')
    m = json.load(open(man_path))
    el_dims = {}
    for a in m['assets']:
        for d in a.get('element_dimensions') or []:
            if d.get('dimension'): el_dims.setdefault(d['element'], d['dimension'])
    entries = [manifest_md(c, el_dims) for c in mds] + [manifest_orig(c, el_dims) for c in origs]
    ids = {e['id'] for e in entries}
    clash = [a['id'] for a in m['assets'] if a['id'] in ids and a.get('folder') != LOTE_DIR]
    assert not clash, f'ids que ya existen en otro lote: {clash}'
    # respaldo (solo agrega un archivo)
    bk = os.path.join(ARTE, '_respaldos', f'manifest-antes-lote-post-p3-{datetime.date.today()}.json')
    if os.path.exists(bk):
        bk = os.path.join(ARTE, '_respaldos', f"manifest-antes-lote-post-p3-{datetime.datetime.now():%Y-%m-%d-%H%M}.json")
    shutil.copy(man_path, bk)
    # una ficha del lote que ya no existe (renombrada): su prompt va a _respaldos (no se borra nada)
    stale = [a['id'] for a in m['assets'] if a.get('folder') == LOTE_DIR and a['id'] not in ids]
    for sid in stale:
        p = os.path.join(ARTE, 'prompts', LOTE_DIR, f'{sid}.md')
        if os.path.exists(p):
            dst = os.path.join(ARTE, '_respaldos', f'{datetime.date.today()}-lote-post-p3-retirados')
            os.makedirs(dst, exist_ok=True)
            shutil.move(p, os.path.join(dst, f'{sid}.md'))
    print('retiradas del lote:', stale or 'ninguna', '· respaldo:', os.path.basename(bk))
    os.makedirs(os.path.join(ARTE, LOTE_DIR, '_crudos'), exist_ok=True)
    os.makedirs(os.path.join(ARTE, LOTE_DIR, 'estilo'), exist_ok=True)
    for name, txt in textos.LOCKS.items():
        open(os.path.join(ARTE, LOTE_DIR, 'estilo', f'{name}.txt'), 'w').write(txt.strip() + '\n')
    tmp = os.path.join(HERE, '_entradas-manifest.json')
    json.dump(entries, open(tmp, 'w'), ensure_ascii=False, indent=2)
    # el manifest lo escribe node (mismo formato que saveManifest: JSON.stringify(m, null, 2) + '\n'); solo toca lote-post-p3
    js = ("const fs=require('fs');const p=process.argv[1];const m=JSON.parse(fs.readFileSync(p,'utf8'));"
          "const add=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const ids=new Set(add.map(a=>a.id));"
          "const old=m.assets.filter(a=>a.folder==='lote-post-p3');const rest=m.assets.filter(a=>a.folder!=='lote-post-p3');"
          "m.assets=rest.concat(add);"
          "fs.writeFileSync(p,JSON.stringify(m,null,2)+'\\n');console.log('manifest:',m.assets.length,'assets');")
    subprocess.run(['node', '-e', js, man_path, tmp], check=True)
    os.remove(tmp)
    for e in entries:
        subprocess.run(['node', 'herramientas/compilar.mjs', e['id']], cwd=ARTE, check=True, stdout=subprocess.DEVNULL)
    open(os.path.join(ARTE, LOTE_DIR, 'COLA.txt'), 'w').write(textos.cola(entries))
    print(f'arte: {len(entries)} entradas en el manifest, prompts en prompts/{LOTE_DIR}/, locks en {LOTE_DIR}/estilo/')


if __name__ == '__main__':
    main()
