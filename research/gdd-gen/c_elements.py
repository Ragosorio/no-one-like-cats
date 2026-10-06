# -*- coding: utf-8 -*-
"""Elementos, materiales, estados, reacciones, roles, rasgos, mutaciones y sets del Catdex."""

ELEMENTS = [
    {
        "id": "fire", "name": "Fuego", "emoji": "🔥", "order": 1, "unlock": "start",
        "discovery": "Inicial (Canelo).",
        "dimension": "ANIME INFERNO", "palette": ["#4E0000", "#C8102E", "#FF6A1A", "#FFC94A"],
        "verb": "Incendiar",
        "shotArchetype": "bola_rebote",
        "shotRule": "Bola parabólica (gravedad x1.0) que rebota 1 vez y explota (radio 1.5 celdas, caída lineal). Aplica Ardiendo.",
        "midFlight": "detonar: explota en el aire donde esté (radio x0.8).",
        "status": "ardiendo",
        "beats": "nature", "beatenBy": "water",
        "levelUpgrades": {
            "10": {"name": "Bola Grande", "effect": "+25% radio de explosión."},
            "20": {"name": "Brasa", "effect": "Ardiendo se aplica aunque la celda no sea inflamable (2 turnos)."},
            "30": {"name": "Deflagración", "effect": "Salpicadura: 50% del daño a los módulos vecinos del impacto."},
            "40": {"name": "Meteorito", "effect": "10% (PRNG con semilla) de que el disparo se vuelva meteorito: x2.5 y perfora 1 capa."}
        },
        "habitatBiome": "volcano", "particle": "ember", "onomatopoeia": ["¡FWOOSH!", "¡BUUM!"],
        "sfxLayer": "crepitar + rugido"
    },
    {
        "id": "water", "name": "Agua", "emoji": "💧", "order": 2, "unlock": "start",
        "discovery": "Inicial (Gelatino).",
        "dimension": "NOIR OCEÁNICO + ukiyo-e", "palette": ["#172B35", "#204A7A", "#3569A3", "#A7E8D7"],
        "verb": "Inundar",
        "shotArchetype": "torpedo",
        "shotRule": "Torpedo: vuela parabólico hasta tocar el agua; desde ahí avanza recto 0.4 s bajo la línea de flotación (no lo frena el viento) y explota contra la primera celda de casco (radio 1.2). Si impacta bajo la línea de flotación abre BRECHA. Aplica Mojado.",
        "midFlight": "géiser: si ya está bajo el agua, sube en vertical y explota en la cubierta.",
        "status": "mojado",
        "beats": "fire", "beatenBy": "storm",
        "levelUpgrades": {
            "10": {"name": "Corriente", "effect": "+25% radio y +0.2 s de recorrido submarino."},
            "20": {"name": "Marea", "effect": "Mojado se aplica en un área 3x3."},
            "30": {"name": "Presión", "effect": "La brecha abre también el compartimento vecino (si comparte mamparo)."},
            "40": {"name": "Tsunami", "effect": "10%: una ola empuja el barco enemigo 1 celda hacia atrás y moja TODO su casco."}
        },
        "habitatBiome": "home", "particle": "bubble", "onomatopoeia": ["¡SPLASH!", "¡PLOF!"],
        "sfxLayer": "burbujas + golpe de agua"
    },
    {
        "id": "nature", "name": "Naturaleza", "emoji": "🌿", "order": 3, "unlock": "start",
        "discovery": "Inicial (Brote).",
        "dimension": "ACUARELA (Gwen) + sakura", "palette": ["#C6F0E4", "#64165D", "#E8879A", "#5FBF4A"],
        "verb": "Enraizar",
        "shotArchetype": "semilla",
        "shotRule": "Semilla parabólica que se planta en la primera celda que toca (daño directo bajo). Al FINAL de cada turno del dueño, la enredadera hace daño (DoT) a su celda y se extiende 1 celda (máx. 3 turnos). Aplica Enraizado (un cañón o motor Enraizado no puede usarse).",
        "midFlight": "echar raíces: se planta en el aire sobre la celda más cercana debajo.",
        "status": "enraizado",
        "beats": "earth", "beatenBy": "fire",
        "levelUpgrades": {
            "10": {"name": "Brote Doble", "effect": "Dispara 2 semillas (spread 6°)."},
            "20": {"name": "Espinas", "effect": "Enraizado dura +1 turno y el DoT +25%."},
            "30": {"name": "Bosque", "effect": "La enredadera se extiende 2 celdas por turno."},
            "40": {"name": "Árbol Ancestral", "effect": "10%: crece un árbol que levanta la cubierta: x2.5 a la celda y 50% a las 4 vecinas."}
        },
        "habitatBiome": "forest", "particle": "leaf", "onomatopoeia": ["¡CRRRK!", "¡FWIP!"],
        "sfxLayer": "campanitas + viento"
    },
    {
        "id": "earth", "name": "Tierra", "emoji": "🪨", "order": 4, "unlock": "boss:1",
        "discovery": "Jefe 1: el barco del Capitán Bigotes Rotos llevaba un fósil vivo en la bodega (Gea).",
        "dimension": "DIARIO DEL MAR (grabado/xilografía)", "palette": ["#1F2B4A", "#EAE1D3", "#A8743F", "#E0B77A"],
        "verb": "Perforar",
        "shotArchetype": "roca",
        "shotRule": "Roca pesada: gravedad x1.6 (alcance corto), perfora 2 capas de celdas (DDA) y explota en la tercera (radio 1.0). Sin estado. Bajo la línea de flotación abre BRECHA. Contra Congelado provoca ESTALLIDO.",
        "midFlight": "picar: cancela la velocidad horizontal y cae en vertical x1.5.",
        "status": None,
        "beats": "storm", "beatenBy": "nature",
        "levelUpgrades": {
            "10": {"name": "Peñasco", "effect": "+25% radio."},
            "20": {"name": "Fractura", "effect": "+1 capa de perforación."},
            "30": {"name": "Sismo", "effect": "Al impactar, todas las celdas enemigas con 1 solo apoyo reciben 30% del daño."},
            "40": {"name": "Monolito", "effect": "10%: cae un monolito vertical x2.5 que atraviesa 4 pisos."}
        },
        "habitatBiome": "cliff", "particle": "rock", "onomatopoeia": ["¡KRAK!", "¡PUM!"],
        "sfxLayer": "piedra + sub-bass"
    },
    {
        "id": "storm", "name": "Tormenta", "emoji": "⚡", "order": 5, "unlock": "boss:2",
        "discovery": "Jefe 2: la Gárgola Ronroneante despierta una tormenta permanente (Tronador).",
        "dimension": "CÓMIC SILVER AGE (Kirby krackle)", "palette": ["#0D110F", "#FFD400", "#00E5FF", "#FFFFFF"],
        "verb": "Electrocutar / Soplar",
        "shotArchetype": "rayo | rafaga",
        "shotRule": "Dos variantes (cada gato usa una). RAYO: casi recto (gravedad x0.2), muy preciso, poco daño estructural; aplica Cargado; contra hierro = SOBRECARGA; contra Mojado = CONDUCCIÓN. RÁFAGA: recta, sin gravedad, empuja (gatos expuestos y escombros 1-2 celdas), deja CORRIENTE (desvía el próximo proyectil enemigo); contra Mojado = VENTISCA (Congelado).",
        "midFlight": "rayo: ninguna (instantáneo). ráfaga: cambiar dirección ±30° una vez.",
        "status": "cargado",
        "beats": "water", "beatenBy": "earth",
        "levelUpgrades": {
            "10": {"name": "Arco", "effect": "Conducción/cadena +1 celda; ráfaga empuja +1 celda."},
            "20": {"name": "Estática", "effect": "Cargado dura 2 turnos; Corriente dura 2 turnos."},
            "30": {"name": "Tormenta", "effect": "Cada disparo lanza un rayo secundario (30%) a un módulo aleatorio (PRNG)."},
            "40": {"name": "Juicio", "effect": "10%: rayo del cielo x2.5 que ignora cobertura y camarotes."}
        },
        "habitatBiome": "cliff", "particle": "spark", "onomatopoeia": ["¡ZZZAK!", "¡BZZT!", "¡FIUUUM!"],
        "sfxLayer": "zap + chisporroteo / viento"
    },
    {
        "id": "magic", "name": "Magia", "emoji": "✨", "order": 6, "unlock": "kl:24",
        "discovery": "Reino 24: una grieta se abre sobre la isla y llega el Heraldo del Arcanista. Su gato levanta el primer ESCUDO MÁGICO (¡CLANK!). Al vencerlo: Núcleo Arcano → MAGIA.",
        "dimension": "ORQUÍDEA REAL (tarot, art nouveau, foil)", "palette": ["#231626", "#5C3D5B", "#8F6B93", "#B89558"],
        "verb": "Hechizar",
        "shotArchetype": "runa",
        "shotRule": "Runa teledirigida suave: tras 0.3 s de vuelo gira hasta 25°/s hacia el módulo marcado (clic derecho al apuntar) o hacia el centro de masa enemigo. Aplica Maldito (próximo daño recibido x1.5 y revela la vida). Con cualquier estado presente = AMPLIFICAR.",
        "midFlight": "dividir: se parte en 3 runas al 45% de daño cada una.",
        "status": "maldito",
        "beats": "cosmic", "beatenBy": "cosmic",
        "levelUpgrades": {
            "10": {"name": "Runa Doble", "effect": "Al impactar suelta una segunda runa al 40%."},
            "20": {"name": "Maldición", "effect": "Maldito dura 2 turnos."},
            "30": {"name": "Sello", "effect": "El módulo impactado queda Sellado (desactivado) 1 turno."},
            "40": {"name": "Grimorio", "effect": "10%: lluvia de 5 runas a x0.6 cada una sobre módulos distintos."}
        },
        "habitatBiome": "ruins", "particle": "rune", "onomatopoeia": ["¡FWIIING!", "✦"],
        "sfxLayer": "coro + campanas"
    },
    {
        "id": "cosmic", "name": "Cósmico", "emoji": "🌌", "order": 7, "unlock": "boss:5",
        "discovery": "Jefe 5: la Estrella Errante cae al mar (Astra Prima).",
        "dimension": "NEÓN GLITCH (datamosh)", "palette": ["#0D110F", "#FF2E88", "#00E5FF", "#8A5CFF"],
        "verb": "Atraer",
        "shotArchetype": "orbe_gravitatorio",
        "shotRule": "Orbe lento (velocidad x0.7) con gravedad propia: su trayectoria se curva hacia la masa (celdas) más cercana en un radio de 3 celdas. Aplica Ingrávido: las celdas sueltas (sin soporte) flotan 1 turno y luego caen sobre el barco como LLUVIA DE ESCOMBROS.",
        "midFlight": "pozo: se detiene y crea un pozo de gravedad 1 turno (atrae escombros y desvía proyectiles enemigos que pasen a ≤2 celdas).",
        "status": "ingravido",
        "beats": "magic", "beatenBy": "magic",
        "levelUpgrades": {
            "10": {"name": "Órbita", "effect": "+25% radio de atracción."},
            "20": {"name": "Ingravidez", "effect": "Ingrávido dura 2 turnos."},
            "30": {"name": "Pozo", "effect": "Cada impacto deja un pozo de 1 turno (−precisión enemiga: vista previa −30%)."},
            "40": {"name": "Colapso", "effect": "10%: mini agujero negro x2.5 que arranca hasta 3x3 celdas."}
        },
        "habitatBiome": "cosmic", "particle": "star", "onomatopoeia": ["¡VWOOOM!", "¡GLITCH!"],
        "sfxLayer": "sintes + bitcrush"
    },
    {
        "id": "void", "name": "Vacío", "emoji": "🕳️", "order": 8, "unlock": "chapter:2", "teaserOnly": True,
        "discovery": "Al hundirse el Leviatán: UNKNOWN ELEMENT DETECTED. CONTINUARÁ. (No jugable en el Cap. 1; solo lo usa el Barco del Vacío.)",
        "dimension": "NOIR INVERTIDO + ruido de transmisión", "palette": ["#0D110F", "#231626", "#FF2E88", "#000000"],
        "verb": "Devorar",
        "shotArchetype": "borrado",
        "shotRule": "Proyectil que atraviesa materia y BORRA celdas (no se pueden reparar). DEVORAR: elimina escudos, estados y segundas vidas.",
        "midFlight": "implosión.",
        "status": "vacio",
        "beats": None, "beatenBy": None,
        "levelUpgrades": {},
        "habitatBiome": None, "particle": "glitch", "onomatopoeia": ["…", "¡¿?!"],
        "sfxLayer": "reverb invertida"
    }
]

