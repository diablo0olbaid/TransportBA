import { useEffect, useRef } from 'react';
import { useTransitStore } from '../store/useTransitStore.js';
import { parseUrlState, serializeUrlState } from '../lib/url.js';

/**
 * Sincroniza el estado de UI con la URL (§12): al montar restaura desde la
 * query string; luego refleja los cambios con `replaceState` (compartible y
 * restaurable al recargar).
 */
export function useUrlState(): void {
  const hydrated = useRef(false);

  // Hidratar una vez desde la URL.
  useEffect(() => {
    const parsed = parseUrlState(window.location.search);
    const store = useTransitStore.getState();
    if (parsed.lines) store.setSelectedLines(parsed.lines);
    if (parsed.buses) store.setBusLines(parsed.buses);
    if (parsed.layers) store.setLayers(parsed.layers);
    if (parsed.station) store.selectStation(parsed.station);
    hydrated.current = true;
  }, []);

  // Reflejar cambios en la URL.
  useEffect(() => {
    const unsub = useTransitStore.subscribe((s) => {
      if (!hydrated.current) return;
      const qs = serializeUrlState({
        lines: s.selectedLines,
        station: s.selectedStationId,
        layers: s.layers,
        buses: s.busLines,
      });
      const url = `${window.location.pathname}${qs}`;
      window.history.replaceState(null, '', url);
    });
    return unsub;
  }, []);
}
