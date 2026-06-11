import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { makeCreatedBy, makeUpdatedBy } from '@/lib/auditUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const INVESTMENT_TYPES = ['equity','loan','partnership','fixed_deposit','profit_sharing','silent_partner','other'];

export default function InvestmentForm({ open, onClose, editing }) {
  const qc          = useQueryClient();
  const currentUser = useCurrentUser();

  const [form, setForm] = useState({
    investor_name: '', investment_type: 'loan', amount: '',
    expected_return: '', return_percentage: '', duration: '',
    investment_date: new Date().toISOString().slice(0, 10),
    return_date: '', returned_amount: 0, status: 'active', notes: '',
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({ ...editing });
    } else {
      setForm({
        investor_name: '', investment_type: 'loan', amount: '',
        expected_return: '', return_percentage: '', duration: '',
        investment_date: new Date().toISOString().slice(0, 10),
        return_date: '', returned_amount: 0, status: 'active', notes: '',
      });
    }
  }, [open, editing]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calculate expected return when amount + percentage change
  useEffect(() => {
    if (form.amount && form.return_percentage) {
      const exp = Number(form.amount) * (1 + Number(form.return_percentage) / 100);
      setForm(f => ({ ...f, expected_return: exp.toFixed(2) }));
    }
  }, [form.amount, form.return_percentage]);

  // Auto-calculate profit/loss
  const profit = useMemo(() => {
    const returned = Number(form.returned_amount) || 0;
    const invested = Number(form.amount) || 0;
    return returned > invested ? returned - invested : 0;
  }, [form.returned_amount, form.amount]);

  const loss = useMemo(() => {
    const returned = Number(form.returned_amount) || 0;
    const invested = Number(form.amount) || 0;
    return returned < invested && returned > 0 ? invested - returned : 0;
  }, [form.returned_amount, form.amount]);

  const remaining = (Number(form.expected_return) || 0) - (Number(form.returned_amount) || 0);

  const mutation = useMutation({
    mutationFn: () => {
      if (!form.investor_name) throw new Error('Investor name required');
      if (!form.amount || Number(form.amount) <= 0) throw new Error('Valid amount required');
      const auditFields = editing
        ? makeUpdatedBy(currentUser)
        : { ...makeCreatedBy(currentUser), ...makeUpdatedBy(currentUser) };
      const payload = {
        ...form, ...auditFields,
        amount:           Number(form.amount),
        expected_return:  Number(form.expected_return) || 0,
        return_percentage:Number(form.return_percentage) || 0,
        returned_amount:  Number(form.returned_amount) || 0,
        profit, loss,
        return_date: form.return_date || null,
      };
      return editing
        ? base44.entities.Investment.update(editing.id, payload)
        : base44.entities.Investment.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      toast.success(editing ? 'Investment updated' : 'Investment recorded');
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Save failed'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Investment' : 'Add Investment'}</DialogTitle></DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="mb-1.5 block">Investor Name *</Label>
              <Input value={form.investor_name} onChange={e => set('investor_name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label className="mb-1.5 block">Investment Type</Label>
              <Select value={form.investment_type} onValueChange={v => set('investment_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INVESTMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block">Amount *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="mb-1.5 block">Return % (ROI)</Label>
              <Input type="number" step="0.01" value={form.return_percentage} onChange={e => set('return_percentage', e.target.value)} placeholder="e.g. 15" />
            </div>
            <div>
              <Label className="mb-1.5 block">Expected Return</Label>
              <Input type="number" step="0.01" value={form.expected_return} onChange={e => set('expected_return', e.target.value)} placeholder="Auto-calculated" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Returned Amount</Label>
              <Input type="number" step="0.01" value={form.returned_amount} onChange={e => set('returned_amount', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="mb-1.5 block">Duration</Label>
              <Input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 12 months" />
            </div>
          </div>

          {/* Live calculations */}
          {(form.amount || form.expected_return) && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Profit</p>
                <p className="font-semibold text-emerald-600">{profit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Loss</p>
                <p className="font-semibold text-red-600">{loss.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold">{remaining.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Investment Date</Label>
              <Input type="date" value={form.investment_date} onChange={e => set('investment_date', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Return Date</Label>
              <Input type="date" value={form.return_date || ''} onChange={e => set('return_date', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : editing ? 'Update' : 'Add Investment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
