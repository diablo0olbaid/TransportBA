import { describe, it, expect, beforeEach } from 'vitest';
import { app } from './index.js';
import { resetRateLimit } from './rateLimit.js';
import type { HealthResponse } from './domain.js';

beforeEach(() => resetRateLimit());

describe('proxy · /v1/health', () => {
  it('responde ok con los upstreams', async () => {
    const res = await app.request('/v1/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthResponse;
    expect(body.ok).toBe(true);
    expect(body.upstreams).toBeTypeOf('object');
  });

  it('marca degradado sin credenciales y ok con ellas', async () => {
    const sin = (await (await app.request('/v1/health', {}, {})).json()) as HealthResponse;
    expect(sin.upstreams.mode).toBe('degraded');
    const con = (await (
      await app.request('/v1/health', {}, { TRANSIT_CLIENT_ID: 'id', TRANSIT_CLIENT_SECRET: 's' })
    ).json()) as HealthResponse;
    expect(con.upstreams.mode).toBe('ok');
  });
});

describe('proxy · rutas de datos con fixtures (§5)', () => {
  const routes = [
    '/v1/subte/positions',
    '/v1/subte/arrivals',
    '/v1/subte/alerts',
    '/v1/colectivos/positions?lines=7,152',
    '/v1/trenes/positions',
    '/v1/ecobici/stations',
  ];

  for (const route of routes) {
    it(`${route} devuelve JSON array válido`, async () => {
      const res = await app.request(route);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Data-Source')).toBe('fixtures');
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  }

  it('colectivos respeta el filtro de líneas en fixtures', async () => {
    const res = await app.request('/v1/colectivos/positions?lines=7,152');
    const body = (await res.json()) as { lineLabel: string }[];
    expect(new Set(body.map((v) => v.lineLabel))).toEqual(new Set(['7', '152']));
  });
});

describe('proxy · CORS y rate limit', () => {
  it('incluye cabecera CORS del ALLOWED_ORIGIN', async () => {
    const res = await app.request(
      '/v1/health',
      { headers: { Origin: 'http://localhost:5173' } },
      {
        ALLOWED_ORIGIN: 'http://localhost:5173',
      },
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });

  it('devuelve 429 al exceder el rate limit', async () => {
    resetRateLimit();
    let last = 200;
    for (let i = 0; i < 65; i += 1) {
      last = (await app.request('/v1/health', { headers: { 'cf-connecting-ip': '1.2.3.4' } }))
        .status;
    }
    expect(last).toBe(429);
  });
});
