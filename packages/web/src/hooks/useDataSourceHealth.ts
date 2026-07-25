import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createFallbackMock,
  resolveDataSource,
  resolveProxyUrl,
  setAdapterOverride,
} from '../data/adapter.js';
import { probeProxyHealth } from '../data/live/index.js';
import { useTransitStore } from '../store/useTransitStore.js';

/**
 * Decide la fuente de datos efectiva (M6): en modo mock avisa que son datos
 * simulados; en modo live, si el proxy no responde cae elegante a mock con
 * aviso visible, y si responde sin credenciales aclara que son datos de ejemplo.
 */
export function useDataSourceHealth(): void {
  const setDataNotice = useTransitStore((s) => s.setDataNotice);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (resolveDataSource() !== 'live') {
      setDataNotice({ level: 'info', text: 'Datos simulados (modo demo)' });
      return;
    }

    let cancelled = false;
    void probeProxyHealth(resolveProxyUrl()).then((health) => {
      if (cancelled) return;
      if (!health) {
        setAdapterOverride(createFallbackMock());
        void queryClient.invalidateQueries();
        setDataNotice({ level: 'warn', text: 'Proxy no disponible — mostrando simulación' });
      } else if (health.upstreams.mode !== 'ok') {
        setDataNotice({ level: 'warn', text: 'Proxy sin credenciales — datos de ejemplo' });
      } else {
        setDataNotice({ level: 'ok', text: 'Datos en vivo' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setDataNotice, queryClient]);
}
