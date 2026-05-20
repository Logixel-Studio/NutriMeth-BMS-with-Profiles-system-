import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeManager } from '@/api/supabaseClient';

/**
 * useRealtimeQuery
 *
 * Subscribes to Supabase realtime changes for `table` and invalidates
 * the React Query cache entry for `queryKey` when any INSERT/UPDATE/DELETE
 * arrives.
 *
 * Uses the singleton realtimeManager so that if multiple components call
 * useRealtimeQuery for the same table, only ONE websocket channel is created.
 * Each component gets its own listener inside the shared channel.
 *
 * @param {string} table      - Postgres table name, e.g. 'sales'
 * @param {string[]} queryKey - React Query key to invalidate, e.g. ['sales']
 */
export function useRealtimeQuery(table, queryKey) {
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = realtimeManager.subscribe(table, () => {
      qc.invalidateQueries({ queryKey });
    });
    return unsub;
    // queryKey is an array — stringify it so the effect only re-runs if the key
    // actually changes, not just because the array reference changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(queryKey), qc]);
}
