import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { AccessibleLineTable } from './AccessibleLineTable.js';
import { useTransitStore } from '../../store/useTransitStore.js';

afterEach(cleanup);
beforeEach(() => useTransitStore.setState({ selectedLines: [] }));

describe('AccessibleLineTable (M7)', () => {
  it('sin selección resume las 7 líneas', () => {
    render(<AccessibleLineTable />);
    expect(screen.getAllByRole('table')).toHaveLength(7);
  });

  it('con una línea seleccionada muestra sólo su tabla con sus estaciones', () => {
    useTransitStore.setState({ selectedLines: ['A'] });
    render(<AccessibleLineTable />);
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(1);
    expect(within(tables[0]!).getByText('Plaza de Mayo')).toBeInTheDocument();
  });
});
