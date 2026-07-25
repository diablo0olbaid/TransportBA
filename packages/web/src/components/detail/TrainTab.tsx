import { getLine, LINES } from '../../data/static/index.js';
import { useSubtePositionsQuery } from '../../hooks/useQueries.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { LineBadge } from '../ui/primitives.js';

function stationName(id: string | null): string {
  if (!id) return '—';
  for (const line of LINES) {
    const s = line.stations.find((st) => st.id === id);
    if (s) return s.name;
  }
  return '—';
}

/** Tab Formación (§9): datos de la formación seleccionada. */
export function TrainTab(): JSX.Element {
  const trainId = useTransitStore((s) => s.selectedTrainId);
  const positions = useSubtePositionsQuery().data ?? [];
  const train = positions.find((t) => t.id === trainId);

  if (!train) {
    return <p className="p-4 text-sm text-text-muted">Elegí una formación en el mapa.</p>;
  }
  const line = getLine(train.lineId);

  const rows: [string, string][] = [
    ['Sentido', train.direction === 0 ? 'Ida' : 'Vuelta'],
    ['Próxima estación', stationName(train.nextStationId)],
    ['Progreso', `${Math.round(train.progress * 100)}%`],
    ['Estado', train.status === 'moving' ? 'En movimiento' : train.status === 'at_station' ? 'En estación' : 'Desconocido'], // prettier-ignore
    ['Rumbo', `${train.bearing}°`],
    ['Origen del dato', train.source === 'derived' ? 'Estimado (derivado)' : 'Tiempo real'],
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        {line && <LineBadge color={line.color} textColor={line.textColor} label={line.shortName} />}
        <div>
          <h3 className="text-base font-semibold tracking-heading">Formación</h3>
          <p className="text-xs text-text-muted tabular">{train.id}</p>
        </div>
      </header>
      <dl className="flex flex-col gap-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border py-1.5">
            <dt className="text-text-muted">{k}</dt>
            <dd className="tabular">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
