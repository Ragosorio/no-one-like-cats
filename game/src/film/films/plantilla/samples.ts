/**
 * LA PLANTILLA — DEV samples: the template filled with La Borracha's real stage data (regiones.json), registered as
 * `plantilla_b1` … `plantilla_b9` so the dev route `?film=plantilla_b3` shows what the Carta will play before B-3
 * (the estimate is a fixed sample; the rule demo is computed by the set from the stage's mareo). Not in production.
 */
import regiones from '../../../data/gateras/regiones.json';
import { catDef } from '../../../data/content';
import type { BriefingData } from '../../../app/stageIntro';
import { registerFilm } from '../../registry';
import { briefingFilm } from './index';

type Stage = { n: number; kind: 'normal' | 'elite' | 'boss'; name: string; captainName?: string; captain?: string; captainArt?: string; line?: string; pasa?: string | null; stakes?: string | null; teach?: string; mareo?: unknown; crew?: string[] };
const STAKES = {
  normal: 'Si perdemos, solo perdemos tiempo: el 30 % del oro y ninguna huella. La caja sigue aquí.',
  elite: 'Es un muro de la caja. Si perdemos, ajustamos la tripulación y volvemos.',
  boss: 'El rastro de Cerito. Si perdemos, la puerta sigue cerrada.',
};

type Node = Omit<Stage, 'n' | 'kind'> & { id: string; label?: string; kind: string };
type Dim = { id: string; name: string; code?: string | null; nodes?: Node[] };
const DATA = regiones as unknown as { dims: Dim[]; stages: Record<string, Stage[]> };
/** the boxes that have stages in the data (the first one is the act I box) */
export const sampleDims = () => DATA.dims.filter((d) => DATA.stages[d.id]?.length);

export function sampleBriefing(n: number, dimId = sampleDims()[0]?.id): BriefingData | null {
  const dim = DATA.dims.find((d) => d.id === dimId);
  const st = dim ? DATA.stages[dim.id]?.find((s) => s.n === n) : undefined;
  if (!dim || !st) return null;
  let slug: string | null = st.captainArt ?? null;
  try {
    if (!slug && st.captain) slug = catDef(st.captain).art.slug ?? null;
  } catch {
    slug = null;
  }
  // the rest of the roster's paintings (the real battle sends them from its BattleSpec: app/stageIntro.ts crewSlugsOf)
  const crewSlugs: string[] = [];
  for (const id of st.crew ?? []) {
    try {
      const s = catDef(id).art.slug;
      if (s && s !== slug && !crewSlugs.includes(s) && crewSlugs.length < 3) crewSlugs.push(s);
    } catch {
      /* an unknown species: skipped */
    }
  }
  const d: BriefingData & { __mareo?: unknown } = {
    battleId: `${dim.id}_${n}`,
    dim: dim.id as BriefingData['dim'],
    n,
    node: String(n),
    label: `${dim.code ?? 'B'}-${n}`,
    kind: st.kind,
    tag: st.kind === 'boss' ? `JEFE · ${dim.name}` : st.kind === 'elite' ? `ÉLITE · ${dim.name}` : `${dim.name} · ${dim.code ?? ''}-${n}`,
    dimName: dim.name,
    title: st.name,
    pasa: st.pasa ?? `Seguimos el rastro de Cerito por ${dim.name}: ${st.name}.`,
    rival: { name: (st.captainName ?? st.name).split('«')[0].trim(), line: st.line ?? null, slug, crew: [], crewSlugs },
    rule: { lines: st.teach ? [st.teach] : [], demo: null },
    stakes: st.stakes ?? STAKES[st.kind],
    huellas: st.kind === 'boss' ? 10 : 3,
    estimate: () => ({ p: 0.72, done: 40, total: 40, reasons: [], tips: [], details: [] }),
    __mareo: st.mareo,
  };
  return d;
}
/**
 * The boxes whose stages are NODES (Anime, Libros, POP: `dims[].nodes` with a captain and a crew): their node `a7`,
 * `l8`, `p4`… as a sample, with the captain's painting and the rest of the roster (FILM-CAST, 2026-10-27).
 */
export function sampleNodeBriefing(dimId: string, nodeId: string): BriefingData | null {
  const dim = DATA.dims.find((d) => d.id === dimId);
  const nd = dim?.nodes?.find((x) => x.id === nodeId);
  if (!dim || !nd || !nd.captain || !['stage', 'elite', 'boss'].includes(nd.kind)) return null;
  const kind = nd.kind === 'stage' ? 'normal' : (nd.kind as 'elite' | 'boss');
  let slug: string | null = nd.captainArt ?? null;
  try {
    if (!slug) slug = catDef(nd.captain).art.slug ?? null;
  } catch {
    slug = null;
  }
  const crewSlugs: string[] = [];
  for (const id of nd.crew ?? []) {
    try {
      const s = catDef(id).art.slug;
      if (s && s !== slug && !crewSlugs.includes(s) && crewSlugs.length < 3) crewSlugs.push(s);
    } catch {
      /* skipped */
    }
  }
  const label = nd.label ?? nodeId.toUpperCase();
  return {
    battleId: `${dim.id}_${nodeId}`,
    dim: dim.id as BriefingData['dim'],
    n: Number(nodeId.replace(/\D/g, '')) || 1,
    node: nodeId,
    label,
    kind,
    tag: kind === 'boss' ? `JEFE · ${dim.name}` : kind === 'elite' ? `ÉLITE · ${dim.name}` : `${dim.name} · ${label}`,
    dimName: dim.name,
    title: nd.name,
    pasa: nd.pasa ?? `Seguimos el rastro de Cerito por ${dim.name}: ${nd.name}.`,
    rival: { name: (nd.captainName ?? nd.name).split('«')[0].trim(), line: nd.line ?? null, slug, crew: [], crewSlugs },
    rule: { lines: nd.teach ? [nd.teach] : [], demo: null },
    stakes: nd.stakes ?? STAKES[kind],
    huellas: kind === 'boss' ? 10 : 3,
    estimate: () => ({ p: 0.72, done: 40, total: 40, reasons: [], tips: [], details: [] }),
  };
}
/**
 * `plantilla_<box code><n>` for every box with stages in the data (La Borracha: plantilla_b1 … plantilla_b9), and
 * `plantilla_<node id>` for the boxes made of nodes (plantilla_a7, plantilla_l8, plantilla_p4…)
 */
export function registerSamples() {
  for (const dim of sampleDims()) {
    const code = (dim.code ?? dim.id.replace(/^p3d_/, '')).toLowerCase();
    for (const st of DATA.stages[dim.id]) {
      const d = sampleBriefing(st.n, dim.id);
      if (d) registerFilm({ ...briefingFilm(d), id: `plantilla_${code}${st.n}` });
    }
  }
  for (const dim of DATA.dims)
    for (const nd of dim.nodes ?? []) {
      const id = `plantilla_${nd.id.toLowerCase()}`;
      if (!/^[alp]\d+$/.test(nd.id)) continue;
      const d = sampleNodeBriefing(dim.id, nd.id);
      if (d) registerFilm({ ...briefingFilm(d), id });
    }
}
