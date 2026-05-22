import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase, db } from '@/api/supabaseClient';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatNumber } from '@/lib/formatters';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/RoleContext';
import {
  Users, Building2, Activity, Shield, Database,
  TrendingUp, Server, Globe, CheckCircle, Clock, DollarSign
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(160,84%,39%)', 'hsl(199,89%,48%)', 'hsl(43,96%,56%)', 'hsl(280,67%,60%)', 'hsl(0,84%,60%)', 'hsl(22,96%,56%)', 'hsl(340,82%,52%)'];

export default function SuperAdminDashboard() {
  const { formatCurrency } = useCurrency();
  const [sysMetric, setSysMetric] = useState({ latency: '—', uptime: '99.98%' });

  useRealtimeQuery('user_profiles', ['superadmin-profiles']);
  useRealtimeQuery('sales',         ['superadmin-sales']);
  useRealtimeQuery('attendance',    ['superadmin-attendance-today']);

  const { data: profiles = [] } = useQuery({
    queryKey: ['superadmin-profiles'],
    queryFn: async () => { const { data } = await supabase.from('user_profiles').select('*'); return data || []; },
    staleTime: 60_000,
  });
  const { data: sales = [] } = useQuery({ queryKey: ['superadmin-sales'], queryFn: () => db.Sale.list(), staleTime: 60_000 });
  const { data: expenses = [] } = useQuery({ queryKey: ['superadmin-expenses'], queryFn: () => db.Expense.list(), staleTime: 60_000 });
  const { data: products = [] } = useQuery({ queryKey: ['superadmin-products'], queryFn: () => db.Product.list(), staleTime: 60_000 });
  const { data: attendanceToday = [] } = useQuery({
    queryKey: ['superadmin-attendance-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('attendance').select('status').eq('date', today);
      return data || [];
    },
    staleTime: 30_000,
  });
  const { data: pendingLeaves = [] } = useQuery({
    queryKey: ['superadmin-leaves'],
    queryFn: async () => {
      const { data } = await supabase.from('leave_requests').select('id').eq('status', 'pending');
      return data || [];
    },
    staleTime: 60_000,
  });

  // Live latency ping
  useEffect(() => {
    const ping = async () => {
      const t0 = Date.now();
      await supabase.from('user_profiles').select('id').limit(1);
      setSysMetric(m => ({ ...m, latency: `${Date.now() - t0}ms` }));
    };
    ping();
    const t = setInterval(ping, 30_000);
    return () => clearInterval(t);
  }, []);

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + (r.total || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const roleDistribution = profiles.reduce((acc, p) => {
    const role = p.role || 'employee';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const rolePie = Object.entries(roleDistribution).map(([name, value]) => ({
    name: ROLE_LABELS[name] || name, value
  }));

  const cards = [
    { title: 'Total Users', value: formatNumber(profiles.length), icon: Users, delay: 0 },
    { title: 'Products', value: formatNumber(products.length), icon: Database, delay: 0.05 },
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, delay: 0.1 },
    { title: 'Total Expenses', value: formatCurrency(totalExpenses), icon: DollarSign, delay: 0.15 },
    { title: 'Net Profit', value: formatCurrency(netProfit), icon: TrendingUp, delay: 0.2, trendUp: netProfit >= 0 },
    { title: 'Checked In Today', value: String(attendanceToday.filter(a => a.status === 'present' || a.status === 'late').length), icon: CheckCircle, delay: 0.25 },
    { title: 'Pending Leaves', value: String(pendingLeaves.length), icon: Clock, delay: 0.3 },
    { title: 'DB Latency', value: sysMetric.latency, icon: Server, delay: 0.35 },
  ];

  return (
    <div>
      <PageHeader title="Super Admin Dashboard" description="Full system overview — all companies, users, and operations">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Uptime {sysMetric.uptime}</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Users by Role */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">User Role Distribution</h3>
          {rolePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={rolePie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {rolePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No users yet</div>
          )}
        </div>

        {/* All Users Table */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">All Registered Users ({profiles.length})</h3>
          <div className="overflow-x-auto max-h-[220px] overflow-y-auto pr-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {['Name','Email','Role','Joined'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/30 hover:bg-muted/20">
                    <td className="py-2 px-2 font-medium text-foreground text-xs">{p.full_name || '—'}</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs truncate max-w-[140px]">{p.email || '—'}</td>
                    <td className="py-2 px-2">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', ROLE_COLORS[p.role] || ROLE_COLORS.employee)}>
                        {ROLE_LABELS[p.role] || 'Employee'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground text-xs whitespace-nowrap">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                    </td>
                  </motion.tr>
                ))}
                {profiles.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
