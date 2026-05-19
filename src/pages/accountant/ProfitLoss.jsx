import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import { useCurrency } from '@/lib/CurrencyContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['hsl(160,84%,39%)', 'hsl(0,84%,60%)', 'hsl(43,96%,56%)', 'hsl(199,89%,48%)'];

const MONTHLY = [
  { m: 'Jan', revenue: 420000, cogs: 210000, gross: 210000, operating: 180000, expenses: 60000, net: 150000 },
  { m: 'Feb', revenue: 380000, cogs: 190000, gross: 190000, operating: 160000, expenses: 55000, net: 130000 },
  { m: 'Mar', revenue: 510000, cogs: 255000, gross: 255000, operating: 220000, expenses: 70000, net: 185000 },
  { m: 'Apr', revenue: 460000, cogs: 230000, gross: 230000, operating: 195000, expenses: 65000, net: 165000 },
  { m: 'May', revenue: 530000, cogs: 265000, gross: 265000, operating: 225000, expenses: 72000, net: 193000 },
];

export default function ProfitLoss() {
  const { formatCurrency } = useCurrency();
  const { data: sales = [] } = useQuery({ queryKey: ['pl-sales'], queryFn: () => db.Sale.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['pl-expenses'], queryFn: () => db.Expense.list() });
  const { data: purchases = [] } = useQuery({ queryKey: ['pl-purchases'], queryFn: () => db.Purchase.list() });

  const revenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const cogs = purchases.reduce((s, r) => s + (r.total || 0), 0);
  const opExpenses = expenses.reduce((s, r) => s + (r.total || 0), 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opExpenses;
  const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
  const netMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'COGS', value: cogs },
    { name: 'Op. Expenses', value: opExpenses },
    { name: 'Net Profit', value: Math.max(0, netProfit) },
  ];

  return (
    <div>
      <PageHeader title="Profit & Loss Report" description="Full income statement and margin analysis">
        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export PDF</Button>
      </PageHeader>

      {/* P&L Summary Table */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <h3 className="font-semibold text-foreground mb-4">Income Statement Summary</h3>
        <div className="space-y-1">
          {[
            { label: 'Revenue', value: revenue, indent: 0, bold: false, color: 'text-foreground' },
            { label: 'Cost of Goods Sold (COGS)', value: -cogs, indent: 1, bold: false, color: 'text-red-500' },
            { label: 'Gross Profit', value: grossProfit, indent: 0, bold: true, color: grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500' },
            { label: 'Operating Expenses', value: -opExpenses, indent: 1, bold: false, color: 'text-red-500' },
            { label: 'Net Profit', value: netProfit, indent: 0, bold: true, color: netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500' },
          ].map(row => (
            <div key={row.label} className={`flex items-center justify-between py-2.5 border-b border-border/40 last:border-b-0 ${row.bold ? 'bg-muted/30 px-3 rounded-lg mt-1' : ''}`}
              style={{ paddingLeft: row.indent > 0 ? `${row.indent * 24 + 12}px` : '12px' }}>
              <span className={`text-sm ${row.bold ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{row.label}</span>
              <span className={`text-sm font-semibold ${row.color}`}>{row.value < 0 ? `(${formatCurrency(Math.abs(row.value))})` : formatCurrency(row.value)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-foreground">{grossMargin}%</p>
            <p className="text-sm text-muted-foreground">Gross Margin</p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className={`text-2xl font-bold ${Number(netMargin) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{netMargin}%</p>
            <p className="text-sm text-muted-foreground">Net Margin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Net Profit</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={v => formatCurrency(v)} />
              <Bar dataKey="net" name="Net Profit" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
