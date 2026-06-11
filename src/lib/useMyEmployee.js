/**
 * useMyEmployee — resolves the current auth user → employees table row
 * Uses: email match (primary), full_name match (fallback), auth_user_id match (future)
 * 
 * This is the SINGLE source of truth for employee identity across all
 * self-service pages: MyAttendance, MyTasks, MyPayroll, MyLeaves, EmployeeDashboard
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

export function useMyEmployee() {
  const user = useCurrentUser();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    staleTime: 30_000,
    enabled: !!user,
  });

  const myEmployee = useMemo(() => {
    if (!user || !employees.length) return null;

    // 1. Email match (most reliable — sync with auth)
    let emp = employees.find(e => e.email?.toLowerCase() === user.email?.toLowerCase());
    if (emp) return emp;

    // 2. auth_user_id match (if admin linked the employee to auth user)
    emp = employees.find(e => e.auth_user_id === user.id);
    if (emp) return emp;

    // 3. Full name fallback
    emp = employees.find(e =>
      e.full_name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
    );
    return emp || null;
  }, [user, employees]);

  return { myEmployee, isLoading, user };
}
