/**
 * usePayroll — real Supabase payroll engine
 * Auto-calculates from attendance, leaves, overtime, rules
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { toast } from 'sonner';

/* ── Monthly payroll records ─────────────────────────────────────────────── */
export function usePayrollMonth(year, month) {
  useRealtimeQuery('payroll', ['payroll', year, month]);
  return useQuery({
    queryKey: ['payroll', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select('*, user_profiles(full_name, email, department, role, base_salary, employee_id)')
        .eq('year', year)
        .eq('month', month)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

/* ── Generate payroll for a month (called by HR/Admin) ──────────────────── */
export function useGeneratePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month }) => {
      // 1. Get all employees
      const { data: employees, error: empErr } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role, department, base_salary, employee_id')
        .not('role', 'eq', 'super_admin')
        .gt('base_salary', 0);
      if (empErr) throw empErr;

      // 2. Get payroll rules
      const { data: rules } = await supabase
        .from('payroll_rules')
        .select('*')
        .limit(1)
        .maybeSingle();

      const workingDays = getWorkingDays(year, month);
      const overtimeMultiplier = rules?.overtime_rate_multiplier || 1.5;
      const workHoursPerDay = rules?.work_hours_per_day || 9;

      // 3. For each employee, get attendance for this month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${workingDays}`;

      const results = [];
      for (const emp of employees) {
        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', emp.id)
          .gte('date', startDate)
          .lte('date', endDate);

        const attRows = attendance || [];
        const presentDays = attRows.filter(a => a.status === 'present' || a.status === 'late').length;
        const lateMins = attRows.reduce((s, a) => s + (a.late_minutes || 0), 0);
        const lateDeductions = attRows.reduce((s, a) => s + (a.late_deduction || 0), 0);
        const overtimeHours = attRows.reduce((s, a) => s + (a.overtime_hours || 0), 0);

        const baseSalary = emp.base_salary || 0;
        const perDayRate = workingDays > 0 ? baseSalary / workingDays : 0;
        const absentDays = Math.max(0, workingDays - presentDays);
        const absentDeduction = absentDays * perDayRate;

        // Get approved leaves
        const { data: leaves } = await supabase
          .from('leave_requests')
          .select('days, leave_type')
          .eq('user_id', emp.id)
          .eq('status', 'approved')
          .gte('from_date', startDate)
          .lte('to_date', endDate);

        const paidLeaveDays = (leaves || [])
          .filter(l => l.leave_type === 'Annual Leave' || l.leave_type === 'Sick Leave')
          .reduce((s, l) => s + (l.days || 0), 0);
        const unpaidLeaveDays = (leaves || [])
          .filter(l => l.leave_type === 'Unpaid Leave')
          .reduce((s, l) => s + (l.days || 0), 0);
        const unpaidLeaveDeduction = unpaidLeaveDays * perDayRate;

        const overtimePay = overtimeHours * (perDayRate / workHoursPerDay) * overtimeMultiplier;
        const totalDeductions = lateDeductions + absentDeduction + unpaidLeaveDeduction;
        const netSalary = Math.max(0, baseSalary - totalDeductions + overtimePay);

        // Check if already exists
        const { data: existing } = await supabase
          .from('payroll')
          .select('id')
          .eq('user_id', emp.id)
          .eq('year', year)
          .eq('month', month)
          .maybeSingle();

        const payrollRow = {
          user_id: emp.id,
          year, month,
          base_salary: baseSalary,
          working_days: workingDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_minutes: lateMins,
          late_deduction: lateDeductions,
          absent_deduction: absentDeduction,
          unpaid_leave_days: unpaidLeaveDays,
          unpaid_leave_deduction: unpaidLeaveDeduction,
          overtime_hours: overtimeHours,
          overtime_pay: overtimePay,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          status: 'pending',
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase.from('payroll').update(payrollRow).eq('id', existing.id);
        } else {
          await supabase.from('payroll').insert([payrollRow]);
        }
        results.push({ employee: emp.full_name, net: netSalary });
      }
      return results;
    },
    onSuccess: (results, { year, month }) => {
      toast.success(`✅ Payroll generated for ${results.length} employees`);
      useQueryClient().invalidateQueries({ queryKey: ['payroll', year, month] });
    },
    onError: (e) => toast.error(`Payroll generation failed: ${e.message}`),
  });
}

/* ── Mark payroll as paid ────────────────────────────────────────────────── */
export function useMarkPayrollPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, year, month }) => {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { year, month }) => {
      qc.invalidateQueries({ queryKey: ['payroll', year, month] });
      toast.success('Payment marked as paid');
    },
  });
}

/* ── My payslips (employee view) ─────────────────────────────────────────── */
export function useMyPayslips(userId) {
  return useQuery({
    queryKey: ['payroll', 'mine', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getWorkingDays(year, month) {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (d.getMonth() === month - 1) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}
