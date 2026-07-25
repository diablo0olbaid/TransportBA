import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente de TanStack Query (§11): retry con backoff exponencial y refetch en
 * reconexión. El `refetchInterval` por feed se define en cada hook según el
 * auto-refresh elegido; en background se pausa (pestaña oculta).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 16000),
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
      staleTime: 10000,
    },
  },
});
