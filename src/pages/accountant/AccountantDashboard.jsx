import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatNumber } from '@/lib/formatters';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle, CheckCircle, Receipt, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const MONTHLY_DATA = [
  { month: 'Jan', revenue: 420000, expenses: 180000, profit: 240000 },
  { month: 'Feb', revenue: 380000, expenses: 160000, profit: 220000 },
  { month: 'Mar', revenue: 510000, expenses: 210000, profit: 300000 },
  { month: 'Apr', revenue: 460000, expenses: 190000, profit: 270000 },
  { month: 'May', revenue: 530000, expenses: 220000, profit: 310000 },
];

export default function AccountantDashboard() {
  const { formatCurrency } = useCurrency();
  const { data: sales = [] } = useQuery({ queryKey: ['acc-sales'], queryFn: () => db.Sale.list() });
  const { data: purchases = [] } = useQuery({ queryKey: ['acc-purchases'], queryFn: () => db.Purchase.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['acc-expenses'], queryFn: () => db.Expense.list() });

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalPurchases = purchases.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + (r.total || 0), 0);
  const netProfit = totalRevenue - totalPurchases - totalExpenses;
  const receivable = sales.filter(s => s.payment_status !== 'paid').reduce((a, s) => a + ((s.total || 0) - (s.paid_amount || 0)), 0);
  const payable = purchases.filter(p => p.payment_status !== 'paid').reduce((a, p) => a + ((p.total || 0) - (p.paid_amount || 0)), 0);

  const cards = [
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, delay: 0 },
    { title: 'Total Expenses', value: formatCurrency(totalExpenses), icon: TrendingDown, delay: 0.05 },
    { title: 'Net Profit', value: formatCurrency(netProfit), icon: DollarSign, delay: 0.1, trendUp: netProfit >= 0 },
    { title: 'Receivable', value: formatCurrency(receivable), icon: CreditCard, delay: 0.15 },
    { title: 'Payable', value: formatCurrency(payable), icon: AlertCircle, delay: 0.2 },
    { title: 'Paid Sales', value: formatNumber(sales.filter(s => s.payment_status === 'paid').length), icon: CheckCircle, delay: 0.25 },
    { title: 'Purchases', value: formatCurrency(totalPurchases), icon: Receipt, delay: 0.3 },
    { title: 'Profit Margin', value: totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%', icon: PieChart, delay: 0.35, trendUp: netProfit >= 0 },
  ];

  return (
    <div>
      <PageHeader title="Financial Dashboard" description="Complete financial overview and analytics" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses — Monthly</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_DATA} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="profit" name="Net Profit" stroke="hsl(160,84%,39%)" strokeWidth={2.5} dot={{ fill: 'hsl(160,84%,39%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Sales Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Client</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Paid</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Balance</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 8).map(s => (
                <tr key={s.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-medium text-foreground">{s.client_name || '—'}</td>
                  <td className="py-2.5 px-3">{formatCurrency(s.total || 0)}</td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">{formatCurrency(s.paid_amount || (s.payment_status === 'paid' ? s.total : 0))}</td>
                  <td className="py-2.5 px-3 text-red-500">{formatCurrency(Math.max(0, (s.total || 0) - (s.paid_amount || (s.payment_status === 'paid' ? s.total : 0))))}</td>
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
              {sales.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No transactions found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
