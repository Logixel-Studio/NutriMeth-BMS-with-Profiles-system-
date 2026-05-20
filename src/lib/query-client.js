import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Never refetch just because the window got focus — eliminates a major
      // source of request storms when switching tabs/PCs
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect — realtime subscriptions handle updates
      refetchOnReconnect: false,
      // Don't refetch when a component remounts if data is still fresh
      refetchOnMount: false,
      // Only retry once to prevent hammering the server on transient errors
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      // Data stays fresh for 2 minutes — navigation won't trigger new fetches
      staleTime: 2 * 60_000,
      // Keep unused cache for 10 minutes — back-navigation is instant
      gcTime: 10 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
