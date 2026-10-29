"""Textos fijos del lote post-P3 y escritura de los documentos (lo llama generar.py)."""
import os, collections
from base import EL_ES, ROLE_ES, TRAIT_ES, RARITY_ES, STATUS_ES, VENUE_ES, FAM, LOTE_DIR

JSON_COMMENT = ("Después de la Parte III — lote de DISEÑO (2026-10-28; ⚠️ spoilers). Generado por docs/post-p3/fuente/generar.py: no editar a mano. "
                "`cats` va a game/src/data/postp3/especies.json (mismo esquema que data/gateras/especies.json; en vez de `p3`, cada gato trae `post`). "
                "post.source sigue el contrato de SISTEMA (data/postp3/reglas.ts): casino:gacha[:michi|:holo] | casino:slot | casino:caja | casino:eterno | podio:<campeón>. "
                "post.vitrina = la mesa que propone 03-obtencion.md §6 (Requiere sistema nuevo); hasta entonces vale post.source. "
                "Los Multidimensionales traen post.power (texto para data/multidimPowers.ts y números para battle/multidim.ts) y post.universe (revelación en fx/sequences/multiverse/). "
                "`reserve` = 16 Multidimensionales de reserva (mismo esquema; entran solo si se bloquea un titular). `postChampions` → POST_CHAMPIONS; `postCasino` → POST_CASINO (números recomendados). "
                "`catdexSets` = sets propuestos (las reglas marcadas «propuesta» son balance: decide el dueño).")

ANIME = ['xp_gomitas', 'xp_kagebunyan', 'xp_gatojo', 'xp_unzarpazo', 'xp_pegaso', 'xp_michiatom', 'xp_mazingato', 'xp_ryumiau', 'xp_miaunya', 'xp_yugi']
SETS = [
    {'id': 'set_pp_shonen', 'name': 'Sábado de Anime', 'cats': ANIME, 'rule': 'Propuesta: tus Multidimensionales de anime empiezan cada batalla con 25 de barra.'},
    {'id': 'set_pp_biblioteca', 'name': 'Clásicos de Biblioteca', 'cats': ['xp_gatote', 'xp_sherlock', 'xp_frankengato', 'xp_gatula', 'xp_ahab', 'xp_pinomichi'], 'rule': 'Colección: los seis clásicos de dominio público.'},
    {'id': 'set_pp_colegio', 'name': 'Los Tres del Colegio', 'cats': ['x_harrygatter', 'xp_hermiaune', 'xp_lunalovegata'], 'rule': 'Propuesta: con los tres en la tripulación, sus poderes empiezan con 20 de barra.'},
    {'id': 'set_pp_latino', 'name': 'Puro Corazón Latino', 'cats': ['xp_michipulin', 'xp_barril', 'xp_miaufalda', 'xp_condorgato'], 'rule': 'Colección: la tele, la tira y la historieta de la tarde.'},
    {'id': 'set_pp_tarde', 'name': 'Tarde de Caricaturas', 'cats': ['xp_esponja', 'xp_rick', 'xp_miaang', 'xp_miauby', 'xp_blumiau', 'xp_miaubody'], 'rule': 'Colección: la barra de caricaturas completa.'},
    {'id': 'set_pp_estreno', 'name': 'Función de Estreno', 'cats': ['xp_gatogro', 'xp_grru', 'xp_miaunion', 'xp_miaubody'], 'rule': 'Colección: las películas animadas.'},
    {'id': 'set_pp_villanos', 'name': 'Villanos con Plan', 'cats': ['xp_grru', 'xp_miaunion', 'xp_doomiau', 'xp_heisenmiau', 'xp_gatoleone'], 'rule': 'Colección: todos tienen un plan. Ninguno funciona.'},
    {'id': 'set_pp_liga', 'name': 'Liga de Capas', 'cats': ['xp_supermichi', 'xp_hierromichi', 'xp_michimerica', 'xp_garritas', 'x_murciegato', 'x_gatarana'], 'rule': 'Propuesta: tus superhéroes empiezan cada batalla con 1 escudo.'},
    {'id': 'set_pp_consola', 'name': 'Fichas de Consola', 'cats': ['xp_ssssmichi', 'xp_michimpostor', 'xp_zoomic', 'e_comecroquetas'], 'rule': 'Colección: los de la maquinita.'},
    {'id': 'set_pp_series', 'name': 'Maratón de Series', 'cats': ['xp_hannah', 'xp_miaunce', 'xp_heisenmiau', 'xp_michiercoles'], 'rule': 'Colección: un capítulo más y ya.'},
    {'id': 'set_pp_cine', 'name': 'Función de Medianoche', 'cats': ['xp_gemichi', 'xp_persafalsa', 'xp_michiwan', 'xp_gatoleone'], 'rule': 'Colección: palomitas no incluidas.'},
    {'id': 'set_pp_festival', 'name': 'Cartel del Festival', 'cats': ['xp_romiau', 'xp_miauki', 'xp_postmaulone', 'xp_miautentacion', 'xp_sabrina', 'xp_daftmiau', 'xp_partymichi', 'xp_miauknd'], 'rule': 'Colección: el cartel completo (propuesta cosmética: la Tragamichis estrena luces de festival).'},
    {'id': 'set_pp_seleccion', 'name': 'Selección Michi', 'cats': ['xp_miaussi', 'xp_gatistiano', 'xp_miaupe', 'xp_lamiau'], 'rule': 'Propuesta: en el Podio, tus seleccionados pegan +10 %.'},
    {'id': 'set_pp_casa', 'name': 'La Casa Siempre Gana', 'cats': ['lp_pozomayor', 'lp_bolita', 'lp_catarata', 'lp_ojoserpiente', 'lp_asmanga', 'lp_cantadora', 'lp_unadeoro', 'lp_monodorado', 'lp_desborde', 'lp_sinfrenos'], 'rule': 'Propuesta: el medidor de LA CASA TE DEBE se llena un 10 % más rápido (se imprime en Reglas de la casa).'},
    {'id': 'set_pp_amuletos', 'name': 'Amuletos de la Mesa', 'cats': ['mp_trebol', 'mp_malasuerte', 'mp_comodin', 'mp_doblon'], 'rule': 'Colección: la buena, la mala y la que quema.'},
    {'id': 'set_pp_despues', 'name': 'Lo que Quedó Después', 'cats': ['mp_brasanaranja', 'mp_vigilia', 'mp_tintagris', 'mp_grafito'], 'rule': 'Colección.'},
    {'id': 'set_pp_copa', 'name': 'Copa Fuera de la Caja', 'cats': ['hp_vencidas', 'hp_kidcapa', 'hp_shinai', 'hp_pergamino', 'hp_bgirl', 'hp_retiaria', 'hp_mascaradeoro', 'hp_combo'], 'rule': 'Propuesta: en el Podio, tus gatos empiezan cada duelo con 25 de barra.'},
]

