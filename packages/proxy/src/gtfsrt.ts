import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { Arrival, ServiceAlert, VehiclePosition, Mode } from './domain.js';

const { FeedMessage, Alert } = GtfsRealtimeBindings.transit_realtime;

/** Decodifica un buffer protobuf GTFS-RT a un FeedMessage. */
export function decodeFeed(buffer: Uint8Array): GtfsRealtimeBindings.transit_realtime.FeedMessage {
  return FeedMessage.decode(buffer);
}

function toMillis(time: unknown): number {
  if (time == null) return Date.now();
  // Los timestamps GTFS-RT vienen en segundos (pueden ser Long).
  const n =
    typeof time === 'object' && 'toNumber' in time
      ? (time as { toNumber(): number }).toNumber()
      : Number(time);
  return n > 1e12 ? n : n * 1000;
}

/** Decodifica posiciones de vehículos (colectivos/trenes) → VehiclePosition[]. */
export function decodeVehiclePositions(buffer: Uint8Array, mode: Mode): VehiclePosition[] {
  const feed = decodeFeed(buffer);
  const out: VehiclePosition[] = [];
  for (const entity of feed.entity) {
    const v = entity.vehicle;
    if (!v?.position) continue;
    const lineId = v.trip?.routeId ?? '';
    out.push({
      id: entity.id || v.vehicle?.id || `${mode}-${out.length}`,
      mode,
      lineId,
      lineLabel: v.trip?.routeId ?? lineId,
      coord: [v.position.longitude, v.position.latitude],
      bearing: v.position.bearing ?? null,
      speedKmh: v.position.speed != null ? Math.round(v.position.speed * 3.6) : null,
      timestamp: toMillis(v.timestamp),
    });
  }
  return out;
}

/** Decodifica arribos (trip updates) → Arrival[]. */
export function decodeTripUpdates(
  buffer: Uint8Array,
  lineIdOf?: (routeId: string) => string,
): Arrival[] {
  const feed = decodeFeed(buffer);
  const out: Arrival[] = [];
  for (const entity of feed.entity) {
    const tu = entity.tripUpdate;
    if (!tu) continue;
    const routeId = tu.trip?.routeId ?? '';
    const lineId = lineIdOf ? lineIdOf(routeId) : routeId;
    const direction = (tu.trip?.directionId ?? 0) === 1 ? 1 : 0;
    for (const stu of tu.stopTimeUpdate ?? []) {
      const arrivalTime = stu.arrival?.time;
      if (arrivalTime == null || !stu.stopId) continue;
      const etaSeconds = Math.max(0, Math.round((toMillis(arrivalTime) - Date.now()) / 1000));
      out.push({
        stationId: stu.stopId,
        lineId,
        direction,
        destination: tu.trip?.tripId ?? '',
        etaSeconds,
        tripId: tu.trip?.tripId ?? null,
        isEstimate: true,
      });
    }
  }
  return out;
}

const SEVERITY_MAP: Record<string, ServiceAlert['severity']> = {
  UNKNOWN_SEVERITY: 'info',
  INFO: 'info',
  WARNING: 'warning',
  SEVERE: 'severe',
};

/** Decodifica alertas de servicio → ServiceAlert[]. */
export function decodeServiceAlerts(
  buffer: Uint8Array,
  mode: Mode,
  lineIdOf?: (routeId: string) => string,
): ServiceAlert[] {
  const feed = decodeFeed(buffer);
  const out: ServiceAlert[] = [];
  for (const entity of feed.entity) {
    const a = entity.alert;
    if (!a) continue;
    const affected = new Set<string>();
    for (const ie of a.informedEntity ?? []) {
      if (ie.routeId) affected.add(lineIdOf ? lineIdOf(ie.routeId) : ie.routeId);
    }
    const period = a.activePeriod?.[0];
    // severityLevel puede venir como número de enum o como nombre.
    const severityName =
      typeof a.severityLevel === 'number'
        ? (Alert.SeverityLevel[a.severityLevel] ?? 'INFO')
        : String(a.severityLevel ?? 'INFO');
    out.push({
      id: entity.id || `alert-${out.length}`,
      mode,
      affectedLines: [...affected],
      severity: SEVERITY_MAP[severityName] ?? 'info',
      title: a.headerText?.translation?.[0]?.text ?? 'Alerta de servicio',
      description: a.descriptionText?.translation?.[0]?.text ?? '',
      activeFrom: period?.start != null ? toMillis(period.start) : Date.now(),
      activeUntil: period?.end != null ? toMillis(period.end) : null,
    });
  }
  return out;
}
