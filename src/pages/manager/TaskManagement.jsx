import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const INIT_TASKS = [
  { id: 1, title: 'Prepare Q2 Sales Report', assignee: 'Ahmed Khan', priority: 'high', due: '2026-05-25', status: 'in_progress', desc: 'Compile all Q2 sales data into a comprehensive report' },
  { id: 2, title: 'Client Follow-ups', assignee: 'Sara Ali', priority: 'medium', due: '2026-05-22', status: 'todo', desc: 'Call all pending clients from last month' },
  { id: 3, title: 'Inventory Audit', assignee: 'Bilal Raza', priority: 'low', due: '2026-05-30', status: 'todo', desc: 'Full warehouse inventory check' },
  { id: 4, title: 'Update Client Database', assignee: 'Nida Hassan', priority: 'medium', due: '2026-05-20', status: 'done', desc: 'Clean and update all client records' },
];

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUS_STYLES = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const COLUMNS = [
  { key: 'todo', label: 'To Do', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: AlertCircle },
  { key: 'done', label: 'Done', icon: CheckCircle },
];

export default function TaskManagement() {
  const [tasks, setTasks] = useState(INIT_TASKS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', assignee: '', priority: 'medium', due: '', desc: '' });

  const addTask = () => {
    if (!form.title || !form.assignee) return toast.error('Title and assignee required');
    setTasks(prev => [...prev, { id: Date.now(), ...form, status: 'todo' }]);
    setForm({ title: '', assignee: '', priority: 'medium', due: '', desc: '' });
    setShowAdd(false);
    toast.success('Task created');
  };

  const moveTask = (id, status) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  const deleteTask = (id) => { setTasks(prev => prev.filter(t => t.id !== id)); toast.success('Task deleted'); };

  return (
    <div>
      <PageHeader title="Task Management" description="Assign and track team tasks">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> New Task</Button>
      </PageHeader>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COLUMNS.map(col => (
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
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card rounded-lg border border-border p-3.5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-foreground text-sm leading-snug">{task.title}</p>
                      <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {task.desc && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.desc}</p>}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', PRIORITY_STYLES[task.priority])}>{task.priority}</span>
                      {task.due && <span className="text-xs text-muted-foreground">📅 {task.due}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px]">
                          {task.assignee[0]}
                        </div>
                        <span className="text-xs text-muted-foreground">{task.assignee}</span>
                      </div>
                      <Select value={task.status} onValueChange={val => moveTask(task.id, val)}>
                        <SelectTrigger className="h-6 text-xs px-2 w-auto border-0 bg-transparent">
                          <SelectValue />
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
                <div className="text-center py-6 text-muted-foreground text-xs">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Task Title *</Label>
              <Input className="mt-1.5" placeholder="Enter task title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Assign To *</Label>
              <Input className="mt-1.5" placeholder="Employee name" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} />
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
                <Input type="date" className="mt-1.5" value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1.5" placeholder="Optional description" value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={addTask} className="flex-1">Create Task</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
