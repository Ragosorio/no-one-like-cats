/**
 * Pop-reference chatter: lines built for the "AHHH, entendí la referencia" moment, always bent
 * through cat life (cajas, atún, aspiradora, pepinos, tirar cosas de la mesa, siestas, 3 a.m.).
 * Movies/books/games use short iconic lines parodied; songs are referenced by TITLE only (no lyrics).
 * Same house rules as data/chatter.ts: irreverent, never about atrocities or ethnic/religious groups.
 * Tokens: {name} player, {g:m|f|x}, {cat} speaking cat.
 */
import type { ChatterLine } from '../../data/chatter';

export type PopSource = 'cine' | 'libro' | 'musica' | 'juego';
export interface PopLine extends ChatterLine {
  src: PopSource;
  /** prefer these painting slugs (a cat that "fits" the reference) */
  slugs?: string[];
}

const L = (src: PopSource, a: string, b?: string, extra: Partial<PopLine> = {}): PopLine => ({ tag: 'pop', src, a, b, ...extra });

export const POP_REFS: PopLine[] = [
  // ---------------------------------------------------------------- 🎬 cine
  // Harry Potter
  L('cine', '¿Después de todo este tiempo?', 'Siempre… que haya atún.', { slugs: ['candy_alchemist_cat', 'storybook_ink_cat'] }),
  L('cine', 'Juro solemnemente que mis intenciones no son buenas.', '*tira un vaso de la mesa mirándote a los ojos*'),
  L('cine', 'Travesura realizada.', 'El sofá ya tiene flecos nuevos. De nada.'),
  L('cine', '{cat} es un elfo libre.', 'Bueno, con collar. Libre-ish.'),
  L('cine', '¿Por qué arañas? ¿Por qué no podía ser seguir mariposas?', 'Yo sí sigo mariposas. Es mi trabajo de tiempo completo.'),
  L('cine', 'No son nuestras habilidades las que muestran quiénes somos…', '…sino nuestras siestas. Y yo elijo dormir.'),
  L('cine', 'Avada Ke-MIAU-vra.', '…el pepino sigue ahí. Le tengo miedo igual.', { slugs: ['candy_alchemist_cat', 'masquerade_phantom_cat'] }),
  L('cine', 'No debes nombrarla… a la que hace ruido.', 'La aspiradora. AAAH. La nombré. Ya viene.'),
  // Star Wars
  L('cine', 'Que el Ronroneo te acompañe, {name}.', 'Y que el atún también. Amén… digo, miau.', { slugs: ['regal_cosmic_cat', 'alien_galaxy_cat'] }),
  L('cine', 'Tengo un mal presentimiento sobre esto.', 'Huele a baño de agua tibia.'),
  L('cine', 'Hazlo o no lo hagas. No hay intento.', '…decidí no hacerlo. Siesta.'),
  L('cine', 'Hola.', 'General Kenobi. *se lame la pata con desdén*'),
  L('cine', 'Tengo el terreno elevado.', 'Es el refrigerador. Nadie me baja de aquí.'),
  L('cine', 'No subestimes el poder del Lado Oscuro…', '…de debajo de la cama. Ahí vivo ahora.'),
  L('cine', '*mueve la pata* Estos no son los gatos que están buscando.', '…siga su camino, señor perro.'),
  L('cine', 'Una sorpresa, sin duda, pero bienvenida.', 'Lo dije de la lata de atún. Siempre lo digo de la lata.'),
  // Marvel
  L('cine', 'Yo… soy Iron Cat.', '*intenta chasquear los dedos* …no tengo pulgares. Mal plan.', { slugs: ['mecha_neon_cat', 'steampunk_clockwork_cat'] }),
  L('cine', 'Soy inevitable.', '…como el pelo en tu ropa negra.'),
  L('cine', 'Vengadores… ¡unidos!', '…a la hora de la comida. Ni un minuto antes.'),
  L('cine', 'Te quiero 3000, {name}.', '…sardinas. Te quiero 3000 sardinas.'),
  L('cine', 'Podría hacer esto todo el día.', 'Dormir, digo. Podría dormir todo el día. Lo hago.'),
  L('cine', 'Nosotros tenemos un Hulk.', 'Y yo tengo una bola de pelo. Gana la bola.'),
  L('cine', 'Perfectamente equilibrado, como todo debería estar.', '*tira la mitad de las cosas del estante*'),
  L('cine', 'Bien. Lo haré yo mismo.', '*abre la bolsa de croquetas con los dientes*'),
  L('cine', '¡Wakanda por siempre!', '*cruza las patitas* …no me salen los brazos así.'),
  L('cine', '¿Qué es el dolor, sino amor perseverando?', 'Lo dice mi pata después de pisar un Lego.'),
  // El Señor de los Anillos
  L('cine', 'Mi preciosooo.', '…es una tapa de botella. Pero es MÍA.'),
  L('cine', 'Uno no entra simplemente caminando a Mordor.', 'Ni al veterinario. Ahí te llevan en jaula.'),
  L('cine', '¿Y qué hay del segundo desayuno?', '¿Y el tercero? ¿Y la merienda de las 11? ¿Y la de las 11:15?'),
  L('cine', 'Tienes mis garras.', '…y mi siesta. Y mi plato. ¡Y MI CAJA!'),
  L('cine', '¡Por Frodo!', '*se lanza contra la cortina*'),
  // Batman / DC
  L('cine', 'Soy Batman.', 'Bat-gato. Gatman. …no, no suena igual de cool.', { slugs: ['nori_lunar_cat', 'masquerade_phantom_cat'] }),
  L('cine', 'Algunos gatos solo quieren ver arder el mundo.', '…o tirar tu taza al piso. Casi lo mismo.'),
  L('cine', 'O mueres como héroe, o vives lo suficiente…', '…para ver cómo te compran una aspiradora robot.'),
  L('cine', 'La noche es más oscura justo antes del amanecer.', 'Y a las 3 a.m. empiezan mis zoomies.'),
  L('cine', '¿Alguna vez bailaste con el diablo bajo la luna pálida?', 'Yo sí. Era una polilla. La atrapé.'),
  // Terminator / Titanic / Padrino / Forrest
  L('cine', 'Volveré.', '…cuando suene una lata abriéndose.'),
  L('cine', '¡Soy el rey del mundo!', '*desde la punta del refrigerador, sin plan para bajar*'),
  L('cine', 'Dibújame como a uno de tus gatos franceses.', 'Con boina. Y baguette. Y desdén.', { slugs: ['storybook_ink_cat', 'sonata_prima_cat'] }),
  L('cine', 'Nunca te soltaré.', '…le dije al cojín. Y lo cumplí.'),
  L('cine', 'Le haré una oferta que no podrá rechazar.', 'Ronroneo a cambio de atún. Trato cerrado.'),
  L('cine', 'Mantén cerca a tus amigos…', '…y aún más cerca tu plato de comida.'),
  L('cine', 'La vida es como una caja de chocolates.', 'Los gatos no comemos chocolate. Mi vida es como una caja. Y ya. Me encanta.'),
  L('cine', '¡Corre, Forrest, corre!', '…¡corre, {cat}, que viene el baño!'),
  // Matrix / Toy Story / Shrek
  L('cine', '¿Pastilla roja o pastilla azul?', 'Ninguna. El veterinario me las esconde en jamón. Y funciona.', { slugs: ['neon_glitch_cat', 'bytewhisker_cat'] }),
  L('cine', 'No hay cuchara.', '…tampoco hay atún. Este mundo es una mentira.', { slugs: ['neon_glitch_cat', 'bytewhisker_cat'] }),
  L('cine', 'Bienvenido al mundo real, {name}.', '*te muestra el plato vacío*'),
  L('cine', '¡Hay una serpiente en mi bota!', '…era mi cola. Perdón. Falsa alarma.'),
  L('cine', '¡TÚ ERES UN JUGUETE!', 'Le grité al ratón de juguete. Se ofendió.'),
  L('cine', '¿Qué haces en mi pantano?', '…en mi caja. ¿Qué haces en MI caja?', { slugs: ['menta_botanical_cat', 'mushroom_druid_cat'] }),
  L('cine', 'Los gatos somos como las cebollas.', 'Tenemos capas. Y te hacemos llorar cuando nos vamos.'),
  L('cine', 'Algunos de ustedes morirán… de ternura.', 'Es un sacrificio que estoy dispuesto a aceptar.'),
  L('cine', 'El Gato con Botas me copió los ojitos.', '…o yo se los copié a él. Da igual: funcionan.'),
  // Jurassic Park / Hunger Games / Mean Girls
  L('cine', 'La vida se abre camino.', '…igual que yo hacia la cocina.', { slugs: ['fossilstone_guardian_cat'] }),
  L('cine', 'Gato listo.', '*abre la puerta con la pata y te mira fijamente*'),
  L('cine', 'Que la suerte esté siempre de su lado.', '…y el atún también. Sobre todo el atún.'),
  L('cine', '¡Me ofrezco como tributo!', '…para probar la comida nueva. Por el equipo.'),
  L('cine', 'Recuerda quién es el verdadero enemigo.', 'La aspiradora. Siempre fue la aspiradora.'),
  L('cine', 'Los miércoles vestimos de rosa.', 'Yo visto de pelo. Todos los días. En tu ropa.', { slugs: ['sakura_whisper_cat', 'candy_alchemist_cat'] }),
  L('cine', 'Deja de intentar que el "fetch" pase.', 'Los gatos no hacemos fetch. Eso es de perros. Qué asco.'),
  L('cine', 'Ella ni siquiera vive en esta isla.', '…es la gaviota. Se come MIS sobras.'),

  // ---------------------------------------------------------------- 📚 libros
  L('libro', 'No sirve de nada vivir soñando y olvidarse de vivir.', '…dijo alguien que nunca durmió 16 horas. Se pueden las dos.', { slugs: ['storybook_ink_cat'] }),
  L('libro', 'El miedo a un nombre aumenta el miedo a la cosa misma.', 'Por eso le digo "la ruidosa". No la invoquen.'),
  L('libro', 'No todos los que vagan están perdidos.', 'Yo sí. ¿Dónde está mi caja? ¿Quién movió mi caja?'),
  L('libro', 'Todo lo que debemos decidir es qué hacer con el tiempo que se nos ha dado.', 'Dormir. Ya decidí. Siguiente pregunta.'),
  L('libro', 'Lo esencial es invisible a los ojos.', 'Como el atún que escondí. No lo busques.', { slugs: ['sol_sunbeam_cat', 'nube_dream_cat'] }),
  L('libro', 'Fue el tiempo que perdiste con tu rosa…', '…tiré la rosa del florero. Perdón. Fue sin querer queriendo.'),
  L('libro', 'Todas las personas mayores fueron primero gatitos.', 'Bueno, no todas. Pero deberían.'),
  L('libro', 'El lenguaje es fuente de malentendidos.', 'Por eso solo digo miau. Cero malentendidos. Bueno, casi.'),
  L('libro', 'Aquí todos estamos locos.', 'Lo dijo el Gato de Cheshire. Mi primo. Sonríe raro.', { slugs: ['masquerade_phantom_cat', 'storybook_ink_cat'] }),
  L('libro', '¿Quién diablos soy? Ese es el gran enigma.', 'Soy el que se acuesta en tu teclado. Mucho gusto.'),
  L('libro', 'Cada vez más curioso…', 'La curiosidad no mató a este gato. Solo lo asustó un pepino.'),
  L('libro', 'Empieza por el principio.', '…el principio es el desayuno. Siempre.'),
  L('libro', 'El Gran Hermano te vigila.', 'Soy yo. Desde arriba del armario. A las 3 a.m.'),
  L('libro', 'La guerra es paz. La libertad es esclavitud.', 'La siesta es fuerza. Eso sí lo firmo.'),
  L('libro', 'Dos más dos son cinco.', '…croquetas. Cuento mal cuando tengo hambre.'),
  L('libro', '¡Está vivo! ¡ESTÁ VIVOOO!', '…era una pelusa. Pero se movió. Lo juro.'),
  L('libro', 'Elemental, mi querido {name}.', 'El culpable del vaso roto es… el viento. Caso cerrado.'),
  L('libro', 'En un lugar de La Mancha, de cuyo nombre no quiero acordarme…', '…dejé una bola de pelo. Suerte buscándola.', { slugs: ['storybook_ink_cat'] }),
  L('libro', 'Ladran, Sancho…', '…señal de que me vieron en la ventana. Ja.'),
  L('libro', 'No debo temer. El miedo es el asesino de la mente.', 'Por eso me esponjo cuando veo un pepino. Es estrategia.'),
  L('libro', 'El que controla la especia controla el universo.', 'El que controla la LATA controla la isla.'),
  L('libro', 'Valar Morghulis.', 'Valar Dormilis: todos los gatos deben dormir.'),
  L('libro', 'Un gato siempre paga sus deudas.', '…en pelos. Pago en pelos.'),
  L('libro', 'Cuando juegas al juego de tronos, ganas o mueres.', 'Cuando juegas al juego de cajas, gano yo. Siempre.'),

  // ---------------------------------------------------------------- 🎤 música (títulos, cero letras)
  L('musica', 'Estoy en mi era…', '…de siesta. The Eras Tour: Edición Sofá.'),
  L('musica', 'Puse "Anti-Hero" y me sentí atacado.', '…el jarrón roto sí fui yo. Pero con estilo.'),
  L('musica', '"Shake It Off": así me sacudo cuando salgo del agua.', '*te salpica todo*'),
  L('musica', '"We Are Never Ever Getting Back Together", le dije al baño de agua tibia.', 'Nunca. Jamás. Ni aunque haya premio.'),
  L('musica', '¿Mi energía hoy? "Espresso".', 'Y no he tomado café. Es mi naturaleza a las 3 a.m.'),
  L('musica', '"Please Please Please"…', '…ábreme la lata. Te lo pido tres veces.'),
  L('musica', 'Soy el "bad guy" de esta isla.', '*tira algo de la mesa sin dejar de mirarte*', { slugs: ['nori_lunar_cat', 'molten_ember_cat'] }),
  L('musica', '"What Was I Made For?"', 'Para tirar cosas de la mesa. Obvio. Ya lo resolví.'),
  L('musica', '"Birds of a Feather"…', '…yo no me junto con pájaros. Yo los persigo.'),
  L('musica', '"thank u, next", le dije al plato de comida de dieta.', 'Siguiente. El de atún, por favor.'),
  L('musica', 'Tengo siete cascabeles. Como "7 rings".', '…pero con más ruido. Y a las 4 a.m.', { slugs: ['mochi_bell_cat'] }),
  L('musica', '"Born This Way": nací así de esponjoso.', 'No es pelo de más. Es identidad.', { slugs: ['nube_dream_cat', 'canelo_cozy_cat'] }),
  L('musica', '"Poker Face": así miro cuando rompo algo.', '…¿qué florero? Yo no vi ningún florero.'),
  L('musica', 'Lo mío con la aspiradora es un "Bad Romance".', 'Me odia, la odio, y aun así la miro.'),
  L('musica', '"good 4 u"… que tienes el plato lleno.', 'Yo aquí, sufriendo. Con el plato a la mitad.'),
  L('musica', 'No tengo "drivers license".', '…pero manejo tu aspiradora robot. Me lleva a todos lados.'),
  L('musica', '"Good Luck, Babe!", le dije al pez antes de atraparlo.', 'No tuvo suerte. Ñam.'),
  L('musica', '"HOT TO GO!": así me pongo en la ventana al sol.', '*se estira en la línea de sol como si fuera playa*', { slugs: ['sol_sunbeam_cat', 'molten_ember_cat'] }),
  L('musica', 'Bienvenidos al "Pink Pony Club".', 'Versión gato: el Pink Kitty Club. Sakura es la presidenta.', { slugs: ['sakura_whisper_cat'] }),
  L('musica', '"New Rules". Una: no toques mi caja.', 'Dos: no toques mi caja. Tres: ya sabes.'),
  L('musica', '"Levitating": así quedo cuando veo un pepino.', '*salto vertical de dos metros*'),
  L('musica', '"Blinding Lights": así me deja el láser rojo.', '¿Dónde está? ¿DÓNDE ESTÁ? Lo voy a atrapar.'),
  L('musica', '"Can\'t Feel My Face"…', '…después de meter la cabeza en la caja de cereal.'),
  L('musica', '"Save Your Tears"…', '…para cuando se acabe el atún. Ese día lloramos todos.'),
  L('musica', '"Yo Perreo Sola"…', '…digo, yo GATEO sola. Nadie me acompaña. Así me gusta.'),
  L('musica', '"Tití Me Preguntó"…', '…y le dije que mi único amor es el atún.'),
  L('musica', '"Me Porto Bonito"…', '…cuando hay comida. El resto del día, caos.'),
  L('musica', '"Un Verano Sin Ti", le dije a la cobija.', 'Mentira. La amo. Vuelve.'),
  L('musica', '"DtMF"… debí tirar más fotos…', '…de mí durmiendo. Ya tengo 40 mil. Faltan.'),
  L('musica', '"APT."', '…es la caja. La caja es mi APT. No se acerquen.'),
  L('musica', 'Estoy en mi era "brat".', 'Verde neón, cero modales y tiro tus cosas.', { slugs: ['alien_galaxy_cat', 'menta_botanical_cat'] }),

  // ---------------------------------------------------------------- 🎮 videojuegos
  L('juego', '¡It\'s-a me, MIAU-rio!', '¡Wahoo! …digo, ¡MIAU-hoo!'),
  L('juego', 'Gracias, gato, pero tu atún está en otro castillo.', '…otra vez. Ya van ocho castillos.'),
  L('juego', '¡Es peligroso ir solo! Toma esto.', '*te deja un ratón de juguete en los pies*'),
  L('juego', '¡Hey! ¡Escucha!', '…nadie me escucha. Ahora entiendo a Navi.'),
  L('juego', '*Hyaaah!*', '…ese fue mi grito de batalla contra la cortina.'),
  L('juego', 'Psssss…', '…ah, no era un creeper. Era otro gato verde. Aw man.', { slugs: ['alien_galaxy_cat', 'cyber_bloom_cat'] }),
  L('juego', 'Nunca caves directo hacia abajo.', 'Lo aprendí en la caja de arena. A la mala.'),
  L('juego', 'Herobrine existe.', '…lo vi. Era el gato blanco de la otra isla. Da miedo.'),
  L('juego', 'Ah, mierda. Aquí vamos otra vez.', '*ve el transportín del veterinario*'),
  L('juego', 'Todo lo que teníamos que hacer era seguir el maldito láser, CJ.', '…y lo perdimos. Otra vez.'),
  L('juego', 'Antes era aventurero como tú…', '…hasta que me dieron una croqueta en la rodilla. Ahora soy de sofá.'),
  L('juego', '¡FUS RO MIAU!', '*el vaso sale volando de la mesa*', { el: ['storm'] }),
  L('juego', 'El pastel es una mentira.', 'El atún no. El atún es real. Exijo atún.', { slugs: ['bytewhisker_cat', 'lumen_lens_cat'] }),
  L('juego', 'Por la ciencia.', '*empuja el vaso hasta el borde, despacito, para ver si cae*'),
  L('juego', 'La guerra. La guerra nunca cambia.', 'La hora de comer tampoco: 5 a.m. Sin excepción.'),
  L('juego', 'Necesito un arma.', '…ah, mis garras. Ya tenía. Siempre tuve.', { slugs: ['mecha_neon_cat'] }),
  L('juego', 'Para ser un ladrillo, voló bastante bien.', 'Lo dije del control remoto que tiré del sillón.'),
  L('juego', '¡FINISH HIM!', '*le da el zarpazo final al cojín*'),
  L('juego', '¡GET OVER HERE!', '…le dije a la pelota que se metió bajo el sofá.'),
  L('juego', '¡FATALITY!', '…para la planta del salón. Descanse en pétalos.'),
  L('juego', '¡Un gato salvaje apareció!', '¡Usa Ronroneo! ¡Es súper efectivo!'),
  L('juego', '¡Tengo que atraparlos a todos!', '…a los ratones de juguete. Llevo doce. Y un calcetín.'),
  L('juego', '¡Pikachu, yo te elijo!', '…no hay Pikachu. Bueno: ¡{cat}, yo me elijo!', { el: ['storm'] }),
  L('juego', 'Bienvenido a la familia, hijo.', '…le dije al gatito nuevo. Se asustó. Bien.'),
  L('juego', 'Jill Sandwich.', '¿Alguien dijo sándwich? ¿De atún?'),
  L('juego', 'Muchacho.', '…tráeme atún, muchacho. BOY.', { slugs: ['fossilstone_guardian_cat', 'molten_ember_cat'] }),
  L('juego', 'No te arrepientas. Sé mejor.', '…mañana tiro el vaso con más estilo.'),
  L('juego', 'HAS MUERTO.', '…de sueño. Ya desperté. Todo bien.', { slugs: ['nori_lunar_cat', 'lantern_spirit_cat'] }),
  L('juego', '¡Alaba al Sol!', '*se acuesta en el rayito de sol que entra por la ventana*', { slugs: ['sol_sunbeam_cat'] }),
  L('juego', 'No te vuelvas hueco.', '…sin comida me vuelvo hueco. Es tu responsabilidad, {name}.'),
  L('juego', 'Nada es verdad. Todo está permitido.', '…incluido subirme a la mesa. ESPECIALMENTE eso.'),
  L('juego', '*salto de fe*', '…a la cama. Desde el ropero. Aterricé en tu cara.'),
  L('juego', 'Presiona F para presentar respetos.', 'F por el vaso que tiré. Era bonito.'),
  // por elemento
  L('cine', '¡Dracarys!', '…solo prendí una vela. Ya. No llamen a los bomberos.', { el: ['fire'] }),
  L('cine', 'Sigue nadando, sigue nadando…', '…ah, no, odio nadar. Me equivoqué de película.', { el: ['water'] }),
  L('cine', 'Yo soy Groot… digo, yo soy gato.', 'Pero también hablo con las plantas. Me contestan.', { el: ['nature'] }),
  L('juego', 'Impactrueno… pero de estática.', '*toca tu nariz* ¡ZAP! Perdón. No tanto.', { el: ['storm'] }),
  L('cine', 'Al infinito y más allá… de esta galaxia.', 'Ya fui. Había atún de nebulosa. Rico.', { el: ['cosmic'] }),
  L('libro', 'Wingardium Leviosa… a la croqueta.', 'No flota. Me la como en el piso entonces.', { el: ['magic'] }),
];

/** quick replies from other cats when somebody drops a reference */
export const POP_REACTIONS = ['¡ENTENDÍ LA REFERENCIA!', 'CLÁSICO', 'ICÓNICO', 'ME LA SÉ', '¿DE QUÉ ES?', 'BOOMER', '*aplaude*', 'PELICULÓN', 'TEMAZO', 'LORE'];

let recent: number[] = [];
/** a reference for this cat: matching slug/element lines weigh more; avoids the last ~24 */
export function pickPopRef(els: string[], slug?: string, rnd: () => number = Math.random): PopLine {
  const pool = POP_REFS.map((l, i) => ({ l, i })).filter(({ l, i }) => (!l.el || l.el.some((e) => els.includes(e))) && !recent.includes(i));
  const w = pool.map(({ l }) => (slug && l.slugs?.includes(slug) ? 4 : l.el ? 2.5 : 1));
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  let k = 0;
  for (; k < pool.length - 1; k++) {
    r -= w[k];
    if (r <= 0) break;
  }
  const pick = pool[k] ?? { l: POP_REFS[0], i: 0 };
  recent = [...recent.slice(-23), pick.i];
  return pick.l;
}
