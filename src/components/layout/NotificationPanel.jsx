import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const TYPE_ICON = {
  info:    <Info className="w-4 h-4 text-blue-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  error:   <XCircle className="w-4 h-4 text-red-500" />,
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(!open)}>
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-11 z-50 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <p className="font-semibold text-foreground text-sm">Notifications</p>
                  {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAll.mutate()}>
                      <CheckCheck className="w-3.5 h-3.5 mr-1" /> All read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No notifications
                  </div>
                )}
                {notifications.map((n, i) => (
                  <motion.div key={n.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-border/40 cursor-pointer hover:bg-muted/30 transition-colors',
                      !n.read && 'bg-primary/5'
                    )}
                    onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                  >
                    <div className="flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] || TYPE_ICON.info}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-tight', !n.read ? 'font-semibold text-foreground' : 'text-foreground')}>{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
