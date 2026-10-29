"""
Fuente única del lote post-Parte III (agente DISEÑO, 2026-10-28).
Cada gato se escribe UNA vez (md_*.py, reservas.py, originales.py) y generar.py produce:
  01-roster.md · 02-arte-briefs.md · 04-roster.json · las entradas del manifest de arte-nuevo (lote-post-p3).
Nada de aquí entra al juego directo: el JSON lo cargan los agentes de datos y sistemas.
"""

ROSTER = []      # Multidimensionales titulares
RESERVA = []     # Multidimensionales de reserva
ORIGINALES = []  # Míticos, Legendarios y Heroicos

EL_ES = {'fire': 'Fuego', 'water': 'Agua', 'nature': 'Naturaleza', 'earth': 'Tierra', 'storm': 'Tormenta',
         'magic': 'Magia', 'cosmic': 'Cósmico', 'void': 'Vacío', 'ice': 'Hielo', 'sound': 'Sonido',
         'shadow': 'Sombra', 'time': 'Tiempo', 'light': 'Luz', 'crystal': 'Cristal', 'gravity': 'Gravedad'}
ROLE_ES = {'artillero': 'Artillero', 'demoledor': 'Demoledor', 'francotirador': 'Francotirador',
           'asediador': 'Asediador', 'soporte': 'Soporte', 'tanque': 'Tanque', 'controlador': 'Controlador',
           'invocador': 'Invocador'}
TRAIT_ES = {'impaciente': 'Impaciente', 'piromano': 'Pirómano', 'gloton': 'Glotón', 'dormilon': 'Dormilón',
            'chismoso': 'Chismoso', 'bravucon': 'Bravucón', 'miedoso': 'Miedoso', 'presumido': 'Presumido',
            'rencoroso': 'Rencoroso', 'curioso': 'Curioso', 'perezoso': 'Perezoso', 'leal': 'Leal',
            'travieso': 'Travieso', 'callejero': 'Callejero'}
RARITY_ES = {'multidimensional': 'Multidimensional', 'mythic': 'Mítico', 'legendary': 'Legendario', 'heroic': 'Heroico'}
STATUS_ES = {'ardiendo': 'Ardiendo', 'mojado': 'Mojado', 'enraizado': 'Enraizado', 'cargado': 'Cargado',
             'maldito': 'Maldito', 'ingravido': 'Ingrávido', 'vacio': 'Borrado', 'congelado': 'Congelado',
             'aturdido': 'Aturdido', 'cegado': 'Cegado', 'prisma': 'Prisma', 'flotando': 'Flotando',
             'corriente': 'Corriente', 'revelado': 'Revelado', 'sellado': 'Sellado', 'marcado': 'Marcado',
             'vapor': 'Vapor'}

# tiro por defecto de cada elemento (los ids reales de data/content.json + rupturas)
EL_SHOT = {'fire': ('bola_rebote', 'ardiendo', 2), 'water': ('torpedo', 'mojado', 2), 'nature': ('semilla', 'enraizado', 2),
           'earth': ('roca', None, 0), 'storm': ('rayo', 'cargado', 1), 'magic': ('runa', 'maldito', 2),
           'cosmic': ('orbe_gravitatorio', 'ingravido', 2), 'void': ('borrado', 'vacio', 2), 'ice': ('carambano', 'congelado', 1),
           'sound': ('onda', 'aturdido', 1), 'shadow': ('sombra', 'maldito', 2), 'time': ('reloj', None, 0),
           'light': ('haz', 'cegado', 1), 'crystal': ('bola_rebote', 'prisma', 2), 'gravity': ('orbe_gravitatorio', 'flotando', 2)}

# daño base del tiro por rareza (medido contra las 155 especies: MD 50–86, mítico ≤100, legendario ~80, heroico 70–95)
BASE_DMG = {'multidimensional': 74, 'mythic': 84, 'legendary': 80, 'heroic': 84}
# rol → (delta de daño, radio, perforación)
ROLE_SHOT = {'artillero': (0, 1.2, 0), 'demoledor': (8, 1.6, 0), 'francotirador': (10, 0.9, 1), 'asediador': (-10, 1.3, 0),
             'soporte': (-14, 1.2, 0), 'tanque': (-8, 1.3, 0), 'controlador': (-6, 1.2, 0), 'invocador': (-8, 1.2, 0)}
