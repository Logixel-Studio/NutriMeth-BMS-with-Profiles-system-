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
import SaleForm from '@/components/sales/SaleForm';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import AuditInfo from '@/components/shared/AuditInfo';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, CheckCircle, XCircle, AlertCircle, Plus, Pencil, Trash2, BarChart3, FileText } from 'lucide-react';
import { usePermissions } from '@/lib/PermissionsContext';
import { toast } from 'sonner';

export default function Sales() {
  const { formatCurrency } = useCurrency();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [formOpen,    setFormOpen]    = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [invOpen,     setInvOpen]     = useState(false);
  const [invPrefill,  setInvPrefill]  = useState(null);
  const qc = useQueryClient();

  const { data: sales    = [], isLoading } = useQuery({ queryKey: ['sales'],    queryFn: () => base44.entities.Sale.list() });
  const { data: clients  = [] }            = useQuery({ queryKey: ['clients'],  queryFn: () => base44.entities.Client.list() });
  const { data: products = [] }            = useQuery({ queryKey: ['products'], queryFn: () => base44.entities.Product.list() });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const sale = sales.find(s => s.id === id);
      if (sale) {
        const saleItems = sale.items?.length ? sale.items : [{ product_id: sale.product_id, qty: sale.qty }];
        for (const it of saleItems) {
          const p = products.find(p => p.id === it.product_id);
          if (p) {
            const newQty = (p.stock_qty || 0) + Number(it.qty);
            const status = newQty <= 0 ? 'out_of_stock' : newQty <= 10 ? 'low_stock' : 'in_stock';
            await base44.entities.Product.update(p.id, { stock_qty: newQty, status });
          }
        }
      }
      return base44.entities.Sale.delete(id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Sale deleted, stock restored'); setDeleteId(null); },
  });

  const totalRevenue = sales.reduce((a, s) => a + (s.total || 0), 0);
  const totalProfit  = sales.reduce((a, s) => a + (s.profit || 0), 0);
  const paidSales    = sales.filter(s => s.payment_status === 'paid').length;
  const unpaidSales  = sales.filter(s => s.payment_status === 'unpaid').length;
  const partialSales = sales.filter(s => s.payment_status === 'partial').length;

  // Auto-populate InvoiceForm from a sale
  const openCreateInvoice = (row) => {
    const saleItems = row.items?.length ? row.items : [{
      product_id: row.product_id, product_name: row.product_name,
      qty: row.qty, unit_price: row.unit_price, total: row.total,
    }];
    setInvPrefill({
      _prefill: true,
      invoice_type:    'client',
      party_id:        row.client_id,
      party_name:      row.client_name,
      party_phone:     row.client_phone || '',
      party_address:   row.client_address || '',
      invoice_date:    new Date().toISOString().slice(0, 10),
      due_date:        row.due_date || '',
      payment_status:  row.payment_status || 'unpaid',
      paid_amount:     row.paid_amount || 0,
      linked_record_ids: [row.id],
      items: saleItems.map(it => ({
        description: it.product_name || '',
        qty:         it.qty,
        unit_price:  it.unit_price,
        total:       Number(it.qty) * Number(it.unit_price),
      })),
    });
    setInvOpen(true);
  };

  const columns = [
    { key: 'client_name',    label: 'Client',   render: v => <span className="font-medium">{v}</span> },
    { key: 'product_name',   label: 'Product',  render: (v, row) => {
      const itemCount = row.items?.length || 1;
      return <span className="hidden sm:block text-sm">{v}{itemCount > 1 ? <span className="ml-1 text-xs text-muted-foreground">+{itemCount-1} more</span> : ''}</span>;
    }},
    { key: 'total',          label: 'Total',    render: v => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'profit',         label: 'Profit',   render: v => <span className={`font-medium hidden lg:block ${v >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(v)}</span> },
    { key: 'payment_status', label: 'Status',   render: (v, row) => <div className="flex flex-col gap-1"><StatusBadge status={v} /><DueDateBadge dueDate={row.due_date} paymentStatus={v} /></div> },
    { key: 'created_date',   label: 'Date',     render: v => <span className="text-xs text-muted-foreground hidden lg:block">{formatDate(v)}</span> },
    {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {canCreate('invoices') && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Create Invoice" onClick={() => openCreateInvoice(row)}>
              <FileText className="w-4 h-4" />
            </Button>
          )}
          {canUpdate('sales') && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(row); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>}
          {canDelete('sales') && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.id)}><Trash2 className="w-4 h-4" /></Button>}
        </div>
      )
    }
  ];

  const expandedContent = (row) => {
    const saleItems = row.items?.length ? row.items : [{
      product_name: row.product_name, qty: row.qty, unit_price: row.unit_price,
      cost_per_unit: row.cost_per_unit, total: row.total,
    }];
    return (
      <div className="space-y-4">
        {/* Products table */}
        {saleItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Products</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left p-2 font-medium">Product</th>
                    <th className="text-right p-2 font-medium">Qty</th>
                    <th className="text-right p-2 font-medium">Unit Price</th>
                    <th className="text-right p-2 font-medium">Cost/Unit</th>
                    <th className="text-right p-2 font-medium">Total</th>
                    <th className="text-right p-2 font-medium text-emerald-600">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {saleItems.map((it, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="p-2 font-medium">{it.product_name || '—'}</td>
                      <td className="p-2 text-right">{it.qty}</td>
                      <td className="p-2 text-right">{formatCurrency(it.unit_price)}</td>
                      <td className="p-2 text-right text-muted-foreground">{formatCurrency(it.cost_per_unit || 0)}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(Number(it.qty) * Number(it.unit_price))}</td>
                      <td className={`p-2 text-right font-medium ${((it.unit_price - (it.cost_per_unit||0)) * it.qty) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency((it.unit_price - (it.cost_per_unit||0)) * it.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {row.client_phone    && <div><p className="text-xs text-muted-foreground">Client Phone</p><p>{row.client_phone}</p></div>}
          {row.client_address  && <div><p className="text-xs text-muted-foreground">Client Address</p><p>{row.client_address}</p></div>}
          <div><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">{formatCurrency(row.total)}</p></div>
          <div><p className="text-xs text-muted-foreground">Paid</p><p className="text-emerald-600 font-medium">{formatCurrency(row.payment_status === 'paid' ? row.total : (row.paid_amount || 0))}</p></div>
          <div><p className="text-xs text-muted-foreground">Remaining</p><p className="text-red-600 font-medium">{formatCurrency(row.payment_status === 'paid' ? 0 : (row.total||0) - (row.paid_amount||0))}</p></div>
          <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={row.payment_status} /></div>
          {row.due_date && <div><p className="text-xs text-muted-foreground">Due Date</p><DueDateBadge dueDate={row.due_date} paymentStatus={row.payment_status} /></div>}
          {row.description && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-muted-foreground">Notes</p><p>{row.description}</p></div>}
        </div>
        <div className="flex justify-end gap-2">
          {canCreate('invoices') && (
            <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => openCreateInvoice(row)}>
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
      <PageHeader title="Sales" description="Track all your sales">
        {canCreate('sales') && <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Sale</Button>}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard title="Total Sales"  value={formatNumber(sales.length)}  icon={TrendingUp} />
        <SummaryCard title="Revenue"      value={formatCurrency(totalRevenue)} icon={DollarSign}  delay={0.05} />
        <SummaryCard title="Profit"       value={formatCurrency(totalProfit)}  icon={BarChart3}   delay={0.1} />
        <SummaryCard title="Paid"         value={formatNumber(paidSales)}      icon={CheckCircle} delay={0.15} />
        <SummaryCard title="Unpaid"       value={formatNumber(unpaidSales)}    icon={XCircle}     delay={0.2} />
        <SummaryCard title="Partial"      value={formatNumber(partialSales)}   icon={AlertCircle} delay={0.25} />
      </div>

      <DataTable columns={columns} data={sales} isLoading={isLoading} searchKey="client_name" expandedContent={expandedContent} />

      <SaleForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} clients={clients} products={products} />
      <InvoiceForm open={invOpen} onClose={() => { setInvOpen(false); setInvPrefill(null); }} editing={invPrefill} onSaved={() => qc.invalidateQueries({ queryKey: ['invoices'] })} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}
