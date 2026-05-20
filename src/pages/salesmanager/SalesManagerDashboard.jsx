import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { formatNumber } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';
import { TrendingUp, Users, CreditCard, Target, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const TARGET_DATA = [
  { month: 'Jan', target: 500000, actual: 420000 },
  { month: 'Feb', target: 500000, actual: 380000 },
  { month: 'Mar', target: 550000, actual: 510000 },
  { month: 'Apr', target: 550000, actual: 460000 },
  { month: 'May', target: 600000, actual: 530000 },
];

export default function SalesManagerDashboard() {
  const { formatCurrency } = useCurrency();
  const { data: sales = [] } = useQuery({ queryKey: ['sm-sales'], queryFn: () => db.Sale.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['sm-clients'], queryFn: () => db.Client.list() });

  const totalSales = sales.reduce((s, r) => s + (r.total || 0), 0);
  const paidSales = sales.filter(s => s.payment_status === 'paid').reduce((a, s) => a + (s.total || 0), 0);
  const pendingAmount = sales.filter(s => s.payment_status !== 'paid').reduce((a, s) => a + ((s.total || 0) - (s.paid_amount || 0)), 0);
  const thisMonth = sales.filter(s => {
    const d = new Date(s.created_date || s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonth.reduce((s, r) => s + (r.total || 0), 0);

  const cards = [
    { title: 'Total Sales', value: formatCurrency(totalSales), icon: TrendingUp, delay: 0 },
    { title: 'This Month', value: formatCurrency(monthRevenue), icon: DollarSign, delay: 0.05 },
    { title: 'Total Clients', value: formatNumber(clients.length), icon: Users, delay: 0.1 },
    { title: 'Total Orders', value: formatNumber(sales.length), icon: CheckCircle, delay: 0.15 },
    { title: 'Collected', value: formatCurrency(paidSales), icon: CreditCard, delay: 0.2 },
    { title: 'Pending', value: formatCurrency(pendingAmount), icon: Clock, delay: 0.25 },
    { title: 'Monthly Target', value: '600,000', icon: Target, delay: 0.3 },
    { title: 'Target %', value: `${totalSales > 0 ? Math.min(100, Math.round((monthRevenue / 600000) * 100)) : 0}%`, icon: AlertCircle, delay: 0.35, trendUp: monthRevenue >= 600000 },
  ];

  return (
    <div>
      <PageHeader title="Sales Dashboard" description="Revenue performance, targets and client insights" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Target vs Actual Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TARGET_DATA} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="target" name="Target" fill="hsl(var(--muted))" radius={[4,4,0,0]} />
              <Bar dataKey="actual" name="Actual" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TARGET_DATA}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Area type="monotone" dataKey="actual" name="Revenue" stroke="hsl(160,84%,39%)" fill="url(#gRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Sales Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Client</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 8).map(s => (
                <tr key={s.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-medium text-foreground">{s.client_name || '—'}</td>
                  <td className="py-2.5 px-3">{formatCurrency(s.total || 0)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      s.payment_status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {s.payment_status || 'unpaid'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{s.created_date ? new Date(s.created_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No sales found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
