import { Moon, Sun, Menu } from 'lucide-react';
import type { AutoRefresh } from '../../store/useTransitStore.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { useClock } from '../../hooks/useClock.js';
import { useSubtePositionsQuery } from '../../hooks/useQueries.js';
import { buenosAiresClock, relativeTime } from '../../lib/time.js';

const REFRESH_OPTIONS: { value: AutoRefresh; label: string }[] = [
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '60s' },
  { value: null, label: 'Manual' },
];

function Freshness({
  updatedAt,
  now,
  stale,
}: {
  updatedAt: number;
  now: number;
  stale: boolean;
}): JSX.Element {
  const ageS = updatedAt === 0 ? Infinity : (now - updatedAt) / 1000;
  const tone =
    stale || ageS > 180
      ? 'bg-accent-bad'
      : ageS > 90
        ? 'bg-accent-warn'
        : 'bg-accent-ok animate-pulse';
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      <span className={`h-2 w-2 rounded-full ${tone}`} aria-hidden />
      {updatedAt === 0 ? 'conectando…' : relativeTime(updatedAt, now)}
      {stale && (
        <span className="rounded-chip bg-accent-bad/15 px-1.5 py-0.5 text-[11px] text-accent-bad">
          desactualizado
        </span>
      )}
    </span>
  );
}

/** Header (§9): logo, reloj AR, frescura, auto-refresh y tema. */
export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }): JSX.Element {
  const now = useClock();
  const theme = useTransitStore((s) => s.theme);
  const toggleTheme = useTransitStore((s) => s.toggleTheme);
  const autoRefresh = useTransitStore((s) => s.autoRefresh);
  const setAutoRefresh = useTransitStore((s) => s.setAutoRefresh);
  const subteQuery = useSubtePositionsQuery();
  const updatedAt = subteQuery.dataUpdatedAt;
  // Dato previo mostrándose tras un fallo de fetch (§11).
  const stale = subteQuery.isError && (subteQuery.data?.length ?? 0) > 0;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Alternar panel lateral"
        className="flex h-8 w-8 items-center justify-center rounded-control text-text-muted hover:bg-elevated md:hidden"
      >
        <Menu size={18} />
      </button>

      <span className="text-sm font-semibold tracking-heading">BA Transit Live</span>

      <span className="hidden font-mono text-sm tabular text-text-primary sm:inline">
        {buenosAiresClock(now)}
      </span>

      <Freshness updatedAt={updatedAt} now={now} stale={stale} />

      <div className="ml-auto flex items-center gap-1">
        <div
          className="hidden items-center rounded-control border border-border p-0.5 sm:flex"
          role="group"
          aria-label="Frecuencia de actualización"
        >
          {REFRESH_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={autoRefresh === opt.value}
              onClick={() => setAutoRefresh(opt.value)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                autoRefresh === opt.value
                  ? 'bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
