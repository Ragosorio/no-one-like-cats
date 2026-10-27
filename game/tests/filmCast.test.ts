/**
 * FILM-CAST (2026-10-27): the films' recurring cast is the approved art. One table (film/standins.ts) feeds every act's
 * kit and the dialog portraits; the characters with a painting never fall back to an old stand-in; the two Cerito
 * paintings share a rig (F36 cross-fades them on one mesh); the briefing template gets the battle's real roster.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import '../src/core/pixiFixes';
import { STANDINS } from '../src/film/standins';
import { CERITO, HOMIAU } from '../src/film/films/acto1/kit';
import { SLUG as A2 } from '../src/film/films/acto2/kit/cast';
import { STAND as A3 } from '../src/film/films/acto3/kit';
import { SLUG as A4 } from '../src/film/films/acto4/kit/cast';
import { STAND_INS as FIN } from '../src/film/films/final/props';
import { EMIAU } from '../src/film/films/acto1/f06/lot';
import { EMIAU_STANDIN } from '../src/film/films/acto1/f05/sets';
import { CADENERO_STANDIN } from '../src/film/films/acto1/f07/sets';
import { BORRON } from '../src/film/films/acto1/f02/sets';
import { MULTI } from '../src/film/films/acto1/f08/lib';
import { speaker } from '../src/ui/story/text';
import { crewSlugsOf } from '../src/app/stageIntro';
import { sampleNodeBriefing } from '../src/film/films/plantilla/samples';

const RIGS = JSON.parse(readFileSync(new URL('../src/data/catRigs.json', import.meta.url), 'utf8')) as Record<string, unknown>;
const hasArt = (slug: string) => !!RIGS[slug];

/** the paintings ARTE-INTEG integrated (docs/part-iii/agentes/ARTE-INTEG.md) */
const NEW_ART = [
  'homiau_donut_cat', 'murciegato_cowl_cat', 'gatarana_web_cat', 'ovillo_yarnarms_cat', 'estambre_yarnstorm_cat', 'supersiames_aura_cat',
  'harrygatter_wand_cat', 'emiau_rapper_cat', 'gatomalo_bunny_cat', 'tailor_eras_cat', 'maneki_janitor_cat', 'bigoton_rival_cat',
  'garbancito_tiny_cat', 'gatzilla_kaiju_cat', 'gatoconda_smile_cat', 'gritito_scream_cat', 'gatarana_noir_cat', 'gatarana_blanca_cat',
  'gatarana_2099_cat', 'cadenero_bouncer_cat', 'borron_inkblot_cat', 'lobo_grandma_cat', 'encuadernadora_needle_cat', 'manager_backstage_cat',
  'bocina_boombox_cat', 'scratch_dj_cat', 'comecroquetas_pellet_cat', 'cerito_static_cat', 'cerito_fur_cat', 'ito_threads_cat',
];
/** the old stand-ins of characters who have their painting now: none of them may play those characters again */
const RETIRED: Record<string, string> = {
  cerito: 'copito_snowball_cat',
  ito: 'kintsugi_tea_spirit_cat',
  borron: 'fanguito_mud_cat',
  homiau: 'dona_police_cat',
  maneki: 'mochi_bell_cat',
  emiau: 'headliner_rock_cat',
  cadenero: 'granbigote_sumo_cat',
  siames: 'valquiria_lightning_cat',
  rival: 'molten_ember_cat',
  harry: 'nekomante_grimoire_cat',
  garbancito: 'guijarro_pebble_cat',
  encuadernadora: 'storybook_ink_cat',
  gatoconda: 'polvillo_dust_cat',
  manager: 'tic_pocketwatch_cat',
  malo: 'sonata_prima_cat',
  tailor: 'diva_pop_cat',
};

