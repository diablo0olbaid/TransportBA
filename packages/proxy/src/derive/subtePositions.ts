import type { Arrival, TrainPosition } from '@ba-transit/shared';

export interface StationRef {
  id: string;
  lineId: string;
  coord: [number, number];
  order: number;
}

/**
 * Deriva posiciones de formaciones de subte a partir de arribos (forecastGTFS),
 * ya que la API no expone posiciones de vehículos de subte (§5). Para cada trip
 * se toma la próxima estación (menor ETA) y la anterior por orden, y se
 * interpola la posición según la relación de tiempos. Cada resultado se marca
 * `source: 'derived'` para que la UI lo indique.
 */
export function deriveSubtePositions(arrivals: Arrival[], stations: StationRef[]): TrainPosition[] {
  const byId = new Map(stations.map((s) => [s.id, s]));
  const byLineOrder = new Map<string, StationRef[]>();
  for (const s of stations) {
    const arr = byLineOrder.get(s.lineId) ?? [];
    arr.push(s);
    byLineOrder.set(s.lineId, arr);
  }
  for (const arr of byLineOrder.values()) arr.sort((a, b) => a.order - b.order);

  // Agrupar arribos por trip.
  const byTrip = new Map<string, Arrival[]>();
  for (const a of arrivals) {
    if (!a.tripId) continue;
    const arr = byTrip.get(a.tripId) ?? [];
    arr.push(a);
    byTrip.set(a.tripId, arr);
  }

  const out: TrainPosition[] = [];
  const now = Date.now();

  for (const [tripId, list] of byTrip) {
    list.sort((a, b) => a.etaSeconds - b.etaSeconds);
    const next = list[0];
    if (!next) continue;
    const nextStation = byId.get(next.stationId);
    if (!nextStation) continue;

    const lineStations = byLineOrder.get(nextStation.lineId) ?? [];
    const dir = next.direction;
    // Estación previa según el sentido de circulación.
    const prevOrder = dir === 0 ? nextStation.order - 1 : nextStation.order + 1;
    const prevStation = lineStations.find((s) => s.order === prevOrder) ?? nextStation;

    // Fracción recorrida: cuanto menor el ETA, más cerca de la próxima estación.
    // Se asume ~90s entre estaciones para estimar el progreso.
    const assumedSegment = 90;
    const progress = Math.min(1, Math.max(0, 1 - next.etaSeconds / assumedSegment));

    const coord: [number, number] = [
      prevStation.coord[0] + (nextStation.coord[0] - prevStation.coord[0]) * progress,
      prevStation.coord[1] + (nextStation.coord[1] - prevStation.coord[1]) * progress,
    ];
    const bearing = bearingBetween(prevStation.coord, nextStation.coord);

    out.push({
      id: `subte-${tripId}`,
      lineId: nextStation.lineId,
      coord,
      bearing: Math.round(bearing),
      direction: dir,
      nextStationId: nextStation.id,
      progress: Number(progress.toFixed(3)),
      status: next.etaSeconds <= 5 ? 'at_station' : 'moving',
      source: 'derived',
      timestamp: now,
    });
  }

  return out;
}

function bearingBetween(a: [number, number], b: [number, number]): number {
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
