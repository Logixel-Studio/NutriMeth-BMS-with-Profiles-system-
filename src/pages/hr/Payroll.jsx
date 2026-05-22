/**
 * HR Payroll — real auto-calculation from Supabase attendance + rules
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { usePayrollMonth, useGeneratePayroll, useMarkPayrollPaid } from '@/hooks/usePayroll';
import { useCurrency } from '@/lib/CurrencyContext';
import {
  DollarSign, Download, CheckCircle, Clock, Loader2,
  RefreshCw, AlertCircle, Play, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_STYLES = {
  paid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function generatePayslipPDF(row, formatCurrency) {
  const doc = new jsPDF();
  const name = row.user_profiles?.full_name || 'Employee';
  const monthName = MONTHS[(row.month || 1) - 1];
  doc.setFontSize(18);
  doc.text('NUTRIMETH BMS — Payslip', 20, 20);
  doc.setFontSize(12);
  doc.text(`Employee: ${name}`, 20, 35);
  doc.text(`Period: ${monthName} ${row.year}`, 20, 43);
  doc.text(`Department: ${row.user_profiles?.department || '—'}`, 20, 51);
  doc.line(20, 58, 190, 58);
  const items = [
    ['Base Salary', formatCurrency(row.base_salary)],
    ['Working Days', `${row.present_days} / ${row.working_days}`],
    ['Late Minutes', `${row.late_minutes || 0} min`],
    ['Late Deduction', `- ${formatCurrency(row.late_deduction || 0)}`],
    ['Absent Deduction', `- ${formatCurrency(row.absent_deduction || 0)}`],
    ['Overtime Hours', `${row.overtime_hours?.toFixed(1) || 0} h`],
    ['Overtime Pay', `+ ${formatCurrency(row.overtime_pay || 0)}`],
    ['NET SALARY', formatCurrency(row.net_salary)],
  ];
  let y = 68;
  items.forEach(([label, val]) => {
    doc.text(label, 25, y);
    doc.text(val, 140, y, { align: 'right' });
    y += 10;
  });
  doc.text(`Status: ${(row.status || 'pending').toUpperCase()}`, 25, y + 5);
  doc.save(`Payslip_${name.replace(/\s+/g, '_')}_${monthName}_${row.year}.pdf`);
}

export default function Payroll() {
  const { formatCurrency } = useCurrency();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const { data: payrolls = [], isLoading } = usePayrollMonth(parseInt(year), parseInt(month));
  const generate = useGeneratePayroll();
  const markPaid = useMarkPayrollPaid();

  const totalPayroll = payrolls.reduce((s, r) => s + (r.net_salary || 0), 0);
  const paidCount = payrolls.filter(r => r.status === 'paid').length;
  const pendingCount = payrolls.filter(r => r.status === 'pending').length;
  const totalOT = payrolls.reduce((s, r) => s + (r.overtime_pay || 0), 0);

  return (
    <div>
      <PageHeader title="Payroll Management" description="Auto-calculated payroll from real attendance data">
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{['2024','2025','2026'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => generate.mutate({ year: parseInt(year), month: parseInt(month) })}
            disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Generate
          </Button>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Payroll', value: formatCurrency(totalPayroll), icon: DollarSign, c: 'text-primary' },
          { label: 'Paid', value: String(paidCount), icon: CheckCircle, c: 'text-emerald-500' },
          { label: 'Pending', value: String(pendingCount), icon: Clock, c: 'text-amber-500' },
          { label: 'Overtime Pay', value: formatCurrency(totalOT), icon: AlertCircle, c: 'text-blue-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.c}`} />
            <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </motion.div>
        ))}
      </div>

      {payrolls.length === 0 && !isLoading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No payroll generated yet</p>
          <p className="text-sm text-muted-foreground mb-4">Click "Generate" to auto-calculate salaries from attendance data</p>
          <Button onClick={() => generate.mutate({ year: parseInt(year), month: parseInt(month) })} disabled={generate.isPending}>
            {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Generate Payroll for {MONTHS[parseInt(month) - 1]} {year}
          </Button>
        </div>
      )}

      {payrolls.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Salary Sheet — {MONTHS[parseInt(month) - 1]} {year}</h3>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {['Employee','Dept','Base','Present','Late','OT','Deductions','Net','Status',''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrolls.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t border-border hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{row.user_profiles?.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{row.user_profiles?.role?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{row.user_profiles?.department || '—'}</td>
                    <td className="py-3 px-4">{formatCurrency(row.base_salary)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.present_days}/{row.working_days}d</td>
                    <td className="py-3 px-4">
                      {row.late_minutes > 0 ? (
                        <span className="text-amber-500 text-xs">{row.late_minutes}m</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 text-xs">
                      {row.overtime_hours > 0 ? `+${formatCurrency(row.overtime_pay)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-red-500 text-xs">
                      {row.total_deductions > 0 ? `-${formatCurrency(row.total_deductions)}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{formatCurrency(row.net_salary)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[row.status] || STATUS_STYLES.pending}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {row.status === 'pending' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => markPaid.mutate({ id: row.id, year: parseInt(year), month: parseInt(month) })}
                            disabled={markPaid.isPending}>
                            Pay
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => generatePayslipPDF(row, formatCurrency)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
