import type {
  Arrival,
  BikeStation,
  ServiceAlert,
  TrainPosition,
  TransitLine,
  VehiclePosition,
} from '@ba-transit/shared';
import { createMockAdapter } from './mock/index.js';
import { createLiveAdapter } from './live/index.js';

/**
 * Única superficie de datos que consume la UI (§8). Ningún componente importa
 * `mock/` ni `live/` directamente: siempre pasan por `getAdapter()`.
 */
export interface TransitAdapter {
  getLines(): Promise<TransitLine[]>;
  getSubtePositions(): Promise<TrainPosition[]>;
  getArrivals(stationId?: string): Promise<Arrival[]>;
  getAlerts(): Promise<ServiceAlert[]>;
  getBusPositions(lineIds: string[]): Promise<VehiclePosition[]>;
  getTrainPositions(): Promise<VehiclePosition[]>;
  getBikeStations(): Promise<BikeStation[]>;
}

export type DataSource = 'mock' | 'live';

export function resolveDataSource(): DataSource {
  return import.meta.env.VITE_DATA_SOURCE === 'live' ? 'live' : 'mock';
}

export function resolveSeed(): number {
  const raw = import.meta.env.VITE_MOCK_SEED;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : 1;
}

let cached: TransitAdapter | null = null;

/** Devuelve el adapter según `VITE_DATA_SOURCE` (default `mock`), memoizado. */
export function getAdapter(): TransitAdapter {
  if (!cached) {
    cached =
      resolveDataSource() === 'live' ? createLiveAdapter() : createMockAdapter(resolveSeed());
  }
  return cached;
}
