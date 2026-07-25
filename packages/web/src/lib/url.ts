import type { LayerVisibility } from '../store/useTransitStore.js';

/** Estado de UI reflejado en la URL (§12): `?lines=A,D&station=id&layers=subte,ecobici`. */
export interface UrlState {
  lines: string[];
  station: string | null;
  layers: LayerVisibility;
  buses: string[];
}

const ALL_LAYERS: (keyof LayerVisibility)[] = ['subte', 'colectivos', 'trenes', 'ecobici'];

export function parseUrlState(search: string): Partial<UrlState> {
  const params = new URLSearchParams(search);
  const out: Partial<UrlState> = {};

  const lines = params.get('lines');
  if (lines !== null) out.lines = lines.split(',').filter(Boolean);

  const station = params.get('station');
  if (station) out.station = station;

  const buses = params.get('buses');
  if (buses !== null) out.buses = buses.split(',').filter(Boolean);

  const layers = params.get('layers');
  if (layers !== null) {
    const on = new Set(layers.split(',').filter(Boolean));
    out.layers = {
      subte: on.has('subte'),
      colectivos: on.has('colectivos'),
      trenes: on.has('trenes'),
      ecobici: on.has('ecobici'),
    };
  }

  return out;
}

export function serializeUrlState(state: UrlState): string {
  const params = new URLSearchParams();
  if (state.lines.length) params.set('lines', state.lines.join(','));
  if (state.station) params.set('station', state.station);
  if (state.buses.length) params.set('buses', state.buses.join(','));

  const activeLayers = ALL_LAYERS.filter((l) => state.layers[l]);
  // Sólo se serializa si difiere del default (sólo subte).
  const isDefault = activeLayers.length === 1 && activeLayers[0] === 'subte';
  if (!isDefault) params.set('layers', activeLayers.join(','));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
