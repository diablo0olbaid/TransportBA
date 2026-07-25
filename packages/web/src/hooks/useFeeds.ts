import { useEffect, useRef, useState } from 'react';
import type { TrainPosition } from '@ba-transit/shared';
import { getAdapter } from '../data/adapter.js';

/**
 * Polling simple de un feed del adapter, pausado cuando la pestaña está oculta
 * y con refetch inmediato al volver (§11). En M4 se reemplaza por TanStack Query.
 */
function usePolledFeed<T>(fetcher: () => Promise<T>, intervalMs: number, initial: T): T {
  const [data, setData] = useState<T>(initial);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const tick = async () => {
      try {
        const next = await fetcherRef.current();
        if (!cancelled) setData(next);
      } catch {
        // Feed independiente: un error no debe tumbar el resto (§11).
      }
    };

    const start = () => {
      if (timer) return;
      void tick();
      timer = setInterval(() => void tick(), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);

  return data;
}

const EMPTY: TrainPosition[] = [];

export function useSubtePositions(intervalMs = 15000): TrainPosition[] {
  return usePolledFeed(() => getAdapter().getSubtePositions(), intervalMs, EMPTY);
}
