# -*- coding: utf-8 -*-
"""Barcos, módulos, reliquias, artefactos, jefes y arquetipos de barcos enemigos."""

# Leyenda de casco: '.' vacío · 'H' material del Casco según su Mk · 'W' madera fija · 'I' hierro fijo
# 'S' piedra · 'C' cristal · 'B' hueso. La fila inferior es la QUILLA (raíz del BFS de soporte).
HULL_BY_MK = [
    {"mk": 1, "name": "Casco de Balsa", "material": "wood", "cellHp": 60, "look": "tablas atadas con cuerda, parches"},
    {"mk": 2, "name": "Balandra", "material": "wood", "cellHp": 75, "look": "madera barnizada con bandas de cuerda"},
    {"mk": 3, "name": "Fragata", "material": "iron", "cellHp": 90, "look": "planchas de hierro remachadas, ojos de buey"},
    {"mk": 4, "name": "Galeón", "material": "iron", "cellHp": 110, "look": "hierro con ribetes dorados y mascarón de gato"},
    {"mk": 5, "name": "Acorazado de Coral", "material": "crystal", "cellHp": 125, "look": "coral arcano rosa-turquesa que brilla"},
    {"mk": 6, "name": "Acorazado Arcano", "material": "crystal", "cellHp": 145, "look": "coral con runas de foil dorado"},
    {"mk": 7, "name": "Casco Celestial", "material": "crystal", "cellHp": 170, "look": "cristal negro con constelaciones que se mueven (anuncia el Arca Celestial)"},
]

SHIPS = [
    {
        "id": "balsa", "name": "Balsa Bigotuda", "archetype": "balsa",
        "role": "Inicial. Patética y querida.", "utilityBudget": 1, "artifactSlots": 0,
        "maneuver": "Sin motor: no se mueve (va a la deriva con el viento 0.5 celdas/turno).",
        "special": "Sin Sala de Invocación por defecto: las ultimates cuestan 125 de medidor.",
        "recommendedFor": "Tutorial, Encargos 'Aguas Estrechas' y 'Rescate Gatuno'.",
        "grid": {"cols": 12, "rows": 9, "waterlineRow": 5},
        "hull": ["............", "............", "............", "............", "..HHHHHHHH..",
                 "HHHHHHHHHHHH", "HHHHHHHHHHHH", ".HHHHHHHHHH.", "..HHHHHHHH.."],
        "modules": [
            {"kind": "mast", "x": 5, "y": 0, "w": 1, "h": 4},
            {"kind": "catroom", "x": 1, "y": 3, "w": 2, "h": 2, "slot": 0},
            {"kind": "catroom", "x": 8, "y": 3, "w": 2, "h": 2, "slot": 1},
            {"kind": "cannon", "x": 10, "y": 4, "w": 2, "h": 1},
            {"kind": "core", "x": 5, "y": 5, "w": 2, "h": 2},
            {"kind": "catroom", "x": 3, "y": 5, "w": 2, "h": 2, "slot": 2}
        ],
        "art": "Palmera chiquita en la cubierta, vela remendada con un calcetín."
    },
    {
        "id": "gorrion", "name": "Gorrión", "archetype": "sparrow",
        "role": "Rápido y ligero: ideal para misiones rápidas y Encargos de barco chico.", "utilityBudget": 2, "artifactSlots": 0,
        "maneuver": "Motor: combustible = 2 + floor(Mk Motor/2) celdas por turno.",
        "special": "Perk de balance (+1 disparo en el primer turno): en tu turno 1 eliges DOS gatos (disparan uno tras otro) antes de la primera andanada.",
        "recommendedFor": "Farmeo de Zona 1-2, Encargos 'Aguas Estrechas'.",
        "grid": {"cols": 14, "rows": 10, "waterlineRow": 6},
        "hull": ["..............", "..............", "..............", "......HH......", "..HHHHHHHHHH..",
                 "HHHHHHHHHHHHHH", "HHHIIHHHHIIHHH", "HHHHHHHHHHHHHH", ".HHHHHHHHHHHH.", "...HHHHHHHH..."],
        "modules": [
            {"kind": "mast", "x": 6, "y": 0, "w": 1, "h": 4},
            {"kind": "catroom", "x": 2, "y": 2, "w": 2, "h": 2, "slot": 0},
            {"kind": "catroom", "x": 9, "y": 2, "w": 2, "h": 2, "slot": 1},
            {"kind": "catroom", "x": 0, "y": 3, "w": 2, "h": 2, "slot": 3},
            {"kind": "cannon", "x": 12, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 12, "y": 3, "w": 2, "h": 1},
            {"kind": "core", "x": 6, "y": 6, "w": 2, "h": 2},
            {"kind": "catroom", "x": 3, "y": 6, "w": 2, "h": 2, "slot": 2},
            {"kind": "powder", "x": 10, "y": 7, "w": 1, "h": 1},
            {"kind": "engine", "x": 11, "y": 8, "w": 2, "h": 1}
        ],
        "art": "Casco afilado pintado de rojo con una franja crema; mascarón de gorrión-gato."
    },
    {
        "id": "merodeador", "name": "Merodeador", "archetype": "marauder",
        "role": "Saqueo: poca defensa, muchas armas.", "utilityBudget": 3, "artifactSlots": 1,
        "maneuver": "Motor normal.",
        "special": "Perk de balance: +40% chatarra y bonus por módulo destruido (cada módulo enemigo destruido suelta un cofrecito de chatarra extra que vuela a la UI). Gratis si ganas el evento Bandera Negra.",
        "recommendedFor": "Farmeo de materiales, Encargos de saqueo, eventos flash.",
        "grid": {"cols": 18, "rows": 11, "waterlineRow": 7},
        "hull": ["..................", "..................", "..................", "..................", "...HHHHHHHHHHHH...",
                 "HHHHHHHHHHHHHHHHHH", "HHHHIIHHHHHHIIHHHH", "HHHHHHHHHHHHHHHHHH", ".HHHHHHHHHHHHHHHH.", "..HHHHHHHHHHHHHH..", "....HHHHHHHHHH...."],
        "modules": [
            {"kind": "mast", "x": 8, "y": 0, "w": 1, "h": 4},
            {"kind": "catroom", "x": 2, "y": 2, "w": 2, "h": 2, "slot": 0},
            {"kind": "catroom", "x": 12, "y": 2, "w": 2, "h": 2, "slot": 1},
            {"kind": "catroom", "x": 14, "y": 2, "w": 2, "h": 2, "slot": 4},
            {"kind": "catroom", "x": 5, "y": 6, "w": 2, "h": 2, "slot": 2},
            {"kind": "catroom", "x": 11, "y": 6, "w": 2, "h": 2, "slot": 3},
            {"kind": "cannon", "x": 16, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 0, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 16, "y": 6, "w": 2, "h": 1},
            {"kind": "cannon", "x": 10, "y": 3, "w": 2, "h": 1},
            {"kind": "core", "x": 8, "y": 7, "w": 2, "h": 2},
            {"kind": "arcane", "x": 6, "y": 3, "w": 2, "h": 1},
            {"kind": "powder", "x": 14, "y": 8, "w": 1, "h": 1},
            {"kind": "engine", "x": 2, "y": 8, "w": 2, "h": 1}
        ],
        "art": "Bandera negra con calavera de gato, velas parchadas, cofres en cubierta."
    },
    {
        "id": "bastion", "name": "Bastión", "archetype": "bastion",
        "role": "Acorazado gigantesco: muchos camarotes, escudos. Lento. Ideal para jefes.", "utilityBudget": 5, "artifactSlots": 1,
        "maneuver": "Lento: combustible x0.5.",
        "special": "3 ranuras de escudo; el más resistente para jefes.",
        "recommendedFor": "Jefes 4-6, Encargo 'Asedio Pesado'.",
        "grid": {"cols": 22, "rows": 13, "waterlineRow": 8},
        "hull": ["......................", "......................", "......................", "......................", "...HHHHHHHHHHHHHHHH...",
                 "HHHHHHHHHHHHHHHHHHHHHH", "HHIHHHHHHHHHHHHHHHHIHH", "HHIHHHHHHHHHHHHHHHHIHH", "HHHHHHHHHHHHHHHHHHHHHH",
                 "IHHHHHHHHHHHHHHHHHHHHI", ".HHHHHHHHHHHHHHHHHHHH.", "..HHHHHHHHHHHHHHHHHH..", "....HHHHHHHHHHHHHH...."],
        "modules": [
            {"kind": "mast", "x": 10, "y": 0, "w": 1, "h": 4},
            {"kind": "catroom", "x": 3, "y": 2, "w": 2, "h": 2, "slot": 0},
            {"kind": "catroom", "x": 7, "y": 2, "w": 2, "h": 2, "slot": 1},
            {"kind": "catroom", "x": 13, "y": 2, "w": 2, "h": 2, "slot": 2},
            {"kind": "catroom", "x": 17, "y": 2, "w": 2, "h": 2, "slot": 3},
            {"kind": "catroom", "x": 4, "y": 6, "w": 2, "h": 2, "slot": 4},
            {"kind": "catroom", "x": 16, "y": 6, "w": 2, "h": 2, "slot": 5},
            {"kind": "catroom", "x": 7, "y": 9, "w": 2, "h": 2, "slot": 6},
            {"kind": "cannon", "x": 20, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 20, "y": 5, "w": 2, "h": 1},
            {"kind": "cannon", "x": 0, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 15, "y": 3, "w": 2, "h": 1},
            {"kind": "cannon", "x": 5, "y": 3, "w": 2, "h": 1},
            {"kind": "shield", "x": 9, "y": 5, "w": 2, "h": 1},
            {"kind": "shield", "x": 12, "y": 5, "w": 2, "h": 1},
            {"kind": "shield", "x": 10, "y": 10, "w": 2, "h": 1},
            {"kind": "core", "x": 10, "y": 7, "w": 2, "h": 2},
            {"kind": "arcane", "x": 13, "y": 7, "w": 2, "h": 1},
            {"kind": "bridge", "x": 11, "y": 3, "w": 2, "h": 1},
            {"kind": "pump", "x": 14, "y": 10, "w": 1, "h": 1},
            {"kind": "anchor", "x": 1, "y": 9, "w": 1, "h": 1},
            {"kind": "engine", "x": 3, "y": 10, "w": 2, "h": 1}
        ],
        "art": "Fortaleza flotante con torretas en forma de orejas de gato y chimeneas."
    },
    {
        "id": "bajel", "name": "Bajel Arcano", "archetype": "arcane",
        "role": "Muchos slots mágicos, poca armadura física.", "utilityBudget": 4, "artifactSlots": 2,
        "maneuver": "Motor normal.",
        "special": "Transposición: 1 vez por turno intercambia 2 gatos de camarote sin gastar acción (como el 'barco fantasma que mueve gatos' de la CHARLA). Casco con celdas fijas de cristal ('C'): recibe x1.5 de Tierra.",
        "recommendedFor": "Zona 5-6, Encargo 'Tormenta Arcana' (solo funcionan escudos arcanos).",
        "grid": {"cols": 18, "rows": 12, "waterlineRow": 7},
        "hull": ["..................", "..................", "..................", "..................", "....CCHHHHHHCC....",
                 "HHHHHHHHHHHHHHHHHH", "HHCHHHHHHHHHHHHCHH", "HHHHHHHHHHHHHHHHHH", "HHCHHHHHHHHHHHHCHH",
                 ".HHHHHHHHHHHHHHHH.", "..HHHHHHHHHHHHHH..", "....HHHHHHHHHH...."],
        "modules": [
            {"kind": "mast", "x": 8, "y": 0, "w": 1, "h": 4},
            {"kind": "catroom", "x": 4, "y": 2, "w": 2, "h": 2, "slot": 0},
            {"kind": "catroom", "x": 6, "y": 2, "w": 2, "h": 2, "slot": 1},
            {"kind": "catroom", "x": 9, "y": 2, "w": 2, "h": 2, "slot": 2},
            {"kind": "catroom", "x": 12, "y": 2, "w": 2, "h": 2, "slot": 3},
            {"kind": "catroom", "x": 4, "y": 7, "w": 2, "h": 2, "slot": 4},
            {"kind": "catroom", "x": 12, "y": 7, "w": 2, "h": 2, "slot": 5},
            {"kind": "cannon", "x": 16, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 0, "y": 4, "w": 2, "h": 1},
            {"kind": "cannon", "x": 14, "y": 3, "w": 2, "h": 1},
            {"kind": "shield", "x": 7, "y": 5, "w": 2, "h": 1},
            {"kind": "shield", "x": 9, "y": 9, "w": 2, "h": 1},
            {"kind": "core", "x": 8, "y": 7, "w": 2, "h": 2},
            {"kind": "arcane", "x": 10, "y": 6, "w": 2, "h": 1},
            {"kind": "bridge", "x": 6, "y": 4, "w": 2, "h": 1},
            {"kind": "pantry", "x": 13, "y": 10, "w": 1, "h": 1},
            {"kind": "engine", "x": 3, "y": 10, "w": 2, "h": 1}
        ],
        "art": "Casco violeta con velas de pergamino y runas de foil; faroles flotantes."
    },
    {
        "id": "arca_celestial", "name": "Arca Celestial", "archetype": "celestial", "postChapter": True,
        "role": "TEASER: aparece en el prólogo 'en el futuro'. Se desbloquea en la Marea Nueva (NG+) / Capítulo 2. Sin estadísticas en el Cap. 1 (no está en balance.json).",
        "utilityBudget": None, "artifactSlots": None,
        "maneuver": "Manipula la gravedad (Cap. 2).", "special": "Solo cinemática en el Cap. 1.",
        "recommendedFor": "—", "grid": None, "hull": None, "modules": [],
        "art": "Barco de cristal negro con constelaciones vivas y velas de aurora."
    }
]

