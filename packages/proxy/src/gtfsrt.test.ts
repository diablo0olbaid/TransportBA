import { describe, it, expect } from 'vitest';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { decodeVehiclePositions, decodeServiceAlerts } from './gtfsrt.js';

const { FeedMessage, Alert } = GtfsRealtimeBindings.transit_realtime;

function encodeFeed(entity: unknown[]): Uint8Array {
  const msg = FeedMessage.create({
    header: { gtfsRealtimeVersion: '2.0' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload de prueba
    entity: entity as any,
  });
  return FeedMessage.encode(msg).finish();
}

describe('gtfsrt · decodeVehiclePositions', () => {
  it('decodifica posición, rumbo y velocidad', () => {
    const buf = encodeFeed([
      {
        id: 'v1',
        vehicle: {
          trip: { routeId: '7' },
          position: { latitude: -34.6, longitude: -58.4, bearing: 90, speed: 10 },
          timestamp: 1_600_000_000,
          vehicle: { id: 'bus1' },
        },
      },
    ]);
    const result = decodeVehiclePositions(buf, 'colectivo');
    expect(result).toHaveLength(1);
    expect(result[0]!.coord[0]).toBeCloseTo(-58.4, 4);
    expect(result[0]!.coord[1]).toBeCloseTo(-34.6, 4);
    expect(result[0]!.bearing).toBe(90);
    expect(result[0]!.speedKmh).toBe(36); // 10 m/s → 36 km/h
    expect(result[0]!.mode).toBe('colectivo');
    expect(result[0]!.lineLabel).toBe('7');
  });

  it('ignora entidades sin posición', () => {
    const buf = encodeFeed([{ id: 'x', vehicle: { trip: { routeId: '1' } } }]);
    expect(decodeVehiclePositions(buf, 'tren')).toHaveLength(0);
  });
});

describe('gtfsrt · decodeServiceAlerts', () => {
  it('decodifica severidad, líneas afectadas y textos', () => {
    const buf = encodeFeed([
      {
        id: 'a1',
        alert: {
          severityLevel: Alert.SeverityLevel.SEVERE,
          informedEntity: [{ routeId: 'LineaB' }],
          headerText: { translation: [{ text: 'Demoras', language: 'es' }] },
          descriptionText: { translation: [{ text: 'Descripción', language: 'es' }] },
          activePeriod: [{ start: 1_600_000_000 }],
        },
      },
    ]);
    const alerts = decodeServiceAlerts(buf, 'subte', (r) => r.replace(/^Linea/, ''));
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.severity).toBe('severe');
    expect(alerts[0]!.affectedLines).toEqual(['B']);
    expect(alerts[0]!.title).toBe('Demoras');
  });
});
