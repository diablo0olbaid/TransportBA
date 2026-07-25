import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { forwardRef, type ReactNode } from 'react';
import { App } from './App.js';
import { useTransitStore } from './store/useTransitStore.js';

// MapLibre necesita WebGL, que jsdom no provee. Se mockea react-map-gl para
// que el árbol de la app renderice sin tocar el motor de mapas real.
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

afterEach(cleanup);
beforeEach(() => {
  useTransitStore.setState({ selectedLines: [], theme: 'dark' });
});

describe('App shell (M2)', () => {
  it('renderiza header, selector de líneas y mapa sin errores de consola', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    expect(screen.getByText('BA Transit Live')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Líneas de subte' })).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
