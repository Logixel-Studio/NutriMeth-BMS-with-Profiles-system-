import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import { useMyEmployee } from '@/lib/useMyEmployee';
import { motion } from 'framer-motion';
import { CalendarOff, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusStyle = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled:'bg-muted text-muted-foreground',
};

export default function MyLeaves() {
  const qc = useQueryClient();
  // ── Phase 6 fix: unified employee identity ──
  const { myEmployee, user } = useMyEmployee();
  const empId = myEmployee?.id;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['my-leaves', empId, user?.email],
    queryFn: async () => {
      const results = [];
      if (empId) {
        const byId = await base44.entities.LeaveRequest.filter({ employee_id: empId }, '-created_date', 100);
        results.push(...byId);
      }
      // Also fetch by email for backward compat
      if (user?.email) {
        const byEmail = await base44.entities.LeaveRequest.filter({ created_by_email: user.email }, '-created_date', 100);
        byEmail.forEach(l => { if (!results.find(r => r.id === l.id)) results.push(l); });
      }
      return results.sort((a, b) => b.created_date?.localeCompare(a.created_date));
    },
    enabled: !!(empId || user?.email),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!empId) throw new Error('Employee record not linked. Contact admin.');
      if (!form.from_date || !form.to_date) throw new Error('Select both dates');
      const from = new Date(form.from_date);
      const to   = new Date(form.to_date);
      const days = Math.max(1, Math.ceil((to - from) / 86400000) + 1);
      return base44.entities.LeaveRequest.create({
        employee_id:   empId,
        employee_name: myEmployee?.full_name || user?.full_name,
        leave_type:    form.leave_type,
        from_date:     form.from_date,
        to_date:       form.to_date,
        days,
        reason:        form.reason,
        status:        'pending',
        created_by_id:    user?.id,
        created_by_name:  user?.full_name,
        created_by_email: user?.email,
        created_by_role:  user?.role,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves', empId, user?.email] });
      toast.success('Leave request submitted');
      setShowForm(false);
      setForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
    },
    onError: (e) => toast.error(e.message || 'Failed'),
  });

  const pending   = leaves.filter(l => l.status === 'pending').length;
  const approved  = leaves.filter(l => l.status === 'approved').length;
  const rejected  = leaves.filter(l => l.status === 'rejected').length;
  const totalDays = leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.days || 0), 0);

  const duration = form.from_date && form.to_date
    ? Math.max(1, Math.ceil((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1)
    : 0;

  return (
    <div>
      <PageHeader title="My Leave Requests" description="Apply for leave and track status">
        <Button onClick={() => setShowForm(true)} disabled={!empId}>
          <Plus className="w-4 h-4 mr-1" /> Apply for Leave
        </Button>
      </PageHeader>

      {!empId && user && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ Employee record not linked. Contact admin to add <strong>{user.email}</strong> to your employee profile.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard title="Pending"      value={pending}   icon={Clock}       delay={0} />
        <SummaryCard title="Approved"     value={approved}  icon={CheckCircle} delay={0.05} />
        <SummaryCard title="Rejected"     value={rejected}  icon={XCircle}     delay={0.1} />
        <SummaryCard title="Days Taken"   value={totalDays} icon={CalendarOff} delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm mb-4">Leave History</h3>
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>}
          {leaves.map(l => (
            <div key={l.id} className="flex items-start justify-between gap-3 py-3 border-b border-border/40 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm capitalize">{l.leave_type} Leave</p>
                  <Badge variant="outline" className={cn('text-xs', statusStyle[l.status])}>{l.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(l.from_date)} → {formatDate(l.to_date)} · {l.days} day(s)</p>
                {l.reason && <p className="text-xs text-muted-foreground mt-1 italic">"{l.reason}"</p>}
                {l.review_notes && <p className="text-xs mt-1 text-blue-600">Note: {l.review_notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">{formatDate(l.created_date)}</p>
                {l.reviewed_by && <p className="text-xs text-muted-foreground mt-1">By: {l.reviewed_by}</p>}
              </div>
            </div>
          ))}
          {!isLoading && leaves.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No leave requests yet</p>
          )}
        </div>
      </motion.div>

      <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Leave Type</Label>
              <Select value={form.leave_type} onValueChange={v => setF('leave_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['casual','annual','sick','maternity','unpaid'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From Date</Label><Input type="date" value={form.from_date} onChange={e => setF('from_date', e.target.value)} /></div>
              <div><Label>To Date</Label><Input type="date" value={form.to_date} min={form.from_date} onChange={e => setF('to_date', e.target.value)} /></div>
            </div>
            {duration > 0 && <p className="text-xs text-primary font-medium">Duration: {duration} day(s)</p>}
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setF('reason', e.target.value)} placeholder="Reason for leave…" rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button disabled={!form.from_date || !form.to_date || createMutation.isPending || !empId}
              onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
