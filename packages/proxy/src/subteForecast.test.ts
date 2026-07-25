import { describe, it, expect } from 'vitest';
import { parseSubteForecast, stripPlatform } from './subteForecast.js';

const nowSec = 1_784_937_349;
const nowMs = nowSec * 1000;

// Muestra con el formato real del forecastGTFS del GCBA.
const sample = {
  Header: { timestamp: nowSec },
  Entity: [
    {
      ID: 'LineaA_A11',
      Linea: {
        Trip_Id: 'A11',
        Route_Id: 'LineaA',
        Direction_ID: 1,
        Estaciones: [
          { stop_id: '1063N', stop_name: 'Primera Junta', arrival: { time: nowSec + 60 } },
          { stop_id: '1064N', stop_name: 'Acoyte', arrival: { time: nowSec + 180 } },
          { stop_id: '1076N', stop_name: 'Plaza de Mayo', arrival: { time: nowSec + 600 } },
        ],
      },
    },
  ],
};

describe('subteForecast', () => {
  it('stripPlatform quita el sufijo de andén', () => {
    expect(stripPlatform('1059N')).toBe('1059');
    expect(stripPlatform('1076S')).toBe('1076');
    expect(stripPlatform('1076')).toBe('1076');
  });

  it('parsea arribos con estación, línea, sentido y ETA', () => {
    const arrivals = parseSubteForecast(sample, nowMs);
    expect(arrivals.length).toBe(3);
    const first = arrivals[0]!;
    expect(first.lineId).toBe('A');
    expect(first.direction).toBe(1);
    expect(first.stationId).toBe('1063'); // sin sufijo de andén
    expect(first.etaSeconds).toBe(60);
    expect(first.destination).toBe('Plaza de Mayo'); // última estación del trip
    expect(first.tripId).toBe('A11');
  });

  it('ordena por ETA ascendente y descarta lo muy pasado o lejano', () => {
    const arrivals = parseSubteForecast(sample, nowMs);
    expect(arrivals.map((a) => a.etaSeconds)).toEqual([60, 180, 600]);
  });
});