UTILITY_MODULES = [
    {"kind": "mast", "name": "Mástil / Cofa", "cost": 1, "footprint": [1, 4], "material": "wood", "alive": "Vista previa de trayectoria al 100% (sin mástil: 45%), revela la vida de los gatos enemigos y activa la Vista previa de colapso.", "destroyed": "Apuntas 'a ciegas' (vista previa 45%) y sin vista previa de colapso.", "unlock": "start"},
    {"kind": "arcane", "name": "Sala de Invocación", "cost": 1, "footprint": [2, 1], "material": "crystal", "alive": "Ultimates a costo normal (100 de medidor); necesaria para Supernova y Astra Prima.", "destroyed": "Ultimates cuestan 125; las de 'Majestad'/'Una bala' quedan bloqueadas.", "unlock": "mission:C11"},
    {"kind": "powder", "name": "Santabárbara", "cost": 1, "footprint": [1, 1], "material": "wood", "alive": "+25% daño de la andanada (todos tus cañones).", "destroyed": "EXPLOTA en radio 3 (80 de daño + Ardiendo), también a ti.", "unlock": "start"},
    {"kind": "pantry", "name": "Despensa de Pescaditos", "cost": 1, "footprint": [1, 1], "material": "wood", "alive": "Cura 5% de vida a todos tus gatos al inicio de tu turno.", "destroyed": "Sin curación; suelta comida como botín para el rival (en PvE: tú no pierdes nada).", "unlock": "mission:K12"},
    {"kind": "pump", "name": "Bombas de Achique", "cost": 1, "footprint": [1, 1], "material": "iron", "alive": "−50% de inundación por turno en todos tus compartimentos.", "destroyed": "Inundación completa.", "unlock": "mission:C07"},
    {"kind": "anchor", "name": "Ancla", "cost": 1, "footprint": [1, 1], "material": "iron", "alive": "Escora −50%; inmune a empujes de ráfaga y a la Corriente.", "destroyed": "El barco se balancea más (la vista previa tiembla).", "unlock": "expansion:3"},
    {"kind": "bridge", "name": "Puente de Mando", "cost": 1, "footprint": [2, 1], "material": "wood", "alive": "Activa la Reliquia de capitán equipada; el gato asignado al Puente es el 'Capitán' (trait Leal).", "destroyed": "Pierdes la pasiva de la Reliquia.", "unlock": "boss:1"},
    {"kind": "tower", "name": "Torre Elemental", "cost": 2, "footprint": [1, 2], "material": "iron", "alive": "Elige elemento al instalar: +15% daño de ese elemento; versión ⚡ = Torre Tesla: +1 salto de Conducción.", "destroyed": "Pierdes la sinergia.", "unlock": "expansion:5"},
    {"kind": "bulkhead", "name": "Mamparo", "cost": 0, "footprint": [1, 1], "material": "iron", "alive": "Separa compartimentos de inundación (gratis, pero ocupa celda).", "destroyed": "Los compartimentos vecinos se unen.", "unlock": "mission:C07"}
]

