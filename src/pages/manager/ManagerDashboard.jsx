import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { motion } from 'framer-motion';
import { Users, CheckSquare, Clock, Target, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const PERF_COLORS = {
  excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  good:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  needs_improvement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  useRealtimeQuery('tasks',      ['mgr-tasks',  user?.id]);
  useRealtimeQuery('attendance', ['mgr-att',    today]);

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['mgr-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*, user_profiles!tasks_assigned_to_fkey(full_name, email, department)')
        .eq('assigned_by', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: todayAtt = [] } = useQuery({
    queryKey: ['mgr-att', today],
    queryFn: async () => {
      const { data } = await supabase.from('attendance')
        .select('*, user_profiles(full_name, department, role)')
        .eq('date', today);
      return data || [];
    },
    staleTime: 60_000,
  });

  // Group tasks by status for kanban summary
  const todo = allTasks.filter(t => t.status === 'todo').length;
  const inProg = allTasks.filter(t => t.status === 'in_progress').length;
  const done = allTasks.filter(t => t.status === 'done').length;

  // Build performance data from tasks
  const byAssignee = allTasks.reduce((acc, t) => {
    const name = t.user_profiles?.full_name || 'Unknown';
    if (!acc[name]) acc[name] = { total: 0, done: 0 };
    acc[name].total++;
    if (t.status === 'done') acc[name].done++;
    return acc;
  }, {});
  const perfData = Object.entries(byAssignee)
    .map(([name, v]) => ({ name: name.split(' ')[0], tasks: v.total, completed: v.done }))
    .slice(0, 8);

  const cards = [
    { title: 'Tasks Assigned', value: String(allTasks.length), icon: CheckSquare, delay: 0 },
    { title: 'To Do', value: String(todo), icon: Clock, delay: 0.05 },
    { title: 'In Progress', value: String(inProg), icon: TrendingUp, delay: 0.1 },
    { title: 'Completed', value: String(done), icon: Target, delay: 0.15 },
    { title: 'Present Today', value: String(todayAtt.filter(a => a.status === 'present' || a.status === 'late').length), icon: Users, delay: 0.2 },
    { title: 'Late Today', value: String(todayAtt.filter(a => a.status === 'late').length), icon: AlertCircle, delay: 0.25 },
  ];

  return (
    <div>
      <PageHeader title="Team Dashboard" description="Your team's tasks, attendance, and performance" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Task completion chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Team Task Completion</h3>
          {perfData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={perfData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="tasks"     name="Assigned"  fill="hsl(var(--muted))" radius={[4,4,0,0]} />
                <Bar dataKey="completed" name="Completed" fill="hsl(160,84%,39%)"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              {tasksLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'No tasks assigned yet'}
            </div>
          )}
        </div>

        {/* Today's Attendance Feed */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Today's Attendance</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {todayAtt.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No attendance records yet today</p>
            )}
            {todayAtt.slice(0, 10).map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {(r.user_profiles?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.user_profiles?.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{r.user_profiles?.department}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                  r.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  r.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                  {r.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">My Assigned Tasks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Task','Assigned To','Priority','Due Date','Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTasks.slice(0, 10).map(t => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-medium text-foreground">{t.title}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{t.user_profiles?.full_name || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                      t.priority === 'high' ? 'bg-red-100 text-red-700' :
                      t.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{t.due_date || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                      t.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      t.status === 'in_progress' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300')}>
                      {t.status?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {allTasks.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No tasks assigned yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
