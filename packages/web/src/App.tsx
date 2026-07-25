/**
 * Shell de la app (M0). Andamiaje visual: header, sidebar, área de mapa y
 * ticker según el layout del §9, con el sistema visual del §13 aplicado.
 * Todavía sin datos, mapa ni interacción — eso llega en M2–M4.
 */
export function App(): JSX.Element {
  return (
    <div className="flex h-full flex-col bg-base text-text-primary">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <span className="text-sm font-semibold tracking-heading">BA Transit Live</span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-ok" aria-hidden />
          en vivo
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 border-r border-border bg-surface md:block" />

        <main className="relative flex flex-1 items-center justify-center bg-base">
          <p className="max-w-sm text-center text-sm text-text-muted">
            Andamiaje listo. El mapa y los datos en vivo llegan en los próximos milestones.
          </p>
        </main>
      </div>

      <footer className="flex h-9 shrink-0 items-center border-t border-border bg-surface px-4 text-xs text-text-muted">
        Sin alertas de servicio
      </footer>
    </div>
  );
}