# Multiplicador gato-contra-gato y contra escudos elementales: atacante -> defensor (elemento PRIMARIO del defensor)
AFFINITY = {
    "fire": {"nature": 1.5, "water": 0.75},
    "water": {"fire": 1.5, "storm": 0.75},
    "nature": {"earth": 1.5, "fire": 0.75},
    "earth": {"storm": 1.5, "nature": 0.75},
    "storm": {"water": 1.5, "earth": 0.75},
    "magic": {"cosmic": 1.5},
    "cosmic": {"magic": 1.5},
}

MATERIALS = [
    {"id": "wood", "name": "Madera", "hp": 60, "tags": ["flammable", "loadBearing"], "mult": {"fire": 1.5, "water": 1.0, "nature": 1.25, "earth": 1.0, "storm": 0.75, "magic": 1.0, "cosmic": 1.0}},
    {"id": "canvas", "name": "Lona (velas)", "hp": 30, "tags": ["flammable"], "mult": {"fire": 2.0, "water": 1.0, "nature": 1.0, "earth": 0.75, "storm": 1.25, "magic": 1.0, "cosmic": 1.0}},
    {"id": "iron", "name": "Hierro", "hp": 140, "tags": ["conductive", "loadBearing"], "mult": {"fire": 0.75, "water": 0.75, "nature": 0.75, "earth": 1.25, "storm": 1.5, "magic": 1.0, "cosmic": 1.25}},
    {"id": "stone", "name": "Piedra", "hp": 120, "tags": ["loadBearing"], "mult": {"fire": 0.75, "water": 1.0, "nature": 1.25, "earth": 1.25, "storm": 0.75, "magic": 1.0, "cosmic": 1.0}},
    {"id": "crystal", "name": "Cristal / Coral arcano", "hp": 90, "tags": ["brittle", "loadBearing"], "mult": {"fire": 1.0, "water": 1.0, "nature": 1.0, "earth": 1.5, "storm": 0.75, "magic": 0.75, "cosmic": 1.0}},
    {"id": "bone", "name": "Hueso (Leviatán, fantasmas)", "hp": 110, "tags": ["organic", "loadBearing"], "mult": {"fire": 1.0, "water": 0.75, "nature": 1.25, "earth": 1.0, "storm": 1.0, "magic": 1.5, "cosmic": 1.0}},
    {"id": "void", "name": "Vacío (solo enemigos teaser)", "hp": 200, "tags": ["ethereal", "loadBearing"], "mult": {"fire": 0.5, "water": 0.5, "nature": 0.5, "earth": 0.5, "storm": 0.5, "magic": 1.0, "cosmic": 1.0}}
]

