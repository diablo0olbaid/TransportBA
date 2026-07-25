import { describe, it, expect } from 'vitest';
import { boundsOfCoords, boundsOfLines, buildLinesGeoJSON, buildStationsGeoJSON } from './geo.js';
import { LINES } from '../data/static/index.js';

describe('lib/geo', () => {
  it('boundsOfCoords devuelve [[minLon,minLat],[maxLon,maxLat]]', () => {
    const b = boundsOfCoords([
      [-58.4, -34.6],
      [-58.3, -34.5],
      [-58.5, -34.7],
    ]);
    expect(b).toEqual([
      [-58.5, -34.7],
      [-58.3, -34.5],
    ]);
  });

  it('boundsOfCoords devuelve null si no hay coordenadas', () => {
    expect(boundsOfCoords([])).toBeNull();
  });

  it('boundsOfLines cubre las trazas dentro de CABA', () => {
    const b = boundsOfLines(LINES);
    expect(b).not.toBeNull();
    const [[minLon, minLat], [maxLon, maxLat]] = b!;
    expect(minLon).toBeGreaterThan(-58.6);
    expect(maxLon).toBeLessThan(-58.2);
    expect(minLat).toBeGreaterThan(-34.75);
    expect(maxLat).toBeLessThan(-34.5);
  });

  it('buildLinesGeoJSON produce una LineString por línea con color y lineId', () => {
    const fc = buildLinesGeoJSON(LINES);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(LINES.length);
    const a = fc.features.find((f) => f.properties?.lineId === 'A');
    expect(a?.geometry.type).toBe('LineString');
    expect(a?.properties?.color).toBe('#18CCCC');
  });

  it('buildStationsGeoJSON marca las combinaciones con isTransfer', () => {
    const fc = buildStationsGeoJSON(LINES);
    const total = LINES.reduce((n, l) => n + l.stations.length, 0);
    expect(fc.features).toHaveLength(total);
    const nueveDeJulio = fc.features.find((f) => f.properties?.name === '9 de Julio');
    expect(nueveDeJulio?.properties?.isTransfer).toBe(true);
  });
});
