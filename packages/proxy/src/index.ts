import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context } from 'hono';
import type { HealthResponse, UpstreamHealth } from './domain.js';
import type { Env } from './types.js';
import { UPSTREAM, TTL } from './config.js';
import { hasCredentials, fetchUpstreamJson, fetchUpstreamProto } from './upstream.js';
import { decodeServiceAlerts, decodeVehiclePositions } from './gtfsrt.js';
import { mergeEcobici } from './ecobici.js';
import { parseSubteForecast } from './subteForecast.js';
import { deriveSubtePositions, type StationRef } from './derive/subtePositions.js';
import stationsData from './data/stations.json';
import colectivoRoutes from './data/colectivo-routes.json';
import { cacheGet, cachePut } from './cache.js';
import { checkRateLimit } from './rateLimit.js';
import * as fx from './fixtures.js';

const STATIONS = stationsData as StationRef[];

// Diccionario número de línea público → route_ids internos del feed en vivo
// (ej. "152" → ["118","464","1563"]), derivado del GTFS oficial de colectivos.
const ROUTE_MAP = colectivoRoutes as Record<string, string[]>;
const ID_TO_LINE = new Map<string, string>();
for (const [num, ids] of Object.entries(ROUTE_MAP)) {
  for (const id of ids) ID_TO_LINE.set(id, num);
}

export const app = new Hono<{ Bindings: Env }>();

app.use('/v1/*', (c, next) => {
  // ALLOWED_ORIGIN admite varios orígenes separados por coma (prod + local).
  const allowed = (c.env?.ALLOWED_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = (reqOrigin: string) =>
    allowed.includes(reqOrigin) ? reqOrigin : (allowed[0] ?? '');
  return cors({ origin, allowMethods: ['GET', 'OPTIONS'] })(c, next);
});

// Rate limiting básico por IP (§5).
app.use('/v1/*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'anon';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'rate_limited' }, 429);
  }
  await next();
});

/** Mapea route_id del GCBA (ej. "LineaA") al LineId del dominio ("A"). */
const subteLineIdOf = (routeId: string): string => routeId.replace(/^Linea/i, '');

/**
 * Sirve un feed: con credenciales intenta el upstream (cacheando con TTL y
 * cayendo al último valor cacheado como stale si falla); sin credenciales o
 * ante fallo sin cache, responde fixtures (§5).
 */
async function serve<T>(
  c: Context<{ Bindings: Env }>,
  opts: { key: string; ttl: number; live: () => Promise<T>; fixture: () => T },
): Promise<Response> {
  if (!hasCredentials(c.env)) {
    c.header('X-Data-Source', 'fixtures');
    return c.json(opts.fixture() as object);
  }
  try {
    const data = await opts.live();
    await cachePut(opts.key, data, opts.ttl);
    c.header('X-Data-Source', 'live');
    return c.json(data as object);
  } catch (err) {
    const cached = await cacheGet<T>(opts.key);
    if (cached) {
      c.header('X-Data-Stale', 'true');
      return c.json(cached.data as object);
    }
    return c.json({ error: 'upstream_unavailable', upstream: opts.key, detail: String(err) }, 503);
  }
}

// --- Rutas de datos (§5) ---------------------------------------------------

// Subte: se deriva de forecastGTFS (JSON del GCBA). Sin credenciales, fixtures.
app.get('/v1/subte/positions', (c) =>
  serve(c, {
    key: 'subte-positions',
    ttl: TTL.positions,
    live: async () => {
      const raw = await fetchUpstreamJson(c.env, UPSTREAM.subteForecast);
      return deriveSubtePositions(parseSubteForecast(raw), STATIONS);
    },
    fixture: fx.fixtureSubtePositions,
  }),
);

app.get('/v1/subte/arrivals', (c) => {
  const station = c.req.query('station');
  return serve(c, {
    key: `subte-arrivals-${station ?? 'all'}`,
    ttl: TTL.arrivals,
    live: async () => {
      const raw = await fetchUpstreamJson(c.env, UPSTREAM.subteForecast);
      const arrivals = parseSubteForecast(raw);
      return station ? arrivals.filter((a) => a.stationId === station) : arrivals;
    },
    fixture: fx.fixtureArrivals,
  });
});

app.get('/v1/subte/alerts', (c) =>
  serve(c, {
    key: 'subte-alerts',
    ttl: TTL.alerts,
    live: async () => {
      const buf = await fetchUpstreamProto(c.env, UPSTREAM.subteAlerts);
      return decodeServiceAlerts(buf, 'subte', subteLineIdOf);
    },
    fixture: fx.fixtureAlerts,
  }),
);

app.get('/v1/colectivos/positions', (c) => {
  const lines = (c.req.query('lines') ?? '')
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  return serve(c, {
    key: `colectivos-${lines.join(',') || 'all'}`,
    ttl: TTL.positions,
    live: async () => {
      const buf = await fetchUpstreamProto(c.env, UPSTREAM.colectivosPositions);
      const all = decodeVehiclePositions(buf, 'colectivo');
      // Etiquetar cada coche con su número de línea público cuando se conoce.
      for (const v of all) {
        const num = ID_TO_LINE.get(v.lineId);
        if (num) v.lineLabel = num;
      }
      if (!lines.length) return all;
      // Expandir los números pedidos a sus route_ids internos y filtrar.
      const wantedIds = new Set<string>();
      for (const l of lines) for (const id of ROUTE_MAP[l] ?? [l]) wantedIds.add(id);
      return all.filter((v) => wantedIds.has(v.lineId) || lines.includes(v.lineLabel));
    },
    fixture: () => fx.fixtureBusPositions(lines),
  });
});

app.get('/v1/trenes/positions', (c) =>
  serve(c, {
    key: 'trenes-positions',
    ttl: TTL.positions,
    live: async () => {
      // El feed de trenes puede devolver 404 según credenciales; en ese caso
      // se reporta "sin datos" (lista vacía) en vez de error (ver api-notes).
      try {
        const buf = await fetchUpstreamProto(c.env, UPSTREAM.trenesPositions);
        return decodeVehiclePositions(buf, 'tren');
      } catch {
        return [];
      }
    },
    fixture: fx.fixtureTrainPositions,
  }),
);

app.get('/v1/ecobici/stations', (c) =>
  serve(c, {
    key: 'ecobici-stations',
    ttl: TTL.stationStatus,
    live: async () => {
      const [info, status] = await Promise.all([
        fetchUpstreamJson(c.env, UPSTREAM.ecobiciInformation),
        fetchUpstreamJson(c.env, UPSTREAM.ecobiciStatus),
      ]);
      return mergeEcobici(info, status);
    },
    fixture: fx.fixtureBikeStations,
  }),
);

// --- Health ----------------------------------------------------------------

app.get('/v1/health', (c) => {
  const creds = hasCredentials(c.env);
  const state: UpstreamHealth = creds ? 'ok' : 'degraded';
  const body: HealthResponse = {
    ok: true,
    upstreams: {
      mode: state,
      subte: creds ? 'ok' : 'degraded',
      colectivos: creds ? 'ok' : 'degraded',
      trenes: creds ? 'ok' : 'degraded',
      ecobici: creds ? 'ok' : 'degraded',
    },
  };
  return c.json(body);
});

export default app;
