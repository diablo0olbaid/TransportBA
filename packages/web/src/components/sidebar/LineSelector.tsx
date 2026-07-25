import { LINES } from '../../data/static/index.js';
import { isLineActive, useTransitStore } from '../../store/useTransitStore.js';

/**
 * Lista de líneas de subte (§9 sidebar). Click aísla la línea; cmd/ctrl+click
 * la agrega o quita de la selección. Refleja el estado de selección atenuando
 * las líneas fuera de foco.
 */
export function LineSelector(): JSX.Element {
  const selectedLines = useTransitStore((s) => s.selectedLines);
  const selectLine = useTransitStore((s) => s.selectLine);

  return (
    <nav aria-label="Líneas de subte" className="flex flex-col gap-1 p-2">
      <h2 className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Líneas
      </h2>
      {LINES.map((line) => {
        const active = isLineActive(selectedLines, line.id);
        const isSelected = selectedLines.includes(line.id);
        return (
          <button
            key={line.id}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Línea ${line.shortName}: ${line.longName}`}
            onClick={(e) => selectLine(line.id, e.metaKey || e.ctrlKey)}
            className={`flex items-center gap-3 rounded-control px-2 py-2 text-left transition-colors hover:bg-elevated ${
              isSelected ? 'bg-elevated' : ''
            } ${active ? 'opacity-100' : 'opacity-40'}`}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: line.color, color: line.textColor }}
              aria-hidden
            >
              {line.shortName}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text-primary">{line.longName}</span>
              <span className="block text-xs text-text-muted tabular">
                {line.stations.length} estaciones
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
