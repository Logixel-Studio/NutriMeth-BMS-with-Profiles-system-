import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, uploadFile } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { toast } from 'sonner';

export function useMyDocuments() {
  const { user } = useAuth();
  useRealtimeQuery('employee_documents', ['docs', 'mine', user?.id]);
  return useQuery({
    queryKey: ['docs', 'mine', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useAllDocuments() {
  useRealtimeQuery('employee_documents', ['docs', 'all']);
  return useQuery({
    queryKey: ['docs', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*, user_profiles(full_name, email, department)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

export function useUploadDocument() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, doc_type, description }) => {
      const { file_url } = await uploadFile(file, 'employee-documents');
      const { data, error } = await supabase
        .from('employee_documents')
        .insert([{
          user_id: user.id,
          doc_type,
          description,
          file_url,
          file_name: file.name,
          file_size: file.size,
          status: 'pending',
        }])
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docs'] });
      toast.success('Document uploaded successfully');
    },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });
}

export function useUpdateDocumentStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const { error } = await supabase
        .from('employee_documents')
        .update({ status, admin_notes: notes, reviewed_by: user.id, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docs'] });
      toast.success('Document status updated');
    },
    onError: (e) => toast.error(e.message),
  });
}
