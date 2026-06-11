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
import { Plus, Trash2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const emptyItem = () => ({ product_id: '', product_name: '', qty: 1, unit_price: 0, cost_per_unit: 0, total: 0 });

export default function SaleForm({ open, onClose, editing, clients, products }) {
  const qc          = useQueryClient();
  const currentUser = useCurrentUser();

  // ── State ──
  const [clientId,       setClientId]       = useState('');
  const [clientName,     setClientName]     = useState('');
  const [clientPhone,    setClientPhone]    = useState('');
  const [clientAddress,  setClientAddress]  = useState('');
  const [items,          setItems]          = useState([emptyItem()]);
  const [paymentStatus,  setPaymentStatus]  = useState('unpaid');
  const [paidAmount,     setPaidAmount]     = useState(0);
  const [dueDate,        setDueDate]        = useState('');
  const [description,    setDescription]    = useState('');

  const grandTotal = useMemo(() =>
    items.reduce((sum, it) => sum + (Number(it.qty) * Number(it.unit_price)), 0), [items]);

  const totalProfit = useMemo(() =>
    items.reduce((sum, it) => sum + ((Number(it.unit_price) - Number(it.cost_per_unit)) * Number(it.qty)), 0), [items]);

  // ── Reset on open ──
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setClientId(editing.client_id || '');
      setClientName(editing.client_name || '');
      setClientPhone(editing.client_phone || '');
      setClientAddress(editing.client_address || '');
      setPaymentStatus(editing.payment_status || 'unpaid');
      setPaidAmount(editing.paid_amount || 0);
      setDueDate(editing.due_date || '');
      setDescription(editing.description || '');
      // Load items from JSONB or fallback to single-product legacy
      const loadedItems = editing.items?.length
        ? editing.items
        : [{
            product_id: editing.product_id || '',
            product_name: editing.product_name || '',
            qty: editing.qty || 1,
            unit_price: editing.unit_price || 0,
            cost_per_unit: editing.cost_per_unit || 0,
            total: editing.total || 0,
          }];
      setItems(loadedItems);
    } else {
      setClientId(''); setClientName(''); setClientPhone(''); setClientAddress('');
      setItems([emptyItem()]);
      setPaymentStatus('unpaid'); setPaidAmount(0); setDueDate(''); setDescription('');
    }
  }, [open, editing]);

  // ── Client autofill ──
  const handleClientSelect = (id) => {
    setClientId(id);
    const c = clients.find(c => c.id === id);
    if (c) {
      setClientName(c.name || '');
      setClientPhone(c.phone || '');
      setClientAddress(c.address || '');
    }
  };

  // ── Item helpers ──
  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      if (field === 'product_id') {
        const p = products.find(p => p.id === val);
        updated.product_name  = p?.name || '';
        updated.cost_per_unit = p?.production_cost || 0;
        updated.unit_price    = updated.unit_price || 0;
      }
      updated.total = Number(updated.qty) * Number(updated.unit_price);
      return updated;
    }));
  };

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name, sub: c.phone || c.address }));
  const productOptions = products.map(p => ({
    value: p.id,
    label: p.name,
    sub: `Stock: ${p.stock_qty || 0} | Cost: ${p.production_cost || 0}/unit`,
  }));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error('Please select a client');
      const validItems = items.filter(it => it.product_id && Number(it.qty) > 0);
      if (validItems.length === 0) throw new Error('Add at least one product');

      // Stock check
      for (const it of validItems) {
        const p = products.find(p => p.id === it.product_id);
        const needed = Number(it.qty);
        const prevQty = editing?.items?.find(ei => ei.product_id === it.product_id)?.qty || 0;
        const available = (p?.stock_qty || 0) + (editing ? prevQty : 0);
        if (needed > available) throw new Error(`Insufficient stock for "${it.product_name}": ${p?.stock_qty || 0} available`);
      }

      const paid = paymentStatus === 'paid' ? grandTotal : Number(paidAmount) || 0;
      const auditFields = editing
        ? makeUpdatedBy(currentUser)
        : { ...makeCreatedBy(currentUser), ...makeUpdatedBy(currentUser) };

      // Build payload — keep legacy top-level fields for backward compat + new items array
      const firstItem = validItems[0];
      const payload = {
        ...auditFields,
        client_id: clientId, client_name: clientName,
        client_phone: clientPhone, client_address: clientAddress,
        // Legacy single-product fields (kept for table display)
        product_id: firstItem.product_id, product_name: firstItem.product_name,
        qty: validItems.reduce((s, i) => s + Number(i.qty), 0),
        unit_price: firstItem.unit_price,
        cost_per_unit: firstItem.cost_per_unit,
        // Multi-product items array
        items: validItems.map(it => ({
          ...it, qty: Number(it.qty),
          unit_price: Number(it.unit_price),
          cost_per_unit: Number(it.cost_per_unit),
          total: Number(it.qty) * Number(it.unit_price),
        })),
        total: grandTotal,
        profit: totalProfit,
        payment_status: paymentStatus,
        paid_amount: paid,
        due_date: dueDate || null,
        description,
      };

      // Update stock
      for (const it of validItems) {
        const p = products.find(p => p.id === it.product_id);
        if (!p) continue;
        const prevQty = editing?.items?.find(ei => ei.product_id === it.product_id)?.qty || (editing?.product_id === it.product_id ? editing?.qty : 0) || 0;
        const qtyDiff = Number(it.qty) - (editing ? prevQty : 0);
        const newStock = (p.stock_qty || 0) - qtyDiff;
        const status = newStock <= 0 ? 'out_of_stock' : newStock <= 10 ? 'low_stock' : 'in_stock';
        await base44.entities.Product.update(p.id, { stock_qty: Math.max(0, newStock), status });
      }

      return editing
        ? base44.entities.Sale.update(editing.id, payload)
        : base44.entities.Sale.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(editing ? 'Sale updated' : 'Sale created');
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Save failed'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Sale' : 'New Sale'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* ── Client ── */}
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Client *</Label>
              <SearchableSelect
                options={clientOptions}
                value={clientId}
                onChange={handleClientSelect}
                placeholder="Select or search client..."
                searchPlaceholder="Type client name..."
              />
            </div>
            {clientId && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="—" className="h-8 text-sm mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="—" className="h-8 text-sm mt-1" />
                </div>
              </div>
            )}
          </div>

          {/* ── Products ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Products *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" /> Add Product
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const selProduct = products.find(p => p.id === item.product_id);
                return (
                  <div key={idx} className="p-3 border border-border/60 rounded-lg bg-muted/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SearchableSelect
                          options={productOptions}
                          value={item.product_id}
                          onChange={v => updateItem(idx, 'product_id', v)}
                          placeholder="Select product..."
                          searchPlaceholder="Search product..."
                        />
                      </div>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0"
                          onClick={() => removeItem(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    {selProduct && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Stock: <strong>{selProduct.stock_qty || 0}</strong> &nbsp;|&nbsp;
                        Cost: <strong>{selProduct.production_cost || 0}/unit</strong>
                      </p>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Qty *</Label>
                        <Input type="number" min="1" value={item.qty}
                          onChange={e => updateItem(idx, 'qty', e.target.value)}
                          className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Sell Price *</Label>
                        <Input type="number" step="0.01" value={item.unit_price}
                          onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                          className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input value={(Number(item.qty) * Number(item.unit_price)).toFixed(2)}
                          readOnly className="h-8 text-sm bg-muted" />
                      </div>
                      <div>
                        <Label className="text-xs text-emerald-600">Profit</Label>
                        <Input value={((Number(item.unit_price) - Number(item.cost_per_unit)) * Number(item.qty)).toFixed(2)}
                          readOnly className={cn('h-8 text-sm', ((Number(item.unit_price) - Number(item.cost_per_unit)) * Number(item.qty)) >= 0 ? 'text-emerald-600 bg-emerald-50/40' : 'text-red-600 bg-red-50/40')} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand total */}
            <div className="flex justify-end gap-4 mt-3 p-2 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Grand Total: <strong className="text-foreground">{grandTotal.toFixed(2)}</strong></span>
              <span className="text-sm text-muted-foreground">Total Profit: <strong className={totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{totalProfit.toFixed(2)}</strong></span>
            </div>
          </div>

          {/* ── Payment ── */}
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
              <Label className="mb-1.5 block">Received Amount</Label>
              <Input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} max={grandTotal} />
              <p className="text-xs text-muted-foreground mt-1">Remaining: {(grandTotal - Number(paidAmount)).toFixed(2)}</p>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : editing ? 'Update Sale' : 'Create Sale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
