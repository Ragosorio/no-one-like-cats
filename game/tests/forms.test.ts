/**
 * FORMS (Parte II, docs/part-ii/12-puente-oleada-1.md §4): evolutions as switchable manifestations.
 * Canelo Almirante (unlocked by `forma:canelo_almirante`) and Canelo Astral (sealed this wave).
 * Old saves without `form` must load exactly as before; a form never touches another cat.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// a tiny in-memory localStorage for node (save round-trips)
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
  clear: () => mem.clear(),
};

const { G, newGame } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { CAT_BY_ID, ELEMENT_BY_ID, catDef } = await import('../src/data/content');
const { FORMS, FORM_BY_ID, applyForm, formBaseSlug, formsOf, resolveFormSlug } = await import('../src/data/rupturas/formas');
const forms = await import('../src/state/sys/forms');
const { catPow } = await import('../src/state/sys/cats');
const { catPower } = await import('../src/state/econ');
const { setCrew, crew } = await import('../src/state/sys/ship');
const { buildBattle } = await import('../src/state/sys/campaign');
const { battleCatFrom } = await import('../src/battle/catShots');
const { ULTS, BABOR_MATE } = await import('../src/battle/ults');
const { autoBattle, makeBattle, aiSeed, volleyAim, volleySigma, enemyProfile } = await import('../src/battle/autoplay');
const { decide, aimCannon, aimFrom, DIFFICULTY } = await import('../src/battle/ai');
const { summonShooters } = await import('../src/battle/bossLate');
const { INK_RUNE } = await import('../src/battle/sim');
const { catRig } = await import('../src/art/puppetCore');

const ALM = 'canelo_almirante';
const AST = 'canelo_astral';
const FLAG = 'forma:canelo_almirante';
const fixture = (name: string) => readFileSync(new URL(`../test-saves/${name}.json`, import.meta.url), 'utf8');
/** load a game/test-saves fixture through the real load pipeline (migrate → normalize → patches) */
function loadFixture(name: string) {
  mem.clear();
  mem.set(SAVE_KEY, fixture(name));
  G.otherWindow = G.staleWindow = G.saveLocked = false;
  G.load();
  expect(G.loaded).toBe(true);
}
const canelo = () => G.s.cats.find((c) => c.species === 'c_canelo')!;

describe('registry (data/rupturas/formas.ts)', () => {
  it('every form is valid: species, unique ids/slugs, real elements, flag, sim ultimate, modest power', () => {
    expect(new Set(FORMS.map((f) => f.id)).size).toBe(FORMS.length);
    expect(new Set(FORMS.map((f) => f.slug)).size).toBe(FORMS.length);
    for (const f of FORMS) {
      const sp = CAT_BY_ID.get(f.species);
      expect(sp, f.id).toBeTruthy();
      expect(f.slug).not.toBe(sp!.art.slug);
      expect(CAT_BY_ID.size && [...CAT_BY_ID.values()].some((c) => c.art.slug === f.slug)).toBe(false);
      expect(formBaseSlug(f.slug)).toBe(sp!.art.slug);
      for (const e of f.elementsAdd) expect(ELEMENT_BY_ID.has(e), `${f.id}: ${e}`).toBe(true);
      expect(f.unlockFlag).toBe(`forma:${f.id}`);
      expect(f.powMul).toBeGreaterThanOrEqual(1.1);
      expect(f.powMul).toBeLessThanOrEqual(1.15);
      if (f.ult?.key) expect(typeof ULTS[f.ult.key], f.ult.key).toBe('function');
      if (f.sealed) expect(f.sealedHint).toBeTruthy();
    }
  });
  it('Canelo: Original / Almirante (Fuego + Agua, ¡A BABOR!) / Astral (sellada, Cósmico)', () => {
    expect(formsOf('c_canelo').map((f) => f.id)).toEqual([ALM, AST]);
    const alm = FORM_BY_ID.get(ALM)!;
    expect(alm.slug).toBe('canelo_admiral_cat');
    expect(alm.unlockFlag).toBe(FLAG);
    expect(applyForm(catDef('c_canelo'), ALM).elements).toEqual(['fire', 'water']);
    expect(applyForm(catDef('c_canelo'), ALM).combat.ultimate.name.startsWith('¡A BABOR!')).toBe(true);
    const ast = FORM_BY_ID.get(AST)!;
    expect(ast.slug).toBe('canelo_astral_cat');
    expect(ast.sealed).toBe(true);
    expect(ast.sealedHint).toBe('Algo en el cielo todavía no se abre.');
    expect(applyForm(catDef('c_canelo'), AST).elements).toEqual(['fire', 'cosmic']);
  });
  it('applyForm ignores unknown ids and other species (never alters a def it does not own)', () => {
    const d = catDef('c_canelo');
    expect(applyForm(d, undefined)).toBe(d);
    expect(applyForm(d, 'nope')).toBe(d);
    const other = catDef('c_gelatino');
    expect(applyForm(other, ALM)).toBe(other);
  });
});

