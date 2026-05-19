import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { DollarSign, Download, CheckCircle, Clock, AlertCircle, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/CurrencyContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const EMPLOYEES = [
  { id: 1, name: 'Ahmed Khan', role: 'Sales Manager', baseSalary: 85000, attendanceDays: 22, totalDays: 22, overtime: 5, leaveDays: 0, status: 'paid' },
  { id: 2, name: 'Sara Ali', role: 'HR Manager', baseSalary: 75000, attendanceDays: 21, totalDays: 22, overtime: 2, leaveDays: 1, status: 'pending' },
  { id: 3, name: 'Bilal Raza', role: 'Accountant', baseSalary: 65000, attendanceDays: 20, totalDays: 22, overtime: 0, leaveDays: 2, status: 'pending' },
  { id: 4, name: 'Fatima Noor', role: 'Inventory Manager', baseSalary: 70000, attendanceDays: 22, totalDays: 22, overtime: 8, leaveDays: 0, status: 'paid' },
  { id: 5, name: 'Usman Tariq', role: 'Employee', baseSalary: 45000, attendanceDays: 19, totalDays: 22, overtime: 3, leaveDays: 3, status: 'pending' },
];

function calcSalary(emp) {
  const perDay = emp.baseSalary / emp.totalDays;
  const lateDed = emp.leaveDays * perDay;
  const overtimePay = emp.overtime * (perDay / 8) * 1.5;
  return Math.round(emp.baseSalary - lateDed + overtimePay);
}

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function Payroll() {
  const { formatCurrency } = useCurrency();
  const [month, setMonth] = useState('May');
  const [year, setYear] = useState('2026');
  const [employees, setEmployees] = useState(EMPLOYEES);

  const totalPayroll = employees.reduce((s, e) => s + calcSalary(e), 0);
  const paidCount = employees.filter(e => e.status === 'paid').length;
  const pendingCount = employees.filter(e => e.status === 'pending').length;

  const markPaid = (id) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: 'paid' } : e));
    toast.success('Salary marked as paid');
  };
  const processAll = () => {
    setEmployees(prev => prev.map(e => ({ ...e, status: 'paid' })));
    toast.success('All salaries processed!');
  };

  return (
    <div>
      <PageHeader title="Payroll Management" description="Process and manage employee salaries">
        <div className="flex items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{['2025','2026'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={processAll} disabled={pendingCount === 0}>
            <CheckCircle className="w-4 h-4 mr-2" /> Process All
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Payroll', value: formatCurrency(totalPayroll), icon: DollarSign, color: 'text-primary' },
          { label: 'Processed', value: String(paidCount), icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Pending', value: String(pendingCount), icon: Clock, color: 'text-amber-500' },
          { label: 'Employees', value: String(employees.length), icon: AlertCircle, color: 'text-blue-500' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <c.icon className={`w-8 h-8 ${c.color}`} />
            <div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payroll Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Salary Sheet — {month} {year}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Employee</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Base Salary</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Attendance</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Overtime</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Deductions</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Net Salary</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const net = calcSalary(emp);
                const deduction = emp.baseSalary - net + Math.round(emp.overtime * (emp.baseSalary / emp.totalDays / 8) * 1.5);
                const overtimePay = Math.round(emp.overtime * (emp.baseSalary / emp.totalDays / 8) * 1.5);
                return (
                  <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.role}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{formatCurrency(emp.baseSalary)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{emp.attendanceDays}/{emp.totalDays} days</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">+{formatCurrency(overtimePay)}</td>
                    <td className="py-3 px-4 text-red-500">
                      {emp.leaveDays > 0 ? `-${formatCurrency(Math.round(emp.leaveDays * emp.baseSalary / emp.totalDays))}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{formatCurrency(net)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[emp.status]}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {emp.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(emp.id)}>Pay</Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
