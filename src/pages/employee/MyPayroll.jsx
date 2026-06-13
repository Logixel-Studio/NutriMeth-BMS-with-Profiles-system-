import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrency } from '@/lib/CurrencyContext';
import { useMyEmployee } from '@/lib/useMyEmployee';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, Receipt, Printer, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function MyPayroll() {
  const { formatCurrency, currencySymbol } = useCurrency();
  const { myEmployee, user } = useMyEmployee();
  const [viewingSlip, setViewingSlip] = useState(null);

  const thisMonth = new Date().toISOString().slice(0, 7);

  // Fetch by email (primary — always stored during payroll generation)
  const { data: byEmail = [], isLoading: l1 } = useQuery({
    queryKey: ['my-payrolls-email', user?.email],
    queryFn: () => base44.entities.Payroll.filter({ employee_email: user?.email }, '-month', 36),
    enabled: !!user?.email,
  });

  // Fetch by employee_id (secondary)
  const { data: byId = [], isLoading: l2 } = useQuery({
    queryKey: ['my-payrolls-id', myEmployee?.id],
    queryFn: () => base44.entities.Payroll.filter({ employee_id: myEmployee?.id }, '-month', 36),
    enabled: !!myEmployee?.id,
  });

  const payrolls = useMemo(() => {
    const map = new Map();
    [...byEmail, ...byId].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => b.month?.localeCompare(a.month));
  }, [byEmail, byId]);

  const isLoading = l1 || l2;

  // Current month payroll
  const currentMonthPay = payrolls.find(p => p.month === thisMonth) || payrolls[0];

  // Aggregates
  const totalEarned   = payrolls.filter(p => p.payment_status === 'paid').reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalOTPaid   = payrolls.filter(p => p.payment_status === 'paid').reduce((s, p) => s + (p.overtime_pay || p.overtime_amount || 0), 0);
  const totalPayslips = payrolls.length;

  // Print handler
  const handlePrint = (p) => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Payslip - ${p.month}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto}
        h2{color:#059669;margin-bottom:4px} .sub{color:#666;font-size:13px;margin-bottom:20px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
        .box{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
        .box-label{font-size:11px;color:#666;margin-bottom:4px}
        .box-val{font-size:18px;font-weight:700}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6}
        .row:last-child{border:none;font-weight:700;font-size:15px;color:#059669}
        .stats{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;text-align:center;margin:16px 0;background:#f9fafb;padding:12px;border-radius:8px}
        .stat-val{font-size:18px;font-weight:700} .stat-label{font-size:10px;color:#666}
        .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;background:#fef3c7;color:#d97706}
        .badge.paid{background:#d1fae5;color:#059669}
      </style></head><body>
      <h2>NUTRIMETH BMS</h2>
      <div class="sub">Payslip for ${p.month}</div>
      <div><strong>${p.employee_name || user?.full_name || '—'}</strong></div>
      <div class="sub">${p.employee_department || myEmployee?.department || '—'} · ${myEmployee?.employee_id || '—'}</div>
      <span class="badge ${p.payment_status}">${p.payment_status}</span>
      <div class="grid">
        <div class="box"><div class="box-label">Basic Salary</div><div class="box-val">${currencySymbol}${(p.basic_salary||0).toLocaleString()}</div></div>
        <div class="box"><div class="box-label">Net Salary</div><div class="box-val" style="color:#059669">${currencySymbol}${(p.net_salary||0).toLocaleString()}</div></div>
      </div>
      <div class="stats">
        <div><div class="stat-val">${p.total_days||0}</div><div class="stat-label">Total Days</div></div>
        <div><div class="stat-val">${p.present_days||0}</div><div class="stat-label">Present</div></div>
        <div><div class="stat-val">${p.absent_days||0}</div><div class="stat-label">Absent</div></div>
        <div><div class="stat-val">${p.late_days||0}</div><div class="stat-label">Late</div></div>
        <div><div class="stat-val">${(p.overtime_hours||0).toFixed(1)}h</div><div class="stat-label">OT Hours</div></div>
        <div><div class="stat-val">${currencySymbol}${(p.overtime_pay||0).toLocaleString()}</div><div class="stat-label">OT Pay</div></div>
      </div>
      <div class="row"><span>Basic Salary</span><span>${currencySymbol}${(p.basic_salary||0).toLocaleString()}</span></div>
      <div class="row"><span>Overtime Pay</span><span>+${currencySymbol}${(p.overtime_pay||p.overtime_amount||0).toLocaleString()}</span></div>
      <div class="row"><span>Bonus</span><span>+${currencySymbol}${(p.bonus||0).toLocaleString()}</span></div>
      <div class="row"><span>Deductions</span><span>-${currencySymbol}${(p.deductions||0).toLocaleString()}</span></div>
      <div class="row"><span>Net Salary</span><span>${currencySymbol}${(p.net_salary||0).toLocaleString()}</span></div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  const SlipModal = ({ slip }) => (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Payslip — {slip.month}</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{slip.employee_name || user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{slip.employee_department || myEmployee?.department || '—'} · {myEmployee?.employee_id || '—'}</p>
          </div>
          <Badge className={slip.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
            {slip.payment_status}
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg text-center">
          {[
            { label: 'Basic',     val: formatCurrency(slip.basic_salary||0) },
            { label: 'OT Pay',   val: `+${formatCurrency(slip.overtime_pay||0)}` },
            { label: 'Deductions', val: `-${formatCurrency(slip.deductions||0)}` },
            { label: 'Net',       val: formatCurrency(slip.net_salary||0) },
          ].map(({ label, val }) => (
            <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-bold">{val}</p></div>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2 p-3 bg-muted/20 rounded-lg text-center text-sm">
          {[
            { l: 'Total Days', v: slip.total_days||0 },
            { l: 'Present', v: slip.present_days||0 },
            { l: 'Absent', v: slip.absent_days||0 },
            { l: 'Late', v: slip.late_days||0 },
            { l: 'OT Hrs', v: `${(slip.overtime_hours||0).toFixed(1)}h` },
            { l: 'Late Min', v: slip.late_minutes||0 },
          ].map(({ l, v }) => (
            <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-semibold">{v}</p></div>
          ))}
        </div>
        {slip.notes && <p className="text-xs text-muted-foreground">{slip.notes}</p>}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1 gap-1.5" onClick={() => handlePrint(slip)}><Printer className="w-4 h-4" /> Print</Button>
        </div>
      </div>
    </DialogContent>
  );

  return (
    <div>
      <PageHeader title="My Payroll" description="Salary slips, earnings history and deductions" />

      {/* 4 Summary Cards — matching Image 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'CURRENT MONTH', val: formatCurrency(currentMonthPay?.net_salary || 0), icon: DollarSign },
          { label: 'TOTAL EARNED (PAID)', val: formatCurrency(totalEarned), icon: TrendingUp },
          { label: 'TOTAL OVERTIME PAID', val: formatCurrency(totalOTPaid), icon: Clock },
          { label: 'TOTAL PAYSLIPS', val: totalPayslips, icon: Receipt },
        ].map(({ label, val, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
            className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{val}</p>
          </motion.div>
        ))}
      </div>

      {/* Current / Latest Month Detail — matching Image 2 */}
      {currentMonthPay && (
        <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          className="bg-card border border-border rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">This Month — {currentMonthPay.month}</h3>
              <Badge className={currentMonthPay.payment_status === 'paid'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'}>
                {currentMonthPay.payment_status}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handlePrint(currentMonthPay)}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handlePrint(currentMonthPay)}>
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            </div>
          </div>

          {/* Salary breakdown cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Basic Salary',  val: formatCurrency(currentMonthPay.basic_salary || 0),  color: '',              bg: 'bg-card' },
              { label: 'Overtime Pay',  val: `+${formatCurrency(currentMonthPay.overtime_pay || currentMonthPay.overtime_amount || 0)}`, color: 'text-emerald-600', bg: 'bg-card' },
              { label: 'Deductions',    val: `-${formatCurrency(currentMonthPay.deductions || 0)}`, color: 'text-red-500', bg: 'bg-card' },
              { label: 'Net Salary',    val: formatCurrency(currentMonthPay.net_salary || 0),    color: 'text-emerald-600 font-bold', bg: 'bg-emerald-50/40 border-emerald-200/60' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={cn('border border-border rounded-xl p-4 text-center', bg)}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={cn('text-xl font-semibold', color)}>{val}</p>
              </div>
            ))}
          </div>

          {/* Attendance stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-muted/20 rounded-xl p-3 text-center">
            {[
              { label: 'Total Days',  val: currentMonthPay.total_days || 0 },
              { label: 'Present',     val: currentMonthPay.present_days || 0 },
              { label: 'Absent',      val: currentMonthPay.absent_days || 0 },
              { label: 'Late',        val: currentMonthPay.late_days || 0 },
              { label: 'OT Hours',    val: `${(currentMonthPay.overtime_hours || 0).toFixed(1)}h` },
              { label: 'Late Min',    val: `${currentMonthPay.late_minutes || 0}m` },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-lg font-bold">{val}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payroll History — matching Image 2 */}
      <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
        className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Payroll History</h3>
        {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!isLoading && payrolls.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No payroll records yet</p>
        )}
        <div className="space-y-2">
          {payrolls.map(p => (
            <div key={p.id}
              className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 hover:bg-muted/20 rounded-lg px-2 transition-colors">
              <div>
                <p className="font-semibold text-sm">{p.month}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.present_days || 0} present · {(p.overtime_hours||0).toFixed(1)}h OT · Deductions: {formatCurrency(p.deductions||0)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(p.net_salary || 0)}</p>
                  <Badge className={cn('text-[10px]', p.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {p.payment_status}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewingSlip(p)} title="View">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(p)} title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* View slip modal */}
      <Dialog open={!!viewingSlip} onOpenChange={() => setViewingSlip(null)}>
        {viewingSlip && <SlipModal slip={viewingSlip} />}
      </Dialog>
    </div>
  );
}
