import type { BikeStation } from './domain.js';

/**
 * Mezcla GBFS `stationInformation` + `stationStatus` → BikeStation[] (§5).
 * GBFS es un estándar público, así que el shape es conocido y estable.
 */
interface GbfsInformation {
  data?: {
    stations?: {
      station_id: string;
      name?: string;
      lat: number;
      lon: number;
      capacity?: number;
    }[];
  };
}

interface GbfsStatus {
  data?: {
    stations?: {
      station_id: string;
      num_bikes_available?: number;
      num_ebikes_available?: number;
      num_bikes_available_types?: { ebike?: number; mechanical?: number };
      num_docks_available?: number;
      is_renting?: number | boolean;
      is_returning?: number | boolean;
      last_reported?: number;
    }[];
  };
}

export function mergeEcobici(infoRaw: unknown, statusRaw: unknown): BikeStation[] {
  const info = infoRaw as GbfsInformation;
  const status = statusRaw as GbfsStatus;
  const statusById = new Map((status.data?.stations ?? []).map((s) => [s.station_id, s]));
  const out: BikeStation[] = [];

  for (const st of info.data?.stations ?? []) {
    const s = statusById.get(st.station_id);
    const ebikes = s?.num_ebikes_available ?? s?.num_bikes_available_types?.ebike ?? 0;
    const totalBikes = s?.num_bikes_available ?? 0;
    const capacity = st.capacity ?? 0;
    out.push({
      id: st.station_id,
      name: st.name ?? st.station_id,
      coord: [st.lon, st.lat],
      bikesAvailable: Math.max(0, totalBikes - ebikes),
      ebikesAvailable: ebikes,
      docksAvailable: s?.num_docks_available ?? Math.max(0, capacity - totalBikes),
      capacity,
      isRenting: Boolean(s?.is_renting ?? true),
      isReturning: Boolean(s?.is_returning ?? true),
      lastReported: s?.last_reported ? s.last_reported * 1000 : Date.now(),
    });
  }
  return out;
}