STATUSES = [
    {"id": "mojado", "name": "Mojado", "icon": "gota", "target": "celda", "turns": 2, "effect": "Habilita Conducción, Ventisca, Vapor y Florecer. Apaga Ardiendo al aplicarse."},
    {"id": "ardiendo", "name": "Ardiendo", "icon": "llama", "target": "celda", "turns": 2, "effect": "DoT 15%/turno del daño original; se propaga 1 celda/turno por material inflamable (máx. 3 turnos). Las velas ardiendo caen sobre la cubierta."},
    {"id": "congelado", "name": "Congelado", "icon": "copo", "target": "celda", "turns": 2, "effect": "Módulo desactivado; la celda es quebradiza: el siguiente impacto de Tierra o cañón = ESTALLIDO."},
    {"id": "cargado", "name": "Cargado", "icon": "rayito", "target": "celda", "turns": 1, "effect": "El siguiente rayo que toque la celda hace x1.25. Gatos en celdas Cargadas pierden 10 de medidor de ultimate."},
    {"id": "enraizado", "name": "Enraizado", "icon": "raíz", "target": "celda", "turns": 2, "effect": "Cañones y motores Enraizados no se pueden usar. El fuego quema las enredaderas (y las elimina)."},
    {"id": "maldito", "name": "Maldito", "icon": "ojo violeta", "target": "celda/gato", "turns": 1, "effect": "El siguiente daño recibido x1.5 y se revela la vida exacta."},
    {"id": "ingravido", "name": "Ingrávido", "icon": "planeta", "target": "celda", "turns": 1, "effect": "Las celdas sueltas flotan en vez de caer; al terminar caen como Lluvia de escombros (daño de caída x2)."},
    {"id": "revelado", "name": "Revelado", "icon": "linterna", "target": "módulo/gato", "turns": 2, "effect": "Se ve su vida y recibe +20% de daño."},
    {"id": "vapor", "name": "Vapor", "icon": "nube", "target": "zona", "turns": 2, "effect": "Nube: quien apunte A TRAVÉS de ella pierde la vista previa de trayectoria."},
    {"id": "corriente", "name": "Corriente", "icon": "remolino", "target": "campo", "turns": 1, "effect": "El siguiente proyectil enemigo se curva ±(1 celda) según la corriente (la IA lo considera)."},
    {"id": "sellado", "name": "Sellado", "icon": "sello", "target": "módulo", "turns": 1, "effect": "Módulo desactivado (no dispara en la andanada, no da escudo, no da medidor)."},
    {"id": "aturdido", "name": "Aturdido", "icon": "estrellitas", "target": "gato", "turns": 1, "effect": "El gato no puede actuar su próximo turno."},
    {"id": "expuesto", "name": "Expuesto", "icon": "gato asustado", "target": "gato", "turns": None, "effect": "Su camarote fue destruido: recibe daño directo x1.5, pero su próximo disparo hace +25% y no gasta recarga (¡GATO SUELTO!)."},
    {"id": "marcado", "name": "Marcado", "icon": "hoja", "target": "módulo", "turns": 2, "effect": "El siguiente impacto en el módulo es crítico garantizado (x1.3)."}
]

