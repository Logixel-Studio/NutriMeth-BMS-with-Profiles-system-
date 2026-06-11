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
import SearchableSelect from '@/components/shared/SearchableSelect';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const emptyItem = () => ({ purchase_type_id: '', purchase_type_name: '', qty: 1, unit_price: 0, total: 0, description: '' });

export default function PurchaseForm({ open, onClose, editing, suppliers, purchaseTypes }) {
  const qc          = useQueryClient();
  const currentUser = useCurrentUser();

  const [supplierId,      setSupplierId]      = useState('');
  const [supplierName,    setSupplierName]    = useState('');
  const [supplierPhone,   setSupplierPhone]   = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [items,           setItems]           = useState([emptyItem()]);
  const [paymentStatus,   setPaymentStatus]   = useState('unpaid');
  const [paidAmount,      setPaidAmount]      = useState(0);
  const [dueDate,         setDueDate]         = useState('');
  const [description,     setDescription]     = useState('');

  const grandTotal = useMemo(() =>
    items.reduce((sum, it) => sum + Number(it.qty) * Number(it.unit_price), 0), [items]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setSupplierId(editing.supplier_id || '');
      setSupplierName(editing.supplier_name || '');
      setSupplierPhone(editing.supplier_phone || '');
      setSupplierAddress(editing.supplier_address || '');
      setPaymentStatus(editing.payment_status || 'unpaid');
      setPaidAmount(editing.paid_amount || 0);
      setDueDate(editing.due_date || '');
      setDescription(editing.description || '');
      const loadedItems = editing.items?.length ? editing.items : [{
        purchase_type_id: editing.purchase_type_id || '',
        purchase_type_name: editing.purchase_type_name || '',
        qty: editing.qty || 1,
        unit_price: editing.unit_price || 0,
        total: editing.total || 0,
        description: editing.description || '',
      }];
      setItems(loadedItems);
    } else {
      setSupplierId(''); setSupplierName(''); setSupplierPhone(''); setSupplierAddress('');
      setItems([emptyItem()]);
      setPaymentStatus('unpaid'); setPaidAmount(0); setDueDate(''); setDescription('');
    }
  }, [open, editing]);

  const handleSupplierSelect = (id) => {
    setSupplierId(id);
    const s = suppliers.find(s => s.id === id);
    if (s) {
      setSupplierName(s.name || '');
      setSupplierPhone(s.phone || '');
      setSupplierAddress(s.address || '');
    }
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      if (field === 'purchase_type_id') {
        const t = purchaseTypes.find(t => t.id === val);
        updated.purchase_type_name = t?.name || '';
      }
      updated.total = Number(updated.qty) * Number(updated.unit_price);
      return updated;
    }));
  };

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name, sub: s.phone || s.address }));
  const typeOptions     = purchaseTypes.map(t => ({ value: t.id, label: t.name, sub: t.description }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!supplierId) throw new Error('Please select a supplier');
      const validItems = items.filter(it => it.purchase_type_id && Number(it.qty) > 0);
      if (validItems.length === 0) throw new Error('Add at least one purchase item');

      const paid = paymentStatus === 'paid' ? grandTotal : Number(paidAmount) || 0;
      const auditFields = editing
        ? makeUpdatedBy(currentUser)
        : { ...makeCreatedBy(currentUser), ...makeUpdatedBy(currentUser) };

      const firstItem = validItems[0];
      const payload = {
        ...auditFields,
        supplier_id: supplierId, supplier_name: supplierName,
        supplier_phone: supplierPhone, supplier_address: supplierAddress,
        // Legacy fields
        purchase_type_id: firstItem.purchase_type_id,
        purchase_type_name: firstItem.purchase_type_name,
        qty: validItems.reduce((s, i) => s + Number(i.qty), 0),
        unit_price: firstItem.unit_price,
        // Multi-item array
        items: validItems.map(it => ({
          ...it, qty: Number(it.qty),
          unit_price: Number(it.unit_price),
          total: Number(it.qty) * Number(it.unit_price),
        })),
        total: grandTotal,
        payment_status: paymentStatus,
        paid_amount: paid,
        due_date: dueDate || null,
        description,
      };

      return editing
        ? base44.entities.Purchase.update(editing.id, payload)
        : base44.entities.Purchase.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      toast.success(editing ? 'Purchase updated' : 'Purchase created');
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Save failed'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Purchase' : 'New Purchase'}</DialogTitle></DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Supplier */}
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Supplier *</Label>
              <SearchableSelect options={supplierOptions} value={supplierId}
                onChange={handleSupplierSelect} placeholder="Select or search supplier..."
                searchPlaceholder="Type supplier name..." />
            </div>
            {supplierId && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} placeholder="—" className="h-8 text-sm mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <Input value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} placeholder="—" className="h-8 text-sm mt-1" />
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Purchase Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems(p => [...p, emptyItem()])} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 border border-border/60 rounded-lg bg-muted/20 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs mb-1 block">Purchase Type *</Label>
                      <SearchableSelect options={typeOptions} value={item.purchase_type_id}
                        onChange={v => updateItem(idx, 'purchase_type_id', v)}
                        placeholder="Select type..." searchPlaceholder="Search type..." />
                    </div>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive self-end shrink-0"
                        onClick={() => setItems(p => p.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Qty *</Label>
                      <Input type="number" min="1" value={item.qty}
                        onChange={e => updateItem(idx, 'qty', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Unit Price *</Label>
                      <Input type="number" step="0.01" value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <Input value={(Number(item.qty) * Number(item.unit_price)).toFixed(2)}
                        readOnly className="h-8 text-sm bg-muted" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Item Note</Label>
                    <Input value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder="Optional note for this item..." className="h-8 text-sm" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 p-2 bg-muted/30 rounded-lg">
              <span className="text-sm">Grand Total: <strong>{grandTotal.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(paymentStatus === 'unpaid' || paymentStatus === 'partial') && (
              <div>
                <Label className="mb-1.5 block">Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            )}
          </div>
          {paymentStatus === 'partial' && (
            <div>
              <Label className="mb-1.5 block">Paid Amount</Label>
              <Input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Remaining: {(grandTotal - Number(paidAmount)).toFixed(2)}</p>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Purchase'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
