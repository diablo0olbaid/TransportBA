import type { TransitLine } from '@ba-transit/shared';
import { buildTrack, distanceAlong, type Track } from '../../lib/track.js';
import { seededRandom } from '../../lib/rng.js';

const DWELL_SECONDS = 25;

export interface ScheduledStop {
  stationId: string;
  dist: number;
  tArrive: number;
  tDepart: number;
}

export interface LineSchedule {
  track: Track;
  stops: ScheduledStop[];
  oneWayTime: number;
}

/**
 * Construye el perfil temporal de una línea: para un trip terminal→terminal,
 * el tiempo de arribo/partida en cada estación con detención (~25s) y velocidad
 * variable por tramo (determinista según semilla). §8.
 */
export function buildLineSchedule(line: TransitLine, seed: number): LineSchedule {
  const track = buildTrack(line.shape);
  const rand = seededRandom(seed, `sched-${line.id}`);
  const ordered = [...line.stations].sort((a, b) => a.order - b.order);

  const stops: ScheduledStop[] = [];
  let t = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    const station = ordered[i]!;
    const dist = distanceAlong(track, station.coord);
    if (i === 0) {
      stops.push({ stationId: station.id, dist, tArrive: 0, tDepart: 0 });
      continue;
    }
    const prev = stops[i - 1]!;
    const segMeters = Math.max(1, dist - prev.dist);
    const speed = 8 + rand() * 5; // 8–13 m/s ≈ 29–47 km/h
    const travel = segMeters / speed;
    const tArrive = prev.tDepart + travel;
    const isTerminal = i === ordered.length - 1;
    const tDepart = tArrive + (isTerminal ? 0 : DWELL_SECONDS);
    stops.push({ stationId: station.id, dist, tArrive, tDepart });
    t = tDepart;
  }

  return { track, stops, oneWayTime: t };
}

export interface ProfilePoint {
  dist: number;
  prevIdx: number;
  nextIdx: number;
  progress: number;
  atStation: boolean;
}

/** Posición (en el marco forward A→B) a un tiempo `legT` dentro del recorrido. */
export function distanceAtTime(stops: ScheduledStop[], legT: number): ProfilePoint {
  const last = stops.length - 1;
  if (legT <= 0) return { dist: stops[0]!.dist, prevIdx: 0, nextIdx: Math.min(1, last), progress: 0, atStation: true }; // prettier-ignore
  if (legT >= stops[last]!.tArrive) return { dist: stops[last]!.dist, prevIdx: last, nextIdx: last, progress: 1, atStation: true }; // prettier-ignore

  let j = 0;
  while (j < last && stops[j + 1]!.tArrive <= legT) j += 1;
  const a = stops[j]!;
  const b = stops[j + 1]!;

  if (legT <= a.tDepart) {
    return { dist: a.dist, prevIdx: j, nextIdx: j + 1, progress: 0, atStation: true };
  }
  const frac = (legT - a.tDepart) / (b.tArrive - a.tDepart);
  return {
    dist: a.dist + frac * (b.dist - a.dist),
    prevIdx: j,
    nextIdx: j + 1,
    progress: frac,
    atStation: false,
  };
}
