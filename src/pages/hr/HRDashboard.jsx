import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { motion } from 'framer-motion';
import { Users, Clock, DollarSign, CalendarDays, Award, TrendingUp, UserCheck, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ROLE_LABELS } from '@/lib/RoleContext';
import { useCurrency } from '@/lib/CurrencyContext';

const COLORS = ['hsl(160,84%,39%)', 'hsl(199,89%,48%)', 'hsl(43,96%,56%)', 'hsl(280,67%,60%)', 'hsl(0,84%,60%)'];

export default function HRDashboard() {
  const { formatCurrency } = useCurrency();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth() + 1;

  useRealtimeQuery('user_profiles',   ['hr-profiles']);
  useRealtimeQuery('attendance',      ['hr-att-today', today]);
  useRealtimeQuery('leave_requests',  ['hr-leaves']);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['hr-profiles'],
    queryFn: async () => { const { data } = await supabase.from('user_profiles').select('*').neq('role', 'super_admin'); return data || []; },
    staleTime: 60_000,
  });

  const { data: todayAtt = [] } = useQuery({
    queryKey: ['hr-att-today', today],
    queryFn: async () => { const { data } = await supabase.from('attendance').select('status').eq('date', today); return data || []; },
    staleTime: 30_000,
  });

  const { data: pendingLeaves = [] } = useQuery({
    queryKey: ['hr-leaves'],
    queryFn: async () => { const { data } = await supabase.from('leave_requests').select('id, leave_type').eq('status', 'pending'); return data || []; },
    staleTime: 30_000,
  });

  const { data: thisMonthPayroll = [] } = useQuery({
    queryKey: ['hr-payroll', year, month],
    queryFn: async () => {
      const { data } = await supabase.from('payroll').select('net_salary, status').eq('year', year).eq('month', month);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: pendingDocs = [] } = useQuery({
    queryKey: ['hr-docs'],
    queryFn: async () => { const { data } = await supabase.from('employee_documents').select('id').eq('status', 'pending'); return data || []; },
    staleTime: 60_000,
  });

  const present = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const totalPayroll = thisMonthPayroll.reduce((s, p) => s + (p.net_salary || 0), 0);

  // Dept distribution
  const deptDist = profiles.reduce((acc, p) => {
    const d = p.department || 'Unassigned';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const deptPie = Object.entries(deptDist).map(([name, value]) => ({ name, value }));

  // Leave type distribution
  const leaveDist = pendingLeaves.reduce((acc, l) => {
    acc[l.leave_type] = (acc[l.leave_type] || 0) + 1;
    return acc;
  }, {});
  const leaveData = Object.entries(leaveDist).map(([type, count]) => ({ type: type.replace(' Leave', ''), count }));

  const cards = [
    { title: 'Total Employees', value: String(profiles.length), icon: Users, delay: 0 },
    { title: 'Present Today', value: String(present), icon: UserCheck, delay: 0.05 },
    { title: 'Leave Requests', value: String(pendingLeaves.length), icon: CalendarDays, delay: 0.1 },
    { title: 'Pending Docs', value: String(pendingDocs.length), icon: FileText, delay: 0.15 },
    { title: 'Payroll (Month)', value: formatCurrency(totalPayroll), icon: DollarSign, delay: 0.2 },
    { title: 'Processed Pay', value: String(thisMonthPayroll.filter(p => p.status === 'paid').length), icon: Award, delay: 0.25 },
    { title: 'Absent Today', value: String(todayAtt.filter(a => a.status === 'absent').length), icon: AlertTriangle, delay: 0.3 },
    { title: 'Late Today', value: String(todayAtt.filter(a => a.status === 'late').length), icon: Clock, delay: 0.35 },
  ];

  return (
    <div>
      <PageHeader title="HR Dashboard" description="Workforce overview — attendance, payroll, leaves, and documents" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Employees by Department</h3>
          {deptPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {deptPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Pending Leave Requests by Type</h3>
          {leaveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaveData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" name="Requests" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <CalendarDays className="w-8 h-8 opacity-30" />
              <p className="text-sm">No pending leave requests</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">All Employees ({profiles.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Employee','Email','Role','Department','Salary','Employee ID'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.slice(0, 15).map(p => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-medium text-foreground text-sm">{p.full_name || '—'}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{p.email}</td>
                  <td className="py-2.5 px-3 text-primary text-xs font-medium capitalize">{(p.role || 'employee').replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{p.department || '—'}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{p.base_salary > 0 ? formatCurrency(p.base_salary) : '—'}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground text-xs">{p.employee_id || '—'}</td>
                </tr>
              ))}
              {!isLoading && profiles.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