REACTIONS = [
    {"id": "conduccion", "name": "Conducción", "trigger": {"status": "mojado", "by": "storm:rayo"}, "effect": "El rayo salta a todas las celdas Mojadas conectadas (4-vecinas, máx. 6) con x1.5 y Aturde 1 turno a los gatos de esas celdas.", "mult": 1.5, "axis": "horizontal", "grimoire": "Agua + electricidad. Tu abuela te lo advirtió."},
    {"id": "incendio", "name": "Incendio", "trigger": {"element": "fire", "material": ["wood", "canvas"]}, "effect": "Ardiendo se propaga 1 celda por turno (máx. 3 turnos); las velas ardiendo caen sobre la cubierta (daño de caída).", "mult": 1.0, "axis": "tiempo", "grimoire": "La madera arde. Sorpresa nula, satisfacción total."},
    {"id": "vapor", "name": "Vapor", "trigger": {"status": "mojado", "by": "fire", "or": {"status": "ardiendo", "by": "water"}}, "effect": "Apaga el fuego y crea una nube de Vapor 3x3 durante 2 turnos: el rival pierde la vista previa si apunta a través.", "mult": 1.0, "axis": "control", "grimoire": "Fuego + agua = sauna de guerra."},
    {"id": "ventisca", "name": "Ventisca", "trigger": {"status": "mojado", "by": "storm:rafaga"}, "effect": "Las celdas Mojadas golpeadas por la ráfaga quedan Congeladas 2 turnos (módulos desactivados).", "mult": 1.0, "axis": "control", "grimoire": "Moja, sopla, congela. El hielo no es un elemento: es una consecuencia."},
    {"id": "estallido", "name": "Estallido", "trigger": {"status": "congelado", "by": ["earth", "cannon"]}, "effect": "x2 a la celda congelada y esquirlas (x0.5) a sus 4 vecinas.", "mult": 2.0, "axis": "vertical", "grimoire": "Lo congelaste. Luego le aventaste una piedra. Eres un genio malvado."},
    {"id": "brecha", "name": "Brecha", "trigger": {"by": ["earth", "water"], "where": "bajo línea de flotación"}, "effect": "Abre el compartimento: se inunda 25% al final de cada turno (bombas de achique: −50%). Si el agua alcanza el núcleo, el barco se hunde.", "mult": 1.0, "axis": "tiempo", "grimoire": "Un hoyito abajo vale más que diez arriba."},
    {"id": "avivar", "name": "Avivar", "trigger": {"status": "ardiendo", "by": "storm:rafaga"}, "effect": "El fuego se propaga 2 celdas de golpe y hace +50% de daño este turno.", "mult": 1.5, "axis": "horizontal", "grimoire": "Soplarle al fuego: técnica milenaria de las abuelitas y los pirómanos."},
    {"id": "florecer", "name": "Florecer", "trigger": {"status": "mojado", "by": "nature"}, "effect": "La enredadera crece el doble (2 celdas/turno) y su DoT +50%. (El fuego la quema: contraataque natural.)", "mult": 1.5, "axis": "horizontal", "grimoire": "Riega tu jardín… en el barco del enemigo."},
    {"id": "sobrecarga", "name": "Sobrecarga", "trigger": {"by": "storm:rayo", "target": ["iron", "escudo"]}, "effect": "Contra hierro (cañón, motor, núcleo): módulo desactivado 1 turno. Contra un escudo: rompe 1 capa y Aturde al gato que lo sostiene.", "mult": 1.0, "axis": "anti-defensa", "grimoire": "Los escudos odian los rayos. Los rayos aman a los escudos."},
    {"id": "amplificar", "name": "Amplificar", "trigger": {"by": "magic", "status": "cualquiera"}, "effect": "Duplica la duración restante y la potencia de los estados presentes en la celda.", "mult": 1.0, "axis": "potencia", "grimoire": "La magia no inventa nada: solo exagera. Como tú en tus historias."},
    {"id": "lluvia_escombros", "name": "Lluvia de escombros", "trigger": {"status": "ingravido", "by": "colapso"}, "effect": "Los trozos sueltos Ingrávidos caen sobre el barco con daño de caída x2 (Meteorito si además había Tierra: x3).", "mult": 2.0, "axis": "vertical", "grimoire": "Lo que sube, baja. Encima de tu enemigo, de preferencia."},
    {"id": "devorar", "name": "Devorar (teaser)", "trigger": {"by": "void"}, "effect": "Elimina escudos, estados y segundas vidas; las celdas borradas no se reparan. Solo el Barco del Vacío lo usa en el Cap. 1.", "mult": 1.0, "axis": "inversión", "grimoire": "???", "teaser": True}
]

