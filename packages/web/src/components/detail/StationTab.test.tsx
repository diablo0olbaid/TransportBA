import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Arrival } from '@ba-transit/shared';
import { StationTab } from './StationTab.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { LINES } from '../../data/static/index.js';

const FIXED_NOW = 1_700_000_000_000;
const stationId = LINES[0]!.stations[0]!.id;

const arrival: Arrival = {
  stationId,
  lineId: LINES[0]!.id,
  direction: 0,
  destination: 'San Pedrito',
  etaSeconds: 120,
  tripId: 't1',
  isEstimate: true,
};

// Reloj fijo y query de arribos con último fetch hace 30s.
vi.mock('../../hooks/useClock.js', () => ({ useClock: () => FIXED_NOW }));
vi.mock('../../hooks/useQueries.js', () => ({
  useArrivalsQuery: () => ({
    data: [arrival],
    dataUpdatedAt: FIXED_NOW - 30_000,
    isLoading: false,
  }),
}));

afterEach(cleanup);
beforeEach(() => useTransitStore.setState({ selectedStationId: stationId }));

describe('StationTab · countdown de arribos (M4)', () => {
  it('descuenta localmente el tiempo desde el último fetch', () => {
    render(<StationTab />);
    // eta 120s − 30s transcurridos = 90s → "1:30".
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('muestra el nombre de la estación', () => {
    render(<StationTab />);
    expect(screen.getByRole('heading', { name: LINES[0]!.stations[0]!.name })).toBeInTheDocument();
  });
});