describe('FILM-CAST · the cast table', () => {
  it('every painting of the table exists (art + rig), and the new art is all integrated', () => {
    for (const [k, slug] of Object.entries(STANDINS)) expect(hasArt(slug), `${k}: ${slug}`).toBe(true);
    for (const slug of NEW_ART) expect(hasArt(slug), slug).toBe(true);
    expect(JSON.stringify(STANDINS)).not.toContain('nadie_static_cat');
  });
  it('Cerito: static in Acts I–IV, fur in the finale — the two share one rig (one mesh cross-fades them)', () => {
    expect(STANDINS.cerito).toBe('cerito_static_cat');
    expect(STANDINS.ceritoFur).toBe('cerito_fur_cat');
    expect(JSON.stringify(RIGS.cerito_static_cat)).toBe(JSON.stringify(RIGS.cerito_fur_cat));
    expect([CERITO, A2.cerito, A3.cerito, A4.cerito, FIN.cerito]).toEqual(Array(5).fill('cerito_static_cat'));
    expect(FIN.ceritoGato).toBe('cerito_fur_cat');
  });
  it('every act plays the recurring characters with the same painting', () => {
    expect([A2.ito, FIN.ito]).toEqual([STANDINS.ito, STANDINS.ito]);
    expect([BORRON, A4.borron, FIN.borron]).toEqual(Array(3).fill(STANDINS.borron));
    expect([HOMIAU, A4.homiau, FIN.homiau, MULTI.homiau]).toEqual(Array(4).fill(STANDINS.homiau));
    expect([A4.maneki, FIN.maneki]).toEqual([STANDINS.maneki, STANDINS.maneki]);
    expect([EMIAU, EMIAU_STANDIN, A4.emiau]).toEqual(Array(3).fill(STANDINS.emiau));
    expect([A3.murciegato, MULTI.murciegato]).toEqual([STANDINS.murciegato, STANDINS.murciegato]);
    expect([A2.aranya, A3.aranya, MULTI.aranya]).toEqual(Array(3).fill(STANDINS.aranya));
    // the characters still without art: the same stand-in everywhere
    expect([A2.esquirla, A3.esquirla, A4.esquirla]).toEqual(Array(3).fill(STANDINS.esquirla));
    expect([A2.mano, A3.mano, FIN.mano]).toEqual(Array(3).fill(STANDINS.mano));
    expect(A2.cruceta).toBe(STANDINS.cruceta);
    expect(A4.firma).toBe(STANDINS.firma);
  });
  it('the act tables use the new paintings, never a retired stand-in', () => {
    expect(CADENERO_STANDIN).toBe('cadenero_bouncer_cat');
    expect([A2.siames, A2.rival, A2.pandilla[0], A2.estambre]).toEqual(['supersiames_aura_cat', 'bigoton_rival_cat', 'ovillo_yarnarms_cat', 'estambre_yarnstorm_cat']);
    expect([A3.encuadernadora, A3.garbancito, A3.harry, A3.gatoconda, A3.lobo]).toEqual(['encuadernadora_needle_cat', 'garbancito_tiny_cat', 'harrygatter_wand_cat', 'gatoconda_smile_cat', 'lobo_grandma_cat']);
    expect([A4.manager, A4.malo, A4.tailor]).toEqual(['manager_backstage_cat', 'gatomalo_bunny_cat', 'tailor_eras_cat']);
    for (const t of [A2, A3, A4, FIN] as Record<string, unknown>[])
      for (const [role, old] of Object.entries(RETIRED)) if (typeof t[role] === 'string') expect(t[role], role).not.toBe(old);
  });
});

describe('FILM-CAST · the dialog portraits match the films', () => {
  it('the characters with art speak with their painting; the stand-ins are the films’ ones', () => {
    const want: Record<string, string> = {
      BORRÓN: STANDINS.borron,
      HOMIAU: STANDINS.homiau,
      EMIAU: STANDINS.emiau,
      'EL CADENERO': 'cadenero_bouncer_cat',
      ITŌ: STANDINS.ito,
      'GATO ARAÑA': STANDINS.aranya,
      MURCIÉGATO: STANDINS.murciegato,
      'SUPER SIAMÉS': A2.siames,
      'EL RIVAL': A2.rival,
      'HARRY GATTER': A3.harry,
      GARBANCITO: A3.garbancito,
      'GATO MALO': A4.malo,
      'TAILOR SWIFT': A4.tailor,
      ESQUIRLA: STANDINS.esquirla,
      CRUCETA: STANDINS.cruceta,
      FIRMA: STANDINS.firma,
      'LA MANO': STANDINS.mano,
      PANDILLERO: A2.pandilla[1],
    };
    for (const [who, slug] of Object.entries(want)) expect(speaker(who).slug, who).toBe(slug);
  });
});

describe('FILM-CAST · the briefing template shows the real roster', () => {
  it('crewSlugsOf: the other rival cats by painting — captain out, no repeats, at most 3', () => {
    const cat = (slug: string) => ({ slug }) as never;
    const spec = { enemy: { cats: [cat('sirsimon_ghost_cat'), cat('helice_propeller_cat'), cat('helice_propeller_cat'), cat('cascada_upfall_cat'), cat('a'), cat('b')] } } as never;
    expect(crewSlugsOf(spec, 'sirsimon_ghost_cat')).toEqual(['helice_propeller_cat', 'cascada_upfall_cat', 'a']);
    expect(crewSlugsOf({ enemy: { cats: [] } } as never, null)).toEqual([]);
  });
  it('L-8 (a node, no film of its own): Sir Simón leads, his crew behind', () => {
    const d = sampleNodeBriefing('p3d_libros', 'l8');
    expect(d?.rival.slug).toBe('sirsimon_ghost_cat');
    expect(d?.rival.crewSlugs?.length).toBeGreaterThan(0);
    expect(d?.rival.crewSlugs).not.toContain('sirsimon_ghost_cat');
  });
});
