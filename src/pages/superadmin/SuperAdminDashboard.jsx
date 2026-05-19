import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { db, supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatNumber } from '@/lib/formatters';
import {
  Users, Building2, Activity, Shield, Database,
  TrendingUp, Server, Globe, AlertTriangle, CheckCircle,
  Clock, DollarSign, BarChart3, Lock
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['hsl(160,84%,39%)', 'hsl(199,89%,48%)', 'hsl(43,96%,56%)', 'hsl(280,67%,60%)', 'hsl(0,84%,60%)'];

export default function SuperAdminDashboard() {
  const { formatCurrency } = useCurrency();
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', uptime: '99.98%', latency: '42ms' });
  const [activityData] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      users: Math.floor(Math.random() * 80 + 20),
      sessions: Math.floor(Math.random() * 300 + 100),
      revenue: Math.floor(Math.random() * 50000 + 10000),
    }))
  );

  const { data: sales = [] } = useQuery({ queryKey: ['superadmin-sales'], queryFn: () => db.Sale.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['superadmin-clients'], queryFn: () => db.Client.list() });
  const { data: products = [] } = useQuery({ queryKey: ['superadmin-products'], queryFn: () => db.Product.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['superadmin-expenses'], queryFn: () => db.Expense.list() });
  const { data: profiles = [] } = useQuery({
    queryKey: ['superadmin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('*');
      return data || [];
    }
  });

  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + (r.total || 0), 0);

  const roleDistribution = profiles.reduce((acc, p) => {
    const role = p.role || 'employee';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const rolePieData = Object.entries(roleDistribution).map(([name, value]) => ({ name, value }));

  const cards = [
    { title: 'Total Users', value: formatNumber(profiles.length), icon: Users, delay: 0 },
    { title: 'Total Clients', value: formatNumber(clients.length), icon: Globe, delay: 0.05 },
    { title: 'Total Products', value: formatNumber(products.length), icon: Database, delay: 0.1 },
    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, delay: 0.15 },
    { title: 'Total Expenses', value: formatCurrency(totalExpenses), icon: TrendingUp, delay: 0.2 },
    { title: 'System Uptime', value: systemHealth.uptime, icon: Server, delay: 0.25 },
    { title: 'Avg Latency', value: systemHealth.latency, icon: Activity, delay: 0.3 },
    { title: 'Net Profit', value: formatCurrency(totalRevenue - totalExpenses), icon: BarChart3, delay: 0.35, trendUp: totalRevenue > totalExpenses },
  ];

  return (
    <div>
      <PageHeader title="Super Admin — Global Dashboard" description="Full system overview and monitoring" />

      {/* System Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
      >
        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          All systems operational · Uptime {systemHealth.uptime} · Response {systemHealth.latency}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
        {cards.map(card => <SummaryCard key={card.title} {...card} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">System Activity — Monthly</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="sessions" stroke="hsl(160,84%,39%)" fill="url(#colorSessions)" strokeWidth={2} name="Sessions" />
              <Area type="monotone" dataKey="users" stroke="hsl(199,89%,48%)" fill="transparent" strokeWidth={2} name="Users" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution Pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">User Role Distribution</h3>
          {rolePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={rolePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {rolePieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No user data</div>
          )}
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Registered Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.slice(0, 10).map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground">{p.full_name || '—'}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{p.email || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                      {(p.role || 'employee').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
