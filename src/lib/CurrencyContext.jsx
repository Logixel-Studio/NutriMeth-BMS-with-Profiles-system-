import { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';

const CurrencyContext = createContext({
  symbol: 'Rs',
  currency: 'PKR',
  formatCurrency: (v) => `Rs${Number(v || 0).toFixed(2)}`,
  refreshSettings: () => {},
});

export function CurrencyProvider({ children }) {
  const qc = useQueryClient();

  // Re-use the same React Query cache key as the Settings page uses.
  // This means only ONE network request for settings across the whole app,
  // and the CurrencyProvider stays in sync with any Settings page updates.
  const { data: settingsList = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: () => db.CompanySettings.list(),
    staleTime: 5 * 60_000, // settings change rarely — stay fresh 5 minutes
  });

  const settings = settingsList[0] || {};
  const symbol = settings.currency_symbol || 'Rs';
  const currency = settings.currency || 'PKR';

  // refreshSettings just invalidates the cache — no direct fetch needed
  const refreshSettings = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['settings'] });
  }, [qc]);

  const formatCurrency = useCallback((amount) => {
    if (amount == null || isNaN(amount)) return `${symbol}0.00`;
    return `${symbol}${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [symbol]);

  const value = useMemo(() => ({
    symbol, currency, formatCurrency, refreshSettings,
  }), [symbol, currency, formatCurrency, refreshSettings]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
