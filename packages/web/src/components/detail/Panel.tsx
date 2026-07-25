import { X } from 'lucide-react';
import type { PanelTab } from '../../store/useTransitStore.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { PanelErrorBoundary } from './PanelErrorBoundary.js';
import { StatusTab } from './StatusTab.js';
import { StationTab } from './StationTab.js';
import { TrainTab } from './TrainTab.js';
import { MetricsTab } from './MetricsTab.js';

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'estado', label: 'Estado' },
  { id: 'estacion', label: 'Estación' },
  { id: 'formacion', label: 'Formación' },
  { id: 'metricas', label: 'Métricas' },
];

/** Panel derecho con 4 tabs (§9), slide-in, con error boundary por tab (§11). */
export function Panel(): JSX.Element {
  const open = useTransitStore((s) => s.panelOpen);
  const tab = useTransitStore((s) => s.panelTab);
  const setPanelTab = useTransitStore((s) => s.setPanelTab);
  const closePanel = useTransitStore((s) => s.closePanel);

  return (
    <aside
      aria-hidden={!open}
      className={`absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-border bg-surface shadow-subtle transition-transform duration-200 sm:w-[400px] ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center gap-1 border-b border-border px-2">
        <div className="flex flex-1 overflow-x-auto" role="tablist" aria-label="Detalle">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setPanelTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors ${
                tab === t.id
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Cerrar panel"
          className="flex h-8 w-8 items-center justify-center rounded-control text-text-muted hover:bg-elevated"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PanelErrorBoundary label={`el panel de ${tab}`}>
          {tab === 'estado' && <StatusTab />}
          {tab === 'estacion' && <StationTab />}
          {tab === 'formacion' && <TrainTab />}
          {tab === 'metricas' && <MetricsTab />}
        </PanelErrorBoundary>
      </div>
    </aside>
  );
}
