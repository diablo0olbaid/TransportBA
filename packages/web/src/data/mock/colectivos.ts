import type { VehiclePosition } from '@ba-transit/shared';
import colectivoData from '../static/colectivo-lines.json';
import { buildTrack, sampleAt, type Track } from '../../lib/track.js';
import { seededRandom } from '../../lib/rng.js';

interface ColectivoLine {
  id: string;
  label: string;
  shape: [number, number][];
}

const LINES = colectivoData as ColectivoLine[];

const trackCache = new Map<string, Track>();
function trackFor(line: ColectivoLine): Track {
  let t = trackCache.get(line.id);
  if (!t) {
    t = buildTrack(line.shape);
    trackCache.set(line.id, t);
  }
  return t;
}

/** Etiquetas de líneas de colectivo con traza disponible en el mock. */
export const AVAILABLE_BUS_LINES = LINES.map((l) => l.label);

/**
 * Posiciones de colectivos de las líneas pedidas, moviéndose sobre trazas
 * reales (§8). Cada vehículo recorre ida y vuelta con velocidad variable.
 */
export function simulateColectivos(
  nowMs: number,
  seed: number,
  lineLabels: string[],
): VehiclePosition[] {
  const wanted = new Set(lineLabels);
  const nowSec = nowMs / 1000;
  const out: VehiclePosition[] = [];

  for (const line of LINES) {
    if (!wanted.has(line.label)) continue;
    const track = trackFor(line);
    if (track.total < 100) continue;
    const rand = seededRandom(seed, `bus-${line.label}`);
    // Un vehículo cada ~1.5 km de recorrido.
    const count = Math.max(2, Math.round(track.total / 1500));
    const roundTrip = track.total * 2;

    for (let k = 0; k < count; k += 1) {
      const speed = 6 + rand() * 4; // 6–10 m/s ≈ 22–36 km/h
      const offset = (k / count) * roundTrip + rand() * 200;
      const pos = (((nowSec * speed + offset) % roundTrip) + roundTrip) % roundTrip;
      const forward = pos <= track.total;
      const alongDist = forward ? pos : roundTrip - pos;
      const sample = sampleAt(track, alongDist);
      out.push({
        id: `bus-${line.label}-${k}`,
        mode: 'colectivo',
        lineId: line.id,
        lineLabel: line.label,
        coord: sample.coord,
        bearing: Math.round(forward ? sample.bearing : (sample.bearing + 180) % 360),
        speedKmh: Math.round(speed * 3.6),
        timestamp: nowMs,
      });
    }
  }

  return out;
}
