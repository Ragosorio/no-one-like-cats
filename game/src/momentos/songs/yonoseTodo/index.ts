/**
 * YONOSE TODO — the «Momento musical» of the Parte II finale (H64 «Mentira» → H65 «Continuará», docs/part-ii/29 §18).
 * Registered here (pure: no Pixi). The finale hook (app/o4Finale.ts registerFinaleMomento) is installed lazily in the
 * browser only: o4Finale pulls the island's UI, and this registry is imported by node tests.
 *
 * MOMENTO: yonose_todo (H64→H65) — playFinale() → finale.ts playYonoseFinale.
 */
import { registerMomento } from '../../registry';
import { YONOSE_TODO } from './score';

registerMomento(YONOSE_TODO);

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void import('./finale').then((m) => m.installFinale()).catch((e) => console.warn('[yonose] finale hook', e));
}
