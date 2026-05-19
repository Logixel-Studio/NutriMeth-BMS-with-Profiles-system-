import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/lib/CurrencyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from 'recharts';

const MONTHLY = [
  { m: 'Jan', rev: 420000, exp: 180000, profit: 240000 },
  { m: 'Feb', rev: 380000, exp: 160000, profit: 220000 },
  { m: 'Mar', rev: 510000, exp: 210000, profit: 300000 },
  { m: 'Apr', rev: 460000, exp: 190000, profit: 270000 },
  { m: 'May', rev: 530000, exp: 220000, profit: 310000 },
];

export default function AdminReports() {
  const { formatCurrency } = useCurrency();
  const [period, setPeriod] = useState('monthly');
  const { data: sales = [] } = useQuery({ queryKey: ['rep-sales'], queryFn: () => db.Sale.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['rep-expenses'], queryFn: () => db.Expense.list() });
  const { data: products = [] } = useQuery({ queryKey: ['rep-products'], queryFn: () => db.Product.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['rep-clients'], queryFn: () => db.Client.list() });

  const totalRev = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalExp = expenses.reduce((s, r) => s + (r.total || 0), 0);
  const netProfit = totalRev - totalExp;

  const reportCards = [
    { label: 'Total Revenue', value: formatCurrency(totalRev), icon: TrendingUp, positive: true },
    { label: 'Total Expenses', value: formatCurrency(totalExp), icon: TrendingDown, positive: false },
    { label: 'Net Profit', value: formatCurrency(netProfit), icon: DollarSign, positive: netProfit >= 0 },
    { label: 'Total Products', value: String(products.length), icon: Package, positive: true },
    { label: 'Total Clients', value: String(clients.length), icon: Users, positive: true },
    { label: 'Total Sales', value: String(sales.length), icon: BarChart3, positive: true },
  ];

  return (
    <div>
      <PageHeader title="Business Reports" description="Comprehensive analytics and reporting">
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export PDF</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {reportCards.map((c, i) => (
          <div key={c.label} className="bg-card rounded-xl border border-border p-4">
            <c.icon className={`w-5 h-5 mb-2 ${c.positive ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className="text-lg font-bold text-foreground leading-tight">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="rev" name="Revenue" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
              <Bar dataKey="exp" name="Expenses" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Net Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY}>
              <defs>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={v => formatCurrency(v)} />
              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="hsl(160,84%,39%)" fill="url(#profGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