ROLES = [
    {"id": "artillero", "name": "Artillero", "hp": 100, "desc": "Disparo fiable y constante. La columna vertebral."},
    {"id": "demoledor", "name": "Demoledor", "hp": 95, "desc": "Daño estructural en área, colapsos."},
    {"id": "francotirador", "name": "Francotirador", "hp": 80, "desc": "Disparo recto y preciso; caza gatos y módulos clave."},
    {"id": "asediador", "name": "Asediador", "hp": 90, "desc": "Estados y daño en el tiempo (fuego, raíces, inundación)."},
    {"id": "soporte", "name": "Soporte", "hp": 90, "desc": "Cura, repara, limpia estados, da suerte."},
    {"id": "tanque", "name": "Tanque", "hp": 150, "desc": "Escudos, muros y cobertura para la tripulación."},
    {"id": "controlador", "name": "Controlador", "hp": 85, "desc": "Desactiva módulos, roba precisión, manipula turnos."},
    {"id": "invocador", "name": "Invocador", "hp": 85, "desc": "Deja objetos persistentes que actúan al final del turno."}
]

WORKERS = {
    "banker": {"name": "Banquero", "desc": "+25% oro en su hábitat (máx. 4 trabajando)."},
    "farmer": {"name": "Granjero", "desc": "+20% comida global (máx. 3)."},
    "builder": {"name": "Constructor", "desc": "−20% tiempo de construcción (máx. 2)."},
    "voyager": {"name": "Viajero", "desc": "+50% botín de expedición (máx. 2)."}
}

