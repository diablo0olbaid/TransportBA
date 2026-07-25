import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { hashString } from '../../lib/rng.js';
import { useBusPositionsQuery } from '../../hooks/useQueries.js';
import { useInterpolatedPositions } from '../../hooks/useInterpolatedPositions.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import colectivoLines from '../../data/static/colectivo-lines.json';

interface ColectivoLine {
  id: string;
  label: string;
  shape: [number, number][];
}
const SHAPES = new Map((colectivoLines as ColectivoLine[]).map((l) => [l.label, l.shape]));

/** Color estable derivado del número de línea (§9). */
function colorForLine(label: string): string {
  const hue = hashString(label || 'bus') % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/** Colectivos en vivo + recorrido de las líneas filtradas (§9). */
export function BusLayer(): JSX.Element {
  const busLines = useTransitStore((s) => s.busLines);
  const enabled = useTransitStore((s) => s.layers.colectivos);
  const interval = useTransitStore((s) => s.autoRefresh) ?? 30000;
  const query = useBusPositionsQuery(busLines, enabled);

  // Lista estable entre frames: sólo cambia cuando llega data nueva (clave para
  // que la interpolación anime en vez de reiniciarse en cada frame).
  const targets = useMemo(
    () =>
      (query.data ?? []).map((v) => ({
        id: v.id,
        coord: v.coord,
        bearing: v.bearing ?? 0,
        label: v.lineLabel,
      })),
    [query.data],
  );
  const interpolated = useInterpolatedPositions(targets, interval);

  const busFeatures: Feature<Point>[] = interpolated.map((t) => ({
    type: 'Feature',
    properties: { color: colorForLine(t.item.label), opacity: t.opacity },
    geometry: { type: 'Point', coordinates: t.coord },
  }));
  const busData: FeatureCollection<Point> = { type: 'FeatureCollection', features: busFeatures };

  // Recorridos de las líneas filtradas que tienen traza disponible.
  const routeFeatures: Feature<LineString>[] = busLines
    .filter((l) => SHAPES.has(l))
    .map((l) => ({
      type: 'Feature',
      properties: { color: colorForLine(l) },
      geometry: { type: 'LineString', coordinates: SHAPES.get(l)! },
    }));
  const routeData: FeatureCollection<LineString> = {
    type: 'FeatureCollection',
    features: routeFeatures,
  };

  const radius: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 11, 2.5, 14, 4.5, 16, 7]; // prettier-ignore

  return (
    <>
      <Source id="bus-routes" type="geojson" data={routeData}>
        <Layer
          id="bus-route-lines"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.6 }}
        />
      </Source>
      <Source id="buses" type="geojson" data={busData}>
        <Layer
          id="bus-dots"
          type="circle"
          paint={{
            'circle-radius': radius,
            'circle-color': ['get', 'color'],
            'circle-opacity': ['get', 'opacity'],
            'circle-stroke-color': '#0B0E14',
            'circle-stroke-width': 1,
          }}
        />
      </Source>
    </>
  );
}
