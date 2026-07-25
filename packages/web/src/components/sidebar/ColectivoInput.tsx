import { useTransitStore } from '../../store/useTransitStore.js';
import { AVAILABLE_BUS_LINES } from '../../data/mock/colectivos.js';
import { Switch } from '../ui/primitives.js';

/**
 * Control de colectivos (§9). Prender la capa muestra todos los colectivos en
 * vivo; elegir una línea con recorrido conocido dibuja su traza y muestra sólo
 * los coches que van sobre ella.
 */
export function ColectivoInput(): JSX.Element {
  const busLines = useTransitStore((s) => s.busLines);
  const addBusLine = useTransitStore((s) => s.addBusLine);
  const removeBusLine = useTransitStore((s) => s.removeBusLine);
  const toggleLayer = useTransitStore((s) => s.toggleLayer);
  const showColectivos = useTransitStore((s) => s.layers.colectivos);

  const toggleLine = (label: string) => {
    if (busLines.includes(label)) {
      removeBusLine(label);
    } else {
      addBusLine(label);
      if (!showColectivos) toggleLayer('colectivos');
    }
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
        Prendé la capa para ver todos, o elegí una línea para ver su recorrido y sus coches.
      </p>
      <div className="flex flex-wrap gap-1 px-2">
        {AVAILABLE_BUS_LINES.map((label) => {
          const active = busLines.includes(label);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => toggleLine(label)}
              className={`rounded-chip border px-2.5 py-1 text-xs tabular transition-colors ${
                active
                  ? 'border-accent-ok bg-accent-ok/15 text-accent-ok'
                  : 'border-border text-text-muted hover:bg-elevated'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
