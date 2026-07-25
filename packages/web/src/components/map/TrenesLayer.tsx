import { Layer, Source } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { hashString } from '../../lib/rng.js';
import { useTrainPositionsQuery } from '../../hooks/useQueries.js';
import { useInterpolatedPositions } from '../../hooks/useInterpolatedPositions.js';
import { useTransitStore } from '../../store/useTransitStore.js';

const UPDATE_INTERVAL_MS = 15000;

function colorForLine(label: string): string {
  const hue = hashString(label || 'tren') % 360;
  return `hsl(${hue}, 65%, 60%)`;
}

/** Trenes metropolitanos en vivo (§1). Vacío si el feed no está disponible. */
export function TrenesLayer(): JSX.Element {
  const enabled = useTransitStore((s) => s.layers.trenes);
  const targets = useTrainPositionsQuery(enabled).data ?? [];
  const interpolated = useInterpolatedPositions(
    targets.map((v) => ({ id: v.id, coord: v.coord, bearing: v.bearing ?? 0, item: v })),
    UPDATE_INTERVAL_MS,
  );

  const features: Feature<Point>[] = interpolated.map((t) => ({
    type: 'Feature',
    properties: { color: colorForLine(t.item.item.lineLabel), opacity: t.opacity },
    geometry: { type: 'Point', coordinates: t.coord },
  }));
  const data: FeatureCollection<Point> = { type: 'FeatureCollection', features };

  const radius: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['zoom'],
    10,
    3,
    14,
    5,
    16,
    8,
  ];

  return (
    <Source id="trenes" type="geojson" data={data}>
      <Layer
        id="tren-dots"
        type="circle"
        paint={{
          'circle-radius': radius,
          'circle-color': ['get', 'color'],
          'circle-opacity': ['get', 'opacity'],
          'circle-stroke-color': '#0B0E14',
          'circle-stroke-width': 1.5,
        }}
      />
    </Source>
  );
}