FAMILY_MODULES = {
    "hull": {"name": "Casco", "balance": "ship.families.hull", "byMk": HULL_BY_MK,
             "effect": "Todas las celdas 'H' del barco usan el MATERIAL del Mk (multiplicadores elementales y arte) y la vida por celda 'cellHp' de su clase (sube siempre, aunque el material cambie). Su Mk suma a Poder de Barco (balance)."},
    "weapon": {"name": "Arma", "balance": "ship.families.weapon",
               "effect": "Cada ranura de arma es un módulo 'cannon' en la rejilla. Los cañones NO son una acción del jugador: al final de cada turno de su bando, TODOS los cañones vivos disparan solos (ANDANADA) al Objetivo de Andanada. El Mk (global) suma a Poder de Barco y reduce la dispersión; el TIPO se elige por ranura en el astillero (sidegrade, sin coste de poder).",
               "types": [
                   {"id": "canon", "name": "Cañón", "unlock": "start", "shot": "Bala parabólica fiable: 40 de daño, radio 1.2, en cada andanada.", "synergy": "Santabárbara +25%."},
                   {"id": "mortero", "name": "Mortero de Magma", "unlock": "secret:expansion_3", "shot": "Tiro muy bombeado (gravedad x1.3) que cae sobre el objetivo desde arriba (ignora muros frontales), perfora 1, 45 de daño, radio 1.5, Ardiendo.", "synergy": "+15% si hay un gato 🔥 a bordo."},
                   {"id": "tesla", "name": "Bobina Tesla", "unlock": "boss:2", "shot": "Rayo recto 30 de daño, Cargado; provoca Conducción si el objetivo está Mojado.", "synergy": "CHARLA: 1 gato ⚡ a bordo: +15% alcance de cadena. 2 gatos ⚡: los saltos +1. 1 gato 💧: enemigos Mojados reciben x1.5 eléctrico."},
                   {"id": "escarcha", "name": "Lanzaescarcha", "unlock": "secret:expansion_5", "shot": "3 esquirlas en abanico (15 c/u); Congela las celdas Mojadas (Ventisca), Moja las secas.", "synergy": "Estallido con Tierra."},
                   {"id": "arpon", "name": "Arpón del Leviatán", "unlock": "event:migracion_leviatan", "shot": "Arpón recto que se clava y TIRA: arrastra el módulo 1 celda hacia ti (rompe soportes). 35 de daño. Solo dispara en andanadas pares (cada 2 turnos).", "synergy": "Pieza exclusiva del evento ('ese lo conseguí en la migración')."},
                   {"id": "riel", "name": "Riel Arcano", "unlock": "boss:4", "shot": "Runa recta perforante (3 capas), 30 de daño, Maldito.", "synergy": "+25% si hay un gato ✨ a bordo."},
                   {"id": "starbreaker", "name": "Starbreaker", "unlock": "event:estrella_fugaz", "shot": "UNA vez por batalla, solo: dispara en la primera andanada cuyo objetivo esté a ≤3 celdas del núcleo enemigo (o en la andanada del turno 4 como máximo). Atraviesa el casco completo (perforación infinita), 120 de daño.", "synergy": "Arma de trofeo del evento."}
               ]},
    "shield": {"name": "Escudo", "balance": "ship.families.shield (unlock boss:3)",
               "effect": "Cada ranura de escudo es un módulo 'shield' (generador). Si el generador muere, ese escudo cae el resto de la batalla. Débiles a Sobrecarga ⚡ y Magia.",
               "types": [
                   {"id": "burbuja", "name": "Escudo Burbuja", "unlock": "boss:3", "rule": "Anula 1 impacto completo por turno; se regenera al inicio de tu turno."},
                   {"id": "espejo", "name": "Escudo Espejo", "unlock": "secret:expansion_7", "rule": "20% (PRNG) de reflejar el proyectil de vuelta."},
                   {"id": "arcano", "name": "Escudo Arcano", "unlock": "boss:4", "rule": "Absorbe hasta 150 de daño elemental por turno; recibe x1.5 de daño físico (Tierra, cañón)."},
                   {"id": "sacrificial", "name": "Escudo Sacrificial", "unlock": "event:marea_fantasma", "rule": "Absorbe 200 en total; al romperse cura 30% a todos tus gatos."},
                   {"id": "vacio", "name": "Escudo del Vacío", "unlock": "chapter:2", "rule": "TEASER bloqueado: no bloquea daño; teletransporta un proyectil al azar. 'Requiere 🕳️'."}
               ]},
    "engine": {"name": "Motor", "balance": "ship.families.engine",
               "effect": "Motor de Marea: combustible por turno = 2 + floor(Mk/2) celdas de maniobra (A/D). Sin motor el barco no se mueve. Su Mk suma a Poder de Barco."},
    "core": {"name": "Núcleo", "balance": "ship.families.core",
             "effect": "Todo barco tiene un CORAZÓN (objetivo de victoria) aunque no tenga ranura de Núcleo. Con ranura, el Corazón se vuelve Núcleo Arcano: al inicio de tu turno da medidor de ultimate a toda la tripulación (+5 con Mk I-III, +10 con Mk IV-V, +15 con Mk VI-VII). Su Mk suma a Poder de Barco."}
}

RELICS = [
    {"id": "reliquia_bigote", "name": "Bigote Roto", "from": "boss:1", "effect": "+10% daño contra madera."},
    {"id": "reliquia_ojo", "name": "Ojo de Gárgola", "from": "boss:2", "effect": "Vista previa de trayectoria +25%."},
    {"id": "reliquia_mascara", "name": "Antifaz de Noctis", "from": "event:bandera_negra", "effect": "El primer golpe que recibe cada camarote por batalla hace x0.5."},
    {"id": "reliquia_corona", "name": "Corona del Trueno", "from": "event:heroica_1 (sprint)", "effect": "Conducción +1 salto."},
    {"id": "reliquia_ventosa", "name": "Ventosa del Kraken", "from": "boss:3", "effect": "Inmune a empujes y a la Corriente enemiga."},
    {"id": "reliquia_grimorio", "name": "Grimorio del Arcanista", "from": "boss:4", "effect": "Maldito que apliques dura +1 turno."},
    {"id": "reliquia_polvo", "name": "Polvo de la Estrella Errante", "from": "boss:5", "effect": "Tus pozos de gravedad duran +1 turno; tus orbes cósmicos curvan +5°."},
    {"id": "reliquia_diente", "name": "Diente del Primer Mar", "from": "boss:6", "effect": "+10% daño a todo. (Para el Mar Abierto y la Marea Nueva.)"}
]

ARTIFACTS = [
    {"id": "kit_reparacion", "name": "Kit de Reparación", "unlock": "mission:C17", "effect": "Repara 30% a un módulo propio."},
    {"id": "burbuja_emergencia", "name": "Burbuja de Emergencia", "unlock": "mission:C19", "effect": "Escudo de 1 impacto sobre un módulo."},
    {"id": "bomba_humo", "name": "Bomba de Humo", "unlock": "mission:C17", "effect": "El rival pierde la vista previa 2 turnos."},
    {"id": "ancla_emergencia", "name": "Ancla de Emergencia", "unlock": "mission:C20", "effect": "1 turno inmune a hundimiento, empujes y Corriente."},
    {"id": "catnip", "name": "Catnip Táctico", "unlock": "mission:C23", "effect": "Un gato no gasta recarga este turno y hace +20%."},
    {"id": "bengala", "name": "Bengala", "unlock": "mission:E13", "effect": "Revela todo el barco enemigo (vida, camarotes, punto débil) 2 turnos."}
]

