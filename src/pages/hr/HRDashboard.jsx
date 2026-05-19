import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { motion } from 'framer-motion';
import { Users, Clock, DollarSign, CalendarDays, Award, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const DEPT_DATA = [
  { dept: 'Sales', employees: 8, present: 7 },
  { dept: 'HR', employees: 4, present: 4 },
  { dept: 'Finance', employees: 5, present: 4 },
  { dept: 'Inventory', employees: 6, present: 5 },
  { dept: 'Operations', employees: 9, present: 8 },
];
const LEAVE_DATA = [
  { name: 'Annual Leave', value: 12 },
  { name: 'Sick Leave', value: 5 },
  { name: 'Unpaid', value: 2 },
  { name: 'Maternity', value: 1 },
];
const COLORS = ['hsl(160,84%,39%)', 'hsl(199,89%,48%)', 'hsl(43,96%,56%)', 'hsl(280,67%,60%)'];

export default function HRDashboard() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['hr-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('*');
      return data || [];
    }
  });

  const totalEmployees = profiles.length;
  const activeToday = Math.floor(totalEmployees * 0.88);
  const onLeave = Math.floor(totalEmployees * 0.08);
  const pendingLeaves = 3;

  const cards = [
    { title: 'Total Employees', value: String(totalEmployees), icon: Users, delay: 0 },
    { title: 'Present Today', value: String(activeToday), icon: UserCheck, delay: 0.05 },
    { title: 'On Leave', value: String(onLeave), icon: CalendarDays, delay: 0.1 },
    { title: 'Pending Approvals', value: String(pendingLeaves), icon: AlertTriangle, delay: 0.15 },
    { title: 'Avg Attendance', value: '92%', icon: Clock, delay: 0.2 },
    { title: 'Open Positions', value: '4', icon: TrendingUp, delay: 0.25 },
    { title: 'Payroll Due', value: '12 days', icon: DollarSign, delay: 0.3 },
    { title: 'Performers', value: '18', icon: Award, delay: 0.35 },
  ];

  return (
    <div>
      <PageHeader title="HR Dashboard" description="Human resources overview and workforce analytics" />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Dept Attendance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Department Attendance Today</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DEPT_DATA} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="employees" name="Total" fill="hsl(var(--muted))" radius={[4,4,0,0]} />
              <Bar dataKey="present" name="Present" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Distribution */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Active Leave Types</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={LEAVE_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                {LEAVE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Employee List */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">All Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Employee</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {profiles.slice(0, 8).map((p, i) => (
                <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {(p.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{p.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{p.email || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-xs font-medium text-primary capitalize">{(p.role || 'employee').replace('_', ' ')}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
