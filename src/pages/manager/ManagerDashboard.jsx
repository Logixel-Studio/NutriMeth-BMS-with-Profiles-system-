import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { motion } from 'framer-motion';
import { Users, CheckSquare, Clock, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PERF_DATA = [
  { week: 'W1', tasks: 24, completed: 20 },
  { week: 'W2', tasks: 18, completed: 17 },
  { week: 'W3', tasks: 30, completed: 27 },
  { week: 'W4', tasks: 22, completed: 19 },
];

const TEAM = [
  { name: 'Ahmed Khan', role: 'Sales Rep', attendance: 95, tasks: 12, completed: 11, perf: 'excellent' },
  { name: 'Sara Ali', role: 'Coordinator', attendance: 88, tasks: 8, completed: 7, perf: 'good' },
  { name: 'Bilal Raza', role: 'Analyst', attendance: 92, tasks: 15, completed: 13, perf: 'good' },
  { name: 'Nida Hassan', role: 'Executive', attendance: 78, tasks: 10, completed: 7, perf: 'needs_improvement' },
];

const PERF_COLORS = {
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  needs_improvement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function ManagerDashboard() {
  const cards = [
    { title: 'Team Size', value: String(TEAM.length), icon: Users, delay: 0 },
    { title: 'Active Tasks', value: '45', icon: CheckSquare, delay: 0.05 },
    { title: 'Avg Attendance', value: '88%', icon: Clock, delay: 0.1 },
    { title: 'Target Progress', value: '76%', icon: Target, delay: 0.15 },
    { title: 'Completed Tasks', value: '38', icon: TrendingUp, delay: 0.2 },
    { title: 'Pending Approvals', value: '3', icon: AlertCircle, delay: 0.25 },
  ];

  return (
    <div>
      <PageHeader title="Team Dashboard" description="Your department overview and team performance" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Weekly Task Completion</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PERF_DATA} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="tasks" name="Assigned" fill="hsl(var(--muted))" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="Completed" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Performance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Team Performance</h3>
          <div className="space-y-3">
            {TEAM.map((member, i) => (
              <motion.div key={member.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role} · {member.completed}/{member.tasks} tasks · {member.attendance}% attendance</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${PERF_COLORS[member.perf]}`}>
                  {member.perf.replace('_', ' ')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
