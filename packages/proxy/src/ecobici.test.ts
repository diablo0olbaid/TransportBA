import { describe, it, expect } from 'vitest';
import { mergeEcobici } from './ecobici.js';

describe('mergeEcobici', () => {
  it('mezcla information + status por station_id', () => {
    const info = {
      data: {
        stations: [{ station_id: '1', name: 'Retiro', lat: -34.59, lon: -58.37, capacity: 20 }],
      },
    };
    const status = {
      data: {
        stations: [
          {
            station_id: '1',
            num_bikes_available: 10,
            num_ebikes_available: 3,
            num_docks_available: 7,
            is_renting: 1,
            is_returning: 1,
            last_reported: 1_600_000_000,
          },
        ],
      },
    };
    const merged = mergeEcobici(info, status);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.name).toBe('Retiro');
    expect(merged[0]!.coord).toEqual([-58.37, -34.59]);
    expect(merged[0]!.bikesAvailable).toBe(7); // 10 total − 3 ebikes
    expect(merged[0]!.ebikesAvailable).toBe(3);
    expect(merged[0]!.isRenting).toBe(true);
  });

  it('tolera estaciones sin status', () => {
    const info = { data: { stations: [{ station_id: '2', name: 'x', lat: -34.6, lon: -58.4, capacity: 10 }] } }; // prettier-ignore
    const merged = mergeEcobici(info, { data: { stations: [] } });
    expect(merged[0]!.bikesAvailable).toBe(0);
    expect(merged[0]!.docksAvailable).toBe(10);
  });
});
