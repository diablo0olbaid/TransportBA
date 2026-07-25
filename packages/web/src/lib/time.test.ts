import { describe, it, expect } from 'vitest';
import { relativeTime, formatEta, buenosAiresHour, buenosAiresClock } from './time.js';

describe('lib/time', () => {
  it('relativeTime en español rioplatense', () => {
    const now = 1_000_000_000_000;
    expect(relativeTime(now - 12_000, now)).toBe('hace 12 s');
    expect(relativeTime(now - 3 * 60_000, now)).toBe('hace 3 min');
    expect(relativeTime(now - 2 * 3600_000, now)).toBe('hace 2 h');
    expect(relativeTime(now + 5000, now)).toBe('hace 0 s');
  });

  it('formatEta', () => {
    expect(formatEta(0)).toBe('llegando');
    expect(formatEta(45)).toBe('45 s');
    expect(formatEta(90)).toBe('1:30');
  });

  it('buenosAiresHour aplica UTC−3', () => {
    // 2021-01-01T12:00:00Z → 09:00 en Buenos Aires.
    const ms = Date.UTC(2021, 0, 1, 12, 0, 0);
    expect(buenosAiresHour(ms)).toBeCloseTo(9, 5);
  });

  it('buenosAiresClock formatea HH:mm:ss', () => {
    const ms = Date.UTC(2021, 0, 1, 12, 30, 15);
    expect(buenosAiresClock(ms)).toBe('09:30:15');
  });
});
