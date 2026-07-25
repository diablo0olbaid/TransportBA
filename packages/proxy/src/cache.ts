/**
 * Wrapper sobre la Cache API del Worker (§5). Guarda respuestas JSON con TTL y
 * permite recuperar el último valor cacheado para servir dato "stale" cuando el
 * upstream falla. Degrada a no-op si la Cache API no está disponible (tests).
 */

function cacheAvailable(): boolean {
  return typeof caches !== 'undefined' && !!(caches as { default?: Cache }).default;
}

function keyToRequest(key: string): Request {
  return new Request(`https://cache.local/${encodeURIComponent(key)}`);
}

export async function cacheGet<T>(key: string): Promise<{ data: T; fetchedAt: number } | null> {
  if (!cacheAvailable()) return null;
  const res = await caches.default.match(keyToRequest(key));
  if (!res) return null;
  const fetchedAt = Number(res.headers.get('X-Fetched-At') ?? '0');
  const data = (await res.json()) as T;
  return { data, fetchedAt };
}

export async function cachePut<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  if (!cacheAvailable()) return;
  const res = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `max-age=${ttlSeconds}`,
      'X-Fetched-At': String(Date.now()),
    },
  });
  await caches.default.put(keyToRequest(key), res);
}

export function isFresh(fetchedAt: number, ttlSeconds: number): boolean {
  return Date.now() - fetchedAt < ttlSeconds * 1000;
}
