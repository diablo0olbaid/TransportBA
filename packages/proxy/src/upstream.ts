import { UPSTREAM_BASE, UPSTREAM_TIMEOUT_MS } from './config.js';
import type { Env } from './types.js';

/** ¿Hay credenciales del GCBA configuradas? Si no, el Worker usa fixtures. */
export function hasCredentials(env: Env | undefined): boolean {
  return Boolean(env?.TRANSIT_CLIENT_ID && env?.TRANSIT_CLIENT_SECRET);
}

function buildUrl(env: Env, path: string, extraQuery?: Record<string, string>): string {
  const url = new URL(path, UPSTREAM_BASE);
  url.searchParams.set('client_id', env.TRANSIT_CLIENT_ID ?? '');
  url.searchParams.set('client_secret', env.TRANSIT_CLIENT_SECRET ?? '');
  for (const [k, v] of Object.entries(extraQuery ?? {})) url.searchParams.set(k, v);
  return url.toString();
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch de un upstream JSON del GCBA (credenciales inyectadas, timeout 8s). */
export async function fetchUpstreamJson<T>(
  env: Env,
  path: string,
  extraQuery?: Record<string, string>,
): Promise<T> {
  const res = await fetchWithTimeout(buildUrl(env, path, extraQuery));
  return (await res.json()) as T;
}

/** Fetch de un upstream GTFS-RT (protobuf) → Uint8Array. */
export async function fetchUpstreamProto(
  env: Env,
  path: string,
  extraQuery?: Record<string, string>,
): Promise<Uint8Array> {
  const res = await fetchWithTimeout(buildUrl(env, path, extraQuery));
  return new Uint8Array(await res.arrayBuffer());
}
