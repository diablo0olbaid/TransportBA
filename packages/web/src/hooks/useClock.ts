import { useEffect, useState } from 'react';

/** Reloj que se actualiza cada `intervalMs` (default 1s), para el header (§9). */
export function useClock(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
