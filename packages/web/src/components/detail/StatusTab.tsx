import { LINES } from '../../data/static/index.js';
import { useSubtePositionsQuery, useAlertsQuery } from '../../hooks/useQueries.js';
import { useClock } from '../../hooks/useClock.js';
import { computeLineStats, STATUS_LABEL } from '../../lib/lineStats.js';
import { relativeTime } from '../../lib/time.js';
import { LineBadge, StatusChip, Skeleton } from '../ui/primitives.js';

const LINE_IDS = LINES.map((l) => l.id);

/** Tab Estado (§9): 7 líneas con semáforo, alertas activas y última actualización. */
export function StatusTab(): JSX.Element {
  const now = useClock();
  const positionsQ = useSubtePositionsQuery();
  const alerts = useAlertsQuery().data ?? [];
  const positions = positionsQ.data ?? [];
  const stats = computeLineStats(LINE_IDS, positions, alerts);

  return (
    <div className="flex flex-col gap-4 p-4">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Estado por línea
        </h3>
        <ul className="flex flex-col gap-1.5">
          {LINES.map((line) => {
            const stat = stats[line.id]!;
            return (
              <li key={line.id} className="flex items-center gap-2">
                <LineBadge
                  color={line.color}
                  textColor={line.textColor}
                  label={line.shortName}
                  size="sm"
                />
                <span className="flex-1 truncate text-sm">{line.longName}</span>
                <span className="text-xs text-text-muted tabular">{stat.count}</span>
                <StatusChip status={stat.status} label={STATUS_LABEL[stat.status]} />
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Alertas activas
        </h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-text-muted">Sin alertas activas.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-control border border-border bg-base p-2">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="text-xs text-text-muted">
        {positionsQ.isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <>Subte actualizado {relativeTime(positionsQ.dataUpdatedAt, now)}</>
        )}
      </section>
    </div>
  );
}