TRAITS = [
    {"id": "impaciente", "name": "Impaciente", "effect": "+10% daño en su primer disparo de la batalla."},
    {"id": "piromano", "name": "Pirómano", "effect": "Ardiendo que aplica dura +1 turno."},
    {"id": "gloton", "name": "Glotón", "effect": "La Despensa le cura el doble. (En la isla come con ¡ÑAM! más ruidosos.)"},
    {"id": "dormilon", "name": "Dormilón", "effect": "Empieza con 50 de medidor de ultimate, pero no puede actuar en el turno 1."},
    {"id": "chismoso", "name": "Chismoso", "effect": "Al impactar revela la vida de los gatos del módulo vecino."},
    {"id": "bravucon", "name": "Bravucón", "effect": "+15% daño contra el gato enemigo con más vida."},
    {"id": "miedoso", "name": "Miedoso", "effect": "Si su camarote recibe daño se esconde: −50% daño recibido 1 turno, pero no dispara ese turno."},
    {"id": "presumido", "name": "Presumido", "effect": "Sus críticos le dan +10 de medidor de ultimate."},
    {"id": "rencoroso", "name": "Rencoroso", "effect": "+10 de medidor cuando un aliado es golpeado en su camarote."},
    {"id": "curioso", "name": "Curioso", "effect": "Su vista previa de trayectoria es +20% más larga."},
    {"id": "perezoso", "name": "Perezoso", "effect": "Recarga +1, daño +20%."},
    {"id": "leal", "name": "Leal", "effect": "Si el gato del Puente de mando cae KO, +30% daño el resto de la batalla."},
    {"id": "travieso", "name": "Travieso", "effect": "10% (PRNG) de que su proyectil rebote una vez extra."},
    {"id": "callejero", "name": "Callejero", "effect": "+10% daño en Duelos de Gatos."}
]

