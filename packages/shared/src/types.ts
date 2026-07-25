/**
 * Modelo de dominio de BA Transit Live (§6 del SPEC).
 *
 * Estos tipos son la fuente de verdad compartida entre el worker (proxy) y la
 * web. Todo lo demás se construye sobre ellos: el contrato del proxy, el
 * adapter de datos y la UI. No introducir tipos de dominio fuera de este
 * archivo sin actualizar el SPEC.
 */

/** Líneas de subte + Premetro (`P`). */
export type LineId = 'A' | 'B' | 'C' | 'D' | 'E' | 'H' | 'P';

/** Modos de transporte cubiertos por el dashboard. */
export type Mode = 'subte' | 'colectivo' | 'tren' | 'ecobici';

/** Estado de servicio de una línea. */
export type ServiceStatus = 'normal' | 'delayed' | 'partial' | 'interrupted' | 'unknown';

export interface TransitLine {
  id: string;
  mode: Mode;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
  stations: Station[];
  /** Traza del recorrido como pares `[lon, lat]`. */
  shape: [number, number][];
}

export interface Station {
  id: string;
  name: string;
  lineId: string;
  /** `[lon, lat]`. */
  coord: [number, number];
  order: number;
  accessible: boolean;
  /** Ids de otras líneas con las que combina. */
  transfers: string[];
}

export interface TrainPosition {
  id: string;
  lineId: string;
  /** `[lon, lat]`. */
  coord: [number, number];
  /** Grados, 0 = norte. */
  bearing: number;
  /** Sentido según GTFS. */
  direction: 0 | 1;
  nextStationId: string | null;
  /** 0..1 entre estación previa y próxima. */
  progress: number;
  status: 'moving' | 'at_station' | 'unknown';
  source: 'realtime' | 'derived';
  /** Epoch en milisegundos. */
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
  /** `[lon, lat]`. */
  coord: [number, number];
  bearing: number | null;
  speedKmh: number | null;
  timestamp: number;
}

export interface BikeStation {
  id: string;
  name: string;
  /** `[lon, lat]`. */
  coord: [number, number];
  bikesAvailable: number;
  ebikesAvailable: number;
  docksAvailable: number;
  capacity: number;
  isRenting: boolean;
  isReturning: boolean;
  lastReported: number;
}

/** Estado de un feed individual, para manejar carga/error/dato viejo en la UI. */
export type FeedState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; fetchedAt: number; stale: boolean }
  | { status: 'error'; error: string; lastGood?: { data: T; fetchedAt: number } };

/** Salud del proxy (§5). */
export type UpstreamHealth = 'ok' | 'degraded' | 'down';

export interface HealthResponse {
  ok: boolean;
  upstreams: Record<string, UpstreamHealth>;
}
