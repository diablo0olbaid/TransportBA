import type { Arrival } from './domain.js';

/**
 * Parser del `forecastGTFS` de subte del GCBA (JSON propietario). Formato real
 * confirmado contra la API: `{ Header, Entity: [{ Linea: { Trip_Id, Route_Id,
 * Direction_ID, Estaciones: [{ stop_id, stop_name, arrival:{time}, ... }] }}]}`.
 */
interface ForecastEstacion {
  stop_id?: string;
  stop_name?: string;
  arrival?: { time?: number; delay?: number };
  departure?: { time?: number; delay?: number };
}
interface ForecastEntity {
  Linea?: {
    Trip_Id?: string;
    Route_Id?: string;
    Direction_ID?: number;
    Estaciones?: ForecastEstacion[];
  };
}
interface ForecastResponse {
  Entity?: ForecastEntity[];
}

/** Los stop_id vienen con sufijo de andén (ej. "1059N"); la estación es "1059". */
export function stripPlatform(stopId: string): string {
  return stopId.replace(/[A-Za-z]+$/, '');
}

/** Convierte el forecast del GCBA en arribos normalizados. */
export function parseSubteForecast(raw: unknown, nowMs: number = Date.now()): Arrival[] {
  const data = raw as ForecastResponse;
  const nowSec = Math.floor(nowMs / 1000);
  const out: Arrival[] = [];

  for (const ent of data.Entity ?? []) {
    const linea = ent.Linea;
    if (!linea) continue;
    const lineId = (linea.Route_Id ?? '').replace(/^Linea/i, '');
    const direction = linea.Direction_ID === 1 ? 1 : 0;
    const tripId = linea.Trip_Id ?? null;
    const estaciones = linea.Estaciones ?? [];
    const destination = estaciones[estaciones.length - 1]?.stop_name ?? '';

    for (const e of estaciones) {
      const time = e.arrival?.time ?? e.departure?.time;
      if (time == null || !e.stop_id) continue;
      const eta = time - nowSec;
      if (eta < -60 || eta > 3600) continue;
      out.push({
        stationId: stripPlatform(e.stop_id),
        lineId,
        direction,
        destination,
        etaSeconds: Math.max(0, Math.round(eta)),
        tripId,
        isEstimate: true,
      });
    }
  }

  out.sort((a, b) => a.etaSeconds - b.etaSeconds);
  return out;
}
