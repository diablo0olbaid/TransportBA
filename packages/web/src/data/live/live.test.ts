import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLiveAdapter, probeProxyHealth } from './index.js';

const PROXY = 'http://proxy.test';

afterEach(() => vi.restoreAllMocks());

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

describe('createLiveAdapter', () => {
  it('getSubtePositions consulta el proxy y parsea JSON', async () => {
    const positions = [{ id: 'subte-A-0', lineId: 'A' }];
    globalThis.fetch = mockFetch(200, positions) as typeof fetch;
    const adapter = createLiveAdapter(PROXY);
    const result = await adapter.getSubtePositions();
    expect(result).toEqual(positions);
    expect(globalThis.fetch).toHaveBeenCalledWith(`${PROXY}/v1/subte/positions`);
  });

  it('getBusPositions arma la query de líneas', async () => {
    globalThis.fetch = mockFetch(200, []) as typeof fetch;
    await createLiveAdapter(PROXY).getBusPositions(['7', '152']);
    expect(globalThis.fetch).toHaveBeenCalledWith(`${PROXY}/v1/colectivos/positions?lines=7,152`);
  });

  it('lanza error ante respuesta no-ok', async () => {
    globalThis.fetch = mockFetch(503, {}) as typeof fetch;
    await expect(createLiveAdapter(PROXY).getAlerts()).rejects.toThrow(/proxy 503/);
  });

  it('getLines usa datos estáticos (7 líneas)', async () => {
    expect(await createLiveAdapter(PROXY).getLines()).toHaveLength(7);
  });
});

describe('probeProxyHealth', () => {
  it('devuelve la salud cuando el proxy responde', async () => {
    const health = { ok: true, upstreams: { mode: 'ok' } };
    globalThis.fetch = mockFetch(200, health) as typeof fetch;
    expect(await probeProxyHealth(PROXY)).toEqual(health);
  });

  it('devuelve null si el proxy no responde', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network')) as typeof fetch;
    expect(await probeProxyHealth(PROXY)).toBeNull();
  });
});
