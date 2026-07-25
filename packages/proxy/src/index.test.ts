import { describe, it, expect } from 'vitest';
import { app } from './index.js';
import type { HealthResponse } from '@ba-transit/shared';

describe('proxy · /v1/health', () => {
  it('responde ok con los upstreams', async () => {
    const res = await app.request('/v1/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as HealthResponse;
    expect(body.ok).toBe(true);
    expect(body.upstreams).toBeTypeOf('object');
  });

  it('marca modo degradado sin credenciales', async () => {
    const res = await app.request('/v1/health', {}, {});
    const body = (await res.json()) as HealthResponse;
    expect(body.upstreams.mode).toBe('degraded');
  });

  it('marca modo ok con credenciales configuradas', async () => {
    const res = await app.request(
      '/v1/health',
      {},
      { TRANSIT_CLIENT_ID: 'id', TRANSIT_CLIENT_SECRET: 'secret' },
    );
    const body = (await res.json()) as HealthResponse;
    expect(body.upstreams.mode).toBe('ok');
  });
});
