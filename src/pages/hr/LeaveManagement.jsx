import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const INIT_LEAVES = [
  { id: 1, employee: 'Ahmed Khan', type: 'Annual Leave', from: '2026-05-20', to: '2026-05-22', days: 3, reason: 'Family vacation', status: 'pending' },
  { id: 2, employee: 'Sara Ali', type: 'Sick Leave', from: '2026-05-18', to: '2026-05-18', days: 1, reason: 'Doctor appointment', status: 'approved' },
  { id: 3, employee: 'Bilal Raza', type: 'Annual Leave', from: '2026-06-01', to: '2026-06-05', days: 5, reason: 'Travel', status: 'pending' },
  { id: 4, employee: 'Usman Tariq', type: 'Unpaid Leave', from: '2026-05-15', to: '2026-05-16', days: 2, reason: 'Personal', status: 'rejected' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState(INIT_LEAVES);
  const [filter, setFilter] = useState('all');

  const approve = (id) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'approved' } : l));
    toast.success('Leave approved');
  };
  const reject = (id) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
    toast.error('Leave rejected');
  };

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div>
      <PageHeader title="Leave Management" description="Review and approve employee leave requests">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pending', count: leaves.filter(l => l.status === 'pending').length, color: 'text-amber-500', icon: Clock },
          { label: 'Approved', count: leaves.filter(l => l.status === 'approved').length, color: 'text-emerald-500', icon: CheckCircle },
          { label: 'Rejected', count: leaves.filter(l => l.status === 'rejected').length, color: 'text-red-500', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold text-foreground">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((leave, i) => (
          <motion.div key={leave.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                {leave.employee[0]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{leave.employee}</p>
                <p className="text-sm text-muted-foreground">{leave.type} · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">{leave.from} → {leave.to}</p>
                <p className="text-xs text-muted-foreground italic mt-0.5">"{leave.reason}"</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[leave.status]}`}>
                {leave.status}
              </span>
              {leave.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => approve(leave.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => reject(leave.id)}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No leave requests found</div>
        )}
      </div>
    </div>
  );
}
