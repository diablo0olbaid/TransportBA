import { describe, it, expect } from 'vitest';
import type { Arrival } from '@ba-transit/shared';
import { deriveSubtePositions, type StationRef } from './subtePositions.js';

const stations: StationRef[] = [
  { id: 's0', lineId: 'A', coord: [-58.4, -34.6], order: 0 },
  { id: 's1', lineId: 'A', coord: [-58.39, -34.6], order: 1 },
  { id: 's2', lineId: 'A', coord: [-58.38, -34.6], order: 2 },
];

describe('deriveSubtePositions', () => {
  it('deriva una posición interpolada entre estación previa y próxima', () => {
    const arrivals: Arrival[] = [
      { stationId: 's1', lineId: 'A', direction: 0, destination: 'x', etaSeconds: 45, tripId: 't1', isEstimate: true }, // prettier-ignore
      { stationId: 's2', lineId: 'A', direction: 0, destination: 'x', etaSeconds: 135, tripId: 't1', isEstimate: true }, // prettier-ignore
    ];
    const positions = deriveSubtePositions(arrivals, stations);
    expect(positions).toHaveLength(1);
    const p = positions[0]!;
    expect(p.source).toBe('derived');
    expect(p.lineId).toBe('A');
    expect(p.nextStationId).toBe('s1');
    // ETA 45s con segmento asumido 90s → progreso 0.5, entre s0 y s1.
    expect(p.coord[0]).toBeGreaterThan(-58.4);
    expect(p.coord[0]).toBeLessThan(-58.39);
  });

  it('marca at_station cuando el ETA es mínimo', () => {
    const arrivals: Arrival[] = [
      { stationId: 's1', lineId: 'A', direction: 0, destination: 'x', etaSeconds: 2, tripId: 't2', isEstimate: true }, // prettier-ignore
    ];
    expect(deriveSubtePositions(arrivals, stations)[0]!.status).toBe('at_station');
  });

  it('ignora trips sin id', () => {
    const arrivals: Arrival[] = [
      { stationId: 's1', lineId: 'A', direction: 0, destination: 'x', etaSeconds: 30, tripId: null, isEstimate: true }, // prettier-ignore
    ];
    expect(deriveSubtePositions(arrivals, stations)).toHaveLength(0);
  });
});
