import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { ArrowRightLeft, TrendingUp, TrendingDown, Package, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOVEMENTS = [
  { id: 1, type: 'in', product: 'Whey Protein 1kg', qty: 200, from: 'Supplier - NutriCo', to: 'Main Warehouse', date: '2026-05-19', ref: 'PO-2024' },
  { id: 2, type: 'out', product: 'BCAA Capsules', qty: 50, from: 'Main Warehouse', to: 'Sale - Ahmed Store', date: '2026-05-19', ref: 'SO-1052' },
  { id: 3, type: 'transfer', product: 'Creatine Monohydrate', qty: 100, from: 'Main Warehouse', to: 'Distribution Hub', date: '2026-05-18', ref: 'TR-0082' },
  { id: 4, type: 'in', product: 'Omega-3 Fish Oil', qty: 300, from: 'Supplier - HealthPlus', to: 'Cold Storage', date: '2026-05-18', ref: 'PO-2023' },
  { id: 5, type: 'out', product: 'Vitamin D3', qty: 80, from: 'Main Warehouse', to: 'Sale - Fitness Hub', date: '2026-05-17', ref: 'SO-1051' },
];

const TREND = [
  { d: 'May 14', in: 120, out: 80 },
  { d: 'May 15', in: 200, out: 150 },
  { d: 'May 16', in: 80, out: 120 },
  { d: 'May 17', in: 300, out: 200 },
  { d: 'May 18', in: 400, out: 180 },
  { d: 'May 19', in: 200, out: 130 },
];

const TYPE_STYLES = {
  in: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
  out: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: TrendingDown },
  transfer: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ArrowRightLeft },
};

export default function StockMovement() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? MOVEMENTS : MOVEMENTS.filter(m => m.type === filter);

  return (
    <div>
      <PageHeader title="Stock Movement" description="Track all inventory movements — in, out, and transfers">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Movements</SelectItem>
            <SelectItem value="in">Stock In</SelectItem>
            <SelectItem value="out">Stock Out</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <h3 className="font-semibold text-foreground mb-4">Movement Trend (Last 6 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={TREND}>
            <defs>
              <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0,84%,60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="d" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Area type="monotone" dataKey="in" name="Stock In" stroke="hsl(160,84%,39%)" fill="url(#gIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="out" name="Stock Out" stroke="hsl(0,84%,60%)" fill="url(#gOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {['Type','Product','Qty','From','To','Date','Ref'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const style = TYPE_STYLES[m.type];
                const Icon = style.icon;
                return (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-t border-border hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit ${style.bg}`}>
                        <Icon className="w-3.5 h-3.5" />{m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{m.product}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{m.qty}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.from}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.to}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{m.date}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{m.ref}</td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No movements found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
