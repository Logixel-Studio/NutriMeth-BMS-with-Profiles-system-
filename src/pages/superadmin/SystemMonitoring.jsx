import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Activity, Cpu, HardDrive, Wifi, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MetricCard({ title, value, unit, icon: Icon, color, status }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-xl border border-border p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`w-2.5 h-2.5 rounded-full mt-1 ${status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}<span className="text-lg text-muted-foreground ml-1">{unit}</span></p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
}

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState({ cpu: 23, memory: 68, disk: 41, network: 87 });
  const [history, setHistory] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      t: `${i}s`, cpu: Math.floor(Math.random() * 40 + 10),
      mem: Math.floor(Math.random() * 30 + 50), net: Math.floor(Math.random() * 60 + 20),
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newMetric = {
        cpu: Math.floor(Math.random() * 40 + 10),
        memory: Math.floor(Math.random() * 30 + 50),
        disk: Math.floor(Math.random() * 5 + 38),
        network: Math.floor(Math.random() * 60 + 20),
      };
      setMetrics(newMetric);
      setHistory(prev => [...prev.slice(-19), { t: 'now', cpu: newMetric.cpu, mem: newMetric.memory, net: newMetric.network }]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader title="Realtime System Monitor" description="Live infrastructure health and performance metrics">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live Monitoring</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="CPU Usage" value={metrics.cpu} unit="%" icon={Cpu} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" status="ok" />
        <MetricCard title="Memory Usage" value={metrics.memory} unit="%" icon={HardDrive} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" status="ok" />
        <MetricCard title="Disk Usage" value={metrics.disk} unit="%" icon={HardDrive} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" status="ok" />
        <MetricCard title="Network I/O" value={metrics.network} unit="MB/s" icon={Wifi} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" status="ok" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <h3 className="font-semibold text-foreground mb-4">Performance History (last 20 readings)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(280,67%,60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(280,67%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Area type="monotone" dataKey="cpu" name="CPU %" stroke="hsl(199,89%,48%)" fill="url(#gCpu)" strokeWidth={2} />
            <Area type="monotone" dataKey="mem" name="Memory %" stroke="hsl(280,67%,60%)" fill="url(#gMem)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Supabase Database', status: 'operational', latency: '12ms' },
          { name: 'Authentication Service', status: 'operational', latency: '8ms' },
          { name: 'Realtime Engine', status: 'operational', latency: '3ms' },
          { name: 'Storage Service', status: 'operational', latency: '45ms' },
          { name: 'Edge Functions', status: 'operational', latency: '22ms' },
          { name: 'CDN / Assets', status: 'operational', latency: '18ms' },
        ].map((svc, i) => (
          <motion.div key={svc.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-center gap-3 bg-card rounded-xl border border-border p-4">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{svc.name}</p>
              <p className="text-xs text-emerald-500 capitalize">{svc.status}</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{svc.latency}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