COPA_LINES = {
    'copa_borracha': '«Codo en la mesa, gatito. El que suelta primero paga la ronda… de leche.»',
    'copa_superheroes': '«Todos fuimos el que esperaba en el coche. Hoy manejamos nosotros.»',
    'copa_anime': '«Inclínate. Luego, si puedes, levántate.»',
    'copa_libros': '«En mi biblioteca nadie se brinca al final.»',
    'copa_pop': '«Si no bailas, pierdes. Si bailas mal, también.»',
    'copa_pinceles': '«No toque las obras. Las obras sí lo van a tocar a usted.»',
    'copa_pantalla': '«¡Acción! …y que alguien traiga a la momia.»',
    'copa_pixel': '«Una ficha, una vida. Yo traigo noventa y nueve.»',
}

# números APROBADOS por el dueño (2026-10-28, «dale con tus recomendaciones, las 4») para data/postp3/reglas.ts
POST_CASINO = {'gacha': {'share': 0.5, 'pity': 3}, 'slot': {'share': 0.4, 'pity': 4}, 'caja': {'share': 0.6, 'pity': 2}, 'eterno': {'share': 0.75, 'pity': 2},
               '_note': 'Aprobado por el dueño el 2026-10-28 (antes: provisionales de SISTEMA 0.25/6, 0.25/6, 0.25/4, 0.5/2). El dueño prueba la economía en su partida.'}

# Vitrinas de las 7 mesas que hoy pagan solo monedas (03 §4; aprobado). Todo se imprime en la tabla de cada mesa.
VIT_TABLES = ['plinko', 'dice', 'hilo', 'bingo', 'scratch', 'boxes', 'roulette']
POST_VITRINAS = {
    'tables': VIT_TABLES,
    'chance': 0.006,
    'minStake': {'chips': 25, 'goldCapFraction': 0.25},
    'notIn': ['eterno'],
    'roll': {'consolation': 0.60, 'legendary': 0.14, 'mythic': 0.11, 'multidimensional': 0.15},
    'fallback': ['multidimensional', 'mythic', 'legendary'],
    'consolation': {'orbs': 5, 'chipsIfNone': 40, 'completeOrbsMult': 3},
    'pity': {'cat': 5, 'multidimensional': 15, 'spark': 25},
    'sellos': {'perCandyPayout': 1, 'perTiro': 5},
    'counters': {'cat': 'post:vit:<mesa>:c', 'multidimensional': 'post:vit:<mesa>:md', 'spark': 'post:vit:<mesa>:s', 'sellos': 'post:sellos'},
    '_note': 'Aprobado por el dueño el 2026-10-28. Cada gato con post.vitrina en esta lista vive en la vitrina de esa mesa ADEMÁS de su post.source (dos caminos, nunca un callejón sin salida).',
}

# La Copa Fuera de la Caja como retos anclados a tu liga (03 §5; aprobado)
POST_COPA = {
    'anchor': 'frontier',
    'minAnchorLeague': 8,
    'bout': 4,
    'multBase': 1.10, 'multStep': 0.05,
    'sequential': True,
    'firstWinPays': ['heroic', 'orbs_champion', 'champion_gems', 'first-win xp'],
    'replay': 'replay rewards of the anchor league (podio.json rewards.replay_mult), never the cat again',
    'flag': 'postchamp_<id>',
    '_note': 'Aprobado por el dueño el 2026-10-28: la Copa no ocupa ligas del escalafón; cada reto se calcula con tu liga frontera del momento.',
}

