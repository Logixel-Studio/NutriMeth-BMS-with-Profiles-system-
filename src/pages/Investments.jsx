import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatNumber, formatDate } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import DataTable from '@/components/shared/DataTable';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import InvestmentForm from '@/components/investments/InvestmentForm';
import AuditInfo from '@/components/shared/AuditInfo';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/lib/PermissionsContext';
import { TrendingUp, DollarSign, CheckCircle, Clock, Plus, Pencil, Trash2, BarChart3, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active:   'bg-blue-50 text-blue-700 border-blue-200',
  returned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial:  'bg-amber-50 text-amber-700 border-amber-200',
  lost:     'bg-red-50 text-red-700 border-red-200',
  pending:  'bg-slate-50 text-slate-600 border-slate-200',
};

export default function Investments() {
  const { formatCurrency } = useCurrency();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: () => base44.entities.Investment.list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Investment.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); toast.success('Investment deleted'); setDeleteId(null); },
  });

  const totalInvested    = investments.reduce((s, i) => s + (i.amount || 0), 0);
  const activeCount      = investments.filter(i => i.status === 'active').length;
  const returnedCount    = investments.filter(i => i.status === 'returned').length;
  const totalProfit      = investments.reduce((s, i) => s + (i.profit || 0), 0);
  const totalLoss        = investments.reduce((s, i) => s + (i.loss || 0), 0);
  const pendingReturns   = investments.filter(i => ['active','partial'].includes(i.status)).reduce((s,i)=>s+(i.expected_return||0)-(i.returned_amount||0),0);

  const columns = [
    { key: 'investor_name',    label: 'Investor',  render: v => <span className="font-medium">{v}</span> },
    { key: 'investment_type',  label: 'Type',      render: v => <span className="hidden sm:block capitalize">{v}</span> },
    { key: 'amount',           label: 'Amount',    render: v => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'expected_return',  label: 'Expected',  render: v => <span className="hidden md:block text-emerald-600">{formatCurrency(v)}</span> },
    { key: 'return_percentage',label: 'ROI %',     render: v => <span className="hidden lg:block text-sm">{v ? `${v}%` : '—'}</span> },
    { key: 'status', label: 'Status', render: v => (
      <Badge variant="outline" className={cn('text-xs capitalize', STATUS_STYLES[v])}>{v}</Badge>
    )},
    { key: 'investment_date',  label: 'Date',      render: v => <span className="text-xs text-muted-foreground hidden lg:block">{formatDate(v)}</span> },
    { key: 'id', label: '', render: (_, row) => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {canUpdate('investments') && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(row); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>}
        {canDelete('investments') && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(row.id)}><Trash2 className="w-4 h-4" /></Button>}
      </div>
    )},
  ];

  const expandedContent = (row) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div><p className="text-xs text-muted-foreground">Investor</p><p className="font-semibold">{row.investor_name}</p></div>
        <div><p className="text-xs text-muted-foreground">Type</p><p className="capitalize">{row.investment_type}</p></div>
        <div><p className="text-xs text-muted-foreground">Amount Invested</p><p className="font-semibold">{formatCurrency(row.amount)}</p></div>
        <div><p className="text-xs text-muted-foreground">Expected Return</p><p className="text-emerald-600 font-semibold">{formatCurrency(row.expected_return || 0)}</p></div>
        <div><p className="text-xs text-muted-foreground">Return %</p><p className="font-medium">{row.return_percentage ? `${row.return_percentage}%` : '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Duration</p><p>{row.duration || '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Returned Amount</p><p className="text-emerald-600 font-medium">{formatCurrency(row.returned_amount || 0)}</p></div>
        <div><p className="text-xs text-muted-foreground">Remaining</p><p className="text-red-600 font-medium">{formatCurrency((row.expected_return||0) - (row.returned_amount||0))}</p></div>
        <div>
          <p className="text-xs text-muted-foreground">Profit</p>
          <p className={cn('font-medium', (row.profit||0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {formatCurrency(row.profit || 0)}
          </p>
        </div>
        {row.loss > 0 && <div><p className="text-xs text-muted-foreground">Loss</p><p className="text-red-600 font-medium">{formatCurrency(row.loss)}</p></div>}
        <div><p className="text-xs text-muted-foreground">Investment Date</p><p>{formatDate(row.investment_date)}</p></div>
        <div><p className="text-xs text-muted-foreground">Return Date</p><p>{row.return_date ? formatDate(row.return_date) : '—'}</p></div>
        {row.notes && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-muted-foreground">Notes</p><p>{row.notes}</p></div>}
      </div>
      <AuditInfo record={row} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Investments" description="Manage investor capital and returns">
        {canCreate('investments') && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Investment
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard title="Total Invested"  value={formatCurrency(totalInvested)} icon={DollarSign}    delay={0} />
        <SummaryCard title="Active"          value={formatNumber(activeCount)}      icon={TrendingUp}   delay={0.05} />
        <SummaryCard title="Returned"        value={formatNumber(returnedCount)}    icon={CheckCircle}  delay={0.1} />
        <SummaryCard title="Pending Returns" value={formatCurrency(pendingReturns)} icon={Clock}        delay={0.15} />
        <SummaryCard title="Total Profit"    value={formatCurrency(totalProfit)}    icon={BarChart3}    delay={0.2} />
        <SummaryCard title="Total Loss"      value={formatCurrency(totalLoss)}      icon={TrendingDown} delay={0.25} />
      </div>

      <DataTable columns={columns} data={investments} isLoading={isLoading} searchKey="investor_name" expandedContent={expandedContent} />

      <InvestmentForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}
