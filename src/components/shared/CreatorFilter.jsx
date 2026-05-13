import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_profiles').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

export default function CreatorFilter({ value, onChange }) {
  const { data: members = [] } = useTeamMembers();
  const { user } = useAuth();

  return (
    <Select value={value || 'all'} onValueChange={v => onChange(v === 'all' ? '' : v)}>
      <SelectTrigger className="h-9 w-[160px] text-sm">
        <SelectValue placeholder="All Creators" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Creators</SelectItem>
        {user && <SelectItem value={user.id}>My Entries</SelectItem>}
        {members.filter(m => m.id !== user?.id).map(m => (
          <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