LOCKS = {
    'CARICATURA': """[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: CARICATURA (the TV-cartoon box, post Part III) — DO NOT MODIFY]
This cat belongs to the CARICATURA multiverse: the afternoon TV-cartoon block, where famous cartoon characters of the 1970s to the 2010s are cats. The drawing style itself must evoke a classic TV cartoon cel at first glance (the exact sub-style is given in the reference medium of the asset).
Visual medium: 2D TV-cartoon character, thick even dark line (#22202A, never pure black) 9-12 px at 1024 on the silhouette and 6-8 px inside, completely flat saturated fills, at most one flat shadow shape per material, simple exaggerated shapes.
Anatomy: real cat anatomy with cartoon proportions (big head, expressive eyes, short legs); both eyes open and visible.
Parody rule: the character is recognized by the signifiers listed in the asset (signature colors, silhouette, outfit and prop). Never a show title, a channel logo, a letter emblem or a redrawn human or animal character: it is a cat that evokes, not a copy.
Never: gradients, painterly blending, fur strands, halftone, grain, glitter, sketchy or hairline strokes, any text.
Camera, pose and framing: identical to the collection rules (body three-quarter toward image-left, head toward the viewer, paws on one shared baseline, whole body inside the frame).""",
    'TIRA': """[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: TIRA (the Latin American newspaper comic-strip box, post Part III) — DO NOT MODIFY]
This cat belongs to the TIRA multiverse: the Sunday comics page of Latin American newspapers, where beloved comic-strip characters are cats. The drawing style itself must evoke a classic hand-inked newspaper comic strip at first glance.
Visual medium: 2D comic-strip character, round black-brown brush ink (#1E1A1A) 10-14 px at 1024 with a slightly wobbly, hand-drawn feel, flat Sunday-page colors, NO shading except one flat shadow under the feet.
Anatomy: real cat anatomy with comic-strip proportions (a very big round head, a small body, simple dot-like eyes with a white highlight); both eyes open and visible.
Parody rule: the character is recognized by the signifiers listed in the asset (signature hairdo or fur shape, outfit and prop). Never the strip's title, signature, speech-balloon text or letters.
Never: gradients, halftone dots, paper texture, grain, glitter (the game adds the newsprint look in a shader).
Camera, pose and framing: identical to the collection rules.""",
    'ESTADIO': """[NO ONE LIKE CATS — MULTIVERSE STYLE LOCK: ESTADIO (the sports box, post Part III) — DO NOT MODIFY]
This cat belongs to the ESTADIO multiverse: a stadium where famous athletes are cats. The drawing style itself must evoke a bold sports trading card or stadium poster at first glance.
Visual medium: 2D sports illustration, bold dark line (#1B1B2F) 10-12 px at 1024, flat national-team-style kit colors, one hard stadium-light shape and one flat shadow per material, dynamic but readable silhouette.
Anatomy: real cat anatomy with athletic cartoon proportions (head about one third of the height, strong legs); the cat is a CAT, never a human or a human face.
Parody rule: the athlete is recognized by the signifiers listed in the asset (kit colors, the jersey number when the asset allows it, hair as fur, a signature pose or celebration). Never a real person's facial likeness, never club crests, sponsors, kit-brand marks or any letter.
Never: gradients, motion blur, grain, glitter, crowds or background (the game adds the stadium in a shader).
Camera, pose and framing: identical to the collection rules (at least one hind paw on the shared baseline, whole body inside the frame).""",
}

RISK_ORDER = {'bajo': 0, 'bajo-medio': 1, 'medio': 2, 'medio-alto': 3, 'alto': 4, None: 2}


def cola(entries):
    rows = sorted([e for e in entries if not e.get('reserva')], key=lambda e: (RISK_ORDER.get(e.get('riesgo_moderacion')), e['id']))
    res = [e for e in entries if e.get('reserva')]
    out = ['# Cola del lote post-p3 (DISEÑO, 2026-10-28). NO la corrió DISEÑO: la corre el agente de arte.',
           '# Orden: titulares de riesgo bajo → alto (los superhéroes al final, con su plan B listo en manifest.plan_b_en); la reserva solo si un titular se bloquea 2 veces.',
           '# Uso: cd arte-nuevo && ./_p3v2/cola.sh <HH:MM> <tamaño de ola> $(grep -v "^#" lote-post-p3/COLA.txt | grep -v "^$" | grep -v "^R ")',
           '']
    out += [f"{e['id']}:1" for e in rows]
    out += ['', '# RESERVA (descomentar quitando «R » solo si hace falta):'] + [f"R {e['id']}:1" for e in res]
    return '\n'.join(out) + '\n'


def esc(t):
    return (t or '').replace('|', '\\|')


def write_docs(DOCS, ROSTER, RESERVA, origs, cats, reserve, COPA, PHASE1, LOCK_NAME, table_of):
    J = {c['id']: c for c in cats + reserve}
    # sets → post.sets coherentes con SETS
    memb = collections.defaultdict(list)
    for s in SETS:
        for x in s['cats']:
            memb[x].append(s['id'])
    for c in cats + reserve:
        if memb.get(c['id']):
            c['post']['sets'] = memb[c['id']]
        else:
            c['post'].pop('sets', None)
    import json
    out = json.load(open(os.path.join(DOCS, '04-roster.json')))
    out['cats'], out['reserve'] = cats, reserve
    json.dump(out, open(os.path.join(DOCS, '04-roster.json'), 'w'), ensure_ascii=False, indent=1)
    open(os.path.join(DOCS, '04-roster.json'), 'a').write('\n')
    write_roster(DOCS, ROSTER, RESERVA, origs, J, COPA, PHASE1, LOCK_NAME, memb)
    write_briefs(DOCS, ROSTER, RESERVA, origs, J, LOCK_NAME)
    write_obtencion(DOCS, ROSTER, origs, J, COPA, PHASE1)


def shot_line(j):
    s = j['combat']['shot']
    bits = [s['archetype'], EL_ES[s['element']], f"daño {s['dmg']}", f"radio {s['radius']}"]
    if s['projectiles'] > 1: bits.append(f"{s['projectiles']} proyectiles")
    if s['bounces']: bits.append(f"rebota {s['bounces']}")
    if s['pierce']: bits.append(f"perfora {s['pierce']}")
    if s['status']: bits.append(f"{STATUS_ES.get(s['status'], s['status'])} {s['statusTurns']}")
    if s['speedMul'] != 1: bits.append(f"velocidad ×{s['speedMul']}")
    if s['gravityMul'] != 1: bits.append(f"gravedad ×{s['gravityMul']}")
    return ' · '.join(bits)


SRC_SHORT = {'casino:gacha': 'Portal (todos)', 'casino:gacha:michi': 'Portal Michi', 'casino:gacha:holo': 'Multiverso Holo',
             'casino:slot': 'Tragamichis', 'casino:caja': 'La Caja', 'casino:eterno': 'Modo Eterno'}


def obtain_line(j, COPA):
    p = j['post']
    if p['source'].startswith('podio:'):
        ch = COPA[p['source'][6:]]
        return f"Podio · `{p['source']}` · reto {ch['order']} de la Copa Fuera de la Caja (×{ch['mult']:.2f} sobre tu liga) · campeón {ch['trainer']}"
    s = f"Fase 1: `{p['source']}` ({SRC_SHORT[p['source']]}), peso {p['weight']}{' ★ estrella de su mesa' if p.get('star') else ''} · vitrina propuesta: {VENUE_ES[p['vitrina']]}"
    return s


