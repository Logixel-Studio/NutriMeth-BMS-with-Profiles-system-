import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useMyLeaves, useSubmitLeave } from '@/hooks/useLeaves';
import { CalendarDays, Plus, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_STYLES = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function EmployeeLeaves() {
  const [showAdd, setShowAdd] = useState(false);
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const { data: leaves = [], isLoading } = useMyLeaves();
  const submit = useSubmitLeave();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    await submit.mutateAsync({ ...data, leave_type: leaveType });
    reset(); setShowAdd(false);
  };

  const annualUsed = leaves.filter(l => l.leave_type === 'Annual Leave' && l.status === 'approved').reduce((s, l) => s + l.days, 0);
  const sickUsed = leaves.filter(l => l.leave_type === 'Sick Leave' && l.status === 'approved').reduce((s, l) => s + l.days, 0);

  return (
    <div>
      <PageHeader title="My Leave Requests" description="Apply for leave and track your balance">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Request Leave</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { type: 'Annual Leave', total: 18, used: annualUsed, color: 'bg-primary' },
          { type: 'Sick Leave', total: 10, used: sickUsed, color: 'bg-amber-500' },
          { type: 'Unpaid Leave', total: null, used: leaves.filter(l => l.leave_type === 'Unpaid Leave').reduce((s,l)=>s+l.days,0), color: 'bg-gray-400' },
        ].map(b => (
          <div key={b.type} className="bg-card rounded-xl border border-border p-4">
            <div className="flex justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground text-sm">{b.type}</p>
                <p className="text-xs text-muted-foreground">{b.total ? `Total: ${b.total} days` : 'Unlimited'}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">{b.total ? b.total - b.used : '—'}</p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            </div>
            {b.total && (
              <div className="w-full bg-muted rounded-full h-2">
                <div className={`h-2 rounded-full ${b.color}`} style={{ width: `${Math.min(100, (b.used / b.total) * 100)}%` }} />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">Used: {b.used} days</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Leave History</h3>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}
        {!isLoading && leaves.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No leave requests yet</p>}
        <div className="space-y-3">
          {leaves.map((leave, i) => (
            <motion.div key={leave.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:bg-muted/20">
              <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{leave.leave_type}</p>
                <p className="text-xs text-muted-foreground">{leave.from_date} → {leave.to_date} · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                {leave.reason && <p className="text-xs text-muted-foreground italic">"{leave.reason}"</p>}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${STATUS_STYLES[leave.status]}`}>
                {leave.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div>
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Annual Leave','Sick Leave','Unpaid Leave','Maternity Leave','Emergency Leave'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From Date *</Label>
                <Input type="date" className="mt-1.5" {...register('from_date', { required: true })} />
              </div>
              <div>
                <Label>To Date *</Label>
                <Input type="date" className="mt-1.5" {...register('to_date', { required: true })} />
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Input className="mt-1.5" placeholder="Reason for leave" {...register('reason', { required: true })} />
              {errors.reason && <p className="text-xs text-red-500 mt-1">Reason is required</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submit.isPending} className="flex-1">
                {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
