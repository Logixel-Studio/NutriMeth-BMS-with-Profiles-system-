import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMyEmployee } from '@/lib/useMyEmployee';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatDate } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  MapPin, Wifi, WifiOff, AlertCircle, Clock,
  CheckSquare, DollarSign, Calendar, ArrowRight,
  Activity, Zap, Navigation, RefreshCw
} from 'lucide-react';
import { findAllowedLocation, checkLateStatus, calcWorkingHours, calcOvertimeHours } from '@/lib/gpsUtils';

const STATUS_BADGE = {
  present:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent:   'bg-red-50 text-red-700 border-red-200',
  late:     'bg-amber-50 text-amber-700 border-amber-200',
  half_day: 'bg-blue-50 text-blue-700 border-blue-200',
  on_leave: 'bg-purple-50 text-purple-700 border-purple-200',
};

const TASK_PRIORITY = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high:   'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

export default function EmployeeDashboard() {
  const qc = useQueryClient();
  const { myEmployee, user } = useMyEmployee();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const empId    = myEmployee?.id;
  const empEmail = myEmployee?.email || user?.email;

  // ── GPS state ──────────────────────────────────────────────────────
  const [position, setPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [locating, setLocating] = useState(false);

  // ── Data fetches ───────────────────────────────────────────────────
  const today    = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const { data: attendance = [] } = useQuery({
    queryKey: ['emp-dash-att', empId],
    queryFn:  () => base44.entities.Attendance.filter({ employee_id: empId }, '-date', 60),
    enabled:  !!empId,
  });

  // Tasks: fetch by BOTH id and email (Phase 3 fix)
  const { data: tasksByid = [] } = useQuery({
    queryKey: ['emp-dash-tasks-id', empId],
    queryFn:  () => base44.entities.Task.filter({ assigned_to_id: empId }, '-created_date', 50),
    enabled:  !!empId,
  });
  const { data: tasksByEmail = [] } = useQuery({
    queryKey: ['emp-dash-tasks-email', empEmail],
    queryFn:  () => base44.entities.Task.filter({ assigned_to_email: empEmail }, '-created_date', 50),
    enabled:  !!empEmail,
  });
  const tasks = useMemo(() => {
    const seen = new Set();
    return [...tasksByid, ...tasksByEmail].filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  }, [tasksByid, tasksByEmail]);

  // Payroll: fetch by email + id (Phase 4 fix)
  const { data: payrollByEmail = [] } = useQuery({
    queryKey: ['emp-dash-pay-email', empEmail],
    queryFn:  () => base44.entities.Payroll.filter({ employee_email: empEmail }, '-month', 3),
    enabled:  !!empEmail,
  });
  const { data: payrollById = [] } = useQuery({
    queryKey: ['emp-dash-pay-id', empId],
    queryFn:  () => base44.entities.Payroll.filter({ employee_id: empId }, '-month', 3),
    enabled:  !!empId,
  });
  const payrolls = useMemo(() => {
    const map = new Map();
    [...payrollByEmail, ...payrollById].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => b.month?.localeCompare(a.month));
  }, [payrollByEmail, payrollById]);

  const { data: leaves = [] } = useQuery({
    queryKey: ['emp-dash-leaves', empId, empEmail],
    queryFn:  async () => {
      const results = [];
      if (empId) { const r = await base44.entities.LeaveRequest.filter({ employee_id: empId }, '-created_date', 10); results.push(...r); }
      if (empEmail) { const r = await base44.entities.LeaveRequest.filter({ created_by_email: empEmail }, '-created_date', 10); r.forEach(l => { if (!results.find(x => x.id === l.id)) results.push(l); }); }
      return results.sort((a, b) => b.created_date?.localeCompare(a.created_date));
    },
    enabled: !!(empId || empEmail),
  });

  const { data: officeLocations = [] } = useQuery({ queryKey: ['office-locations'], queryFn: () => base44.entities.OfficeLocation.list() });
  const { data: assignments = [] } = useQuery({
    queryKey: ['emp-locations', empId],
    queryFn: () => base44.entities.EmployeeLocation.filter({ employee_id: empId }),
    enabled: !!empId,
  });

  // ── GPS ────────────────────────────────────────────────────────────
  const assignedIds = new Set(assignments.map(a => a.office_location_id));
  const allowedLocs = assignments.length > 0 ? officeLocations.filter(l => assignedIds.has(l.id)) : officeLocations;
  const allowedLoc  = position && allowedLocs.length > 0
    ? findAllowedLocation(position.latitude, position.longitude, allowedLocs)
    : allowedLocs.length === 0 && officeLocations.length === 0 ? { noRestriction: true } : null;
  const isInside = allowedLoc?.noRestriction || !!allowedLoc;

  const getGPS = () => {
    setLocating(true); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition(pos.coords); setLocating(false); },
      () => { setGpsError('GPS unavailable'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  useEffect(() => { if (empId) getGPS(); }, [empId]);

  const todayAtt = attendance.find(a => a.date === today);
  const monthAtt = attendance.filter(a => a.date?.startsWith(thisMonth));

  const checkInMut = useMutation({
    mutationFn: async () => {
      if (!empId) throw new Error('Employee record not linked.');
      const now      = new Date();
      const timeStr  = now.toTimeString().slice(0, 5);
      const existing = await base44.entities.Attendance.filter({ employee_id: empId, date: today });
      if (existing?.length > 0) throw new Error('Attendance already marked for today');
      const loc = allowedLoc?.noRestriction ? null : allowedLoc?.location;
      const { isLate, lateMinutes } = checkLateStatus(timeStr, myEmployee?.shift_start || loc?.shift_start, myEmployee?.grace_minutes ?? loc?.grace_minutes ?? 15);
      return base44.entities.Attendance.create({
        employee_id: empId, employee_name: myEmployee?.full_name || user?.full_name,
        date: today, check_in: timeStr,
        check_in_lat: position?.latitude, check_in_lng: position?.longitude,
        status: isLate ? 'late' : 'present', late_minutes: lateMinutes,
        notes: loc ? `Checked in at ${loc.name}` : undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emp-dash-att', empId] }); toast.success('✅ Checked in!'); },
    onError: (e) => toast.error(e.message),
  });

  const checkOutMut = useMutation({
    mutationFn: (rec) => {
      const timeStr = new Date().toTimeString().slice(0, 5);
      const loc = allowedLoc?.noRestriction ? null : allowedLoc?.location;
      return base44.entities.Attendance.update(rec.id, {
        check_out: timeStr, check_out_lat: position?.latitude, check_out_lng: position?.longitude,
        working_hours: calcWorkingHours(rec.check_in, timeStr).toFixed(2),
        overtime_hours: calcOvertimeHours(timeStr, myEmployee?.shift_end || loc?.shift_end).toFixed(2),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emp-dash-att', empId] }); toast.success('✅ Checked out!'); },
  });

  // ── Computed ───────────────────────────────────────────────────────
  const presentDays  = monthAtt.filter(a => ['present','late'].includes(a.status)).length;
  const lateDays     = monthAtt.filter(a => a.status === 'late').length;
  const lateMinTotal = monthAtt.reduce((s, a) => s + (a.late_minutes || 0), 0);
  const totalOT      = monthAtt.reduce((s, a) => s + (Number(a.overtime_hours) || 0), 0);
  const activeTasks  = tasks.filter(t => !['completed','cancelled','done'].includes(t.status));
  const latestPay    = payrolls[0];
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected').length;

  const radiusMsg = position
    ? allowedLoc?.noRestriction ? null
      : isInside ? { ok: true, msg: `✅ Inside: ${allowedLoc?.location?.name} (${allowedLoc?.distance}m)` }
      : { ok: false, msg: '❌ You are outside allowed office locations. Attendance unavailable.' }
    : null;

  return (
    <div className="space-y-4 pb-4">

      {/* ── Welcome ── */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {myEmployee?.designation || '—'} · {myEmployee?.department || 'dpartment ka name hai'} · {myEmployee?.employee_id || '—'}
        </p>
      </div>

      {/* ── Employee Profile Card ── */}
      {myEmployee && (
        <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-5 py-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {myEmployee.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{myEmployee.full_name}</p>
            <p className="text-xs text-muted-foreground">{myEmployee.employee_id} · {myEmployee.department || '—'} · {myEmployee.designation || '—'}</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
        </div>
      )}

      {/* ── GPS Attendance Card ── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" /> GPS Attendance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {position && (
              <p className="text-xs text-muted-foreground">
                Location: {position.latitude?.toFixed(5)}, {position.longitude?.toFixed(5)} · Accuracy: ±{Math.round(position.accuracy || 0)}m
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {position
              ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1"><Wifi className="w-3 h-3" />GPS Active</Badge>
              : <Badge className="bg-muted text-muted-foreground text-xs gap-1"><WifiOff className="w-3 h-3" />No GPS</Badge>}
          </div>
        </div>

        {/* Check In / Out / Hours */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Check In', val: todayAtt?.check_in, color: 'text-foreground' },
            { label: 'Check Out', val: todayAtt?.check_out, color: 'text-foreground' },
            { label: 'Hours', val: todayAtt?.working_hours ? `${Number(todayAtt.working_hours).toFixed(1)}h` : null, color: 'text-primary' },
          ].map(({ label, val, color }) => (
            <div key={label} className="border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={cn('text-xl font-semibold', color)}>{val || '—:—'}</p>
            </div>
          ))}
        </div>

        {/* Radius message */}
        {radiusMsg && (
          <div className={cn('text-xs px-3 py-2 rounded-lg flex items-center gap-2 mb-3',
            radiusMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200')}>
            {radiusMsg.ok ? <MapPin className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
            {radiusMsg.msg}
          </div>
        )}

        {/* Check In/Out Button */}
        <div className="flex gap-3">
          {!todayAtt?.check_in && (
            <Button className="flex-1 bg-primary hover:bg-primary/90 h-11 gap-2 text-sm font-medium"
              disabled={!position || !isInside || checkInMut.isPending || !empId}
              onClick={() => checkInMut.mutate()}>
              <MapPin className="w-4 h-4" />
              {checkInMut.isPending ? 'Recording…' : 'Check In Now'}
            </Button>
          )}
          {todayAtt?.check_in && !todayAtt?.check_out && (
            <Button variant="outline" className="flex-1 h-11 gap-2 text-sm border-red-300 text-red-600 hover:bg-red-50"
              disabled={checkOutMut.isPending} onClick={() => checkOutMut.mutate(todayAtt)}>
              <MapPin className="w-4 h-4" />
              {checkOutMut.isPending ? 'Recording…' : 'Check Out'}
            </Button>
          )}
          {todayAtt?.check_in && todayAtt?.check_out && (
            <div className="flex-1 h-11 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
              ✅ Attendance recorded for today
            </div>
          )}
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={getGPS} disabled={locating} title="Refresh GPS">
            <RefreshCw className={cn('w-4 h-4', locating && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* ── 6 Summary Stats ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'PRESENT (MONTH)',  val: presentDays,                          icon: Activity,     color: 'text-emerald-600' },
          { label: 'LATE DAYS',        val: lateDays,                             icon: Clock,        color: 'text-amber-600' },
          { label: 'LATE MINUTES',     val: `${lateMinTotal}m`,                   icon: Clock,        color: 'text-orange-600' },
          { label: 'OT HOURS',         val: `${totalOT.toFixed(1)}h`,             icon: Zap,          color: 'text-blue-600' },
          { label: 'NET SALARY',       val: formatCurrency(latestPay?.net_salary || 0), icon: DollarSign, color: 'text-primary' },
          { label: 'OPEN TASKS',       val: activeTasks.length,                   icon: CheckSquare,  color: 'text-purple-600' },
        ].map(({ label, val, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
              <div className={cn('w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center', color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className={cn('text-xl font-bold', color)}>{val}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Bottom 3-panel grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Active Tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">My Active Tasks</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate('/my-tasks')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active tasks 🎉</p>
          ) : (
            <div className="space-y-2">
              {activeTasks.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge className={cn('text-[10px] shrink-0 px-1.5', TASK_PRIORITY[t.priority])}>{t.priority}</Badge>
                    <span className="text-xs truncate">{t.title}</span>
                  </div>
                  <Badge className="text-[10px] ml-2 shrink-0 bg-muted text-muted-foreground capitalize">
                    {t.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Attendance History</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate('/my-attendance')}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {monthAtt.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No records yet</p>
          ) : (
            <div className="space-y-1.5">
              {monthAtt.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                  <span className="text-xs font-medium">{formatDate(a.date)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">{a.check_in || '—'} {a.check_out ? `→ ${a.check_out}` : ''}</span>
                    <Badge className={cn('text-[10px] capitalize border', STATUS_BADGE[a.status] || 'bg-muted text-muted-foreground')}>
                      {a.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payroll + Leaves */}
        <div className="space-y-4">
          {/* My Payroll mini */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">My Payroll</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate('/my-payroll')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            {!latestPay ? (
              <p className="text-sm text-muted-foreground text-center py-3">No payroll records</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {[
                  { label: 'Basic Salary', val: formatCurrency(latestPay.basic_salary || 0), color: '' },
                  { label: 'Overtime',     val: `+${formatCurrency(latestPay.overtime_pay || 0)}`, color: 'text-emerald-600' },
                  { label: 'Deductions',   val: `-${formatCurrency(latestPay.deductions || 0)}`, color: 'text-red-500' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <span className={cn('text-xs font-medium', color)}>{val}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                  <span className="text-sm font-semibold">Net Salary</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(latestPay.net_salary || 0)}</span>
                </div>
                <Badge className={cn('text-[10px]', latestPay.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                  {latestPay.payment_status}
                </Badge>
              </div>
            )}
          </div>

          {/* Leave Requests mini */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Leave Requests</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => navigate('/my-leaves')}>
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Pending',  val: pendingLeaves,  color: 'text-amber-600' },
                { label: 'Approved', val: approvedLeaves, color: 'text-emerald-600' },
                { label: 'Rejected', val: rejectedLeaves, color: 'text-red-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="space-y-1">
                  <p className={cn('text-xl font-bold', color)}>{val}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
