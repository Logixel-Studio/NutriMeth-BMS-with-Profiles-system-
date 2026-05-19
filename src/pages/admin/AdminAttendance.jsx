import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Clock, Users, CheckCircle, XCircle, AlertTriangle, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

const WEEKLY = [
  { day: 'Mon', present: 28, late: 3, absent: 2 },
  { day: 'Tue', present: 30, late: 2, absent: 1 },
  { day: 'Wed', present: 27, late: 4, absent: 2 },
  { day: 'Thu', present: 29, late: 2, absent: 2 },
  { day: 'Fri', present: 25, late: 5, absent: 3 },
];

const MOCK_TODAY = [
  { name: 'Ahmed Khan', dept: 'Sales', in: '09:02', out: null, status: 'present' },
  { name: 'Sara Ali', dept: 'HR', in: '09:20', out: null, status: 'late' },
  { name: 'Bilal Raza', dept: 'Finance', in: '08:58', out: null, status: 'present' },
  { name: 'Fatima Noor', dept: 'Inventory', in: null, out: null, status: 'absent' },
  { name: 'Usman Tariq', dept: 'Operations', in: '09:05', out: null, status: 'present' },
  { name: 'Nida Hassan', dept: 'Sales', in: '09:35', out: null, status: 'late' },
];

const ST = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminAttendance() {
  const [view, setView] = useState('today');
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-att-profiles'],
    queryFn: async () => { const { data } = await supabase.from('user_profiles').select('*'); return data || []; }
  });

  return (
    <div>
      <PageHeader title="Attendance Monitoring" description="Full company attendance overview">
        <div className="flex gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Employees', value: String(profiles.length || 33), icon: Users, c: 'text-primary' },
          { label: 'Present Today', value: '28', icon: CheckCircle, c: 'text-emerald-500' },
          { label: 'Late Arrivals', value: '3', icon: AlertTriangle, c: 'text-amber-500' },
          { label: 'Absent Today', value: '2', icon: XCircle, c: 'text-red-500' },
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
          <h3 className="font-semibold text-foreground mb-4">Weekly Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="present" name="Present" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
              <Bar dataKey="late" name="Late" fill="hsl(43,96%,56%)" radius={[4,4,0,0]} />
              <Bar dataKey="absent" name="Absent" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Today's Status Feed</h3>
          <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
            {MOCK_TODAY.map((emp, i) => (
              <motion.div key={emp.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">{emp.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.dept} · In: {emp.in || '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ST[emp.status]}`}>{emp.status}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">All Employees — Today ({new Date().toLocaleDateString()})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Employee','Department','Check In','Check Out','Status','Hours'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TODAY.map((emp, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-medium text-foreground">{emp.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{emp.dept}</td>
                  <td className="py-2.5 px-3 text-foreground">{emp.in || '—'}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{emp.out || 'Working'}</td>
                  <td className="py-2.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ST[emp.status]}`}>{emp.status}</span></td>
                  <td className="py-2.5 px-3 text-muted-foreground">{emp.in ? (emp.out ? '9h 00m' : 'Ongoing') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
