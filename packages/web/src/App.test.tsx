import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { App } from './App.js';

afterEach(cleanup);

describe('App shell (M0)', () => {
  it('renderiza el andamiaje sin errores de consola', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    expect(screen.getByText('BA Transit Live')).toBeInTheDocument();
    expect(screen.getByText('en vivo')).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
