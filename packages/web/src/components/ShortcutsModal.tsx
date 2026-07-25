import { useTransitStore } from '../store/useTransitStore.js';
import { Modal } from './ui/primitives.js';

const SHORTCUTS: [string, string][] = [
  ['/', 'Buscar estación'],
  ['1 – 7', 'Aislar línea (A–H, P)'],
  ['Esc', 'Limpiar selección y cerrar panel'],
  ['L', 'Alternar capa de colectivos'],
  ['?', 'Mostrar esta ayuda'],
];

/** Modal de atajos de teclado (§12). */
export function ShortcutsModal(): JSX.Element {
  const open = useTransitStore((s) => s.shortcutsOpen);
  const setOpen = useTransitStore((s) => s.setShortcutsOpen);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Atajos de teclado">
      <ul className="flex flex-col gap-2">
        {SHORTCUTS.map(([key, desc]) => (
          <li key={key} className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{desc}</span>
            <kbd className="rounded-chip border border-border bg-base px-2 py-0.5 text-xs tabular">
              {key}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
