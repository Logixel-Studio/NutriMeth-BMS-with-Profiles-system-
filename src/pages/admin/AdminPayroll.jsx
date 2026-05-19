import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { DollarSign, Users, CheckCircle, Clock, Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/lib/CurrencyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const PAYROLL_DATA = [
  { month: 'Jan', payroll: 2850000, processed: 28 },
  { month: 'Feb', payroll: 2920000, processed: 30 },
  { month: 'Mar', payroll: 3010000, processed: 31 },
  { month: 'Apr', payroll: 2890000, processed: 29 },
  { month: 'May', payroll: 3050000, processed: 0 },
];

const DEPTS = [
  { dept: 'Sales', employees: 8, total: 680000, status: 'pending' },
  { dept: 'HR', employees: 4, total: 320000, status: 'paid' },
  { dept: 'Finance', employees: 5, total: 425000, status: 'pending' },
  { dept: 'Inventory', employees: 6, total: 480000, status: 'paid' },
  { dept: 'Operations', employees: 9, total: 720000, status: 'pending' },
  { dept: 'IT', employees: 3, total: 425000, status: 'paid' },
];

export default function AdminPayroll() {
  const { formatCurrency } = useCurrency();
  const [month, setMonth] = useState('May');
  const [depts, setDepts] = useState(DEPTS);

  const totalPayroll = depts.reduce((s, d) => s + d.total, 0);
  const paid = depts.filter(d => d.status === 'paid').reduce((s, d) => s + d.total, 0);
  const pending = depts.filter(d => d.status === 'pending').reduce((s, d) => s + d.total, 0);

  const processAll = () => {
    setDepts(prev => prev.map(d => ({ ...d, status: 'paid' })));
    toast.success('All department payrolls processed!');
  };

  return (
    <div>
      <PageHeader title="Payroll Monitoring" description="Company-wide payroll overview and processing">
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={processAll} disabled={depts.every(d => d.status === 'paid')}>
            <CheckCircle className="w-4 h-4 mr-2" /> Process All
          </Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Payroll', value: formatCurrency(totalPayroll), icon: DollarSign, c: 'text-primary' },
          { label: 'Processed', value: formatCurrency(paid), icon: CheckCircle, c: 'text-emerald-500' },
          { label: 'Pending', value: formatCurrency(pending), icon: Clock, c: 'text-amber-500' },
          { label: 'Total Employees', value: String(depts.reduce((s, d) => s + d.employees, 0)), icon: Users, c: 'text-blue-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.c}`} />
            <div><p className="text-lg font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Payroll Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PAYROLL_DATA} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                formatter={v => formatCurrency(v)} />
              <Bar dataKey="payroll" name="Total Payroll" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Department Payroll — {month} 2026</h3>
          <div className="space-y-3">
            {depts.map((d, i) => (
              <motion.div key={d.dept} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{d.dept}</p>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(d.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{d.employees} employees</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      d.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{d.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
