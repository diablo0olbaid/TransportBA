/** Utilidades de tiempo. Buenos Aires es UTC−3 todo el año (sin DST). */
const AR_OFFSET_MS = -3 * 3600 * 1000;

/** Hora local de Buenos Aires (0..23, fraccional) para un epoch dado. */
export function buenosAiresHour(nowMs: number): number {
  const shifted = new Date(nowMs + AR_OFFSET_MS);
  return shifted.getUTCHours() + shifted.getUTCMinutes() / 60;
}

/** Reloj `HH:mm:ss` de Buenos Aires (§9 header). */
export function buenosAiresClock(nowMs: number): string {
  const d = new Date(nowMs + AR_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

/**
 * Tiempo relativo en español rioplatense (§12): `hace 12 s`, `hace 3 min`,
 * `hace 1 h`. `sinceMs` es el timestamp pasado; `nowMs` el momento actual.
 */
export function relativeTime(sinceMs: number, nowMs: number): string {
  const secs = Math.max(0, Math.round((nowMs - sinceMs) / 1000));
  if (secs < 60) return `hace ${secs} s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `hace ${hours} h`;
}

/** Formatea una cuenta regresiva en segundos como `m:ss` o `ss s`. */
export function formatEta(seconds: number): string {
  if (seconds <= 0) return 'llegando';
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
