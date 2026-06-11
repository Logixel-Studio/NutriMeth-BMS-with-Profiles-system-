import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatNumber, formatDate } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import DueDateBadge from '@/components/shared/DueDateBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import PurchaseTypeForm from '@/components/purchasing/PurchaseTypeForm';
import PurchaseForm from '@/components/purchasing/PurchaseForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { Button } from '@/components/ui/button';
import { ShoppingCart, DollarSign, CheckCircle, XCircle, AlertCircle, Plus, Pencil, Trash2, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/PermissionsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuditInfo from '@/components/shared/AuditInfo';

export default function Purchasing() {
  const { formatCurrency } = useCurrency();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [typeFormOpen,     setTypeFormOpen]     = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);
  const [editing,          setEditing]          = useState(null);
  const [editingType,      setEditingType]      = useState(null);
  const [deleteId,         setDeleteId]         = useState(null);
  const [deleteType,       setDeleteType]       = useState(null);
  const [invOpen,          setInvOpen]          = useState(false);
  const [invPrefill,       setInvPrefill]       = useState(null);
  const qc = useQueryClient();

  const { data: purchases    = [], isLoading  } = useQuery({ queryKey: ['purchases'],    queryFn: () => base44.entities.Purchase.list() });
  const { data: purchaseTypes = [], isLoading: loadingTypes } = useQuery({ queryKey: ['purchaseTypes'], queryFn: () => base44.entities.PurchaseType.list() });
  const { data: suppliers    = [] }             = useQuery({ queryKey: ['suppliers'],    queryFn: () => base44.entities.Supplier.list() });

  const deletePurchase = useMutation({ mutationFn: (id) => base44.entities.Purchase.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchases'] }); toast.success('Deleted'); setDeleteId(null); } });
  const deleteTypeMut  = useMutation({ mutationFn: (id) => base44.entities.PurchaseType.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchaseTypes'] }); toast.success('Type deleted'); setDeleteType(null); } });

  const totalAmount = purchases.reduce((a, p) => a + (p.total || 0), 0);
  const paidCount   = purchases.filter(p => p.payment_status === 'paid').length;
  const unpaidCount = purchases.filter(p => p.payment_status === 'unpaid').length;
  const partialCount = purchases.filter(p => p.payment_status === 'partial').length;

  const openCreateInvoice = (row) => {
    const pItems = row.items?.length ? row.items : [{
      purchase_type_id: row.purchase_type_id, purchase_type_name: row.purchase_type_name,
      qty: row.qty, unit_price: row.unit_price, total: row.total,
    }];
    setInvPrefill({
      _prefill: true,
      invoice_type:   'supplier',
      party_id:       row.supplier_id,
      party_name:     row.supplier_name,
      party_phone:    row.supplier_phone || '',
      party_address:  row.supplier_address || '',
      invoice_date:   new Date().toISOString().slice(0, 10),
      due_date:       row.due_date || '',
      payment_status: row.payment_status || 'unpaid',
      paid_amount:    row.paid_amount || 0,
      linked_record_ids: [row.id],
      items: pItems.map(it => ({
        description: it.purchase_type_name || it.description || '',
        qty:         it.qty,
        unit_price:  it.unit_price,
        total:       Number(it.qty) * Number(it.unit_price),
      })),
    });
    setInvOpen(true);
  };

  const purchaseColumns = [
    { key: 'supplier_name',      label: 'Supplier', render: v => <span className="font-medium">{v}</span> },
    { key: 'purchase_type_name', label: 'Type',     render: (v, row) => {
      const count = row.items?.length || 1;
      return <span className="hidden sm:block text-sm">{v}{count > 1 ? <span className="ml-1 text-xs text-muted-foreground">+{count-1}</span> : ''}</span>;
    }},
    { key: 'total',          label: 'Total',  render: v => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'payment_status', label: 'Status', render: (v, row) => <div className="flex flex-col gap-1"><StatusBadge status={v} /><DueDateBadge dueDate={row.due_date} paymentStatus={v} /></div> },
    { key: 'created_date',   label: 'Date',   render: v => <span className="text-xs text-muted-foreground hidden lg:block">{formatDate(v)}</span> },
    { key: 'id', label: '', render: (_, row) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {canCreate('invoices') && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Create Invoice" onClick={() => openCreateInvoice(row)}>
            <FileText className="w-4 h-4" />
          </Button>
        )}
        {canUpdate('purchasing') && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(row); setPurchaseFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>}
        {canDelete('purchasing') && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.id)}><Trash2 className="w-4 h-4" /></Button>}
      </div>
    )},
  ];

  const typeColumns = [
    { key: 'name',         label: 'Name',    render: v => <span className="font-medium">{v}</span> },
    { key: 'description',  label: 'Description' },
    { key: 'created_date', label: 'Created', render: v => <span className="text-sm text-muted-foreground">{formatDate(v)}</span> },
    { key: 'id', label: '', render: (_, row) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {canUpdate('purchasing') && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingType(row); setTypeFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>}
        {canDelete('purchasing') && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteType(row.id)}><Trash2 className="w-4 h-4" /></Button>}
      </div>
    )},
  ];

  const expandedContent = (row) => {
    const pItems = row.items?.length ? row.items : [{
      purchase_type_name: row.purchase_type_name, qty: row.qty,
      unit_price: row.unit_price, total: row.total, description: row.description,
    }];
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Purchase Items</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-right p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Unit Price</th>
                  <th className="text-right p-2 font-medium">Total</th>
                  <th className="text-left p-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pItems.map((it, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-2 font-medium">{it.purchase_type_name || '—'}</td>
                    <td className="p-2 text-right">{it.qty}</td>
                    <td className="p-2 text-right">{formatCurrency(it.unit_price)}</td>
                    <td className="p-2 text-right font-semibold">{formatCurrency(Number(it.qty)*Number(it.unit_price))}</td>
                    <td className="p-2 text-muted-foreground text-xs">{it.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {row.supplier_phone   && <div><p className="text-xs text-muted-foreground">Supplier Phone</p><p>{row.supplier_phone}</p></div>}
          {row.supplier_address && <div><p className="text-xs text-muted-foreground">Supplier Address</p><p>{row.supplier_address}</p></div>}
          <div><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">{formatCurrency(row.total)}</p></div>
          <div><p className="text-xs text-muted-foreground">Paid</p><p className="text-emerald-600 font-medium">{formatCurrency(row.paid_amount || 0)}</p></div>
          <div><p className="text-xs text-muted-foreground">Remaining</p><p className="text-red-600 font-medium">{formatCurrency((row.total||0) - (row.paid_amount||0))}</p></div>
          <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={row.payment_status} /></div>
          {row.due_date && <div><p className="text-xs text-muted-foreground">Due</p><DueDateBadge dueDate={row.due_date} paymentStatus={row.payment_status} /></div>}
        </div>
        <div className="flex justify-end gap-2">
          {canCreate('invoices') && (
            <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => openCreateInvoice(row)}>
              <FileText className="w-3.5 h-3.5" /> Create Invoice
            </Button>
          )}
        </div>
        <AuditInfo record={row} />
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Purchasing" description="Manage purchase types and entries">
        {canCreate('purchasing') && <Button variant="outline" size="sm" onClick={() => { setEditingType(null); setTypeFormOpen(true); }} className="gap-1.5"><Tag className="w-4 h-4" /> Create Type</Button>}
        {canCreate('purchasing') && <Button onClick={() => { setEditing(null); setPurchaseFormOpen(true); }} className="gap-1.5"><Plus className="w-4 h-4" /> Add Purchase</Button>}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <SummaryCard title="Total"   value={formatNumber(purchases.length)} icon={ShoppingCart} />
        <SummaryCard title="Amount"  value={formatCurrency(totalAmount)}    icon={DollarSign}   delay={0.05} />
        <SummaryCard title="Paid"    value={formatNumber(paidCount)}        icon={CheckCircle}  delay={0.1} />
        <SummaryCard title="Unpaid"  value={formatNumber(unpaidCount)}      icon={XCircle}      delay={0.15} />
        <SummaryCard title="Partial" value={formatNumber(partialCount)}     icon={AlertCircle}  delay={0.2} />
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="types">Purchase Types</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          <DataTable columns={purchaseColumns} data={purchases} isLoading={isLoading} searchKey="supplier_name" expandedContent={expandedContent} />
        </TabsContent>
        <TabsContent value="types">
          <DataTable columns={typeColumns} data={purchaseTypes} isLoading={loadingTypes} searchKey="name" />
        </TabsContent>
      </Tabs>

      <PurchaseTypeForm open={typeFormOpen} onClose={() => { setTypeFormOpen(false); setEditingType(null); }} editing={editingType} />
      <PurchaseForm open={purchaseFormOpen} onClose={() => { setPurchaseFormOpen(false); setEditing(null); }} editing={editing} suppliers={suppliers} purchaseTypes={purchaseTypes} />
      <InvoiceForm open={invOpen} onClose={() => { setInvOpen(false); setInvPrefill(null); }} editing={invPrefill} onSaved={() => qc.invalidateQueries({ queryKey: ['invoices'] })} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deletePurchase.mutate(deleteId)} />
      <ConfirmDialog open={!!deleteType} onClose={() => setDeleteType(null)} onConfirm={() => deleteTypeMut.mutate(deleteType)} />
    </div>
  );
}
