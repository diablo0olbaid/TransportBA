/**
 * Copia local del modelo de dominio (subconjunto usado por el proxy).
 *
 * El proxy es un paquete desplegable de forma independiente (Cloudflare
 * Workers). Para que su deploy no dependa de la resolución del workspace pnpm,
 * mantiene acá los tipos que necesita en vez de importarlos de
 * `@ba-transit/shared`. Deben mantenerse en sincronía con `packages/shared`.
 */

export type Mode = 'subte' | 'colectivo' | 'tren' | 'ecobici';

export interface TrainPosition {
  id: string;
  lineId: string;
  coord: [number, number];
  bearing: number;
  direction: 0 | 1;
  nextStationId: string | null;
  progress: number;
  status: 'moving' | 'at_station' | 'unknown';
  source: 'realtime' | 'derived';
  timestamp: number;
}

export interface Arrival {
  stationId: string;
  lineId: string;
  direction: 0 | 1;
  destination: string;
  etaSeconds: number;
  tripId: string | null;
  isEstimate: boolean;
}

export interface ServiceAlert {
  id: string;
  mode: Mode;
  affectedLines: string[];
  severity: 'info' | 'warning' | 'severe';
  title: string;
  description: string;
  activeFrom: number;
  activeUntil: number | null;
}

export interface VehiclePosition {
  id: string;
  mode: Mode;
  lineId: string;
  lineLabel: string;
  coord: [number, number];
  bearing: number | null;
  speedKmh: number | null;
  timestamp: number;
}

export interface BikeStation {
  id: string;
  name: string;
  coord: [number, number];
  bikesAvailable: number;
  ebikesAvailable: number;
  docksAvailable: number;
  capacity: number;
  isRenting: boolean;
  isReturning: boolean;
  lastReported: number;
}

export type UpstreamHealth = 'ok' | 'degraded' | 'down';

export interface HealthResponse {
  ok: boolean;
  upstreams: Record<string, UpstreamHealth>;
}
