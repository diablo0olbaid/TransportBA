import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LineSelector } from './LineSelector.js';
import { useTransitStore } from '../../store/useTransitStore.js';

afterEach(cleanup);
beforeEach(() => useTransitStore.setState({ selectedLines: [] }));

describe('LineSelector (M2)', () => {
  it('lista las 7 líneas', () => {
    render(<LineSelector />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('click aísla la línea en el store', () => {
    render(<LineSelector />);
    fireEvent.click(screen.getByRole('button', { name: /Línea A:/ }));
    expect(useTransitStore.getState().selectedLines).toEqual(['A']);
  });

  it('cmd/ctrl+click agrega a la selección', () => {
    render(<LineSelector />);
    fireEvent.click(screen.getByRole('button', { name: /Línea A:/ }));
    fireEvent.click(screen.getByRole('button', { name: /Línea D:/ }), { metaKey: true });
    expect(useTransitStore.getState().selectedLines).toEqual(['A', 'D']);
  });

  it('marca aria-pressed en la línea seleccionada', () => {
    render(<LineSelector />);
    const botonA = screen.getByRole('button', { name: /Línea A:/ });
    fireEvent.click(botonA);
    expect(botonA).toHaveAttribute('aria-pressed', 'true');
  });
});
