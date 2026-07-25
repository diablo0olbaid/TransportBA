import { create } from 'zustand';

export type Theme = 'dark' | 'light';
export type PanelTab = 'estado' | 'estacion' | 'formacion' | 'metricas';
/** Intervalo de auto-refresh en ms, o `null` para manual (§9). */
export type AutoRefresh = 15000 | 30000 | 60000 | null;

/** Capas de datos activables (§9). */
export interface LayerVisibility {
  subte: boolean;
  colectivos: boolean;
  trenes: boolean;
  ecobici: boolean;
}

interface TransitState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;

  /** Líneas seleccionadas (vacío = ninguna aislada). */
  selectedLines: string[];
  selectLine: (id: string, additive?: boolean) => void;
  setSelectedLines: (ids: string[]) => void;
  clearSelection: () => void;

  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setLayers: (layers: LayerVisibility) => void;

  /** Líneas de colectivo a mostrar (chips en el sidebar). */
  busLines: string[];
  addBusLine: (label: string) => void;
  removeBusLine: (label: string) => void;
  setBusLines: (labels: string[]) => void;

  // Panel derecho.
  panelOpen: boolean;
  panelTab: PanelTab;
  selectedStationId: string | null;
  selectedTrainId: string | null;
  setPanelTab: (tab: PanelTab) => void;
  selectStation: (id: string) => void;
  selectTrain: (id: string) => void;
  closePanel: () => void;

  autoRefresh: AutoRefresh;
  setAutoRefresh: (ms: AutoRefresh) => void;

  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;

  /** Aviso de fuente de datos (mock / fallback / live), M6. */
  dataNotice: { level: 'ok' | 'info' | 'warn'; text: string } | null;
  setDataNotice: (notice: TransitState['dataNotice']) => void;

  /** Se incrementa para pedir foco en el buscador (atajo `/`). */
  searchFocusSignal: number;
  requestSearchFocus: () => void;

  /** Esc: limpia selección y cierra panel (§12). */
  escape: () => void;
}

const DEFAULT_LAYERS: LayerVisibility = {
  subte: true,
  colectivos: false,
  trenes: false,
  ecobici: false,
};

export const useTransitStore = create<TransitState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),

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
  setSelectedLines: (ids) => set({ selectedLines: ids }),
  clearSelection: () => set({ selectedLines: [] }),

  layers: DEFAULT_LAYERS,
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setLayers: (layers) => set({ layers }),

  busLines: [],
  addBusLine: (label) =>
    set((s) => (s.busLines.includes(label) ? s : { busLines: [...s.busLines, label] })),
  removeBusLine: (label) => set((s) => ({ busLines: s.busLines.filter((l) => l !== label) })),
  setBusLines: (labels) => set({ busLines: labels }),

  panelOpen: false,
  panelTab: 'estado',
  selectedStationId: null,
  selectedTrainId: null,
  setPanelTab: (panelTab) => set({ panelTab, panelOpen: true }),
  selectStation: (id) =>
    set({ selectedStationId: id, panelTab: 'estacion', panelOpen: true, selectedTrainId: null }),
  selectTrain: (id) => set({ selectedTrainId: id, panelTab: 'formacion', panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  autoRefresh: 30000,
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),

  shortcutsOpen: false,
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),

  dataNotice: null,
  setDataNotice: (dataNotice) => set({ dataNotice }),

  searchFocusSignal: 0,
  requestSearchFocus: () => set((s) => ({ searchFocusSignal: s.searchFocusSignal + 1 })),

  escape: () =>
    set({ selectedLines: [], panelOpen: false, selectedStationId: null, selectedTrainId: null }),
}));

/** ¿Hay alguna línea aislada? */
export const hasSelection = (lines: string[]): boolean => lines.length > 0;

/** ¿Está la línea `id` en foco (no atenuada)? */
export const isLineActive = (selected: string[], id: string): boolean =>
  selected.length === 0 || selected.includes(id);