def sheet_md(c, j, COPA, LOCK_NAME, memb):
    L = []
    star = ' ★' if c.get('star') else ''
    L.append(f"### {c['name']} · `{c['id']}`{star}")
    L.append(f"*{c['ep']}* · **{RARITY_ES[c['rarity']]}** · {EL_ES[c['el']]} · {ROLE_ES[c['role']]} · rasgo {TRAIT_ES[c['trait']]}{' · limitación ' + c['lim'] if c.get('lim') else ''}")
    L.append('')
    if c['rarity'] == 'multidimensional':
        L.append(f"- **Referencia:** {c['src']} — {c['med']}." + (f" ({c['cat']}.)" if c.get('cat') else ''))
        L.append(f"- **Rasgos icónicos:** {'; '.join(c['traits'])}.")
        L.append(f"- **Riesgo de moderación:** {c['risk']}. **Plan B:** {c['planb']}")
    L.append(f"- **Forma de batalla:** {c['form']} · «{c['fcry']}»")
    s = j['combat']['shot']
    L.append(f"- **Tiro:** {s['name']} — «{s['cry']}» · {shot_line(j)}. {s['special']} (recarga {j['combat']['recarga']})")
    u = j['combat']['ultimate']
    tag = 'Ulti = PODER MULTIDIMENSIONAL' if c['rarity'] == 'multidimensional' else 'Ulti'
    L.append(f"- **{tag}:** **{u['name']}** — {u['effect']}")
    if c['rarity'] == 'multidimensional':
        L.append(f"  - *En una línea (Catdex):* {c['pw']}")
        L.append(f"  - *Números para PODERES (`battle/multidim.ts`):* {c['nums']}")
        if c.get('pair'):
            L.append(f"  - *Pareja:* combina con `{c['pair']}`.")
    L.append(f"- **Pasiva:** {c['passive']} · **{j['combat']['star3']}** · **{j['combat']['star5']}**")
    L.append(f"- **Pista:** {c['hint']}")
    L.append(f"- **Lore:** {c['lore']}")
    if c['rarity'] == 'multidimensional':
        L.append(f"- **Universo de la revelación (2,2 s):** **{c['uni'][0]}** — {c['uni'][1]} **Remate:** «{c['uni'][2]}»")
    L.append(f"- **Cómo se consigue:** {obtain_line(j, COPA)}" + (f" · sets: {', '.join(memb[c['id']])}" if memb.get(c['id']) else ''))
    style = LOCK_NAME[c['art']['fam']] if 'fam' in c['art'] else 'casa (STYLE_LOCK + referencias)'
    L.append(f"- **Arte:** `{c['art']['slug']}` · estilo {style} · prompt `prompts/{LOTE_DIR}/{c['id']}.md`")
    L.append('')
    return '\n'.join(L)


GROUPS = [('Anime y manga', 'md_anime'), ('Literatura', 'md_libros'), ('Caricaturas, historieta y animación', 'md_caricaturas'),
          ('Cómics y videojuegos', 'md_comics_juegos'), ('Cine, series e historia', 'md_pantalla'), ('Música y deporte (personas reales)', 'md_musica_deporte')]


def group_of(c):
    import inspect
    return c.get('_g')


def write_roster(DOCS, ROSTER, RESERVA, origs, J, COPA, PHASE1, LOCK_NAME, memb):
    import md_anime, md_libros, md_caricaturas, md_comics_juegos, md_pantalla, md_musica_deporte  # noqa
    # agrupar por archivo de origen (el orden de ROSTER ya es por archivo)
    bounds = {}
    ids_by_mod = {}
    for title, mod in GROUPS:
        src = open(os.path.join(os.path.dirname(__file__), mod + '.py')).read()
        ids_by_mod[mod] = [c['id'] for c in ROSTER if f"id='{c['id']}'" in src]
    L = ['# 01 · Roster post-Parte III', '',
         '> ⚠️ SPOILERS de la Parte III. Generado por `fuente/generar.py` desde la fuente única (`fuente/*.py`): no editar a mano.',
         f"> **{len(ROSTER)} Multidimensionales**, **{sum(1 for c in origs if c['rarity']=='mythic')} Míticos**, **{sum(1 for c in origs if c['rarity']=='legendary')} Legendarios**, **{sum(1 for c in origs if c['rarity']=='heroic')} Heroicos** y **{len(RESERVA)} Multidimensionales de reserva**. ★ = la estrella (el más difícil) de su mesa.",
         '> Los números de combate siguen la calibración medida en las 155 especies (MD: daño de tiro 50–86, ulti 100, una vez por batalla, tope 45 % / jefe 18 %; mítico: tope 40 %; legendario y heroico: 35 %). Cada poder MD trae su línea de «números para PODERES».', '',
         '## Índice', '', '| Gato | Rareza | Referencia o idea | Elemento · rol | De dónde (fase 1) |', '|---|---|---|---|---|']
    for c in ROSTER:
        j = J[c['id']]
        L.append(f"| {c['name']} (`{c['id']}`){' ★' if c.get('star') else ''} | MD | {esc(c['src'].split(' (')[0])} | {EL_ES[c['el']]} · {ROLE_ES[c['role']]} | {SRC_SHORT.get(j['post']['source'], j['post']['source'])} |")
    for c in origs:
        j = J[c['id']]
        src = j['post']['source']
        L.append(f"| {c['name']} (`{c['id']}`) | {RARITY_ES[c['rarity']]} | {esc(c['ep'])} | {EL_ES[c['el']]} · {ROLE_ES[c['role']]} | {SRC_SHORT.get(src, src)} |")
    L.append('')
    L.append('## Multidimensionales (60)')
    L.append('')
    for title, mod in GROUPS:
        ids = ids_by_mod[mod]
        L.append(f"## MD · {title} ({len(ids)})")
        L.append('')
        for c in ROSTER:
            if c['id'] in ids:
                L.append(sheet_md(c, J[c['id']], COPA, LOCK_NAME, memb))
    for rar, title in (('mythic', 'Míticos (20) · dos por mesa del casino'), ('legendary', 'Legendarios (10) · «Leyendas de la Casa», uno por mesa'), ('heroic', 'Heroicos (8) · la Copa Fuera de la Caja (Podio)')):
        L.append(f'## {title}')
        L.append('')
        for c in origs:
            if c['rarity'] == rar:
                L.append(sheet_md(c, J[c['id']], COPA, LOCK_NAME, memb))
    L.append('## Reserva (16)')
    L.append('')
    L.append('Entran solo si la herramienta de imágenes bloquea dos veces a un titular (`arte-v2/01` §3.1) o si el dueño cambia uno. El campo «cubre» dice a quién reemplaza primero.')
    L.append('')
    for c in RESERVA:
        L.append(sheet_md(c, J[c['id']], COPA, LOCK_NAME, memb).replace('### ', '### (reserva) ', 1) + f"- **Cubre:** {c.get('swap')}\n")
    open(os.path.join(DOCS, '01-roster.md'), 'w').write('\n'.join(L) + '\n')


