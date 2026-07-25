import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { LINES } from '../../data/static/index.js';
import { useSubtePositionsQuery, useAlertsQuery } from '../../hooks/useQueries.js';
import { computeLineStats } from '../../lib/lineStats.js';
import { seededRandom } from '../../lib/rng.js';
import { useCountUp } from '../../hooks/useCountUp.js';

const LINE_IDS = LINES.map((l) => l.id);
const COLOR = new Map(LINES.map((l) => [l.id, l.color]));

function Counter({ value, label }: { value: number; label: string }): JSX.Element {
  const shown = useCountUp(value);
  return (
    <div className="rounded-card border border-border bg-base p-3">
      <p className="text-2xl font-semibold tabular tracking-heading">{shown}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

/** Tab Métricas (§9): contadores, barras por línea, sparkline y puntualidad. */
export function MetricsTab(): JSX.Element {
  const positions = useSubtePositionsQuery().data ?? [];
  const alerts = useAlertsQuery().data ?? [];
  const stats = computeLineStats(LINE_IDS, positions, alerts);

  const total = positions.length;
  const delayedLines = LINE_IDS.filter((id) => stats[id]!.status === 'delayed').length;

  const barData = LINES.map((l) => ({ line: l.shortName, value: stats[l.id]!.count, id: l.id }));

  // Serie ilustrativa de formaciones en circulación (últimos 60 min).
  const sparkData = useMemo(() => {
    const rand = seededRandom(1, 'metrics-spark');
    return Array.from({ length: 12 }, (_, i) => ({
      t: i,
      value: Math.max(0, Math.round(total * (0.75 + rand() * 0.5))),
    }));
  }, [total]);

  // Puntualidad por franja horaria (ilustrativa, determinista).
  const punctuality = useMemo(() => {
    const rand = seededRandom(1, 'metrics-punct');
    return Array.from({ length: 12 }, (_, i) => ({
      hour: 6 + i,
      pct: Math.round(70 + rand() * 28),
    }));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-3 gap-2">
        <Counter value={total} label="En circulación" />
        <Counter value={delayedLines} label="Líneas demoradas" />
        <Counter value={alerts.length} label="Alertas activas" />
      </div>

      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Formaciones por línea
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis
                dataKey="line"
                tick={{ fontSize: 11, fill: '#8B95A7' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  background: '#1B212C',
                  border: '1px solid #232A36',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((d) => (
                  <Cell key={d.id} fill={COLOR.get(d.id)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Formaciones en circulación · últimos 60 min
        </h4>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="value" stroke="#34D399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Puntualidad por franja horaria
        </h4>
        <div className="grid grid-cols-12 gap-0.5">
          {punctuality.map((p) => (
            <div
              key={p.hour}
              title={`${p.hour}h · ${p.pct}%`}
              className="h-6 rounded-sm"
              style={{ backgroundColor: `rgba(52, 211, 153, ${p.pct / 100})` }}
            />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-text-muted">6h → 17h · verde = mayor puntualidad</p>
      </section>
    </div>
  );
}
