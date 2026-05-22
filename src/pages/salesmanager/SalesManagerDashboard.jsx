import { useQuery } from '@tanstack/react-query';
import { db, supabase } from '@/api/supabaseClient';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { formatNumber } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';
import { TrendingUp, Users, CreditCard, Target, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { cn } from '@/lib/utils';

export default function SalesManagerDashboard() {
  const { formatCurrency } = useCurrency();
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1;

  useRealtimeQuery('sales',   ['sm-sales']);
  useRealtimeQuery('clients', ['sm-clients']);

  const { data: sales = [], isLoading }  = useQuery({ queryKey: ['sm-sales'],   queryFn: () => db.Sale.list(),   staleTime: 30_000 });
  const { data: clients = [] }           = useQuery({ queryKey: ['sm-clients'], queryFn: () => db.Client.list(), staleTime: 60_000 });

  // Build monthly trend (last 6 months)
  const monthlyTrend = (() => {
    const map = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { m: d.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, orders: 0 };
    }
    sales.forEach(s => {
      const d = s.created_date || s.created_at;
      if (!d) return;
      const key = d.slice(0, 7);
      if (map[key]) { map[key].revenue += (s.total || 0); map[key].orders++; }
    });
    return Object.values(map);
  })();

  const totalSales     = sales.reduce((s, r) => s + (r.total || 0), 0);
  const paidSales      = sales.filter(s => s.payment_status === 'paid').reduce((a, s) => a + (s.total || 0), 0);
  const pendingAmount  = sales.filter(s => s.payment_status !== 'paid').reduce((a, s) => a + Math.max(0, (s.total || 0) - (s.paid_amount || 0)), 0);
  const thisMonthSales = sales.filter(s => {
    const d = s.created_date || s.created_at;
    if (!d) return false;
    const dt = new Date(d);
    return dt.getMonth() + 1 === month && dt.getFullYear() === year;
  });
  const monthRevenue = thisMonthSales.reduce((s, r) => s + (r.total || 0), 0);

  const cards = [
    { title: 'Total Revenue',  value: formatCurrency(totalSales),    icon: TrendingUp,  delay: 0    },
    { title: 'This Month',     value: formatCurrency(monthRevenue),  icon: DollarSign,  delay: 0.05 },
    { title: 'Total Clients',  value: formatNumber(clients.length),  icon: Users,       delay: 0.1  },
    { title: 'Total Orders',   value: formatNumber(sales.length),    icon: CheckCircle, delay: 0.15 },
    { title: 'Collected',      value: formatCurrency(paidSales),     icon: CreditCard,  delay: 0.2  },
    { title: 'Pending',        value: formatCurrency(pendingAmount), icon: Clock,       delay: 0.25 },
    { title: 'Monthly Orders', value: formatNumber(thisMonthSales.length), icon: Target, delay: 0.3 },
    { title: 'Avg Order',      value: formatCurrency(sales.length > 0 ? totalSales / sales.length : 0), icon: AlertCircle, delay: 0.35 },
  ];

  return (
    <div>
      <PageHeader title="Sales Dashboard" description="Revenue, clients, and order performance" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={v => formatCurrency(v)} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(160,84%,39%)" fill="url(#gRev)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Orders Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="orders" name="Orders" fill="hsl(199,89%,48%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Sales Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Client','Amount','Paid','Balance','Status','Date'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 12).map(s => {
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
              {!isLoading && sales.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No sales found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