MUTATIONS = [
    {"id": "conductividad", "name": "Conductividad", "weight": 10, "habitatBias": "storm", "effect": "Sus impactos sobre celdas Mojadas aplican Cargado; si es eléctrico, la Conducción salta +2 celdas.", "charla": True},
    {"id": "chamuscado", "name": "Chamuscado (Scorched)", "weight": 10, "habitatBias": "fire", "effect": "Su disparo deja Ardiendo 1 turno en la celda de impacto. Pelaje con brasas (decal).", "charla": True},
    {"id": "escarchado", "name": "Escarchado", "weight": 10, "habitatBias": "water", "effect": "15% de Congelar las celdas Mojadas que golpea. Pelaje con escarcha."},
    {"id": "musgoso", "name": "Musgoso", "weight": 10, "habitatBias": "nature", "effect": "Su camarote regenera 5% de vida por turno."},
    {"id": "fosilizado", "name": "Fosilizado", "weight": 10, "habitatBias": "earth", "effect": "+20% vida."},
    {"id": "runico", "name": "Rúnico", "weight": 10, "habitatBias": "magic", "effect": "Maldito que aplica dura +1 turno; runas tatuadas en el pelaje."},
    {"id": "estelar", "name": "Estelar", "weight": 10, "habitatBias": "cosmic", "effect": "Sus proyectiles se curvan levemente (5°/s) hacia el núcleo enemigo."},
    {"id": "doble_cola", "name": "Doble Cola", "weight": 8, "habitatBias": None, "effect": "8% de disparar un segundo proyectil al 50%."},
    {"id": "gigantismo", "name": "Gigantismo", "weight": 8, "habitatBias": None, "effect": "+15% radio de explosión, −10% longitud de vista previa. Sprite 1.15x."},
    {"id": "eco_paterno", "name": "Eco Paterno (Linaje)", "weight": 0, "habitatBias": None, "effect": "Hereda UN modificador de disparo de un padre: +1 proyectil, +1 rebote o +1 capa de perforación (lo que el padre tenga). Ej.: Fireball + Triple Shot = Triple Fireball. Solo desde el hito de Reino 'Linaje'.", "charla": True},
    {"id": "bigote_dorado", "name": "Bigote Dorado", "weight": 1, "habitatBias": None, "effect": "Cosmético: variante dorada con foil en la Battle Form. Sin efecto de combate (orgullo puro)."}
]

CATDEX_SETS = [
    {"id": "set_brasas", "name": "Brasas del Hogar", "cats": ["c_canelo", "c_chispa", "l_ignis"], "rule": "Ardiendo dura +1 turno para todos tus gatos."},
    {"id": "set_marea", "name": "Hijos de la Marea", "cats": ["c_gelatino", "c_burbujas", "l_abisa"], "rule": "Tus torpedos atraviesan 1 mamparo."},
    {"id": "set_raiz", "name": "Raíz y Brote", "cats": ["c_brote", "c_musgo", "l_silvana"], "rule": "Tus enredaderas curan 3% a tus módulos adyacentes al final de turno."},
    {"id": "set_piedra", "name": "Piedra Viva", "cats": ["c_terron", "c_guijarro", "l_gea"], "rule": "Tus rocas perforan +1 capa."},
    {"id": "set_tormenta", "name": "Ojo de la Tormenta", "cats": ["c_voltio", "c_nimbo", "l_tronador"], "rule": "La Conducción salta a 8 celdas (en vez de 6)."},
    {"id": "set_arcana", "name": "Biblioteca Arcana", "cats": ["c_linterna", "c_caramelo", "l_merlina"], "rule": "Maldito revela además los camarotes ocultos del módulo."},
    {"id": "set_estrellas", "name": "Polvo de Estrellas", "cats": ["c_cometin", "c_lunita", "l_astraprima"], "rule": "Tus pozos de gravedad duran +1 turno."},
    {"id": "set_vapor", "name": "Familia del Vapor", "cats": ["r_neblino", "e_vaporronin", "r_mareaenc"], "rule": "Tus nubes de Vapor también bajan 20% el daño de los tiros que las cruzan."},
    {"id": "set_rotos", "name": "Los Rotos", "cats": ["e_supernova", "e_rencor", "e_bastion", "e_vaporronin", "m_singular"], "rule": "Las ultimates de 'una vez por batalla' cargan con 25 de medidor inicial."},
    {"id": "set_oficio", "name": "Gatos de Oficio", "cats": ["c_chispa", "c_gelatino", "c_musgo", "c_voltio"], "rule": "Cambiar a un gato de trabajador a tripulación no tiene espera (QoL)."},
    {"id": "set_primordiales", "name": "Los Siete Orígenes", "cats": ["l_ignis", "l_abisa", "l_silvana", "l_gea", "l_tronador", "l_merlina", "l_astraprima"], "rule": "Tus Primordiales empiezan cada batalla con la ultimate al 50%. (Set de prestigio del capítulo.)"}
]

