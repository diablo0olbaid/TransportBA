import type { TransitAdapter } from '../adapter.js';
import { LINES } from '../static/index.js';
import { activeAlerts, delayedLinesFromAlerts } from './alerts.js';
import { simulateSubteArrivals, simulateSubtePositions } from './subte.js';
import { simulateColectivos, AVAILABLE_BUS_LINES } from './colectivos.js';
import { simulateBikeStations } from './ecobici.js';

/**
 * Adapter de mocks (§8). Simula posiciones, arribos, alertas, colectivos y
 * Ecobici a partir del tiempo actual de forma determinista (semilla). La app
 * se ve "viva" sin credenciales ni proxy.
 */
export function createMockAdapter(seed: number): TransitAdapter {
  const delayedNow = (now: number) => delayedLinesFromAlerts(activeAlerts(now, seed));

  return {
    getLines: async () => LINES,
    getSubtePositions: async () => {
      const now = Date.now();
      return simulateSubtePositions(now, seed, delayedNow(now));
    },
    getArrivals: async (stationId) => {
      const now = Date.now();
      return simulateSubteArrivals(now, seed, stationId, delayedNow(now));
    },
    getAlerts: async () => activeAlerts(Date.now(), seed),
    // Lista vacía = todas las líneas disponibles (§9: prender la capa muestra todo).
    getBusPositions: async (lineIds) =>
      simulateColectivos(Date.now(), seed, lineIds.length ? lineIds : AVAILABLE_BUS_LINES),
    // Trenes metropolitanos: sin datos en el mock de M3 (no listados en §8);
    // el adapter live los cubrirá en M6.
    getTrainPositions: async () => [],
    getBikeStations: async () => simulateBikeStations(Date.now(), seed),
  };
}
