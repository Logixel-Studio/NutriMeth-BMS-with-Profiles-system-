import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useAllLeaves, useUpdateLeaveStatus } from '@/hooks/useLeaves';
import { CalendarDays, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function LeaveManagement() {
  const [filter, setFilter] = useState('all');
  const { data: leaves = [], isLoading } = useAllLeaves(filter);
  const updateStatus = useUpdateLeaveStatus();

  const counts = {
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  };

  return (
    <div>
      <PageHeader title="Leave Management" description="Review and approve employee leave requests">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pending', count: counts.pending, color: 'text-amber-500', icon: Clock },
          { label: 'Approved', count: counts.approved, color: 'text-emerald-500', icon: CheckCircle },
          { label: 'Rejected', count: counts.rejected, color: 'text-red-500', icon: XCircle },
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
        {!isLoading && leaves.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            No leave requests found
          </div>
        )}
        {leaves.map((leave, i) => (
          <motion.div key={leave.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                {(leave.user_profiles?.full_name || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{leave.user_profiles?.full_name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{leave.user_profiles?.department} · {leave.leave_type} · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">{leave.from_date} → {leave.to_date}</p>
                <p className="text-xs text-muted-foreground italic mt-0.5">"{leave.reason}"</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[leave.status]}`}>
                {leave.status}
              </span>
              {leave.status === 'pending' && (
                <>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: leave.id, status: 'approved' })}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: leave.id, status: 'rejected' })}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
