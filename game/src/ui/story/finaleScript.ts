/**
 * EL ARCHIVO RASGADO — the end of the main story (state/sys/finale.ts). Played by app/story.ts:
 *   FINAL_INTRO  when H29 appears (the six grietas won)
 *   FINAL_OUTRO  when H29 is done (Distraxia beaten) → final credits → FINAL_EPILOGUE (H30)
 * Closes: "Él me lo pidió", what the Void Fragments were, Distraxia's fate and why Luzterna is dead.
 */
import type { Line } from '../dialog';

export const FINAL_INTRO: Line[] = [
  ['SISTEMA', '(Las seis grietas se abren a la vez. No hacia afuera: hacia arriba. Detrás no hay mares. Hay estantes.)'],
  ['LUZTERNA', 'Ahí está, {name}. El Archivo. Bueno, lo que queda de él: estantes rotos, cajas abiertas y una niebla que nunca se fue.'],
  ['DISTRAXIA', '¿Siguen juntando páginas? Qué terquedad. Todo lo que juntan, yo lo vuelvo a borrar. Él me lo pidió.'],
  ['NADIE', '…Yo no te pedí nada.'],
  ['DISTRAXIA', 'Lo dijiste. «A nadie le gustan los gatos.» Lo dijiste mil veces, en mil cajas vacías.'],
  ['NADIE', 'Era una queja. No una orden. Estaba solo. …Ya no.'],
  ['LUZTERNA', 'Por eso no se dicen cosas tristes en voz alta dentro de un archivo, Nadie: alguien las archiva.'],
  ['LUZTERNA', 'Y tus Fragmentos del Vacío, {name}, son pedazos de las cajas que ella borró. Cada uno que traigas la hace más chiquita. Tráelos todos.'],
  ['NOCTIS', 'Y yo traigo la bandera. No me miren así: ¿creían que me iba a perder el final?'],
  ['LUZTERNA', 'Toca la misión fijada. Es la última pelea de esta historia. …Y después te cuento por qué estoy muerta. Lo prometo.'],
];

export const FINAL_OUTRO: Line[] = [
  ['SISTEMA', '(La niebla no se rompe. Se deshace en hojas: miles de hojas con dibujos de gatos que vuelan de regreso a los estantes.)'],
  ['DISTRAXIA', '…¿Por qué me recuerdan? Yo soy lo olvidado.'],
  ['LUZTERNA', 'Porque eso hace un archivo, tonta. Recuerda. Hasta a ti.'],
  ['SISTEMA', '(Distraxia se vuelve una página en blanco. Algún día alguien va a dibujar algo bonito en ella.)'],
  ['LUZTERNA', 'Ok. Te lo debo. ¿Por qué estoy muerta?'],
  ['LUZTERNA', 'Cuando Distraxia rasgó el Archivo, yo era la farera. Las páginas caían a oscuras y se perdían en el mar. Así que me quedé arriba con la linterna, para que vieran por dónde caer.'],
  ['LUZTERNA', 'Me quedé tanto que se me olvidó bajar. «Mantén… y suelta», ¿te acuerdas? Yo nunca solté.'],
  ['LUZTERNA', 'Y tú, {name}, juntaste cada página que yo alumbré. Una por una. Con croquetas.'],
  ['SISTEMA', '(Luzterna mira su linterna un largo rato. Luego la cuelga en el faro de tu isla.)'],
  ['LUZTERNA', 'Listo. Ya solté. …No, no me voy a ningún lado. ¿Quién te va a decir todo lo que haces mal? Me quedo de farera. De tu faro.'],
  ['NADIE', 'A Nadie le gustan los gatos.'],
  ['TUS GATOS', '(todos a la vez) …Mentira.'],
  ['NADIE', '…Mentira.'],
  ['PERIÓDICO', '¡EXTRA! ¡EXTRA! EL ARCHIVO REABRE SUS PUERTAS: «FUERON LOS GATOS», CONFIESA NADIE'],
];

export const FINAL_EPILOGUE: Line[] = [
  ['LUZTERNA', 'Fin de la historia, {name}. De ESTA historia. El Archivo tiene infinitas cajas, y tu isla sigue ronroneando.'],
  ['LUZTERNA', 'El Podio, el casino, las islas, los gatos que te faltan… todo sigue aquí. Y si alguien abre otra caja, aquí voy a estar. Con la linterna prendida.'],
  ['CAPTION', 'FIN. (Por ahora. Los gatos nunca terminan nada: solo se duermen encima.)'],
];
