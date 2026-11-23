'use client';

import { useAuth } from '@/lib/auth';
import { navForRole, roleLabel } from '@/lib/navigation';
import type { UserRole } from '@/lib/api';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import styles from './shell.module.css';

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const role = user.role as UserRole;
  const nav = navForRole(role);

  return (
    <div className={styles.shell}>
      <Sidebar
        nav={nav}
        roleLabel={roleLabel(role)}
        userName={user.displayName}
        userEmail={user.email}
        onLogout={logout}
      />
      <div className={styles.main}>
        <TopBar title={title} subtitle={subtitle} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}