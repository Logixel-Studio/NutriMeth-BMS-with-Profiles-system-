import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import { motion } from 'framer-motion';
import { Navigation, Clock, DollarSign, CalendarDays, CheckSquare, Award, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RECENT_ATTENDANCE = [
  { date: '2026-05-19', in: '09:02 AM', out: '06:01 PM', status: 'present', hours: '8h 59m' },
  { date: '2026-05-18', in: '09:18 AM', out: '06:15 PM', status: 'late', hours: '8h 57m' },
  { date: '2026-05-17', in: '09:00 AM', out: '06:00 PM', status: 'present', hours: '9h 00m' },
  { date: '2026-05-16', in: '—', out: '—', status: 'leave', hours: '—' },
  { date: '2026-05-15', in: '09:05 AM', out: '06:10 PM', status: 'present', hours: '9h 05m' },
];

const STATUS_STYLES = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  leave: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function EmployeeDashboard() {
  const { displayName } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [location, setLocation] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCheckedIn(true);
        setCheckInTime(new Date());
        toast.success('✅ Checked In! Location verified.');
      }, () => {
        toast.error('Location access denied. Please enable GPS.');
      });
    } else {
      setCheckedIn(true);
      setCheckInTime(new Date());
      toast.success('✅ Checked In!');
    }
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    toast.success('🏠 Checked Out! Have a great evening.');
  };

  const greeting = time.getHours() < 12 ? 'Good Morning' : time.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div>
      <PageHeader title={`${greeting}, ${displayName}! 👋`} description="Your personal workspace and attendance center" />

      {/* Clock & Check In/Out */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 mb-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="text-center">
          <p className="text-5xl font-bold text-foreground tabular-nums tracking-tight">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-4">
          {!checkedIn ? (
            <Button size="lg" onClick={handleCheckIn} className="w-48 h-12 text-base font-semibold">
              <Navigation className="w-5 h-5 mr-2" /> Check In
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={handleCheckOut} className="w-48 h-12 text-base font-semibold">
              <XCircle className="w-5 h-5 mr-2" /> Check Out
            </Button>
          )}
          {checkedIn && checkInTime && (
            <div className="text-center">
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 justify-center">
                <CheckCircle className="w-4 h-4" /> Checked in at {checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-center">
                  <MapPin className="w-3.5 h-3.5" /> Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Today Hours', value: checkedIn ? 'In Progress' : '0h', icon: Clock },
            { label: 'This Month', value: '168h', icon: CalendarDays },
            { label: 'Attendance %', value: '92%', icon: CheckSquare },
            { label: 'Leaves Left', value: '8 days', icon: Award },
          ].map(s => (
            <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center">
              <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Salary Info */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Salary Details — May 2026</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Base Salary', value: 'PKR 65,000', color: 'text-foreground' },
              { label: 'Overtime Bonus', value: '+ PKR 3,250', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Leave Deduction', value: '— PKR 0', color: 'text-muted-foreground' },
              { label: 'Net Salary', value: 'PKR 68,250', color: 'text-foreground font-bold text-lg' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              ✅ Salary for May 2026 will be processed on June 1st, 2026
            </p>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Attendance</h3>
          <div className="space-y-2">
            {RECENT_ATTENDANCE.map((rec, i) => (
              <motion.div key={rec.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20">
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className="text-sm font-bold text-foreground">{new Date(rec.date).getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{rec.in} → {rec.out}</p>
                  <p className="text-xs text-muted-foreground">{rec.hours}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_STYLES[rec.status]}`}>
                  {rec.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">My Assigned Tasks</h3>
        </div>
        <div className="space-y-2">
          {[
            { task: 'Update client database for Q2', due: '2026-05-25', priority: 'high', done: false },
            { task: 'Prepare monthly expense report', due: '2026-05-30', priority: 'medium', done: false },
            { task: 'Review product stock levels', due: '2026-05-20', priority: 'low', done: true },
          ].map((t, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${t.done ? 'border-border/30 opacity-60' : 'border-border'}`}>
              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${t.done ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                {t.done && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.task}</p>
                <p className="text-xs text-muted-foreground">Due: {t.due}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                t.priority === 'high' ? 'bg-red-100 text-red-700' :
                t.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {t.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
