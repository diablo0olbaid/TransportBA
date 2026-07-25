import { describe, it, expect } from 'vitest';
import { buildTrack, sampleAt, bearingBetween, distanceAlong, easeInOutCubic } from './track.js';

// Una traza recta ~oeste→este a lat constante.
const shape: [number, number][] = [
  [-58.4, -34.6],
  [-58.3, -34.6],
];

describe('lib/track', () => {
  it('buildTrack acumula distancias y total > 0', () => {
    const t = buildTrack(shape);
    expect(t.cum[0]).toBe(0);
    expect(t.total).toBeGreaterThan(8000);
  });

  it('sampleAt interpola posición a mitad de camino', () => {
    const t = buildTrack(shape);
    const mid = sampleAt(t, t.total / 2);
    expect(mid.coord[0]).toBeCloseTo(-58.35, 2);
    expect(mid.coord[1]).toBeCloseTo(-34.6, 3);
  });

  it('bearingBetween ~90° yendo hacia el este', () => {
    expect(bearingBetween([-58.4, -34.6], [-58.3, -34.6])).toBeCloseTo(90, 0);
  });

  it('distanceAlong proyecta un punto sobre la traza', () => {
    const t = buildTrack(shape);
    const d = distanceAlong(t, [-58.35, -34.6]);
    expect(d).toBeCloseTo(t.total / 2, -2);
  });

  it('easeInOutCubic mapea 0→0, 0.5→0.5, 1→1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    expect(easeInOutCubic(1)).toBe(1);
  });
});
