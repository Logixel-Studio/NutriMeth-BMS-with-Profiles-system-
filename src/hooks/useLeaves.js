import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { toast } from 'sonner';

export function useMyLeaves() {
  const { user } = useAuth();
  useRealtimeQuery('leave_requests', ['leaves', 'mine', user?.id]);
  return useQuery({
    queryKey: ['leaves', 'mine', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useAllLeaves(statusFilter) {
  useRealtimeQuery('leave_requests', ['leaves', 'all', statusFilter]);
  return useQuery({
    queryKey: ['leaves', 'all', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('leave_requests')
        .select('*, user_profiles(full_name, email, department, role)')
        .order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useSubmitLeave() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leave_type, from_date, to_date, reason }) => {
      const days = Math.max(1, Math.round(
        (new Date(to_date) - new Date(from_date)) / 86400000
      ) + 1);
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{ user_id: user.id, leave_type, from_date, to_date, days, reason, status: 'pending' }])
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request submitted');
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateLeaveStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status, approved_by: user.id, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request updated');
    },
    onError: (e) => toast.error(e.message),
  });
}