# ---------------------------------------------------------------- Jefes
BOSSES = [
    {
        "id": "boss_1", "n": 1, "type": "zone_boss", "name": "Capitán Bigotes Rotos", "title": "El Tiburón Desbigotado",
        "zone": 1, "klGate": "balance:bosses[0].kl", "elements": ["water", "fire"],
        "captainArt": {"slug": "arce_autumn_cat", "treatment": "enemigo: desaturado 40%, contorno rojo, parche en el ojo y bigotes chuecos (decals en código)"},
        "ship": {"name": "La Sardina Furiosa", "size": "16x10", "materials": "madera + 6 barriles de pólvora en cubierta", "notable": ["2 cañones", "santabárbara detrás del mástil", "3 camarotes", "bodega con el 'fósil vivo' (Gea) visible tras la F2"]},
        "rule": "BARRILES: hay 6 barriles de pólvora en su cubierta; si revientas uno explota en cadena con los vecinos (daño a ÉL). Enseña a leer el barco.",
        "weakPoint": "La santabárbara detrás del mástil: si cae el mástil, queda expuesta.",
        "phases": [
            {"range": [1.0, 0.66], "name": "¡Arrr!", "behavior": "Dispara bolas normales; IA Afinador (horquilla los tiros)."},
            {"range": [0.66, 0.33], "name": "¡A los remos!", "behavior": "Maniobra 2 celdas por turno y se cubre detrás de su casco de proa; abre la bodega (se ve un fósil brillando)."},
            {"range": [0.33, 0.0], "name": "¡Fuego a discreción!", "behavior": "Dispara 2 veces por turno, pero su santabárbara queda expuesta (telegrafiada con brillo rojo)."}
        ],
        "enrageTurn": 12, "ai": {"personality": "afinador", "difficulty": "corsario"},
        "lines": {
            "intro": "¡Arrr! ¿Una balsa? ¿Con TRES gatos? Esto va a ser más fácil que robarle el pescado a un gato dormido. Ah, no, espera…",
            "phase2": "¡A LOS REMOS, bola de inútiles! ¡Y que nadie toque la bodega!",
            "phase3": "¡Mis bigotes! ¡MIS BIGOTES! ¡FUEGO A TODO LO QUE SE MUEVA!",
            "defeat": "Bueno… quédate el fósil. Muerde.",
            "win": "¡JA! Vuelve cuando tu balsa tenga dientes."
        },
        "rewards": {"balance": "bosses[0] (gemas, desbloqueos) + combat.reward.boss_blueprints/boss_crystals + orbs.boss_orbs + ronroneo.base_min.boss", "unlocks": ["element:earth", "cat:l_gea", "zone:2"], "relic": "reliquia_bigote", "extra": ["Puente de Mando (módulo de utilería)", "Cat's Gambit (la Mesa del Gato aparece en la isla)"]}
    },
    {
        "id": "boss_2", "n": 2, "type": "zone_boss", "name": "La Gárgola Ronroneante", "title": "Guardiana de los Acantilados",
        "zone": 2, "klGate": "balance:bosses[1].kl", "elements": ["earth", "nature"],
        "captainArt": {"slug": "fossilstone_guardian_cat", "treatment": "enemigo: gris oscuro, alas de piedra (decal), ojos rojos"},
        "ship": {"name": "El Risco Flotante", "size": "18x12", "materials": "piedra (S) con enredaderas", "notable": ["fortaleza de piedra", "La Garganta (módulo central 2x2)", "2 morteros", "4 camarotes"]},
        "rule": "PIEL DE PIEDRA + RONRONEO: sus celdas de piedra reciben x0.5 de todo salvo Tierra y Estallido. Cada 3 turnos ronronea y se cura 10% (telegrafiado: 'RRRRR 1/3').",
        "weakPoint": "La Garganta: golpearla interrumpe el Ronroneo y la Aturde 1 turno.",
        "phases": [
            {"range": [1.0, 0.66], "name": "Piedra", "behavior": "Morteros lentos y precisos; Ronroneo cada 3 turnos."},
            {"range": [0.66, 0.33], "name": "Despierta la tormenta", "behavior": "Empieza a llover: TODO el campo queda Mojado cada turno (teaser de la Tormenta)."},
            {"range": [0.33, 0.0], "name": "Vuelo", "behavior": "La gárgola despega: se separa del barco y se vuelve un objetivo volador que lanza rocas (su barco ya no dispara)."}
        ],
        "enrageTurn": 14, "ai": {"personality": "demoledor", "difficulty": "corsario"},
        "lines": {
            "intro": "Rrrrrrr… Llevo trescientos años durmiendo en este acantilado. ¿Y tú vienes a hacer ruido?",
            "phase2": "El cielo también ronronea cuando se enoja. Escucha.",
            "phase3": "¡Ya me despertaste, MOCOSO! ¡Ahora vuelo!",
            "defeat": "Rrr… la tormenta ya no es mía. Llévatela. Hace ruido.",
            "win": "Duerme tú ahora."
        },
        "rewards": {"balance": "bosses[1]", "unlocks": ["element:storm", "cat:l_tronador", "zone:3"], "relic": "reliquia_ojo", "extra": ["Arma: Bobina Tesla"]}
    },
    {
        "id": "boss_3", "n": 3, "type": "zone_boss", "name": "Kraken Voltaico", "title": "El Que Abraza Barcos",
        "zone": 3, "klGate": "balance:bosses[2].kl", "elements": ["storm", "water"],
        "captainArt": {"slug": "mecha_neon_cat", "treatment": "enemigo: capitán diminuto en la cabeza del kraken; el kraken (tentáculos, ojo, pico) se dibuja en código"},
        "ship": {"name": "Barco atrapado por el Kraken", "size": "20x12 + 4 tentáculos", "materials": "hierro + carne de kraken (material 'bone')", "notable": ["4 tentáculos (objetivos separados, 300 de vida c/u)", "Generador de Estática", "el Ojo"]},
        "rule": "TENTÁCULOS + PRIMER ESCUDO DEL JUEGO: los tentáculos agarran tus módulos (los desactivan) y tiran gatos al agua. Desde la F2, BURBUJA DE ESTÁTICA: anula 1 impacto por turno (¡CLANK!) salvo multi-impacto o ⚡ (Sobrecarga la rompe).",
        "weakPoint": "El Ojo: solo es golpeable cuando abre el pico (cada 3 turnos, telegrafiado).",
        "phases": [
            {"range": [1.0, 0.66], "name": "Abrazo", "behavior": "Los tentáculos atacan; cada tentáculo vivo agarra 1 módulo tuyo por turno."},
            {"range": [0.66, 0.33], "name": "Estática", "behavior": "Levanta la Burbuja de Estática (primer escudo que ves). Mensaje: 'NUEVA MECÁNICA: ESCUDOS'."},
            {"range": [0.33, 0.0], "name": "Inmersión", "behavior": "Se sumerge cada 2 turnos: bajo el agua solo le afectan ⚡ (conduce) y torpedos 💧."}
        ],
        "enrageTurn": 14, "ai": {"personality": "elementalista", "difficulty": "capitan"},
        "lines": {
            "intro": "(el kraken no habla; su capitán sí) ¡Míralo! ¡Le caíste bien! ¡Te va a abrazar HASTA QUE TRUENES!",
            "phase2": "¿Ves esa burbuja? Se llama 'no puedes'. Bonita, ¿no?",
            "phase3": "¡A las profundidades, bebé!",
            "defeat": "Ok, ok… ¡suéltalo! ¡Llévate los planos del escudo pero suéltalo!",
            "win": "¡Abrazo grupal!"
        },
        "rewards": {"balance": "bosses[2]", "unlocks": ["ship:bastion", "family:shield", "zone:4"], "relic": "reliquia_ventosa", "extra": ["Escudo Burbuja"]}
    },
    {
        "id": "boss_4", "n": 4, "type": "zone_boss", "name": "El Arcanista", "title": "Ladrón de Páginas",
        "zone": 4, "klGate": "balance:bosses[3].kl", "elements": ["magic", "earth"],
        "captainArt": {"slug": "candy_alchemist_cat", "treatment": "enemigo: paleta ORQUÍDEA REAL oscura (#231626), sombrero puntiagudo y grimorio flotante (código)"},
        "ship": {"name": "La Biblioteca Errante", "size": "18x12", "materials": "cristal arcano + madera", "notable": ["3 Generadores Arcanos (capas)", "Grimorio (núcleo)", "Espejo"]},
        "rule": "ESCUDOS ARCANOS EN CAPAS (3): absorben daño elemental, reciben x1.5 físico; 20% de reflejar runas (espejo). Sobrecarga ⚡ rompe una capa y aturde al gato que la sostiene.",
        "weakPoint": "Su Grimorio (núcleo): se abre (vulnerable x1.5) el turno después de invocar.",
        "phases": [
            {"range": [1.0, 0.66], "name": "Tres capas", "behavior": "Escudos arcanos x3; runas teledirigidas Malditas."},
            {"range": [0.66, 0.33], "name": "Teletransporte", "behavior": "Intercambia de lugar 2 de sus módulos cada turno (telegrafiado 1 turno antes)."},
            {"range": [0.33, 0.0], "name": "Grimorio abierto", "behavior": "Invoca 2 gatos de tinta (objetivos temporales que disparan); su Grimorio queda vulnerable."}
        ],
        "enrageTurn": 15, "ai": {"personality": "calculador", "difficulty": "capitan"},
        "lines": {
            "intro": "Ah, el grumete de la balsa. Ya conoces mi magia. Ahora conoce mi PACIENCIA. …Mentira, no tengo.",
            "phase2": "¿Dónde quedó tu cañón? Ups. Ahora es mío. Ahora es tuyo. Ahora es mío.",
            "phase3": "¡Que se escriba tu final! ¡Tinta, a mí!",
            "defeat": "Llévate a esa gata del grimorio… nunca dejó de corregirme la ortografía.",
            "win": "Fin. Con mayúscula."
        },
        "rewards": {"balance": "bosses[3]", "unlocks": ["cat:l_merlina", "ship:bajel", "zone:5"], "relic": "reliquia_grimorio", "extra": ["Escudo Arcano", "Arma: Riel Arcano", "Fragmento del Vacío 1/10 (cae de su grimorio: '¿esto qué es?')"]}
    },
    {
        "id": "boss_5", "n": 5, "type": "zone_boss", "name": "Estrella Errante", "title": "La que Cayó Dos Veces",
        "zone": 5, "klGate": "balance:bosses[4].kl", "elements": ["cosmic", "storm"],
        "captainArt": {"slug": "alien_galaxy_cat", "treatment": "enemigo: blanco-dorado brillante (hue 40, bright 1.4), cola de cometa en código"},
        "ship": {"name": "El Cometa", "size": "20x11", "materials": "hierro + cristal; núcleo-estrella", "notable": ["Núcleo-estrella", "2 pozos de gravedad", "4 camarotes"]},
        "rule": "GRAVEDAD ERRANTE: cada fase cambia la gravedad del campo para TODOS (F1 normal, F2 baja x0.5: proyectiles flotan, F3 invertida del lado enemigo: tus tiros caen 'hacia arriba' cerca de su barco).",
        "weakPoint": "El núcleo-estrella brilla (vulnerable x2) solo mientras carga 'Lluvia de Estrellas' (1 turno, telegrafiado).",
        "phases": [
            {"range": [1.0, 0.66], "name": "Órbita", "behavior": "Orbes gravitatorios; gravedad normal."},
            {"range": [0.66, 0.33], "name": "Ingravidez", "behavior": "Gravedad x0.5 para todos; sus escombros flotan y luego caen sobre TI."},
            {"range": [0.33, 0.0], "name": "Caída", "behavior": "Gravedad invertida cerca de su barco; carga Lluvia de Estrellas cada 3 turnos."}
        ],
        "enrageTurn": 15, "ai": {"personality": "calculador", "difficulty": "leyenda"},
        "lines": {
            "intro": "Caí una vez del cielo. No me gustó. Ahora tú vas a caer.",
            "phase2": "¿Sientes eso? Ya no pesas nada. Igual que tus argumentos.",
            "phase3": "¡ABAJO ES ARRIBA, GRUMETE!",
            "defeat": "Ahí está… lo que me empujó del cielo. Viene por ti. ¿Lo oyes?",
            "win": "Otra estrella fugaz. Pide un deseo."
        },
        "rewards": {"balance": "bosses[4]", "unlocks": ["element:cosmic", "cat:l_astraprima", "zone:6"], "relic": "reliquia_polvo", "extra": ["Fragmentos del Vacío 2-3/10"]}
    },
    {
        "id": "boss_6", "n": 6, "type": "final_boss", "name": "EL PRIMER MAR", "title": "Leviatán Almirante (balance: 'Leviatan Almirante')",
        "zone": 6, "klGate": "balance:bosses[5].kl", "elements": ["cosmic", "magic", "fire"],
        "captainArt": {"slug": None, "treatment": "El Leviatán (ballena-barco de hueso) se dibuja en código; Distraxia es una niebla violeta con ojos. El Primer Mar es el océano mismo levantándose."},
        "ship": {"name": "El Leviatán Almirante", "size": "26x14 (ocupa 2/3 de la pantalla)", "materials": "hueso + escamas de coral arcano", "notable": ["3 núcleos (uno por fase)", "Espiráculo", "aletas-cañón", "Niebla de Distraxia"]},
        "rule": "EL MAR ES EL JEFE: cada fase exige una mecánica aprendida. 3 núcleos (uno por fase): destruir el núcleo de la fase la termina. Clímax con cierre circular (el último golpe es el STARFALL del prólogo).",
        "weakPoint": "El Espiráculo (núcleo de F2) solo emerge tras congelar el mar a su alrededor.",
        "phases": [
            {"range": [1.0, 0.66], "name": "Escamas arcanas", "behavior": "Escudos arcanos en capas (exige Sobrecarga ⚡ + Maldito ✨)."},
            {"range": [0.66, 0.33], "name": "Casco de agua viva", "behavior": "Se sumerge; para sacarlo hay que Mojar y luego Ventisca (congelar el mar alrededor) y romper con Estallido 🪨; la Conducción por el mar mojado le pega aunque esté sumergido."},
            {"range": [0.33, 0.0], "name": "El mar se traga todo", "behavior": "Gravedad invertida; Distraxia 'devora' (borra) 1 módulo tuyo por turno. TODOS tus gatos empiezan la fase con la ultimate al 100%. Al llegar a 10% de vida: cinemática y golpe final guionizado con Astra Prima — STELLAR DECREE: STARFALL (mismo plano del prólogo)."}
        ],
        "enrageTurn": 20, "ai": {"personality": "elementalista", "difficulty": "leyenda"},
        "lines": {
            "intro": "(Distraxia, con mil voces) Este mar recuerda todo lo que el Archivo olvidó. Y yo me encargo de que lo olvide otra vez.",
            "phase2": "¿Un barco? ¿Gatos? Qué cosa tan… memorable. Qué lástima.",
            "phase3": "Yo no destruyo, grumete. Yo BORRO.",
            "defeat": "No… no es posible… algo… algo viene detrás de ti…",
            "win": "Shhh. Ya no te acuerdas de nada."
        },
        "rewards": {"balance": "bosses[5] (15 gemas)", "unlocks": ["chapter_end", "teaser:void"], "relic": "reliquia_diente", "extra": ["Fragmento del Vacío 10/10", "Marea Final", "Velo Noctis se une (secreto)", "Arca Celestial (teaser, NG+)"]}
    },
    # ---- encuentros de historia / evento
    {"id": "story_patito", "type": "story", "name": "El Patito Pirata", "title": "Tutorial (y revancha)", "zone": 1, "elements": ["water"],
     "captainArt": {"slug": "jelly_aquatic_cat", "treatment": "pirata chiquito con gorro de papel"},
     "ship": {"name": "Patito de Hule", "size": "9x6", "materials": "madera pintada de amarillo (casco con forma de patito)", "notable": ["1 cañón de juguete", "1 camarote", "núcleo expuesto"]},
     "rule": "No se puede perder (el enemigo hace 30% de daño). Al hundirse hace '¡cuac!'. Revancha (KL≥36): mismo barco, tu daño se muestra como (SP/EP)³ x 1000 → ~10⁹-10¹⁰.",
     "weakPoint": "Todo.", "phases": [], "ai": {"personality": "torpe", "difficulty": "grumete"},
     "lines": {"intro": "¡Cuac! ¡Esta es mi bahía! ¡Cuac!", "defeat": "¡CUAAAAC!", "revenge": "¿Te… te acuerdas de mí? ¡Cuac! …no, por favor, no con ESO."},
     "rewards": {"extra": ["Botín Dorado garantizado (primera victoria)", "Revancha: 1 gema + logro 'Hace mucho tiempo, en una balsa…'"]}},
    {"id": "story_heraldo", "type": "story", "name": "Heraldo del Arcanista", "title": "Algo viene (Reino 24)", "zone": 4, "elements": ["magic"],
     "captainArt": {"slug": "candy_alchemist_cat", "treatment": "silueta violeta del Arcanista (primer encuentro)"},
     "ship": {"name": "Barco que brilla de noche", "size": "14x9", "materials": "cristal", "notable": ["1 Generador Arcano", "2 camarotes"]},
     "rule": "Batalla de historia: poder enemigo = 0.6 x tu Poder de Barco. Su gato levanta un ESCUDO MÁGICO (¡CLANK!): absorbe todo salvo Tierra/cañón x1.5. Al vencerlo: Núcleo Arcano → NUEVO ELEMENTO: MAGIA (secuencia T4).",
     "weakPoint": "El escudo arcano recibe x1.5 de daño físico.", "phases": [], "ai": {"personality": "calculador", "difficulty": "corsario"},
     "lines": {"intro": "Ah. Así que tú eres el que anda despertando primordiales. Qué ruidoso.", "defeat": "Interesante. Muy interesante. Nos vemos en las Ruinas, grumete."},
     "rewards": {"extra": ["element:magic (balance kl:24)", "Hábitat Arcano", "Resonancias nuevas (conteo dinámico)"]}},
    {"id": "event_raijin", "type": "event_boss", "name": "Raijin", "title": "Nodo final de la Heroica 1", "zone": 3, "elements": ["storm"],
     "captainArt": {"slug": "mecha_neon_cat", "treatment": "Battle Form completa, flotando en un barco-nube"},
     "ship": {"name": "Nube de Guerra", "size": "16x10", "materials": "nube (lona) + hierro", "notable": ["2 bobinas tesla", "pararrayos que absorbe tus rayos"]},
     "rule": "Su pararrayos absorbe tus disparos ⚡ y le carga la ultimate: usa fuego, tierra o agua.", "weakPoint": "El pararrayos (destrúyelo y sus rayos se vuelven contra él).",
     "phases": [], "ai": {"personality": "francotirador", "difficulty": "capitan"},
     "lines": {"intro": "¿Tú eres el que quiere heredar el trueno? Primero sobrevive a él.", "defeat": "Ok. Me caes bien. Me voy contigo. Pero yo elijo el camarote."},
     "rewards": {"extra": ["cat:m_raijin (balance events.heroic[0])"]}},
    {"id": "event_grieta", "type": "event_boss", "name": "La Grieta", "title": "Nodo final de la Heroica 2", "zone": 5, "elements": ["cosmic"],
     "captainArt": {"slug": "nori_lunar_cat", "treatment": "silueta negra con contorno de luz; ojos de eclipse"},
     "ship": {"name": "Grieta Cósmica", "size": "14x14 (un agujero en el cielo con escombros orbitando)", "materials": "cristal + escombros flotantes", "notable": ["Singularidad cargando 1/2 visible"]},
     "rule": "La Singularidad carga 2 turnos: si llega a 2/2, arranca 4x4 celdas de tu barco. Golpear su camarote reinicia la carga ('¡MATEN A ESE YA!').", "weakPoint": "Su camarote (siempre visible).",
     "phases": [], "ai": {"personality": "calculador", "difficulty": "leyenda"},
     "lines": {"intro": "…", "defeat": "(se acurruca en tu barco como si siempre hubiera sido suyo)"},
     "rewards": {"extra": ["cat:m_singular (balance events.heroic[1])"]}},
    {"id": "event_vacio", "type": "event_boss", "name": "Barco del Vacío", "title": "A VOID SHIP HAS ENTERED YOUR WORLD", "zone": 6, "elements": ["void"],
     "captainArt": {"slug": None, "treatment": "sin capitán visible; silueta con estática"},
     "ship": {"name": "???", "size": "16x10", "materials": "void (200) — tus tiros hacen x0.5", "notable": ["Devorar: borra escudos y estados"]},
     "rule": "NO SE PUEDE GANAR: se va al turno 8. El premio depende del daño hecho (Fragmentos del Vacío: 1 por cada 15% de daño, máx. 3). Reloj ROJO 14:59.", "weakPoint": "—",
     "phases": [], "ai": {"personality": "calculador", "difficulty": "leyenda"},
     "lines": {"intro": "…ELEMENT: ??? …", "leave": "(la estática forma una palabra que nadie alcanza a leer)"},
     "rewards": {"extra": ["Fragmentos del Vacío +1..3"]}},
    {"id": "secret_orquesta", "type": "secret", "name": "La Orquesta Muda", "title": "Santuario Gatuno Antiguo (Ruinas Arcanas)", "zone": 4, "elements": ["magic", "cosmic", "storm"],
     "captainArt": {"slug": "sonata_prima_cat", "treatment": "silueta en blanco y negro (MANGA TINTA); se colorea al vencer"},
     "ship": {"name": "Escenario de Piedra", "size": "Duelo 2v2 sobre plataformas", "materials": "piedra", "notable": ["4 atriles-módulo"]},
     "rule": "Duelo de Gatos: los atriles tocan una nota por turno; con 4 notas, acorde que golpea a todos. Rompe los atriles en orden (do-re-mi-fa) para silenciarla.", "weakPoint": "El atril de la nota que viene (brilla).",
     "phases": [], "ai": {"personality": "elementalista", "difficulty": "capitan"},
     "lines": {"intro": "(silencio. Luego, una nota.)", "defeat": "La primera nota vuelve a sonar. Gracias por escuchar."},
     "rewards": {"extra": ["cat:s_sonata", "Lore: el Archivo Vivo"]}}
]

