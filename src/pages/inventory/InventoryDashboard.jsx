import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { formatNumber } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';
import { Package, AlertTriangle, TrendingDown, Warehouse, BarChart3, ArrowRightLeft, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function InventoryDashboard() {
  const { formatCurrency } = useCurrency();
  const { data: products = [] } = useQuery({ queryKey: ['inv-products'], queryFn: () => db.Product.list() });

  const totalStock = products.reduce((s, p) => s + (p.stock_qty || 0), 0);
  const lowStock = products.filter(p => (p.stock_qty || 0) < (p.min_stock || 10));
  const outOfStock = products.filter(p => (p.stock_qty || 0) === 0);
  const stockValue = products.reduce((s, p) => s + ((p.stock_qty || 0) * (p.unit_cost || p.price || 0)), 0);

  const topProducts = [...products]
    .sort((a, b) => (b.stock_qty || 0) - (a.stock_qty || 0))
    .slice(0, 8)
    .map(p => ({ name: p.name?.slice(0, 15) || '—', qty: p.stock_qty || 0 }));

  const cards = [
    { title: 'Total Products', value: formatNumber(products.length), icon: Package, delay: 0 },
    { title: 'Total Stock Units', value: formatNumber(totalStock), icon: Warehouse, delay: 0.05 },
    { title: 'Stock Value', value: formatCurrency(stockValue), icon: BarChart3, delay: 0.1 },
    { title: 'Low Stock Items', value: formatNumber(lowStock.length), icon: AlertTriangle, delay: 0.15 },
    { title: 'Out of Stock', value: formatNumber(outOfStock.length), icon: TrendingDown, delay: 0.2 },
    { title: 'In Stock OK', value: formatNumber(products.length - lowStock.length), icon: CheckCircle, delay: 0.25 },
  ];

  return (
    <div>
      <PageHeader title="Inventory Dashboard" description="Stock overview and warehouse management" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(c => <SummaryCard key={c.title} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Top Products by Stock */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Products by Stock Level</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="qty" name="Units in Stock" radius={[0,4,4,0]}>
                  {topProducts.map((_, i) => <Cell key={i} fill={i < 3 ? 'hsl(160,84%,39%)' : 'hsl(199,89%,48%)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-muted-foreground">No products found</div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Low Stock Alerts</h3>
            {lowStock.length > 0 && (
              <span className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                {lowStock.length} items
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {lowStock.length === 0 && (
              <div className="flex items-center gap-2 py-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">All stock levels are healthy!</span>
              </div>
            )}
            {lowStock.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Min: {p.min_stock || 10} · SKU: {p.sku || '—'}</p>
                </div>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">
                  {p.stock_qty || 0} left
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">All Products Stock Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Product</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">SKU</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">In Stock</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Unit Price</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Stock Value</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 10).map(p => {
                const val = (p.stock_qty || 0) * (p.unit_cost || p.price || 0);
                const isLow = (p.stock_qty || 0) < (p.min_stock || 10);
                const isOut = (p.stock_qty || 0) === 0;
                return (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{p.name || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                    <td className="py-2.5 px-3 font-bold text-foreground">{formatNumber(p.stock_qty || 0)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{formatCurrency(p.price || 0)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{formatCurrency(val)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isOut ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
