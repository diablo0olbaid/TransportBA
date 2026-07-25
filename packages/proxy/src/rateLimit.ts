import { RATE_LIMIT } from './config.js';

/**
 * Rate limiting básico por IP en memoria del isolate (§5). Suficiente para no
 * quemar la cuota del GCBA; no es un limitador distribuido.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_LIMIT.windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT.max;
}

/** Sólo para tests: limpia el estado. */
export function resetRateLimit(): void {
  hits.clear();
}