describe('art slug choke point', () => {
  beforeEach(() => {
    mem.clear();
    newGame();
  });
  it('form slug → original painting while the art is missing, its own once it exists', () => {
    expect(resolveFormSlug('canelo_admiral_cat', () => false)).toBe('canelo_cozy_cat');
    expect(resolveFormSlug('canelo_admiral_cat', (s) => s === 'canelo_admiral_cat')).toBe('canelo_admiral_cat');
    expect(resolveFormSlug('nube_dream_cat', () => false)).toBe('nube_dream_cat');
    // what art/catArt.ts artSlug() does today with the rigs in this build
    const drawn = resolveFormSlug('canelo_admiral_cat', (s) => !!catRig(s));
    expect(drawn).toBe(catRig('canelo_admiral_cat') ? 'canelo_admiral_cat' : 'canelo_cozy_cat');
  });
  it('catSlug(instance): species slug unless an unlocked form is active', () => {
    const c = canelo();
    expect(forms.catSlug(c)).toBe('canelo_cozy_cat');
    c.form = ALM; // stored, but not unlocked yet → still the original
    expect(forms.catSlug(c)).toBe('canelo_cozy_cat');
    G.flag(FLAG);
    expect(forms.catSlug(c)).toBe('canelo_admiral_cat');
    c.form = 'from_a_newer_build';
    expect(forms.catSlug(c)).toBe('canelo_cozy_cat');
  });
});

describe('switching (state/sys/forms.ts)', () => {
  beforeEach(() => {
    mem.clear();
    newGame();
  });
  it('locked until its flag; the flag makes it selectable; switching back is free', () => {
    const c = canelo();
    const seen: string[] = [];
    G.on('cat', (e) => e.uid === c.uid && seen.push(e.why));
    expect(forms.setForm(c, ALM)).toBe('locked');
    expect(c.form).toBeUndefined();
    G.flag(FLAG);
    const gems = G.s.gems;
    expect(forms.setForm(c, ALM)).toBe('ok');
    expect(c.form).toBe(ALM);
    expect(seen).toEqual(['form']);
    expect(forms.setForm(c, ALM)).toBe('same');
    expect(forms.setForm(c, null)).toBe('ok');
    expect('form' in c).toBe(false);
    expect(G.s.gems).toBe(gems); // free
  });
  it('a sealed form can never be selected, even with a flag', () => {
    const c = canelo();
    G.flag('forma:canelo_astral');
    expect(forms.setForm(c, AST)).toBe('sealed');
    expect(c.form).toBeUndefined();
    c.form = AST; // hand-edited save: still draws and fights as the original
    expect(forms.activeForm(c)).toBeUndefined();
  });
  it('another species cannot take Canelo’s form; the form does not alter other cats', () => {
    G.flag(FLAG);
    const other = G.s.cats.find((c) => c.species !== 'c_canelo')!;
    const before = JSON.stringify(other);
    const powBefore = catPow(other);
    expect(forms.setForm(other, ALM)).toBe('unknown');
    expect(forms.setForm(canelo(), ALM)).toBe('ok');
    expect(JSON.stringify(other)).toBe(before);
    expect(catPow(other)).toBe(powBefore);
  });
  it('Poder bump is modest (×1.12) and only while the form is active', () => {
    const c = canelo();
    const base = catPower(catDef(c.species).rarity, c.level, c.stars);
    expect(catPow(c)).toBe(base);
    G.flag(FLAG);
    forms.setForm(c, ALM);
    expect(catPow(c) / base).toBeCloseTo(1.12, 6);
    forms.setForm(c, null);
    expect(catPow(c)).toBe(base);
  });
  it('the form persists through a save round-trip', () => {
    G.flag(FLAG);
    forms.setForm(canelo(), ALM);
    G.s.playMs += 1;
    G.save();
    const uid = canelo().uid;
    G.s = JSON.parse('{}'); // drop the in-memory island
    G.load();
    const c = G.s.cats.find((x) => x.uid === uid)!;
    expect(c.form).toBe(ALM);
    expect(forms.activeFormId(c)).toBe(ALM);
    expect(forms.catSlug(c)).toBe('canelo_admiral_cat');
  });
  it('a malformed stored form is dropped on load; an unknown id is kept (a newer build) and ignored', () => {
    G.flag(FLAG);
    const [a, b] = G.s.cats;
    (a as unknown as { form: unknown }).form = 42;
    b.form = 'forma_del_futuro';
    G.s.playMs += 1;
    G.save();
    G.load();
    expect('form' in G.s.cats[0]).toBe(false);
    expect(G.s.cats[1].form).toBe('forma_del_futuro');
    expect(forms.activeForm(G.s.cats[1])).toBeUndefined();
  });
});

