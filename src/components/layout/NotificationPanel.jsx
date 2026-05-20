import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db, realtimeManager } from '@/api/supabaseClient';
import { getDueDateInfo, isOverdue } from '@/lib/dueDateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertTriangle, Clock, Package, CreditCard, CheckCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/formatters';
import { useCurrency } from '@/lib/CurrencyContext';

function buildNotifications(sales, purchases, expenses, products) {
  const notifs = [];

  sales.forEach(s => {
    if (s.payment_status === 'paid') return;
    const remaining = (s.total || 0) - (s.paid_amount || 0);
    if (s.due_date) {
      const info = getDueDateInfo(s.due_date);
      if (info) {
        const isOv = isOverdue(s.due_date);
        notifs.push({
          id: `sale-due-${s.id}`,
          type: isOv ? 'overdue' : 'upcoming',
          icon: CreditCard,
          color: isOv ? 'text-red-500' : 'text-amber-500',
          bg: isOv ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30',
          title: isOv ? 'Overdue Payment' : 'Upcoming Payment',
          message: `Sale to ${s.client_name} — ${info.label}`,
          amount: remaining,
          date: s.due_date,
          urgent: info.urgent,
        });
      }
    }
    if (s.payment_status === 'partial') {
      notifs.push({
        id: `sale-partial-${s.id}`,
        type: 'partial',
        icon: Clock,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        title: 'Partial Payment Pending',
        message: `${s.client_name} — remaining balance due`,
        amount: remaining,
        date: s.due_date,
        urgent: false,
      });
    }
  });

  purchases.forEach(p => {
    if (p.payment_status === 'paid') return;
    const remaining = (p.total || 0) - (p.paid_amount || 0);
    if (p.due_date) {
      const info = getDueDateInfo(p.due_date);
      if (info) {
        const isOv = isOverdue(p.due_date);
        notifs.push({
          id: `purchase-due-${p.id}`,
          type: isOv ? 'overdue' : 'upcoming',
          icon: CreditCard,
          color: isOv ? 'text-red-500' : 'text-amber-500',
          bg: isOv ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30',
          title: isOv ? 'Supplier Payment Overdue' : 'Supplier Payment Due',
          message: `Pay ${p.supplier_name} — ${info.label}`,
          amount: remaining,
          date: p.due_date,
          urgent: info.urgent,
        });
      }
    }
  });

  expenses.forEach(e => {
    if (e.payment_status === 'paid') return;
    const remaining = (e.total || 0) - (e.paid_amount || 0);
    if (e.due_date) {
      const info = getDueDateInfo(e.due_date);
      if (info) {
        const isOv = isOverdue(e.due_date);
        notifs.push({
          id: `expense-due-${e.id}`,
          type: isOv ? 'overdue' : 'upcoming',
          icon: AlertTriangle,
          color: isOv ? 'text-red-500' : 'text-amber-500',
          bg: isOv ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30',
          title: isOv ? 'Expense Payment Overdue' : 'Expense Due',
          message: `${e.expense_type_name} — ${info.label}`,
          amount: remaining,
          date: e.due_date,
          urgent: info.urgent,
        });
      }
    }
  });

  products.forEach(p => {
    const qty = p.stock_qty || 0;
    if (qty === 0) {
      notifs.push({
        id: `stock-out-${p.id}`,
        type: 'stock_out',
        icon: Package,
        color: 'text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/30',
        title: 'Out of Stock',
        message: `${p.name} — No stock remaining`,
        urgent: true,
      });
    } else if (qty <= 10) {
      notifs.push({
        id: `stock-low-${p.id}`,
        type: 'stock_low',
        icon: Package,
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        title: 'Low Stock Alert',
        message: `${p.name} — Only ${qty} pieces remaining`,
        urgent: false,
      });
    }
  });

  return notifs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

// Hook: subscribes to a table via the shared realtime manager and
// invalidates the matching React Query key when any change arrives.
// One subscription per table — shared across all components via realtimeManager.
function useRealtimeInvalidation(table, queryKey) {
  const qc = useQueryClient();
  useEffect(() => {
    const unsub = realtimeManager.subscribe(table, () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
    });
    return unsub;
  }, [table, queryKey, qc]);
}

export default function NotificationPanel() {
  const { formatCurrency } = useCurrency();
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif_read') || '[]')); } catch { return new Set(); }
  });
  const [open, setOpen] = useState(false);

  // FIX: Removed refetchInterval: 60000 from ALL four queries.
  //
  // Previously, each query had its own 60-second timer. Because these query
  // keys are shared across the whole app, every 60 seconds ALL four queries
  // would fire simultaneously — creating a burst of 4 network requests that
  // cascaded into re-renders across every mounted page.
  //
  // Instead we use realtime subscriptions (below) to invalidate the cache
  // only when actual data changes happen. This means:
  //  - 0 polling requests when nothing changes
  //  - Instant updates across all PCs when someone changes data
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => db.Sale.list(),
  });
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => db.Purchase.list(),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => db.Expense.list(),
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => db.Product.list(),
  });

  // Realtime: one shared channel per table — all components benefit from
  // the same subscription rather than each creating its own.
  useRealtimeInvalidation('sales', 'sales');
  useRealtimeInvalidation('purchases', 'purchases');
  useRealtimeInvalidation('expenses', 'expenses');
  useRealtimeInvalidation('products', 'products');

  const notifications = buildNotifications(sales, purchases, expenses, products);
  const unread = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const all = new Set(notifications.map(n => n.id));
    setReadIds(all);
    localStorage.setItem('notif_read', JSON.stringify([...all]));
  };

  const markRead = (id) => {
    const updated = new Set([...readIds, id]);
    setReadIds(updated);
    localStorage.setItem('notif_read', JSON.stringify([...updated]));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] sm:w-[380px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={markAllRead}>
              <CheckCheck className="w-3 h-3" /> Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(n => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                      !isRead && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('p-1.5 rounded-lg flex-shrink-0 mt-0.5', n.bg)}>
                      <n.icon className={cn('w-3.5 h-3.5', n.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      {n.amount > 0 && (
                        <p className="text-xs font-medium text-foreground mt-0.5">{formatCurrency(n.amount)}</p>
                      )}
                      {n.date && (
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(n.date)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
