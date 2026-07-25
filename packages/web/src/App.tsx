import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { MapView } from './components/map/MapView.js';
import { LineSelector } from './components/sidebar/LineSelector.js';
import { useTransitStore } from './store/useTransitStore.js';

/**
 * Shell de la app (M2). Header + sidebar con selector de líneas + mapa base.
 * Todavía sin datos en vivo, ticker ni panel derecho (M3–M4).
 */
export function App(): JSX.Element {
  const theme = useTransitStore((s) => s.theme);
  const toggleTheme = useTransitStore((s) => s.toggleTheme);
  const clearSelection = useTransitStore((s) => s.clearSelection);

  // Aplica el tema al documento (controla tokens CSS y basemap).
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Esc limpia la selección (§12).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  return (
    <div className="flex h-full flex-col bg-base text-text-primary">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <span className="text-sm font-semibold tracking-heading">BA Transit Live</span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-ok" aria-hidden />
          en vivo
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-control border border-border text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-border bg-surface md:block">
          <LineSelector />
        </aside>

        <main className="relative min-w-0 flex-1">
          <MapView />
        </main>
      </div>
    </div>
  );
}
