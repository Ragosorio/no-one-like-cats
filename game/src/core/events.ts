type Handler<T> = (payload: T) => void;

/** Tiny typed event bus. Systems emit, UI and juice listen. */
export class Emitter<Events extends Record<string, unknown>> {
  private map = new Map<keyof Events, Set<Handler<any>>>();

  on<K extends keyof Events>(type: K, fn: Handler<Events[K]>): () => void {
    let set = this.map.get(type);
    if (!set) this.map.set(type, (set = new Set()));
    set.add(fn);
    return () => set!.delete(fn);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]) {
    this.map.get(type)?.forEach((fn) => fn(payload));
  }
}
