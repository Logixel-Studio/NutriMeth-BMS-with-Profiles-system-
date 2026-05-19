import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { RoleProvider } from '@/lib/RoleContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CurrencyProvider } from '@/lib/CurrencyContext';
import AuthPage from '@/pages/AuthPage';
import { useState, useEffect } from 'react';

import AppLayout from '@/components/layout/AppLayout';

// ── Existing pages (all preserved) ──────────────────────────────────────────
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import Suppliers from '@/pages/Suppliers';
import Purchasing from '@/pages/Purchasing';
import Expenses from '@/pages/Expenses';
import Products from '@/pages/Products';
import Sales from '@/pages/Sales';
import Payments from '@/pages/Payments';
import Stock from '@/pages/Stock';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Team from '@/pages/Team';

// ── Super Admin ──────────────────────────────────────────────────────────────
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import UserManagement from '@/pages/superadmin/UserManagement';
import AuditLogs from '@/pages/superadmin/AuditLogs';
import SystemMonitoring from '@/pages/superadmin/SystemMonitoring';

// ── Admin ────────────────────────────────────────────────────────────────────
import AdminAttendance from '@/pages/admin/AdminAttendance';
import AdminPayroll from '@/pages/admin/AdminPayroll';
import AdminReports from '@/pages/admin/AdminReports';

// ── Manager ──────────────────────────────────────────────────────────────────
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import TaskManagement from '@/pages/manager/TaskManagement';

// ── HR ────────────────────────────────────────────────────────────────────────
import HRDashboard from '@/pages/hr/HRDashboard';
import GPSAttendance from '@/pages/hr/GPSAttendance';
import Payroll from '@/pages/hr/Payroll';
import LeaveManagement from '@/pages/hr/LeaveManagement';
import Hiring from '@/pages/hr/Hiring';

// ── Accountant ────────────────────────────────────────────────────────────────
import AccountantDashboard from '@/pages/accountant/AccountantDashboard';
import ProfitLoss from '@/pages/accountant/ProfitLoss';

// ── Inventory ─────────────────────────────────────────────────────────────────
import InventoryDashboard from '@/pages/inventory/InventoryDashboard';
import Warehouses from '@/pages/inventory/Warehouses';
import StockMovement from '@/pages/inventory/StockMovement';

// ── Sales Manager ─────────────────────────────────────────────────────────────
import SalesManagerDashboard from '@/pages/salesmanager/SalesManagerDashboard';
import SalesTargets from '@/pages/salesmanager/SalesTargets';

// ── Employee ──────────────────────────────────────────────────────────────────
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import EmployeeLeaves from '@/pages/employee/EmployeeLeaves';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const stillLoading = (isLoadingPublicSettings || isLoadingAuth) && !forceReady;

  if (stillLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading NUTRIMETH...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <RoleProvider>
      <Routes>
        <Route element={<AppLayout />}>
          {/* ── Existing Routes (all preserved) ── */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchasing" element={<Purchasing />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />

          {/* ── Super Admin Routes ── */}
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/users" element={<UserManagement />} />
          <Route path="/superadmin/audit" element={<AuditLogs />} />
          <Route path="/superadmin/monitoring" element={<SystemMonitoring />} />

          {/* ── Admin Routes ── */}
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/payroll" element={<AdminPayroll />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          {/* ── Manager Routes ── */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/tasks" element={<TaskManagement />} />
          <Route path="/manager/attendance" element={<AdminAttendance />} />
          <Route path="/manager/performance" element={<ManagerDashboard />} />
          <Route path="/manager/projects" element={<TaskManagement />} />
          <Route path="/manager/approvals" element={<LeaveManagement />} />
          <Route path="/manager/reports" element={<AdminReports />} />

          {/* ── HR Routes ── */}
          <Route path="/hr" element={<HRDashboard />} />
          <Route path="/hr/employees" element={<UserManagement />} />
          <Route path="/hr/attendance" element={<AdminAttendance />} />
          <Route path="/hr/gps-attendance" element={<GPSAttendance />} />
          <Route path="/hr/leaves" element={<LeaveManagement />} />
          <Route path="/hr/payroll" element={<Payroll />} />
          <Route path="/hr/salary" element={<Payroll />} />
          <Route path="/hr/hiring" element={<Hiring />} />
          <Route path="/hr/performance" element={<ManagerDashboard />} />
          <Route path="/hr/shifts" element={<AdminAttendance />} />
          <Route path="/hr/documents" element={<AuditLogs />} />
          <Route path="/hr/reports" element={<AdminReports />} />

          {/* ── Accountant Routes ── */}
          <Route path="/accountant" element={<AccountantDashboard />} />
          <Route path="/accountant/payroll" element={<Payroll />} />
          <Route path="/accountant/taxes" element={<AdminReports />} />
          <Route path="/accountant/pnl" element={<ProfitLoss />} />
          <Route path="/accountant/reports" element={<AdminReports />} />

          {/* ── Inventory Routes ── */}
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/inventory/warehouses" element={<Warehouses />} />
          <Route path="/inventory/movement" element={<StockMovement />} />
          <Route path="/inventory/alerts" element={<InventoryDashboard />} />
          <Route path="/inventory/barcodes" element={<InventoryDashboard />} />
          <Route path="/inventory/reports" element={<AdminReports />} />

          {/* ── Sales Manager Routes ── */}
          <Route path="/salesmanager" element={<SalesManagerDashboard />} />
          <Route path="/salesmanager/targets" element={<SalesTargets />} />
          <Route path="/salesmanager/reports" element={<AdminReports />} />

          {/* ── Employee Routes ── */}
          <Route path="/employee" element={<EmployeeDashboard />} />
          <Route path="/employee/attendance" element={<GPSAttendance />} />
          <Route path="/employee/tasks" element={<TaskManagement />} />
          <Route path="/employee/leaves" element={<EmployeeLeaves />} />
          <Route path="/employee/salary" element={<Payroll />} />
          <Route path="/employee/performance" element={<ManagerDashboard />} />
          <Route path="/employee/timeline" element={<AuditLogs />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </RoleProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CurrencyProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </CurrencyProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
