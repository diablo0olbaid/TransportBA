import { AlertTriangle, Info, OctagonAlert } from 'lucide-react';
import type { ServiceAlert } from '@ba-transit/shared';
import { useAlertsQuery } from '../../hooks/useQueries.js';

const ICON = {
  info: Info,
  warning: AlertTriangle,
  severe: OctagonAlert,
} as const;

const TONE = {
  info: 'text-text-muted',
  warning: 'text-accent-warn',
  severe: 'text-accent-bad',
} as const;

function AlertItem({ alert }: { alert: ServiceAlert }): JSX.Element {
  const Icon = ICON[alert.severity];
  return (
    <span className="mx-6 inline-flex items-center gap-2 text-xs">
      <Icon size={13} className={TONE[alert.severity]} aria-hidden />
      <span className="font-medium text-text-primary">{alert.title}</span>
      <span className="text-text-muted">{alert.description}</span>
    </span>
  );
}

/** Marquesina de alertas activas, pausada en hover, oculta si no hay (§9). */
export function Ticker(): JSX.Element | null {
  const alerts = useAlertsQuery().data ?? [];
  if (alerts.length === 0) return null;

  return (
    <footer
      className="marquee-container flex h-9 shrink-0 items-center overflow-hidden border-t border-border bg-surface"
      aria-label="Alertas de servicio"
    >
      <div className="marquee-track">
        {/* Duplicado para loop continuo. */}
        {[0, 1].map((copy) => (
          <span key={copy} aria-hidden={copy === 1} className="inline-flex">
            {alerts.map((a) => (
              <AlertItem key={`${copy}-${a.id}`} alert={a} />
            ))}
          </span>
        ))}
      </div>
    </footer>
  );
}
