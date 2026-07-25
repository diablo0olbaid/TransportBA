import type { LayerVisibility } from '../../store/useTransitStore.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { Switch } from '../ui/primitives.js';

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  subte: 'Subte',
  colectivos: 'Colectivos',
  trenes: 'Trenes',
  ecobici: 'Ecobici',
};

/** Switches de capas de datos (§9). */
export function LayerSwitches(): JSX.Element {
  const layers = useTransitStore((s) => s.layers);
  const toggleLayer = useTransitStore((s) => s.toggleLayer);

  return (
    <div className="flex flex-col gap-1 p-2">
      <h2 className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Capas
      </h2>
      {(Object.keys(LAYER_LABELS) as (keyof LayerVisibility)[]).map((key) => (
        <label
          key={key}
          className="flex cursor-pointer items-center justify-between rounded-control px-2 py-1.5 hover:bg-elevated"
        >
          <span className="text-sm">{LAYER_LABELS[key]}</span>
          <Switch
            checked={layers[key]}
            onChange={() => toggleLayer(key)}
            label={`Capa ${LAYER_LABELS[key]}`}
          />
        </label>
      ))}
    </div>
  );
}