def write_briefs(DOCS, ROSTER, RESERVA, origs, J, LOCK_NAME):
    L = ['# 02 · Briefs de arte del lote post-P3', '',
         '> ⚠️ SPOILERS. Generado por `fuente/generar.py`. Los prompts viven fuera del repo: `~/Desktop/No one - raster (fuera del repo)/arte-nuevo/prompts/lote-post-p3/<id>.md` (sección «## B. Final image prompt», la que extrae `gen.sh`).',
         '> **DISEÑO no generó ninguna imagen.** La cola la corre otro agente.', '',
         '## 1. Qué se agregó en arte-nuevo (solo agregar; nada se borró ni se sobrescribió)', '',
         f'- **{len(ROSTER) + len(RESERVA) + len(origs)} entradas** nuevas en `manifest.json`, todas con `folder: "lote-post-p3"`, `lote: "post"`, `coat_en` obligatorio y los campos v2 de referencia (`reference_en`, `signifiers_en`, `evoke_not_copy_en`, `style_of_en`, `rarity_treatment_en`, `referencia_es`). Extras para el equipo: `slug`, `riesgo_moderacion`, `plan_b_es`, `plan_b_en`, `reserva`, `post_source` (el compilador los ignora).',
         '- Respaldo del manifest previo: `_respaldos/manifest-antes-lote-post-p3-<fecha>.json`.',
         '- Prompts compilados con `node herramientas/compilar.mjs <id>` (uno por id; `comun.mjs` no conoce un lote «post», así que se compila por id).',
         '- Carpeta `lote-post-p3/` con `_crudos/` vacía (ahí copia Codex), `estilo/` (3 style locks nuevos) y `COLA.txt` (orden sugerido).',
         '- **Style locks nuevos** (en `lote-post-p3/estilo/`, no en `estilo/`, para no tocar los bloques fijos): **CARICATURA** (caricatura de TV de los 70–2010), **TIRA** (historieta latinoamericana de periódico) y **ESTADIO** (póster deportivo). El manifest los apunta con `style_lock: "../lote-post-p3/estilo/<LOCK>.txt"` (compilar.mjs lee la ruta relativa a `estilo/`). Si el director prefiere, se mueven a `estilo/dimensiones/` y se cambia la ruta.',
         '- Los originales (Míticos, Legendarios, Heroicos) usan el **estilo de la casa** (STYLE_LOCK + las 3 referencias), como los Heroicos y Divinos del lote C; su `element_dimensions` sale de la tabla del manifest.', '',
         '## 2. Cómo correrlo', '',
         '```bash', 'cd "~/Desktop/No one - raster (fuera del repo)/arte-nuevo"',
         '# un gato:', './_p3v2/gen.sh xp_gomitas 1',
         '# en olas (normaliza solo lo que sale):', './_p3v2/cola.sh 03:00 4 $(grep -v "^#" lote-post-p3/COLA.txt | grep -v "^$" | grep -v "^R ")',
         '# revisión:', 'node herramientas/validar.mjs <id>   # y la hoja de contacto v2 de _p3v2/herramientas/contacto-v2.mjs', '```', '',
         '**Si se bloquea** (`moderation_blocked`): no se insiste con la misma imagen. Se agrega a `corrections_en` el rasgo de `plan_b_en` (o la línea de «Plan B» de abajo, traducida) y se recompila; máximo 2 reintentos; si sigue, entra la reserva que cubra ese grupo (`01-roster` §Reserva). Los superhéroes van al final de la cola por eso.', '',
         '**Personas reales** (músicos, futbolistas): son gatos; nunca su cara; el `must_not_include_en` agrega «No real-person likeness…». Los futbolistas son los únicos con un glifo permitido: su número de selección (plan B: sin número).', '',
         '## 3. Tabla de briefs', '',
         '| id | Nombre | Rareza | Estilo | Riesgo | Rasgos que siempre se ven | Plan B |', '|---|---|---|---|---|---|---|']
    for c in ROSTER + RESERVA:
        st = LOCK_NAME[c['art']['fam']]
        L.append(f"| `{c['id']}`{' (R)' if c.get('reserve') else ''} | {esc(c['name'])} | MD | {st} | {c['risk']} | {esc('; '.join(c['traits']))} | {esc(c['planb'])} |")
    for c in origs:
        L.append(f"| `{c['id']}` | {esc(c['name'])} | {RARITY_ES[c['rarity']]} | casa | bajo | {esc('; '.join(c['art']['feats']))} | — |")
    L += ['', '## 4. Riesgo por grupo', '']
    cnt = collections.Counter(c['risk'] for c in ROSTER)
    L.append('Titulares: ' + ', '.join(f'{k}: {v}' for k, v in sorted(cnt.items(), key=lambda kv: RISK_ORDER.get(kv[0], 9))) + '.')
    L.append('')
    L.append('- **Alto** (superhéroes de las editoriales más litigiosas): Supermichi, Hierro Michi, Capitán Michimérica, Doctor Doomiau. Cada uno trae un disfraz casero o alternativo desde el primer intento (`plan_b_en`).')
    L.append('- **Medio-alto**: personajes con dueño muy protector o con estilo de render muy reconocible (Bob Esponja, Shrek, Gru, el Minion, Sonic, Wolverine, Michi-Wan).')
    L.append('- **Bajo**: dominio público (los 6 clásicos, María Antonieta), anime de los 80 y personajes muy genéricos.')
    open(os.path.join(DOCS, '02-arte-briefs.md'), 'w').write('\n'.join(L) + '\n')


