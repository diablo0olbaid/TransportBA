import { useCallback, useEffect, useMemo, useRef } from 'react';
import Map, {
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { ExpressionSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LINES } from '../../data/static/index.js';
import { boundsOfLines, buildLinesGeoJSON, buildStationsGeoJSON } from '../../lib/geo.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { BASEMAP_STYLE } from './basemaps.js';

const DIM_OPACITY = 0.12;
const FIT_PADDING = 64;

// Radio de estación escalado por zoom (§9: "círculos escalados por zoom").
const STATION_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  10,
  1.6,
  13,
  3.5,
  16,
  6.5,
];

export function MapView(): JSX.Element {
  const mapRef = useRef<MapRef>(null);
  const theme = useTransitStore((s) => s.theme);
  const selectedLines = useTransitStore((s) => s.selectedLines);
  const selectLine = useTransitStore((s) => s.selectLine);
  const clearSelection = useTransitStore((s) => s.clearSelection);

  const linesGeo = useMemo(() => buildLinesGeoJSON(LINES), []);
  const stationsGeo = useMemo(() => buildStationsGeoJSON(LINES), []);
  const cabaBounds = useMemo(() => boundsOfLines(LINES), []);

  // Opacidad por selección: las líneas no seleccionadas se atenúan (§9).
  const opacity: ExpressionSpecification | number =
    selectedLines.length === 0 ? 1 : ['match', ['get', 'lineId'], selectedLines, 1, DIM_OPACITY];

  // fitBounds: a la selección (con padding) o a toda CABA si no hay selección.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof map.fitBounds !== 'function') return;
    const target =
      selectedLines.length === 0
        ? cabaBounds
        : boundsOfLines(LINES.filter((l) => selectedLines.includes(l.id)));
    if (target) map.fitBounds(target, { padding: FIT_PADDING, duration: 700 });
  }, [selectedLines, cabaBounds]);

  const onLoad = useCallback(() => {
    const map = mapRef.current;
    if (map && cabaBounds && typeof map.fitBounds === 'function') {
      map.fitBounds(cabaBounds, { padding: FIT_PADDING, duration: 0 });
    }
  }, [cabaBounds]);

  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const lineId = feature?.properties?.lineId as string | undefined;
      if (lineId) {
        selectLine(lineId, e.originalEvent.metaKey || e.originalEvent.ctrlKey);
      } else {
        clearSelection();
      }
    },
    [selectLine, clearSelection],
  );

  return (
    <Map
      ref={mapRef}
      mapStyle={BASEMAP_STYLE[theme]}
      initialViewState={{ longitude: -58.44, latitude: -34.61, zoom: 11 }}
      interactiveLayerIds={['line-traces', 'station-dots']}
      onLoad={onLoad}
      onClick={onClick}
      cursor="auto"
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      <Source id="lines" type="geojson" data={linesGeo}>
        <Layer
          id="line-traces"
          type="line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-opacity': opacity,
          }}
        />
      </Source>

      <Source id="stations" type="geojson" data={stationsGeo}>
        {/* Doble anillo para combinaciones (§9). */}
        <Layer
          id="station-transfer-ring"
          type="circle"
          filter={['==', ['get', 'isTransfer'], true]}
          paint={{
            'circle-radius': ['+', STATION_RADIUS, 3] as ExpressionSpecification,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': '#E6EAF2',
            'circle-stroke-width': 1.5,
            'circle-stroke-opacity': opacity,
          }}
        />
        <Layer
          id="station-dots"
          type="circle"
          paint={{
            'circle-radius': STATION_RADIUS,
            'circle-color': ['get', 'color'],
            'circle-stroke-color': '#0B0E14',
            'circle-stroke-width': 1,
            'circle-opacity': opacity,
            'circle-stroke-opacity': opacity,
          }}
        />
      </Source>
    </Map>
  );
}