HEAVY = {'demoledor', 'tanque', 'invocador'}

# ulti por rareza: daño, usos, tope de estructura (07-poderes: MD 45 %; legendario 35 %; míticos 35–40 %; heroicos 35 % sin límite de usos)
ULT = {'multidimensional': (100, 1, 0.45), 'mythic': (110, 1, 0.40), 'legendary': (100, 1, 0.35), 'heroic': (90, None, 0.35)}

VENUE_ES = {'slot': 'Tragamichis', 'roulette': 'Ruleta', 'plinko': 'Plinko «La Cascada»', 'dice': 'Duelo de Dados',
            'hilo': 'Mayor o Menor', 'bingo': 'Bingo Exprés', 'scratch': 'Rasca y Gana', 'boxes': 'Cajas Misteriosas',
            'gacha': 'Portal «Multiverso Desbordado»', 'eterno': 'Modo Eterno'}

# ---------------------------------------------------------------- arte: bloques por familia (sacados del manifest v2)
RIG = ['Both eyes open with visible irises; both ears free with negative space around the tips; the tail fully visible and away from the face.',
       'Props are held at least 3% of the canvas away from the eyes; nothing covers the face.']
MNI = ['No logos, no letters or numbers anywhere; nothing traced from an existing character.', 'No human, no human face, no background.']
MNI_REAL = 'No real-person likeness, no song, album or tour names, no letters, no logos.'
EVOKE = ['Cat anatomy everywhere: cat ears, cat nose, whiskers, a cat tail and paws; the reference is worn by a cat, never a redrawn human or character.',
         'Any emblem is an original shape; never an existing logo.']
MD_TREAT = 'Multidimensional: a cat that keeps its own drawing style in every box. Iconic, instantly readable silhouette; no extra ornaments: the reference IS the rarity.'
EXPR = 'mouth closed unless a signifier says otherwise, both eyes open with visible irises'

