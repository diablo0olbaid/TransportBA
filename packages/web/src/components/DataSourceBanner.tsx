import { Info, TriangleAlert } from 'lucide-react';
import { useTransitStore } from '../store/useTransitStore.js';

/**
 * Aviso visible de la fuente de datos (M6): datos simulados, fallback a mock o
 * proxy sin credenciales. No se muestra cuando los datos son realmente en vivo.
 */
export function DataSourceBanner(): JSX.Element | null {
  const notice = useTransitStore((s) => s.dataNotice);
  if (!notice || notice.level === 'ok') return null;

  const warn = notice.level === 'warn';
  const Icon = warn ? TriangleAlert : Info;
  return (
    <div
      role="status"
      className={`flex h-7 shrink-0 items-center justify-center gap-2 border-b border-border text-xs ${
        warn ? 'bg-accent-warn/15 text-accent-warn' : 'bg-elevated text-text-muted'
      }`}
    >
      <Icon size={13} aria-hidden />
      {notice.text}
    </div>
  );
}
