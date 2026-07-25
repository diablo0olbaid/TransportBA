import type { TransitAdapter } from '../adapter.js';

/**
 * Placeholder del adapter live. La implementación real contra el proxy llega en
 * M6 (incluida la caída elegante a mock sin credenciales). Hasta entonces, usar
 * `VITE_DATA_SOURCE=mock` (default).
 */
export function createLiveAdapter(): TransitAdapter {
  const notReady = (): never => {
    throw new Error('El adapter live se implementa en M6. Usá VITE_DATA_SOURCE=mock.');
  };
  return {
    getLines: async () => notReady(),
    getSubtePositions: async () => notReady(),
    getArrivals: async () => notReady(),
    getAlerts: async () => notReady(),
    getBusPositions: async () => notReady(),
    getTrainPositions: async () => notReady(),
    getBikeStations: async () => notReady(),
  };
}
