import { useEffect } from 'react';
import { useTransitStore } from '../store/useTransitStore.js';

const NUMBER_TO_LINE: Record<string, string> = {
  '1': 'A',
  '2': 'B',
  '3': 'C',
  '4': 'D',
  '5': 'E',
  '6': 'H',
  '7': 'P',
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

/**
 * Atajos globales (§12): `/` buscar · `1-6` aislar línea · `Esc` limpiar y
 * cerrar panel · `L` toggle capa colectivos · `?` modal de atajos.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useTransitStore.getState().escape();
        return;
      }
      if (isTypingTarget(e.target)) return;

      if (e.key === '/') {
        e.preventDefault();
        useTransitStore.getState().requestSearchFocus();
      } else if (e.key === '?') {
        useTransitStore.getState().setShortcutsOpen(true);
      } else if (e.key === 'l' || e.key === 'L') {
        useTransitStore.getState().toggleLayer('colectivos');
      } else if (NUMBER_TO_LINE[e.key]) {
        useTransitStore.getState().selectLine(NUMBER_TO_LINE[e.key]!, e.metaKey || e.ctrlKey);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
