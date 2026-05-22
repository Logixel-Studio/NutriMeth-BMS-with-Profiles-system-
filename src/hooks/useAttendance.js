/**
 * useAttendance — real Supabase-backed attendance hook
 * Handles GPS check-in/out, late detection, overtime calc.
 * Uses singleton realtimeManager — no duplicate channels.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { toast } from 'sonner';

/* ── Geo helper ─────────────────────────────────────────────────────────── */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Check if within any office ─────────────────────────────────────────── */
export function findNearestOffice(lat, lng, offices) {
  let nearest = null, minDist = Infinity;
  for (const o of offices) {
    const d = haversineDistance(lat, lng, o.lat, o.lng);
    if (d < minDist) { minDist = d; nearest = { ...o, distance: Math.round(d) }; }
  }
  if (nearest && nearest.distance <= nearest.radius_meters) return nearest;
  return null;
}

/* ── Today's attendance for current user ─────────────────────────────────── */
export function useTodayAttendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  useRealtimeQuery('attendance', ['attendance', 'today', user?.id]);
  return useQuery({
    queryKey: ['attendance', 'today', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

/* ── All attendance for admin/hr (with optional date filter) ─────────────── */
export function useAllAttendance(dateFilter) {
  const today = dateFilter || new Date().toISOString().split('T')[0];
  useRealtimeQuery('attendance', ['attendance', 'all', today]);
  return useQuery({
    queryKey: ['attendance', 'all', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, user_profiles(full_name, email, department, role, base_salary)')
        .eq('date', today)
        .order('check_in', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

/* ── My attendance history ───────────────────────────────────────────────── */
export function useMyAttendanceHistory(limit = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['attendance', 'history', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

/* ── Office locations ────────────────────────────────────────────────────── */
export function useOfficeLocations() {
  useRealtimeQuery('office_locations', ['office_locations']);
  return useQuery({
    queryKey: ['office_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('office_locations')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60_000,
  });
}

/* ── Payroll rules (late/overtime config) ────────────────────────────────── */
export function usePayrollRules() {
  return useQuery({
    queryKey: ['payroll_rules'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payroll_rules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data || {
        office_start_time: '09:00',
        grace_period_minutes: 15,
        late_deduction_per_minute: 20,
        half_day_threshold_minutes: 120,
        overtime_rate_multiplier: 1.5,
        work_hours_per_day: 9,
      };
    },
    staleTime: 10 * 60_000,
  });
}

/* ── Check-in mutation ───────────────────────────────────────────────────── */
export function useCheckIn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lat, lng, officeId, officeName, lateMinutes, deductionAmount }) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const status = lateMinutes > 0 ? 'late' : 'present';
      const payload = {
        user_id: user.id,
        date: today,
        check_in: now,
        status,
        lat,
        lng,
        office_id: officeId,
        office_name: officeName,
        late_minutes: lateMinutes || 0,
        late_deduction: deductionAmount || 0,
        device_info: navigator.userAgent.slice(0, 200),
      };
      const { data, error } = await supabase
        .from('attendance')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('✅ Checked in successfully!');
    },
    onError: (e) => toast.error(`Check-in failed: ${e.message}`),
  });
}

/* ── Check-out mutation ──────────────────────────────────────────────────── */
export function useCheckOut() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attendanceId, workedHours, overtimeHours }) => {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out: new Date().toISOString(),
          hours_worked: workedHours,
          overtime_hours: overtimeHours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attendanceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('🏠 Checked out. Have a great day!');
    },
    onError: (e) => toast.error(`Check-out failed: ${e.message}`),
  });
}
