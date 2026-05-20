import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const MY_LEAVES = [
  { id: 1, type: 'Annual Leave', from: '2026-04-10', to: '2026-04-12', days: 3, reason: 'Family event', status: 'approved' },
  { id: 2, type: 'Sick Leave', from: '2026-03-22', to: '2026-03-22', days: 1, reason: 'Fever', status: 'approved' },
  { id: 3, type: 'Annual Leave', from: '2026-05-25', to: '2026-05-28', days: 4, reason: 'Travel', status: 'pending' },
];

const BALANCE = [
  { type: 'Annual Leave', total: 18, used: 3, remaining: 15, color: 'bg-primary' },
  { type: 'Sick Leave', total: 10, used: 1, remaining: 9, color: 'bg-amber-500' },
  { type: 'Unpaid Leave', total: 'Unlimited', used: 0, remaining: '—', color: 'bg-gray-400' },
];

const STATUS_STYLES = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function EmployeeLeaves() {
  const [leaves, setLeaves] = useState(MY_LEAVES);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'Annual Leave', from: '', to: '', reason: '' });

  const submit = () => {
    if (!form.from || !form.to || !form.reason) return toast.error('Please fill all fields');
    const days = Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1);
    setLeaves(prev => [...prev, { id: Date.now(), ...form, days, status: 'pending' }]);
    setForm({ type: 'Annual Leave', from: '', to: '', reason: '' });
    setShowAdd(false);
    toast.success('Leave request submitted! Awaiting approval.');
  };

  return (
    <div>
      <PageHeader title="My Leave Requests" description="Apply for leave and track your leave balance">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Request Leave</Button>
      </PageHeader>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {BALANCE.map((b, i) => (
          <motion.div key={b.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground">{b.type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total: {b.total} days</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">{b.remaining}</p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            </div>
            {b.total !== 'Unlimited' && (
              <div className="w-full bg-muted rounded-full h-2">
                <div className={`h-2 rounded-full ${b.color}`} style={{ width: `${(b.used / b.total) * 100}%` }} />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">Used: {b.used} days</p>
          </motion.div>
        ))}
      </div>

      {/* Leave History */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">My Leave History</h3>
        <div className="space-y-3">
          {leaves.map((leave, i) => (
            <motion.div key={leave.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/40 hover:bg-muted/20">
              <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{leave.type}</p>
                <p className="text-xs text-muted-foreground">{leave.from} → {leave.to} · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground italic mt-0.5">"{leave.reason}"</p>
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
          <div className="space-y-4 pt-2">
            <div>
              <Label>Leave Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                  <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From Date *</Label>
                <Input type="date" className="mt-1.5" value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} />
              </div>
              <div>
                <Label>To Date *</Label>
                <Input type="date" className="mt-1.5" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Input className="mt-1.5" placeholder="Reason for leave" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={submit} className="flex-1">Submit Request</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
