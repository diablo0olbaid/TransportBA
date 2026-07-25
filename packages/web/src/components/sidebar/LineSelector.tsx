import { LINES } from '../../data/static/index.js';
import { isLineActive, useTransitStore } from '../../store/useTransitStore.js';
import { useSubtePositionsQuery, useAlertsQuery } from '../../hooks/useQueries.js';
import { computeLineStats, STATUS_LABEL } from '../../lib/lineStats.js';
import { LineBadge, StatusChip } from '../ui/primitives.js';

const LINE_IDS = LINES.map((l) => l.id);

/**
 * Filas de línea con color, estado de servicio y contador de formaciones
 * activas (§9). Click aísla; cmd/ctrl+click agrega.
 */
export function LineSelector(): JSX.Element {
  const selectedLines = useTransitStore((s) => s.selectedLines);
  const selectLine = useTransitStore((s) => s.selectLine);
  const positions = useSubtePositionsQuery().data ?? [];
  const alerts = useAlertsQuery().data ?? [];
  const stats = computeLineStats(LINE_IDS, positions, alerts);

  return (
    <nav aria-label="Líneas de subte" className="flex flex-col gap-0.5 p-2">
      <h2 className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Líneas
      </h2>
      {LINES.map((line) => {
        const active = isLineActive(selectedLines, line.id);
        const isSelected = selectedLines.includes(line.id);
        const stat = stats[line.id]!;
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
            <LineBadge color={line.color} textColor={line.textColor} label={line.shortName} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm text-text-primary">{line.longName}</span>
              </span>
              <span className="mt-0.5 flex items-center gap-2">
                <StatusChip status={stat.status} label={STATUS_LABEL[stat.status]} />
                <span className="text-xs text-text-muted tabular">{stat.count} en circulación</span>
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
