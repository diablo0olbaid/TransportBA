import { Layer, Source } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { LINES } from '../../data/static/index.js';
import { useSubtePositions } from '../../hooks/useFeeds.js';
import { useInterpolatedPositions } from '../../hooks/useInterpolatedPositions.js';
import { useTransitStore } from '../../store/useTransitStore.js';

const UPDATE_INTERVAL_MS = 15000;
const COLOR_BY_LINE = new Map(LINES.map((l) => [l.id, l.color]));

const TRAIN_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  10,
  3,
  13,
  5.5,
  16,
  9,
];

/**
 * Capa de formaciones de subte moviéndose con interpolación suave (§10).
 * Renderiza sobre una fuente GeoJSON que se actualiza cada frame.
 */
export function TrainsLayer(): JSX.Element {
  const targets = useSubtePositions(UPDATE_INTERVAL_MS);
  const interpolated = useInterpolatedPositions(targets, UPDATE_INTERVAL_MS);
  const selectedLines = useTransitStore((s) => s.selectedLines);

  const features: Feature<Point>[] = interpolated.map((t) => ({
    type: 'Feature',
    properties: {
      trainId: t.item.id,
      lineId: t.item.lineId,
      color: COLOR_BY_LINE.get(t.item.lineId) ?? '#8B95A7',
      opacity: t.opacity,
      isDerived: t.item.source === 'derived',
    },
    geometry: { type: 'Point', coordinates: t.coord },
  }));
  const data: FeatureCollection<Point> = { type: 'FeatureCollection', features };

  const selectionFactor: ExpressionSpecification | number =
    selectedLines.length === 0 ? 1 : ['match', ['get', 'lineId'], selectedLines, 1, 0.12];
  const opacity: ExpressionSpecification = ['*', ['get', 'opacity'], selectionFactor];

  return (
    <Source id="trains" type="geojson" data={data}>
      <Layer
        id="train-dots"
        type="circle"
        paint={{
          'circle-radius': TRAIN_RADIUS,
          'circle-color': ['get', 'color'],
          'circle-opacity': opacity,
          'circle-stroke-color': '#0B0E14',
          'circle-stroke-width': 2,
          'circle-stroke-opacity': opacity,
        }}
      />
    </Source>
  );
}
