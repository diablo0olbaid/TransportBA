import { create } from 'zustand';

export type Theme = 'dark' | 'light';

/** Capas de datos activables (§9). En M2 sólo el subte tiene contenido. */
export interface LayerVisibility {
  subte: boolean;
  colectivos: boolean;
  trenes: boolean;
  ecobici: boolean;
}

interface TransitState {
  theme: Theme;
  toggleTheme: () => void;

  /** Líneas seleccionadas (vacío = ninguna aislada, todas en foco normal). */
  selectedLines: string[];
  /**
   * Selecciona una línea. `additive` (cmd/ctrl+click) alterna la línea dentro
   * de la selección; sin additive, aísla esa línea, y si ya era la única
   * seleccionada, limpia la selección.
   */
  selectLine: (id: string, additive?: boolean) => void;
  clearSelection: () => void;

  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
}

export const useTransitStore = create<TransitState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  selectedLines: [],
  selectLine: (id, additive = false) =>
    set((s) => {
      if (additive) {
        return s.selectedLines.includes(id)
          ? { selectedLines: s.selectedLines.filter((l) => l !== id) }
          : { selectedLines: [...s.selectedLines, id] };
      }
      const isOnlySelected = s.selectedLines.length === 1 && s.selectedLines[0] === id;
      return { selectedLines: isOnlySelected ? [] : [id] };
    }),
  clearSelection: () => set({ selectedLines: [] }),

  layers: { subte: true, colectivos: false, trenes: false, ecobici: false },
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
}));

/** ¿Hay alguna línea aislada? */
export const hasSelection = (lines: string[]): boolean => lines.length > 0;

/** ¿Está la línea `id` en foco (no atenuada)? */
export const isLineActive = (selected: string[], id: string): boolean =>
  selected.length === 0 || selected.includes(id);
