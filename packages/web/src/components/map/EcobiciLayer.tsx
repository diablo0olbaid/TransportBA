import { Layer, Source } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { useBikeStationsQuery } from '../../hooks/useQueries.js';
import { useTransitStore } from '../../store/useTransitStore.js';

/**
 * Estaciones de Ecobici con relleno proporcional a la disponibilidad (§9).
 * El clustering con supercluster queda para M7 (performance).
 */
export function EcobiciLayer(): JSX.Element | null {
  const enabled = useTransitStore((s) => s.layers.ecobici);
  const stations = useBikeStationsQuery(enabled).data ?? [];

  if (!enabled) return null;

  const features: Feature<Point>[] = stations.map((s) => ({
    type: 'Feature',
    properties: {
      ratio: s.capacity > 0 ? (s.bikesAvailable + s.ebikesAvailable) / s.capacity : 0,
    },
    geometry: { type: 'Point', coordinates: s.coord },
  }));
  const data: FeatureCollection<Point> = { type: 'FeatureCollection', features };

  // Color: rojo (vacía) → verde (llena) según ratio.
  const color: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['get', 'ratio'],
    0,
    '#F87171',
    0.5,
    '#FBBF24',
    1,
    '#34D399',
  ];
  const radius: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['zoom'],
    11,
    2.5,
    14,
    5,
    16,
    8,
  ];

  return (
    <Source id="ecobici" type="geojson" data={data}>
      <Layer
        id="ecobici-dots"
        type="circle"
        paint={{
          'circle-radius': radius,
          'circle-color': color,
          'circle-opacity': 0.85,
          'circle-stroke-color': '#0B0E14',
          'circle-stroke-width': 1,
        }}
      />
    </Source>
  );
}
