import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { supabase } from '@/api/supabaseClient';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatNumber } from '@/lib/formatters';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle, CheckCircle, Receipt, PieChart as PieIcon, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AccountantDashboard() {
  const { formatCurrency } = useCurrency();
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1;

  useRealtimeQuery('sales',     ['acc-sales']);
  useRealtimeQuery('purchases', ['acc-purchases']);
  useRealtimeQuery('expenses',  ['acc-expenses']);
  useRealtimeQuery('payroll',   ['acc-payroll', year, month]);

  const { data: sales = [], isLoading: sl } = useQuery({ queryKey: ['acc-sales'],     queryFn: () => db.Sale.list(),     staleTime: 60_000 });
  const { data: purchases = [] }            = useQuery({ queryKey: ['acc-purchases'], queryFn: () => db.Purchase.list(), staleTime: 60_000 });
  const { data: expenses = [] }             = useQuery({ queryKey: ['acc-expenses'],  queryFn: () => db.Expense.list(),  staleTime: 60_000 });
  const { data: payrolls = [] }             = useQuery({
    queryKey: ['acc-payroll', year, month],
    queryFn: async () => {
      const { data } = await supabase.from('payroll').select('net_salary, status').eq('year', year).eq('month', month);
      return data || [];
    },
    staleTime: 60_000,
  });

  const totalRevenue   = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalPurchases = purchases.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpenses  = expenses.reduce((s, r) => s + (r.total || 0), 0);
  const totalPayroll   = payrolls.reduce((s, p) => s + (p.net_salary || 0), 0);
  const netProfit      = totalRevenue - totalPurchases - totalExpenses - totalPayroll;
  const receivable     = sales.filter(s => s.payment_status !== 'paid').reduce((a, s) => a + Math.max(0, (s.total || 0) - (s.paid_amount || 0)), 0);
  const payable        = purchases.filter(p => p.payment_status !== 'paid').reduce((a, p) => a + Math.max(0, (p.total || 0) - (p.paid_amount || 0)), 0);
  const grossMargin    = totalRevenue > 0 ? ((totalRevenue - totalPurchases) / totalRevenue * 100).toFixed(1) : 0;

  // Build last-6-months trend from sales
  const monthlyTrend = (() => {
    const map = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { m: d.toLocaleDateString('en-US', { month: 'short' }), rev: 0, exp: 0 };
    }
    sales.forEach(s => {
      const d = s.created_date || s.created_at;
      if (!d) return;
      const key = d.slice(0, 7);
      if (map[key]) map[key].rev += (s.total || 0);
    });
    expenses.forEach(e => {
      const d = e.created_date || e.created_at;
      if (!d) return;
      const key = d.slice(0, 7);
      if (map[key]) map[key].exp += (e.total || 0);
    });
    return Object.values(map).map(v => ({ ...v, profit: v.rev - v.exp }));
  })();

  const cards = [
    { title: 'Total Revenue',   value: formatCurrency(totalRevenue),   icon: TrendingUp,  delay: 0,    trendUp: true },
    { title: 'Total Purchases', value: formatCurrency(totalPurchases), icon: TrendingDown, delay: 0.05 },
    { title: 'Total Expenses',  value: formatCurrency(totalExpenses),  icon: Receipt,     delay: 0.1  },
    { title: 'Payroll (Month)', value: formatCurrency(totalPayroll),   icon: DollarSign,  delay: 0.15 },
    { title: 'Net Profit',      value: formatCurrency(netProfit),      icon: PieIcon,     delay: 0.2,  trendUp: netProfit >= 0 },
    { title: 'Receivable',      value: formatCurrency(receivable),     icon: CreditCard,  delay: 0.25 },
    { title: 'Payable',         value: formatCurrency(payable),        icon: AlertCircle, delay: 0.3  },
    { title: 'Gross Margin',    value: `${grossMargin}%`,              icon: CheckCircle, delay: 0.35, trendUp: Number(grossMargin) > 30 },
  ];

  return (
    <div>
      <PageHeader title="Financial Dashboard" description="Real-time revenue, expenses, payroll, and profit analysis" />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses — 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="rev" name="Revenue"  fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
              <Bar dataKey="exp" name="Expenses" fill="hsl(0,84%,60%)"   radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Net Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="profit" name="Net Profit" stroke="hsl(160,84%,39%)" strokeWidth={2.5}
                dot={{ fill: 'hsl(160,84%,39%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sales Transactions */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Sales Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Client','Amount','Paid','Balance','Status','Date'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map(s => {
                const paid = s.payment_status === 'paid' ? (s.total || 0) : (s.paid_amount || 0);
                const bal  = Math.max(0, (s.total || 0) - paid);
                return (
                  <tr key={s.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{s.client_name || '—'}</td>
                    <td className="py-2.5 px-3">{formatCurrency(s.total || 0)}</td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">{formatCurrency(paid)}</td>
                    <td className="py-2.5 px-3 text-red-500">{bal > 0 ? formatCurrency(bal) : '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                        s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        s.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                        {s.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">
                      {s.created_date ? new Date(s.created_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
              {!sl && sales.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
