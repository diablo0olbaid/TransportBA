import { describe, it, expect } from 'vitest';
import type { LineId, TransitLine, FeedState } from './index.js';

describe('modelo de dominio compartido', () => {
  it('acepta las 7 líneas del sistema (6 subte + Premetro)', () => {
    const lines: LineId[] = ['A', 'B', 'C', 'D', 'E', 'H', 'P'];
    expect(lines).toHaveLength(7);
  });

  it('modela una TransitLine con la forma esperada', () => {
    const linea: TransitLine = {
      id: 'A',
      mode: 'subte',
      shortName: 'A',
      longName: 'Línea A',
      color: '#18CCCC',
      textColor: '#0B0E14',
      stations: [],
      shape: [
        [-58.37, -34.6],
        [-58.38, -34.61],
      ],
    };
    expect(linea.shape[0]).toEqual([-58.37, -34.6]);
  });

  it('FeedState discrimina por status', () => {
    const cargando: FeedState<number[]> = { status: 'loading' };
    const listo: FeedState<number[]> = {
      status: 'ready',
      data: [1, 2, 3],
      fetchedAt: Date.now(),
      stale: false,
    };
    expect(cargando.status).toBe('loading');
    expect(listo.status === 'ready' && listo.data).toEqual([1, 2, 3]);
  });
});
