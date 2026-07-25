import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { TransitLine } from '@ba-transit/shared';

/** `[[minLon, minLat], [maxLon, maxLat]]`, el formato que espera `fitBounds`. */
export type Bounds = [[number, number], [number, number]];

export function boundsOfCoords(coords: [number, number][]): Bounds | null {
  if (coords.length === 0) return null;
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}

/** Bounds que cubren las trazas y estaciones de las líneas dadas. */
export function boundsOfLines(lines: TransitLine[]): Bounds | null {
  const coords: [number, number][] = [];
  for (const line of lines) {
    coords.push(...line.shape);
    for (const s of line.stations) coords.push(s.coord);
  }
  return boundsOfCoords(coords);
}

/** FeatureCollection de trazas (una LineString por línea). */
export function buildLinesGeoJSON(lines: TransitLine[]): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = lines.map((line) => ({
    type: 'Feature',
    properties: { lineId: line.id, color: line.color },
    geometry: { type: 'LineString', coordinates: line.shape },
  }));
  return { type: 'FeatureCollection', features };
}

/** FeatureCollection de estaciones (un Point por estación). */
export function buildStationsGeoJSON(lines: TransitLine[]): FeatureCollection<Point> {
  const features: Feature<Point>[] = [];
  for (const line of lines) {
    for (const s of line.stations) {
      features.push({
        type: 'Feature',
        properties: {
          stationId: s.id,
          lineId: line.id,
          name: s.name,
          color: line.color,
          isTransfer: s.transfers.length > 0,
        },
        geometry: { type: 'Point', coordinates: s.coord },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}
