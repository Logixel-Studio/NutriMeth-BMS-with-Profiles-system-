import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { useAllTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '@/hooks/useTasks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const PRIORITY_ST = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const COLS = [
  { key: 'todo', label: 'To Do', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: AlertCircle },
  { key: 'done', label: 'Done', icon: CheckCircle },
];

export default function TaskManagement() {
  const { data: tasks = [], isLoading } = useAllTasks();
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('id, full_name, role').order('full_name');
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });

  const handleCreate = async () => {
    if (!form.title || !form.assigned_to) return;
    await createTask.mutateAsync({ ...form, status: 'todo' });
    setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
    setShowAdd(false);
  };

  return (
    <div>
      <PageHeader title="Task Management" description="Assign and track team tasks in real-time">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />New Task</Button>
      </PageHeader>

      {isLoading && (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLS.map(col => (
            <div key={col.key} className="bg-muted/30 rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <col.icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground text-sm">{col.label}</h3>
                <span className="ml-auto bg-muted rounded-full px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  {tasks.filter(t => t.status === col.key).length}
                </span>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks.filter(t => t.status === col.key).map(task => (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-card rounded-lg border border-border p-3.5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-foreground text-sm leading-snug">{task.title}</p>
                        <button onClick={() => { if (confirm('Delete task?')) deleteTask.mutate(task.id); }}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', PRIORITY_ST[task.priority])}>{task.priority}</span>
                        {task.due_date && <span className="text-xs text-muted-foreground">📅 {task.due_date}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px]">
                            {(task.user_profiles?.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-muted-foreground">{task.user_profiles?.full_name || '—'}</span>
                        </div>
                        <Select value={task.status} onValueChange={val => updateStatus.mutate({ id: task.id, status: val })}>
                          <SelectTrigger className="h-6 text-xs px-2 w-auto border-0 bg-transparent">
                            <span className="sr-only">Status</span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {tasks.filter(t => t.status === col.key).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-xs">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Task Title *</Label>
              <Input className="mt-1.5" placeholder="Enter task title" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Assign To *</Label>
              <Select value={form.assigned_to} onValueChange={v => setForm(p => ({ ...p, assigned_to: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1.5" placeholder="Optional description" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" className="mt-1.5" value={form.due_date}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} disabled={createTask.isPending} className="flex-1">
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
