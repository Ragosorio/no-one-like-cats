import { describe, expect, it } from 'vitest';
import { mergeContent, ContentConflict } from '../src/data/mergeContent';
import { CONTENT, MISSION_BY_ID, CAT_BY_ID } from '../src/data/content';

describe('content merge (Parte II modules)', () => {
  it('concatenates arrays and merges objects without touching existing values', () => {
    const base = { cats: [{ id: 'a' }], affinity: { fire: { water: 0.5 } }, meta: { v: 1 } };
    mergeContent(base, { cats: [{ id: 'b' }], affinity: { fire: { cristal: 1 }, cristal: { fire: 1 } }, $comment: 'x' });
    expect(base.cats.map((c) => c.id)).toEqual(['a', 'b']);
    expect(base.affinity).toEqual({ fire: { water: 0.5, cristal: 1 }, cristal: { fire: 1 } });
    expect('$comment' in base).toBe(false);
  });
  it('refuses to overwrite Part I values or reuse ids', () => {
    expect(() => mergeContent({ meta: { v: 1 } }, { meta: { v: 2 } })).toThrow(ContentConflict);
    expect(() => mergeContent({ cats: [{ id: 'a' }] }, { cats: [{ id: 'a' }] })).toThrow(ContentConflict);
  });
  it('the real merged content keeps every Part I id', () => {
    expect(CAT_BY_ID.get('c_canelo')?.name).toBe('Canelo');
    expect(MISSION_BY_ID.get('H30')).toBeTruthy();
    expect(CONTENT.cats.length).toBeGreaterThanOrEqual(86);
  });
});
