/**
 * EmployeeDashboard — REAL data from Supabase
 * GPS check-in/out with live geo-fencing, real attendance history, real tasks, real salary
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useCurrency } from '@/lib/CurrencyContext';
import PageHeader from '@/components/shared/PageHeader';
import {
  useTodayAttendance, useCheckIn, useCheckOut,
  useOfficeLocations, usePayrollRules, findNearestOffice,
  haversineDistance, useMyAttendanceHistory,
} from '@/hooks/useAttendance';
import { useMyPayslips } from '@/hooks/usePayroll';
import { useMyTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { useMyLeaves } from '@/hooks/useLeaves';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation, Clock, DollarSign, CalendarDays, CheckSquare,
  Award, MapPin, CheckCircle, XCircle, Wifi, WifiOff,
  Timer, TrendingUp, AlertCircle, FileText, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Status styles ────────────────────────────────────────────────────────── */
const ST = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  late:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  absent:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  leave:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const PRIORITY_ST = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-blue-100 text-blue-700',
};

/* ── Live clock ──────────────────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center">
      <p className="text-5xl font-bold text-foreground tabular-nums tracking-tight">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

/* ── GPS Status badge ────────────────────────────────────────────────────── */
function GPSBadge({ inRange, officeName, distance }) {
  if (inRange) return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
      <Wifi className="w-3.5 h-3.5" />
      In range: {officeName} ({distance}m)
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
      <WifiOff className="w-3.5 h-3.5" />
      {distance != null ? `${distance}m from nearest office` : 'Locating…'}
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user, displayName } = useAuth();
  const { formatCurrency } = useCurrency();

  // ── Real data ────────────────────────────────────────────────────────────
  const { data: todayAtt, isLoading: attLoading } = useTodayAttendance();
  const { data: offices = [] } = useOfficeLocations();
  const { data: rules } = usePayrollRules();
  const { data: history = [] } = useMyAttendanceHistory(10);
  const { data: payslips = [] } = useMyPayslips(user?.id);
  const { data: myTasks = [] } = useMyTasks();
  const { data: myLeaves = [] } = useMyLeaves();

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const updateTaskStatus = useUpdateTaskStatus();

  // ── GPS state ────────────────────────────────────────────────────────────
  const [gps, setGps] = useState({ lat: null, lng: null, error: null, watching: false });
  const [nearestOffice, setNearestOffice] = useState(null);
  const [distance, setDistance] = useState(null);
  const watchIdRef = useRef(null);

  const updatePosition = useCallback((pos) => {
    const { latitude: lat, longitude: lng } = pos.coords;
    setGps(g => ({ ...g, lat, lng, error: null }));
    if (offices.length > 0) {
      const found = findNearestOffice(lat, lng, offices);
      setNearestOffice(found);
      // compute distance to nearest regardless
      let minD = Infinity;
      for (const o of offices) {
        const d = haversineDistance(lat, lng, o.lat, o.lng);
        if (d < minD) minD = d;
      }
      setDistance(Math.round(minD));
    }
  }, [offices]);

  // Start watching GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGps(g => ({ ...g, error: 'GPS not supported' }));
      return;
    }
    setGps(g => ({ ...g, watching: true }));
    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      (err) => setGps(g => ({ ...g, error: err.message, watching: false })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [updatePosition]);

  // ── Late calculation ──────────────────────────────────────────────────────
  const calcLate = () => {
    if (!rules) return { lateMinutes: 0, deduction: 0 };
    const [sh, sm] = (rules.office_start_time || '09:00').split(':').map(Number);
    const graceEnd = new Date();
    graceEnd.setHours(sh, sm + (rules.grace_period_minutes || 15), 0, 0);
    const now = new Date();
    if (now <= graceEnd) return { lateMinutes: 0, deduction: 0 };
    const lateMinutes = Math.round((now - graceEnd) / 60000);
    const deduction = lateMinutes * (rules.late_deduction_per_minute || 20);
    return { lateMinutes, deduction };
  };

  const handleCheckIn = async () => {
    if (!gps.lat || !gps.lng) return;
    const { lateMinutes, deduction } = calcLate();
    await checkIn.mutateAsync({
      lat: gps.lat, lng: gps.lng,
      officeId: nearestOffice?.id,
      officeName: nearestOffice?.name,
      lateMinutes, deductionAmount: deduction,
    });
  };

  const handleCheckOut = async () => {
    if (!todayAtt) return;
    const inTime = new Date(todayAtt.check_in);
    const now = new Date();
    const workedHours = Math.max(0, (now - inTime) / 3600000);
    const overtimeHours = Math.max(0, workedHours - (rules?.work_hours_per_day || 9));
    await checkOut.mutateAsync({
      attendanceId: todayAtt.id,
      workedHours: Math.round(workedHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
    });
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const checkedIn = !!todayAtt?.check_in && !todayAtt?.check_out;
  const checkedOut = !!todayAtt?.check_out;
  const monthPresentDays = history.filter(h => h.status === 'present' || h.status === 'late').length;
  const latestPayslip = payslips[0];
  const pendingTasks = myTasks.filter(t => t.status !== 'done');
  const pendingLeaves = myLeaves.filter(l => l.status === 'pending');

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  })();

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${displayName}! 👋`}
        description="Your personal workspace — attendance, tasks, and salary"
      />

      {/* ── Check-In Card ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 mb-5 flex flex-col sm:flex-row items-center gap-6">
        <LiveClock />

        <div className="flex flex-col items-center gap-3 flex-1">
          <GPSBadge
            inRange={!!nearestOffice}
            officeName={nearestOffice?.name}
            distance={distance}
          />

          {attLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : checkedOut ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-emerald-500 font-semibold text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Work complete for today
              </span>
              <span className="text-xs text-muted-foreground">
                Worked {todayAtt?.hours_worked?.toFixed(1)}h · Overtime {todayAtt?.overtime_hours?.toFixed(1)}h
              </span>
            </div>
          ) : checkedIn ? (
            <div className="flex flex-col items-center gap-2">
              <Button size="lg" variant="destructive" onClick={handleCheckOut} disabled={checkOut.isPending}
                className="w-44 h-12 text-base font-semibold">
                {checkOut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5 mr-2" /> Check Out</>}
              </Button>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Checked in at {new Date(todayAtt.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                {todayAtt.late_minutes > 0 && <span className="text-amber-500 ml-2">· {todayAtt.late_minutes}m late</span>}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Button size="lg" onClick={handleCheckIn}
                disabled={checkIn.isPending || (!nearestOffice && !gps.error)}
                className="w-44 h-12 text-base font-semibold">
                {checkIn.isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Navigation className="w-5 h-5 mr-2" /> Check In</>}
              </Button>
              {gps.error && <p className="text-xs text-red-500">{gps.error}</p>}
              {!gps.error && !nearestOffice && gps.lat && (
                <p className="text-xs text-muted-foreground">You're not within any office radius</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Days Present', value: String(monthPresentDays), icon: CheckCircle },
            { label: 'Pending Tasks', value: String(pendingTasks.length), icon: CheckSquare },
            { label: 'Leave Requests', value: String(pendingLeaves.length), icon: CalendarDays },
            { label: 'Payslips', value: String(payslips.length), icon: FileText },
          ].map(s => (
            <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center">
              <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Salary Details */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              {latestPayslip
                ? `Salary — ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][latestPayslip.month - 1]} ${latestPayslip.year}`
                : 'Salary Details'}
            </h3>
          </div>
          {latestPayslip ? (
            <div className="space-y-2">
              {[
                { label: 'Base Salary', value: formatCurrency(latestPayslip.base_salary), color: '' },
                { label: `Overtime (${latestPayslip.overtime_hours?.toFixed(1)}h)`, value: `+${formatCurrency(latestPayslip.overtime_pay)}`, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Late Deductions', value: `-${formatCurrency(latestPayslip.late_deduction)}`, color: 'text-red-500' },
                { label: 'Absent Deduction', value: `-${formatCurrency(latestPayslip.absent_deduction)}`, color: 'text-red-500' },
                { label: 'Net Salary', value: formatCurrency(latestPayslip.net_salary), color: 'font-bold text-lg', bold: true },
              ].map(row => (
                <div key={row.label} className={`flex justify-between items-center py-2 border-b border-border/40 last:border-0 ${row.bold ? 'bg-muted/30 px-3 rounded-lg mt-1' : ''}`}>
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`text-sm ${row.color || 'text-foreground'}`}>{row.value}</span>
                </div>
              ))}
              <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium ${latestPayslip.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                Status: {latestPayslip.status?.toUpperCase()}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payslip generated yet. HR will process your salary.</p>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Recent Attendance</h3>
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No attendance records yet</p>
            )}
            {history.map((rec, i) => (
              <motion.div key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20">
                <div className="text-center w-10 flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {new Date(rec.date + 'T00:00:00').getDate()}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {rec.check_in ? new Date(rec.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {' → '}
                    {rec.check_out ? new Date(rec.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                  </p>
                  {rec.hours_worked > 0 && (
                    <p className="text-[10px] text-muted-foreground">{rec.hours_worked?.toFixed(1)}h worked · {rec.overtime_hours?.toFixed(1)}h OT</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${ST[rec.status] || ST.present}`}>
                  {rec.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">My Assigned Tasks</h3>
          <span className="ml-auto text-xs text-muted-foreground">{myTasks.length} total</span>
        </div>
        <div className="space-y-2">
          {myTasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks assigned yet</p>
          )}
          {myTasks.slice(0, 6).map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${t.status === 'done' ? 'border-border/30 opacity-60' : 'border-border'}`}>
              <button
                onClick={() => updateTaskStatus.mutate({ id: t.id, status: t.status === 'done' ? 'todo' : 'done' })}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${t.status === 'done' ? 'bg-primary border-primary' : 'border-muted-foreground hover:border-primary'}`}
              >
                {t.status === 'done' && <CheckCircle className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</p>
                {t.due_date && <p className="text-xs text-muted-foreground">Due: {t.due_date}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${PRIORITY_ST[t.priority] || PRIORITY_ST.medium}`}>
                {t.priority}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