# Estados VISIBLES sobre los gatos (feedback del usuario): el gato hereda los estados de las celdas de su camarote
# al final de cada impacto (si el estado aplica a gatos) y los recibe directo si está Expuesto o flotando.
CAT_STATUSES = [
    {"id": "ardiendo", "name": "En llamas", "rule": "DoT: 8% de su vida máxima al inicio de cada turno de su bando, 2 turnos. El Mojado lo apaga. Gatos 🔥 son inmunes.",
     "visual": "Llamitas en 2s pegadas al contorno del sprite (flipbook de 3 frames, color del fuego), humo encima, el gato hace 'saltitos' de dolor cómicos. Número de DoT naranja."},
    {"id": "electrocutado", "name": "Electrocutado", "rule": "Al recibir un rayo ⚡: pierde 10 de medidor de ultimate. Si además está MOJADO: queda Aturdido (pierde su próximo turno). Gatos ⚡ son inmunes al aturdimiento.",
     "visual": "Parpadeo de RAYOS X: 3 flashes alternando el sprite normal con una silueta azul eléctrico + esqueleto de gato dibujado en código (huesitos blancos) a ~8 fps durante 0.5 s; chispas Kirby krackle; pelo erizado (escala Y 1.06)."},
    {"id": "mojado", "name": "Mojado", "rule": "2 turnos. Apaga 'En llamas'. Habilita Electrocutado→Aturdido y Congelado.",
     "visual": "Sprite tintado azul 15%, gotas que caen (partículas), orejas abajo (squash 0.95 Y), charquito bajo el gato."},
    {"id": "congelado", "name": "Congelado", "rule": "Pierde su próximo turno. El siguiente impacto de Tierra o andanada sobre su camarote le hace x1.5 (Estallido) y rompe el hielo. Gatos 💧 resisten: solo 50% de probabilidad (PRNG).",
     "visual": "BLOQUE DE HIELO: rectángulo de cristal translúcido con bordes facetados encima del sprite (sprite desaturado y quieto), escarcha alrededor; al romperse, esquirlas + '¡KRASH!'."},
    {"id": "maldito", "name": "Maldito", "rule": "El siguiente daño x1.5 y su vida se ve exacta.", "visual": "Ojo violeta flotando sobre la cabeza; runas girando."},
    {"id": "aturdido", "name": "Aturdido", "rule": "No actúa su próximo turno.", "visual": "Estrellitas y pajaritos girando; ojos en espiral (overlay)."},
    {"id": "expuesto", "name": "Expuesto (¡GATO SUELTO!)", "rule": "Su camarote cayó: queda sobre la cubierta. Recibe x1.5 directo, pero su próximo disparo hace +25% y no gasta recarga.",
     "visual": "Sale disparado del camarote con un salto en arco, cae de pie en la cubierta, se sacude; icono de signo de exclamación rojo."}
]

KO_SEQUENCE = {
    "trigger": "La vida del gato llega a 0 (o un Cañón de Cristal recibe un golpe).",
    "durationMs": 1600, "tier": "T1 (T2 si es el último gato del rival)",
    "steps": [
        {"t": 0, "what": "Hitstop 80 ms; impact frame B/N de 1 frame sobre el gato."},
        {"t": 80, "what": "Estrellitas giran sobre su cabeza y los ojos se vuelven 'X' (overlay); el sprite se tambalea (rotación ±12° en 2s)."},
        {"t": 450, "what": "El ALMA sale: copia del sprite en blanco translúcido (alpha 0.6, sin color) sube 120 px ondulando y se desvanece; sonido de 'fiuuu' fantasmal."},
        {"t": 800, "what": "El cuerpo cae al mar en arco (gravedad), da una vuelta, ¡SPLASH!"},
        {"t": 1100, "what": "Reaparece flotando dentro de un SALVAVIDAS rojo-blanco junto al barco, con cartel 'FUERA DE COMBATE' (Anton, inclinado). Se queda ahí meciéndose con el oleaje el resto de la batalla (clic: ver su daño total)."},
        {"t": 1600, "what": "El retrato del gato en la HUD se pone en gris con un salvavidas encima."}
    ],
    "exceptions": "Vapor Ronin (segunda vida): el alma NO se va: se queda flotando como vapor 2 turnos y regresa al camarote (o a la cubierta si el camarote ya no existe). Nimbo (siesta salvadora): se duerme con 1 de vida en vez de caer.",
    "enemy": "Los gatos enemigos hacen lo mismo (salvavidas con la bandera de su facción)."
}
