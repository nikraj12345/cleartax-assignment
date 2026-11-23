import {
  LayoutDashboard,
  MessageSquare,
  CreditCard,
  Ticket,
  ShieldCheck,
  BarChart3,
  Users,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from './api';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function homeForRole(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/student';
    case 'support_agent':
      return '/support';
    case 'finance_reviewer':
      return '/finance';
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
}

export function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    student: 'Student',
    support_agent: 'Support Lead',
    finance_reviewer: 'Finance Reviewer',
    admin: 'Administrator',
  };
  return map[role] ?? role;
}

export function navForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'student':
      return [
        { label: 'Overview', href: '/student', icon: LayoutDashboard },
        { label: 'Timetable', href: '/student/schedule', icon: Calendar },
        { label: 'Support chat', href: '/student/chat', icon: MessageSquare },
        { label: 'My tickets', href: '/student/tickets', icon: Ticket },
        { label: 'Payments', href: '/student/payments', icon: CreditCard },
      ];
    case 'support_agent':
      return [
        { label: 'Queue', href: '/support', icon: LayoutDashboard },
        { label: 'All tickets', href: '/support/tickets', icon: Ticket },
        { label: 'Payments', href: '/support/payments', icon: CreditCard },
      ];
    case 'finance_reviewer':
      return [
        { label: 'Overview', href: '/finance', icon: LayoutDashboard },
        { label: 'Refund approvals', href: '/finance/refunds', icon: ShieldCheck },
        { label: 'Transactions', href: '/finance/payments', icon: CreditCard },
      ];
    case 'admin':
      return [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Tickets', href: '/admin/tickets', icon: Ticket },
        { label: 'Refunds', href: '/finance/refunds', icon: ShieldCheck },
        { label: 'Transactions', href: '/admin/payments', icon: CreditCard },
        { label: 'Team', href: '/admin/team', icon: Users },
      ];
    default:
      return [];
  }
}