ELITES = [
    {"zone": 1, "name": "Contramaestre Ovillo", "ship": "La Madeja", "personality": "afinador", "rule": "Sus tiros empiezan cortos/largos y afinan: si no lo hundes rápido, te clava.", "line": "Uno corto… uno largo… y el tercero, en tu cara."},
    {"zone": 2, "name": "Barón Ladrillo", "ship": "El Muro", "personality": "demoledor", "rule": "Apunta a tu quilla y soportes para provocarte colapsos (usa la vista previa de colapso).", "line": "No te voy a hundir. Te voy a DERRUMBAR."},
    {"zone": 3, "name": "Bruja Nimbus", "ship": "Caldero Tormenta", "personality": "elementalista", "rule": "Moja tu barco y luego electrocuta (te enseña Conducción a golpes).", "line": "Primero te mojo. Luego ya sabes."},
    {"zone": 4, "name": "Capitana Mira", "ship": "La Mirilla", "personality": "francotirador", "rule": "Solo dispara rayos rectos y caza gatos Expuestos.", "line": "No fallo. Nunca. Bueno, una vez. No hablemos de eso."},
    {"zone": 5, "name": "Almirante Tictoque", "ship": "Fortaleza Relojera", "personality": "calculador", "rule": "Repara 1 módulo por turno mientras viva su sala de máquinas; cada 4 turnos 'rebobina' tu último tiro (lo deshace).", "line": "Tic. Tac. Tu turno terminó hace tres segundos."},
    {"zone": 6, "name": "Lady Garra", "ship": "La Viuda Negra", "personality": "vengativo", "rule": "Ataca siempre al gato que más daño le hizo; si pierde 2 gatos entra en Berserk.", "line": "Recuerdo cada rasguño. Y los devuelvo dobles."}
]

