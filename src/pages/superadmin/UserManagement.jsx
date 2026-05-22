import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '@/lib/RoleContext';
import { Search, Edit2, Trash2, Loader2, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/CurrencyContext';

const DEPT_OPTIONS = ['Sales','HR','Finance','Operations','Inventory','IT','Management'];

export default function UserManagement() {
  const qc = useQueryClient();
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({});

  useRealtimeQuery('user_profiles', ['admin-profiles']);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-profiles'] });
      setEditUser(null);
      toast.success('User updated');
    },
    onError: e => toast.error(e.message),
  });

  const handleEdit = (p) => {
    setEditUser(p);
    setForm({
      role: p.role || 'employee',
      department: p.department || '',
      position: p.position || '',
      base_salary: p.base_salary || 0,
      employee_id: p.employee_id || '',
      phone: p.phone || '',
    });
  };

  const filtered = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.role || '').includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="User Management" description={`${profiles.length} total users`}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 w-64" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </PageHeader>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['User','Email','Role','Department','Salary','ID','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
              )}
              {!isLoading && filtered.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-t border-border hover:bg-muted/20">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                        {(p.full_name || p.email || 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{p.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{p.email || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', ROLE_COLORS[p.role] || ROLE_COLORS.employee)}>
                      {ROLE_LABELS[p.role] || 'Employee'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{p.department || '—'}</td>
                  <td className="py-3 px-4 text-foreground text-xs font-medium">{p.base_salary > 0 ? formatCurrency(p.base_salary) : '—'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.employee_id || '—'}</td>
                  <td className="py-3 px-4">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — {editUser?.full_name || editUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm(p => ({ ...p, department: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {DEPT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position / Title</Label>
                <Input className="mt-1.5" placeholder="e.g. Senior Developer" value={form.position}
                  onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input className="mt-1.5" placeholder="e.g. EMP-001" value={form.employee_id}
                  onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Base Salary (PKR)</Label>
                <Input type="number" className="mt-1.5" placeholder="65000" value={form.base_salary}
                  onChange={e => setForm(p => ({ ...p, base_salary: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5" placeholder="+92-XXX-XXXXXXX" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => updateUser.mutate({ id: editUser.id, updates: form })}
                disabled={updateUser.isPending} className="flex-1">
                {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
