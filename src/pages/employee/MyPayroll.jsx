import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrency } from '@/lib/CurrencyContext';
import PageHeader from '@/components/shared/PageHeader';
import SummaryCard from '@/components/shared/SummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMyEmployee } from '@/lib/useMyEmployee';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { downloadPayslipPDF, printPayslip } from '@/components/payroll/PayslipPDF';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MyPayroll() {
  const { formatCurrency } = useCurrency();
  // ── Phase 6 fix: unified employee identity ──
  const { myEmployee, user } = useMyEmployee();

  // Fetch by email (most reliable — always set during payroll generation)
  const { data: payrollsByEmail = [], isLoading: loadingEmail } = useQuery({
    queryKey: ['my-payrolls-email', user?.email],
    queryFn: () => base44.entities.Payroll.filter({ employee_email: user?.email }, '-month', 36),
    enabled: !!user?.email,
  });

  // Fetch by employee_id as secondary
  const { data: payrollsById = [], isLoading: loadingId } = useQuery({
    queryKey: ['my-payrolls-id', myEmployee?.id],
    queryFn: () => base44.entities.Payroll.filter({ employee_id: myEmployee?.id }, '-month', 36),
    enabled: !!myEmployee?.id,
  });

  // Deduplicate
  const payrolls = useMemo(() => {
    const map = new Map();
    [...payrollsByEmail, ...payrollsById].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => b.month?.localeCompare(a.month));
  }, [payrollsByEmail, payrollsById]);

  const isLoading = loadingEmail || loadingId;

  const totalNet   = payrolls.reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalBonus = payrolls.reduce((s, p) => s + (p.bonus || 0), 0);
  const paidCount  = payrolls.filter(p => p.payment_status === 'paid').length;

  return (
    <div>
      <PageHeader title="My Payroll" description="Your payslip history and salary details" />

      {!myEmployee && user && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ Employee record not linked. Showing payrolls matched by email: <strong>{user.email}</strong>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard title="Total Months"   value={payrolls.length}       icon={Clock}       delay={0} />
        <SummaryCard title="Total Earned"   value={formatCurrency(totalNet)}  icon={DollarSign}  delay={0.05} />
        <SummaryCard title="Total Bonuses"  value={formatCurrency(totalBonus)} icon={TrendingUp}  delay={0.1} />
        <SummaryCard title="Paid Months"    value={paidCount}             icon={Clock}       delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-sm mb-4">Payslip History</h3>
        {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>}
        {!isLoading && payrolls.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No payroll records yet</p>}
        <div className="space-y-3">
          {payrolls.map(p => (
            <motion.div key={p.id} layout className="border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{p.month}</span>
                    <Badge className={cn('text-xs', p.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                      {p.payment_status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                    <div><span className="text-muted-foreground text-xs">Basic</span><p>{formatCurrency(p.basic_salary||0)}</p></div>
                    {(p.overtime_amount||0) > 0 && <div><span className="text-muted-foreground text-xs">OT</span><p className="text-emerald-600">+{formatCurrency(p.overtime_amount)}</p></div>}
                    {(p.bonus||0) > 0       && <div><span className="text-muted-foreground text-xs">Bonus</span><p className="text-emerald-600">+{formatCurrency(p.bonus)}</p></div>}
                    {(p.deductions||0) > 0  && <div><span className="text-muted-foreground text-xs">Deductions</span><p className="text-red-500">-{formatCurrency(p.deductions)}</p></div>}
                    <div><span className="text-muted-foreground text-xs">Days</span><p>{p.present_days}/{p.total_days}</p></div>
                    <div><span className="text-muted-foreground text-xs">Net</span><p className="font-bold text-primary">{formatCurrency(p.net_salary||0)}</p></div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5"
                    onClick={() => { try { printPayslip(p); } catch { toast.error('Print failed'); } }}>
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Button>
                  <Button size="sm" variant="outline" className="h-8"
                    onClick={() => { try { downloadPayslipPDF(p); } catch { toast.error('Download failed'); } }}>
                    PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
