import { describe, it, expect } from 'vitest';
import { LINES, LINE_IDS, CABA_BOUNDS, getAllStations } from './index.js';

const EXPECTED_LINES = ['A', 'B', 'C', 'D', 'E', 'H', 'P'] as const;

// Colores oficiales del §13.
const EXPECTED_COLORS: Record<string, string> = {
  A: '#18CCCC',
  B: '#EB0909',
  C: '#2A7AC4',
  D: '#01823F',
  E: '#6C2C8E',
  H: '#FFD800',
  P: '#9CCB3B',
};

const [minLon, minLat, maxLon, maxLat] = CABA_BOUNDS;

describe('datos estáticos de líneas (M1)', () => {
  it('incluye las 7 líneas (6 subte + Premetro)', () => {
    expect(LINE_IDS.slice().sort()).toEqual([...EXPECTED_LINES].sort());
    expect(LINES).toHaveLength(7);
  });

  it('cada línea tiene al menos una estación', () => {
    for (const line of LINES) {
      expect(line.stations.length, `línea ${line.id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('cada línea tiene una traza (shape) no vacía', () => {
    for (const line of LINES) {
      expect(line.shape.length, `traza ${line.id}`).toBeGreaterThan(1);
    }
  });

  it('todas las coordenadas de estaciones caen dentro del bounding box de CABA', () => {
    for (const s of getAllStations()) {
      const [lon, lat] = s.coord;
      expect(lon, `${s.name} lon`).toBeGreaterThanOrEqual(minLon);
      expect(lon, `${s.name} lon`).toBeLessThanOrEqual(maxLon);
      expect(lat, `${s.name} lat`).toBeGreaterThanOrEqual(minLat);
      expect(lat, `${s.name} lat`).toBeLessThanOrEqual(maxLat);
    }
  });

  it('el orden de estaciones es consistente (0..n-1, sin huecos ni repetidos)', () => {
    for (const line of LINES) {
      const orders = line.stations.map((s) => s.order);
      expect(orders, `orden ${line.id}`).toEqual(orders.map((_, i) => i));
    }
  });

  it('los ids de estación son únicos globalmente', () => {
    const ids = getAllStations().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('usa los colores oficiales del §13', () => {
    for (const line of LINES) {
      expect(line.color, `color ${line.id}`).toBe(EXPECTED_COLORS[line.id]);
    }
  });

  it('respeta tildes en nombres oficiales', () => {
    const names = getAllStations().map((s) => s.name);
    expect(names).toContain('Perú');
    expect(names).toContain('Sáenz Peña');
    expect(names).toContain('Congreso de Tucumán');
  });

  it('marca las combinaciones 9 de Julio ↔ Diagonal Norte ↔ Carlos Pellegrini', () => {
    const byName = (n: string) => getAllStations().find((s) => s.name === n);
    expect(byName('9 de Julio')?.transfers.sort()).toEqual(['B', 'C']);
    expect(byName('Diagonal Norte')?.transfers.sort()).toEqual(['B', 'D']);
    expect(byName('Carlos Pellegrini')?.transfers.sort()).toEqual(['C', 'D']);
  });
});
