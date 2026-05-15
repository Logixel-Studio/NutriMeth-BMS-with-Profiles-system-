import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,    // don't re-fetch when component mounts if data is fresh
      retry: 1,
      staleTime: 60_000,        // data stays fresh for 60s — prevents refetch on every navigation
      gcTime: 10 * 60_000,      // keep unused cache for 10 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});
