import { useEffect, useState } from 'react';
import { Header } from './components/header/Header.js';
import { Sidebar } from './components/sidebar/Sidebar.js';
import { MapView } from './components/map/MapView.js';
import { Panel } from './components/detail/Panel.js';
import { Ticker } from './components/ticker/Ticker.js';
import { ShortcutsModal } from './components/ShortcutsModal.js';
import { DataSourceBanner } from './components/DataSourceBanner.js';
import { AccessibleLineTable } from './components/map/AccessibleLineTable.js';
import { useTransitStore } from './store/useTransitStore.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useUrlState } from './hooks/useUrlState.js';
import { useDataSourceHealth } from './hooks/useDataSourceHealth.js';

/**
 * Shell completo de la app (M4): header, sidebar, mapa, panel de 4 tabs y
 * ticker, con atajos de teclado, estado en la URL y responsive. Todo contra
 * mocks.
 */
export function App(): JSX.Element {
  const theme = useTransitStore((s) => s.theme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useKeyboardShortcuts();
  useUrlState();
  useDataSourceHealth();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="flex h-full flex-col bg-base text-text-primary">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <DataSourceBanner />

      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar: fijo en desktop, overlay deslizable en mobile (§12). */}
        <aside
          className={`absolute inset-y-0 left-0 z-40 w-80 max-w-[85%] shrink-0 border-r border-border bg-surface transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <Sidebar />
        </aside>
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            role="presentation"
          />
        )}

        <main className="relative min-w-0 flex-1" aria-label="Mapa del transporte">
          <MapView />
          <AccessibleLineTable />
        </main>

        <Panel />
      </div>

      <Ticker />
      <ShortcutsModal />
    </div>
  );
}
