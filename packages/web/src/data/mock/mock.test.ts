import { describe, it, expect } from 'vitest';
import { headwaySeconds, simulateSubtePositions, simulateSubteArrivals } from './subte.js';
import { simulateColectivos, AVAILABLE_BUS_LINES } from './colectivos.js';
import { simulateBikeStations } from './ecobici.js';
import { activeAlerts, delayedLinesFromAlerts } from './alerts.js';
import { createMockAdapter } from './index.js';
import { CABA_BOUNDS } from '../static/index.js';

const SEED = 42;
// Un martes 12:00 UTC → 09:00 AR (hora pico).
const PEAK = Date.UTC(2021, 0, 5, 12, 0, 0);
// 04:00 UTC → 01:00 AR (nocturno).
const NIGHT = Date.UTC(2021, 0, 5, 4, 0, 0);

const inCaba = (lon: number, lat: number) =>
  lon >= CABA_BOUNDS[0] && lon <= CABA_BOUNDS[2] && lat >= CABA_BOUNDS[1] && lat <= CABA_BOUNDS[3];

describe('mock/subte', () => {
  it('headwaySeconds: pico 180, valle 420, nocturno 0', () => {
    expect(headwaySeconds(9)).toBe(180);
    expect(headwaySeconds(14)).toBe(420);
    expect(headwaySeconds(1)).toBe(0);
  });

  it('genera formaciones en hora pico, dentro de CABA', () => {
    const trains = simulateSubtePositions(PEAK, SEED);
    expect(trains.length).toBeGreaterThan(10);
    for (const t of trains) {
      expect(inCaba(t.coord[0], t.coord[1]), `${t.id}`).toBe(true);
      expect(t.progress).toBeGreaterThanOrEqual(0);
      expect(t.progress).toBeLessThanOrEqual(1);
      expect(['moving', 'at_station']).toContain(t.status);
    }
  });

  it('no hay servicio en horario nocturno', () => {
    expect(simulateSubtePositions(NIGHT, SEED)).toHaveLength(0);
  });

  it('es determinista para el mismo instante y semilla', () => {
    expect(simulateSubtePositions(PEAK, SEED)).toEqual(simulateSubtePositions(PEAK, SEED));
  });

  it('las formaciones se mueven entre dos instantes', () => {
    const a = simulateSubtePositions(PEAK, SEED);
    const b = simulateSubtePositions(PEAK + 5000, SEED);
    const byId = new Map(a.map((t) => [t.id, t]));
    const moved = b.some((t) => {
      const prev = byId.get(t.id);
      return prev && (prev.coord[0] !== t.coord[0] || prev.coord[1] !== t.coord[1]);
    });
    expect(moved).toBe(true);
  });

  it('los arribos tienen ETA no negativo y destino', () => {
    const arrivals = simulateSubteArrivals(PEAK, SEED);
    expect(arrivals.length).toBeGreaterThan(0);
    for (const a of arrivals.slice(0, 20)) {
      expect(a.etaSeconds).toBeGreaterThanOrEqual(0);
      expect(a.destination).not.toBe('');
      expect([0, 1]).toContain(a.direction);
    }
  });
});

describe('mock/colectivos', () => {
  it('expone al menos 8 líneas con traza', () => {
    expect(AVAILABLE_BUS_LINES.length).toBeGreaterThanOrEqual(8);
  });

  it('mueve vehículos sólo de las líneas pedidas', () => {
    const buses = simulateColectivos(PEAK, SEED, ['7', '152']);
    expect(buses.length).toBeGreaterThan(0);
    expect(new Set(buses.map((b) => b.lineLabel))).toEqual(new Set(['7', '152']));
    for (const b of buses) expect(b.mode).toBe('colectivo');
  });
});

describe('mock/ecobici', () => {
  it('genera estaciones con disponibilidad coherente', () => {
    const stations = simulateBikeStations(PEAK, SEED);
    expect(stations.length).toBeGreaterThan(50);
    for (const s of stations.slice(0, 30)) {
      expect(s.bikesAvailable + s.ebikesAvailable + s.docksAvailable).toBeLessThanOrEqual(
        s.capacity,
      );
      expect(s.bikesAvailable).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('mock/alerts', () => {
  it('incluye al menos una demora y deriva las líneas demoradas', () => {
    const alerts = activeAlerts(PEAK, SEED);
    expect(alerts.length).toBeGreaterThan(0);
    const delayed = delayedLinesFromAlerts(alerts);
    expect(delayed.size).toBeGreaterThanOrEqual(1);
  });
});

describe('mock adapter', () => {
  it('implementa la superficie del adapter', async () => {
    const a = createMockAdapter(SEED);
    expect((await a.getLines()).length).toBe(7);
    expect(await a.getTrainPositions()).toEqual([]);
    expect((await a.getBikeStations()).length).toBeGreaterThan(0);
  });
});
