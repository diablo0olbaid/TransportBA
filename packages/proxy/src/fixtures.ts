import type {
  Arrival,
  BikeStation,
  ServiceAlert,
  TrainPosition,
  VehiclePosition,
} from './domain.js';

/**
 * Fixtures para el modo mock del Worker (§5): si no hay credenciales, las rutas
 * responden estos datos para que `pnpm dev` funcione sin setup. Son muestras
 * pequeñas y válidas, no un simulador (ese vive en el cliente).
 */
const now = () => Date.now();

export function fixtureSubtePositions(): TrainPosition[] {
  return [
    {
      id: 'subte-A-0',
      lineId: 'A',
      coord: [-58.4008, -34.6098],
      bearing: 270,
      direction: 0,
      nextStationId: '1073',
      progress: 0.4,
      status: 'moving',
      source: 'derived',
      timestamp: now(),
    },
    {
      id: 'subte-D-0',
      lineId: 'D',
      coord: [-58.3819, -34.6037],
      bearing: 315,
      direction: 1,
      nextStationId: null,
      progress: 0.1,
      status: 'at_station',
      source: 'derived',
      timestamp: now(),
    },
  ];
}

export function fixtureArrivals(): Arrival[] {
  return [
    { stationId: '1076', lineId: 'A', direction: 0, destination: 'San Pedrito', etaSeconds: 90, tripId: 'A-1', isEstimate: true }, // prettier-ignore
    { stationId: '1076', lineId: 'A', direction: 1, destination: 'Plaza de Mayo', etaSeconds: 210, tripId: 'A-2', isEstimate: true }, // prettier-ignore
  ];
}

export function fixtureAlerts(): ServiceAlert[] {
  return [
    {
      id: 'fx-alert-1',
      mode: 'subte',
      affectedLines: ['B'],
      severity: 'warning',
      title: 'Demoras en la Línea B',
      description: 'Servicio con demoras por razones operativas.',
      activeFrom: now() - 600000,
      activeUntil: null,
    },
  ];
}

export function fixtureBusPositions(lineIds: string[]): VehiclePosition[] {
  const lines = lineIds.length > 0 ? lineIds : ['7'];
  return lines.map((label, i) => ({
    id: `bus-${label}-0`,
    mode: 'colectivo' as const,
    lineId: `col-${label}`,
    lineLabel: label,
    coord: [-58.42 + i * 0.005, -34.6 + i * 0.003],
    bearing: 45,
    speedKmh: 24,
    timestamp: now(),
  }));
}

export function fixtureTrainPositions(): VehiclePosition[] {
  return [
    {
      id: 'tren-mitre-0',
      mode: 'tren',
      lineId: 'mitre',
      lineLabel: 'Mitre',
      coord: [-58.45, -34.55],
      bearing: 20,
      speedKmh: 45,
      timestamp: now(),
    },
  ];
}

export function fixtureBikeStations(): BikeStation[] {
  return [
    {
      id: 'eco-1',
      name: 'Plaza San Martín',
      coord: [-58.375, -34.594],
      bikesAvailable: 8,
      ebikesAvailable: 2,
      docksAvailable: 10,
      capacity: 20,
      isRenting: true,
      isReturning: true,
      lastReported: now() - 30000,
    },
  ];
}
