import { Layer, Source } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { hashString } from '../../lib/rng.js';
import { useBusPositionsQuery } from '../../hooks/useQueries.js';
import { useInterpolatedPositions } from '../../hooks/useInterpolatedPositions.js';
import { useTransitStore } from '../../store/useTransitStore.js';

const UPDATE_INTERVAL_MS = 15000;

/** Color derivado del hash del número de línea (§9). */
function colorForLine(label: string): string {
  const hue = hashString(label) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/** Colectivos moviéndose sobre sus trazas, filtrables por línea (§9). */
export function BusLayer(): JSX.Element | null {
  const busLines = useTransitStore((s) => s.busLines);
  const enabled = useTransitStore((s) => s.layers.colectivos);
  const targets = useBusPositionsQuery(busLines, enabled).data ?? [];
  const interpolated = useInterpolatedPositions(
    targets.map((v) => ({ id: v.id, coord: v.coord, bearing: v.bearing ?? 0, item: v })),
    UPDATE_INTERVAL_MS,
  );

  if (!enabled) return null;

  const features: Feature<Point>[] = interpolated.map((t) => ({
    type: 'Feature',
    properties: {
      color: colorForLine(t.item.item.lineLabel),
      opacity: t.opacity,
    },
    geometry: { type: 'Point', coordinates: t.coord },
  }));
  const data: FeatureCollection<Point> = { type: 'FeatureCollection', features };

  const radius: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    2,
    14,
    4,
    16,
    6,
  ];

  return (
    <Source id="buses" type="geojson" data={data}>
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
  );
}
