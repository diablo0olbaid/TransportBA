import type {
  Arrival,
  BikeStation,
  HealthResponse,
  ServiceAlert,
  TrainPosition,
  TransitLine,
  VehiclePosition,
} from '@ba-transit/shared';
import type { TransitAdapter } from '../adapter.js';
import { LINES } from '../static/index.js';

/** Adapter live: consume el proxy (§5). Las líneas salen de los datos estáticos. */
export function createLiveAdapter(proxyUrl: string): TransitAdapter {
  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${proxyUrl}${path}`);
    if (!res.ok) throw new Error(`proxy ${res.status} en ${path}`);
    return (await res.json()) as T;
  }

  return {
    getLines: async (): Promise<TransitLine[]> => LINES,
    getSubtePositions: () => get<TrainPosition[]>('/v1/subte/positions'),
    getArrivals: (stationId) =>
      get<Arrival[]>(
        `/v1/subte/arrivals${stationId ? `?station=${encodeURIComponent(stationId)}` : ''}`,
      ),
    getAlerts: () => get<ServiceAlert[]>('/v1/subte/alerts'),
    getBusPositions: (lineIds) =>
      get<VehiclePosition[]>(`/v1/colectivos/positions?lines=${lineIds.join(',')}`),
    getTrainPositions: () => get<VehiclePosition[]>('/v1/trenes/positions'),
    getBikeStations: () => get<BikeStation[]>('/v1/ecobici/stations'),
  };
}

/** Consulta la salud del proxy para decidir el modo efectivo (§16, M6). */
export async function probeProxyHealth(proxyUrl: string): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${proxyUrl}/v1/health`);
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}
