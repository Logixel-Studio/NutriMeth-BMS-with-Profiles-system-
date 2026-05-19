import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Target, Plus, TrendingUp, Award, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/lib/CurrencyContext';
import { toast } from 'sonner';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

const INIT_TARGETS = [
  { id: 1, rep: 'Ahmed Khan', target: 200000, achieved: 185000, period: 'May 2026' },
  { id: 2, rep: 'Sara Ali', target: 150000, achieved: 162000, period: 'May 2026' },
  { id: 3, rep: 'Bilal Raza', target: 180000, achieved: 120000, period: 'May 2026' },
  { id: 4, rep: 'Nida Hassan', target: 130000, achieved: 95000, period: 'May 2026' },
];

export default function SalesTargets() {
  const { formatCurrency } = useCurrency();
  const [targets, setTargets] = useState(INIT_TARGETS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ rep: '', target: '', achieved: '', period: 'May 2026' });

  const addTarget = () => {
    if (!form.rep || !form.target) return toast.error('Rep name and target required');
    setTargets(prev => [...prev, { id: Date.now(), ...form, target: parseFloat(form.target), achieved: parseFloat(form.achieved) || 0 }]);
    setForm({ rep: '', target: '', achieved: '', period: 'May 2026' });
    setShowAdd(false);
    toast.success('Target added');
  };

  const totalTarget = targets.reduce((s, t) => s + t.target, 0);
  const totalAchieved = targets.reduce((s, t) => s + t.achieved, 0);
  const overallPct = Math.round((totalAchieved / totalTarget) * 100);

  return (
    <div>
      <PageHeader title="Sales Targets" description="Set and track sales rep performance targets">
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Add Target</Button>
      </PageHeader>

      {/* Overall Progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
              data={[{ name: 'Target', value: overallPct, fill: 'hsl(160,84%,39%)' }]} startAngle={90} endAngle={-270}>
              <RadialBar background dataKey="value" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-foreground">{overallPct}%</p>
            <p className="text-xs text-muted-foreground">achieved</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalTarget)}</p>
            <p className="text-sm text-muted-foreground">Total Target</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAchieved)}</p>
            <p className="text-sm text-muted-foreground">Achieved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{String(targets.filter(t => t.achieved >= t.target).length)}</p>
            <p className="text-sm text-muted-foreground">Reps Hit Target</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {targets.map((t, i) => {
          const pct = Math.min(100, Math.round((t.achieved / t.target) * 100));
          const hit = t.achieved >= t.target;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${hit ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                    {t.rep[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.rep}</p>
                    <p className="text-xs text-muted-foreground">{t.period}</p>
                  </div>
                </div>
                {hit && <Award className="w-5 h-5 text-amber-500" />}
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target: {formatCurrency(t.target)}</span>
                  <span className={`font-semibold ${hit ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>{pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${hit ? 'bg-emerald-500' : pct > 70 ? 'bg-primary' : 'bg-amber-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Achieved: <span className="text-foreground font-medium">{formatCurrency(t.achieved)}</span></span>
                  <span>Gap: <span className="text-foreground font-medium">{formatCurrency(Math.max(0, t.target - t.achieved))}</span></span>
                </div>
              </div>
              {hit && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Target Achieved! 🎉
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Sales Target</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {[
              { label: 'Sales Rep Name *', key: 'rep', placeholder: 'e.g. Ahmed Khan' },
              { label: 'Target Amount (PKR) *', key: 'target', placeholder: '200000' },
              { label: 'Achieved So Far', key: 'achieved', placeholder: '0' },
              { label: 'Period', key: 'period', placeholder: 'May 2026' },
            ].map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Input className="mt-1.5" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button onClick={addTarget} className="flex-1">Add Target</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
