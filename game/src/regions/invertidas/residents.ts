/**
 * Who lives on the Islas Invertidas: the Gravedad family of Oleada 2 (Plomito snoring like an anvil,
 * Cascada by the up-fall, Manzanita under her grove; drawn with stand-in paintings until their art
 * lands) and three neighbors from the Primer Mar who came up and stayed. Two are special:
 *  - Globito floats over the meadow tied to a rock (the rope is real; the rock likes him now)
 *  - Contrapeso sits on the grass side of the third islet — upside down, until you flip it
 * And at night only, REGISTRO 000 on the up-pointing tip of a far inverted islet — gone when you
 * come close.
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import { catLiteUrl } from '../../art/catArt';
import { addSkyCat, type SkyCat } from '../cielo/cats';
import { ANCHOR, height } from './layout';
import { withRegistroEstado } from '../../state/sys/gaterasWorld';

const at = (x: number, z: number) => new THREE.Vector3(x, height(x, z), z);

export interface InvResidents {
  globito: PaperCat | null;
  contrapeso: PaperCat | null;
  registro: PaperCat | null;
  regHome: THREE.Vector3;
  /** Globito's rock (the rope's ground end) */
  anchor: THREE.Vector3;
  update(dt: number, t: number, night: number): void;
}

export async function residents(ctx: RegionCtx, perch: THREE.Vector3): Promise<InvResidents> {
  const w = ctx.world;
  const list: SkyCat[] = [
    { id: 'inv_plomito', species: 'c_plomito', home: at(-11, 12), here: 'Duerme junto al anillo de columnas. Ronca tan fuerte que las columnas se acomodan solas.' },
    { id: 'inv_cascada', species: 'e_cascada', home: at(13, -19), here: 'Vigila la Cascada al Revés. Jura que el cielo es el piso. Nadie le gana una discusión: nadie sabe hacia dónde caerse.' },
    { id: 'inv_manzanita', species: 's_manzanita', home: at(6, 9), here: 'Se sienta bajo los árboles a esperar que algo le caiga hacia arriba. Hoy van tres manzanas y un pájaro.' },
    { id: 'inv_iman', species: 'r_iman', home: at(-12, -17), here: 'Bajó (subió) del Primer Mar a calibrar las piedras de gravedad con una llave inglesa. Ninguna piedra se lo pidió.' },
    { id: 'inv_burbujas', species: 'c_burbujas', home: at(-2, 1), here: 'Sopla burbujas en el estanque. Caen hacia arriba. Él no lo entiende y tú tampoco.' },
    { id: 'inv_raiz', species: 'r_raizvieja', home: at(-20, 18), here: 'Le habla a los árboles que cuelgan. Dice que están de cabeza «por moda».' },
  ];
  await Promise.all(list.map((c) => addSkyCat(ctx, { ...c, tags: ['invertidas'] })));

  // Globito: floats over the meadow on a rope tied to a rock (not walked by the director)
  const anchor = at(ANCHOR.x, ANCHOR.z).add(new THREE.Vector3(0, 0.9, 0));
  const globito = await addSkyCat(ctx, { id: 'inv_globito', species: 'c_globito', home: anchor.clone(), acts: 'calm', alive: false, here: 'Lo amarraron a esta piedra para que el viento no se lo lleve. La piedra ya le cae bien. Él a la piedra, no tanto.' });
  // Contrapeso: on the third islet, upside down while it hangs (the region carries him with it)
  const contrapeso = await addSkyCat(ctx, { id: 'inv_contrapeso', species: 'r_contrapeso', home: new THREE.Vector3(0, -50, 0), acts: 'calm', alive: false, here: 'Lleva trescientos años sentado del lado correcto de este islote. Si lo volteas, el lado correcto será el de arriba. Se va a ofender igual.' });
  for (const c of [contrapeso]) {
    if (!c) continue;
    c.shadowAllowed = false;
    c.shadow.visible = false;
    c.blob.visible = false;
  }
  // REGISTRO 000: night only, on the far islet's tip
  const regHome = perch.clone();
  const registro = await w.addResident({ id: 'registro000', name: 'REGISTRO 000', slug: 'nadie_static_cat', url: catLiteUrl('nadie_static_cat'), height: 2.4, home: regHome, tags: [], acts: 'none', alive: false });
  if (registro) {
    registro.ghost = 1;
    registro.shadowAllowed = false;
    registro.shadow.visible = false;
    registro.blob.visible = false;
    registro.root.visible = false;
    registro.facing = 1;
  }
  ctx.describe.set('registro000', { title: 'REGISTRO 000 · FOLIO 000', text: withRegistroEstado('Especie: desconocida · Elemento: ninguno · Rareza: no aplica · Estado: observando.\n\nSentado en la punta de un islote al revés, mirando hacia abajo. Hacia el mar. Hacia tu isla. Cuando te acercas, ya no está.') });

  let flick = 0;
  const tmp = new THREE.Vector3();
  return {
    globito,
    contrapeso,
    registro,
    regHome,
    anchor,
    update(dt, t, night) {
      // Globito drifts on his rope with the wind
      if (globito) {
        const wx = Math.sin(t * 0.31) * 1.6 + Math.sin(t * 0.83) * 0.4;
        const wz = Math.cos(t * 0.27) * 1.1;
        const g = height(anchor.x + wx, anchor.z + wz);
        globito.root.position.set(anchor.x + wx, g, anchor.z + wz);
        globito.ground = g;
        globito.lift = anchor.y + 3.1 + Math.sin(t * 1.1) * 0.35 - g;
        const right = tmp.setFromMatrixColumn(w.camera.matrixWorld, 0);
        globito.facing = Math.cos(t * 0.31) * right.x - Math.sin(t * 0.27) * right.z >= 0 ? 1 : -1;
        globito.brain.wind = Math.sin(t * 0.5) * 0.6;
      }
      // REGISTRO 000: vanishes when the camera gets close (a short static flicker on the way)
      if (registro) {
        const far = w.camera.position.distanceTo(regHome) > 22;
        const want = night > 0.6 && far && w.weather.rain < 0.35;
        if (want !== registro.root.visible) {
          flick += dt;
          if (!want || flick > 0.3) {
            registro.root.visible = want;
            flick = 0;
          } else registro.root.visible = Math.sin(t * 60) > 0;
        }
        registro.shadow.visible = false;
        registro.brain.look = -0.6;
      }
    },
  };
}
