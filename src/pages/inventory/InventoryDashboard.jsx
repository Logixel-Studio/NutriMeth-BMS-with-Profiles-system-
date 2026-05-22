import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { formatNumber } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';
import { Package, AlertTriangle, TrendingDown, Warehouse, BarChart3, CheckCircle, Plus, Loader2, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function InventoryDashboard() {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdj, setShowAdj] = useState(false);
  const [adjForm, setAdjForm] = useState({ product_id: '', action: 'in', qty_change: '', notes: '' });

  useRealtimeQuery('products',   ['inv-products']);
  useRealtimeQuery('stock_logs', ['inv-logs']);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inv-products'],
    queryFn: () => db.Product.list(),
    staleTime: 30_000,
  });

  const { data: stockLogs = [] } = useQuery({
    queryKey: ['inv-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_logs')
        .select('*, user_profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const totalStock  = products.reduce((s, p) => s + (p.stock_qty || 0), 0);
  const lowStock    = products.filter(p => (p.stock_qty || 0) > 0 && (p.stock_qty || 0) < (p.min_stock || 10));
  const outOfStock  = products.filter(p => (p.stock_qty || 0) === 0);
  const stockValue  = products.reduce((s, p) => s + ((p.stock_qty || 0) * (p.unit_cost || p.price || 0)), 0);

  const topProducts = [...products]
    .sort((a, b) => (b.stock_qty || 0) - (a.stock_qty || 0))
    .slice(0, 8)
    .map(p => ({ name: (p.name || '—').slice(0, 14), qty: p.stock_qty || 0, id: p.id }));

  const adjustStock = useMutation({
    mutationFn: async () => {
      const product = products.find(p => p.id === adjForm.product_id);
      if (!product) throw new Error('Product not found');
      const qty = parseFloat(adjForm.qty_change);
      if (!qty || qty <= 0) throw new Error('Enter a valid quantity');
      const before = product.stock_qty || 0;
      const after  = adjForm.action === 'in' ? before + qty : Math.max(0, before - qty);
      // Update product stock
      const { error: prodErr } = await supabase.from('products').update({ stock_qty: after }).eq('id', product.id);
      if (prodErr) throw prodErr;
      // Log the movement
      await supabase.from('stock_logs').insert([{
        product_id: product.id, user_id: user?.id,
        action: adjForm.action, qty_before: before,
        qty_change: adjForm.action === 'in' ? qty : -qty,
        qty_after: after, notes: adjForm.notes,
        reference: `ADJ-${Date.now()}`,
      }]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-products'] });
      qc.invalidateQueries({ queryKey: ['inv-logs'] });
      setShowAdj(false);
      setAdjForm({ product_id: '', action: 'in', qty_change: '', notes: '' });
      toast.success('Stock adjusted successfully');
    },
    onError: e => toast.error(e.message),
  });

  const cards = [
    { title: 'Total Products',  value: formatNumber(products.length), icon: Package,       delay: 0 },
    { title: 'Total Stock',     value: formatNumber(totalStock),      icon: Warehouse,      delay: 0.05 },
    { title: 'Stock Value',     value: formatCurrency(stockValue),    icon: BarChart3,      delay: 0.1 },
    { title: 'Low Stock',       value: formatNumber(lowStock.length), icon: AlertTriangle,  delay: 0.15 },
    { title: 'Out of Stock',    value: formatNumber(outOfStock.length),icon: TrendingDown,  delay: 0.2 },
    { title: 'OK Stock',        value: formatNumber(products.length - lowStock.length - outOfStock.length), icon: CheckCircle, delay: 0.25 },
  ];

  return (
    <div>
      <PageHeader title="Inventory Dashboard" description="Real stock levels, movements, and alerts">
        <Button onClick={() => setShowAdj(true)}>
          <ArrowRightLeft className="w-4 h-4 mr-2" /> Adjust Stock
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      {/* Low Stock Alert Banner */}
      <AnimatePresence>
        {(lowStock.length > 0 || outOfStock.length > 0) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-5 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {outOfStock.length > 0 && `${outOfStock.length} product${outOfStock.length > 1 ? 's' : ''} out of stock. `}
              {lowStock.length > 0 && `${lowStock.length} product${lowStock.length > 1 ? 's' : ''} running low.`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top Products Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Products by Stock</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="qty" name="Units" radius={[0,4,4,0]}>
                  {topProducts.map((_, i) => <Cell key={i} fill={i < 3 ? 'hsl(160,84%,39%)' : 'hsl(199,89%,48%)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <p className="text-muted-foreground text-sm">No products found</p>}
            </div>
          )}
        </div>

        {/* Low Stock List */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Low & Out of Stock</h3>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {[...outOfStock, ...lowStock].length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">All stock levels are healthy!</span>
              </div>
            ) : (
              [...outOfStock, ...lowStock].map((p, i) => {
                const isOut = (p.stock_qty || 0) === 0;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={cn('flex items-center gap-3 p-3 rounded-lg border',
                      isOut ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10'
                             : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10')}>
                    <Package className={cn('w-4 h-4 flex-shrink-0', isOut ? 'text-red-500' : 'text-amber-500')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Min: {p.min_stock || 10} · SKU: {p.sku || '—'}</p>
                    </div>
                    <span className={cn('text-sm font-bold flex-shrink-0', isOut ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400')}>
                      {p.stock_qty || 0} left
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stock Movement Log */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Stock Movements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Type','Product ID','Before','Change','After','By','Reference','Time'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockLogs.map(log => (
                <tr key={log.id} className="border-b border-border/40 hover:bg-muted/20">
                  <td className="py-2 px-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                      log.action === 'in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      log.action === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{(log.product_id || '').slice(0, 8)}…</td>
                  <td className="py-2 px-3 text-foreground text-xs">{log.qty_before}</td>
                  <td className="py-2 px-3 text-xs font-bold">
                    <span className={log.qty_change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                      {log.qty_change > 0 ? '+' : ''}{log.qty_change}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-foreground text-xs font-bold">{log.qty_after}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{log.user_profiles?.full_name || '—'}</td>
                  <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{log.reference || '—'}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {stockLogs.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">No stock movements recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Products */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">All Products — Stock Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Product','SKU','In Stock','Unit Price','Stock Value','Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const val   = (p.stock_qty || 0) * (p.unit_cost || p.price || 0);
                const isOut = (p.stock_qty || 0) === 0;
                const isLow = !isOut && (p.stock_qty || 0) < (p.min_stock || 10);
                return (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{p.name || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{formatNumber(p.stock_qty || 0)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{formatCurrency(p.price || 0)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{formatCurrency(val)}</td>
                    <td className="py-2.5 px-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                        isOut ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400')}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && products.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdj} onOpenChange={setShowAdj}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Product *</Label>
              <Select value={adjForm.product_id} onValueChange={v => setAdjForm(p => ({ ...p, product_id: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select product…" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty || 0})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Action *</Label>
                <Select value={adjForm.action} onValueChange={v => setAdjForm(p => ({ ...p, action: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In ↑</SelectItem>
                    <SelectItem value="out">Stock Out ↓</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input type="number" className="mt-1.5" placeholder="e.g. 50" value={adjForm.qty_change}
                  onChange={e => setAdjForm(p => ({ ...p, qty_change: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1.5" placeholder="Reason for adjustment…" value={adjForm.notes}
                onChange={e => setAdjForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => adjustStock.mutate()} disabled={adjustStock.isPending || !adjForm.product_id || !adjForm.qty_change} className="flex-1">
                {adjustStock.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adjust Stock'}
              </Button>
              <Button variant="outline" onClick={() => setShowAdj(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
