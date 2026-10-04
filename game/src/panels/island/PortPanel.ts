/**
 * Puerto de las Mareas — Expediciones (GDD 2.19 · 6.19). Contract: `openPort()`.
 * Full panel lives in ./port/PortView (lazy) so importing this file stays cheap.
 */
export function openPort(): void {
  void import('./port/PortView').then((m) => m.openPortView());
}