describe('old saves without forms', () => {
  it('load identically: no form field appears, same paintings, same Poder, same battle kit', () => {
    const raw = JSON.parse(fixture('late-game')).state as { cats: Record<string, unknown>[] };
    loadFixture('late-game');
    expect(G.s.cats.length).toBe(raw.cats.length);
    for (const c of G.s.cats) {
      expect('form' in c).toBe(false);
      expect(forms.catSlug(c)).toBe(catDef(c.species).art.slug);
      expect(catPow(c)).toBe(catPower(catDef(c.species).rarity, c.level, c.stars));
      const i = { uid: c.uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: 1, hpMul: 1 };
      const plain = battleCatFrom(i, 100);
      expect(battleCatFrom({ ...i, form: forms.activeFormId(c) }, 100)).toEqual(plain);
      expect(plain.ultKey).toBeUndefined();
      expect(plain.slug).toBe(catDef(c.species).art.slug);
    }
    // the cats are byte-identical to the fixture's after the load pipeline (apart from what normalize always did)
    const again = JSON.stringify(G.s.cats);
    G.s.playMs += 1;
    G.save();
    G.load();
    expect(JSON.stringify(G.s.cats)).toBe(again);
    expect(forms.formRevealsPending()).toEqual([]);
  });
  it('a save that already holds the flag gets its reveal once (no reward involved), and the form is selectable', () => {
    loadFixture('late-game');
    const gems = G.s.gems;
    G.s.flags[FLAG] = true; // as if H37 paid it in an earlier session
    expect(forms.formRevealsPending().map((f) => f.id)).toEqual([ALM]);
    forms.markFormRevealed(ALM);
    expect(forms.formRevealsPending()).toEqual([]);
    expect(G.s.gems).toBe(gems);
    expect(forms.setForm(canelo(), ALM)).toBe('ok');
    G.s.playMs += 1;
    G.save();
    G.load();
    expect(forms.formRevealsPending()).toEqual([]);
  });
});