LOTE_DIR = 'lote-post-p3'
FAM = {
    'anime': dict(dimension='anime', style_lock='dimensiones/ANIME_V2.txt', style_of_en='a TV anime key frame',
                  proportions_en='anime: large expressive eyes, athletic body, spiky fur clumps', line_en='clean colored line 6-8 px at 1024, never pure black',
                  color_en='flat fills per section', shading_en='two-tone hard-edged cel shading, one hard highlight per eye'),
    'libros': dict(dimension='libros', style_lock='dimensiones/LIBROS_V2.txt', style_of_en='a classic Victorian storybook illustration plate',
                   proportions_en='Victorian storybook: big head, slender body', line_en='sepia pen line (#4A3020) 6-10 px at 1024, never hairline',
                   color_en='flat watercolor fills in 2-3 values with defined edges', shading_en='flat wash in 2 values'),
    'superheroes': dict(dimension='superheroes', style_lock='dimensiones/SUPERHEROES_V2.txt', style_of_en='a classic American superhero comic panel: heavy inks and spotted blacks',
                        proportions_en='heroic: head about one quarter of the height, broad chest, sturdy legs', line_en='variable-weight dark indigo ink (#1B1530) 12-16 px on the silhouette, 6-8 px inside',
                        color_en='flat four-color comic fills', shading_en='two-tone hard-edged cel shading with one flat rim light'),
    'pop': dict(dimension='pop', style_lock='dimensiones/POP_V2.txt', style_of_en='a glossy pop music-video still',
                proportions_en='pop doll: big head, slim body', line_en='colored line 8-12 px on materials, no line on highlights',
                color_en='flat neon and pastel fills', shading_en='one flat shadow and one hard stage-light shape'),
    'pantalla': dict(dimension='pantalla', style_of_en='a hand-painted classic movie poster translated to flat shapes',
                     proportions_en='cinematic cartoon: head about one third of the height', line_en='bold contour 10-14 px at 1024',
                     color_en='flat fills (the game turns noir, monster and silent cats black and white)', shading_en='one dramatic key light drawn as hard flat light and shadow shapes'),
    'pixel': dict(dimension='pixel', style_of_en='a 16-bit console sprite enlarged with nearest-neighbor: perfectly square pixels',
                  proportions_en='sprite: big head, compact body', line_en='a one-grid-pixel dark outline (#2A1A2E)',
                  color_en='flat sprite palette of 10-16 colors, each pixel one flat color', shading_en='two values per material as pixel clusters'),
    'vecindad': dict(dimension='vecindad', style_of_en='a warm 1970s-80s Latin American TV studio show turned into a cartoon',
                     proportions_en='sitcom: big head, expressive eyes, soft body', line_en='bold warm-brown contour (#3B2418) 10-12 px at 1024',
                     color_en='flat saturated fills with a warm studio cast', shading_en='one flat shadow per material and one flat studio-light shape'),
    'mitos': dict(dimension='mitos', style_of_en='Egyptian tomb painting: flat mineral colors, bold contour, gold and lapis',
                  proportions_en='real cat anatomy, regal proportions', line_en='thick contour 10-14 px at 1024',
                  color_en='flat mineral pigments: ochre, terracotta, lapis, jade, gold, bone white, black', shading_en='at most one flat shadow shape per material'),
    'pinceles': dict(dimension='pinceles', style_of_en='in the manner of an 18th-century rococo court portrait (Vigée Le Brun): soft pastel silks rendered as big flat strokes',
                     proportions_en='mild cartoon: head about one third of the height', line_en="the painter's own contour language, never thinner than 8 px",
                     color_en="the painter's palette in flat strokes, at most 3 values per material", shading_en='a few darker flat strokes laid in the direction of the form; no soft blending',
                     style_consistency_en='This cat lives in the PINCELES museum, where each cat keeps the style of ITS painter: follow the reference medium above (an 18th-century rococo court portrait), not the style of any other cat.'),
    # nuevos (style locks propios del lote, en lote-post-p3/estilo/: compilar.mjs los lee con una ruta relativa a estilo/)
    'caricatura': dict(dimension='caricatura', style_lock='../lote-post-p3/estilo/CARICATURA.txt', style_of_en='a 1990s-2010s TV cartoon: thick even line, flat bright fills',
                       proportions_en='TV cartoon: big head, simple exaggerated shapes, short legs', line_en='even dark line (#22202A) 9-12 px at 1024 on the silhouette, 6-8 px inside',
                       color_en='flat saturated fills', shading_en='at most one flat shadow shape per material'),
    'tira': dict(dimension='tira', style_lock='../lote-post-p3/estilo/TIRA.txt', style_of_en='a classic Latin American newspaper comic strip: round brush-ink line and flat Sunday-page colors',
                 proportions_en='comic strip: very big round head, tiny body, dot eyes', line_en='round black-brown brush ink (#1E1A1A) 10-14 px at 1024, slightly wobbly',
                 color_en='flat Sunday-page fills, no gradients', shading_en='NO shading except one flat shadow under the feet'),
    'estadio': dict(dimension='estadio', style_lock='../lote-post-p3/estilo/ESTADIO.txt', style_of_en='a bold sports trading card / stadium poster: dynamic, flat, stadium-lit',
                    proportions_en='athletic cartoon: head about one third of the height, strong legs', line_en='bold dark line (#1B1B2F) 10-12 px at 1024',
                    color_en='flat national-team-style kit colors', shading_en='one hard stadium-light shape and one flat shadow per material'),
}


def md(**k):
    """Un Multidimensional (titular o reserva). Campos: ver md_anime.py."""
    k.setdefault('rarity', 'multidimensional')
    (RESERVA if k.get('reserve') else ROSTER).append(k)
    return k


def orig(**k):
    """Un original (mythic | legendary | heroic)."""
    ORIGINALES.append(k)
    return k
