import type { ReactNode } from 'react';
import type { ServiceStatus } from '@ba-transit/shared';

/** Chip de estado con color según severidad (§13). */
export function StatusChip({
  status,
  label,
}: {
  status: ServiceStatus;
  label: string;
}): JSX.Element {
  const tone: Record<ServiceStatus, string> = {
    normal: 'bg-accent-ok/15 text-accent-ok',
    delayed: 'bg-accent-warn/15 text-accent-warn',
    partial: 'bg-accent-warn/15 text-accent-warn',
    interrupted: 'bg-accent-bad/15 text-accent-bad',
    unknown: 'bg-elevated text-text-muted',
  };
  return (
    <span className={`rounded-chip px-1.5 py-0.5 text-[11px] font-medium ${tone[status]}`}>
      {label}
    </span>
  );
}

/** Switch accesible propio. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent-ok' : 'bg-elevated'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

/** Skeleton con shimmer (§12: nunca spinners). */
export function Skeleton({ className = '' }: { className?: string }): JSX.Element {
  return <div className={`animate-pulse rounded bg-elevated ${className}`} aria-hidden />;
}

/** Círculo con la letra de la línea en su color oficial. */
export function LineBadge({
  color,
  textColor,
  label,
  size = 'md',
}: {
  color: string;
  textColor: string;
  label: string;
  size?: 'sm' | 'md';
}): JSX.Element {
  const dim = size === 'sm' ? 'h-5 w-5 text-xs' : 'h-7 w-7 text-sm';
  return (
    <span
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full font-bold`}
      style={{ backgroundColor: color, color: textColor }}
      aria-hidden
    >
      {label}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}): JSX.Element | null {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-subtle"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="mb-3 text-sm font-semibold tracking-heading">{title}</h2>
        {children}
      </div>
    </div>
  );
}
