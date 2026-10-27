/**
 * PELÍCULAS — Pixi's GPU garbage collector, paused while a film plays (FILM-ACTO1).
 *
 * Pixi (8.15+: `renderer.gc`; before: `renderer.textureGC`) unloads GPU resources that went 60 s without a draw —
 * textures, Graphics geometry — and re-uploads them on their next one. In a film longer than a minute, everything baked
 * during the loading screen (inserts, stills, words, painted planes) came back as 0.3–1.9 s stalls (F06 measured: 1.9 s
 * at 63.6 s). The film owns the screen while it plays, so the GC rests until it ends.
 *
 *   const restore = pauseTextureGC(renderer);   // before the film's build
 *   try { … } finally { restore(); }             // always: done, exited, aborted or thrown
 */
export interface GcHost {
  /** Pixi ≥ 8.15: the unified GC */
  gc?: { enabled: boolean };
  /** older Pixi (deprecated proxy of gc.enabled in 8.15+) */
  textureGC?: { active: boolean };
}
/** pause the GC; returns the restore (idempotent). A pause inside a pause keeps the ORIGINAL state for the outer one. */
export function pauseTextureGC(r: GcHost | null | undefined): () => void {
  const gc = r?.gc;
  const tgc = gc ? undefined : r?.textureGC;
  if (!gc && !tgc) return () => undefined;
  const was = gc ? gc.enabled : tgc!.active;
  if (gc) gc.enabled = false;
  else tgc!.active = false;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (gc) gc.enabled = was;
    else tgc!.active = was;
  };
}
