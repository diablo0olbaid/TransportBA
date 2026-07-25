import { useState } from 'react';
import { X } from 'lucide-react';
import { useTransitStore } from '../../store/useTransitStore.js';
import { Switch } from '../ui/primitives.js';

/**
 * Control de colectivos (§9). Prender la capa muestra todos los colectivos en
 * circulación; opcionalmente se puede filtrar agregando números de línea.
 */
export function ColectivoInput(): JSX.Element {
  const busLines = useTransitStore((s) => s.busLines);
  const addBusLine = useTransitStore((s) => s.addBusLine);
  const removeBusLine = useTransitStore((s) => s.removeBusLine);
  const toggleLayer = useTransitStore((s) => s.toggleLayer);
  const showColectivos = useTransitStore((s) => s.layers.colectivos);
  const [value, setValue] = useState('');

  const add = () => {
    const label = value.trim();
    if (!label) return;
    addBusLine(label);
    if (!showColectivos) toggleLayer('colectivos');
    setValue('');
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Colectivos
        </h2>
        <Switch
          checked={showColectivos}
          onChange={() => toggleLayer('colectivos')}
          label="Mostrar colectivos"
        />
      </div>
      <p className="px-2 text-xs text-text-muted">
        Prendé la capa para ver todos, o filtrá por número de línea.
      </p>
      <div className="flex gap-1 px-2">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder="Filtrar por línea (ej. 7)"
          aria-label="Agregar línea de colectivo"
          className="w-full rounded-control border border-border bg-base px-2 py-1.5 text-sm outline-none"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-control border border-border px-3 text-sm hover:bg-elevated"
        >
          +
        </button>
      </div>
      {busLines.length > 0 && (
        <div className="flex flex-wrap gap-1 px-2">
          {busLines.map((label) => (
            <span
              key={label}
              className="flex items-center gap-1 rounded-chip bg-elevated px-2 py-0.5 text-xs tabular"
            >
              {label}
              <button
                type="button"
                aria-label={`Quitar línea ${label}`}
                onClick={() => removeBusLine(label)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
