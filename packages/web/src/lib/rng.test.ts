import { describe, it, expect } from 'vitest';
import { mulberry32, hashString, seededRandom } from './rng.js';

describe('lib/rng', () => {
  it('mulberry32 es determinista para la misma semilla', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it('mulberry32 devuelve valores en [0,1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i += 1) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashString es estable y varía por entrada', () => {
    expect(hashString('A')).toBe(hashString('A'));
    expect(hashString('A')).not.toBe(hashString('B'));
  });

  it('seededRandom con misma semilla+clave reproduce la secuencia', () => {
    const a = seededRandom(1, 'linea-A');
    const b = seededRandom(1, 'linea-A');
    expect(a()).toBe(b());
  });
});
