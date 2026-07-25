import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { forwardRef, type ReactNode } from 'react';
import { App } from './App.js';
import { useTransitStore } from './store/useTransitStore.js';

// MapLibre necesita WebGL, que jsdom no provee.
vi.mock('react-map-gl/maplibre', () => ({
  default: forwardRef<HTMLDivElement, { children?: ReactNode }>(({ children }, ref) => (
    <div data-testid="map" ref={ref}>
      {children}
    </div>
  )),
  Source: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Layer: () => null,
  NavigationControl: () => null,
}));
vi.mock('./components/map/TrainsLayer.js', () => ({ TrainsLayer: () => null }));

// Feeds mockeados para un smoke sin fetches asíncronos.
vi.mock('./hooks/useQueries.js', () => {
  const empty = { data: [], dataUpdatedAt: 0, isLoading: false, isError: false };
  return {
    useSubtePositionsQuery: () => empty,
    useAlertsQuery: () => empty,
    useArrivalsQuery: () => empty,
    useBikeStationsQuery: () => empty,
    useBusPositionsQuery: () => empty,
  };
});

afterEach(cleanup);
beforeEach(() => useTransitStore.setState({ selectedLines: [], theme: 'dark', panelOpen: false }));

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App shell (M4)', () => {
  it('renderiza header, sidebar y mapa sin errores de consola', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderApp();
    expect(screen.getByText('BA Transit Live')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Líneas de subte' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('el buscador está presente', () => {
    renderApp();
    expect(screen.getByRole('textbox', { name: 'Buscar estación' })).toBeInTheDocument();
  });
});
