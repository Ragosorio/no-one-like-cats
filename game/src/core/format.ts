const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/**
 * Formats numbers per balance.json notation: < 10,000 → "9,999"; otherwise 3 significant
 * digits + suffix (12.3K · 4.70M · 48.0B), then aa, ab, ac… idle-style.
 */
export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 10000) {
    if (n < 10 && n % 1 !== 0) return sign + n.toFixed(1);
    return sign + Math.floor(n).toLocaleString('en-US');
  }
  const tier = Math.floor(Math.log10(n) / 3);
  let suffix: string;
  if (tier < SUFFIXES.length) suffix = SUFFIXES[tier];
  else {
    const t = tier - SUFFIXES.length;
    suffix = String.fromCharCode(97 + Math.floor(t / 26)) + String.fromCharCode(97 + (t % 26));
  }
  const scaled = n / Math.pow(1000, tier);
  const d = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return sign + scaled.toFixed(d) + suffix;
}

/** mm:ss or h:mm:ss */
export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => v.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Short human duration: "45s", "12m", "3h 20m" */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}
