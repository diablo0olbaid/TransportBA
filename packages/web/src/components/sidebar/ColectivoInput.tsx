import { useState } from 'react';
import { X } from 'lucide-react';
import { useTransitStore } from '../../store/useTransitStore.js';
import { AVAILABLE_BUS_LINES } from '../../data/mock/colectivos.js';

/** Chips agregables de líneas de colectivo (§9). */
export function ColectivoInput(): JSX.Element {
  const busLines = useTransitStore((s) => s.busLines);
  const addBusLine = useTransitStore((s) => s.addBusLine);
  const removeBusLine = useTransitStore((s) => s.removeBusLine);
  const toggleLayer = useTransitStore((s) => s.toggleLayer);
  const layers = useTransitStore((s) => s.layers);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const add = () => {
    const label = value.trim();
    if (!label) return;
    if (!AVAILABLE_BUS_LINES.includes(label)) {
      setError(true);
      return;
    }
    addBusLine(label);
    if (!layers.colectivos) toggleLayer('colectivos');
    setValue('');
    setError(false);
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Colectivos
      </h2>
      <div className="flex gap-1 px-2">
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={`Línea (ej. ${AVAILABLE_BUS_LINES[0]})`}
          aria-label="Agregar línea de colectivo"
          className={`w-full rounded-control border bg-base px-2 py-1.5 text-sm outline-none ${
            error ? 'border-accent-bad' : 'border-border'
          }`}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
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
      {error && (
        <p className="px-2 text-xs text-accent-bad">
          Sin traza disponible. Probá: {AVAILABLE_BUS_LINES.join(', ')}.
        </p>
      )}
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
