/**
 * Who waits at the edge: Bisagra at the door's hinge (until she leaves with you, H63); the Correctores' cats in
 * a perfect row on the west beach, purring all at the same time (H62–H63); two Disruptores by their rift ship,
 * one of them spraying (H63).
 */
import * as THREE from 'three';
import type { RegionCtx } from '../types';
import type { PaperCat } from '../../engine/world/paperCat';
import { addSkyCat } from '../cielo/cats';
import { DOOR, RIFT, ROW, height } from './layout';

const at = (x: number, z: number) => new THREE.Vector3(x, height(x, z), z);

export interface UmbralResidents {
  bisagra: PaperCat | null;
  row: PaperCat[];
  grafitera: PaperCat | null;
  update(dt: number, t: number, night: number): void;
}

export async function residents(ctx: RegionCtx, o: { bisagra: boolean; correctores: boolean; disruptores: boolean }): Promise<UmbralResidents> {
  const w = ctx.world;
  let bisagra: PaperCat | null = null;
  if (o.bisagra) {
    bisagra = await addSkyCat(ctx, {
      id: 'umb_bisagra',
      species: 'l_bisagra',
      home: at(DOOR.x - DOOR.w / 2 - 2.4, DOOR.z + 2.6),
      h: 8,
      acts: 'calm',
      alive: false,
      tags: ['umbral'],
      title: 'Bisagra · la que guarda la puerta',
      here: 'Lleva tanto tiempo entre un lado y el otro que ya no sabe cuál es adentro. Rechina cuando alguien pasa, rechina cuando nadie pasa y, según ella, rechina «por si las dudas».',
    });
    if (bisagra) bisagra.facing = 1;
  }
  const row: PaperCat[] = [];
  if (o.correctores) {
    const species = ['r_ronron', 'r_espejito', 'r_farolillo', 'r_espejito', 'r_ronron'];
    const cats = await Promise.all(
      species.slice(0, ROW.n).map((sp, i) =>
        addSkyCat(ctx, {
          id: `umb_corr_${i}`,
          species: sp,
          home: at(ROW.x, ROW.z0 - i * ROW.step),
          acts: 'none',
          alive: false,
          tags: ['umbral', 'corrector'],
          title: 'Un gato corregido',
          here: 'Ronronea. Todo el tiempo. Al mismo tiempo que los otros cuatro. Mira hacia el mismo lado que los otros cuatro. Si le preguntas si está bien, ronronea más fuerte.',
        }),
      ),
    );
    for (const c of cats)
      if (c) {
        c.facing = -1;
        c.brain.energy = 0.25;
        c.flash('#ffffff', 0.35);
        row.push(c);
      }
  }
  let grafitera: PaperCat | null = null;
  if (o.disruptores) {
    const [g] = await Promise.all([
      addSkyCat(ctx, { id: 'umb_grafitera', species: 'r_grafitera', home: at(RIFT.x - 18, RIFT.z + 14), acts: 'calm', alive: false, tags: ['umbral'], here: 'Pinta el cielo con aerosol. Dice que si nadie lo firma, el cielo es de todos. Y si alguien lo firma, también: por eso firma ella.' }),
      addSkyCat(ctx, { id: 'umb_brecha', species: 'e_brecha', home: at(RIFT.x - 22, RIFT.z + 18), tags: ['umbral'], here: 'Pirata de grieta. Trae una barreta «para abrir cajas». Todas las cajas. Incluidas las de cereal, las del correo y la tuya.' }),
    ]);
    grafitera = g;
    if (grafitera) grafitera.facing = 1;
  }
  let purrT = 1;
  let sprayT = 0;
  return {
    bisagra,
    row,
    grafitera,
    update(dt) {
      // the row purrs in unison: the same little shiver at the same instant (unsettling, on purpose)
      purrT -= dt;
      if (purrT <= 0) {
        purrT = 2.4;
        for (const c of row) c.brain.emote('happy', 0.35);
      }
      if (grafitera) {
        sprayT -= dt;
        if (sprayT <= 0) {
          sprayT = 0.12;
          const p = grafitera.root.position;
          w.pools.sparks.emit({ pos: { x: p.x + 1.2, y: p.y + 2.2, z: p.z - 0.5 }, vel: { x: 3, y: 1.6, z: -2 }, velJitter: { x: 0.8, y: 0.6, z: 0.8 }, life: 0.7, size: 0.3, color: Math.random() < 0.5 ? '#ff3ad0' : '#4ff2ff', color2: '#ffffff', count: 3 });
        }
      }
    },
  };
}
