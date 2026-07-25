import type { Arrival, TrainPosition } from '@ba-transit/shared';
import { LINES } from '../static/index.js';
import { sampleAt } from '../../lib/track.js';
import { buenosAiresHour } from '../../lib/time.js';
import { buildLineSchedule, distanceAtTime, type LineSchedule } from './schedule.js';

const LAYOVER_SECONDS = 90;

/** Frecuencia por franja horaria (§8): pico 3 min, valle 7 min, nocturno n/a. */
export function headwaySeconds(hour: number): number {
  const inRange = (from: number, to: number) => hour >= from && hour < to;
  if (inRange(7, 10) || inRange(17, 20)) return 180; // pico
  if (inRange(23, 24) || inRange(0, 6)) return 0; // nocturno: sin servicio
  return 420; // valle
}

const scheduleCache = new Map<number, LineSchedule[]>();

function schedulesFor(seed: number): LineSchedule[] {
  let cached = scheduleCache.get(seed);
  if (!cached) {
    cached = LINES.map((line) => buildLineSchedule(line, seed));
    scheduleCache.set(seed, cached);
  }
  return cached;
}

interface TrainState {
  dir: 0 | 1;
  alongDist: number;
  bearing: number;
  nextStationId: string | null;
  progress: number;
  atStation: boolean;
}

function trainStateAt(sched: LineSchedule, phase: number): TrainState {
  const { stops, oneWayTime, track } = sched;
  const n = stops.length;
  const cycle = 2 * oneWayTime + 2 * LAYOVER_SECONDS;
  const p = ((phase % cycle) + cycle) % cycle;

  let dir: 0 | 1;
  let alongDist: number;
  let nextStationId: string | null;
  let progress: number;
  let atStation: boolean;

  if (p < oneWayTime) {
    dir = 0;
    const pt = distanceAtTime(stops, p);
    alongDist = pt.dist;
    nextStationId = stops[pt.nextIdx]?.stationId ?? null;
    progress = pt.progress;
    atStation = pt.atStation;
  } else if (p < oneWayTime + LAYOVER_SECONDS) {
    dir = 1;
    alongDist = track.total;
    nextStationId = stops[n - 2]?.stationId ?? null;
    progress = 0;
    atStation = true;
  } else if (p < 2 * oneWayTime + LAYOVER_SECONDS) {
    dir = 1;
    const legT = p - (oneWayTime + LAYOVER_SECONDS);
    const pt = distanceAtTime(stops, legT);
    alongDist = track.total - pt.dist;
    nextStationId = stops[n - 1 - pt.nextIdx]?.stationId ?? null;
    progress = pt.progress;
    atStation = pt.atStation;
  } else {
    dir = 0;
    alongDist = 0;
    nextStationId = stops[1]?.stationId ?? null;
    progress = 0;
    atStation = true;
  }

  const sample = sampleAt(track, alongDist);
  return {
    dir,
    alongDist,
    bearing: dir === 1 ? (sample.bearing + 180) % 360 : sample.bearing,
    nextStationId,
    progress,
    atStation,
  };
}

function activeTrainCount(cycle: number, headway: number): number {
  return headway > 0 ? Math.max(1, Math.floor(cycle / headway)) : 0;
}

/** Posiciones de todas las formaciones de subte en el instante `nowMs`. */
export function simulateSubtePositions(
  nowMs: number,
  seed: number,
  delayedLines: ReadonlySet<string> = new Set(),
): TrainPosition[] {
  const scheds = schedulesFor(seed);
  const nowSec = nowMs / 1000;
  const headway = headwaySeconds(buenosAiresHour(nowMs));
  const out: TrainPosition[] = [];

  scheds.forEach((sched, li) => {
    const line = LINES[li]!;
    const cycle = 2 * sched.oneWayTime + 2 * LAYOVER_SECONDS;
    const count = activeTrainCount(cycle, headway);
    const delayed = delayedLines.has(line.id);

    for (let k = 0; k < count; k += 1) {
      const lag = delayed && k % 3 === 0 ? 60 : 0;
      const phase = nowSec + k * headway - lag;
      const st = trainStateAt(sched, phase);
      const [lon, lat] = sampleAt(sched.track, st.alongDist).coord;
      out.push({
        id: `subte-${line.id}-${k}`,
        lineId: line.id,
        coord: [lon, lat],
        bearing: Math.round(st.bearing),
        direction: st.dir,
        nextStationId: st.nextStationId,
        progress: Number(st.progress.toFixed(3)),
        status: st.atStation ? 'at_station' : 'moving',
        source: 'realtime',
        timestamp: nowMs,
      });
    }
  });

  return out;
}

/** Arribos estimados por estación en el instante `nowMs`. */
export function simulateSubteArrivals(
  nowMs: number,
  seed: number,
  stationId?: string,
  delayedLines: ReadonlySet<string> = new Set(),
): Arrival[] {
  const scheds = schedulesFor(seed);
  const nowSec = nowMs / 1000;
  const headway = headwaySeconds(buenosAiresHour(nowMs));
  const out: Arrival[] = [];
  if (headway === 0) return out;

  scheds.forEach((sched, li) => {
    const line = LINES[li]!;
    const { stops, oneWayTime } = sched;
    const n = stops.length;
    const destFwd = stops[n - 1]!.stationId;
    const destBwd = stops[0]!.stationId;
    const nameOf = (id: string) => line.stations.find((s) => s.id === id)?.name ?? '';
    const cycle = 2 * oneWayTime + 2 * LAYOVER_SECONDS;
    const count = activeTrainCount(cycle, headway);
    const delayed = delayedLines.has(line.id);

    for (let k = 0; k < count; k += 1) {
      const lag = delayed && k % 3 === 0 ? 60 : 0;
      const phase = (((nowSec + k * headway - lag) % cycle) + cycle) % cycle;

      // Sólo tramos de viaje aportan arribos hacia estaciones futuras.
      let dir: 0 | 1 | null = null;
      let legT = 0;
      if (phase < oneWayTime) {
        dir = 0;
        legT = phase;
      } else if (
        phase >= oneWayTime + LAYOVER_SECONDS &&
        phase < 2 * oneWayTime + LAYOVER_SECONDS
      ) {
        dir = 1;
        legT = phase - (oneWayTime + LAYOVER_SECONDS);
      }
      if (dir === null) continue;

      for (let i = 1; i < n; i += 1) {
        const eta = stops[i]!.tArrive - legT;
        if (eta <= 0 || eta > 1800) continue;
        const stopId = dir === 0 ? stops[i]!.stationId : stops[n - 1 - i]!.stationId;
        if (stationId && stopId !== stationId) continue;
        out.push({
          stationId: stopId,
          lineId: line.id,
          direction: dir,
          destination: nameOf(dir === 0 ? destFwd : destBwd),
          etaSeconds: Math.round(eta),
          tripId: `subte-${line.id}-${k}`,
          isEstimate: true,
        });
      }
    }
  });

  out.sort((a, b) => a.etaSeconds - b.etaSeconds);
  return out;
}
