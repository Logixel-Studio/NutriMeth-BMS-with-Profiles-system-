import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { Clock, Users, CheckCircle, XCircle, AlertTriangle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const ST = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  late:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  absent:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  leave:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AdminAttendance() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useRealtimeQuery('attendance', ['admin-attendance', dateFilter]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['admin-attendance', dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, user_profiles(full_name, email, department, role)')
        .eq('date', dateFilter)
        .order('check_in', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Build weekly trend (last 7 days)
  const { data: weeklyData = [] } = useQuery({
    queryKey: ['admin-attendance-week'],
    queryFn: async () => {
      const results = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const day = d.toISOString().split('T')[0];
        const { data } = await supabase.from('attendance').select('status').eq('date', day);
        const rows = data || [];
        results.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          present: rows.filter(r => r.status === 'present').length,
          late:    rows.filter(r => r.status === 'late').length,
          absent:  rows.filter(r => r.status === 'absent').length,
        });
      }
      return results;
    },
    staleTime: 5 * 60_000,
  });

  const present = records.filter(r => r.status === 'present').length;
  const late    = records.filter(r => r.status === 'late').length;
  const absent  = records.filter(r => r.status === 'absent').length;

  const exportCSV = () => {
    const headers = ['Employee','Email','Department','Status','Check In','Check Out','Hours','Late Mins','Late Deduction'];
    const rows = records.map(r => [
      r.user_profiles?.full_name || '',
      r.user_profiles?.email || '',
      r.user_profiles?.department || '',
      r.status,
      r.check_in ? new Date(r.check_in).toLocaleTimeString() : '',
      r.check_out ? new Date(r.check_out).toLocaleTimeString() : '',
      r.hours_worked || 0,
      r.late_minutes || 0,
      r.late_deduction || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance_${dateFilter}.csv`; a.click();
  };

  return (
    <div>
      <PageHeader title="Attendance Monitoring" description="Real-time company-wide attendance tracking">
        <div className="flex items-center gap-2">
          <Input type="date" className="w-40" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />CSV</Button>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Records', value: String(records.length), icon: Users, c: 'text-primary' },
          { label: 'Present', value: String(present), icon: CheckCircle, c: 'text-emerald-500' },
          { label: 'Late', value: String(late), icon: AlertTriangle, c: 'text-amber-500' },
          { label: 'Absent', value: String(absent), icon: XCircle, c: 'text-red-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.c}`} />
            <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">7-Day Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="present" name="Present" fill="hsl(160,84%,39%)" radius={[3,3,0,0]} />
              <Bar dataKey="late"    name="Late"    fill="hsl(43,96%,56%)"  radius={[3,3,0,0]} />
              <Bar dataKey="absent"  name="Absent"  fill="hsl(0,84%,60%)"   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Live Feed — {dateFilter}</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {records.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-6">No records for this date</p>
            )}
            {records.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {(r.user_profiles?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.user_profiles?.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {r.check_out ? ` → ${new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {r.late_minutes > 0 && ` · ${r.late_minutes}m late`}
                  </p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0', ST[r.status] || ST.present)}>
                  {r.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Detailed Attendance — {dateFilter}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Employee','Dept','Status','In','Out','Hours','Late','Deduction','Office'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{r.user_profiles?.full_name || '—'}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{r.user_profiles?.department || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', ST[r.status] || ST.present)}>{r.status}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-foreground">{r.check_in ? new Date(r.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="py-3 px-4 text-xs text-foreground">{r.check_out ? new Date(r.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'In office'}</td>
                  <td className="py-3 px-4 text-xs text-foreground">{r.hours_worked > 0 ? `${Number(r.hours_worked).toFixed(1)}h` : '—'}</td>
                  <td className="py-3 px-4 text-xs">{r.late_minutes > 0 ? <span className="text-amber-500">{r.late_minutes}m</span> : '—'}</td>
                  <td className="py-3 px-4 text-xs">{r.late_deduction > 0 ? <span className="text-red-500">PKR {r.late_deduction?.toLocaleString()}</span> : '—'}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{r.office_name || '—'}</td>
                </tr>
              ))}
              {records.length === 0 && !isLoading && (
                <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">No attendance records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
