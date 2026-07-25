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

export function resolveProxyUrl(): string {
  return import.meta.env.VITE_PROXY_URL ?? 'http://localhost:8787';
}

let cached: TransitAdapter | null = null;
let override: TransitAdapter | null = null;

/** Devuelve el adapter efectivo: override (fallback) > configurado, memoizado. */
export function getAdapter(): TransitAdapter {
  if (override) return override;
  if (!cached) {
    cached =
      resolveDataSource() === 'live'
        ? createLiveAdapter(resolveProxyUrl())
        : createMockAdapter(resolveSeed());
  }
  return cached;
}

/** Fuerza un adapter (caída elegante a mock cuando el proxy no está, M6). */
export function setAdapterOverride(impl: TransitAdapter | null): void {
  override = impl;
}

/** Crea un adapter mock a demanda (para el fallback). */
export function createFallbackMock(): TransitAdapter {
  return createMockAdapter(resolveSeed());
}
