/**
 * Geometría de recorrido: convierte una polyline `[lon, lat][]` en una "pista"
 * con distancias acumuladas para muestrear posiciones y rumbos a lo largo de
 * ella. Base del movimiento interpolado de trenes y colectivos (§10).
 */
export interface Track {
  points: [number, number][];
  /** Distancia acumulada (metros) hasta cada punto. */
  cum: number[];
  total: number;
}

function metersBetween(a: [number, number], b: [number, number]): number {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = (b[0] - a[0]) * Math.cos(midLat) * 111320;
  const dy = (b[1] - a[1]) * 110540;
  return Math.hypot(dx, dy);
}

export function buildTrack(shape: [number, number][]): Track {
  const cum: number[] = [0];
  for (let i = 1; i < shape.length; i += 1) {
    cum[i] = cum[i - 1]! + metersBetween(shape[i - 1]!, shape[i]!);
  }
  return { points: shape, cum, total: cum[cum.length - 1] ?? 0 };
}

/** Rumbo (grados, 0 = norte) del punto `a` al `b`. */
export function bearingBetween(a: [number, number], b: [number, number]): number {
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Distancia acumulada aproximada de un punto proyectado sobre la pista. */
export function distanceAlong(track: Track, coord: [number, number]): number {
  let best = Infinity;
  let bestDist = 0;
  const { points, cum } = track;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
    const kx = Math.cos(midLat) * 111320;
    const ax = a[0] * kx;
    const ay = a[1] * 110540;
    const bx = b[0] * kx;
    const by = b[1] * 110540;
    const px = coord[0] * kx;
    const py = coord[1] * 110540;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const fx = ax + t * dx;
    const fy = ay + t * dy;
    const d = Math.hypot(px - fx, py - fy);
    if (d < best) {
      best = d;
      bestDist = cum[i]! + t * (cum[i + 1]! - cum[i]!);
    }
  }
  return bestDist;
}

/** Posición y rumbo a una distancia dada a lo largo de la pista. */
export function sampleAt(
  track: Track,
  distance: number,
): { coord: [number, number]; bearing: number } {
  const { points, cum, total } = track;
  const d = Math.max(0, Math.min(total, distance));
  // Búsqueda del segmento que contiene `d`.
  let i = 0;
  while (i < cum.length - 2 && cum[i + 1]! < d) i += 1;
  const a = points[i]!;
  const b = points[i + 1] ?? a;
  const segLen = (cum[i + 1] ?? cum[i]!) - cum[i]!;
  const t = segLen === 0 ? 0 : (d - cum[i]!) / segLen;
  return {
    coord: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])],
    bearing: bearingBetween(a, b),
  };
}

/** Easing cúbico (§10). */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