AI_DIFFICULTY = {
    "grumete": {"sigmaAngleDeg": 6, "sigmaPowerPct": 12, "windReadErrPct": 40, "softmaxTemp": "alta", "bracketing": 0.7, "combos": False, "interruptsCharges": "nunca", "moves": False, "thinkS": 1.5},
    "corsario": {"sigmaAngleDeg": 3, "sigmaPowerPct": 6, "windReadErrPct": 20, "softmaxTemp": "media", "bracketing": 0.6, "combos": "simples", "interruptsCharges": "a veces", "moves": "a veces", "thinkS": 1.2},
    "capitan": {"sigmaAngleDeg": 1.5, "sigmaPowerPct": 3, "windReadErrPct": 8, "softmaxTemp": "baja", "bracketing": 0.5, "combos": True, "interruptsCharges": "siempre", "moves": True, "thinkS": 1.0},
    "leyenda": {"sigmaAngleDeg": 0.8, "sigmaPowerPct": 1.5, "windReadErrPct": 3, "softmaxTemp": "~0 + guion", "bracketing": None, "combos": "con reglas propias", "interruptsCharges": "siempre, con frase", "moves": "patrones propios", "thinkS": 0.8}
}

ZONE_AI = {1: "grumete", 2: "corsario", 3: "corsario", 4: "capitan", 5: "capitan", 6: "capitan"}