def write_obtencion(DOCS, ROSTER, origs, J, COPA, PHASE1):
    allc = ROSTER + origs
    by_src = collections.defaultdict(list)
    by_vit = collections.defaultdict(list)
    for c in allc:
        j = J[c['id']]
        by_src[j['post']['source']].append(c)
        if c['rarity'] != 'heroic':
            by_vit[c['venue']].append(c)
    T = []

    def pool_table(lst):
        rows = ['| Gato | Rareza | Peso |', '|---|---|---|']
        for c in sorted(lst, key=lambda c: ({'legendary': 0, 'mythic': 1, 'multidimensional': 2}[c['rarity']], c['name'])):
            rows.append(f"| {c['name']}{' ★' if c.get('star') else ''} | {RARITY_ES[c['rarity']]} | {J[c['id']]['post']['weight']} |")
        return '\n'.join(rows)

    fase1 = ['| Mesa (post.source) | Gatos | MD · Mít · Leg | Parte / garantía aprobada (antes, provisional) |', '|---|---|---|---|']
    prov = {'gacha': '0.25 / 6', 'slot': '0.25 / 6', 'caja': '0.25 / 4', 'eterno': '0.5 / 2'}
    for src in ['casino:gacha', 'casino:gacha:michi', 'casino:gacha:holo', 'casino:slot', 'casino:caja', 'casino:eterno']:
        lst = by_src[src]
        k = collections.Counter(c['rarity'] for c in lst)
        g = src.split(':')[1]
        rec = POST_CASINO[g]
        fase1.append(f"| `{src}` · {SRC_SHORT[src]} | {len(lst)} | {k['multidimensional']} · {k['mythic']} · {k['legendary']} | **{rec['share']} / {rec['pity']}** (antes {prov[g]}) |")
    pools = []
    for src in ['casino:gacha', 'casino:gacha:michi', 'casino:gacha:holo', 'casino:slot', 'casino:caja', 'casino:eterno']:
        pools.append(f"#### `{src}` — {SRC_SHORT[src]} ({len(by_src[src])})\n\n" + pool_table(by_src[src]) + '\n')
    if True:
        pass
    vit = ['| Mesa (`post.vitrina`) | También sale de (`post.source`) | Legendario | Míticos | Multidimensionales (★ = estrella, peso 4) |', '|---|---|---|---|---|']
    for v in VIT_TABLES:
        lst = by_vit[v]
        leg = ', '.join(c['name'] for c in lst if c['rarity'] == 'legendary')
        my = ', '.join(c['name'] for c in lst if c['rarity'] == 'mythic')
        md = ', '.join(c['name'] + (' ★' if c.get('star') else '') for c in lst if c['rarity'] == 'multidimensional')
        vit.append(f"| {VENUE_ES[v]} (`{v}`) | `{PHASE1[v]}` | {leg} | {my} | {md} |")
    copa = ['| Reto | id (`podio:<id>`) | Multiplicador | Entrenador (lobby) | Su línea | Paga | Caja |', '|---|---|---|---|---|---|---|']
    for ch in COPA.values():
        prize = J[ch['prize']]['name']
        copa.append(f"| {ch['order']} | `{ch['id']}` | ×{ch['mult']:.2f} | {ch['trainer']} | {ch['line']} | {prize} (`{ch['prize']}`) | {ch['box']} |")
    sets = ['| Set | Gatos | Regla |', '|---|---|---|']
    names = {**{c['id']: c['name'] for c in allc}, 'x_harrygatter': 'Harry Gatter', 'x_murciegato': 'Murciégato', 'x_gatarana': 'Gato Araña', 'e_comecroquetas': 'Comecroquetas'}
    for s in SETS:
        sets.append(f"| **{s['name']}** (`{s['id']}`) | {', '.join(names.get(x, x) for x in s['cats'])} | {s['rule']} |")
    txt = OBTENCION.format(fase1='\n'.join(fase1), pools='\n'.join(pools), vitrinas='\n'.join(vit), copa='\n'.join(copa), sets='\n'.join(sets),
                           champs_ts=',\n'.join(f"  {{ id: '{ch['id']}', order: {ch['order']}, mult: {ch['mult']:.2f}, trainer: '{ch['trainer']}' }}" for ch in COPA.values()),
                           n_md=len(ROSTER), n_orig=len(origs))
    open(os.path.join(DOCS, '03-obtencion.md'), 'w').write(txt)


