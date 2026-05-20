import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { supabase } from '@/api/supabaseClient';
import { FileText, Search, Filter, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MOCK_LOGS = [
  { id: 1, action: 'USER_LOGIN', user: 'admin@nutrimeth.com', ip: '192.168.1.1', status: 'success', timestamp: new Date().toISOString(), details: 'Login via email/password' },
  { id: 2, action: 'ROLE_CHANGED', user: 'superadmin@nutrimeth.com', ip: '192.168.1.5', status: 'success', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Changed user role to HR Manager' },
  { id: 3, action: 'RECORD_DELETED', user: 'admin@nutrimeth.com', ip: '10.0.0.2', status: 'warning', timestamp: new Date(Date.now() - 7200000).toISOString(), details: 'Deleted client record #1042' },
  { id: 4, action: 'EXPORT_DATA', user: 'accountant@nutrimeth.com', ip: '10.0.0.8', status: 'info', timestamp: new Date(Date.now() - 10800000).toISOString(), details: 'Exported financial report PDF' },
  { id: 5, action: 'FAILED_LOGIN', user: 'unknown@test.com', ip: '87.45.12.33', status: 'error', timestamp: new Date(Date.now() - 14400000).toISOString(), details: '3 failed attempts from this IP' },
];

const STATUS_STYLES = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const StatusIcon = ({ s }) => {
  if (s === 'success') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (s === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
};

export default function AuditLogs() {
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.ip.includes(search)
  );

  return (
    <div>
      <PageHeader title="Audit Logs" description="Complete trail of all system actions">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 w-60" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => setLogs([...MOCK_LOGS])}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </PageHeader>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Action</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">IP Address</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Details</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-t border-border hover:bg-muted/20"
                >
                  <td className="py-3 px-4">
                    <StatusIcon s={log.status} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs font-semibold text-foreground">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{log.user}</td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{log.ip}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{log.details}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