ENEMY_ARCHETYPES = {
    "bote_ratas": {"size": "10x7", "hull": "madera", "cannons": 1, "catrooms": 1, "mast": False, "special": "Sin mástil: dispara 'a ciegas' (su IA tiene σ x1.3)."},
    "chalupa": {"size": "11x7", "hull": "madera", "cannons": 1, "catrooms": 2, "mast": True, "special": "—"},
    "pesquero": {"size": "12x8", "hull": "madera", "cannons": 2, "catrooms": 2, "mast": True, "special": "Despensa (suelta comida extra al destruirla: +comida = 30 s de producción)."},
    "barcaza_muro": {"size": "12x8", "hull": "madera + muro de hierro en proa", "cannons": 1, "catrooms": 2, "mast": True, "special": "El muro obliga a bombear el tiro (enseña el tiro alto)."},
    "lancha_polvora": {"size": "11x7", "hull": "madera", "cannons": 2, "catrooms": 2, "mast": True, "special": "Santabárbara expuesta: un tiro bien puesto la hace explotar (enseña módulos explosivos)."},
    "cangrejo": {"size": "12x8", "hull": "madera + pinzas de hierro", "cannons": 2, "catrooms": 2, "mast": False, "special": "Se mueve de lado 2 celdas por turno."},
    "fortin_piedra": {"size": "13x9", "hull": "piedra", "cannons": 2, "catrooms": 2, "mast": True, "special": "Piedra: x1.25 Tierra/Naturaleza, x0.75 Fuego."},
    "galera_raices": {"size": "14x9", "hull": "madera", "cannons": 2, "catrooms": 3, "mast": True, "special": "Enredaderas que regeneran 1 celda por turno."},
    "torre_barco": {"size": "10x12", "hull": "piedra", "cannons": 1, "catrooms": 3, "mast": True, "special": "Torre alta con francotiradores arriba: derrumba la base."},
    "catapulta": {"size": "13x8", "hull": "madera", "cannons": 1, "catrooms": 2, "mast": False, "special": "Morteros muy bombeados que caen sobre tus camarotes."},
    "balandra_electrica": {"size": "13x8", "hull": "hierro", "cannons": 2, "catrooms": 2, "mast": True, "special": "Cubierta siempre Mojada: tu Conducción hace fiesta… y la suya también."},
    "pararrayos": {"size": "12x10", "hull": "hierro", "cannons": 2, "catrooms": 2, "mast": True, "special": "Pararrayos: absorbe el primer rayo de cada turno."},
    "templo_flotante": {"size": "14x10", "hull": "cristal", "cannons": 2, "catrooms": 3, "mast": True, "special": "Generador de Escudo Arcano (1 capa)."},
    "biblioteca": {"size": "14x9", "hull": "madera + cristal", "cannons": 2, "catrooms": 3, "mast": True, "special": "Gatos ✨ que Maldicen; estantes (madera) inflamables."},
    "galeon_runas": {"size": "16x10", "hull": "hierro + cristal", "cannons": 3, "catrooms": 3, "mast": True, "special": "Escudo Arcano + Escudo Burbuja."},
    "satelite": {"size": "12x10", "hull": "hierro", "cannons": 2, "catrooms": 2, "mast": False, "special": "Pozo de gravedad que curva tus tiros."},
    "nave_cometa": {"size": "14x8", "hull": "hierro + cristal", "cannons": 2, "catrooms": 3, "mast": True, "special": "Rápida: maniobra 3 celdas por turno."},
    "observatorio": {"size": "15x11", "hull": "cristal", "cannons": 3, "catrooms": 3, "mast": True, "special": "Su mástil revela tus camarotes: te apunta mejor (σ x0.7)."},
    "barco_hueso": {"size": "15x9", "hull": "hueso", "cannons": 3, "catrooms": 3, "mast": True, "special": "Cada módulo destruido revive UNA vez como fantasma (30% de vida)."},
    "galeon_niebla": {"size": "16x10", "hull": "hueso + madera", "cannons": 3, "catrooms": 4, "mast": True, "special": "Niebla de Distraxia: tu vista previa se corta al 50% (Linterna Espíritu la ignora)."},
    "fortaleza_relojera": {"size": "16x11", "hull": "hierro", "cannons": 3, "catrooms": 3, "mast": True, "special": "Sala de máquinas que repara 1 módulo por turno."}
}

ZONE_STAGES = {
    1: [("Bote de Ratas", "bote_ratas", "torpe"), ("Chalupa Pesquera", "chalupa", "torpe"), ("Barcaza con Muro", "barcaza_muro", "afinador"),
        ("Lancha de Contrabando", "lancha_polvora", "afinador"), (None, "pesquero", "afinador"), ("Barco-Cangrejo", "cangrejo", "afinador"),
        ("Pesquero Pirata", "pesquero", "saqueador"), ("Chalupa Doble", "chalupa", "vengativo")],
    2: [("Fortín de Piedra", "fortin_piedra", "afinador"), ("Galera de Raíces", "galera_raices", "elementalista"), ("Catapulta Flotante", "catapulta", "demoledor"),
        ("Torre-Barco", "torre_barco", "francotirador"), (None, "fortin_piedra", "demoledor"), ("Galera Musgosa", "galera_raices", "elementalista"),
        ("Fortín Doble", "fortin_piedra", "demoledor"), ("Torre de Vigía", "torre_barco", "francotirador")],
    3: [("Balandra Eléctrica", "balandra_electrica", "elementalista"), ("Pararrayos", "pararrayos", "francotirador"), ("Chalupa de Tormenta", "chalupa", "afinador"),
        ("Balandra Doble", "balandra_electrica", "elementalista"), (None, "balandra_electrica", "elementalista"), ("Pararrayos Gigante", "pararrayos", "calculador"),
        ("Remolcador de Rayos", "cangrejo", "vengativo"), ("Flota del Kraken", "balandra_electrica", "calculador")],
    4: [("Templo Flotante", "templo_flotante", "calculador"), ("Biblioteca a la Deriva", "biblioteca", "elementalista"), ("Galeón de Runas", "galeon_runas", "calculador"),
        ("Templo Hundido", "templo_flotante", "francotirador"), (None, "torre_barco", "francotirador"), ("Biblioteca Prohibida", "biblioteca", "elementalista"),
        ("Galeón Sellado", "galeon_runas", "calculador"), ("Puerta de las Ruinas", "templo_flotante", "vengativo")],
    5: [("Satélite Pirata", "satelite", "calculador"), ("Nave Cometa", "nave_cometa", "afinador"), ("Observatorio", "observatorio", "francotirador"),
        ("Satélite Doble", "satelite", "calculador"), (None, "fortaleza_relojera", "calculador"), ("Cometa Rojo", "nave_cometa", "vengativo"),
        ("Gran Observatorio", "observatorio", "francotirador"), ("Anillo de Escombros", "satelite", "demoledor")],
    6: [("Barco de Hueso", "barco_hueso", "vengativo"), ("Galeón de Niebla", "galeon_niebla", "elementalista"), ("Osario Flotante", "barco_hueso", "demoledor"),
        ("Niebla Viva", "galeon_niebla", "calculador"), (None, "barco_hueso", "vengativo"), ("Costillar del Leviatán", "barco_hueso", "demoledor"),
        ("Muralla de Niebla", "galeon_niebla", "calculador"), ("Escolta del Almirante", "galeon_runas", "vengativo")],
}

# Encargos: etapas laterales opcionales con restricción de barco (CHARLA: barcos distintos para misiones distintas)
ERRANDS = [
    {"id": "enc_aguas_estrechas", "zone": 2, "afterStage": 3, "name": "Aguas Estrechas", "restriction": "Solo barcos de ≤4 tripulantes (Balsa o Gorrión).", "archetype": "torre_barco", "powerAsStage": 4, "reward": "Planos x2 + orbes x10 del gato MVP"},
    {"id": "enc_rescate", "zone": 2, "afterStage": 6, "name": "Rescate Gatuno", "restriction": "Solo puedes llevar 3 gatos.", "archetype": "galera_raices", "powerAsStage": 6, "reward": "Orbe Prisma x5"},
    {"id": "enc_diluvio", "zone": 3, "afterStage": 5, "name": "Diluvio Perpetuo", "restriction": "Todo está Mojado siempre: prohibido llevar gatos 🔥.", "archetype": "balandra_electrica", "powerAsStage": 6, "reward": "Cristales ⚡ x10 + Planos x2"},
    {"id": "enc_asedio_pesado", "zone": 4, "afterStage": 6, "name": "Asedio Pesado", "restriction": "Enemigo con armadura x2: se recomienda Bastión y armas pesadas (Mortero/Riel).", "archetype": "galeon_runas", "powerAsStage": 8, "reward": "Planos x4 + artefacto Ancla de Emergencia"},
    {"id": "enc_tormenta_arcana", "zone": 5, "afterStage": 3, "name": "Tormenta Arcana", "restriction": "Los escudos no-arcanos no funcionan (Bajel Arcano recomendado).", "archetype": "observatorio", "powerAsStage": 5, "reward": "Cristales ✨ x15 + Orbe Prisma x5"},
    {"id": "enc_saqueo", "zone": 5, "afterStage": 6, "name": "Saqueo Estelar", "restriction": "Solo Merodeador: cada módulo destruido suelta el doble de chatarra.", "archetype": "satelite", "powerAsStage": 7, "reward": "Chatarra x60 + Planos x3"},
    {"id": "enc_ultima_niebla", "zone": 6, "afterStage": 4, "name": "La Última Niebla", "restriction": "Sin vista previa de trayectoria (niebla total). Linterna Espíritu la ignora.", "archetype": "galeon_niebla", "powerAsStage": 6, "reward": "Fragmento del Vacío +1 (si aún no tienes 9) + gemas x2"}
]


