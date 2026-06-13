import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import { useMyEmployee } from '@/lib/useMyEmployee';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_STYLE = {
  low:    'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high:   'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_OPTS = [
  { val: 'todo',        label: 'Todo' },
  { val: 'in_progress', label: 'In Progress' },
  { val: 'review',      label: 'Review' },
  { val: 'done',        label: 'Done' },
];

export default function MyTasks() {
  const qc = useQueryClient();
  const { myEmployee, user } = useMyEmployee();
  const empId    = myEmployee?.id;
  const empEmail = myEmployee?.email || user?.email;

  const [filter,    setFilter]    = useState('active');
  const [expanded,  setExpanded]  = useState(null);
  const [notes,     setNotes]     = useState({});  // taskId → note text

  // Dual fetch: by ID + email (Phase 3 fix — ensures tasks always visible)
  const { data: byId = [], isLoading: l1 } = useQuery({
    queryKey: ['my-tasks-id', empId],
    queryFn: () => base44.entities.Task.filter({ assigned_to_id: empId }, '-created_date', 100),
    enabled: !!empId,
    staleTime: 10_000,
  });
  const { data: byEmail = [], isLoading: l2 } = useQuery({
    queryKey: ['my-tasks-email', empEmail],
    queryFn: () => base44.entities.Task.filter({ assigned_to_email: empEmail }, '-created_date', 100),
    enabled: !!empEmail,
    staleTime: 10_000,
  });

  const tasks = useMemo(() => {
    const seen = new Set();
    return [...byId, ...byEmail].filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id); return true;
    });
  }, [byId, byEmail]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['my-tasks-id', empId] });
    qc.invalidateQueries({ queryKey: ['my-tasks-email', empEmail] });
  };

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Task updated'); },
    onError: () => toast.error('Update failed'),
  });

  const submitNote = (taskId, currentNotes) => {
    const newNote = notes[taskId]?.trim();
    if (!newNote) return;
    const existing = currentNotes ? currentNotes + '\n' : '';
    const timestamp = new Date().toLocaleString();
    const combined = `${existing}[${timestamp} — ${user?.full_name || 'Employee'}]: ${newNote}`;
    updateMut.mutate({ id: taskId, data: { notes: combined } });
    setNotes(prev => ({ ...prev, [taskId]: '' }));
  };

  const activeTasks = tasks.filter(t => !['done','completed','cancelled'].includes(t.status));
  const doneTasks   = tasks.filter(t => ['done','completed'].includes(t.status));
  const urgentTasks = activeTasks.filter(t => ['urgent','high'].includes(t.priority));
  const isLoading   = l1 || l2;

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !['done','completed','cancelled'].includes(t.status);
    if (filter === 'done')   return ['done','completed'].includes(t.status);
    return true;
  });

  return (
    <div>
      <PageHeader title="My Tasks" description="View and update tasks assigned to you" />

      {!empId && !empEmail && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ Employee record not linked. Contact admin.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard title="Active"    value={activeTasks.length} icon={CheckSquare}   delay={0} />
        <SummaryCard title="Urgent"    value={urgentTasks.length} icon={AlertTriangle} delay={0.05} />
        <SummaryCard title="Completed" value={doneTasks.length}   icon={CheckCircle}   delay={0.1} />
        <SummaryCard title="Total"     value={tasks.length}       icon={CheckSquare}   delay={0.15} />
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">My Tasks ({filtered.length})</h3>
          <div className="flex gap-1">
            {[['active','Active'],['done','Done'],['all','All']].map(([v, l]) => (
              <Button key={v} variant={filter === v ? 'default' : 'outline'} size="sm" className="h-7 text-xs"
                onClick={() => setFilter(v)}>{l}</Button>
            ))}
          </div>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading tasks…</p>}

        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(t => (
              <motion.div key={t.id} layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="border border-border rounded-xl overflow-hidden">

                {/* Task header row */}
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-sm">{t.title}</p>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5', PRIORITY_STYLE[t.priority])}>
                        {t.priority}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {t.due_date && (
                        <span className={cn('text-xs flex items-center gap-1',
                          new Date(t.due_date) < new Date() && !['done','completed'].includes(t.status)
                            ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                          <Clock className="w-3 h-3" /> Due: {formatDate(t.due_date)}
                        </span>
                      )}
                      {t.department && <span className="text-xs text-muted-foreground">Dept: {t.department}</span>}
                      {t.assigned_by_name && <span className="text-xs text-muted-foreground">By: {t.assigned_by_name}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
                      value={t.status}
                      onChange={e => updateMut.mutate({ id: t.id, data: { status: e.target.value } })}
                      disabled={t.status === 'cancelled'}>
                      {STATUS_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                    </select>
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                      {expanded === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded: notes + submit progress */}
                <AnimatePresence>
                  {expanded === t.id && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                      className="border-t border-border bg-muted/20 px-4 pb-4 pt-3 space-y-3">
                      {/* Existing notes */}
                      {t.notes && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Progress Notes</p>
                          <div className="bg-card rounded-lg border border-border p-3 text-xs whitespace-pre-line">
                            {t.notes}
                          </div>
                        </div>
                      )}
                      {/* Add note */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Add Progress Note</p>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Describe your progress…"
                            value={notes[t.id] || ''}
                            onChange={e => setNotes(prev => ({ ...prev, [t.id]: e.target.value }))}
                            rows={2}
                            className="text-xs flex-1"
                          />
                          <Button size="sm" className="self-end gap-1.5 h-9"
                            disabled={!notes[t.id]?.trim() || updateMut.isPending}
                            onClick={() => submitNote(t.id, t.notes)}>
                            <Send className="w-3.5 h-3.5" /> Submit
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              {filter === 'done' ? 'No completed tasks yet' : '🎉 No active tasks'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