OBTENCION = """# 03 · Cómo se consiguen: la economía después de la Parte III

> ⚠️ SPOILERS. Agente DISEÑO, 2026-10-28. Las tablas las genera `fuente/generar.py` (no editarlas a mano); el texto es fijo.
> **Aprobado por el dueño el 2026-10-28** («dale con tus recomendaciones, las 4»): los números de `POST_CASINO` (§3), las **vitrinas** en las otras 7 mesas (§4), la **Copa como retos anclados a tu liga** (§5) y Merlina → «Michiércoles» sin la mano mascota.
> Lo implementa SISTEMA desde este documento. Lo que ya existe: `agentes/SISTEMA.md`, `game/src/data/postp3/reglas.ts`, `state/sys/postp3.ts`. Los números de §4 y §5 están también en `04-roster.json → postVitrinas` y `postCopa`.

## 0. En una frase

Cuando la Parte III termina («Continuará»), el Casino del Gato Negro y el Podio se llenan de gatos nuevos. Los **{n_md} Multidimensionales, 20 Míticos y 10 Legendarios** salen de dos lugares:
- las cuatro mesas grandes (Portal, Tragamichis, La Caja y Modo Eterno);
- la **vitrina** de cada una de las otras siete mesas.

Los **8 Heroicos** los pagan los ocho retos de la **Copa Fuera de la Caja** en el Podio, que siempre se ponen a la altura de tu liga.

## 1. Reglas de la casa (se cumplen todas)

| Regla | Cómo se cumple |
|---|---|
| Sin dinero real | Todo sale de boletos, ojos de gato, fichas y oro ganados jugando. Nada se vende. |
| Sin anuncios | Ninguno. |
| Sin energía | No hay límite de tiradas, apuestas, tiros de vitrina ni intentos de la Copa. |
| Sin diarias | Nada depende del reloj ni del calendario. |
| Probabilidades visibles | Cada mesa imprime su parte, su garantía, el peso de cada gato, la probabilidad del Momento Vitrina, la tabla del Tiro de Vitrina y sus contadores. Las probabilidades de cada mesa **no cambian**: el Momento Vitrina es una tirada aparte que no toca el RTP. |
| Garantías | Mesas grandes: contador por mesa (§3). Vitrinas: un gato cada 5 tiros, un Multidimensional cada 15 y la chispa a los 25 (§4). Copa: el reto no se vence nunca y se reintenta gratis (§5). |

## 2. El candado

`postP3Unlocked()` (SISTEMA): se abre cuando viste «Continuará» (`b96_continuara`), o cuando H96 está cumplida, o cuando la historia ya pasó (H97 o una misión posterior). **Nada del lote existe antes**: no hay vitrinas, no hay Copa, la Catdex no los muestra y ninguna mesa los nombra. Ningún gato sale entre SADIE y «Continuará» (regla del duelo, `08` F-8).

## 3. Las cuatro mesas grandes (plomería de SISTEMA, ya construida)

Cuando el Portal, la Tragamichis (con fichas, líneas de GATO NEGRO), La Caja (Gato Misterioso) o el Modo Eterno sacan un gato **legendario o mítico**, una **parte** de ellos sale de la bolsa del Multiverso de esa mesa (por peso; ×3 si no lo tienes) y la **garantía** asegura uno cada tantos. Cada gato dice su mesa en `post.source`.

### 3.1 Reparto y números aprobados

{fase1}

`POST_CASINO` aprobado (pegar en `data/postp3/reglas.ts`):

```ts
gacha:  {{ share: 0.5,  pity: 3, subs: {{ michi: 'PORTAL MICHI', holo: 'MULTIVERSO HOLO' }} }},
slot:   {{ share: 0.4,  pity: 4 }},
caja:   {{ share: 0.6,  pity: 2 }},
eterno: {{ share: 0.75, pity: 2 }},
```

Por qué esos números:
- **Portal:** con 0.25 / 6, un gato del lote tardaba 5–6 h en salir. Con 0.5 / 3 sale uno cada ~1.5–2 h de Portal.
- **Tragamichis:** es la mesa de más volumen, así que necesita menos parte que el Portal.
- **La Caja:** es la mesa más lenta (500 fichas, 10 % de legendario) y su bolsa es chica.
- **Modo Eterno:** se arriesga todo, y el riesgo se paga.

**Las 56 fichas de las siete vitrinas también viven en una mesa grande.** Su `post.source` es Portal Michi, Multiverso Holo, Tragamichis o La Caja. Así ningún gato queda en un callejón sin salida, y el validador de hoy los acepta.

### 3.2 Bolsas de cada mesa grande

{pools}

## 4. Las vitrinas de las otras siete mesas (aprobado)

**Mesas:** Plinko, Duelo de Dados, Mayor o Menor, Bingo Exprés, Rasca y Gana, Cajas Misteriosas y Ruleta. Hoy pagan solo monedas.

**Qué cambia:** cada una tiene su **vitrina** con **8 gatos**: 1 legendario, 2 míticos y 5 Multidimensionales, uno de ellos la «estrella», con peso 4. El campo `post.vitrina` de cada gato dice cuál es la suya.

{vitrinas}

### 4.1 Momento Vitrina (cuándo se gana un tiro)

- **Apuesta que cuenta:** de **25 fichas o más**, o en oro de **¼ del tope de esa mesa o más** (la tercera opción de `miniStakes`). Las apuestas más chicas se juegan igual, pero no abren la vitrina.
- **Probabilidad:** **0.6 % fija por apuesta que cuenta**. Se tira aparte (RNG criptográfico), al liquidar la apuesta (`settle`), sin importar si ganaste o perdiste: **no toca el RTP** ni las tablas de la mesa.
- **Qué cuenta como apuesta en cada mesa:**
  - una caída en el Plinko;
  - un duelo pagado en Dados;
  - una mano pagada en Mayor o Menor;
  - un cartón en el Bingo (cada cartón se paga aparte, así que cada uno tira);
  - un boleto en el Rasca;
  - un estante pagado en Cajas;
  - una tirada en la Ruleta (aunque lleve varias fichas, es una sola apuesta).
- **No corre en el MODO ETERNO** (ahí la velocidad lo volvería una llave de agua). Con el auto de ×1/×10/×20 sí corre: lo que limita son las fichas, que salen de jugar.
- **En pantalla:** «¡SE ABRIÓ LA VITRINA!», con lo dorado de cada mesa: la croqueta dorada del Plinko, el dado dorado de Don Cubilete, la carta dorada, la bolita dorada, la casilla dorada del Rasca, la décima caja dorada y el bolsillo dorado de la Ruleta. El tiro se resuelve y se guarda **antes** de la animación, como todo premio del casino.

### 4.2 Tiro de Vitrina (qué da)

| Resultado | Probabilidad |
|---|---|
| Consuelo: 5 orbes de un gato de esa vitrina que ya tengas (por peso), o 40 fichas si no tienes ninguno | 60 % |
| Su legendario | 14 % |
| Uno de sus 2 míticos (por peso) | 11 % |
| Uno de sus 5 Multidimensionales (por peso; la estrella pesa 4, los demás 10) | 15 % |

- **No repite:** solo salen gatos de esa vitrina que **no tienes**.
  - Si la rareza que salió ya está completa, baja a la siguiente que te falte, en este orden: Multidimensional → mítico → legendario.
  - Con la vitrina completa, todo tiro es consuelo con orbes ×3 (15 orbes).
- **Garantías por vitrina** (contadores en `casino.pity`, sin campo nuevo):
  - `post:vit:<mesa>:c`: si van **5 tiros** sin gato, el siguiente es un gato.
  - `post:vit:<mesa>:md`: si van **15 tiros** sin Multidimensional, el siguiente es uno.
  - `post:vit:<mesa>:s` (la **chispa**): a los **25 tiros** en esa vitrina puedes **elegir** cualquier gato que te falte de ella, y el contador vuelve a 0.
  - Las tres se imprimen con su cuenta («faltan 3»).
- **Sellos:** cada vez que LA CASA TE DEBE paga (cada 15 apuestas perdidas), da además **1 Sello** (contador `post:sellos`). Con **5 Sellos** tienes **1 Tiro** en la vitrina que elijas. Es la forma de apuntarle a la mesa que quieras.
- **Ritmo esperado:**
  - ~1 tiro por cada 100 apuestas que cuentan, sumando Sellos;
  - 12–20 tiros por hora de casino activo;
  - ~20 tiros por vitrina, así que las siete se completan en ~8–13 h de mesas, más lo que llega por las mesas grandes.

### 4.3 Para SISTEMA

- `PostGame` crece con `plinko | dice | hilo | bingo | scratch | boxes | roulette`.
  - La bolsa de una vitrina se arma con `post.vitrina === <mesa>`.
  - `post.source` sigue siendo su camino por la mesa grande: el gato vive en los dos.
- Los números están en `04-roster.json → postVitrinas`.
- La tabla de cada mesa (`panels/casino/games/odds.ts` y `postOdds.ts`) agrega una pestaña **VITRINA** con:
  - la probabilidad del Momento Vitrina;
  - la tabla del Tiro;
  - los 8 gatos, cada uno marcado con ✓ si lo tienes;
  - los tres contadores y los Sellos.
- El canje de Sellos va en esa misma pestaña.

## 5. La Copa Fuera de la Caja: retos anclados a tu liga (aprobado)

Cada caja de la Parte III, y tres de paso, manda a su campeón. La Copa es **una fila aparte en el lobby del Podio**: no ocupa ligas del escalafón, así que nadie tiene que llegar a la liga 16 para verla.

### 5.1 Los retos

{copa}

### 5.2 Cómo funciona

- **Orden:** los retos van **en secuencia**. Se ve el siguiente sin ganar; los otros se ven sellados, con su caja y la silueta de su Heroico.
- **Poder del campeón**, calculado con tu liga frontera **del momento** (`ps().league`), nunca por debajo de la 8:
  `poder = poder del campeón de esa liga (bout 4, con champion_mult) × multiplicador del reto`.
  - El multiplicador es 1.10 en el primer reto y sube 0.05 por reto, hasta 1.45 en el octavo.
  - Siempre es un poco más difícil que tu liga y siempre es alcanzable. Si subes de liga, el reto sube contigo: no se puede esperar a que sea fácil.
- **Su gato:** cada campeón pelea **con** el Heroico que paga (como hoy: «beat Zarpa to win Zarpa»), con las estrellas y el nivel que `rival()` le daría en esa liga.
- **Paga una sola vez**, con la bandera `postchamp_<id>`:
  - la primera victoria da el Heroico, más `orbs_champion`, `champion_gems` y la XP de primera victoria;
  - después, el reto se puede repetir con la recompensa de revancha de esa liga (`rewards.replay_mult`), sin el gato.
- **Perder no cuesta nada:** sin energía y sin espera; se reintenta cuando quieras.
- **Requisitos:** que `podioUnlocked()` y `postP3Unlocked()` estén abiertos.

### 5.3 Para SISTEMA

`POST_CHAMPIONS` deja de usar `league` y pasa a ser la lista ordenada de retos:

```ts
export interface PostChampion {{ id: string; order: number; mult: number; trainer?: string }}
export const POST_CHAMPIONS: PostChampion[] = [
{champs_ts},
];
```

Los parámetros (`anchor`, `minAnchorLeague`, `bout`, `multBase`, `multStep`) están en `04-roster.json → postCopa`. Las líneas del lobby están en `postChampions[].line`.

## 6. Sets del Catdex

Las reglas marcadas **«Propuesta»** son balance y el dueño las decide al probar. Las demás son «Colección», como Puerto Cometa. Ya están en `04-roster.json → catdexSets`, con el formato de `content.json`.

{sets}

## 7. Requiere sistema nuevo (sigue abierto)

Lo aprobado ya está arriba, en §3–5. Queda abierto:
1. **Un estandarte propio en el Portal, «MULTIVERSO DESBORDADO»** (`casino:gacha:desborde`).
   - Tabla: común 50 %, raro 30 %, épico 13 %, legendario 4.5 %, mítico 1 % y **MULTIDIMENSIONAL 1.5 %**.
   - Garantías: Multidimensional seguro a los 70 tiros y mítico seguro a los 140.
   - El destacado cambia con tu progreso (el siguiente Multidimensional que te falta), nunca con la fecha.
   - Los 19 gatos de `casino:gacha` pasarían ahí.
2. **Combos de pareja** (`post.pair`).
   - Grrrú + Miaunion: el rayo congela a dos y los plátanos congelan.
   - Heisenmiau + Pinkmiau, si entra la reserva: la nube pega doble.
   - Los Tres del Colegio.
   - Los números están en cada ficha (`01-roster`).
3. **Las seis reglas «Propuesta» de §6.**

## 8. Qué medir cuando el dueño juegue

1. Minutos hasta el primer gato del lote, en las mesas grandes y en las vitrinas. Meta: menos de 30 min de casino activo.
2. Horas hasta completar todo el casino. Meta: 25–40 h.
3. Que ningún tramo de más de ~1 h de casino pase sin un gato del lote o sin un tiro garantizado a la vista.
4. Que cada reto de la Copa se gane en 1–5 intentos con el mejor gato del jugador.
"""
