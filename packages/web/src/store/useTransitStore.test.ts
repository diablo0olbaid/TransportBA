import { describe, it, expect, beforeEach } from 'vitest';
import { useTransitStore, isLineActive, hasSelection } from './useTransitStore.js';

const reset = () =>
  useTransitStore.setState({
    selectedLines: [],
    theme: 'dark',
    layers: { subte: true, colectivos: false, trenes: false, ecobici: false },
  });

describe('useTransitStore · selección de líneas', () => {
  beforeEach(reset);

  it('aísla una línea con click simple', () => {
    useTransitStore.getState().selectLine('A');
    expect(useTransitStore.getState().selectedLines).toEqual(['A']);
  });

  it('reemplaza la selección al aislar otra línea', () => {
    useTransitStore.getState().selectLine('A');
    useTransitStore.getState().selectLine('D');
    expect(useTransitStore.getState().selectedLines).toEqual(['D']);
  });

  it('limpia al volver a clickear la única línea aislada', () => {
    useTransitStore.getState().selectLine('A');
    useTransitStore.getState().selectLine('A');
    expect(useTransitStore.getState().selectedLines).toEqual([]);
  });

  it('agrega y quita con additive (cmd/ctrl+click)', () => {
    useTransitStore.getState().selectLine('A', true);
    useTransitStore.getState().selectLine('D', true);
    expect(useTransitStore.getState().selectedLines).toEqual(['A', 'D']);
    useTransitStore.getState().selectLine('A', true);
    expect(useTransitStore.getState().selectedLines).toEqual(['D']);
  });

  it('clearSelection vacía la selección', () => {
    useTransitStore.getState().selectLine('A', true);
    useTransitStore.getState().clearSelection();
    expect(useTransitStore.getState().selectedLines).toEqual([]);
  });
});

describe('useTransitStore · tema y capas', () => {
  beforeEach(reset);

  it('alterna el tema', () => {
    expect(useTransitStore.getState().theme).toBe('dark');
    useTransitStore.getState().toggleTheme();
    expect(useTransitStore.getState().theme).toBe('light');
  });

  it('alterna la visibilidad de una capa', () => {
    useTransitStore.getState().toggleLayer('ecobici');
    expect(useTransitStore.getState().layers.ecobici).toBe(true);
  });
});

describe('helpers de selección', () => {
  it('isLineActive: sin selección todas activas; con selección sólo las elegidas', () => {
    expect(isLineActive([], 'A')).toBe(true);
    expect(isLineActive(['D'], 'A')).toBe(false);
    expect(isLineActive(['D'], 'D')).toBe(true);
  });

  it('hasSelection refleja si hay líneas aisladas', () => {
    expect(hasSelection([])).toBe(false);
    expect(hasSelection(['A'])).toBe(true);
  });
});