describe('battle: the form fights as its kit, and the screen sim == the estimate', () => {
  function almiranteSpec() {
    loadFixture('late-game');
    G.flag(FLAG);
    const c = canelo();
    expect(forms.setForm(c, ALM)).toBe('ok');
    const others = crew().filter((u) => u !== c.uid);
    setCrew(G.s.ship.active, [c.uid, ...others].slice(0, 3));
    const spec = buildBattle(4, 5, () => undefined);
    const me = spec.player.cats.find((x) => x.uid === c.uid)!;
    return { spec, me };
  }

  it('Almirante in the crew: painting, Fuego + Agua, ¡A BABOR! (ultKey) — the others untouched', () => {
    const { spec, me } = almiranteSpec();
    expect(me.slug).toBe('canelo_admiral_cat');
    expect(me.elements).toEqual(['fire', 'water']);
    expect(me.ultKey).toBe(ALM);
    expect(me.ultimate?.name).toBe('¡A BABOR!');
    for (const o of spec.player.cats.filter((x) => x.uid !== me.uid)) expect(o.ultKey).toBeUndefined();
    // switching back: the original kit again
    forms.setForm(canelo(), null);
    const back = buildBattle(4, 5, () => undefined).player.cats.find((x) => x.uid === me.uid)!;
    expect(back.slug).toBe('canelo_cozy_cat');
    expect(back.elements).toEqual(['fire']);
    expect(back.ultKey).toBeUndefined();
  });

  it('¡A BABOR!: his barrage + every crewmate fires its own shot along his aim (×BABOR_MATE)', () => {
    const { spec, me } = almiranteSpec();
    const fireUlt = (key?: string) => {
      const s2 = structuredClone({ ...spec, onEnd: undefined });
      const cat = s2.player.cats.find((x) => x.uid === me.uid)!;
      if (key) cat.ultKey = key;
      else delete cat.ultKey;
      const b = makeBattle(s2, 777);
      b.startTurn(0);
      // aim at the middle of their ship, no noise (same aim for both runs)
      const a = aimFrom(b, 0, b.muzzle(0, me.uid), cat.ultimate!, 1, 0, b.shipCenter(1));
      const r = b.fire(0, me.uid, a.angle, a.power, true);
      return { r, dmg: r.events.reduce((a, e) => a + (e.k === 'cell' && e.side === 1 ? e.dmg : 0), 0) };
    };
    const plain = fireUlt();
    const babor = fireUlt(ALM);
    const mates = spec.player.cats.filter((x) => x.uid !== me.uid);
    expect(mates.length).toBeGreaterThan(0);
    // at least one path per crewmate on top of his own barrage, and never less damage than the plain barrage
    expect(babor.r.paths.length).toBeGreaterThanOrEqual(plain.r.paths.length + mates.length);
    expect(plain.dmg).toBeGreaterThan(0);
    expect(babor.dmg).toBeGreaterThan(plain.dmg);
    expect(BABOR_MATE).toBeGreaterThan(0);
    expect(BABOR_MATE).toBeLessThanOrEqual(0.35);
  });

  it('parity: same seed, form on → the screen flow and the estimate (worker clone) play the same battle', () => {
    const { spec, me } = almiranteSpec();
    // Canelo starts with a full meter so ¡A BABOR! certainly shows up in the battle
    me.ultStart = 1;
    const { onEnd: _drop, ...plain } = spec;
    const workerSpec = structuredClone(plain) as typeof spec; // what estimate.ts posts to the worker
    const prof = DIFFICULTY.normal;
    let sawBabor = false;
    for (const seed of [11, 4242, 90210]) {
      // the estimate: autoBattle in the worker
      const estLog: string[] = [];
      const est = autoBattle(workerSpec, prof, seed, 30, (b, side, shot) => estLog.push(`${b.turn}|${side}|${shot}`));
      // the screen: BattleScene's turn flow (start → cat shot(s) with aiSeed → ink → volley → end)
      const scrLog: string[] = [];
      const b = makeBattle(spec, seed);
      const mem2 = [new Map<string, number>(), new Map<string, number>()];
      const profs = [prof, enemyProfile(spec)];
      const dmgBy = new Map<string, number>();
      let g = 0;
      while (b.winner === null && g++ < 30) {
        for (const side of [0, 1] as const) {
          b.startTurn(side);
          b.queued.length = 0;
          if (b.winner !== null) break;
          let target: { x: number; y: number } | null = null;
          const shots = 1 + b.extraShots(side);
          for (let k = 0; k < shots && b.winner === null; k++) {
            const d = decide(b, side, profs[side], mem2[side], aiSeed.cat(b, side, k), { demolisher: spec.rules?.demolisher?.includes(side), dmgBy });
            if (!d) break;
            const r = b.fire(side, d.shooter, d.angle, d.power, d.ult);
            scrLog.push(`${b.turn}|${side}|${d.shooter}${d.ult ? '(ULT)' : ''} ->(${Math.round(d.target.x)},${Math.round(d.target.y)}) ${r.shot.name}`);
            if (d.ult && d.shooter === me.uid && r.shot.name === '¡A BABOR!') sawBabor = true;
            target = volleyAim(target, r.events, side);
            for (const e of r.events) if (side === 1 && e.k === 'cat' && e.side === 0 && e.dmg > 0) dmgBy.set(d.shooter, (dmgBy.get(d.shooter) ?? 0) + e.dmg);
          }
          for (const p of summonShooters(b, side)) {
            if (b.winner !== null) break;
            const a = aimFrom(b, side, b.partMuzzle(side, p), INK_RUNE, aiSeed.ink(b, p.id), 3);
            b.fire(side, `part:${p.id}`, a.angle, a.power);
          }
          for (const m of b.cannons(side)) {
            if (b.winner !== null) break;
            if (!m.alive) continue;
            const a = aimCannon(b, side, m.id, aiSeed.cannon(b, m.id), volleySigma(spec, side), target ?? undefined);
            b.fire(side, 'cannon', a.angle, a.power, false, m.id);
          }
          b.endTurn();
          if (b.winner !== null) break;
        }
      }
      expect(scrLog).toEqual(estLog);
      expect(b.winner === 0).toBe(est.won);
      expect(b.turn).toBe(est.turns);
    }
    expect(sawBabor).toBe(true);
  });
});