# ---------------------------------------------------------------- Andanada automática (feedback del usuario)
VOLLEY = {
    "rule": "Al terminar el turno de un bando (después de que su gato disparó y se resolvieron las secuelas), todos sus cañones vivos disparan SOLOS, escalonados 120 ms, en el orden de proa a popa.",
    "target": "Objetivo de Andanada = la celda que golpeó el gato de ese turno. Si el gato falló o no disparó (aturdido), el módulo enemigo vivo más cercano a donde cayó su tiro; si no hubo tiro, el camarote enemigo más dañado. Todos los cañones apuntan ahí (fuego concentrado = el jugador 'dirige' la andanada con su gato).",
    "aim": "El ángulo se resuelve analíticamente (tiro tenso o bombeado según el tipo) con dispersión: σ ángulo = max(0.8°, 5° − 0.6°·Mk Arma); el viento sí afecta (excepto rayos). Los proyectiles atraviesan las celdas de su propio barco (sin fuego amigo).",
    "damage": "Daño interno del tipo de arma x f(S) (igual que los gatos, ver 2.9). Santabárbara viva: +25%. Cañón Enraizado, Congelado, Sellado o Embarrado: no dispara esa andanada.",
    "pace": "La andanada completa dura ≤ 1.2 s (cámara abierta mostrando ambos barcos). Mantener Espacio la acelera x4.",
    "enemy": "El enemigo hace exactamente lo mismo al final de su turno, apuntando a donde golpeó su gato.",
    "why": "El jugador solo elige QUÉ GATO dispara cada turno (y dónde). La construcción del barco (cuántos cañones, de qué tipo, dónde) pesa en cada turno sin agregar clics."
}

# ---------------------------------------------------------------- Arte de barcos: ilustraciones continuas que se rompen en trozos ilustrados
SHIP_ART = {
    "renderSpec": [
        "Cada barco es UNA ilustración continua estilo caricatura/anime de piratas (contorno de tinta grueso y variable, colores planos con 2 tonos de sombra, brillo especular, proporciones exageradas tipo juguete). Referencia de sensación: juegos móviles de piratas cartoon; nunca copiar diseños concretos.",
        "La ilustración se GENERA EN CÓDIGO a partir de la rejilla lógica: (1) contorno del casco = marching squares sobre las celdas + suavizado Chaikin x2 → curva orgánica (proa afilada, popa redondeada); (2) relleno por material del Mk del Casco con patrón (tablones, remaches, coral, constelaciones); (3) módulos dibujados encima como piezas de la misma ilustración (cañones asomando por troneras, camarotes con ventana redonda donde se ve al gato, mástil con velas de lona y bandera de facción, chimeneas, faroles); (4) detalles de facción (mascarón, banderines, parches).",
        "Se renderiza a una RenderTexture (cols x 34 px, rows x 34 px, x2 para nitidez) al entrar a la batalla. La rejilla lógica NO se ve: solo la ilustración.",
        "Destrucción: al morir una celda se 'muerde' la ilustración con una máscara de borde dentado (ruido) y en el borde aparece el INTERIOR del material (madera astillada clara, hierro con remaches rojos de calor, coral con brillo interno, hueso). Daño parcial: decals de grietas en 3 estados por celda (66/33/10% de vida).",
        "Trozos: cada componente desconectado por el BFS se recorta de la MISMA textura (sprite con máscara de sus celdas + borde dentado) y se vuelve cuerpo físico que gira, choca, salpica y se hunde. Así un barco se parte en pedazos que siguen siendo 'el mismo dibujo'.",
        "Retroceso: al disparar un gato o una andanada, el barco entero hace recoil (−8 px en X opuesto al tiro y 1.5° de inclinación, resorte que vuelve en 300 ms) además del balanceo por oleaje (senoidal, visual).",
        "Agua: el barco se dibuja con su línea de flotación cortada por una capa de agua frontal semitransparente (el prototipo ya tiene sea.frontLayer)."
    ],
    "hullSkinsByMk": [
        {"mk": [1, 2], "skin": "Madera de balsa → balandra barnizada (cafés cálidos, cuerdas, parches)."},
        {"mk": [3, 4], "skin": "Hierro remachado → galeón con ribetes dorados (gris azulado, dorado, ojos de buey)."},
        {"mk": [5, 6], "skin": "Coral arcano (rosa-turquesa con brillo interno; runas de foil en Mk VI)."},
        {"mk": [7], "skin": "GALEÓN NEÓN CÓSMICO: casco negro con líneas neón cian/magenta, velas de constelaciones que se mueven, estela de estrellas (adelanto del Arca Celestial)."}
    ],
    "playerShips": [
        {"id": "balsa", "look": "Balsa de tablones con una palmera chiquita, vela remendada con un calcetín, bandera de huellita."},
        {"id": "gorrion", "look": "Balandra afilada roja con franja crema, mascarón de gorrión-gato, vela triangular."},
        {"id": "merodeador", "look": "Bergantín pirata negro, bandera con calavera de gato y huesos de pescado, cofres en cubierta."},
        {"id": "bastion", "look": "Acorazado-fortaleza con torretas en forma de orejas de gato, chimeneas, placas gruesas."},
        {"id": "bajel", "look": "Galeón violeta con velas de pergamino escritas, faroles flotantes, casco con celdas de cristal brillante."}
    ],
    "enemyFactions": [
        {"id": "piratas_bahia", "zone": 1, "name": "Piratas de la Bahía Sardina", "palette": ["#8A5A2E", "#C99358", "#C8102E", "#EDE4D6"], "materials": "madera parchada", "silhouette": "botes, chalupas y pesqueros chuecos; velas con remiendos; bandera de sardina con parche", "chunks": "astillas claras, sardinas que saltan del interior", "boss": "La Sardina Furiosa (barriles de pólvora en cubierta)", "extra": "El Patito Pirata: casco con forma de patito de hule amarillo."},
        {"id": "guardia_piedra", "zone": 2, "name": "Guardia de Piedra", "palette": ["#6F6A5E", "#B9B2A0", "#4F8F4A", "#171317"], "materials": "piedra con musgo", "silhouette": "fortalezas flotantes y torres con almenas, gárgolas en las esquinas", "chunks": "bloques de piedra con musgo, polvo", "boss": "El Risco Flotante (gárgola enorme en la proa)"},
        {"id": "flota_kraken", "zone": 3, "name": "Flota del Kraken", "palette": ["#3569A3", "#172B35", "#FFD400", "#00E5FF"], "materials": "hierro mojado", "silhouette": "balandras de hierro con bobinas y pararrayos, cubiertas brillantes de agua", "chunks": "planchas de hierro con chispas", "boss": "Barco atrapado por tentáculos (los tentáculos son trozos independientes)"},
        {"id": "orden_arcanista", "zone": 4, "name": "Biblioteca Hundida del Arcanista", "palette": ["#231626", "#5C3D5B", "#8F6B93", "#B89558"], "materials": "cristal arcano + madera de estantería", "silhouette": "galeones-templo con estanterías, libros flotando, velas de pergamino", "chunks": "páginas sueltas que vuelan + cristales", "boss": "La Biblioteca Errante (grimorio gigante como núcleo)"},
        {"id": "cometas_errantes", "zone": 5, "name": "Cometas Errantes", "palette": ["#0D110F", "#FF2E88", "#00E5FF", "#8A5CFF"], "materials": "hierro + cristal neón", "silhouette": "GALEONES NEÓN CÓSMICOS, satélites con antenas, observatorios con cúpula", "chunks": "trozos con bordes neón que siguen brillando en el agua", "boss": "El Cometa (núcleo-estrella)"},
        {"id": "marea_sin_nombre", "zone": 6, "name": "La Marea Sin Nombre (flota de Distraxia)", "palette": ["#D9D4DE", "#413B44", "#8A5CFF", "#171317"], "materials": "hueso + madera podrida + niebla", "silhouette": "barcos de costillas, velas rasgadas, ojos que parpadean en el casco", "chunks": "huesos y niebla que se disipa", "boss": "El Leviatán Almirante (ballena-barco de hueso de 26x14)"},
        {"id": "bandera_negra", "zone": None, "name": "Bandera Negra (Velo Noctis)", "palette": ["#0D0B10", "#8C2BFF", "#D296FF", "#B89558"], "materials": "madera negra lacada + encaje", "silhouette": "bergantines elegantes con encaje morado, antifaces venecianos en la proa", "chunks": "astillas negras y plumas", "boss": "Buque insignia de Noctis (5.º barco del evento)"},
        {"id": "vacio", "zone": None, "name": "???", "palette": ["#000000", "#0D110F", "#FF2E88"], "materials": "void", "silhouette": "silueta de barco hecha de estática; no se ve su interior", "chunks": "no suelta trozos: las celdas se BORRAN (pixelado de transmisión)", "boss": "Barco del Vacío (nave de NADIE)"}
    ]
}
