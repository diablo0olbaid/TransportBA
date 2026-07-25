import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { hashString } from '../../lib/rng.js';
import { distanceToPolyline, expandedBbox, pointInBbox } from '../../lib/track.js';
import { useBusPositionsQuery } from '../../hooks/useQueries.js';
import { useInterpolatedPositions } from '../../hooks/useInterpolatedPositions.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import colectivoLines from '../../data/static/colectivo-lines.json';

interface ColectivoLine {
  id: string;
  label: string;
  shape: [number, number][];
}
const ALL_LINES = colectivoLines as ColectivoLine[];
const SHAPE_BY_LABEL = new Map(ALL_LINES.map((l) => [l.label, l.shape]));

/** Un colectivo se considera "de la línea" si va a ≤250 m de su recorrido. */
const PROXIMITY_METERS = 250;

function colorForLine(label: string): string {
  const hue = hashString(label || 'bus') % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Colectivos en vivo. Si se seleccionan líneas con recorrido conocido, dibuja
 * su traza y muestra sólo los coches que van sobre ella (por proximidad
 * geométrica, sin depender del id interno del feed). Sin selección, muestra
 * todos.
 */
export function BusLayer(): JSX.Element {
  const busLines = useTransitStore((s) => s.busLines);
  const enabled = useTransitStore((s) => s.layers.colectivos);
  const interval = useTransitStore((s) => s.autoRefresh) ?? 30000;
  // Siempre se piden todos; el filtrado por línea es por proximidad al recorrido.
  const query = useBusPositionsQuery([], enabled);

  // Recorridos seleccionados que tienen traza + su bbox para prefiltrar.
  const selected = useMemo(
    () =>
      busLines
        .filter((l) => SHAPE_BY_LABEL.has(l))
        .map((l) => {
          const shape = SHAPE_BY_LABEL.get(l)!;
          return { label: l, shape, bbox: expandedBbox(shape, PROXIMITY_METERS) };
        }),
    [busLines],
  );

  // Lista estable (memoizada) para que la interpolación anime en vez de reiniciar.
  const targets = useMemo(() => {
    const all = query.data ?? [];
    const filtered = selected.length
      ? all.filter((v) =>
          selected.some(
            (s) =>
              pointInBbox(v.coord, s.bbox) &&
              distanceToPolyline(v.coord, s.shape) <= PROXIMITY_METERS,
          ),
        )
      : all;
    return filtered.map((v) => ({
      id: v.id,
      coord: v.coord,
      bearing: v.bearing ?? 0,
      label: selected[0]?.label ?? v.lineLabel,
    }));
  }, [query.data, selected]);

  const interpolated = useInterpolatedPositions(targets, interval);

  const busFeatures: Feature<Point>[] = interpolated.map((t) => ({
    type: 'Feature',
    properties: { color: colorForLine(t.item.label), opacity: t.opacity },
    geometry: { type: 'Point', coordinates: t.coord },
  }));
  const busData: FeatureCollection<Point> = { type: 'FeatureCollection', features: busFeatures };

  const routeFeatures: Feature<LineString>[] = selected.map((s) => ({
    type: 'Feature',
    properties: { color: colorForLine(s.label) },
    geometry: { type: 'LineString', coordinates: s.shape },
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
          paint={{ 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.7 }}
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
