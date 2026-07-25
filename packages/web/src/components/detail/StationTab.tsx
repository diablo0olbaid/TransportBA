import { Accessibility } from 'lucide-react';
import { getLine, LINES } from '../../data/static/index.js';
import { useArrivalsQuery } from '../../hooks/useQueries.js';
import { useClock } from '../../hooks/useClock.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { formatEta } from '../../lib/time.js';
import { LineBadge, Skeleton } from '../ui/primitives.js';

function findStation(stationId: string) {
  for (const line of LINES) {
    const s = line.stations.find((st) => st.id === stationId);
    if (s) return { station: s, line };
  }
  return null;
}

/** Tab Estación (§9): datos + arribos por sentido con cuenta regresiva viva. */
export function StationTab(): JSX.Element {
  const now = useClock();
  const stationId = useTransitStore((s) => s.selectedStationId);
  const query = useArrivalsQuery(stationId);

  if (!stationId) {
    return (
      <p className="p-4 text-sm text-text-muted">Elegí una estación en el mapa o el buscador.</p>
    );
  }
  const found = findStation(stationId);
  if (!found) return <p className="p-4 text-sm text-text-muted">Estación no encontrada.</p>;
  const { station, line } = found;

  // Cuenta regresiva local: descuenta el tiempo desde el último fetch (§9).
  const elapsed = query.dataUpdatedAt ? (now - query.dataUpdatedAt) / 1000 : 0;
  const arrivals = (query.data ?? [])
    .map((a) => ({ ...a, eta: Math.max(0, Math.round(a.etaSeconds - elapsed)) }))
    .sort((a, b) => a.eta - b.eta);

  const byDir = (dir: 0 | 1) => arrivals.filter((a) => a.direction === dir).slice(0, 4);

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <LineBadge color={line.color} textColor={line.textColor} label={line.shortName} />
        <div>
          <h3 className="text-base font-semibold leading-tight tracking-heading">{station.name}</h3>
          <p className="text-xs text-text-muted">Línea {line.shortName}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        {station.accessible && (
          <span className="inline-flex items-center gap-1 rounded-chip bg-elevated px-2 py-1 text-text-muted">
            <Accessibility size={13} /> Accesible
          </span>
        )}
        {station.transfers.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-chip bg-elevated px-2 py-1">
            <span className="text-text-muted">Combina:</span>
            {station.transfers.map((t) => {
              const l = getLine(t);
              return l ? (
                <LineBadge
                  key={t}
                  color={l.color}
                  textColor={l.textColor}
                  label={l.shortName}
                  size="sm"
                />
              ) : null;
            })}
          </span>
        )}
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Próximos arribos
        </h4>
        {query.isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : (
          ([0, 1] as const).map((dir) => {
            const list = byDir(dir);
            if (list.length === 0) return null;
            return (
              <div key={dir} className="mb-3">
                <p className="mb-1 text-xs text-text-muted">Sentido {list[0]!.destination}</p>
                <ul className="flex flex-col gap-1">
                  {list.map((a) => (
                    <li
                      key={a.tripId ?? `${a.direction}-${a.eta}`}
                      className="flex items-center justify-between rounded-control bg-base px-2 py-1.5 text-sm"
                    >
                      <span className="truncate">{a.destination}</span>
                      <span className="tabular font-medium text-accent-ok">{formatEta(a.eta)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
        {!query.isLoading && arrivals.length === 0 && (
          <p className="text-sm text-text-muted">Sin arribos próximos (¿horario nocturno?).</p>
        )}
      </section>
    </div>
  );
}
