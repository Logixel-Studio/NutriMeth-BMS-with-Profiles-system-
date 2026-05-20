import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRole, ROLES, ROLE_LABELS, ROLE_COLORS } from '@/lib/RoleContext';
import {
  LayoutDashboard, Users, Truck, ShoppingCart, Receipt,
  Package, TrendingUp, CreditCard, Settings, UserCircle,
  ChevronLeft, ChevronRight, Leaf, Warehouse, X, UsersRound,
  Shield, Building2, MapPin, Clock, FileText, DollarSign,
  BarChart3, Target, ClipboardList, UserCheck, Briefcase,
  GanttChartSquare, AlertTriangle, Activity, Database,
  Globe, Lock, Server, PieChart, CalendarDays, Award,
  CheckSquare, Navigation, Star, LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const NAV_BY_ROLE = {
  super_admin: {
    main: [
      { path: '/superadmin', label: 'Global Dashboard', icon: LayoutDashboard },
      { path: '/superadmin/companies', label: 'Companies', icon: Building2 },
      { path: '/superadmin/users', label: 'User Management', icon: Users },
      { path: '/superadmin/roles', label: 'Roles & Permissions', icon: Lock },
      { path: '/superadmin/analytics', label: 'System Analytics', icon: BarChart3 },
      { path: '/superadmin/audit', label: 'Audit Logs', icon: FileText },
      { path: '/superadmin/security', label: 'Security Logs', icon: Shield },
      { path: '/superadmin/monitoring', label: 'Realtime Monitor', icon: Activity },
      { path: '/superadmin/database', label: 'Database Health', icon: Database },
      { path: '/superadmin/backups', label: 'Backup Controls', icon: Server },
    ],
    bottom: [
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  admin: {
    main: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/clients', label: 'Clients', icon: Users },
      { path: '/suppliers', label: 'Suppliers', icon: Truck },
      { path: '/purchasing', label: 'Purchasing', icon: ShoppingCart },
      { path: '/expenses', label: 'Expenses', icon: Receipt },
      { path: '/products', label: 'Products', icon: Package },
      { path: '/sales', label: 'Sales', icon: TrendingUp },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/stock', label: 'Stock', icon: Warehouse },
      { path: '/admin/attendance', label: 'Attendance', icon: Clock },
      { path: '/admin/payroll', label: 'Payroll', icon: DollarSign },
      { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    ],
    bottom: [
      { path: '/team', label: 'Team', icon: UsersRound },
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  manager: {
    main: [
      { path: '/manager', label: 'Team Dashboard', icon: LayoutDashboard },
      { path: '/manager/attendance', label: 'Team Attendance', icon: Clock },
      { path: '/manager/tasks', label: 'Team Tasks', icon: CheckSquare },
      { path: '/manager/performance', label: 'Performance', icon: Target },
      { path: '/manager/projects', label: 'Projects', icon: GanttChartSquare },
      { path: '/manager/approvals', label: 'Approvals', icon: UserCheck },
      { path: '/manager/reports', label: 'Reports', icon: BarChart3 },
    ],
    bottom: [
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  hr: {
    main: [
      { path: '/hr', label: 'HR Dashboard', icon: LayoutDashboard },
      { path: '/hr/employees', label: 'Employees', icon: Users },
      { path: '/hr/attendance', label: 'Attendance', icon: Clock },
      { path: '/hr/gps-attendance', label: 'GPS Attendance', icon: Navigation },
      { path: '/hr/leaves', label: 'Leave Requests', icon: CalendarDays },
      { path: '/hr/payroll', label: 'Payroll', icon: DollarSign },
      { path: '/hr/salary', label: 'Salary Structures', icon: CreditCard },
      { path: '/hr/hiring', label: 'Hiring', icon: Briefcase },
      { path: '/hr/performance', label: 'Performance', icon: Award },
      { path: '/hr/shifts', label: 'Shifts', icon: Clock },
      { path: '/hr/documents', label: 'Documents', icon: FileText },
      { path: '/hr/reports', label: 'HR Reports', icon: BarChart3 },
    ],
    bottom: [
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  accountant: {
    main: [
      { path: '/accountant', label: 'Financial Dashboard', icon: LayoutDashboard },
      { path: '/payments', label: 'Sales Payments', icon: CreditCard },
      { path: '/purchasing', label: 'Supplier Payments', icon: Truck },
      { path: '/expenses', label: 'Expenses', icon: Receipt },
      { path: '/accountant/payroll', label: 'Payroll Payments', icon: DollarSign },
      { path: '/accountant/taxes', label: 'Taxes', icon: FileText },
      { path: '/accountant/pnl', label: 'Profit & Loss', icon: PieChart },
      { path: '/accountant/reports', label: 'Financial Reports', icon: BarChart3 },
    ],
    bottom: [
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  inventory_manager: {
    main: [
      { path: '/inventory', label: 'Stock Dashboard', icon: LayoutDashboard },
      { path: '/products', label: 'Products', icon: Package },
      { path: '/stock', label: 'Inventory', icon: Warehouse },
      { path: '/inventory/warehouses', label: 'Warehouses', icon: Building2 },
      { path: '/inventory/alerts', label: 'Low Stock Alerts', icon: AlertTriangle },
      { path: '/inventory/movement', label: 'Stock Movement', icon: Activity },
      { path: '/inventory/barcodes', label: 'Barcodes & SKU', icon: ClipboardList },
      { path: '/purchasing', label: 'Purchases', icon: ShoppingCart },
      { path: '/inventory/reports', label: 'Reports', icon: BarChart3 },
    ],
    bottom: [
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  sales_manager: {
    main: [
      { path: '/salesmanager', label: 'Sales Dashboard', icon: LayoutDashboard },
      { path: '/clients', label: 'Clients', icon: Users },
      { path: '/sales', label: 'Sales', icon: TrendingUp },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/salesmanager/targets', label: 'Sales Targets', icon: Target },
      { path: '/salesmanager/reports', label: 'Sales Reports', icon: BarChart3 },
    ],
    bottom: [
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
  employee: {
    main: [
      { path: '/employee', label: 'My Dashboard', icon: LayoutDashboard },
      { path: '/employee/attendance', label: 'GPS Attendance', icon: Navigation },
      { path: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
      { path: '/employee/leaves', label: 'Leave Requests', icon: CalendarDays },
      { path: '/employee/salary', label: 'Salary Details', icon: DollarSign },
      { path: '/employee/performance', label: 'Performance', icon: Award },
      { path: '/employee/timeline', label: 'Activity Timeline', icon: Activity },
    ],
    bottom: [
      { path: '/profile', label: 'Profile', icon: UserCircle },
    ]
  },
};

function NavLink({ item, collapsed, isMobile, onClose }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
  return (
    <Link key={item.path} to={item.path} onClick={isMobile ? onClose : undefined}>
      <motion.div
        whileHover={{ x: 2 }}
        title={collapsed && !isMobile ? item.label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
          collapsed && !isMobile ? 'justify-center' : '',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? '' : 'group-hover:text-sidebar-primary')} />
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}

export default function Sidebar({ collapsed, setCollapsed, isMobile = false, onClose }) {
  const { userRole, isLoadingRole } = useRole();
  const { logout, displayName } = useAuth();

  const nav = NAV_BY_ROLE[userRole] || NAV_BY_ROLE['employee'];
  const mainItems = nav.main || [];
  const bottomItems = nav.bottom || [];
  const roleLabel = ROLE_LABELS[userRole] || 'Employee';

  return (
    <motion.aside
      animate={{ width: collapsed && !isMobile ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
      style={{ minWidth: collapsed && !isMobile ? 72 : 260 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden"
              >
                NUTRIMETH
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {isMobile && (
          <button onClick={onClose} className="text-sidebar-foreground hover:text-sidebar-primary flex-shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User + Role Badge */}
      <AnimatePresence>
        {(!collapsed || isMobile) && !isLoadingRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 py-2.5 border-b border-sidebar-border flex-shrink-0"
          >
            <div className="flex items-center gap-2.5 bg-sidebar-accent rounded-lg px-2.5 py-2">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-4 h-4 text-sidebar-primary" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-sidebar-foreground truncate leading-tight">{displayName}</p>
                <p className="text-[10px] font-bold text-sidebar-primary uppercase tracking-wide">{roleLabel}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {mainItems.map(item => (
          <NavLink key={item.path} item={item} collapsed={collapsed} isMobile={isMobile} onClose={onClose} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-2 px-2 space-y-0.5 border-t border-sidebar-border flex-shrink-0">
        {bottomItems.map(item => (
          <NavLink key={item.path} item={item} collapsed={collapsed} isMobile={isMobile} onClose={onClose} />
        ))}
        <motion.button
          whileHover={{ x: 2 }}
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sidebar-foreground hover:bg-red-500/10 hover:text-red-400',
            collapsed && !isMobile ? 'justify-center' : ''
          )}
          title={collapsed && !isMobile ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Collapse Toggle */}
      {!isMobile && (
        <div className="p-3 border-t border-sidebar-border flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      )}
    </motion.aside>
  );
}
