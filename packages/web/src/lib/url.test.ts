import { describe, it, expect } from 'vitest';
import { parseUrlState, serializeUrlState } from './url.js';

const DEFAULT_LAYERS = { subte: true, colectivos: false, trenes: false, ecobici: false };

describe('lib/url', () => {
  it('serializa líneas, estación y capas no-default', () => {
    const qs = serializeUrlState({
      lines: ['A', 'D'],
      station: 'estacion-1',
      layers: { subte: true, colectivos: false, trenes: false, ecobici: true },
      buses: ['7'],
    });
    expect(qs).toContain('lines=A%2CD');
    expect(qs).toContain('station=estacion-1');
    expect(qs).toContain('buses=7');
    expect(qs).toContain('layers=subte%2Cecobici');
  });

  it('omite layers cuando es el default (sólo subte)', () => {
    const qs = serializeUrlState({ lines: [], station: null, layers: DEFAULT_LAYERS, buses: [] });
    expect(qs).toBe('');
  });

  it('parsea la query string', () => {
    const state = parseUrlState('?lines=A,D&station=e1&layers=subte,ecobici&buses=7,29');
    expect(state.lines).toEqual(['A', 'D']);
    expect(state.station).toBe('e1');
    expect(state.buses).toEqual(['7', '29']);
    expect(state.layers).toEqual({
      subte: true,
      colectivos: false,
      trenes: false,
      ecobici: true,
    });
  });

  it('round-trip preserva el estado', () => {
    const original = {
      lines: ['B'],
      station: 'x',
      layers: { subte: true, colectivos: true, trenes: false, ecobici: false },
      buses: ['152'],
    };
    const parsed = parseUrlState(serializeUrlState(original));
    expect(parsed.lines).toEqual(original.lines);
    expect(parsed.station).toBe(original.station);
    expect(parsed.layers).toEqual(original.layers);
    expect(parsed.buses).toEqual(original.buses);
  });
});
