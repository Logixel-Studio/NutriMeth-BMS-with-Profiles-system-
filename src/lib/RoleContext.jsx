import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

const RoleContext = createContext();

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  HR: 'hr',
  ACCOUNTANT: 'accountant',
  INVENTORY_MANAGER: 'inventory_manager',
  SALES_MANAGER: 'sales_manager',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  hr: 'HR Manager',
  accountant: 'Accountant',
  inventory_manager: 'Inventory Manager',
  sales_manager: 'Sales Manager',
  employee: 'Employee',
};

export const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  hr: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  accountant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  inventory_manager: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  sales_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  employee: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export const RoleProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user?.id) {
      setUserRole(null);
      setIsLoadingRole(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('role, department, employee_id')
        .eq('id', user.id)
        .single();
      setUserRole(data?.role || ROLES.EMPLOYEE);
    } catch {
      setUserRole(ROLES.EMPLOYEE);
    } finally {
      setIsLoadingRole(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const hasRole = useCallback((...roles) => {
    return roles.includes(userRole);
  }, [userRole]);

  const canAccess = useCallback((feature) => {
    const permissions = {
      [ROLES.SUPER_ADMIN]: ['*'],
      [ROLES.ADMIN]: ['dashboard', 'clients', 'suppliers', 'purchases', 'expenses', 'products', 'sales', 'payments', 'stock', 'team', 'settings', 'reports', 'attendance', 'payroll'],
      [ROLES.MANAGER]: ['dashboard', 'team', 'attendance', 'tasks', 'reports'],
      [ROLES.HR]: ['employees', 'attendance', 'leaves', 'payroll', 'hiring', 'performance', 'reports'],
      [ROLES.ACCOUNTANT]: ['dashboard', 'payments', 'expenses', 'payroll', 'reports', 'taxes'],
      [ROLES.INVENTORY_MANAGER]: ['products', 'stock', 'purchases', 'reports'],
      [ROLES.SALES_MANAGER]: ['clients', 'sales', 'payments', 'reports'],
      [ROLES.EMPLOYEE]: ['dashboard', 'attendance', 'leaves', 'salary', 'tasks', 'profile'],
    };
    const rolePerms = permissions[userRole] || [];
    return rolePerms.includes('*') || rolePerms.includes(feature);
  }, [userRole]);

  const value = useMemo(() => ({
    userRole,
    isLoadingRole,
    hasRole,
    canAccess,
    refreshRole: fetchRole,
    isSuperAdmin: userRole === ROLES.SUPER_ADMIN,
    isAdmin: userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN,
    isManager: userRole === ROLES.MANAGER,
    isHR: userRole === ROLES.HR,
    isAccountant: userRole === ROLES.ACCOUNTANT,
    isInventoryManager: userRole === ROLES.INVENTORY_MANAGER,
    isSalesManager: userRole === ROLES.SALES_MANAGER,
    isEmployee: userRole === ROLES.EMPLOYEE,
  }), [userRole, isLoadingRole, hasRole, canAccess, fetchRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
};
